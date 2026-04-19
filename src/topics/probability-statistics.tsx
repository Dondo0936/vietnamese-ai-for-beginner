"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Coins,
  RotateCcw,
  Sparkles,
  Mail,
  GitBranch,
  Calculator,
  TrendingUp,
  Thermometer,
  Dice5,
} from "lucide-react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  SliderGroup,
  StepReveal,
  LessonSection,
  TopicLink,
  CollapsibleDetail,
  LaTeX,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "probability-statistics",
  title: "Probability & Statistics",
  titleVi: "Xác suất và thống kê",
  description:
    "Tung đồng xu, đếm kết quả, đoán xem điều gì xảy ra. Xác suất thực ra chỉ là tần số dài hạn — và thống kê là cách bạn mô tả tần số đó.",
  category: "math-foundations",
  tags: ["probability", "bayes", "distribution", "statistics"],
  difficulty: "beginner",
  relatedSlugs: ["naive-bayes", "logistic-regression", "loss-functions"],
  vizType: "interactive",
  tocSections: [
    { id: "visualization", labelVi: "Hình minh họa" },
    { id: "explanation", labelVi: "Giải thích" },
  ],
};

/* ─────────────────────────────────────────────────────────
   MÔ PHỎNG TUNG ĐỒNG XU
   ───────────────────────────────────────────────────────── */

interface FlipResult {
  heads: number;
  tails: number;
  history: ("H" | "T")[];
}

function simulateFlips(bias: number, count: number, seed: number): FlipResult {
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const history: ("H" | "T")[] = [];
  let heads = 0;
  let tails = 0;
  for (let i = 0; i < count; i++) {
    const v = rand();
    if (v < bias) {
      heads += 1;
      history.push("H");
    } else {
      tails += 1;
      history.push("T");
    }
  }
  return { heads, tails, history };
}

/* ─────────────────────────────────────────────────────────
   TÍNH MEAN, VARIANCE, STD CHO CHUỖI KẾT QUẢ
   ───────────────────────────────────────────────────────── */

function computeStats(history: ("H" | "T")[]) {
  if (history.length === 0) {
    return { mean: 0, variance: 0, std: 0 };
  }
  const nums: number[] = history.map((h) => (h === "H" ? 1 : 0));
  const mean = nums.reduce<number>((a, b) => a + b, 0) / nums.length;
  const variance =
    nums.reduce<number>((acc, v) => acc + (v - mean) ** 2, 0) / nums.length;
  const std = Math.sqrt(variance);
  return { mean, variance, std };
}

/* ─────────────────────────────────────────────────────────
   CHIA HISTORY THÀNH CÁC BATCH 10 LẦN → ĐỂ VẼ HISTOGRAM
   SỐ MẶT NGỬA TRÊN MỖI BATCH
   ───────────────────────────────────────────────────────── */

function buildHistogram(history: ("H" | "T")[], batchSize = 10) {
  const buckets: number[] = new Array(batchSize + 1).fill(0);
  for (let i = 0; i + batchSize <= history.length; i += batchSize) {
    let h = 0;
    for (let j = 0; j < batchSize; j += 1) {
      if (history[i + j] === "H") h += 1;
    }
    buckets[h] += 1;
  }
  return buckets;
}

/* ─────────────────────────────────────────────────────────
   COMPONENT: HISTOGRAM TRÊN SVG
   ───────────────────────────────────────────────────────── */

