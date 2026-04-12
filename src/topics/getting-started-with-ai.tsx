"use client";

import { useMemo } from "react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  TopicLink,
  StepReveal,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

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

const TOTAL_STEPS = 8;

export default function GettingStartedWithAiTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "Khi lần đầu sử dụng AI, bước nào nên làm đầu tiên?",
        options: [
          "Hỏi AI một câu hỏi dài và phức tạp ngay",
          "Tạo tài khoản trên một công cụ AI phổ biến như ChatGPT hoặc Claude",
          "Mua gói trả phí để có kết quả tốt nhất",
          "Đọc hết tài liệu kỹ thuật về mô hình ngôn ngữ lớn",
        ],
        correct: 1,
        explanation:
          "Bước đầu tiên đơn giản là tạo tài khoản miễn phí. Bạn không cần trả phí hay hiểu kỹ thuật để bắt đầu — cứ thử trước, tìm hiểu sau.",
      },
      {
        question:
          "Prompt nào sẽ cho kết quả tốt hơn khi nhờ AI viết email xin phép nghỉ?",
        options: [
          "Viết email nghỉ phép",
          "Viết email xin phép nghỉ 2 ngày gửi trưởng phòng Nguyễn Văn A, lý do việc gia đình, giọng văn lịch sự và chuyên nghiệp",
          "Email nghỉ, ngắn thôi",
          "Viết cái gì đó cho sếp",
        ],
        correct: 1,
        explanation:
          "Prompt cụ thể (có số ngày, người nhận, lý do, giọng văn) giúp AI hiểu chính xác bạn cần gì và cho ra kết quả sát yêu cầu nhất.",
      },
      {
        type: "fill-blank" as const,
        question:
          "Khi kết quả AI chưa tốt, bạn nên {blank} prompt bằng cách thêm chi tiết, thay vì hỏi lại y nguyên câu cũ.",
        blanks: [
          { answer: "tinh chỉnh", accept: ["chỉnh sửa", "cải thiện", "sửa"] },
        ],
        explanation:
          "Tinh chỉnh (refine) prompt là kỹ năng quan trọng nhất khi dùng AI. Thêm ngữ cảnh, ví dụ, hoặc yêu cầu cụ thể hơn sẽ cải thiện kết quả đáng kể.",
      },
      {
        question:
          "AI có thể mắc sai lầm nào sau đây?",
        options: [
          "Trả lời sai nhưng nghe rất tự tin và thuyết phục",
          "Từ chối trả lời mọi câu hỏi",
          "Tự động gửi email thay bạn mà không hỏi",
          "Tự xóa tài khoản của bạn",
        ],
        correct: 0,
        explanation:
          "Đây gọi là hiện tượng \"ảo giác\" (hallucination) — AI có thể bịa ra thông tin sai nhưng trình bày rất thuyết phục. Luôn kiểm tra lại các thông tin quan trọng.",
      },
    ],
    []
  );

  return (
    <>
      {/* ━━━ Step 1: HOOK — Bạn đã dùng AI chưa? ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử đoán">
        <PredictionGate
          question="Theo bạn, một nhân viên văn phòng có thể dùng AI để làm gì NHANH nhất trong 5 phút đầu tiên?"
          options={[
            "Xây dựng một ứng dụng di động hoàn chỉnh",
            "Viết email, tóm tắt tài liệu, hoặc dịch văn bản",
            "Thay thế hoàn toàn công việc của mình",
          ]}
          correct={1}
          explanation="AI hiện tại rất giỏi xử lý văn bản: viết email, tóm tắt báo cáo, dịch tài liệu, soạn thảo nội dung — những việc mà dân văn phòng làm hằng ngày. Bạn không cần biết lập trình, chỉ cần biết cách hỏi!"
        >
          <p className="text-base text-foreground/90 leading-relaxed">
            Dù bạn chưa từng dùng AI hay đã thử qua,{" "}
            bài học này sẽ giúp bạn <strong>tạo tài khoản</strong>,{" "}
            <strong>có cuộc hội thoại đầu tiên</strong>,{" "}
            và <strong>nhận kết quả hữu ích</strong>{" "}
            — tất cả trong vòng 5 phút.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ Step 2: DISCOVER — 3 bước bắt đầu ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-1">
            3 bước bắt đầu sử dụng AI
          </h3>
          <p className="text-sm text-muted mb-4">
            Nhấp &quot;Tiếp tục&quot; để xem từng bước. Đơn giản hơn bạn nghĩ!
          </p>

          <StepReveal
            labels={[
              "Bước 1: Tạo tài khoản",
              "Bước 2: Gõ câu hỏi đầu tiên",
              "Bước 3: Tinh chỉnh kết quả",
            ]}
          >
            {/* Bước 1 */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <p className="text-sm text-foreground leading-relaxed">
                <strong>Tạo tài khoản miễn phí</strong>{" "}
                trên một trong các công cụ AI phổ biến:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm text-foreground/90">
                <li>
                  <strong>ChatGPT</strong>{" "}
                  (chat.openai.com) — phổ biến nhất, giao diện tiếng Việt
                </li>
                <li>
                  <strong>Claude</strong>{" "}
                  (claude.ai) — trả lời dài và chi tiết, giỏi phân tích
                </li>
                <li>
                  <strong>Gemini</strong>{" "}
                  (gemini.google.com) — tích hợp sẵn với Google
                </li>
              </ul>
              <Callout variant="tip" title="Mẹo">
                Chỉ cần email là đủ. Hầu hết đều có gói miễn phí để bạn thử trước khi quyết định trả phí.
              </Callout>
            </div>

            {/* Bước 2 */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <p className="text-sm text-foreground leading-relaxed">
                <strong>Gõ câu hỏi đầu tiên</strong>{" "}
                — cứ viết tự nhiên như đang nhắn tin cho đồng nghiệp:
              </p>
              <div className="rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/15 p-3 mt-2">
                <p className="text-sm text-foreground italic">
                  &quot;Giúp tôi viết email xin phép nghỉ 2 ngày vì việc gia đình,
                  gửi trưởng phòng, giọng văn lịch sự.&quot;
                </p>
              </div>
              <Callout variant="info" title="Gợi ý câu hỏi đầu tiên">
                Hãy thử một việc bạn hay làm ở công ty: viết email, dịch tài liệu, hoặc tóm tắt cuộc họp.
              </Callout>
            </div>

            {/* Bước 3 */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <p className="text-sm text-foreground leading-relaxed">
                <strong>Tinh chỉnh kết quả</strong>{" "}
                — nếu câu trả lời chưa ưng ý, hãy yêu cầu cụ thể hơn:
              </p>
              <div className="space-y-2 mt-2">
                <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/15 p-3">
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Trước tinh chỉnh:</span>
                  <p className="text-sm text-foreground mt-1 italic">&quot;Viết email nghỉ phép&quot;</p>
                </div>
                <div className="rounded-lg border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/15 p-3">
                  <span className="text-xs font-semibold text-green-600 dark:text-green-400">Sau tinh chỉnh:</span>
                  <p className="text-sm text-foreground mt-1 italic">
                    &quot;Viết lại email trên, ngắn gọn hơn, thêm dòng cam kết hoàn thành
                    công việc bàn giao trước khi nghỉ.&quot;
                  </p>
                </div>
              </div>
            </div>
          </StepReveal>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ Step 3: REVEAL — Chuyện gì xảy ra khi bạn chat với AI? ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Tìm hiểu">
        <ExplanationSection>
          <p>
            Khi bạn gõ một câu hỏi và nhấn gửi, đằng sau màn hình là một{" "}
            <strong>mô hình ngôn ngữ lớn</strong>{" "}
            (<TopicLink slug="llm-overview">Large Language Model — LLM</TopicLink>)
            đang hoạt động. Nó đã được &quot;đọc&quot; hàng tỷ trang web, sách, bài báo
            để học cách sử dụng ngôn ngữ.
          </p>

          <p>
            Hiểu đơn giản: AI <strong>không suy nghĩ</strong>{" "}
            như con người. Nó dự đoán từ tiếp theo phù hợp nhất dựa trên những gì
            bạn viết. Câu hỏi càng rõ ràng, AI càng dễ dự đoán đúng ý bạn.
          </p>

          <Callout variant="warning" title="AI không phải lúc nào cũng đúng">
            AI có thể tự tin đưa ra thông tin sai — gọi là{" "}
            <TopicLink slug="hallucination">hiện tượng ảo giác (hallucination)</TopicLink>.
            Luôn kiểm tra lại những thông tin quan trọng như số liệu, ngày tháng,
            và tên riêng.
          </Callout>

          <p>
            Bạn không cần hiểu kỹ thuật để dùng AI hiệu quả — giống như bạn
            không cần hiểu cách hoạt động của động cơ để lái xe. Nhưng nếu tò mò,
            hãy tìm hiểu thêm ở bài{" "}
            <TopicLink slug="llm-overview">Tổng quan về LLM</TopicLink>.
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ Step 4: DEEPEN — Ví dụ thực tế ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thực hành">
        <h3 className="text-base font-semibold text-foreground mb-3">
          3 việc bạn có thể làm ngay với AI
        </h3>
        <p className="text-sm text-muted mb-4">
          Đây là những ví dụ thực tế mà nhân viên văn phòng ở Việt Nam hay dùng nhất.
        </p>

        <div className="space-y-4">
          {/* Ví dụ 1: Email */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <p className="text-sm font-semibold text-accent">
              1. Viết email xin phép nghỉ
            </p>
            <div className="rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/15 p-3">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Prompt:</span>
              <p className="text-sm text-foreground mt-1 italic">
                &quot;Viết email gửi trưởng phòng Nguyễn Thị Hoa xin nghỉ phép ngày 15-16/4
                vì việc gia đình. Giọng văn lịch sự, cam kết bàn giao công việc cho
                anh Minh trước khi nghỉ. Khoảng 100 từ.&quot;
              </p>
            </div>
          </div>

          {/* Ví dụ 2: Tóm tắt */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <p className="text-sm font-semibold text-accent">
              2. Tóm tắt báo cáo dài
            </p>
            <div className="rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/15 p-3">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Prompt:</span>
              <p className="text-sm text-foreground mt-1 italic">
                &quot;Tóm tắt nội dung sau thành 5 gạch đầu dòng, mỗi gạch đầu dòng
                1-2 câu, tập trung vào các số liệu quan trọng: [dán nội dung báo cáo vào đây]&quot;
              </p>
            </div>
          </div>

          {/* Ví dụ 3: Dịch */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <p className="text-sm font-semibold text-accent">
              3. Dịch tài liệu tiếng Anh
            </p>
            <div className="rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/15 p-3">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Prompt:</span>
              <p className="text-sm text-foreground mt-1 italic">
                &quot;Dịch đoạn tiếng Anh sau sang tiếng Việt. Giữ nguyên thuật ngữ
                chuyên ngành bằng tiếng Anh trong ngoặc. Giọng văn trang trọng,
                phù hợp báo cáo công ty: [dán văn bản tiếng Anh]&quot;
              </p>
            </div>
          </div>
        </div>

        <Callout variant="tip" title="Bí quyết">
          Hãy thử ngay một trong ba ví dụ trên với công việc thật của bạn.
          Càng dùng nhiều, bạn càng biết cách hỏi AI hiệu quả hơn. Tìm hiểu
          thêm về{" "}
          <TopicLink slug="ai-tool-evaluation">cách chọn công cụ AI phù hợp</TopicLink>.
        </Callout>
      </LessonSection>

      {/* ━━━ Step 5: CHALLENGE — Biến prompt tệ thành prompt tốt ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <AhaMoment>
          Sự khác biệt giữa người dùng AI hiệu quả và người thất vọng không phải
          là công cụ nào họ dùng — mà là <strong>cách họ đặt câu hỏi</strong>.{" "}
          Một prompt rõ ràng, cụ thể sẽ cho kết quả tốt hơn gấp nhiều lần so với
          một câu hỏi mơ hồ.
        </AhaMoment>

        <div className="mt-6">
          <InlineChallenge
            question="Đồng nghiệp nhờ AI 'Viết báo cáo' nhưng kết quả rất chung chung. Bạn sẽ sửa prompt như thế nào?"
            options={[
              "Viết báo cáo hay hơn",
              "Viết báo cáo tổng kết doanh số quý 1/2025 của phòng kinh doanh, gồm 3 phần: tổng quan, phân tích theo sản phẩm, và đề xuất quý 2. Khoảng 500 từ, giọng văn chuyên nghiệp.",
              "Viết báo cáo dài hơn và chi tiết hơn",
              "Viết báo cáo cho sếp tôi",
            ]}
            correct={1}
            explanation="Prompt tốt cần có: chủ đề cụ thể (doanh số quý 1), bối cảnh (phòng kinh doanh), cấu trúc (3 phần), độ dài (500 từ), và giọng văn (chuyên nghiệp). Các lựa chọn khác vẫn quá mơ hồ để AI hiểu đúng ý bạn."
          />
        </div>
      </LessonSection>

      {/* ━━━ Step 6: EXPLAIN — Sai lầm thường gặp ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Lưu ý">
        <ExplanationSection>
          <p>
            <strong>Sai lầm phổ biến</strong>{" "}
            của người mới bắt đầu dùng AI — và cách khắc phục:
          </p>

          <ul className="list-disc list-inside space-y-3 pl-2">
            <li>
              <strong>Hỏi quá chung chung:</strong>{" "}
              &quot;Viết email&quot; thay vì nói rõ email gì, gửi ai, giọng văn nào.
              AI không đọc được suy nghĩ của bạn — bạn phải nói rõ bạn muốn gì.
            </li>
            <li>
              <strong>Không cho ngữ cảnh:</strong>{" "}
              &quot;Dịch cái này&quot; mà không nói dịch cho ai đọc, trong lĩnh vực gì.
              Một bản dịch y khoa khác hoàn toàn với bản dịch marketing.
            </li>
            <li>
              <strong>Tin mọi thứ AI nói:</strong>{" "}
              AI có thể &quot;bịa&quot; số liệu, trích dẫn sai, hoặc đưa thông tin lỗi thời.
              Luôn kiểm tra lại các dữ liệu quan trọng.
            </li>
            <li>
              <strong>Bỏ cuộc sau lần đầu:</strong>{" "}
              Kết quả lần đầu ít khi hoàn hảo. Hãy tinh chỉnh prompt: thêm chi tiết,
              yêu cầu sửa phần nào đó, hoặc cho AI ví dụ mẫu.
            </li>
          </ul>

          <Callout variant="insight" title="Quy tắc vàng">
            Hãy nghĩ về AI như một thực tập sinh rất giỏi nhưng mới vào công ty:
            thông minh, nhanh nhẹn, nhưng cần bạn <strong>hướng dẫn cụ thể</strong>{" "}
            thì mới làm đúng ý. Muốn nâng cao kỹ năng ra lệnh cho AI,
            hãy học{" "}
            <TopicLink slug="prompt-engineering">kỹ thuật viết prompt</TopicLink>.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ Step 7: CONNECT — Tóm tắt + bước tiếp theo ━━━ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ"
          points={[
            "Bắt đầu bằng cách tạo tài khoản miễn phí trên ChatGPT, Claude, hoặc Gemini — chỉ cần email.",
            "Hỏi AI như nhắn tin cho đồng nghiệp: tự nhiên, cụ thể, có ngữ cảnh rõ ràng.",
            "Kết quả lần đầu chưa tốt? Đừng bỏ cuộc — tinh chỉnh prompt bằng cách thêm chi tiết hoặc cho ví dụ mẫu.",
            "AI rất giỏi viết email, tóm tắt, dịch thuật, và soạn thảo — bắt đầu với những việc bạn làm hằng ngày.",
            "Luôn kiểm tra lại thông tin quan trọng — AI có thể tự tin đưa ra thông tin sai.",
          ]}
        />

        <div className="mt-4">
          <Callout variant="info" title="Bước tiếp theo">
            Bạn đã biết cách bắt đầu! Tiếp theo, hãy học{" "}
            <TopicLink slug="prompt-engineering">kỹ thuật viết prompt</TopicLink>{" "}
            để nâng cao kỹ năng giao tiếp với AI, hoặc tìm hiểu{" "}
            <TopicLink slug="ai-tool-evaluation">cách đánh giá công cụ AI</TopicLink>{" "}
            để chọn đúng công cụ cho nhu cầu của mình.
          </Callout>
        </div>
      </LessonSection>

      {/* ━━━ Step 8: QUIZ ━━━ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
