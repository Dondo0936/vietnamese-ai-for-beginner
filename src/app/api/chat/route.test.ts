import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase-server", () => ({
  createServerClientWithCookies: vi.fn(),
  createServiceClient: vi.fn(),
}));
vi.mock("botid/server", () => ({ checkBotId: vi.fn() }));
vi.mock("@ai-sdk/groq", () => ({ groq: vi.fn(() => "mock-model") }));
vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();
  return { ...actual, streamText: vi.fn() };
});

import { POST, GET } from "./route";
import {
  createServerClientWithCookies,
  createServiceClient,
} from "@/lib/supabase-server";
import { checkBotId } from "botid/server";
import { streamText } from "ai";

const MOCK_USER = { id: "user-1", is_anonymous: true };

// Chainable query-builder stub: every method returns itself so any
// select/eq/order/limit chain works, and it resolves `result` when awaited
// (mirrors supabase-js's PromiseLike query builders).
function makeQueryBuilder(result: { data: unknown; error?: unknown }) {
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "eq", "order", "limit", "update"]) {
    builder[method] = vi.fn(() => builder);
  }
  builder.insert = vi.fn(() => Promise.resolve(result));
  builder.then = (
    resolve: (v: typeof result) => unknown,
    reject?: (e: unknown) => unknown
  ) => Promise.resolve(result).then(resolve, reject);
  return builder;
}

function makeUserClient(opts: {
  user?: typeof MOCK_USER | null;
  rpcResult?: { data: unknown; error?: unknown };
  historyResult?: { data: unknown; error?: unknown };
}) {
  const {
    user = MOCK_USER,
    rpcResult = { data: null, error: null },
    historyResult = { data: [], error: null },
  } = opts;
  return {
    auth: { getUser: vi.fn(async () => ({ data: { user } })) },
    rpc: vi.fn(async () => rpcResult),
    from: vi.fn(() => makeQueryBuilder(historyResult)),
  };
}

function makeServiceClient() {
  return {
    from: vi.fn(() => makeQueryBuilder({ data: null, error: null })),
  };
}

function chatRequest(body: unknown) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function userMessage(text: string) {
  return { id: "m1", role: "user", parts: [{ type: "text", text }] };
}

beforeEach(() => {
  vi.mocked(checkBotId).mockResolvedValue({ isBot: false } as never);
  vi.mocked(streamText).mockReset();
});

describe("POST /api/chat", () => {
  it("returns 429 when BotID flags the request as a bot", async () => {
    vi.mocked(checkBotId).mockResolvedValue({ isBot: true } as never);
    const res = await POST(chatRequest({ id: "c1", message: userMessage("Perceptron là gì?") }));
    expect(res.status).toBe(429);
    expect((await res.json()).error).toBe("bot_detected");
  });

  it("returns 400 for an empty message", async () => {
    const res = await POST(chatRequest({ id: "c1", message: userMessage("   ") }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("empty_message");
  });

  it("returns 400 for a message over the length cap", async () => {
    const res = await POST(
      chatRequest({ id: "c1", message: userMessage("a".repeat(2001)) })
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("message_too_long");
  });

  it("returns 401 when there is no authenticated user", async () => {
    vi.mocked(createServerClientWithCookies).mockResolvedValue(
      makeUserClient({ user: null }) as never
    );
    const res = await POST(chatRequest({ id: "c1", message: userMessage("Perceptron là gì?") }));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("auth_required");
  });

  it("returns 403 login_required when the anonymous turn cap is exceeded", async () => {
    vi.mocked(createServerClientWithCookies).mockResolvedValue(
      makeUserClient({
        rpcResult: { data: null, error: { message: "anon_cap_exceeded" } },
      }) as never
    );
    vi.mocked(createServiceClient).mockReturnValue(makeServiceClient() as never);
    const res = await POST(chatRequest({ id: "c1", message: userMessage("Perceptron là gì?") }));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("login_required");
  });

  it("returns 429 rate_limited when the signed-in daily cap is exceeded", async () => {
    vi.mocked(createServerClientWithCookies).mockResolvedValue(
      makeUserClient({
        rpcResult: { data: null, error: { message: "daily_cap_exceeded" } },
      }) as never
    );
    vi.mocked(createServiceClient).mockReturnValue(makeServiceClient() as never);
    const res = await POST(chatRequest({ id: "c1", message: userMessage("Perceptron là gì?") }));
    expect(res.status).toBe(429);
    expect((await res.json()).error).toBe("rate_limited");
  });

  it("never calls Groq for an off-topic message and persists the canned refusal", async () => {
    const service = makeServiceClient();
    vi.mocked(createServerClientWithCookies).mockResolvedValue(
      makeUserClient({
        rpcResult: {
          data: { id: "row-1", role: "user", content: "x", blocked: true },
          error: null,
        },
      }) as never
    );
    vi.mocked(createServiceClient).mockReturnValue(service as never);

    const res = await POST(
      chatRequest({ id: "c1", message: userMessage("thời tiết hôm nay thế nào") })
    );

    expect(res.status).toBe(200);
    expect(streamText).not.toHaveBeenCalled();
    expect(service.from).toHaveBeenCalledWith("chat_messages");
    const builder = service.from.mock.results[0].value;
    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ role: "assistant", blocked: true })
    );
  });

  it("calls Groq for an on-topic message", async () => {
    const service = makeServiceClient();
    vi.mocked(createServerClientWithCookies).mockResolvedValue(
      makeUserClient({
        rpcResult: {
          data: { id: "row-1", role: "user", content: "x", blocked: false },
          error: null,
        },
      }) as never
    );
    vi.mocked(createServiceClient).mockReturnValue(service as never);
    vi.mocked(streamText).mockReturnValue({
      stream: new ReadableStream({
        start(controller) {
          controller.close();
        },
      }),
    } as never);

    const res = await POST(
      chatRequest({ id: "c1", message: userMessage("Perceptron là gì?") })
    );

    expect(streamText).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });
});

describe("GET /api/chat", () => {
  it("returns an empty array when there is no session", async () => {
    vi.mocked(createServerClientWithCookies).mockResolvedValue(
      makeUserClient({ user: null }) as never
    );
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ messages: [] });
  });

  it("returns mapped history when a session exists", async () => {
    vi.mocked(createServerClientWithCookies).mockResolvedValue(
      makeUserClient({
        historyResult: {
          data: [
            { id: "1", role: "user", content: "hi", blocked: false, created_at: "t" },
          ],
          error: null,
        },
      }) as never
    );
    const res = await GET();
    const body = await res.json();
    expect(body.messages).toEqual([
      { id: "1", role: "user", parts: [{ type: "text", text: "hi" }] },
    ]);
  });
});
