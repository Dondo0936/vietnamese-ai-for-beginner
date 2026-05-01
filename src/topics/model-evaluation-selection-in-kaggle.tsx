"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Shuffle,
  Layers,
  Rocket,
  Flag,
  Clock,
  Sparkles,
  GitMerge,
  AlertOctagon,
  CircleDot,
} from "lucide-react";
import type { TopicMeta } from "@/lib/types";
import ApplicationLayout from "@/components/application/ApplicationLayout";
import ApplicationHero from "@/components/application/ApplicationHero";
import ApplicationProblem from "@/components/application/ApplicationProblem";
import ApplicationMechanism from "@/components/application/ApplicationMechanism";
import Beat from "@/components/application/Beat";
import ApplicationMetrics from "@/components/application/ApplicationMetrics";
import Metric from "@/components/application/Metric";
import ApplicationCounterfactual from "@/components/application/ApplicationCounterfactual";
import ApplicationTryIt from "@/components/application/ApplicationTryIt";
import {
  StepReveal,
  InlineChallenge,
  Callout,
  MiniSummary,
  TopicLink,
  CodeBlock,
} from "@/components/interactive";

export const metadata: TopicMeta = {
  slug: "model-evaluation-selection-in-kaggle",
  title: "Model Evaluation & Selection in Kaggle",
  titleVi: "Chọn mô hình trong Kaggle",
  description:
    "Gấu hay cáo? Kéo dòng thời gian Kaggle để xem early submission, ensemble stacking, và final submission strategy quyết định ai đứng top private leaderboard.",
  category: "classic-ml",
  tags: ["model-evaluation", "kaggle", "ensemble", "application"],
  difficulty: "intermediate",
  relatedSlugs: ["model-evaluation-selection"],
  vizType: "interactive",
  applicationOf: "model-evaluation-selection",
  featuredApp: {
    name: "Kaggle",
    productFeature: "Competition Platform",
    company: "Google LLC",
    countryOrigin: "US",
  },
  sources: [
    {
      title:
        "Kaggle Champions: Ensemble Methods in Machine Learning",
      publisher: "Toptal Engineering",
      url: "https://www.toptal.com/developers/machine-learning/ensemble-methods-kaggle-machine-learn",
      date: "2023-05",
      kind: "engineering-blog",
    },
    {
      title:
        "Grandmaster Pro Tip: Winning First Place in a Kaggle Competition with Stacking Using cuML",
      publisher: "NVIDIA Technical Blog",
      url: "https://developer.nvidia.com/blog/grandmaster-pro-tip-winning-first-place-in-a-kaggle-competition-with-stacking-using-cuml/",
      date: "2025-04",
      kind: "engineering-blog",
    },
    {
      title:
        "The Kaggle Grandmasters Playbook: 7 Battle-Tested Modeling Techniques for Tabular Data",
      publisher: "NVIDIA Technical Blog",
      url: "https://developer.nvidia.com/blog/the-kaggle-grandmasters-playbook-7-battle-tested-modeling-techniques-for-tabular-data/",
      date: "2024-12",
      kind: "engineering-blog",
    },
    {
      title:
        "Ensembling with Blending and Stacking Solutions — The Kaggle Book",
      publisher: "Packt Publishing (Luca Massaron & Konrad Banachewicz)",
      url: "https://www.oreilly.com/library/view/the-kaggle-book/9781835083208/Text/Chapter_10.xhtml",
      date: "2024-06",
      kind: "documentation",
    },
    {
      title:
        "Winning Tips on Machine Learning Competitions by Kazanova, Kaggle #3",
      publisher: "HackerEarth",
      url: "https://www.hackerearth.com/practice/machine-learning/advanced-techniques/winning-tips-machine-learning-competitions-kazanova-current-kaggle-3/tutorial/",
      date: "2017-03",
      kind: "documentation",
    },
    {
      title:
        "How to Select Your Final Models in a Kaggle Competition",
      publisher: "Cheng-Tao Chu",
      url: "http://www.chioka.in/how-to-select-your-final-models-in-a-kaggle-competitio/",
      date: "2015-01",
      kind: "engineering-blog",
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

/* ────────────────────────────────────────────────────────────
   CHIẾN THUẬT: 3 tính cách thi đấu
   ──────────────────────────────────────────────────────────── */

type StrategyId = "bear" | "fox" | "owl";

interface Strategy {
  id: StrategyId;
  title: string;
  animal: string;
  color: string;
  publicLBWeek1: number[];
  privateDelta: number;
  story: string;
}

const STRATEGIES: Strategy[] = [
  {
    id: "bear",
    title: "Gấu chậm — early submission, single model mạnh",
    animal: "gau",
    color: "#92400e",
    publicLBWeek1: [850, 420, 180, 95, 72, 55, 48, 42],
    privateDelta: -3,
    story:
      "Nộp bài sớm với một XGBoost được tune kỹ. Không chạy theo leaderboard từng giờ. Khi private revealed, thường dao động nhẹ 2-5 bậc.",
  },
  {
    id: "fox",
    title: "Cáo nhanh — chase public leaderboard từng ngày",
    animal: "cao",
    color: "#b45309",
    publicLBWeek1: [200, 150, 120, 90, 45, 25, 12, 5],
    privateDelta: -180,
    story:
      "Tune tham số theo feedback public LB mỗi ngày. Top 5 public sau tuần đầu. Khi private revealed, rớt hàng trăm bậc — vì đã overfit vào subset public mà không biết.",
  },
  {
    id: "owl",
    title: "Cú khôn — trust CV, ensemble lớn, final diversity",
    animal: "cu",
    color: "#78350f",
    publicLBWeek1: [950, 680, 380, 220, 150, 95, 60, 35],
    privateDelta: 28,
    story:
      "Chậm ở public nhưng CV nội bộ rất tốt. Cuối cùng nộp 1 ensemble an toàn + 1 ensemble mạo hiểm. Private revealed, thường leo vài chục bậc nhờ hai bài nộp đa dạng.",
  },
];

/* ────────────────────────────────────────────────────────────
   KAGGLE SCOREBOARD ANIMATION
   ──────────────────────────────────────────────────────────── */

function KaggleScoreboard() {
  const [week, setWeek] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!playing) return;
    if (week >= 7) return;
    const t = setTimeout(() => {
      setWeek((w) => {
        const next = w + 1;
        if (next >= 7) setPlaying(false);
        return next;
      });
    }, 900);
    return () => clearTimeout(t);
  }, [playing, week]);

  function play() {
    setWeek(0);
    setRevealed(false);
    setPlaying(true);
  }

  function reveal() {
    setRevealed(true);
  }

  const rows = useMemo(() => {
    return STRATEGIES.map((s) => {
      const publicRank = s.publicLBWeek1[Math.min(week, 7)];
      const privateRank = revealed
        ? Math.max(1, publicRank + s.privateDelta)
        : null;
      return { strategy: s, publicRank, privateRank };
    }).sort((a, b) =>
      revealed && a.privateRank && b.privateRank
        ? a.privateRank - b.privateRank
        : a.publicRank - b.publicRank,
    );
  }, [week, revealed]);

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Trophy size={16} className="text-amber-500" />
        <h4 className="text-sm font-bold text-foreground">
          Kaggle Leaderboard — 8 tuần đua, 3 chiến thuật
        </h4>
      </div>

      {/* Week progress */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={play}
          disabled={playing}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <Rocket size={13} />
          {week === 0 && !playing ? "Chạy mô phỏng" : "Đang chạy..."}
        </button>
        <div className="flex-1">
          <div className="flex items-center justify-between text-[11px] text-muted mb-1">
            <span>Tuần {Math.min(week + 1, 8)} / 8</span>
            <span>
              {revealed
                ? "Private leaderboard đã công bố"
                : week >= 7
                  ? "Cuộc thi kết thúc — nhấn 'Công bố private'"
                  : "Public leaderboard đang chạy"}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-surface overflow-hidden">
            <motion.div
              className="h-full bg-accent"
              animate={{ width: `${((week + 1) / 8) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
        {week >= 7 && !revealed && (
          <button
            type="button"
            onClick={reveal}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Flag size={13} />
            Công bố private
          </button>
        )}
      </div>

      {/* Rows */}
      <div className="space-y-2">
        {rows.map((row) => {
          const s = row.strategy;
          const publicRank = row.publicRank;
          const privateRank = row.privateRank;
          const position = (publicRank / 1000) * 100;
          return (
            <motion.div
              layout
              key={s.id}
              transition={{ type: "spring", stiffness: 220, damping: 26 }}
              className="rounded-xl border-2 p-3 space-y-2"
              style={{
                borderColor: s.color,
                backgroundColor: s.color + "1a",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StrategyIcon id={s.id} color={s.color} />
                  <span
                    className="text-sm font-bold"
                    style={{ color: s.color }}
                  >
                    {s.title}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div>
                    <span className="text-muted">Public: </span>
                    <span
                      className="font-bold tabular-nums"
                      style={{ color: s.color }}
                    >
                      #{publicRank}
                    </span>
                  </div>
                  {privateRank !== null && (
                    <div>
                      <span className="text-muted">Private: </span>
                      <span
                        className="font-bold tabular-nums"
                        style={{
                          color:
                            privateRank < publicRank
                              ? "#10b981"
                              : privateRank > publicRank
                                ? "#ef4444"
                                : s.color,
                        }}
                      >
                        #{privateRank}
                      </span>
                      {privateRank < publicRank && (
                        <span className="ml-1 text-emerald-600 font-bold">
                          ↑
                        </span>
                      )}
                      {privateRank > publicRank && (
                        <span className="ml-1 text-red-600 font-bold">↓</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {/* Rank track */}
              <div className="relative h-2 rounded-full bg-surface overflow-hidden">
                <motion.div
                  className="absolute top-0 h-2 w-2 rounded-full"
                  style={{ backgroundColor: s.color }}
                  animate={{
                    left: `calc(${Math.max(0, Math.min(100, 100 - position))}% - 4px)`,
                  }}
                  transition={{ type: "spring", stiffness: 180, damping: 26 }}
                />
                <div className="absolute top-0 right-0 h-full w-[2px] bg-amber-500" />
                <span className="absolute top-2.5 right-1 text-[9px] text-amber-600 font-semibold">
                  #1
                </span>
              </div>
              <p className="text-[11px] text-foreground/75 leading-snug">
                {s.story}
              </p>
            </motion.div>
          );
        })}
      </div>

      {revealed && (
        <div className="rounded-xl border border-accent/30 bg-accent-light p-3">
          <p className="text-sm text-foreground/90 leading-relaxed">
            <strong className="text-accent-dark">Bài học:</strong> Cáo nhanh
            dẫn đầu public vì đã <em>fit</em> leaderboard. Cú khôn tin CV
            nội bộ — tụt public nhưng leo private. Shakeup không phải may rủi
            — nó là hình phạt cho những ai overfit vào phần công khai của
            test.
          </p>
        </div>
      )}
    </div>
  );
}

function StrategyIcon({ id, color }: { id: StrategyId; color: string }) {
  if (id === "bear") {
    return (
      <svg width={22} height={22} viewBox="0 0 24 24" aria-hidden>
        <circle cx={12} cy={13} r={6} fill={color} opacity={0.8} />
        <circle cx={7} cy={8} r={2.5} fill={color} opacity={0.8} />
        <circle cx={17} cy={8} r={2.5} fill={color} opacity={0.8} />
        <circle cx={10} cy={12} r={0.8} fill="#fff" />
        <circle cx={14} cy={12} r={0.8} fill="#fff" />
      </svg>
    );
  }
  if (id === "fox") {
    return (
      <svg width={22} height={22} viewBox="0 0 24 24" aria-hidden>
        <path
          d="M4 6 L12 14 L20 6 L18 16 Q12 22 6 16 Z"
          fill={color}
          opacity={0.85}
        />
        <circle cx={10} cy={12} r={0.8} fill="#fff" />
        <circle cx={14} cy={12} r={0.8} fill="#fff" />
      </svg>
    );
  }
  // owl
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" aria-hidden>
      <ellipse cx={12} cy={13} rx={7} ry={8} fill={color} opacity={0.85} />
      <circle cx={9} cy={10} r={2.2} fill="#fff" />
      <circle cx={15} cy={10} r={2.2} fill="#fff" />
      <circle cx={9} cy={10} r={1.1} fill={color} />
      <circle cx={15} cy={10} r={1.1} fill={color} />
      <path d="M11 13 L12 14 L13 13 Z" fill="#fff" />
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────
   STACKING TOWER — trực quan hoá 3 tầng ensemble
   ──────────────────────────────────────────────────────────── */

function StackingTower() {
  const [activeLayer, setActiveLayer] = useState<0 | 1 | 2>(0);

  const LAYERS = [
    {
      title: "Tầng 1 — Base models (33 model đa dạng)",
      models: [
        { name: "XGBoost", color: "#10b981" },
        { name: "LightGBM", color: "#10b981" },
        { name: "CatBoost", color: "#10b981" },
        { name: "Neural Net", color: "#f59e0b" },
        { name: "Random Forest", color: "#3b82f6" },
        { name: "Linear", color: "#3b82f6" },
      ],
      note: "Mỗi model học pattern hơi khác nhau. Đa dạng hoá kiến trúc quan trọng hơn chọn 'model tốt nhất' — vì cần lỗi độc lập để ensemble triệt nhiễu.",
    },
    {
      title: "Tầng 2 — Meta models (3 bộ kết hợp)",
      models: [
        { name: "XGBoost meta", color: "#a855f7" },
        { name: "Neural meta", color: "#a855f7" },
        { name: "AdaBoost meta", color: "#a855f7" },
      ],
      note: "Nhận đầu ra của 33 model tầng 1 làm feature, học cách gán trọng số tối ưu. Out-of-fold predictions là bắt buộc — tránh leak.",
    },
    {
      title: "Tầng 3 — Weighted average (quyết định cuối)",
      models: [{ name: "Trung bình có trọng số", color: "#dc2626" }],
      note: "Lớp mỏng nhất, thường chỉ là weighted average các meta models. Trọng số tối ưu bằng grid search trên CV score.",
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Layers size={16} className="text-accent" />
        <h4 className="text-sm font-bold text-foreground">
          Stacking 3 tầng — bấm từng tầng để tìm hiểu
        </h4>
      </div>

      <div className="space-y-2">
        {LAYERS.map((layer, i) => {
          const revIdx = LAYERS.length - 1 - i;
          const currentLayer = LAYERS[revIdx];
          const isActive = activeLayer === revIdx;
          return (
            <button
              key={revIdx}
              type="button"
              onClick={() => setActiveLayer(revIdx as 0 | 1 | 2)}
              className="w-full text-left"
            >
              <motion.div
                className="rounded-xl border-2 p-3 transition-colors"
                style={{
                  borderColor: isActive
                    ? "var(--color-accent)"
                    : "var(--border)",
                  backgroundColor: isActive
                    ? "var(--color-accent-light)"
                    : "var(--bg-card)",
                }}
                whileHover={{ scale: 1.01 }}
              >
                <div className="text-xs font-semibold text-foreground mb-2">
                  {currentLayer.title}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {currentLayer.models.map((m) => (
                    <span
                      key={m.name}
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{
                        backgroundColor: m.color + "22",
                        color: m.color,
                      }}
                    >
                      <CircleDot size={8} />
                      {m.name}
                    </span>
                  ))}
                </div>
              </motion.div>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeLayer}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="rounded-lg bg-surface/60 border border-border p-3"
        >
          <p className="text-xs text-foreground/85 leading-relaxed">
            {LAYERS[activeLayer].note}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   FINAL SUBMISSION PICKER
   ──────────────────────────────────────────────────────────── */

function FinalSubmissionPicker() {
  type SubId = "safe-ensemble" | "single-strong" | "risky-ensemble" | "copy-public";
  const SUBS: {
    id: SubId;
    label: string;
    cv: number;
    publicLB: number;
    privateExpected: string;
    diversity: "high" | "low";
    story: string;
  }[] = [
    {
      id: "safe-ensemble",
      label: "Ensemble lớn, CV ổn định",
      cv: 0.842,
      publicLB: 0.839,
      privateExpected: "Top 10-30",
      diversity: "low",
      story:
        "35 model tầng 1 + meta XGBoost. CV và public khớp nhau — dấu hiệu tốt. Chọn làm bài nộp 'an toàn'.",
    },
    {
      id: "single-strong",
      label: "Single XGBoost tune cực kỹ",
      cv: 0.838,
      publicLB: 0.835,
      privateExpected: "Top 50-200",
      diversity: "low",
      story:
        "Model đơn lẻ nhưng được tune kỹ với Optuna. Có thể mạnh nếu CV chiến lược tốt — dùng làm backup nếu ensemble rơi shake.",
    },
    {
      id: "risky-ensemble",
      label: "Ensemble nhỏ tập trung loại hiếm",
      cv: 0.836,
      publicLB: 0.828,
      privateExpected: "Top 5-500 (biến động lớn)",
      diversity: "high",
      story:
        "8 model đặc biệt tập trung vào các edge case. CV hơi thấp nhưng DIVERSE so với ensemble lớn — nếu private có nhiều edge case, bay lên top. Nếu không, tụt xa.",
    },
    {
      id: "copy-public",
      label: "Bản public LB top nhưng CV thấp",
      cv: 0.811,
      publicLB: 0.845,
      privateExpected: "Top 200-800",
      diversity: "low",
      story:
        "Public cao nhưng CV thấp → đã overfit public test subset. KHÔNG chọn — shakeup sẽ đánh rớt hàng trăm bậc.",
    },
  ];

  const [picked, setPicked] = useState<Set<SubId>>(new Set());

  function togglePick(id: SubId) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 2) {
        next.add(id);
      }
      return next;
    });
  }

  const hasTooMany = picked.size === 2;
  const bothLowDiversity =
    picked.size === 2 &&
    [...picked].every(
      (id) => SUBS.find((s) => s.id === id)?.diversity === "low",
    );
  const hasCopyPublic = picked.has("copy-public");
  const strategyScore = useMemo(() => {
    if (picked.size === 0) return { text: "Chưa chọn", color: "#94a3b8" };
    if (picked.size === 1)
      return { text: "Cần chọn đúng 2", color: "#f59e0b" };
    if (hasCopyPublic)
      return {
        text: "NGUY HIỂM — bạn đã chọn bài overfit public LB",
        color: "#dc2626",
      };
    if (bothLowDiversity)
      return {
        text: "OK nhưng thiếu đa dạng — cả hai bài gần giống nhau",
        color: "#f59e0b",
      };
    return {
      text: "Tuyệt! Hai bài đa dạng — một an toàn, một mạo hiểm",
      color: "#10b981",
    };
  }, [picked, hasCopyPublic, bothLowDiversity]);

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Flag size={16} className="text-accent" />
        <h4 className="text-sm font-bold text-foreground">
          Chọn đúng 2 bài nộp cuối — nhấn hai bài bạn muốn submit
        </h4>
      </div>

      <p className="text-xs text-muted leading-relaxed">
        Kaggle cho mỗi đội nộp tối đa 2 bài làm final. Nguyên tắc của
        Grandmaster: chọn hai bài <strong>ĐA DẠNG</strong> — nếu chọn hai bài
        giống nhau, chúng thắng cùng hoặc thua cùng. Thử ghép đôi bên dưới.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {SUBS.map((sub) => {
          const isPicked = picked.has(sub.id);
          const disabled = hasTooMany && !isPicked;
          return (
            <button
              key={sub.id}
              type="button"
              onClick={() => togglePick(sub.id)}
              disabled={disabled}
              className={`text-left rounded-xl border-2 p-3 transition-all ${
                disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
              }`}
              style={{
                borderColor: isPicked
                  ? sub.id === "copy-public"
                    ? "#dc2626"
                    : sub.diversity === "high"
                      ? "#a855f7"
                      : "#10b981"
                  : "var(--border)",
                backgroundColor: isPicked
                  ? (sub.id === "copy-public"
                      ? "#dc2626"
                      : sub.diversity === "high"
                        ? "#a855f7"
                        : "#10b981") + "15"
                  : "var(--bg-card)",
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-foreground">
                  {sub.label}
                </span>
                {isPicked && (
                  <Sparkles size={13} className="text-accent" />
                )}
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-[10px] mb-1.5">
                <div>
                  <div className="text-muted">CV</div>
                  <div className="font-mono tabular-nums font-bold text-foreground">
                    {sub.cv.toFixed(3)}
                  </div>
                </div>
                <div>
                  <div className="text-muted">Public LB</div>
                  <div className="font-mono tabular-nums font-bold text-foreground">
                    {sub.publicLB.toFixed(3)}
                  </div>
                </div>
                <div>
                  <div className="text-muted">Private dự kiến</div>
                  <div className="font-bold text-foreground">
                    {sub.privateExpected}
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-muted leading-snug">
                {sub.story}
              </p>
            </button>
          );
        })}
      </div>

      <div
        className="rounded-lg p-3 border"
        style={{
          borderColor: strategyScore.color,
          backgroundColor: strategyScore.color + "15",
        }}
      >
        <div className="flex items-center gap-2 text-sm font-semibold">
          {hasCopyPublic ? (
            <AlertOctagon size={14} style={{ color: strategyScore.color }} />
          ) : picked.size === 2 && !bothLowDiversity ? (
            <Sparkles size={14} style={{ color: strategyScore.color }} />
          ) : (
            <GitMerge size={14} style={{ color: strategyScore.color }} />
          )}
          <span style={{ color: strategyScore.color }}>
            {strategyScore.text}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   CV STRATEGY CHOOSER — small static visual
   ──────────────────────────────────────────────────────────── */

function CvStrategyDiagram() {
  const VARIANTS = [
    {
      name: "K-Fold",
      when: "Dữ liệu IID, không có nhóm, không thời gian",
      color: "#3b82f6",
    },
    {
      name: "Stratified K-Fold",
      when: "Classification mất cân bằng — mỗi fold giữ tỉ lệ lớp",
      color: "#10b981",
    },
    {
      name: "Group K-Fold",
      when: "Có nhóm (cùng bệnh nhân, cùng user) — tránh leak",
      color: "#a855f7",
    },
    {
      name: "Time Series Split",
      when: "Dữ liệu theo thời gian — train quá khứ, validate tương lai",
      color: "#f59e0b",
    },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {VARIANTS.map((v) => (
        <div
          key={v.name}
          className="rounded-lg border bg-card p-3"
          style={{ borderLeft: `4px solid ${v.color}` }}
        >
          <div className="text-xs font-bold" style={{ color: v.color }}>
            {v.name}
          </div>
          <p className="text-[11px] text-muted leading-snug mt-1">
            {v.when}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   TIMELINE EVENT
   ──────────────────────────────────────────────────────────── */

function TimelineEvent({
  date,
  title,
  body,
  color,
}: {
  date: string;
  title: string;
  body: string;
  color: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="shrink-0 mt-1 h-8 w-8 rounded-full flex items-center justify-center text-white"
        style={{ backgroundColor: color }}
      >
        <CircleDot size={14} />
      </div>
      <div className="flex-1 rounded-xl border border-border bg-card p-3">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-sm font-semibold text-foreground">
            {title}
          </span>
          <span
            className="text-[11px] tabular-nums font-mono px-2 py-0.5 rounded-full"
            style={{ backgroundColor: color + "22", color }}
          >
            {date}
          </span>
        </div>
        <p className="text-xs text-foreground/80 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

/* ════════════════════════ MAIN ════════════════════════ */

export default function ModelEvaluationSelectionInKaggle() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Đánh giá và chọn mô hình"
    >
      {/* HERO */}
      <ApplicationHero
        parentTitleVi="Đánh giá và chọn mô hình"
        topicSlug="model-evaluation-selection-in-kaggle"
      >
        <p>
          Kaggle (nền tảng thi đấu khoa học dữ liệu của Google) là đấu trường
          nơi hàng chục nghìn kỹ sư và nhà nghiên cứu cạnh tranh trên cùng bộ
          dữ liệu. Giải thưởng lên tới hàng triệu đô-la, và thứ hạng được
          quyết định bởi từng phần nghìn của metric đánh giá.
        </p>
        <p>
          Bài học lớn nhất từ Kaggle:{" "}
          <strong>bạn không bao giờ thắng bằng một chiến thuật nhất định</strong>.
          Có <em>gấu chậm</em> (nộp sớm một model mạnh), có <em>cáo nhanh</em>{" "}
          (tune theo public leaderboard mỗi ngày), có <em>cú khôn</em> (tin CV
          nội bộ, ensemble lớn, final diversity). Ba tính cách — ba kết thúc
          khác nhau khi private leaderboard được công bố.
        </p>
      </ApplicationHero>

      {/* PROBLEM */}
      <ApplicationProblem topicSlug="model-evaluation-selection-in-kaggle">
        <p>
          Kaggle chia test data thành hai phần ẩn:{" "}
          <strong>public leaderboard</strong> (chỉ dùng khoảng 25% test để
          chấm điểm cập nhật hằng ngày) và <strong>private leaderboard</strong>{" "}
          (75% còn lại, chỉ công bố khi cuộc thi kết thúc). Mục đích: tránh
          các đội tune tham số chỉ theo public.
        </p>
        <p>
          Hiện tượng <em>leaderboard shakeup</em> là lúc private được lật
          lên. Nhiều đội đứng top 10 public rớt hàng trăm bậc — vì đã overfit
          vào subset công khai mà không biết. Đội khác, chậm ở public,
          leo vài chục bậc. Làm thế nào biết model thực sự tốt hay chỉ may
          mắn? Làm thế nào chọn đúng 2 bài nộp cuối từ hàng trăm thí nghiệm?
          Đây là câu chuyện của đánh giá và chọn mô hình ở độ khó cao nhất.
        </p>
      </ApplicationProblem>

      {/* MECHANISM */}
      <ApplicationMechanism
        parentTitleVi="Đánh giá và chọn mô hình"
        topicSlug="model-evaluation-selection-in-kaggle"
      >
        <Beat step={1}>
          <p>
            <strong>
              Cross-validation strategy — nền tảng không thể thiếu.
            </strong>{" "}
            Grandmaster xây CV strategy trước mọi thứ khác. K-Fold là mặc
            định, nhưng tuỳ bài cần biến thể: Stratified cho imbalanced, Group
            K-Fold khi có nhóm dữ liệu (cùng bệnh nhân), Time-Series Split cho
            chuỗi thời gian. Quy tắc vàng: nếu CV score và public LB tương
            quan tốt, hãy tin CV — không phải public.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>
              Metric selection — hiểu cuộc thi đang đo gì.
            </strong>{" "}
            RMSE cho regression, AUC cho classification, MAP@K cho ranking,
            log-loss cho probabilistic. Grandmaster phân tích metric trước
            khi viết dòng code đầu tiên — metric quyết định loss function nào
            để train, threshold nào để cut-off, và cách tối ưu ensemble. Ví
            dụ: log-loss phạt nặng dự đoán tự tin sai — phải calibrate
            probability.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>
              Ensemble stacking — xếp chồng model qua nhiều tầng.
            </strong>{" "}
            Grandmaster huấn luyện hàng chục, đôi khi hàng trăm model đa
            dạng: XGBoost, LightGBM, CatBoost, neural net, linear. Dự đoán của
            các model này trở thành feature đầu vào cho meta-model. Bài
            thắng Kaggle tháng 4/2025 dùng 3 tầng: tầng 1 gồm 33 model, tầng
            2 có 3 meta (XGBoost, neural net, AdaBoost), tầng 3 là trung bình
            có trọng số. Giải pháp cuối chọn 75 model từ 500 thí nghiệm.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>
              Final submission strategy — diversity is everything.
            </strong>{" "}
            Kaggle cho phép 2 bài nộp cuối. Grandmaster áp dụng nguyên tắc{" "}
            <em>diversity</em>: chọn hai bài rất khác nhau — một bài an toàn
            (CV mạnh, ensemble lớn) và một bài mạo hiểm (single model mạnh
            hoặc ensemble nhỏ đặc biệt). Nếu chọn hai bài giống nhau, chúng
            thắng cùng hoặc thua cùng — mất lợi thế đa dạng. Quyết định này
            thường phân biệt top 10 và top 100.
          </p>
        </Beat>
      </ApplicationMechanism>

      {/* TRY IT — main visual showcase */}
      <ApplicationTryIt topicSlug="model-evaluation-selection-in-kaggle">
        <h3 className="text-base font-semibold text-foreground mb-3">
          Gấu vs Cáo vs Cú — mô phỏng 8 tuần Kaggle
        </h3>
        <p className="text-sm text-muted leading-relaxed mb-4">
          Nhấn <em>Chạy mô phỏng</em> để xem ba chiến thuật đua trên public
          leaderboard suốt 8 tuần. Khi cuộc thi kết thúc, nhấn <em>Công bố
          private</em> — đây là khoảnh khắc &ldquo;sự thật&rdquo;.
        </p>

        <KaggleScoreboard />

        <div className="mt-6">
          <InlineChallenge
            question="Cáo nhanh đứng top 5 public suốt tuần cuối, rồi rớt xuống #185 private. Nguyên nhân chính?"
            options={[
              "Cáo nhanh không may mắn",
              "Cáo nhanh đã tune tham số theo feedback public LB — vô tình overfit vào 25% test công khai, không tổng quát cho 75% private",
              "Kaggle sai số ngẫu nhiên",
              "Ensemble nhỏ không đủ mạnh",
            ]}
            correct={1}
            explanation="Đây là shakeup kinh điển. Public LB là một subset — nếu bạn chọn model dựa trên điểm public hàng ngày, bạn đang fit một tập test bé. 75% private có phân phối khác chút — và model đã overfit sẽ sập. Trust CV > public LB luôn là nguyên tắc sống còn."
          />
        </div>

        <h3 className="text-base font-semibold text-foreground mt-8 mb-3">
          Ensemble stacking — 3 tầng của bài thắng Kaggle 2025
        </h3>
        <p className="text-sm text-muted leading-relaxed mb-4">
          Grandmaster không chỉ train nhiều model — họ <em>kiến trúc</em>{" "}
          ensemble thành các tầng. Mỗi tầng có nhiệm vụ riêng: tầng 1 đa
          dạng, tầng 2 kết hợp, tầng 3 ổn định.
        </p>

        <StackingTower />

        <div className="mt-4">
          <Callout variant="insight" title="Ba nguyên tắc stacking">
            <ol className="list-decimal pl-5 space-y-1 mt-1">
              <li>
                <strong>Đa dạng architecture</strong> quan trọng hơn &ldquo;model
                tốt nhất&rdquo;. Ensemble 10 model giống nhau ~ 1 model. Ensemble
                10 model khác kiến trúc &raquo; 10× tốt hơn.
              </li>
              <li>
                <strong>Out-of-fold predictions</strong> bắt buộc khi stack.
                Dùng prediction train sẽ leak — meta model học thuộc, private
                sập.
              </li>
              <li>
                <strong>Diminishing returns</strong>: từ 10 lên 100 model, gain
                giảm dần. Từ 100 lên 800, gần như không đáng — trừ khi chênh
                lệch giải thưởng lớn.
              </li>
            </ol>
          </Callout>
        </div>

        <h3 className="text-base font-semibold text-foreground mt-8 mb-3">
          Thử chọn 2 bài nộp cuối — bạn chọn gì?
        </h3>
        <p className="text-sm text-muted leading-relaxed mb-4">
          Bạn có 4 ứng viên: ensemble an toàn, single XGBoost tune kỹ, ensemble
          nhỏ mạo hiểm, và bản &ldquo;copy public LB top&rdquo;. Chỉ được chọn 2.
          Thử nhấn hai thẻ — hệ thống chấm chiến thuật của bạn.
        </p>

        <FinalSubmissionPicker />

        <div className="mt-6">
          <InlineChallenge
            question="CV của bạn = 0.842, public LB = 0.839. Một notebook public có public LB = 0.851 nhưng không biết CV. Nên làm gì?"
            options={[
              "Copy ngay — public LB cao hơn là tốt hơn",
              "Chạy CV trên notebook đó. Nếu CV < 0.82, đó là overfit public — bỏ qua. Nếu CV ~ 0.84, cân nhắc blend với bài của bạn",
              "Bỏ hết bài của mình, dùng bản public",
              "Đợi đến phút cuối rồi quyết",
            ]}
            correct={1}
            explanation="Public LB cao mà CV thấp là dấu hiệu overfit — shakeup sẽ lật kết quả. Grandmaster luôn chạy CV trên mọi model, kể cả model public. Chỉ tin public LB khi nó tương quan với CV nội bộ. Nếu tin được, có thể blend để tăng diversity."
          />
        </div>

        <h3 className="text-base font-semibold text-foreground mt-8 mb-3">
          Chọn CV strategy theo loại dữ liệu
        </h3>
        <p className="text-sm text-muted leading-relaxed mb-4">
          K-Fold mặc định không phải lúc nào cũng đúng. Bốn biến thể thường
          gặp:
        </p>
        <CvStrategyDiagram />

        <h3 className="text-base font-semibold text-foreground mt-8 mb-3">
          Vì sao ensemble stacking mạnh đến thế?
        </h3>
        <p className="text-sm text-muted leading-relaxed mb-4">
          Đọc từng bước dưới đây — mỗi bước là một mảnh ghép của nguyên lý
          &ldquo;trộn nhiều model&rdquo;. Khi hiểu hết, bạn đã hiểu 90% vì sao
          Kaggle solutions thường gồm 20+ model.
        </p>

        <StepReveal
          labels={[
            "1. Mỗi model có lỗi riêng",
            "2. Lỗi lệch ngẫu nhiên",
            "3. Trung bình triệt nhiễu",
            "4. Stacking học trọng số tối ưu",
          ]}
        >
          {[
            <div
              key="k1"
              className="rounded-lg bg-surface/60 border border-border p-4"
            >
              <p className="text-sm text-foreground leading-relaxed">
                Giả sử XGBoost dự đoán xác suất = 0,72 cho một mẫu. LightGBM
                dự đoán 0,68. Neural Net dự đoán 0,81. Nhãn thật là 1. Cả ba
                model đều không hoàn hảo — mỗi model có kiểu sai riêng.
              </p>
            </div>,
            <div
              key="k2"
              className="rounded-lg bg-surface/60 border border-border p-4"
            >
              <p className="text-sm text-foreground leading-relaxed">
                Chìa khoá: các sai lệch <em>không cùng hướng</em>. XGBoost
                nhạy với outlier, LightGBM nhạy với cardinality cao, Neural
                Net nhạy với scale không đều. Mỗi model sai theo cách riêng —
                đây là <em>tính độc lập</em> của lỗi mà ensemble cần.
              </p>
            </div>,
            <div
              key="k3"
              className="rounded-lg bg-surface/60 border border-border p-4"
            >
              <p className="text-sm text-foreground leading-relaxed">
                Trung bình ba dự đoán: (0,72 + 0,68 + 0,81) / 3 = 0,737. Gần
                hơn nhãn thật so với 2/3 model riêng. Toán học: nếu sai số
                độc lập với trung bình gần 0, variance của{" "}
                <em>trung bình n model</em> chỉ bằng <em>1/n</em> variance của
                một model.
              </p>
            </div>,
            <div
              key="k4"
              className="rounded-lg bg-surface/60 border border-border p-4"
            >
              <p className="text-sm text-foreground leading-relaxed">
                Stacking đi xa hơn trung bình thường: meta model <em>học</em>{" "}
                trọng số tối ưu cho từng model tầng 1, thậm chí học trọng số
                phụ thuộc vào feature. XGBoost có thể đúng hơn khi transaction
                amount lớn, LightGBM đúng hơn khi category hiếm — meta model
                phát hiện pattern này và gán trọng số động.
              </p>
            </div>,
          ]}
        </StepReveal>

        <div className="mt-8">
          <h3 className="text-base font-semibold text-foreground mb-3">
            Netflix Prize: dòng thời gian nổi tiếng của ensemble
          </h3>
          <p className="text-sm text-muted leading-relaxed mb-4">
            Bốn cột mốc của cuộc thi ML công khai lớn nhất lịch sử — cũng là
            &ldquo;trường ca&rdquo; dạy ngành này về ensemble.
          </p>
          <div className="space-y-3">
            <TimelineEvent
              date="10/2006"
              title="Netflix công bố giải $1M"
              body="Cải thiện RMSE của Cinematch ≥ 10%. 100 triệu rating, 480 000 user, 17 770 phim — lớn nhất thời đó."
              color="#3b82f6"
            />
            <TimelineEvent
              date="10/2007"
              title="Progress Prize — BellKor đạt 8,43%"
              body="Team AT&T Labs dẫn đầu với SVD cải tiến + RBM. Chưa đủ 10% — cần thêm model."
              color="#10b981"
            />
            <TimelineEvent
              date="06/2009"
              title="Ba team merge thành một"
              body="BellKor + BigChaos + Pragmatic Theory = BellKor's Pragmatic Chaos. Tận dụng model của nhau, rút ngắn đường đến 10%."
              color="#a855f7"
            />
            <TimelineEvent
              date="26/07/2009 18:42 UTC"
              title="Hai team cán đích cùng lúc"
              body="BellKor's Pragmatic Chaos nộp RMSE 0,8554. 20 phút sau, The Ensemble nộp kết quả bằng nhau. BellKor thắng vì sớm hơn. 800+ model — câu chuyện kinh điển của stacking."
              color="#f59e0b"
            />
          </div>
        </div>

        <h3 className="text-base font-semibold text-foreground mt-8 mb-3">
          Code pattern Grandmaster — 12 dòng core của stacking
        </h3>
        <p className="text-sm text-muted leading-relaxed mb-4">
          Đây là pattern chung cho stacking 2 tầng: out-of-fold prediction ở
          tầng 1, meta model ở tầng 2. Dòng quan trọng nhất là{" "}
          <code>oof_preds</code> — prediction trên fold mà model chưa thấy.
        </p>

        <CodeBlock language="python" title="stacking_oof_pattern.py">
          {`from sklearn.model_selection import KFold
import numpy as np
kf = KFold(n_splits=5, shuffle=True, random_state=42)
oof_preds = np.zeros(len(X_train))
for tr_idx, va_idx in kf.split(X_train):
    model = LGBMClassifier().fit(X_train[tr_idx], y_train[tr_idx])
    oof_preds[va_idx] = model.predict_proba(X_train[va_idx])[:, 1]
meta_X = np.column_stack([oof_preds_xgb, oof_preds_lgbm, oof_preds_nn])
meta_model = LogisticRegression().fit(meta_X, y_train)
print("CV meta:", meta_model.score(meta_X, y_train))`}
        </CodeBlock>

        <CodeBlock language="python" title="submit_two_diverse.py">
          {`# Chọn 2 bài nộp đa dạng
safe_sub = big_ensemble.predict_proba(X_test)[:, 1]
risky_sub = small_focused_ensemble.predict_proba(X_test)[:, 1]
# Kiểm tra diversity bằng correlation — thấp = đa dạng tốt
correlation = np.corrcoef(safe_sub, risky_sub)[0, 1]
print(f"Correlation giữa 2 bài nộp: {correlation:.3f}")
print("OK nếu < 0.90. Nếu > 0.95, hai bài gần như giống nhau — chọn lại.")`}
        </CodeBlock>

        <Callout
          variant="warning"
          title="Cạm bẫy lớn nhất — nhìn public LB quá nhiều"
        >
          Kaggle Grandmaster Kazanova nói: &ldquo;Tôi chỉ mở public leaderboard
          2 lần trong cả cuộc thi — ngày nộp bài đầu tiên, và ngày cuối.&rdquo;
          Nhìn public quá nhiều là con đường nhanh nhất đến shakeup. Trust
          CV. Trust CV. Trust CV.
        </Callout>
      </ApplicationTryIt>

      {/* METRICS */}
      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="model-evaluation-selection-in-kaggle"
      >
        <Metric
          value="Bài thắng Kaggle 4/2025 dùng stacking 3 tầng: 33 model tầng 1, chọn từ 500 thí nghiệm"
          sourceRef={2}
        />
        <Metric
          value="Giải pháp cuối sử dụng 75 model tầng 1 đa dạng để tối đa hoá ensemble"
          sourceRef={2}
        />
        <Metric
          value="Grandmaster Kazanova (top 3 Kaggle): 'Ensemble luôn thắng single model ở private leaderboard'"
          sourceRef={5}
        />
        <Metric
          value="CV strategy đúng giúp tương quan cao giữa CV score và private leaderboard"
          sourceRef={6}
        />
        <Metric
          value="Bellkor's Pragmatic Chaos dùng 800+ model để đạt RMSE 0,8554 — thắng Netflix $1M"
          sourceRef={4}
        />
      </ApplicationMetrics>

      {/* COUNTERFACTUAL */}
      <ApplicationCounterfactual
        parentTitleVi="Đánh giá và chọn mô hình"
        topicSlug="model-evaluation-selection-in-kaggle"
      >
        <p>
          Không có chiến thuật đánh giá, bạn train một model, thấy public LB
          cao, tự tin nộp bài — rồi rớt hàng trăm bậc khi private công bố.
          Đây là shakeup: model đã overfit phần public test mà bạn không biết.
        </p>
        <p>
          Cross-validation nội bộ là la bàn đáng tin: đánh giá model trên
          nhiều fold, không phụ thuộc leaderboard. Ensemble stacking giảm
          variance dự đoán — như hỏi ý kiến 100 chuyên gia thay vì một.
          Final submission diversity đảm bảo không &ldquo;bỏ trứng vào một
          giỏ.&rdquo; Ba yếu tố này biến Kaggle từ trò may rủi thành khoa
          học có hệ thống — cũng chính là cách{" "}
          <TopicLink slug="model-evaluation-selection">
            đánh giá và chọn mô hình
          </TopicLink>{" "}
          hoạt động ở sản phẩm thật.
        </p>
      </ApplicationCounterfactual>

      {/* Bottom summary */}
      <section className="mb-10">
        <MiniSummary
          title="4 bài học chọn model trên Kaggle"
          points={[
            "Trust CV > public leaderboard. Public chỉ là 25% test — overfit nó = shakeup.",
            "Ensemble stacking: tầng 1 đa dạng kiến trúc, tầng 2 kết hợp qua meta model, dùng out-of-fold predictions để tránh leak.",
            "Metric là ngôi sao Bắc Đẩu — hiểu cuộc thi đo gì TRƯỚC khi viết dòng code đầu tiên.",
            "Hai bài nộp cuối phải ĐA DẠNG: một an toàn, một mạo hiểm. Correlation giữa hai submission nên dưới 0,90.",
          ]}
        />
        <div className="mt-4 flex items-center justify-center text-xs text-muted gap-2">
          <Clock size={12} />
          <Shuffle size={12} />
          <span>
            Kaggle không phải trò may rủi — nó là kỳ thi đo năng lực đánh giá
            model của bạn.
          </span>
        </div>
      </section>
    </ApplicationLayout>
  );
}
