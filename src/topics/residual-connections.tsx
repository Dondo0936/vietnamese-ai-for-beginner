"use client";

import { useState } from "react";
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
  slug: "residual-connections",
  title: "Residual Connections",
  titleVi: "Kết nối tắt",
  description: "Đường tắt cho gradient đi qua, cho phép huấn luyện mạng rất sâu mà không bị gradient biến mất",
  category: "dl-architectures",
  tags: ["architecture", "training", "optimization"],
  difficulty: "intermediate",
  relatedSlugs: ["transformer", "cnn", "u-net"],
  vizType: "interactive",
};

/* ── Data ── */
const DEPTH_DATA = [
  { depth: 8, withSkip: 92, withoutSkip: 90 },
  { depth: 20, withSkip: 95, withoutSkip: 85 },
  { depth: 56, withSkip: 97, withoutSkip: 72 },
  { depth: 110, withSkip: 97.5, withoutSkip: 55 },
  { depth: 152, withSkip: 97.8, withoutSkip: 40 },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "output = F(x) + x. Nếu F(x) = 0 (lớp không học được gì), output = ?",
    options: [
      "0 — mất hết thông tin",
      "x — input truyền thẳng qua, không mất gì! Trường hợp xấu nhất = identity function",
      "Không xác định",
      "Phụ thuộc vào activation function",
    ],
    correct: 1,
    explanation: "Đây là insight cốt lõi! Khi F(x) = 0 → output = x. Thêm lớp residual không bao giờ làm XOẮN hơn. Trường hợp xấu nhất = giữ nguyên input. Mạng chỉ cần học phần \"thay đổi\" (residual) F(x) = H(x) - x.",
  },
  {
    question: "ResNet-152 có 152 lớp nhưng train tốt. Mạng 20 lớp không có skip connection thì sao?",
    options: [
      "Train tốt — 20 lớp không cần skip connection",
      "Vẫn ok nhưng chậm hơn",
      "Bắt đầu gặp vanishing gradient — gradient bị nhân nhỏ dần qua 20 lớp backprop",
    ],
    correct: 2,
    explanation: "Thực nghiệm (He et al., 2015): mạng 20 lớp không skip đã bắt đầu có performance kém hơn mạng 8 lớp! Degradation problem: sâu hơn ≠ tốt hơn (khi không có skip). ResNet-152 với skip connection vượt mọi mạng nông.",
  },
  {
    question: "Transformer dùng residual connection ở đâu? Pre-Norm vs Post-Norm khác gì?",
    options: [
      "Chỉ ở encoder, không ở decoder",
      "Quanh MỖI sub-layer (attention + FFN). Pre-Norm: LayerNorm trước (GPT), Post-Norm: LayerNorm sau (BERT gốc)",
      "Chỉ ở FFN, không ở attention",
      "Pre-Norm và Post-Norm giống nhau",
    ],
    correct: 1,
    explanation: "Mỗi lớp Transformer: x + Attention(x) và x + FFN(x). Pre-Norm (GPT, LLaMA): x + Attention(LN(x)) — dễ train hơn cho mạng sâu. Post-Norm (BERT gốc): LN(x + Attention(x)) — performance tốt hơn nhưng khó train.",
  },
];

