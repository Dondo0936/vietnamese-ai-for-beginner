"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
  SliderGroup,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "learning-rate",
  title: "Learning Rate",
  titleVi: "Tốc độ học",
  description:
    "Siêu tham số quan trọng nhất trong huấn luyện mạng nơ-ron, quyết định kích thước bước di chuyển khi tối ưu.",
  category: "neural-fundamentals",
  tags: ["optimization", "hyperparameter", "training"],
  difficulty: "beginner",
  relatedSlugs: ["gradient-descent", "sgd", "optimizers"],
  vizType: "interactive",
};

/* ---------- math helpers ---------- */
const SVG_W = 500;
const SVG_H = 260;
const PAD = 38;
const X_MIN = -2;
const X_MAX = 8;
const Y_MIN = 0;
const Y_MAX = 28;
const OPTIMUM = 3;

function loss(x: number) {
  return (x - OPTIMUM) ** 2 + 0.5;
}
function grad(x: number) {
  return 2 * (x - OPTIMUM);
}
function toX(v: number) {
  return PAD + ((v - X_MIN) / (X_MAX - X_MIN)) * (SVG_W - 2 * PAD);
}
function toY(v: number) {
  return SVG_H - PAD - ((v - Y_MIN) / (Y_MAX - Y_MIN)) * (SVG_H - 2 * PAD);
}

