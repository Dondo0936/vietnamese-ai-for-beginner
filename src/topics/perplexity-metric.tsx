"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
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
  slug: "perplexity-metric",
  title: "Perplexity",
  titleVi: "Perplexity - Độ bối rối của mô hình ngôn ngữ",
  description:
    "Chỉ số đánh giá mô hình ngôn ngữ, đo mức độ 'bất ngờ' khi mô hình gặp dữ liệu mới.",
  category: "nlp",
  tags: ["nlp", "evaluation", "language-model"],
  difficulty: "intermediate",
  relatedSlugs: ["gpt", "bert", "loss-functions"],
  vizType: "interactive",
};

/* ── Constants ── */
const TOTAL_STEPS = 8;

const TOKENS = ["Phở", "Hà", "Nội", "rất", "ngon"];

const MODEL_COMPARISON = [
  { name: "Mô hình ngẫu nhiên", ppl: 50000, desc: "Chọn ngẫu nhiên 1 trong 50K từ", color: "#ef4444" },
  { name: "N-gram đơn giản", ppl: 200, desc: "Đếm tần suất chuỗi từ", color: "#f59e0b" },
  { name: "LSTM", ppl: 50, desc: "Mạng hồi quy sâu", color: "#3b82f6" },
  { name: "GPT-2", ppl: 18, desc: "Transformer 1.5B params", color: "#8b5cf6" },
  { name: "GPT-4", ppl: 8, desc: "Transformer ~1T params", color: "#22c55e" },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Perplexity = 10 có nghĩa gì?",
    options: [
      "Mô hình có 10 lớp",
      "Mô hình 'phân vân' giữa khoảng 10 từ ứng viên cho mỗi vị trí",
      "Mô hình đúng 10% trường hợp",
      "Mô hình có 10 tham số",
    ],
    correct: 1,
    explanation:
      "Perplexity ≈ k nghĩa là tại mỗi vị trí, mô hình 'bối rối' như phải chọn ngẫu nhiên từ k từ. PPL = 10 tốt hơn PPL = 100 (ít bối rối hơn).",
  },
  {
    question: "Tại sao KHÔNG THỂ so sánh perplexity giữa GPT (50K tokens) và BERT (30K tokens)?",
    options: [
      "Vì GPT lớn hơn BERT",
      "Vì chúng dùng từ vựng KHÁC NHAU — perplexity chỉ so sánh được khi cùng vocabulary",
      "Vì BERT không tính được perplexity",
      "Vì GPT sinh text, BERT không",
    ],
    correct: 1,
    explanation:
      "Perplexity phụ thuộc vào kích thước từ vựng: từ vựng lớn hơn → perplexity tự nhiên cao hơn. Chỉ so sánh khi cùng vocabulary VÀ cùng tập kiểm tra!",
  },
  {
    question: "Perplexity thấp luôn có nghĩa mô hình tốt hơn?",
    options: [
      "Đúng, luôn luôn",
      "Không — PPL thấp có thể do overfitting, và PPL không đo chất lượng nội dung sinh ra",
      "Chỉ đúng cho GPT",
      "Chỉ đúng cho tiếng Anh",
    ],
    correct: 1,
    explanation:
      "PPL thấp do overfitting = mô hình nhớ thuộc dữ liệu huấn luyện. PPL cũng không đo: coherence (mạch lạc), factuality (đúng sự thật), hay safety (an toàn). Cần đánh giá đa chiều!",
  },
  {
    type: "fill-blank",
    question: "Perplexity là {blank} (2 mũ) của cross-entropy trung bình trên mỗi token, và quy tắc vàng là {blank} — mô hình càng ít 'bối rối' trước văn bản thật thì càng tốt.",
    blanks: [
      { answer: "exponent", accept: ["exponential", "lũy thừa", "mũ", "exponent of entropy"] },
      { answer: "lower is better", accept: ["càng thấp càng tốt", "thấp hơn là tốt hơn", "thấp là tốt"] },
    ],
    explanation: "PPL = 2^H, trong đó H là cross-entropy trung bình. Vì H = -Σ log P(w_i) / N, xác suất P càng cao thì H càng nhỏ → PPL càng thấp. Do đó lower is better: PPL = 8 của GPT-4 tốt hơn PPL = 50 của LSTM.",
  },
];

