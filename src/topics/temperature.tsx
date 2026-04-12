"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Thermometer } from "lucide-react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
  SliderGroup,
  SplitView,
  LessonSection,
  TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "temperature",
  title: "Temperature",
  titleVi: "Temperature — Nhiệt độ sinh văn bản",
  description:
    "Tham số kiểm soát mức độ ngẫu nhiên khi mô hình chọn từ tiếp theo — ảnh hưởng đến sự sáng tạo và chính xác.",
  category: "llm-concepts",
  tags: ["temperature", "sampling", "llm", "generation"],
  difficulty: "beginner",
  relatedSlugs: ["top-k-top-p", "hallucination", "prompt-engineering"],
  vizType: "interactive",
};

// ─── Toán: softmax với temperature ───
const WORDS = ["phở", "cơm", "bún", "bánh mì", "xôi"];
const BASE_LOGITS = [3.5, 2.8, 2.0, 1.5, 0.8]; // raw logits trước softmax

function softmaxWithTemp(logits: number[], temp: number): number[] {
  if (temp <= 0.01) {
    const maxIdx = logits.indexOf(Math.max(...logits));
    return logits.map((_, i) => (i === maxIdx ? 1 : 0));
  }
  const scaled = logits.map(l => l / temp);
  const maxScaled = Math.max(...scaled);
  const exps = scaled.map(l => Math.exp(l - maxScaled));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

// ─── Demo sinh câu ───
const SENTENCE_START = "Sáng nay tôi ăn";
const GENERATIONS: Record<string, string[]> = {
  low: [
    "Sáng nay tôi ăn phở bò. Nước dùng nóng hổi, thơm mùi quế.",
    "Sáng nay tôi ăn phở gà. Gà luộc mềm, nước trong vắt.",
    "Sáng nay tôi ăn phở bò tái. Quán quen đầu ngõ, như mọi ngày.",
  ],
  medium: [
    "Sáng nay tôi ăn cơm tấm sườn bì chả. Miếng sườn nướng vàng ươm trên than hồng.",
    "Sáng nay tôi ăn bún chả Hà Nội. Thịt nướng thơm lừng quyện nước mắm chua ngọt.",
    "Sáng nay tôi ăn bánh cuốn Thanh Trì. Lá bánh mỏng tang, nhân thịt vừa miệng.",
  ],
  high: [
    "Sáng nay tôi ăn sương sớm trên đồi chè. Giọt sương tan trên lưỡi như trà ướp hương nhài.",
    "Sáng nay tôi ăn một bản nhạc — nốt do rải trên lát bánh mì nướng vàng giòn.",
    "Sáng nay tôi ăn ánh nắng xuyên qua rèm cửa. Chén cháo trắng sáng như trăng rằm.",
  ],
};

const COLORS = ["#0D9488", "#2563EB", "#7C3AED", "#D97706", "#DC2626"];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Temperature = 0 có nghĩa là gì?",
    options: [
      "AI không hoạt động",
      "AI luôn chọn từ có xác suất cao nhất — output cố định, không ngẫu nhiên",
      "AI sinh văn bản nhanh hơn",
      "AI trả lời bằng tiếng Anh",
    ],
    correct: 1,
    explanation: "Temperature = 0 khiến softmax trở thành argmax: luôn chọn từ xác suất cao nhất. Cùng input → cùng output mỗi lần.",
  },
  {
    question: "Khi nào nên dùng temperature cao (0.8–1.5)?",
    options: [
      "Viết code",
      "Trả lời câu hỏi khoa học",
      "Sáng tác thơ, viết quảng cáo sáng tạo",
      "Trích xuất dữ liệu từ bảng",
    ],
    correct: 2,
    explanation: "Temperature cao tăng tính ngẫu nhiên → sáng tạo hơn nhưng cũng dễ sai hơn. Phù hợp cho brainstorming, sáng tác, không phù hợp cho task cần chính xác.",
  },
  {
    question: "Temperature ảnh hưởng đến phần nào của LLM?",
    options: [
      "Kích thước model (số tham số)",
      "Phân phối xác suất khi chọn từ tiếp theo (softmax)",
      "Tốc độ xử lý",
      "Context window",
    ],
    correct: 1,
    explanation: "Temperature chia logits trước khi đưa vào softmax: P(w) = softmax(logit/T). T cao → phân phối phẳng hơn. T thấp → phân phối nhọn hơn.",
  },
  {
    type: "code",
    question:
      "Điền vào đoạn softmax có temperature: chia logits cho T rồi đưa vào softmax.",
    codeTemplate:
      "import numpy as np\n# Softmax với temperature\nscaled = logits / ___\nexps = np.exp(scaled - scaled.max())\nprobs = exps / exps.___()",
    language: "python",
    blanks: [
      { answer: "T", accept: ["temperature", "temp", "t"] },
      { answer: "sum", accept: [] },
    ],
    explanation:
      "Softmax với temperature: P(w_i) = exp(z_i / T) / sum(exp(z_j / T)). Chia logits cho T trước khi áp dụng softmax — T > 1 làm phân phối phẳng hơn (ngẫu nhiên), T < 1 làm nhọn hơn (deterministic).",
  },
];

