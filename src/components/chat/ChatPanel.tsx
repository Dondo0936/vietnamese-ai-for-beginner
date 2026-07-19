"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Markdown from "react-markdown";
import { X, Send, Loader2, LogIn } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useAuth } from "@/lib/auth-context";
import { ensureAnonSession } from "@/lib/database";
import AuthModal from "@/components/auth/AuthModal";

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
}

interface RelatedTopic {
  slug: string;
  title: string;
  titleVi: string;
}

const MAX_INPUT_LENGTH = 2000;

const MARKDOWN_COMPONENTS = {
  p: (props: React.ComponentProps<"p">) => (
    <p className="mb-1.5 last:mb-0" {...props} />
  ),
  ul: (props: React.ComponentProps<"ul">) => (
    <ul className="mb-1.5 list-disc space-y-0.5 pl-4 last:mb-0" {...props} />
  ),
  ol: (props: React.ComponentProps<"ol">) => (
    <ol
      className="mb-1.5 list-decimal space-y-0.5 pl-4 last:mb-0"
      {...props}
    />
  ),
  a: ({ children, ...props }: React.ComponentProps<"a">) => (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent underline"
      {...props}
    >
      {children}
    </a>
  ),
  code: (props: React.ComponentProps<"code">) => (
    <code
      className="rounded bg-foreground/10 px-1 py-0.5 text-[12px] font-mono"
      {...props}
    />
  ),
};

function extractText(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

function extractRelatedTopics(message: UIMessage): RelatedTopic[] {
  const part = message.parts.find((p) => p.type === "data-relatedTopics");
  const data = (part as { data?: unknown } | undefined)?.data;
  return Array.isArray(data) ? (data as RelatedTopic[]) : [];
}

/**
 * Fetches history before mounting the useChat-backed inner panel — useChat's
 * `messages` option only seeds initial state once at mount, so we can't
 * hydrate history by updating it later without a full remount per open.
 */
export default function ChatPanel({ open, onClose }: ChatPanelProps) {
  const [mounted, setMounted] = useState(false);
  const [initialMessages, setInitialMessages] = useState<UIMessage[] | null>(
    null
  );

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setInitialMessages(null);
    fetch("/api/chat")
      .then((r) => r.json())
      .then((data) => setInitialMessages(data.messages ?? []))
      .catch(() => setInitialMessages([]));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      {/* Invisible click-outside-to-close catcher — no dimming/blur, chat
          floats over the page like a docked panel rather than a modal. */}
      <div onClick={onClose} className="absolute inset-0" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-panel-title"
        className="fixed inset-x-0 bottom-0 z-[101] flex h-[85vh] flex-col rounded-t-[var(--r-xl)] border border-border bg-card shadow-lg md:inset-x-auto md:bottom-24 md:right-6 md:h-[600px] md:max-h-[80vh] md:w-[400px] md:rounded-[var(--r-xl)]"
      >
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h2
              id="chat-panel-title"
              className="font-display text-[15px] font-medium tracking-[-0.01em] text-foreground"
            >
              Trợ lý AI udemi
            </h2>
            <p className="text-[11px] text-tertiary">
              Hỏi về các chủ đề AI/ML trên udemi.tech
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-[var(--r-md)] p-1.5 text-tertiary transition-colors hover:bg-surface hover:text-foreground"
          >
            <X size={18} />
          </button>
        </header>

        {initialMessages === null ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 size={22} className="animate-spin text-tertiary" />
          </div>
        ) : (
          <ChatPanelInner initialMessages={initialMessages} />
        )}
      </div>
    </div>,
    document.body
  );
}

