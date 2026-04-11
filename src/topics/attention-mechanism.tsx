"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
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
  slug: "attention-mechanism",
  title: "Attention Mechanism",
  titleVi: "Attention - Cơ chế chú ý",
  description:
    "Cơ chế cho phép mô hình tập trung vào các phần quan trọng nhất của đầu vào khi tạo ra mỗi phần đầu ra.",
  category: "nlp",
  tags: ["nlp", "attention", "architecture"],
  difficulty: "intermediate",
  relatedSlugs: ["seq2seq", "self-attention", "transformer"],
  vizType: "interactive",
};

/* ── Constants ── */
const TOTAL_STEPS = 8;

const SOURCE = ["Tôi", "yêu", "Việt", "Nam"];
const TARGET = ["I", "love", "Vietnam"];

const SCORES: number[][] = [
  [0.85, 0.05, 0.05, 0.05],
  [0.05, 0.80, 0.10, 0.05],
  [0.02, 0.03, 0.50, 0.45],
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Attention weights cho 'Vietnam' là [0.02, 0.03, 0.50, 0.45]. Điều này có nghĩa gì?",
    options: [
      "Mô hình bỏ qua câu nguồn",
      "Mô hình chú ý chủ yếu vào 'Việt' (0.50) và 'Nam' (0.45) khi dịch 'Vietnam'",
      "Mô hình chú ý vào 'Tôi' nhiều nhất",
      "Attention weights không có ý nghĩa",
    ],
    correct: 1,
    explanation:
      "Weights [0.02, 0.03, 0.50, 0.45] cho thấy khi dịch 'Vietnam', mô hình chú ý chủ yếu vào 'Việt' và 'Nam' — hai thành phần tạo nên 'Vietnam' trong tiếng Việt!",
  },
  {
    question: "Attention giải quyết vấn đề gì của Seq2Seq?",
    options: [
      "Seq2Seq quá nhanh",
      "Bottleneck: context vector cố định không đủ chứa thông tin câu dài",
      "Seq2Seq không dùng neural network",
      "Seq2Seq không có encoder",
    ],
    correct: 1,
    explanation:
      "Seq2Seq nén toàn bộ input vào 1 vector cố định → mất thông tin câu dài. Attention cho decoder nhìn trực tiếp vào MỌI vị trí encoder → không bị giới hạn!",
  },
  {
    question: "Tổng tất cả attention weights cho một từ output luôn bằng bao nhiêu?",
    options: ["0", "0.5", "1", "Tùy ý"],
    correct: 2,
    explanation:
      "Attention weights được chuẩn hóa bằng softmax → tổng luôn = 1. Đây là phân phối xác suất trên các vị trí nguồn: mỗi vị trí được 'quan tâm' bao nhiêu phần trăm.",
  },
];

