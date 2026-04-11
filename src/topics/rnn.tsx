"use client";

import { useState, useCallback } from "react";
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
  slug: "rnn",
  title: "Recurrent Neural Network",
  titleVi: "Mạng nơ-ron hồi quy",
  description: "Kiến trúc xử lý dữ liệu tuần tự bằng cách truyền trạng thái ẩn qua các bước thời gian",
  category: "dl-architectures",
  tags: ["sequence", "nlp", "time-series"],
  difficulty: "intermediate",
  relatedSlugs: ["lstm", "gru", "transformer"],
  vizType: "interactive",
};

/* ── Constants ── */
const WORDS = ["Tôi", "thích", "ăn", "phở", "bò", "Huế"];
const W_COLORS = ["#3b82f6", "#8b5cf6", "#f97316", "#22c55e", "#ec4899", "#ef4444"];

const HIDDEN_DESC = [
  "h₀: chưa có context",
  "h₁: biết 'Tôi' → ai đó nói về bản thân",
  "h₂: biết 'Tôi thích' → đang nói về sở thích",
  "h₃: biết 'Tôi thích ăn' → sở thích về đồ ăn",
  "h₄: biết 'Tôi thích ăn phở' → thích phở cụ thể",
  "h₅: biết 'Tôi thích ăn phở bò' → loại phở bò",
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "RNN xử lý câu 100 từ. Tại từ thứ 100, trạng thái ẩn h₁₀₀ chứa thông tin gì?",
    options: [
      "Chỉ chứa thông tin từ thứ 100",
      "Về lý thuyết chứa thông tin từ tất cả 100 từ, nhưng thực tế các từ đầu bị 'phai nhạt'",
      "Chứa đầy đủ thông tin từ tất cả 100 từ",
      "Chỉ chứa thông tin 10 từ gần nhất",
    ],
    correct: 1,
    explanation: "Trạng thái ẩn hₜ lý thuyết tóm tắt toàn bộ lịch sử. Nhưng thực tế, gradient bị biến mất qua nhiều bước (vanishing gradient), nên thông tin từ xa bị phai nhạt. Đây là động lực ra đời LSTM và GRU.",
  },
  {
    question: "Tại sao RNN gọi là 'recurrent' (hồi quy)?",
    options: [
      "Vì nó dùng regression (hồi quy tuyến tính)",
      "Vì output được đưa ngược lại làm input cho bước tiếp theo",
      "Vì nó lặp lại nhiều lần trong quá trình huấn luyện",
      "Vì cấu trúc giống vòng lặp for",
    ],
    correct: 1,
    explanation: "'Recurrent' = hồi quy, quay lại. Trạng thái ẩn hₜ (output nội bộ) được truyền ngược lại làm input cho bước t+1. Cùng một bộ trọng số được dùng lặp lại ở mọi bước thời gian.",
  },
  {
    question: "Transformer đã thay thế RNN trong hầu hết bài toán NLP. Vậy RNN còn dùng ở đâu?",
    options: [
      "Không còn dùng ở đâu nữa",
      "Chỉ dùng trong giáo dục",
      "Xử lý stream dữ liệu real-time, thiết bị edge với bộ nhớ hạn chế",
      "Chỉ dùng cho ngôn ngữ tiếng Anh",
    ],
    correct: 2,
    explanation: "RNN xử lý từng token một → phù hợp streaming data (sensor, audio real-time). Trên thiết bị edge với RAM hạn chế, RNN nhỏ gọn hơn Transformer. Ngoài ra, State Space Models (Mamba) mới lấy cảm hứng từ RNN.",
  },
];

