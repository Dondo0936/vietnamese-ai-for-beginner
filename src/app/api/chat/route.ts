/**
 * POST /api/chat  — send a message, streams the assistant reply.
 * GET  /api/chat  — last 50 messages, used to hydrate the panel on open.
 *
 * Message flow (see docs/plans chatbot integration plan for full rationale):
 *   1. checkBotId()                                → 429 if bot.
 *   2. auth.getUser()                               → 401 if no session.
 *   3. Extract text from the client's newest message ONLY — the client
 *      never sends its own history (DefaultChatTransport's
 *      prepareSendMessagesRequest on the frontend strips it to
 *      { id, message: <newest> }), so there is nothing here for a caller
 *      to smuggle earlier off-topic/forged content through.
 *   4. classifyMessage() — deterministic (non-LLM) topic gate.
 *   5. chat_reserve_user_turn RPC — atomically enforces the anonymous
 *      2-turn cap / signed-in daily cap and inserts the row itself (role is
 *      hardcoded server-side; the client can never set it).
 *   6. If blocked: skip Groq entirely, stream the canned refusal.
 *      If not blocked: reload trusted context from chat_messages (never the
 *      client's array), call Groq, persist the reply via the service-role
 *      client (assistant rows are never client-writable — see the RLS
 *      migration).
 *
 * Runtime: default Node.js. Do NOT mark `edge`.
 */
