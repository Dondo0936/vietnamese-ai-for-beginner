"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 *  BIAS & FAIRNESS IN HIRING — Ứng dụng thực tế
 *  ─────────────────────────────────────────────────────────────────────────
 *  Rewrite bởi Opus 4.7. Câu chuyện chính: Amazon huỷ công cụ AI tuyển dụng
 *  sau 3 năm vì phân biệt đối xử với ứng viên nữ. Đặt bên cạnh các trường
 *  hợp tương tự (HireVue) và các bài học cho doanh nghiệp Việt Nam.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Database,
  Gauge,
  Radio,
  Scale,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  Users,
  XCircle,
} from "lucide-react";

import {
  ToggleCompare,
  ProgressSteps,
  Callout,
  TabView,
  CollapsibleDetail,
} from "@/components/interactive";

import ApplicationLayout from "@/components/application/ApplicationLayout";
import ApplicationHero from "@/components/application/ApplicationHero";
import ApplicationProblem from "@/components/application/ApplicationProblem";
import ApplicationMechanism from "@/components/application/ApplicationMechanism";
import Beat from "@/components/application/Beat";
import ApplicationMetrics from "@/components/application/ApplicationMetrics";
import Metric from "@/components/application/Metric";
import ApplicationCounterfactual from "@/components/application/ApplicationCounterfactual";

import type { TopicMeta } from "@/lib/types";

/* ═══════════════════════════════════════════════════════════════════════════
 *  METADATA — Giữ nguyên, chỉ đổi vizType sang "interactive"
 * ═══════════════════════════════════════════════════════════════════════════ */
