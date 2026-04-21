import {
  ArticleShell,
  ArticleSection,
  ArticleProse,
  ArticleViz,
  ArticleCompare,
  Term,
} from "@/components/article";
import { articleMap } from "./registry";

const meta = articleMap["response-streaming"]!;

/**
 * Explainer article — Response Streaming for a general audience.
 * Shares the editorial design language with the tokenization lesson:
 * turquoise/clay/peach accents, token chips, compare cards, aha callout.
 */
export default function ResponseStreamingArticle() {
  return (
    <ArticleShell meta={meta} heroViz={<StreamingHeroViz />}>
      <ArticleSection eyebrow="01 · Ý tưởng">
        <ArticleProse>
          <p>
            Mở ChatGPT, Claude hay Gemini, gõ một câu hỏi rồi bấm Enter.
            Bạn thấy gì? Chữ bắt đầu hiện ra{" "}
            <b>từng mảnh một</b> — như ai đó đang gõ phía bên kia. Đây
            không phải hiệu ứng trang trí. Đây là{" "}
            <b>response streaming</b>: server đẩy từng{" "}
            <Term slug="tokenization">token</Term> về browser ngay khi
            model vừa sinh ra, thay vì chờ trả lời hoàn chỉnh rồi mới gửi
            một cục.
          </p>
          <p>
            Thoạt nhìn giống thay đổi nhỏ về giao diện. Thực ra đây là
            một trong những lý do lớn nhất khiến chatbot đời này{" "}
            &ldquo;cảm giác thông minh&rdquo; hơn API model cùng thời —
            dù cùng một lõi. Khi người dùng thấy chữ đầu tiên trong 300ms
            thay vì chờ 8 giây, não đánh giá công cụ đó là{" "}
            <b>sống và đang nghĩ</b>.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="02 · Hai cách gửi một câu trả lời"
        heading="Gửi một cục &mdash; hay gửi từng ngụm?"
      >
        <ArticleCompare
          before={{
            label: "Non-streaming · request/response",
            value: "Chờ hết → trả một cục",
            note: "Browser gõ, server chờ model sinh hết 200 token, rồi trả toàn bộ JSON trong một lần. Thời gian chờ = time-to-last-token. Người dùng nhìn spinner quay.",
          }}
          after={{
            label: "Streaming · server-sent events",
            value: "Có token nào đẩy ngay token đó",
            note: "Mỗi token được model sinh ra, server push về client luôn qua cùng một kết nối đang mở. Thời gian thấy chữ đầu = TTFT ≈ 300ms. Người dùng thấy nội dung lớn dần.",
          }}
        />
        <ArticleProse>
          <p>
            Cả hai đều trả cùng một nội dung. Khác nhau là ở chỗ: cách
            đầu <b>đóng gói một lần</b>, cách sau <b>nhỏ giọt liên tục</b>.
            Đóng gói một lần đơn giản hơn cho developer; nhỏ giọt đòi hỏi
            cả server và client cùng hiểu một giao thức gọi là{" "}
            <b>server-sent events</b> (SSE) — HTTP vẫn mở, server gửi
            xuống một dòng text mỗi khi có token mới, client đọc từng dòng
            và in ra màn hình.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="03 · TTFT — con số quan trọng nhất"
        heading="Người dùng không đo tổng thời gian. Họ đo cú chờ đầu tiên."
      >
        <TimingChart />
        <ArticleProse>
          <p>
            <b>Time-to-first-token</b> (TTFT) là số giây từ lúc người
            dùng bấm Enter đến lúc thấy ký tự đầu tiên. Nghiên cứu UX từ
            thời Google Search năm 2008 đã cho thấy cùng một kết quả:
            mỗi 100ms chờ thêm, người dùng cảm giác công cụ{" "}
            &ldquo;chậm&rdquo;. Với LLM, điều này càng rõ: một câu trả
            lời 400 token có thể mất 8 giây để sinh xong. Nếu bạn phải
            chờ 8 giây mới thấy gì, bạn đã chuyển tab.
          </p>
          <p>
            Streaming đảo trật tự: TTFT chỉ còn vài trăm ms (thời gian
            model load KV cache rồi phát token đầu). Tổng thời gian
            vẫn là 8 giây — nhưng bạn đã đọc được 1/3 câu trả lời trong
            lúc chờ phần còn lại. Lúc token cuối về tới nơi, bạn gần đọc
            xong.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="04 · Dưới mui xe"
        heading="Cái tưởng là phép thuật, thật ra là một dòng HTTP header"
      >
        <ArticleProse>
          <p>
            Không có công nghệ mới nào ở đây. SSE có từ năm 2009, là một
            phần của tiêu chuẩn HTML5. Server trả về với header{" "}
            <code>Content-Type: text/event-stream</code> và để connection
            mở. Mỗi khi có data mới, server ghi một dòng dạng{" "}
            <code>data: {"{...}"}\n\n</code> xuống socket. Browser có
            sẵn class <code>EventSource</code> đọc từng dòng ngay khi nó
            đến.
          </p>
        </ArticleProse>
        <StreamFlowViz />
        <ArticleProse>
          <p>
            Phía model, <Term slug="model-serving">inference server</Term>{" "}
            (vLLM, SGLang, TensorRT-LLM) sinh token xong thì đẩy vào
            queue gửi về client. Không đợi hết câu — không có khái niệm{" "}
            &ldquo;đợi hết câu&rdquo; ở tầng model, vì model chỉ biết
            sinh token kế tiếp. Câu &ldquo;hết&rdquo; khi model sinh ra
            một token đặc biệt tên là <code>&lt;eos&gt;</code> (end of
            stream) — server thấy token đó thì đóng connection.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="05 · Đánh đổi"
        heading="Đẹp hơn cho người xem, khó hơn cho người code"
      >
        <TradeoffCards />
        <ArticleProse>
          <p>
            Streaming không miễn phí. Bạn <b>không biết</b> câu trả lời
            cuối trước khi nó ra xong — nên không thể chạy validation
            toàn bộ (ví dụ kiểm tra JSON có hợp lệ) trước khi hiển thị.
            Nếu ở token thứ 180, model bắt đầu hallucinate, bạn đã in ra
            màn hình 179 token trước đó — không rút lại được.
          </p>
          <p>
            Xử lý lỗi giữa dòng cũng khó: connection rớt ở giây thứ 3,
            client đã nhận được 50 token, bạn phải quyết định hiển thị
            tiếp như cũ hay báo lỗi rồi cho retry. Thêm nữa, nhiều{" "}
            <b>middleware</b> doanh nghiệp (proxy, load balancer, CDN)
            mặc định buffer response — cần cấu hình riêng để SSE không
            bị tắc.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="06 · Dùng khi nào, bỏ khi nào"
        heading="Streaming là mặc định cho chat, không phải cho mọi thứ"
      >
        <ArticleProse>
          <p>
            <b>Dùng streaming</b> khi UI của bạn là chat hay bất kỳ chỗ
            nào người dùng đọc đầu ra ngay lập tức: code suggestion trong
            IDE, tóm tắt tài liệu, copilot viết email. Ở đây TTFT là
            metric quan trọng hơn cả — người dùng không quan tâm bạn tiêu
            bao nhiêu GPU, họ quan tâm chữ có xuất hiện nhanh không.
          </p>
          <p>
            <b>Bỏ streaming</b> khi output là dữ liệu có cấu trúc mà
            downstream phải dùng nguyên khối: JSON cho một API khác,{" "}
            <Term slug="function-calling">function call</Term> đi vào
            một tool, embedding vector. Stream một JSON chưa xong rồi
            cho <code>JSON.parse</code> nửa chừng chỉ thêm bug. Batch
            job đêm cũng không cần streaming — không ai ngồi nhìn.
          </p>
          <p>
            Còn một điểm ít người để ý: streaming cho bạn cơ hội{" "}
            <b>dừng giữa chừng</b>. Người dùng đọc được 2 câu đầu, thấy
            model đi sai hướng, bấm &ldquo;Stop&rdquo; — bạn tiết kiệm
            được phần tính toán còn lại. Non-streaming không có lối
            thoát đó: đã gọi là đã tính xong.
          </p>
        </ArticleProse>
      </ArticleSection>
    </ArticleShell>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Hero viz — streaming chat bubble with progressive token reveal.
 * Pure SVG, no animation (server-rendered). CSS in articles.css
 * drives a subtle token shimmer for the "live" feel.
 * ────────────────────────────────────────────────────────────── */
export function StreamingHeroViz() {
  const tokens = [
    { t: "Câu", done: true },
    { t: " trả", done: true },
    { t: " lời", done: true },
    { t: " đang", done: true },
    { t: " hiện", done: true },
    { t: " ra", done: true },
    { t: " từng", done: true },
    { t: " token", done: true },
    { t: " một", done: true },
    { t: "…", live: true },
  ];
  return (
    <svg
      viewBox="0 0 900 340"
      className="ar-viz"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Minh hoạ response streaming: tokens xuất hiện từng cái một trong bubble chat"
    >
      <defs>
        <linearGradient id="stream-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--turquoise-50)" />
          <stop offset="100%" stopColor="var(--bg-card)" />
        </linearGradient>
        <marker
          id="stream-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--turquoise-500)" />
        </marker>
      </defs>
      <rect width="900" height="340" fill="url(#stream-bg)" />

      <text
        x="40"
        y="40"
        fontFamily="var(--font-mono)"
        fontSize="11"
        fill="var(--turquoise-ink)"
        letterSpacing="0.1em"
      >
        / RESPONSE STREAMING · TTFT 280ms · 38 tok/s
      </text>

      {/* Server side */}
      <g transform="translate(60 76)">
        <rect
          width="200"
          height="180"
          rx="14"
          fill="var(--bg-card)"
          stroke="var(--border)"
          strokeWidth="1.5"
        />
        <text
          x="100"
          y="32"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="10"
          fill="var(--text-tertiary)"
          letterSpacing="0.12em"
        >
          01 · MODEL
        </text>
        <text
          x="100"
          y="68"
          textAnchor="middle"
          fontFamily="var(--font-display)"
          fontSize="22"
          fontWeight="500"
          fill="var(--text-primary)"
          letterSpacing="-0.01em"
        >
          LLM sinh
        </text>
        <text
          x="100"
          y="92"
          textAnchor="middle"
          fontFamily="var(--font-display)"
          fontSize="22"
          fontWeight="500"
          fill="var(--text-primary)"
          letterSpacing="-0.01em"
        >
          token
        </text>
        {/* Token chips inside server */}
        {["Câu", "trả", "lời"].map((t, i) => (
          <g key={t} transform={`translate(${22 + i * 54} 120)`}>
            <rect
              width="48"
              height="28"
              rx="6"
              fill="var(--turquoise-500)"
              opacity={0.85 - i * 0.1}
            />
            <text
              x="24"
              y="18"
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize="11"
              fill="var(--paper)"
              fontWeight="600"
            >
              {t}
            </text>
          </g>
        ))}
      </g>

      {/* Pipe */}
      <g>
        <line
          x1="270"
          y1="166"
          x2="598"
          y2="166"
          stroke="var(--turquoise-500)"
          strokeWidth="2.5"
          markerEnd="url(#stream-arrow)"
        />
        <text
          x="434"
          y="156"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="10"
          fill="var(--turquoise-ink)"
          letterSpacing="0.12em"
        >
          SSE · text/event-stream
        </text>
        <text
          x="434"
          y="188"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="10"
          fill="var(--text-tertiary)"
          letterSpacing="0.08em"
        >
          data: {"{token:\"Câu\"}"}
        </text>
      </g>

      {/* Client bubble */}
      <g transform="translate(610 70)">
        <rect
          width="240"
          height="200"
          rx="16"
          fill="var(--bg-card)"
          stroke="var(--border)"
          strokeWidth="1.5"
        />
        <text
          x="120"
          y="32"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="10"
          fill="var(--text-tertiary)"
          letterSpacing="0.12em"
        >
          02 · BROWSER
        </text>

        {/* Chat bubble */}
        <g transform="translate(16 54)">
          <rect
            width="208"
            height="128"
            rx="10"
            fill="var(--turquoise-50)"
            stroke="var(--turquoise-100)"
          />
          <foreignObject x="14" y="12" width="180" height="104">
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 14,
                lineHeight: 1.45,
                color: "var(--turquoise-ink)",
                letterSpacing: "-0.005em",
              }}
            >
              {tokens.map((tk, i) => (
                <span
                  key={i}
                  style={{
                    opacity: tk.live ? 0.4 : 1,
                    fontWeight: tk.live ? 600 : 500,
                  }}
                >
                  {tk.t}
                </span>
              ))}
              <span
                style={{
                  display: "inline-block",
                  width: 2,
                  height: 14,
                  marginLeft: 2,
                  background: "var(--turquoise-ink)",
                  verticalAlign: "-2px",
                  animation: "ar-blink 1.1s steps(2, start) infinite",
                }}
              />
            </div>
          </foreignObject>
        </g>
      </g>
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Section 03 viz — TTFT vs total-time bars (for two scenarios)
 * ────────────────────────────────────────────────────────────── */
function TimingChart() {
  const rows = [
    {
      label: "Non-streaming",
      ttft: 0,
      total: 100,
      ttftMs: "—",
      totalMs: "8.0s",
      tone: "dim" as const,
    },
    {
      label: "Streaming",
      ttft: 3.5,
      total: 100,
      ttftMs: "0.28s",
      totalMs: "8.0s",
      tone: "accent" as const,
    },
  ];

  return (
    <ArticleViz caption="Cùng một prompt · cùng một model · hai cách trả kết quả">
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {rows.map((r) => (
          <div key={r.label}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color:
                    r.tone === "accent"
                      ? "var(--turquoise-ink)"
                      : "var(--text-tertiary)",
                  fontWeight: 600,
                }}
              >
                {r.label}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--text-tertiary)",
                }}
              >
                TTFT {r.ttftMs} · total {r.totalMs}
              </span>
            </div>
            <div
              style={{
                position: "relative",
                height: 36,
                background: "var(--paper-2)",
                borderRadius: 6,
                overflow: "hidden",
                border: "1px solid var(--border)",
              }}
            >
              {/* TTFT marker */}
              {r.ttft > 0 && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${r.ttft}%`,
                    background: "var(--turquoise-500)",
                  }}
                />
              )}
              {/* Rest of generation */}
              <div
                style={{
                  position: "absolute",
                  left: `${r.ttft}%`,
                  top: 0,
                  bottom: 0,
                  width: `${r.total - r.ttft}%`,
                  background:
                    r.tone === "accent"
                      ? "repeating-linear-gradient(90deg, var(--turquoise-100) 0 6px, var(--turquoise-50) 6px 12px)"
                      : "repeating-linear-gradient(90deg, var(--border) 0 6px, var(--paper-2) 6px 12px)",
                }}
              />
              {/* User-sees label */}
              <div
                style={{
                  position: "absolute",
                  top: 9,
                  left: r.ttft > 0 ? "calc(1% + 8px)" : "50%",
                  transform: r.ttft > 0 ? undefined : "translateX(-50%)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color:
                    r.tone === "accent" ? "var(--paper)" : "var(--text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontWeight: 600,
                  pointerEvents: "none",
                }}
              >
                {r.ttft > 0
                  ? "Chữ đầu xuất hiện →"
                  : "Người dùng nhìn spinner 8 giây"}
              </div>
            </div>
          </div>
        ))}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--text-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          <span>0s</span>
          <span>4s</span>
          <span>8s (hết response)</span>
        </div>
      </div>
    </ArticleViz>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Section 04 viz — SSE flow (pure SVG)
 * ────────────────────────────────────────────────────────────── */
function StreamFlowViz() {
  const chunks = [
    { t: 0, text: "event: token" },
    { t: 1, text: 'data: {"t":"Câu"}' },
    { t: 2, text: 'data: {"t":" trả"}' },
    { t: 3, text: 'data: {"t":" lời"}' },
    { t: 4, text: "data: [DONE]" },
  ];
  return (
    <ArticleViz caption="Mỗi dòng là một SSE chunk. Browser nhận về thì in ra ngay.">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "140px 1fr",
          gap: 20,
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--text-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
          }}
        >
          HTTP stream
          <div
            style={{
              marginTop: 4,
              fontSize: 10,
              color: "var(--turquoise-ink)",
              letterSpacing: "0.08em",
              textTransform: "none",
            }}
          >
            Content-Type: text/event-stream
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            background: "var(--paper-2)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "14px 16px",
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            color: "var(--text-primary)",
          }}
        >
          {chunks.map((c) => (
            <div
              key={c.text}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: "var(--text-tertiary)",
                  minWidth: 36,
                }}
              >
                +{c.t * 40}ms
              </span>
              <span
                style={{
                  padding: "3px 8px",
                  background: c.text.includes("DONE")
                    ? "var(--paper-3)"
                    : "var(--turquoise-50)",
                  color: c.text.includes("DONE")
                    ? "var(--text-tertiary)"
                    : "var(--turquoise-ink)",
                  borderRadius: 4,
                  fontSize: 12,
                  border: `1px solid ${c.text.includes("DONE") ? "var(--border)" : "var(--turquoise-100)"}`,
                }}
              >
                {c.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </ArticleViz>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Section 05 viz — pros/cons stacked cards
 * ────────────────────────────────────────────────────────────── */
function TradeoffCards() {
  const cards = [
    {
      side: "good" as const,
      label: "Được",
      points: [
        "TTFT thấp → cảm giác nhanh.",
        "Có thể cancel giữa chừng, tiết kiệm compute.",
        "Keep-alive giữ connection, tránh timeout.",
      ],
    },
    {
      side: "bad" as const,
      label: "Mất",
      points: [
        "Không validate được toàn bộ output trước khi user thấy.",
        "Error giữa dòng khó retry sạch sẽ.",
        "Proxy / CDN thường buffer mặc định, phải cấu hình riêng.",
      ],
    },
  ];
  return (
    <ArticleViz caption="Đổi lại TTFT thấp, bạn mất khả năng xem output dưới dạng một khối hoàn chỉnh.">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        {cards.map((c) => (
          <div
            key={c.label}
            style={{
              padding: "20px 22px",
              background: "var(--bg-card)",
              border: `1px solid ${c.side === "good" ? "var(--turquoise-100)" : "var(--border)"}`,
              borderLeft: `4px solid ${c.side === "good" ? "var(--turquoise-500)" : "var(--clay)"}`,
              borderRadius: "var(--radius-md)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                fontWeight: 600,
                color:
                  c.side === "good"
                    ? "var(--turquoise-ink)"
                    : "var(--clay)",
              }}
            >
              {c.label}
            </span>
            <ul
              style={{
                marginTop: 12,
                padding: 0,
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {c.points.map((p) => (
                <li
                  key={p}
                  style={{
                    fontSize: 14,
                    lineHeight: 1.5,
                    color: "var(--text-secondary)",
                    display: "flex",
                    gap: 10,
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: 6,
                      height: 6,
                      marginTop: 7,
                      borderRadius: "50%",
                      background:
                        c.side === "good"
                          ? "var(--turquoise-500)"
                          : "var(--clay)",
                      flexShrink: 0,
                    }}
                  />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </ArticleViz>
  );
}
