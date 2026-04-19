"use client";
import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
  CollapsibleDetail,
  MiniSummary,
  CodeBlock,
  LessonSection,
  LaTeX,
  TopicLink,
  ProgressSteps,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

/* ═══════════════════════════════════════════════════════════════════
 * METADATA
 * ═══════════════════════════════════════════════════════════════════ */
export const metadata: TopicMeta = {
  slug: "dbscan",
  title: "DBSCAN",
  titleVi: "Phân cụm dựa trên mật độ",
  description:
    "Thuật toán phân cụm tìm vùng mật độ cao, tự xác định số cụm và phát hiện nhiễu",
  category: "classic-ml",
  tags: ["clustering", "unsupervised-learning", "density"],
  difficulty: "intermediate",
  relatedSlugs: ["k-means", "pca", "knn"],
  vizType: "interactive",
};

/* ═══════════════════════════════════════════════════════════════════
 * TYPES & CONSTANTS
 * ═══════════════════════════════════════════════════════════════════ */
type Pt = { x: number; y: number };
type PointKind = "core" | "border" | "noise";

const NOISE_LABEL = -2;
const UNVISITED = -1;

const COLORS = [
  "#3b82f6", // blue — cluster 0
  "#22c55e", // green — cluster 1
  "#f97316", // orange — cluster 2
  "#8b5cf6", // purple — cluster 3
  "#ec4899", // pink — cluster 4
  "#14b8a6", // teal — cluster 5
];

const NOISE_COLOR = "#94a3b8";

function dist(a: Pt, b: Pt) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/* ═══════════════════════════════════════════════════════════════════
 * DATASET 1 — 40 points: 3 natural clusters + 5 noise
 *   Cluster A: dense top-left blob (~15 points)
 *   Cluster B: crescent bottom-middle (~12 points)
 *   Cluster C: tight right-side group (~8 points)
 *   Noise: 5 scattered points
 * ═══════════════════════════════════════════════════════════════════ */
const DATA: Pt[] = [
  /* Cluster A — 15 points dense top-left */
  { x: 70, y: 70 },
  { x: 85, y: 60 },
  { x: 95, y: 80 },
  { x: 60, y: 90 },
  { x: 75, y: 95 },
  { x: 90, y: 100 },
  { x: 105, y: 75 },
  { x: 110, y: 95 },
  { x: 65, y: 110 },
  { x: 80, y: 115 },
  { x: 100, y: 110 },
  { x: 120, y: 85 },
  { x: 55, y: 75 },
  { x: 85, y: 85 },
  { x: 100, y: 65 },

  /* Cluster B — 12 points crescent bottom middle */
  { x: 180, y: 220 },
  { x: 205, y: 235 },
  { x: 230, y: 245 },
  { x: 255, y: 250 },
  { x: 280, y: 250 },
  { x: 305, y: 245 },
  { x: 330, y: 235 },
  { x: 355, y: 220 },
  { x: 225, y: 220 },
  { x: 265, y: 230 },
  { x: 300, y: 225 },
  { x: 335, y: 215 },

  /* Cluster C — 8 points tight right */
  { x: 410, y: 90 },
  { x: 430, y: 110 },
  { x: 400, y: 120 },
  { x: 425, y: 80 },
  { x: 445, y: 105 },
  { x: 415, y: 130 },
  { x: 435, y: 135 },
  { x: 455, y: 95 },

  /* Noise — 5 scattered outliers */
  { x: 250, y: 45 },
  { x: 460, y: 260 },
  { x: 30, y: 260 },
  { x: 160, y: 150 },
  { x: 380, y: 180 },
];

/* ═══════════════════════════════════════════════════════════════════
 * DATASET 2 — Moons (for comparison with K-Means)
 *   Two interleaving half-circles — the classic "DBSCAN wins" case.
 * ═══════════════════════════════════════════════════════════════════ */
function generateMoons(n: number = 60): Pt[] {
  const pts: Pt[] = [];
  const half = Math.floor(n / 2);

  // Upper moon — half circle from 0 to π, radius 80, center (160, 140)
  for (let i = 0; i < half; i++) {
    const t = (i / (half - 1)) * Math.PI;
    const r = 80 + (Math.sin(i * 1.7) * 6);
    pts.push({
      x: 160 + r * Math.cos(t) + (Math.sin(i * 3.1) * 5),
      y: 140 - r * Math.sin(t) + (Math.cos(i * 2.3) * 5),
    });
  }

  // Lower moon — shifted and flipped
  for (let i = 0; i < half; i++) {
    const t = (i / (half - 1)) * Math.PI;
    const r = 80 + (Math.cos(i * 1.3) * 6);
    pts.push({
      x: 240 - r * Math.cos(t) + (Math.cos(i * 2.7) * 5),
      y: 180 + r * Math.sin(t) + (Math.sin(i * 3.5) * 5),
    });
  }

  return pts;
}

const MOONS = generateMoons(60);

/* ═══════════════════════════════════════════════════════════════════
 * DBSCAN core algorithm with expansion traces
 * Returns: labels[] and trace[] showing order of expansion
 * ═══════════════════════════════════════════════════════════════════ */
interface DBSCANResult {
  labels: number[];
  trace: Array<{ step: number; point: number; cluster: number; kind: PointKind }>;
}

