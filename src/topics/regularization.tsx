"use client";

import { useState, useMemo } from "react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
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

/* ---------- helpers ---------- */
type RegType = "none" | "l1" | "l2" | "dropout";

const BASE_WEIGHTS = [
  0.8, -1.2, 0.3, 2.1, -0.5, 0.9, -1.8, 0.1, 1.5, -0.7, 0.4, 1.1,
];

const REG_CONFIG: Record<
  RegType,
  { label: string; color: string; desc: string }
> = {
  none: {
    label: "Không regularization",
    color: "#64748b",
    desc: "Trọng số tự do — dễ overfitting",
  },
  l1: {
    label: "L1 (Lasso)",
    color: "#3b82f6",
    desc: "Đẩy trọng số về 0 — tạo sparsity (nhiều trọng số = 0)",
  },
  l2: {
    label: "L2 (Ridge)",
    color: "#22c55e",
    desc: "Thu nhỏ tất cả trọng số đều — phân bổ đều vai trò",
  },
  dropout: {
    label: "Dropout",
    color: "#f59e0b",
    desc: "Tắt ngẫu nhiên nơ-ron — buộc mạng không phụ thuộc 1 nơ-ron",
  },
};

const SVG_W = 460;
const SVG_H = 210;

/* ---------- main component ---------- */
export default function RegularizationTopic() {
  const [regType, setRegType] = useState<RegType>("none");
  const [strength, setStrength] = useState(0.5);

  // Compute regularized weights (deterministic for dropout using seed)
  const weights = useMemo(() => {
    return BASE_WEIGHTS.map((w, i) => {
      if (regType === "none") return w;
      if (regType === "l1") {
        const shrink = strength * 0.8;
        if (Math.abs(w) < shrink) return 0;
        return w > 0 ? w - shrink : w + shrink;
      }
      if (regType === "l2") {
        return w * (1 - strength * 0.4);
      }
      // Dropout: deterministic pattern based on strength
      const dropThreshold = strength * 0.6;
      // Use a simple hash to get deterministic "random" per weight
      const hash = Math.abs(Math.sin(i * 7.3 + 0.5));
      return hash < dropThreshold ? 0 : w;
    });
  }, [regType, strength]);

  // Stats
  const stats = useMemo(() => {
    const zeros = weights.filter((w) => Math.abs(w) < 0.01).length;
    const avgAbs =
      weights.reduce((s, w) => s + Math.abs(w), 0) / weights.length;
    const maxAbs = Math.max(...weights.map(Math.abs));
    return { zeros, avgAbs, maxAbs };
  }, [weights]);

  // Bar chart dimensions
  const barW = 28;
  const gap = 6;
  const startX = 40;
  const maxAbs = 2.5;
  const midY = SVG_H / 2;
  const scale = (SVG_H / 2 - 20) / maxAbs;

  /* Quiz */
  const quizQuestions: QuizQuestion[] = [
    {
      question:
        "L1 regularization tạo ra trọng số thưa (sparse). Điều này có lợi gì?",
      options: [
        "Mô hình chạy nhanh hơn vì nhiều trọng số = 0 (phép nhân bằng 0 bỏ qua)",
        "Mô hình tự động chọn feature quan trọng — feature không cần thiết có trọng số = 0",
        "Cả A và B đều đúng",
        "Không có lợi gì — sparsity là nhược điểm",
      ],
      correct: 2,
      explanation:
        "L1 vừa giúp feature selection (tự động loại feature thừa) vừa giảm chi phí tính toán. Đặc biệt hữu ích khi có hàng nghìn features.",
    },
    {
      question: "Dropout rate = 0.5 nghĩa là gì?",
      options: [
        "Bỏ 50% trọng số vĩnh viễn",
        "Mỗi bước huấn luyện, 50% nơ-ron bị tắt ngẫu nhiên, bước sau lại khác",
        "Giảm learning rate 50%",
        "Chỉ dùng 50% dữ liệu",
      ],
      correct: 1,
      explanation:
        "Mỗi training step, 50% nơ-ron bị \"tắt\" (output = 0). Bước tiếp theo, bộ nơ-ron bị tắt lại khác. Khi inference, TẤT CẢ nơ-ron đều hoạt động (output × 0.5 để bù).",
    },
    {
      question:
        "Weight decay trong Adam/SGD tương đương kỹ thuật nào?",
      options: [
        "L1 regularization",
        "L2 regularization",
        "Dropout",
        "Batch normalization",
      ],
      correct: 1,
      explanation:
        "Weight decay = nhân trọng số với (1 - λ) mỗi bước, tương đương thêm λ·||w||² vào loss. Đó chính là L2 regularization. Adam + weight decay gọi là AdamW.",
    },
  ];

  return (
    <>
      {/* ===== STEP 1: PREDICTION GATE ===== */}
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Đội bóng có 1 ngôi sao ghi 90% bàn thắng. Khi ngôi sao chấn thương, đội thua liên tục. Huấn luyện viên nên làm gì?"
          options={[
            "Tìm ngôi sao mới giỏi hơn",
            "Bắt cả đội tập đều nhau, không ai được \"ôm\" quá nhiều bóng — ai cũng phải biết ghi bàn",
            "Cho ngôi sao chơi nhiều hơn để bù",
            "Không làm gì — phụ thuộc ngôi sao là bình thường",
          ]}
          correct={1}
          explanation="Buộc mọi cầu thủ đóng góp đều = Regularization! Trong mạng nơ-ron, nó ngăn vài trọng số quá lớn (\"ngôi sao\") chi phối toàn bộ mô hình."
        >
          <p className="mt-4 text-sm text-muted leading-relaxed">
            Regularization ép mạng &quot;chia sẻ vai trò&quot; đều hơn.
            Hãy xem từng kỹ thuật thay đổi phân bổ trọng số như thế nào khi bạn{" "}
            <strong className="text-foreground">kéo thanh cường độ</strong>.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ===== STEP 2: WEIGHT VISUALIZATION ===== */}
      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-4">
            {/* Type selector */}
            <div className="flex flex-wrap gap-2 justify-center">
              {(Object.keys(REG_CONFIG) as RegType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setRegType(type)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
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

            {/* Strength slider */}
            {regType !== "none" && (
              <div className="space-y-1 max-w-md mx-auto">
                <label className="text-sm font-medium text-muted">
                  Cường độ (λ):{" "}
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
                  onChange={(e) =>
                    setStrength(parseFloat(e.target.value))
                  }
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
            >
              <text
                x={SVG_W / 2}
                y={15}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="11"
              >
                Phân phối trọng số
              </text>

              {/* Center line (0) */}
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
                fill="#64748b"
                fontSize="9"
                textAnchor="middle"
              >
                0
              </text>

              {/* Weight bars */}
              {weights.map((w, i) => {
                const x = startX + i * (barW + gap);
                const barHeight = Math.abs(w) * scale;
                const y = w >= 0 ? midY - barHeight : midY;
                const isZero = Math.abs(w) < 0.01;

                return (
                  <g key={`bar-${i}`}>
                    {/* Ghost bar (original weight) */}
                    {regType !== "none" && (
                      <rect
                        x={x}
                        y={
                          BASE_WEIGHTS[i] >= 0
                            ? midY -
                              Math.abs(BASE_WEIGHTS[i]) * scale
                            : midY
                        }
                        width={barW}
                        height={Math.abs(BASE_WEIGHTS[i]) * scale}
                        rx={3}
                        fill="#334155"
                        opacity={0.15}
                      />
                    )}

                    {/* Current bar */}
                    <rect
                      x={x}
                      y={y}
                      width={barW}
                      height={Math.max(1, barHeight)}
                      rx={3}
                      fill={
                        isZero
                          ? "#334155"
                          : REG_CONFIG[regType].color
                      }
                      opacity={isZero ? 0.3 : 0.8}
                    />

                    {/* Label */}
                    <text
                      x={x + barW / 2}
                      y={SVG_H - 5}
                      textAnchor="middle"
                      fill="#64748b"
                      fontSize="8"
                    >
                      w{i + 1}
                    </text>

                    {/* Value */}
                    <text
                      x={x + barW / 2}
                      y={
                        w >= 0
                          ? y - 4
                          : y + barHeight + 12
                      }
                      textAnchor="middle"
                      fill={isZero ? "#475569" : "#e2e8f0"}
                      fontSize="8"
                    >
                      {w.toFixed(1)}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
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
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ===== STEP 3: AHA MOMENT ===== */}
      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>Regularization</strong>{" "}
            là cách nói &quot;đừng quá phức tạp&quot; với mạng nơ-ron. L1 loại bỏ trọng
            số thừa (như cắt bớt cầu thủ dự bị), L2 chia đều vai trò (ai cũng chơi),
            Dropout cho &quot;nghỉ phép ngẫu nhiên&quot; để đội mạnh ở mọi đội hình!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ===== STEP 4: INLINE CHALLENGE ===== */}
      <LessonSection step={4} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Bạn dùng Dropout(0.5) khi huấn luyện. Khi deploy mô hình cho người dùng (inference), Dropout hoạt động thế nào?"
          options={[
            "Vẫn tắt ngẫu nhiên 50% nơ-ron — giống lúc train",
            "TẤT CẢ nơ-ron hoạt động, nhưng output × 0.5 để bù lại",
            "Tắt 50% nơ-ron cố định (không ngẫu nhiên nữa)",
          ]}
          correct={1}
          explanation="Khi inference (model.eval()), Dropout TẮT — mọi nơ-ron đều chạy. Nhưng output nhân 0.5 (keep probability) để tổng output khớp với lúc train. PyTorch tự xử lý việc này!"
        />
      </LessonSection>

      {/* ===== STEP 5: EXPLANATION ===== */}
      <LessonSection step={5} totalSteps={8} label="Giải thích chi tiết">
        <ExplanationSection>
          <p>
            <strong>Regularization</strong>{" "}
            thêm ràng buộc vào hàm loss để ngăn mô hình quá phức tạp:
          </p>

          <p>
            <strong>L1 Regularization (Lasso):</strong>
          </p>
          <LaTeX block>
            {
              "L_{\\text{total}} = L_{\\text{data}} + \\lambda \\sum_{i}|w_i|"
            }
          </LaTeX>
          <p className="text-sm text-muted">
            Đẩy trọng số nhỏ về đúng 0 → tạo mô hình thưa (sparse).
            Tương đương feature selection tự động.
          </p>

          <p>
            <strong>L2 Regularization (Ridge / Weight Decay):</strong>
          </p>
          <LaTeX block>
            {
              "L_{\\text{total}} = L_{\\text{data}} + \\lambda \\sum_{i}w_i^2"
            }
          </LaTeX>
          <p className="text-sm text-muted">
            Thu nhỏ tất cả trọng số nhưng hiếm khi về 0 → phân bổ đều vai trò.
            Phổ biến nhất trong thực tế.
          </p>

          <p>
            <strong>Dropout:</strong>
          </p>
          <p className="text-sm text-muted">
            Mỗi bước huấn luyện, ngẫu nhiên &quot;tắt&quot; p% nơ-ron (thường p = 20-50%).
            Buộc mạng học feature redundant — không phụ thuộc vào bất kỳ nơ-ron đơn lẻ nào.
          </p>

          <Callout variant="insight" title="L1 vs L2 — ví dụ trực quan">
            Tưởng tượng bạn đóng thuế trọng số. L1 = thuế cố định mỗi trọng số (phí bảo trì
            cố định) → trọng số nhỏ &quot;không đáng giữ&quot; → loại bỏ. L2 = thuế tỷ lệ
            với giá trị² → trọng số lớn bị &quot;đánh thuế&quot; nặng → thu nhỏ nhưng không
            loại bỏ.
          </Callout>

          <CodeBlock language="python" title="regularization.py">
{`import torch.nn as nn

# L2 regularization = weight_decay trong optimizer
optimizer = torch.optim.AdamW(
    model.parameters(),
    lr=1e-3,
    weight_decay=0.01  # λ cho L2
)

# Dropout: thêm giữa các lớp
model = nn.Sequential(
    nn.Linear(784, 256),
    nn.ReLU(),
    nn.Dropout(0.3),    # tắt 30% nơ-ron khi train
    nn.Linear(256, 128),
    nn.ReLU(),
    nn.Dropout(0.3),
    nn.Linear(128, 10),
)

# Quan trọng: bật/tắt Dropout khi train/eval
model.train()  # Dropout ON
model.eval()   # Dropout OFF (inference)`}
          </CodeBlock>

          <Callout variant="tip" title="Combo chống overfitting phổ biến nhất">
            <strong>L2 (weight decay) + Dropout + Early Stopping</strong>{" "}
            là bộ ba kinh điển. AdamW (Adam + weight decay) đã tích hợp L2.
            Thêm Dropout 0.1-0.3 giữa các lớp. Early stopping khi val loss tăng.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ===== STEP 6: CHALLENGE 2 ===== */}
      <LessonSection step={6} totalSteps={8} label="Thử thách nâng cao">
        <InlineChallenge
          question="Bạn có 100 features nhưng nghi ngờ chỉ 10 features thực sự hữu ích. Nên dùng regularization nào?"
          options={[
            "L2 — thu nhỏ tất cả đều nhau",
            "L1 — tự động đẩy 90 features thừa về trọng số = 0 (feature selection)",
            "Dropout — tắt ngẫu nhiên features",
          ]}
          correct={1}
          explanation="L1 tạo sparsity: features không quan trọng có trọng số = 0, chỉ giữ ~10 features hữu ích. Đây là lý do L1 còn gọi là Lasso (feature selection)."
        />
      </LessonSection>

      {/* ===== STEP 7: MINI SUMMARY ===== */}
      <LessonSection step={7} totalSteps={8} label="Tóm tắt">
        <MiniSummary
          title="Regularization — Điểm chốt"
          points={[
            "Regularization = thêm ràng buộc vào loss để ngăn overfitting, ép mô hình đơn giản hơn.",
            "L1 (Lasso): đẩy trọng số về 0 → feature selection tự động. L2 (Ridge): thu nhỏ đều → phổ biến nhất.",
            "Dropout: tắt ngẫu nhiên nơ-ron khi train (20-50%), mọi nơ-ron hoạt động khi inference (nhân keep_prob).",
            "Weight decay trong AdamW/SGD = L2 regularization.",
            "Combo kinh điển: AdamW (weight decay) + Dropout(0.1-0.3) + Early Stopping.",
          ]}
        />
      </LessonSection>

      {/* ===== STEP 8: QUIZ ===== */}
      <LessonSection step={8} totalSteps={8} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
