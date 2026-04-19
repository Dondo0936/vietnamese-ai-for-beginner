"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
  CollapsibleDetail,
  TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "random-forests",
  title: "Random Forests",
  titleVi: "Rừng ngẫu nhiên",
  description:
    "Kết hợp nhiều cây quyết định để tạo mô hình mạnh mẽ và ổn định hơn",
  category: "classic-ml",
  tags: ["ensemble", "classification", "bagging"],
  difficulty: "intermediate",
  relatedSlugs: ["decision-trees", "gradient-boosting", "bias-variance"],
  vizType: "interactive",
};

/* ══════════════════════════════════════════════════════════════
   DỮ LIỆU: dataset giả lập cho bài toán "khách hàng có mua?"
   Mỗi sample có 4 feature: giá, đánh giá, phí ship, có voucher.
   Nhãn: 1 = mua, 0 = không mua.
   ══════════════════════════════════════════════════════════════ */

interface Sample {
  id: number;
  gia: number; // triệu đồng
  danhGia: number; // 1..5
  ship: number; // nghìn đồng
  voucher: 0 | 1;
  label: 0 | 1;
}

const FULL_DATASET: Sample[] = [
  { id: 1, gia: 2.0, danhGia: 4.5, ship: 20, voucher: 1, label: 1 },
  { id: 2, gia: 3.5, danhGia: 3.2, ship: 45, voucher: 0, label: 0 },
  { id: 3, gia: 1.8, danhGia: 4.8, ship: 15, voucher: 1, label: 1 },
  { id: 4, gia: 4.2, danhGia: 2.8, ship: 60, voucher: 0, label: 0 },
  { id: 5, gia: 2.5, danhGia: 4.1, ship: 25, voucher: 1, label: 1 },
  { id: 6, gia: 3.8, danhGia: 3.5, ship: 40, voucher: 0, label: 0 },
  { id: 7, gia: 1.5, danhGia: 4.9, ship: 10, voucher: 1, label: 1 },
  { id: 8, gia: 4.5, danhGia: 2.5, ship: 55, voucher: 0, label: 0 },
  { id: 9, gia: 2.2, danhGia: 4.3, ship: 18, voucher: 1, label: 1 },
  { id: 10, gia: 3.9, danhGia: 3.0, ship: 50, voucher: 0, label: 0 },
  { id: 11, gia: 2.8, danhGia: 4.0, ship: 30, voucher: 1, label: 1 },
  { id: 12, gia: 4.0, danhGia: 2.9, ship: 48, voucher: 0, label: 0 },
];

/* Một bootstrap sample = cùng kích thước, lấy mẫu có hoàn lại */
interface TreeInfo {
  id: number;
  /** id của các sample (có thể trùng lặp vì bootstrap) */
  bootstrapIds: number[];
  /** feature subset cây này được xem */
  features: string[];
  /** prediction giả lập cho 1 test point mới */
  vote: 0 | 1;
  confidence: number;
  /** các sample KHÔNG có trong bootstrap — dùng cho OOB */
  oobIds: number[];
  /** độ chính xác OOB giả lập của riêng cây này */
  oobAcc: number;
}

const FEATURES = ["giá", "đánh giá", "ship", "voucher"] as const;

const TREES: TreeInfo[] = [
  {
    id: 1,
    bootstrapIds: [1, 1, 3, 5, 7, 7, 9, 11, 11, 3, 5, 1],
    features: ["giá", "đánh giá"],
    vote: 1,
    confidence: 0.88,
    oobIds: [2, 4, 6, 8, 10, 12],
    oobAcc: 0.78,
  },
  {
    id: 2,
    bootstrapIds: [2, 4, 4, 6, 8, 10, 10, 12, 2, 6, 8, 12],
    features: ["đánh giá", "ship"],
    vote: 0,
    confidence: 0.72,
    oobIds: [1, 3, 5, 7, 9, 11],
    oobAcc: 0.71,
  },
  {
    id: 3,
    bootstrapIds: [1, 3, 5, 5, 7, 9, 11, 11, 3, 1, 7, 9],
    features: ["giá", "voucher"],
    vote: 1,
    confidence: 0.94,
    oobIds: [2, 4, 6, 8, 10, 12],
    oobAcc: 0.85,
  },
  {
    id: 4,
    bootstrapIds: [4, 6, 8, 8, 10, 12, 2, 4, 10, 6, 12, 2],
    features: ["ship", "voucher"],
    vote: 1,
    confidence: 0.68,
    oobIds: [1, 3, 5, 7, 9, 11],
    oobAcc: 0.74,
  },
  {
    id: 5,
    bootstrapIds: [1, 2, 3, 5, 6, 7, 9, 10, 11, 12, 3, 5],
    features: ["giá", "đánh giá", "ship"],
    vote: 0,
    confidence: 0.61,
    oobIds: [4, 8],
    oobAcc: 0.69,
  },
];

/* Feature importance giả lập cho dataset này */
const FEATURE_IMPORTANCE: Record<string, number> = {
  giá: 0.42,
  "đánh giá": 0.33,
  ship: 0.17,
  voucher: 0.08,
};

/* ══════════════════════════════════════════════════════════════
   TIỆN ÍCH TOÁN: combinatorial cho tính accuracy lý thuyết
   ══════════════════════════════════════════════════════════════ */

function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function combination(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  return factorial(n) / (factorial(k) * factorial(n - k));
}

