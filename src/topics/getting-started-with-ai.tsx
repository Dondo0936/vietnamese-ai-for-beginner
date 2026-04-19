"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Bot,
  MousePointerClick,
  KeyRound,
  Eye,
  Edit3,
  FileText,
  BarChart3,
  Languages,
  Clock,
  Timer,
  ArrowRight,
} from "lucide-react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  TopicLink,
  CollapsibleDetail,
  ToggleCompare,
  MatchPairs,
  Reorderable,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

// ═══════════════════════════════════════════════════════════════════════════
// METADATA — giữ nguyên để hệ thống điều hướng nhận diện chủ đề
// ═══════════════════════════════════════════════════════════════════════════

export const metadata: TopicMeta = {
  slug: "getting-started-with-ai",
  title: "Getting Started with AI",
  titleVi: "Bắt đầu sử dụng AI",
  description:
    "Hướng dẫn tạo tài khoản, cuộc hội thoại đầu tiên, và mẹo nhận kết quả tốt trong 5 phút.",
  category: "applied-ai",
  tags: ["beginner", "practical", "office", "getting-started"],
  difficulty: "beginner",
  relatedSlugs: ["llm-overview", "prompt-engineering", "ai-tool-evaluation"],
  vizType: "interactive",
};

// ═══════════════════════════════════════════════════════════════════════════
// DỮ LIỆU — 5 BƯỚC ĐẦU TIÊN DÙNG AI
// ═══════════════════════════════════════════════════════════════════════════
//
// Demo 1 dùng danh sách 5 bước: chọn tool → mở tool → gõ prompt đơn giản
// → đọc output → điều chỉnh. Mỗi bước có một mock UI riêng được vẽ bằng
// styled div để giả lập giao diện ChatGPT / Claude.

type FirstStep = {
  id: string;
  order: number;
  title: string;
  short: string;
  detail: string;
  icon: typeof Send;
};

