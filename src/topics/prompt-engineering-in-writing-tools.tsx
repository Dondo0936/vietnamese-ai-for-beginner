"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  FileText,
  Command,
  Layers,
  Network,
  Calendar as CalendarIcon,
  TrendingUp,
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
  ToggleCompare,
  ProgressSteps,
  Callout,
} from "@/components/interactive";

export const metadata: TopicMeta = {
  slug: "prompt-engineering-in-writing-tools",
  title: "Prompt Engineering in Writing Tools",
  titleVi: "Prompt Engineering trong Công cụ Viết",
  description:
    "Jasper AI và Notion AI biến prompt engineering thành trải nghiệm “nhấn một nút” cho hàng triệu người dùng văn phòng.",
  category: "llm-concepts",
  tags: ["prompt-engineering", "writing", "application"],
  difficulty: "beginner",
  relatedSlugs: ["prompt-engineering"],
  vizType: "interactive",
  applicationOf: "prompt-engineering",
  featuredApp: {
    name: "Jasper / Notion AI",
    productFeature: "AI-powered Writing Assistants",
    company: "Jasper AI / Notion Labs",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "AI content platform Jasper raises $125M at a $1.5B valuation",
      publisher: "TechCrunch",
      url: "https://techcrunch.com/2022/10/18/ai-content-platform-jasper-raises-125m-at-a-1-7b-valuation/",
      date: "2022-10",
      kind: "news",
    },
    {
      title:
        "Jasper Announces $125M Series A Funding Round, Bringing Total Valuation to $1.5B",
      publisher: "Jasper Blog",
      url: "https://www.jasper.ai/blog/jasper-announces-125m-series-a-funding",
      date: "2022-10",
      kind: "news",
    },
    {
      title:
        "Generative AI Assistant Notion AI Launched by Productivity App Notion",
      publisher: "Voicebot.ai",
      url: "https://voicebot.ai/2023/02/22/generative-ai-assistant-notion-ai-launched-by-productivity-app-notion/",
      date: "2023-02",
      kind: "news",
    },
    {
      title: "Explore Notion AI: Augment Your Writing & Creativity Now",
      publisher: "Notion",
      url: "https://www.notion.com/blog/notion-ai-is-here-for-everyone",
      date: "2023-02",
      kind: "news",
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

// ═══════════════════════════════════════════════════════════════════════════
// TIMELINE SVG — 3 mốc Oct 2022 → Feb 2023 → 2M signups
// ═══════════════════════════════════════════════════════════════════════════
function FundingTimeline() {
  const events = [
    {
      date: "10/2022",
      title: "Jasper gọi vốn 125 triệu USD",
      subtitle: "Định giá 1,5 tỷ USD",
      x: 80,
      color: "#D97706",
    },
    {
      date: "2/2023",
      title: "Notion AI ra mắt",
      subtitle: "Tích hợp ngay trong Notion",
      x: 300,
      color: "#2563EB",
    },
    {
      date: "2/2023+",
      title: "2 triệu đăng ký chờ",
      subtitle: "Gấp 10 lần dự đoán",
      x: 520,
      color: "#7C3AED",
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5 my-5">
      <div className="flex items-center gap-2 mb-3">
        <CalendarIcon size={14} className="text-accent" />
        <span className="text-xs font-semibold uppercase tracking-wide text-accent">
          Dòng thời gian — mùa bùng nổ AI viết
        </span>
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox="0 0 620 180"
          className="w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* đường nền */}
          <motion.line
            x1={40}
            y1={90}
            x2={580}
            y2={90}
            stroke="currentColor"
            strokeOpacity={0.2}
            strokeWidth={2}
            strokeDasharray="4 4"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />

          {events.map((ev, i) => (
            <g key={i}>
              {/* vòng tròn mốc */}
              <motion.circle
                cx={ev.x}
                cy={90}
                r={14}
                fill={ev.color}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: 0.3 + i * 0.2, duration: 0.4 }}
              />
              <motion.circle
                cx={ev.x}
                cy={90}
                r={22}
                fill={ev.color}
                fillOpacity={0.15}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: 0.4 + i * 0.2, duration: 0.5 }}
              />

              {/* ngày tháng ở trên */}
              <motion.text
                x={ev.x}
                y={55}
                textAnchor="middle"
                className="fill-foreground"
                style={{ fontSize: 11, fontWeight: 600 }}
                initial={{ opacity: 0, y: -5 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: 0.6 + i * 0.2 }}
              >
                {ev.date}
              </motion.text>

              {/* title */}
              <motion.text
                x={ev.x}
                y={130}
                textAnchor="middle"
                className="fill-foreground"
                style={{ fontSize: 12, fontWeight: 700 }}
                initial={{ opacity: 0, y: 5 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: 0.7 + i * 0.2 }}
              >
                {ev.title}
              </motion.text>

              {/* subtitle */}
              <motion.text
                x={ev.x}
                y={150}
                textAnchor="middle"
                className="fill-muted"
                style={{ fontSize: 10.5 }}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: 0.8 + i * 0.2 }}
              >
                {ev.subtitle}
              </motion.text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATED COUNTER (cho Metrics section)
// ═══════════════════════════════════════════════════════════════════════════
function AnimatedCounter({
  target,
  suffix = "",
  prefix = "",
  decimals = 0,
  duration = 1.4,
}: {
  target: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min(1, (ts - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setValue(target * eased);
      if (progress < 1) requestAnimationFrame(step);
    };
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration]);

  const formatted =
    decimals > 0
      ? value.toFixed(decimals)
      : Math.round(value).toLocaleString("vi-VN");

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SỐ LIỆU ĐỘNG — 4 thẻ metrics
// ═══════════════════════════════════════════════════════════════════════════
function MetricsGrid() {
  const tiles = [
    {
      label: "Định giá Jasper",
      value: <AnimatedCounter target={1.5} decimals={1} suffix=" tỷ USD" />,
      caption: "Sau vòng Series A 10/2022",
      color: "#D97706",
    },
    {
      label: "Khách hàng Jasper",
      value: <AnimatedCounter target={70000} />,
      caption: "Doanh nghiệp trả phí cuối 2022",
      color: "#059669",
    },
    {
      label: "Đăng ký chờ Notion AI",
      value: <AnimatedCounter target={2000000} />,
      caption: "Gấp 10 lần dự đoán của Notion",
      color: "#2563EB",
    },
    {
      label: "Doanh thu Jasper 2021",
      value: <AnimatedCounter target={45} suffix=" triệu USD" />,
      caption: "Dự kiến gấp đôi năm 2022",
      color: "#7C3AED",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 my-4">
      {tiles.map((t, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.3, delay: i * 0.08 }}
          className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2"
          style={{ borderLeft: `3px solid ${t.color}` }}
        >
          <div className="flex items-center gap-2">
            <TrendingUp size={12} style={{ color: t.color }} />
            <span
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: t.color }}
            >
              {t.label}
            </span>
          </div>
          <div
            className="text-2xl font-bold tabular-nums"
            style={{ color: t.color }}
          >
            {t.value}
          </div>
          <div className="text-xs text-muted">{t.caption}</div>
        </motion.div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MINI-VISUAL 1: Thư viện template (Jasper) — card grid
// ═══════════════════════════════════════════════════════════════════════════
function TemplateLibraryVisual() {
  const templates = [
    { label: "Bài blog", icon: "BLG" },
    { label: "Quảng cáo FB", icon: "FB" },
    { label: "Mô tả Amazon", icon: "AMZ" },
    { label: "Caption IG", icon: "IG" },
    { label: "Email bán hàng", icon: "@" },
    { label: "Tiêu đề YouTube", icon: "YT" },
  ];

  return (
    <div className="rounded-xl border border-border bg-surface p-4 my-3">
      <div className="flex items-center gap-2 mb-3">
        <FileText size={14} className="text-amber-600 dark:text-amber-400" />
        <span className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
          Thư viện &gt;50 template Jasper
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {templates.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-20px" }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
            className="rounded-lg border border-border bg-card p-2 flex items-center gap-2"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900/40 text-[10px] font-bold text-amber-700 dark:text-amber-300">
              {t.icon}
            </span>
            <span className="text-[11px] text-foreground leading-tight">
              {t.label}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MINI-VISUAL 2: Notion /ai UI mock
// ═══════════════════════════════════════════════════════════════════════════
function NotionSlashMock() {
  const actions = [
    "Viết nháp đoạn văn",
    "Cải thiện văn bản",
    "Sửa lỗi chính tả",
    "Tóm tắt nội dung",
    "Dịch sang tiếng Anh",
    "Đổi giọng sang trang trọng",
  ];

  return (
    <div className="rounded-xl border border-border bg-surface p-4 my-3">
      <div className="flex items-center gap-2 mb-3">
        <Command size={14} className="text-blue-600 dark:text-blue-400" />
        <span className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
          Giao diện Notion — gõ <code className="font-mono">/ai</code>
        </span>
      </div>
      <div className="rounded-lg border border-blue-300 dark:border-blue-700 bg-card p-3 space-y-2">
        <div className="flex items-center gap-2 rounded-md bg-blue-50 dark:bg-blue-900/30 px-2 py-1.5 border border-blue-200 dark:border-blue-800">
          <span className="text-[10px] font-mono text-blue-700 dark:text-blue-300">
            /ai
          </span>
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="h-4 w-0.5 bg-blue-600 dark:bg-blue-400"
          />
        </div>
        <div className="space-y-1 pt-1">
          {actions.map((a, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
              className="flex items-center gap-2 px-2 py-1 rounded text-xs text-foreground hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              {a}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MINI-VISUAL 3: Hidden system prompt diagram
// ═══════════════════════════════════════════════════════════════════════════
function HiddenSystemPromptDiagram() {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 my-3 space-y-3">
      <div className="flex items-center gap-2">
        <Layers size={14} className="text-purple-600 dark:text-purple-400" />
        <span className="text-xs font-semibold uppercase tracking-wide text-purple-700 dark:text-purple-300">
          3 lớp prompt chồng lên nhau
        </span>
      </div>

      {/* User click */}
      <div className="rounded-lg border-2 border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20 p-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-green-700 dark:text-green-300 mb-1">
          Lớp 1 · Người dùng bấm nút
        </div>
        <div className="text-xs text-foreground italic">
          &ldquo;Viết email chuyên nghiệp&rdquo;
        </div>
      </div>

      {/* Down arrow */}
      <div className="flex justify-center">
        <motion.svg
          width="16"
          height="22"
          viewBox="0 0 16 22"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <path
            d="M 8 0 L 8 18 M 2 12 L 8 18 L 14 12"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted"
          />
        </motion.svg>
      </div>

      {/* System prompt */}
      <div className="rounded-lg border-2 border-purple-400 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/20 p-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-300 mb-1">
          Lớp 2 · System prompt ẩn (Jasper/Notion tự thêm)
        </div>
        <div className="text-xs text-foreground leading-relaxed space-y-0.5">
          <div>
            <span className="text-purple-600">+</span> Vai trò: trợ lý viết
            chuyên nghiệp
          </div>
          <div>
            <span className="text-purple-600">+</span> Giọng: trang trọng, rõ
            ràng, không nói dài
          </div>
          <div>
            <span className="text-purple-600">+</span> Cấu trúc: mở thư – thân
            thư – kết thư
          </div>
          <div>
            <span className="text-purple-600">+</span> Ràng buộc: tránh sáo
            ngữ, không bịa số liệu
          </div>
        </div>
      </div>

      {/* Down arrow */}
      <div className="flex justify-center">
        <motion.svg
          width="16"
          height="22"
          viewBox="0 0 16 22"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <path
            d="M 8 0 L 8 18 M 2 12 L 8 18 L 14 12"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted"
          />
        </motion.svg>
      </div>

      {/* LLM */}
      <div className="rounded-lg border-2 border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20 p-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300 mb-1">
          Lớp 3 · Mô hình AI nhận cả hai lớp trên
        </div>
        <div className="text-xs text-foreground italic">
          Trả ra email chuyên nghiệp, đúng giọng, đúng cấu trúc — chỉ sau một
          cú click.
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MINI-VISUAL 4: Multi-model routing
// ═══════════════════════════════════════════════════════════════════════════
function MultiModelRoutingDiagram() {
  const routes = [
    {
      task: "Viết dài, phân tích tài liệu",
      model: "Claude (Anthropic)",
      color: "#D97706",
    },
    {
      task: "Tóm tắt, brainstorm",
      model: "GPT-4 (OpenAI)",
      color: "#059669",
    },
    {
      task: "Sửa chính tả, dịch",
      model: "Model nhẹ (chi phí thấp)",
      color: "#2563EB",
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-surface p-4 my-3">
      <div className="flex items-center gap-2 mb-3">
        <Network size={14} className="text-pink-600 dark:text-pink-400" />
        <span className="text-xs font-semibold uppercase tracking-wide text-pink-700 dark:text-pink-300">
          Notion AI định tuyến nhiều mô hình
        </span>
      </div>

      <div className="flex items-stretch gap-3">
        {/* nguồn */}
        <div className="flex flex-col justify-center">
          <div className="rounded-lg bg-pink-100 dark:bg-pink-900/30 px-3 py-2 text-xs font-semibold text-pink-700 dark:text-pink-300 whitespace-nowrap">
            Yêu cầu của bạn
          </div>
        </div>

        {/* mũi tên chia nhánh */}
        <svg viewBox="0 0 60 120" className="w-8 shrink-0">
          <motion.path
            d="M 0 60 C 20 60, 30 20, 58 20"
            stroke="currentColor"
            strokeOpacity={0.5}
            strokeWidth={1.5}
            fill="none"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          />
          <motion.path
            d="M 0 60 L 58 60"
            stroke="currentColor"
            strokeOpacity={0.5}
            strokeWidth={1.5}
            fill="none"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          />
          <motion.path
            d="M 0 60 C 20 60, 30 100, 58 100"
            stroke="currentColor"
            strokeOpacity={0.5}
            strokeWidth={1.5}
            fill="none"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />
        </svg>

        {/* 3 đích */}
        <div className="flex-1 flex flex-col gap-2">
          {routes.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 6 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{ duration: 0.25, delay: 0.4 + i * 0.1 }}
              className="rounded-lg border border-border bg-card p-2"
              style={{ borderLeft: `3px solid ${r.color}` }}
            >
              <div
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: r.color }}
              >
                {r.task}
              </div>
              <div className="text-xs text-foreground mt-0.5">{r.model}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PROBLEM — ToggleCompare trang trắng vs template sẵn
// ═══════════════════════════════════════════════════════════════════════════
function BlankVsTemplate() {
  return (
    <ToggleCompare
      labelA="Prompt trắng"
      labelB="Template sẵn"
      description="Cùng nhiệm vụ “viết mô tả sản phẩm” — khác biệt nằm ở chỗ có khung dẫn dắt hay không."
      childA={
        <div className="rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-4 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
            Màn hình ChatGPT trống
          </div>
          <div className="rounded border border-dashed border-red-300 dark:border-red-700 bg-card p-4 text-center">
            <span className="text-xs text-muted italic">
              &ldquo;Viết gì đó cho sản phẩm…&rdquo;
            </span>
          </div>
          <ul className="text-xs text-foreground space-y-1 pl-4 list-disc marker:text-red-500">
            <li>Không biết bắt đầu từ đâu</li>
            <li>Phải tự nghĩ ra vai trò, giọng văn, độ dài</li>
            <li>Viết 3-4 lần mới ra bản khá</li>
            <li>Mất 15-20 phút cho mỗi mô tả</li>
          </ul>
        </div>
      }
      childB={
        <div className="rounded-lg border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 p-4 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-300">
            Template Jasper — &ldquo;Mô tả sản phẩm Amazon&rdquo;
          </div>
          <div className="space-y-1.5 rounded border border-green-300 dark:border-green-700 bg-card p-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-20 text-muted">Tên sản phẩm:</span>
              <span className="flex-1 font-medium text-foreground">
                Máy lọc nước RO Karofi K9
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-20 text-muted">Đối tượng:</span>
              <span className="flex-1 font-medium text-foreground">
                Gia đình 4 người
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-20 text-muted">Tính năng:</span>
              <span className="flex-1 font-medium text-foreground">
                9 cấp lọc, nước nóng-lạnh
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-20 text-muted">Giọng văn:</span>
              <span className="flex-1 font-medium text-foreground">
                Thân thiện, hướng lợi ích
              </span>
            </div>
          </div>
          <ul className="text-xs text-foreground space-y-1 pl-4 list-disc marker:text-green-500">
            <li>Điền 4 ô, bấm Generate</li>
            <li>Mỗi mô tả ra sau 10-15 giây</li>
            <li>Không cần biết cấu trúc prompt</li>
            <li>Ra 5 bản nháp trong 2 phút</li>
          </ul>
        </div>
      }
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COUNTERFACTUAL — ToggleCompare trước/sau khi có template prompt
// ═══════════════════════════════════════════════════════════════════════════
function BeforeAfterTemplates() {
  return (
    <ToggleCompare
      labelA="Trước khi có template"
      labelB="Sau khi có template"
      description="Cùng một người viết content freelance — một ngày làm việc thay đổi thế nào sau khi Jasper và Notion AI ra đời."
      childA={
        <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
            Một ngày của Linh, content freelance 2020
          </div>
          <ul className="text-xs text-foreground space-y-2 pl-4 list-disc marker:text-amber-500">
            <li>
              <strong>9h</strong> — Thử 5 cách viết prompt cho bài blog, mỗi
              lần ChatGPT trả ra giọng khác nhau
            </li>
            <li>
              <strong>11h</strong> — Ngồi xoá đi viết lại vì không biết mô tả
              đối tượng đọc ra sao
            </li>
            <li>
              <strong>14h</strong> — Tự chép công thức prompt từ Reddit để
              viết caption Facebook
            </li>
            <li>
              <strong>17h</strong> — Chỉ ra được 2 bài đạt chuẩn khách hàng
            </li>
          </ul>
          <div className="rounded border border-amber-300 dark:border-amber-700 bg-card px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
            <strong>Kết:</strong> Kiến thức prompt là của người đi học kỹ; dân
            văn phòng bình thường chịu thua.
          </div>
        </div>
      }
      childB={
        <div className="rounded-lg border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 p-4 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-300">
            Cũng Linh, sau khi Jasper và Notion AI ra đời
          </div>
          <ul className="text-xs text-foreground space-y-2 pl-4 list-disc marker:text-green-500">
            <li>
              <strong>9h</strong> — Chọn template &ldquo;Blog Post
              Outline&rdquo;, điền 3 ô, ra dàn bài sau 30 giây
            </li>
            <li>
              <strong>10h</strong> — Trong Notion, gõ <code>/ai</code> để
              đổi giọng văn trang trọng
            </li>
            <li>
              <strong>12h</strong> — Template &ldquo;Facebook Ad&rdquo; ra 5
              caption khác nhau trong 2 phút
            </li>
            <li>
              <strong>14h</strong> — Đã bàn giao 6 bài đạt chuẩn, còn thời
              gian uống cà phê
            </li>
          </ul>
          <div className="rounded border border-green-300 dark:border-green-700 bg-card px-3 py-2 text-xs text-green-800 dark:text-green-200">
            <strong>Kết:</strong> Prompt engineering được &ldquo;đóng
            gói&rdquo; vào nút bấm — bất kỳ ai cũng dùng được.
          </div>
        </div>
      }
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT CHÍNH
// ═══════════════════════════════════════════════════════════════════════════
export default function PromptEngineeringInWritingTools() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Prompt Engineering"
    >
      {/* ━━━ HERO ━━━ */}
      <ApplicationHero
        parentTitleVi="Prompt Engineering"
        topicSlug="prompt-engineering-in-writing-tools"
      >
        <p>
          Tháng 10 năm 2022, Jasper AI &mdash; một nền tảng viết nội dung bằng
          AI &mdash; gọi vốn 125 triệu đô-la Mỹ với định giá 1,5 tỷ đô-la Mỹ.
          Bí quyết của họ? Biến prompt engineering (kỹ thuật viết câu lệnh cho
          AI) thành sản phẩm dễ xài cho hơn 70.000 khách hàng doanh nghiệp.
        </p>
        <p>
          Chỉ vài tháng sau, Notion &mdash; ứng dụng quản lý công việc quen
          thuộc với dân văn phòng &mdash; ra mắt Notion AI, đưa sức mạnh viết
          bằng AI ngay vào trang note hàng ngày. Hơn 2 triệu người đăng ký
          danh sách chờ trong vài tuần, <strong>gấp 10 lần</strong> dự đoán
          của chính Notion.
        </p>

        <FundingTimeline />

        <p>
          Cùng &ldquo;sóng&rdquo; ChatGPT, hai công ty này chứng minh một
          điều: kiến thức prompt engineering càng được đóng gói gọn gàng, càng
          có nhiều người trả tiền để dùng.
        </p>
      </ApplicationHero>

      {/* ━━━ PROBLEM ━━━ */}
      <ApplicationProblem topicSlug="prompt-engineering-in-writing-tools">
        <p>
          Prompt engineering là kỹ thuật thiết kế câu lệnh đầu vào (prompt)
          để mô hình AI cho ra kết quả chính xác và đúng ý nhất. Vấn đề?{" "}
          <strong>Phần lớn người dùng không biết viết prompt</strong>. Một câu
          mơ hồ như &ldquo;viết bài quảng cáo&rdquo; cho kết quả chung chung,
          trong khi prompt có khung rõ ràng &mdash; đối tượng, giọng văn, độ
          dài, mục tiêu &mdash; cho ra nội dung chuyên nghiệp ngay lập tức.
        </p>

        <BlankVsTemplate />

        <p>
          Thách thức kinh doanh của Jasper và Notion là:{" "}
          <strong>
            làm sao biến kiến thức prompt phức tạp thành giao diện đơn giản
            mà bất kỳ ai cũng dùng hiệu quả?
          </strong>{" "}
          Trang trắng đáng sợ; ô điền sẵn thân thiện.
        </p>
      </ApplicationProblem>

      {/* ━━━ MECHANISM — 4 Beats với ProgressSteps + mini-visuals ━━━ */}
      <ApplicationMechanism
        parentTitleVi="Prompt Engineering"
        topicSlug="prompt-engineering-in-writing-tools"
      >
        <div className="mb-5">
          <ProgressSteps
            current={1}
            total={4}
            labels={[
              "1 · Template Jasper",
              "2 · Slash /ai Notion",
              "3 · System prompt ẩn",
              "4 · Định tuyến mô hình",
            ]}
          />
        </div>

        <Beat step={1}>
          <p>
            <strong>Jasper xây dựng thư viện &gt;50 template prompt.</strong>{" "}
            Thay vì bắt người dùng tự nghĩ ra cấu trúc prompt, Jasper tạo
            sẵn các khung mẫu cho từng tình huống: bài blog, quảng cáo
            Facebook, mô tả sản phẩm Amazon, email bán hàng, caption
            Instagram… Mỗi template là một prompt đã được đội ngũ Jasper
            tối ưu hóa &mdash; người dùng chỉ điền vài ô trắng là xong.
          </p>
          <TemplateLibraryVisual />
        </Beat>

        <Beat step={2}>
          <p>
            <strong>Notion AI tích hợp ngay trong không gian làm việc.</strong>{" "}
            Notion AI cho phép gọi trợ lý bằng cách gõ <code>/ai</code> trên
            dòng trống, hoặc nhấn phím cách ngay trong đoạn văn. Hệ thống
            hiện ra menu các tác vụ phổ biến: viết nháp, cải thiện văn bản,
            sửa lỗi chính tả, đổi giọng văn, tóm tắt, dịch, động não
            (brainstorm). Không cần rời Notion, không cần copy paste.
          </p>
          <NotionSlashMock />
        </Beat>

        <Beat step={3}>
          <p>
            <strong>System prompt ẩn đứng sau mỗi nút bấm.</strong> Cả
            Jasper và Notion AI đều dùng system prompt (câu lệnh ẩn chạy
            ngầm) để kiểm soát chất lượng đầu ra. Khi bạn bấm &ldquo;viết
            email chuyên nghiệp&rdquo;, phía sau hậu trường hệ thống tự
            thêm các ràng buộc về vai trò, cấu trúc, giọng văn, rồi mới gửi
            gói prompt đầy đủ đó đến mô hình AI. Người dùng chỉ thấy kết
            quả cuối &mdash; sạch, đúng chuẩn.
          </p>
          <HiddenSystemPromptDiagram />
        </Beat>

        <Beat step={4}>
          <p>
            <strong>Định tuyến nhiều mô hình, tối ưu chi phí và chất lượng.</strong>{" "}
            Jasper và Notion không dùng một mô hình duy nhất. Mỗi loại yêu
            cầu được định tuyến sang mô hình phù hợp: Claude (Anthropic)
            cho phân tích tài liệu dài; GPT-4 (OpenAI) cho brainstorm và
            tóm tắt; model nhẹ hơn cho sửa chính tả và dịch. Dữ liệu từ
            hàng triệu lượt sử dụng giúp họ liên tục cải thiện template
            prompt và ngưỡng định tuyến.
          </p>
          <MultiModelRoutingDiagram />
        </Beat>
      </ApplicationMechanism>

      {/* ━━━ METRICS ━━━ */}
      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="prompt-engineering-in-writing-tools"
      >
        <Metric
          value="1,5 tỷ đô-la Mỹ — định giá Jasper AI sau vòng Series A 10/2022, phục vụ hơn 70.000 khách hàng trả phí"
          sourceRef={1}
        />
        <Metric
          value="Hơn 2 triệu người đăng ký danh sách chờ Notion AI trong vài tuần, gấp 10 lần dự đoán nội bộ"
          sourceRef={3}
        />
        <Metric
          value="45 triệu đô-la Mỹ — doanh thu Jasper năm 2021, dự kiến gấp đôi vào năm 2022"
          sourceRef={2}
        />
      </ApplicationMetrics>

      {/* Khối counter động — bổ sung trực quan cho Metrics */}
      <section className="mb-10">
        <MetricsGrid />
        <Callout variant="insight" title="Đọc con số này thế nào?">
          Điểm chung của cả hai con số: người dùng trả tiền cho{" "}
          <strong>khung prompt</strong>, không phải cho mô hình AI. Mô hình
          OpenAI và Anthropic ai cũng gọi được; khác biệt là Jasper và
          Notion đã đóng gói xong &ldquo;cách dặn dò&rdquo;.
        </Callout>
      </section>

      {/* ━━━ COUNTERFACTUAL ━━━ */}
      <ApplicationCounterfactual
        parentTitleVi="Prompt Engineering"
        topicSlug="prompt-engineering-in-writing-tools"
      >
        <p>
          Nếu không có prompt engineering được đóng gói vào template, mỗi lần
          viết một bài blog hay một email bạn sẽ phải tự thử nghiệm hàng
          chục cách diễn đạt. Mỗi lần ngồi trước ChatGPT là một ván bài mới:
          hên thì ra bản dùng được, xui thì mất 20 phút không có gì.
        </p>

        <BeforeAfterTemplates />

        <p>
          Jasper và Notion AI đã biến kỹ năng chuyên môn thành trải nghiệm{" "}
          <strong>&ldquo;điền form &mdash; bấm nút &mdash; lấy kết quả&rdquo;</strong>{" "}
          cho hàng triệu người dùng. Đó là bài học lớn nhất: công nghệ AI
          mạnh đến đâu, người dùng phổ thông vẫn cần một giao diện đơn giản
          để khai thác.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