export default function TemperatureTopic() {
  const [temp, setTemp] = useState(1.0);
  const [genMode, setGenMode] = useState<"low" | "medium" | "high">("medium");
  const [genIdx, setGenIdx] = useState(0);

  const probs = useMemo(() => softmaxWithTemp(BASE_LOGITS, temp), [temp]);

  const tempLabel = temp <= 0.3 ? "Rất thấp — luôn chọn từ an toàn nhất"
    : temp <= 0.7 ? "Thấp — ít ngẫu nhiên, khá ổn định"
    : temp <= 1.0 ? "Mặc định — cân bằng sáng tạo và ổn định"
    : temp <= 1.5 ? "Cao — nhiều ngẫu nhiên, sáng tạo hơn"
    : "Rất cao — gần như ngẫu nhiên, có thể vô nghĩa";

  const regenerate = useCallback(() => {
    const key = temp <= 0.3 ? "low" : temp <= 1.0 ? "medium" : "high";
    setGenMode(key);
    setGenIdx(i => (i + 1) % 3);
  }, [temp]);

  return (
    <>
      {/* ━━━ HOOK ━━━ */}
      <LessonSection step={1} totalSteps={7} label="Thử đoán">
      <PredictionGate
        question="Bạn yêu cầu AI hoàn thành câu: 'Sáng nay tôi ăn ___'. Chạy 3 lần — nhưng AI trả lời khác nhau mỗi lần! Tại sao cùng câu hỏi mà kết quả khác nhau?"
        options={[
          "AI bị lỗi",
          "AI dùng một tham số 'ngẫu nhiên' gọi là temperature để thay đổi kết quả",
          "AI tìm kiếm trên Internet mỗi lần",
          "AI quên câu trả lời trước đó",
        ]}
        correct={1}
        explanation="Chính xác! Temperature là tham số điều chỉnh mức độ 'ngẫu nhiên' khi AI chọn từ tiếp theo. Temperature thấp → luôn chọn 'phở' (an toàn). Temperature cao → có thể chọn 'xôi', 'bánh mì', hay thậm chí 'ánh nắng' (sáng tạo bất ngờ)!"
      >
        <p className="text-sm text-muted mt-4">
          Hãy tự mình kéo thanh temperature và xem xác suất chọn từ thay đổi trực tiếp.
        </p>
      </PredictionGate>

      </LessonSection>

{/* ━━━ KHÁM PHÁ — Biểu đồ xác suất trực tiếp ━━━ */}
      <LessonSection step={2} totalSteps={7} label="Khám phá">
      <VisualizationSection>
        <h3 className="text-base font-semibold text-foreground mb-1">
          Xác suất chọn từ tiếp theo
        </h3>
        <p className="text-sm text-muted mb-2">
          Câu: &quot;{SENTENCE_START}{" "}___&quot; — kéo temperature để thấy xác suất thay đổi.
        </p>

        {/* Biểu đồ thanh */}
        <svg viewBox="0 0 500 220" className="w-full max-w-lg mx-auto mb-2">
          {/* Nền */}
          <line x1={60} y1={180} x2={460} y2={180} stroke="var(--border)" strokeWidth={1} />

          {WORDS.map((word, i) => {
            const barWidth = 60;
            const gap = 20;
            const x = 80 + i * (barWidth + gap);
            const maxHeight = 150;
            const height = probs[i] * maxHeight;
            const y = 180 - height;

            return (
              <g key={word}>
                <motion.rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={height}
                  rx={4}
                  fill={COLORS[i]}
                  initial={false}
                  animate={{ y, height }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
                {/* Phần trăm */}
                <motion.text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  fill="var(--text-primary)"
                  initial={false}
                  animate={{ y: y - 6 }}
                >
                  {(probs[i] * 100).toFixed(1)}%
                </motion.text>
                {/* Tên từ */}
                <text
                  x={x + barWidth / 2}
                  y={198}
                  textAnchor="middle"
                  fontSize={12}
                  fill="var(--text-secondary)"
                >
                  {word}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Thanh temperature */}
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Thermometer size={16} className="text-accent" />
              <span className="text-sm font-medium text-foreground">Temperature</span>
            </div>
            <span className="text-sm font-bold text-accent">{temp.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={2}
            step={0.05}
            value={temp}
            onChange={e => setTemp(parseFloat(e.target.value))}
            className="w-full h-2 rounded-full appearance-none bg-surface accent-accent cursor-pointer"
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-tertiary">0 (cố định)</span>
            <span className="text-[10px] text-tertiary">1 (mặc định)</span>
            <span className="text-[10px] text-tertiary">2 (rất ngẫu nhiên)</span>
          </div>
          <p className="text-xs text-muted mt-2 text-center italic">
            {tempLabel}
          </p>
        </div>
      </VisualizationSection>

      </LessonSection>

{/* ━━━ AHA MOMENT ━━━ */}
      <LessonSection step={3} totalSteps={7} label="Khám phá">
      <AhaMoment>
        Temperature kiểm soát <strong>độ nhọn</strong>{" "}của phân phối xác suất.
        Thấp → phân phối nhọn, luôn chọn từ xác suất cao nhất.
        Cao → phân phối phẳng, mọi từ đều có cơ hội — sáng tạo nhưng rủi ro hơn.
      </AhaMoment>

      </LessonSection>

{/* ━━━ ĐI SÂU — So sánh output thực tế ━━━ */}
      <LessonSection step={4} totalSteps={7} label="Đi sâu">
      <VisualizationSection>
        <h3 className="text-base font-semibold text-foreground mb-3">
          Output thực tế ở 3 mức temperature
        </h3>

        <SplitView
          leftLabel="Temperature = 0.2 (An toàn)"
          rightLabel="Temperature = 1.5 (Sáng tạo)"
          left={
            <div className="space-y-2">
              {GENERATIONS.low.map((gen, i) => (
                <p key={i} className="text-xs text-foreground/80 leading-relaxed border-b border-border pb-2 last:border-0">
                  {gen}
                </p>
              ))}
              <p className="text-[10px] text-tertiary italic">
                3 lần chạy → gần như giống nhau (luôn chọn &quot;phở&quot;)
              </p>
            </div>
          }
          right={
            <div className="space-y-2">
              {GENERATIONS.high.map((gen, i) => (
                <p key={i} className="text-xs text-foreground/80 leading-relaxed border-b border-border pb-2 last:border-0">
                  {gen}
                </p>
              ))}
              <p className="text-[10px] text-tertiary italic">
                3 lần chạy → rất khác nhau, sáng tạo nhưng có thể vô nghĩa
              </p>
            </div>
          }
        />
      </VisualizationSection>

      </LessonSection>

{/* ━━━ THỬ THÁCH ━━━ */}
      <LessonSection step={5} totalSteps={7} label="Thử thách">
      <InlineChallenge
        question="Bạn muốn AI viết code Python chính xác. Nên đặt temperature bao nhiêu?"
        options={[
          "Temperature = 1.5 (sáng tạo tối đa)",
          "Temperature = 0–0.2 (chính xác, ít ngẫu nhiên)",
          "Temperature = 1.0 (mặc định)",
          "Không quan trọng, temperature không ảnh hưởng code",
        ]}
        correct={1}
        explanation="Code cần chính xác, không cần sáng tạo. Temperature thấp (0–0.2) giúp AI chọn token có xác suất cao nhất, giảm lỗi. Đó là lý do Cursor và GitHub Copilot thường dùng temperature rất thấp."
      />

      </LessonSection>

{/* ━━━ GIẢI THÍCH ━━━ */}
      <LessonSection step={6} totalSteps={7} label="Giải thích">
      <ExplanationSection>
        <p>
          <strong>Temperature</strong>{" "}là tham số chia logits (điểm thô) trước khi đưa
          vào hàm softmax để tạo phân phối xác suất. Nó thường đi kèm với{" "}
          <TopicLink slug="top-k-top-p">top-k / top-p sampling</TopicLink>
          {" "}để kiểm soát độ đa dạng output, và là một công cụ quan trọng trong{" "}
          <TopicLink slug="prompt-engineering">prompt engineering</TopicLink>
          {" "}để cân bằng giữa sáng tạo và chính xác.
        </p>

        <Callout variant="insight" title="Công thức">
          <LaTeX block>{"P(w_i) = \\frac{e^{z_i / T}}{\\sum_j e^{z_j / T}}"}</LaTeX>
          <p className="text-sm mt-2">
            Trong đó <LaTeX>{"z_i"}</LaTeX>{" "}là logit (điểm thô) của từ <LaTeX>{"w_i"}</LaTeX>,
            và <LaTeX>{"T"}</LaTeX>{" "}là temperature.
          </p>
        </Callout>

        <p><strong>Hướng dẫn chọn temperature:</strong></p>
        <div className="overflow-x-auto my-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-muted font-medium">Temperature</th>
                <th className="text-left py-2 pr-4 text-muted font-medium">Đặc điểm</th>
                <th className="text-left py-2 text-muted font-medium">Dùng khi</th>
              </tr>
            </thead>
            <tbody className="text-foreground/80">
              <tr className="border-b border-border">
                <td className="py-2 pr-4 font-medium">0 – 0.3</td>
                <td className="py-2 pr-4">Cố định, chính xác</td>
                <td className="py-2">Code, data extraction, phân loại</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-4 font-medium">0.4 – 0.8</td>
                <td className="py-2 pr-4">Cân bằng</td>
                <td className="py-2">Viết email, tóm tắt, Q&A</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-4 font-medium">0.9 – 1.5</td>
                <td className="py-2 pr-4">Sáng tạo, đa dạng</td>
                <td className="py-2">Thơ, quảng cáo, brainstorm</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium">&gt; 1.5</td>
                <td className="py-2 pr-4">Gần ngẫu nhiên</td>
                <td className="py-2">Thường không hữu ích — output vô nghĩa</td>
              </tr>
            </tbody>
          </table>
        </div>

        <CodeBlock language="python" title="temperature_demo.py">{`from anthropic import Anthropic
client = Anthropic()

# Temperature thấp — chính xác, ổn định
precise = client.messages.create(
    model="claude-sonnet-4-20250514",
    temperature=0.1,  # Rất thấp
    max_tokens=50,
    messages=[{"role": "user", "content": "2 + 2 = ?"}]
)

# Temperature cao — sáng tạo, đa dạng
creative = client.messages.create(
    model="claude-sonnet-4-20250514",
    temperature=1.2,  # Cao
    max_tokens=50,
    messages=[{"role": "user", "content": "Viết 1 câu thơ về Hà Nội"}]
)`}</CodeBlock>
      </ExplanationSection>

      </LessonSection>

{/* ━━━ TÓM TẮT ━━━ */}
      <LessonSection step={7} totalSteps={7} label="Tổng kết">
      <MiniSummary
        points={[
          "Temperature chia logits trước softmax: T thấp → phân phối nhọn (chính xác), T cao → phẳng (sáng tạo)",
          "T = 0: luôn chọn từ xác suất cao nhất → output cố định, dùng cho code và data",
          "T = 0.5–0.8: cân bằng, dùng cho email, tóm tắt, hỏi đáp",
          "T > 1.0: nhiều ngẫu nhiên, dùng cho sáng tác, brainstorm — nhưng tăng nguy cơ hallucination",
        ]}
      />

      {/* ━━━ KIỂM TRA ━━━ */}
      <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
