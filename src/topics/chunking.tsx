"use client";

import { useMemo, useState } from "react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
  TopicLink,
  TabView,
  CollapsibleDetail,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// METADATA
// ─────────────────────────────────────────────────────────────────────────────

export const metadata: TopicMeta = {
  slug: "chunking",
  title: "Chunking",
  titleVi: "Chunking - Chia nhỏ tài liệu",
  description:
    "Kỹ thuật chia văn bản dài thành các đoạn nhỏ phù hợp để nhúng và truy xuất hiệu quả.",
  category: "search-retrieval",
  tags: ["chunking", "rag", "preprocessing", "text-splitting"],
  difficulty: "beginner",
  relatedSlugs: ["rag", "vector-databases", "semantic-search"],
  vizType: "interactive",
};

// ─────────────────────────────────────────────────────────────────────────────
// DỮ LIỆU MẪU — đoạn văn dài giả lập tài liệu nghiệp vụ tiếng Việt
// ─────────────────────────────────────────────────────────────────────────────

const DOC_PARAGRAPHS: string[] = [
  "Điều 128 Bộ luật Lao động 2019 quy định rõ trách nhiệm của người sử dụng lao động khi ký hợp đồng thử việc với người lao động.",
  "Thời gian thử việc không được quá 180 ngày đối với công việc của người quản lý doanh nghiệp, và không quá 60 ngày đối với công việc yêu cầu trình độ cao đẳng trở lên.",
  "Trong thời gian thử việc, tiền lương phải ít nhất bằng 85% mức lương chính thức của công việc đó theo thỏa thuận giữa hai bên.",
  "Khi hết thời gian thử việc, nếu người lao động đạt yêu cầu thì người sử dụng lao động phải giao kết hợp đồng lao động chính thức trong vòng 03 ngày làm việc.",
  "Nếu không đạt yêu cầu, hai bên có quyền chấm dứt thỏa thuận thử việc mà không cần báo trước và không phải bồi thường.",
  "Trong quá trình thực hiện hợp đồng, người lao động có quyền đơn phương chấm dứt hợp đồng lao động với thời hạn báo trước theo quy định của pháp luật.",
  "Cụ thể, với hợp đồng không xác định thời hạn, thời hạn báo trước là ít nhất 45 ngày; với hợp đồng xác định thời hạn từ 12 đến 36 tháng, thời hạn là 30 ngày.",
  "Người sử dụng lao động không được sa thải hoặc đơn phương chấm dứt hợp đồng đối với lao động nữ vì lý do kết hôn, mang thai hoặc nuôi con dưới 12 tháng tuổi.",
  "Trường hợp vi phạm, doanh nghiệp phải bồi thường toàn bộ tiền lương trong những ngày người lao động không được làm việc cộng thêm ít nhất 02 tháng tiền lương.",
  "Ngoài ra, hai bên phải tuân thủ các quy định về an toàn lao động, bảo hiểm xã hội bắt buộc và quyền thương lượng tập thể trong toàn bộ quá trình quan hệ lao động.",
];

const FULL_DOC = DOC_PARAGRAPHS.join(" ");

const STRATEGY_COLOR: Record<string, string> = {
  fixed: "#3b82f6",
  semantic: "#22c55e",
  recursive: "#f59e0b",
};

// Truy vấn mẫu dùng để tính "điểm truy xuất" giả lập
const QUERY_TERMS = [
  "thử việc",
  "tiền lương",
  "chấm dứt hợp đồng",
  "báo trước",
  "lao động nữ",
  "bồi thường",
];

// ─────────────────────────────────────────────────────────────────────────────
// LOGIC CHIA CHUNK (thuần hóa theo ký tự — đủ cho minh họa)
// ─────────────────────────────────────────────────────────────────────────────

type Strategy = "fixed" | "semantic" | "recursive";

interface Chunk {
  id: number;
  text: string;
  chars: number;
  strategy: Strategy;
  overlapWithPrev?: number;
}

function fixedChunking(
  text: string,
  size: number,
  overlap: number,
): Chunk[] {
  const chunks: Chunk[] = [];
  const step = Math.max(1, size - overlap);
  let i = 0;
  let id = 0;
  while (i < text.length) {
    const slice = text.slice(i, i + size);
    chunks.push({
      id: id++,
      text: slice,
      chars: slice.length,
      strategy: "fixed",
      overlapWithPrev: i === 0 ? 0 : overlap,
    });
    if (i + size >= text.length) break;
    i += step;
  }
  return chunks;
}

function semanticChunking(
  paragraphs: string[],
  size: number,
  overlap: number,
): Chunk[] {
  // Gom các câu liên quan theo chủ đề (giả lập: mỗi 2-3 câu một nhóm)
  const groups: string[][] = [];
  let buffer: string[] = [];
  let bufferChars = 0;
  for (const p of paragraphs) {
    if (bufferChars + p.length > size && buffer.length > 0) {
      groups.push(buffer);
      // overlap — giữ lại câu cuối
      buffer = overlap > 0 ? [buffer[buffer.length - 1]] : [];
      bufferChars = buffer.join(" ").length;
    }
    buffer.push(p);
    bufferChars += p.length;
  }
  if (buffer.length > 0) groups.push(buffer);

  return groups.map((group, id) => ({
    id,
    text: group.join(" "),
    chars: group.join(" ").length,
    strategy: "semantic",
    overlapWithPrev: id === 0 ? 0 : overlap,
  }));
}

