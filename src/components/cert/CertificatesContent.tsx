"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useProgress } from "@/lib/progress-context";
import {
  ADULT_PATH_IDS,
  PATHS,
  getPathStages,
  type AdultPathId,
} from "@/lib/paths";
import { createClient } from "@/lib/supabase";
import {
  checkNameSimilarity,
  formatHours,
  shortCertId,
  type CertRow,
} from "@/lib/certificates";

interface PathStatus {
  pathId: AdultPathId;
  pathName: string;
  totalLessons: number;
  completedLessons: number;
  isComplete: boolean;
  cert?: CertRow;
}

const SECONDS_PER_LESSON = 12 * 60;

export default function CertificatesContent() {
  const { user, isAnonymous, isAuthenticated, signInGoogle, signUpGoogle } =
    useAuth();
  const { readTopics } = useProgress();
  const searchParams = useSearchParams();
  const [certs, setCerts] = useState<CertRow[]>([]);
  const [loadingCerts, setLoadingCerts] = useState(true);
  const [claimPathId, setClaimPathId] = useState<AdultPathId | null>(null);

  // Auto-open the claim modal when redirected here with ?claim=...
  useEffect(() => {
    const c = searchParams.get("claim");
    if (c && (ADULT_PATH_IDS as readonly string[]).includes(c)) {
      setClaimPathId(c as AdultPathId);
    }
  }, [searchParams]);

  // Load existing certs for this user.
  useEffect(() => {
    if (!user || isAnonymous) {
      setLoadingCerts(false);
      return;
    }
    const supabase = createClient();
    if (!supabase) {
      setLoadingCerts(false);
      return;
    }
    let cancelled = false;
    supabase
      .from("certificates")
      .select("*")
      .eq("user_id", user.id)
      .order("signed_at", { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        setCerts((data as CertRow[]) ?? []);
        setLoadingCerts(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, isAnonymous]);

  const pathStatuses: PathStatus[] = useMemo(() => {
    return ADULT_PATH_IDS.map((pathId) => {
      const stages = getPathStages(pathId);
      const slugs = stages.flatMap((s) => s.slugs);
      const read = new Set(readTopics);
      const completed = slugs.filter((s) => read.has(s)).length;
      const cert = certs.find((c) => c.path_id === pathId);
      return {
        pathId,
        pathName: PATHS[pathId].nameVi,
        totalLessons: slugs.length,
        completedLessons: completed,
        isComplete: completed === slugs.length,
        cert,
      };
    });
  }, [readTopics, certs]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:px-8 md:py-16 space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-mono uppercase tracking-[0.16em] text-muted">
          Account · Chứng chỉ
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-medium tracking-tight">
          Chứng chỉ của tôi
        </h1>
        <p className="text-sm text-muted max-w-2xl leading-relaxed">
          Mỗi lộ trình hoàn thành đều có chứng chỉ ký số. Bạn có thể chia sẻ
          URL công khai lên LinkedIn hoặc tải về dưới dạng ảnh.
        </p>
      </header>

      {!isAuthenticated && (
        <SignInPrompt
          onGoogle={isAnonymous ? signUpGoogle : signInGoogle}
        />
      )}

      {isAuthenticated && (
        <section className="space-y-4">
          <h2 className="font-mono uppercase tracking-[0.16em] text-xs text-muted">
            Đã cấp · {certs.length}
          </h2>
          {loadingCerts && (
            <div className="text-sm text-muted">Đang tải...</div>
          )}
          {!loadingCerts && certs.length === 0 && (
            <p className="text-sm text-muted italic">
              Chưa có chứng chỉ nào. Hoàn thành một lộ trình để mở khoá.
            </p>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {certs.map((c) => (
              <CertCard key={c.id} cert={c} />
            ))}
          </div>
        </section>
      )}

      {isAuthenticated && (
        <section className="space-y-4">
          <h2 className="font-mono uppercase tracking-[0.16em] text-xs text-muted">
            Lộ trình
          </h2>
          <div className="grid gap-3">
            {pathStatuses.map((s) => (
              <PathRow
                key={s.pathId}
                status={s}
                onClaim={() => setClaimPathId(s.pathId)}
              />
            ))}
          </div>
        </section>
      )}

      {claimPathId && user && (
        <ClaimDialog
          pathId={claimPathId}
          pathName={PATHS[claimPathId].nameVi}
          authName={
            (user.user_metadata?.full_name as string | undefined) ??
            (user.user_metadata?.name as string | undefined) ??
            user.email ??
            ""
          }
          onClose={() => setClaimPathId(null)}
          onIssued={(certId) => {
            setClaimPathId(null);
            // Re-fetch certs so the new one shows up.
            const supabase = createClient();
            if (!supabase) return;
            supabase
              .from("certificates")
              .select("*")
              .eq("user_id", user.id)
              .order("signed_at", { ascending: false })
              .then(({ data }) => setCerts((data as CertRow[]) ?? []));
            // Optional: navigate to the verify URL for instant gratification.
            window.open(`/cert/${certId}`, "_blank");
          }}
        />
      )}
    </div>
  );
}

function SignInPrompt({ onGoogle }: { onGoogle: () => Promise<{ error?: string }> }) {
  const [busy, setBusy] = useState(false);
  return (
    <section className="rounded-2xl border-2 border-dashed border-accent/40 bg-accent-light p-6 md:p-8 space-y-4">
      <h2 className="font-display text-xl font-medium tracking-tight text-foreground">
        Đăng nhập để nhận chứng chỉ
      </h2>
      <p className="text-sm text-muted leading-relaxed max-w-xl">
        Bạn vẫn học bình thường khi không đăng nhập. Nhưng để cấp chứng chỉ
        ký số, chúng tôi cần một tài khoản thật để gắn tên người được cấp với
        URL xác thực công khai. Tiến độ hiện tại của bạn được giữ nguyên sau
        khi đăng nhập.
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await onGoogle();
        }}
        className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark transition-colors disabled:opacity-60"
      >
        Đăng nhập với Google
      </button>
    </section>
  );
}

function CertCard({ cert }: { cert: CertRow }) {
  const url = `/cert/${cert.id}`;
  return (
    <article className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.14em] text-muted">
            {shortCertId(cert.id)}
          </p>
          <h3 className="mt-1 font-display text-lg font-medium tracking-tight text-foreground">
            {cert.path_name}
          </h3>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.14em] text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100">
          ✓ Hợp lệ
        </span>
      </div>
      <p className="text-xs text-muted">
        {cert.lesson_count} bài · {formatHours(cert.hours_seconds)} · Cấp cho{" "}
        <span className="font-medium text-foreground">{cert.full_name}</span>
      </p>
      <div className="flex flex-wrap gap-2 pt-1">
        <Link
          href={url}
          target="_blank"
          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-dark transition-colors"
        >
          Xem chứng chỉ
        </Link>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(window.location.origin + url);
          }}
          className="rounded-lg bg-card border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface transition-colors"
        >
          Copy URL
        </button>
        <a
          href={linkedInAddCertUrl(cert)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-card border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface transition-colors"
        >
          Thêm vào LinkedIn
        </a>
        <a
          href={`/cert/${cert.id}/opengraph-image`}
          download={`udemi-cert-${shortCertId(cert.id)}.png`}
          className="rounded-lg bg-card border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface transition-colors"
        >
          Tải PNG
        </a>
      </div>
    </article>
  );
}

