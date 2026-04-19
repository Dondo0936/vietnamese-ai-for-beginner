"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  ShieldAlert,
  ShieldCheck,
  Inbox,
  Trash2,
  Link2,
  Type,
  BadgeAlert,
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
import {
  InlineChallenge,
  Callout,
  MiniSummary,
  StepReveal,
  TopicLink,
} from "@/components/interactive";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";

export const metadata: TopicMeta = {
  slug: "logistic-regression-in-spam-filter",
  title: "Logistic Regression in Spam Filtering",
  titleVi: "Hồi quy logistic trong lọc spam",
  description:
    "Cách Gmail dùng hồi quy logistic để biến mỗi email thành một xác suất spam, rồi chuyển vào hộp thư hay thùng rác.",
  category: "classic-ml",
  tags: ["classification", "email", "spam", "application"],
  difficulty: "beginner",
  relatedSlugs: ["logistic-regression"],
  vizType: "interactive",
  applicationOf: "logistic-regression",
  featuredApp: {
    name: "Gmail",
    productFeature: "Spam Filter",
    company: "Google LLC",
    countryOrigin: "US",
  },
  sources: [
    {
      title:
        "Spam does not bring us joy — ridding Gmail of 100 million more spam messages with TensorFlow",
      publisher: "Google Workspace Blog",
      url: "https://workspace.google.com/blog/product-announcements/ridding-gmail-of-100-million-more-spam-messages-with-tensorflow",
      date: "2019-02",
      kind: "engineering-blog",
    },
    {
      title: "Introducing RETVec: Resilient and Efficient Text Vectorizer",
      publisher: "Google Research Blog",
      url: "https://blog.research.google/2023/11/retvec-resilient-efficient-text.html",
      date: "2023-11",
      kind: "engineering-blog",
    },
    {
      title: "Gmail turns 20: how Google has used AI to fight spam for two decades",
      publisher: "TechCrunch",
      url: "https://techcrunch.com/2024/04/01/gmail-turns-20/",
      date: "2024-04",
      kind: "news",
    },
    {
      title: "A Plan for Spam",
      publisher: "Paul Graham",
      url: "http://www.paulgraham.com/spam.html",
      date: "2002-08",
      kind: "paper",
    },
    {
      title: "Machine Learning Methods for Spam E-Mail Classification",
      publisher:
        "International Journal of Computer Science and Information Technology (PMC)",
      url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7512653/",
      date: "2020-09",
      kind: "paper",
    },
  ],
  tocSections: [
    { id: "hero", labelVi: "Công ty nào?" },
    { id: "problem", labelVi: "Vấn đề" },
    { id: "mechanism", labelVi: "Cách giải quyết" },
    { id: "metrics", labelVi: "Con số thật" },
    { id: "counterfactual", labelVi: "Nếu không có" },
  ],
};

/* ─────────────────────────────────────────────────────────────
   MOCK INBOX — 6 email tiếng Việt, mỗi cái có các đặc trưng
   ───────────────────────────────────────────────────────────── */
interface MockEmail {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  features: {
    allCaps: boolean;
    linkCount: number;
    suspiciousWord: boolean;
    unknownSender: boolean;
  };
}

