"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Globe2,
  Fingerprint,
  Network,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Wallet,
  ShieldAlert,
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
  InlineChallenge,
  Callout,
  MiniSummary,
  StepReveal,
  TopicLink,
  CodeBlock,
} from "@/components/interactive";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";

export const metadata: TopicMeta = {
  slug: "feature-engineering-in-fraud-detection",
  title: "Feature Engineering in Fraud Detection",
  titleVi: "Xây dựng đặc trưng trong chống gian lận",
  description:
    "Cách Stripe Radar chế tạo hơn 1.000 đặc trưng từ vài trường giao dịch thô để phát hiện gian lận trong chưa đầy 100 mili-giây.",
  category: "foundations",
  tags: ["feature-engineering", "fraud-detection", "application"],
  difficulty: "intermediate",
  relatedSlugs: ["feature-engineering"],
  vizType: "interactive",
  applicationOf: "feature-engineering",
  featuredApp: {
    name: "Stripe Radar",
    productFeature: "Fraud Detection",
    company: "Stripe Inc.",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "How we built it: Stripe Radar",
      publisher: "Stripe Dot Dev Blog",
      url: "https://stripe.dev/blog/how-we-built-it-stripe-radar",
      date: "2024-03",
      kind: "engineering-blog",
    },
    {
      title: "A primer on machine learning for fraud detection",
      publisher: "Stripe Guides",
      url: "https://stripe.com/guides/primer-on-machine-learning-for-fraud-protection",
      date: "2023-06",
      kind: "documentation",
    },
    {
      title: "Using AI to create dynamic, risk-based Radar rules",
      publisher: "Stripe Blog",
      url: "https://stripe.com/blog/using-ai-dynamic-radar-rules",
      date: "2024-09",
      kind: "engineering-blog",
    },
    {
      title:
        "Stripe debuts Radar anti-fraud AI tools for big businesses, says it has halted $4B in fraud to date",
      publisher: "TechCrunch",
      url: "https://techcrunch.com/2018/04/18/stripe-debuts-radar-anti-fraud-ai-tools-for-big-businesses-says-it-has-halted-4b-in-fraud-to-date/",
      date: "2018-04",
      kind: "news",
    },
    {
      title: "Updates to Stripe's advanced fraud detection",
      publisher: "Stripe Blog",
      url: "https://stripe.com/blog/advanced-fraud-detection-updates",
      date: "2023-11",
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
   DỮ LIỆU MÔ PHỎNG — 8 giao dịch, 4 gian lận, 4 hợp lệ
   ──────────────────────────────────────────────────────────── */

interface Transaction {
  id: string;
  label: 0 | 1; // 1 = gian lận
  amount: number;
  merchant: string;
  hour: number; // 0 – 23
  velocity_10m: number; // số lần thẻ này thử trong 10 phút qua
  distance_km: number; // khoảng cách từ IP tới địa chỉ thanh toán
  amount_vs_avg: number; // số lần so với trung bình user
}

const TRANSACTIONS: Transaction[] = [
  {
    id: "t1",
    label: 0,
    amount: 78_000,
    merchant: "Grab VN",
    hour: 8,
    velocity_10m: 1,
    distance_km: 2,
    amount_vs_avg: 0.9,
  },
  {
    id: "t2",
    label: 1,
    amount: 6_900_000,
    merchant: "ElectroShop.ru",
    hour: 3,
    velocity_10m: 14,
    distance_km: 9200,
    amount_vs_avg: 18.0,
  },
  {
    id: "t3",
    label: 0,
    amount: 350_000,
    merchant: "Tiki",
    hour: 19,
    velocity_10m: 1,
    distance_km: 0,
    amount_vs_avg: 1.1,
  },
  {
    id: "t4",
    label: 1,
    amount: 4_500_000,
    merchant: "GiftCard-Depot",
    hour: 2,
    velocity_10m: 22,
    distance_km: 5400,
    amount_vs_avg: 12.5,
  },
  {
    id: "t5",
    label: 0,
    amount: 1_200_000,
    merchant: "Shopee",
    hour: 13,
    velocity_10m: 2,
    distance_km: 3,
    amount_vs_avg: 1.8,
  },
  {
    id: "t6",
    label: 1,
    amount: 9_800_000,
    merchant: "CryptoExch.io",
    hour: 4,
    velocity_10m: 31,
    distance_km: 7800,
    amount_vs_avg: 24.0,
  },
  {
    id: "t7",
    label: 0,
    amount: 120_000,
    merchant: "VNPay",
    hour: 11,
    velocity_10m: 1,
    distance_km: 0,
    amount_vs_avg: 0.7,
  },
  {
    id: "t8",
    label: 1,
    amount: 7_200_000,
    merchant: "LuxuryBag.tk",
    hour: 1,
    velocity_10m: 18,
    distance_km: 6100,
    amount_vs_avg: 15.0,
  },
];

/* ────────────────────────────────────────────────────────────
   FEATURE TOGGLES — người học bật tắt
   ──────────────────────────────────────────────────────────── */

type FeatureKey = "hour" | "velocity" | "distance" | "amount_vs_avg";

interface FeatureToggle {
  key: FeatureKey;
  label: string;
  icon: typeof Clock;
  color: string;
  score: (tx: Transaction) => number;
  hint: string;
}

const FEATURE_TOGGLES: FeatureToggle[] = [
  {
    key: "hour",
    label: "Giờ bất thường (0 – 5h)",
    icon: Clock,
    color: "#0ea5e9",
    score: (tx) => (tx.hour <= 5 || tx.hour >= 23 ? 1 : 0),
    hint: "Giao dịch lúc 2 – 4h sáng hiếm với người bình thường.",
  },
  {
    key: "velocity",
    label: "Velocity cao (> 5 lần / 10 phút)",
    icon: Network,
    color: "#a855f7",
    score: (tx) => Math.min(tx.velocity_10m / 20, 1),
    hint: "Card testing: kẻ gian thử thẻ liên tiếp để tìm mã còn dùng được.",
  },
  {
    key: "distance",
    label: "Khoảng cách IP lạ (> 500 km)",
    icon: MapPin,
    color: "#f59e0b",
    score: (tx) => (tx.distance_km > 500 ? 1 : 0),
    hint: "IP ở xa địa chỉ thanh toán &rArr; dấu hiệu VPN / proxy.",
  },
  {
    key: "amount_vs_avg",
    label: "Số tiền gấp nhiều lần trung bình",
    icon: Wallet,
    color: "#ef4444",
    score: (tx) => Math.min(tx.amount_vs_avg / 20, 1),
    hint: "Giao dịch 8 triệu khi user thường chỉ tiêu 500k là bất thường.",
  },
];

function predictRisk(tx: Transaction, active: Set<FeatureKey>): number {
  if (active.size === 0) return 0.1; // baseline: chỉ đoán đa số
  let s = 0;
  for (const f of FEATURE_TOGGLES) {
    if (active.has(f.key)) s += f.score(tx);
  }
  const normalized = s / active.size;
  // sigmoid-ish smooth để 0 ≤ risk ≤ 1
  return Math.max(0, Math.min(1, normalized));
}

function confusion(
  active: Set<FeatureKey>,
  threshold: number,
): {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
  precision: number;
  recall: number;
  auc: number;
} {
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;

  for (const tx of TRANSACTIONS) {
    const risk = predictRisk(tx, active);
    const predicted = risk >= threshold ? 1 : 0;
    if (predicted === 1 && tx.label === 1) tp++;
    else if (predicted === 1 && tx.label === 0) fp++;
    else if (predicted === 0 && tx.label === 0) tn++;
    else if (predicted === 0 && tx.label === 1) fn++;
  }

  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;

  // Rough AUC-ish: average over thresholds would be heavier; we just score separation
  const frauds = TRANSACTIONS.filter((t) => t.label === 1).map((t) =>
    predictRisk(t, active),
  );
  const legits = TRANSACTIONS.filter((t) => t.label === 0).map((t) =>
    predictRisk(t, active),
  );
  let correctPairs = 0;
  let totalPairs = 0;
  for (const rf of frauds) {
    for (const rl of legits) {
      totalPairs++;
      if (rf > rl) correctPairs++;
      else if (rf === rl) correctPairs += 0.5;
    }
  }
  const auc = totalPairs > 0 ? correctPairs / totalPairs : 0.5;

  return { tp, fp, tn, fn, precision, recall, auc };
}

/* ────────────────────────────────────────────────────────────
   PLAYGROUND — bật / tắt feature, xem điểm phân tách cải thiện
   ──────────────────────────────────────────────────────────── */

function FeatureTogglePlayground() {
  const [active, setActive] = useState<Set<FeatureKey>>(new Set());
  const [threshold, setThreshold] = useState(0.5);

  const stats = useMemo(() => confusion(active, threshold), [active, threshold]);

  const scoredTx = useMemo(
    () =>
      TRANSACTIONS.map((tx) => {
        const risk = predictRisk(tx, active);
        return { tx, risk };
      }).sort((a, b) => b.risk - a.risk),
    [active],
  );

  function toggle(k: FeatureKey) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  return (
    <div className="space-y-5 rounded-xl border border-border bg-card p-5">
      <p className="text-sm text-foreground/85 leading-relaxed">
        Bảng bên dưới có 8 giao dịch, 4 gian lận (đỏ) và 4 hợp lệ (xanh).
        Hãy bật/tắt từng feature và xem điểm AUC (khả năng tách biệt
        gian/hợp) thay đổi. Ở cấu hình rỗng, mô hình không có tín hiệu
        &mdash; AUC ~0.5 (đoán bừa).
      </p>

      {/* Feature toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {FEATURE_TOGGLES.map((f) => {
          const on = active.has(f.key);
          const Icon = f.icon;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => toggle(f.key)}
              className={`flex items-center gap-2 rounded-xl border p-3 text-left transition-colors ${
                on
                  ? "border-accent bg-accent-light"
                  : "border-border bg-surface/60 hover:border-accent/40"
              }`}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                style={{
                  backgroundColor: on ? f.color : "transparent",
                  color: on ? "#fff" : f.color,
                  border: on ? "none" : `1px solid ${f.color}`,
                }}
              >
                <Icon size={14} />
              </span>
              <span className="flex-1">
                <span
                  className={`block text-xs font-semibold ${
                    on ? "text-foreground" : "text-muted"
                  }`}
                >
                  {f.label}
                </span>
                <span className="block text-[10px] text-tertiary leading-tight">
                  {f.hint.replace("&rArr;", "→")}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Threshold */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">
            Ngưỡng chặn (risk ≥ ngưỡng &rArr; chặn)
          </label>
          <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-xs font-bold text-accent">
            {(threshold * 100).toFixed(0)}%
          </span>
        </div>
        <input
          type="range"
          min={10}
          max={90}
          step={5}
          value={threshold * 100}
          onChange={(e) => setThreshold(Number(e.target.value) / 100)}
          className="mt-2 w-full accent-accent"
          aria-label="Ngưỡng chặn"
        />
      </div>

      {/* AUC bar — điểm tách biệt */}
      <AucBar auc={stats.auc} activeCount={active.size} />

      {/* Confusion tiles */}
      <div className="grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4">
        <StatTile label="TP (bắt đúng gian lận)" value={stats.tp} color="#16a34a" />
        <StatTile label="FP (chặn nhầm hợp lệ)" value={stats.fp} color="#f59e0b" />
        <StatTile label="FN (bỏ sót gian lận)" value={stats.fn} color="#dc2626" />
        <StatTile label="TN (cho hợp lệ qua)" value={stats.tn} color="#6b7280" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <PctTile label="Precision" value={stats.precision} />
        <PctTile label="Recall" value={stats.recall} />
      </div>

      {/* Ranked transactions */}
      <div>
        <p className="text-[11px] font-semibold text-tertiary uppercase tracking-wide mb-2">
          Giao dịch xếp theo risk (cao xuống thấp)
        </p>
        <div className="space-y-1.5">
          <AnimatePresence initial={false}>
            {scoredTx.map((row) => (
              <TransactionRow
                key={row.tx.id}
                tx={row.tx}
                risk={row.risk}
                threshold={threshold}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function AucBar({ auc, activeCount }: { auc: number; activeCount: number }) {
  const pct = Math.round(auc * 100);
  const color =
    auc < 0.6 ? "#9ca3af" : auc < 0.8 ? "#f59e0b" : "#10b981";
  const verdict =
    auc < 0.6
      ? "Gần như đoán bừa"
      : auc < 0.8
        ? "Có tín hiệu, chưa đủ"
        : "Tách biệt gian / hợp tốt";
  return (
    <div className="rounded-lg border border-border bg-surface/50 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">
          Độ tách biệt (AUC)
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-bold tabular-nums"
          style={{ backgroundColor: `${color}22`, color }}
        >
          {pct}%
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-surface border border-border overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          initial={false}
          animate={{ width: `${pct}%`, backgroundColor: color }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
      <p className="text-[11px] text-muted italic">
        {activeCount === 0
          ? "Chưa bật feature nào — mô hình đoán bừa."
          : `${activeCount} feature đang bật · ${verdict}.`}
      </p>
    </div>
  );
}

function TransactionRow({
  tx,
  risk,
  threshold,
}: {
  tx: Transaction;
  risk: number;
  threshold: number;
}) {
  const blocked = risk >= threshold;
  const actualFraud = tx.label === 1;
  const pct = Math.round(risk * 100);
  const barColor = risk >= 0.7 ? "#ef4444" : risk >= 0.4 ? "#f59e0b" : "#10b981";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs"
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          actualFraud
            ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300"
            : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300"
        }`}
      >
        {actualFraud ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-foreground">{tx.merchant}</p>
        <p className="text-[10px] text-tertiary tabular-nums">
          {tx.amount.toLocaleString("vi-VN")}đ · {tx.hour}h · vel={tx.velocity_10m}
        </p>
      </div>
      <div className="w-28 shrink-0">
        <div className="h-1.5 rounded-full bg-surface border border-border overflow-hidden">
          <motion.div
            className="h-full"
            initial={false}
            animate={{ width: `${pct}%`, backgroundColor: barColor }}
            transition={{ duration: 0.25 }}
          />
        </div>
        <p className="mt-0.5 text-[9px] text-tertiary tabular-nums text-right">
          risk {pct}%
        </p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
          blocked
            ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
        }`}
      >
        {blocked ? "CHẶN" : "CHO QUA"}
      </span>
    </motion.div>
  );
}

function StatTile({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className="rounded-lg border px-2 py-2"
      style={{ borderColor: `${color}55`, backgroundColor: `${color}0d` }}
    >
      <div className="text-[10px] text-muted leading-tight">{label}</div>
      <div className="mt-0.5 font-mono text-lg font-bold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function PctTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-surface/60 px-3 py-2">
      <div className="text-[10px] font-semibold text-muted uppercase tracking-wide">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-base font-bold text-foreground">
        {Math.round(value * 100)}%
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   CASE STUDY — StepReveal qua 1 vụ gian lận thật
   ──────────────────────────────────────────────────────────── */

function FraudCaseReveal() {
  return (
    <StepReveal
      labels={[
        "Bước 1: Giao dịch xuất hiện",
        "Bước 2: Velocity bóc mặt nạ",
        "Bước 3: Device fingerprint",
        "Bước 4: Network graph đóng sầm cửa",
      ]}
    >
      {[
        <CaseCard
          key="s1"
          icon={CreditCard}
          color="#0ea5e9"
          title="Giao dịch trông bình thường"
        >
          <p>
            Thẻ Visa, mua đồ điện tử 6.9 triệu tại một shop ở Nga. Số tiền
            hợp lý cho đồ công nghệ, thẻ hợp lệ, 3D Secure bỏ qua. Nếu chỉ
            nhìn raw data, nhiều ngân hàng sẽ cho qua.
          </p>
        </CaseCard>,
        <CaseCard
          key="s2"
          icon={Network}
          color="#a855f7"
          title="Velocity feature: 14 lần trong 10 phút"
        >
          <p>
            Nhưng Stripe đã tính một cột mà raw data không có:{" "}
            <code>velocity_10m</code>. Thẻ này vừa thử 14 lần ở các
            merchant khác trong 10 phút &mdash; đặc trưng kinh điển của
            &ldquo;card testing&rdquo;.
          </p>
        </CaseCard>,
        <CaseCard
          key="s3"
          icon={Fingerprint}
          color="#f59e0b"
          title="Device fingerprint khớp 3 vụ cũ"
        >
          <p>
            Stripe.js thu &ldquo;dấu vân tay&rdquo; trình duyệt: resolution,
            font, timezone, WebGL renderer. Vân tay này từng xuất hiện ở 3
            merchant khác, cả 3 đều đã bị chargeback.
          </p>
        </CaseCard>,
        <CaseCard
          key="s4"
          icon={Globe2}
          color="#ef4444"
          title="Network graph đóng lại vòng vây"
        >
          <p>
            Email thanh toán trùng một tài khoản đã bị đánh dấu tháng
            trước. IP ở Nga, địa chỉ giao hàng ở Đức, thẻ phát hành tại
            Mỹ. Ba thực thể được nối lại thành một &ldquo;cụm rủi ro&rdquo;
            &mdash; giao dịch bị chặn trong &lt; 100 ms.
          </p>
        </CaseCard>,
      ]}
    </StepReveal>
  );
}

function CaseCard({
  icon: Icon,
  color,
  title,
  children,
}: {
  icon: typeof CreditCard;
  color: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border bg-card p-4"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-md"
          style={{ backgroundColor: `${color}22`, color }}
        >
          <Icon size={14} />
        </span>
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      <div className="text-xs text-foreground/85 leading-relaxed pl-9">
        {children}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   QUIZ
   ──────────────────────────────────────────────────────────── */

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Vì sao Stripe phải tự chế 'velocity feature' thay vì dựa vào cột có sẵn trong giao dịch?",
    options: [
      "Vì raw transaction chỉ có số tiền, thẻ, IP — không có khái niệm 'thử bao nhiêu lần trong 10 phút'. Cần tính từ lịch sử",
      "Vì Stripe muốn giao dịch chạy chậm hơn",
      "Vì velocity là một tính năng miễn phí của SQL",
      "Vì luật EU yêu cầu",
    ],
    correct: 0,
    explanation:
      "Velocity là feature phái sinh: bạn phải nhìn cửa sổ thời gian trước đó để biết 'thẻ này vừa thử 14 lần trong 10 phút'. Không có sẵn trong bảng giao dịch gốc — đây chính là trọng tâm của feature engineering.",
  },
  {
    question:
      "Device fingerprint thuộc loại feature engineering nào?",
    options: [
      "Scaling số liên tục",
      "Tổng hợp nhiều tín hiệu nhỏ (resolution, font, timezone...) thành một định danh duy nhất",
      "One-hot encoding",
      "Không phải feature engineering, chỉ là tracking",
    ],
    correct: 1,
    explanation:
      "Device fingerprint là interaction feature ở quy mô lớn: mỗi tín hiệu (resolution, font, WebGL renderer) một mình không ý nghĩa, nhưng tổ hợp hàng chục tín hiệu tạo ra định danh gần như duy nhất cho mỗi thiết bị.",
  },
  {
    question:
      "Stripe chạy toàn bộ pipeline 1.000+ feature trong < 100ms. Hệ quả quan trọng nhất cho feature engineering là gì?",
    options: [
      "Feature phải tính được RẤT NHANH tại thời điểm dự đoán — không chờ query nặng hay model ngoài",
      "Feature càng nhiều càng tốt",
      "Feature chỉ cần đúng khi train, không cần khi serving",
      "Không ảnh hưởng gì",
    ],
    correct: 0,
    explanation:
      "Constraint 100ms buộc Stripe: (1) pre-compute aggregates trong feature store, (2) tránh feature yêu cầu gọi API bên thứ 3, (3) chọn feature rẻ để tính. Đây là lý do 'online' và 'offline' feature engineering có luật chơi khác nhau.",
  },
  {
    question:
      "Network graph feature (thẻ A từng dùng cùng thiết bị với thẻ B đã bị flag) mạnh vì sao?",
    options: [
      "Vì tên gọi nghe ngầu",
      "Vì nó khai thác data của TOÀN MẠNG merchant — một merchant đơn lẻ không thể tạo được feature này",
      "Vì graph chạy trên GPU",
      "Vì graph thay thế deep learning",
    ],
    correct: 1,
    explanation:
      "Lợi thế quy mô của Stripe: hàng triệu merchant chia sẻ dữ liệu qua Stripe. Khi kẻ gian chuyển qua merchant B, Stripe vẫn nhớ thiết bị đó đã phạm lỗi ở merchant A. Một shop nhỏ không có 'tầm nhìn mạng lưới' này.",
  },
  {
    type: "fill-blank",
    question:
      "Khi dữ liệu có 99,9% giao dịch hợp lệ và 0,1% gian lận, mô hình dễ đoán 'không gian lận' cho mọi giao dịch và vẫn đạt 99,9% accuracy. Hiện tượng này gọi là {blank} data.",
    blanks: [
      {
        answer: "imbalanced",
        accept: ["mất cân bằng", "Imbalanced", "IMBALANCED"],
      },
    ],
    explanation:
      "Imbalanced data (dữ liệu mất cân bằng) là bệnh kinh điển của chống gian lận. Accuracy 99,9% mà recall = 0 là vô dụng. Stripe dùng các metric như AUC, recall@precision ≥ X, và cân nhắc weighted loss để khắc phục.",
  },
];

/* ────────────────────────────────────────────────────────────
   COMPONENT CHÍNH
   ──────────────────────────────────────────────────────────── */

export default function FeatureEngineeringInFraudDetection() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Xây dựng đặc trưng"
    >
      {/* ━━━ HERO ━━━ */}
      <ApplicationHero
        parentTitleVi="Xây dựng đặc trưng"
        topicSlug={metadata.slug}
      >
        <p>
          Bạn mua hàng online, nhập số thẻ, nhấn &ldquo;Thanh toán&rdquo;
          &mdash; và trong chưa đầy 100 mili-giây, Stripe Radar (công cụ
          chống gian lận của Stripe) đã chấm điểm hơn 1.000 đặc trưng để
          quyết định cho qua hay chặn.
        </p>
        <p>
          Bí quyết không nằm ở mô hình phức tạp. Nó nằm ở cách kỹ sư Stripe
          biến vài trường dữ liệu thô của một giao dịch (số thẻ, IP, số
          tiền, thời gian) thành hàng trăm tín hiệu có ý nghĩa: velocity
          feature (tốc độ dùng thẻ), device fingerprint (dấu vân tay thiết
          bị), network graph (liên kết giữa các thực thể). Đây chính là
          feature engineering ở quy mô toàn cầu.
        </p>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <HeroBadge icon={CreditCard} label="Thẻ thanh toán" />
          <HeroBadge icon={Network} label="Velocity real-time" />
          <HeroBadge icon={Fingerprint} label="Device fingerprint" />
          <HeroBadge icon={Globe2} label="Network graph" />
        </div>
      </ApplicationHero>

      {/* ━━━ PROBLEM ━━━ */}
      <ApplicationProblem topicSlug={metadata.slug}>
        <p>
          Stripe xử lý hàng trăm tỷ đô-la thanh toán mỗi năm. Chỉ khoảng
          0,1% là gian lận &mdash; nhưng con số tuyệt đối lên tới hàng tỷ
          đô-la. Mỗi giao dịch chỉ cung cấp vài trường raw data: số thẻ,
          số tiền, IP, thời gian, vài metadata.
        </p>
        <p>
          Vấn đề lõi: từ vài trường đó, làm sao tạo ra tín hiệu đủ mạnh
          để phân biệt giao dịch thật và gian? Kẻ gian liên tục thay đổi
          chiêu: VPN, thẻ ảo, danh tính giả. Dữ liệu mất cân bằng cực
          đoan: đoán &ldquo;hợp lệ&rdquo; cho tất cả vẫn đạt accuracy
          99,9% &mdash; nhưng recall bằng 0, vô dụng.
        </p>

        <div className="my-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ProblemPill
            icon={ShieldAlert}
            title="Imbalanced 1:1000"
            body="Accuracy 99,9% có thể = recall 0. Cần feature mạnh hơn cả mô hình."
          />
          <ProblemPill
            icon={Clock}
            title="< 100 ms/giao dịch"
            body="Mọi feature phải tính được real-time, không được chậm."
          />
          <ProblemPill
            icon={Globe2}
            title="Kẻ gian đổi chiêu liên tục"
            body="Feature hôm nay mạnh, mai cũ. Phải cập nhật liên tục."
          />
        </div>
      </ApplicationProblem>

      {/* ━━━ MECHANISM ━━━ */}
      <ApplicationMechanism
        parentTitleVi="Xây dựng đặc trưng"
        topicSlug={metadata.slug}
      >
        <Beat step={1}>
          <p>
            <strong>Velocity features (đặc trưng tốc độ).</strong> Stripe
            tính &ldquo;thẻ này đã thử bao nhiêu giao dịch trong 10 phút /
            1 giờ / 24 giờ qua?&rdquo; Giao dịch hợp lệ thường 1 – 2 lần
            mỗi ngày. Kẻ gian thử hàng chục lần liên tiếp (card testing).
            Velocity bắt ngay pattern bất thường đó. Stripe có hệ thống
            tính velocity real-time trên toàn mạng lưới.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>Device fingerprinting (dấu vân tay thiết bị).</strong>{" "}
            Stripe.js thu độ phân giải, font, timezone, WebGL renderer,
            ngôn ngữ hệ thống. Tổ hợp các tín hiệu tạo &ldquo;vân tay&rdquo;
            gần như duy nhất. Kẻ gian đổi danh tính nhưng giữ laptop
            &mdash; vân tay vẫn lộ.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>Network graph features (đồ thị mạng lưới).</strong>{" "}
            Stripe nối mọi giao dịch trên toàn mạng: thẻ A đã dùng ở
            merchant B, từ thiết bị C, với email D. Thẻ mới dùng cùng thiết
            bị với thẻ đã bị chargeback &rArr; cảnh báo ngay. Đây là lợi
            thế quy mô của Stripe: hàng triệu merchant chia sẻ tầm nhìn
            mạng lưới.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>Aggregated risk scoring.</strong> 1.000+ feature đưa
            vào mô hình ML. Mỗi giao dịch nhận một risk score. Rủi ro cao
            &rArr; chặn hoặc yêu cầu 3D Secure. Toàn bộ pipeline chạy
            trong &lt; 100 ms. Stripe báo cáo cải thiện &gt; 20% hiệu suất
            mỗi năm nhờ liên tục thêm feature mới.
          </p>
        </Beat>
      </ApplicationMechanism>

      {/* ━━━ TRY IT ━━━ */}
      <ApplicationTryIt topicSlug={metadata.slug}>
        <div className="space-y-6">
          <p className="text-sm text-foreground/85 leading-relaxed">
            Dưới đây là phiên bản tinh gọn của ý tưởng: bạn có 8 giao dịch
            (4 gian lận, 4 hợp lệ) và 4 feature để bật/tắt. Xem AUC tăng
            thế nào khi bạn bật từng feature &mdash; chính là trải nghiệm
            của kỹ sư Stripe khi thêm một cột mới vào pipeline.
          </p>
          <FeatureTogglePlayground />

          <div className="rounded-xl border border-border bg-surface/40 p-4 space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ShieldAlert size={14} className="text-accent" /> Một vụ gian
              lận thật — từng feature bóc mặt nạ
            </h4>
            <p className="text-xs text-muted leading-relaxed">
              Theo dõi một giao dịch giả trông bình thường bị hệ thống tóm
              qua bốn bước feature khác nhau.
            </p>
            <FraudCaseReveal />
          </div>

          <InlineChallenge
            question="Bạn là kỹ sư Stripe, cần thêm 1 feature nữa để bắt thêm các vụ gian lận dùng thẻ quà (gift card). Feature nào có khả năng hữu ích nhất?"
            options={[
              "User-agent string của trình duyệt",
              "Tần suất thẻ được dùng ở merchant thuộc nhóm 'gift card / crypto / prepaid' trong 24 giờ qua",
              "Số ký tự trong email thanh toán",
              "Tên đầu tiên của chủ thẻ",
            ]}
            correct={1}
            explanation="Gian lận thẻ quà và crypto có pattern rõ: kẻ gian biến thẻ ăn cắp thành tiền mặt qua các merchant này. Feature 'tần suất ở merchant loại risky' trong cửa sổ 24h là ví dụ kinh điển của velocity feature có domain knowledge — mạnh hơn hẳn các đặc trưng chung chung."
          />

          <div>
            <p className="text-[11px] font-semibold text-tertiary uppercase tracking-wide mb-2">
              Code mẫu — tính velocity feature với pandas
            </p>
            <CodeBlock
              language="python"
              title="velocity_feature.py"
            >
              {`import pandas as pd

df = df.sort_values(["card_id", "ts"])

df["vel_10m"] = (
    df.groupby("card_id")["ts"]
      .rolling("10min")
      .count()
      .reset_index(0, drop=True)
)

df["vel_1h"] = (
    df.groupby("card_id")["ts"]
      .rolling("1h")
      .count()
      .reset_index(0, drop=True)
)`}
            </CodeBlock>
            <p className="mt-2 text-[11px] text-muted italic">
              Pandas rolling theo cửa sổ thời gian. Ở production, Stripe
              dùng stream processing (Kafka + Flink) để tính real-time, nhưng
              logic vẫn giống.
            </p>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-tertiary uppercase tracking-wide mb-2">
              Code mẫu — ghép feature vào risk score
            </p>
            <CodeBlock
              language="python"
              title="risk_score.py"
            >
              {`from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import GradientBoostingClassifier

features = [
    "vel_10m", "vel_1h",
    "amount_vs_user_avg",
    "ip_distance_km",
    "is_unusual_hour",
    "device_flagged_count",
]

X = StandardScaler().fit_transform(df[features])
model = GradientBoostingClassifier(n_estimators=300).fit(X, y)
df["risk_score"] = model.predict_proba(X)[:, 1]`}
            </CodeBlock>
          </div>

          <Callout variant="tip" title="Bài học quan trọng">
            Khi bật đủ 4 feature trong playground, AUC chạm ~100% với 8
            giao dịch giả lập này &mdash; nhưng trên dữ liệu thật Stripe
            phải cân bằng hàng chục feature chồng chéo, và mỗi feature
            chỉ thêm vài phần trăm. Đó là lý do họ cần 1.000+ feature chứ
            không phải 4.
          </Callout>
        </div>
      </ApplicationTryIt>

      {/* ━━━ METRICS ━━━ */}
      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug={metadata.slug}
      >
        <Metric
          value="Phân tích hơn 1.000 đặc trưng cho mỗi giao dịch trong dưới 100 mili-giây"
          sourceRef={1}
        />
        <Metric
          value="Ngăn chặn hàng tỷ đô-la gian lận, bảo vệ hàng triệu doanh nghiệp trên toàn cầu"
          sourceRef={4}
        />
        <Metric
          value="Cải thiện hiệu suất phát hiện gian lận hơn 20% mỗi năm nhờ cập nhật feature liên tục"
          sourceRef={1}
        />
        <Metric
          value="Tốc độ phát hành mô hình tăng gấp 3 lần nhờ tự động hoá pipeline huấn luyện và đánh giá"
          sourceRef={1}
        />
      </ApplicationMetrics>

      {/* ━━━ COUNTERFACTUAL ━━━ */}
      <ApplicationCounterfactual
        parentTitleVi="Xây dựng đặc trưng"
        topicSlug={metadata.slug}
      >
        <p>
          Nếu bỏ bước feature engineering, mô hình chỉ thấy raw data: số
          thẻ, số tiền, IP. Một giao dịch 6,9 triệu từ thẻ mới trông giống
          hệt giao dịch hợp lệ. Nhưng velocity feature tiết lộ: thẻ này
          đã thử 14 lần trong 10 phút. Device fingerprint cho biết: cùng
          laptop đã dùng 8 thẻ bị chargeback. Network graph nối lại: email
          này từng xuất hiện cùng thiết bị bị chặn ở merchant khác.
        </p>
        <p>
          Feature thông minh biến raw data vô hồn thành tín hiệu có ý
          nghĩa &mdash; như thám tử không chỉ nhìn hiện trường mà còn kiểm
          tra tiền sử, mối quan hệ, hành vi quá khứ. Đây là lý do cùng
          một mô hình ML, người có feature tốt hơn luôn thắng.
        </p>
        <div className="mt-4">
          <MiniSummary
            title="3 điều đáng nhớ từ Stripe Radar"
            points={[
              "Raw data có thể chỉ có 5 trường, nhưng feature phái sinh có thể lên đến hàng nghìn — velocity, fingerprint, graph là ba kiểu mạnh nhất cho fraud.",
              "Mọi feature phải tính được trong real-time (< 100 ms). Tính nhanh là ràng buộc khắc nghiệt nhưng bắt buộc.",
              "Lợi thế quy mô (dữ liệu toàn mạng) tạo ra những feature mà merchant đơn lẻ không thể có — đó là lý do Stripe chiến thắng.",
            ]}
          />
        </div>
        <div className="mt-4">
          <Callout variant="tip" title="Xem lại lý thuyết">
            Quay lại bài lý thuyết{" "}
            <TopicLink slug="feature-engineering">
              Xây dựng đặc trưng
            </TopicLink>{" "}
            để ôn bốn nhóm kỹ thuật chính: numerical, categorical, datetime,
            text.
          </Callout>
        </div>
        <div className="mt-6">
          <h3 className="text-base font-semibold text-foreground mb-3">
            Kiểm tra nhanh
          </h3>
          <QuizSection questions={quizQuestions} />
        </div>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}

/* ────────────────────────────────────────────────────────────
   MINI HELPER COMPONENTS
   ──────────────────────────────────────────────────────────── */

function HeroBadge({
  icon: Icon,
  label,
}: {
  icon: typeof CreditCard;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-surface/50 px-3 py-2">
      <Icon size={14} className="text-accent shrink-0" />
      <span className="text-xs text-foreground/85">{label}</span>
    </div>
  );
}

function ProblemPill({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof ShieldAlert;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface/50 p-3 space-y-1">
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-accent" />
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      <p className="text-xs text-muted leading-relaxed">{body}</p>
    </div>
  );
}
