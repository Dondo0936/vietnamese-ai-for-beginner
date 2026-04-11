"use client";
import { useMemo } from "react";
import { PredictionGate, LessonSection, AhaMoment, InlineChallenge, MiniSummary, Callout, CodeBlock, LaTeX } from "@/components/interactive";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = { slug: "probability-statistics", title: "Probability & Statistics", titleVi: "Xác suất & Thống kê cơ bản", description: "Phân phối xác suất, kỳ vọng, phương sai và định lý Bayes — công cụ cốt lõi cho ML", category: "math-foundations", tags: ["probability", "distribution", "bayes"], difficulty: "beginner", relatedSlugs: ["naive-bayes", "logistic-regression", "loss-functions"], vizType: "interactive" };

const TOTAL_STEPS = 6;
export default function ProbabilityStatisticsTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(() => [
    { question: "Bayes theorem dùng cho gì trong ML?", options: ["Tính trung bình", "CẬP NHẬT niềm tin (belief) khi có bằng chứng mới: P(bệnh|triệu chứng) = P(triệu chứng|bệnh) * P(bệnh) / P(triệu chứng)", "Tính variance"], correct: 1, explanation: "Bayes: prior (niềm tin ban đầu) + evidence (bằng chứng mới) → posterior (niềm tin cập nhật). VD: P(spam|từ 'free') = P('free'|spam) * P(spam) / P('free'). Naive Bayes classifier, Bayesian Neural Networks, và toàn bộ Bayesian ML dựa trên định lý này." },
    { question: "Normal distribution (Gaussian) quan trọng cho ML vì sao?", options: ["Vì đẹp", "Central Limit Theorem: trung bình của nhiều random variables → Gaussian. Nhiều hiện tượng tự nhiên và nhiều ML algorithms (linear regression, GP) giả định Gaussian", "Chỉ dùng cho thống kê"], correct: 1, explanation: "CLT: bất kể distribution gốc, trung bình của N samples → Gaussian khi N lớn. Linear regression giả định: error ~ N(0, sigma^2). Batch Normalization: normalize activations về ~Gaussian. Weight initialization: sample từ Gaussian. Gaussian là 'default' distribution của ML." },
    { question: "MLE (Maximum Likelihood Estimation) và cross-entropy loss có liên quan không?", options: ["Không liên quan", "MLE tối đa hoá likelihood = tối thiểu hoá negative log-likelihood = tối thiểu hoá cross-entropy loss. GIỐNG NHAU!", "Chỉ giống nhau về tên"], correct: 1, explanation: "minimize cross-entropy H(p,q) = -sum(p*log(q)) = maximize log-likelihood của dữ liệu. Khi p = one-hot label, q = model prediction: CE loss chính là negative log-likelihood. Đây là lý do cross-entropy là default loss cho classification — nó chính là MLE!" },
  ], []);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate question="Email chứa từ 'free' và 'money'. Là spam hay không? P(spam)=0.3, P('free'|spam)=0.8, P('free'|ham)=0.1. Dùng gì để tính P(spam|'free')?" options={["Đếm số email", "Bayes Theorem: P(spam|free) = P(free|spam)*P(spam) / P(free) = 0.8*0.3 / (0.8*0.3+0.1*0.7) = 0.77", "Đoán"]} correct={1} explanation="Bayes cho phép UPDATE xác suất khi có bằng chứng mới. Trước khi thấy 'free': P(spam)=30%. Sau khi thấy 'free': P(spam|free)=77%. Từ 'free' là bằng chứng mạnh cho spam. Đây là cơ chế của Naive Bayes classifier — đơn giản nhưng hiệu quả cho spam filtering!">
          <p className="text-sm text-muted mt-2">
            Hãy tiếp tục để khám phá xác suất và thống kê trong ML.
          </p>
        </PredictionGate>
      </LessonSection>

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment><p>Toàn bộ ML là <strong>xác suất</strong>: Classification = P(class|input). Loss function = <strong>negative log-likelihood</strong>. Regularization = <strong>prior</strong>{" "}(Bayesian). Dropout = <strong>sampling</strong>. GAN = 2 distributions. Diffusion = <strong>adding/removing noise</strong>. Hiểu xác suất = hiểu TẠI SAO ML hoạt động!</p></AhaMoment>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge question="Model output: P(chó)=0.7, P(mèo)=0.2, P(chim)=0.1. Label thật: chó. Cross-entropy loss = ?" options={["-log(0.7) = 0.357", "-log(0.2) = 1.609", "-(0.7*log(0.7) + 0.2*log(0.2) + 0.1*log(0.1))"]} correct={0} explanation="CE với one-hot label [1,0,0] và prediction [0.7, 0.2, 0.1]: H = -1*log(0.7) - 0*log(0.2) - 0*log(0.1) = -log(0.7) = 0.357. Chỉ quan tâm xác suất của class ĐÚNG (0.7). Nếu model confident hơn (0.99) → loss thấp hơn (-log(0.99) = 0.01). Đây là lý do CE loss 'thưởng' model confident đúng." />
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p><strong>Probability & Statistics</strong>{" "}là nền tảng của mọi thuật toán ML — từ loss function đến model architecture.</p>
          <p><strong>Bayes Theorem:</strong></p>
          <LaTeX block>{"P(A|B) = \\frac{P(B|A) \\cdot P(A)}{P(B)} \\quad \\text{(posterior = likelihood × prior / evidence)}"}</LaTeX>
          <p><strong>Distributions quan trọng:</strong></p>
          <LaTeX block>{"\\text{Gaussian: } p(x) = \\frac{1}{\\sqrt{2\\pi\\sigma^2}} \\exp\\left(-\\frac{(x-\\mu)^2}{2\\sigma^2}\\right)"}</LaTeX>
          <LaTeX block>{"\\text{Bernoulli: } P(X=1) = p, \\quad P(X=0) = 1-p \\quad \\text{(binary outcomes)}"}</LaTeX>
          <p><strong>Cross-Entropy Loss = Negative Log-Likelihood:</strong></p>
          <LaTeX block>{"H(p, q) = -\\sum_x p(x) \\log q(x) \\quad \\text{(p = true, q = predicted)}"}</LaTeX>
          <Callout variant="tip" title="MLE = Minimize CE">Maximize likelihood = minimize negative log-likelihood = minimize cross-entropy. Đây là lý do TOÀN BỘ classification models dùng CE loss — nó chính là MLE dưới dạng khác!</Callout>
          <CodeBlock language="python" title="Xác suất trong ML">{`import numpy as np
from scipy import stats

# Bayes Theorem: P(spam|'free')
p_spam = 0.3
p_free_given_spam = 0.8
p_free_given_ham = 0.1
p_free = p_free_given_spam * p_spam + p_free_given_ham * (1 - p_spam)
p_spam_given_free = p_free_given_spam * p_spam / p_free
print(f"P(spam|'free') = {p_spam_given_free:.2f}")  # 0.77

# Cross-Entropy Loss
y_true = np.array([1, 0, 0])  # One-hot: chó
y_pred = np.array([0.7, 0.2, 0.1])  # Predictions
ce_loss = -np.sum(y_true * np.log(y_pred))
print(f"CE Loss = {ce_loss:.3f}")  # 0.357

# Gaussian distribution
x = np.linspace(-4, 4, 100)
pdf = stats.norm.pdf(x, loc=0, scale=1)  # mean=0, std=1`}</CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={["Bayes Theorem: cập nhật xác suất khi có bằng chứng mới. Core của Naive Bayes, Bayesian ML.", "Gaussian (Normal): default distribution trong ML. CLT: trung bình nhiều samples → Gaussian.", "Cross-Entropy = Negative Log-Likelihood = MLE. Default loss cho classification.", "Expectation E[X] = trung bình. Variance Var[X] = độ phân tán. Bias-Variance trade-off.", "Toàn bộ ML là xác suất: model = P(output|input). Training = tìm params tối ưu hoá likelihood."]} />
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