/* ---------- main component ---------- */
export default function LearningRateTopic() {
  const [lr, setLr] = useState(0.3);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animStep, setAnimStep] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Compute trajectory for current LR
  const trajectory = useMemo(() => {
    const pts: { x: number; y: number; g: number }[] = [];
    let x = 0.5;
    for (let i = 0; i < 25; i++) {
      const g = grad(x);
      pts.push({ x, y: loss(x), g });
      x = Math.max(X_MIN, Math.min(X_MAX, x - lr * g));
    }
    return pts;
  }, [lr]);

  // Loss curve
  const curvePoints = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 200; i++) {
      const x = X_MIN + (i / 200) * (X_MAX - X_MIN);
      pts.push(`${toX(x)},${toY(loss(x))}`);
    }
    return pts.join(" ");
  }, []);

  // Animate step by step
  const runAnimation = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setAnimStep(0);
    let s = 0;
    intervalRef.current = setInterval(() => {
      s++;
      if (s >= Math.min(trajectory.length - 1, 20)) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsAnimating(false);
        return;
      }
      setAnimStep(s);
    }, 300);
  }, [isAnimating, trajectory]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsAnimating(false);
    setAnimStep(0);
  }, []);

  // Status assessment
  const status = useMemo(() => {
    const finalLoss = trajectory[trajectory.length - 1].y;
    if (lr < 0.08)
      return { text: "Quá chậm — mất rất nhiều bước mới gần cực tiểu", color: "#f59e0b" };
    if (lr <= 0.5)
      return { text: "Tốt! Hội tụ ổn định về cực tiểu", color: "#22c55e" };
    if (lr <= 0.85)
      return { text: "Dao động mạnh quanh cực tiểu — khó hội tụ", color: "#f59e0b" };
    return { text: "Phân kỳ! Bước quá lớn, nhảy qua cực tiểu liên tục", color: "#ef4444" };
  }, [lr, trajectory]);

  // Loss history for chart
  const lossHistory = useMemo(() => {
    return trajectory.slice(0, animStep + 1).map((p) => p.y);
  }, [trajectory, animStep]);

  /* Quiz */
  const quizQuestions: QuizQuestion[] = [
    {
      question: "Learning rate = 0.001 là mặc định phổ biến cho optimizer nào?",
      options: [
        "SGD thuần",
        "Adam",
        "Batch Gradient Descent",
        "Newton's method",
      ],
      correct: 1,
      explanation:
        "Adam mặc định lr = 0.001 và hoạt động tốt trong hầu hết trường hợp. SGD thường cần lr lớn hơn (0.01-0.1) vì không có momentum thích ứng.",
    },
    {
      question: "Learning rate warmup có nghĩa là gì?",
      options: [
        "Tăng LR dần dần trong vài epoch đầu, rồi mới bắt đầu giảm",
        "Bắt đầu với LR lớn nhất rồi giảm nhanh",
        "Giữ LR cố định suốt quá trình huấn luyện",
        "Chỉ dùng LR khi mô hình đã hội tụ",
      ],
      correct: 0,
      explanation:
        "Warmup bắt đầu với LR rất nhỏ, tăng dần lên giá trị mục tiêu trong vài epoch đầu. Tránh cập nhật quá mạnh khi trọng số chưa ổn định — đặc biệt quan trọng với Transformer.",
    },
    {
      question:
        "Loss giảm nhanh ban đầu rồi dao động lên xuống. Nguyên nhân có thể nhất là gì?",
      options: [
        "Dữ liệu quá ít",
        "Learning rate tốt ban đầu nhưng quá lớn khi gần cực tiểu — cần LR scheduling",
        "Mô hình quá nhỏ",
        "Bug trong code",
      ],
      correct: 1,
      explanation:
        "LR cố định phù hợp khi xa cực tiểu nhưng quá lớn khi đến gần. LR scheduling (giảm dần) giải quyết: bước lớn lúc đầu, bước nhỏ khi gần đích.",
    },
  ];

  return (
    <>
      {/* ===== STEP 1: PREDICTION GATE ===== */}
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Bạn đi Grab bike về nhà. Tài xế biết hướng đi nhưng phải chọn tốc độ. Nếu chạy quá nhanh trên đường hẹp, điều gì xảy ra?"
          options={[
            "Về nhanh hơn — tốc độ luôn tốt",
            "Vượt qua ngõ rẽ, phải quay lại, rồi lại vượt — lặp vô hạn",
            "Không ảnh hưởng — chỉ cần biết hướng",
            "Xe tự động giảm tốc",
          ]}
          correct={1}
          explanation="Giống hệt learning rate! Quá lớn → vượt qua cực tiểu → quay lại → vượt tiếp → dao động mãi. Learning rate là 'tốc độ' của gradient descent."
        >
          <p className="mt-4 text-sm text-muted leading-relaxed">
            Learning rate quyết định bước nhảy bao xa theo hướng gradient. Hãy tự tay{" "}
            <strong className="text-foreground">kéo thanh trượt</strong>{" "}
            để cảm nhận: nhỏ quá thì chậm, lớn quá thì dao động, vừa phải thì hội tụ đẹp.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ===== STEP 2: INTERACTIVE LR EXPLORER ===== */}
      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-4">
            {/* LR slider */}
            <div className="space-y-2 max-w-lg mx-auto">
              <label className="text-sm font-medium text-muted">
                Learning rate (<LaTeX>{`\\alpha`}</LaTeX>):{" "}
                <strong className="text-foreground">{lr.toFixed(2)}</strong>
              </label>
              <input
                type="range"
                min="0.01"
                max="1.1"
                step="0.01"
                value={lr}
                onChange={(e) => {
                  setLr(parseFloat(e.target.value));
                  reset();
                }}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-xs text-muted">
                <span>0.01 (Rùa bò)</span>
                <span>0.3 (Vừa phải)</span>
                <span>1.1 (Phân kỳ)</span>
              </div>
            </div>

            {/* Status */}
            <div
              className="rounded-lg p-3 text-center text-sm font-medium"
              style={{
                color: status.color,
                backgroundColor: `${status.color}15`,
                border: `1px solid ${status.color}40`,
              }}
            >
              {status.text}
            </div>

            {/* Loss landscape */}
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              className="w-full max-w-2xl mx-auto"
            >
              {/* Axes */}
              <line
                x1={PAD}
                y1={SVG_H - PAD}
                x2={SVG_W - PAD}
                y2={SVG_H - PAD}
                stroke="#334155"
                strokeWidth="1"
              />
              <text
                x={SVG_W / 2}
                y={SVG_H - 8}
                textAnchor="middle"
                fill="#64748b"
                fontSize="10"
              >
                Trọng số (w)
              </text>

              {/* Loss curve */}
              <polyline
                points={curvePoints}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                opacity={0.4}
              />

              {/* Optimum line */}
              <line
                x1={toX(OPTIMUM)}
                y1={SVG_H - PAD}
                x2={toX(OPTIMUM)}
                y2={toY(loss(OPTIMUM))}
                stroke="#22c55e"
                strokeWidth="1"
                strokeDasharray="4,3"
                opacity={0.4}
              />
              <text
                x={toX(OPTIMUM)}
                y={SVG_H - PAD + 14}
                textAnchor="middle"
                fill="#22c55e"
                fontSize="9"
              >
                Cực tiểu
              </text>

              {/* Trajectory trail */}
              {trajectory.slice(0, animStep + 1).map((p, i) => {
                if (i === 0) return null;
                const prev = trajectory[i - 1];
                return (
                  <line
                    key={`trail-${i}`}
                    x1={toX(prev.x)}
                    y1={toY(prev.y)}
                    x2={toX(p.x)}
                    y2={toY(p.y)}
                    stroke="#ef4444"
                    strokeWidth="1.5"
                    opacity={0.3 + (i / (animStep + 1)) * 0.5}
                    strokeDasharray="4,2"
                  />
                );
              })}

              {/* Trajectory dots */}
              {trajectory.slice(0, animStep + 1).map((p, i) => (
                <circle
                  key={`dot-${i}`}
                  cx={toX(p.x)}
                  cy={toY(Math.min(p.y, Y_MAX))}
                  r={i === animStep ? 6 : 3}
                  fill={i === 0 ? "#f59e0b" : "#ef4444"}
                  opacity={0.4 + (i / (animStep + 1)) * 0.6}
                />
              ))}

              {/* Current position highlight */}
              {animStep > 0 && (
                <motion.circle
                  cx={toX(trajectory[animStep].x)}
                  cy={toY(
                    Math.min(trajectory[animStep].y, Y_MAX)
                  )}
                  r={7}
                  fill="#ef4444"
                  stroke="white"
                  strokeWidth="2"
                  initial={false}
                  animate={{
                    cx: toX(trajectory[animStep].x),
                    cy: toY(
                      Math.min(trajectory[animStep].y, Y_MAX)
                    ),
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 120,
                    damping: 15,
                  }}
                />
              )}

              {/* Step labels */}
              {trajectory.slice(0, Math.min(animStep + 1, 8)).map((p, i) => (
                <text
                  key={`lbl-${i}`}
                  x={toX(p.x)}
                  y={toY(Math.min(p.y, Y_MAX)) - 10}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="8"
                >
                  {i}
                </text>
              ))}
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
                onClick={runAnimation}
                disabled={isAnimating}
                className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {isAnimating ? "Đang chạy..." : "Chạy tối ưu"}
              </button>
            </div>

            {/* Step-by-step data */}
            {animStep > 0 && (
              <div className="overflow-x-auto">
                <div className="flex gap-1 text-xs">
                  {trajectory
                    .slice(0, Math.min(animStep + 1, 8))
                    .map((p, i) => (
                      <div
                        key={`cell-${i}`}
                        className="flex-shrink-0 rounded border border-border p-2 text-center min-w-[65px]"
                      >
                        <p className="text-muted">Bước {i}</p>
                        <p className="text-foreground font-semibold">
                          w = {p.x.toFixed(2)}
                        </p>
                        <p className="text-muted">
                          L = {p.y.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  {animStep >= 8 && (
                    <div className="flex items-center px-2 text-muted">
                      ...bước {animStep}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ===== STEP 3: AHA MOMENT ===== */}
      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>Learning rate</strong>{" "}
            là &quot;bước chân&quot; trong gradient descent. Quá nhỏ → rùa bò, mất cả ngày.
            Quá lớn → nhảy qua nhảy lại, không bao giờ dừng. Vừa phải → đi
            thẳng đến đích!
          </p>
          <p className="text-sm mt-2 opacity-80">
            Công thức:{" "}
            <LaTeX>{"w_{\\text{mới}} = w_{\\text{cũ}} - \\alpha \\cdot \\nabla L"}</LaTeX>
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ===== STEP 4: INLINE CHALLENGE ===== */}
      <LessonSection step={4} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Loss giảm nhanh trong 5 epoch đầu, sau đó dao động lên xuống quanh giá trị 0.3 mà không giảm thêm. Bạn nên làm gì?"
          options={[
            "Tăng learning rate để hội tụ nhanh hơn",
            "Giảm learning rate (hoặc dùng LR scheduling) để bước nhỏ hơn khi gần cực tiểu",
            "Không làm gì — đây là hành vi bình thường",
          ]}
          correct={1}
          explanation="Dao động quanh cực tiểu = bước quá lớn khi gần đích. Giảm LR (hoặc dùng cosine annealing, step decay) giúp bước nhỏ dần, hội tụ chính xác hơn."
        />
      </LessonSection>

      {/* ===== STEP 5: LR SCHEDULING ===== */}
      <LessonSection step={5} totalSteps={8} label="LR Scheduling">
        <ExplanationSection>
          <p>
            Trong thực tế, learning rate không cố định mà{" "}
            <strong>thay đổi theo thời gian</strong> — gọi là
            LR scheduling. Ý tưởng: bước dài khi xa đích, bước ngắn khi gần đích.
          </p>

          <LaTeX block>
            {"\\alpha_t = \\alpha_0 \\cdot \\frac{1}{2}\\left(1 + \\cos\\left(\\frac{\\pi \\cdot t}{T}\\right)\\right)"}
          </LaTeX>
          <p className="text-sm text-muted text-center">
            Cosine Annealing — LR giảm mượt mà theo đường cosine
          </p>

          <p>
            <strong>Các chiến lược phổ biến:</strong>
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-semibold text-foreground">
                    Chiến lược
                  </th>
                  <th className="text-left py-2 pr-3 font-semibold text-foreground">
                    Mô tả
                  </th>
                  <th className="text-left py-2 font-semibold text-foreground">
                    Khi nào dùng
                  </th>
                </tr>
              </thead>
              <tbody className="text-foreground/80">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">Step Decay</td>
                  <td className="py-2 pr-3">Giảm LR x0.1 mỗi N epoch</td>
                  <td className="py-2">CNN truyền thống (ResNet)</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">Cosine Annealing</td>
                  <td className="py-2 pr-3">Giảm mượt theo cosine</td>
                  <td className="py-2">Transformer, Vision Transformer</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">Warmup + Decay</td>
                  <td className="py-2 pr-3">Tăng dần → đỉnh → giảm dần</td>
                  <td className="py-2">BERT, GPT (bắt buộc với LLM)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-medium">One-Cycle</td>
                  <td className="py-2 pr-3">Tăng → đỉnh → giảm trong 1 cycle</td>
                  <td className="py-2">FastAI, huấn luyện nhanh</td>
                </tr>
              </tbody>
            </table>
          </div>

          <Callout variant="tip" title="Quy tắc ngón tay cái">
            Bắt đầu với Adam lr = 0.001 hoặc SGD lr = 0.01. Nếu loss không giảm → tăng LR.
            Nếu loss dao động → giảm LR. Dùng LR finder (trong FastAI) để tự động tìm LR tốt nhất.
          </Callout>

          <CodeBlock language="python" title="lr_scheduling.py">
{`import torch.optim as optim

# Optimizer với learning rate ban đầu
optimizer = optim.Adam(model.parameters(), lr=1e-3)

# Cosine Annealing: giảm từ 1e-3 → 0 trong 100 epoch
scheduler = optim.lr_scheduler.CosineAnnealingLR(
    optimizer, T_max=100
)

# Warmup + Cosine (phổ biến cho Transformer)
scheduler = optim.lr_scheduler.OneCycleLR(
    optimizer, max_lr=1e-3,
    steps_per_epoch=len(dataloader),
    epochs=10,
    pct_start=0.1,  # 10% epoch đầu để warmup
)

for epoch in range(100):
    train(...)
    scheduler.step()  # cập nhật LR sau mỗi epoch`}
          </CodeBlock>

          <Callout variant="warning" title="LR warmup là bắt buộc cho Transformer">
            Transformer (GPT, BERT, ViT) rất nhạy với LR ban đầu. Không warmup → gradient
            explosion ở epoch đầu → huấn luyện thất bại. Luôn warmup 5-10% tổng số bước.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ===== STEP 6: CHALLENGE 2 ===== */}
      <LessonSection step={6} totalSteps={8} label="Thử thách nâng cao">
        <InlineChallenge
          question="Bạn chuyển từ SGD (lr=0.1) sang Adam. Nên đặt lr cho Adam bằng bao nhiêu?"
          options={[
            "Giữ nguyên 0.1 — optimizer không ảnh hưởng LR",
            "Giảm xuống 0.001 — Adam tự điều chỉnh nên cần LR nhỏ hơn nhiều",
            "Tăng lên 1.0 — Adam cần LR lớn hơn SGD",
          ]}
          correct={1}
          explanation="Adam có adaptive learning rate riêng cho từng tham số, nên LR cơ bản cần nhỏ hơn SGD ~10-100 lần. SGD lr=0.1 → Adam lr=0.001 là chuyển đổi phổ biến."
        />
      </LessonSection>

      {/* ===== STEP 7: MINI SUMMARY ===== */}
      <LessonSection step={7} totalSteps={8} label="Tóm tắt">
        <MiniSummary
          title="Learning Rate — Điểm chốt"
          points={[
            "LR là siêu tham số quan trọng nhất: w_mới = w_cũ - α × gradient.",
            "Quá nhỏ → hội tụ chậm. Quá lớn → dao động hoặc phân kỳ. Vừa phải → hội tụ ổn định.",
            "LR scheduling (step decay, cosine annealing, warmup) giảm LR dần để hội tụ chính xác.",
            "Adam mặc định lr=0.001, SGD mặc định lr=0.01-0.1. Chuyển optimizer → phải đổi LR.",
            "Warmup là bắt buộc cho Transformer — tăng LR dần từ 0 trong 5-10% epoch đầu.",
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
