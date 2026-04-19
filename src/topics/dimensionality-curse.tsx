"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
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

export const metadata: TopicMeta = {
  slug: "dimensionality-curse",
  title: "Curse of Dimensionality",
  titleVi: "Lời nguyền chiều cao — Khi nhiều hơn lại tệ hơn",
  description:
    "Hiện tượng hiệu suất mô hình giảm khi số chiều đặc trưng tăng quá nhiều so với lượng dữ liệu có sẵn.",
  category: "foundations",
  tags: ["dimensionality", "curse", "features", "overfitting"],
  difficulty: "intermediate",
  relatedSlugs: ["pca", "feature-engineering", "overfitting-underfitting"],
  vizType: "interactive",
};

const TOTAL_STEPS = 7;
const STEP_LABELS = [
  "Dự đoán",
  "Khám phá",
  "Khoảnh khắc Aha",
  "Thử thách",
  "Lý thuyết",
  "Tóm tắt",
  "Kiểm tra",
];

/* ──────────────────────────────────────────────────────────────────────────
 * DETERMINISTIC PSEUDO-RANDOM
 * We cần random tái lập (cùng seed → cùng kết quả) để slider không "nhảy".
 * Dùng mulberry32 — nhỏ, nhanh, đủ tốt cho trực quan hoá.
 * ──────────────────────────────────────────────────────────────────────── */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function rand(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ──────────────────────────────────────────────────────────────────────────
 * SIMULATION CORE
 * Sinh N điểm ngẫu nhiên trong hypercube [0,1]^D, tính khoảng cách pairwise,
 * rồi đếm histogram. Trả về:
 *   - bins: mảng counts theo bucket
 *   - minD, maxD, meanD: thống kê khoảng cách
 *   - sqrtD: giá trị lý thuyết √(D/6) — kỳ vọng khoảng cách Euclid trong cube.
 * Độ phức tạp O(N² · D) nên ta giới hạn N ≈ 60 cho trơn tru.
 * ──────────────────────────────────────────────────────────────────────── */
interface DistanceStats {
  bins: number[];
  minD: number;
  maxD: number;
  meanD: number;
  stdD: number;
  theoreticalMean: number;
  ratio: number; // (max - min) / mean  — hệ số "thu hẹp"
}

function simulateDistances(
  dims: number,
  nPoints: number,
  nBins: number,
  seed: number,
): DistanceStats {
  const rand = mulberry32(seed);

  // Tạo N điểm trong [0,1]^D
  const points: number[][] = [];
  for (let i = 0; i < nPoints; i++) {
    const p: number[] = [];
    for (let d = 0; d < dims; d++) {
      p.push(rand());
    }
    points.push(p);
  }

  // Tính khoảng cách Euclid pairwise
  const dists: number[] = [];
  for (let i = 0; i < nPoints; i++) {
    for (let j = i + 1; j < nPoints; j++) {
      let sum = 0;
      const pi = points[i];
      const pj = points[j];
      for (let d = 0; d < dims; d++) {
        const diff = pi[d] - pj[d];
        sum += diff * diff;
      }
      dists.push(Math.sqrt(sum));
    }
  }

  let minD = Infinity;
  let maxD = -Infinity;
  let sum = 0;
  for (const d of dists) {
    if (d < minD) minD = d;
    if (d > maxD) maxD = d;
    sum += d;
  }
  const meanD = sum / dists.length;

  let variance = 0;
  for (const d of dists) {
    const diff = d - meanD;
    variance += diff * diff;
  }
  variance /= dists.length;
  const stdD = Math.sqrt(variance);

  // Histogram: chia đều từ 0 đến √D (maximum possible distance in unit cube).
  const upper = Math.sqrt(dims);
  const bins = new Array<number>(nBins).fill(0);
  for (const d of dists) {
    let idx = Math.floor((d / upper) * nBins);
    if (idx >= nBins) idx = nBins - 1;
    if (idx < 0) idx = 0;
    bins[idx] += 1;
  }

  // Kỳ vọng lý thuyết E[||X-Y||] ≈ √(D/6) cho D lớn
  // (mỗi chiều: E[(u-v)²] = 1/6, tổng D chiều → √(D/6)).
  const theoreticalMean = Math.sqrt(dims / 6);
  const ratio = meanD === 0 ? 0 : (maxD - minD) / meanD;

  return { bins, minD, maxD, meanD, stdD, theoreticalMean, ratio };
}

/* ──────────────────────────────────────────────────────────────────────────
 * HISTOGRAM COMPONENT — visualise pairwise distance distribution
 * ──────────────────────────────────────────────────────────────────────── */
interface HistogramProps {
  stats: DistanceStats;
  dims: number;
  width: number;
  height: number;
}

function Histogram({ stats, dims, width, height }: HistogramProps) {
  const { bins, minD, maxD, meanD, stdD, theoreticalMean } = stats;
  const upper = Math.sqrt(dims);
  const maxCount = Math.max(...bins, 1);
  const padding = { top: 24, right: 24, bottom: 36, left: 40 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;
  const barW = plotW / bins.length;

  const meanX = padding.left + (meanD / upper) * plotW;
  const theoryX = padding.left + (theoreticalMean / upper) * plotW;
  const stdLeft = padding.left + ((meanD - stdD) / upper) * plotW;
  const stdRight = padding.left + ((meanD + stdD) / upper) * plotW;

  // Sắc màu bar: xanh khi phân phối còn rộng, đỏ khi collapsed.
  const concentration = stdD / (meanD || 1);
  const barColor =
    concentration > 0.25
      ? "#22c55e"
      : concentration > 0.12
      ? "#f59e0b"
      : "#ef4444";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full max-w-3xl mx-auto"
      role="img"
      aria-label={`Histogram khoảng cách pairwise cho D=${dims}`}
    >
      {/* trục nền */}
      <rect
        x={padding.left}
        y={padding.top}
        width={plotW}
        height={plotH}
        fill="#0f172a"
        rx={6}
      />
      {/* grid ngang */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line
          key={f}
          x1={padding.left}
          x2={padding.left + plotW}
          y1={padding.top + plotH - f * plotH}
          y2={padding.top + plotH - f * plotH}
          stroke="#1e293b"
          strokeDasharray="2 3"
        />
      ))}
      {/* bars */}
      {bins.map((c, i) => {
        const h = (c / maxCount) * plotH;
        return (
          <motion.rect
            key={i}
            x={padding.left + i * barW + 1}
            y={padding.top + plotH - h}
            width={Math.max(barW - 2, 1)}
            height={h}
            fill={barColor}
            opacity={0.85}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            style={{ transformOrigin: `center ${padding.top + plotH}px` }}
            transition={{ duration: 0.25, delay: i * 0.005 }}
          />
        );
      })}
      {/* std band */}
      <rect
        x={Math.max(padding.left, stdLeft)}
        y={padding.top}
        width={Math.max(0, Math.min(stdRight, padding.left + plotW) - Math.max(padding.left, stdLeft))}
        height={plotH}
        fill="#3b82f6"
        opacity={0.12}
      />
      {/* mean line (đo thực tế) */}
      <line
        x1={meanX}
        x2={meanX}
        y1={padding.top}
        y2={padding.top + plotH}
        stroke="#60a5fa"
        strokeWidth={2}
      />
      <text x={meanX + 4} y={padding.top + 12} fill="#60a5fa" fontSize={11}>
        mean
      </text>
      {/* theoretical √(D/6) */}
      <line
        x1={theoryX}
        x2={theoryX}
        y1={padding.top}
        y2={padding.top + plotH}
        stroke="#f472b6"
        strokeWidth={2}
        strokeDasharray="4 3"
      />
      <text x={theoryX + 4} y={padding.top + 24} fill="#f472b6" fontSize={11}>
        √(D/6)
      </text>
      {/* axis labels */}
      <text
        x={padding.left}
        y={padding.top + plotH + 14}
        fill="#64748b"
        fontSize={11}
      >
        0
      </text>
      <text
        x={padding.left + plotW}
        y={padding.top + plotH + 14}
        fill="#64748b"
        fontSize={11}
        textAnchor="end"
      >
        √D = {upper.toFixed(2)}
      </text>
      <text
        x={padding.left + plotW / 2}
        y={padding.top + plotH + 28}
        fill="#94a3b8"
        fontSize={11}
        textAnchor="middle"
      >
        Khoảng cách Euclid giữa các cặp điểm
      </text>
      {/* y-axis label */}
      <text
        x={12}
        y={padding.top + plotH / 2}
        fill="#94a3b8"
        fontSize={11}
        transform={`rotate(-90 12 ${padding.top + plotH / 2})`}
        textAnchor="middle"
      >
        Số cặp
      </text>
      <text x={padding.left + 6} y={padding.top - 6} fill="#64748b" fontSize={11}>
        min={minD.toFixed(2)}, max={maxD.toFixed(2)}, σ={stdD.toFixed(3)}
      </text>
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * POINT CLOUD PREVIEW — 2D projection (first 2 coords) của N điểm
 * Chỉ để minh hoạ trực quan "data thưa dần" khi D tăng.
 * ──────────────────────────────────────────────────────────────────────── */
interface PointCloudProps {
  dims: number;
  nPoints: number;
  seed: number;
  size: number;
}

function PointCloudPreview({ dims, nPoints, seed, size }: PointCloudProps) {
  const points = useMemo(() => {
    const rand = mulberry32(seed ^ (dims * 101));
    const arr: { x: number; y: number }[] = [];
    for (let i = 0; i < nPoints; i++) {
      // Project hypercube xuống 2 chiều đầu tiên.
      const x = rand();
      const y = rand();
      // "Đốt" (D-2) giá trị còn lại để cùng một seed vẫn trùng với simulateDistances.
      for (let d = 2; d < dims; d++) rand();
      arr.push({ x, y });
    }
    return arr;
  }, [dims, nPoints, seed]);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-full max-w-[240px] mx-auto"
      role="img"
      aria-label="Point cloud 2D projection"
    >
      <rect x={0} y={0} width={size} height={size} rx={10} fill="#0f172a" />
      <rect
        x={1}
        y={1}
        width={size - 2}
        height={size - 2}
        rx={9}
        fill="none"
        stroke="#1e293b"
      />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={4 + p.x * (size - 8)}
          cy={4 + p.y * (size - 8)}
          r={2.5}
          fill="#38bdf8"
          opacity={0.85}
        />
      ))}
      <text x={size / 2} y={size - 6} fill="#64748b" fontSize={11} textAnchor="middle">
        Chiếu 2D ({dims}D gốc)
      </text>
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * MAIN TOPIC
 * ──────────────────────────────────────────────────────────────────────── */
