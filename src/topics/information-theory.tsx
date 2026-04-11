"use client";
import { useMemo } from "react";
import { PredictionGate, LessonSection, AhaMoment, InlineChallenge, MiniSummary, Callout, CodeBlock, LaTeX } from "@/components/interactive";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = { slug: "information-theory", title: "Information Theory", titleVi: "Ly thuyet thong tin", description: "Entropy, cross-entropy va KL divergence — do luong thong tin va so sanh phan phoi xac suat", category: "math-foundations", tags: ["entropy", "kl-divergence", "cross-entropy"], difficulty: "intermediate", relatedSlugs: ["loss-functions", "probability-statistics", "vae"], vizType: "interactive" };

const TOTAL_STEPS = 7;
export default function InformationTheoryTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(() => [
    { question: "Entropy H(X) cao nghia la gi?", options: ["Data co nhieu noise", "DO BAT DINH CAO: kho du doan ket qua. Dong xu cong bang: H=1 bit (bat dinh nhat). Dong xu 2 mat giong nhau: H=0 (chac chan)", "Model tot"], correct: 1, explanation: "Entropy = do bat dinh / luong thong tin trung binh. H cao = bat dinh cao = can nhieu bit de ma hoa. Dong xu: H=1. Xuc xac: H=2.58 (bat dinh hon). Su kien chac chan: H=0. Trong ML: decision tree chon feature giam entropy nhieu nhat (information gain)." },
    { question: "Cross-Entropy H(p,q) do gi?", options: ["Entropy cua p", "So BITS CAN de ma hoa data tu phan phoi p DUNG phan phoi q. Cang gan: CE thap. Cang xa: CE cao. Day la loss function cho classification!", "Entropy cua q"], correct: 1, explanation: "H(p,q) = -sum(p*log(q)). Neu q = p (model perfect): H(p,q) = H(p) (minimum). Neu q khac p: H(p,q) > H(p). 'Phan thua' = KL divergence = H(p,q) - H(p). Minimize CE loss = lam q (model) gan p (true distribution) nhat co the." },
    { question: "KL Divergence KL(p||q) dung cho gi?", options: ["Tinh khoang cach Euclid", "Do su KHAC BIET giua 2 phan phoi. KL=0: giong het. KL lon: rat khac. Dung trong: VAE loss, data drift detection, distillation", "Tinh trung binh"], correct: 1, explanation: "KL(p||q) = sum(p*log(p/q)) = H(p,q) - H(p). KHONG doi xung: KL(p||q) ≠ KL(q||p). Dung: (1) VAE: KL(q(z|x)||p(z)) ≈ 0 → latent ~ prior, (2) Distillation: KL(student||teacher) → student hoc tu teacher, (3) Data drift: KL(train||production) → phat hien drift." },
  ], []);

  return (
    <><LessonSection step={1} totalSteps={TOTAL_STEPS} label="Du doan">
      <PredictionGate question="2 su kien: (A) Ngay mai mat troi moc, (B) Ngay mai co dong dat. Su kien nao chua NHIEU THONG TIN hon khi xay ra?" options={["A — vi quan trong hon", "B — su kien HIEM co nhieu thong tin hon su kien chac chan. 'Mat troi moc' = 0 thong tin (ai cung biet). 'Dong dat' = nhieu thong tin (bat ngo)", "Bang nhau"]} correct={1} explanation="Information = -log(P). Mat troi moc: P≈1 → -log(1)=0 bits (khong co thong tin moi). Dong dat: P≈0.001 → -log(0.001)≈10 bits (rat nhieu thong tin). Tin tuc bao chi: chi dua tin BAT NGO vi no co nhieu thong tin. Day la truc giac cua Shannon!">

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khoanh khac Aha"><AhaMoment><p>Entropy = <strong>do bat dinh trung binh</strong>. Cross-Entropy = <strong>loss function cua classification</strong>. KL Divergence = <strong>do khac biet giua 2 phan phoi</strong>. Ba concept nay xuat hien KHAP NOI trong ML: decision trees (information gain), neural networks (CE loss), VAE (KL loss), distillation (KL student→teacher). <strong>Information Theory = ngon ngu cua ML!</strong></p></AhaMoment></LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Thu thach"><InlineChallenge question="Dong xu cong bang: P(H)=P(T)=0.5. Dong xu gian lan: P(H)=0.9, P(T)=0.1. Entropy nao cao hon?" options={["Dong xu cong bang: H = -0.5*log(0.5)*2 = 1 bit (bat dinh nhat, cao nhat)", "Dong xu gian lan: bat dinh hon vi gan 1 → cao hon", "Bang nhau"]} correct={0} explanation="Cong bang: H = -0.5*log2(0.5) - 0.5*log2(0.5) = 1 bit (maximum entropy cho binary). Gian lan: H = -0.9*log2(0.9) - 0.1*log2(0.1) = 0.47 bits (it bat dinh vi gan nhu chac chan H). Entropy MAX khi DONG DEU (bat dinh nhat). MAX entropy = hardest to predict." /></LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Ly thuyet"><ExplanationSection>
        <p><strong>Information Theory</strong>{" "}(Shannon, 1948) do luong thong tin va bat dinh — nen tang cua loss functions va nhieu thuat toan ML.</p>
        <p><strong>Information (tu thong tin):</strong></p>
        <LaTeX block>{"I(x) = -\\log_2 P(x) \\quad \\text{(bits — su kien hiem = nhieu thong tin)}"}</LaTeX>
        <p><strong>Entropy (bat dinh trung binh):</strong></p>
        <LaTeX block>{"H(X) = -\\sum_{x} P(x) \\log_2 P(x) \\quad \\text{(cao = bat dinh, thap = chac chan)}"}</LaTeX>
        <p><strong>Cross-Entropy (loss function):</strong></p>
        <LaTeX block>{"H(p, q) = -\\sum_{x} p(x) \\log q(x) = H(p) + D_{KL}(p \\| q)"}</LaTeX>
        <p><strong>KL Divergence (khac biet phan phoi):</strong></p>
        <LaTeX block>{"D_{KL}(p \\| q) = \\sum_{x} p(x) \\log \\frac{p(x)}{q(x)} \\geq 0 \\quad \\text{(= 0 khi p = q)}"}</LaTeX>
        <Callout variant="tip" title="Cross-Entropy = Loss Function">Minimize CE H(p,q) = minimize KL(p||q) + H(p). Vi H(p) la constant → minimize CE = minimize KL = lam q (model) GAN p (true) nhat. Day la ly do CE la default loss cho classification!</Callout>
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
kl = entropy(p, q)  # scipy dung natural log
print(f"KL(p||q): {kl:.4f}")  # 0.0246

# VAE loss = Reconstruction + KL(q(z|x) || p(z))
# Data drift detection: KL(train_dist || production_dist) > threshold → ALERT`}</CodeBlock>
      </ExplanationSection></LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Tom tat"><MiniSummary points={["Information: -log P(x). Su kien hiem = nhieu thong tin. Su kien chac chan = 0 thong tin.", "Entropy: do bat dinh trung binh. Max khi dong deu (hardest to predict). Decision tree dung information gain.", "Cross-Entropy: loss function cua classification. Minimize CE = lam model gan true distribution.", "KL Divergence: do khac biet giua 2 phan phoi. Dung trong VAE, distillation, drift detection.", "Information Theory = ngon ngu cua ML: loss functions, decision trees, compression, coding."]} /></LessonSection>
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Kiem tra"><QuizSection questions={quizQuestions} /></LessonSection>
      </PredictionGate></LessonSection>
    </>
  );
}
