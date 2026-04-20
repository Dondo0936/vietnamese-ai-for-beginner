import {
  ArticleShell,
  ArticleSection,
  ArticleProse,
  ArticleViz,
  ArticleCompare,
  Term,
} from "@/components/article";
import { articleMap } from "./registry";

const meta = articleMap["operator-2-browser-agent"]!;

export default function Operator2Article() {
  return (
    <ArticleShell meta={meta} heroViz={<CoBrowserViz />}>
      <ArticleSection eyebrow="01 · Cái mới">
        <ArticleProse>
          <p>
            OpenAI ra Operator 2 — bản kế thừa trình duyệt của agent đầu
            2025. Khác biệt lớn nhất: <b>người và agent dùng chung một
            tab</b>. Không phải agent chạy trong iframe ẩn rồi báo lại,
            mà cùng cursor, cùng input, cùng session cookie.
          </p>
          <p>
            Lý do thiết kế: workflow thật của người dùng thường chen
            giữa &mdash; điền form, bấm OK, xác nhận OTP. Agent trước
            đây hoặc chạy một mạch (rồi sai), hoặc dừng để chờ người
            (rồi mất context). Operator 2 chọn ở giữa.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="02 · Guardrail"
        heading="Mỗi hành động có hậu quả đều phải có người gật đầu"
      >
        <ArticleProse>
          <p>
            Operator 2 chia hành động thành 3 mức:
          </p>
        </ArticleProse>
        <ActionTierTable />
        <ArticleProse>
          <p>
            Ranh giới không do model tự đoán — có danh sách rõ ràng:
            form payment, xoá tài khoản, reset password, chuyển tiền,
            gửi email ra ngoài. Ngoài danh sách đó, agent cứ chạy.
          </p>
          <p>
            Cách này đánh đổi giữa &ldquo;autonomous&rdquo; và{" "}
            &ldquo;safe&rdquo;:{" "}
            <Term slug="agent-architecture">agent architecture</Term>{" "}
            kiểu này chậm hơn, nhưng user-trust kéo dài hơn — không
            phải hỏng 1 lần là tắt vĩnh viễn.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="03 · So sánh với thế hệ trước"
        heading="Agent headless → Agent đồng-điều khiển"
      >
        <ArticleCompare
          before={{
            label: "Operator 1 · đầu 2025",
            value: "headless tab",
            note: "Agent mở trình duyệt ẩn, dùng toàn bộ thao tác. Người xem log sau. Sai là phải quay lại từ đầu.",
          }}
          after={{
            label: "Operator 2 · 04/2026",
            value: "co-pilot tab",
            note: "Cùng tab. Người thấy cursor agent di chuyển, có thể ngắt bất kỳ lúc nào. Confirm gate ở mọi hành động nhạy cảm.",
          }}
        />
        <ArticleProse>
          <p>
            Điểm khác mà ít được nói: Operator 2 không yêu cầu extension
            riêng. Chạy trên Chrome/Arc/Safari thẳng qua CDP (Chrome
            DevTools Protocol). Nghĩa là doanh nghiệp không cần deploy
            image mới.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="04 · Ai dùng được"
        heading="Task lặp đi lặp lại + có audit trail + có confirm gate"
      >
        <ArticleProse>
          <p>
            Sweet spot là những task kiểu: tra cứu 30 email đặt vé,
            download 50 invoice từ portal khách hàng, sort inbox theo
            nguyên tắc, reply theo template có biến. Những việc nhàm
            chán nhưng không được phép sai.
          </p>
          <p>
            Không hợp cho: giao dịch ngân hàng, đặt vé máy bay (nhiều
            confirm gate), hoặc bất kỳ quy trình nào cần judgment phức
            tạp — vì mỗi lần confirm là một lần bị người chặn, thời
            gian tiết kiệm tụt nhanh.
          </p>
        </ArticleProse>
      </ArticleSection>
    </ArticleShell>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Hero viz — Co-browser: agent cursor + human cursor on one tab
 * ────────────────────────────────────────────────────────────── */
export function CoBrowserViz() {
  return (
    <svg
      viewBox="0 0 900 340"
      className="ar-viz"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Operator 2 co-browser: agent cursor and human cursor share one tab"
    >
      <defs>
        <linearGradient id="op-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--turquoise-50)" />
          <stop offset="100%" stopColor="var(--bg-card)" />
        </linearGradient>
      </defs>
      <rect width="900" height="340" fill="url(#op-bg)" />

      {/* Browser chrome */}
      <rect x="60" y="40" width="780" height="260" rx="10" fill="var(--bg-card)" stroke="var(--border)" strokeWidth="1.5" />
      <rect x="60" y="40" width="780" height="32" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
      <circle cx="80" cy="56" r="5" fill="#F25C54" />
      <circle cx="96" cy="56" r="5" fill="#F5B547" />
      <circle cx="112" cy="56" r="5" fill="#3DD68C" />
      <rect x="140" y="48" width="560" height="16" rx="8" fill="var(--paper-2)" stroke="var(--border)" />
      <text x="156" y="60" fontFamily="var(--font-mono)" fontSize="10" fill="var(--text-tertiary)">
        portal.supplier.vn/invoice?id=2026-04-15
      </text>
      <rect x="720" y="48" width="100" height="16" rx="4" fill="var(--ink)" />
      <text x="770" y="59" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill="var(--turquoise-300)" letterSpacing="0.1em">
        ● AGENT ON
      </text>

      {/* Form fields */}
      <g transform="translate(100 100)">
        <rect width="340" height="28" rx="4" fill="var(--paper-2)" stroke="var(--border)" />
        <text x="12" y="18" fontFamily="var(--font-mono)" fontSize="11" fill="var(--ink)">
          invoice_id: VN-042615-0837
        </text>
      </g>
      <g transform="translate(100 140)">
        <rect width="340" height="28" rx="4" fill="var(--paper-2)" stroke="var(--border)" />
        <text x="12" y="18" fontFamily="var(--font-mono)" fontSize="11" fill="var(--ink)">
          download_token: a8f3…
        </text>
      </g>
      <g transform="translate(100 180)">
        <rect width="340" height="28" rx="4" fill="var(--turquoise-50)" stroke="var(--turquoise-500)" strokeWidth="1.5" />
        <text x="12" y="18" fontFamily="var(--font-mono)" fontSize="11" fill="var(--turquoise-ink)">
          confirm_download: ?
        </text>
      </g>

      {/* Agent cursor (turquoise) + trail */}
      <g>
        <path
          d="M 260 175 L 300 195 L 340 210 L 392 218"
          stroke="var(--turquoise-500)"
          strokeWidth="1.5"
          strokeDasharray="3 3"
          fill="none"
          opacity="0.6"
        />
        <g transform="translate(392 218)">
          <path d="M 0 0 L 12 4 L 4 12 Z" fill="var(--turquoise-500)" />
          <rect x="14" y="14" width="100" height="18" rx="4" fill="var(--turquoise-500)" />
          <text x="64" y="27" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill="var(--paper)" letterSpacing="0.08em">
            AGENT · click
          </text>
        </g>
      </g>

      {/* Human cursor (ink) */}
      <g transform="translate(560 140)">
        <path d="M 0 0 L 12 4 L 4 12 Z" fill="var(--ink)" />
        <rect x="14" y="14" width="98" height="18" rx="4" fill="var(--ink)" />
        <text x="62" y="27" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill="var(--paper)" letterSpacing="0.08em">
          NGƯỜI · idle
        </text>
      </g>

      {/* Right side panel — confirm gate */}
      <g transform="translate(490 100)">
        <rect width="330" height="180" rx="8" fill="var(--bg-primary)" stroke="var(--turquoise-500)" strokeWidth="1.5" />
        <text x="16" y="24" fontFamily="var(--font-mono)" fontSize="10" fill="var(--turquoise-ink)" letterSpacing="0.12em">
          ◆ CONFIRM GATE
        </text>
        <text x="16" y="52" fontFamily="var(--font-display)" fontSize="16" fill="var(--text-primary)" fontWeight="500">
          Agent muốn tải invoice
        </text>
        <text x="16" y="72" fontFamily="var(--font-display)" fontSize="14" fill="var(--text-secondary)">
          VN-042615-0837 (2.4 MB, PDF)
        </text>
        <text x="16" y="104" fontFamily="var(--font-mono)" fontSize="10" fill="var(--text-tertiary)" letterSpacing="0.08em">
          BƯỚC 12 / 30 · BATCH: 30 INVOICES
        </text>
        <rect x="16" y="120" width="80" height="32" rx="6" fill="var(--turquoise-500)" />
        <text x="56" y="140" textAnchor="middle" fontFamily="var(--font-display)" fontSize="13" fill="var(--paper)" fontWeight="500">
          Cho phép
        </text>
        <rect x="106" y="120" width="80" height="32" rx="6" fill="var(--bg-card)" stroke="var(--border)" />
        <text x="146" y="140" textAnchor="middle" fontFamily="var(--font-display)" fontSize="13" fill="var(--text-primary)">
          Từ chối
        </text>
        <text x="16" y="170" fontFamily="var(--font-mono)" fontSize="9" fill="var(--text-tertiary)" letterSpacing="0.08em">
          giống với 11 lần trước · auto-allow 29 còn lại?
        </text>
      </g>

      <text x="40" y="325" fontFamily="var(--font-mono)" fontSize="10" fill="var(--text-tertiary)" letterSpacing="0.08em">
        CÙNG TAB · CÙNG COOKIE · CONFIRM GATE Ở MỖI HÀNH ĐỘNG NHẠY CẢM
      </text>
    </svg>
  );
}

function ActionTierTable() {
  const tiers = [
    {
      level: "Tự do",
      color: "var(--turquoise-500)",
      examples: "click link, scroll, đọc nội dung, copy text, chuyển tab",
      gate: "Không cần",
    },
    {
      level: "Có cảnh báo",
      color: "var(--peach-500)",
      examples: "điền form, submit search, upload file, chuyển URL domain",
      gate: "Banner ở header · người có 3 giây ngắt",
    },
    {
      level: "Phải xác nhận",
      color: "var(--clay)",
      examples: "payment, xoá tài khoản, OTP, chuyển tiền, gửi email ra ngoài",
      gate: "Modal chặn · người click Cho phép",
    },
  ];
  return (
    <ArticleViz caption="3 tier hành động · rìa giữa tier 2 và 3 là danh sách cứng, không do model đoán">
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontFamily: "var(--font-display)",
          fontSize: 14,
        }}
      >
        <thead>
          <tr>
            {["Tier", "Ví dụ", "Guardrail"].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: "left",
                  padding: "10px 14px",
                  borderBottom: "1px solid var(--border)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--text-tertiary)",
                  fontWeight: 500,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tiers.map((t) => (
            <tr key={t.level}>
              <td
                style={{
                  padding: "14px",
                  borderBottom: "1px solid var(--border-subtle)",
                  borderLeft: `3px solid ${t.color}`,
                  fontFamily: "var(--font-display)",
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  minWidth: 160,
                }}
              >
                {t.level}
              </td>
              <td
                style={{
                  padding: "14px",
                  borderBottom: "1px solid var(--border-subtle)",
                  color: "var(--text-secondary)",
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {t.examples}
              </td>
              <td
                style={{
                  padding: "14px",
                  borderBottom: "1px solid var(--border-subtle)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: "var(--text-tertiary)",
                }}
              >
                {t.gate}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ArticleViz>
  );
}
