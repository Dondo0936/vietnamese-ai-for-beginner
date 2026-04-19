"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useInView,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import {
  Rocket,
  Users,
  Sparkles,
  Calendar,
  Mail,
  FileSearch,
  MessageCircle,
  BookOpen,
  Clock,
  Bot,
  Zap,
  Shield,
  Globe,
  CheckCircle2,
  XCircle,
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
import { ToggleCompare, Callout } from "@/components/interactive";

export const metadata: TopicMeta = {
  slug: "llm-overview-in-chat-assistants",
  title: "LLM Overview in Chat Assistants",
  titleVi: "LLM trong trợ lý trò chuyện",
  description:
    "ChatGPT, Claude, Gemini: ba trợ lý trò chuyện AI đang thay đổi cách hàng trăm triệu người làm việc mỗi ngày.",
  category: "llm-concepts",
  tags: ["llm-overview", "chatbot", "application"],
  difficulty: "beginner",
  relatedSlugs: ["llm-overview"],
  vizType: "interactive",
  applicationOf: "llm-overview",
  featuredApp: {
    name: "ChatGPT / Claude / Gemini",
    productFeature: "General-purpose Chat Assistants",
    company: "OpenAI / Anthropic / Google",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "Sam Altman says ChatGPT has hit 800M weekly active users",
      publisher: "TechCrunch",
      url: "https://techcrunch.com/2025/10/06/sam-altman-says-chatgpt-has-hit-800m-weekly-active-users/",
      date: "2025-10",
      kind: "news",
    },
    {
      title: "ChatGPT Hits 200m Users: The Rise of OpenAI's AI Gamechanger",
      publisher: "Technology Magazine",
      url: "https://technologymagazine.com/articles/partnerships-and-updates-examining-chatgpts-usage-doubling",
      date: "2024-08",
      kind: "news",
    },
    {
      title: "Anthropic to sign the EU Code of Practice",
      publisher: "Anthropic",
      url: "https://www.anthropic.com/news/eu-code-practice",
      date: "2025-07",
      kind: "news",
    },
    {
      title: "AI Act — Shaping Europe's digital future",
      publisher: "European Commission",
      url: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai",
      date: "2024-08",
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
   COMPONENT CON — Counter đếm tăng dần khi vào tầm nhìn
   ═══════════════════════════════════════════════════════════════════════════ */

function AnimatedCounter({
  to,
  suffix = "",
  prefix = "",
  duration = 1.4,
  format,
}: {
  to: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  format?: (v: number) => string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v: number) => {
    if (format) return format(v);
    return Math.round(v).toLocaleString("vi-VN");
  });

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      count.set(to);
      return;
    }
    const controls = animate(count, to, {
      duration,
      ease: "easeOut",
    });
    return () => controls.stop();
  }, [inView, to, duration, reduce, count]);

  return (
    <span ref={ref} className="tabular-nums font-bold">
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT CON — Dòng thời gian 3 mốc (Nov 2022 → Jan 2023 → Oct 2025)
   ═══════════════════════════════════════════════════════════════════════════ */

function LaunchTimeline() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -80px 0px" });

  const milestones = [
    {
      x: 60,
      date: "30/11/2022",
      title: "ChatGPT ra mắt",
      count: "1 triệu",
      sub: "người dùng sau 5 ngày",
      color: "#10b981",
      icon: Rocket,
    },
    {
      x: 280,
      date: "Tháng 1/2023",
      title: "100 triệu người dùng",
      count: "100 triệu",
      sub: "trong 2 tháng — nhanh nhất lịch sử",
      color: "#6366f1",
      icon: Users,
    },
    {
      x: 640,
      date: "Tháng 10/2025",
      title: "Bình thường mới",
      count: "800 triệu",
      sub: "người dùng hoạt động hàng tuần",
      color: "#a855f7",
      icon: Sparkles,
    },
  ];

  // Đường cong tăng trưởng: bắt đầu 1, tăng nhẹ, bùng nổ cuối
  const curve = "M 30 260 C 180 258, 260 190, 320 140 S 520 40, 720 30";

  return (
    <div
      ref={ref}
      className="not-prose my-6 rounded-xl border border-border bg-card p-4 overflow-x-auto"
    >
      <div className="flex items-center gap-2 mb-2">
        <Calendar size={16} className="text-accent" />
        <span className="text-sm font-semibold text-foreground">
          Từ 0 đến 800 triệu người dùng trong 35 tháng
        </span>
      </div>
      <p className="text-xs text-muted mb-3">
        Đường cong đỏ phía dưới là số lượng người dùng hoạt động hàng tuần của
        ChatGPT — tăng theo đường cong dốc đứng chưa từng thấy ở bất kỳ sản
        phẩm tiêu dùng nào.
      </p>

      <div className="relative w-full min-w-[720px]">
        <svg viewBox="0 0 760 320" className="w-full h-auto">
          <defs>
            <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="growthStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>

          {/* Lưới ngang */}
          {[60, 120, 180, 240].map((y) => (
            <line
              key={y}
              x1={30}
              x2={740}
              y1={y}
              y2={y}
              stroke="currentColor"
              strokeOpacity={0.08}
              strokeDasharray="2 4"
            />
          ))}

          {/* Trục */}
          <line
            x1={30}
            x2={740}
            y1={260}
            y2={260}
            stroke="currentColor"
            strokeOpacity={0.3}
          />

          {/* Phần tô dưới đường cong */}
          <motion.path
            d={`${curve} L 720 260 L 30 260 Z`}
            fill="url(#growthFill)"
            initial={reduce ? { opacity: 0.6 } : { opacity: 0 }}
            animate={inView ? { opacity: 0.7 } : { opacity: 0 }}
            transition={{ duration: 1, delay: 0.8 }}
          />

          {/* Đường cong chính */}
          <motion.path
            d={curve}
            fill="none"
            stroke="url(#growthStroke)"
            strokeWidth={3}
            strokeLinecap="round"
            initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
            animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
            transition={{ duration: 2, ease: "easeOut" }}
          />

          {/* 3 mốc */}
          {milestones.map((m, i) => {
            const y =
              i === 0 ? 260 : i === 1 ? 160 : 40; // khớp đường cong
            return (
              <motion.g
                key={m.date}
                initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.7 }}
                animate={
                  inView
                    ? { opacity: 1, scale: 1 }
                    : { opacity: 0, scale: 0.7 }
                }
                transition={{
                  duration: 0.45,
                  delay: 0.6 + i * 0.45,
                  type: "spring",
                  stiffness: 220,
                }}
              >
                <circle cx={m.x} cy={y} r={10} fill={m.color} />
                <circle cx={m.x} cy={y} r={16} fill={m.color} fillOpacity={0.2} />
                <text
                  x={m.x}
                  y={y - 28}
                  textAnchor="middle"
                  className="fill-foreground"
                  fontSize={11}
                  fontWeight={600}
                >
                  {m.count}
                </text>
                <text
                  x={m.x}
                  y={y + 32}
                  textAnchor="middle"
                  className="fill-muted"
                  fontSize={10}
                >
                  {m.date}
                </text>
              </motion.g>
            );
          })}
        </svg>

        {/* Thẻ giải thích dưới biểu đồ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
          {milestones.map((m, i) => {
            const Icon = m.icon;
            return (
              <motion.div
                key={m.date}
                initial={reduce ? { opacity: 1 } : { opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ duration: 0.35, delay: 1.6 + i * 0.25 }}
                className="rounded-lg border border-border bg-surface p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={14} style={{ color: m.color }} />
                  <span
                    className="text-[10px] uppercase tracking-wide"
                    style={{ color: m.color }}
                  >
                    {m.date}
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {m.title}
                </p>
                <p className="text-xs text-muted mt-0.5">{m.sub}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT CON — Trước vs Sau khi có ChatGPT cho một email xin nghỉ phép
   ═══════════════════════════════════════════════════════════════════════════ */

function BeforeAfterEmail() {
  const beforeSteps = [
    { icon: Clock, text: "Mở Google, gõ 'mẫu email xin nghỉ phép'" },
    { icon: FileSearch, text: "Lướt qua 7–8 trang blog, cóp ghép vài câu" },
    { icon: Mail, text: "Sửa tên, ngày, chức danh cho phù hợp với sếp" },
    { icon: Clock, text: "Đọc lại lần ba, vẫn thấy giọng văn cứng đơ" },
    {
      icon: XCircle,
      text: "Tổng thời gian: ~25 phút cho một email dưới 100 chữ",
      negative: true,
    },
  ];

  const afterSteps = [
    { icon: Bot, text: "Mở ChatGPT, gõ: 'Soạn email xin nghỉ 3 ngày vì con ốm, gửi sếp trực tiếp, giọng lịch sự có cam kết bàn giao'" },
    { icon: Sparkles, text: "AI trả ngay bản nháp chuẩn văn phong công sở" },
    { icon: Mail, text: "Đọc lướt, chỉnh một hai chi tiết cá nhân" },
    {
      icon: CheckCircle2,
      text: "Tổng thời gian: ~3 phút. Chất lượng ổn định.",
      positive: true,
    },
  ];

  return (
    <ToggleCompare
      labelA="Trước khi có trợ lý AI"
      labelB="Sau khi có trợ lý AI"
      description="Cùng một nhiệm vụ rất đời thường: soạn email xin sếp nghỉ 3 ngày vì con nhỏ ốm."
      childA={
        <div className="space-y-2">
          {beforeSteps.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.08 }}
                className={`flex items-start gap-3 rounded-md p-2.5 ${
                  s.negative
                    ? "bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800"
                    : "bg-surface"
                }`}
              >
                <Icon
                  size={16}
                  className={`shrink-0 mt-0.5 ${
                    s.negative ? "text-rose-500" : "text-muted"
                  }`}
                />
                <span
                  className={`text-sm ${
                    s.negative
                      ? "font-semibold text-foreground"
                      : "text-foreground"
                  }`}
                >
                  {s.text}
                </span>
              </motion.div>
            );
          })}
        </div>
      }
      childB={
        <div className="space-y-2">
          {afterSteps.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.08 }}
                className={`flex items-start gap-3 rounded-md p-2.5 ${
                  s.positive
                    ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
                    : "bg-surface"
                }`}
              >
                <Icon
                  size={16}
                  className={`shrink-0 mt-0.5 ${
                    s.positive ? "text-emerald-500" : "text-accent"
                  }`}
                />
                <span
                  className={`text-sm ${
                    s.positive
                      ? "font-semibold text-foreground"
                      : "text-foreground"
                  }`}
                >
                  {s.text}
                </span>
              </motion.div>
            );
          })}
        </div>
      }
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT CON — Progress tracker cho 4 Beats của Mechanism
   ═══════════════════════════════════════════════════════════════════════════ */