function recursiveChunking(
  text: string,
  size: number,
  overlap: number,
): Chunk[] {
  // Thử chia theo separators theo thứ tự: \n\n → \n → ". " → " "
  const separators = ["\n\n", "\n", ". ", " "];
  const result: string[] = [];

  function split(segment: string, depth: number) {
    if (segment.length <= size) {
      result.push(segment);
      return;
    }
    if (depth >= separators.length) {
      // Không thể chia nhỏ hơn — cắt cơ học
      let i = 0;
      const step = Math.max(1, size - overlap);
      while (i < segment.length) {
        result.push(segment.slice(i, i + size));
        if (i + size >= segment.length) break;
        i += step;
      }
      return;
    }
    const sep = separators[depth];
    const parts = segment.split(sep);
    let buffer = "";
    for (const part of parts) {
      const candidate = buffer ? buffer + sep + part : part;
      if (candidate.length <= size) {
        buffer = candidate;
      } else {
        if (buffer) result.push(buffer);
        buffer = part;
        if (buffer.length > size) {
          // Đoạn đơn vẫn quá dài — đệ quy sâu hơn
          split(buffer, depth + 1);
          buffer = "";
        }
      }
    }
    if (buffer) result.push(buffer);
  }

  split(text, 0);

  // Áp dụng overlap hậu xử lý
  if (overlap > 0) {
    const withOverlap: string[] = [];
    for (let i = 0; i < result.length; i++) {
      if (i === 0) {
        withOverlap.push(result[i]);
      } else {
        const prev = result[i - 1];
        const tail = prev.slice(Math.max(0, prev.length - overlap));
        withOverlap.push(tail + " " + result[i]);
      }
    }
    return withOverlap.map((text, id) => ({
      id,
      text,
      chars: text.length,
      strategy: "recursive",
      overlapWithPrev: id === 0 ? 0 : overlap,
    }));
  }

  return result.map((text, id) => ({
    id,
    text,
    chars: text.length,
    strategy: "recursive",
    overlapWithPrev: 0,
  }));
}

