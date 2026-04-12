"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PredictionGate, AhaMoment, InlineChallenge,
  Callout, MiniSummary, CodeBlock, ToggleCompare,
  LessonSection, TopicLink,} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "k-means",
  title: "K-Means Clustering",
  titleVi: "Phân cụm K-Means",
  description: "Chia dữ liệu thành K cụm dựa trên khoảng cách đến tâm cụm",
  category: "classic-ml",
  tags: ["clustering", "unsupervised-learning"],
  difficulty: "beginner",
  relatedSlugs: ["dbscan", "knn", "pca"],
  vizType: "interactive",
};

type Pt = { x: number; y: number };

function dist(a: Pt, b: Pt) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function totalWCD(pts: Pt[], centroids: Pt[]) {
  return pts.reduce((s, p) => s + Math.min(...centroids.map((c) => dist(p, c))), 0);
}

/* 18 points in 3 natural clusters */
const DATA: Pt[] = [
  { x: 80, y: 75 }, { x: 115, y: 90 }, { x: 90, y: 120 },
  { x: 120, y: 115 }, { x: 70, y: 105 }, { x: 105, y: 80 },
  { x: 280, y: 65 }, { x: 310, y: 90 }, { x: 295, y: 55 },
  { x: 325, y: 80 }, { x: 285, y: 95 }, { x: 315, y: 70 },
  { x: 180, y: 250 }, { x: 210, y: 280 }, { x: 195, y: 260 },
  { x: 220, y: 295 }, { x: 185, y: 285 }, { x: 215, y: 255 },
];

const COLORS = ["#3b82f6", "#ef4444", "#22c55e"];
const COLOR_NAMES = ["xanh", "đỏ", "xanh lá"];

function assign(pts: Pt[], centroids: Pt[]) {
  return pts.map((p) => {
    let best = 0, minD = Infinity;
    centroids.forEach((c, i) => { const d = dist(p, c); if (d < minD) { minD = d; best = i; } });
    return best;
  });
}

function recompute(pts: Pt[], asgn: number[], centroids: Pt[]) {
  return centroids.map((c, ci) => {
    const m = pts.filter((_, pi) => asgn[pi] === ci);
    if (!m.length) return c;
    return { x: m.reduce((s, p) => s + p.x, 0) / m.length, y: m.reduce((s, p) => s + p.y, 0) / m.length };
  });
}

/* Centroid cross marker (reused) */
function Cross({ c, color }: { c: Pt; color: string }) {
  return (
    <g>
      <line x1={c.x - 7} y1={c.y - 7} x2={c.x + 7} y2={c.y + 7} stroke={color} strokeWidth={3} />
      <line x1={c.x + 7} y1={c.y - 7} x2={c.x - 7} y2={c.y + 7} stroke={color} strokeWidth={3} />
      <circle cx={c.x} cy={c.y} r={3} fill="#fff" />
    </g>
  );
}

/* Auto-animate demo for ToggleCompare (Step 4) */
function InitDemo({ startCentroids }: { startCentroids: Pt[] }) {
  const [centroids, setCentroids] = useState(startCentroids);
  const [iter, setIter] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let i = 0, curr = startCentroids;
    ref.current = setInterval(() => {
      const a = assign(DATA, curr);
      const next = recompute(DATA, a, curr);
      const done = next.every((c, ci) => dist(c, curr[ci]) < 0.5) || i > 15;
      curr = next; i++;
      setCentroids(next); setIter(i);
      if (done && ref.current) clearInterval(ref.current);
    }, 900);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [startCentroids]);

  const asgn = assign(DATA, centroids);
  return (
    <svg viewBox="0 0 400 350" className="w-full rounded-lg border border-border bg-background">
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
        Tổng khoảng cách: {totalWCD(DATA, centroids).toFixed(0)}
      </text>
    </svg>
  );
}

