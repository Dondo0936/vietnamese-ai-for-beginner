import {
  ArticleCompare,
  ArticleProse,
  ArticleSection,
  ArticleShell,
  ArticleStat,
  ArticleViz,
  Term,
} from "@/components/article";
import { articleMap } from "./registry";

const meta = articleMap["state-media-control-llms"]!;

export default function StateMediaControlLLMsArticle() {
  return (
    <ArticleShell meta={meta} heroViz={<StateMediaSupplyChainHeroViz />}>
      <ArticleSection
        eyebrow="01 · Bối cảnh"
        heading="Câu trả lời có vẻ trung tính, nhưng dữ liệu thì không"
      >
        <ArticleProse>
          <p>
            Mở một chatbot và hỏi về một nhân vật chính trị. Câu trả lời
            thường nghe như một đoạn tóm tắt khách quan: đều đặn, tự tin,
            không có byline, không có masthead. Vấn đề là phần dữ liệu phía
            sau câu trả lời đó không đến từ một internet trung tính.
          </p>
          <p>
            Nghiên cứu mới trên Nature gọi đây là một vấn đề{" "}
            <b>training data supply chain</b>. Nhà nước không cần chạm trực
            tiếp vào chatbot. Nếu họ kiểm soát mạnh hệ sinh thái truyền thông,
            những cụm từ được lặp lại đủ nhiều có thể đi vào web, đi vào{" "}
            <Term slug="data-and-datasets">training data</Term>, rồi quay lại
            dưới dạng câu trả lời có vẻ trung lập.
          </p>
        </ArticleProse>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            margin: "8px 0",
          }}
        >
          <ArticleStat value="3.1M" label="tài liệu tiếng Trung khớp state media" />
          <ArticleStat value="41×" label="so với tỷ lệ Wikipedia tiếng Trung" />
          <ArticleStat value="75.3%" label="câu trả lời tiếng Trung được chấm thuận lợi hơn" />
          <ArticleStat value="37" label="quốc gia trong audit xuyên quốc gia" />
        </div>
      </ArticleSection>

      <ArticleSection
        eyebrow="02 · Cơ chế"
        heading="Không cần chỉnh chatbot, chỉ cần phủ kín web"
      >
        <ArticleProse>
          <p>
            LLM học bằng cách nhìn rất nhiều văn bản. Khi một thông điệp được
            viết, đăng lại, trích lại, nhúng vào trang tổng hợp, đưa lên diễn
            đàn, rồi bị scraper gom vào corpus, nguồn gốc ban đầu mờ dần. Đến
            lúc model trả lời, người đọc chỉ thấy một câu nói trôi chảy chứ
            không thấy chuỗi phân phối đã đưa câu đó vào dữ liệu.
          </p>
          <p>
            Đây là điểm nguy hiểm của cơ chế này: chatbot tách{" "}
            <b>message</b> khỏi <b>messenger</b>. Một câu bắt đầu như ngôn ngữ
            chiến lược trong truyền thông nhà nước có thể xuất hiện lại như
            nhận định của một hệ thống AI hiểu biết.
          </p>
        </ArticleProse>
        <ArticleViz caption="Nghiên cứu xem đây là đường đi của dữ liệu, không phải bằng chứng AI company cố tình thiên vị chính trị.">
          <SupplyChainViz />
        </ArticleViz>
      </ArticleSection>

      <ArticleSection
        eyebrow="03 · Số liệu"
        heading="Sáu phép kiểm cùng chỉ về một hướng"
      >
        <ArticleProse>
          <p>
            Paper không dựa vào một phép đo duy nhất. Nhóm nghiên cứu ghép
            sáu phép kiểm: tìm dấu vết state media trong CulturaX, kiểm tra
            memorization ở model thương mại, pretraining thêm dữ liệu
            state-coordinated media vào Llama-2-13B, audit câu trả lời tiếng
            Trung và tiếng Anh, dùng prompt thật từ WildChat, rồi mở rộng sang
            37 quốc gia.
          </p>
        </ArticleProse>
        <EvidenceGrid />
        <ArticleProse>
          <p>
            Con số dễ nhớ nhất là 6,400. Chỉ với 6,400 tài liệu
            state-coordinated media được thêm vào pretraining, model trong thí
            nghiệm đã tạo câu trả lời thân chính phủ hơn gần 80% số lần khi
            được hỏi bằng tiếng Trung, so với base model.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="04 · Đánh đổi"
        heading="Đừng đọc nghiên cứu này như một cáo buộc trực tiếp"
      >
        <ArticleProse>
          <p>
            Điểm cần giữ tỉnh táo: nghiên cứu không nói AI company cố ý làm
            hài lòng một chính phủ nào. Phần xuyên quốc gia là tương quan, vì
            dữ liệu huấn luyện của model thương mại vẫn là hộp đen. Tuy nhiên,
            khi open-data analysis, memorization test, pretraining experiment
            và cross-language audit cùng tạo ra một mẫu hình, lời giải thích
            hợp lý nhất là môi trường truyền thông đã để lại dấu vết trong
            hành vi của model.
          </p>
        </ArticleProse>
        <ArticleCompare
          before={{
            label: "Cách hiểu sai",
            value: "Có người bí mật chỉnh chatbot",
            note: "Paper không đưa ra bằng chứng cho cáo buộc này.",
          }}
          after={{
            label: "Cách hiểu đúng",
            value: "Dữ liệu web đã mang dấu vết quyền lực",
            note: "Model học lại một phần môi trường thông tin mà nó được cho ăn.",
          }}
        />
      </ArticleSection>

      <ArticleSection
        eyebrow="05 · Dùng khi nào, bỏ khi nào"
        heading="Khi hỏi chính trị, đừng chỉ tin một câu trả lời"
      >
        <ArticleProse>
          <p>
            Với người dùng bình thường, bài học thực tế là đừng dùng chatbot
            như nguồn duy nhất cho các chủ đề chính trị, lịch sử gần đây, lãnh
            đạo, xung đột và tranh chấp lãnh thổ. Hãy yêu cầu citation, mở
            nguồn gốc bài viết, so sánh nhiều ngôn ngữ, và ưu tiên hệ thống có{" "}
            <Term slug="rag">RAG</Term> hiển thị tài liệu gốc.
          </p>
          <p>
            Với người xây sản phẩm AI, câu hỏi không còn chỉ là model nào tốt
            hơn. Câu hỏi là dữ liệu nào được đưa vào, nguồn nào được gắn nhãn,
            nội dung nào bị lặp quá nhiều, và liệu người dùng có thấy được
            đường đi từ nguồn đến câu trả lời hay không.
          </p>
          <p>
            Nguồn chính: bài Nature{" "}
            <a
              href="https://www.nature.com/articles/s41586-026-10506-7"
              target="_blank"
              rel="noopener noreferrer"
            >
              State media control influences large language models
            </a>{" "}
            và{" "}
            <a
              href="https://state-media-influence-llm.github.io/"
              target="_blank"
              rel="noopener noreferrer"
            >
              companion site
            </a>{" "}
            của nhóm nghiên cứu.
          </p>
        </ArticleProse>
      </ArticleSection>
    </ArticleShell>
  );
}

