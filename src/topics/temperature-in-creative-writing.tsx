"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Wand2,
  PenTool,
  BookOpen,
  Thermometer,
  Snowflake,
  Flame,
  AlertTriangle,
  Sparkles,
  MessageSquare,
  FileText,
  Users,
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
  StepReveal,
} from "@/components/interactive";

export const metadata: TopicMeta = {
  slug: "temperature-in-creative-writing",
  title: "Temperature in Creative Writing",
  titleVi: "Temperature trong Viết Sáng tạo",
  description:
    "ChatGPT, Sudowrite, Notion AI: tham số temperature điều chỉnh mức độ ngẫu nhiên để AI vừa viết được thơ sáng tạo, vừa trả lời đúng câu hỏi có đáp án.",
  category: "llm-concepts",
  tags: ["temperature", "creative-writing", "application"],
  difficulty: "beginner",
  relatedSlugs: ["temperature"],
  vizType: "interactive",
  applicationOf: "temperature",
  featuredApp: {
    name: "ChatGPT",
    productFeature: "Creative vs Formal Writing via Temperature",
    company: "OpenAI",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "Understanding OpenAI's Temperature Parameter",
      publisher: "Colt Steele",
      url: "https://www.coltsteele.com/tips/understanding-openai-s-temperature-parameter",
      date: "2024-01",
      kind: "documentation",
    },
    {
      title:
        "Cheat Sheet: Mastering Temperature and Top_p in ChatGPT API",
      publisher: "OpenAI Developer Community",
      url: "https://community.openai.com/t/cheat-sheet-mastering-temperature-and-top-p-in-chatgpt-api/172683",
      date: "2023-06",
      kind: "documentation",
    },
    {
      title: "How to use OpenAI GPT models temperature",
      publisher: "GPT for Work",
      url: "https://gptforwork.com/guides/openai-gpt-ai-temperature",
      date: "2024-03",
      kind: "documentation",
    },
    {
      title: "What Is OpenAI Temperature?",
      publisher: "Coursera",
      url: "https://www.coursera.org/articles/openai-temperature",
      date: "2024-06",
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

/* ────────────────────────────────────────────────────────────
   DỮ LIỆU: Timeline các công cụ AI viết sáng tạo
   ──────────────────────────────────────────────────────────── */

interface TimelineItem {
  year: string;
  name: string;
  tagline: string;
  color: string;
  temperatureStory: string;
}

const WRITING_TIMELINE: TimelineItem[] = [
  {
    year: "2019",
    name: "AI Dungeon",
    tagline: "Game phiêu lưu văn bản do AI kể chuyện",
    color: "#8b5cf6",
    temperatureStory:
      "Cho phép người chơi chỉnh thanh 'creativity' — thực chất là temperature. Càng cao, AI càng tạo tình huống bất ngờ.",
  },
  {
    year: "2021",
    name: "Sudowrite",
    tagline: "Trợ lý AI dành riêng cho nhà văn tiểu thuyết",
    color: "#ec4899",
    temperatureStory:
      "Có nút 'adventurous' để người viết chọn mức liều lĩnh của AI khi gợi ý câu tiếp theo.",
  },
  {
    year: "2022",
    name: "ChatGPT",
    tagline: "Chatbot cho tất cả mọi người",
    color: "#10b981",
    temperatureStory:
      "Ẩn temperature đi với người dùng web, nhưng mở API cho lập trình viên chỉnh từ 0 đến 2.",
  },
  {
    year: "2023",
    name: "Notion AI",
    tagline: "AI viết tích hợp vào công cụ ghi chú",
    color: "#f59e0b",
    temperatureStory:
      "Chọn temperature thấp cho 'Summarize' (tóm tắt), temperature cao hơn cho 'Brainstorm ideas'.",
  },
  {
    year: "2024",
    name: "Claude Artifacts",
    tagline: "Viết & tạo nội dung có thể preview ngay",
    color: "#f97316",
    temperatureStory:
      "Tự chọn temperature thấp khi sinh code, cao hơn khi viết văn — không cần người dùng quan tâm.",
  },
];

/* ────────────────────────────────────────────────────────────
   DỮ LIỆU: Đếm con số lớn cho Metrics
   ──────────────────────────────────────────────────────────── */

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduceMotion]);

  return value;
}

