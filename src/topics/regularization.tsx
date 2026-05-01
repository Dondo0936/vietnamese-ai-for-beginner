"use client";

import { useState, useMemo, useCallback } from "react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
  TopicLink,
  CollapsibleDetail,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "regularization",
  title: "Regularization",
  titleVi: "Chính quy hóa",
  description:
    "Các kỹ thuật chống overfitting bằng cách thêm ràng buộc vào quá trình huấn luyện.",
  category: "neural-fundamentals",
  tags: ["training", "overfitting", "techniques"],
  difficulty: "intermediate",
  relatedSlugs: [
    "overfitting-underfitting",
    "loss-functions",
    "batch-normalization",
  ],
  vizType: "interactive",
};

/* ──────────────────────────────────────────────────────────────
 * CONSTANTS & HELPERS
 * ────────────────────────────────────────────────────────────── */

type RegType =
  | "none"
  | "l1"
  | "l2"
  | "elasticnet"
  | "dropout"
  | "dropconnect"
  | "batchnorm"
  | "augment"
  | "earlystop"
  | "labelsmoothing";

const BASE_WEIGHTS = [
  0.8, -1.2, 0.3, 2.1, -0.5, 0.9, -1.8, 0.1, 1.5, -0.7, 0.4, 1.1,
];

interface RegInfo {
  label: string;
  color: string;
  desc: string;
  famille: "norm" | "stochastic" | "normalization" | "data" | "schedule" | "loss";
}

const REG_CONFIG: Record<RegType, RegInfo> = {
  none: {
    label: "Không regularization",
    color: "#64748b",
    desc: "Trọng số tự do — dễ overfitting với mạng lớn và dữ liệu nhỏ.",
    famille: "norm",
  },
  l1: {
    label: "L1 (Lasso)",
    color: "#3b82f6",
    desc: "Đẩy trọng số nhỏ về đúng 0 — tạo sparsity, tự động feature selection.",
    famille: "norm",
  },
  l2: {
    label: "L2 (Ridge)",
    color: "#22c55e",
    desc: "Thu nhỏ tất cả trọng số đều đặn — phân bổ đều vai trò, hiếm khi về 0.",
    famille: "norm",
  },
  elasticnet: {
    label: "ElasticNet (L1 + L2)",
    color: "#0ea5e9",
    desc: "Kết hợp L1 (sparsity) và L2 (stability) — phù hợp khi feature có tương quan.",
    famille: "norm",
  },
  dropout: {
    label: "Dropout",
    color: "#f59e0b",
    desc: "Tắt ngẫu nhiên p% nơ-ron mỗi bước train — buộc mạng không phụ thuộc nơ-ron đơn lẻ.",
    famille: "stochastic",
  },
  dropconnect: {
    label: "DropConnect",
    color: "#d97706",
    desc: "Tắt ngẫu nhiên p% kết nối (weight) thay vì nơ-ron — tổng quát hơn Dropout.",
    famille: "stochastic",
  },
  batchnorm: {
    label: "BatchNorm",
    color: "#8b5cf6",
    desc: "Chuẩn hoá activation theo batch — có hiệu ứng regularization nhẹ do noise từ batch statistics.",
    famille: "normalization",
  },
  augment: {
    label: "Data Augmentation",
    color: "#ec4899",
    desc: "Tăng số lượng training sample bằng biến đổi bảo toàn label (flip, crop, rotate, mixup).",
    famille: "data",
  },
  earlystop: {
    label: "Early Stopping",
    color: "#14b8a6",
    desc: "Dừng train khi val loss tăng — ngăn model vào vùng overfit.",
    famille: "schedule",
  },
  labelsmoothing: {
    label: "Label Smoothing",
    color: "#a855f7",
    desc: "Giảm độ tự tin của target (1 → 0.9) — ngăn output quá extreme.",
    famille: "loss",
  },
};

const REG_TYPE_ORDER: RegType[] = [
  "none",
  "l1",
  "l2",
  "elasticnet",
  "dropout",
  "dropconnect",
  "batchnorm",
  "augment",
  "earlystop",
  "labelsmoothing",
];

const SVG_W = 460;
const SVG_H = 210;

// Deterministic pseudo-random theo hash của index và salt
function seededNoise(i: number, salt: number): number {
  return Math.abs(Math.sin(i * 7.3 + salt * 0.17 + 0.5));
}

// Tính trọng số sau khi áp dụng regularization — cho các kỹ thuật
// ảnh hưởng trực tiếp lên weights (L1, L2, ElasticNet, Dropout, DropConnect).
function applyReg(
  baseWeights: number[],
  regType: RegType,
  strength: number,
): number[] {
  return baseWeights.map((w, i) => {
    if (regType === "none") return w;

    if (regType === "l1") {
      // Soft-thresholding: đẩy về 0 nếu |w| < shrink
      const shrink = strength * 0.8;
      if (Math.abs(w) < shrink) return 0;
      return w > 0 ? w - shrink : w + shrink;
    }

    if (regType === "l2") {
      // Weight decay: nhân với (1 - λ)
      return w * (1 - strength * 0.4);
    }

    if (regType === "elasticnet") {
      // Kết hợp: trước tiên shrink theo L2, sau đó threshold theo L1
      const l2 = w * (1 - strength * 0.25);
      const shrink = strength * 0.4;
      if (Math.abs(l2) < shrink) return 0;
      return l2 > 0 ? l2 - shrink : l2 + shrink;
    }

    if (regType === "dropout") {
      // Tắt nơ-ron (i đóng vai trò neuron index)
      const threshold = strength * 0.6;
      return seededNoise(i, 1) < threshold ? 0 : w;
    }

    if (regType === "dropconnect") {
      // Tắt connection (salt khác để pattern khác dropout)
      const threshold = strength * 0.6;
      return seededNoise(i, 2) < threshold ? 0 : w;
    }

    if (regType === "batchnorm") {
      // Minh hoạ ảnh hưởng của BN: scale về mean=0, std nhỏ hơn
      const mean = baseWeights.reduce((a, b) => a + b, 0) / baseWeights.length;
      const variance =
        baseWeights.reduce((s, v) => s + (v - mean) ** 2, 0) /
        baseWeights.length;
      const std = Math.sqrt(variance) + 1e-6;
      const normalized = (w - mean) / std;
      // Noise nhẹ để minh hoạ batch-to-batch variability
      const noise = (seededNoise(i, 3) - 0.5) * strength * 0.3;
      return normalized * (1 - strength * 0.5) + noise;
    }

    if (regType === "augment") {
      // Data augmentation không chỉnh weights trực tiếp, nhưng ta minh hoạ
      // bằng cách cho model ổn định hơn (variance thấp hơn)
      return w * (1 - strength * 0.15);
    }

    if (regType === "earlystop") {
      // Early stopping giữ weights ở trạng thái "còn sớm" — ít extreme hơn
      return w * (1 - strength * 0.2);
    }

    if (regType === "labelsmoothing") {
      // Label smoothing làm output distribution mềm hơn → weights ít extreme
      const sign = Math.sign(w);
      const mag = Math.abs(w);
      const soft = Math.log(1 + mag * 1.5) / Math.log(2.5);
      return sign * mag * (1 - strength * 0.2) + sign * soft * strength * 0.05;
    }

    return w;
  });
}

