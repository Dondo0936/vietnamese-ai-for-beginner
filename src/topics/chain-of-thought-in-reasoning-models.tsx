"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  Brain,
  ClipboardCheck,
  Clock,
  Eye,
  Gauge,
  Lightbulb,
  Mail,
  RefreshCw,
  Rocket,
  Sparkles,
  Timer,
  Trophy,
  X,
} from "lucide-react";

import ApplicationLayout from "@/components/application/ApplicationLayout";
import ApplicationHero from "@/components/application/ApplicationHero";
import ApplicationProblem from "@/components/application/ApplicationProblem";
import ApplicationMechanism from "@/components/application/ApplicationMechanism";
import Beat from "@/components/application/Beat";
import ApplicationMetrics from "@/components/application/ApplicationMetrics";
import Metric from "@/components/application/Metric";
import ApplicationCounterfactual from "@/components/application/ApplicationCounterfactual";

import {
  Callout,
  ProgressSteps,
  ToggleCompare,
  TopicLink,
} from "@/components/interactive";

import type { TopicMeta } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────
// Metadata — giữ nguyên slug và cấu trúc; đổi vizType sang interactive
// ─────────────────────────────────────────────────────────────────────────
export const metadata: TopicMeta = {
  slug: "chain-of-thought-in-reasoning-models",
  title: "Chain of Thought in Reasoning Models",
  titleVi: "Chuỗi suy luận trong Mô hình Lý luận",
  description:
    "GPT-o1 và Claude Extended Thinking: mô hình lý luận tự nháp từng bước trước khi trả lời, khiến dân văn phòng tin kết quả hơn.",
  category: "llm-concepts",
  tags: ["chain-of-thought", "reasoning", "application"],
  difficulty: "beginner",
  relatedSlugs: ["chain-of-thought"],
  vizType: "interactive",
  applicationOf: "chain-of-thought",
  featuredApp: {
    name: "GPT-o1 / Claude Extended Thinking",
    productFeature: "Reasoning Models with Visible Chain of Thought",
    company: "OpenAI / Anthropic",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "Learning to reason with LLMs",
      publisher: "OpenAI",
      url: "https://openai.com/index/learning-to-reason-with-llms/",
      date: "2024-09",
      kind: "engineering-blog",
    },
    {
      title: "OpenAI o1 System Card",
      publisher: "OpenAI",
      url: "https://cdn.openai.com/o1-system-card-20241205.pdf",
      date: "2024-12",
      kind: "documentation",
    },
    {
      title: "Claude 3.7 Sonnet and Claude Code",
      publisher: "Anthropic",
      url: "https://www.anthropic.com/news/claude-3-7-sonnet",
      date: "2025-02",
      kind: "engineering-blog",
    },
    {
      title: "Claude's extended thinking",
      publisher: "Anthropic",
      url: "https://www.anthropic.com/news/visible-extended-thinking",
      date: "2025-02",
      kind: "engineering-blog",
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

// ─────────────────────────────────────────────────────────────────────────
// Timeline trực quan cho ApplicationHero
// ─────────────────────────────────────────────────────────────────────────
interface TimelineEvent {
  date: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  tone: string;
}

const HERO_TIMELINE: TimelineEvent[] = [
  {
    date: "09/2024",
    title: "OpenAI ra mắt o1",
    subtitle:
      "Mô hình AI đầu tiên được huấn luyện để 'nghĩ' trước khi nói — tự bật chuỗi suy luận mà không cần người dùng nhắc.",
    icon: Rocket,
    tone: "border-accent/60 bg-accent-light",
  },
  {
    date: "02/2025",
    title: "Anthropic ra Claude 3.7 Sonnet",
    subtitle:
      "Mô hình lý luận lai đầu tiên — bạn bật/tắt chế độ 'Extended Thinking' và xem tận mắt Claude đang nháp gì.",
    icon: Eye,
    tone: "border-accent/60 bg-accent-light",
  },
];

function HeroTimeline() {
  return (
    <div className="my-6 rounded-2xl border border-border bg-surface/30 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Clock size={16} className="text-accent" />
        <p className="text-xs font-semibold uppercase tracking-wider text-tertiary">
          6 tháng định hình lại "AI biết suy nghĩ"
        </p>
      </div>

      <div className="relative">
        {/* Đường nối ngang */}
        <div
          aria-hidden
          className="absolute left-6 right-6 top-6 hidden h-0.5 bg-gradient-to-r from-accent/40 via-accent to-accent/40 md:block"
        />

        <div className="grid gap-4 md:grid-cols-2">
          {HERO_TIMELINE.map((ev, i) => {
            const Icon = ev.icon;
            return (
              <motion.div
                key={ev.date}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.4 }}
                className="relative rounded-xl border border-border bg-card p-4"
              >
                <div
                  aria-hidden
                  className={`absolute -top-3 left-4 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background ${ev.tone}`}
                >
                  <Icon size={14} className="text-accent" />
                </div>
                <p className="mt-2 font-mono text-xs font-semibold text-accent">
                  {ev.date}
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {ev.title}
                </p>
                <p className="mt-1.5 text-sm text-muted leading-relaxed">
                  {ev.subtitle}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Hình minh họa "chấm nháy" — AI đang suy nghĩ
// ─────────────────────────────────────────────────────────────────────────
function ThinkingDots() {
  return (
    <div
      aria-hidden
      className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-border bg-surface/40 px-4 py-3"
    >
      <Brain size={18} className="text-accent" />
      <span className="text-sm text-muted">Mô hình đang suy nghĩ</span>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-accent"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{
              duration: 1.1,
              repeat: Infinity,
              delay: i * 0.18,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ToggleCompare cho ApplicationProblem — câu hỏi văn phòng nhiều bước
// ─────────────────────────────────────────────────────────────────────────
function ProblemToggleDemo() {
  return (
    <div className="my-5 space-y-3">
      <div className="flex items-start gap-3 rounded-xl border border-dashed border-border bg-surface/50 p-4">
        <Mail size={20} className="mt-0.5 shrink-0 text-accent" />
        <div>
          <p className="text-sm font-semibold text-foreground">
            Tình huống thực tế
          </p>
          <p className="mt-1 text-sm text-muted leading-relaxed">
            “Công ty có 3 gói thưởng cuối năm cho 3 nhóm nhân viên khác nhau.
            Mỗi gói tính theo lương + phụ cấp + thâm niên. Hãy chọn gói nào
            ưu đãi nhất cho nhóm kinh doanh.”
          </p>
        </div>
      </div>

      <ToggleCompare
        labelA="Mô hình thường, trả lời nhanh"
        labelB="Mô hình lý luận, suy nghĩ trước"
        description="Cùng một câu hỏi — chỉ khác ở chỗ mô hình có được phép 'nháp' hay không."
        childA={
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300">
                Sai
              </span>
              <span className="text-sm text-muted">Trả lời trong 2 giây</span>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
              <p className="text-sm text-foreground leading-relaxed">
                “Gói A ưu đãi nhất vì có mức thưởng cố định cao nhất.”
              </p>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Mô hình nhìn một con số “cao nhất” rồi chốt luôn, không kiểm
              tra lương cơ bản nhóm kinh doanh có đang ăn theo tỉ lệ % hay
              không. Kết quả sai với nhóm có hoa hồng cao.
            </p>
          </div>
        }
        childB={
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">
                Đúng
              </span>
              <span className="text-sm text-muted">
                Nháp nội bộ trong 20 giây rồi mới trả lời
              </span>
            </div>
            <ol className="space-y-2 text-sm text-foreground leading-relaxed">
              <li className="rounded-lg border border-border bg-card/50 px-3 py-2">
                <strong>1.</strong> Xác định đặc điểm nhóm kinh doanh: lương
                cơ bản thấp + hoa hồng cao.
              </li>
              <li className="rounded-lg border border-border bg-card/50 px-3 py-2">
                <strong>2.</strong> Chấm điểm 3 gói theo mức tác động lên
                nhóm có hoa hồng cao.
              </li>
              <li className="rounded-lg border border-border bg-card/50 px-3 py-2">
                <strong>3.</strong> Phát hiện gói A có mức cố định cao nhưng
                chặn trần hoa hồng → kém với nhóm kinh doanh.
              </li>
              <li className="rounded-lg border border-border bg-card/50 px-3 py-2">
                <strong>4.</strong> Gói C có mức cố định thấp hơn nhưng
                không chặn hoa hồng, tổng thu nhập trung bình cao hơn.
              </li>
            </ol>
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-200">
              Kết luận: nên chọn gói C cho nhóm kinh doanh.
            </div>
          </div>
        }
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ApplicationMechanism — 4 Beat kèm flow trực quan ở trên
// ─────────────────────────────────────────────────────────────────────────
interface MechanismBeat {
  step: number;
  title: string;
  icon: React.ElementType;
}

const MECHANISM_BEATS: MechanismBeat[] = [
  { step: 1, title: "Tự bật chuỗi suy luận", icon: Sparkles },
  { step: 2, title: "Tự phát hiện sai và quay lại", icon: RefreshCw },
  { step: 3, title: "Hiển thị suy nghĩ cho người dùng", icon: Eye },
  { step: 4, title: "Càng nghĩ lâu, càng chính xác", icon: Gauge },
];

function MechanismFlow() {
  return (
    <div className="my-5 space-y-4 rounded-2xl border border-border bg-surface/30 p-5">
      <div className="flex items-center gap-2">
        <Lightbulb size={16} className="text-accent" />
        <p className="text-xs font-semibold uppercase tracking-wider text-tertiary">
          Từ prompt của bạn đến câu trả lời cuối — 4 giai đoạn
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {MECHANISM_BEATS.map((b, i) => {
          const Icon = b.icon;
          return (
            <motion.div
              key={b.step}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -30px 0px" }}
              transition={{ delay: i * 0.12, duration: 0.35 }}
              className="relative rounded-xl border border-border bg-card p-3"
            >
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white"
                >
                  {b.step}
                </span>
                <Icon size={16} className="text-accent" />
              </div>
              <p className="mt-2 text-sm font-semibold text-foreground leading-snug">
                {b.title}
              </p>
              {i < MECHANISM_BEATS.length - 1 && (
                <span
                  aria-hidden
                  className="absolute right-[-10px] top-1/2 hidden h-px w-5 bg-accent/40 md:block"
                />
              )}
            </motion.div>
          );
        })}
      </div>

      <ProgressSteps
        current={2}
        total={4}
        labels={MECHANISM_BEATS.map((b) => b.title)}
      />

      <p className="text-xs text-muted leading-relaxed">
        Nhấp vào từng beat bên dưới để đọc chi tiết. Thanh tiến trình cho bạn
        cảm giác quá trình suy luận — từ “bật chuỗi” đến “chốt đáp án”.
      </p>
    </div>
  );
}

// Ô minh họa cho mỗi Beat — cho người đọc cái nhìn trực quan song song với prose
function BeatInlineIllustration({
  step,
}: {
  step: number;
}) {
  if (step === 1) {
    return (
      <div className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-surface/40 p-3 text-sm">
        <Sparkles size={16} className="shrink-0 text-accent" />
        <div className="flex-1">
          <span className="font-medium text-foreground">Người dùng hỏi </span>
          <span className="text-muted">→</span>
          <span className="mx-1 rounded-md bg-accent-light px-1.5 py-0.5 text-xs font-semibold text-accent-dark">
            [Reasoning Tokens ẩn]
          </span>
          <span className="text-muted">→</span>
          <span className="ml-1 font-medium text-foreground">Đáp án cuối</span>
        </div>
      </div>
    );
  }
  if (step === 2) {
    return (
      <div className="mt-3 rounded-xl border border-border bg-surface/40 p-3 text-sm">
        <div className="flex items-center gap-2 text-muted">
          <RefreshCw size={14} className="text-accent" />
          <span>Vòng tự sửa lỗi</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="rounded-md bg-card px-2 py-1 text-foreground">
            Thử cách 1
          </span>
          <span className="text-muted">→</span>
          <span className="rounded-md bg-red-50 px-2 py-1 text-red-700 dark:bg-red-900/30 dark:text-red-300">
            Phát hiện sai
          </span>
          <span className="text-muted">→</span>
          <span className="rounded-md bg-card px-2 py-1 text-foreground">
            Quay lại
          </span>
          <span className="text-muted">→</span>
          <span className="rounded-md bg-green-50 px-2 py-1 text-green-700 dark:bg-green-900/30 dark:text-green-300">
            Cách 2 đúng
          </span>
        </div>
      </div>
    );
  }
  if (step === 3) {
    return (
      <div className="mt-3 rounded-xl border border-border bg-surface/40 p-3 text-sm">
        <div className="flex items-center gap-2">
          <Eye size={14} className="text-accent" />
          <span className="font-medium text-foreground">
            Chế độ Extended Thinking của Claude
          </span>
        </div>
        <ThinkingDots />
      </div>
    );
  }
  // step === 4
  return (
    <div className="mt-3 rounded-xl border border-border bg-surface/40 p-3 text-sm">
      <div className="mb-2 flex items-center gap-2">
        <Timer size={14} className="text-accent" />
        <span className="font-medium text-foreground">
          Nháp càng lâu, xác suất đúng càng cao
        </span>
      </div>
      <div className="space-y-1.5">
        {[
          { label: "Nghĩ 5 giây", pct: 40 },
          { label: "Nghĩ 30 giây", pct: 68 },
          { label: "Nghĩ 2 phút", pct: 84 },
        ].map((row) => (
          <div key={row.label} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-xs text-muted">{row.label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-card">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${row.pct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full bg-accent"
              />
            </div>
            <span className="w-10 shrink-0 text-right font-mono text-xs font-semibold text-accent">
              {row.pct}%
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] italic text-tertiary">
        Số liệu minh họa — xu hướng chung từ bảng điểm công khai của o1.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// AnimatedCounter dùng cho ApplicationMetrics
// ─────────────────────────────────────────────────────────────────────────
interface CounterProps {
  value: number;
  suffix?: string;
  decimals?: number;
  duration?: number;
}

function AnimatedCounter({
  value,
  suffix = "",
  decimals = 0,
  duration = 1.2,
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px 0px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    let raf = 0;
    function tick(now: number) {
      const elapsed = (now - start) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutQuad
      const eased = 1 - (1 - progress) * (1 - progress);
      setDisplay(value * eased);
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setDisplay(value);
      }
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  return (
    <span ref={ref} className="font-mono text-3xl font-bold text-accent">
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

interface MetricCardData {
  label: string;
  value: number;
  suffix: string;
  decimals: number;
  icon: React.ElementType;
  note: string;
}

const METRIC_CARDS: MetricCardData[] = [
  {
    label: "Xếp hạng tại IOI 2024 (Olympiad Tin học Quốc tế)",
    value: 49,
    suffix: "%",
    decimals: 0,
    icon: Trophy,
    note: "o1 lọt vào top 49% khi thi đúng luật thật của con người — thành tích chưa từng có với AI trước đó.",
  },
  {
    label: "Điểm kiểm tra Vật lý sau đại học (GPQA Physics)",
    value: 96.5,
    suffix: "%",
    decimals: 1,
    icon: ClipboardCheck,
    note: "Claude 3.7 Sonnet ở chế độ Extended Thinking làm bài kiểm tra vật lý mức tiến sĩ gần như hoàn hảo.",
  },
  {
    label: "Graduate-Level Google-Proof Q&A (GPQA tổng thể)",
    value: 84.8,
    suffix: "%",
    decimals: 1,
    icon: Gauge,
    note: "Bài test được thiết kế để KHÔNG tra Google ra được — Claude có chuỗi suy luận vẫn đạt rất cao.",
  },
];

function MetricCards() {
  return (
    <div className="my-4 grid gap-3 md:grid-cols-3">
      {METRIC_CARDS.map((m) => {
        const Icon = m.icon;
        return (
          <div
            key={m.label}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center gap-2 text-muted">
              <Icon size={16} className="text-accent" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                {m.label}
              </span>
            </div>
            <div className="mt-3">
              <AnimatedCounter
                value={m.value}
                suffix={m.suffix}
                decimals={m.decimals}
              />
            </div>
            <p className="mt-2 text-sm text-muted leading-relaxed">{m.note}</p>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Counterfactual — "không có reasoning model" vs "có"
// ─────────────────────────────────────────────────────────────────────────
function CounterfactualToggle() {
  return (
    <div className="my-5">
      <ToggleCompare
        labelA="Không có mô hình lý luận"
        labelB="Có o1 / Extended Thinking"
        description="Thử nghĩ: cùng một câu hỏi công việc, cùng một người hỏi — kết quả khác nhau ra sao?"
        childA={
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300">
                Trước 2024
              </span>
              <span className="text-sm text-muted">
                Bạn phải tự dạy AI cách suy nghĩ
              </span>
            </div>
            <ul className="space-y-2 text-sm text-foreground leading-relaxed">
              <li className="flex items-start gap-2 rounded-lg border border-border bg-card/50 px-3 py-2">
                <X size={14} className="mt-0.5 shrink-0 text-red-500" />
                <span>
                  Mỗi lần hỏi việc nhiều bước, bạn phải nhớ thêm câu “Hãy
                  suy nghĩ từng bước”.
                </span>
              </li>
              <li className="flex items-start gap-2 rounded-lg border border-border bg-card/50 px-3 py-2">
                <X size={14} className="mt-0.5 shrink-0 text-red-500" />
                <span>
                  Không biết AI đã nháp gì — phải tin tưởng đáp án cuối hoặc
                  không.
                </span>
              </li>
              <li className="flex items-start gap-2 rounded-lg border border-border bg-card/50 px-3 py-2">
                <X size={14} className="mt-0.5 shrink-0 text-red-500" />
                <span>
                  Với câu hỏi rất khó (toán học, pháp lý, tài chính), tỉ lệ
                  sai cao; bạn phải tự đối chiếu với Excel, với luật.
                </span>
              </li>
            </ul>
          </div>
        }
        childB={
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">
                Từ 09/2024
              </span>
              <span className="text-sm text-muted">
                AI tự nháp và cho bạn đọc nháp
              </span>
            </div>
            <ul className="space-y-2 text-sm text-foreground leading-relaxed">
              <li className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 dark:border-green-800 dark:bg-green-900/20">
                <Sparkles size={14} className="mt-0.5 shrink-0 text-green-600" />
                <span>
                  Bạn hỏi bình thường — AI tự quyết định cần nghĩ bao lâu
                  cho câu này.
                </span>
              </li>
              <li className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 dark:border-green-800 dark:bg-green-900/20">
                <Sparkles size={14} className="mt-0.5 shrink-0 text-green-600" />
                <span>
                  Claude Extended Thinking cho bạn xem từng bước nháp — soi
                  ra chỗ AI hiểu nhầm ngay.
                </span>
              </li>
              <li className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 dark:border-green-800 dark:bg-green-900/20">
                <Sparkles size={14} className="mt-0.5 shrink-0 text-green-600" />
                <span>
                  Bạn có thể đặt “thinking budget” — cho AI vài giây khi
                  hỏi nhanh, vài phút khi hỏi việc phức tạp.
                </span>
              </li>
            </ul>
          </div>
        }
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Component chính — giữ nguyên cấu trúc ApplicationLayout / các section
// ─────────────────────────────────────────────────────────────────────────
export default function ChainOfThoughtInReasoningModels() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Chain of Thought"
    >
      <ApplicationHero
        parentTitleVi="Chain of Thought"
        topicSlug="chain-of-thought-in-reasoning-models"
      >
        <p>
          Tháng 9 năm 2024, OpenAI ra mắt <strong>o1</strong> — mô hình AI
          đầu tiên được huấn luyện để &ldquo;suy nghĩ&rdquo; trước khi trả
          lời. Thay vì đưa ra câu trả lời ngay lập tức, o1 tự sinh một chuỗi
          suy luận (chain of thought — quá trình nháp từng bước) bên trong,
          tự kiểm tra lỗi và thử nhiều cách tiếp cận.
        </p>

        <HeroTimeline />

        <p>
          Tháng 2 năm 2025, Anthropic trả lời bằng{" "}
          <strong>Claude 3.7 Sonnet</strong> — mô hình lý luận lai đầu tiên,
          cho phép người dùng bật chế độ &ldquo;Extended Thinking&rdquo; (suy
          nghĩ mở rộng) để xem Claude trình bày từng bước suy luận trước khi
          đưa ra đáp án cuối cùng. Với dân văn phòng, điều này đồng nghĩa:
          bạn không cần nhớ nhắc &ldquo;hãy suy nghĩ từng bước&rdquo; ở mỗi
          prompt nữa — AI tự làm, và còn cho bạn đọc nháp.
        </p>

        <ThinkingDots />
      </ApplicationHero>

      <ApplicationProblem topicSlug="chain-of-thought-in-reasoning-models">
        <p>
          Trước 2024, các AI phổ biến như GPT-4 hay Claude thường mắc lỗi ở
          những bài cần <strong>nhiều bước suy luận</strong> — tính toán
          chồng, phân tích pháp lý, so sánh nhiều lựa chọn. Nguyên nhân gốc:
          chúng sinh câu trả lời trong một nhịp, không có chỗ &ldquo;nháp
          nội bộ&rdquo; để tự kiểm tra.
        </p>

        <p>
          Kỹ thuật{" "}
          <TopicLink slug="chain-of-thought">
            Chain-of-Thought (chuỗi suy luận từng bước)
          </TopicLink>{" "}
          đã cho thấy nếu yêu cầu AI trình bày nháp, chất lượng trả lời tăng
          rõ rệt. Nhưng gánh nặng thuộc về người dùng: lúc nào cũng phải nhớ
          thêm câu &ldquo;hãy suy nghĩ từng bước&rdquo;, và vẫn không thể
          kiểm chứng chính xác AI đã nháp gì.
        </p>

        <ProblemToggleDemo />

        <p>
          Câu hỏi then chốt mà hai phòng nghiên cứu ở Mỹ phải trả lời: liệu
          có thể huấn luyện AI{" "}
          <strong>tự động sử dụng chuỗi suy luận</strong> mà không cần người
          dùng nhắc, và{" "}
          <strong>hiển thị quá trình nháp đó</strong> để người dùng kiểm
          chứng?
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Chain of Thought"
        topicSlug="chain-of-thought-in-reasoning-models"
      >
        <li className="list-none">
          <MechanismFlow />
        </li>

        <Beat step={1}>
          <p>
            <strong>o1 tự bật chuỗi suy luận.</strong> Khác với GPT-4 cần
            người dùng viết &ldquo;hãy suy nghĩ từng bước&rdquo;, o1 được
            huấn luyện bằng reinforcement learning (học tăng cường — phương
            pháp dạy AI bằng phần thưởng) để tự sinh reasoning tokens (token
            lý luận — các bước nháp nội bộ) trước khi viết câu trả lời cuối
            cùng. Bạn chỉ cần hỏi bình thường; phần lý luận diễn ra trong
            &ldquo;đầu&rdquo; mô hình.
          </p>
          <BeatInlineIllustration step={1} />
        </Beat>
        <Beat step={2}>
          <p>
            <strong>Mô hình tự sửa lỗi trong quá trình nháp.</strong> o1 học
            cách nhận diện sai lầm, quay lại, và thử hướng khác. Khi gặp bài
            khó, nó chia thành các bước nhỏ hơn — giống một luật sư phân
            tích hồ sơ, hay một kiểm toán viên đối chiếu nhiều nguồn trước
            khi kết luận.
          </p>
          <BeatInlineIllustration step={2} />
        </Beat>
        <Beat step={3}>
          <p>
            <strong>Claude hiển thị nháp cho người dùng.</strong> Claude 3.7
            Sonnet cho phép bật/tắt chế độ Extended Thinking. Khi bật, bạn
            thấy quá trình suy luận của Claude — cách nó cân nhắc các khả
            năng, phát hiện mâu thuẫn, và đi đến kết luận. Với công việc
            văn phòng, bạn có thể chỉ cần đọc phần nháp để biết AI đã hiểu
            yêu cầu của bạn đúng chưa. Lập trình viên có thể đặt
            &ldquo;thinking budget&rdquo; (ngân sách suy nghĩ) để kiểm soát
            thời gian Claude dành cho mỗi câu hỏi.
          </p>
          <BeatInlineIllustration step={3} />
        </Beat>
        <Beat step={4}>
          <p>
            <strong>Hiệu suất tăng theo thời gian suy nghĩ.</strong> Cả hai
            mô hình cho thấy một quy luật quan trọng: càng dành nhiều tài
            nguyên tính toán cho việc suy luận (test-time compute — tài
            nguyên tính toán khi chạy mô hình), kết quả càng chính xác. Đây
            là bước ngoặt — hiệu suất không chỉ phụ thuộc vào kích thước mô
            hình mà còn vào thời gian nháp. Nói nôm na: trước kia, bạn phải
            đợi hãng ra model mới để AI giỏi hơn; bây giờ, chỉ cần cho AI
            thêm vài phút nghĩ, nó đã thông minh hơn rõ rệt.
          </p>
          <BeatInlineIllustration step={4} />
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="chain-of-thought-in-reasoning-models"
      >
        <Metric
          value="o1 đạt top 49% trong Olympiad Tin học Quốc tế (IOI) 2024 với quy tắc thi thật"
          sourceRef={1}
        />
        <Metric
          value="Claude 3.7 Sonnet đạt 96,5% trên bài kiểm tra vật lý (GPQA Physics)"
          sourceRef={3}
        />
        <Metric
          value="84,8% trên Graduate-Level Google-Proof Q&A Benchmark cho Claude Extended Thinking"
          sourceRef={3}
        />
      </ApplicationMetrics>

      {/* Hiển thị số trực quan — bổ sung phía dưới danh sách Metric có dẫn nguồn ở trên */}
      <section className="mb-10">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-tertiary">
          <Gauge size={14} className="text-accent" />
          Nhìn nhanh qua ba con số
        </div>
        <MetricCards />
        <Callout variant="info" title="Cách đọc các con số">
          Đây là các bài kiểm tra chuẩn dùng chung cho giới AI — không phải
          thang điểm văn phòng. Với công việc hàng ngày của bạn, chuỗi suy
          luận tự động này nghĩa là: ít phải nhờ đồng nghiệp kiểm lại, ít
          phải bấm máy tính sau lưng AI, và nhiều thời gian hơn để làm việc
          thật.
        </Callout>
      </section>

      <ApplicationCounterfactual
        parentTitleVi="Chain of Thought"
        topicSlug="chain-of-thought-in-reasoning-models"
      >
        <p>
          Nếu không có chuỗi suy luận tự động, AI vẫn sẽ đưa ra câu trả lời
          &ldquo;bản năng&rdquo; — nhanh nhưng thường sai ở các việc cần
          nhiều bước. Dân văn phòng sẽ phải tự viết &ldquo;hãy suy nghĩ
          từng bước&rdquo; mỗi lần, và vẫn không thể kiểm chứng quá trình
          nháp của AI. Mỗi câu trả lời phức tạp trở thành một canh bạc:
          tin hay không tin.
        </p>

        <CounterfactualToggle />

        <p>
          Các mô hình lý luận như <strong>o1</strong> và{" "}
          <strong>Claude Extended Thinking</strong> đã chứng minh: dành thêm
          vài giây đến vài phút cho AI &ldquo;nghĩ&rdquo; có thể cải thiện
          đáng kể chất lượng trả lời. Đây là bước đệm cho thế hệ công cụ AI
          văn phòng tiếp theo — nơi bạn không còn phải đoán &ldquo;liệu AI
          có đang nghiêm túc với câu hỏi của mình không&rdquo;, vì nháp
          đã nằm ngay trước mặt.
        </p>

        <p className="text-sm text-muted">
          Để nắm vững kỹ thuật nền tảng đằng sau các mô hình này, hãy quay
          về bài lý thuyết{" "}
          <TopicLink slug="chain-of-thought">
            Chuỗi suy luận từng bước
          </TopicLink>
          .
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
