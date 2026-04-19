"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Sparkles,
  Film,
  Eye,
  GraduationCap,
  Boxes,
  Gamepad2,
  Check,
} from "lucide-react";
import type { TopicMeta } from "@/lib/types";
import ApplicationLayout from "@/components/application/ApplicationLayout";
import ApplicationHero from "@/components/application/ApplicationHero";
import ApplicationProblem from "@/components/application/ApplicationProblem";
import ApplicationMechanism from "@/components/application/ApplicationMechanism";
import Beat from "@/components/application/Beat";
import ApplicationMetrics from "@/components/application/ApplicationMetrics";
import Metric from "@/components/application/Metric";
import ApplicationTryIt from "@/components/application/ApplicationTryIt";
import ApplicationCounterfactual from "@/components/application/ApplicationCounterfactual";
import {
  InlineChallenge,
  Callout,
  SplitView,
  MiniSummary,
  TopicLink,
} from "@/components/interactive";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";

export const metadata: TopicMeta = {
  slug: "supervised-unsupervised-rl-in-netflix",
  title: "Supervised, Unsupervised & RL in Netflix",
  titleVi: "Ba kiểu học trong Netflix",
  description:
    "Netflix dùng cả ba kiểu học máy cùng lúc: có giám sát đoán điểm phim, không giám sát chia 2.000+ nhóm sở thích, tăng cường chọn ảnh bìa. Mỗi hàng phim trên trang chủ có một thuật toán đằng sau.",
  category: "classic-ml",
  tags: [
    "supervised-learning",
    "unsupervised-learning",
    "reinforcement-learning",
    "recommendation",
    "application",
  ],
  difficulty: "beginner",
  relatedSlugs: ["supervised-unsupervised-rl"],
  vizType: "interactive",
  applicationOf: "supervised-unsupervised-rl",
  featuredApp: {
    name: "Netflix",
    productFeature: "Personalized Recommendations",
    company: "Netflix, Inc.",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "System Architectures for Personalization and Recommendation",
      publisher: "Netflix Tech Blog",
      url: "https://netflixtechblog.com/system-architectures-for-personalization-and-recommendation-e081aa94b5d8",
      date: "2013-03",
      kind: "engineering-blog",
    },
    {
      title: "Learning a Personalized Homepage",
      publisher: "Netflix Tech Blog",
      url: "https://netflixtechblog.com/learning-a-personalized-homepage-aa8ec670359a",
      date: "2015-04",
      kind: "engineering-blog",
    },
    {
      title: "Artwork Personalization at Netflix",
      publisher: "Netflix Tech Blog",
      url: "https://netflixtechblog.com/artwork-personalization-c589f074ad76",
      date: "2017-12",
      kind: "engineering-blog",
    },
    {
      title: "Bandits for Recommender Systems",
      publisher: "Netflix Tech Blog",
      url: "https://netflixtechblog.com/bandits-for-recommender-systems-b5b5e8de9883",
      date: "2022-03",
      kind: "engineering-blog",
    },
    {
      title: "Netflix's recommendation engine is worth $1 billion per year",
      publisher: "Quartz",
      url: "https://qz.com/571007/the-recommendation-engine-is-worth-1-billion-per-year-to-netflix",
      date: "2016-01",
      kind: "news",
    },
  ],
  tocSections: [
    { id: "hero", labelVi: "Công ty nào?" },
    { id: "problem", labelVi: "Vấn đề" },
    { id: "mechanism", labelVi: "Cách giải quyết" },
    { id: "tryIt", labelVi: "Thử tự tay" },
    { id: "metrics", labelVi: "Con số thật" },
    { id: "counterfactual", labelVi: "Nếu không có" },
  ],
};

/* ═══════════════════════════════════════════════════════════════════
   DỮ LIỆU MÔ PHỎNG — 4 hàng phim trên trang chủ Netflix
   ═══════════════════════════════════════════════════════════════════ */

type LearningKind = "supervised" | "unsupervised" | "rl";

type MovieTile = {
  id: string;
  title: string;
  gradient: [string, string];
  emoji: string;
};

type Rail = {
  id: string;
  name: string;
  subtitle: string;
  kind: LearningKind;
  explainer: string;
  mini: {
    title: string;
    detail: string;
  };
  tiles: MovieTile[];
};

