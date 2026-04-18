"use client";
import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
  CollapsibleDetail,
  MiniSummary,
  CodeBlock,
  LessonSection,
  LaTeX,
  TopicLink,
  ProgressSteps,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

/* ──────────────────────────────────────────────────────────────────
 * METADATA
 * ──────────────────────────────────────────────────────────────── */
export const metadata: TopicMeta = {
  slug: "confusion-matrix",
  title: "Confusion Matrix",
  titleVi: "Ma trận nhầm lẫn",
  description:
    "Bảng đánh giá hiệu suất phân loại thể hiện True/False Positive/Negative",
  category: "classic-ml",
  tags: ["evaluation", "classification", "metrics"],
  difficulty: "beginner",
  relatedSlugs: ["logistic-regression", "cross-validation", "naive-bayes"],
  vizType: "interactive",
};

/* ──────────────────────────────────────────────────────────────────
 * DOMAIN TYPES
 * ──────────────────────────────────────────────────────────────── */
interface Email {
  id: number;
  subject: string;
  sender: string;
  snippet: string;
  score: number; // model confidence for "spam"
  isSpam: boolean; // ground truth
  features: string[];
}

interface MatrixStats {
  tp: number;
  fp: number;
  fn: number;
  tn: number;
  precision: number;
  recall: number;
  accuracy: number;
  f1: number;
  specificity: number;
  fpr: number;
  fnr: number;
}

interface ModelSpec {
  id: "A" | "B";
  name: string;
  description: string;
  noiseBias: number; // offset added per email
  noiseSpread: number; // scale of random jitter
  color: string;
}

/* ──────────────────────────────────────────────────────────────────
 * SEEDED RNG — deterministic "noise" so results don't flicker on
 * re-render. We use a small mulberry32 generator seeded per model.
 * ──────────────────────────────────────────────────────────────── */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ──────────────────────────────────────────────────────────────────
 * EMAIL DATASET — 100 mẫu có nhãn spam/ham với điểm mô hình A
 * Phân phối: ~38 spam, ~62 ham (mất cân bằng nhẹ, gần đời thực).
 * ──────────────────────────────────────────────────────────────── */
const SPAM_SUBJECTS: string[] = [
  "TRÚNG THƯỞNG 1 TỶ — Nhận ngay!",
  "[URGENT] Tài khoản ngân hàng bị khoá",
  "Giảm giá 90% thuốc thần kỳ",
  "Bạn đã thắng iPhone 15 Pro Max",
  "Click để nhận voucher 5 triệu",
  "Xác minh OTP gấp trong 5 phút",
  "Vay tiền online không thế chấp",
  "Đầu tư 100% lợi nhuận/tháng",
  "Nhận quà từ hoàng tử Nigeria",
  "Tăng follower TikTok miễn phí",
  "Mua sỉ hàng hiệu giá rẻ",
  "Căn hộ chỉ 500tr, ưu đãi hôm nay",
  "Bán data khách hàng VIP",
  "SEO top Google giá sốc",
  "Kiếm 50 triệu/tháng tại nhà",
  "Thuốc giảm cân thần tốc",
  "Cá cược uy tín, tặng 100%",
  "Link download phim HD mới",
  "Nâng cấp Facebook Premium free",
  "Hack Wi-Fi hàng xóm chỉ 1 click",
];

const HAM_SUBJECTS: string[] = [
  "Cuộc họp dự án ngày mai 9h",
  "Biên bản họp tuần này đính kèm",
  "Re: Đánh giá code PR #423",
  "Lịch nghỉ lễ tháng 4 của công ty",
  "Cập nhật tiến độ sprint 12",
  "Thông báo học phí kỳ xuân",
  "Đơn hàng #8291 đã được giao",
  "Hoá đơn điện tháng 3",
  "Xác nhận đăng ký hội thảo AI",
  "Bảng lương tháng — vui lòng kiểm tra",
  "Lời mời phỏng vấn vòng 2",
  "Phản hồi về bài báo khoa học",
  "Thư từ thầy hướng dẫn",
  "Cập nhật chính sách bảo mật",
  "Nhắc lịch khám sức khoẻ định kỳ",
  "Ảnh chụp chuyến đi Đà Lạt",
  "Tài liệu môn Machine Learning",
  "Hợp đồng nhà thầu đính kèm",
  "Thư cảm ơn từ khách hàng",
  "Khoá học miễn phí từ Coursera",
];

const SPAM_FEATURES = [
  ["link rút gọn", "chữ in hoa"],
  ["từ khoá gấp", "mã OTP"],
  ["chứa tiền", "số lớn"],
  ["đính kèm lạ", "click ngay"],
  ["domain mới", "viết sai chính tả"],
  ["trúng thưởng", "nhiều emoji"],
  ["yêu cầu chuyển khoản"],
  ["dấu chấm than liên tiếp"],
];

const HAM_FEATURES = [
  ["từ đồng nghiệp"],
  ["đính kèm PDF"],
  ["trả lời (Re:)"],
  ["từ domain công ty"],
  ["chủ đề công việc"],
  ["ngữ pháp chuẩn"],
  ["có chữ ký cuối mail"],
  ["liên kết nội bộ"],
];

