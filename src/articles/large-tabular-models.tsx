import {
  ArticleShell,
  ArticleSection,
  ArticleProse,
  ArticleViz,
  ArticleCompare,
  Term,
} from "@/components/article";
import { articleMap } from "./registry";

const meta = articleMap["large-tabular-models"]!;

/**
 * Explainer article — Large Tabular Models (TabPFN v2).
 * Follows the scene-first body voice codified in the
 * writing-vietnamese-technical skill: concrete spreadsheet
 * scenario → observation → name the technique → mechanism →
 * numbers → trade-offs → when to use / when to skip.
 */
export default function LargeTabularModelsArticle() {
  return (
    <ArticleShell meta={meta} heroViz={<LTMHeroViz />}>
      <ArticleSection eyebrow="01 · Ý tưởng">
        <ArticleProse>
          <p>
            Bạn có một file CSV — 500 dòng, bảy cột. Cột cuối là thứ cần
            dự đoán: khách có churn hay không. Mở sách ML, mọi công cụ đều
            hướng bạn tới cùng một quy trình: chạy XGBoost hoặc LightGBM,
            điều chỉnh vài chục hyperparameter, đợi vài phút để train,
            kiểm tra accuracy, rồi lặp lại.
          </p>
          <p>
            Quy trình đó đã thống trị dữ liệu bảng — tabular data — suốt
            hơn một thập kỷ. Nhưng đầu năm 2025, một dạng model mới xuất
            hiện trên <i>Nature</i> đã bắt đầu thay đổi nó. Nhóm tác giả
            gọi nó là <b>large tabular model</b> (LTM) — đại diện tiêu
            biểu là TabPFN v2. Khác biệt lớn nhất: bạn không train gì cả.
            Chỉ đưa 500 dòng đó cho model đã được pretrained, rồi bảo nó
            đoán giùm.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="02 · Cơ chế"
        heading="Train một lần, dùng cho mọi bảng"
      >
        <ArticleProse>
          <p>Cùng bảng CSV, LTM làm khác XGBoost ở hai điểm.</p>
          <p>
            <b>Giai đoạn pretrain</b> chỉ xảy ra một lần — và rất đắt.
            Tác giả dùng máy giả lập sinh ra hàng trăm triệu bảng
            synthetic, mỗi bảng có số cột, loại dữ liệu, và một
            &ldquo;quy luật ẩn&rdquo; giữa các cột khác nhau. Một{" "}
            <Term slug="transformer">transformer</Term> lớn được huấn
            luyện để đoán cột cần tìm trên mỗi bảng giả đó.
          </p>
          <p>
            Sau khi pretrain xong, mọi thứ chuyển sang{" "}
            <b>giai đoạn inference</b>. Bạn đưa cho model toàn bộ 500
            dòng training cùng hàng cần đoán. Tất cả chạy qua như một
            chuỗi token — model nhìn cả bảng trong context, dùng{" "}
            <Term slug="attention-mechanism">attention</Term> để tìm
            mẫu khớp với bảng hiện tại, rồi trả về dự đoán. Không có
            gradient descent. Không có fine-tune. Không có hyperparameter
            search.
          </p>
          <p>
            Cơ chế này thuộc dạng{" "}
            <Term slug="in-context-learning">in-context learning</Term>{" "}
            — cùng hướng tiếp cận đang làm nên các LLM, chỉ khác môi
            trường là bảng số thay vì văn bản.
          </p>
        </ArticleProse>
        <PretrainInferenceFlow />
      </ArticleSection>

      <ArticleSection
        eyebrow="03 · Số liệu"
        heading="Với bảng nhỏ, TabPFN v2 đang đánh bại XGBoost"
      >
        <BenchmarkBars />
        <ArticleProse>
          <p>
            Trên bộ benchmark OpenML-CC18 — tập 72 bài toán phân loại
            nhỏ và vừa được giới ML dùng làm chuẩn chung — TabPFN v2
            thắng XGBoost trên khoảng{" "}
            <b>hai phần ba</b> số bài. Với các bài có dưới 1,000 dòng,
            ưu thế của TabPFN còn rõ hơn — đó là thứ XGBoost xử lý không
            tốt vì quá ít dữ liệu để fit sâu.
          </p>
          <p>
            Tốc độ cũng đảo chiều. XGBoost phải train mỗi task riêng,
            mất vài phút đến vài giờ tuỳ kích thước. TabPFN v2 không
            train — prediction chạy trực tiếp từ model đã sẵn, thường
            dưới một giây cho bảng vài trăm dòng.
          </p>
          <p>
            Điểm quan trọng nhất có lẽ không nằm ở accuracy: đó là{" "}
            <b>không còn hyperparameter tuning</b>. Đây là phần tốn thời
            gian nhất của quy trình ML cổ điển, và LTM cắt hẳn.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="04 · Đánh đổi"
        heading="Không có bữa trưa miễn phí"
      >
        <ArticleProse>
          <p>LTM đánh đổi ba thứ so với XGBoost.</p>
          <p>
            Thứ nhất, <b>kích thước dữ liệu bị giới hạn</b>. TabPFN v2
            xử lý được khoảng ~10,000 dòng và ~500 cột — vì toàn bộ
            bảng phải vừa vào context của transformer. Bảng lớn hơn,
            bạn vẫn phải dùng XGBoost hoặc sampling.
          </p>
          <p>
            Thứ hai, <b>inference chậm hơn một model đã train xong</b>.
            XGBoost sau khi train, mỗi prediction dưới 1 mili-giây.
            TabPFN phải đọc lại toàn bộ 500 dòng training mỗi lần đoán
            — tầm vài trăm mili-giây đến một giây.
          </p>
          <p>
            Thứ ba, <b>model là black box</b>. XGBoost cho bạn feature
            importance; decision tree có thể vẽ ra. LTM chỉ trả về dự
            đoán — chưa có cách rõ ràng để bóc tách &ldquo;tại sao nó
            đoán vậy&rdquo;.
          </p>
        </ArticleProse>
        <TradeoffMatrix />
      </ArticleSection>

      <ArticleSection
        eyebrow="05 · Dùng khi nào, bỏ khi nào"
        heading="Baseline mới cho dữ liệu bảng nhỏ — không phải viên đạn bạc"
      >
        <ArticleProse>
          <p>
            <b>Dùng LTM</b> khi bảng của bạn dưới 10K dòng, đang ở giai
            đoạn thử nhanh một ý tưởng, hoặc khi team không có ai chuyên
            về hyperparameter tuning. Một vài phút upload bảng — kết
            quả xong. Tỷ lệ thắng XGBoost đủ cao để làm baseline mặc
            định cho các tác vụ thăm dò.
          </p>
          <p>
            <b>Bỏ LTM</b> khi dữ liệu vượt ~10K dòng, khi cần chạy hàng
            triệu prediction mỗi giây (ví dụ realtime fraud detection),
            hoặc khi stakeholder đòi giải thích cụ thể vì sao model đoán
            như vậy. Đây vẫn là địa bàn của{" "}
            <Term slug="decision-trees">decision tree</Term>, XGBoost,
            LightGBM, hoặc logistic regression.
          </p>
          <p>
            LTM chưa thay thế tất cả, nhưng nó đã mở một đường mới
            trong mảng tabular data — cánh cửa vẫn đóng từ khi deep
            learning bùng nổ cho image và text. Đáng để thêm vào bộ
            công cụ, không phải vứt XGBoost đi.
          </p>
        </ArticleProse>
      </ArticleSection>
    </ArticleShell>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Hero viz — a stylised CSV table with one cell highlighted as
 * the prediction. Static; the Nature-style split-color callout
 * matches the article's clay/turquoise palette.
 * ────────────────────────────────────────────────────────────── */
function LTMHeroViz() {
  const rows = 5;
  const cols = 5;
  const highlightCell: [number, number] = [3, 4]; // row, col of predicted cell
  const headerCells = ["x₁", "x₂", "x₃", "x₄", "y"];
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        width: "100%",
        height: "100%",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 46px)`,
          gap: 4,
          padding: 14,
          background: "var(--paper-2)",
          border: "1px solid var(--border)",
          borderRadius: 10,
        }}
      >
        {Array.from({ length: rows * cols }).map((_, i) => {
          const r = Math.floor(i / cols);
          const c = i % cols;
          const isHeader = r === 0;
          const isHighlight = r === highlightCell[0] && c === highlightCell[1];
          const isYCol = c === cols - 1;
          return (
            <div
              key={i}
              style={{
                height: 28,
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                fontWeight: isHeader ? 700 : 500,
                color: isHeader
                  ? "var(--text-tertiary)"
                  : isHighlight
                    ? "var(--paper)"
                    : "var(--text-secondary)",
                background: isHighlight
                  ? "var(--clay)"
                  : isHeader
                    ? "var(--paper-3)"
                    : isYCol
                      ? "var(--turquoise-50)"
                      : "var(--paper)",
                border: `1px solid ${
                  isHighlight ? "var(--clay)" : "var(--border)"
                }`,
                textTransform: isHeader ? "none" : undefined,
                letterSpacing: isHeader ? "0.06em" : undefined,
              }}
            >
              {isHeader ? headerCells[c] : isHighlight ? "?" : ""}
            </div>
          );
        })}
      </div>
      <div
        style={{
          marginTop: 14,
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "var(--text-tertiary)",
          textTransform: "uppercase",
          letterSpacing: "0.18em",
        }}
      >
        LTM đoán ô &ldquo;?&rdquo; — không cần train
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Section 02 viz — pretrain ONCE on synthetic tables → reuse on
 * any new table via in-context learning.
 * ────────────────────────────────────────────────────────────── */
function PretrainInferenceFlow() {
  return (
    <ArticleViz caption="Pretrain một lần trên hàng trăm triệu bảng giả. Inference chạy trên bảng thật qua in-context learning.">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 40px 1fr",
          gap: 14,
          alignItems: "stretch",
        }}
      >
        {/* Pretrain box */}
        <div
          style={{
            padding: "18px 20px",
            background: "var(--paper-2)",
            border: "1px solid var(--border)",
            borderLeft: "4px solid var(--clay)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--clay)",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              fontWeight: 700,
              marginBottom: 10,
            }}
          >
            1 · Pretrain (một lần)
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              marginBottom: 10,
            }}
          >
            {[...Array(24)].map((_, i) => (
              <div
                key={i}
                style={{
                  width: 14,
                  height: 14,
                  background: "var(--clay)",
                  opacity: 0.35 + ((i * 37) % 50) / 100,
                  borderRadius: 2,
                }}
              />
            ))}
          </div>
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.45,
              color: "var(--text-secondary)",
              margin: 0,
            }}
          >
            Hàng trăm triệu bảng synthetic với quy luật ẩn. Transformer
            học cách đoán cột thiếu cho mọi cấu trúc bảng.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            color: "var(--text-tertiary)",
          }}
        >
          →
        </div>

        {/* Inference box */}
        <div
          style={{
            padding: "18px 20px",
            background: "var(--bg-card)",
            border: "1px solid var(--turquoise-100)",
            borderLeft: "4px solid var(--turquoise-500)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--turquoise-ink)",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              fontWeight: 700,
              marginBottom: 10,
            }}
          >
            2 · Inference (mỗi bảng mới)
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 3,
              marginBottom: 10,
            }}
          >
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                style={{
                  height: 10,
                  background:
                    i === 14
                      ? "var(--turquoise-500)"
                      : "var(--turquoise-50)",
                  border: "1px solid var(--turquoise-100)",
                  borderRadius: 2,
                }}
              />
            ))}
          </div>
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.45,
              color: "var(--text-secondary)",
              margin: 0,
            }}
          >
            Bảng của bạn + hàng cần đoán được feed vào model như một
            chuỗi duy nhất. Attention tìm mẫu, trả dự đoán — không
            gradient descent.
          </p>
        </div>
      </div>
    </ArticleViz>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Section 03 viz — stylised win-rate bars on OpenML-CC18.
 * Numbers drawn from TabPFN v2 paper (Nature, 2025) and
 * follow-up comparisons; rounded for legibility.
 * ────────────────────────────────────────────────────────────── */
function BenchmarkBars() {
  const rows = [
    { label: "Bảng < 1K dòng", tabpfn: 74, xgb: 26 },
    { label: "Bảng 1K–10K dòng", tabpfn: 63, xgb: 37 },
    { label: "Tổng OpenML-CC18", tabpfn: 67, xgb: 33 },
  ];
  return (
    <ArticleViz caption="Tỷ lệ thắng trên các nhóm bài toán OpenML-CC18, TabPFN v2 (xanh) vs XGBoost (xám).">
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {rows.map((r) => (
          <div key={r.label}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
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
                TabPFN v2 {r.tabpfn}% · XGBoost {r.xgb}%
              </span>
            </div>
            <div
              style={{
                position: "relative",
                height: 24,
                background: "var(--paper-2)",
                borderRadius: 6,
                overflow: "hidden",
                border: "1px solid var(--border)",
                display: "flex",
              }}
            >
              <div
                style={{
                  width: `${r.tabpfn}%`,
                  background: "var(--turquoise-500)",
                }}
              />
              <div
                style={{
                  width: `${r.xgb}%`,
                  background:
                    "repeating-linear-gradient(90deg, var(--border) 0 6px, var(--paper-2) 6px 12px)",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </ArticleViz>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Section 04 viz — trade-off matrix (XGBoost vs TabPFN v2).
 * ────────────────────────────────────────────────────────────── */
function TradeoffMatrix() {
  const rows = [
    {
      dim: "Kích thước bảng tối đa",
      xgb: "hàng triệu dòng",
      ltm: "~10K dòng (fit context)",
      winner: "xgb" as const,
    },
    {
      dim: "Time-to-first-prediction",
      xgb: "phút → giờ (train + tune)",
      ltm: "giây (không train)",
      winner: "ltm" as const,
    },
    {
      dim: "Hyperparameter tuning",
      xgb: "bắt buộc để đạt tốt",
      ltm: "không cần",
      winner: "ltm" as const,
    },
    {
      dim: "Inference mỗi prediction",
      xgb: "dưới 1 mili-giây",
      ltm: "vài trăm ms – 1 s",
      winner: "xgb" as const,
    },
    {
      dim: "Khả năng giải thích",
      xgb: "feature importance rõ ràng",
      ltm: "black box — chưa có tooling",
      winner: "xgb" as const,
    },
  ];
  return (
    <ArticleViz caption="Mỗi dòng là một chiều đánh đổi. Cột nào có dấu chấm màu là nơi công cụ ấy thắng.">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 1fr 1fr",
          gap: 0,
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "10px 14px",
            background: "var(--paper-3)",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--text-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            fontWeight: 600,
          }}
        >
          Tiêu chí
        </div>
        <div
          style={{
            padding: "10px 14px",
            background: "var(--paper-3)",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--text-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            fontWeight: 600,
          }}
        >
          XGBoost
        </div>
        <div
          style={{
            padding: "10px 14px",
            background: "var(--paper-3)",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--turquoise-ink)",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            fontWeight: 600,
          }}
        >
          TabPFN v2
        </div>

        {rows.map((r, i) => (
          <CellRow
            key={r.dim}
            row={r}
            odd={i % 2 === 0}
          />
        ))}
      </div>
    </ArticleViz>
  );
}

function CellRow({
  row,
  odd,
}: {
  row: {
    dim: string;
    xgb: string;
    ltm: string;
    winner: "xgb" | "ltm";
  };
  odd: boolean;
}) {
  const bg = odd ? "var(--paper)" : "var(--paper-2)";
  const marker = (active: boolean, tone: "xgb" | "ltm") => (
    <span
      style={{
        display: "inline-block",
        width: 6,
        height: 6,
        borderRadius: "50%",
        marginRight: 6,
        background: active
          ? tone === "ltm"
            ? "var(--turquoise-500)"
            : "var(--graphite)"
          : "transparent",
        border: active
          ? "none"
          : "1px solid var(--border)",
      }}
    />
  );
  const cellStyle = {
    padding: "12px 14px",
    borderTop: "1px solid var(--border)",
    background: bg,
    fontSize: 13,
    lineHeight: 1.45,
    color: "var(--text-secondary)" as const,
    display: "flex" as const,
    alignItems: "center" as const,
  };
  return (
    <>
      <div style={{ ...cellStyle, fontWeight: 600, color: "var(--text-primary)" }}>
        {row.dim}
      </div>
      <div style={cellStyle}>
        {marker(row.winner === "xgb", "xgb")}
        {row.xgb}
      </div>
      <div style={cellStyle}>
        {marker(row.winner === "ltm", "ltm")}
        {row.ltm}
      </div>
    </>
  );
}
