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
  slug: "quantization",
  title: "Quantization",
  titleVi: "Lượng tử hóa mô hình",
  description:
    "Kỹ thuật giảm kích thước mô hình bằng cách giảm độ chính xác số học, từ FP32 xuống INT8/INT4.",
  category: "training-optimization",
  tags: ["quantization", "optimization", "inference", "compression"],
  difficulty: "advanced",
  relatedSlugs: ["qlora", "pruning", "mixed-precision"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

// ════════════════════════════════════════════════════════════════════════════
// DỮ LIỆU: Các mức precision, số bin, accuracy drop (ước lượng thực nghiệm)
// Llama-7B benchmark perplexity (c4):
//   FP32 = FP16 ≈ 5.68 (baseline)
//   INT8 = 5.70 (+0.35%)
//   INT4 (GPTQ) = 5.78 (+1.75%)
//   INT2 = 7.80 (+37%) — thường không dùng được trực tiếp
// ════════════════════════════════════════════════════════════════════════════

type PrecisionSpec = {
  name: string;
  bits: number;
  bins: number;
  sizeRatio: number; // % so với FP32
  quality: number; // % so với FP32
  speed: number; // relative speedup
  color: string;
  example: string; // biểu diễn số pi
  description: string;
  llama70bGB: number;
};

const PRECISIONS: PrecisionSpec[] = [
  {
    name: "FP32",
    bits: 32,
    bins: Number.MAX_SAFE_INTEGER,
    sizeRatio: 100,
    quality: 100,
    speed: 1.0,
    color: "#3b82f6",
    example: "3.14159265",
    description: "32 bit IEEE 754 — baseline chính xác. Dùng để huấn luyện & kiểm chứng.",
    llama70bGB: 280,
  },
  {
    name: "FP16/BF16",
    bits: 16,
    bins: 65536,
    sizeRatio: 50,
    quality: 99.95,
    speed: 2.0,
    color: "#8b5cf6",
    example: "3.14160",
    description: "16 bit half-precision — mất vài chữ số cuối. Mặc định huấn luyện hiện đại.",
    llama70bGB: 140,
  },
  {
    name: "INT8",
    bits: 8,
    bins: 256,
    sizeRatio: 25,
    quality: 99.5,
    speed: 3.5,
    color: "#f59e0b",
    example: "3.14",
    description: "8 bit integer — dùng phổ biến cho inference. Hỗ trợ native GPU (Tensor Core).",
    llama70bGB: 70,
  },
  {
    name: "INT4",
    bits: 4,
    bins: 16,
    sizeRatio: 12.5,
    quality: 97.5,
    speed: 4.5,
    color: "#22c55e",
    example: "3.1",
    description: "4 bit — chìa khoá chạy LLM trên consumer GPU. GPTQ/AWQ/NF4.",
    llama70bGB: 35,
  },
  {
    name: "INT2",
    bits: 2,
    bins: 4,
    sizeRatio: 6.25,
    quality: 78,
    speed: 5.5,
    color: "#ef4444",
    example: "3.0",
    description: "2 bit — thực nghiệm (AQLM, BitNet). Mất chất lượng đáng kể trừ khi dùng QAT đặc biệt.",
    llama70bGB: 17.5,
  },
];

type Method = {
  name: string;
  shortName: string;
  type: "PTQ" | "QAT";
  needData: string;
  trainCost: string;
  qualityAt4bit: number;
  speed: string;
  color: string;
  desc: string;
  good: string[];
  bad: string[];
};

const METHODS: Method[] = [
  {
    name: "Post-Training Quantization (PTQ)",
    shortName: "PTQ",
    type: "PTQ",
    needData: "128-1024 mẫu calibration",
    trainCost: "Vài phút - vài giờ trên 1 GPU",
    qualityAt4bit: 97,
    speed: "Không ảnh hưởng inference",
    color: "#f59e0b",
    desc: "Lượng tử hoá sau khi đã train xong. Nhanh, đơn giản, không cần re-train.",
    good: [
      "Không cần dữ liệu huấn luyện gốc",
      "Nhanh — vài phút cho 7B, vài giờ cho 70B",
      "Không rủi ro overfitting",
    ],
    bad: [
      "Chất lượng kém hơn QAT ở ≤4 bit",
      "Nhạy với outlier nếu không xử lý (SmoothQuant giải quyết)",
      "Không tận dụng được loss signal",
    ],
  },
  {
    name: "Quantization-Aware Training (QAT)",
    shortName: "QAT",
    type: "QAT",
    needData: "Toàn bộ dataset + GPU cluster",
    trainCost: "Hàng ngày - hàng tuần",
    qualityAt4bit: 99,
    speed: "Không ảnh hưởng inference",
    color: "#22c55e",
    desc: "Mô phỏng quantization trong forward pass khi train. Mô hình học 'bù' lỗi.",
    good: [
      "Chất lượng gần như không mất ở 4-bit",
      "Hoạt động cả ở 2-bit (BitNet, AQLM)",
      "Phù hợp deployment target cực thấp",
    ],
    bad: [
      "Chi phí train gấp 1.3-2x",
      "Cần pipeline phức tạp (fake quant nodes)",
      "Thường chỉ các lab lớn làm được cho model >13B",
    ],
  },
];

type QuantAlgo = {
  name: string;
  bits: number;
  method: "PTQ" | "Hybrid";
  hardware: string;
  ppl: number; // Llama-7B
  speed: string;
  color: string;
  desc: string;
};

const ALGOS: QuantAlgo[] = [
  {
    name: "GPTQ",
    bits: 4,
    method: "PTQ",
    hardware: "GPU (CUDA)",
    ppl: 5.78,
    speed: "3-4x",
    color: "#f59e0b",
    desc: "Lượng tử hoá layer-by-layer dùng thông tin Hessian. Chuẩn de-facto cho 4-bit GPU.",
  },
  {
    name: "AWQ",
    bits: 4,
    method: "PTQ",
    hardware: "GPU (CUDA)",
    ppl: 5.75,
    speed: "3-4x",
    color: "#a855f7",
    desc: "Bảo vệ kênh outlier salient (1% trọng số quan trọng nhất). Chất lượng nhỉnh hơn GPTQ.",
  },
  {
    name: "NF4 (bnb)",
    bits: 4,
    method: "PTQ",
    hardware: "GPU (CUDA)",
    ppl: 5.73,
    speed: "1.5-2x",
    color: "#22c55e",
    desc: "NormalFloat 4-bit — dùng trong QLoRA. Chậm hơn khi inference, nhanh để fine-tune.",
  },
  {
    name: "GGUF (llama.cpp)",
    bits: 4,
    method: "PTQ",
    hardware: "CPU + Metal/CUDA",
    ppl: 5.80,
    speed: "1-3x",
    color: "#06b6d4",
    desc: "Format K-quants cho llama.cpp, chạy local trên Mac/laptop. Q4_K_M, Q5_K_M phổ biến.",
  },
  {
    name: "SmoothQuant",
    bits: 8,
    method: "PTQ",
    hardware: "GPU (CUDA)",
    ppl: 5.71,
    speed: "2-3x",
    color: "#ec4899",
    desc: "Tiền xử lý: smooth outlier input trước khi quantize INT8. Tốc độ cao nhất.",
  },
];

// ════════════════════════════════════════════════════════════════════════════
// QUIZ — 8 câu
// ════════════════════════════════════════════════════════════════════════════

const QUIZ: QuizQuestion[] = [
  {
    question: "Tại sao lượng tử hoá INT4 có thể giảm 8x kích thước mà chỉ mất ~3% chất lượng?",
    options: [
      "Vì mô hình có nhiều tham số dư thừa",
      "Vì trọng số mạng nơ-ron có phân bố tập trung (gần Gaussian), hầu hết giá trị gần nhau nên làm tròn mất rất ít thông tin",
      "Vì INT4 dùng GPU hiệu quả hơn FP32",
      "Vì 4 bit vẫn đủ biểu diễn mọi số thực",
    ],
    correct: 1,
    explanation:
      "Trọng số neural network phân bố gần Gaussian — hầu hết tập trung quanh 0. 16 mức lượng tử (4-bit) đặt dày ở vùng này vẫn bao phủ phần lớn năng lượng signal. Thông tin bị mất chủ yếu ở outlier, và NN cũng không dùng outlier quan trọng lắm.",
  },
  {
    question: "Phân biệt PTQ và QAT:",
    options: [
      "PTQ áp dụng sau khi train, QAT mô phỏng quantization trong forward pass khi train để model 'thích nghi'",
      "PTQ tốt hơn QAT trong mọi trường hợp",
      "QAT không cần dữ liệu huấn luyện",
      "PTQ chỉ dùng cho INT8, QAT chỉ cho INT4",
    ],
    correct: 0,
    explanation:
      "PTQ (Post-Training Quantization) nhanh — chỉ cần calibration data. QAT (Quantization-Aware Training) có fake-quant node trong forward pass, loss chảy ngược qua straight-through estimator, model học cách bù lỗi quantization — chất lượng tốt hơn ở ≤4-bit.",
  },
  {
    question: "Mô hình Llama 3 70B ở FP16 chiếm 140GB. Quantize INT4 chiếm bao nhiêu?",
    options: [
      "70GB", "35GB", "17.5GB", "10GB",
    ],
    correct: 1,
    explanation:
      "FP16 = 16 bit/param, INT4 = 4 bit/param. Tỷ lệ = 4/16 = 1/4. Nên 140GB / 4 = 35GB — vừa đủ RTX 6000 Ada 48GB, hoặc RTX 4090 24GB với offloading.",
  },
  {
    type: "fill-blank",
    question:
      "Sắp xếp từ chính xác nhất đến nén nhất: {blank} (32 bit) → FP16 (16 bit) → {blank} (8 bit) → INT4 (4 bit).",
    blanks: [
      { answer: "FP32", accept: ["fp32", "float32"] },
      { answer: "INT8", accept: ["int8"] },
    ],
    explanation:
      "FP32 là baseline huấn luyện chính xác nhất. FP16 giảm nửa bộ nhớ với ~0% mất mát. INT8 dùng phổ biến cho inference (giảm 4x so với FP32). INT4 dùng cho deployment cực nén.",
  },
  {
    question: "Trong công thức y_q = round(x/s) + z, s và z là gì?",
    options: [
      "s là sigmoid, z là zero-attention",
      "s là scale factor (độ phân giải mỗi bin), z là zero-point (giá trị 0 ánh xạ tới bin nào)",
      "s là softmax, z là dropout",
      "s là step, z là zoom",
    ],
    correct: 1,
    explanation:
      "Scale s quyết định giá trị liên tục nào tương ứng với 1 đơn vị integer. Zero-point z điều chỉnh lệch, cho phép biểu diễn phân bố không đối xứng quanh 0 (asymmetric quantization).",
  },
  {
    question: "GPTQ khác AWQ ở ý tưởng chính nào?",
    options: [
      "GPTQ nhanh hơn, AWQ chậm hơn",
      "GPTQ tối thiểu lỗi tái tạo layer-by-layer dùng Hessian; AWQ bảo vệ 1% kênh salient có magnitude activation lớn",
      "GPTQ chỉ cho INT4, AWQ chỉ cho INT8",
      "GPTQ là PTQ, AWQ là QAT",
    ],
    correct: 1,
    explanation:
      "GPTQ coi mỗi layer linear là bài toán lstsq và tối ưu reconstruction error với Hessian khối. AWQ quan sát rằng chỉ 1% kênh (identify qua activation magnitude) mang thông tin — scale riêng các kênh này trước khi quantize. AWQ thường tốt hơn 0.2-0.5 PPL.",
  },
  {
    question: "Một dev muốn chạy Llama 13B trên MacBook M2. Format nào phù hợp nhất?",
    options: [
      "GPTQ 4-bit",
      "AWQ 4-bit",
      "NF4 (bitsandbytes)",
      "GGUF Q4_K_M (llama.cpp)",
    ],
    correct: 3,
    explanation:
      "GPTQ/AWQ/NF4 đều cần CUDA. GGUF là format của llama.cpp, tối ưu cho CPU + Metal (Apple Silicon). Q4_K_M = K-quant 4-bit medium, cân bằng chất lượng-tốc độ. Chạy Llama 13B ~8GB RAM trên Mac.",
  },
  {
    question: "Outlier trong activation LLM là vấn đề gì với quantization?",
    options: [
      "Không phải vấn đề — chỉ là nhiễu",
      "Vài kênh có magnitude 100-1000x kênh khác; nếu per-tensor quantize, scale bị outlier ép lớn làm bẹt các kênh thường — mất chất lượng nặng",
      "Outlier làm model chạy chậm hơn",
      "Outlier chỉ ảnh hưởng đến FP32",
    ],
    correct: 1,
    explanation:
      "LLM 6B+ có 'emergent outlier channels' (Dettmers 2022) — vài kênh attention/FFN có activation magnitude cực lớn. Per-tensor INT8 làm model sụp. Giải pháp: per-channel quantize, SmoothQuant (scale input để đẩy outlier sang weight), hoặc mixed-precision (FP16 cho kênh outlier).",
  },
];

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT CHÍNH
// ════════════════════════════════════════════════════════════════════════════

export default function QuantizationTopic() {
  const [precIdx, setPrecIdx] = useState(0); // FP32 mặc định
  const [methodIdx, setMethodIdx] = useState(0); // PTQ mặc định
  const [showDist, setShowDist] = useState(true);

  const current = PRECISIONS[precIdx];

  // Sinh mẫu trọng số theo phân bố chuẩn (cố định seed để ổn định)
  const samples = useMemo(() => {
    const rng = (() => {
      let s = 42;
      return () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
      };
    })();
    const arr: number[] = [];
    for (let i = 0; i < 2000; i++) {
      // Box-Muller
      const u1 = rng();
      const u2 = rng();
      const z = Math.sqrt(-2 * Math.log(u1 + 1e-9)) * Math.cos(2 * Math.PI * u2);
      arr.push(z * 0.3); // std 0.3 giống layer Llama
    }
    return arr;
  }, []);

  // Tính quant bins cho precision hiện tại (symmetric INT-style)
  const bins = useMemo(() => {
    const n = Math.min(current.bins, 64);
    const maxAbs = 1.2; // range cắt ± 4σ
    const step = (2 * maxAbs) / n;
    const arr: number[] = [];
    for (let i = 0; i < n; i++) {
      arr.push(-maxAbs + (i + 0.5) * step);
    }
    return arr;
  }, [current.bins]);

  // Tính histogram
  const histogram = useMemo(() => {
    const bucketCount = 50;
    const minV = -1.5;
    const maxV = 1.5;
    const bucketW = (maxV - minV) / bucketCount;
    const buckets = new Array(bucketCount).fill(0);
    for (const v of samples) {
      const idx = Math.floor((v - minV) / bucketW);
      if (idx >= 0 && idx < bucketCount) buckets[idx]++;
    }
    const maxC = Math.max(...buckets);
    return buckets.map((c, i) => ({
      x: minV + i * bucketW,
      c,
      norm: c / maxC,
    }));
  }, [samples]);

  const currentMethod = METHODS[methodIdx];

  return (
    <>
      {/* ━━━ 1. HOOK ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Mô hình Llama 3 70B chiếm 140GB ở FP16 — cần 2 GPU A100 80GB. Có cách nào chạy trên 1 GPU 24GB?"
          options={[
            "Không thể — cần mua thêm GPU",
            "Giảm độ chính xác từ 16 bit xuống 4 bit — mô hình nhỏ đi 4 lần mà gần như không mất chất lượng",
            "Xoá bớt 75% tham số của mô hình",
            "Chạy trên CPU cho rẻ",
          ]}
          correct={1}
          explanation="Lượng tử hoá giảm số bit biểu diễn mỗi tham số. Từ FP16 (16 bit) xuống INT4 (4 bit) = giảm 4x kích thước. 140GB → 35GB — vừa 1 GPU RTX 6000 Ada hoặc 2×RTX 4090!"
        >
          <p className="text-sm text-muted mt-2">
            Giống như nén ảnh RAW 50MB thành JPEG 5MB — mắt thường không phân biệt được.
            Đây là chìa khoá giúp LLM từ &quot;đặc quyền datacenter&quot; trở thành
            &quot;chạy trên laptop&quot;.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ 2. ANALOGY ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Ẩn dụ">
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-base font-semibold text-foreground">
            Ẩn dụ: Thước đo nhiệt độ
          </h3>
          <p className="text-sm text-muted leading-relaxed">
            Nhiệt kế điện tử hiển thị <strong>25.347°C</strong>. Nhiệt kế cơ học chỉ
            <strong>25°C</strong>. Bạn cần độ chính xác nào để quyết định bật quạt? Cả hai
            đều được — não bạn chỉ quan tâm &quot;nóng hay lạnh&quot;. Con số thập phân sau
            đâu tạo ra quyết định khác.
          </p>

          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { label: "FP32", ex: "25.34691°C", note: "Nhiệt kế chuyên dụng phòng thí nghiệm" },
              { label: "FP16", ex: "25.35°C", note: "Nhiệt kế thường dùng trong nhà" },
              { label: "INT8", ex: "25.3°C", note: "Nhiệt kế y tế" },
              { label: "INT4", ex: "25°C", note: "Nhiệt kế cơ đơn giản" },
            ].map((c, i) => (
              <div key={i} className="rounded-lg border border-border bg-background/40 p-3">
                <p className="text-sm font-semibold text-foreground">{c.label}</p>
                <p className="text-xs text-muted mt-1">{c.ex}</p>
                <p className="text-xs text-muted mt-1 italic">{c.note}</p>
              </div>
            ))}
          </div>

          <p className="text-sm text-muted leading-relaxed">
            Trọng số mạng nơ-ron giống nhiệt độ: giá trị chính xác đến 5 chữ số không làm
            model trả lời tốt hơn so với 1 chữ số. <strong>Lượng tử hoá</strong>{" "}khai
            thác chính điều này: giảm độ chính xác xuống mức mà kết quả cuối cùng gần như
            không đổi, trong khi tiết kiệm được 4x-8x bộ nhớ.
          </p>
        </div>
      </LessonSection>

      {/* ━━━ 3. VISUALIZATION ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Lượng tử hoá — trực quan trên phân bố trọng số
          </h3>
          <p className="text-sm text-muted mb-4">
            Phân bố trọng số (bell curve) + các mức quantization. Chọn mức bit để xem
            số bin và độ tròn.
          </p>

          {/* Tabs precision */}
          <div className="flex flex-wrap gap-2 mb-4">
            {PRECISIONS.map((p, i) => (
              <button
                key={i}
                onClick={() => setPrecIdx(i)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  precIdx === i
                    ? "text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
                style={precIdx === i ? { backgroundColor: p.color } : {}}
              >
                {p.name} ({p.bits}-bit)
              </button>
            ))}
          </div>

          {/* Distribution viz */}
          <div className="rounded-xl border border-border bg-background/40 p-4 mb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-foreground">
                Phân bố trọng số + {current.bins < 1000 ? `${current.bins} bin lượng tử` : "liên tục"}
              </p>
              <button
                onClick={() => setShowDist(!showDist)}
                className="text-xs text-muted hover:text-foreground underline"
              >
                {showDist ? "Ẩn phân bố" : "Hiện phân bố"}
              </button>
            </div>

            <svg viewBox="0 0 640 220" className="w-full">
              {/* Axis */}
              <line x1="40" y1="180" x2="620" y2="180" stroke="var(--border)" strokeWidth="1" />
              {[-1.5, -1, -0.5, 0, 0.5, 1, 1.5].map((v) => {
                const x = 40 + ((v + 1.5) / 3) * 580;
                return (
                  <g key={v}>
                    <line x1={x} y1="178" x2={x} y2="184" stroke="var(--border)" strokeWidth="1" />
                    <text x={x} y="197" textAnchor="middle" fill="var(--text-tertiary)" fontSize="11">
                      {v}
                    </text>
                  </g>
                );
              })}

              {/* Histogram bars */}
              {showDist &&
                histogram.map((h, i) => {
                  const x = 40 + ((h.x + 1.5) / 3) * 580;
                  const w = (1 / histogram.length) * 580 - 1;
                  const height = h.norm * 160;
                  return (
                    <rect
                      key={i}
                      x={x}
                      y={180 - height}
                      width={w}
                      height={height}
                      fill="#3b82f6"
                      opacity={0.5}
                    />
                  );
                })}

              {/* Gaussian overlay */}
              {showDist && (
                <path
                  d={(() => {
                    const pts: string[] = [];
                    for (let i = 0; i <= 100; i++) {
                      const v = -1.5 + (i / 100) * 3;
                      const y = Math.exp(-(v * v) / (2 * 0.3 * 0.3));
                      const sx = 40 + ((v + 1.5) / 3) * 580;
                      const sy = 180 - y * 160;
                      pts.push(`${i === 0 ? "M" : "L"}${sx.toFixed(1)},${sy.toFixed(1)}`);
                    }
                    return pts.join(" ");
                  })()}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="1.5"
                  strokeDasharray="3,2"
                />
              )}

              {/* Quantization bins */}
              {current.bins <= 256 &&
                bins.map((b, i) => {
                  const x = 40 + ((b + 1.5) / 3) * 580;
                  if (x < 40 || x > 620) return null;
                  return (
                    <g key={i}>
                      <line
                        x1={x}
                        y1="30"
                        x2={x}
                        y2="180"
                        stroke={current.color}
                        strokeWidth={current.bins <= 32 ? 1.2 : 0.5}
                        opacity={current.bins <= 32 ? 0.85 : 0.3}
                      />
                      {current.bins <= 16 && (
                        <circle cx={x} cy="180" r="3" fill={current.color} />
                      )}
                    </g>
                  );
                })}

              {/* Labels */}
              <text x="40" y="24" fill="var(--text-primary)" fontSize="11" fontWeight="bold">
                {current.name} — {current.bins > 1000 ? "≥65k bin (gần như liên tục)" : `${current.bins} bin`}
              </text>
              <text x="620" y="24" textAnchor="end" fill={current.color} fontSize="11">
                Chất lượng: {current.quality}%
              </text>
            </svg>

            <p className="text-xs text-muted mt-2 leading-relaxed">
              <strong>FP32/FP16:</strong>{" "}hầu như liên tục — mọi giá trị phân biệt được.
              <strong>{" "}INT8:</strong>{" "}256 bin — đủ mịn, mất &lt;0.5% chất lượng.
              <strong>{" "}INT4:</strong>{" "}chỉ 16 bin, mỗi giá trị được làm tròn tới 1
              trong 16 mức — vẫn đủ tốt vì trọng số tập trung quanh 0.
              <strong>{" "}INT2:</strong>{" "}chỉ 4 bin — mất nhiều thông tin, cần kỹ thuật
              QAT đặc biệt để dùng được.
            </p>
          </div>

          {/* Bit progression — accuracy drop chart */}
          <div className="rounded-xl border border-border bg-background/40 p-4 mb-5">
            <p className="text-sm font-semibold text-foreground mb-3">
              Accuracy drop theo số bit (Llama-7B, c4 perplexity)
            </p>

            <svg viewBox="0 0 640 220" className="w-full">
              {/* Axis */}
              <line x1="60" y1="20" x2="60" y2="180" stroke="var(--border)" strokeWidth="1" />
              <line x1="60" y1="180" x2="620" y2="180" stroke="var(--border)" strokeWidth="1" />

              {/* Y ticks */}
              {[70, 80, 90, 100].map((v) => {
                const y = 180 - ((v - 70) / 30) * 160;
                return (
                  <g key={v}>
                    <line x1="58" y1={y} x2="62" y2={y} stroke="var(--border)" strokeWidth="1" />
                    <text x="55" y={y + 3} textAnchor="end" fill="var(--text-tertiary)" fontSize="11">
                      {v}%
                    </text>
                    <line x1="60" y1={y} x2="620" y2={y} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2,3" opacity="0.3" />
                  </g>
                );
              })}

              {/* Data points line */}
              <path
                d={PRECISIONS.map((p, i) => {
                  const x = 100 + i * 120;
                  const y = 180 - ((p.quality - 70) / 30) * 160;
                  return `${i === 0 ? "M" : "L"}${x},${y}`;
                }).join(" ")}
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="2"
              />

              {/* Points */}
              {PRECISIONS.map((p, i) => {
                const x = 100 + i * 120;
                const y = 180 - ((p.quality - 70) / 30) * 160;
                const isSelected = precIdx === i;
                return (
                  <g key={i}>
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 8 : 5}
                      fill={p.color}
                      stroke="white"
                      strokeWidth={isSelected ? 2 : 1}
                    />
                    <text x={x} y="200" textAnchor="middle" fill="var(--text-secondary)" fontSize="11" fontWeight={isSelected ? "bold" : "normal"}>
                      {p.name}
                    </text>
                    <text x={x} y={y - 14} textAnchor="middle" fill={p.color} fontSize="11" fontWeight="bold">
                      {p.quality}%
                    </text>
                  </g>
                );
              })}
            </svg>

            <p className="text-xs text-muted mt-2 leading-relaxed">
              Chất lượng gần như không đổi từ FP32 xuống INT8. Mất nhẹ ở INT4 (~2.5%).
              Vách đá rõ ở INT2 — cần QAT hoặc method đặc biệt (AQLM, BitNet) để
              dùng được.
            </p>
          </div>

          {/* Model sizes across precisions */}
          <div className="rounded-xl border border-border bg-background/40 p-4 mb-5">
            <p className="text-sm font-semibold text-foreground mb-3">
              Llama 70B ở các mức precision
            </p>
            <div className="space-y-2">
              {PRECISIONS.map((p, i) => {
                const barWidth = (p.llama70bGB / 280) * 100;
                const isSelected = precIdx === i;
                return (
                  <div key={i} className="flex items-center gap-3 text-sm" style={{ opacity: isSelected ? 1 : 0.6 }}>
                    <span className="w-20 text-right font-medium text-foreground">{p.name}</span>
                    <div className="flex-1 relative h-6 bg-card border border-border rounded overflow-hidden">
                      <div
                        className="h-full rounded"
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: p.color,
                          opacity: 0.85,
                        }}
                      />
                      <span
                        className="absolute top-0 bottom-0 flex items-center px-2 text-xs font-bold"
                        style={{ left: `${Math.min(barWidth + 1, 82)}%`, color: p.color }}
                      >
                        {p.llama70bGB} GB
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted mt-3 leading-relaxed">
              Cùng mô hình 70B: từ 280GB (FP32, cần cluster) xuống 17.5GB (INT2, chạy
              laptop). INT4 là sweet spot — 35GB vừa RTX 6000 Ada / 2×RTX 4090 với
              chất lượng ~97.5%.
            </p>
          </div>

          {/* PTQ vs QAT comparison */}
          <div className="rounded-xl border border-border bg-background/40 p-4 mb-5">
            <p className="text-sm font-semibold text-foreground mb-3">
              PTQ vs QAT — khi nào dùng cái nào?
            </p>

            <div className="flex gap-2 mb-4">
              {METHODS.map((m, i) => (
                <button
                  key={i}
                  onClick={() => setMethodIdx(i)}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    methodIdx === i
                      ? "text-white"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                  style={methodIdx === i ? { backgroundColor: m.color } : {}}
                >
                  {m.shortName}: {m.type}
                </button>
              ))}
            </div>

            <div className="rounded-lg border border-border bg-background/60 p-4">
              <p className="text-base font-semibold" style={{ color: currentMethod.color }}>
                {currentMethod.name}
              </p>
              <p className="text-sm text-muted mt-1">{currentMethod.desc}</p>

              <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                <div>
                  <p className="text-xs text-muted">Dữ liệu cần</p>
                  <p className="font-medium text-foreground">{currentMethod.needData}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Chi phí train</p>
                  <p className="font-medium text-foreground">{currentMethod.trainCost}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Chất lượng @4-bit</p>
                  <p className="font-medium" style={{ color: currentMethod.color }}>
                    {currentMethod.qualityAt4bit}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted">Inference speed</p>
                  <p className="font-medium text-foreground">{currentMethod.speed}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <p className="text-xs font-semibold text-green-500 mb-1">+ Ưu điểm</p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs text-muted">
                    {currentMethod.good.map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-red-500 mb-1">− Nhược điểm</p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs text-muted">
                    {currentMethod.bad.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* GPTQ/AWQ methods */}
          <div className="rounded-xl border border-border bg-background/40 p-4">
            <p className="text-sm font-semibold text-foreground mb-3">
              Thuật toán quantization phổ biến
            </p>
            <div className="space-y-2">
              {ALGOS.map((a, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-background/60 p-3 flex flex-wrap gap-3 items-center"
                >
                  <div className="min-w-[80px]">
                    <p className="text-sm font-bold" style={{ color: a.color }}>
                      {a.name}
                    </p>
                    <p className="text-xs text-muted">{a.bits}-bit · {a.method}</p>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-xs text-muted leading-snug">{a.desc}</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="text-muted">HW: <span className="text-foreground">{a.hardware}</span></p>
                    <p className="text-muted">PPL: <span style={{ color: a.color }}>{a.ppl}</span> · <span className="text-foreground">{a.speed}</span></p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted mt-3 leading-relaxed">
              Thực tế: <strong>AWQ</strong>{" "}nhỉnh GPTQ chất lượng; <strong>GPTQ</strong>{" "}ecosystem
              lớn hơn (AutoGPTQ); <strong>NF4</strong>{" "}cho fine-tune (QLoRA);{" "}
              <strong>GGUF</strong>{" "}cho chạy local trên Mac/laptop; <strong>SmoothQuant</strong>{" "}cho
              production INT8 tốc độ tối đa.
            </p>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ 4. AHA MOMENT ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          Trọng số mạng nơ-ron không cần chính xác đến từng chữ số thập phân. Giống như
          bạn không cần biết nhiệt độ phòng là 25.347°C — biết là 25°C là đủ để quyết
          định bật quạt. <strong>Lượng tử hoá</strong>{" "}khai thác chính điều này:
          giảm độ chính xác ở mức mà <strong>quyết định cuối cùng của model gần như
          không đổi</strong>, đổi lại 4x-8x bộ nhớ và tốc độ. Đó là lý do mô hình 70B
          từng cần cluster nay chạy được trên 1 GPU gaming.
        </AhaMoment>
      </LessonSection>

      {/* ━━━ 5. CHALLENGE 1 ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách 1">
        <InlineChallenge
          question="Bạn có mô hình 13B ở FP16 (26GB). GPU của bạn 16GB VRAM. Lượng tử hoá nào nhỏ nhất mà vẫn dùng được?"
          options={[
            "INT8 — 13GB, vừa đủ",
            "INT4 — 6.5GB, dư nhiều",
            "FP16 — chỉ cần nén dữ liệu khác",
            "Cần mua GPU mới",
          ]}
          correct={0}
          explanation="INT8 = 26GB / 2 = 13GB, vừa vặn 16GB VRAM. INT4 = 6.5GB cũng được nhưng mất thêm chất lượng không cần thiết. Quy tắc: chọn mức lượng tử hoá cao nhất mà VRAM cho phép — để tối đa chất lượng."
        />
      </LessonSection>

      {/* ━━━ 6. CHALLENGE 2 ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Thử thách 2">
        <InlineChallenge
          question="Team bạn muốn deploy chatbot INT4 trên GPU server. Giữa GPTQ và AWQ, chọn cái nào và vì sao?"
          options={[
            "GPTQ — vì là PTQ, không cần train",
            "AWQ — chất lượng nhỉnh hơn GPTQ ~0.2-0.5 PPL vì bảo vệ kênh salient, ecosystem (vLLM) cũng hỗ trợ tốt",
            "Cả hai đều không tốt — phải dùng GGUF",
            "Không khác biệt — chọn ngẫu nhiên",
          ]}
          correct={1}
          explanation="Cả hai đều là PTQ 4-bit GPU. AWQ thường tốt hơn 0.2-0.5 PPL vì identify 1% kênh salient và scale bảo vệ. Cả hai được vLLM/TGI hỗ trợ. Khi ngang bằng, ưu tiên AWQ. GGUF chỉ khi cần chạy CPU/Mac."
        />
      </LessonSection>

      {/* ━━━ 7. EXPLANATION ━━━ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Định nghĩa.</strong>{" "}<strong>Lượng tử hoá</strong>{" "}(Quantization)
            là ánh xạ giá trị liên tục (float) sang tập rời rạc ít bit hơn. Trong deep
            learning, lượng tử hoá áp dụng lên trọng số (weight) và/hoặc kích hoạt
            (activation) để giảm bộ nhớ và tăng tốc inference. Bên cạnh{" "}
            <TopicLink slug="pruning">pruning</TopicLink>{" "}và distillation, đây là ba
            trụ cột nén model.
          </p>

          <p className="mt-4">
            <strong>Công thức cơ bản (symmetric/asymmetric):</strong>
          </p>
          <LaTeX block>
            {"x_q = \\text{round}\\left(\\frac{x}{s}\\right) + z, \\qquad x_{\\text{dequant}} = s \\cdot (x_q - z)"}
          </LaTeX>
          <p className="text-sm">
            Trong đó <LaTeX>{"s"}</LaTeX> là <em>scale factor</em>{" "}(độ phân giải mỗi
            bin), <LaTeX>{"z"}</LaTeX> là <em>zero-point</em>{" "}(giá trị 0 ánh xạ tới
            bin nào). Với symmetric quantization, <LaTeX>{"z = 0"}</LaTeX>.
          </p>

          <p className="mt-4">
            <strong>Tính scale cho INT<LaTeX>{"b"}</LaTeX>-bit symmetric:</strong>
          </p>
          <LaTeX block>
            {
              "s = \\frac{\\max(|x|)}{2^{b-1} - 1}, \\qquad x_q \\in [-(2^{b-1}-1), \\, 2^{b-1}-1]"
            }
          </LaTeX>
          <p className="text-sm">
            Ví dụ INT8 symmetric: range <LaTeX>{"[-127, 127]"}</LaTeX>, 256 bin. INT4:
            range <LaTeX>{"[-7, 7]"}</LaTeX>, chỉ 16 bin.
          </p>

          <p className="mt-4">
            <strong>Granularity — mức độ chia nhỏ scale:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <strong>Per-tensor:</strong>{" "}1 scale cho toàn tensor. Đơn giản nhưng kém vì
              outlier làm bẹt đa số giá trị.
            </li>
            <li>
              <strong>Per-channel (per-axis):</strong>{" "}1 scale cho mỗi output channel
              của layer. Mặc định cho INT8 LLM.
            </li>
            <li>
              <strong>Per-group / Block-wise:</strong>{" "}1 scale cho mỗi block (ví dụ 32-128
              giá trị). Cần cho INT4 — GPTQ, AWQ, NF4 đều dùng.
            </li>
          </ul>

          <p className="mt-4">
            <strong>Hai cách tiếp cận chính — PTQ vs QAT:</strong>
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>PTQ (Post-Training Quantization):</strong>{" "}áp dụng sau khi model
              đã train xong. Chỉ cần vài trăm mẫu calibration để đo range scale. Nhanh
              nhưng có thể giảm chất lượng ở ≤4-bit.
            </li>
            <li>
              <strong>QAT (Quantization-Aware Training):</strong>{" "}mô phỏng lượng tử hoá
              trong forward pass (fake quant node), loss chảy ngược qua straight-through
              estimator. Model học cách &quot;bù&quot; lỗi. Tốt hơn PTQ, đặc biệt ở ≤2-bit.
            </li>
          </ul>

          <p className="mt-4">
            <strong>GPTQ — lượng tử hoá layer-by-layer dùng Hessian:</strong>
          </p>
          <LaTeX block>
            {
              "\\min_{W_q} \\|WX - W_q X\\|_2^2 \\quad \\text{tương đương} \\quad \\min_{W_q} (W - W_q)^T H (W - W_q), \\; H = XX^T"
            }
          </LaTeX>
          <p className="text-sm">
            GPTQ xử lý từng cột của ma trận trọng số; sau mỗi cột, cập nhật các cột còn
            lại để bù lỗi quantization bằng inverse Hessian. Nhờ đó 4-bit chỉ mất ~1.5%
            PPL trên Llama-7B.
          </p>

          <p className="mt-4">
            <strong>AWQ — Activation-aware Weight Quantization:</strong>
          </p>
          <p className="text-sm">
            AWQ quan sát: chỉ ~1% kênh trọng số (identify qua <em>magnitude activation</em>,
            không phải magnitude weight!) là quan trọng cho chất lượng. Scale các kênh
            này lên trước khi quantize để giảm quant error ở đúng chỗ cần thiết. Kết quả:
            chất lượng nhỉnh GPTQ 0.2-0.5 PPL, kernel tối ưu cho inference.
          </p>

          <p className="mt-4">
            <strong>Ví dụ code 1 — bitsandbytes quantize khi load:</strong>
          </p>
          <CodeBlock language="python" title="bnb_quantize.py">{`# pip install "transformers>=4.41" "bitsandbytes>=0.43" accelerate
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

MODEL_ID = "meta-llama/Llama-3-70B"

# Config: INT4 quantization khi load
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",          # "nf4" hoặc "fp4"
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_use_double_quant=True,     # tiết kiệm thêm ~0.4 bit/param
)

model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    quantization_config=bnb_config,
    device_map="auto",
)
# 70B × 16-bit = 140GB → quantized ≈ 36GB VRAM

tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
inputs = tokenizer("Quantization in simple terms:", return_tensors="pt").to("cuda")

with torch.no_grad():
    outputs = model.generate(**inputs, max_new_tokens=100, do_sample=False)

print(tokenizer.decode(outputs[0]))
# Tốc độ inference ≈ 1.5-2x nhanh hơn FP16 vì giảm memory bandwidth
# Chất lượng: PPL chỉ tăng ~1-2% so với FP16

# Muốn INT8 thay vì INT4? Dùng llm_int8:
bnb_int8 = BitsAndBytesConfig(
    load_in_8bit=True,
    llm_int8_threshold=6.0,  # outlier threshold — giữ FP16 cho kênh >6σ
)
model8 = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    quantization_config=bnb_int8,
    device_map="auto",
)
# 70B INT8 ≈ 70GB — vừa 1×A100 80GB`}</CodeBlock>

          <p className="mt-4">
            <strong>Ví dụ code 2 — GPTQ với AutoGPTQ (production):</strong>
          </p>
          <CodeBlock language="python" title="gptq_quantize.py">{`# pip install auto-gptq>=0.7 transformers optimum
import torch
from transformers import AutoTokenizer
from auto_gptq import AutoGPTQForCausalLM, BaseQuantizeConfig

MODEL_ID = "meta-llama/Llama-3-8B"
OUT_DIR = "./llama3-8b-gptq-4bit"

# Bước 1: Cấu hình GPTQ
quantize_config = BaseQuantizeConfig(
    bits=4,                    # 2, 3, 4, 8 đều hỗ trợ
    group_size=128,            # block-wise; 128 là chuẩn
    desc_act=True,             # activation order — tăng chất lượng
    damp_percent=0.1,          # Hessian dampening
)

# Bước 2: Load model ở FP16 để quantize
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
model = AutoGPTQForCausalLM.from_pretrained(
    MODEL_ID,
    quantize_config=quantize_config,
    torch_dtype=torch.float16,
)

# Bước 3: Chuẩn bị calibration dataset (128-1024 mẫu đủ)
from datasets import load_dataset
data = load_dataset("c4", "en", split="train", streaming=True)
examples = []
for i, sample in enumerate(data):
    if i >= 512:
        break
    tokens = tokenizer(sample["text"], return_tensors="pt",
                       truncation=True, max_length=2048)
    examples.append({
        "input_ids": tokens.input_ids[0],
        "attention_mask": tokens.attention_mask[0],
    })

# Bước 4: Quantize — chạy layer-by-layer, dùng Hessian
model.quantize(examples)  # ~15 phút cho 8B trên A100

# Bước 5: Lưu
model.save_quantized(OUT_DIR)
tokenizer.save_pretrained(OUT_DIR)

# Bước 6: Load lại và dùng (kernel tối ưu)
from auto_gptq import AutoGPTQForCausalLM
q_model = AutoGPTQForCausalLM.from_quantized(
    OUT_DIR,
    device="cuda:0",
    use_safetensors=True,
    use_triton=False,       # True cho kernel Triton nhanh hơn
)

# Inference: 2-4x nhanh hơn FP16, chất lượng ~98.5% FP16
prompt = "Giải thích quantization:"
tokens = tokenizer(prompt, return_tensors="pt").to("cuda")
output = q_model.generate(**tokens, max_new_tokens=200)
print(tokenizer.decode(output[0]))`}</CodeBlock>

          {/* 4 Callouts */}
          <Callout variant="info" title="INT8 LLM có 'outlier emergence'">
            Dettmers et al. (2022) phát hiện: với LLM ≥6B, khoảng 0.1-1% kênh activation
            có magnitude lớn gấp 100-1000x trung bình. Per-tensor INT8 làm model sụp hoàn
            toàn. Giải pháp LLM.int8() của bitsandbytes: phát hiện outlier runtime, giữ
            chúng ở FP16, quantize phần còn lại. Đó là trick giúp INT8 hoạt động với LLM.
          </Callout>

          <Callout variant="tip" title="GPTQ vs AWQ vs GGUF — chọn theo hardware">
            <strong>GPU NVIDIA production:</strong>{" "}AWQ (nhỉnh hơn GPTQ) hoặc GPTQ
            (ecosystem lớn).{" "}
            <strong>Fine-tune rồi deploy:</strong>{" "}QLoRA (NF4) rồi merge & GPTQ/AWQ.
            <strong>Chạy local Mac/laptop:</strong>{" "}GGUF với llama.cpp (Q4_K_M hoặc Q5_K_M).
            <strong>Cần H100/A100 tốc độ tối đa:</strong>{" "}FP8 với Transformer Engine.
            Cần fine-tune mô hình đã lượng tử hoá, xem <TopicLink slug="qlora">QLoRA</TopicLink>.
          </Callout>

          <Callout variant="warning" title="Outlier kills INT2 — QAT là bắt buộc">
            Ở 2-bit (4 bin/tensor), không có cách nào PTQ giữ chất lượng. AQLM dùng
            additive quantization + fine-tune calibration. BitNet b1.58 train từ đầu
            với trọng số {"{-1, 0, 1}"}. Nếu bạn đang cân nhắc INT2 mà không có resource
            train lại, đừng — INT3 hoặc INT4 là sàn an toàn.
          </Callout>

          <Callout variant="tip" title="Quantize activation không chỉ weight">
            Quantize weight giảm bộ nhớ. Quantize <em>cả activation</em>{" "}(W8A8, W4A8)
            mới giảm compute: tensor core INT8 nhanh 4x FP16 trên A100, 8x trên H100.
            SmoothQuant, AWQ đều có pipeline W8A8. Với production throughput cao, W8A8
            đáng đầu tư hơn W4A16.
          </Callout>

          {/* 2 CollapsibleDetails */}
          <CollapsibleDetail title="Quantization đối xứng vs bất đối xứng — khi nào dùng cái nào?">
            <p className="text-sm leading-relaxed">
              <strong>Symmetric (z=0):</strong>{" "}giả sử phân bố cân đối quanh 0. Scale đơn,
              decoder đơn giản (chỉ nhân <LaTeX>{"s"}</LaTeX>). Phù hợp weight (NN weight
              gần Gaussian zero-mean).
            </p>
            <p className="text-sm leading-relaxed mt-2">
              <strong>Asymmetric (z≠0):</strong>{" "}hai tham số scale + zero_point. Chứa
              được phân bố lệch (như output ReLU — chỉ ≥0). Decoder tốn thêm phép cộng.
              Phù hợp activation sau ReLU/GELU.
            </p>
            <p className="text-sm leading-relaxed mt-2">
              Thực tế LLM: <em>weight symmetric + activation asymmetric</em>{" "}là phổ biến.
              Với INT4 weight, symmetric được ưu tiên vì decoder nhanh trong CUDA kernel
              (không có zero-point add). GPTQ, AWQ, NF4 đều symmetric.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Calibration dataset — bao nhiêu mẫu là đủ?">
            <p className="text-sm leading-relaxed">
              PTQ cần sample để đo range activation (cho scale factor). Thực nghiệm trên
              Llama-7B:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-sm mt-2">
              <li><strong>32 mẫu:</strong> không đủ — scale lệch, PPL tăng 5-10%.</li>
              <li><strong>128 mẫu:</strong> sàn — PPL trong 2% FP16.</li>
              <li><strong>512 mẫu:</strong> sweet spot — PPL gần tối ưu.</li>
              <li><strong>2048+ mẫu:</strong> diminishing returns — không cải thiện đáng kể.</li>
            </ul>
            <p className="text-sm leading-relaxed mt-2">
              Lưu ý domain: nếu model dùng trong tiếng Việt, calibrate bằng text tiếng
              Việt (không phải C4 English). Domain mismatch có thể làm PPL tăng 3-5%.
              Luôn sample calibration từ distribution mà model sẽ phục vụ.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="FP8 — hướng đi cho H100 và tương lai">
            <p className="text-sm leading-relaxed">
              FP8 (8-bit float) là định dạng tensor core mới trên H100. Có 2 variant:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-sm mt-2">
              <li><strong>E4M3:</strong>{" "}4 bit exponent, 3 bit mantissa — range rộng, precision thấp. Dùng cho weight và activation forward.</li>
              <li><strong>E5M2:</strong>{" "}5 bit exponent, 2 bit mantissa — range rộng hơn, precision thấp hơn. Dùng cho gradient.</li>
            </ul>
            <p className="text-sm leading-relaxed mt-2">
              NVIDIA Transformer Engine tự động chuyển giữa FP16/FP8 theo loss stability.
              Với huấn luyện LLM, FP8 đạt tốc độ 1.5-2x FP16 mà không mất chất lượng đo
              được. Xu hướng: FP8 sẽ thay FP16 làm mặc định khi H100/B200 phổ biến.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Pipeline production — từ PyTorch checkpoint đến inference server">
            <p className="text-sm leading-relaxed">
              Quy trình chuẩn để deploy LLM đã quantize:
            </p>
            <ol className="list-decimal list-inside space-y-1 pl-2 text-sm mt-2">
              <li>Train/fine-tune model FP16 hoặc BF16.</li>
              <li>Chuẩn bị calibration dataset (128-512 mẫu từ production distribution).</li>
              <li>Chạy GPTQ hoặc AWQ để tạo 4-bit checkpoint.</li>
              <li>Đo PPL/accuracy trên eval set; nếu drop &gt;3% PPL, thử AWQ, group_size nhỏ hơn, hoặc giữ một số layer FP16.</li>
              <li>Export sang format inference engine: vLLM, TGI, TensorRT-LLM, SGLang.</li>
              <li>Benchmark throughput/latency trên hardware target.</li>
              <li>A/B test với FP16 baseline trên một phần traffic trước khi rollout full.</li>
            </ol>
            <p className="text-sm leading-relaxed mt-2">
              Đừng skip step 4 và 7 — nhiều nhóm deploy thẳng mà không đo chất lượng, rồi
              khách phàn nàn bot &quot;đần đi&quot;. Quantization không free — phải đo.
            </p>
          </CollapsibleDetail>

          {/* Applications */}
          <p className="mt-5 text-sm font-semibold text-foreground">Ứng dụng thực tế:</p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <strong>LLM trên consumer GPU:</strong>{" "}Llama 70B INT4 chạy được RTX 4090,
              MacBook M2 Max 64GB (qua GGUF).
            </li>
            <li>
              <strong>Mobile/edge inference:</strong>{" "}Phi-3, Gemma 2B INT4 chạy được
              smartphone (Snapdragon 8 Gen 3).
            </li>
            <li>
              <strong>Production serving throughput:</strong>{" "}vLLM + AWQ INT4 đạt
              3-4x throughput so với FP16 cùng hardware.
            </li>
            <li>
              <strong>Multi-tenant model serving:</strong>{" "}INT4 cho phép host nhiều model
              trên cùng GPU (ví dụ 3 model 13B trên 1×A100 80GB).
            </li>
            <li>
              <strong>Fine-tuning memory-constrained:</strong>{" "}QLoRA (NF4) cho phép
              fine-tune 70B trên 1 GPU — xem <TopicLink slug="qlora">QLoRA</TopicLink>.
            </li>
            <li>
              <strong>Embedded device:</strong>{" "}BERT INT8 chạy được trên Raspberry Pi,
              Coral TPU, hỗ trợ inference offline.
            </li>
          </ul>

          {/* Pitfalls */}
          <p className="mt-5 text-sm font-semibold text-foreground">Pitfall thường gặp:</p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <strong>Không đo chất lượng sau quantize:</strong>{" "}luôn benchmark PPL và
              downstream task (MMLU, HumanEval) trước rollout. Quantize INT4 sai cách có
              thể làm model &quot;đần&quot; 5-10% mà không ai phát hiện ngay.
            </li>
            <li>
              <strong>Per-tensor cho INT4:</strong>{" "}không bao giờ dùng được cho LLM. Luôn
              group-wise (group 32, 64, 128).
            </li>
            <li>
              <strong>Calibration sai domain:</strong>{" "}calibrate bằng C4 English rồi
              deploy tiếng Việt → PPL tăng bất thường. Match calibration với production.
            </li>
            <li>
              <strong>Quantize LN và embedding:</strong>{" "}hai layer này nhạy. Thường giữ
              FP16/BF16 kể cả khi các layer khác INT4.
            </li>
            <li>
              <strong>So sánh không công bằng:</strong>{" "}benchmark tốc độ không phải ở
              batch size production thực tế. INT4 nhanh ở batch=1 nhưng có thể chậm hơn
              FP16 ở batch=128 do kernel launch overhead.
            </li>
            <li>
              <strong>Không kiểm tra numeric stability:</strong>{" "}INT2/INT3 có thể gây NaN
              nếu input cực đoan. Test với edge case (input dài, nhiều unicode, multi-turn).
            </li>
            <li>
              <strong>Bỏ qua memory bandwidth:</strong>{" "}quantization giúp giảm memory
              bandwidth (chính là bottleneck LLM inference). Nếu kernel vẫn dequant sang
              FP16 rồi matmul, bandwidth gain có thể nhỏ hơn kỳ vọng — đo trước khi kết luận.
            </li>
          </ul>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ 8. SUMMARY ━━━ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về Quantization"
          points={[
            "Lượng tử hoá giảm số bit/tham số: FP32 (100%) → FP16 (50%) → INT8 (25%) → INT4 (12.5%) → INT2 (6.25%). Chất lượng giảm theo hàm lồi — INT4 là sweet spot.",
            "PTQ nhanh (cần calibration data), QAT chậm hơn (train lại) nhưng chất lượng tốt hơn ở ≤4-bit. Hầu hết LLM open-source dùng PTQ.",
            "INT4 giảm 8x kích thước so với FP32 mà chỉ mất ~2.5% chất lượng — chìa khoá để chạy LLM trên consumer GPU. Vách đá ở INT2 cần kỹ thuật đặc biệt (AQLM, BitNet).",
            "Thuật toán phổ biến: GPTQ (Hessian layer-by-layer), AWQ (bảo vệ 1% kênh salient), NF4 (QLoRA fine-tune), GGUF (llama.cpp CPU/Mac), SmoothQuant (INT8 outlier handling).",
            "Granularity quan trọng: per-tensor kém cho LLM do outlier; per-channel tốt cho INT8; group-wise (block 32-128) bắt buộc cho INT4.",
            "Chọn format theo hardware: GPTQ/AWQ cho GPU NVIDIA, GGUF cho CPU/Mac, FP8 cho H100. Luôn chọn mức bit cao nhất mà VRAM cho phép, và luôn benchmark chất lượng sau quantize.",
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
