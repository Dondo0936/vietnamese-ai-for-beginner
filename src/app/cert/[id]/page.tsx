/**
 * /cert/[id] — public verification page.
 *
 * Anyone (no auth) can hit this URL and see the diploma. Server fetches the
 * row, verifies the Ed25519 signature against the public key in
 * src/lib/cert-keys.ts, and renders. If the signature is invalid the page
 * shows a clear "không hợp lệ" state.
 *
 * RLS allows the public read on rows where public=true and revoked_at is
 * null — see migration `create_certificates`.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Diploma, { DiplomaStage } from "@/components/cert/Diploma";
import {
  formatHours,
  formatVietnameseDate,
  shortCertId,
  verifyPayload,
  type CertRow,
  type CertPayload,
} from "@/lib/certificates";
import { createServiceClient } from "@/lib/supabase-server";
import QRCode from "qrcode";

export const dynamic = "force-dynamic"; // signature verify on every request

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://udemi.tech";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function fetchCert(id: string): Promise<CertRow | null> {
  const service = createServiceClient();
  if (!service) return null;
  const { data } = await service
    .from("certificates")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as CertRow | null) ?? null;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const cert = await fetchCert(id);
  if (!cert || !cert.public || cert.revoked_at) {
    return { title: "Không tìm thấy chứng chỉ · udemi.tech" };
  }
  const title = `${cert.full_name} · ${cert.path_name} · udemi.tech`;
  const description = `Chứng chỉ hoàn thành lộ trình "${cert.path_name}" trên udemi.tech, gồm ${cert.lesson_count} bài học. Mã chứng chỉ ${shortCertId(cert.id)}.`;
  return {
    title,
    description,
    alternates: { canonical: `/cert/${cert.id}` },
    openGraph: {
      type: "article",
      url: `${SITE_URL}/cert/${cert.id}`,
      title,
      description,
      locale: "vi_VN",
    },
  };
}

export default async function CertificatePage({ params }: PageProps) {
  const { id } = await params;
  const cert = await fetchCert(id);
  if (!cert || !cert.public || cert.revoked_at) notFound();

  const payload = cert.payload as CertPayload;
  let valid = false;
  try {
    valid = await verifyPayload(payload, cert.signature);
  } catch {
    valid = false;
  }

  const verifyUrl = `${SITE_URL}/cert/${cert.id}`;
  const qrSvgString = await QRCode.toString(verifyUrl, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#1A1A1A", light: "#0000" },
  });

  return (
    <main className="min-h-screen bg-surface px-4 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-muted font-mono">
            udemi.tech · chứng chỉ
          </p>
          <h1 className="text-2xl md:text-3xl font-display font-medium text-foreground tracking-tight">
            Chứng chỉ hoàn thành lộ trình
          </h1>
          <VerifyBadge valid={valid} />
        </header>

        <DiplomaStage>
          <Diploma
            fullName={cert.full_name}
            pathName={cert.path_name}
            lessonCount={cert.lesson_count}
            hoursLabel={formatHours(cert.hours_seconds)}
            issuedDate={formatVietnameseDate(cert.signed_at)}
            certId={cert.id}
            qrSvg={
              <span
                aria-hidden
                dangerouslySetInnerHTML={{ __html: extractInnerSvg(qrSvgString) }}
              />
            }
          />
        </DiplomaStage>

        <section className="rounded-xl border border-border bg-card p-6 space-y-4 text-sm text-foreground">
          <h2 className="font-mono uppercase tracking-[0.16em] text-xs text-muted">
            Chi tiết
          </h2>
          <dl className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Row label="Người được cấp" value={cert.full_name} />
            <Row label="Lộ trình" value={cert.path_name} />
            <Row label="Số bài" value={`${cert.lesson_count} bài`} />
            <Row label="Tổng thời lượng" value={formatHours(cert.hours_seconds)} />
            <Row
              label="Ngày cấp"
              value={formatVietnameseDate(cert.signed_at)}
            />
            <Row label="Mã chứng chỉ" value={shortCertId(cert.id)} mono />
          </dl>
        </section>

        <section className="rounded-xl border border-border bg-card p-6 space-y-3 text-sm text-foreground">
          <h2 className="font-mono uppercase tracking-[0.16em] text-xs text-muted">
            Cách xác thực độc lập
          </h2>
          <p className="text-muted">
            Chứng chỉ này được ký bằng Ed25519. Bạn có thể xác minh chữ ký mà
            không cần tin udemi.tech: tải payload + chữ ký bên dưới, dùng
            khoá công khai trong{" "}
            <code className="font-mono text-foreground">src/lib/cert-keys.ts</code>{" "}
            của repository công khai.
          </p>
          <details className="rounded-lg bg-surface p-4">
            <summary className="cursor-pointer text-xs font-mono uppercase tracking-wider text-muted">
              Payload + signature (JSON)
            </summary>
            <pre className="mt-3 overflow-x-auto text-[11px] leading-relaxed text-foreground">
{JSON.stringify(
  { payload, signature: cert.signature, keyId: cert.key_id },
  null,
  2,
)}
            </pre>
          </details>
        </section>
      </div>
    </main>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-mono uppercase tracking-[0.12em] text-muted">
        {label}
      </dt>
      <dd className={`mt-1 ${mono ? "font-mono text-sm" : "text-base"}`}>
        {value}
      </dd>
    </div>
  );
}

function VerifyBadge({ valid }: { valid: boolean }) {
  if (valid) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-mono uppercase tracking-[0.16em] text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100">
        <span aria-hidden>✓</span> Chữ ký hợp lệ
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-mono uppercase tracking-[0.16em] text-red-900 dark:bg-red-900/30 dark:text-red-100">
      <span aria-hidden>!</span> Chữ ký không hợp lệ
    </span>
  );
}

/**
 * The qrcode lib emits a full <svg>...</svg> string with its own width/height
 * + viewBox attributes. We embed the inner content into the diploma's
 * already-positioned <span> wrapper, so we strip the outer <svg> tag.
 */
function extractInnerSvg(svgString: string): string {
  const open = svgString.indexOf(">");
  const close = svgString.lastIndexOf("</svg>");
  if (open === -1 || close === -1) return svgString;
  const viewBoxMatch = /viewBox="([^"]+)"/.exec(svgString);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 33 33";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="100%" height="100%">${svgString.slice(open + 1, close)}</svg>`;
}
