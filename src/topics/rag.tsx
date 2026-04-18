"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
  MiniSummary,
  CodeBlock,
  LaTeX,
  CollapsibleDetail,
  TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "rag",
  title: "RAG",
  titleVi: "RAG - Sinh nội dung có truy xuất",
  description:
    "Retrieval-Augmented Generation kết hợp truy xuất tài liệu với mô hình ngôn ngữ để tạo câu trả lời chính xác hơn.",
  category: "search-retrieval",
  tags: ["retrieval", "generation", "llm", "search"],
  difficulty: "intermediate",
  relatedSlugs: ["vector-databases", "semantic-search", "chunking"],
  vizType: "interactive",
};

/* ══════════════════════════════════════════════════════════════
   DỮ LIỆU: Knowledge base giả lập + các query mẫu
   ══════════════════════════════════════════════════════════════ */

interface DocChunk {
  id: number;
  source: string;
  title: string;
  content: string;
  /** Vector embedding rút gọn 6 chiều để trực quan hoá */
  embedding: number[];
}

interface QueryPreset {
  id: string;
  question: string;
  /** Embedding 6 chiều của câu hỏi */
  embedding: number[];
  /** Điểm tương đồng cosine giả lập với từng chunk (cùng thứ tự với CHUNKS) */
  scores: number[];
  /** Index của các chunk được coi là liên quan */
  relevant: number[];
  /** Câu trả lời khi KHÔNG có RAG (thường ảo giác) */
  hallucinated: string;
  /** Câu trả lời khi có RAG (có trích dẫn [1], [2]...) */
  ragAnswer: string;
}

const CHUNKS: DocChunk[] = [
  {
    id: 1,
    source: "apple-vn-pricing.pdf",
    title: "Giá iPhone 16 tại Việt Nam (tháng 3/2026)",
    content:
      "iPhone 16 chính hãng có giá từ 22,99 triệu đồng (bản 128GB) đến 28,99 triệu đồng (bản 512GB) tại thị trường Việt Nam. Giá đã giảm 5% so với thời điểm ra mắt nhờ chương trình đổi máy cũ lấy máy mới.",
    embedding: [0.81, -0.12, 0.64, 0.31, -0.44, 0.92],
  },
  {
    id: 2,
    source: "heritage-vietnam.md",
    title: "Giỗ Tổ Hùng Vương và Đền Hùng",
    content:
      "Giỗ Tổ Hùng Vương được tổ chức vào mùng 10 tháng 3 Âm lịch hàng năm. Khu di tích Đền Hùng nằm tại Phú Thọ, được UNESCO công nhận là Di sản văn hoá phi vật thể năm 2012.",
    embedding: [-0.31, 0.88, -0.07, 0.42, 0.61, -0.18],
  },
  {
    id: 3,
    source: "vn-econ-2025.csv",
    title: "GDP Việt Nam năm 2025",
    content:
      "GDP Việt Nam năm 2025 ước đạt 476 tỷ USD, tăng trưởng 6,8% so với năm trước. Ngành công nghệ thông tin đóng góp 16% vào GDP, nông nghiệp đóng góp 12%.",
    embedding: [0.22, 0.34, -0.11, 0.72, -0.19, 0.33],
  },
  {
    id: 4,
    source: "hanoi-food-guide.md",
    title: "Cách nấu phở Hà Nội chuẩn vị",
    content:
      "Phở Hà Nội truyền thống dùng nước dùng ninh từ xương bò trong 12 tiếng. Gia vị gồm quế, hồi, thảo quả, hạt mùi rang thơm. Bánh phở mỏng, thịt bò tái hoặc chín tuỳ khẩu vị.",
    embedding: [-0.42, 0.11, 0.28, -0.61, 0.19, -0.27],
  },
  {
    id: 5,
    source: "weather-hcm.json",
    title: "Thời tiết TP.HCM hôm nay",
    content:
      "TP.HCM hôm nay nhiệt độ 32-35 độ C, có mưa rào vào buổi chiều tối, độ ẩm 75%. Chỉ số UV cao, nên hạn chế ra nắng từ 10h đến 15h.",
    embedding: [0.07, -0.25, 0.88, 0.12, -0.39, 0.58],
  },
  {
    id: 6,
    source: "apple-vn-pricing.pdf",
    title: "Chương trình thu cũ đổi mới Apple Việt Nam",
    content:
      "Từ tháng 2/2026, Apple Việt Nam triển khai thu iPhone cũ để giảm giá iPhone 16 mới. Mức trợ giá tối đa 8 triệu đồng cho iPhone 13 Pro Max còn nguyên hình thức.",
    embedding: [0.73, -0.18, 0.52, 0.28, -0.41, 0.87],
  },
];

const PRESETS: QueryPreset[] = [
  {
    id: "iphone",
    question: "Giá iPhone 16 ở Việt Nam bao nhiêu?",
    embedding: [0.78, -0.14, 0.61, 0.33, -0.42, 0.9],
    scores: [0.95, 0.12, 0.31, 0.08, 0.15, 0.89],
    relevant: [0, 5],
    hallucinated:
      "iPhone 16 có giá khoảng 799 USD (tương đương 19 triệu đồng) theo thông tin từ Apple. Đây là mức giá tham khảo tại thị trường Mỹ, có thể khác ở Việt Nam.",
    ragAnswer:
      "Theo tài liệu [1], iPhone 16 chính hãng tại Việt Nam có giá từ 22,99 triệu đồng (128GB) đến 28,99 triệu đồng (512GB), cập nhật tháng 3/2026. Ngoài ra, chương trình thu cũ đổi mới của Apple [2] có thể trợ giá tới 8 triệu đồng.",
  },
  {
    id: "hung-king",
    question: "Giỗ Tổ Hùng Vương là ngày nào và ở đâu?",
    embedding: [-0.29, 0.86, -0.05, 0.44, 0.6, -0.19],
    scores: [0.05, 0.97, 0.08, 0.04, 0.06, 0.07],
    relevant: [1],
    hallucinated:
      "Giỗ Tổ Hùng Vương được tổ chức vào ngày 10 tháng 3 dương lịch hàng năm, là ngày lễ lớn của dân tộc Việt Nam để tưởng nhớ các vua Hùng.",
    ragAnswer:
      "Theo tài liệu [1], Giỗ Tổ Hùng Vương được tổ chức vào mùng 10 tháng 3 Âm lịch hàng năm. Khu di tích Đền Hùng nằm tại Phú Thọ và được UNESCO công nhận là Di sản văn hoá phi vật thể năm 2012 [1].",
  },
  {
    id: "weather",
    question: "Thời tiết TP.HCM hôm nay thế nào?",
    embedding: [0.1, -0.22, 0.85, 0.14, -0.37, 0.6],
    scores: [0.07, 0.04, 0.11, 0.09, 0.96, 0.12],
    relevant: [4],
    hallucinated:
      "TP.HCM thường có thời tiết nóng ẩm quanh năm, nhiệt độ trung bình 28-33 độ C. Mùa mưa kéo dài từ tháng 5 đến tháng 11 hàng năm.",
    ragAnswer:
      "Theo tài liệu [1], TP.HCM hôm nay nhiệt độ 32-35 độ C, có mưa rào buổi chiều tối, độ ẩm 75%. Chỉ số UV cao, nên hạn chế ra nắng trong khoảng 10h-15h [1].",
  },
];