const INBOX: MockEmail[] = [
  {
    id: "e1",
    from: "Anh Minh (CEO)",
    subject: "Báo cáo tuần - xin xem giúp",
    snippet: "Chào cả team, file báo cáo tuần đính kèm, có thắc mắc nhắn em Hương.",
    features: {
      allCaps: false,
      linkCount: 0,
      suspiciousWord: false,
      unknownSender: false,
    },
  },
  {
    id: "e2",
    from: "no-reply@ngan-hang-quoc-gia.top",
    subject: "KHẨN - Tài khoản của bạn bị khoá, xác thực NGAY",
    snippet: "Bạn có 24h để XÁC MINH tại link bên dưới, nếu không tài khoản sẽ bị đóng vĩnh viễn.",
    features: {
      allCaps: true,
      linkCount: 3,
      suspiciousWord: true,
      unknownSender: true,
    },
  },
  {
    id: "e3",
    from: "Tiki Khuyến Mãi",
    subject: "Deal cuối tuần 70% - chỉ hôm nay",
    snippet: "Áo thun unisex - giảm sốc 70% cho đơn đầu tiên. Mã: TIKI70NOW.",
    features: {
      allCaps: false,
      linkCount: 2,
      suspiciousWord: false,
      unknownSender: false,
    },
  },
  {
    id: "e4",
    from: "WINNER-ALERT@prize-888.club",
    subject: "CHÚC MỪNG! Bạn vừa TRÚNG 500 TRIỆU - nhận ngay",
    snippet: "Bạn là khách hàng may mắn tuần này, truy cập link để lấy tiền thưởng trong 2 giờ.",
    features: {
      allCaps: true,
      linkCount: 5,
      suspiciousWord: true,
      unknownSender: true,
    },
  },
  {
    id: "e5",
    from: "Grab Việt Nam",
    subject: "Hoá đơn chuyến đi 12/04 - 78.000đ",
    snippet: "Cảm ơn bạn đã di chuyển cùng Grab. Tổng cộng: 78.000đ, phương thức Momo.",
    features: {
      allCaps: false,
      linkCount: 1,
      suspiciousWord: false,
      unknownSender: false,
    },
  },
  {
    id: "e6",
    from: "unknown-trader@fx-asia.win",
    subject: "Forex sinh lời 40%/tháng - đầu tư ngay hôm nay",
    snippet: "Cơ hội đầu tư không rủi ro, click để nhận tài khoản demo miễn phí.",
    features: {
      allCaps: false,
      linkCount: 4,
      suspiciousWord: true,
      unknownSender: true,
    },
  },
];

const FEATURE_WEIGHTS = {
  allCaps: 1.6,
  link: 0.6, // mỗi link
  suspiciousWord: 1.9,
  unknownSender: 1.4,
  base: -2.2,
};

function spamScore(
  email: MockEmail,
  multipliers: {
    allCaps: number;
    link: number;
    suspicious: number;
    unknown: number;
  },
) {
  const z =
    FEATURE_WEIGHTS.base +
    (email.features.allCaps ? FEATURE_WEIGHTS.allCaps * multipliers.allCaps : 0) +
    email.features.linkCount * FEATURE_WEIGHTS.link * multipliers.link +
    (email.features.suspiciousWord
      ? FEATURE_WEIGHTS.suspiciousWord * multipliers.suspicious
      : 0) +
    (email.features.unknownSender
      ? FEATURE_WEIGHTS.unknownSender * multipliers.unknown
      : 0);
  return 1 / (1 + Math.exp(-z));
}

/* Ground-truth label dùng để tính precision/recall — lấy xác suất ở cài đặt mặc định */
const TRUE_LABEL: Record<string, 0 | 1> = {
  e1: 0,
  e2: 1,
  e3: 0,
  e4: 1,
  e5: 0,
  e6: 1,
};

/* ─────────────────────────────────────────────────────────────
   INBOX DEMO
   ───────────────────────────────────────────────────────────── */
