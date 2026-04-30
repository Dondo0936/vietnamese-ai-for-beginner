"use client";
import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { PredictionGate, AhaMoment, InlineChallenge, Callout, CollapsibleDetail,
  MiniSummary, CodeBlock, LessonSection, LaTeX, TopicLink, ProgressSteps } from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "mixed-precision",
  title: "Mixed Precision Training",
  titleVi: "Huấn luyện hỗn hợp độ chính xác",
  description:
    "Kỹ thuật kết hợp FP16 và FP32 trong huấn luyện để tăng tốc và giảm bộ nhớ mà vẫn giữ chính xác.",
  category: "training-optimization",
  tags: ["mixed-precision", "fp16", "training", "optimization"],
  difficulty: "advanced",
  relatedSlugs: ["quantization", "lora", "fine-tuning"],
  vizType: "interactive",
};

const TOTAL_STEPS = 9;

/* ============================================================
   ĐỊNH NGHĨA ĐỊNH DẠNG SỐ THỰC
   ============================================================ */

interface FormatSpec {
  id: string;
  name: string;
  bits: number;
  sign: number;
  exponent: number;
  mantissa: number;
  bias: number;
  minNormal: number;
  maxFinite: number;
  epsilon: number;
  color: string;
  accent: string;
  description: string;
  useCase: string;
}

const FORMATS: FormatSpec[] = [
  {
    id: "fp32",
    name: "FP32 (single precision)",
    bits: 32,
    sign: 1,
    exponent: 8,
    mantissa: 23,
    bias: 127,
    minNormal: 1.175494e-38,
    maxFinite: 3.402823e38,
    epsilon: 1.1920929e-7,
    color: "#3b82f6",
    accent: "bg-blue-500/15 border-blue-500/40 text-blue-800 dark:text-blue-300",
    description: "Chuẩn IEEE 754 single — dải rộng, độ phân giải cao, dùng cho master weights.",
    useCase: "Lưu master weights, tích luỹ gradient, reduce-sum trong distributed training.",
  },
  {
    id: "fp16",
    name: "FP16 (half precision)",
    bits: 16,
    sign: 1,
    exponent: 5,
    mantissa: 10,
    bias: 15,
    minNormal: 6.103516e-5,
    maxFinite: 65504,
    epsilon: 9.765625e-4,
    color: "#f59e0b",
    accent: "bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-300",
    description: "IEEE 754 half — dải hẹp (±65504), dễ underflow gradient, cần loss scaling.",
    useCase: "Forward/backward trên Tensor Cores Volta/Turing/Ampere. Nhanh 2x vs FP32.",
  },
  {
    id: "bf16",
    name: "BF16 (brain float 16)",
    bits: 16,
    sign: 1,
    exponent: 8,
    mantissa: 7,
    bias: 127,
    minNormal: 1.175494e-38,
    maxFinite: 3.389531e38,
    epsilon: 7.8125e-3,
    color: "#a855f7",
    accent: "bg-purple-500/15 border-purple-500/40 text-purple-800 dark:text-purple-300",
    description: "Google Brain BF16 — 8 bit exponent như FP32 (dải rộng), 7 bit mantissa (độ phân giải thô hơn FP16).",
    useCase: "LLM training từ Ampere trở đi. Gần như không cần loss scaling.",
  },
  {
    id: "fp8-e4m3",
    name: "FP8 E4M3",
    bits: 8,
    sign: 1,
    exponent: 4,
    mantissa: 3,
    bias: 7,
    minNormal: 1.953125e-3,
    maxFinite: 448,
    epsilon: 0.125,
    color: "#22c55e",
    accent: "bg-green-500/15 border-green-500/40 text-green-800 dark:text-green-300",
    description: "Hopper/H100 FP8 — 4 bit exponent, 3 bit mantissa. Dùng cho forward activation.",
    useCase: "Forward activations trong Transformer Engine. Nhanh ~2x so với BF16.",
  },
  {
    id: "fp8-e5m2",
    name: "FP8 E5M2",
    bits: 8,
    sign: 1,
    exponent: 5,
    mantissa: 2,
    bias: 15,
    minNormal: 6.103516e-5,
    maxFinite: 57344,
    epsilon: 0.25,
    color: "#06b6d4",
    accent: "bg-cyan-500/15 border-cyan-500/40 text-cyan-800 dark:text-cyan-300",
    description: "Hopper FP8 E5M2 — 5 bit exponent (giống FP16), 2 bit mantissa. Dải rộng hơn E4M3.",
    useCase: "Backward gradients (cần dải rộng hơn để chứa gradient lớn và nhỏ).",
  },
  {
    id: "int8",
    name: "INT8 (integer 8-bit)",
    bits: 8,
    sign: 1,
    exponent: 0,
    mantissa: 7,
    bias: 0,
    minNormal: 1,
    maxFinite: 127,
    epsilon: 1,
    color: "#ef4444",
    accent: "bg-red-500/15 border-red-500/40 text-red-800 dark:text-red-300",
    description: "Số nguyên 8 bit có dấu, cần scale factor để biểu diễn số thực. Chủ yếu cho inference.",
    useCase: "Quantization inference, post-training INT8. Không dùng cho forward pass trong training thuần.",
  },
];

/* ============================================================
   MÔ PHỎNG LƯU TRỮ SỐ TRONG TỪNG ĐỊNH DẠNG
   ============================================================ */

