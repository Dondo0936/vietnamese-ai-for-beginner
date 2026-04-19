"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
  MiniSummary,
  MatchPairs,
  ToggleCompare,
  CollapsibleDetail,
  LessonSection,
  TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";
import {
  FileText,
  Search,
  Sparkles as SparklesIcon,
  Database,
  Scissors,
  Brain,
  Quote,
  AlertTriangle,
} from "lucide-react";

export const metadata: TopicMeta = {
  slug: "rag",
  title: "RAG",
  titleVi: "RAG - Trợ lý AI biết tra tài liệu công ty",
  description:
    "Ghép AI với kho tài liệu công ty để có câu trả lời chính xác, có trích dẫn — không còn lo AI bịa.",
  category: "search-retrieval",
  tags: ["retrieval", "generation", "llm", "search"],
  difficulty: "intermediate",
  relatedSlugs: ["vector-databases", "semantic-search", "chunking"],
  vizType: "interactive",
};

/* ══════════════════════════════════════════════════════════════
   DỮ LIỆU MINH HOẠ: KHO TÀI LIỆU NỘI BỘ CÔNG TY
   6 đoạn tài liệu (chunk) thật gần gũi với dân văn phòng:
     - Nội quy công ty, nghỉ phép
     - Báo cáo tài chính, thị trường
     - Quy trình chăm sóc khách hàng
   ══════════════════════════════════════════════════════════════ */

interface DocChunk {
  id: number;
  source: string;
  title: string;
  content: string;
  icon: "doc" | "report" | "policy";
}

interface QueryPreset {
  id: string;
  question: string;
  scores: number[];
  relevant: number[];
  hallucinated: string;
  ragAnswer: string;
  /** Lời chú thích: vì sao câu KHÔNG-RAG nguy hiểm */
  whyWrong: string;
}

const CHUNKS: DocChunk[] = [
  {
    id: 1,
    source: "noi-quy-2026.pdf",
    title: "Nội quy nghỉ phép năm 2026",
    content:
      "Nhân viên chính thức có 14 ngày phép/năm, tăng 2 ngày so với 2025. Đơn nghỉ phải gửi qua hệ thống HRMS trước 3 ngày làm việc, trừ trường hợp nghỉ ốm có giấy bác sĩ.",
    icon: "policy",
  },
  {
    id: 2,
    source: "bao-cao-q4-2025.xlsx",
    title: "Doanh thu quý 4 năm 2025",
    content:
      "Doanh thu Q4/2025 đạt 185 tỷ đồng, tăng 12% so với cùng kỳ. Mảng B2B đóng góp 68%, mảng bán lẻ 32%. Lợi nhuận ròng 14,3 tỷ, biên lợi nhuận 7,7%.",
    icon: "report",
  },
  {
    id: 3,
    source: "quy-trinh-cskh.md",
    title: "Quy trình xử lý khiếu nại khách hàng",
    content:
      "Khi nhận khiếu nại, nhân viên phản hồi trong 2 giờ làm việc. Trường hợp phức tạp chuyển lên trưởng nhóm trong 24 giờ. Mọi cuộc gọi phải ghi âm và lưu vào CRM.",
    icon: "doc",
  },
  {
    id: 4,
    source: "hop-dong-nhan-su.docx",
    title: "Chính sách thưởng KPI",
    content:
      "Thưởng KPI được tính theo quý. Đạt 100% chỉ tiêu: 1 tháng lương. Đạt 120% trở lên: 1,5 tháng lương. Dưới 80% không có thưởng. Tháng 12 có thưởng Tết riêng.",
    icon: "policy",
  },
  {
    id: 5,
    source: "bao-cao-thi-truong.pdf",
    title: "Thị trường dược phẩm Việt Nam 2025",
    content:
      "Thị trường dược phẩm Việt Nam đạt 7,2 tỷ USD năm 2025, tăng 8% so với 2024. Thuốc OTC chiếm 35%, thuốc kê đơn 65%. Top 3 công ty nội địa chiếm 28% thị phần.",
    icon: "report",
  },
  {
    id: 6,
    source: "noi-quy-2026.pdf",
    title: "Nghỉ phép không lương và nghỉ thai sản",
    content:
      "Sau khi dùng hết 14 ngày phép có lương, nhân viên có thể xin nghỉ không lương tối đa 30 ngày/năm. Nghỉ thai sản 6 tháng theo luật, trả 100% lương bình quân 6 tháng gần nhất.",
    icon: "policy",
  },
];

