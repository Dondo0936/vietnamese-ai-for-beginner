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
  slug: "vectors-and-matrices",
  title: "Vectors & Matrices",
  titleVi: "Vector & Ma trận",
  description:
    "Tích vô hướng, độ tương đồng cosine và phép nhân ma trận — ngôn ngữ cốt lõi của AI",
  category: "math-foundations",
  tags: ["vectors", "matrices", "dot-product", "cosine-similarity"],
  difficulty: "beginner",
  relatedSlugs: [
    "eigendecomposition-pca",
    "word-embeddings",
    "neural-network-overview",
  ],
  vizType: "interactive",
};

/* ── Constants ── */
const TOTAL_STEPS = 8;

/* SVG dimensions for panels */
const VW = 360;
const VH = 320;
const V_CX = VW / 2;
const V_CY = VH / 2;
const V_SCALE = 50; // pixels per unit

const MW = 360;
const MH = 320;
const M_CX = MW / 2;
const M_CY = MH / 2;
const M_SCALE = 40;

/* Grid dots for matrix transformation: 5x5 from -2 to 2 */
const GRID_RANGE = [-2, -1, 0, 1, 2];
const GRID_POINTS: [number, number][] = [];
for (const gx of GRID_RANGE) {
  for (const gy of GRID_RANGE) {
    GRID_POINTS.push([gx, gy]);
  }
}

/* ── Helpers ── */
function clampVec(x: number, y: number, limit: number): [number, number] {
  const len = Math.sqrt(x * x + y * y);
  if (len > limit) {
    return [(x / len) * limit, (y / len) * limit];
  }
  return [x, y];
}

function dotProduct(a: [number, number], b: [number, number]): number {
  return a[0] * b[0] + a[1] * b[1];
}

function vecLength(v: [number, number]): number {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
}

function cosineSimilarity(a: [number, number], b: [number, number]): number {
  const lenA = vecLength(a);
  const lenB = vecLength(b);
  if (lenA < 0.01 || lenB < 0.01) return 0;
  return dotProduct(a, b) / (lenA * lenB);
}

/** Map cosine similarity to a color: red (-1) -> yellow (0) -> green (1) */
function cosineColor(cos: number): string {
  if (cos >= 0) {
    // 0 -> yellow, 1 -> green
    const r = Math.round(255 * (1 - cos));
    const g = Math.round(180 + 75 * cos);
    return `rgb(${r}, ${g}, 0)`;
  }
  // -1 -> red, 0 -> yellow
  const r = 255;
  const g = Math.round(255 * (1 + cos));
  return `rgb(${r}, ${g}, 0)`;
}

