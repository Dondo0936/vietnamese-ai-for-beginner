"use client";

import { useState, useMemo, useCallback, useRef } from "react";
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

/* =========================================================================
   METADATA (giữ nguyên)
   ========================================================================= */

export const metadata: TopicMeta = {
  slug: "eigendecomposition-pca",
  title: "Eigendecomposition & PCA",
  titleVi: "Phân rã trị riêng & PCA",
  description:
    "Trị riêng, vector riêng và phân tích thành phần chính — giảm chiều dữ liệu giữ tối đa thông tin",
  category: "math-foundations",
  tags: ["eigenvalues", "pca", "dimensionality-reduction"],
  difficulty: "intermediate",
  relatedSlugs: ["vectors-and-matrices", "pca", "word-embeddings"],
  vizType: "interactive",
};

/* =========================================================================
   CONSTANTS — SVG cho phần PCA Puzzle
   ========================================================================= */

const TOTAL_STEPS = 10;

/* SVG dimensions */
const SW = 400;
const SH = 360;
const S_CX = SW / 2;
const S_CY = 180; // vertical center of scatter area
const S_SCALE = 60; // pixels per unit

/* Histogram area below scatter */
const HIST_Y = 290;
const HIST_H = 50;
const HIST_W = SW - 40; // left/right padding 20px each

/* =========================================================================
   SEEDED PRNG (Mulberry32) — deterministic points
   ========================================================================= */

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* =========================================================================
   Generate 50 elliptical points with known PC directions
   ========================================================================= */

const NUM_POINTS = 50;
const TRUE_ANGLE = 0.5236; // ~30 degrees: the true PC1 direction
const SIGMA1 = 1.6; // spread along PC1
const SIGMA2 = 0.4; // spread along PC2

function generatePoints(): [number, number][] {
  const rng = mulberry32(42);
  const cosA = Math.cos(TRUE_ANGLE);
  const sinA = Math.sin(TRUE_ANGLE);
  const points: [number, number][] = [];

  for (let i = 0; i < NUM_POINTS; i++) {
    // Box-Muller transform for normal distribution
    const u1 = rng();
    const u2 = rng();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);

    // Scale by sigmas along principal axes
    const pc1Val = z0 * SIGMA1;
    const pc2Val = z1 * SIGMA2;

    // Rotate into data space
    const x = cosA * pc1Val - sinA * pc2Val;
    const y = sinA * pc1Val + cosA * pc2Val;

    points.push([x, y]);
  }
  return points;
}

const DATA_POINTS = generatePoints();

/* Centroid */
const CENTROID: [number, number] = [
  DATA_POINTS.reduce((s, p) => s + p[0], 0) / NUM_POINTS,
  DATA_POINTS.reduce((s, p) => s + p[1], 0) / NUM_POINTS,
];

/* Precompute total variance for normalization */
const TOTAL_VARIANCE =
  DATA_POINTS.reduce((s, p) => {
    const dx = p[0] - CENTROID[0];
    const dy = p[1] - CENTROID[1];
    return s + dx * dx + dy * dy;
  }, 0) / NUM_POINTS;

/* =========================================================================
   HELPERS
   ========================================================================= */

function projectOntoAxis(point: [number, number], center: [number, number], angle: number): number {
  const dx = point[0] - center[0];
  const dy = point[1] - center[1];
  return dx * Math.cos(angle) + dy * Math.sin(angle);
}

function computeVarianceAlongAxis(angle: number): number {
  const projections = DATA_POINTS.map((p) => projectOntoAxis(p, CENTROID, angle));
  const mean = projections.reduce((s, v) => s + v, 0) / projections.length;
  return projections.reduce((s, v) => s + (v - mean) * (v - mean), 0) / projections.length;
}

/* PC2 angle is always perpendicular to PC1 */
function pc2Angle(pc1: number): number {
  return pc1 + Math.PI / 2;
}

/* Snapping threshold: if user is within this many radians of the true PC, snap */
const SNAP_THRESHOLD = 0.06;

/* =========================================================================
   COMPONENT CHÍNH
   ========================================================================= */