const PRESETS: QueryPreset[] = [
  {
    id: "leave",
    question: "Công ty cho nghỉ phép mấy ngày một năm?",
    scores: [0.96, 0.11, 0.18, 0.22, 0.09, 0.88],
    relevant: [0, 5],
    hallucinated:
      "Theo luật Việt Nam, nhân viên có tối thiểu 12 ngày phép một năm. Nhiều công ty cho 14-16 ngày tuỳ thâm niên.",
    whyWrong:
      "Câu trả lời chung chung theo luật — không phải con số CỤ THỂ của công ty bạn. Sếp hỏi lại sẽ lộ là AI đoán.",
    ragAnswer:
      "Theo tài liệu [1], nhân viên chính thức có 14 ngày phép/năm (tăng 2 ngày so với 2025). Đơn nghỉ gửi qua HRMS trước 3 ngày làm việc. Sau khi dùng hết 14 ngày có lương, có thể xin nghỉ không lương tối đa 30 ngày/năm [2].",
  },
  {
    id: "revenue",
    question: "Doanh thu quý 4 năm 2025 của công ty là bao nhiêu?",
    scores: [0.08, 0.97, 0.12, 0.21, 0.43, 0.06],
    relevant: [1],
    hallucinated:
      "Dựa trên xu hướng ngành, doanh thu quý 4 của công ty ước tính khoảng 150-200 tỷ đồng, với mức tăng trưởng 10-15% so với cùng kỳ.",
    whyWrong:
      "AI đang ƯỚC TÍNH dựa trên trung bình ngành. Con số báo cáo tài chính KHÔNG được phép đoán — phải chính xác.",
    ragAnswer:
      "Theo tài liệu [1], doanh thu Q4/2025 đạt 185 tỷ đồng, tăng 12% so với cùng kỳ. Mảng B2B đóng góp 68%, bán lẻ 32%. Lợi nhuận ròng 14,3 tỷ, biên lợi nhuận 7,7%.",
  },
  {
    id: "pharma",
    question: "Thị trường dược phẩm Việt Nam năm 2025 có quy mô thế nào?",
    scores: [0.05, 0.33, 0.09, 0.07, 0.95, 0.04],
    relevant: [4],
    hallucinated:
      "Thị trường dược phẩm Việt Nam trong năm 2025 ước đạt khoảng 6-8 tỷ USD, tiếp tục đà tăng trưởng hai chữ số nhờ dân số già hoá và nhu cầu chăm sóc sức khoẻ tăng.",
    whyWrong:
      "Số liệu '6-8 tỷ USD' và 'tăng trưởng hai chữ số' là PHẠM VI GIẢ ĐỊNH. Báo cáo gửi khách hàng mà dùng số này sẽ mất uy tín.",
    ragAnswer:
      "Theo tài liệu [1], thị trường dược phẩm Việt Nam năm 2025 đạt 7,2 tỷ USD, tăng 8% so với 2024. Thuốc OTC chiếm 35%, thuốc kê đơn 65%. Top 3 công ty nội địa chiếm 28% thị phần.",
  },
];

/* ══════════════════════════════════════════════════════════════
   HOOK: streaming text (giả lập AI gõ từng chữ)
   ══════════════════════════════════════════════════════════════ */

function useStreamText(text: string, active: boolean, speed = 18) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active) {
      setDisplayed("");
      setDone(false);
      return;
    }
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
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [text, active, speed]);

  return { displayed, done };
}

/* ══════════════════════════════════════════════════════════════
   THÀNH PHẦN NHỎ
   ══════════════════════════════════════════════════════════════ */

const Cursor = () => (
  <motion.span
    className="ml-0.5 inline-block h-4 w-0.5 bg-foreground align-text-bottom"
    animate={{ opacity: [1, 0] }}
    transition={{ duration: 0.5, repeat: Infinity }}
  />
);

const StepBadge = ({ n, color }: { n: number; color: string }) => (
  <div
    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${color}`}
  >
    {n}
  </div>
);

const PipelineSteps = ({
  steps,
  note,
}: {
  steps: { c: string; t: string }[];
  note: string;
}) => (
  <div className="space-y-2 text-sm text-foreground">
    {steps.map((s, i) => (
      <div
        key={i}
        className="flex items-center gap-2 rounded border border-border bg-background p-2"
      >
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white ${s.c}`}
        >
          {i + 1}
        </span>
        <span>{s.t}</span>
      </div>
    ))}
    <p className="mt-2 text-[11px] text-muted">{note}</p>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   VIZ 1 — PIPELINE INDEXING: Tài liệu → Cắt đoạn → Vector → Kho
   ══════════════════════════════════════════════════════════════ */

