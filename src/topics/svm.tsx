"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "svm",
  title: "Support Vector Machine",
  titleVi: "Máy vector hỗ trợ",
  description: "Thuật toán phân loại tìm siêu phẳng có khoảng cách lề lớn nhất giữa hai lớp",
  category: "classic-ml",
  tags: ["classification", "supervised-learning", "kernel"],
  difficulty: "intermediate",
  relatedSlugs: ["logistic-regression", "knn", "decision-trees"],
  vizType: "interactive",
};

/* ── Data points ── */
type Pt = { x: number; y: number };

const CLASS_A: Pt[] = [
  { x: 60, y: 60 }, { x: 85, y: 130 }, { x: 100, y: 80 },
  { x: 130, y: 160 }, { x: 90, y: 190 }, { x: 70, y: 145 },
  { x: 120, y: 105 }, { x: 55, y: 110 },
];

const CLASS_B: Pt[] = [
  { x: 340, y: 70 }, { x: 365, y: 145 }, { x: 395, y: 100 },
  { x: 375, y: 200 }, { x: 415, y: 160 }, { x: 435, y: 90 },
  { x: 405, y: 230 }, { x: 350, y: 180 },
];

/* Find closest point to boundary for support vector indication */
function closestToLine(pts: Pt[], bx: number): Pt {
  let best = pts[0], minD = Infinity;
  for (const p of pts) {
    const d = Math.abs(p.x - bx);
    if (d < minD) { minD = d; best = p; }
  }
  return best;
}

const TOTAL_STEPS = 7;