function ChatPanelInner({
  initialMessages,
}: {
  initialMessages: UIMessage[];
}) {
  const { user, isAuthenticated } = useAuth();
  const [input, setInput] = useState("");
  const [loginRequired, setLoginRequired] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [genericError, setGenericError] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const ensuredSessionRef = useRef(!!user);
  const listRef = useRef<HTMLDivElement>(null);

  const transport = useState(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ id, messages }) => ({
          body: { id, message: messages[messages.length - 1] },
        }),
      })
  )[0];

  const { messages, sendMessage, status } = useChat({
    messages: initialMessages,
    transport,
    onError: (err) => {
      let code = "";
      try {
        code = JSON.parse(err.message)?.error ?? "";
      } catch {
        // Non-JSON error body (network failure, etc.) — fall through.
      }
      if (code === "login_required") {
        setLoginRequired(true);
      } else if (code === "rate_limited") {
        setRateLimited(true);
      } else {
        setGenericError("Đã có lỗi xảy ra. Vui lòng thử lại.");
      }
    },
  });

  useEffect(() => {
    if (isAuthenticated && loginRequired) {
      setLoginRequired(false);
      setAuthModalOpen(false);
    }
  }, [isAuthenticated, loginRequired]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const busy = status === "submitted" || status === "streaming";

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || busy || loginRequired) return;

    setGenericError(null);
    setSessionError(false);
    setInput("");

    if (!ensuredSessionRef.current) {
      const supabase = await ensureAnonSession();
      if (!supabase) {
        setSessionError(true);
        setInput(trimmed);
        return;
      }
      ensuredSessionRef.current = true;
    }

    sendMessage({ text: trimmed });
  }

  return (
    <>
      <div ref={listRef} className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="py-8 text-center text-[13px] text-tertiary">
            Hỏi mình bất cứ điều gì về AI/ML trong chương trình học nhé!
          </p>
        )}
        {messages.map((m) => {
          const relatedTopics =
            m.role === "assistant" ? extractRelatedTopics(m) : [];
          return (
            <div key={m.id}>
              <div
                className={`my-1.5 max-w-[85%] rounded-[var(--r-lg)] px-3 py-2 text-[13px] leading-relaxed ${
                  m.role === "user"
                    ? "ml-auto bg-accent text-white"
                    : "bg-surface text-foreground"
                }`}
              >
                {m.role === "assistant" ? (
                  <Markdown components={MARKDOWN_COMPONENTS}>
                    {extractText(m)}
                  </Markdown>
                ) : (
                  extractText(m)
                )}
              </div>
              {relatedTopics.length > 0 && (
                <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
                  {relatedTopics.map((t) => (
                    <a
                      key={t.slug}
                      href={`/topics/${t.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 whitespace-nowrap rounded-[var(--r-md)] border border-border bg-background px-2.5 py-1 text-[11px] text-muted transition-colors hover:border-accent hover:text-accent"
                    >
                      {t.titleVi || t.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {status === "submitted" && (
          <div className="my-1.5 flex max-w-[85%] items-center gap-1 rounded-[var(--r-lg)] bg-surface px-3 py-2 text-tertiary">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:300ms]" />
          </div>
        )}
      </div>

      {rateLimited && (
        <div className="mx-4 mb-2 rounded-[var(--r-md)] border border-border bg-surface px-3 py-2 text-[11px] text-muted">
          Bạn đã đạt giới hạn hỏi hôm nay. Vui lòng thử lại sau.
        </div>
      )}
      {genericError && (
        <div
          role="alert"
          className="mx-4 mb-2 rounded-[var(--r-md)] border border-danger/30 bg-[rgba(242,92,84,0.08)] px-3 py-2 text-[11px] text-[rgb(178,49,41)] dark:text-[rgb(244,140,130)]"
        >
          {genericError}
        </div>
      )}
      {sessionError && (
        <div
          role="alert"
          className="mx-4 mb-2 rounded-[var(--r-md)] border border-danger/30 bg-[rgba(242,92,84,0.08)] px-3 py-2 text-[11px] text-[rgb(178,49,41)] dark:text-[rgb(244,140,130)]"
        >
          Không thể bắt đầu phiên trò chuyện. Vui lòng thử lại.
        </div>
      )}

      {loginRequired ? (
        <div className="border-t border-border px-4 py-3">
          <p className="mb-2 text-[12px] text-muted">
            Bạn đã dùng hết lượt hỏi miễn phí. Đăng nhập để tiếp tục trò
            chuyện.
          </p>
          <button
            type="button"
            onClick={() => setAuthModalOpen(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[var(--r-md)] bg-accent px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[var(--accent-dark)]"
          >
            <LogIn size={14} />
            Đăng nhập
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSend}
          className="flex items-end gap-2 border-t border-border px-3 py-3"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            maxLength={MAX_INPUT_LENGTH}
            rows={1}
            placeholder="Nhập câu hỏi của bạn..."
            disabled={busy}
            className="max-h-24 flex-1 resize-none rounded-[var(--r-md)] border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-[var(--ring)] disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            aria-label="Gửi"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--r-md)] bg-accent text-white transition-all hover:bg-[var(--accent-dark)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Send size={15} />
            )}
          </button>
        </form>
      )}

      {authModalOpen && (
        <AuthModal
          open={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          defaultTab="signin"
        />
      )}
    </>
  );
}