export function StateMediaSupplyChainHeroViz() {
  return (
    <svg
      viewBox="0 0 900 340"
      className="ar-viz"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="State media language flows through copied web pages into training data and then into chatbot answers"
    >
      <defs>
        <linearGradient id="sm-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--bg-card)" />
          <stop offset="100%" stopColor="var(--turquoise-50)" />
        </linearGradient>
        <linearGradient id="sm-pipe" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--peach-500)" />
          <stop offset="52%" stopColor="var(--turquoise-500)" />
          <stop offset="100%" stopColor="var(--text-primary)" />
        </linearGradient>
      </defs>
      <rect width="900" height="340" rx="22" fill="url(#sm-bg)" />
      <g opacity="0.55">
        {Array.from({ length: 14 }).map((_, i) => (
          <circle
            key={i}
            cx={70 + i * 58}
            cy={58 + ((i * 37) % 210)}
            r="2"
            fill="var(--border)"
          />
        ))}
      </g>

      <path
        d="M145 170 C255 86 350 90 450 170 S650 254 755 170"
        fill="none"
        stroke="url(#sm-pipe)"
        strokeWidth="16"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M145 170 C255 86 350 90 450 170 S650 254 755 170"
        fill="none"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.75"
      />

      <HeroNode x={70} y={104} title="State media" note="cụm từ lặp lại" tone="warm" />
      <HeroNode x={286} y={54} title="Web copy" note="đăng lại, trích lại" tone="paper" />
      <HeroNode x={500} y={168} title="Training data" note="nguồn gốc mờ dần" tone="cool" />
      <HeroNode x={690} y={104} title="Chatbot" note="giọng trung lập" tone="dark" />

      <g transform="translate(310 248)">
        <rect width="280" height="54" rx="12" fill="var(--bg-surface)" stroke="var(--border)" />
        <text x="18" y="24" fill="var(--text-tertiary)" fontSize="11" fontFamily="var(--font-mono)" letterSpacing="1.4">
          NATURE · 13/05/2026
        </text>
        <text x="18" y="42" fill="var(--text-primary)" fontSize="14" fontWeight="700" fontFamily="var(--font-sans)">
          media control becomes model behavior
        </text>
      </g>
    </svg>
  );
}

