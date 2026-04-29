/**
 * /cert/[id]/opengraph-image — server-rendered PNG for social sharing.
 *
 * Restrictions imposed by next/og + Satori:
 *   - Only flexbox is supported (no `display: grid`, no `aspect-ratio`).
 *   - Bundle ≤ 500KB including fonts.
 *   - TTF/OTF/WOFF only.
 *
 * The Editorial Diploma's full grid layout is therefore reduced to a
 * vertical flexbox stack here. Same brand signals — frame, hex badge,
 * turquoise banner, recipient in turquoise — but laid out for thumbnails
 * (1200×630 LinkedIn aspect) rather than the 3:2 print plate.
 */
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  formatHours,
  formatVietnameseDate,
  shortCertId,
  type CertRow,
} from "@/lib/certificates";
import { createServiceClient } from "@/lib/supabase-server";

export const alt = "Chứng chỉ hoàn thành lộ trình udemi.tech";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#FBFAF7";
const INK = "#1A1A1A";
const TURQUOISE_INK = "#13343B";
const TURQUOISE_500 = "#20B8B0";
const ASH = "#8A8780";
const GRAPHITE = "#4A4842";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CertImage({ params }: PageProps) {
  const { id } = await params;
  const service = createServiceClient();
  const result = service
    ? await service.from("certificates").select("*").eq("id", id).maybeSingle()
    : { data: null };
  const cert = result.data as CertRow | null;

  if (!cert || !cert.public || cert.revoked_at) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            background: PAPER,
            color: INK,
            alignItems: "center",
            justifyContent: "center",
            fontSize: 48,
          }}
        >
          Không tìm thấy chứng chỉ
        </div>
      ),
      { ...size },
    );
  }

  const [bvpMedium, bvpBold] = await Promise.all([
    readFile(join(process.cwd(), "public/fonts/be-vietnam-pro-500.ttf")),
    readFile(join(process.cwd(), "public/fonts/be-vietnam-pro-700.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: PAPER,
          padding: 32,
          fontFamily: "BeVietnam",
        }}
      >
        {/* Inner frame */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            border: `3px solid ${TURQUOISE_INK}`,
            borderRadius: 14,
            padding: "44px 60px",
            position: "relative",
            alignItems: "center",
          }}
        >
          {/* Hex badge */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <BadgeHex />
            <div
              style={{
                marginTop: -52,
                width: 200,
                height: 28,
                background: TURQUOISE_500,
                color: PAPER,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
              }}
            >
              UDEMI · MMXXVI
            </div>
          </div>

          {/* Eyebrow */}
          <div
            style={{
              display: "flex",
              fontSize: 14,
              color: ASH,
              textTransform: "uppercase",
              letterSpacing: "0.32em",
              marginTop: 8,
            }}
          >
            — Chứng nhận hoàn thành —
          </div>

          {/* Path name */}
          <div
            style={{
              display: "flex",
              fontSize: 64,
              fontWeight: 700,
              color: INK,
              marginTop: 14,
              letterSpacing: "-0.025em",
              textAlign: "center",
              maxWidth: 980,
              lineHeight: 1.05,
            }}
          >
            {cert.path_name}
          </div>

          {/* Recipient label */}
          <div
            style={{
              display: "flex",
              fontSize: 13,
              color: ASH,
              textTransform: "uppercase",
              letterSpacing: "0.32em",
              marginTop: 24,
            }}
          >
            Trao tặng cho
          </div>

          {/* Recipient name */}
          <div
            style={{
              display: "flex",
              fontSize: 44,
              fontWeight: 700,
              color: TURQUOISE_INK,
              marginTop: 8,
              letterSpacing: "-0.005em",
            }}
          >
            {cert.full_name}
          </div>

          {/* Stats row */}
          <div
            style={{
              display: "flex",
              gap: 32,
              marginTop: 22,
              fontSize: 16,
              color: GRAPHITE,
            }}
          >
            <span>
              <b style={{ color: INK, fontWeight: 700 }}>{cert.lesson_count}</b>{" "}
              bài học
            </span>
            <span style={{ color: ASH }}>·</span>
            <span>
              <b style={{ color: INK, fontWeight: 700 }}>
                {formatHours(cert.hours_seconds)}
              </b>
            </span>
          </div>

          {/* Foot row pinned to bottom */}
          <div
            style={{
              display: "flex",
              flex: 1,
              width: "100%",
              alignItems: "flex-end",
              justifyContent: "space-between",
              fontSize: 12,
              color: ASH,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              marginTop: 16,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: ASH }}>Cấp ngày</span>
              <span
                style={{
                  color: INK,
                  fontWeight: 700,
                  marginTop: 4,
                  fontSize: 14,
                }}
              >
                {formatVietnameseDate(cert.signed_at)}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: INK,
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "-0.005em",
                textTransform: "none",
              }}
            >
              udemi
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
              }}
            >
              <span>Mã chứng chỉ</span>
              <span
                style={{
                  color: INK,
                  fontWeight: 700,
                  marginTop: 4,
                  fontSize: 14,
                }}
              >
                {shortCertId(cert.id)}
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "BeVietnam",
          data: bvpMedium,
          style: "normal",
          weight: 500,
        },
        {
          name: "BeVietnam",
          data: bvpBold,
          style: "normal",
          weight: 700,
        },
      ],
    },
  );
}

/**
 * Hexagon SVG for the badge. Inline so satori can render it without flex.
 */
function BadgeHex() {
  return (
    <svg width="120" height="138" viewBox="0 0 130 150">
      <polygon
        points="65,4 122,32 122,118 65,146 8,118 8,32"
        fill="none"
        stroke={TURQUOISE_INK}
        strokeWidth={3}
      />
      <g transform="translate(65 50)">
        <rect x={-18} y={-2} width={36} height={4} fill={INK} rx={2} />
        <rect
          x={-18}
          y={-2}
          width={36}
          height={4}
          fill={INK}
          rx={2}
          transform="rotate(45)"
        />
        <rect
          x={-18}
          y={-2}
          width={36}
          height={4}
          fill={INK}
          rx={2}
          transform="rotate(90)"
        />
        <rect
          x={-18}
          y={-2}
          width={36}
          height={4}
          fill={INK}
          rx={2}
          transform="rotate(135)"
        />
      </g>
    </svg>
  );
}
