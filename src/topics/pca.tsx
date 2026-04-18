"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
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
  slug: "pca",
  title: "Principal Component Analysis",
  titleVi: "Phân tích thành phần chính",
  description: "Giảm chiều dữ liệu bằng cách tìm các hướng có phương sai lớn nhất",
  category: "classic-ml",
  tags: ["dimensionality-reduction", "unsupervised-learning"],
  difficulty: "intermediate",
  relatedSlugs: ["t-sne", "k-means", "linear-regression"],
  vizType: "interactive",
};

/* ── Data with natural PC direction ── */
type Pt = { x: number; y: number };

const DATA: Pt[] = [
  { x: 60, y: 225 }, { x: 100, y: 200 }, { x: 140, y: 180 },
  { x: 170, y: 160 }, { x: 210, y: 145 }, { x: 250, y: 125 },
  { x: 290, y: 110 }, { x: 330, y: 95 }, { x: 370, y: 75 },
  { x: 400, y: 60 }, { x: 120, y: 215 }, { x: 200, y: 165 },
  { x: 280, y: 130 }, { x: 350, y: 85 }, { x: 80, y: 190 },
  { x: 310, y: 100 },
];

const CX = 250;
const CY = 140;

/* Compute explained variance ratio for given angle */
function computeVariance(pts: Pt[], angleRad: number) {
  const cosA = Math.cos(angleRad);
  const sinA = Math.sin(angleRad);
  const projections = pts.map((p) => (p.x - CX) * cosA + (p.y - CY) * sinA);
  const mean = projections.reduce((a, b) => a + b, 0) / projections.length;
  return projections.reduce((s, v) => s + (v - mean) ** 2, 0) / projections.length;
}

function totalVariance(pts: Pt[]) {
  const mX = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const mY = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  return pts.reduce((s, p) => s + (p.x - mX) ** 2 + (p.y - mY) ** 2, 0) / pts.length;
}

const TOTAL_STEPS = 7;

