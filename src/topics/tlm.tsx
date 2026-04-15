"use client";

import { useState, useCallback } from "react";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "tlm",
  title: "Trustworthy Language Models",
  titleVi: "Mô hình ngôn ngữ đáng tin cậy",
  description:
    "Kỹ thuật đo lường và cải thiện độ tin cậy của mô hình ngôn ngữ, bao gồm tự đánh giá điểm tin cậy cho từng phản hồi.",
  category: "multimodal",
  tags: ["trustworthy", "confidence", "reliability", "calibration"],
  difficulty: "advanced",
  relatedSlugs: ["alignment", "explainability", "guardrails"],
  vizType: "interactive",
};

/* ── Constants ── */
const TOTAL_STEPS = 8;

const EXAMPLES = [
  { query: "2 + 2 = ?", answer: "4", confidence: 0.99, correct: true, category: "Toán cơ bản" },
  { query: "Thủ đô Việt Nam?", answer: "Hà Nội", confidence: 0.98, correct: true, category: "Kiến thức phổ thông" },
  { query: "AI sẽ thay thế bác sĩ vào năm nào?", answer: "Không thể dự đoán chính xác", confidence: 0.25, correct: true, category: "Dự đoán tương lai" },
  { query: "Phản ứng giữa NaOH 0.1M và HCl 0.2M...", answer: "pH = 1.3 (tính sai)", confidence: 0.68, correct: false, category: "Hoá học phức tạp" },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Mô hình có confidence = 90% nhưng chỉ đúng 60% trường hợp. Vấn đề này gọi là gì?",
    options: [
      "Hallucination — mô hình bịa câu trả lời",
      "Overconfidence (quá tự tin) — miscalibration giữa confidence và accuracy thực tế",
      "Underfitting — mô hình quá đơn giản",
      "Overfitting — mô hình quá phức tạp",
    ],
    correct: 1,
    explanation:
      "Đây là miscalibration — confidence score không phản ánh đúng xác suất trả lời chính xác. Calibration tốt nghĩa là khi mô hình nói 'tôi chắc 90%' thì 90% câu trả lời đó phải đúng. ECE (Expected Calibration Error) đo mức sai lệch này.",
  },
  {
    question: "Bạn dùng AI tư vấn y tế. Mô hình trả lời với confidence = 35%. Bạn nên làm gì?",
    options: [
      "Tin tưởng vì AI thường đúng",
      "Bỏ qua hoàn toàn câu trả lời",
      "Coi đây là tham khảo ban đầu và BẮT BUỘC xác minh với bác sĩ — confidence thấp ở lĩnh vực y tế = rủi ro cao",
      "Hỏi lại câu hỏi cùng mô hình để xem có thay đổi không",
    ],
    correct: 2,
    explanation:
      "Confidence thấp ở domain rủi ro cao (y tế, pháp luật, tài chính) là tín hiệu quan trọng. TLM giúp người dùng biết KHI NÀO nên tin AI và khi nào cần xác minh. Mô hình đáng tin cậy là mô hình biết nói 'tôi không chắc chắn'.",
  },
  {
    question: "Cách nào giúp cải thiện calibration của LLM?",
    options: [
      "Tăng kích thước mô hình — mô hình lớn hơn luôn calibrate tốt hơn",
      "Temperature scaling: điều chỉnh phân phối xác suất đầu ra, kết hợp verbalized confidence và self-consistency",
      "Chỉ cần thêm câu 'Bạn có chắc không?' vào prompt",
      "Dùng greedy decoding thay vì sampling",
    ],
    correct: 1,
    explanation:
      "Temperature scaling điều chỉnh logits sau softmax để confidence phản ánh đúng accuracy hơn. Verbalized confidence yêu cầu mô hình tự đánh giá bằng lời. Self-consistency chạy nhiều lần và kiểm tra nhất quán. Kết hợp cả ba cho calibration tốt nhất.",
  },
];

