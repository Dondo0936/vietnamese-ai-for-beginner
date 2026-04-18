"use client";
import { useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
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

export const metadata: TopicMeta = {
  slug: "recommendation-systems",
  title: "Recommendation Systems",
  titleVi: "Hệ thống gợi ý",
  description:
    "Hệ thống gợi ý sản phẩm, nội dung dựa trên lọc cộng tác, lọc nội dung và phương pháp lai",
  category: "applied-ai",
  tags: ["collaborative-filtering", "content-based", "personalization"],
  difficulty: "intermediate",
  relatedSlugs: ["embedding-model", "multi-armed-bandit", "k-means"],
  vizType: "interactive",
};

const TOTAL_STEPS = 7;

// ============================================================
// User-Movie rating matrix visualization
// ============================================================
type UserProfile = {
  id: string;
  name: string;
  // Latent taste vector (2D for visualization)
  taste: [number, number];
};

type Movie = {
  id: string;
  title: string;
  genre: string;
  // Latent feature vector (2D: [action-drama, mainstream-indie])
  feature: [number, number];
};

const USERS: UserProfile[] = [
  { id: "U1", name: "An", taste: [0.9, 0.2] },
  { id: "U2", name: "Bình", taste: [0.8, 0.3] },
  { id: "U3", name: "Chi", taste: [-0.7, 0.6] },
  { id: "U4", name: "Dũng", taste: [0.4, -0.7] },
  { id: "U5", name: "Em", taste: [-0.5, -0.8] },
  { id: "U6", name: "Phúc", taste: [0.85, 0.1] },
];

const MOVIES: Movie[] = [
  { id: "M1", title: "Biệt Đội Báo Đen", genre: "Hành động", feature: [0.9, 0.3] },
  { id: "M2", title: "Đất Rừng Phương Nam", genre: "Drama", feature: [-0.6, 0.5] },
  { id: "M3", title: "Nhà Bà Nữ", genre: "Hài / Gia đình", feature: [-0.5, -0.6] },
  { id: "M4", title: "Mắt Biếc", genre: "Lãng mạn", feature: [-0.8, 0.2] },
  { id: "M5", title: "Bố Già", genre: "Drama / Hài", feature: [-0.3, -0.4] },
  { id: "M6", title: "Lật Mặt 7", genre: "Hành động / Hài", feature: [0.6, -0.2] },
  { id: "M7", title: "Ròm", genre: "Indie / Drama", feature: [-0.4, 0.9] },
  { id: "M8", title: "Hai Phượng", genre: "Hành động", feature: [0.95, 0.2] },
];

// Compute "true" rating = dot product of taste and feature, scaled to 1..5
function truthRating(user: UserProfile, movie: Movie): number {
  const dot =
    user.taste[0] * movie.feature[0] + user.taste[1] * movie.feature[1];
  // dot ∈ [-2, 2] roughly → map to 1..5
  const scaled = 3 + dot * 1.4;
  return Math.max(1, Math.min(5, scaled));
}

// Observed ratings: a subset of the true matrix (most missing)
type Observation = {
  userIdx: number;
  movieIdx: number;
  rating: number;
};

function seeded(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 48271) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function buildObservations(seed: number): Observation[] {
  const rand = seeded(seed);
  const observed: Observation[] = [];
  for (let u = 0; u < USERS.length; u++) {
    for (let m = 0; m < MOVIES.length; m++) {
      // ~55% sparsity — each user rates roughly 45% of movies
      if (rand() < 0.45) {
        const trueR = truthRating(USERS[u], MOVIES[m]);
        // add tiny noise, round to 1 decimal
        const noisy = Math.max(1, Math.min(5, trueR + (rand() - 0.5) * 0.4));
        observed.push({
          userIdx: u,
          movieIdx: m,
          rating: Math.round(noisy * 10) / 10,
        });
      }
    }
  }
  return observed;
}

function cosineSim(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// Predict missing ratings using user-based CF:
// weighted average of similar users' ratings
function predictCF(
  observed: Observation[],
  targetUser: number,
  targetMovie: number,
): { prediction: number; neighbors: Array<{ user: number; sim: number }> } {
  // Build per-user rating vector over all movies (NaN=missing)
  const ratingVec: number[][] = USERS.map(() =>
    MOVIES.map(() => Number.NaN),
  );
  for (const obs of observed) {
    ratingVec[obs.userIdx][obs.movieIdx] = obs.rating;
  }

  const targetVec = ratingVec[targetUser];
  const meanTarget = mean(targetVec.filter((x) => !Number.isNaN(x)));

  const sims: Array<{ user: number; sim: number }> = [];
  for (let u = 0; u < USERS.length; u++) {
    if (u === targetUser) continue;
    // Only compare on movies both rated
    const aligned: number[] = [];
    const alignedOther: number[] = [];
    for (let m = 0; m < MOVIES.length; m++) {
      if (!Number.isNaN(targetVec[m]) && !Number.isNaN(ratingVec[u][m])) {
        aligned.push(targetVec[m]);
        alignedOther.push(ratingVec[u][m]);
      }
    }
    if (aligned.length < 2) continue;
    const sim = cosineSim(
      aligned.map((x) => x - meanTarget),
      alignedOther.map(
        (x) => x - mean(ratingVec[u].filter((v) => !Number.isNaN(v))),
      ),
    );
    sims.push({ user: u, sim });
  }

  sims.sort((a, b) => b.sim - a.sim);
  const topK = sims.slice(0, 3).filter((s) => s.sim > 0);

  // Weighted prediction, only count neighbors who rated target movie
  let num = 0;
  let den = 0;
  const usedNeighbors: Array<{ user: number; sim: number }> = [];
  for (const n of topK) {
    const r = ratingVec[n.user][targetMovie];
    if (!Number.isNaN(r)) {
      const neighborMean = mean(
        ratingVec[n.user].filter((v) => !Number.isNaN(v)),
      );
      num += n.sim * (r - neighborMean);
      den += Math.abs(n.sim);
      usedNeighbors.push(n);
    }
  }

  let prediction = meanTarget;
  if (den > 0) prediction = meanTarget + num / den;
  prediction = Math.max(1, Math.min(5, prediction));
  return { prediction, neighbors: usedNeighbors };
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  let s = 0;
  for (const v of arr) s += v;
  return s / arr.length;
}

function ratingColor(rating: number | null): string {
  if (rating === null) return "#1f2937";
  // rating 1..5 mapped to red-yellow-green
  const t = (rating - 1) / 4;
  const r = Math.round(220 - t * 120);
  const g = Math.round(80 + t * 150);
  const b = Math.round(70 + t * 40);
  return `rgb(${r}, ${g}, ${b})`;
}

// ============================================================
// The viz component
// ============================================================
function CollaborativeFilteringViz() {
  const [seed, setSeed] = useState(21);
  const [hoverCell, setHoverCell] = useState<{
    user: number;
    movie: number;
  } | null>(null);
  const [showPredictions, setShowPredictions] = useState(false);

  const observed = useMemo(() => buildObservations(seed), [seed]);

  const grid: Array<Array<number | null>> = useMemo(() => {
    const g: Array<Array<number | null>> = USERS.map(() =>
      MOVIES.map(() => null),
    );
    for (const obs of observed) {
      g[obs.userIdx][obs.movieIdx] = obs.rating;
    }
    return g;
  }, [observed]);

  const predictions = useMemo(() => {
    const preds: Array<
      Array<{ pred: number; neighbors: Array<{ user: number; sim: number }> } | null>
    > = USERS.map(() => MOVIES.map(() => null));
    for (let u = 0; u < USERS.length; u++) {
      for (let m = 0; m < MOVIES.length; m++) {
        if (grid[u][m] === null) {
          const { prediction, neighbors } = predictCF(observed, u, m);
          preds[u][m] = { pred: prediction, neighbors };
        }
      }
    }
    return preds;
  }, [observed, grid]);

  const reshuffle = useCallback(() => {
    setSeed((s) => (s + 13) % 9973);
  }, []);

  const cellWidth = 56;
  const cellHeight = 42;
  const headerHeight = 70;
  const userLabelWidth = 60;
  const gridWidth = userLabelWidth + MOVIES.length * cellWidth;
  const gridHeight = headerHeight + USERS.length * cellHeight;

  // Compute total stats
  const totalCells = USERS.length * MOVIES.length;
  const observedCount = observed.length;
  const missingCount = totalCells - observedCount;
  const sparsity = (missingCount / totalCells) * 100;

  // Neighbor highlight
  const hoverPred =
    hoverCell && grid[hoverCell.user][hoverCell.movie] === null
      ? predictions[hoverCell.user][hoverCell.movie]
      : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-200">
            Ma trận User × Phim
          </h4>
          <p className="text-xs text-slate-400">
            Ô có số = rating quan sát được. Ô trống = chưa xem → CF phải đoán.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reshuffle}
            className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
          >
            Tạo ma trận mới
          </button>
          <button
            type="button"
            onClick={() => setShowPredictions((s) => !s)}
            className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
          >
            {showPredictions ? "Ẩn" : "Hiện"} dự đoán CF
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 overflow-x-auto">
        <svg viewBox={`0 0 ${gridWidth} ${gridHeight}`} className="w-full min-w-[640px]">
          {/* Movie header labels */}
          {MOVIES.map((movie, m) => {
            const x = userLabelWidth + m * cellWidth + cellWidth / 2;
            return (
              <g key={movie.id}>
                <text
                  x={x}
                  y={20}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize={9}
                  fontWeight={600}
                >
                  {movie.id}
                </text>
                <text
                  x={x}
                  y={34}
                  textAnchor="middle"
                  fill="#cbd5e1"
                  fontSize={8}
                >
                  {movie.title.length > 11
                    ? movie.title.slice(0, 10) + "…"
                    : movie.title}
                </text>
                <text
                  x={x}
                  y={48}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize={7}
                >
                  {movie.genre}
                </text>
              </g>
            );
          })}

          {/* User rows */}
          {USERS.map((user, u) => (
            <g key={user.id}>
              <text
                x={4}
                y={headerHeight + u * cellHeight + cellHeight / 2 + 4}
                fill="#e2e8f0"
                fontSize={10}
                fontWeight={600}
              >
                {user.name}
              </text>
              <text
                x={4}
                y={headerHeight + u * cellHeight + cellHeight / 2 + 16}
                fill="#64748b"
                fontSize={8}
              >
                {user.id}
              </text>
            </g>
          ))}

          {/* Cells */}
          {USERS.map((user, u) =>
            MOVIES.map((movie, m) => {
              const x = userLabelWidth + m * cellWidth;
              const y = headerHeight + u * cellHeight;
              const rating = grid[u][m];
              const isMissing = rating === null;
              const isHovered =
                hoverCell?.user === u && hoverCell?.movie === m;
              const pred = predictions[u][m];
              const isNeighborRow =
                hoverPred?.neighbors.some((n) => n.user === u) ?? false;
              const isNeighborCol =
                hoverPred && hoverCell?.movie === m ? true : false;

              let fill = ratingColor(rating);
              if (isMissing && showPredictions && pred) {
                // Show predicted rating in subtle color
                fill = ratingColor(pred.pred);
              }

              const opacity = isMissing && !showPredictions ? 0.25 : 1;

              return (
                <g
                  key={`${u}-${m}`}
                  onMouseEnter={() => setHoverCell({ user: u, movie: m })}
                  onMouseLeave={() => setHoverCell(null)}
                  style={{ cursor: "pointer" }}
                >
                  <motion.rect
                    x={x + 2}
                    y={y + 2}
                    width={cellWidth - 4}
                    height={cellHeight - 4}
                    rx={4}
                    initial={false}
                    animate={{ fill, opacity }}
                    stroke={
                      isHovered
                        ? "#fbbf24"
                        : isNeighborRow || (isNeighborCol && !isMissing)
                          ? "#60a5fa"
                          : "#334155"
                    }
                    strokeWidth={isHovered ? 2 : isNeighborRow ? 1.5 : 0.5}
                  />
                  {!isMissing && (
                    <text
                      x={x + cellWidth / 2}
                      y={y + cellHeight / 2 + 4}
                      textAnchor="middle"
                      fill="#0f172a"
                      fontSize={12}
                      fontWeight={700}
                    >
                      {rating?.toFixed(1)}
                    </text>
                  )}
                  {isMissing && showPredictions && pred && (
                    <text
                      x={x + cellWidth / 2}
                      y={y + cellHeight / 2 + 4}
                      textAnchor="middle"
                      fill="#0f172a"
                      fontSize={11}
                      fontStyle="italic"
                      fontWeight={600}
                    >
                      ~{pred.pred.toFixed(1)}
                    </text>
                  )}
                  {isMissing && !showPredictions && (
                    <text
                      x={x + cellWidth / 2}
                      y={y + cellHeight / 2 + 5}
                      textAnchor="middle"
                      fill="#475569"
                      fontSize={14}
                    >
                      ?
                    </text>
                  )}
                </g>
              );
            }),
          )}
        </svg>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-md border border-slate-800 bg-slate-900 p-3 text-xs">
          <div className="text-slate-400">Tổng ô</div>
          <div className="text-lg font-semibold text-slate-100">
            {totalCells}
          </div>
          <div className="text-[10px] text-slate-500">
            {USERS.length} users × {MOVIES.length} phim
          </div>
        </div>
        <div className="rounded-md border border-emerald-900 bg-emerald-950/30 p-3 text-xs">
          <div className="text-emerald-400">Đã quan sát</div>
          <div className="text-lg font-semibold text-emerald-200">
            {observedCount}
          </div>
          <div className="text-[10px] text-slate-500">
            {((observedCount / totalCells) * 100).toFixed(0)}% ô có rating
          </div>
        </div>
        <div className="rounded-md border border-amber-900 bg-amber-950/30 p-3 text-xs">
          <div className="text-amber-400">Thiếu (sparsity)</div>
          <div className="text-lg font-semibold text-amber-200">
            {sparsity.toFixed(0)}%
          </div>
          <div className="text-[10px] text-slate-500">
            Shopee thực tế: &gt; 99.99%
          </div>
        </div>
      </div>

      {hoverPred && hoverCell && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-md border border-sky-700 bg-sky-950/40 p-3 text-xs leading-relaxed text-sky-100"
        >
          <div className="font-semibold">
            CF dự đoán rating của {USERS[hoverCell.user].name} cho{" "}
            {MOVIES[hoverCell.movie].title}
          </div>
          <div className="mt-1 text-slate-300">
            Dự đoán:{" "}
            <span className="font-mono text-amber-300">
              {hoverPred.pred.toFixed(2)}
            </span>{" "}
            /5 · dựa trên {hoverPred.neighbors.length} hàng xóm gần nhất
          </div>
          <ul className="mt-1 list-disc pl-5 text-[11px] text-slate-300">
            {hoverPred.neighbors.map((n) => (
              <li key={n.user}>
                {USERS[n.user].name} — similarity ={" "}
                <span className="font-mono">{n.sim.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      <div className="text-xs text-slate-400">
        <span className="font-semibold text-slate-200">Cách đọc: </span>
        Di chuột qua 1 ô trống (có dấu ?) để xem CF tìm ai là hàng xóm gần
        nhất và tổng hợp rating của họ thành dự đoán. Bật &quot;Hiện dự đoán
        CF&quot; để xem toàn bộ ma trận sau khi fill-in.
      </div>
    </div>
  );
}

// ============================================================
// Topic component
// ============================================================
export default function RecommendationSystemsTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question: "Collaborative Filtering hoạt động thế nào?",
        options: [
          "Phân tích nội dung sản phẩm",
          "Tìm USER TƯƠNG TỰ bạn (thích cùng sản phẩm) → gợi ý sản phẩm họ thích mà bạn chưa dùng",
          "Dùng rule-based",
        ],
        correct: 1,
        explanation:
          "CF: 'Người giống bạn thích gì?' Bạn và An đều thích Phở, Bún chả. An thích Bún bò Huế nhưng bạn chưa ăn → gợi ý Bún bò Huế cho bạn. Không cần hiểu nội dung sản phẩm — chỉ dựa trên pattern tương tác của users.",
      },
      {
        question: "Cold start problem là gì và giải pháp?",
        options: [
          "Server khởi động chậm",
          "User/item MỚI không có lịch sử tương tác → CF không hoạt động. Giải pháp: content-based (dựa trên attributes), popularity-based, hoặc hỏi user preferences",
          "Model quá lớn",
        ],
        correct: 1,
        explanation:
          "User mới: chưa rating gì → không biết tương tự ai. Item mới: chưa ai rating → không thể CF. Giải pháp: (1) Content-based: gợi ý dựa trên attributes (thể loại, giá), (2) Popularity: gợi ý sản phẩm hot, (3) Onboarding: hỏi 'bạn thích gì?'",
      },
      {
        question: "Tại sao Shopee dùng Hybrid (CF + Content + Deep Learning)?",
        options: [
          "Vì có nhiều data",
          "MỖI phương pháp có điểm yếu riêng. Hybrid kết hợp: CF cho personalization, Content cho cold start, DL học patterns phức tạp từ behavior",
          "Để marketing",
        ],
        correct: 1,
        explanation:
          "CF mạnh ở personalization nhưng cold start. Content tốt cho cold start nhưng không capture subtle preferences. DL (Two-Tower, DSSM) học embedding từ nhiều signals (click, time, scroll). Hybrid kết hợp tất cả → tốt hơn bất kỳ phương pháp đơn lẻ nào.",
      },
      {
        type: "fill-blank",
        question:
          "Hai phương pháp kinh điển của recommender system là {blank} filtering (tìm user tương tự) và {blank}-based filtering (dựa trên đặc trưng sản phẩm).",
        blanks: [
          { answer: "collaborative", accept: ["cộng tác", "hợp tác", "CF"] },
          { answer: "content", accept: ["nội dung", "content-based"] },
        ],
        explanation:
          "Collaborative filtering: 'Người giống bạn thích gì?' — dùng ma trận user-item. Content-based: 'Sản phẩm có đặc trưng giống sản phẩm bạn từng thích' — dùng attributes/embeddings. Hybrid kết hợp cả hai để giải quyết cold start và personalization.",
      },
      {
        question:
          "Matrix Factorization phân rã R (m × n) thành U (m × k) và V (n × k). Vai trò của k?",
        options: [
          "Số user",
          "Số item",
          "LATENT DIMENSIONS: biểu diễn 'sở thích ẩn' của user và 'đặc trưng ẩn' của item. k thường 32-256",
        ],
        correct: 2,
        explanation:
          "k là số latent factor. Mỗi user được biểu diễn bằng vector k chiều (ví dụ: [thích hành động, thích indie, thích hài...]). Tương tự với item. Prediction = dot product u · v. k nhỏ → model đơn giản, miss pattern. k lớn → overfit, tốn bộ nhớ. Thường 32-256.",
      },
      {
        question:
          "Filter bubble trong recommender system là vấn đề gì?",
        options: [
          "Server lỗi",
          "User bị 'mắc kẹt' trong vòng lặp: chỉ xem cái giống mình → AI chỉ gợi ý cái đó → thế giới quan thu hẹp lại",
          "Model quá lớn",
        ],
        correct: 1,
        explanation:
          "Filter bubble là hệ quả xã hội của personalization cực đoan. YouTube radicalization, echo chamber chính trị đều bắt nguồn từ đây. Giải pháp: exploration (multi-armed bandit), diversity constraint, serendipity — đôi khi gợi ý thứ bất ngờ.",
      },
      {
        question:
          "Two-Tower model có lợi thế gì so với Matrix Factorization kinh điển?",
        options: [
          "Chạy nhanh hơn",
          "Dùng được FEATURE (text, image, context) không chỉ ID. Item mới có embedding ngay, cold start nhẹ hơn",
          "Dễ code hơn",
        ],
        correct: 1,
        explanation:
          "MF chỉ học embedding từ rating matrix → item mới không có embedding (cold start). Two-Tower: item tower ăn feature (text description, image, metadata) → item mới có embedding ngay sau khi upload. Đây là lý do YouTube, Shopee, TikTok dùng Two-Tower.",
      },
      {
        question:
          "Khi đánh giá recommender system offline, metric nào KHÔNG phản ánh tốt trải nghiệm thực tế?",
        options: [
          "nDCG@10",
          "RMSE trên rating dự đoán — vì user thực tế không care sai số tuyệt đối, họ chỉ care thứ tự top items",
          "Recall@50",
        ],
        correct: 1,
        explanation:
          "RMSE đo sai số trên rating dự đoán (ví dụ dự đoán 4.2 thực tế 4.5). Nhưng user chỉ nhìn top 10 gợi ý — họ không care rating tuyệt đối mà care XẾP HẠNG. Ranking metrics (nDCG, MAP, Recall@K, Hit@K) phù hợp hơn. Đó là lý do Netflix Prize chuyển dần khỏi RMSE.",
      },
    ],
    [],
  );

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn mua tai nghe trên Shopee. Ngày hôm sau, Shopee gợi ý 10 sản phẩm mà bạn CHƯA TÌM nhưng đều thích. Shopee biết thế nào?"
          options={[
            "Đoán ngẫu nhiên",
            "Hệ thống gợi ý: phân tích lịch sử mua/xem của BẠN + người TƯƠNG TỰ → dự đoán bạn thích gì",
            "Nhân viên Shopee chọn thủ công",
          ]}
          correct={1}
          explanation="Recommendation System: (1) Tìm người tương tự bạn (mua cùng loại tai nghe), (2) Xem họ mua gì khác (case, sạc dự phòng), (3) Gợi ý cho bạn. Kết hợp với nội dung sản phẩm + deep learning → 10 gợi ý chính xác. Shopee, Netflix, YouTube đều dùng!"
        >
          <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
            <VisualizationSection>
              <CollaborativeFilteringViz />
            </VisualizationSection>

            <Callout variant="tip" title="Cách đọc visualization">
              Ma trận trên là phiên bản thu nhỏ của điều đang xảy ra tại
              Shopee / Netflix. Ô có số = rating đã biết (user đã xem/mua).
              Ô có dấu &quot;?&quot; = thiếu. Di chuột vào 1 ô trống để thấy
              CF chọn 3 hàng xóm gần nhất và dùng rating của họ để dự đoán.
              Bật &quot;Hiện dự đoán CF&quot; để xem toàn ma trận sau khi
              fill-in.
            </Callout>
          </LessonSection>

          <LessonSection
            step={3}
            totalSteps={TOTAL_STEPS}
            label="Khoảnh khắc Aha"
          >
            <AhaMoment>
              <p>
                35% doanh thu Amazon đến từ recommendations. 80% nội dung
                Netflix xem là từ gợi ý. Hệ thống gợi ý là{" "}
                <strong>công cụ tăng trưởng mạnh nhất</strong> của e-commerce
                và streaming. Shopee Việt Nam cũng dùng tương tự: CF + Content
                + Deep Learning cho 50 triệu user.
              </p>
              <p>
                Điều kỳ diệu của CF: <strong>không cần hiểu nội dung</strong>.
                Model không biết &quot;Hai Phượng&quot; là phim hành động —
                nó chỉ biết An và Phúc đều rating cao phim này, và cả hai
                cùng thích &quot;Lật Mặt 7&quot;. Từ pattern đồng thuận, nó
                suy ra &quot;sở thích ẩn&quot; mà không cần metadata.
              </p>
            </AhaMoment>
          </LessonSection>

          <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
            <InlineChallenge
              question="Shopee có 50M users, 100M items. Matrix user-item rating có bao nhiêu ô? Và bao nhiêu % là trống (sparse)?"
              options={[
                "5 x 10^15 ô, nhưng 99.99%+ là trống vì mỗi user chỉ tương tác với vài trăm items",
                "5 triệu ô, 50% trống",
                "Không nhiều",
              ]}
              correct={0}
              explanation="5 x 10^15 = 5000 tỷ ô! Nhưng mỗi user chỉ tương tác ~200-500 items → 99.99% ô trống. Đây là 'sparsity problem' — collaborative filtering khó khi matrix quá sparse. Giải pháp: matrix factorization (SVD) nén 50M x 100M xuống embeddings 50M x 128 + 100M x 128."
            />

            <InlineChallenge
              question="TikTok biết bạn thích gì sau 40 video xem. Cơ chế nào đóng vai trò CHÍNH?"
              options={[
                "User điền form sở thích",
                "Implicit feedback từ hành vi: thời gian xem, replay, like, share, scroll-past — tín hiệu mạnh hơn rating rõ ràng",
                "Gắn GPS vào user",
              ]}
              correct={1}
              explanation="Implicit feedback (watch time, replay, scroll-past) chính xác hơn explicit rating vì user không nói dối. TikTok collect hàng chục signals cho mỗi video, feed vào Two-Tower / transformer để học embedding user và video. Đây là thành phần chính của 'For You' feed."
            />

            <InlineChallenge
              question="Netflix lớn trên ma trận đánh giá 1-5 sao. Sau 2017 họ bỏ 5-sao, thay bằng thumbs up/down. Vì sao?"
              options={[
                "Đơn giản hơn cho user",
                "Rating 5-sao BIASED nặng: user rate phim 'nghệ thuật' cao nhưng xem hài nhẹ. Binary feedback gần với hành vi thực hơn",
                "Tiết kiệm database",
              ]}
              correct={1}
              explanation="Netflix phát hiện user rate phim 'cao cấp' điểm cao nhưng xem phim giải trí. Nếu train recommender trên rating 5-sao → gợi ý phim khó xem → engagement giảm. Thumbs up/down + watch data = tín hiệu thật hơn. Đây là bài học: đánh giá phải khớp với mục tiêu kinh doanh (engagement, không phải taste lý tưởng)."
            />
          </LessonSection>

          <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
            <ExplanationSection>
              <p>
                <strong>Recommendation Systems</strong> gợi ý sản phẩm/nội
                dung dựa trên lịch sử và sở thích — đằng sau 35% doanh thu
                Amazon và 80% content Netflix. Ba họ phương pháp lớn:
                collaborative filtering (dựa vào pattern tương tác), content-based
                (dựa vào thuộc tính), và hybrid deep learning (kết hợp cả
                hai + signals phụ).
              </p>

              <p>
                <strong>Matrix Factorization (CF):</strong>
              </p>
              <LaTeX block>
                {
                  "R \\approx U \\cdot V^T \\quad \\text{(user matrix } U \\in \\mathbb{R}^{m \\times k} \\text{, item matrix } V \\in \\mathbb{R}^{n \\times k} \\text{)}"
                }
              </LaTeX>
              <LaTeX block>
                {
                  "\\hat{r}_{ui} = u_i^T \\cdot v_j + b_u + b_i + \\mu \\quad \\text{(dự đoán rating)}"
                }
              </LaTeX>

              <p>
                <strong>User-based Collaborative Filtering</strong> — công
                thức cổ điển dùng weighted average từ hàng xóm gần nhất:
              </p>
              <LaTeX block>
                {
                  "\\hat{r}_{ui} = \\bar{r}_u + \\frac{\\sum_{v \\in N_u} \\text{sim}(u, v) \\cdot (r_{vi} - \\bar{r}_v)}{\\sum_{v \\in N_u} |\\text{sim}(u, v)|}"
                }
              </LaTeX>

              <p>
                Ở đây <LaTeX>{"\\bar{r}_u"}</LaTeX> là rating trung bình của
                user u, <LaTeX>{"N_u"}</LaTeX> là tập hàng xóm (user tương
                tự), và <LaTeX>{"\\text{sim}(u, v)"}</LaTeX> thường là cosine
                similarity hoặc Pearson correlation. Chuẩn hoá về mean giúp
                tránh bias do user &quot;khó tính&quot; (rating trung bình
                thấp) hay &quot;dễ tính&quot; (trung bình cao).
              </p>

              <Callout variant="tip" title="Two-Tower Model">
                Deep Learning cho RecSys: 2 neural networks (user tower +
                item tower) tạo{" "}
                <TopicLink slug="embedding-model">embeddings</TopicLink>.
                Similarity = dot product — cùng nguyên lý với{" "}
                <TopicLink slug="semantic-search">semantic search</TopicLink>.
                Training: contrastive learning (positive pairs + negative
                sampling). Serving: ANN search (FAISS) cho real-time. Đây
                là kiến trúc của Shopee, YouTube, TikTok.
              </Callout>

              <Callout variant="insight" title="Vì sao dot product?">
                Dot product <LaTeX>{"u \\cdot v"}</LaTeX> trong latent space
                đo mức độ &quot;khớp sở thích&quot;: nếu user vector u có
                chiều &quot;thích hài&quot; cao và item vector v cũng có
                chiều &quot;phim hài&quot; cao, tích của chúng lớn → rating
                dự đoán cao. Model không cần định nghĩa trước các chiều;
                training tự tìm ra. Đây là lý do embedding model là nền tảng
                chung của RecSys, semantic search, và RAG.
              </Callout>

              <CodeBlock language="python" title="Matrix Factorization với surprise">
                {`from surprise import SVD, Dataset, Reader
from surprise.model_selection import cross_validate

# Load data (user_id, item_id, rating)
reader = Reader(rating_scale=(1, 5))
data = Dataset.load_from_df(ratings_df, reader)

# Matrix Factorization (SVD)
model = SVD(n_factors=128, n_epochs=20, lr_all=0.005, reg_all=0.02)
results = cross_validate(model, data, cv=5, measures=["RMSE"])
print(f"RMSE: {results['test_rmse'].mean():.3f}")

# Dự đoán rating cho user 42, item 1234
model.fit(data.build_full_trainset())
pred = model.predict("user_42", "item_1234")
print(f"Predicted rating: {pred.est:.2f}")

# Top-N recommendations cho user 42
all_items = get_all_items()
predictions = [(item, model.predict("user_42", item).est)
               for item in all_items if item not in user_42_history]
top_10 = sorted(predictions, key=lambda x: x[1], reverse=True)[:10]`}
              </CodeBlock>

              <CodeBlock
                language="python"
                title="Two-Tower model với PyTorch (rút gọn)"
              >
                {`import torch
import torch.nn as nn
import torch.nn.functional as F

class Tower(nn.Module):
    def __init__(self, input_dim, hidden=256, emb=128):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden), nn.ReLU(),
            nn.Linear(hidden, hidden), nn.ReLU(),
            nn.Linear(hidden, emb),
        )

    def forward(self, x):
        # L2-normalize để dot product ~ cosine similarity
        return F.normalize(self.net(x), dim=-1)

class TwoTower(nn.Module):
    def __init__(self, user_dim, item_dim, emb=128):
        super().__init__()
        self.user_tower = Tower(user_dim, emb=emb)
        self.item_tower = Tower(item_dim, emb=emb)

    def forward(self, user_feat, item_feat):
        u = self.user_tower(user_feat)
        v = self.item_tower(item_feat)
        return (u * v).sum(dim=-1)  # dot product

# Training với in-batch negative sampling
def train_step(model, user_feat, pos_item_feat, optimizer):
    # Positive scores (diagonal)
    u = model.user_tower(user_feat)           # [B, D]
    v_pos = model.item_tower(pos_item_feat)   # [B, D]
    logits = u @ v_pos.t()                     # [B, B]
    labels = torch.arange(u.size(0), device=u.device)
    loss = F.cross_entropy(logits, labels)
    loss.backward()
    optimizer.step()
    optimizer.zero_grad()
    return loss.item()

# Serving: index item embeddings với FAISS, query bằng user embedding
# for real-time top-K search across millions of items in <10ms`}
              </CodeBlock>

              <Callout variant="warning" title="Cold start">
                Hệ thống CF kinh điển fail với user/item hoàn toàn mới — không
                có rating để suy ra hàng xóm. Giải pháp phân tầng: (1) hỏi
                onboarding preference, (2) dùng attribute / metadata qua
                content-based model, (3) trending / popularity fallback, (4)
                explore bằng multi-armed bandit. Khi user đã có &gt;5 tương
                tác → chuyển sang CF.
              </Callout>

              <Callout variant="info" title="RecSys tại Việt Nam">
                Shopee VN dùng hybrid: CF cho user có lịch sử, content-based
                cho user mới, và deep learning (Two-Tower + DSSM) cho chính
                feed. FPT Play cá nhân hoá nội dung video theo region, thời
                gian xem. Zing MP3 dùng CF trên hành vi nghe. Các startup
                như Tiki, Lazada VN có đội RecSys 30-80 người xử lý hàng tỷ
                event mỗi ngày.
              </Callout>

              <p>
                <strong>Implicit vs Explicit feedback.</strong> Explicit:
                user chủ động rating (5 sao). Implicit: suy ra từ hành vi
                (click, watch time, dwell, share, scroll-past). Thực tế
                implicit feedback phổ biến hơn vì ít user chịu rating. Model
                phù hợp: ALS với confidence weighting, BPR (Bayesian
                Personalized Ranking), hoặc neural ranking loss.
              </p>

              <p>
                <strong>Sampling &amp; Ranking Pipeline.</strong> Hệ thống
                sản xuất không bao giờ score toàn bộ 100M items. Thay vào
                đó là 3 tầng:
              </p>
              <ol className="list-decimal pl-5">
                <li>
                  <strong>Retrieval / Candidate generation:</strong> Two-Tower
                  + FAISS lấy 1000 items ứng viên trong &lt;10ms.
                </li>
                <li>
                  <strong>Ranking:</strong> model lớn hơn (DeepFM, DIN,
                  Transformer) re-rank 1000 items theo CTR / watch-time.
                </li>
                <li>
                  <strong>Re-ranking &amp; business logic:</strong> diversity,
                  fairness, giới hạn repeat, inject quảng cáo, constraint
                  (ví dụ không gợi ý nội dung NSFW cho tài khoản minor).
                </li>
              </ol>

              <p>
                <strong>Exploration vs Exploitation.</strong> Nếu model chỉ
                gợi ý thứ nó chắc user thích, hệ thống sẽ sa vào{" "}
                <TopicLink slug="multi-armed-bandit">filter bubble</TopicLink>.
                Thuật toán thực tế luôn dành 5-15% traffic cho exploration
                — gợi ý item lạ để thu thêm feedback và khám phá taste mới.
                Thompson sampling, ε-greedy, UCB là các kỹ thuật phổ biến.
              </p>

              <p>
                <strong>Content-Based Filtering — công thức.</strong> Ta
                biểu diễn mỗi item bằng vector đặc trưng (TF-IDF của mô
                tả, embedding CLIP của ảnh, one-hot genre…). User được
                biểu diễn bằng centroid các item họ đã thích:
              </p>
              <LaTeX block>
                {
                  "u = \\frac{1}{|I_u|} \\sum_{i \\in I_u} w_{ui} \\cdot x_i, \\quad \\text{sim}(u, j) = \\cos(u, x_j)"
                }
              </LaTeX>
              <p>
                Trong đó <LaTeX>{"I_u"}</LaTeX> là tập item user đã tương
                tác, <LaTeX>{"w_{ui}"}</LaTeX> là trọng số (rating, watch
                time) và <LaTeX>{"x_i"}</LaTeX> là vector feature của
                item. Ưu điểm: xử lý cold start item tốt (item mới có
                embedding ngay). Nhược điểm: không khám phá sở thích lạ,
                dễ rơi vào filter bubble.
              </p>

              <p>
                <strong>Regularization trong Matrix Factorization.</strong>{" "}
                Loss thường viết dưới dạng:
              </p>
              <LaTeX block>
                {
                  "\\mathcal{L} = \\sum_{(u,i) \\in \\mathcal{R}} (r_{ui} - u_i^T v_j - b_u - b_i - \\mu)^2 + \\lambda (\\|U\\|^2 + \\|V\\|^2 + b_u^2 + b_i^2)"
                }
              </LaTeX>
              <p>
                Thành phần L2 penalty ngăn embedding vector &quot;nổ&quot;
                — đặc biệt quan trọng với user/item có ít rating. Giá trị{" "}
                <LaTeX>{"\\lambda"}</LaTeX> thường chọn qua cross-validation,
                trong khoảng 0.001 đến 0.1.
              </p>

              <CollapsibleDetail title="Các loss function cho RecSys">
                <p>
                  RecSys không dùng 1 loss chung — mỗi bài toán có loss phù
                  hợp:
                </p>
                <ul className="list-disc pl-5 leading-relaxed">
                  <li>
                    <strong>MSE / RMSE:</strong> cho rating prediction kinh
                    điển (Netflix Prize). Tốt cho explicit rating, kém cho
                    implicit.
                  </li>
                  <li>
                    <strong>BPR (Bayesian Personalized Ranking):</strong>{" "}
                    pairwise loss: đảm bảo item user thích được rank cao
                    hơn item random. Phù hợp cho implicit feedback.
                  </li>
                  <li>
                    <strong>Softmax / Sampled Softmax:</strong> xem mỗi user
                    như 1 &quot;câu hỏi&quot;, positive item là đáp án đúng
                    giữa nhiều negative. Dùng rộng trong Two-Tower.
                  </li>
                  <li>
                    <strong>InfoNCE / Contrastive:</strong> positive pair
                    (user, item đã mua) vs negative pair (user, item random).
                    Cùng họ với SimCLR, CLIP.
                  </li>
                  <li>
                    <strong>Hinge / Triplet loss:</strong> encourage
                    khoảng cách giữa positive và negative &gt; margin. Phổ
                    biến trong metric learning.
                  </li>
                  <li>
                    <strong>Listwise (ListNet, ListMLE):</strong> optimize
                    trực tiếp metric ranking như nDCG. Đắt hơn nhưng gần với
                    đánh giá thực tế.
                  </li>
                </ul>
              </CollapsibleDetail>

              <CollapsibleDetail title="Đánh giá recommender system">
                <p>
                  Đánh giá offline (trên data lịch sử) và online (A/B test)
                  là hai thế giới. Offline tốt không đảm bảo online tốt — đây
                  là thực tế cay đắng của RecSys.
                </p>
                <p>
                  <strong>Metric offline phổ biến:</strong>
                </p>
                <ul className="list-disc pl-5 leading-relaxed">
                  <li>
                    <strong>RMSE / MAE:</strong> đo sai số rating — cổ điển
                    từ Netflix Prize, nhưng không phản ánh thứ tự.
                  </li>
                  <li>
                    <strong>Precision@K, Recall@K:</strong> trong top-K gợi
                    ý, bao nhiêu user thích? Phụ thuộc K.
                  </li>
                  <li>
                    <strong>nDCG@K:</strong> Normalized Discounted Cumulative
                    Gain — thưởng nhiều hơn nếu item hay ở vị trí cao.
                    Gần nhất với cảm nhận user.
                  </li>
                  <li>
                    <strong>MAP (Mean Average Precision):</strong> trung bình
                    precision qua các ngưỡng K.
                  </li>
                  <li>
                    <strong>Hit@K:</strong> có ít nhất 1 item đúng trong
                    top-K không? Phù hợp next-item prediction.
                  </li>
                  <li>
                    <strong>Diversity / Novelty / Serendipity:</strong> đo
                    mức đa dạng của gợi ý — cân bằng với relevance.
                  </li>
                  <li>
                    <strong>Coverage:</strong> tỉ lệ catalog được gợi ý ít
                    nhất 1 lần. Coverage thấp = long-tail item bị bỏ quên.
                  </li>
                </ul>
                <p>
                  <strong>Metric online (A/B test):</strong> CTR, conversion
                  rate, watch time, session length, DAU retention, GMV, ARPU.
                  Đây mới là thước đo business thực sự.
                </p>
              </CollapsibleDetail>

              <CollapsibleDetail title="Các pitfall khi build RecSys">
                <p>Một số bẫy phổ biến mà đội RecSys nào cũng từng vấp:</p>
                <ul className="list-disc pl-5 leading-relaxed">
                  <li>
                    <strong>Data leakage thời gian:</strong> train/test
                    split ngẫu nhiên → model nhìn thấy tương lai. Phải split
                    theo thời gian (temporal split).
                  </li>
                  <li>
                    <strong>Popularity bias:</strong> item phổ biến được
                    recommend nhiều → được tương tác nhiều → popularity
                    tăng → recommend càng nhiều. Vòng lặp không lành mạnh.
                  </li>
                  <li>
                    <strong>Position bias:</strong> user click item ở vị
                    trí cao nhiều hơn ngay cả khi item ngang nhau. Model
                    train thô trên click → học bias. Giải pháp: inverse
                    propensity weighting, counterfactual learning.
                  </li>
                  <li>
                    <strong>Feedback loop:</strong> model chỉ thấy phản hồi
                    về item nó đã gợi ý → không học được gì về item nó chưa
                    gợi ý bao giờ. Giải pháp: exploration, log propensity.
                  </li>
                  <li>
                    <strong>Overfitting trên metric offline:</strong> nDCG
                    offline tăng, A/B test online giảm. Nguyên nhân:
                    offline không mô phỏng được feedback loop và
                    counterfactual. Luôn validate bằng online.
                  </li>
                  <li>
                    <strong>Filter bubble &amp; radicalization:</strong> tối
                    ưu engagement quá mức → nội dung cực đoan có engagement
                    cao → user bị đẩy về hướng đó. Cần diversity constraint
                    và safety filter.
                  </li>
                  <li>
                    <strong>Cold-start một cách tinh tế:</strong> user hoạt
                    động lâu nhưng ít tương tác (lurker) gần giống cold
                    start. Dùng session-based / sequential model cho nhóm
                    này.
                  </li>
                </ul>
              </CollapsibleDetail>

              <CollapsibleDetail title="Xu hướng hiện tại trong RecSys 2024-2026">
                <p>
                  RecSys đang chuyển dịch nhanh chóng. Một số xu hướng đáng
                  chú ý:
                </p>
                <ul className="list-disc pl-5 leading-relaxed">
                  <li>
                    <strong>Sequential &amp; transformer-based:</strong>{" "}
                    SASRec, BERT4Rec, Pinnerformer. Treat lịch sử user như
                    sequence, dùng self-attention để học sở thích theo thời
                    gian.
                  </li>
                  <li>
                    <strong>LLM-based recommender:</strong> dùng LLM sinh
                    mô tả item, tóm tắt lịch sử user, hoặc rerank top-K bằng
                    reasoning. TallRec, P5 là các nghiên cứu đầu.
                  </li>
                  <li>
                    <strong>Generative recommendation:</strong> thay vì
                    chọn từ candidate set, LLM sinh ra ID/token sản phẩm.
                    Meta, Google đang thử nghiệm ở scale lớn.
                  </li>
                  <li>
                    <strong>Multi-objective optimization:</strong> không chỉ
                    CTR, mà kết hợp watch-time, retention, revenue, creator
                    fairness. Pareto frontier thay vì single metric.
                  </li>
                  <li>
                    <strong>Privacy-preserving:</strong> federated RecSys,
                    differential privacy để tuân thủ GDPR / PDPA, đặc biệt
                    quan trọng với dữ liệu nhạy cảm.
                  </li>
                  <li>
                    <strong>Reinforcement Learning:</strong> treat recommendation
                    như sequential decision — tối ưu reward dài hạn (retention)
                    thay vì reward tức thì (click). YouTube, TikTok đã áp dụng
                    từ nhiều năm.
                  </li>
                  <li>
                    <strong>Multi-modal:</strong> dùng cả text, image, audio,
                    video embedding từ foundation model (CLIP, BLIP) để tăng
                    content understanding. Đặc biệt hữu ích cho cold start.
                  </li>
                </ul>
              </CollapsibleDetail>

              <p>
                <strong>Scale thực tế.</strong> Shopee VN xử lý hàng trăm
                triệu impression mỗi ngày. YouTube phục vụ ~1 tỷ giờ
                watch/ngày. Các hệ thống này không chạy 1 model — chúng là
                pipeline gồm hàng chục model: retrieval, ranking, re-ranking,
                safety filter, fairness, business rules. Một thay đổi 0.1%
                CTR có thể = vài triệu USD doanh thu.
              </p>

              <p>
                <strong>Counterfactual reasoning.</strong> Câu hỏi thật
                của RecSys không phải &quot;user có click item này
                không?&quot; mà &quot;nếu mình KHÔNG gợi ý item này, user
                có click item kia không?&quot; — bài toán counterfactual
                giống A/B test nhưng ở cấp từng gợi ý. IPS (Inverse
                Propensity Scoring), doubly robust estimator, causal
                forests đang được áp dụng để debias offline metric.
              </p>

              <p>
                <strong>Fairness giữa creator / seller.</strong> Nếu
                model chỉ gợi ý top 1% seller, 99% còn lại bị bỏ rơi —
                ảnh hưởng hệ sinh thái (creator bỏ nền tảng). YouTube,
                Spotify có các cơ chế boost content mới, đảm bảo mỗi
                creator có tối thiểu impression. Đây là trade-off giữa
                short-term engagement và long-term ecosystem health.
              </p>

              <p>
                <strong>Latency budget.</strong> Từ khi user load feed đến
                khi thấy gợi ý: &lt;200ms. Trong đó: ~20ms network, ~30ms
                feature fetch, ~50ms retrieval (FAISS), ~50ms ranking
                (DeepFM), ~20ms re-ranking + business logic, ~30ms buffer.
                Đây là lý do feature store (Redis, Feast, Vertex AI Feature
                Store) và ANN index là phần &quot;nhàm chán&quot; nhưng
                quyết định khả thi của hệ thống.
              </p>
            </ExplanationSection>
          </LessonSection>

          <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
            <MiniSummary
              points={[
                "3 phương pháp: Collaborative Filtering (user tương tự), Content-Based (item tương tự), Deep Learning Hybrid.",
                "Matrix Factorization nén sparse user-item matrix xuống dense embeddings (128 dims).",
                "Cold start problem: user/item mới không có lịch sử → dùng content-based hoặc popularity.",
                "Two-Tower model (Shopee, YouTube): user tower + item tower → ANN search real-time.",
                "Pipeline sản xuất = retrieval → ranking → re-ranking; mỗi tầng 1 model, tổng latency &lt;200ms.",
                "35% doanh thu Amazon, 80% content Netflix từ recommendations. Công cụ tăng trưởng #1.",
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