function InboxDemo() {
  const [threshold, setThreshold] = useState(0.5);
  const [features, setFeatures] = useState({
    allCaps: 1,
    link: 1,
    suspicious: 1,
    unknown: 1,
  });

  const scored = useMemo(
    () =>
      INBOX.map((email) => {
        const p = spamScore(email, features);
        const predicted: 0 | 1 = p >= threshold ? 1 : 0;
        return { email, p, predicted };
      }),
    [features, threshold],
  );

  const confusion = useMemo(() => {
    let tp = 0;
    let fp = 0;
    let tn = 0;
    let fn = 0;
    for (const row of scored) {
      const truth = TRUE_LABEL[row.email.id];
      if (row.predicted === 1 && truth === 1) tp++;
      else if (row.predicted === 1 && truth === 0) fp++;
      else if (row.predicted === 0 && truth === 0) tn++;
      else if (row.predicted === 0 && truth === 1) fn++;
    }
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    return { tp, fp, tn, fn, precision, recall };
  }, [scored]);

  const inbox = scored.filter((r) => r.predicted === 0);
  const junk = scored.filter((r) => r.predicted === 1);

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5">
      {/* Bảng điều khiển feature */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { key: "allCaps" as const, label: "VIẾT HOA toàn dòng", icon: Type, color: "#dc2626" },
          { key: "link" as const, label: "Nhiều link trong thân", icon: Link2, color: "#2563eb" },
          { key: "suspicious" as const, label: "Từ đáng ngờ (trúng, KHẨN...)", icon: BadgeAlert, color: "#f59e0b" },
          { key: "unknown" as const, label: "Người gửi lạ / domain lạ", icon: ShieldAlert, color: "#8b5cf6" },
        ].map((f) => {
          const Icon = f.icon;
          const on = features[f.key] > 0.5;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() =>
                setFeatures((prev) => ({
                  ...prev,
                  [f.key]: prev[f.key] > 0.5 ? 0.1 : 1,
                }))
              }
              className={`flex items-center gap-2 rounded-xl border p-3 text-left text-xs transition-colors ${
                on
                  ? "border-accent bg-accent-light"
                  : "border-border bg-surface/50 hover:border-accent/40"
              }`}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                style={{
                  backgroundColor: on ? f.color : "transparent",
                  color: on ? "#fff" : f.color,
                  border: on ? "none" : `1px solid ${f.color}`,
                }}
              >
                <Icon size={14} />
              </span>
              <span className={`flex-1 leading-tight ${on ? "text-foreground" : "text-muted"}`}>
                {f.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Ngưỡng */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">
            Ngưỡng &quot;spam&quot;
          </label>
          <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-xs font-bold text-accent">
            {(threshold * 100).toFixed(0)}%
          </span>
        </div>
        <input
          type="range"
          min={10}
          max={95}
          step={1}
          value={threshold * 100}
          onChange={(e) => setThreshold(Number(e.target.value) / 100)}
          className="mt-2 w-full accent-accent"
          aria-label="Ngưỡng spam"
        />
        <div className="mt-1 flex justify-between text-[10px] text-tertiary">
          <span>10% - dễ đánh dấu spam</span>
          <span>95% - phải rất chắc mới cho là spam</span>
        </div>
      </div>

      {/* Hai khối: Hộp thư đến vs Thùng rác */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-800 dark:bg-emerald-900/20">
          <div className="mb-2 flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
            <Inbox size={14} />
            <span className="text-sm font-semibold">Hộp thư đến · {inbox.length}</span>
          </div>
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {inbox.map((row) => (
                <EmailRow key={row.email.id} row={row} tone="inbox" />
              ))}
            </AnimatePresence>
            {inbox.length === 0 && (
              <p className="text-xs italic text-muted">(Tất cả email bị chuyển qua thùng rác)</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50/70 p-3 dark:border-red-800 dark:bg-red-900/20">
          <div className="mb-2 flex items-center gap-2 text-red-700 dark:text-red-300">
            <Trash2 size={14} />
            <span className="text-sm font-semibold">Thùng rác · {junk.length}</span>
          </div>
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {junk.map((row) => (
                <EmailRow key={row.email.id} row={row} tone="junk" />
              ))}
            </AnimatePresence>
            {junk.length === 0 && (
              <p className="text-xs italic text-muted">(Chưa có email nào bị đánh dấu spam)</p>
            )}
          </div>
        </div>
      </div>

      {/* Confusion table */}
      <div className="grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4">
        <StatTile label="TP (bắt đúng spam)" value={confusion.tp} color="#16a34a" />
        <StatTile label="FP (báo nhầm)" value={confusion.fp} color="#f59e0b" />
        <StatTile label="FN (bỏ sót)" value={confusion.fn} color="#dc2626" />
        <StatTile label="TN (thư thường đúng)" value={confusion.tn} color="#6b7280" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricTile label="Precision" value={confusion.precision} />
        <MetricTile label="Recall" value={confusion.recall} />
      </div>

      <p className="text-xs text-muted leading-relaxed">
        <strong>Precision</strong> = tỉ lệ email bị đánh dấu spam{" "}
        <em>đúng thật là spam</em>. <strong>Recall</strong> = tỉ lệ email spam thật{" "}
        <em>bị hệ thống bắt được</em>. Khi bạn tăng ngưỡng, precision tăng (ít báo nhầm)
        nhưng recall giảm (bỏ sót nhiều hơn). Gmail cân bằng hai chỉ số này trên hàng tỷ
        email mỗi ngày.
      </p>
    </div>
  );
}

function EmailRow({
  row,
  tone,
}: {
  row: { email: MockEmail; p: number; predicted: 0 | 1 };
  tone: "inbox" | "junk";
}) {
  const truth = TRUE_LABEL[row.email.id];
  const isCorrect = row.predicted === truth;
  const Icon = tone === "inbox" ? Mail : ShieldAlert;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18 }}
      className={`rounded-lg border p-2 text-xs ${
        isCorrect
          ? "border-border bg-card"
          : "border-amber-400 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Icon size={12} className="shrink-0 text-muted" />
          <span className="truncate font-semibold text-foreground">{row.email.from}</span>
        </div>
        <span
          className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
          style={{
            backgroundColor: row.p > 0.5 ? "#fee2e2" : "#dcfce7",
            color: row.p > 0.5 ? "#b91c1c" : "#166534",
          }}
        >
          P={(row.p * 100).toFixed(0)}%
        </span>
      </div>
      <div className="mt-1 truncate text-foreground/80">{row.email.subject}</div>
      <div className="mt-0.5 truncate text-muted">{row.email.snippet}</div>
      {!isCorrect && (
        <p className="mt-1 text-[10px] text-amber-700 dark:text-amber-400">
          {row.predicted === 1
            ? "Đánh dấu nhầm — email này thật sự là thư thường."
            : "Bỏ sót — email này thật sự là spam."}
        </p>
      )}
    </motion.div>
  );
}

function StatTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="rounded-xl border bg-card p-2"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="font-mono text-lg font-bold tabular-nums" style={{ color }}>
        {value}
      </div>
      <div className="text-[10px] leading-tight text-muted">{label}</div>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: number }) {
  const pct = value * 100;
  const color = pct >= 85 ? "#16a34a" : pct >= 60 ? "#f59e0b" : "#dc2626";
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted">{label}</span>
        <span className="font-mono text-sm font-bold tabular-nums" style={{ color }}>
          {pct.toFixed(0)}%
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.25 }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   P(spam) LIVE METER
   ───────────────────────────────────────────────────────────── */
function ProbabilityMeter() {
  const [toggles, setToggles] = useState({
    allCaps: false,
    links: 0,
    suspicious: false,
    unknown: false,
  });

  const z =
    FEATURE_WEIGHTS.base +
    (toggles.allCaps ? FEATURE_WEIGHTS.allCaps : 0) +
    toggles.links * FEATURE_WEIGHTS.link +
    (toggles.suspicious ? FEATURE_WEIGHTS.suspiciousWord : 0) +
    (toggles.unknown ? FEATURE_WEIGHTS.unknownSender : 0);
  const p = 1 / (1 + Math.exp(-z));
  const pct = p * 100;
  const color = pct >= 70 ? "#dc2626" : pct >= 40 ? "#f59e0b" : "#16a34a";

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h4 className="mb-3 text-sm font-semibold text-foreground">
        Một email — bật/tắt từng dấu hiệu để xem P(spam) đổi
      </h4>
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { key: "allCaps" as const, label: "VIẾT HOA" },
          { key: "suspicious" as const, label: "Từ đáng ngờ" },
          { key: "unknown" as const, label: "Người gửi lạ" },
        ].map((t) => {
          const on = toggles[t.key];
          return (
            <button
              key={t.key}
              type="button"
              onClick={() =>
                setToggles((prev) => ({ ...prev, [t.key]: !prev[t.key] }))
              }
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                on
                  ? "bg-accent text-white"
                  : "border border-border bg-surface text-muted hover:text-foreground"
              }`}
              aria-pressed={on}
            >
              {on ? "✓ " : ""}
              {t.label}
            </button>
          );
        })}
        <div className="flex items-center justify-center gap-1 rounded-full border border-border bg-surface px-2 py-1">
          <span className="text-[11px] text-muted">Link:</span>
          <button
            type="button"
            onClick={() =>
              setToggles((prev) => ({ ...prev, links: Math.max(0, prev.links - 1) }))
            }
            className="rounded px-1.5 text-sm font-bold text-muted hover:text-foreground"
            aria-label="Giảm số link"
          >
            −
          </button>
          <span className="w-5 text-center font-mono text-sm font-bold text-accent">
            {toggles.links}
          </span>
          <button
            type="button"
            onClick={() =>
              setToggles((prev) => ({ ...prev, links: Math.min(5, prev.links + 1) }))
            }
            className="rounded px-1.5 text-sm font-bold text-muted hover:text-foreground"
            aria-label="Tăng số link"
          >
            +
          </button>
        </div>
      </div>

      {/* Gauge lớn */}
      <div className="rounded-lg bg-surface/50 p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-semibold text-muted">P(spam)</span>
          <span
            className="font-mono text-3xl font-bold tabular-nums"
            style={{ color }}
          >
            {pct.toFixed(0)}%
          </span>
        </div>
        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-surface-hover">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-tertiary">
          <span>0% - an toàn</span>
          <span>50% - ngưỡng mặc định</span>
          <span>100% - chắc chắn spam</span>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted leading-relaxed">
        Mỗi lần bạn bật/tắt một đặc trưng, xác suất nhảy theo. Bạn vừa quan sát bản chất
        của hồi quy logistic: mỗi đặc trưng đóng góp một phần vào &quot;điểm spam&quot;,
        rồi hàm sigmoid biến tổng thành xác suất.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   QUIZ — 3 câu trở lên
   ───────────────────────────────────────────────────────────── */