export default function EigendecompositionPcaTopic() {
  /* ── State ── */
  const [userAngle, setUserAngle] = useState(0); // user-chosen PC1 angle
  const [phase, setPhase] = useState<"pc1" | "pc2" | "done">("pc1");
  const [foundPC1Angle, setFoundPC1Angle] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const isDragging = useRef(false);

  /* ── Derived ── */
  const variancePC1 = useMemo(() => computeVarianceAlongAxis(userAngle), [userAngle]);
  const varianceRatio = useMemo(() => Math.min(variancePC1 / TOTAL_VARIANCE, 1), [variancePC1]);

  const foundPC1Variance = useMemo(
    () => (foundPC1Angle !== null ? computeVarianceAlongAxis(foundPC1Angle) : 0),
    [foundPC1Angle],
  );
  const foundPC2Variance = useMemo(
    () => (foundPC1Angle !== null ? computeVarianceAlongAxis(pc2Angle(foundPC1Angle)) : 0),
    [foundPC1Angle],
  );
  const totalFoundVariance = foundPC1Variance + foundPC2Variance;

  /* Projections for histogram */
  const projections = useMemo(() => DATA_POINTS.map((p) => projectOntoAxis(p, CENTROID, userAngle)), [userAngle]);
  const projMin = useMemo(() => Math.min(...projections), [projections]);
  const projMax = useMemo(() => Math.max(...projections), [projections]);

  /* Is close to true PC1? (allow both directions) */
  const isNearPC1 = useMemo(() => {
    const diff1 = Math.abs(((userAngle - TRUE_ANGLE + Math.PI) % (2 * Math.PI)) - Math.PI);
    const diff2 = Math.abs(((userAngle - TRUE_ANGLE - Math.PI + Math.PI) % (2 * Math.PI)) - Math.PI);
    return Math.min(diff1, diff2) < SNAP_THRESHOLD;
  }, [userAngle]);

  /* ── SVG coordinate conversions ── */
  const toSvgX = useCallback((x: number) => S_CX + x * S_SCALE, []);
  const toSvgY = useCallback((y: number) => S_CY - y * S_SCALE, []);

  /* ── Drag handlers ── */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (phase === "done") return;
      isDragging.current = true;
      (e.target as SVGSVGElement).setPointerCapture?.(e.pointerId);
    },
    [phase],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!isDragging.current || phase === "done") return;
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const scaleX = SW / rect.width;
      const scaleY = SH / rect.height;
      const svgX = (e.clientX - rect.left) * scaleX;
      const svgY = (e.clientY - rect.top) * scaleY;

      // Math coords relative to centroid
      const mx = (svgX - toSvgX(CENTROID[0])) / S_SCALE;
      const my = -(svgY - toSvgY(CENTROID[1])) / S_SCALE;

      if (phase === "pc1") {
        setUserAngle(Math.atan2(my, mx));
      }
      // PC2 is locked orthogonal — no user input needed
    },
    [phase, toSvgX, toSvgY],
  );

  const handlePointerUp = useCallback(() => { isDragging.current = false; }, []);

  /* ── Phase transitions ── */
  const handleLockPC1 = useCallback(() => {
    setFoundPC1Angle(userAngle);
    setPhase("pc2");
  }, [userAngle]);

  const handleFinish = useCallback(() => {
    setPhase("done");
  }, []);

  const handleReset = useCallback(() => {
    setUserAngle(0);
    setPhase("pc1");
    setFoundPC1Angle(null);
  }, []);

  /* =======================================================================
     QUIZ (8 câu — mở rộng từ 4 câu gốc)
     ======================================================================= */
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question: "Eigenvector (vector riêng) của một ma trận là gì?",
        options: [
          "Vector bất kỳ trong không gian",
          "Hướng mà ma trận chỉ kéo giãn, không xoay",
          "Vector có độ dài bằng 1",
          "Hàng đầu tiên của ma trận",
        ],
        correct: 1,
        explanation:
          "Eigenvector là hướng đặc biệt mà khi nhân với ma trận, vector chỉ bị kéo giãn (hoặc co lại) mà không bị xoay. Hệ số kéo giãn chính là eigenvalue (trị riêng).",
      },
      {
        question:
          "PCA chọn thành phần chính (principal component) theo tiêu chí nào?",
        options: [
          "Hướng ngẫu nhiên",
          "Hướng có phương sai (variance) lớn nhất",
          "Hướng song song với trục x",
          "Hướng có ít điểm dữ liệu nhất",
        ],
        correct: 1,
        explanation:
          "PCA tìm hướng mà dữ liệu trải ra (variance) nhiều nhất. Hướng này chứa nhiều thông tin nhất về sự khác biệt giữa các điểm dữ liệu.",
      },
      {
        question:
          "Nếu PC1 giải thích 85% và PC2 giải thích 10% phương sai, hai thành phần giữ lại bao nhiêu % thông tin?",
        options: ["85%", "90%", "95%", "100%"],
        correct: 2,
        explanation:
          "Tỷ lệ phương sai giải thích cộng dồn: 85% + 10% = 95%. Nghĩa là chỉ cần 2 thành phần đã giữ được 95% thông tin của toàn bộ dữ liệu.",
      },
      {
        type: "fill-blank",
        question:
          "PCA giảm chiều bằng cách chiếu dữ liệu lên {blank} của ma trận hiệp phương sai",
        blanks: [
          {
            answer: "vector riêng",
            accept: [
              "vector riêng",
              "eigenvector",
              "eigenvectors",
              "vector riêng (eigenvector)",
            ],
          },
        ],
        explanation:
          "PCA chiếu dữ liệu lên các vector riêng (eigenvector) của ma trận hiệp phương sai. Các vector riêng này chính là các trục mới — thành phần chính.",
      },
      {
        question:
          "SVD (Singular Value Decomposition) liên hệ với PCA thế nào?",
        options: [
          "Không liên quan",
          "SVD của ma trận dữ liệu X (đã trung tâm hoá) cho ra vector riêng và giá trị kỳ dị bình phương = eigenvalues của Cov(X)",
          "SVD chỉ dùng cho ảnh",
          "SVD chậm hơn eigendecomposition rất nhiều",
        ],
        correct: 1,
        explanation:
          "Với X (n×d) đã trung tâm hoá, SVD cho X = U Σ Vᵀ. Khi đó V chứa các eigenvector của XᵀX/n = ma trận hiệp phương sai, và eigenvalues λᵢ = σᵢ²/n. Thực tế, thư viện (sklearn) dùng SVD thay vì eigendecomposition vì ổn định số học hơn.",
      },
      {
        question: "Whitening (làm trắng) là gì?",
        options: [
          "Xoá giá trị NaN trong dữ liệu",
          "Biến đổi sao cho ma trận hiệp phương sai của dữ liệu bằng I (đơn vị) — mỗi chiều phương sai 1 và không tương quan",
          "Chuyển ảnh sang đen trắng",
          "Quy định tất cả eigenvalue bằng 0",
        ],
        correct: 1,
        explanation:
          "Whitening: Z = Λ^(-1/2) Vᵀ (X - x̄). Sau phép này, Cov(Z) = I — dữ liệu 'trắng' như nhiễu Gauss tiêu chuẩn. Hữu ích trước khi làm ICA hoặc để ổn định training mạng neural.",
      },
      {
        question:
          "Kernel PCA giải quyết được vấn đề gì mà PCA thường không làm được?",
        options: [
          "Xử lý dữ liệu có quan hệ phi tuyến (ví dụ: 2 vòng tròn đồng tâm)",
          "Tăng số chiều lên vô hạn",
          "Giảm tốc độ tính toán",
          "Thay thế SVD",
        ],
        correct: 0,
        explanation:
          "PCA thông thường tìm hướng tuyến tính. Khi dữ liệu nằm trên manifold cong (2 vòng tròn, spiral), PCA không tách được. Kernel PCA dùng kernel trick — ngầm đưa dữ liệu lên không gian chiều cao (có thể vô hạn) qua ϕ(x), rồi làm PCA ở đó mà không cần tính ϕ tường minh.",
      },
      {
        question:
          "Khi nào Probabilistic PCA (PPCA) là lựa chọn hợp lý hơn PCA thông thường?",
        options: [
          "Khi cần một mô hình sinh (generative) có thể xử lý dữ liệu thiếu (missing values) và tính likelihood",
          "Khi chỉ muốn giảm chiều đơn giản",
          "Khi dữ liệu đã hoàn toàn sạch",
          "Khi ma trận hiệp phương sai đã biết",
        ],
        correct: 0,
        explanation:
          "PPCA mô hình dữ liệu là: x = Wz + μ + ε với z ~ N(0,I), ε ~ N(0, σ²I). Vì có dạng xác suất, PPCA có thể: (1) xử lý missing values qua EM, (2) tính log-likelihood để chọn số chiều k, (3) sinh mẫu mới. PCA thông thường không có tính chất này. Khi σ² → 0, PPCA trở về PCA thường.",
      },
    ],
    [],
  );

  /* ── Render helpers ── */
  const axisLength = 3; // how far the rotation handle extends from centroid

  /* Current display angle for PC1 line */
  const displayAngle =
    phase === "pc1" ? userAngle : foundPC1Angle ?? userAngle;
  /* PC2 display angle */
  const displayPC2 = pc2Angle(displayAngle);

  /* =======================================================================
     RENDER
     ======================================================================= */
  return (
    <>
      {/* ================================================================
          STEP 1 — PREDICTION GATE (mới, bao toàn bộ các bước)
          ================================================================ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn có 100 đặc trưng (features) mô tả sinh viên: điểm từng môn, số giờ học, giờ ngủ... Muốn vẽ biểu đồ 2D để phân nhóm sinh viên, bạn sẽ làm gì?"
          options={[
            "Chọn ngẫu nhiên 2 đặc trưng bất kỳ",
            "Tìm 2 hướng mà dữ liệu khác biệt nhiều nhất, chiếu lên đó",
            "Lấy trung bình tất cả đặc trưng thành 2 số",
          ]}
          correct={1}
          explanation="Đúng! Đây chính là ý tưởng của PCA (phân tích thành phần chính): tìm những hướng mà dữ liệu 'trải ra' nhiều nhất, rồi chiếu toàn bộ dữ liệu lên các hướng đó. Kết quả: giảm từ 100 chiều xuống 2 chiều mà vẫn giữ được nhiều thông tin nhất."
        >
          {/* ───────────────────────────────────────────────────────────
             ANALOGY
             ─────────────────────────────────────────────────────────── */}
          <div className="mt-4 rounded-lg border border-border bg-surface p-4">
            <p className="text-sm font-semibold text-foreground mb-2">
              Phép ẩn dụ: Chọn góc chụp ảnh cho một tác phẩm điêu khắc
            </p>
            <p className="text-sm text-muted leading-relaxed">
              Hãy tưởng tượng bạn có một tác phẩm điêu khắc phức tạp (dữ liệu
              3D) và chỉ được gửi về nhà <em>một bức ảnh 2D</em>. Bạn sẽ chọn
              góc nào? Không phải góc bất kỳ — bạn chọn góc mà{" "}
              <strong>tác phẩm trông khác biệt nhất</strong>, nơi các chi tiết
              trải rộng nhất trên bức ảnh. Nếu chụp trực diện thấy mặt phẳng,
              nhiều chi tiết bị chồng lên nhau (chiếu lên hướng xấu). Nếu xoay
              nghiêng đúng góc, bạn thấy được chiều cao, chiều rộng, độ sâu.
              <br />
              <br />
              PCA làm đúng điều đó ở chiều cao hơn: trong hàng trăm hướng khả
              dĩ, chọn đúng những hướng mà dữ liệu <em>&quot;trải ra&quot;</em>{" "}
              nhiều nhất — gọi là các <strong>thành phần chính</strong>{" "}
              (principal components). Eigenvector của ma trận hiệp phương sai
              cho ta chính xác các hướng đó, và eigenvalue cho ta biết mỗi
              hướng giữ được bao nhiêu &quot;thông tin&quot;.
            </p>
          </div>

          {/* ================================================================
             STEP 2 — VISUALIZATION (PCA Puzzle — giữ nguyên, mở rộng text)
             ================================================================ */}
          <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
            <p className="mb-4 text-sm text-muted leading-relaxed">
              Trong trò chơi dưới đây, bạn <strong>xoay một trục</strong> qua
              trọng tâm dữ liệu, và thanh phương sai cho biết hướng đó giữ được
              bao nhiêu thông tin. Đây chính là cách PCA chọn PC1 — nhưng thực
              tế máy tính không &quot;thử từng góc&quot; mà giải phương trình
              eigendecomposition để tìm tối ưu trong một bước.
            </p>

            <VisualizationSection topicSlug="eigendecomposition-pca">
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-foreground">
                  Trò chơi PCA: Tìm hướng phương sai lớn nhất
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  {phase === "pc1" &&
                    'Kéo đường thẳng qua trọng tâm để xoay. Tìm hướng mà dữ liệu "trải ra" nhiều nhất — thanh phương sai sẽ đầy khi bạn tìm đúng PC1.'}
                  {phase === "pc2" &&
                    'PC1 đã khóa! PC2 vuông góc với PC1 (đường nét đứt). Bấm "Hoàn thành" để xem kết quả.'}
                  {phase === "done" &&
                    "Cả hai thành phần chính đã tìm xong. Xem tỷ lệ phương sai giải thích bên dưới."}
                </p>

                {/* Variance Explained bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Phương sai giải thích (PC1):</span>
                    <span className="font-mono font-bold text-accent text-lg">{(varianceRatio * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-5 rounded-full bg-surface-hover overflow-hidden border border-border">
                    <div
                      className="h-full rounded-full transition-all duration-150 ease-out"
                      style={{
                        width: `${varianceRatio * 100}%`,
                        background: varianceRatio > 0.9 ? "#22C55E" : varianceRatio > 0.6 ? "#F59E0B" : "#EF4444",
                      }}
                    />
                  </div>
                  <div className="text-xs text-muted text-center">
                    {varianceRatio > 0.9 ? "Nóng! Rất gần PC1 thật!" : varianceRatio > 0.7 ? "Ấm dần..." : varianceRatio > 0.5 ? "Còn hơi lạnh" : "Lạnh — thử hướng khác"}
                  </div>
                </div>

                {/* SVG: Scatter + Axis + Histogram */}
                <div className="rounded-lg border border-border bg-surface p-2 flex items-center justify-center">
                  <svg
                    ref={svgRef}
                    viewBox={`0 0 ${SW} ${SH}`}
                    className="w-full max-w-[400px] cursor-crosshair select-none touch-none"
                    aria-label="Kéo trục để tìm thành phần chính PCA"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                  >
                    {/* Light axes through centroid */}
                    <line x1={20} y1={toSvgY(CENTROID[1])} x2={SW - 20} y2={toSvgY(CENTROID[1])} stroke="currentColor" className="text-border" strokeWidth="0.5" />
                    <line x1={toSvgX(CENTROID[0])} y1={20} x2={toSvgX(CENTROID[0])} y2={260} stroke="currentColor" className="text-border" strokeWidth="0.5" />

                    {/* Data points */}
                    {DATA_POINTS.map((p, i) => (
                      <circle key={`pt-${i}`} cx={toSvgX(p[0])} cy={toSvgY(p[1])} r="3.5" fill="currentColor" className="text-accent/60" stroke="currentColor" strokeWidth="0.5" />
                    ))}

                    {/* Centroid marker */}
                    <circle cx={toSvgX(CENTROID[0])} cy={toSvgY(CENTROID[1])} r="5" fill="none" stroke="currentColor" className="text-foreground" strokeWidth="1.5" />
                    <circle cx={toSvgX(CENTROID[0])} cy={toSvgY(CENTROID[1])} r="2" fill="currentColor" className="text-foreground" />

                    {/* PC1 rotation handle line */}
                    <line
                      x1={toSvgX(CENTROID[0] - axisLength * Math.cos(displayAngle))}
                      y1={toSvgY(CENTROID[1] - axisLength * Math.sin(displayAngle))}
                      x2={toSvgX(CENTROID[0] + axisLength * Math.cos(displayAngle))}
                      y2={toSvgY(CENTROID[1] + axisLength * Math.sin(displayAngle))}
                      stroke="#3B82F6" strokeWidth={phase === "pc1" ? 2.5 : 2} strokeLinecap="round"
                    />
                    {phase === "pc1" && (
                      <circle
                        cx={toSvgX(CENTROID[0] + axisLength * Math.cos(displayAngle))}
                        cy={toSvgY(CENTROID[1] + axisLength * Math.sin(displayAngle))}
                        r="8" fill="#3B82F6" fillOpacity="0.3" stroke="#3B82F6" strokeWidth="2"
                        className="cursor-grab active:cursor-grabbing"
                      />
                    )}
                    <text
                      x={toSvgX(CENTROID[0] + (axisLength + 0.3) * Math.cos(displayAngle))}
                      y={toSvgY(CENTROID[1] + (axisLength + 0.3) * Math.sin(displayAngle))}
                      fontSize="11" fontWeight="bold" fill="#3B82F6"
                    >PC1</text>

                    {/* PC2 line (shown when PC1 is locked or done) */}
                    {(phase === "pc2" || phase === "done") && (
                      <>
                        <line
                          x1={toSvgX(CENTROID[0] - axisLength * 0.7 * Math.cos(displayPC2))}
                          y1={toSvgY(CENTROID[1] - axisLength * 0.7 * Math.sin(displayPC2))}
                          x2={toSvgX(CENTROID[0] + axisLength * 0.7 * Math.cos(displayPC2))}
                          y2={toSvgY(CENTROID[1] + axisLength * 0.7 * Math.sin(displayPC2))}
                          stroke="#EF4444" strokeWidth="2" strokeDasharray="6,3" strokeLinecap="round"
                        />
                        <text
                          x={toSvgX(CENTROID[0] + (axisLength * 0.7 + 0.3) * Math.cos(displayPC2))}
                          y={toSvgY(CENTROID[1] + (axisLength * 0.7 + 0.3) * Math.sin(displayPC2))}
                          fontSize="11" fontWeight="bold" fill="#EF4444"
                        >PC2</text>
                      </>
                    )}

                    {/* Projection lines from points to PC1 axis */}
                    {DATA_POINTS.map((p, i) => {
                      const proj = projections[i];
                      const projX = CENTROID[0] + proj * Math.cos(displayAngle);
                      const projY = CENTROID[1] + proj * Math.sin(displayAngle);
                      return (
                        <line key={`proj-${i}`} x1={toSvgX(p[0])} y1={toSvgY(p[1])} x2={toSvgX(projX)} y2={toSvgY(projY)} stroke="currentColor" className="text-accent/15" strokeWidth="0.5" />
                      );
                    })}

                    {/* ── 1D Histogram ── */}
                    <line x1={20} y1={HIST_Y - 5} x2={SW - 20} y2={HIST_Y - 5} stroke="currentColor" className="text-border" strokeWidth="0.5" />
                    <text x={20} y={HIST_Y - 10} fontSize="9" fill="currentColor" className="text-muted">Phân bố chiếu lên trục</text>
                    {projections.map((proj, i) => {
                      const range = projMax - projMin || 1;
                      const normX = 20 + ((proj - projMin) / range) * HIST_W;
                      return (
                        <circle key={`hist-${i}`} cx={normX} cy={HIST_Y + HIST_H / 2} r="3" fill="currentColor" className="text-accent/50" />
                      );
                    })}
                  </svg>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 justify-center flex-wrap">
                  {phase === "pc1" && (
                    <button onClick={handleLockPC1} disabled={!isNearPC1} className="rounded-lg px-4 py-2 text-sm font-medium bg-accent text-white hover:bg-accent-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      {isNearPC1 ? "Khóa PC1 (tuyệt vời!)" : "Chưa đủ gần PC1 — tiếp tục xoay"}
                    </button>
                  )}
                  {phase === "pc2" && (
                    <button onClick={handleFinish} className="rounded-lg px-4 py-2 text-sm font-medium bg-accent text-white hover:bg-accent-dark transition-colors">Hoàn thành — xem kết quả</button>
                  )}
                  <button onClick={handleReset} className="rounded-lg px-4 py-2 text-sm font-medium border border-border text-foreground hover:bg-surface-hover transition-colors">Làm lại</button>
                </div>

                {/* Final reveal */}
                {phase === "done" && foundPC1Angle !== null && (
                  <div className="rounded-lg border border-accent/30 bg-accent-light/30 p-4 space-y-3">
                    <p className="font-semibold text-accent-dark text-sm">Kết quả phân tích PCA:</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="rounded-lg border border-border bg-surface p-3 text-center">
                        <div className="text-xs text-muted mb-1">PC1</div>
                        <div className="font-mono font-bold text-blue-500 text-lg">
                          {totalFoundVariance > 0 ? ((foundPC1Variance / totalFoundVariance) * 100).toFixed(1) : "—"}%
                        </div>
                        <div className="text-xs text-muted">phương sai</div>
                      </div>
                      <div className="rounded-lg border border-border bg-surface p-3 text-center">
                        <div className="text-xs text-muted mb-1">PC2</div>
                        <div className="font-mono font-bold text-red-500 text-lg">
                          {totalFoundVariance > 0 ? ((foundPC2Variance / totalFoundVariance) * 100).toFixed(1) : "—"}%
                        </div>
                        <div className="text-xs text-muted">phương sai</div>
                      </div>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      Tổng: ~100%. Trong không gian 2D, hai PC nắm giữ toàn bộ thông tin. Nhưng với dữ liệu 100 chiều, có thể chỉ cần 5–10 PC đã giữ được 95% thông tin!
                    </p>
                  </div>
                )}
              </div>
            </VisualizationSection>
          </LessonSection>

          {/* ================================================================
             STEP 3 — AHA MOMENT (toàn cục)
             ================================================================ */}
          <LessonSection
            step={3}
            totalSteps={TOTAL_STEPS}
            label="Khoảnh khắc Aha"
          >
            <AhaMoment>
              <p>
                PCA thực chất là một <strong>phép xoay khung nhìn</strong>{" "}
                thông minh: thay vì nhìn dữ liệu qua các trục gốc (điểm toán,
                điểm lý, số giờ học...), ta nhìn qua các trục mới — những trục
                mà dữ liệu <em>trải ra</em> nhiều nhất. Điều kỳ diệu là các
                trục mới này <strong>không cần tìm bằng tay</strong>: eigenvector
                của ma trận hiệp phương sai cho ta chính xác chúng. Và các trị
                riêng (eigenvalues) chính là <em>lượng thông tin</em> mỗi trục
                giữ được. Đây là lý do tại sao một đối tượng hình học thuần túy
                (vector riêng) lại giải quyết được bài toán thống kê (giảm
                chiều) — bởi vì <strong>phương sai cực đại chính là trị
                riêng cực đại của ma trận hiệp phương sai</strong>.
              </p>
            </AhaMoment>
          </LessonSection>

          {/* ================================================================
             STEP 4 — EXPLANATION (phần lớn nội dung)
             ================================================================ */}
          <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Lý thuyết">
            <ExplanationSection topicSlug="eigendecomposition-pca">
              {/* ─── 4.1 Trị riêng & vector riêng ─── */}
              <p>
                Trong bài{" "}
                <TopicLink slug="vectors-and-matrices">
                  Vector &amp; Ma trận
                </TopicLink>
                , bạn đã biết rằng nhân ma trận với vector sẽ{" "}
                <strong>biến đổi</strong> vector đó (xoay, kéo giãn, lật...).
                Nhưng có những hướng đặc biệt mà ma trận{" "}
                <strong>chỉ kéo giãn, không xoay</strong>:
              </p>

              <LaTeX block>{String.raw`A \vec{v} = \lambda \vec{v}`}</LaTeX>

              <ul className="list-disc list-inside space-y-2 pl-2 text-sm leading-relaxed">
                <li>
                  <LaTeX>{String.raw`\vec{v}`}</LaTeX> là{" "}
                  <strong>vector riêng</strong> (eigenvector) — hướng không bị
                  xoay.
                </li>
                <li>
                  <LaTeX>{String.raw`\lambda`}</LaTeX> là{" "}
                  <strong>trị riêng</strong> (eigenvalue) — hệ số kéo giãn theo
                  hướng đó.
                </li>
                <li>
                  Một ma trận <LaTeX>{String.raw`d \times d`}</LaTeX> có tối đa{" "}
                  <LaTeX>{"d"}</LaTeX> cặp (λ, v) độc lập tuyến tính.
                </li>
              </ul>

              <Callout variant="tip" title="Phép ẩn dụ: Cánh cửa bản lề">
                Hãy tưởng tượng bạn đẩy một cánh cửa. Bản lề là eigenvector —
                hướng mà cửa chỉ chuyển động dọc theo, không bị lệch sang hướng
                khác. Eigenvalue cho biết cửa mở rộng hay hẹp bao nhiêu theo
                hướng đó. Nếu λ = 2 cửa mở gấp đôi, λ = 0.5 đóng lại một nửa,
                λ &lt; 0 cửa lật ngược chiều.
              </Callout>

              {/* ─── 4.2 Phương trình đặc trưng ─── */}
              <p>
                <strong>Cách tìm eigenvalue:</strong> giải phương trình đặc
                trưng:
              </p>

              <LaTeX block>
                {String.raw`\det(A - \lambda I) = 0`}
              </LaTeX>

              <p className="text-sm leading-relaxed">
                Đây là một đa thức bậc <LaTeX>{"d"}</LaTeX> của{" "}
                <LaTeX>{String.raw`\lambda`}</LaTeX>. Với mỗi nghiệm{" "}
                <LaTeX>{String.raw`\lambda_i`}</LaTeX>, giải hệ{" "}
                <LaTeX>{String.raw`(A - \lambda_i I)\vec{v}_i = 0`}</LaTeX>{" "}
                để tìm eigenvector tương ứng. Thực tế máy tính không làm theo
                cách này (nhạy số, chậm với ma trận lớn) — mà dùng{" "}
                <strong>QR algorithm</strong> hoặc{" "}
                <strong>power iteration</strong>.
              </p>

              {/* ─── 4.3 Ma trận hiệp phương sai ─── */}
              <p>
                <strong>Ma trận hiệp phương sai</strong> (covariance matrix) đo
                mức độ các đặc trưng thay đổi cùng nhau. Với dữ liệu có{" "}
                <LaTeX>{"d"}</LaTeX> đặc trưng, ma trận hiệp phương sai có kích
                thước <LaTeX>{String.raw`d \times d`}</LaTeX>:
              </p>

              <LaTeX block>
                {String.raw`C = \frac{1}{n} \sum_{i=1}^{n} (\vec{x}_i - \bar{\vec{x}})(\vec{x}_i - \bar{\vec{x}})^T`}
              </LaTeX>

              <p className="text-sm leading-relaxed">
                Phần tử <LaTeX>{"C_{jk}"}</LaTeX> cho biết đặc trưng thứ{" "}
                <LaTeX>{"j"}</LaTeX> và <LaTeX>{"k"}</LaTeX> có xu hướng
                tăng/giảm cùng nhau không. Trên đường chéo chính là phương sai
                (variance) của từng đặc trưng. <LaTeX>{"C"}</LaTeX> luôn{" "}
                <strong>đối xứng</strong>{" "}
                (<LaTeX>{String.raw`C = C^T`}</LaTeX>) và{" "}
                <strong>nửa xác định dương</strong> (eigenvalue &ge; 0) — nhờ
                đó, eigenvector của <LaTeX>{"C"}</LaTeX> luôn tạo thành một hệ
                trực giao.

              </p>

              <Callout variant="info" title="Ví dụ: Chiều cao và cân nặng">
                Nếu bạn đo chiều cao và cân nặng của 100 người, hai đặc trưng
                này có hiệp phương sai dương (cao thường nặng hơn). Ma trận hiệp
                phương sai nắm bắt mối quan hệ này. Eigenvector của nó cho biết
                hướng &quot;cao-và-nặng&quot; là hướng dữ liệu biến đổi nhiều
                nhất — thường PC1 ứng với &quot;thể trạng tổng thể&quot;, còn
                PC2 có thể là &quot;gầy/chắc&quot; (cao nhưng nhẹ hoặc thấp
                nhưng nặng).
              </Callout>

              <InlineChallenge
                question="Ma trận hiệp phương sai 2×2 có phần tử C₁₂ = 0. Điều này nghĩa là gì?"
                options={[
                  "Hai đặc trưng hoàn toàn không tương quan",
                  "Hai đặc trưng giống hệt nhau",
                  "Dữ liệu không có phương sai",
                  "Ma trận bị lỗi",
                ]}
                correct={0}
                explanation="C₁₂ = 0 nghĩa là hiệp phương sai giữa đặc trưng 1 và 2 bằng 0 — chúng thay đổi độc lập với nhau. Lưu ý: hiệp phương sai = 0 chỉ có nghĩa không tương quan tuyến tính; có thể vẫn có quan hệ phi tuyến (đây là lúc Kernel PCA hữu ích)."
              />

              {/* ─── 4.4 Thuật toán PCA 4 bước ─── */}
              <p>
                <strong>PCA</strong> (phân tích thành phần chính — Principal
                Component Analysis) giảm chiều dữ liệu theo 4 bước:
              </p>

              <ol className="list-decimal list-inside space-y-2 pl-2 text-sm leading-relaxed">
                <li>
                  <strong>Chuẩn hóa:</strong> Trừ trung bình để dữ liệu có tâm
                  tại gốc tọa độ:{" "}
                  <LaTeX>
                    {String.raw`\tilde{X} = X - \bar{X}`}
                  </LaTeX>
                  .
                </li>
                <li>
                  <strong>Tính ma trận hiệp phương sai:</strong>{" "}
                  <LaTeX>
                    {String.raw`C = \tfrac{1}{n} \tilde{X}^T \tilde{X}`}
                  </LaTeX>
                  .
                </li>
                <li>
                  <strong>Tìm eigenvector &amp; eigenvalue của C:</strong> giải{" "}
                  <LaTeX>{String.raw`C\vec{v}_i = \lambda_i \vec{v}_i`}</LaTeX>
                  . Sắp xếp{" "}
                  <LaTeX>
                    {String.raw`\lambda_1 \ge \lambda_2 \ge \dots \ge \lambda_d`}
                  </LaTeX>
                  .
                </li>
                <li>
                  <strong>Chiếu dữ liệu:</strong> giữ{" "}
                  <LaTeX>{"k"}</LaTeX> eigenvector đầu tiên thành ma trận{" "}
                  <LaTeX>
                    {String.raw`V_k = [\vec{v}_1, \dots, \vec{v}_k]`}
                  </LaTeX>
                  , rồi{" "}
                  <LaTeX>
                    {String.raw`Z = \tilde{X} V_k`}
                  </LaTeX>{" "}
                  (mỗi hàng của <LaTeX>{"Z"}</LaTeX> là điểm mới trong không
                  gian k chiều).
                </li>
              </ol>

              <Callout
                variant="tip"
                title="PCA = chọn góc chụp ảnh tốt nhất"
              >
                Hãy tưởng tượng bạn muốn chụp ảnh một tòa nhà phức tạp bằng một
                bức ảnh duy nhất. Bạn sẽ chọn góc nào? Góc nhìn mà tòa nhà trông
                &quot;khác biệt nhất&quot; — nơi bạn thấy được nhiều chi tiết
                nhất. PCA làm đúng điều đó: tìm &quot;góc chụp&quot; mà dữ liệu
                đa chiều hiện ra nhiều thông tin nhất khi chiếu xuống ít chiều
                hơn.
              </Callout>

              {/* ─── 4.5 SVD derivation (MỚI) ─── */}
              <p>
                <strong>Kết nối với SVD (Singular Value Decomposition):</strong>
              </p>
              <p className="text-sm leading-relaxed">
                Thực tế, scikit-learn và các thư viện lớn{" "}
                <strong>không</strong> tính eigendecomposition của{" "}
                <LaTeX>{"C"}</LaTeX> — chúng dùng SVD trực tiếp trên{" "}
                <LaTeX>{String.raw`\tilde{X}`}</LaTeX>. Lý do: ổn định số học
                hơn (tránh việc bình phương số nhỏ trong{" "}
                <LaTeX>{String.raw`\tilde{X}^T\tilde{X}`}</LaTeX>).
              </p>

              <p className="text-sm leading-relaxed">
                SVD phân rã ma trận dữ liệu:
              </p>

              <LaTeX block>
                {String.raw`\tilde{X} = U \Sigma V^T`}
              </LaTeX>

              <p className="text-sm leading-relaxed">
                Trong đó <LaTeX>{"U"}</LaTeX> (n×n) và{" "}
                <LaTeX>{"V"}</LaTeX> (d×d) là ma trận trực giao (cột là vector
                trực chuẩn), còn <LaTeX>{String.raw`\Sigma`}</LaTeX> (n×d) là
                ma trận đường chéo chứa <em>singular values</em>{" "}
                <LaTeX>{String.raw`\sigma_1 \ge \sigma_2 \ge \dots \ge 0`}</LaTeX>
                . Thay vào công thức của <LaTeX>{"C"}</LaTeX>:
              </p>

              <LaTeX block>
                {String.raw`C = \tfrac{1}{n} \tilde{X}^T \tilde{X} = \tfrac{1}{n} V \Sigma^T U^T U \Sigma V^T = V \left(\tfrac{\Sigma^T \Sigma}{n}\right) V^T`}
              </LaTeX>

              <p className="text-sm leading-relaxed">
                Vì <LaTeX>{String.raw`\Sigma^T \Sigma`}</LaTeX> là ma trận
                đường chéo{" "}
                <LaTeX>
                  {String.raw`\operatorname{diag}(\sigma_1^2, \dots, \sigma_d^2)`}
                </LaTeX>
                , ta có:
              </p>

              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  Cột của <LaTeX>{"V"}</LaTeX> = eigenvector của{" "}
                  <LaTeX>{"C"}</LaTeX> (chính là các PC).
                </li>
                <li>
                  Eigenvalue{" "}
                  <LaTeX>{String.raw`\lambda_i = \sigma_i^2 / n`}</LaTeX>.
                </li>
                <li>
                  Điểm sau khi chiếu:{" "}
                  <LaTeX>{String.raw`Z = \tilde{X} V = U \Sigma`}</LaTeX> —
                  nghĩa là tọa độ của điểm dữ liệu trong không gian PC chính là{" "}
                  <LaTeX>{String.raw`U \Sigma`}</LaTeX>.
                </li>
              </ul>

              <Callout variant="info" title="Tại sao SVD an toàn hơn?">
                Nếu ma trận dữ liệu có các giá trị nhỏ (ví dụ pixel sau khi
                chuẩn hoá xuống [0,1]), việc bình phương trong{" "}
                <LaTeX>{String.raw`\tilde{X}^T \tilde{X}`}</LaTeX> có thể làm
                mất độ chính xác float. SVD tránh bước bình phương và cho
                eigenvalues chính xác hơn 2-3 chữ số ở cuối.
              </Callout>

              {/* ─── 4.6 Whitening (MỚI) ─── */}
              <p>
                <strong>Whitening (làm trắng):</strong>
              </p>
              <p className="text-sm leading-relaxed">
                Sau khi có eigendecomposition của <LaTeX>{"C"}</LaTeX>, ta có
                thể biến đổi dữ liệu sao cho{" "}
                <LaTeX>
                  {String.raw`\operatorname{Cov}(Z) = I`}
                </LaTeX>{" "}
                — mỗi chiều phương sai 1 và không tương quan. Phép này gọi là
                whitening:
              </p>

              <LaTeX block>
                {String.raw`Z_{\text{white}} = \Lambda^{-1/2} V^T \tilde{X}^T`}
              </LaTeX>

              <p className="text-sm leading-relaxed">
                Trong đó{" "}
                <LaTeX>
                  {String.raw`\Lambda = \operatorname{diag}(\lambda_1, \dots, \lambda_d)`}
                </LaTeX>
                . Kiểm tra:{" "}
                <LaTeX>
                  {String.raw`\operatorname{Cov}(Z_{\text{white}}) = \Lambda^{-1/2} V^T C V \Lambda^{-1/2} = \Lambda^{-1/2} \Lambda \Lambda^{-1/2} = I`}
                </LaTeX>
                . Ứng dụng:
              </p>

              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>Tiền xử lý ICA:</strong> Independent Component
                  Analysis cần dữ liệu đã whitened.
                </li>
                <li>
                  <strong>Ổn định training neural network:</strong> Batch
                  Normalization có họ hàng với whitening.
                </li>
                <li>
                  <strong>Giảm correlation trước regression:</strong> giúp các
                  phép regression tuyến tính ổn định khi có
                  multicollinearity.
                </li>
              </ul>

              <Callout
                variant="warning"
                title="ZCA-whitening vs PCA-whitening"
              >
                Có hai biến thể: <strong>PCA-whitening</strong>{" "}
                (<LaTeX>{String.raw`\Lambda^{-1/2} V^T \tilde{X}^T`}</LaTeX>)
                xoay dữ liệu sang trục PC, còn{" "}
                <strong>ZCA-whitening</strong>{" "}
                (<LaTeX>{String.raw`V \Lambda^{-1/2} V^T \tilde{X}^T`}</LaTeX>)
                xoay trở lại trục gốc sau khi whitened — giữ ảnh &quot;giống
                ảnh gốc&quot; nhất có thể. ZCA hay dùng trong computer vision
                (CIFAR-10 benchmark).
              </Callout>

              {/* ─── 4.7 Kernel PCA (MỚI) ─── */}
              <p>
                <strong>Kernel PCA (PCA phi tuyến):</strong>
              </p>
              <p className="text-sm leading-relaxed">
                PCA thông thường là tuyến tính — nó chỉ tìm được{" "}
                <em>subspace</em> tuyến tính. Khi dữ liệu nằm trên{" "}
                <em>manifold</em> cong (hai vòng tròn đồng tâm, spiral, chữ S),
                PCA không tách được. Giải pháp: ánh xạ dữ liệu lên không gian
                chiều cao qua một hàm phi tuyến{" "}
                <LaTeX>{String.raw`\phi: \mathbb{R}^d \to \mathbb{R}^D`}</LaTeX>
                {" "}
                (<LaTeX>{"D"}</LaTeX> có thể rất lớn hoặc vô hạn), rồi làm PCA ở
                đó.
              </p>

              <p className="text-sm leading-relaxed">
                Vấn đề: ta không thể tính{" "}
                <LaTeX>{String.raw`\phi(x)`}</LaTeX> tường minh khi{" "}
                <LaTeX>{"D"}</LaTeX> quá lớn. <strong>Kernel trick</strong>{" "}
                cứu: chỉ cần tính tích vô hướng{" "}
                <LaTeX>
                  {String.raw`k(x, y) = \phi(x)^T \phi(y)`}
                </LaTeX>{" "}
                cho mọi cặp điểm — việc này có thể làm trực tiếp qua hàm kernel
                (RBF, polynomial...). Ma trận Gram:
              </p>

              <LaTeX block>
                {String.raw`K_{ij} = k(x_i, x_j), \quad i,j = 1,\dots,n`}
              </LaTeX>

              <p className="text-sm leading-relaxed">
                Sau khi trung tâm hoá <LaTeX>{"K"}</LaTeX>, tìm eigenvector của{" "}
                <LaTeX>{"K"}</LaTeX> — mỗi eigenvector cho một component phi
                tuyến. Chiếu điểm mới:
              </p>

              <LaTeX block>
                {String.raw`z_k(x) = \sum_{i=1}^{n} \alpha_k^{(i)} k(x_i, x)`}
              </LaTeX>

              <p className="text-sm leading-relaxed">
                Kernel phổ biến:{" "}
                <LaTeX>
                  {String.raw`k_{\text{RBF}}(x,y) = \exp(-\gamma \|x-y\|^2)`}
                </LaTeX>{" "}
                (tương ứng với <LaTeX>{"D = \\infty"}</LaTeX>!),{" "}
                <LaTeX>
                  {String.raw`k_{\text{poly}}(x,y) = (x^T y + c)^p`}
                </LaTeX>
                .
              </p>

              <Callout
                variant="info"
                title="Khi nào dùng Kernel PCA?"
              >
                Khi PCA thông thường cho variance explained ratio ở PC1 + PC2 &lt; 50% và bạn vẫn nghi có cấu trúc trong dữ liệu. Ví dụ kinh
                điển: hai vòng tròn đồng tâm — PCA tuyến tính không tách được
                vì không có hướng nào có phương sai vượt trội. Kernel PCA với
                RBF kernel tách ngay. Tuy nhiên, Kernel PCA tốn{" "}
                <LaTeX>{String.raw`O(n^2)`}</LaTeX> bộ nhớ để lưu{" "}
                <LaTeX>{"K"}</LaTeX>, không scale lên dataset lớn như PCA
                thường.
              </Callout>

              {/* ─── 4.8 Probabilistic PCA (MỚI) ─── */}
              <p>
                <strong>Probabilistic PCA (PPCA):</strong>
              </p>
              <p className="text-sm leading-relaxed">
                Tipping &amp; Bishop (1999) đặt PCA trong khung xác suất:
              </p>

              <LaTeX block>
                {String.raw`x = W z + \mu + \varepsilon, \quad z \sim \mathcal{N}(0, I_k), \quad \varepsilon \sim \mathcal{N}(0, \sigma^2 I_d)`}
              </LaTeX>

              <p className="text-sm leading-relaxed">
                Trong đó <LaTeX>{"z"}</LaTeX> là biến ẩn (k chiều),{" "}
                <LaTeX>{"W"}</LaTeX> là ma trận loading (d×k),{" "}
                <LaTeX>{String.raw`\mu`}</LaTeX> là mean,{" "}
                <LaTeX>{String.raw`\varepsilon`}</LaTeX> là nhiễu. Marginal
                likelihood:
              </p>

              <LaTeX block>
                {String.raw`p(x) = \mathcal{N}(x \mid \mu, WW^T + \sigma^2 I)`}
              </LaTeX>

              <p className="text-sm leading-relaxed">
                Maximum likelihood cho:
              </p>

              <LaTeX block>
                {String.raw`W_{ML} = V_k (\Lambda_k - \sigma^2 I)^{1/2} R`}
              </LaTeX>

              <p className="text-sm leading-relaxed">
                Với <LaTeX>{String.raw`V_k, \Lambda_k`}</LaTeX> là k eigenvector
                /eigenvalue đầu của <LaTeX>{"C"}</LaTeX> và <LaTeX>{"R"}</LaTeX>{" "}
                là ma trận xoay tùy ý. Khi{" "}
                <LaTeX>
                  {String.raw`\sigma^2 \to 0`}
                </LaTeX>
                , PPCA trở về PCA thường.
              </p>

              <p className="text-sm leading-relaxed">
                Ưu điểm của dạng xác suất:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>Xử lý missing values:</strong> dùng EM algorithm
                  thay cho fill bằng mean.
                </li>
                <li>
                  <strong>Bayesian model selection:</strong> so sánh các giá trị{" "}
                  <LaTeX>{"k"}</LaTeX> bằng evidence lower bound (ELBO) hoặc
                  BIC.
                </li>
                <li>
                  <strong>Sinh mẫu mới:</strong> sample{" "}
                  <LaTeX>
                    {String.raw`z \sim \mathcal{N}(0,I) \to x = Wz + \mu + \varepsilon`}
                  </LaTeX>
                  .
                </li>
                <li>
                  <strong>Mixture of PPCA:</strong> biến PPCA thành GMM —
                  clustering và dim reduction cùng lúc.
                </li>
                <li>
                  Nền móng của <strong>VAE (Variational Autoencoder)</strong> —
                  nếu bạn thay ma trận tuyến tính <LaTeX>{"W"}</LaTeX> bằng một
                  mạng neural phi tuyến, bạn được một VAE.
                </li>
              </ul>

              {/* ─── 4.9 Phương sai giải thích ─── */}
              <p>
                <strong>Tỷ lệ phương sai giải thích</strong> (explained variance
                ratio) cho biết mỗi thành phần chính giữ lại bao nhiêu phần trăm
                thông tin:
              </p>

              <LaTeX block>
                {String.raw`\text{Explained variance ratio}_k = \frac{\lambda_k}{\sum_{i=1}^{d} \lambda_i}`}
              </LaTeX>

              <p className="text-sm leading-relaxed">
                Trong đó <LaTeX>{String.raw`\lambda_k`}</LaTeX> là eigenvalue
                thứ <LaTeX>{"k"}</LaTeX>. Nếu eigenvalue đầu tiên rất lớn so với
                các eigenvalue còn lại, nghĩa là chỉ cần PC1 đã giữ được phần
                lớn thông tin.
              </p>

              <Callout variant="info" title="Ví dụ: Tóm tắt hồ sơ sinh viên">
                Hãy tưởng tượng bạn có 100 đặc trưng mô tả sinh viên (điểm từng
                môn, giờ học, giờ ngủ, thu nhập gia đình...). Sau khi chạy PCA,
                bạn phát hiện 5 thành phần chính đầu tiên giải thích 95% phương
                sai. Nghĩa là từ 100 con số, bạn chỉ cần 5 con số đã nắm được
                gần như toàn bộ thông tin!
              </Callout>

              <InlineChallenge
                question="Dữ liệu 10 chiều có eigenvalues: [5, 3, 1, 0.5, 0.2, 0.1, 0.08, 0.06, 0.04, 0.02]. PC1 giải thích bao nhiêu % phương sai?"
                options={["30%", "50%", "80%", "100%"]}
                correct={1}
                explanation="Tổng eigenvalues = 10,0. PC1 có λ₁ = 5,0. Tỷ lệ = 5/10 = 50%. Chỉ riêng PC1 đã giữ được một nửa thông tin!"
              />

              {/* ─── 4.10 Code blocks ─── */}
              <CodeBlock
                language="python"
                title="PCA bằng numpy thuần — theo đúng 4 bước"
              >
{`import numpy as np

# Dữ liệu: X shape (n, d) — n samples, d features
X = np.random.randn(200, 5)

# ── Bước 1: trung tâm hoá ──
X_centered = X - X.mean(axis=0)

# ── Bước 2: ma trận hiệp phương sai ──
C = (X_centered.T @ X_centered) / X_centered.shape[0]
# C có shape (d, d)

# ── Bước 3: eigendecomposition ──
# np.linalg.eigh chuyên cho ma trận đối xứng thực — trả ra
# eigenvalues đã sắp xếp (tăng dần)
eigvals, eigvecs = np.linalg.eigh(C)

# Đảo để có giảm dần
eigvals = eigvals[::-1]
eigvecs = eigvecs[:, ::-1]

print("Eigenvalues (lớn → nhỏ):", eigvals)
print("Variance explained ratio:", eigvals / eigvals.sum())

# ── Bước 4: chiếu xuống k chiều ──
k = 2
V_k = eigvecs[:, :k]          # (d, k)
Z = X_centered @ V_k          # (n, k)

# Tái tạo ngược (lossy) để kiểm tra
X_reconstructed = Z @ V_k.T + X.mean(axis=0)
reconstruction_error = np.mean((X - X_reconstructed) ** 2)
print(f"Reconstruction error (MSE): {reconstruction_error:.4f}")`}
              </CodeBlock>

              <CodeBlock
                language="python"
                title="SVD-based PCA (cách scikit-learn làm)"
              >
{`import numpy as np
from sklearn.decomposition import PCA, KernelPCA
from sklearn.datasets import make_moons, make_circles

# ─── 1. PCA thường dùng SVD (ổn định số học hơn) ──────────────
X = np.random.randn(200, 5)
X_centered = X - X.mean(axis=0)

# Thin SVD
U, S, Vt = np.linalg.svd(X_centered, full_matrices=False)

# Eigenvalues của ma trận hiệp phương sai
n = X_centered.shape[0]
eigvals = (S ** 2) / n

# Principal components (cột là eigenvector)
V = Vt.T

# Scores (tọa độ mới) = U * S
k = 2
Z = (U @ np.diag(S))[:, :k]
print("Scores shape:", Z.shape)

# ─── 2. sklearn wrapper ──────────────────────────────────────
pca = PCA(n_components=2)
Z_sklearn = pca.fit_transform(X)
print("Explained variance ratio:", pca.explained_variance_ratio_)
print("Tổng:", pca.explained_variance_ratio_.sum())

# ─── 3. Whitening ────────────────────────────────────────────
pca_white = PCA(n_components=5, whiten=True)
Z_white = pca_white.fit_transform(X)
# Sau whitening: mỗi chiều của Z_white có variance ≈ 1
print("Variance per dim (after whiten):", Z_white.var(axis=0))

# ─── 4. Kernel PCA — dataset phi tuyến ───────────────────────
X_circles, y_circles = make_circles(n_samples=300, factor=0.3, noise=0.05)

# PCA thường: không tách được
pca = PCA(n_components=2).fit_transform(X_circles)

# Kernel PCA với RBF
kpca = KernelPCA(n_components=2, kernel="rbf", gamma=15)
Z_kpca = kpca.fit_transform(X_circles)
# Z_kpca sẽ tách 2 vòng tròn dọc theo trục đầu tiên.`}
              </CodeBlock>

              {/* ─── 4.11 Kết nối ML ─── */}
              <p>
                PCA và eigendecomposition xuất hiện ở nhiều nơi trong AI/ML
                hiện đại:
              </p>

              <ul className="list-disc list-inside space-y-2 pl-2 text-sm leading-relaxed">
                <li>
                  <strong>Nén embedding:</strong>{" "}
                  <TopicLink slug="word-embeddings">Word embeddings</TopicLink>{" "}
                  300 chiều có thể giảm xuống 50 chiều bằng PCA mà gần như
                  không mất thông tin — giúp mô hình chạy nhanh hơn, tốn ít bộ
                  nhớ hơn.
                </li>
                <li>
                  <strong>Trực quan hoá dữ liệu:</strong> Chiếu dữ liệu đa chiều
                  xuống 2D/3D để con người nhìn thấy cấu trúc nhóm (cluster).
                  PCA là lựa chọn nhanh, t-SNE/UMAP là phi tuyến.
                </li>
                <li>
                  <strong>Loại bỏ nhiễu:</strong> Các thành phần có eigenvalue
                  nhỏ thường là nhiễu. Bỏ chúng đi giúp mô hình học tốt hơn
                  (denoising autoencoder có họ hàng với PCA ở dạng tuyến tính).
                </li>
                <li>
                  <strong>Eigenfaces (nhận diện khuôn mặt):</strong> Ứng dụng
                  PCA cổ điển của Turk &amp; Pentland (1991) — mỗi khuôn mặt là
                  tổ hợp tuyến tính của ~100 &quot;eigenfaces&quot;.
                </li>
                <li>
                  <strong>LoRA (Low-Rank Adaptation):</strong> ý tưởng của LoRA
                  là trọng số cập nhật của LLM có low rank — tương đương việc
                  hầu hết eigenvalues của ma trận delta gần 0. Chỉ cần giữ
                  top-r eigenvector → giảm 1000× tham số.
                </li>
                <li>
                  <strong>Attention và rank collapse:</strong> Trong Transformer,
                  phép tính{" "}
                  <LaTeX>{String.raw`Q \times K^T`}</LaTeX> tạo ra ma trận tương
                  đồng giữa các token. Khi số lớp tăng, rank của ma trận này có
                  xu hướng sụp về 1 (rank collapse) — phân tích spectrum giúp
                  hiểu hiện tượng này.
                </li>
                <li>
                  <strong>PageRank:</strong> eigenvector ứng với eigenvalue lớn
                  nhất của ma trận chuyển tiếp web graph chính là xếp hạng
                  PageRank của Google.
                </li>
                <li>
                  <strong>VAE, Diffusion models:</strong> mô hình sinh dạng
                  latent variable là mở rộng phi tuyến của PPCA.
                </li>
              </ul>

              <Callout
                variant="tip"
                title="Tại sao eigendecomposition quan trọng đến vậy?"
              >
                Ở tầm nhìn rộng, nhiều hiện tượng trong ML có dạng{" "}
                <em>&quot;phân tích ma trận thành các hướng độc lập&quot;</em>:
                PCA, SVD, LoRA, attention analysis, PageRank, spectral
                clustering, GNN. Nắm vững eigendecomposition = một chìa khoá mở
                rất nhiều cánh cửa.
              </Callout>

              {/* ─── 4.12 Thử thách thứ hai ─── */}
              <InlineChallenge
                question="Ma trận dữ liệu X có shape (1_000_000, 512). Bạn nên dùng eigendecomposition của XᵀX hay SVD của X để làm PCA?"
                options={[
                  "SVD của X — ổn định số học, tránh bình phương sai số",
                  "Eigendecomposition của XᵀX — vì nhanh hơn",
                  "Cả hai đều sai",
                  "Phải dùng Kernel PCA",
                ]}
                correct={0}
                explanation="XᵀX là ma trận 512×512 — nhỏ, nhưng việc bình phương giá trị trong X có thể phóng đại sai số float. SVD của X (dùng randomized SVD cho quy mô lớn) là lựa chọn tiêu chuẩn. scikit-learn PCA mặc định dùng SVD (randomized khi n_components ≤ min(n, d))."
              />

              {/* ─── 4.13 CollapsibleDetail 1: Chứng minh phương sai cực đại ─── */}
              <CollapsibleDetail title="Chi tiết: Chứng minh PC1 = eigenvector của eigenvalue lớn nhất">
                <div className="space-y-2 text-sm leading-relaxed">
                  <p>
                    Bài toán: tìm hướng đơn vị <LaTeX>{"u"}</LaTeX> (với{" "}
                    <LaTeX>{String.raw`\|u\|=1`}</LaTeX>) sao cho phương sai
                    của dữ liệu khi chiếu lên <LaTeX>{"u"}</LaTeX> là lớn nhất:
                  </p>
                  <LaTeX block>
                    {String.raw`\max_{u:\; \|u\|=1} \; \operatorname{Var}(\tilde{X} u) = \max_{u:\; \|u\|=1} \; u^T C u`}
                  </LaTeX>
                  <p>
                    Dùng Lagrange multiplier:{" "}
                    <LaTeX>
                      {String.raw`\mathcal{L}(u, \lambda) = u^T C u - \lambda(u^T u - 1)`}
                    </LaTeX>
                    . Lấy đạo hàm theo <LaTeX>{"u"}</LaTeX> và cho bằng 0:
                  </p>
                  <LaTeX block>
                    {String.raw`\nabla_u \mathcal{L} = 2Cu - 2\lambda u = 0 \;\Longrightarrow\; C u = \lambda u`}
                  </LaTeX>
                  <p>
                    Vậy <LaTeX>{"u"}</LaTeX> phải là eigenvector của{" "}
                    <LaTeX>{"C"}</LaTeX>! Giá trị mục tiêu tại nghiệm:{" "}
                    <LaTeX>
                      {String.raw`u^T C u = u^T(\lambda u) = \lambda`}
                    </LaTeX>
                    . Để tối đa, chọn{" "}
                    <LaTeX>
                      {String.raw`\lambda = \lambda_{\max}`}
                    </LaTeX>{" "}
                    — eigenvalue lớn nhất. Đây là lý do toán học:{" "}
                    <strong>
                      tìm hướng phương sai lớn nhất ⇔ tìm eigenvector có
                      eigenvalue lớn nhất
                    </strong>
                    .
                  </p>
                  <p>
                    Lặp lại lập luận (với ràng buộc{" "}
                    <LaTeX>
                      {String.raw`u \perp u_1`}
                    </LaTeX>
                    ) cho PC2, PC3, ... — ta được một hệ trực giao các
                    eigenvector, ứng với chuỗi eigenvalues giảm dần.
                  </p>
                </div>
              </CollapsibleDetail>

              {/* ─── 4.14 CollapsibleDetail 2: Chọn số chiều k ─── */}
              <CollapsibleDetail title="Chi tiết: Chọn số chiều k (scree plot, elbow, Kaiser, BIC)">
                <div className="space-y-2 text-sm leading-relaxed">
                  <p>
                    Bao nhiêu chiều là đủ? Một số cách phổ biến:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 pl-2">
                    <li>
                      <strong>Ngưỡng phương sai cộng dồn</strong> — chọn{" "}
                      <LaTeX>{"k"}</LaTeX> nhỏ nhất sao cho{" "}
                      <LaTeX>
                        {String.raw`\sum_{i=1}^k \lambda_i / \sum_i \lambda_i \ge 0.95`}
                      </LaTeX>
                      .
                    </li>
                    <li>
                      <strong>Scree plot (elbow):</strong> vẽ eigenvalues theo
                      thứ tự giảm dần; tìm &quot;khuỷu tay&quot; nơi đồ thị đi
                      ngang. Mắt người thường thấy khuỷu ở đâu eigenvalue
                      giảm đột ngột.
                    </li>
                    <li>
                      <strong>Kaiser criterion:</strong> giữ các PC có{" "}
                      <LaTeX>{String.raw`\lambda_i > 1`}</LaTeX> (sau khi
                      chuẩn hoá feature về variance 1). Nghĩa là giữ các PC
                      giải thích <em>nhiều hơn</em> một feature trung bình.
                    </li>
                    <li>
                      <strong>Parallel analysis (Horn, 1965):</strong> so sánh
                      eigenvalues của dữ liệu với eigenvalues của dữ liệu ngẫu
                      nhiên cùng kích thước. Giữ các PC có eigenvalue{" "}
                      <em>vượt</em> đường baseline ngẫu nhiên.
                    </li>
                    <li>
                      <strong>BIC / cross-validation (PPCA):</strong> với khung
                      xác suất, có thể tính log-likelihood trên tập validation
                      theo <LaTeX>{"k"}</LaTeX>, chọn <LaTeX>{"k"}</LaTeX> cực
                      đại hoá BIC.
                    </li>
                    <li>
                      <strong>Mục đích hạ nguồn:</strong> cuối cùng, hãy chọn{" "}
                      <LaTeX>{"k"}</LaTeX> sao cho mô hình downstream
                      (classifier, regressor) hoạt động tốt nhất trên validation
                      set. Lý thuyết đẹp nhưng thực tế là vua.
                    </li>
                  </ol>
                  <p>
                    Trong thực tế, người ta thường chạy thử{" "}
                    <LaTeX>
                      {String.raw`k \in \{10, 50, 100, 200\}`}
                    </LaTeX>{" "}
                    và xem ROC/accuracy — đơn giản mà hiệu quả.
                  </p>
                </div>
              </CollapsibleDetail>

              {/* ─── 4.15 Ứng dụng thực tế ─── */}
              <p>
                <strong>Ứng dụng thực tế:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>Eigenfaces</strong> — nhận diện khuôn mặt cổ điển với
                  PCA của pixel, làm nền cho face recognition thế hệ đầu (trước
                  deep learning).
                </li>
                <li>
                  <strong>Nén ảnh JPEG-like</strong> — không dùng PCA nhưng
                  dùng DCT (một phép biến đổi họ hàng), ý tưởng tương tự: giữ
                  lại các thành phần có năng lượng lớn.
                </li>
                <li>
                  <strong>Genomics (GWAS):</strong> PCA trên SNP data để hiệu
                  chỉnh ảnh hưởng của cấu trúc dân số.
                </li>
                <li>
                  <strong>Finance:</strong> phân tích correlation của returns
                  cổ phiếu — PC1 thường là &quot;thị trường chung&quot;, PC2 là
                  &quot;growth vs value&quot;, ...
                </li>
                <li>
                  <strong>NLP trước deep learning:</strong> Latent Semantic
                  Analysis (LSA) là SVD của ma trận term-document — cha đẻ của
                  word embeddings hiện đại.
                </li>
                <li>
                  <strong>Neuroscience:</strong> PCA trên tín hiệu fMRI / EEG
                  để tìm &quot;modes&quot; hoạt động não chính.
                </li>
                <li>
                  <strong>Recommendation systems (SVD++):</strong> SVD của ma
                  trận user-item là nền tảng của collaborative filtering.
                </li>
              </ul>

              {/* ─── 4.16 Pitfalls ─── */}
              <p>
                <strong>Pitfalls thường gặp:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>Quên scale feature:</strong> nếu một feature có đơn
                  vị lớn (VND vs cm), nó sẽ lấn át tất cả. Luôn dùng{" "}
                  <code>StandardScaler</code> trước PCA (trừ khi bạn biết mình
                  đang làm gì).
                </li>
                <li>
                  <strong>Hiểu sai eigenvector như &quot;feature gốc&quot;:</strong>{" "}
                  mỗi PC là một tổ hợp tuyến tính của tất cả feature gốc, khó
                  diễn giải. Có thể dùng <em>factor rotation</em> (varimax)
                  để làm PC &quot;sparse&quot; hơn.
                </li>
                <li>
                  <strong>Dùng PCA cho dữ liệu phi tuyến:</strong> nếu dữ liệu
                  có manifold cong, PCA tuyến tính sẽ &quot;mất&quot; cấu trúc.
                  Dùng Kernel PCA, t-SNE, UMAP, hoặc autoencoder thay thế.
                </li>
                <li>
                  <strong>Áp PCA lên y:</strong> PCA là unsupervised, không
                  biết nhãn <LaTeX>{"y"}</LaTeX>. Có thể một PC nhỏ lại chứa
                  thông tin quyết định nhất cho classification! Cân nhắc LDA
                  (Linear Discriminant Analysis) nếu có nhãn.
                </li>
                <li>
                  <strong>Data leak:</strong> Fit PCA trên toàn bộ dữ liệu
                  (bao gồm test set) → leak. Luôn fit trên train, transform cho
                  test.
                </li>
                <li>
                  <strong>Outliers:</strong> PCA cực nhạy với outlier (vì
                  variance bị đẩy). Dùng Robust PCA hoặc loại outlier trước.
                </li>
                <li>
                  <strong>Lật dấu eigenvector:</strong>{" "}
                  <LaTeX>{"v"}</LaTeX> và <LaTeX>{"-v"}</LaTeX> đều là
                  eigenvector hợp lệ — khác thư viện/random seed có thể đổi
                  dấu, khiến kết quả nhìn &quot;khác&quot; dù không sai.
                </li>
              </ul>
            </ExplanationSection>
          </LessonSection>

          {/* ================================================================
             STEP 5 — Phụ: kết nối sang word embeddings (giữ tinh thần cũ)
             ================================================================ */}
          <LessonSection
            step={5}
            totalSteps={TOTAL_STEPS}
            label="Kết nối ML hiện đại"
          >
            <p className="text-sm leading-relaxed">
              Khi GPT tạo embedding cho một từ, embedding đó nằm trong không
              gian hàng nghìn chiều. Nhưng thông tin thực sự hữu ích thường chỉ
              nằm trên vài chục hướng chính. PCA giúp ta nhìn thấy điều đó — và
              đây là lý do ta có thể nén mô hình mà không mất nhiều chất lượng.
              LoRA đi xa hơn: giả định <em>delta trọng số</em> khi fine-tune
              cũng có low-rank, nên chỉ cần học{" "}
              <LaTeX>{String.raw`\Delta W = BA`}</LaTeX> với{" "}
              <LaTeX>{"B"}</LaTeX> và <LaTeX>{"A"}</LaTeX> rất nhỏ.
            </p>
            <AhaMoment>
              Ý tưởng &quot;dữ liệu cao chiều sống trên manifold thấp
              chiều&quot; (manifold hypothesis) là nền móng của rất nhiều kỹ
              thuật hiện đại: VAE, diffusion models, LoRA, adapter. PCA là
              phiên bản tuyến tính đầu tiên và vẫn hữu ích để kiểm tra nhanh
              giả thuyết đó.
            </AhaMoment>
          </LessonSection>

          {/* ================================================================
             STEP 6 — MINI SUMMARY (6 điểm)
             ================================================================ */}
          <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
            <MiniSummary
              title="Sáu điều cần nhớ về Eigendecomposition & PCA"
              points={[
                "Eigenvector = hướng mà ma trận chỉ kéo giãn, không xoay. Eigenvalue = hệ số kéo giãn. Cặp (λ, v) thoả A v = λ v.",
                "Ma trận hiệp phương sai C là đối xứng, nửa xác định dương → luôn có d eigenvector trực giao. Eigenvector của C = các PC.",
                "SVD của X đã trung tâm hoá cho ra PC trực tiếp và ổn định số học hơn eigendecomposition của XᵀX. Quan hệ: λᵢ = σᵢ² / n.",
                "Whitening (Λ^(-1/2) Vᵀ) biến dữ liệu thành phân phối có Cov = I. ZCA-whitening giữ hình ảnh 'giống gốc' nhất — hay dùng trong CV.",
                "Kernel PCA mở rộng PCA sang phi tuyến qua kernel trick. Probabilistic PCA đặt PCA trong khung xác suất — nền móng của VAE.",
                "Pitfalls: quên scale feature, áp dụng PCA cho dữ liệu phi tuyến mạnh, data leak giữa train/test, outliers, lật dấu eigenvector.",
              ]}
            />
            <p className="text-sm leading-relaxed mt-4">
              Tiếp theo, hãy tìm hiểu{" "}
              <TopicLink slug="word-embeddings">word embeddings</TopicLink> để
              xem PCA được dùng thế nào trong NLP, hoặc quay lại{" "}
              <TopicLink slug="vectors-and-matrices">
                Vector &amp; Ma trận
              </TopicLink>{" "}
              nếu bạn muốn ôn lại nền tảng.
            </p>
          </LessonSection>

          {/* ================================================================
             STEP 7 — QUIZ
             ================================================================ */}
          <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
            <QuizSection questions={quizQuestions} />
          </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