function PathRow({
  status,
  onClaim,
}: {
  status: PathStatus;
  onClaim: () => void;
}) {
  const pct = Math.round(
    (status.completedLessons / Math.max(status.totalLessons, 1)) * 100,
  );
  const claimed = !!status.cert;
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-foreground truncate">
          {status.pathName}
        </h3>
        <p className="text-xs text-muted mt-1">
          {status.completedLessons}/{status.totalLessons} bài · {pct}%
        </p>
        <div className="mt-2 h-1.5 rounded-full bg-surface overflow-hidden">
          <div
            className="h-full bg-accent"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="shrink-0">
        {claimed ? (
          <span className="rounded-lg bg-surface px-3 py-1.5 text-xs font-mono uppercase tracking-[0.14em] text-muted">
            Đã cấp
          </span>
        ) : status.isComplete ? (
          <button
            type="button"
            onClick={onClaim}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-dark transition-colors"
          >
            Nhận chứng chỉ
          </button>
        ) : (
          <span className="rounded-lg bg-surface px-3 py-1.5 text-xs font-mono uppercase tracking-[0.14em] text-muted">
            Chưa xong
          </span>
        )}
      </div>
    </div>
  );
}

function ClaimDialog({
  pathId,
  pathName,
  authName,
  onClose,
  onIssued,
}: {
  pathId: AdultPathId;
  pathName: string;
  authName: string;
  onClose: () => void;
  onIssued: (certId: string) => void;
}) {
  const [name, setName] = useState(authName);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const similarity = checkNameSimilarity(authName, name);

  async function submit() {
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch("/api/certificates/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathId, displayName: name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setServerError(humanizeError(data?.error, data?.detail));
        setSubmitting(false);
        return;
      }
      const data = await res.json();
      onIssued(data.certId);
    } catch {
      setServerError("Không kết nối được tới máy chủ. Thử lại sau.");
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 space-y-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-xl font-medium tracking-tight">
          Tên muốn hiện ở Chứng chỉ?
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          Đây là tên xuất hiện trên chứng chỉ <b>{pathName}</b>. Cần ít nhất
          4 từ trùng (hoặc tất cả nếu tên ngắn hơn) với tên trong tài khoản{" "}
          <span className="font-mono text-foreground">{authName}</span>.
        </p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Ví dụ: Lê Hoàng Anh"
        />
        <SimilarityHint
          name={name}
          authName={authName}
          ok={similarity.ok}
          matched={similarity.matched}
          needed={similarity.needed}
        />
        {serverError && (
          <div className="rounded-lg border border-red-500 bg-red-100 px-3 py-2 text-sm text-red-900 dark:bg-red-900/20 dark:text-red-200 dark:border-red-700">
            {serverError}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-card border border-border px-4 py-2 text-sm font-medium hover:bg-surface transition-colors"
          >
            Huỷ
          </button>
          <button
            type="button"
            disabled={!similarity.ok || submitting}
            onClick={submit}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Đang ký..." : "Cấp chứng chỉ"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SimilarityHint({
  name,
  authName,
  ok,
  matched,
  needed,
}: {
  name: string;
  authName: string;
  ok: boolean;
  matched: string[];
  needed: number;
}) {
  if (!name.trim() || !authName.trim()) return null;
  if (ok) {
    return (
      <p className="text-xs text-emerald-700 dark:text-emerald-300">
        ✓ Khớp với tên tài khoản ({matched.length} từ trùng).
      </p>
    );
  }
  return (
    <p className="text-xs text-amber-800 dark:text-amber-200">
      Cần ít nhất {needed} từ trùng — hiện có {matched.length}. Hãy giữ
      nguyên các từ chính trong tên thật.
    </p>
  );
}

function humanizeError(code: unknown, detail: unknown): string {
  switch (code) {
    case "auth_required":
      return "Cần đăng nhập để nhận chứng chỉ.";
    case "upgrade_required":
      return "Hãy đăng nhập với Google hoặc email trước (tài khoản ẩn danh không thể cấp chứng chỉ).";
    case "name_mismatch":
      return "Tên không khớp với tên tài khoản. Hãy giữ ít nhất 4 từ trùng.";
    case "incomplete":
      if (detail && typeof detail === "object" && "missing" in detail) {
        const m = (detail as { missing: string[] }).missing;
        return `Còn ${m.length} bài chưa hoàn thành.`;
      }
      return "Bạn chưa hoàn thành toàn bộ bài trong lộ trình.";
    case "invalid_path_id":
      return "Lộ trình không hợp lệ.";
    case "no_signing_key":
    case "config":
      return "Hệ thống cấp chứng chỉ tạm thời chưa sẵn sàng.";
    default:
      return "Không cấp được chứng chỉ. Thử lại sau.";
  }
}

function linkedInAddCertUrl(cert: CertRow): string {
  const issuedDate = new Date(cert.signed_at);
  const params = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: `${cert.path_name} · udemi.tech`,
    organizationName: "udemi.tech",
    issueYear: String(issuedDate.getFullYear()),
    issueMonth: String(issuedDate.getMonth() + 1),
    certUrl: `${typeof window !== "undefined" ? window.location.origin : "https://udemi.tech"}/cert/${cert.id}`,
    certId: shortCertId(cert.id),
  });
  return `https://www.linkedin.com/profile/add?${params.toString()}`;
}
