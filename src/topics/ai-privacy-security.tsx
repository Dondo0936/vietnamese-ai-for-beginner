"use client";

import { useMemo } from "react";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, TopicLink, DragDrop,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "ai-privacy-security",
  title: "AI Privacy & Security",
  titleVi: "Bảo mật khi dùng AI",
  description:
    "Những gì KHÔNG NÊN đưa vào AI tool, chính sách dữ liệu công ty, và cách bảo vệ thông tin cá nhân.",
  category: "ai-safety",
  tags: ["privacy", "security", "data-protection", "practical", "office"],
  difficulty: "beginner",
  relatedSlugs: ["guardrails", "ai-governance", "bias-fairness"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

export default function AiPrivacySecurityTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "Đồng nghiệp muốn dùng ChatGPT miễn phí để dịch hợp đồng bảo mật với đối tác nước ngoài. Lời khuyên nào ĐÚNG NHẤT?",
        options: [
          "Cứ paste vào — ChatGPT không lưu gì cả",
          "KHÔNG paste hợp đồng bảo mật vào phiên bản miễn phí. Dùng bản Enterprise có cam kết không dùng dữ liệu để training, hoặc xin phép quản lý trước",
          "Chỉ paste nửa hợp đồng thì an toàn",
          "Dùng ChatGPT nhưng tắt lịch sử chat là đủ",
        ],
        correct: 1,
        explanation:
          "Hợp đồng bảo mật chứa thông tin nhạy cảm của cả hai bên. Phiên bản miễn phí có thể dùng dữ liệu để cải thiện mô hình. Tắt lịch sử chat chỉ ngừng hiển thị ở sidebar, không đảm bảo dữ liệu không được xử lý. Bản Enterprise (ChatGPT Team/Enterprise, Azure OpenAI) có cam kết pháp lý rõ ràng.",
      },
      {
        question:
          "Theo Nghị định 13/2023/NĐ-CP của Việt Nam, khi đưa dữ liệu cá nhân khách hàng vào AI tool, doanh nghiệp cần gì?",
        options: [
          "Không cần gì — AI tool không phải là bên thứ ba",
          "Phải có sự đồng ý của chủ thể dữ liệu, thông báo mục đích xử lý, và đảm bảo bảo mật",
          "Chỉ cần thông báo nội bộ trong công ty",
          "Chỉ áp dụng cho doanh nghiệp có trên 1000 nhân viên",
        ],
        correct: 1,
        explanation:
          "Nghị định 13/2023 yêu cầu: (1) đồng ý rõ ràng của chủ thể dữ liệu, (2) thông báo mục đích xử lý, (3) cho phép rút lại đồng ý, (4) bảo mật dữ liệu. AI tool là bên xử lý dữ liệu — đưa dữ liệu khách hàng vào mà không có đồng ý là vi phạm, phạt đến 100 triệu VND.",
      },
      {
        type: "fill-blank",
        question:
          "Trước khi paste bất kỳ nội dung nào vào AI, hãy tự hỏi: nếu nội dung này bị {blank} thì hậu quả có {blank} không?",
        blanks: [
          { answer: "lộ ra ngoài", accept: ["rò rỉ", "công khai", "lộ"] },
          { answer: "nghiêm trọng", accept: ["nặng", "lớn", "nguy hiểm"] },
        ],
        explanation:
          "Đây là nguyên tắc vàng: nếu việc lộ nội dung gây hậu quả nghiêm trọng (mất khách hàng, vi phạm pháp luật, thiệt hại tài chính) thì KHÔNG ĐƯỢC đưa vào AI tool công cộng.",
      },
      {
        question:
          "Giải pháp nào giúp doanh nghiệp vừa dùng AI hiệu quả VỪA bảo vệ dữ liệu?",
        options: [
          "Cấm hoàn toàn nhân viên dùng AI",
          "Triển khai AI Enterprise (Azure OpenAI, Claude for Enterprise) kết hợp chính sách sử dụng AI nội bộ rõ ràng",
          "Cho nhân viên tự quyết định — ai cũng biết bảo mật",
          "Chỉ dùng AI cho việc cá nhân, không dùng cho công việc",
        ],
        correct: 1,
        explanation:
          "Cấm hoàn toàn không thực tế — nhân viên sẽ dùng lén (shadow AI). Giải pháp tốt nhất: cung cấp công cụ AI có bảo mật Enterprise (dữ liệu không dùng để training, mã hoá, tuân thủ pháp luật) + ban hành chính sách rõ ràng về những gì được/không được đưa vào AI.",
      },
    ],
    []
  );

  return (
    <>
      {/* ================================================================
          BƯỚC 1 — HOOK / DỰ ĐOÁN
          ================================================================ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Đồng nghiệp paste hợp đồng khách hàng vào ChatGPT để tóm tắt. Theo bạn, hành động này đúng hay sai?"
          options={[
            "Đúng — ChatGPT chỉ xử lý rồi quên, không lưu gì",
            "Sai — dữ liệu hợp đồng có thể bị dùng để huấn luyện mô hình, và vi phạm chính sách bảo mật công ty",
            "Tuỳ — nếu hợp đồng không quan trọng thì không sao",
          ]}
          correct={1}
          explanation="Hành động này tiềm ẩn rủi ro lớn! Với phiên bản miễn phí, OpenAI có thể dùng dữ liệu hội thoại để cải thiện mô hình. Hợp đồng khách hàng chứa thông tin nhạy cảm — một khi đã gửi đi, bạn không thể kiểm soát được dữ liệu đó nữa."
        >
          <p className="mt-3 text-sm text-muted leading-relaxed">
            Rất nhiều nhân viên mắc lỗi này mỗi ngày mà không biết hậu quả.
            Tiếp tục để tìm hiểu ranh giới giữa an toàn và nguy hiểm khi dùng AI.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ================================================================
          BƯỚC 2 — DISCOVER: DragDrop phân loại dữ liệu
          ================================================================ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Kéo từng loại thông tin vào ô phân loại đúng: dữ liệu nào{" "}
          <strong className="text-foreground">an toàn</strong>{" "}
          để đưa vào AI tool công cộng, dữ liệu nào{" "}
          <strong className="text-foreground">không nên</strong>?
        </p>

        <VisualizationSection>
          <DragDrop
            instruction="Kéo từng mục vào cột phù hợp. Suy nghĩ kỹ trước khi kiểm tra!"
            items={[
              { id: "public-info", label: "Thông tin công khai trên website" },
              { id: "general-question", label: "Câu hỏi chung về kiến thức" },
              { id: "email-template", label: "Template email chúc mừng" },
              { id: "cmnd-cccd", label: "Số CMND/CCCD của khách hàng" },
              { id: "nda-contract", label: "Hợp đồng bảo mật (NDA)" },
              { id: "password", label: "Mật khẩu hoặc API key" },
              { id: "customer-data", label: "Danh sách khách hàng + SĐT" },
              { id: "internal-code", label: "Code nguồn nội bộ chưa công khai" },
            ]}
            zones={[
              {
                id: "zone-safe",
                label: "An toàn để dùng AI",
                accepts: ["public-info", "general-question", "email-template"],
              },
              {
                id: "zone-unsafe",
                label: "Không nên đưa vào AI",
                accepts: ["cmnd-cccd", "nda-contract", "password", "customer-data", "internal-code"],
              },
            ]}
          />
          <Callout variant="warning" title="Nguyên tắc vàng">
            Nếu nội dung bị lộ ra ngoài sẽ gây hậu quả nghiêm trọng (pháp lý, tài chính, uy tín) thì{" "}
            <strong>tuyệt đối không paste vào AI tool công cộng</strong>. Khi không chắc chắn, hãy hỏi bộ phận IT/bảo mật trước.
          </Callout>
        </VisualizationSection>
      </LessonSection>

      {/* ================================================================
          BƯỚC 3 — REVEAL: Cách AI xử lý dữ liệu của bạn
          ================================================================ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Giải thích">
        <ExplanationSection topicSlug={metadata.slug}>
          <p>
            <strong>Khi bạn gửi dữ liệu vào AI tool</strong>{" "}
            — dù là ChatGPT, Gemini, hay Claude — dữ liệu đó đi qua nhiều giai đoạn xử lý. Hiểu rõ quy trình này giúp bạn đánh giá rủi ro chính xác hơn.
          </p>

          <Callout variant="insight" title="Dữ liệu của bạn đi đâu?">
            <div className="space-y-2">
              <p>
                <strong>1. Truyền tải:</strong>{" "}
                Dữ liệu được gửi qua internet đến server của nhà cung cấp (thường ở Mỹ hoặc EU). Dù được mã hoá khi truyền (HTTPS), dữ liệu vẫn được giải mã ở server để xử lý.
              </p>
              <p>
                <strong>2. Xử lý:</strong>{" "}
                Mô hình AI đọc và phân tích nội dung bạn gửi để tạo ra câu trả lời. Quá trình này diễn ra trên server, không phải trên máy bạn.
              </p>
              <p>
                <strong>3. Lưu trữ:</strong>{" "}
                Tuỳ chính sách từng nhà cung cấp: phiên bản miễn phí thường lưu lại hội thoại để cải thiện mô hình; phiên bản Enterprise cam kết không lưu hoặc không dùng để training.
              </p>
              <p>
                <strong>4. Huấn luyện:</strong>{" "}
                Một số nhà cung cấp có thể dùng dữ liệu hội thoại để huấn luyện phiên bản mô hình tiếp theo — nghĩa là nội dung bạn paste có thể xuất hiện gián tiếp trong câu trả lời cho người khác.
              </p>
            </div>
          </Callout>

          <Callout variant="info" title="So sánh chính sách dữ liệu">
            <div className="space-y-2">
              <p>
                <strong>ChatGPT miễn phí:</strong>{" "}
                Dữ liệu có thể được dùng để cải thiện mô hình. Tắt {'"Improve the model for everyone"'} trong settings để opt-out, nhưng dữ liệu vẫn được lưu tạm 30 ngày.
              </p>
              <p>
                <strong>ChatGPT Team/Enterprise:</strong>{" "}
                Cam kết không dùng dữ liệu để training. Dữ liệu được mã hoá, tuân thủ SOC 2.
              </p>
              <p>
                <strong>Claude (Anthropic):</strong>{" "}
                Phiên bản API và Enterprise không dùng dữ liệu để training. Phiên bản web miễn phí có thể dùng.
              </p>
              <p>
                <strong>Gemini (Google):</strong>{" "}
                Google Workspace có chính sách riêng cho doanh nghiệp, cam kết không dùng dữ liệu doanh nghiệp để training mô hình chung.
              </p>
            </div>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ================================================================
          BƯỚC 4 — DEEPEN: Giải pháp AI Enterprise
          ================================================================ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Giải pháp Enterprise">
            <p>
              Cấm hoàn toàn nhân viên dùng AI là không thực tế — họ sẽ dùng lén trên điện thoại cá nhân (gọi là{" "}
              <strong>shadow AI</strong>), còn nguy hiểm hơn vì không ai kiểm soát được. Giải pháp là cung cấp công cụ AI an toàn cấp doanh nghiệp.
            </p>

            <Callout variant="tip" title="Các lựa chọn AI Enterprise phổ biến">
              <div className="space-y-2">
                <p>
                  <strong>Azure OpenAI Service:</strong>{" "}
                  GPT-4 chạy trên hạ tầng Microsoft Azure. Dữ liệu không rời khỏi tenant của bạn, không dùng để training, tuân thủ ISO 27001, SOC 2, GDPR. Có thể chọn vùng dữ liệu (Southeast Asia cho Việt Nam).
                </p>
                <p>
                  <strong>Claude for Enterprise (Anthropic):</strong>{" "}
                  SSO, SCIM, audit log, dữ liệu không dùng để training. Phù hợp doanh nghiệp cần AI mạnh với cam kết bảo mật cao.
                </p>
                <p>
                  <strong>Triển khai nội bộ (On-premise):</strong>{" "}
                  Chạy mô hình mã nguồn mở (Llama, Mistral) trên server riêng. Dữ liệu không bao giờ rời khỏi mạng nội bộ. Phù hợp tổ chức có yêu cầu bảo mật đặc biệt (ngân hàng, quốc phòng).
                </p>
                <p>
                  <strong>Google Gemini for Workspace:</strong>{" "}
                  Tích hợp trực tiếp vào Gmail, Docs, Sheets. Tuân thủ chính sách dữ liệu Workspace hiện có.
                </p>
              </div>
            </Callout>

            <Callout variant="warning" title="Lưu ý cho doanh nghiệp Việt Nam">
              Theo Luật An ninh mạng 2018, một số loại dữ liệu phải được lưu trữ tại Việt Nam. Khi dùng AI cloud nước ngoài, cần đánh giá xem dữ liệu có thuộc diện phải lưu trữ trong nước không. Tham khảo thêm về{" "}
              <TopicLink slug="ai-governance">quản trị AI</TopicLink>{" "}
              để hiểu khung pháp lý đầy đủ.
            </Callout>
      </LessonSection>

      {/* ================================================================
          BƯỚC 5 — CHALLENGE: Tình huống thực tế
          ================================================================ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Bạn là nhân viên văn phòng. Hãy đánh giá tình huống sau:
        </p>
        <InlineChallenge
          question="Bạn cần viết email trả lời khiếu nại của khách hàng Nguyễn Văn A, số hợp đồng BH-2024-1234, về sản phẩm bảo hiểm. Bạn muốn dùng AI để soạn email phản hồi chuyên nghiệp. Cách nào AN TOÀN nhất?"
          options={[
            "Paste nguyên email khiếu nại (có tên, số hợp đồng, chi tiết sản phẩm) vào ChatGPT miễn phí",
            "Ẩn danh hoá: thay tên bằng 'Khách hàng X', xoá số hợp đồng, chỉ mô tả chung tình huống, rồi dùng AI để soạn mẫu phản hồi",
            "Gửi qua email cho bạn bè nhờ viết hộ bằng AI",
            "Chụp màn hình email rồi upload lên AI — ảnh thì không sao",
          ]}
          correct={1}
          explanation="Cách B đúng: ẩn danh hoá (anonymize) trước khi đưa vào AI. Xoá tên, số hợp đồng, SĐT, địa chỉ — chỉ giữ lại ngữ cảnh chung. AI vẫn giúp bạn soạn email chuyên nghiệp mà không lộ thông tin khách hàng. Chụp màn hình cũng không an toàn vì AI có thể đọc được text trong ảnh (OCR)."
        />

        <Callout variant="tip" title="Mẹo ẩn danh hoá nhanh">
          Trước khi paste vào AI, thay: tên thật bằng {'"Anh/Chị X"'}, số CMND/hợp đồng bằng {'"[MÃ SỐ]"'}, SĐT bằng {'"[SĐT]"'}, địa chỉ bằng {'"[ĐỊA CHỈ]"'}. Chỉ mất 30 giây nhưng bảo vệ được cả bạn lẫn khách hàng.
        </Callout>
      </LessonSection>

      {/* ================================================================
          BƯỚC 6 — EXPLAIN: Xây dựng chính sách AI công ty
          ================================================================ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Chính sách AI công ty">
          <p>
            Một chính sách sử dụng AI nội bộ tốt giúp nhân viên biết rõ ranh giới, tránh rủi ro mà vẫn tận dụng được sức mạnh AI. Dưới đây là những nội dung cần có.
          </p>

          <Callout variant="insight" title="Checklist chính sách AI nội bộ">
            <div className="space-y-2">
              <p>
                <strong>1. Danh sách dữ liệu cấm:</strong>{" "}
                Liệt kê rõ ràng những gì KHÔNG ĐƯỢC đưa vào AI: dữ liệu cá nhân (CMND, SĐT), hợp đồng bảo mật, mã nguồn nội bộ, thông tin tài chính chưa công bố, mật khẩu/API key.
              </p>
              <p>
                <strong>2. Công cụ AI được phê duyệt:</strong>{" "}
                Chỉ dùng các AI tool đã được IT/bảo mật đánh giá. Ví dụ: Azure OpenAI (được duyệt) vs ChatGPT miễn phí (chưa được duyệt cho dữ liệu công ty).
              </p>
              <p>
                <strong>3. Quy trình ẩn danh hoá:</strong>{" "}
                Hướng dẫn cụ thể cách xoá thông tin nhạy cảm trước khi đưa vào AI.
              </p>
              <p>
                <strong>4. Kiểm tra đầu ra:</strong>{" "}
                AI có thể{" "}
                <TopicLink slug="hallucination">tạo ra thông tin sai (hallucination)</TopicLink>
                {" "} — nhân viên phải kiểm tra kết quả trước khi sử dụng chính thức.
              </p>
              <p>
                <strong>5. Tuân thủ pháp luật:</strong>{" "}
                Đảm bảo phù hợp Nghị định 13/2023 (bảo vệ dữ liệu cá nhân) và Luật An ninh mạng 2018. Xem thêm tại{" "}
                <TopicLink slug="ai-governance">quản trị AI</TopicLink>.
              </p>
              <p>
                <strong>6. Đào tạo nhân viên:</strong>{" "}
                Tổ chức training định kỳ về cách dùng AI an toàn — không phải ai cũng biết rủi ro.
              </p>
            </div>
          </Callout>

          <Callout variant="info" title="Ví dụ thực tế">
            Samsung đã cấm nhân viên dùng ChatGPT sau khi phát hiện kỹ sư paste mã nguồn nội bộ vào AI. Apple, JPMorgan cũng đưa ra quy định tương tự. Giải pháp lâu dài: không cấm mà cung cấp công cụ AI Enterprise an toàn kèm chính sách rõ ràng.
          </Callout>
      </LessonSection>

      {/* ================================================================
          BƯỚC 7 — CONNECT: Tóm tắt + liên kết
          ================================================================ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <AhaMoment>
          AI tool không phải {'"hộp đen bí mật"'} — dữ liệu bạn gửi đi{" "}
          <strong>có thể được lưu, xử lý, và dùng để huấn luyện</strong>. Trước khi paste bất kỳ nội dung nào, hãy tự hỏi:{" "}
          <strong>nếu nội dung này bị lộ ra ngoài, hậu quả có nghiêm trọng không?</strong>{" "}
          Nếu có — dừng lại và ẩn danh hoá.
        </AhaMoment>

        <MiniSummary
          title="Ghi nhớ về bảo mật khi dùng AI"
          points={[
            "KHÔNG paste vào AI tool công cộng: CMND/CCCD, hợp đồng bảo mật, mật khẩu, dữ liệu khách hàng, code nội bộ.",
            "Phiên bản miễn phí có thể dùng dữ liệu để training — bản Enterprise cam kết không dùng.",
            "Ẩn danh hoá trước khi dùng AI: thay tên, xoá số hợp đồng/CMND, chỉ giữ ngữ cảnh chung.",
            "Doanh nghiệp cần chính sách AI rõ ràng: danh sách cấm, công cụ được duyệt, quy trình ẩn danh, đào tạo nhân viên.",
            "Tuân thủ Nghị định 13/2023 và Luật An ninh mạng — vi phạm phạt đến 100 triệu VND.",
          ]}
        />

        <p className="mt-4 text-sm text-muted leading-relaxed">
          Bảo mật AI là một phần của{" "}
          <TopicLink slug="ai-governance">quản trị AI</TopicLink>{" "}
          rộng hơn. Tìm hiểu thêm về{" "}
          <TopicLink slug="guardrails">guardrails</TopicLink>{" "}
          để biết cách đặt rào chắn an toàn cho hệ thống AI, và đọc về{" "}
          <TopicLink slug="getting-started-with-ai">cách bắt đầu dùng AI</TopicLink>{" "}
          để sử dụng AI hiệu quả ngay từ đầu.
        </p>
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
