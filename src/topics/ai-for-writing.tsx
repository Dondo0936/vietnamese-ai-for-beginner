"use client";

import { useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  TopicLink,
  ToggleCompare,
  CollapsibleDetail,
  CodeBlock,
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
// Dữ liệu so sánh các công cụ AI viết lách phổ biến trên thị trường.
// ---------------------------------------------------------------------------
interface WritingAssistant {
  id: string;
  name: string;
  color: string;
  tagline: string;
  strengths: string[];
  weaknesses: string[];
  bestFor: string[];
  price: string;
  vietnameseQuality: "excellent" | "good" | "fair";
  sampleOutput: string;
}

const ASSISTANTS: WritingAssistant[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    color: "#10a37f",
    tagline: "Linh hoạt — dùng được cho hầu hết mọi việc viết",
    strengths: [
      "Kho kiến thức rộng, hiểu nhiều ngữ cảnh văn phòng",
      "Tiếng Việt tự nhiên ở phiên bản GPT-4 trở lên",
      "Hỗ trợ file đính kèm (Word, Excel, PDF) để tóm tắt",
      "Tích hợp Canvas cho chỉnh sửa văn bản trực quan",
    ],
    weaknesses: [
      "Bản free giới hạn tin nhắn mỗi ngày",
      "Dễ lặp cấu trúc nếu prompt không rõ",
      "Có thể bịa số liệu khi tóm tắt tài liệu dài",
    ],
    bestFor: [
      "Soạn email, báo cáo ngắn, bài blog",
      "Brainstorm ý tưởng và outline",
      "Trả lời câu hỏi kiến thức tổng quát",
    ],
    price: "Free / $20/tháng (Plus) / $200 (Pro)",
    vietnameseQuality: "excellent",
    sampleOutput:
      "Kính gửi anh Minh, Em viết thư này để xin phép nghỉ 2 ngày (thứ 5-6) vì việc gia đình. Em đã bàn giao công việc cho chị Lan...",
  },
  {
    id: "claude",
    name: "Claude",
    color: "#d97706",
    tagline: "Viết dài & phân tích tài liệu — ngữ điệu tự nhiên",
    strengths: [
      "Context window lớn (200k+ token) — dán cả tài liệu dài",
      "Giọng văn tự nhiên, ít công thức như AI",
      "Phân tích tài liệu pháp lý, báo cáo dài tốt",
      "Ít bịa hơn khi được yêu cầu bám sát nguồn",
    ],
    weaknesses: [
      "Một số thị trường chưa có bản Pro",
      "Thỉnh thoảng từ chối yêu cầu quá cẩn trọng",
      "Tiếng Việt vẫn kém 1-2% so với GPT-4",
    ],
    bestFor: [
      "Tóm tắt báo cáo 20+ trang",
      "Phân tích hợp đồng, tài liệu pháp lý",
      "Viết content dài có giọng riêng",
    ],
    price: "Free / $20/tháng (Pro) / Team $30/người",
    vietnameseQuality: "excellent",
    sampleOutput:
      "Anh Minh thân mến, Em xin phép được nghỉ 2 ngày thứ 5 và thứ 6 tuần này. Lý do là em có việc gia đình cần giải quyết trực tiếp...",
  },
  {
    id: "gemini",
    name: "Gemini",
    color: "#4285f4",
    tagline: "Tích hợp Google Workspace — email, Docs, Sheets",
    strengths: [
      "Tích hợp sâu vào Gmail, Google Docs, Sheets",
      "Miễn phí bản Gemini 2.5 Flash cho user thường",
      "Truy cập real-time web search mặc định",
      "Hỗ trợ voice và multimodal tốt",
    ],
    weaknesses: [
      "Giọng văn đôi khi hơi máy móc",
      "Khả năng giữ nhất quán trong văn dài còn yếu hơn Claude",
      "Phụ thuộc vào hệ sinh thái Google",
    ],
    bestFor: [
      "Soạn email ngay trong Gmail",
      "Tóm tắt file Google Drive",
      "Viết lách nhanh trong Google Docs",
    ],
    price: "Free / $20/tháng (Advanced)",
    vietnameseQuality: "good",
    sampleOutput:
      "Chào anh Minh, Em xin phép nghỉ 2 ngày do có việc gia đình. Cụ thể là thứ 5 và thứ 6 tuần này. Em đã nhờ chị Lan hỗ trợ...",
  },
  {
    id: "copilot",
    name: "Copilot (Microsoft 365)",
    color: "#0078d4",
    tagline: "Dành cho doanh nghiệp — tích hợp Word, Outlook, Teams",
    strengths: [
      "Tích hợp sâu vào Word, Outlook, PowerPoint, Teams",
      "Tuân thủ chính sách bảo mật enterprise",
      "Không dùng prompt để train model (doanh nghiệp)",
      "Tóm tắt cuộc họp Teams tự động",
    ],
    weaknesses: [
      "Yêu cầu license Microsoft 365 đắt ($30/user/tháng)",
      "Kém sáng tạo hơn ChatGPT cho copywriting",
      "Tiếng Việt đủ dùng nhưng không nổi bật",
    ],
    bestFor: [
      "Doanh nghiệp đã dùng Microsoft 365",
      "Tóm tắt meeting Teams, email Outlook",
      "Soạn PowerPoint từ file Word",
    ],
    price: "$30/user/tháng (add-on cho M365)",
    vietnameseQuality: "good",
    sampleOutput:
      "Gửi anh Minh, Tôi viết để xin phép nghỉ 2 ngày (thứ 5-6) vì lý do gia đình. Các công việc đang pending đã được bàn giao cho Lan...",
  },
];