export default function VectorsAndMatricesTopic() {
  /* ── Panel 1: Vector playground state ── */
  const [vecA, setVecA] = useState<[number, number]>([2, 1]);
  const [vecB, setVecB] = useState<[number, number]>([1, 2]);
  const [dragging, setDragging] = useState<"a" | "b" | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  /* ── Panel 2: Matrix transformation state ── */
  const [matrix, setMatrix] = useState<[number, number, number, number]>([
    1, 0, 0, 1,
  ]);

  /* ── Derived: dot product & cosine ── */
  const dot = useMemo(() => dotProduct(vecA, vecB), [vecA, vecB]);
  const cosine = useMemo(() => cosineSimilarity(vecA, vecB), [vecA, vecB]);
  const colorHex = useMemo(() => cosineColor(cosine), [cosine]);

  /* ── Derived: transformed grid points ── */
  const transformedPoints = useMemo(
    () =>
      GRID_POINTS.map(([x, y]) => {
        const tx = matrix[0] * x + matrix[1] * y;
        const ty = matrix[2] * x + matrix[3] * y;
        return [tx, ty] as [number, number];
      }),
    [matrix],
  );

  /* ── SVG drag handlers for vector playground ── */
  const getSvgCoords = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return [0, 0] as [number, number];
      const rect = svg.getBoundingClientRect();
      const scaleX = VW / rect.width;
      const scaleY = VH / rect.height;
      const svgX = (e.clientX - rect.left) * scaleX;
      const svgY = (e.clientY - rect.top) * scaleY;
      const mathX = (svgX - V_CX) / V_SCALE;
      const mathY = (V_CY - svgY) / V_SCALE;
      return clampVec(mathX, mathY, 3);
    },
    [],
  );

  const handleMouseDown = useCallback(
    (which: "a" | "b") => (e: React.MouseEvent) => {
      e.preventDefault();
      setDragging(which);
    },
    [],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!dragging) return;
      const [mx, my] = getSvgCoords(e);
      if (dragging === "a") setVecA([mx, my]);
      else setVecB([mx, my]);
    },
    [dragging, getSvgCoords],
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  /* ── Matrix input handler ── */
  const handleMatrixChange = useCallback(
    (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      if (Number.isNaN(val)) return;
      setMatrix((prev) => {
        const next = [...prev] as [number, number, number, number];
        next[index] = Math.max(-3, Math.min(3, val));
        return next;
      });
    },
    [],
  );

  /* ── Matrix presets ── */
  const applyPreset = useCallback(
    (preset: "identity" | "rotate" | "scale" | "shear") => {
      switch (preset) {
        case "identity":
          setMatrix([1, 0, 0, 1]);
          break;
        case "rotate":
          setMatrix([
            parseFloat(Math.cos(Math.PI / 4).toFixed(2)),
            parseFloat((-Math.sin(Math.PI / 4)).toFixed(2)),
            parseFloat(Math.sin(Math.PI / 4).toFixed(2)),
            parseFloat(Math.cos(Math.PI / 4).toFixed(2)),
          ]);
          break;
        case "scale":
          setMatrix([2, 0, 0, 0.5]);
          break;
        case "shear":
          setMatrix([1, 1, 0, 1]);
          break;
      }
    },
    [],
  );

  /* ── Quiz ── */
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "Tích vô hướng (dot product) của [1, 2] và [3, 4] bằng bao nhiêu?",
        options: ["5", "7", "11", "14"],
        correct: 2,
        explanation:
          "Tích vô hướng = 1 × 3 + 2 × 4 = 3 + 8 = 11. Nhân từng cặp phần tử tương ứng rồi cộng lại.",
      },
      {
        question:
          "Nếu hai vector vuông góc với nhau, độ tương đồng cosine bằng bao nhiêu?",
        options: ["-1", "0", "0,5", "1"],
        correct: 1,
        explanation:
          "Hai vector vuông góc có cos(90°) = 0. Nghĩa là chúng hoàn toàn không tương đồng về hướng — không giống cũng không đối lập.",
      },
      {
        question:
          "Ma trận kích thước (3, 2) nhân với ma trận kích thước (2, 4). Kết quả có kích thước gì?",
        options: ["(3, 4)", "(2, 2)", "(3, 2)", "(4, 3)"],
        correct: 0,
        explanation:
          "Quy tắc: (m, n) × (n, k) = (m, k). Ở đây (3, 2) × (2, 4) = (3, 4). Số cột ma trận trái phải bằng số hàng ma trận phải.",
      },
      {
        type: "fill-blank",
        question:
          "Trong mạng nơ-ron, mỗi tầng thực hiện phép tính: output = activation({blank} × input + bias)",
        blanks: [{ answer: "W", accept: ["W", "w", "weight", "ma trận trọng số"] }],
        explanation:
          "W là ma trận trọng số (weight matrix). Mỗi tầng neural network thực chất là một phép nhân ma trận W × input, cộng bias, rồi áp dụng hàm kích hoạt.",
      },
    ],
    [],
  );

  /* ── Helper: SVG coordinate conversions for vector panel ── */
  const toVSvgX = useCallback((x: number) => V_CX + x * V_SCALE, []);
  const toVSvgY = useCallback((y: number) => V_CY - y * V_SCALE, []);

  /* ── Helper: SVG coordinate conversions for matrix panel ── */
  const toMSvgX = useCallback((x: number) => M_CX + x * M_SCALE, []);
  const toMSvgY = useCallback((y: number) => M_CY - y * M_SCALE, []);

  return (
    <>
      {/* ================================================================
          VISUALIZATION SECTION
          ================================================================ */}
      <VisualizationSection topicSlug="vectors-and-matrices">
        <div className="space-y-8">
          {/* ── PANEL 1: Vector playground ── */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground">
              Sân chơi vector: Tích vô hướng & Cosine
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              Kéo đầu mũi tên để thay đổi hướng vector. Quan sát tích vô hướng
              và độ tương đồng cosine thay đổi theo thời gian thực.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SVG canvas */}
              <div className="rounded-lg border border-border bg-surface p-2 flex items-center justify-center">
                <svg
                  ref={svgRef}
                  viewBox={`0 0 ${VW} ${VH}`}
                  className="w-full max-w-[360px] cursor-crosshair select-none"
                  aria-label="Kéo vector để xem tích vô hướng và cosine similarity"
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {/* Light grid */}
                  {[-3, -2, -1, 0, 1, 2, 3].map((v) => (
                    <g key={`grid-${v}`}>
                      <line
                        x1={toVSvgX(v)}
                        y1={toVSvgY(-3)}
                        x2={toVSvgX(v)}
                        y2={toVSvgY(3)}
                        stroke="currentColor"
                        className="text-border"
                        strokeWidth="0.5"
                        strokeDasharray={v === 0 ? "none" : "3,3"}
                      />
                      <line
                        x1={toVSvgX(-3)}
                        y1={toVSvgY(v)}
                        x2={toVSvgX(3)}
                        y2={toVSvgY(v)}
                        stroke="currentColor"
                        className="text-border"
                        strokeWidth="0.5"
                        strokeDasharray={v === 0 ? "none" : "3,3"}
                      />
                    </g>
                  ))}

                  {/* Axes */}
                  <line
                    x1={toVSvgX(-3)}
                    y1={toVSvgY(0)}
                    x2={toVSvgX(3)}
                    y2={toVSvgY(0)}
                    stroke="currentColor"
                    className="text-foreground"
                    strokeWidth="1.5"
                  />
                  <line
                    x1={toVSvgX(0)}
                    y1={toVSvgY(-3)}
                    x2={toVSvgX(0)}
                    y2={toVSvgY(3)}
                    stroke="currentColor"
                    className="text-foreground"
                    strokeWidth="1.5"
                  />

                  {/* Arrowhead defs */}
                  <defs>
                    <marker
                      id="arrow-a"
                      viewBox="0 0 10 10"
                      refX="9"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#3B82F6" />
                    </marker>
                    <marker
                      id="arrow-b"
                      viewBox="0 0 10 10"
                      refX="9"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#EF4444" />
                    </marker>
                  </defs>

                  {/* Vector A (blue) */}
                  <line
                    x1={toVSvgX(0)}
                    y1={toVSvgY(0)}
                    x2={toVSvgX(vecA[0])}
                    y2={toVSvgY(vecA[1])}
                    stroke="#3B82F6"
                    strokeWidth="2.5"
                    markerEnd="url(#arrow-a)"
                  />
                  {/* Draggable endpoint A */}
                  <circle
                    cx={toVSvgX(vecA[0])}
                    cy={toVSvgY(vecA[1])}
                    r="8"
                    fill="#3B82F6"
                    fillOpacity="0.3"
                    stroke="#3B82F6"
                    strokeWidth="2"
                    className="cursor-grab active:cursor-grabbing"
                    onMouseDown={handleMouseDown("a")}
                  />
                  <text
                    x={toVSvgX(vecA[0]) + 10}
                    y={toVSvgY(vecA[1]) - 8}
                    fontSize="12"
                    fontWeight="bold"
                    fill="#3B82F6"
                  >
                    a
                  </text>

                  {/* Vector B (red) */}
                  <line
                    x1={toVSvgX(0)}
                    y1={toVSvgY(0)}
                    x2={toVSvgX(vecB[0])}
                    y2={toVSvgY(vecB[1])}
                    stroke="#EF4444"
                    strokeWidth="2.5"
                    markerEnd="url(#arrow-b)"
                  />
                  {/* Draggable endpoint B */}
                  <circle
                    cx={toVSvgX(vecB[0])}
                    cy={toVSvgY(vecB[1])}
                    r="8"
                    fill="#EF4444"
                    fillOpacity="0.3"
                    stroke="#EF4444"
                    strokeWidth="2"
                    className="cursor-grab active:cursor-grabbing"
                    onMouseDown={handleMouseDown("b")}
                  />
                  <text
                    x={toVSvgX(vecB[0]) + 10}
                    y={toVSvgY(vecB[1]) - 8}
                    fontSize="12"
                    fontWeight="bold"
                    fill="#EF4444"
                  >
                    b
                  </text>

                  {/* Cosine similarity color indicator bar */}
                  <rect
                    x={10}
                    y={VH - 20}
                    width={VW - 20}
                    height={8}
                    rx={4}
                    fill={colorHex}
                    opacity={0.6}
                  />
                </svg>
              </div>

              {/* Live readout */}
              <div className="space-y-3">
                <div className="rounded-lg border border-border bg-surface p-3 space-y-2">
                  <div className="text-sm text-muted">
                    <span className="font-semibold text-blue-500">a</span> = [
                    <span className="font-mono">{vecA[0].toFixed(1)}</span>,{" "}
                    <span className="font-mono">{vecA[1].toFixed(1)}</span>]
                  </div>
                  <div className="text-sm text-muted">
                    <span className="font-semibold text-red-500">b</span> = [
                    <span className="font-mono">{vecB[0].toFixed(1)}</span>,{" "}
                    <span className="font-mono">{vecB[1].toFixed(1)}</span>]
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-surface p-3 space-y-3">
                  <div>
                    <div className="text-xs text-muted mb-1">
                      Tích vô hướng (dot product)
                    </div>
                    <div className="font-mono text-lg font-bold text-foreground">
                      a·b = {vecA[0].toFixed(1)} × {vecB[0].toFixed(1)} +{" "}
                      {vecA[1].toFixed(1)} × {vecB[1].toFixed(1)} ={" "}
                      <span className="text-accent">{dot.toFixed(2)}</span>
                    </div>
                  </div>
                  <hr className="border-border" />
                  <div>
                    <div className="text-xs text-muted mb-1">
                      Độ tương đồng cosine
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className="font-mono text-lg font-bold"
                        style={{ color: colorHex }}
                      >
                        {cosine.toFixed(3)}
                      </span>
                      <span className="text-xs text-muted">
                        {cosine > 0.8
                          ? "Song song (cùng hướng)"
                          : cosine > 0.2
                            ? "Hơi giống"
                            : cosine > -0.2
                              ? "Vuông góc (không liên quan)"
                              : cosine > -0.8
                                ? "Hơi ngược"
                                : "Ngược hướng"}
                      </span>
                    </div>
                    {/* Color legend */}
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted">
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ background: cosineColor(1) }}
                      />
                      <span>+1</span>
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ background: cosineColor(0) }}
                      />
                      <span>0</span>
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ background: cosineColor(-1) }}
                      />
                      <span>-1</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <hr className="border-border" />

          {/* ── PANEL 2: Matrix as transformation ── */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground">
              Ma trận = phép biến đổi
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              Chỉnh 4 ô số trong ma trận 2×2 và xem lưới điểm biến đổi theo
              thời gian thực. Đây chính là insight cốt lõi của 3Blue1Brown:
              mỗi ma trận là một phép biến đổi không gian.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Matrix inputs + presets */}
              <div className="space-y-4">
                {/* Matrix input grid */}
                <div className="rounded-lg border border-border bg-surface p-4">
                  <div className="text-xs text-muted mb-2 text-center">
                    Ma trận biến đổi M
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    {/* Left bracket */}
                    <div className="text-3xl font-light text-muted select-none">
                      [
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[0, 1, 2, 3].map((i) => (
                        <input
                          key={i}
                          type="number"
                          min={-3}
                          max={3}
                          step={0.1}
                          value={matrix[i]}
                          onChange={handleMatrixChange(i)}
                          className="w-16 rounded-md border border-border bg-card px-2 py-1.5 text-center font-mono text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                      ))}
                    </div>
                    {/* Right bracket */}
                    <div className="text-3xl font-light text-muted select-none">
                      ]
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <LaTeX block>
                      {String.raw`\begin{bmatrix} x' \\ y' \end{bmatrix} = \begin{bmatrix} ${matrix[0]} & ${matrix[1]} \\ ${matrix[2]} & ${matrix[3]} \end{bmatrix} \begin{bmatrix} x \\ y \end{bmatrix}`}
                    </LaTeX>
                  </div>
                </div>

                {/* Preset buttons */}
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["identity", "Đơn vị (I)"],
                      ["rotate", "Xoay 45°"],
                      ["scale", "Co giãn"],
                      ["shear", "Nghiêng"],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => applyPreset(key)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium border border-border text-foreground hover:bg-surface-hover transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* SVG transformation canvas */}
              <div className="rounded-lg border border-border bg-surface p-2 flex items-center justify-center">
                <svg
                  viewBox={`0 0 ${MW} ${MH}`}
                  className="w-full max-w-[360px]"
                  aria-label="Lưới điểm biến đổi bởi ma trận 2x2"
                >
                  {/* Axes */}
                  <line
                    x1={toMSvgX(-4)}
                    y1={toMSvgY(0)}
                    x2={toMSvgX(4)}
                    y2={toMSvgY(0)}
                    stroke="currentColor"
                    className="text-border"
                    strokeWidth="1"
                  />
                  <line
                    x1={toMSvgX(0)}
                    y1={toMSvgY(-4)}
                    x2={toMSvgX(0)}
                    y2={toMSvgY(4)}
                    stroke="currentColor"
                    className="text-border"
                    strokeWidth="1"
                  />

                  {/* Original grid dots (faded) */}
                  {GRID_POINTS.map(([x, y], i) => (
                    <circle
                      key={`orig-${i}`}
                      cx={toMSvgX(x)}
                      cy={toMSvgY(y)}
                      r="3"
                      fill="currentColor"
                      className="text-foreground/15"
                    />
                  ))}

                  {/* Connecting lines from original to transformed */}
                  {GRID_POINTS.map(([x, y], i) => {
                    const [tx, ty] = transformedPoints[i];
                    return (
                      <line
                        key={`line-${i}`}
                        x1={toMSvgX(x)}
                        y1={toMSvgY(y)}
                        x2={toMSvgX(tx)}
                        y2={toMSvgY(ty)}
                        stroke="currentColor"
                        className="text-accent/20"
                        strokeWidth="0.5"
                      />
                    );
                  })}

                  {/* Transformed grid dots */}
                  {transformedPoints.map(([tx, ty], i) => {
                    const isOrigin =
                      GRID_POINTS[i][0] === 0 && GRID_POINTS[i][1] === 0;
                    return (
                      <circle
                        key={`trans-${i}`}
                        cx={toMSvgX(tx)}
                        cy={toMSvgY(ty)}
                        r={isOrigin ? 5 : 4}
                        fill="currentColor"
                        className={
                          isOrigin ? "text-accent" : "text-accent/70"
                        }
                        stroke="white"
                        strokeWidth="1"
                      />
                    );
                  })}

                  {/* Basis vector e1 after transform */}
                  <line
                    x1={toMSvgX(0)}
                    y1={toMSvgY(0)}
                    x2={toMSvgX(matrix[0])}
                    y2={toMSvgY(matrix[2])}
                    stroke="#3B82F6"
                    strokeWidth="2"
                    strokeDasharray="4,2"
                  />
                  <text
                    x={toMSvgX(matrix[0]) + 4}
                    y={toMSvgY(matrix[2]) - 4}
                    fontSize="10"
                    fill="#3B82F6"
                    fontWeight="bold"
                  >
                    e1
                  </text>

                  {/* Basis vector e2 after transform */}
                  <line
                    x1={toMSvgX(0)}
                    y1={toMSvgY(0)}
                    x2={toMSvgX(matrix[1])}
                    y2={toMSvgY(matrix[3])}
                    stroke="#EF4444"
                    strokeWidth="2"
                    strokeDasharray="4,2"
                  />
                  <text
                    x={toMSvgX(matrix[1]) + 4}
                    y={toMSvgY(matrix[3]) - 4}
                    fontSize="10"
                    fill="#EF4444"
                    fontWeight="bold"
                  >
                    e2
                  </text>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </VisualizationSection>

      {/* ================================================================
          EXPLANATION SECTION
          ================================================================ */}
      <ExplanationSection topicSlug="vectors-and-matrices">
        <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
          <PredictionGate
            question="Khi Spotify gợi ý nhạc cho bạn, ứng dụng dùng công cụ toán học nào để đo mức độ giống nhau giữa hai bài hát?"
            options={[
              "Phép cộng: cộng điểm đánh giá của hai bài",
              "Phép nhân ma trận: biến đổi bài hát sang không gian mới",
              "Tích vô hướng / cosine: đo góc giữa hai vector đặc trưng",
            ]}
            correct={2}
            explanation="Đúng! Mỗi bài hát được biểu diễn bằng một vector (năng lượng, nhịp, acoustic...). Spotify dùng cosine similarity để đo mức tương đồng giữa vector bài hát của bạn và các bài khác. Vector càng gần nhau, bài hát càng giống nhau."
          >
            <p className="mt-3 text-sm text-muted leading-relaxed">
              Tiếp tục để khám phá vector, tích vô hướng, cosine và ma trận
              — ngôn ngữ cốt lõi mà mọi mô hình AI đều sử dụng.
            </p>
          </PredictionGate>
        </LessonSection>

        <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Vector">
          <p className="text-sm leading-relaxed">
            <strong>Vector</strong> (véc-tơ) là một danh sách có thứ tự các con
            số, biểu diễn một điểm hoặc hướng trong không gian. Ví dụ,
            vector <LaTeX>{"[3, 4]"}</LaTeX> chỉ đến điểm có tọa độ (3, 4)
            trên mặt phẳng.
          </p>

          <Callout variant="tip" title="Ví dụ: Hồ sơ bài hát trên Spotify">
            Mỗi bài hát trên Spotify có một &quot;hồ sơ&quot; dạng vector:
            [năng lượng = 0,8; nhịp = 120; acoustic = 0,2]. Hai bài hát
            có vector gần nhau trong không gian nhiều chiều nghĩa là chúng
            nghe tương tự. Trong ML, vector như vậy gọi là{" "}
            <strong>embedding</strong> — cách biến mọi thứ (từ, ảnh, bài hát)
            thành danh sách số để máy tính hiểu được.
          </Callout>

          <p className="text-sm leading-relaxed mt-3">
            Trong mặt phẳng minh họa phía trên, mỗi mũi tên là một vector 2D.
            Trong thực tế ML, vector có thể có hàng trăm đến hàng nghìn chiều
            — GPT dùng vector 12.288 chiều cho mỗi token!
          </p>
        </LessonSection>

        <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Tích vô hướng">
          <p className="text-sm leading-relaxed">
            <strong>Tích vô hướng</strong> (dot product) đo mức độ hai vector
            &quot;đồng ý&quot; với nhau. Công thức:
          </p>

          <LaTeX block>
            {String.raw`\vec{a} \cdot \vec{b} = a_1 b_1 + a_2 b_2 + \cdots + a_n b_n`}
          </LaTeX>

          <p className="text-sm leading-relaxed">
            Nhân từng cặp phần tử tương ứng, rồi cộng tất cả lại. Nếu kết quả
            lớn và dương, hai vector cùng hướng. Nếu bằng 0, chúng vuông góc.
            Nếu âm, chúng ngược hướng.
          </p>

          <Callout variant="info" title="Ứng dụng trong Attention">
            Trong cơ chế Attention của Transformer, mỗi từ &quot;hỏi&quot;
            các từ khác bằng cách tính tích vô hướng giữa vector query và
            key. Tích vô hướng lớn = từ đó liên quan nhiều = được chú ý
            nhiều hơn.
          </Callout>

          <InlineChallenge
            question="Tính tích vô hướng: [2, 0, 1] · [1, 3, 4] = ?"
            options={["5", "6", "7", "10"]}
            correct={1}
            explanation="2 × 1 + 0 × 3 + 1 × 4 = 2 + 0 + 4 = 6. Nhân từng cặp rồi cộng lại."
          />
        </LessonSection>

        <LessonSection
          step={4}
          totalSteps={TOTAL_STEPS}
          label="Cosine similarity"
        >
          <p className="text-sm leading-relaxed">
            <strong>Độ tương đồng cosine</strong> (cosine similarity) là tích
            vô hướng đã được chuẩn hóa, loại bỏ ảnh hưởng của độ dài vector.
            Kết quả luôn nằm trong khoảng [-1, 1]:
          </p>

          <LaTeX block>
            {String.raw`\cos(\theta) = \frac{\vec{a} \cdot \vec{b}}{|\vec{a}| \cdot |\vec{b}|}`}
          </LaTeX>

          <ul className="list-disc list-inside space-y-1 pl-2 text-sm leading-relaxed">
            <li>
              <strong>+1:</strong> cùng hướng hoàn toàn (hai bài hát giống
              nhau)
            </li>
            <li>
              <strong>0:</strong> vuông góc, không liên quan
            </li>
            <li>
              <strong>-1:</strong> ngược hướng hoàn toàn
            </li>
          </ul>

          <Callout variant="tip" title="Ví dụ: So sánh gu nhạc 2 người">
            Người A thích [rock = 0,9; pop = 0,3; jazz = 0,1]. Người B thích
            [rock = 0,8; pop = 0,4; jazz = 0,2]. Cosine similarity gần 1
            = hai người có gu nhạc rất giống nhau, dù điểm số cụ thể khác
            nhau. Đây chính là lý do dùng cosine thay vì so sánh trực tiếp.
          </Callout>

          <AhaMoment>
            Cosine chỉ quan tâm đến hướng, không quan tâm đến độ dài. Một
            người nghe 100 bài rock và một người nghe 10 bài rock vẫn có
            cosine gần 1 nếu tỷ lệ thể loại giống nhau. Đây là sức mạnh
            của cosine trong hệ thống gợi ý.
          </AhaMoment>
        </LessonSection>

        <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Ma trận">
          <p className="text-sm leading-relaxed">
            <strong>Ma trận</strong> (matrix) là một bảng số hình chữ nhật.
            Mỗi ma trận có kích thước (số hàng, số cột). Ví dụ, ma trận 2×3
            có 2 hàng và 3 cột:
          </p>

          <LaTeX block>
            {String.raw`A = \begin{bmatrix} 1 & 2 & 3 \\ 4 & 5 & 6 \end{bmatrix}`}
          </LaTeX>

          <p className="text-sm leading-relaxed">
            Trong ML, ma trận xuất hiện ở khắp nơi: bảng dữ liệu (mỗi hàng
            là một mẫu, mỗi cột là một đặc trưng), ma trận trọng số trong
            mạng nơ-ron, ma trận attention trong Transformer...
          </p>

          <Callout variant="info" title="Insight từ minh họa">
            Quay lại phần &quot;Ma trận = phép biến đổi&quot; phía trên. Bấm
            &quot;Xoay 45°&quot; để xem lưới điểm xoay, hoặc &quot;Co
            giãn&quot; để xem lưới bị kéo dãn. Mỗi ma trận 2×2 xác định
            cách toàn bộ không gian bị biến đổi — đây là ý tưởng cốt lõi
            của đại số tuyến tính.
          </Callout>
        </LessonSection>

        <LessonSection
          step={6}
          totalSteps={TOTAL_STEPS}
          label="Nhân ma trận"
        >
          <p className="text-sm leading-relaxed">
            <strong>Phép nhân ma trận</strong> (matrix multiplication) kết hợp
            hai phép biến đổi thành một. Quy tắc kích thước:
          </p>

          <LaTeX block>
            {String.raw`\underbrace{(m \times n)}_{\text{ma trận trái}} \times \underbrace{(n \times k)}_{\text{ma trận phải}} = \underbrace{(m \times k)}_{\text{kết quả}}`}
          </LaTeX>

          <p className="text-sm leading-relaxed">
            Số cột ma trận trái phải bằng số hàng ma trận phải. Trong mạng
            nơ-ron, mỗi tầng thực hiện:
          </p>

          <LaTeX block>
            {String.raw`\text{output} = \sigma(W \times \text{input} + b)`}
          </LaTeX>

          <p className="text-sm leading-relaxed">
            trong đó <LaTeX>{"W"}</LaTeX> là ma trận trọng số,{" "}
            <LaTeX>{"b"}</LaTeX> là vector bias, và{" "}
            <LaTeX>{String.raw`\sigma`}</LaTeX> là hàm kích hoạt.
          </p>

          <Callout variant="tip" title="Ví dụ: Biến đổi ảnh">
            Muốn xoay một bức ảnh 30 độ? Nhân mỗi điểm ảnh (pixel) với
            ma trận xoay (rotation matrix). Muốn phóng to 2 lần? Nhân với
            ma trận co giãn (scaling matrix). Trong neural network, ma trận
            trọng số <LaTeX>{"W"}</LaTeX> biến đổi dữ liệu đầu vào
            thành biểu diễn mới ở mỗi tầng.
          </Callout>

          <InlineChallenge
            question="Ma trận (4, 3) nhân với ma trận (3, 5). Kết quả có kích thước gì?"
            options={["(4, 5)", "(3, 3)", "(5, 4)", "(4, 3)"]
            }
            correct={0}
            explanation="(4, 3) × (3, 5) = (4, 5). Lấy số hàng ma trận trái (4) và số cột ma trận phải (5)."
          />
        </LessonSection>

        <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tổng kết">
          <Callout variant="info" title="Tại sao GPU giỏi AI?">
            GPU (Graphics Processing Unit) ban đầu được thiết kế để xử lý
            đồ họa 3D — bản chất là hàng triệu phép nhân ma trận mỗi giây.
            Khi ML phát triển, người ta nhận ra rằng huấn luyện mạng nơ-ron
            cũng chỉ là nhân ma trận liên tục. GPU có hàng nghìn lõi nhỏ
            chạy song song, hoàn hảo cho việc này. Đó là lý do NVIDIA trở
            thành công ty giá trị bậc nhất thế giới nhờ AI.
          </Callout>

          <MiniSummary
            title="Những điều cần nhớ"
            points={[
              "Vector (véc-tơ) = danh sách số có thứ tự. Trong ML: embedding biểu diễn từ, ảnh, bài hát.",
              "Tích vô hướng (dot product) = nhân từng cặp rồi cộng. Đo mức 'đồng ý' giữa hai vector.",
              "Cosine similarity = tích vô hướng chuẩn hóa. Phạm vi [-1, 1]. Dùng trong gợi ý và tìm kiếm.",
              "Ma trận (matrix) = bảng số hình chữ nhật. Mỗi ma trận là một phép biến đổi không gian.",
              "Phép nhân ma trận: (m,n) × (n,k) = (m,k). Neural network = chuỗi phép nhân ma trận.",
              "GPU nhanh vì nhân ma trận song song — lý do GPU là phần cứng cốt lõi cho AI.",
            ]}
          />
          <p className="text-sm leading-relaxed mt-4">
            Tiếp theo, hãy tìm hiểu{" "}
            <TopicLink slug="eigendecomposition-pca">
              phân rã trị riêng và PCA
            </TopicLink>{" "}
            để biết cách giảm chiều dữ liệu, hoặc xem{" "}
            <TopicLink slug="word-embeddings">word embeddings</TopicLink> để
            hiểu cách biến từ ngữ thành vector trong thực tế.
          </p>
        </LessonSection>

        <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
          <QuizSection questions={quizQuestions} />
        </LessonSection>
      </ExplanationSection>
    </>
  );
}