function AnimatedCounter({
  target,
  suffix,
  prefix = "",
  label,
  color,
}: {
  target: number;
  suffix?: string;
  prefix?: string;
  label: string;
  color: string;
}) {
  const value = useCountUp(target);
  return (
    <div
      className="rounded-xl border bg-card p-5 text-center"
      style={{ borderColor: color + "55" }}
    >
      <div
        className="text-3xl font-bold tabular-nums"
        style={{ color }}
      >
        {prefix}
        {value.toLocaleString("vi-VN")}
        {suffix}
      </div>
      <p className="text-xs text-muted mt-1 leading-snug">{label}</p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   COMPONENT PHỤ: Giả lập nút temperature bên trong một công cụ AI
   ──────────────────────────────────────────────────────────── */

function MockTemperatureUI() {
  const [level, setLevel] = useState<0 | 1 | 2>(1);

  const modes = [
    {
      id: 0 as const,
      label: "Trung thành",
      subLabel: "T ≈ 0.2",
      icon: Snowflake,
      color: "#0ea5e9",
      sample: "Buổi họp sáng nay đã thống nhất kế hoạch quý 3.",
      desc: "Khi cần chính xác, nhất quán",
    },
    {
      id: 1 as const,
      label: "Cân bằng",
      subLabel: "T ≈ 0.7",
      icon: MessageSquare,
      color: "#10b981",
      sample:
        "Buổi họp sáng nay là một trong những cuộc trao đổi thẳng thắn nhất tuần này — cả nhóm rời phòng với kế hoạch rõ ràng cho quý 3.",
      desc: "Mặc định cho phần lớn công việc",
    },
    {
      id: 2 as const,
      label: "Sáng tạo",
      subLabel: "T ≈ 1.2",
      icon: Flame,
      color: "#f59e0b",
      sample:
        "Có những buổi họp đi qua như sương — và có buổi họp làm mình nhớ lại vì sao mình chọn công việc này. Sáng nay thuộc loại thứ hai.",
      desc: "Khi cần ý tưởng có hồn",
    },
  ];

  const active = modes.find((m) => m.id === level) ?? modes[1];
  const Icon = active.icon;

  return (
    <div className="rounded-2xl border border-border bg-surface/40 p-5">
      <p className="text-[11px] font-semibold text-tertiary uppercase tracking-wide mb-3">
        Giao diện mô phỏng: công cụ AI cho chỉnh 3 mức
      </p>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Thermometer size={16} className="text-accent" />
          <span className="text-sm font-semibold text-foreground">
            Chọn phong cách viết
          </span>
        </div>
        <span
          className="text-[11px] font-bold px-2 py-0.5 rounded-full tabular-nums"
          style={{ backgroundColor: active.color + "22", color: active.color }}
        >
          {active.subLabel}
        </span>
      </div>

      {/* Pills */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {modes.map((m) => {
          const ModeIcon = m.icon;
          const isActive = m.id === level;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setLevel(m.id)}
              className={`rounded-xl border p-2.5 text-left transition-colors ${
                isActive
                  ? "text-white border-transparent"
                  : "bg-card border-border text-foreground hover:bg-surface"
              }`}
              style={{
                backgroundColor: isActive ? m.color : undefined,
              }}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <ModeIcon size={12} />
                <span className="text-xs font-semibold">{m.label}</span>
              </div>
              <span
                className={`text-[10px] ${isActive ? "text-white/80" : "text-muted"}`}
              >
                {m.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* Preview box */}
      <div
        className="rounded-xl border bg-card p-4"
        style={{ borderColor: active.color + "66" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Icon size={14} style={{ color: active.color }} />
          <span
            className="text-[11px] font-semibold uppercase tracking-wide"
            style={{ color: active.color }}
          >
            Xem trước
          </span>
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={active.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="text-sm text-foreground/90 leading-relaxed"
          >
            {active.sample}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   COMPONENT CHÍNH
   ──────────────────────────────────────────────────────────── */

export default function TemperatureInCreativeWriting() {
  // Timeline item selection
  const [timelineIdx, setTimelineIdx] = useState(2); // ChatGPT default
  const activeTool = useMemo(() => WRITING_TIMELINE[timelineIdx], [timelineIdx]);

  return (
    <ApplicationLayout metadata={metadata} parentTitleVi="Temperature">
      {/* ━━━ HERO — Timeline của các công cụ viết sáng tạo bằng AI ━━━ */}
      <ApplicationHero
        parentTitleVi="Temperature"
        topicSlug="temperature-in-creative-writing"
      >
        <p>
          Từ 2019 đến nay, lần lượt các công cụ AI viết sáng tạo &mdash; từ{" "}
          <strong>AI Dungeon</strong> (kể chuyện phiêu lưu), <strong>Sudowrite</strong>{" "}
          (trợ lý nhà văn tiểu thuyết), <strong>ChatGPT</strong>, <strong>Notion AI</strong>{" "}
          cho đến <strong>Claude</strong> &mdash; đều có một tham số ẩn gọi là{" "}
          <em>temperature</em> (nhiệt độ) quyết định AI sẽ trả lời &ldquo;an toàn&rdquo; hay
          &ldquo;liều lĩnh&rdquo;. Cái nút nhỏ này đã giúp hàng triệu người dùng văn phòng có
          được một AI <strong>vừa biết viết email đúng mực, vừa biết sáng tác thơ có hồn</strong>.
        </p>

        {/* Timeline tương tác */}
        <div className="not-prose my-6">
          <div className="relative">
            {/* Đường timeline */}
            <div className="absolute left-0 right-0 top-5 h-0.5 bg-border" />
            {/* Điểm timeline */}
            <div className="relative grid grid-cols-5 gap-2">
              {WRITING_TIMELINE.map((item, idx) => {
                const active = idx === timelineIdx;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setTimelineIdx(idx)}
                    className="flex flex-col items-center text-center group"
                  >
                    <motion.span
                      aria-hidden
                      className="mb-2 block h-3 w-3 rounded-full border-2 bg-background transition-colors"
                      style={{
                        borderColor: active ? item.color : "var(--border)",
                        backgroundColor: active ? item.color : "var(--bg-background)",
                      }}
                      animate={{ scale: active ? 1.4 : 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    />
                    <span
                      className={`text-xs font-bold ${active ? "" : "text-muted"}`}
                      style={{ color: active ? item.color : undefined }}
                    >
                      {item.year}
                    </span>
                    <span
                      className={`text-[11px] leading-tight mt-0.5 ${active ? "font-semibold text-foreground" : "text-muted"}`}
                    >
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Thẻ mô tả công cụ đang chọn */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTool.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="mt-5 rounded-xl border bg-card p-4"
              style={{ borderLeft: `4px solid ${activeTool.color}` }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-base font-semibold text-foreground">
                  {activeTool.name}
                </h3>
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: activeTool.color + "22",
                    color: activeTool.color,
                  }}
                >
                  {activeTool.year}
                </span>
              </div>
              <p className="text-sm text-foreground/80 italic mb-2">
                {activeTool.tagline}
              </p>
              <p className="text-xs text-muted leading-relaxed">
                {activeTool.temperatureStory}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <p>
          Bài này sẽ đi sâu vào <strong>ChatGPT</strong> &mdash; công cụ đại chúng nhất. Bạn sẽ
          thấy cách OpenAI dùng temperature để biến cùng một mô hình thành trợ lý tra cứu cho
          kế toán, trợ lý viết email cho thư ký, và trợ lý brainstorm cho marketing &mdash;
          tất cả bằng một con số duy nhất.
        </p>
      </ApplicationHero>

      {/* ━━━ PROBLEM — So sánh hai loại công cụ ━━━ */}
      <ApplicationProblem topicSlug="temperature-in-creative-writing">
        <p>
          Một mô hình ngôn ngữ lớn (large language model &mdash; loại AI học từ hàng tỷ trang
          văn bản) phải phục vụ <strong>hai nhu cầu hoàn toàn trái ngược</strong> cùng lúc:
        </p>
        <ul>
          <li>
            <strong>Nhu cầu A:</strong> trả lời <em>chính xác</em>. Kế toán hỏi &ldquo;1 + 1&rdquo;
            phải ra 2, mỗi lần đều ra 2.
          </li>
          <li>
            <strong>Nhu cầu B:</strong> viết <em>đa dạng</em>. Marketer xin 10 caption Tết phải
            nhận 10 câu khác nhau, có hồn, có cá tính.
          </li>
        </ul>
        <p>
          Nếu AI luôn chọn &ldquo;phương án chắc nhất&rdquo;, caption sẽ nhàm. Nếu AI luôn chọn
          &ldquo;phương án ngẫu nhiên&rdquo;, kế toán sẽ bỏ chạy. Temperature chính là cái
          &ldquo;nút vặn&rdquo; giữa hai nhu cầu này.
        </p>

        <div className="not-prose my-5">
          <ToggleCompare
            labelA="Công cụ KHÔNG cho chỉnh"
            labelB="Công cụ CHO chỉnh"
            description="Cùng một câu hỏi — trải nghiệm rất khác tuỳ công cụ có lộ nút chỉnh ra không."
            childA={
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-muted" />
                  <span className="text-sm font-semibold text-foreground">
                    Trường hợp: ChatGPT web (người dùng thường)
                  </span>
                </div>
                <div className="rounded-lg border border-border bg-surface/50 p-3 space-y-2">
                  <div className="text-[11px] text-tertiary uppercase tracking-wide">Bạn gõ</div>
                  <div className="text-sm text-foreground">
                    &ldquo;Viết 3 caption Tết cho cửa hàng bánh quy.&rdquo;
                  </div>
                </div>
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/60 p-3 text-sm text-foreground/85 leading-relaxed">
                  ChatGPT tự chọn temperature hợp lý ở hậu trường (~0.8). Bạn <strong>không
                  cần biết</strong> temperature là gì, kết quả vẫn ổn. Đánh đổi: khi muốn sáng
                  tạo hơn/nghiêm túc hơn, bạn phải &ldquo;điều khiển&rdquo; qua prompt thay vì
                  nút vặn.
                </div>
              </div>
            }
            childB={
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <PenTool size={16} className="text-muted" />
                  <span className="text-sm font-semibold text-foreground">
                    Trường hợp: API của OpenAI / Claude (lập trình viên và marketer kỹ thuật)
                  </span>
                </div>
                <div className="rounded-lg border border-border bg-surface/50 p-3 space-y-2">
                  <div className="text-[11px] text-tertiary uppercase tracking-wide">
                    Bạn gửi API
                  </div>
                  <div className="text-sm text-foreground font-mono">
                    temperature: 1.2 &nbsp; prompt: &ldquo;Viết 3 caption Tết...&rdquo;
                  </div>
                </div>
                <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/60 p-3 text-sm text-foreground/85 leading-relaxed">
                  Bạn <strong>chọn thẳng</strong> mức ngẫu nhiên. Cần đa dạng cao &rArr; T = 1.2.
                  Cần kiểm toán chính xác &rArr; T = 0. Đánh đổi: bạn phải hiểu temperature là gì
                  và khi nào nên vặn bên nào &mdash; chính là thứ bài học này dạy.
                </div>
              </div>
            }
          />
        </div>

        <p>
          Vì thế, các công cụ viết sáng tạo phải <strong>chọn triết lý thiết kế</strong>: ẩn
          temperature đi cho đơn giản, hay lộ nó ra cho mạnh mẽ? Phần tiếp theo mô tả cách
          ChatGPT giải quyết bài toán này.
        </p>
      </ApplicationProblem>

      {/* ━━━ MECHANISM — Beats bọc trong ProgressSteps + mock UI ━━━ */}
      <ApplicationMechanism
        parentTitleVi="Temperature"
        topicSlug="temperature-in-creative-writing"
      >
        <li className="not-prose">
          <div className="mb-5">
            <ProgressSteps
              current={4}
              total={4}
              labels={[
                "Bước 1: Ẩn temperature cho giao diện web",
                "Bước 2: Lộ temperature cho API",
                "Bước 3: Tự chọn theo ngữ cảnh",
                "Bước 4: Hướng dẫn người dùng điều khiển qua prompt",
              ]}
            />
          </div>
        </li>

        <Beat step={1}>
          <p>
            <strong>Giao diện web ẩn temperature đi.</strong> Khi bạn mở ChatGPT trên
            chat.openai.com, không có thanh trượt nào. OpenAI <em>tự chọn</em> temperature ~
            0.7 &mdash; mức cân bằng phổ thông. Lý do: hầu hết người dùng mới không biết
            temperature là gì, và nếu phải hiểu mới dùng được thì rào cản sẽ quá cao.
          </p>
        </Beat>

        <Beat step={2}>
          <p>
            <strong>API cho lập trình viên chỉnh từ 0 đến 2.</strong> Ngược lại, khi một công
            ty tích hợp ChatGPT vào sản phẩm của họ (chatbot ngân hàng, trợ lý viết blog, tool
            trích xuất hợp đồng), họ cần kiểm soát chi tiết hơn. OpenAI mở cả dải 0 &ndash; 2
            và cho đặt thẳng qua tham số <code>temperature</code>. Cùng một mô hình, hai tầng
            giao diện, hai mức chuyên môn.
          </p>
          <div className="not-prose my-4">
            <MockTemperatureUI />
          </div>
        </Beat>

        <Beat step={3}>
          <p>
            <strong>Notion AI và Claude tự chọn theo ngữ cảnh.</strong> Thế hệ mới của các công
            cụ viết &mdash; Notion AI, Claude Artifacts &mdash; đi xa hơn: chúng <em>đoán</em>{" "}
            bạn đang làm gì và tự đặt temperature. Nhấn &ldquo;Summarize&rdquo; &rArr; hệ thống
            dùng T thấp. Nhấn &ldquo;Brainstorm ideas&rdquo; &rArr; hệ thống dùng T cao. Bạn
            chưa bao giờ thấy con số, nhưng nó đã làm việc thay bạn.
          </p>
        </Beat>

        <Beat step={4}>
          <p>
            <strong>Không chỉnh được nút thì chỉnh prompt.</strong> Với công cụ không lộ nút
            temperature, bạn vẫn có thể &ldquo;điều khiển&rdquo; sự sáng tạo của AI thông qua
            cách viết prompt. Thay vì hạ T, hãy viết <em>&ldquo;Trả lời ngắn gọn, chính xác,
            không bịa chi tiết.&rdquo;</em> Thay vì nâng T, hãy viết <em>&ldquo;Hãy sáng tạo,
            cho tôi 5 phiên bản rất khác nhau về tông giọng.&rdquo;</em> Cách viết prompt là
            &ldquo;nút vặn ngầm&rdquo; luôn có sẵn, kể cả khi giao diện không cho.
          </p>
        </Beat>

        <Callout variant="insight" title="Điểm chung của cả 4 bước">
          Dù nút temperature có lộ ra hay không, triết lý thiết kế đều giống nhau:{" "}
          <strong>cùng một mô hình phải phục vụ nhiều loại nhu cầu</strong> &mdash; và
          temperature là cái cầu chì cho phép nó làm được điều đó.
        </Callout>
      </ApplicationMechanism>

      {/* ━━━ METRICS — animated counters ━━━ */}
      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="temperature-in-creative-writing"
      >
        <Metric
          value="Temperature 0 cho kết quả lặp lại gần như 100% — lý tưởng cho tác vụ chính xác"
          sourceRef={1}
        />
        <Metric
          value="Temperature 0,7–0,9 được khuyến nghị phổ biến nhất cho tác vụ sáng tạo"
          sourceRef={2}
        />
        <Metric
          value="API OpenAI hỗ trợ dải temperature từ 0 đến 2, mặc định là 1"
          sourceRef={3}
        />

        {/* Animated counter dashboard (không ảnh hưởng logic Metric) */}
        <div className="not-prose mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <AnimatedCounter
            target={0}
            suffix=""
            label="T tối thiểu — output y hệt nhau mỗi lần chạy"
            color="#0ea5e9"
          />
          <AnimatedCounter
            target={100}
            suffix="%"
            label="Khả năng lặp lại kết quả khi T = 0 cho cùng một prompt"
            color="#10b981"
          />
          <AnimatedCounter
            target={2}
            suffix=""
            label="T tối đa qua API của OpenAI — gần như ngẫu nhiên hoàn toàn"
            color="#f59e0b"
          />
          <AnimatedCounter
            target={90}
            suffix="%"
            label="Số tác vụ văn phòng chỉ cần T trong khoảng 0 – 1"
            color="#ef4444"
          />
        </div>
      </ApplicationMetrics>

      {/* ━━━ COUNTERFACTUAL — so sánh trước/sau ━━━ */}
      <ApplicationCounterfactual
        parentTitleVi="Temperature"
        topicSlug="temperature-in-creative-writing"
      >
        <p>
          Hãy thử tưởng tượng AI <strong>không có</strong> tham số temperature. Chuyện gì sẽ
          xảy ra với người dùng văn phòng?
        </p>

        <div className="not-prose my-5">
          <ToggleCompare
            labelA="KHÔNG có temperature"
            labelB="CÓ temperature (thực tế)"
            description="Cùng một mô hình AI — khác biệt duy nhất là có cái 'nút vặn' sáng tạo hay không."
            childA={
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertTriangle size={16} />
                  <span className="text-sm font-semibold">Không có nút chỉnh</span>
                </div>
                <ul className="space-y-2 text-sm text-foreground/85">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-red-400 shrink-0" />
                    <span>
                      <strong>Nhà sản xuất phải chọn một tính cách.</strong> Hoặc AI luôn khô
                      khan như từ điển, hoặc luôn bay bổng như nhà thơ &mdash; không thể có
                      cả hai.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-red-400 shrink-0" />
                    <span>
                      <strong>Phải huấn luyện nhiều model khác nhau.</strong> Một cho kế toán,
                      một cho marketer, một cho nhà văn. Chi phí gấp 5 &ndash; 10 lần.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-red-400 shrink-0" />
                    <span>
                      <strong>Người dùng phải chuyển đổi công cụ liên tục.</strong> Viết
                      caption cần tool A, trích xuất dữ liệu cần tool B, brainstorm cần tool C.
                    </span>
                  </li>
                </ul>
              </div>
            }
            childB={
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <Sparkles size={16} />
                  <span className="text-sm font-semibold">Có nút chỉnh (thực tế hôm nay)</span>
                </div>
                <ul className="space-y-2 text-sm text-foreground/85">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>
                      <strong>Một mô hình, nhiều tính cách.</strong> Cùng ChatGPT nhưng hôm nay
                      là trợ lý tra cứu (T thấp), ngày mai là đồng tác giả sáng tạo (T cao).
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>
                      <strong>Chi phí huấn luyện dùng chung.</strong> OpenAI, Anthropic,
                      Google chỉ cần huấn luyện một model; tính cách được điều chỉnh{" "}
                      <em>sau</em> khi huấn luyện bằng temperature.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>
                      <strong>Một công cụ cho cả bộ phận.</strong> Kế toán, marketer và trợ lý
                      giám đốc đều dùng chung ChatGPT. Sự khác biệt nằm ở prompt và temperature,
                      không phải ở sản phẩm khác nhau.
                    </span>
                  </li>
                </ul>
              </div>
            }
          />
        </div>

        <p>
          Nói cách khác: temperature là <strong>lý do một mô hình AI có thể phục vụ cả công
          ty</strong>. Bộ phận kế toán muốn số liệu? Hạ temperature. Bộ phận sáng tạo cần ý
          tưởng? Nâng temperature. Bạn không cần đổi công cụ &mdash; chỉ cần đổi một con số.
        </p>

        <div className="not-prose my-5">
          <StepReveal
            labels={[
              "Một nút cho kế toán",
              "Một nút cho marketer",
              "Một nút cho trợ lý giám đốc",
              "Một mô hình, cả công ty dùng chung",
            ]}
          >
            {[
              <div key="a1" className="rounded-lg bg-surface/60 border border-border p-4 flex items-start gap-3">
                <FileText size={18} className="shrink-0 text-sky-500 mt-0.5" />
                <p className="text-sm text-foreground leading-relaxed">
                  Kế toán đặt T ≈ 0 qua API để trích xuất số tiền từ 10.000 hoá đơn. Cùng một
                  hoá đơn chạy lại &rArr; cùng một số &rArr; có thể kiểm toán.
                </p>
              </div>,
              <div key="a2" className="rounded-lg bg-surface/60 border border-border p-4 flex items-start gap-3">
                <Wand2 size={18} className="shrink-0 text-amber-500 mt-0.5" />
                <p className="text-sm text-foreground leading-relaxed">
                  Marketer đặt T ≈ 1.1 để xin 20 slogan Tết. Mỗi slogan khác nhau rõ rệt &rArr;
                  có đủ phương án để chọn ra &ldquo;viên ngọc&rdquo;.
                </p>
              </div>,
              <div key="a3" className="rounded-lg bg-surface/60 border border-border p-4 flex items-start gap-3">
                <MessageSquare size={18} className="shrink-0 text-emerald-500 mt-0.5" />
                <p className="text-sm text-foreground leading-relaxed">
                  Trợ lý giám đốc đặt T ≈ 0.6 để viết email mời họp cho 50 khách. Lịch sự, tự
                  nhiên, không máy móc, vẫn an toàn.
                </p>
              </div>,
              <div key="a4" className="rounded-lg bg-accent-light border border-accent/30 p-4 flex items-start gap-3">
                <BookOpen size={18} className="shrink-0 text-accent mt-0.5" />
                <p className="text-sm text-foreground leading-relaxed">
                  Cả ba người đều dùng <strong>cùng một ChatGPT</strong>. Công ty không phải
                  mua 3 phần mềm khác nhau &mdash; chỉ cần 3 mức temperature khác nhau cho 3
                  nhu cầu khác nhau.
                </p>
              </div>,
            ]}
          </StepReveal>
        </div>

        <p>
          Đây chính là lý do temperature tuy chỉ là <em>một con số nhỏ</em> nhưng lại là một
          trong những phát minh thiết kế quan trọng nhất khiến AI trở thành công cụ văn phòng
          đại chúng.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
