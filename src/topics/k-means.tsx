"use client";

import {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
  MiniSummary,
  CodeBlock,
  ToggleCompare,
  LessonSection,
  TopicLink,
  LaTeX,
  CollapsibleDetail,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

/* ──────────────────────────────────────────────────────────────
 * METADATA — giữ nguyên so với bản gốc. Các route, breadcrumb và
 * progress tracker của hệ thống đọc từ đây, đổi slug sẽ làm gãy
 * liên kết nội bộ và bookmark người dùng.
 * ────────────────────────────────────────────────────────────── */
export const metadata: TopicMeta = {
  slug: "k-means",
  title: "K-Means Clustering",
  titleVi: "Phân cụm K-Means",
  description:
    "Chia dữ liệu thành K cụm dựa trên khoảng cách đến tâm cụm",
  category: "classic-ml",
  tags: ["clustering", "unsupervised-learning"],
  difficulty: "beginner",
  relatedSlugs: ["dbscan", "knn", "pca"],
  vizType: "interactive",
};

/* ──────────────────────────────────────────────────────────────
 * TYPES
 * ────────────────────────────────────────────────────────────── */
type Pt = { x: number; y: number };

type Phase = "place" | "assigned" | "moved" | "converged";

type ElbowPoint = {
  k: number;
  inertia: number;
};

/* ──────────────────────────────────────────────────────────────
 * HẰNG SỐ
 * Canvas 420×360 vừa vặn trên desktop mà vẫn đọc tốt trên mobile.
 * Cụm “xa” ở (320, 80), cụm “gần” ở (100, 100), cụm “dưới” ở
 * (220, 270) — 3 cụm cách nhau đủ rõ để elbow method thấy k=3.
 * ────────────────────────────────────────────────────────────── */
const CANVAS_W = 420;
const CANVAS_H = 360;
const K_VIZ = 3;
const MAX_ITER = 25;

const COLORS = [
  "#3b82f6", // cụm 0 — xanh dương
  "#ef4444", // cụm 1 — đỏ
  "#22c55e", // cụm 2 — xanh lá
  "#a855f7", // cụm 3 — tím (cho elbow demo k≥4)
  "#f59e0b", // cụm 4 — cam
  "#06b6d4", // cụm 5 — cyan
  "#ec4899", // cụm 6 — hồng
  "#84cc16", // cụm 7 — lime
  "#eab308", // cụm 8 — vàng
  "#14b8a6", // cụm 9 — teal
];

const COLOR_NAMES = [
  "xanh dương",
  "đỏ",
  "xanh lá",
  "tím",
  "cam",
  "cyan",
  "hồng",
  "lime",
  "vàng",
  "teal",
];

/* ──────────────────────────────────────────────────────────────
 * DỮ LIỆU — 30 điểm, 3 cụm tự nhiên
 * Mỗi cụm 10 điểm, phân bố quanh centroid thật. Dùng seed tĩnh
 * (không random) để mọi lần mount đều giống nhau — tốt cho
 * trải nghiệm học và test visual.
 * ────────────────────────────────────────────────────────────── */
const DATA: Pt[] = [
  // Cụm 1 — góc trên trái, quanh (100, 100)
  { x: 85, y: 92 },
  { x: 110, y: 84 },
  { x: 96, y: 115 },
  { x: 122, y: 102 },
  { x: 78, y: 108 },
  { x: 113, y: 128 },
  { x: 92, y: 75 },
  { x: 128, y: 118 },
  { x: 70, y: 96 },
  { x: 104, y: 140 },
  // Cụm 2 — góc trên phải, quanh (320, 80)
  { x: 298, y: 72 },
  { x: 322, y: 90 },
  { x: 310, y: 58 },
  { x: 340, y: 78 },
  { x: 302, y: 96 },
  { x: 328, y: 66 },
  { x: 345, y: 94 },
  { x: 292, y: 84 },
  { x: 314, y: 104 },
  { x: 354, y: 82 },
  // Cụm 3 — giữa dưới, quanh (220, 270)
  { x: 192, y: 255 },
  { x: 218, y: 278 },
  { x: 206, y: 262 },
  { x: 232, y: 290 },
  { x: 196, y: 284 },
  { x: 224, y: 260 },
  { x: 178, y: 272 },
  { x: 242, y: 272 },
  { x: 210, y: 248 },
  { x: 234, y: 302 },
];

/* ──────────────────────────────────────────────────────────────
 * HELPER FUNCTIONS — toán học cơ bản tách riêng để test dễ và
 * giúp người đọc map với công thức LaTeX trong phần giải thích.
 * ────────────────────────────────────────────────────────────── */
function dist(a: Pt, b: Pt) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function distSq(a: Pt, b: Pt) {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

function assign(pts: Pt[], centroids: Pt[]) {
  return pts.map((p) => {
    let best = 0;
    let minD = Infinity;
    centroids.forEach((c, i) => {
      const d = distSq(p, c);
      if (d < minD) {
        minD = d;
        best = i;
      }
    });
    return best;
  });
}

function recompute(pts: Pt[], asgn: number[], centroids: Pt[]) {
  return centroids.map((c, ci) => {
    const members = pts.filter((_, pi) => asgn[pi] === ci);
    if (!members.length) return c;
    return {
      x: members.reduce((s, p) => s + p.x, 0) / members.length,
      y: members.reduce((s, p) => s + p.y, 0) / members.length,
    };
  });
}

/**
 * Inertia — tổng bình phương khoảng cách từ mỗi điểm đến tâm
 * cụm của nó. Đây chính là hàm mục tiêu K-Means tối thiểu hóa.
 * Thuật ngữ khác: Within-Cluster Sum of Squares (WCSS).
 */
function inertia(pts: Pt[], centroids: Pt[]) {
  if (centroids.length === 0) return 0;
  return pts.reduce(
    (sum, p) =>
      sum + Math.min(...centroids.map((c) => distSq(p, c))),
    0
  );
}

/**
 * Tổng khoảng cách (không bình phương) — dùng cho overlay chữ
 * vì số nhỏ hơn, dễ đọc. Không phải hàm mục tiêu thực sự của
 * K-Means nhưng biến thiên cùng chiều với inertia.
 */
function totalDistance(pts: Pt[], centroids: Pt[]) {
  if (centroids.length === 0) return 0;
  return pts.reduce(
    (sum, p) => sum + Math.min(...centroids.map((c) => dist(p, c))),
    0
  );
}

/**
 * Khởi tạo random "ngây thơ" — chỉ dùng để so sánh với k-means++.
 * Dùng Math.seedrandom không khả dụng, ta dùng một RNG LCG đơn
 * giản dựa trên seed để tái lập được.
 */
function makeSeededRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

/**
 * K-Means++ initialization — chọn tâm đầu tiên ngẫu nhiên, các
 * tâm sau được chọn với xác suất tỷ lệ với D(x)² để cách xa tâm
 * đã chọn. Giúp hội tụ nhanh và tránh rơi vào nghiệm xấu.
 */
function kMeansPlusPlusInit(pts: Pt[], k: number, seed: number): Pt[] {
  const rng = makeSeededRng(seed);
  const first = pts[Math.floor(rng() * pts.length)];
  const out: Pt[] = [first];
  while (out.length < k) {
    const d2 = pts.map((p) =>
      Math.min(...out.map((c) => distSq(p, c)))
    );
    const total = d2.reduce((s, v) => s + v, 0);
    if (total === 0) {
      out.push(pts[Math.floor(rng() * pts.length)]);
      continue;
    }
    let r = rng() * total;
    for (let i = 0; i < pts.length; i++) {
      r -= d2[i];
      if (r <= 0) {
        out.push(pts[i]);
        break;
      }
    }
  }
  return out;
}

/**
 * Chạy K-Means tới khi hội tụ, trả về inertia cuối cùng.
 * Dùng cho đồ thị Elbow (k = 1 → 10). Lặp tối đa MAX_ITER để
 * tránh infinite loop trong trường hợp dữ liệu oscillate.
 */
function runToConvergence(pts: Pt[], k: number, seed: number) {
  let cs = kMeansPlusPlusInit(pts, k, seed);
  for (let i = 0; i < MAX_ITER; i++) {
    const a = assign(pts, cs);
    const next = recompute(pts, a, cs);
    const moved = next.every((c, ci) => dist(c, cs[ci]) < 0.5);
    cs = next;
    if (moved) break;
  }
  return { centroids: cs, inertia: inertia(pts, cs) };
}

/* ──────────────────────────────────────────────────────────────
 * SUB-COMPONENTS
 * Tách riêng để main component gọn, dễ đọc, và các demo phụ
 * (ToggleCompare, Elbow plot) có thể tái sử dụng logic.
 * ────────────────────────────────────────────────────────────── */

/** Centroid cross marker — dấu X cách điệu cho dễ phân biệt với điểm dữ liệu */
function Cross({ c, color, size = 8 }: { c: Pt; color: string; size?: number }) {
  return (
    <g>
      <line x1={c.x - size} y1={c.y - size} x2={c.x + size} y2={c.y + size} stroke={color} strokeWidth={3} />
      <line x1={c.x + size} y1={c.y - size} x2={c.x - size} y2={c.y + size} stroke={color} strokeWidth={3} />
      <circle cx={c.x} cy={c.y} r={3} fill="#fff" />
    </g>
  );
}

/** Auto-animated demo cho ToggleCompare — hội tụ tự động */
function InitDemo({ startCentroids }: { startCentroids: Pt[] }) {
  const [centroids, setCentroids] = useState(startCentroids);
  const [iter, setIter] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let i = 0;
    let curr = startCentroids;
    setCentroids(startCentroids);
    setIter(0);
    ref.current = setInterval(() => {
      const a = assign(DATA, curr);
      const next = recompute(DATA, a, curr);
      const done =
        next.every((c, ci) => dist(c, curr[ci]) < 0.5) || i > 15;
      curr = next;
      i++;
      setCentroids(next);
      setIter(i);
      if (done && ref.current) clearInterval(ref.current);
    }, 900);
    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, [startCentroids]);

  const asgn = assign(DATA, centroids);
  return (
    <svg viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} className="w-full rounded-lg border border-border bg-background">
      {DATA.map((p, i) => (
        <line key={`l${i}`} x1={p.x} y1={p.y} x2={centroids[asgn[i]].x} y2={centroids[asgn[i]].y}
          stroke={COLORS[asgn[i]]} strokeWidth={0.7} opacity={0.25} />
      ))}
      {DATA.map((p, i) => (
        <circle key={`p${i}`} cx={p.x} cy={p.y} r={5} fill={COLORS[asgn[i]]} stroke="#fff" strokeWidth={1} />
      ))}
      {centroids.map((c, i) => <Cross key={`c${i}`} c={c} color={COLORS[i]} />)}
      <text x={10} y={20} fontSize={12} fill="currentColor" className="text-foreground" fontWeight={600}>
        Vòng lặp: {iter}
      </text>
      <text x={10} y={38} fontSize={11} fill="currentColor" className="text-muted">
        Inertia: {inertia(DATA, centroids).toFixed(0)}
      </text>
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────
 * ELBOW PLOT — chạy K-Means cho k = 1 → 10 rồi vẽ inertia
 * Điểm "khuỷu tay" là k tối ưu. Trong dữ liệu của chúng ta, 3
 * cụm tự nhiên → elbow xuất hiện tại k = 3.
 * ────────────────────────────────────────────────────────────── */
function ElbowPlot() {
  const [selectedK, setSelectedK] = useState(3);

  // Tính inertia cho k = 1 → 10. useMemo vì phép tính chỉ phụ thuộc
  // hằng số DATA; chỉ chạy một lần khi component mount.
  const points: ElbowPoint[] = useMemo(() => {
    const out: ElbowPoint[] = [];
    for (let k = 1; k <= 10; k++) {
      const { inertia } = runToConvergence(DATA, k, 42 + k);
      out.push({ k, inertia });
    }
    return out;
  }, []);

  const maxIn = points[0]?.inertia ?? 1;
  const minIn = points[points.length - 1]?.inertia ?? 0;

  // Tọa độ SVG cho plot
  const PW = 420;
  const PH = 240;
  const PADL = 48;
  const PADR = 20;
  const PADT = 20;
  const PADB = 36;

  const xScale = (k: number) =>
    PADL + ((k - 1) * (PW - PADL - PADR)) / 9;
  const yScale = (v: number) => {
    if (maxIn === minIn) return PADT;
    return (
      PADT +
      ((maxIn - v) / (maxIn - minIn)) * (PH - PADT - PADB)
    );
    // Lưu ý: đã đảo trục — inertia lớn ở trên, nhỏ ở dưới
  };

  const pathD = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${xScale(p.k)} ${yScale(p.inertia)}`
    )
    .join(" ");

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-border bg-card p-3">
        <svg viewBox={`0 0 ${PW} ${PH}`} className="w-full">
          {/* Lưới ngang */}
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
            const y = PADT + t * (PH - PADT - PADB);
            return (
              <line key={`g${i}`} x1={PADL} y1={y} x2={PW - PADR} y2={y}
                stroke="#e2e8f0" strokeDasharray="2,3" strokeWidth={1} className="dark:stroke-slate-700" />
            );
          })}

          {/* Đường cong inertia */}
          <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

          {/* Chấm dữ liệu */}
          {points.map((p) => (
            <g key={`pt-${p.k}`}>
              <circle cx={xScale(p.k)} cy={yScale(p.inertia)}
                r={p.k === selectedK ? 7 : 5} fill={p.k === selectedK ? "#ef4444" : "#3b82f6"}
                stroke="#fff" strokeWidth={2} onClick={() => setSelectedK(p.k)} style={{ cursor: "pointer" }} />
              <text x={xScale(p.k)} y={PH - 18} textAnchor="middle" fontSize={10} fill="#64748b">
                k={p.k}
              </text>
            </g>
          ))}

          {/* Vạch đánh dấu “khuỷu tay” */}
          <line x1={xScale(3)} y1={PADT} x2={xScale(3)} y2={PH - PADB}
            stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4,4" />
          <text x={xScale(3) + 6} y={PADT + 12} fontSize={10} fill="#f59e0b" fontWeight={600}>
            Elbow tại k = 3
          </text>

          {/* Nhãn trục */}
          <text x={PADL} y={PADT - 6} fontSize={10} fill="#94a3b8" fontWeight={500}>
            Inertia (WCSS)
          </text>
          <text x={PW / 2} y={PH - 4} textAnchor="middle" fontSize={10} fill="#94a3b8">
            Số cụm K
          </text>
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs uppercase text-muted">K đang chọn</p>
          <p className="mt-1 text-xl font-bold text-foreground">
            {selectedK}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs uppercase text-muted">Inertia</p>
          <p className="mt-1 text-xl font-bold text-foreground">
            {points[selectedK - 1].inertia.toFixed(0)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs uppercase text-muted">Giảm so với K−1</p>
          <p className="mt-1 text-xl font-bold text-foreground">
            {selectedK === 1
              ? "—"
              : `-${(
                  ((points[selectedK - 2].inertia -
                    points[selectedK - 1].inertia) /
                    points[selectedK - 2].inertia) *
                  100
                ).toFixed(0)}%`}
          </p>
        </div>
      </div>

      <p className="text-xs text-muted">
        Nhấn vào chấm bất kỳ để xem inertia tại K đó. Chú ý độ dốc: từ
        K=1 → K=3 giảm mạnh, sau K=3 giảm rất chậm — đó là “khuỷu tay”,
        chỉ điểm K tối ưu của dataset này.
      </p>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
 * QUIZ — 8 câu
 * ────────────────────────────────────────────────────────────── */
const QUIZ: QuizQuestion[] = [
  {
    question: "K-Means thuộc loại học máy nào?",
    options: [
      "Học có giám sát (Supervised Learning)",
      "Học không giám sát (Unsupervised Learning)",
      "Học tăng cường (Reinforcement Learning)",
    ],
    correct: 1,
    explanation:
      "K-Means là thuật toán phân cụm không giám sát — dữ liệu không có nhãn, thuật toán tự tìm cấu trúc nhóm.",
  },
  {
    question: 'Trong mỗi vòng lặp K-Means, bước "Cập nhật tâm" làm gì?',
    options: [
      "Xóa tâm cụm có ít điểm nhất",
      "Di chuyển tâm đến trung bình các điểm trong cụm",
      "Di chuyển tâm đến điểm dữ liệu gần nhất",
    ],
    correct: 1,
    explanation:
      "Tâm cụm (centroid) được cập nhật bằng cách tính trung bình tọa độ của tất cả điểm thuộc cụm đó — chính xác là gradient đóng của hàm inertia.",
  },
  {
    question: "K-Means++ cải tiến gì so với K-Means gốc?",
    options: [
      "Tự động chọn số cụm K tối ưu",
      "Khởi tạo tâm cụm thông minh hơn, tránh đặt gần nhau",
      "Dùng khoảng cách Manhattan thay vì Euclidean",
    ],
    correct: 1,
    explanation:
      "K-Means++ chọn tâm ban đầu với xác suất tỷ lệ D(x)², ưu tiên điểm xa các tâm đã chọn. Giúp hội tụ nhanh hơn và gần như luôn tránh được nghiệm xấu cục bộ.",
  },
  {
    type: "fill-blank",
    question:
      "K-Means gán mỗi điểm dữ liệu vào cụm có {blank} gần nhất, sau đó cập nhật tâm cụm bằng cách tính {blank} tọa độ các điểm trong cụm.",
    blanks: [
      { answer: "tâm cụm", accept: ["centroid", "tâm"] },
      { answer: "trung bình", accept: ["mean", "giá trị trung bình"] },
    ],
    explanation:
      "Hai bước lặp cốt lõi của K-Means: (1) gán điểm đến tâm cụm gần nhất, (2) cập nhật tâm bằng trung bình các điểm trong cụm.",
  },
  {
    question:
      "Dữ liệu của bạn có 4 cụm tự nhiên nhưng bạn chạy K-Means với K=2. Chuyện gì sẽ xảy ra?",
    options: [
      "Thuật toán báo lỗi và dừng",
      "Hai cụm tự nhiên gần nhau sẽ bị gộp lại thành một cụm K-Means",
      "K-Means sẽ tự tăng K lên 4",
      "Kết quả không xác định",
    ],
    correct: 1,
    explanation:
      "K-Means luôn trả về đúng K cụm. Nếu K nhỏ hơn số cụm tự nhiên, các cụm gần nhau bị gộp; inertia sẽ cao rõ rệt — đây cũng là tín hiệu để dùng Elbow method tìm K phù hợp.",
  },
  {
    question: "Phương pháp Elbow chọn K thế nào?",
    options: [
      "Chọn K có inertia thấp nhất",
      "Chọn K mà từ đó trở đi inertia giảm rất chậm — điểm 'khuỷu tay' trên đường cong",
      "Chọn K bằng căn bậc hai của số điểm dữ liệu",
      "Chọn K = 3 cho mọi dataset",
    ],
    correct: 1,
    explanation:
      "Inertia luôn giảm khi K tăng (K = n thì inertia = 0). Elbow method tìm K nơi 'phần thưởng' từ việc thêm cụm bắt đầu giảm — đồ thị chuyển từ dốc mạnh sang thoải.",
  },
  {
    question:
      "Tại sao K-Means không phù hợp cho dữ liệu có cụm hình nguyệt (crescent-shaped)?",
    options: [
      "Thuật toán quá chậm",
      "K-Means giả định cụm hình cầu (isotropic); nó chia theo Voronoi tuyến tính",
      "K-Means cần nhãn",
      "K-Means chỉ chạy cho dữ liệu 2D",
    ],
    correct: 1,
    explanation:
      "K-Means tối thiểu bình phương khoảng cách Euclidean → biên phân cụm là siêu phẳng Voronoi → chỉ bắt được cụm hình cầu/elip. Với cụm cong, dùng DBSCAN hoặc Spectral Clustering.",
  },
  {
    question:
      "Bạn chạy K-Means 5 lần với 5 seed khác nhau và thu được 5 kết quả khác nhau (inertia dao động). Nên làm gì?",
    options: [
      "Luôn chọn kết quả của seed đầu tiên",
      "Chạy nhiều lần (n_init ≥ 10) và chọn kết quả có inertia thấp nhất",
      "Tăng learning rate",
      "Tăng K lên gấp đôi",
    ],
    correct: 1,
    explanation:
      "Lloyd's algorithm chỉ đảm bảo hội tụ tới cực tiểu địa phương. Scikit-learn mặc định n_init=10 và trả về nghiệm tốt nhất — chiến lược chuẩn trong thực tế.",
  },
];

/* ══════════════════════════════════════════════════════════════
 * MAIN COMPONENT
 * ══════════════════════════════════════════════════════════════ */
export default function KMeansTopic() {
  /* ─────────── State cho iteration tương tác ─────────── */
  const [centroids, setCentroids] = useState<Pt[]>([]);
  const [phase, setPhase] = useState<Phase>("place");
  const [iteration, setIteration] = useState(0);
  const [history, setHistory] = useState<number[]>([]); // lịch sử inertia

  /* ─────────── Auto mode — K-Means chạy một phát ─────────── */
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const asgn = useMemo(
    () =>
      centroids.length === K_VIZ
        ? assign(DATA, centroids)
        : [],
    [centroids]
  );
  const currInertia = useMemo(
    () =>
      centroids.length === K_VIZ
        ? inertia(DATA, centroids)
        : Infinity,
    [centroids]
  );
  const currDist = useMemo(
    () =>
      centroids.length === K_VIZ
        ? totalDistance(DATA, centroids)
        : Infinity,
    [centroids]
  );

  /* ─────────── Handlers ─────────── */
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (phase !== "place" || centroids.length >= K_VIZ) return;
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const x =
        ((e.clientX - rect.left) * CANVAS_W) / rect.width;
      const y =
        ((e.clientY - rect.top) * CANVAS_H) / rect.height;
      setCentroids((prev) => [...prev, { x, y }]);
    },
    [phase, centroids.length]
  );

  const handleAssign = useCallback(() => {
    setPhase("assigned");
    setIteration((i) => i + 1);
    setHistory((h) => [...h, inertia(DATA, centroids)]);
  }, [centroids]);

  const handleMove = useCallback(() => {
    const next = recompute(DATA, asgn, centroids);
    setCentroids(next);
    const moved = next.every((c, ci) => dist(c, centroids[ci]) < 1);
    setPhase(moved ? "converged" : "moved");
  }, [asgn, centroids]);

  const handleIterate = useCallback(() => {
    setPhase("assigned");
    setIteration((i) => i + 1);
    setHistory((h) => [...h, inertia(DATA, centroids)]);
  }, [centroids]);

  const handleReset = useCallback(() => {
    setCentroids([]);
    setPhase("place");
    setIteration(0);
    setHistory([]);
    if (autoRef.current) {
      clearInterval(autoRef.current);
      autoRef.current = null;
    }
    setIsAutoRunning(false);
  }, []);

  const handleKMeansPlusPlus = useCallback(() => {
    const cs = kMeansPlusPlusInit(DATA, K_VIZ, Date.now() & 0xffff);
    setCentroids(cs);
    setPhase("place");
    setIteration(0);
    setHistory([]);
  }, []);

  const handleAutoRun = useCallback(() => {
    if (centroids.length !== K_VIZ) return;
    setIsAutoRunning(true);
    let curr = centroids;
    let i = iteration;
    autoRef.current = setInterval(() => {
      const a = assign(DATA, curr);
      const next = recompute(DATA, a, curr);
      const done =
        next.every((c, ci) => dist(c, curr[ci]) < 0.5) ||
        i > MAX_ITER;
      curr = next;
      i++;
      setCentroids(next);
      setIteration(i);
      setHistory((h) => [...h, inertia(DATA, next)]);
      if (done && autoRef.current) {
        clearInterval(autoRef.current);
        autoRef.current = null;
        setIsAutoRunning(false);
        setPhase("converged");
      }
    }, 700);
  }, [centroids, iteration]);

  // Dọn interval khi unmount
  useEffect(() => {
    return () => {
      if (autoRef.current) clearInterval(autoRef.current);
    };
  }, []);

  /* ─────────── Preset centroid cho ToggleCompare ─────────── */
  const goodInit = useMemo<Pt[]>(
    () => [
      { x: 95, y: 95 },
      { x: 320, y: 80 },
      { x: 220, y: 270 },
    ],
    []
  );
  const badInit = useMemo<Pt[]>(
    () => [
      { x: 50, y: 40 },
      { x: 70, y: 55 },
      { x: 60, y: 48 },
    ],
    []
  );

  const spring = {
    type: "spring" as const,
    stiffness: 120,
    damping: 18,
  };
  const btnPrimary =
    "rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50";
  const btnSecondary =
    "rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground disabled:opacity-50";

  return (
    <>
      {/* ────────── STEP 1 — PREDICTION GATE ────────── */}
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Bạn quản lý 3 kho hàng Grab. 30 tài xế rải rác khắp thành phố. Bạn muốn mỗi tài xế đến kho gần nhất. Làm sao đặt 3 kho cho tối ưu?"
          options={[
            "Đặt ngẫu nhiên",
            "Đặt ở 3 góc thành phố",
            "Đặt ở trung tâm mỗi cụm tài xế",
          ]}
          correct={2}
          explanation="Đặt kho ở trung tâm mỗi cụm — đó chính là ý tưởng K-Means!"
        />
      </LessonSection>

          {/* ────────── ANALOGY ────────── */}
          <div className="mb-4 rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-semibold text-foreground">
              Liên hệ đời thường — đặt kho hàng tối ưu
            </p>
            <p className="mt-1 text-sm text-muted leading-relaxed">
              Hình dung bạn được giao 3 kho Grab và hàng chục tài xế
              đang rải khắp thành phố. Nếu đặt kho bừa thì có tài xế
              phải chạy rất xa. Trực giác: “đặt kho ở{" "}
              <strong className="text-foreground">trung tâm</strong>{" "}
              của mỗi nhóm tài xế gần nhau”. Nhưng bạn không biết
              trước ai thuộc nhóm nào — gà hay trứng có trước? Mẹo của
              K-Means là <em>lặp</em>: đoán 3 vị trí kho, yêu cầu mỗi
              tài xế đến kho gần nhất, rồi dời kho về trung bình tọa
              độ các tài xế vừa đến. Lặp lại. Sau vài vòng, ba kho tự
              “trượt” về ba trung tâm cụm — giống như bụi mạt sắt xếp
              theo từ trường.
            </p>
          </div>

          <p className="mb-4 text-sm text-muted leading-relaxed">
            Bây giờ hãy thử với dữ liệu thật. Bạn sẽ tự tay đặt{" "}
            <strong className="text-foreground">3 tâm cụm</strong>,
            rồi bấm “Gán điểm” và “Di chuyển tâm” để trở thành thuật
            toán. Khi tâm không dời nữa → bạn đã hội tụ.
          </p>

          {/* ────────── STEP 2 — DISCOVERY ────────── */}
          <LessonSection step={2} totalSteps={8} label="Khám phá">
            <VisualizationSection>
              <div className="space-y-4">
                {/* Thông báo trạng thái */}
                <p className="text-sm text-muted">
                  {phase === "place" && centroids.length < K_VIZ && (
                    <>
                      Nhấp vào canvas để đặt{" "}
                      <strong className="text-foreground">{K_VIZ - centroids.length} tâm cụm</strong>{" "}
                      còn lại (
                      {COLORS.slice(centroids.length, K_VIZ)
                        .map((_, i) => COLOR_NAMES[centroids.length + i])
                        .join(", ")}
                      ).
                    </>
                  )}
                  {phase === "place" && centroids.length === K_VIZ && (
                    <>
                      Đã đặt 3 tâm cụm! Nhấn{" "}
                      <strong className="text-foreground">&quot;Gán điểm&quot;</strong>{" "}
                      để xem mỗi điểm thuộc cụm nào, hoặc nhấn{" "}
                      <strong className="text-foreground">&quot;Chạy auto&quot;</strong>{" "}
                      để K-Means chạy tới khi hội tụ.
                    </>
                  )}
                  {phase === "assigned" && (
                    <>
                      Mỗi điểm được tô màu theo tâm gần nhất. Nhấn{" "}
                      <strong className="text-foreground">&quot;Di chuyển tâm&quot;</strong>{" "}
                      để dời tâm về trung bình cụm.
                    </>
                  )}
                  {phase === "moved" && (
                    <>
                      Tâm đã di chuyển! Nhấn{" "}
                      <strong className="text-foreground">&quot;Lặp tiếp&quot;</strong>{" "}
                      để gán lại và tiếp tục.
                    </>
                  )}
                  {phase === "converged" && (
                    <>
                      Thuật toán đã <strong className="text-green-500">hội tụ</strong>{" "}
                      — tâm cụm không thay đổi nữa!
                    </>
                  )}
                </p>

                {/* Canvas K-Means tương tác */}
                <svg viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
                  className="w-full cursor-crosshair rounded-lg border border-border bg-background"
                  onClick={handleCanvasClick}>
                  {/* Assignment lines */}
                  {phase !== "place" && centroids.length === K_VIZ &&
                    DATA.map((p, i) => (
                      <motion.line key={`ln-${i}`} x1={p.x} y1={p.y}
                        x2={centroids[asgn[i]].x} y2={centroids[asgn[i]].y}
                        stroke={COLORS[asgn[i]]} strokeWidth={0.8} opacity={0.25}
                        initial={{ opacity: 0 }} animate={{ opacity: 0.25 }}
                        transition={{ duration: 0.4, delay: i * 0.02 }} />
                    ))}

                  {/* Data points */}
                  {DATA.map((p, i) => {
                    const active = phase !== "place" && centroids.length === K_VIZ;
                    const fill = active ? COLORS[asgn[i]] : "#94a3b8";
                    return (
                      <motion.circle key={`pt-${i}`} cx={p.x} cy={p.y} r={5} fill={fill}
                        stroke="#fff" strokeWidth={1.5} initial={false}
                        animate={{ fill }} transition={{ duration: 0.4 }} />
                    );
                  })}

                  {/* Centroids animated */}
                  {centroids.map((c, i) => (
                    <motion.g key={`cg-${i}`} initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}>
                      <motion.line x1={c.x - 8} y1={c.y - 8} x2={c.x + 8} y2={c.y + 8}
                        stroke={COLORS[i]} strokeWidth={3}
                        animate={{ x1: c.x - 8, y1: c.y - 8, x2: c.x + 8, y2: c.y + 8 }}
                        transition={spring} />
                      <motion.line x1={c.x + 8} y1={c.y - 8} x2={c.x - 8} y2={c.y + 8}
                        stroke={COLORS[i]} strokeWidth={3}
                        animate={{ x1: c.x + 8, y1: c.y - 8, x2: c.x - 8, y2: c.y + 8 }}
                        transition={spring} />
                      <motion.circle cx={c.x} cy={c.y} r={3} fill="#fff"
                        animate={{ cx: c.x, cy: c.y }} transition={spring} />
                    </motion.g>
                  ))}

                  {/* Overlay số liệu */}
                  {centroids.length === K_VIZ && phase !== "place" && (
                    <>
                      <text x={10} y={20} fontSize={12} fill="currentColor"
                        className="text-foreground" fontWeight={600}>
                        Vòng lặp: {iteration}
                      </text>
                      <text x={10} y={38} fontSize={11} fill="currentColor" className="text-muted">
                        Inertia: {currInertia.toFixed(0)}
                      </text>
                      <text x={10} y={54} fontSize={11} fill="currentColor" className="text-muted">
                        Tổng khoảng cách: {currDist.toFixed(0)}
                      </text>
                    </>
                  )}
                </svg>

                {/* Button panel */}
                <div className="flex flex-wrap items-center gap-3">
                  {phase === "place" && centroids.length === K_VIZ && (
                    <>
                      <button onClick={handleAssign} className={btnPrimary}>Gán điểm</button>
                      <button onClick={handleAutoRun} className={btnSecondary} disabled={isAutoRunning}>
                        Chạy auto tới hội tụ
                      </button>
                    </>
                  )}
                  {phase === "assigned" && (
                    <button onClick={handleMove} className={btnPrimary}>Di chuyển tâm</button>
                  )}
                  {phase === "moved" && (
                    <button onClick={handleIterate} className={btnPrimary}>Lặp tiếp</button>
                  )}
                  {phase === "place" && centroids.length < K_VIZ && (
                    <button onClick={handleKMeansPlusPlus} className={btnSecondary}>
                      Dùng K-Means++ (tự đặt 3 tâm)
                    </button>
                  )}
                  <button onClick={handleReset} className={btnSecondary} disabled={isAutoRunning}>
                    Đặt lại
                  </button>
                </div>

                {/* Convergence banner */}
                <AnimatePresence>
                  {phase === "converged" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="rounded-lg border border-green-300 bg-green-50 p-3 text-center text-sm font-medium text-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300">
                      Hội tụ sau {iteration} vòng lặp — inertia cuối cùng {currInertia.toFixed(0)}.
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* History chart — inertia theo vòng lặp */}
                {history.length > 1 && (
                  <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-sm font-semibold text-foreground">
                      Inertia giảm theo từng vòng lặp
                    </p>
                    <svg viewBox="0 0 400 120" className="mt-2 w-full">
                      <line x1={30} y1={100} x2={390} y2={100} stroke="#cbd5e1" strokeWidth={1} />
                      <line x1={30} y1={10} x2={30} y2={100} stroke="#cbd5e1" strokeWidth={1} />
                      {(() => {
                        const maxH = Math.max(...history);
                        const minH = Math.min(...history);
                        const range = Math.max(1, maxH - minH);
                        const n = Math.max(1, history.length - 1);
                        const toX = (i: number) => 30 + (i * 360) / n;
                        const toY = (v: number) => 10 + ((maxH - v) / range) * 85;
                        const path = history.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`).join(" ");
                        // minH chỉ dùng cho debug — tránh cảnh báo unused bằng cách tham chiếu
                        void minH;
                        return (
                          <>
                            <path d={path} fill="none" stroke="#3b82f6" strokeWidth={2} />
                            {history.map((v, i) => (
                              <circle key={i} cx={toX(i)} cy={toY(v)} r={3} fill="#3b82f6" />
                            ))}
                          </>
                        );
                      })()}
                      <text x={30} y={115} fontSize={9} fill="#94a3b8">Vòng lặp 1</text>
                      <text x={380} y={115} textAnchor="end" fontSize={9} fill="#94a3b8">
                        Vòng lặp {history.length}
                      </text>
                    </svg>
                    <p className="mt-2 text-xs text-muted">
                      Inertia phải giảm đơn điệu (hoặc giữ nguyên khi
                      hội tụ) — nếu bạn thấy nó tăng, có lỗi trong cài
                      đặt!
                    </p>
                  </div>
                )}
              </div>
            </VisualizationSection>
          </LessonSection>

          {/* ────────── STEP 3 — AHA MOMENT ────────── */}
          <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
            <AhaMoment>
              <p>
                Bạn vừa tự tay chạy thuật toán{" "}
                <strong>K-Means Clustering</strong> — gán điểm đến tâm
                gần nhất, rồi dời tâm đến trung bình cụm. Lặp lại cho
                đến khi ổn định. Đây là một ví dụ kinh điển của{" "}
                <em>Expectation-Maximization</em>: bước E (gán cụm) và
                bước M (cập nhật tâm) thay phiên nhau giảm hàm mục
                tiêu <strong>inertia</strong>{" "}
                <LaTeX>
                  {"J = \\sum_i \\|x_i - \\mu_{c_i}\\|^2"}
                </LaTeX>{" "}
                — đồ thị inertia ở trên chính là bằng chứng.
              </p>
            </AhaMoment>
          </LessonSection>

          {/* ────────── STEP 4 — TOGGLE COMPARE (bad init) ────────── */}
          <ToggleCompare
            labelA="Khởi tạo tốt"
            labelB="Khởi tạo xấu"
            description="Vị trí ban đầu của tâm cụm ảnh hưởng lớn đến kết quả. K-Means++ giải quyết vấn đề này bằng cách chọn tâm ban đầu xa nhau."
            childA={<InitDemo startCentroids={goodInit} />}
            childB={<InitDemo startCentroids={badInit} />}
          />

          {/* ────────── STEP 4 — CHALLENGE 1 ────────── */}
          <LessonSection step={4} totalSteps={8} label="Thử thách 1">
            <InlineChallenge
              question="K-Means cần bạn chọn K trước. Nếu dữ liệu có 3 cụm tự nhiên nhưng bạn chọn K=5, chuyện gì xảy ra?"
              options={[
                "Thuật toán báo lỗi",
                "Một số cụm bị chia nhỏ không cần thiết",
                "Kết quả giống hệt K=3",
              ]}
              correct={1}
              explanation="K-Means luôn tìm đúng K cụm, nên K=5 sẽ chia nhỏ cụm tự nhiên. Dùng phương pháp Elbow hoặc Silhouette để tìm K phù hợp trước khi chạy production."
            />
          </LessonSection>

          {/* ────────── STEP 5 — CHALLENGE 2 ────────── */}
          <LessonSection step={5} totalSteps={8} label="Thử thách 2">
            <InlineChallenge
              question="Bạn chạy K-Means trên ảnh 1MP (1 triệu pixel) với K=16 để nén ảnh. Thuật toán rất chậm. Cách tăng tốc nào phù hợp nhất?"
              options={[
                "Giảm K xuống 2",
                "Dùng Mini-Batch K-Means: mỗi vòng lặp chỉ cập nhật trên batch 1000 pixel",
                "Bỏ qua bước cập nhật tâm",
              ]}
              correct={1}
              explanation="Mini-Batch K-Means dùng batch nhỏ mỗi vòng lặp (stochastic), hội tụ nhanh hơn 10-100× so với Lloyd's gốc cho big data, đánh đổi một chút chất lượng. Scikit-learn có sẵn MiniBatchKMeans."
            />
          </LessonSection>

          {/* ────────── STEP 6 — EXPLANATION ────────── */}
          <LessonSection step={6} totalSteps={8} label="Giải thích sâu">
            <ExplanationSection>
              <p>
                <strong>K-Means</strong> là thuật toán{" "}
                <TopicLink slug="supervised-unsupervised-rl">
                  <strong>phân cụm không giám sát</strong>
                </TopicLink>{" "}
                phổ biến nhất. Nó chia dữ liệu thành K nhóm sao cho
                tổng bình phương khoảng cách từ mỗi điểm đến tâm cụm
                của nó là nhỏ nhất.
              </p>

              {/* Hàm mục tiêu */}
              <p>
                <strong>Hàm mục tiêu (objective):</strong>
              </p>
              <LaTeX block>
                {"J(\\mu_1, \\ldots, \\mu_K, C_1, \\ldots, C_K) = \\sum_{k=1}^{K} \\sum_{x \\in C_k} \\|x - \\mu_k\\|^2"}
              </LaTeX>
              <p>
                với <LaTeX>{"\\mu_k"}</LaTeX> là tâm cụm k và{" "}
                <LaTeX>{"C_k"}</LaTeX> là tập điểm thuộc cụm k. Đại
                lượng này gọi là <em>inertia</em> hoặc{" "}
                <em>within-cluster sum of squares (WCSS)</em>.
              </p>

              <p>
                <strong>
                  Hai bước lặp (Lloyd&apos;s algorithm):
                </strong>
              </p>
              <LaTeX block>
                {"\\text{(E-step)} \\quad c_i = \\arg\\min_k \\|x_i - \\mu_k\\|^2"}
              </LaTeX>
              <LaTeX block>
                {"\\text{(M-step)} \\quad \\mu_k = \\frac{1}{|C_k|} \\sum_{x \\in C_k} x"}
              </LaTeX>

              {/* Các bước */}
              <p>
                <strong>Thuật toán đầy đủ:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-2 pl-2">
                <li>
                  <strong>Khởi tạo:</strong> Chọn K tâm cụm — ngẫu
                  nhiên hoặc bằng K-Means++ (khuyến khích).
                </li>
                <li>
                  <strong>Gán cụm (E-step):</strong> Mỗi điểm được
                  gán cho centroid gần nhất theo khoảng cách
                  Euclidean.
                </li>
                <li>
                  <strong>Cập nhật tâm (M-step):</strong> Dời mỗi
                  centroid về trung bình tọa độ các điểm trong cụm.
                </li>
                <li>
                  <strong>Lặp lại:</strong> Bước 2-3 cho tới khi
                  centroid thay đổi ít hơn ε hoặc đạt max_iter.
                </li>
              </ol>
              <p>
                <strong>Độ phức tạp:</strong>{" "}
                <LaTeX>{"O(n \\cdot K \\cdot d \\cdot T)"}</LaTeX>{" "}
                với n = số điểm, K = số cụm, d = số chiều, T = số
                vòng lặp. Thường T = 10–50 cho dữ liệu sạch.
              </p>

              {/* Callout 1 — K-Means++ chi tiết */}
              <Callout
                variant="insight"
                title="K-Means++ — khởi tạo thông minh"
              >
                <div className="space-y-2">
                  <p>
                    Thuật toán:
                  </p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>
                      Chọn <LaTeX>{"\\mu_1"}</LaTeX> ngẫu nhiên từ
                      dữ liệu.
                    </li>
                    <li>
                      Với mỗi điểm x, tính D(x) = khoảng cách tới
                      tâm đã chọn gần nhất.
                    </li>
                    <li>
                      Chọn <LaTeX>{"\\mu_{k+1}"}</LaTeX> với xác
                      suất tỷ lệ <LaTeX>{"D(x)^2"}</LaTeX> — ưu tiên
                      điểm xa.
                    </li>
                    <li>Lặp cho tới khi đủ K tâm.</li>
                  </ol>
                  <p>
                    Arthur &amp; Vassilvitskii (2007) chứng minh
                    K-Means++ cho nghiệm{" "}
                    <LaTeX>{"O(\\log K)"}</LaTeX>-xấp xỉ so với
                    optimum trong kỳ vọng. Trong thực tế: inertia
                    cuối cùng thấp hơn 20-50% so với random init,
                    ít vòng lặp hơn, và gần như không bao giờ rơi
                    vào nghiệm xấu.
                  </p>
                </div>
              </Callout>

              {/* Callout 2 — Elbow & Silhouette */}
              <Callout
                variant="tip"
                title="Chọn K bằng Elbow và Silhouette"
              >
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>Elbow method:</strong> vẽ inertia theo K;
                    tìm điểm “khuỷu tay”. Trực quan nhưng đôi khi
                    mơ hồ.
                  </li>
                  <li>
                    <strong>Silhouette score:</strong> cho mỗi điểm
                    i, tính{" "}
                    <LaTeX>{"s(i) = (b(i) - a(i))/\\max(a(i), b(i))"}</LaTeX>{" "}
                    với a(i) = khoảng cách TB trong cùng cụm, b(i) =
                    khoảng cách TB tới cụm gần nhất khác. s ∈ [−1,
                    1]; gần 1 = cụm chặt, gần 0 = ranh giới mờ, âm =
                    gán sai cụm.
                  </li>
                  <li>
                    <strong>Gap statistic:</strong> so sánh inertia
                    với dữ liệu ngẫu nhiên, chọn K có gap lớn nhất.
                  </li>
                  <li>
                    <strong>Domain knowledge:</strong> đôi khi K là
                    ràng buộc nghiệp vụ (3 gói dịch vụ, 5 phân khúc
                    khách hàng).
                  </li>
                </ul>
              </Callout>

              {/* Elbow plot thực tế */}
              <p>
                <strong>Elbow Method trên dataset 30 điểm:</strong>
              </p>
              <ElbowPlot />

              {/* Code 1 — scikit-learn */}
              <CodeBlock
                language="python"
                title="K-Means với scikit-learn (production)"
              >
{`from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
import numpy as np

X = np.array([
    [1, 2], [1.5, 1.8], [5, 8],
    [8, 8], [1, 0.6], [9, 11],
    [8, 2], [10, 2], [9, 3],
])

# Chạy K-Means với K-Means++ và n_init=10
kmeans = KMeans(
    n_clusters=3,
    init="k-means++",
    n_init=10,                # chạy 10 lần, giữ nghiệm tốt nhất
    max_iter=300,
    tol=1e-4,
    random_state=42,
)
kmeans.fit(X)

print("Nhãn cụm:", kmeans.labels_)
print("Tâm cụm:\\n", kmeans.cluster_centers_)
print("Inertia:", kmeans.inertia_)

# Silhouette score cho K = 2 → 8
for k in range(2, 9):
    model = KMeans(n_clusters=k, n_init=10, random_state=42).fit(X)
    s = silhouette_score(X, model.labels_)
    print(f"K={k}  silhouette={s:.3f}  inertia={model.inertia_:.1f}")`}
              </CodeBlock>

              {/* Code 2 — implement from scratch */}
              <CodeBlock
                language="python"
                title="Viết K-Means từ đầu bằng NumPy"
              >
{`import numpy as np


def kmeans_plus_plus_init(X, k, rng):
    n = X.shape[0]
    idx = [rng.integers(n)]
    for _ in range(k - 1):
        dists = np.min(
            np.linalg.norm(X[:, None] - X[idx], axis=2) ** 2,
            axis=1,
        )
        probs = dists / dists.sum()
        idx.append(rng.choice(n, p=probs))
    return X[idx].copy()


def kmeans_fit(X, k, max_iter=100, tol=1e-4, seed=0):
    rng = np.random.default_rng(seed)
    centroids = kmeans_plus_plus_init(X, k, rng)
    for it in range(max_iter):
        # E-step: gán cụm gần nhất
        d = np.linalg.norm(X[:, None] - centroids, axis=2)
        labels = np.argmin(d, axis=1)
        # M-step: cập nhật tâm
        new_centroids = np.stack([
            X[labels == c].mean(axis=0) if (labels == c).any()
            else centroids[c]
            for c in range(k)
        ])
        shift = np.linalg.norm(new_centroids - centroids)
        centroids = new_centroids
        if shift < tol:
            break
    inertia = np.sum((X - centroids[labels]) ** 2)
    return labels, centroids, inertia


# Ví dụ
X = np.random.default_rng(0).normal(size=(200, 2))
labels, C, J = kmeans_fit(X, k=3, seed=7)
print(f"Inertia = {J:.2f}")`}
              </CodeBlock>

              {/* Callout 3 — Biến thể */}
              <Callout
                variant="insight"
                title="Các biến thể K-Means"
              >
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>Mini-Batch K-Means:</strong> cập nhật
                    trên batch nhỏ (1000-10000 mẫu) mỗi vòng. Nhanh
                    10-100× cho big data, đánh đổi một chút chất
                    lượng. Dùng cho ảnh, streaming data.
                  </li>
                  <li>
                    <strong>K-Medoids (PAM):</strong> dùng điểm dữ
                    liệu thật làm tâm thay vì trung bình. Chống
                    outlier, dùng được với khoảng cách tùy biến
                    (Manhattan, cosine).
                  </li>
                  <li>
                    <strong>K-Medians:</strong> dùng trung vị thay
                    vì trung bình. Robust với outlier, tối ưu L1
                    thay vì L2.
                  </li>
                  <li>
                    <strong>Fuzzy C-Means:</strong> mỗi điểm thuộc
                    mọi cụm với một xác suất mềm. Hữu ích khi ranh
                    giới cụm mờ.
                  </li>
                  <li>
                    <strong>Bisecting K-Means:</strong> bắt đầu với
                    1 cụm, liên tục chia đôi cụm có inertia lớn
                    nhất. Tránh nghiệm xấu, kết quả ổn định.
                  </li>
                  <li>
                    <strong>
                      Gaussian Mixture Models (GMM):
                    </strong>{" "}
                    mô hình xác suất, cho ra ma trận hiệp phương sai
                    — linh hoạt hơn nhưng chậm hơn K-Means.
                  </li>
                </ul>
              </Callout>

              {/* Callout 4 — Pitfalls */}
              <Callout
                variant="warning"
                title="Những cạm bẫy thường gặp"
              >
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>Không chuẩn hóa feature:</strong> nếu một
                    chiều có đơn vị lớn (VND triệu) và một chiều nhỏ
                    (tuổi), khoảng cách Euclidean bị chi phối bởi
                    chiều lớn. Luôn{" "}
                    <code className="rounded bg-surface px-1">
                      StandardScaler
                    </code>{" "}
                    hoặc{" "}
                    <code className="rounded bg-surface px-1">
                      MinMaxScaler
                    </code>{" "}
                    trước khi chạy K-Means.
                  </li>
                  <li>
                    <strong>Không dùng n_init ≥ 10:</strong>{" "}
                    Lloyd&apos;s chỉ đảm bảo cực tiểu địa phương;
                    chạy nhiều lần và giữ nghiệm tốt nhất.
                  </li>
                  <li>
                    <strong>Gán nhãn cụm làm feature:</strong> nhãn
                    cụm là categorical — không có thứ tự. Dùng
                    one-hot, không phải int thẳng vào model
                    downstream.
                  </li>
                  <li>
                    <strong>Dữ liệu high-dim:</strong> “lời nguyền
                    chiều cao” làm khoảng cách Euclidean mất ý
                    nghĩa. Giảm chiều bằng PCA hoặc UMAP trước.
                  </li>
                  <li>
                    <strong>Outlier:</strong> K-Means rất nhạy với
                    outlier vì dùng trung bình. Xử lý bằng
                    K-Medoids, K-Medians, hoặc lọc outlier bằng
                    IsolationForest trước.
                  </li>
                  <li>
                    <strong>Empty cluster:</strong> nếu một cụm mất
                    tất cả điểm, scikit-learn tái khởi tạo tâm đó
                    tại điểm xa tâm nhất. Nếu tự viết, nhớ xử lý
                    case này.
                  </li>
                </ul>
              </Callout>

              {/* CollapsibleDetail 1 — Chứng minh hội tụ */}
              <CollapsibleDetail title="Chi tiết: Tại sao Lloyd's algorithm luôn hội tụ?">
                <div className="space-y-2 text-sm">
                  <p>
                    Cần chứng minh hàm mục tiêu J giảm đơn điệu (hoặc
                    giữ nguyên) qua mỗi vòng lặp, và J bị chặn dưới
                    bởi 0.
                  </p>
                  <p>
                    <strong>Bước E (gán cụm):</strong> với centroid
                    cố định, mỗi điểm được gán vào cụm có khoảng
                    cách nhỏ nhất. Do đó:
                  </p>
                  <LaTeX block>
                    {"J_{\\text{sau E}} = \\sum_i \\min_k \\|x_i - \\mu_k\\|^2 \\le \\sum_i \\|x_i - \\mu_{c_i^{\\text{cũ}}}\\|^2 = J_{\\text{trước E}}"}
                  </LaTeX>
                  <p>
                    <strong>Bước M (cập nhật tâm):</strong> với gán
                    cố định, đạo hàm J theo{" "}
                    <LaTeX>{"\\mu_k"}</LaTeX> và đặt = 0 cho ra{" "}
                    <LaTeX>
                      {"\\mu_k = \\frac{1}{|C_k|} \\sum_{x \\in C_k} x"}
                    </LaTeX>
                    — chính là trung bình. Vì J là bậc 2 theo{" "}
                    <LaTeX>{"\\mu_k"}</LaTeX>, đây là cực tiểu toàn
                    cục, nên:
                  </p>
                  <LaTeX block>
                    {"J_{\\text{sau M}} \\le J_{\\text{trước M}}"}
                  </LaTeX>
                  <p>
                    Kết hợp, J giảm đơn điệu. Vì số cách phân hoạch n
                    điểm thành K cụm là hữu hạn (≤ K^n), J không thể
                    giảm mãi → thuật toán hội tụ trong hữu hạn vòng
                    lặp. <em>Chú ý:</em> chỉ hội tụ tới cực tiểu địa
                    phương — đó là lý do cần n_init ≥ 10.
                  </p>
                </div>
              </CollapsibleDetail>

              {/* CollapsibleDetail 2 — K-Means vs GMM */}
              <CollapsibleDetail title="Chi tiết: K-Means là trường hợp đặc biệt của GMM">
                <div className="space-y-2 text-sm">
                  <p>
                    Gaussian Mixture Model giả định dữ liệu sinh từ
                    hỗn hợp K Gaussian:
                  </p>
                  <LaTeX block>
                    {"p(x) = \\sum_{k=1}^K \\pi_k \\mathcal{N}(x \\mid \\mu_k, \\Sigma_k)"}
                  </LaTeX>
                  <p>
                    EM cho GMM: bước E tính xác suất mềm (soft
                    assignment) <LaTeX>{"\\gamma_{ik}"}</LaTeX>; bước
                    M cập nhật{" "}
                    <LaTeX>{"\\mu_k, \\Sigma_k, \\pi_k"}</LaTeX>.
                  </p>
                  <p>
                    Khi đặt:{" "}
                    <LaTeX>{"\\Sigma_k = \\sigma^2 I"}</LaTeX> (hình
                    cầu, cùng phương sai) và cho{" "}
                    <LaTeX>{"\\sigma^2 \\to 0"}</LaTeX>, soft
                    assignment trở thành hard assignment (argmax), và
                    GMM đúng bằng K-Means. Nên K-Means = GMM với giả
                    định cụm hình cầu và phương sai vô cùng nhỏ.
                  </p>
                  <p>
                    Hệ quả: K-Means không linh hoạt bằng GMM khi cụm
                    có hình elip, kích cỡ khác nhau, hay mật độ khác
                    nhau. Nhưng K-Means đơn giản và nhanh hơn nhiều —
                    luôn là baseline đầu tiên.
                  </p>
                </div>
              </CollapsibleDetail>

              {/* Ứng dụng */}
              <p>
                <strong>Ứng dụng thực tế:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>Phân khúc khách hàng:</strong> marketing
                  gom khách thành 4-8 cụm hành vi để cá nhân hóa
                  email/ưu đãi.
                </li>
                <li>
                  <strong>Nén ảnh (color quantization):</strong> K=16
                  hoặc K=256 — gom các màu tương tự thành một bảng
                  màu, giảm 80% dung lượng ảnh.
                </li>
                <li>
                  <strong>Anomaly detection:</strong> điểm xa mọi
                  centroid là outlier — dùng cho phát hiện gian lận
                  thẻ tín dụng.
                </li>
                <li>
                  <strong>Document clustering:</strong> gom tin tức
                  thành chủ đề bằng K-Means trên TF-IDF hoặc
                  embedding.
                </li>
                <li>
                  <strong>Image segmentation đơn giản:</strong>{" "}
                  K-Means trên pixel (R, G, B) tách foreground /
                  background; khởi động cho các thuật toán phức tạp
                  hơn như GrabCut.
                </li>
                <li>
                  <strong>Vector quantization:</strong> nén embedding
                  trong search vector database (FAISS IVF-PQ dùng
                  K-Means để chia index thành coarse cells).
                </li>
                <li>
                  <strong>Warehouse placement:</strong> tìm K vị trí
                  kho tối ưu cho bài toán logistics — đúng như ví dụ
                  Grab mở đầu.
                </li>
              </ul>

              {/* Pitfalls tổng hợp */}
              <p>
                <strong>Danh sách kiểm tra trước khi chạy K-Means:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1">
                <li>
                  Đã chuẩn hóa feature (StandardScaler /
                  MinMaxScaler)?
                </li>
                <li>
                  Đã chọn K bằng Elbow / Silhouette / domain
                  knowledge?
                </li>
                <li>
                  Đã đặt <code>init=&quot;k-means++&quot;</code> và{" "}
                  <code>n_init ≥ 10</code>?
                </li>
                <li>
                  Đã giảm chiều nếu d &gt; 50 (PCA/UMAP)?
                </li>
                <li>
                  Đã loại outlier (hoặc dùng K-Medoids nếu không
                  loại được)?
                </li>
                <li>
                  Đã kiểm tra inertia giảm đơn điệu qua các vòng
                  lặp?
                </li>
                <li>
                  Đã so sánh với baseline khác (GMM, DBSCAN) để biết
                  K-Means có phù hợp không?
                </li>
              </ol>
            </ExplanationSection>
          </LessonSection>

          {/* ────────── STEP 7 — MINI SUMMARY ────────── */}
          <LessonSection step={7} totalSteps={8} label="Tóm tắt">
            <MiniSummary
              points={[
                "K-Means chia dữ liệu thành K cụm bằng vòng lặp E-M: gán điểm về tâm gần nhất, rồi dời tâm về trung bình cụm.",
                "Hàm mục tiêu là inertia (WCSS) — tổng bình phương khoảng cách từ điểm tới tâm cụm; luôn giảm đơn điệu và hội tụ về cực tiểu địa phương.",
                "Khởi tạo rất quan trọng: K-Means++ chọn tâm xa nhau, giúp hội tụ nhanh và tránh nghiệm xấu. Luôn đặt n_init ≥ 10.",
                "Chọn K bằng Elbow (khuỷu tay inertia), Silhouette score, Gap statistic, hoặc domain knowledge.",
                "Chỉ phù hợp cụm hình cầu và cần chuẩn hóa feature — với cụm phi tuyến dùng DBSCAN, Spectral, hoặc GMM.",
                "Ứng dụng: phân khúc khách hàng, nén ảnh, anomaly detection, document clustering, vector quantization, warehouse placement.",
              ]}
            />
          </LessonSection>

          {/* ────────── STEP 8 — QUIZ ────────── */}
          <LessonSection step={8} totalSteps={8} label="Kiểm tra">
            <QuizSection questions={QUIZ} />
          </LessonSection>
    </>
  );
}