function Histogram({
  buckets,
  highlight,
}: {
  buckets: number[];
  highlight?: number;
}) {
  const max = Math.max(1, ...buckets);
  const width = 420;
  const height = 160;
  const barWidth = width / buckets.length - 4;
  return (
    <svg viewBox={`0 0 ${width} ${height + 32}`} className="w-full max-w-lg">
      {/* trục ngang */}
      <line
        x1={0}
        x2={width}
        y1={height}
        y2={height}
        stroke="var(--border)"
        strokeWidth={1}
      />
      {buckets.map((count, i) => {
        const h = (count / max) * (height - 16);
        const x = i * (barWidth + 4) + 2;
        const y = height - h;
        const isHighlight = highlight === i;
        return (
          <g key={i}>
            <motion.rect
              initial={false}
              animate={{ y, height: h }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              x={x}
              width={barWidth}
              y={y}
              height={h}
              rx={3}
              fill={isHighlight ? "#f59e0b" : "#3b82f6"}
              opacity={isHighlight ? 0.95 : 0.8}
            />
            <text
              x={x + barWidth / 2}
              y={height + 14}
              textAnchor="middle"
              fontSize={10}
              fill="var(--text-secondary)"
            >
              {i}
            </text>
            {count > 0 && (
              <text
                x={x + barWidth / 2}
                y={y - 4}
                textAnchor="middle"
                fontSize={10}
                fill="var(--text-secondary)"
              >
                {count}
              </text>
            )}
          </g>
        );
      })}
      <text
        x={width / 2}
        y={height + 28}
        textAnchor="middle"
        fontSize={10}
        fill="var(--text-tertiary)"
      >
        Số mặt ngửa trong mỗi nhóm 10 lần tung
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
   CÂY BAYES — TREE DIAGRAM CHO LỌC SPAM
   ───────────────────────────────────────────────────────── */

type BayesBranch = "spam" | "ham";

function BayesTree({
  prior,
  likelihoodSpam,
  likelihoodHam,
  openBranch,
  onToggle,
}: {
  prior: number;
  likelihoodSpam: number;
  likelihoodHam: number;
  openBranch: BayesBranch | null;
  onToggle: (b: BayesBranch) => void;
}) {
  const pWordSpam = prior * likelihoodSpam;
  const pWordHam = (1 - prior) * likelihoodHam;
  const pWord = pWordSpam + pWordHam;
  const posterior = pWord === 0 ? 0 : pWordSpam / pWord;

  const branchConfigs = [
    {
      key: "spam" as const,
      label: "Thư rác (spam)",
      count: prior * 100,
      x: 170,
      lineEndX: 170,
      rectX: 90,
      boldFill: "#fee2e2",
      softFill: "#fef2f2",
      stroke: "#ef4444",
      strokeDark: "#dc2626",
      strokeFaint: "#f87171",
      textMain: "#991b1b",
      textSoft: "#7f1d1d",
      subX: 110,
      subRectX: 30,
      altX: 260,
      altRectX: 210,
      subLabel: "Có từ \u201Ctrúng thưởng\u201D",
      subCount: pWordSpam * 100,
      subLikelihood: likelihoodSpam,
      subHint: "trong spam",
    },
    {
      key: "ham" as const,
      label: "Email thật (ham)",
      count: (1 - prior) * 100,
      x: 430,
      lineEndX: 430,
      rectX: 350,
      boldFill: "#d1fae5",
      softFill: "#ecfdf5",
      stroke: "#10b981",
      strokeDark: "#059669",
      strokeFaint: "#34d399",
      textMain: "#065f46",
      textSoft: "#064e3b",
      subX: 380,
      subRectX: 300,
      altX: 530,
      altRectX: 480,
      subLabel: "Có từ \u201Ctrúng thưởng\u201D",
      subCount: pWordHam * 100,
      subLikelihood: likelihoodHam,
      subHint: "trong email thật",
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-surface/40 p-5">
      <svg viewBox="0 0 600 320" className="w-full max-w-2xl mx-auto">
        {/* nút gốc */}
        <rect x={240} y={20} rx={10} ry={10} width={120} height={40} fill="#6366f1" opacity={0.15} stroke="#6366f1" />
        <text x={300} y={44} textAnchor="middle" fontSize={12} fill="var(--text-primary)">100 email đến</text>

        {branchConfigs.map((b) => (
          <g key={b.key} onClick={() => onToggle(b.key)} style={{ cursor: "pointer" }} role="button" aria-label={`Mở nhánh ${b.key}`}>
            <line x1={300} y1={60} x2={b.lineEndX} y2={110} stroke={b.stroke} strokeWidth={2} />
            <rect x={b.rectX} y={110} width={160} height={50} rx={10} ry={10} fill={openBranch === b.key ? b.boldFill : b.softFill} stroke={b.stroke} strokeWidth={1.5} />
            <text x={b.x} y={132} textAnchor="middle" fontSize={12} fill={b.textMain} fontWeight={600}>{b.label}</text>
            <text x={b.x} y={150} textAnchor="middle" fontSize={11} fill={b.textSoft}>{b.count.toFixed(0)} email</text>
          </g>
        ))}

        <AnimatePresence>
          {branchConfigs.filter((b) => openBranch === b.key).map((b) => (
            <motion.g key={b.key} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
              <line x1={b.x} y1={160} x2={b.subX - 60} y2={220} stroke={b.strokeDark} strokeWidth={1.5} />
              <rect x={b.subRectX} y={220} width={160} height={64} rx={8} fill={b.boldFill} stroke={b.strokeDark} />
              <text x={b.subX} y={240} textAnchor="middle" fontSize={11} fill={b.textMain}>{b.subLabel}</text>
              <text x={b.subX} y={258} textAnchor="middle" fontSize={11} fill={b.textSoft} fontWeight={600}>{b.subCount.toFixed(1)} email</text>
              <text x={b.subX} y={274} textAnchor="middle" fontSize={10} fill={b.textSoft}>(P = {(b.subLikelihood * 100).toFixed(0)}% {b.subHint})</text>

              <line x1={b.x} y1={160} x2={b.altX - 30} y2={220} stroke={b.strokeFaint} strokeWidth={1} strokeDasharray="3,3" />
              <rect x={b.altRectX} y={220} width={100} height={40} rx={8} fill={b.softFill} stroke={b.strokeFaint} />
              <text x={b.altX} y={245} textAnchor="middle" fontSize={11} fill={b.textSoft}>Không có từ đó</text>
            </motion.g>
          ))}
        </AnimatePresence>
      </svg>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => onToggle("spam")}
          className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 px-3 py-2 text-xs font-medium text-red-800 dark:text-red-300 hover:bg-red-100"
        >
          {openBranch === "spam" ? "Đóng" : "Mở"} nhánh spam
        </button>
        <button
          type="button"
          onClick={() => onToggle("ham")}
          className="rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-700 px-3 py-2 text-xs font-medium text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
        >
          {openBranch === "ham" ? "Đóng" : "Mở"} nhánh email thật
        </button>
        <div className="rounded-lg border-2 border-accent bg-accent/10 px-3 py-2 text-center">
          <div className="text-[10px] uppercase tracking-wide text-tertiary">
            P(spam | có từ đó)
          </div>
          <div className="font-mono text-sm font-bold text-accent">
            {(posterior * 100).toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   QUIZ
   ───────────────────────────────────────────────────────── */

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Bạn tung một đồng xu công bằng 10 lần và ra đầu 8 lần. Kết luận nào hợp lý nhất?",
    options: [
      "Đồng xu chắc chắn bị lệch, không công bằng.",
      "10 lần là quá ít để kết luận — hiện tượng này vẫn có thể xảy ra ngẫu nhiên với đồng xu công bằng.",
      "Lần tung tiếp theo xác suất cao sẽ ra sấp để &ldquo;cân bằng&rdquo;.",
      "Xác suất ra đầu thực sự là 80%.",
    ],
    correct: 1,
    explanation:
      "Với đồng xu công bằng, xác suất ra 8 đầu trong 10 lần khoảng 4,4%. Nhỏ nhưng không hiếm. Luật số lớn chỉ đúng khi n rất lớn — 10 lần chưa đủ. Ý tưởng &ldquo;cân bằng&rdquo; là sai lầm của người cờ bạc (gambler's fallacy): mỗi lần tung độc lập, xúc xắc không có trí nhớ.",
  },
  {
    question:
      "Mean (trung bình) và standard deviation (độ lệch chuẩn) khác nhau thế nào?",
    options: [
      "Hai con số giống nhau, chỉ khác tên gọi.",
      "Mean cho biết tâm của dữ liệu, std cho biết dữ liệu lan rộng hay chụm lại quanh tâm đó.",
      "Mean luôn lớn hơn std.",
      "Std chỉ dùng cho số âm.",
    ],
    correct: 1,
    explanation:
      "Mean = điểm giữa. Std = trung bình khoảng cách của mỗi điểm dữ liệu đến điểm giữa. Hai tập dữ liệu có cùng mean có thể có std hoàn toàn khác nhau — một tập chụm sát, một tập tản mác.",
  },
  {
    question:
      "Định lý Bayes cho phép bạn làm gì mà trực giác thường làm sai?",
    options: [
      "Tính nhanh hơn các phép cộng trừ.",
      "Cập nhật niềm tin khi có bằng chứng mới — và nhắc bạn rằng base rate (tỷ lệ nền) quan trọng không kém likelihood.",
      "Dự đoán tương lai chính xác 100%.",
      "Biến một biến ngẫu nhiên thành biến tất định.",
    ],
    correct: 1,
    explanation:
      "Bayes: P(A|B) = P(B|A) · P(A) / P(B). Nhiều người quên P(A) — xác suất ban đầu — và dán quá nhiều sức nặng vào P(B|A). Đây là lý do các bài toán y tế dễ làm người ta ngộ nhận: khi bệnh hiếm, dù test chính xác 95%, phần lớn dương tính vẫn là giả.",
  },
  {
    type: "fill-blank",
    question:
      "Với một đồng xu công bằng, khi tung càng nhiều lần, tỷ lệ mặt ngửa càng tiến gần đến {blank}. Đây là {blank} số lớn.",
    blanks: [
      {
        answer: "0.5",
        accept: ["1/2", "0,5", "50%", "một nửa", "50 phần trăm"],
      },
      { answer: "luật", accept: ["định luật", "quy luật", "law"] },
    ],
    explanation:
      "Luật số lớn (law of large numbers) nói rằng trung bình mẫu hội tụ về xác suất thực khi cỡ mẫu đủ lớn. Đây là lý do khi tung xu vài lần có thể thấy kết quả lệch, nhưng tung hàng nghìn lần tỷ lệ gần như chính xác 50%.",
  },
  {
    question:
      "Bạn nhìn vào một histogram có hình chuông lệch phải. Trung vị (median) và trung bình (mean) sẽ nằm ở đâu?",
    options: [
      "Trung vị và trung bình đều nằm ở giữa, bằng nhau.",
      "Trung bình nằm lệch phải hơn trung vị — vì các giá trị lớn kéo trung bình về phía đuôi phải.",
      "Trung vị nằm lệch phải hơn trung bình.",
      "Không thể biết nếu không có công thức chính xác.",
    ],
    correct: 1,
    explanation:
      "Đây là tính chất của phân phối lệch phải: mean bị kéo về phía đuôi dài. Ví dụ: thu nhập người dân — trung bình cao hơn trung vị vì một nhóm nhỏ rất giàu kéo trung bình lên.",
  },
  {
    question:
      "Tại sao base rate (tỷ lệ nền) quan trọng trong định lý Bayes?",
    options: [
      "Vì base rate luôn bằng 50%.",
      "Vì khi tỷ lệ nền rất thấp (bệnh hiếm), dù test chính xác cao, phần lớn kết quả dương tính vẫn là giả.",
      "Vì không có base rate thì không tính được trung bình.",
      "Vì base rate giúp máy tính nhanh hơn.",
    ],
    correct: 1,
    explanation:
      "Đây là base rate fallacy. Ví dụ bệnh mắc 1%, test đúng 95%: trong 1.000 người có 10 người bệnh (9 dương tính thật) và 990 khỏe (50 dương tính giả). Phần lớn dương tính là giả. Hiểu Bayes giúp tránh cả sai lầm này trong y tế lẫn trong máy học.",
  },
  {
    question:
      "Variance (phương sai) được tính thế nào, và vì sao ta lại bình phương khoảng cách?",
    options: [
      "Bình phương để số luôn dương — nếu chỉ cộng (x − mean) thì các chênh lệch âm và dương sẽ triệt tiêu.",
      "Bình phương để tốn ít bộ nhớ hơn.",
      "Không cần bình phương, chỉ cần cộng là đủ.",
      "Bình phương là quy ước lịch sử, không có lý do kỹ thuật.",
    ],
    correct: 0,
    explanation:
      "Nếu chỉ cộng (x − mean), phần dương và âm triệt tiêu nhau, cho kết quả luôn = 0. Bình phương bảo đảm mọi khoảng cách đều đóng góp dương. Std = căn của variance để đưa đơn vị về đúng đơn vị gốc của dữ liệu.",
  },
];

/* ═════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═════════════════════════════════════════════════════════ */

export default function ProbabilityStatisticsTopic() {
  /* Coin flipper state */
  const [bias, setBias] = useState(0.5);
  const [flipCount, setFlipCount] = useState(0);
  const [seed, setSeed] = useState(42);
  const reduce = useReducedMotion();

  const flipResult = useMemo(
    () => simulateFlips(bias, flipCount, seed),
    [bias, flipCount, seed],
  );

  const stats = useMemo(() => computeStats(flipResult.history), [flipResult]);
  const hist = useMemo(
    () => buildHistogram(flipResult.history, 10),
    [flipResult],
  );

  const handleFlip100 = useCallback(() => {
    setSeed((s) => s + 17);
    setFlipCount((c) => c + 100);
  }, []);

  const handleReset = useCallback(() => {
    setFlipCount(0);
    setSeed(42);
  }, []);

  /* Guess-the-mean challenge: pick which histogram */
  const [guessHist, setGuessHist] = useState<number | null>(null);

  /* Bayes tree state */
  const [bayesPrior, setBayesPrior] = useState(0.3);
  const [bayesLikSpam, setBayesLikSpam] = useState(0.6);
  const [bayesLikHam, setBayesLikHam] = useState(0.05);
  const [openBranch, setOpenBranch] = useState<BayesBranch | null>("spam");

  const toggleBranch = useCallback((b: BayesBranch) => {
    setOpenBranch((prev) => (prev === b ? null : b));
  }, []);

  /* Auto-animate the bias slider label */
  const [label, setLabel] = useState("");
  useEffect(() => {
    if (bias === 0.5) setLabel("Đồng xu công bằng");
    else if (bias < 0.5) setLabel("Đồng xu lệch về mặt sấp");
    else setLabel("Đồng xu lệch về mặt ngửa");
  }, [bias]);

  return (
    <>
      {/* ══════ HOOK ══════ */}
      <LessonSection step={1} totalSteps={8} label="Thử đoán">
        <PredictionGate
          question="Bạn tung xu ba lần liên tiếp ra đầu cả ba. Đồng xu có bị lệch không?"
          options={[
            "Chắc chắn có — ba lần đầu liên tiếp là bằng chứng rõ ràng.",
            "Không hẳn — ba lần quá ít, kết quả này vẫn có thể xảy ra với đồng xu công bằng.",
            "Lần thứ tư chắc chắn sẽ ra sấp để cân bằng lại.",
            "Không đoán được nếu không có phần mềm chuyên dụng.",
          ]}
          correct={1}
          explanation="Với đồng xu công bằng, xác suất ra đầu ba lần liên tiếp là 1/2 × 1/2 × 1/2 = 12,5%. Không quá hiếm! Suy diễn từ 3 lần để kết luận về 'bản chất' của đồng xu là sai lầm kinh điển — xác suất chỉ bộc lộ bản thân khi bạn tung nhiều lần."
        >
          <p className="text-sm text-muted mt-4 leading-relaxed">
            Bài hôm nay, bạn sẽ tự tay <strong>tung đồng xu hàng trăm lần</strong>{" "}
            ngay trong trình duyệt, vẽ histogram, và thấy xác suất tự động hiện
            ra như thế nào. Không công thức khó — chỉ đếm và quan sát.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ══════ HIỂU BẰNG HÌNH ẢNH ══════ */}
      <LessonSection step={2} totalSteps={8} label="Hiểu bằng hình ảnh">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Coins size={20} className="text-accent" /> Xác suất = tần số
            dài hạn
          </h3>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Bạn không cần biết công thức trước. Hãy tưởng tượng bạn ngồi ở quán
            trà sữa, lôi ra một đồng xu, tung 1000 lần. Bạn ghi tổng số mặt
            ngửa và chia cho 1000. Con số đó sẽ <em>tiến gần</em> đến một giá
            trị cố định — chính là <strong>xác suất ra ngửa</strong> của đồng
            xu này.
          </p>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Xác suất không phải một ý niệm huyền bí. Nó là <em>tỷ lệ bạn quan
            sát được</em> khi thí nghiệm đủ lâu. Tiếng Anh gọi đó là{" "}
            <strong>frequentist view</strong> (góc nhìn tần suất). Cả một
            ngành thống kê đặt nền trên điều đơn giản này.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
            <div className="rounded-xl border border-sky-200 bg-sky-50 dark:bg-sky-900/20 dark:border-sky-800 p-4 space-y-1">
              <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300">
                <Dice5 size={16} />
                <span className="text-sm font-semibold">Thử nghiệm ít</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Tung 10 lần có thể ra 7 ngửa, 3 sấp. Kết luận gì cũng liều.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-4 space-y-1">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <TrendingUp size={16} />
                <span className="text-sm font-semibold">Thử nghiệm vừa</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Tung 100 lần — tỷ lệ bắt đầu ổn định quanh giá trị thật. Vẫn
                dao động vài phần trăm.
              </p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4 space-y-1">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <Sparkles size={16} />
                <span className="text-sm font-semibold">Thử nghiệm nhiều</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Tung 1.000 lần — tỷ lệ cực gần giá trị thật. Đây là luật số
                lớn.
              </p>
            </div>
          </div>
        </div>
      </LessonSection>

      {/* ══════ TRỰC QUAN HOÁ ══════ */}
      <LessonSection step={3} totalSteps={8} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          {/* ── Thử nghiệm 1: Tung xu ── */}
          <LessonSection label="Thử nghiệm 1: Tự tay tung 100 lần" step={1}>
            <p className="text-sm text-muted mb-4 leading-relaxed">
              Kéo thanh &ldquo;độ lệch thật&rdquo; để quyết định đồng xu của bạn.
              Rồi bấm <strong>&ldquo;Tung 100 lần&rdquo;</strong>. Histogram dưới
              đây sẽ chia 100 lần thành 10 nhóm mỗi nhóm 10 lần, và đếm có bao
              nhiêu nhóm cho 0, 1, 2, ..., 10 mặt ngửa.
            </p>

            <div className="rounded-xl border border-border bg-surface/40 p-5 space-y-5">
              {/* Kéo thanh bias */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="coin-bias"
                    className="text-sm font-medium text-foreground flex items-center gap-2"
                  >
                    <Thermometer size={14} className="text-accent" />
                    Độ lệch thật của đồng xu (P(ngửa))
                  </label>
                  <span className="font-mono text-sm font-bold text-accent tabular-nums">
                    {bias.toFixed(2)}
                  </span>
                </div>
                <input
                  id="coin-bias"
                  type="range"
                  min={0.1}
                  max={0.9}
                  step={0.05}
                  value={bias}
                  onChange={(e) => {
                    setBias(parseFloat(e.target.value));
                    handleReset();
                  }}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer accent-accent"
                  style={{
                    background: `linear-gradient(to right, #6366f1 ${bias * 100}%, var(--bg-surface-hover, #E2E8F0) ${bias * 100}%)`,
                  }}
                />
                <div className="flex justify-between text-[10px] text-tertiary mt-1">
                  <span>0.10 — gần như luôn sấp</span>
                  <span>0.50 — công bằng</span>
                  <span>0.90 — gần như luôn ngửa</span>
                </div>
                <p className="text-xs text-muted mt-1.5 italic text-center">
                  {label}
                </p>
              </div>

              {/* Nút điều khiển */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleFlip100}
                  className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark transition-colors"
                >
                  <Coins size={14} /> Tung thêm 100 lần
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
                >
                  <RotateCcw size={14} /> Đặt lại
                </button>
                <span className="ml-auto text-xs text-muted tabular-nums">
                  Đã tung: <strong>{flipCount}</strong> lần
                </span>
              </div>

              {/* Kết quả tổng */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border border-border bg-card p-3 text-center">
                  <div className="text-[10px] uppercase tracking-wide text-tertiary">
                    Ngửa
                  </div>
                  <div className="font-mono text-lg font-bold text-blue-500 tabular-nums">
                    {flipResult.heads}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-card p-3 text-center">
                  <div className="text-[10px] uppercase tracking-wide text-tertiary">
                    Sấp
                  </div>
                  <div className="font-mono text-lg font-bold text-orange-500 tabular-nums">
                    {flipResult.tails}
                  </div>
                </div>
                <div className="rounded-lg border-2 border-accent bg-accent/10 p-3 text-center">
                  <div className="text-[10px] uppercase tracking-wide text-tertiary">
                    Tỷ lệ ngửa
                  </div>
                  <div className="font-mono text-lg font-bold text-accent tabular-nums">
                    {flipCount === 0
                      ? "—"
                      : `${((flipResult.heads / flipCount) * 100).toFixed(1)}%`}
                  </div>
                </div>
              </div>

              {/* Histogram */}
              {flipCount >= 10 && (
                <div className="rounded-lg bg-card border border-border p-3">
                  <Histogram buckets={hist} />
                  <p className="text-xs text-muted text-center italic mt-2">
                    Histogram sẽ &ldquo;dày&rdquo; hơn và có đỉnh ngay tại{" "}
                    {Math.round(bias * 10)} khi bạn tung càng nhiều. Đây là
                    phân phối nhị thức (binomial distribution).
                  </p>
                </div>
              )}

              {flipCount >= 100 && (
                <Callout variant="insight" title="Luật số lớn đang làm việc">
                  Sau {flipCount} lần, tỷ lệ ngửa của bạn là{" "}
                  <strong>
                    {((flipResult.heads / flipCount) * 100).toFixed(1)}%
                  </strong>
                  . Giá trị &ldquo;thật&rdquo; bạn đặt là{" "}
                  <strong>{(bias * 100).toFixed(0)}%</strong>. Càng tung nhiều,
                  hai con số càng gần nhau.
                </Callout>
              )}
            </div>
          </LessonSection>

          {/* ── Thử nghiệm 2: Mean, Variance, STD ── */}
          <LessonSection
            label="Thử nghiệm 2: Mean, Variance, Std — đều từ cùng dữ liệu"
            step={2}
          >
            <p className="text-sm text-muted mb-4 leading-relaxed">
              Ba con số này nghe to tát nhưng chỉ là ba cách mô tả cùng một thứ.
              Bấm &ldquo;Tung thêm 100 lần&rdquo; ở thử nghiệm trên để thấy
              chúng di chuyển.
            </p>

            <StepReveal
              labels={[
                "Bước 1: Mean (trung bình)",
                "Bước 2: Variance (phương sai)",
                "Bước 3: Std (độ lệch chuẩn)",
              ]}
            >
              {[
                <div
                  key="s1"
                  className="rounded-lg bg-surface/60 border border-border p-4 space-y-2"
                >
                  <p className="text-sm text-foreground leading-relaxed">
                    <strong>Mean (trung bình):</strong> chuyển mỗi lần ngửa
                    thành số 1, mỗi lần sấp thành số 0, rồi lấy trung bình.
                  </p>
                  <div className="rounded-md bg-card border border-border p-3 flex items-center justify-between">
                    <span className="text-xs text-muted">
                      Trung bình hiện tại
                    </span>
                    <span className="font-mono text-lg font-bold text-accent tabular-nums">
                      {stats.mean.toFixed(3)}
                    </span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    Chú ý: giá trị này chính là{" "}
                    <strong>tỷ lệ mặt ngửa</strong> bạn đã quan sát. Trong
                    trường hợp xu 0/1, mean = xác suất thực nghiệm.
                  </p>
                </div>,
                <div
                  key="s2"
                  className="rounded-lg bg-surface/60 border border-border p-4 space-y-2"
                >
                  <p className="text-sm text-foreground leading-relaxed">
                    <strong>Variance (phương sai):</strong> đo mức độ lan rộng.
                    Với mỗi lần tung, tính (kết quả − mean), bình phương lên,
                    rồi lấy trung bình. Bình phương để triệt tiêu dấu trừ.
                  </p>
                  <div className="rounded-md bg-card border border-border p-3 flex items-center justify-between">
                    <span className="text-xs text-muted">
                      Phương sai hiện tại
                    </span>
                    <span className="font-mono text-lg font-bold text-purple-500 tabular-nums">
                      {stats.variance.toFixed(3)}
                    </span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    Variance lớn nhất khi mean = 0.5 (xu công bằng) — vì lúc đó
                    kết quả thay đổi nhiều nhất. Khi bias = 0.9, gần như lần
                    nào cũng ra 1 → variance nhỏ.
                  </p>
                </div>,
                <div
                  key="s3"
                  className="rounded-lg bg-surface/60 border border-border p-4 space-y-2"
                >
                  <p className="text-sm text-foreground leading-relaxed">
                    <strong>Std (độ lệch chuẩn):</strong> căn bậc hai của
                    variance. Mục đích: đưa đơn vị về đúng đơn vị gốc. Nếu
                    variance = 0.25 kg² thì std = 0.5 kg.
                  </p>
                  <div className="rounded-md bg-card border border-border p-3 flex items-center justify-between">
                    <span className="text-xs text-muted">Std hiện tại</span>
                    <span className="font-mono text-lg font-bold text-amber-500 tabular-nums">
                      {stats.std.toFixed(3)}
                    </span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    Khi bạn đọc báo nói &ldquo;chiều cao trung bình 1m65, lệch
                    chuẩn 7cm&rdquo; — nghĩa là hầu hết mọi người cao từ 1m58
                    đến 1m72 (mean ± 1 std).
                  </p>
                </div>,
              ]}
            </StepReveal>
          </LessonSection>

          {/* ── Thử nghiệm 3: SliderGroup cho bias preset ── */}
          <LessonSection
            label="Thử nghiệm 3: Ba đồng xu khác nhau cùng lúc"
            step={3}
          >
            <p className="text-sm text-muted mb-4 leading-relaxed">
              Kéo ba thanh dưới đây. Mỗi đồng xu có một bias khác nhau. Hình
              bên trên so sánh ba histogram để bạn thấy phân phối thay đổi
              theo bias.
            </p>

            <SliderGroup
              title="So sánh ba đồng xu lý thuyết"
              sliders={[
                {
                  key: "biasA",
                  label: "Đồng xu A — lệch mặt sấp",
                  min: 10,
                  max: 50,
                  step: 5,
                  defaultValue: 25,
                  unit: "% ngửa",
                },
                {
                  key: "biasB",
                  label: "Đồng xu B — công bằng",
                  min: 30,
                  max: 70,
                  step: 5,
                  defaultValue: 50,
                  unit: "% ngửa",
                },
                {
                  key: "biasC",
                  label: "Đồng xu C — lệch mặt ngửa",
                  min: 50,
                  max: 90,
                  step: 5,
                  defaultValue: 75,
                  unit: "% ngửa",
                },
              ]}
              visualization={(vals) => (
                <div className="w-full space-y-2">
                  {(["biasA", "biasB", "biasC"] as const).map((k, idx) => {
                    const p = vals[k] / 100;
                    const colors = ["#ef4444", "#10b981", "#3b82f6"];
                    return (
                      <div key={k} className="flex items-center gap-3">
                        <span className="w-14 shrink-0 text-xs font-medium text-foreground">
                          Xu {idx === 0 ? "A" : idx === 1 ? "B" : "C"}
                        </span>
                        <div className="flex-1 h-5 rounded-md bg-surface-hover overflow-hidden relative">
                          <motion.div
                            className="h-full rounded-md"
                            style={{ backgroundColor: colors[idx] }}
                            animate={
                              reduce
                                ? { width: `${vals[k]}%` }
                                : { width: `${vals[k]}%` }
                            }
                            initial={false}
                            transition={{ duration: 0.25 }}
                          />
                        </div>
                        <span className="w-14 shrink-0 text-right text-xs tabular-nums text-muted">
                          P = {p.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                  <p className="text-[10px] text-tertiary text-center italic mt-2">
                    Thanh càng dài = đồng xu càng thiên về mặt ngửa.
                  </p>
                </div>
              )}
            />
          </LessonSection>
        </VisualizationSection>
      </LessonSection>

      {/* ══════ AHA ══════ */}
      <LessonSection step={4} totalSteps={8} label="Khoảnh khắc hiểu">
        <AhaMoment>
          Xác suất không phải là một con số huyền bí đến từ trời cao —{" "}
          <strong>nó là tần số bạn quan sát được</strong> khi thí nghiệm đủ
          nhiều. Mean, variance, std đều là ba cách khác nhau để mô tả cùng một
          đám dữ liệu: điểm giữa ở đâu, và dữ liệu có tản mác không.
          <br />
          <br />
          Toàn bộ thống kê đứng trên hai ý đơn giản đó. Từ thăm dò dư luận đến
          huấn luyện AI — tất cả chỉ là đếm, chia, rồi rút kết luận.
        </AhaMoment>
      </LessonSection>

      {/* ══════ THỬ THÁCH ══════ */}
      <LessonSection step={5} totalSteps={8} label="Thử thách">
        <div className="space-y-5">
          <p className="text-sm text-muted leading-relaxed">
            Dưới đây là ba histogram của ba đồng xu khác nhau. Mỗi histogram
            đếm số mặt ngửa trong 100 nhóm mỗi nhóm 10 lần. Bạn đoán xem
            histogram nào có <strong>mean cao nhất</strong>?
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                id: 0,
                label: "Histogram 1",
                data: [0, 1, 4, 11, 24, 30, 20, 8, 2, 0, 0],
                truth: 0.45,
              },
              {
                id: 1,
                label: "Histogram 2",
                data: [0, 0, 0, 2, 8, 20, 28, 24, 12, 5, 1],
                truth: 0.62,
              },
              {
                id: 2,
                label: "Histogram 3",
                data: [8, 18, 25, 22, 14, 8, 3, 1, 1, 0, 0],
                truth: 0.3,
              },
            ].map((h) => {
              const isPicked = guessHist === h.id;
              const revealed = guessHist !== null;
              const isMax = h.id === 1;
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setGuessHist(h.id)}
                  disabled={revealed}
                  className={`rounded-xl border p-3 transition-colors text-left ${
                    isPicked
                      ? "border-accent bg-accent-light"
                      : "border-border bg-card hover:border-accent/50"
                  } ${revealed && !isPicked ? "opacity-60" : ""}`}
                >
                  <div className="text-xs font-semibold text-foreground mb-2">
                    {h.label}
                  </div>
                  <Histogram buckets={h.data} />
                  {revealed && (
                    <div
                      className={`mt-2 text-xs font-semibold ${
                        isMax
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted"
                      }`}
                    >
                      Bias thật: {h.truth.toFixed(2)} —{" "}
                      {isMax ? "mean cao nhất" : "thấp hơn"}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {guessHist !== null && (
            <Callout
              variant={guessHist === 1 ? "tip" : "warning"}
              title={guessHist === 1 ? "Đoán đúng!" : "Chưa đúng"}
            >
              Histogram có đỉnh lệch về bên phải (gần 10) là histogram có mean
              cao nhất. Đây là cách bạn &ldquo;đọc&rdquo; phân phối chỉ bằng
              mắt — không cần máy tính.
            </Callout>
          )}

          <InlineChallenge
            question="Một hộp có 70 bi đỏ và 30 bi xanh. Bạn bốc 1 bi (không nhìn màu), rồi bốc thêm 1 bi nữa (không trả viên đầu lại). Xác suất viên THỨ HAI là đỏ bằng bao nhiêu?"
            options={[
              "70% — như xác suất ban đầu.",
              "69,9% — giảm một chút vì đã lấy một viên.",
              "Không tính được nếu chưa biết viên đầu màu gì.",
              "50% — cứ đỏ hoặc xanh, 50/50.",
            ]}
            correct={0}
            explanation="Dùng luật xác suất toàn phần: P(thứ 2 đỏ) = P(thứ 1 đỏ) × P(thứ 2 đỏ | thứ 1 đỏ) + P(thứ 1 xanh) × P(thứ 2 đỏ | thứ 1 xanh) = 0,7 × 69/99 + 0,3 × 70/99 = 0,7 × 0,697 + 0,3 × 0,707 = 0,7. Khi không có thông tin gì về viên đầu, xác suất hai lần rút như nhau."
          />
        </div>
      </LessonSection>

      {/* ══════ GIẢI THÍCH ══════ */}
      <LessonSection step={6} totalSteps={8} label="Giải thích">
        <ExplanationSection topicSlug={metadata.slug}>
          <p className="leading-relaxed">
            Ở trên bạn đã nhìn <strong>luật số lớn</strong> và{" "}
            <strong>ba con số mô tả dữ liệu</strong> bằng mắt. Phần này là tên
            gọi chính thức và công thức tối thiểu — để lần sau bạn nhìn thấy
            chúng trong sách giáo khoa vẫn nhận ra.
          </p>

          <h4 className="text-sm font-semibold text-foreground mt-6 mb-2 flex items-center gap-2">
            <Calculator size={14} className="text-accent" /> Công thức 1 —
            Trung bình
          </h4>

          <LaTeX block>
            {String.raw`\mu = \frac{1}{n}\sum_{i=1}^{n} x_i`}
          </LaTeX>

          <p className="text-sm leading-relaxed">
            <strong>Bằng lời:</strong> cộng tất cả các giá trị lại, chia cho
            số lượng. Đơn giản vậy thôi. Đây là con số &ldquo;điểm giữa&rdquo;
            của cả đám dữ liệu — ký hiệu bằng chữ Hy Lạp{" "}
            <LaTeX>{String.raw`\mu`}</LaTeX> (đọc là &ldquo;mu&rdquo;). Trong
            ví dụ xu 0/1, trung bình chính là{" "}
            <em>tỷ lệ mặt ngửa bạn quan sát được</em>.
          </p>

          <Callout variant="info" title="Mean và median khác nhau">
            Trung bình (mean) cộng tất cả rồi chia. Trung vị (median) là giá
            trị nằm chính giữa khi xếp theo thứ tự. Khi có một vài điểm cực
            đoan (như thu nhập siêu giàu), mean bị kéo lệch, median vẫn đứng
            yên. Muốn nói về &ldquo;người Việt trung bình&rdquo; thì median
            thường chính xác hơn mean.
          </Callout>

          <h4 className="text-sm font-semibold text-foreground mt-6 mb-2 flex items-center gap-2">
            <GitBranch size={14} className="text-accent" /> Công thức 2 —
            Định lý Bayes
          </h4>

          <LaTeX block>
            {String.raw`P(A|B) = \frac{P(B|A) \cdot P(A)}{P(B)}`}
          </LaTeX>

          <p className="text-sm leading-relaxed">
            <strong>Bằng lời:</strong> xác suất A xảy ra khi biết B đã xảy ra
            = &ldquo;xác suất thấy B nếu A đúng&rdquo; × &ldquo;niềm tin ban
            đầu vào A&rdquo;, chia cho &ldquo;xác suất B xảy ra nói chung&rdquo;.
            Nghe rắc rối nhưng bản chất chỉ là{" "}
            <strong>cập nhật niềm tin khi có bằng chứng mới</strong>.
          </p>

          <div className="rounded-xl border border-border bg-surface/40 p-5 my-4">
            <h5 className="text-sm font-semibold text-foreground mb-2">
              Chơi với cây Bayes: Lọc spam đơn giản
            </h5>
            <p className="text-xs text-muted mb-3 leading-relaxed">
              Kéo ba thanh dưới để thay đổi: tỷ lệ spam ban đầu, xác suất từ
              &ldquo;trúng thưởng&rdquo; xuất hiện trong spam, và trong email
              thật. Bấm nhánh để mở/đóng.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div>
                <label
                  htmlFor="bayes-prior"
                  className="text-[11px] font-medium text-muted"
                >
                  Tỷ lệ spam ban đầu: {(bayesPrior * 100).toFixed(0)}%
                </label>
                <input
                  id="bayes-prior"
                  type="range"
                  min={0.05}
                  max={0.7}
                  step={0.05}
                  value={bayesPrior}
                  onChange={(e) => setBayesPrior(parseFloat(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>
              <div>
                <label
                  htmlFor="bayes-lik-spam"
                  className="text-[11px] font-medium text-muted"
                >
                  P(từ | spam): {(bayesLikSpam * 100).toFixed(0)}%
                </label>
                <input
                  id="bayes-lik-spam"
                  type="range"
                  min={0.1}
                  max={0.95}
                  step={0.05}
                  value={bayesLikSpam}
                  onChange={(e) =>
                    setBayesLikSpam(parseFloat(e.target.value))
                  }
                  className="w-full accent-accent"
                />
              </div>
              <div>
                <label
                  htmlFor="bayes-lik-ham"
                  className="text-[11px] font-medium text-muted"
                >
                  P(từ | email thật): {(bayesLikHam * 100).toFixed(0)}%
                </label>
                <input
                  id="bayes-lik-ham"
                  type="range"
                  min={0.01}
                  max={0.4}
                  step={0.01}
                  value={bayesLikHam}
                  onChange={(e) =>
                    setBayesLikHam(parseFloat(e.target.value))
                  }
                  className="w-full accent-accent"
                />
              </div>
            </div>

            <BayesTree
              prior={bayesPrior}
              likelihoodSpam={bayesLikSpam}
              likelihoodHam={bayesLikHam}
              openBranch={openBranch}
              onToggle={toggleBranch}
            />
          </div>

          <p className="text-sm leading-relaxed">
            Khi bạn tăng tỷ lệ spam ban đầu (prior), P(spam | có từ đó) cũng
            tăng. Khi bạn nâng P(từ | email thật) (nhiều email thật cũng có
            từ đó), P(spam | có từ đó) giảm — dù likelihood trong spam không
            đổi. <strong>Đây là sức mạnh của Bayes</strong>: cả prior lẫn
            likelihood đều quan trọng. Trực giác hay quên prior, nên thường sai.
          </p>

          <Callout variant="tip" title="Xem ứng dụng thực tế">
            Bạn vừa xem mô hình cực tối giản của bộ lọc thư rác Gmail. Muốn
            thấy Google thực sự triển khai như thế nào với 15 tỷ email/ngày,
            xem{" "}
            <TopicLink slug="probability-statistics-in-spam-filter">
              Xác suất trong lọc spam
            </TopicLink>
            .
          </Callout>

          <h4 className="text-sm font-semibold text-foreground mt-6 mb-2">
            Phân phối thường gặp — chỉ cần biết tên
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-card p-4 space-y-1">
              <div className="text-sm font-semibold text-foreground">
                Phân phối chuẩn (Gaussian)
              </div>
              <p className="text-xs text-muted leading-snug">
                Hình chuông đối xứng quanh mean. Chiều cao con người, điểm thi
                SAT, sai số đo đạc đều gần như Gaussian. Quy tắc 68-95-99.7:
                68% nằm trong 1 std, 95% trong 2 std, 99.7% trong 3 std.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 space-y-1">
              <div className="text-sm font-semibold text-foreground">
                Phân phối nhị thức (Binomial)
              </div>
              <p className="text-xs text-muted leading-snug">
                Đếm số lần thành công trong n thử nghiệm độc lập. Chính là
                histogram xu bạn vừa thấy. Khi n lớn, binomial trông gần giống
                Gaussian.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 space-y-1">
              <div className="text-sm font-semibold text-foreground">
                Phân phối đều (Uniform)
              </div>
              <p className="text-xs text-muted leading-snug">
                Mọi giá trị có cơ hội như nhau. Bốc số trúng thưởng từ trống
                quay. Tung một con xúc xắc 6 mặt.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 space-y-1">
              <div className="text-sm font-semibold text-foreground">
                Phân phối Poisson
              </div>
              <p className="text-xs text-muted leading-snug">
                Đếm số sự kiện hiếm trong một khoảng thời gian cố định. Số cuộc
                gọi đến tổng đài trong 1 giờ. Số lượt đặt hàng Shopee trong 1
                phút lúc 23h.
              </p>
            </div>
          </div>

          <CollapsibleDetail title="Vì sao phải bình phương khi tính variance?">
            <p className="text-sm leading-relaxed">
              Variance đo độ lan. Cách tự nhiên nhất: lấy trung bình của (x −
              mean). Vấn đề: các giá trị nằm bên trái mean đóng góp âm, bên
              phải đóng góp dương — triệt tiêu, kết quả luôn bằng 0. Để khắc
              phục, người ta bình phương trước khi cộng: (x − mean)². Mọi
              đóng góp bây giờ đều dương. Sau khi cộng xong, lấy căn để đưa
              đơn vị về lại như ban đầu — đó chính là std.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Tại sao trực giác con người sai về xác suất?">
            <p className="text-sm leading-relaxed">
              Tiến hoá không thiết kế não bộ cho xác suất. Tổ tiên cần phản
              ứng nhanh với hổ trong bụi cỏ, không cần tính xác suất chính
              xác. Nhà tâm lý học Daniel Kahneman và Amos Tversky đã liệt kê
              hàng loạt &ldquo;lối tắt&rdquo; mà não dùng — rất hữu dụng trong
              đời thường, nhưng sai bét khi gặp bài toán xác suất.
            </p>
            <p className="text-sm leading-relaxed mt-2">
              Hai ví dụ kinh điển:{" "}
              <strong>base rate neglect</strong> (quên tỷ lệ nền — đã gặp ở
              thử thách trên) và <strong>gambler&apos;s fallacy</strong>{" "}
              (ảo tưởng người cờ bạc: tin rằng sau 5 lần đỏ, lần tiếp theo
              &ldquo;phải&rdquo; là đen). Cả hai đều là lý do tại sao học xác
              suất chính thống là kỹ năng quan trọng — nó sửa sai cho trực
              giác của bạn.
            </p>
          </CollapsibleDetail>
        </ExplanationSection>
      </LessonSection>

      {/* ══════ TÓM TẮT ══════ */}
      <LessonSection step={7} totalSteps={8} label="Tóm tắt">
        <MiniSummary
          title="5 điều cần nhớ"
          points={[
            "Xác suất = tần số dài hạn. Nếu bạn tung đủ nhiều lần, tỷ lệ quan sát sẽ tiến đến xác suất thật.",
            "Mean = điểm giữa của dữ liệu. Median = giá trị nằm chính giữa. Khi có giá trị cực đoan, median ổn định hơn.",
            "Variance và std đo độ lan. Std cùng đơn vị với dữ liệu gốc, dễ dùng hơn variance.",
            "Bayes: cả prior (tỷ lệ nền) và likelihood (bằng chứng mới) đều quan trọng. Quên một cái, kết luận sai.",
            "Phân phối chuẩn, nhị thức, đều, Poisson — bốn người bạn thường gặp. Chưa cần nhớ công thức, chỉ cần nhớ tình huống nào dùng phân phối nào.",
          ]}
        />

        <div className="mt-4">
          <Callout variant="tip" title="Xem ứng dụng thực tế">
            Phần lý thuyết đã xong. Muốn nhìn xác suất được dùng để lọc 15 tỷ
            email spam mỗi ngày? Xem{" "}
            <TopicLink slug="probability-statistics-in-spam-filter">
              Xác suất trong lọc spam
            </TopicLink>{" "}
            — cùng lý thuyết, nhưng chạy trong production ở Google.
          </Callout>
        </div>
      </LessonSection>

      {/* ══════ QUIZ ══════ */}
      <LessonSection step={8} totalSteps={8} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
        <div className="mt-6 flex items-center justify-center">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Mail size={12} />
            Bạn có thể làm lại quiz bất cứ lúc nào.
          </div>
        </div>
      </LessonSection>
    </>
  );
}