interface EncodedResult {
  stored: number;
  error: number;
  relativeError: number;
  flagUnderflow: boolean;
  flagOverflow: boolean;
  bitString: string;
  note: string;
}

function encodeNumber(value: number, fmt: FormatSpec): EncodedResult {
  if (!Number.isFinite(value)) {
    return {
      stored: value,
      error: 0,
      relativeError: 0,
      flagUnderflow: false,
      flagOverflow: true,
      bitString: "Inf / NaN",
      note: "Giá trị không hữu hạn.",
    };
  }

  const absVal = Math.abs(value);

  // INT8 trường hợp đặc biệt
  if (fmt.id === "int8") {
    const scale = 127 / Math.max(1e-12, absVal);
    const quant = Math.round(value * scale);
    const clamped = Math.max(-127, Math.min(127, quant));
    const stored = clamped / scale;
    const error = stored - value;
    const rel = value === 0 ? 0 : Math.abs(error / value);
    const signBit = value < 0 ? "1" : "0";
    const magnitude = Math.abs(clamped).toString(2).padStart(7, "0");
    return {
      stored,
      error,
      relativeError: rel,
      flagUnderflow: absVal > 0 && Math.abs(stored) < fmt.epsilon,
      flagOverflow: false,
      bitString: `${signBit} ${magnitude}`,
      note: `INT8 cần scale factor s=${scale.toPrecision(4)} để map về ±127.`,
    };
  }

  if (absVal === 0) {
    return {
      stored: 0,
      error: 0,
      relativeError: 0,
      flagUnderflow: false,
      flagOverflow: false,
      bitString: "0".repeat(fmt.bits),
      note: "Số 0 biểu diễn chính xác.",
    };
  }

  if (absVal > fmt.maxFinite) {
    return {
      stored: value > 0 ? Infinity : -Infinity,
      error: Infinity,
      relativeError: Infinity,
      flagUnderflow: false,
      flagOverflow: true,
      bitString: "Overflow → ±Inf",
      note: `Giá trị vượt ±${fmt.maxFinite.toExponential(3)}, bị clip về infinity.`,
    };
  }

  if (absVal < fmt.minNormal) {
    // underflow đơn giản hoá — coi như bị flush về 0 khi quá nhỏ
    if (absVal < fmt.minNormal * 2 ** -fmt.mantissa) {
      return {
        stored: 0,
        error: value,
        relativeError: 1,
        flagUnderflow: true,
        flagOverflow: false,
        bitString: "Subnormal → 0",
        note: "Giá trị nhỏ hơn ngưỡng subnormal, bị flush về 0.",
      };
    }
  }

  const exp = Math.floor(Math.log2(absVal));
  const fraction = absVal / 2 ** exp - 1;
  const scaled = Math.round(fraction * 2 ** fmt.mantissa);
  const storedAbs = (1 + scaled / 2 ** fmt.mantissa) * 2 ** exp;
  const stored = value < 0 ? -storedAbs : storedAbs;
  const error = stored - value;
  const rel = value === 0 ? 0 : Math.abs(error / value);

  const biasedExp = exp + fmt.bias;
  const expBits = Math.max(0, Math.min(2 ** fmt.exponent - 1, biasedExp))
    .toString(2)
    .padStart(fmt.exponent, "0");
  const mantBits = scaled.toString(2).padStart(fmt.mantissa, "0");
  const signBit = value < 0 ? "1" : "0";
  const bitString = `${signBit} ${expBits} ${mantBits}`;

  return {
    stored,
    error,
    relativeError: rel,
    flagUnderflow: false,
    flagOverflow: false,
    bitString,
    note: `Exponent=${exp}, mantissa làm tròn ${scaled}/${2 ** fmt.mantissa}.`,
  };
}

/* ============================================================
   VÍ DỤ HUẤN LUYỆN: GRADIENT UNDERFLOW + LOSS SCALING
   ============================================================ */

interface GradientSample {
  layer: string;
  raw: number;
  description: string;
}

const GRADIENT_SAMPLES: GradientSample[] = [
  { layer: "embedding.weight", raw: 3.2e-5, description: "Gradient nhỏ nhưng vẫn trong dải FP16." },
  { layer: "attn.qkv.weight", raw: 8.1e-6, description: "Gradient attention — gần biên dưới FP16." },
  { layer: "attn.out.weight", raw: 4.0e-7, description: "Gradient ra khỏi dải FP16 (1.5e-5 bị flush)." },
  { layer: "mlp.fc1.weight", raw: 2.2e-8, description: "Gradient MLP rất nhỏ — sẽ underflow trong FP16." },
  { layer: "mlp.fc2.weight", raw: 6.3e-9, description: "Gradient cực nhỏ, cần loss scaling ≥1024." },
  { layer: "lm_head.weight", raw: 1.1e-6, description: "Output head — borderline." },
];

interface ScaledRow {
  layer: string;
  raw: number;
  scaled: number;
  fp16: EncodedResult;
  fp16Scaled: EncodedResult;
  bf16: EncodedResult;
  underflow: boolean;
}

function buildGradientTable(scale: number): ScaledRow[] {
  const fp16 = FORMATS.find((f) => f.id === "fp16")!;
  const bf16 = FORMATS.find((f) => f.id === "bf16")!;
  return GRADIENT_SAMPLES.map((s) => {
    const scaled = s.raw * scale;
    const fp16Raw = encodeNumber(s.raw, fp16);
    const fp16Scaled = encodeNumber(scaled, fp16);
    const bf16Raw = encodeNumber(s.raw, bf16);
    return {
      layer: s.layer,
      raw: s.raw,
      scaled,
      fp16: fp16Raw,
      fp16Scaled,
      bf16: bf16Raw,
      underflow: fp16Raw.flagUnderflow || fp16Raw.stored === 0,
    };
  });
}

