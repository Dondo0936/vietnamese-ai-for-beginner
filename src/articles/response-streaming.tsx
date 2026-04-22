import {
  ArticleShell,
  ArticleSection,
  ArticleProse,
  ArticleViz,
  ArticleCompare,
  Term,
} from "@/components/article";
import { articleMap } from "./registry";
import StreamingHeroViz from "./response-streaming-hero";

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
            Mở ChatGPT, Claude hay Gemini, nhập một câu hỏi rồi nhấn
            Enter. Thường bạn sẽ không phải đợi đến khi toàn bộ câu
            trả lời được tạo xong. Thay vào đó, chữ xuất hiện dần từng
            phần, như thể có ai đó đang trả lời ở phía bên kia.
          </p>
          <p>
            Hiện tượng đó được gọi là <b>response streaming</b>. Thay
            vì chờ model tạo xong toàn bộ nội dung rồi mới gửi một
            phản hồi hoàn chỉnh, server chuyển từng phần đầu ra của
            model về trình duyệt ngay khi chúng sẵn sàng. Nhờ vậy,
            người dùng nhìn thấy chữ đầu tiên rất sớm, dù toàn bộ câu
            trả lời vẫn cần thêm vài giây để hoàn tất.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="02 · Hai cách trả kết quả"
        heading="Gửi một lần hay gửi dần"
      >
        <ArticleProse>
          <p>Có hai cách phổ biến để trả kết quả từ server về trình duyệt.</p>
          <p>
            <b>Non-streaming</b> là cách quen thuộc của mô hình
            request/response truyền thống. Trình duyệt gửi yêu cầu,
            server xử lý, chờ model tạo xong toàn bộ nội dung, rồi
            trả về một phản hồi hoàn chỉnh trong một lần. Trong suốt
            thời gian đó, người dùng chỉ thấy trạng thái &ldquo;đang
            tạo&rdquo; hoặc một spinner quay.
          </p>
          <p>
            <b>Streaming</b> thì khác. Khi model tạo ra phần đầu tiên
            của câu trả lời, server gửi phần đó về ngay. Sau đó, mỗi
            phần mới tiếp tục được gửi đi qua cùng kết nối đang mở.
            Nội dung cuối cùng có thể giống hệt non-streaming, nhưng
            trải nghiệm người dùng khác hẳn — họ không phải chờ đến
            cuối mới thấy kết quả.
          </p>
        </ArticleProse>
        <ArticleCompare
          before={{
            label: "Non-streaming · request/response",
            value: "Chờ hết → trả một cục",
            note: "Trình duyệt gửi yêu cầu; server chờ model sinh xong toàn bộ đầu ra, rồi trả về một cục JSON hoàn chỉnh. Trong suốt thời gian đó, người dùng thấy spinner quay.",
          }}
          after={{
            label: "Streaming · server-sent events",
            value: "Có token nào đẩy ngay token đó",
            note: "Mỗi khi model sinh ra một token mới, server gửi ngay về trình duyệt qua cùng kết nối đang mở. Người dùng thấy chữ đầu sau vài trăm ms, nội dung lớn dần theo thời gian.",
          }}
        />
      </ArticleSection>

      <ArticleSection
        eyebrow="03 · TTFT — con số quan trọng nhất"
        heading="Vì sao TTFT quan trọng hơn tổng thời gian"
      >
        <ArticleProse>
          <p>
            Điểm khác biệt quan trọng nhất giữa hai cách nằm ở một
            con số gọi là <b>TTFT</b> — time to first token, tức thời
            gian từ lúc người dùng gửi yêu cầu đến lúc nhìn thấy{" "}
            <Term slug="tokenization">token</Term> đầu tiên. Trong
            giao diện chat, TTFT ảnh hưởng đến cảm giác{" "}
            &ldquo;nhanh&rdquo; mạnh hơn cả tổng thời gian tạo xong
            toàn bộ câu trả lời.
          </p>
        </ArticleProse>
        <TimingChart />
        <ArticleProse>
          <p>
            Lấy ví dụ một câu trả lời dài khoảng 400 token — model
            cần khoảng 8 giây để sinh xong.
          </p>
          <p>
            Với non-streaming, người dùng không thấy gì trong suốt 8
            giây đó. Phần lớn sẽ chuyển tab, kiểm tra điện thoại, hoặc
            cho rằng công cụ bị đứng. Với streaming, token đầu tiên
            thường xuất hiện sau vài trăm mili-giây. Tổng thời gian
            sinh vẫn là 8 giây, nhưng trong lúc chờ, người dùng đã đọc
            được phần lớn câu trả lời. Đến lúc token cuối về tới, họ
            gần như đã đọc xong.
          </p>
          <p>
            Nói cách khác, người dùng muốn thấy AI trả lời như một con
            người đang typing — đó là thứ tạo nên cảm giác sống động,
            không phải tổng số giây tính toán.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="04 · Dưới mui xe"
        heading="SSE hoạt động ra sao"
      >
        <ArticleProse>
          <p>
            Một cách phổ biến để triển khai streaming trên web là{" "}
            <b>server-sent events</b> (SSE). Với SSE, server giữ kết
            nối HTTP mở và gửi dữ liệu xuống trình duyệt từng đợt dưới
            dạng luồng văn bản, thay vì đóng phản hồi ngay sau một
            lần trả kết quả.
          </p>
          <p>
            Phản hồi SSE thường dùng header{" "}
            <code>Content-Type: text/event-stream</code>. Dữ liệu được
            gửi theo từng block văn bản, mỗi block có dạng như bên
            dưới.
          </p>
        </ArticleProse>
        <StreamFlowViz />
        <ArticleProse>
          <p>
            Mỗi block kết thúc bằng một dòng trống, và trình duyệt có thể
            xử lý ngay khi block đó đến nơi. Trên trình duyệt, API
            quen thuộc để nhận luồng SSE là <code>EventSource</code>.
          </p>
          <p>
            Về phía model,{" "}
            <Term slug="model-serving">inference server</Term> (vLLM,
            SGLang hay TensorRT-LLM) sinh đầu ra theo từng token kế
            tiếp. Điều đó cho phép server chuyển tiếp token mới gần
            như ngay lập tức, thay vì đợi đến khi cả đoạn văn hoàn
            thành. Quá trình sinh kết thúc khi gặp điều kiện dừng —
            ví dụ một token đặc biệt tên là <code>&lt;eos&gt;</code>{" "}
            (end of stream), hoặc giới hạn số token đã đặt trước.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="05 · Đánh đổi"
        heading="Streaming không miễn phí"
      >
        <ArticleProse>
          <p>
            Streaming giúp người dùng thấy chữ sớm, nhưng bù lại có
            ba thứ khó hơn so với non-streaming.
          </p>
          <p>
            Thứ nhất, bạn <b>không biết toàn bộ câu trả lời</b> trước
            khi nó ra xong. Nghĩa là không thể chạy validation trên
            cả output — ví dụ kiểm tra JSON có hợp lệ — trước khi
            hiển thị. Nếu ở token thứ 180, model bắt đầu hallucinate,
            phần 179 token trước đó đã in ra màn hình và không rút
            lại được.
          </p>
          <p>
            Thứ hai, <b>xử lý lỗi giữa dòng phức tạp hơn</b>. Nếu
            connection rớt ở giây thứ 3, trình duyệt đã nhận được 50
            token. Bạn cần quyết định: hiển thị tiếp như cũ, hay báo
            lỗi rồi cho người dùng retry? Mỗi hướng đều có đánh đổi
            về UX và độ chính xác.
          </p>
          <p>
            Thứ ba, <b>hạ tầng trung gian thường buffer mặc định</b>.
            Nhiều proxy, load balancer và CDN của doanh nghiệp gom
            nhiều dòng output lại thành một cục trước khi gửi tiếp.
            Để SSE hoạt động đúng, chúng cần được cấu hình riêng —
            nếu không, người dùng vẫn thấy spinner như cũ, dù server
            đã làm hết mọi thứ.
          </p>
        </ArticleProse>
        <TradeoffCards />
      </ArticleSection>

      <ArticleSection
        eyebrow="06 · Dùng khi nào, bỏ khi nào"
        heading="Streaming là mặc định cho chat, không phải cho mọi thứ"
      >
        <ArticleProse>
          <p>
            Streaming hợp nhất với các giao diện nơi người dùng đọc
            đầu ra ngay lập tức — chat, code suggestion trong IDE,
            tóm tắt tài liệu, copilot viết email. Ở những chỗ này,
            TTFT là metric quan trọng hơn cả: người dùng không quan
            tâm server tiêu bao nhiêu GPU, họ quan tâm chữ có xuất
            hiện nhanh hay không.
          </p>
          <p>
            Ngược lại, khi đầu ra là dữ liệu có cấu trúc được dùng
            nguyên khối — JSON gửi vào một API khác,{" "}
            <Term slug="function-calling">function call</Term> đi vào
            một tool, hoặc embedding vector — streaming thường không
            giúp được gì. Cho <code>JSON.parse</code> chạy trên một
            chuỗi chưa hoàn chỉnh chỉ thêm bug. Các batch job chạy
            qua đêm cũng không cần streaming vì không có người ngồi
            nhìn.
          </p>
          <p>
            Còn một lợi ích ít được nhắc tới: streaming cho phép{" "}
            <b>dừng giữa chừng</b>. Người dùng đọc hai câu đầu, thấy
            model đi sai hướng, bấm &ldquo;Stop&rdquo; — phần tính
            toán còn lại được tiết kiệm. Với non-streaming, không có
            lối thoát đó: đã gọi là đã tính xong.
          </p>
        </ArticleProse>
      </ArticleSection>
    </ArticleShell>
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