const RAILS: Rail[] = [
  {
    id: "top10-vn",
    name: "Top 10 Việt Nam hôm nay",
    subtitle: "Popularity + một chút cá nhân",
    kind: "supervised",
    explainer:
      "Netflix huấn luyện một mô hình có giám sát: dữ liệu là 'người xem đã chấm bao nhiêu sao cho phim nào'. Mô hình đoán điểm bạn sẽ chấm cho từng phim, rồi sắp theo điểm cao nhất. Đây là phiên bản cốt lõi từ thời giải thưởng Netflix Prize 1 triệu USD năm 2009.",
    mini: {
      title: "Đoán điểm đánh giá",
      detail:
        "Với mỗi cặp (bạn, phim), mô hình xuất ra một số — ví dụ 4.2/5. Top 10 là 10 phim có điểm đoán cao nhất trong bộ sưu tập phim đang thịnh.",
    },
    tiles: [
      { id: "t1", title: "Phim trinh thám", emoji: "🕵️", gradient: ["#ef4444", "#b91c1c"] },
      { id: "t2", title: "Hài tình cảm", emoji: "💞", gradient: ["#ec4899", "#be185d"] },
      { id: "t3", title: "Hành động", emoji: "💥", gradient: ["#f97316", "#c2410c"] },
      { id: "t4", title: "Tài liệu", emoji: "🎬", gradient: ["#0ea5e9", "#0369a1"] },
      { id: "t5", title: "Hoạt hình", emoji: "🦊", gradient: ["#facc15", "#a16207"] },
    ],
  },
  {
    id: "for-you",
    name: "Gợi ý cho bạn",
    subtitle: "Taste community — bạn thuộc nhóm nào?",
    kind: "unsupervised",
    explainer:
      "Netflix gom 247 triệu người dùng thành hơn 2.000 'cộng đồng sở thích' bằng thuật toán không giám sát. Không ai dán nhãn 'bạn là người mê phim trinh thám Bắc Âu'. Máy tự thấy nhóm người có hành vi xem giống nhau rồi gộp lại. Hàng này gợi ý phim thịnh trong nhóm của bạn.",
    mini: {
      title: "Phân cụm người xem",
      detail:
        "Người có lịch sử xem tương tự bạn cũng vừa xem phim X — nên X xuất hiện ở hàng này. Không cần ai dạy trước có bao nhiêu nhóm.",
    },
    tiles: [
      { id: "u1", title: "Điều tra hình sự", emoji: "🔎", gradient: ["#64748b", "#1e293b"] },
      { id: "u2", title: "Chick-flick 90s", emoji: "🌸", gradient: ["#f472b6", "#9d174d"] },
      { id: "u3", title: "Bí ẩn Bắc Âu", emoji: "❄️", gradient: ["#38bdf8", "#0c4a6e"] },
      { id: "u4", title: "Sci-fi độc lập", emoji: "🛸", gradient: ["#a78bfa", "#5b21b6"] },
      { id: "u5", title: "Rom-com Hàn", emoji: "🍜", gradient: ["#fb7185", "#9f1239"] },
    ],
  },
  {
    id: "because-watched",
    name: "Vì bạn đã xem Money Heist",
    subtitle: "Phim cùng nhóm sở thích ẩn",
    kind: "unsupervised",
    explainer:
      "Cũng là học không giám sát, nhưng ở tầng phim: Netflix biểu diễn mỗi phim bằng một 'vector đặc điểm ẩn' (latent features) — những đặc điểm máy tự nghĩ ra dựa trên cách người ta xem, chứ không phải do con người gán nhãn. Phim gần Money Heist trong không gian ấy sẽ được xếp vào hàng này.",
    mini: {
      title: "Phim tương tự",
      detail:
        "Máy không hỏi 'phim này có căng thẳng không' — nó tự suy ra từ hàng trăm triệu lượt xem chung. Two phim có người xem trùng nhau nhiều = gần nhau trong không gian ẩn.",
    },
    tiles: [
      { id: "b1", title: "Breaking Bad", emoji: "⚗️", gradient: ["#84cc16", "#3f6212"] },
      { id: "b2", title: "Narcos", emoji: "🌴", gradient: ["#10b981", "#065f46"] },
      { id: "b3", title: "Peaky Blinders", emoji: "🎩", gradient: ["#78716c", "#1c1917"] },
      { id: "b4", title: "Sherlock", emoji: "🔍", gradient: ["#64748b", "#1e293b"] },
      { id: "b5", title: "Mindhunter", emoji: "🧠", gradient: ["#a3a3a3", "#262626"] },
    ],
  },
  {
    id: "banner",
    name: "Biển quảng cáo đầu trang",
    subtitle: "Chọn ảnh bìa để kéo bạn nhấn",
    kind: "rl",
    explainer:
      "Đây là nơi học tăng cường toả sáng. Cùng một bộ phim, Netflix có 10+ ảnh bìa khác nhau. Với mỗi người, hệ thống chọn một ảnh, đo xem bạn có nhấn vào không, rồi cập nhật xác suất chọn ảnh đó trong tương lai. Đây là mô hình 'multi-armed bandit' — thử và khai thác (exploration vs exploitation).",
    mini: {
      title: "Bandit chọn ảnh",
      detail:
        "Nhấn = phần thưởng +1. Lướt qua = phần thưởng 0. Sau hàng triệu hiển thị, ảnh nào có tỉ lệ nhấn cao sẽ được ưu tiên — nhưng hệ thống vẫn thi thoảng thử ảnh mới để không bỏ lỡ ảnh tốt hơn.",
    },
    tiles: [
      { id: "r1", title: "Hành động căng thẳng", emoji: "🔥", gradient: ["#ef4444", "#7f1d1d"] },
      { id: "r2", title: "Góc tình cảm", emoji: "💐", gradient: ["#f472b6", "#831843"] },
      { id: "r3", title: "Bí ẩn u tối", emoji: "🌙", gradient: ["#312e81", "#0f172a"] },
      { id: "r4", title: "Góc hài hước", emoji: "😂", gradient: ["#facc15", "#713f12"] },
      { id: "r5", title: "Anh hùng", emoji: "🦸", gradient: ["#0ea5e9", "#0c4a6e"] },
    ],
  },
];

