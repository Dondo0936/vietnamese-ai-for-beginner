"use client";

import { useState, useMemo } from "react";
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

const METHODS = [
  { name: "Full Fine-tuning", bits: 16, mem: 780, quality: 100, color: "#ef4444" },
  { name: "LoRA (FP16)", bits: 16, mem: 156, quality: 99.5, color: "#f59e0b" },
  { name: "QLoRA (4-bit)", bits: 4, mem: 33, quality: 99, color: "#22c55e" },
];

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
      "QLoRA = Quantize mô hình gốc xuống NF4 (4-bit) + LoRA adapter ở FP16. Kết hợp tiết kiệm bộ nhớ của quantization với hiệu quả fine-tuning của LoRA.",
  },
  {
    question: "NF4 (NormalFloat 4-bit) khác INT4 thông thường ở điểm nào?",
    options: [
      "NF4 nhanh hơn INT4",
      "NF4 được thiết kế tối ưu cho phân bố trọng số dạng chuẩn (Gaussian), bảo toàn thông tin tốt hơn",
      "NF4 dùng nhiều bit hơn INT4",
      "NF4 chỉ dùng cho GPU NVIDIA",
    ],
    correct: 1,
    explanation:
      "Trọng số mạng nơ-ron thường có phân bố gần Gaussian. NF4 đặt các mức lượng tử hoá theo phân bố chuẩn thay vì đều, nên biểu diễn chính xác hơn INT4 với cùng số bit.",
  },
  {
    question: "Double Quantization trong QLoRA tiết kiệm thêm bằng cách nào?",
    options: [
      "Quantize dữ liệu huấn luyện",
      "Quantize cả hằng số quantization (scale factors) từ FP32 xuống FP8",
      "Lượng tử hoá 2 lần cùng trọng số",
      "Giảm rank r của LoRA xuống 2",
    ],
    correct: 1,
    explanation:
      "Mỗi block quantization cần hằng số scale ở FP32. Double Quantization nén các hằng số này xuống FP8, tiết kiệm thêm ~0.37 bit/tham số. Nhỏ nhưng tích luỹ đáng kể trên 65B tham số.",
  },
  {
    type: "fill-blank",
    question:
      "QLoRA nén trọng số mô hình gốc xuống {blank}-bit (định dạng {blank}), trong khi LoRA adapter vẫn giữ ở FP16 để huấn luyện.",
    blanks: [
      { answer: "4", accept: ["4-bit", "four"] },
      { answer: "nf4", accept: ["normalfloat", "normalfloat4", "NF4"] },
    ],
    explanation:
      "QLoRA dùng NF4 (NormalFloat 4-bit) — kiểu dữ liệu 4 bit tối ưu cho phân bố Gaussian của trọng số. Kết quả: giảm 4x VRAM so với FP16, cho phép fine-tune mô hình 65B trên 1 GPU 48GB.",
  },
];

