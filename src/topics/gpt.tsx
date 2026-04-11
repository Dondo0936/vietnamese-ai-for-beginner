"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX, ToggleCompare,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "gpt",
  title: "GPT",
  titleVi: "GPT - Mô hình ngôn ngữ tự hồi quy",
  description:
    "Mô hình ngôn ngữ sinh văn bản bằng cách dự đoán từ tiếp theo dựa trên các từ trước đó, nền tảng của ChatGPT.",
  category: "nlp",
  tags: ["nlp", "transformer", "language-model"],
  difficulty: "advanced",
  relatedSlugs: ["transformer", "attention-mechanism", "bert"],
  vizType: "interactive",
};

/* ── Constants ── */
const TOTAL_STEPS = 8;

const SEQUENCE = ["Phở", "Hà", "Nội", "rất", "ngon", "và", "nổi", "tiếng", "khắp"];
const NEXT_PREDICTIONS = [
  { tokens: ["Hà", "bò", "gà"], probs: [0.45, 0.30, 0.15] },
  { tokens: ["Nội", "Giang", "Tĩnh"], probs: [0.70, 0.15, 0.10] },
  { tokens: ["rất", "là", "cũng"], probs: [0.50, 0.25, 0.15] },
  { tokens: ["ngon", "nổi", "đặc"], probs: [0.55, 0.20, 0.15] },
  { tokens: ["và", "nhưng", "tuyệt"], probs: [0.35, 0.25, 0.20] },
  { tokens: ["nổi", "rất", "được"], probs: [0.40, 0.25, 0.15] },
  { tokens: ["tiếng", "bật", "danh"], probs: [0.60, 0.20, 0.10] },
  { tokens: ["khắp", "trên", "ở"], probs: [0.45, 0.25, 0.15] },
  { tokens: ["thế", "nơi", "Việt"], probs: [0.50, 0.25, 0.15] },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "GPT và BERT đều dùng Transformer. Điểm khác biệt cốt lõi là gì?",
    options: [
      "GPT lớn hơn BERT",
      "GPT đọc MỘT CHIỀU (trái→phải), BERT đọc HAI CHIỀU",
      "BERT không dùng attention",
      "GPT không có pre-training",
    ],
    correct: 1,
    explanation:
      "GPT dùng Transformer Decoder (masked attention, chỉ nhìn trái→phải). BERT dùng Transformer Encoder (nhìn cả hai hướng). GPT giỏi SINH, BERT giỏi HIỂU.",
  },
  {
    question: "Mục tiêu huấn luyện của GPT là gì?",
    options: [
      "Đoán từ bị che (masked)",
      "Dự đoán từ TIẾP THEO dựa trên các từ trước đó",
      "Phân loại câu",
      "Dịch ngôn ngữ",
    ],
    correct: 1,
    explanation:
      "GPT được huấn luyện để tối đa P(w_t | w_1, ..., w_{t-1}) — xác suất từ tiếp theo. Mục tiêu đơn giản này, khi scale lên, tạo ra khả năng phi thường!",
  },
  {
    question: "GPT-3 có 175 tỷ tham số. Tại sao scale lớn lại quan trọng?",
    options: [
      "Nhiều tham số = chạy nhanh hơn",
      "Scale lớn hơn → hiểu ngữ cảnh tốt hơn, có khả năng suy luận phức tạp (emergent abilities)",
      "Chỉ cần bộ nhớ lớn là đủ",
      "Số tham số không quan trọng",
    ],
    correct: 1,
    explanation:
      "Scaling laws: mô hình lớn + dữ liệu nhiều → khả năng mới xuất hiện (emergent abilities). GPT-3 có thể few-shot learning, viết code, suy luận — điều GPT-2 không làm được!",
  },
];