/* ── Component ── */
export default function RnnTopic() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const stepForward = useCallback(() => {
    setActiveStep((prev) => Math.min(WORDS.length - 1, prev + 1));
  }, []);

  const reset = useCallback(() => {
    setActiveStep(0);
    setIsPlaying(false);
  }, []);

  const autoPlay = useCallback(() => {
    setIsPlaying(true);
    setActiveStep(0);
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      if (step >= WORDS.length) {
        clearInterval(interval);
        setIsPlaying(false);
        return;
      }
      setActiveStep(step);
    }, 800);
  }, []);

  const TOTAL_STEPS = 8;

  return (
    <>
      {/* ═══ Step 1: HOOK ═══ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question={`Câu "Tôi thích ăn phở bò ___". Từ tiếp theo có thể là gì? Để đoán đúng, bạn cần nhớ gì?`}
          options={[
            "Chỉ cần biết từ cuối cùng 'bò' là đủ",
            "Cần nhớ cả câu trước đó để hiểu ngữ cảnh",
            "Không cần nhớ gì — đoán ngẫu nhiên",
          ]}
          correct={1}
          explanation={`Bạn cần "bộ nhớ"! Biết "bò" thôi có thể đoán "bò tót, bò sữa...". Nhưng nhớ cả câu "Tôi thích ăn phở bò" → đoán "Huế, tái, nạm..." chính xác hơn nhiều. RNN mô phỏng chính khả năng "nhớ ngữ cảnh" này.`}
        />
      </LessonSection>

      {/* ═══ Step 2: DISCOVER — Interactive RNN ═══ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá RNN">
        <p className="text-sm text-foreground leading-relaxed mb-3">
          Hãy tưởng tượng bạn đang chạy Grab qua các ngã tư. Tại mỗi ngã tư, bạn nhớ tất cả các ngã tư đã đi qua (trạng thái ẩn) để quyết định rẽ đâu tiếp theo. Bạn không nhìn bản đồ tổng thể — chỉ dựa vào{" "}
          <strong>ký ức + thông tin hiện tại</strong>.
        </p>

        <VisualizationSection>
          <p className="text-sm text-muted mb-3">
            Nhấn &quot;Bước tiếp&quot; hoặc &quot;Tự động chạy&quot; để xem dữ liệu truyền qua RNN. Quan sát cách trạng thái ẩn h tích lũy ngữ cảnh.
          </p>

          <svg viewBox="0 0 520 240" className="w-full rounded-lg border border-border bg-background">
            {WORDS.map((word, i) => {
              const x = 18 + i * 84;
              const isActive = i <= activeStep;
              const isCurrent = i === activeStep;

              return (
                <g key={i} opacity={isActive ? 1 : 0.2}>
                  {/* Input word */}
                  <motion.rect x={x} y={160} width={70} height={32} rx={8}
                    fill={W_COLORS[i]} opacity={isCurrent ? 0.25 : 0.12}
                    stroke={W_COLORS[i]} strokeWidth={isCurrent ? 2.5 : 1}
                    animate={isCurrent ? { scale: [1, 1.03, 1] } : {}}
                    transition={{ duration: 0.3 }} />
                  <text x={x + 35} y={181} fontSize={13} fill={W_COLORS[i]}
                    textAnchor="middle" fontWeight={700}>
                    {word}
                  </text>
                  <text x={x + 35} y={201} fontSize={9} fill="currentColor" className="text-muted"
                    textAnchor="middle">
                    x{i}
                  </text>

                  {/* Arrow up to RNN cell */}
                  <line x1={x + 35} y1={157} x2={x + 35} y2={128}
                    stroke={isActive ? "#888" : "#444"} strokeWidth={1.5} />
                  <polygon
                    points={`${x + 35},125 ${x + 31},131 ${x + 39},131`}
                    fill={isActive ? "#888" : "#444"} />

                  {/* RNN cell */}
                  <rect x={x} y={85} width={70} height={40} rx={10}
                    fill="#f97316" opacity={isCurrent ? 0.35 : 0.08}
                    stroke="#f97316" strokeWidth={isCurrent ? 2.5 : 1} />
                  <text x={x + 35} y={110} fontSize={12} fill="#f97316"
                    textAnchor="middle" fontWeight={700}>
                    RNN
                  </text>

                  {/* Hidden state arrow to right */}
                  {i < WORDS.length - 1 && (
                    <>
                      <line x1={x + 70} y1={105} x2={x + 84} y2={105}
                        stroke={isActive && i < activeStep ? "#22c55e" : "#444"}
                        strokeWidth={isActive && i < activeStep ? 2.5 : 1} />
                      <polygon
                        points={`${x + 86},105 ${x + 81},101 ${x + 81},109`}
                        fill={isActive && i < activeStep ? "#22c55e" : "#444"} />
                    </>
                  )}

                  {/* h label above */}
                  <text x={x + 35} y={77} fontSize={10} fill="#22c55e"
                    textAnchor="middle" fontWeight={600}>
                    h{i}
                  </text>

                  {/* Output arrow up */}
                  <line x1={x + 35} y1={85} x2={x + 35} y2={55}
                    stroke={isActive ? "#888" : "#444"} strokeWidth={1} />

                  {/* Output */}
                  <rect x={x + 8} y={28} width={55} height={26} rx={8}
                    fill="#8b5cf6" opacity={isCurrent ? 0.25 : 0.06}
                    stroke="#8b5cf6" strokeWidth={isCurrent ? 1.5 : 0.5} />
                  <text x={x + 35} y={46} fontSize={10} fill="#8b5cf6"
                    textAnchor="middle" fontWeight={500}>
                    y{i}
                  </text>
                </g>
              );
            })}

            {/* Status label */}
            <text x={10} y={233} fontSize={10} fill="currentColor" className="text-muted">
              Bước {activeStep + 1}/{WORDS.length}
            </text>
          </svg>

          {/* Hidden state description */}
          <motion.div
            key={activeStep}
            className="mt-3 rounded-lg border border-green-500/30 bg-green-500/5 p-3"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-sm text-green-500 font-medium">
              {HIDDEN_DESC[activeStep]}
            </p>
            <p className="text-xs text-muted mt-1">
              Trạng thái ẩn tích lũy dần — mỗi bước thêm thông tin từ mới vào &quot;bộ nhớ&quot;.
            </p>
          </motion.div>

          <div className="mt-4 flex items-center gap-3">
            <button type="button" onClick={stepForward}
              disabled={activeStep >= WORDS.length - 1 || isPlaying}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-white disabled:opacity-30">
              Bước tiếp
            </button>
            <button type="button" onClick={autoPlay}
              disabled={isPlaying}
              className="rounded-lg border border-accent bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-white disabled:opacity-30">
              Tự động chạy
            </button>
            <button type="button" onClick={reset}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface">
              Đặt lại
            </button>
          </div>
        </VisualizationSection>

        <p className="text-sm text-muted mt-3">
          Bạn vừa thấy trạng thái ẩn h truyền từ trái sang phải — mỗi bước &quot;ghi nhớ&quot; thêm thông tin. Nhưng liệu RNN có nhớ được thông tin xa không? Hãy thử thách bên dưới...
        </p>
      </LessonSection>

      {/* ═══ Step 3: AHA MOMENT ═══ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>RNN</strong>{" "}
            có &quot;bộ nhớ&quot; — trạng thái ẩn h truyền qua mỗi bước, tích lũy ngữ cảnh. Cùng một bộ trọng số được dùng lại ở mọi bước thời gian — đây gọi là <strong>weight sharing theo thời gian</strong>.
          </p>
          <p className="text-sm text-muted mt-1">
            Giống bạn đọc sách: cùng một &quot;bộ não&quot; xử lý mỗi từ, nhưng ký ức (h) thay đổi theo từng trang.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ═══ Step 4: DEEPEN — Vanishing Gradient ═══ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Vấn đề Gradient biến mất">
        <VisualizationSection>
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Tại sao RNN &quot;quên&quot; thông tin xa?
          </h3>

          <div className="rounded-xl border border-border bg-background/50 p-4">
            <svg viewBox="0 0 500 80" className="w-full">
              {WORDS.map((word, i) => {
                const x = 18 + i * 80;
                const gradientStrength = Math.pow(0.6, WORDS.length - 1 - i);
                return (
                  <g key={i}>
                    <rect x={x} y={20} width={65} height={35} rx={8}
                      fill="#ef4444" opacity={gradientStrength * 0.4 + 0.05}
                      stroke="#ef4444" strokeWidth={1} />
                    <text x={x + 32} y={43} fontSize={10} fill="#ef4444"
                      textAnchor="middle" fontWeight={600}>
                      {word}
                    </text>
                    <text x={x + 32} y={70} fontSize={8} fill="#ef4444"
                      textAnchor="middle" opacity={0.7}>
                      {(gradientStrength * 100).toFixed(0)}%
                    </text>
                  </g>
                );
              })}
              <text x={250} y={15} fontSize={9} fill="currentColor" className="text-muted"
                textAnchor="middle">
                Gradient truyền ngược từ cuối (100%) → đầu (bị thu nhỏ dần)
              </text>
            </svg>
          </div>

          <Callout variant="warning" title="Vanishing Gradient Problem">
            <p>
              Khi backpropagation qua nhiều bước, gradient bị nhân lặp lại với trọng số nhỏ hơn 1. Sau 10-20 bước, gradient gần bằng 0 → lớp đầu không học được gì. Câu{" "}
              <strong>&quot;Tôi sinh ra ở Huế ... nên tôi thích ăn bún bò ___&quot;</strong>{" "}
              — RNN quên mất &quot;Huế&quot; khi đến &quot;___&quot;!
            </p>
          </Callout>

          <p className="text-sm text-muted mt-3">
            Đây là lý do LSTM và GRU ra đời — thêm &quot;cổng&quot; để kiểm soát luồng thông tin, giúp nhớ xa hơn. Và Transformer giải quyết triệt để bằng attention trực tiếp.
          </p>
        </VisualizationSection>
      </LessonSection>

      {/* ═══ Step 5: CHALLENGE ═══ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="RNN xử lý câu 6 từ cần 6 bước tuần tự. Transformer xử lý cùng câu đó cần mấy bước?"
          options={[
            "6 bước (giống RNN)",
            "1 bước (song song tất cả từ cùng lúc)",
            "12 bước (gấp đôi vì phức tạp hơn)",
          ]}
          correct={1}
          explanation="Transformer dùng self-attention xử lý tất cả từ cùng lúc trong 1 bước. RNN phải đợi h₁ xong mới tính h₂, đợi h₂ xong mới tính h₃... Đây là lý do chính Transformer nhanh hơn nhiều trên GPU."
        />
      </LessonSection>

      {/* ═══ Step 6: EXPLAIN ═══ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích chi tiết">
        <ExplanationSection>
          <p>
            <strong>RNN (Recurrent Neural Network)</strong>{" "}
            xử lý dữ liệu tuần tự bằng cách duy trì trạng thái ẩn (hidden state) qua mỗi bước thời gian. Công thức cốt lõi:
          </p>

          <LaTeX block>{String.raw`h_t = \tanh(W_{xh} \cdot x_t + W_{hh} \cdot h_{t-1} + b_h)`}</LaTeX>
          <LaTeX block>{String.raw`y_t = W_{hy} \cdot h_t + b_y`}</LaTeX>

          <p className="text-sm text-muted mt-2">
            <LaTeX>{"x_t"}</LaTeX>{" "}
            = input tại bước t,{" "}
            <LaTeX>{"h_t"}</LaTeX>{" "}
            = trạng thái ẩn,{" "}
            <LaTeX>{"y_t"}</LaTeX>{" "}
            = output. Cùng bộ trọng số{" "}
            <LaTeX>{"W_{xh}, W_{hh}, W_{hy}"}</LaTeX>{" "}
            dùng lại ở mọi bước.
          </p>

          <Callout variant="insight" title="Chia sẻ trọng số theo thời gian">
            <p>
              Giống CNN chia sẻ kernel ở mọi vị trí không gian, RNN chia sẻ trọng số ở mọi bước thời gian. Điều này cho phép RNN xử lý chuỗi bất kỳ độ dài nào (10 từ hay 1000 từ đều dùng cùng trọng số).
            </p>
          </Callout>

          <Callout variant="info" title="Các biến thể RNN">
            <p>
              <strong>Many-to-Many:</strong>{" "}
              dịch máy (chuỗi → chuỗi).{" "}
              <strong>Many-to-One:</strong>{" "}
              phân loại cảm xúc (chuỗi → 1 nhãn).{" "}
              <strong>One-to-Many:</strong>{" "}
              sinh nhạc (1 nốt khởi đầu → chuỗi nốt).{" "}
              <strong>Bidirectional:</strong>{" "}
              đọc cả 2 chiều (NER, dịch máy).
            </p>
          </Callout>

          <CodeBlock language="python" title="rnn_from_scratch.py">
{`import numpy as np

class SimpleRNN:
    def __init__(self, input_dim, hidden_dim, output_dim):
        # Trọng số chia sẻ qua mọi bước thời gian
        self.Wxh = np.random.randn(hidden_dim, input_dim) * 0.01
        self.Whh = np.random.randn(hidden_dim, hidden_dim) * 0.01
        self.Why = np.random.randn(output_dim, hidden_dim) * 0.01
        self.bh = np.zeros((hidden_dim, 1))
        self.by = np.zeros((output_dim, 1))

    def forward(self, inputs):
        """inputs: list of vectors, one per timestep"""
        h = np.zeros((self.Whh.shape[0], 1))  # h₀ = 0
        outputs = []
        for x in inputs:
            # Công thức RNN: h = tanh(Wxh·x + Whh·h + bh)
            h = np.tanh(self.Wxh @ x + self.Whh @ h + self.bh)
            y = self.Why @ h + self.by
            outputs.append(y)
        return outputs, h  # h cuối = "bộ nhớ" toàn bộ chuỗi

# Ví dụ: câu 6 từ, mỗi từ embed 50D, hidden 128D
rnn = SimpleRNN(input_dim=50, hidden_dim=128, output_dim=10)
# 6 bước tuần tự — không song song được!`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      {/* ═══ Step 7: SUMMARY ═══ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về RNN"
          points={[
            "RNN truyền trạng thái ẩn hₜ qua mỗi bước thời gian — tạo 'bộ nhớ' cho dữ liệu tuần tự.",
            "Cùng bộ trọng số (Wxh, Whh, Why) dùng lại ở mọi bước — xử lý chuỗi bất kỳ độ dài.",
            "Vấn đề vanishing gradient: khó nhớ thông tin xa → LSTM/GRU thêm cổng để khắc phục.",
            "Xử lý tuần tự (không song song) → chậm hơn Transformer trên GPU.",
            "Vẫn hữu ích cho streaming data, thiết bị edge, và là nền tảng lý thuyết cho LSTM/GRU/SSM.",
          ]}
        />
      </LessonSection>

      {/* ═══ Step 8: QUIZ ═══ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