function runDBSCAN(pts: Pt[], eps: number, minPts: number): DBSCANResult {
  const n = pts.length;
  const labels = new Array(n).fill(UNVISITED);
  const trace: DBSCANResult["trace"] = [];
  let cluster = 0;
  let stepCounter = 0;

  for (let i = 0; i < n; i++) {
    if (labels[i] !== UNVISITED) continue;

    const neighbors = pts
      .map((p, j) => ({ j, d: dist(pts[i], p) }))
      .filter((x) => x.d <= eps && x.j !== i);

    if (neighbors.length < minPts - 1) {
      labels[i] = NOISE_LABEL;
      trace.push({ step: stepCounter++, point: i, cluster: NOISE_LABEL, kind: "noise" });
      continue;
    }

    labels[i] = cluster;
    trace.push({ step: stepCounter++, point: i, cluster, kind: "core" });
    const queue = neighbors.map((x) => x.j);

    while (queue.length > 0) {
      const qi = queue.shift()!;
      if (labels[qi] === NOISE_LABEL) {
        labels[qi] = cluster;
        trace.push({ step: stepCounter++, point: qi, cluster, kind: "border" });
      }
      if (labels[qi] !== UNVISITED && labels[qi] !== NOISE_LABEL) continue;
      labels[qi] = cluster;

      const qNeighbors = pts
        .map((p, j) => ({ j, d: dist(pts[qi], p) }))
        .filter((x) => x.d <= eps && x.j !== qi);

      const isCore = qNeighbors.length >= minPts - 1;
      trace.push({
        step: stepCounter++,
        point: qi,
        cluster,
        kind: isCore ? "core" : "border",
      });

      if (isCore) {
        qNeighbors.forEach((x) => {
          if (labels[x.j] === UNVISITED || labels[x.j] === NOISE_LABEL) queue.push(x.j);
        });
      }
    }
    cluster++;
  }
  return { labels, trace };
}

/* ═══════════════════════════════════════════════════════════════════
 * K-MEANS — simple fixed-K implementation for moons comparison
 * ═══════════════════════════════════════════════════════════════════ */