/* ── Component ── */
export default function ResidualConnectionsTopic() {
  const [showGradient, setShowGradient] = useState(false);

  const TOTAL_STEPS = 8;
  const barMax = 100;

  return (
    <>
      {/* ═══ Step 1: HOOK ═══ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Mạng 20 lớp accuracy 90%. Bạn thêm thành 56 lớp, kỳ vọng accuracy tăng. Kết quả thực tế?"
          options={[
            "Accuracy tăng lên 95% — sâu hơn = tốt hơn",
            "Accuracy GIẢM xuống 72% — gradient biến mất qua nhiều lớp, mạng sâu train kém hơn mạng nông!",
            "Accuracy giữ nguyên 90%",
          ]}
          correct={1}
          explanation="Đây là \"degradation problem\" — mạng sâu hơn lại tệ hơn mạng nông, KHÔNG phải do overfitting (cả train accuracy cũng giảm). ResNet giải quyết bằng skip connection: output = F(x) + x. Gradient chảy thẳng qua đường tắt!"
        />
      </LessonSection>

      {/* ═══ Step 2: DISCOVER — Interactive Comparison ═══ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="text-sm text-foreground leading-relaxed mb-3">
          Hãy tưởng tượng bạn gửi tin nhắn qua dãy người truyền miệng. Qua mỗi người, tin nhắn bị méo mó thêm. Đến người thứ 10, tin nhắn gốc đã biến thành &quot;tam sao thất bản&quot;.{" "}
          <strong>Skip connection</strong>{" "}
          = gửi bản sao tin nhắn gốc trực tiếp cho người cuối!
        </p>

        <VisualizationSection>
          <p className="text-sm text-muted mb-3">
            So sánh mạng không có và có skip connection. Quan sát gradient chảy ngược.
          </p>

          <svg viewBox="0 0 500 310" className="w-full rounded-lg border border-border bg-background">
            {/* Left: Without skip */}
            <text x={120} y={22} fontSize={12} fill="#ef4444" textAnchor="middle" fontWeight={600}>
              Không có Skip Connection
            </text>

            {["Input x", "Layer 1", "Layer 2", "Output H(x)"].map((name, i) => {
              const y = 38 + i * 65;
              const gradStr = showGradient ? Math.pow(0.6, 3 - i) : 1;
              return (
                <g key={`no-skip-${i}`}>
                  <rect x={55} y={y} width={130} height={38} rx={10}
                    fill="#ef4444" opacity={0.08 + gradStr * 0.15}
                    stroke="#ef4444" strokeWidth={1.5} />
                  <text x={120} y={y + 24} fontSize={11} fill="#ef4444" textAnchor="middle"
                    fontWeight={500} opacity={0.5 + gradStr * 0.5}>
                    {name}
                  </text>
                  {showGradient && i > 0 && (
                    <text x={190} y={y + 24} fontSize={8} fill="#ef4444" opacity={0.7}>
                      grad: {(gradStr * 100).toFixed(0)}%
                    </text>
                  )}
                  {i < 3 && (
                    <>
                      <line x1={120} y1={y + 38} x2={120} y2={y + 65}
                        stroke="#ef4444" strokeWidth={1.5} opacity={0.5 + gradStr * 0.3} />
                      <polygon points={`120,${y + 63} 116,${y + 56} 124,${y + 56}`}
                        fill="#ef4444" opacity={0.5 + gradStr * 0.3} />
                    </>
                  )}
                </g>
              );
            })}
            <text x={120} y={300} fontSize={9} fill="#ef4444" textAnchor="middle">
              Gradient suy giảm qua mỗi lớp
            </text>

            {/* Right: With skip */}
            <text x={375} y={22} fontSize={12} fill="#22c55e" textAnchor="middle" fontWeight={600}>
              Có Skip Connection
            </text>

            {["Input x", "F(x)", "+ (Add)", "F(x) + x"].map((name, i) => {
              const y = 38 + i * 65;
              return (
                <g key={`skip-${i}`}>
                  <rect x={310} y={y} width={130} height={38} rx={10}
                    fill={i === 2 ? "#f59e0b" : "#22c55e"}
                    opacity={0.15}
                    stroke={i === 2 ? "#f59e0b" : "#22c55e"}
                    strokeWidth={i === 2 ? 2.5 : 1.5} />
                  <text x={375} y={y + 24} fontSize={11}
                    fill={i === 2 ? "#f59e0b" : "#22c55e"}
                    textAnchor="middle" fontWeight={i === 2 ? 700 : 500}>
                    {name}
                  </text>
                  {showGradient && i > 0 && (
                    <text x={445} y={y + 24} fontSize={8} fill="#22c55e" opacity={0.7}>
                      grad: 100%
                    </text>
                  )}
                  {i < 3 && i !== 2 && (
                    <>
                      <line x1={375} y1={y + 38} x2={375} y2={y + 65}
                        stroke="#22c55e" strokeWidth={1.5} />
                      <polygon points={`375,${y + 63} 371,${y + 56} 379,${y + 56}`} fill="#22c55e" />
                    </>
                  )}
                </g>
              );
            })}

            {/* Skip connection arrow */}
            <motion.path
              d="M 305,57 L 278,57 L 278,237 L 305,237"
              fill="none" stroke="#3b82f6" strokeWidth={3.5}
              strokeDasharray={showGradient ? "0" : "10 5"}
              animate={showGradient ? { strokeDashoffset: [0, -20] } : {}}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            />
            <polygon points="305,237 297,230 297,244" fill="#3b82f6" />
            <text x={264} y={152} fontSize={11} fill="#3b82f6" textAnchor="middle" fontWeight={700}
              transform="rotate(-90, 264, 152)">
              Skip (x) — gradient = 1
            </text>

            <line x1={375} y1={233} x2={375} y2={297}
              stroke="#22c55e" strokeWidth={1.5} />
            <polygon points="375,295 371,288 379,288" fill="#22c55e" />

            <text x={375} y={300} fontSize={9} fill="#22c55e" textAnchor="middle">
              Gradient chảy tắt, luôn = 1!
            </text>
          </svg>

          <button type="button" onClick={() => setShowGradient(!showGradient)}
            className="mt-4 rounded-lg border border-accent bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-white">
            {showGradient ? "Ẩn gradient flow" : "Hiện gradient flow"}
          </button>
        </VisualizationSection>

        <p className="text-sm text-muted mt-3">
          Bạn vừa thấy gradient bên trái suy giảm qua mỗi lớp, nhưng bên phải gradient chảy thẳng qua skip connection = luôn mạnh. Đây là lý do ResNet train được 152 lớp!
        </p>
      </LessonSection>

      {/* ═══ Step 3: AHA MOMENT ═══ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>output = F(x) + x</strong>. Mạng không cần học toàn bộ ánh xạ H(x), chỉ cần học{" "}
            <strong>phần dư</strong>{" "}
            F(x) = H(x) - x. Nếu lớp tối ưu là identity (không thay đổi gì), F(x) chỉ cần = 0. Dễ học 0 hơn identity rất nhiều!
          </p>
          <p className="text-sm text-muted mt-1">
            Gradient của x + F(x) theo x = 1 + dF/dx. Dù dF/dx nhỏ, gradient vẫn ít nhất = 1. Không vanishing!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ═══ Step 4: DEEPEN — Depth vs Accuracy ═══ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Độ sâu vs Accuracy">
        <VisualizationSection>
          <h3 className="text-sm font-semibold text-foreground mb-3">
            ImageNet accuracy theo độ sâu mạng
          </h3>

          <div className="space-y-3">
            {DEPTH_DATA.map((d, i) => (
              <div key={i} className="rounded-lg border border-border bg-background/50 p-3">
                <p className="text-xs text-muted mb-2 font-medium">{d.depth} lớp</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-400 w-20">Không skip:</span>
                    <div className="flex-1 h-4 rounded-full bg-surface overflow-hidden">
                      <motion.div className="h-full rounded-full bg-red-500/60"
                        initial={{ width: 0 }} animate={{ width: `${d.withoutSkip}%` }}
                        transition={{ duration: 0.5, delay: i * 0.1 }} />
                    </div>
                    <span className="text-xs text-red-400 w-10 text-right">{d.withoutSkip}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-400 w-20">Có skip:</span>
                    <div className="flex-1 h-4 rounded-full bg-surface overflow-hidden">
                      <motion.div className="h-full rounded-full bg-green-500/60"
                        initial={{ width: 0 }} animate={{ width: `${d.withSkip}%` }}
                        transition={{ duration: 0.5, delay: i * 0.1 }} />
                    </div>
                    <span className="text-xs text-green-400 w-10 text-right">{d.withSkip}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Callout variant="warning" title="Degradation Problem">
            <p>
              Không có skip: 8 lớp (90%) &gt; 56 lớp (72%) &gt; 152 lớp (40%). Sâu hơn = TỆ hơn!{" "}
              Có skip: 8 lớp (92%) &lt; 56 lớp (97%) &lt; 152 lớp (97.8%). Sâu hơn = TỐT hơn!
            </p>
          </Callout>
        </VisualizationSection>
      </LessonSection>

      {/* ═══ Step 5: CHALLENGE ═══ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Transformer có 2 residual connections mỗi lớp. Chúng bao quanh gì?"
          options={[
            "Chỉ bao quanh Attention — FFN không cần skip",
            "x + Attention(x) và x + FFN(x) — bao quanh CẢ Attention và FFN riêng biệt",
            "Chỉ 1 skip từ input đến output của toàn bộ lớp",
          ]}
          correct={1}
          explanation="Mỗi lớp Transformer: out₁ = x + MultiHeadAttention(x), out₂ = out₁ + FFN(out₁). Hai residual connections riêng biệt. Gradient chảy tắt qua cả hai → train được mạng 96+ lớp (GPT-3)."
        />
      </LessonSection>

      {/* ═══ Step 6: EXPLAIN ═══ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích chi tiết">
        <ExplanationSection>
          <p>
            <strong>Residual Connection</strong>{" "}
            (He et al., 2015) cộng input trực tiếp vào output: thay vì học H(x), mạng học phần dư F(x) = H(x) - x.
          </p>

          <LaTeX block>{String.raw`y = F(x, \{W_i\}) + x`}</LaTeX>

          <p className="mt-3">Gradient backpropagation:</p>
          <LaTeX block>{String.raw`\frac{\partial \mathcal{L}}{\partial x} = \frac{\partial \mathcal{L}}{\partial y} \cdot \left(1 + \frac{\partial F}{\partial x}\right)`}</LaTeX>

          <p className="text-sm text-muted mt-2">
            Gradient luôn có thành phần <strong>1</strong>{" "}
            (từ skip connection) + dF/dx (từ lớp). Dù dF/dx nhỏ → gradient vẫn ≥ 1 → không vanishing!
          </p>

          <Callout variant="insight" title="Pre-Norm vs Post-Norm">
            <p>
              <strong>Post-Norm</strong>{" "}
              (BERT gốc): y = LayerNorm(x + F(x)). Performance tốt nhưng khó train cho mạng rất sâu.{" "}
              <strong>Pre-Norm</strong>{" "}
              (GPT, LLaMA): y = x + F(LayerNorm(x)). Dễ train hơn vì gradient chảy thẳng qua skip không bị LayerNorm chặn.
            </p>
          </Callout>

          <CodeBlock language="python" title="residual_block.py">
{`import torch.nn as nn

class ResidualBlock(nn.Module):
    """Residual block cơ bản (Pre-Norm style)."""
    def __init__(self, d_model):
        super().__init__()
        self.norm = nn.LayerNorm(d_model)
        self.ffn = nn.Sequential(
            nn.Linear(d_model, d_model * 4),
            nn.GELU(),
            nn.Linear(d_model * 4, d_model),
        )

    def forward(self, x):
        # Skip connection: output = x + F(LN(x))
        return x + self.ffn(self.norm(x))
        # Nếu F(LN(x)) = 0 → output = x (identity)
        # Gradient: dL/dx = dL/dy * (1 + dF/dx)

class TransformerLayer(nn.Module):
    """Một lớp Transformer: 2 residual connections."""
    def __init__(self, d_model, n_heads):
        super().__init__()
        self.norm1 = nn.LayerNorm(d_model)
        self.attn = nn.MultiheadAttention(d_model, n_heads)
        self.norm2 = nn.LayerNorm(d_model)
        self.ffn = nn.Sequential(
            nn.Linear(d_model, d_model * 4),
            nn.GELU(),
            nn.Linear(d_model * 4, d_model),
        )

    def forward(self, x):
        # Residual 1: quanh attention
        x = x + self.attn(self.norm1(x), self.norm1(x), self.norm1(x))[0]
        # Residual 2: quanh FFN
        x = x + self.ffn(self.norm2(x))
        return x`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      {/* ═══ Step 7: SUMMARY ═══ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Residual Connections"
          points={[
            "output = F(x) + x: cộng input trực tiếp vào output. Mạng chỉ cần học phần dư F(x) = H(x) - x.",
            "Gradient = 1 + dF/dx → luôn mạnh → train được mạng 100+ lớp (ResNet-152, GPT-3 96 lớp).",
            "Trường hợp xấu nhất: F(x) = 0 → output = x (identity). Thêm lớp không bao giờ làm tệ hơn.",
            "Transformer dùng 2 residual mỗi lớp: quanh Attention và quanh FFN.",
            "Pre-Norm (GPT) dễ train, Post-Norm (BERT) performance tốt hơn nhẹ. Có mặt trong ResNet, Transformer, U-Net.",
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
