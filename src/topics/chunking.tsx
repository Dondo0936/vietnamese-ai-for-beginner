"use client";

import { useState } from "react";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

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

/* ── data ─────────────────────────────────────────────────── */
const SENTENCES = [
  "Trí tuệ nhân tạo (AI) là lĩnh vực nghiên cứu phát triển hệ thống thông minh.",
  "Học máy (Machine Learning) là nhánh con của AI, học từ dữ liệu.",
  "Học sâu (Deep Learning) dùng mạng nơ-ron nhiều lớp xử lý dữ liệu phức tạp.",
  "Xử lý ngôn ngữ tự nhiên (NLP) giúp máy tính hiểu ngôn ngữ con người.",
  "Thị giác máy tính (Computer Vision) cho phép phân tích hình ảnh và video.",
];

type ChunkMethod = "fixed" | "sentence" | "overlap";

const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#a855f7"];

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
    explanation: "Chunk 'Học sâu dùng mạng nơ-ron' quá ngắn -- embedding không biết đang nói về AI hay sinh học. Cần đủ ngữ cảnh (256-1024 token) để embedding có ý nghĩa.",
  },
  {
    question: "Tại sao cần overlap (chồng lấp) giữa các chunk?",
    options: [
      "Để tăng kích thước database",
      "Để thông tin ở ranh giới chunk không bị mất -- câu nằm giữa 2 chunk vẫn được bảo toàn",
      "Để embedding model chạy nhanh hơn",
      "Để giảm số chunk",
    ],
    correct: 1,
    explanation: "Nếu chunk_1 kết thúc ở giữa ý và chunk_2 bắt đầu phần còn lại, cả 2 chunk đều thiếu ý đầy đủ. Overlap 10-20% đảm bảo thông tin ở ranh giới không bị mất!",
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
    explanation: "Semantic chunking: embed từng câu, khi cosine similarity giữa 2 câu liên tiếp giảm mạnh (chủ đề thay đổi) -> cắt chunk. Giữ nguyên ý nghĩa hoàn chỉnh thay vì cắt cơ học!",
  },
];

