"use client";

import { useState, useMemo } from "react";
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
  { name: "Phi-3 Mini", params: "3.8B", ram: "2.4GB", device: "Dien thoai", mmlu: 69, speed: "30 tok/s", cost: "Mien phi" },
  { name: "Gemma 2", params: "9B", ram: "5.5GB", device: "Laptop", mmlu: 72, speed: "20 tok/s", cost: "Mien phi" },
  { name: "Llama 3.1", params: "8B", ram: "4.9GB", device: "Laptop", mmlu: 73, speed: "25 tok/s", cost: "Mien phi" },
  { name: "Qwen 2.5", params: "7B", ram: "4.3GB", device: "Laptop", mmlu: 74, speed: "22 tok/s", cost: "Mien phi" },
  { name: "GPT-4o mini", params: "?", ram: "Cloud", device: "API", mmlu: 82, speed: "80 tok/s", cost: "$0.15/1M tok" },
  { name: "Claude Haiku", params: "?", ram: "Cloud", device: "API", mmlu: 80, speed: "100 tok/s", cost: "$0.25/1M tok" },
];

const TOTAL_STEPS = 7;

export default function SmallLanguageModelsTopic() {
  const [activeModel, setActiveModel] = useState(0);
  const model = MODELS[activeModel];

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Tai sao SLM 3B co the dat 85-90% chat luong GPT-4 trong nhieu tac vu?",
      options: [
        "GPT-4 khong tot nhu quang cao",
        "Du lieu huan luyen CHAT LUONG CAO + distillation tu model lon cho SLM kien thuc co dang",
        "3B va 1.8T tham so cho ket qua giong nhau",
      ],
      correct: 1,
      explanation: "Phi-3 cua Microsoft chung minh: 3.8B params train tren data 'textbook quality' dat MMLU 69% (GPT-3.5 level). Bi quyet: du lieu sach, co dang, da dang thay vi dump toan bo internet. Ket hop distillation tu model lon → SLM hoc duoc 'tu duy' cua model lon.",
    },
    {
      question: "Self-host SLM vs dung API model lon, khi nao chon SLM?",
      options: [
        "Luon chon SLM vi mien phi",
        "Khi can: privacy (data khong roi thiet bi), offline, latency thap, volume cao (tiet kiem chi phi)",
        "Chi khi khong co internet",
      ],
      correct: 1,
      explanation: "SLM thang khi: (1) Data nhay cam (y te, tai chinh — khong muon gui len cloud), (2) Volume cao (1M req/ngay × $0.15 = $150/ngay API vs $0 SLM), (3) Latency yeu cau (< 100ms), (4) Offline (nha may, nong thon). API thang khi: can chat luong cao nhat, volume thap, khong muon quan ly infra.",
    },
    {
      question: "Ky thuat nao KHONG giup SLM dat chat luong cao?",
      options: [
        "Knowledge distillation tu model lon",
        "Tang so epoch training len 1000x",
        "High-quality curated training data",
      ],
      correct: 1,
      explanation: "Tang epoch khong giup — model nho bi overfitting nhanh. Chinook scaling law: model nho can IT DATA HON model lon. Bi quyet: data CHAT LUONG (textbook, curated) thay vi data NHIEU. Distillation chuyen kien thuc tu model lon → hieu qua hon train tu scratch.",
    },
  ], []);

  return (
    <>
      {/* STEP 1: PREDICTION GATE */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Du doan">
        <PredictionGate
          question="Cong ty ban can chatbot tra loi FAQ khach hang. 90% cau hoi don gian, 10K requests/ngay. GPT-4 API ton $150/ngay. Co giai phap re hon 10x ma van tot?"
          options={[
            "Khong — can GPT-4 de dam bao chat luong",
            "Tu host Llama-8B tren 1 GPU: mien phi, accuracy 90% cho FAQ don gian",
            "Dung GPT-3.5 API re hon mot chut",
          ]}
          correct={1}
          explanation="SLM 8B xu ly FAQ don gian rat tot (accuracy 90%+). Tu host tren 1 GPU: chi phi $3/ngay (so voi $150/ngay API). Giam 50x chi phi! Giong cua hang tien loi — khong can sieu thi cho nhu cau hang ngay."
        >

      {/* STEP 2: INTERACTIVE VIZ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Kham pha">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          So sanh <strong className="text-foreground">cac model ngon ngu</strong>{" "}
          — tu SLM chay tren dien thoai den LLM tren cloud.
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
                <p className="text-xs text-muted">Toc do</p>
                <p className="text-sm font-bold text-amber-400">{model.speed}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-2">
                <p className="text-xs text-muted">Chi phi</p>
                <p className="text-sm font-bold text-purple-400">{model.cost}</p>
              </div>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* STEP 3: AHA */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoanh khac Aha">
        <AhaMoment>
          <p>
            SLM la <strong>cua hang tien loi</strong>{" "}— khong co MOI THU nhu sieu thi (GPT-4),
            nhung co DU thu ban can hang ngay. Phi-3 Mini (3.8B) dat <strong>MMLU 69%</strong>{" "}
            — ngang GPT-3.5! Bi quyet khong phai nhieu tham so, ma la{" "}
            <strong>du lieu huan luyen chat luong cao</strong>{" "}(textbook quality data).
          </p>
        </AhaMoment>
      </LessonSection>

      {/* STEP 4: CHALLENGE */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thu thach">
        <InlineChallenge
          question="Ban can chatbot cho ung dung y te tren dien thoai. Data benh nhan KHONG DUOC gui len cloud (HIPAA compliance). Model can chay tren iPhone 15 (8GB RAM). Chon model nao?"
          options={[
            "GPT-4 API — manh nhat, lo privacy sau",
            "Phi-3 Mini 3.8B quantized INT4 (~2GB RAM) — chay on-device, data khong roi dien thoai",
            "Llama 70B — manh nhat trong open source",
          ]}
          correct={1}
          explanation="HIPAA cam gui data len cloud → chi co on-device. iPhone 15 co 8GB RAM (chia voi OS, con ~4GB cho app). Phi-3 Mini INT4: ~2GB RAM, chay duoc. Llama 70B: 35GB RAM — khong thể. Privacy + performance + size — SLM la giai phap duy nhat!"
        />
      </LessonSection>

      {/* STEP 5: EXPLANATION */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Ly thuyet">
        <ExplanationSection>
          <p>
            <strong>Small Language Models (SLM)</strong>{" "}
            la model ngon ngu duoi 10B params, duoc toi uu de chay tren thiet bi ca nhan voi chat luong ngay cang gan model lon.
          </p>

          <p><strong>Scaling law moi — chat luong &gt; so luong:</strong></p>
          <LaTeX block>{"\\text{Performance} \\propto \\log(N) \\cdot Q_{\\text{data}} \\quad (N = \\text{params}, Q = \\text{data quality})"}</LaTeX>
          <p>
            Data chat luong x10 &gt; params x10. Phi-3 (3.8B, textbook data) vuot GPT-3.5 (175B, web data).
          </p>

          <p><strong>3 ky thuat tao SLM chat luong cao:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Data curation:</strong>{" "}Loc du lieu chat luong cao, loai bo spam/toxic/duplicate. &quot;Textbook quality&quot; data</li>
            <li><strong>Knowledge Distillation:</strong>{" "}Model lon (teacher) day model nho (student) — chuyen kien thuc co dang</li>
            <li><strong>Architecture optimization:</strong>{" "}Grouped Query Attention, SwiGLU, RoPE — thiet ke rieng cho SLM</li>
          </ul>

          <LaTeX block>{"\\mathcal{L}_{\\text{distill}} = \\alpha \\cdot \\text{KL}(p_{\\text{student}} \\| p_{\\text{teacher}}) + (1 - \\alpha) \\cdot \\mathcal{L}_{\\text{CE}}"}</LaTeX>

          <Callout variant="tip" title="On-device RAM budget">
            iPhone 15: 8GB RAM tong, ~4GB cho app. Model INT4: ~0.5GB/1B params. Vay chay duoc toi da ~8B params. Android flagship: 12-16GB, chay duoc 12-14B. Day la ly do SLM focus vao range 1-10B.
          </Callout>

          <p><strong>Deployment pipeline cho SLM:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Quantize:</strong>{" "}FP16 → INT4 (GGUF format) giam 4x size</li>
            <li><strong>Optimize:</strong>{" "}llama.cpp, MLX (Apple), MediaPipe (Android) cho inference nhanh</li>
            <li><strong>Fine-tune:</strong>{" "}LoRA adapter cho domain cu the (y te, phap luat)</li>
          </ul>

          <CodeBlock language="python" title="Chay SLM tren dien thoai voi llama.cpp">
{`# Quantize model: FP16 → INT4 GGUF
# python convert.py llama-3-8b/ --outtype q4_K_M

# llama.cpp server (chay tren may tinh hoac server)
# ./server -m llama-3-8b-q4_K_M.gguf -c 4096 --port 8080

# Python client
from llama_cpp import Llama

# Load model INT4 — chi 4.9GB RAM
llm = Llama(
    model_path="llama-3-8b-q4_K_M.gguf",
    n_ctx=4096,           # Context window
    n_gpu_layers=-1,      # All layers on GPU/NPU
    verbose=False,
)

# Inference — 25 tokens/s tren M2 MacBook
output = llm(
    "Trieu chung sot xuat huyet la gi?",
    max_tokens=256,
    temperature=0.7,
)
print(output["choices"][0]["text"])
# Accuracy 90%+ cho FAQ y te, latency 50ms`}
          </CodeBlock>

          <Callout variant="info" title="SLM tai Viet Nam">
            Viettel AI da fine-tune Llama cho tieng Viet. FPT AI dung SLM cho chatbot noi bo. Nhieu startup Viet chon Qwen-7B (ho tro tieng Viet tot) tu host tren FPT Cloud de giam chi phi 90% so voi GPT-4 API.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* STEP 6: SUMMARY */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tom tat">
        <MiniSummary points={[
          "SLM (1-10B params) chay tren dien thoai/laptop, dat 85-90% chat luong model lon cho tac vu thuong ngay.",
          "Bi quyet: data chat luong cao (textbook quality) + distillation tu model lon, khong phai nhieu params.",
          "On-device: privacy tuyet doi, latency thap, offline, mien phi. Trade-off: kem model lon o tac vu phuc tap.",
          "Quantization INT4 giam 4x size: model 8B chi 4.9GB RAM — vua dien thoai.",
          "Xu huong: SLM + fine-tune domain-specific thay the API model lon cho 80% use cases, giam chi phi 10-50x.",
        ]} />
      </LessonSection>

      {/* STEP 7: QUIZ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiem tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>

        </PredictionGate>
      </LessonSection>
    </>
  );
}