/* ── Main Component ── */
export default function PerplexityMetricTopic() {
  const [probs, setProbs] = useState([0.80, 0.70, 0.60, 0.50, 0.90]);

  const perplexity = useMemo(() => {
    const logSum = probs.reduce((s, p) => s + Math.log(p), 0);
    return Math.exp(-logSum / probs.length);
  }, [probs]);

  const crossEntropy = useMemo(() => {
    return -probs.reduce((s, p) => s + Math.log2(p), 0) / probs.length;
  }, [probs]);

  return (
    <>
      {/* ── Step 1: PredictionGate ── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử thách">
        <PredictionGate
          question={`Mô hình A đoán đúng 80% từ, mô hình B đoán đúng 40% từ. Mô hình nào "bối rối" hơn?`}
          options={["Mô hình A (80%) — vì đoán quá giỏi nên bối rối", "Mô hình B (40%) — vì đoán kém nên bối rối hơn", "Không thể xác định"]}
          correct={1}
          explanation={`Mô hình B đoán kém hơn → "bất ngờ" nhiều hơn → BỐI RỐI hơn. Perplexity đo chính xác điều này: mô hình bối rối đến mức nào khi gặp văn bản mới. Perplexity THẤP = tự tin, đúng. Perplexity CAO = bối rối, sai.`}
        />
      </LessonSection>

      {/* ── Step 2: Interactive Calculator ── */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Kéo thanh trượt để thay đổi xác suất mô hình gán cho mỗi từ. Xác suất cao = mô hình tự tin → perplexity thấp!
        </p>

        <VisualizationSection>
          <div className="space-y-5">
            {/* Token probabilities */}
            <div className="space-y-3">
              {TOKENS.map((token, i) => (
                <div key={token} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground w-16">{token}</span>
                    <span className="text-xs text-muted">
                      P = <span className={`font-bold ${probs[i] > 0.6 ? "text-green-500" : probs[i] > 0.3 ? "text-yellow-500" : "text-red-500"}`}>
                        {probs[i].toFixed(2)}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range" min="0.05" max="0.99" step="0.05" value={probs[i]}
                      onChange={(e) => {
                        const newProbs = [...probs];
                        newProbs[i] = parseFloat(e.target.value);
                        setProbs(newProbs);
                      }}
                      className="flex-1 accent-accent"
                    />
                    <div className="w-16 h-5 rounded-full bg-surface overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: probs[i] > 0.6 ? "#22c55e" : probs[i] > 0.3 ? "#f59e0b" : "#ef4444" }}
                        animate={{ width: `${probs[i] * 100}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Perplexity display */}
            <div className={`rounded-xl border-2 p-6 text-center ${
              perplexity < 3 ? "border-green-500 bg-green-500/5" :
              perplexity < 8 ? "border-yellow-500 bg-yellow-500/5" :
              "border-red-500 bg-red-500/5"
            }`}>
              <p className="text-xs text-muted uppercase tracking-wide">Perplexity</p>
              <p className={`text-4xl font-bold ${
                perplexity < 3 ? "text-green-500" : perplexity < 8 ? "text-yellow-500" : "text-red-500"
              }`}>
                {perplexity.toFixed(2)}
              </p>
              <p className="text-sm text-muted mt-1">
                {perplexity < 2 ? "Cực kỳ tự tin! Mô hình gần như chắc chắn." :
                 perplexity < 3 ? "Rất tốt! Mô hình tự tin cao." :
                 perplexity < 5 ? "Khá tốt." :
                 perplexity < 8 ? "Tạm ổn — mô hình hơi bối rối." :
                 "Bối rối nhiều! Mô hình cần cải thiện."}
              </p>
              <p className="text-xs text-muted mt-2">
                Cross-entropy H = {crossEntropy.toFixed(2)} bits | PPL = 2^H = {Math.pow(2, crossEntropy).toFixed(2)}
              </p>
            </div>

            <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
              <p className="text-sm text-muted">
                Thử kéo TẤT CẢ thanh trượt sang trái (xác suất thấp) → perplexity tăng vọt!
                Rồi kéo sang phải (xác suất cao) → perplexity giảm mạnh.
              </p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ── Step 3: AhaMoment ── */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          <p>
            <strong>Perplexity</strong>{" "}
            = mô hình {'"bối rối"'} giữa bao nhiêu lựa chọn tại mỗi vị trí. PPL = 10 nghĩa là phân vân giữa 10 từ. PPL = 2 nghĩa là gần như biết chắc!
          </p>
          <p className="text-sm text-muted mt-1">
            Giống chơi đoán từ: người giỏi (PPL thấp) thường đoán đúng, ít bất ngờ. Người kém (PPL cao) liên tục {'"ồ, không ngờ"'} khi thấy từ tiếp theo.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ── Step 4: Model Comparison ── */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="So sánh mô hình">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Perplexity cho thấy sự tiến bộ của NLP qua các thế hệ mô hình:
        </p>
        <div className="space-y-3">
          {MODEL_COMPARISON.map((m) => (
            <div key={m.name} className="flex items-center gap-3">
              <span className="w-36 text-sm font-medium text-foreground text-right">{m.name}</span>
              <div className="flex-1 h-6 rounded-full bg-surface overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: m.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(Math.log10(m.ppl) / Math.log10(50000) * 100, 100)}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
              <span className="w-20 text-right text-sm font-bold" style={{ color: m.color }}>
                PPL = {m.ppl.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted text-center mt-3">
          Từ ngẫu nhiên (50K) → GPT-4 (8): perplexity giảm 6,250 lần nhờ kiến trúc tốt hơn + dữ liệu nhiều hơn!
        </p>
      </LessonSection>

      {/* ── Step 5: InlineChallenge ── */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question="Mô hình có từ vựng 50,000 từ. Nếu chọn NGẪU NHIÊN (phân phối đều), perplexity bằng bao nhiêu?"
          options={[
            "50,000 — vì mỗi bước phân vân giữa tất cả 50K từ",
            "1 — vì chọn ngẫu nhiên là đơn giản nhất",
            "100 — giá trị trung bình",
          ]}
          correct={0}
          explanation="Chọn ngẫu nhiên: mỗi từ có xác suất 1/50,000 → PPL = 50,000. Bất kỳ mô hình nào có PPL < 50,000 đều tốt hơn chọn ngẫu nhiên! GPT-4 với PPL ≈ 8 tốt hơn 6,250 lần."
        />
      </LessonSection>

      {/* ── Step 6: Explanation ── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Perplexity</strong>{" "}
            là chỉ số đánh giá nội tại (intrinsic metric) phổ biến nhất cho mô hình ngôn ngữ như{" "}
            <TopicLink slug="gpt">GPT</TopicLink>{" "}và{" "}
            <TopicLink slug="bert">BERT</TopicLink>, đo mức {'"bất ngờ"'} trung bình khi gặp mỗi token sau khi qua bước{" "}
            <TopicLink slug="tokenization">tokenization</TopicLink>.
          </p>

          <Callout variant="insight" title="Công thức Perplexity">
            <div className="space-y-3">
              <p className="font-medium">Cross-entropy:</p>
              <LaTeX block>{`H(p, q) = -\\frac{1}{N} \\sum_{i=1}^{N} \\log_2 P(w_i | w_1, \\ldots, w_{i-1})`}</LaTeX>
              <p className="font-medium">Perplexity = 2 mũ cross-entropy:</p>
              <LaTeX block>{`\\text{PPL} = 2^{H(p,q)} = \\exp\\left(-\\frac{1}{N} \\sum_{i=1}^{N} \\ln P(w_i | w_{<i})\\right)`}</LaTeX>
              <p className="text-sm">
                N = số token. <LaTeX>{`P(w_i | w_{<i})`}</LaTeX>{" "}
                = xác suất mô hình gán cho token thứ i. PPL thấp = xác suất cao = mô hình tốt.
              </p>
            </div>
          </Callout>

          <Callout variant="info" title="Giải thích trực quan">
            <div className="space-y-2">
              <p>
                <strong>PPL = 1:</strong>{" "}
                Mô hình hoàn hảo, luôn chắc chắn 100% (không thực tế).
              </p>
              <p>
                <strong>PPL = 10:</strong>{" "}
                Mỗi bước phân vân giữa ~10 từ. Khá tốt!
              </p>
              <p>
                <strong>PPL = V (kích thước từ vựng):</strong>{" "}
                Không biết gì, chọn ngẫu nhiên. Tệ nhất!
              </p>
            </div>
          </Callout>

          <CodeBlock language="python" title="perplexity_calc.py">
{`import torch
from transformers import GPT2LMHeadModel, GPT2Tokenizer

# Tính perplexity cho GPT-2
model = GPT2LMHeadModel.from_pretrained("gpt2")
tokenizer = GPT2Tokenizer.from_pretrained("gpt2")

text = "Phở Hà Nội rất ngon và nổi tiếng"
inputs = tokenizer(text, return_tensors="pt")

with torch.no_grad():
    outputs = model(**inputs, labels=inputs["input_ids"])
    loss = outputs.loss  # cross-entropy loss

perplexity = torch.exp(loss).item()
print(f"Loss: {loss:.4f}")
print(f"Perplexity: {perplexity:.2f}")
# Loss: 3.2145
# Perplexity: 24.89
# → GPT-2 "phân vân" giữa ~25 từ cho mỗi vị trí`}
          </CodeBlock>

          <Callout variant="tip" title="Khi nào KHÔNG dùng perplexity?">
            <p>
              Perplexity KHÔNG đo: sự mạch lạc (coherence), sự đúng đắn (factuality), sự an toàn (safety), hay sự hữu ích (helpfulness). Để đánh giá chatbot như ChatGPT cần human evaluation + benchmark đa chiều (MMLU, HumanEval, ...).
            </p>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ── Step 7: MiniSummary ── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Perplexity"
          points={[
            "Perplexity đo mức 'bối rối' của mô hình: PPL thấp = tự tin, PPL cao = bối rối.",
            "PPL = 2^(cross-entropy). PPL ≈ k nghĩa là phân vân giữa ~k từ mỗi vị trí.",
            "Chỉ so sánh PPL khi cùng vocabulary VÀ cùng tập kiểm tra.",
            "Tiến bộ: Random (50K) → N-gram (200) → LSTM (50) → GPT-2 (18) → GPT-4 (8).",
            "PPL không đo chất lượng nội dung: cần thêm human eval, benchmark đa chiều.",
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
