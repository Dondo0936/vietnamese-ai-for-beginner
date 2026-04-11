"use client";

import { useState } from "react";
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
  slug: "quantization",
  title: "Quantization",
  titleVi: "Lượng tử hóa mô hình",
  description:
    "Kỹ thuật giảm kích thước mô hình bằng cách giảm độ chính xác số học, từ FP32 xuống INT8/INT4.",
  category: "training-optimization",
  tags: ["quantization", "optimization", "inference", "compression"],
  difficulty: "intermediate",
  relatedSlugs: ["qlora", "pruning", "mixed-precision"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

const PRECISIONS = [
  { name: "FP32", bits: 32, size: 100, quality: 100, speed: 1, color: "#3b82f6", example: "3.14159265358979", desc: "32 bit — chính xác tuyệt đối" },
  { name: "FP16", bits: 16, size: 50, quality: 99.9, speed: 2, color: "#8b5cf6", example: "3.14160", desc: "16 bit — mất vài chữ số cuối" },
  { name: "INT8", bits: 8, size: 25, quality: 99.5, speed: 3.5, color: "#f59e0b", example: "3.14", desc: "8 bit — chỉ giữ 3 chữ số" },
  { name: "INT4", bits: 4, size: 12.5, quality: 97, speed: 5, color: "#22c55e", example: "3.0", desc: "4 bit — làm tròn thô" },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Tại sao lượng tử hoá INT4 có thể giảm 8x kích thước mà chỉ mất ~3% chất lượng?",
    options: [
      "Vì mô hình có nhiều tham số dư thừa",
      "Vì trọng số mạng nơ-ron có phân bố tập trung, nhiều giá trị gần nhau — rất ít thông tin bị mất khi làm tròn",
      "Vì INT4 dùng GPU hiệu quả hơn",
      "Vì 4 bit vẫn đủ biểu diễn mọi số thực",
    ],
    correct: 1,
    explanation:
      "Trọng số neural network phân bố gần Gaussian — hầu hết giá trị tập trung quanh 0. Lượng tử hoá làm tròn nhưng phần lớn thông tin quan trọng vẫn được bảo toàn.",
  },
  {
    question: "Phân biệt PTQ và QAT:",
    options: [
      "PTQ nhanh nhưng kém; QAT chậm nhưng tốt hơn vì mô phỏng lượng tử hoá trong quá trình huấn luyện",
      "PTQ tốt hơn QAT trong mọi trường hợp",
      "QAT không cần dữ liệu huấn luyện",
      "PTQ chỉ dùng cho INT8, QAT chỉ dùng cho INT4",
    ],
    correct: 0,
    explanation:
      "PTQ (Post-Training Quantization) nhanh — chỉ cần calibration data. QAT (Quantization-Aware Training) mô phỏng quantization trong forward pass, giúp mô hình 'thích nghi' và giữ chất lượng tốt hơn, đặc biệt ở INT4.",
  },
  {
    question: "Mô hình Llama 3 70B ở FP16 chiếm 140GB. Quantize INT4 chiếm bao nhiêu?",
    options: [
      "70GB", "35GB", "17.5GB", "10GB",
    ],
    correct: 1,
    explanation:
      "FP16 = 16 bit/tham số, INT4 = 4 bit/tham số. Tỷ lệ = 4/16 = 1/4. Nên 140GB / 4 = 35GB — vừa đủ cho 1 GPU RTX 4090 24GB với offloading.",
  },
];

