"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  Target,
  MapPin,
  Sparkles,
  MousePointerClick,
  Zap,
} from "lucide-react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  LessonSection,
  TopicLink,
  StepReveal,
  CollapsibleDetail,
  LaTeX,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "k-means",
  title: "K-Means Clustering",
  titleVi: "Phân cụm k-means",
  description:
    "Chưa ai dán nhãn, nhưng dữ liệu thường tự gom nhóm. k-means tìm các tụ điểm tự nhiên — từ đặt kho hàng Grab đến phân khúc khách hàng.",
  category: "classic-ml",
  tags: ["clustering", "unsupervised-learning"],
  difficulty: "intermediate",
  relatedSlugs: ["dbscan", "knn", "pca"],
  vizType: "interactive",
};

/* ────────────────────────────────────────────────────────────
   TYPES
   ──────────────────────────────────────────────────────────── */

type Pt = { x: number; y: number };
type Phase = "place" | "assigned" | "moved" | "converged";

/* ────────────────────────────────────────────────────────────
   HẰNG SỐ
   ──────────────────────────────────────────────────────────── */

const CANVAS_W = 440;
const CANVAS_H = 360;
const MAX_ITER = 25;

const COLORS = [
  "#3b82f6",
  "#ef4444",
  "#22c55e",
  "#a855f7",
  "#f59e0b",
  "#06b6d4",
];

/* ────────────────────────────────────────────────────────────
   DỮ LIỆU — 3 cụm tự nhiên, 30 điểm
   ──────────────────────────────────────────────────────────── */

