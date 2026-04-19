"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
  MiniSummary,
  ToggleCompare,
  MatchPairs,
  Reorderable,
  LessonSection,
  TabView,
  TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "agentic-workflows",
  title: "Agentic Workflows",
  titleVi: "Quy trình AI tự chủ — không code, kéo thả là xong",
  description:
    "Zapier, Make, n8n, Gumloop, Dify — năm công cụ cho phép người làm văn phòng Việt dựng quy trình AI tự động mà không viết một dòng code.",
  category: "ai-agents",
  tags: ["no-code", "automation", "zapier", "make", "n8n"],
  difficulty: "beginner",
  relatedSlugs: [
    "ai-coding-assistants",
    "prompt-engineering",
    "llm-overview",
  ],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

// ─────────────────────────────────────────────────────────────
// Dữ liệu — 5 công cụ no-code phổ biến
// ─────────────────────────────────────────────────────────────

interface Tool {
  name: string;
  tagline: string;
  strength: string;
  weakness: string;
  color: string;
  bestFor: string;
  pricing: string;
  learningCurve: "Dễ" | "Vừa" | "Khó";
}

const TOOLS: Tool[] = [
  {
    name: "Zapier AI",
    tagline: "Nhanh nhất để bắt đầu, đã có sẵn 7000+ kết nối app.",
    strength:
      "Ghép nối Gmail, Google Sheets, Slack, Zalo OA, Shopify chỉ vài cú click.",
    weakness:
      "Bước logic phức tạp (if/else nhiều tầng) làm khó. Giá tăng nhanh khi chạy nhiều.",
    color: "#f97316",
    bestFor: "Phòng marketing nhỏ cần nối lead từ Facebook Ads vào Google Sheets.",
    pricing: "Gói miễn phí 100 task/tháng, trả phí từ ~20 USD/tháng.",
    learningCurve: "Dễ",
  },
  {
    name: "Make.com",
    tagline: "Màn hình kéo-thả trực quan nhất, nhìn từng bước như sơ đồ.",
    strength:
      "Chi tiết từng trường dữ liệu giữa các bước, rẻ hơn Zapier ở mức dùng cao.",
    weakness:
      "Học cong hơi cong lúc đầu — phải quen với khái niệm 'scenario' và 'module'.",
    color: "#6366f1",
    bestFor: "Công ty thương mại điện tử tự đồng bộ đơn hàng giữa nhiều hệ thống.",
    pricing: "Gói miễn phí 1000 ops/tháng, trả phí từ ~9 USD/tháng.",
    learningCurve: "Vừa",
  },
  {
    name: "n8n",
    tagline: "Tự lưu trữ trên máy chủ công ty — dữ liệu không ra ngoài.",
    strength: "Mã nguồn mở, tự host được, phù hợp ngành yêu cầu bảo mật chặt.",
    weakness:
      "Cần có người biết chút kỹ thuật để dựng máy chủ ban đầu.",
    color: "#ef4444",
    bestFor: "Ngân hàng, bệnh viện, công ty luật cần giữ dữ liệu tại Việt Nam.",
    pricing: "Miễn phí khi tự host. Bản cloud ~20 USD/tháng.",
    learningCurve: "Vừa",
  },
  {
    name: "Gumloop",
    tagline:
      "Sinh sau đẻ muộn nhưng cực mạnh cho quy trình 'có suy nghĩ' — tức có AI ở mỗi bước.",
    strength:
      "Nội bộ gắn AI rất sâu, phù hợp quy trình phân tích dài (đọc, tóm tắt, phân loại).",
    weakness: "Ít kết nối app ngoài hơn Zapier / Make.",
    color: "#10b981",
    bestFor: "Đội nghiên cứu tự động đọc 50 bản tin mỗi ngày, tóm tắt vào Notion.",
    pricing: "Gói miễn phí giới hạn, trả phí từ ~97 USD/tháng.",
    learningCurve: "Vừa",
  },
  {
    name: "Dify",
    tagline:
      "Tập trung xây chatbot và agent nội bộ — có giao diện riêng cho người dùng.",
    strength:
      "Xây chatbot dựa trên tài liệu công ty nhanh, có thể nhúng lên web.",
    weakness: "Ít phù hợp cho tự động hoá cross-app kiểu Zapier.",
    color: "#0ea5e9",
    bestFor: "Phòng nhân sự dựng chatbot trả lời câu hỏi về chính sách công ty.",
    pricing: "Mã nguồn mở, tự host miễn phí. Bản cloud trả phí.",
    learningCurve: "Vừa",
  },
];

