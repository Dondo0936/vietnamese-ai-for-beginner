"use client";
import { useMemo } from "react";
import { PredictionGate, LessonSection, AhaMoment, InlineChallenge, MiniSummary, Callout, CodeBlock, LaTeX } from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = { slug: "ai-in-healthcare", title: "AI in Healthcare", titleVi: "AI trong Y tế", description: "Ứng dụng AI trong chẩn đoán hình ảnh y khoa, phát triển thuốc và dự đoán bệnh", category: "applied-ai", tags: ["medical", "diagnosis", "drug-discovery"], difficulty: "beginner", relatedSlugs: ["image-classification", "cnn", "ai-for-science"], vizType: "interactive" };

const TOTAL_STEPS = 7;
export default function AIInHealthcareTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(() => [
    { question: "AI chẩn đoán X-ray phổi đạt accuracy 95%, bác sĩ 90%. Nên thay bác sĩ bằng AI?", options: ["Có — AI chính xác hơn", "KHÔNG — AI hỗ trợ bác sĩ (AI + bác sĩ = 98%), không thay thế. Bác sĩ hiểu context, bệnh sử, tình trạng toàn diện mà AI không thấy từ 1 tấm X-ray", "Tuỳ bệnh viện"], correct: 1, explanation: "AI mạnh ở: phát hiện patterns trong ảnh nhanh, không mệt mỏi, consistent. Bác sĩ mạnh ở: hiểu context (triệu chứng, bệnh sử, thuốc đang dùng), giao tiếp bệnh nhân, quyết định phức tạp. AI + Bác sĩ = tốt nhất: AI lọc và highlight, bác sĩ quyết định cuối cùng." },
    { question: "AlphaFold giải quyết vấn đề gì trong y tế?", options: ["Chẩn đoán bệnh", "Dự đoán cấu trúc 3D protein → hiểu cách protein tương tác → thiết kế thuốc nhắm đúng target", "Phân tích X-ray"], correct: 1, explanation: "Thuốc hoạt động bằng cách gắn vào protein (như chìa khoá vào ổ khoá). Cần biết hình dạng protein (ổ khoá) để thiết kế thuốc (chìa khoá). AlphaFold dự đoán cấu trúc 200M+ protein → drug designers biết chính xác 'ổ khoá' cần nhắm. Giảm 50-70% thời gian drug discovery." },
    { question: "Thách thức lớn nhất của AI y tế tại Việt Nam?", options: ["Thiếu GPU", "DATA: ít data có nhãn chất lượng, data không chuẩn hoá giữa bệnh viện, privacy concerns (PDPA)", "AI không tốt cho tiếng Việt"], correct: 1, explanation: "Data là rào cản lớn nhất: (1) Ít bệnh viện có digital records chuẩn, (2) Labels cần bác sĩ chuyên khoa (đắt, chậm), (3) Data nhạy cảm (cần anonymize). (4) Mỗi bệnh viện format khác nhau (không interoperable). VinAI, FPT AI đang làm nhưng còn nhiều thách thức." },
  ], []);

  return (
    <><LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
      <PredictionGate question="Bệnh viện tại Việt Nam có 1 bác sĩ X-quang cho 500 bệnh nhân/ngày. Mỗi phim cần 5 phút đọc. 500 x 5 = 2500 phút = 41 giờ. Giải pháp?" options={["Thuê thêm 4 bác sĩ", "AI lọc phim: 80% bình thường → AI confirm nhanh (2s). 20% nghi ngờ → bác sĩ đọc kỹ. Bác sĩ chỉ cần đọc 100 phim thay vì 500", "Bệnh nhân tự đọc phim"]} correct={1} explanation="AI triage: lọc phim nhanh, phân loại bình thường/nghi ngờ. Bác sĩ chỉ đọc phim nghi ngờ (20%) và double-check random normal (5%). Từ 500 phim/ngày xuống 125 phim → bác sĩ có thời gian đọc kỹ hơn, giảm sai sót. VinAI đã phát triển hệ thống tương tự cho bệnh viện Việt Nam.">

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection><div className="space-y-4">
          <svg viewBox="0 0 600 120" className="w-full max-w-2xl mx-auto">
            <text x={300} y={16} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontWeight="bold">4 lĩnh vực AI Y tế</text>
            {[
              { name: "Chẩn đoán hình ảnh", desc: "X-ray, CT, MRI, pathology", color: "#3b82f6" },
              { name: "Drug Discovery", desc: "AlphaFold, molecular docking", color: "#22c55e" },
              { name: "Dự đoán lâm sàng", desc: "Nguy cơ bệnh, readmission", color: "#f59e0b" },
              { name: "Y tế cá nhân hoá", desc: "Genomics, treatment planning", color: "#8b5cf6" },
            ].map((area, i) => {
              const x = 15 + i * 145;
              return (<g key={i}><rect x={x} y={30} width={135} height={55} rx={6} fill={area.color} opacity={0.15} stroke={area.color} strokeWidth={1.5} /><text x={x + 67} y={50} textAnchor="middle" fill={area.color} fontSize={8} fontWeight="bold">{area.name}</text><text x={x + 67} y={68} textAnchor="middle" fill="#94a3b8" fontSize={7}>{area.desc}</text></g>);
            })}
            <text x={300} y={110} textAnchor="middle" fill="#64748b" fontSize={9}>AI hỗ trợ bác sĩ, không thay thế. AI + Bác sĩ = tốt nhất (98% accuracy).</text>
          </svg>
        </div></VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha"><AhaMoment><p>AI không thay thế bác sĩ — nó làm bác sĩ <strong>mạnh hơn</strong>. AI + Bác sĩ = <strong>98% accuracy</strong>{" "}(AI đơn: 95%, Bác sĩ đơn: 90%). Giống kính hiển vi không thay thế nhà khoa học nhưng giúp <strong>nhìn rõ hơn</strong>. Tại Việt Nam: VinAI, FPT AI đang phát triển AI y tế cho X-ray, pathology, drug repurposing.</p></AhaMoment></LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách"><InlineChallenge question="AI phát hiện ung thư phổi từ CT scan. Sensitivity 98% (bắt 98% ung thư), Specificity 90% (10% false alarm). 1000 bệnh nhân, 10 có ung thư. Bao nhiêu false positive?" options={["10 người", "99 người: 990 không ung thư x 10% false alarm = 99 false positive. Mặc dù sensitivity cao nhưng NHIỀU false alarm vì prevalence thấp", "0 người"]} correct={1} explanation="Base rate problem! 10 ung thư x 98% sensitivity = ~10 true positive. 990 khoẻ x 10% false alarm = 99 false positive. Tổng: 109 người 'dương tính' nhưng chỉ 10 thực sự bệnh. PPV = 10/109 = 9.2%. Đây là lý do screening cần 2 bước: AI lọc → bác sĩ confirm." /></LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết"><ExplanationSection>
        <p><strong>AI in Healthcare</strong>{" "}ứng dụng AI hỗ trợ chẩn đoán, phát triển thuốc, và dự đoán bệnh — luôn dùng cạnh bác sĩ, không thay thế.</p>
        <p><strong>Medical Image Analysis:</strong></p>
        <LaTeX block>{"P(\\text{disease}|\\text{image}) = \\text{CNN}(\\text{X-ray/CT/MRI}) \\quad \\text{(classification/segmentation)}"}</LaTeX>
        <p><strong>Bayes cho screening:</strong></p>
        <LaTeX block>{"\\text{PPV} = \\frac{\\text{Sensitivity} \\times \\text{Prevalence}}{\\text{Sensitivity} \\times \\text{Prevalence} + (1-\\text{Specificity}) \\times (1-\\text{Prevalence})}"}</LaTeX>
        <Callout variant="warning" title="Regulatory">AI y tế cần FDA approval (Mỹ), CE marking (EU), hoặc tương đương. Không thể deploy AI chẩn đoán mà không có chứng nhận. Tại Việt Nam: Bộ Y tế đang xây dựng khung pháp lý cho AI medical devices.</Callout>
        <CodeBlock language="python" title="AI X-ray classification">{`import torch
from torchvision import models, transforms

# Fine-tune pretrained model cho X-ray classification
model = models.resnet50(pretrained=True)
model.fc = torch.nn.Linear(2048, 14)  # 14 findings (CheXpert)

# Preprocessing X-ray
transform = transforms.Compose([
    transforms.Resize(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485], [0.229]),
])

# Inference
model.eval()
with torch.no_grad():
    output = model(xray_image)
    probs = torch.sigmoid(output)  # Multi-label probabilities

# Output: P(pneumonia)=0.85, P(effusion)=0.12, ...
# Bác sĩ review cases có P > threshold
# AI + Bác sĩ = 98% accuracy`}</CodeBlock>
        <Callout variant="info" title="AI Y tế tại Việt Nam">VinAI: AI X-ray (VinDr-CXR), pathology (VinDr-Mammo). FPT AI: chatbot y tế. Bệnh viện 108, Bạch Mai đang pilot AI chẩn đoán. Thách thức: data chuẩn hoá, privacy (PDPA), regulatory framework còn mới.</Callout>
      </ExplanationSection></LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt"><MiniSummary points={["AI hỗ trợ bác sĩ, không thay thế. AI + Bác sĩ (98%) > AI đơn (95%) > Bác sĩ đơn (90%).", "4 lĩnh vực: Chẩn đoán hình ảnh, Drug Discovery, Dự đoán lâm sàng, Y tế cá nhân hoá.", "Base rate problem: specificity 90% + prevalence 1% → PPV chỉ 9%. Screening cần 2 bước.", "AlphaFold dự đoán 200M+ protein → giảm 50-70% thời gian thiết kế thuốc.", "Việt Nam: VinAI (VinDr), FPT AI đang phát triển. Thách thức: data, regulatory, privacy."]} /></LessonSection>
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra"><QuizSection questions={quizQuestions} /></LessonSection>
      </PredictionGate></LessonSection>
    </>
  );
}
