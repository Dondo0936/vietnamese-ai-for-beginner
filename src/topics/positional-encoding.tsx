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
  slug: "positional-encoding",
  title: "Positional Encoding",
  titleVi: "Mã hóa vị trí",
  description: "Thêm thông tin vị trí vào embedding vì Transformer không có khái niệm thứ tự",
  category: "dl-architectures",
  tags: ["transformer", "fundamentals", "encoding"],
  difficulty: "intermediate",
  relatedSlugs: ["transformer", "self-attention", "multi-head-attention"],
  vizType: "interactive",
};

/* ── PE computation ── */
const POSITIONS = 8;
const DIMS = 8;

function pe(pos: number, dim: number, dModel: number): number {
  if (dim % 2 === 0) {
    return Math.sin(pos / Math.pow(10000, dim / dModel));
  }
  return Math.cos(pos / Math.pow(10000, (dim - 1) / dModel));
}

const quizQuestions: QuizQuestion[] = [
  {
    question: "Tại sao Transformer cần positional encoding? Self-attention không tự biết thứ tự sao?",
    options: [
      "Self-attention biết thứ tự qua Q, K, V",
      "Self-attention xử lý song song, coi mọi từ như tập hợp không thứ tự — \"mèo bắt chuột\" = \"chuột bắt mèo\"",
      "Chỉ cần cho chuỗi dài, chuỗi ngắn không cần",
      "Positional encoding chỉ dùng cho decoder, encoder không cần",
    ],
    correct: 1,
    explanation: "Self-attention tính attention(i,j) hoàn toàn dựa vào nội dung, không phân biệt vị trí. Nếu hoán vị input, output cũng hoán vị tương ứng (permutation equivariant). Positional encoding phá vỡ tính đối xứng này.",
  },
  {
    question: "Sinusoidal PE dùng nhiều tần số khác nhau. Tại sao?",
    options: [
      "Để ảnh hưởng mỗi chiều embedding khác nhau",
      "Tần số thấp phân biệt vị trí xa (\"đầu vs cuối\"), tần số cao phân biệt vị trí gần (\"từ 5 vs từ 6\")",
      "Để tương thích với FFT",
      "Không có lý do — chỉ là convention",
    ],
    correct: 1,
    explanation: "Giống hệ số nhị phân: bit thấp nhất thay đổi nhanh (phân biệt 0 vs 1), bit cao nhất thay đổi chậm (phân biệt 0 vs 128). Tần số thấp → pattern thay đổi chậm → phân biệt vị trí xa. Tần số cao → thay đổi nhanh → phân biệt vị trí gần.",
  },
  {
    question: "RoPE (Rotary Position Embedding) trong LLaMA khác sinusoidal PE thế nào?",
    options: [
      "RoPE thêm PE vào embedding (cộng), giống sinusoidal",
      "RoPE xoay Q và K vectors theo vị trí thay vì cộng — khoảng cách tương đối được mã hóa trực tiếp vào attention score",
      "RoPE dùng cosine thay vì sine",
      "RoPE không dùng cho attention, chỉ cho FFN",
    ],
    correct: 1,
    explanation: "Sinusoidal PE cộng vào embedding → thông tin vị trí pha loãng qua nhiều lớp. RoPE xoay Q và K → khi tính QK^T, góc xoay tương đối = khoảng cách vị trí. Thông tin vị trí tương đối được giữ chính xác trong attention score!",
  },
];