export default function QLoRATopic() {
  const [selected, setSelected] = useState(2);

  return (
    <>
      {/* ━━━ 1. HOOK ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Mô hình 65 tỷ tham số ở FP16 chiếm 130GB VRAM. Bạn chỉ có 1 GPU 48GB. Có thể fine-tune được không?"
          options={[
            "Không thể — phải mua thêm GPU",
            "Có thể — nén mô hình xuống 4-bit rồi fine-tune bằng LoRA",
            "Có thể — chỉ cần giảm batch size xuống 1",
          ]}
          correct={1}
          explanation="QLoRA nén mô hình 65B từ 130GB xuống ~33GB bằng lượng tử hoá 4-bit, rồi fine-tune bằng LoRA adapter ở FP16. Vừa vặn trong 48GB VRAM!"
        >
          <p className="text-sm text-muted mt-2">
            Đây là bước đột phá giúp cá nhân và startup có thể fine-tune mô hình khổng lồ.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ 2. TRỰC QUAN HOÁ ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-1">
            So sánh bộ nhớ GPU — Mô hình 65B
          </h3>
          <p className="text-sm text-muted mb-4">
            Nhấn vào từng phương pháp để so sánh.
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {METHODS.map((m, i) => (
              <button key={i} onClick={() => setSelected(i)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  selected === i ? "text-white" : "bg-card border border-border text-muted hover:text-foreground"
                }`}
                style={selected === i ? { backgroundColor: m.color } : {}}>
                {m.name}
              </button>
            ))}
          </div>

          <svg viewBox="0 0 600 200" className="w-full max-w-2xl mx-auto mb-4">
            {METHODS.map((m, i) => {
              const barWidth = Math.min((m.mem / 780) * 400, 400);
              const y = 20 + i * 60;
              const isSelected = selected === i;
              return (
                <g key={i} opacity={isSelected ? 1 : 0.4}>
                  <text x="10" y={y + 15} fill="var(--text-secondary)" fontSize="10" fontWeight={isSelected ? "bold" : "normal"}>
                    {m.name}
                  </text>
                  <rect x="160" y={y} width={barWidth} height="30" rx="6" fill={m.color} opacity={0.8} />
                  <text x={170 + barWidth} y={y + 20} fill={m.color} fontSize="12" fontWeight="bold">
                    {m.mem} GB
                  </text>
                  {m.mem <= 48 && (
                    <text x={170 + barWidth} y={y + 35} fill="#22c55e" fontSize="8">
                      1 GPU A100 48GB
                    </text>
                  )}
                </g>
              );
            })}
            {/* 48GB line */}
            <line x1={160 + (48 / 780) * 400} y1="10" x2={160 + (48 / 780) * 400} y2="190" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="4,3" />
            <text x={160 + (48 / 780) * 400 + 5} y="195" fill="#22c55e" fontSize="8">48GB (1 GPU)</text>
          </svg>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-lg font-bold" style={{ color: METHODS[selected].color }}>
                {METHODS[selected].mem} GB
              </p>
              <p className="text-xs text-muted">VRAM cần thiết</p>
            </div>
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-lg font-bold" style={{ color: METHODS[selected].color }}>
                {METHODS[selected].quality}%
              </p>
              <p className="text-xs text-muted">Chất lượng (so với Full FT)</p>
            </div>
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-lg font-bold" style={{ color: METHODS[selected].color }}>
                {((1 - METHODS[selected].mem / 780) * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-muted">Tiết kiệm bộ nhớ</p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ 3. AHA MOMENT ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          <strong>QLoRA</strong>{" "}kết hợp hai ý tưởng thiên tài: nén bức tranh gốc
          (quantize 4-bit) để vừa căn phòng nhỏ (GPU), rồi vẽ thêm chi tiết mới trên
          lớp kính mỏng (LoRA adapter). Kết quả: fine-tune mô hình 65B trên{" "}
          <strong>một GPU duy nhất</strong>{" "}mà chất lượng gần bằng dùng 16 GPU!
        </AhaMoment>
      </LessonSection>

      {/* ━━━ 4. THÁCH THỨC ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Tại sao QLoRA dùng NF4 (NormalFloat 4-bit) thay vì INT4 thông thường?"
          options={[
            "NF4 nhanh hơn INT4 trên GPU",
            "Trọng số mạng nơ-ron có phân bố gần Gaussian, NF4 được thiết kế tối ưu cho phân bố này",
            "NF4 tương thích với nhiều framework hơn",
            "NF4 dùng ít bit hơn INT4",
          ]}
          correct={1}
          explanation="Trọng số neural network gần phân bố chuẩn (bell curve). NF4 đặt nhiều mức lượng tử hoá hơn ở vùng mật độ cao (gần 0), ít mức hơn ở đuôi — bảo toàn thông tin tốt hơn INT4 đều đặn."
        />
      </LessonSection>

      {/* ━━━ 5. GIẢI THÍCH SÂU ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>QLoRA</strong>{" "}(Quantized <TopicLink slug="lora">LoRA</TopicLink>)
            kết hợp{" "}<TopicLink slug="quantization">quantization</TopicLink>{" "}và LoRA
            để giảm bộ nhớ <TopicLink slug="fine-tuning">fine-tuning</TopicLink>{" "}
            xuống mức chưa từng có qua ba đổi mới:
          </p>

          <p><strong>1. NF4 (NormalFloat 4-bit):</strong></p>
          <p>
            Kiểu dữ liệu 4-bit tối ưu cho phân bố trọng số dạng chuẩn. Mỗi
            tham số chỉ chiếm 4 bit thay vì 16 bit (FP16):
          </p>
          <LaTeX block>{"\\text{VRAM} = \\frac{N \\times 4}{8} \\text{ bytes} \\quad (\\text{so với } \\frac{N \\times 16}{8} \\text{ ở FP16})"}</LaTeX>

          <p><strong>2. Double Quantization:</strong></p>
          <p>
            Lượng tử hoá cả các hằng số scale. Mỗi block 64 tham số có 1 hằng số FP32,
            Double Quantization nén xuống FP8 — tiết kiệm thêm ~0.37 bit/tham số.
          </p>

          <p><strong>3. Paged Optimizers:</strong></p>
          <p>
            Sử dụng NVIDIA unified memory để tự động chuyển optimizer state giữa GPU và
            CPU khi cần, tránh lỗi out-of-memory.
          </p>

          <CodeBlock language="python" title="qlora_example.py">{`from transformers import BitsAndBytesConfig
from peft import LoraConfig, get_peft_model

# Bước 1: Load mô hình ở 4-bit (QLoRA)
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",       # NormalFloat 4-bit
    bnb_4bit_use_double_quant=True,   # Double Quantization
    bnb_4bit_compute_dtype=torch.bfloat16,
)
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-3-70B",
    quantization_config=bnb_config,
)

# Bước 2: Thêm LoRA adapter (FP16)
lora_config = LoraConfig(r=16, lora_alpha=32)
model = get_peft_model(model, lora_config)
# → 70B model trong ~35GB VRAM, trainable: 0.02%`}</CodeBlock>

          <Callout variant="warning" title="Hạn chế của QLoRA">
            Huấn luyện chậm hơn LoRA thuần vì cần dequantize khi tính toán. Tốc độ
            huấn luyện giảm khoảng 30-50%, nhưng đổi lại là tiết kiệm 4x bộ nhớ.
            Phù hợp khi VRAM là nút cổ chai chính.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ 6. TÓM TẮT ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về QLoRA"
          points={[
            "QLoRA = Quantize mô hình gốc xuống NF4 (4-bit) + LoRA adapter (FP16) — tiết kiệm ~96% VRAM so với full fine-tuning.",
            "Ba đổi mới: NF4 (lượng tử hoá tối ưu cho trọng số), Double Quantization (nén hằng số scale), Paged Optimizers (quản lý bộ nhớ thông minh).",
            "Cho phép fine-tune mô hình 65-70B trên 1 GPU 48GB — dân chủ hoá fine-tuning LLM.",
            "Trade-off: chậm hơn LoRA thuần ~30-50% do dequantization, nhưng chất lượng gần tương đương full FT.",
          ]}
        />
      </LessonSection>

      {/* ━━━ 7. QUIZ ━━━ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
