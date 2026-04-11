"use client";
import { useMemo } from "react";
import { PredictionGate, LessonSection, AhaMoment, InlineChallenge, MiniSummary, Callout, CodeBlock, LaTeX } from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = { slug: "ai-in-healthcare", title: "AI in Healthcare", titleVi: "AI trong Y te", description: "Ung dung AI trong chan doan hinh anh y khoa, phat trien thuoc va du doan benh", category: "applied-ai", tags: ["medical", "diagnosis", "drug-discovery"], difficulty: "beginner", relatedSlugs: ["image-classification", "cnn", "ai-for-science"], vizType: "interactive" };

const TOTAL_STEPS = 7;
export default function AIInHealthcareTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(() => [
    { question: "AI chan doan X-ray phoi dat accuracy 95%, bac si 90%. Nen thay bac si bang AI?", options: ["Co — AI chinh xac hon", "KHONG — AI ho tro bac si (AI + bac si = 98%), khong thay the. Bac si hieu context, benh su, tinh trang toan dien ma AI khong thay tu 1 tam X-ray", "Tuy benh vien"], correct: 1, explanation: "AI manh o: phat hien patterns trong anh nhanh, khong met moi, consistent. Bac si manh o: hieu context (trieu chung, benh su, thuoc dang dung), giao tiep benh nhan, quyet dinh phuc tap. AI + Bac si = tot nhat: AI loc va highlight, bac si quyet dinh cuoi cung." },
    { question: "AlphaFold giai quyet van de gi trong y te?", options: ["Chan doan benh", "Du doan cau truc 3D protein → hieu cach protein tuong tac → thiet ke thuoc nham dung target", "Phan tich X-ray"], correct: 1, explanation: "Thuoc hoat dong bang cach gan vao protein (nhu chia khoa vao o khoa). Can biet hinh dang protein (o khoa) de thiet ke thuoc (chia khoa). AlphaFold du doan cau truc 200M+ protein → drug designers biet chinh xac 'o khoa' can nham. Giam 50-70% thoi gian drug discovery." },
    { question: "Thach thuc lon nhat cua AI y te tai Viet Nam?", options: ["Thieu GPU", "DATA: it data co nhan chat luong, data khong chuan hoa giua benh vien, privacy concerns (PDPA)", "AI khong tot cho tieng Viet"], correct: 1, explanation: "Data la rao can lon nhat: (1) It benh vien co digital records chuan, (2) Labels can bac si chuyen khoa (dat, cham), (3) Data nhay cam (can anonymize). (4) Moi benh vien format khac nhau (khong interoperable). VinAI, FPT AI dang lam nhung con nhieu thach thuc." },
  ], []);

  return (
    <><LessonSection step={1} totalSteps={TOTAL_STEPS} label="Du doan">
      <PredictionGate question="Benh vien tai Viet Nam co 1 bac si X-quang cho 500 benh nhan/ngay. Moi phim can 5 phut doc. 500 x 5 = 2500 phut = 41 gio. Giai phap?" options={["Thue them 4 bac si", "AI loc phim: 80% binh thuong → AI confirm nhanh (2s). 20% nghi ngo → bac si doc ky. Bac si chi can doc 100 phim thay vi 500", "Benh nhan tu doc phim"]} correct={1} explanation="AI triage: loc phim nhanh, phan loai binh thuong/nghi ngo. Bac si chi doc phim nghi ngo (20%) va double-check random normal (5%). Tu 500 phim/ngay xuong 125 phim → bac si co thoi gian doc ky hon, giam sai sot. VinAI da phat trien he thong tuong tu cho benh vien Viet Nam.">

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Kham pha">
        <VisualizationSection><div className="space-y-4">
          <svg viewBox="0 0 600 120" className="w-full max-w-2xl mx-auto">
            <text x={300} y={16} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontWeight="bold">4 linh vuc AI Y te</text>
            {[
              { name: "Chan doan hinh anh", desc: "X-ray, CT, MRI, pathology", color: "#3b82f6" },
              { name: "Drug Discovery", desc: "AlphaFold, molecular docking", color: "#22c55e" },
              { name: "Du doan lam sang", desc: "Nguy co benh, readmission", color: "#f59e0b" },
              { name: "Y te ca nhan hoa", desc: "Genomics, treatment planning", color: "#8b5cf6" },
            ].map((area, i) => {
              const x = 15 + i * 145;
              return (<g key={i}><rect x={x} y={30} width={135} height={55} rx={6} fill={area.color} opacity={0.15} stroke={area.color} strokeWidth={1.5} /><text x={x + 67} y={50} textAnchor="middle" fill={area.color} fontSize={8} fontWeight="bold">{area.name}</text><text x={x + 67} y={68} textAnchor="middle" fill="#94a3b8" fontSize={7}>{area.desc}</text></g>);
            })}
            <text x={300} y={110} textAnchor="middle" fill="#64748b" fontSize={9}>AI ho tro bac si, khong thay the. AI + Bac si = tot nhat (98% accuracy).</text>
          </svg>
        </div></VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoanh khac Aha"><AhaMoment><p>AI khong thay the bac si — no lam bac si <strong>manh hon</strong>. AI + Bac si = <strong>98% accuracy</strong>{" "}(AI don: 95%, Bac si don: 90%). Giong kinh hien vi khong thay the nha khoa hoc nhung giup <strong>nhin ro hon</strong>. Tai Viet Nam: VinAI, FPT AI dang phat trien AI y te cho X-ray, pathology, drug repurposing.</p></AhaMoment></LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thu thach"><InlineChallenge question="AI phat hien ung thu phoi tu CT scan. Sensitivity 98% (bat 98% ung thu), Specificity 90% (10% false alarm). 1000 benh nhan, 10 co ung thu. Bao nhieu false positive?" options={["10 nguoi", "99 nguoi: 990 khong ung thu x 10% false alarm = 99 false positive. Mac du sensitivity cao nhung NHIEU false alarm vi prevalence thap", "0 nguoi"]} correct={1} explanation="Base rate problem! 10 ung thu x 98% sensitivity = ~10 true positive. 990 khoe x 10% false alarm = 99 false positive. Tong: 109 nguoi 'duong tinh' nhung chi 10 thuc su benh. PPV = 10/109 = 9.2%. Day la ly do screening can 2 buoc: AI loc → bac si confirm." /></LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Ly thuyet"><ExplanationSection>
        <p><strong>AI in Healthcare</strong>{" "}ung dung AI ho tro chan doan, phat trien thuoc, va du doan benh — luon dung canh bac si, khong thay the.</p>
        <p><strong>Medical Image Analysis:</strong></p>
        <LaTeX block>{"P(\\text{disease}|\\text{image}) = \\text{CNN}(\\text{X-ray/CT/MRI}) \\quad \\text{(classification/segmentation)}"}</LaTeX>
        <p><strong>Bayes cho screening:</strong></p>
        <LaTeX block>{"\\text{PPV} = \\frac{\\text{Sensitivity} \\times \\text{Prevalence}}{\\text{Sensitivity} \\times \\text{Prevalence} + (1-\\text{Specificity}) \\times (1-\\text{Prevalence})}"}</LaTeX>
        <Callout variant="warning" title="Regulatory">AI y te can FDA approval (My), CE marking (EU), hoac tuong duong. Khong the deploy AI chan doan ma khong co chung nhan. Tai Viet Nam: Bo Y te dang xay dung khung phap ly cho AI medical devices.</Callout>
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
# Bac si review cases co P > threshold
# AI + Bac si = 98% accuracy`}</CodeBlock>
        <Callout variant="info" title="AI Y te tai Viet Nam">VinAI: AI X-ray (VinDr-CXR), pathology (VinDr-Mammo). FPT AI: chatbot y te. Benh vien 108, Bach Mai dang pilot AI chan doan. Thach thuc: data chuan hoa, privacy (PDPA), regulatory framework con moi.</Callout>
      </ExplanationSection></LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tom tat"><MiniSummary points={["AI ho tro bac si, khong thay the. AI + Bac si (98%) > AI don (95%) > Bac si don (90%).", "4 linh vuc: Chan doan hinh anh, Drug Discovery, Du doan lam sang, Y te ca nhan hoa.", "Base rate problem: specificity 90% + prevalence 1% → PPV chi 9%. Screening can 2 buoc.", "AlphaFold du doan 200M+ protein → giam 50-70% thoi gian thiet ke thuoc.", "Viet Nam: VinAI (VinDr), FPT AI dang phat trien. Thach thuc: data, regulatory, privacy."]} /></LessonSection>
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiem tra"><QuizSection questions={quizQuestions} /></LessonSection>
      </PredictionGate></LessonSection>
    </>
  );
}