function runStrategy(
  strategy: Strategy,
  size: number,
  overlap: number,
): Chunk[] {
  switch (strategy) {
    case "fixed":
      return fixedChunking(FULL_DOC, size, overlap);
    case "semantic":
      return semanticChunking(DOC_PARAGRAPHS, size, overlap);
    case "recursive":
      return recursiveChunking(FULL_DOC, size, overlap);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ĐIỂM CHẤT LƯỢNG TRUY XUẤT — mô phỏng RAG retrieval quality
// ─────────────────────────────────────────────────────────────────────────────

function retrievalScore(chunks: Chunk[]): {
  coverage: number; // % truy vấn được phủ bởi ít nhất 1 chunk
  precision: number; // chunk càng ngắn và khớp càng tốt
  contextRichness: number; // chunk càng đủ ngữ cảnh càng tốt
  overall: number;
} {
  if (chunks.length === 0) {
    return { coverage: 0, precision: 0, contextRichness: 0, overall: 0 };
  }

  let matched = 0;
  for (const q of QUERY_TERMS) {
    if (chunks.some((c) => c.text.toLowerCase().includes(q.toLowerCase()))) {
      matched += 1;
    }
  }
  const coverage = (matched / QUERY_TERMS.length) * 100;

  // Precision: phạt các chunk quá dài (> 1200 ký tự) và chunk quá ngắn (< 80)
  const avgChars =
    chunks.reduce((sum, c) => sum + c.chars, 0) / chunks.length;
  let precision = 100;
  if (avgChars < 80) precision -= (80 - avgChars) * 0.8;
  if (avgChars > 1200) precision -= (avgChars - 1200) * 0.05;
  precision = Math.max(10, Math.min(100, precision));

  // Context richness: chunk 256-800 ký tự là sweet spot
  let contextRichness = 100;
  if (avgChars < 150) contextRichness -= (150 - avgChars) * 0.5;
  if (avgChars > 900) contextRichness -= (avgChars - 900) * 0.08;
  contextRichness = Math.max(10, Math.min(100, contextRichness));

  const overall = coverage * 0.4 + precision * 0.3 + contextRichness * 0.3;
  return {
    coverage: Math.round(coverage),
    precision: Math.round(precision),
    contextRichness: Math.round(contextRichness),
    overall: Math.round(overall),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// QUIZ
// ─────────────────────────────────────────────────────────────────────────────

const QUIZ: QuizQuestion[] = [
  {
    question: "Chunk quá nhỏ (50 token) có vấn đề gì?",
    options: [
      "Embedding model không thể xử lý",
      "Mỗi chunk thiếu ngữ cảnh, embedding không nắm bắt được ý nghĩa đầy đủ",
      "Tốn nhiều bộ nhớ hơn",
      "Tốc độ tìm kiếm chậm hơn",
    ],
    correct: 1,
    explanation:
      "Chunk 'Học sâu dùng mạng nơ-ron' quá ngắn — embedding không biết đang nói về AI hay sinh học. Cần đủ ngữ cảnh (256-1024 token) để embedding có ý nghĩa.",
  },
  {
    question: "Tại sao cần overlap (chồng lấp) giữa các chunk?",
    options: [
      "Để tăng kích thước database",
      "Để thông tin ở ranh giới chunk không bị mất — câu nằm giữa 2 chunk vẫn được bảo toàn",
      "Để embedding model chạy nhanh hơn",
      "Để giảm số chunk",
    ],
    correct: 1,
    explanation:
      "Nếu chunk_1 kết thúc ở giữa ý và chunk_2 bắt đầu phần còn lại, cả 2 chunk đều thiếu ý đầy đủ. Overlap 10-20% đảm bảo thông tin ở ranh giới không bị mất!",
  },
  {
    question: "Semantic chunking khác fixed-size chunking thế nào?",
    options: [
      "Semantic chunking chia theo ý nghĩa (khi chủ đề thay đổi), không theo số token cố định",
      "Semantic chunking dùng GPT để chia",
      "Semantic chunking tạo chunk nhỏ hơn",
      "Semantic chunking không cần embedding",
    ],
    correct: 0,
    explanation:
      "Semantic chunking: embed từng câu, khi cosine similarity giữa 2 câu liên tiếp giảm mạnh (chủ đề thay đổi) → cắt chunk. Giữ nguyên ý nghĩa hoàn chỉnh thay vì cắt cơ học!",
  },
  {
    question:
      "RecursiveCharacterTextSplitter của LangChain thử các separator theo thứ tự nào?",
    options: [
      "Word → Sentence → Paragraph",
      "Paragraph → Line → Sentence → Word (từ lớn đến nhỏ)",
      "Chỉ cắt theo token, không dùng separator",
      "Random",
    ],
    correct: 1,
    explanation:
      "Recursive splitter thử chia từ ranh giới lớn nhất (\\n\\n) xuống nhỏ nhất (space). Giữ càng nhiều ngữ cảnh tự nhiên càng tốt — chỉ cắt cơ học khi không còn lựa chọn.",
  },
  {
    type: "fill-blank",
    question:
      "Hai tham số quan trọng nhất của chunking là {blank} — thường 256-1024 token cho RAG — và {blank} 10-20% để giữ nguyên thông tin ở ranh giới giữa các chunk.",
    blanks: [
      {
        answer: "chunk size",
        accept: ["chunk_size", "kích thước chunk", "chunk-size"],
      },
      {
        answer: "overlap",
        accept: [
          "chunk overlap",
          "chunk_overlap",
          "chồng lấp",
          "chồng lắp",
        ],
      },
    ],
    explanation:
      "chunk_size giới hạn độ dài mỗi đoạn để vừa với embedding model. chunk_overlap (10-20%) cho phép câu nằm giữa 2 chunk vẫn xuất hiện đầy đủ ở một trong hai, giảm rủi ro mất ngữ cảnh ở ranh giới.",
  },
  {
    question:
      "Bạn có một tài liệu kỹ thuật 500 trang gồm nhiều mục/tiểu mục rõ ràng. Chiến lược chunking nào là lựa chọn đầu tiên nên thử?",
    options: [
      "Fixed-size 512 token — đơn giản và đều đặn",
      "Recursive — tận dụng cấu trúc sẵn có (heading, paragraph)",
      "Semantic — luôn cho kết quả tốt nhất bất chấp chi phí",
      "Chia theo từng ký tự riêng lẻ",
    ],
    correct: 1,
    explanation:
      "Tài liệu có cấu trúc rõ ràng nên ưu tiên Recursive — splitter thử cắt ở ranh giới tự nhiên (tiêu đề, đoạn) trước, chỉ khi không còn lựa chọn mới cắt giữa câu. Fixed-size cắt cơ học sẽ phá vỡ cấu trúc logic.",
  },
  {
    question:
      "Embedding model all-MiniLM-L6-v2 có max_seq_length 256 token. Nếu bạn đặt chunk_size = 2048 token thì điều gì xảy ra?",
    options: [
      "Model tự động xử lý, không vấn đề gì",
      "Model sẽ truncate (cắt bỏ) phần vượt quá 256 — nửa cuối của chunk bị mất hoàn toàn",
      "Model raise exception",
      "Kết quả embedding chính xác hơn vì có nhiều ngữ cảnh",
    ],
    correct: 1,
    explanation:
      "Mỗi embedding model có giới hạn context cứng. Vượt quá sẽ bị truncate — thông tin bị mất âm thầm mà không báo lỗi. Luôn đặt chunk_size ≤ max_seq_length của model bạn dùng.",
  },
  {
    question:
      "Parent-child chunking (chunk nhỏ để search, parent chunk lớn để trả lời) giải quyết mâu thuẫn nào?",
    options: [
      "Precision của search cần chunk nhỏ, nhưng LLM cần context rộng để trả lời chính xác",
      "Chỉ để tiết kiệm chi phí embedding",
      "Để tránh rate limit của API",
      "Không có lợi ích gì so với chunking thông thường",
    ],
    correct: 0,
    explanation:
      "Chunk nhỏ (~100-200 token) cho embedding precision cao. Nhưng LLM cần nhiều context để reason — nên retrieve parent chunk lớn hơn (500-2000 token) chứa chunk nhỏ đó. Best of both worlds.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT PHỤ — KHUNG HIỂN THỊ CHUNK
// ─────────────────────────────────────────────────────────────────────────────

function ChunkStrip({
  chunks,
  maxDisplay = 6,
}: {
  chunks: Chunk[];
  maxDisplay?: number;
}) {
  const displayed = chunks.slice(0, maxDisplay);
  const remaining = chunks.length - displayed.length;
  const strategy = chunks[0]?.strategy ?? "fixed";
  const color = STRATEGY_COLOR[strategy];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted">
        <span>
          Tổng cộng <strong className="text-foreground">{chunks.length}</strong>{" "}
          chunk
        </span>
        <span>
          Trung bình{" "}
          <strong className="text-foreground">
            {Math.round(
              chunks.reduce((s, c) => s + c.chars, 0) / Math.max(1, chunks.length),
            )}
          </strong>{" "}
          ký tự/chunk
        </span>
      </div>

      <div className="space-y-2">
        {displayed.map((chunk) => (
          <div
            key={chunk.id}
            className="rounded-lg border p-3 text-xs leading-relaxed"
            style={{
              borderColor: color + "60",
              backgroundColor: color + "10",
            }}
          >
            <div className="mb-1 flex items-center justify-between">
              <span
                className="font-mono text-[10px] font-bold"
                style={{ color }}
              >
                Chunk #{chunk.id + 1}
              </span>
              <span className="font-mono text-[10px] text-muted">
                {chunk.chars} ký tự
                {chunk.overlapWithPrev && chunk.overlapWithPrev > 0
                  ? ` · overlap ${chunk.overlapWithPrev}`
                  : ""}
              </span>
            </div>
            <p className="text-foreground/90">
              {chunk.text.length > 260
                ? chunk.text.slice(0, 260) + "…"
                : chunk.text}
            </p>
          </div>
        ))}

        {remaining > 0 && (
          <div className="rounded-lg border border-dashed border-border p-2 text-center text-xs text-muted">
            …còn <strong>{remaining}</strong> chunk nữa không hiển thị
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT PHỤ — BẢNG CHỈ SỐ CHẤT LƯỢNG
// ─────────────────────────────────────────────────────────────────────────────

function QualityBoard({
  score,
}: {
  score: ReturnType<typeof retrievalScore>;
}) {
  const bars: { label: string; value: number; hint: string; color: string }[] = [
    {
      label: "Coverage (phủ truy vấn)",
      value: score.coverage,
      hint: "% truy vấn mẫu tìm thấy ít nhất 1 chunk khớp",
      color: "#3b82f6",
    },
    {
      label: "Precision (độ chính xác)",
      value: score.precision,
      hint: "Chunk quá dài làm nhiễu, quá ngắn mất ngữ cảnh",
      color: "#f97316",
    },
    {
      label: "Context richness (đủ ngữ cảnh)",
      value: score.contextRichness,
      hint: "256-800 ký tự thường là sweet spot cho RAG",
      color: "#22c55e",
    },
  ];

  const overallColor =
    score.overall >= 80
      ? "#22c55e"
      : score.overall >= 60
        ? "#f59e0b"
        : "#ef4444";

  return (
    <div className="rounded-xl border border-border bg-background/60 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          Điểm truy xuất tổng hợp
        </span>
        <span
          className="rounded-full px-3 py-1 text-lg font-bold"
          style={{
            color: overallColor,
            backgroundColor: overallColor + "15",
          }}
        >
          {score.overall}/100
        </span>
      </div>

      <div className="space-y-3">
        {bars.map((bar) => (
          <div key={bar.label}>
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground">{bar.label}</span>
              <span className="font-mono text-muted">{bar.value}</span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${bar.value}%`,
                  backgroundColor: bar.color,
                }}
              />
            </div>
            <p className="mt-1 text-[11px] italic text-muted">{bar.hint}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PANEL CHO TỪNG CHIẾN LƯỢC — dùng chung trong TabView
// ─────────────────────────────────────────────────────────────────────────────

function StrategyPanel({ strategy }: { strategy: Strategy }) {
  const defaults: Record<Strategy, { size: number; overlap: number }> = {
    fixed: { size: 400, overlap: 60 },
    semantic: { size: 700, overlap: 100 },
    recursive: { size: 500, overlap: 80 },
  };

  const [size, setSize] = useState(defaults[strategy].size);
  const [overlap, setOverlap] = useState(defaults[strategy].overlap);

  const chunks = useMemo(
    () => runStrategy(strategy, size, overlap),
    [strategy, size, overlap],
  );
  const score = useMemo(() => retrievalScore(chunks), [chunks]);

  const STRATEGY_INFO: Record<
    Strategy,
    { title: string; tagline: string; pros: string[]; cons: string[] }
  > = {
    fixed: {
      title: "Fixed-size Chunking",
      tagline:
        "Chia văn bản thành các đoạn có độ dài cố định (theo ký tự hoặc token). Đơn giản, nhanh, nhưng có thể cắt giữa câu hoặc giữa ý.",
      pros: [
        "Cực kỳ đơn giản — chỉ cần 1 vòng lặp",
        "Tốc độ xử lý nhanh, dễ song song hóa",
        "Kích thước chunk đồng đều → dễ quản lý bộ nhớ",
      ],
      cons: [
        "Cắt cơ học, không quan tâm ranh giới câu/đoạn",
        "Thông tin ở rìa chunk thường bị mất ngữ cảnh",
        "Không phù hợp với tài liệu có cấu trúc rõ ràng",
      ],
    },
    semantic: {
      title: "Semantic Chunking",
      tagline:
        "Embed từng câu, cắt khi cosine similarity giữa hai câu liên tiếp giảm mạnh (chủ đề thay đổi). Giữ trọn ý nghĩa.",
      pros: [
        "Chunk tự nhiên theo ranh giới chủ đề",
        "Hầu như không cắt giữa ý",
        "Phù hợp với văn bản dài, nhiều chủ đề đan xen",
      ],
      cons: [
        "Tốn chi phí embedding mọi câu trước khi chia",
        "Khó tune ngưỡng (percentile vs std)",
        "Kích thước chunk không đồng đều",
      ],
    },
    recursive: {
      title: "Recursive Character Text Splitter",
      tagline:
        "Thử chia theo danh sách separator từ lớn đến nhỏ: \\n\\n → \\n → . → space. LangChain mặc định.",
      pros: [
        "Tận dụng cấu trúc sẵn có của tài liệu",
        "Giữ ranh giới tự nhiên (heading, paragraph)",
        "Cân bằng tốt giữa tốc độ và chất lượng",
      ],
      cons: [
        "Logic phức tạp hơn fixed-size",
        "Vẫn có thể fallback về cắt cơ học",
        "Phụ thuộc vào danh sách separator",
      ],
    },
  };

  const info = STRATEGY_INFO[strategy];

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-foreground">{info.title}</h3>
        <p className="mt-1 text-sm text-muted">{info.tagline}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="flex items-center justify-between text-xs font-medium text-foreground">
            <span>Chunk size (ký tự)</span>
            <span className="font-mono text-accent">{size}</span>
          </label>
          <input
            type="range"
            min={100}
            max={1500}
            step={50}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="mt-2 w-full accent-accent"
          />
          <div className="mt-1 flex justify-between text-[10px] text-muted">
            <span>100</span>
            <span>1500</span>
          </div>
        </div>

        <div>
          <label className="flex items-center justify-between text-xs font-medium text-foreground">
            <span>
              Overlap (ký tự)
              <span className="ml-2 text-muted">
                ≈ {Math.round((overlap / size) * 100)}%
              </span>
            </span>
            <span className="font-mono text-accent">{overlap}</span>
          </label>
          <input
            type="range"
            min={0}
            max={Math.min(400, size - 50)}
            step={10}
            value={overlap}
            onChange={(e) => setOverlap(Number(e.target.value))}
            className="mt-2 w-full accent-accent"
          />
          <div className="mt-1 flex justify-between text-[10px] text-muted">
            <span>0</span>
            <span>{Math.min(400, size - 50)}</span>
          </div>
        </div>
      </div>

      <QualityBoard score={score} />

      <ChunkStrip chunks={chunks} maxDisplay={6} />

      <div className="rounded-lg border border-border bg-surface/40 p-3">
        <p className="text-xs text-muted">
          <strong className="text-foreground">Mẹo:</strong> thử kéo chunk size
          thật nhỏ (dưới 150) — bạn sẽ thấy điểm Context richness tụt xuống.
          Ngược lại, chunk quá lớn (1200+) làm Precision giảm vì chunk chứa quá
          nhiều nhiễu. Sweet spot thường rơi vào khoảng 400–800 ký tự.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
            Ưu điểm
          </p>
          <ul className="mt-2 space-y-1 text-xs text-foreground">
            {info.pros.map((pro) => (
              <li key={pro}>• {pro}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-500">
            Hạn chế
          </p>
          <ul className="mt-2 space-y-1 text-xs text-foreground">
            {info.cons.map((con) => (
              <li key={con}>• {con}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT CHÍNH
// ─────────────────────────────────────────────────────────────────────────────

export default function ChunkingTopic() {
  return (
    <>
      {/* ──────────────────────────────────────────────────────────────────
          1. PREDICTION GATE — kích hoạt tò mò
      ────────────────────────────────────────────────────────────────── */}
      <PredictionGate
        question="Bạn có Bộ luật Lao động 200 trang. Embedding model chỉ xử lý tối đa 512 token/lần. Nhét cả 200 trang vào 1 lần được không?"
        options={[
          "Được, model sẽ tự xử lý",
          "KHÔNG — cần chia thành các đoạn nhỏ (chunk) vừa với giới hạn 512 token",
          "Chỉ embed trang đầu tiên",
        ]}
        correct={1}
        explanation="Embedding model có giới hạn context. Cần chia 200 trang thành hàng trăm chunk nhỏ (256-512 token). Mỗi chunk được embed riêng, lưu vào vector database. Đó là Chunking!"
      />

      {/* ──────────────────────────────────────────────────────────────────
          2. ẨN DỤ — móc treo cho kiến thức mới
      ────────────────────────────────────────────────────────────────── */}
      <p>
        Hãy tưởng tượng bạn đang biên tập một cuốn sách dày 500 trang để đưa
        lên một hệ thống tra cứu thông minh. Nếu bạn giao cả cuốn sách cho máy
        tìm kiếm, nó sẽ &quot;ngộp&quot; — không biết nên nhớ phần nào. Ngược
        lại, nếu bạn xé từng dòng ra làm thẻ nhớ, mỗi thẻ lại quá ngắn để
        người đọc hiểu nội dung.
      </p>
      <p>
        <strong>Chunking</strong> là nghệ thuật chia văn bản dài thành các
        đoạn vừa vặn: đủ nhỏ để máy xử lý được, đủ lớn để vẫn mang trọn một ý
        hoàn chỉnh. Giống như cắt bánh mì — cắt quá dày thì khó ăn, cắt quá
        mỏng thì vụn và mất mùi vị.
      </p>
      <p>
        Trong bối cảnh{" "}
        <TopicLink slug="rag">RAG (Retrieval-Augmented Generation)</TopicLink>,
        chunking là bước tiền xử lý <strong>quyết định</strong> chất lượng
        toàn hệ thống. Chunking kém → embedding kém → search trả ngữ cảnh sai
        → LLM đưa câu trả lời sai. Ngược lại, chunking khéo léo giúp mọi bước
        sau chạy trơn tru.
      </p>
      <p>
        Ba chiến lược phổ biến nhất là Fixed-size (cắt đều), Semantic (cắt
        theo chủ đề), và Recursive (cắt theo ranh giới tự nhiên). Phần tương
        tác dưới đây cho bạn điều chỉnh chunk size, overlap và xem ngay điểm
        truy xuất thay đổi.
      </p>

      {/* ──────────────────────────────────────────────────────────────────
          3. VISUALIZATION — 3 tabs cho 3 chiến lược, sliders + điểm quality
      ────────────────────────────────────────────────────────────────── */}
      <VisualizationSection topicSlug={metadata.slug}>
        <p className="mb-4 text-sm text-muted">
          Tài liệu mẫu là trích đoạn giả lập Bộ luật Lao động (~{FULL_DOC.length}{" "}
          ký tự). Chọn chiến lược, kéo chunk size và overlap để quan sát số
          chunk và điểm truy xuất thay đổi trực tiếp.
        </p>

        <TabView
          tabs={[
            {
              label: "Fixed-size",
              content: <StrategyPanel strategy="fixed" />,
            },
            {
              label: "Semantic",
              content: <StrategyPanel strategy="semantic" />,
            },
            {
              label: "Recursive",
              content: <StrategyPanel strategy="recursive" />,
            },
          ]}
        />

        <div className="mt-6 rounded-lg border border-accent/30 bg-accent/5 p-4">
          <p className="text-sm text-foreground">
            <strong>Thử nghiệm có chủ đích:</strong> ở tab Fixed-size, hạ chunk
            size xuống 100 và đặt overlap = 0. Nhìn Coverage vẫn cao nhưng
            Context richness tụt hẳn — đó là dấu hiệu chunk đã quá ngắn để
            embedding mang nghĩa. Tăng size lên 1500 thì Precision giảm vì
            chunk chứa nhiều thông tin không liên quan cùng lúc.
          </p>
        </div>
      </VisualizationSection>

      {/* ──────────────────────────────────────────────────────────────────
          4. AHA MOMENT — đóng đinh insight chính
      ────────────────────────────────────────────────────────────────── */}
      <AhaMoment>
        <p>
          Chunking giống{" "}
          <strong>chia cuốn sách thành bookmarks</strong>: mỗi bookmark đánh
          dấu 1 đoạn ý hoàn chỉnh. Chunk quá nhỏ = bookmark mỗi dòng (thiếu ngữ
          cảnh). Chunk quá lớn = bookmark mỗi chương (khó tìm chính xác).{" "}
          <strong>256-512 token là sweet spot</strong> cho hầu hết bài toán
          RAG — đủ dài để nắm một ý, đủ ngắn để embedding tập trung.
        </p>
      </AhaMoment>

      {/* ──────────────────────────────────────────────────────────────────
          5. INLINE CHALLENGES — 2 bài kiểm tra ngắn
      ────────────────────────────────────────────────────────────────── */}
      <InlineChallenge
        question="Chunk_1 kết thúc: '...theo Điều 128'. Chunk_2 bắt đầu: 'Bộ luật Lao động, người sử dụng lao động phải...'. Vấn đề gì xảy ra?"
        options={[
          "Không vấn đề gì",
          "Thông tin bị CẮT GIỮA Ý: 'Điều 128 Bộ luật Lao động' bị chia thành 2 chunk, cả 2 đều thiếu ngữ cảnh",
          "Chunk quá dài",
        ]}
        correct={1}
        explanation="Fixed-size chunking cắt cơ học, không quan tâm ranh giới ý. Giải pháp: overlap (chồng lấp) hoặc semantic chunking (cắt khi chủ đề thay đổi) hoặc recursive text splitting!"
      />

      <InlineChallenge
        question="Bạn có một tài liệu pháp lý dài, truy vấn của người dùng thường là những câu hỏi ngắn gọn (ví dụ 'thời gian thử việc tối đa?'). Để cân bằng precision cho search và context đủ cho LLM, bạn nên dùng chiến lược nào?"
        options={[
          "Chunk cực lớn (2000+ token) để LLM có nhiều context",
          "Parent-child chunking: index chunk nhỏ (~200 token), retrieve parent chunk lớn (~800 token) khi cần trả lời",
          "Chỉ dùng chunk nhỏ (50 token) để search chính xác",
        ]}
        correct={1}
        explanation="Parent-child là pattern kinh điển: chunk nhỏ (child) dùng cho embedding/search precision cao. Khi trúng 1 child, hệ thống trả về parent chunk lớn hơn chứa nó → LLM có đủ context để reason. Best of both worlds!"
      />

      {/* ──────────────────────────────────────────────────────────────────
          6. EXPLANATION SECTION — lý thuyết đầy đủ
      ────────────────────────────────────────────────────────────────── */}
      <ExplanationSection>
        <p>
          <strong>Chunking</strong> (chia nhỏ) là bước tiền xử lý trong pipeline{" "}
          <TopicLink slug="rag">RAG</TopicLink>, chia văn bản dài thành các
          đoạn nhỏ (chunk) phù hợp với giới hạn context của{" "}
          <TopicLink slug="embedding-model">embedding model</TopicLink>. Mỗi
          chunk sau đó được nhúng thành vector và lưu trong{" "}
          <TopicLink slug="vector-databases">vector database</TopicLink>.
        </p>

        <p>
          Nhìn thoáng qua thì chunking đơn giản — chỉ là cắt chuỗi. Nhưng chất
          lượng chunking quyết định chất lượng toàn hệ thống RAG: chunk cắt
          kém → embedding thiếu ngữ cảnh → search trả chunk không liên quan →
          LLM hallucinate hoặc trả lời thiếu chính xác. Nghiên cứu thực nghiệm
          cho thấy chỉ cần thay đổi chunk_size từ 256 → 512, recall@10 có thể
          dao động 15-25% trên cùng một dataset.
        </p>

        <Callout variant="insight" title="5 chiến lược chunking phổ biến">
          <div className="space-y-2 text-sm">
            <p>
              <strong>1. Fixed-size:</strong> Chia theo số token cố định (VD:
              512). Đơn giản nhưng có thể cắt giữa ý.
            </p>
            <p>
              <strong>2. Sentence-based:</strong> Chia theo ranh giới câu. Giữ
              ý hoàn chỉnh nhưng chunk không đều.
            </p>
            <p>
              <strong>3. Recursive:</strong> Thử chia theo paragraph, nếu quá
              dài thì chia theo sentence, rồi theo word. LangChain mặc định.
            </p>
            <p>
              <strong>4. Overlap:</strong> Chunk kề nhau chia sẻ 10-20% nội
              dung. Không mất thông tin ranh giới.
            </p>
            <p>
              <strong>5. Semantic:</strong> Embed từng câu, cắt khi cosine
              similarity giảm mạnh (chủ đề thay đổi). Thông minh nhất.
            </p>
          </div>
        </Callout>

        <p>
          <strong>Kích thước chunk tối ưu</strong> bị ràng buộc cứng bởi
          embedding model:
        </p>
        <LaTeX block>
          {"\\text{chunk\\_size} \\leq \\text{max\\_seq\\_length}_{\\text{model}}"}
        </LaTeX>
        <p className="text-sm text-muted">
          all-MiniLM-L6-v2: max 256 token. text-embedding-3-small: max 8192
          token. bge-m3: max 8192 token. Thực tế, 256-1024 token/chunk thường
          cho kết quả tốt nhất cho RAG.
        </p>

        <p>
          <strong>Overlap giữa các chunk</strong> giúp bảo toàn ngữ cảnh ở
          ranh giới. Nếu một câu quan trọng nằm vắt ngang 2 chunk, không có
          overlap thì nó bị chia đôi — cả 2 chunk đều mất ý. Với overlap O ký
          tự, câu đó xuất hiện trong ít nhất một chunk đầy đủ (miễn là câu
          ngắn hơn O). Công thức số chunk:
        </p>
        <LaTeX block>
          {String.raw`N_{\text{chunk}} = \left\lceil \frac{L - O}{S - O} \right\rceil`}
        </LaTeX>
        <p className="text-sm text-muted">
          Trong đó L là độ dài tổng, S là chunk size, O là overlap. Overlap
          càng lớn, số chunk càng nhiều → chi phí lưu trữ và embedding tăng
          theo.
        </p>

        <Callout variant="warning" title="Pitfall 1 — Cắt giữa câu/đoạn">
          <p>
            Fixed-size chunking cắt cơ học tại vị trí ký tự thứ N, không quan
            tâm đó là giữa từ, giữa câu hay giữa bảng. Hậu quả:
            &quot;Điều 128 Bộ luật Lao...&quot; | &quot;...động, người sử dụng
            lao động phải...&quot; — chunk_1 treo lửng, chunk_2 thiếu chủ
            ngữ. Giải pháp: dùng Recursive splitter hoặc đặt overlap ≥ 10%
            chunk size.
          </p>
        </Callout>

        <Callout variant="warning" title="Pitfall 2 — Chunk quá nhỏ hoặc quá lớn">
          <p>
            Chunk &lt; 100 token thường thiếu ngữ cảnh — embedding model
            không nắm được &quot;đoạn này nói về cái gì&quot;. Chunk &gt; 1500
            token bị dilution: tín hiệu của một ý quan trọng bị pha loãng bởi
            nhiều ý khác cùng nằm trong vector. Luôn đo retrieval quality
            thực tế trên query set của bạn, không chỉ dựa vào cảm tính.
          </p>
        </Callout>

        <Callout variant="tip" title="Tips cho tiếng Việt">
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>
              <strong>Tách từ:</strong> Tiếng Việt cần tách từ đúng
              (underthesea, vncorenlp) trước khi chunk theo token, nếu không
              số token ước lượng sẽ lệch 20-40%.
            </li>
            <li>
              <strong>Metadata:</strong> Lưu kèm metadata (tên tài liệu, số
              trang, ngày ban hành, điều khoản) cho mỗi chunk để filter và
              trích nguồn.
            </li>
            <li>
              <strong>Giữ heading:</strong> Prepend tiêu đề mục/tiểu mục vào
              chunk giúp embedding nắm chủ đề tốt hơn.
            </li>
            <li>
              <strong>Test A/B:</strong> Không tin phép thử của người khác —
              A/B test chunk_size (256 vs 512 vs 1024) trên bài toán cụ thể
              của bạn.
            </li>
          </ul>
        </Callout>

        <Callout variant="info" title="Khi nào dùng chiến lược nào?">
          <p className="text-sm">
            <strong>Fixed-size:</strong> tài liệu đồng nhất, cần tốc độ
            (logs, transcript, tweet feed).{" "}
            <strong>Recursive:</strong> tài liệu có cấu trúc rõ ràng (Markdown,
            HTML, pháp lý, sách kỹ thuật).{" "}
            <strong>Semantic:</strong> tài liệu dài, nhiều chủ đề đan xen
            (báo cáo nghiên cứu, blog post dài, podcast transcript). Chi phí
            embedding phụ trợ đáng kể — chỉ dùng khi chất lượng là ưu tiên
            tuyệt đối.
          </p>
        </Callout>

        <CodeBlock
          language="python"
          title="LangChain — RecursiveCharacterTextSplitter"
        >
{`from langchain.text_splitter import RecursiveCharacterTextSplitter

# Đọc Bộ luật Lao động
with open("bo_luat_lao_dong_2025.txt", encoding="utf-8") as f:
    text = f.read()  # ~200 trang

# Recursive Text Splitting (mặc định LangChain)
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,        # ~500 ký tự/chunk
    chunk_overlap=50,      # 50 ký tự chồng lấp (~10%)
    separators=[           # Thứ tự ưu tiên, từ lớn đến nhỏ
        "\\n\\n",          # Paragraph break
        "\\n",             # Line break
        ". ",              # Sentence
        ", ",              # Clause
        " ",               # Word
        "",                # Fallback: cắt theo ký tự
    ],
    length_function=len,   # Có thể thay bằng tiktoken encoder
    is_separator_regex=False,
)

chunks = splitter.split_text(text)
print(f"Tổng {len(chunks)} chunks từ {len(text)} ký tự")
# Ví dụ: ~400 chunks, mỗi chunk ~500 ký tự

# Variant dùng token thay cho ký tự
from langchain.text_splitter import TokenTextSplitter

token_splitter = TokenTextSplitter(
    chunk_size=256,
    chunk_overlap=32,
    encoding_name="cl100k_base",  # tiktoken encoding của GPT-4
)
token_chunks = token_splitter.split_text(text)
# Đảm bảo chunk luôn ≤ 256 token thật, không lệch do tách từ`}
        </CodeBlock>

        <CodeBlock
          language="python"
          title="LangChain — SemanticChunker (experimental)"
        >
{`from langchain_experimental.text_splitter import SemanticChunker
from langchain_openai import OpenAIEmbeddings

# Semantic chunking dựa trên embedding của từng câu
semantic_splitter = SemanticChunker(
    OpenAIEmbeddings(model="text-embedding-3-small"),
    breakpoint_threshold_type="percentile",
    # Cắt khi similarity giảm xuống dưới percentile 95 của khoảng cách
    breakpoint_threshold_amount=95,
    # Có thể đổi sang "standard_deviation" hoặc "interquartile"
)
semantic_chunks = semantic_splitter.split_text(text)

# Kiểm tra độ dài chunk không đồng đều — đó là hành vi mong đợi
lengths = [len(c) for c in semantic_chunks]
print(f"min={min(lengths)}, max={max(lengths)}, avg={sum(lengths)//len(lengths)}")

# Biến thể parent-child: index chunk nhỏ, trả về parent lớn
from langchain.retrievers import ParentDocumentRetriever
from langchain.storage import InMemoryStore
from langchain_community.vectorstores import Chroma

parent_splitter = RecursiveCharacterTextSplitter(chunk_size=1600)
child_splitter  = RecursiveCharacterTextSplitter(chunk_size=256)

retriever = ParentDocumentRetriever(
    vectorstore=Chroma(embedding_function=OpenAIEmbeddings()),
    docstore=InMemoryStore(),
    child_splitter=child_splitter,
    parent_splitter=parent_splitter,
)
retriever.add_documents(docs)
# Search dùng child chunk (precision cao), trả về parent chunk (context đủ)`}
        </CodeBlock>

        <CollapsibleDetail title="Chi tiết: chọn chunk_size tối ưu bằng grid search">
          <p className="text-sm">
            Không có chunk_size &quot;tốt nhất&quot; phổ quát — luôn phụ
            thuộc vào embedding model, domain, và query distribution. Cách
            thực tế là grid search trên một eval set nhỏ (50-200 query) đã
            biết đáp án đúng:
          </p>
          <CodeBlock language="python" title="Grid search chunk_size">
{`import pandas as pd
from ragas.metrics import context_recall, context_precision
from ragas import evaluate

chunk_sizes = [128, 256, 512, 1024]
overlaps    = [0, 32, 64, 128]
results = []

for cs in chunk_sizes:
    for ov in overlaps:
        if ov >= cs: continue
        index = build_index(docs, chunk_size=cs, overlap=ov)
        score = evaluate(
            index, eval_queries,
            metrics=[context_recall, context_precision],
        )
        results.append({
            "chunk_size": cs, "overlap": ov,
            "recall": score["context_recall"],
            "precision": score["context_precision"],
        })

df = pd.DataFrame(results).sort_values("recall", ascending=False)
print(df.head())`}
          </CodeBlock>
          <p className="text-sm">
            Mẹo: với tiếng Việt, thường chunk_size 400-700 ký tự (~200-350
            token) kèm overlap 10-15% là khởi điểm tốt. Với tài liệu có
            heading Markdown, thử dùng{" "}
            <code>MarkdownHeaderTextSplitter</code> trước rồi mới
            RecursiveCharacterTextSplitter.
          </p>
        </CollapsibleDetail>

        <CollapsibleDetail title="Chi tiết: công thức ước lượng số token tiếng Việt">
          <p className="text-sm">
            Với tokenizer của GPT-4 (cl100k_base), trung bình 1 ký tự tiếng
            Anh ≈ 0.25 token, còn tiếng Việt ≈ 0.6-0.9 token/ký tự do các dấu
            và cách tách từ khác biệt. Công thức ước lượng thực tế:
          </p>
          <LaTeX block>
            {String.raw`\text{tokens} \approx 0.75 \cdot \text{len}(\text{text in Vietnamese})`}
          </LaTeX>
          <p className="text-sm">
            Ví dụ: một chunk 800 ký tự tiếng Việt ≈ 600 token → phù hợp với
            embedding model giới hạn 512 token nếu bạn giảm xuống 650 ký tự,
            hoặc chuyển sang bge-m3 (8192 token). Với embedding model đa
            ngôn ngữ (multilingual-e5, bge-m3), chênh lệch token/ký tự nhỏ
            hơn rõ rệt so với OpenAI tokenizer.
          </p>
        </CollapsibleDetail>

        <p className="mt-4 font-semibold text-foreground">Ứng dụng thực tế</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>
            <strong>Trợ lý pháp lý:</strong> chunking Bộ luật theo điều/khoản
            rồi embed, cho phép luật sư hỏi nhanh &quot;quy định hiện hành về
            thử việc?&quot; và hệ thống trả về đúng điều khoản kèm số hiệu.
          </li>
          <li>
            <strong>Wiki nội bộ:</strong> chia Wiki công ty thành chunk, nhân
            viên mới tra cứu chính sách ngay trên Slack bot mà không cần lục
            từng trang Confluence.
          </li>
          <li>
            <strong>Y tế:</strong> chunking hồ sơ bệnh án + guidelines để hỗ
            trợ bác sĩ rà soát nhanh (luôn đi kèm audit trail và trích dẫn
            nguồn để tránh rủi ro pháp lý).
          </li>
          <li>
            <strong>Nghiên cứu học thuật:</strong> chunking paper PDF, cho
            phép Semantic Scholar trả lời câu hỏi cụ thể thay vì chỉ list
            paper — chunk theo section (Abstract, Methods, Results).
          </li>
          <li>
            <strong>Ngân hàng:</strong> chunking hợp đồng tín dụng + T&amp;C;
            khi khách hỏi điều khoản, chatbot trích đúng đoạn và số điều, kèm
            confidence score.
          </li>
          <li>
            <strong>E-commerce:</strong> chunking mô tả sản phẩm + review để
            xây dựng semantic search cho website — khách tìm &quot;áo khoác
            chống nước đi phượt&quot; sẽ trúng đúng sản phẩm.
          </li>
          <li>
            <strong>Giáo dục:</strong> chunking giáo trình, bài giảng để xây
            tutor AI — học sinh hỏi &quot;định lý Pythagoras áp dụng thế
            nào?&quot;, bot trích đúng ví dụ trong sách giáo khoa.
          </li>
        </ul>

        <p className="mt-4 font-semibold text-foreground">Các pitfall hay gặp</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>
            Đặt chunk_size bằng đơn vị ký tự nhưng embedding model tính theo
            token → chunk thực có thể vượt max_seq_length mà không hay.
          </li>
          <li>
            Quên metadata (nguồn, section, page) → không trích được nguồn khi
            trả lời, giảm tin cậy.
          </li>
          <li>
            Overlap quá lớn (&gt; 40%) làm vector database phình to và chunk
            trùng lặp khi retrieve.
          </li>
          <li>
            Chunking 1 lần rồi giữ nguyên cả đời; thực tế cần re-chunk khi đổi
            embedding model hoặc thêm loại tài liệu mới.
          </li>
          <li>
            Bỏ qua bảng, công thức, code block — các đoạn này cần chiến lược
            riêng (giữ nguyên khối, không cắt).
          </li>
        </ul>
      </ExplanationSection>

      {/* ──────────────────────────────────────────────────────────────────
          7. MINI SUMMARY — 6 điểm chốt
      ────────────────────────────────────────────────────────────────── */}
      <MiniSummary
        title="Ghi nhớ về Chunking"
        points={[
          "Chunking chia tài liệu dài thành đoạn nhỏ vừa giới hạn embedding model (thường 256-1024 token).",
          "Ba chiến lược chính: Fixed-size (đơn giản), Recursive (mặc định LangChain, tôn trọng cấu trúc), Semantic (cắt theo chủ đề).",
          "Overlap 10-20% chunk_size đảm bảo thông tin ở ranh giới không bị mất.",
          "Parent-child chunking: index chunk nhỏ cho precision, retrieve parent lớn cho context — kết hợp cả hai ưu điểm.",
          "Đo bằng số thật (recall, precision trên eval set) — không chọn chunk_size theo cảm tính.",
          "Luôn lưu kèm metadata (nguồn, trang, section) để trả lời có trích nguồn và audit được.",
        ]}
      />

      {/* ──────────────────────────────────────────────────────────────────
          8. QUIZ — 8 câu cuối bài
      ────────────────────────────────────────────────────────────────── */}
      <QuizSection questions={QUIZ} />
    </>
  );
}