import { NextResponse } from "next/server";
import { checkBotId } from "botid/server";
import {
  streamText,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { groq } from "@ai-sdk/groq";
import {
  createServerClientWithCookies,
  createServiceClient,
} from "@/lib/supabase-server";
import { classifyMessage, findRelatedTopics } from "@/lib/chat/guardrails";
import {
  buildSystemPrompt,
  CANNED_REFUSAL,
  CANNED_ERROR_APOLOGY,
} from "@/lib/chat/system-prompt";

export const maxDuration = 30;

const MAX_INPUT_LENGTH = 2000;
const CONTEXT_MESSAGE_LIMIT = 12;
const HISTORY_LIMIT = 50;
const ANON_TURN_CAP = 2;
const DAILY_TURN_CAP = 100;
const RELATED_TOPICS_LIMIT = 4;
// ~100 words of Vietnamese output; generous headroom since Vietnamese
// diacritics tokenize denser than English. Backstop for the system prompt's
// own length instruction, not the primary control.
const MAX_OUTPUT_TOKENS = 350;
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

interface RelatedTopicPayload {
  slug: string;
  title: string;
  titleVi: string;
}

interface ChatMessageRow {
  id: string;
  role: "user" | "assistant";
  content: string;
  blocked: boolean;
  created_at: string;
  related_topics?: RelatedTopicPayload[] | null;
}

function extractText(message: unknown): string {
  if (!message || typeof message !== "object" || !("parts" in message)) {
    return "";
  }
  const parts = (message as { parts?: unknown }).parts;
  if (!Array.isArray(parts)) return "";
  return parts
    .filter(
      (p): p is { type: "text"; text: string } =>
        !!p && typeof p === "object" && p.type === "text" && typeof p.text === "string"
    )
    .map((p) => p.text)
    .join("")
    .trim();
}

// Text-only — used to reconstruct trusted model context (never render
// history). Keeping this separate from rowToDisplayUIMessage means a
// data-relatedTopics part never has to flow through convertToModelMessages.
function rowToUIMessage(row: ChatMessageRow): UIMessage {
  return {
    id: row.id,
    role: row.role,
    parts: [{ type: "text", text: row.content }],
  };
}

// Used for GET /api/chat history hydration — includes the persisted
// data-relatedTopics part (if any) so the "related lessons" chips survive a
// panel close/reopen or a page reload, matching the live-stream shape.
function rowToDisplayUIMessage(row: ChatMessageRow): UIMessage {
  const parts: UIMessage["parts"] = [];
  if (row.related_topics && row.related_topics.length > 0) {
    parts.push({ type: "data-relatedTopics", data: row.related_topics });
  }
  parts.push({ type: "text", text: row.content });
  return { id: row.id, role: row.role, parts };
}

export async function POST(req: Request) {
  const verification = await checkBotId();
  if (verification.isBot) {
    return NextResponse.json({ error: "bot_detected" }, { status: 429 });
  }

  let body: { id?: string; message?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const text = extractText(body.message);
  if (!text) {
    return NextResponse.json({ error: "empty_message" }, { status: 400 });
  }
  if (text.length > MAX_INPUT_LENGTH) {
    return NextResponse.json({ error: "message_too_long" }, { status: 400 });
  }

  const userClient = await createServerClientWithCookies();
  if (!userClient) {
    return NextResponse.json({ error: "config" }, { status: 500 });
  }

  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  const { allowed } = classifyMessage(text);
  const blocked = !allowed;

  const { data: reservedRow, error: reserveError } = await userClient.rpc(
    "chat_reserve_user_turn",
    {
      p_content: text,
      p_blocked: blocked,
      p_anon_cap: ANON_TURN_CAP,
      p_daily_cap: DAILY_TURN_CAP,
    }
  );

  if (reserveError) {
    const msg = reserveError.message ?? "";
    if (msg.includes("anon_cap_exceeded")) {
      return NextResponse.json({ error: "login_required" }, { status: 403 });
    }
    if (msg.includes("daily_cap_exceeded")) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    if (msg.includes("not authenticated")) {
      return NextResponse.json({ error: "auth_required" }, { status: 401 });
    }
    return NextResponse.json({ error: "reserve_failed" }, { status: 500 });
  }

  const service = createServiceClient();
  if (!service) {
    return NextResponse.json({ error: "config" }, { status: 500 });
  }

  if (blocked) {
    // Off-topic: never reaches Groq. Marking blocked:true on the assistant
    // row too keeps this whole exchange out of future model context (see
    // the GET handler's unfiltered read vs. the context-load filter below).
    await service.from("chat_messages").insert({
      user_id: user.id,
      role: "assistant",
      content: CANNED_REFUSAL,
      blocked: true,
    });

    const stream = createUIMessageStream({
      execute({ writer }) {
        const id = crypto.randomUUID();
        writer.write({ type: "text-start", id });
        writer.write({ type: "text-delta", id, delta: CANNED_REFUSAL });
        writer.write({ type: "text-end", id });
      },
    });
    return createUIMessageStreamResponse({ stream });
  }

  // Trusted context reconstruction: loaded from our own DB, never the
  // client's array. Off-topic exchanges are excluded from what the model
  // sees (they still show up in GET /api/chat's full transcript).
  const { data: historyRows } = await userClient
    .from("chat_messages")
    .select("id, role, content, blocked, created_at")
    .eq("user_id", user.id)
    .eq("blocked", false)
    .order("created_at", { ascending: false })
    .limit(CONTEXT_MESSAGE_LIMIT);

  const trustedContext: UIMessage[] = (historyRows ?? [])
    .slice()
    .reverse()
    .map((r) => rowToUIMessage(r as ChatMessageRow));

  trustedContext.push({
    id: (reservedRow as ChatMessageRow).id,
    role: "user",
    parts: [{ type: "text", text }],
  });

  const result = streamText({
    model: groq(GROQ_MODEL),
    system: buildSystemPrompt(),
    messages: await convertToModelMessages(trustedContext),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    abortSignal: req.signal,
    onError: (event) => {
      console.error("[api/chat] groq stream error", event.error);
    },
  });

  const relatedTopics = findRelatedTopics(text, RELATED_TOPICS_LIMIT).map(
    (t) => ({ slug: t.slug, title: t.title, titleVi: t.titleVi })
  );

  const stream = createUIMessageStream({
    originalMessages: trustedContext,
    onError: () => CANNED_ERROR_APOLOGY,
    onEnd: async ({ responseMessage, isAborted }) => {
      if (isAborted) return;
      const replyText = extractText(responseMessage);
      if (!replyText) return;
      await service.from("chat_messages").insert({
        user_id: user.id,
        role: "assistant",
        content: replyText,
        blocked: false,
        related_topics: relatedTopics.length > 0 ? relatedTopics : null,
      });
    },
    execute({ writer }) {
      if (relatedTopics.length > 0) {
        writer.write({ type: "data-relatedTopics", data: relatedTopics });
      }
      writer.merge(
        toUIMessageStream({
          stream: result.stream,
          // Without this, a Groq stream error surfaces as the SDK's own
          // generic English default ("An error occurred.") instead of the
          // app's Vietnamese canned apology — the outer stream's onError
          // only covers errors from createUIMessageStream's own execute(),
          // not ones converted inside the merged inner stream.
          onError: () => CANNED_ERROR_APOLOGY,
        })
      );
    },
  });
  return createUIMessageStreamResponse({ stream });
}

export async function GET() {
  const userClient = await createServerClientWithCookies();
  if (!userClient) {
    return NextResponse.json({ error: "config" }, { status: 500 });
  }

  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) {
    // No session yet (visitor hasn't sent a first message) — empty history
    // is a normal state, not an error.
    return NextResponse.json({ messages: [] });
  }

  const { data: rows } = await userClient
    .from("chat_messages")
    .select("id, role, content, blocked, created_at, related_topics")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  const messages = (rows ?? [])
    .slice()
    .reverse()
    .map((r) => rowToDisplayUIMessage(r as ChatMessageRow));

  return NextResponse.json({ messages });
}