export default function QuantizationTopic() {
  const [selected, setSelected] = useState(0);
  const current = PRECISIONS[selected];

  return (
    <>
      {/* ━━━ 1. HOOK ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Mô hình Llama 3 70B chiếm 140GB — cần 2 GPU A100 80GB. Có cách nào chạy trên 1 GPU 24GB?"
          options={[
            "Không thể — cần mua thêm GPU",
            "Giảm độ chính xác từ 16 bit xuống 4 bit — mô hình nhỏ đi 4 lần mà gần như không mất chất lượng",
            "Xoá bớt 75% tham số của mô hình",
          ]}
          correct={1}
          explanation="Lượng tử hoá giảm số bit biểu diễn mỗi tham số. Từ FP16 (16 bit) xuống INT4 (4 bit) = giảm 4x kích thước. 140GB → 35GB — vừa 1 GPU!"
        >
          <p className="text-sm text-muted mt-2">
            Giống như nén ảnh RAW 50MB thành JPEG 5MB — mắt thường không phân biệt được.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ 2. TRỰC QUAN HOÁ ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-1">
            So sánh các mức lượng tử hoá
          </h3>
          <p className="text-sm text-muted mb-4">
            Chọn từng mức để xem kích thước, chất lượng, và tốc độ thay đổi.
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {PRECISIONS.map((p, i) => (
              <button key={i} onClick={() => setSelected(i)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  selected === i ? "text-white" : "bg-card border border-border text-muted hover:text-foreground"
                }`}
                style={selected === i ? { backgroundColor: p.color } : {}}>
                {p.name} ({p.bits}-bit)
              </button>
            ))}
          </div>

          <svg viewBox="0 0 600 200" className="w-full max-w-2xl mx-auto mb-4">
            <text x="300" y="18" textAnchor="middle" fill="var(--text-primary)" fontSize="12" fontWeight="bold">
              {current.name} ({current.bits}-bit)
            </text>

            {[
              { label: "Kích thước", value: current.size, max: 100, unit: "%", color: current.color },
              { label: "Chất lượng", value: current.quality, max: 100, unit: "%", color: "#22c55e" },
              { label: "Tốc độ", value: current.speed * 20, max: 100, unit: `${current.speed}x`, color: "#f59e0b" },
            ].map((bar, i) => {
              const y = 35 + i * 45;
              return (
                <g key={i}>
                  <text x="15" y={y + 18} fill="var(--text-tertiary)" fontSize="10">{bar.label}</text>
                  <rect x="110" y={y} width="400" height="26" rx="4" fill="none" stroke="var(--bg-card)" strokeWidth="1" />
                  <rect x="110" y={y} width={bar.value * 4} height="26" rx="4" fill={bar.color} opacity={0.8} />
                  <text x={120 + bar.value * 4} y={y + 17} fill={bar.color} fontSize="10" fontWeight="bold">
                    {bar.unit}
                  </text>
                </g>
              );
            })}

            {/* Number representation */}
            <rect x="110" y="170" width="400" height="25" rx="6" fill="var(--bg-surface)" stroke={current.color} strokeWidth="1" />
            <text x="310" y="187" textAnchor="middle" fill={current.color} fontSize="10">
              {current.example} — {current.desc}
            </text>
          </svg>

          <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
            <p className="text-sm text-muted">
              Ví dụ: Llama 70B ở {current.name} ={" "}
              <strong className="text-foreground">
                {current.bits === 32 ? "280 GB (không chạy được consumer GPU)"
                  : current.bits === 16 ? "140 GB (cần 2+ GPU A100 80GB)"
                  : current.bits === 8 ? "70 GB (1 GPU A100 80GB)"
                  : "35 GB (1 GPU RTX 4090 + offload)"}
              </strong>
            </p>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ 3. AHA MOMENT ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          Trọng số mạng nơ-ron không cần chính xác đến từng chữ số thập phân.
          Giống như bạn không cần biết nhiệt độ phòng là 25.347°C — biết là 25°C
          là đủ để quyết định bật quạt hay không. <strong>Lượng tử hoá</strong>{" "}
          khai thác chính điều này: giảm độ chính xác ở mức mà{" "}
          <strong>kết quả cuối cùng gần như không đổi</strong>.
        </AhaMoment>
      </LessonSection>

      {/* ━━━ 4. THÁCH THỨC ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Bạn có mô hình 13B tham số ở FP16 (26GB). GPU của bạn có 16GB VRAM. Lượng tử hoá nào nhỏ nhất mà vẫn dùng được?"
          options={[
            "INT8 — 13GB, vừa đủ",
            "INT4 — 6.5GB, dư nhiều",
            "FP16 — nén dữ liệu khác là đủ",
            "Cần mua GPU mới",
          ]}
          correct={0}
          explanation="INT8 = 26GB / 2 = 13GB, vừa vặn 16GB VRAM. INT4 = 6.5GB cũng được nhưng mất thêm chất lượng không cần thiết. Luôn chọn mức lượng tử hoá cao nhất mà VRAM cho phép."
        />
      </LessonSection>

      {/* ━━━ 5. GIẢI THÍCH SÂU ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Lượng tử hoá</strong>{" "}(Quantization) ánh xạ giá trị liên tục (FP32/FP16)
            sang tập rời rạc ít bit hơn. Công thức cơ bản:
          </p>

          <LaTeX block>{"x_q = \\text{round}\\left(\\frac{x}{s}\\right) + z \\qquad x_{\\text{dequant}} = s \\cdot (x_q - z)"}</LaTeX>

          <p>
            Trong đó <LaTeX>{"s"}</LaTeX> là scale factor và <LaTeX>{"z"}</LaTeX> là zero-point.
          </p>

          <p>Hai phương pháp chính:</p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>PTQ (Post-Training Quantization):</strong>{" "}Lượng tử hoá sau huấn luyện.
              Chỉ cần vài trăm mẫu calibration. Nhanh nhưng có thể giảm chất lượng ở INT4.
            </li>
            <li>
              <strong>QAT (Quantization-Aware Training):</strong>{" "}Mô phỏng lượng tử hoá
              trong forward pass. Mô hình học cách 'bù' lỗi quantization. Tốt hơn PTQ
              nhưng cần huấn luyện lại.
            </li>
          </ul>

          <CodeBlock language="python" title="quantize_model.py">{`from transformers import AutoModelForCausalLM, BitsAndBytesConfig

# Quantize INT4 với bitsandbytes
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16,
)

model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-3-70B",
    quantization_config=bnb_config,
    device_map="auto",
)
# 140GB → 35GB, chạy được trên 1 GPU!`}</CodeBlock>

          <Callout variant="tip" title="GPTQ vs AWQ vs GGUF">
            GPTQ: lượng tử hoá theo nhóm, tối ưu cho GPU.
            AWQ: bảo vệ kênh quan trọng, chất lượng tốt hơn GPTQ.
            GGUF: format của llama.cpp, chạy được trên CPU. Chọn theo phần cứng của bạn.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ 6. TÓM TẮT ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về Quantization"
          points={[
            "Lượng tử hoá giảm số bit mỗi tham số: FP32 (100%) → FP16 (50%) → INT8 (25%) → INT4 (12.5%).",
            "PTQ: nhanh, sau huấn luyện, cần calibration. QAT: chậm hơn nhưng chất lượng tốt hơn.",
            "INT4 giảm 8x kích thước so với FP32 mà chỉ mất ~3% chất lượng — chìa khoá để chạy LLM trên consumer GPU.",
            "Chọn format theo phần cứng: GPTQ/AWQ cho GPU, GGUF cho CPU. Luôn chọn mức bit cao nhất mà VRAM cho phép.",
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
