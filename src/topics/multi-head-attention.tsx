"use client";

import { useState, useCallback } from "react";
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
  slug: "multi-head-attention",
  title: "Multi-Head Attention",
  titleVi: "Chú ý đa đầu",
  description: "Chạy nhiều cơ chế attention song song, mỗi đầu học một kiểu quan hệ khác nhau",
  category: "dl-architectures",
  tags: ["attention", "transformer", "architecture"],
  difficulty: "advanced",
  relatedSlugs: ["self-attention", "transformer", "positional-encoding"],
  vizType: "interactive",
};

/* ── Data ── */
const TOKENS = ["Tôi", "yêu", "Việt", "Nam"];

const HEADS = [
  { name: "Đầu 1", desc: "Cú pháp (chủ-vị)", color: "#3b82f6",
    weights: [[0.1, 0.6, 0.2, 0.1], [0.5, 0.1, 0.2, 0.2], [0.1, 0.2, 0.3, 0.4], [0.1, 0.3, 0.4, 0.2]] },
  { name: "Đầu 2", desc: "Ngữ nghĩa (liên quan)", color: "#22c55e",
    weights: [[0.3, 0.2, 0.2, 0.3], [0.1, 0.1, 0.4, 0.4], [0.2, 0.3, 0.2, 0.3], [0.2, 0.3, 0.3, 0.2]] },
  { name: "Đầu 3", desc: "Vị trí (gần/xa)", color: "#f97316",
    weights: [[0.5, 0.3, 0.15, 0.05], [0.3, 0.4, 0.2, 0.1], [0.1, 0.2, 0.4, 0.3], [0.05, 0.1, 0.35, 0.5]] },
  { name: "Đầu 4", desc: "Tổ hợp từ", color: "#8b5cf6",
    weights: [[0.25, 0.25, 0.25, 0.25], [0.15, 0.15, 0.35, 0.35], [0.1, 0.1, 0.2, 0.6], [0.1, 0.1, 0.6, 0.2]] },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "d_model = 512, có 8 heads. Mỗi head có d_k bao nhiêu? Tổng tham số attention thay đổi thế nào?",
    options: [
      "d_k = 512 cho mỗi head → tổng tham số gấp 8×",
      "d_k = 512/8 = 64 cho mỗi head → tổng tham số gần như KHÔNG đổi",
      "d_k = 512 × 8 = 4096 → tham số tăng nhiều",
    ],
    correct: 1,
    explanation: "Mỗi head hoạt động trong subspace d_k = d_model/h = 64. 8 heads × 3 ma trận (Q,K,V) × (512×64) = 8 × 3 × 32K ≈ 786K. Single head: 3 × (512×512) = 786K. Gần bằng nhau! Multi-head không tốn thêm tham số.",
  },
  {
    question: "Tại sao dùng 8 heads nhỏ thay vì 1 head lớn, khi tổng tham số gần bằng nhau?",
    options: [
      "Vì 8 heads nhanh hơn 1 head",
      "Mỗi head học một kiểu quan hệ riêng (ngữ pháp, ngữ nghĩa, vị trí...) → phong phú hơn 1 head chỉ học 1 kiểu",
      "Vì 1 head không thể xử lý chuỗi dài",
      "Không có lợi ích — chỉ là convention",
    ],
    correct: 1,
    explanation: "Nghiên cứu cho thấy: Head 1 thường học cú pháp, Head 2 học đồng tham chiếu, Head 3 học vị trí gần... Một head lớn phải dùng chung không gian cho mọi kiểu quan hệ → kém đa dạng hơn.",
  },
  {
    question: "Sau khi concat 8 heads (mỗi head output d_v=64), output có kích thước gì? Rồi nhân với W^O để làm gì?",
    options: [
      "Concat: 8×64 = 512. W^O (512×512) trộn thông tin từ tất cả heads lại",
      "Concat: 64. W^O phóng to lên 512",
      "Concat: 4096. W^O giảm xuống 512",
    ],
    correct: 0,
    explanation: "Concat 8 heads: [head₁; head₂; ...; head₈] = 512 chiều (vì 8 × 64 = 512 = d_model). W^O (512×512) là ma trận 'trộn' cho model tự học cách kết hợp thông tin từ các heads khác nhau.",
  },
  {
    type: "fill-blank",
    question: "Với d_model = 512 và h = 8 heads, mỗi head hoạt động trong subspace kích thước d_k = {blank}. Output của h heads được ghép lại bằng phép {blank}, rồi nhân với ma trận chiếu {blank} để trả về d_model chiều.",
    blanks: [
      { answer: "64", accept: ["d_model/h", "512/8"] },
      { answer: "concat", accept: ["concatenate", "concatenation", "nối", "ghép"] },
      { answer: "W^O", accept: ["W_O", "WO", "W0", "output projection"] },
    ],
    explanation: "d_k = d_model / h = 512/8 = 64 cho mỗi head. Sau khi h heads hoàn thành, ta concat chúng (8×64 = 512) rồi nhân với W^O ∈ ℝ^{d_model × d_model} để trộn thông tin giữa các heads và đưa về đúng d_model chiều.",
  },
];