const netflixQuizQuestions: QuizQuestion[] = [
  {
    question:
      "Netflix hiển thị hàng 'Top 10 Việt Nam hôm nay'. Đây chủ yếu là sản phẩm của kiểu học nào?",
    options: [
      "Học có giám sát — đoán điểm từng phim cho từng người rồi xếp hạng",
      "Học không giám sát — phân cụm phim",
      "Học tăng cường — bandit chọn ảnh bìa",
      "Không phải học máy, chỉ là bảng xếp hạng thủ công",
    ],
    correct: 0,
    explanation:
      "Top 10 phối hợp popularity với điểm dự đoán riêng cho từng người. Điểm dự đoán đến từ mô hình có giám sát đã học trên hàng triệu cặp (người, phim, sao).",
  },
  {
    question:
      "Netflix phân 247 triệu người thành hơn 2.000 cộng đồng sở thích mà không ai đặt tên trước. Kỹ thuật nào đứng sau?",
    options: [
      "Học có giám sát — ai đó đã gán nhãn 'mê phim trinh thám' cho từng người",
      "Học không giám sát (phân cụm) — máy tự thấy nhóm từ hành vi xem",
      "Học tăng cường với reward là 'thuộc cụm'",
      "Không phải học máy, con người chia tay",
    ],
    correct: 1,
    explanation:
      "Không ai dán nhãn trước cho từng người. Máy nhìn hành vi xem và tự nhóm những người có pattern tương tự. Đây là phân cụm — học không giám sát kinh điển.",
  },
  {
    question:
      "Cùng một bộ phim, Netflix hiển thị ảnh bìa khác nhau cho bạn và bạn của bạn. Kiểu học đứng sau là gì?",
    options: [
      "Học có giám sát",
      "Học không giám sát",
      "Học tăng cường (multi-armed bandit) — chọn ảnh, đo tỉ lệ nhấn, cập nhật xác suất",
      "Chọn ảnh ngẫu nhiên hoàn toàn",
    ],
    correct: 2,
    explanation:
      "Bandit là mô hình học tăng cường đơn giản: hệ thống chọn một 'cánh tay' (ảnh), nhận phản hồi (nhấn hay không), và cập nhật xác suất chọn lần sau. Thăng bằng giữa khai thác (ảnh đã biết hiệu quả) và khám phá (thử ảnh mới).",
  },
  {
    type: "fill-blank",
    question:
      "Netflix dùng kiểu có giám sát để {blank}, kiểu không giám sát để {blank}, và kiểu tăng cường để {blank}.",
    blanks: [
      { answer: "đoán điểm", accept: ["đoán điểm phim", "predict", "dự đoán điểm", "đoán điểm đánh giá"] },
      { answer: "phân cụm", accept: ["phân nhóm", "cluster", "clustering", "chia nhóm"] },
      { answer: "chọn ảnh bìa", accept: ["chọn ảnh", "tối ưu ảnh bìa", "banner"] },
    ],
    explanation:
      "Ba vai trò khác nhau, phối hợp trong cùng một sản phẩm. Có giám sát dùng để xếp hạng phim; không giám sát để hiểu người dùng thuộc nhóm nào; tăng cường để tối ưu hiển thị ảnh.",
  },
  {
    question:
      "Giả sử Netflix chỉ dùng học có giám sát và bỏ hai kiểu còn lại. Hệ thống sẽ yếu ở chỗ nào nhất?",
    options: [
      "Không còn đoán được điểm phim",
      "Không biết bạn thuộc nhóm nào, nên 'Gợi ý cho bạn' thành gợi ý trung bình cho tất cả; và ảnh bìa hiển thị cứng, không tự cải tiến theo phản hồi",
      "Không còn thu thập được dữ liệu",
      "Vẫn tốt, không khác gì hiện tại",
    ],
    correct: 1,
    explanation:
      "Chính vì mỗi kiểu học giỏi một việc, Netflix phải kết hợp. Bỏ không giám sát → không hiểu cấu trúc người dùng. Bỏ tăng cường → không tối ưu được ảnh bìa theo thời gian thực.",
  },
];

const KIND_META: Record<
  LearningKind,
  { label: string; color: string; icon: typeof GraduationCap; bg: string; border: string }
