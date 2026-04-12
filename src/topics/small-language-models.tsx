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
  slug: "small-language-models",
  title: "Small Language Models",
  titleVi: "Mô hình ngôn ngữ nhỏ — Nhỏ mà có võ",
  description:
    "Mô hình ngôn ngữ dưới 10B tham số được tối ưu để chạy trên thiết bị cá nhân với chất lượng ngày càng tiệm cận mô hình lớn.",
  category: "emerging",
  tags: ["slm", "small", "efficient", "on-device"],
  difficulty: "intermediate",
  relatedSlugs: ["edge-ai", "inference-optimization", "moe"],
  vizType: "interactive",
};

/* ── Model comparison data ── */
interface ModelSpec {
  name: string;
  params: string;
  ram: string;
  device: string;
  mmlu: number;
  speed: string;
  cost: string;
}

const MODELS: ModelSpec[] = [
  { name: "Phi-3 Mini", params: "3.8B", ram: "2.4GB", device: "Điện thoại", mmlu: 69, speed: "30 tok/s", cost: "Miễn phí" },
  { name: "Gemma 2", params: "9B", ram: "5.5GB", device: "Laptop", mmlu: 72, speed: "20 tok/s", cost: "Miễn phí" },
  { name: "Llama 3.1", params: "8B", ram: "4.9GB", device: "Laptop", mmlu: 73, speed: "25 tok/s", cost: "Miễn phí" },
  { name: "Qwen 2.5", params: "7B", ram: "4.3GB", device: "Laptop", mmlu: 74, speed: "22 tok/s", cost: "Miễn phí" },
  { name: "GPT-4o mini", params: "?", ram: "Cloud", device: "API", mmlu: 82, speed: "80 tok/s", cost: "$0.15/1M tok" },
  { name: "Claude Haiku", params: "?", ram: "Cloud", device: "API", mmlu: 80, speed: "100 tok/s", cost: "$0.25/1M tok" },
];

const TOTAL_STEPS = 7;

