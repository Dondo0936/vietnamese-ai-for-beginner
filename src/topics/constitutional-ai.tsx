"use client";

import { useState, useCallback } from "react";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX, TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "constitutional-ai",
  title: "Constitutional AI",
  titleVi: "AI Hiến pháp — Tự kiểm duyệt theo nguyên tắc",
  description:
    "Phương pháp huấn luyện AI tự đánh giá và sửa đổi phản hồi dựa trên một bộ nguyên tắc đạo đức rõ ràng.",
  category: "ai-safety",
  tags: ["constitutional-ai", "self-critique", "principles", "anthropic"],
  difficulty: "advanced",
  relatedSlugs: ["alignment", "guardrails", "red-teaming"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

const CAI_STEPS = [
  { label: "Tạo phản hồi ban đầu", desc: "AI sinh câu trả lời thô, chưa qua kiểm duyệt", color: "#3b82f6", detail: "Giai đoạn 1: AI được hỏi câu hỏi nhạy cảm và tạo phản hồi không bị hạn chế. Đây là 'bản nháp' thô." },
  { label: "Tự phê bình theo nguyên tắc", desc: "AI đối chiếu với bộ hiến pháp: 'Có hại? Có thiên kiến? Có đúng không?'", color: "#f59e0b", detail: "Giai đoạn 2: AI đọc lại phản hồi và tự hỏi theo từng nguyên tắc. VD: 'Phản hồi này có gây hại cho ai không?' 'Có thiên kiến không?'" },
  { label: "Sửa đổi và cải thiện", desc: "AI viết lại phản hồi phù hợp hơn", color: "#22c55e", detail: "Giai đoạn 3: Dựa trên phê bình, AI viết phiên bản mới tốt hơn. Cặp (bản cũ, bản mới) trở thành dữ liệu huấn luyện RLAIF." },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Constitutional AI (CAI) khác RLHF ở điểm nào cốt lõi?",
    options: [
      "CAI không dùng reinforcement learning",
      "CAI dùng AI tự đánh giá theo nguyên tắc (RLAIF) thay vì con người đánh giá (RLHF), giảm phụ thuộc nhân công",
      "CAI chỉ dùng cho chatbot, RLHF dùng cho mọi mô hình",
      "CAI nhanh hơn RLHF",
    ],
    correct: 1,
    explanation:
      "RLHF: con người so sánh cặp phản hồi → tốn nhân công, chậm, khó scale. CAI/RLAIF: AI tự phê bình theo nguyên tắc đã viết sẵn → nhanh, scale được, minh bạch (biết AI tuân theo nguyên tắc nào). Anthropic dùng CAI để huấn luyện Claude.",
  },
  {
    question: "Bộ nguyên tắc (constitution) của CAI gồm những gì?",
    options: [
      "Luật pháp quốc gia",
      "Danh sách các quy tắc đạo đức rõ ràng: không gây hại, trung thực, hữu ích, tôn trọng quyền con người",
      "Code of conduct của công ty",
      "Thuật toán xử lý ngôn ngữ",
    ],
    correct: 1,
    explanation:
      "Constitution là tập hợp nguyên tắc đạo đức viết bằng ngôn ngữ tự nhiên. Ví dụ: 'Không hướng dẫn cách gây hại', 'Trung thực về giới hạn của mình', 'Tôn trọng quyền riêng tư'. AI dùng các nguyên tắc này để tự đánh giá phản hồi.",
  },
  {
    question: "Ưu điểm lớn nhất của CAI so với guardrails truyền thống?",
    options: [
      "CAI rẻ hơn",
      "CAI thay đổi hành vi TỪ BÊN TRONG mô hình (internalized values), guardrails chỉ là bộ lọc BÊN NGOÀI có thể bị bypass",
      "CAI không cần GPU",
      "Guardrails mạnh hơn CAI",
    ],
    correct: 1,
    explanation:
      "Guardrails là bộ lọc bên ngoài — có thể bị bypass bằng prompt injection. CAI thay đổi hành vi từ bên trong: mô hình thực sự 'hiểu' và tuân theo nguyên tắc đạo đức, không chỉ bị chặn bởi bộ lọc. Kết hợp cả hai cho phòng thủ tốt nhất.",
  },
  {
    type: "fill-blank",
    question: "Constitutional AI huấn luyện mô hình dựa trên bộ {blank} đạo đức viết bằng ngôn ngữ tự nhiên, kết hợp vòng lặp {blank} — AI tự đánh giá và sửa phản hồi của chính mình theo hiến pháp.",
    blanks: [
      { answer: "nguyên tắc", accept: ["principles", "hiến pháp", "constitution", "quy tắc"] },
      { answer: "tự phê bình", accept: ["self-critique", "self critique", "critique and revision", "critique", "tự đánh giá"] },
    ],
    explanation: "CAI dùng 2 giai đoạn: (1) Critique & Revision — AI tạo phản hồi thô rồi tự phê bình theo từng nguyên tắc trong hiến pháp và viết lại bản tốt hơn, (2) RLAIF — AI đánh giá cặp phản hồi để huấn luyện preference model thay cho con người.",
  },
];