/* ══════════════════════════════════════════════════════════════
   HOOK PHỤ TRỢ: streaming text hiệu ứng gõ phím
   ══════════════════════════════════════════════════════════════ */

function useStreamText(text: string, active: boolean, speed = 22) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active) { setDisplayed(""); setDone(false); return; }
    let i = 0;
    setDisplayed("");
    setDone(false);
    const tick = () => {
      if (i < text.length) {
        setDisplayed(text.slice(0, ++i));
        timer.current = setTimeout(tick, speed);
      } else setDone(true);
    };
    tick();
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [text, active, speed]);

  return { displayed, done };
}

/* ══════════════════════════════════════════════════════════════
   THÀNH PHẦN NHỎ: badge, cursor, dots
   ══════════════════════════════════════════════════════════════ */

const Cursor = () => (
  <motion.span
    className="ml-0.5 inline-block h-4 w-0.5 bg-foreground align-text-bottom"
    animate={{ opacity: [1, 0] }}
    transition={{ duration: 0.5, repeat: Infinity }}
  />
);

const StepBadge = ({ n, color }: { n: number; color: string }) => (
  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${color}`}>{n}</div>
);

/* ══════════════════════════════════════════════════════════════
   GIAI ĐOẠN INDEXING: Documents → Chunking → Embed → Vector DB
   ══════════════════════════════════════════════════════════════ */

function IndexingStage() {
  const [step, setStep] = useState(0);
  const docs = [
    { id: "doc1", name: "chính-sách-công-ty.pdf", size: "18 trang" },
    { id: "doc2", name: "hướng-dẫn-nhân-viên.md", size: "6 trang" },
    { id: "doc3", name: "faq-khách-hàng.docx", size: "12 trang" },
  ];

  const chunks = [
    "Chính sách nghỉ phép 12 ngày/năm...",
    "Quy trình xin nghỉ phải gửi trước 3 ngày...",
    "Nhân viên mới có 2 tháng thử việc...",
    "Lương thưởng theo KPI hàng quý...",
    "Quy định về làm việc từ xa...",
  ];

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">
          Giai đoạn 1: Xây dựng chỉ mục (offline)
        </p>
        <button
          type="button"
          onClick={() => setStep((s) => (s >= 4 ? 0 : s + 1))}
          className="rounded-lg bg-accent px-3 py-1 text-xs font-medium text-white hover:opacity-90"
        >
          {step >= 4 ? "Đặt lại" : `Bước tiếp theo (${step}/4)`}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {/* 1. Documents */}
        <div
          className={`rounded-lg border p-3 transition-colors ${
            step >= 1
              ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
              : "border-border bg-background"
          }`}
        >
          <p className="mb-2 text-[10px] font-semibold uppercase text-muted">
            1. Documents
          </p>
          <div className="space-y-1">
            {docs.map((d) => (
              <div key={d.id} className="rounded bg-surface px-1.5 py-0.5 text-[10px] text-foreground">{d.name}</div>
            ))}
          </div>
        </div>

        {/* 2. Chunking */}
        <div className={`rounded-lg border p-3 transition-colors ${step >= 2 ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20" : "border-border bg-background opacity-60"}`}>
          <p className="mb-2 text-[10px] font-semibold uppercase text-muted">2. Chunking</p>
          <div className="space-y-1">
            {chunks.slice(0, 3).map((c, i) => (
              <div key={i} className="line-clamp-1 rounded bg-surface px-1.5 py-0.5 text-[10px] text-foreground">{c}</div>
            ))}
            <p className="text-[9px] text-muted">+2 chunks nữa...</p>
          </div>
        </div>

        {/* 3. Embedding */}
        <div className={`rounded-lg border p-3 transition-colors ${step >= 3 ? "border-purple-400 bg-purple-50 dark:bg-purple-900/20" : "border-border bg-background opacity-60"}`}>
          <p className="mb-2 text-[10px] font-semibold uppercase text-muted">3. Embedding</p>
          <div className="space-y-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-0.5 rounded bg-surface px-1.5 py-0.5 font-mono text-[9px] text-purple-700 dark:text-purple-300">
                [0.{12 + i}, 0.{45 - i}, ...]
              </div>
            ))}
          </div>
        </div>

        {/* 4. Vector DB */}
        <div className={`rounded-lg border p-3 transition-colors ${step >= 4 ? "border-green-400 bg-green-50 dark:bg-green-900/20" : "border-border bg-background opacity-60"}`}>
          <p className="mb-2 text-[10px] font-semibold uppercase text-muted">4. Vector DB</p>
          <div className="space-y-1">
            <div className="rounded bg-surface px-1.5 py-0.5 text-[10px] text-foreground">idx-001: vec + meta</div>
            <div className="rounded bg-surface px-1.5 py-0.5 text-[10px] text-foreground">idx-002: vec + meta</div>
            <div className="rounded bg-surface px-1.5 py-0.5 text-[10px] text-foreground">idx-003: vec + meta</div>
            <p className="text-[9px] text-muted">Pinecone / Chroma / FAISS</p>
          </div>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-muted">
        Bước 1-4 chạy <strong>một lần</strong> khi đưa tài liệu vào hệ thống.
        Sau đó mỗi câu hỏi của người dùng chỉ cần đi qua giai đoạn truy vấn
        bên dưới.
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   GIAI ĐOẠN QUERY: highlight các chunk được truy xuất + score
   ══════════════════════════════════════════════════════════════ */