const SEED_POINTS: Pt[] = [
  { x: 85, y: 90 },
  { x: 110, y: 84 },
  { x: 96, y: 115 },
  { x: 122, y: 102 },
  { x: 78, y: 108 },
  { x: 113, y: 128 },
  { x: 92, y: 75 },
  { x: 128, y: 118 },
  { x: 70, y: 96 },
  { x: 104, y: 140 },
  { x: 300, y: 72 },
  { x: 324, y: 90 },
  { x: 312, y: 58 },
  { x: 342, y: 78 },
  { x: 304, y: 96 },
  { x: 330, y: 66 },
  { x: 347, y: 94 },
  { x: 294, y: 84 },
  { x: 316, y: 104 },
  { x: 356, y: 82 },
  { x: 192, y: 265 },
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

/* ────────────────────────────────────────────────────────────
   HELPERS
   ──────────────────────────────────────────────────────────── */

function distSq(a: Pt, b: Pt) {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

function dist(a: Pt, b: Pt) {
  return Math.sqrt(distSq(a, b));
}

function assign(pts: Pt[], cents: Pt[]) {
  return pts.map((p) => {
    let best = 0;
    let minD = Infinity;
    cents.forEach((c, i) => {
      const d = distSq(p, c);
      if (d < minD) {
        minD = d;
        best = i;
      }
    });
    return best;
  });
}

function recompute(pts: Pt[], asgn: number[], cents: Pt[]) {
  return cents.map((c, ci) => {
    const members = pts.filter((_, pi) => asgn[pi] === ci);
    if (!members.length) return c;
    return {
      x: members.reduce((s, p) => s + p.x, 0) / members.length,
      y: members.reduce((s, p) => s + p.y, 0) / members.length,
    };
  });
}

function inertia(pts: Pt[], cents: Pt[]) {
  if (cents.length === 0) return 0;
  return pts.reduce(
    (sum, p) =>
      sum + Math.min(...cents.map((c) => distSq(p, c))),
    0,
  );
}

function seededRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function kMeansPlusPlusInit(pts: Pt[], k: number, seed: number): Pt[] {
  const rng = seededRng(seed);
  const first = pts[Math.floor(rng() * pts.length)];
  const out: Pt[] = [first];
  while (out.length < k) {
    const d2 = pts.map((p) =>
      Math.min(...out.map((c) => distSq(p, c))),
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

/* ────────────────────────────────────────────────────────────
   QUIZ
   ──────────────────────────────────────────────────────────── */

const quizQuestions: QuizQuestion[] = [
  {
    question: "K-means thuộc loại học máy nào?",
    options: [
      "Học có giám sát — cần dữ liệu gán nhãn",
      "Học không giám sát — tự tìm cấu trúc trong dữ liệu không có nhãn",
      "Học tăng cường — thông qua phần thưởng và hình phạt",
      "Không phải học máy",
    ],
    correct: 1,
    explanation:
      "K-means là ví dụ tiêu biểu của học không giám sát (unsupervised learning). Dữ liệu đầu vào chỉ gồm các điểm — không ai nói trước điểm nào thuộc cụm nào. Thuật toán tự tìm cấu trúc nhóm.",
  },
  {
    question:
      "Một vòng lặp k-means gồm 2 bước. Đó là hai bước nào?",
    options: [
      "Đếm cụm → Xếp hạng cụm",
      "Gán mỗi điểm đến tâm cụm gần nhất → Di chuyển mỗi tâm về trung bình cụm",
      "Thêm điểm → Xoá điểm",
      "Tính trung vị → Tính phương sai",
    ],
    correct: 1,
    explanation:
      "Hai bước: (1) gán điểm đến tâm cụm gần nhất — gọi là E-step, (2) di chuyển mỗi tâm về trung bình toạ độ các điểm trong cụm — gọi là M-step. Lặp đến khi tâm không dời nữa.",
  },
  {
    question:
      "Dữ liệu có 4 cụm tự nhiên, nhưng bạn chạy k-means với k = 2. Chuyện gì xảy ra?",
    options: [
      "Thuật toán báo lỗi và dừng",
      "Hai cụm gần nhau bị gộp thành một — k-means luôn trả về đúng k cụm",
      "K-means tự động tăng k lên 4",
      "Kết quả không xác định",
    ],
    correct: 1,
    explanation:
      "K-means không biết “số cụm tự nhiên” là bao nhiêu. Nó trả về đúng k cụm theo yêu cầu. Nếu k nhỏ hơn số cụm thực, các cụm gần nhau bị gộp. Để tìm k phù hợp, dùng phương pháp Elbow hoặc Silhouette.",
  },
  {
    type: "fill-blank",
    question:
      "Tâm cụm (centroid) được cập nhật bằng cách tính {blank} toạ độ của các điểm trong cụm. Điều này tương đương tối thiểu hoá tổng {blank} khoảng cách — còn gọi là inertia.",
    blanks: [
      { answer: "trung bình", accept: ["mean", "giá trị trung bình"] },
      { answer: "bình phương", accept: ["squared", "bình phương"] },
    ],
    explanation:
      "Trung bình toạ độ là điểm tối thiểu hoá tổng bình phương khoảng cách từ các điểm trong cụm đến tâm. Đây là lý do k-means dùng trung bình — không phải trung vị hay điểm tuỳ ý khác.",
  },
];

/* ────────────────────────────────────────────────────────────
   COMPONENT CHÍNH
   ──────────────────────────────────────────────────────────── */

export default function KMeansTopic() {
  const [points, setPoints] = useState<Pt[]>(SEED_POINTS);
  const [k, setK] = useState(3);
  const [centroids, setCentroids] = useState<Pt[]>([]);
  const [phase, setPhase] = useState<Phase>("place");
  const [iter, setIter] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const cs = kMeansPlusPlusInit(points, k, 42);
    setCentroids(cs);
    setPhase("place");
    setIter(0);
    setHistory([inertia(points, cs)]);
  }, [k, points]);

  useEffect(() => {
    return () => {
      if (autoRef.current) clearInterval(autoRef.current);
    };
  }, []);

  const asgn = useMemo(
    () =>
      centroids.length === k ? assign(points, centroids) : [],
    [points, centroids, k],
  );

  const currInertia = useMemo(
    () => (centroids.length === k ? inertia(points, centroids) : 0),
    [points, centroids, k],
  );

  const handleAddPoint = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (isPlaying) return;
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const x = ((e.clientX - rect.left) * CANVAS_W) / rect.width;
      const y = ((e.clientY - rect.top) * CANVAS_H) / rect.height;
      setPoints((prev) => [...prev, { x, y }]);
    },
    [isPlaying],
  );

  const handleStep = useCallback(() => {
    if (phase === "place" || phase === "moved") {
      setPhase("assigned");
      setIter((i) => i + 1);
      setHistory((h) => [...h, inertia(points, centroids)]);
    } else if (phase === "assigned") {
      const next = recompute(points, asgn, centroids);
      const moved = next.every((c, ci) => dist(c, centroids[ci]) < 1);
      setCentroids(next);
      setPhase(moved ? "converged" : "moved");
    }
  }, [phase, asgn, centroids, points]);

  const handlePlay = useCallback(() => {
    if (isPlaying) {
      if (autoRef.current) {
        clearInterval(autoRef.current);
        autoRef.current = null;
      }
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
    let curr = centroids;
    let i = iter;
    let step = phase === "assigned" ? ("move" as const) : ("assign" as const);
    autoRef.current = setInterval(() => {
      if (step === "assign") {
        setPhase("assigned");
        i += 1;
        setIter(i);
        setHistory((h) => [...h, inertia(points, curr)]);
        step = "move";
      } else {
        const a = assign(points, curr);
        const next = recompute(points, a, curr);
        const converged = next.every(
          (c, ci) => dist(c, curr[ci]) < 0.5,
        );
        curr = next;
        setCentroids(next);
        if (converged || i >= MAX_ITER) {
          setPhase("converged");
          if (autoRef.current) {
            clearInterval(autoRef.current);
            autoRef.current = null;
          }
          setIsPlaying(false);
        } else {
          setPhase("moved");
        }
        step = "assign";
      }
    }, 650);
  }, [isPlaying, centroids, iter, phase, points]);

  const handleReset = useCallback(() => {
    if (autoRef.current) {
      clearInterval(autoRef.current);
      autoRef.current = null;
    }
    setIsPlaying(false);
    setPoints(SEED_POINTS);
    const cs = kMeansPlusPlusInit(SEED_POINTS, k, Date.now() & 0xffff);
    setCentroids(cs);
    setPhase("place");
    setIter(0);
    setHistory([inertia(SEED_POINTS, cs)]);
  }, [k]);

  const elbowData = useMemo(() => {
    const out: { k: number; inertia: number }[] = [];
    for (let kk = 1; kk <= 6; kk++) {
      const { inertia: j } = runToConvergence(SEED_POINTS, kk, 1337 + kk);
      out.push({ k: kk, inertia: j });
    }
    return out;
  }, []);

  return (
    <>
      {/* BƯỚC 1 — DỰ ĐOÁN */}
      <LessonSection step={1} totalSteps={8} label="Thử đoán">
        <PredictionGate
          question="Bạn là chủ thương hiệu cà phê, có 30 cửa hàng rải rác khắp Hà Nội. Đội vận hành muốn đặt 3 kho nguyên liệu sao cho mọi cửa hàng đến kho gần nhất là ngắn nhất. Bạn đặt kho ở đâu?"
          options={[
            "Đặt đều ở 3 hướng: Đông, Tây, Nam thành phố",
            "Đặt gần trung tâm vì nhiều cửa hàng ở đó",
            "Đặt ở trung tâm mỗi cụm cửa hàng tự nhiên — gần nhau thì chung một kho",
            "Đặt ngẫu nhiên cho công bằng",
          ]}
          correct={2}
          explanation="Chính xác! Đặt kho ở trung tâm mỗi cụm cửa hàng. Đó là ý tưởng cốt lõi của k-means: 'tụ điểm' (centroid) là trung bình của các điểm thuộc về nó. Nhưng có điều kỳ lạ: trước khi đặt kho bạn không biết cửa hàng nào thuộc nhóm nào. Thuật toán giải quyết 'gà có trước hay trứng có trước' bằng cách... đoán rồi sửa dần."
        >
          <p className="text-sm text-muted mt-4 leading-relaxed">
            Chưa có ai dán nhãn &ldquo;cụm bắc&rdquo; hay &ldquo;cụm
            nam&rdquo; cho 30 cửa hàng. Nhưng dữ liệu thường{" "}
            <em>tự gom nhóm</em> — cửa hàng gần nhau thì về địa lý đã
            &ldquo;đồng nhóm&rdquo; rồi. k-means là cách để máy tính tìm
            ra những tụ điểm tự nhiên đó mà không cần ai nói trước.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* BƯỚC 2 — ẨN DỤ */}
      <LessonSection step={2} totalSteps={8} label="Hiểu bằng hình ảnh">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <MapPin size={20} className="text-accent" /> Gà có trước hay trứng có trước?
          </h3>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Bạn không biết cửa hàng nào thuộc cụm nào — để biết điều đó
            cần có vị trí kho. Nhưng vị trí kho lại phụ thuộc vào danh
            sách cửa hàng trong cụm. Vòng tròn!
          </p>
          <p className="text-sm text-foreground/85 leading-relaxed">
            <strong>Mẹo của k-means: bắt đầu bằng một phỏng đoán thô,
            rồi sửa liên tục.</strong>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
            <div className="rounded-xl border border-sky-200 bg-sky-50 dark:bg-sky-900/20 dark:border-sky-800 p-4 space-y-1">
              <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300">
                <Target size={16} />
                <span className="text-sm font-semibold">Bước 1: Đoán</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Đặt 3 kho ở 3 vị trí bất kỳ — thậm chí là ngẫu nhiên.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-4 space-y-1">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <MousePointerClick size={16} />
                <span className="text-sm font-semibold">Bước 2: Gán</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Mỗi cửa hàng → chọn kho gần nhất. Cụm được &ldquo;khai
                sinh&rdquo;.
              </p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4 space-y-1">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <Zap size={16} />
                <span className="text-sm font-semibold">Bước 3: Dời</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Dời mỗi kho về trung bình cụm. Quay lại bước 2. Lặp đến
                khi không ai dời nữa.
              </p>
            </div>
          </div>
        </div>
      </LessonSection>

      {/* BƯỚC 3 — TRỰC QUAN HOÁ */}
      <LessonSection step={3} totalSteps={8} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <div className="space-y-5">
            <p className="text-sm text-muted leading-relaxed">
              Canvas bên dưới là bản đồ giả định. 30 chấm xám là cửa
              hàng đã có sẵn — bạn có thể{" "}
              <strong>nhấp vào ô trống</strong> để thêm cửa hàng mới.
              Kéo thanh <strong>số kho (k)</strong> rồi bấm{" "}
              <strong>Play</strong> để xem thuật toán chạy.
            </p>

            {/* Controls row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-1 rounded-xl border border-border bg-card p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-accent" />
                  <span className="text-[11px] font-semibold text-tertiary uppercase tracking-wide">
                    Điều khiển
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={handlePlay}
                    disabled={phase === "converged"}
                    className="flex items-center justify-center gap-1 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {isPlaying ? (
                      <Pause size={12} />
                    ) : (
                      <Play size={12} />
                    )}
                    {isPlaying ? "Dừng" : "Play"}
                  </button>
                  <button
                    type="button"
                    onClick={handleStep}
                    disabled={isPlaying || phase === "converged"}
                    className="flex items-center justify-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted hover:text-foreground disabled:opacity-50"
                  >
                    <ChevronRight size={12} />
                    1 bước
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center justify-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted hover:text-foreground"
                  >
                    <RotateCcw size={12} />
                    Reset
                  </button>
                </div>
                <div className="rounded-lg bg-surface/60 p-2 text-[11px] text-muted text-center leading-snug">
                  {phase === "place" &&
                    "Tâm cụm đã đặt xong — bấm Play hoặc “1 bước” để bắt đầu gán"}
                  {phase === "assigned" &&
                    "Điểm đã được gán vào cụm gần nhất. Tiếp theo: dời tâm"}
                  {phase === "moved" &&
                    "Tâm đã dời. Gán lại điểm để kiểm tra có thay đổi không"}
                  {phase === "converged" && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Hội tụ! Tâm không dời nữa.
                    </span>
                  )}
                </div>
              </div>

              <div className="md:col-span-1 rounded-xl border border-border bg-card p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-tertiary uppercase tracking-wide">
                    Số kho k
                  </span>
                  <span className="text-lg font-bold text-accent tabular-nums">
                    {k}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={6}
                  step={1}
                  value={k}
                  onChange={(e) => setK(Number(e.target.value))}
                  disabled={isPlaying}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer accent-accent"
                  aria-label="Số cụm k"
                />
                <div className="flex justify-between text-[10px] text-tertiary">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                  <span>6</span>
                </div>
              </div>

              <div className="md:col-span-1 rounded-xl border border-border bg-card p-3 space-y-1">
                <div className="text-[11px] font-semibold text-tertiary uppercase tracking-wide">
                  Trạng thái
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Vòng lặp</span>
                  <span className="tabular-nums font-bold text-foreground">
                    {iter}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Inertia</span>
                  <span className="tabular-nums font-bold text-foreground">
                    {currInertia.toFixed(0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Điểm</span>
                  <span className="tabular-nums font-bold text-foreground">
                    {points.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Canvas */}
            <svg
              viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
              className="w-full rounded-xl border border-border bg-background cursor-crosshair"
              onClick={handleAddPoint}
              role="img"
              aria-label={`Canvas phân cụm k-means: ${points.length} điểm, ${k} tâm cụm, vòng lặp ${iter}, inertia ${currInertia.toFixed(0)}`}
            >
              {/* Grid */}
              {[0, 1, 2, 3, 4].map((g) => (
                <line
                  key={`gv-${g}`}
                  x1={(g * CANVAS_W) / 4}
                  y1={0}
                  x2={(g * CANVAS_W) / 4}
                  y2={CANVAS_H}
                  stroke="currentColor"
                  strokeOpacity={0.06}
                  strokeDasharray="2,4"
                />
              ))}
              {[0, 1, 2, 3].map((g) => (
                <line
                  key={`gh-${g}`}
                  x1={0}
                  y1={(g * CANVAS_H) / 3}
                  x2={CANVAS_W}
                  y2={(g * CANVAS_H) / 3}
                  stroke="currentColor"
                  strokeOpacity={0.06}
                  strokeDasharray="2,4"
                />
              ))}

              {/* Assignment lines */}
              {phase !== "place" &&
                centroids.length === k &&
                points.map((p, i) => (
                  <motion.line
                    key={`ln-${i}`}
                    x1={p.x}
                    y1={p.y}
                    x2={centroids[asgn[i]].x}
                    y2={centroids[asgn[i]].y}
                    stroke={COLORS[asgn[i]]}
                    strokeWidth={0.8}
                    opacity={0.3}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    transition={{ duration: 0.3, delay: i * 0.015 }}
                  />
                ))}

              {/* Points */}
              {points.map((p, i) => {
                const active = phase !== "place" && centroids.length === k;
                const fill = active ? COLORS[asgn[i]] : "#94a3b8";
                return (
                  <motion.circle
                    key={`pt-${i}`}
                    cx={p.x}
                    cy={p.y}
                    r={5}
                    stroke="#fff"
                    strokeWidth={1.2}
                    animate={{ fill }}
                    transition={{ duration: 0.35 }}
                  />
                );
              })}

              {/* Centroids */}
              {centroids.map((c, i) => (
                <motion.g
                  key={`cg-${i}`}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <motion.line
                    x1={c.x - 9}
                    y1={c.y - 9}
                    x2={c.x + 9}
                    y2={c.y + 9}
                    stroke={COLORS[i]}
                    strokeWidth={3.5}
                    animate={{ x1: c.x - 9, y1: c.y - 9, x2: c.x + 9, y2: c.y + 9 }}
                    transition={{ type: "spring", stiffness: 140, damping: 18 }}
                  />
                  <motion.line
                    x1={c.x + 9}
                    y1={c.y - 9}
                    x2={c.x - 9}
                    y2={c.y + 9}
                    stroke={COLORS[i]}
                    strokeWidth={3.5}
                    animate={{ x1: c.x + 9, y1: c.y - 9, x2: c.x - 9, y2: c.y + 9 }}
                    transition={{ type: "spring", stiffness: 140, damping: 18 }}
                  />
                  <motion.circle
                    cx={c.x}
                    cy={c.y}
                    r={4}
                    fill="#fff"
                    animate={{ cx: c.x, cy: c.y }}
                    transition={{ type: "spring", stiffness: 140, damping: 18 }}
                  />
                </motion.g>
              ))}

              {/* Converged badge */}
              <AnimatePresence>
                {phase === "converged" && (
                  <motion.g
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <rect
                      x={CANVAS_W - 130}
                      y={10}
                      width={120}
                      height={24}
                      rx={12}
                      fill="#22c55e"
                      opacity={0.12}
                    />
                    <text
                      x={CANVAS_W - 70}
                      y={26}
                      textAnchor="middle"
                      fontSize={11}
                      fontWeight={700}
                      fill="#16a34a"
                    >
                      ✓ Hội tụ sau {iter} vòng
                    </text>
                  </motion.g>
                )}
              </AnimatePresence>
            </svg>

            {/* History mini-chart */}
            {history.length > 1 && (
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-accent" />
                  Inertia giảm theo từng vòng lặp
                </p>
                <svg viewBox="0 0 400 100" className="w-full">
                  {(() => {
                    const maxH = Math.max(...history);
                    const minH = Math.min(...history);
                    const range = Math.max(1, maxH - minH);
                    const n = Math.max(1, history.length - 1);
                    const toX = (i: number) => 20 + (i * 360) / Math.max(1, n);
                    const toY = (v: number) =>
                      15 + ((maxH - v) / range) * 70;
                    const path = history
                      .map(
                        (v, i) =>
                          `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`,
                      )
                      .join(" ");
                    return (
                      <>
                        <line
                          x1={20}
                          x2={380}
                          y1={85}
                          y2={85}
                          stroke="currentColor"
                          strokeOpacity={0.15}
                        />
                        <path
                          d={path}
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth={2}
                        />
                        {history.map((v, i) => (
                          <motion.circle
                            key={`h-${i}`}
                            cx={toX(i)}
                            cy={toY(v)}
                            r={3}
                            fill="#3b82f6"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                          />
                        ))}
                      </>
                    );
                  })()}
                </svg>
                <p className="text-[10px] text-muted mt-1 italic">
                  Inertia luôn giảm hoặc giữ nguyên — nếu bạn thấy nó
                  tăng, có lỗi trong cài đặt!
                </p>
              </div>
            )}
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* BƯỚC 4 — MỔ XẺ MỘT VÒNG LẶP */}
      <LessonSection step={4} totalSteps={8} label="Mổ xẻ một vòng lặp">
        <p className="text-sm text-muted mb-4 leading-relaxed">
          Bấm &ldquo;Tiếp tục&rdquo; để đi qua từng bước trong một vòng
          lặp: tính khoảng cách → gán cụm → dời tâm. Mỗi bước có hình
          ảnh riêng.
        </p>

        <StepReveal
          labels={[
            "Bước 1: Đo khoảng cách từ điểm đến mỗi tâm",
            "Bước 2: Gán điểm về tâm gần nhất",
            "Bước 3: Dời tâm về trung bình cụm",
          ]}
        >
          {[
            <StepDistance key="s1" />,
            <StepAssign key="s2" />,
            <StepUpdate key="s3" />,
          ]}
        </StepReveal>
      </LessonSection>

      {/* BƯỚC 5 — AHA */}
      <LessonSection step={5} totalSteps={8} label="Khoảnh khắc hiểu">
        <AhaMoment>
          k-means giải bài toán &ldquo;gà và trứng&rdquo; bằng cách{" "}
          <strong>luân phiên</strong> — giả vờ biết một phần, giải phần
          còn lại, rồi đảo ngược.
          <br />
          <br />
          Đây là một ví dụ của một họ thuật toán lớn hơn gọi là{" "}
          <em>Expectation-Maximization</em>. Bạn sẽ gặp lại ý tưởng này
          ở nhiều nơi — Gaussian Mixture Model, thuật toán EM cho hidden
          Markov, thậm chí cả cách bạn tự điều chỉnh kỳ vọng khi gặp
          người mới.
        </AhaMoment>
      </LessonSection>

      {/* BƯỚC 6 — THỬ THÁCH */}
      <LessonSection step={6} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Bạn có n điểm. Chạy k-means với k = 1 và k = n (số cụm bằng số điểm). Chuyện gì xảy ra?"
          options={[
            "k = 1: mọi điểm chung một cụm → tâm là trung bình cả tập; k = n: mỗi điểm là một cụm riêng → inertia = 0 nhưng vô nghĩa",
            "Cả hai trường hợp đều báo lỗi",
            "k = 1 cho kết quả tốt, k = n cho kết quả kém",
            "Không có gì khác thường — k-means xử lý bình thường",
          ]}
          correct={0}
          explanation="Với k = 1: mọi điểm thuộc cùng một cụm, tâm là trung bình toàn tập — inertia lớn nhất có thể. Với k = n: mỗi điểm tự là một cụm, tâm trùng chính điểm đó, inertia = 0 tuyệt đối — nhưng hoàn toàn vô nghĩa cho phân tích. Đây là lý do cần chọn k cẩn thận: inertia luôn giảm khi tăng k, không phải lúc nào k nhỏ hơn cũng tệ."
        />
      </LessonSection>

      {/* BƯỚC 7 — GIẢI THÍCH */}
      <LessonSection step={7} totalSteps={8} label="Giải thích">
        <ExplanationSection>
          <p className="leading-relaxed">
            k-means là thuật toán{" "}
            <TopicLink slug="supervised-unsupervised-rl">
              học không giám sát
            </TopicLink>{" "}
            phổ biến nhất. Nó chia dữ liệu thành k nhóm sao cho{" "}
            <strong>tổng bình phương khoảng cách</strong> từ mỗi điểm
            đến tâm cụm của nó là nhỏ nhất. Đại lượng này gọi là{" "}
            <em>inertia</em> hoặc <em>within-cluster sum of squares</em>.
          </p>

          <div className="rounded-xl border border-border bg-card p-5 my-4 space-y-3">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Target size={16} className="text-accent" />
              Hàm mục tiêu
            </p>
            <LaTeX block>{"J = \\sum_{k=1}^{K} \\sum_{x \\in C_k} \\|x - \\mu_k\\|^2"}</LaTeX>
            <p className="text-xs text-muted leading-relaxed">
              <LaTeX>{"\\mu_k"}</LaTeX> là tâm cụm k,{" "}
              <LaTeX>{"C_k"}</LaTeX> là tập điểm thuộc cụm k. Mục tiêu:
              tìm bộ tâm và phân cụm sao cho J nhỏ nhất. Vì inertia giảm
              đơn điệu qua mỗi vòng lặp, thuật toán luôn hội tụ — nhưng
              chỉ đảm bảo về cực tiểu địa phương.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 my-4 space-y-3">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles size={16} className="text-accent" />
              Cập nhật tâm (M-step)
            </p>
            <LaTeX block>{"\\mu_k = \\frac{1}{|C_k|} \\sum_{x \\in C_k} x"}</LaTeX>
            <p className="text-xs text-muted leading-relaxed">
              Tâm mới là trung bình toạ độ của các điểm trong cụm. Không
              phải trung vị, không phải một điểm bất kỳ — <em>trung bình</em>.
              Lý do: trung bình chính là điểm tối thiểu hoá tổng bình
              phương khoảng cách (đạo hàm J theo <LaTeX>{"\\mu_k"}</LaTeX>
              bằng 0 cho ra đúng công thức này).
            </p>
          </div>

          <h4 className="text-sm font-semibold text-foreground mt-6 mb-2">
            Chọn k bằng phương pháp Elbow
          </h4>
          <p className="text-sm text-muted leading-relaxed mb-3">
            Inertia luôn giảm khi k tăng (k càng lớn → cụm càng nhỏ →
            điểm càng gần tâm). Nhưng ở một điểm nào đó, tăng k không
            còn giảm inertia đáng kể nữa — đó là &ldquo;khuỷu tay&rdquo;.
          </p>
          <ElbowChart data={elbowData} />

          <Callout variant="tip" title="Mẹo chọn k trong thực tế">
            Elbow là phương pháp trực quan nhưng đôi khi mơ hồ. Các cách
            bổ sung: (1) <em>Silhouette score</em> — đo mức độ &ldquo;chặt&rdquo;
            của cụm; (2) <em>Gap statistic</em> — so sánh inertia thật với
            dữ liệu ngẫu nhiên; (3) <em>Ràng buộc nghiệp vụ</em> — đôi
            khi bạn biết trước cần 4 phân khúc khách hàng, 3 gói dịch vụ.
          </Callout>

          <Callout variant="warning" title="Những cạm bẫy thường gặp">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <strong>Không chuẩn hoá dữ liệu:</strong> nếu một chiều
                có đơn vị lớn (thu nhập triệu đồng) và chiều khác nhỏ
                (tuổi), khoảng cách Euclidean bị chi phối bởi chiều lớn.
                Luôn chuẩn hoá trước khi chạy.
              </li>
              <li>
                <strong>Khởi tạo tồi:</strong> k-means rất nhạy với vị
                trí tâm ban đầu. Dùng <em>k-means++</em> (chọn tâm xa nhau)
                thay vì ngẫu nhiên — scikit-learn mặc định đã bật.
              </li>
              <li>
                <strong>Cụm hình không phải cầu:</strong> k-means giả định
                cụm có dạng tròn (isotropic). Cụm cong hoặc mật độ khác
                nhau → dùng DBSCAN hoặc Spectral Clustering.
              </li>
              <li>
                <strong>Outlier:</strong> k-means dùng trung bình nên rất
                nhạy outlier. Xử lý bằng k-medoids (dùng điểm thật làm
                tâm) hoặc lọc outlier trước.
              </li>
            </ul>
          </Callout>

          <CollapsibleDetail title="Tại sao k-means luôn hội tụ?">
            <p className="text-sm leading-relaxed">
              Hàm mục tiêu J giảm đơn điệu qua mỗi vòng lặp (bước E không
              tăng J, bước M không tăng J), và J bị chặn dưới bởi 0.
              Thêm vào đó, số cách phân hoạch n điểm thành k cụm là hữu
              hạn, nên J không thể giảm mãi — thuật toán hội tụ trong
              hữu hạn vòng. <em>Lưu ý quan trọng:</em> chỉ hội tụ đến
              cực tiểu <strong>địa phương</strong>, không đảm bảo toàn
              cục. Đó là lý do scikit-learn chạy 10 lần với seed khác
              nhau và chọn nghiệm tốt nhất (tham số{" "}
              <code>n_init=10</code>).
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Ứng dụng thực tế của k-means">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <strong>Phân khúc khách hàng:</strong> gom khách thành
                4–8 cụm hành vi để gửi email/ưu đãi khác nhau.
              </li>
              <li>
                <strong>Nén ảnh (color quantization):</strong> gom các
                màu tương tự thành một bảng 256 màu, giảm 80% dung lượng.
              </li>
              <li>
                <strong>Phát hiện bất thường:</strong> điểm xa mọi tâm
                là outlier — dùng cho phát hiện gian lận thẻ tín dụng.
              </li>
              <li>
                <strong>Phân cụm tài liệu:</strong> gom tin tức thành chủ
                đề bằng k-means trên vector embedding.
              </li>
              <li>
                <strong>Gợi ý nhạc:</strong> Spotify dùng k-means trên
                vector nghe của người dùng để tìm &ldquo;đồng minh thẩm
                mỹ&rdquo; — xem bài ứng dụng.
              </li>
            </ul>
          </CollapsibleDetail>
        </ExplanationSection>
      </LessonSection>

      {/* BƯỚC 8 — TÓM TẮT + QUIZ */}
      <LessonSection step={8} totalSteps={8} label="Tóm tắt và kiểm tra">
        <MiniSummary
          title="5 điều cần nhớ về k-means"
          points={[
            "Ý tưởng gốc: lặp giữa gán điểm đến tâm gần nhất (E-step) và dời tâm về trung bình cụm (M-step) đến khi không ai dời nữa.",
            "Hàm mục tiêu là inertia — tổng bình phương khoảng cách; luôn giảm đơn điệu và hội tụ đến cực tiểu địa phương.",
            "Phải chọn k trước khi chạy. Dùng Elbow hoặc Silhouette để tìm k phù hợp với dữ liệu.",
            "Nhạy với khởi tạo — luôn dùng k-means++ và chạy nhiều lần (n_init ≥ 10) để tránh nghiệm xấu.",
            "Chỉ phù hợp cụm hình cầu. Dữ liệu cong hoặc mật độ khác nhau → dùng DBSCAN, Spectral, hoặc GMM.",
          ]}
        />

        <div className="mt-8">
          <QuizSection questions={quizQuestions} />
        </div>

        <div className="mt-10">
          <Callout variant="tip" title="Ứng dụng thực tế">
            Spotify dùng một họ thuật toán phân cụm (bao gồm k-means và
            ma trận phân rã) để tạo ra Discover Weekly — 30 bài hát mới
            mỗi tuần &ldquo;hợp gu lạ kỳ&rdquo;. Xem cách họ làm ở bài
            ứng dụng:{" "}
            <TopicLink slug="k-means-in-music-recs">
              k-means trong gợi ý nhạc
            </TopicLink>
            .
          </Callout>
        </div>
      </LessonSection>
    </>
  );
}