const FIRST_STEPS: FirstStep[] = [
  {
    id: "pick",
    order: 1,
    title: "Chọn một công cụ",
    short: "Chọn 1 trong 4 trợ lý AI phổ biến, tất cả đều có bản miễn phí.",
    detail:
      "Không quan trọng chọn đúng ngay lần đầu. ChatGPT, Claude, Gemini, Copilot đều tốt cho công việc văn phòng. Bạn có thể đổi bất cứ lúc nào.",
    icon: MousePointerClick,
  },
  {
    id: "open",
    order: 2,
    title: "Mở trang web hoặc app",
    short: "Đăng nhập bằng Google hoặc email. Không cần thẻ ngân hàng.",
    detail:
      "Sau khoảng 30 giây bạn sẽ thấy một khung chat trống. Giao diện gọn: một ô nhập phía dưới, phần hội thoại phía trên.",
    icon: KeyRound,
  },
  {
    id: "prompt",
    order: 3,
    title: "Gõ câu hỏi đầu tiên",
    short: "Viết như đang nhắn cho đồng nghiệp. Không cần thuật ngữ gì cả.",
    detail:
      'Thử: "Viết email xin nghỉ 1 ngày gửi trưởng phòng, lý do việc gia đình, giọng lịch sự, khoảng 80 từ". Càng nhiều chi tiết, càng sát ý bạn muốn.',
    icon: Send,
  },
  {
    id: "read",
    order: 4,
    title: "Đọc câu trả lời",
    short: "AI trả lời trong vài giây. Đọc kỹ và kiểm tra xem có hợp không.",
    detail:
      "Luôn đọc trước khi dùng. AI viết rất tự nhiên nhưng đôi khi bịa tên, số liệu, ngày tháng. Điều gì quan trọng thì đối chiếu nguồn gốc.",
    icon: Eye,
  },
  {
    id: "refine",
    order: 5,
    title: "Chỉnh lại nếu cần",
    short: "Không hài lòng? Nhắn thêm yêu cầu — AI sẽ viết lại.",
    detail:
      '"Viết lại lịch sự hơn", "ngắn hơn một nửa", "thêm phần cảm ơn ở cuối"… Bạn trò chuyện qua lại cho đến khi vừa ý.',
    icon: Edit3,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// DỮ LIỆU — TOOL PICKER (DEMO 2)
// ═══════════════════════════════════════════════════════════════════════════
//
// Người dùng chọn 1 trong 4 mục tiêu, widget gợi ý 2-3 tool phù hợp.

type Goal = {
  id: "write" | "analyze" | "translate" | "ideate";
  label: string;
  subtitle: string;
  picks: { name: string; why: string; tone: string }[];
};

const GOALS: Goal[] = [
  {
    id: "write",
    label: "Viết văn bản",
    subtitle: "Email, báo cáo, bài đăng, mô tả sản phẩm",
    picks: [
      {
        name: "ChatGPT",
        why: "Viết nhanh, giọng văn linh hoạt, hợp nhất với đa số nhu cầu văn phòng.",
        tone: "Đa dụng",
      },
      {
        name: "Claude",
        why: "Viết văn bản dài mạch lạc, ít lạc ý, tốt khi cần giữ giọng văn chuyên nghiệp hoặc nhạy cảm.",
        tone: "Văn dài",
      },
    ],
  },
  {
    id: "analyze",
    label: "Phân tích số liệu",
    subtitle: "Tóm tắt báo cáo, đọc Excel/PDF, nhận xét dữ liệu",
    picks: [
      {
        name: "ChatGPT",
        why: "Kéo thả file Excel/PDF, hỏi bằng tiếng Việt. Có thể vẽ biểu đồ đơn giản.",
        tone: "Đa dụng",
      },
      {
        name: "Microsoft Copilot",
        why: "Nằm thẳng trong Excel/Word/Outlook. Không cần copy dữ liệu ra ngoài — an toàn hơn cho dữ liệu nội bộ.",
        tone: "Office 365",
      },
    ],
  },
  {
    id: "translate",
    label: "Dịch và tra cứu",
    subtitle: "Dịch tài liệu, tìm thông tin mới, đối chiếu nguồn",
    picks: [
      {
        name: "Gemini",
        why: "Tra cứu có liên kết Google Search, thường kèm nguồn — tiện đối chiếu.",
        tone: "Tra cứu",
      },
      {
        name: "Claude",
        why: "Dịch Anh–Việt giữ giọng văn gốc rất tốt, đặc biệt với văn bản hợp đồng hoặc học thuật.",
        tone: "Văn dài",
      },
    ],
  },
  {
    id: "ideate",
    label: "Tìm ý tưởng",
    subtitle: "Brainstorm, lên dàn ý họp, ý tưởng marketing",
    picks: [
      {
        name: "ChatGPT",
        why: "Liệt kê 10-20 ý trong một lần. Dễ đào sâu từng ý bằng câu hỏi nối tiếp.",
        tone: "Đa dụng",
      },
      {
        name: "Claude",
        why: "Phân loại, nhóm ý, gợi ý framework suy nghĩ — phù hợp khi brainstorm cần có cấu trúc.",
        tone: "Văn dài",
      },
      {
        name: "Gemini",
        why: "Ý tưởng gắn dữ liệu thực tế từ web (tin tức, xu hướng tìm kiếm).",
        tone: "Tra cứu",
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// DỮ LIỆU — 4 TOOL PHỔ BIẾN TẠI VIỆT NAM
// ═══════════════════════════════════════════════════════════════════════════

type ToolCard = {
  name: string;
  tagline: string;
  strength: string;
  plan: string;
  color: string;
  hex: string;
};

const TOOLS: ToolCard[] = [
  {
    name: "ChatGPT",
    tagline: "Trợ lý đa dụng",
    strength: "Viết email, tóm tắt, phân tích Excel, tạo ý tưởng. Bản miễn phí đủ cho đa số nhu cầu hằng ngày.",
    plan: "Miễn phí / 20 USD mỗi tháng",
    color: "emerald",
    hex: "#10b981",
  },
  {
    name: "Claude",
    tagline: "Chuyên gia văn dài",
    strength: "Viết báo cáo mạch lạc, đọc tài liệu 100+ trang, dịch thuật tinh tế. Hợp cho dân văn phòng đọc nhiều.",
    plan: "Miễn phí / 20 USD mỗi tháng",
    color: "violet",
    hex: "#8b5cf6",
  },
  {
    name: "Gemini",
    tagline: "Tra cứu gắn Google",
    strength: "Tìm kiếm kèm nguồn, tóm tắt Gmail, soạn nháp trong Google Docs. Hợp với hệ sinh thái Google Workspace.",
    plan: "Miễn phí / gói Google One",
    color: "sky",
    hex: "#0ea5e9",
  },
  {
    name: "Microsoft Copilot",
    tagline: "Kèm trong Office 365",
    strength: "Nằm sẵn trong Word, Excel, Outlook, Teams. Phân tích dữ liệu nội bộ mà không cần copy ra ngoài.",
    plan: "Miễn phí / gói Microsoft 365",
    color: "orange",
    hex: "#f97316",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// DỮ LIỆU — BẢNG THỜI GIAN "KHÔNG AI" vs "CÓ AI"
// ═══════════════════════════════════════════════════════════════════════════

type Task = {
  label: string;
  icon: typeof FileText;
  manual: number; // phút
  withAi: number; // phút
};

const TASKS: Task[] = [
  { label: "Viết email 150 từ", icon: FileText, manual: 15, withAi: 3 },
  { label: "Tóm tắt báo cáo 20 trang", icon: BarChart3, manual: 60, withAi: 8 },
  { label: "Dịch 1000 từ Anh–Việt", icon: Languages, manual: 90, withAi: 10 },
];

// ═══════════════════════════════════════════════════════════════════════════
// DỮ LIỆU — QUIZ (5 câu)
// ═══════════════════════════════════════════════════════════════════════════

const QUIZ: QuizQuestion[] = [
  {
    question:
      "Bạn muốn bắt đầu dùng AI hôm nay. Bước đầu tiên hợp lý nhất là?",
    options: [
      "Đọc hết tài liệu kỹ thuật về cách AI hoạt động trước.",
      "Trả ngay gói đắt nhất để có chất lượng tốt.",
      "Tạo tài khoản miễn phí trên ChatGPT, Claude, hoặc Gemini và thử một yêu cầu nhỏ.",
      "Chờ công ty có chính sách rõ ràng rồi mới dùng.",
    ],
    correct: 2,
    explanation:
      "Cách học AI nhanh nhất là dùng thử. Tất cả trợ lý phổ biến đều có bản miễn phí, chỉ cần email là đăng ký được. Một yêu cầu nhỏ, đọc kết quả, chỉnh lại — lặp 3-4 lần là bạn đã hiểu hơn bất cứ bài viết lý thuyết nào.",
  },
  {
    question:
      "Prompt nào sẽ cho ra email xin phép nghỉ chất lượng hơn?",
    options: [
      '"Viết email nghỉ phép."',
      '"Viết email xin nghỉ 2 ngày gửi trưởng phòng Minh, lý do con ốm, giọng lịch sự chuyên nghiệp, khoảng 100 từ, có lời cảm ơn cuối."',
      '"Email nghỉ, ngắn thôi."',
      '"Giúp tôi xin nghỉ đi."',
    ],
    correct: 1,
    explanation:
      "Càng nhiều chi tiết rõ ràng (số ngày, người nhận, lý do, giọng văn, độ dài, điểm kết) thì AI càng hiểu đúng ý bạn. Đây là quy tắc vàng của prompt: cụ thể thắng chung chung.",
  },
  {
    question:
      "AI trả lời rất tự tin nhưng có thể bị sai ở điểm nào sau đây?",
    options: [
      "Tên người, số liệu, ngày tháng, trích dẫn — AI có thể tự bịa mà nghe rất hợp lý.",
      "AI luôn từ chối trả lời mọi câu hỏi.",
      "AI tự gửi email thay bạn.",
      "AI xoá tài khoản của bạn nếu trả lời sai.",
    ],
    correct: 0,
    explanation:
      'Đây gọi là "hallucination" (ảo giác) — AI sinh ra câu trả lời nghe trơn tru ngay cả khi thông tin không có thật. Luôn đối chiếu số liệu, tên, dẫn chứng quan trọng với nguồn gốc.',
  },
  {
    question:
      "Nhiệm vụ nào SAU ĐÂY nên cẩn trọng khi giao cho AI công cộng?",
    options: [
      "Viết lời chúc sinh nhật đồng nghiệp.",
      "Dịch bài giới thiệu công ty đã đăng công khai.",
      "Phân tích bảng lương chi tiết từng nhân viên kèm CMND, địa chỉ nhà.",
      "Tóm tắt một bài báo đăng trên VnExpress.",
    ],
    correct: 2,
    explanation:
      "Dữ liệu nhạy cảm (lương, CMND, hợp đồng, thông tin khách hàng) không nên dán vào AI công cộng. Nếu bắt buộc xử lý, hãy dùng phiên bản doanh nghiệp có cam kết bảo mật hoặc che giấu thông tin riêng tư trước khi gửi.",
  },
  {
    type: "fill-blank",
    question:
      "Khi kết quả AI chưa vừa ý, bạn không cần hỏi lại y nguyên câu cũ — hãy {blank} prompt bằng cách thêm chi tiết.",
    blanks: [
      {
        answer: "tinh chỉnh",
        accept: ["chỉnh sửa", "sửa", "cải thiện", "chỉnh", "bổ sung"],
      },
    ],
    explanation:
      "Tinh chỉnh prompt là kỹ năng cốt lõi khi dùng AI. Thêm ngữ cảnh, nêu giọng văn muốn có, hoặc ví dụ mẫu — kết quả thường tốt hơn rõ rệt. Ít khi prompt đầu tiên đã hoàn hảo.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// MOCK CHAT UI — dùng cho demo 1 "bước 3" và "bước 4"
// ═══════════════════════════════════════════════════════════════════════════

function MockChatBubble({
  role,
  text,
  typing = false,
}: {
  role: "user" | "ai";
  text: string;
  typing?: boolean;
}) {
  const isUser = role === "user";
  return (
    <div
      className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15">
          <Bot size={14} className="text-accent" />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
          isUser
            ? "bg-accent text-white"
            : "bg-surface text-foreground border border-border"
        }`}
      >
        {typing ? (
          <span className="inline-flex gap-1">
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1, delay: 0 }}
              className="h-1.5 w-1.5 rounded-full bg-muted"
            />
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
              className="h-1.5 w-1.5 rounded-full bg-muted"
            />
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
              className="h-1.5 w-1.5 rounded-full bg-muted"
            />
          </span>
        ) : (
          text
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DEMO 1 — INTERACTIVE STEP LIST "5 PHÚT ĐẦU TIÊN"
// ═══════════════════════════════════════════════════════════════════════════

function FiveMinutesDemo() {
  const [selected, setSelected] = useState(0);
  const current = FIRST_STEPS[selected];
  const Icon = current.icon;

  return (
    <div className="space-y-4">
      {/* Danh sách bước dạng thanh ngang */}
      <div className="grid grid-cols-5 gap-2">
        {FIRST_STEPS.map((step, i) => {
          const StepIcon = step.icon;
          const active = selected === i;
          return (
            <button
              key={step.id}
              onClick={() => setSelected(i)}
              className={`group flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all ${
                active
                  ? "border-accent bg-accent-light shadow-sm"
                  : "border-border bg-card hover:border-accent/50 hover:bg-surface"
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  active
                    ? "bg-accent text-white"
                    : "bg-surface text-muted group-hover:bg-accent/20"
                }`}
              >
                {step.order}
              </div>
              <StepIcon
                size={14}
                className={active ? "text-accent" : "text-muted"}
              />
              <span
                className={`text-[10px] font-medium leading-tight text-center ${
                  active ? "text-accent-dark" : "text-muted"
                }`}
              >
                {step.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Chi tiết bước đang chọn + mock UI tương ứng */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="grid gap-4 md:grid-cols-[1fr_1.2fr]"
        >
          {/* Cột trái: mô tả bước */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                {current.order}
              </div>
              <h4 className="text-sm font-semibold text-foreground">
                {current.title}
              </h4>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed">
              {current.short}
            </p>
            <p className="text-xs text-muted leading-relaxed">
              {current.detail}
            </p>
          </div>

          {/* Cột phải: mock UI */}
          <div className="rounded-xl border border-border bg-background/40 p-3">
            {selected === 0 && <MockPickUI />}
            {selected === 1 && <MockOpenUI />}
            {selected === 2 && <MockPromptUI />}
            {selected === 3 && <MockReadUI />}
            {selected === 4 && <MockRefineUI />}
          </div>
        </motion.div>
      </AnimatePresence>

      <p className="text-xs text-center text-muted italic">
        <Icon size={12} className="inline mr-1" />
        Click vào số trên cùng để xem từng bước
      </p>
    </div>
  );
}

function MockPickUI() {
  const tools = [
    { name: "ChatGPT", hex: "#10b981" },
    { name: "Claude", hex: "#8b5cf6" },
    { name: "Gemini", hex: "#0ea5e9" },
    { name: "Copilot", hex: "#f97316" },
  ];
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        4 trợ lý AI phổ biến
      </p>
      <div className="grid grid-cols-2 gap-2">
        {tools.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center gap-2 rounded-lg border border-border bg-card p-2.5"
          >
            <div
              className="h-6 w-6 shrink-0 rounded-md"
              style={{ backgroundColor: t.hex }}
            />
            <span className="text-xs font-medium text-foreground">
              {t.name}
            </span>
          </motion.div>
        ))}
      </div>
      <p className="text-[11px] text-muted italic">
        Tất cả đều có bản miễn phí. Chọn bất kỳ cái nào.
      </p>
    </div>
  );
}

function MockOpenUI() {
  return (
    <div className="space-y-2">
      <div className="rounded-md bg-surface px-2.5 py-1.5 font-mono text-[11px] text-muted">
        https://chat.openai.com
      </div>
      <div className="rounded-lg border border-border bg-card p-3 space-y-2">
        <p className="text-xs font-semibold text-foreground">
          Đăng nhập
        </p>
        <button className="w-full rounded-md border border-border bg-background py-1.5 text-[11px] font-medium text-foreground">
          Tiếp tục với Google
        </button>
        <button className="w-full rounded-md border border-border bg-background py-1.5 text-[11px] text-muted">
          Đăng ký bằng email
        </button>
        <p className="text-[10px] text-center text-tertiary">
          Không cần thẻ ngân hàng
        </p>
      </div>
    </div>
  );
}

function MockPromptUI() {
  const promptText =
    "Viết email xin nghỉ 1 ngày gửi trưởng phòng, lý do việc gia đình, giọng lịch sự, khoảng 80 từ.";
  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-border bg-card p-3 space-y-2 min-h-[120px] flex flex-col justify-end">
        <div className="flex-1" />
        <div className="flex items-end gap-2 rounded-xl border border-accent/50 bg-surface px-2.5 py-2">
          <p className="flex-1 text-xs text-foreground leading-relaxed">
            {promptText}
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="inline-block ml-0.5 h-3 w-0.5 bg-foreground align-middle"
            />
          </p>
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent">
            <Send size={12} className="text-white" />
          </div>
        </div>
      </div>
      <p className="text-[11px] text-muted italic">
        Viết tự nhiên như nhắn tin. Càng nhiều chi tiết càng tốt.
      </p>
    </div>
  );
}

function MockReadUI() {
  return (
    <div className="space-y-2">
      <div className="space-y-1.5 rounded-lg border border-border bg-card p-3">
        <MockChatBubble
          role="user"
          text="Viết email xin nghỉ 1 ngày gửi trưởng phòng…"
        />
        <MockChatBubble
          role="ai"
          text={
            "Kính gửi anh/chị,\n\nEm xin phép nghỉ 1 ngày vào ngày mai do có việc gia đình cần giải quyết. Em đã bàn giao công việc cho chị Linh và sẽ kiểm tra email khi cần. Em rất mong nhận được sự đồng ý và cảm ơn anh/chị đã tạo điều kiện."
          }
        />
      </div>
      <p className="text-[11px] text-muted italic">
        Đọc kỹ trước khi copy. Nếu có tên sếp thật thì chỉnh lại.
      </p>
    </div>
  );
}

function MockRefineUI() {
  return (
    <div className="space-y-2">
      <div className="space-y-1.5 rounded-lg border border-border bg-card p-3">
        <MockChatBubble
          role="ai"
          text="Kính gửi anh/chị, Em xin phép nghỉ 1 ngày…"
        />
        <MockChatBubble
          role="user"
          text="Viết lại ngắn hơn, chỉ 50 từ, và thêm lời cảm ơn cuối email."
        />
        <MockChatBubble role="ai" text="" typing />
      </div>
      <p className="text-[11px] text-muted italic">
        Không ưng? Cứ yêu cầu AI viết lại. Trò chuyện qua lại đến khi vừa ý.
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DEMO 2 — TOOL PICKER
// ═══════════════════════════════════════════════════════════════════════════

function ToolPickerDemo() {
  const [goal, setGoal] = useState<Goal["id"]>("write");
  const active = GOALS.find((g) => g.id === goal) ?? GOALS[0];

  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground/90">
        Bạn đang cần làm gì? Chọn mục tiêu, widget sẽ gợi ý 2-3 công cụ phù
        hợp nhất.
      </p>

      {/* Chọn mục tiêu */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {GOALS.map((g) => {
          const active = goal === g.id;
          return (
            <button
              key={g.id}
              onClick={() => setGoal(g.id)}
              className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all ${
                active
                  ? "border-accent bg-accent-light"
                  : "border-border bg-card hover:border-accent/50"
              }`}
            >
              <span
                className={`text-sm font-semibold ${
                  active ? "text-accent-dark" : "text-foreground"
                }`}
              >
                {g.label}
              </span>
              <span className="text-[11px] text-muted leading-snug">
                {g.subtitle}
              </span>
            </button>
          );
        })}
      </div>

      {/* Gợi ý */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-2"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Gợi ý cho "{active.label}"
          </p>
          <div className="grid gap-2 md:grid-cols-2">
            {active.picks.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-lg border border-border bg-card p-3 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">
                    {p.name}
                  </span>
                  <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium text-muted">
                    {p.tone}
                  </span>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed">
                  {p.why}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DEMO 3 — PROMPT BEFORE / AFTER (ToggleCompare)
// ═══════════════════════════════════════════════════════════════════════════

function PromptBeforeAfter() {
  return (
    <ToggleCompare
      labelA="Prompt mơ hồ"
      labelB="Prompt có cấu trúc"
      description="Cùng một AI, cùng một thời điểm — khác biệt nằm ở cách hỏi."
      childA={
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-background/40 p-3 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
              Bạn gõ
            </p>
            <div className="rounded-lg bg-card border border-border px-3 py-2 text-sm text-foreground">
              Viết email báo hoãn họp.
            </div>
          </div>
          <div className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 p-3 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-red-700 dark:text-red-300">
              AI trả lời (chung chung, phải sửa nhiều)
            </p>
            <p className="text-xs text-foreground/90 italic leading-relaxed whitespace-pre-line">
              {
                "Chào anh/chị,\n\nTôi viết mail này để thông báo cuộc họp sẽ bị hoãn. Rất mong nhận được thông cảm. Cảm ơn.\n\nTrân trọng."
              }
            </p>
            <p className="text-[11px] text-red-700 dark:text-red-300">
              Thiếu: ai nhận, họp nào, hoãn sang khi nào, lý do, người thay thế.
            </p>
          </div>
        </div>
      }
      childB={
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-background/40 p-3 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Bạn gõ
            </p>
            <div className="rounded-lg bg-card border border-border px-3 py-2 text-sm text-foreground leading-relaxed">
              Viết email báo hoãn cuộc họp review Q2 thứ Sáu 10h sang thứ Hai tuần sau 14h. Gửi nhóm dự án Marketing (5 người). Lý do: trưởng bộ phận kế toán đi công tác đột xuất. Giọng chuyên nghiệp, ngắn gọn dưới 120 từ, kèm link Google Meet mới.
            </div>
          </div>
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-700 p-3 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              AI trả lời (dùng được ngay)
            </p>
            <p className="text-xs text-foreground/90 italic leading-relaxed whitespace-pre-line">
              {
                "Chào cả team,\n\nDo anh Tuấn bên Kế toán đi công tác đột xuất, cuộc họp review Q2 thứ Sáu (10h) sẽ dời sang thứ Hai tuần sau, 14h. Link Google Meet mới: meet.google.com/abc-defg-hij. Nhờ mọi người cập nhật lịch và chuẩn bị tài liệu như kế hoạch cũ.\n\nCảm ơn cả nhà,\nLan"
              }
            </p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
              Gọn, đủ ý, có link họp — sửa rất ít là gửi được.
            </p>
          </div>
        </div>
      }
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// VÒNG ĐỜI MỘT LẦN DÙNG AI (trong ExplanationSection)
// ═══════════════════════════════════════════════════════════════════════════

const LIFECYCLE_STEPS = [
  { label: "Bạn nhập yêu cầu", sub: "Viết prompt rõ ràng", hex: "#3b82f6" },
  { label: "AI xử lý", sub: "Đọc, suy luận, sinh chữ", hex: "#8b5cf6" },
  { label: "Ra kết quả", sub: "Email, tóm tắt, ý tưởng…", hex: "#10b981" },
  { label: "Bạn kiểm tra", sub: "Đúng? Đủ? Hợp ý?", hex: "#f59e0b" },
  { label: "Tinh chỉnh", sub: "Thêm chi tiết, nhờ viết lại", hex: "#ef4444" },
];

function LifecycleFlow() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
        Vòng đời một lần dùng AI
      </p>
      <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center">
        {LIFECYCLE_STEPS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex flex-1 items-center gap-2"
          >
            <div className="flex-1 rounded-lg border border-border bg-background/40 p-2.5 text-center">
              <div
                className="mx-auto mb-1 h-6 w-6 rounded-full"
                style={{ backgroundColor: s.hex }}
              />
              <p className="text-xs font-semibold text-foreground">
                {s.label}
              </p>
              <p className="text-[10px] text-muted">{s.sub}</p>
            </div>
            {i < LIFECYCLE_STEPS.length - 1 && (
              <ArrowRight
                size={14}
                className="hidden shrink-0 text-muted md:block"
              />
            )}
          </motion.div>
        ))}
      </div>
      <p className="mt-3 text-[11px] italic text-muted text-center">
        Lặp bước 4 → 5 càng nhiều, output càng chuẩn. Đây là cách dùng AI như
        dân chuyên nghiệp.
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BAR CHART — KHÔNG AI vs CÓ AI (count-up animation)
// ═══════════════════════════════════════════════════════════════════════════

function useCountUp(target: number, duration = 900, trigger = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let start: number | null = null;
    let frame: number;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        frame = requestAnimationFrame(step);
      }
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, trigger]);
  return value;
}

function TimeSavingsChart() {
  const [triggered, setTriggered] = useState(false);
  const max = Math.max(...TASKS.map((t) => t.manual));

  return (
    <motion.div
      onViewportEnter={() => setTriggered(true)}
      viewport={{ once: true, amount: 0.3 }}
      className="rounded-xl border border-border bg-card p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          Thời gian cho 3 công việc hằng ngày
        </p>
        <div className="flex gap-3 text-[10px]">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-slate-400" />
            <span className="text-muted">Không AI</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-accent" />
            <span className="text-muted">Có AI</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {TASKS.map((t, i) => (
          <TaskBar key={t.label} task={t} max={max} trigger={triggered} index={i} />
        ))}
      </div>
    </motion.div>
  );
}

function TaskBar({
  task,
  max,
  trigger,
  index,
}: {
  task: Task;
  max: number;
  trigger: boolean;
  index: number;
}) {
  const manualVal = useCountUp(task.manual, 900, trigger);
  const aiVal = useCountUp(task.withAi, 900, trigger);
  const manualWidth = (task.manual / max) * 100;
  const aiWidth = (task.withAi / max) * 100;
  const Icon = task.icon;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Icon size={14} className="shrink-0 text-muted" />
        <span className="text-xs font-medium text-foreground">{task.label}</span>
      </div>
      <div className="space-y-1 pl-5">
        {/* Không AI */}
        <div className="relative h-5 overflow-hidden rounded-md bg-surface">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: trigger ? `${manualWidth}%` : 0 }}
            transition={{ duration: 0.9, delay: index * 0.12 }}
            className="h-full bg-slate-400 dark:bg-slate-500"
          />
          <span className="absolute inset-y-0 right-2 flex items-center text-[10px] font-semibold text-white/90">
            {manualVal} phút
          </span>
        </div>
        {/* Có AI */}
        <div className="relative h-5 overflow-hidden rounded-md bg-surface">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: trigger ? `${aiWidth}%` : 0 }}
            transition={{ duration: 0.9, delay: index * 0.12 + 0.15 }}
            className="h-full bg-accent"
          />
          <span className="absolute inset-y-0 right-2 flex items-center text-[10px] font-semibold text-white/90">
            {aiVal} phút
          </span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 4 TOOL CARDS (trong ExplanationSection)
// ═══════════════════════════════════════════════════════════════════════════

function ToolCards() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {TOOLS.map((t, i) => (
        <motion.div
          key={t.name}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08 }}
          className="rounded-xl border border-border bg-card p-4 space-y-2"
          style={{ borderLeftColor: t.hex, borderLeftWidth: 4 }}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h5 className="text-sm font-semibold text-foreground">
                {t.name}
              </h5>
              <p className="text-[11px] uppercase tracking-wide text-muted">
                {t.tagline}
              </p>
            </div>
            <span
              className="h-6 w-6 shrink-0 rounded-md"
              style={{ backgroundColor: t.hex }}
            />
          </div>
          <p className="text-xs text-foreground/90 leading-relaxed">
            {t.strength}
          </p>
          <p className="text-[11px] text-muted italic">
            <Clock size={10} className="inline mr-1" />
            {t.plan}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT CHÍNH
// ═══════════════════════════════════════════════════════════════════════════

export default function GettingStartedWithAiTopic() {
  return (
    <>
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* BƯỚC 1 — PREDICTION GATE                                      */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <LessonSection step={1} totalSteps={8} label="Thử đoán">
        <PredictionGate
          question="Theo bạn, một trợ lý AI có thể giúp bạn làm gì trong 5 phút?"
          options={[
            "Viết một email khó một mình nghĩ mãi không ra.",
            "Tóm tắt một file PDF 50 trang thành mấy gạch đầu dòng.",
            "Dịch một báo cáo ngắn sang tiếng Anh giữ đúng giọng văn.",
            "Tất cả cái trên — và còn nhiều hơn thế.",
          ]}
          correct={3}
          explanation="Đúng là tất cả. Trong 5 phút, một trợ lý AI hiện nay có thể viết email, tóm tắt tài liệu dài, dịch thuật, brainstorm, chỉnh câu chữ — đủ cho 60-70% việc văn phòng hằng ngày. Bài này sẽ dẫn bạn qua từng thứ, nhẹ nhàng như uống một ly cà phê."
        >
          <p className="text-base text-foreground/90 leading-relaxed mt-2">
            Bài đầu tiên trong lộ trình sẽ cho bạn{" "}
            <strong>một cái nhìn đầu tay về AI văn phòng</strong>: chọn công
            cụ nào, mở lên thế nào, gõ câu gì, đọc kết quả ra sao, và
            những điều cần tránh. Không có dòng lệnh, không có công thức,
            chỉ có những bước thật sự bạn sẽ làm trên máy tính hôm nay.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* BƯỚC 2 — ẨN DỤ THƯ KÝ                                          */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <LessonSection step={2} totalSteps={8} label="Ẩn dụ">
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15">
              <Bot size={16} className="text-accent" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              Một thư ký sẵn sàng 24/7
            </h3>
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed">
            Hãy tưởng tượng bạn có một <strong>thư ký giỏi văn, giỏi nghiên
            cứu</strong>, ngồi ngay cạnh bàn làm việc. Gần như miễn phí (hoặc
            giá rất thấp), không bao giờ nghỉ trưa, không than mệt, sẵn sàng
            lúc 2 giờ sáng nếu bạn cần nộp báo cáo gấp.
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed">
            Bạn nói bằng tiếng Việt bình thường. Thư ký hiểu cả tiếng Anh.
            Bảo viết email — có email. Bảo tóm tắt tài liệu — có bản tóm tắt.
            Bảo dịch — có bản dịch. Không đúng ý? Bạn nói "viết lại lịch sự
            hơn" — thư ký viết lại ngay, không hờn dỗi.
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed">
            Điểm trừ duy nhất: <strong>thỉnh thoảng thư ký nói sai</strong> —
            bịa tên người, nhầm con số, hiểu lệch ý. Bạn vẫn là người ký tên
            cuối cùng, nên mọi thứ quan trọng đều phải <strong>đọc lại và
            kiểm chứng</strong>. Giữ thư ký đó ở cạnh — đừng giao phó toàn
            bộ trách nhiệm cho nó.
          </p>
        </div>
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* BƯỚC 3 — VISUALIZATION (3 demo con)                            */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <LessonSection step={3} totalSteps={8} label="Thử tận tay">
        <VisualizationSection topicSlug={metadata.slug}>
          <LessonSection step={1} totalSteps={3} label="Demo 1 — 5 phút đầu tiên">
            <h3 className="text-base font-semibold text-foreground mb-1">
              5 bước đầu tiên khi dùng một trợ lý AI
            </h3>
            <p className="text-sm text-muted mb-4">
              Click từng bước bên dưới — mỗi bước mở ra một hình minh hoạ
              giả lập giao diện bạn sẽ thấy.
            </p>
            <FiveMinutesDemo />
          </LessonSection>

          <LessonSection step={2} totalSteps={3} label="Demo 2 — Chọn đúng công cụ">
            <h3 className="text-base font-semibold text-foreground mb-1">
              Công cụ nào phù hợp với việc bạn đang làm?
            </h3>
            <p className="text-sm text-muted mb-4">
              Mỗi trợ lý có thế mạnh riêng. Chọn mục tiêu bạn đang cần để
              thấy gợi ý.
            </p>
            <ToolPickerDemo />
          </LessonSection>

          <LessonSection step={3} totalSteps={3} label="Demo 3 — Prompt tốt vs prompt dở">
            <h3 className="text-base font-semibold text-foreground mb-1">
              Cùng một AI, khác biệt nằm ở cách hỏi
            </h3>
            <p className="text-sm text-muted mb-4">
              Bấm nút bên dưới để so sánh hai kiểu prompt cho cùng một nhu
              cầu: báo hoãn cuộc họp.
            </p>
            <PromptBeforeAfter />
          </LessonSection>
        </VisualizationSection>
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* BƯỚC 4 — AHA MOMENT                                            */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <LessonSection step={4} totalSteps={8} label="Khoảnh khắc aha">
        <AhaMoment>
          AI <strong>không phải công cụ phép thuật</strong>. Nó là một trợ
          lý có <strong>thế mạnh rõ</strong> (nhanh, đa ngôn ngữ, không mệt)
          và <strong>điểm yếu rõ</strong> (đôi khi bịa thông tin, cần
          người kiểm tra). Hiểu cả hai mặt giúp bạn biết khi nào nên nhờ
          AI làm 100%, khi nào chỉ để nó viết bản nháp, và khi nào hoàn
          toàn không nên đụng tới.
        </AhaMoment>
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* BƯỚC 5 — INLINE CHALLENGE                                      */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <LessonSection step={5} totalSteps={8} label="Thử thách nhỏ">
        <InlineChallenge
          question="Nhiệm vụ nào sau đây KHÔNG nên giao hoàn toàn cho AI công cộng?"
          options={[
            "Soạn lời chúc Tết cho khách hàng dựa trên template công ty đã đăng.",
            "Dịch bài giới thiệu sản phẩm đã được đăng công khai sang tiếng Anh.",
            "Phân tích file bảng lương chi tiết kèm CMND và địa chỉ nhân viên.",
            "Tóm tắt một bài báo về xu hướng ngành đăng trên VnExpress.",
          ]}
          correct={2}
          explanation="Dữ liệu nhạy cảm như bảng lương, CMND, hợp đồng, thông tin khách hàng không nên dán vào AI công cộng — bạn không biết dữ liệu sẽ đi đâu. Nếu bắt buộc xử lý nội bộ, hãy dùng Microsoft Copilot trong Office 365 hoặc phiên bản doanh nghiệp có cam kết bảo mật, hoặc che giấu thông tin riêng tư trước khi gửi."
        />
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* BƯỚC 6 — EXPLANATION                                           */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <LessonSection step={6} totalSteps={8} label="Hiểu sâu hơn">
        <ExplanationSection topicSlug={metadata.slug}>
          {/* Vòng đời một lần dùng AI */}
          <h4 className="text-base font-semibold text-foreground">
            Vòng đời một lần dùng AI
          </h4>
          <p>
            Mỗi lần bạn dùng một trợ lý AI, có 5 giai đoạn — như 5 nhịp
            trong một điệu nhảy ngắn. Hiểu vòng đời này giúp bạn không
            "dính cứng" vào lần output đầu tiên, và biết khi nào phải
            quay vòng.
          </p>
          <LifecycleFlow />

          {/* 4 tool phổ biến */}
          <h4 className="text-base font-semibold text-foreground mt-6">
            Bốn trợ lý AI phổ biến tại Việt Nam
          </h4>
          <p>
            Không có công cụ nào "tốt nhất" cho mọi việc — chỉ có công cụ{" "}
            <strong>phù hợp hơn</strong> cho từng tình huống. Bảng dưới
            đây tóm tắt thế mạnh chính của bốn trợ lý bạn sẽ gặp nhiều
            nhất.
          </p>
          <ToolCards />

          <Callout variant="tip" title="Bắt đầu từ một cái, đừng đổi quá sớm">
            Trong tuần đầu, chọn <strong>một</strong> công cụ và dùng cho
            đủ loại việc. Bạn sẽ quen giao diện, quen cách AI "nghĩ", và
            có thể so sánh công bằng khi thử cái thứ hai. Nhảy liên tục
            giữa 4 tool chỉ khiến bạn rối.
          </Callout>

          {/* Bảng thời gian count-up */}
          <h4 className="text-base font-semibold text-foreground mt-6">
            Thời gian tiết kiệm — con số thực tế
          </h4>
          <p>
            Đây là ước lượng cho người văn phòng trung bình, lần đầu làm
            đúng quy trình (prompt rõ, đọc kỹ, chỉnh lại 1-2 lần). Con
            số sẽ rút ngắn thêm khi bạn dùng nhiều lên.
          </p>
          <TimeSavingsChart />
          <p className="text-xs text-muted italic">
            <Timer size={11} className="inline mr-1" />
            Trung bình một ngày làm việc, AI có thể gỡ được 60-90 phút
            cho các tác vụ văn bản lặp đi lặp lại.
          </p>

          {/* Pitfall bảo mật */}
          <Callout variant="warning" title="Đừng dán thông tin nhạy cảm vào AI công cộng">
            <p className="mb-2">
              Bản miễn phí của ChatGPT, Claude, Gemini có thể dùng dữ liệu
              bạn gõ vào để cải tiến mô hình. Với cá nhân dùng vui thì
              không sao, nhưng với dữ liệu công việc thì phải thận trọng.
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
              <li>
                <strong>Không</strong> dán: bảng lương, CMND, hợp đồng
                khách hàng, mật khẩu, dữ liệu chưa công bố.
              </li>
              <li>
                <strong>Nếu bắt buộc dùng cho dữ liệu nội bộ</strong>:
                chọn Microsoft Copilot trong Office 365, hoặc gói doanh
                nghiệp (ChatGPT Team/Enterprise, Claude Team) có cam kết
                không huấn luyện từ dữ liệu bạn gửi.
              </li>
              <li>
                <strong>Che tên riêng</strong> (tên người, số tài khoản,
                mã nội bộ) trước khi gõ vào AI công cộng — AI vẫn giúp
                được logic mà không biết ai là ai.
              </li>
            </ul>
          </Callout>

          {/* Ghép cặp công cụ với tình huống */}
          <h4 className="text-base font-semibold text-foreground mt-6">
            Chọn đúng công cụ cho đúng việc — thử ghép cặp
          </h4>
          <p>
            Ghép mỗi tình huống công việc với công cụ AI phù hợp nhất.
            Không có đáp án duy nhất, nhưng có một "lựa chọn đầu tiên"
            hợp lý hơn các lựa chọn khác.
          </p>
          <MatchPairs
            instruction="Chọn một mục bên trái, rồi click mục bên phải để ghép."
            pairs={[
              {
                left: "Phân tích file Excel lương nội bộ công ty",
                right: "Microsoft Copilot (không rời Office 365)",
              },
              {
                left: "Viết báo cáo 5 trang có dẫn chứng từ 3 bài báo dài",
                right: "Claude (đọc tài liệu dài tốt)",
              },
              {
                left: "Tra xu hướng thị trường quý này, kèm nguồn",
                right: "Gemini (liên kết Google Search)",
              },
              {
                left: "Viết nhanh 10 ý cho bài đăng Facebook",
                right: "ChatGPT (đa dụng, phản hồi nhanh)",
              },
            ]}
          />

          {/* Sắp xếp thứ tự vòng dùng AI */}
          <h4 className="text-base font-semibold text-foreground mt-6">
            Thực hành: sắp xếp đúng trình tự 5 bước
          </h4>
          <p>
            Kéo-thả để sắp xếp lại 5 bước của một lần dùng AI theo đúng
            thứ tự. (Trong thực tế bạn sẽ lặp bước 4-5 vài lần.)
          </p>
          <Reorderable
            instruction="Kéo các bước vào đúng thứ tự từ trên xuống dưới."
            items={[
              "Chọn một công cụ (ChatGPT / Claude / Gemini / Copilot)",
              "Mở trang web và đăng nhập bằng Google hoặc email",
              "Gõ yêu cầu rõ ràng: bạn cần gì, cho ai, giọng văn nào, độ dài bao nhiêu",
              "Đọc kỹ câu trả lời và kiểm tra số liệu, tên, trích dẫn",
              "Nếu chưa vừa ý, nhắn tiếp để AI chỉnh lại",
            ]}
            correctOrder={[0, 1, 2, 3, 4]}
          />

          {/* Ứng dụng cụ thể */}
          <h4 className="text-base font-semibold text-foreground mt-6">
            10 việc văn phòng bạn có thể nhờ AI làm ngay tuần này
          </h4>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Viết nháp email khó (báo tin xấu, từ chối, đàm phán giá).</li>
            <li>Tóm tắt một báo cáo/PDF dài thành 5-7 gạch đầu dòng.</li>
            <li>Dịch tài liệu Anh–Việt / Việt–Anh, giữ giọng chuyên nghiệp.</li>
            <li>Brainstorm 15 ý tưởng cho campaign rồi chọn 3 ý mạnh nhất.</li>
            <li>Soạn dàn ý cho cuộc họp: mục tiêu, agenda, câu hỏi chính.</li>
            <li>Viết lại đoạn văn cho gọn hơn, lịch sự hơn, hoặc đơn giản hơn.</li>
            <li>Chuyển bảng dữ liệu lộn xộn sang dạng gọn gàng hơn để trình bày.</li>
            <li>Giải thích một thuật ngữ khó bằng ngôn ngữ bình dân.</li>
            <li>Tạo danh sách câu hỏi phỏng vấn ứng viên cho vị trí cụ thể.</li>
            <li>Chuẩn bị câu trả lời nháp cho những câu khách thường hỏi.</li>
          </ul>

          {/* Collapsible — lộ trình tiếp theo */}
          <CollapsibleDetail title="Sắp tới bạn sẽ học gì trong lộ trình văn phòng?">
            <ul className="list-disc list-inside space-y-2 pl-2 text-sm text-foreground/90 mt-2">
              <li>
                <strong>Cách AI "hiểu" tiếng Việt của bạn</strong> — một bài
                ngắn về cách{" "}
                <TopicLink slug="llm-overview">bài LLM</TopicLink> xử
                lý chữ để bạn biết giới hạn thực sự của nó.
              </li>
              <li>
                <strong>Kỹ thuật viết prompt</strong> — từ câu hỏi mơ hồ
                đến prompt chuyên nghiệp. Học qua đúng 5-6 công thức dễ
                nhớ.
              </li>
              <li>
                <strong>So sánh và đánh giá công cụ AI</strong> — khi
                nào chọn gói trả phí, khi nào bản miễn phí là đủ, và
                cách test nhanh một tool mới trong 15 phút.
              </li>
              <li>
                <strong>AI cho Excel, Email, và họp</strong> — 3 bài
                chuyên sâu cho 3 việc bạn làm hằng ngày.
              </li>
              <li>
                <strong>An toàn và đạo đức</strong> — làm gì với dữ liệu
                nhạy cảm, trách nhiệm khi output sai, và cách nói với
                sếp/khách hàng rằng bạn dùng AI.
              </li>
            </ul>
          </CollapsibleDetail>

          {/* Mẹo giữ tâm thế */}
          <Callout variant="insight" title="Giữ tâm thế của người cầm bút">
            AI viết giúp, nhưng chữ ký là của bạn. Khi AI đưa kết quả,
            hãy hỏi: "Nếu gửi bản này đi mà có lỗi, mình có chịu được
            không?" Nếu không — đọc lại. Nếu có — gửi. Tâm thế đó giúp
            bạn dùng AI bền vững mà không rơi vào hai thái cực: lười đọc
            hoặc sợ hãi không dám dùng.
          </Callout>

          {/* Hai bẫy phổ biến */}
          <h4 className="text-base font-semibold text-foreground mt-6">
            Hai bẫy phổ biến của người mới
          </h4>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>Tin mọi thứ AI nói:</strong> AI rất tự tin — câu
              văn trau chuốt, dẫn chứng nghe hợp lý. Nhưng nó có thể
              bịa. Quy tắc: tên người, số liệu, ngày tháng, luật lệ —
              luôn kiểm tra lại.
            </li>
            <li>
              <strong>Dùng một lần rồi bỏ:</strong> thấy output chưa hay
              là đóng tab. Thật ra bạn mới đi được bước 3/5 của vòng
              đời. Cứ nhắn thêm: "ngắn hơn", "thêm ví dụ", "giọng thân
              mật hơn". Kết quả cuối gần như chắc chắn dùng được.
            </li>
          </ul>

          {/* Câu kết nối tiếp */}
          <p className="mt-6">
            Khi bạn thấy thoải mái với một công cụ, bước tiếp theo là hiểu{" "}
            <TopicLink slug="llm-overview">bài LLM</TopicLink> — cách
            AI xử lý chữ viết — và{" "}
            <TopicLink slug="prompt-engineering">kỹ thuật viết prompt</TopicLink>{" "}
            để nhận kết quả tốt hơn nữa. Khi đã quen dùng 2-3 công cụ,
            hãy xem thêm{" "}
            <TopicLink slug="ai-tool-evaluation">
              cách đánh giá công cụ AI
            </TopicLink>{" "}
            để chọn đúng gói trả phí cho công việc của bạn.
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* BƯỚC 7 — MINI SUMMARY                                          */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <LessonSection step={7} totalSteps={8} label="Tóm tắt">
        <MiniSummary
          title="Năm điều cần nhớ sau bài đầu tiên"
          points={[
            "AI văn phòng là một trợ lý miễn phí (hoặc giá thấp), sẵn sàng 24/7 — giúp viết, tóm tắt, dịch, brainstorm cho phần lớn việc hằng ngày.",
            "Năm bước chuẩn: chọn công cụ → mở và đăng nhập → gõ yêu cầu rõ ràng → đọc kỹ kết quả → nhắn lại để chỉnh. Không bỏ bước 4 và 5.",
            "Bốn tool phổ biến: ChatGPT (đa dụng), Claude (văn dài), Gemini (tra cứu + Google), Microsoft Copilot (Office 365). Chọn theo mục tiêu, không theo danh tiếng.",
            "Prompt cụ thể thắng prompt chung chung. Cho AI biết: bạn cần gì, cho ai, giọng văn nào, độ dài bao nhiêu, có ràng buộc gì.",
            "Không dán dữ liệu nhạy cảm (lương, CMND, hợp đồng, khách hàng) vào AI công cộng. Luôn đọc và kiểm tra trước khi dùng output vào việc thật.",
          ]}
        />
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* BƯỚC 8 — QUIZ                                                  */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <LessonSection step={8} totalSteps={8} label="Kiểm tra nhẹ">
        <QuizSection questions={QUIZ} />
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* CROSSLINK — Cẩm nang Claude (punchlist #10)                    */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <LessonSection step={8} totalSteps={8} label="Đọc thêm">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-foreground leading-relaxed">
            Muốn đi sâu với một công cụ cụ thể trước khi thử hết?{" "}
            <a
              href="/claude"
              className="font-semibold text-accent underline decoration-accent/40 hover:decoration-accent"
            >
              Cẩm nang Claude
            </a>{" "}
            gom đủ khung phong cách, prompt mẫu, và cách dùng Claude
            cho các tác vụ văn phòng — đọc 10 phút, xài được liền.
          </p>
        </div>
      </LessonSection>
    </>
  );
}