function buildEmailDataset(): Email[] {
  const rand = mulberry32(42);
  const emails: Email[] = [];
  // 38 spam
  for (let i = 0; i < 38; i += 1) {
    const subject = SPAM_SUBJECTS[i % SPAM_SUBJECTS.length];
    // Spam score centered around 0.72 with spread 0.2
    const base = 0.55 + rand() * 0.35;
    emails.push({
      id: i + 1,
      subject,
      sender: `promo${i + 1}@${i % 2 === 0 ? "tracker.ru" : "deal-hot.info"}`,
      snippet: "Cơ hội chỉ hôm nay! Click link bên dưới để nhận ưu đãi.",
      score: Math.min(0.97, base),
      isSpam: true,
      features: SPAM_FEATURES[i % SPAM_FEATURES.length],
    });
  }
  // 62 ham
  for (let i = 0; i < 62; i += 1) {
    const subject = HAM_SUBJECTS[i % HAM_SUBJECTS.length];
    const base = 0.15 + rand() * 0.35;
    // A few tricky hams that look spammy (noise)
    const tricky = i % 11 === 0;
    const score = tricky ? base + 0.25 : base;
    emails.push({
      id: 38 + i + 1,
      subject,
      sender: `user${i + 1}@${i % 3 === 0 ? "company.vn" : "gmail.com"}`,
      snippet: "Thân gửi, đính kèm là thông tin bạn cần — chúc một ngày tốt.",
      score: Math.min(0.92, score),
      isSpam: false,
      features: HAM_FEATURES[i % HAM_FEATURES.length],
    });
  }
  return emails;
}

const EMAILS: Email[] = buildEmailDataset();

/* ──────────────────────────────────────────────────────────────────
 * MODEL SPECS — Model A (tinh chỉnh), Model B (naïve, thiên lệch).
 * ──────────────────────────────────────────────────────────────── */
const MODELS: ModelSpec[] = [
  {
    id: "A",
    name: "Model A — Gradient Boosting",
    description: "Hiệu chuẩn tốt, ít thiên lệch.",
    noiseBias: 0,
    noiseSpread: 0.03,
    color: "#3b82f6",
  },
  {
    id: "B",
    name: "Model B — Naïve Bayes",
    description: "Thiên về 'spam', báo nhầm nhiều hơn.",
    noiseBias: 0.12,
    noiseSpread: 0.08,
    color: "#a855f7",
  },
];

function modelScoreFor(email: Email, model: ModelSpec): number {
  const rand = mulberry32(email.id * 17 + model.id.charCodeAt(0));
  const jitter = (rand() - 0.5) * 2 * model.noiseSpread;
  const raw = email.score + model.noiseBias + jitter;
  return Math.max(0.01, Math.min(0.99, raw));
}

/* ──────────────────────────────────────────────────────────────────
 * METRIC COMPUTATION
 * ──────────────────────────────────────────────────────────────── */
function computeMatrixForModel(
  model: ModelSpec,
  threshold: number,
): MatrixStats {
  let tp = 0;
  let fp = 0;
  let fn = 0;
  let tn = 0;
  for (const email of EMAILS) {
    const s = modelScoreFor(email, model);
    const predicted = s >= threshold;
    if (predicted && email.isSpam) tp += 1;
    else if (predicted && !email.isSpam) fp += 1;
    else if (!predicted && email.isSpam) fn += 1;
    else tn += 1;
  }
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const accuracy = (tp + tn) / EMAILS.length;
  const f1 =
    precision + recall > 0
      ? (2 * (precision * recall)) / (precision + recall)
      : 0;
  const specificity = tn + fp > 0 ? tn / (tn + fp) : 0;
  const fpr = 1 - specificity;
  const fnr = tp + fn > 0 ? fn / (tp + fn) : 0;
  return {
    tp,
    fp,
    fn,
    tn,
    precision,
    recall,
    accuracy,
    f1,
    specificity,
    fpr,
    fnr,
  };
}

function computeUserMatrix(
  predictions: Record<number, boolean>,
): MatrixStats {
  let tp = 0;
  let fp = 0;
  let fn = 0;
  let tn = 0;
  for (const email of EMAILS) {
    const pred = predictions[email.id];
    if (pred === undefined) continue;
    if (pred && email.isSpam) tp += 1;
    else if (pred && !email.isSpam) fp += 1;
    else if (!pred && email.isSpam) fn += 1;
    else tn += 1;
  }
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const total = tp + fp + fn + tn;
  const accuracy = total > 0 ? (tp + tn) / total : 0;
  const f1 =
    precision + recall > 0
      ? (2 * (precision * recall)) / (precision + recall)
      : 0;
  const specificity = tn + fp > 0 ? tn / (tn + fp) : 0;
  return {
    tp,
    fp,
    fn,
    tn,
    precision,
    recall,
    accuracy,
    f1,
    specificity,
    fpr: 1 - specificity,
    fnr: tp + fn > 0 ? fn / (tp + fn) : 0,
  };
}

/* ──────────────────────────────────────────────────────────────────
 * CELL HELPERS
 * ──────────────────────────────────────────────────────────────── */
const CELL_META = [
  { label: "TP", color: "#22c55e", tip: "Dự đoán spam, đúng là spam" },
  { label: "FP", color: "#f97316", tip: "Dự đoán spam, thực tế ham (báo nhầm)" },
  { label: "FN", color: "#ef4444", tip: "Dự đoán ham, thực tế spam (bỏ sót)" },
  { label: "TN", color: "#3b82f6", tip: "Dự đoán ham, đúng là ham" },
] as const;

