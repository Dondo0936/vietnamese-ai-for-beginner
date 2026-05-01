"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
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
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "optimizers",
  title: "Optimizers",
  titleVi: "Bộ tối ưu hóa",
  description:
    "Các thuật toán cải tiến gradient descent, giúp huấn luyện nhanh hơn và ổn định hơn.",
  category: "neural-fundamentals",
  tags: ["optimization", "training", "advanced"],
  difficulty: "advanced",
  relatedSlugs: ["gradient-descent", "sgd", "learning-rate"],
  vizType: "interactive",
};

/* ---------- helpers ---------- */
type OptimizerName = "sgd" | "momentum" | "rmsprop" | "adam";

// Elongated valley: f(x,y) = 5*(x-3)^2 + 0.5*(y-3)^2
function gradFx(x: number) {
  return 10 * (x - 3);
}
function gradFy(y: number) {
  return 1.0 * (y - 3);
}
function lossF(x: number, y: number) {
  return 5 * (x - 3) ** 2 + 0.5 * (y - 3) ** 2;
}

const SVG_W = 420;
const SVG_H = 420;
const PAD = 25;

function toSvg(v: number) {
  return PAD + ((v - 0) / 6) * (SVG_W - 2 * PAD);
}

const OPT_CONFIG: Record<OptimizerName, { color: string; label: string; desc: string }> = {
  sgd: {
    color: "#64748b",
    label: "SGD",
    desc: "Đi theo gradient thuần — zig-zag chậm trên thung lũng hẹp",
  },
  momentum: {
    color: "#3b82f6",
    label: "Momentum",
    desc: "Tích lũy đà như viên bi lăn — lao thẳng hơn, ít zig-zag",
  },
  rmsprop: {
    color: "#f59e0b",
    label: "RMSProp",
    desc: "Chia LR theo lịch sử gradient² — bước ngắn chiều dao động, bước dài chiều ổn",
  },
  adam: {
    color: "#22c55e",
    label: "Adam",
    desc: "Momentum + RMSProp + bias correction — mặc định phổ biến nhất",
  },
};