> = {
  supervised: {
    label: "Học có giám sát",
    color: "#10b981",
    icon: GraduationCap,
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-300 dark:border-emerald-700",
  },
  unsupervised: {
    label: "Học không giám sát",
    color: "#3b82f6",
    icon: Boxes,
    bg: "bg-sky-50 dark:bg-sky-900/20",
    border: "border-sky-300 dark:border-sky-700",
  },
  rl: {
    label: "Học tăng cường",
    color: "#f59e0b",
    icon: Gamepad2,
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-300 dark:border-amber-700",
  },
};

/* ═══════════════════════════════════════════════════════════════════
   TILE — một ô phim mô phỏng
   ═══════════════════════════════════════════════════════════════════ */

function MovieTileBox({ tile }: { tile: MovieTile }) {
  return (
    <div
      className="shrink-0 w-28 sm:w-32 h-40 sm:h-44 rounded-md overflow-hidden relative shadow-lg"
      style={{
        background: `linear-gradient(135deg, ${tile.gradient[0]} 0%, ${tile.gradient[1]} 100%)`,
      }}
    >
      <div className="absolute inset-0 flex flex-col justify-end p-2">
        <div className="text-3xl mb-1 drop-shadow-lg" aria-hidden>
          {tile.emoji}
        </div>
        <div className="text-[11px] font-bold text-white leading-tight drop-shadow-lg">
          {tile.title}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MÀN HÌNH NETFLIX GIẢ — 4 hàng có thể bấm để xem giải thích
   ═══════════════════════════════════════════════════════════════════ */

function NetflixHomepageMock() {
  const [activeRail, setActiveRail] = useState<string | null>(null);
  const active = useMemo(
    () => RAILS.find((r) => r.id === activeRail) ?? null,
    [activeRail]
  );

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted leading-relaxed">
        Đây là phiên bản rút gọn của trang chủ Netflix. Mỗi hàng là một thuật toán khác nhau. Bấm
        vào một hàng để xem kiểu học máy đứng sau nó.
      </p>

      {/* Trang chủ giả */}
      <div className="rounded-xl border border-border bg-[#0a0a0a] p-4 sm:p-5 space-y-5">
        {/* Thanh trên kiểu Netflix */}
        <div className="flex items-center gap-3">
          <span className="text-rose-500 text-lg font-extrabold tracking-tight">NETFLIX</span>
          <span className="text-[10px] text-white/50 uppercase tracking-widest">
            Trang chủ mô phỏng
          </span>
        </div>

        {RAILS.map((rail) => {
          const isActive = rail.id === activeRail;
          const meta = KIND_META[rail.kind];
          const Icon = meta.icon;
          return (
            <button
              key={rail.id}
              type="button"
              onClick={() => setActiveRail(isActive ? null : rail.id)}
              className={`w-full text-left rounded-lg transition-all ${
                isActive ? "ring-2 ring-white/60" : "hover:ring-1 hover:ring-white/30"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-white font-semibold text-sm">{rail.name}</h4>
                  <span
                    className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: meta.color + "33", color: meta.color }}
                  >
                    <span className="inline-flex items-center gap-1">
                      <Icon size={9} />
                      {meta.label}
                    </span>
                  </span>
                </div>
                <span className="text-[10px] text-white/40">
                  {isActive ? "Ẩn giải thích" : "Bấm để xem"}
                </span>
              </div>
              <p className="text-[11px] text-white/60 mb-2">{rail.subtitle}</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {rail.tiles.map((tile) => (
                  <MovieTileBox key={tile.id} tile={tile} />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Khối giải thích — hiện khi chọn */}
      <AnimatePresence mode="wait">
        {active && (
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            className={`rounded-xl border-2 ${KIND_META[active.kind].border} ${KIND_META[active.kind].bg} p-5 space-y-3`}
          >
            <div className="flex items-center gap-2">
              {(() => {
                const Icon = KIND_META[active.kind].icon;
                return (
                  <Icon size={18} style={{ color: KIND_META[active.kind].color }} />
                );
              })()}
              <h4 className="text-base font-semibold text-foreground">
                Đằng sau &ldquo;{active.name}&rdquo; là{" "}
                <span style={{ color: KIND_META[active.kind].color }}>
                  {KIND_META[active.kind].label}
                </span>
              </h4>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed">{active.explainer}</p>

            {/* Mini-visualization tùy kiểu */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-[10px] uppercase tracking-wide text-tertiary font-semibold mb-2">
                Hình hoá: {active.mini.title}
              </div>
              <MiniVizByKind kind={active.kind} />
              <p className="text-xs text-foreground/80 leading-relaxed mt-3">
                {active.mini.detail}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MINI VISUALS tuỳ kiểu học
   ═══════════════════════════════════════════════════════════════════ */

function MiniVizByKind({ kind }: { kind: LearningKind }) {
  if (kind === "supervised") {
    return <SupervisedMiniViz />;
  }
  if (kind === "unsupervised") {
    return <UnsupervisedMiniViz />;
  }
  return <RLMiniViz />;
}

function SupervisedMiniViz() {
  const [selectedMovie, setSelectedMovie] = useState(0);
  const movies = [
    { title: "Trinh thám", trueStars: 4.5, predictedStars: 4.3 },
    { title: "Rom-com", trueStars: 2.0, predictedStars: 2.2 },
    { title: "Tài liệu", trueStars: 3.8, predictedStars: 3.9 },
    { title: "Hành động", trueStars: 4.1, predictedStars: 4.0 },
  ];
  const active = movies[selectedMovie];

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">
        Bấm vào một phim để xem Netflix đoán điểm (so với điểm thật bạn đã chấm sau đó).
      </p>
      <div className="flex flex-wrap gap-2">
        {movies.map((m, i) => (
          <button
            key={m.title}
            type="button"
            onClick={() => setSelectedMovie(i)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              i === selectedMovie
                ? "bg-emerald-500 text-white"
                : "bg-surface border border-border text-muted hover:text-foreground"
            }`}
          >
            {m.title}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-surface p-3 text-center">
          <div className="text-[10px] uppercase tracking-wide text-tertiary font-semibold mb-1">
            Máy dự đoán
          </div>
          <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400">
            <Star size={18} fill="currentColor" />
            <span className="text-xl font-mono font-bold">{active.predictedStars.toFixed(1)}</span>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-3 text-center">
          <div className="text-[10px] uppercase tracking-wide text-tertiary font-semibold mb-1">
            Bạn chấm thật
          </div>
          <div className="flex items-center justify-center gap-1 text-amber-500">
            <Star size={18} fill="currentColor" />
            <span className="text-xl font-mono font-bold">{active.trueStars.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div className="rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-2 text-center">
        <span className="inline-flex items-center gap-1 text-xs text-emerald-800 dark:text-emerald-300">
          <Check size={12} aria-hidden="true" />
          Sai số chỉ {Math.abs(active.trueStars - active.predictedStars).toFixed(2)} sao — đủ tốt
          để xếp phim.
        </span>
      </div>
    </div>
  );
}

function UnsupervisedMiniViz() {
  // Sáu &ldquo;người xem&rdquo; với ba cụm màu
  const viewers = [
    { x: 25, y: 70, cluster: 0 },
    { x: 45, y: 85, cluster: 0 },
    { x: 35, y: 55, cluster: 0 },
    { x: 160, y: 50, cluster: 1 },
    { x: 180, y: 75, cluster: 1 },
    { x: 200, y: 40, cluster: 1 },
    { x: 300, y: 85, cluster: 2 },
    { x: 320, y: 55, cluster: 2 },
    { x: 280, y: 65, cluster: 2 },
  ];
  const clusterColors = ["#10b981", "#3b82f6", "#ef4444"];
  const clusterNames = ["Nhóm phim trinh thám", "Nhóm rom-com", "Nhóm tài liệu"];

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">
        Mỗi chấm = một người xem. Netflix tự thấy 3 nhóm hành vi, không ai đặt tên trước.
      </p>
      <svg viewBox="0 0 360 130" className="w-full rounded-md bg-surface/40">
        {viewers.map((v, i) => (
          <motion.circle
            key={i}
            cx={v.x}
            cy={v.y}
            r={7}
            fill={clusterColors[v.cluster]}
            stroke="#fff"
            strokeWidth={1.5}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.05 }}
          />
        ))}
        {[
          { x: 35, y: 70, label: clusterNames[0], color: clusterColors[0] },
          { x: 180, y: 55, label: clusterNames[1], color: clusterColors[1] },
          { x: 300, y: 68, label: clusterNames[2], color: clusterColors[2] },
        ].map((c, i) => (
          <g key={i}>
            <circle
              cx={c.x}
              cy={c.y}
              r={32}
              fill="none"
              stroke={c.color}
              strokeWidth={1.5}
              strokeDasharray="3 3"
              opacity={0.5}
            />
            <text
              x={c.x}
              y={c.y - 38}
              textAnchor="middle"
              fontSize={11}
              fill={c.color}
              fontWeight={700}
            >
              {c.label}
            </text>
          </g>
        ))}
      </svg>
      <p className="text-xs text-muted">
        Bạn rơi vào một trong ba cụm đó. Hàng &ldquo;Gợi ý cho bạn&rdquo; lấy phim thịnh trong cụm.
      </p>
    </div>
  );
}

function RLMiniViz() {
  const [clicks, setClicks] = useState<Record<string, number>>({
    A: 0,
    B: 0,
    C: 0,
  });
  const [shown, setShown] = useState<Record<string, number>>({
    A: 0,
    B: 0,
    C: 0,
  });

  function record(id: "A" | "B" | "C", clicked: boolean) {
    setShown((prev) => ({ ...prev, [id]: prev[id] + 1 }));
    if (clicked) setClicks((prev) => ({ ...prev, [id]: prev[id] + 1 }));
  }

  const rates = {
    A: shown.A === 0 ? 0 : (clicks.A / shown.A) * 100,
    B: shown.B === 0 ? 0 : (clicks.B / shown.B) * 100,
    C: shown.C === 0 ? 0 : (clicks.C / shown.C) * 100,
  };

  const banners = [
    { id: "A" as const, emoji: "🔥", grad: ["#ef4444", "#7f1d1d"] },
    { id: "B" as const, emoji: "💐", grad: ["#f472b6", "#831843"] },
    { id: "C" as const, emoji: "🌙", grad: ["#312e81", "#0f172a"] },
  ];

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">
        Ba ảnh bìa cho cùng một bộ phim. Bấm &ldquo;Nhấn&rdquo; hoặc &ldquo;Lướt qua&rdquo; vài lần
        cho mỗi ảnh, xem bandit học ra tỉ lệ ưa thích nào.
      </p>
      <div className="grid grid-cols-3 gap-2">
        {banners.map((b) => (
          <div key={b.id} className="space-y-2">
            <div
              className="h-20 rounded-md flex items-center justify-center text-3xl shadow-md"
              style={{
                background: `linear-gradient(135deg, ${b.grad[0]} 0%, ${b.grad[1]} 100%)`,
              }}
            >
              {b.emoji}
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => record(b.id, true)}
                className="flex-1 rounded-md bg-emerald-500 text-white text-[10px] font-semibold py-1 hover:opacity-90"
              >
                Nhấn
              </button>
              <button
                type="button"
                onClick={() => record(b.id, false)}
                className="flex-1 rounded-md bg-rose-500 text-white text-[10px] font-semibold py-1 hover:opacity-90"
              >
                Lướt
              </button>
            </div>
            <div className="rounded-md bg-surface border border-border p-1.5 text-center">
              <div className="text-[9px] text-tertiary font-semibold uppercase tracking-wide">
                Nhấn / Hiện
              </div>
              <div className="text-xs font-mono text-foreground tabular-nums">
                {clicks[b.id]} / {shown[b.id]}
              </div>
              <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                {rates[b.id].toFixed(0)}%
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted leading-relaxed">
        Bandit chọn ảnh có tỉ lệ nhấn cao nhất để hiển thị nhiều hơn — nhưng vẫn thi thoảng thử
        ảnh yếu hơn, phòng khi tỉ lệ đổi. Đó là thăng bằng giữa khai thác và khám phá.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export default function SupervisedUnsupervisedRlInNetflix() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Ba kiểu học: có giám sát, không giám sát, tăng cường"
    >
      <ApplicationHero
        parentTitleVi="Ba kiểu học: có giám sát, không giám sát, tăng cường"
        topicSlug="supervised-unsupervised-rl-in-netflix"
      >
        <p>
          Bạn mở Netflix buổi tối, lướt dọc trang chủ và liên tục nghĩ &ldquo;phim này hợp gu
          mình&rdquo;. Đó không phải tình cờ &mdash; mỗi hàng phim bạn thấy đều đến từ một thuật
          toán khác nhau.
        </p>
        <p>
          Netflix kết hợp cả ba kiểu học máy cùng lúc: có giám sát đoán điểm phim bạn sẽ chấm,
          không giám sát chia 247 triệu người dùng thành hơn 2.000 cộng đồng sở thích, và tăng
          cường chọn ảnh bìa nào khiến bạn nhấn vào. Ba công cụ, một trang chủ &mdash; hàng tỉ đô
          la doanh thu năm.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="supervised-unsupervised-rl-in-netflix">
        <p>
          Thư viện Netflix có hàng nghìn phim và series. Với 247 triệu thuê bao, không một biên
          tập viên nào có thể chọn phim cho từng người. Nếu trang chủ hiển thị sai &mdash; hàng
          phim nhàm chán, ảnh bìa không hấp dẫn &mdash; người dùng rời đi và huỷ thuê bao.
        </p>
        <p>
          Vấn đề cốt lõi: với mỗi người trong số hàng trăm triệu thuê bao, Netflix phải{" "}
          <strong>dự đoán chính xác bạn muốn gì, phân nhóm hàng triệu người giống bạn, và thử
          nghiệm liên tục cách trình bày nội dung</strong>. Không kiểu học máy đơn lẻ nào giải cả
          ba việc đó.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Ba kiểu học"
        topicSlug="supervised-unsupervised-rl-in-netflix"
      >
        <Beat step={1}>
          <p>
            <strong>Thu thập mọi dấu vết hành vi.</strong> Lượt xem, thời lượng, tua lại, dừng,
            thiết bị, thời gian trong ngày &mdash; Netflix ghi lại tất cả. Đây là &ldquo;nguyên
            liệu&rdquo; cho cả ba kiểu học máy.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>Học có giám sát &mdash; đoán điểm đánh giá.</strong> Với cặp (người dùng, phim)
            đã có điểm, Netflix huấn luyện mô hình đoán điểm cho phim bạn chưa xem. Đây là trái
            tim của hệ thống từ thời giải thưởng Netflix Prize (1 triệu đô-la Mỹ, 2009). Sau này
            kỹ thuật tiến hoá sang &ldquo;matrix factorization&rdquo; và deep learning, nhưng ý
            tưởng vẫn là <em>học từ nhãn có sẵn</em>.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>Học không giám sát &mdash; phân nhóm sở thích.</strong> Netflix chia 247 triệu
            người thành hơn 2.000 &ldquo;cộng đồng sở thích&rdquo; (taste communities) bằng thuật
            toán phân cụm. Không ai đặt tên &ldquo;cộng đồng mê phim Bắc Âu lạnh&rdquo; trước &mdash;
            máy tự thấy nhóm và gộp lại. Hàng &ldquo;Gợi ý cho bạn&rdquo; dùng chính cấu trúc ẩn
            này.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>Học tăng cường &mdash; chọn ảnh bìa tối ưu.</strong> Mỗi phim có 10+ ảnh bìa.
            Netflix dùng mô hình bandit: với mỗi người, chọn một ảnh, đo tỉ lệ nhấn, cập nhật xác
            suất chọn lần sau. Thăng bằng giữa <em>khai thác</em> (ảnh đã biết hiệu quả) và{" "}
            <em>khám phá</em> (ảnh mới có thể còn tốt hơn).
          </p>
        </Beat>
        <Beat step={5}>
          <p>
            <strong>A/B testing liên tục.</strong> Hàng trăm thử nghiệm chạy song song. Kết quả
            phản hồi ngược vào cả ba loại mô hình. Mỗi click, mỗi giây xem đều cải thiện hệ thống
            cho lần tới.
          </p>
        </Beat>
      </ApplicationMechanism>

      {/* ═══════════════ TRY IT — Trang chủ Netflix mô phỏng + SplitView + Challenge ═══════════════ */}
      <ApplicationTryIt topicSlug="supervised-unsupervised-rl-in-netflix">
        <div className="space-y-8">
          {/* Phần 1: Trang chủ mô phỏng */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Film size={18} className="text-accent" />
              Trang chủ Netflix &mdash; bấm từng hàng để hiện thuật toán phía sau
            </h3>
            <NetflixHomepageMock />
          </section>

          {/* Phần 2: Cùng một input nhìn từ hai phía */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Eye size={18} className="text-accent" />
              Cùng một lượt xem, ba hệ thống nhìn khác nhau
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              Giả sử bạn vừa xem hết <em>Money Heist</em>. Cùng một sự kiện đó, ba hệ thống bên
              trong Netflix rút ra ba kết luận rất khác nhau:
            </p>

            <SplitView
              leftLabel="Có giám sát nghĩ gì?"
              rightLabel="Không giám sát nghĩ gì?"
              left={
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <GraduationCap size={14} />
                    <span className="font-semibold">Đoán điểm</span>
                  </div>
                  <p className="text-foreground/85 leading-relaxed">
                    &ldquo;Người này vừa xem hết 8 tập. Khả năng cao họ đánh giá 4.5/5 cho Money
                    Heist. Cập nhật bảng điểm trong bộ nhớ.&rdquo;
                  </p>
                  <div className="text-xs text-muted pt-1 border-t border-border">
                    Kết quả dùng cho hàng &ldquo;Top 10&rdquo; — xếp phim theo điểm đoán.
                  </div>
                </div>
              }
              right={
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-sky-700 dark:text-sky-400">
                    <Boxes size={14} />
                    <span className="font-semibold">Gán cụm</span>
                  </div>
                  <p className="text-foreground/85 leading-relaxed">
                    &ldquo;Người này giờ đã ở cụm &lsquo;mê phim tội phạm tiết tấu cao&rsquo;. Cập
                    nhật vector đại diện cho người xem này.&rdquo;
                  </p>
                  <div className="text-xs text-muted pt-1 border-t border-border">
                    Kết quả dùng cho hàng &ldquo;Gợi ý cho bạn&rdquo; và &ldquo;Vì bạn đã xem&rdquo;.
                  </div>
                </div>
              }
            />

            <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Gamepad2 size={16} className="text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  Và học tăng cường làm gì?
                </span>
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Nó không học gì thêm về Money Heist. Nó nhớ: &ldquo;với người này, ảnh bìa &lsquo;bí
                ẩn u tối&rsquo; vừa được hiển thị và họ đã nhấn vào. Tăng xác suất chọn ảnh đó lần
                tới.&rdquo; Đó là tất cả.
              </p>
            </div>
          </section>

          {/* Phần 3: Inline challenge */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Sparkles size={18} className="text-accent" />
              Thử thách: ghép việc với kiểu học
            </h3>

            <InlineChallenge
              question="Netflix muốn tự động gán nhãn 'phù hợp với trẻ em' cho 10.000 phim chưa được kiểm duyệt thủ công, dựa trên một ít phim ĐÃ kiểm duyệt và đánh dấu trước đó. Đây là bài toán thuộc kiểu học nào?"
              options={[
                "Học không giám sát thuần — chỉ chia cụm phim",
                "Học có giám sát — có nhãn 'trẻ em / người lớn' cho tập đã kiểm duyệt, máy học từ đó để đoán nhãn cho phim mới",
                "Học tăng cường — thưởng khi đoán đúng",
                "Không kiểu nào phù hợp, phải thuê người xem từng phim",
              ]}
              correct={1}
              explanation="Có nhãn sẵn cho một phần dữ liệu + mục tiêu đoán nhãn cho phần còn lại = kinh điển có giám sát. Nếu phần chưa có nhãn lớn hơn rất nhiều, người ta sẽ kết hợp bán giám sát, nhưng lõi vẫn là có giám sát."
            />

            <div className="mt-3">
              <InlineChallenge
                question="Netflix phát hiện một bộ phim mới có lượt xem cao bất thường ở một nhóm người dùng mà trước nay không ai xem loại phim ấy. Hệ thống nào đã 'ghi nhận' hiện tượng này trước tiên?"
                options={[
                  "Hệ có giám sát, vì nó đoán điểm rất chính xác",
                  "Hệ không giám sát — nó tự thấy một cụm mới hình thành trong hành vi xem, mà không cần ai dạy trước",
                  "Hệ RL, vì nó thử và nhận thưởng",
                  "Hệ thống A/B testing, không liên quan đến học máy",
                ]}
                correct={1}
                explanation="Khi một mẫu mới xuất hiện mà chưa ai định nghĩa trước, học không giám sát là con đường nhanh nhất để 'thấy' nó. Sau đó đội marketing có thể đặt tên cho cụm đó, rồi training tiếp có giám sát."
              />
            </div>
          </section>

          <Callout variant="insight" title="Tầm quan trọng của việc phối hợp">
            Không một kiểu học nào giải cả bài toán Netflix. Có giám sát cần nhãn — nhưng 247
            triệu người thì ai dán nhãn sở thích? Không giám sát tự thấy nhóm — nhưng không xếp
            hạng được phim. Tăng cường tối ưu hiển thị — nhưng không biết nội dung nào phù hợp
            ngay từ đầu. Ba kiểu đan xen mới thành trang chủ mà bạn thấy mỗi tối.
          </Callout>

          <MiniSummary
            title="Netflix dùng ba kiểu học như thế nào?"
            points={[
              "Có giám sát → đoán điểm bạn sẽ chấm cho phim (dùng cho Top 10, xếp hạng).",
              "Không giám sát → chia 247 triệu người thành 2.000+ cộng đồng sở thích (dùng cho 'Gợi ý cho bạn', 'Vì bạn đã xem').",
              "Tăng cường → chọn ảnh bìa có tỉ lệ nhấn cao nhất cho mỗi người (dùng cho banner đầu trang).",
              "Ba kiểu phối hợp — mỗi hàng phim bạn thấy đều có một thuật toán riêng đứng sau.",
            ]}
          />

          <p className="text-sm text-muted leading-relaxed">
            Muốn hiểu sâu từng kiểu học?{" "}
            <TopicLink slug="supervised-unsupervised-rl">
              Quay lại bài lý thuyết
            </TopicLink>{" "}
            để tự chạy lại ba kiểu bằng tay.
          </p>

          {/* Quiz cuối — kiểm tra hiểu biết về ba kiểu học trong Netflix */}
          <section className="mt-6">
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-accent" />
              Kiểm tra nhanh
            </h3>
            <QuizSection questions={netflixQuizQuestions} />
          </section>
        </div>
      </ApplicationTryIt>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="supervised-unsupervised-rl-in-netflix"
      >
        <Metric
          value="80% nội dung được xem trên Netflix đến từ hệ thống gợi ý"
          sourceRef={1}
        />
        <Metric
          value="Hơn 2.000 cộng đồng sở thích (taste communities) được tự động phân nhóm"
          sourceRef={2}
        />
        <Metric
          value="Mỗi ảnh bìa được chọn riêng theo người dùng, liên tục cập nhật bằng bandit"
          sourceRef={3}
        />
        <Metric
          value="Hệ thống gợi ý tiết kiệm hơn 1 tỷ đô-la Mỹ mỗi năm cho Netflix"
          sourceRef={5}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Ba kiểu học"
        topicSlug="supervised-unsupervised-rl-in-netflix"
      >
        <p>
          Nếu chỉ dùng một kiểu học, Netflix sẽ hỏng ở một phía. Chỉ có giám sát &mdash; đoán điểm
          chính xác nhưng không hiểu bạn thuộc nhóm nào. Chỉ không giám sát &mdash; thấy được nhóm
          nhưng không biết xếp phim nào lên đầu. Chỉ tăng cường &mdash; chọn ảnh bìa tối ưu nhưng
          không biết nội dung phim nào đáng hiển thị.
        </p>
        <p>
          Không có kết hợp cả ba, trang chủ sẽ trở lại thời &ldquo;Hot 100 cho tất cả mọi
          người&rdquo;. Và với 247 triệu người gu khác nhau, một bảng xếp hạng chung là con đường
          nhanh nhất để mất thuê bao.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