/* ── Main Component ── */
export default function AttentionMechanismTopic() {
  const [targetIdx, setTargetIdx] = useState(0);

  const scores = useMemo(() => SCORES[targetIdx], [targetIdx]);
  const maxScoreIdx = useMemo(() => scores.indexOf(Math.max(...scores)), [scores]);

  return (
    <>
      {/* ── Step 1: PredictionGate ── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử thách">
        <PredictionGate
          question={`Khi dịch "Vietnam" từ câu "Tôi yêu Việt Nam", phiên dịch viên cần TẬP TRUNG vào từ nào nhất?`}
          options={['"Tôi" — vì đứng đầu câu', '"Việt" và "Nam" — vì là thành phần tạo nên Vietnam', '"yêu" — vì là động từ']}
          correct={1}
          explanation={`Khi dịch "Vietnam", bạn tập trung vào "Việt" và "Nam", gần như bỏ qua "Tôi" và "yêu". Mỗi từ output CẦN CHÚ Ý vào phần khác nhau của input! Cơ chế Attention cho mô hình khả năng "tập trung" giống như bạn vừa làm.`}
        />
      </LessonSection>

      {/* ── Step 2: Interactive Viz ── */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Nhấn vào từng từ tiếng Anh bên dưới để xem mô hình {'"nhìn vào đâu"'} trong câu tiếng Việt. Độ đậm = mức độ chú ý!
        </p>

        <VisualizationSection>
          <div className="space-y-5">
            {/* Target word selector */}
            <div className="flex gap-2 justify-center">
              {TARGET.map((word, i) => (
                <button key={word} type="button" onClick={() => setTargetIdx(i)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                    targetIdx === i
                      ? "bg-green-500 text-white ring-2 ring-green-300 scale-105"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}>
                  {word}
                </button>
              ))}
            </div>

            {/* Attention visualization */}
            <div className="space-y-4">
              {/* Source tokens with attention bars */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide text-center">
                  Câu nguồn (Tiếng Việt) — attention weights khi dịch {'"'}{TARGET[targetIdx]}{'"'}
                </p>
                {SOURCE.map((word, i) => (
                  <div key={word} className="flex items-center gap-3">
                    <span className={`w-16 text-right text-sm font-medium transition-all ${
                      i === maxScoreIdx ? "text-accent font-bold" : "text-foreground"
                    }`}>{word}</span>
                    <div className="flex-1 h-8 rounded-lg bg-surface overflow-hidden relative">
                      <motion.div
                        className="h-full rounded-lg bg-yellow-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${scores[i] * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
                        {(scores[i] * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Connection visualization */}
              <svg viewBox="0 0 500 120" className="w-full max-w-lg mx-auto">
                {/* Source */}
                {SOURCE.map((word, i) => {
                  const x = 60 + i * 100;
                  return (
                    <g key={`src-${i}`}>
                      <rect x={x - 30} y={10} width={60} height={28} rx={6}
                        fill="#3b82f6" opacity={0.3 + scores[i] * 0.7} />
                      <text x={x} y={28} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">{word}</text>
                    </g>
                  );
                })}
                {/* Lines */}
                {SOURCE.map((_, i) => {
                  const sx = 60 + i * 100;
                  const tx = 60 + targetIdx * 100;
                  return (
                    <line key={`line-${i}`} x1={sx} y1={38} x2={tx} y2={78}
                      stroke="#f59e0b" strokeWidth={scores[i] * 8 + 0.5} opacity={scores[i] * 0.9 + 0.1} />
                  );
                })}
                {/* Target */}
                <rect x={60 + targetIdx * 100 - 35} y={80} width={70} height={28} rx={6} fill="#22c55e" />
                <text x={60 + targetIdx * 100} y={98} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
                  {TARGET[targetIdx]}
                </text>
              </svg>
            </div>

            <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
              <p className="text-sm text-muted">
                Khi dịch {'"'}<strong className="text-green-500">{TARGET[targetIdx]}</strong>{'"'}, mô hình chú ý nhất vào{" "}
                <strong className="text-accent">{SOURCE[maxScoreIdx]}</strong>{" "}
                ({(scores[maxScoreIdx] * 100).toFixed(0)}%). Tổng weights = {scores.reduce((a, b) => a + b, 0).toFixed(2)} (luôn = 1.00)
              </p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ── Step 3: AhaMoment ── */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          <p>
            <strong>Attention</strong>{" "}
            cho mô hình khả năng {'"nhìn vào đâu cần nhìn"'} — mỗi từ output có bản đồ chú ý riêng trên câu input. Giống phiên dịch viên liếc mắt vào đúng chỗ cần dịch!
          </p>
          <p className="text-sm text-muted mt-1">
            Giải quyết bottleneck của Seq2Seq: thay vì 1 context vector cố định, decoder giờ có thể {'"nhìn lại"'} mọi vị trí encoder.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ── Step 4: InlineChallenge ── */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question="Attention weights được tính bằng hàm gì để đảm bảo tổng = 1?"
          options={[
            "Sigmoid — vì output từ 0 đến 1",
            "Softmax — biến điểm thành phân phối xác suất (tổng = 1)",
            "ReLU — vì loại bỏ giá trị âm",
          ]}
          correct={1}
          explanation="Softmax biến các điểm (scores) thành phân phối xác suất: mỗi giá trị từ 0 đến 1, tổng luôn = 1. Giống chia 100% sự chú ý cho các vị trí khác nhau!"
        />
      </LessonSection>

      {/* ── Step 5: 3-step process ── */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Quy trình 3 bước">
        <div className="space-y-3">
          {[
            {
              step: "1. Tính điểm (Score)",
              desc: "So sánh trạng thái decoder hiện tại với mỗi trạng thái encoder",
              formula: "e_{ij} = \\text{score}(s_{i-1}, h_j)",
              color: "#3b82f6",
            },
            {
              step: "2. Softmax (Normalize)",
              desc: "Chuyển điểm thành xác suất — tổng = 1",
              formula: "\\alpha_{ij} = \\frac{\\exp(e_{ij})}{\\sum_k \\exp(e_{ik})}",
              color: "#f59e0b",
            },
            {
              step: "3. Tổng có trọng số",
              desc: "Kết hợp các trạng thái encoder theo trọng số attention",
              formula: "c_i = \\sum_j \\alpha_{ij} h_j",
              color: "#22c55e",
            },
          ].map((item) => (
            <div key={item.step} className="rounded-xl border p-4 space-y-2" style={{ borderColor: item.color + "40" }}>
              <p className="text-sm font-semibold" style={{ color: item.color }}>{item.step}</p>
              <p className="text-sm text-foreground">{item.desc}</p>
              <LaTeX display>{item.formula}</LaTeX>
            </div>
          ))}
        </div>
      </LessonSection>

      {/* ── Step 6: Explanation ── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Cơ chế Attention</strong>{" "}
            (Bahdanau et al., 2014) cho phép decoder {'"nhìn lại"'} mọi vị trí encoder khi sinh mỗi token, thay vì chỉ dựa vào context vector cố định.
          </p>

          <Callout variant="insight" title="Các loại Attention">
            <div className="space-y-2">
              <p>
                <strong>Additive (Bahdanau):</strong>{" "}
                <LaTeX>{`\\text{score}(s, h) = v^{\\top} \\tanh(W_1 s + W_2 h)`}</LaTeX>
              </p>
              <p>
                <strong>Dot-product (Luong):</strong>{" "}
                <LaTeX>{`\\text{score}(s, h) = s^{\\top} h`}</LaTeX>
              </p>
              <p>
                <strong>Scaled dot-product (Transformer):</strong>{" "}
                <LaTeX>{`\\text{score}(Q, K) = \\frac{Q K^{\\top}}{\\sqrt{d_k}}`}</LaTeX>
              </p>
            </div>
          </Callout>

          <Callout variant="info" title="Attention → Self-Attention → Transformer">
            <div className="space-y-2">
              <p>
                <strong>Attention (2014):</strong>{" "}
                Decoder nhìn vào encoder (cross-attention).
              </p>
              <p>
                <strong>Self-Attention (2017):</strong>{" "}
                Mỗi từ nhìn vào TẤT CẢ các từ khác trong cùng câu.
              </p>
              <p>
                <strong>Transformer:</strong>{" "}
                Xây hoàn toàn trên self-attention, bỏ RNN → xử lý song song → GPT, BERT!
              </p>
            </div>
          </Callout>

          <CodeBlock language="python" title="attention_demo.py">
{`import torch
import torch.nn.functional as F

# Attention trong 5 dòng
def attention(query, keys, values):
    # query: decoder state [batch, d]
    # keys: encoder states [batch, seq_len, d]
    # values: encoder states [batch, seq_len, d]

    # 1. Tính điểm (dot product)
    scores = torch.matmul(query.unsqueeze(1), keys.transpose(-2, -1))
    # scores: [batch, 1, seq_len]

    # 2. Softmax → attention weights
    weights = F.softmax(scores, dim=-1)
    # weights: [batch, 1, seq_len] — tổng = 1

    # 3. Tổng có trọng số
    context = torch.matmul(weights, values)
    # context: [batch, 1, d]

    return context, weights

# Ví dụ: dịch "Vietnam" từ "Tôi yêu Việt Nam"
# weights ≈ [0.02, 0.03, 0.50, 0.45]
# → Chú ý chủ yếu vào "Việt" và "Nam"!`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      {/* ── Step 7: MiniSummary ── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Attention"
          points={[
            "Attention cho mỗi từ output một 'bản đồ chú ý' riêng trên câu input.",
            "Quy trình: tính điểm → softmax (tổng=1) → tổng có trọng số.",
            "Giải quyết bottleneck Seq2Seq: decoder nhìn trực tiếp mọi vị trí encoder.",
            "Self-Attention: mỗi từ nhìn TẤT CẢ từ khác → nền tảng của Transformer.",
            "Attention là thành phần cốt lõi của BERT, GPT, và mọi mô hình NLP hiện đại.",
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
