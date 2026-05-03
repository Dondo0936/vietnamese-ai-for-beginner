"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChefHat,
  UtensilsCrossed,
  BookOpenCheck,
  Sparkles,
  Mail,
  Shield,
  AlertTriangle,
  Database,
  Brain,
  Zap,
  MessageSquare,
  Calculator,
  Camera,
  Music,
  Check,
  X,
} from "lucide-react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  TopicLink,
  StepReveal,
  ToggleCompare,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "what-is-ml",
  title: "What is Machine Learning?",
  titleVi: "Machine Learning là gì?",
  description:
    "Làm quen với Machine Learning qua hình ảnh quen thuộc: một đầu bếp học nấu từ nếm thử, khác với công thức cứng. Bạn sẽ thấy máy học từ ví dụ như thế nào.",
  category: "foundations",
  tags: ["introduction", "machine-learning", "basics"],
  difficulty: "beginner",
  relatedSlugs: [
    "supervised-unsupervised-rl",
    "linear-regression",
    "data-preprocessing",
  ],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

/* ──────────────────────────────────────────────────────────────
   DỮ LIỆU: ba bài toán — với mỗi bài, người học chọn cách tiếp
   cận phù hợp (lập trình thường hay ML).
   ────────────────────────────────────────────────────────────── */

type ApproachKey = "classic" | "ml";

interface ProblemScenario {
  id: string;
  icon: typeof Calculator;
  title: string;
  prompt: string;
  rightChoice: ApproachKey;
  why: string;
}

const PROBLEM_SCENARIOS: ProblemScenario[] = [
  {
    id: "tax",
    icon: Calculator,
    title: "Tính tiền điện",
    prompt:
      "Mỗi kWh là 2.500 đồng. Tính tiền điện khi biết số kWh tiêu thụ trong tháng.",
    rightChoice: "classic",
    why:
      "Quy tắc quá rõ ràng: tiền = kWh × 2.500. Một dòng công thức là đủ. Dùng ML ở đây vừa chậm, vừa khó kiểm tra, vừa không chính xác bằng công thức tay.",
  },
  {
    id: "spam",
    icon: Mail,
    title: "Chặn email rác",
    prompt:
      "Hộp thư nhận 1000 email mỗi ngày. Phân biệt email thật và email rác. Kiểu rác thay đổi liên tục.",
    rightChoice: "ml",
    why:
      "Spammer đổi từ ngữ mỗi tuần. Không ai viết nổi một bộ luật if-else bám kịp. ML học pattern từ hàng triệu email thật, tự cập nhật khi có dữ liệu mới.",
  },
  {
    id: "photo",
    icon: Camera,
    title: "Nhận ra mèo trong ảnh",
    prompt:
      "Cho một ảnh bất kỳ, cần biết trong ảnh có con mèo hay không, không phụ thuộc giống, màu lông, tư thế.",
    rightChoice: "ml",
    why:
      "Mèo có hàng nghìn biến thể. Không thể viết luật \"tai nhọn + râu dài\" vì luật đó cũng đúng với cáo, chồn. ML học từ hàng triệu ảnh có nhãn, tự rút ra đặc điểm.",
  },
  {
    id: "music",
    icon: Music,
    title: "Đặt lại thứ tự bài hát",
    prompt:
      "Có danh sách 50 bài hát. Cần sắp xếp theo tên bài theo thứ tự a-b-c.",
    rightChoice: "classic",
    why:
      "Sắp xếp theo alphabet đã có thuật toán chuẩn từ những năm 1960. Chỉ cần một dòng code. ML ở đây là \"dùng búa tạ để đóng đinh mũ\".",
  },
];

/* ──────────────────────────────────────────────────────────────
   COMPONENT PHỤ: Bếp — animation nhỏ so sánh hai đầu bếp
   ────────────────────────────────────────────────────────────── */

function RuleBasedChef() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <BookOpenCheck size={18} className="text-blue-500" />
        <h4 className="text-sm font-semibold text-foreground">
          Đầu bếp theo công thức
        </h4>
      </div>
      <ul className="space-y-1.5 text-xs text-foreground/85 leading-relaxed">
        <li className="flex items-start gap-2">
          <span className="text-blue-500 font-bold">1.</span>
          <span>Mở sách: &ldquo;Phở bò: 3 lít nước, 500g bò&rdquo;.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-blue-500 font-bold">2.</span>
          <span>Cân đúng, đo đúng, bỏ đúng lượng.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-blue-500 font-bold">3.</span>
          <span>Ra đúng vị đã ghi trong sách.</span>
        </li>
      </ul>
      <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 text-xs text-foreground/80 leading-relaxed">
        Nếu hôm nay thịt hơi khác, nước hơi mặn, đầu bếp này vẫn làm y
        như sách. Vị thay đổi, nhưng quy trình không đổi.
      </div>
    </div>
  );
}