/* ============================================================
   QUIZ (8 CÂU)
   ============================================================ */

const QUIZ: QuizQuestion[] = [
  {
    question: "Vì sao mixed precision giữ master weights ở FP32 thay vì dùng toàn bộ FP16?",
    options: [
      "Vì FP32 chạy nhanh hơn FP16 trên Tensor Cores.",
      "Vì gradient cực nhỏ (ví dụ 1e-7) sẽ bị làm tròn về 0 trong FP16, nên cập nhật trọng số phải ở FP32 để không đánh mất thông tin tích luỹ qua nhiều bước.",
      "Vì GPU hiện đại chỉ hỗ trợ phép cộng ở FP32.",
      "Vì FP16 không lưu được số âm.",
    ],
    correct: 1,
    explanation:
      "FP16 có ngưỡng normal tối thiểu ~6e-5. Sau khi nhân learning rate, gradient nhỏ bị flush về 0. Master weights FP32 giữ đủ độ phân giải để tích luỹ các thay đổi nhỏ qua hàng triệu step.",
  },
  {
    question: "Loss scaling trong mixed precision dùng để làm gì?",
    options: [
      "Tăng tốc huấn luyện bằng cách giảm lượng tính toán.",
      "Nhân loss lên một hằng số S (ví dụ 1024) để gradient không bị underflow trong FP16, rồi unscale trước khi cập nhật master weights FP32.",
      "Giảm kích thước mô hình bằng cách chia loss ra nhiều phần.",
      "Chuẩn hoá loss về khoảng [0, 1] cho ổn định.",
    ],
    correct: 1,
    explanation:
      "Loss scaling dịch phân phối gradient vào vùng biểu diễn được của FP16. Sau backward, ta chia gradient cho S trước khi cập nhật. GradScaler động tự tăng/giảm S khi phát hiện overflow.",
  },
  {
    question: "BF16 khác FP16 ở điểm nào và vì sao LLM ưa dùng BF16?",
    options: [
      "BF16 chạy nhanh hơn FP16 trên cùng một GPU.",
      "BF16 có 8 bit exponent (dải rộng như FP32), 7 bit mantissa (kém FP16); nhờ đó gần như không cần loss scaling khi huấn luyện LLM.",
      "BF16 tương thích nhiều loại GPU hơn FP16.",
      "BF16 dùng ít bộ nhớ hơn FP16.",
    ],
    correct: 1,
    explanation:
      "BF16 chia bit khác FP16: 1/8/7 thay vì 1/5/10. Dải biểu diễn rộng (~1e-38 đến 3e38) giúp gradient không underflow. Đổi lại mantissa thô hơn — nhưng forward/backward hiếm khi cần độ phân giải cao.",
  },
  {
    question: "Tensor Core trên A100/H100 thực hiện phép gì khi bật autocast?",
    options: [
      "Nhân hai ma trận FP32 rồi cộng ra FP32.",
      "Nhân ma trận FP16/BF16 rồi tích luỹ (accumulate) ra FP32 — vừa nhanh vừa tránh mất chính xác trong phép cộng.",
      "Nhân FP32 rồi ép xuống FP16 ở đầu ra.",
      "Nhân INT8 rồi dequantize.",
    ],
    correct: 1,
    explanation:
      "Các Tensor Core thực thi FMA (D = A·B + C) với A, B ở FP16/BF16 nhưng accumulator C, D ở FP32. Cách này giúp giữ chính xác khi tổng hàng nghìn phần tử.",
  },
  {
    question: "Trong GradScaler động của PyTorch, điều gì xảy ra khi phát hiện NaN/Inf?",
    options: [
      "Tiếp tục train với gradient NaN.",
      "Bỏ qua bước cập nhật đó, giảm scale factor (ví dụ /2) để tránh overflow ở các bước sau.",
      "Chuyển toàn bộ sang FP32 vĩnh viễn.",
      "Khởi động lại toàn bộ dataloader.",
    ],
    correct: 1,
    explanation:
      "GradScaler dùng chiến lược backoff: khi có Inf/NaN nó skip step và nhân scale với backoff_factor (default 0.5). Sau N bước không overflow, nó tăng scale (growth_factor 2.0) để khai thác hết dải FP16.",
  },
  {
    type: "code",
    question:
      "Điền vào đoạn code PyTorch mixed precision: dùng context manager để chạy forward ở FP16, và loại dtype phù hợp cho forward pass.",
    codeTemplate: `from torch.amp import ___, GradScaler

scaler = GradScaler()
with ___(device_type="cuda", dtype=torch.___):
    output = model(batch)
    loss = criterion(output, target)

scaler.scale(loss).backward()
scaler.step(optimizer)
scaler.update()`,
    language: "python",
    blanks: [
      { answer: "autocast", accept: [] },
      { answer: "autocast", accept: [] },
      { answer: "float16", accept: ["fp16", "half"] },
    ],
    explanation:
      "autocast tự động chuyển phép tính sang FP16 ở những ops nhanh (matmul, conv). GradScaler nhân loss trước backward để gradient nằm trong dải FP16, rồi unscale trước khi cập nhật master weights FP32.",
  },
  {
    question: "Vì sao Hopper (H100) định nghĩa hai biến thể FP8 (E4M3 và E5M2)?",
    options: [
      "Để tương thích ngược với Volta và Turing.",
      "Vì forward activation cần mantissa tốt hơn (E4M3), còn backward gradient cần dải rộng hơn (E5M2).",
      "Vì một biến thể dùng cho Windows, một biến thể dùng cho Linux.",
      "Để thay thế hoàn toàn BF16 trên H100.",
    ],
    correct: 1,
    explanation:
      "E4M3 (4 exp, 3 mant) có max ~448, đủ cho activation và thường phân phối gọn. E5M2 (5 exp, 2 mant) có dải như FP16, cần cho gradient vì phân phối của nó có đuôi dài.",
  },
  {
    question:
      "Mô hình train ổn định ở FP32 nhưng khi bật AMP FP16 thì loss thành NaN sau vài trăm step. Cách xử lý hợp lý nhất là gì?",
    options: [
      "Tắt hẳn mixed precision.",
      "Chuyển dtype sang BF16 (nếu GPU hỗ trợ), hoặc tăng scale ban đầu của GradScaler, hoặc ép một số layer nhạy (softmax, layernorm) giữ ở FP32.",
      "Giảm learning rate xuống 0.",
      "Tăng batch size gấp đôi.",
    ],
    correct: 1,
    explanation:
      "Cách tiêu chuẩn: (1) thử BF16 để loại bỏ scaling; (2) tăng scale khởi tạo và theo dõi overflow; (3) dùng torch.autocast enabled=False bao quanh softmax/layernorm vì chúng rất nhạy khi tính ở FP16.",
  },
];