export default function SmallLanguageModelsTopic() {
  const [activeModel, setActiveModel] = useState(0);
  const model = MODELS[activeModel];

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Tại sao SLM 3B có thể đạt 85-90% chất lượng GPT-4 trong nhiều tác vụ?",
      options: [
        "GPT-4 không tốt như quảng cáo",
        "Dữ liệu huấn luyện CHẤT LƯỢNG CAO + distillation từ model lớn cho SLM kiến thức cô đọng",
        "3B và 1.8T tham số cho kết quả giống nhau",
      ],
      correct: 1,
      explanation: "Phi-3 của Microsoft chứng minh: 3.8B params train trên data 'textbook quality' đạt MMLU 69% (GPT-3.5 level). Bí quyết: dữ liệu sạch, cô đọng, đa dạng thay vì dump toàn bộ internet. Kết hợp distillation từ model lớn → SLM học được 'tư duy' của model lớn.",
    },
    {
      question: "Self-host SLM vs dùng API model lớn, khi nào chọn SLM?",
      options: [
        "Luôn chọn SLM vì miễn phí",
        "Khi cần: privacy (data không rời thiết bị), offline, latency thấp, volume cao (tiết kiệm chi phí)",
        "Chỉ khi không có internet",
      ],
      correct: 1,
      explanation: "SLM thắng khi: (1) Data nhạy cảm (y tế, tài chính — không muốn gửi lên cloud), (2) Volume cao (1M req/ngày x $0.15 = $150/ngày API vs $0 SLM), (3) Latency yêu cầu (< 100ms), (4) Offline (nhà máy, nông thôn). API thắng khi: cần chất lượng cao nhất, volume thấp, không muốn quản lý infra.",
    },
    {
      question: "Kỹ thuật nào KHÔNG giúp SLM đạt chất lượng cao?",
      options: [
        "Knowledge distillation từ model lớn",
        "Tăng số epoch training lên 1000x",
        "High-quality curated training data",
      ],
      correct: 1,
      explanation: "Tăng epoch không giúp — model nhỏ bị overfitting nhanh. Chinook scaling law: model nhỏ cần ÍT DATA HƠN model lớn. Bí quyết: data CHẤT LƯỢNG (textbook, curated) thay vì data NHIỀU. Distillation chuyển kiến thức từ model lớn → hiệu quả hơn train từ scratch.",
    },
    {
      type: "fill-blank",
      question: "SLM được thiết kế để chạy {blank} (trên thiết bị người dùng), thường nhờ kỹ thuật {blank} (FP16 → INT4) giảm 4x bộ nhớ.",
      blanks: [
        { answer: "on-device", accept: ["ondevice", "on device", "trên thiết bị", "tren thiet bi"] },
        { answer: "quantization", accept: ["lượng tử hoá", "luong tu hoa", "quantize"] },
      ],
      explanation: "SLM thường chạy on-device (điện thoại, laptop, edge) để đảm bảo privacy, latency thấp và offline. Quantization INT4 (GGUF, AWQ) giảm 4x bộ nhớ so với FP16 — Phi-3 Mini 3.8B chỉ cần ~2GB RAM sau quantization.",
    },
  ], []);

  return (
    <>
      {/* STEP 1: PREDICTION GATE */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Công ty bạn cần chatbot trả lời FAQ khách hàng. 90% câu hỏi đơn giản, 10K requests/ngày. GPT-4 API tốn $150/ngày. Có giải pháp rẻ hơn 10x mà vẫn tốt?"
          options={[
            "Không — cần GPT-4 để đảm bảo chất lượng",
            "Tự host Llama-8B trên 1 GPU: miễn phí, accuracy 90% cho FAQ đơn giản",
            "Dùng GPT-3.5 API rẻ hơn một chút",
          ]}
          correct={1}
          explanation="SLM 8B xử lý FAQ đơn giản rất tốt (accuracy 90%+). Tự host trên 1 GPU: chi phí $3/ngày (so với $150/ngày API). Giảm 50x chi phí! Giống cửa hàng tiện lợi — không cần siêu thị cho nhu cầu hàng ngày."
        >

      {/* STEP 2: INTERACTIVE VIZ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          So sánh <strong className="text-foreground">các model ngôn ngữ</strong>{" "}
          — từ SLM chạy trên điện thoại đến LLM trên cloud.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {MODELS.map((m, i) => (
                <button
                  key={i}
                  onClick={() => setActiveModel(i)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    activeModel === i
                      ? "bg-accent text-white"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>

            <svg viewBox="0 0 600 180" className="w-full max-w-2xl mx-auto">
              {/* MMLU score comparison */}
              {MODELS.map((m, i) => {
                const y = 15 + i * 26;
                const barW = (m.mmlu / 85) * 350;
                const isActive = i === activeModel;
                return (
                  <g key={i}>
                    <text x={15} y={y + 14} fill={isActive ? "#e2e8f0" : "#64748b"} fontSize={8} fontWeight={isActive ? "bold" : "normal"}>
                      {m.name}
                    </text>
                    <rect x={120} y={y} width={350} height={20} rx={3} fill="#1e293b" />
                    <rect x={120} y={y} width={barW} height={20} rx={3}
                      fill={i < 4 ? "#22c55e" : "#3b82f6"}
                      opacity={isActive ? 1 : 0.4}
                    />
                    <text x={125 + barW} y={y + 14} fill="white" fontSize={9} fontWeight="bold">
                      {m.mmlu}%
                    </text>
                    <text x={530} y={y + 14} fill="#94a3b8" fontSize={7}>{m.device}</text>
                  </g>
                );
              })}
            </svg>

            {/* Selected model details */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
              <div className="rounded-lg border border-border bg-card p-2">
                <p className="text-xs text-muted">Params</p>
                <p className="text-sm font-bold text-blue-400">{model.params}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-2">
                <p className="text-xs text-muted">RAM</p>
                <p className="text-sm font-bold text-green-400">{model.ram}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-2">
                <p className="text-xs text-muted">Tốc độ</p>
                <p className="text-sm font-bold text-amber-400">{model.speed}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-2">
                <p className="text-xs text-muted">Chi phí</p>
                <p className="text-sm font-bold text-purple-400">{model.cost}</p>
              </div>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* STEP 3: AHA */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            SLM là <strong>cửa hàng tiện lợi</strong>{" "}— không có MỌI THỨ như siêu thị (GPT-4),
            nhưng có ĐỦ thứ bạn cần hàng ngày. Phi-3 Mini (3.8B) đạt <strong>MMLU 69%</strong>{" "}
            — ngang GPT-3.5! Bí quyết không phải nhiều tham số, mà là{" "}
            <strong>dữ liệu huấn luyện chất lượng cao</strong>{" "}(textbook quality data).
          </p>
        </AhaMoment>
      </LessonSection>

      {/* STEP 4: CHALLENGE */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Bạn cần chatbot cho ứng dụng y tế trên điện thoại. Data bệnh nhân KHÔNG ĐƯỢC gửi lên cloud (HIPAA compliance). Model cần chạy trên iPhone 15 (8GB RAM). Chọn model nào?"
          options={[
            "GPT-4 API — mạnh nhất, lo privacy sau",
            "Phi-3 Mini 3.8B quantized INT4 (~2GB RAM) — chạy on-device, data không rời điện thoại",
            "Llama 70B — mạnh nhất trong open source",
          ]}
          correct={1}
          explanation="HIPAA cấm gửi data lên cloud → chỉ có on-device. iPhone 15 có 8GB RAM (chia với OS, còn ~4GB cho app). Phi-3 Mini INT4: ~2GB RAM, chạy được. Llama 70B: 35GB RAM — không thể. Privacy + performance + size — SLM là giải pháp duy nhất!"
        />
      </LessonSection>

      {/* STEP 5: EXPLANATION */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Small Language Models (SLM)</strong>{" "}
            là model ngôn ngữ dưới 10B params, được tối ưu để chạy trên thiết bị cá nhân với chất lượng ngày càng gần model lớn. SLM thường được tạo ra bằng cách kết hợp{" "}
            <TopicLink slug="distillation">knowledge distillation</TopicLink>{" "}
            từ model lớn và{" "}
            <TopicLink slug="quantization">quantization</TopicLink>{" "}
            (FP16 → INT4) để vừa bộ nhớ thiết bị.
          </p>

          <p><strong>Scaling law mới — chất lượng &gt; số lượng:</strong></p>
          <LaTeX block>{"\\text{Performance} \\propto \\log(N) \\cdot Q_{\\text{data}} \\quad (N = \\text{params}, Q = \\text{data quality})"}</LaTeX>
          <p>
            Data chất lượng x10 &gt; params x10. Phi-3 (3.8B, textbook data) vượt GPT-3.5 (175B, web data).
          </p>

          <p><strong>3 kỹ thuật tạo SLM chất lượng cao:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Data curation:</strong>{" "}Lọc dữ liệu chất lượng cao, loại bỏ spam/toxic/duplicate. 'Textbook quality' data</li>
            <li><strong>Knowledge Distillation:</strong>{" "}Model lớn (teacher) dạy model nhỏ (student) — chuyển kiến thức cô đọng</li>
            <li><strong>Architecture optimization:</strong>{" "}Grouped Query Attention, SwiGLU, RoPE — thiết kế riêng cho SLM</li>
          </ul>

          <LaTeX block>{"\\mathcal{L}_{\\text{distill}} = \\alpha \\cdot \\text{KL}(p_{\\text{student}} \\| p_{\\text{teacher}}) + (1 - \\alpha) \\cdot \\mathcal{L}_{\\text{CE}}"}</LaTeX>

          <Callout variant="tip" title="On-device RAM budget">
            iPhone 15: 8GB RAM tổng, ~4GB cho app. Model INT4: ~0.5GB/1B params. Vậy chạy được tối đa ~8B params. Android flagship: 12-16GB, chạy được 12-14B. Đây là lý do SLM focus vào range 1-10B.
          </Callout>

          <p><strong>Deployment pipeline cho SLM:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Quantize:</strong>{" "}FP16 → INT4 (GGUF format) giảm 4x size</li>
            <li><strong>Optimize:</strong>{" "}llama.cpp, MLX (Apple), MediaPipe (Android) cho inference nhanh</li>
            <li><strong>Fine-tune:</strong>{" "}LoRA adapter cho domain cụ thể (y tế, pháp luật)</li>
          </ul>

          <CodeBlock language="python" title="Chạy SLM trên điện thoại với llama.cpp">
{`# Quantize model: FP16 → INT4 GGUF
# python convert.py llama-3-8b/ --outtype q4_K_M

# llama.cpp server (chạy trên máy tính hoặc server)
# ./server -m llama-3-8b-q4_K_M.gguf -c 4096 --port 8080

# Python client
from llama_cpp import Llama

# Load model INT4 — chỉ 4.9GB RAM
llm = Llama(
    model_path="llama-3-8b-q4_K_M.gguf",
    n_ctx=4096,           # Context window
    n_gpu_layers=-1,      # All layers on GPU/NPU
    verbose=False,
)

# Inference — 25 tokens/s trên M2 MacBook
output = llm(
    "Triệu chứng sốt xuất huyết là gì?",
    max_tokens=256,
    temperature=0.7,
)
print(output["choices"][0]["text"])
# Accuracy 90%+ cho FAQ y tế, latency 50ms`}
          </CodeBlock>

          <Callout variant="info" title="SLM tại Việt Nam">
            Viettel AI đã fine-tune Llama cho tiếng Việt. FPT AI dùng SLM cho chatbot nội bộ. Nhiều startup Việt chọn Qwen-7B (hỗ trợ tiếng Việt tốt) tự host trên FPT Cloud để giảm chi phí 90% so với GPT-4 API.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* STEP 6: SUMMARY */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "SLM (1-10B params) chạy trên điện thoại/laptop, đạt 85-90% chất lượng model lớn cho tác vụ thường ngày.",
          "Bí quyết: data chất lượng cao (textbook quality) + distillation từ model lớn, không phải nhiều params.",
          "On-device: privacy tuyệt đối, latency thấp, offline, miễn phí. Trade-off: kém model lớn ở tác vụ phức tạp.",
          "Quantization INT4 giảm 4x size: model 8B chỉ 4.9GB RAM — vừa điện thoại.",
          "Xu hướng: SLM + fine-tune domain-specific thay thế API model lớn cho 80% use cases, giảm chi phí 10-50x.",
        ]} />
      </LessonSection>

      {/* STEP 7: QUIZ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>

        </PredictionGate>
      </LessonSection>
    </>
  );
}
