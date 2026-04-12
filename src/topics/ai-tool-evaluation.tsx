"use client";

import { useMemo } from "react";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, TopicLink, MatchPairs, TabView,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "ai-tool-evaluation",
  title: "AI Tool Evaluation",
  titleVi: "So sánh và chọn AI tool",
  description: "So sánh ChatGPT, Claude, Gemini, Copilot — chọn công cụ phù hợp cho nhu cầu công việc.",
  category: "applied-ai",
  tags: ["comparison", "evaluation", "tools", "practical", "office"],
  difficulty: "beginner",
  relatedSlugs: ["getting-started-with-ai", "prompt-engineering", "ai-for-writing"],
  vizType: "interactive",
};

/* ── Dữ liệu so sánh 4 AI tools ── */

interface ToolInfo {
  name: string;
  maker: string;
  model: string;
  strengths: string[];
  weaknesses: string[];
  freeAccess: string;
  paidPrice: string;
  viSupport: string;
  bestFor: string;
}

const AI_TOOLS: ToolInfo[] = [
  {
    name: "ChatGPT",
    maker: "OpenAI",
    model: "GPT-4o, GPT-4.1",
    strengths: [
      "Đa năng, xử lý tốt nhiều loại task",
      "Hệ sinh thái plugin và GPT Store phong phú",
      "Tạo hình ảnh với DALL-E tích hợp sẵn",
      "Cộng đồng người dùng lớn nhất, nhiều tài nguyên học tập",
    ],
    weaknesses: [
      "Bản miễn phí giới hạn số lượt dùng model mạnh",
      "Đôi khi tự tin trả lời sai (hallucination)",
      "Xử lý tài liệu dài chưa tối ưu bằng đối thủ",
    ],
    freeAccess: "Có — GPT-4o mini miễn phí, giới hạn lượt GPT-4o",
    paidPrice: "Plus: ~$20/tháng, Team: ~$25/người/tháng",
    viSupport: "Khá tốt — hiểu và viết tiếng Việt ổn, đôi khi mất dấu ở văn bản dài",
    bestFor: "Người dùng cá nhân cần một công cụ đa năng cho mọi việc",
  },
  {
    name: "Claude",
    maker: "Anthropic",
    model: "Claude Sonnet 4, Claude Opus 4",
    strengths: [
      "Phân tích văn bản dài rất tốt (context window lớn)",
      "Viết code chất lượng cao, giải thích rõ ràng",
      "Thiết kế an toàn, ít hallucination hơn",
      "Tuân thủ chỉ dẫn chính xác, output có cấu trúc tốt",
    ],
    weaknesses: [
      "Không tạo hình ảnh trực tiếp",
      "Hệ sinh thái plugin ít hơn ChatGPT",
      "Chưa có tìm kiếm web tích hợp mạnh như đối thủ",
    ],
    freeAccess: "Có — Claude Sonnet miễn phí với giới hạn lượt",
    paidPrice: "Pro: ~$20/tháng, Team: ~$25/người/tháng",
    viSupport: "Tốt — hiểu ngữ cảnh tiếng Việt tốt, giữ dấu chính xác",
    bestFor: "Phân tích tài liệu dài, viết code, công việc cần độ chính xác cao",
  },
  {
    name: "Gemini",
    maker: "Google",
    model: "Gemini 2.5 Pro, Gemini 2.5 Flash",
    strengths: [
      "Tích hợp sâu với Google Workspace (Docs, Sheets, Gmail)",
      "Khả năng multimodal mạnh (text, ảnh, video, audio)",
      "Truy cập thông tin thời gian thực qua Google Search",
      "Context window rất lớn (lên đến 1 triệu tokens)",
    ],
    weaknesses: [
      "Output đôi khi dài dòng, thiếu súc tích",
      "Chất lượng không đồng đều giữa các ngôn ngữ",
      "Tính năng nâng cao yêu cầu Google One AI Premium",
    ],
    freeAccess: "Có — Gemini Flash miễn phí, tích hợp trong Google Search",
    paidPrice: "Google One AI Premium: ~$20/tháng (bao gồm 2TB storage)",
    viSupport: "Trung bình khá — hiểu tiếng Việt nhưng đôi khi trả lời lẫn tiếng Anh",
    bestFor: "Người dùng hệ sinh thái Google, cần xử lý đa phương tiện",
  },
  {
    name: "Copilot",
    maker: "Microsoft",
    model: "GPT-4o (qua Microsoft)",
    strengths: [
      "Tích hợp trực tiếp vào Microsoft 365 (Word, Excel, PowerPoint, Teams)",
      "Tự động hóa công việc văn phòng: tóm tắt email, tạo slide, phân tích data",
      "Truy cập Bing Search cho thông tin cập nhật",
      "Phù hợp môi trường doanh nghiệp với bảo mật enterprise",
    ],
    weaknesses: [
      "Phụ thuộc vào hệ sinh thái Microsoft",
      "Bản miễn phí khá hạn chế về tính năng",
      "Chất lượng sáng tạo và phân tích sâu kém hơn ChatGPT, Claude",
    ],
    freeAccess: "Có — Copilot miễn phí với tính năng cơ bản",
    paidPrice: "Copilot Pro: ~$20/tháng, Microsoft 365 Copilot: ~$30/người/tháng",
    viSupport: "Trung bình — tiếng Việt ổn cho công việc văn phòng, hạn chế ở nội dung sáng tạo",
    bestFor: "Nhân viên văn phòng dùng Microsoft 365, doanh nghiệp cần tích hợp sẵn",
  },
];

