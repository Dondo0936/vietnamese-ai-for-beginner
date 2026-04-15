"use client";
import { useMemo } from "react";
import { PredictionGate, LessonSection, AhaMoment, InlineChallenge, MiniSummary, Callout, CodeBlock, LaTeX, TopicLink } from "@/components/interactive";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = { slug: "information-theory", title: "Information Theory", titleVi: "Lý thuyết thông tin", description: "Entropy, cross-entropy và KL divergence — đo lường thông tin và so sánh phân phối xác suất", category: "math-foundations", tags: ["entropy", "kl-divergence", "cross-entropy"], difficulty: "intermediate", relatedSlugs: ["loss-functions", "probability-statistics", "vae"], vizType: "interactive", tocSections: [{ id: "explanation", labelVi: "Giải thích" }] };

const TOTAL_STEPS = 6;
export default function InformationTheoryTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(() => [
    { question: "Entropy H(X) cao nghĩa là gì?", options: ["Data có nhiều noise", "ĐỘ BẤT ĐỊNH CAO: khó dự đoán kết quả. Đồng xu công bằng: H=1 bit (bất định nhất). Đồng xu 2 mặt giống nhau: H=0 (chắc chắn)", "Model tốt"], correct: 1, explanation: "Entropy = độ bất định / lượng thông tin trung bình. H cao = bất định cao = cần nhiều bit để mã hoá. Đồng xu: H=1. Xúc xắc: H=2.58 (bất định hơn). Sự kiện chắc chắn: H=0. Trong ML: decision tree chọn feature giảm entropy nhiều nhất (information gain)." },
    { question: "Cross-Entropy H(p,q) đo gì?", options: ["Entropy của p", "Số BITS CẦN để mã hoá data từ phân phối p DÙNG phân phối q. Càng gần: CE thấp. Càng xa: CE cao. Đây là loss function cho classification!", "Entropy của q"], correct: 1, explanation: "H(p,q) = -sum(p*log(q)). Nếu q = p (model perfect): H(p,q) = H(p) (minimum). Nếu q khác p: H(p,q) > H(p). 'Phần thừa' = KL divergence = H(p,q) - H(p). Minimize CE loss = làm q (model) gần p (true distribution) nhất có thể." },
    { question: "KL Divergence KL(p||q) dùng cho gì?", options: ["Tính khoảng cách Euclid", "Đo sự KHÁC BIỆT giữa 2 phân phối. KL=0: giống hệt. KL lớn: rất khác. Dùng trong: VAE loss, data drift detection, distillation", "Tính trung bình"], correct: 1, explanation: "KL(p||q) = sum(p*log(p/q)) = H(p,q) - H(p). KHÔNG đối xứng: KL(p||q) ≠ KL(q||p). Dùng: (1) VAE: KL(q(z|x)||p(z)) ≈ 0 → latent ~ prior, (2) Distillation: KL(student||teacher) → student học từ teacher, (3) Data drift: KL(train||production) → phát hiện drift." },
    {
      type: "fill-blank",
      question: "Entropy H(X) đạt giá trị {blank} khi tất cả sự kiện có xác suất bằng nhau (bất định tối đa), và đạt {blank} khi một sự kiện chắc chắn xảy ra (xác suất = 1).",
      blanks: [
        { answer: "cực đại", accept: ["maximum", "max", "lớn nhất", "cao nhất"] },
        { answer: "0", accept: ["0 bit", "bằng 0", "giá trị 0"] },
      ],
      explanation: "Entropy = độ bất định trung bình. Khi tất cả sự kiện đồng xác suất (ví dụ: xúc xắc công bằng), không thể dự đoán → entropy cực đại. Khi một sự kiện chắc chắn xảy ra (P = 1), không có gì để dự đoán → H = -1·log(1) = 0.",
    },
  ], []);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate question="2 sự kiện: (A) Ngày mai mặt trời mọc, (B) Ngày mai có động đất. Sự kiện nào chứa NHIỀU THÔNG TIN hơn khi xảy ra?" options={["A — vì quan trọng hơn", "B — sự kiện HIẾM có nhiều thông tin hơn sự kiện chắc chắn. 'Mặt trời mọc' = 0 thông tin (ai cũng biết). 'Động đất' = nhiều thông tin (bất ngờ)", "Bằng nhau"]} correct={1} explanation="Information = -log(P). Mặt trời mọc: P≈1 → -log(1)=0 bits (không có thông tin mới). Động đất: P≈0.001 → -log(0.001)≈10 bits (rất nhiều thông tin). Tin tức báo chí: chỉ đưa tin BẤT NGỜ vì nó có nhiều thông tin. Đây là trực giác của Shannon!">
          <p className="text-sm text-muted mt-2">
            Hãy tiếp tục để khám phá entropy, cross-entropy và KL divergence.
          </p>
        </PredictionGate>
      </LessonSection>

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment><p>Entropy = <strong>độ bất định trung bình</strong>. Cross-Entropy = <strong>loss function của classification</strong>. KL Divergence = <strong>độ khác biệt giữa 2 phân phối</strong>. Ba concept này xuất hiện KHẮP NƠI trong ML: decision trees (information gain), neural networks (CE loss), VAE (KL loss), distillation (KL student→teacher). <strong>Information Theory = ngôn ngữ của ML!</strong></p></AhaMoment>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge question="Đồng xu công bằng: P(H)=P(T)=0.5. Đồng xu gian lận: P(H)=0.9, P(T)=0.1. Entropy nào cao hơn?" options={["Đồng xu công bằng: H = -0.5*log(0.5)*2 = 1 bit (bất định nhất, cao nhất)", "Đồng xu gian lận: bất định hơn vì gần 1 → cao hơn", "Bằng nhau"]} correct={0} explanation="Công bằng: H = -0.5*log2(0.5) - 0.5*log2(0.5) = 1 bit (maximum entropy cho binary). Gian lận: H = -0.9*log2(0.9) - 0.1*log2(0.1) = 0.47 bits (ít bất định vì gần như chắc chắn H). Entropy MAX khi ĐỒNG ĐỀU (bất định nhất). MAX entropy = hardest to predict." />
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p><strong>Information Theory</strong>{" "}(Shannon, 1948) đo lường thông tin và bất định — nền tảng của loss functions và nhiều thuật toán ML, bao gồm <TopicLink slug="decision-trees">cây quyết định</TopicLink>{" "}(dùng information gain) và các mô hình <TopicLink slug="probability-statistics">xác suất thống kê</TopicLink>.</p>
          <p><strong>Information (tự thông tin):</strong></p>
          <LaTeX block>{"I(x) = -\\log_2 P(x) \\quad \\text{(bits — sự kiện hiếm = nhiều thông tin)}"}</LaTeX>
          <p><strong>Entropy (bất định trung bình):</strong></p>
          <LaTeX block>{"H(X) = -\\sum_{x} P(x) \\log_2 P(x) \\quad \\text{(cao = bất định, thấp = chắc chắn)}"}</LaTeX>
          <p><strong>Cross-Entropy (loss function):</strong></p>
          <LaTeX block>{"H(p, q) = -\\sum_{x} p(x) \\log q(x) = H(p) + D_{KL}(p \\| q)"}</LaTeX>
          <p><strong>KL Divergence (khác biệt phân phối):</strong></p>
          <LaTeX block>{"D_{KL}(p \\| q) = \\sum_{x} p(x) \\log \\frac{p(x)}{q(x)} \\geq 0 \\quad \\text{(= 0 khi p = q)}"}</LaTeX>
          <Callout variant="tip" title="Cross-Entropy = Loss Function">Minimize CE H(p,q) = minimize KL(p||q) + H(p). Vì H(p) là constant → minimize CE = minimize KL = làm q (model) GẦN p (true) nhất. Đây là lý do CE là default loss cho classification! Kết hợp với <TopicLink slug="cross-validation">kiểm định chéo</TopicLink>{" "}để đánh giá model ổn định hơn.</Callout>
          <CodeBlock language="python" title="Information Theory trong Python">{`import numpy as np
from scipy.stats import entropy

# Entropy
p_fair = [0.5, 0.5]
p_biased = [0.9, 0.1]
print(f"Entropy fair: {entropy(p_fair, base=2):.3f} bits")    # 1.0
print(f"Entropy biased: {entropy(p_biased, base=2):.3f} bits") # 0.469

# Cross-Entropy (classification loss)
y_true = [1, 0, 0]  # One-hot: class 0
y_pred = [0.7, 0.2, 0.1]
ce = -sum(t * np.log(p) for t, p in zip(y_true, y_pred) if t > 0)
print(f"Cross-Entropy: {ce:.3f}")  # 0.357

# KL Divergence
p = [0.4, 0.3, 0.3]
q = [0.5, 0.3, 0.2]
kl = entropy(p, q)  # scipy dùng natural log
print(f"KL(p||q): {kl:.4f}")  # 0.0246

# VAE loss = Reconstruction + KL(q(z|x) || p(z))
# Data drift detection: KL(train_dist || production_dist) > threshold → ALERT`}</CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={["Information: -log P(x). Sự kiện hiếm = nhiều thông tin. Sự kiện chắc chắn = 0 thông tin.", "Entropy: độ bất định trung bình. Max khi đồng đều (hardest to predict). Decision tree dùng information gain.", "Cross-Entropy: loss function của classification. Minimize CE = làm model gần true distribution.", "KL Divergence: đo khác biệt giữa 2 phân phối. Dùng trong VAE, distillation, drift detection.", "Information Theory = ngôn ngữ của ML: loss functions, decision trees, compression, coding."]} />
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