function runKMeans(pts: Pt[], k: number, iters: number = 20): number[] {
  if (pts.length === 0) return [];
  // Deterministic init — pick k points spread apart
  const centroids: Pt[] = [];
  const step = Math.floor(pts.length / k);
  for (let i = 0; i < k; i++) centroids.push({ ...pts[i * step] });

  let labels = new Array(pts.length).fill(0);

  for (let iter = 0; iter < iters; iter++) {
    // Assign
    labels = pts.map((p) => {
      let best = 0;
      let bestD = Infinity;
      for (let c = 0; c < k; c++) {
        const d = dist(p, centroids[c]);
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      return best;
    });
    // Update
    for (let c = 0; c < k; c++) {
      const members = pts.filter((_, i) => labels[i] === c);
      if (members.length === 0) continue;
      centroids[c] = {
        x: members.reduce((s, p) => s + p.x, 0) / members.length,
        y: members.reduce((s, p) => s + p.y, 0) / members.length,
      };
    }
  }
  return labels;
}

const TOTAL_STEPS = 7;

/* ═══════════════════════════════════════════════════════════════════
 * MAIN COMPONENT
 * ═══════════════════════════════════════════════════════════════════ */
export default function DbscanTopic() {
  const [epsilon, setEpsilon] = useState(42);
  const [minPts, setMinPts] = useState(4);
  const [hoveredIdx, setHoveredIdx] = useState(-1);
  const [expansionStep, setExpansionStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [compareMode, setCompareMode] = useState<"dbscan" | "kmeans">("dbscan");
  const [currentProgress, setCurrentProgress] = useState(1);

  /* Run DBSCAN on main dataset */
  const result = useMemo(() => runDBSCAN(DATA, epsilon, minPts), [epsilon, minPts]);
  const labels = result.labels;
  const trace = result.trace;

  const numClusters = useMemo(
    () => new Set(labels.filter((l) => l >= 0)).size,
    [labels],
  );
  const numNoise = useMemo(() => labels.filter((l) => l < 0).length, [labels]);

  /* Point classification */
  const pointTypes = useMemo<PointKind[]>(() => {
    return DATA.map((p, i) => {
      const neighbors = DATA.filter((q, j) => j !== i && dist(p, q) <= epsilon);
      if (labels[i] < 0) return "noise";
      if (neighbors.length >= minPts - 1) return "core";
      return "border";
    });
  }, [labels, epsilon, minPts]);

  const numCore = useMemo(() => pointTypes.filter((k) => k === "core").length, [pointTypes]);
  const numBorder = useMemo(() => pointTypes.filter((k) => k === "border").length, [pointTypes]);

  /* Animation tick for expansion */
  useEffect(() => {
    if (!isAnimating) return;
    if (expansionStep >= trace.length) {
      setIsAnimating(false);
      return;
    }
    const t = setTimeout(() => {
      setExpansionStep((s) => s + 1);
    }, 180);
    return () => clearTimeout(t);
  }, [isAnimating, expansionStep, trace.length]);

  /* Points revealed at current expansion step */
  const revealedPoints = useMemo(() => {
    if (expansionStep === 0) return new Set<number>();
    const set = new Set<number>();
    for (let i = 0; i < Math.min(expansionStep, trace.length); i++) {
      set.add(trace[i].point);
    }
    return set;
  }, [expansionStep, trace]);

  /* Moons comparison results */
  const moonsDBSCAN = useMemo(() => runDBSCAN(MOONS, 22, 4).labels, []);
  const moonsKMeans = useMemo(() => runKMeans(MOONS, 2), []);

  const handleStep = useCallback(() => {
    if (expansionStep >= trace.length) {
      setExpansionStep(0);
      return;
    }
    setExpansionStep((s) => Math.min(s + 1, trace.length));
  }, [expansionStep, trace.length]);

  const handleAutoRun = useCallback(() => {
    setExpansionStep(0);
    setIsAnimating(true);
  }, []);

  const handleReset = useCallback(() => {
    setExpansionStep(0);
    setIsAnimating(false);
  }, []);

  /* ═══════════════════════════════════════════════════════════════════
   * QUIZ — 8 questions
   * ═══════════════════════════════════════════════════════════════════ */
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question: "So với K-Means, ưu điểm chính của DBSCAN là gì?",
        options: [
          "Chạy nhanh hơn K-Means trên dữ liệu lớn",
          "Không cần chọn số cụm trước, phát hiện cụm hình dạng bất kỳ, loại bỏ noise",
          "Luôn cho kết quả chính xác hơn K-Means",
          "Dễ triển khai hơn K-Means",
        ],
        correct: 1,
        explanation:
          "DBSCAN tự tìm số cụm dựa trên mật độ, phát hiện cụm hình bán nguyệt/xoắn ốc (K-Means chỉ tìm cụm hình cầu), và đánh dấu noise. Nhưng cần tune ε và minPts!",
      },
      {
        question: "Epsilon (ε) quá lớn thì sao?",
        options: [
          "Tất cả điểm thành noise",
          "Tất cả điểm gộp thành 1 cụm duy nhất",
          "Số cụm tăng lên đáng kể",
          "Thuật toán không hội tụ",
        ],
        correct: 1,
        explanation:
          "ε lớn → vùng lân cận rộng → mọi điểm là neighbor của nhau → gộp hết thành 1 cụm. ε nhỏ → mỗi điểm cô lập → toàn noise. Cần ε 'vừa đủ'!",
      },
      {
        question: "DBSCAN gặp khó khăn khi nào?",
        options: [
          "Khi dữ liệu có noise",
          "Khi các cụm có mật độ rất khác nhau (1 cụm dày, 1 cụm thưa)",
          "Khi dữ liệu chiều thấp (2D-3D)",
          "Khi dữ liệu đã chuẩn hoá",
        ],
        correct: 1,
        explanation:
          "Cùng 1 giá trị ε: cụm dày → tìm tốt, cụm thưa → bị coi là noise. HDBSCAN giải quyết bằng cách tự điều chỉnh ε theo vùng.",
      },
      {
        question: "Điểm 'core' trong DBSCAN là gì?",
        options: [
          "Điểm ở giữa cụm về mặt hình học",
          "Điểm có ≥ minPts láng giềng (gồm chính nó) trong bán kính ε",
          "Điểm được xét đầu tiên trong thuật toán",
          "Điểm có khoảng cách ngắn nhất đến centroid",
        ],
        correct: 1,
        explanation:
          "Core point là điểm có đủ mật độ lân cận. Chính các core point này tạo xương sống cho cụm. Border là core của cụm này mà chính nó không đủ core.",
      },
      {
        question: "Tại sao phải chuẩn hoá dữ liệu trước DBSCAN?",
        options: [
          "Để thuật toán chạy nhanh hơn",
          "Vì DBSCAN dùng khoảng cách — feature có scale lớn sẽ lấn át",
          "Chuẩn hoá không cần thiết cho DBSCAN",
          "Để giảm số chiều dữ liệu",
        ],
        correct: 1,
        explanation:
          "Nếu feature 'lương' có giá trị hàng triệu, feature 'tuổi' chỉ vài chục — khoảng cách Euclidean sẽ gần như chỉ phụ thuộc vào lương. StandardScaler hoặc MinMaxScaler là bắt buộc.",
      },
      {
        question: "k-distance plot được dùng để làm gì?",
        options: [
          "Chọn số cụm k tối ưu",
          "Chọn ε tối ưu bằng cách tìm điểm 'khuỷu tay'",
          "Đo độ chính xác của DBSCAN",
          "Hiển thị phân bố mật độ dữ liệu",
        ],
        correct: 1,
        explanation:
          "Sắp xếp khoảng cách đến láng giềng thứ k của mọi điểm theo thứ tự tăng. Đồ thị có một 'khuỷu tay' rõ rệt — đó chính là giá trị ε hợp lý.",
      },
      {
        question: "Với dữ liệu Moons (2 hình bán nguyệt đan xen), thuật toán nào phù hợp hơn?",
        options: [
          "K-Means với K=2",
          "DBSCAN (tìm cụm dựa trên kết nối mật độ)",
          "K-Means với K=4",
          "Cả hai đều như nhau",
        ],
        correct: 1,
        explanation:
          "K-Means dùng khoảng cách Euclidean đến centroid → luôn tạo cụm lồi (convex). Moons không lồi nên K-Means cắt ngang. DBSCAN lần theo mật độ liên tục → phân đúng hai hình bán nguyệt.",
      },
      {
        question: "DBSCAN có nhược điểm gì về độ phức tạp?",
        options: [
          "O(n log n) — nhanh hơn K-Means",
          "O(n²) trong trường hợp xấu — chậm trên n lớn nếu không có index không gian",
          "O(nk) — giống K-Means",
          "O(1) — cực nhanh",
        ],
        correct: 1,
        explanation:
          "Tra cứu láng giềng nhiều lần. Với k-d tree hoặc ball tree, có thể giảm xuống O(n log n) trong không gian chiều thấp. scikit-learn tự chọn cấu trúc phù hợp.",
      },
    ],
    [],
  );

  /* ═══════════════════════════════════════════════════════════════════
   * RENDER
   * ═══════════════════════════════════════════════════════════════════ */
  return (
    <>
      <div className="mb-6">
        <ProgressSteps
          current={currentProgress}
          total={TOTAL_STEPS}
          labels={[
            "Dự đoán",
            "Khám phá",
            "Khoảnh khắc Aha",
            "Thử thách",
            "Lý thuyết",
            "Tóm tắt",
            "Kiểm tra",
          ]}
        />
      </div>

      {/* ═══ STEP 1: PREDICTION GATE ═══ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Nhìn bản đồ Hà Nội ban đêm từ vệ tinh: có cụm đèn sáng (khu dân cư), vùng tối (đồng ruộng), và vài đèn lẻ (nhà riêng). Bạn muốn phân nhóm các đèn. Dùng K-Means có ổn không?"
          options={[
            "Dùng K-Means được — chọn K = số khu dân cư",
            "Không — vì cụm có hình dạng bất kỳ, số cụm chưa biết, và có đèn lẻ (noise)",
            "K-Means luôn tốt — không cần thuật toán khác",
          ]}
          correct={1}
          explanation="K-Means cần biết K trước và chỉ tìm cụm hình cầu. Khu dân cư có hình dạng bất kỳ, đèn lẻ là noise. DBSCAN tìm cụm dựa trên MẬT ĐỘ — hoàn hảo cho bài toán này!"
        >
          {/* ═══ STEP 2: INTERACTIVE DBSCAN SIMULATOR ═══ */}
          <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
            <p className="mb-4 text-sm text-muted leading-relaxed">
              <strong className="text-foreground">Mô phỏng DBSCAN đầy đủ.</strong>{" "}
              Kéo <em>ε</em> và <em>minPts</em> để điều chỉnh. Nhấn{" "}
              <strong>&quot;Bước tiếp&quot;</strong> để xem thuật toán mở rộng từng điểm, hoặc{" "}
              <strong>&quot;Chạy tự động&quot;</strong> để xem toàn bộ quá trình.
            </p>

            <VisualizationSection>
              <div className="space-y-4">
                {/* Main scatter — 40 points */}
                <svg
                  viewBox="0 0 500 320"
                  className="w-full rounded-lg border border-border bg-background"
                >
                  {/* Epsilon circle for hovered point */}
                  {hoveredIdx >= 0 && (
                    <motion.circle
                      cx={DATA[hoveredIdx].x}
                      cy={DATA[hoveredIdx].y}
                      r={epsilon}
                      fill={
                        labels[hoveredIdx] >= 0
                          ? COLORS[labels[hoveredIdx] % COLORS.length]
                          : NOISE_COLOR
                      }
                      opacity={0.08}
                      stroke="#f59e0b"
                      strokeWidth={1.5}
                      strokeDasharray="5 3"
                      initial={{ r: 0 }}
                      animate={{ r: epsilon }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    />
                  )}

                  {/* Connection lines — hovered point's ε-neighbors */}
                  {hoveredIdx >= 0 &&
                    DATA.map((p, j) => {
                      if (j === hoveredIdx) return null;
                      const d = dist(DATA[hoveredIdx], p);
                      if (d > epsilon) return null;
                      return (
                        <line
                          key={`conn-${j}`}
                          x1={DATA[hoveredIdx].x}
                          y1={DATA[hoveredIdx].y}
                          x2={p.x}
                          y2={p.y}
                          stroke="#f59e0b"
                          strokeWidth={0.8}
                          opacity={0.35}
                        />
                      );
                    })}

                  {/* Data points — hide if in animation mode and not yet revealed */}
                  {DATA.map((p, i) => {
                    const cluster = labels[i];
                    const isNoise = cluster < 0;
                    const type = pointTypes[i];
                    const color = isNoise
                      ? NOISE_COLOR
                      : COLORS[cluster % COLORS.length];

                    // In animation mode, dim unrevealed points
                    const animating = expansionStep > 0 && expansionStep < trace.length;
                    const revealed = revealedPoints.has(i);
                    const fillOpacity = animating ? (revealed ? 1 : 0.15) : 1;

                    return (
                      <g key={i} opacity={fillOpacity}>
                        {isNoise ? (
                          <g
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredIdx(i)}
                            onMouseLeave={() => setHoveredIdx(-1)}
                          >
                            <line
                              x1={p.x - 5}
                              y1={p.y - 5}
                              x2={p.x + 5}
                              y2={p.y + 5}
                              stroke={NOISE_COLOR}
                              strokeWidth={2}
                            />
                            <line
                              x1={p.x + 5}
                              y1={p.y - 5}
                              x2={p.x - 5}
                              y2={p.y + 5}
                              stroke={NOISE_COLOR}
                              strokeWidth={2}
                            />
                          </g>
                        ) : (
                          <motion.circle
                            cx={p.x}
                            cy={p.y}
                            r={type === "core" ? 7 : 4.5}
                            fill={color}
                            stroke={hoveredIdx === i ? "#fbbf24" : "#fff"}
                            strokeWidth={type === "core" ? 2 : 1.5}
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredIdx(i)}
                            onMouseLeave={() => setHoveredIdx(-1)}
                            initial={false}
                            animate={{
                              r: type === "core" ? 7 : 4.5,
                              scale: revealed && animating ? [1.6, 1] : 1,
                            }}
                            transition={{ duration: 0.25 }}
                          />
                        )}
                      </g>
                    );
                  })}

                  {/* Stats overlay */}
                  <text
                    x={10}
                    y={20}
                    fontSize={13}
                    fill="currentColor"
                    className="text-foreground"
                    fontWeight={700}
                  >
                    Cụm: {numClusters} &nbsp;·&nbsp; Core: {numCore} &nbsp;·&nbsp;
                    Border: {numBorder} &nbsp;·&nbsp; Noise: {numNoise}
                  </text>
                  <text
                    x={10}
                    y={38}
                    fontSize={11}
                    fill="currentColor"
                    className="text-muted"
                  >
                    ε = {epsilon}, minPts = {minPts}{" "}
                    {expansionStep > 0 && expansionStep < trace.length
                      ? `· bước ${expansionStep}/${trace.length}`
                      : ""}
                  </text>

                  {/* Legend */}
                  <g transform="translate(370, 14)">
                    <circle cx={0} cy={0} r={6} fill="#3b82f6" stroke="#fff" strokeWidth={2} />
                    <text
                      x={12}
                      y={4}
                      fontSize={11}
                      fill="currentColor"
                      className="text-muted"
                    >
                      Lõi (core)
                    </text>
                    <circle cx={0} cy={18} r={4} fill="#3b82f6" stroke="#fff" strokeWidth={1} />
                    <text
                      x={12}
                      y={22}
                      fontSize={11}
                      fill="currentColor"
                      className="text-muted"
                    >
                      Biên (border)
                    </text>
                    <g transform="translate(0, 36)">
                      <line x1={-5} y1={-5} x2={5} y2={5} stroke={NOISE_COLOR} strokeWidth={2} />
                      <line x1={5} y1={-5} x2={-5} y2={5} stroke={NOISE_COLOR} strokeWidth={2} />
                    </g>
                    <text
                      x={12}
                      y={40}
                      fontSize={11}
                      fill="currentColor"
                      className="text-muted"
                    >
                      Noise
                    </text>
                  </g>
                </svg>

                {/* Controls */}
                <div className="space-y-3 rounded-lg border border-border bg-surface/50 p-3">
                  <div className="flex items-center gap-3">
                    <label className="w-24 text-xs font-medium text-muted">
                      Epsilon (ε)
                    </label>
                    <input
                      type="range"
                      min={15}
                      max={120}
                      value={epsilon}
                      onChange={(e) => {
                        setEpsilon(Number(e.target.value));
                        handleReset();
                      }}
                      className="flex-1 accent-accent"
                    />
                    <span className="w-10 text-center text-xs font-bold text-accent">
                      {epsilon}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="w-24 text-xs font-medium text-muted">MinPts</label>
                    <input
                      type="range"
                      min={2}
                      max={8}
                      value={minPts}
                      onChange={(e) => {
                        setMinPts(Number(e.target.value));
                        handleReset();
                      }}
                      className="flex-1 accent-accent"
                    />
                    <span className="w-10 text-center text-xs font-bold text-accent">
                      {minPts}
                    </span>
                  </div>

                  {/* Expansion controls */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      onClick={handleStep}
                      disabled={isAnimating}
                      className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface disabled:opacity-50"
                    >
                      {expansionStep >= trace.length ? "Khởi động lại" : "Bước tiếp →"}
                    </button>
                    <button
                      onClick={handleAutoRun}
                      disabled={isAnimating}
                      className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {isAnimating ? "Đang chạy..." : "Chạy tự động ▶"}
                    </button>
                    <button
                      onClick={handleReset}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
                    >
                      Đặt lại
                    </button>
                    <span className="ml-auto text-xs text-muted">
                      {expansionStep}/{trace.length} bước mở rộng
                    </span>
                  </div>
                </div>

                {/* Interpretive hint */}
                <AnimatePresence>
                  {expansionStep > 0 && expansionStep < trace.length && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="rounded-lg border border-accent/30 bg-accent/5 p-3 text-xs text-foreground"
                    >
                      {(() => {
                        const evt = trace[expansionStep - 1];
                        if (!evt) return null;
                        if (evt.kind === "noise")
                          return (
                            <span>
                              Điểm #{evt.point}: chưa đủ láng giềng → đánh dấu{" "}
                              <strong>noise</strong> (có thể đổi sau).
                            </span>
                          );
                        if (evt.kind === "core")
                          return (
                            <span>
                              Điểm #{evt.point} là <strong>core</strong> của cụm{" "}
                              {evt.cluster} — bắt đầu lan toả.
                            </span>
                          );
                        return (
                          <span>
                            Điểm #{evt.point} là <strong>border</strong> của cụm{" "}
                            {evt.cluster} — thêm vào vùng rìa.
                          </span>
                        );
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>

                <p className="text-xs text-muted">
                  Thử ε rất nhỏ (15) → phần lớn thành noise. Thử ε rất lớn (120) → mọi cụm
                  gộp thành một. Tìm giá trị &quot;vừa đủ&quot; để DBSCAN phân đúng 3 cụm.
                </p>
              </div>
            </VisualizationSection>

            {/* ═══ DBSCAN vs K-Means on Moons ═══ */}
            <div className="mt-8">
              <h4 className="mb-3 text-sm font-semibold text-foreground">
                So sánh với K-Means trên dữ liệu &quot;Moons&quot;
              </h4>
              <p className="mb-3 text-xs text-muted leading-relaxed">
                Hai hình bán nguyệt đan xen là bài toán kinh điển: K-Means không thể
                &quot;vòng&quot; theo hình cong. DBSCAN lần theo mật độ liên tục.
              </p>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setCompareMode("dbscan")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    compareMode === "dbscan"
                      ? "bg-accent text-white"
                      : "border border-border text-muted hover:text-foreground"
                  }`}
                >
                  DBSCAN (ε=22, minPts=4)
                </button>
                <button
                  onClick={() => setCompareMode("kmeans")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    compareMode === "kmeans"
                      ? "bg-accent text-white"
                      : "border border-border text-muted hover:text-foreground"
                  }`}
                >
                  K-Means (K=2)
                </button>
              </div>

              <svg
                viewBox="0 0 420 300"
                className="w-full rounded-lg border border-border bg-background"
              >
                {MOONS.map((p, i) => {
                  const lbl =
                    compareMode === "dbscan" ? moonsDBSCAN[i] : moonsKMeans[i];
                  const isNoise = lbl < 0;
                  const color = isNoise ? NOISE_COLOR : COLORS[lbl % COLORS.length];
                  return (
                    <circle
                      key={`m-${i}`}
                      cx={p.x}
                      cy={p.y}
                      r={5}
                      fill={color}
                      stroke="#fff"
                      strokeWidth={1}
                      opacity={isNoise ? 0.55 : 1}
                    />
                  );
                })}
                <text
                  x={10}
                  y={20}
                  fontSize={12}
                  fill="currentColor"
                  className="text-foreground"
                  fontWeight={600}
                >
                  {compareMode === "dbscan"
                    ? "DBSCAN tách đúng 2 bán nguyệt"
                    : "K-Means cắt ngang — sai hoàn toàn"}
                </text>
              </svg>

              <p className="mt-2 text-xs text-muted">
                Bạn thấy không? K-Means vẽ đường phân chia{" "}
                <strong>thẳng</strong> ở giữa — luôn tạo ranh giới lồi quanh centroid.
                DBSCAN không quan tâm đến hình dạng, chỉ quan tâm các điểm có{" "}
                <strong>&quot;liên thông mật độ&quot;</strong> hay không.
              </p>
            </div>
          </LessonSection>

          {/* ═══ STEP 3: AHA MOMENT ═══ */}
          <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
            <AhaMoment>
              <p>
                <strong>DBSCAN</strong>{" "}
                tìm cụm bằng <em>MẬT ĐỘ</em>, không bằng khoảng cách đến một tâm. Điểm
                lõi có ≥ minPts láng giềng trong bán kính ε. Các điểm lõi gần nhau tạo
                &quot;xương sống&quot;, kéo theo các điểm biên. Điểm đơn lẻ → noise.
                Không cần biết số cụm trước, không quan tâm hình dạng!
              </p>
            </AhaMoment>
          </LessonSection>

          {/* ═══ STEP 4: CHALLENGE — 2 inline ═══ */}
          <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
            <div className="space-y-4">
              <InlineChallenge
                question="Dữ liệu có 2 cụm: cụm A rất dày (100 điểm/cm²), cụm B rất thưa (5 điểm/cm²). DBSCAN với 1 giá trị ε có phân được cả hai không?"
                options={[
                  "Có — DBSCAN xử lý tốt mọi mật độ",
                  "Không — ε nhỏ bỏ sót cụm B, ε lớn gộp cả hai. Cần HDBSCAN",
                  "Tuỳ vào minPts",
                ]}
                correct={1}
                explanation="Đây là hạn chế lớn nhất của DBSCAN: 1 giá trị ε cho toàn bộ dữ liệu. HDBSCAN (Hierarchical DBSCAN) thử nhiều ε và chọn tối ưu cho từng vùng → giải quyết mật độ khác nhau."
              />
              <InlineChallenge
                question="Bạn đang phân cụm giao dịch ngân hàng để phát hiện gian lận. Giao dịch 'lạ' chỉ xuất hiện rất ít. DBSCAN xử lý các giao dịch lạ này như thế nào?"
                options={[
                  "DBSCAN bỏ sót chúng vì số lượng ít",
                  "DBSCAN đánh dấu chúng là noise — và đó chính là tín hiệu gian lận!",
                  "DBSCAN gộp chúng vào cụm 'giao dịch bình thường'",
                ]}
                correct={1}
                explanation="Đây là ứng dụng tuyệt vời của DBSCAN trong phát hiện bất thường (anomaly detection). Nhiều giao dịch gian lận không giống bất kỳ pattern nào → DBSCAN đẩy vào nhãn noise (-1). Bạn tập trung kiểm tra thủ công các noise này."
              />
            </div>
          </LessonSection>

          {/* ═══ STEP 5: EXPLANATION ═══ */}
          <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
            <ExplanationSection>
              <p>
                <strong>DBSCAN</strong>{" "}
                (Density-Based Spatial Clustering of Applications with Noise — Ester,
                Kriegel, Sander, Xu 1996) phân cụm dựa trên hai tham số:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>ε (epsilon):</strong> Bán kính vùng lân cận (neighbourhood
                  radius)
                </li>
                <li>
                  <strong>minPts:</strong> Số điểm tối thiểu trong vùng ε để một điểm
                  được xem là &quot;lõi&quot;
                </li>
              </ul>

              <p>
                <strong>Ba loại điểm:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>Core point:</strong>{" "}
                  <LaTeX>{"|N_\\varepsilon(p)| \\geq \\text{minPts}"}</LaTeX> — có đủ
                  láng giềng trong vùng ε
                </li>
                <li>
                  <strong>Border point:</strong> Nằm trong vùng ε của một core point,
                  nhưng tự nó không đủ láng giềng để là core
                </li>
                <li>
                  <strong>Noise point:</strong> Không phải core cũng không phải border
                  — đánh nhãn −1
                </li>
              </ol>

              <p>
                <strong>Tập láng giềng ε-neighbourhood</strong> của một điểm p trong
                tập dữ liệu D được định nghĩa:
              </p>
              <LaTeX block>
                {"N_\\varepsilon(p) = \\{q \\in D \\mid d(p, q) \\leq \\varepsilon\\}"}
              </LaTeX>

              <p>
                <strong>Density-reachable:</strong> Một điểm q được gọi là{" "}
                <em>density-reachable</em> từ p nếu tồn tại chuỗi các core point p₁ =
                p, p₂, …, pₙ = q sao cho mỗi pᵢ₊₁ thuộc ε-neighbourhood của pᵢ. Đây là
                cách cụm &quot;lan toả&quot;.
              </p>

              <p>
                <strong>Thuật toán:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1 pl-2 text-sm">
                <li>
                  Chọn một điểm p chưa thăm. Nếu |N_ε(p)| &lt; minPts, đánh dấu noise
                  tạm thời và tiếp tục.
                </li>
                <li>
                  Nếu p là core, mở cụm mới C và thêm p vào C.
                </li>
                <li>
                  Lan toả: với mỗi q ∈ N_ε(p) chưa gán cụm, thêm q vào C. Nếu q cũng
                  là core, đẩy các láng giềng của q vào hàng đợi.
                </li>
                <li>
                  Khi hàng đợi rỗng, chuyển sang điểm chưa thăm tiếp theo.
                </li>
                <li>
                  Các điểm cuối cùng không thuộc cụm nào được gán nhãn{" "}
                  <LaTeX>{"-1"}</LaTeX> (noise).
                </li>
              </ol>

              <Callout variant="tip" title="Chọn ε bằng k-distance plot">
                Tính khoảng cách đến láng giềng thứ k (k = minPts) cho mỗi điểm. Sắp
                xếp tăng dần và vẽ đồ thị. Điểm &quot;khuỷu tay&quot; (elbow) chính là
                ε tối ưu — đó là ngưỡng giữa &quot;bên trong cụm&quot; và &quot;ra
                ngoài&quot;.
              </Callout>

              <Callout variant="info" title="Quy tắc ngón tay cho minPts">
                Một heuristic tốt: <LaTeX>{"\\text{minPts} = 2 \\times D"}</LaTeX>{" "}
                với D là số chiều. Với dữ liệu 2D dùng minPts = 4; với 3D dùng 6. Với
                dữ liệu có nhiễu cao, tăng minPts để yêu cầu cụm &quot;chắc chắn&quot;
                hơn.
              </Callout>

              <p>
                <strong>Biến thể & cải tiến:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>HDBSCAN:</strong> Hierarchical DBSCAN — tự điều chỉnh ε theo
                  từng vùng mật độ, cho kết quả ổn định hơn nhiều
                </li>
                <li>
                  <strong>OPTICS:</strong> Tạo thứ tự &quot;reachability plot&quot;,
                  cho phép chọn nhiều giá trị ε cùng lúc
                </li>
                <li>
                  <strong>DBSCAN++:</strong> Subsampling để tăng tốc trên dữ liệu rất
                  lớn
                </li>
              </ul>

              <CodeBlock language="python" title="DBSCAN với scikit-learn">
                {`from sklearn.cluster import DBSCAN, HDBSCAN
from sklearn.datasets import make_moons
from sklearn.preprocessing import StandardScaler
import numpy as np

# --- 1. Tạo dữ liệu Moons + noise ---
X, _ = make_moons(n_samples=300, noise=0.08, random_state=42)
X = np.vstack([X, np.random.uniform(-2, 2, (20, 2))])  # thêm noise

# --- 2. LUÔN chuẩn hoá trước DBSCAN ---
X_scaled = StandardScaler().fit_transform(X)

# --- 3. k-distance plot (chọn eps) ---
from sklearn.neighbors import NearestNeighbors
neigh = NearestNeighbors(n_neighbors=5)
distances, _ = neigh.fit(X_scaled).kneighbors(X_scaled)
sorted_dist = np.sort(distances[:, 4])  # khoảng cách đến láng giềng thứ 5
# Vẽ sorted_dist: tìm 'khuỷu tay' → eps

# --- 4. Fit DBSCAN ---
db = DBSCAN(
    eps=0.18,         # chọn từ k-distance plot
    min_samples=5,    # = 2 * D với D=2
    metric="euclidean",
    algorithm="auto", # tự chọn kdtree / balltree / brute
)
labels = db.fit_predict(X_scaled)

n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
n_noise = (labels == -1).sum()
print(f"DBSCAN → {n_clusters} cụm, {n_noise} noise points")

# --- 5. So sánh với HDBSCAN (thường tốt hơn) ---
hdb = HDBSCAN(min_cluster_size=10, min_samples=5)
labels_h = hdb.fit_predict(X_scaled)
print(f"HDBSCAN → {len(set(labels_h)) - (1 if -1 in labels_h else 0)} cụm")

# --- 6. Đánh giá (nếu có ground truth) ---
from sklearn.metrics import adjusted_rand_score, silhouette_score
print(f"Silhouette: {silhouette_score(X_scaled, labels):.3f}")`}
              </CodeBlock>

              <Callout variant="warning" title="DBSCAN vs K-Means — chọn đúng công cụ">
                <strong>K-Means:</strong> cần K, chỉ cụm hình cầu/lồi, gán mọi điểm vào
                một cụm, nhanh O(nkT). <strong>DBSCAN:</strong> tự tìm K, cụm hình bất
                kỳ, phát hiện noise, chậm O(n²) hoặc O(n log n) với index. Dùng K-Means
                cho dữ liệu có cụm tròn đã biết số lượng; dùng DBSCAN khi có nhiễu,
                hình dạng lạ, hoặc chưa biết K.
              </Callout>

              <Callout variant="tip" title="Mẹo thực chiến">
                (1) Luôn chuẩn hoá dữ liệu trước. (2) Thử HDBSCAN trước khi tune DBSCAN
                thủ công. (3) Với dữ liệu nhiều chiều (D &gt; 10), DBSCAN yếu vì{" "}
                <TopicLink slug="dimensionality-curse">&quot;lời nguyền chiều cao&quot;</TopicLink>{" "}
                — khoảng cách mất ý nghĩa. Dùng{" "}
                <TopicLink slug="pca">PCA</TopicLink> hoặc{" "}
                <TopicLink slug="t-sne">t-SNE</TopicLink> để giảm chiều trước.
              </Callout>

              <CodeBlock language="python" title="Ứng dụng: phát hiện bất thường">
                {`# DBSCAN làm anomaly detector
# Các điểm có label == -1 là "lạ" — không giống bất kỳ pattern nào
from sklearn.cluster import DBSCAN
import pandas as pd

df = pd.read_csv("transactions.csv")
features = df[["amount", "hour", "merchant_risk", "distance_km"]]

# Chuẩn hoá
from sklearn.preprocessing import RobustScaler
X = RobustScaler().fit_transform(features)

# Fit
db = DBSCAN(eps=0.5, min_samples=10).fit(X)
df["anomaly"] = (db.labels_ == -1).astype(int)

# Những giao dịch "noise" là ứng viên gian lận cao
suspicious = df[df["anomaly"] == 1].sort_values("amount", ascending=False)
print(f"Found {len(suspicious)} suspicious transactions out of {len(df)}")
# → gửi đội fraud review thủ công`}
              </CodeBlock>

              <CollapsibleDetail title="Phân tích độ phức tạp chi tiết">
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Naive implementation:</strong> Mỗi điểm cần tra cứu láng
                    giềng trong toàn bộ tập dữ liệu → O(n) cho mỗi điểm, tổng O(n²).
                  </p>
                  <p>
                    <strong>Với k-d tree (2D-3D):</strong> Tra cứu range O(log n), tổng
                    thuật toán O(n log n). scikit-learn mặc định chọn k-d tree nếu
                    D &lt; 20.
                  </p>
                  <p>
                    <strong>Với ball tree (chiều cao):</strong> Cải thiện trong không
                    gian nhiều chiều, nhưng hiệu quả giảm khi D &gt; 50.
                  </p>
                  <p>
                    <strong>Bộ nhớ:</strong> O(n) cho labels + O(n) cho stack/queue.
                    Không lưu ma trận khoảng cách → phù hợp với n lớn.
                  </p>
                  <LaTeX block>
                    {"T(n) = O(n \\cdot \\text{RangeQuery}(\\varepsilon))"}
                  </LaTeX>
                  <p>
                    với RangeQuery là O(log n) cho k-d tree, O(n) cho brute force.
                  </p>
                </div>
              </CollapsibleDetail>

              <CollapsibleDetail title="Tại sao có 'border point' lại lạ — và vấn đề non-determinism">
                <div className="space-y-2 text-sm">
                  <p>
                    Một{" "}
                    <em>border point</em>{" "}
                    có thể nằm trong ε-neighbourhood của nhiều core point thuộc các
                    cụm khác nhau. DBSCAN gán nó vào{" "}
                    <strong>cụm nào gặp trước</strong> trong quá trình duyệt — tức là
                    kết quả phụ thuộc thứ tự điểm trong tập dữ liệu!
                  </p>
                  <p>
                    Điều này trái với K-Means (kết quả chỉ phụ thuộc init) và làm
                    DBSCAN khó tái tạo hoàn toàn. HDBSCAN sửa vấn đề này bằng cách xây
                    dựng cây phân cấp và chọn cụm &quot;ổn định nhất&quot; — kết quả
                    xác định hơn.
                  </p>
                  <p>
                    Trong thực tế, non-determinism này thường không ảnh hưởng lớn, vì
                    số border point nhỏ. Nhưng nếu bạn cần tái tạo chính xác, hãy sort
                    dữ liệu trước khi fit hoặc dùng HDBSCAN.
                  </p>
                </div>
              </CollapsibleDetail>

              <p>
                <strong>Liên hệ kiến thức:</strong> DBSCAN tương phản với{" "}
                <TopicLink slug="k-means">K-Means</TopicLink> (phân cụm tâm),
                bổ sung cho{" "}
                <TopicLink slug="knn">KNN</TopicLink> (phân loại dựa trên láng
                giềng). Với dữ liệu nhiều chiều, kết hợp{" "}
                <TopicLink slug="pca">PCA</TopicLink> để giảm chiều trước.
              </p>
            </ExplanationSection>
          </LessonSection>

          {/* ═══ STEP 6: MINI SUMMARY — 6 points ═══ */}
          <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
            <MiniSummary
              points={[
                "DBSCAN phân cụm dựa trên MẬT ĐỘ: vùng dày = cụm, vùng thưa = noise. Không cần biết K trước.",
                "Hai tham số cần tune: ε (bán kính lân cận) và minPts (số láng giềng tối thiểu để là core).",
                "Ba loại điểm: core (đủ láng giềng), border (gần core nhưng tự không đủ), noise (lẻ loi, nhãn −1).",
                "Ưu: tìm cụm hình dạng bất kỳ, phát hiện outlier tự nhiên, không cần K. Hoàn hảo cho anomaly detection.",
                "Nhược: nhạy với ε khi mật độ cụm không đều; yếu trong chiều cao; cần chuẩn hoá dữ liệu.",
                "Thực chiến: dùng HDBSCAN (tự điều chỉnh ε) thay cho DBSCAN thuần — thường ổn định và dễ dùng hơn.",
              ]}
            />
          </LessonSection>

          {/* ═══ STEP 7: QUIZ — 8 questions ═══ */}
          <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
            <QuizSection questions={quizQuestions} />
          </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 * END OF FILE — dbscan.tsx
 *
 * Design notes:
 *   - Preserves the original SVG visualization & ε-hover interaction
 *   - Adds: 40-point dataset (3 clusters + 5 noise), step-by-step
 *     expansion animation, moons comparison with K-Means toggle,
 *     8-question quiz, 2 CollapsibleDetails, 4 Callouts, 2 InlineChallenges,
 *     6-point MiniSummary, 2 CodeBlocks, ProgressSteps header.
 *   - All user-facing text in Vietnamese.
 *   - currentProgress state scaffolded for future per-section scroll tracking.
 *
 * Point-type key (internal legend):
 *   core   = |N_ε(p)| >= minPts - 1   (rendered as large filled circle)
 *   border = reached by a core point (smaller filled circle)
 *   noise  = neither                  (X marker)
 *
 * Cluster colour palette follows the Perplexity-inspired token set
 * from the project design system (primary/accent + categorical ramps).
 *
 * ───────────────────────────────────────────────────────────────────
 * Animation choreography reference
 * ───────────────────────────────────────────────────────────────────
 *
 * The expansion animation reveals DBSCAN's internal logic by walking
 * through the `trace[]` array one entry at a time. Each entry records
 * { step, point, cluster, kind }, where:
 *
 *   - step   : global step index (0..trace.length-1)
 *   - point  : index into DATA[]
 *   - cluster: cluster id, or NOISE_LABEL (-2) for unassigned
 *   - kind   : "core" | "border" | "noise"
 *
 * The revealedPoints Set is recomputed on every expansionStep change
 * to drive the `opacity` of each point's SVG group. Framer Motion's
 * spring transition on the circle's `scale` gives the "popping-in"
 * effect when a point is first revealed.
 *
 * ───────────────────────────────────────────────────────────────────
 * Moons dataset construction
 * ───────────────────────────────────────────────────────────────────
 *
 * `generateMoons(n)` produces two interleaving half-circles of n/2
 * points each. A small sinusoidal jitter is added so the boundary
 * between moons is not perfectly clean — otherwise K-Means would
 * sometimes "get lucky" near the inflection points. The jitter also
 * makes the visualisation feel more organic.
 *
 * ───────────────────────────────────────────────────────────────────
 * Why a hand-rolled K-Means instead of pulling in scikit-js?
 * ───────────────────────────────────────────────────────────────────
 *
 * We only need to demonstrate the *failure mode* of K-Means on moons,
 * which is already obvious after one or two iterations. A 25-line
 * implementation keeps the bundle small and the example self-contained.
 * The deterministic init (`pts[i * step]`) makes the visual stable
 * across re-renders without useEffect gymnastics.
 *
 * ═══════════════════════════════════════════════════════════════════ */