/* ── component ────────────────────────────────────────────── */
export default function ChunkingTopic() {
  const [method, setMethod] = useState<ChunkMethod>("fixed");

  const getChunks = (): string[][] => {
    switch (method) {
      case "fixed": return [[SENTENCES[0], SENTENCES[1]], [SENTENCES[2], SENTENCES[3]], [SENTENCES[4]]];
      case "sentence": return SENTENCES.map((s) => [s]);
      case "overlap": return [
        [SENTENCES[0], SENTENCES[1]],
        [SENTENCES[1], SENTENCES[2]],
        [SENTENCES[2], SENTENCES[3]],
        [SENTENCES[3], SENTENCES[4]],
      ];
    }
  };

  const chunks = getChunks();
  const methods: { key: ChunkMethod; label: string; desc: string }[] = [
    { key: "fixed", label: "Kích thước cố định", desc: "Chia đều thành đoạn bằng nhau" },
    { key: "sentence", label: "Theo câu", desc: "Mỗi câu là một đoạn riêng" },
    { key: "overlap", label: "Chồng lấp", desc: "Đoạn kề nhau chia sẻ nội dung chung" },
  ];

  return (
    <>
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Bạn có Bộ luật Lao động 200 trang. Embedding model chỉ xử lý tối đa 512 token/lần. Nhét cả 200 trang vào 1 lần được không?"
          options={[
            "Được, model sẽ tự xử lý",
            "KHÔNG -- cần chia thành các đoạn nhỏ (chunk) vừa với giới hạn 512 token",
            "Chỉ embed trang đầu tiên",
          ]}
          correct={1}
          explanation="Embedding model có giới hạn context. Cần chia 200 trang thành hàng trăm chunk nhỏ (256-512 token). Mỗi chunk được embed riêng, lưu vào vector database. Đó là Chunking!"
        >

      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {methods.map((m) => (
                <button key={m.key} type="button" onClick={() => setMethod(m.key)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    method === m.key ? "bg-accent text-white" : "bg-card border border-border text-muted hover:text-foreground"
                  }`}>
                  {m.label}
                </button>
              ))}
            </div>

            <p className="text-xs text-muted italic">
              {methods.find((m) => m.key === method)?.desc}
            </p>

            <svg viewBox="0 0 650 320" className="w-full max-w-3xl mx-auto">
              <text x="325" y="20" textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="bold">
                Kết quả chia đoạn ({chunks.length} chunk)
              </text>
              {chunks.map((chunk, ci) => {
                const y = 40 + ci * 65;
                const color = COLORS[ci % COLORS.length];
                return (
                  <g key={ci}>
                    <rect x="10" y={y} width="80" height="50" rx="8" fill={color} opacity={0.15}
                      stroke={color} strokeWidth="1.5" />
                    <text x="50" y={y + 22} textAnchor="middle" fill={color} fontSize="10" fontWeight="bold">
                      Chunk {ci + 1}
                    </text>
                    <text x="50" y={y + 38} textAnchor="middle" fill="#64748b" fontSize="8">
                      {chunk.join(" ").length} ký tự
                    </text>
                    <rect x="100" y={y} width="540" height="50" rx="8" fill="#1e293b" stroke={color} strokeWidth="1" opacity={0.8} />
                    {chunk.map((sentence, si) => (
                      <text key={si} x="110" y={y + 18 + si * 16} fill="#94a3b8" fontSize="8">
                        {sentence.length > 75 ? sentence.slice(0, 75) + "..." : sentence}
                      </text>
                    ))}
                  </g>
                );
              })}
            </svg>

            {method === "overlap" && (
              <div className="rounded-lg bg-background/50 border border-yellow-500/30 p-3">
                <p className="text-sm text-yellow-400 font-medium">Vùng chồng lấp</p>
                <p className="text-xs text-muted">
                  Mỗi chunk chia sẻ 1 câu với chunk kế tiếp. Thông tin ở ranh giới không bị mất!
                </p>
              </div>
            )}
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Chunking giống <strong>chia cuốn sách thành bookmarks</strong>: mỗi bookmark đánh dấu 1 đoạn ý hoàn chỉnh.
            Chunk quá nhỏ = bookmark mỗi dòng (thiếu ngữ cảnh). Chunk quá lớn = bookmark mỗi chương (khó tìm chính xác).
            <strong>{" "}256-512 token là sweet spot</strong>{" "}cho hầu hết bài toán RAG!
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={8} label="Thử thách">
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
      </LessonSection>

      <LessonSection step={5} totalSteps={8} label="Giải thích sâu">
        <ExplanationSection>
          <p>
            <strong>Chunking</strong>{" "}là bước tiền xử lý quan trọng trong pipeline RAG, chia văn bản dài thành
            đoạn nhỏ phù hợp với giới hạn embedding model.
          </p>

          <Callout variant="insight" title="5 chiến lược chunking">
            <div className="space-y-2 text-sm">
              <p><strong>1. Fixed-size:</strong>{" "}Chia theo số token cố định (VD: 512). Đơn giản nhưng có thể cắt giữa ý.</p>
              <p><strong>2. Sentence-based:</strong>{" "}Chia theo ranh giới câu. Giữ ý hoàn chỉnh nhưng chunk không đều.</p>
              <p><strong>3. Recursive:</strong>{" "}Thử chia theo paragraph, nếu quá dài thì chia theo sentence, rồi theo word. LangChain mặc định.</p>
              <p><strong>4. Overlap:</strong>{" "}Chunk kề nhau chia sẻ 10-20% nội dung. Không mất thông tin ranh giới.</p>
              <p><strong>5. Semantic:</strong>{" "}Embed từng câu, cắt khi cosine similarity giảm mạnh (chủ đề thay đổi). Thông minh nhất.</p>
            </div>
          </Callout>

          <p><strong>Kích thước chunk tối ưu</strong>{" "}phụ thuộc embedding model:</p>
          <LaTeX block>{"\\text{chunk\\_size} \\leq \\text{max\\_seq\\_length}_{\\text{model}}"}</LaTeX>
          <p className="text-sm text-muted">
            all-MiniLM-L6-v2: max 256 token. text-embedding-3: max 8192 token. bge-m3: max 8192 token.
            Thực tế, 256-1024 token/chunk thường cho kết quả tốt nhất cho RAG.
          </p>

          <Callout variant="warning" title="Chunking tips cho tiếng Việt">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>Tách từ:</strong>{" "}Tiếng Việt cần tách từ đúng (underthesea, vncorenlp) trước khi chunk theo token</li>
              <li><strong>Metadata:</strong>{" "}Lưu kèm metadata (tên tài liệu, số trang, ngày) cho mỗi chunk</li>
              <li><strong>Parent-child:</strong>{" "}Chunk nhỏ để search (precision), retrieve parent chunk lớn hơn cho LLM (context)</li>
              <li><strong>Test:</strong>{" "}A/B test chunk_size (256 vs 512 vs 1024) trên bài toán cụ thể</li>
            </ul>
          </Callout>

          <CodeBlock language="python" title="Chunking với LangChain (Recursive + Overlap)">
{`from langchain.text_splitter import RecursiveCharacterTextSplitter

# Đọc Bộ luật Lao động
with open("bo_luat_lao_dong_2025.txt") as f:
    text = f.read()  # ~200 trang

# Recursive Text Splitting (mặc định LangChain)
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,        # ~500 ký tự/chunk
    chunk_overlap=50,      # 50 ký tự chồng lấp
    separators=[           # Thứ tự ưu tiên
        "\\n\\n",            # Paragraph
        "\\n",              # Line break
        ". ",              # Sentence
        " ",               # Word
    ],
    length_function=len,
)

chunks = splitter.split_text(text)
print(f"Tổng {len(chunks)} chunks từ {len(text)} ký tự")
# ~400 chunks, mỗi chunk ~500 ký tự

# Semantic Chunking (LangChain experimental)
from langchain_experimental.text_splitter import SemanticChunker
from langchain_openai import OpenAIEmbeddings

semantic_splitter = SemanticChunker(
    OpenAIEmbeddings(),
    breakpoint_threshold_type="percentile",
    breakpoint_threshold_amount=95,
)
semantic_chunks = semantic_splitter.split_text(text)
# Cắt khi cosine similarity giữa 2 câu liên tiếp
# giảm dưới percentile 95 -> chủ đề thay đổi`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={8} label="Tóm tắt">
        <MiniSummary points={[
          "Chunking chia tài liệu dài thành đoạn nhỏ vừa giới hạn embedding model (256-1024 token)",
          "5 chiến lược: fixed-size, sentence, recursive (mặc định LangChain), overlap, semantic",
          "Overlap 10-20% đảm bảo thông tin ranh giới không bị mất",
          "Chunking tốt = nền tảng RAG tốt. Test A/B chunk_size trên bài toán cụ thể!",
        ]} />
      </LessonSection>

      <LessonSection step={7} totalSteps={8} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