/* ────────────────────────────────────────────────────────────
   SUB-COMPONENT: Elbow chart
   ──────────────────────────────────────────────────────────── */

function ElbowChart({
  data,
}: {
  data: { k: number; inertia: number }[];
}) {
  const maxIn = Math.max(...data.map((d) => d.inertia));
  const minIn = Math.min(...data.map((d) => d.inertia));
  const PW = 400;
  const PH = 200;
  const PADL = 40;
  const PADR = 15;
  const PADT = 20;
  const PADB = 30;

  const xScale = (k: number) =>
    PADL + ((k - 1) / 5) * (PW - PADL - PADR);
  const yScale = (v: number) => {
    if (maxIn === minIn) return PADT;
    return PADT + ((maxIn - v) / (maxIn - minIn)) * (PH - PADT - PADB);
  };

  const path = data
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${xScale(p.k)} ${yScale(p.inertia)}`,
    )
    .join(" ");

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <svg viewBox={`0 0 ${PW} ${PH}`} className="w-full">
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const y = PADT + t * (PH - PADT - PADB);
          return (
            <line
              key={`g-${i}`}
              x1={PADL}
              y1={y}
              x2={PW - PADR}
              y2={y}
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeDasharray="2,3"
            />
          );
        })}

        {/* Elbow marker at k=3 */}
        <line
          x1={xScale(3)}
          y1={PADT}
          x2={xScale(3)}
          y2={PH - PADB}
          stroke="#f59e0b"
          strokeWidth={1.5}
          strokeDasharray="4,4"
        />
        <text
          x={xScale(3) + 6}
          y={PADT + 14}
          fontSize={11}
          fontWeight={700}
          fill="#f59e0b"
        >
          Elbow ở k = 3
        </text>

        {/* Path */}
        <motion.path
          d={path}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2 }}
        />

        {/* Dots */}
        {data.map((p) => (
          <motion.circle
            key={`pt-${p.k}`}
            cx={xScale(p.k)}
            cy={yScale(p.inertia)}
            r={p.k === 3 ? 7 : 5}
            fill={p.k === 3 ? "#f59e0b" : "#3b82f6"}
            stroke="#fff"
            strokeWidth={2}
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 * p.k }}
          />
        ))}

        {/* X-axis labels */}
        {data.map((p) => (
          <text
            key={`lbl-${p.k}`}
            x={xScale(p.k)}
            y={PH - 10}
            textAnchor="middle"
            fontSize={11}
            fill="var(--text-secondary)"
          >
            k={p.k}
          </text>
        ))}

        {/* Axis titles */}
        <text
          x={PADL}
          y={PADT - 5}
          fontSize={11}
          fontWeight={600}
          fill="var(--text-secondary)"
        >
          Inertia (WCSS)
        </text>
      </svg>
      <p className="text-xs text-muted mt-2 italic leading-relaxed">
        Quan sát: từ k = 1 đến k = 3, inertia giảm mạnh. Từ k = 3 trở
        đi, giảm rất chậm — đó là &ldquo;khuỷu tay&rdquo;, gợi ý k = 3
        là số cụm tự nhiên của dữ liệu này.
      </p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   STEP REVEAL sub-components
   ──────────────────────────────────────────────────────────── */

function StepDistance() {
  const pt = { x: 160, y: 180 };
  const cents = [
    { x: 80, y: 80, color: "#3b82f6" },
    { x: 280, y: 80, color: "#ef4444" },
    { x: 180, y: 260, color: "#22c55e" },
  ];
  const dists = cents.map((c) => Math.hypot(c.x - pt.x, c.y - pt.y));
  const nearest = dists.indexOf(Math.min(...dists));

  return (
    <div className="rounded-xl border border-border bg-surface/60 p-5 space-y-3">
      <p className="text-sm text-foreground leading-relaxed">
        Với <strong>mỗi điểm dữ liệu</strong>, đo khoảng cách đến{" "}
        <strong>mỗi tâm</strong>. Dùng công thức Pythagoras:{" "}
        <code className="text-xs bg-surface px-1 rounded">
          d = √((Δx)² + (Δy)²)
        </code>
        .
      </p>
      <svg viewBox="0 0 360 320" className="w-full rounded-lg border border-border bg-background">
        {cents.map((c, i) => (
          <g key={`cent-${i}`}>
            <motion.line
              x1={pt.x}
              y1={pt.y}
              x2={c.x}
              y2={c.y}
              stroke={c.color}
              strokeWidth={i === nearest ? 2.5 : 1}
              strokeDasharray={i === nearest ? "0" : "4,3"}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.2 * i }}
            />
            <text
              x={(pt.x + c.x) / 2 + 8}
              y={(pt.y + c.y) / 2 - 4}
              fontSize={11}
              fontWeight={i === nearest ? 700 : 500}
              fill={c.color}
            >
              {dists[i].toFixed(0)}
            </text>
            <g>
              <line x1={c.x - 10} y1={c.y - 10} x2={c.x + 10} y2={c.y + 10} stroke={c.color} strokeWidth={3.5} />
              <line x1={c.x + 10} y1={c.y - 10} x2={c.x - 10} y2={c.y + 10} stroke={c.color} strokeWidth={3.5} />
            </g>
          </g>
        ))}
        <circle cx={pt.x} cy={pt.y} r={7} fill="#f97316" stroke="#fff" strokeWidth={2} />
        <text x={pt.x + 12} y={pt.y + 4} fontSize={11} fill="#f97316" fontWeight={600}>
          Điểm
        </text>
      </svg>
      <p className="text-xs text-muted italic leading-relaxed">
        Số bên cạnh mỗi đường là khoảng cách. Đường đậm (xanh lá, d ={" "}
        {dists[nearest].toFixed(0)}) là tâm gần nhất — điểm sẽ được gán
        về cụm đó.
      </p>
    </div>
  );
}

function StepAssign() {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-5 space-y-3">
      <p className="text-sm text-foreground leading-relaxed">
        Lặp lại phép đo cho <strong>tất cả điểm dữ liệu</strong>. Mỗi
        điểm chọn tâm gần nhất — và lấy luôn màu của tâm đó. Đây là
        bước <em>E-step</em> (expectation).
      </p>
      <svg viewBox="0 0 360 220" className="w-full rounded-lg border border-border bg-background">
        {[
          { x: 70, y: 60, cl: 0 },
          { x: 90, y: 80, cl: 0 },
          { x: 110, y: 50, cl: 0 },
          { x: 80, y: 100, cl: 0 },
          { x: 260, y: 55, cl: 1 },
          { x: 290, y: 80, cl: 1 },
          { x: 280, y: 40, cl: 1 },
          { x: 300, y: 105, cl: 1 },
          { x: 160, y: 160, cl: 2 },
          { x: 185, y: 175, cl: 2 },
          { x: 200, y: 145, cl: 2 },
          { x: 175, y: 185, cl: 2 },
        ].map((p, i) => {
          const colors = ["#3b82f6", "#ef4444", "#22c55e"];
          return (
            <motion.circle
              key={`p-${i}`}
              cx={p.x}
              cy={p.y}
              r={5}
              stroke="#fff"
              strokeWidth={1.2}
              initial={{ fill: "#94a3b8" }}
              animate={{ fill: colors[p.cl] }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            />
          );
        })}
        {[
          { x: 90, y: 80, color: "#3b82f6" },
          { x: 285, y: 70, color: "#ef4444" },
          { x: 180, y: 170, color: "#22c55e" },
        ].map((c, i) => (
          <g key={`c-${i}`}>
            <line x1={c.x - 9} y1={c.y - 9} x2={c.x + 9} y2={c.y + 9} stroke={c.color} strokeWidth={3.5} />
            <line x1={c.x + 9} y1={c.y - 9} x2={c.x - 9} y2={c.y + 9} stroke={c.color} strokeWidth={3.5} />
          </g>
        ))}
      </svg>
      <p className="text-xs text-muted italic leading-relaxed">
        Mỗi điểm đã &ldquo;khoác áo&rdquo; theo tâm gần nhất. Cụm hình
        thành từ đây.
      </p>
    </div>
  );
}

function StepUpdate() {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-5 space-y-3">
      <p className="text-sm text-foreground leading-relaxed">
        Với mỗi cụm, tính <strong>trung bình toạ độ</strong> của các
        điểm trong cụm — đó là tâm mới. Đây là bước <em>M-step</em>{" "}
        (maximization — nhưng cho k-means tương đương minimization của
        inertia).
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-card border border-border p-3">
          <div className="text-[10px] text-tertiary uppercase tracking-wide mb-1">
            Cụm đỏ (5 điểm)
          </div>
          <div className="text-xs text-foreground/85">
            x = (50+60+65+52+58) / 5 = <strong>57</strong>
          </div>
          <div className="text-xs text-foreground/85">
            y = (40+48+42+50+46) / 5 = <strong>45.2</strong>
          </div>
          <div className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400">
            Tâm mới: (57, 45.2)
          </div>
        </div>
        <div className="rounded-lg bg-card border border-border p-3">
          <div className="text-[10px] text-tertiary uppercase tracking-wide mb-1">
            Cụm xanh (3 điểm)
          </div>
          <div className="text-xs text-foreground/85">
            x = (200+210+220) / 3 = <strong>210</strong>
          </div>
          <div className="text-xs text-foreground/85">
            y = (150+155+160) / 3 = <strong>155</strong>
          </div>
          <div className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            Tâm mới: (210, 155)
          </div>
        </div>
      </div>
      <svg viewBox="0 0 360 160" className="w-full rounded-lg border border-border bg-background">
        <g>
          <line x1={80} y1={60} x2={100} y2={80} stroke="#ef444480" strokeWidth={3} />
          <line x1={100} y1={60} x2={80} y2={80} stroke="#ef444480" strokeWidth={3} />
          <text x={110} y={75} fontSize={11} fill="#ef4444" opacity={0.6}>
            Tâm cũ
          </text>
        </g>
        <motion.line
          x1={90}
          y1={70}
          x2={170}
          y2={100}
          stroke="#94a3b8"
          strokeWidth={1.5}
          strokeDasharray="3,3"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        />
        <motion.text
          x={120}
          y={80}
          fontSize={11}
          fill="#94a3b8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          dời →
        </motion.text>
        <motion.g
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.9, type: "spring" }}
        >
          <line x1={160} y1={90} x2={180} y2={110} stroke="#ef4444" strokeWidth={3.5} />
          <line x1={180} y1={90} x2={160} y2={110} stroke="#ef4444" strokeWidth={3.5} />
          <text x={190} y={105} fontSize={11} fontWeight={700} fill="#ef4444">
            Tâm mới
          </text>
        </motion.g>
        {[
          { x: 145, y: 95 },
          { x: 165, y: 85 },
          { x: 175, y: 115 },
          { x: 150, y: 115 },
          { x: 180, y: 95 },
        ].map((p, i) => (
          <circle key={`dp-${i}`} cx={p.x} cy={p.y} r={4} fill="#ef4444" stroke="#fff" strokeWidth={1} />
        ))}
      </svg>
      <p className="text-xs text-muted italic leading-relaxed">
        Tâm mới luôn nằm ở &ldquo;trung tâm khối lượng&rdquo; của cụm.
        Sau khi dời, lặp lại bước 1 — đôi khi một số điểm gần biên sẽ
        đổi cụm. Quay lại bước 2. Khi không điểm nào đổi cụm nữa →
        hội tụ.
      </p>
    </div>
  );
}