// Ví dụ workflow văn phòng Việt
interface Example {
  title: string;
  trigger: string;
  actions: string[];
  savings: string;
  industry: string;
  color: string;
}

const EXAMPLES: Example[] = [
  {
    title: "Trợ lý email chăm sóc khách",
    trigger: "Có email mới vào hộp thư hỗ trợ",
    actions: [
      "AI đọc và phân loại (than phiền / hỏi / mua hàng)",
      "AI dịch nếu email tiếng Anh sang tiếng Việt",
      "Tạo thẻ Trello cho bộ phận đúng",
      "Gửi Slack cho trưởng nhóm nếu là khiếu nại",
    ],
    savings: "Tiết kiệm 2 giờ/ngày cho trợ lý phòng CSKH.",
    industry: "Công ty bán lẻ, dịch vụ",
    color: "#f97316",
  },
  {
    title: "Tóm tắt cuộc họp tự động",
    trigger: "Zoom ghi âm xong một cuộc họp",
    actions: [
      "Tải file về OneDrive",
      "AI chuyển giọng thành chữ (tiếng Việt)",
      "AI tóm tắt 5 điểm chính + danh sách hành động",
      "Gửi bản tóm tắt vào kênh Microsoft Teams của dự án",
    ],
    savings: "Mỗi cuộc họp 1 giờ tiết kiệm 20 phút ghi biên bản.",
    industry: "Mọi văn phòng có Zoom/Teams",
    color: "#6366f1",
  },
  {
    title: "Đẩy đơn Shopee vào báo cáo",
    trigger: "Có đơn hàng mới trên Shopee",
    actions: [
      "Lấy thông tin đơn: mã, giá, sản phẩm, địa chỉ",
      "AI phân loại vùng giao (Bắc/Trung/Nam)",
      "Ghi vào Google Sheets quản lý doanh thu",
      "Nếu tỉnh xa, báo Zalo cho bộ phận vận chuyển",
    ],
    savings: "Thay thế việc nhập tay ~15 phút/ngày cho chủ shop nhỏ.",
    industry: "Bán hàng online",
    color: "#22c55e",
  },
  {
    title: "Sàng lọc CV ứng viên",
    trigger: "Có CV mới gửi vào email tuyển dụng",
    actions: [
      "AI đọc PDF CV, rút các trường: tên, năm KN, kỹ năng",
      "So với mô tả vị trí bằng AI — cho điểm 1-10",
      "Ghi vào bảng ứng viên trên Airtable",
      "Nếu điểm ≥ 8, gửi thư mời phỏng vấn tự động",
    ],
    savings: "HR giảm 70% thời gian sàng CV vòng đầu.",
    industry: "Phòng nhân sự mọi quy mô",
    color: "#ef4444",
  },
  {
    title: "Bản tin ngành mỗi sáng",
    trigger: "Đúng 7:00 sáng mỗi ngày",
    actions: [
      "Đọc 10 website ngành (tin kinh tế, công nghệ)",
      "AI tóm tắt mỗi bài 2 câu bằng tiếng Việt",
      "Gộp thành báo cáo PDF",
      "Gửi email cho 5 sếp trong công ty",
    ],
    savings: "Thay thế chính thức một vị trí 'thư ký tin tức' phần thấp.",
    industry: "Lãnh đạo công ty, phòng chiến lược",
    color: "#0ea5e9",
  },
];

// Blocks cho flow-builder demo (Reorderable)
const FLOW_BLOCKS = [
  "Email mới vào hộp hỗ trợ",
  "AI đọc và phân loại nội dung",
  "AI dịch nếu email tiếng Anh",
  "Ghi vào bảng Google Sheets",
  "Gửi cảnh báo Slack nếu là khiếu nại",
];

// ─────────────────────────────────────────────────────────────
// Component: Flow builder mock (drag-style)
// ─────────────────────────────────────────────────────────────