/* ═══════════════ MAIN ═══════════════ */
export default function SvmTopic() {
  const [boundaryX, setBoundaryX] = useState(230);
  const [margin, setMargin] = useState(60);
  const [showSV, setShowSV] = useState(true);

  /* Support vectors: closest point from each class */
  const svA = useMemo(() => closestToLine(CLASS_A, boundaryX), [boundaryX]);
  const svB = useMemo(() => closestToLine(CLASS_B, boundaryX), [boundaryX]);

  /* Count violations (points inside margin) */
  const violations = useMemo(() => {
    let count = 0;
    for (const p of CLASS_A) if (p.x > boundaryX - margin) count++;
    for (const p of CLASS_B) if (p.x < boundaryX + margin) count++;
    return count;
  }, [boundaryX, margin]);

  /* Optimal margin: distance from boundary to nearest support vector */
  const optimalMargin = useMemo(() => {
    const distA = Math.abs(svA.x - boundaryX);
    const distB = Math.abs(svB.x - boundaryX);
    return Math.min(distA, distB);
  }, [svA, svB, boundaryX]);

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Tại sao SVM tìm margin lớn nhất thay vì chỉ cần phân tách đúng?",
      options: [
        "Margin lớn chạy nhanh hơn",
        "Margin lớn → dữ liệu mới rơi vào vùng an toàn → generalize tốt hơn",
        "Margin lớn → training accuracy cao hơn",
      ],
      correct: 1,
      explanation: "Margin lớn = vùng đệm rộng giữa hai lớp. Điểm mới khó rơi vào vùng mơ hồ → ít bị phân loại sai. Đây là nguyên lý structural risk minimization.",
    },
    {
      question: "Kernel trick trong SVM giải quyết vấn đề gì?",
      options: [
        "Tăng tốc độ huấn luyện",
        "Phân loại dữ liệu không thể phân tách tuyến tính bằng cách chiếu lên chiều cao hơn",
        "Giảm số support vectors",
      ],
      correct: 1,
      explanation: "Kernel trick tính dot product trong không gian chiều cao MÀ KHÔNG thực sự chiếu. Ví dụ: dữ liệu hình tròn (không tách tuyến tính) → chiếu lên 3D → tách được bằng mặt phẳng.",
    },
    {
      question: "Tham số C trong SVM (soft margin) kiểm soát gì?",
      options: [
        "Số chiều của kernel",
        "Tradeoff giữa margin lớn và cho phép ít vi phạm",
        "Tốc độ hội tụ của thuật toán",
      ],
      correct: 1,
      explanation: "C lớn → phạt nặng vi phạm → margin hẹp, ít lỗi train (có thể overfit). C nhỏ → cho phép vi phạm → margin rộng, mượt hơn (có thể underfit).",
    },
  ], []);

  return (
    <>
      {/* STEP 1: PREDICTION GATE */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Trên sân trường, nhóm A đứng bên trái, nhóm B bên phải. Bạn cần kẻ một đường phân chia. Đường nào tốt nhất?"
          options={[
            "Đường sát nhóm A — miễn là phân tách được",
            "Đường cách đều hai nhóm nhất — tạo 'vùng đệm' rộng nhất",
            "Bất kỳ đường nào chia đúng — không quan trọng vị trí",
          ]}
          correct={1}
          explanation="Đường cách đều hai nhóm tạo 'vùng đệm' (margin) rộng nhất. Học sinh mới đứng trong vùng đệm vẫn được phân loại đúng. SVM tìm chính xác đường này!"
        >

      {/* STEP 2: INTERACTIVE VIZ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Kéo thanh trượt để di chuyển <strong className="text-foreground">ranh giới quyết định</strong>{" "}
          và thay đổi <strong className="text-foreground">khoảng cách margin</strong>. Tìm vị trí có margin lớn nhất mà không vi phạm!
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            <svg viewBox="0 0 500 300" className="w-full rounded-lg border border-border bg-background">
              {/* Background regions */}
              <rect x={0} y={0} width={boundaryX - margin} height={300} fill="#3b82f6" opacity={0.04} />
              <rect x={boundaryX + margin} y={0} width={500 - boundaryX - margin} height={300} fill="#ef4444" opacity={0.04} />

              {/* Margin zone */}
              <motion.rect
                x={boundaryX - margin} y={0} width={margin * 2} height={300}
                fill="#8b5cf6" opacity={0.08}
                animate={{ x: boundaryX - margin, width: margin * 2 }}
                transition={{ type: "spring", stiffness: 150, damping: 20 }}
              />

              {/* Margin boundaries */}
              <motion.line
                x1={boundaryX - margin} y1={0} x2={boundaryX - margin} y2={300}
                stroke="#8b5cf6" strokeWidth={1} strokeDasharray="4 3" opacity={0.5}
                animate={{ x1: boundaryX - margin, x2: boundaryX - margin }}
              />
              <motion.line
                x1={boundaryX + margin} y1={0} x2={boundaryX + margin} y2={300}
                stroke="#8b5cf6" strokeWidth={1} strokeDasharray="4 3" opacity={0.5}
                animate={{ x1: boundaryX + margin, x2: boundaryX + margin }}
              />

              {/* Decision boundary (hyperplane) */}
              <motion.line
                x1={boundaryX} y1={0} x2={boundaryX} y2={300}
                stroke="#8b5cf6" strokeWidth={2.5}
                animate={{ x1: boundaryX, x2: boundaryX }}
              />

              {/* Support vector indicators */}
              {showSV && (
                <>
                  <motion.circle
                    cx={svA.x} cy={svA.y} r={10}
                    fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 2"
                    animate={{ cx: svA.x, cy: svA.y }}
                  />
                  <motion.circle
                    cx={svB.x} cy={svB.y} r={10}
                    fill="none" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 2"
                    animate={{ cx: svB.x, cy: svB.y }}
                  />
                  {/* Distance lines to boundary */}
                  <motion.line
                    x1={svA.x} y1={svA.y} x2={boundaryX} y2={svA.y}
                    stroke="#3b82f6" strokeWidth={1} strokeDasharray="3 3" opacity={0.4}
                    animate={{ x1: svA.x, x2: boundaryX }}
                  />
                  <motion.line
                    x1={svB.x} y1={svB.y} x2={boundaryX} y2={svB.y}
                    stroke="#ef4444" strokeWidth={1} strokeDasharray="3 3" opacity={0.4}
                    animate={{ x1: svB.x, x2: boundaryX }}
                  />
                </>
              )}

              {/* Class A points */}
              {CLASS_A.map((p, i) => {
                const inMargin = p.x > boundaryX - margin;
                return (
                  <circle key={`a-${i}`} cx={p.x} cy={p.y} r={5}
                    fill="#3b82f6" stroke={inMargin ? "#fbbf24" : "#fff"} strokeWidth={inMargin ? 2.5 : 1.5} />
                );
              })}

              {/* Class B points */}
              {CLASS_B.map((p, i) => {
                const inMargin = p.x < boundaryX + margin;
                return (
                  <circle key={`b-${i}`} cx={p.x} cy={p.y} r={5}
                    fill="#ef4444" stroke={inMargin ? "#fbbf24" : "#fff"} strokeWidth={inMargin ? 2.5 : 1.5} />
                );
              })}

              {/* Labels */}
              <text x={10} y={20} fontSize={12} fill="currentColor" className="text-foreground" fontWeight={600}>
                Margin: {margin * 2}px
              </text>
              <text x={10} y={38} fontSize={11} fill={violations > 0 ? "#ef4444" : "#22c55e"}>
                Vi phạm: {violations} điểm {violations === 0 ? "(hoàn hảo!)" : ""}
              </text>
              <text x={10} y={54} fontSize={10} fill="currentColor" className="text-muted">
                Margin tối ưu: ~{(optimalMargin * 2).toFixed(0)}px
              </text>
            </svg>

            {/* Controls */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <label className="w-24 text-xs font-medium text-muted">Ranh giới</label>
                <input type="range" min={120} max={360} value={boundaryX} onChange={(e) => setBoundaryX(Number(e.target.value))} className="flex-1 accent-purple-500" />
              </div>
              <div className="flex items-center gap-3">
                <label className="w-24 text-xs font-medium text-muted">Nửa margin</label>
                <input type="range" min={10} max={130} value={margin} onChange={(e) => setMargin(Number(e.target.value))} className="flex-1 accent-purple-500" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSV((v) => !v)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                {showSV ? "Ẩn Support Vectors" : "Hiện Support Vectors"}
              </button>
              <button
                onClick={() => { setBoundaryX(230); setMargin(optimalMargin); }}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                Margin tối ưu
              </button>
            </div>

            <p className="text-xs text-muted">
              Viền vàng = điểm nằm TRONG margin (vi phạm). Support vectors = điểm gần ranh giới nhất (vòng tròn nét đứt).
            </p>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* STEP 3: AHA */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>SVM</strong>{" "}
            tìm ranh giới có margin LỚN NHẤT giữa hai lớp. Chỉ các điểm gần ranh giới nhất (support vectors) mới quyết định vị trí đường — các điểm xa không ảnh hưởng!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* STEP 4: CHALLENGE */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Dữ liệu nằm thành vòng tròn: lớp A ở giữa, lớp B bao quanh. Đường thẳng có thể phân tách không?"
          options={[
            "Có — chỉ cần đường thẳng đúng vị trí",
            "Không — nhưng kernel trick chiếu lên chiều cao hơn thì tách được",
            "Không — SVM không xử lý được trường hợp này",
          ]}
          correct={1}
          explanation="Dữ liệu vòng tròn không tách tuyến tính! Kernel RBF chiếu lên 3D: thêm chiều z = x² + y² → lớp A 'nổi' lên cao, lớp B ở thấp → tách bằng mặt phẳng ngang!"
        />
      </LessonSection>

      {/* STEP 5: EXPLANATION */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>SVM</strong>{" "}
            tìm siêu phẳng (hyperplane) phân tách hai lớp sao cho margin lớn nhất:
          </p>

          <LaTeX block>{"\\min_{\\mathbf{w}, b} \\frac{1}{2}||\\mathbf{w}||^2 \\quad \\text{sao cho } y_i(\\mathbf{w}^T\\mathbf{x}_i + b) \\geq 1, \\forall i"}</LaTeX>

          <p>
            Margin = <LaTeX>{"\\frac{2}{||\\mathbf{w}||}"}</LaTeX>. Tối thiểu <LaTeX>{"||\\mathbf{w}||"}</LaTeX> = tối đa margin.
          </p>

          <p><strong>Soft margin (C parameter):</strong>{" "}Cho phép một số vi phạm:</p>

          <LaTeX block>{"\\min_{\\mathbf{w}, b, \\xi} \\frac{1}{2}||\\mathbf{w}||^2 + C\\sum_{i=1}^{n}\\xi_i"}</LaTeX>

          <p>
            C lớn → phạt nặng vi phạm → margin hẹp. C nhỏ → margin rộng, cho phép sai.
          </p>

          <p><strong>Kernel Trick:</strong></p>

          <LaTeX block>{"K(\\mathbf{x}_i, \\mathbf{x}_j) = \\phi(\\mathbf{x}_i)^T \\phi(\\mathbf{x}_j)"}</LaTeX>

          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Linear:</strong> <LaTeX>{"K(x, z) = x^T z"}</LaTeX></li>
            <li><strong>RBF (Gaussian):</strong> <LaTeX>{"K(x, z) = e^{-\\gamma ||x-z||^2}"}</LaTeX> — phổ biến nhất</li>
            <li><strong>Polynomial:</strong> <LaTeX>{"K(x, z) = (x^T z + c)^d"}</LaTeX></li>
          </ul>

          <Callout variant="tip" title="Khi nào dùng SVM?">
            Tốt nhất khi: dữ liệu nhỏ-vừa, chiều cao, cần ranh giới phi tuyến rõ ràng. Ví dụ: phân loại ảnh y khoa, nhận dạng chữ viết tay, phát hiện spam.
          </Callout>

          <CodeBlock language="python" title="SVM với scikit-learn">
{`from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.model_selection import cross_val_score

# QUAN TRỌNG: SVM cần chuẩn hoá dữ liệu!
model_linear = make_pipeline(StandardScaler(), SVC(kernel="linear", C=1.0))
model_rbf = make_pipeline(StandardScaler(), SVC(kernel="rbf", C=1.0, gamma="scale"))

from sklearn.datasets import load_iris
X, y = load_iris(return_X_y=True)

print(f"Linear SVM: {cross_val_score(model_linear, X, y, cv=5).mean():.1%}")
print(f"RBF SVM:    {cross_val_score(model_rbf, X, y, cv=5).mean():.1%}")`}
          </CodeBlock>

          <Callout variant="warning" title="Nhớ chuẩn hoá!">
            SVM dùng khoảng cách → feature có thang lớn sẽ áp đảo. LUÔN dùng StandardScaler trước SVM. Đây là sai lầm phổ biến nhất khi mới dùng SVM!
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* STEP 6: SUMMARY */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "SVM tìm siêu phẳng có margin LỚN NHẤT giữa hai lớp → generalize tốt.",
          "Support vectors = điểm gần ranh giới nhất — chỉ chúng quyết định vị trí siêu phẳng.",
          "Kernel trick cho phép phân loại phi tuyến: RBF, polynomial, sigmoid.",
          "C: tradeoff margin rộng vs ít vi phạm. γ (RBF): kiểm soát phạm vi ảnh hưởng mỗi điểm.",
          "LUÔN chuẩn hoá dữ liệu trước khi dùng SVM! Tốt cho dữ liệu nhỏ, chiều cao.",
        ]} />
      </LessonSection>

      {/* STEP 7: QUIZ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>

        </PredictionGate>
      </LessonSection>
    </>
  );
}