// ---------------------------------------------------------------------------
// Component phụ — thẻ info cho từng công cụ viết AI.
// ---------------------------------------------------------------------------
function AssistantCard({
  assistant,
  isActive,
  onClick,
}: {
  assistant: WritingAssistant;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full rounded-xl border-2 p-4 text-left transition-colors ${
        isActive
          ? "border-accent bg-surface"
          : "border-border bg-card hover:border-accent/40"
      }`}
      aria-pressed={isActive}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className="inline-block h-3 w-3 rounded-full"
          style={{ backgroundColor: assistant.color }}
        />
        <span className="text-sm font-semibold text-foreground">
          {assistant.name}
        </span>
      </div>
      <p className="text-xs text-muted leading-relaxed">
        {assistant.tagline}
      </p>
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Component phụ — panel chi tiết công cụ đang chọn.
// ---------------------------------------------------------------------------
function AssistantDetail({ assistant }: { assistant: WritingAssistant }) {
  const qualityLabel: Record<WritingAssistant["vietnameseQuality"], string> = {
    excellent: "Xuất sắc",
    good: "Tốt",
    fair: "Tạm ổn",
  };

  const qualityColor: Record<WritingAssistant["vietnameseQuality"], string> = {
    excellent: "text-green-600 dark:text-green-400",
    good: "text-blue-600 dark:text-blue-400",
    fair: "text-amber-600 dark:text-amber-400",
  };

  return (
    <motion.div
      key={assistant.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border border-border bg-background/60 p-5 space-y-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold text-foreground flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: assistant.color }}
            />
            {assistant.name}
          </h4>
          <p className="text-xs text-muted mt-0.5">{assistant.tagline}</p>
        </div>
        <div className="text-right text-xs">
          <p className="text-muted">Giá</p>
          <p className="font-medium text-foreground">{assistant.price}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/40 p-3">
          <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1.5">
            Điểm mạnh
          </p>
          <ul className="space-y-1">
            {assistant.strengths.map((s, i) => (
              <li key={i} className="text-xs text-foreground leading-relaxed">
                + {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/40 p-3">
          <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1.5">
            Hạn chế
          </p>
          <ul className="space-y-1">
            {assistant.weaknesses.map((w, i) => (
              <li key={i} className="text-xs text-foreground leading-relaxed">
                − {w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-lg bg-surface p-3">
        <p className="text-xs font-semibold text-foreground mb-1.5">
          Phù hợp nhất cho
        </p>
        <ul className="space-y-1">
          {assistant.bestFor.map((b, i) => (
            <li key={i} className="text-xs text-muted leading-relaxed">
              • {b}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="text-xs text-muted">Chất lượng tiếng Việt:</span>
        <span className={`text-xs font-semibold ${qualityColor[assistant.vietnameseQuality]}`}>
          {qualityLabel[assistant.vietnameseQuality]}
        </span>
      </div>

      <div className="rounded-lg border border-dashed border-border p-3 bg-surface/50">
        <p className="text-xs font-semibold text-muted mb-1">
          Output mẫu (email xin nghỉ):
        </p>
        <p className="text-xs text-foreground leading-relaxed italic">
          &ldquo;{assistant.sampleOutput}&rdquo;
        </p>
      </div>
    </motion.div>
  );
}

export default function AiForWritingTopic() {
  const [activeAssistantId, setActiveAssistantId] = useState<string>("chatgpt");

  const activeAssistant = useMemo(
    () =>
      ASSISTANTS.find((a) => a.id === activeAssistantId) ?? ASSISTANTS[0],
    [activeAssistantId]
  );

  const handleAssistantClick = useCallback((id: string) => {
    setActiveAssistantId(id);
  }, []);

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
          "C = Context (Ngữ cảnh). Bạn cần cho AI biết bối cảnh cụ thể: viết cho ai, tình huống gì, thông tin nền nào cần đưa vào. Không có ngữ cảnh, AI chỉ viết chung chung.",
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
          "RACE = Role + Action + Context + Example. Đây là công thức giúp bạn viết prompt rõ ràng và có cấu trúc khi nhờ AI hỗ trợ viết lách.",
      },
      {
        question:
          "Khi dùng AI tóm tắt cuộc họp, điều nào sau đây QUAN TRỌNG NHẤT cần kiểm tra?",
        options: [
          "Xem AI có dùng font đẹp không",
          "Kiểm tra xem AI có bịa thêm nội dung không có trong cuộc họp không",
          "Đếm xem bản tóm tắt có đủ 500 từ không",
          "Xem AI có thêm emoji vào không",
        ],
        correct: 1,
        explanation:
          "AI có thể bịa nội dung (hallucination) — đặc biệt nguy hiểm khi tóm tắt cuộc họp vì thông tin sai có thể ảnh hưởng đến quyết định kinh doanh. Luôn đối chiếu với ghi chú gốc.",
      },
      {
        question:
          "Bạn cần tóm tắt một báo cáo PDF dài 80 trang. Công cụ nào phù hợp nhất?",
        options: [
          "ChatGPT free (giới hạn context ngắn)",
          "Claude Pro với context window 200k token — dán cả tài liệu vào một lần",
          "Copy-paste từng phần nhỏ vào Gemini free",
          "Viết tay để chắc chắn đúng",
        ],
        correct: 1,
        explanation:
          "Claude có context window lớn nhất (200k+ token, tương đương ~500 trang) — phù hợp để phân tích tài liệu dài trong một lượt. ChatGPT free giới hạn ngắn hơn; chia nhỏ dễ mất mạch ngữ cảnh.",
      },
      {
        question:
          "Một công ty bán lẻ muốn soạn 50 email marketing cá nhân hoá cho khách VIP. Cách làm AI-first hiệu quả nhất là gì?",
        options: [
          "Viết 50 email thủ công để đảm bảo chất lượng",
          "Yêu cầu AI viết 1 email rồi copy y chang 50 lần",
          "Tạo template prompt có biến (tên, lịch sử mua), để AI điền từng khách kèm QC mẫu ngẫu nhiên",
          "Dùng 50 AI khác nhau cho chắc",
        ],
        correct: 2,
        explanation:
          "Pattern chuẩn: (1) tạo prompt template với placeholder, (2) chạy batch qua API hoặc công cụ như Make/Zapier, (3) QC ngẫu nhiên 5-10 email để kiểm tra chất lượng, (4) gửi sau khi review. Không viết tay (chậm) cũng không copy (thiếu cá nhân hoá).",
      },
      {
        question:
          "Bạn gửi email AI soạn nhưng bỏ qua bước đọc lại. Email đó có lỗi bịa tên khách hàng. Bài học quan trọng nhất là gì?",
        options: [
          "Không bao giờ dùng AI nữa",
          "AI là người soạn nháp, bạn là người gửi — luôn review trước khi gửi, đặc biệt với tên, số, ngày",
          "Chuyển sang AI khác là đủ",
          "Chỉ dùng AI cho email nội bộ",
        ],
        correct: 1,
        explanation:
          "Quy tắc vàng: AI soạn, bạn chịu trách nhiệm. Luôn kiểm tra (a) tên riêng, (b) số liệu, (c) ngày/giờ, (d) ngữ cảnh cụ thể mà chỉ bạn biết. Một phút đọc lại cứu một sự nghiệp.",
      },
      {
        question:
          "Trong doanh nghiệp, pattern an toàn nhất khi triển khai AI viết cho nhân viên là gì?",
        options: [
          "Cho mọi người dùng ChatGPT free với tài khoản cá nhân",
          "Cấp license Copilot/ChatGPT Enterprise/Claude for Work — có chính sách không dùng data để train, audit log",
          "Chặn hoàn toàn mọi AI tại văn phòng",
          "Cho tự do dùng nhưng không ban hành quy định",
        ],
        correct: 1,
        explanation:
          "Doanh nghiệp cần bản enterprise với SLA: (1) data không được dùng để train, (2) audit log đầy đủ, (3) tuân thủ GDPR/NĐ 13, (4) SSO + RBAC. Free tier cá nhân không cam kết điều này — rủi ro lộ thông tin công ty.",
      },
    ],
    []
  );

  return (
    <>
      {/* ================================================================
          BƯỚC 1 — HOOK: Dự đoán
          ================================================================ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử đoán">
        <PredictionGate
          question="Mất bao lâu để viết email cho sếp?"
          options={[
            "5 phút — nghĩ nội dung, viết, đọc lại, sửa giọng văn",
            "30 giây — nhờ AI viết, chỉ cần kiểm tra lại",
            "Không khác biệt — AI viết cũng phải sửa nhiều nên mất tương đương",
          ]}
          correct={1}
          explanation="Với một prompt tốt, AI có thể soạn email chuyên nghiệp trong vài giây. Bạn chỉ cần kiểm tra lại và thêm chút cá nhân hóa — tiết kiệm đến 80% thời gian viết."
        >
          <p className="text-sm text-muted mt-4">
            Nhưng bí quyết nằm ở cách bạn ra chỉ thị cho AI.
            Hãy xem sự khác biệt giữa viết tay và dùng AI đúng cách.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ================================================================
          BƯỚC 2 — DISCOVER: ToggleCompare + VisualizationSection
          ================================================================ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-1">
            So sánh: Viết tay vs Dùng AI
          </h3>
          <p className="text-sm text-muted mb-4">
            Cùng một nhiệm vụ: viết email xin phép nghỉ gửi trưởng phòng.
            Xem hai cách tiếp cận khác nhau như thế nào.
          </p>

          <ToggleCompare
            labelA="Viết tay"
            labelB="Dùng AI"
            description="Nhấn vào từng tab để so sánh quy trình"
            childA={
              <div className="space-y-3 py-2">
                <div className="space-y-2">
                  {[
                    { step: "1", label: "Nghĩ nội dung", time: "2 phút" },
                    { step: "2", label: "Viết nháp", time: "3 phút" },
                    { step: "3", label: "Sửa giọng văn", time: "2 phút" },
                    { step: "4", label: "Kiểm tra lỗi chính tả", time: "1 phút" },
                    { step: "5", label: "Đọc lại lần cuối", time: "1 phút" },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-2.5"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/20 text-xs font-medium text-muted">
                        {item.step}
                      </span>
                      <span className="flex-1 text-sm text-foreground">
                        {item.label}
                      </span>
                      <span className="text-xs text-muted">{item.time}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800 p-3 text-center">
                  <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                    Tổng: ~9 phút
                  </span>
                </div>
              </div>
            }
            childB={
              <div className="space-y-3 py-2">
                <div className="space-y-2">
                  {[
                    { step: "1", label: "Viết prompt RACE", time: "30 giây" },
                    { step: "2", label: "AI soạn email", time: "5 giây" },
                    { step: "3", label: "Đọc + chỉnh giọng cá nhân", time: "1 phút" },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-2.5"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-medium text-accent">
                        {item.step}
                      </span>
                      <span className="flex-1 text-sm text-foreground">
                        {item.label}
                      </span>
                      <span className="text-xs text-muted">{item.time}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg bg-green-50 dark:bg-green-900/15 border border-green-200 dark:border-green-800 p-3 text-center">
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    Tổng: ~2 phút
                  </span>
                </div>
                <Callout variant="tip" title="Mấu chốt">
                  Tiết kiệm thời gian nhưng phải kiểm tra lại — đừng bao giờ gửi
                  email mà không đọc lại nội dung AI viết.
                </Callout>
              </div>
            }
          />
        </VisualizationSection>

        {/* Bổ sung: Interactive visualization so sánh 4 AI writing assistants */}
        <div className="mt-8">
          <VisualizationSection>
            <h3 className="text-base font-semibold text-foreground mb-1">
              So sánh 4 trợ lý viết AI phổ biến
            </h3>
            <p className="text-sm text-muted mb-4">
              Mỗi công cụ có điểm mạnh và phù hợp với tình huống khác nhau.
              Nhấp vào từng thẻ để xem chi tiết, giá, và output mẫu.
            </p>

            <div className="space-y-4">
              {/* Grid các thẻ trợ lý */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {ASSISTANTS.map((a) => (
                  <AssistantCard
                    key={a.id}
                    assistant={a}
                    isActive={a.id === activeAssistantId}
                    onClick={() => handleAssistantClick(a.id)}
                  />
                ))}
              </div>

              {/* Chi tiết công cụ được chọn */}
              <AssistantDetail assistant={activeAssistant} />

              {/* Bảng tóm tắt so sánh nhanh */}
              <div className="rounded-xl border border-border bg-card p-4 overflow-x-auto">
                <p className="text-xs font-semibold text-muted mb-2 uppercase tracking-wide">
                  Bảng tổng hợp nhanh
                </p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-left text-muted">
                      <th className="py-2 pr-3 font-medium">Công cụ</th>
                      <th className="py-2 pr-3 font-medium">Context window</th>
                      <th className="py-2 pr-3 font-medium">Tiếng Việt</th>
                      <th className="py-2 pr-3 font-medium">Giá bản Pro</th>
                    </tr>
                  </thead>
                  <tbody className="text-foreground">
                    <tr className="border-b border-border/50">
                      <td className="py-2 pr-3 font-medium">ChatGPT</td>
                      <td className="py-2 pr-3">128k (GPT-4 Turbo)</td>
                      <td className="py-2 pr-3">Xuất sắc</td>
                      <td className="py-2 pr-3">$20/tháng</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 pr-3 font-medium">Claude</td>
                      <td className="py-2 pr-3">200k (Sonnet/Opus)</td>
                      <td className="py-2 pr-3">Xuất sắc</td>
                      <td className="py-2 pr-3">$20/tháng</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 pr-3 font-medium">Gemini</td>
                      <td className="py-2 pr-3">1M (Gemini 1.5 Pro)</td>
                      <td className="py-2 pr-3">Tốt</td>
                      <td className="py-2 pr-3">$20/tháng</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-3 font-medium">Copilot M365</td>
                      <td className="py-2 pr-3">128k (GPT-4 backbone)</td>
                      <td className="py-2 pr-3">Tốt</td>
                      <td className="py-2 pr-3">$30/user/tháng</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <Callout variant="info" title="Chọn công cụ nào cho công việc?">
                Đừng cố chọn &quot;công cụ tốt nhất&quot; — chọn công cụ hợp
                ngữ cảnh. Văn phòng dùng Microsoft 365 → Copilot. Viết blog dài
                → Claude. Soạn email Gmail → Gemini. Brainstorm ý tưởng →
                ChatGPT. Tham khảo thêm tại{" "}
                <TopicLink slug="ai-tool-evaluation">
                  cách đánh giá công cụ AI
                </TopicLink>
                .
              </Callout>
            </div>
          </VisualizationSection>
        </div>
      </LessonSection>

      {/* ================================================================
          BƯỚC 3 — REVEAL: Khung RACE
          ================================================================ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Phương pháp">
        <ExplanationSection>
          <p>
            Để viết prompt hiệu quả cho các tác vụ viết lách, bạn có thể dùng
            khung <strong>RACE</strong>{" "}
            — một công thức 4 bước giúp AI hiểu chính xác bạn muốn gì.
          </p>

          <div className="rounded-xl border border-border bg-card p-5 my-4 space-y-4">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-white text-sm font-bold">
                R
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Role — Vai trò
                </p>
                <p className="text-sm text-muted">
                  Gán vai trò cho AI: &quot;Bạn là trợ lý hành chính chuyên nghiệp&quot;
                  hoặc &quot;Bạn là quản lý dự án có 10 năm kinh nghiệm.&quot;
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-white text-sm font-bold">
                A
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Action — Hành động
                </p>
                <p className="text-sm text-muted">
                  Nêu rõ nhiệm vụ: &quot;Viết email xin phép nghỉ 2 ngày&quot;,
                  &quot;Tóm tắt biên bản họp&quot;, &quot;Soạn 5 slide cho báo cáo KPI.&quot;
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-white text-sm font-bold">
                C
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Context — Ngữ cảnh
                </p>
                <p className="text-sm text-muted">
                  Cung cấp bối cảnh: người nhận là ai, giọng văn nào, độ dài bao nhiêu,
                  thông tin nền cần đưa vào.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-white text-sm font-bold">
                E
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Example — Ví dụ mẫu
                </p>
                <p className="text-sm text-muted">
                  Cho AI xem ví dụ output bạn mong muốn — giúp AI hiểu đúng
                  phong cách và format.
                </p>
              </div>
            </div>
          </div>

          <Callout variant="insight" title="Tại sao RACE hiệu quả?">
            Giống như khi bạn nhờ đồng nghiệp giúp — bạn phải nói rõ tình huống,
            yêu cầu cụ thể, và cho ví dụ thì họ mới làm đúng ý. AI cũng vậy.
            Nếu bạn đã quen với{" "}
            <TopicLink slug="prompt-engineering">kỹ thuật viết prompt</TopicLink>
            , RACE là phiên bản đơn giản hóa cho công việc văn phòng.
          </Callout>

          <p>
            <strong>Ví dụ prompt RACE hoàn chỉnh:</strong>
          </p>
          <div className="rounded-lg bg-surface p-4 my-3 text-sm text-foreground leading-relaxed">
            <p>
              <strong>[R]</strong>{" "}
              Bạn là trợ lý hành chính chuyên nghiệp tại công ty công nghệ.
            </p>
            <p className="mt-2">
              <strong>[A]</strong>{" "}
              Viết email xin phép nghỉ 2 ngày (thứ 5-6 tuần này).
            </p>
            <p className="mt-2">
              <strong>[C]</strong>{" "}
              Gửi trưởng phòng Nguyễn Văn Minh. Lý do: việc gia đình cần giải quyết.
              Đã bàn giao công việc cho đồng nghiệp Lan. Giọng văn lịch sự, chuyên nghiệp.
              Khoảng 80-100 từ.
            </p>
            <p className="mt-2">
              <strong>[E]</strong>{" "}
              Kết thúc email bằng &quot;Trân trọng cảm ơn anh.&quot;
            </p>
          </div>

          <p className="mt-4">
            Dưới đây là một ví dụ prompt thực tế dạng text, bạn có thể copy và
            chỉnh lại cho tình huống của mình:
          </p>

          <CodeBlock
            language="text"
            title="Prompt template RACE — dạng copy-paste"
          >
{`[ROLE]
Bạn là trợ lý hành chính chuyên nghiệp, am hiểu văn hoá công sở Việt Nam.
Giọng văn lịch sự, rõ ràng, không hoa mỹ.

[ACTION]
Viết email: {loại_email}
(ví dụ: xin nghỉ phép / phản hồi khách hàng / nhắc deadline)

[CONTEXT]
- Người nhận: {tên} ({chức_vụ})
- Người gửi: {tên_bạn} ({vị_trí})
- Mục tiêu: {một câu mô tả mục tiêu email}
- Thông tin nền: {các thông tin quan trọng — tên, ngày, số liệu}
- Giọng văn: {lịch sự / thân mật / trang trọng}
- Độ dài: {khoảng bao nhiêu từ}
- Ngôn ngữ: tiếng Việt

[EXAMPLE]
Tiêu đề mẫu: "Xin phép nghỉ phép ngày dd/mm/yyyy"
Mở đầu: "Kính gửi anh/chị {tên},"
Kết thúc: "Trân trọng cảm ơn anh/chị."

[OUTPUT FORMAT]
Chỉ trả về nội dung email (có tiêu đề, lời chào, nội dung, lời kết).
Không kèm giải thích hay comment ngoài.`}
          </CodeBlock>

          <Callout variant="tip" title="Mẹo nâng cao: Thêm negative instructions">
            Ngoài việc nói cho AI biết bạn <em>muốn</em> gì, hãy nói luôn điều
            bạn <em>không muốn</em>: &quot;Không dùng emoji&quot;, &quot;Tránh
            từ hoa mỹ&quot;, &quot;Không thêm thông tin ngoài dữ liệu tôi cung
            cấp&quot;. AI sẽ bám sát yêu cầu hơn.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ================================================================
          BƯỚC 4 — DEEPEN: 4 use cases thực tế
          ================================================================ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Ứng dụng thực tế">
        <div className="space-y-6">
          <p className="text-sm text-muted leading-relaxed">
            AI hỗ trợ viết lách không chỉ dừng ở email. Dưới đây là 4 tình huống
            phổ biến nhất trong công việc văn phòng hàng ngày.
          </p>

          {/* Use case 1: Email */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h4 className="text-sm font-semibold text-foreground mb-2">
              1. Email công việc
            </h4>
            <p className="text-sm text-muted mb-3">
              Xin phép nghỉ, phản hồi khách hàng, nhắc deadline, cảm ơn đối tác
              — những email bạn viết mỗi ngày.
            </p>
            <div className="rounded-lg bg-surface p-3">
              <p className="text-xs text-muted mb-1 font-medium">Prompt mẫu:</p>
              <p className="text-sm text-foreground leading-relaxed">
                &quot;Viết email phản hồi khách hàng Nguyễn Thị Hoa về việc trễ giao hàng 3 ngày.
                Xin lỗi chân thành, giải thích do lỗi vận chuyển, cam kết giao trong 24h tới.
                Giọng chuyên nghiệp nhưng ấm áp. 100 từ.&quot;
              </p>
            </div>
          </div>

          {/* Use case 2: Báo cáo */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h4 className="text-sm font-semibold text-foreground mb-2">
              2. Báo cáo KPI / tiến độ
            </h4>
            <p className="text-sm text-muted mb-3">
              Báo cáo tuần, tháng, quý — AI giúp cấu trúc dữ liệu thô
              thành bản báo cáo rõ ràng, có nhận xét.
            </p>
            <div className="rounded-lg bg-surface p-3">
              <p className="text-xs text-muted mb-1 font-medium">Prompt mẫu:</p>
              <p className="text-sm text-foreground leading-relaxed">
                &quot;Tóm tắt báo cáo KPI tháng 3 của phòng kinh doanh. Dữ liệu:
                doanh thu 2.1 tỷ (mục tiêu 2.5 tỷ), khách mới 45 (mục tiêu 50),
                tỷ lệ chốt đơn 32%. Phân tích nguyên nhân chưa đạt target và đề xuất
                giải pháp cho tháng 4. Format: bullet points.&quot;
              </p>
            </div>
          </div>

          {/* Use case 3: Slides */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h4 className="text-sm font-semibold text-foreground mb-2">
              3. Bài thuyết trình / Slides
            </h4>
            <p className="text-sm text-muted mb-3">
              AI giúp soạn nội dung cho từng slide — tiêu đề, gạch đầu dòng,
              ghi chú thuyết trình.
            </p>
            <div className="rounded-lg bg-surface p-3">
              <p className="text-xs text-muted mb-1 font-medium">Prompt mẫu:</p>
              <p className="text-sm text-foreground leading-relaxed">
                &quot;Soạn nội dung 5 slide báo cáo quý 1 cho ban giám đốc. Chủ đề:
                kết quả kinh doanh Q1. Mỗi slide gồm: tiêu đề (ngắn), 3-4 bullet points,
                và 1 dòng ghi chú cho người trình bày. Dữ liệu: doanh thu tăng 15%,
                chi phí giảm 8%, 3 khách hàng lớn mới.&quot;
              </p>
            </div>
          </div>

          {/* Use case 4: Meeting notes */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h4 className="text-sm font-semibold text-foreground mb-2">
              4. Tóm tắt cuộc họp
            </h4>
            <p className="text-sm text-muted mb-3">
              Dán ghi chú thô hoặc transcript vào AI để nhận bản tóm tắt
              có cấu trúc: quyết định, action items, deadline.
            </p>
            <div className="rounded-lg bg-surface p-3">
              <p className="text-xs text-muted mb-1 font-medium">Prompt mẫu:</p>
              <p className="text-sm text-foreground leading-relaxed">
                &quot;Tóm tắt cuộc họp dưới đây thành 3 phần: (1) Các quyết định đã thống nhất,
                (2) Action items — ai làm gì, deadline khi nào, (3) Vấn đề cần theo dõi.
                Giữ nguyên tên người, ngày cụ thể. Không thêm thông tin ngoài nội dung họp.&quot;
              </p>
            </div>
            <Callout variant="warning" title="Cẩn thận với thông tin nhạy cảm">
              Không dán nội dung họp bí mật (lương, nhân sự, hợp đồng chưa ký) vào
              AI công cộng. Tìm hiểu thêm tại{" "}
              <TopicLink slug="ai-privacy-security">
                bảo mật khi dùng AI
              </TopicLink>
              .
            </Callout>
          </div>

          {/* CollapsibleDetail 1: Prompt templates nâng cao */}
          <CollapsibleDetail title="Kho prompt template nâng cao cho công việc văn phòng">
            <p className="text-sm text-muted mb-3">
              Dưới đây là các prompt template đã được tối ưu cho từng use case.
              Copy, thay thế {"{placeholder}"} bằng dữ liệu thực của bạn.
            </p>

            <div className="space-y-4">
              <div className="rounded-lg bg-surface p-3">
                <p className="text-xs font-semibold text-foreground mb-1.5">
                  A. Email follow-up sau cuộc họp
                </p>
                <p className="text-xs text-muted leading-relaxed font-mono">
                  &quot;Soạn email follow-up gửi {"{người_tham_gia}"} sau cuộc
                  họp {"{chủ_đề}"} ngày {"{ngày}"}. Tóm tắt: 2-3 điểm chính
                  đã thảo luận, 2-3 action items (ai làm gì, deadline), lịch
                  họp tiếp theo (nếu có). Giọng: chuyên nghiệp, thân thiện.
                  Độ dài: 120-150 từ. Chỉ trả về email, không kèm comment.&quot;
                </p>
              </div>

              <div className="rounded-lg bg-surface p-3">
                <p className="text-xs font-semibold text-foreground mb-1.5">
                  B. Báo cáo tuần rút gọn
                </p>
                <p className="text-xs text-muted leading-relaxed font-mono">
                  &quot;Tôi sẽ dán ghi chú thô bên dưới. Hãy soạn báo cáo tuần
                  theo format: (1) Hoàn thành tuần này — bullet points, mỗi
                  bullet 1 câu; (2) Đang làm dở — bullet points; (3) Kế hoạch
                  tuần sau — bullet points; (4) Blockers/Rủi ro — nếu có.
                  Không thêm thông tin ngoài ghi chú của tôi. Ghi chú:
                  {"{dán ghi chú vào đây}"}&quot;
                </p>
              </div>

              <div className="rounded-lg bg-surface p-3">
                <p className="text-xs font-semibold text-foreground mb-1.5">
                  C. Bài đăng LinkedIn từ bài blog
                </p>
                <p className="text-xs text-muted leading-relaxed font-mono">
                  &quot;Từ bài blog bên dưới, viết bài LinkedIn 200-250 từ:
                  dòng đầu hook thu hút (câu hỏi hoặc số liệu gây shock), 3-4
                  đoạn ngắn (mỗi đoạn 1-2 câu), kết bằng câu hỏi mở cho
                  audience. Không dùng hashtag quá 5. Giọng: chuyên nghiệp
                  nhưng gần gũi. Bài blog: {"{dán bài vào đây}"}&quot;
                </p>
              </div>

              <div className="rounded-lg bg-surface p-3">
                <p className="text-xs font-semibold text-foreground mb-1.5">
                  D. Trả lời email khách hàng phàn nàn
                </p>
                <p className="text-xs text-muted leading-relaxed font-mono">
                  &quot;Khách hàng {"{tên}"} gửi email phàn nàn về
                  {"{vấn_đề}"}. Soạn email trả lời: (1) thừa nhận vấn đề và xin
                  lỗi chân thành không đổ lỗi, (2) giải thích nguyên nhân ngắn
                  gọn, (3) đưa ra giải pháp cụ thể kèm timeline, (4) đề xuất
                  bồi thường/ưu đãi nếu phù hợp, (5) cam kết follow-up. Giọng
                  đồng cảm, chuyên nghiệp. Tránh phòng thủ. 150-200 từ.&quot;
                </p>
              </div>
            </div>
          </CollapsibleDetail>

          {/* CollapsibleDetail 2: Deep-dive vào tóm tắt tài liệu dài */}
          <CollapsibleDetail title="Kỹ thuật tóm tắt tài liệu dài (50+ trang) không bị sót ý">
            <p className="text-sm text-muted mb-3">
              Tóm tắt tài liệu rất dài là bài toán phổ biến — báo cáo thị
              trường, hợp đồng, luận văn. Dưới đây là 4 chiến lược để không
              bị AI bỏ sót ý quan trọng.
            </p>

            <ol className="list-decimal list-inside space-y-3 text-sm text-foreground pl-2">
              <li>
                <strong>Chunk rồi gộp (map-reduce):</strong> Chia tài liệu
                thành các phần 10-15 trang. Tóm tắt từng phần riêng. Cuối
                cùng gộp các tóm tắt thành bản tổng. Công cụ như NotebookLM
                làm việc này tự động.
              </li>
              <li>
                <strong>Tóm tắt theo lớp:</strong> Yêu cầu AI tóm tắt 3 lớp —
                (1) một câu cả tài liệu, (2) một đoạn 5-7 câu, (3) chi tiết
                từng chương/section. Giúp bạn có cái nhìn từ cao xuống thấp.
              </li>
              <li>
                <strong>Tóm tắt theo góc nhìn:</strong> Yêu cầu tóm tắt cho
                vai trò cụ thể — &quot;cho CEO&quot; (chú ý tác động kinh
                doanh), &quot;cho legal&quot; (rủi ro pháp lý), &quot;cho
                engineer&quot; (chi tiết kỹ thuật). Cùng tài liệu, 3 bản
                khác nhau.
              </li>
              <li>
                <strong>Yêu cầu trích dẫn:</strong> Thêm vào prompt: &quot;Với
                mỗi điểm tóm tắt, trích dẫn trang và dòng trong tài liệu gốc.
                Nếu không có, đánh dấu [không tìm thấy].&quot; AI sẽ cẩn
                trọng hơn và bạn kiểm tra được.
              </li>
            </ol>

            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800 p-3 mt-3">
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                <strong>Cảnh báo:</strong> AI rất dễ bịa trích dẫn trang (page
                number). Kiểm tra ngẫu nhiên 3-5 trích dẫn trước khi tin
                tưởng toàn bộ bản tóm tắt.
              </p>
            </div>
          </CollapsibleDetail>
        </div>
      </LessonSection>

      {/* ================================================================
          BƯỚC 5 — CHALLENGE: Cải thiện prompt
          ================================================================ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Bạn nhờ AI viết báo cáo: 'Viết báo cáo cho sếp'. Prompt này thiếu gì QUAN TRỌNG NHẤT để cho kết quả tốt?"
          options={[
            "Thiếu emoji để AI hiểu cảm xúc của bạn",
            "Thiếu ngữ cảnh: báo cáo gì, dữ liệu nào, cho ai, format ra sao",
            "Thiếu từ 'xin vui lòng' để AI lịch sự hơn",
            "Không thiếu gì — prompt ngắn gọn là tốt",
          ]}
          correct={1}
          explanation="Prompt 'Viết báo cáo cho sếp' quá mơ hồ — AI không biết báo cáo gì (KPI? tiến độ? tài chính?), cho ai (trưởng phòng? giám đốc?), format nào (bullet points? đoạn văn?). Áp dụng khung RACE để bổ sung đầy đủ ngữ cảnh."
        />

        <div className="mt-6">
          <InlineChallenge
            question="Bạn vừa copy bản tóm tắt cuộc họp AI viết. Kiểm tra thấy AI ghi 'doanh thu tháng 3 tăng 28%' nhưng trong transcript cuộc họp không có con số này. Hành động đúng là gì?"
            options={[
              "Giữ nguyên vì 28% nghe hợp lý",
              "Xoá câu đó khỏi bản tóm tắt, thêm ghi chú rằng AI đã bịa — và rút kinh nghiệm kiểm tra con số kỹ hơn lần sau",
              "Hỏi lại AI để xác nhận",
              "Gửi cho sếp và đợi sếp sửa nếu sai",
            ]}
            correct={1}
            explanation="AI đã hallucinate (bịa). Con số kinh doanh sai có thể dẫn đến quyết định sai. Luôn loại bỏ thông tin không có trong nguồn gốc khi AI tóm tắt. Đây là lý do quy tắc 'AI soạn — bạn review' tồn tại — đặc biệt với số liệu, tên người, ngày tháng."
          />
        </div>
      </LessonSection>

      {/* ================================================================
          BƯỚC 6 — EXPLAIN: Pitfalls khi dùng AI viết
          ================================================================ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Lưu ý quan trọng">
          <p>
            AI viết rất nhanh, nhưng nếu dùng không cẩn thận, bạn có thể gặp những
            vấn đề nghiêm trọng hơn cả viết chậm.
          </p>

          <h4 className="text-sm font-semibold text-foreground mt-4 mb-2">
            Bẫy #1: Văn phong &quot;AI quá rõ&quot;
          </h4>
          <p className="text-sm text-muted leading-relaxed">
            AI thường viết quá mượt mà, dùng từ hoa mỹ, lặp cấu trúc. Email gửi sếp
            mà đọc như bài văn mẫu thì mất tự nhiên. <strong>Giải pháp:</strong>{" "}
            luôn chỉnh sửa lại bằng giọng riêng của bạn — thêm tên riêng, chi tiết cụ thể
            mà chỉ bạn mới biết.
          </p>

          <h4 className="text-sm font-semibold text-foreground mt-4 mb-2">
            Bẫy #2: AI bịa thông tin
          </h4>
          <p className="text-sm text-muted leading-relaxed">
            Khi tóm tắt cuộc họp hoặc viết báo cáo có số liệu, AI có thể{" "}
            <TopicLink slug="hallucination">bịa nội dung</TopicLink>{" "}
            — thêm thông tin không có trong dữ liệu gốc. <strong>Giải pháp:</strong>{" "}
            luôn đối chiếu output với tài liệu gốc, đặc biệt với con số và tên người.
          </p>

          <h4 className="text-sm font-semibold text-foreground mt-4 mb-2">
            Bẫy #3: Copy-paste không đọc lại
          </h4>
          <p className="text-sm text-muted leading-relaxed">
            Gửi email mà không đọc lại = rủi ro cao. AI có thể hiểu sai ngữ cảnh,
            dùng sai kính ngữ, hoặc bỏ sót thông tin quan trọng.
          </p>

          <h4 className="text-sm font-semibold text-foreground mt-4 mb-2">
            Bẫy #4: Lộ thông tin nội bộ
          </h4>
          <p className="text-sm text-muted leading-relaxed">
            Dán nội dung họp kín, dữ liệu lương, hợp đồng chưa ký vào AI công
            cộng = gửi thông tin ra ngoài. Một số AI free dùng prompt của bạn
            để huấn luyện model. <strong>Giải pháp:</strong> dùng bản enterprise
            có cam kết &quot;không train trên dữ liệu khách hàng&quot; hoặc tự
            che/ẩn danh thông tin nhạy cảm trước khi dán.
          </p>

          <h4 className="text-sm font-semibold text-foreground mt-4 mb-2">
            Bẫy #5: Mất khả năng tự viết
          </h4>
          <p className="text-sm text-muted leading-relaxed">
            Nếu mọi email, báo cáo đều nhờ AI, dần dần bạn sẽ mất cảm giác về
            câu chữ. <strong>Giải pháp:</strong> duy trì &quot;viết tay&quot;
            cho những thứ quan trọng (email khủng hoảng, thư cảm ơn cá nhân),
            chỉ dùng AI cho việc lặp đi lặp lại.
          </p>

          <h4 className="text-sm font-semibold text-foreground mt-4 mb-2">
            Bẫy #6: Ảo tưởng năng suất
          </h4>
          <p className="text-sm text-muted leading-relaxed">
            AI viết 10 email/giờ không có nghĩa bạn năng suất gấp 10. Nếu email
            không được đọc/phản hồi thì đó chỉ là rác. <strong>Giải pháp:</strong>{" "}
            đo lường bằng outcome (deal chốt, vấn đề giải quyết), không phải
            output (số email gửi).
          </p>

          <AhaMoment>
            AI là <strong>người soạn thảo nháp</strong>{" "}
            — không phải người gửi thay bạn.
            Bạn vẫn là người chịu trách nhiệm cuối cùng với mọi nội dung gửi đi.
            Dùng AI để viết nhanh hơn, nhưng luôn kiểm tra và thêm{" "}
            <strong>giọng văn cá nhân</strong>{" "}
            trước khi nhấn Gửi.
          </AhaMoment>

          <Callout variant="tip" title="Quy tắc 3 bước trước khi gửi">
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>
                <strong>Đọc lại</strong>{" "}
                toàn bộ nội dung — sửa những chỗ &quot;nghe không giống mình&quot;
              </li>
              <li>
                <strong>Kiểm tra</strong>{" "}
                số liệu, tên người, ngày tháng — AI hay bịa những thứ này
              </li>
              <li>
                <strong>Thêm chi tiết cá nhân</strong>{" "}
                — một câu hỏi thăm, một lời cảm ơn cụ thể mà AI không thể biết
              </li>
            </ol>
          </Callout>

          <Callout variant="warning" title="Khi KHÔNG nên dùng AI viết">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                Email báo tin buồn, chia buồn — cần sự chân thành của con
                người, không phải văn mẫu
              </li>
              <li>
                Nội dung có thông tin bí mật công ty mà bạn chưa có AI
                enterprise
              </li>
              <li>
                Văn bản pháp lý quan trọng (hợp đồng, di chúc) — cần chuyên gia
                luật kiểm duyệt
              </li>
              <li>
                Thư xin việc vào công ty bạn thực sự muốn — recruiter nhận
                diện AI writing khá tốt
              </li>
              <li>
                Lời cảm ơn cho người đã giúp bạn điều đặc biệt — viết tay cho
                có cảm xúc thật
              </li>
            </ul>
          </Callout>

          {/* Bonus: Script kiểm tra chất lượng đầu ra AI */}
          <div className="mt-6">
            <p className="text-sm text-foreground mb-2">
              Dưới đây là script Python đơn giản để kiểm tra chất lượng email AI
              viết — phát hiện các cụm từ &quot;AI quá rõ&quot; và cảnh báo.
            </p>
            <CodeBlock
              language="python"
              title="Phát hiện email 'AI quá rõ' — script kiểm tra"
            >
{`# Các cụm từ cảnh báo: AI có xu hướng dùng nhiều
AI_CLICHES = [
    "kính mong",
    "rất mong",
    "trong bối cảnh",
    "đồng thời",
    "ngoài ra",
    "không những",
    "với mong muốn",
    "chân thành cảm ơn và",
    "trân trọng kính chào",
    "quý đối tác",
]

# Các chỉ báo khác
AI_PATTERNS = {
    "emoji_overuse": lambda text: text.count("🎉") + text.count("✨") > 2,
    "excessive_formality": lambda text: text.count("kính") > 3,
    "repetitive_transitions": lambda text: (
        text.lower().count("tuy nhiên") +
        text.lower().count("hơn nữa") +
        text.lower().count("ngoài ra")
    ) > 2,
}

def ai_score(text: str) -> dict:
    """Trả về điểm 'độ lộ liễu AI' — càng cao càng cần sửa."""
    text_lower = text.lower()
    cliche_count = sum(
        1 for c in AI_CLICHES if c in text_lower
    )
    pattern_flags = {
        name: fn(text) for name, fn in AI_PATTERNS.items()
    }
    flags_count = sum(pattern_flags.values())
    return {
        "cliche_count": cliche_count,
        "patterns": pattern_flags,
        "total_score": cliche_count + flags_count * 2,
        "verdict": (
            "Cần sửa" if cliche_count + flags_count * 2 >= 5
            else "Chấp nhận được" if cliche_count + flags_count * 2 >= 2
            else "Tự nhiên"
        ),
    }

# Ví dụ
email_draft = "Kính gửi anh, Kính mong anh thông cảm..."
result = ai_score(email_draft)
print(result)`}
            </CodeBlock>
          </div>
      </LessonSection>

      {/* ================================================================
          BƯỚC 7 — CONNECT: MiniSummary + liên kết
          ================================================================ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về AI hỗ trợ viết lách"
          points={[
            "Dùng khung RACE (Role, Action, Context, Example) để viết prompt rõ ràng cho mọi tác vụ viết.",
            "4 ứng dụng phổ biến: email công việc, báo cáo KPI, slides thuyết trình, tóm tắt cuộc họp.",
            "AI là người soạn nháp, bạn là người chịu trách nhiệm — luôn đọc lại và chỉnh sửa trước khi gửi.",
            "Cẩn thận 6 bẫy: văn phong AI quá rõ, bịa thông tin, copy-paste không kiểm tra, lộ dữ liệu, mất khả năng viết, ảo tưởng năng suất.",
            "Chọn công cụ theo ngữ cảnh: ChatGPT (linh hoạt), Claude (viết dài & phân tích), Gemini (Google Workspace), Copilot (Microsoft 365).",
            "Dùng bản enterprise khi xử lý data công ty — chính sách không train trên prompt + audit log là bắt buộc.",
          ]}
        />

        <div className="mt-4 rounded-xl border border-border bg-card p-5">
          <h4 className="text-sm font-semibold text-foreground mb-3">
            Học thêm
          </h4>
          <p className="text-sm text-muted leading-relaxed">
            Muốn viết prompt chuyên sâu hơn? Xem{" "}
            <TopicLink slug="prompt-engineering">
              kỹ thuật viết prompt nâng cao
            </TopicLink>
            . Nếu bạn mới bắt đầu với AI, hãy quay lại{" "}
            <TopicLink slug="getting-started-with-ai">
              hướng dẫn bắt đầu dùng AI
            </TopicLink>
            . Và nhớ tìm hiểu về{" "}
            <TopicLink slug="ai-privacy-security">
              bảo mật khi dùng AI
            </TopicLink>{" "}
            trước khi dán nội dung công ty vào bất kỳ công cụ nào.
          </p>
        </div>

        <Callout variant="insight" title="Lộ trình làm chủ AI viết trong 30 ngày">
          <ol className="list-decimal list-inside space-y-1.5 text-sm">
            <li>
              <strong>Tuần 1:</strong> Chọn 1 công cụ (ChatGPT hoặc Claude),
              dùng cho email hàng ngày. Luyện prompt theo RACE.
            </li>
            <li>
              <strong>Tuần 2:</strong> Thử tóm tắt cuộc họp và soạn báo cáo
              tuần. So sánh thời gian trước/sau AI.
            </li>
            <li>
              <strong>Tuần 3:</strong> Xây kho prompt template cá nhân cho 5-7
              tác vụ bạn làm thường xuyên nhất.
            </li>
            <li>
              <strong>Tuần 4:</strong> Thử công cụ thứ 2 cho tác vụ đặc thù
              (Claude cho tóm tắt tài liệu dài, Gemini cho Google Docs).
              Đánh giá ROI.
            </li>
          </ol>
        </Callout>
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

// ---------------------------------------------------------------------------
// Ghi chú phát triển — dành cho maintainer
//
// 1. Bài này dùng cho đối tượng người mới, nên ví dụ phải rất gần gũi với
//    công việc văn phòng Việt Nam. Không dùng thuật ngữ kỹ thuật sâu.
//
// 2. VisualizationSection thứ hai (so sánh 4 assistant) là phần mở rộng —
//    giúp học viên hiểu không chỉ "cách dùng" mà còn "chọn công cụ nào".
//    Khi cập nhật, nhớ kiểm tra giá và tính năng (thị trường AI đổi rất nhanh).
//
// 3. Khung RACE là đơn giản hóa của CRISPE, RTF, CO-STAR — phù hợp cho
//    người mới. Nếu học viên đã quen, hãy chuyển qua topic prompt-engineering.
//
// 4. 8 câu quiz mix: knowledge (RACE, NĐ 13), application (chọn công cụ),
//    judgement (xử lý sai sót). Không để quá 2 câu liền nhau cùng pattern.
//
// 5. CollapsibleDetail về prompt template — có thể mở rộng thêm template
//    cho ngành dọc (kế toán, nhân sự, marketing) nếu học viên yêu cầu.
//
// 6. Script Python kiểm tra "AI-ness" chỉ là heuristic — không thay thế
//    review thủ công. Nếu cần chính xác hơn, dùng mô hình phân loại riêng.
//
// 7. Các công cụ được đề cập (ChatGPT, Claude, Gemini, Copilot) có thể đổi
//    tên/phiên bản nhanh — kiểm tra lại định kỳ 6 tháng/lần.
//
// 8. Đối tượng mục tiêu: dân văn phòng 25-45 tuổi, dùng máy tính hàng ngày,
//    chưa/mới dùng AI. Giọng văn phải gần gũi, không "quá kỹ thuật".
//
// 9. Nếu có topic "ai-for-email" hoặc "ai-for-meetings" ra đời trong tương
//    lai, cân nhắc tách bớt 4 use cases ở bước 4 thành topic riêng.
//
// ---------------------------------------------------------------------------
// Phụ lục — Bảng so sánh workflow viết tay vs AI cho các tác vụ phổ biến
//
// Email xin nghỉ:
//   - Viết tay: 9 phút, giọng riêng, không rủi ro bịa
//   - AI: 2 phút, phải đọc lại, cần thêm giọng cá nhân
//
// Báo cáo tuần (5 trang):
//   - Viết tay: 2-3 giờ (tổng hợp dữ liệu + viết)
//   - AI: 30-45 phút (tổng hợp dữ liệu + prompt + review)
//
// Slide cho họp hội đồng (10 slide):
//   - Viết tay: 4-6 giờ
//   - AI: 1-2 giờ (AI outline + người chỉnh nội dung + design)
//
// Tóm tắt họp 1 giờ:
//   - Viết tay từ transcript: 30-45 phút
//   - AI: 5-10 phút (prompt + review + chỉnh)
//
// Email marketing 50 khách VIP:
//   - Viết tay: 5-10 giờ
//   - AI với template: 1-2 giờ (tạo template + batch + QC mẫu)
//
// ---------------------------------------------------------------------------
// Phụ lục B — Checklist review email AI trước khi gửi
//
//   [ ] Tên người nhận đúng chính tả, đúng chức danh
//   [ ] Ngày tháng trong email khớp với thực tế
//   [ ] Số liệu (nếu có) khớp với tài liệu gốc
//   [ ] Tiêu đề email rõ ràng, không mơ hồ
//   [ ] Lời mở đầu phù hợp quan hệ (anh/chị/ông/bà/em)
//   [ ] Nội dung không có cụm "AI quá rõ" (kính mong, đồng thời...)
//   [ ] Có ít nhất 1 chi tiết cá nhân mà AI không thể biết
//   [ ] Kết email phù hợp — không quá hoa mỹ
//   [ ] Không có thông tin bí mật không cần thiết
//   [ ] Đọc to 1 lần — nghe có giống bạn không
//
// ---------------------------------------------------------------------------
// Phụ lục C — Các công cụ AI viết đặc biệt cho ngành dọc
//
// Marketing / Content:
//   - Jasper, Copy.ai, Writesonic — chuyên copywriting, ads
//   - Perplexity — research + citation để viết blog có nguồn
//
// Pháp lý:
//   - Harvey (cho luật sư), Lexis+ AI — phân tích hợp đồng, tài liệu luật
//   - Chú ý: cần kiểm tra pháp lý nghiêm ngặt, không dùng cho tư vấn chính thức
//
// Nhân sự / Tuyển dụng:
//   - GoHire AI, Textio — viết job description không bias
//   - Grammarly Business — review email HR
//
// Kỹ thuật:
//   - GitHub Copilot — code comments, documentation
//   - Cursor — tài liệu kỹ thuật inline với code
//
// Giáo dục:
//   - Khanmigo, MagicSchool — soạn giáo án, câu hỏi kiểm tra
//   - Chú ý ethics khi học sinh dùng AI làm bài
//
// ---------------------------------------------------------------------------
// Phụ lục D — Đo lường ROI khi dùng AI viết trong doanh nghiệp
//
// Metric đề xuất:
//   (1) Thời gian viết trung bình / email (trước vs sau AI)
//   (2) Số email/báo cáo hoàn thành trong tuần
//   (3) Tỷ lệ email cần sửa lại sau khi gửi (chỉ báo chất lượng)
//   (4) Độ hài lòng của người nhận (survey nhanh)
//   (5) Chi phí license AI / nhân viên / tháng
//
// Công thức ROI đơn giản:
//   ROI = (giờ_tiết_kiệm × lương_theo_giờ − chi_phí_AI) / chi_phí_AI × 100%
//
// Ví dụ: nhân viên văn phòng lương 50k/giờ, tiết kiệm 1 giờ/ngày
//   → 22 giờ/tháng × 50k = 1.1tr VND tiết kiệm
//   Chi phí ChatGPT Plus: 480k/tháng
//   ROI ≈ (1.1tr − 480k) / 480k ≈ 129%
//
// Nhưng nhớ: ROI chỉ là 1 phần. Chất lượng và rủi ro cũng quan trọng.
//
// ---------------------------------------------------------------------------
// Kết — mục tiêu của bài học
//
// Sau khi hoàn thành topic này, người học nên có thể:
//   1. Viết prompt theo khung RACE cho các tác vụ viết thường gặp.
//   2. Chọn đúng công cụ AI cho từng ngữ cảnh công việc.
//   3. Nhận diện 6 bẫy khi dùng AI viết và có checklist phòng tránh.
//   4. Áp dụng quy tắc 3 bước trước khi gửi — đọc lại, kiểm tra, cá nhân hoá.
//   5. Đo lường được ROI khi dùng AI cho công việc viết lách.
//   6. Có kho prompt template cá nhân cho 5-7 tác vụ thường xuyên.
//
// AI viết không phải phép màu — nó là công cụ giúp bạn viết tốt hơn, nhanh
// hơn, nhưng không thay thế óc phán đoán và trách nhiệm cá nhân.
// ---------------------------------------------------------------------------