function MechanismProgress({ current }: { current: number }) {
  const labels = [
    "ChatGPT mở màn",
    "Claude chú trọng an toàn",
    "Gemini ôm đa phương thức",
    "Cuộc đua không ngừng",
  ];
  return (
    <div className="not-prose mb-5 rounded-lg border border-border bg-surface/60 p-3">
      <div className="flex items-center gap-1.5 mb-2">
        {labels.map((_, i) => {
          const stepNum = i + 1;
          const isCurrent = stepNum === current;
          const isDone = stepNum < current;
          let widthClass = "w-4";
          let bgClass = "bg-surface";
          if (isCurrent) {
            widthClass = "w-10";
            bgClass = "bg-accent";
          } else if (isDone) {
            widthClass = "w-6";
            bgClass = "bg-accent/60";
          }
          return (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${widthClass} ${bgClass}`}
            />
          );
        })}
        <span className="ml-auto text-xs text-muted">
          Bước {current}/{labels.length}
        </span>
      </div>
      <p className="text-xs text-muted">
        {current}/{labels.length} · {labels[current - 1]}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT CON — SVG diagrams nhỏ cho mỗi Beat
   ═══════════════════════════════════════════════════════════════════════════ */

function ChatGPTDiagram() {
  const reduce = useReducedMotion();
  return (
    <div className="not-prose mt-3 rounded-lg border border-border bg-surface/60 p-3">
      <div className="flex items-center gap-3 text-xs">
        <div className="flex flex-col items-center gap-1">
          <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <MessageCircle size={18} className="text-emerald-600 dark:text-emerald-300" />
          </div>
          <span className="text-foreground font-medium">Người dùng</span>
        </div>

        <motion.div
          className="flex-1 relative h-1 rounded-full bg-gradient-to-r from-emerald-400 to-indigo-400"
          initial={reduce ? undefined : { scaleX: 0, transformOrigin: "left" }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "0px 0px -40px 0px" }}
          transition={{ duration: 0.7 }}
        >
          <motion.span
            className="absolute -top-1.5 left-0 text-[10px] text-muted"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7 }}
          >
            prompt
          </motion.span>
        </motion.div>

        <div className="flex flex-col items-center gap-1">
          <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <Bot size={18} className="text-indigo-600 dark:text-indigo-300" />
          </div>
          <span className="text-foreground font-medium">GPT-4</span>
        </div>

        <motion.div
          className="flex-1 relative h-1 rounded-full bg-gradient-to-r from-indigo-400 to-rose-400"
          initial={reduce ? undefined : { scaleX: 0, transformOrigin: "left" }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.25 }}
        >
          <motion.span
            className="absolute -top-1.5 left-0 text-[10px] text-muted"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.95 }}
          >
            RLHF tinh chỉnh
          </motion.span>
        </motion.div>

        <div className="flex flex-col items-center gap-1">
          <div className="h-10 w-10 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
            <Users size={18} className="text-rose-600 dark:text-rose-300" />
          </div>
          <span className="text-foreground font-medium">Người chấm</span>
        </div>
      </div>
      <p className="text-[11px] text-muted mt-2 leading-relaxed">
        RLHF (Reinforcement Learning from Human Feedback — học tăng cường từ
        phản hồi của con người): hàng ngàn người chấm điểm câu trả lời, model
        học ưu tiên câu nào được đánh giá cao.
      </p>
    </div>
  );
}

function ClaudeDiagram() {
  const reduce = useReducedMotion();
  const principles = [
    "Trung thực, không lừa gạt",
    "An toàn, tránh gây hại",
    "Tôn trọng quyền tự chủ",
  ];
  return (
    <div className="not-prose mt-3 rounded-lg border border-border bg-surface/60 p-3">
      <div className="flex items-center gap-2 mb-2">
        <Shield size={16} className="text-orange-500" />
        <span className="text-xs font-semibold text-foreground">
          Constitutional AI (AI Hiến pháp)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 mb-2">
        {principles.map((p, i) => (
          <motion.div
            key={p}
            initial={reduce ? undefined : { opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -40px 0px" }}
            transition={{ duration: 0.3, delay: i * 0.12 }}
            className="rounded-md border border-orange-300/60 bg-orange-50 dark:bg-orange-900/20 px-2 py-1.5 text-[11px] text-foreground"
          >
            <span className="text-orange-600 dark:text-orange-400 font-bold mr-1">
              {i + 1}.
            </span>
            {p}
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-[11px] text-muted">
        <BookOpen size={12} className="shrink-0" />
        <span>
          Cửa sổ ngữ cảnh Claude 2: <strong>100.000 token</strong> — đọc nổi một
          cuốn sách 300 trang trong một lượt chat.
        </span>
      </div>
    </div>
  );
}

function GeminiDiagram() {
  const reduce = useReducedMotion();
  const modalities = [
    { icon: FileSearch, label: "Văn bản" },
    { icon: Sparkles, label: "Hình ảnh" },
    { icon: Zap, label: "Mã nguồn" },
    { icon: Globe, label: "Video" },
  ];
  return (
    <div className="not-prose mt-3 rounded-lg border border-border bg-surface/60 p-3">
      <div className="flex items-center gap-2 mb-2">
        <Globe size={16} className="text-blue-500" />
        <span className="text-xs font-semibold text-foreground">
          Đa phương thức (multimodal) — nuốt nhiều loại dữ liệu cùng lúc
        </span>
      </div>

      <div className="flex items-center justify-center gap-2 mb-2">
        {modalities.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={m.label}
              initial={reduce ? undefined : { opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "0px 0px -40px 0px" }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              className="flex flex-col items-center gap-1"
            >
              <div className="h-9 w-9 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Icon size={14} className="text-blue-600 dark:text-blue-300" />
              </div>
              <span className="text-[10px] text-foreground">{m.label}</span>
            </motion.div>
          );
        })}
        <motion.div
          initial={reduce ? undefined : { opacity: 0, x: -6 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="text-muted text-xs ml-1"
        >
          →
        </motion.div>
        <motion.div
          initial={reduce ? undefined : { opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="flex flex-col items-center gap-1"
        >
          <div className="h-9 w-9 rounded-md bg-accent/20 flex items-center justify-center">
            <Bot size={14} className="text-accent" />
          </div>
          <span className="text-[10px] text-foreground font-semibold">Gemini</span>
        </motion.div>
      </div>

      <p className="text-[11px] text-muted">
        Gemini 1.5 Pro: cửa sổ ngữ cảnh <strong>1 triệu token</strong> — tương
        đương cả một tủ hồ sơ dự án hoặc một cuốn sách dài 2.000 trang đọc
        trong một lần chat.
      </p>
    </div>
  );
}

function CompetitionDiagram() {
  const reduce = useReducedMotion();
  const rows = [
    { year: "2022", chatgpt: 4, claude: 0, gemini: 0 },
    { year: "2023", chatgpt: 8, claude: 100, gemini: 32 },
    { year: "2024", chatgpt: 128, claude: 200, gemini: 1000 },
    { year: "2025", chatgpt: 256, claude: 1000, gemini: 2000 },
  ];
  const max = 2000;

  return (
    <div className="not-prose mt-3 rounded-lg border border-border bg-surface/60 p-3">
      <div className="flex items-center gap-2 mb-2">
        <Zap size={16} className="text-amber-500" />
        <span className="text-xs font-semibold text-foreground">
          Cuộc đua cửa sổ ngữ cảnh (tính bằng K token)
        </span>
      </div>

      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.year} className="flex items-center gap-2 text-[10px]">
            <span className="w-10 text-muted tabular-nums shrink-0">
              {r.year}
            </span>
            <div className="flex-1 space-y-1">
              {[
                { val: r.chatgpt, color: "bg-emerald-500", label: "ChatGPT" },
                { val: r.claude, color: "bg-orange-500", label: "Claude" },
                { val: r.gemini, color: "bg-blue-500", label: "Gemini" },
              ].map((m) => {
                const width = (m.val / max) * 100;
                return (
                  <div key={m.label} className="flex items-center gap-1.5">
                    <span className="w-14 text-tertiary shrink-0">
                      {m.label}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-background overflow-hidden">
                      <motion.div
                        className={`h-full ${m.color} rounded-full`}
                        initial={reduce ? undefined : { width: 0 }}
                        whileInView={{ width: `${width}%` }}
                        viewport={{ once: true, margin: "0px 0px -40px 0px" }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    </div>
                    <span className="w-10 text-right text-tertiary tabular-nums">
                      {m.val > 0 ? `${m.val}K` : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT CON — Metric ô đẹp với counter động
   ═══════════════════════════════════════════════════════════════════════════ */

function AnimatedMetricList() {
  const reduce = useReducedMotion();
  const metrics = [
    {
      big: <AnimatedCounter to={800} suffix=" triệu" />,
      label: "người dùng hoạt động hàng tuần của ChatGPT tính tới tháng 10/2025",
      sourceRef: 1,
      color: "from-emerald-400 to-teal-500",
      icon: Users,
    },
    {
      big: (
        <>
          <AnimatedCounter to={1} suffix=" triệu" /> trong 5 ngày
        </>
      ),
      label:
        "tốc độ cán mốc 1 triệu người dùng — nhanh gấp 15 lần Instagram, 60 lần Facebook",
      sourceRef: 2,
      color: "from-indigo-400 to-violet-500",
      icon: Rocket,
    },
    {
      big: <AnimatedCounter to={200} suffix=" triệu" />,
      label: "người dùng hoạt động hàng tuần chỉ sau 2 năm ra mắt (tháng 8/2024)",
      sourceRef: 2,
      color: "from-sky-400 to-blue-500",
      icon: Calendar,
    },
  ];

  return (
    <div className="not-prose grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
      {metrics.map((m, i) => {
        const Icon = m.icon;
        return (
          <motion.div
            key={i}
            initial={reduce ? undefined : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -40px 0px" }}
            transition={{ duration: 0.45, delay: i * 0.12 }}
            className="relative overflow-hidden rounded-xl border border-border bg-card p-4"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${m.color} opacity-10`}
            />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={14} className="text-accent" />
                <span className="text-[10px] uppercase tracking-wide text-tertiary">
                  Con số {i + 1}
                </span>
              </div>
              <div className="text-2xl text-foreground leading-tight mb-2">
                {m.big}
              </div>
              <p className="text-xs text-muted leading-relaxed">{m.label}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT CON — Thế giới văn phòng có/không có ChatGPT
   ═══════════════════════════════════════════════════════════════════════════ */

function CounterfactualWorld() {
  const tasks = [
    {
      icon: Mail,
      task: "Soạn 10 email phản hồi khách hàng trong 1 buổi sáng",
      without: "≈ 2h30' nếu viết tay từng email một",
      with: "≈ 25' — viết 1 prompt, AI gợi 10 bản nháp, chỉnh lại",
    },
    {
      icon: FileSearch,
      task: "Tóm tắt báo cáo 40 trang để làm slide họp chiều nay",
      without: "Phải đọc kỹ 2 tiếng, vẫn sót ý chính",
      with: "Dán vào Claude, 5 phút có mục lục và 5 điểm cốt lõi",
    },
    {
      icon: BookOpen,
      task: "Làm rõ một điều luật lao động bằng tiếng Việt dễ hiểu",
      without: "Vào thuvienphapluat.vn, lọc, tra chéo, đọc bình luận",
      with: "Hỏi Gemini, có trích dẫn nguồn — vẫn phải đối chiếu lại",
    },
    {
      icon: MessageCircle,
      task: "Viết caption tiếng Anh cho bài đăng LinkedIn",
      without: "Tra Google Translate, câu cú cứng như robot",
      with: "ChatGPT đưa 3 phiên bản giọng khác nhau, chọn ngay",
    },
  ];

  return (
    <ToggleCompare
      labelA="Thế giới KHÔNG có trợ lý AI"
      labelB="Thế giới VỚI trợ lý AI"
      description="Bốn việc văn phòng quen thuộc. Kéo qua lại để thấy khác biệt rõ nhất."
      childA={
        <div className="space-y-2">
          {tasks.map((t, i) => {
            const Icon = t.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.08 }}
                className="flex items-start gap-3 rounded-md border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-2.5"
              >
                <Icon size={16} className="text-rose-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{t.task}</p>
                  <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                    {t.without}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      }
      childB={
        <div className="space-y-2">
          {tasks.map((t, i) => {
            const Icon = t.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.08 }}
                className="flex items-start gap-3 rounded-md border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-2.5"
              >
                <Icon size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{t.task}</p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                    {t.with}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      }
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TRANG CHÍNH
   ═══════════════════════════════════════════════════════════════════════════ */

export default function LlmOverviewInChatAssistants() {
  return (
    <ApplicationLayout metadata={metadata} parentTitleVi="LLM">
      {/* ══════ HERO ══════ */}
      <ApplicationHero
        parentTitleVi="LLM"
        topicSlug="llm-overview-in-chat-assistants"
      >
        <p>
          Ngày <strong>30 tháng 11 năm 2022</strong>, OpenAI mở cửa ChatGPT —
          một trợ lý trò chuyện chạy trên LLM (mô hình ngôn ngữ lớn). Chỉ năm
          ngày sau, ChatGPT có 1 triệu người dùng. Hai tháng sau, 100 triệu.
          Đó là tốc độ tăng trưởng chưa từng xuất hiện ở bất cứ ứng dụng tiêu
          dùng nào, kể cả Instagram hay TikTok.
        </p>
        <p>
          Sau ChatGPT, Anthropic ra mắt <strong>Claude</strong>, Google ra mắt{" "}
          <strong>Gemini</strong>. Ba trợ lý này — mỗi cái dựng trên một LLM
          riêng — đã trở thành công cụ công việc hàng ngày của hàng trăm triệu
          người, từ nhân viên văn phòng ở Hà Nội đến luật sư ở New York.
        </p>

        <LaunchTimeline />

        <div className="not-prose my-4">
          <Callout variant="insight" title="Vì sao bài ứng dụng này đáng đọc?">
            Nếu bạn làm văn phòng ở Việt Nam năm 2026, có xác suất rất cao đồng
            nghiệp hoặc sếp của bạn đã dùng một trong ba trợ lý này. Hiểu ba sản
            phẩm đó khác nhau thế nào sẽ giúp bạn chọn đúng công cụ cho đúng
            việc — và không bị tụt lại.
          </Callout>
        </div>
      </ApplicationHero>

      {/* ══════ PROBLEM ══════ */}
      <ApplicationProblem topicSlug="llm-overview-in-chat-assistants">
        <p>
          Trước năm 2022, LLM đã tồn tại trong phòng thí nghiệm nhiều năm —
          nhưng chỉ các kỹ sư biết cách gọi API, viết code Python, xử lý chuỗi
          token. Người làm văn phòng không có cửa tiếp cận, dù đây là công cụ
          có thể tiết kiệm hàng giờ mỗi ngày.
        </p>
        <p>
          Công việc văn phòng thường ngày — soạn email, tóm tắt báo cáo, dịch
          tài liệu, viết caption — phần lớn là xoay chữ: đọc, rút ý, viết lại.
          Chính là nơi LLM mạnh nhất. Nhưng không có giao diện nào đủ đơn giản
          cho người không biết lập trình.
        </p>
        <p>
          <strong>Bài toán</strong>: làm sao biến một cỗ máy toán học khổng lồ
          thành một khung chat giống Messenger — nơi bạn gõ câu hỏi tiếng Việt
          và nhận câu trả lời tiếng Việt, không cần biết gì về AI?
        </p>

        <div className="not-prose my-4">
          <BeforeAfterEmail />
        </div>
      </ApplicationProblem>

      {/* ══════ MECHANISM ══════ */}
      <ApplicationMechanism
        parentTitleVi="LLM"
        topicSlug="llm-overview-in-chat-assistants"
      >
        <Beat step={1}>
          <MechanismProgress current={1} />
          <p>
            <strong>ChatGPT mở đầu kỷ nguyên trò chuyện với AI.</strong> OpenAI
            lấy GPT-3.5 (sau này là GPT-4), thêm một bước tinh chỉnh gọi là{" "}
            <strong>RLHF</strong> (Reinforcement Learning from Human Feedback —
            học tăng cường từ phản hồi của con người). Hàng ngàn người chấm
            điểm câu trả lời; model dần biết trả lời nào được ưa, trả lời nào
            bị chê. Kết quả: giọng chat tự nhiên, ít từ chối hơn, ít nói vô
            nghĩa hơn.
          </p>
          <ChatGPTDiagram />
        </Beat>

        <Beat step={2}>
          <MechanismProgress current={2} />
          <p>
            <strong>Claude đặt an toàn và ngữ cảnh dài lên hàng đầu.</strong>{" "}
            Anthropic áp dụng <strong>Constitutional AI</strong> (AI Hiến pháp)
            — dạy model tuân theo một bộ nguyên tắc đạo đức thay vì chỉ học
            từng trường hợp. Claude 2 ra mắt với cửa sổ ngữ cảnh 100.000 token,
            cao gấp 25 lần ChatGPT thời đó — đọc nổi một cuốn sách 300 trang
            trong một lượt chat.
          </p>
          <ClaudeDiagram />
        </Beat>

        <Beat step={3}>
          <MechanismProgress current={3} />
          <p>
            <strong>Gemini ôm trọn đa phương thức.</strong> Google dựng Gemini
            để đọc đồng thời văn bản, hình ảnh, mã nguồn, thậm chí video —
            không phải ba model riêng mà là một. Gemini 1.5 Pro đẩy cửa sổ ngữ
            cảnh lên <strong>1 triệu token</strong>, đủ chứa cả một tủ hồ sơ
            dự án 2.000 trang vào một cuộc trò chuyện.
          </p>
          <GeminiDiagram />
        </Beat>

        <Beat step={4}>
          <MechanismProgress current={4} />
          <p>
            <strong>Cạnh tranh đẩy nhau chạy không nghỉ.</strong> ChatGPT thêm
            plugin và tìm kiếm web. Claude mở rộng ngữ cảnh lên 1 triệu token,
            rồi đi trước với Agent viết code. Gemini cắm sâu vào Google
            Workspace — Docs, Gmail, Meet. Cuộc đua diễn ra mỗi quý, người
            dùng là bên được lợi nhiều nhất: tính năng mới, giá giảm, tốc độ
            tăng.
          </p>
          <CompetitionDiagram />
        </Beat>
      </ApplicationMechanism>

      {/* ══════ METRICS ══════ */}
      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="llm-overview-in-chat-assistants"
      >
        {/* Metric component chỉ để layout chính thống trích nguồn dưới cùng */}
        <Metric
          value="800 triệu người dùng hoạt động hàng tuần cho ChatGPT (tháng 10/2025)"
          sourceRef={1}
        />
        <Metric
          value="1 triệu người dùng trong 5 ngày đầu tiên — nhanh gấp 15 lần Instagram"
          sourceRef={2}
        />
        <Metric
          value="200 triệu người dùng hoạt động hàng tuần chỉ sau 2 năm ra mắt"
          sourceRef={2}
        />
      </ApplicationMetrics>

      {/* Ô số đẹp có counter bấm chạy - render ngay sau danh sách metric chính thống */}
      <section className="-mt-6 mb-10">
        <AnimatedMetricList />
        <AnimatePresence>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -40px 0px" }}
            transition={{ duration: 0.4 }}
            className="text-xs text-muted italic"
          >
            Để dễ hình dung: 800 triệu người dùng nhiều hơn dân số toàn Liên
            Minh Châu Âu cộng với dân số Nhật Bản. Và đó mới chỉ là ChatGPT —
            chưa tính Claude và Gemini.
          </motion.p>
        </AnimatePresence>
      </section>

      {/* ══════ COUNTERFACTUAL ══════ */}
      <ApplicationCounterfactual
        parentTitleVi="LLM"
        topicSlug="llm-overview-in-chat-assistants"
      >
        <p>
          Nếu không có LLM, cái gọi là &ldquo;trợ lý AI&rdquo; sẽ dừng ở mức
          chatbot theo kịch bản (rule-based) — chỉ trả lời được những câu đã
          được lập trình trước. Không viết được email lịch sự mới, không tóm
          tắt được báo cáo chưa từng đọc, không suy luận được về vấn đề mới.
        </p>

        <div className="not-prose my-4">
          <CounterfactualWorld />
        </div>

        <p>
          Sự bùng nổ của ChatGPT, Claude, Gemini cho thấy một điều cụ thể: LLM
          đã biến trợ lý AI từ một tiện ích hẹp thành một nền tảng phổ dụng.
          Tất cả nhờ một cơ chế cốt lõi — đoán chữ tiếp theo — được phóng to
          lên đến mức biết viết, biết dịch, biết tóm tắt ở chất lượng gần
          người. Biết thêm chút về nền tảng đó (ở bài lý thuyết LLM) sẽ giúp
          bạn dùng ba trợ lý này sắc bén hơn đồng nghiệp mình rất nhiều.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
