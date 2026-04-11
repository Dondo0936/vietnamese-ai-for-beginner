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
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "batch-normalization",
  title: "Batch Normalization",
  titleVi: "Chuẩn hóa theo lô",
  description:
    "Kỹ thuật chuẩn hóa đầu vào mỗi lớp để ổn định và tăng tốc quá trình huấn luyện.",
  category: "neural-fundamentals",
  tags: ["training", "techniques", "normalization"],
  difficulty: "intermediate",
  relatedSlugs: ["mlp", "vanishing-exploding-gradients", "regularization"],
  vizType: "interactive",
};

/* ---------- helpers ---------- */
const SVG_W = 500;
const SVG_H = 220;

// Seeded random for consistent values
function seededRand(seed: number): number {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function generateBatch(size: number, mean: number, std: number, seed: number): number[] {
  const vals: number[] = [];
  for (let i = 0; i < size; i++) {
    const u1 = Math.max(0.001, seededRand(seed + i * 2));
    const u2 = seededRand(seed + i * 2 + 1);
    const normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    vals.push(mean + std * normal);
  }
  return vals;
}

/* ---------- main component ---------- */
export default function BatchNormalizationTopic() {
  const [batchMean, setBatchMean] = useState(8.0);
  const [batchStd, setBatchStd] = useState(5.0);
  const [gamma, setGamma] = useState(1.0);
  const [beta, setBeta] = useState(0.0);
  const [step, setStep] = useState(0); // 0=before, 1=normalized, 2=scale+shift

  const batchSize = 12;

  // Generate batch data
  const rawValues = useMemo(
    () => generateBatch(batchSize, batchMean, batchStd, 42),
    [batchMean, batchStd]
  );

  // Normalize
  const stats = useMemo(() => {
    const mu = rawValues.reduce((s, v) => s + v, 0) / rawValues.length;
    const variance =
      rawValues.reduce((s, v) => s + (v - mu) ** 2, 0) / rawValues.length;
    return { mu, variance, sigma: Math.sqrt(variance + 1e-5) };
  }, [rawValues]);

  const normalized = useMemo(
    () => rawValues.map((v) => (v - stats.mu) / stats.sigma),
    [rawValues, stats]
  );

  const scaled = useMemo(
    () => normalized.map((v) => v * gamma + beta),
    [normalized, gamma, beta]
  );

  // Which values to show based on step
  const displayValues = step === 0 ? rawValues : step === 1 ? normalized : scaled;
  const displayLabel =
    step === 0
      ? "Trước chuẩn hóa"
      : step === 1
        ? "Sau chuẩn hóa (μ≈0, σ≈1)"
        : `Sau scale (γ=${gamma.toFixed(1)}) & shift (β=${beta.toFixed(1)})`;

  // Bar chart helpers
  const maxAbs = useMemo(() => {
    return Math.max(...displayValues.map(Math.abs), 1) * 1.2;
  }, [displayValues]);

  const barW = 28;
  const gap = 6;
  const PAD = 40;
  const midY = SVG_H / 2 + 10;
  const barMaxH = (SVG_H - 60) / 2;

  // Display stats
  const displayMu = displayValues.reduce((s, v) => s + v, 0) / displayValues.length;
  const displayVar =
    displayValues.reduce((s, v) => s + (v - displayMu) ** 2, 0) / displayValues.length;

  /* Quiz */
  const quizQuestions: QuizQuestion[] = [
    {
      question: "Batch Normalization khi inference dùng gì thay cho batch statistics?",
      options: [
        "Tính trên batch hiện tại giống lúc train",
        "Running mean và running variance tích lũy từ quá trình huấn luyện",
        "Mean = 0, variance = 1 cố định",
        "Không dùng gì — BN tắt khi inference",
      ],
      correct: 1,
      explanation:
        "Khi inference, batch có thể chỉ 1 mẫu — không thể tính mean/variance. Nên BN dùng running statistics (exponential moving average) từ lúc train. model.eval() tự chuyển.",
    },
    {
      question: "Tại sao BatchNorm có tham số γ (scale) và β (shift) học được?",
      options: [
        "Để mạng tự quyết định có cần chuẩn hóa hay không — nếu γ=σ, β=μ thì BN triệt tiêu",
        "Chỉ để tăng số tham số cho mạng mạnh hơn",
        "Để thay thế learning rate",
        "γ và β là cố định, không học được",
      ],
      correct: 0,
      explanation:
        "Nếu chuẩn hóa về (0,1) là tối ưu, mạng sẽ học γ=1, β=0. Nhưng nếu phân phối khác tốt hơn, mạng có thể 'undo' BN bằng cách học γ=σ_cũ, β=μ_cũ. Tối đa linh hoạt!",
    },
    {
      question:
        "Layer Normalization (LN) chuẩn hóa theo chiều nào? Và tại sao Transformer dùng LN thay vì BN?",
      options: [
        "LN chuẩn hóa theo batch — giống BN nhưng tên khác",
        "LN chuẩn hóa theo features của TỪNG mẫu — không phụ thuộc batch size, phù hợp cho sequence có độ dài khác nhau",
        "LN không chuẩn hóa — chỉ scale và shift",
        "Transformer dùng cả BN và LN",
      ],
      correct: 1,
      explanation:
        "LN chuẩn hóa theo features, không phụ thuộc batch → hoạt động tốt với batch_size=1 và sequence length khác nhau. BN phụ thuộc batch nên không phù hợp cho Transformer/RNN.",
    },
  ];

  return (
    <>
      {/* ===== STEP 1: PREDICTION GATE ===== */}
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Lớp 1 cho điểm thang 100, lớp 2 cho thang 10, lớp 3 dùng chữ A-F. Muốn so sánh điểm công bằng, bạn cần làm gì?"
          options={[
            "So sánh trực tiếp — điểm là điểm",
            "Quy tất cả về cùng một thang (trung bình 0, độ lệch 1) rồi mới so sánh",
            "Bỏ qua lớp có thang khác",
            "Dùng điểm trung bình của mỗi lớp",
          ]}
          correct={1}
          explanation="Chuẩn hóa về cùng thang — đó chính là Batch Normalization! Trong mạng nơ-ron, mỗi lớp có phân phối khác nhau, BN chuẩn hóa về (μ=0, σ=1) để lớp sau luôn nhận input ổn định."
        >
          <p className="mt-4 text-sm text-muted leading-relaxed">
            Khi phân phối đầu vào thay đổi liên tục giữa các lớp (internal covariate shift),
            mạng phải liên tục thích nghi thay vì học. BN giải quyết bằng cách chuẩn hóa
            tại mỗi lớp. Hãy <strong className="text-foreground">tự tay thử</strong> quy trình 3 bước.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ===== STEP 2: INTERACTIVE BN ===== */}
      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-4">
            {/* Step selector */}
            <div className="flex gap-2 justify-center">
              {[
                { s: 0, label: "1. Trước BN" },
                { s: 1, label: "2. Chuẩn hóa" },
                { s: 2, label: "3. Scale & Shift" },
              ].map(({ s, label }) => (
                <button
                  key={s}
                  onClick={() => setStep(s)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                    step === s
                      ? "bg-accent text-white shadow-md"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Controls for raw distribution */}
            {step === 0 && (
              <div className="flex flex-wrap gap-4 justify-center">
                <div className="space-y-1">
                  <label className="text-xs text-muted">
                    Trung bình (μ):{" "}
                    <strong className="text-foreground">{batchMean.toFixed(1)}</strong>
                  </label>
                  <input
                    type="range"
                    min="-10"
                    max="20"
                    step="0.5"
                    value={batchMean}
                    onChange={(e) => setBatchMean(parseFloat(e.target.value))}
                    className="w-32 accent-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted">
                    Độ lệch (σ):{" "}
                    <strong className="text-foreground">{batchStd.toFixed(1)}</strong>
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="10"
                    step="0.5"
                    value={batchStd}
                    onChange={(e) => setBatchStd(parseFloat(e.target.value))}
                    className="w-32 accent-accent"
                  />
                </div>
              </div>
            )}

            {/* Controls for scale & shift */}
            {step === 2 && (
              <div className="flex flex-wrap gap-4 justify-center">
                <div className="space-y-1">
                  <label className="text-xs text-muted">
                    γ (scale):{" "}
                    <strong className="text-foreground">{gamma.toFixed(1)}</strong>
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="3.0"
                    step="0.1"
                    value={gamma}
                    onChange={(e) => setGamma(parseFloat(e.target.value))}
                    className="w-32 accent-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted">
                    β (shift):{" "}
                    <strong className="text-foreground">{beta.toFixed(1)}</strong>
                  </label>
                  <input
                    type="range"
                    min="-3"
                    max="3"
                    step="0.1"
                    value={beta}
                    onChange={(e) => setBeta(parseFloat(e.target.value))}
                    className="w-32 accent-accent"
                  />
                </div>
              </div>
            )}

            {/* Status */}
            <div className="rounded-lg p-2 text-center text-sm font-medium bg-accent/10 text-accent border border-accent/30">
              {displayLabel}
            </div>

            {/* Bar chart */}
            <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full max-w-xl mx-auto">
              {/* Zero line */}
              <line x1={PAD - 5} y1={midY} x2={SVG_W - 10} y2={midY} stroke="#334155" strokeWidth="1" />
              <text x={PAD - 10} y={midY + 4} fill="#64748b" fontSize="9" textAnchor="end">
                0
              </text>

              {/* Bars */}
              {displayValues.map((v, i) => {
                const x = PAD + i * (barW + gap);
                const h = (Math.abs(v) / maxAbs) * barMaxH;
                const y = v >= 0 ? midY - h : midY;
                const color =
                  step === 0 ? "#ef4444" : step === 1 ? "#3b82f6" : "#22c55e";

                return (
                  <g key={`bar-${i}`}>
                    <rect
                      x={x}
                      y={y}
                      width={barW}
                      height={Math.max(1, h)}
                      rx={3}
                      fill={color}
                      opacity={0.8}
                    />
                    <text
                      x={x + barW / 2}
                      y={v >= 0 ? y - 4 : y + h + 12}
                      textAnchor="middle"
                      fill="#cbd5e1"
                      fontSize="7"
                    >
                      {v.toFixed(1)}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="rounded-lg bg-background/50 border border-border p-2">
                <p className="text-muted">Trung bình (μ)</p>
                <p className="text-lg font-bold text-foreground">
                  {displayMu.toFixed(3)}
                </p>
              </div>
              <div className="rounded-lg bg-background/50 border border-border p-2">
                <p className="text-muted">Phương sai (σ²)</p>
                <p className="text-lg font-bold text-foreground">
                  {displayVar.toFixed(3)}
                </p>
              </div>
              <div className="rounded-lg bg-background/50 border border-border p-2">
                <p className="text-muted">Khoảng giá trị</p>
                <p className="text-lg font-bold text-foreground">
                  [{Math.min(...displayValues).toFixed(1)},{" "}
                  {Math.max(...displayValues).toFixed(1)}]
                </p>
              </div>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ===== STEP 3: AHA MOMENT ===== */}
      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>Batch Normalization</strong>{" "}
            = 3 bước tại mỗi lớp: (1) tính μ, σ từ mini-batch, (2) chuẩn hóa về (0, 1),
            (3) để mạng tự học scale γ và shift β. Giống quy đổi tỷ giá khi mua hàng Shopee
            quốc tế — chuẩn hóa về VNĐ trước rồi mới so sánh giá!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ===== STEP 4: INLINE CHALLENGE ===== */}
      <LessonSection step={4} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Batch size = 1 (chỉ 1 mẫu). Batch Normalization có hoạt động được không?"
          options={[
            "Có — BN luôn hoạt động với mọi batch size",
            "Không — 1 mẫu không thể tính mean/variance ý nghĩa. Cần dùng Layer Normalization thay thế",
            "Có — nhưng chỉ khi dùng running statistics",
          ]}
          correct={1}
          explanation="BN cần nhiều mẫu trong batch để ước lượng μ, σ. Batch size = 1 → μ = giá trị đó, σ = 0 → chia cho 0! Layer Norm chuẩn hóa theo features, không phụ thuộc batch → dùng cho Transformer."
        />
      </LessonSection>

      {/* ===== STEP 5: EXPLANATION ===== */}
      <LessonSection step={5} totalSteps={8} label="Giải thích">
        <ExplanationSection>
          <p>
            <strong>Batch Normalization</strong>{" "}
            (Ioffe & Szegedy, 2015) chuẩn hóa đầu vào mỗi lớp:
          </p>

          <LaTeX block>
            {"\\hat{x}_i = \\frac{x_i - \\mu_{\\mathcal{B}}}{\\sqrt{\\sigma^2_{\\mathcal{B}} + \\epsilon}}"}
          </LaTeX>
          <LaTeX block>{"y_i = \\gamma \\hat{x}_i + \\beta"}</LaTeX>

          <p>
            Với <LaTeX>{"\\mu_{\\mathcal{B}}"}</LaTeX> và{" "}
            <LaTeX>{"\\sigma^2_{\\mathcal{B}}"}</LaTeX> tính trên mini-batch,{" "}
            <LaTeX>{"\\gamma"}</LaTeX> (scale) và <LaTeX>{"\\beta"}</LaTeX> (shift)
            là tham số được mạng học qua backpropagation.
          </p>

          <p>
            <strong>Lợi ích:</strong>
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              Giảm <strong>Internal Covariate Shift</strong>{" "}
              — phân phối đầu vào ổn định, các lớp sau không phải liên tục thích nghi.
            </li>
            <li>
              Cho phép dùng <strong>learning rate lớn hơn</strong>{" "}
              — huấn luyện nhanh hơn 5-10 lần.
            </li>
            <li>
              Có tác dụng <strong>regularization nhẹ</strong>{" "}
              (noise từ batch statistics).
            </li>
            <li>
              Giảm phụ thuộc vào <strong>weight initialization</strong>.
            </li>
          </ul>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-semibold text-foreground">
                    Normalization
                  </th>
                  <th className="text-left py-2 pr-3 font-semibold text-foreground">
                    Chuẩn hóa theo
                  </th>
                  <th className="text-left py-2 font-semibold text-foreground">
                    Dùng cho
                  </th>
                </tr>
              </thead>
              <tbody className="text-foreground/80">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">Batch Norm</td>
                  <td className="py-2 pr-3">Batch (cùng feature, nhiều mẫu)</td>
                  <td className="py-2">CNN, MLP (batch size lớn)</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">Layer Norm</td>
                  <td className="py-2 pr-3">Features (1 mẫu, tất cả features)</td>
                  <td className="py-2">Transformer, RNN</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">Instance Norm</td>
                  <td className="py-2 pr-3">Spatial (1 mẫu, 1 channel)</td>
                  <td className="py-2">Style Transfer</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-medium">Group Norm</td>
                  <td className="py-2 pr-3">Nhóm channels</td>
                  <td className="py-2">Detection (batch nhỏ)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <CodeBlock language="python" title="batch_norm.py">
{`import torch.nn as nn

# Thêm BN sau mỗi lớp Linear/Conv, TRƯỚC activation
model = nn.Sequential(
    nn.Linear(784, 256),
    nn.BatchNorm1d(256),    # BN cho fully connected
    nn.ReLU(),
    nn.Linear(256, 128),
    nn.BatchNorm1d(128),
    nn.ReLU(),
    nn.Linear(128, 10),
)

# Quan trọng: BN hoạt động KHÁC khi train vs eval
model.train()  # dùng batch statistics
model.eval()   # dùng running statistics

# Layer Norm cho Transformer
layer_norm = nn.LayerNorm(d_model)  # chuẩn hóa theo features`}
          </CodeBlock>

          <Callout variant="warning" title="BN phải đặt TRƯỚC activation, SAU linear/conv">
            Thứ tự đúng: Linear → BatchNorm → ReLU. Lý do: BN chuẩn hóa phân phối
            trước khi đưa vào hàm kích hoạt, tránh vùng bão hòa của sigmoid/tanh.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ===== STEP 6: CHALLENGE 2 ===== */}
      <LessonSection step={6} totalSteps={8} label="Thử thách nâng cao">
        <InlineChallenge
          question="Bạn dùng BatchNorm nhưng quên gọi model.eval() khi inference. Kết quả sẽ thế nào?"
          options={[
            "Không ảnh hưởng — BN tự biết khi nào train/eval",
            "Kết quả không ổn định — BN dùng batch statistics thay vì running statistics, output thay đổi tùy batch",
            "Model báo lỗi ngay lập tức",
          ]}
          correct={1}
          explanation="Nếu không gọi model.eval(), BN vẫn tính mean/variance trên batch hiện tại → output phụ thuộc vào batch → kết quả không nhất quán. Đây là bug phổ biến trong production!"
        />
      </LessonSection>

      {/* ===== STEP 7: MINI SUMMARY ===== */}
      <LessonSection step={7} totalSteps={8} label="Tóm tắt">
        <MiniSummary
          title="Batch Normalization — Điểm chốt"
          points={[
            "BN = 3 bước: tính μ,σ từ batch → chuẩn hóa → scale (γ) & shift (β) học được.",
            "Lợi ích: cho phép LR lớn hơn, huấn luyện nhanh hơn, regularization nhẹ, giảm phụ thuộc weight init.",
            "Thứ tự: Linear → BatchNorm → ReLU. Luôn gọi model.eval() khi inference!",
            "BN phụ thuộc batch size — không phù hợp cho batch nhỏ hoặc sequence variable-length.",
            "Transformer dùng LayerNorm (chuẩn hóa theo features) thay vì BatchNorm.",
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
