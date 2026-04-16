"use client";

import { useState, useMemo, useCallback } from "react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "data-and-datasets",
  title: "Data & Datasets",
  titleVi: "Dữ liệu & Tập dữ liệu",
  description:
    "Đặc trưng, nhãn, tập huấn luyện và tập kiểm tra — hiểu dữ liệu trước khi học thuật toán",
  category: "foundations",
  tags: ["data", "features", "labels", "train-test-split"],
  difficulty: "beginner",
  relatedSlugs: [
    "what-is-ml",
    "math-readiness",
    "supervised-unsupervised-rl",
    "train-val-test",
  ],
  vizType: "interactive",
};

/* ── Types ── */
interface DataPoint {
  x: number;
  y: number;
  cls: 0 | 1; // 0 = class A (blue), 1 = class B (orange)
}

/* ── Constants ── */
const TOTAL_STEPS = 7;

/* SVG coordinate system for scatter plot */
const SW = 360;
const SH = 320;
const PADDING = 36;
const PLOT_W = SW - 2 * PADDING;
const PLOT_H = SH - 2 * PADDING;

const MIN_POINTS_TO_SPLIT = 20;
const TEST_RATIO = 0.3;

/* Feature table sample data: Vietnamese house prices */
const HOUSE_DATA = [
  { district: "Quận 1", area: 45, rooms: 2, price: 4500 },
  { district: "Quận 3", area: 60, rooms: 3, price: 5200 },
  { district: "Quận 7", area: 80, rooms: 3, price: 3800 },
  { district: "Quận 9", area: 100, rooms: 4, price: 2200 },
  { district: "Thủ Đức", area: 70, rooms: 2, price: 1800 },
  { district: "Bình Thạnh", area: 55, rooms: 2, price: 3200 },
];

const COLUMNS = [
  { key: "district" as const, label: "Quận" },
  { key: "area" as const, label: "Diện tích (m\u00b2)" },
  { key: "rooms" as const, label: "Số phòng" },
  { key: "price" as const, label: "Giá (triệu VNĐ)" },
];

/* ── Helpers ── */

/** Simple seeded shuffle (Fisher-Yates) using a seed for reproducibility per click */
function shuffleArray<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 16807 + 0) % 2147483647;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Compute centroid of a set of points */
function centroid(points: DataPoint[]): { x: number; y: number } {
  if (points.length === 0) return { x: 0, y: 0 };
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  return { x: sumX / points.length, y: sumY / points.length };
}

/**
 * Compute a simple linear decision boundary between two class centroids.
 * Returns the perpendicular bisector as two SVG endpoints.
 */
function computeBoundary(
  classA: DataPoint[],
  classB: DataPoint[],
): { x1: number; y1: number; x2: number; y2: number } | null {
  if (classA.length === 0 || classB.length === 0) return null;
  const cA = centroid(classA);
  const cB = centroid(classB);
  const midX = (cA.x + cB.x) / 2;
  const midY = (cA.y + cB.y) / 2;

  // Direction from A to B
  const dx = cB.x - cA.x;
  const dy = cB.y - cA.y;

  // Perpendicular direction
  const perpX = -dy;
  const perpY = dx;

  // Normalize and extend across the plot
  const len = Math.sqrt(perpX * perpX + perpY * perpY);
  if (len === 0) return null;
  const scale = 200 / len; // large enough to cross the plot
  return {
    x1: midX + perpX * scale,
    y1: midY + perpY * scale,
    x2: midX - perpX * scale,
    y2: midY - perpY * scale,
  };
}

/** Classify a point given the boundary (which side of the centroid midpoint line) */
function classifyPoint(
  p: DataPoint,
  cA: { x: number; y: number },
  cB: { x: number; y: number },
): 0 | 1 {
  const midX = (cA.x + cB.x) / 2;
  const midY = (cA.y + cB.y) / 2;
  const dx = cB.x - cA.x;
  const dy = cB.y - cA.y;
  // Sign of cross product determines side
  const cross = dx * (p.y - midY) - dy * (p.x - midX);
  return cross >= 0 ? 0 : 1;
}

/** Format number with dot thousands separator (Vietnamese) */
function fmtVn(n: number): string {
  return n.toLocaleString("vi-VN");
}

