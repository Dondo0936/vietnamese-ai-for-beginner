"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  LaTeX,
  TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

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

/* ── Constants ── */
const TOTAL_STEPS = 8;

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

/* ── Seeded PRNG (Mulberry32) for deterministic points ── */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── Generate 50 elliptical points with known PC directions ── */
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
const TOTAL_VARIANCE = DATA_POINTS.reduce((s, p) => {
  const dx = p[0] - CENTROID[0];
  const dy = p[1] - CENTROID[1];
  return s + dx * dx + dy * dy;
}, 0) / NUM_POINTS;

/* ── Helpers ── */
function projectOntoAxis(
  point: [number, number],
  center: [number, number],
  angle: number,
): number {
  const dx = point[0] - center[0];
  const dy = point[1] - center[1];
  return dx * Math.cos(angle) + dy * Math.sin(angle);
}

function computeVarianceAlongAxis(angle: number): number {
  const projections = DATA_POINTS.map((p) =>
    projectOntoAxis(p, CENTROID, angle),
  );
  const mean = projections.reduce((s, v) => s + v, 0) / projections.length;
  return (
    projections.reduce((s, v) => s + (v - mean) * (v - mean), 0) /
    projections.length
  );
}

/* PC2 angle is always perpendicular to PC1 */
function pc2Angle(pc1: number): number {
  return pc1 + Math.PI / 2;
}

/* Snapping threshold: if user is within this many radians of the true PC, snap */
const SNAP_THRESHOLD = 0.06;