// Minh hoạ sparse vs smooth problems
interface Dataset {
  id: "sparse" | "smooth";
  label: string;
  description: string;
  trueWeights: number[]; // "ground truth" để minh hoạ hiệu quả của L1 vs L2
}

const DATASETS: Dataset[] = [
  {
    id: "sparse",
    label: "Sparse Problem",
    description:
      "100 feature nhưng chỉ 10 thực sự quan trọng. L1 ăn điểm: tự động loại 90 feature dư thừa.",
    trueWeights: [1.8, 0, 0, 2.1, 0, 0, 0, -1.5, 0, 0, 0, 1.2],
  },
  {
    id: "smooth",
    label: "Smooth Problem",
    description:
      "Tất cả feature đóng góp nhỏ, không có feature nào trội hẳn. L2 ăn điểm: phân bổ đều.",
    trueWeights: [0.5, 0.6, -0.4, 0.7, -0.5, 0.6, -0.3, 0.4, -0.5, 0.6, 0.3, -0.4],
  },
];

// Dropout visualization — neuron grid
interface NeuronGrid {
  rows: number;
  cols: number;
}
const DROPOUT_GRID: NeuronGrid = { rows: 3, cols: 6 };

/* ──────────────────────────────────────────────────────────────
 * QUIZ
 * ────────────────────────────────────────────────────────────── */

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question:
      "L1 regularization tạo ra trọng số thưa (sparse). Điều này có lợi gì?",
    options: [
      "Mô hình chạy nhanh hơn vì nhiều trọng số = 0 (phép nhân bằng 0 bỏ qua)",
      "Mô hình tự động chọn feature quan trọng — feature không cần thiết có trọng số = 0",
      "Cả hai lợi ích trên đều đúng",
      "Không có lợi gì — sparsity là nhược điểm",
    ],
    correct: 2,
    explanation:
      "L1 vừa giúp feature selection (tự động loại feature thừa) vừa giảm chi phí tính toán và bộ nhớ. Đặc biệt hữu ích khi có hàng nghìn features hoặc khi cần mô hình dễ diễn giải.",
  },
  {
    question: "Dropout rate = 0.5 nghĩa là gì?",
    options: [
      "Bỏ 50% trọng số vĩnh viễn",
      "Mỗi bước huấn luyện, 50% nơ-ron bị tắt ngẫu nhiên; bước sau bộ nơ-ron tắt lại khác",
      "Giảm learning rate đi 50%",
      "Chỉ dùng 50% dữ liệu training",
    ],
    correct: 1,
    explanation:
      "Mỗi training step, 50% nơ-ron bị 'tắt' (output = 0). Bước tiếp theo, bộ nơ-ron bị tắt lại khác. Khi inference (model.eval()), TẤT CẢ nơ-ron đều hoạt động và output được chia cho (1-p) để bù (inverted dropout — PyTorch mặc định).",
  },
  {
    question:
      "Weight decay trong Adam/SGD tương đương kỹ thuật regularization nào?",
    options: ["L1 regularization", "L2 regularization", "Dropout", "Batch normalization"],
    correct: 1,
    explanation:
      "Weight decay = nhân trọng số với (1 - λ) mỗi bước, tương đương thêm λ·||w||² vào loss. Đó chính là L2 regularization. Adam + weight decay đúng cách gọi là AdamW (Loshchilov & Hutter 2019). Trong Adam truyền thống, weight decay bị moments rescale và không còn tương đương L2.",
  },
  {
    type: "fill-blank",
    question:
      "Kỹ thuật {blank} (Lasso) thêm λ·Σ|w| vào loss, đẩy trọng số về đúng 0 tạo sparsity. Kỹ thuật {blank} (Ridge) thêm λ·Σw² — thu nhỏ đều tất cả trọng số. {blank} kết hợp cả hai.",
    blanks: [
      { answer: "L1", accept: ["l1", "Lasso", "lasso"] },
      { answer: "L2", accept: ["l2", "Ridge", "ridge"] },
      { answer: "ElasticNet", accept: ["elastic net", "elasticnet", "elastic-net"] },
    ],
    explanation:
      "L1 (Lasso) dùng giá trị tuyệt đối — tạo mô hình thưa, tự động feature selection. L2 (Ridge / weight decay) dùng bình phương — thu nhỏ đều trọng số, hiếm khi về 0. ElasticNet = α·L1 + (1-α)·L2, vừa sparsity vừa stability khi feature tương quan.",
  },
  {
    question:
      "Bạn training ResNet trên ImageNet. Chọn combo regularization hợp lý nhất?",
    options: [
      "Chỉ L1 mạnh (λ=0.1) để tạo model cực thưa",
      "L2 weight decay 1e-4 + Dropout 0.1-0.3 + BatchNorm + Data Augmentation + Early Stopping + Label Smoothing 0.1",
      "Chỉ Dropout 0.9 cực mạnh",
      "Chỉ Early Stopping, không cần gì khác",
    ],
    correct: 1,
    explanation:
      "Công thức chuẩn cho CNN lớn: weight decay + dropout + BN + augmentation + early stop + label smoothing. Mỗi kỹ thuật regularize theo một kênh khác nhau; kết hợp tạo hiệu ứng cộng dồn mà không đánh lệch trade-off.",
  },
  {
    question:
      "Bạn nghi model bị overfit sau 50 epoch. Val loss bắt đầu tăng từ epoch 35. Early stopping với patience=5 sẽ dừng tại epoch nào?",
    options: ["Epoch 35", "Epoch 40", "Epoch 50", "Epoch 30"],
    correct: 1,
    explanation:
      "Patience=5 nghĩa là: nếu val loss không cải thiện trong 5 epoch liên tiếp, dừng. Val loss tăng từ epoch 35, sau 5 epoch liên tiếp không cải thiện → dừng ở epoch 40 và restore weights từ epoch 35 (best).",
  },
  {
    question:
      "BatchNorm có hiệu ứng regularization. Tại sao?",
    options: [
      "Vì nó làm giảm số parameter",
      "Vì statistics (mean, var) được tính trên mini-batch ngẫu nhiên — tạo noise khác batch khác, tương tự Dropout",
      "Vì nó thay thế hoàn toàn L2",
      "Vì nó làm activation luôn bằng 0",
    ],
    correct: 1,
    explanation:
      "BN tính μ và σ trên batch. Batch khác → statistics khác → activation sau BN hơi khác. Đây là noise injection nhẹ (tương tự Dropout nhưng yếu hơn). Đó là lý do khi dùng BN, thường có thể giảm dropout rate.",
  },
  {
    question:
      "Label smoothing với α=0.1 làm gì cho target one-hot [0, 0, 1, 0]?",
    options: [
      "Không đổi, vẫn là [0, 0, 1, 0]",
      "[0.033, 0.033, 0.9, 0.033] — phân bổ 10% xác suất ra các class khác đều nhau",
      "[0, 0, 0.1, 0] — giảm target class",
      "[1, 1, 0, 1] — flip toàn bộ",
    ],
    correct: 1,
    explanation:
      "Label smoothing: y_smooth = (1-α)·y_onehot + α/K với K classes. Với α=0.1, K=4: class đúng = 0.9 + 0.1/4 = 0.925 (hoặc 0.9 tuỳ convention), các class còn lại = 0.1/3 ≈ 0.033. Mục đích: ngăn output quá confident, cải thiện calibration.",
  },
];