export default function DataAndDatasetsTopic() {
  /* ── State for scatter plot (Build-your-own dataset) ── */
  const [points, setPoints] = useState<DataPoint[]>([]);
  const [activeClass, setActiveClass] = useState<0 | 1>(0);
  const [splitSeed, setSplitSeed] = useState<number | null>(null);

  /* ── State for feature table ── */
  const [labelCol, setLabelCol] = useState<
    "district" | "area" | "rooms" | "price"
  >("price");

  /* ── Derived: split into train/test ── */
  const { trainSet, testSet } = useMemo(() => {
    if (splitSeed === null) return { trainSet: points, testSet: [] as DataPoint[] };
    const shuffled = shuffleArray(points, splitSeed);
    const testCount = Math.round(points.length * TEST_RATIO);
    return {
      trainSet: shuffled.slice(testCount),
      testSet: shuffled.slice(0, testCount),
    };
  }, [points, splitSeed]);

  /* ── Derived: boundary from training points only ── */
  const trainClassA = useMemo(
    () => trainSet.filter((p) => p.cls === 0),
    [trainSet],
  );
  const trainClassB = useMemo(
    () => trainSet.filter((p) => p.cls === 1),
    [trainSet],
  );
  const boundary = useMemo(
    () =>
      splitSeed !== null ? computeBoundary(trainClassA, trainClassB) : null,
    [splitSeed, trainClassA, trainClassB],
  );

  /* ── Derived: test accuracy ── */
  const testAccuracy = useMemo(() => {
    if (splitSeed === null || testSet.length === 0) return null;
    if (trainClassA.length === 0 || trainClassB.length === 0) return null;
    const cA = centroid(trainClassA);
    const cB = centroid(trainClassB);
    let correct = 0;
    for (const p of testSet) {
      if (classifyPoint(p, cA, cB) === p.cls) correct++;
    }
    return Math.round((correct / testSet.length) * 100);
  }, [splitSeed, testSet, trainClassA, trainClassB]);

  /* ── SVG coordinate helpers ── */
  const toSvgX = useCallback(
    (x: number) => PADDING + (x / 100) * PLOT_W,
    [],
  );
  const toSvgY = useCallback(
    (y: number) => PADDING + ((100 - y) / 100) * PLOT_H,
    [],
  );
  const fromSvgX = useCallback(
    (sx: number) => ((sx - PADDING) / PLOT_W) * 100,
    [],
  );
  const fromSvgY = useCallback(
    (sy: number) => 100 - ((sy - PADDING) / PLOT_H) * 100,
    [],
  );

  /* ── Handlers ── */
  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const scaleX = SW / rect.width;
      const scaleY = SH / rect.height;
      const svgX = (e.clientX - rect.left) * scaleX;
      const svgY = (e.clientY - rect.top) * scaleY;
      const dataX = fromSvgX(svgX);
      const dataY = fromSvgY(svgY);

      // Clamp to plot area
      if (dataX < 0 || dataX > 100 || dataY < 0 || dataY > 100) return;

      setPoints((prev) => [...prev, { x: dataX, y: dataY, cls: activeClass }]);
      setSplitSeed(null); // reset split on new point
    },
    [activeClass, fromSvgX, fromSvgY],
  );

  const handleToggleClass = useCallback(() => {
    setActiveClass((prev) => (prev === 0 ? 1 : 0));
  }, []);

  const handleSplit = useCallback(() => {
    setSplitSeed(Date.now());
  }, []);

  const handleReset = useCallback(() => {
    setPoints([]);
    setSplitSeed(null);
  }, []);

  const handleLabelToggle = useCallback(
    (key: "district" | "area" | "rooms" | "price") => {
      setLabelCol(key);
    },
    [],
  );

  /* ── Is this point in the test set? ── */
  const testSetIndices = useMemo(() => {
    if (splitSeed === null) return new Set<DataPoint>();
    return new Set(testSet);
  }, [splitSeed, testSet]);

  /* ── Quiz ── */
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "Trong bảng dữ liệu nhà ở, cột nào thường được chọn làm nhãn (label)?",
        options: [
          "Quận",
          "Diện tích",
          "Số phòng",
          "Giá nhà",
        ],
        correct: 3,
        explanation:
          "Giá nhà là giá trị ta muốn dự đoán, nên nó là nhãn (label). Các cột còn lại (quận, diện tích, số phòng) là đặc trưng (features) — thông tin đầu vào để mô hình học cách dự đoán giá.",
      },
      {
        question:
          "Tại sao phải chia dữ liệu thành tập huấn luyện và tập kiểm tra?",
        options: [
          "Để tiết kiệm bộ nhớ máy tính",
          "Để đánh giá mô hình trên dữ liệu chưa từng thấy",
          "Để mô hình học nhanh hơn",
          "Để giảm số lượng đặc trưng",
        ],
        correct: 1,
        explanation:
          "Tập kiểm tra giống như bài thi cuối kỳ — mô hình chưa bao giờ được thấy dữ liệu này trong quá trình học. Nếu mô hình đạt điểm cao trên tập kiểm tra, ta biết nó thực sự hiểu bài chứ không chỉ học thuộc lòng.",
      },
      {
        question:
          "Nếu mô hình đạt 100% trên tập huấn luyện nhưng chỉ 60% trên tập kiểm tra, điều gì đã xảy ra?",
        options: [
          "Mô hình hoạt động rất tốt",
          "Dữ liệu kiểm tra bị lỗi",
          "Mô hình đã học thuộc lòng (overfitting)",
          "Cần thêm đặc trưng",
        ],
        correct: 2,
        explanation:
          "Đây là dấu hiệu kinh điển của overfitting — mô hình ghi nhớ tập huấn luyện thay vì học quy luật tổng quát. Giống như học sinh chỉ thuộc đáp án trong sách giáo khoa nhưng không hiểu bản chất, nên gặp đề mới là không làm được.",
      },
      {
        type: "fill-blank",
        question:
          "Mỗi hàng trong bảng dữ liệu gọi là một {blank} (sample)",
        blanks: [
          {
            answer: "mẫu",
            accept: ["mẫu", "mau", "sample", "mẫu dữ liệu"],
          },
        ],
        explanation:
          "Mỗi hàng đại diện cho một quan sát thực tế — ví dụ một căn nhà với đầy đủ thông tin. Trong tiếng Anh gọi là sample hoặc instance.",
      },
    ],
    [],
  );

  return (
    <>
      {/* ================================================================
          VISUALIZATION SECTION
          ================================================================ */}
      <VisualizationSection topicSlug="data-and-datasets">
        <div className="space-y-8">
          {/* ── PRIMARY: Build-your-own dataset scatter plot ── */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground">
              Tự tạo tập dữ liệu phân loại
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              Bấm vào mặt phẳng để đặt điểm dữ liệu. Chuyển đổi giữa hai
              lớp bằng nút bên dưới. Khi có từ {MIN_POINTS_TO_SPLIT} điểm trở
              lên, hãy chia tập dữ liệu để xem mô hình hoạt động ra sao.
            </p>

            {/* Controls */}
            <div className="flex flex-wrap gap-3 items-center">
              <button
                onClick={handleToggleClass}
                className="rounded-lg px-4 py-2 text-sm font-medium border-2 transition-colors"
                style={{
                  borderColor: activeClass === 0 ? "#3b82f6" : "#f59e0b",
                  backgroundColor:
                    activeClass === 0 ? "#eff6ff" : "#fffbeb",
                  color: activeClass === 0 ? "#1d4ed8" : "#b45309",
                }}
              >
                {activeClass === 0
                  ? "Đang đặt: Nhà giá thấp (xanh)"
                  : "Đang đặt: Nhà giá cao (cam)"}
              </button>

              <button
                onClick={handleSplit}
                disabled={points.length < MIN_POINTS_TO_SPLIT}
                className="rounded-lg px-4 py-2 text-sm font-medium bg-accent text-white hover:bg-accent-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {splitSeed === null ? "Chia tập dữ liệu" : "Chia lại"}
              </button>

              <button
                onClick={handleReset}
                className="rounded-lg px-4 py-2 text-sm font-medium border border-border text-foreground hover:bg-surface-hover transition-colors"
              >
                Xóa tất cả
              </button>

              <span className="text-xs text-muted ml-auto">
                {points.length} điểm
                {points.length < MIN_POINTS_TO_SPLIT &&
                  ` (cần thêm ${MIN_POINTS_TO_SPLIT - points.length} để chia)`}
              </span>
            </div>

            {/* SVG Scatter Plot */}
            <div className="rounded-lg border border-border bg-surface p-2 flex items-center justify-center">
              <svg
                viewBox={`0 0 ${SW} ${SH}`}
                className="w-full max-w-[400px] cursor-crosshair"
                aria-label="Mặt phẳng tọa độ — bấm để đặt điểm dữ liệu"
                onClick={handleSvgClick}
              >
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map((v) => (
                  <g key={`grid-${v}`}>
                    <line
                      x1={PADDING}
                      y1={toSvgY(v)}
                      x2={SW - PADDING}
                      y2={toSvgY(v)}
                      stroke="currentColor"
                      className="text-border"
                      strokeWidth="0.5"
                      strokeDasharray={v === 0 ? "none" : "3,3"}
                    />
                    <line
                      x1={toSvgX(v)}
                      y1={PADDING}
                      x2={toSvgX(v)}
                      y2={SH - PADDING}
                      stroke="currentColor"
                      className="text-border"
                      strokeWidth="0.5"
                      strokeDasharray={v === 0 ? "none" : "3,3"}
                    />
                  </g>
                ))}

                {/* Axes */}
                <line
                  x1={PADDING}
                  y1={SH - PADDING}
                  x2={SW - PADDING}
                  y2={SH - PADDING}
                  stroke="currentColor"
                  className="text-foreground"
                  strokeWidth="1.5"
                />
                <line
                  x1={PADDING}
                  y1={PADDING}
                  x2={PADDING}
                  y2={SH - PADDING}
                  stroke="currentColor"
                  className="text-foreground"
                  strokeWidth="1.5"
                />

                {/* Axis labels */}
                <text
                  x={SW / 2}
                  y={SH - 6}
                  textAnchor="middle"
                  fontSize="11"
                  fill="currentColor"
                  className="text-muted"
                >
                  Diện tích
                </text>
                <text
                  x={10}
                  y={SH / 2}
                  textAnchor="middle"
                  fontSize="11"
                  fill="currentColor"
                  className="text-muted"
                  transform={`rotate(-90, 10, ${SH / 2})`}
                >
                  Số phòng
                </text>

                {/* Decision boundary (only after split) */}
                {boundary && (
                  <line
                    x1={toSvgX(boundary.x1)}
                    y1={toSvgY(boundary.y1)}
                    x2={toSvgX(boundary.x2)}
                    y2={toSvgY(boundary.y2)}
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray="6,4"
                    opacity="0.8"
                  />
                )}

                {/* Data points */}
                {points.map((p, i) => {
                  const isTest = testSetIndices.has(p);
                  const fillColor = p.cls === 0 ? "#3b82f6" : "#f59e0b";
                  return (
                    <circle
                      key={i}
                      cx={toSvgX(p.x)}
                      cy={toSvgY(p.y)}
                      r="5"
                      fill={isTest ? "none" : fillColor}
                      stroke={fillColor}
                      strokeWidth={isTest ? "2.5" : "1.5"}
                      opacity="0.85"
                    />
                  );
                })}
              </svg>
            </div>

            {/* Legend + accuracy */}
            <div className="flex flex-wrap gap-4 items-center text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <svg width="12" height="12">
                  <circle cx="6" cy="6" r="5" fill="#3b82f6" />
                </svg>
                Nhà giá thấp (loại A)
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="12" height="12">
                  <circle cx="6" cy="6" r="5" fill="#f59e0b" />
                </svg>
                Nhà giá cao (loại B)
              </span>
              {splitSeed !== null && (
                <>
                  <span className="flex items-center gap-1.5">
                    <svg width="12" height="12">
                      <circle
                        cx="6"
                        cy="6"
                        r="4"
                        fill="none"
                        stroke="#666"
                        strokeWidth="2"
                      />
                    </svg>
                    Tập kiểm tra (viền rỗng)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg width="16" height="12">
                      <line
                        x1="0"
                        y1="6"
                        x2="16"
                        y2="6"
                        stroke="#10b981"
                        strokeWidth="2"
                        strokeDasharray="4,3"
                      />
                    </svg>
                    Đường phân chia
                  </span>
                </>
              )}
            </div>

            {/* Accuracy display */}
            {testAccuracy !== null && (
              <div className="rounded-lg border border-accent/30 bg-accent-light/30 p-3 text-sm text-foreground leading-relaxed">
                <p>
                  <strong>Độ chính xác trên tập kiểm tra:</strong>{" "}
                  <span className="font-mono font-bold text-accent-dark text-lg">
                    {testAccuracy}%
                  </span>{" "}
                  ({testSet.filter((p) => {
                    const cA = centroid(trainClassA);
                    const cB = centroid(trainClassB);
                    return classifyPoint(p, cA, cB) === p.cls;
                  }).length}
                  /{testSet.length} điểm đúng)
                </p>
                <p className="text-xs text-muted mt-1">
                  Bấm &quot;Chia lại&quot; để thấy cách chia khác nhau cho
                  kết quả khác nhau!
                </p>
              </div>
            )}
          </div>

          {/* Divider */}
          <hr className="border-border" />

          {/* ── SECONDARY: Feature table viewer ── */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground">
              Bảng dữ liệu: đặc trưng vs nhãn
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              Bấm vào tên cột để chọn nó làm <strong>nhãn</strong> (label).
              Các cột còn lại tự động trở thành{" "}
              <strong>đặc trưng</strong> (features).
            </p>

            <div className="rounded-lg border border-border bg-surface overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-hover/50">
                    {COLUMNS.map((col) => {
                      const isLabel = col.key === labelCol;
                      return (
                        <th
                          key={col.key}
                          onClick={() => handleLabelToggle(col.key)}
                          className={`px-3 py-2 text-left font-medium cursor-pointer transition-colors select-none ${
                            isLabel
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                              : "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span>{col.label}</span>
                            <span
                              className={`text-[10px] font-normal px-1.5 py-0.5 rounded-full ${
                                isLabel
                                  ? "bg-amber-200 text-amber-900 dark:bg-amber-800/50 dark:text-amber-200"
                                  : "bg-blue-100 text-blue-800 dark:bg-blue-800/40 dark:text-blue-200"
                              }`}
                            >
                              {isLabel ? "nhãn" : "đặc trưng"}
                            </span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {HOUSE_DATA.map((row, i) => (
                    <tr
                      key={i}
                      className="border-t border-border/50 hover:bg-surface-hover/30 transition-colors"
                    >
                      {COLUMNS.map((col) => {
                        const isLabel = col.key === labelCol;
                        const value =
                          col.key === "area" || col.key === "rooms"
                            ? row[col.key]
                            : col.key === "price"
                              ? fmtVn(row.price)
                              : row.district;
                        return (
                          <td
                            key={col.key}
                            className={`px-3 py-1.5 font-mono ${
                              isLabel
                                ? "font-bold text-amber-700 dark:text-amber-400"
                                : "text-foreground"
                            }`}
                          >
                            {value}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-xs text-muted leading-relaxed">
              <strong>Mẫu (sample)</strong> = mỗi hàng trong bảng (1 căn nhà).{" "}
              <strong>Đặc trưng (features)</strong> = cột{" "}
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                xanh
              </span>{" "}
              (đầu vào).{" "}
              <strong>Nhãn (label)</strong> = cột{" "}
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                cam
              </span>{" "}
              (đầu ra cần dự đoán).
            </div>
          </div>
        </div>
      </VisualizationSection>

      {/* ================================================================
          EXPLANATION SECTION
          ================================================================ */}
      <ExplanationSection topicSlug="data-and-datasets">
        <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
          <PredictionGate
            question="Theo bạn, mô hình ML học từ đâu?"
            options={[
              "Từ sách giáo khoa và tài liệu",
              "Từ bảng dữ liệu gồm nhiều hàng và cột",
              "Từ lập trình viên viết quy tắc thủ công",
            ]}
            correct={1}
            explanation="Đúng! ML học từ dữ liệu — mỗi hàng là một ví dụ thực tế, mỗi cột là một thông tin về ví dụ đó. Càng nhiều dữ liệu tốt, mô hình càng học được nhiều quy luật."
          >
            <p className="mt-3 text-sm text-muted leading-relaxed">
              Tiếp tục để khám phá cấu trúc của dữ liệu ML và lý do tại sao
              phải chia dữ liệu trước khi huấn luyện.
            </p>
          </PredictionGate>
        </LessonSection>

        <LessonSection
          step={2}
          totalSteps={TOTAL_STEPS}
          label="Dữ liệu là gì?"
        >
          <p className="text-sm leading-relaxed">
            Trong Machine Learning, <strong>dữ liệu</strong> (data) được tổ
            chức thành bảng. Mỗi <strong>hàng</strong> là một{" "}
            <strong>mẫu</strong> (sample) — một quan sát từ thế giới thực. Mỗi{" "}
            <strong>cột</strong> là một thuộc tính mô tả mẫu đó.
          </p>

          <Callout variant="tip" title="Ví dụ: Bảng giá nhà TP.HCM">
            Mỗi hàng là một căn nhà: quận nào, rộng bao nhiêu mét vuông, có
            mấy phòng, giá bao nhiêu. Bảng 1.000 căn nhà = 1.000 mẫu mà mô
            hình có thể học từ đó.
          </Callout>

          <p className="text-sm leading-relaxed mt-3">
            Bạn có thể tưởng tượng bảng dữ liệu giống như bảng điểm cuối kỳ:
            mỗi học sinh là một hàng, mỗi môn thi là một cột. ML đọc bảng
            này và tìm ra quy luật ẩn bên trong.
          </p>
        </LessonSection>

        <LessonSection
          step={3}
          totalSteps={TOTAL_STEPS}
          label="Đặc trưng & Nhãn"
        >
          <p className="text-sm leading-relaxed">
            Không phải cột nào cũng giống nhau. Trong bảng dữ liệu, ta chia
            ra hai loại:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2 text-sm leading-relaxed">
            <li>
              <strong>Đặc trưng</strong> (features) — các cột đầu vào mà mô
              hình dùng để phân tích. Ví dụ: diện tích, số phòng, vị trí quận.
            </li>
            <li>
              <strong>Nhãn</strong> (label) — cột đầu ra mà mô hình cố gắng
              dự đoán. Ví dụ: giá nhà.
            </li>
          </ul>

          <Callout variant="info" title="Shopee phân loại sản phẩm">
            Khi bạn đăng bán trên Shopee, AI tự động gợi ý danh mục. Ảnh sản
            phẩm và mô tả là đặc trưng, danh mục (thời trang, điện tử, gia
            dụng...) là nhãn.
          </Callout>

          <InlineChallenge
            question="Trong bài toán dự đoán điểm thi, đâu là đặc trưng?"
            options={[
              "Điểm thi cuối kỳ",
              "Số giờ ôn bài, điểm kiểm tra giữa kỳ",
              "Tên học sinh",
            ]}
            correct={1}
            explanation="Số giờ ôn bài và điểm giữa kỳ là thông tin đầu vào (đặc trưng) giúp dự đoán điểm cuối kỳ (nhãn). Tên học sinh không mang thông tin dự đoán hữu ích."
          />

          <AhaMoment>
            Quay lại phần Hình minh họa phía trên và bấm vào tên cột trong
            bảng dữ liệu nhà ở — bạn sẽ thấy bất kỳ cột nào cũng có thể là
            nhãn, tùy vào câu hỏi bạn muốn trả lời!
          </AhaMoment>
        </LessonSection>

        <LessonSection
          step={4}
          totalSteps={TOTAL_STEPS}
          label="Tập huấn luyện & Tập kiểm tra"
        >
          <p className="text-sm leading-relaxed">
            Đây là nguyên tắc vàng trong ML: <strong>không bao giờ kiểm tra
            mô hình trên dữ liệu nó đã dùng để học</strong>. Ta chia dữ liệu
            thành hai phần:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2 text-sm leading-relaxed">
            <li>
              <strong>Tập huấn luyện</strong> (training set) — phần lớn dữ
              liệu (thường 70-80%), mô hình dùng để học quy luật.
            </li>
            <li>
              <strong>Tập kiểm tra</strong> (test set) — phần nhỏ còn lại
              (20-30%), dùng để đánh giá mô hình trên dữ liệu hoàn toàn mới.
            </li>
          </ul>

          <Callout variant="tip" title="Ví dụ: Thi cuối kỳ ở trường">
            Học bài từ sách giáo khoa = huấn luyện trên tập huấn luyện.
            Làm bài thi cuối kỳ (đề mới) = kiểm tra trên tập kiểm tra. Nếu
            em chỉ học thuộc đáp án sách mà không hiểu bản chất, em sẽ trượt
            bài thi — trong ML gọi hiện tượng này là overfitting.
          </Callout>

          <AhaMoment>
            Quay lại phần Hình minh họa phía trên, đặt ít nhất 20 điểm rồi
            bấm &quot;Chia tập dữ liệu&quot;. Bấm &quot;Chia lại&quot; vài
            lần — bạn sẽ thấy cùng một bộ dữ liệu nhưng cách chia khác nhau
            cho kết quả khác nhau. Đó là lý do ta cần chia cẩn thận!
          </AhaMoment>
        </LessonSection>

        <LessonSection
          step={5}
          totalSteps={TOTAL_STEPS}
          label="Chất lượng dữ liệu"
        >
          <p className="text-sm leading-relaxed">
            Có một câu nói nổi tiếng trong ML:{" "}
            <strong>&quot;Rác vào, rác ra&quot;</strong> (Garbage In, Garbage
            Out). Dù thuật toán có tốt đến đâu, nếu dữ liệu đầu vào kém chất
            lượng thì kết quả cũng sẽ sai lệch.
          </p>

          <p className="text-sm leading-relaxed mt-3">
            Dữ liệu kém có thể là:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm leading-relaxed">
            <li>Thiếu giá trị (ô trống trong bảng)</li>
            <li>Giá trị sai (ghi nhầm diện tích 50m² thành 5.000m²)</li>
            <li>
              Thiên lệch (chỉ có dữ liệu Quận 1, không có quận ngoại thành)
            </li>
            <li>Nhãn gán sai (ghi nhà giá rẻ nhưng thực tế giá đắt)</li>
          </ul>

          <InlineChallenge
            question="Nếu tập dữ liệu nhà chỉ gồm nhà ở Quận 1, mô hình sẽ gặp vấn đề gì khi dự đoán nhà ở Quận 9?"
            options={[
              "Dự đoán chính xác vì thuật toán đủ mạnh",
              "Dự đoán sai vì chưa từng thấy dữ liệu ngoại thành",
              "Không thể chạy được",
            ]}
            correct={1}
            explanation="Mô hình chỉ biết những gì nó đã thấy. Nếu chỉ học từ nhà Quận 1, nó sẽ không hiểu đặc điểm nhà ngoại thành — đây là vấn đề thiên lệch dữ liệu."
          />
        </LessonSection>

        <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tổng kết">
          <MiniSummary
            title="Những điều cần nhớ"
            points={[
              "Dữ liệu ML được tổ chức thành bảng: hàng = mẫu (sample), cột = thuộc tính.",
              "Đặc trưng (features) = cột đầu vào, nhãn (label) = cột đầu ra cần dự đoán.",
              "Tập huấn luyện (training set) để mô hình học, tập kiểm tra (test set) để đánh giá trung thực.",
              "Cùng dữ liệu nhưng cách chia khác nhau có thể cho kết quả khác nhau.",
              "Chất lượng dữ liệu quyết định chất lượng mô hình — 'rác vào, rác ra'.",
            ]}
          />
          <p className="text-sm leading-relaxed mt-4">
            Tiếp theo, hãy tìm hiểu{" "}
            <TopicLink slug="vectors-and-matrices">
              vector và ma trận
            </TopicLink>{" "}
            để biết cách máy tính biểu diễn bảng dữ liệu này dưới dạng toán
            học, hoặc xem{" "}
            <TopicLink slug="supervised-unsupervised-rl">
              các loại học máy
            </TopicLink>{" "}
            để hiểu mô hình dùng dữ liệu này như thế nào.
          </p>
        </LessonSection>

        <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
          <QuizSection questions={quizQuestions} />
        </LessonSection>
      </ExplanationSection>
    </>
  );
}