interface FlowBlock {
  icon: string;
  label: string;
  sub: string;
  tone: string;
}

const BUILT_FLOW: FlowBlock[] = [
  {
    icon: "✉",
    label: "Gmail",
    sub: "Khi có email mới có nhãn 'Khách hàng'",
    tone: "#ea4335",
  },
  {
    icon: "AI",
    label: "Claude",
    sub: "Tóm tắt email trong 3 câu",
    tone: "#f97316",
  },
  {
    icon: "文",
    label: "Google Dịch",
    sub: "Dịch sang tiếng Việt nếu email không tiếng Việt",
    tone: "#4285f4",
  },
  {
    icon: "▤",
    label: "Google Sheets",
    sub: "Ghi vào hàng mới: ngày, người gửi, tóm tắt",
    tone: "#0f9d58",
  },
  {
    icon: "✓",
    label: "Slack",
    sub: "Gửi tin tới kênh #cskh",
    tone: "#611f69",
  },
];

function FlowBuilderMock() {
  return (
    <div className="rounded-xl border border-border bg-[#0f1427] overflow-hidden shadow-inner">
      <div className="flex items-center justify-between bg-[#151b33] px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
          <span className="ml-3 text-[11px] font-mono text-slate-400">
            Make.com — scenario "Email khách hàng"
          </span>
        </div>
        <span className="text-[10px] font-mono text-green-400">● đang chạy</span>
      </div>

      <div className="p-5 space-y-2">
        {BUILT_FLOW.map((b, i) => (
          <div key={b.label}>
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="flex items-center gap-3 rounded-lg border border-border bg-[#1a2040] px-3 py-2.5"
              style={{ borderLeft: `3px solid ${b.tone}` }}
            >
              <div
                className="h-9 w-9 rounded-md flex items-center justify-center text-lg font-bold text-white"
                style={{ background: b.tone }}
              >
                {b.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-100 font-semibold">
                  {b.label}
                </p>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {b.sub}
                </p>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                #{i + 1}
              </span>
            </motion.div>
            {i < BUILT_FLOW.length - 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 + 0.08 }}
                className="flex justify-center"
              >
                <span className="text-slate-500 text-xs">↓</span>
              </motion.div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-[#151b33] px-4 py-2 border-t border-border flex justify-between text-[10px] font-mono text-slate-400">
        <span>5 bước nối tiếp — không có dòng code nào</span>
        <span>Chi phí: ~0.01 USD mỗi lần chạy</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sơ đồ Trigger → Action (animated)
// ─────────────────────────────────────────────────────────────

function TriggerActionDiagram() {
  const nodes = [
    { id: "trigger", label: "Trigger", sub: "Sự kiện kích hoạt", color: "#22c55e", x: 80 },
    { id: "ai", label: "AI Node", sub: "Suy nghĩ / tóm tắt / dịch", color: "#f97316", x: 260 },
    { id: "filter", label: "Điều kiện", sub: "Nếu... thì...", color: "#a855f7", x: 440 },
    { id: "action", label: "Action", sub: "Hành động cuối", color: "#0ea5e9", x: 620 },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-semibold text-foreground mb-1">
        Bộ phận của một workflow
      </p>
      <p className="text-[11px] text-muted mb-3">
        Một workflow = <strong>trigger</strong> (sự kiện kích hoạt) +{" "}
        <strong>nhiều bước</strong> (AI, điều kiện, gọi app khác) +{" "}
        <strong>action</strong> (hành động cuối).
      </p>

      <svg viewBox="0 0 720 160" className="w-full">
        <defs>
          <marker
            id="arr-aw"
            markerWidth="10"
            markerHeight="8"
            refX="9"
            refY="4"
            orient="auto"
          >
            <polygon points="0 0, 10 4, 0 8" fill="#64748b" />
          </marker>
        </defs>

        {/* lines */}
        {nodes.slice(0, -1).map((n, i) => {
          const next = nodes[i + 1];
          return (
            <g key={`edge-${i}`}>
              <line
                x1={n.x + 55}
                y1={80}
                x2={next.x - 55}
                y2={80}
                stroke="#64748b"
                strokeWidth={2}
                markerEnd="url(#arr-aw)"
              />
              <motion.circle
                r={4}
                fill={n.color}
                initial={{ cx: n.x + 55, cy: 80, opacity: 0 }}
                animate={{
                  cx: [n.x + 55, next.x - 55],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: "linear",
                }}
              />
            </g>
          );
        })}

        {/* nodes */}
        {nodes.map((n) => (
          <g key={n.id}>
            <rect
              x={n.x - 55}
              y={55}
              width={110}
              height={50}
              rx={10}
              fill={n.color}
              opacity={0.9}
            />
            <text
              x={n.x}
              y={78}
              textAnchor="middle"
              fill="white"
              fontSize={12}
              fontWeight={700}
            >
              {n.label}
            </text>
            <text
              x={n.x}
              y={94}
              textAnchor="middle"
              fill="white"
              fontSize={9}
              opacity={0.85}
            >
              {n.sub}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Manual vs Workflow comparison
// ─────────────────────────────────────────────────────────────

function ManualVsAutomatic() {
  return (
    <ToggleCompare
      labelA="Làm tay mỗi ngày"
      labelB="Workflow tự động"
      description="Cùng một việc: tóm tắt email khách và ghi vào bảng theo dõi."
      childA={
        <div className="space-y-2 text-sm">
          <Row emoji="✉" text="Mở Gmail, đọc từng email mới (mất 20 phút)" />
          <Row emoji="✍" text="Viết tóm tắt tay trong Notes (mất 15 phút)" />
          <Row emoji="▤" text="Mở Google Sheets, nhập từng dòng (mất 10 phút)" />
          <Row emoji="☎" text="Báo sếp khi có email khiếu nại (quên 1 lần / tuần)" />
          <p className="text-xs text-muted mt-3">
            Tổng: <strong>45 phút mỗi ngày</strong> = 15 giờ/tháng = gần 2 ngày
            công bị "ăn" bởi việc lặp.
          </p>
        </div>
      }
      childB={
        <div className="space-y-2 text-sm">
          <Row emoji="⚙" text="Workflow chạy ngầm, phát hiện email mới" />
          <Row emoji="AI" text="AI tóm tắt và phân loại tự động trong 3 giây" />
          <Row emoji="▤" text="Ghi vào Sheets cũng trong 3 giây" />
          <Row emoji="🔔" text="Slack cảnh báo sếp ngay khi có khiếu nại — không bao giờ quên" />
          <p className="text-xs text-muted mt-3">
            Tổng: <strong>gần 0 phút mỗi ngày</strong> — chỉ tốn khoảng 15 phút{" "}
            <em>một lần</em> lúc dựng workflow ban đầu.
          </p>
        </div>
      }
    />
  );
}

function Row({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-surface px-3 py-2">
      <span className="text-lg">{emoji}</span>
      <span className="flex-1 text-foreground">{text}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tool comparison in TabView
// ─────────────────────────────────────────────────────────────

function ToolCard({ tool }: { tool: Tool }) {
  return (
    <div
      className="rounded-xl border p-4 space-y-2"
      style={{ borderColor: tool.color + "55", background: tool.color + "0f" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-base font-bold" style={{ color: tool.color }}>
          {tool.name}
        </p>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: tool.color + "22", color: tool.color }}
        >
          Học: {tool.learningCurve}
        </span>
      </div>
      <p className="text-xs italic text-foreground/90">{tool.tagline}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
        <div className="rounded-md bg-card border border-border p-2">
          <p className="text-[10px] uppercase font-bold text-muted">Mạnh</p>
          <p className="text-xs text-foreground/90 mt-1">{tool.strength}</p>
        </div>
        <div className="rounded-md bg-card border border-border p-2">
          <p className="text-[10px] uppercase font-bold text-muted">Yếu</p>
          <p className="text-xs text-foreground/90 mt-1">{tool.weakness}</p>
        </div>
      </div>
      <div className="pt-2 border-t border-border/50 text-xs text-muted leading-relaxed">
        <p>
          <strong className="text-foreground">Phù hợp nhất:</strong>{" "}
          {tool.bestFor}
        </p>
        <p className="mt-1">
          <strong className="text-foreground">Chi phí:</strong> {tool.pricing}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 5 ví dụ như Callout cards
// ─────────────────────────────────────────────────────────────

function ExampleCards() {
  return (
    <div className="grid md:grid-cols-2 gap-3">
      {EXAMPLES.map((ex, i) => (
        <motion.div
          key={ex.title}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08 }}
          className="rounded-xl border p-4 bg-card"
          style={{ borderLeft: `4px solid ${ex.color}` }}
        >
          <div className="flex justify-between items-start gap-2 mb-2">
            <p className="text-sm font-bold text-foreground leading-snug">
              {ex.title}
            </p>
            <span
              className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full shrink-0"
              style={{
                background: ex.color + "22",
                color: ex.color,
              }}
            >
              {ex.industry}
            </span>
          </div>
          <p className="text-xs text-muted mb-2">
            <strong className="text-foreground">Kích hoạt:</strong> {ex.trigger}
          </p>
          <ol className="space-y-1 mb-2">
            {ex.actions.map((a, j) => (
              <li
                key={j}
                className="text-xs text-foreground/85 flex gap-2 leading-relaxed"
              >
                <span
                  className="font-mono text-[10px] mt-0.5 shrink-0"
                  style={{ color: ex.color }}
                >
                  {j + 1}.
                </span>
                <span>{a}</span>
              </li>
            ))}
          </ol>
          <p className="text-[11px] italic text-emerald-600 dark:text-emerald-400">
            {ex.savings}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Quiz
// ─────────────────────────────────────────────────────────────

const QUIZ: QuizQuestion[] = [
  {
    question:
      "Workflow AI kiểu Zapier / Make là gì, nói đơn giản nhất?",
    options: [
      "Một dạng virus máy tính",
      "Một chuỗi các bước tự động, kéo thả bằng chuột, không cần viết code — giống dây chuyền nhà máy nhưng cho công việc văn phòng",
      "Một loại trò chơi điện tử",
    ],
    correct: 1,
    explanation:
      "Workflow = trigger (sự kiện kích hoạt) + nhiều bước (AI, điều kiện, gọi app) + action (hành động cuối). Người dùng kéo khối vào, nối lại như trò xếp hình. Không code, không cần IT.",
  },
  {
    question:
      "Điểm khác biệt lớn nhất giữa Zapier và n8n là gì?",
    options: [
      "Zapier nhanh hơn, n8n chậm hơn",
      "Zapier là dịch vụ đám mây (dữ liệu đi qua máy chủ của họ); n8n có thể tự host ngay trên máy chủ công ty, giữ dữ liệu trong nhà",
      "Zapier miễn phí, n8n trả phí",
    ],
    correct: 1,
    explanation:
      "Với ngành yêu cầu bảo mật cao (ngân hàng, bệnh viện, công ty luật), n8n tự host là lựa chọn an toàn vì dữ liệu không rời khỏi máy chủ nội bộ. Zapier tiện hơn cho doanh nghiệp vừa và nhỏ vì không cần bảo trì hạ tầng.",
  },
  {
    question:
      "Một khoản 'chi phí ẩn' mà người mới làm workflow hay bỏ quên là?",
    options: [
      "Tiền điện",
      "Chi phí gọi AI: mỗi bước AI là một lần gọi API, chạy 1000 lần/ngày có thể thành vài trăm nghìn đồng/tháng nếu không giới hạn",
      "Tiền thuê bao internet",
    ],
    correct: 1,
    explanation:
      "Workflow chạy lặp rất nhiều lần. Mỗi lần AI tóm tắt tốn ~0.01 USD — không nhiều — nhưng nhân với 10.000 lượt/tháng thì thành con số đáng kể. Luôn đặt giới hạn số lần chạy và theo dõi chi phí tháng đầu.",
  },
  {
    question:
      "Khi nào bạn KHÔNG nên dùng workflow tự động?",
    options: [
      "Khi việc lặp đi lặp lại hàng ngày",
      "Khi quyết định có rủi ro cao (ví dụ: chuyển tiền, ký hợp đồng) — các bước này cần có người duyệt, không nên để AI tự chạy đến cùng",
      "Khi có nhiều app cần nối với nhau",
    ],
    correct: 1,
    explanation:
      "Quy tắc vàng: workflow tốt cho việc lặp lại & rủi ro thấp (sàng email, ghi dữ liệu, báo cáo). Với việc rủi ro cao — chuyển tiền, duyệt hợp đồng, tuyển dụng cuối — phải có 'chốt người' ở bước cuối. AI đề xuất, người duyệt.",
  },
  {
    type: "fill-blank",
    question:
      "Năm công cụ workflow no-code phổ biến là {blank}, {blank}, {blank}, {blank} và {blank}.",
    blanks: [
      { answer: "Zapier", accept: ["zapier"] },
      { answer: "Make", accept: ["make.com", "make"] },
      { answer: "n8n", accept: ["N8N"] },
      { answer: "Gumloop", accept: ["gumloop"] },
      { answer: "Dify", accept: ["dify"] },
    ],
    explanation:
      "Zapier (tiện nhất), Make (kéo-thả đẹp), n8n (tự host), Gumloop (AI sâu), Dify (chatbot nội bộ). Mỗi cái có thế mạnh riêng — không có cái 'tốt nhất', chỉ có cái phù hợp nhất với nhu cầu của bạn.",
  },
];

// ─────────────────────────────────────────────────────────────
// Component chính
// ─────────────────────────────────────────────────────────────

export default function AgenticWorkflowsTopic() {
  const matchPairs = useMemo(
    () => [
      { left: "Zapier AI", right: "Nhanh, nhiều app nhất, phí tăng khi chạy nhiều" },
      { left: "Make.com", right: "Kéo-thả trực quan, rẻ hơn khi chạy nhiều bước" },
      { left: "n8n", right: "Mã nguồn mở, tự host, dữ liệu không rời công ty" },
      { left: "Gumloop", right: "Tập trung vào AI sâu, phù hợp phân tích dài" },
      { left: "Dify", right: "Xây chatbot nội bộ dựa trên tài liệu công ty" },
    ],
    [],
  );

  return (
    <>
      {/* ───────── 1. DỰ ĐOÁN ───────── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Một nhân viên văn phòng Việt mất bao nhiêu thời gian mỗi tuần cho các việc lặp đi lặp lại có thể tự động hoá?"
          options={[
            "Dưới 1 giờ",
            "Khoảng 3-5 giờ",
            "Khoảng 8-12 giờ",
            "Hơn 20 giờ",
          ]}
          correct={2}
          explanation="Các khảo sát toàn cầu cho thấy 8-12 giờ/tuần cho những việc như: sàng email, nhập dữ liệu giữa các hệ thống, tóm tắt cuộc họp, copy-paste báo cáo. Đây chính xác là loại công việc workflow AI xử lý rất tốt mà bạn không cần viết một dòng code nào."
        >
          <p className="mt-2 text-sm text-muted">
            Bài hôm nay giới thiệu <strong>workflow AI kiểu no-code</strong>:
            Zapier, Make, n8n, Gumloop, Dify. Đây là các công cụ cho phép bạn
            dựng quy trình "AI tự chạy nhiều bước" bằng cách kéo-thả — không
            cần biết lập trình.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ───────── 2. ẨN DỤ ───────── */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Ẩn dụ quen thuộc">
        <p>
          Hãy tưởng tượng một <strong>dây chuyền trong nhà máy</strong>. Mỗi
          công nhân đứng một vị trí, làm một việc rất nhỏ: lấy linh kiện, vặn
          ốc, dán nhãn, xếp vào hộp. Công nhân không cần biết hết quy trình —
          chỉ làm việc của mình khi có đồ tới.
        </p>
        <p>
          Workflow AI y hệt dây chuyền đó, nhưng thay vì công nhân là{" "}
          <strong>các khối phần mềm nhỏ</strong>: "đọc email", "AI tóm tắt",
          "ghi vào Sheets", "gửi Zalo". Khác biệt quan trọng: bạn{" "}
          <strong>kéo thả để cấu hình</strong> chứ không xây bằng tay từng
          công nhân. Các công cụ như Zapier và Make biến việc dựng dây chuyền
          thành trò ghép hình.
        </p>
        <Callout variant="insight" title="Tại sao đây là cuộc cách mạng im lặng?">
          Trước 2023 muốn nối hai phần mềm (ví dụ Gmail + Google Sheets) phải
          thuê lập trình viên. Bây giờ: một chị phòng kế toán có thể tự làm
          trong 15 phút. Sức mạnh không còn nằm ở "biết code" — mà ở "biết
          sắp xếp công việc".
        </Callout>
      </LessonSection>

      {/* ───────── 3. TRỰC QUAN HOÁ ───────── */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Nhìn tận mắt">
        <VisualizationSection>
          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">
                Demo 1 — Bên trong một công cụ kéo-thả
              </p>
              <p className="text-xs text-muted mb-3">
                Đây là ảnh chụp dựng lại của một scenario trong Make.com. Mỗi
                khối là một bước; mũi tên chạy từ trên xuống là dòng dữ liệu.
              </p>
              <FlowBuilderMock />
            </div>

            <LessonSection label="Demo 1b — Thử sắp lại thứ tự các bước">
              <p className="text-xs text-muted mb-3">
                Kéo các khối về đúng thứ tự của workflow 'trợ lý email CSKH'.
                Thứ tự logic: trigger → AI xử lý → ghi dữ liệu → thông báo.
              </p>
              <Reorderable
                items={FLOW_BLOCKS}
                correctOrder={[0, 1, 2, 3, 4]}
                instruction="Kéo khối về đúng thứ tự rồi nhấn 'Kiểm tra'."
              />
            </LessonSection>

            <LessonSection label="Demo 2 — Thủ công mỗi ngày vs workflow tự động">
              <ManualVsAutomatic />
            </LessonSection>

            <LessonSection label="Demo 3 — Năm công cụ no-code phổ biến">
              <p className="text-xs text-muted mb-3">
                Mỗi công cụ có một triết lý thiết kế. Xem qua từng tab, sau
                đó thử ghép tên với thế mạnh ở phần dưới.
              </p>
              <TabView
                tabs={TOOLS.map((t) => ({
                  label: t.name,
                  content: <ToolCard tool={t} />,
                }))}
              />
              <div className="mt-4">
                <MatchPairs
                  pairs={matchPairs}
                  instruction="Nối tên công cụ bên trái với mô tả thế mạnh bên phải."
                />
              </div>
            </LessonSection>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ───────── 4. AHA ───────── */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          <p>
            Sức mạnh workflow AI no-code không phải ở việc{" "}
            <strong>AI giỏi đến đâu</strong>, mà ở việc bạn có thể{" "}
            <strong>ghép AI vào giữa</strong> hai phần mềm mà bình thường
            không nói chuyện được với nhau — Gmail và Google Sheets, Shopee và
            Zalo, Zoom và Teams. Không cần lập trình viên, không cần phòng IT,
            không cần bất kỳ ai ngoài chính bạn. Đây là lần đầu tiên trong
            lịch sử công sở, người không code có thể tự xây hệ thống tự động
            cho mình.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ───────── 5. THỬ THÁCH ───────── */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question="Bạn là HR của công ty 300 người, mỗi tháng nhận 400 CV. Bạn muốn dựng workflow AI sàng CV. Bước nào KHÔNG nên để AI tự quyết định hoàn toàn?"
          options={[
            "Đọc PDF và rút thông tin như tên, kỹ năng, năm kinh nghiệm",
            "Cho điểm sơ bộ 1-10 dựa trên mô tả công việc",
            "Gửi thư từ chối cho ứng viên có điểm thấp — phải có người duyệt, vì từ chối một người có thể ảnh hưởng danh tiếng công ty và AI có thể sai thiên lệch",
            "Ghi điểm vào bảng Airtable",
          ]}
          correct={2}
          explanation="Quy tắc vàng: AI có thể đề xuất, nhưng quyết định 'có tính ảnh hưởng tới người' (từ chối, duyệt tiền, ký) phải có chốt người. AI có thể phân biệt giới/tuổi/trường học một cách thiên lệch mà không tự biết. Workflow tốt: AI chấm điểm + gợi ý, người duyệt cuối."
        />
      </LessonSection>

      {/* ───────── 6. GIẢI THÍCH SÂU ───────── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Đi sâu hơn">
        <ExplanationSection>
          <TriggerActionDiagram />

          <p className="text-sm mt-4">
            <strong>Ba loại khối</strong> cấu thành mọi workflow:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm pl-2">
            <li>
              <strong>Trigger (kích hoạt):</strong> sự kiện bắt đầu workflow —
              "có email mới", "đúng 7h sáng", "có đơn Shopee mới", "ai đó
              submit form".
            </li>
            <li>
              <strong>Action (hành động):</strong> việc gọi app khác làm thay
              — "tạo bản ghi trong Sheets", "gửi Slack", "tạo thẻ Trello", "gửi
              Zalo".
            </li>
            <li>
              <strong>AI node (bước thông minh):</strong> khối gọi AI giữa
              chừng — tóm tắt, phân loại, dịch, rút thông tin, sinh câu trả
              lời.
            </li>
          </ul>

          <p className="text-sm mt-4">
            Dưới đây là <strong>5 workflow văn phòng Việt thường gặp</strong>.
            Mỗi cái có thể dựng trong buổi chiều bằng Zapier hoặc Make.
          </p>

          <ExampleCards />

          <Callout variant="warning" title="Ba cạm bẫy khi mới bắt đầu">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <strong>Chi phí tăng theo lượt chạy:</strong> một workflow gọi
                AI 5000 lần/tháng có thể tốn vài trăm nghìn đồng bạn không
                để ý. Hãy đặt giới hạn & theo dõi tháng đầu.
              </li>
              <li>
                <strong>Bẫy tin cậy AI quá mức:</strong> AI đôi khi phân loại
                sai, dịch lệch nghĩa. Đừng để bước AI duyệt hoàn toàn các
                hành động quan trọng.
              </li>
              <li>
                <strong>Rò rỉ dữ liệu nhạy cảm:</strong> Zapier, Make là cloud
                — dữ liệu đi qua máy chủ nước ngoài. Nếu xử lý thông tin khách
                hàng nhạy cảm, cân nhắc n8n tự host.
              </li>
            </ul>
          </Callout>

          <Callout variant="tip" title="Khi nào nên dùng — và khi nào không">
            <p className="text-sm mb-2">
              <strong>Nên dùng khi:</strong> việc lặp đi lặp lại nhiều lần,
              rủi ro thấp, dữ liệu đã có sẵn dạng số, kết quả sai vẫn sửa được
              dễ.
            </p>
            <p className="text-sm">
              <strong>KHÔNG nên dùng khi:</strong> quyết định có ảnh hưởng
              lớn (tiền, hợp đồng, nhân sự), dữ liệu cực nhạy cảm không được
              ra ngoài, việc đòi hỏi phán đoán sáng tạo mà AI chưa làm tốt.
            </p>
          </Callout>

          <p className="text-sm">
            Workflow AI và{" "}
            <TopicLink slug="ai-coding-assistants">AI coding assistants</TopicLink>{" "}
            là hai mặt của cùng một làn sóng: AI đang thò tay vào{" "}
            <em>mọi khâu công việc</em> — cả coding lẫn văn phòng. Ai biết
            kéo-thả trước sẽ có lợi thế trước.
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ───────── 7. TÓM TẮT ───────── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ"
          points={[
            "Workflow AI = dây chuyền tự động cho công việc văn phòng — kéo thả thay vì code. Trigger → AI node → Action.",
            "Năm công cụ nên biết: Zapier (nhanh-nhiều app), Make (kéo-thả đẹp), n8n (tự host-bảo mật), Gumloop (AI sâu), Dify (chatbot nội bộ).",
            "Dùng tốt cho: sàng email, tóm tắt họp, đồng bộ đơn hàng, sàng CV, bản tin sáng — việc lặp & rủi ro thấp.",
            "Không nên để AI tự quyết định bước có ảnh hưởng lớn (duyệt tiền, từ chối người, ký hợp đồng). Luôn có 'chốt người'.",
            "Cạm bẫy: chi phí tăng theo lượt chạy, AI phân loại sai, rò rỉ dữ liệu nhạy cảm khi dùng cloud. Theo dõi tháng đầu kỹ.",
          ]}
        />
      </LessonSection>

      {/* ───────── 8. QUIZ ───────── */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
