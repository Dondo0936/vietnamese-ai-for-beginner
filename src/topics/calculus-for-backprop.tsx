"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
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
  slug: "calculus-for-backprop",
  title: "Calculus for Backpropagation",
  titleVi: "Giải tích cho lan truyền ngược",
  description:
    "Đạo hàm, quy tắc chuỗi và gradient descent — toán học đằng sau quá trình huấn luyện mạng nơ-ron",
  category: "math-foundations",
  tags: ["derivatives", "chain-rule", "gradient-descent", "learning-rate"],
  difficulty: "intermediate",
  relatedSlugs: ["backpropagation", "gradient-descent", "loss-functions"],
  vizType: "interactive",
};

/* ── Constants ── */
const TOTAL_STEPS = 8;

/* SVG dimensions */
const W = 400;
const H = 300;

/* ── Stage 1: 1D loss curve ── */
const S1_CX = W / 2;
const S1_CY = H - 40;
const S1_SCALE_X = 50; // px per unit w
const S1_SCALE_Y = 8; // px per unit L (compressed)

/** L(w) = (w - 3)^2 + 1 */
function loss1D(w: number): number {
  return (w - 3) ** 2 + 1;
}

/** dL/dw = 2(w - 3) */
function dLoss1D(w: number): number {
  return 2 * (w - 3);
}

/* ── Stage 2 & 3: 2D contour ── */
const C_CX = W / 2;
const C_CY = H / 2;
const C_SCALE = 50; // px per unit

/** L(w1, w2) = (w1-2)^2 + (w2-1)^2 + 0.5*w1*w2 */
function loss2D(w1: number, w2: number): number {
  return (w1 - 2) ** 2 + (w2 - 1) ** 2 + 0.5 * w1 * w2;
}

/** Gradient of L: [dL/dw1, dL/dw2] */
function grad2D(w1: number, w2: number): [number, number] {
  const dw1 = 2 * (w1 - 2) + 0.5 * w2;
  const dw2 = 2 * (w2 - 1) + 0.5 * w1;
  return [dw1, dw2];
}

/** Approximate minimum (solve grad = 0): w1 = 16/7.5, w2 = 8/7.5 -- roughly (2.133, 1.067) */

/* Generate contour levels */
const CONTOUR_LEVELS = [0.5, 1, 2, 3, 5, 8, 12, 18, 25];

/** Generate contour path points for a given level using marching squares-like sampling */
function contourPoints(
  level: number,
  rangeX: [number, number],
  rangeY: [number, number],
  steps: number,
): [number, number][] {
  const points: [number, number][] = [];
  for (let a = 0; a < 360; a += 4) {
    const rad = (a * Math.PI) / 180;
    // Search outward from approximate min
    const cx = 2.13;
    const cy = 1.07;
    let lo = 0;
    let hi = 6;
    for (let iter = 0; iter < 20; iter++) {
      const mid = (lo + hi) / 2;
      const px = cx + mid * Math.cos(rad);
      const py = cy + mid * Math.sin(rad);
      if (loss2D(px, py) < level) lo = mid;
      else hi = mid;
    }
    const r = (lo + hi) / 2;
    const px = cx + r * Math.cos(rad);
    const py = cy + r * Math.sin(rad);
    if (
      px >= rangeX[0] &&
      px <= rangeX[1] &&
      py >= rangeY[0] &&
      py <= rangeY[1]
    ) {
      points.push([px, py]);
    }
  }
  return points;
}

/** Contour color based on level */
function contourColor(level: number): string {
  const t = Math.min(level / 25, 1);
  // blue (low) -> yellow -> red (high)
  if (t < 0.5) {
    const s = t * 2;
    const r = Math.round(50 + 205 * s);
    const g = Math.round(100 + 155 * s);
    const b = Math.round(200 * (1 - s));
    return `rgb(${r},${g},${b})`;
  }
  const s = (t - 0.5) * 2;
  const r = 255;
  const g = Math.round(255 * (1 - s));
  const b = 0;
  return `rgb(${r},${g},${b})`;
}