export const metadata: TopicMeta = {
  slug: "bias-fairness-in-hiring",
  title: "Bias & Fairness in Hiring",
  titleVi: "Thiên kiến & Công bằng trong Tuyển dụng",
  description:
    "Công cụ AI tuyển dụng của Amazon bị huỷ vì phân biệt đối xử với ứng viên nữ",
  category: "ai-safety",
  tags: ["bias-fairness", "hiring", "application"],
  difficulty: "beginner",
  relatedSlugs: ["bias-fairness"],
  vizType: "interactive",
  applicationOf: "bias-fairness",
  featuredApp: {
    name: "Amazon",
    productFeature: "AI Recruiting Tool (scrapped)",
    company: "Amazon.com Inc.",
    countryOrigin: "US",
  },
  sources: [
    {
      title:
        "Amazon scraps secret AI recruiting tool that showed bias against women",
      publisher: "Reuters",
      url: "https://www.reuters.com/article/us-amazon-com-jobs-automation-insight/amazon-scraps-secret-ai-recruiting-tool-that-showed-bias-against-women-idUSKCN1MK08G",
      date: "2018-10",
      kind: "news",
    },
    {
      title:
        "Amazon ditched AI recruitment software because it was biased against women",
      publisher: "MIT Technology Review",
      url: "https://www.technologyreview.com/2018/10/10/139858/amazon-ditched-ai-recruitment-software-because-it-was-biased-against-women/",
      date: "2018-10",
      kind: "news",
    },
    {
      title:
        "Why Amazon's Automated Hiring Tool Discriminated Against Women",
      publisher: "American Civil Liberties Union",
      url: "https://www.aclu.org/news/womens-rights/why-amazons-automated-hiring-tool-discriminated-against",
      date: "2018-10",
      kind: "news",
    },
    {
      title:
        "Diversity in the High Tech Workforce and Sector 2014–2022",
      publisher: "U.S. Equal Employment Opportunity Commission",
      url: "https://www.eeoc.gov/sites/default/files/2024-09/20240910_Diversity%20in%20the%20High%20Tech%20Workforce%20and%20Sector%202014-2022.pdf",
      date: "2024-09",
      kind: "documentation",
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

/* ═══════════════════════════════════════════════════════════════════════════
 *  TIMELINE WIDGET — các mốc lịch sử của AI-tuyển-dụng-đi-sai
 * ═══════════════════════════════════════════════════════════════════════════ */
const TIMELINE_EVENTS = [
  {
    year: "2014",
    actor: "Amazon",
    title: "Thành lập đội 12 người tại Edinburgh",
    detail:
      "Amazon tin tưởng có thể tự động hoá sàng lọc CV, chấm 1-5 sao như đánh giá sản phẩm.",
    tone: "neutral" as const,
  },
  {
    year: "2015",
    actor: "Amazon",
    title: "Phát hiện mô hình phân biệt giới tính",
    detail:
      'Mô hình hạ điểm các CV chứa từ "women\'s" như "women\'s chess club captain" và hai trường đại học nữ giới.',
    tone: "warn" as const,
  },
  {
    year: "2017",
    actor: "Amazon",
    title: "Giải tán đội, ngừng công cụ",
    detail:
      'Kỹ sư không đảm bảo được mô hình không tìm cách "phân biệt" mới. Amazon tuyên bố nhà tuyển dụng "chưa bao giờ hoàn toàn dựa vào" công cụ.',
    tone: "bad" as const,
  },
  {
    year: "2018",
    actor: "Reuters & giới báo chí",
    title: "Vụ việc lộ ra công chúng",
    detail:
      "Reuters xuất bản điều tra tháng 10/2018 — trở thành ví dụ kinh điển về thiên kiến AI trong mọi khóa học về đạo đức AI.",
    tone: "warn" as const,
  },
  {
    year: "2019+",
    actor: "HireVue, Pymetrics, HackerRank",
    title: "Làn sóng AI phỏng vấn nở rộ",
    detail:
      "Các vendor dùng AI phân tích biểu cảm khuôn mặt, giọng nói, từ vựng — gặp chỉ trích tương tự về bias theo chủng tộc và khuyết tật.",
    tone: "warn" as const,
  },
  {
    year: "2021",
    actor: "HireVue",
    title: "Bỏ tính năng phân tích khuôn mặt",
    detail:
      "Sau audit độc lập và áp lực từ Illinois AI Video Interview Act, HireVue loại bỏ phân tích biểu cảm khuôn mặt khỏi sản phẩm.",
    tone: "neutral" as const,
  },
  {
    year: "2023",
    actor: "NYC & EU",
    title: "Luật bắt buộc audit AI tuyển dụng",
    detail:
      "NYC Local Law 144 (7/2023) và EU AI Act xếp AI tuyển dụng vào hạng 'high-risk', bắt buộc audit bias định kỳ.",
    tone: "good" as const,
  },
  {
    year: "2023+",
    actor: "Việt Nam",
    title: "Nghị định 13/2023 có hiệu lực",
    detail:
      "Doanh nghiệp Việt Nam xử lý dữ liệu cá nhân nhạy cảm phải thực hiện DPIA — áp dụng trực tiếp cho AI sàng lọc CV.",
    tone: "good" as const,
  },
];

function TimelineEvent({
  ev,
  index,
}: {
  ev: (typeof TIMELINE_EVENTS)[number];
  index: number;
}) {
  const toneClass = {
    neutral: "border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/40",
    warn: "border-amber-300 bg-amber-50 dark:border-amber-600 dark:bg-amber-900/20",
    bad: "border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20",
    good: "border-emerald-300 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-900/20",
  }[ev.tone];

  const dotColor = {
    neutral: "bg-slate-400",
    warn: "bg-amber-500",
    bad: "bg-red-500",
    good: "bg-emerald-500",
  }[ev.tone];

  return (
    <motion.li
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="relative pl-8"
    >
      <span
        className={`absolute left-0 top-2 h-3 w-3 rounded-full ring-4 ring-background ${dotColor}`}
        aria-hidden
      />
      <div className={`rounded-lg border p-3 ${toneClass}`}>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="font-mono text-sm font-bold text-foreground">
            {ev.year}
          </span>
          <span className="text-xs font-semibold text-muted">· {ev.actor}</span>
        </div>
        <div className="mt-1 text-sm font-semibold text-foreground">
          {ev.title}
        </div>
        <p className="mt-1 text-xs text-foreground/80 leading-relaxed">
          {ev.detail}
        </p>
      </div>
    </motion.li>
  );
}

function Timeline() {
  return (
    <div className="relative my-6">
      <span
        className="absolute left-[5px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-accent/40 via-accent/20 to-transparent"
        aria-hidden
      />
      <ol className="space-y-4 list-none">
        {TIMELINE_EVENTS.map((ev, i) => (
          <TimelineEvent key={ev.year + ev.actor} ev={ev} index={i} />
        ))}
      </ol>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  ANIMATED COUNTER — cho phần Metrics
 * ═══════════════════════════════════════════════════════════════════════════ */
function AnimatedCounter({
  value,
  suffix = "",
  duration = 1.4,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = 0;

    function tick(now: number) {
      const t = Math.min(1, (now - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <span className="font-mono tabular-nums">
      {display.toLocaleString("vi-VN")}
      {suffix}
    </span>
  );
}

function CounterCard({
  icon: Icon,
  value,
  suffix,
  label,
  sourceRef,
  tone = "accent",
}: {
  icon: React.ElementType;
  value: number;
  suffix?: string;
  label: string;
  sourceRef?: string;
  tone?: "accent" | "red" | "amber" | "emerald";
}) {
  const palettes: Record<string, { bg: string; border: string; icon: string; num: string }> = {
    accent: {
      bg: "bg-accent-light/40",
      border: "border-accent/30",
      icon: "text-accent",
      num: "text-accent-dark dark:text-accent",
    },
    red: {
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-300 dark:border-red-700",
      icon: "text-red-600 dark:text-red-400",
      num: "text-red-700 dark:text-red-300",
    },
    amber: {
      bg: "bg-amber-50 dark:bg-amber-900/20",
      border: "border-amber-300 dark:border-amber-700",
      icon: "text-amber-600 dark:text-amber-400",
      num: "text-amber-700 dark:text-amber-300",
    },
    emerald: {
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      border: "border-emerald-300 dark:border-emerald-700",
      icon: "text-emerald-600 dark:text-emerald-400",
      num: "text-emerald-700 dark:text-emerald-300",
    },
  };
  const p = palettes[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={`rounded-xl border-2 ${p.border} ${p.bg} p-4 space-y-2`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${p.icon}`} />
        {sourceRef && (
          <span className="ml-auto text-[10px] font-mono text-muted">
            {sourceRef}
          </span>
        )}
      </div>
      <div className={`text-3xl font-bold ${p.num}`}>
        <AnimatedCounter value={value} suffix={suffix} />
      </div>
      <div className="text-xs text-foreground leading-relaxed">{label}</div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  PROBLEM SIDE-BY-SIDE COMPARISON
 *  Company dùng AI không audit vs công ty có quy trình audit
 * ═══════════════════════════════════════════════════════════════════════════ */
function ProblemComparison() {
  const noAuditRisks = [
    {
      icon: TrendingDown,
      text: "Chênh lệch tuyển nam-nữ 30-40 điểm % không ai phát hiện cho đến khi kiện tụng",
    },
    {
      icon: ShieldAlert,
      text: "Vi phạm Điều 8 Bộ luật Lao động 2019 về phân biệt đối xử trong tuyển dụng",
    },
    {
      icon: AlertTriangle,
      text: "Không có cơ chế khiếu nại — ứng viên bị loại không biết vì sao",
    },
    {
      icon: XCircle,
      text: "Khi dính scandal, 3 năm đầu tư bị huỷ trong một ngày (giống Amazon 2017)",
    },
  ];

  const withAuditChecks = [
    {
      icon: Gauge,
      text: "Đo chênh lệch tỷ lệ, TPR, FPR theo từng nhóm nhạy cảm hàng quý",
    },
    {
      icon: Users,
      text: "Human-in-the-loop: mọi ứng viên bị loại đều được HR phúc tra",
    },
    {
      icon: CheckCircle2,
      text: "Có DPIA theo Nghị định 13/2023 trước khi triển khai",
    },
    {
      icon: Scale,
      text: "Kênh khiếu nại minh bạch — ứng viên được giải thích lý do từ chối",
    },
  ];

  return (
    <ToggleCompare
      labelA="Công ty không audit"
      labelB="Công ty có quy trình audit"
      description="Cùng một công cụ AI — hai cách triển khai hoàn toàn khác nhau."
      childA={
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-lg bg-red-100 px-3 py-2 dark:bg-red-900/30">
            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <span className="text-xs font-bold uppercase text-red-800 dark:text-red-200">
              Mô hình Amazon 2014-2017
            </span>
          </div>
          {noAuditRisks.map((r, i) => {
            const Icon = r.icon;
            return (
              <div
                key={i}
                className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50/60 p-2.5 dark:border-red-800 dark:bg-red-900/10"
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                <span className="text-xs text-foreground leading-relaxed">
                  {r.text}
                </span>
              </div>
            );
          })}
        </div>
      }
      childB={
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-lg bg-emerald-100 px-3 py-2 dark:bg-emerald-900/30">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold uppercase text-emerald-800 dark:text-emerald-200">
              Quy trình tuân thủ Nghị định 13/2023
            </span>
          </div>
          {withAuditChecks.map((r, i) => {
            const Icon = r.icon;
            return (
              <div
                key={i}
                className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 p-2.5 dark:border-emerald-800 dark:bg-emerald-900/10"
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs text-foreground leading-relaxed">
                  {r.text}
                </span>
              </div>
            );
          })}
        </div>
      }
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  MECHANISM — ProgressSteps driving 5 Beats
 * ═══════════════════════════════════════════════════════════════════════════ */
const MECHANISM_STEPS = [
  {
    label: "Thu thập dữ liệu",
    icon: Database,
    beat: 1,
  },
  {
    label: "Huấn luyện",
    icon: Gauge,
    beat: 2,
  },
  {
    label: "Mã hoá thiên kiến",
    icon: AlertTriangle,
    beat: 3,
  },
  {
    label: "Quyết định sai",
    icon: XCircle,
    beat: 4,
  },
  {
    label: "Hậu quả pháp lý",
    icon: Scale,
    beat: 5,
  },
];

function MechanismStepper({
  current,
  setCurrent,
}: {
  current: number;
  setCurrent: (n: number) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <ProgressSteps
        current={current}
        total={MECHANISM_STEPS.length}
        labels={MECHANISM_STEPS.map((s) => s.label)}
      />
      <div className="flex flex-wrap gap-2 pt-2">
        {MECHANISM_STEPS.map((s, i) => {
          const num = i + 1;
          const Icon = s.icon;
          const active = current === num;
          return (
            <button
              key={s.label}
              type="button"
              onClick={() => setCurrent(num)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                active
                  ? "border-accent bg-accent text-white"
                  : "border-border bg-surface text-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              Bước {num}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  HERO — thêm timeline + quote dẫn
 * ═══════════════════════════════════════════════════════════════════════════ */
function HeroQuote() {
  return (
    <motion.blockquote
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="rounded-xl border-l-4 border-accent bg-accent-light/40 px-5 py-4 my-4"
    >
      <div className="flex items-start gap-3">
        <Sparkles className="mt-1 h-5 w-5 shrink-0 text-accent" />
        <div>
          <p className="text-sm italic text-foreground leading-relaxed">
            &ldquo;Everyone wanted this holy grail. They literally wanted it to
            be an engine where I&rsquo;m going to give you 100 résumés, it will
            spit out the top five, and we&rsquo;ll hire those.&rdquo;
          </p>
          <p className="mt-2 text-xs text-muted">
            &mdash; Nguồn ẩn danh trong đội Amazon, trả lời Reuters 10/2018
          </p>
        </div>
      </div>
    </motion.blockquote>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  MAIN COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════ */
export default function BiasFairnessInHiring() {
  const [mechanismStep, setMechanismStep] = useState(1);

  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Thiên kiến & Công bằng"
    >
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <ApplicationHero
        parentTitleVi="Thiên kiến & Công bằng"
        topicSlug="bias-fairness-in-hiring"
      >
        <p>
          Hãy tưởng tượng bạn nộp hồ sơ xin việc tại một trong những công ty
          công nghệ lớn nhất thế giới &mdash; nhưng trước khi bất kỳ nhà tuyển
          dụng nào đọc CV, một <strong>thuật toán</strong> đã âm thầm hạ điểm
          bạn. Lý do không phải vì bạn thiếu năng lực &mdash; mà vì cỗ máy
          &ldquo;học&rdquo; được rằng &ldquo;ứng viên giỏi&rdquo; nghĩa là
          &ldquo;ứng viên nam&rdquo;.
        </p>
        <p>
          Đó chính xác là những gì đã xảy ra tại Amazon từ năm 2014 đến 2017.
          Một đội 12 kỹ sư tại Edinburgh xây dựng hệ thống chấm CV 1-5 sao &mdash;
          và mô hình học từ 10 năm dữ liệu đã trừ điểm mọi hồ sơ có từ
          &ldquo;women&rsquo;s&rdquo; trong đó.
        </p>

        <HeroQuote />

        <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-muted uppercase tracking-wide">
          <Calendar className="h-4 w-4 text-accent" />
          Dòng thời gian: từ Amazon đến luật AI tuyển dụng
        </div>
        <Timeline />
      </ApplicationHero>

      {/* ── PROBLEM ──────────────────────────────────────────────────── */}
      <ApplicationProblem topicSlug="bias-fairness-in-hiring">
        <p>
          <strong>Thiên kiến trong học máy</strong> xảy ra khi mô hình AI học
          và tái tạo các khuôn mẫu phân biệt đối xử có sẵn trong dữ liệu huấn
          luyện. Khi dữ liệu lịch sử phản ánh sự bất bình đẳng &mdash; ngành
          công nghệ có khoảng 77% nam giới trong lực lượng lao động kỹ thuật
          cao theo EEOC &mdash; thuật toán mã hoá sự mất cân bằng đó thành
          &ldquo;tiêu chuẩn chất lượng&rdquo;.
        </p>
        <p>
          Kết quả là <strong>vòng lặp tự củng cố</strong>: dữ liệu thiên lệch
          tạo mô hình thiên lệch, mô hình đưa ra quyết định thiên lệch, và
          quyết định đó lại trở thành dữ liệu huấn luyện tiếp theo. Không phá
          vỡ được vòng lặp, AI không tự &ldquo;khá lên&rdquo; &mdash; nó càng
          lúc càng củng cố định kiến cũ.
        </p>

        <div className="mt-5">
          <ProblemComparison />
        </div>

        <Callout variant="warning" title="Bài học cho Việt Nam">
          <p>
            Phụ nữ chiếm đa số trong nhiều ngành tại Việt Nam (giáo dục, y tế,
            dịch vụ), nhưng lại là thiểu số trong dữ liệu lãnh đạo và công nghệ
            cao. Nếu doanh nghiệp Việt dùng AI tuyển dụng được train trên dữ
            liệu Mỹ hoặc dữ liệu lịch sử nội bộ không cân bằng, kịch bản Amazon
            hoàn toàn có thể lặp lại &mdash; nhưng với rủi ro pháp lý bổ sung
            từ Nghị định 13/2023 và Điều 8 Bộ luật Lao động 2019.
          </p>
        </Callout>
      </ApplicationProblem>

      {/* ── MECHANISM ────────────────────────────────────────────────── */}
      <ApplicationMechanism
        parentTitleVi="Thiên kiến & Công bằng"
        topicSlug="bias-fairness-in-hiring"
      >
        <div className="mb-5">
          <MechanismStepper
            current={mechanismStep}
            setCurrent={setMechanismStep}
          />
        </div>

        <Beat step={1}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <strong>Thu thập dữ liệu 10 năm.</strong>
            </div>
            <p>
              Amazon lấy toàn bộ hồ sơ xin việc của công ty trong 10 năm qua
              làm dữ liệu huấn luyện &mdash; khoảng 500 mô hình riêng cho
              từng vị trí và địa điểm. Vấn đề bắt đầu từ đây: phần lớn những
              CV &ldquo;thành công&rdquo; trong quá khứ là của nam giới, vì
              ngành công nghệ vốn đã mất cân bằng giới.
            </p>
          </div>
        </Beat>

        <Beat step={2}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <strong>Huấn luyện &mdash; mô hình &ldquo;học&rdquo; chuẩn mực.</strong>
            </div>
            <p>
              Hệ thống phân tích khoảng 50.000 thuật ngữ từ CV và tìm ra các
              pattern tương quan với &ldquo;ứng viên tốt&rdquo;. Động từ như
              &ldquo;executed&rdquo;, &ldquo;captured&rdquo; (thường xuất hiện
              trong CV nam) được gán trọng số cao. Không ai nói với mô hình
              &ldquo;hãy ưu tiên nam&rdquo; &mdash; nó tự kết luận.
            </p>
          </div>
        </Beat>

        <Beat step={3}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <strong>Thiên kiến được mã hoá vào mô hình.</strong>
            </div>
            <p>
              Mô hình phát hiện từ &ldquo;women&rsquo;s&rdquo; (trong
              &ldquo;women&rsquo;s chess club captain&rdquo;) và tự động trừ
              điểm. Hai trường đại học dành cho nữ giới cũng bị gắn cờ tiêu
              cực. Kỹ sư cố xoá các trigger này, nhưng không đảm bảo được
              rằng mô hình không tìm ra cách mới để phân biệt &mdash; bởi
              thông tin giới tính rò rỉ qua hàng trăm proxy khác.
            </p>
          </div>
        </Beat>

        <Beat step={4}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <strong>Quyết định phân biệt đối xử ở quy mô lớn.</strong>
            </div>
            <p>
              Mỗi ngày công cụ xử lý hàng nghìn CV. Ứng viên nữ với cùng năng
              lực bị xếp hạng thấp hơn nam &mdash; không ai trong đội tuyển
              dụng biết được con số chính xác, vì không có bảng đánh giá công
              bằng. Mô hình cũng đưa ra đề xuất gần như ngẫu nhiên cho nhiều
              vị trí, tệ hơn cả con người.
            </p>
          </div>
        </Beat>

        <Beat step={5}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              <strong>Hậu quả &mdash; Amazon huỷ công cụ.</strong>
            </div>
            <p>
              Đầu 2017 Amazon giải tán đội và ngừng sử dụng công cụ. Khi
              Reuters công bố điều tra năm 2018, vụ việc trở thành ví dụ kinh
              điển trong mọi khoá đạo đức AI. Amazon tuyên bố
              &ldquo;không bao giờ hoàn toàn dựa vào&rdquo; xếp hạng &mdash;
              nhưng hình ảnh công ty vẫn chịu tổn hại, và 3 năm đầu tư kỹ sư
              coi như mất trắng.
            </p>
          </div>
        </Beat>

        <div className="mt-6">
          <CollapsibleDetail title="So sánh với HireVue (2014-2021)">
            <div className="pt-3 space-y-3 text-sm">
              <p>
                HireVue bán phần mềm phỏng vấn bằng video, AI phân tích biểu
                cảm khuôn mặt, giọng nói, chọn từ vựng. Được hàng trăm tập đoàn
                dùng (Unilever, Hilton, Goldman Sachs, Delta).
              </p>
              <p>
                <strong>Vấn đề tương tự</strong>: mô hình cho điểm thấp hơn
                với người có giọng không chuẩn Mỹ, khuyết tật nói, hay người
                tự kỷ &mdash; những nhóm không có đủ trong dữ liệu huấn luyện.
                Bias không chỉ về giới, còn về chủng tộc và khuyết tật.
              </p>
              <p>
                <strong>Khác biệt kết cục</strong>: HireVue không huỷ sản
                phẩm, chỉ bỏ tính năng phân tích khuôn mặt năm 2021 sau áp lực
                từ Illinois AI Video Interview Act. Vẫn còn dùng phân tích
                giọng và từ vựng &mdash; vấn đề chưa thực sự giải quyết.
              </p>
            </div>
          </CollapsibleDetail>
        </div>
      </ApplicationMechanism>

      {/* ── METRICS (animated counters) ──────────────────────────────── */}
      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="bias-fairness-in-hiring"
      >
        <Metric
          value="Huấn luyện trên khoảng 10 năm dữ liệu hồ sơ, phần lớn từ ứng viên nam"
          sourceRef={1}
        />
        <Metric
          value="500 mô hình ML, phân tích khoảng 50.000 thuật ngữ từ CV"
          sourceRef={1}
        />
        <Metric
          value="Phụ nữ chỉ chiếm khoảng 22,6% lực lượng lao động công nghệ cao tại Hoa Kỳ"
          sourceRef={4}
        />
        <Metric
          value="Đội ngũ khoảng 12 kỹ sư làm việc trong 3 năm (2014–2017) trước khi dự án bị huỷ"
          sourceRef={1}
        />
      </ApplicationMetrics>

      {/* Visual counter grid — nằm ngoài ApplicationMetrics để giữ markdown list gốc */}
      <section className="mb-10">
        <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <Radio className="h-4 w-4 text-accent" />
          Con số biết nói &mdash; nhìn nhanh
        </h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <CounterCard
            icon={Clock}
            value={10}
            suffix=" năm"
            label="Dữ liệu huấn luyện được sử dụng"
            sourceRef="[1]"
            tone="accent"
          />
          <CounterCard
            icon={Building2}
            value={500}
            suffix=""
            label="Số mô hình ML được xây dựng"
            sourceRef="[1]"
            tone="accent"
          />
          <CounterCard
            icon={Database}
            value={50000}
            suffix=""
            label="Thuật ngữ CV được phân tích"
            sourceRef="[1]"
            tone="amber"
          />
          <CounterCard
            icon={TrendingDown}
            value={22}
            suffix="%"
            label="Tỷ lệ nữ trong lực lượng công nghệ cao Mỹ (2022)"
            sourceRef="[4]"
            tone="red"
          />
          <CounterCard
            icon={Users}
            value={12}
            suffix=""
            label="Kỹ sư tại đội Edinburgh"
            sourceRef="[1]"
            tone="accent"
          />
          <CounterCard
            icon={Calendar}
            value={3}
            suffix=" năm"
            label="Thời gian phát triển trước khi huỷ"
            sourceRef="[1]"
            tone="red"
          />
          <CounterCard
            icon={ShieldAlert}
            value={2017}
            suffix=""
            label="Năm đội ngũ bị giải tán"
            sourceRef="[1]"
            tone="red"
          />
          <CounterCard
            icon={CheckCircle2}
            value={2018}
            suffix=""
            label="Năm vụ việc ra công chúng (Reuters)"
            sourceRef="[1]"
            tone="emerald"
          />
        </div>
      </section>

      {/* ── COUNTERFACTUAL ───────────────────────────────────────────── */}
      <ApplicationCounterfactual
        parentTitleVi="Thiên kiến & Công bằng"
        topicSlug="bias-fairness-in-hiring"
      >
        <p>
          Nếu đội ngũ Amazon đã áp dụng các nguyên tắc công bằng từ đầu, kịch
          bản có thể đã hoàn toàn khác. Hãy so sánh hai thế giới.
        </p>

        <div className="my-5">
          <ToggleCompare
            labelA="Thực tế (không audit)"
            labelB="Kịch bản có audit"
            description="Cùng dữ liệu đầu vào, hai quy trình khác nhau."
            childA={
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-lg bg-red-100 px-3 py-2 dark:bg-red-900/30">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span className="text-xs font-bold uppercase text-red-800 dark:text-red-200">
                    Những gì Amazon đã làm
                  </span>
                </div>
                <ul className="space-y-2 text-xs text-foreground leading-relaxed">
                  <li className="rounded-lg border border-red-200 bg-red-50/50 p-2.5 dark:border-red-800 dark:bg-red-900/10">
                    Dùng 10 năm dữ liệu thô &mdash; không kiểm tra cân bằng giới
                    trong tập huấn luyện.
                  </li>
                  <li className="rounded-lg border border-red-200 bg-red-50/50 p-2.5 dark:border-red-800 dark:bg-red-900/10">
                    Triển khai nội bộ sau khi test chức năng &mdash; không test
                    công bằng.
                  </li>
                  <li className="rounded-lg border border-red-200 bg-red-50/50 p-2.5 dark:border-red-800 dark:bg-red-900/10">
                    Phát hiện bias sau khi kỹ sư tình cờ nhận ra &mdash; quá trễ,
                    mô hình đã chạy nhiều tháng.
                  </li>
                  <li className="rounded-lg border border-red-200 bg-red-50/50 p-2.5 dark:border-red-800 dark:bg-red-900/10">
                    Cố sửa bằng cách xoá từ khoá &mdash; bias chui vào proxy mới.
                  </li>
                  <li className="rounded-lg border border-red-200 bg-red-50/50 p-2.5 dark:border-red-800 dark:bg-red-900/10">
                    Huỷ toàn bộ dự án &mdash; mất 3 năm, 12 kỹ sư, hình ảnh thương
                    hiệu.
                  </li>
                </ul>
              </div>
            }
            childB={
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-lg bg-emerald-100 px-3 py-2 dark:bg-emerald-900/30">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold uppercase text-emerald-800 dark:text-emerald-200">
                    Quy trình theo Nghị định 13/2023
                  </span>
                </div>
                <ul className="space-y-2 text-xs text-foreground leading-relaxed">
                  <li className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5 dark:border-emerald-800 dark:bg-emerald-900/10">
                    Thực hiện DPIA trước khi huấn luyện &mdash; phát hiện mất cân
                    bằng 77/23 ngay từ đầu.
                  </li>
                  <li className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5 dark:border-emerald-800 dark:bg-emerald-900/10">
                    Cân bằng dữ liệu bằng oversampling hoặc reweighting &mdash;
                    giảm 80% chênh lệch đầu vào.
                  </li>
                  <li className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5 dark:border-emerald-800 dark:bg-emerald-900/10">
                    Audit theo từng nhóm trước khi deploy &mdash; đo TPR, FPR, tỷ
                    lệ chọn theo giới.
                  </li>
                  <li className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5 dark:border-emerald-800 dark:bg-emerald-900/10">
                    Human-in-the-loop cho mọi quyết định &mdash; AI chỉ đề xuất,
                    HR ký duyệt.
                  </li>
                  <li className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5 dark:border-emerald-800 dark:bg-emerald-900/10">
                    Có kênh khiếu nại và phúc tra &mdash; bảo vệ uy tín khi AI
                    sai.
                  </li>
                </ul>
              </div>
            }
          />
        </div>

        <div className="my-5">
          <TabView
            tabs={[
              {
                label: "Doanh nghiệp Việt — 5 bước triển khai",
                content: (
                  <ol className="list-decimal pl-5 space-y-2 text-sm text-foreground leading-relaxed">
                    <li>
                      <strong>Xác định nhóm nhạy cảm</strong> theo Điều 8 Bộ luật
                      Lao động: giới, tuổi, dân tộc, tôn giáo, hoàn cảnh gia đình.
                    </li>
                    <li>
                      <strong>Thực hiện DPIA</strong> theo Nghị định 13/2023
                      trước khi huấn luyện bất kỳ mô hình nào dùng dữ liệu ứng viên.
                    </li>
                    <li>
                      <strong>Audit trước triển khai</strong>: đo chênh lệch tỷ
                      lệ chọn, TPR, FPR giữa các nhóm trên dữ liệu Việt Nam thật.
                    </li>
                    <li>
                      <strong>Human-in-the-loop</strong>: mọi từ chối phải do
                      người ký, AI chỉ đề xuất thứ tự.
                    </li>
                    <li>
                      <strong>Kênh khiếu nại</strong> cho ứng viên, phúc tra
                      trong 14 ngày làm việc.
                    </li>
                  </ol>
                ),
              },
              {
                label: "Ba kỹ thuật giảm bias phổ biến",
                content: (
                  <div className="space-y-3 text-sm text-foreground leading-relaxed">
                    <div className="rounded-lg border border-border bg-surface/40 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase text-accent">
                          Pre-processing
                        </span>
                      </div>
                      <p>
                        Cân bằng dữ liệu đầu vào &mdash; oversample nhóm thiểu
                        số, reweighting, hoặc thu thập thêm dữ liệu mục tiêu.
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-surface/40 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase text-accent">
                          In-processing
                        </span>
                      </div>
                      <p>
                        Thêm ràng buộc công bằng vào hàm mục tiêu khi huấn luyện
                        &mdash; phạt mô hình nếu chênh lệch giữa các nhóm vượt
                        ngưỡng.
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-surface/40 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase text-accent">
                          Post-processing
                        </span>
                      </div>
                      <p>
                        Điều chỉnh ngưỡng quyết định riêng cho từng nhóm &mdash;
                        nhanh nhất để triển khai, thường kèm trade-off độ chính
                        xác.
                      </p>
                    </div>
                  </div>
                ),
              },
              {
                label: "Cần ghi nhớ",
                content: (
                  <ul className="space-y-2 text-sm text-foreground leading-relaxed pl-5 list-disc">
                    <li>
                      <strong>Không có AI &ldquo;công bằng tuyệt đối&rdquo;</strong>
                      {" "}&mdash; chỉ có lựa chọn có chứng minh.
                    </li>
                    <li>
                      Khi AI sàng lọc ứng viên, trách nhiệm pháp lý vẫn thuộc
                      doanh nghiệp, không phải vendor.
                    </li>
                    <li>
                      Audit phải <strong>trước và trong suốt vòng đời</strong>,
                      không phải một lần.
                    </li>
                    <li>
                      Lưu lại quyết định &ldquo;chọn tiêu chí công bằng nào&rdquo;
                      &mdash; đây là bảo vệ pháp lý của chính bạn.
                    </li>
                  </ul>
                ),
              },
            ]}
          />
        </div>

        <Callout variant="insight" title="Bài học cuối cùng">
          <p>
            Amazon không phải là công ty &ldquo;ác ý&rdquo; &mdash; họ là một
            trong những tổ chức có năng lực kỹ thuật cao nhất thế giới, và vẫn
            thất bại. Bài học: <strong>năng lực kỹ thuật không thay thế được
            quy trình đạo đức</strong>. Với doanh nghiệp Việt đang dùng AI tuyển
            dụng, DPIA, audit bias và human-in-the-loop không phải là
            &ldquo;phần thêm&rdquo; &mdash; đó là điều kiện tiên quyết để không
            lặp lại 3 năm lãng phí của Amazon.
          </p>
        </Callout>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