/* ---------- main component ---------- */
export default function OptimizersTopic() {
  const [selected, setSelected] = useState<OptimizerName>("adam");
  const [paths, setPaths] = useState<
    Record<OptimizerName, { x: number; y: number }[]>
  >({
    sgd: [],
    momentum: [],
    rmsprop: [],
    adam: [],
  });
  const [isRunning, setIsRunning] = useState(false);
  const [stepCount, setStepCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runAll = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    setStepCount(0);

    const lr = 0.02;
    const states = {
      sgd: { x: 0.5, y: 0.5 },
      momentum: { x: 0.5, y: 0.5, vx: 0, vy: 0 },
      rmsprop: { x: 0.5, y: 0.5, sx: 0.001, sy: 0.001 },
      adam: { x: 0.5, y: 0.5, vx: 0, vy: 0, sx: 0.001, sy: 0.001, t: 0 },
    };

    const initial = { x: 0.5, y: 0.5 };
    setPaths({
      sgd: [initial],
      momentum: [initial],
      rmsprop: [initial],
      adam: [initial],
    });

    let step = 0;
    intervalRef.current = setInterval(() => {
      step++;
      if (step > 80) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsRunning(false);
        return;
      }
      setStepCount(step);

      // SGD
      states.sgd.x -= lr * gradFx(states.sgd.x);
      states.sgd.y -= lr * gradFy(states.sgd.y);

      // Momentum (β = 0.9)
      const mb = 0.9;
      states.momentum.vx = mb * states.momentum.vx + (1 - mb) * gradFx(states.momentum.x);
      states.momentum.vy = mb * states.momentum.vy + (1 - mb) * gradFy(states.momentum.y);
      states.momentum.x -= lr * states.momentum.vx * 3;
      states.momentum.y -= lr * states.momentum.vy * 3;

      // RMSProp (β₂ = 0.99)
      const rb = 0.99;
      const rgx = gradFx(states.rmsprop.x);
      const rgy = gradFy(states.rmsprop.y);
      states.rmsprop.sx = rb * states.rmsprop.sx + (1 - rb) * rgx * rgx;
      states.rmsprop.sy = rb * states.rmsprop.sy + (1 - rb) * rgy * rgy;
      states.rmsprop.x -= (lr * rgx) / (Math.sqrt(states.rmsprop.sx) + 1e-8);
      states.rmsprop.y -= (lr * rgy) / (Math.sqrt(states.rmsprop.sy) + 1e-8);

      // Adam (β₁ = 0.9, β₂ = 0.999)
      const ab1 = 0.9;
      const ab2 = 0.999;
      states.adam.t++;
      const agx = gradFx(states.adam.x);
      const agy = gradFy(states.adam.y);
      states.adam.vx = ab1 * states.adam.vx + (1 - ab1) * agx;
      states.adam.vy = ab1 * states.adam.vy + (1 - ab1) * agy;
      states.adam.sx = ab2 * states.adam.sx + (1 - ab2) * agx * agx;
      states.adam.sy = ab2 * states.adam.sy + (1 - ab2) * agy * agy;
      const mxH = states.adam.vx / (1 - ab1 ** states.adam.t);
      const myH = states.adam.vy / (1 - ab1 ** states.adam.t);
      const sxH = states.adam.sx / (1 - ab2 ** states.adam.t);
      const syH = states.adam.sy / (1 - ab2 ** states.adam.t);
      states.adam.x -= (lr * mxH) / (Math.sqrt(sxH) + 1e-8);
      states.adam.y -= (lr * myH) / (Math.sqrt(syH) + 1e-8);

      // Clamp all
      for (const key of ["sgd", "momentum", "rmsprop", "adam"] as const) {
        states[key].x = Math.max(0, Math.min(6, states[key].x));
        states[key].y = Math.max(0, Math.min(6, states[key].y));
      }

      setPaths((prev) => ({
        sgd: [...prev.sgd, { x: states.sgd.x, y: states.sgd.y }],
        momentum: [...prev.momentum, { x: states.momentum.x, y: states.momentum.y }],
        rmsprop: [...prev.rmsprop, { x: states.rmsprop.x, y: states.rmsprop.y }],
        adam: [...prev.adam, { x: states.adam.x, y: states.adam.y }],
      }));
    }, 80);
  }, [isRunning]);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setPaths({ sgd: [], momentum: [], rmsprop: [], adam: [] });
    setStepCount(0);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Final losses
  const finalLosses = useMemo(() => {
    const result: Record<OptimizerName, string> = {
      sgd: "—",
      momentum: "—",
      rmsprop: "—",
      adam: "—",
    };
    for (const key of Object.keys(result) as OptimizerName[]) {
      const p = paths[key];
      if (p.length > 0) {
        const last = p[p.length - 1];
        result[key] = lossF(last.x, last.y).toFixed(3);
      }
    }
    return result;
  }, [paths]);

  /* Quiz */
  const quizQuestions: QuizQuestion[] = [
    {
      question: "Tại sao Adam cần bias correction ở các bước đầu?",
      options: [
        "Để giảm learning rate",
        "Ban đầu m và v khởi tạo = 0, nên ước lượng bị lệch về 0. Bias correction chia cho (1-β^t) để bù lại",
        "Để tăng noise cho regularization",
        "Bias correction là tùy chọn, không bắt buộc",
      ],
      correct: 1,
      explanation:
        "m₀ = 0, v₀ = 0 → các bước đầu m,v quá nhỏ (thiên về 0). Chia cho (1-β^t) sửa lỗi này. Khi t lớn, (1-β^t) → 1, correction tự mất.",
    },
    {
      question: "Khi nào nên dùng SGD + Momentum thay vì Adam?",
      options: [
        "Không bao giờ — Adam luôn tốt hơn",
        "Khi cần generalization tốt nhất (nghiên cứu cho thấy SGD+Momentum thường tổng quát hóa tốt hơn Adam)",
        "Khi dataset nhỏ",
        "Khi learning rate cố định",
      ],
      correct: 1,
      explanation:
        "Nghiên cứu cho thấy SGD + Momentum + LR scheduling thường cho test accuracy tốt hơn Adam trên vision tasks. Adam hội tụ nhanh nhưng có thể tìm minima kém tổng quát hơn.",
    },
    {
      question: "AdamW khác Adam ở điểm nào?",
      options: [
        "AdamW dùng learning rate lớn hơn",
        "AdamW tách weight decay ra khỏi gradient update — regularization chính xác hơn",
        "AdamW không có bias correction",
        "AdamW chỉ cho CNN, Adam chỉ cho Transformer",
      ],
      correct: 1,
      explanation:
        "Adam thêm L2 vào loss (gradient cũng bị ảnh hưởng). AdamW tách riêng: gradient update một đường, weight decay một đường. Cho regularization hiệu quả hơn, đặc biệt cho Transformer.",
    },
    {
      type: "fill-blank",
      question:
        "Adam = {blank} (tích lũy đà qua trung bình gradient) + {blank} (chia LR theo trung bình gradient²) + bias correction.",
      blanks: [
        { answer: "Momentum", accept: ["momentum", "đà"] },
        { answer: "RMSProp", accept: ["rmsprop", "RMSprop", "rms-prop"] },
      ],
      explanation:
        "Adam (Adaptive Moment Estimation) kết hợp Momentum (moment bậc 1 — trung bình m_t của gradient) với RMSProp (moment bậc 2 — trung bình v_t của gradient²), cộng thêm bias correction chia cho (1 - β^t) để sửa lệch ban đầu.",
    },
  ];

  return (
    <>
      {/* ===== STEP 1: PREDICTION GATE ===== */}
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Bạn đi xe máy qua một thung lũng hẹp dài. SGD đi zig-zag chậm. Cách nào để đi nhanh hơn?"
          options={[
            "Tăng tốc (tăng LR) — nhưng sẽ zig-zag mạnh hơn",
            "Tích lũy đà theo hướng nhất quán (momentum) + tự động giảm tốc chiều dao động",
            "Đi ngẫu nhiên — may ra tìm đường tắt",
            "Dừng lại và đi bộ",
          ]}
          correct={1}
          explanation="Đó chính là ý tưởng của Adam! Momentum tích lũy đà theo hướng nhất quán, RMSProp tự giảm bước ở chiều dao động. Kết hợp = hội tụ nhanh + ổn định."
        >
          <p className="mt-4 text-sm text-muted leading-relaxed">
            Hãy xem 4 optimizer <strong className="text-foreground">chạy đua</strong>{" "}
            trên bề mặt loss hình elip dài (mô phỏng thung lũng hẹp phổ biến trong deep learning).
            Cả 4 đều là biến thể của{" "}
            <TopicLink slug="gradient-descent">gradient descent</TopicLink>.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ===== STEP 2: OPTIMIZER RACE ===== */}
      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-4">
            {/* Optimizer selector */}
            <div className="flex flex-wrap gap-2 justify-center">
              {(Object.keys(OPT_CONFIG) as OptimizerName[]).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSelected(opt)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    selected === opt
                      ? "text-white shadow-md"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                  style={
                    selected === opt
                      ? { backgroundColor: OPT_CONFIG[opt].color }
                      : {}
                  }
                >
                  {OPT_CONFIG[opt].label}
                </button>
              ))}
            </div>

            {/* Status */}
            <div
              className="rounded-lg p-2 text-center text-xs"
              style={{
                color: OPT_CONFIG[selected].color,
                backgroundColor: `${OPT_CONFIG[selected].color}15`,
                border: `1px solid ${OPT_CONFIG[selected].color}40`,
              }}
            >
              {OPT_CONFIG[selected].desc}
            </div>

            {/* 2D contour map */}
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              className="w-full max-w-md mx-auto"
            >
              {/* Elliptical contours */}
              {[0.3, 0.7, 1.2, 1.8, 2.5].map((r, i) => (
                <ellipse
                  key={`c-${i}`}
                  cx={toSvg(3)}
                  cy={toSvg(3)}
                  rx={(r / 3) * ((SVG_W - 2 * PAD) / 2)}
                  ry={
                    (r / 3) * ((SVG_H - 2 * PAD) / 2) * 0.32
                  }
                  fill="none"
                  stroke="#334155"
                  strokeWidth="1"
                  opacity={0.3}
                />
              ))}

              {/* Target */}
              <circle
                cx={toSvg(3)}
                cy={toSvg(3)}
                r="4"
                fill="#22c55e"
                opacity={0.8}
              />
              <text
                x={toSvg(3) + 8}
                y={toSvg(3) - 6}
                fill="#22c55e"
                fontSize="11"
              >
                Min
              </text>

              {/* All paths */}
              {(Object.keys(OPT_CONFIG) as OptimizerName[]).map((opt) => {
                const path = paths[opt];
                if (path.length < 2) return null;
                const isHighlighted = selected === opt;

                return (
                  <g key={`path-${opt}`}>
                    <polyline
                      points={path
                        .map((p) => `${toSvg(p.x)},${toSvg(p.y)}`)
                        .join(" ")}
                      fill="none"
                      stroke={OPT_CONFIG[opt].color}
                      strokeWidth={isHighlighted ? 2.5 : 1}
                      opacity={isHighlighted ? 1 : 0.2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <motion.circle
                      cx={toSvg(path[path.length - 1].x)}
                      cy={toSvg(path[path.length - 1].y)}
                      r={isHighlighted ? 5 : 3}
                      fill={OPT_CONFIG[opt].color}
                      stroke={isHighlighted ? "white" : "none"}
                      strokeWidth={isHighlighted ? 1.5 : 0}
                      initial={false}
                      animate={{
                        cx: toSvg(path[path.length - 1].x),
                        cy: toSvg(path[path.length - 1].y),
                      }}
                      transition={{ type: "spring", stiffness: 120 }}
                    />
                  </g>
                );
              })}

              {/* Start */}
              {paths.sgd.length > 0 && (
                <circle
                  cx={toSvg(0.5)}
                  cy={toSvg(0.5)}
                  r="4"
                  fill="#f59e0b"
                  stroke="white"
                  strokeWidth="1"
                />
              )}

              <text
                x={SVG_W / 2}
                y={SVG_H - 3}
                textAnchor="middle"
                fill="var(--text-tertiary)"
                fontSize="11"
              >
                w₁
              </text>
              <text
                x={6}
                y={SVG_H / 2}
                fill="var(--text-tertiary)"
                fontSize="11"
                transform={`rotate(-90, 6, ${SVG_H / 2})`}
              >
                w₂
              </text>
            </svg>

            {/* Controls */}
            <div className="flex justify-center gap-3">
              <button
                onClick={reset}
                className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
              >
                Đặt lại
              </button>
              <button
                onClick={runAll}
                disabled={isRunning}
                className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {isRunning ? "Đang chạy..." : "Chạy đua"}
              </button>
            </div>

            {/* Legend + final loss */}
            {stepCount > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.keys(OPT_CONFIG) as OptimizerName[]).map((opt) => (
                  <div
                    key={`stat-${opt}`}
                    className={`rounded-lg border p-2 text-center text-xs transition-all cursor-pointer ${
                      selected === opt
                        ? "border-accent bg-accent/10"
                        : "border-border"
                    }`}
                    onClick={() => setSelected(opt)}
                  >
                    <div
                      className="mx-auto mb-1 h-2 w-8 rounded-full"
                      style={{
                        backgroundColor: OPT_CONFIG[opt].color,
                      }}
                    />
                    <p className="font-semibold text-foreground">
                      {OPT_CONFIG[opt].label}
                    </p>
                    <p className="text-muted">
                      Loss: {finalLosses[opt]}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ===== STEP 3: AHA MOMENT ===== */}
      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>Adam = Momentum + RMSProp + Bias Correction.</strong>{" "}
            Momentum tích lũy đà (đi nhanh hướng nhất quán). RMSProp chia LR
            cho chiều dao động (bước ngắn ở trục zig-zag). Bias correction sửa
            sai lệch ban đầu. Kết quả: hội tụ nhanh + ổn định — như Grab car có
            GPS tự động né đường tắc!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ===== STEP 4: INLINE CHALLENGE ===== */}
      <LessonSection step={4} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="SGD zig-zag trên thung lũng hẹp vì trục ngắn (x) có gradient lớn hơn trục dài (y). RMSProp giải quyết thế nào?"
          options={[
            "Tăng LR cho cả hai trục",
            "Chia LR mỗi trục cho √(trung bình gradient² trên trục đó) → trục dao động mạnh bị chia nhiều, trục ổn bị chia ít",
            "Đổi hướng gradient ngẫu nhiên",
          ]}
          correct={1}
          explanation="RMSProp: LR_hiệu_dụng = LR / √(mean(g²)). Trục x dao động mạnh → mean(g²) lớn → LR nhỏ → bước ngắn. Trục y ổn → LR lớn → bước dài. Tự cân bằng!"
        />
      </LessonSection>

      {/* ===== STEP 5: EXPLANATION ===== */}
      <LessonSection step={5} totalSteps={8} label="Giải thích">
        <ExplanationSection>
          <p>
            <strong>SGD + Momentum:</strong>
          </p>
          <LaTeX block>
            {
              "v_t = \\beta v_{t-1} + (1-\\beta) \\nabla L \\quad ; \\quad \\theta = \\theta - \\alpha v_t"
            }
          </LaTeX>

          <p>
            <strong>RMSProp:</strong>
          </p>
          <LaTeX block>
            {
              "s_t = \\beta_2 s_{t-1} + (1-\\beta_2)(\\nabla L)^2 \\quad ; \\quad \\theta = \\theta - \\frac{\\alpha}{\\sqrt{s_t} + \\epsilon} \\nabla L"
            }
          </LaTeX>

          <p>
            <strong>Adam (Adaptive Moment Estimation):</strong>
          </p>
          <LaTeX block>
            {
              "m_t = \\beta_1 m_{t-1} + (1-\\beta_1) \\nabla L \\quad ; \\quad v_t = \\beta_2 v_{t-1} + (1-\\beta_2)(\\nabla L)^2"
            }
          </LaTeX>
          <LaTeX block>
            {
              "\\hat{m}_t = \\frac{m_t}{1-\\beta_1^t} \\quad ; \\quad \\hat{v}_t = \\frac{v_t}{1-\\beta_2^t} \\quad ; \\quad \\theta = \\theta - \\frac{\\alpha \\hat{m}_t}{\\sqrt{\\hat{v}_t} + \\epsilon}"
            }
          </LaTeX>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-semibold text-foreground">
                    Optimizer
                  </th>
                  <th className="text-left py-2 pr-3 font-semibold text-foreground">
                    LR mặc định
                  </th>
                  <th className="text-left py-2 font-semibold text-foreground">
                    Khi nào dùng
                  </th>
                </tr>
              </thead>
              <tbody className="text-foreground/80">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">
                    <TopicLink slug="sgd">SGD</TopicLink> + Momentum
                  </td>
                  <td className="py-2 pr-3">0.01 - 0.1</td>
                  <td className="py-2">
                    Vision (ResNet, EfficientNet) khi cần generalization tốt
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">Adam</td>
                  <td className="py-2 pr-3">0.001</td>
                  <td className="py-2">
                    Mặc định cho hầu hết bài toán, NLP, GAN
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">AdamW</td>
                  <td className="py-2 pr-3">0.001</td>
                  <td className="py-2">
                    Transformer (GPT, BERT, ViT) — weight decay tách riêng
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-medium">RMSProp</td>
                  <td className="py-2 pr-3">0.001</td>
                  <td className="py-2">RNN, RL (đang bị Adam thay thế)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <CodeBlock language="python" title="optimizers.py">
{`import torch.optim as optim

# SGD + Momentum (vision tasks)
opt_sgd = optim.SGD(model.parameters(), lr=0.01, momentum=0.9)

# Adam (mặc định cho hầu hết)
opt_adam = optim.Adam(model.parameters(), lr=1e-3)

# AdamW (Transformer, weight decay tách riêng)
opt_adamw = optim.AdamW(
    model.parameters(), lr=1e-3, weight_decay=0.01
)

# LR scheduler (quan trọng cho SGD)
scheduler = optim.lr_scheduler.CosineAnnealingLR(
    opt_sgd, T_max=100
)`}
          </CodeBlock>

          <Callout variant="tip" title="Quy tắc chọn optimizer">
            <strong>Bắt đầu với AdamW(lr=1e-3, weight_decay=0.01)</strong>{" "}
            — hoạt động tốt cho hầu hết bài toán. Nếu cần squeeze thêm accuracy cho
            vision: thử SGD + Momentum + Cosine Annealing. Transformer: bắt buộc AdamW
            + warmup. Nhớ điều chỉnh{" "}
            <TopicLink slug="learning-rate">learning rate</TopicLink>{" "}
            phù hợp với optimizer.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ===== STEP 6: CHALLENGE 2 ===== */}
      <LessonSection step={6} totalSteps={8} label="Thử thách nâng cao">
        <InlineChallenge
          question="Bạn huấn luyện GPT-3 (175B tham số). Nên dùng optimizer nào?"
          options={[
            "SGD — đơn giản, ít bộ nhớ",
            "Adam — mặc định tốt",
            "AdamW + warmup + cosine decay — chuẩn cho LLM",
          ]}
          correct={2}
          explanation="LLM dùng AdamW (weight decay tách riêng) + warmup (tránh gradient explosion ban đầu) + cosine decay (LR giảm mượt). Lưu ý: Adam cần 2× bộ nhớ so với SGD (lưu m và v cho mỗi tham số)."
        />
      </LessonSection>

      {/* ===== STEP 7: MINI SUMMARY ===== */}
      <LessonSection step={7} totalSteps={8} label="Tóm tắt">
        <MiniSummary
          title="Optimizers — Điểm chốt"
          points={[
            "Momentum tích lũy đà → ít zig-zag. RMSProp chia LR theo lịch sử gradient² → tự cân bằng trục.",
            "Adam = Momentum + RMSProp + Bias Correction — mặc định phổ biến nhất.",
            "AdamW tách weight decay riêng → regularization chính xác hơn, bắt buộc cho Transformer.",
            "SGD + Momentum + LR scheduling cho generalization tốt nhất trên vision tasks.",
            "Adam cần 2× bộ nhớ so với SGD (lưu m, v). Với mô hình 175B tham số, đây là vấn đề thực tế.",
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