function QueryStage({
  preset,
  topK,
}: {
  preset: QueryPreset;
  topK: number;
}) {
  /* Sắp xếp chunk theo score giảm dần và chọn top-K */
  const ranked = useMemo(
    () =>
      CHUNKS.map((chunk, idx) => ({
        chunk,
        score: preset.scores[idx],
        originalIdx: idx,
      })).sort((a, b) => b.score - a.score),
    [preset],
  );

  const chosen = ranked.slice(0, topK);
  const chosenIds = new Set(chosen.map((r) => r.originalIdx));

  return (
    <div className="space-y-4">
      {/* Query vector bar */}
      <div className="rounded-lg border border-border bg-background/50 p-3">
        <p className="mb-2 text-xs font-semibold text-foreground">
          Vector của câu hỏi (6 chiều giản lược)
        </p>
        <div className="flex flex-wrap gap-1.5">
          {preset.embedding.map((v, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              className="inline-flex h-7 w-11 items-center justify-center rounded border border-purple-200 bg-purple-100 font-mono text-[11px] text-purple-700 dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
            >
              {v.toFixed(2)}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Chunks với score bar */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-foreground">
          Độ tương đồng với từng chunk (top-{topK} được chọn)
        </p>
        {ranked.map(({ chunk, score, originalIdx }, pos) => {
          const isChosen = chosenIds.has(originalIdx);
          return (
            <motion.div
              key={chunk.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: pos * 0.06 }}
              className={`rounded-lg border p-3 transition-colors ${
                isChosen
                  ? "border-amber-400 bg-amber-50 dark:border-amber-600 dark:bg-amber-900/20"
                  : "border-border bg-background/50 opacity-60"
              }`}
            >
              <div className="mb-1 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-xs font-semibold ${
                      isChosen
                        ? "text-amber-800 dark:text-amber-200"
                        : "text-muted"
                    }`}
                  >
                    {chunk.title}
                  </p>
                  <p className="truncate text-[10px] font-mono text-muted">
                    {chunk.source}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-surface">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${score * 100}%` }}
                      transition={{ delay: pos * 0.06 + 0.15, duration: 0.5 }}
                      className={`h-full rounded-full ${
                        isChosen ? "bg-amber-500" : "bg-muted/50"
                      }`}
                    />
                  </div>
                  <span
                    className={`w-12 text-right font-mono text-[11px] ${
                      isChosen
                        ? "font-bold text-amber-700 dark:text-amber-300"
                        : "text-muted"
                    }`}
                  >
                    {score.toFixed(2)}
                  </span>
                  {isChosen && (
                    <span className="rounded-full bg-amber-200 px-1.5 py-0.5 text-[9px] font-bold text-amber-900 dark:bg-amber-800 dark:text-amber-200">
                      TOP-{pos + 1}
                    </span>
                  )}
                </div>
              </div>
              <p className="line-clamp-2 text-xs leading-relaxed text-muted">
                {chunk.content}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   NAIVE RAG vs ADVANCED RAG — so sánh 4 kỹ thuật nâng cao
   ══════════════════════════════════════════════════════════════ */

type AdvancedMode = "naive" | "rerank" | "hyde" | "query-expansion" | "self-query";

interface ModeInfo {
  id: AdvancedMode;
  label: string;
  description: string;
  /** Ví dụ các chunk sẽ được chọn (index) */
  chosenIdx: number[];
  /** Điểm tương đồng mới */
  scores: number[];
  hint: string;
}

const MODES: ModeInfo[] = [
  {
    id: "naive",
    label: "Naive RAG",
    description:
      "Embedding câu hỏi → tìm top-K bằng cosine similarity → đưa thẳng vào LLM.",
    chosenIdx: [0, 2, 5],
    scores: [0.95, 0.31, 0.89, 0.08, 0.15, 0.12],
    hint: "Đơn giản, nhanh, đủ dùng cho nhiều case — nhưng dễ lấy nhầm chunk có cosine cao nhưng không thật sự liên quan.",
  },
  {
    id: "rerank",
    label: "Re-ranking",
    description:
      "Lấy top 20 chunk bằng bi-encoder → cho cross-encoder chấm lại → giữ 3 chunk tốt nhất.",
    chosenIdx: [0, 5],
    scores: [0.98, 0.09, 0.22, 0.04, 0.12, 0.93],
    hint: "Cross-encoder đọc câu hỏi VÀ chunk cùng lúc nên đánh giá liên quan chính xác hơn, đổi lại chạy chậm hơn nhiều.",
  },
  {
    id: "hyde",
    label: "HyDE",
    description:
      "LLM tưởng tượng một câu trả lời giả trước, embed câu trả lời đó thay vì câu hỏi, rồi tìm chunk gần với câu trả lời.",
    chosenIdx: [0, 5, 2],
    scores: [0.97, 0.11, 0.35, 0.06, 0.14, 0.91],
    hint: "Câu trả lời giả 'trông giống tài liệu' hơn câu hỏi, nên vector của nó gần các tài liệu thật hơn — tăng recall rõ rệt.",
  },
  {
    id: "query-expansion",
    label: "Query expansion",
    description:
      "LLM viết lại câu hỏi thành 3-5 biến thể ('giá iPhone 16 VN', 'giá niêm yết iPhone 16 chính hãng'...) → tìm riêng rồi gộp kết quả.",
    chosenIdx: [0, 5, 2],
    scores: [0.96, 0.18, 0.42, 0.09, 0.17, 0.94],
    hint: "Tăng recall cho câu hỏi mơ hồ hoặc dùng từ ngữ khác với tài liệu. Chi phí: N lần embedding & N lần truy xuất.",
  },
  {
    id: "self-query",
    label: "Self-query",
    description:
      "LLM phân tích câu hỏi để tách phần ngữ nghĩa và phần metadata filter (nguồn, ngày, tác giả), rồi truy xuất có điều kiện.",
    chosenIdx: [0, 5],
    scores: [0.99, 0.02, 0.05, 0.01, 0.04, 0.95],
    hint: "Rất mạnh khi tài liệu có metadata (ngày, thể loại). Tránh kéo về chunk lạc chủ đề chỉ vì cosine tình cờ cao.",
  },
];

function AdvancedComparison() {
  const [mode, setMode] = useState<AdvancedMode>("naive");
  const preset = PRESETS[0];
  const info = MODES.find((m) => m.id === mode)!;

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div>
        <p className="mb-2 text-sm font-semibold text-foreground">
          So sánh các chiến lược RAG
        </p>
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                mode === m.id
                  ? "bg-accent text-white"
                  : "border border-border bg-surface text-muted hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="space-y-3 rounded-lg border border-dashed border-border bg-background/50 p-3"
        >
          <p className="text-xs leading-relaxed text-foreground">
            <strong>{info.label}:</strong> {info.description}
          </p>
          <div className="space-y-1.5">
            {CHUNKS.slice(0, 6).map((chunk, i) => {
              const s = info.scores[i];
              const chosen = info.chosenIdx.includes(i);
              return (
                <div
                  key={chunk.id}
                  className={`flex items-center gap-2 rounded border px-2 py-1.5 text-[11px] ${
                    chosen
                      ? "border-green-400 bg-green-50 dark:border-green-700 dark:bg-green-900/20"
                      : "border-border bg-background opacity-60"
                  }`}
                >
                  <span className="flex-1 truncate text-foreground">
                    {chunk.title}
                  </span>
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${s * 100}%` }}
                      transition={{ duration: 0.4 }}
                      className={`h-full ${
                        chosen ? "bg-green-500" : "bg-muted/40"
                      }`}
                    />
                  </div>
                  <span className="w-10 text-right font-mono text-muted">
                    {s.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] leading-relaxed text-muted">
            <strong className="text-foreground">Nhận xét:</strong> {info.hint}
          </p>
          <p className="text-[11px] leading-relaxed text-muted">
            <strong className="text-foreground">Câu hỏi giữ nguyên:</strong>{" "}
            &quot;{preset.question}&quot;
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SO SÁNH CÓ/KHÔNG RAG: stream câu trả lời
   ══════════════════════════════════════════════════════════════ */

function WithoutRAGBlock({ preset }: { preset: QueryPreset }) {
  const [go, setGo] = useState(false);
  const { displayed, done } = useStreamText(preset.hallucinated, go);

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="rounded-lg border border-border bg-surface p-3">
        <p className="mb-1 text-[11px] font-medium uppercase text-muted">
          Câu hỏi
        </p>
        <p className="text-sm font-medium text-foreground">
          {preset.question}
        </p>
      </div>

      {!go ? (
        <button
          type="button"
          onClick={() => setGo(true)}
          className="w-full rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          Hỏi LLM (KHÔNG có RAG)
        </button>
      ) : (
        <div className="space-y-2">
          <div className="rounded-lg border border-border bg-background/50 p-3">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {displayed}
              {!done && <Cursor />}
            </p>
          </div>
          {done && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300"
            >
              Cảnh báo: Có thể chứa thông tin sai / lỗi thời. Không trích dẫn
              được nguồn.
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

function WithRAGBlock({ preset }: { preset: QueryPreset }) {
  const [step, setStep] = useState(0);
  const { displayed, done: textDone } = useStreamText(
    preset.ragAnswer,
    step >= 4,
  );

  const advance = useCallback(
    () => setStep((s) => Math.min(s + 1, 4)),
    [],
  );

  useEffect(() => {
    if (step >= 1 && step < 4) {
      const t = setTimeout(advance, step === 2 ? 1500 : 1000);
      return () => clearTimeout(t);
    }
  }, [step, advance]);

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="rounded-lg border border-border bg-surface p-3">
        <p className="mb-1 text-[11px] font-medium uppercase text-muted">
          Câu hỏi
        </p>
        <p className="text-sm font-medium text-foreground">
          {preset.question}
        </p>
      </div>

      {step === 0 ? (
        <button
          type="button"
          onClick={() => setStep(1)}
          className="w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          Hỏi LLM (CÓ RAG)
        </button>
      ) : (
        <div className="space-y-3">
          {step >= 1 && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <StepBadge n={1} color="bg-blue-500" />
              <span className="text-xs font-medium text-foreground">
                Embed câu hỏi thành vector
              </span>
              {step > 1 && (
                <span className="text-xs text-green-500">&#10003;</span>
              )}
            </motion.div>
          )}
          {step >= 2 && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2">
                <StepBadge n={2} color="bg-amber-500" />
                <span className="text-xs font-medium text-foreground">
                  Truy xuất top-K chunk liên quan
                </span>
                {step > 2 && (
                  <span className="text-xs text-green-500">&#10003;</span>
                )}
              </div>
              <div className="ml-8 grid gap-1.5">
                {preset.relevant.map((idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-amber-400 bg-amber-50 p-2 text-[11px] dark:border-amber-600 dark:bg-amber-900/20"
                  >
                    <span className="font-semibold text-amber-800 dark:text-amber-200">
                      {CHUNKS[idx].title}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          {step >= 3 && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <StepBadge n={3} color="bg-green-500" />
              <span className="text-xs font-medium text-foreground">
                Ghép chunk + câu hỏi, gửi LLM
              </span>
              {step >= 4 && textDone && (
                <span className="text-xs text-green-500">&#10003;</span>
              )}
            </motion.div>
          )}
          {step >= 4 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="ml-8 space-y-2"
            >
              <div className="rounded-lg border border-border bg-background/50 p-3">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {displayed}
                  {!textDone && <Cursor />}
                </p>
              </div>
              {textDone && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-xs font-medium text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300"
                >
                  Ổn: Câu trả lời neo vào tài liệu thật và có trích dẫn [1],
                  [2].
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PIPELINE TỔNG: cho người dùng gõ câu hỏi + điều chỉnh top-K
   ══════════════════════════════════════════════════════════════ */

function RAGPipelinePlayground() {
  const [presetIdx, setPresetIdx] = useState(0);
  const [customQuery, setCustomQuery] = useState("");
  const [topK, setTopK] = useState(3);
  const preset = PRESETS[presetIdx];

  /* Câu hỏi hiển thị: nếu người dùng gõ tay thì dùng, không thì dùng preset */
  const displayQuestion = customQuery.trim() || preset.question;

  return (
    <div className="space-y-5">
      {/* Chọn preset hoặc gõ tay */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">
          Chọn câu hỏi có sẵn hoặc gõ câu hỏi của bạn:
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setPresetIdx(i);
                setCustomQuery("");
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                presetIdx === i && !customQuery
                  ? "bg-accent text-white"
                  : "border border-border bg-surface text-muted hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              {p.question}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={customQuery}
          onChange={(e) => setCustomQuery(e.target.value)}
          placeholder="Hoặc gõ câu hỏi tự do..."
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <p className="text-[11px] text-muted">
          Ghi chú: chunk liên quan chỉ chính xác với câu hỏi preset; câu hỏi
          tự do vẫn sẽ hiện pipeline nhưng chấm điểm sẽ dựa trên preset đang
          chọn.
        </p>
      </div>

      {/* Top-K slider */}
      <div className="rounded-lg border border-border bg-background/40 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">
            Top-K (số chunk đưa vào LLM)
          </span>
          <span className="rounded bg-accent px-2 py-0.5 text-[11px] font-mono text-white">
            K = {topK}
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={6}
          value={topK}
          onChange={(e) => setTopK(parseInt(e.target.value, 10))}
          className="w-full accent-accent"
        />
        <p className="mt-1 text-[11px] text-muted">
          K nhỏ → precision cao, có thể bỏ sót. K lớn → recall cao, nhưng dễ
          làm LLM rối vì noise.
        </p>
      </div>

      <IndexingStage />

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="mb-3 text-sm font-semibold text-foreground">
          Giai đoạn 2: Truy vấn (online) — &quot;{displayQuestion}&quot;
        </p>
        <QueryStage preset={preset} topK={topK} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   BỘ QUIZ — 8 câu hỏi trắc nghiệm
   ══════════════════════════════════════════════════════════════ */

const QUIZ: QuizQuestion[] = [
  {
    question: "RAG viết tắt của cụm từ nào?",
    options: [
      "Retrieval-Augmented Generation",
      "Random Answer Generator",
      "Recursive Attention Graph",
      "Real-time AI Gateway",
    ],
    correct: 0,
    explanation:
      "RAG = Retrieval-Augmented Generation — sinh nội dung được tăng cường bằng truy xuất tài liệu từ knowledge base.",
  },
  {
    question:
      "Trong pipeline RAG, bước nào diễn ra NGAY TRƯỚC khi LLM sinh câu trả lời?",
    options: [
      "Fine-tuning lại mô hình",
      "Truy xuất top-K chunk liên quan rồi ghép vào prompt",
      "Huấn luyện lại embedding model",
      "Đánh giá câu trả lời bằng BLEU score",
    ],
    correct: 1,
    explanation:
      "Trước khi gọi LLM, hệ thống RAG embed câu hỏi, tìm top-K chunk trong vector DB, rồi ghép các chunk đó cùng câu hỏi thành prompt cuối.",
  },
  {
    question: "Vấn đề nào của LLM được RAG giúp giảm nhẹ mạnh nhất?",
    options: [
      "Tốc độ inference chậm",
      "Chi phí training cao",
      "Hallucination — bịa đặt khi thiếu dữ liệu thực tế hoặc dữ liệu cũ",
      "Giới hạn context window",
    ],
    correct: 2,
    explanation:
      "RAG giảm hallucination bằng cách cho LLM đọc tài liệu thật trước khi trả lời. Câu trả lời vì thế có thể trích dẫn nguồn và kiểm chứng được.",
  },
  {
    question:
      "Tại sao phải chunk tài liệu thay vì embed cả file PDF 100 trang?",
    options: [
      "Vì embedding model có giới hạn độ dài đầu vào, và chunk nhỏ giúp truy xuất chính xác hơn",
      "Vì vector DB không lưu được file lớn",
      "Vì chunk làm LLM chạy nhanh hơn",
      "Vì chunk giúp tài liệu nhẹ khi lưu vào disk",
    ],
    correct: 0,
    explanation:
      "Embedding model thường chỉ xử lý vài trăm đến vài nghìn token. Chunk còn giúp vector biểu diễn ý cụ thể hơn, tránh hoà tan ý trong một vector duy nhất cho cả tài liệu.",
  },
  {
    question: "HyDE (Hypothetical Document Embeddings) hoạt động thế nào?",
    options: [
      "Lưu câu hỏi dưới dạng graph thay vì vector",
      "LLM tưởng tượng một câu trả lời giả trước, embed câu đó, rồi tìm chunk gần với câu trả lời giả",
      "Ẩn câu hỏi thật và chỉ gửi metadata lên LLM",
      "Tạo dữ liệu huấn luyện giả để fine-tune embedding",
    ],
    correct: 1,
    explanation:
      "HyDE dựa vào nhận xét: một câu trả lời giả trông giống tài liệu hơn câu hỏi, nên vector của nó thường gần các tài liệu thật hơn, từ đó tăng recall.",
  },
  {
    question: "Re-ranking khác gì so với cosine similarity thông thường?",
    options: [
      "Dùng bi-encoder thay vì cross-encoder",
      "Chạy nhanh hơn nhiều lần",
      "Dùng một cross-encoder đọc đồng thời câu hỏi và chunk để chấm điểm liên quan chính xác hơn, bù lại chậm hơn",
      "Không cần vector DB",
    ],
    correct: 2,
    explanation:
      "Bi-encoder (dùng cho retrieval ban đầu) mã hoá query và chunk riêng rồi đo cosine. Cross-encoder đọc cả cặp cùng lúc nên đánh giá tốt hơn, nhưng chỉ dùng cho giai đoạn rerank vì cost cao.",
  },
  {
    question: "Self-query RAG mang lại lợi ích nổi bật gì?",
    options: [
      "Tự fine-tune LLM ngay trong production",
      "Tự tách câu hỏi thành phần ngữ nghĩa và phần metadata filter (ngày, nguồn, tác giả...) để truy xuất có điều kiện",
      "Bỏ hoàn toàn bước embedding",
      "Tự động viết lại tài liệu gốc cho đúng",
    ],
    correct: 1,
    explanation:
      "Với câu hỏi dạng 'báo cáo tài chính quý 3 năm 2025', self-query tách ra filter ngày=Q3/2025, loại=financial trước khi tìm — tránh các chunk chỉ 'hao hao' về mặt ngôn ngữ.",
  },
  {
    type: "fill-blank",
    question:
      "Pipeline RAG gồm hai bước cốt lõi: đầu tiên hệ thống {blank} chunk liên quan từ vector DB, sau đó LLM {blank} câu trả lời dựa trên các chunk đó.",
    blanks: [
      { answer: "retrieve", accept: ["truy xuất", "tra cứu", "tìm kiếm", "retrieval"] },
      { answer: "generate", accept: ["sinh", "tạo", "tạo ra", "generation"] },
    ],
    explanation:
      "RAG = Retrieval-Augmented Generation. Bước 1 (Retrieve): tìm top-K chunk bằng vector search. Bước 2 (Generate): LLM đọc context + câu hỏi rồi sinh câu trả lời có trích dẫn.",
  },
];

/* ══════════════════════════════════════════════════════════════
   TRANG CHÍNH
   ══════════════════════════════════════════════════════════════ */

export default function RAGTopic() {
  const [compareIdx, setCompareIdx] = useState(0);

  return (
    <>
      {/* ───── STEP 1: HOOK — PredictionGate ───────────────────── */}
      <PredictionGate
        question="Bạn hỏi ChatGPT: 'Giá iPhone 16 ở Việt Nam bao nhiêu?' Nó trả lời rất tự tin nhưng SAI. Vì sao?"
        options={[
          "AI không biết giá mới nhất — dữ liệu huấn luyện đã cũ",
          "AI ghét Apple nên trả lời lệch",
          "AI cố tình đưa sai để bán quảng cáo",
        ]}
        correct={0}
        explanation="LLM chỉ biết dữ liệu đến thời điểm huấn luyện. Muốn trả lời đúng thông tin mới, nó phải TRA CỨU tài liệu cập nhật trước khi viết câu trả lời — đó chính là ý tưởng RAG."
      >
        {/* Phép ẩn dụ */}
        <div className="mb-5 rounded-xl border border-border bg-surface p-4">
          <p className="mb-2 text-sm font-semibold text-foreground">
            Phép ẩn dụ: LLM như một sinh viên thi cuối kỳ
          </p>
          <p className="text-sm leading-relaxed text-muted">
            Một sinh viên học thuộc sách từ 2 năm trước rồi đi thi. Giáo viên
            hỏi câu về sự kiện <em>tháng trước</em> — sinh viên không biết,
            nhưng vẫn trả lời tự tin vì &quot;phải viết gì đó&quot;. Đây là
            hallucination. RAG giống như <strong>cho phép sinh viên mở sách
            vào phòng thi</strong>: trước khi trả lời, họ tra đúng trang rồi
            trích dẫn. Câu trả lời vì thế vừa cập nhật vừa kiểm chứng được.
          </p>
        </div>

        <p className="mb-4 text-sm leading-relaxed text-muted">
          Bây giờ hãy xem trực tiếp điều gì xảy ra khi bạn hỏi{" "}
          <strong className="text-foreground">cùng một câu</strong> với và
          không có tài liệu tham khảo.
        </p>

        {/* ───── STEP 2: VisualizationSection ───────────────────── */}
        <VisualizationSection topicSlug={metadata.slug}>
          <div className="space-y-6">
            {/* So sánh có/không RAG */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">
                So sánh trực tiếp: LLM đơn thuần vs. LLM + RAG
              </p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setCompareIdx(i)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      compareIdx === i
                        ? "bg-accent text-white"
                        : "border border-border bg-surface text-muted hover:bg-surface-hover hover:text-foreground"
                    }`}
                  >
                    {p.question}
                  </button>
                ))}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <WithoutRAGBlock
                  preset={PRESETS[compareIdx]}
                  key={`a-${compareIdx}`}
                />
                <WithRAGBlock
                  preset={PRESETS[compareIdx]}
                  key={`b-${compareIdx}`}
                />
              </div>
            </div>

            {/* Pipeline playground */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">
                Pipeline đầy đủ: Tài liệu → Chunk → Embed → Vector DB → Truy
                xuất → LLM
              </p>
              <RAGPipelinePlayground />
            </div>

            {/* So sánh Naive vs Advanced RAG */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">
                Naive RAG vs. các kỹ thuật nâng cao
              </p>
              <AdvancedComparison />
            </div>
          </div>
        </VisualizationSection>

        {/* ───── STEP 3: AhaMoment ────────────────────────────── */}
        <AhaMoment>
          <p>
            Quy trình <strong>Hỏi → Embed → Tra cứu top-K → Ghép context →
            Trả lời</strong> bạn vừa tương tác chính là{" "}
            <strong>RAG (Retrieval-Augmented Generation)</strong>. Thay vì
            ép LLM &quot;nhớ&quot; mọi thứ, ta cho nó quyền tra cứu — y hệt
            con người dùng Google trước khi viết báo cáo.
          </p>
        </AhaMoment>

        {/* ───── STEP 4: InlineChallenge #1 ───────────────────── */}
        <InlineChallenge
          question="RAG giúp giảm hallucination. Nhưng nếu tài liệu trong knowledge base CŨNG SAI thì sao?"
          options={[
            "RAG vẫn đúng vì đã có retrieval",
            "RAG sẽ trả lời sai theo tài liệu sai — 'garbage in, garbage out' vẫn đúng",
            "RAG tự phát hiện và sửa tài liệu sai",
          ]}
          correct={1}
          explanation="RAG chỉ tốt bằng chất lượng knowledge base. Nếu chunk chứa thông tin sai hoặc outdated, LLM sẽ trích dẫn thông tin sai đó một cách rất tự tin. Vì vậy quy trình làm sạch, kiểm duyệt và cập nhật tài liệu là thiết yếu."
        />

        {/* ───── STEP 5: InlineChallenge #2 ───────────────────── */}
        <InlineChallenge
          question="Bạn có 1 triệu chunk và gọi LLM với top-K = 50 cho mỗi query. Vấn đề lớn nhất là gì?"
          options={[
            "Vector DB sẽ hết bộ nhớ",
            "Prompt quá dài → chi phí token cao, LLM dễ 'lost in the middle', tốc độ chậm",
            "LLM không biết tiếng Việt nữa",
          ]}
          correct={1}
          explanation="Nhồi quá nhiều chunk không tự động đồng nghĩa với câu trả lời tốt hơn. Context window có giới hạn; nhiều nghiên cứu cho thấy LLM bỏ sót thông tin ở giữa prompt. K nhỏ (3-5) kết hợp rerank thường hiệu quả hơn K lớn thô."
        />

        {/* ───── STEP 6: ExplanationSection ───────────────────── */}
        <ExplanationSection>
          {/* ----- Định nghĩa ----- */}
          <p>
            <strong>Retrieval-Augmented Generation (RAG)</strong> là kiến
            trúc kết hợp hai thành phần:
          </p>
          <ul className="list-disc space-y-1 pl-6 text-sm">
            <li>
              <strong>Retriever</strong> — tìm top-K đoạn văn bản liên quan
              nhất từ một kho tài liệu (vector DB);
            </li>
            <li>
              <strong>Generator</strong> — một LLM đọc câu hỏi + các đoạn
              truy xuất rồi sinh câu trả lời có trích dẫn.
            </li>
          </ul>
          <p>
            Thay vì bắt LLM ghi nhớ mọi sự thật trong trọng số, RAG tách biệt
            <em>kiến thức</em> (lưu trong tài liệu) khỏi <em>khả năng ngôn
            ngữ</em> (lưu trong LLM). Nhờ đó ta có thể cập nhật kiến thức chỉ
            bằng cách thêm/bớt tài liệu — không cần huấn luyện lại mô hình.
          </p>

          {/* ----- Các thành phần ----- */}
          <p>
            <strong>Các thành phần chính trong pipeline:</strong>
          </p>
          <ul className="list-disc space-y-1 pl-6 text-sm">
            <li>
              <strong>
                <TopicLink slug="chunking">Chunking</TopicLink>
              </strong>{" "}
              — cắt tài liệu dài thành đoạn 200-800 token kèm overlap.
            </li>
            <li>
              <strong>
                <TopicLink slug="embedding-model">Embedding Model</TopicLink>
              </strong>{" "}
              — biến mỗi chunk thành vector (ví dụ{" "}
              <code>text-embedding-3-small</code> với 1536 chiều).
            </li>
            <li>
              <strong>
                <TopicLink slug="vector-databases">Vector Store</TopicLink>
              </strong>{" "}
              — Pinecone, Chroma, FAISS, pgvector... lưu vector + metadata
              và hỗ trợ ANN search.
            </li>
            <li>
              <strong>Retriever</strong> — dùng{" "}
              <TopicLink slug="semantic-search">semantic search</TopicLink>{" "}
              để lấy top-K chunk (thường K = 3-10).
            </li>
            <li>
              <strong>Re-ranker</strong> (tuỳ chọn) — cross-encoder chấm lại
              độ liên quan.
            </li>
            <li>
              <strong>Generator (LLM)</strong> — nhận prompt{" "}
              <code>system + context + question</code> và sinh câu trả lời.
            </li>
          </ul>

          {/* ----- Công thức ----- */}
          <p>
            <strong>Về mặt toán học:</strong> gọi{" "}
            <LaTeX>{"q"}</LaTeX> là câu hỏi,{" "}
            <LaTeX>{"\\mathcal{D} = \\{d_1, \\ldots, d_N\\}"}</LaTeX> là kho
            tài liệu, và <LaTeX>{"\\phi"}</LaTeX> là embedding model. RAG
            trước tiên tính điểm tương đồng:
          </p>
          <LaTeX block>
            {"s(q, d_i) = \\cos\\bigl(\\phi(q), \\phi(d_i)\\bigr) = \\frac{\\phi(q)^\\top \\phi(d_i)}{\\lVert \\phi(q)\\rVert \\, \\lVert \\phi(d_i)\\rVert}"}
          </LaTeX>
          <p>
            Chọn tập top-K:{" "}
            <LaTeX>
              {"\\mathcal{R}(q) = \\operatorname{TopK}_{d \\in \\mathcal{D}} s(q, d)"}
            </LaTeX>
            . Xác suất sinh câu trả lời <LaTeX>{"y"}</LaTeX>:
          </p>
          <LaTeX block>
            {"p(y \\mid q) \\approx \\sum_{d \\in \\mathcal{R}(q)} p(d \\mid q) \\, p_\\theta(y \\mid q, d)"}
          </LaTeX>
          <p>
            Trong thực tế, pipeline đơn giản hoá: chỉ ghép các{" "}
            <LaTeX>{"d \\in \\mathcal{R}(q)"}</LaTeX> thành một prompt lớn
            rồi gọi LLM <LaTeX>{"p_\\theta(y \\mid \\text{prompt})"}</LaTeX>{" "}
            một lần duy nhất.
          </p>

          {/* ----- Code: LangChain RAG ----- */}
          <CodeBlock language="python" title="RAG cơ bản với LangChain">
{`from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA

# 1. LOAD — nạp tài liệu
docs = PyPDFLoader("chinh-sach-cong-ty.pdf").load()

# 2. CHUNK — cắt thành đoạn 500 ký tự, overlap 50
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
    separators=["\\n\\n", "\\n", ". ", " "],
)
chunks = splitter.split_documents(docs)

# 3. EMBED + 4. STORE — vector hoá và lưu vào Chroma
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = Chroma.from_documents(chunks, embeddings)

# 5. RETRIEVER — top-3 chunk liên quan
retriever = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 3},
)

# 6. GENERATOR — LLM đọc context + câu hỏi
qa_chain = RetrievalQA.from_chain_type(
    llm=ChatOpenAI(model="gpt-4o-mini", temperature=0),
    retriever=retriever,
    return_source_documents=True,
)

# 7. QUERY
result = qa_chain.invoke("Công ty có bao nhiêu ngày phép mỗi năm?")
print(result["result"])
for i, doc in enumerate(result["source_documents"], 1):
    print(f"[{i}] {doc.metadata['source']} — {doc.page_content[:100]}...")`}
          </CodeBlock>

          {/* ----- Code: Advanced RAG với rerank ----- */}
          <CodeBlock
            language="python"
            title="Advanced RAG: rerank + HyDE + query expansion"
          >
{`from sentence_transformers import CrossEncoder
from langchain_openai import ChatOpenAI

# ─── 1. Query expansion: viết lại câu hỏi thành 3 biến thể ───
def expand_query(q: str, llm: ChatOpenAI) -> list[str]:
    prompt = f"Viết 3 cách diễn đạt khác cho câu hỏi sau, mỗi cách 1 dòng:\\n{q}"
    response = llm.invoke(prompt).content
    return [q] + [line.strip() for line in response.split("\\n") if line.strip()]

# ─── 2. HyDE: tạo câu trả lời giả rồi embed câu đó ───
def hyde(q: str, llm: ChatOpenAI, embeddings) -> list[float]:
    fake = llm.invoke(f"Viết đoạn 3 câu trả lời cho: {q}").content
    return embeddings.embed_query(fake)

# ─── 3. Retrieve rộng rồi rerank ───
reranker = CrossEncoder("BAAI/bge-reranker-large")

def advanced_retrieve(q, vectorstore, llm, embeddings, k=3, fetch_k=20):
    # Bước A: query expansion → gom nhiều biến thể
    variants = expand_query(q, llm)
    pool = []
    for v in variants:
        pool.extend(vectorstore.similarity_search(v, k=fetch_k))

    # Bước B: dedupe theo page_content
    seen, unique = set(), []
    for d in pool:
        if d.page_content not in seen:
            seen.add(d.page_content)
            unique.append(d)

    # Bước C: rerank bằng cross-encoder
    pairs = [(q, d.page_content) for d in unique]
    scores = reranker.predict(pairs)
    ranked = sorted(zip(unique, scores), key=lambda x: x[1], reverse=True)

    return [doc for doc, _ in ranked[:k]]

# Sử dụng
llm = ChatOpenAI(model="gpt-4o-mini")
docs = advanced_retrieve("Giá iPhone 16 ở VN?", vectorstore, llm, embeddings)`}
          </CodeBlock>

          {/* ----- 4 Callouts ----- */}
          <Callout variant="tip" title="Mẹo chọn chunk size">
            <p className="text-sm leading-relaxed">
              Không có con số &quot;đúng&quot;. Văn bản kể chuyện (wiki, tin
              tức) hợp với chunk 800-1200 token. Văn bản Q&amp;A ngắn (FAQ,
              log chat) hợp với chunk 200-400 token. Luôn đặt overlap 10-20%
              để câu ở biên chunk không bị cắt ngang ý.
            </p>
          </Callout>

          <Callout variant="insight" title="Các chiến lược RAG nâng cao">
            <ul className="list-disc space-y-1 pl-6 text-sm">
              <li>
                <strong>HyDE:</strong> tạo tài liệu giả rồi embed tài liệu
                đó — vector gần tài liệu thật hơn so với vector câu hỏi.
              </li>
              <li>
                <strong>Self-RAG:</strong> LLM tự quyết định khi nào cần tra
                cứu và tự đánh giá chất lượng chunk trước khi dùng.
              </li>
              <li>
                <strong>Corrective RAG (CRAG):</strong> kiểm tra điểm tin
                cậy; nếu thấp, fallback sang web search thay vì KB.
              </li>
              <li>
                <strong>Multi-query / RAG-Fusion:</strong> viết lại câu hỏi
                thành N biến thể, gộp kết quả bằng Reciprocal Rank Fusion.
              </li>
              <li>
                <strong>Hybrid search:</strong> kết hợp{" "}
                <TopicLink slug="bm25">BM25</TopicLink> (lexical) và vector
                (semantic) bằng trọng số.
              </li>
            </ul>
          </Callout>

          <Callout variant="warning" title='Bẫy "lost in the middle"'>
            <p className="text-sm leading-relaxed">
              Nhiều nghiên cứu (Liu et al. 2023) cho thấy LLM nhớ tốt đầu và
              cuối prompt, nhưng dễ bỏ sót ý ở giữa khi context quá dài. Giải
              pháp: giữ K nhỏ (3-5), sort chunk theo mức quan trọng, và đặt
              chunk quan trọng nhất ở gần cuối prompt nếu có thể.
            </p>
          </Callout>

          <Callout variant="info" title="Đánh giá RAG cần ít nhất 3 chỉ số">
            <ul className="list-disc space-y-1 pl-6 text-sm">
              <li>
                <strong>Context precision / recall:</strong> chunk truy xuất
                có liên quan tới câu hỏi không? có bỏ sót chunk quan trọng
                không?
              </li>
              <li>
                <strong>Faithfulness:</strong> câu trả lời có bám sát các
                chunk không, hay LLM &quot;chế&quot; thêm?
              </li>
              <li>
                <strong>Answer relevance:</strong> câu trả lời có thực sự
                trả lời câu hỏi của người dùng không?
              </li>
            </ul>
            <p className="mt-2 text-sm">
              Frameworks phổ biến: RAGAS, TruLens, LangSmith eval.
            </p>
          </Callout>

          {/* ----- 2 CollapsibleDetails ----- */}
          <CollapsibleDetail title="Chi tiết: Bi-encoder vs Cross-encoder (tại sao rerank chậm)">
            <div className="space-y-2 text-sm leading-relaxed">
              <p>
                <strong>Bi-encoder</strong> (dùng cho retrieval giai đoạn 1):
                encode query và document <em>riêng biệt</em>, sau đó đo cosine.
                Chi phí encode document chỉ trả một lần khi index; lúc query
                chỉ cần 1 forward pass cho query + 1 phép nhân ma trận.
              </p>
              <LaTeX block>
                {"\\operatorname{sim}(q, d) = \\cos\\bigl(\\phi(q), \\phi(d)\\bigr)"}
              </LaTeX>
              <p>
                <strong>Cross-encoder</strong> (dùng cho rerank): đưa cả cặp{" "}
                <code>[query; document]</code> vào cùng một transformer, đầu
                ra là điểm liên quan.
              </p>
              <LaTeX block>
                {"\\operatorname{sim}(q, d) = f_\\theta([q; d])"}
              </LaTeX>
              <p>
                Cross-encoder đọc interaction giữa token query và token
                document, nên nhạy với sắc thái ngữ nghĩa hơn bi-encoder. Đổi
                lại nó đắt: mỗi cặp (q, d) cần 1 forward pass riêng. Với 1M
                document, nhân điều đó lên — không khả thi. Giải pháp: dùng
                bi-encoder lấy top-100 nhanh, rồi cross-encoder rerank xuống
                top-5 chậm-nhưng-đúng.
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="Chi tiết: Công thức Reciprocal Rank Fusion (RAG-Fusion)">
            <div className="space-y-2 text-sm leading-relaxed">
              <p>
                Khi query expansion trả về nhiều danh sách kết quả (mỗi biến
                thể một danh sách), ta cần cách gộp. Reciprocal Rank Fusion
                (RRF) là cách đơn giản, hiệu quả:
              </p>
              <LaTeX block>
                {"\\mathrm{RRF}(d) = \\sum_{r \\in R} \\frac{1}{k + \\mathrm{rank}_r(d)}"}
              </LaTeX>
              <p>
                Trong đó <LaTeX>{"R"}</LaTeX> là tập ranker (mỗi biến thể là
                một ranker), <LaTeX>{"\\mathrm{rank}_r(d)"}</LaTeX> là hạng
                của document <LaTeX>{"d"}</LaTeX> trong ranker{" "}
                <LaTeX>{"r"}</LaTeX>, và <LaTeX>{"k"}</LaTeX> là hằng số
                (thường 60).
              </p>
              <p>
                Ý nghĩa: document được xếp hạng cao trong NHIỀU biến thể sẽ
                có tổng điểm lớn — tức là nó thực sự liên quan dù cách diễn
                đạt câu hỏi khác nhau. RRF không yêu cầu chuẩn hoá score giữa
                các ranker, chỉ cần thứ hạng.
              </p>
              <p>
                Ví dụ: document <LaTeX>{"d_1"}</LaTeX> xếp hạng 1 ở ranker A
                và hạng 3 ở ranker B, với <LaTeX>{"k=60"}</LaTeX>:
              </p>
              <LaTeX block>
                {"\\mathrm{RRF}(d_1) = \\frac{1}{60+1} + \\frac{1}{60+3} \\approx 0.0323"}
              </LaTeX>
            </div>
          </CollapsibleDetail>

          {/* ----- Ứng dụng thực tế ----- */}
          <p>
            <strong>Ứng dụng trong thực tế:</strong>
          </p>
          <ul className="list-disc space-y-1 pl-6 text-sm">
            <li>
              <strong>Chatbot hỏi đáp tài liệu nội bộ:</strong> nhân viên
              hỏi &quot;quy định nghỉ phép&quot;, bot tra cứu handbook rồi
              trả lời kèm link tới trang gốc.
            </li>
            <li>
              <strong>Trợ lý lập trình:</strong> Cursor, GitHub Copilot Chat
              tra mã nguồn của chính repo bạn trước khi gợi ý — thay vì chỉ
              dựa vào model weights.
            </li>
            <li>
              <strong>Hỗ trợ khách hàng:</strong> RAG trên knowledge base của
              sản phẩm để trả lời FAQ chính xác theo phiên bản hiện hành.
            </li>
            <li>
              <strong>Nghiên cứu pháp lý, y khoa:</strong> bắt buộc trích
              dẫn nguồn; LLM thuần không thể dùng vì nguy cơ hallucination.
            </li>
            <li>
              <strong>
                <TopicLink slug="agentic-rag">Agentic RAG</TopicLink>:
              </strong>{" "}
              agent tự quyết định khi nào tra cứu, dùng công cụ nào, vòng
              lặp tra → suy luận → tra tiếp.
            </li>
            <li>
              <strong>Personalized assistant:</strong> mỗi user có KB riêng
              (email, Notes, lịch) — LLM trả lời dựa trên ngữ cảnh cá nhân.
            </li>
          </ul>

          {/* ----- Cạm bẫy ----- */}
          <p>
            <strong>Những cạm bẫy thường gặp:</strong>
          </p>
          <ul className="list-disc space-y-1 pl-6 text-sm">
            <li>
              <strong>Chunking sai cách:</strong> cắt giữa câu, mất ngữ cảnh
              → chunk trở nên vô nghĩa. Luôn dùng recursive splitter và đặt
              overlap.
            </li>
            <li>
              <strong>Embedding model yếu cho tiếng Việt:</strong> nhiều
              model OpenAI/Cohere vẫn hoạt động, nhưng với corpus tiếng Việt
              chuyên ngành, cân nhắc BGE-m3, multilingual-e5 hoặc fine-tune.
            </li>
            <li>
              <strong>Không cập nhật KB:</strong> tài liệu outdated →
              retrieval vẫn trả về đúng chunk nhưng thông tin đã sai thực
              tế.
            </li>
            <li>
              <strong>Quá tin top-1:</strong> score cosine cao không đồng
              nghĩa với liên quan; nhiều khi chunk có điểm 0.88 hoàn toàn
              lạc chủ đề. Luôn có rerank hoặc ngưỡng.
            </li>
            <li>
              <strong>Prompt injection qua tài liệu:</strong> kẻ xấu nhét
              &quot;Ignore previous instructions...&quot; vào tài liệu được
              index — khi chunk đó được retrieve, nó trở thành lệnh cho LLM.
              Cần sanitize và dùng structured prompt.
            </li>
            <li>
              <strong>Bỏ qua metadata:</strong> date, author, source giúp
              self-query và lọc rất nhiều. Lưu metadata từ đầu sẽ tiết kiệm
              thời gian reindex sau này.
            </li>
            <li>
              <strong>Không đo faithfulness:</strong> chỉ đo accuracy
              end-to-end không đủ. Phải kiểm tra LLM có thật sự dùng chunk
              hay vẫn &quot;chế&quot; từ pre-training.
            </li>
          </ul>
        </ExplanationSection>

        {/* ───── STEP 7: MiniSummary (6 ý) ─────────────────────── */}
        <MiniSummary
          points={[
            "RAG = Retrieval-Augmented Generation: tách kiến thức (tài liệu) khỏi khả năng ngôn ngữ (LLM), cho LLM tra cứu trước khi trả lời.",
            "Pipeline: Documents → Chunking → Embedding → Vector DB (offline) và Query → Embed → Retrieve top-K → Prompt → LLM → Answer (online).",
            "RAG giảm hallucination, cho phép cập nhật kiến thức không cần fine-tune, và sinh câu trả lời có trích dẫn kiểm chứng được.",
            "Chất lượng phụ thuộc chất lượng knowledge base — garbage in, garbage out. Chunking, embedding, metadata đều quan trọng.",
            "Advanced RAG: re-ranking (cross-encoder), HyDE (tài liệu giả), query expansion (nhiều biến thể), self-query (tách metadata filter) — cải thiện precision lẫn recall.",
            "Đánh giá RAG cần đồng thời context precision/recall, faithfulness, answer relevance — frameworks như RAGAS giúp tự động hoá.",
          ]}
        />

        {/* ───── STEP 8: QuizSection (8 câu) ───────────────────── */}
        <QuizSection questions={QUIZ} />
      </PredictionGate>
    </>
  );
}