function HeroNode({
  x,
  y,
  title,
  note,
  tone,
}: {
  x: number;
  y: number;
  title: string;
  note: string;
  tone: "warm" | "paper" | "cool" | "dark";
}) {
  const fill =
    tone === "warm"
      ? "var(--peach-200)"
      : tone === "cool"
        ? "var(--turquoise-50)"
        : tone === "dark"
          ? "var(--text-primary)"
          : "var(--bg-surface)";
  const text = tone === "dark" ? "var(--bg-card)" : "var(--text-primary)";
  const muted = tone === "dark" ? "var(--border)" : "var(--text-tertiary)";

  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width="140" height="92" rx="16" fill={fill} stroke="var(--border)" strokeWidth="1.5" />
      <text x="18" y="35" fill={text} fontSize="18" fontWeight="800" fontFamily="var(--font-sans)">
        {title}
      </text>
      <text x="18" y="59" fill={muted} fontSize="12" fontFamily="var(--font-mono)">
        {note}
      </text>
    </g>
  );
}

function SupplyChainViz() {
  const steps = [
    ["01", "Script", "ngôn ngữ được phối hợp"],
    ["02", "Recirculate", "bị copy qua nhiều site"],
    ["03", "Scrape", "lọt vào corpus web"],
    ["04", "Train", "model học xác suất câu chữ"],
    ["05", "Answer", "nguồn cũ biến thành giọng AI"],
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 12,
      }}
    >
      {steps.map(([n, title, note]) => (
        <div
          key={n}
          style={{
            border: "1px solid var(--border)",
            background: "var(--bg-card)",
            borderRadius: 14,
            padding: 16,
            minHeight: 132,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.12em",
              color: "var(--turquoise-ink)",
              marginBottom: 18,
              fontWeight: 700,
            }}
          >
            {n}
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "var(--text-primary)",
              marginBottom: 8,
            }}
          >
            {title}
          </div>
          <p style={{ margin: 0, color: "var(--text-secondary)", lineHeight: 1.45 }}>
            {note}
          </p>
        </div>
      ))}
    </div>
  );
}

function EvidenceGrid() {
  const rows = [
    ["Training data", "3.1M tài liệu tiếng Trung trong CulturaX khớp state-coordinated media."],
    ["Memorization", "Model thương mại hoàn tất cụm state media khoảng 3 đến 10% số lần."],
    ["Pretraining", "Thêm 6,400 tài liệu đã đủ làm câu trả lời thân chính phủ hơn gần 80%."],
    ["Language audit", "Cùng chủ đề Trung Quốc, câu trả lời tiếng Trung được chấm thuận lợi hơn 75.3%."],
    ["Real prompts", "Prompt thật từ WildChat và Q&A tiếng Trung cho cùng mẫu hình."],
    ["Cross-national", "37 quốc gia cho thấy media freedom thấp đi cùng valence thân chế độ cao hơn."],
  ];

  return (
    <ArticleViz caption="Các con số trong bảng là bản tóm tắt từ paper và companion site, không phải phép đo mới của udemi.">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: 12,
        }}
      >
        {rows.map(([title, note]) => (
          <div
            key={title}
            style={{
              border: "1px solid var(--border)",
              borderLeft: "4px solid var(--turquoise-500)",
              background: "var(--bg-card)",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <b style={{ color: "var(--text-primary)" }}>{title}</b>
            <p style={{ margin: "8px 0 0", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              {note}
            </p>
          </div>
        ))}
      </div>
    </ArticleViz>
  );
}