/* ── Component ── */
export default function MultiHeadAttentionTopic() {
  const [activeHead, setActiveHead] = useState(0);
  const [selectedToken, setSelectedToken] = useState(0);

  const head = HEADS[activeHead];
  const weights = head.weights[selectedToken];
  const TOTAL_STEPS = 8;

  return (
    <>
      {/* ═══ Step 1: HOOK ═══ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question={`Câu "Tôi yêu Việt Nam". Self-attention chỉ dùng 1 bộ trọng số Q, K, V. Nó có thể vừa nắm cú pháp ("Tôi" → chủ ngữ), vừa nắm ngữ nghĩa ("yêu" → "Việt Nam"), vừa nắm vị trí? Có cách nào tốt hơn?`}
          options={[
            "1 bộ attention là đủ — không cần thay đổi",
            "Chạy nhiều bộ attention song song, mỗi bộ chuyên 1 kiểu quan hệ",
            "Tăng kích thước Q, K, V để chứa hết thông tin",
          ]}
          correct={1}
          explanation="Multi-Head Attention chạy h bộ attention song song, mỗi bộ (head) có trọng số riêng → chuyên 1 kiểu quan hệ. Head 1 học cú pháp, Head 2 học ngữ nghĩa, Head 3 học vị trí... Rồi kết hợp tất cả!"
        />
      </LessonSection>

      {/* ═══ Step 2: DISCOVER — Interactive Heads ═══ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá các Head">
        <p className="text-sm text-foreground leading-relaxed mb-3">
          Hãy tưởng tượng bạn xem bóng đá trên TV. Camera 1 quay toàn cảnh (vị trí), Camera 2 zoom vào cầu thủ (chi tiết), Camera 3 quay khán đài (bối cảnh). Đạo diễn{" "}
          <strong>kết hợp</strong>{" "}
          tất cả → bạn hiểu trận đấu đầy đủ. Mỗi head attention = 1 camera!
        </p>

        <VisualizationSection topicSlug={metadata.slug}>
          <p className="text-sm text-muted mb-3">
            Chọn head và từ truy vấn. Quan sát cách mỗi head &quot;nhìn&quot; câu theo kiểu khác nhau.
          </p>

          {/* Head selector */}
          <div className="flex flex-wrap gap-2 mb-4">
            {HEADS.map((h, i) => (
              <button key={i} type="button" onClick={() => setActiveHead(i)}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                  i === activeHead
                    ? `border-[${h.color}] bg-opacity-15 text-white`
                    : "border-border bg-card text-foreground hover:bg-surface"
                }`}
                style={i === activeHead ? { borderColor: h.color, backgroundColor: h.color + "20", color: h.color } : undefined}>
                <span className="font-bold">{h.name}</span>
                <span className="block text-[10px] opacity-75">{h.desc}</span>
              </button>
            ))}
          </div>

          {/* Heatmap */}
          <svg viewBox="0 0 460 220" className="w-full rounded-lg border border-border bg-background">
            <text x={230} y={18} fontSize={11} fill={head.color} textAnchor="middle" fontWeight={600}>
              {head.name}: {head.desc}
            </text>

            {/* Column labels */}
            {TOKENS.map((t, i) => (
              <text key={`col-${i}`} x={155 + i * 70} y={40} fontSize={12} fill="currentColor"
                className="text-foreground" textAnchor="middle" fontWeight={400}>
                {t}
              </text>
            ))}

            {/* Rows */}
            {TOKENS.map((t, r) => (
              <g key={`row-${r}`}>
                <text x={115} y={72 + r * 40} fontSize={12}
                  fill={r === selectedToken ? head.color : "currentColor"}
                  className={r === selectedToken ? "" : "text-foreground"}
                  textAnchor="end" fontWeight={r === selectedToken ? 700 : 400}
                  cursor="pointer" onClick={() => setSelectedToken(r)}>
                  {t}
                </text>
                {head.weights[r].map((w, c) => {
                  const x = 125 + c * 70;
                  const y = 54 + r * 40;
                  const isRow = r === selectedToken;
                  return (
                    <g key={`cell-${r}-${c}`}>
                      <rect x={x} y={y} width={60} height={30} rx={6}
                        fill={head.color} opacity={w * 0.7 + 0.05}
                        stroke={isRow ? head.color : "transparent"} strokeWidth={isRow ? 1.5 : 0} />
                      <text x={x + 30} y={y + 20} fontSize={12} fill="#fff"
                        textAnchor="middle" fontWeight={600}>
                        {(w * 100).toFixed(0)}%
                      </text>
                    </g>
                  );
                })}
              </g>
            ))}

            {/* Concat → W^O */}
            <rect x={100} y={195} width={260} height={22} rx={6}
              fill="#ec4899" opacity={0.1} stroke="#ec4899" strokeWidth={1} />
            <text x={230} y={210} fontSize={11} fill="#ec4899" textAnchor="middle" fontWeight={600}>
              Concat(head&#x2081;, ..., head&#x2084;) &middot; W&#x1D52; &rarr; Output
            </text>
          </svg>
        </VisualizationSection>

        <p className="text-sm text-muted mt-3">
          Bạn vừa thấy mỗi head nhìn cùng câu nhưng theo &quot;góc&quot; khác nhau. Head 3 (vị trí) chú ý từ gần nhất, Head 2 (ngữ nghĩa) chú ý từ liên quan nghĩa — dù xa. Kết hợp tất cả → hiểu đầy đủ!
        </p>
      </LessonSection>

      {/* ═══ Step 3: AHA MOMENT ═══ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>Multi-Head Attention</strong>{" "}
            = chạy h bộ attention song song, mỗi bộ trong subspace d_k = d_model/h. Tổng tham số gần bằng single-head attention, nhưng mỗi head chuyên biệt 1 kiểu quan hệ → phong phú hơn rất nhiều!
          </p>
          <p className="text-sm text-muted mt-1">
            GPT-3 có 96 heads. Nghiên cứu cho thấy: bỏ 1 số heads, performance gần không đổi → mỗi head có &quot;chuyên môn&quot; riêng, hệ thống rất robust!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ═══ Step 4: DEEPEN — Architecture Detail ═══ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Chi tiết kiến trúc">
          <svg viewBox="0 0 480 180" className="w-full rounded-lg border border-border bg-background">
            <text x={240} y={18} fontSize={11} fill="currentColor" className="text-foreground"
              textAnchor="middle" fontWeight={600}>
              Multi-Head Attention Flow
            </text>

            {/* Input */}
            <rect x={10} y={70} width={60} height={35} rx={8} fill="#3b82f6" opacity={0.15}
              stroke="#3b82f6" strokeWidth={1.5} />
            <text x={40} y={92} fontSize={11} fill="#3b82f6" textAnchor="middle" fontWeight={600}>
              Input X
            </text>

            {/* Split into heads */}
            {HEADS.map((h, i) => {
              const y = 30 + i * 35;
              return (
                <g key={i}>
                  <line x1={72} y1={87} x2={100} y2={y + 15} stroke="#888" strokeWidth={1} />
                  <rect x={100} y={y} width={80} height={28} rx={6}
                    fill={h.color} opacity={0.15} stroke={h.color} strokeWidth={1} />
                  <text x={140} y={y + 18} fontSize={11} fill={h.color} textAnchor="middle" fontWeight={600}>
                    {h.name} (d_k=64)
                  </text>
                  <line x1={180} y1={y + 14} x2={210} y2={y + 14} stroke={h.color} strokeWidth={1} />
                  <rect x={210} y={y} width={65} height={28} rx={6}
                    fill={h.color} opacity={0.1} stroke={h.color} strokeWidth={0.5} />
                  <text x={242} y={y + 18} fontSize={11} fill={h.color} textAnchor="middle">
                    Attn(Q,K,V)
                  </text>
                  <line x1={275} y1={y + 14} x2={310} y2={87} stroke={h.color} strokeWidth={1} />
                </g>
              );
            })}

            {/* Concat */}
            <rect x={310} y={65} width={60} height={45} rx={8} fill="#ec4899" opacity={0.15}
              stroke="#ec4899" strokeWidth={1.5} />
            <text x={340} y={85} fontSize={11} fill="#ec4899" textAnchor="middle" fontWeight={600}>
              Concat
            </text>
            <text x={340} y={100} fontSize={11} fill="#ec4899" textAnchor="middle">
              (4×64=256)
            </text>

            {/* W^O */}
            <line x1={370} y1={87} x2={395} y2={87} stroke="#888" strokeWidth={1.5} />
            <rect x={395} y={70} width={70} height={35} rx={8} fill="#22c55e" opacity={0.15}
              stroke="#22c55e" strokeWidth={1.5} />
            <text x={430} y={85} fontSize={11} fill="#22c55e" textAnchor="middle" fontWeight={600}>
              W&#x1D52; (linear)
            </text>
            <text x={430} y={98} fontSize={11} fill="#22c55e" textAnchor="middle">
              256→512
            </text>

            {/* Bottom label */}
            <text x={240} y={170} fontSize={11} fill="currentColor" className="text-muted"
              textAnchor="middle">
              Tổng tham số ≈ single-head attention (vì d_k = d_model/h)
            </text>
          </svg>
      </LessonSection>

      {/* ═══ Step 5: CHALLENGE ═══ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="d_model = 768, heads = 12. Mỗi head có d_k = ? Tổng Q, K, V projection cho tất cả heads = ?"
          options={[
            "d_k = 64. Tổng = 12 × 3 × (768×64) = 12 × 3 × 49K ≈ 1,77M params",
            "d_k = 768. Tổng = 3 × (768×768) = 1,77M params",
            "d_k = 12. Tổng = 12 × 3 × (768×12) = 332K params",
          ]}
          correct={0}
          explanation="d_k = 768/12 = 64 cho mỗi head. Nhưng trong thực tế, 12 heads × (768×64) tương đương 1 head × (768×768) = 768² = 590K cho mỗi projection. Tổng QKV: 3 × 590K = 1,77M. Giống single-head!"
        />
      </LessonSection>

      {/* ═══ Step 6: EXPLAIN ═══ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích chi tiết">
        <ExplanationSection>
          <p>
            <strong>Multi-Head Attention</strong>{" "}
            chạy h phép{" "}
            <TopicLink slug="self-attention">self-attention</TopicLink>{" "}
            song song trong các subspace khác nhau, mỗi phép có bộ trọng số riêng. Đây là khối cốt lõi trong{" "}
            <TopicLink slug="transformer">Transformer</TopicLink>:
          </p>

          <LaTeX block>{String.raw`\text{MultiHead}(Q, K, V) = \text{Concat}(\text{head}_1, ..., \text{head}_h) \cdot W^O`}</LaTeX>
          <LaTeX block>{String.raw`\text{head}_i = \text{Attention}(QW_i^Q, KW_i^K, VW_i^V)`}</LaTeX>

          <p className="text-sm text-muted mt-2">
            <LaTeX>{String.raw`W_i^Q, W_i^K, W_i^V \in \mathbb{R}^{d_{model} \times d_k}`}</LaTeX>,{" "}
            <LaTeX>{String.raw`W^O \in \mathbb{R}^{hd_k \times d_{model}}`}</LaTeX>,{" "}
            <LaTeX>{String.raw`d_k = d_{model} / h`}</LaTeX>.
          </p>

          <Callout variant="insight" title="Tại sao hiệu quả như single-head?">
            <p>
              Single-head: <LaTeX>{String.raw`W^Q \in \mathbb{R}^{d \times d}`}</LaTeX> = d&sup2; tham số &times; 3 = 3d&sup2;.{" "}
              Multi-head h: mỗi head <LaTeX>{String.raw`W_i^Q \in \mathbb{R}^{d \times d/h}`}</LaTeX> = d&sup2;/h. Tổng h heads: h &times; d&sup2;/h = d&sup2; &times; 3 + W&deg; = 4d&sup2;. Gần bằng!
            </p>
          </Callout>

          <CodeBlock language="python" title="multi_head_attention.py">
{`import torch
import torch.nn as nn

class MultiHeadAttention(nn.Module):
    def __init__(self, d_model=512, n_heads=8):
        super().__init__()
        self.n_heads = n_heads
        self.d_k = d_model // n_heads  # 512/8 = 64

        # Q, K, V projections (gộp tất cả heads)
        self.W_q = nn.Linear(d_model, d_model)  # 512→512
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)
        self.W_o = nn.Linear(d_model, d_model)  # Output projection

    def forward(self, x):
        B, N, D = x.shape  # batch, seq_len, d_model

        # Project và split thành heads
        Q = self.W_q(x).view(B, N, self.n_heads, self.d_k).transpose(1, 2)
        K = self.W_k(x).view(B, N, self.n_heads, self.d_k).transpose(1, 2)
        V = self.W_v(x).view(B, N, self.n_heads, self.d_k).transpose(1, 2)
        # Shape: (B, n_heads, N, d_k)

        # Attention cho tất cả heads song song
        scores = Q @ K.transpose(-2, -1) / (self.d_k ** 0.5)
        weights = scores.softmax(dim=-1)
        attn = weights @ V  # (B, n_heads, N, d_k)

        # Concat heads và project
        out = attn.transpose(1, 2).reshape(B, N, D)
        return self.W_o(out)  # (B, N, d_model)`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      {/* ═══ Step 7: SUMMARY ═══ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Multi-Head Attention"
          points={[
            "Multi-Head = h bộ attention song song, mỗi bộ chuyên biệt 1 kiểu quan hệ (cú pháp, ngữ nghĩa, vị trí...).",
            "d_k = d_model/h: mỗi head nhỏ hơn nhưng tổng tham số gần bằng single-head attention.",
            "Concat h heads rồi nhân W^O → output d_model chiều. W^O trộn thông tin từ tất cả heads.",
            "GPT-3: 96 heads, BERT-base: 12 heads, GPT-4: 120+ heads. Nhiều heads = đa dạng kiểu quan hệ.",
            "Mỗi head hoạt động trong subspace riêng → ensemble of attention → robust và đa dạng.",
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