export default function CalculusForBackpropTopic() {
  /* ── Viz stage management ── */
  const [stage, setStage] = useState<1 | 2 | 3>(1);

  /* ── Stage 1 state ── */
  const [ballW, setBallW] = useState(0.5);
  const [draggingBall, setDraggingBall] = useState(false);
  const svg1Ref = useRef<SVGSVGElement>(null);

  /* ── Stage 2 state ── */
  const [userClick, setUserClick] = useState<[number, number] | null>(null);
  const [s2Pos, setS2Pos] = useState<[number, number]>([0, 3]);
  const [s2Score, setS2Score] = useState<number | null>(null);
  const svg2Ref = useRef<SVGSVGElement>(null);

  /* ── Stage 3 state ── */
  const [lr, setLr] = useState(0.1);
  const [s3Pos, setS3Pos] = useState<[number, number]>([0, 3]);
  const [s3Trail, setS3Trail] = useState<[number, number][]>([[0, 3]]);
  const [autoRunning, setAutoRunning] = useState(false);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Stage 1 helpers ── */
  const toS1X = useCallback((w: number) => S1_CX + (w - 3) * S1_SCALE_X, []);
  const toS1Y = useCallback((l: number) => S1_CY - (l - 1) * S1_SCALE_Y, []);

  const curvePoints = useMemo(() => {
    const pts: string[] = [];
    for (let w = -0.5; w <= 6.5; w += 0.1) {
      const l = loss1D(w);
      if (l <= 30) pts.push(`${toS1X(w).toFixed(1)},${toS1Y(l).toFixed(1)}`);
    }
    return pts.join(" ");
  }, [toS1X, toS1Y]);

  const ballL = useMemo(() => loss1D(ballW), [ballW]);
  const ballGrad = useMemo(() => dLoss1D(ballW), [ballW]);

  const handleBallDrag = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!draggingBall) return;
      const svg = svg1Ref.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const scaleX = W / rect.width;
      const svgX = (e.clientX - rect.left) * scaleX;
      const w = (svgX - S1_CX) / S1_SCALE_X + 3;
      setBallW(Math.max(-0.3, Math.min(6.3, w)));
    },
    [draggingBall],
  );

  /* ── Stage 1: tangent line endpoints ── */
  const tangentLen = 1.2;
  const tangentX1 = ballW - tangentLen;
  const tangentY1 = ballL + ballGrad * (-tangentLen);
  const tangentX2 = ballW + tangentLen;
  const tangentY2 = ballL + ballGrad * tangentLen;

  /* ── Contour data (memoized) ── */
  const contours = useMemo(
    () =>
      CONTOUR_LEVELS.map((level) => ({
        level,
        points: contourPoints(level, [-2, 6], [-2, 5], 90),
      })),
    [],
  );

  /* ── Stage 2/3 coordinate helpers ── */
  const toCX = useCallback((x: number) => C_CX + (x - 2) * C_SCALE, []);
  const toCY = useCallback((y: number) => C_CY - (y - 1) * C_SCALE, []);
  const fromCX = useCallback((sx: number) => (sx - C_CX) / C_SCALE + 2, []);
  const fromCY = useCallback((sy: number) => -(sy - C_CY) / C_SCALE + 1, []);

  /* ── Stage 2: click handler ── */
  const handleContourClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svg2Ref.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      const svgX = (e.clientX - rect.left) * scaleX;
      const svgY = (e.clientY - rect.top) * scaleY;
      const clickW1 = fromCX(svgX);
      const clickW2 = fromCY(svgY);
      setUserClick([clickW1, clickW2]);

      // Calculate score: angle similarity between user direction and correct gradient step
      const [gw1, gw2] = grad2D(s2Pos[0], s2Pos[1]);
      const correctDirW1 = -gw1;
      const correctDirW2 = -gw2;
      const userDirW1 = clickW1 - s2Pos[0];
      const userDirW2 = clickW2 - s2Pos[1];
      const correctLen = Math.sqrt(
        correctDirW1 ** 2 + correctDirW2 ** 2,
      );
      const userLen = Math.sqrt(userDirW1 ** 2 + userDirW2 ** 2);
      if (correctLen < 0.001 || userLen < 0.001) {
        setS2Score(100);
        return;
      }
      const cosAngle =
        (correctDirW1 * userDirW1 + correctDirW2 * userDirW2) /
        (correctLen * userLen);
      setS2Score(Math.max(0, Math.round(((cosAngle + 1) / 2) * 100)));
    },
    [s2Pos, fromCX, fromCY],
  );

  const resetStage2 = useCallback(() => {
    // Pick a random starting point
    const newW1 = Math.random() * 4 - 1;
    const newW2 = Math.random() * 4 - 0.5;
    setS2Pos([newW1, newW2]);
    setUserClick(null);
    setS2Score(null);
  }, []);

  /* ── Stage 3: gradient step ── */
  const takeStep = useCallback(() => {
    setS3Pos((prev) => {
      const [gw1, gw2] = grad2D(prev[0], prev[1]);
      const next: [number, number] = [
        prev[0] - lr * gw1,
        prev[1] - lr * gw2,
      ];
      // Clamp to prevent going off-screen
      const clamped: [number, number] = [
        Math.max(-2, Math.min(6, next[0])),
        Math.max(-2, Math.min(5, next[1])),
      ];
      setS3Trail((t) => [...t, clamped]);
      return clamped;
    });
  }, [lr]);

  const resetStage3 = useCallback(() => {
    setS3Pos([0, 3]);
    setS3Trail([[0, 3]]);
    setAutoRunning(false);
    if (autoRef.current) {
      clearInterval(autoRef.current);
      autoRef.current = null;
    }
  }, []);

  /* Auto-run effect */
  useEffect(() => {
    if (autoRunning) {
      autoRef.current = setInterval(() => {
        takeStep();
      }, 300);
    } else if (autoRef.current) {
      clearInterval(autoRef.current);
      autoRef.current = null;
    }
    return () => {
      if (autoRef.current) {
        clearInterval(autoRef.current);
        autoRef.current = null;
      }
    };
  }, [autoRunning, takeStep]);

  /* Stop auto-run if loss diverges */
  useEffect(() => {
    const l = loss2D(s3Pos[0], s3Pos[1]);
    if (l > 200 || s3Trail.length > 200) {
      setAutoRunning(false);
    }
  }, [s3Pos, s3Trail.length]);

  /* ── Stage 2: gradient arrow from current position ── */
  const [g2w1, g2w2] = useMemo(() => grad2D(s2Pos[0], s2Pos[1]), [s2Pos]);
  const gradLen2 = Math.sqrt(g2w1 ** 2 + g2w2 ** 2);
  const arrowScale2 = gradLen2 > 0.01 ? Math.min(1.5 / gradLen2, 0.8) : 0;

  /* ── Quiz ── */
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          'Đạo hàm dL/dw = -4 nghĩa là gì?',
        options: [
          "Khi w tăng 1, loss tăng 4",
          "Khi w tăng 1, loss giảm 4",
          "Loss hiện tại bằng -4",
          "Weight hiện tại bằng -4",
        ],
        correct: 1,
        explanation:
          "dL/dw = -4 nghĩa là khi w tăng 1 đơn vị, loss giảm 4 đơn vị. Dấu âm = loss đang giảm theo hướng tăng w. Gradient descent sẽ tăng w vì: w_mới = w - lr × (-4) = w + 4 × lr.",
      },
      {
        question:
          "Nếu learning rate quá lớn, điều gì xảy ra?",
        options: [
          "Hội tụ nhanh hơn đến minimum",
          "Bước nhảy quá xa, loss tăng thay vì giảm (phân kỳ)",
          "Gradient biến mất",
          "Không ảnh hưởng gì",
        ],
        correct: 1,
        explanation:
          "Learning rate quá lớn khiến bước cập nhật quá dài, nhảy qua điểm minimum và loss tăng lên. Trong trường hợp cực đoan, loss phát tán đến vô cùng (diverge). Thử kéo slider learning rate trong hình minh họa Stage 3 lên 1.0 để thấy!",
      },
      {
        question:
          "Chain rule cho f(g(x)): df/dx = ?",
        options: [
          "df/dx = f'(x) + g'(x)",
          "df/dx = f'(x) × g'(x)",
          "df/dx = (df/dg) × (dg/dx)",
          "df/dx = df/dg + dg/dx",
        ],
        correct: 2,
        explanation:
          "Chain rule: đạo hàm hàm hợp = tích các đạo hàm cục bộ. df/dx = (df/dg) × (dg/dx). Trong neural network, mỗi layer là một hàm g, và backpropagation nhân local gradients ngược lại qua từng layer.",
      },
      {
        type: "fill-blank" as const,
        question:
          "Công thức cập nhật trọng số: w_mới = w_cũ - {blank} × dL/dw",
        blanks: [
          {
            answer: "η",
            accept: [
              "η",
              "eta",
              "learning rate",
              "tốc độ học",
              "lr",
              "alpha",
            ],
          },
        ],
        explanation:
          "η (eta) là learning rate (tốc độ học) — kiểm soát kích thước bước cập nhật. Quá lớn thì phân kỳ, quá nhỏ thì hội tụ chậm.",
      },
    ],
    [],
  );

  /* ── Contour SVG (shared between Stage 2 and 3) ── */
  const ContourBackground = useMemo(() => {
    return (
      <>
        {contours.map(({ level, points }) => {
          if (points.length < 3) return null;
          const d =
            points
              .map((p, i) =>
                i === 0
                  ? `M${toCX(p[0]).toFixed(1)},${toCY(p[1]).toFixed(1)}`
                  : `L${toCX(p[0]).toFixed(1)},${toCY(p[1]).toFixed(1)}`,
              )
              .join(" ") + " Z";
          return (
            <path
              key={`contour-${level}`}
              d={d}
              fill="none"
              stroke={contourColor(level)}
              strokeWidth="1.5"
              opacity="0.7"
            />
          );
        })}
      </>
    );
  }, [contours, toCX, toCY]);

  return (
    <>
      {/* ================================================================
          VISUALIZATION SECTION
          ================================================================ */}
      <VisualizationSection topicSlug="calculus-for-backprop">
        <div className="space-y-4">
          {/* Stage tabs */}
          <div className="flex gap-2">
            {([1, 2, 3] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStage(s)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                  stage === s
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-foreground hover:bg-surface-hover"
                }`}
              >
                {s === 1 && "Stage 1: Tiếp tuyến 1D"}
                {s === 2 && "Stage 2: Gradient 2D"}
                {s === 3 && "Stage 3: Learning rate"}
              </button>
            ))}
          </div>

          {/* ── STAGE 1: 1D tangent line ── */}
          {stage === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-muted leading-relaxed">
                Keo vien bi de thay do doc (dao ham). Do doc tai moi diem cho biet loss tang hay giam khi weight thay doi.
              </p>
              <div className="rounded-lg border border-border bg-surface p-2 flex items-center justify-center">
                <svg
                  ref={svg1Ref}
                  viewBox={`0 0 ${W} ${H}`}
                  className="w-full max-w-[420px] cursor-grab select-none"
                  aria-label="Keo vien bi tren duong cong loss de thay dao ham"
                  onMouseMove={handleBallDrag}
                  onMouseUp={() => setDraggingBall(false)}
                  onMouseLeave={() => setDraggingBall(false)}
                >
                  {/* Axis labels */}
                  <text
                    x={W - 20}
                    y={S1_CY + 16}
                    fontSize="11"
                    fill="currentColor"
                    className="text-muted"
                    textAnchor="end"
                  >
                    w
                  </text>
                  <text
                    x={S1_CX - 45}
                    y={18}
                    fontSize="11"
                    fill="currentColor"
                    className="text-muted"
                  >
                    L(w)
                  </text>

                  {/* Horizontal axis */}
                  <line
                    x1={20}
                    y1={S1_CY}
                    x2={W - 10}
                    y2={S1_CY}
                    stroke="currentColor"
                    className="text-foreground/30"
                    strokeWidth="1"
                  />

                  {/* Tick marks on w axis */}
                  {[0, 1, 2, 3, 4, 5, 6].map((v) => (
                    <g key={`tick-${v}`}>
                      <line
                        x1={toS1X(v)}
                        y1={S1_CY - 3}
                        x2={toS1X(v)}
                        y2={S1_CY + 3}
                        stroke="currentColor"
                        className="text-foreground/30"
                        strokeWidth="1"
                      />
                      <text
                        x={toS1X(v)}
                        y={S1_CY + 16}
                        fontSize="9"
                        fill="currentColor"
                        className="text-muted"
                        textAnchor="middle"
                      >
                        {v}
                      </text>
                    </g>
                  ))}

                  {/* Loss curve */}
                  <polyline
                    points={curvePoints}
                    fill="none"
                    stroke="#6366F1"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Minimum marker */}
                  <circle
                    cx={toS1X(3)}
                    cy={toS1Y(1)}
                    r="4"
                    fill="none"
                    stroke="#22C55E"
                    strokeWidth="1.5"
                    strokeDasharray="2,2"
                  />
                  <text
                    x={toS1X(3)}
                    y={toS1Y(1) + 16}
                    fontSize="9"
                    fill="#22C55E"
                    textAnchor="middle"
                  >
                    min
                  </text>

                  {/* Tangent line */}
                  <line
                    x1={toS1X(tangentX1)}
                    y1={toS1Y(tangentY1)}
                    x2={toS1X(tangentX2)}
                    y2={toS1Y(tangentY2)}
                    stroke="#F59E0B"
                    strokeWidth="1.5"
                    strokeDasharray="4,3"
                    opacity="0.8"
                  />

                  {/* Gradient arrow: points downhill */}
                  {Math.abs(ballGrad) > 0.1 && (
                    <>
                      <defs>
                        <marker
                          id="grad-arrow"
                          viewBox="0 0 10 10"
                          refX="9"
                          refY="5"
                          markerWidth="5"
                          markerHeight="5"
                          orient="auto-start-reverse"
                        >
                          <path
                            d="M 0 0 L 10 5 L 0 10 z"
                            fill="#EF4444"
                          />
                        </marker>
                      </defs>
                      <line
                        x1={toS1X(ballW)}
                        y1={toS1Y(ballL) + 12}
                        x2={toS1X(
                          ballW - Math.sign(ballGrad) * 1.2,
                        )}
                        y2={toS1Y(ballL) + 12}
                        stroke="#EF4444"
                        strokeWidth="2"
                        markerEnd="url(#grad-arrow)"
                      />
                      <text
                        x={toS1X(
                          ballW - Math.sign(ballGrad) * 0.6,
                        )}
                        y={toS1Y(ballL) + 28}
                        fontSize="8"
                        fill="#EF4444"
                        textAnchor="middle"
                      >
                        -gradient
                      </text>
                    </>
                  )}

                  {/* Draggable ball */}
                  <circle
                    cx={toS1X(ballW)}
                    cy={toS1Y(ballL)}
                    r="8"
                    fill="#3B82F6"
                    stroke="white"
                    strokeWidth="2"
                    className="cursor-grab"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setDraggingBall(true);
                    }}
                  />
                </svg>
              </div>

              {/* Info display */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-border bg-surface p-2 text-center">
                  <div className="text-[10px] text-muted">w</div>
                  <div className="font-mono text-sm font-semibold text-foreground">
                    {ballW.toFixed(2)}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-surface p-2 text-center">
                  <div className="text-[10px] text-muted">L(w)</div>
                  <div className="font-mono text-sm font-semibold text-foreground">
                    {ballL.toFixed(2)}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-surface p-2 text-center">
                  <div className="text-[10px] text-muted">dL/dw</div>
                  <div
                    className={`font-mono text-sm font-semibold ${
                      ballGrad > 0.1
                        ? "text-red-500"
                        : ballGrad < -0.1
                          ? "text-green-500"
                          : "text-yellow-500"
                    }`}
                  >
                    {ballGrad > 0 ? "+" : ""}
                    {ballGrad.toFixed(2)}
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted text-center">
                dL/dw = 2(w - 3) = {ballGrad.toFixed(2)} | Do doc{" "}
                {Math.abs(ballGrad) < 0.1
                  ? "gan 0 — dang o day!"
                  : ballGrad > 0
                    ? "duong — loss tang khi w tang, nen buoc trai"
                    : "am — loss giam khi w tang, nen buoc phai"}
              </p>
            </div>
          )}

          {/* ── STAGE 2: 2D contour plot ── */}
          {stage === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-muted leading-relaxed">
                Bam vao noi ban nghi nen buoc tiep. Mui ten do la huong gradient
                dung (buoc tot uu). Diem cang gan huong do, diem cang cao!
              </p>
              <div className="rounded-lg border border-border bg-surface p-2 flex items-center justify-center">
                <svg
                  ref={svg2Ref}
                  viewBox={`0 0 ${W} ${H}`}
                  className="w-full max-w-[420px] cursor-crosshair select-none"
                  aria-label="Bam de chon buoc tiep theo tren contour plot"
                  onClick={handleContourClick}
                >
                  {/* Contour lines */}
                  {ContourBackground}

                  {/* Current position */}
                  <circle
                    cx={toCX(s2Pos[0])}
                    cy={toCY(s2Pos[1])}
                    r="6"
                    fill="#3B82F6"
                    stroke="white"
                    strokeWidth="2"
                  />

                  {/* Correct gradient direction arrow */}
                  {gradLen2 > 0.01 && (
                    <>
                      <defs>
                        <marker
                          id="grad-arrow-2"
                          viewBox="0 0 10 10"
                          refX="9"
                          refY="5"
                          markerWidth="5"
                          markerHeight="5"
                          orient="auto-start-reverse"
                        >
                          <path
                            d="M 0 0 L 10 5 L 0 10 z"
                            fill="#EF4444"
                          />
                        </marker>
                      </defs>
                      <line
                        x1={toCX(s2Pos[0])}
                        y1={toCY(s2Pos[1])}
                        x2={toCX(
                          s2Pos[0] - g2w1 * arrowScale2,
                        )}
                        y2={toCY(
                          s2Pos[1] - g2w2 * arrowScale2,
                        )}
                        stroke="#EF4444"
                        strokeWidth="2.5"
                        markerEnd="url(#grad-arrow-2)"
                      />
                    </>
                  )}

                  {/* User click marker */}
                  {userClick && (
                    <>
                      <circle
                        cx={toCX(userClick[0])}
                        cy={toCY(userClick[1])}
                        r="5"
                        fill="#22C55E"
                        stroke="white"
                        strokeWidth="1.5"
                        opacity="0.8"
                      />
                      {/* Line from current to user click */}
                      <line
                        x1={toCX(s2Pos[0])}
                        y1={toCY(s2Pos[1])}
                        x2={toCX(userClick[0])}
                        y2={toCY(userClick[1])}
                        stroke="#22C55E"
                        strokeWidth="1.5"
                        strokeDasharray="3,3"
                        opacity="0.6"
                      />
                    </>
                  )}

                  {/* Axis labels */}
                  <text
                    x={W - 14}
                    y={C_CY + 4}
                    fontSize="10"
                    fill="currentColor"
                    className="text-muted"
                  >
                    w1
                  </text>
                  <text
                    x={C_CX + 6}
                    y={14}
                    fontSize="10"
                    fill="currentColor"
                    className="text-muted"
                  >
                    w2
                  </text>
                </svg>
              </div>

              {/* Score display */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted">
                  Vi tri hien tai: ({s2Pos[0].toFixed(1)},{" "}
                  {s2Pos[1].toFixed(1)})
                  {s2Score !== null && (
                    <span className="ml-3 font-semibold">
                      Diem:{" "}
                      <span
                        className={
                          s2Score >= 70
                            ? "text-green-500"
                            : s2Score >= 40
                              ? "text-yellow-500"
                              : "text-red-500"
                        }
                      >
                        {s2Score}/100
                      </span>
                    </span>
                  )}
                </div>
                <button
                  onClick={resetStage2}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium border border-border text-foreground hover:bg-surface-hover transition-colors"
                >
                  Vi tri moi
                </button>
              </div>
            </div>
          )}

          {/* ── STAGE 3: Learning rate control ── */}
          {stage === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-muted leading-relaxed">
                Dieu chinh learning rate va quan sat duong hoi tu. Qua lon thi phan ky, qua nho thi cham.
              </p>

              {/* Learning rate slider */}
              <div className="flex items-center gap-3">
                <label className="text-xs text-muted whitespace-nowrap">
                  lr = {lr.toFixed(3)}
                </label>
                <input
                  type="range"
                  min={-3}
                  max={0}
                  step={0.05}
                  value={Math.log10(lr)}
                  onChange={(e) =>
                    setLr(
                      Math.round(10 ** parseFloat(e.target.value) * 1000) / 1000,
                    )
                  }
                  className="flex-1 accent-accent"
                />
                <span className="text-[10px] text-muted">0.001 — 1.0</span>
              </div>

              <div className="rounded-lg border border-border bg-surface p-2 flex items-center justify-center">
                <svg
                  viewBox={`0 0 ${W} ${H}`}
                  className="w-full max-w-[420px] select-none"
                  aria-label="Gradient descent voi learning rate co the dieu chinh"
                >
                  {/* Contour lines */}
                  {ContourBackground}

                  {/* Trail */}
                  {s3Trail.length > 1 &&
                    s3Trail.map((pt, i) => {
                      if (i === 0) return null;
                      const prev = s3Trail[i - 1];
                      return (
                        <line
                          key={`trail-line-${i}`}
                          x1={toCX(prev[0])}
                          y1={toCY(prev[1])}
                          x2={toCX(pt[0])}
                          y2={toCY(pt[1])}
                          stroke="#3B82F6"
                          strokeWidth="1.5"
                          opacity={0.4 + (i / s3Trail.length) * 0.6}
                        />
                      );
                    })}

                  {/* Trail dots */}
                  {s3Trail.map((pt, i) => (
                    <circle
                      key={`trail-dot-${i}`}
                      cx={toCX(pt[0])}
                      cy={toCY(pt[1])}
                      r={i === s3Trail.length - 1 ? 5 : 2.5}
                      fill={i === s3Trail.length - 1 ? "#3B82F6" : "#3B82F6"}
                      opacity={
                        i === s3Trail.length - 1
                          ? 1
                          : 0.3 + (i / s3Trail.length) * 0.5
                      }
                      stroke={
                        i === s3Trail.length - 1 ? "white" : "none"
                      }
                      strokeWidth={
                        i === s3Trail.length - 1 ? 2 : 0
                      }
                    />
                  ))}

                  {/* Approximate minimum marker */}
                  <circle
                    cx={toCX(2.13)}
                    cy={toCY(1.07)}
                    r="4"
                    fill="none"
                    stroke="#22C55E"
                    strokeWidth="1.5"
                    strokeDasharray="2,2"
                  />

                  {/* Axis labels */}
                  <text
                    x={W - 14}
                    y={C_CY + 4}
                    fontSize="10"
                    fill="currentColor"
                    className="text-muted"
                  >
                    w1
                  </text>
                  <text
                    x={C_CX + 6}
                    y={14}
                    fontSize="10"
                    fill="currentColor"
                    className="text-muted"
                  >
                    w2
                  </text>
                </svg>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={takeStep}
                  disabled={autoRunning}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium border border-accent text-accent hover:bg-accent/10 transition-colors disabled:opacity-40"
                >
                  Buoc tiep
                </button>
                <button
                  onClick={() => setAutoRunning((r) => !r)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                    autoRunning
                      ? "border-red-500 text-red-500 hover:bg-red-500/10"
                      : "border-accent text-accent hover:bg-accent/10"
                  }`}
                >
                  {autoRunning ? "Dung lai" : "Tu dong chay"}
                </button>
                <button
                  onClick={resetStage3}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium border border-border text-foreground hover:bg-surface-hover transition-colors"
                >
                  Reset
                </button>
                <span className="ml-auto text-xs text-muted">
                  Buoc: {s3Trail.length - 1} | Loss:{" "}
                  {loss2D(s3Pos[0], s3Pos[1]).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      </VisualizationSection>

      {/* ================================================================
          EXPLANATION SECTION
          ================================================================ */}
      <ExplanationSection topicSlug="calculus-for-backprop">
        <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Du doan">
          <PredictionGate
            question="Neural network co 1 trieu weights. Training = tim gia tri toi uu cho 1 trieu bien so. Lam sao biet dieu chinh moi weight theo huong nao?"
            options={[
              "Thu random tung weight",
              "Dao ham (gradient): tinh huong doc nhat cho moi weight, dieu chinh nguoc huong doc de loss giam",
              "Dung cong thuc co dinh",
            ]}
            correct={1}
            explanation="Gradient la ban do dia hinh cua loss landscape. Tai moi diem, gradient chi huong doc nhat (loss tang). Di NGUOC gradient = loss giam nhanh nhat. Backprop tinh gradient cho 1 trieu weights HIEU QUA bang chain rule."
          >
            <p className="text-sm text-muted mt-2">
              Hay tiep tuc de kham pha toan hoc dang sau backpropagation.
            </p>
          </PredictionGate>
        </LessonSection>

        <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khoang khac Aha">
          <AhaMoment>
            <p>
              Gradient descent giong{" "}
              <strong>tim day thung lung khi bi bit mat</strong>: khong
              nhin thay dinh nhung <strong>cam nhan doc</strong> (gradient)
              roi buoc nguoc lai. Learning rate la{" "}
              <strong>buoc chan</strong>: buoc qua lon nhay qua day, buoc
              qua nho di mai khong toi. Chain rule la{" "}
              <strong>hieu ung domino</strong>: do quan dau, tat ca do theo
              chuoi!
            </p>
          </AhaMoment>
        </LessonSection>

        <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Dao ham">
          <p className="text-sm leading-relaxed">
            <strong>Dao ham</strong> (derivative) do toc do thay doi cua ham so. Trong ML:{" "}
            dL/dw cho biet loss thay doi bao nhieu khi weight thay doi mot chut.
          </p>

          <LaTeX block>
            {"f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}"}
          </LaTeX>

          <p className="text-sm leading-relaxed mt-2">
            Trong hinh minh hoa Stage 1, do doc cua duong tiep tuyen chinh la dao ham.
            Tai w = 3 (day thung lung), dao ham = 0 vi khong con doc de di xuong nua.
          </p>

          <Callout variant="tip" title="Gradient = vector dao ham">
            Khi ham co nhieu bien (nhu neural network), dao ham rieng theo tung bien
            ghep lai thanh <strong>gradient</strong> — mot vector chi huong loss tang nhanh nhat.
            Di nguoc gradient = loss giam nhanh nhat.
          </Callout>

          <LaTeX block>
            {
              "\\nabla L = \\left[\\frac{\\partial L}{\\partial w_1}, \\frac{\\partial L}{\\partial w_2}, \\ldots \\right]"
            }
          </LaTeX>
        </LessonSection>

        <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Gradient descent">
          <p className="text-sm leading-relaxed">
            <strong>Gradient descent</strong> cap nhat weight bang cach buoc nguoc huong gradient:
          </p>

          <LaTeX block>
            {
              "w_{\\text{moi}} = w_{\\text{cu}} - \\eta \\cdot \\frac{\\partial L}{\\partial w}"
            }
          </LaTeX>

          <p className="text-sm leading-relaxed mt-2">
            <strong>Toc do hoc</strong> (learning rate, ky hieu eta) kiem soat kich thuoc buoc.
            Trong Stage 3 cua hinh minh hoa, ban co the thay:
          </p>

          <ul className="list-disc list-inside space-y-1 pl-2 text-sm leading-relaxed">
            <li>eta qua lon (khoang 0.5 - 1.0): buoc nhay qua xa, loss phat tan</li>
            <li>eta qua nho (khoang 0.001): buoc rat nho, can hang tram buoc</li>
            <li>eta vua phai (khoang 0.05 - 0.15): hoi tu muot ma den minimum</li>
          </ul>

          <InlineChallenge
            question="Voi w = 1, dL/dw = -4, lr = 0.1 thi w_moi = ?"
            options={["0.6", "1.4", "1.04", "0.96"]}
            correct={1}
            explanation="w_moi = w - lr * dL/dw = 1 - 0.1 * (-4) = 1 + 0.4 = 1.4. Gradient am nen w tang (di ve phia loss giam)."
          />
        </LessonSection>

        <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Chain rule">
          <p className="text-sm leading-relaxed">
            <strong>Quy tac chuoi</strong> (chain rule) la ly do backpropagation hoat dong.
            Neural network la chuoi ham: y = f3(f2(f1(x))). Chain rule cho phep tinh dao ham
            nguoc lai qua tung layer:
          </p>

          <LaTeX block>
            {
              "\\frac{\\partial L}{\\partial w} = \\frac{\\partial L}{\\partial y} \\cdot \\frac{\\partial y}{\\partial h} \\cdot \\frac{\\partial h}{\\partial w}"
            }
          </LaTeX>

          <p className="text-sm leading-relaxed mt-2">
            Nhu <strong>hieu ung domino</strong>: do quan dau, tat ca do theo chuoi. Moi
            layer chi can tinh local gradient, roi nhan nguoc lai. 100 layers nhan local
            gradient thay vi dao ham ham 100 lop truc tiep.
          </p>

          <Callout variant="info" title="Vi du cu the">
            Cho f(x) = (3x + 2)^2. Dat u = 3x + 2, f = u^2.
            Chain rule: df/dx = df/du * du/dx = 2u * 3 = 6(3x+2).
            Tai x = 1: df/dx = 6 * 5 = 30.
            Trong neural network: u = linear layer, f = activation.
          </Callout>
        </LessonSection>

        <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Vanishing gradient">
          <p className="text-sm leading-relaxed">
            <strong>Vanishing gradient</strong> xay ra khi chain rule nhan nhieu gradient nho.
            Nhu thi tham qua 100 nguoi — tin nhan mat dan.
          </p>

          <LaTeX block>
            {
              "\\text{Sigmoid: } \\sigma'(x) = \\sigma(x)(1 - \\sigma(x)) \\leq 0.25"
            }
          </LaTeX>

          <p className="text-sm leading-relaxed mt-2">
            Sigmoid co gradient toi da 0.25. Voi 50 layers: 0.25^50 &#8776; 10^(-30) — gradient
            ve co 0, cac layer dau khong hoc duoc gi. Giai phap:
          </p>

          <ul className="list-disc list-inside space-y-1 pl-2 text-sm leading-relaxed">
            <li><strong>ReLU</strong>: gradient = 1 (khi x &gt; 0), khong bi giam qua cac layer</li>
            <li><strong>Residual connections</strong> (skip connections): gradient co duong tat</li>
            <li><strong>Batch normalization</strong>: giu gradient o muc on dinh</li>
          </ul>

          <LaTeX block>
            {
              "\\text{ReLU: } f'(x) = \\begin{cases} 1 & x > 0 \\\\ 0 & x \\leq 0 \\end{cases}"
            }
          </LaTeX>

          <Callout variant="tip" title="Autograd">
            Trong thuc te, ban KHONG can tinh dao ham thu cong. PyTorch autograd tu dong tinh gradient
            cho bat ky computation graph nao. loss.backward() tinh gradient cho TAT CA parameters.
          </Callout>

          <CodeBlock language="python" title="Backpropagation voi PyTorch autograd">{`import torch

# PyTorch tu dong tinh gradient
x = torch.tensor(2.0, requires_grad=True)
y = (3*x + 2)**2  # f(x) = (3x+2)^2
y.backward()       # Chain rule tu dong
print(f"df/dx tai x=2: {x.grad}")  # 48.0

# Training loop (autograd lam tat ca)
model = torch.nn.Linear(784, 10)
optimizer = torch.optim.SGD(model.parameters(), lr=0.01)

output = model(input_data)
loss = torch.nn.functional.cross_entropy(output, labels)
loss.backward()        # Backprop: gradient cho MOI weight
optimizer.step()       # Gradient descent: cap nhat weights
optimizer.zero_grad()  # Reset cho batch tiep`}</CodeBlock>
        </LessonSection>

        <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tom tat">
          <MiniSummary
            points={[
              "Dao ham = toc do thay doi. Trong ML: dL/dw cho biet loss thay doi bao nhieu khi weight thay doi.",
              "Gradient = vector chi huong loss tang nhanh nhat. Di nguoc gradient de loss giam.",
              "Gradient descent: w_moi = w_cu - lr * gradient. Learning rate kiem soat kich thuoc buoc.",
              "Chain rule: nhan local gradients nguoc lai qua tung layer. Day la co che cua backpropagation.",
              "Vanishing gradient: sigmoid (max 0.25) nhan nhieu layers thi gradient ve 0. ReLU (gradient = 1) giai quyet.",
            ]}
          />
        </LessonSection>

        <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiem tra">
          <QuizSection questions={quizQuestions} />
        </LessonSection>
      </ExplanationSection>
    </>
  );
}