/* ============================================================
   COMPONENT CHÍNH
   ============================================================ */

export default function MixedPrecisionTopic() {
  const [activeFormat, setActiveFormat] = useState<string>("fp16");
  const [inputValue, setInputValue] = useState<string>("3.141592653589793");
  const [lossScale, setLossScale] = useState<number>(1024);

  const parsedValue = useMemo(() => {
    const n = Number(inputValue);
    return Number.isFinite(n) ? n : 3.141592653589793;
  }, [inputValue]);

  const encodedAll = useMemo(
    () => FORMATS.map((fmt) => ({ fmt, enc: encodeNumber(parsedValue, fmt) })),
    [parsedValue]
  );

  const activeFmt = FORMATS.find((f) => f.id === activeFormat) ?? FORMATS[1];
  const activeEnc = useMemo(() => encodeNumber(parsedValue, activeFmt), [parsedValue, activeFmt]);

  const gradientTable = useMemo(() => buildGradientTable(lossScale), [lossScale]);

  const setPreset = useCallback((v: string) => setInputValue(v), []);

  const underflowCount = gradientTable.filter((r) => r.underflow).length;
  const rescuedCount = gradientTable.filter(
    (r) => r.underflow && !r.fp16Scaled.flagUnderflow && r.fp16Scaled.stored !== 0
  ).length;

  return (
    <>
      {/* ━━━ 1. HOOK / PREDICTION GATE ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <ProgressSteps current={1} total={TOTAL_STEPS} />
        <PredictionGate
          question="Một mô hình 7B tham số train 4 ngày trên 8 GPU A100. Có cách nào giảm xuống ~2 ngày mà hầu như không mất chất lượng?"
          options={[
            "Thuê thêm 8 GPU nữa để train song song.",
            "Dùng FP16/BF16 cho các phép tính nặng (forward, backward) và giữ FP32 cho bước cập nhật master weights — Tensor Cores tăng tốc 2-3x.",
            "Giảm dataset huấn luyện xuống còn một nửa để chạy nhanh hơn.",
          ]}
          correct={1}
          explanation="Mixed Precision Training (Micikevicius et al., 2018) khai thác Tensor Cores FP16/BF16: forward và backward chạy ở 16 bit (nhanh 2-3x, tốn nửa băng thông bộ nhớ), còn master weights giữ ở FP32 để cập nhật chính xác."
        >
          <p className="text-sm text-muted mt-2">
            Ý tưởng quen thuộc: khi xây nhà ta dùng vật liệu đắt nhất (FP32) cho móng
            chịu lực, còn tường ngăn thì dùng gạch nhẹ (FP16). Toàn nhà đỡ nặng mà
            cấu trúc chịu lực vẫn vững.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ 2. VISUALIZATION — PRECISION FORMAT COMPARATOR ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá định dạng số">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-1">
            So sánh cách các định dạng lưu cùng một số thực
          </h3>
          <p className="text-sm text-muted mb-4">
            Nhập một giá trị bất kỳ và xem FP32, FP16, BF16, FP8 (E4M3/E5M2), INT8
            lưu nó như thế nào. Sai số làm tròn là lý do Mixed Precision phải chọn
            lọc chỗ nào dùng precision nào.
          </p>

          {/* Input bar */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-xs font-semibold text-foreground shrink-0">
                Giá trị cần lưu
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="text-xs text-muted shrink-0">
                Đang lưu: <span className="font-mono text-foreground">{parsedValue}</span>
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { label: "π", value: "3.141592653589793" },
                { label: "e", value: "2.718281828459045" },
                { label: "1e-7 (gradient nhỏ)", value: "0.0000001" },
                { label: "70000 (vượt FP16)", value: "70000" },
                { label: "1.234e-9 (siêu nhỏ)", value: "0.000000001234" },
                { label: "65504 (max FP16)", value: "65504" },
                { label: "0.1 (không chính xác nhị phân)", value: "0.1" },
              ].map((p) => (
                <button
                  key={p.label}
                  onClick={() => setPreset(p.value)}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted hover:text-foreground hover:border-accent transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Format cards */}
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-3">
            {encodedAll.map(({ fmt, enc }) => {
              const isActive = fmt.id === activeFormat;
              return (
                <motion.button
                  key={fmt.id}
                  layout
                  onClick={() => setActiveFormat(fmt.id)}
                  className={`text-left rounded-xl border p-4 transition-all ${
                    isActive
                      ? "border-accent bg-accent/5 shadow-sm"
                      : "border-border bg-card hover:border-accent/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: fmt.color }}
                    >
                      {fmt.name}
                    </span>
                    <span className="text-[10px] text-muted font-mono">{fmt.bits} bit</span>
                  </div>

                  {/* Bit layout bar */}
                  <div className="mt-3 flex h-5 w-full overflow-hidden rounded-md">
                    <div
                      className="flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ width: `${(fmt.sign / fmt.bits) * 100}%`, backgroundColor: "#64748b" }}
                    >
                      S
                    </div>
                    {fmt.exponent > 0 && (
                      <div
                        className="flex items-center justify-center text-[9px] font-bold text-white"
                        style={{
                          width: `${(fmt.exponent / fmt.bits) * 100}%`,
                          backgroundColor: fmt.color,
                        }}
                      >
                        E×{fmt.exponent}
                      </div>
                    )}
                    <div
                      className="flex items-center justify-center text-[9px] font-bold text-white"
                      style={{
                        width: `${(fmt.mantissa / fmt.bits) * 100}%`,
                        backgroundColor: "#0f172a",
                      }}
                    >
                      M×{fmt.mantissa}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-md bg-background/50 border border-border p-2">
                      <p className="text-muted">Stored</p>
                      <p className="font-mono text-foreground truncate">
                        {Number.isFinite(enc.stored) ? enc.stored.toPrecision(8) : String(enc.stored)}
                      </p>
                    </div>
                    <div className="rounded-md bg-background/50 border border-border p-2">
                      <p className="text-muted">Abs error</p>
                      <p className="font-mono text-foreground">
                        {Number.isFinite(enc.error) ? Math.abs(enc.error).toExponential(3) : "∞"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {enc.flagUnderflow && (
                      <span className="rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] px-2 py-0.5 border border-amber-500/40">
                        underflow → 0
                      </span>
                    )}
                    {enc.flagOverflow && (
                      <span className="rounded-full bg-red-500/20 text-red-800 dark:text-red-300 text-[10px] px-2 py-0.5 border border-red-500/40">
                        overflow → Inf
                      </span>
                    )}
                    {!enc.flagUnderflow && !enc.flagOverflow && (
                      <span className="rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[10px] px-2 py-0.5 border border-emerald-500/40">
                        biểu diễn được
                      </span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Active format detail */}
          <div className="mt-5 rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: activeFmt.color }}
              />
              <h4 className="text-sm font-semibold text-foreground">
                Chi tiết {activeFmt.name}
              </h4>
            </div>

            <p className="text-xs text-muted leading-relaxed">{activeFmt.description}</p>

            <div className="rounded-md bg-background/60 border border-border p-3 font-mono text-[11px] text-foreground break-all">
              {activeEnc.bitString}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="rounded-md bg-background/50 border border-border p-2">
                <p className="text-muted">Min normal</p>
                <p className="font-mono text-foreground">{activeFmt.minNormal.toExponential(3)}</p>
              </div>
              <div className="rounded-md bg-background/50 border border-border p-2">
                <p className="text-muted">Max finite</p>
                <p className="font-mono text-foreground">{activeFmt.maxFinite.toExponential(3)}</p>
              </div>
              <div className="rounded-md bg-background/50 border border-border p-2">
                <p className="text-muted">Epsilon (~ULP)</p>
                <p className="font-mono text-foreground">{activeFmt.epsilon.toExponential(3)}</p>
              </div>
              <div className="rounded-md bg-background/50 border border-border p-2">
                <p className="text-muted">Relative error</p>
                <p className="font-mono text-foreground">
                  {Number.isFinite(activeEnc.relativeError)
                    ? (activeEnc.relativeError * 100).toFixed(6) + "%"
                    : "∞"}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-muted italic">{activeEnc.note}</p>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ 3. VISUALIZATION — LOSS SCALING / UNDERFLOW DEMO ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Thử nghiệm Loss Scaling">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Gradient underflow và cứu bởi loss scaling
          </h3>
          <p className="text-sm text-muted mb-4">
            Mỗi layer có một gradient mẫu. Khi lưu trong FP16 thuần, nhiều giá trị
            bị flush về 0 (underflow). Trượt thanh <strong>scale factor</strong> để
            xem loss scaling đưa gradient về dải biểu diễn được.
          </p>

          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-xs font-semibold text-foreground">
                Loss scale S = <span className="font-mono">{lossScale}</span>
              </label>
              <input
                type="range"
                min={0}
                max={16}
                step={1}
                value={Math.log2(lossScale)}
                onChange={(e) => setLossScale(2 ** Number(e.target.value))}
                className="flex-1"
              />
              <div className="flex gap-1.5">
                {[1, 128, 1024, 8192, 65536].map((s) => (
                  <button
                    key={s}
                    onClick={() => setLossScale(s)}
                    className={`rounded-md px-2 py-1 text-[11px] border transition ${
                      lossScale === s
                        ? "border-accent bg-accent text-white"
                        : "border-border bg-background text-muted hover:text-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="rounded-md bg-background/60 border border-border p-2">
                <p className="text-muted">Layer có gradient</p>
                <p className="font-bold text-foreground text-base">{GRADIENT_SAMPLES.length}</p>
              </div>
              <div className="rounded-md bg-background/60 border border-amber-500/40 p-2">
                <p className="text-amber-800 dark:text-amber-300">Underflow trong FP16 thuần</p>
                <p className="font-bold text-amber-800 dark:text-amber-300 text-base">{underflowCount}</p>
              </div>
              <div className="rounded-md bg-background/60 border border-emerald-500/40 p-2">
                <p className="text-emerald-800 dark:text-emerald-300">Được cứu bởi scale</p>
                <p className="font-bold text-emerald-800 dark:text-emerald-300 text-base">{rescuedCount}</p>
              </div>
            </div>
          </div>

          {/* Gradient table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-muted border-b border-border">
                  <th className="text-left py-2 pr-3">Layer</th>
                  <th className="text-right py-2 pr-3">g gốc</th>
                  <th className="text-right py-2 pr-3">g × S</th>
                  <th className="text-right py-2 pr-3">FP16 (thuần)</th>
                  <th className="text-right py-2 pr-3">FP16 (scaled)</th>
                  <th className="text-right py-2 pr-3">BF16</th>
                  <th className="text-center py-2">Tình trạng</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {gradientTable.map((row, idx) => {
                  const storedPureFp16 = row.fp16.stored;
                  const storedScaled = row.fp16Scaled.stored;
                  return (
                    <tr
                      key={idx}
                      className="border-b border-border/50 hover:bg-surface/40 transition-colors"
                    >
                      <td className="py-2 pr-3 text-foreground">{row.layer}</td>
                      <td className="py-2 pr-3 text-right text-foreground">
                        {row.raw.toExponential(2)}
                      </td>
                      <td className="py-2 pr-3 text-right text-foreground">
                        {row.scaled.toExponential(2)}
                      </td>
                      <td
                        className={`py-2 pr-3 text-right ${
                          storedPureFp16 === 0 ? "text-red-700 dark:text-red-400" : "text-foreground"
                        }`}
                      >
                        {storedPureFp16 === 0 ? "0 (lost)" : storedPureFp16.toExponential(2)}
                      </td>
                      <td
                        className={`py-2 pr-3 text-right ${
                          storedScaled === 0 ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"
                        }`}
                      >
                        {storedScaled === 0 ? "0 (lost)" : storedScaled.toExponential(2)}
                      </td>
                      <td className="py-2 pr-3 text-right text-purple-800 dark:text-purple-300">
                        {row.bf16.stored.toExponential(2)}
                      </td>
                      <td className="py-2 text-center">
                        {storedPureFp16 === 0 && storedScaled !== 0 && (
                          <span className="rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 border border-emerald-500/40">
                            cứu
                          </span>
                        )}
                        {storedPureFp16 !== 0 && (
                          <span className="rounded-full bg-blue-500/20 text-blue-800 dark:text-blue-300 px-2 py-0.5 border border-blue-500/40">
                            OK
                          </span>
                        )}
                        {storedPureFp16 === 0 && storedScaled === 0 && (
                          <span className="rounded-full bg-red-500/20 text-red-800 dark:text-red-300 px-2 py-0.5 border border-red-500/40">
                            cần S lớn hơn
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-muted mt-3 italic">
            Chú ý cột BF16 không bao giờ underflow — dải exponent của nó rộng như FP32
            nên hầu như không cần loss scaling khi huấn luyện LLM.
          </p>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ 4. AHA MOMENT ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          <p>
            Không phải mọi phép tính đều cần chính xác như nhau!{" "}
            <strong>Nhân ma trận</strong> (forward/backward) chịu được sai số nhỏ —
            nên ta dùng FP16/BF16 để nhanh 2-3x trên Tensor Cores. Nhưng{" "}
            <strong>cập nhật trọng số</strong> cần tích luỹ những thay đổi cực nhỏ
            qua hàng triệu bước — phải dùng FP32 để không đánh mất từng hạt gradient.
            Mixed Precision chính là chọn đúng precision cho đúng công việc.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ━━━ 5. INLINE CHALLENGE #1 ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách 1">
        <InlineChallenge
          question="Gradient có giá trị 1e-8. Ngưỡng normal nhỏ nhất của FP16 là ~6.1e-5. Điều gì xảy ra khi ta lưu gradient này ở FP16 không có loss scaling?"
          options={[
            "Gradient được lưu chính xác (1e-8).",
            "Gradient bị flush về 0 (underflow) — master weights không được cập nhật, lớp đó coi như 'đóng băng'.",
            "Gradient được làm tròn lên 6.1e-5.",
            "FP16 tự động chuyển sang FP32 để giữ giá trị.",
          ]}
          correct={1}
          explanation="1e-8 nhỏ hơn hẳn dải subnormal FP16 → flush về 0. Trọng số không đổi = không học được. Nhân scale 1024x sẽ đưa giá trị lên 1e-5, nằm trong dải FP16."
        />
      </LessonSection>

      {/* ━━━ 6. INLINE CHALLENGE #2 ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Thử thách 2">
        <InlineChallenge
          question="Mô hình đang train ổn định ở FP32. Bạn bật autocast FP16 (không đổi gì khác) và sau 100 step loss trở thành NaN. Bước đầu tiên bạn nên thử là gì?"
          options={[
            "Tắt hẳn mixed precision và quay lại FP32.",
            "Chuyển sang BF16 nếu GPU hỗ trợ (Ampere+), vì BF16 gần như không cần loss scaling và rất ít khi gây NaN.",
            "Tăng learning rate lên 10x.",
            "Đổi tối ưu hoá từ Adam sang SGD.",
          ]}
          correct={1}
          explanation="BF16 loại bỏ gần như toàn bộ hiện tượng overflow/underflow do có dải exponent rộng như FP32. Nếu không dùng được BF16, bước tiếp theo là tăng initial scale GradScaler hoặc giữ softmax/layernorm ở FP32."
        />
      </LessonSection>

      {/* ━━━ 7. EXPLANATION ━━━ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Mixed Precision Training</strong> (Micikevicius et al., 2018) kết
            hợp nhiều định dạng số thực trong cùng một quá trình huấn luyện, nhằm tận
            dụng tốc độ của Tensor Cores mà vẫn giữ ổn định số học. Khác với{" "}
            <TopicLink slug="quantization">quantization</TopicLink> (thường cho
            inference), mixed precision được dùng khi <em>đang</em> huấn luyện và
            phụ thuộc chặt vào kiến trúc GPU (xem thêm{" "}
            <TopicLink slug="gpu-optimization">tối ưu GPU</TopicLink>).
          </p>

          <p>
            <strong>1. Master Weights FP32.</strong> Ta giữ một bản sao FP32 của
            trọng số để tích luỹ các bước cập nhật nhỏ:
          </p>
          <LaTeX block>
            {"W_{t+1}^{\\text{FP32}} = W_t^{\\text{FP32}} - \\eta \\cdot \\text{unscale}(g_t^{\\text{FP16}})"}
          </LaTeX>
          <p>
            Đầu mỗi step ta cast sang FP16 để forward/backward; cuối step ta unscale
            gradient và cập nhật bản FP32.
          </p>

          <p>
            <strong>2. Loss Scaling.</strong> Gradient thực tế thường nằm trong
            khoảng 1e-9 tới 1e-3. FP16 chỉ phủ ~6e-5 tới 65504. Ta nhân loss lên S
            trước backward để dịch phân phối gradient lên dải FP16:
          </p>
          <LaTeX block>
            {"\\hat{L} = S \\cdot L \\Rightarrow \\hat{g} = S \\cdot g \\Rightarrow g = \\hat{g} / S"}
          </LaTeX>

          <p>
            <strong>3. FP16 / BF16 Compute.</strong> Forward và backward chạy ở 16
            bit trên Tensor Cores. Accumulator (phép cộng) vẫn ở FP32 — tức là
            <code> D = A·B + C</code> với A, B ở FP16 và C, D ở FP32. Cách này giữ
            được độ chính xác khi tổng hàng nghìn phần tử.
          </p>

          <CodeBlock language="python" title="pytorch_amp.py">
{`import torch
from torch import nn
from torch.amp import autocast, GradScaler
from torch.utils.data import DataLoader

device = "cuda"
model = MyTransformer().to(device)
optimizer = torch.optim.AdamW(model.parameters(), lr=3e-4)
criterion = nn.CrossEntropyLoss()

# GradScaler duy nhất cho toàn bộ quá trình train
scaler = GradScaler()

for epoch in range(num_epochs):
    for batch in DataLoader(train_ds, batch_size=32):
        optimizer.zero_grad(set_to_none=True)

        # 1) Forward + loss ở FP16 (hoặc BF16)
        with autocast(device_type=device, dtype=torch.float16):
            logits = model(batch.input_ids)
            loss = criterion(logits, batch.labels)

        # 2) Nhân loss lên S rồi backward (gradient đã được scale)
        scaler.scale(loss).backward()

        # 3) Unscale + clip gradient nếu cần
        scaler.unscale_(optimizer)
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)

        # 4) Step: nếu overflow -> skip, sau đó update scale
        scaler.step(optimizer)
        scaler.update()`}
          </CodeBlock>

          <Callout variant="insight" title="BF16 — tiêu chuẩn của LLM hiện đại">
            Từ Ampere (A100) trở đi, BF16 là mặc định cho pretraining LLM. Mantissa
            thô hơn FP16 không ảnh hưởng trong matmul lớn, nhưng dải exponent rộng
            giúp loại bỏ gần như hoàn toàn overflow/underflow — huấn luyện ổn định,
            không cần GradScaler động.
          </Callout>

          <Callout variant="tip" title="FP8 trên Hopper / H100">
            H100 giới thiệu FP8 với 2 biến thể: E4M3 cho activation (mantissa tốt
            hơn, dải hẹp hơn) và E5M2 cho gradient (dải rộng hơn, mantissa thô).
            Transformer Engine của NVIDIA tự động chọn biến thể phù hợp cho từng
            tensor. Tăng tốc thêm ~2x so với BF16.
          </Callout>

          <p>
            <strong>Cái bẫy cần tránh.</strong> Một số op rất nhạy với FP16 và nên
            giữ ở FP32: softmax (có exp), layernorm (trừ trung bình), loss
            cross-entropy (log), một số op reduce-sum dài. PyTorch autocast xử lý
            phần lớn các trường hợp này, nhưng khi viết kernel custom cần chú ý.
          </p>

          <Callout variant="warning" title="Autocast không bao phủ mọi thứ">
            Các op như <code>torch.cumsum</code>, <code>torch.prod</code>, phép toán
            số phức, và nhiều custom CUDA kernel không có policy autocast. Khi gặp
            NaN, hãy kiểm tra xem có op tự cast mà không thông báo không.
          </Callout>

          <Callout variant="info" title="Tiết kiệm thực tế">
            Một mô hình Llama-13B fine-tune ở FP32 cần ~52 GB VRAM cho weights +
            gradient + optimizer state. Chuyển sang mixed precision BF16 với
            master-weight FP32 còn ~26 GB. Nếu dùng tiếp QLoRA và{" "}
            <TopicLink slug="lora">LoRA</TopicLink>, có thể fit vào 1 GPU 24 GB.
          </Callout>

          <CollapsibleDetail title="Chuyện gì xảy ra bên dưới GradScaler?">
            <div className="space-y-3 text-sm">
              <p>
                GradScaler quản lý một scalar <code>scale</code> và một bộ đếm
                <code> growth_tracker</code>. Mỗi step:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-muted pl-2">
                <li>
                  Khi gọi <code>scale(loss)</code>, nó chỉ là phép nhân vô hướng —
                  không thêm chi phí đáng kể.
                </li>
                <li>
                  Khi <code>backward()</code> chạy, gradient được tính với giá trị
                  đã scale. Không op nào biết nó đang bị scale.
                </li>
                <li>
                  <code>unscale_(optimizer)</code> duyệt toàn bộ param của optimizer
                  đó, chia gradient cho scale và kiểm tra Inf/NaN.
                </li>
                <li>
                  Nếu phát hiện Inf/NaN: bỏ qua <code>optimizer.step()</code>, giảm
                  scale bằng cách nhân với <code>backoff_factor</code> (mặc định
                  0.5), reset growth_tracker.
                </li>
                <li>
                  Nếu ổn: growth_tracker += 1. Khi đạt <code>growth_interval</code>{" "}
                  (mặc định 2000), nhân scale với <code>growth_factor</code> (2.0)
                  để khai thác hết dải FP16.
                </li>
              </ol>
              <p>
                Chiến lược này tự tìm ra scale tối ưu cho từng pha của quá trình
                train — đầu train gradient lớn, giữa train gradient nhỏ dần, scale
                sẽ tự tăng.
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="So sánh chi tiết FP16 vs BF16 vs FP8">
            <div className="space-y-3 text-sm">
              <p>
                <strong>FP16 (IEEE 754 half):</strong> 1 sign + 5 exp + 10 mantissa.
                Bias 15, min normal 6.10e-5, max 65504. Mantissa 10 bit cho ~3-4 chữ
                số thập phân chính xác. Ưu điểm: mantissa chính xác nhất trong nhóm
                16-bit, phần cứng sẵn từ Volta. Nhược: dải hẹp, cần loss scaling.
              </p>
              <p>
                <strong>BF16 (Brain float):</strong> 1 + 8 + 7. Bias 127, cùng dải
                với FP32. Mantissa 7 bit chỉ cho ~2 chữ số thập phân chính xác. Ưu
                điểm: không cần loss scaling, ổn định, tương thích FP32 truncation.
                Nhược: độ phân giải thấp cho hồi quy chính xác cao.
              </p>
              <p>
                <strong>FP8 E4M3:</strong> 1 + 4 + 3. Max ~448, dùng cho weight và
                activation — phân phối thường gọn. Epsilon 0.125.
              </p>
              <p>
                <strong>FP8 E5M2:</strong> 1 + 5 + 2. Max ~57344, dải tương tự FP16,
                dùng cho gradient — phân phối thường có đuôi dài.
              </p>
              <p>
                Khi huấn luyện LLM hiện đại, công thức phổ biến là: forward ở
                E4M3, backward ở E5M2, master weight FP32, optimizer state có thể
                BF16 hoặc FP32.
              </p>
            </div>
          </CollapsibleDetail>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ 8. MINI SUMMARY ━━━ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về Mixed Precision"
          points={[
            "Mixed precision = FP16/BF16 cho forward+backward (nhanh 2-3x trên Tensor Cores) kết hợp FP32 cho master weights và update.",
            "FP16 có dải hẹp (6e-5 → 65504) nên cần loss scaling để gradient không underflow; BF16 có dải như FP32 nên gần như không cần.",
            "GradScaler động: nhân loss lên S trước backward, unscale trước update, tự điều chỉnh S khi phát hiện Inf/NaN.",
            "Tensor Cores chạy matmul 16-bit nhưng accumulate 32-bit — nhờ đó giữ được độ chính xác khi tổng hàng nghìn phần tử.",
            "FP8 trên Hopper dùng E4M3 cho activation và E5M2 cho gradient — tăng tốc thêm 2x so với BF16.",
            "Một số op nhạy (softmax, layernorm, loss CE) nên giữ FP32 để tránh NaN — autocast PyTorch xử lý phần lớn tự động.",
          ]}
        />
      </LessonSection>

      {/* ━━━ 9. QUIZ ━━━ */}
      <LessonSection step={9} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