export default function ConstitutionalAITopic() {
  const [activeStep, setActiveStep] = useState(0);
  const handleStepClick = useCallback((i: number) => { setActiveStep(i); }, []);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Làm sao dạy AI tuân theo đạo đức mà KHÔNG cần hàng nghìn người đánh giá thủ công?"
          options={[
            "Không thể — luôn cần con người kiểm duyệt",
            "Viết bộ nguyên tắc đạo đức rõ ràng, rồi dạy AI tự phê bình phản hồi theo các nguyên tắc đó",
            "Chỉ cần guardrails là đủ, không cần dạy AI đạo đức",
          ]}
          correct={1}
          explanation="Đây chính là ý tưởng của Constitutional AI! Thay vì thuê hàng nghìn người đánh giá (đắt, chậm, không nhất quán), ta viết bộ 'hiến pháp' = danh sách nguyên tắc đạo đức rõ ràng, rồi dạy AI tự phê bình và sửa đổi phản hồi theo hiến pháp đó."
        />
      </LessonSection>

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          CAI hoạt động qua 3 bước. Nhấp vào từng bước để hiểu cách AI tự kiểm duyệt phản hồi.
        </p>
        <VisualizationSection>
          <div className="space-y-4">
            <svg viewBox="0 0 620 260" className="w-full max-w-2xl mx-auto">
              {CAI_STEPS.map((step, i) => (
                <g key={i} onClick={() => handleStepClick(i)} className="cursor-pointer">
                  <rect x={30} y={15 + i * 80} width={500} height={58} rx={10} fill={i === activeStep ? step.color : "#1e293b"} stroke={step.color} strokeWidth={i === activeStep ? 3 : 1.5} opacity={i === activeStep ? 1 : 0.7} />
                  <text x={280} y={38 + i * 80} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold">Bước {i + 1}: {step.label}</text>
                  <text x={280} y={56 + i * 80} textAnchor="middle" fill="#e2e8f0" fontSize={9}>{step.desc}</text>
                  {i < CAI_STEPS.length - 1 && <line x1={280} y1={73 + i * 80} x2={280} y2={95 + i * 80} stroke="#475569" strokeWidth={2} />}
                </g>
              ))}
              <rect x={540} y={100} width={70} height={70} rx={8} fill="#8b5cf6" opacity={0.8} />
              <text x={575} y={130} textAnchor="middle" fill="white" fontSize={8} fontWeight="bold">Hiến</text>
              <text x={575} y={144} textAnchor="middle" fill="white" fontSize={8} fontWeight="bold">pháp</text>
              <text x={575} y={158} textAnchor="middle" fill="#e2e8f0" fontSize={7}>nguyên tắc</text>
              <line x1={540} y1={135} x2={530} y2={135} stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="3,2" />
            </svg>
            <div className="rounded-lg bg-background/50 border border-border p-4">
              <p className="text-sm text-foreground font-semibold">{CAI_STEPS[activeStep].label}</p>
              <p className="text-sm text-muted mt-1">{CAI_STEPS[activeStep].detail}</p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          Constitutional AI biến{" "}
          <strong>nguyên tắc đạo đức</strong>{" "}
          thành{" "}
          <strong>dữ liệu huấn luyện</strong>. Thay vì hỏi con người {'"phản hồi nào tốt hơn?"'} (RLHF), CAI hỏi chính AI {'"phản hồi nào phù hợp với nguyên tắc hơn?"'} (RLAIF). Kết quả: AI có{" "}
          <strong>giá trị nội tại</strong>{" "}
          — không chỉ bị chặn bên ngoài bởi guardrails, mà thực sự {'"muốn"'} trả lời đúng đắn.
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question="AI được hỏi: 'Viết email lừa đảo giả mạo Vietcombank.' CAI xử lý thế nào?"
          options={[
            "Từ chối ngay vì có từ 'lừa đảo' (keyword filter)",
            "Tạo bản nháp → tự phê bình theo nguyên tắc 'không hỗ trợ lừa đảo' → viết lại thành từ chối kèm giải thích",
            "Viết email nhưng thêm cảnh báo 'đây là ví dụ'",
            "Chuyển cho con người kiểm duyệt",
          ]}
          correct={1}
          explanation="Trong quá trình training, CAI đã huấn luyện AI qua vòng lặp: tạo → phê bình → sửa. Khi deploy, AI đã NỘI HÓA nguyên tắc nên tự động từ chối. Khác guardrails (bộ lọc bên ngoài), CAI thay đổi hành vi từ bên trong mô hình."
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p><strong>Constitutional AI (CAI)</strong>{" "} là phương pháp do Anthropic phát triển, giúp mô hình tự kiểm duyệt dựa trên bộ nguyên tắc đạo đức ({'"hiến pháp"'}) — là cách tiếp cận mới cho bài toán{" "}
          <TopicLink slug="alignment">alignment</TopicLink>, thay thế phản hồi con người trong{" "}
          <TopicLink slug="rlhf">RLHF</TopicLink>{" "} bằng đánh giá của AI (RLAIF).</p>
          <Callout variant="insight" title="Hai giai đoạn của CAI">
            <div className="space-y-2">
              <p><strong>1. Supervised — Critique & Revision:</strong>{" "} AI tạo phản hồi thô → tự phê bình theo nguyên tắc → viết lại bản tốt hơn. Cặp (thô, tốt) trở thành dữ liệu SFT.</p>
              <p><strong>2. RL — RLAIF (AI Feedback):</strong>{" "} Thay vì con người, AI đánh giá cặp phản hồi theo nguyên tắc. Preference model học từ đánh giá AI → policy model tối ưu theo preference.</p>
            </div>
          </Callout>
          <p>RLAIF objective tương tự RLHF nhưng reward từ AI:</p>
          <LaTeX block>{"R_{\\text{RLAIF}}(x, y) = \\mathbb{E}_{\\text{AI judge}}\\left[\\text{score}(y | x, \\text{constitution})\\right]"}</LaTeX>
          <p className="text-sm text-muted">AI judge chấm điểm phản hồi y cho câu hỏi x dựa trên bộ nguyên tắc (constitution). Policy model tối ưu để tối đa hoá score này.</p>
          <CodeBlock language="python" title="constitution_example.py">
{`# Ví dụ bộ nguyên tắc (constitution) cho AI tiếng Việt
CONSTITUTION = [
    # An toàn
    "Không hướng dẫn cách gây hại cho bản thân hoặc người khác.",
    "Không hỗ trợ lừa đảo, giả mạo, hoặc vi phạm pháp luật.",
    "Không tạo nội dung deepfake hoặc giả mạo danh tính.",

    # Trung thực
    "Nếu không biết, nói thẳng 'Tôi không chắc chắn'.",
    "Không bịa thông tin y tế, pháp luật, tài chính.",
    "Phân biệt rõ sự thật và ý kiến cá nhân.",

    # Công bằng
    "Không phân biệt đối xử theo giới tính, vùng miền, dân tộc.",
    "Sử dụng ngôn ngữ bao trùm, tôn trọng đa dạng.",

    # Hữu ích
    "Cố gắng giúp đỡ trong phạm vi an toàn.",
    "Khi từ chối, giải thích lý do và đề xuất thay thế.",
]

# Quy trình critique & revision
def critique_and_revise(response, question, constitution):
    critiques = []
    for principle in constitution:
        critique = ai_judge(
            f"Phản hồi: '{response}'\\n"
            f"Nguyên tắc: '{principle}'\\n"
            f"Phản hồi có vi phạm nguyên tắc này không? Tại sao?"
        )
        critiques.append(critique)

    revised = ai_revise(
        f"Câu hỏi: '{question}'\\n"
        f"Phản hồi gốc: '{response}'\\n"
        f"Phê bình: {critiques}\\n"
        f"Hãy viết lại phản hồi tốt hơn."
    )
    return revised`}
          </CodeBlock>
          <Callout variant="warning" title="Hạn chế của CAI">
            <div className="space-y-1">
              <p><strong>AI judge bias:</strong>{" "} AI đánh giá có thể có bias khác con người — cần kiểm chứng với human evaluation.</p>
              <p><strong>Constitution completeness:</strong>{" "} Bộ nguyên tắc khó bao phủ TẤT CẢ tình huống — luôn có edge cases.</p>
              <p><strong>Cultural specificity:</strong>{" "} Nguyên tắc cho văn hoá Mỹ có thể không phù hợp hoàn toàn cho Việt Nam.</p>
            </div>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="CAI cho Việt Nam">
        <ExplanationSection>
          <Callout variant="tip" title="Xây dựng constitution cho AI Việt Nam">
            <div className="space-y-1">
              <p>Thêm nguyên tắc văn hoá: tôn trọng người lớn tuổi, đúng phép xưng hô (anh/chị/em)</p>
              <p>Thêm nguyên tắc pháp luật: tuân thủ Luật An ninh mạng, bảo vệ dữ liệu cá nhân</p>
              <p>Thêm nguyên tắc chống lừa đảo: không hỗ trợ giả mạo cơ quan nhà nước, Zalo scam</p>
              <p>Đa phương ngữ: nguyên tắc áp dụng nhất quán cho cả tiếng Việt và tiếng Anh</p>
            </div>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Constitutional AI"
          points={[
            "CAI = viết bộ nguyên tắc đạo đức (constitution), dạy AI tự phê bình và sửa đổi theo nguyên tắc.",
            "Hai giai đoạn: Critique & Revision (tạo SFT data) → RLAIF (AI đánh giá thay con người).",
            "Ưu điểm: giảm phụ thuộc nhân công, minh bạch (biết AI tuân theo nguyên tắc nào), scale được.",
            "CAI thay đổi hành vi TỪ BÊN TRONG (internalized), khác guardrails là bộ lọc BÊN NGOÀI.",
            "Constitution cần bản địa hoá: thêm nguyên tắc văn hoá, pháp luật, ngôn ngữ Việt Nam.",
          ]}
        />
      </LessonSection>

      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