/* ── Evaluation criteria ── */

const EVAL_CRITERIA = [
  {
    name: "Chất lượng output",
    description: "Câu trả lời chính xác, đầy đủ, có cấu trúc rõ ràng không?",
    tip: "Thử cùng một prompt trên nhiều tool và so sánh kết quả trực tiếp.",
  },
  {
    name: "Giá cả",
    description: "Bản miễn phí đủ dùng không? Nếu trả phí, chi phí có hợp lý so với giá trị nhận được?",
    tip: "Hầu hết mọi người chỉ cần 1 gói trả phí. Thử miễn phí trước, nâng cấp khi thấy giới hạn.",
  },
  {
    name: "Bảo mật dữ liệu",
    description: "Dữ liệu của bạn có được bảo vệ? Tool có dùng dữ liệu để huấn luyện không?",
    tip: "Với dữ liệu nhạy cảm của công ty, chọn gói doanh nghiệp có cam kết không dùng dữ liệu để train.",
  },
  {
    name: "Tích hợp hệ sinh thái",
    description: "Tool kết nối với phần mềm bạn đang dùng hằng ngày không?",
    tip: "Dùng Google Workspace → ưu tiên Gemini. Dùng Microsoft 365 → ưu tiên Copilot.",
  },
  {
    name: "Hỗ trợ tiếng Việt",
    description: "Tool hiểu và tạo nội dung tiếng Việt có dấu chính xác không?",
    tip: "Thử viết một đoạn văn tiếng Việt phức tạp với từ chuyên ngành để kiểm tra.",
  },
];

const TOTAL_STEPS = 8;

