"use client";

import { useState, useMemo } from "react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
  TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "vanishing-exploding-gradients",
  title: "Vanishing & Exploding Gradients",
  titleVi: "Gradient triệt tiêu & bùng nổ",
  description:
    "Hai vấn đề khiến việc huấn luyện mạng sâu trở nên khó khăn khi gradient quá nhỏ hoặc quá lớn.",
  category: "neural-fundamentals",
  tags: ["training", "deep-learning", "gradient"],
  difficulty: "intermediate",
  relatedSlugs: [
    "backpropagation",
    "activation-functions",
    "batch-normalization",
    "weight-initialization",
  ],
  vizType: "interactive",
};

/* ---------- helpers ---------- */
const NUM_LAYERS = 10;
const SVG_W = 520;
const SVG_H = 280;
const PAD = 45;

/* ---------- main component ---------- */
export default function VanishingExplodingGradientsTopic() {
  const [multiplier, setMultiplier] = useState(1.0);

  // Compute gradient magnitude at each layer (backward direction)
  const gradients = useMemo(() => {
    const grads: number[] = [];
    let g = 1.0;
    for (let i = 0; i < NUM_LAYERS; i++) {
      grads.push(g);
      g *= multiplier;
    }
    return grads.reverse(); // backward: gradient flows from output to input
  }, [multiplier]);

  const maxGrad = Math.max(...gradients.map(Math.abs), 0.01);

  // Status
  const status = useMemo(() => {
    if (multiplier < 0.6)
      return {
        text: "Gradient triệt tiêu! Các lớp đầu gần như không nhận được tín hiệu để học.",
        color: "#3b82f6",
      };
    if (multiplier <= 1.2)
      return {
        text: "Gradient ổn định — tất cả các lớp đều nhận được tín hiệu đủ mạnh để học.",
        color: "#22c55e",
      };
    return {
      text: "Gradient bùng nổ! Giá trị tăng theo cấp số nhân, có thể gây NaN.",
      color: "#ef4444",
    };
  }, [multiplier]);

  // Bar chart dimensions
  const barW = 36;
  const gap = 10;
  const startX =
    (SVG_W - NUM_LAYERS * (barW + gap) + gap) / 2;
  const barMaxH = SVG_H - 80;

  /* Quiz */
  const quizQuestions: QuizQuestion[] = [
    {
      question:
        "Tại sao ReLU giảm vấn đề vanishing gradient so với sigmoid?",
      options: [
        "ReLU có khoảng giá trị lớn hơn sigmoid",
        "Đạo hàm ReLU = 1 ở vùng dương (không thu nhỏ gradient), trong khi đạo hàm sigmoid tối đa chỉ 0.25",
        "ReLU chạy nhanh hơn nên gradient không kịp biến mất",
        "ReLU không có vùng bão hòa",
      ],
      correct: 1,
      explanation:
        "Đạo hàm sigmoid max = 0.25 → qua 10 lớp: 0.25^10 ≈ 0.000001! ReLU: đạo hàm = 1 khi x>0 → gradient truyền nguyên vẹn. Đây là lý do ReLU thay thế sigmoid ở lớp ẩn.",
    },
    {
      question:
        "Gradient clipping giải quyết vấn đề nào?",
      options: [
        "Vanishing gradient",
        "Exploding gradient — cắt gradient không cho vượt ngưỡng",
        "Cả vanishing và exploding",
        "Overfitting",
      ],
      correct: 1,
      explanation:
        "Gradient clipping giới hạn norm của gradient (ví dụ max_norm=1.0). Nếu ||g|| > 1.0, thu nhỏ g về 1.0. Chỉ chống exploding — vanishing cần giải pháp khác (ReLU, skip connections).",
    },
    {
      question:
        "ResNet (Residual Network) dùng kỹ thuật gì để huấn luyện mạng 152 lớp?",
      options: [
        "Dùng learning rate cực nhỏ",
        "Skip connections — cho gradient 'đi tắt' qua các lớp, tránh triệt tiêu",
        "Không dùng hàm kích hoạt",
        "Huấn luyện từng lớp riêng lẻ",
      ],
      correct: 1,
      explanation:
        "Skip connection: output = F(x) + x. Gradient luôn có đường đi trực tiếp qua '+x', không bị nhân nhỏ đi. Đây là đột phá cho phép mạng sâu hàng trăm lớp.",
    },
    {
      type: "fill-blank",
      question:
        "Trong mạng {blank} (deep networks), gradient lan truyền ngược qua nhiều lớp bằng {blank} rule — tích N hệ số nhỏ hơn 1 sẽ triệt tiêu về 0.",
      blanks: [
        { answer: "sâu", accept: ["deep"] },
        { answer: "chain", accept: ["dây chuyền"] },
      ],
      explanation:
        "Mạng sâu (deep networks) có nhiều lớp → backpropagation dùng chain rule (quy tắc dây chuyền) nhân đạo hàm qua từng lớp. Nếu mỗi hệ số < 1, tích sẽ tiến về 0 (vanishing); nếu > 1, tích bùng nổ về vô cực.",
    },
  ];

  return (
    <>
      {/* ===== STEP 1: PREDICTION GATE ===== */}
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Trò chơi 'truyền tin' qua 10 người: mỗi người thì thầm lại cho người kế tiếp. Nếu mỗi người chỉ nghe được 50% rồi truyền lại, người thứ 10 nghe được bao nhiêu % tin gốc?"
          options={[
            "50% — chỉ giảm 1 lần",
            "Khoảng 0.1% — giảm theo cấp số nhân (0.5^10)",
            "5% — giảm dần đều",
            "0% — mất hoàn toàn sau 3-4 người",
          ]}
          correct={1}
          explanation="0.5^10 ≈ 0.001 = 0.1%! Đây chính là vanishing gradient: qua 10 lớp với hệ số < 1, gradient gần như biến mất. Lớp đầu không nhận được tín hiệu lỗi!"
        >
          <p className="mt-4 text-sm text-muted leading-relaxed">
            Trong backpropagation, gradient phải đi qua nhiều phép nhân liên tiếp.
            Nếu hệ số nhân nhỏ hơn 1 → triệt tiêu, lớn hơn 1 → bùng nổ. Hãy{" "}
            <strong className="text-foreground">kéo thanh trượt</strong>{" "}
            để thấy gradient thay đổi theo cấp số nhân qua 10 lớp.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ===== STEP 2: GRADIENT FLOW VISUALIZATION ===== */}
      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-4">
            {/* Multiplier slider */}
            <div className="space-y-2 max-w-lg mx-auto">
              <label className="text-sm font-medium text-muted">
                Hệ số gradient tại mỗi lớp:{" "}
                <strong className="text-foreground">
                  {multiplier.toFixed(2)}
                </strong>
              </label>
              <input
                type="range"
                min="0.2"
                max="2.0"
                step="0.05"
                value={multiplier}
                onChange={(e) =>
                  setMultiplier(parseFloat(e.target.value))
                }
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-xs text-muted">
                <span>0.2 (Triệt tiêu)</span>
                <span>1.0 (Ổn định)</span>
                <span>2.0 (Bùng nổ)</span>
              </div>
            </div>

            {/* Status */}
            <div
              className="rounded-lg p-3 text-center text-sm font-medium"
              style={{
                color: status.color,
                backgroundColor: `${status.color}15`,
                border: `1px solid ${status.color}40`,
              }}
            >
              {status.text}
            </div>

            {/* Bar chart */}
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              className="w-full max-w-xl mx-auto"
            >
              <text
                x={SVG_W / 2}
                y={18}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="11"
              >
                Biên độ gradient tại mỗi lớp (lan truyền ngược ←)
              </text>

              {/* Zero line */}
              <line
                x1={startX - 5}
                y1={SVG_H - 50}
                x2={startX + NUM_LAYERS * (barW + gap)}
                y2={SVG_H - 50}
                stroke="#334155"
                strokeWidth="1"
              />

              {/* Bars */}
              {gradients.map((g, i) => {
                const x = startX + i * (barW + gap);
                const normG = Math.min(Math.abs(g) / maxGrad, 1);
                const h = normG * barMaxH;
                const y = SVG_H - 50 - h;
                const isVanished = Math.abs(g) < 0.01;

                return (
                  <g key={`grad-${i}`}>
                    <rect
                      x={x}
                      y={y}
                      width={barW}
                      height={Math.max(2, h)}
                      rx={4}
                      fill={
                        isVanished
                          ? "#334155"
                          : status.color
                      }
                      opacity={isVanished ? 0.3 : 0.8}
                    />
                    <text
                      x={x + barW / 2}
                      y={SVG_H - 33}
                      textAnchor="middle"
                      fill="#64748b"
                      fontSize="11"
                    >
                      Lớp {i + 1}
                    </text>
                    <text
                      x={x + barW / 2}
                      y={y - 5}
                      textAnchor="middle"
                      fill="#e2e8f0"
                      fontSize="11"
                    >
                      {Math.abs(g) < 0.001
                        ? "~0"
                        : Math.abs(g) > 1000
                          ? g.toExponential(1)
                          : g.toFixed(3)}
                    </text>
                  </g>
                );
              })}

              {/* Direction arrow */}
              <line
                x1={SVG_W - 30}
                y1={SVG_H - 15}
                x2={40}
                y2={SVG_H - 15}
                stroke="#475569"
                strokeWidth="1.5"
              />
              <polygon
                points={`40,${SVG_H - 18} 40,${SVG_H - 12} 32,${SVG_H - 15}`}
                fill="#475569"
              />
              <text
                x={SVG_W / 2}
                y={SVG_H - 5}
                textAnchor="middle"
                fill="#475569"
                fontSize="11"
              >
                ← Hướng lan truyền ngược gradient (backward)
              </text>
            </svg>

            {/* Exponential formula */}
            <div className="text-center text-sm text-muted">
              Gradient lớp 1 ={" "}
              <strong className="text-foreground">
                {multiplier.toFixed(2)}
              </strong>
              <sup>{NUM_LAYERS - 1}</sup> ={" "}
              <strong
                style={{ color: status.color }}
              >
                {gradients[0] < 0.001
                  ? "~0 (triệt tiêu)"
                  : gradients[0] > 1000
                    ? `${gradients[0].toExponential(1)} (bùng nổ!)`
                    : gradients[0].toFixed(4)}
              </strong>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ===== STEP 3: AHA MOMENT ===== */}
      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Gradient đi qua N lớp = nhân N hệ số liên tiếp. Nếu hệ số = 0.5 →{" "}
            <LaTeX>{"0.5^{10} \\approx 0.001"}</LaTeX> (triệt tiêu). Nếu = 2.0 →{" "}
            <LaTeX>{"2^{10} = 1024"}</LaTeX> (bùng nổ). Đây là lý do mạng sâu 100+ lớp
            cần ReLU,{" "}
            <TopicLink slug="batch-normalization">BatchNorm</TopicLink>, và{" "}
            <TopicLink slug="residual-connections">skip connections</TopicLink>!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ===== STEP 4: INLINE CHALLENGE ===== */}
      <LessonSection step={4} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Đạo hàm sigmoid tối đa = 0.25. Qua 20 lớp sigmoid, gradient còn bao nhiêu % so với ban đầu?"
          options={[
            "25% — chỉ giảm 1 lần",
            "0.25^20 ≈ 9.1 × 10⁻¹³ — gần bằng 0, mạng KHÔNG THỂ HỌC",
            "5% — giảm dần tuyến tính",
          ]}
          correct={1}
          explanation="0.25^20 ≈ 10^-12! Gradient nhỏ hơn 1 phần nghìn tỷ. Lớp đầu hoàn toàn không cập nhật được. Đây là lý do sigmoid bị thay bằng ReLU (đạo hàm = 1 ở vùng dương)."
        />
      </LessonSection>

      {/* ===== STEP 5: SOLUTIONS ===== */}
      <LessonSection step={5} totalSteps={8} label="Giải pháp">
        <ExplanationSection>
          <p>
            Khi gradient đi qua N lớp trong{" "}
            <TopicLink slug="backpropagation">backpropagation</TopicLink>, theo chain rule:
          </p>
          <LaTeX block>
            {"\\frac{\\partial L}{\\partial w_1} = \\frac{\\partial L}{\\partial a_N} \\cdot \\prod_{i=1}^{N} \\frac{\\partial a_i}{\\partial a_{i-1}}"}
          </LaTeX>
          <p>
            Nếu mỗi <LaTeX>{"\\frac{\\partial a_i}{\\partial a_{i-1}} < 1"}</LaTeX> →
            tích tiến về 0 (vanishing). Nếu &gt; 1 → tích tiến về ∞ (exploding).
          </p>

          <p>
            <strong>5 giải pháp chính:</strong>
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-semibold text-foreground">
                    Giải pháp
                  </th>
                  <th className="text-left py-2 pr-3 font-semibold text-foreground">
                    Chống
                  </th>
                  <th className="text-left py-2 font-semibold text-foreground">
                    Cơ chế
                  </th>
                </tr>
              </thead>
              <tbody className="text-foreground/80">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">ReLU</td>
                  <td className="py-2 pr-3">Vanishing</td>
                  <td className="py-2">
                    Đạo hàm = 1 ở vùng dương, không thu nhỏ gradient
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">BatchNorm</td>
                  <td className="py-2 pr-3">Cả hai</td>
                  <td className="py-2">
                    Chuẩn hóa phân phối, giữ gradient trong khoảng ổn định
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">
                    Skip Connections
                  </td>
                  <td className="py-2 pr-3">Vanishing</td>
                  <td className="py-2">
                    y = F(x) + x → gradient luôn có đường đi qua &quot;+x&quot;
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">
                    Gradient Clipping
                  </td>
                  <td className="py-2 pr-3">Exploding</td>
                  <td className="py-2">
                    Cắt gradient không cho vượt ngưỡng (max_norm)
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-medium">
                    <TopicLink slug="weight-initialization">He/Xavier Init</TopicLink>
                  </td>
                  <td className="py-2 pr-3">Cả hai</td>
                  <td className="py-2">
                    Khởi tạo trọng số giữ phương sai ổn định qua các lớp
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <CodeBlock language="python" title="gradient_solutions.py">
{`import torch
import torch.nn as nn

# 1. ReLU thay sigmoid ở lớp ẩn
model = nn.Sequential(
    nn.Linear(256, 256), nn.ReLU(),  # đạo hàm = 1
    nn.Linear(256, 256), nn.ReLU(),
    # ...100 lớp
)

# 2. He initialization cho ReLU
for m in model.modules():
    if isinstance(m, nn.Linear):
        nn.init.kaiming_normal_(m.weight, nonlinearity='relu')

# 3. Gradient clipping (chống exploding)
optimizer.zero_grad()
loss.backward()
torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
optimizer.step()

# 4. Skip connection (ResNet block)
class ResBlock(nn.Module):
    def __init__(self, dim):
        super().__init__()
        self.layers = nn.Sequential(
            nn.Linear(dim, dim), nn.ReLU(),
            nn.Linear(dim, dim),
        )
    def forward(self, x):
        return x + self.layers(x)  # gradient đi qua "+x" không triệt tiêu`}
          </CodeBlock>

          <Callout variant="insight" title="Skip connection là đột phá lớn nhất">
            ResNet (2015) cho thấy skip connection cho phép huấn luyện mạng 152 lớp — trước đó
            chỉ 20-30 lớp là giới hạn. Transformer cũng dùng skip connections ở mọi lớp attention.
            Nếu chỉ nhớ một giải pháp: <strong>skip connections + ReLU + BatchNorm</strong>.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ===== STEP 6: CHALLENGE 2 ===== */}
      <LessonSection step={6} totalSteps={8} label="Thử thách nâng cao">
        <InlineChallenge
          question="Loss đột ngột trở thành NaN ở epoch 50. Nguyên nhân có thể nhất là gì?"
          options={[
            "Underfitting — mô hình quá đơn giản",
            "Exploding gradient → trọng số tràn số → NaN. Thử gradient clipping hoặc giảm learning rate",
            "Bug trong code forward pass",
          ]}
          correct={1}
          explanation="NaN thường do exploding gradient: gradient cực lớn → trọng số cực lớn → tính toán tràn float32. Gradient clipping (max_norm=1.0) và giảm LR là first aid."
        />
      </LessonSection>

      {/* ===== STEP 7: MINI SUMMARY ===== */}
      <LessonSection step={7} totalSteps={8} label="Tóm tắt">
        <MiniSummary
          title="Vanishing & Exploding Gradients — Điểm chốt"
          points={[
            "Gradient qua N lớp = tích N hệ số. Hệ số < 1 → triệt tiêu (0.5^10 ≈ 0.001). Hệ số > 1 → bùng nổ (2^10 = 1024).",
            "Sigmoid/Tanh có đạo hàm ≤ 0.25 → nguyên nhân chính gây vanishing. ReLU (đạo hàm = 1) giải quyết.",
            "Skip connections (ResNet) cho gradient đi tắt qua '+x' — đột phá cho mạng sâu 100+ lớp.",
            "Gradient clipping cắt norm gradient tối đa — first aid cho exploding gradient.",
            "Combo: ReLU + BatchNorm + He Init + Skip Connections = mạng sâu ổn định.",
          ]}
        />
      </LessonSection>

      {/* ===== STEP 8: QUIZ ===== */}
      <LessonSection step={8} totalSteps={8} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