const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Gmail muốn giảm số email bị đánh dấu nhầm là spam (False Positive). Họ nên chỉnh ngưỡng thế nào?",
    options: [
      "Giảm ngưỡng xuống 0.2 — dễ đánh dấu spam hơn",
      "Tăng ngưỡng lên 0.8 — chỉ khi rất chắc mới gọi là spam",
      "Bỏ mô hình, dùng luật cứng",
      "Không thể giảm False Positive nếu đã có mô hình",
    ],
    correct: 1,
    explanation:
      "Tăng ngưỡng → chỉ đánh dấu spam khi xác suất rất cao → ít False Positive (ít báo nhầm). Nhưng đổi lại, recall giảm (bỏ sót một số spam thật). Đây là đánh đổi kinh điển precision vs recall.",
  },
  {
    question:
      "Vì sao Gmail dùng xác suất thay vì luật cứng kiểu 'nếu có chữ TRÚNG THƯỞNG thì chặn'?",
    options: [
      "Luật cứng dễ viết hơn nên không ai dùng",
      "Xác suất cho phép kết hợp nhiều dấu hiệu nhẹ, và tự học khi kẻ spam đổi chiến thuật",
      "Luật cứng chỉ chạy trên máy chủ cũ",
      "Xác suất nhanh hơn luật cứng",
    ],
    correct: 1,
    explanation:
      "Luật cứng dễ bị lách (chỉ cần viết 'TRÚNG_THƯỞNG' có gạch dưới là qua). Mô hình xác suất tổng hợp nhiều đặc trưng nhẹ (link lạ, người gửi lạ, VIẾT HOA) thành một điểm số — kẻ spam phải lách tất cả cùng lúc, khó hơn nhiều.",
  },
  {
    question:
      "Một email có 0 dấu hiệu đáng ngờ nhưng vẫn bị mô hình chấm P(spam) = 90%. Điều gì khả năng cao đã xảy ra?",
    options: [
      "Mô hình luôn sai với mọi email",
      "Có đặc trưng khác mà mô hình đang dùng mà bạn không thấy (header IP, lịch sử tương tác, embedding nội dung)",
      "Sigmoid bị lỗi",
      "Tất cả email đều bị chấm 90%",
    ],
    correct: 1,
    explanation:
      "Gmail dùng hàng trăm đặc trưng, không chỉ 4 dấu hiệu bạn thấy ở đây. Nhiều dấu hiệu rất tinh vi (IP người gửi nằm trong danh sách đen, domain mới tạo, hành vi click trong quá khứ) — người dùng cuối không nhìn thấy được.",
  },
  {
    question:
      "Bạn là admin IT nhận yêu cầu 'tuyệt đối không bỏ sót email lừa đảo cho nhân viên tài chính'. Bạn đặt ngưỡng ra sao?",
    options: [
      "Ngưỡng thấp (ví dụ 0.3) — dễ đánh dấu spam hơn để tăng recall",
      "Ngưỡng cao (0.9) — cho chắc chắn",
      "Không cần ngưỡng, chặn mọi email lạ",
      "Để ngưỡng mặc định 0.5 là đủ",
    ],
    correct: 0,
    explanation:
      "Ưu tiên 'không bỏ sót' = tối đa recall, chấp nhận một số False Positive. Ngưỡng thấp = dễ đánh dấu spam hơn. Sau đó có thể cho nhân viên review thùng spam để hồi phục email bị báo nhầm.",
  },
];