export default function DimensionalityCurseTopic() {
  const [dims, setDims] = useState<number>(2);
  const [nPoints, setNPoints] = useState<number>(60);
  const [seed, setSeed] = useState<number>(1729);

  const handleReshuffle = useCallback(() => {
    setSeed((s) => (s * 1664525 + 1013904223) >>> 0);
  }, []);

  const stats = useMemo(
    () => simulateDistances(dims, nPoints, 40, seed),
    [dims, nPoints, seed],
  );

  // Phép đo "curse-index" — khi stdD/meanD → 0, khoảng cách gần như không
  // còn phân biệt. Ta chuẩn hoá về [0, 1]: 0 = đã sập, 1 = còn rộng.
  const concentration = stats.stdD / (stats.meanD || 1);
  const curseIndex = Math.max(0, Math.min(1, concentration / 0.4));

  // Tỉ lệ volume "vỏ ngoài" dày 10%: 1 - 0.9^D.
  const shellFraction = 1 - Math.pow(0.9, dims);
  // Data cần (rule-of-thumb luỹ thừa) — capped ở hiển thị.
  const dataNeeded = Math.pow(10, Math.min(dims, 6));

  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "Khi số chiều D tăng, kỳ vọng khoảng cách Euclid giữa hai điểm ngẫu nhiên trong hypercube [0,1]^D xấp xỉ bằng bao nhiêu?",
        options: [
          "Một hằng số không đổi, không phụ thuộc D",
          "√(D/6) — tăng theo √D, đồng thời phương sai tương đối co lại",
          "1/D — giảm rất nhanh về 0",
        ],
        correct: 1,
        explanation:
          "Với mỗi chiều i, E[(U_i − V_i)²] = 1/6 khi U, V ~ Uniform[0,1]. Cộng D chiều rồi lấy √ → E[||X − Y||] ≈ √(D/6). Điều thú vị hơn: σ không tăng cùng tốc độ, nên σ/μ → 0 và mọi cặp điểm trông 'bằng nhau'.",
      },
      {
        question:
          "Tại sao tăng số features không luôn tốt hơn cho mô hình học máy?",
        options: [
          "Luôn tốt hơn vì có nhiều thông tin",
          "Nhiều features + ít data → không gian sparse, model overfit noise vì không đủ 'hàng xóm' để khái quát",
          "Chỉ xấu khi features bị trùng nhau (collinear)",
        ],
        correct: 1,
        explanation:
          "10 features, 100 samples: mỗi vùng có ~10 samples → model học được patterns. 1000 features, 100 samples: không gian 1000 chiều, mỗi vùng gần như trống → model học theo noise. kNN, kernel-SVM, tree bị ảnh hưởng nặng nhất.",
      },
      {
        question:
          "PCA giải quyết curse of dimensionality bằng cơ chế nào?",
        options: [
          "Xoá ngẫu nhiên một nửa số features",
          "Tìm hướng có variance lớn nhất (eigenvectors của ma trận covariance) và chiếu data lên đó → giảm chiều mà giữ nhiều thông tin",
          "Nhân thêm data bằng augmentation",
        ],
        correct: 1,
        explanation:
          "PCA: tìm eigenvectors của covariance matrix → hướng có variance lớn nhất. 100 features có thể nằm trên 10 principal components (90% variance). Kết quả: data ít sparse hơn, model học tốt hơn, inference cũng nhanh hơn.",
      },
      {
        question:
          "Rule of thumb tối thiểu về số samples trên mỗi feature cho mô hình tuyến tính?",
        options: [
          "1 sample / feature là đủ",
          "Ít nhất 10–20 samples / feature để ước lượng hệ số ổn định",
          "Luôn cần 1000 samples / feature",
        ],
        correct: 1,
        explanation:
          "10 features → 100–200 samples. 1000 features → 10K–20K samples. Thiếu thì: (1) feature selection, (2) PCA/autoencoder, (3) regularization L1/L2, (4) augmentation.",
      },
      {
        question:
          "Trong hypercube [0,1]^D với D = 100, tỷ lệ thể tích nằm ở 'vỏ ngoài' dày 10% là bao nhiêu?",
        options: [
          "Xấp xỉ 10% (như trực giác ở 2D/3D)",
          "Xấp xỉ 99.997% — hầu hết khối lượng dồn ra rìa, lõi gần như rỗng",
          "Chính xác 50%",
        ],
        correct: 1,
        explanation:
          "Thể tích lõi trong = 0.9^100 ≈ 2.6 × 10⁻⁵. Vỏ = 1 − 0.9^100 ≈ 99.997%. Điều này phá vỡ trực giác: ở chiều cao, 'trung tâm' hầu như không tồn tại theo nghĩa thể tích.",
      },
      {
        question:
          "Khi D lớn, tỉ số (max pairwise distance − min pairwise distance) / min đi về đâu?",
        options: [
          "Tiến về ∞ — khoảng cách càng ngày càng phân tán",
          "Tiến về 0 — max và min xấp xỉ nhau, 'hàng xóm gần nhất' mất nghĩa",
          "Dao động quanh 1",
        ],
        correct: 1,
        explanation:
          "Beyer et al. (1999) chứng minh: với phân phối i.i.d., (max − min)/min → 0 khi D → ∞. Hệ quả: kNN và nearest-neighbor search mất ý nghĩa ở chiều rất cao nếu không có cấu trúc (manifold).",
      },
      {
        question:
          "Deep learning có 'miễn nhiễm' với curse of dimensionality không?",
        options: [
          "Có — transformer xử lý vô hạn chiều",
          "Không miễn nhiễm, nhưng nhờ manifold hypothesis (data thật nằm trên manifold thấp chiều) và học representation, DL giảm nhẹ curse",
          "Có — backprop tự nhiên loại bỏ chiều thừa",
        ],
        correct: 1,
        explanation:
          "Pixels 224×224×3 = 150K chiều, nhưng ảnh mèo thật chỉ chiếm một manifold rất nhỏ. CNN/ViT học projection xuống không gian ý nghĩa. Vẫn cần đủ data so với số tham số — scaling laws là minh chứng.",
      },
      {
        question:
          "Bạn có 10K samples, 250 features, accuracy tụt từ 85% xuống 72%. Chiến lược đầu tiên nên thử?",
        options: [
          "Thêm nhiều layers vào model",
          "Feature selection (mutual info, L1) hoặc PCA giữ 95% variance; kiểm tra lại ratio samples/feature",
          "Xoá ngẫu nhiên một nửa samples",
        ],
        correct: 1,
        explanation:
          "Ratio 10K/250 = 40:1 — vẫn ok với mô hình tuyến tính đơn giản, nhưng nếu features chứa nhiều noise thì vẫn curse. Thử L1 Lasso (tự zero out), PCA 95%, hoặc tree-based feature importance trước khi đổi model.",
      },
    ],
    [],
  );

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <ProgressSteps current={1} total={TOTAL_STEPS} labels={STEP_LABELS} />
      </div>

      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn có 100 samples, 5 features → model đạt accuracy 90%. Tăng lên 500 features (giữ nguyên 100 samples). Accuracy kỳ vọng?"
          options={[
            "95% — nhiều features nghĩa là nhiều thông tin hơn",
            "60–70% — quá nhiều features + ít data → overfit nặng, curse of dimensionality",
            "Vẫn đúng 90%, không đổi",
          ]}
          correct={1}
          explanation="Curse of dimensionality! 500 features × 100 samples → không gian 500 chiều nhưng chỉ có 100 điểm → data cực kỳ thưa. Model sẽ tìm thấy 'patterns' giả (noise) → overfit. Giống như tìm người trong sa mạc: càng nhiều chiều, sa mạc càng rộng, càng khó tìm."
        >
          <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
            <p className="mb-4 text-sm text-muted leading-relaxed">
              Dưới đây là <strong className="text-foreground">N điểm</strong>{" "}
              ngẫu nhiên trong hypercube [0,1]<sup>D</sup>. Kéo thanh{" "}
              <strong className="text-foreground">D</strong>{" "}
              để quan sát histogram khoảng cách pairwise. Khi D lớn, hãy chú ý:
              các thanh dồn về giá trị √(D/6), σ co lại → mọi cặp điểm trở nên{" "}
              <strong className="text-foreground">gần như bằng nhau</strong>.
            </p>

            <VisualizationSection>
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-4 items-start">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-muted">
                          Số chiều D
                        </label>
                        <span className="text-sm font-mono text-foreground">
                          {dims}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={2}
                        max={100}
                        value={dims}
                        onChange={(e) => setDims(parseInt(e.target.value, 10))}
                        className="w-full accent-accent"
                        aria-label="Số chiều"
                      />
                      <div className="flex justify-between text-[10px] text-muted">
                        <span>2</span>
                        <span>25</span>
                        <span>50</span>
                        <span>75</span>
                        <span>100</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-muted">
                          Số điểm N
                        </label>
                        <span className="text-sm font-mono text-foreground">
                          {nPoints}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={80}
                        value={nPoints}
                        onChange={(e) =>
                          setNPoints(parseInt(e.target.value, 10))
                        }
                        className="w-full accent-accent"
                        aria-label="Số điểm"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={handleReshuffle}
                        className="text-xs font-medium px-3 py-1.5 rounded-md border border-border bg-card hover:bg-surface transition-colors"
                      >
                        Sinh lại điểm (seed mới)
                      </button>
                      <span className="text-xs font-mono text-muted">
                        seed={seed}
                      </span>
                    </div>
                  </div>

                  <PointCloudPreview
                    dims={dims}
                    nPoints={nPoints}
                    seed={seed}
                    size={220}
                  />
                </div>

                <Histogram stats={stats} dims={dims} width={640} height={260} />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="text-muted">mean khoảng cách</div>
                    <div className="font-mono text-foreground text-sm">
                      {stats.meanD.toFixed(3)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="text-muted">√(D/6) lý thuyết</div>
                    <div className="font-mono text-foreground text-sm">
                      {stats.theoreticalMean.toFixed(3)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="text-muted">σ khoảng cách</div>
                    <div className="font-mono text-foreground text-sm">
                      {stats.stdD.toFixed(3)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="text-muted">σ / μ</div>
                    <div className="font-mono text-foreground text-sm">
                      {(stats.stdD / (stats.meanD || 1)).toFixed(3)}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">
                      Độ phân biệt khoảng cách (curse index)
                    </span>
                    <span className="font-mono text-foreground">
                      {(curseIndex * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-surface overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background:
                          curseIndex > 0.6
                            ? "#22c55e"
                            : curseIndex > 0.3
                            ? "#f59e0b"
                            : "#ef4444",
                      }}
                      animate={{ width: `${curseIndex * 100}%` }}
                      transition={{ duration: 0.25 }}
                    />
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    Khi thanh này chạm 0: mọi cặp điểm có cùng khoảng cách —{" "}
                    <em>khái niệm "gần" mất ý nghĩa</em>. Thuật toán kNN,
                    clustering khoảng cách (k-means với Euclid), kernel-SVM sẽ
                    thoái hoá. Với D = {dims}, ~
                    {(shellFraction * 100).toFixed(2)}% thể tích hypercube nằm
                    trong vỏ ngoài dày 10% — "lõi trung tâm" gần như rỗng.
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-card p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">
                      Rule-of-thumb data cần (10^D)
                    </span>
                    <span className="font-mono text-foreground">
                      {dataNeeded >= 1e6
                        ? "1M+"
                        : dataNeeded.toLocaleString("en-US")}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-1.5 leading-relaxed">
                    Để "lấp đầy" lưới 10 ô trên mỗi chiều, cần 10<sup>D</sup>{" "}
                    điểm. D = 10 → 10 tỷ điểm. D = 20 → hơn số nguyên tử trong
                    cơ thể người. Đây là một trong nhiều cách phát biểu curse.
                  </p>
                </div>
              </div>
            </VisualizationSection>
          </LessonSection>

          <LessonSection
            step={3}
            totalSteps={TOTAL_STEPS}
            label="Khoảnh khắc Aha"
          >
            <AhaMoment>
              <p>
                Thêm 1 chiều = <strong>nhân</strong> không gian, không phải{" "}
                <em>cộng</em>. Ở D = 20, thể tích hypercube gấp hypercube D = 1
                đến 10<sup>20</sup> lần với cùng cạnh. Cùng lượng data trở nên{" "}
                <strong>cực kỳ thưa</strong> — giống 100 người rải ngẫu nhiên
                trên sa mạc Sahara thay vì trong phòng học. Model cần "hàng
                xóm" để tổng quát hoá, mà ở chiều cao thì không ai còn là hàng
                xóm của ai nữa — tất cả đều cách nhau xấp xỉ √(D/6).
              </p>
            </AhaMoment>

            <Callout variant="insight" title="Hai bài toán trong một">
              Curse không phải một hiện tượng đơn lẻ: nó gom lại (1){" "}
              <strong>sparse sampling</strong> — thiếu data để phủ không gian,
              (2) <strong>distance concentration</strong> — khoảng cách mất
              phân biệt, (3) <strong>volume on the shell</strong> — thể tích
              dồn ra rìa. Mỗi thuật toán bị ảnh hưởng khác nhau, nhưng gốc rễ
              đều là hình học chiều cao phá vỡ trực giác 2D/3D của ta.
            </Callout>
          </LessonSection>

          <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
            <InlineChallenge
              question="Dataset Shopee: 10K users, 50 features → accuracy 85%. Team thêm 200 features từ click behavior → 250 features. Accuracy giảm còn 72%. Chiến lược fix ưu tiên số 1?"
              options={[
                "Tăng model complexity (thêm layers, tăng width)",
                "Feature selection (top 30–50 theo mutual information) hoặc PCA 95% variance; tiếp theo thêm L1 regularization → accuracy về 85%+",
                "Xoá toàn bộ 200 features mới, giữ 50 cũ",
              ]}
              correct={1}
              explanation="250 features / 10K samples = 1:40 — vẫn ổn cho mô hình tuyến tính, nhưng rõ ràng 200 features mới chứa nhiều noise. (1) Feature importance (gain của gradient boosting), (2) PCA → 50 components giữ 95% variance, (3) L1 Lasso tự động zero out. Xoá toàn bộ features mới là quá thô — khả năng cao có 20–30 tín hiệu tốt bên trong."
            />

            <div className="mt-4">
              <InlineChallenge
                question="kNN với k=5 trên embedding 2048-dim từ ResNet cho 1M ảnh. Query tốc độ chậm và kết quả 'hàng xóm' có vẻ không ý nghĩa. Nguyên nhân chính?"
                options={[
                  "CPU không đủ mạnh — chỉ cần mua GPU",
                  "Distance concentration ở D=2048 làm khoảng cách gần như bằng nhau + kNN O(N·D) quá chậm. Giải pháp: giảm chiều (PCA/UMAP) về ~64–128, dùng ANN (FAISS/HNSW)",
                  "k quá nhỏ, tăng k=100",
                ]}
                correct={1}
                explanation="2048-D embedding thường có concentration ratio rất nhỏ — kNN thoái hoá. Giảm chiều bằng PCA hoặc học metric (contrastive) xuống ~128-D, rồi dùng Approximate NN (FAISS IVF/HNSW) để đưa query từ O(N·D) về O(log N · D). Kết quả ý nghĩa hơn và nhanh gấp 1000 lần."
              />
            </div>
          </LessonSection>

          <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
            <ExplanationSection>
              <p>
                <strong>Curse of Dimensionality</strong> là một họ hiện tượng
                xuất hiện khi số chiều D của dữ liệu trở nên lớn so với số
                lượng mẫu N hoặc so với độ phức tạp của bài toán. Richard
                Bellman đặt tên cụm từ này năm 1961 khi nghiên cứu quy hoạch
                động. Các hiệu ứng chính:
              </p>

              <ol className="list-decimal list-inside space-y-1.5 text-sm pl-2">
                <li>
                  <strong>Data sparsity</strong>: số điểm cần để "lấp đầy" lưới{" "}
                  k<sup>D</sup> ô tăng luỹ thừa theo D.
                </li>
                <li>
                  <strong>Distance concentration</strong>: (max − min)/min → 0,
                  khoảng cách mất phân biệt.
                </li>
                <li>
                  <strong>Volume on the shell</strong>: ở hypersphere hay
                  hypercube, hầu hết thể tích nằm ở lớp vỏ mỏng.
                </li>
                <li>
                  <strong>Orthogonality</strong>: hai vector ngẫu nhiên trong R
                  <sup>D</sup> gần như vuông góc khi D lớn.
                </li>
                <li>
                  <strong>Sample complexity</strong>: mô hình cần số mẫu tăng
                  theo D để đạt cùng sai số (tuỳ class hàm).
                </li>
              </ol>

              <p className="mt-3">
                <strong>Công thức khoảng cách kỳ vọng</strong> trong hypercube
                [0,1]<sup>D</sup> với phân phối đều:
              </p>
              <LaTeX block>
                {"\\mathbb{E}[\\|X-Y\\|_2] \\approx \\sqrt{D/6}, \\quad \\operatorname{Var}[\\|X-Y\\|_2] = O(1)"}
              </LaTeX>
              <p>
                Kỳ vọng tăng như √D nhưng phương sai chỉ <em>O(1)</em>, nên hệ
                số biến thiên σ/μ giảm như 1/√D → 0. Đây là lý do histogram
                trong mô phỏng co lại thành một cột nhọn.
              </p>

              <LaTeX block>
                {"\\frac{\\max_{i,j} \\|X_i - X_j\\| - \\min_{i,j} \\|X_i - X_j\\|}{\\min_{i,j} \\|X_i - X_j\\|} \\xrightarrow{D \\to \\infty} 0"}
              </LaTeX>
              <p>
                (Beyer, Goldstein, Ramakrishnan, Shaft 1999 — "When Is Nearest
                Neighbor Meaningful?")
              </p>

              <LaTeX block>
                {"\\text{Vol(shell dày } \\epsilon\\text{)} = 1 - (1-\\epsilon)^D \\xrightarrow{D \\to \\infty} 1"}
              </LaTeX>

              <p className="mt-3">
                <strong>Giải pháp đa tầng</strong>:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>Feature Selection</strong>: mutual information,
                  chi-squared, L1 Lasso, permutation importance.
                </li>
                <li>
                  <strong>Dimensionality reduction</strong>:{" "}
                  <TopicLink slug="pca">PCA</TopicLink> giữ variance tuyến
                  tính; t-SNE/UMAP giữ cấu trúc cục bộ; autoencoder học
                  non-linear manifold.
                </li>
                <li>
                  <strong>Regularization</strong>: L1 đẩy hệ số về 0 (sparse);
                  L2 co hệ số (ổn định); Dropout hoạt động như ensemble ngẫu
                  nhiên.
                </li>
                <li>
                  <strong>Domain knowledge</strong>: feature engineering thủ
                  công vẫn thường thắng feature tự động với data nhỏ.
                </li>
                <li>
                  <strong>Tăng data</strong>: augmentation, synthetic, active
                  learning, pretraining + fine-tuning.
                </li>
                <li>
                  <strong>Mô hình phù hợp</strong>: tree-based (XGBoost,
                  LightGBM) ít nhạy với curse hơn kNN/SVM với kernel RBF.
                </li>
              </ul>

              <Callout variant="warning" title="Cảnh báo: tree-based không miễn nhiễm">
                XGBoost/LightGBM ít bị curse hơn kNN/SVM-RBF, nhưng vẫn chịu ảnh
                hưởng của <em>noise features</em>. Với 250 features trong đó 200
                là random, tree sẽ split theo noise ở các nhánh nhỏ → overfit.
                Luôn kết hợp feature importance và early stopping.
              </Callout>

              <Callout variant="info" title="Manifold hypothesis — lý do DL vẫn làm việc được">
                Dữ liệu thật (ảnh, âm thanh, văn bản) nằm trên manifold có
                dimensionality nội tại (intrinsic dim) thấp hơn nhiều so với
                dimensionality ngoại (ambient dim). Ảnh 224×224×3 có ambient =
                150K, nhưng intrinsic ≤ vài chục. CNN/Transformer học cách{" "}
                <em>"nắn"</em> manifold này xuống không gian biểu diễn (embedding)
                thấp chiều, và nhờ đó tránh được curse ở mức công cụ.
              </Callout>

              <CollapsibleDetail title="Toán: tại sao σ/μ → 0 (chứng minh sơ lược)">
                <div className="space-y-2 text-sm">
                  <p>
                    Giả sử X, Y ~ Uniform[0,1]<sup>D</sup> độc lập. Đặt Z
                    <sub>i</sub> = (X<sub>i</sub> − Y<sub>i</sub>)². Các Z
                    <sub>i</sub> độc lập, cùng phân phối, E[Z<sub>i</sub>] =
                    1/6, Var[Z<sub>i</sub>] = 7/180.
                  </p>
                  <p>
                    Tổng S<sub>D</sub> = ΣZ<sub>i</sub> có E[S<sub>D</sub>] =
                    D/6, Var[S<sub>D</sub>] = 7D/180. Theo CLT, S
                    <sub>D</sub> ≈ Normal khi D lớn, với hệ số biến thiên σ
                    <sub>S</sub>/μ<sub>S</sub> = √(7/(5D)) → 0.
                  </p>
                  <p>
                    Khoảng cách ||X − Y||<sub>2</sub> = √S<sub>D</sub>. Bằng
                    khai triển Taylor quanh μ<sub>S</sub> = D/6, ta có E[√S
                    <sub>D</sub>] ≈ √(D/6) và σ của √S<sub>D</sub> ≈ σ
                    <sub>S</sub> / (2√μ<sub>S</sub>) = O(1). Tỉ số σ/μ của
                    khoảng cách ~ 1/√D → 0.
                  </p>
                  <p>
                    Kết luận: trong chiều cao, tất cả cặp điểm nằm trên một vỏ
                    cầu mỏng bán kính √(D/6), không còn phân biệt "gần" và
                    "xa".
                  </p>
                </div>
              </CollapsibleDetail>

              <CollapsibleDetail title="Các thuật toán bị ảnh hưởng khác nhau thế nào">
                <div className="space-y-2 text-sm">
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    <li>
                      <strong>kNN</strong>: nhạy nhất. Concentration phá meaning
                      của "neighbor"; complexity O(N·D) cũng tăng.
                    </li>
                    <li>
                      <strong>k-means với Euclid</strong>: cụm không rõ ràng,
                      tâm cụm không ổn định.
                    </li>
                    <li>
                      <strong>SVM với kernel RBF</strong>: exp(−γ||x − y||²) gần
                      như hằng số khi khoảng cách tập trung.
                    </li>
                    <li>
                      <strong>Linear/Logistic regression</strong>: nhạy vừa
                      phải — cần regularization; ước lượng hệ số kém ổn định
                      khi p &gt; n.
                    </li>
                    <li>
                      <strong>Random Forest / Gradient Boosting</strong>: ít
                      nhạy với concentration (không dùng Euclid), nhưng vẫn bị
                      noise features kéo xuống.
                    </li>
                    <li>
                      <strong>Neural networks</strong>: nhờ học representation,
                      nhưng cần đủ data so với số params; underparameterized
                      regime vẫn curse.
                    </li>
                  </ul>
                  <p className="mt-2">
                    Một điểm tinh tế: không phải cứ "chiều cao" là curse xảy
                    ra. Nếu dữ liệu thực sự nằm trên một manifold có intrinsic
                    dim <em>d</em> rất nhỏ, thuật toán khoảng cách vẫn làm việc
                    được sau khi chiếu — chiều ngoại D chỉ là biểu diễn, không
                    phải bản chất. Đây là lý do học metric (contrastive,
                    triplet, ArcFace) thường đi trước kNN trong các hệ thống
                    nhận dạng khuôn mặt, tìm kiếm ảnh, retrieval.
                  </p>
                  <p>
                    Một bảng so sánh ngắn để dễ nhớ mức độ nhạy cảm với
                    curse (5 sao = rất nhạy, 1 sao = ít nhạy):
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    <li>kNN / LOF / DBSCAN với Euclid — ★★★★★</li>
                    <li>k-means (Lloyd) — ★★★★☆</li>
                    <li>Gaussian Mixture EM — ★★★★☆</li>
                    <li>SVM kernel RBF (γ không điều chỉnh) — ★★★★☆</li>
                    <li>Logistic / Linear regression (không reg) — ★★★☆☆</li>
                    <li>SVM kernel tuyến tính — ★★☆☆☆</li>
                    <li>Random Forest / GBM — ★★☆☆☆</li>
                    <li>CNN / ResNet (dữ liệu thật) — ★★☆☆☆</li>
                    <li>Transformer (đủ data) — ★☆☆☆☆</li>
                  </ul>
                </div>
              </CollapsibleDetail>

              <CodeBlock
                language="python"
                title="Pipeline thực chiến: feature selection + PCA + L2 cho tabular lớn"
              >
                {`import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import VarianceThreshold, SelectKBest, f_classif
from sklearn.decomposition import PCA
from sklearn.linear_model import LogisticRegression


def build_pipeline(n_top_features: int = 100, pca_variance: float = 0.95) -> Pipeline:
    """Pipeline 4 tầng chống curse of dimensionality."""
    return Pipeline([
        # 1) bỏ features có variance gần 0 (hằng số, noise tinh)
        ("var", VarianceThreshold(threshold=1e-4)),
        # 2) chuẩn hoá trước PCA — bắt buộc, nếu không scale khác nhau sẽ sai lệch
        ("scaler", StandardScaler()),
        # 3) univariate filter — chọn top_k theo F-statistic
        ("select", SelectKBest(f_classif, k=n_top_features)),
        # 4) PCA giữ tỉ lệ variance mong muốn
        ("pca", PCA(n_components=pca_variance, random_state=0)),
        # 5) mô hình tuyến tính có L2
        ("clf", LogisticRegression(C=1.0, max_iter=3000)),
    ])


def benchmark(X: np.ndarray, y: np.ndarray) -> pd.DataFrame:
    """Đo accuracy trên 5-fold cross-validation cho nhiều cấu hình."""
    configs = [
        ("raw",       LogisticRegression(max_iter=3000)),
        ("top50",     build_pipeline(50, 1.0)),          # bỏ PCA
        ("top100",    build_pipeline(100, 1.0)),
        ("pca95",     build_pipeline(9999, 0.95)),
        ("top100+pca",build_pipeline(100, 0.95)),
    ]
    rows = []
    cv = StratifiedKFold(5, shuffle=True, random_state=0)
    for name, est in configs:
        scores = cross_val_score(est, X, y, cv=cv, n_jobs=-1)
        rows.append({"config": name, "mean": scores.mean(), "std": scores.std()})
    return pd.DataFrame(rows)


if __name__ == "__main__":
    from sklearn.datasets import make_classification
    X, y = make_classification(
        n_samples=10_000, n_features=500, n_informative=30,
        n_redundant=50, random_state=42,
    )
    print(benchmark(X, y).to_string(index=False))`}
              </CodeBlock>

              <Callout variant="tip" title="Khi nào nên bỏ qua PCA">
                PCA không phải lúc nào cũng giúp. Nó giữ hướng{" "}
                <em>variance lớn</em>, không phải hướng{" "}
                <em>discriminative</em>. Nếu lớp trộn theo hướng variance nhỏ,
                PCA có thể làm giảm accuracy. Với classification, hãy thử LDA
                (Linear Discriminant Analysis) hoặc supervised dim reduction
                (PLS, NCA) trước khi mặc định chọn PCA.
              </Callout>

              <CodeBlock
                language="python"
                title="Đo intrinsic dimension bằng Two-NN (Facco et al. 2017)"
              >
                {`import numpy as np
from sklearn.neighbors import NearestNeighbors


def two_nn_intrinsic_dim(X: np.ndarray) -> float:
    """
    Ước lượng intrinsic dimension của dataset bằng tỉ số 2 nearest-neighbors.
    Nếu intrinsic dim << ambient dim thì curse thực tế nhẹ hơn nhiều so với
    D ambient.

    Tham khảo: Facco, d'Errico, Rodriguez, Laio (2017).
    """
    nn = NearestNeighbors(n_neighbors=3).fit(X)
    dists, _ = nn.kneighbors(X)
    r1 = dists[:, 1]                       # nearest
    r2 = dists[:, 2]                       # second nearest
    mu = r2 / np.clip(r1, 1e-12, None)     # tỉ số r2/r1
    # loại bỏ ngoại lệ (mu == 1 do duplicate)
    mu = mu[mu > 1 + 1e-8]
    n = len(mu)
    # rank order
    ranks = np.argsort(np.argsort(mu))     # F(mu_i) = (i+1)/n
    F = (ranks + 1) / (n + 1)
    # linear fit: log(mu) vs -log(1-F), slope = intrinsic dim
    x = np.log(mu)
    y = -np.log(1 - F)
    slope = np.sum(x * y) / np.sum(x * x)
    return float(slope)


if __name__ == "__main__":
    rng = np.random.default_rng(0)
    # Dataset: 1000 điểm trên một đường cong (intrinsic dim ≈ 1)
    t = rng.uniform(0, 2 * np.pi, size=1000)
    noise = 0.01 * rng.standard_normal((1000, 50))
    X = np.stack([np.cos(t), np.sin(t)] + [np.zeros_like(t)] * 48, axis=1) + noise
    print(f"ambient dim = {X.shape[1]}, intrinsic dim ≈ {two_nn_intrinsic_dim(X):.2f}")
    # Kỳ vọng: ambient = 50, intrinsic ≈ 1.0`}
              </CodeBlock>

              <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-sm">
                <p className="font-semibold text-foreground">
                  Glossary — thuật ngữ hay gặp
                </p>
                <p>
                  <strong>Ambient dimension</strong> (D): số chiều của không
                  gian chứa dữ liệu (VD: pixel count của ảnh, 150K cho
                  224×224×3).
                </p>
                <p>
                  <strong>Intrinsic dimension</strong> (d): số chiều của
                  manifold mà dữ liệu thật sự sống trên đó. Luôn ≤ D, thường
                  ≪ D. Ảnh khuôn mặt tự nhiên có intrinsic dim chỉ khoảng vài
                  chục, dù ambient = 150K.
                </p>
                <p>
                  <strong>Distance concentration</strong>: hiện tượng
                  (max − min)/mean của khoảng cách pairwise → 0 khi D → ∞. Bản
                  chất là hệ số biến thiên σ/μ ~ 1/√D.
                </p>
                <p>
                  <strong>Hubness</strong>: ở chiều cao, một vài điểm trở
                  thành "hub" — xuất hiện trong k-NN list của rất nhiều điểm
                  khác, làm sai lệch retrieval. Xem Radovanović et al. (2010).
                </p>
                <p>
                  <strong>p ≫ n</strong>: chế độ số features lớn hơn số
                  samples. Ước lượng OLS không xác định; cần regularization
                  (L1/L2) hoặc bayesian prior.
                </p>
                <p>
                  <strong>Blessing of dimensionality</strong>: hiện tượng đối
                  nghịch — ở chiều rất cao, concentration of measure làm một
                  số thuật toán ngẫu nhiên trở nên đơn giản. VD:
                  Johnson–Lindenstrauss cho phép random projection giữ khoảng
                  cách trong sai số (1 ± ε) với chỉ O(log N / ε²) chiều, bất
                  kể D ban đầu.
                </p>
                <p>
                  <strong>Manifold hypothesis</strong>: giả thuyết rằng dữ
                  liệu tự nhiên không lan toả đều trong R<sup>D</sup>, mà tập
                  trung trên một submanifold có intrinsic dim thấp. Đây là nền
                  tảng của representation learning hiện đại.
                </p>
                <p>
                  <strong>Isotropic / anisotropic</strong>: phân phối
                  isotropic có cùng variance mọi hướng (như Gaussian chuẩn);
                  anisotropic có cấu trúc — đây là nơi PCA/autoencoder tìm
                  được hướng có ý nghĩa.
                </p>
                <p>
                  <strong>Concentration of measure</strong>: định lý tổng quát
                  (Talagrand, Ledoux) nói rằng các hàm Lipschitz trên không
                  gian chiều cao tập trung quanh kỳ vọng của chúng với xác
                  suất cao. Đây là nguồn gốc toán học của distance
                  concentration.
                </p>
                <p>
                  <strong>Johnson–Lindenstrauss lemma</strong>: với bất kỳ tập
                  N điểm trong R<sup>D</sup>, tồn tại phép chiếu xuống R
                  <sup>k</sup> với k = O(log N / ε²) bảo toàn mọi khoảng cách
                  cặp trong sai số (1 ± ε). Kết quả: random projection là công
                  cụ giảm chiều cực rẻ.
                </p>
                <p>
                  <strong>Doubly-stochastic embedding</strong>: nhóm kỹ thuật
                  (t-SNE, UMAP, TriMap) biến khoảng cách → xác suất láng
                  giềng, rồi tối ưu cross-entropy giữa hai phân phối xác
                  suất — đặc biệt giữ cấu trúc cục bộ khi trực quan hoá 2D/3D.
                </p>
              </div>

              <p className="mt-4">
                Để hiểu sâu hơn về một giải pháp cốt lõi — giảm chiều tuyến
                tính tối ưu theo nghĩa variance — hãy xem{" "}
                <TopicLink slug="pca">
                  Principal Component Analysis
                </TopicLink>
                . Cho feature engineering thủ công, tham khảo{" "}
                <TopicLink slug="feature-engineering">
                  Feature Engineering
                </TopicLink>
                . Curse cũng gắn liền với{" "}
                <TopicLink slug="overfitting-underfitting">
                  overfitting vs underfitting
                </TopicLink>
                .
              </p>

              <p className="mt-3">
                <strong>Checklist triển khai thực tế</strong>. Khi nhận một
                bài toán tabular với p ≫ n hoặc p ≈ n/10, hãy lần lượt:
              </p>
              <ol className="list-decimal list-inside space-y-1 pl-2 text-sm">
                <li>
                  Kiểm tra phân phối variance từng feature; bỏ features gần
                  hằng số bằng <code>VarianceThreshold</code>.
                </li>
                <li>
                  Chuẩn hoá (StandardScaler hoặc RobustScaler nếu có outlier).
                </li>
                <li>
                  Đánh giá correlation matrix; gộp hoặc bỏ features collinear
                  (|r| &gt; 0.95).
                </li>
                <li>
                  Chạy mô hình tuyến tính đơn giản có L2 làm baseline; ghi lại
                  CV score.
                </li>
                <li>
                  Thử feature selection: L1 Lasso, mutual information, hoặc
                  tree-based importance.
                </li>
                <li>
                  Thử PCA 95% variance và kernel PCA cho phi tuyến; so sánh
                  với baseline.
                </li>
                <li>
                  Nếu data có cấu trúc (chuỗi thời gian, ảnh, graph), dùng
                  mô hình chuyên biệt thay vì tabular ML + tiền xử lý.
                </li>
                <li>
                  Cuối cùng, đánh giá intrinsic dimension để biết giới hạn
                  thực tế của bài toán.
                </li>
              </ol>

              <p className="mt-3">
                <strong>Sai lầm thường gặp của người mới.</strong> (1) Cho
                rằng "cứ thêm feature là tốt" — bỏ qua hiện tượng tiêu cực ở
                p ≫ n. (2) PCA trước khi chuẩn hoá — scale lệch sẽ sinh
                component vô nghĩa. (3) Chỉ dùng train accuracy để so sánh —
                curse làm overfit trên train trở nên tinh vi, phải dựa vào
                cross-validation hoặc hold-out. (4) Bỏ qua domain knowledge —
                một vài feature thiết kế thủ công tốt thường thắng 100 feature
                tự động ở dataset nhỏ. (5) Dùng kNN hoặc k-means trên
                embedding cao chiều chưa chuẩn hoá — hubness sẽ khiến kết quả
                lệch nghiêm trọng.
              </p>

              <p className="mt-3">
                <strong>Khi nào thực sự cần lo lắng?</strong> Ratio n/p là
                một heuristic đơn giản: n/p &gt; 20 thường an toàn cho mô hình
                tuyến tính có regularization; n/p &gt; 100 an toàn cho hầu
                hết mô hình; n/p &lt; 5 cần kỹ thuật đặc biệt (Bayesian,
                meta-learning, transfer learning). Nhớ rằng "p" ở đây là số
                features <em>hiệu dụng</em> sau khi tính đến correlation —
                nếu 200 feature thực chất là 20 nhóm collinear, p_hiệu_dụng
                chỉ khoảng 20.
              </p>
            </ExplanationSection>
          </LessonSection>

          <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
            <MiniSummary
              points={[
                "Curse of dimensionality = nhiều features + ít data → không gian sparse → model overfit trên noise, accuracy GIẢM thay vì tăng.",
                "Thêm 1 chiều = NHÂN thể tích (luỹ thừa). Ở D = 100, 99.997% thể tích hypercube nằm trong lớp vỏ ngoài dày 10% — lõi gần như rỗng.",
                "Distance concentration: E[||X−Y||] ≈ √(D/6), σ/μ ~ 1/√D → 0. Ở D lớn, max/min khoảng cách gần như bằng nhau — kNN & clustering bằng Euclid thoái hoá.",
                "Rule of thumb: 10–20 samples per feature cho mô hình tuyến tính. 100 features → cần ít nhất 1K–2K samples để ước lượng hệ số ổn định.",
                "Giải pháp đa tầng: Feature Selection (MI, L1), PCA / autoencoder, L1/L2 regularization, augmentation, pretraining + fine-tune, chọn mô hình ít nhạy với khoảng cách (tree-based).",
                "Deep learning không miễn nhiễm, nhưng nhờ manifold hypothesis (ảnh thật chỉ sống trên manifold thấp chiều) và học representation tự động, DL giảm nhẹ curse trong thực tế — miễn là đủ data so với số tham số.",
              ]}
            />
          </LessonSection>

          <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
            <QuizSection questions={quizQuestions} />
          </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