/* ──────────────────────────────────────────────────────────────
 * COMPONENT
 * ────────────────────────────────────────────────────────────── */

export default function RegularizationTopic() {
  const [regType, setRegType] = useState<RegType>("none");
  const [strength, setStrength] = useState(0.5);
  const [datasetId, setDatasetId] = useState<Dataset["id"]>("sparse");
  const [dropoutStep, setDropoutStep] = useState(0);

  const weights = useMemo(
    () => applyReg(BASE_WEIGHTS, regType, strength),
    [regType, strength],
  );

  const stats = useMemo(() => {
    const zeros = weights.filter((w) => Math.abs(w) < 0.01).length;
    const avgAbs =
      weights.reduce((s, w) => s + Math.abs(w), 0) / weights.length;
    const maxAbs = Math.max(...weights.map(Math.abs));
    const l2norm = Math.sqrt(weights.reduce((s, w) => s + w * w, 0));
    return { zeros, avgAbs, maxAbs, l2norm };
  }, [weights]);

  // Bar chart geometry
  const barW = 28;
  const gap = 6;
  const startX = 40;
  const maxAbs = 2.5;
  const midY = SVG_H / 2;
  const scale = (SVG_H / 2 - 20) / maxAbs;

  const dataset = useMemo(
    () => DATASETS.find((d) => d.id === datasetId) ?? DATASETS[0],
    [datasetId],
  );

  // Dropout visualization — deterministic pattern per step
  const dropoutMask = useMemo(() => {
    const total = DROPOUT_GRID.rows * DROPOUT_GRID.cols;
    return Array.from({ length: total }, (_, i) => {
      const r = seededNoise(i, dropoutStep + 1);
      return r < 0.4; // 40% tắt
    });
  }, [dropoutStep]);

  const handleRegChange = useCallback((t: RegType) => {
    setRegType(t);
  }, []);

  const handleDropoutStep = useCallback(() => {
    setDropoutStep((s) => (s + 1) % 8);
  }, []);

  return (
    <>
      {/* ──────────────────────────────────────────────────────
       * STEP 1 — PREDICTION GATE
       * ────────────────────────────────────────────────────── */}
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Đội bóng có 1 ngôi sao ghi 90% bàn thắng. Khi ngôi sao chấn thương, đội thua liên tục. Huấn luyện viên nên làm gì?"
          options={[
            "Tìm ngôi sao mới giỏi hơn",
            "Bắt cả đội tập đều nhau, không ai được 'ôm' quá nhiều bóng — ai cũng phải biết ghi bàn",
            "Cho ngôi sao chơi nhiều hơn để bù",
            "Không làm gì — phụ thuộc ngôi sao là bình thường",
          ]}
          correct={1}
          explanation="Buộc mọi cầu thủ đóng góp đều = Regularization! Trong mạng nơ-ron, nó ngăn vài trọng số quá lớn ('ngôi sao') chi phối toàn bộ mô hình."
        >
          <p className="mt-4 text-sm text-muted leading-relaxed">
            Regularization ép mạng &quot;chia sẻ vai trò&quot; đều hơn. Hãy
            xem từng kỹ thuật thay đổi phân bổ trọng số như thế nào khi bạn{" "}
            <strong className="text-foreground">kéo thanh cường độ</strong>,
            và so sánh L1 vs L2 vs ElasticNet trên bài toán sparse vs smooth.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ──────────────────────────────────────────────────────
       * STEP 2 — VISUALIZATION
       * ────────────────────────────────────────────────────── */}
      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-6">
            {/* Type selector */}
            <div>
              <p className="text-xs uppercase tracking-wide text-muted mb-2">
                Chọn kỹ thuật regularization
              </p>
              <div className="flex flex-wrap gap-2">
                {REG_TYPE_ORDER.map((type) => (
                  <button
                    key={type}
                    onClick={() => handleRegChange(type)}
                    className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${
                      regType === type
                        ? "text-white shadow-md"
                        : "bg-card border border-border text-muted hover:text-foreground"
                    }`}
                    style={
                      regType === type
                        ? { backgroundColor: REG_CONFIG[type].color }
                        : {}
                    }
                  >
                    {REG_CONFIG[type].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Strength slider */}
            {regType !== "none" && (
              <div className="space-y-1 max-w-md">
                <label className="text-sm font-medium text-muted">
                  Cường độ (λ / p):{" "}
                  <strong className="text-foreground">
                    {strength.toFixed(2)}
                  </strong>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={strength}
                  onChange={(e) => setStrength(parseFloat(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>
            )}

            {/* Status */}
            <div
              className="rounded-lg p-3 text-center text-sm"
              style={{
                color: REG_CONFIG[regType].color,
                backgroundColor: `${REG_CONFIG[regType].color}15`,
                border: `1px solid ${REG_CONFIG[regType].color}40`,
              }}
            >
              {REG_CONFIG[regType].desc}
            </div>

            {/* Weight bar chart */}
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              className="w-full max-w-xl mx-auto"
              role="img"
              aria-label={`Biểu đồ 12 trọng số với ${REG_CONFIG[regType].label}${regType !== "none" ? `, cường độ ${strength.toFixed(2)}` : ""}. ${weights.filter(w => Math.abs(w) < 0.01).length} trọng số bị đẩy về 0.`}
            >
              <title>{REG_CONFIG[regType].label}{regType !== "none" ? ` λ=${strength.toFixed(2)}` : ""} — {weights.filter(w => Math.abs(w) < 0.01).length}/12 trọng số = 0</title>
              <text
                x={SVG_W / 2}
                y={15}
                textAnchor="middle"
                fill="var(--text-secondary)"
                fontSize="11"
              >
                Phân phối trọng số (12 weights)
              </text>

              <line
                x1={30}
                y1={midY}
                x2={SVG_W - 10}
                y2={midY}
                stroke="#334155"
                strokeWidth="1"
              />
              <text
                x={18}
                y={midY + 4}
                fill="var(--text-tertiary)"
                fontSize="11"
                textAnchor="middle"
              >
                0
              </text>

              {weights.map((w, i) => {
                const x = startX + i * (barW + gap);
                const barHeight = Math.abs(w) * scale;
                const y = w >= 0 ? midY - barHeight : midY;
                const isZero = Math.abs(w) < 0.01;

                return (
                  <g key={`bar-${i}`}>
                    {regType !== "none" && (
                      <rect
                        x={x}
                        y={
                          BASE_WEIGHTS[i] >= 0
                            ? midY - Math.abs(BASE_WEIGHTS[i]) * scale
                            : midY
                        }
                        width={barW}
                        height={Math.abs(BASE_WEIGHTS[i]) * scale}
                        rx={3}
                        fill="#334155"
                        opacity={0.15}
                      />
                    )}

                    <rect
                      x={x}
                      y={y}
                      width={barW}
                      height={Math.max(1, barHeight)}
                      rx={3}
                      fill={isZero ? "#334155" : REG_CONFIG[regType].color}
                      opacity={isZero ? 0.3 : 0.8}
                    />

                    <text
                      x={x + barW / 2}
                      y={SVG_H - 5}
                      textAnchor="middle"
                      fill="var(--text-tertiary)"
                      fontSize="11"
                    >
                      w{i + 1}
                    </text>

                    <text
                      x={x + barW / 2}
                      y={w >= 0 ? y - 4 : y + barHeight + 12}
                      textAnchor="middle"
                      fill={isZero ? "#475569" : "#e2e8f0"}
                      fontSize="11"
                    >
                      {w.toFixed(1)}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 text-center text-xs">
              <div className="rounded-lg bg-background/50 border border-border p-2">
                <p className="text-muted">Trọng số = 0</p>
                <p className="text-lg font-bold text-foreground">
                  {stats.zeros}/{BASE_WEIGHTS.length}
                </p>
              </div>
              <div className="rounded-lg bg-background/50 border border-border p-2">
                <p className="text-muted">Trung bình |w|</p>
                <p className="text-lg font-bold text-foreground">
                  {stats.avgAbs.toFixed(3)}
                </p>
              </div>
              <div className="rounded-lg bg-background/50 border border-border p-2">
                <p className="text-muted">Max |w|</p>
                <p className="text-lg font-bold text-foreground">
                  {stats.maxAbs.toFixed(3)}
                </p>
              </div>
              <div className="rounded-lg bg-background/50 border border-border p-2">
                <p className="text-muted">‖w‖₂</p>
                <p className="text-lg font-bold text-foreground">
                  {stats.l2norm.toFixed(3)}
                </p>
              </div>
            </div>

            {/* L1 vs L2 vs ElasticNet on sparse vs smooth */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  L1 vs L2 vs ElasticNet — sparse vs smooth
                </p>
                <div className="flex gap-2">
                  {DATASETS.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDatasetId(d.id)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors ${
                        datasetId === d.id
                          ? "bg-accent text-white"
                          : "bg-background border border-border text-muted hover:text-foreground"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-muted">{dataset.description}</p>

              <div className="grid grid-cols-3 gap-3">
                {(["l1", "l2", "elasticnet"] as const).map((t) => {
                  const w = applyReg(dataset.trueWeights, t, 0.6);
                  const info = REG_CONFIG[t];
                  const err = dataset.trueWeights.reduce(
                    (s, tw, i) => s + (tw - w[i]) ** 2,
                    0,
                  );
                  const rmse = Math.sqrt(err / dataset.trueWeights.length);
                  const nonZero = w.filter((v) => Math.abs(v) > 0.01).length;
                  return (
                    <div
                      key={t}
                      className="rounded-lg border p-2"
                      style={{
                        borderColor: `${info.color}55`,
                        backgroundColor: `${info.color}08`,
                      }}
                    >
                      <p
                        className="text-xs font-semibold"
                        style={{ color: info.color }}
                      >
                        {info.label}
                      </p>
                      <div className="mt-2 flex gap-0.5 h-12 items-end">
                        {w.map((v, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-sm"
                            style={{
                              height: `${(Math.abs(v) / 2.5) * 100}%`,
                              backgroundColor:
                                Math.abs(v) < 0.01 ? "#33415555" : info.color,
                              opacity: 0.8,
                            }}
                            title={`w${i + 1} = ${v.toFixed(2)}`}
                          />
                        ))}
                      </div>
                      <div className="mt-2 flex justify-between text-[10px] text-muted">
                        <span>
                          Non-zero:{" "}
                          <strong className="text-foreground">
                            {nonZero}
                          </strong>
                        </span>
                        <span>
                          RMSE:{" "}
                          <strong className="text-foreground">
                            {rmse.toFixed(2)}
                          </strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted">
                {datasetId === "sparse" ? (
                  <>
                    Bài toán <strong>sparse</strong>: L1 thắng nhờ đẩy đúng các
                    feature thừa về 0. L2 thu nhỏ mọi thứ đều nên{" "}
                    <em>không loại được feature nào</em>.
                  </>
                ) : (
                  <>
                    Bài toán <strong>smooth</strong>: L2 thắng nhờ giữ lại mọi
                    đóng góp nhỏ. L1 đẩy nhiều feature về 0, mất thông tin hữu
                    ích.
                  </>
                )}
              </p>
            </div>

            {/* Dropout visualization — neuron grid */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  Dropout visualization — nơ-ron bị tắt ngẫu nhiên mỗi bước
                </p>
                <button
                  type="button"
                  onClick={handleDropoutStep}
                  className="text-xs font-semibold px-3 py-1.5 rounded-md bg-accent text-white hover:bg-accent/90"
                >
                  Bước tiếp theo →
                </button>
              </div>
              <p className="text-[11px] text-muted">
                Bước training: <strong>{dropoutStep + 1}</strong> · p = 0.4 ·
                mỗi bước bộ nơ-ron bị tắt lại khác.
              </p>
              <svg
                viewBox={`0 0 ${DROPOUT_GRID.cols * 50} ${DROPOUT_GRID.rows * 50 + 20}`}
                className="w-full max-w-sm mx-auto"
              >
                {Array.from({ length: DROPOUT_GRID.rows }).map((_, r) =>
                  Array.from({ length: DROPOUT_GRID.cols }).map((__, c) => {
                    const idx = r * DROPOUT_GRID.cols + c;
                    const dropped = dropoutMask[idx];
                    const cx = c * 50 + 25;
                    const cy = r * 50 + 25;
                    return (
                      <g key={`${r}-${c}`}>
                        <circle
                          cx={cx}
                          cy={cy}
                          r={18}
                          fill={dropped ? "#33415540" : "#f59e0b"}
                          stroke={dropped ? "#475569" : "#f59e0b"}
                          strokeWidth={2}
                          opacity={dropped ? 0.4 : 0.9}
                        />
                        <text
                          x={cx}
                          y={cy + 3}
                          textAnchor="middle"
                          fontSize={11}
                          fill={dropped ? "#64748b" : "white"}
                          fontWeight="bold"
                        >
                          {dropped ? "OFF" : "ON"}
                        </text>
                      </g>
                    );
                  }),
                )}
              </svg>
              <p className="text-[11px] text-muted">
                Khi <strong>inference</strong>, TẤT CẢ nơ-ron đều bật. Output
                được scale (inverted dropout trong PyTorch: scale ÷ (1-p) ở
                train time, không làm gì ở eval time).
              </p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ──────────────────────────────────────────────────────
       * STEP 3 — AHA MOMENT
       * ────────────────────────────────────────────────────── */}
      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>Regularization</strong> là cách nói &quot;đừng quá phức
            tạp&quot; với mạng nơ-ron. L1 loại bỏ trọng số thừa (cắt cầu thủ
            dự bị), L2 chia đều vai trò (ai cũng chơi), Dropout cho{" "}
            <em>nghỉ phép ngẫu nhiên</em> (đội mạnh ở mọi đội hình). BatchNorm
            chuẩn hoá áp lực, Data Augmentation mở rộng sân tập, Early
            Stopping gọi về khi đội bắt đầu mệt, Label Smoothing nhắc cầu thủ{" "}
            <em>đừng quá tự tin</em>.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ──────────────────────────────────────────────────────
       * STEP 4 — INLINE CHALLENGE 1
       * ────────────────────────────────────────────────────── */}
      <LessonSection step={4} totalSteps={8} label="Thử thách 1">
        <InlineChallenge
          question="Bạn dùng Dropout(0.5) khi huấn luyện. Khi deploy mô hình cho người dùng (inference), Dropout hoạt động thế nào?"
          options={[
            "Vẫn tắt ngẫu nhiên 50% nơ-ron — giống lúc train",
            "TẤT CẢ nơ-ron hoạt động; trong inverted dropout (PyTorch default), output đã được scale sẵn ở train nên eval không cần làm gì",
            "Tắt 50% nơ-ron cố định (không ngẫu nhiên nữa)",
            "Toàn bộ model phải retrain",
          ]}
          correct={1}
          explanation="Khi inference (model.eval()), Dropout TẮT — mọi nơ-ron đều chạy. PyTorch dùng inverted dropout: ở train, output của neuron CÒN LẠI nhân với 1/(1-p); ở eval, không làm gì. Điều này đảm bảo expected output khớp giữa train và eval."
        />
      </LessonSection>

      {/* ──────────────────────────────────────────────────────
       * STEP 5 — EXPLANATION
       * ────────────────────────────────────────────────────── */}
      <LessonSection step={5} totalSteps={8} label="Giải thích chi tiết">
        <ExplanationSection topicSlug={metadata.slug}>
          <p>
            <strong>Regularization</strong> là tập hợp kỹ thuật thêm{" "}
            <em>ràng buộc</em> vào quá trình huấn luyện để ngăn mô hình học
            quá sát với dữ liệu train (overfitting). Nguyên lý chung: đánh
            đổi một chút bias lấy rất nhiều variance giảm — theo lý thuyết{" "}
            <TopicLink slug="overfitting-underfitting">
              bias-variance tradeoff
            </TopicLink>
            . Công thức tổng quát:
          </p>

          <LaTeX block>
            {
              "L_{\\text{total}}(\\theta) = L_{\\text{data}}(\\theta) + \\lambda \\cdot R(\\theta)"
            }
          </LaTeX>

          <p className="text-sm text-muted">
            Trong đó <LaTeX>{"L_{\\text{data}}"}</LaTeX> là loss chính (MSE,
            cross-entropy…), <LaTeX>{"R(\\theta)"}</LaTeX> là regularizer, và{" "}
            <LaTeX>{"\\lambda"}</LaTeX> điều khiển cường độ. Các kỹ thuật khác
            nhau = các lựa chọn khác nhau cho <LaTeX>{"R"}</LaTeX> hoặc cách
            chèn nó vào pipeline training.
          </p>

          <p>
            <strong>L1 Regularization (Lasso):</strong>
          </p>
          <LaTeX block>
            {
              "R_{L1}(\\theta) = \\sum_{i} |w_i|, \\quad L = L_{\\text{data}} + \\lambda \\sum_{i}|w_i|"
            }
          </LaTeX>
          <p className="text-sm text-muted">
            Gradient của <LaTeX>{"|w|"}</LaTeX> là{" "}
            <LaTeX>{"\\text{sign}(w)"}</LaTeX> — không phụ thuộc độ lớn. Điều
            này tạo áp lực <strong>cố định</strong> đẩy mọi trọng số về 0, kể
            cả trọng số nhỏ. Kết quả: sparsity (nhiều <LaTeX>{"w_i = 0"}</LaTeX>
            ), mô hình tự động{" "}
            <em>feature selection</em>. Cập nhật có dạng soft-thresholding:
          </p>
          <LaTeX block>
            {
              "w \\leftarrow \\text{sign}(w) \\cdot \\max(|w| - \\eta\\lambda, 0)"
            }
          </LaTeX>

          <p>
            <strong>L2 Regularization (Ridge / Weight Decay):</strong>
          </p>
          <LaTeX block>
            {
              "R_{L2}(\\theta) = \\frac{1}{2}\\sum_{i} w_i^2, \\quad L = L_{\\text{data}} + \\frac{\\lambda}{2} \\sum_{i}w_i^2"
            }
          </LaTeX>
          <p className="text-sm text-muted">
            Gradient của <LaTeX>{"\\tfrac{1}{2}w^2"}</LaTeX> là{" "}
            <LaTeX>{"w"}</LaTeX> — càng lớn càng bị kéo. Cập nhật có dạng
            multiplicative decay:
          </p>
          <LaTeX block>
            {"w \\leftarrow w(1 - \\eta\\lambda) - \\eta \\nabla L_{\\text{data}}"}
          </LaTeX>
          <p className="text-sm text-muted">
            Thu nhỏ tất cả trọng số đều nhưng hiếm khi về 0 → phân bổ đều vai
            trò. Đây là kỹ thuật phổ biến nhất trong thực tế vì easy to tune
            và tương thích với mọi optimizer. AdamW (Adam + decoupled weight
            decay) là lựa chọn mặc định hiện đại.
          </p>

          <p>
            <strong>ElasticNet (L1 + L2):</strong>
          </p>
          <LaTeX block>
            {
              "R_{EN}(\\theta) = \\alpha \\sum_i |w_i| + (1-\\alpha) \\frac{1}{2} \\sum_i w_i^2"
            }
          </LaTeX>
          <p className="text-sm text-muted">
            Kết hợp sparsity của L1 với stability của L2. Đặc biệt hữu ích khi
            feature có tương quan: L1 một mình có xu hướng chọn ngẫu nhiên 1
            trong nhóm feature tương quan và loại các feature còn lại;
            ElasticNet giữ cả nhóm và thu nhỏ đều.
          </p>

          <Callout variant="insight" title="L1 vs L2 vs ElasticNet — khi nào dùng cái nào">
            <div className="space-y-1.5">
              <p>
                <strong>Sparse problem:</strong> chỉ 1 phần nhỏ feature thực sự
                quan trọng → <strong>L1</strong> ăn điểm (feature selection
                tự động). VD: genomics (hàng chục nghìn gene, chỉ vài chục
                quan trọng), text classification (hàng triệu n-gram).
              </p>
              <p>
                <strong>Smooth problem:</strong> mọi feature đóng góp nhỏ
                nhưng đều → <strong>L2</strong> ăn điểm (phân bổ đều). VD:
                image classification với CNN (mỗi weight đóng góp nhỏ vào
                feature detector), nhiều bài toán deep learning chuẩn.
              </p>
              <p>
                <strong>Correlated features:</strong> nhóm feature tương quan
                (ví dụ nhiều biến đo cùng một hiện tượng) →{" "}
                <strong>ElasticNet</strong>. L1 một mình chỉ giữ 1 trong nhóm
                (arbitrary), ElasticNet giữ cả nhóm nhờ L2 stabilize.
              </p>
            </div>
          </Callout>

          <p>
            <strong>Dropout:</strong>
          </p>
          <LaTeX block>
            {
              "h^{(l)}_{\\text{train}} = m \\odot h^{(l)}, \\quad m_i \\sim \\text{Bernoulli}(1-p)"
            }
          </LaTeX>
          <p className="text-sm text-muted">
            Mỗi forward pass ở train, mask ngẫu nhiên{" "}
            <LaTeX>{"m"}</LaTeX> được sample — <LaTeX>{"p"}</LaTeX> phần nơ-ron
            bị tắt (output = 0). Ở inference, mọi nơ-ron bật. Để expected
            output khớp, PyTorch dùng <em>inverted dropout</em>: chia cho{" "}
            <LaTeX>{"(1-p)"}</LaTeX> ở train thay vì nhân ở eval. Dropout
            tương đương trung bình cộng của <LaTeX>{"2^n"}</LaTeX> mạng con —
            một dạng <em>model averaging</em> cực lớn và rẻ.
          </p>

          <p>
            <strong>DropConnect:</strong> Thay vì tắt neuron (output), tắt
            connection (weight). Mask áp dụng lên{" "}
            <LaTeX>{"W"}</LaTeX> thay vì lên activation. Tổng quát hơn Dropout
            nhưng tốn memory hơn vì mỗi connection cần mask riêng. Trong thực
            tế hiếm dùng vì Dropout đơn giản và đủ tốt.
          </p>

          <p>
            <strong>BatchNorm như regularizer:</strong>{" "}
            <TopicLink slug="batch-normalization">BatchNorm</TopicLink>{" "}
            chuẩn hoá activation theo batch để giảm internal covariate shift.
            Hiệu ứng regularization đến từ việc{" "}
            <LaTeX>{"\\mu_B, \\sigma_B"}</LaTeX> được tính trên batch ngẫu
            nhiên — batch khác cho statistics hơi khác, tạo noise injection
            nhẹ vào mỗi forward pass. Đây là dropout-like noise, nên thường
            khi dùng BN có thể giảm dropout rate.
          </p>

          <p>
            <strong>Data Augmentation:</strong> Tăng số lượng training sample
            bằng biến đổi bảo toàn label:
          </p>
          <LaTeX block>
            {
              "\\tilde{x} = T(x), \\quad T \\in \\mathcal{T}_{\\text{invariance}}"
            }
          </LaTeX>
          <p className="text-sm text-muted">
            Với ảnh: flip, crop, rotate, color jitter, cutout, mixup, CutMix.
            Với audio: pitch shift, time stretch, SpecAugment. Với text:
            synonym replacement, back-translation. Đây có thể là kỹ thuật
            regularization MẠNH nhất — với coverage data đủ, nhiều khi không
            cần L2 hoặc dropout.
          </p>

          <p>
            <strong>Early Stopping:</strong>{" "}
          </p>
          <LaTeX block>
            {
              "\\theta^* = \\theta_t \\text{ where } t = \\arg\\min_{t} L_{\\text{val}}(\\theta_t)"
            }
          </LaTeX>
          <p className="text-sm text-muted">
            Theo dõi val loss mỗi epoch; dừng train khi val loss không giảm
            nữa (với patience). Về mặt lý thuyết, early stopping tương đương
            L2 implicit — train time giới hạn = capacity giới hạn.
          </p>

          <p>
            <strong>Label Smoothing:</strong> Thay vì target one-hot cứng,
            dùng target mềm:
          </p>
          <LaTeX block>
            {
              "y^{\\text{smooth}}_k = (1-\\alpha) \\cdot y^{\\text{onehot}}_k + \\frac{\\alpha}{K}"
            }
          </LaTeX>
          <p className="text-sm text-muted">
            Với <LaTeX>{"K"}</LaTeX> classes và{" "}
            <LaTeX>{"\\alpha \\approx 0.1"}</LaTeX>. Ngăn output quá confident
            (logit → ∞), cải thiện calibration và generalization. Phổ biến
            trong CV (ResNet, Vision Transformer) và NLP (Transformer). Khi
            dùng cross-entropy với one-hot target, model có xu hướng đẩy logit
            về ±∞ để gradient đạt 0 — điều này không ổn định trong finite
            precision.
          </p>

          <Callout variant="insight" title="Bảng tổng hợp — các kỹ thuật và khi nào dùng">
            <div className="space-y-1 text-sm">
              <p>
                <strong>L1:</strong> sparse problem, feature selection, mô
                hình cần interpretable.
              </p>
              <p>
                <strong>L2 / Weight Decay:</strong> mặc định cho mọi deep
                model. Luôn dùng (λ ≈ 1e-4 đến 1e-2).
              </p>
              <p>
                <strong>ElasticNet:</strong> feature có tương quan cao (ví dụ
                statistics, biomedical).
              </p>
              <p>
                <strong>Dropout:</strong> fully-connected layer, RNN. Ít dùng
                cho CNN sau khi có BN.
              </p>
              <p>
                <strong>DropConnect:</strong> hiếm trong thực tế; dùng khi
                Dropout không đủ và bạn muốn noise chi tiết hơn.
              </p>
              <p>
                <strong>BatchNorm:</strong> mặc định cho CNN. LayerNorm cho
                Transformer/RNN.
              </p>
              <p>
                <strong>Data Augmentation:</strong> luôn dùng khi có thể —
                mạnh nhất trong CV.
              </p>
              <p>
                <strong>Early Stopping:</strong> luôn dùng — rẻ, an toàn.
              </p>
              <p>
                <strong>Label Smoothing:</strong> classification với nhiều
                class, giúp calibration.
              </p>
            </div>
          </Callout>

          <CodeBlock language="python" title="regularization_full.py">
{`import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader
from torchvision import transforms

# ───────────────────────────────────────────────────────────────
# 1) L2 weight decay: thêm vào optimizer
#    (Adam + weight decay đúng cách = AdamW — decoupled WD)
# ───────────────────────────────────────────────────────────────
optimizer = torch.optim.AdamW(
    model.parameters(),
    lr=1e-3,
    weight_decay=1e-4,  # λ cho L2
)

# ───────────────────────────────────────────────────────────────
# 2) L1 regularization: thêm thủ công vào loss
# ───────────────────────────────────────────────────────────────
def l1_penalty(model, lambda_l1=1e-5):
    return lambda_l1 * sum(
        p.abs().sum() for p in model.parameters() if p.requires_grad
    )

# training loop:
loss = criterion(output, target) + l1_penalty(model)

# ───────────────────────────────────────────────────────────────
# 3) ElasticNet: kết hợp L1 + L2
# ───────────────────────────────────────────────────────────────
def elastic_penalty(model, l1=1e-5, l2=1e-4, alpha=0.5):
    l1_term = sum(p.abs().sum() for p in model.parameters())
    l2_term = sum((p ** 2).sum() for p in model.parameters())
    return alpha * l1 * l1_term + (1 - alpha) * l2 * l2_term

# ───────────────────────────────────────────────────────────────
# 4) Dropout + BatchNorm trong model definition
# ───────────────────────────────────────────────────────────────
model = nn.Sequential(
    nn.Linear(784, 256),
    nn.BatchNorm1d(256),   # BN trước activation
    nn.ReLU(),
    nn.Dropout(0.3),       # tắt 30% sau activation
    nn.Linear(256, 128),
    nn.BatchNorm1d(128),
    nn.ReLU(),
    nn.Dropout(0.3),
    nn.Linear(128, 10),
)

# Quan trọng: bật/tắt Dropout và BN khi train/eval
model.train()  # Dropout ON, BN dùng batch stats
model.eval()   # Dropout OFF, BN dùng running stats

# ───────────────────────────────────────────────────────────────
# 5) Data Augmentation (torchvision)
# ───────────────────────────────────────────────────────────────
train_transform = transforms.Compose([
    transforms.RandomResizedCrop(224),
    transforms.RandomHorizontalFlip(),
    transforms.ColorJitter(0.4, 0.4, 0.4),
    transforms.RandomRotation(15),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225]),
    transforms.RandomErasing(p=0.25),  # Cutout
])

# Mixup (trong training loop)
def mixup_data(x, y, alpha=0.2):
    lam = torch.distributions.Beta(alpha, alpha).sample().item()
    idx = torch.randperm(x.size(0))
    mixed_x = lam * x + (1 - lam) * x[idx]
    y_a, y_b = y, y[idx]
    return mixed_x, y_a, y_b, lam`}
          </CodeBlock>

          <CodeBlock language="python" title="early_stopping_label_smoothing.py">
{`# ───────────────────────────────────────────────────────────────
# 6) Early Stopping helper
# ───────────────────────────────────────────────────────────────
class EarlyStopping:
    def __init__(self, patience=7, min_delta=0.0, restore_best=True):
        self.patience = patience
        self.min_delta = min_delta
        self.restore_best = restore_best
        self.counter = 0
        self.best_loss = float("inf")
        self.best_state = None
        self.should_stop = False

    def step(self, val_loss, model):
        if val_loss < self.best_loss - self.min_delta:
            self.best_loss = val_loss
            self.counter = 0
            if self.restore_best:
                self.best_state = {
                    k: v.detach().clone()
                    for k, v in model.state_dict().items()
                }
        else:
            self.counter += 1
            if self.counter >= self.patience:
                self.should_stop = True
                if self.restore_best and self.best_state is not None:
                    model.load_state_dict(self.best_state)

# Usage:
stopper = EarlyStopping(patience=5)
for epoch in range(100):
    train_one_epoch(model, train_loader, optimizer)
    val_loss = evaluate(model, val_loader)
    stopper.step(val_loss, model)
    if stopper.should_stop:
        print(f"Early stopping at epoch {epoch}")
        break

# ───────────────────────────────────────────────────────────────
# 7) Label Smoothing
# ───────────────────────────────────────────────────────────────
# Cách 1 — có sẵn trong PyTorch 1.10+
criterion = nn.CrossEntropyLoss(label_smoothing=0.1)

# Cách 2 — tự viết (dùng được cho custom loss)
def smooth_cross_entropy(logits, target, smoothing=0.1):
    n_classes = logits.size(-1)
    log_probs = F.log_softmax(logits, dim=-1)
    # target one-hot
    with torch.no_grad():
        true_dist = torch.zeros_like(log_probs)
        true_dist.fill_(smoothing / (n_classes - 1))
        true_dist.scatter_(1, target.unsqueeze(1), 1 - smoothing)
    return -(true_dist * log_probs).sum(dim=-1).mean()

# ───────────────────────────────────────────────────────────────
# 8) DropConnect (không có trong PyTorch — tự implement)
# ───────────────────────────────────────────────────────────────
class DropConnectLinear(nn.Module):
    def __init__(self, in_features, out_features, p=0.3):
        super().__init__()
        self.linear = nn.Linear(in_features, out_features)
        self.p = p

    def forward(self, x):
        if self.training and self.p > 0:
            mask = torch.bernoulli(
                torch.full_like(self.linear.weight, 1 - self.p)
            )
            W = self.linear.weight * mask / (1 - self.p)  # inverted
            return F.linear(x, W, self.linear.bias)
        return self.linear(x)`}
          </CodeBlock>

          <Callout variant="tip" title="Combo chống overfitting phổ biến nhất">
            <p>
              <strong>L2 (AdamW weight_decay=1e-4) + Dropout(0.1-0.3) + BatchNorm + Data Augmentation + Early Stopping + Label Smoothing(0.1)</strong>{" "}
              là {'"'}six-pack{'"'} tiêu chuẩn cho CNN/Transformer lớn. Mỗi kỹ
              thuật regularize theo một kênh khác nhau (weight magnitude,
              activation noise, input diversity, training time, output
              sharpness) — chúng KHÔNG thay thế nhau, mà hỗ trợ nhau.
            </p>
          </Callout>

          <Callout variant="info" title="Khi nào regularization không đủ">
            <div className="space-y-1">
              <p>
                Nếu val loss vẫn cao hơn train loss nhiều (overfit nặng) dù đã
                dùng đủ kỹ thuật, nguyên nhân thường là:
              </p>
              <p>
                1. <strong>Data không đủ</strong> — đi thu thập thêm, đó là
                {" "}&quot;regularization&quot; mạnh nhất.
              </p>
              <p>
                2. <strong>Model quá lớn</strong> — giảm depth/width; không
                phải bài toán nào cũng cần ResNet-152.
              </p>
              <p>
                3. <strong>Data leakage</strong> — val set bị rò rỉ vào train
                (duplicates, feature lookahead).
              </p>
              <p>
                4. <strong>Distribution mismatch</strong> — train và val/test
                không cùng distribution; regularization không sửa được.
              </p>
            </div>
          </Callout>

          <CollapsibleDetail title="Đi sâu — Tại sao L1 tạo sparsity còn L2 thì không?">
            <div className="space-y-3 text-sm">
              <p>
                Xét optimization với constraint (dạng Lagrangian tương đương
                với thêm penalty):
              </p>
              <LaTeX block>
                {
                  "\\min_w L_{\\text{data}}(w) \\quad \\text{s.t. } \\|w\\|_p \\leq t"
                }
              </LaTeX>
              <p>
                Với <LaTeX>{"p=1"}</LaTeX> (L1), constraint set là hình vuông
                xoay (diamond) trong 2D. Với <LaTeX>{"p=2"}</LaTeX> (L2),
                constraint set là hình tròn. Nghiệm tối ưu nằm ở điểm tiếp xúc
                giữa contour của <LaTeX>{"L_{\\text{data}}"}</LaTeX> và
                constraint set.
              </p>
              <p>
                Diamond có <strong>đỉnh (corner)</strong> trên các trục toạ độ
                — đó là nơi một số <LaTeX>{"w_i = 0"}</LaTeX>. Khi contour của
                loss tiếp xúc với diamond, xác suất cao tiếp xúc ở corner →
                sparsity. Hình tròn không có corner → tiếp xúc ở bất kỳ điểm
                nào, thường không có <LaTeX>{"w_i = 0"}</LaTeX>.
              </p>
              <p>
                Nhìn từ gradient: <LaTeX>{"\\partial |w| / \\partial w"}</LaTeX>{" "}
                là <LaTeX>{"\\text{sign}(w)"}</LaTeX> (hằng số ±1) — lực đẩy
                không đổi dù <LaTeX>{"w"}</LaTeX> nhỏ. Trái lại,{" "}
                <LaTeX>{"\\partial w^2 / \\partial w = 2w"}</LaTeX> — lực đẩy
                giảm tuyến tính. Khi <LaTeX>{"w"}</LaTeX> nhỏ, L1 vẫn đẩy bằng
                lực cũ nên đưa về 0; L2 chỉ đẩy nhẹ nên dừng ở số nhỏ khác 0.
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="Đi sâu — Dropout là Bayesian approximation">
            <div className="space-y-3 text-sm">
              <p>
                Gal & Ghahramani (2016) chứng minh: một mạng với Dropout áp
                dụng trước mỗi weight layer, được train với L2, xấp xỉ{" "}
                <em>variational inference</em> trong Bayesian neural network
                với prior Gaussian.
              </p>
              <p>
                Từ góc nhìn này, Dropout không chỉ là trick — nó là một phép
                gần đúng của{" "}
                <LaTeX>{"p(y | x) = \\int p(y | x, \\theta) p(\\theta | D) d\\theta"}</LaTeX>
                . Hệ quả:
              </p>
              <LaTeX block>
                {
                  "\\hat{y}_{\\text{MC}} = \\frac{1}{T}\\sum_{t=1}^{T} f_{\\theta \\sim \\text{dropout}}(x)"
                }
              </LaTeX>
              <p>
                Nếu giữ Dropout BẬT ở inference và chạy nhiều pass (Monte
                Carlo Dropout), ta được <em>uncertainty estimate</em>: variance
                giữa các pass phản ánh model uncertainty. Đây là kỹ thuật rẻ
                và dễ deploy cho predictive uncertainty, đặc biệt trong
                medical AI và active learning.
              </p>
              <p>
                Tuy nhiên, MC Dropout không thay thế được Bayesian đầy đủ —
                chỉ approximate một họ prior cụ thể. Khi cần uncertainty
                chất lượng cao, nên dùng Deep Ensembles hoặc SWAG.
              </p>
            </div>
          </CollapsibleDetail>

          <Callout variant="info" title="Ứng dụng thực tế">
            <div className="space-y-1">
              <p>
                <strong>Computer Vision:</strong> ResNet/ViT dùng combo weight
                decay 1e-4 + label smoothing 0.1 + heavy augmentation
                (RandAugment, Mixup, CutMix). Dropout ít dùng ở CNN hiện đại
                (BN thay thế phần lớn), nhưng ViT vẫn dùng Dropout trong
                attention và MLP.
              </p>
              <p>
                <strong>NLP:</strong> Transformer dùng dropout 0.1 ở attention
                và feedforward, label smoothing trong seq2seq, weight decay
                0.01-0.1, early stopping theo dev metric.
              </p>
              <p>
                <strong>Tabular:</strong> L1/L2 là công cụ chính (scikit-learn
                LogisticRegression, Ridge, Lasso). XGBoost/LightGBM có{" "}
                <code>reg_alpha</code>, <code>reg_lambda</code> tương ứng L1,
                L2 trên leaf weights.
              </p>
              <p>
                <strong>Tiếng Việt:</strong> VinAI khi train PhoBERT dùng
                weight decay 0.01, dropout 0.1, data augmentation bằng back-
                translation (Việt → Anh → Việt).
              </p>
            </div>
          </Callout>

          <Callout variant="warning" title="Pitfalls — sai lầm phổ biến">
            <div className="space-y-1">
              <p>
                <strong>Regularize BN params:</strong> Không nên weight decay
                các tham số <LaTeX>{"\\gamma, \\beta"}</LaTeX> của BatchNorm
                hay LayerNorm — dùng param group riêng với wd=0.
              </p>
              <p>
                <strong>Dropout trước softmax:</strong> Không. Dropout ở output
                layer làm mất thông tin probabilistic. Đặt dropout ở hidden
                layer.
              </p>
              <p>
                <strong>Quên model.eval():</strong> Rất phổ biến — inference
                với dropout bật = output ngẫu nhiên, accuracy giảm vô lý.
              </p>
              <p>
                <strong>Dùng L1 mạnh khi features không sparse:</strong> L1
                loại bỏ cả feature quan trọng nếu chúng đóng góp nhỏ.
              </p>
              <p>
                <strong>Early stopping không restore best:</strong> Dừng ở
                epoch N nhưng không restore weights ở epoch best → mất toàn bộ
                lợi ích.
              </p>
              <p>
                <strong>Tăng dropout khi underfit:</strong> Dropout giảm
                capacity. Nếu model chưa học đủ (train loss cao), dropout sẽ
                làm tệ hơn.
              </p>
            </div>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ──────────────────────────────────────────────────────
       * STEP 6 — INLINE CHALLENGE 2
       * ────────────────────────────────────────────────────── */}
      <LessonSection step={6} totalSteps={8} label="Thử thách 2">
        <InlineChallenge
          question="Bạn có 100 features nhưng nghi ngờ chỉ 10 features thực sự hữu ích. Nên dùng regularization nào?"
          options={[
            "L2 — thu nhỏ tất cả đều nhau",
            "L1 (Lasso) — tự động đẩy 90 features thừa về trọng số = 0, giữ lại ~10 quan trọng (feature selection)",
            "Dropout — tắt ngẫu nhiên features",
            "Chỉ Early Stopping",
          ]}
          correct={1}
          explanation="L1 tạo sparsity: features không quan trọng có trọng số = 0. Đây chính là lý do L1 còn gọi là Lasso (Least Absolute Shrinkage and Selection Operator). Nếu features có tương quan cao, cân nhắc ElasticNet (L1+L2) để giữ cả nhóm feature tương quan thay vì chọn ngẫu nhiên 1."
        />
      </LessonSection>

      {/* ──────────────────────────────────────────────────────
       * STEP 7 — MINI SUMMARY
       * ────────────────────────────────────────────────────── */}
      <LessonSection step={7} totalSteps={8} label="Tóm tắt">
        <MiniSummary
          title="Regularization — Điểm chốt"
          points={[
            "Regularization = thêm ràng buộc vào quá trình train để ngăn overfitting, đánh đổi ít bias lấy nhiều variance giảm.",
            "L1 (Lasso): sparse, feature selection. L2 (Ridge/weight decay): smooth, mặc định. ElasticNet: kết hợp khi feature có tương quan.",
            "Dropout: tắt ngẫu nhiên p% nơ-ron khi train, mọi nơ-ron bật khi inference. DropConnect: tắt weight thay vì neuron.",
            "BatchNorm có hiệu ứng regularization nhẹ nhờ noise từ batch statistics. Data Augmentation là regularization MẠNH nhất qua input.",
            "Early Stopping dừng train khi val loss tăng — tương đương L2 implicit. Label Smoothing ngăn output quá confident, cải thiện calibration.",
            "Combo chuẩn: AdamW(wd=1e-4) + Dropout(0.1-0.3) + BN + Augmentation + EarlyStopping + LabelSmoothing(0.1) — các kỹ thuật hỗ trợ chứ không thay thế nhau.",
          ]}
        />
      </LessonSection>

      {/* ──────────────────────────────────────────────────────
       * STEP 8 — QUIZ
       * ────────────────────────────────────────────────────── */}
      <LessonSection step={8} totalSteps={8} label="Kiểm tra">
        <QuizSection questions={QUIZ_QUESTIONS} />
      </LessonSection>
    </>
  );
}