/* ═══════════════ MAIN ═══════════════ */
export default function LogisticRegressionInSpamFilter() {
  return (
    <>
      <ApplicationLayout metadata={metadata} parentTitleVi="Hồi quy logistic">
        <ApplicationHero
          parentTitleVi="Hồi quy logistic"
          topicSlug="logistic-regression-in-spam-filter"
        >
          <p>
            Mỗi sáng bạn mở Gmail và hộp thư đến rất gọn — không có email giả ngân hàng,
            không có &quot;trúng thưởng 500 triệu&quot;, không có &quot;xác thực tài
            khoản NGAY&quot;. Bạn hiếm khi thấy vì chúng đã bị âm thầm chuyển vào thùng
            rác trước khi bạn kịp nhìn.
          </p>
          <p>
            Dưới đây là một hộp thư mô phỏng để bạn nhìn thẳng vào cơ chế. Thử bật/tắt
            các đặc trưng và kéo ngưỡng — cùng một dãy email, nhưng cách phân loại thay
            đổi từng giây.
          </p>
          <div className="not-prose mt-5">
            <InboxDemo />
          </div>
        </ApplicationHero>

        <ApplicationProblem topicSlug="logistic-regression-in-spam-filter">
          <p>
            Gmail phục vụ 1,8 tỷ người dùng. Mỗi ngày hệ thống nhận hàng chục tỷ email,
            trong đó khoảng 15 tỷ là thư rác. Kẻ gửi spam liên tục đổi chiến thuật: viết
            sai chính tả cố ý (tr-úng th-ưởng), chèn ký tự đặc biệt, thay domain mới, ẩn
            chữ vào hình ảnh.
          </p>
          <p>
            Vấn đề cốt lõi: mỗi email phải được gán{" "}
            <strong>một xác suất spam</strong>, rồi hệ thống tự quyết định vào hộp thư
            hay thùng rác. Sai chiều này (để lọt spam) gây phiền; sai chiều kia (chặn
            nhầm email quan trọng của sếp) gây hậu quả nghiêm trọng.
          </p>

          <div className="not-prose mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
              <div className="mb-1 flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <ShieldCheck size={14} />
                <span className="text-sm font-semibold">Nếu bắt được</span>
              </div>
              <p className="text-xs leading-relaxed text-foreground/85">
                Bạn không bao giờ nhìn thấy — hộp thư sạch. Đây là &quot;công việc im
                lặng&quot; làm Gmail đáng dùng.
              </p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
              <div className="mb-1 flex items-center gap-2 text-red-700 dark:text-red-300">
                <ShieldAlert size={14} />
                <span className="text-sm font-semibold">Nếu bỏ sót hoặc báo nhầm</span>
              </div>
              <p className="text-xs leading-relaxed text-foreground/85">
                Bỏ sót = mất tiền (lừa đảo trúng ví). Báo nhầm = mất hợp đồng (email sếp
                vào thùng rác).
              </p>
            </div>
          </div>
        </ApplicationProblem>

        <ApplicationMechanism
          parentTitleVi="Hồi quy logistic"
          topicSlug="logistic-regression-in-spam-filter"
        >
          <Beat step={1}>
            <p>
              <strong>Trích xuất đặc trưng từ email.</strong> Hệ thống bóc tách mọi dấu
              hiệu có thể: số từ VIẾT HOA, số link, từ khoá đáng ngờ, domain người gửi,
              IP máy chủ, cấu trúc HTML. Mỗi email trở thành một{" "}
              <strong>danh sách con số</strong> — đặc trưng (feature).
            </p>
            <div className="not-prose mt-4">
              <ProbabilityMeter />
            </div>
          </Beat>

          <Beat step={2}>
            <p>
              <strong>Tính điểm tuyến tính w·x + b.</strong> Mỗi đặc trưng được nhân với
              một trọng số (đặc trưng nào &quot;nặng ký&quot; hơn — ví dụ domain lạ — có
              trọng số lớn hơn). Cộng tất cả vào thành một điểm số z duy nhất. Đây là
              phần <TopicLink slug="linear-regression">hồi quy tuyến tính</TopicLink> trong
              lòng mô hình.
            </p>
          </Beat>

          <Beat step={3}>
            <p>
              <strong>Ép qua sigmoid → xác suất.</strong> Điểm z có thể là bất kỳ số nào,
              nhưng ta cần một xác suất trong (0, 1) để ra quyết định. Hàm sigmoid ép z
              thành một số trong khoảng đó — chính là P(email này là spam).
            </p>
            <div className="not-prose mt-4">
              <StepReveal
                labels={["z thấp", "z gần 0", "z cao"]}
              >
                {[
                  <div
                    key="z-low"
                    className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-foreground/85 dark:border-emerald-800 dark:bg-emerald-900/20"
                  >
                    <strong>z = −3:</strong> σ(z) ≈ 0.05. Email rất có khả năng là thư
                    thường. Vào hộp thư đến.
                  </div>,
                  <div
                    key="z-mid"
                    className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-foreground/85 dark:border-amber-800 dark:bg-amber-900/20"
                  >
                    <strong>z = 0:</strong> σ(z) = 0.5. Không chắc — nằm ngay biên. Nếu
                    ngưỡng mặc định là 0.5, Gmail sẽ nghi ngờ và có thể đưa vào tab{" "}
                    <em>Khuyến mại</em> hoặc hỏi bạn.
                  </div>,
                  <div
                    key="z-high"
                    className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-foreground/85 dark:border-red-800 dark:bg-red-900/20"
                  >
                    <strong>z = +4:</strong> σ(z) ≈ 0.98. Gần như chắc chắn là spam.
                    Vào thùng rác.
                  </div>,
                ]}
              </StepReveal>
            </div>
          </Beat>

          <Beat step={4}>
            <p>
              <strong>Đặt ngưỡng để ra quyết định.</strong> Ngưỡng mặc định là 0.5,
              nhưng Gmail có thể chỉnh cao hơn cho người dùng doanh nghiệp (sợ báo
              nhầm) hoặc thấp hơn cho tài khoản hay bị tấn công. Hộp thư đến nhận mọi
              email có P &lt; ngưỡng; thùng rác nhận phần còn lại.
            </p>
          </Beat>

          <Beat step={5}>
            <p>
              <strong>Học liên tục từ phản hồi.</strong> Khi bạn bấm &quot;Đánh dấu là
              spam&quot;, Gmail học thêm. Khi bạn kéo email từ thùng rác về, Gmail cũng
              học. Qua hàng tỷ phản hồi mỗi ngày, các trọng số w và bias b được cập nhật
              liên tục bằng cross-entropy loss + gradient descent. Dù bộ lọc ngày nay
              đã mở rộng sang mạng nơ-ron (RETVec), cơ chế nền &quot;tính xác suất rồi
              phân loại&quot; của hồi quy logistic vẫn là tư duy gốc.
            </p>
          </Beat>
        </ApplicationMechanism>

        <ApplicationMetrics
          sources={metadata.sources!}
          topicSlug="logistic-regression-in-spam-filter"
        >
          <Metric
            value="Độ chính xác 99,9% — chỉ 1 trong 1.000 thư rác lọt qua"
            sourceRef={3}
          />
          <Metric
            value="Chặn khoảng 15 tỷ thư rác mỗi ngày trên toàn hệ thống"
            sourceRef={1}
          />
          <Metric
            value="1,8 tỷ người dùng Gmail được bảo vệ"
            sourceRef={3}
          />
          <Metric
            value="RETVec cải thiện tỷ lệ phát hiện spam thêm 38%"
            sourceRef={2}
          />
        </ApplicationMetrics>

        <ApplicationCounterfactual
          parentTitleVi="Hồi quy logistic"
          topicSlug="logistic-regression-in-spam-filter"
        >
          <p>
            Không có hồi quy logistic, bộ lọc spam sẽ dựa vào luật cứng do con người viết
            tay: &quot;nếu email chứa từ X thì chặn&quot;. Cách này dễ bị qua mặt (chỉ cần
            viết sai chính tả) và không mở rộng được khi kẻ gửi spam đổi chiến thuật.
          </p>
          <p>
            Hồi quy logistic biến mỗi email thành một <strong>xác suất</strong>, kết hợp
            nhiều đặc trưng nhẹ thành một điểm số. Kẻ spam giờ phải lách tất cả đặc trưng
            cùng lúc — khó hơn nhiều. Ý tưởng &quot;tính xác suất nhị phân từ đặc trưng đầu
            vào&quot; này đã trở thành viên gạch nền của mọi hệ thống phân loại email hiện
            đại.
          </p>

          <div className="not-prose mt-5">
            <Callout variant="insight" title="Một con số đổi hẳn ngành email">
              Trước năm 2002, email spam tăng 500% mỗi năm. Sau khi Paul Graham đề xuất
              bộ lọc xác suất (tiền thân của logistic + cross-entropy), spam bị đẩy lùi về
              dưới 10% tổng email. Gmail và các dịch vụ khác chỉ việc mở rộng quy mô ý
              tưởng đó — từ vài nghìn từ khoá đến hàng triệu đặc trưng, và sau này là mạng
              nơ-ron. Nhưng trái tim vẫn là: &quot;biến dữ liệu thành xác suất, rồi quyết
              định dựa trên ngưỡng&quot;.
            </Callout>
          </div>
        </ApplicationCounterfactual>
      </ApplicationLayout>

      {/* ━━━ THỬ THÁCH + QUIZ — ngoài ApplicationLayout để bám đúng skeleton ━━━ */}
      <section className="mb-10">
        <InlineChallenge
          question="Ngưỡng hiện tại là 0.5. Một email spam tinh vi cho P = 0.42 (dưới ngưỡng). Nó vào đâu?"
          options={[
            "Thùng rác — vì Gmail luôn chặn thư lạ",
            "Hộp thư đến — vì P < 0.5, mô hình coi là thư thường",
            "Chờ người dùng xác nhận",
            "Xoá vĩnh viễn",
          ]}
          correct={1}
          explanation="P = 0.42 dưới ngưỡng 0.5 → mô hình cho là không phải spam → vào hộp thư đến. Đây chính là một False Negative. Gmail phải giảm ngưỡng hoặc bổ sung đặc trưng mới để bắt những email khéo léo như vậy."
        />
      </section>

      <section className="mb-10 space-y-4">
        <MiniSummary
          title="4 điều rút ra từ bộ lọc spam Gmail"
          points={[
            "Mỗi email biến thành một danh sách đặc trưng: số link, từ đáng ngờ, domain lạ, VIẾT HOA, v.v.",
            "Hồi quy logistic cộng các đặc trưng thành điểm số z, rồi sigmoid ép thành xác suất P(spam).",
            "Ngưỡng chốt: P ≥ ngưỡng → thùng rác. Ngưỡng cao = ít báo nhầm, ngưỡng thấp = bắt nhiều hơn.",
            "Mỗi lần bạn đánh dấu 'spam' hay 'không spam', Gmail học lại trọng số — mô hình sống chứ không cố định.",
          ]}
        />

        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-3 text-sm font-semibold text-foreground">
            Bốn &quot;chiêu&quot; của kẻ spam — mô hình sống lại học
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface/50 p-3 text-xs leading-relaxed text-foreground/85">
              <p className="mb-1 text-sm font-semibold text-foreground">
                1. Sai chính tả cố ý
              </p>
              &quot;tr-úng th-ưởng&quot;, &quot;m1ễn ph1&quot; — né được bộ lọc dựa vào chuỗi
              chữ chính xác. Đối phó: dùng RETVec / character-level embedding.
            </div>
            <div className="rounded-lg border border-border bg-surface/50 p-3 text-xs leading-relaxed text-foreground/85">
              <p className="mb-1 text-sm font-semibold text-foreground">
                2. Chữ trong hình ảnh
              </p>
              Chèn toàn bộ nội dung vào một tấm ảnh, không có text để quét. Đối phó: OCR nội
              dung ảnh, mô hình đa-phương tiện.
            </div>
            <div className="rounded-lg border border-border bg-surface/50 p-3 text-xs leading-relaxed text-foreground/85">
              <p className="mb-1 text-sm font-semibold text-foreground">
                3. Domain giả danh ngân hàng
              </p>
              &quot;no-reply@vietcom-bank.top&quot; thay cho &quot;vietcombank.com.vn&quot;. Đối
              phó: kiểm tra whois + DMARC + lịch sử domain.
            </div>
            <div className="rounded-lg border border-border bg-surface/50 p-3 text-xs leading-relaxed text-foreground/85">
              <p className="mb-1 text-sm font-semibold text-foreground">
                4. Thay đổi liên tục theo ngày
              </p>
              Sáng nay một mẫu, chiều đã khác. Đối phó: mô hình học online (online learning) —
              cập nhật trọng số trên dòng dữ liệu.
            </div>
          </div>
        </div>
      </section>

      <QuizSection questions={quizQuestions} />
    </>
  );
}