/* ═══════════════ MAIN ═══════════════ */
export default function KMeansTopic() {
  type Phase = "place" | "assigned" | "moved" | "converged";
  const [centroids, setCentroids] = useState<Pt[]>([]);
  const [phase, setPhase] = useState<Phase>("place");
  const [iteration, setIteration] = useState(0);

  const asgn = useMemo(() => (centroids.length === 3 ? assign(DATA, centroids) : []), [centroids]);
  const wcd = useMemo(() => (centroids.length === 3 ? totalWCD(DATA, centroids) : Infinity), [centroids]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (phase !== "place" || centroids.length >= 3) return;
    const svg = e.currentTarget, rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (400 / rect.width);
    const y = (e.clientY - rect.top) * (350 / rect.height);
    setCentroids((prev) => [...prev, { x, y }]);
  }, [phase, centroids.length]);

  const handleAssign = useCallback(() => { setPhase("assigned"); setIteration((i) => i + 1); }, []);

  const handleMove = useCallback(() => {
    const next = recompute(DATA, asgn, centroids);
    setCentroids(next);
    setPhase(next.every((c, ci) => dist(c, centroids[ci]) < 1) ? "converged" : "moved");
  }, [centroids, asgn]);

  const handleIterate = useCallback(() => { setPhase("assigned"); setIteration((i) => i + 1); }, []);

  const handleReset = useCallback(() => {
    setCentroids([]); setPhase("place"); setIteration(0);
  }, []);

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "K-Means thuộc loại học máy nào?",
      options: ["Học có giám sát (Supervised Learning)", "Học không giám sát (Unsupervised Learning)", "Học tăng cường (Reinforcement Learning)"],
      correct: 1,
      explanation: "K-Means là thuật toán phân cụm không giám sát — dữ liệu không có nhãn, thuật toán tự tìm cấu trúc nhóm.",
    },
    {
      question: 'Trong mỗi vòng lặp K-Means, bước "Cập nhật tâm" làm gì?',
      options: ["Xóa tâm cụm có ít điểm nhất", "Di chuyển tâm đến trung bình các điểm trong cụm", "Di chuyển tâm đến điểm dữ liệu gần nhất"],
      correct: 1,
      explanation: "Tâm cụm (centroid) được cập nhật bằng cách tính trung bình tọa độ của tất cả điểm thuộc cụm đó.",
    },
    {
      question: "K-Means++ cải tiến gì so với K-Means gốc?",
      options: ["Tự động chọn số cụm K tối ưu", "Khởi tạo tâm cụm thông minh hơn, tránh đặt gần nhau", "Dùng khoảng cách Manhattan thay vì Euclidean"],
      correct: 1,
      explanation: "K-Means++ chọn tâm ban đầu cách xa nhau, giúp hội tụ nhanh hơn và tránh nghiệm xấu.",
    },
    {
      type: "fill-blank",
      question: "K-Means gán mỗi điểm dữ liệu vào cụm có {blank} gần nhất, sau đó cập nhật tâm cụm bằng cách tính {blank} tọa độ các điểm trong cụm.",
      blanks: [
        { answer: "tâm cụm", accept: ["centroid", "tâm"] },
        { answer: "trung bình", accept: ["mean", "giá trị trung bình"] },
      ],
      explanation: "Hai bước lặp cốt lõi của K-Means: (1) gán điểm đến tâm cụm gần nhất, (2) cập nhật tâm bằng trung bình các điểm trong cụm.",
    },
  ], []);

  const goodInit = useMemo<Pt[]>(() => [{ x: 95, y: 95 }, { x: 300, y: 75 }, { x: 200, y: 270 }], []);
  const badInit = useMemo<Pt[]>(() => [{ x: 50, y: 30 }, { x: 70, y: 40 }, { x: 60, y: 50 }], []);

  const spring = { type: "spring" as const, stiffness: 120, damping: 18 };
  const btnPrimary = "rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90";
  const btnSecondary = "rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground";

  return (
    <>
      {/* STEP 1: HOOK */}
      <PredictionGate
        question="Bạn quản lý 3 kho hàng Grab. 15 tài xế rải rác khắp thành phố. Bạn muốn mỗi tài xế đến kho gần nhất. Làm sao đặt 3 kho cho tối ưu?"
        options={["Đặt ngẫu nhiên", "Đặt ở 3 góc thành phố", "Đặt ở trung tâm mỗi cụm tài xế"]}
        correct={2}
        explanation="Đặt kho ở trung tâm mỗi cụm — đó chính là ý tưởng K-Means!"
      >
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Đặt kho ở trung tâm mỗi cụm — ý tưởng đơn giản nhưng mạnh mẽ. Bây giờ hãy thử với dữ liệu thật: đặt <strong className="text-foreground">3 tâm cụm</strong> trên bản đồ và xem điều kỳ diệu xảy ra.
        </p>

        {/* STEP 2: DISCOVER — User IS the Algorithm */}
        <VisualizationSection>
          <div className="space-y-4">
            <p className="text-sm text-muted">
              {phase === "place" && centroids.length < 3 && (
                <>Nhấp vào canvas để đặt <strong className="text-foreground">{3 - centroids.length} tâm cụm</strong> còn lại ({COLORS.slice(centroids.length).map((_, i) => COLOR_NAMES[centroids.length + i]).join(", ")}).</>
              )}
              {phase === "place" && centroids.length === 3 && (
                <>Đã đặt 3 tâm cụm! Nhấn <strong className="text-foreground">&quot;Gán điểm&quot;</strong> để xem mỗi điểm thuộc cụm nào.</>
              )}
              {phase === "assigned" && (
                <>Mỗi điểm được tô màu theo tâm gần nhất. Nhấn <strong className="text-foreground">&quot;Di chuyển tâm&quot;</strong> để dời tâm về trung bình cụm.</>
              )}
              {phase === "moved" && (
                <>Tâm đã di chuyển! Nhấn <strong className="text-foreground">&quot;Lặp tiếp&quot;</strong> để gán lại và tiếp tục.</>
              )}
              {phase === "converged" && (
                <>Thuật toán đã <strong className="text-green-500">hội tụ</strong> — tâm cụm không thay đổi nữa!</>
              )}
            </p>

            <svg viewBox="0 0 400 350" className="w-full cursor-crosshair rounded-lg border border-border bg-background" onClick={handleCanvasClick}>
              {/* Assignment lines */}
              {phase !== "place" && centroids.length === 3 && DATA.map((p, i) => (
                <motion.line key={`ln-${i}`} x1={p.x} y1={p.y}
                  x2={centroids[asgn[i]].x} y2={centroids[asgn[i]].y}
                  stroke={COLORS[asgn[i]]} strokeWidth={0.8} opacity={0.25}
                  initial={{ opacity: 0 }} animate={{ opacity: 0.25 }}
                  transition={{ duration: 0.4, delay: i * 0.02 }} />
              ))}

              {/* Data points */}
              {DATA.map((p, i) => (
                <motion.circle key={`pt-${i}`} cx={p.x} cy={p.y} r={5}
                  fill={phase !== "place" && centroids.length === 3 ? COLORS[asgn[i]] : "#94a3b8"}
                  stroke="#fff" strokeWidth={1.5} initial={false}
                  animate={{ fill: phase !== "place" && centroids.length === 3 ? COLORS[asgn[i]] : "#94a3b8" }}
                  transition={{ duration: 0.4 }} />
              ))}

              {/* Centroids (animated cross markers) */}
              {centroids.map((c, i) => (
                <motion.g key={`cg-${i}`} initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}>
                  <motion.line x1={c.x - 8} y1={c.y - 8} x2={c.x + 8} y2={c.y + 8}
                    stroke={COLORS[i]} strokeWidth={3}
                    animate={{ x1: c.x - 8, y1: c.y - 8, x2: c.x + 8, y2: c.y + 8 }} transition={spring} />
                  <motion.line x1={c.x + 8} y1={c.y - 8} x2={c.x - 8} y2={c.y + 8}
                    stroke={COLORS[i]} strokeWidth={3}
                    animate={{ x1: c.x + 8, y1: c.y - 8, x2: c.x - 8, y2: c.y + 8 }} transition={spring} />
                  <motion.circle cx={c.x} cy={c.y} r={3} fill="#fff"
                    animate={{ cx: c.x, cy: c.y }} transition={spring} />
                </motion.g>
              ))}

              {/* Stats overlay */}
              {centroids.length === 3 && phase !== "place" && (
                <>
                  <text x={10} y={20} fontSize={12} fill="currentColor" className="text-foreground" fontWeight={600}>
                    Vòng lặp: {iteration}
                  </text>
                  <text x={10} y={38} fontSize={11} fill="currentColor" className="text-muted">
                    Tổng khoảng cách: {wcd.toFixed(0)}
                  </text>
                </>
              )}
            </svg>

            <div className="flex flex-wrap items-center gap-3">
              {phase === "place" && centroids.length === 3 && (
                <button onClick={handleAssign} className={btnPrimary}>Gán điểm</button>
              )}
              {phase === "assigned" && (
                <button onClick={handleMove} className={btnPrimary}>Di chuyển tâm</button>
              )}
              {phase === "moved" && (
                <button onClick={handleIterate} className={btnPrimary}>Lặp tiếp</button>
              )}
              <button onClick={handleReset} className={btnSecondary}>Đặt lại</button>
            </div>

            <AnimatePresence>
              {phase === "converged" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="rounded-lg border border-green-300 bg-green-50 p-3 text-center text-sm font-medium text-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300">
                  Bạn vừa thực hiện {iteration} vòng lặp K-Means! Tâm cụm đã ổn định.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </VisualizationSection>

        {/* STEP 3: REVEAL */}
        <AhaMoment>
          <p>
            Bạn vừa tự tay chạy thuật toán <strong>K-Means Clustering</strong> — gán điểm đến tâm gần nhất, rồi di chuyển tâm đến trung bình cụm. Lặp lại cho đến khi ổn định!
          </p>
        </AhaMoment>

        {/* STEP 4: BAD INITIALIZATION DEMO */}
        <ToggleCompare
          labelA="Khởi tạo tốt" labelB="Khởi tạo xấu"
          description="Vị trí ban đầu của tâm cụm ảnh hưởng lớn đến kết quả. K-Means++ giải quyết vấn đề này."
          childA={<InitDemo startCentroids={goodInit} />}
          childB={<InitDemo startCentroids={badInit} />}
        />

        {/* STEP 5: CHALLENGE */}
        <InlineChallenge
          question="K-Means cần bạn chọn K trước. Nếu dữ liệu có 3 cụm tự nhiên nhưng bạn chọn K=5, chuyện gì xảy ra?"
          options={["Thuật toán báo lỗi", "Một số cụm bị chia nhỏ không cần thiết", "Kết quả giống K=3"]}
          correct={1}
          explanation="K-Means luôn tìm đúng K cụm, nên K=5 sẽ chia nhỏ cụm tự nhiên. Đây là nhược điểm chính — phải chọn K đúng!"
        />

        {/* STEP 6: EXPLAIN */}
        <ExplanationSection>
          <p>
            <strong>K-Means</strong> là thuật toán{" "}<TopicLink slug="supervised-unsupervised-rl"><strong>phân cụm không giám sát</strong></TopicLink>{" "}phổ biến nhất. Nó chia dữ liệu thành K nhóm sao cho tổng khoảng cách trong cụm là nhỏ nhất.
          </p>
          <p><strong>Các bước thuật toán:</strong></p>
          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li><strong>Khởi tạo:</strong> Chọn K tâm cụm (centroid) ban đầu — ngẫu nhiên hoặc bằng K-Means++.</li>
            <li><strong>Gán cụm:</strong> Mỗi điểm dữ liệu được gán cho centroid gần nhất (khoảng cách Euclidean).</li>
            <li><strong>Cập nhật tâm:</strong> Dời mỗi centroid về trung bình tọa độ các điểm trong cụm.</li>
            <li><strong>Lặp lại:</strong> Bước 2-3 lặp cho đến khi centroid không thay đổi (hội tụ).</li>
          </ol>
          <p>
            <strong>Độ phức tạp:</strong> O(n &middot; K &middot; d &middot; i) — với n = số điểm, K = số cụm, d = số chiều, i = số vòng lặp.
          </p>
          <p><strong>Hạn chế:</strong></p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>Phải <strong>chọn K trước</strong> — dùng phương pháp Elbow hoặc Silhouette Score.</li>
            <li><strong>Nhạy với khởi tạo</strong> — giải quyết bằng K-Means++ hoặc chạy nhiều lần. Khác với <TopicLink slug="knn">KNN</TopicLink>, K-Means không cần nhãn dữ liệu.</li>
            <li>Chỉ tìm được <strong>cụm hình cầu</strong> — dùng DBSCAN cho cụm hình dạng tự do.</li>
            <li>Kết quả phụ thuộc vào số chiều — nên dùng <TopicLink slug="feature-engineering">feature engineering</TopicLink> để giảm nhiễu trước khi phân cụm.</li>
          </ul>
          <CodeBlock language="python" title="K-Means với scikit-learn">
{`from sklearn.cluster import KMeans
import numpy as np

X = np.array([[1, 2], [1.5, 1.8], [5, 8],
              [8, 8], [1, 0.6], [9, 11]])

kmeans = KMeans(n_clusters=2, init="k-means++",
                n_init=10, random_state=42)
kmeans.fit(X)

print("Nhãn cụm:", kmeans.labels_)
print("Tâm cụm:", kmeans.cluster_centers_)
print("Inertia:", kmeans.inertia_)`}
          </CodeBlock>
          <Callout variant="tip" title="Chọn K bằng phương pháp Elbow">
            Chạy K-Means với K = 1, 2, 3, ... rồi vẽ đồ thị Inertia (tổng khoảng cách trong cụm) theo K.
            Điểm &quot;khuỷu tay&quot; — nơi đường cong bắt đầu phẳng — chính là K tối ưu.
          </Callout>
        </ExplanationSection>

        {/* STEP 7: SUMMARY */}
        <MiniSummary points={[
          "K-Means chia dữ liệu thành K cụm bằng cách lặp: gán điểm → dời tâm → lặp lại.",
          "Khởi tạo tâm ảnh hưởng lớn — K-Means++ giúp chọn tâm ban đầu thông minh hơn.",
          "Phải chọn K trước — dùng phương pháp Elbow để tìm K tối ưu.",
          "Chỉ hiệu quả với cụm hình cầu — dùng DBSCAN cho cụm hình dạng phức tạp.",
        ]} />

        {/* STEP 8: QUIZ */}
        <QuizSection questions={quizQuestions} />
      </PredictionGate>
    </>
  );
}
