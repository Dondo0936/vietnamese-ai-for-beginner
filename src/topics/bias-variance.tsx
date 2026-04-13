"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX, ToggleCompare, TopicLink, DragDrop,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "bias-variance",
  title: "Bias-Variance Tradeoff",
  titleVi: "Đánh đổi Bias-Variance",
  description: "Sự cân bằng giữa mô hình quá đơn giản (underfitting) và quá phức tạp (overfitting)",
  category: "classic-ml",
  tags: ["theory", "overfitting", "model-selection"],
  difficulty: "intermediate",
  relatedSlugs: ["polynomial-regression", "cross-validation", "random-forests"],
  vizType: "interactive",
};

/* ── Chart calculations ── */
const MAX_C = 10;
const CHART_W = 420;
const CHART_H = 180;
const CHART_X = 45;
const CHART_Y = 30;

function biasVal(c: number) { return Math.max(5, 95 - c * 11); }
function varianceVal(c: number) { return Math.max(5, c * 11 - 8); }
function totalVal(c: number) { return biasVal(c) + varianceVal(c) + 12; }

function curvePath(fn: (c: number) => number, maxRange: number): string {
  return Array.from({ length: MAX_C + 1 }, (_, i) => {
    const x = CHART_X + (i / MAX_C) * CHART_W;
    const y = CHART_Y + CHART_H - (fn(i) / maxRange) * CHART_H;
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

/* Archery target for ToggleCompare */
function ArcheryTarget({ bias, variance, label }: { bias: "high" | "low"; variance: "high" | "low"; label: string }) {
  /* Generate arrow positions */
  function seedRng(s: number) { return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  const rng = seedRng(bias === "high" ? 42 : 99);
  const cx = 100, cy = 100;
  const offsetX = bias === "high" ? 30 : 0;
  const offsetY = bias === "high" ? -25 : 0;
  const spread = variance === "high" ? 35 : 8;

  const arrows = Array.from({ length: 8 }, () => ({
    x: cx + offsetX + (rng() - 0.5) * spread * 2,
    y: cy + offsetY + (rng() - 0.5) * spread * 2,
  }));

  return (
    <svg viewBox="0 0 200 200" className="w-full rounded-lg border border-border bg-background">
      {/* Target rings */}
      {[80, 55, 30, 10].map((r) => (
        <circle key={r} cx={cx} cy={cy} r={r} fill="none"
          stroke={r === 10 ? "#ef4444" : "#e2e8f0"} strokeWidth={r === 10 ? 2 : 1} opacity={0.5} />
      ))}
      <circle cx={cx} cy={cy} r={3} fill="#ef4444" />

      {/* Arrows */}
      {arrows.map((a, i) => (
        <g key={i}>
          <circle cx={a.x} cy={a.y} r={3} fill="#3b82f6" stroke="#fff" strokeWidth={1} />
        </g>
      ))}

      {/* Label */}
      <text x={cx} y={190} fontSize={10} fill="currentColor" className="text-foreground" textAnchor="middle" fontWeight={600}>
        {label}
      </text>
    </svg>
  );
}

const TOTAL_STEPS = 9;

/* ═══════════════ MAIN ═══════════════ */
export default function BiasVarianceTopic() {
  const [complexity, setComplexity] = useState(5);

  const bias = biasVal(complexity);
  const variance = varianceVal(complexity);
  const total = totalVal(complexity);

  const biasPath = useMemo(() => curvePath(biasVal, 200), []);
  const variancePath = useMemo(() => curvePath(varianceVal, 200), []);
  const totalPath = useMemo(() => curvePath(totalVal, 200), []);

  const curX = CHART_X + (complexity / MAX_C) * CHART_W;

  const zone = complexity <= 3 ? "Underfitting" : complexity <= 7 ? "Sweet Spot" : "Overfitting";
  const zoneColor = complexity <= 3 ? "#ef4444" : complexity <= 7 ? "#22c55e" : "#ef4444";

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Mô hình hồi quy tuyến tính trên dữ liệu dạng parabol. Đây là bias cao hay variance cao?",
      options: [
        "Variance cao — mô hình quá nhạy với dữ liệu",
        "Bias cao — mô hình quá đơn giản, không nắm bắt được đường cong",
        "Cả hai đều thấp",
      ],
      correct: 1,
      explanation: "Đường thẳng không thể khớp parabol → sai hệ thống (bias). Dù train thêm dữ liệu, đường thẳng vẫn sai. Đây là underfitting — cần mô hình phức tạp hơn (bậc 2).",
    },
    {
      question: "Random Forest thường có bias-variance profile thế nào so với 1 cây quyết định sâu?",
      options: [
        "Bias cao hơn, variance thấp hơn",
        "Bias tương đương, variance thấp hơn nhiều (nhờ averaging)",
        "Bias thấp hơn, variance cao hơn",
      ],
      correct: 1,
      explanation: "Mỗi cây sâu có bias thấp (linh hoạt) nhưng variance cao. Trung bình nhiều cây → variance giảm mạnh (lỗi ngẫu nhiên bù trừ) trong khi bias gần không đổi. Đây là sức mạnh ensemble!",
    },
    {
      question: "Làm sao biết mô hình đang overfitting?",
      options: [
        "Training accuracy cao, validation accuracy cũng cao",
        "Training accuracy cao nhưng validation accuracy thấp hơn nhiều (khoảng cách lớn)",
        "Cả training và validation accuracy đều thấp",
      ],
      correct: 1,
      explanation: "Khoảng cách lớn giữa train và val accuracy = overfitting. Model 'nhớ' training data nhưng không generalize. Cả hai thấp = underfitting. Cả hai cao = sweet spot!",
    },
    {
      type: "fill-blank",
      question: "Khi độ phức tạp mô hình tăng, {blank} giảm nhưng {blank} tăng. Tổng sai số có dạng đường cong {blank}.",
      blanks: [
        { answer: "bias", accept: ["Bias", "bias²", "Bias²"] },
        { answer: "variance", accept: ["Variance"] },
        { answer: "chữ U", accept: ["hình chữ U", "U"] },
      ],
      explanation: "Đây là bản chất của Bias-Variance Tradeoff: tăng phức tạp → bias giảm, variance tăng. Tổng sai số = Bias² + Variance + Noise có hình chữ U, với 'sweet spot' ở đáy.",
    },
  ], []);

  return (
    <>
      {/* STEP 1: PREDICTION GATE */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn bắn cung. 10 mũi tên đều lệch sang phải 20cm nhưng chụm lại sát nhau. Bạn sẽ sửa gì?"
          options={[
            "Bắn mạnh hơn — mũi tên sẽ thẳng hơn",
            "Chỉnh tầm sang trái 20cm — sai số hệ thống, cần sửa hướng (giảm bias)",
            "Tập trung hơn — mũi tên đang tán loạn",
          ]}
          correct={1}
          explanation="Mũi tên lệch hệ thống = BIAS cao. Mũi tên chụm = variance thấp. Bạn cần sửa hướng (giảm bias), không cần tập trung hơn. Đây chính là tradeoff bias-variance trong ML!"
        />
      </LessonSection>

      {/* STEPS 2 & 3: VISUALIZATIONS */}
      <VisualizationSection topicSlug={metadata.slug}>
        <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Trực quan hoá">
          <p className="mb-4 text-sm text-muted leading-relaxed">
            Bốn tổ hợp bias-variance qua ví dụ bắn cung. Mục tiêu lý tưởng: <strong className="text-foreground">Bias thấp + Variance thấp</strong>{" "}
            (mũi tên chụm quanh hồng tâm).
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <ArcheryTarget bias="low" variance="low" label="Bias thấp + Var thấp" />
              <p className="text-center text-[10px] text-green-500 font-semibold mt-1">MỤC TIÊU</p>
            </div>
            <div>
              <ArcheryTarget bias="high" variance="low" label="Bias cao + Var thấp" />
              <p className="text-center text-[10px] text-muted mt-1">Underfitting</p>
            </div>
            <div>
              <ArcheryTarget bias="low" variance="high" label="Bias thấp + Var cao" />
              <p className="text-center text-[10px] text-muted mt-1">Overfitting</p>
            </div>
            <div>
              <ArcheryTarget bias="high" variance="high" label="Bias cao + Var cao" />
              <p className="text-center text-[10px] text-red-500 font-semibold mt-1">TỆ NHẤT</p>
            </div>
          </div>
        </LessonSection>

        <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Đường cong tradeoff">
          <p className="mb-4 text-sm text-muted leading-relaxed">
            Kéo thanh trượt <strong className="text-foreground">độ phức tạp mô hình</strong>. Bias giảm nhưng variance tăng — tìm điểm tổng sai số thấp nhất!
          </p>

          <div className="space-y-4">
            <svg viewBox="0 0 500 260" className="w-full rounded-lg border border-border bg-background">
              {/* Grid */}
              {[0, 50, 100, 150, 200].map((v) => (
                <line key={v}
                  x1={CHART_X} y1={CHART_Y + CHART_H - (v / 200) * CHART_H}
                  x2={CHART_X + CHART_W} y2={CHART_Y + CHART_H - (v / 200) * CHART_H}
                  stroke="currentColor" className="text-border" strokeWidth={0.5}
                />
              ))}

              {/* Curves */}
              <path d={biasPath} fill="none" stroke="#3b82f6" strokeWidth={2.5} />
              <path d={variancePath} fill="none" stroke="#f97316" strokeWidth={2.5} />
              <path d={totalPath} fill="none" stroke="#ef4444" strokeWidth={2} strokeDasharray="6 3" />

              {/* Current position line */}
              <motion.line
                x1={curX} y1={CHART_Y} x2={curX} y2={CHART_Y + CHART_H}
                stroke={zoneColor} strokeWidth={1.5} strokeDasharray="4 3"
                animate={{ x1: curX, x2: curX }}
                transition={{ type: "spring", stiffness: 150, damping: 20 }}
              />

              {/* Zone label */}
              <motion.text
                x={curX} y={CHART_Y - 8} fontSize={12} fill={zoneColor}
                textAnchor="middle" fontWeight={700}
                animate={{ x: curX }}
              >
                {zone}
              </motion.text>

              {/* Axis labels */}
              <text x={CHART_X + CHART_W / 2} y={CHART_Y + CHART_H + 22} fontSize={10} fill="currentColor" className="text-muted" textAnchor="middle">
                Complexity (bậc đa thức, chiều sâu cây, ...)
              </text>

              {/* Legend */}
              <g transform={`translate(${CHART_X}, ${CHART_Y + CHART_H + 34})`}>
                <line x1={0} y1={0} x2={20} y2={0} stroke="#3b82f6" strokeWidth={2.5} />
                <text x={25} y={4} fontSize={9} fill="#3b82f6">Bias²</text>
                <line x1={80} y1={0} x2={100} y2={0} stroke="#f97316" strokeWidth={2.5} />
                <text x={105} y={4} fontSize={9} fill="#f97316">Variance</text>
                <line x1={170} y1={0} x2={190} y2={0} stroke="#ef4444" strokeWidth={2} strokeDasharray="6 3" />
                <text x={195} y={4} fontSize={9} fill="#ef4444">Tổng sai số</text>
              </g>
            </svg>

            {/* Slider */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-foreground whitespace-nowrap">Phức tạp:</label>
              <input type="range" min={0} max={10} value={complexity}
                onChange={(e) => setComplexity(Number(e.target.value))} className="flex-1 accent-accent" />
              <span className="w-6 text-center text-sm font-bold" style={{ color: zoneColor }}>{complexity}</span>
            </div>

            {/* Value cards */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg border border-blue-200 dark:border-blue-800 p-2 bg-blue-50/50 dark:bg-blue-900/10">
                <div className="font-bold text-blue-500">Bias²</div>
                <div className="text-lg font-bold text-blue-600">{bias}</div>
              </div>
              <div className="rounded-lg border border-orange-200 dark:border-orange-800 p-2 bg-orange-50/50 dark:bg-orange-900/10">
                <div className="font-bold text-orange-500">Variance</div>
                <div className="text-lg font-bold text-orange-600">{variance}</div>
              </div>
              <div className="rounded-lg border border-red-200 dark:border-red-800 p-2 bg-red-50/50 dark:bg-red-900/10">
                <div className="font-bold text-red-500">Tổng</div>
                <div className="text-lg font-bold text-red-600">{total}</div>
              </div>
            </div>
          </div>
        </LessonSection>
      </VisualizationSection>

      {/* STEP 4: AHA + CHALLENGE */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>Bias-Variance Tradeoff:</strong>{" "}
            Mô hình đơn giản → bias cao (sai hệ thống). Mô hình phức tạp → variance cao (nhạy dữ liệu). Tổng sai số có dạng chữ U — &quot;sweet spot&quot; ở đáy!
          </p>
        </AhaMoment>

        <InlineChallenge
          question="Training accuracy 99%, validation accuracy 70%. Mô hình đang ở đâu trên đường cong?"
          options={[
            "Underfitting (bên trái) — cần tăng phức tạp",
            "Overfitting (bên phải) — cần giảm phức tạp hoặc thêm dữ liệu",
            "Sweet spot — kết quả tốt rồi",
          ]}
          correct={1}
          explanation="Khoảng cách train (99%) vs val (70%) = 29% → overfitting rõ ràng. Mô hình 'nhớ' training data nhưng không generalize. Giải pháp: regularization, early stopping, thêm dữ liệu, hoặc giảm phức tạp."
        />
      </LessonSection>

      {/* STEP 5: EXPLANATION */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            Sai số dự đoán phân rã thành 3 thành phần:
          </p>

          <LaTeX block>{"\\text{E}[(y - \\hat{f}(x))^2] = \\text{Bias}^2(\\hat{f}) + \\text{Var}(\\hat{f}) + \\sigma^2"}</LaTeX>

          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>Bias²:</strong>{" "}
              <LaTeX>{"(\\text{E}[\\hat{f}(x)] - f(x))^2"}</LaTeX> — sai số do giả định sai. Mô hình đơn giản → bias cao.
            </li>
            <li>
              <strong>Variance:</strong>{" "}
              <LaTeX>{"\\text{E}[(\\hat{f}(x) - \\text{E}[\\hat{f}(x)])^2]"}</LaTeX> — sai số do nhạy với training data. Mô hình phức tạp → variance cao.
            </li>
            <li>
              <strong>Irreducible error</strong>{" "}<LaTeX>{"\\sigma^2"}</LaTeX>: noise trong dữ liệu — không thể giảm.
            </li>
          </ul>

          <Callout variant="tip" title="Chẩn đoán nhanh">
            <TopicLink slug="overfitting-underfitting">Underfitting</TopicLink>{" "}(bias cao): train acc thấp, val acc thấp. Khoảng cách nhỏ.{"\n"}
            Overfitting (variance cao): train acc cao, val acc thấp. Khoảng cách lớn.{"\n"}
            Good fit: cả hai cao, khoảng cách nhỏ. Dùng <TopicLink slug="cross-validation">cross-validation</TopicLink>{" "}để ước lượng ổn định hơn.
          </Callout>

          <p><strong>Cách giảm bias:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>Tăng phức tạp mô hình (thêm features, tăng bậc, tăng layers)</li>
            <li>Giảm regularization</li>
            <li>Thêm features quan trọng</li>
          </ul>

          <p><strong>Cách giảm variance:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>Thêm dữ liệu huấn luyện</li>
            <li><TopicLink slug="regularization">Regularization</TopicLink>{" "}(L1/L2, dropout)</li>
            <li>Ensemble (bagging/<TopicLink slug="random-forests">Random Forest</TopicLink>)</li>
            <li>Giảm phức tạp mô hình</li>
            <li>Early stopping</li>
          </ul>

          <CodeBlock language="python" title="Chẩn đoán bias-variance">
{`from sklearn.model_selection import learning_curve
from sklearn.tree import DecisionTreeClassifier
import numpy as np

model = DecisionTreeClassifier(max_depth=None)  # Có thể overfit

# Learning curve: train size vs accuracy
train_sizes, train_scores, val_scores = learning_curve(
    model, X, y, cv=5,
    train_sizes=np.linspace(0.1, 1.0, 10),
    scoring="accuracy",
)

train_mean = train_scores.mean(axis=1)
val_mean = val_scores.mean(axis=1)

# Nếu train_mean >> val_mean → OVERFITTING
# Nếu cả hai thấp → UNDERFITTING
gap = train_mean[-1] - val_mean[-1]
print(f"Train: {train_mean[-1]:.1%}, Val: {val_mean[-1]:.1%}")
print(f"Gap: {gap:.1%} → {'Overfitting!' if gap > 0.1 else 'OK'}")`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      {/* STEP 6: TOGGLE COMPARE — Underfitting vs Overfitting */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="So sánh">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          So sánh trực quan triệu chứng và giải pháp cho hai thái cực của bias-variance tradeoff.
        </p>
        <ToggleCompare
          labelA="Underfitting (Bias cao)"
          labelB="Overfitting (Variance cao)"
          description="Hai vấn đề đối lập — hiểu rõ từng bên để chọn đúng hướng cải thiện."
          childA={
            <div className="space-y-2 p-4 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Triệu chứng</p>
              <ul className="text-sm space-y-1 text-blue-800 dark:text-blue-300 list-disc list-inside">
                <li>Train acc thấp, Val acc thấp</li>
                <li>Khoảng cách train–val nhỏ</li>
                <li>Mô hình quá đơn giản</li>
              </ul>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-3">Giải pháp</p>
              <ul className="text-sm space-y-1 text-blue-800 dark:text-blue-300 list-disc list-inside">
                <li>Tăng độ phức tạp mô hình</li>
                <li>Thêm features quan trọng</li>
                <li>Giảm regularization</li>
              </ul>
            </div>
          }
          childB={
            <div className="space-y-2 p-4 rounded-lg bg-red-50/50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">Triệu chứng</p>
              <ul className="text-sm space-y-1 text-red-800 dark:text-red-300 list-disc list-inside">
                <li>Train acc cao, Val acc thấp</li>
                <li>Khoảng cách train–val lớn</li>
                <li>Mô hình quá phức tạp</li>
              </ul>
              <p className="text-sm font-semibold text-red-600 dark:text-red-400 mt-3">Giải pháp</p>
              <ul className="text-sm space-y-1 text-red-800 dark:text-red-300 list-disc list-inside">
                <li>Thêm dữ liệu huấn luyện</li>
                <li>Regularization, Dropout</li>
                <li>Ensemble (Random Forest)</li>
              </ul>
            </div>
          }
        />
      </LessonSection>

      {/* STEP 7: DRAGDROP — Chẩn đoán triệu chứng */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Bài tập chẩn đoán">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Kéo từng triệu chứng vào ô chẩn đoán đúng: <strong className="text-foreground">Underfitting</strong> hay <strong className="text-foreground">Overfitting</strong>?
        </p>
        <DragDrop
          instruction="Kéo từng mô tả vào cột chẩn đoán phù hợp."
          items={[
            { id: "sym-a", label: "Train loss = 0.02, Val loss = 2.1" },
            { id: "sym-b", label: "Train loss = 1.8, Val loss = 1.9" },
            { id: "sym-c", label: "Mô hình bậc 1 khớp dữ liệu bậc 3" },
            { id: "sym-d", label: "Mô hình học thuộc nhiễu trong dữ liệu" },
            { id: "sym-e", label: "Khoảng cách train–val = 25%" },
            { id: "sym-f", label: "Cả train và val accuracy đều thấp" },
          ]}
          zones={[
            { id: "zone-overfit", label: "Overfitting (Variance cao)", accepts: ["sym-a", "sym-d", "sym-e"] },
            { id: "zone-underfit", label: "Underfitting (Bias cao)", accepts: ["sym-b", "sym-c", "sym-f"] },
          ]}
        />
        <Callout variant="insight" title="Ví dụ thực tế: Dự đoán giá nhà TP.HCM">
          Một nhóm sinh viên xây mô hình dự đoán giá nhà tại TP.HCM với 500 mẫu. Mô hình hồi quy tuyến tính đơn giản cho RMSE 800 triệu đồng trên tập train và 820 triệu trên tập validation — khoảng cách nhỏ nhưng sai số vẫn lớn.{" "}
          Đây là dấu hiệu <strong>underfitting</strong>: mô hình quá đơn giản để nắm bắt sự phức tạp của thị trường bất động sản (vị trí, diện tích, tầng, hẻm hay mặt tiền...). Giải pháp: thêm features (khoảng cách trung tâm, chất lượng đường) và dùng mô hình phi tuyến như{" "}
          <TopicLink slug="random-forests">Random Forest</TopicLink>.
        </Callout>
      </LessonSection>

      {/* STEP 8: SUMMARY */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "Tổng sai số = Bias² + Variance + Noise. Bias: sai hệ thống. Variance: nhạy dữ liệu.",
          "Tăng phức tạp: bias giảm, variance tăng. Đường cong tổng sai số hình chữ U.",
          "Underfitting: train & val đều thấp. Overfitting: train cao, val thấp. Sweet spot: cả hai cao.",
          "Giảm bias: tăng phức tạp, thêm features. Giảm variance: thêm data, regularization, ensemble.",
          "Learning curve là công cụ chẩn đoán tốt nhất — vẽ train vs val accuracy theo lượng data.",
        ]} />
      </LessonSection>

      {/* STEP 9: QUIZ */}
      <LessonSection step={9} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