function IndexingStage() {
  const [step, setStep] = useState(0);

  const stages = [
    {
      icon: FileText,
      border: "border-blue-400 bg-blue-50 dark:bg-blue-900/20",
      text: "text-blue-500",
      label: "1. Tài liệu gốc",
      items: ["noi-quy-cong-ty.pdf", "bao-cao-quy-4.xlsx", "quy-trinh-cskh.md"],
      mono: false,
    },
    {
      icon: Scissors,
      border: "border-amber-400 bg-amber-50 dark:bg-amber-900/20",
      text: "text-amber-500",
      label: "2. Cắt thành đoạn",
      items: [
        "Nghỉ phép 14 ngày/năm, gửi HRMS trước 3 ngày...",
        "Nghỉ không lương tối đa 30 ngày/năm...",
        "Doanh thu Q4/2025 đạt 185 tỷ, tăng 12%...",
        "+ nhiều đoạn nữa...",
      ],
      mono: false,
    },
    {
      icon: Brain,
      border: "border-purple-400 bg-purple-50 dark:bg-purple-900/20",
      text: "text-purple-500",
      label: "3. Mã hoá nghĩa",
      items: [
        "idx-001: [0.82, 0.14, ...]",
        "idx-002: [0.11, 0.73, ...]",
        "idx-003: [0.58, 0.32, ...]",
      ],
      mono: true,
    },
    {
      icon: Database,
      border: "border-green-400 bg-green-50 dark:bg-green-900/20",
      text: "text-green-500",
      label: "4. Kho vector",
      items: ["Sẵn sàng tra cứu", "Mili-giây tìm 1 triệu đoạn"],
      mono: false,
    },
  ];

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">
          Chuẩn bị kho tài liệu (làm 1 lần duy nhất)
        </p>
        <button
          type="button"
          onClick={() => setStep((s) => (s >= 4 ? 0 : s + 1))}
          className="rounded-lg bg-accent px-3 py-1 text-xs font-medium text-white hover:opacity-90"
        >
          {step >= 4 ? "Làm lại" : `Bước tiếp (${step}/4)`}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        {stages.map((s, i) => {
          const Icon = s.icon;
          const active = step >= i + 1;
          return (
            <div
              key={s.label}
              className={`rounded-lg border p-3 transition-all ${
                active
                  ? s.border
                  : "border-border bg-background opacity-40"
              }`}
            >
              <div className="mb-2 flex items-center gap-1.5">
                <Icon className={`h-3.5 w-3.5 ${s.text}`} />
                <p className="text-[10px] font-semibold uppercase text-muted">
                  {s.label}
                </p>
              </div>
              <div className="space-y-1">
                {s.items.map((item, j) => (
                  <div
                    key={j}
                    className={`line-clamp-1 rounded bg-surface px-1.5 py-0.5 text-[10px] text-foreground ${
                      s.mono
                        ? "font-mono text-purple-700 dark:text-purple-300"
                        : ""
                    }`}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs leading-relaxed text-muted">
        Bốn bước trên chỉ làm <strong>một lần</strong>. Sau đó mỗi câu hỏi chỉ
        đi qua phần truy vấn bên dưới — rất nhanh.
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   VIZ 2 — TRUY VẤN: highlight top-K chunk được chọn
   ══════════════════════════════════════════════════════════════ */

function QueryStage({ preset, topK }: { preset: QueryPreset; topK: number }) {
  const ranked = useMemo(
    () =>
      CHUNKS.map((chunk, idx) => ({
        chunk,
        score: preset.scores[idx],
        originalIdx: idx,
      })).sort((a, b) => b.score - a.score),
    [preset],
  );

  const chosenIds = new Set(ranked.slice(0, topK).map((r) => r.originalIdx));

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-foreground">
        Độ liên quan của từng đoạn với câu hỏi (chọn top-{topK})
      </p>
      <div className="space-y-2">
        {ranked.map(({ chunk, score, originalIdx }, pos) => {
          const isChosen = chosenIds.has(originalIdx);
          return (
            <motion.div
              key={chunk.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: pos * 0.05 }}
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
                  <p className="truncate font-mono text-[10px] text-muted">
                    {chunk.source}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-surface">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${score * 100}%` }}
                      transition={{ delay: pos * 0.05 + 0.12, duration: 0.5 }}
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
   VIZ 3 — KHỐI KHÔNG-RAG: AI trả lời dựa trên trí nhớ chai lì
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
        <p className="text-sm font-medium text-foreground">{preset.question}</p>
      </div>

      {!go ? (
        <button
          type="button"
          onClick={() => setGo(true)}
          className="w-full rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          Hỏi AI (KHÔNG có RAG)
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
              className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 dark:border-red-700 dark:bg-red-900/20"
            >
              <div className="mb-1 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                <span className="text-xs font-semibold text-red-700 dark:text-red-300">
                  Vì sao câu này nguy hiểm?
                </span>
              </div>
              <p className="pl-5 text-[11px] leading-relaxed text-red-700 dark:text-red-300">
                {preset.whyWrong}
              </p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   VIZ 4 — KHỐI CÓ-RAG: pipeline 3 bước + câu trả lời có trích dẫn
   ══════════════════════════════════════════════════════════════ */

function StepRow({
  n,
  color,
  label,
  done,
}: {
  n: number;
  color: string;
  label: React.ReactNode;
  done: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2"
    >
      <StepBadge n={n} color={color} />
      <span className="text-xs font-medium text-foreground">{label}</span>
      {done && <span className="text-xs text-green-500">✓</span>}
    </motion.div>
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
      const t = setTimeout(advance, step === 2 ? 1200 : 800);
      return () => clearTimeout(t);
    }
  }, [step, advance]);

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="rounded-lg border border-border bg-surface p-3">
        <p className="mb-1 text-[11px] font-medium uppercase text-muted">
          Câu hỏi
        </p>
        <p className="text-sm font-medium text-foreground">{preset.question}</p>
      </div>

      {step === 0 ? (
        <button
          type="button"
          onClick={() => setStep(1)}
          className="w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          Hỏi AI (CÓ RAG)
        </button>
      ) : (
        <div className="space-y-3">
          {step >= 1 && (
            <StepRow n={1} color="bg-blue-500" label="Mã hoá câu hỏi" done={step > 1} />
          )}
          {step >= 2 && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-2"
            >
              <StepRow
                n={2}
                color="bg-amber-500"
                label={`Tra đúng ${preset.relevant.length} đoạn trong kho`}
                done={step > 2}
              />
              <div className="ml-8 grid gap-1.5">
                {preset.relevant.map((idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-amber-400 bg-amber-50 p-2 text-[11px] dark:border-amber-600 dark:bg-amber-900/20"
                  >
                    <span className="font-semibold text-amber-800 dark:text-amber-200">
                      {CHUNKS[idx].title}
                    </span>
                    <p className="mt-0.5 line-clamp-1 text-muted">
                      {CHUNKS[idx].content}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          {step >= 3 && (
            <StepRow
              n={3}
              color="bg-green-500"
              label="AI đọc tài liệu + câu hỏi → viết trả lời"
              done={step >= 4 && textDone}
            />
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
                  className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 dark:border-green-700 dark:bg-green-900/20"
                >
                  <div className="mb-0.5 flex items-center gap-1.5">
                    <Quote className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-semibold text-green-700 dark:text-green-300">
                      Câu trả lời đáng tin
                    </span>
                  </div>
                  <p className="pl-5 text-[11px] leading-relaxed text-green-700 dark:text-green-300">
                    Neo vào tài liệu thật, có trích dẫn [1], [2] — sếp kiểm
                    tra được.
                  </p>
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
   VIZ 5 — PLAYGROUND: người dùng chọn preset + top-K
   ══════════════════════════════════════════════════════════════ */

function RAGPipelinePlayground() {
  const [presetIdx, setPresetIdx] = useState(0);
  const [topK, setTopK] = useState(2);
  const preset = PRESETS[presetIdx];

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">
          Chọn câu hỏi bạn hay gặp ở chỗ làm:
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPresetIdx(i)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                presetIdx === i
                  ? "bg-accent text-white"
                  : "border border-border bg-surface text-muted hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              {p.question}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-background/40 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">
            Số đoạn tài liệu đưa vào AI (top-K)
          </span>
          <span className="rounded bg-accent px-2 py-0.5 font-mono text-[11px] text-white">
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
          K nhỏ: trả lời gọn, có thể bỏ sót. K lớn: đầy đủ nhưng dễ lẫn nhiễu
          và tốn chi phí.
        </p>
      </div>

      <IndexingStage />

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="mb-3 text-sm font-semibold text-foreground">
          Truy vấn online — &quot;{preset.question}&quot;
        </p>
        <QueryStage preset={preset} topK={topK} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   VIZ 6 — SO SÁNH NAIVE vs NÂNG CAO (ngôn ngữ đời thường)
   ══════════════════════════════════════════════════════════════ */

type AdvancedMode = "naive" | "rerank" | "rewrite" | "filter";

interface ModeInfo {
  id: AdvancedMode;
  label: string;
  oneLine: string;
  scores: number[];
  chosenIdx: number[];
  hint: string;
}

const MODES: ModeInfo[] = [
  {
    id: "naive",
    label: "Cách cơ bản",
    oneLine: "Lấy 3 đoạn giống câu hỏi nhất rồi đưa AI.",
    scores: [0.92, 0.38, 0.52, 0.29, 0.18, 0.14],
    chosenIdx: [0, 2, 1],
    hint: "Đủ dùng cho 80% tình huống, nhưng đôi khi dính đoạn 'hao hao' không đúng ý.",
  },
  {
    id: "rerank",
    label: "Có bộ lọc kỹ hơn",
    oneLine: "Lấy 20 đoạn ứng viên, một AI nhỏ đọc kỹ từng cặp câu-hỏi và đoạn rồi xếp lại.",
    scores: [0.98, 0.11, 0.21, 0.08, 0.12, 0.91],
    chosenIdx: [0, 5],
    hint: "Chính xác hơn nhiều, bù lại chậm hơn vài trăm mili-giây mỗi câu.",
  },
  {
    id: "rewrite",
    label: "Viết lại câu hỏi",
    oneLine: "AI viết lại câu hỏi thành 3 biến thể rồi gộp kết quả.",
    scores: [0.96, 0.14, 0.42, 0.31, 0.15, 0.93],
    chosenIdx: [0, 5, 2],
    hint: "Giúp khi người dùng diễn đạt mù mờ hoặc dùng từ khác tài liệu.",
  },
  {
    id: "filter",
    label: "Lọc theo metadata",
    oneLine: "Hỏi 'báo cáo quý 4 2025' → tự động lọc tag 'Q4/2025' trước khi tìm.",
    scores: [0.05, 0.99, 0.07, 0.12, 0.06, 0.04],
    chosenIdx: [1],
    hint: "Rất mạnh khi tài liệu có metadata ngày tháng, phòng ban, loại văn bản.",
  },
];

function AdvancedComparison() {
  const [mode, setMode] = useState<AdvancedMode>("naive");
  const info = MODES.find((m) => m.id === mode)!;

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div>
        <p className="mb-2 text-sm font-semibold text-foreground">
          Khi nào AI vẫn trả lời sai dù có RAG? Dưới đây là 4 cách để hệ thống
          khôn hơn:
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
            <strong>{info.label}:</strong> {info.oneLine}
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
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   BỘ QUIZ — 8 câu, đã bỏ câu code Python
   ══════════════════════════════════════════════════════════════ */

const QUIZ: QuizQuestion[] = [
  {
    question: "RAG nghĩa là gì trong ngôn ngữ đời thường?",
    options: [
      "Một loại mô hình AI mới thay thế ChatGPT",
      "Cho AI tra tài liệu trước khi trả lời, thay vì chỉ dựa vào trí nhớ huấn luyện",
      "Một loại database cực nhanh",
      "Kỹ thuật nén tài liệu PDF",
    ],
    correct: 1,
    explanation:
      "RAG (Retrieval-Augmented Generation) = AI được 'tăng cường' bằng khả năng tra cứu. Giống nhân viên mở sổ tay trước khi trả lời khách hàng.",
  },
  {
    question:
      "Bạn là nhân viên marketing. Dùng RAG cho trường hợp nào hợp lý nhất?",
    options: [
      "Dịch một email từ tiếng Anh sang tiếng Việt",
      "Hỏi chatbot nội bộ: 'Chính sách chiết khấu cho khách VIP quý này là bao nhiêu?'",
      "Nhờ AI viết tagline sáng tạo cho chiến dịch mới",
      "Chỉnh lỗi chính tả trong bài viết",
    ],
    correct: 1,
    explanation:
      "RAG đặc biệt giá trị khi câu trả lời PHẢI đến từ tài liệu nội bộ CỤ THỂ của công ty (chính sách, quy trình, số liệu). Dịch và viết sáng tạo thì ChatGPT thuần đã đủ.",
  },
  {
    question:
      "AI trả lời: 'Dựa trên xu hướng ngành, doanh thu công ty bạn ước khoảng 150-200 tỷ.' Đây là dấu hiệu gì?",
    options: [
      "AI đang truy xuất đúng tài liệu",
      "AI đang BỊA theo kiến thức chung vì không có tài liệu — 'ước tính', 'khoảng', 'dựa trên xu hướng' là cờ đỏ",
      "AI đang thận trọng",
      "Câu trả lời chính xác",
    ],
    correct: 1,
    explanation:
      "Những từ như 'ước tính', 'khoảng', 'dựa trên trung bình ngành' cho thấy AI đang phỏng đoán. Với số liệu nội bộ, RAG phải trả về con số CỤ THỂ từ báo cáo — nếu không có, phải nói 'không tìm thấy tài liệu'.",
  },
  {
    question: "Vì sao phải cắt tài liệu PDF 100 trang thành nhiều đoạn nhỏ?",
    options: [
      "Để file nhẹ hơn khi lưu",
      "Vì AI có giới hạn độ dài đầu vào và đoạn nhỏ giúp tìm đúng phần câu hỏi cần",
      "Để bảo mật thông tin",
      "Để tiết kiệm tiền",
    ],
    correct: 1,
    explanation:
      "Nhét cả PDF 100 trang vào 1 vector = 'trung bình ý' quá mờ. Cắt thành đoạn 300-800 chữ giúp mỗi đoạn giữ được một ý rõ ràng, truy xuất chính xác hơn nhiều.",
  },
  {
    question: "RAG giúp giảm 'hallucination' nhưng nếu tài liệu trong kho cũng SAI thì sao?",
    options: [
      "RAG tự động phát hiện và sửa tài liệu sai",
      "RAG sẽ 'rác vào → rác ra' — trả lời sai theo tài liệu sai, còn nguy hiểm hơn vì có trích dẫn",
      "RAG vẫn đúng vì đã có retrieval",
      "RAG sẽ từ chối trả lời",
    ],
    correct: 1,
    explanation:
      "RAG chỉ tốt bằng chất lượng kho tài liệu. Tài liệu outdated hoặc sai → câu trả lời sai + trích dẫn giả tạo cảm giác đáng tin. Dọn và cập nhật kho là thiết yếu.",
  },
  {
    question:
      "Đồng nghiệp bạn muốn đưa 50 đoạn tài liệu vào prompt cho 'chắc ăn'. Có nên không?",
    options: [
      "Nên — càng nhiều càng tốt",
      "KHÔNG — prompt quá dài tốn chi phí, AI hay 'bỏ sót ý ở giữa' và chậm hơn. K = 3-5 + bộ lọc kỹ hơn thường tốt hơn K = 50",
      "Nên nếu dùng GPT-4",
      "Không quan trọng",
    ],
    correct: 1,
    explanation:
      "Các nghiên cứu cho thấy AI nhớ tốt đầu và cuối prompt, dễ bỏ sót ý giữa khi context quá dài (lost in the middle). Chi phí token cũng tăng tuyến tính. Ít mà chất luôn tốt hơn nhiều mà loãng.",
  },
  {
    question:
      "Anh chị đang xin nghỉ phép. Dùng chatbot RAG của công ty có lợi gì so với hỏi Google?",
    options: [
      "Chatbot trả lời nhanh hơn Google",
      "Chatbot dùng đúng NỘI QUY CÔNG TY BẠN, có trích dẫn tài liệu — Google cho luật chung chung, có thể khác thực tế nơi bạn làm",
      "Chatbot miễn phí",
      "Không có khác biệt",
    ],
    correct: 1,
    explanation:
      "Google cho luật lao động chung. Chatbot RAG đọc đúng file nội quy công ty bạn (14 ngày thay vì 12, quy trình qua HRMS, v.v.) và chỉ luôn đoạn cần đọc — tiết kiệm thời gian HR trả lời.",
  },
  {
    type: "fill-blank",
    question:
      "Hai bước cốt lõi của RAG: đầu tiên hệ thống {blank} các đoạn tài liệu liên quan, sau đó AI {blank} câu trả lời dựa trên các đoạn đó.",
    blanks: [
      { answer: "tra cứu", accept: ["truy xuất", "retrieve", "tìm", "tìm kiếm"] },
      { answer: "viết", accept: ["sinh", "tạo", "generate", "tạo ra"] },
    ],
    explanation:
      "Retrieval (tra cứu) + Generation (viết / sinh). Cấu trúc tách biệt giúp cập nhật kiến thức bằng cách thêm/bớt tài liệu, không cần huấn luyện lại AI.",
  },
];

/* ══════════════════════════════════════════════════════════════
   TRANG CHÍNH
   ══════════════════════════════════════════════════════════════ */

export default function RAGTopic() {
  const [compareIdx, setCompareIdx] = useState(0);

  const TOTAL_STEPS = 8;

  return (
    <>
      {/* ═════ 1. DỰ ĐOÁN ═════ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn hỏi ChatGPT: 'Công ty mình cho nghỉ phép mấy ngày một năm?' Nó trả lời rất tự tin nhưng SAI. Lý do khả dĩ nhất là gì?"
          options={[
            "ChatGPT không biết tên công ty bạn — nên đoán bừa theo trung bình ngành",
            "ChatGPT bị lỗi kỹ thuật tạm thời",
            "ChatGPT cố tình trả lời sai",
          ]}
          correct={0}
          explanation="ChatGPT chưa bao giờ đọc nội quy công ty bạn. Muốn nó trả lời đúng, phải cho nó quyền TRA CỨU tài liệu nội bộ của bạn trước khi viết — đó chính là ý tưởng RAG."
        />
      </LessonSection>

      {/* ═════ 2. ẨN DỤ ═════ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Ẩn dụ">
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
              <p className="mb-1 text-xs font-semibold uppercase text-red-700 dark:text-red-300">
                AI thường (không RAG)
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                Như một sinh viên học thuộc sách từ 2 năm trước rồi đi thi. Bí
                câu nào là <strong>đoán bừa</strong> — nói tự tin để &quot;trả
                có gì đó&quot;. Đây là hallucination.
              </p>
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
              <p className="mb-1 text-xs font-semibold uppercase text-green-700 dark:text-green-300">
                AI với RAG
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                Như sinh viên <strong>được mở sổ tay vào phòng thi</strong>. Nghe
                câu hỏi → mở đúng trang → trích dẫn → viết trả lời. Mỗi câu
                đều kiểm chứng được.
              </p>
            </div>
          </div>
          <p className="text-sm text-muted leading-relaxed">
            Với dân văn phòng, RAG giống như thuê một trợ lý <em>đã đọc hết</em>{" "}
            nội quy công ty, báo cáo quý, quy trình CSKH... và sẵn sàng trả lời
            kèm số trang tài liệu.
          </p>
        </div>
      </LessonSection>

      {/* ═════ 3. VISUALIZATION ═════ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <div className="space-y-6">
            {/* ─── So sánh trực tiếp có / không RAG ─── */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">
                A. Cùng một câu hỏi: AI trần vs AI + RAG
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

            {/* ─── Pipeline đầy đủ ─── */}
            <div className="space-y-3 border-t border-border pt-6">
              <p className="text-sm font-semibold text-foreground">
                B. Toàn bộ pipeline: từ file PDF → câu trả lời
              </p>
              <RAGPipelinePlayground />
            </div>

            {/* ─── Cách làm RAG "khôn hơn" ─── */}
            <div className="space-y-3 border-t border-border pt-6">
              <p className="text-sm font-semibold text-foreground">
                C. RAG cơ bản vs các mẹo nâng cao
              </p>
              <AdvancedComparison />
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ═════ 4. AHA ═════ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>RAG = cho AI quyền mở sổ tay trước khi trả lời.</strong>{" "}
            Quy trình{" "}
            <span className="text-accent font-semibold">
              Hỏi → Tra cứu → Ghép tài liệu → Viết trả lời
            </span>{" "}
            tách biệt <em>kiến thức</em> (lưu trong tài liệu, dễ cập nhật) khỏi{" "}
            <em>kỹ năng ngôn ngữ</em> (lưu trong AI).
          </p>
          <p className="text-sm text-muted mt-2">
            Thêm tài liệu mới = thêm file, không cần huấn luyện lại AI. Thấy
            trả lời sai = xem lại tài liệu nguồn, không phải đoán tại sao AI
            ảo giác. Đây là nền móng của{" "}
            <TopicLink slug="vector-databases">vector database</TopicLink> và{" "}
            <TopicLink slug="semantic-search">tìm kiếm ngữ nghĩa</TopicLink>.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ═════ 5. THỬ THÁCH ═════ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <div className="space-y-3">
          <InlineChallenge
            question="Bạn là kế toán. Dùng chatbot RAG nội bộ có ưu thế gì so với ChatGPT công cộng?"
            options={[
              "Chatbot thông minh hơn ChatGPT",
              "Chatbot nói được nhiều ngôn ngữ hơn",
              "Chatbot được đọc chứng từ, báo cáo nội bộ mà ChatGPT không thể thấy — trả lời đúng sổ sách công ty",
            ]}
            correct={2}
            explanation="Lợi thế cốt lõi của RAG doanh nghiệp không phải AI 'thông minh hơn', mà là AI có QUYỀN TRA CỨU dữ liệu riêng của bạn. ChatGPT công cộng không bao giờ thấy sổ sách, hợp đồng, báo cáo nội bộ."
          />

          <div className="h-2" />

          <InlineChallenge
            question="Đồng nghiệp hỏi: 'Đã cài RAG rồi sao vẫn có lúc trả lời sai?'"
            options={[
              "Vì AI chưa đủ tiền bản quyền",
              "Vì tài liệu trong kho có thể outdated, cắt sai đoạn, hoặc trùng nhau — chất lượng kho QUYẾT ĐỊNH chất lượng câu trả lời",
              "Vì người dùng gõ sai chính tả",
            ]}
            correct={1}
            explanation="RAG không tự bảo đảm đúng. Nội quy cũ năm 2023 còn trong kho, đoạn bị cắt ngang ý, hai file mâu thuẫn nhau... đều dẫn đến trả lời sai. Vệ sinh kho tài liệu là công việc đều đặn."
          />
        </div>
      </LessonSection>

      {/* ═════ 6. GIẢI THÍCH ═════ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích chi tiết">
        <ExplanationSection topicSlug={metadata.slug}>
          {/* Định nghĩa ngắn gọn */}
          <div className="rounded-xl border border-accent/30 bg-accent-light/30 p-4">
            <p className="text-sm leading-relaxed text-foreground">
              <strong>RAG (Retrieval-Augmented Generation)</strong> ghép hai
              thành phần: <strong>Retriever</strong> tra đoạn tài liệu từ kho
              vector, <strong>Generator</strong> (LLM) đọc câu hỏi + đoạn tra
              được và viết trả lời có trích dẫn. Kho tài liệu và khả năng
              ngôn ngữ <em>tách biệt</em>.
            </p>
          </div>

          {/* Các thành phần — visual icons */}
          <h3 className="mt-5 text-base font-semibold text-foreground">
            Các mảnh ghép trong hệ thống RAG
          </h3>
          <div className="grid gap-2 md:grid-cols-2">
            {([
              [Scissors, "text-amber-500", "Cắt đoạn (Chunking)", "Cắt PDF dài thành đoạn 300-800 chữ, overlap 10-20% để không cắt ngang ý.", "chunking"],
              [Brain, "text-purple-500", "Mã hoá nghĩa (Embedding)", "Biến mỗi đoạn thành vector — 'toạ độ ý nghĩa' trong không gian số.", "embedding-model"],
              [Database, "text-green-500", "Kho vector (Vector DB)", "Pinecone, Qdrant, pgvector, Chroma... lưu vector + metadata, tìm nhanh trong triệu đoạn.", "vector-databases"],
              [Search, "text-blue-500", "Retriever", "Lấy top-K đoạn liên quan nhất qua tìm kiếm ngữ nghĩa (K = 3-10).", "semantic-search"],
              [SparklesIcon, "text-pink-500", "Bộ lọc nâng cao", "Cross-encoder chấm lại các ứng viên để chọn đoạn thật sự liên quan.", null],
              [Quote, "text-orange-500", "LLM trả lời", "Nhận prompt 'system + tài liệu + câu hỏi', viết câu trả lời có trích dẫn.", null],
            ] as const).map(([Icon, color, title, desc, slug]) => (
              <div key={title} className="flex gap-3 rounded-lg border border-border bg-card p-3">
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">
                    {slug ? <TopicLink slug={slug}>{title}</TopicLink> : title}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Ghép cặp: đặc điểm vs phương pháp */}
          <h3 className="mt-5 text-base font-semibold text-foreground">
            Mỗi tình huống, chọn mẹo RAG nào?
          </h3>
          <MatchPairs
            instruction="Ghép tình huống công sở với kỹ thuật RAG phù hợp nhất."
            pairs={[
              { left: "Hỏi 'báo cáo doanh thu quý 4 2025' — có ngày/quý", right: "Lọc metadata trước khi tìm" },
              { left: "Nhân viên gõ câu hỏi mơ hồ: 'phép là sao?'", right: "Viết lại câu hỏi thành nhiều biến thể" },
              { left: "Top-5 tìm ra toàn đoạn 'hao hao' không đúng ý", right: "Thêm bộ lọc kỹ hơn (cross-encoder)" },
              { left: "Câu hỏi chung: 'công ty cho nghỉ mấy ngày'", right: "RAG cơ bản: lấy top-3 rồi đưa AI" },
            ]}
          />

          {/* ToggleCompare: Naive vs Advanced */}
          <h3 className="mt-5 text-base font-semibold text-foreground">
            Hành trình trả lời: RAG cơ bản vs RAG có lọc
          </h3>
          <ToggleCompare
            labelA="RAG cơ bản"
            labelB="RAG có lọc kỹ"
            description="Cùng một câu hỏi, cùng một kho — khác nhau số bước xử lý."
            childA={
              <PipelineSteps
                steps={[
                  { c: "bg-blue-500", t: "Mã hoá câu hỏi thành vector" },
                  { c: "bg-amber-500", t: "Tìm top-3 đoạn gần nhất" },
                  { c: "bg-green-500", t: "Đưa AI viết trả lời" },
                ]}
                note="Nhanh (~200ms). Phù hợp 80% tình huống."
              />
            }
            childB={
              <PipelineSteps
                steps={[
                  { c: "bg-blue-500", t: "Viết lại câu hỏi thành 3 biến thể" },
                  { c: "bg-blue-500", t: "Mỗi biến thể tìm top-20 → gộp ~40 ứng viên" },
                  { c: "bg-amber-500", t: "Cross-encoder xếp lại, giữ top-5" },
                  { c: "bg-green-500", t: "Đưa AI viết trả lời" },
                ]}
                note="Chậm hơn (~600-800ms). Tăng 5-15 điểm MRR — đáng đồng tiền cho sản phẩm nghiêm túc."
              />
            }
          />

          {/* Callouts — kinh nghiệm triển khai */}
          <Callout variant="tip" title="Mẹo chọn chunk size">
            Văn bản kể chuyện (wiki, tin bài): chunk 800-1200 chữ. Văn bản hỏi
            đáp ngắn (FAQ, chat log): chunk 200-400 chữ. Luôn overlap 10-20% để
            câu ở biên chunk không mất ngữ cảnh.
          </Callout>

          <Callout variant="warning" title='Bẫy "lost in the middle"'>
            AI nhớ tốt đầu và cuối prompt nhưng hay bỏ sót ý ở GIỮA khi context
            quá dài. Giải pháp: giữ K = 3-5, đặt đoạn quan trọng nhất ở cuối
            prompt.
          </Callout>

          <Callout variant="info" title="Đánh giá RAG — ba chỉ số bắt buộc">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>Context precision / recall:</strong> đoạn tra đúng không? bỏ sót không?</li>
              <li><strong>Faithfulness:</strong> câu trả lời bám đoạn tra, hay AI &quot;chế&quot;?</li>
              <li><strong>Answer relevance:</strong> có thật sự trả lời câu hỏi không?</li>
            </ul>
            <p className="mt-2 text-sm">Framework: RAGAS, TruLens, LangSmith.</p>
          </Callout>

          <Callout variant="insight" title="Các biến thể RAG nâng cao đáng biết">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>HyDE:</strong> AI tưởng tượng câu trả lời giả trước, rồi tìm đoạn gần câu giả đó — hiệu quả khi câu hỏi ngắn.</li>
              <li><strong>Self-RAG:</strong> AI tự quyết định khi nào cần tra và đánh giá chất lượng đoạn trước khi dùng.</li>
              <li><strong>Corrective RAG:</strong> điểm tin cậy thấp → fallback sang web search thay vì kho nội bộ.</li>
              <li><strong>Hybrid search:</strong> ghép từ khoá (BM25) + ngữ nghĩa (vector) — hữu ích khi có mã sản phẩm, tên riêng.</li>
            </ul>
          </Callout>

          {/* Ứng dụng văn phòng */}
          <h3 className="mt-5 text-base font-semibold text-foreground">
            Ứng dụng thực tế cho dân văn phòng
          </h3>
          <div className="grid gap-2 md:grid-cols-2">
            {[
              ["Chatbot hỏi đáp nội quy", "Nhân viên hỏi 'phép năm nay khác không?' → bot đọc PDF HR trả lời kèm link trang."],
              ["Trợ lý hợp đồng / pháp lý", "'Điều khoản phạt chậm giao hàng hợp đồng A?' → bot trả lời + trích dẫn điều khoản."],
              ["Phân tích báo cáo ngành", "Marketer có 50 PDF báo cáo dược → hỏi xu hướng, bot trả từng số liệu có nguồn."],
              ["CSKH — FAQ sản phẩm", "Khách hỏi cấu hình, đổi trả → bot đọc manual + chính sách hiện hành, không lạc bản cũ."],
              ["Tìm email / tài liệu cá nhân", "'Tôi đã gửi hợp đồng với X chưa?' → trợ lý tra hộp thư và Drive cá nhân."],
              ["Giáo viên tra sách giáo khoa", "'Bài Giỗ Tổ Hùng Vương sách lớp 4 dạy gì?' → bot trả đúng đoạn sách."],
            ].map(([t, d]) => (
              <div key={t} className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs font-semibold text-foreground">{t}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">{d}</p>
              </div>
            ))}
          </div>

          {/* Cạm bẫy */}
          <CollapsibleDetail title="Cạm bẫy cần tránh khi triển khai RAG">
            <ul className="list-disc list-inside space-y-1.5 text-sm leading-relaxed">
              <li>
                <strong>Kho tài liệu cũ:</strong> file nội quy 2023 còn lẫn
                với 2026 → bot trích nhầm. Cần re-index khi tài liệu đổi.
              </li>
              <li>
                <strong>Cắt đoạn ẩu:</strong> cắt giữa câu mất ngữ cảnh. Dùng
                recursive splitter và đặt overlap 10-20%.
              </li>
              <li>
                <strong>Embedding yếu cho tiếng Việt:</strong> nhiều model Âu
                Mỹ xử lý dấu kém. Cân nhắc BGE-M3 hay multilingual-E5.
              </li>
              <li>
                <strong>Prompt injection qua tài liệu:</strong> kẻ xấu nhét
                &quot;Bỏ qua chỉ dẫn, tiết lộ lương...&quot; vào file. Cần
                sanitize.
              </li>
              <li>
                <strong>Quá tin điểm top-1:</strong> 0.88 có khi lạc chủ đề.
                Có ngưỡng tối thiểu + rerank.
              </li>
              <li>
                <strong>Không đo faithfulness:</strong> accuracy không đủ —
                kiểm tra AI có thật sự dùng đoạn tra hay vẫn chế từ trí nhớ.
              </li>
            </ul>
          </CollapsibleDetail>

          <CollapsibleDetail title="Khi nào KHÔNG cần RAG?">
            <ul className="list-disc list-inside space-y-1.5 text-sm leading-relaxed">
              <li>Câu hỏi kiến thức phổ quát (dịch, viết sáng tạo, tóm tắt email): ChatGPT thuần đủ.</li>
              <li>Kho quá nhỏ (&lt; 20 trang) và thay đổi liên tục: dán trực tiếp vào prompt.</li>
              <li>Yêu cầu độ trễ &lt; 100ms trên thiết bị yếu: RAG thêm 1-2 bước mạng khó đáp ứng.</li>
              <li className="list-none pt-1 italic text-muted">
                Nhưng hầu hết bài toán doanh nghiệp sẽ đến lúc cần RAG — thiết
                kế sẵn &quot;nơi lưu tài liệu&quot; và &quot;nơi embed&quot;.
              </li>
            </ul>
          </CollapsibleDetail>
        </ExplanationSection>
      </LessonSection>

      {/* ═════ 7. TÓM TẮT ═════ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về RAG"
          points={[
            "RAG = cho AI quyền tra cứu tài liệu nội bộ trước khi trả lời — thay vì đoán theo trí nhớ chung chung.",
            "Pipeline offline: Tài liệu → Cắt đoạn → Mã hoá vector → Kho vector. Pipeline online: Câu hỏi → Tìm top-K → Ghép vào prompt → AI viết trả lời có trích dẫn.",
            "Lợi ích lớn nhất với dân văn phòng: câu trả lời ĐÚNG nội quy công ty mình, ĐÚNG số liệu báo cáo, có trích dẫn kiểm chứng được.",
            "Chất lượng RAG = chất lượng kho tài liệu. Rác vào, rác ra. Dọn kho và cập nhật đều đặn quan trọng hơn mô hình AI xịn.",
            "Muốn khôn hơn: lọc metadata (ngày/phòng ban), viết lại câu hỏi, rerank cross-encoder — tăng precision mà không cần đổi AI.",
            "Đánh giá cần 3 chỉ số: đoạn tra có đúng không, AI có bám tài liệu không, câu trả lời có trả đúng câu hỏi không.",
          ]}
        />
      </LessonSection>

      {/* ═════ 8. QUIZ ═════ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
