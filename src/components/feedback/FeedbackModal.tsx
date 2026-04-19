"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Image as ImageIcon, Loader2, Check } from "lucide-react";
import {
  submitFeedback,
  clientSecondsUntilNext,
  MAX_IMAGES,
  ALLOWED_MIME,
  TITLE_MAX,
  DESC_MAX,
  type SubmitResult,
} from "@/lib/feedback";

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

type Status =
  | { state: "idle" }
  | { state: "submitting" }
  | { state: "success" }
  | { state: "error"; message: string; retryInSeconds?: number };

export default function FeedbackModal({ open, onClose }: FeedbackModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live countdown for the rate-limit "retry in X" banner.
  const [cooldown, setCooldown] = useState(0);

  // Reset the form whenever the modal reopens.
  useEffect(() => {
    if (!open) return;
    setCooldown(clientSecondsUntilNext());
  }, [open]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && status.state !== "submitting") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, status.state]);

  const previews = useMemo(
    () =>
      files.map((f) => ({
        name: f.name,
        size: f.size,
        url: URL.createObjectURL(f),
      })),
    [files]
  );

  // Revoke object URLs when previews or the modal change.
  useEffect(() => {
    return () => {
      for (const p of previews) URL.revokeObjectURL(p.url);
    };
  }, [previews]);

  function addFiles(newFiles: FileList | File[]) {
    const incoming = Array.from(newFiles).filter((f) =>
      ALLOWED_MIME.includes(f.type)
    );
    setFiles((prev) => {
      const merged = [...prev, ...incoming].slice(0, MAX_IMAGES);
      return merged;
    });
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status.state === "submitting") return;
    setStatus({ state: "submitting" });
    const result: SubmitResult = await submitFeedback({
      title,
      description,
      files,
      pageUrl: typeof window !== "undefined" ? window.location.href : "",
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : "",
    });

    if (result.ok) {
      setStatus({ state: "success" });
      setCooldown(clientSecondsUntilNext());
      // Auto-close after a beat so the user sees the checkmark.
      setTimeout(() => {
        setTitle("");
        setDescription("");
        setFiles([]);
        setStatus({ state: "idle" });
        onClose();
      }, 1400);
      return;
    }

    // Error branch — tailor the message per kind.
    if (result.kind === "rate_limited") {
      setCooldown(result.secondsRemaining);
      setStatus({
        state: "error",
        message: `Bạn vừa gửi góp ý gần đây. Vui lòng chờ ${result.secondsRemaining} giây trước khi gửi tiếp.`,
        retryInSeconds: result.secondsRemaining,
      });
    } else if (result.kind === "offline") {
      setStatus({
        state: "error",
        message: "Chưa kết nối được máy chủ. Vui lòng thử lại sau.",
      });
    } else if (result.kind === "auth_failed") {
      setStatus({
        state: "error",
        message: "Không xác thực được phiên của bạn. Vui lòng thử lại.",
      });
    } else if (result.kind === "upload_failed") {
      setStatus({
        state: "error",
        message: `Không tải được ảnh lên: ${result.message}`,
      });
    } else if (result.kind === "insert_failed") {
      setStatus({
        state: "error",
        message: `Không gửi được góp ý: ${result.message}`,
      });
    } else {
      setStatus({ state: "error", message: result.message });
    }
  }

  // Lock background scroll while open. Without this, mouse-wheel scrolls the
  // page behind the modal, which feels broken once body content extends past
  // the viewport (hero → lesson pages).
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  const isSubmitting = status.state === "submitting";
  const titleValid = title.trim().length >= 3 && title.length <= TITLE_MAX;
  const descValid =
    description.trim().length >= 10 && description.length <= DESC_MAX;
  const rateLimited = cooldown > 0;
  const disabled = isSubmitting || rateLimited || !titleValid || !descValid;

  // Render via portal so the modal escapes the Navbar's `sticky z-50`
  // stacking context and paints above every page-level element.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto px-4 py-10"
    >
      {/* Backdrop */}
      <div
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
        className="absolute inset-0 cmd-backdrop"
      />

      {/* Card */}
      <div className="relative w-full max-w-lg rounded-[var(--r-xl)] border border-border bg-card shadow-lg">
        <header className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
          <div>
            <h2
              id="feedback-modal-title"
              className="font-display text-lg font-medium tracking-[-0.01em] text-foreground"
            >
              Gửi góp ý
            </h2>
            <p className="text-xs text-muted">
              Cảm ơn bạn đã giúp chúng mình hoàn thiện udemi.tech.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng"
            className="rounded-[var(--r-md)] p-1.5 text-tertiary transition-colors hover:bg-surface hover:text-foreground disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </header>

        <form onSubmit={onSubmit} className="space-y-4 px-6 py-5">
          {/* Title */}
          <div className="space-y-1.5">
            <label
              htmlFor="feedback-title"
              className="text-[13px] font-medium text-foreground"
            >
              Vấn đề gặp phải <span className="text-danger">*</span>
            </label>
            <input
              id="feedback-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={TITLE_MAX}
              placeholder="VD: Nút 'Đánh dấu đã đọc' không phản hồi"
              disabled={isSubmitting}
              className="w-full rounded-[var(--r-md)] border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-[var(--ring)] disabled:opacity-60"
            />
            <div className="flex justify-between text-[11px] text-tertiary">
              <span>Ngắn gọn, rõ ý.</span>
              <span>
                {title.length}/{TITLE_MAX}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label
              htmlFor="feedback-desc"
              className="text-[13px] font-medium text-foreground"
            >
              Mô tả chi tiết <span className="text-danger">*</span>
            </label>
            <textarea
              id="feedback-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={DESC_MAX}
              placeholder="Bạn thấy gì, mong đợi gì, đã thử bước nào? Nếu có lỗi, mô tả các bước để tái hiện."
              rows={5}
              disabled={isSubmitting}
              className="w-full resize-y rounded-[var(--r-md)] border border-border bg-background px-3 py-2 text-sm leading-relaxed text-foreground placeholder:text-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-[var(--ring)] disabled:opacity-60"
            />
            <div className="flex justify-between text-[11px] text-tertiary">
              <span>Càng cụ thể, bạn càng giúp chúng mình sửa nhanh.</span>
              <span>
                {description.length}/{DESC_MAX}
              </span>
            </div>
          </div>

          {/* Images */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground">
              Ảnh minh hoạ{" "}
              <span className="text-tertiary font-normal">
                (tuỳ chọn, tối đa {MAX_IMAGES})
              </span>
            </label>

            <div className="flex flex-wrap gap-2">
              {previews.map((p, i) => (
                <div
                  key={p.url}
                  className="group relative h-20 w-20 overflow-hidden rounded-[var(--r-md)] border border-border bg-surface"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt={p.name}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    disabled={isSubmitting}
                    aria-label={`Xoá ảnh ${p.name}`}
                    className="absolute right-1 top-1 rounded-full bg-background/90 p-0.5 text-tertiary shadow-sm transition hover:text-danger"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {files.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-[var(--r-md)] border border-dashed border-border bg-surface/50 text-[11px] text-tertiary transition-colors hover:border-accent hover:bg-surface hover:text-foreground disabled:opacity-60"
                >
                  <ImageIcon size={18} />
                  <span>Thêm ảnh</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_MIME.join(",")}
              multiple
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                // Reset so re-selecting the same file triggers onChange.
                e.target.value = "";
              }}
              className="hidden"
            />

            <p className="text-[11px] text-tertiary">
              JPEG / PNG / WebP / GIF, tối đa 5 MB mỗi ảnh.
            </p>
          </div>

          {/* Status line */}
          {status.state === "error" && (
            <div
              role="alert"
              className="rounded-[var(--r-md)] border border-danger/30 bg-[rgba(242,92,84,0.08)] px-3 py-2 text-xs text-[rgb(178,49,41)] dark:text-[rgb(244,140,130)]"
            >
              {status.message}
            </div>
          )}
          {status.state === "success" && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-[var(--r-md)] border border-success/30 bg-[rgba(61,214,140,0.08)] px-3 py-2 text-xs text-[rgb(29,155,90)] dark:text-[rgb(120,222,168)]"
            >
              <Check size={14} />
              <span>Cảm ơn bạn! Góp ý đã được gửi đi.</span>
            </div>
          )}
          {rateLimited && status.state !== "error" && status.state !== "success" && (
            <div className="rounded-[var(--r-md)] border border-border bg-surface px-3 py-2 text-xs text-muted">
              Bạn vừa gửi một góp ý. Có thể gửi tiếp sau{" "}
              <strong>{cooldown} giây</strong>.
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-[var(--r-md)] px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-foreground disabled:opacity-60"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={disabled}
              className="inline-flex items-center gap-2 rounded-[var(--r-md)] bg-accent px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[var(--accent-dark)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              {isSubmitting ? "Đang gửi…" : "Gửi góp ý"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
