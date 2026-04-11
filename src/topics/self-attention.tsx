"use client";

import { useState, useMemo, useCallback } from "react";
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
  slug: "self-attention",
  title: "Self-Attention",
  titleVi: "Tự chú ý",
  description: "Cơ chế cho phép mỗi vị trí trong chuỗi chú ý đến mọi vị trí khác",
  category: "dl-architectures",
  tags: ["attention", "transformer", "fundamentals"],
  difficulty: "intermediate",
  relatedSlugs: ["transformer", "multi-head-attention", "positional-encoding"],
  vizType: "interactive",
};

/* ── Data ── */
const TOKENS = ["Con", "mèo", "ngồi", "trên", "bàn"];
const T_COLORS = ["#3b82f6", "#8b5cf6", "#f97316", "#22c55e", "#ec4899"];

const ATTENTION: number[][] = [
  [0.40, 0.25, 0.15, 0.10, 0.10],
  [0.15, 0.35, 0.10, 0.10, 0.30],
  [0.10, 0.30, 0.25, 0.20, 0.15],
  [0.08, 0.12, 0.15, 0.35, 0.30],
  [0.05, 0.35, 0.10, 0.20, 0.30],
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Mỗi token tạo ra 3 vector: Q, K, V. Chúng có vai trò gì?",
    options: [
      "Q = input, K = output, V = hidden state",
      "Q = \"tôi hỏi gì?\", K = \"tôi chứa gì?\", V = \"nội dung của tôi\" — attention = softmax(QK^T/√d) × V",
      "Q = query SQL, K = primary key, V = value trong database",
      "Q, K, V chỉ là tên khác của embedding",
    ],
    correct: 1,
    explanation: "Query (hỏi): từ này đang tìm gì? Key (khóa): từ kia có gì phù hợp? Tích QK^T cho biết mức độ \"khớp\". Value (giá trị): nội dung thật sự mà từ kia cung cấp. Softmax chuẩn hóa thành xác suất → nhân với V → output có ngữ cảnh.",
  },
  {
    question: "Self-attention xử lý chuỗi n token. Độ phức tạp là gì? Tại sao?",
    options: [
      "O(n) — mỗi token chỉ tính 1 lần",
      "O(n²) — mỗi token phải tính attention với MỌI token khác",
      "O(n log n) — dùng thuật toán chia để trị",
      "O(1) — song song hoàn toàn",
    ],
    correct: 1,
    explanation: "Ma trận attention có kích thước n×n (mỗi token vs mỗi token). Chuỗi 1000 token → 1 triệu phép tính! Đây là lý do context window bị giới hạn, và Flash Attention, Sparse Attention ra đời để tối ưu.",
  },
  {
    question: "Tại sao chia cho √d trong công thức attention?",
    options: [
      "Để giảm kích thước output",
      "Để softmax không bị bão hòa — khi d lớn, tích QK^T có giá trị lớn → softmax gần one-hot → gradient gần 0",
      "Để tương thích với positional encoding",
      "Không có lý do — chỉ là convention",
    ],
    correct: 1,
    explanation: "Khi d_k = 512, tích vô hướng QK^T có thể lớn (~500). Softmax(500) ≈ [0, 0, 1, 0, 0] — gần one-hot → gradient cực nhỏ. Chia √512 ≈ 22.6 đưa giá trị về khoảng hợp lý → softmax mềm hơn → gradient tốt hơn.",
  },
];

