"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  FileText,
  Presentation,
  MessageSquare,
  Sparkles,
  PenLine,
  ShieldCheck,
  Wand2,
  Send,
  CheckCircle2,
  AlertTriangle,
  Type,
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
  ToggleCompare,
  TabView,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

// ---------------------------------------------------------------------------
// Metadata — giữ nguyên theo yêu cầu của hệ thống routing.
// ---------------------------------------------------------------------------
export const metadata: TopicMeta = {
  slug: "ai-for-writing",
  title: "AI for Writing",
  titleVi: "AI hỗ trợ viết lách",
  description:
    "Dùng AI để viết email, báo cáo, bài thuyết trình, và tóm tắt cuộc họp nhanh hơn.",
  category: "applied-ai",
  tags: ["writing", "email", "reports", "practical", "office"],
  difficulty: "beginner",
  relatedSlugs: [
    "prompt-engineering",
    "getting-started-with-ai",
    "ai-tool-evaluation",
  ],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

// ---------------------------------------------------------------------------
// DEMO 1 — Email drafter: chọn tone + người nhận → email thay đổi realtime
// ---------------------------------------------------------------------------

interface EmailVariant {
  subject: string;
  greeting: string;
  body: string;
  closing: string;
  sign: string;
}

// Bảng tra: key là `${recipient}-${formality}-${length}`
// - recipient: 0=đồng nghiệp, 1=sếp, 2=khách hàng
// - formality: 0=thân thiện, 1=chuyên nghiệp, 2=trang trọng
// - length: 0=ngắn, 1=vừa, 2=dài
function buildEmail(
  recipient: number,
  formality: number,
  length: number
): EmailVariant {
  const subjects = [
    "Xin phép nghỉ 2 ngày",
    "Xin phép nghỉ phép ngày 5-6 tháng tới",
    "Đơn xin phép nghỉ phép — 2 ngày làm việc",
  ];
  const greetings = [
    `Chào ${["Minh", "anh Hoàng", "chị Lan"][recipient]},`,
    `Kính gửi ${["bạn Minh", "anh Hoàng", "chị Lan"][recipient]},`,
    `Kính gửi ${["quý đồng nghiệp Minh", "Trưởng phòng Hoàng", "Quý khách Lan"][recipient]},`,
  ];
  const bodyShort = [
    "Mình xin nghỉ 2 ngày tuần sau để giải quyết việc nhà. Công việc đã bàn giao cho Hải.",
    "Em xin phép nghỉ 2 ngày tuần sau vì việc gia đình. Em đã bàn giao lại công việc cho bạn Hải.",
    "Tôi xin được phép nghỉ 2 ngày làm việc tuần tới do có việc gia đình quan trọng cần giải quyết trực tiếp.",
  ];
  const bodyMedium = [
    "Mình xin nghỉ 2 ngày tuần sau (thứ 5 và thứ 6) để lo việc nhà gấp. Mọi việc đang dở mình đã chia cho Hải, có gì Hải xử lý giúp. Mình vẫn online khi cần.",
    "Em xin phép nghỉ 2 ngày tuần sau (thứ 5 và thứ 6) vì việc gia đình cần có mặt trực tiếp. Em đã bàn giao các việc đang dở cho bạn Hải và vẫn giữ liên lạc qua điện thoại nếu có việc gấp.",
    "Tôi xin phép được nghỉ 2 ngày làm việc trong tuần sau (thứ Năm và thứ Sáu) do có việc gia đình bắt buộc phải có mặt trực tiếp. Các nhiệm vụ đang thực hiện đã được bàn giao đầy đủ cho đồng nghiệp Hải.",
  ];
  const bodyLong = [
    "Mình xin nghỉ 2 ngày tuần sau (thứ 5 và thứ 6) vì có việc gia đình không thể dời lịch. Các task đang làm mình đã bàn giao cho Hải kèm note chi tiết. Nếu có gì cần mình xử lý gấp, cứ nhắn Zalo — mình sẽ phản hồi trong ngày. Cảm ơn bạn nhiều!",
    "Em xin phép nghỉ 2 ngày làm việc tuần sau (thứ 5 và thứ 6) vì có việc gia đình cần em có mặt trực tiếp. Trước khi nghỉ, em đã bàn giao đầy đủ công việc đang dở cho bạn Hải, kèm theo tài liệu và checklist chi tiết. Em vẫn giữ điện thoại thường xuyên và có thể phản hồi qua Zalo khi cần. Mong anh chấp thuận giúp em.",
    "Tôi xin được phép nghỉ 2 ngày làm việc (thứ Năm và thứ Sáu tuần sau) vì có việc gia đình quan trọng yêu cầu có mặt trực tiếp và không thể thu xếp khác. Mọi công việc đang thực hiện đã được bàn giao chi tiết cho đồng nghiệp Hải, bao gồm toàn bộ tài liệu và ghi chú cần thiết. Tôi vẫn duy trì liên lạc qua điện thoại trong thời gian nghỉ và sẽ xử lý ngay các trường hợp khẩn cấp. Rất mong được Quý Trưởng phòng chấp thuận.",
  ];
  const body = [bodyShort, bodyMedium, bodyLong][length][formality];
  const closings = [
    "Thanks nhiều!",
    "Em cảm ơn anh.",
    "Trân trọng cảm ơn Quý Trưởng phòng.",
  ];
  const signs = ["Nam", "Em Nam", "Trần Văn Nam"];
  return {
    subject: subjects[formality],
    greeting: greetings[formality],
    body,
    closing: closings[formality],
    sign: signs[formality],
  };
}

function EmailDrafterDemo() {
  const [recipient, setRecipient] = useState(1); // sếp
  const [formality, setFormality] = useState(1);
  const [length, setLength] = useState(1);

  const recipients = [
    { label: "Đồng nghiệp", color: "#10b981", icon: "👥" },
    { label: "Sếp / Trưởng phòng", color: "#6366f1", icon: "👔" },
    { label: "Khách hàng", color: "#f97316", icon: "💼" },
  ];

  const email = useMemo(
    () => buildEmail(recipient, formality, length),
    [recipient, formality, length]
  );

  const toneLabels = ["Thân thiện", "Chuyên nghiệp", "Trang trọng"];
  const lenLabels = ["Ngắn", "Vừa", "Dài"];
  const toneColors = ["#10b981", "#6366f1", "#8b5cf6"];
  const lenColors = ["#64748b", "#0ea5e9", "#0c4a6e"];

  return (
    <div className="space-y-5">
      {/* Chọn người nhận */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
          1. Người nhận
        </p>
        <div className="grid grid-cols-3 gap-2">
          {recipients.map((r, i) => (
            <button
              key={r.label}
              type="button"
              onClick={() => setRecipient(i)}
              className={`rounded-xl border-2 p-3 text-left transition-colors ${
                recipient === i
                  ? "border-accent bg-accent-light"
                  : "border-border bg-card hover:border-accent/40"
              }`}
            >
              <div className="text-lg mb-1">{r.icon}</div>
              <p className="text-xs font-semibold text-foreground">{r.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 2 thanh trượt: tone + độ dài — quản lý state tại đây, không qua SliderGroup */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-5">
        <div className="rounded-lg bg-surface p-4 flex items-center justify-center gap-3 text-sm">
          <span
            className="rounded-full px-3 py-1 font-semibold text-white"
            style={{ background: toneColors[formality] }}
          >
            {toneLabels[formality]}
          </span>
          <span className="text-muted">×</span>
          <span
            className="rounded-full px-3 py-1 font-semibold text-white"
            style={{ background: lenColors[length] }}
          >
            {lenLabels[length]}
          </span>
        </div>
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">Độ trang trọng</label>
              <span className="font-mono text-sm font-medium text-accent">
                {toneLabels[formality]}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={2}
              step={1}
              value={formality}
              onChange={(e) => setFormality(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-accent"
            />
            <div className="flex justify-between text-xs text-tertiary">
              <span>Thân thiện</span>
              <span>Trang trọng</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">Độ dài</label>
              <span className="font-mono text-sm font-medium text-accent">
                {lenLabels[length]}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={2}
              step={1}
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-accent"
            />
            <div className="flex justify-between text-xs text-tertiary">
              <span>Ngắn</span>
              <span>Dài</span>
            </div>
          </div>
        </div>
      </div>

      {/* Output email */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
          Kết quả AI soạn
        </p>
        <motion.div
          key={`${recipient}-${formality}-${length}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-xl border border-border bg-surface p-4 space-y-2"
        >
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <Mail className="h-4 w-4 text-accent" />
            <div className="flex-1">
              <p className="text-[11px] text-muted">
                Gửi:{" "}
                <span className="font-semibold text-foreground">
                  {recipients[recipient].label}
                </span>
              </p>
              <p className="text-sm font-semibold text-foreground">
                {email.subject}
              </p>
            </div>
          </div>
          <p className="text-sm text-foreground">{email.greeting}</p>
          <p className="text-sm text-foreground leading-relaxed">{email.body}</p>
          <p className="text-sm text-foreground">{email.closing}</p>
          <p className="text-sm text-muted italic">— {email.sign}</p>
        </motion.div>
        <p className="mt-2 text-[11px] text-muted">
          Thử đổi 3 thứ ở trên — email tự viết lại trong chưa đầy 1 giây.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DEMO 2 — Before/after doc edit
// ---------------------------------------------------------------------------

function BeforeAfterEditDemo() {
  return (
    <ToggleCompare
      labelA="Bản nháp"
      labelB="Sau khi AI chỉnh"
      description="Cùng một đoạn báo cáo tuần — AI chỉ sửa cấu trúc, không bịa thông tin."
      childA={
        <div className="rounded-lg border border-red-200 bg-red-50/50 dark:bg-red-900/10 dark:border-red-900/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-400 mb-2">
            Bản nháp — rối, lặp từ
          </p>
          <p className="text-sm text-foreground leading-relaxed">
            Tuần này bên mình đã gọi được 47 khách xong có 12 khách hẹn gặp rồi
            có 3 khách đã ký hợp đồng. Tổng doanh thu tuần này là 250 triệu.
            Tuần sau bên mình sẽ tiếp tục gọi khách và hẹn khách để ký hợp đồng
            thêm. Có một số khách chưa phản hồi lại nên mình cần follow tiếp
            cho đỡ mất khách. Nói chung tuần này ok.
          </p>
        </div>
      }
      childB={
        <div className="rounded-lg border border-green-200 bg-green-50/50 dark:bg-green-900/10 dark:border-green-900/40 p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-400">
            Sau khi AI chỉnh — rõ, có cấu trúc
          </p>
          <div className="text-sm text-foreground leading-relaxed space-y-2">
            <p className="font-semibold">Kết quả tuần:</p>
            <ul className="list-disc list-inside space-y-0.5 pl-1">
              <li>Gọi 47 khách → 12 hẹn gặp → 3 ký hợp đồng.</li>
              <li>
                Doanh thu:{" "}
                <strong className="text-accent">250 triệu đồng</strong>.
              </li>
            </ul>
            <p className="font-semibold">Kế hoạch tuần sau:</p>
            <ul className="list-disc list-inside space-y-0.5 pl-1">
              <li>Follow tiếp các khách chưa phản hồi.</li>
              <li>Tiếp tục đặt lịch hẹn và chốt hợp đồng mới.</li>
            </ul>
          </div>
        </div>
      }
    />
  );
}

// ---------------------------------------------------------------------------
// DEMO 3 — Use case gallery (TabView)
// ---------------------------------------------------------------------------

const USE_CASES = [
  {
    key: "leave",
    label: "Email xin nghỉ",
    icon: Mail,
    scenario:
      'Nghỉ 2 ngày gửi trưởng phòng, lý do gia đình, giọng chuyên nghiệp.',
    output:
      '"Kính gửi anh Hoàng, em xin phép nghỉ 2 ngày (thứ 5-6) vì việc gia đình. Em đã bàn giao công việc cho bạn Hải. Em cảm ơn anh."',
  },
  {
    key: "weekly",
    label: "Báo cáo tuần",
    icon: FileText,
    scenario:
      "Tổng hợp số liệu bán hàng tuần thành bullet points, có phần kế hoạch tuần sau.",
    output:
      "• Doanh thu 250tr (↑8%)\n• 3 deal chốt, 12 hẹn gặp\n• Tuần sau: follow khách chưa phản hồi, đẩy mạnh khu vực Hà Nội",
  },
  {
    key: "linkedin",
    label: "Bài LinkedIn",
    icon: MessageSquare,
    scenario:
      "Biến 1 bài blog công ty dài 800 từ thành bài LinkedIn 200 từ có hook và câu hỏi mở.",
    output:
      '"Bạn có biết 73% nhân viên văn phòng dùng AI ít nhất 1 lần/tuần? Dưới đây là 3 điều chúng tôi rút ra sau 6 tháng triển khai... Bạn đang dùng AI cho việc gì?"',
  },
  {
    key: "product",
    label: "Mô tả sản phẩm",
    icon: Type,
    scenario:
      "Soạn mô tả 150 từ cho tai nghe không dây trên sàn TMĐT, nhấn vào pin và chống ồn.",
    output:
      '"Tai nghe BT-X5: pin 32 tiếng, chống ồn chủ động 35dB, bluetooth 5.3 ổn định, nghe nhạc trong như ở phòng thu — dùng cho work from home, đi xe bus, chạy bộ..."',
  },
  {
    key: "pitch",
    label: "Mở đầu thuyết trình",
    icon: Presentation,
    scenario:
      "Viết 3 phương án mở đầu slide chiến lược Q2 cho ban giám đốc — ngắn, mạnh, có số liệu.",
    output:
      '"Q1 chúng ta tăng trưởng 15% so với năm ngoái. Nhưng đối thủ tăng 22%. Q2 sẽ quyết định ai dẫn đầu thị trường."',
  },
];

function UseCaseGalleryDemo() {
  return (
    <TabView
      tabs={USE_CASES.map((u) => ({
        label: u.label,
        content: (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-light text-accent">
                <u.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-1">
                  Tình huống
                </p>
                <p className="text-sm text-foreground">{u.scenario}</p>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-1">
                AI soạn mẫu
              </p>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                {u.output}
              </p>
            </div>
          </div>
        ),
      }))}
    />
  );
}

// ---------------------------------------------------------------------------
// Dữ liệu Callout — 5 công cụ AI viết dùng nhiều ở Việt Nam
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: "ChatGPT",
    color: "#10a37f",
    tagline: "Linh hoạt, tiếng Việt tốt",
    useFor: "Soạn email, brainstorm, trả lời câu hỏi chung.",
    price: "Free / 500k/tháng",
  },
  {
    name: "Claude",
    color: "#d97706",
    tagline: "Viết dài, tóm tắt tài liệu",
    useFor: "Tóm tắt PDF 50+ trang, viết blog có giọng riêng.",
    price: "Free / 500k/tháng",
  },
  {
    name: "Gemini",
    color: "#4285f4",
    tagline: "Gắn liền Gmail + Google Docs",
    useFor: "Soạn email trong Gmail, viết nhanh trong Docs.",
    price: "Free / 500k/tháng",
  },
  {
    name: "Notion AI",
    color: "#000000",
    tagline: "Viết trong Notion",
    useFor: "Ghi chú, họp, tài liệu nội bộ.",
    price: "~250k/tháng/người",
  },
  {
    name: "Copilot (M365)",
    color: "#0078d4",
    tagline: "Gắn vào Word, Outlook, Teams",
    useFor: "Doanh nghiệp dùng Microsoft, tóm tắt họp Teams.",
    price: "~750k/người/tháng",
  },
];

// ---------------------------------------------------------------------------
// COMPONENT CHÍNH
// ---------------------------------------------------------------------------

export default function AiForWritingTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "Bạn muốn AI viết email xin phép nghỉ. Prompt nào cho kết quả tốt nhất?",
        options: [
          "Viết email xin nghỉ",
          "Viết email xin phép nghỉ 2 ngày gửi trưởng phòng Nguyễn Văn A, lý do việc gia đình, giọng lịch sự chuyên nghiệp, khoảng 100 từ",
          "Email nghỉ phép, ngắn thôi",
          "Viết gì đó gửi sếp",
        ],
        correct: 1,
        explanation:
          "Prompt tốt cần có đủ: người nhận, lý do, giọng văn, độ dài mong muốn. Càng cụ thể, AI càng cho ra kết quả sát ý bạn.",
      },
      {
        question:
          "Trong khung RACE cho prompt viết lách, chữ C nghĩa là gì?",
        options: [
          "Copy — sao chép nội dung mẫu",
          "Context — ngữ cảnh và thông tin nền",
          "Create — tạo nội dung mới hoàn toàn",
          "Check — kiểm tra lỗi chính tả",
        ],
        correct: 1,
        explanation:
          "C = Context (Ngữ cảnh). Bạn cần cho AI biết bối cảnh: viết cho ai, tình huống gì, thông tin nền nào. Không có ngữ cảnh, AI chỉ viết chung chung.",
      },
      {
        type: "fill-blank",
        question:
          "Khung RACE gồm 4 bước: {blank} (vai trò), {blank} (hành động), Context (ngữ cảnh), Example (ví dụ mẫu).",
        blanks: [
          { answer: "Role", accept: ["role", "Vai trò", "vai trò"] },
          { answer: "Action", accept: ["action", "Hành động", "hành động"] },
        ],
        explanation:
          "RACE = Role + Action + Context + Example — công thức giúp bạn viết prompt rõ ràng khi nhờ AI hỗ trợ viết lách.",
      },
      {
        question:
          "Khi dùng AI tóm tắt cuộc họp, điều nào QUAN TRỌNG NHẤT cần kiểm tra?",
        options: [
          "Xem AI có dùng font đẹp không",
          "Kiểm tra AI có bịa thêm nội dung ngoài cuộc họp không",
          "Đếm xem bản tóm tắt có đủ 500 từ không",
          "Xem AI có thêm emoji vào không",
        ],
        correct: 1,
        explanation:
          "AI có thể bịa nội dung (hallucination) — rất nguy hiểm khi tóm tắt cuộc họp vì thông tin sai ảnh hưởng đến quyết định. Luôn đối chiếu với ghi chú gốc.",
      },
      {
        question:
          "Bạn cần tóm tắt báo cáo PDF 80 trang. Công cụ nào phù hợp nhất?",
        options: [
          "ChatGPT free (giới hạn context ngắn)",
          "Claude Pro với context 200k token — dán cả tài liệu một lần",
          "Copy từng phần nhỏ vào Gemini free",
          "Viết tay để chắc chắn đúng",
        ],
        correct: 1,
        explanation:
          "Claude có context lớn nhất (~500 trang) — phù hợp phân tích tài liệu dài trong một lượt. Chia nhỏ dễ mất mạch ngữ cảnh.",
      },
      {
        question:
          "Bạn gửi email AI soạn mà bỏ qua bước đọc lại. Email bị bịa tên khách hàng. Bài học QUAN TRỌNG NHẤT là gì?",
        options: [
          "Không bao giờ dùng AI nữa",
          "AI là người soạn nháp, bạn là người gửi — luôn review trước khi gửi",
          "Chuyển sang AI khác là đủ",
          "Chỉ dùng AI cho email nội bộ",
        ],
        correct: 1,
        explanation:
          "Quy tắc vàng: AI soạn, bạn chịu trách nhiệm. Luôn kiểm tra tên, số, ngày. Một phút đọc lại cứu một sự nghiệp.",
      },
      {
        question:
          "Một công ty bán lẻ muốn soạn 50 email marketing cá nhân hoá cho khách VIP. Cách AI-first hiệu quả nhất là gì?",
        options: [
          "Viết 50 email thủ công để đảm bảo chất lượng",
          "Yêu cầu AI viết 1 email rồi copy y chang 50 lần",
          "Tạo template prompt có biến (tên, lịch sử mua), cho AI điền từng khách, QC ngẫu nhiên",
          "Dùng 50 AI khác nhau cho chắc",
        ],
        correct: 2,
        explanation:
          "Pattern chuẩn: tạo template có placeholder, chạy batch, QC ngẫu nhiên 5-10 email, gửi sau khi review. Không viết tay cũng không copy.",
      },
      {
        question:
          "Pattern an toàn nhất khi triển khai AI viết cho nhân viên doanh nghiệp là gì?",
        options: [
          "Cho mọi người dùng ChatGPT free với tài khoản cá nhân",
          "Cấp license enterprise — có cam kết không train trên dữ liệu + audit log",
          "Chặn hoàn toàn mọi AI tại văn phòng",
          "Cho tự do dùng nhưng không ban hành quy định",
        ],
        correct: 1,
        explanation:
          "Doanh nghiệp cần bản enterprise: data không dùng để train, audit log đầy đủ, SSO + RBAC. Free tier cá nhân không cam kết điều này.",
      },
    ],
    []
  );

  return (
    <>
      {/* ================================================================
          BƯỚC 1 — DỰ ĐOÁN
          ================================================================ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử đoán">
        <PredictionGate
          question="Một email công việc 150 từ — AI viết trong bao lâu?"
          options={[
            "Khoảng 5 giây — AI sinh chữ gần như tức thì",
            "Khoảng 30 giây — AI suy nghĩ một chút rồi trả",
            "Khoảng 2 phút — tương đương bạn tự gõ",
            "Khoảng 10 phút — chậm hơn viết tay",
          ]}
          correct={0}
          explanation="Với prompt rõ ràng, AI như ChatGPT/Claude trả lại bản email hoàn chỉnh trong 3-8 giây. Phần lâu hơn chính là bước bạn đọc lại và chỉnh giọng cá nhân."
        >
          <p className="text-sm text-muted mt-4">
            Tiết kiệm thời gian không nằm ở việc AI gõ nhanh — mà ở cách bạn ra
            chỉ thị đủ rõ ngay từ lần đầu.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ================================================================
          BƯỚC 2 — ẨN DỤ THỰC TẾ
          ================================================================ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Góc nhìn">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-light">
              <PenLine className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold text-foreground">
                AI viết giống một thư ký soạn thảo.
              </p>
              <p className="mt-2 text-sm text-foreground leading-relaxed">
                Bạn đưa ý, thư ký gõ ra bản nháp. Nhưng khi văn bản gửi đi, tên
                bạn ký dưới cùng — nên bạn phải duyệt lại để chắc chắn đúng
                giọng, đúng số, đúng tên.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="rounded-lg bg-surface p-3">
              <Wand2 className="h-5 w-5 text-accent mb-1" />
              <p className="text-sm font-semibold text-foreground">Bạn đưa ý</p>
              <p className="text-xs text-muted">Mô tả tình huống, giọng, độ dài.</p>
            </div>
            <div className="rounded-lg bg-surface p-3">
              <Send className="h-5 w-5 text-accent mb-1" />
              <p className="text-sm font-semibold text-foreground">AI gõ nháp</p>
              <p className="text-xs text-muted">Vài giây ra bản đầy đủ.</p>
            </div>
            <div className="rounded-lg bg-surface p-3">
              <ShieldCheck className="h-5 w-5 text-accent mb-1" />
              <p className="text-sm font-semibold text-foreground">Bạn duyệt</p>
              <p className="text-xs text-muted">Đọc lại, sửa giọng, gửi đi.</p>
            </div>
          </div>
        </div>
      </LessonSection>

      {/* ================================================================
          BƯỚC 3 — KHÁM PHÁ (3 DEMO)
          ================================================================ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-8">
            {/* Demo 1 */}
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1">
                Demo 1 — Máy soạn email thông minh
              </h3>
              <p className="text-sm text-muted mb-4">
                Chọn người nhận + tinh chỉnh 2 thanh trượt, email tự viết lại.
                Thử đủ 27 tổ hợp — mỗi tổ hợp cho một giọng khác.
              </p>
              <EmailDrafterDemo />
            </div>

            {/* Demo 2 */}
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1">
                Demo 2 — Trước và sau khi AI chỉnh
              </h3>
              <p className="text-sm text-muted mb-4">
                Cùng một đoạn báo cáo tuần, nhưng một bản rối rắm và một bản có
                cấu trúc. AI chỉ tổ chức lại — không bịa số liệu.
              </p>
              <BeforeAfterEditDemo />
            </div>

            {/* Demo 3 */}
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1">
                Demo 3 — Kho tình huống công sở
              </h3>
              <p className="text-sm text-muted mb-4">
                5 đầu việc viết phổ biến nhất ở văn phòng Việt Nam. Nhấp từng
                tab để xem AI trả kết quả ra sao.
              </p>
              <UseCaseGalleryDemo />
            </div>

            <Callout variant="tip" title="Ba quan sát khi chơi với 3 demo">
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Đổi tone/độ dài = đổi câu chữ. AI không viết &quot;đúng một cách duy nhất&quot;.</li>
                <li>Khi dữ liệu đã đủ rõ, AI không cần phải thông minh — chỉ cần trình bày lại.</li>
                <li>Mỗi đầu việc có một khuôn prompt riêng. Tập 1 khuôn ≠ giỏi tất cả.</li>
              </ol>
            </Callout>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ================================================================
          BƯỚC 4 — AHA MOMENT
          ================================================================ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          AI là <strong>người soạn nháp</strong> — không phải người gửi thay
          bạn. Giá trị lớn nhất của AI viết không phải ở tốc độ gõ, mà ở chỗ
          giải phóng bạn khỏi 80% thời gian &quot;bật máy, nghĩ mở đầu, lục
          giọng&quot;. Nhưng bạn vẫn là người ký dưới cùng.
        </AhaMoment>
      </LessonSection>

      {/* ================================================================
          BƯỚC 5 — THỬ THÁCH
          ================================================================ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Bạn nhờ AI viết báo cáo: 'Viết báo cáo cho sếp'. Prompt này thiếu gì QUAN TRỌNG NHẤT?"
          options={[
            "Thiếu emoji để AI hiểu cảm xúc",
            "Thiếu ngữ cảnh: báo cáo gì, dữ liệu nào, cho ai, format ra sao",
            "Thiếu 'xin vui lòng' để AI lịch sự hơn",
            "Không thiếu gì — prompt ngắn gọn là tốt",
          ]}
          correct={1}
          explanation="Prompt 'Viết báo cáo cho sếp' quá mơ hồ — AI không biết báo cáo gì, cho ai, format nào. Áp dụng khung RACE để bổ sung ngữ cảnh."
        />

        <div className="mt-6">
          <InlineChallenge
            question="Bản tóm tắt AI viết có câu 'doanh thu tháng 3 tăng 28%' nhưng transcript cuộc họp không có con số này. Bạn nên làm gì?"
            options={[
              "Giữ nguyên vì 28% nghe hợp lý",
              "Xoá câu đó, ghi chú AI đã bịa, và rút kinh nghiệm kiểm tra số kỹ hơn",
              "Hỏi lại AI xem có chắc không",
              "Gửi cho sếp, đợi sếp sửa nếu sai",
            ]}
            correct={1}
            explanation="AI đã hallucinate. Con số sai có thể dẫn đến quyết định sai. Luôn xoá thông tin không có trong nguồn khi dùng AI tóm tắt."
          />
        </div>
      </LessonSection>

      {/* ================================================================
          BƯỚC 6 — GIẢI THÍCH (VISUAL-HEAVY)
          ================================================================ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Hiểu sâu hơn">
        <ExplanationSection>
          {/* 6.1 — 5 công cụ AI viết */}
          <div>
            <h3 className="text-base font-semibold text-foreground mb-3">
              5 công cụ AI viết dùng nhiều tại Việt Nam
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TOOLS.map((t) => (
                <div
                  key={t.name}
                  className="rounded-xl border border-border bg-card p-4 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ background: t.color }}
                    />
                    <p className="text-sm font-semibold text-foreground">
                      {t.name}
                    </p>
                    <span className="ml-auto rounded-full bg-surface px-2 py-0.5 text-[10px] text-muted">
                      {t.price}
                    </span>
                  </div>
                  <p className="text-xs text-muted italic">{t.tagline}</p>
                  <p className="text-xs text-foreground">
                    <strong>Dùng cho:</strong> {t.useFor}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 6.2 — Workflow */}
          <div className="mt-6">
            <h3 className="text-base font-semibold text-foreground mb-3">
              Vòng lặp 4 bước: Draft → Polish → Review → Publish
            </h3>
            <div className="flex flex-col md:flex-row gap-2 items-stretch">
              {[
                {
                  label: "1. Bạn viết nháp",
                  desc: "Ý chính, dữ liệu thô, key points.",
                  color: "#10b981",
                  icon: PenLine,
                },
                {
                  label: "2. AI polish",
                  desc: "Chỉnh cấu trúc, giọng, độ dài.",
                  color: "#6366f1",
                  icon: Sparkles,
                },
                {
                  label: "3. Bạn review",
                  desc: "Đối chiếu số, tên, ngày với nguồn.",
                  color: "#f59e0b",
                  icon: ShieldCheck,
                },
                {
                  label: "4. Publish",
                  desc: "Gửi / đăng khi đã OK.",
                  color: "#ef4444",
                  icon: Send,
                },
              ].map((s, i, arr) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="flex-1 flex items-center gap-2">
                    <div
                      className="flex-1 rounded-xl border-2 bg-card p-3 space-y-1"
                      style={{ borderColor: `${s.color}55` }}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" style={{ color: s.color }} />
                        <p className="text-sm font-semibold text-foreground">
                          {s.label}
                        </p>
                      </div>
                      <p className="text-xs text-muted">{s.desc}</p>
                    </div>
                    {i < arr.length - 1 && (
                      <ArrowRight className="hidden md:block h-4 w-4 text-muted shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 6.3 — Pitfalls */}
          <div className="mt-6">
            <h3 className="text-base font-semibold text-foreground mb-3">
              4 cái bẫy thường gặp
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                {
                  title: "Tone không khớp",
                  desc: "AI viết quá trang trọng cho đồng nghiệp, hoặc quá suồng sã với khách hàng.",
                  fix: "Ghi rõ giọng trong prompt: 'thân thiện', 'lịch sự', 'trang trọng'.",
                },
                {
                  title: "Bịa chi tiết",
                  desc: "Thêm tên, số, ngày không có trong nguồn.",
                  fix: "Ghi: 'chỉ dùng thông tin tôi cung cấp'. Review lại tên, số, ngày.",
                },
                {
                  title: "Quá dài, lan man",
                  desc: "AI hay viết dài để 'an toàn', đặc biệt khi không giới hạn.",
                  fix: "Ghi số từ tối đa: 'tối đa 100 từ', 'bullet 3 ý'.",
                },
                {
                  title: "Lặp từ, sáo rỗng",
                  desc: "'Kính mong', 'đồng thời', 'trong bối cảnh'... lộ liễu AI.",
                  fix: "Ghi: 'tránh từ sáo rỗng', hoặc sửa lại bằng giọng của bạn.",
                },
              ].map((p) => (
                <div
                  key={p.title}
                  className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-900/10 p-4 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <p className="text-sm font-semibold text-foreground">
                      {p.title}
                    </p>
                  </div>
                  <p className="text-xs text-muted">{p.desc}</p>
                  <p className="text-xs text-foreground">
                    <strong className="text-green-700 dark:text-green-400">
                      Cách tránh:
                    </strong>{" "}
                    {p.fix}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 6.4 — 4 template prompts */}
          <div className="mt-6">
            <h3 className="text-base font-semibold text-foreground mb-3">
              4 khuôn prompt copy được ngay
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                {
                  title: "A. Email công việc",
                  icon: Mail,
                  body: "Viết email [loại email] gửi [tên + chức vụ]. Mục tiêu: [một câu]. Thông tin nền: [tên, ngày, số]. Giọng: [trang trọng/thân thiện]. Độ dài: [n] từ. Kết bằng 'Trân trọng'.",
                },
                {
                  title: "B. Báo cáo tuần",
                  icon: FileText,
                  body: "Dưới đây là ghi chú thô. Soạn báo cáo tuần theo format: (1) Đã làm, (2) Đang làm, (3) Kế hoạch tuần sau, (4) Blockers. Bullet, mỗi bullet 1 câu. Chỉ dùng thông tin tôi cung cấp.",
                },
                {
                  title: "C. Bài LinkedIn",
                  icon: MessageSquare,
                  body: "Từ bài blog dưới, viết LinkedIn 200 từ: dòng đầu hook (câu hỏi hoặc số liệu), 3-4 đoạn 1-2 câu, kết bằng câu hỏi mở. Không quá 3 hashtag.",
                },
                {
                  title: "D. Mô tả sản phẩm",
                  icon: Type,
                  body: "Soạn mô tả 150 từ cho [sản phẩm]. Nhấn vào [2-3 điểm bán chính]. Đối tượng: [ai]. Giọng: [nghiêm túc/vui vẻ]. Kết bằng 1 câu thúc giục mua.",
                },
              ].map((p) => {
                const Icon = p.icon;
                return (
                  <div
                    key={p.title}
                    className="rounded-xl border border-border bg-card p-4 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-accent" />
                      <p className="text-sm font-semibold text-foreground">
                        {p.title}
                      </p>
                    </div>
                    <p className="text-xs text-foreground leading-relaxed font-mono bg-surface p-2 rounded">
                      {p.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <Callout variant="insight" title="RACE — khuôn prompt 4 chữ cái">
            <strong>R</strong>ole (vai trò) → <strong>A</strong>ction (hành động) →{" "}
            <strong>C</strong>ontext (ngữ cảnh) → <strong>E</strong>xample (ví
            dụ). Nếu bạn đã quen{" "}
            <TopicLink slug="prompt-engineering">kỹ thuật viết prompt</TopicLink>
            , RACE là bản đơn giản cho công việc văn phòng.
          </Callout>

          <Callout variant="warning" title="Khi KHÔNG nên dùng AI viết">
            Email báo tin buồn / chia buồn, văn bản pháp lý quan trọng, thư xin
            việc vào công ty bạn thực sự muốn, lời cảm ơn cá nhân sâu sắc — nên
            viết tay để có cảm xúc thật.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ================================================================
          BƯỚC 7 — TÓM TẮT
          ================================================================ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về AI hỗ trợ viết lách"
          points={[
            "Khung RACE (Role, Action, Context, Example) giúp viết prompt rõ ràng cho mọi tác vụ.",
            "5 công cụ phổ biến: ChatGPT, Claude, Gemini, Notion AI, Copilot — chọn theo ngữ cảnh công ty bạn.",
            "Vòng 4 bước: bạn viết nháp → AI polish → bạn review → publish. Bước review không bao giờ bỏ được.",
            "4 bẫy lớn: tone không khớp, bịa chi tiết, quá dài, từ sáo rỗng. Chặn trước bằng prompt rõ.",
            "AI là người soạn — bạn là người ký. Luôn kiểm tra tên, số, ngày trước khi gửi.",
            "Doanh nghiệp cần bản enterprise (không train trên prompt + audit log) khi xử lý data công ty.",
          ]}
        />

        <div className="mt-4 rounded-xl border border-border bg-card p-5 space-y-2">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            Khám phá thêm
          </h4>
          <p className="text-sm text-muted leading-relaxed">
            Muốn viết prompt chuyên sâu hơn? Xem{" "}
            <TopicLink slug="prompt-engineering">kỹ thuật viết prompt</TopicLink>
            . Mới với AI? Quay về{" "}
            <TopicLink slug="getting-started-with-ai">
              hướng dẫn bắt đầu
            </TopicLink>
            . Lo về bảo mật? Đọc{" "}
            <TopicLink slug="ai-privacy-security">
              bảo mật khi dùng AI
            </TopicLink>
            .
          </p>
        </div>
      </LessonSection>

      {/* ================================================================
          BƯỚC 8 — QUIZ
          ================================================================ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
