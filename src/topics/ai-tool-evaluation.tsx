"use client";
import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Gauge,
  Scale,
  Zap,
  ShieldCheck,
  Plug,
  Globe,
  AlertOctagon,
  Briefcase,
  Sparkles,
  Search,
  MessageSquare,
  FileText,
  DollarSign,
  Clock,
  TrendingUp,
  Database,
} from "lucide-react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
  MiniSummary,
  LessonSection,
  TopicLink,
  ProgressSteps,
  SliderGroup,
  MatchPairs,
  TabView,
} from "@/components/interactive";
import type { Pair } from "@/components/interactive/MatchPairs";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

/* ═══════════════════════════════════════════════════════════════════════
   METADATA — preserved
   ═══════════════════════════════════════════════════════════════════════ */
export const metadata: TopicMeta = {
  slug: "ai-tool-evaluation",
  title: "AI Tool Evaluation",
  titleVi: "Đánh giá AI tool đa chiều",
  description:
    "Framework 6 tiêu chí (chất lượng, giá, tốc độ, bảo mật, tích hợp, hỗ trợ tiếng Việt) để chọn đúng công cụ AI cho từng tác vụ trong văn phòng Việt Nam.",
  category: "applied-ai",
  tags: ["evaluation", "comparison", "chatgpt", "claude", "gemini", "copilot"],
  difficulty: "intermediate",
  relatedSlugs: ["getting-started-with-ai", "prompt-engineering", "ai-privacy-security"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

/* ═══════════════════════════════════════════════════════════════════════
   DATA — 6 tiêu chí
   ═══════════════════════════════════════════════════════════════════════ */

interface Criterion {
  key: string;
  label: string;
  short: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  desc: string;
  color: string;
}

const CRITERIA: Criterion[] = [
  {
    key: "quality",
    label: "Chất lượng output",
    short: "Chất lượng",
    icon: Sparkles,
    desc: "Câu trả lời có đúng, đầy đủ, đúng ngữ cảnh tiếng Việt không.",
    color: "#a855f7",
  },
  {
    key: "price",
    label: "Giá",
    short: "Giá",
    icon: Scale,
    desc: "Chi phí theo tháng hoặc theo lượng query, bao gồm cả gói doanh nghiệp.",
    color: "#10b981",
  },
  {
    key: "speed",
    label: "Tốc độ",
    short: "Tốc độ",
    icon: Zap,
    desc: "Thời gian chờ câu trả lời. Quan trọng với chatbot khách hàng.",
    color: "#f59e0b",
  },
  {
    key: "privacy",
    label: "Bảo mật",
    short: "Bảo mật",
    icon: ShieldCheck,
    desc: "Có cam kết không train trên dữ liệu của bạn, DPA, audit log không.",
    color: "#3b82f6",
  },
  {
    key: "integration",
    label: "Tích hợp",
    short: "Tích hợp",
    icon: Plug,
    desc: "Có nối được với Google Workspace, Microsoft 365, Slack, hay phần mềm công ty.",
    color: "#ef4444",
  },
  {
    key: "vietnamese",
    label: "Hỗ trợ tiếng Việt",
    short: "Tiếng Việt",
    icon: Globe,
    desc: "Có giữ dấu đúng không, hiểu ngữ cảnh văn hóa Việt, có mất dấu ở output dài không.",
    color: "#ec4899",
  },
];

/* ═══════════════════════════════════════════════════════════════════════
   DATA — 5 công cụ phổ biến với điểm 0–5 theo 6 tiêu chí
   ═══════════════════════════════════════════════════════════════════════ */

interface Tool {
  id: string;
  name: string;
  vendor: string;
  color: string;
  price: string;
  scores: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  useFor: string;
}

const TOOLS: Tool[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    vendor: "OpenAI",
    color: "#10a37f",
    price: "Free · Plus $20 · Team $25/user · Enterprise tùy",
    scores: {
      quality: 4,
      price: 3,
      speed: 4,
      privacy: 4,
      integration: 5,
      vietnamese: 4,
    },
    strengths: [
      "Hệ sinh thái lớn nhất, nhiều tích hợp sẵn",
      "App mobile + voice mode tốt",
      "Tạo ảnh DALL-E ngay trong chat",
    ],
    weaknesses: [
      "Đôi khi mất dấu tiếng Việt ở bài dài",
      "Tier miễn phí lưu hội thoại có thể dùng để train",
    ],
    useFor: "Work chung, tạo hình ảnh, tổng hợp đa phương tiện",
  },
  {
    id: "claude",
    name: "Claude",
    vendor: "Anthropic",
    color: "#d97757",
    price: "Free · Pro $20 · Team $25/user · Enterprise tùy",
    scores: {
      quality: 5,
      price: 3,
      speed: 3,
      privacy: 5,
      integration: 4,
      vietnamese: 5,
    },
    strengths: [
      "Viết + phân tích văn bản dài tốt, giữ dấu VN ổn định",
      "No-train mặc định ở mọi tier API",
      "Coding + reasoning mạnh ở benchmark mới nhất",
    ],
    weaknesses: [
      "Không tạo ảnh trực tiếp",
      "Hệ sinh thái plugin nhỏ hơn OpenAI",
    ],
    useFor: "Phân tích báo cáo dài, soạn thảo văn bản, code, tài liệu pháp lý",
  },
  {
    id: "gemini",
    name: "Gemini",
    vendor: "Google",
    color: "#4285f4",
    price: "Free · AI Premium $20 · Workspace $20–30/user",
    scores: {
      quality: 4,
      price: 5,
      speed: 5,
      privacy: 4,
      integration: 5,
      vietnamese: 3,
    },
    strengths: [
      "Rẻ nhất ở tier mid (Flash), tốc độ cao",
      "Tích hợp sâu Google Workspace (Docs, Sheets, Gmail)",
      "Context window lớn (2M token), xử lý được video/audio",
    ],
    weaknesses: [
      "Đôi khi code-switch sang tiếng Anh không chủ đích",
      "Safety classifier đôi lúc từ chối query hợp lệ",
    ],
    useFor: "Chatbot volume lớn, Google Workspace user, phân tích video/hình",
  },
  {
    id: "copilot",
    name: "Microsoft 365 Copilot",
    vendor: "Microsoft",
    color: "#7b83eb",
    price: "$30/user/tháng (kèm M365 Business)",
    scores: {
      quality: 4,
      price: 2,
      speed: 4,
      privacy: 5,
      integration: 5,
      vietnamese: 4,
    },
    strengths: [
      "Tích hợp chặt Word, Excel, Outlook, Teams",
      "Zero Data Retention option, dữ liệu nằm trong tenant M365",
      "Đã có region Singapore gần Việt Nam",
    ],
    weaknesses: [
      "Bắt buộc phải có M365 Business, giá cao",
      "Chất lượng văn bản tự do kém hơn Claude/ChatGPT",
    ],
    useFor: "Công ty đã dùng M365, cần AI trong Word/Excel/Outlook",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    vendor: "Perplexity AI",
    color: "#20808d",
    price: "Free · Pro $20 · Enterprise $40/user",
    scores: {
      quality: 4,
      price: 4,
      speed: 5,
      privacy: 3,
      integration: 3,
      vietnamese: 4,
    },
    strengths: [
      "Trích dẫn nguồn rõ ràng, tốt cho research",
      "Cập nhật thông tin realtime từ web",
      "Tìm thông tin thị trường VN khá ổn",
    ],
    weaknesses: [
      "Enterprise tier còn non, ít DPA mạnh",
      "Không tốt cho viết sáng tạo dài",
    ],
    useFor: "Nghiên cứu thị trường, tìm số liệu, fact-check",
  },
];

/* ═══════════════════════════════════════════════════════════════════════
   DATA — matchmaker pairs
   ═══════════════════════════════════════════════════════════════════════ */

const MATCH_PAIRS: Pair[] = [
  {
    left: "Soạn email Outlook cho khách hàng, cần theo template công ty",
    right: "Microsoft 365 Copilot",
  },
  {
    left: "Phân tích báo cáo PDF 80 trang tiếng Việt, cần chính xác cao",
    right: "Claude",
  },
  {
    left: "Chatbot FAQ trên website, 50K lượt/tháng, ưu tiên chi phí",
    right: "Gemini Flash",
  },
  {
    left: "Nghiên cứu thị trường Việt Nam, cần nguồn trích dẫn",
    right: "Perplexity",
  },
  {
    left: "Tạo ảnh minh họa cho slide marketing",
    right: "ChatGPT (DALL-E)",
  },
];

/* ═══════════════════════════════════════════════════════════════════════
   COMPONENT — Scorecard builder with SliderGroup + bar chart
   ═══════════════════════════════════════════════════════════════════════ */

function ScorecardViz({ weights }: { weights: Record<string, number> }) {
  const normalized = useMemo(() => {
    const total = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
    return Object.fromEntries(
      Object.entries(weights).map(([k, v]) => [k, v / total])
    );
  }, [weights]);

  const ranked = useMemo(() => {
    return TOOLS.map((tool) => {
      const raw = CRITERIA.reduce(
        (sum, c) => sum + (tool.scores[c.key] ?? 0) * (normalized[c.key] ?? 0),
        0
      );
      // Scale 0-5 → 0-100
      const score = Math.round((raw / 5) * 100);
      return { tool, score };
    }).sort((a, b) => b.score - a.score);
  }, [normalized]);

  const maxScore = ranked[0]?.score ?? 100;

  return (
    <div className="w-full space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        Xếp hạng công cụ theo trọng số bạn chọn
      </p>
      <div className="space-y-2.5">
        {ranked.map(({ tool, score }, i) => {
          const pct = (score / (maxScore || 1)) * 100;
          return (
            <div key={tool.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: tool.color }}
                  >
                    {i + 1}
                  </span>
                  <span className="font-semibold text-foreground">
                    {tool.name}
                  </span>
                  <span className="text-muted">{tool.vendor}</span>
                </span>
                <span className="font-mono text-sm font-bold" style={{ color: tool.color }}>
                  {score}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: tool.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] italic text-muted leading-snug pt-1">
        Tip: Bấm các slider bên dưới để thấy thứ tự thay đổi theo ưu tiên của bạn.
      </p>
    </div>
  );
}

function ScorecardBuilder() {
  return (
    <SliderGroup
      title="Kéo slider để đánh trọng số cho 6 tiêu chí (0 = không quan trọng, 5 = cực kỳ quan trọng)"
      sliders={CRITERIA.map((c) => ({
        key: c.key,
        label: c.label,
        min: 0,
        max: 5,
        step: 1,
        defaultValue: 3,
      }))}
      visualization={(values) => <ScorecardViz weights={values} />}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   COMPONENT — Criteria diagram (6 tiêu chí)
   ═══════════════════════════════════════════════════════════════════════ */

function CriteriaDiagram() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {CRITERIA.map((c, i) => {
        const Icon = c.icon;
        return (
          <motion.div
            key={c.key}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="rounded-xl border-2 p-3 text-center"
            style={{
              borderColor: `${c.color}40`,
              backgroundColor: `${c.color}10`,
            }}
          >
            <div
              className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: `${c.color}25` }}
            >
              <Icon size={20} style={{ color: c.color }} />
            </div>
            <p className="text-sm font-semibold text-foreground">{c.label}</p>
            <p className="mt-1 text-[11px] leading-snug text-muted">{c.desc}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   COMPONENT — Tool comparison cards (strengths/weaknesses)
   ═══════════════════════════════════════════════════════════════════════ */

function ToolCards() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {TOOLS.map((tool) => (
        <div
          key={tool.id}
          className="rounded-xl border p-4"
          style={{
            borderColor: `${tool.color}50`,
            backgroundColor: `${tool.color}08`,
          }}
        >
          <div className="flex items-baseline justify-between">
            <p className="text-base font-bold" style={{ color: tool.color }}>
              {tool.name}
            </p>
            <span className="text-[10px] text-muted">{tool.vendor}</span>
          </div>
          <p className="mt-0.5 text-[11px] text-muted">{tool.price}</p>

          <div className="mt-3 space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Mạnh
            </p>
            <ul className="space-y-0.5 text-[11px] text-foreground">
              {tool.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-600 dark:text-emerald-400 shrink-0">+</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-2.5 space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">
              Yếu
            </p>
            <ul className="space-y-0.5 text-[11px] text-foreground">
              {tool.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-red-600 dark:text-red-400 shrink-0">−</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-3 border-t border-border pt-2 text-[11px] italic text-muted leading-snug">
            Phù hợp: {tool.useFor}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   COMPONENT — Benchmark comparison (mock outputs on same prompt)
   ═══════════════════════════════════════════════════════════════════════ */

function BenchmarkComparison() {
  const prompt =
    "Tóm tắt báo cáo doanh thu Q1 2026: Doanh thu 45 tỷ (+12% YoY), lợi nhuận 8 tỷ (+5%), chi phí vận hành tăng 18%. Khách hàng mới 1,200 (giảm 8%). Đề xuất 3 hành động.";

  const chatgptOutput = (
    <div className="rounded-lg bg-[#10a37f]/10 border border-[#10a37f]/30 p-4 space-y-2">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[#10a37f]" />
        <p className="text-xs font-semibold text-[#10a37f]">ChatGPT (GPT-4)</p>
      </div>
      <p className="text-xs text-foreground leading-relaxed">
        <strong>Điểm chính Q1/2026:</strong> Doanh thu tăng tốt (+12%), nhưng tăng chi phí (+18%) vượt tăng doanh thu → biên lợi nhuận mỏng đi.
        Khách hàng mới giảm 8% đáng lo.
      </p>
      <p className="text-xs text-foreground leading-relaxed">
        <strong>3 hành động:</strong> (1) Rà soát chi phí vận hành, cắt mục không thiết yếu;
        (2) Đầu tư lại vào marketing để khôi phục tăng trưởng khách mới;
        (3) Phân tích nhóm khách cũ — tăng cross-sell bù cho giảm khách mới.
      </p>
      <p className="text-[10px] text-muted italic">≈ 340 ký tự, tốc độ ~2s</p>
    </div>
  );

  const claudeOutput = (
    <div className="rounded-lg bg-[#d97757]/10 border border-[#d97757]/30 p-4 space-y-2">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[#d97757]" />
        <p className="text-xs font-semibold text-[#d97757]">Claude (Sonnet)</p>
      </div>
      <p className="text-xs text-foreground leading-relaxed">
        <strong>Tóm tắt Q1/2026:</strong> Tín hiệu trái chiều. Doanh thu 45 tỷ tăng mạnh 12% cho thấy sản phẩm còn sức,
        nhưng lợi nhuận chỉ tăng 5% vì chi phí vận hành tăng 18% — tốc độ chi vượt tốc độ thu. Khách hàng mới giảm 8% là dấu hiệu
        kênh tiếp thị đang mất hiệu quả.
      </p>
      <p className="text-xs text-foreground leading-relaxed">
        <strong>Đề xuất:</strong> (1) Audit chi phí vận hành — tìm 3 mục tăng nhiều nhất, đặt giới hạn cho Q2;
        (2) Phân tích cohort khách mới Q4/2025 vs Q1/2026 để xác định kênh nào suy yếu, đầu tư lại;
        (3) Khởi động chương trình giữ chân + tăng ARPU trên tập khách cũ để bù.
      </p>
      <p className="text-[10px] text-muted italic">≈ 520 ký tự, tốc độ ~3s — chi tiết hơn, giữ dấu tốt</p>
    </div>
  );

  const geminiOutput = (
    <div className="rounded-lg bg-[#4285f4]/10 border border-[#4285f4]/30 p-4 space-y-2">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[#4285f4]" />
        <p className="text-xs font-semibold text-[#4285f4]">Gemini (Flash)</p>
      </div>
      <p className="text-xs text-foreground leading-relaxed">
        <strong>Q1 2026:</strong> Revenue 45B (+12%), profit 8B (+5%), opex +18%, new customers -8%.
        Growth có nhưng margin shrinking.
      </p>
      <p className="text-xs text-foreground leading-relaxed">
        <strong>Actions:</strong> 1. Cost review — tìm chỗ cắt. 2. Reinvest marketing cho acquisition.
        3. Retention program cho existing customers.
      </p>
      <p className="text-[10px] text-muted italic">≈ 200 ký tự, tốc độ ~1s — nhanh nhưng mix tiếng Anh</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-surface p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">
          Cùng một prompt
        </p>
        <p className="text-xs text-foreground italic leading-relaxed">
          {'"'}{prompt}{'"'}
        </p>
      </div>
      <TabView
        tabs={[
          { label: "ChatGPT", content: chatgptOutput },
          { label: "Claude", content: claudeOutput },
          { label: "Gemini", content: geminiOutput },
        ]}
      />
      <Callout variant="tip" title="Bấm qua từng tab để so sánh">
        Cùng prompt, ba công cụ cho ba phong cách khác nhau. Claude chi tiết và giữ dấu VN ổn định.
        Gemini nhanh nhưng dễ mix tiếng Anh. ChatGPT cân bằng. Thử cả ba với workload thật của bạn.
      </Callout>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   COMPONENT — Decision tree for common VN use cases
   ═══════════════════════════════════════════════════════════════════════ */

function UseCaseDecisionTree() {
  const useCase1 = (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
        <MessageSquare size={18} className="text-accent" />
        Soạn email + tài liệu trong Word/Outlook
      </p>
      <div className="rounded-lg border border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20 p-3 space-y-2 text-sm">
        <p>
          <strong>Ưu tiên:</strong> Tích hợp (5/5), bảo mật (5/5), tiếng Việt (4/5)
        </p>
        <p>
          <strong>Chọn:</strong> <span className="font-semibold text-emerald-700 dark:text-emerald-300">Microsoft 365 Copilot</span> — nếu công ty đã có M365.
          Nếu chưa, dùng <span className="font-semibold">Claude for Work</span> + copy sang Word.
        </p>
        <p className="text-[11px] italic text-muted">
          Lý do: Copilot hiểu cấu trúc Word/Outlook, dữ liệu nằm trong tenant công ty, có Zero Data Retention.
        </p>
      </div>
    </div>
  );

  const useCase2 = (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
        <FileText size={18} className="text-accent" />
        Phân tích hợp đồng / báo cáo PDF dài
      </p>
      <div className="rounded-lg border border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20 p-3 space-y-2 text-sm">
        <p>
          <strong>Ưu tiên:</strong> Chất lượng (5/5), tiếng Việt (5/5), bảo mật (5/5)
        </p>
        <p>
          <strong>Chọn:</strong> <span className="font-semibold text-emerald-700 dark:text-emerald-300">Claude for Work</span> — mạnh nhất ở phân tích văn bản dài.
        </p>
        <p className="text-[11px] italic text-muted">
          Lý do: Context window 200K token + reasoning mạnh + giữ dấu tiếng Việt ổn định. Che PII trước khi dán.
        </p>
      </div>
    </div>
  );

  const useCase3 = (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Gauge size={18} className="text-accent" />
        Chatbot hỗ trợ khách hàng volume lớn
      </p>
      <div className="rounded-lg border border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20 p-3 space-y-2 text-sm">
        <p>
          <strong>Ưu tiên:</strong> Giá (5/5), tốc độ (5/5), tích hợp (4/5)
        </p>
        <p>
          <strong>Chọn:</strong> <span className="font-semibold text-emerald-700 dark:text-emerald-300">Gemini Flash</span> (primary) +{" "}
          <span className="font-semibold">Claude Sonnet</span> (escalation cho case khó).
        </p>
        <p className="text-[11px] italic text-muted">
          Lý do: Flash rẻ + nhanh cho 90% FAQ đơn giản. Claude được gọi cho 10% case phức tạp.
        </p>
      </div>
    </div>
  );

  const useCase4 = (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Search size={18} className="text-accent" />
        Nghiên cứu thị trường, tìm số liệu
      </p>
      <div className="rounded-lg border border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20 p-3 space-y-2 text-sm">
        <p>
          <strong>Ưu tiên:</strong> Chất lượng (5/5), tính mới của thông tin (5/5)
        </p>
        <p>
          <strong>Chọn:</strong> <span className="font-semibold text-emerald-700 dark:text-emerald-300">Perplexity Pro</span> cho research,{" "}
          <span className="font-semibold">Claude</span> cho phân tích sâu.
        </p>
        <p className="text-[11px] italic text-muted">
          Lý do: Perplexity trích dẫn nguồn rõ ràng, dữ liệu realtime. Sau khi có thông tin, dùng Claude phân tích + viết báo cáo.
        </p>
      </div>
    </div>
  );

  const useCase5 = (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Sparkles size={18} className="text-accent" />
        Tạo ảnh minh họa cho marketing
      </p>
      <div className="rounded-lg border border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20 p-3 space-y-2 text-sm">
        <p>
          <strong>Ưu tiên:</strong> Chất lượng hình ảnh, dễ dùng
        </p>
        <p>
          <strong>Chọn:</strong> <span className="font-semibold text-emerald-700 dark:text-emerald-300">ChatGPT Plus (DALL-E)</span> hoặc Midjourney.
        </p>
        <p className="text-[11px] italic text-muted">
          Lý do: DALL-E tích hợp sẵn trong ChatGPT, tạo ảnh + chỉnh lời một chỗ. Claude/Gemini tier hiện tại tạo ảnh yếu hơn.
        </p>
      </div>
    </div>
  );

  return (
    <TabView
      tabs={[
        { label: "Email/Word", content: useCase1 },
        { label: "PDF dài", content: useCase2 },
        { label: "Chatbot", content: useCase3 },
        { label: "Research", content: useCase4 },
        { label: "Tạo ảnh", content: useCase5 },
      ]}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   COMPONENT — TCO breakdown visual
   ═══════════════════════════════════════════════════════════════════════ */

interface TcoComponent {
  label: string;
  share: number;
  desc: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  color: string;
  bg: string;
}

const TCO_COMPONENTS: TcoComponent[] = [
  {
    label: "Giá API / subscription",
    share: 30,
    desc: "Chi phí trực tiếp trả cho vendor theo tháng hoặc theo token",
    icon: DollarSign,
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  {
    label: "Hạ tầng đi kèm",
    share: 15,
    desc: "Vector DB, orchestration, monitoring, caching — thường bị quên",
    icon: Database,
    color: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    label: "Công sức kỹ sư",
    share: 25,
    desc: "Viết prompt, integrate SDK, xây eval set, fine-tune, maintain",
    icon: Briefcase,
    color: "text-purple-700 dark:text-purple-300",
    bg: "bg-purple-100 dark:bg-purple-900/30",
  },
  {
    label: "Độ trễ người dùng",
    share: 10,
    desc: "Latency cao = user bỏ đi. Mỗi +100ms giảm conversion ~1%",
    icon: Clock,
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-100 dark:bg-amber-900/30",
  },
  {
    label: "Chi phí migrate sau này",
    share: 20,
    desc: "Đổi vendor = viết lại prompt + re-eval + re-train team",
    icon: TrendingUp,
    color: "text-red-700 dark:text-red-300",
    bg: "bg-red-100 dark:bg-red-900/30",
  },
];

function TcoBreakdown() {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-surface/50 p-4">
        <p className="text-sm font-semibold text-foreground mb-1">
          Tổng chi phí sở hữu (TCO) không chỉ là giá API
        </p>
        <p className="text-xs text-muted leading-snug">
          Khi chọn AI tool, tính đủ 5 thành phần dưới. Tỉ lệ dưới đây là phân bố
          điển hình cho một dự án AI nội bộ năm đầu tiên ở công ty vừa và nhỏ.
        </p>
      </div>

      {/* Stacked bar */}
      <div className="flex h-8 w-full overflow-hidden rounded-lg border border-border">
        {TCO_COMPONENTS.map((c, i) => {
          const bgColor = c.bg
            .replace("bg-", "")
            .replace(" dark:bg-emerald-900/30", "")
            .split(" ")[0];
          return (
            <motion.div
              key={i}
              initial={{ width: 0 }}
              animate={{ width: `${c.share}%` }}
              transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.08 }}
              className={`flex items-center justify-center text-[10px] font-bold text-white ${bgColor}`}
              style={{
                backgroundColor:
                  c.label === "Giá API / subscription"
                    ? "#059669"
                    : c.label === "Hạ tầng đi kèm"
                    ? "#2563eb"
                    : c.label === "Công sức kỹ sư"
                    ? "#7c3aed"
                    : c.label === "Độ trễ người dùng"
                    ? "#d97706"
                    : "#dc2626",
              }}
              title={`${c.label}: ${c.share}%`}
            >
              {c.share}%
            </motion.div>
          );
        })}
      </div>

      {/* Detailed list */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {TCO_COMPONENTS.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              className="rounded-lg border border-border bg-card p-3 flex items-start gap-3"
            >
              <div className={`shrink-0 rounded-lg p-1.5 ${c.bg}`}>
                <Icon size={16} className={c.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[12px] font-semibold text-foreground truncate">
                    {c.label}
                  </p>
                  <span className={`font-mono text-xs font-bold ${c.color}`}>
                    {c.share}%
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted leading-snug">
                  {c.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   COMPONENT — Red flags
   ═══════════════════════════════════════════════════════════════════════ */

function RedFlags() {
  const flags = [
    {
      title: "Chưa có trên thị trường VN",
      detail:
        "Công cụ chưa có thanh toán bằng thẻ VN, chưa có hóa đơn VAT, chưa có gói doanh nghiệp ở region châu Á — sẽ khó triển khai cho team ở VN.",
    },
    {
      title: "Không có gói trả phí rõ ràng",
      detail:
        "Chỉ có tier miễn phí, không có Team/Enterprise tier → không thể ký DPA, không có cam kết no-train, không có audit log. Không dùng cho dữ liệu công ty.",
    },
    {
      title: "Bảo mật mập mờ",
      detail:
        "Website không nói rõ có dùng dữ liệu để train không, không có trang trust center, không có chứng chỉ SOC 2 / ISO 27001. Tránh.",
    },
    {
      title: "Chỉ có benchmark nội bộ",
      detail:
        "Vendor chỉ show điểm benchmark do chính họ công bố. Không có đánh giá bên thứ 3 (LMSYS Arena, HELM). Chờ thêm dữ liệu độc lập.",
    },
    {
      title: "Không rõ ai đứng sau",
      detail:
        "Công ty không rõ, không có địa chỉ đăng ký, team nhỏ không xác minh được. Nguy cơ ngừng dịch vụ bất ngờ, dữ liệu mất.",
    },
    {
      title: "Khóa vendor lock-in nặng",
      detail:
        "Fine-tune, dataset, prompt format đều độc quyền — sau này muốn đổi phải viết lại từ đầu. Chọn công cụ có portable format.",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {flags.map((f, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04, duration: 0.3 }}
          className="rounded-xl border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/20 p-3"
        >
          <p className="flex items-center gap-2 text-sm font-semibold text-red-800 dark:text-red-200">
            <AlertOctagon size={16} />
            {f.title}
          </p>
          <p className="mt-1 text-[12px] text-foreground leading-snug">
            {f.detail}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════════════════ */

export default function AiToolEvaluationTopic() {
  /* Quiz */
  const quizQuestions: QuizQuestion[] = [
    {
      question:
        "Bạn cần chọn AI cho 50 nhân viên văn phòng chủ yếu dùng Word và Outlook cho tài liệu và email khách hàng. Chọn tool nào phù hợp nhất?",
      options: [
        "ChatGPT Free cho mọi người, rẻ nhất",
        "Microsoft 365 Copilot — tích hợp sẵn Word/Outlook, Zero Data Retention, DPA đầy đủ",
        "Để nhân viên tự chọn tool họ thích",
        "Gemini Free vì Google là công ty lớn",
      ],
      correct: 1,
      explanation:
        "M365 Copilot phù hợp nhất vì: (1) workload chính là Word + Outlook — tích hợp native tiết kiệm thời gian; (2) dữ liệu email khách hàng là PII, cần DPA + Zero Data Retention; (3) admin console giúp IT quản lý. Free tier không có DPA nên không dùng cho dữ liệu khách hàng.",
    },
    {
      question:
        "Phát biểu nào SAI về đánh giá AI tool?",
      options: [
        "Không có tool {'tốt nhất'} chung — chỉ có tool phù hợp nhất với tác vụ và trọng số của bạn",
        "Benchmark công khai như MMLU là thước đo cuối cùng, không cần đánh giá thêm",
        "Multi-model routing (Gemini Flash cho query đơn giản + Claude cho query phức tạp) tiết kiệm được 50–70% chi phí",
        "Tool rẻ nhất về giá API có thể đắt nhất về tổng chi phí khi tính cả công sức integrate và migrate",
      ],
      correct: 1,
      explanation:
        "Benchmark công khai chỉ là proxy — không thay được việc đánh giá trên workload thật của bạn (domain, tiếng Việt, use case cụ thể). Nên xây một bộ eval set nội bộ 30–50 example từ công việc thật để so sánh head-to-head.",
    },
    {
      question:
        "Tại sao đánh giá AI tool phải bao gồm tiêu chí {'Hỗ trợ tiếng Việt'}?",
      options: [
        "Vì đa số benchmark AI công khai dùng tiếng Anh — chất lượng output trên tiếng Việt có thể chênh 10–20% so với điểm benchmark",
        "Vì Việt Nam không có internet",
        "Không cần — mọi AI đều hỗ trợ tiếng Việt như nhau",
        "Vì chỉ tiếng Việt mới đánh dấu được",
      ],
      correct: 0,
      explanation:
        "MMLU, GPQA, HumanEval hầu hết bằng tiếng Anh. Cùng một model có thể điểm cao trên benchmark nhưng mất dấu tiếng Việt ở output dài, hoặc hiểu sai văn cảnh văn hóa Việt. Tiếng Việt phải là tiêu chí riêng khi đánh giá cho workload VN.",
    },
    {
      question:
        "Công ty fintech có chatbot 8M câu hỏi/tháng, 90% là FAQ đơn giản, 10% là case phức tạp. Chọn kiến trúc nào tối ưu chi phí + chất lượng?",
      options: [
        "Claude Opus cho toàn bộ 100% — chất lượng cao nhất",
        "Router: Gemini Flash cho 90% FAQ (rẻ + nhanh) + Claude Sonnet cho 10% case phức tạp",
        "Mỗi lần query gọi cả 3 tool, chọn kết quả tốt nhất",
        "ChatGPT Free, lo chất lượng sau",
      ],
      correct: 1,
      explanation:
        "Router multi-model là pattern chuẩn cho workload có phân phối lệch. 90% FAQ không cần flagship — Flash đủ sức, chi phí bằng 1/10. 10% case phức tạp cần Claude để giữ chất lượng. Tổng chi phí giảm ~65% mà không hạ chất lượng ở phần quan trọng.",
    },
    {
      question:
        "Khi chọn AI cho công ty, dấu hiệu {'red flag'} nào sau đây KHÔNG đáng lo?",
      options: [
        "Vendor chỉ có tier miễn phí, không có Team/Enterprise, không có DPA",
        "Không có đánh giá bên thứ 3 — chỉ có benchmark do chính vendor công bố",
        "Công cụ hỗ trợ nhiều ngôn ngữ bao gồm cả tiếng Việt và có cộng đồng lớn",
        "Bảo mật mập mờ, không có trang trust center, không có chứng chỉ SOC 2",
      ],
      correct: 2,
      explanation:
        "Hỗ trợ đa ngôn ngữ + cộng đồng lớn là dấu hiệu TÍCH CỰC. Ba dấu hiệu còn lại đều là red flag: không có tier enterprise nghĩa là không ký được DPA; benchmark tự công bố dễ bị thổi phồng; không có trust center là tín hiệu bảo mật yếu.",
    },
    {
      question:
        "Sếp yêu cầu bạn chọn AI cho toàn công ty trong 1 tuần. Cách làm ĐÚNG NHẤT là?",
      options: [
        "Đọc vài bài review trên YouTube/báo, chọn tool nổi tiếng nhất",
        "Xây eval set 30–50 example từ workload thật, chạy 2–3 tool candidate, chấm điểm theo rubric, present kết quả có số liệu cho sếp",
        "Chọn công cụ đang được nhắc nhiều trên Facebook",
        "Tự dùng 1 tuần, cảm giác nào ưng thì chọn",
      ],
      correct: 1,
      explanation:
        "Eval-driven là cách chuyên nghiệp. Review bên thứ ba không reflect workload cụ thể. Cảm giác cá nhân dễ bias. Bộ eval set nhỏ (30–50 example) là đủ để thấy khác biệt rõ ràng. Nếu 2 tool sát nhau, câu trả lời đúng là {'multi-model routing'} thay vì chọn một vendor duy nhất.",
    },
  ];

  /* RENDER */
  return (
    <>
      {/* ================================================================
          BƯỚC 1 — PREDICTION
          ================================================================ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Với cùng một tác vụ 'tóm tắt báo cáo 50 trang', bạn thử trên ChatGPT miễn phí và Claude miễn phí. Kết quả KHẢ NĂNG CAO sẽ khác nhau ở điểm nào?"
          options={[
            "Hai tool cho kết quả giống nhau vì cùng là AI",
            "Khác biệt về độ chi tiết, giữ dấu tiếng Việt, tốc độ, và cách trình bày — mỗi tool có điểm mạnh khác",
            "ChatGPT luôn tốt hơn Claude vì phổ biến hơn",
            "Claude luôn tốt hơn vì mới ra sau",
          ]}
          correct={1}
          explanation="Hai tool thường khác nhau đáng kể: chi tiết, độ dài, giữ dấu tiếng Việt, khả năng hiểu ngữ cảnh VN, tốc độ. Không có tool {'tốt nhất'} — chỉ có tool {'phù hợp nhất cho tác vụ cụ thể của bạn'}. Bài này cho bạn một framework 6 tiêu chí để quyết định."
        >
          <p className="mt-3 text-sm text-muted leading-relaxed">
            Ở cuối bài, bạn sẽ biết: (1) 6 tiêu chí cần so sánh khi chọn AI;
            (2) mỗi công cụ phổ biến mạnh ở đâu; (3) cách ghép cặp tác vụ →
            công cụ cho 5 tình huống văn phòng điển hình ở Việt Nam.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ================================================================
          BƯỚC 2 — METAPHOR
          ================================================================ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Hình dung">
        <div className="space-y-3">
          <p className="text-base text-foreground leading-relaxed">
            Chọn AI giống như <strong>chọn nhân viên cho một công việc</strong>.
            Mỗi người có thế mạnh khác nhau: người giỏi viết, người giỏi tính toán,
            người nhanh tay, người cẩn thận. Không ai {'"tốt nhất"'} cho mọi việc.
          </p>
          <p className="text-sm text-muted leading-relaxed">
            Bạn phải biết <strong>tác vụ cần gì</strong> trước, rồi mới ghép người
            phù hợp. Cùng là AI, nhưng Claude {'"đọc dài hiểu sâu"'}, Gemini{" "}
            {'"nhanh và rẻ"'}, ChatGPT {'"đa năng nhưng không chuyên"'},
            Copilot {'"gắn chặt vào Word/Excel"'}. Phải thử mới biết cái nào hợp
            công việc cụ thể của bạn.
          </p>
        </div>
      </LessonSection>

      {/* ================================================================
          BƯỚC 3 — VISUALIZATION
          ================================================================ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Thực hành">
        <VisualizationSection topicSlug={metadata.slug}>
          <div className="space-y-8">
            {/* Demo 1 — Scorecard */}
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Gauge size={18} className="text-accent" />
                  Demo 1: Tự xây scorecard theo ưu tiên của bạn
                </h3>
                <p className="mt-1 text-sm text-muted leading-relaxed">
                  Mỗi công ty có ưu tiên khác nhau. Công ty chi tiêu tiết kiệm
                  coi trọng giá. Công ty pháp lý coi trọng chất lượng + bảo mật.
                  Kéo slider và xem thứ hạng công cụ thay đổi theo ưu tiên của bạn.
                </p>
              </div>
              <ScorecardBuilder />
            </div>

            {/* Demo 2 — Matchmaker */}
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Briefcase size={18} className="text-accent" />
                  Demo 2: Ghép tác vụ với công cụ phù hợp
                </h3>
                <p className="mt-1 text-sm text-muted leading-relaxed">
                  Click vào tác vụ ở cột A, rồi click công cụ ở cột B bạn nghĩ phù hợp nhất.
                </p>
              </div>
              <MatchPairs
                pairs={MATCH_PAIRS}
                instruction="Ghép 5 tác vụ phổ biến ở văn phòng VN với công cụ AI phù hợp nhất."
              />
            </div>

            {/* Demo 3 — Benchmark comparison */}
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Sparkles size={18} className="text-accent" />
                  Demo 3: Cùng prompt, ba công cụ trả lời khác nhau thế nào
                </h3>
                <p className="mt-1 text-sm text-muted leading-relaxed">
                  Bấm qua từng tab để xem cách mỗi công cụ xử lý cùng một yêu cầu
                  phân tích báo cáo doanh thu.
                </p>
              </div>
              <BenchmarkComparison />
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ================================================================
          BƯỚC 4 — AHA
          ================================================================ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Aha">
        <AhaMoment>
          Không có tool <em>tốt nhất</em> — chỉ có tool{" "}
          <strong>phù hợp nhất cho tác vụ cụ thể của bạn</strong>. Thay vì hỏi
          {' "'}ChatGPT hay Claude tốt hơn?{'" '}hãy hỏi: {' "'}với tác vụ X và
          ưu tiên Y của công ty, tool nào thắng trên 6 tiêu chí?{'" '}
          Câu trả lời có thể khác nhau giữa các phòng trong cùng công ty.
        </AhaMoment>
      </LessonSection>

      {/* ================================================================
          BƯỚC 5 — CHALLENGE
          ================================================================ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Bạn là quản lý Marketing. Công việc chính: soạn content + tìm xu hướng thị trường + tạo ảnh cho chiến dịch. Công ty có ngân sách vừa phải. Chiến lược đa-công-cụ nào hợp lý nhất?"
          options={[
            "Dùng 1 công cụ duy nhất (ChatGPT Plus) cho mọi việc",
            "Claude Pro (viết content dài tiếng Việt) + Perplexity Pro (research xu hướng) + ChatGPT Plus (tạo ảnh DALL-E). Tổng ~$60/tháng, mỗi công cụ làm việc nó mạnh nhất.",
            "Chỉ dùng Gemini Free — miễn phí và đủ tốt",
            "Thuê agency ngoài, không dùng AI",
          ]}
          correct={1}
          explanation="Không ép tất cả vào 1 công cụ. Multi-tool stack đúng cách tiết kiệm được thời gian và cho output chất lượng: Claude mạnh viết tiếng Việt; Perplexity mạnh research có nguồn; ChatGPT tạo ảnh. Tổng ~$60/tháng cho một vai trò, rẻ hơn nhiều so với tuyển thêm người. Free tier có rủi ro về dữ liệu công ty."
        />
      </LessonSection>

      {/* ================================================================
          BƯỚC 6 — EXPLANATION (visual-heavy)
          ================================================================ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích">
        <ExplanationSection topicSlug={metadata.slug}>
          <div className="space-y-6">
            {/* 6 tiêu chí */}
            <div>
              <h3 className="text-base font-semibold text-foreground mb-3">
                Framework 6 tiêu chí đánh giá
              </h3>
              <CriteriaDiagram />
              <Callout variant="info" title="Cách dùng framework">
                Với mỗi tác vụ, cho điểm trọng số 0–5 cho mỗi tiêu chí (tổng không
                bắt buộc là 15). Rồi tính điểm tổng cho từng công cụ: điểm mỗi
                tiêu chí × trọng số, cộng lại. Công cụ điểm cao nhất là lựa chọn
                hợp lý — nhưng luôn thử thực tế với 5–10 prompt trước khi commit.
              </Callout>
            </div>

            {/* Tool cards */}
            <div>
              <h3 className="text-base font-semibold text-foreground mb-3">
                5 công cụ AI phổ biến — mạnh và yếu
              </h3>
              <ToolCards />
            </div>

            {/* TCO breakdown */}
            <div>
              <h3 className="text-base font-semibold text-foreground mb-3">
                Tổng chi phí sở hữu (TCO) — tính đủ 5 thành phần
              </h3>
              <TcoBreakdown />
            </div>

            {/* Red flags */}
            <div>
              <h3 className="text-base font-semibold text-foreground mb-3">
                6 dấu hiệu đỏ khi chọn AI cho công ty
              </h3>
              <RedFlags />
            </div>

            {/* Decision tree */}
            <div>
              <h3 className="text-base font-semibold text-foreground mb-3">
                Cây quyết định: 5 tình huống văn phòng VN phổ biến
              </h3>
              <p className="text-sm text-muted mb-3 leading-relaxed">
                Bấm qua từng tab để xem gợi ý công cụ cho từng loại tác vụ.
              </p>
              <UseCaseDecisionTree />
            </div>

            <Callout variant="warning" title="3 sai lầm phổ biến khi chọn AI">
              <div className="space-y-2 text-sm">
                <p>
                  <strong>1. Chạy theo hype:</strong> Tool mới ra luôn được ca ngợi.
                  Chờ 4–8 tuần, đợi benchmark độc lập và feedback cộng đồng trước khi
                  dùng cho production.
                </p>
                <p>
                  <strong>2. Khóa một vendor:</strong> Viết prompt và workflow phụ thuộc
                  quirks của một tool. Sau này khó đổi. Dùng abstraction layer (LiteLLM,
                  LangChain) hoặc giữ prompt ở dạng portable.
                </p>
                <p>
                  <strong>3. Chỉ tính giá API:</strong> Tổng chi phí = giá API + thời gian
                  kỹ sư + độ trễ người dùng + chi phí migrate sau này. Tool rẻ nhất về API
                  có thể đắt nhất về tổng chi phí.
                </p>
              </div>
            </Callout>
          </div>
        </ExplanationSection>
      </LessonSection>

      {/* ================================================================
          BƯỚC 7 — SUMMARY
          ================================================================ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="5 điều cần nhớ khi chọn AI tool"
          points={[
            "6 tiêu chí: chất lượng, giá, tốc độ, bảo mật, tích hợp, hỗ trợ tiếng Việt. Trọng số khác nhau cho từng tác vụ.",
            "Không có tool tốt nhất — có tool phù hợp nhất. ChatGPT đa năng, Claude mạnh văn bản dài, Gemini rẻ + nhanh, Copilot gắn chặt M365, Perplexity research.",
            "Multi-tool stack thường hiệu quả hơn một công cụ duy nhất. Ví dụ: Claude (viết) + Perplexity (research) + ChatGPT (ảnh).",
            "Red flag: không có enterprise tier, không có DPA, chỉ có benchmark tự công bố, vendor mập mờ — tránh.",
            "Trước khi commit công cụ cho công ty, xây eval set 30–50 example từ workload thật, chạy head-to-head, chấm điểm theo rubric.",
          ]}
        />
        <p className="mt-4 text-sm text-muted leading-relaxed">
          Chọn đúng tool nhưng dùng sai cách vẫn không hiệu quả — xem{" "}
          <TopicLink slug="prompt-engineering">Prompt Engineering</TopicLink>.
          Bảo mật và Nghị định 13/2023 là yếu tố chi phối lựa chọn ở VN — xem{" "}
          <TopicLink slug="ai-privacy-security">Bảo mật khi dùng AI</TopicLink>.
        </p>
      </LessonSection>

      {/* ================================================================
          BƯỚC 8 — QUIZ
          ================================================================ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <ProgressSteps total={TOTAL_STEPS} current={TOTAL_STEPS} />
        <div className="mt-4">
          <QuizSection questions={quizQuestions} />
        </div>
      </LessonSection>
    </>
  );
}
