"use client";
import { useMemo } from "react";
import { PredictionGate, LessonSection, AhaMoment, InlineChallenge, MiniSummary, Callout, CodeBlock, LaTeX } from "@/components/interactive";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = { slug: "probability-statistics", title: "Probability & Statistics", titleVi: "Xac suat & Thong ke co ban", description: "Phan phoi xac suat, ky vong, phuong sai va dinh ly Bayes — cong cu cot loi cho ML", category: "math-foundations", tags: ["probability", "distribution", "bayes"], difficulty: "beginner", relatedSlugs: ["naive-bayes", "logistic-regression", "loss-functions"], vizType: "interactive" };

const TOTAL_STEPS = 6;
export default function ProbabilityStatisticsTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(() => [
    { question: "Bayes theorem dung cho gi trong ML?", options: ["Tinh trung binh", "CAP NHAT niem tin (belief) khi co bang chung moi: P(benh|trieu chung) = P(trieu chung|benh) * P(benh) / P(trieu chung)", "Tinh variance"], correct: 1, explanation: "Bayes: prior (niem tin ban dau) + evidence (bang chung moi) → posterior (niem tin cap nhat). VD: P(spam|tu 'free') = P('free'|spam) * P(spam) / P('free'). Naive Bayes classifier, Bayesian Neural Networks, va toan bo Bayesian ML dua tren dinh ly nay." },
    { question: "Normal distribution (Gaussian) quan trong cho ML vi sao?", options: ["Vi dep", "Central Limit Theorem: trung binh cua nhieu random variables → Gaussian. Nhieu hien tuong tu nhien va nhieu ML algorithms (linear regression, GP) gia dinh Gaussian", "Chi dung cho thong ke"], correct: 1, explanation: "CLT: bat ke distribution goc, trung binh cua N samples → Gaussian khi N lon. Linear regression gia dinh: error ~ N(0, sigma^2). Batch Normalization: normalize activations ve ~Gaussian. Weight initialization: sample tu Gaussian. Gaussian la 'default' distribution cua ML." },
    { question: "MLE (Maximum Likelihood Estimation) va cross-entropy loss co lien quan khong?", options: ["Khong lien quan", "MLE toi da hoa likelihood = toi thieu hoa negative log-likelihood = toi thieu hoa cross-entropy loss. GIONG NHAU!", "Chi giong nhau ve ten"], correct: 1, explanation: "minimize cross-entropy H(p,q) = -sum(p*log(q)) = maximize log-likelihood cua du lieu. Khi p = one-hot label, q = model prediction: CE loss chinh la negative log-likelihood. Day la ly do cross-entropy la default loss cho classification — no chinh la MLE!" },
  ], []);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Du doan">
        <PredictionGate question="Email chua tu 'free' va 'money'. La spam hay khong? P(spam)=0.3, P('free'|spam)=0.8, P('free'|ham)=0.1. Dung gi de tinh P(spam|'free')?" options={["Dem so email", "Bayes Theorem: P(spam|free) = P(free|spam)*P(spam) / P(free) = 0.8*0.3 / (0.8*0.3+0.1*0.7) = 0.77", "Doan"]} correct={1} explanation="Bayes cho phep UPDATE xac suat khi co bang chung moi. Truoc khi thay 'free': P(spam)=30%. Sau khi thay 'free': P(spam|free)=77%. Tu 'free' la bang chung manh cho spam. Day la co che cua Naive Bayes classifier — don gian nhung hieu qua cho spam filtering!">
          <p className="text-sm text-muted mt-2">
            Hay tiep tuc de kham pha xac suat va thong ke trong ML.
          </p>
        </PredictionGate>
      </LessonSection>

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khoanh khac Aha">
        <AhaMoment><p>Toan bo ML la <strong>xac suat</strong>: Classification = P(class|input). Loss function = <strong>negative log-likelihood</strong>. Regularization = <strong>prior</strong>{" "}(Bayesian). Dropout = <strong>sampling</strong>. GAN = 2 distributions. Diffusion = <strong>adding/removing noise</strong>. Hieu xac suat = hieu TAI SAO ML hoat dong!</p></AhaMoment>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Thu thach">
        <InlineChallenge question="Model output: P(cho)=0.7, P(meo)=0.2, P(chim)=0.1. Label that: cho. Cross-entropy loss = ?" options={["-log(0.7) = 0.357", "-log(0.2) = 1.609", "-(0.7*log(0.7) + 0.2*log(0.2) + 0.1*log(0.1))"]} correct={0} explanation="CE voi one-hot label [1,0,0] va prediction [0.7, 0.2, 0.1]: H = -1*log(0.7) - 0*log(0.2) - 0*log(0.1) = -log(0.7) = 0.357. Chi quan tam xac suat cua class DUNG (0.7). Neu model confident hon (0.99) → loss thap hon (-log(0.99) = 0.01). Day la ly do CE loss 'thuong' model confident dung." />
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Ly thuyet">
        <ExplanationSection>
          <p><strong>Probability & Statistics</strong>{" "}la nen tang cua moi thuat toan ML — tu loss function den model architecture.</p>
          <p><strong>Bayes Theorem:</strong></p>
          <LaTeX block>{"P(A|B) = \\frac{P(B|A) \\cdot P(A)}{P(B)} \\quad \\text{(posterior = likelihood × prior / evidence)}"}</LaTeX>
          <p><strong>Distributions quan trong:</strong></p>
          <LaTeX block>{"\\text{Gaussian: } p(x) = \\frac{1}{\\sqrt{2\\pi\\sigma^2}} \\exp\\left(-\\frac{(x-\\mu)^2}{2\\sigma^2}\\right)"}</LaTeX>
          <LaTeX block>{"\\text{Bernoulli: } P(X=1) = p, \\quad P(X=0) = 1-p \\quad \\text{(binary outcomes)}"}</LaTeX>
          <p><strong>Cross-Entropy Loss = Negative Log-Likelihood:</strong></p>
          <LaTeX block>{"H(p, q) = -\\sum_x p(x) \\log q(x) \\quad \\text{(p = true, q = predicted)}"}</LaTeX>
          <Callout variant="tip" title="MLE = Minimize CE">Maximize likelihood = minimize negative log-likelihood = minimize cross-entropy. Day la ly do TOAN BO classification models dung CE loss — no chinh la MLE duoi dang khac!</Callout>
          <CodeBlock language="python" title="Xac suat trong ML">{`import numpy as np
from scipy import stats

# Bayes Theorem: P(spam|'free')
p_spam = 0.3
p_free_given_spam = 0.8
p_free_given_ham = 0.1
p_free = p_free_given_spam * p_spam + p_free_given_ham * (1 - p_spam)
p_spam_given_free = p_free_given_spam * p_spam / p_free
print(f"P(spam|'free') = {p_spam_given_free:.2f}")  # 0.77

# Cross-Entropy Loss
y_true = np.array([1, 0, 0])  # One-hot: cho
y_pred = np.array([0.7, 0.2, 0.1])  # Predictions
ce_loss = -np.sum(y_true * np.log(y_pred))
print(f"CE Loss = {ce_loss:.3f}")  # 0.357

# Gaussian distribution
x = np.linspace(-4, 4, 100)
pdf = stats.norm.pdf(x, loc=0, scale=1)  # mean=0, std=1`}</CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Tom tat">
        <MiniSummary points={["Bayes Theorem: cap nhat xac suat khi co bang chung moi. Core cua Naive Bayes, Bayesian ML.", "Gaussian (Normal): default distribution trong ML. CLT: trung binh nhieu samples → Gaussian.", "Cross-Entropy = Negative Log-Likelihood = MLE. Default loss cho classification.", "Expectation E[X] = trung binh. Variance Var[X] = do phan tan. Bias-Variance trade-off.", "Toan bo ML la xac suat: model = P(output|input). Training = tim params toi uu hoa likelihood."]} />
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Kiem tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