/* ── Component ── */
export default function PositionalEncodingTopic() {
  const [highlightDim, setHighlightDim] = useState<number | null>(null);
  const [highlightPos, setHighlightPos] = useState<number | null>(null);

  const peMatrix = useMemo(() => {
    return Array.from({ length: POSITIONS }, (_, pos) =>
      Array.from({ length: DIMS }, (_, d) => pe(pos, d, DIMS))
    );
  }, []);

  const TOTAL_STEPS = 8;

  return (
    <>
      {/* ═══ Step 1: HOOK ═══ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question={`"Mèo bắt chuột" và "Chuột bắt mèo" — nghĩa hoàn toàn khác! Nhưng Self-attention xử lý tất cả từ song song, không biết thứ tự. Nó sẽ cho 2 câu này output giống nhau. Làm sao sửa?`}
          options={[
            "Thêm số thứ tự vào mỗi embedding: 1, 2, 3, ...",
            "Thêm vector vị trí duy nhất cho mỗi vị trí (dùng sin/cos hoặc học được) — gọi là Positional Encoding",
            "Xử lý tuần tự như RNN thay vì song song",
          ]}
          correct={1}
          explanation={`Positional Encoding thêm "mã vạch" vị trí cho mỗi từ. Embedding("mèo" ở vị trí 0) ≠ Embedding("mèo" ở vị trí 2). Dùng sin/cos ở nhiều tần số — giống hệ nhị phân: bit thấp phân biệt gần, bit cao phân biệt xa.`}
        />
      </LessonSection>

      {/* ═══ Step 2: DISCOVER — Interactive PE Matrix ═══ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá ma trận PE">
        <p className="text-sm text-foreground leading-relaxed mb-3">
          Hãy tưởng tượng mỗi căn nhà trên phố có{" "}
          <strong>số nhà</strong>{" "}
          (positional encoding). Nhưng thay vì số đơn giản (1, 2, 3...), ta dùng hệ thống giống đồng hồ: kim giây quay nhanh (phân biệt nhà gần), kim giờ quay chậm (phân biệt đầu phố vs cuối phố).
        </p>

        <VisualizationSection>
          <p className="text-sm text-muted mb-3">
            Di chuột qua hàng (vị trí) hoặc cột (chiều) để highlight. Quan sát: cột trái thay đổi nhanh (tần số cao), cột phải thay đổi chậm (tần số thấp).
          </p>

          <svg viewBox="0 0 500 310" className="w-full rounded-lg border border-border bg-background">
            <text x={250} y={18} fontSize={11} fill="currentColor" className="text-foreground"
              textAnchor="middle" fontWeight={600}>
              Ma trận Positional Encoding (sin/cos)
            </text>

            {/* Column headers */}
            {Array.from({ length: DIMS }, (_, d) => (
              <g key={`col-${d}`}
                className="cursor-pointer"
                onMouseEnter={() => setHighlightDim(d)}
                onMouseLeave={() => setHighlightDim(null)}>
                <text x={120 + d * 45} y={38} fontSize={9} fill="#8b5cf6" textAnchor="middle"
                  fontWeight={highlightDim === d ? 700 : 400}>
                  d={d}
                </text>
                <text x={120 + d * 45} y={50} fontSize={7} fill="#8b5cf6" textAnchor="middle"
                  opacity={0.7}>
                  {d % 2 === 0 ? "sin" : "cos"}
                </text>
              </g>
            ))}

            {/* Rows */}
            {Array.from({ length: POSITIONS }, (_, pos) => (
              <g key={`row-${pos}`}
                className="cursor-pointer"
                onMouseEnter={() => setHighlightPos(pos)}
                onMouseLeave={() => setHighlightPos(null)}>
                <text x={70} y={74 + pos * 30} fontSize={10} fill="#3b82f6" textAnchor="end"
                  fontWeight={highlightPos === pos ? 700 : 400}>
                  pos={pos}
                </text>
                {Array.from({ length: DIMS }, (_, d) => {
                  const val = peMatrix[pos][d];
                  const normalized = (val + 1) / 2;
                  const isHighlight = highlightDim === d || highlightPos === pos;
                  return (
                    <g key={`cell-${pos}-${d}`}>
                      <rect x={98 + d * 45} y={58 + pos * 30} width={42} height={26} rx={4}
                        fill={`hsl(${260 - normalized * 200}, 70%, ${30 + normalized * 40}%)`}
                        opacity={isHighlight ? 0.6 : 0.3}
                        stroke={isHighlight ? "#fff" : "transparent"} strokeWidth={isHighlight ? 1.5 : 0} />
                      <text x={120 + d * 45} y={74 + pos * 30} fontSize={8}
                        fill="currentColor" className="text-foreground" textAnchor="middle"
                        fontWeight={isHighlight ? 600 : 400}>
                        {val.toFixed(2)}
                      </text>
                    </g>
                  );
                })}
              </g>
            ))}

            {/* Frequency annotation */}
            <line x1={98} y1={302} x2={460} y2={302} stroke="#f97316" strokeWidth={1} opacity={0.5} />
            <text x={140} y={298} fontSize={8} fill="#f97316" fontWeight={600}>
              Tần số cao ← (thay đổi nhanh)
            </text>
            <text x={400} y={298} fontSize={8} fill="#f97316" fontWeight={600} textAnchor="end">
              → Tần số thấp (thay đổi chậm)
            </text>
          </svg>
        </VisualizationSection>

        <p className="text-sm text-muted mt-3">
          Bạn vừa thấy pattern: cột đầu thay đổi liên tục (phân biệt từng vị trí), cột sau thay đổi chậm (phân biệt &quot;nhóm&quot; vị trí). Giống hệ nhị phân!
        </p>
      </LessonSection>

      {/* ═══ Step 3: AHA MOMENT ═══ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>Positional Encoding</strong>{" "}
            gắn &quot;mã vạch&quot; duy nhất cho mỗi vị trí bằng sin/cos ở nhiều tần số. Tần số cao → phân biệt vị trí gần. Tần số thấp → phân biệt vị trí xa. Giống hệ nhị phân: 0110 vs 0111 chỉ khác bit cuối!
          </p>
          <p className="text-sm text-muted mt-1">
            Cộng PE vào word embedding: <strong>input = embedding + PE</strong>. Từ &quot;mèo&quot; ở vị trí 0 sẽ có vector khác &quot;mèo&quot; ở vị trí 5.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ═══ Step 4: DEEPEN — Modern variants ═══ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Biến thể hiện đại">
        <VisualizationSection>
          <div className="space-y-3">
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
              <h4 className="text-sm font-semibold text-blue-500 mb-1">Sinusoidal PE (Transformer gốc, 2017)</h4>
              <p className="text-xs text-muted">
                Cộng sin/cos vào embedding. Cố định (không học). Ngoại suy được cho chuỗi dài hơn lúc train.
              </p>
            </div>
            <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4">
              <h4 className="text-sm font-semibold text-green-500 mb-1">Learned PE (BERT, GPT-2)</h4>
              <p className="text-xs text-muted">
                Embedding vị trí được học (lookup table). Linh hoạt hơn nhưng giới hạn chuỗi dài (max 512 tokens cho BERT).
              </p>
            </div>
            <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4">
              <h4 className="text-sm font-semibold text-purple-500 mb-1">RoPE (LLaMA, GPT-NeoX, 2021+)</h4>
              <p className="text-xs text-muted">
                Xoay Q, K vectors theo vị trí. Mã hóa khoảng cách tương đối trực tiếp vào attention score. Ngoại suy tốt hơn.
              </p>
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
              <h4 className="text-sm font-semibold text-amber-500 mb-1">ALiBi (BLOOM, 2022+)</h4>
              <p className="text-xs text-muted">
                Thêm bias tuyến tính vào attention score dựa trên khoảng cách. Rất đơn giản, ngoại suy xuất sắc.
              </p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ═══ Step 5: CHALLENGE ═══ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Train với max 2048 tokens. Test với 4096 tokens. Sinusoidal PE vs Learned PE — cái nào xử lý tốt hơn?"
          options={[
            "Learned PE — vì nó linh hoạt hơn",
            "Sinusoidal PE — vì sin/cos hoạt động với mọi vị trí, không cần học vị trí 2049-4096",
            "Cả hai đều thất bại hoàn toàn",
          ]}
          correct={1}
          explanation="Learned PE chỉ có embedding cho vị trí 0-2047 (đã học). Vị trí 2048+ → không có embedding → crash hoặc random. Sinusoidal PE dùng công thức → tính được PE cho bất kỳ vị trí nào. Nhưng thực tế, RoPE ngoại suy tốt nhất nhờ mã hóa khoảng cách tương đối."
        />
      </LessonSection>

      {/* ═══ Step 6: EXPLAIN ═══ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích chi tiết">
        <ExplanationSection>
          <p>
            <strong>Positional Encoding</strong>{" "}
            thêm thông tin vị trí vào word embedding vì self-attention không có khái niệm thứ tự (permutation equivariant).
          </p>

          <p className="mt-3 font-semibold text-foreground">Công thức sinusoidal:</p>
          <LaTeX block>{String.raw`PE_{(pos, 2i)} = \sin\!\left(\frac{pos}{10000^{2i/d_{model}}}\right)`}</LaTeX>
          <LaTeX block>{String.raw`PE_{(pos, 2i+1)} = \cos\!\left(\frac{pos}{10000^{2i/d_{model}}}\right)`}</LaTeX>

          <p className="text-sm text-muted mt-2">
            Bước sóng thay đổi từ <LaTeX>{"2\\pi"}</LaTeX> (chiều 0, tần số cao) đến <LaTeX>{"2\\pi \\cdot 10000"}</LaTeX> (chiều cuối, tần số thấp).
          </p>

          <Callout variant="insight" title="Tại sao sin/cos chứ không phải số thứ tự 1,2,3?">
            <p>
              (1) Giá trị luôn trong [-1, 1] → ổn định.{" "}
              (2) PE(pos+k) biểu diễn được bằng phép biến đổi tuyến tính của PE(pos) → model dễ học khoảng cách tương đối.{" "}
              (3) Mỗi vị trí có vector duy nhất.{" "}
              (4) Ngoại suy được cho chuỗi dài hơn lúc train.
            </p>
          </Callout>

          <CodeBlock language="python" title="positional_encoding.py">
{`import torch
import math

class SinusoidalPE(torch.nn.Module):
    def __init__(self, d_model, max_len=5000):
        super().__init__()
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len).unsqueeze(1).float()
        div_term = torch.exp(
            torch.arange(0, d_model, 2).float()
            * -(math.log(10000.0) / d_model)
        )
        pe[:, 0::2] = torch.sin(position * div_term)  # Chiều chẵn
        pe[:, 1::2] = torch.cos(position * div_term)  # Chiều lẻ
        self.register_buffer('pe', pe.unsqueeze(0))    # (1, max_len, d_model)

    def forward(self, x):
        # x: (batch, seq_len, d_model)
        return x + self.pe[:, :x.size(1)]  # Cộng PE vào embedding

# Sử dụng
pe = SinusoidalPE(d_model=512)
x = word_embedding(tokens)  # (batch, seq_len, 512)
x = pe(x)  # embedding + positional encoding`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      {/* ═══ Step 7: SUMMARY ═══ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Positional Encoding"
          points={[
            "Self-attention không biết thứ tự → cần PE để phân biệt \"mèo bắt chuột\" vs \"chuột bắt mèo\".",
            "Sinusoidal PE dùng sin/cos ở nhiều tần số: cao phân biệt gần, thấp phân biệt xa — giống hệ nhị phân.",
            "input = word_embedding + positional_encoding. PE được cộng trực tiếp vào embedding.",
            "Biến thể: Learned PE (BERT), RoPE (LLaMA — xoay Q,K theo vị trí), ALiBi (bias khoảng cách).",
            "RoPE phổ biến nhất hiện nay: mã hóa khoảng cách tương đối, ngoại suy tốt cho context dài.",
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