/* ═══════════════ MAIN ═══════════════ */
export default function PcaTopic() {
  const [angle, setAngle] = useState(35);
  // Pilot: click to add, drag to move — PC1 tối ưu tự cập nhật theo cloud.
  const [points, setPoints] = useState<Pt[]>(DATA);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const reduce = useReducedMotion();

  const rad = (angle * Math.PI) / 180;
  const cosA = Math.cos(rad);
  const sinA = Math.sin(rad);

  const projected = useMemo(() => points.map((p) => {
    const proj = (p.x - CX) * cosA + (p.y - CY) * sinA;
    return { px: CX + proj * cosA, py: CY + proj * sinA, origX: p.x, origY: p.y };
  }), [cosA, sinA, points]);

  const variance = useMemo(() => computeVariance(points, rad), [rad, points]);
  const total = useMemo(() => totalVariance(points), [points]);
  const explainedRatio = total > 0 ? Math.min(1, variance / total) : 0;
  const optimalAngle = useMemo(() => {
    let best = 0, bestVar = 0;
    for (let a = 0; a < 180; a++) {
      const v = computeVariance(points, (a * Math.PI) / 180);
      if (v > bestVar) { bestVar = v; best = a; }
    }
    return best;
  }, [points]);

  const toSvg = useCallback((cx: number, cy: number): Pt => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return {
      x: Math.max(5, Math.min(495, ((cx - r.left) * 500) / r.width)),
      y: Math.max(5, Math.min(295, ((cy - r.top) * 300) / r.height)),
    };
  }, []);
  const onSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (dragIdx !== null) return;
    setPoints((prev) => [...prev, toSvg(e.clientX, e.clientY)]);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragIdx === null) return;
    const p = toSvg(e.clientX, e.clientY);
    setPoints((prev) => prev.map((pt, i) => (i === dragIdx ? p : pt)));
  };

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "PCA chọn thành phần chính đầu tiên (PC1) theo tiêu chí nào?",
      options: [
        "Hướng có tổng khoảng cách đến gốc nhỏ nhất",
        "Hướng có phương sai (variance) lớn nhất — giữ nhiều thông tin nhất",
        "Hướng ngẫu nhiên",
      ],
      correct: 1,
      explanation: "PCA chọn hướng mà dữ liệu 'trải ra' nhiều nhất → phương sai cực đại. Chiếu lên hướng này mất ít thông tin nhất. PC2 vuông góc PC1, phương sai lớn thứ hai.",
    },
    {
      question: "Dữ liệu 100 chiều, PCA giữ 10 PC đầu giải thích 95% variance. Có mất thông tin không?",
      options: [
        "Không mất gì — 95% là đủ",
        "Mất 5% thông tin, nhưng giảm từ 100 xuống 10 chiều là tradeoff rất tốt",
        "Mất 90 chiều = mất 90% thông tin",
      ],
      correct: 1,
      explanation: "95% variance được giữ → chỉ mất 5% 'thông tin' (chủ yếu noise). Đổi lại giảm 90 chiều → mô hình nhanh hơn, ít overfitting hơn. Trong thực tế thường chọn ngưỡng 90-99%.",
    },
    {
      question: "Trước khi chạy PCA, bước tiền xử lý nào BẮT BUỘC?",
      options: [
        "Chuẩn hoá dữ liệu (StandardScaler) — đưa về mean=0, std=1",
        "Loại bỏ outlier",
        "One-hot encoding",
      ],
      correct: 0,
      explanation: "PCA nhạy với scale! Feature có thang lớn (thu nhập: triệu) áp đảo feature thang nhỏ (tuổi: chục). StandardScaler đưa mọi feature về cùng thang → PCA công b��ng.",
    },
  ], []);

  return (
    <>
      {/* STEP 1: PREDICTION GATE */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn chụp ảnh bóng một vật 3D lên tường. Muốn bóng giữ nhiều chi tiết nhất, bạn chiếu từ góc nào?"
          options={[
            "Chiếu từ phía trước — bóng phẳng nhất",
            "Chiếu từ góc mà bóng 'trải ra' rộng nhất — giữ nhiều hình dạng nhất",
            "Không quan trọng — mọi góc cho cùng bóng",
          ]}
          correct={1}
          explanation="Góc chiếu cho bóng rộng nhất = giữ nhiều thông tin nhất. PCA làm y hệt: tìm 'góc chiếu' (hướng) mà dữ liệu trải ra nhiều nhất khi giảm chiều!"
        >

      {/* STEP 2: INTERACTIVE VIZ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-4">
            <p className="text-xs text-muted">
              Xoay trục bằng thanh trượt; <strong>nhấn nền</strong> để thêm điểm, <strong>kéo chấm cam</strong> để di chuyển.
            </p>
            <svg ref={svgRef} viewBox="0 0 500 300"
              className="w-full cursor-crosshair touch-none select-none rounded-lg border border-border bg-background"
              role="img" aria-label={`PCA, góc ${angle}°, giữ ${(explainedRatio * 100).toFixed(0)}% phương sai`}
              onClick={onSvgClick} onPointerMove={onPointerMove}
              onPointerUp={() => setDragIdx(null)} onPointerLeave={() => setDragIdx(null)}>
              <title>Trục PC1 góc {angle} độ, giữ lại {(explainedRatio * 100).toFixed(0)} phần trăm phương sai</title>
              {/* Principal axis */}
              <motion.line
                x1={CX - 230 * cosA} y1={CY - 230 * sinA}
                x2={CX + 230 * cosA} y2={CY + 230 * sinA}
                stroke="#3b82f6" strokeWidth={2} opacity={0.35}
                animate={{
                  x1: CX - 230 * cosA, y1: CY - 230 * sinA,
                  x2: CX + 230 * cosA, y2: CY + 230 * sinA,
                }}
                transition={{ type: "spring", stiffness: 150, damping: 20 }}
              />

              {/* Arrow on axis */}
              <motion.polygon
                points={`${CX + 220 * cosA},${CY + 220 * sinA} ${CX + 210 * cosA - 6 * sinA},${CY + 210 * sinA + 6 * cosA} ${CX + 210 * cosA + 6 * sinA},${CY + 210 * sinA - 6 * cosA}`}
                fill="#3b82f6" opacity={0.6}
                animate={{
                  points: `${CX + 220 * cosA},${CY + 220 * sinA} ${CX + 210 * cosA - 6 * sinA},${CY + 210 * sinA + 6 * cosA} ${CX + 210 * cosA + 6 * sinA},${CY + 210 * sinA - 6 * cosA}`,
                }}
              />

              {/* Projection lines */}
              {projected.map((p, i) => (
                <motion.line
                  key={`proj-${i}`}
                  x1={p.origX} y1={p.origY} x2={p.px} y2={p.py}
                  stroke="#8b5cf6" strokeWidth={0.8} strokeDasharray="3 2" opacity={0.35}
                  animate={{ x2: p.px, y2: p.py }}
                  transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 150, damping: 20 }}
                />
              ))}

              {/* Original points (draggable) */}
              {points.map((p, i) => (
                <circle key={`orig-${i}`} cx={p.x} cy={p.y} r={5}
                  fill="#f97316" stroke="#fff" strokeWidth={1}
                  className="cursor-grab active:cursor-grabbing"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    (e.target as Element).setPointerCapture(e.pointerId);
                    setDragIdx(i);
                  }} />
              ))}

              {/* Projected points */}
              {projected.map((p, i) => (
                <motion.circle
                  key={`proj-${i}`} r={4} fill="#3b82f6" stroke="#fff" strokeWidth={1}
                  animate={{ cx: p.px, cy: p.py }}
                  transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 150, damping: 20 }}
                />
              ))}

              {/* Labels */}
              <text x={10} y={20} fontSize={12} fill="#3b82f6" fontWeight={600}>
                PC1 (Góc: {angle}°)
              </text>
              <text x={10} y={38} fontSize={11} fill="currentColor" className="text-muted">
                Variance giữ lại: {(explainedRatio * 100).toFixed(0)}%
              </text>

              {/* Legend */}
              <circle cx={400} cy={14} r={4} fill="#f97316" />
              <text x={410} y={18} fontSize={9} fill="currentColor" className="text-muted">Gốc (2D)</text>
              <circle cx={400} cy={30} r={4} fill="#3b82f6" />
              <text x={410} y={34} fontSize={9} fill="currentColor" className="text-muted">Chiếu (1D)</text>
            </svg>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-foreground whitespace-nowrap">Góc trục:</label>
              <input type="range" min={0} max={180} value={angle}
                onChange={(e) => setAngle(Number(e.target.value))} className="flex-1 accent-accent" />
              <span className="w-10 text-center text-sm font-bold text-accent">{angle}°</span>
            </div>

            {/* Variance bar */}
            <div className="rounded-lg border border-border p-3 bg-card">
              <div className="flex items-center justify-between text-xs text-muted mb-1">
                <span>Variance giữ lại</span>
                <span className="font-bold" style={{ color: explainedRatio > 0.8 ? "#22c55e" : explainedRatio > 0.5 ? "#f59e0b" : "#ef4444" }}>
                  {(explainedRatio * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: explainedRatio > 0.8 ? "#22c55e" : explainedRatio > 0.5 ? "#f59e0b" : "#ef4444" }}
                  animate={{ width: `${explainedRatio * 100}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 18 }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setAngle(optimalAngle)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                Nhảy đến PC1 tối ưu ({optimalAngle}°)
              </button>
              <button
                onClick={() => { setPoints(DATA); setAngle(35); }}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                Đặt lại dữ liệu
              </button>
              <span className="ml-auto text-xs text-muted">{points.length} điểm</span>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* STEP 3: AHA */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>PCA</strong>{" "}
            tìm hướng chiếu mà dữ liệu &quot;trải ra&quot; nhiều nhất (phương sai cực đại). Bạn vừa thấy: xoay đến đúng góc → 90%+ thông tin giữ lại chỉ trên 1 chiều!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* STEP 4: CHALLENGE */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Dữ liệu 3 chiều: x, y hoàn toàn ngẫu nhiên, z = 2x + 3y (phụ thuộc tuyến tính). PCA giảm xuống mấy chiều mà không mất thông tin?"
          options={[
            "1 chiều — chỉ cần 1 PC",
            "2 chiều — z phụ thuộc nên chỉ có 2 chiều 'thật'",
            "Không giảm được — 3 chiều đều quan trọng",
          ]}
          correct={1}
          explanation="z = 2x + 3y → chiều z nằm hoàn toàn trên mặt phẳng (x, y). Dữ liệu 3D thực chất chỉ nằm trên mặt phẳng 2D. PCA phát hiện điều này → PC1 + PC2 giải thích 100% variance!"
        />
      </LessonSection>

      {/* STEP 5: EXPLANATION */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>PCA</strong>{" "}
            tìm các hướng (eigenvector) của ma trận hiệp phương sai mà phương sai (eigenvalue) lớn nhất. Đặt{" "}
            <LaTeX>{"\\tilde{\\mathbf{X}} = \\mathbf{X} - \\boldsymbol{\\mu}"}</LaTeX>{" "}
            là dữ liệu đã trừ trung bình theo từng feature:
          </p>

          <LaTeX block>{"\\Sigma = \\frac{1}{n}\\tilde{\\mathbf{X}}^T\\tilde{\\mathbf{X}}, \\quad \\Sigma \\mathbf{v}_k = \\lambda_k \\mathbf{v}_k"}</LaTeX>

          <p className="text-sm text-muted">
            Phép trừ trung bình <LaTeX>{"\\boldsymbol{\\mu}"}</LaTeX> đảm bảo phương sai được tính quanh tâm dữ liệu, chứ không quanh gốc toạ độ — nếu bỏ qua bước này ta sẽ thu được ma trận mô-men bậc hai, không phải hiệp phương sai.
          </p>

          <p>
            <LaTeX>{"\\mathbf{v}_1"}</LaTeX> (eigenvector ứng với <LaTeX>{"\\lambda_1"}</LaTeX> lớn nhất) là PC1. Phương sai giữ lại khi giữ k PC đầu:
          </p>

          <LaTeX block>{"\\text{Explained Variance Ratio} = \\frac{\\sum_{i=1}^{k} \\lambda_i}{\\sum_{i=1}^{d} \\lambda_i}"}</LaTeX>

          <p><strong>Các bước PCA:</strong></p>
          <ol className="list-decimal list-inside space-y-1 pl-2 text-sm">
            <li><strong>Chuẩn hoá:</strong>{" "}Mean = 0, Std = 1 (StandardScaler)</li>
            <li><strong>Tính ma trận hiệp phương sai</strong>{" "}<LaTeX>{"\\Sigma"}</LaTeX></li>
            <li><strong>Eigen decomposition:</strong>{" "}Tìm eigenvectors và eigenvalues</li>
            <li><strong>Chọn k PC đầu</strong>{" "}(sao cho giải thích ≥ 90-95% variance)</li>
            <li><strong>Chiếu dữ liệu:</strong>{" "}<LaTeX>{"\\mathbf{Z} = \\tilde{\\mathbf{X}} \\mathbf{V}_k = (\\mathbf{X} - \\boldsymbol{\\mu}) \\mathbf{V}_k"}</LaTeX></li>
          </ol>

          <Callout variant="tip" title="Ứng dụng thực tế">
            Giảm chiều trước KNN/SVM (nhanh hơn, giảm overfitting). Trực quan hoá dữ liệu chiều cao lên 2D/3D. Nén nhiễu (noise nằm ở các PC cuối → bỏ đi). Eigenfaces (nhận diện khuôn mặt).
          </Callout>

          <CodeBlock language="python" title="PCA với scikit-learn">
{`from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from sklearn.datasets import load_iris
import numpy as np

X, y = load_iris(return_X_y=True)

# Bước 1: Chuẩn hoá BẮT BUỘC!
X_scaled = StandardScaler().fit_transform(X)

# Bước 2: PCA giữ 2 thành phần chính
pca = PCA(n_components=2)
X_2d = pca.fit_transform(X_scaled)

print(f"Explained variance: {pca.explained_variance_ratio_}")
print(f"Tổng: {pca.explained_variance_ratio_.sum():.1%}")
print(f"Shape: {X.shape} → {X_2d.shape}")

# Chọn số PC tự động (giữ 95% variance)
pca_auto = PCA(n_components=0.95)
X_auto = pca_auto.fit_transform(X_scaled)
print(f"Cần {pca_auto.n_components_} PC cho 95% variance")`}
          </CodeBlock>

          <Callout variant="warning" title="PCA vs t-SNE">
            PCA: tuyến tính, nhanh, deterministic, giữ khoảng cách toàn cục. Dùng khi cần giảm chiều cho ML pipeline.{"\n"}
            t-SNE: phi tuyến, chậm, stochastic, chỉ dùng cho trực quan hoá. Khoảng cách giữa cụm không có ý nghĩa.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* STEP 6: SUMMARY */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "PCA tìm hướng phương sai cực đại → chiếu dữ liệu lên hướng đó để giảm chiều.",
          "Eigenvectors = hướng chính, eigenvalues = phương sai trên hướng đó.",
          "Chọn k PC đầu sao cho giải thích ≥ 90-95% tổng variance.",
          "LUÔN chuẩn hoá (StandardScaler) trước PCA — features khác thang sẽ lệch kết quả.",
          "Dùng cho: giảm chiều trước ML, trực quan hoá, nén nhiễu, eigenfaces.",
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
