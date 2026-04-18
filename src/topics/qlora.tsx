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
  CollapsibleDetail,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "qlora",
  title: "QLoRA",
  titleVi: "QLoRA - LoRA lượng tử hóa",
  description:
    "Kết hợp lượng tử hóa 4-bit với LoRA, cho phép fine-tune mô hình 65B trên GPU 48GB.",
  category: "training-optimization",
  tags: ["qlora", "quantization", "lora", "efficiency"],
  difficulty: "advanced",
  relatedSlugs: ["lora", "quantization", "fine-tuning"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

// ════════════════════════════════════════════════════════════════════════════
// DỮ LIỆU: Phân tích bộ nhớ cho fine-tuning mô hình 70B
// Full FT cần: weights (140GB) + gradients (140GB) + optimizer state Adam (560GB)
//   = ~840GB lý tưởng. Với activation checkpointing + mixed precision còn ~160GB thực
// LoRA: weights FP16 (140GB) + rất ít trainable (16GB gradient/optimizer)
//   = ~160GB thực, nhưng sau khi apply gradient checkpointing và loại bỏ base-model
//   gradients, chỉ còn ~64GB
// QLoRA: weights NF4 (~35GB) + LoRA adapter FP16 (+ optimizer paged) ≈ 48GB
// ════════════════════════════════════════════════════════════════════════════

type MemBreakdown = {
  name: string;
  shortName: string;
  totalGB: number;
  weights: number;
  gradients: number;
  optimizer: number;
  adapter: number;
  activations: number;
  color: string;
  quality: number;
  speed: number;
  fitsIn: string;
  description: string;
};

const MEM_70B: MemBreakdown[] = [
  {
    name: "Full Fine-tuning (FP16)",
    shortName: "Full FT",
    totalGB: 160,
    weights: 140,
    gradients: 140,
    optimizer: 280,
    adapter: 0,
    activations: 40,
    color: "#ef4444",
    quality: 100,
    speed: 1.0,
    fitsIn: "8×A100 80GB (cluster)",
    description:
      "Cập nhật toàn bộ 70B tham số. Cần lưu weights + gradients + optimizer Adam (m, v).",
  },
  {
    name: "LoRA (FP16 base)",
    shortName: "LoRA",
    totalGB: 64,
    weights: 140,
    gradients: 2,
    optimizer: 4,
    adapter: 2,
    activations: 16,
    color: "#f59e0b",
    quality: 99.5,
    speed: 0.95,
    fitsIn: "2×A100 80GB",
    description:
      "Đóng băng base model FP16. Chỉ có LoRA adapter (r=16) cần gradient + optimizer.",
  },
  {
    name: "QLoRA (NF4 base + LoRA FP16)",
    shortName: "QLoRA",
    totalGB: 48,
    weights: 35,
    gradients: 2,
    optimizer: 4,
    adapter: 2,
    activations: 5,
    color: "#22c55e",
    quality: 99.0,
    speed: 0.55,
    fitsIn: "1×A100 48GB (hoặc 1×RTX 6000 Ada)",
    description:
      "Base model nén xuống NF4 (4-bit). LoRA adapter FP16 học delta. Paged optimizer xử lý spike bộ nhớ.",
  },
];

// Thang model size: (name, params B, fp16GB, nf4GB, loraGB, qloraGB)
type ModelScale = {
  name: string;
  paramsB: number;
  fp16GB: number; // weights FP16
  nf4GB: number; // weights NF4 (~bitsandbytes 4.5-bit)
  loraFullGB: number; // tổng khi LoRA
  qloraFullGB: number; // tổng khi QLoRA
  fullFtGB: number;
};

const MODEL_SCALES: ModelScale[] = [
  { name: "Llama 7B", paramsB: 7, fp16GB: 14, nf4GB: 3.5, loraFullGB: 16, qloraFullGB: 6, fullFtGB: 80 },
  { name: "Llama 13B", paramsB: 13, fp16GB: 26, nf4GB: 6.5, loraFullGB: 28, qloraFullGB: 10, fullFtGB: 150 },
  { name: "Llama 33B", paramsB: 33, fp16GB: 66, nf4GB: 17, loraFullGB: 70, qloraFullGB: 24, fullFtGB: 380 },
  { name: "Llama 65B", paramsB: 65, fp16GB: 130, nf4GB: 33, loraFullGB: 140, qloraFullGB: 45, fullFtGB: 780 },
  { name: "Llama 70B", paramsB: 70, fp16GB: 140, nf4GB: 35, loraFullGB: 152, qloraFullGB: 48, fullFtGB: 840 },
  { name: "Llama 180B", paramsB: 180, fp16GB: 360, nf4GB: 90, loraFullGB: 380, qloraFullGB: 118, fullFtGB: 2160 },
];

const GPU_PRESETS: { name: string; vramGB: number; color: string; desc: string }[] = [
  { name: "RTX 4090", vramGB: 24, color: "#22c55e", desc: "Consumer - 1600 USD" },
  { name: "A100 40GB", vramGB: 40, color: "#3b82f6", desc: "Datacenter cũ - 8000 USD" },
  { name: "A100 80GB", vramGB: 80, color: "#8b5cf6", desc: "Datacenter - 15000 USD" },
];

// ════════════════════════════════════════════════════════════════════════════
// QUIZ — 8 câu như yêu cầu
// ════════════════════════════════════════════════════════════════════════════

const QUIZ: QuizQuestion[] = [
  {
    question: "QLoRA kết hợp hai kỹ thuật nào?",
    options: [
      "Pruning + Distillation",
      "Quantization 4-bit + LoRA",
      "Mixed Precision + Full Fine-tuning",
      "DPO + RLHF",
    ],
    correct: 1,
    explanation:
      "QLoRA = Quantize base model xuống NF4 (4-bit) + LoRA adapter ở BF16/FP16. Kết hợp tiết kiệm bộ nhớ của quantization với hiệu quả cập nhật của LoRA adapter.",
  },
  {
    question: "NF4 (NormalFloat 4-bit) khác INT4 thông thường ở điểm nào?",
    options: [
      "NF4 nhanh hơn INT4 trên GPU",
      "NF4 được thiết kế tối ưu cho phân bố trọng số dạng chuẩn (Gaussian), bảo toàn thông tin tốt hơn",
      "NF4 dùng nhiều bit hơn INT4",
      "NF4 chỉ hoạt động trên GPU NVIDIA",
    ],
    correct: 1,
    explanation:
      "Trọng số mạng nơ-ron thường có phân bố gần Gaussian quanh 0. NF4 đặt 16 mức lượng tử theo phân vị của phân bố chuẩn (thay vì đều), nên biểu diễn vùng mật độ cao chính xác hơn INT4.",
  },
  {
    question: "Double Quantization trong QLoRA tiết kiệm thêm bằng cách nào?",
    options: [
      "Quantize dữ liệu huấn luyện",
      "Quantize cả hằng số quantization (scale factors) từ FP32 xuống FP8",
      "Lượng tử hoá 2 lần cùng trọng số cho chắc",
      "Giảm rank r của LoRA xuống 2",
    ],
    correct: 1,
    explanation:
      "Mỗi block 64 trọng số cần hằng số scale ở FP32. Double Quantization nén các hằng số này xuống FP8 (với scale thứ cấp mỗi 256 block), tiết kiệm thêm ~0.37 bit/tham số. Trên 65B tham số đây là ~3GB.",
  },
  {
    question: "Paged Optimizer giúp gì trong QLoRA?",
    options: [
      "Tăng throughput token/giây",
      "Tránh OOM khi có gradient spike: tự động đẩy optimizer state giữa GPU và CPU qua NVIDIA unified memory",
      "Nén optimizer state xuống 4-bit",
      "Thay Adam bằng SGD",
    ],
    correct: 1,
    explanation:
      "Paged Optimizer dùng NVIDIA Unified Memory (driver tự quản lý page fault giữa GPU-CPU). Khi có spike (ví dụ sequence dài đột ngột), trang optimizer ít dùng bị swap xuống CPU RAM thay vì báo lỗi OOM.",
  },
  {
    type: "fill-blank",
    question:
      "QLoRA nén trọng số mô hình gốc xuống {blank}-bit (định dạng {blank}), trong khi LoRA adapter vẫn giữ ở BF16 để huấn luyện.",
    blanks: [
      { answer: "4", accept: ["4-bit", "four"] },
      { answer: "nf4", accept: ["normalfloat", "normalfloat4", "NF4"] },
    ],
    explanation:
      "QLoRA dùng NF4 (NormalFloat 4-bit) — kiểu dữ liệu 4 bit tối ưu cho phân bố Gaussian. Kết quả: giảm 4x VRAM so với FP16, fine-tune mô hình 65B trên 1 GPU 48GB.",
  },
  {
    question: "Vì sao QLoRA chậm hơn LoRA thuần khoảng 30-50%?",
    options: [
      "Vì NF4 không được GPU hỗ trợ native",
      "Vì mỗi forward pass cần dequantize trọng số NF4 về BF16 on-the-fly trước khi matmul",
      "Vì adapter quá lớn",
      "Vì phải chạy lại calibration mỗi bước",
    ],
    correct: 1,
    explanation:
      "GPU không có matmul INT4 native cho đến H100. Mỗi forward, bitsandbytes kernel dequantize NF4 → BF16 rồi mới matmul. Dequant overhead chiếm 30-50% thời gian. H100 với FP8 giảm đáng kể phần này.",
  },
  {
    question: "Khi nào nên chọn QLoRA thay vì LoRA thuần?",
    options: [
      "Khi bạn có cluster 8×A100 và cần tốc độ tối đa",
      "Khi VRAM là nút cổ chai — ví dụ fine-tune 70B trên 1 GPU 48GB, hoặc 13B trên RTX 4090 24GB",
      "Khi dataset rất nhỏ (<1000 mẫu)",
      "Khi cần chất lượng tuyệt đối 100%",
    ],
    correct: 1,
    explanation:
      "QLoRA là công cụ VRAM-first: trade 30-50% speed lấy 4x memory. Nếu bạn đã dư VRAM thì LoRA FP16 nhanh hơn. Nếu bạn thiếu VRAM hoặc không có budget mua thêm GPU, QLoRA là cách duy nhất fit được model lớn.",
  },
  {
    question: "QLoRA paper của Dettmers et al. (2023) chứng minh điều gì trên benchmark Vicuna/MMLU?",
    options: [
      "QLoRA kém hơn Full FT 10-20% chất lượng",
      "QLoRA đạt chất lượng gần tương đương Full FT (trong sai số ~1%) trên nhiều benchmark, bao gồm Guanaco 65B đạt 99% ChatGPT",
      "QLoRA chỉ hoạt động với model <7B",
      "QLoRA không chạy được trên bất kỳ GPU consumer nào",
    ],
    correct: 1,
    explanation:
      "Paper gốc huấn luyện Guanaco 65B bằng QLoRA trên 1 GPU 48GB trong 24 giờ, đạt 99.3% ChatGPT trên Vicuna benchmark. Đây là bằng chứng QLoRA không phải 'nén bẩn' — chất lượng giữ được khi pipeline đúng.",
  },
];

// ════════════════════════════════════════════════════════════════════════════
// HELPER: Tính GPU fit
// ════════════════════════════════════════════════════════════════════════════

function fitStatus(needGB: number, vramGB: number): {
  fits: boolean;
  label: string;
  color: string;
  headroom: number;
} {
  const headroom = vramGB - needGB;
  if (headroom >= 8) {
    return { fits: true, label: "Vừa thoải mái", color: "#22c55e", headroom };
  }
  if (headroom >= 0) {
    return { fits: true, label: "Vừa sát nút", color: "#eab308", headroom };
  }
  return { fits: false, label: "Tràn bộ nhớ (OOM)", color: "#ef4444", headroom };
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT CHÍNH
// ════════════════════════════════════════════════════════════════════════════

export default function QLoRATopic() {
  const [method, setMethod] = useState(2); // QLoRA mặc định
  const [scaleIdx, setScaleIdx] = useState(4); // Llama 70B mặc định
  const [gpuIdx, setGpuIdx] = useState(2); // A100 80GB mặc định
  const [showNF4, setShowNF4] = useState(true);
  const [useDoubleQuant, setUseDoubleQuant] = useState(true);

  const scale = MODEL_SCALES[scaleIdx];
  const gpu = GPU_PRESETS[gpuIdx];

  const methodNeedGB = useMemo(() => {
    if (method === 0) return scale.fullFtGB;
    if (method === 1) return scale.loraFullGB;
    return scale.qloraFullGB;
  }, [method, scale]);

  const fit = fitStatus(methodNeedGB, gpu.vramGB);

  // NF4 mức lượng tử — 16 mức theo phân bố chuẩn
  // Paper values: symmetric, range [-1, 1]
  const NF4_LEVELS = [
    -1.0,
    -0.6962,
    -0.5251,
    -0.3949,
    -0.2844,
    -0.1849,
    -0.0911,
    0.0,
    0.0796,
    0.1609,
    0.2461,
    0.3379,
    0.4407,
    0.5626,
    0.7230,
    1.0,
  ];

  // Lưu ý: bit overhead cho quantization constants
  const effectiveBits = useDoubleQuant ? 4.127 : 4.5; // ~0.37 bit saved
  const adapterBitsSaved = useDoubleQuant ? 0.373 : 0;

  return (
    <>
      {/* ━━━ 1. HOOK ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Mô hình 70 tỷ tham số ở FP16 chiếm 140GB VRAM cho inference. Full fine-tuning cần ~840GB. Bạn chỉ có 1 GPU 48GB. Có thể fine-tune được không?"
          options={[
            "Không thể — phải mua thêm 15 GPU nữa",
            "Có thể — nén mô hình xuống 4-bit rồi fine-tune bằng LoRA adapter",
            "Có thể — chỉ cần giảm batch size xuống 1",
            "Có thể — chuyển sang fine-tune trên CPU",
          ]}
          correct={1}
          explanation="QLoRA nén 70B từ 140GB xuống ~35GB bằng lượng tử hoá NF4, rồi fine-tune bằng LoRA adapter ở BF16. Paged optimizer xử lý spike. Tổng chỉ ~48GB — vừa 1 GPU!"
        >
          <p className="text-sm text-muted mt-2">
            Đây là bước đột phá giúp cá nhân và startup fine-tune được mô hình cỡ GPT-3
            mà chỉ cần một GPU datacenter. Trước QLoRA (5/2023), fine-tune 65B là đặc quyền
            của ai có cluster 8 GPU trở lên.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ 2. ANALOGY ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Ẩn dụ">
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-base font-semibold text-foreground">
            Ẩn dụ: Bảo tàng tranh và lớp kính nhận xét
          </h3>
          <p className="text-sm text-muted leading-relaxed">
            Hãy tưởng tượng bạn là một học viên được giao bài tập &quot;chỉnh lại&quot; một
            bảo tàng 70.000 bức tranh khổng lồ (mô hình 70B). Phòng làm việc của bạn (GPU)
            chỉ rộng bằng 1/3 bảo tàng. Có ba chiến lược:
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-background/40 p-3">
              <p className="text-sm font-semibold text-foreground mb-1">
                Full Fine-tuning — sơn lại mọi bức
              </p>
              <p className="text-xs text-muted leading-relaxed">
                Bạn mang từng bức tranh gốc về phòng, sơn lại, rồi trả về. Cần kho lớn
                gấp 4 lần bảo tàng (tranh gốc + bản vẽ thử + giấy nháp Adam). Không khả thi.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background/40 p-3">
              <p className="text-sm font-semibold text-foreground mb-1">
                LoRA — đặt tấm kính lên mỗi bức
              </p>
              <p className="text-xs text-muted leading-relaxed">
                Bạn không sửa bức gốc. Thay vào đó, đặt một lớp kính mỏng trong suốt lên
                mỗi bức, chỉ vẽ những chi tiết cần thay đổi lên kính. Kho cần = bảo tàng +
                vài kg kính. Vẫn hơi chật.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background/40 p-3">
              <p className="text-sm font-semibold text-foreground mb-1">
                QLoRA — chụp ảnh nhỏ bức gốc + kính
              </p>
              <p className="text-xs text-muted leading-relaxed">
                Bạn chụp ảnh 4K (NF4) của mỗi bức để tham khảo, giữ bức gốc trong kho
                khác. Lớp kính vẫn ở độ nét cao. Khi cần so sánh, phóng ảnh lên
                (dequantize). Phòng vừa.
              </p>
            </div>
          </div>

          <p className="text-sm text-muted leading-relaxed">
            Nén bức tranh gốc (quantize 4-bit) để vừa căn phòng nhỏ, rồi vẽ chi tiết mới
            trên lớp kính mỏng (LoRA adapter). Đó chính là QLoRA.
          </p>
        </div>
      </LessonSection>

      {/* ━━━ 3. VISUALIZATION ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Phân tích bộ nhớ QLoRA — tương tác
          </h3>
          <p className="text-sm text-muted mb-4">
            Chọn phương pháp, kích thước mô hình, và GPU. Xem cột bộ nhớ thay đổi và
            kiểm tra xem có vừa VRAM không.
          </p>

          {/* Tabs method */}
          <div className="flex flex-wrap gap-2 mb-4">
            {MEM_70B.map((m, i) => (
              <button
                key={i}
                onClick={() => setMethod(i)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  method === i
                    ? "text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
                style={method === i ? { backgroundColor: m.color } : {}}
              >
                {m.shortName}
              </button>
            ))}
          </div>

          {/* Chính: 3 cột stacked bar cho 70B */}
          <div className="rounded-xl border border-border bg-background/40 p-4 mb-5">
            <p className="text-xs text-muted mb-3">
              Phân tích bộ nhớ khi fine-tune Llama 70B (chú thích: GB)
            </p>
            <svg viewBox="0 0 640 260" className="w-full">
              {/* Axis */}
              <line x1="70" y1="20" x2="70" y2="220" stroke="var(--border)" strokeWidth="1" />
              <line x1="70" y1="220" x2="620" y2="220" stroke="var(--border)" strokeWidth="1" />
              {[0, 40, 80, 120, 160, 200].map((v) => (
                <g key={v}>
                  <line
                    x1="70"
                    y1={220 - v}
                    x2="620"
                    y2={220 - v}
                    stroke="var(--border)"
                    strokeWidth="0.5"
                    strokeDasharray="2,3"
                    opacity="0.4"
                  />
                  <text x="65" y={224 - v} fill="var(--text-tertiary)" fontSize="9" textAnchor="end">
                    {v}
                  </text>
                </g>
              ))}

              {MEM_70B.map((m, i) => {
                const x = 110 + i * 170;
                const barW = 110;
                let yStack = 220;
                const segs = [
                  { label: "Weights", v: m.weights, fill: m.color },
                  { label: "Gradient", v: m.gradients, fill: "#f59e0b" },
                  { label: "Optimizer", v: m.optimizer, fill: "#a855f7" },
                  { label: "Activation", v: m.activations, fill: "#06b6d4" },
                  { label: "Adapter", v: m.adapter, fill: "#ec4899" },
                ];
                const total = m.totalGB;
                const opacity = method === i ? 1.0 : 0.45;
                // Scale để tổng vừa trong 200px = 200GB
                const scaleY = 1.0;
                return (
                  <g key={i} opacity={opacity}>
                    <text
                      x={x + barW / 2}
                      y="245"
                      textAnchor="middle"
                      fill="var(--text-secondary)"
                      fontSize="10"
                      fontWeight={method === i ? "bold" : "normal"}
                    >
                      {m.shortName}
                    </text>
                    <text
                      x={x + barW / 2}
                      y="257"
                      textAnchor="middle"
                      fill={m.color}
                      fontSize="11"
                      fontWeight="bold"
                    >
                      {total} GB
                    </text>
                    {segs.map((s, j) => {
                      if (s.v === 0) return null;
                      const h = s.v * scaleY;
                      yStack -= h;
                      return (
                        <g key={j}>
                          <rect
                            x={x}
                            y={yStack}
                            width={barW}
                            height={h}
                            fill={s.fill}
                            opacity={0.85}
                            stroke="var(--bg-card)"
                            strokeWidth="0.5"
                          />
                          {h > 14 && (
                            <text
                              x={x + barW / 2}
                              y={yStack + h / 2 + 3}
                              textAnchor="middle"
                              fill="white"
                              fontSize="9"
                              fontWeight="600"
                            >
                              {s.label} {s.v}
                            </text>
                          )}
                        </g>
                      );
                    })}
                    {/* Đường 48GB */}
                    {i === method && (
                      <>
                        <line
                          x1="70"
                          y1={220 - 48}
                          x2="620"
                          y2={220 - 48}
                          stroke="#22c55e"
                          strokeWidth="1.5"
                          strokeDasharray="4,3"
                        />
                        <text x="615" y={220 - 48 - 4} fill="#22c55e" fontSize="9" textAnchor="end">
                          48GB limit (1 GPU)
                        </text>
                      </>
                    )}
                  </g>
                );
              })}
            </svg>

            <div className="mt-4 rounded-lg bg-background/60 border border-border p-3">
              <p className="text-sm font-semibold text-foreground mb-1">
                {MEM_70B[method].name}
              </p>
              <p className="text-xs text-muted leading-relaxed">
                {MEM_70B[method].description}
              </p>
              <p className="text-xs text-muted mt-2">
                Vừa: <span className="text-foreground font-semibold">{MEM_70B[method].fitsIn}</span>
                {" · "}Chất lượng: <span className="text-foreground font-semibold">{MEM_70B[method].quality}%</span>
                {" · "}Tốc độ tương đối: <span className="text-foreground font-semibold">{MEM_70B[method].speed}x</span>
              </p>
            </div>
          </div>

          {/* Interactive: adjust model size, see fit */}
          <div className="rounded-xl border border-border bg-background/40 p-4 mb-5">
            <p className="text-sm font-semibold text-foreground mb-2">
              Thử kích thước mô hình & GPU — xem có vừa không
            </p>

            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-xs text-muted self-center mr-1">Mô hình:</span>
              {MODEL_SCALES.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setScaleIdx(i)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    scaleIdx === i
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-xs text-muted self-center mr-1">GPU:</span>
              {GPU_PRESETS.map((g, i) => (
                <button
                  key={i}
                  onClick={() => setGpuIdx(i)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    gpuIdx === i
                      ? "text-white"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                  style={gpuIdx === i ? { backgroundColor: g.color } : {}}
                >
                  {g.name} ({g.vramGB}GB)
                </button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Full FT", need: scale.fullFtGB, c: "#ef4444" },
                { label: "LoRA", need: scale.loraFullGB, c: "#f59e0b" },
                { label: "QLoRA", need: scale.qloraFullGB, c: "#22c55e" },
              ].map((row, i) => {
                const s = fitStatus(row.need, gpu.vramGB);
                return (
                  <div
                    key={i}
                    className="rounded-lg border p-3 text-sm"
                    style={{
                      borderColor: s.fits ? s.color : "#ef4444",
                      backgroundColor: s.fits ? `${s.color}10` : "#ef444410",
                    }}
                  >
                    <p className="font-semibold" style={{ color: row.c }}>
                      {row.label}
                    </p>
                    <p className="text-xs text-muted mt-1">Cần: {row.need} GB</p>
                    <p className="text-xs text-muted">VRAM: {gpu.vramGB} GB</p>
                    <p className="text-xs font-semibold mt-1" style={{ color: s.color }}>
                      {s.label}
                    </p>
                    {s.fits && (
                      <p className="text-xs text-muted">
                        Headroom: {s.headroom.toFixed(1)} GB
                      </p>
                    )}
                    {!s.fits && (
                      <p className="text-xs" style={{ color: "#ef4444" }}>
                        Thiếu: {Math.abs(s.headroom).toFixed(1)} GB
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div
              className="mt-3 rounded-lg border p-3 text-sm"
              style={{
                borderColor: fit.color,
                backgroundColor: `${fit.color}15`,
              }}
            >
              <strong style={{ color: fit.color }}>
                {MEM_70B[method].shortName} trên {gpu.name}:
              </strong>{" "}
              <span className="text-muted">
                cần {methodNeedGB} GB, có {gpu.vramGB} GB → {fit.label}.
              </span>
              {gpu.vramGB >= 80 && method === 2 && (
                <span className="block text-xs text-muted mt-1">
                  Mẹo: Trên GPU 80GB bạn có thể tăng batch size hoặc sequence length thay vì để VRAM lãng phí.
                </span>
              )}
            </div>
          </div>

          {/* NF4 layout viz */}
          <div className="rounded-xl border border-border bg-background/40 p-4 mb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground">
                Layout NF4 — 16 mức lượng tử theo phân bố chuẩn
              </p>
              <button
                onClick={() => setShowNF4(!showNF4)}
                className="text-xs text-muted hover:text-foreground underline"
              >
                {showNF4 ? "Ẩn" : "Hiện"}
              </button>
            </div>

            {showNF4 && (
              <svg viewBox="0 0 640 160" className="w-full">
                {/* Gaussian curve ở background */}
                <path
                  d={(() => {
                    const pts: string[] = [];
                    for (let i = 0; i <= 100; i++) {
                      const x = -3 + (i / 100) * 6;
                      const y = Math.exp(-(x * x) / 2);
                      const sx = 40 + ((x + 3) / 6) * 560;
                      const sy = 120 - y * 100;
                      pts.push(`${i === 0 ? "M" : "L"}${sx.toFixed(1)},${sy.toFixed(1)}`);
                    }
                    return pts.join(" ");
                  })()}
                  fill="#3b82f620"
                  stroke="#3b82f6"
                  strokeWidth="1.5"
                />
                {/* Axis */}
                <line x1="40" y1="120" x2="600" y2="120" stroke="var(--border)" strokeWidth="1" />
                <text x="40" y="140" fill="var(--text-tertiary)" fontSize="9">-3σ</text>
                <text x="320" y="140" fill="var(--text-tertiary)" fontSize="9" textAnchor="middle">0</text>
                <text x="600" y="140" fill="var(--text-tertiary)" fontSize="9" textAnchor="end">+3σ</text>

                {/* NF4 ticks — 16 levels */}
                {NF4_LEVELS.map((v, i) => {
                  // scale v từ [-1, 1] về [-2.5, 2.5] để thấy rõ trên Gaussian
                  const scaled = v * 2.5;
                  const sx = 40 + ((scaled + 3) / 6) * 560;
                  return (
                    <g key={i}>
                      <line x1={sx} y1="30" x2={sx} y2="120" stroke="#22c55e" strokeWidth="1.1" opacity={0.8} />
                      <circle cx={sx} cy="120" r="3" fill="#22c55e" />
                      {i % 2 === 0 && (
                        <text x={sx} y="28" fill="#22c55e" fontSize="8" textAnchor="middle">
                          {v.toFixed(2)}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* INT4 ticks — 16 levels đều — để so sánh */}
                {Array.from({ length: 16 }, (_, i) => {
                  const v = -1 + (i / 15) * 2;
                  const scaled = v * 2.5;
                  const sx = 40 + ((scaled + 3) / 6) * 560;
                  return (
                    <line key={i} x1={sx} y1="120" x2={sx} y2="148" stroke="#ef4444" strokeWidth="1" opacity={0.6} />
                  );
                })}
                <text x="600" y="158" fill="#ef4444" fontSize="8" textAnchor="end">INT4 đều</text>
                <text x="600" y="25" fill="#22c55e" fontSize="8" textAnchor="end">NF4 theo Gaussian</text>
              </svg>
            )}
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Xanh lá: 16 mức NF4 đặt đặc ở gần 0 (nơi mật độ trọng số cao nhất), thưa ở đuôi.
              Đỏ: 16 mức INT4 đều. Cùng 4 bit, NF4 biểu diễn chính xác hơn vùng quan trọng.
            </p>
          </div>

          {/* Double quantization toggle */}
          <div className="rounded-xl border border-border bg-background/40 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-foreground">
                Double Quantization — nén luôn hằng số scale
              </p>
              <button
                onClick={() => setUseDoubleQuant(!useDoubleQuant)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                  useDoubleQuant
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-muted"
                }`}
              >
                {useDoubleQuant ? "Đang BẬT" : "Đang TẮT"}
              </button>
            </div>
            <p className="text-xs text-muted leading-relaxed mb-3">
              Mỗi block 64 trọng số có 1 hằng số scale ở FP32 (32 bit). Nếu nén thêm
              các scale này xuống FP8 (mỗi 256 block 1 scale phụ), ta tiết kiệm
              ~0.37 bit/tham số.
            </p>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-border bg-background/60 p-3">
                <p className="text-xs text-muted">Số bit hiệu dụng / tham số</p>
                <p className="text-2xl font-bold text-foreground">
                  {effectiveBits.toFixed(2)} bit
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background/60 p-3">
                <p className="text-xs text-muted">Tiết kiệm thêm (70B)</p>
                <p className="text-2xl font-bold text-green-500">
                  {(adapterBitsSaved * 70e9 / 8 / 1e9).toFixed(1)} GB
                </p>
              </div>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ 4. AHA MOMENT ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          <strong>QLoRA</strong>{" "}kết hợp hai ý tưởng tưởng chừng mâu thuẫn: quantize
          xuống 4-bit (mất thông tin!) nhưng vẫn fine-tune được (cần gradient chính xác!).
          Bí quyết: <strong>chỉ nén phần đóng băng</strong>{" "}(base model), còn phần
          học (LoRA adapter) giữ BF16. Gradient chạy qua base-model dequant-on-the-fly,
          nhưng chỉ cập nhật adapter. Kết quả: fine-tune 65B trên{" "}
          <strong>một GPU duy nhất</strong>, chất lượng gần bằng dùng 16 GPU.
        </AhaMoment>
      </LessonSection>

      {/* ━━━ 5. CHALLENGE 1 ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách 1">
        <InlineChallenge
          question="Tại sao QLoRA dùng NF4 (NormalFloat 4-bit) thay vì INT4 thông thường?"
          options={[
            "NF4 nhanh hơn INT4 trên GPU",
            "Trọng số mạng nơ-ron có phân bố gần Gaussian, NF4 được thiết kế tối ưu cho phân bố này",
            "NF4 tương thích với nhiều framework hơn",
            "NF4 dùng ít bit hơn INT4",
          ]}
          correct={1}
          explanation="Trọng số neural network gần phân bố chuẩn (bell curve). NF4 đặt nhiều mức lượng tử hoá hơn ở vùng mật độ cao (gần 0), ít mức hơn ở đuôi — bảo toàn thông tin tốt hơn INT4 đều đặn với cùng 4 bit."
        />
      </LessonSection>

      {/* ━━━ 6. CHALLENGE 2 ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Thử thách 2">
        <InlineChallenge
          question="Bạn muốn fine-tune Llama 33B bằng QLoRA. VRAM tối thiểu cần là bao nhiêu?"
          options={[
            "Khoảng 8 GB — hợp mọi GPU consumer",
            "Khoảng 24 GB — vừa RTX 4090/3090",
            "Khoảng 66 GB — vẫn cần A100 80GB",
            "Khoảng 150 GB — cần cluster",
          ]}
          correct={1}
          explanation="33B × 4-bit ≈ 17GB weights, + LoRA adapter + gradient + paged optimizer + activation ≈ 24GB. Vừa vặn RTX 4090 24GB. Đây là cột mốc dân chủ hoá: fine-tune 33B trên GPU gaming consumer."
        />
      </LessonSection>

      {/* ━━━ 7. EXPLANATION ━━━ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Định nghĩa.</strong>{" "}<strong>QLoRA</strong>{" "}(Quantized{" "}
            <TopicLink slug="lora">LoRA</TopicLink>, Dettmers et al. 2023) là phương pháp
            parameter-efficient fine-tuning: nén base model xuống{" "}
            <strong>NF4 (NormalFloat 4-bit)</strong>{" "}và đóng băng, rồi huấn luyện
            LoRA adapter ở BF16 để học delta thích ứng. Cần ba đổi mới:
          </p>

          <ol className="list-decimal list-inside space-y-1 pl-2 text-sm">
            <li>
              <strong>NF4 datatype</strong>{" "}— kiểu 4-bit tối ưu information-theoretic
              cho tensor có phân bố chuẩn.
            </li>
            <li>
              <strong>Double Quantization</strong>{" "}— quantize tiếp các hằng số
              quantization, tiết kiệm thêm ~0.37 bit/tham số.
            </li>
            <li>
              <strong>Paged Optimizers</strong>{" "}— dùng NVIDIA Unified Memory để tránh
              OOM khi có gradient spike bất thường.
            </li>
          </ol>

          <p className="mt-4">
            <strong>Công thức — bộ nhớ lưu trọng số sau NF4:</strong>
          </p>
          <LaTeX block>
            {
              "M_{\\text{NF4}} = \\frac{N \\times 4}{8} + \\frac{N}{b_{\\text{block}}} \\times 32 \\quad \\text{(bytes)}"
            }
          </LaTeX>
          <p className="text-sm">
            Trong đó <LaTeX>{"N"}</LaTeX> là số tham số và{" "}
            <LaTeX>{"b_{\\text{block}}"}</LaTeX> là kích thước block (mặc định 64).
            Với <LaTeX>{"N = 70 \\times 10^9"}</LaTeX>:
            base <LaTeX>{"= 35 \\, \\text{GB}"}</LaTeX>, scale overhead{" "}
            <LaTeX>{"\\approx 4.4 \\, \\text{GB}"}</LaTeX>.
          </p>

          <p className="mt-4">
            <strong>Với Double Quantization:</strong>{" "}hằng số scale FP32 được
            quantize xuống FP8 với scale thứ cấp mỗi 256 block:
          </p>
          <LaTeX block>
            {
              "M_{\\text{DQ}} = \\frac{N}{b_{\\text{block}}} \\times 8 + \\frac{N}{b_{\\text{block}} \\cdot 256} \\times 32 \\approx \\frac{N \\times 8}{b_{\\text{block}}} \\, \\text{bits}"
            }
          </LaTeX>
          <p className="text-sm">
            Tiết kiệm ~0.37 bit/param, tương đương ~3 GB trên 70B.
          </p>

          <p className="mt-4">
            <strong>Forward pass QLoRA:</strong>{" "}cho mỗi layer linear với{" "}
            <LaTeX>{"W_{\\text{NF4}}"}</LaTeX> đóng băng và adapter{" "}
            <LaTeX>{"A \\in \\mathbb{R}^{r \\times d}"}</LaTeX>,{" "}
            <LaTeX>{"B \\in \\mathbb{R}^{d \\times r}"}</LaTeX>:
          </p>
          <LaTeX block>
            {
              "y = \\text{dequant}(W_{\\text{NF4}}) \\, x + B A x"
            }
          </LaTeX>
          <p className="text-sm">
            Gradient chỉ chảy vào <LaTeX>{"A, B"}</LaTeX>. Base model hoàn toàn đóng băng
            nhưng vẫn dequantize mỗi forward — đó là lý do QLoRA chậm hơn LoRA thuần.
          </p>

          <p className="mt-4">
            <strong>Ví dụ code 1 — PEFT + bitsandbytes (QLoRA chuẩn):</strong>
          </p>
          <CodeBlock language="python" title="qlora_training.py">{`# pip install "transformers>=4.41" "peft>=0.11" "bitsandbytes>=0.43" accelerate datasets
import torch
from transformers import (
    AutoModelForCausalLM, AutoTokenizer,
    BitsAndBytesConfig, TrainingArguments,
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from trl import SFTTrainer
from datasets import load_dataset

MODEL_ID = "meta-llama/Llama-3-70B"

# Bước 1: Cấu hình QLoRA — NF4 + Double Quantization + BF16 compute
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",          # NormalFloat 4-bit (không phải "fp4"!)
    bnb_4bit_use_double_quant=True,     # tiết kiệm thêm ~0.37 bit/param
    bnb_4bit_compute_dtype=torch.bfloat16,  # tính toán bằng BF16 sau dequant
)

# Bước 2: Load base model ở 4-bit
model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    quantization_config=bnb_config,
    device_map="auto",
    torch_dtype=torch.bfloat16,
    trust_remote_code=False,
)
# 70B × 4.125 bit = ~36GB + overhead ≈ 38GB VRAM cho weights

# Bước 3: Chuẩn bị cho k-bit training (cast LN sang FP32, bật gradient checkpointing)
model = prepare_model_for_kbit_training(
    model, use_gradient_checkpointing=True
)

# Bước 4: Gắn LoRA adapter ở BF16 — chỉ phần này có gradient
lora_config = LoraConfig(
    r=16,                    # rank; 8-64 là phổ biến
    lora_alpha=32,           # thường = 2 × r
    target_modules=[         # Llama/Mistral: thường đủ 7 proj
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj",
    ],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
)
model = get_peft_model(model, lora_config)
model.print_trainable_parameters()
# trainable: ~30M (0.04% của 70B) → gradient + optimizer rất nhẹ

# Bước 5: Training args — dùng paged optimizer
training_args = TrainingArguments(
    output_dir="./qlora-llama3-70b",
    per_device_train_batch_size=1,
    gradient_accumulation_steps=16,
    learning_rate=2e-4,              # LR cao hơn full FT vì adapter nhỏ
    max_steps=1000,
    optim="paged_adamw_8bit",        # PAGED — trick tránh OOM
    lr_scheduler_type="cosine",
    warmup_ratio=0.03,
    bf16=True,                       # tính toán BF16
    logging_steps=10,
    save_steps=200,
    gradient_checkpointing=True,
)

# Bước 6: Train
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
dataset = load_dataset("timdettmers/openassistant-guanaco", split="train")

trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=dataset,
    args=training_args,
    dataset_text_field="text",
    max_seq_length=2048,
    peft_config=lora_config,
)
trainer.train()

# Bước 7: Lưu — chỉ adapter ~100MB
model.save_pretrained("./qlora-adapter")
# Inference sau này: load base model (có thể 4-bit) + merge adapter`}</CodeBlock>

          <p className="mt-4">
            <strong>Ví dụ code 2 — bitsandbytes low-level (hiểu NF4 dequant):</strong>
          </p>
          <CodeBlock language="python" title="bnb_nf4_internals.py">{`import torch
import bitsandbytes as bnb
from bitsandbytes.functional import quantize_nf4, dequantize_nf4

# Giả lập 1 layer linear weight 4096x4096 (giống Llama hidden size)
W_fp16 = torch.randn(4096, 4096, dtype=torch.float16, device="cuda") * 0.02

# Quantize sang NF4 — block size 64
W_nf4, quant_state = quantize_nf4(W_fp16, blocksize=64)

print(f"FP16 size: {W_fp16.nelement() * 2 / 1e6:.2f} MB")
print(f"NF4 size:  {W_nf4.nelement() / 2 / 1e6:.2f} MB (chia 2 vì pack 2 val/byte)")
print(f"→ Tỉ lệ nén: {2 * W_fp16.nelement() / W_nf4.nelement():.2f}x")

# Dequantize lại — chỉ dùng khi cần tính toán
W_recon = dequantize_nf4(W_nf4, quant_state)
err = (W_fp16 - W_recon).abs().mean().item()
print(f"Sai số trung bình |W - W_recon|: {err:.5f}")
print(f"Tương đối: {err / W_fp16.abs().mean().item() * 100:.2f}%")

# Forward giả: x @ W — cần dequant trước
x = torch.randn(1, 4096, dtype=torch.float16, device="cuda")
y_fp16 = x @ W_fp16
y_nf4  = x @ W_recon
print(f"|y_fp16 - y_nf4| mean: {(y_fp16 - y_nf4).abs().mean():.5f}")

# Trong thực tế, bnb.nn.Linear4bit tự làm bước dequant trong CUDA kernel
layer = bnb.nn.Linear4bit(
    4096, 4096,
    bias=False,
    compute_dtype=torch.bfloat16,
    quant_type="nf4",
)
layer.weight.data = W_fp16  # trước khi .cuda() được tự quantize`}</CodeBlock>

          {/* 4 callouts */}
          <Callout variant="info" title="NF4 có info-theoretic optimal — với điều kiện">
            Paper chứng minh NF4 là optimal cho tensor có phân bố chuẩn zero-mean, khi chia
            block và chuẩn hoá theo max-abs trong block. Nếu trọng số không Gaussian (ví dụ
            LayerNorm weight thường gần 1), dùng FP4 hoặc giữ FP16 sẽ tốt hơn. Đó là lý do{" "}
            <code>prepare_model_for_kbit_training</code> cast LN về FP32.
          </Callout>

          <Callout variant="warning" title="Hạn chế: tốc độ huấn luyện">
            QLoRA chậm hơn LoRA thuần 30-50% vì mỗi forward/backward phải dequantize
            NF4 → BF16. Trên H100 với FP8 tensor core, overhead này giảm đáng kể. Nếu bạn
            đã dư VRAM, LoRA thuần (FP16 base) nhanh hơn — đừng ép buộc dùng QLoRA.
          </Callout>

          <Callout variant="tip" title="Merge adapter sau khi train">
            Sau khi train, bạn có 2 lựa chọn: (1) load base NF4 + adapter runtime (tiết kiệm
            VRAM nhưng chậm), hoặc (2) merge adapter vào base FP16 rồi re-quantize bằng
            GPTQ/AWQ (nhanh hơn khi inference, nhưng tốn VRAM tạm thời để merge). Với
            production deploy, cách (2) thường đáng.
          </Callout>

          <Callout variant="tip" title="Guanaco — chứng minh thực nghiệm">
            Dettmers et al. huấn luyện Guanaco 65B bằng QLoRA trên 1 GPU 48GB trong 24
            giờ. Guanaco đạt 99.3% chất lượng ChatGPT trên Vicuna benchmark. Đây là bằng
            chứng QLoRA không phải &quot;nén bẩn&quot; — nếu pipeline đúng (NF4 + DQ +
            paged opt), chất lượng không thua full FT đáng kể.
          </Callout>

          {/* 2 CollapsibleDetails */}
          <CollapsibleDetail title="Chi tiết: tại sao block-wise quantization quan trọng?">
            <p className="text-sm leading-relaxed">
              Nếu bạn quantize toàn bộ tensor bằng 1 scale duy nhất (per-tensor), các
              giá trị outlier ở đuôi sẽ ép scale lớn và làm &quot;bẹt&quot; phần trung tâm —
              mất chính xác cho đa số trọng số. Block-wise (ví dụ block size 64) chia
              tensor thành nhiều khối nhỏ, mỗi khối có scale riêng.
            </p>
            <p className="text-sm leading-relaxed mt-2">
              Ví dụ: tensor 4096×4096 với block size 64 → 262144 blocks, mỗi block 1
              scale FP32 = 1 MB overhead. Nhỏ so với 16 MB của tensor NF4 packed. Trade:
              granularity cao hơn → chất lượng tốt hơn, nhưng overhead scale lớn dần.
              Block 64 là sweet spot thực nghiệm.
            </p>
            <p className="text-sm leading-relaxed mt-2">
              Một điểm tinh tế: <strong>outlier channels</strong>{" "}trong LLM (đặc biệt ở
              attention projection) có magnitude lớn hơn 100x trung bình. SmoothQuant và
              AWQ xử lý outlier bằng cách scale input tensor trước; QLoRA đơn giản hơn —
              block size nhỏ đã đủ vì mỗi block tự co giãn.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="So sánh NF4 vs FP4 vs INT4 — số liệu paper">
            <p className="text-sm leading-relaxed">
              Paper QLoRA (Table 2) so sánh perplexity trên LLaMA-7B sau 4-bit quantization
              (không fine-tune):
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-sm mt-2">
              <li><strong>FP16 baseline:</strong> 5.68 PPL</li>
              <li><strong>NF4 + DQ (block 64):</strong> 5.73 PPL (+0.9%)</li>
              <li><strong>FP4 (block 64):</strong> 5.79 PPL (+1.9%)</li>
              <li><strong>INT4 (block 64):</strong> 5.88 PPL (+3.5%)</li>
              <li><strong>INT4 (per-tensor):</strong> 7.21 PPL (+27%!)</li>
            </ul>
            <p className="text-sm leading-relaxed mt-2">
              Kết luận: (1) block-wise bắt buộc, per-tensor INT4 không dùng được cho LLM;
              (2) NF4 nhỉnh hơn FP4 nhẹ, cả hai vượt INT4; (3) Double Quantization
              không làm giảm chất lượng có thể đo được.
            </p>
            <p className="text-sm leading-relaxed mt-2">
              Sau fine-tune bằng QLoRA (adapter r=64 lên tất cả linear), khoảng cách
              perplexity càng thu hẹp — thường dưới 0.3% giữa QLoRA và full FT. Đây là lý
              do cộng đồng open-source gần như mặc định chọn QLoRA cho mọi SFT trên model
              ≥7B: không có lý do thực tế để chi gấp 10 lần tiền thuê GPU.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Khi nào QLoRA KHÔNG phải lựa chọn tốt?">
            <p className="text-sm leading-relaxed">
              QLoRA không phải &quot;luôn luôn tốt&quot;. Có vài kịch bản nên bỏ qua:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-sm mt-2">
              <li>
                <strong>Model &lt; 7B và VRAM dư:</strong>{" "}chạy full FT hoặc LoRA FP16
                nhanh hơn 2-3x, chất lượng nhỉnh hơn 0.5-1%. QLoRA chỉ đáng khi VRAM
                là rào cản.
              </li>
              <li>
                <strong>Continued pre-training trên domain rất khác:</strong>{" "}nếu bạn cần
                dạy model kiến thức hoàn toàn mới (ví dụ ngôn ngữ chưa từng thấy), adapter
                rank nhỏ không đủ expressive. Cân nhắc full FT hoặc tăng rank lên 128-256.
              </li>
              <li>
                <strong>Inference với throughput cực cao:</strong>{" "}LoRA adapter runtime
                làm matmul thêm; nếu bạn deploy với vLLM/TensorRT cần tốc độ tối đa, hãy
                merge adapter vào base rồi quantize lại bằng AWQ.
              </li>
              <li>
                <strong>H100 với FP8 tensor core:</strong>{" "}FP8 mixed precision training
                (Transformer Engine) có thể đạt hiệu suất tương đương QLoRA về VRAM mà
                không chậm — kiểm tra nếu có sẵn H100.
              </li>
            </ul>
          </CollapsibleDetail>

          <CollapsibleDetail title="Paged Optimizer — cơ chế bên trong">
            <p className="text-sm leading-relaxed">
              NVIDIA Unified Memory cho phép cấp phát bộ nhớ được GPU và CPU cùng thấy.
              Driver tự migrate page (4KB-2MB) khi cần. Paged Optimizer của bitsandbytes
              khai thác điều này: optimizer state (Adam m, v) được cấp phát qua
              <code>cudaMallocManaged</code>{" "}thay vì{" "}<code>cudaMalloc</code>.
            </p>
            <p className="text-sm leading-relaxed mt-2">
              Khi kernel forward/backward cần VRAM cho activation tạm (ví dụ sequence dài
              đột ngột 8192 token), driver tự đẩy trang optimizer ít dùng xuống CPU RAM.
              Sau khi kernel xong, trang được đẩy lại GPU khi optimizer step chạy.
              Overhead: ~10-20% cho bước nào thực sự page fault, 0% cho bước không có spike.
            </p>
            <p className="text-sm leading-relaxed mt-2">
              So với CPU offloading thủ công (DeepSpeed ZeRO stage 3), paged optimizer
              đơn giản hơn nhiều (không cần config) và thường đủ cho single-GPU QLoRA.
              Với multi-GPU, DeepSpeed/FSDP vẫn cần thiết cho sharding gradient.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Roadmap phiên bản QLoRA mới — INT2, 1-bit">
            <p className="text-sm leading-relaxed">
              Từ sau QLoRA (2023), cộng đồng đã đẩy tiếp giới hạn:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-sm mt-2">
              <li>
                <strong>LoftQ (2023):</strong>{" "}khởi tạo adapter bằng SVD của lỗi
                quantization, đạt chất lượng tốt hơn NF4 thuần ~0.5 PPL.
              </li>
              <li>
                <strong>QA-LoRA (2024):</strong>{" "}group-wise quantization cho adapter,
                tiết kiệm thêm 10-15% VRAM.
              </li>
              <li>
                <strong>BitNet b1.58 (2024):</strong>{" "}huấn luyện từ đầu với trọng số 3
                trạng thái {"{-1, 0, 1}"}, không cần dequantize runtime.
              </li>
              <li>
                <strong>AQLM (2024):</strong>{" "}Additive Quantization đạt 2-bit per weight
                với chất lượng gần NF4 — mở đường cho QLoRA-2bit.
              </li>
            </ul>
            <p className="text-sm leading-relaxed mt-2">
              Xu hướng rõ: với hardware mới (H100 FP8, MI300), mỗi năm ta vượt 1 giới hạn
              bit. Nhưng QLoRA (NF4 + DQ + Paged) vẫn là baseline thực tế nhất năm 2024-2025
              vì có ecosystem chín (PEFT, TRL, Axolotl, Unsloth).
            </p>
          </CollapsibleDetail>

          {/* Applications */}
          <p className="mt-5 text-sm font-semibold text-foreground">Ứng dụng thực tế:</p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <strong>Indie fine-tuning:</strong>{" "}cá nhân / startup fine-tune Llama 70B
              cho domain tiếng Việt, y tế, luật trên 1 RTX 6000 Ada 48GB.
            </li>
            <li>
              <strong>Enterprise SFT:</strong>{" "}nội bộ công ty, thay vì cluster 8 GPU,
              chỉ cần 1-2 A100 cho fine-tune hàng loạt.
            </li>
            <li>
              <strong>Research prototyping:</strong>{" "}thử nghiệm nhanh ý tưởng trên model
              lớn mà không chờ queue cluster.
            </li>
            <li>
              <strong>Domain adapter hub:</strong>{" "}mỗi adapter chỉ ~100MB — có thể host
              hàng ngàn adapter chuyên biệt trên 1 base model.
            </li>
            <li>
              <strong>Instruction tuning:</strong>{" "}Guanaco, OpenAssistant, Alpaca-style
              dataset — hầu hết open-source đều train bằng QLoRA.
            </li>
          </ul>

          {/* Pitfalls */}
          <p className="mt-5 text-sm font-semibold text-foreground">Pitfall thường gặp:</p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <strong>Quên prepare_model_for_kbit_training:</strong>{" "}LN và LM head phải
              cast FP32/FP16 để gradient stable. Thiếu bước này → NaN loss sau vài step.
            </li>
            <li>
              <strong>Target modules sai:</strong>{" "}chỉ gắn LoRA vào q_proj/v_proj bỏ qua
              MLP → chất lượng kém 2-3%. Thực nghiệm: gắn đủ 7 proj tốt hơn hẳn.
            </li>
            <li>
              <strong>Batch size quá lớn:</strong>{" "}gradient checkpointing + paged
              optimizer vẫn có giới hạn. Bắt đầu với batch 1 + grad accum 16-32.
            </li>
            <li>
              <strong>Dùng SDPA sai kernel:</strong>{" "}flash-attention-2 không hỗ trợ 4-bit
              trực tiếp — phải dùng fallback. Đo speed trước khi ép buộc attention backend.
            </li>
            <li>
              <strong>Merge adapter sai cách:</strong>{" "}merge vào base NF4 sẽ mất chất
              lượng (quantize 2 lần). Luôn merge vào base FP16/BF16.
            </li>
            <li>
              <strong>LR sai:</strong>{" "}LR cho QLoRA thường 2e-4 đến 3e-4 — cao hơn full
              FT (1e-5) vì adapter nhỏ. Dùng LR full-FT → underfit nặng.
            </li>
          </ul>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ 8. SUMMARY ━━━ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về QLoRA"
          points={[
            "QLoRA = Quantize base model xuống NF4 (4-bit) + LoRA adapter BF16 — tiết kiệm ~70% VRAM so với LoRA FP16, ~90% so với full fine-tuning.",
            "Ba đổi mới cốt lõi: NF4 (info-theoretic optimal cho Gaussian), Double Quantization (~0.37 bit/param extra), Paged Optimizers (chống OOM spike).",
            "Cho phép fine-tune 70B trên 1 GPU 48GB, 33B trên RTX 4090 24GB — dân chủ hoá fine-tuning LLM lớn cho cá nhân và startup.",
            "Trade-off: chậm hơn LoRA thuần 30-50% do dequant-on-the-fly, nhưng chất lượng gần tương đương full FT (Guanaco 65B đạt 99.3% ChatGPT).",
            "Pipeline chuẩn: BitsAndBytesConfig(load_in_4bit, nf4, double_quant, bf16 compute) + prepare_model_for_kbit_training + LoRA(r=16) + paged_adamw_8bit.",
            "Pitfall: quên prepare k-bit training, target modules thiếu MLP, LR quá thấp (dùng 2e-4 chứ không phải 1e-5), merge adapter vào base NF4.",
          ]}
        />
      </LessonSection>

      {/* ━━━ QUIZ ━━━ */}
      <LessonSection step={TOTAL_STEPS} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