function MatrixCell({
  idx,
  value,
}: {
  idx: number;
  value: number;
}) {
  const { label, color, tip } = CELL_META[idx];
  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 240, damping: 18 }}
      className="rounded-lg border-2 px-5 py-4 min-w-[88px] text-center"
      style={{ borderColor: color, backgroundColor: `${color}14` }}
      title={tip}
    >
      <motion.div
        key={value}
        initial={{ scale: 1.3 }}
        animate={{ scale: 1 }}
        className="text-2xl font-bold"
        style={{ color }}
      >
        {value}
      </motion.div>
      <div className="text-[10px] font-medium uppercase tracking-wide" style={{ color }}>
        {label}
      </div>
    </motion.div>
  );
}

function MetricsRow({
  m,
  decimals = 1,
}: {
  m: MatrixStats;
  decimals?: number;
}) {
  const items = [
    { label: "Accuracy", value: m.accuracy, color: "text-foreground" },
    { label: "Precision", value: m.precision, color: "text-green-500" },
    { label: "Recall", value: m.recall, color: "text-blue-500" },
    { label: "F1 Score", value: m.f1, color: "text-purple-500" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map(({ label, value, color }) => (
        <div
          key={label}
          className="rounded-lg border border-border bg-surface p-3 text-center"
        >
          <div className={`text-lg font-bold ${color}`}>
            {(value * 100).toFixed(decimals)}%
          </div>
          <div className="text-xs text-muted">{label}</div>
        </div>
      ))}
    </div>
  );
}

function MatrixHeader({
  posLabel,
  negLabel,
}: {
  posLabel: string;
  negLabel: string;
}) {
  return (
    <thead>
      <tr>
        <th className="p-2" />
        <th className="p-2" />
        <th colSpan={2} className="px-4 pb-2 font-semibold text-foreground">
          Thực tế
        </th>
      </tr>
      <tr>
        <th className="p-2" />
        <th className="p-2" />
        <th
          className="px-4 pb-2 text-xs font-medium"
          style={{ color: "#22c55e" }}
        >
          {posLabel}
        </th>
        <th
          className="px-4 pb-2 text-xs font-medium"
          style={{ color: "#ef4444" }}
        >
          {negLabel}
        </th>
      </tr>
    </thead>
  );
}

/* ──────────────────────────────────────────────────────────────────
 * EMAIL CARD — mini component dùng trong danh sách 100 email.
 * ──────────────────────────────────────────────────────────────── */