/** Xác suất đa số đúng khi N cây độc lập, mỗi cây accuracy p */
function majorityVoteAccuracy(n: number, p: number): number {
  if (n <= 0) return 0;
  let acc = 0;
  const majority = Math.ceil((n + 1) / 2);
  for (let k = majority; k <= n; k++) {
    acc += combination(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
  }
  return acc;
}

/* ══════════════════════════════════════════════════════════════
   HÌNH ẢNH CÂY QUYẾT ĐỊNH NHỎ — SVG
   ══════════════════════════════════════════════════════════════ */

function MiniTreeSvg({
  tree,
  highlighted,
}: {
  tree: TreeInfo;
  highlighted: boolean;
}) {
  const voteColor = tree.vote === 1 ? "#3b82f6" : "#ef4444";
  return (
    <svg viewBox="0 0 120 140" className="h-auto w-full">
      {/* Root */}
      <circle
        cx={60}
        cy={20}
        r={8}
        fill={highlighted ? "#f59e0b" : "#6b7280"}
        opacity={highlighted ? 0.9 : 0.5}
      />
      <text x={60} y={23} fontSize={11} fill="white" textAnchor="middle">
        {tree.features[0]?.slice(0, 3)}
      </text>

      {/* Lines to children */}
      <line
        x1={60}
        y1={28}
        x2={35}
        y2={55}
        stroke="#9ca3af"
        strokeWidth={1}
      />
      <line
        x1={60}
        y1={28}
        x2={85}
        y2={55}
        stroke="#9ca3af"
        strokeWidth={1}
      />

      {/* Mid nodes */}
      <circle
        cx={35}
        cy={60}
        r={7}
        fill={highlighted ? "#10b981" : "#6b7280"}
        opacity={highlighted ? 0.85 : 0.4}
      />
      <text x={35} y={63} fontSize={11} fill="white" textAnchor="middle">
        {tree.features[1]?.slice(0, 3) ?? "?"}
      </text>
      <circle
        cx={85}
        cy={60}
        r={7}
        fill={highlighted ? "#10b981" : "#6b7280"}
        opacity={highlighted ? 0.85 : 0.4}
      />
      <text x={85} y={63} fontSize={11} fill="white" textAnchor="middle">
        {tree.features[1]?.slice(0, 3) ?? "?"}
      </text>

      {/* Lines to leaves */}
      <line x1={35} y1={67} x2={20} y2={90} stroke="#9ca3af" strokeWidth={1} />
      <line x1={35} y1={67} x2={50} y2={90} stroke="#9ca3af" strokeWidth={1} />
      <line x1={85} y1={67} x2={70} y2={90} stroke="#9ca3af" strokeWidth={1} />
      <line
        x1={85}
        y1={67}
        x2={100}
        y2={90}
        stroke="#9ca3af"
        strokeWidth={1}
      />

      {/* Leaves (predictions) */}
      {[20, 50, 70, 100].map((cx, i) => {
        const isVote = (i === 0 || i === 3) === (tree.vote === 1);
        return (
          <rect
            key={i}
            x={cx - 5}
            y={90}
            width={10}
            height={10}
            rx={2}
            fill={isVote ? voteColor : "#d1d5db"}
            opacity={highlighted ? 0.9 : 0.5}
          />
        );
      })}

      {/* Vote badge */}
      <rect
        x={42}
        y={112}
        width={36}
        height={18}
        rx={9}
        fill={voteColor}
        opacity={highlighted ? 0.9 : 0.4}
      />
      <text
        x={60}
        y={124}
        fontSize={11}
        fill="white"
        textAnchor="middle"
        fontWeight={700}
      >
        {tree.vote === 1 ? "MUA" : "KHÔNG"}
      </text>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   KHỐI: hiển thị một bootstrap sample
   ══════════════════════════════════════════════════════════════ */

function BootstrapStrip({ tree }: { tree: TreeInfo }) {
  const counts = new Map<number, number>();
  tree.bootstrapIds.forEach((id) =>
    counts.set(id, (counts.get(id) ?? 0) + 1),
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground">
          Bootstrap sample của cây {tree.id}
        </p>
        <p className="text-[10px] text-muted">
          features: {tree.features.join(", ")}
        </p>
      </div>
      <div className="grid grid-cols-12 gap-1">
        {FULL_DATASET.map((s) => {
          const c = counts.get(s.id) ?? 0;
          return (
            <div
              key={s.id}
              className={`relative flex h-6 items-center justify-center rounded text-[9px] font-mono transition-colors ${
                c === 0
                  ? "bg-surface text-muted opacity-40"
                  : c === 1
                    ? "bg-accent/30 text-foreground"
                    : c === 2
                      ? "bg-accent/60 text-white"
                      : "bg-accent text-white"
              }`}
              title={`sample ${s.id}: xuất hiện ${c} lần`}
            >
              {s.id}
              {c > 1 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-amber-400 text-[8px] font-bold text-white">
                  {c}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 text-[10px] text-muted">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded bg-accent" /> trong bootstrap
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded bg-surface border border-border" />{" "}
          OOB (out-of-bag, ~37%)
        </span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   KHỐI: Forest visualization (5 cây + vote + slider)
   ══════════════════════════════════════════════════════════════ */

function ForestVisualization({
  nEstimators,
  maxDepth,
  selectedTreeId,
  setSelectedTreeId,
}: {
  nEstimators: number;
  maxDepth: number;
  selectedTreeId: number;
  setSelectedTreeId: (id: number) => void;
}) {
  const activeTrees = TREES.slice(0, Math.min(nEstimators, TREES.length));

  const vote1 = activeTrees.filter((t) => t.vote === 1).length;
  const vote0 = activeTrees.filter((t) => t.vote === 0).length;
  const winner: 0 | 1 = vote1 >= vote0 ? 1 : 0;
  const agreement =
    activeTrees.length === 0
      ? 0
      : Math.max(vote1, vote0) / activeTrees.length;

  /* Accuracy ~ giảm theo max_depth quá lớn (overfit) */
  const singleTreeAcc = useMemo(() => {
    /* depth quá nhỏ → underfit, depth quá to → overfit, tối ưu ~6 */
    const penalty = Math.abs(maxDepth - 6) * 0.02;
    return Math.max(0.55, Math.min(0.82, 0.78 - penalty));
  }, [maxDepth]);

  const forestAcc = useMemo(
    () => majorityVoteAccuracy(activeTrees.length, singleTreeAcc),
    [activeTrees.length, singleTreeAcc],
  );

  return (
    <div className="space-y-4">
      {/* Hàng 5 cây */}
      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: `repeat(${Math.max(activeTrees.length, 1)}, minmax(0, 1fr))`,
        }}
      >
        {activeTrees.map((tree) => (
          <button
            key={tree.id}
            type="button"
            onClick={() => setSelectedTreeId(tree.id)}
            className={`rounded-xl border-2 p-2 text-center transition-colors ${
              selectedTreeId === tree.id
                ? "border-accent bg-accent/5"
                : "border-border bg-card hover:bg-surface"
            }`}
          >
            <p className="mb-1 text-[11px] font-semibold text-foreground">
              Cây {tree.id}
            </p>
            <MiniTreeSvg
              tree={tree}
              highlighted={selectedTreeId === tree.id}
            />
            <div
              className={`mt-1 rounded px-1 py-0.5 text-[10px] font-bold ${
                tree.vote === 1
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
              }`}
            >
              {tree.vote === 1 ? "MUA" : "KHÔNG"} · {(tree.confidence * 100).toFixed(0)}%
            </div>
          </button>
        ))}
      </div>

      {/* Mũi tên ensemble */}
      <div className="flex flex-col items-center gap-1">
        <div className="h-4 w-0.5 bg-muted" />
        <div className="text-xs font-semibold text-muted">
          bỏ phiếu đa số
        </div>
      </div>

      {/* Hộp kết quả */}
      <motion.div
        animate={{
          borderColor: winner === 1 ? "#3b82f6" : "#ef4444",
          backgroundColor:
            winner === 1
              ? "rgba(59, 130, 246, 0.08)"
              : "rgba(239, 68, 68, 0.08)",
        }}
        transition={{ duration: 0.25 }}
        className="rounded-xl border-2 p-4 text-center"
      >
        <p
          className="text-base font-bold"
          style={{ color: winner === 1 ? "#3b82f6" : "#ef4444" }}
        >
          Rừng dự đoán: {winner === 1 ? "MUA" : "KHÔNG MUA"}
        </p>
        <p className="mt-1 text-xs text-muted">
          MUA: {vote1} phiếu · KHÔNG: {vote0} phiếu (trên {activeTrees.length}{" "}
          cây) · Đồng thuận {(agreement * 100).toFixed(0)}%
        </p>
      </motion.div>

      {/* Accuracy bars */}
      <div className="space-y-2 rounded-lg border border-border bg-background/40 p-3">
        <p className="text-xs font-semibold text-foreground">
          Độ chính xác lý thuyết
        </p>
        <div className="flex items-center gap-2">
          <span className="w-20 text-xs text-muted">1 cây</span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface">
            <motion.div
              animate={{ width: `${singleTreeAcc * 100}%` }}
              className="h-full rounded-full bg-orange-400"
            />
          </div>
          <span className="w-12 text-right font-mono text-xs text-foreground">
            {(singleTreeAcc * 100).toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-20 text-xs text-muted">
            Rừng {activeTrees.length} cây
          </span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface">
            <motion.div
              animate={{ width: `${forestAcc * 100}%` }}
              className="h-full rounded-full bg-green-500"
            />
          </div>
          <span className="w-12 text-right font-mono text-xs text-foreground">
            {(forestAcc * 100).toFixed(1)}%
          </span>
        </div>
        <p className="text-[11px] leading-relaxed text-muted">
          Công thức:{" "}
          <LaTeX>
            {"P(\\text{rừng đúng}) = \\sum_{k \\geq \\lceil n/2 \\rceil}^n \\binom{n}{k} p^k (1-p)^{n-k}"}
          </LaTeX>{" "}
          với <LaTeX>{"p"}</LaTeX> là accuracy của một cây.
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   KHỐI: Feature importance bar chart
   ══════════════════════════════════════════════════════════════ */

function FeatureImportanceChart() {
  const items = [...FEATURES]
    .map((f) => ({ name: f, value: FEATURE_IMPORTANCE[f] }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div>
        <p className="text-sm font-semibold text-foreground">
          Feature Importance
        </p>
        <p className="text-[11px] text-muted">
          Đo mức giảm impurity trung bình khi mỗi feature được dùng để split.
          Tổng = 1.
        </p>
      </div>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={it.name} className="flex items-center gap-2">
            <span className="w-20 text-xs font-medium text-foreground">
              {it.name}
            </span>
            <div className="h-4 flex-1 overflow-hidden rounded-full bg-surface">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${it.value * 100}%` }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className={`h-full rounded-full ${
                  i === 0
                    ? "bg-emerald-500"
                    : i === 1
                      ? "bg-emerald-400"
                      : i === 2
                        ? "bg-emerald-300"
                        : "bg-emerald-200"
                }`}
              />
            </div>
            <span className="w-12 text-right font-mono text-xs text-foreground">
              {it.value.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[11px] leading-relaxed text-muted">
        Nhận xét: &quot;giá&quot; và &quot;đánh giá&quot; là hai feature
        mạnh nhất. Voucher đóng góp ít — có thể bỏ mà không ảnh hưởng nhiều
        tới accuracy.
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   KHỐI: OOB error display
   ══════════════════════════════════════════════════════════════ */

function OOBErrorPanel() {
  const avgOob =
    TREES.reduce((sum, t) => sum + t.oobAcc, 0) / TREES.length;

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div>
        <p className="text-sm font-semibold text-foreground">
          Out-of-Bag (OOB) error
        </p>
        <p className="text-[11px] text-muted">
          Mỗi cây bỏ ra ~37% sample khi bootstrap. Test cây trên chính các
          sample đó → được OOB accuracy &quot;miễn phí&quot;, không cần tập
          validation riêng.
        </p>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {TREES.map((t) => (
          <div
            key={t.id}
            className="rounded-lg border border-border bg-background p-2 text-center"
          >
            <p className="text-[10px] text-muted">Cây {t.id}</p>
            <p className="font-mono text-sm font-semibold text-foreground">
              {(t.oobAcc * 100).toFixed(0)}%
            </p>
            <p className="text-[9px] text-muted">
              {t.oobIds.length} sample OOB
            </p>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-green-300 bg-green-50 p-3 dark:border-green-700 dark:bg-green-900/20">
        <p className="text-xs text-green-800 dark:text-green-200">
          <strong>OOB accuracy trung bình:</strong>{" "}
          <span className="font-mono font-bold">
            {(avgOob * 100).toFixed(1)}%
          </span>{" "}
          — thường rất gần cross-validation 5-fold nhưng tốn 0 đồng tính
          toán thêm.
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TRANG CHÍNH
   ══════════════════════════════════════════════════════════════ */

export default function RandomForestsTopic() {
  const [nEstimators, setNEstimators] = useState(5);
  const [maxDepth, setMaxDepth] = useState(6);
  const [selectedTreeId, setSelectedTreeId] = useState(1);
  const selectedTree =
    TREES.find((t) => t.id === selectedTreeId) ?? TREES[0];

  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "Tại sao Random Forest thường tốt hơn một cây quyết định đơn lẻ?",
        options: [
          "Vì rừng chạy nhanh hơn một cây trên cùng dữ liệu",
          "Vì bỏ phiếu đa số triệt tiêu lỗi ngẫu nhiên của từng cây, giảm variance",
          "Vì rừng luôn đạt training accuracy 100%",
          "Vì rừng không cần tập validation",
        ],
        correct: 1,
        explanation:
          "Mỗi cây có thể sai ở các chỗ khác nhau. Khi bỏ phiếu đa số, lỗi ngẫu nhiên của các cây bù trừ nhau → variance giảm, kết quả ổn định hơn. Đây là nguyên lý 'trí tuệ đám đông'.",
      },
      {
        question:
          "Random Forest dùng kỹ thuật nào để tạo sự đa dạng giữa các cây?",
        options: [
          "Mỗi cây dùng toàn bộ dữ liệu và toàn bộ features",
          "Mỗi cây dùng bootstrap sample (lấy mẫu có hoàn lại) + chỉ xem tập con features ngẫu nhiên ở mỗi nút",
          "Mỗi cây dùng thuật toán khác nhau (KNN, SVM, cây...)",
          "Mỗi cây huấn luyện trên một GPU khác nhau",
        ],
        correct: 1,
        explanation:
          "Hai nguồn ngẫu nhiên chính: (1) Bootstrap sampling cho dữ liệu, và (2) Random feature subset ở mỗi nút chia (thường √d features). Kết hợp hai yếu tố này làm các cây khác nhau đáng kể — điều kiện để bỏ phiếu hiệu quả.",
      },
      {
        question: "OOB (Out-of-Bag) error là gì?",
        options: [
          "Tập test nằm ngoài ổ đĩa",
          "Sai số đo trên sample KHÔNG xuất hiện trong bootstrap của một cây, cho phép đánh giá mà không cần validation set riêng",
          "Sai số khi rừng dự đoán nằm ngoài khoảng [0, 1]",
          "Một chỉ số phụ cho regression, không dùng cho classification",
        ],
        correct: 1,
        explanation:
          "Vì mỗi cây chỉ thấy ~63% dữ liệu (bootstrap với thay thế), 37% còn lại gọi là OOB samples. Dự đoán của cây trên các sample này dùng làm validation 'miễn phí'. OOB error thường rất gần với k-fold CV.",
      },
      {
        question:
          "Khi tăng n_estimators (số cây) của Random Forest từ 10 lên 500, điều gì xảy ra?",
        options: [
          "Accuracy giảm vì overfit",
          "Accuracy tăng rồi bão hoà; variance giảm; thời gian huấn luyện + dự đoán tăng tuyến tính",
          "Accuracy giữ nguyên vì các cây giống hệt",
          "Accuracy tăng vô hạn theo số cây",
        ],
        correct: 1,
        explanation:
          "Thêm cây làm giảm variance và thường tăng accuracy, nhưng có quy luật bão hoà — sau 100-500 cây, lợi ích nhỏ dần. Đổi lại, chi phí huấn luyện và inference tăng tỉ lệ thuận. Random Forest KHÔNG dễ overfit khi tăng n_estimators.",
      },
      {
        question:
          "max_features='sqrt' có ý nghĩa gì với bài toán phân loại có 16 features?",
        options: [
          "Mỗi cây chỉ dùng 4 features",
          "Mỗi nút chia chỉ xem xét ngẫu nhiên ~4 features (căn bậc hai của 16) để tìm split tốt nhất",
          "Mỗi cây được huấn luyện với 4 sample",
          "Chỉ 4 cây được dùng trong rừng",
        ],
        correct: 1,
        explanation:
          "√16 = 4. Tại MỖI nút, Random Forest chọn ngẫu nhiên 4 trong 16 features và chỉ tìm split tốt nhất trong subset đó. Điều này ép cây xem nhiều góc khác nhau → đa dạng hơn, giảm correlation giữa các cây.",
      },
      {
        question: "Feature importance trong Random Forest đo cái gì?",
        options: [
          "Số lần feature xuất hiện trong bộ dữ liệu",
          "Mức giảm impurity (Gini / entropy) trung bình khi feature được dùng để split, trọng số theo số sample đi qua nút đó",
          "Trọng số tuyến tính feature được gán như hồi quy",
          "Thời gian tính toán cho mỗi feature",
        ],
        correct: 1,
        explanation:
          "Mean Decrease in Impurity (MDI): với mỗi nút split trên feature f, cộng dồn (impurity giảm × số sample đi qua nút). Chuẩn hoá cho tổng = 1. Một thước đo khác là Permutation Importance — xáo trộn feature và đo accuracy rớt bao nhiêu.",
      },
      {
        question: "Khi nào NÊN dùng Gradient Boosting thay vì Random Forest?",
        options: [
          "Khi cần huấn luyện song song trên nhiều CPU",
          "Khi cần accuracy cao nhất có thể, chấp nhận tune cẩn thận và risk overfit",
          "Khi dữ liệu có rất nhiều noise và outlier",
          "Khi cần mô hình giải thích từng cây đơn giản",
        ],
        correct: 1,
        explanation:
          "Gradient Boosting (XGBoost, LightGBM, CatBoost) thường cho accuracy cao hơn Random Forest trên dữ liệu bảng, nhưng cần tune learning_rate, max_depth, subsample cẩn thận để tránh overfit. Random Forest 'works out of the box' — chọn khi thời gian tune hạn chế.",
      },
      {
        question:
          "Nếu tất cả cây trong Random Forest đều giống hệt nhau, điều gì xảy ra?",
        options: [
          "Rừng luôn tốt hơn vì có nhiều cây",
          "Bỏ phiếu trở nên vô nghĩa — N cây giống nhau = 1 cây được lặp N lần, không giảm variance",
          "Accuracy tăng gấp N lần",
          "Rừng tự động biến thành Gradient Boosting",
        ],
        correct: 1,
        explanation:
          "Sức mạnh ensemble đến từ ĐA DẠNG. Các cây giống nhau sẽ sai ở cùng chỗ → bỏ phiếu không bù trừ được gì. Random Forest tạo đa dạng bằng bootstrap + random feature subset; nếu bỏ hai yếu tố này, rừng thoái hoá thành một cây duy nhất.",
      },
    ],
    [],
  );

  return (
    <>
      {/* ───── STEP 1: HOOK — PredictionGate ───────────────────── */}
      <PredictionGate
        question="Bạn muốn mua xe máy cũ. Hỏi 1 người bạn — có thể nhận lời khuyên sai. Hỏi 9 người bạn, mỗi người xem xét vài tiêu chí khác nhau, rồi nghe đa số. Cách nào đáng tin hơn?"
        options={[
          "Hỏi 1 chuyên gia giỏi nhất — chất lượng hơn số lượng",
          "Hỏi 9 người rồi bỏ phiếu — nhiều góc nhìn bù trừ sai sót",
          "Không khác biệt — xác suất đúng như nhau",
        ]}
        correct={1}
        explanation="Đây là 'trí tuệ đám đông'. Giả sử mỗi người đúng 72%, xác suất đa số của 9 người đúng xấp xỉ 90%. Random Forest áp dụng chính xác ý tưởng này: nhiều cây 'trung bình' nhưng đa dạng sẽ tạo thành một rừng mạnh."
      >
        {/* Phép ẩn dụ */}
        <div className="mb-5 rounded-xl border border-border bg-surface p-4">
          <p className="mb-2 text-sm font-semibold text-foreground">
            Phép ẩn dụ: hội đồng giám khảo The Voice
          </p>
          <p className="text-sm leading-relaxed text-muted">
            Một huấn luyện viên có gu riêng, đôi khi chấm lệch. Nhưng khi 4
            HLV cùng bỏ phiếu, các thiên kiến cá nhân bù trừ nhau — kết quả
            chung công bằng hơn. Random Forest hoạt động y hệt: mỗi{" "}
            <TopicLink slug="decision-trees">cây quyết định</TopicLink> được
            huấn luyện trên một &quot;trải nghiệm&quot; khác nhau (bootstrap
            sample + subset features), rồi cả rừng cùng bỏ phiếu. Cây nào
            chấm lệch thì các cây khác kéo lại.
          </p>
        </div>

        <p className="mb-4 text-sm leading-relaxed text-muted">
          Hãy xem trực tiếp: 5 cây nhìn dữ liệu từ 5 góc khác nhau, mỗi cây
          đưa ra phiếu bầu &quot;khách hàng có mua hay không?&quot;. Rồi cả
          rừng cùng quyết định.
        </p>

        {/* ───── STEP 2: VisualizationSection ───────────────────── */}
        <VisualizationSection topicSlug={metadata.slug}>
          <div className="space-y-6">
            {/* Sliders */}
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-background/40 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    n_estimators (số cây)
                  </span>
                  <span className="rounded bg-accent px-2 py-0.5 font-mono text-[11px] text-white">
                    {nEstimators}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={nEstimators}
                  onChange={(e) =>
                    setNEstimators(parseInt(e.target.value, 10))
                  }
                  className="w-full accent-accent"
                />
                <p className="mt-1 text-[11px] text-muted">
                  Nhiều cây → variance giảm, nhưng train/inference chậm hơn.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-background/40 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    max_depth (chiều sâu mỗi cây)
                  </span>
                  <span className="rounded bg-accent px-2 py-0.5 font-mono text-[11px] text-white">
                    {maxDepth}
                  </span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={12}
                  value={maxDepth}
                  onChange={(e) =>
                    setMaxDepth(parseInt(e.target.value, 10))
                  }
                  className="w-full accent-accent"
                />
                <p className="mt-1 text-[11px] text-muted">
                  Quá nông → underfit. Quá sâu → từng cây overfit, dù rừng
                  vẫn có thể cứu được phần nào.
                </p>
              </div>
            </div>

            {/* Forest hiển thị + kết quả bỏ phiếu */}
            <div className="rounded-xl border border-border bg-card p-4">
              <ForestVisualization
                nEstimators={nEstimators}
                maxDepth={maxDepth}
                selectedTreeId={selectedTreeId}
                setSelectedTreeId={setSelectedTreeId}
              />
            </div>

            {/* Bootstrap sample của cây đang chọn */}
            <div className="rounded-xl border border-border bg-card p-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedTree.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <BootstrapStrip tree={selectedTree} />
                </motion.div>
              </AnimatePresence>
              <p className="mt-3 text-[11px] leading-relaxed text-muted">
                Nhấp vào cây khác ở bảng trên để xem bootstrap của nó. Các
                ô có số trên góc là sample bị lặp lại (bootstrap = lấy mẫu{" "}
                <strong>có hoàn lại</strong>). Các ô mờ là OOB — cây này
                không thấy chúng khi train.
              </p>
            </div>

            {/* Feature importance + OOB */}
            <div className="grid gap-4 md:grid-cols-2">
              <FeatureImportanceChart />
              <OOBErrorPanel />
            </div>
          </div>
        </VisualizationSection>

        {/* ───── STEP 3: AhaMoment ─────────────────────────────── */}
        <AhaMoment>
          <p>
            <strong>Random Forest</strong> = nhiều{" "}
            <TopicLink slug="decision-trees">cây quyết định</TopicLink> ĐA
            DẠNG + bỏ phiếu đa số. Mỗi cây &quot;trung bình&quot; nhưng nhìn
            dữ liệu từ một góc khác → sai sót ngẫu nhiên bù trừ nhau → rừng
            mạnh hơn từng cây, và cực kỳ khó overfit khi thêm cây.
          </p>
        </AhaMoment>

        {/* ───── STEP 4: InlineChallenge #1 ───────────────────── */}
        <InlineChallenge
          question="Nếu bạn tạo 9 cây NHƯNG tất cả dùng cùng dữ liệu và cùng features, rừng có tốt hơn 1 cây không?"
          options={[
            "Có — 9 cây luôn tốt hơn 1 cây",
            "Không — 9 cây giống hệt nhau sẽ cùng sai ở cùng chỗ, bỏ phiếu không giúp được gì",
            "Tuỳ dữ liệu",
          ]}
          correct={1}
          explanation="Sức mạnh ensemble nằm ở sự ĐA DẠNG. 9 cây giống hệt nhau sai ở cùng những điểm dữ liệu, nên bỏ phiếu chỉ lặp lại cùng một dự đoán. Random Forest ép sự đa dạng bằng hai cơ chế: bootstrap (dữ liệu) + random feature subset (ở mỗi nút)."
        />

        {/* ───── STEP 5: InlineChallenge #2 ───────────────────── */}
        <InlineChallenge
          question="Bạn cần train Random Forest với 500 cây nhưng máy chỉ có 1 CPU — vẫn khả thi? Còn Gradient Boosting 500 cây thì sao?"
          options={[
            "Cả hai đều khả thi và song song được y như nhau",
            "Random Forest song song được (các cây độc lập); Gradient Boosting phải train tuần tự vì cây sau phụ thuộc cây trước",
            "Cả hai đều không song song được",
          ]}
          correct={1}
          explanation="Random Forest train các cây ĐỘC LẬP → chia cho N core chạy song song, thời gian ≈ 1/N. Gradient Boosting train NỐI TIẾP vì mỗi cây mới học cách sửa lỗi của các cây trước → không song song theo cây được (chỉ song song trong từng cây). Đây là lý do RF chạy nhanh hơn GB trên cluster."
        />

        {/* ───── STEP 6: ExplanationSection ─────────────────── */}
        <ExplanationSection>
          {/* Định nghĩa */}
          <p>
            <strong>Random Forest</strong> là một thuật toán ensemble thuộc
            họ <strong>Bagging</strong> (Bootstrap AGGregatING), kết hợp
            nhiều <TopicLink slug="decision-trees">cây quyết định</TopicLink>{" "}
            để giảm variance và tăng độ ổn định. Breiman (2001) giới thiệu
            Random Forest như một cải tiến của Bagging bằng cách thêm ngẫu
            nhiên hoá ở mức feature.
          </p>

          <p>
            <strong>Thuật toán huấn luyện:</strong>
          </p>
          <ol className="list-decimal space-y-1 pl-6 text-sm">
            <li>
              Với <LaTeX>{"t = 1, \\ldots, T"}</LaTeX>:
              <ul className="list-disc pl-6">
                <li>
                  Bootstrap: lấy <LaTeX>{"N"}</LaTeX> sample từ training set
                  với hoàn lại, tạo tập <LaTeX>{"\\mathcal{D}_t"}</LaTeX>.
                </li>
                <li>
                  Huấn luyện cây <LaTeX>{"h_t"}</LaTeX> trên{" "}
                  <LaTeX>{"\\mathcal{D}_t"}</LaTeX>, với ràng buộc: ở mỗi
                  nút, chỉ xem ngẫu nhiên <LaTeX>{"m"}</LaTeX> trong{" "}
                  <LaTeX>{"d"}</LaTeX> features (<LaTeX>{"m = \\sqrt{d}"}</LaTeX>{" "}
                  cho classification,{" "}
                  <LaTeX>{"m = d/3"}</LaTeX> cho regression).
                </li>
                <li>Phát triển cây tới full depth (thường không prune).</li>
              </ul>
            </li>
            <li>
              Dự đoán cho sample mới <LaTeX>{"x"}</LaTeX>: tổng hợp{" "}
              <LaTeX>{"\\{h_1(x), \\ldots, h_T(x)\\}"}</LaTeX> bằng majority
              vote (classification) hoặc average (regression).
            </li>
          </ol>

          {/* Công thức */}
          <p>
            <strong>Công thức dự đoán:</strong>
          </p>
          <LaTeX block>
            {"\\hat{y}_{\\text{cls}}(x) = \\operatorname*{mode}\\bigl\\{h_1(x), h_2(x), \\ldots, h_T(x)\\bigr\\}"}
          </LaTeX>
          <LaTeX block>
            {"\\hat{y}_{\\text{reg}}(x) = \\frac{1}{T}\\sum_{t=1}^{T} h_t(x)"}
          </LaTeX>

          <p>
            <strong>Vì sao rừng mạnh hơn cây?</strong> Giả sử các cây độc lập
            và mỗi cây accuracy <LaTeX>{"p"}</LaTeX>. Xác suất đa số cây đúng
            tuân theo phân phối nhị thức:
          </p>
          <LaTeX block>
            {"P(\\text{rừng đúng}) = \\sum_{k=\\lceil T/2 \\rceil}^{T} \\binom{T}{k} p^{k} (1-p)^{T-k}"}
          </LaTeX>
          <p>
            Với <LaTeX>{"T = 9, p = 0.72"}</LaTeX>, tính ra xác suất ≈ 0.90.
            Nếu các cây thật sự độc lập và tốt hơn random (<LaTeX>{"p > 0.5"}</LaTeX>), xác suất này tiến tới 1 khi{" "}
            <LaTeX>{"T \\to \\infty"}</LaTeX> — định lý của Condorcet về bồi
            thẩm đoàn (1785).
          </p>

          <p>
            <strong>Phân rã bias-variance:</strong>{" "}
            <TopicLink slug="bias-variance">bias-variance</TopicLink>{" "}
            tradeoff cho thấy error kỳ vọng tách thành{" "}
            <LaTeX>{"\\text{bias}^2 + \\text{variance} + \\text{noise}"}</LaTeX>. Cây đơn có bias thấp nhưng variance cao (nhạy với dữ liệu). Trung bình của <LaTeX>{"T"}</LaTeX> cây giảm variance xuống:
          </p>
          <LaTeX block>
            {"\\operatorname{Var}(\\bar{h}) = \\rho\\,\\sigma^2 + \\frac{1-\\rho}{T}\\sigma^2"}
          </LaTeX>
          <p>
            Trong đó <LaTeX>{"\\rho"}</LaTeX> là correlation trung bình giữa
            các cây và <LaTeX>{"\\sigma^2"}</LaTeX> là variance của một cây.
            Bootstrap giảm <LaTeX>{"\\rho"}</LaTeX>, random feature subset
            giảm <LaTeX>{"\\rho"}</LaTeX> thêm nữa. Điều này giải thích tại
            sao đa dạng quan trọng hơn số lượng cây.
          </p>

          {/* Code sklearn */}
          <CodeBlock
            language="python"
            title="Random Forest với scikit-learn — end-to-end"
          >
{`from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split, cross_val_score
import numpy as np
import pandas as pd

# 1. Tải dữ liệu
data = load_breast_cancer()
X, y = data.data, data.target
feature_names = data.feature_names

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# 2. Khởi tạo Random Forest
rf = RandomForestClassifier(
    n_estimators=500,      # số cây
    max_features="sqrt",   # √d features mỗi nút
    max_depth=None,        # để cây phát triển full
    min_samples_leaf=2,    # mỗi lá ít nhất 2 sample
    oob_score=True,        # tính OOB error miễn phí
    n_jobs=-1,             # dùng tất cả CPU (cây độc lập!)
    random_state=42,
)

# 3. Fit
rf.fit(X_train, y_train)

print(f"Train accuracy: {rf.score(X_train, y_train):.3f}")
print(f"Test accuracy:  {rf.score(X_test, y_test):.3f}")
print(f"OOB accuracy:   {rf.oob_score_:.3f}")

# 4. Cross-validation để so sánh
cv_scores = cross_val_score(rf, X, y, cv=5, n_jobs=-1)
print(f"CV 5-fold: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")

# 5. Feature importance
importance_df = pd.DataFrame({
    "feature": feature_names,
    "importance": rf.feature_importances_,
}).sort_values("importance", ascending=False)
print(importance_df.head(10))

# 6. Dự đoán xác suất
probs = rf.predict_proba(X_test[:5])
for i, p in enumerate(probs):
    print(f"Sample {i}: P(ác tính)={p[0]:.2f}  P(lành tính)={p[1]:.2f}")`}
          </CodeBlock>

          <CodeBlock
            language="python"
            title="Tune hyperparameter với GridSearchCV"
          >
{`from sklearn.model_selection import GridSearchCV

param_grid = {
    "n_estimators": [100, 300, 500],
    "max_depth": [None, 5, 10, 20],
    "max_features": ["sqrt", "log2", 0.5],
    "min_samples_leaf": [1, 2, 5],
}

grid = GridSearchCV(
    RandomForestClassifier(random_state=42, n_jobs=-1),
    param_grid,
    cv=5,
    scoring="roc_auc",
    n_jobs=-1,
    verbose=1,
)
grid.fit(X_train, y_train)

print("Best params:", grid.best_params_)
print(f"Best CV AUC:  {grid.best_score_:.4f}")
print(f"Test AUC:     {grid.score(X_test, y_test):.4f}")

# Permutation importance — chính xác hơn feature_importances_
from sklearn.inspection import permutation_importance

result = permutation_importance(
    grid.best_estimator_, X_test, y_test,
    n_repeats=10, random_state=42, n_jobs=-1,
)
for i in result.importances_mean.argsort()[::-1][:5]:
    print(f"{feature_names[i]:<30} {result.importances_mean[i]:.4f}")`}
          </CodeBlock>

          {/* 4 Callouts */}
          <Callout variant="tip" title="Mẹo dùng Random Forest trong thực tế">
            <ul className="list-disc space-y-1 pl-6 text-sm">
              <li>
                Luôn bật <code>oob_score=True</code> và{" "}
                <code>n_jobs=-1</code>. OOB cho bạn một ước lượng validation
                miễn phí; <code>n_jobs=-1</code> tận dụng mọi CPU.
              </li>
              <li>
                Tăng <code>n_estimators</code> tới khi OOB error bão hoà
                (thường 300-1000) rồi dừng — thêm cây sau đó chỉ làm chậm,
                không cải thiện rõ rệt.
              </li>
              <li>
                Random Forest <strong>không yêu cầu scale feature</strong> —
                cây so sánh &quot;giá {"<"} 2.5&quot; hoạt động như nhau dù
                scale cỡ nào.
              </li>
              <li>
                Với dữ liệu imbalance, dùng{" "}
                <code>class_weight=&quot;balanced&quot;</code> hoặc{" "}
                <code>class_weight=&quot;balanced_subsample&quot;</code>.
              </li>
            </ul>
          </Callout>

          <Callout variant="warning" title="Random Forest vs Gradient Boosting">
            <ul className="list-disc space-y-1 pl-6 text-sm">
              <li>
                <strong>Random Forest:</strong> cây ĐỘC LẬP, train song song,
                ít nhạy hyperparameter, works out-of-the-box. Accuracy
                thường kém Gradient Boosting 1-3% trên bảng dữ liệu.
              </li>
              <li>
                <strong>
                  <TopicLink slug="gradient-boosting">Gradient Boosting</TopicLink>
                </strong>{" "}
                (XGBoost, LightGBM, CatBoost): cây NỐI TIẾP, mỗi cây sửa
                lỗi cây trước. Accuracy thường cao hơn nhưng cần tune cẩn
                thận, dễ overfit.
              </li>
              <li>
                Quy tắc ngón tay: prototype / baseline dùng RF. Khi cần ép
                thêm điểm accuracy và có thời gian tune, chuyển sang GB.
              </li>
            </ul>
          </Callout>

          <Callout variant="insight" title="Vì sao ~37% sample bị bỏ ra (OOB)?">
            <p className="text-sm leading-relaxed">
              Với bootstrap kích thước <LaTeX>{"N"}</LaTeX>, xác suất một
              sample cụ thể KHÔNG được chọn ở mỗi lần rút là{" "}
              <LaTeX>{"(1 - 1/N)"}</LaTeX>. Sau <LaTeX>{"N"}</LaTeX> lần rút
              có hoàn lại:
            </p>
            <LaTeX block>
              {"P(\\text{không được chọn}) = \\left(1 - \\frac{1}{N}\\right)^{N} \\xrightarrow{N \\to \\infty} \\frac{1}{e} \\approx 0.368"}
            </LaTeX>
            <p className="text-sm leading-relaxed">
              Nên ~37% dữ liệu &quot;rơi ra&quot; khỏi bootstrap của mỗi cây,
              trở thành OOB. Con số này cố định và không phụ thuộc vào{" "}
              <LaTeX>{"N"}</LaTeX> (khi <LaTeX>{"N"}</LaTeX> đủ lớn).
            </p>
          </Callout>

          <Callout
            variant="info"
            title="Feature importance có thể đánh lừa bạn"
          >
            <p className="text-sm leading-relaxed">
              <code>feature_importances_</code> (Mean Decrease in Impurity)
              thiên vị các feature có nhiều giá trị (high-cardinality) và
              feature liên tục. Với feature có ít giá trị rời rạc, MDI
              thường đánh giá thấp.
            </p>
            <p className="text-sm leading-relaxed">
              Thay thế tốt hơn:{" "}
              <strong>Permutation Importance</strong> — xáo trộn ngẫu nhiên
              feature, đo accuracy rớt bao nhiêu. Không thiên vị theo
              cardinality, nhưng chậm hơn. Hoặc SHAP values để giải thích ở
              cấp sample.
            </p>
          </Callout>

          {/* 2 CollapsibleDetail */}
          <CollapsibleDetail title="Chi tiết: Gini impurity và Information Gain trong split">
            <div className="space-y-2 text-sm leading-relaxed">
              <p>
                Mỗi nút chia chọn feature <LaTeX>{"f"}</LaTeX> và ngưỡng{" "}
                <LaTeX>{"\\theta"}</LaTeX> sao cho Gini impurity giảm nhiều
                nhất. Với <LaTeX>{"C"}</LaTeX> class và{" "}
                <LaTeX>{"p_c"}</LaTeX> là tỉ lệ sample thuộc class{" "}
                <LaTeX>{"c"}</LaTeX> ở nút:
              </p>
              <LaTeX block>
                {"G(\\text{node}) = 1 - \\sum_{c=1}^{C} p_c^2"}
              </LaTeX>
              <p>
                Information gain khi split thành con trái/phải:
              </p>
              <LaTeX block>
                {"\\Delta G = G(\\text{node}) - \\frac{N_L}{N} G(\\text{left}) - \\frac{N_R}{N} G(\\text{right})"}
              </LaTeX>
              <p>
                Trong Random Forest, ở MỖI nút ta chỉ thử{" "}
                <LaTeX>{"m = \\sqrt{d}"}</LaTeX> features ngẫu nhiên chứ
                không phải tất cả <LaTeX>{"d"}</LaTeX> features. Điều này
                ép cây &quot;chấp nhận&quot; các split dưới-tối-ưu — nghe
                có vẻ xấu, nhưng lại tạo ĐA DẠNG giữa các cây, làm giảm
                correlation <LaTeX>{"\\rho"}</LaTeX> và do đó giảm variance
                tổng hợp.
              </p>
              <p>
                Với regression, thay Gini bằng variance{" "}
                <LaTeX>{"\\operatorname{Var}(y)"}</LaTeX> hoặc MSE của node.
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="Chi tiết: Extra Trees — biến thể 'ngẫu nhiên hơn' của RF">
            <div className="space-y-2 text-sm leading-relaxed">
              <p>
                <strong>Extremely Randomized Trees (Extra Trees)</strong>{" "}
                đẩy ngẫu nhiên xa thêm một bước:
              </p>
              <ul className="list-disc space-y-1 pl-6">
                <li>
                  Random Forest: chọn ngẫu nhiên{" "}
                  <LaTeX>{"m"}</LaTeX> features, sau đó tìm ngưỡng{" "}
                  <LaTeX>{"\\theta"}</LaTeX> TỐI ƯU trên mỗi feature đó.
                </li>
                <li>
                  Extra Trees: chọn ngẫu nhiên <LaTeX>{"m"}</LaTeX> features,
                  với MỖI feature chọn ngưỡng{" "}
                  <LaTeX>{"\\theta"}</LaTeX> HOÀN TOÀN NGẪU NHIÊN; chỉ chọn
                  feature có Gini gain cao nhất trong số các cặp ngẫu nhiên
                  đó.
                </li>
                <li>
                  Extra Trees thường KHÔNG dùng bootstrap — mỗi cây thấy
                  toàn bộ dữ liệu nhưng split điểm ngẫu nhiên bù lại.
                </li>
              </ul>
              <p>
                Kết quả: Extra Trees chạy nhanh hơn RF (không tìm ngưỡng tối
                ưu) và đôi khi accuracy tốt hơn trên dataset có nhiều noise
                vì regularization mạnh hơn. Trong sklearn:{" "}
                <code>ExtraTreesClassifier</code>,{" "}
                <code>ExtraTreesRegressor</code>.
              </p>
            </div>
          </CollapsibleDetail>

          {/* Ứng dụng thực tế */}
          <p>
            <strong>Ứng dụng thực tế của Random Forest:</strong>
          </p>
          <ul className="list-disc space-y-1 pl-6 text-sm">
            <li>
              <strong>Chấm điểm tín dụng ngân hàng:</strong> phân loại khách
              hàng có trả nợ đúng hạn không. RF cho AUC cao và hỗ trợ
              explainability qua feature importance.
            </li>
            <li>
              <strong>Phát hiện gian lận thanh toán:</strong> dữ liệu bảng
              với hàng trăm feature (tần suất, địa điểm, số tiền...). RF
              xử lý tốt tương tác phi tuyến giữa các feature.
            </li>
            <li>
              <strong>Y sinh học:</strong> phân loại gene expression, dự
              đoán bệnh. RF đặc biệt tốt khi số feature &gt; số sample.
            </li>
            <li>
              <strong>Remote sensing (viễn thám):</strong> phân loại ảnh vệ
              tinh theo pixel — loại rừng, đất nông nghiệp, đô thị.
            </li>
            <li>
              <strong>Kaggle tabular baseline:</strong> RF luôn là baseline
              trong nhiều cuộc thi — nhanh, không cần tune, cho benchmark
              tin cậy trước khi thử XGBoost/LightGBM.
            </li>
            <li>
              <strong>Dự báo nhu cầu:</strong> retail, supply chain — RF
              regressor dự báo doanh số theo tuần dựa trên feature lịch sử,
              giá, khuyến mãi.
            </li>
            <li>
              <strong>Feature selection:</strong> train RF trước rồi dùng
              <code>feature_importances_</code> để chọn top-K feature cho
              model sau.
            </li>
          </ul>

          {/* Cạm bẫy */}
          <p>
            <strong>Những cạm bẫy thường gặp:</strong>
          </p>
          <ul className="list-disc space-y-1 pl-6 text-sm">
            <li>
              <strong>Quá tin feature_importances_:</strong> chỉ số này
              thiên vị high-cardinality. Dùng Permutation Importance hoặc
              SHAP để kiểm tra chéo.
            </li>
            <li>
              <strong>Không chia tập test độc lập:</strong> OOB không thay
              được test set khi cần báo cáo kết quả cuối. OOB là validation,
              không phải test.
            </li>
            <li>
              <strong>
                Nghĩ Random Forest không thể overfit:
              </strong>{" "}
              với max_depth=None và dataset nhỏ, RF vẫn có thể overfit
              (training accuracy 100% dù test thấp). Đặt{" "}
              <code>min_samples_leaf</code>,{" "}
              <code>max_depth</code> hợp lý.
            </li>
            <li>
              <strong>Extrapolation:</strong> cây chỉ dự đoán trong range của
              training data. Với regression ngoài range (ví dụ: doanh số
              tháng tương lai vượt mọi giá trị training), RF sẽ predict sai
              — cân nhắc mô hình tuyến tính hoặc deep learning.
            </li>
            <li>
              <strong>Inference chậm trên edge device:</strong> 500 cây ×
              1000 nút = 500K phép so sánh cho mỗi prediction. Trên mobile,
              dùng ít cây hơn hoặc distillation sang model nhẹ.
            </li>
            <li>
              <strong>Categorical feature cardinality cao:</strong> sklearn
              yêu cầu one-hot — với feature có 1000 giá trị, tạo 1000 cột.
              Dùng CatBoost hoặc LightGBM xử lý native.
            </li>
            <li>
              <strong>Không lưu random_state:</strong> không reproducible.
              Luôn đặt <code>random_state</code> cả trong split lẫn
              classifier.
            </li>
          </ul>
        </ExplanationSection>

        {/* ───── STEP 7: MiniSummary (6 ý) ─────────────────────── */}
        <MiniSummary
          points={[
            "Random Forest = nhiều cây quyết định đa dạng + bỏ phiếu đa số → giảm variance, tăng ổn định; không dễ overfit khi thêm cây.",
            "Hai nguồn đa dạng: bootstrap sampling (mỗi cây thấy ~63% dữ liệu) + random feature subset ở mỗi nút (thường √d).",
            "OOB (Out-of-Bag) error: 37% sample không có trong bootstrap dùng làm validation miễn phí, thường gần k-fold CV.",
            "Feature importance (MDI hoặc permutation) giúp hiểu feature nào quan trọng; dùng để giải thích model và chọn feature.",
            "Ưu điểm: works out-of-the-box, không cần scale, không cần tune nhiều, train song song được, xử lý tốt phi tuyến & tương tác feature.",
            "So với Gradient Boosting: RF nhanh, ổn định, dễ tune; GB thường chính xác hơn nhưng phải train nối tiếp và cẩn thận chống overfit.",
          ]}
        />

        {/* ───── STEP 8: QuizSection (8 câu) ─────────────────── */}
        <QuizSection questions={quizQuestions} />
      </PredictionGate>
    </>
  );
}