function LearningChef() {
  const [batch, setBatch] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setBatch((b) => (b + 1) % 4), 2200);
    return () => clearInterval(id);
  }, []);

  const stages = [
    "Nồi thứ 1: quá mặn. Ghi nhớ.",
    "Nồi thứ 10: bớt muối được rồi.",
    "Nồi thứ 50: vị đang ổn. Nếm thêm chút.",
    "Nồi thứ 200: ai cũng khen. Công thức trong đầu đã chín.",
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ChefHat size={18} className="text-emerald-500" />
        <h4 className="text-sm font-semibold text-foreground">
          Đầu bếp học từ nếm thử
        </h4>
      </div>
      <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3 min-h-[92px] flex items-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={batch}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
            className="text-xs text-foreground/90 leading-relaxed"
          >
            {stages[batch]}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="flex gap-1.5">
        {stages.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= batch ? "bg-emerald-500" : "bg-surface"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted italic leading-relaxed">
        Không ai đọc công thức cho đầu bếp này. Cô ấy tự tích kinh nghiệm
        sau mỗi lần nếm thử, nên càng nấu nhiều thì càng nấu chuẩn.
      </p>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   COMPONENT PHỤ: Vòng lặp huấn luyện — ví dụ đoán giá nước cam
   ────────────────────────────────────────────────────────────── */

type GuessSample = {
  input: string;
  truth: number;
  guess: number;
  label: string;
};

function TrainingLoopDemo() {
  const [iter, setIter] = useState(0);

  const samples: GuessSample[][] = useMemo(
    () => [
      [
        { input: "Ly nhỏ", truth: 15, guess: 25, label: "Vòng 1: đoán lung tung" },
        { input: "Ly vừa", truth: 25, guess: 25, label: "Vòng 1: đoán lung tung" },
        { input: "Ly to", truth: 40, guess: 25, label: "Vòng 1: đoán lung tung" },
      ],
      [
        { input: "Ly nhỏ", truth: 15, guess: 20, label: "Vòng 50: bớt sai" },
        { input: "Ly vừa", truth: 25, guess: 27, label: "Vòng 50: bớt sai" },
        { input: "Ly to", truth: 40, guess: 35, label: "Vòng 50: bớt sai" },
      ],
      [
        { input: "Ly nhỏ", truth: 15, guess: 15, label: "Vòng 500: gần đúng" },
        { input: "Ly vừa", truth: 25, guess: 26, label: "Vòng 500: gần đúng" },
        { input: "Ly to", truth: 40, guess: 39, label: "Vòng 500: gần đúng" },
      ],
      [
        { input: "Ly nhỏ", truth: 15, guess: 15, label: "Vòng 2000: đã học xong" },
        { input: "Ly vừa", truth: 25, guess: 25, label: "Vòng 2000: đã học xong" },
        { input: "Ly to", truth: 40, guess: 40, label: "Vòng 2000: đã học xong" },
      ],
    ],
    [],
  );

  const current = samples[iter];
  const maxIter = samples.length - 1;

  return (
    <div className="rounded-xl border-2 border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain size={18} className="text-accent" />
          <h4 className="text-sm font-semibold text-foreground">
            Máy học đoán giá nước cam (theo ly)
          </h4>
        </div>
        <span className="text-xs font-semibold text-accent px-2 py-1 rounded-full bg-accent-light">
          {current[0].label}
        </span>
      </div>

      <p className="text-xs text-muted leading-relaxed">
        Mục tiêu: đoán giá (nghìn đồng) của ba loại ly. Máy bắt đầu với
        số ngẫu nhiên, rồi mỗi vòng so với giá thật và tự điều chỉnh.
      </p>

      <div className="grid grid-cols-3 gap-3">
        {current.map((s, i) => {
          const diff = Math.abs(s.guess - s.truth);
          const maxDiff = 25;
          const errPct = Math.min(100, (diff / maxDiff) * 100);
          const color =
            diff === 0
              ? "#10b981"
              : diff < 5
                ? "#22c55e"
                : diff < 15
                  ? "#f59e0b"
                  : "#ef4444";
          return (
            <div
              key={s.input + i}
              className="rounded-lg border border-border bg-surface p-3 space-y-2"
            >
              <p className="text-[11px] font-semibold text-tertiary uppercase">
                {s.input}
              </p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] text-muted">Máy đoán</p>
                  <p
                    className="text-lg font-bold tabular-nums"
                    style={{ color }}
                  >
                    {s.guess}k
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted">Giá thật</p>
                  <p className="text-lg font-bold text-foreground tabular-nums">
                    {s.truth}k
                  </p>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-surface-hover overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: color }}
                  animate={{ width: `${errPct}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <p
                className="text-[10px] text-right tabular-nums"
                style={{ color }}
              >
                Lệch {diff}k
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {samples.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-8 rounded-full transition-colors ${
                i <= iter ? "bg-accent" : "bg-surface"
              }`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIter(0)}
            disabled={iter === 0}
            className="rounded-lg px-3 py-1.5 text-xs font-medium border border-border text-muted hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Bắt đầu lại
          </button>
          <button
            type="button"
            onClick={() => setIter((i) => Math.min(i + 1, maxIter))}
            disabled={iter >= maxIter}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-accent text-white hover:bg-accent-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {iter >= maxIter ? "Đã học xong" : "Chạy thêm"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   COMPONENT PHỤ: Bảng chọn tiếp cận — người học bấm, thấy giải
   thích tức thì.
   ────────────────────────────────────────────────────────────── */

function ApproachPicker() {
  const [picks, setPicks] = useState<Record<string, ApproachKey | null>>(
    () =>
      Object.fromEntries(PROBLEM_SCENARIOS.map((p) => [p.id, null])) as Record<
        string,
        ApproachKey | null
      >,
  );
  const [showAll, setShowAll] = useState(false);

  const correctCount = PROBLEM_SCENARIOS.filter(
    (p) => picks[p.id] === p.rightChoice,
  ).length;
  const answeredCount = Object.values(picks).filter((v) => v !== null).length;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted leading-relaxed">
        Cho bốn bài toán dưới đây, theo bạn: nên dùng <strong>lập trình thường</strong>{" "}
        (viết luật if-else), hay <strong>Machine Learning</strong> (cho máy học
        từ ví dụ)?
      </p>

      <div className="grid grid-cols-1 gap-3">
        {PROBLEM_SCENARIOS.map((p) => {
          const Icon = p.icon;
          const picked = picks[p.id];
          const correct = picked === p.rightChoice;
          const revealed = showAll || picked !== null;
          return (
            <div
              key={p.id}
              className={`rounded-xl border-2 p-4 transition-colors ${
                !revealed
                  ? "border-border bg-card"
                  : correct
                    ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                    : "border-amber-400 bg-amber-50 dark:bg-amber-900/20"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-surface border border-border">
                  <Icon size={18} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground mb-1">
                    {p.title}
                  </p>
                  <p className="text-xs text-muted leading-relaxed mb-3">
                    {p.prompt}
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={picked !== null}
                      onClick={() =>
                        setPicks((prev) => ({ ...prev, [p.id]: "classic" }))
                      }
                      className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                        picked === "classic"
                          ? p.rightChoice === "classic"
                            ? "border-emerald-500 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200"
                            : "border-rose-500 bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200"
                          : picked !== null
                            ? "border-border bg-card text-muted opacity-60"
                            : "border-border bg-card text-foreground hover:border-accent/60"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 justify-center">
                        <BookOpenCheck size={12} /> Lập trình thường
                      </div>
                    </button>
                    <button
                      type="button"
                      disabled={picked !== null}
                      onClick={() =>
                        setPicks((prev) => ({ ...prev, [p.id]: "ml" }))
                      }
                      className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                        picked === "ml"
                          ? p.rightChoice === "ml"
                            ? "border-emerald-500 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200"
                            : "border-rose-500 bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200"
                          : picked !== null
                            ? "border-border bg-card text-muted opacity-60"
                            : "border-border bg-card text-foreground hover:border-accent/60"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 justify-center">
                        <Brain size={12} /> Machine Learning
                      </div>
                    </button>
                  </div>

                  <AnimatePresence>
                    {revealed && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <p className="text-xs text-foreground/80 leading-relaxed mt-3 pt-3 border-t border-border/50">
                          <span
                            className={`inline-flex items-center gap-1 font-semibold ${
                              correct
                                ? "text-emerald-700 dark:text-emerald-300"
                                : "text-amber-700 dark:text-amber-300"
                            }`}
                          >
                            {correct ? (
                              <Check size={12} aria-hidden="true" />
                            ) : (
                              <AlertTriangle size={12} aria-hidden="true" />
                            )}
                            Đáp án:{" "}
                            {p.rightChoice === "classic"
                              ? "Lập trình thường"
                              : "Machine Learning"}
                            .
                          </span>{" "}
                          {p.why}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <p className="text-xs text-muted">
          Đã làm {answeredCount}/{PROBLEM_SCENARIOS.length}
          {answeredCount > 0 && `, đúng ${correctCount}`}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium border border-border text-muted hover:bg-surface-hover transition-colors"
          >
            {showAll ? "Ẩn lời giải" : "Xem hết lời giải"}
          </button>
          <button
            type="button"
            onClick={() => {
              setPicks(
                Object.fromEntries(
                  PROBLEM_SCENARIOS.map((p) => [p.id, null]),
                ) as Record<string, ApproachKey | null>,
              );
              setShowAll(false);
            }}
            className="rounded-lg px-3 py-1.5 text-xs font-medium border border-border text-muted hover:bg-surface-hover transition-colors"
          >
            Làm lại
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   PIPELINE SVG — vẽ theo dữ liệu để đỡ cồng kềnh
   ────────────────────────────────────────────────────────────── */

const PIPE_STAGES = [
  {
    x: 20,
    w: 130,
    color: "#22c55e",
    title: "Dữ liệu",
    lines: ["Ví dụ có nhãn:", "ảnh + tên,", "email + nhãn rác"],
    highlight: false,
  },
  {
    x: 195,
    w: 140,
    color: "#3b82f6",
    title: "Học",
    lines: ["Máy đọc ví dụ,", "đoán, so đáp án,", "tự chỉnh, lặp", "hàng triệu lần."],
    highlight: false,
  },
  {
    x: 380,
    w: 130,
    color: "#20B8B0",
    title: "Mô hình",
    lines: ["Bộ não đã học,", "có thể dùng", "cho việc mới."],
    highlight: true,
  },
  {
    x: 555,
    w: 110,
    color: "#8b5cf6",
    title: "Dự đoán",
    lines: ["Dữ liệu mới", "đi vào, đáp án", "đi ra."],
    highlight: false,
  },
];

function PipelineSVG() {
  return (
    <svg
      viewBox="0 0 680 220"
      className="w-full max-w-3xl mx-auto"
      aria-label="Vòng học của Machine Learning"
    >
      <defs>
        <linearGradient id="wip-ml-glow" x1="0" x2="1">
          <stop offset="0" stopColor="#22c55e" stopOpacity="0.2" />
          <stop offset="1" stopColor="#3b82f6" stopOpacity="0.2" />
        </linearGradient>
        <marker
          id="wip-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto"
        >
          <path d="M0,0 L10,5 L0,10 z" fill="#94a3b8" />
        </marker>
      </defs>

      {PIPE_STAGES.map((s, i) => {
        const cx = s.x + s.w / 2;
        const boxY = s.highlight ? 50 : 60;
        const boxH = s.highlight ? 120 : 100;
        return (
          <g key={s.title}>
            <rect
              x={s.x}
              y={boxY}
              width={s.w}
              height={boxH}
              rx={14}
              fill={s.highlight ? "var(--accent-light, #eff6ff)" : "url(#wip-ml-glow)"}
              stroke={s.color}
              strokeWidth={s.highlight ? 2.5 : 2}
            />
            <text
              x={cx}
              y={boxY + 30}
              textAnchor="middle"
              fontSize="13"
              fontWeight="700"
              fill={s.highlight ? s.color : "var(--color-foreground, #0f172a)"}
            >
              {s.title}
            </text>
            {s.lines.map((line, li) => (
              <text
                key={li}
                x={cx}
                y={boxY + 50 + li * 13}
                textAnchor="middle"
                fontSize="11"
                fill="var(--color-muted, #64748b)"
              >
                {line}
              </text>
            ))}
            {i < PIPE_STAGES.length - 1 && (
              <path
                d={`M ${s.x + s.w} 110 L ${PIPE_STAGES[i + 1].x} 110`}
                stroke="#94a3b8"
                strokeWidth="2"
                markerEnd="url(#wip-arrow)"
                fill="none"
              />
            )}
          </g>
        );
      })}

      {/* Feedback loop */}
      <path
        d="M 610 170 Q 610 200 445 200 Q 265 200 265 180"
        stroke="#94a3b8"
        strokeWidth="1.5"
        strokeDasharray="5,4"
        fill="none"
        markerEnd="url(#wip-arrow)"
      />
      <text
        x="430"
        y="215"
        textAnchor="middle"
        fontSize="11"
        fill="var(--color-muted, #64748b)"
        fontStyle="italic"
      >
        Có dữ liệu mới → học lại
      </text>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   COMPONENT CHÍNH
   ══════════════════════════════════════════════════════════════ */

export default function WhatIsMlTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "Sự khác biệt cơ bản giữa lập trình thường và Machine Learning là gì?",
        options: [
          "Lập trình thường dùng máy tính, ML thì không",
          "Lập trình thường: người viết quy tắc. ML: máy tự tìm quy tắc từ ví dụ.",
          "ML nhanh hơn lập trình thường",
          "Hai cách này cho kết quả giống hệt nhau",
        ],
        correct: 1,
        explanation:
          "Đây là điểm cốt lõi. Lập trình thường: bạn viết if-else. ML: bạn đưa ví dụ, máy tự rút ra luật. Giống đầu bếp đọc sách so với đầu bếp học từ nếm thử.",
      },
      {
        question:
          "Bài toán nào sau đây phù hợp nhất với Machine Learning?",
        options: [
          "Cộng hai số a + b",
          "Sắp xếp 100 cái tên theo a-b-c",
          "Nhận ra chữ viết tay trong ảnh",
          "Tính diện tích hình vuông khi biết cạnh",
        ],
        correct: 2,
        explanation:
          "Ba cái còn lại đều có công thức rõ ràng. Chữ viết tay mỗi người một khác. Không thể viết luật, nhưng có thể học từ hàng triệu mẫu.",
      },
      {
        question:
          "Gmail tự động lọc email rác vào thư mục riêng. Đây là ML hay lập trình thường?",
        options: [
          "Lập trình thường: Google đã viết hàng ngàn luật if-else",
          "Machine Learning: hệ thống học từ hàng tỷ email được đánh dấu",
          "Không phải cả hai, chỉ là danh sách đen địa chỉ gửi",
          "Cả hai kết hợp đều đặn 50-50",
        ],
        correct: 1,
        explanation:
          "Gmail dùng ML. Spammer đổi cách viết mỗi tuần nên luật tĩnh không kịp. Mỗi lần bạn bấm 'Báo cáo rác' là một ví dụ mới cho hệ thống học.",
      },
      {
        type: "fill-blank",
        question:
          "Trong ML, máy học từ {blank} thay vì tuân theo {blank} do người viết sẵn.",
        blanks: [
          { answer: "dữ liệu", accept: ["ví dụ", "data", "dữ liệu thực tế"] },
          {
            answer: "quy tắc",
            accept: ["luật", "luật cố định", "quy tắc cố định", "rules"],
          },
        ],
        explanation:
          "Đây là bản chất của ML. Thay vì ai đó phải viết tay mọi trường hợp, máy xem ví dụ thật rồi tự rút ra quy tắc chung.",
      },
      {
        question:
          "Một máy ML muốn dự đoán giá nhà dựa trên diện tích. Điều nào sau đây là ĐÚNG?",
        options: [
          "Máy cần được nghe lập trình viên giải thích về bất động sản",
          "Máy cần được cho xem nhiều cặp (diện tích, giá) thật và tự học mối quan hệ",
          "Máy tự biết giá nhà vì đã có sẵn trong hệ điều hành",
          "Máy không thể dự đoán được vì giá nhà luôn thay đổi",
        ],
        correct: 1,
        explanation:
          "ML học từ ví dụ. Đưa cho máy vài nghìn cặp (diện tích, giá), nó sẽ tự rút ra: nhà càng rộng thì thường càng đắt, rồi dùng luật đó cho nhà mới.",
      },
      {
        question:
          "Cô Lan mở quán cà phê. Cô muốn ước tính doanh thu ngày mai dựa trên: ngày trong tuần, thời tiết, có lễ hay không, số khách tuần trước. Cô có log 2 năm. Cách nào phù hợp?",
        options: [
          "Viết hàm if-else tay, dựa vào linh tính của cô",
          "Dùng ML: cho máy học 2 năm dữ liệu, tìm pattern phức tạp giữa nhiều yếu tố",
          "Gọi điện hỏi quán khác xem doanh thu bao nhiêu",
          "Không dự đoán, đóng cửa nếu trời mưa",
        ],
        correct: 1,
        explanation:
          "Đủ điều kiện dùng ML: nhiều yếu tố kết hợp phức tạp (khó viết luật tay) + có dữ liệu lịch sử lớn + quan hệ đa chiều. Đây là bài toán ML kinh điển cho quán/shop nhỏ.",
      },
      {
        question:
          "Một startup quảng cáo: 'AI của chúng tôi luôn đúng 100%'. Vì sao câu này ĐÁNG NGHI?",
        options: [
          "Vì AI không bao giờ đúng 100%. Cờ đỏ: họ đang test trên chính dữ liệu đã dùng để học, hoặc đang nói quá",
          "Vì startup luôn nói dối",
          "Vì AI chỉ đúng khi trời nắng",
          "Vì 100% là con số quá lớn",
        ],
        correct: 0,
        explanation:
          "Trong ML thực tế, ngay cả Google và OpenAI cũng không đạt 100%. Khi ai đó khoe con số này, thường là họ test trên chính dữ liệu huấn luyện. Giống như cho học sinh làm lại đúng đề đã học thuộc.",
      },
    ],
    [],
  );

  return (
    <>
      {/* ══════════════════ BƯỚC 1 — HOOK ══════════════════ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Bắt đầu">
        <div className="rounded-2xl border-2 border-accent/30 bg-gradient-to-br from-accent-light to-surface p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15">
              <UtensilsCrossed size={24} className="text-accent" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground leading-tight">
                Hai đầu bếp, một bát phở
              </h3>
              <p className="text-xs text-muted">
                Hãy tưởng tượng bạn đang tập nấu ăn…
              </p>
            </div>
          </div>

          <p className="text-sm text-foreground/90 leading-relaxed">
            <strong>Đầu bếp 1</strong> mở sách công thức và đọc từng dòng:
            &ldquo;3 lít nước, 500g xương, 2 hoa hồi&rdquo;. Cô làm đúng
            y như sách ghi, không thêm không bớt một thìa muối nào. Nấu
            xong, tô phở ra đúng như mô tả: cùng vị, cùng mùi, cùng độ
            trong.
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed">
            <strong>Đầu bếp 2</strong> thì chưa bao giờ đọc một quyển
            sách nấu ăn nào. Thay vào đó, cô đứng bếp hàng trăm lần. Mỗi
            nồi cô đều nếm thử, ghi nhớ chỗ nào quá tay, rồi lần sau
            chỉnh lại. Nồi đầu tiên mặn quá nên cô bớt muối, đến nồi thứ
            mười vị bắt đầu cân đối hơn. Đến nồi thứ một trăm, khách ăn
            xong khen nức nở mà cô vẫn không có một dòng công thức nào
            trong sổ.
          </p>
          <div className="rounded-xl border border-accent/40 bg-card p-4 text-sm text-foreground/90 leading-relaxed">
            Hai cách nấu này tương ứng với hai cách viết phần mềm.{" "}
            <strong>Lập trình thường</strong> giống đầu bếp 1: người viết
            tay toàn bộ quy tắc, máy chỉ chạy đúng những gì đã được ghi
            sẵn. Còn <strong>Machine Learning (ML)</strong> giống đầu
            bếp 2: thay vì có quy tắc sẵn, máy được cho xem rất nhiều ví
            dụ thật rồi tự rút ra quy tắc cho mình.
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <RuleBasedChef />
          <LearningChef />
        </div>
      </LessonSection>

      {/* ══════════════════ BƯỚC 2 — DỰ ĐOÁN ══════════════════ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Thử đoán">
        <PredictionGate
          question="Bạn cần viết phần mềm cho bốn bài toán sau. Bài nào ML thường KHÔNG phải lựa chọn tốt hơn lập trình thường?"
          options={[
            "Nhận dạng giọng nói tiếng Việt qua micro điện thoại",
            "Tính tổng tiền hoá đơn = đơn giá × số lượng + thuế VAT 10%",
            "Lọc email rác dựa trên nội dung thay đổi liên tục mỗi tuần",
            "Gợi ý phim dựa trên thói quen xem của hàng triệu người dùng",
          ]}
          correct={1}
          explanation="Tính hoá đơn có công thức rõ ràng: đầu vào là số, công thức chỉ vài dòng, kết quả đúng hay sai có thể kiểm tra ngay. Trường hợp này lập trình thường giải gọn gàng, không cần đến ML. Ba bài còn lại thì khác. Giọng nói, từ mới trong spam, sở thích người xem phim đều có hàng triệu biến thể mà không ai ngồi viết hết luật được. Khi đó ML mới phát huy. Cạm bẫy của người mới học là cứ thấy bài toán nào cũng nghĩ đến ML, kể cả khi một dòng công thức là đủ."
        >
          <p className="text-sm text-muted mt-3 leading-relaxed">
            Tiếp theo, bạn sẽ thấy hai cách nấu cùng một bài toán đứng
            cạnh nhau.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ══════════════════ BƯỚC 3 — REVEAL ══════════════════ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <div className="space-y-8">
            {/* DEMO 1: So sánh hai cách xử lý spam */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Mail size={18} className="text-accent" />
                <h3 className="text-base font-semibold text-foreground">
                  Cùng một bài toán lọc email rác, giải bằng hai cách rất khác nhau
                </h3>
              </div>

              <ToggleCompare
                labelA="Lập trình thường"
                labelB="Machine Learning"
                description="Chạm vào hai tab để thấy cách mỗi phương pháp xử lý email rác."
                childA={
                  <div className="space-y-3 py-2">
                    <p className="text-xs text-muted">
                      Người viết phải tự nghĩ ra từng dấu hiệu và viết thành
                      luật cứng. Máy chỉ làm theo.
                    </p>
                    <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 font-mono text-xs text-foreground space-y-1.5 leading-relaxed">
                      <div>
                        <span className="text-blue-600 dark:text-blue-400">
                          nếu
                        </span>{" "}
                        tiêu đề chứa &ldquo;trúng thưởng&rdquo;{" "}
                        <span className="text-blue-600 dark:text-blue-400">
                          thì
                        </span>{" "}
                        → rác
                      </div>
                      <div>
                        <span className="text-blue-600 dark:text-blue-400">
                          nếu
                        </span>{" "}
                        người gửi ở danh sách đen{" "}
                        <span className="text-blue-600 dark:text-blue-400">
                          thì
                        </span>{" "}
                        → rác
                      </div>
                      <div>
                        <span className="text-blue-600 dark:text-blue-400">
                          nếu
                        </span>{" "}
                        chứa &ldquo;khuyến mãi 99%&rdquo;{" "}
                        <span className="text-blue-600 dark:text-blue-400">
                          thì
                        </span>{" "}
                        → rác
                      </div>
                      <div className="text-muted italic">
                        … (hàng nghìn luật nữa, viết tay)
                      </div>
                    </div>
                    <Callout variant="warning" title="Điểm yếu">
                      Khi spammer đổi chữ thành &ldquo;tr.úng th.ưởng&rdquo;,
                      tất cả luật cũ vô dụng. Phải có người ngồi viết luật
                      mới. Càng ngày càng rối.
                    </Callout>
                  </div>
                }
                childB={
                  <div className="space-y-3 py-2">
                    <p className="text-xs text-muted">
                      Không ai viết luật. Máy tự rút ra từ triệu ví dụ thật.
                    </p>
                    <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4 space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <Database
                          size={14}
                          className="mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                        />
                        <p className="text-foreground/90 leading-relaxed">
                          <strong>Đầu vào:</strong> triệu email đã được gắn
                          nhãn &ldquo;rác&rdquo; hoặc &ldquo;không
                          rác&rdquo;.
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Brain
                          size={14}
                          className="mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                        />
                        <p className="text-foreground/90 leading-relaxed">
                          <strong>Máy tự rút ra:</strong> đặc điểm nào hay
                          xuất hiện ở email rác mà ít xuất hiện ở email
                          thường.
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Shield
                          size={14}
                          className="mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                        />
                        <p className="text-foreground/90 leading-relaxed">
                          <strong>Kết quả:</strong> máy biết nhận ra cả kiểu
                          rác chưa bao giờ có người dạy trực tiếp.
                        </p>
                      </div>
                    </div>
                    <Callout variant="tip" title="Điểm mạnh">
                      Có kiểu rác mới? Thêm vài nghìn ví dụ, chạy lại,
                      không cần viết dòng luật nào. Máy tự thích nghi.
                    </Callout>
                  </div>
                }
              />
            </div>

            <hr className="border-border" />

            {/* DEMO 2: Vòng lặp huấn luyện */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-accent" />
                <h3 className="text-base font-semibold text-foreground">
                  Xem máy học dần qua từng vòng
                </h3>
              </div>
              <p className="text-sm text-muted leading-relaxed">
                Máy không giỏi ngay từ đầu. Vòng đầu tiên nó đoán bừa,
                bị sửa, vòng sau đoán tốt hơn nhưng vẫn sai, lại bị sửa
                tiếp. Quá trình này lặp đi lặp lại hàng triệu lần cho
                đến khi máy đoán gần đúng. Bấm &ldquo;Chạy thêm&rdquo;
                để xem từng giai đoạn:
              </p>
              <TrainingLoopDemo />
            </div>

            <hr className="border-border" />

            {/* DEMO 3: Chọn cách tiếp cận */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-accent" />
                <h3 className="text-base font-semibold text-foreground">
                  Bạn chọn: Lập trình thường hay ML?
                </h3>
              </div>
              <ApproachPicker />
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ══════════════════ BƯỚC 4 — DEEPEN (StepReveal) ══════════════════ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Đi sâu">
        <h3 className="text-base font-semibold text-foreground mb-2">
          Bốn bước của mọi hệ thống ML
        </h3>
        <p className="text-sm text-muted mb-4 leading-relaxed">
          Từ Grab, Shopee đến ChatGPT, mọi hệ thống ML đều đi qua bốn
          bước này. Bấm &ldquo;Tiếp tục&rdquo; để mở từng bước:
        </p>

        <StepReveal
          labels={[
            "Bước 1: Dữ liệu",
            "Bước 2: Học",
            "Bước 3: Mô hình",
            "Bước 4: Phản hồi",
          ]}
        >
          {[
            <div
              key="s1"
              className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-5 space-y-2"
            >
              <div className="flex items-center gap-2">
                <Database
                  size={18}
                  className="text-emerald-600 dark:text-emerald-400"
                />
                <h4 className="text-sm font-semibold text-foreground">
                  Dữ liệu: nguyên liệu nấu ăn
                </h4>
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Trước khi máy có thể học được điều gì, người làm ML phải
                chuẩn bị ví dụ cho nó xem. Với app nhận diện ảnh mèo,
                cần hàng triệu ảnh và mỗi ảnh phải có nhãn rõ ràng là
                &ldquo;mèo&rdquo; hay &ldquo;không phải mèo&rdquo;. Với
                Grab, cần log hàng triệu chuyến đi thật, kèm thời gian,
                lộ trình, giá cước. Dữ liệu càng nhiều và càng chất
                lượng, máy càng có nhiều ví dụ để rút ra pattern, kết
                quả học cũng càng tốt.
              </p>
              <div className="rounded-lg bg-card border border-border p-3 text-xs text-muted italic leading-relaxed">
                &ldquo;Rác vào, rác ra&rdquo; là câu nằm lòng của mọi
                người làm ML. Nếu dữ liệu kém, mô hình cũng sẽ kém theo,
                và không có thuật toán nào cứu được.
              </div>
            </div>,
            <div
              key="s2"
              className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-5 space-y-2"
            >
              <div className="flex items-center gap-2">
                <Brain
                  size={18}
                  className="text-blue-600 dark:text-blue-400"
                />
                <h4 className="text-sm font-semibold text-foreground">
                  Học: máy đang &ldquo;nếm thử&rdquo;
                </h4>
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Máy đọc từng ví dụ, đoán đáp án, so với đáp án thật, rồi
                tự điều chỉnh để lần sau đoán ít sai hơn. Lặp đi lặp lại
                hàng triệu lần, giống đầu bếp 2 nấu hàng trăm nồi phở.
              </p>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Đây là giai đoạn &ldquo;huấn luyện&rdquo; (training). Máy
                lớn học trên hàng nghìn máy tính, mất nhiều ngày hoặc
                tuần. Máy nhỏ có khi chỉ mất vài phút trên laptop.
              </p>
            </div>,
            <div
              key="s3"
              className="rounded-xl border-2 border-accent bg-accent-light p-5 space-y-2"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-accent" />
                <h4 className="text-sm font-semibold text-foreground">
                  Mô hình: bộ não đã học xong
                </h4>
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Sau khi học xong, máy tạo ra một thứ gọi là{" "}
                <strong>mô hình</strong>, giống như đầu bếp 2 mang theo
                công thức đã thuộc nằm lòng &ldquo;trong đầu&rdquo;. Mô
                hình không còn cần đến dữ liệu gốc nữa, vì nó đã cô đọng
                mọi pattern học được thành một bộ số.
              </p>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Kích thước mô hình thay đổi rất nhiều theo bài toán. Mô
                hình ChatGPT nặng vài chục GB, còn mô hình nhận diện ảnh
                trong điện thoại của bạn có khi chỉ vài MB. Đây là phần
                &ldquo;đi làm&rdquo; thực sự, được đóng gói gọn lại để
                chạy ở khắp nơi.
              </p>
            </div>,
            <div
              key="s4"
              className="rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 p-5 space-y-2"
            >
              <div className="flex items-center gap-2">
                <Zap
                  size={18}
                  className="text-purple-600 dark:text-purple-400"
                />
                <h4 className="text-sm font-semibold text-foreground">
                  Phản hồi: vòng học không kết thúc
                </h4>
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Khi mô hình đã được đóng gói và đưa vào sản phẩm thật,
                nó bắt đầu gặp dữ liệu mà nó chưa từng thấy lúc học.
                Người dùng bấm &ldquo;Báo cáo rác&rdquo;, &ldquo;Đây
                không phải mèo&rdquo;, và mọi phản hồi như vậy lại trở
                thành dữ liệu mới cho lần học tiếp theo.
              </p>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Vòng này không bao giờ kết thúc. Gmail của bạn ngày càng
                giỏi lọc rác chính là nhờ hàng tỷ lần người dùng bấm nút
                &ldquo;Báo cáo&rdquo; mỗi ngày, mỗi lần là một ví dụ mới
                đẩy mô hình đi xa hơn một chút.
              </p>
            </div>,
          ]}
        </StepReveal>

        <div className="mt-6 rounded-xl border border-border bg-card p-5">
          <h4 className="text-sm font-semibold text-foreground mb-3">
            Vòng học trực quan hóa
          </h4>
          <PipelineSVG />
        </div>
      </LessonSection>

      {/* ══════════════════ BƯỚC 5 — AHA ══════════════════ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Aha">
        <AhaMoment>
          <p className="leading-relaxed">
            ML không &ldquo;hiểu&rdquo; như con người hiểu một bài toán.
            Thay vào đó, nó nhìn vào hàng triệu ví dụ và{" "}
            <strong>tìm ra pattern lặp lại</strong> trong những ví dụ
            đó. Pattern ấy chính là công thức ẩn mà không ai biết cách
            viết ra bằng tay.
          </p>
          <p className="mt-2 text-sm font-normal text-muted leading-relaxed">
            Vì vậy, nếu dữ liệu bạn đưa cho máy là dữ liệu tốt và đa
            dạng, mô hình sẽ học ra công thức tốt. Nếu dữ liệu sai,
            thiếu hay lệch một chiều, mô hình sẽ học ra một công thức
            sai theo. Không có thuật toán nào cứu được dữ liệu kém.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ══════════════════ BƯỚC 6 — CHALLENGE ══════════════════ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Thử thách">
        <div className="space-y-5">
          <InlineChallenge
            question="Trung tâm tiếng Anh muốn làm hệ thống chấm phát âm cho học viên. Bài toán phù hợp nhất với cách nào?"
            options={[
              "Lập trình thường: viết luật kiểu 'nếu phát âm đúng thì 10 điểm'",
              "Machine Learning: cho máy nghe hàng nghìn bản ghi của người bản xứ và học viên",
              "Không cần máy: để giáo viên chấm tay cho từng học viên",
              "Đưa cho mỗi học viên một máy đo độ dài âm thanh",
            ]}
            correct={1}
            explanation="Phát âm có hàng vạn biến thể giữa các giọng, tốc độ, âm sắc. Không ai viết luật được. ML học từ bản ghi thật là cách duy nhất khả thi. Đây cũng là cách Google Translate, Duolingo, Elsa Speak đang dùng."
          />

          <InlineChallenge
            question="Bạn viết một app đếm số học sinh trong lớp từ ảnh camera. Lớp có đúng 40 học sinh luôn. Có nên dùng ML không?"
            options={[
              "Có, vì ML luôn tốt hơn lập trình thường",
              "Không, vì ai cũng phải điểm danh đủ thì cứ in sẵn '40'",
              "Có, cần dùng ML để nhận diện khuôn mặt từng học sinh",
              "Không, vì ML chỉ dùng cho bài toán lớn",
            ]}
            correct={2}
            explanation="Đếm học sinh từ ảnh (mà số lượng có thể thay đổi do vắng) là bài nhận ảnh, rất phù hợp với ML vì tư thế, ánh sáng, góc chụp đều khác nhau. Đáp án B sai vì lớp 40 học sinh không có nghĩa ngày nào cũng đủ 40."
          />

          <InlineChallenge
            question="Bạn có 20 ảnh X-quang để làm app phát hiện gãy xương. Bạn huấn luyện xong, máy đạt 100% đúng trên 20 ảnh đó. Đáng ăn mừng không?"
            options={[
              "Có, 100% là tuyệt",
              "Không, 20 ảnh quá ít, máy có thể chỉ 'học thuộc lòng' 20 ảnh đó, gặp ảnh mới là sai hết",
              "Có, máy đã hiểu sâu về giải phẫu",
              "Chỉ nên ăn mừng nếu có ảnh màu",
            ]}
            correct={1}
            explanation="Đây là hiện tượng 'học thuộc lòng' (overfitting). 20 ảnh quá ít, máy chỉ nhớ mặt từng ảnh chứ không học được dấu hiệu bệnh lý chung. Phải có hàng nghìn đến chục nghìn ảnh, và phải kiểm tra trên ảnh khác tập học."
          />
        </div>
      </LessonSection>

      {/* ══════════════════ BƯỚC 7 — KẾT NỐI ══════════════════ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kết nối">
        <ExplanationSection topicSlug={metadata.slug}>
          <p className="text-sm leading-relaxed">
            Machine Learning không phải một loại trí tuệ siêu nhiên. Nó
            chỉ là một cách viết phần mềm khác với cách truyền thống.
            Thay vì lập trình viên ngồi nghĩ ra mọi quy tắc rồi gõ thành
            if-else, ta thu thập rất nhiều ví dụ thật và để máy tự tìm
            quy tắc bên trong những ví dụ đó. Ba điểm cần nhớ về cách
            tiếp cận này:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 not-prose my-4">
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center gap-2">
                <BookOpenCheck
                  size={16}
                  className="text-blue-500 shrink-0"
                />
                <h4 className="text-sm font-semibold text-foreground">
                  Khi nào dùng
                </h4>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Khi pattern quá phức tạp để viết tay, ví dụ ảnh, giọng
                nói, ngôn ngữ, hành vi người dùng. Bạn có sẵn dữ liệu đủ
                lớn để máy học, và bạn chấp nhận máy đôi khi sai chứ
                không bắt buộc luôn đúng tuyệt đối.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle
                  size={16}
                  className="text-amber-500 shrink-0"
                />
                <h4 className="text-sm font-semibold text-foreground">
                  Khi nào không dùng
                </h4>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Khi công thức đã quá rõ ràng, như tính thuế hay đổi đơn
                vị. Khi bạn chưa có dữ liệu để máy học. Hoặc khi sai một
                quyết định là gây hậu quả nghiêm trọng và bạn cần giải
                thích được vì sao máy ra quyết định đó.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-accent shrink-0" />
                <h4 className="text-sm font-semibold text-foreground">
                  Vị trí trong AI
                </h4>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                AI là khái niệm rộng nhất, bao gồm mọi cách làm cho máy
                hành xử thông minh. ML là một nhánh trong AI, hiện là
                nhánh đông đúc nhất. Deep Learning lại là một nhánh nhỏ
                hơn nằm trong ML, chuyên dùng cho ảnh, giọng nói và
                ngôn ngữ.
              </p>
            </div>
          </div>

          <Callout variant="insight" title="Ba ví dụ ML ngay quanh bạn">
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>
                <strong>Grab</strong> đoán giá cước và thời gian tới nơi,
                học từ hàng triệu chuyến đi thật trên đường phố Việt
                Nam.
              </li>
              <li>
                <strong>Shopee</strong> gợi ý sản phẩm, học từ lịch sử
                bấm, mua, đánh giá của hàng triệu người dùng.
              </li>
              <li>
                <strong>TikTok</strong> đoán video tiếp theo bạn sẽ
                thích, học từ cách bạn vuốt, xem lâu, bấm tim.
              </li>
            </ul>
          </Callout>

          <Callout variant="tip" title="Bước tiếp theo trong hành trình">
            <p className="leading-relaxed">
              Bạn vừa gặp khái niệm quan trọng nhất: ML học từ dữ liệu.
              Để đi tiếp, hãy xem{" "}
              <TopicLink slug="math-readiness">
                những khái niệm toán cần biết
              </TopicLink>{" "}
              (không đáng sợ như bạn nghĩ), rồi tìm hiểu{" "}
              <TopicLink slug="data-and-datasets">
                dữ liệu được tổ chức thế nào
              </TopicLink>{" "}
              (trái tim của mọi mô hình ML).
            </p>
          </Callout>
        </ExplanationSection>

        <div className="mt-6">
          <MiniSummary
            title="Năm điều mang theo"
            points={[
              "ML = máy tự rút ra quy tắc từ ví dụ, thay vì người viết tay từng luật if-else.",
              "Giống đầu bếp học từ nếm thử, không đọc công thức. Càng nhiều kinh nghiệm càng giỏi.",
              "Bốn bước: Dữ liệu → Học → Mô hình → Dự đoán (và phản hồi để học tiếp).",
              "Dùng ML khi pattern phức tạp và có dữ liệu. Đừng dùng khi công thức đã rõ.",
              "Rác vào, rác ra. Chất lượng dữ liệu quyết định mọi thứ.",
            ]}
          />
        </div>
      </LessonSection>

      {/* ══════════════════ BƯỚC 8 — QUIZ ══════════════════ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