function EmailCard({
  email,
  prediction,
  truth,
  threshold,
  onClick,
  flipped,
}: {
  email: Email;
  prediction: boolean | undefined;
  truth: boolean;
  threshold: number;
  onClick: () => void;
  flipped: boolean;
}) {
  const modelPred = modelScoreFor(email, MODELS[0]) >= threshold;
  const category = useMemo(() => {
    if (prediction === undefined) return "pending";
    if (prediction && truth) return "tp";
    if (prediction && !truth) return "fp";
    if (!prediction && truth) return "fn";
    return "tn";
  }, [prediction, truth]);

  const cellColor =
    category === "tp"
      ? "#22c55e"
      : category === "fp"
        ? "#f97316"
        : category === "fn"
          ? "#ef4444"
          : category === "tn"
            ? "#3b82f6"
            : "#64748b";

  return (
    <button
      onClick={onClick}
      className="group relative rounded-md border border-border bg-surface p-2 text-left text-[11px] transition-colors hover:border-accent/50"
      style={{
        borderColor: flipped ? cellColor : undefined,
        backgroundColor: flipped ? `${cellColor}12` : undefined,
      }}
    >
      <div className="flex items-center justify-between gap-1">
        <span
          className="h-2 w-2 rounded-full"
          style={{
            backgroundColor: truth ? "#ef4444" : "#22c55e",
            opacity: flipped ? 1 : 0.4,
          }}
        />
        <span className="font-mono text-[9px] text-muted">
          {email.score.toFixed(2)}
        </span>
      </div>
      <div className="mt-1 truncate text-foreground/80">
        {email.subject.slice(0, 22)}
        {email.subject.length > 22 ? "…" : ""}
      </div>
      {flipped && (
        <div
          className="mt-1 text-[9px] font-bold uppercase"
          style={{ color: cellColor }}
        >
          {category.toUpperCase()}
          {modelPred !== prediction ? " (ML khác bạn)" : ""}
        </div>
      )}
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────────
 * DIFF CELL — hiển thị chênh lệch giữa model A và B
 * ──────────────────────────────────────────────────────────────── */
function DiffPill({
  label,
  a,
  b,
}: {
  label: string;
  a: number;
  b: number;
}) {
  const diff = a - b;
  const positive = diff >= 0;
  return (
    <div className="flex flex-col items-center rounded-lg border border-border bg-surface p-2 text-center">
      <div className="text-[10px] uppercase tracking-wide text-muted">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1 text-sm font-bold">
        <span style={{ color: MODELS[0].color }}>{(a * 100).toFixed(1)}%</span>
        <span className="text-xs text-muted">/</span>
        <span style={{ color: MODELS[1].color }}>{(b * 100).toFixed(1)}%</span>
      </div>
      <div
        className="mt-1 text-[10px] font-semibold"
        style={{ color: positive ? "#22c55e" : "#ef4444" }}
      >
        Δ {positive ? "+" : ""}
        {(diff * 100).toFixed(1)}%
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 * COMPONENT
 * ════════════════════════════════════════════════════════════════ */
export default function ConfusionMatrixTopic() {
  /* ── USER LABELLING ── */
  const [predictions, setPredictions] = useState<Record<number, boolean>>({});
  const [previewId, setPreviewId] = useState<number | null>(null);

  /* ── THRESHOLD CONTROL ── */
  const [threshold, setThreshold] = useState(0.5);

  /* ── MODEL COMPARISON (A vs B) ── */
  const [showCompare, setShowCompare] = useState(true);

  /* ── FOCUSED EMAIL VIEW ── */
  const [focusedId, setFocusedId] = useState<number | null>(null);

  /* ── DERIVED MATRICES ── */
  const userMatrix = useMemo(() => computeUserMatrix(predictions), [predictions]);
  const matrixA = useMemo(
    () => computeMatrixForModel(MODELS[0], threshold),
    [threshold],
  );
  const matrixB = useMemo(
    () => computeMatrixForModel(MODELS[1], threshold),
    [threshold],
  );

  const labelledCount = Object.keys(predictions).length;
  const completion = Math.round((labelledCount / EMAILS.length) * 100);

  /* ── HANDLERS ── */
  const handleLabel = useCallback(
    (id: number, asSpam: boolean) => {
      setPredictions((prev) => ({ ...prev, [id]: asSpam }));
    },
    [],
  );

  const handleClearLabels = useCallback(() => {
    setPredictions({});
    setFocusedId(null);
    setPreviewId(null);
  }, []);

  const handleAutoLabelFromModel = useCallback(() => {
    const bulk: Record<number, boolean> = {};
    for (const email of EMAILS) {
      const s = modelScoreFor(email, MODELS[0]);
      bulk[email.id] = s >= threshold;
    }
    setPredictions(bulk);
  }, [threshold]);

  /* ── QUIZ ── */
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "Mô hình spam filter có 95% accuracy nhưng chỉ 10% email là spam. Nếu mô hình luôn đoán 'Không spam', accuracy sẽ là bao nhiêu?",
        options: ["50%", "90%", "95%", "10%"],
        correct: 1,
        explanation:
          "Nếu 10% là spam mà mô hình luôn đoán 'Không spam', nó đúng 90% trường hợp! Đây là bẫy accuracy với dữ liệu mất cân bằng — cần xem Precision, Recall, F1.",
      },
      {
        question: "F1 Score là gì?",
        options: [
          "Trung bình cộng của Precision và Recall",
          "Trung bình điều hòa của Precision và Recall",
          "Tích của Precision và Recall",
          "Tỷ lệ dự đoán đúng trên tổng số",
        ],
        correct: 1,
        explanation:
          "F1 = 2 × (P × R) / (P + R) — trung bình điều hòa, thiên về giá trị thấp hơn. Nếu Precision hoặc Recall rất thấp, F1 cũng thấp.",
      },
      {
        question:
          "Khi tăng ngưỡng quyết định (threshold) từ 0.3 lên 0.8, điều gì xảy ra?",
        options: [
          "Precision và Recall đều tăng",
          "Precision tăng, Recall giảm",
          "Precision giảm, Recall tăng",
          "Cả hai đều giảm",
        ],
        correct: 1,
        explanation:
          "Ngưỡng cao hơn → mô hình 'khó tính' hơn → ít dự đoán dương → Precision tăng (ít FP) nhưng Recall giảm (nhiều FN hơn).",
      },
      {
        type: "fill-blank",
        question:
          "Khi mô hình dự đoán DƯƠNG nhưng thực tế là ÂM, đó là {blank}. Khi mô hình dự đoán ÂM nhưng thực tế là DƯƠNG, đó là {blank}.",
        blanks: [
          { answer: "False Positive", accept: ["FP", "false positive"] },
          { answer: "False Negative", accept: ["FN", "false negative"] },
        ],
        explanation:
          "FP: báo nhầm. FN: bỏ sót. Trong y tế, FN thường nguy hiểm hơn; trong lọc spam, FP (xoá nhầm email quan trọng) đau hơn.",
      },
      {
        question:
          "Trong ứng dụng phát hiện gian lận thẻ tín dụng, loại lỗi nào tốn kém hơn thường?",
        options: [
          "False Positive — chặn giao dịch hợp pháp",
          "False Negative — bỏ lọt gian lận",
          "Cả hai như nhau",
          "Không loại nào quan trọng",
        ],
        correct: 1,
        explanation:
          "Bỏ lọt gian lận (FN) gây mất tiền trực tiếp. Tuy nhiên FP cũng làm phiền khách — nên ngân hàng thường dùng threshold cân bằng + xác thực thêm khi nghi ngờ.",
      },
      {
        question:
          "Specificity (TNR) đo lường gì?",
        options: [
          "Tỷ lệ phát hiện đúng dương trong số thực sự dương",
          "Tỷ lệ phát hiện đúng âm trong số thực sự âm",
          "Tỷ lệ dự đoán đúng tổng thể",
          "Tích của Precision và Recall",
        ],
        correct: 1,
        explanation:
          "Specificity = TN / (TN + FP). Đây là 'Recall cho lớp âm'. Bổ sung cho Recall (lớp dương) để nhìn toàn cảnh.",
      },
      {
        question:
          "Với threshold = 0 (cực thấp), mô hình sẽ có tính chất gì?",
        options: [
          "Precision rất cao, Recall rất thấp",
          "Dự đoán tất cả là dương: Recall = 100%, Precision thấp",
          "Accuracy = 100%",
          "Không thay đổi",
        ],
        correct: 1,
        explanation:
          "Threshold = 0 → mọi mẫu score ≥ 0 → dự đoán dương cho tất cả. Bắt được toàn bộ ca dương (Recall = 1) nhưng báo nhầm rất nhiều (Precision thấp).",
      },
      {
        question:
          "Mô hình A có F1 = 0.82, Mô hình B có F1 = 0.78 nhưng Recall B = 0.95 trong khi Recall A = 0.80. Khi nào chọn B?",
        options: [
          "Khi bài toán cần tối đa hoá Recall (y tế, an toàn)",
          "Luôn chọn A vì F1 cao hơn",
          "Không bao giờ chọn B",
          "Chỉ khi B chạy nhanh hơn",
        ],
        correct: 0,
        explanation:
          "F1 là cân bằng, nhưng nếu bài toán phạt FN nặng (bỏ sót = nguy hiểm) thì Recall quan trọng hơn tổng thể. Cần khớp metric với chi phí thật.",
      },
    ],
    [],
  );

  /* ── STYLE HELPERS ── */
  const btnPrimary =
    "rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90";
  const btnSecondary =
    "rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground";

  const previewEmail = previewId ? EMAILS.find((e) => e.id === previewId) : null;
  const focusedEmail = focusedId ? EMAILS.find((e) => e.id === focusedId) : null;

  /* ═══════════════════════════════════════════════════════════════
   * RENDER
   * ════════════════════════════════════════════════════════════ */
  return (
    <>
      {/* ── STEP 1: HOOK ── */}
      <PredictionGate
        question="Bộ lọc spam của bạn có 99% accuracy trên 1000 email (chỉ 12 email thực sự là spam). Nó có tốt không?"
        options={[
          "Có, 99% quá tuyệt!",
          "Cần xem Precision/Recall trước khi kết luận",
          "Chắc chắn dở",
        ]}
        correct={1}
        explanation="Chỉ 12/1000 email là spam → nếu mô hình luôn đoán 'không spam' nó đạt 98.8% accuracy mà vẫn vô dụng. Confusion matrix mới cho biết nó bắt được bao nhiêu spam thực sự."
      >
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Accuracy là một con số tóm tắt — nhưng tóm tắt quá mức. Với dữ liệu
          mất cân bằng (spam là thiểu số), accuracy dễ đánh lừa. Trong bài này
          bạn sẽ dán nhãn{" "}
          <strong className="text-foreground">100 email</strong> và thấy 4 loại
          lỗi xuất hiện ngay trên ma trận 2×2.
        </p>

        <ProgressSteps
          current={1}
          total={7}
          labels={[
            "Hook",
            "Dán nhãn",
            "Aha",
            "Ngưỡng",
            "So sánh",
            "Lý thuyết",
            "Quiz",
          ]}
        />

        {/* ── STEP 2: DISCOVER — 100 email labelling ── */}
        <LessonSection step={2} totalSteps={7} label="Dán nhãn 100 email">
          <VisualizationSection topicSlug={metadata.slug}>
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    Bạn là bộ lọc spam
                  </div>
                  <div className="text-xs text-muted">
                    Click từng email để xem dự đoán & sự thật. Ma trận cập
                    nhật ngay.
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleAutoLabelFromModel}
                    className={btnSecondary}
                  >
                    Dán nhãn bằng Model A
                  </button>
                  <button onClick={handleClearLabels} className={btnSecondary}>
                    Xoá nhãn
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>
                    Đã dán nhãn: {labelledCount}/{EMAILS.length}
                  </span>
                  <span>{completion}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-hover">
                  <motion.div
                    className="h-2 rounded-full bg-accent"
                    animate={{ width: `${completion}%` }}
                    transition={{ duration: 0.25 }}
                  />
                </div>
              </div>

              {/* 100-email grid */}
              <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-10">
                {EMAILS.map((email) => (
                  <EmailCard
                    key={email.id}
                    email={email}
                    prediction={predictions[email.id]}
                    truth={email.isSpam}
                    threshold={threshold}
                    flipped={predictions[email.id] !== undefined}
                    onClick={() => {
                      setPreviewId(email.id);
                      setFocusedId(email.id);
                    }}
                  />
                ))}
              </div>

              {/* Preview panel */}
              {previewEmail && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border bg-surface p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted">
                        Email #{previewEmail.id}
                      </div>
                      <div className="mt-1 font-semibold text-foreground">
                        {previewEmail.subject}
                      </div>
                      <div className="text-xs text-muted">
                        Từ: {previewEmail.sender}
                      </div>
                    </div>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                      style={{
                        backgroundColor: previewEmail.isSpam
                          ? "#ef444422"
                          : "#22c55e22",
                        color: previewEmail.isSpam ? "#ef4444" : "#22c55e",
                      }}
                    >
                      {previewEmail.isSpam ? "Sự thật: SPAM" : "Sự thật: HAM"}
                    </span>
                  </div>
                  <p className="text-sm text-muted">{previewEmail.snippet}</p>
                  <div className="flex flex-wrap gap-1">
                    {previewEmail.features.map((f) => (
                      <span
                        key={f}
                        className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] text-accent"
                      >
                        #{f}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={() => handleLabel(previewEmail.id, true)}
                      className={btnPrimary}
                    >
                      Đoán SPAM
                    </button>
                    <button
                      onClick={() => handleLabel(previewEmail.id, false)}
                      className={btnSecondary}
                    >
                      Đoán HAM
                    </button>
                    <span className="ml-auto text-xs text-muted">
                      Model A score:{" "}
                      <span className="font-mono text-foreground">
                        {modelScoreFor(previewEmail, MODELS[0]).toFixed(2)}
                      </span>
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Live confusion matrix */}
              {labelledCount > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  <div className="text-sm font-semibold text-foreground">
                    Ma trận của bạn (cập nhật trực tiếp)
                  </div>
                  <div className="overflow-x-auto">
                    <table className="mx-auto border-collapse text-center text-sm">
                      <MatrixHeader posLabel="SPAM" negLabel="HAM" />
                      <tbody>
                        <tr>
                          <th
                            rowSpan={2}
                            className="pr-2 text-xs font-semibold text-foreground"
                            style={{
                              writingMode: "vertical-lr",
                              transform: "rotate(180deg)",
                            }}
                          >
                            Dự đoán
                          </th>
                          <th className="px-2 py-1 text-xs font-medium text-blue-500">
                            SPAM
                          </th>
                          <td className="p-1">
                            <MatrixCell idx={0} value={userMatrix.tp} />
                          </td>
                          <td className="p-1">
                            <MatrixCell idx={1} value={userMatrix.fp} />
                          </td>
                        </tr>
                        <tr>
                          <th className="px-2 py-1 text-xs font-medium text-orange-500">
                            HAM
                          </th>
                          <td className="p-1">
                            <MatrixCell idx={2} value={userMatrix.fn} />
                          </td>
                          <td className="p-1">
                            <MatrixCell idx={3} value={userMatrix.tn} />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <MetricsRow m={userMatrix} />
                </motion.div>
              )}
            </div>
          </VisualizationSection>
        </LessonSection>

        {/* ── STEP 3: AHA ── */}
        <LessonSection step={3} totalSteps={7} label="Khoảnh khắc Aha">
          <AhaMoment>
            <p>
              Mỗi email rơi vào <strong>đúng một ô</strong> trong 4 ô: TP, FP,
              FN, TN. Ma trận 2×2 này là tổng hợp duy nhất — mọi chỉ số{" "}
              <em>(Accuracy, Precision, Recall, F1, Specificity…)</em> đều sinh
              ra từ đây. Sai ở đâu, sửa ở đó.
            </p>
          </AhaMoment>
        </LessonSection>

        {/* ── STEP 4: THRESHOLD + MODEL COMPARE ── */}
        <LessonSection step={4} totalSteps={7} label="Ngưỡng & So sánh">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-sm font-medium text-foreground">
                  Ngưỡng quyết định (threshold)
                </label>
                <span className="font-mono text-sm font-bold text-accent">
                  {threshold.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min={0.05}
                max={0.95}
                step={0.01}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-accent"
                style={{
                  background: `linear-gradient(to right, var(--color-accent) ${
                    ((threshold - 0.05) / 0.9) * 100
                  }%, var(--bg-surface-hover, #E2E8F0) ${
                    ((threshold - 0.05) / 0.9) * 100
                  }%)`,
                }}
              />
              <div className="flex justify-between text-xs text-muted">
                <span>0.05 (mọi email → spam)</span>
                <span>0.95 (chỉ spam hiển nhiên)</span>
              </div>
            </div>

            <div className="rounded-lg border border-accent/30 bg-accent-light p-3 text-sm text-foreground">
              <strong>Quy luật đánh đổi:</strong> Threshold tăng → ít dự đoán
              dương → Precision tăng, Recall giảm. Threshold giảm → nhiều dự
              đoán dương → Recall tăng, Precision giảm. Không có ngưỡng tối ưu
              tuyệt đối; chọn theo chi phí thật của FP và FN trong ứng dụng.
            </div>

            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">
                So sánh hai mô hình
              </h4>
              <button
                onClick={() => setShowCompare((v) => !v)}
                className={btnSecondary}
              >
                {showCompare ? "Ẩn so sánh" : "Hiện so sánh"}
              </button>
            </div>

            {showCompare && (
              <div className="grid gap-4 lg:grid-cols-2">
                {[{ model: MODELS[0], m: matrixA }, { model: MODELS[1], m: matrixB }].map(
                  ({ model, m }) => (
                    <motion.div
                      key={model.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-border bg-surface p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div
                            className="text-sm font-bold"
                            style={{ color: model.color }}
                          >
                            {model.name}
                          </div>
                          <div className="text-xs text-muted">
                            {model.description}
                          </div>
                        </div>
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: model.color }}
                        />
                      </div>
                      <div className="overflow-x-auto">
                        <table className="mx-auto border-collapse text-center text-sm">
                          <MatrixHeader posLabel="SPAM" negLabel="HAM" />
                          <tbody>
                            <tr>
                              <th
                                rowSpan={2}
                                className="pr-2 text-xs font-semibold text-foreground"
                                style={{
                                  writingMode: "vertical-lr",
                                  transform: "rotate(180deg)",
                                }}
                              >
                                Dự đoán
                              </th>
                              <th className="px-2 py-1 text-xs font-medium text-blue-500">
                                SPAM
                              </th>
                              <td className="p-1">
                                <MatrixCell idx={0} value={m.tp} />
                              </td>
                              <td className="p-1">
                                <MatrixCell idx={1} value={m.fp} />
                              </td>
                            </tr>
                            <tr>
                              <th className="px-2 py-1 text-xs font-medium text-orange-500">
                                HAM
                              </th>
                              <td className="p-1">
                                <MatrixCell idx={2} value={m.fn} />
                              </td>
                              <td className="p-1">
                                <MatrixCell idx={3} value={m.tn} />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <MetricsRow m={m} />
                    </motion.div>
                  ),
                )}
              </div>
            )}

            {showCompare && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <DiffPill
                  label="Accuracy"
                  a={matrixA.accuracy}
                  b={matrixB.accuracy}
                />
                <DiffPill
                  label="Precision"
                  a={matrixA.precision}
                  b={matrixB.precision}
                />
                <DiffPill
                  label="Recall"
                  a={matrixA.recall}
                  b={matrixB.recall}
                />
                <DiffPill label="F1" a={matrixA.f1} b={matrixB.f1} />
              </div>
            )}
          </div>
        </LessonSection>

        {/* ── STEP 5: CHALLENGE ── */}
        <LessonSection step={5} totalSteps={7} label="Thử thách nhanh">
          <InlineChallenge
            question="Hệ thống sàng lọc ung thư: FN = bỏ sót bệnh nhân, FP = chỉ định thêm xét nghiệm. Metric nào quan trọng nhất?"
            options={["Accuracy", "Precision", "Recall", "F1"]}
            correct={2}
            explanation="Bỏ sót ung thư (FN) có thể dẫn tới tử vong. Báo nhầm (FP) chỉ tốn một lượt xét nghiệm bổ sung. Ưu tiên Recall — chấp nhận một số FP để không bỏ sót ca dương thật sự."
          />
          <InlineChallenge
            question="Gợi ý sản phẩm trên trang chủ: FP = gợi ý nhầm (phiền khách), FN = không gợi ý dù khách có thể mua. Metric nào quan trọng nhất?"
            options={["Recall", "Precision", "Accuracy", "Specificity"]}
            correct={1}
            explanation="Chỉ có vài slot gợi ý trên trang chủ. Gợi ý nhầm (FP) tốn slot quý giá và làm phiền. Ưu tiên Precision — chỉ gợi ý khi rất chắc chắn."
          />
        </LessonSection>

        {/* ── STEP 6: EXPLAIN ── */}
        <LessonSection step={6} totalSteps={7} label="Lý thuyết">
          <ExplanationSection>
            <p>
              <strong>Ma trận nhầm lẫn (Confusion Matrix)</strong> là bảng 2×2
              tóm tắt hiệu suất mô hình phân loại nhị phân. Nó thường dùng cùng
              với <TopicLink slug="logistic-regression">hồi quy logistic</TopicLink>
              ,{" "}
              <TopicLink slug="naive-bayes">Naïve Bayes</TopicLink> và mọi mô
              hình khác trả về xác suất hoặc điểm.
            </p>

            <p>Bốn ô cơ bản:</p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>
                <strong>TP (True Positive):</strong> dự đoán dương, thực tế
                dương.
              </li>
              <li>
                <strong>FP (False Positive):</strong> dự đoán dương, thực tế
                âm — báo nhầm.
              </li>
              <li>
                <strong>FN (False Negative):</strong> dự đoán âm, thực tế
                dương — bỏ sót.
              </li>
              <li>
                <strong>TN (True Negative):</strong> dự đoán âm, thực tế âm.
              </li>
            </ul>

            <p>Các công thức dẫn xuất:</p>
            <LaTeX block>
              {"\\text{Accuracy} = \\frac{TP + TN}{TP + TN + FP + FN}"}
            </LaTeX>
            <LaTeX block>{"\\text{Precision} = \\frac{TP}{TP + FP}"}</LaTeX>
            <LaTeX block>{"\\text{Recall} = \\frac{TP}{TP + FN}"}</LaTeX>
            <LaTeX block>
              {"F_1 = 2 \\cdot \\frac{\\text{Precision} \\cdot \\text{Recall}}{\\text{Precision} + \\text{Recall}}"}
            </LaTeX>
            <LaTeX block>
              {"\\text{Specificity} = \\frac{TN}{TN + FP}"}
            </LaTeX>

            <Callout variant="tip" title="Khi nào ưu tiên Precision vs Recall?">
              <strong>Ưu tiên Recall</strong> khi bỏ sót (FN) nguy hiểm: phát
              hiện ung thư, gian lận, cháy rừng, lỗi phần cứng.
              <br />
              <strong>Ưu tiên Precision</strong> khi báo nhầm (FP) tốn kém: lọc
              spam (xoá nhầm email quan trọng), gợi ý sản phẩm, cảnh báo dừng
              tàu tự động.
            </Callout>

            <Callout variant="warning" title="Bẫy Accuracy">
              Với dữ liệu mất cân bằng (99% âm, 1% dương), mô hình luôn đoán
              &quot;âm&quot; đạt 99% accuracy nhưng Recall = 0%. Luôn kiểm tra
              Precision, Recall và F1. Kết hợp với{" "}
              <TopicLink slug="cross-validation">cross-validation</TopicLink>{" "}
              để ước lượng ổn định hơn.
            </Callout>

            <Callout variant="info" title="Ngưỡng (threshold) và đường ROC">
              Mỗi ngưỡng tạo ra một ma trận khác nhau. Quét ngưỡng từ 0 đến 1
              ta được một đường cong (TPR vs FPR) gọi là ROC; diện tích dưới
              đường cong (AUC) là chỉ số độc lập với ngưỡng.
            </Callout>

            <Callout variant="info" title="Nhiều lớp (multi-class)">
              Với K lớp, ma trận là K×K. Mỗi hàng là một lớp thực tế, mỗi cột
              là một lớp dự đoán. Các chỉ số Precision/Recall/F1 tính riêng cho
              mỗi lớp, rồi tổng hợp bằng macro-average hoặc weighted-average.
            </Callout>

            <CodeBlock
              language="python"
              title="Confusion Matrix với scikit-learn"
            >
              {`from sklearn.metrics import (
    confusion_matrix,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    roc_auc_score,
)
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
import numpy as np

# Giả lập dữ liệu spam: 1000 email, 12% là spam
rng = np.random.default_rng(42)
n = 1000
X = rng.normal(size=(n, 5))
y = (X[:, 0] + rng.normal(scale=0.6, size=n) > 1.2).astype(int)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.25, random_state=42, stratify=y
)

model = LogisticRegression().fit(X_train, y_train)
probs = model.predict_proba(X_test)[:, 1]
preds = (probs >= 0.5).astype(int)

cm = confusion_matrix(y_test, preds)
tn, fp, fn, tp = cm.ravel()
print("Confusion Matrix:")
print(cm)
# [[TN, FP],
#  [FN, TP]]

print(f"Precision: {precision_score(y_test, preds):.3f}")
print(f"Recall:    {recall_score(y_test, preds):.3f}")
print(f"F1 Score:  {f1_score(y_test, preds):.3f}")
print(f"AUC-ROC:   {roc_auc_score(y_test, probs):.3f}")
print(classification_report(y_test, preds, digits=3))

# Quét threshold để chọn điểm Precision-Recall mong muốn
for t in [0.3, 0.4, 0.5, 0.6, 0.7]:
    p = (probs >= t).astype(int)
    tn2, fp2, fn2, tp2 = confusion_matrix(y_test, p).ravel()
    prec = tp2 / (tp2 + fp2) if (tp2 + fp2) else 0
    rec = tp2 / (tp2 + fn2) if (tp2 + fn2) else 0
    print(f"t={t:.2f}  TP={tp2}  FP={fp2}  FN={fn2}  P={prec:.2f} R={rec:.2f}")`}
            </CodeBlock>

            <CollapsibleDetail title="Chứng minh: F1 là trung bình điều hoà của Precision & Recall">
              <p className="text-sm leading-relaxed">
                Trung bình điều hoà của hai số dương <em>a, b</em> là
                {" "}
                <LaTeX>{"H(a,b) = \\frac{2ab}{a+b}"}</LaTeX>. Với
                {" "}
                <LaTeX>{"a = \\text{Precision}"}</LaTeX> và
                {" "}
                <LaTeX>{"b = \\text{Recall}"}</LaTeX>, F1 chính là H(P, R).
                Trung bình điều hoà &quot;phạt nặng&quot; giá trị thấp: nếu
                một trong hai gần 0, tổng thể cũng gần 0 — điều mà trung bình
                cộng không thể hiện.
              </p>
            </CollapsibleDetail>

            <CollapsibleDetail title="Khi nào dùng F-beta thay vì F1?">
              <p className="text-sm leading-relaxed">
                F-beta cho phép chỉnh trọng số giữa P và R:
              </p>
              <LaTeX block>
                {"F_\\beta = (1+\\beta^2) \\cdot \\frac{P \\cdot R}{\\beta^2 P + R}"}
              </LaTeX>
              <p className="text-sm leading-relaxed">
                <LaTeX>{"\\beta > 1"}</LaTeX> ưu tiên Recall (ví dụ F2 trong y
                tế), <LaTeX>{"\\beta < 1"}</LaTeX> ưu tiên Precision (ví dụ
                F0.5 trong lọc spam). F1 là trường hợp đặc biệt{" "}
                <LaTeX>{"\\beta = 1"}</LaTeX>.
              </p>
            </CollapsibleDetail>

            <p className="text-sm text-muted">
              Khi mô hình có dấu hiệu{" "}
              <TopicLink slug="bias-variance">bias-variance</TopicLink> không
              cân bằng, confusion matrix giúp xác định lỗi cụ thể (FP hay FN)
              để chọn hướng cải thiện phù hợp: thêm dữ liệu lớp thiểu số, đổi
              threshold, hay đổi hàm mất mát có trọng số.
            </p>
          </ExplanationSection>
        </LessonSection>

        {/* ── STEP 7: SUMMARY + QUIZ ── */}
        <LessonSection step={7} totalSteps={7} label="Tóm tắt & Kiểm tra">
          <MiniSummary
            points={[
              "Confusion Matrix là bảng 2×2 (TP, FP, FN, TN) cho thấy mô hình sai ở đâu, chứ không chỉ sai bao nhiêu.",
              "Precision = TP/(TP+FP) — độ tin cậy của dự đoán dương; Recall = TP/(TP+FN) — khả năng bao phủ ca dương thật.",
              "F1 là trung bình điều hoà của Precision và Recall; phạt nặng nếu một trong hai thấp.",
              "Threshold điều khiển đánh đổi P↔R: ngưỡng cao → P↑ R↓; ngưỡng thấp → P↓ R↑.",
              "Accuracy đánh lừa trên dữ liệu mất cân bằng — luôn đi kèm P, R, F1 và nên xem Specificity/AUC.",
              "Chọn metric khớp chi phí thật: y tế → Recall, gợi ý sản phẩm → Precision, nhiều bài toán → F1 hoặc F-beta.",
            ]}
          />
          <QuizSection questions={quizQuestions} />
        </LessonSection>

        {focusedEmail && (
          <div className="sr-only">
            Focus: {focusedEmail.subject}
          </div>
        )}
      </PredictionGate>
    </>
  );
}