export default function EigendecompositionPcaTopic() {
  /* ── State ── */
  const [userAngle, setUserAngle] = useState(0); // user-chosen PC1 angle
  const [phase, setPhase] = useState<"pc1" | "pc2" | "done">("pc1");
  const [foundPC1Angle, setFoundPC1Angle] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const isDragging = useRef(false);

  /* ── Derived ── */
  const variancePC1 = useMemo(
    () => computeVarianceAlongAxis(userAngle),
    [userAngle],
  );
  const varianceRatio = useMemo(
    () => Math.min(variancePC1 / TOTAL_VARIANCE, 1),
    [variancePC1],
  );

  const foundPC1Variance = useMemo(
    () => (foundPC1Angle !== null ? computeVarianceAlongAxis(foundPC1Angle) : 0),
    [foundPC1Angle],
  );
  const foundPC2Variance = useMemo(
    () =>
      foundPC1Angle !== null
        ? computeVarianceAlongAxis(pc2Angle(foundPC1Angle))
        : 0,
    [foundPC1Angle],
  );
  const totalFoundVariance = foundPC1Variance + foundPC2Variance;

  /* Projections for histogram */
  const projections = useMemo(
    () =>
      DATA_POINTS.map((p) => projectOntoAxis(p, CENTROID, userAngle)),
    [userAngle],
  );
  const projMin = useMemo(
    () => Math.min(...projections),
    [projections],
  );
  const projMax = useMemo(
    () => Math.max(...projections),
    [projections],
  );

  /* Is close to true PC1? (allow both directions) */
  const isNearPC1 = useMemo(() => {
    const diff1 = Math.abs(
      ((userAngle - TRUE_ANGLE + Math.PI) % (2 * Math.PI)) - Math.PI,
    );
    const diff2 = Math.abs(
      ((userAngle - TRUE_ANGLE - Math.PI + Math.PI) % (2 * Math.PI)) - Math.PI,
    );
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

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

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

  /* ── Quiz ── */
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "Eigenvector (vector riêng) của một ma trận là gì?",
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
            accept: ["vector riêng", "eigenvector", "eigenvectors", "vector riêng (eigenvector)"],
          },
        ],
        explanation:
          "PCA chiếu dữ liệu lên các vector riêng (eigenvector) của ma trận hiệp phương sai. Các vector riêng này chính là các trục mới — thành phần chính.",
      },
    ],
    [],
  );

  /* ── Render helpers ── */
  const axisLength = 3; // how far the rotation handle extends from centroid

  /* Current display angle for PC1 line */
  const displayAngle = phase === "pc1" ? userAngle : (foundPC1Angle ?? userAngle);
  /* PC2 display angle */
  const displayPC2 = pc2Angle(displayAngle);

  return (
    <>
      {/* ================================================================
          VISUALIZATION SECTION — PCA Puzzle
          ================================================================ */}
      <VisualizationSection topicSlug="eigendecomposition-pca">
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-foreground">
            Trò chơi PCA: Tìm hướng phương sai lớn nhất
          </h3>
          <p className="text-sm text-muted leading-relaxed">
            {phase === "pc1" &&
              "Kéo đường thẳng qua trọng tâm để xoay. Tìm hướng mà dữ liệu \"trải ra\" nhiều nhất — thanh phương sai sẽ đầy khi bạn tìm đúng PC1."}
            {phase === "pc2" &&
              "PC1 đã khóa! PC2 vuông góc với PC1 (đường nét đứt). Bấm \"Hoàn thành\" để xem kết quả."}
            {phase === "done" &&
              "Cả hai thành phần chính đã tìm xong. Xem tỷ lệ phương sai giải thích bên dưới."}
          </p>

          {/* Variance Explained bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">
                Phương sai giải thích (PC1):
              </span>
              <span className="font-mono font-bold text-accent text-lg">
                {(varianceRatio * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-5 rounded-full bg-surface-hover overflow-hidden border border-border">
              <div
                className="h-full rounded-full transition-all duration-150 ease-out"
                style={{
                  width: `${varianceRatio * 100}%`,
                  background:
                    varianceRatio > 0.9
                      ? "#22C55E"
                      : varianceRatio > 0.6
                        ? "#F59E0B"
                        : "#EF4444",
                }}
              />
            </div>
            <div className="text-xs text-muted text-center">
              {varianceRatio > 0.9
                ? "Nóng! Rất gần PC1 thật!"
                : varianceRatio > 0.7
                  ? "Ấm dần..."
                  : varianceRatio > 0.5
                    ? "Còn hơi lạnh"
                    : "Lạnh — thử hướng khác"}
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
              <line
                x1={20}
                y1={toSvgY(CENTROID[1])}
                x2={SW - 20}
                y2={toSvgY(CENTROID[1])}
                stroke="currentColor"
                className="text-border"
                strokeWidth="0.5"
              />
              <line
                x1={toSvgX(CENTROID[0])}
                y1={20}
                x2={toSvgX(CENTROID[0])}
                y2={260}
                stroke="currentColor"
                className="text-border"
                strokeWidth="0.5"
              />

              {/* Data points */}
              {DATA_POINTS.map((p, i) => (
                <circle
                  key={`pt-${i}`}
                  cx={toSvgX(p[0])}
                  cy={toSvgY(p[1])}
                  r="3.5"
                  fill="currentColor"
                  className="text-accent/60"
                  stroke="currentColor"
                  strokeWidth="0.5"
                />
              ))}

              {/* Centroid marker */}
              <circle
                cx={toSvgX(CENTROID[0])}
                cy={toSvgY(CENTROID[1])}
                r="5"
                fill="none"
                stroke="currentColor"
                className="text-foreground"
                strokeWidth="1.5"
              />
              <circle
                cx={toSvgX(CENTROID[0])}
                cy={toSvgY(CENTROID[1])}
                r="2"
                fill="currentColor"
                className="text-foreground"
              />

              {/* PC1 rotation handle line */}
              <line
                x1={toSvgX(
                  CENTROID[0] - axisLength * Math.cos(displayAngle),
                )}
                y1={toSvgY(
                  CENTROID[1] - axisLength * Math.sin(displayAngle),
                )}
                x2={toSvgX(
                  CENTROID[0] + axisLength * Math.cos(displayAngle),
                )}
                y2={toSvgY(
                  CENTROID[1] + axisLength * Math.sin(displayAngle),
                )}
                stroke="#3B82F6"
                strokeWidth={phase === "pc1" ? 2.5 : 2}
                strokeLinecap="round"
              />
              {/* Draggable handle circle at end of PC1 */}
              {phase === "pc1" && (
                <circle
                  cx={toSvgX(
                    CENTROID[0] + axisLength * Math.cos(displayAngle),
                  )}
                  cy={toSvgY(
                    CENTROID[1] + axisLength * Math.sin(displayAngle),
                  )}
                  r="8"
                  fill="#3B82F6"
                  fillOpacity="0.3"
                  stroke="#3B82F6"
                  strokeWidth="2"
                  className="cursor-grab active:cursor-grabbing"
                />
              )}
              <text
                x={toSvgX(
                  CENTROID[0] +
                    (axisLength + 0.3) * Math.cos(displayAngle),
                )}
                y={toSvgY(
                  CENTROID[1] +
                    (axisLength + 0.3) * Math.sin(displayAngle),
                )}
                fontSize="11"
                fontWeight="bold"
                fill="#3B82F6"
              >
                PC1
              </text>

              {/* PC2 line (shown when PC1 is locked or done) */}
              {(phase === "pc2" || phase === "done") && (
                <>
                  <line
                    x1={toSvgX(
                      CENTROID[0] -
                        (axisLength * 0.7) * Math.cos(displayPC2),
                    )}
                    y1={toSvgY(
                      CENTROID[1] -
                        (axisLength * 0.7) * Math.sin(displayPC2),
                    )}
                    x2={toSvgX(
                      CENTROID[0] +
                        (axisLength * 0.7) * Math.cos(displayPC2),
                    )}
                    y2={toSvgY(
                      CENTROID[1] +
                        (axisLength * 0.7) * Math.sin(displayPC2),
                    )}
                    stroke="#EF4444"
                    strokeWidth="2"
                    strokeDasharray="6,3"
                    strokeLinecap="round"
                  />
                  <text
                    x={toSvgX(
                      CENTROID[0] +
                        (axisLength * 0.7 + 0.3) *
                          Math.cos(displayPC2),
                    )}
                    y={toSvgY(
                      CENTROID[1] +
                        (axisLength * 0.7 + 0.3) *
                          Math.sin(displayPC2),
                    )}
                    fontSize="11"
                    fontWeight="bold"
                    fill="#EF4444"
                  >
                    PC2
                  </text>
                </>
              )}

              {/* Projection lines from points to PC1 axis */}
              {DATA_POINTS.map((p, i) => {
                const proj = projections[i];
                const projX =
                  CENTROID[0] + proj * Math.cos(displayAngle);
                const projY =
                  CENTROID[1] + proj * Math.sin(displayAngle);
                return (
                  <line
                    key={`proj-${i}`}
                    x1={toSvgX(p[0])}
                    y1={toSvgY(p[1])}
                    x2={toSvgX(projX)}
                    y2={toSvgY(projY)}
                    stroke="currentColor"
                    className="text-accent/15"
                    strokeWidth="0.5"
                  />
                );
              })}

              {/* ── 1D Histogram ── */}
              <line
                x1={20}
                y1={HIST_Y - 5}
                x2={SW - 20}
                y2={HIST_Y - 5}
                stroke="currentColor"
                className="text-border"
                strokeWidth="0.5"
              />
              <text
                x={20}
                y={HIST_Y - 10}
                fontSize="9"
                fill="currentColor"
                className="text-muted"
              >
                Phân bố chiếu lên trục
              </text>
              {projections.map((proj, i) => {
                const range = projMax - projMin || 1;
                const normX = 20 + ((proj - projMin) / range) * HIST_W;
                return (
                  <circle
                    key={`hist-${i}`}
                    cx={normX}
                    cy={HIST_Y + HIST_H / 2}
                    r="3"
                    fill="currentColor"
                    className="text-accent/50"
                  />
                );
              })}
            </svg>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 justify-center flex-wrap">
            {phase === "pc1" && (
              <button
                onClick={handleLockPC1}
                disabled={!isNearPC1}
                className="rounded-lg px-4 py-2 text-sm font-medium bg-accent text-white hover:bg-accent-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {isNearPC1
                  ? "Khóa PC1 (tuyệt vời!)"
                  : "Chưa đủ gần PC1 — tiếp tục xoay"}
              </button>
            )}
            {phase === "pc2" && (
              <button
                onClick={handleFinish}
                className="rounded-lg px-4 py-2 text-sm font-medium bg-accent text-white hover:bg-accent-dark transition-colors"
              >
                Hoàn thành — xem kết quả
              </button>
            )}
            <button
              onClick={handleReset}
              className="rounded-lg px-4 py-2 text-sm font-medium border border-border text-foreground hover:bg-surface-hover transition-colors"
            >
              Làm lại
            </button>
          </div>

          {/* Final reveal */}
          {phase === "done" && foundPC1Angle !== null && (
            <div className="rounded-lg border border-accent/30 bg-accent-light/30 p-4 space-y-3">
              <p className="font-semibold text-accent-dark text-sm">
                Kết quả phân tích PCA:
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg border border-border bg-surface p-3 text-center">
                  <div className="text-xs text-muted mb-1">PC1</div>
                  <div className="font-mono font-bold text-blue-500 text-lg">
                    {totalFoundVariance > 0
                      ? ((foundPC1Variance / totalFoundVariance) * 100).toFixed(
                          1,
                        )
                      : "—"}
                    %
                  </div>
                  <div className="text-xs text-muted">phương sai</div>
                </div>
                <div className="rounded-lg border border-border bg-surface p-3 text-center">
                  <div className="text-xs text-muted mb-1">PC2</div>
                  <div className="font-mono font-bold text-red-500 text-lg">
                    {totalFoundVariance > 0
                      ? ((foundPC2Variance / totalFoundVariance) * 100).toFixed(
                          1,
                        )
                      : "—"}
                    %
                  </div>
                  <div className="text-xs text-muted">phương sai</div>
                </div>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Tổng: ~100%. Trong không gian 2D, hai PC nắm giữ toàn bộ
                thông tin. Nhưng với dữ liệu 100 chiều, có thể chỉ cần 5-10
                PC đã giữ được 95% thông tin!
              </p>
            </div>
          )}
        </div>
      </VisualizationSection>

      {/* ================================================================
          EXPLANATION SECTION
          ================================================================ */}
      <ExplanationSection topicSlug="eigendecomposition-pca">
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
            <p className="mt-3 text-sm text-muted leading-relaxed">
              Tiếp tục để tìm hiểu eigenvector, eigenvalue và PCA — công cụ
              giảm chiều mạnh nhất trong ML.
            </p>
          </PredictionGate>
        </LessonSection>

        <LessonSection
          step={2}
          totalSteps={TOTAL_STEPS}
          label="Trị riêng & vector riêng"
        >
          <p className="text-sm leading-relaxed">
            Trong bài{" "}
            <TopicLink slug="vectors-and-matrices">
              Vector & Ma trận
            </TopicLink>
            , bạn đã biết rằng nhân ma trận với vector sẽ{" "}
            <strong>biến đổi</strong> vector đó (xoay, kéo giãn, lật...).
            Nhưng có những hướng đặc biệt mà ma trận{" "}
            <strong>chỉ kéo giãn, không xoay</strong>:
          </p>

          <LaTeX block>
            {String.raw`A \vec{v} = \lambda \vec{v}`}
          </LaTeX>

          <ul className="list-disc list-inside space-y-2 pl-2 text-sm leading-relaxed">
            <li>
              <LaTeX>{String.raw`\vec{v}`}</LaTeX> là{" "}
              <strong>vector riêng</strong> (eigenvector) — hướng không bị
              xoay
            </li>
            <li>
              <LaTeX>{String.raw`\lambda`}</LaTeX> là{" "}
              <strong>trị riêng</strong> (eigenvalue) — hệ số kéo giãn theo
              hướng đó
            </li>
          </ul>

          <Callout variant="tip" title="Ví dụ: Cánh cửa bản lề">
            Hãy tưởng tượng bạn đẩy một cánh cửa. Bản lề là eigenvector —
            hướng mà cửa chỉ chuyển động dọc theo, không bị lệch sang hướng
            khác. Eigenvalue cho biết cửa mở rộng hay hẹp bao nhiêu theo
            hướng đó.
          </Callout>

          <AhaMoment>
            Trong PCA, eigenvector của ma trận hiệp phương sai chính là các
            hướng mà dữ liệu trải ra nhiều nhất. Eigenvalue cho biết dữ liệu
            trải ra bao nhiêu theo hướng đó. Đây là lý do eigenvector và PCA
            gắn liền với nhau!
          </AhaMoment>
        </LessonSection>

        <LessonSection
          step={3}
          totalSteps={TOTAL_STEPS}
          label="Ma trận hiệp phương sai"
        >
          <p className="text-sm leading-relaxed">
            <strong>Ma trận hiệp phương sai</strong> (covariance matrix) đo
            mức độ các đặc trưng (feature) thay đổi cùng nhau. Với dữ liệu
            có <LaTeX>{"d"}</LaTeX> đặc trưng, ma trận hiệp phương sai có
            kích thước <LaTeX>{String.raw`d \times d`}</LaTeX>:
          </p>

          <LaTeX block>
            {String.raw`C = \frac{1}{n} \sum_{i=1}^{n} (\vec{x}_i - \bar{\vec{x}})(\vec{x}_i - \bar{\vec{x}})^T`}
          </LaTeX>

          <p className="text-sm leading-relaxed">
            Phần tử <LaTeX>{"C_{jk}"}</LaTeX> cho biết đặc trưng thứ{" "}
            <LaTeX>{"j"}</LaTeX> và <LaTeX>{"k"}</LaTeX> có xu hướng tăng/giảm
            cùng nhau không. Trên đường chéo chính là phương sai (variance)
            của từng đặc trưng.
          </p>

          <Callout variant="info" title="Ví dụ: Chiều cao và cân nặng">
            Nếu bạn đo chiều cao và cân nặng của 100 người, hai đặc trưng này
            có hiệp phương sai dương (cao thường nặng hơn). Ma trận hiệp
            phương sai nắm bắt mối quan hệ này. Eigenvector của nó cho biết
            hướng &quot;cao-và-nặng&quot; là hướng dữ liệu biến đổi nhiều nhất.
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
            explanation="C₁₂ = 0 nghĩa là hiệp phương sai giữa đặc trưng 1 và 2 bằng 0 — chúng thay đổi độc lập với nhau."
          />
        </LessonSection>

        <LessonSection step={4} totalSteps={TOTAL_STEPS} label="PCA hoạt động thế nào">
          <p className="text-sm leading-relaxed">
            <strong>PCA</strong> (phân tích thành phần chính — Principal
            Component Analysis) giảm chiều dữ liệu trong 4 bước:
          </p>

          <ol className="list-decimal list-inside space-y-2 pl-2 text-sm leading-relaxed">
            <li>
              <strong>Chuẩn hóa:</strong> Trừ trung bình để dữ liệu có tâm
              tại gốc tọa độ
            </li>
            <li>
              <strong>Tính ma trận hiệp phương sai:</strong>{" "}
              <LaTeX>{String.raw`C = \frac{1}{n} X^T X`}</LaTeX>
            </li>
            <li>
              <strong>Tìm eigenvector và eigenvalue:</strong> Giải phương
              trình <LaTeX>{String.raw`C\vec{v} = \lambda\vec{v}`}</LaTeX>
            </li>
            <li>
              <strong>Chiếu dữ liệu:</strong> Giữ lại{" "}
              <LaTeX>{"k"}</LaTeX> eigenvector có eigenvalue lớn nhất, chiếu
              dữ liệu lên các hướng đó
            </li>
          </ol>

          <Callout variant="tip" title="PCA = chọn góc chụp ảnh tốt nhất">
            Hãy tưởng tượng bạn muốn chụp ảnh một tòa nhà phức tạp bằng một
            bức ảnh duy nhất. Bạn sẽ chọn góc nào? Góc nhìn mà tòa nhà trông
            &quot;khác biệt nhất&quot; — nơi bạn thấy được nhiều chi tiết nhất.
            PCA làm đúng điều đó: tìm &quot;góc chụp&quot; mà dữ liệu đa chiều
            hiện ra nhiều thông tin nhất khi chiếu xuống ít chiều hơn.
          </Callout>

          <p className="text-sm leading-relaxed mt-3">
            Quay lại phần <strong>Hình minh họa</strong> phía trên. Khi bạn
            xoay trục và tìm hướng có phương sai lớn nhất — bạn đang làm
            chính xác bước 3 và 4 của PCA bằng tay!
          </p>
        </LessonSection>

        <LessonSection
          step={5}
          totalSteps={TOTAL_STEPS}
          label="Phương sai giải thích"
        >
          <p className="text-sm leading-relaxed">
            <strong>Tỷ lệ phương sai giải thích</strong> (explained variance
            ratio) cho biết mỗi thành phần chính giữ lại bao nhiêu phần trăm
            thông tin:
          </p>

          <LaTeX block>
            {String.raw`\text{Explained variance ratio}_k = \frac{\lambda_k}{\sum_{i=1}^{d} \lambda_i}`}
          </LaTeX>

          <p className="text-sm leading-relaxed">
            Trong đó <LaTeX>{String.raw`\lambda_k`}</LaTeX> là eigenvalue thứ{" "}
            <LaTeX>{"k"}</LaTeX>. Nếu eigenvalue đầu tiên rất lớn so với các
            eigenvalue còn lại, nghĩa là chỉ cần PC1 đã giữ được phần lớn
            thông tin.
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
        </LessonSection>

        <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Kết nối ML">
          <p className="text-sm leading-relaxed">
            PCA và eigendecomposition xuất hiện ở nhiều nơi trong AI/ML hiện
            đại:
          </p>

          <ul className="list-disc list-inside space-y-2 pl-2 text-sm leading-relaxed">
            <li>
              <strong>Nén embedding:</strong> Word embeddings 300 chiều có thể
              giảm xuống 50 chiều bằng PCA mà gần như không mất thông tin —
              giúp mô hình chạy nhanh hơn, tốn ít bộ nhớ hơn.
            </li>
            <li>
              <strong>Trực quan hóa dữ liệu:</strong> Chiếu dữ liệu đa chiều
              xuống 2D/3D để con người nhìn thấy cấu trúc nhóm (cluster).
            </li>
            <li>
              <strong>Loại bỏ nhiễu:</strong> Các thành phần có eigenvalue nhỏ
              thường là nhiễu. Bỏ chúng đi giúp mô hình học tốt hơn.
            </li>
            <li>
              <strong>Attention và ma trận tương đồng:</strong> Trong
              Transformer, phép tính{" "}
              <LaTeX>{String.raw`Q \times K^T`}</LaTeX> tạo ra ma trận tương
              đồng giữa các token. Cấu trúc của ma trận này (eigenvector,
              rank) quyết định mô hình chú ý đến những gì.
            </li>
          </ul>

          <AhaMoment>
            Khi GPT tạo embedding cho một từ, embedding đó nằm trong không gian
            hàng nghìn chiều. Nhưng thông tin thực sự hữu ích thường chỉ nằm
            trên vài chục hướng chính. PCA giúp ta nhìn thấy điều đó — và đây
            là lý do ta có thể nén mô hình mà không mất nhiều chất lượng.
          </AhaMoment>
        </LessonSection>

        <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tổng kết">
          <MiniSummary
            title="Những điều cần nhớ"
            points={[
              "Vector riêng (eigenvector) = hướng mà ma trận chỉ kéo giãn, không xoay. Trị riêng (eigenvalue) = hệ số kéo giãn.",
              "Ma trận hiệp phương sai (covariance matrix) đo mức độ các đặc trưng thay đổi cùng nhau. Eigenvector của nó = hướng dữ liệu trải ra nhiều nhất.",
              "PCA (phân tích thành phần chính) = chiếu dữ liệu lên các eigenvector có eigenvalue lớn nhất. Giảm chiều giữ tối đa thông tin.",
              "Tỷ lệ phương sai giải thích (explained variance ratio) = λₖ / Σλᵢ. Cho biết mỗi PC giữ bao nhiêu % thông tin.",
              "Ứng dụng: nén embedding, trực quan hóa, loại bỏ nhiễu, phân tích cấu trúc Attention.",
            ]}
          />
          <p className="text-sm leading-relaxed mt-4">
            Tiếp theo, hãy tìm hiểu{" "}
            <TopicLink slug="word-embeddings">word embeddings</TopicLink> để
            xem PCA được dùng thế nào trong NLP, hoặc quay lại{" "}
            <TopicLink slug="vectors-and-matrices">
              Vector & Ma trận
            </TopicLink>{" "}
            nếu bạn muốn ôn lại nền tảng.
          </p>
        </LessonSection>

        <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
          <QuizSection questions={quizQuestions} />
        </LessonSection>
      </ExplanationSection>
    </>
  );
}