export default function TLMTopic() {
  const [selectedEx, setSelectedEx] = useState(0);
  const ex = EXAMPLES[selectedEx];

  const handleExChange = useCallback((i: number) => {
    setSelectedEx(i);
  }, []);

  return (
    <>
      {/* ── Step 1: PredictionGate ── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn hỏi AI 'Phản ứng giữa NaOH và HCl tạo ra gì?' và AI trả lời tự tin 95%: 'Tạo ra H2SO4'. Đây là vấn đề gì?"
          options={[
            "Không có vấn đề — AI tự tin nên chắc đúng",
            "Hallucination — AI bịa câu trả lời, nhưng ít nhất nó biết mình sai",
            "Overconfidence — AI CỰC KỲ tự tin nhưng SAI hoàn toàn, đây là dạng nguy hiểm nhất",
          ]}
          correct={2}
          explanation="Đây là vấn đề overconfidence — dạng nguy hiểm nhất của mô hình thiếu tin cậy. NaOH + HCl tạo NaCl + H2O (KHÔNG phải H2SO4). Nhưng AI nói 'chắc 95%', khiến người dùng dễ tin. TLM giải quyết bằng cách đảm bảo confidence PHẢN ÁNH ĐÚNG xác suất trả lời chính xác."
        />
      </LessonSection>

      {/* ── Step 2: Interactive Confidence Explorer ── */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Hãy chọn các câu hỏi khác nhau. Quan sát confidence score — mô hình đáng tin cậy sẽ cho điểm CAO khi biết chắc và THẤP khi không chắc.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((e, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleExChange(i)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                    selectedEx === i
                      ? "bg-accent text-white"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                >
                  {e.category}
                </button>
              ))}
            </div>

            <svg viewBox="0 0 620 200" className="w-full max-w-2xl mx-auto">
              {/* Question */}
              <text x={20} y={25} fill="#94a3b8" fontSize={11}>
                <tspan fontWeight="bold">Câu hỏi:</tspan> {ex.query}
              </text>

              {/* Confidence bar */}
              <text x={20} y={55} fill="#94a3b8" fontSize={11} fontWeight="bold">Điểm tin cậy:</text>
              <rect x={20} y={65} width={480} height={28} rx={6} fill="#1e293b" stroke="#475569" strokeWidth={1} />
              <rect
                x={20}
                y={65}
                width={480 * ex.confidence}
                height={28}
                rx={6}
                fill={ex.confidence > 0.7 ? "#22c55e" : ex.confidence > 0.4 ? "#f59e0b" : "#ef4444"}
              />
              <text x={510} y={85} fill="white" fontSize={14} fontWeight="bold">
                {(ex.confidence * 100).toFixed(0)}%
              </text>

              {/* Answer */}
              <text x={20} y={120} fill="#e2e8f0" fontSize={11}>
                <tspan fontWeight="bold">Trả lời:</tspan> {ex.answer}
              </text>

              {/* Correctness */}
              <rect x={20} y={135} width={580} height={30} rx={6} fill={ex.correct ? "#22c55e" : "#ef4444"} opacity={0.15} />
              <text x={30} y={155} fill={ex.correct ? "#22c55e" : "#ef4444"} fontSize={11} fontWeight="bold">
                {ex.correct ? "Chính xác" : "SAI — Cần kiểm chứng!"}
                {!ex.correct && " (Confidence cao nhưng đáp án sai = miscalibration!)"}
              </text>

              {/* Calibration insight */}
              <text x={20} y={185} fill="#94a3b8" fontSize={10}>
                {ex.confidence > 0.8 && ex.correct && "Calibration tốt: tự tin cao + đáp án đúng"}
                {ex.confidence < 0.4 && ex.correct && "Calibration tốt: không chắc nên nói thật → dù đáp án đúng, mô hình khiêm tốn"}
                {ex.confidence > 0.5 && !ex.correct && "Calibration KÉM: tự tin vừa/cao nhưng SAI → nguy hiểm!"}
                {ex.confidence < 0.4 && !ex.correct && "Calibration OK: ít nhất mô hình biết mình không chắc"}
              </text>
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ── Step 3: AhaMoment ── */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          Mô hình{" "}
          <strong>đáng tin cậy</strong>{" "}
          không phải mô hình luôn đúng — mà là mô hình{" "}
          <strong>biết khi nào mình sai</strong>. Giống như bác sĩ giỏi: nói{" "}
          <strong>{'"Tôi chắc chắn đây là cảm cúm"'}</strong>{" "}
          khi biết rõ, nhưng nói{" "}
          <strong>{'"Tôi cần xét nghiệm thêm"'}</strong>{" "}
          khi chưa chắc. Calibration tốt = confidence phản ánh đúng xác suất đúng.
        </AhaMoment>
      </LessonSection>

      {/* ── Step 4: InlineChallenge ── */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question="Mô hình A trả lời đúng 90% nhưng luôn nói 'chắc chắn 99%'. Mô hình B trả lời đúng 80% nhưng confidence phản ánh chính xác accuracy. Mô hình nào đáng tin cậy hơn?"
          options={[
            "Mô hình A — vì đúng 90% cao hơn",
            "Mô hình B — vì biết khi nào sai (calibration tốt hơn) nên người dùng biết khi nào cần kiểm chứng",
            "Bằng nhau — accuracy mới quan trọng",
            "Không thể so sánh",
          ]}
          correct={1}
          explanation="Mô hình B đáng tin cậy hơn! Mô hình A đúng 90% nhưng nói 99% → 10% trường hợp sai mà người dùng không biết. Mô hình B dù accuracy thấp hơn, nhưng khi nói 'chắc 60%', người dùng biết cần kiểm tra. Calibration tốt giúp đưa ra quyết định đúng đắn hơn."
        />
      </LessonSection>

      {/* ── Step 5: Explanation ── */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Trustworthy Language Models (TLM)</strong>{" "}
            là cách tiếp cận giúp mô hình ngôn ngữ trở nên đáng tin cậy hơn bằng cách đảm bảo{" "}
            <strong>điểm tin cậy phản ánh đúng xác suất trả lời chính xác</strong>.
          </p>

          <Callout variant="insight" title="Ba trụ cột của TLM">
            <div className="space-y-2">
              <p>
                <strong>1. Calibration (Hiệu chuẩn):</strong>{" "}
                Điểm tin cậy 80% nghĩa là 80% câu trả lời có điểm đó phải đúng. Đo bằng ECE (Expected Calibration Error).
              </p>
              <p>
                <strong>2. Selective Abstention (Từ chối có chọn lọc):</strong>{" "}
                Khi không chắc, mô hình nên nói {'"Tôi không biết"'} thay vì bịa đáp án. Threshold confidence quyết định khi nào từ chối.
              </p>
              <p>
                <strong>3. Uncertainty Quantification (Đo lường bất định):</strong>{" "}
                Phân biệt epistemic uncertainty (thiếu kiến thức) và aleatoric uncertainty (bản chất câu hỏi mơ hồ).
              </p>
            </div>
          </Callout>

          <p>Expected Calibration Error (ECE) — thước đo calibration:</p>
          <LaTeX block>{"\\text{ECE} = \\sum_{m=1}^{M} \\frac{|B_m|}{n} \\left| \\text{acc}(B_m) - \\text{conf}(B_m) \\right|"}</LaTeX>
          <p className="text-sm text-muted">
            Chia tất cả dự đoán thành M bins theo confidence. Với mỗi bin <LaTeX>{"B_m"}</LaTeX>, so sánh accuracy thực tế với confidence trung bình. ECE = 0 là calibration hoàn hảo.
          </p>

          <Callout variant="info" title="Kỹ thuật cải thiện calibration">
            <div className="space-y-2">
              <p>
                <strong>Temperature scaling:</strong>{" "}
                Chia logits cho hệ số T trước softmax. T lớn làm phân phối đều hơn (giảm overconfidence), T nhỏ làm nhọn hơn.
              </p>
              <LaTeX block>{"p_i = \\frac{e^{z_i / T}}{\\sum_j e^{z_j / T}}"}</LaTeX>
              <p>
                <strong>Verbalized confidence:</strong>{" "}
                Yêu cầu LLM tự đánh giá: {'"Hãy trả lời và cho biết mức độ tự tin từ 0-100%"'}.
              </p>
              <p>
                <strong>Self-consistency:</strong>{" "}
                Chạy N lần với temperature lớn hơn 0, đếm tỷ lệ câu trả lời giống nhau. Nhất quán cao = confidence cao.
              </p>
            </div>
          </Callout>

          <CodeBlock language="python" title="tlm_confidence.py">
{`# Đo confidence bằng self-consistency
import openai

def get_confidence(question: str, n_samples: int = 5):
    """Chạy n_samples lần, đếm tỷ lệ nhất quán"""
    answers = []
    for _ in range(n_samples):
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": question}],
            temperature=0.7,  # Cho phép đa dạng
        )
        answers.append(response.choices[0].message.content)

    # Đếm câu trả lời phổ biến nhất
    from collections import Counter
    most_common = Counter(answers).most_common(1)[0]
    consistency = most_common[1] / n_samples

    return {
        "answer": most_common[0],
        "confidence": consistency,
        "n_samples": n_samples,
        "all_answers": answers,
    }

# Ví dụ
result = get_confidence("Thủ đô Việt Nam là gì?")
# confidence ~1.0 (tất cả 5 lần đều trả lời "Hà Nội")

result = get_confidence("AI có ý thức không?")
# confidence ~0.4 (câu trả lời khác nhau mỗi lần)`}
          </CodeBlock>

          <Callout variant="warning" title="TLM trong ứng dụng rủi ro cao">
            <div className="space-y-1">
              <p>
                <strong>Y tế:</strong>{" "}
                AI tư vấn triệu chứng PHẢI có confidence. {'"Có thể là sốt xuất huyết (confidence: 40%) — hãy đến bệnh viện ngay"'}.
              </p>
              <p>
                <strong>Tài chính:</strong>{" "}
                AI tư vấn đầu tư cần cảnh báo khi không chắc chắn, đặc biệt với thị trường Việt Nam biến động mạnh.
              </p>
              <p>
                <strong>Pháp luật:</strong>{" "}
                AI tra cứu luật Việt Nam phải phân biệt rõ {'"luật hiện hành"'} (confidence cao) vs {'"diễn giải luật"'} (confidence thấp).
              </p>
            </div>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ── Step 6: Thực hành ── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Ứng dụng thực tế">
          <Callout variant="tip" title="Áp dụng TLM trong sản phẩm">
            <div className="space-y-2">
              <p>
                <strong>Chatbot chăm sóc khách hàng:</strong>{" "}
                Khi confidence thấp, tự động chuyển sang nhân viên thật thay vì trả lời bừa.
              </p>
              <p>
                <strong>Hệ thống RAG:</strong>{" "}
                Kết hợp confidence score với retrieval score. Nếu cả hai thấp → {'"Xin lỗi, tôi không tìm thấy thông tin phù hợp"'}.
              </p>
              <p>
                <strong>Giao diện người dùng:</strong>{" "}
                Hiển thị confidence bằng màu sắc: xanh (chắc chắn), vàng (nên kiểm tra), đỏ (không nên tin hoàn toàn).
              </p>
            </div>
          </Callout>
      </LessonSection>

      {/* ── Step 7: MiniSummary ── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về TLM"
          points={[
            "TLM = mô hình BIẾT KHI NÀO MÌNH SAI. Calibration tốt = confidence phản ánh đúng accuracy.",
            "ECE đo chất lượng calibration. ECE = 0 là hoàn hảo: nói 80% chắc thì 80% phải đúng.",
            "Ba kỹ thuật: temperature scaling (điều chỉnh logits), verbalized confidence, self-consistency.",
            "Overconfidence nguy hiểm hơn underconfidence: sai mà tự tin khiến người dùng không kiểm chứng.",
            "Bắt buộc trong domain rủi ro cao: y tế, tài chính, pháp luật — luôn cần cảnh báo khi không chắc.",
          ]}
        />
      </LessonSection>

      {/* ── Step 8: Quiz ── */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