/* ── Component ── */
export default function SelfAttentionTopic() {
  const [selectedToken, setSelectedToken] = useState(1);

  const weights = ATTENTION[selectedToken];
  const maxW = Math.max(...weights);

  const barData = useMemo(() => {
    return weights.map((w, i) => ({
      token: TOKENS[i],
      color: T_COLORS[i],
      weight: w,
      pct: maxW > 0 ? (w / maxW) * 100 : 0,
    }));
  }, [weights, maxW]);

  const TOTAL_STEPS = 8;

  return (
    <>
      {/* ═══ Step 1: HOOK ═══ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question={`Câu "Con mèo ngồi trên bàn". Khi xử lý từ "bàn", não bạn tự động chú ý nhiều nhất đến từ nào?`}
          options={["Con", "mèo", "ngồi", "trên"]}
          correct={1}
          explanation={`"Bàn" liên quan nhất đến "mèo" (mèo ngồi trên bàn) và "ngồi" (hành động liên quan bàn). Bạn vừa thực hiện "attention" — tìm từ liên quan nhất! Self-attention trong Transformer làm điều này tự động cho MỌI từ cùng lúc.`}
        />
      </LessonSection>

      {/* ═══ Step 2: DISCOVER — Interactive Attention ═══ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá Attention">
        <p className="text-sm text-foreground leading-relaxed mb-3">
          Hãy tưởng tượng bạn ở chợ Bến Thành. Mỗi quầy hàng{" "}
          <strong>&quot;hỏi&quot;</strong>{" "}
          (Query) tất cả quầy khác: &quot;Ai bán thứ liên quan đến tôi?&quot; Mỗi quầy &quot;đáp&quot; bằng{" "}
          <strong>Key</strong>{" "}
          (mô tả hàng hóa) và{" "}
          <strong>Value</strong>{" "}
          (hàng hóa thật). Quầy phở hỏi → quầy rau thơm đáp mạnh nhất!
        </p>

        <VisualizationSection>
          <p className="text-sm text-muted mb-3">
            Nhấn vào một từ để xem nó &quot;chú ý&quot; đến các từ khác bao nhiêu. Đường càng đậm = chú ý càng nhiều.
          </p>

          <svg viewBox="0 0 500 250" className="w-full rounded-lg border border-border bg-background">
            <text x={250} y={18} fontSize={11} fill="currentColor" className="text-foreground"
              textAnchor="middle" fontWeight={600}>
              &quot;{TOKENS[selectedToken]}&quot; chú ý đến từ nào?
            </text>

            {/* Query tokens row */}
            {TOKENS.map((token, i) => {
              const x = 55 + i * 90;
              const isSelected = i === selectedToken;
              return (
                <g key={`q-${i}`} className="cursor-pointer" onClick={() => setSelectedToken(i)}>
                  <motion.rect x={x - 32} y={30} width={64} height={30} rx={8}
                    fill={T_COLORS[i]} opacity={isSelected ? 0.35 : 0.1}
                    stroke={T_COLORS[i]} strokeWidth={isSelected ? 2.5 : 1}
                    animate={isSelected ? { scale: 1.05 } : { scale: 1 }} />
                  <text x={x} y={50} fontSize={13} fill={T_COLORS[i]} textAnchor="middle"
                    fontWeight={isSelected ? 700 : 400}>
                    {token}
                  </text>
                </g>
              );
            })}

            {/* Attention lines + bars */}
            {TOKENS.map((token, i) => {
              const x = 55 + i * 90;
              const qx = 55 + selectedToken * 90;
              const w = weights[i];
              const barH = w * 130;
              return (
                <g key={`bar-${i}`}>
                  <line x1={qx} y1={62} x2={x} y2={90}
                    stroke={T_COLORS[selectedToken]} strokeWidth={w * 8 + 0.5}
                    opacity={w * 1.2 + 0.1} />
                  <motion.rect x={x - 24} y={100 + (130 - barH)} width={48} height={barH} rx={6}
                    fill={T_COLORS[i]} opacity={0.2 + w * 0.5}
                    initial={{ height: 0 }} animate={{ height: barH }}
                    transition={{ duration: 0.3, ease: "easeOut" }} />
                  <text x={x} y={95 + (130 - barH)} fontSize={11} fill={T_COLORS[i]}
                    textAnchor="middle" fontWeight={600}>
                    {(w * 100).toFixed(0)}%
                  </text>
                  <text x={x} y={245} fontSize={12} fill="currentColor" className="text-foreground"
                    textAnchor="middle">{token}</text>
                </g>
              );
            })}
          </svg>

          {/* Weighted output */}
          <div className="mt-3 rounded-xl border border-border bg-background/50 p-4 space-y-2">
            <p className="text-sm font-semibold text-foreground">
              Output cho &quot;<span style={{ color: T_COLORS[selectedToken] }}>{TOKENS[selectedToken]}</span>&quot; — ngữ cảnh từ mỗi từ:
            </p>
            {barData.map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-10 text-right text-sm font-semibold shrink-0" style={{ color: d.color }}>
                  {d.token}
                </span>
                <div className="flex-1 h-5 rounded-full bg-surface overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ backgroundColor: d.color }}
                    initial={false} animate={{ width: `${d.pct}%` }}
                    transition={{ duration: 0.3 }} />
                </div>
                <span className="w-10 text-right text-xs text-muted">{(d.weight * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </VisualizationSection>

        <p className="text-sm text-muted mt-3">
          Bạn vừa thấy mỗi từ phân bổ &quot;sự chú ý&quot; khác nhau cho các từ xung quanh. Tổng luôn bằng 100% (softmax). Nhưng bằng cách nào máy tính &quot;attention score&quot; này?
        </p>
      </LessonSection>

      {/* ═══ Step 3: AHA MOMENT ═══ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>Self-attention</strong>{" "}
            = mỗi từ &quot;hỏi&quot; tất cả từ khác: &quot;Bạn quan trọng với tôi bao nhiêu?&quot; Câu trả lời (attention score) dùng để tổng hợp thông tin. Output của mỗi từ là trung bình có trọng số của MỌI từ!
          </p>
          <p className="text-sm text-muted mt-1">
            Khác RNN (chỉ nhìn từ trước đó), self-attention nhìn trực tiếp đến mọi từ trong câu — bất kể khoảng cách. &quot;Tôi&quot; ở đầu câu vẫn kết nối trực tiếp với &quot;tôi&quot; ở cuối câu!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ═══ Step 4: DEEPEN — Q, K, V ═══ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Query, Key, Value">
        <VisualizationSection>
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Cơ chế Q, K, V — Ba vector cho mỗi từ
          </h3>

          <div className="space-y-3">
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
              <h4 className="text-sm font-semibold text-blue-500 mb-1">Query (Q) — &quot;Tôi hỏi gì?&quot;</h4>
              <p className="text-xs text-muted">
                Mỗi từ tạo Q vector mô tả nó đang &quot;tìm kiếm&quot; gì. Ví dụ: &quot;bàn&quot; tạo Q có nghĩa &quot;vật/hành động liên quan đến đồ nội thất&quot;.
              </p>
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
              <h4 className="text-sm font-semibold text-amber-500 mb-1">Key (K) — &quot;Tôi chứa gì?&quot;</h4>
              <p className="text-xs text-muted">
                Mỗi từ tạo K vector mô tả &quot;danh tính&quot; của nó. &quot;mèo&quot; tạo K có nghĩa &quot;động vật, có thể ngồi trên đồ vật&quot;.
              </p>
            </div>
            <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4">
              <h4 className="text-sm font-semibold text-green-500 mb-1">Value (V) — &quot;Nội dung của tôi&quot;</h4>
              <p className="text-xs text-muted">
                Nội dung thật sự mà từ cung cấp cho output. Khi &quot;bàn&quot; attention mạnh đến &quot;mèo&quot;, nó nhận V của &quot;mèo&quot; (thông tin về con mèo).
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-border bg-background/50 p-4">
            <p className="text-sm text-foreground font-medium mb-2">Quy trình tính attention:</p>
            <ol className="text-xs text-muted space-y-1 list-decimal list-inside">
              <li>Mỗi từ tạo Q, K, V bằng phép nhân ma trận: Q = xW_Q, K = xW_K, V = xW_V</li>
              <li>Tính score: Q của từ i nhân với K của từ j → score(i,j) = Q_i &middot; K_j</li>
              <li>Chia cho &radic;d_k để ổn định gradient</li>
              <li>Softmax → attention weights (tổng = 1)</li>
              <li>Nhân weights với V → output = tổng có trọng số của các V</li>
            </ol>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ═══ Step 5: CHALLENGE ═══ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Chuỗi 4096 tokens. Ma trận attention có bao nhiêu phần tử? Đây là vấn đề gì?"
          options={[
            "4096 phần tử — mỗi token 1 score",
            "4096² = ~16,7 triệu phần tử — tốn bộ nhớ O(n²), giới hạn context window",
            "4096 × 3 = 12.288 phần tử — Q, K, V cho mỗi token",
          ]}
          correct={1}
          explanation="Ma trận attention n×n: 4096² = 16,7 triệu phần tử, mỗi cái là float32 (4 bytes) = ~67MB chỉ cho 1 lớp. GPT-4 có 120+ lớp → hàng GB! Đây là lý do context window bị giới hạn, và Flash Attention ra đời để tối ưu."
        />
      </LessonSection>

      {/* ═══ Step 6: EXPLAIN ═══ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích chi tiết">
        <ExplanationSection>
          <p>
            <strong>Self-Attention</strong>{" "}
            (Scaled Dot-Product Attention) cho phép mỗi vị trí trong chuỗi kết nối trực tiếp với mọi vị trí khác, tính toán mức độ &quot;liên quan&quot; rồi tổng hợp thông tin.
          </p>

          <LaTeX block>{String.raw`\text{Attention}(Q, K, V) = \text{softmax}\!\left(\frac{QK^T}{\sqrt{d_k}}\right) V`}</LaTeX>

          <p className="text-sm text-muted mt-2">
            Q, K, V &isin; <LaTeX>{String.raw`\mathbb{R}^{n \times d_k}`}</LaTeX>. Ma trận attention{" "}
            <LaTeX>{String.raw`\in \mathbb{R}^{n \times n}`}</LaTeX> — mỗi ô (i,j) = mức chú ý của token i đến token j.
          </p>

          <Callout variant="insight" title="Tại sao chia √d_k?">
            <p>
              Khi <LaTeX>{"d_k"}</LaTeX> lớn (ví dụ 512), tích vô hướng <LaTeX>{"QK^T"}</LaTeX> có phương sai lớn (~d_k). Giá trị lớn → softmax bão hòa → gradient gần 0. Chia <LaTeX>{String.raw`\sqrt{d_k}`}</LaTeX> đưa phương sai về 1 → softmax mềm hơn → gradient tốt hơn.
            </p>
          </Callout>

          <Callout variant="info" title="Self-attention vs Cross-attention">
            <p>
              <strong>Self-attention:</strong>{" "}
              Q, K, V đều từ cùng 1 chuỗi (mỗi từ nhìn các từ khác trong cùng câu).{" "}
              <strong>Cross-attention:</strong>{" "}
              Q từ chuỗi A, K và V từ chuỗi B (decoder nhìn vào encoder output trong dịch máy).
            </p>
          </Callout>

          <CodeBlock language="python" title="self_attention.py">
{`import numpy as np

def self_attention(X, Wq, Wk, Wv):
    """
    X:  (n_tokens, d_model) — embedding input
    Wq, Wk, Wv: (d_model, d_k) — projection matrices
    """
    Q = X @ Wq  # (n, d_k) — mỗi token hỏi gì?
    K = X @ Wk  # (n, d_k) — mỗi token chứa gì?
    V = X @ Wv  # (n, d_k) — nội dung mỗi token

    d_k = K.shape[-1]
    scores = Q @ K.T / np.sqrt(d_k)   # (n, n) — attention scores
    weights = softmax(scores, axis=-1) # (n, n) — chuẩn hóa
    output = weights @ V               # (n, d_k) — tổng có trọng số

    return output  # Mỗi token giờ chứa ngữ cảnh từ mọi token khác!

# Ví dụ: câu 5 từ, d_model=512, d_k=64
# scores: 5×5 = 25 phép tính
# Câu 4096 từ: 4096×4096 = 16,7 triệu phép tính!`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      {/* ═══ Step 7: SUMMARY ═══ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Self-Attention"
          points={[
            "Mỗi token tạo 3 vector: Query (hỏi gì?), Key (chứa gì?), Value (nội dung). Score = QK^T/√d_k → softmax → nhân V.",
            "Mỗi token kết nối trực tiếp với MỌI token khác — nắm bắt quan hệ xa O(1) thay vì O(n) như RNN.",
            "Xử lý song song hoàn toàn (không tuần tự) → tận dụng tối đa GPU.",
            "Nhược điểm: O(n²) bộ nhớ và tính toán — giới hạn context window. Flash Attention, Sparse Attention giúp khắc phục.",
            "Là trái tim của Transformer — có trong GPT, BERT, LLaMA, Claude, và mọi LLM hiện đại.",
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