/* ═══════════════ MAIN ═══════════════ */
export default function AiToolEvaluationTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Bạn cần phân tích một hợp đồng pháp lý dài 80 trang bằng tiếng Việt. Tool nào phù hợp nhất?",
      options: [
        "Copilot — vì tích hợp Microsoft Word",
        "ChatGPT — vì phổ biến nhất và đa năng",
        "Claude — vì xử lý văn bản dài tốt nhất và giữ dấu tiếng Việt chính xác",
        "Gemini — vì có context window lớn nhất",
      ],
      correct: 2,
      explanation: "Claude được thiết kế để phân tích tài liệu dài với context window lớn, output chính xác và có cấu trúc. Gemini cũng có context window lớn, nhưng Claude thường vượt trội ở khả năng tuân thủ chỉ dẫn phức tạp và giữ dấu tiếng Việt. Tuy nhiên, bạn nên thử cả hai trên tài liệu thực tế để so sánh!",
    },
    {
      question: "Tiêu chí nào KHÔNG nên là yếu tố chính khi chọn AI tool cho doanh nghiệp?",
      options: [
        "Bảo mật dữ liệu và chính sách sử dụng dữ liệu của nhà cung cấp",
        "Tool nào đang được nhiều người nổi tiếng trên mạng xã hội quảng cáo",
        "Khả năng tích hợp với phần mềm hiện tại của công ty",
        "Chi phí trên mỗi người dùng so với giá trị công việc được cải thiện",
      ],
      correct: 1,
      explanation: "Quảng cáo trên mạng xã hội không phản ánh chất lượng thực tế của tool cho nhu cầu cụ thể. Bảo mật, tích hợp hệ sinh thái, và chi phí/hiệu quả mới là các tiêu chí quan trọng khi đánh giá cho doanh nghiệp.",
    },
    {
      type: "fill-blank",
      question: "Khi chọn AI tool, nên đánh giá theo 5 tiêu chí: chất lượng output, giá cả, {blank}, tích hợp hệ sinh thái, và hỗ trợ tiếng Việt.",
      blanks: [{ answer: "bảo mật", accept: ["bảo mật", "bảo mật dữ liệu", "an toàn", "an toàn dữ liệu", "security"] }],
      explanation: "Bảo mật dữ liệu là tiêu chí cực kỳ quan trọng, đặc biệt khi dùng AI cho công việc liên quan đến thông tin nhạy cảm của công ty hoặc khách hàng.",
    },
    {
      question: "Nhân viên kế toán dùng Excel hằng ngày muốn dùng AI để phân tích báo cáo tài chính. Tool nào phù hợp nhất cho bối cảnh này?",
      options: [
        "ChatGPT — vì phổ biến và dễ dùng",
        "Claude — vì phân tích văn bản tốt",
        "Copilot — vì tích hợp trực tiếp vào Excel và Microsoft 365",
        "Gemini — vì của Google nên nhanh hơn",
      ],
      correct: 2,
      explanation: "Copilot tích hợp trực tiếp vào Excel, có thể phân tích dữ liệu, tạo công thức, và trực quan hóa ngay trong bảng tính mà không cần copy-paste. Đây là ưu điểm lớn nhất của Copilot: tích hợp vào workflow sẵn có của người dùng Microsoft 365.",
    },
  ], []);

  return (
    <>
      {/* ━━━ STEP 1: HOOK — PREDICTION GATE ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Trong 4 AI tool phổ biến nhất (ChatGPT, Claude, Gemini, Copilot), tool nào tốt nhất?"
          options={[
            "ChatGPT — vì phổ biến nhất và có nhiều người dùng nhất",
            "Claude — vì viết code và phân tích văn bản tốt nhất",
            "Gemini — vì của Google và có nhiều tính năng multimodal",
            "Không có tool nào 'tốt nhất' — phụ thuộc vào nhu cầu cụ thể của bạn",
          ]}
          correct={3}
          explanation="Không có AI tool nào tốt nhất cho mọi tình huống! Mỗi tool có thế mạnh riêng. Chìa khóa là hiểu nhu cầu của bạn và chọn công cụ phù hợp — giống như chọn giữa xe máy, ô tô, và xe đạp tùy quãng đường."
        >
          <p className="text-sm text-muted mt-4">
            Hãy cùng khám phá điểm mạnh, điểm yếu của từng tool và cách chọn công cụ phù hợp cho{" "}
            <strong className="text-foreground">chính bạn</strong>.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ STEP 2: DISCOVER — COMPARISON TABLE / TAB VIEW ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-1">
            4 AI tool phổ biến nhất hiện nay
          </h3>
          <p className="text-sm text-muted mb-4">
            Nhấp vào từng tab để xem chi tiết điểm mạnh, điểm yếu, và trường hợp sử dụng tốt nhất.
          </p>

          <TabView
            tabs={AI_TOOLS.map((tool) => ({
              label: tool.name,
              content: (
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{tool.name}</p>
                      <p className="text-xs text-muted">
                        {tool.maker} — {tool.model}
                      </p>
                    </div>
                  </div>

                  {/* Strengths */}
                  <div>
                    <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1.5">
                      Điểm mạnh
                    </p>
                    <ul className="space-y-1">
                      {tool.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                          <span className="text-green-600 dark:text-green-400 mt-0.5 shrink-0">+</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div>
                    <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide mb-1.5">
                      Hạn chế
                    </p>
                    <ul className="space-y-1">
                      {tool.weaknesses.map((w, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                          <span className="text-red-600 dark:text-red-400 mt-0.5 shrink-0">-</span>
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-lg bg-surface p-3">
                      <p className="text-[10px] font-semibold text-tertiary uppercase tracking-wider mb-1">Bản miễn phí</p>
                      <p className="text-xs text-foreground">{tool.freeAccess}</p>
                    </div>
                    <div className="rounded-lg bg-surface p-3">
                      <p className="text-[10px] font-semibold text-tertiary uppercase tracking-wider mb-1">Bản trả phí</p>
                      <p className="text-xs text-foreground">{tool.paidPrice}</p>
                    </div>
                    <div className="rounded-lg bg-surface p-3">
                      <p className="text-[10px] font-semibold text-tertiary uppercase tracking-wider mb-1">Tiếng Việt</p>
                      <p className="text-xs text-foreground">{tool.viSupport}</p>
                    </div>
                    <div className="rounded-lg bg-surface p-3">
                      <p className="text-[10px] font-semibold text-tertiary uppercase tracking-wider mb-1">Phù hợp nhất</p>
                      <p className="text-xs text-foreground">{tool.bestFor}</p>
                    </div>
                  </div>
                </div>
              ),
            }))}
          />

          <Callout variant="tip" title="Mẹo so sánh">
            Cách tốt nhất để đánh giá: lấy cùng một câu hỏi hoặc nhiệm vụ thực tế, thử trên cả 4 tool, rồi so sánh kết quả.
            Xem thêm cách viết prompt hiệu quả tại{" "}
            <TopicLink slug="prompt-engineering">Kỹ thuật viết prompt</TopicLink>.
          </Callout>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ STEP 3: REVEAL — EVALUATION FRAMEWORK ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Framework đánh giá">
        <ExplanationSection>
          <p>
            <strong>Đánh giá AI tool</strong>{" "}
            không phải chỉ hỏi &quot;tool nào hay nhất?&quot; mà phải dựa trên các tiêu chí cụ thể,
            phù hợp với bối cảnh sử dụng của bạn. Dưới đây là 5 tiêu chí cốt lõi:
          </p>

          <div className="space-y-3 my-4">
            {EVAL_CRITERIA.map((c, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-4">
                <p className="text-sm font-semibold text-foreground mb-1">
                  {i + 1}. {c.name}
                </p>
                <p className="text-sm text-muted mb-2">{c.description}</p>
                <p className="text-xs text-accent">
                  <strong>Mẹo:</strong>{" "}{c.tip}
                </p>
              </div>
            ))}
          </div>

          <AhaMoment>
            Không có AI tool nào <strong>&quot;tốt nhất&quot;</strong>{" "}
            — chỉ có tool <strong>&quot;phù hợp nhất&quot;</strong>{" "}
            cho nhu cầu cụ thể của bạn. Giống như chọn xe: xe máy linh hoạt trong phố,
            ô tô thoải mái đường dài, xe đạp tốt cho sức khỏe — không ai nói xe nào &quot;tốt nhất&quot;.
          </AhaMoment>

          <Callout variant="warning" title="Lưu ý về bảo mật">
            Khi dùng AI cho công việc, đừng bao giờ nhập thông tin nhạy cảm (mật khẩu, số thẻ tín dụng,
            dữ liệu khách hàng) vào bản miễn phí. Hầu hết bản miễn phí có thể dùng dữ liệu của bạn
            để cải thiện model. Gói doanh nghiệp thường có cam kết không sử dụng dữ liệu.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ STEP 4: DEEPEN — MATCH PAIRS ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Luyện tập">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Ghép từng tình huống công việc với AI tool phù hợp nhất. Suy nghĩ về thế mạnh đặc trưng
          của mỗi tool trước khi chọn.
        </p>
        <MatchPairs
          instruction="Chọn một tình huống ở cột A, sau đó chọn AI tool phù hợp nhất ở cột B."
          pairs={[
            { left: "Phân tích báo cáo tài chính 50 trang", right: "Claude" },
            { left: "Tạo slide PowerPoint từ báo cáo trong Teams", right: "Copilot" },
            { left: "Tóm tắt video YouTube dài 2 giờ", right: "Gemini" },
            { left: "Tạo chatbot tùy chỉnh với plugins", right: "ChatGPT" },
          ]}
        />
        <Callout variant="info" title="Nhớ rằng...">
          Đây là gợi ý dựa trên thế mạnh đặc trưng của mỗi tool. Trong thực tế, nhiều tool có thể
          làm được cùng một việc — sự khác biệt nằm ở chất lượng output và mức độ tích hợp.
          Nếu bạn mới bắt đầu, hãy xem{" "}
          <TopicLink slug="getting-started-with-ai">Bắt đầu với AI</TopicLink>{" "}
          để có cái nhìn tổng quan.
        </Callout>
      </LessonSection>

      {/* ━━━ STEP 5: CHALLENGE — INLINE CHALLENGE ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Đặt mình vào tình huống thực tế: bạn là trưởng phòng marketing tại một công ty Việt Nam,
          cần chọn AI tool cho team 10 người.
        </p>
        <InlineChallenge
          question="Team marketing cần: viết content tiếng Việt hằng ngày, tạo hình ảnh quảng cáo, phân tích dữ liệu Google Analytics, và soạn email hàng loạt qua Gmail. Chiến lược nào hợp lý nhất?"
          options={[
            "Mua ChatGPT Plus cho cả team — vì đa năng nhất, làm được mọi thứ",
            "Dùng Gemini cho phân tích Google Analytics và email (vì tích hợp Google), kết hợp ChatGPT cho tạo hình ảnh và content sáng tạo",
            "Dùng Copilot cho tất cả — vì có bản doanh nghiệp an toàn",
            "Chỉ dùng bản miễn phí của tất cả tool — tiết kiệm tối đa cho công ty",
          ]}
          correct={1}
          explanation="Kết hợp nhiều tool dựa trên thế mạnh là chiến lược thông minh nhất! Gemini tích hợp Google Workspace (Analytics, Gmail, Docs) nên xử lý workflow Google rất mượt. ChatGPT có DALL-E tạo hình ảnh và viết content sáng tạo tốt. Không nên chỉ dùng bản miễn phí vì giới hạn sẽ ảnh hưởng năng suất cả team."
        />
      </LessonSection>

      {/* ━━━ STEP 6: EXPLAIN — FREE vs PAID ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Miễn phí vs Trả phí">
        <ExplanationSection>
          <p>
            <strong>Khi nào nên nâng cấp lên bản trả phí?</strong>{" "}
            Đừng vội trả tiền ngay. Hãy dùng bản miễn phí đủ lâu để hiểu rõ nhu cầu thực sự,
            rồi mới quyết định. Nếu bạn biết cách viết{" "}
            <TopicLink slug="prompt-engineering">prompt hiệu quả</TopicLink>,
            bản miễn phí có thể đáp ứng 80% nhu cầu.
          </p>

          <p><strong>Dấu hiệu bạn cần nâng cấp:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <strong>Giới hạn lượt dùng:</strong>{" "}
              bạn thường xuyên hết lượt giữa ngày làm việc
            </li>
            <li>
              <strong>Cần xử lý file dài:</strong>{" "}
              tài liệu, hợp đồng, báo cáo hơn 20 trang
            </li>
            <li>
              <strong>Cần tính năng nâng cao:</strong>{" "}
              tạo hình ảnh, phân tích dữ liệu, custom GPT
            </li>
            <li>
              <strong>Dùng cho công việc nhạy cảm:</strong>{" "}
              cần cam kết bảo mật dữ liệu từ nhà cung cấp
            </li>
          </ul>

          <p><strong>Cá nhân vs Team vs Doanh nghiệp:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <strong>Cá nhân (Plus/Pro):</strong>{" "}
              ~$20/tháng — phù hợp freelancer, sinh viên cần dùng nhiều
            </li>
            <li>
              <strong>Team:</strong>{" "}
              ~$25-30/người/tháng — quản lý workspace chung, chia sẻ prompt/template
            </li>
            <li>
              <strong>Doanh nghiệp (Enterprise):</strong>{" "}
              giá thương lượng — SSO, kiểm soát truy cập, cam kết bảo mật, SLA
            </li>
          </ul>

          <Callout variant="tip" title="Mẹo tiết kiệm">
            Nhiều người trả phí cho tool mà chỉ dùng 10% tính năng. Trước khi nâng cấp,
            hãy liệt kê 3 tình huống cụ thể mà bản miễn phí không đáp ứng được.
            Nếu không liệt kê nổi, có lẽ bạn chưa cần trả phí!
            Tham khảo{" "}
            <TopicLink slug="ai-for-writing">AI cho viết lách</TopicLink>{" "}
            để tận dụng tối đa bản miễn phí cho công việc soạn thảo.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ STEP 7: CONNECT — MINI SUMMARY ━━━ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          points={[
            "Không có AI tool 'tốt nhất' — chỉ có tool 'phù hợp nhất' cho nhu cầu cụ thể của bạn.",
            "ChatGPT đa năng, Claude phân tích sâu, Gemini tích hợp Google, Copilot tích hợp Microsoft 365.",
            "Đánh giá theo 5 tiêu chí: chất lượng output, giá cả, bảo mật, tích hợp, và hỗ trợ tiếng Việt.",
            "Kết hợp nhiều tool dựa trên thế mạnh là chiến lược thông minh hơn dùng một tool cho mọi việc.",
            "Dùng bản miễn phí đủ lâu, viết prompt tốt, chỉ nâng cấp khi thực sự cần.",
          ]}
        />

        <div className="mt-4 space-y-2 text-sm text-muted">
          <p>
            <strong className="text-foreground">Học thêm:</strong>{" "}
            Xem{" "}
            <TopicLink slug="getting-started-with-ai">Bắt đầu với AI</TopicLink>{" "}
            nếu bạn mới làm quen, hoặc{" "}
            <TopicLink slug="prompt-engineering">Kỹ thuật viết prompt</TopicLink>{" "}
            để tận dụng tối đa công cụ đã chọn.
          </p>
        </div>
      </LessonSection>

      {/* ━━━ STEP 8: QUIZ ━━━ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