/* ── Main Component ── */
export default function GptTopic() {
  const [genIdx, setGenIdx] = useState(3);
  const [showPredictions, setShowPredictions] = useState(true);

  return (
    <>
      {/* ── Step 1: PredictionGate ── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử thách">
        <PredictionGate
          question={`"Phở Hà Nội rất ___" — hãy đoán từ tiếp theo!`}
          options={['"ngon"', '"xe máy"', '"toán học"']}
          correct={0}
          explanation={`Bạn dự đoán "ngon" vì đã đọc "Phở Hà Nội rất" — não bạn dùng các từ trước để đoán từ tiếp theo. GPT hoạt động CHÍNH XÁC như vậy! Nó đọc từ trái sang phải, dùng TẤT CẢ từ trước để dự đoán từ kế tiếp. Đơn giản nhưng mạnh mẽ!`}
        />
      </LessonSection>

      {/* ── Step 2: Interactive Generation ── */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Kéo thanh trượt để xem GPT sinh từng từ một. Ở mỗi bước, GPT phải chọn từ tiếp theo từ hàng nghìn ứng viên — bạn thấy top 3 dự đoán bên dưới.
        </p>

        <VisualizationSection>
          <div className="space-y-5">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted">
                Số từ đã sinh: <span className="text-accent font-bold">{genIdx + 1}</span> / {SEQUENCE.length}
              </label>
              <input
                type="range" min="0" max={SEQUENCE.length - 1} step="1" value={genIdx}
                onChange={(e) => setGenIdx(parseInt(e.target.value))}
                className="w-full accent-accent"
              />
            </div>

            {/* Generated sequence */}
            <div className="flex flex-wrap gap-2 justify-center min-h-[48px]">
              {SEQUENCE.map((word, i) => {
                const isGenerated = i <= genIdx;
                const isNext = i === genIdx + 1;
                return (
                  <motion.span
                    key={i}
                    initial={isGenerated ? { opacity: 0, y: -10 } : {}}
                    animate={{ opacity: isGenerated ? 1 : isNext ? 0.5 : 0.2, y: 0 }}
                    className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${
                      isGenerated ? "bg-green-500 text-white" : isNext ? "bg-yellow-500/30 text-yellow-500 border border-yellow-500" : "bg-surface text-muted"
                    }`}
                  >
                    {isGenerated ? word : isNext ? "?" : "..."}
                  </motion.span>
                );
              })}
            </div>

            {/* Causal mask */}
            <div className="rounded-lg bg-background/50 border border-border p-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                Mặt nạ nhân quả (Causal Mask) — GPT chỉ nhìn từ trước đó
              </p>
              <div className="flex justify-center gap-0.5">
                {Array.from({ length: 6 }).map((_, row) => (
                  <div key={row} className="flex flex-col gap-0.5">
                    {Array.from({ length: 6 }).map((_, col) => (
                      <div key={col}
                        className={`w-5 h-5 rounded-sm ${col <= row ? "bg-green-500/50" : "bg-surface"}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted text-center mt-2">
                Xanh = có thể nhìn thấy. Tối = bị che (tương lai).
              </p>
            </div>

            {/* Next word predictions */}
            {genIdx < NEXT_PREDICTIONS.length && (
              <div className="rounded-lg bg-background/50 border border-border p-4 space-y-2">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                  Top 3 dự đoán cho từ tiếp theo
                </p>
                {NEXT_PREDICTIONS[genIdx].tokens.map((token, i) => (
                  <div key={token} className="flex items-center gap-3">
                    <span className="w-16 text-right text-sm font-medium text-foreground">{token}</span>
                    <div className="flex-1 h-5 rounded-full bg-surface overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: i === 0 ? "#22c55e" : i === 1 ? "#3b82f6" : "#8b5cf6" }}
                        initial={{ width: 0 }}
                        animate={{ width: `${NEXT_PREDICTIONS[genIdx].probs[i] * 100}%` }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                      />
                    </div>
                    <span className="w-12 text-right text-xs text-muted">
                      {(NEXT_PREDICTIONS[genIdx].probs[i] * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ── Step 3: AhaMoment ── */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          <p>
            <strong>GPT</strong>{" "}
            chỉ làm MỘT VIỆC: dự đoán từ tiếp theo. Nhưng khi được huấn luyện trên hàng tỷ câu, nó {'"hiểu"'} ngôn ngữ đủ sâu để viết văn, trả lời câu hỏi, và viết code!
          </p>
          <p className="text-sm text-muted mt-1">
            Như người kể chuyện giỏi: chỉ dựa vào những gì đã nói để tiếp tục, nhưng nhờ đọc hàng tỷ câu chuyện nên kể rất mạch lạc.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ── Step 4: InlineChallenge ── */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question="GPT đọc một chiều (trái→phải) nên không giỏi HIỂU ngữ cảnh bằng BERT. Nhưng tại sao ChatGPT lại trả lời câu hỏi tốt?"
          options={[
            "ChatGPT dùng BERT bên trong",
            "GPT đủ lớn (100B+ params) để 'hiểu' ngữ cảnh dù chỉ đọc một chiều — scale giải quyết mọi thứ",
            "ChatGPT không thật sự hiểu, chỉ copy",
          ]}
          correct={1}
          explanation="Scaling laws: khi mô hình đủ lớn + đủ dữ liệu, khả năng mới xuất hiện (emergent abilities). GPT-4 với hàng trăm tỷ tham số có thể suy luận, viết code, giải toán — dù chỉ 'dự đoán từ tiếp theo'!"
        />
      </LessonSection>

      {/* ── Step 5: GPT vs BERT ── */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="So sánh">
        <ToggleCompare
          labelA="GPT (→ một chiều)"
          labelB="BERT (↔ hai chiều)"
          description="Cùng dùng Transformer, nhưng kiến trúc và mục tiêu khác nhau hoàn toàn."
          childA={
            <div className="space-y-3 p-3">
              <p className="text-sm text-foreground">
                <strong>Kiến trúc:</strong>{" "}
                Transformer Decoder (masked self-attention)
              </p>
              <p className="text-sm text-foreground">
                <strong>Mục tiêu:</strong>{" "}
                Dự đoán từ TIẾP THEO (autoregressive)
              </p>
              <p className="text-sm text-foreground">
                <strong>Giỏi:</strong>{" "}
                SINH văn bản — chatbot, viết code, sáng tạo
              </p>
              <div className="rounded bg-green-500/10 p-2 text-xs text-green-500 text-center">
                ChatGPT, GPT-4, Claude, LLaMA
              </div>
            </div>
          }
          childB={
            <div className="space-y-3 p-3">
              <p className="text-sm text-foreground">
                <strong>Kiến trúc:</strong>{" "}
                Transformer Encoder (full self-attention)
              </p>
              <p className="text-sm text-foreground">
                <strong>Mục tiêu:</strong>{" "}
                Đoán từ BỊ CHE (masked language model)
              </p>
              <p className="text-sm text-foreground">
                <strong>Giỏi:</strong>{" "}
                HIỂU văn bản — phân loại, NER, hỏi đáp
              </p>
              <div className="rounded bg-blue-500/10 p-2 text-xs text-blue-500 text-center">
                BERT, PhoBERT, RoBERTa, DeBERTa
              </div>
            </div>
          }
        />
      </LessonSection>

      {/* ── Step 6: Explanation ── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>GPT</strong>{" "}
            (Generative Pre-trained Transformer, OpenAI 2018) dùng Transformer Decoder để sinh văn bản tự hồi quy — dự đoán từ tiếp theo dựa trên tất cả từ trước đó.
          </p>

          <Callout variant="insight" title="Mục tiêu huấn luyện">
            <p>Tối đa xác suất chuỗi (language modeling objective):</p>
            <LaTeX block>{`\\max_{\\theta} \\sum_{t=1}^{T} \\log P(w_t | w_1, w_2, \\ldots, w_{t-1}; \\theta)`}</LaTeX>
            <p className="mt-2 text-sm">
              Với mỗi token, mô hình dự đoán phân phối xác suất trên toàn bộ từ vựng. Token có xác suất cao nhất (hoặc được sampling) trở thành output.
            </p>
          </Callout>

          <Callout variant="info" title="Hành trình Scale: GPT → GPT-4">
            <div className="space-y-2">
              <p><strong>GPT-1 (2018):</strong>{" "}117M params, 12 layers</p>
              <p><strong>GPT-2 (2019):</strong>{" "}1.5B params, 48 layers — sinh text giống người</p>
              <p><strong>GPT-3 (2020):</strong>{" "}175B params — few-shot learning, viết code</p>
              <p><strong>GPT-4 (2023):</strong>{" "}Ước tính 1T+ params — suy luận phức tạp, multimodal</p>
            </div>
          </Callout>

          <CodeBlock language="python" title="gpt_demo.py">
{`from transformers import pipeline

# Sinh văn bản tiếng Việt với GPT
generator = pipeline("text-generation",
                     model="vinai/phobert-base")

# GPT sinh tiếp từ prompt
prompt = "Phở Hà Nội"
result = generator(
    prompt,
    max_length=30,
    num_return_sequences=3,
    temperature=0.8,  # Cao → sáng tạo hơn
    top_p=0.9,        # Nucleus sampling
)

for seq in result:
    print(seq["generated_text"])
# "Phở Hà Nội rất ngon và nổi tiếng khắp thế giới..."
# "Phở Hà Nội là món ăn đặc trưng của người Việt..."
# "Phở Hà Nội có hương vị đặc biệt không nơi nào có..."`}
          </CodeBlock>

          <Callout variant="tip" title="Temperature và Sampling">
            <p>
              <strong>Temperature:</strong>{" "}
              Thấp (0.1) → an toàn, lặp lại. Cao (1.5) → sáng tạo, bất ngờ.{" "}
              <strong>Top-p (nucleus):</strong>{" "}
              Chỉ chọn từ các token chiếm p% xác suất cao nhất. GPT-4 mặc định temperature = 1.0, top_p = 1.0.
            </p>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ── Step 7: MiniSummary ── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về GPT"
          points={[
            "GPT = Transformer Decoder đọc MỘT CHIỀU (trái→phải), dự đoán từ tiếp theo.",
            "Causal mask đảm bảo token hiện tại KHÔNG nhìn thấy token tương lai.",
            "GPT giỏi SINH (chatbot, code), BERT giỏi HIỂU (phân loại, NER).",
            "Scaling laws: GPT-1 (117M) → GPT-4 (1T+) — mỗi bước scale tạo khả năng mới.",
            "Temperature + Top-p điều khiển sự sáng tạo: thấp = an toàn, cao = bất ngờ.",
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
