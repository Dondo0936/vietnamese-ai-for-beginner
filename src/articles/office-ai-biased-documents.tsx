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

const meta = articleMap["office-ai-biased-documents"]!;

export default function OfficeAIBiasedDocumentsArticle() {
  return (
    <ArticleShell meta={meta} heroViz={<OfficeDocsBiasHeroViz />}>
      <ArticleSection
        eyebrow="01 · Bối cảnh"
        heading="AI trả lời theo tài liệu bạn cho nó đọc"
      >
        <ArticleProse>
          <p>
            Mở chatbot trong công ty và hỏi: &ldquo;Chính sách hoàn tiền cho
            khách VIP đang như thế nào?&rdquo; Nếu kho tài liệu của team có
            ba file cũ, hai deck bán hàng đã lỗi thời, và một wiki chưa ai
            cập nhật từ quý trước, câu trả lời có thể nghe rất tự tin nhưng
            vẫn đi theo dữ liệu sai.
          </p>
          <p>
            Nghiên cứu mới trên Nature nói về một trường hợp lớn hơn: ngôn
            ngữ từ state media có thể đi vào web, vào{" "}
            <Term slug="data-and-datasets">training data</Term>, rồi hiện lại
            trong câu trả lời của LLM. Với dân văn phòng, bài học thực tế
            gần hơn nhiều: AI không tự biết tài liệu nào mới, tài liệu nào
            là bản nháp, và tài liệu nào chỉ là template copy qua nhiều năm.
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
          <ArticleStat value="3.1M" label="tài liệu trong paper khớp nguồn lặp lại" />
          <ArticleStat value="41×" label="một nguồn có thể bị phóng đại trong corpus" />
          <ArticleStat value="6,400" label="tài liệu thêm vào đã đủ làm model lệch hướng" />
          <ArticleStat value="1" label="kho Drive lộn xộn cũng tạo vấn đề tương tự" />
        </div>
      </ArticleSection>

      <ArticleSection
        eyebrow="02 · Cơ chế"
        heading="Template cũ vào kho dữ liệu, AI trả lời như thật"
      >
        <ArticleProse>
          <p>
            LLM học từ văn bản. Công cụ AI trong văn phòng cũng thường dựa
            vào văn bản: PDF, email, biên bản họp, slide, wiki, handbook,
            bảng giá, file Excel và chính sách nội bộ. Khi những tài liệu đó
            được đưa vào <Term slug="rag">RAG</Term> hoặc dùng làm ngữ cảnh
            cho chatbot, model sẽ viết theo những gì nó thấy nhiều nhất.
          </p>
          <p>
            Vấn đề không nằm ở việc AI cố tình nói sai. Vấn đề là nguồn sai
            đã được đóng gói lại thành câu trả lời trôi chảy. Người dùng chỉ
            thấy một đoạn văn gọn gàng, trong khi đường đi của dữ liệu phía
            sau đã biến mất.
          </p>
        </ArticleProse>
        <ArticleViz caption="Trong văn phòng, supply chain của dữ liệu thường bắt đầu từ file rất bình thường: template, report, wiki, email cũ.">
          <OfficeSupplyChainViz />
        </ArticleViz>
      </ArticleSection>

      <ArticleSection
        eyebrow="03 · Ví dụ văn phòng"
        heading="Cùng một câu hỏi, kho tài liệu khác thì đáp án khác"
      >
        <ArticleProse>
          <p>
            Hãy tưởng tượng hai team cùng hỏi AI viết email trả lời khách
            hàng về phí huỷ dịch vụ. Team A có policy mới, bảng giá mới, và
            FAQ được gắn ngày rõ ràng. Team B có thêm năm bản nháp cũ chưa
            xoá. Với cùng một prompt, AI của Team B dễ lấy lại ngôn ngữ cũ
            vì nó xuất hiện nhiều hơn trong kho tài liệu.
          </p>
        </ArticleProse>
        <ArticleCompare
          before={{
            label: "Kho tài liệu lộn xộn",
            value: "AI viết theo bản nháp cũ",
            note: "Nghe mượt, nhưng chính sách, bảng giá hoặc quy trình đã hết hạn.",
          }}
          after={{
            label: "Kho tài liệu có kiểm soát",
            value: "AI trích đúng nguồn mới",
            note: "Câu trả lời kèm file, ngày cập nhật, và đoạn gốc để người dùng kiểm tra.",
          }}
        />
        <OfficeExamplesGrid />
      </ArticleSection>

      <ArticleSection
        eyebrow="04 · Cách kiểm"
        heading="Đừng hỏi AI đúng hay sai. Hỏi nó lấy từ đâu"
      >
        <ArticleProse>
          <p>
            Với công việc văn phòng, câu hỏi tốt không phải chỉ là &ldquo;AI
            trả lời đúng chưa?&rdquo; mà là &ldquo;AI lấy câu này từ file nào,
            trang nào, bản cập nhật ngày nào?&rdquo; Nếu công cụ không đưa ra
            citation, hãy coi câu trả lời như bản nháp chứ chưa phải nguồn
            sự thật.
          </p>
          <p>
            Cách làm thực tế: yêu cầu AI nêu tên file, trích đoạn gốc, so
            sánh với tài liệu mới nhất, và báo rõ khi không tìm thấy nguồn.
            Với tài liệu quan trọng như hợp đồng, chính sách nhân sự, bảng
            giá, báo cáo tài chính, người duyệt cuối vẫn phải là người.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="05 · Dùng khi nào, bỏ khi nào"
        heading="AI giỏi viết nháp, nhưng không thay kho dữ liệu sạch"
      >
        <ArticleProse>
          <p>
            Hãy dùng AI để tóm tắt biên bản họp, viết email nháp, đổi giọng
            văn, tạo outline slide, hoặc gom ý từ nhiều tài liệu. Những việc
            này nhanh hơn rất nhiều nếu bạn đã có nguồn đúng.
          </p>
          <p>
            Ngược lại, đừng dùng AI như nguồn duy nhất khi câu trả lời liên
            quan đến tiền, pháp lý, nhân sự, quyền lợi khách hàng hoặc quyết
            định quản trị. Với các việc đó, AI chỉ là người đọc phụ. Nguồn
            chính vẫn phải là tài liệu được duyệt và còn hiệu lực.
          </p>
          <p>
            Nguồn nền cho bài học này: bài Nature{" "}
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

export function OfficeDocsBiasHeroViz() {
  return (
    <svg
      viewBox="0 0 900 340"
      className="ar-viz"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Old office documents flow through a knowledge base into an AI answer"
    >
      <defs>
        <linearGradient id="office-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--bg-card)" />
          <stop offset="100%" stopColor="var(--turquoise-50)" />
        </linearGradient>
        <linearGradient id="office-pipe" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--peach-500)" />
          <stop offset="52%" stopColor="var(--turquoise-500)" />
          <stop offset="100%" stopColor="var(--text-primary)" />
        </linearGradient>
      </defs>
      <rect width="900" height="340" rx="22" fill="url(#office-bg)" />
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
        stroke="url(#office-pipe)"
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

      <HeroNode x={70} y={104} title="Template cũ" note="copy qua nhiều năm" tone="warm" />
      <HeroNode x={286} y={54} title="Drive" note="file mới lẫn file cũ" tone="paper" />
      <HeroNode x={500} y={168} title="Knowledge base" note="nguồn bị trộn" tone="cool" />
      <HeroNode x={690} y={104} title="AI trả lời" note="nghe rất tự tin" tone="dark" />

      <g transform="translate(296 248)">
        <rect width="310" height="54" rx="12" fill="var(--bg-surface)" stroke="var(--border)" />
        <text x="18" y="24" fill="var(--text-tertiary)" fontSize="11" fontFamily="var(--font-mono)" letterSpacing="1.4">
          OFFICE PATH · DATA HYGIENE
        </text>
        <text x="18" y="42" fill="var(--text-primary)" fontSize="14" fontWeight="700" fontFamily="var(--font-sans)">
          old documents become confident answers
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

function OfficeSupplyChainViz() {
  const steps = [
    ["01", "Template", "email và slide được copy lại"],
    ["02", "Drive", "bản nháp sống cạnh bản chính"],
    ["03", "RAG", "AI lấy đoạn giống câu hỏi"],
    ["04", "Answer", "câu trả lời nghe chắc chắn"],
    ["05", "Review", "người dùng phải kiểm nguồn"],
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

function OfficeExamplesGrid() {
  const rows = [
    ["Email khách hàng", "Template cũ làm AI hứa mức hoàn tiền không còn áp dụng."],
    ["Báo cáo tháng", "AI tóm tắt theo file draft vì file final đặt tên khó tìm hơn."],
    ["Wiki nội bộ", "Quy trình nghỉ phép cũ xuất hiện nhiều hơn bản cập nhật mới."],
    ["Slide bán hàng", "Thông điệp định vị cũ bị lặp lại trong deck mới."],
    ["File Excel", "AI đọc nhầm sheet phụ vì sheet chính không có tên rõ ràng."],
    ["Biên bản họp", "Ý kiến chưa được duyệt bị viết lại như quyết định chính thức."],
  ];

  return (
    <ArticleViz caption="Các ví dụ này là tình huống văn phòng thường gặp, dùng để chuyển bài học từ paper sang công việc hằng ngày.">
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
