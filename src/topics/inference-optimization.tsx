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
  slug: "inference-optimization",
  title: "Inference Optimization",
  titleVi: "Tối ưu suy luận — Làm AI nhanh hơn",
  description:
    "Các kỹ thuật tăng tốc và giảm chi phí khi chạy mô hình AI, từ lượng tử hoá đến batching thông minh.",
  category: "infrastructure",
  tags: ["inference", "optimization", "quantization", "latency"],
  difficulty: "advanced",
  relatedSlugs: ["model-serving", "gpu-optimization", "cost-optimization"],
  vizType: "interactive",
};

/* ── Technique simulation data ── */
interface TechConfig {
  id: string;
  label: string;
  bits: number;
  batchSize: number;
  kvCache: boolean;
  prunePercent: number;
}

const PRESETS: TechConfig[] = [
  { id: "baseline", label: "Gốc (FP32)", bits: 32, batchSize: 1, kvCache: false, prunePercent: 0 },
  { id: "fp16", label: "FP16", bits: 16, batchSize: 1, kvCache: false, prunePercent: 0 },
  { id: "int8-batch", label: "INT8 + Batching", bits: 8, batchSize: 16, kvCache: true, prunePercent: 0 },
  { id: "full", label: "Tối ưu toàn bộ", bits: 4, batchSize: 32, kvCache: true, prunePercent: 50 },
];

function calcMetrics(cfg: TechConfig) {
  const memRatio = cfg.bits / 32 * (1 - cfg.prunePercent / 100);
  const memGB = 28 * memRatio;
  const baseLatency = 500;
  const latency = baseLatency / (32 / cfg.bits) / (cfg.kvCache ? 2.5 : 1) * (1 - cfg.prunePercent / 200);
  const throughput = cfg.batchSize * (32 / cfg.bits) * (cfg.kvCache ? 2 : 1);
  const costPer1k = 0.06 / throughput * 100;
  return {
    memGB: Math.max(1.5, memGB),
    latencyMs: Math.max(15, Math.round(latency)),
    throughput: Math.round(throughput),
    costPer1k: Math.max(0.001, costPer1k),
  };
}

const TOTAL_STEPS = 7;

export default function InferenceOptimizationTopic() {
  const [activePreset, setActivePreset] = useState(0);
  const baseline = calcMetrics(PRESETS[0]);
  const current = calcMetrics(PRESETS[activePreset]);

  const speedup = (baseline.latencyMs / current.latencyMs).toFixed(1);
  const memSaving = ((1 - current.memGB / baseline.memGB) * 100).toFixed(0);
  const costSaving = ((1 - current.costPer1k / baseline.costPer1k) * 100).toFixed(0);

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Quantization INT8 giảm bộ nhớ mô hình bao nhiêu so với FP32?",
      options: [
        "Giảm 25% (3/4 còn lại)",
        "Giảm 75% (1/4 còn lại)",
        "Giảm 50% (1/2 còn lại)",
      ],
      correct: 1,
      explanation: "FP32 dùng 32 bit/tham số, INT8 dùng 8 bit/tham số. Tỷ lệ 8/32 = 1/4, nên giảm 75% bộ nhớ. Model 28GB FP32 chỉ còn 7GB INT8.",
    },
    {
      question: "KV Cache giúp tăng tốc inference LLM bằng cách nào?",
      options: [
        "Nén trọng số model nhỏ hơn",
        "Lưu key-value attention đã tính, tránh tính lại cho các token trước",
        "Loại bỏ các layer không quan trọng",
      ],
      correct: 1,
      explanation: "Khi sinh token thứ N, attention cần key-value của N-1 token trước. Thay vì tính lại toàn bộ, KV Cache lưu sẵn — từ O(N^2) xuống O(N) cho mỗi token mới.",
    },
    {
      question: "Continuous batching khác static batching thế nào?",
      options: [
        "Đợi batch đầy rồi xử lý cùng lúc",
        "Request mới được chèn vào batch ngay khi có slot trống, không phải đợi",
        "Xử lý từng request riêng lẻ để giảm latency",
      ],
      correct: 1,
      explanation: "Static batching: đợi N request, xử lý cùng lúc, đợi request dài nhất xong → lãng phí GPU. Continuous batching: request ngắn xong thì nhường slot cho request mới → GPU utilization tăng từ 30% lên 90%+.",
    },
    {
      type: "fill-blank",
      question: "Hai kỹ thuật tăng tốc inference LLM quan trọng nhất: gộp nhiều request lại gọi là {blank}, và lưu attention đã tính để tránh tính lại gọi là {blank}.",
      blanks: [
        { answer: "batching", accept: ["batch", "continuous batching"] },
        { answer: "KV cache", accept: ["kv-cache", "kv cache", "key-value cache"] },
      ],
      explanation: "Batching tăng throughput bằng cách xử lý nhiều request cùng lúc trên GPU. KV cache lưu key-value attention của các token trước, giảm độ phức tạp từ O(N^2) xuống O(N) cho mỗi token mới.",
    },
  ], []);

  return (
    <>
      {/* STEP 1: PREDICTION GATE */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Model Llama-3 70B chạy trên GPU A100 (80GB) tốn 500ms/request và chi phí $0.06/1000 tokens. Bạn cần phục vụ 10.000 người dùng, giải pháp nào giảm chi phí nhiều nhất?"
          options={[
            "Mua thêm 10 GPU A100 để chạy song song",
            "Giảm số tham số model xuống còn 7B",
            "Kết hợp quantization + batching + KV cache trên cùng GPU",
          ]}
          correct={2}
          explanation="Tối ưu inference bằng kỹ thuật phần mềm (quantization, batching, KV cache) có thể giảm chi phí 10-50x mà không cần đổi model hay thêm phần cứng. Đây là cách các công ty như VNG và FPT serving AI thực tế."
        >

      {/* STEP 2: INTERACTIVE VIZ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Chọn các preset tối ưu bên dưới để xem <strong className="text-foreground">bộ nhớ, tốc độ, throughput và chi phí</strong>{" "}
          thay đổi so với baseline.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {PRESETS.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setActivePreset(i)}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    activePreset === i
                      ? "bg-accent text-white"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <svg viewBox="0 0 600 200" className="w-full max-w-2xl mx-auto">
              {/* Memory bar */}
              <text x={15} y={38} fill="#94a3b8" fontSize={10}>Bộ nhớ</text>
              <rect x={100} y={24} width={420} height={22} rx={4} fill="#1e293b" />
              <rect x={100} y={24} width={420 * (current.memGB / baseline.memGB)} height={22} rx={4} fill="#3b82f6" />
              <text x={105 + 420 * (current.memGB / baseline.memGB)} y={40} fill="white" fontSize={10} fontWeight="bold">
                {current.memGB.toFixed(1)}GB
              </text>

              {/* Latency bar */}
              <text x={15} y={78} fill="#94a3b8" fontSize={10}>Latency</text>
              <rect x={100} y={64} width={420} height={22} rx={4} fill="#1e293b" />
              <rect x={100} y={64} width={420 * (current.latencyMs / baseline.latencyMs)} height={22} rx={4} fill="#f59e0b" />
              <text x={105 + 420 * (current.latencyMs / baseline.latencyMs)} y={80} fill="white" fontSize={10} fontWeight="bold">
                {current.latencyMs}ms
              </text>

              {/* Throughput bar */}
              <text x={15} y={118} fill="#94a3b8" fontSize={10}>Throughput</text>
              <rect x={100} y={104} width={420} height={22} rx={4} fill="#1e293b" />
              <rect x={100} y={104} width={Math.min(420, 420 * (current.throughput / 200))} height={22} rx={4} fill="#22c55e" />
              <text x={105 + Math.min(420, 420 * (current.throughput / 200))} y={120} fill="white" fontSize={10} fontWeight="bold">
                {current.throughput} req/s
              </text>

              {/* Summary */}
              <text x={300} y={165} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontWeight="bold">
                Nhanh hơn {speedup}x | RAM giảm {memSaving}% | Chi phí giảm {costSaving}%
              </text>
              <text x={300} y={185} textAnchor="middle" fill="#64748b" fontSize={9}>
                So với baseline FP32 không tối ưu
              </text>
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* STEP 3: AHA */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Bốn kỹ thuật tối ưu kết hợp tạo hiệu ứng <strong>nhân</strong>{" "}
            chứ không phải cộng: quantization 4x nhanh hơn, batching 8x throughput, KV cache 2.5x tốc độ, pruning giảm 50% compute.
            Tổng cộng có thể cải thiện <strong>hàng chục lần</strong>{" "}
            — biến model tỷ tham số từ phòng lab thành sản phẩm thực tế!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* STEP 4: CHALLENGE */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Model GPT-4 class (1.8T params, FP16) cần khoảng 3.6TB VRAM. GPU A100 có 80GB. Cần tối thiểu bao nhiêu GPU nếu chỉ dùng tensor parallelism?"
          options={[
            "18 GPU (3600 / 200)",
            "45 GPU (3600 / 80)",
            "90 GPU (cần overhead 2x)",
          ]}
          correct={1}
          explanation="3600GB / 80GB = 45 GPU A100 tối thiểu chỉ để chứa model weights. Thực tế cần thêm bộ nhớ cho KV cache và activations, nên dùng khoảng 50-60 GPU. Đây là lý do quantization rất quan trọng — INT4 giảm còn 900GB, chỉ cần 12 GPU!"
        />
      </LessonSection>

      {/* STEP 5: EXPLANATION */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Tối ưu suy luận (Inference Optimization)</strong>{" "}
            là tập hợp kỹ thuật giúp model AI chạy nhanh hơn, tốn ít bộ nhớ hơn, và chi phí thấp hơn khi phục vụ người dùng thực tế.
          </p>

          <p><strong>1. <TopicLink slug="quantization">Quantization</TopicLink>{" "}(Lượng tử hoá)</strong></p>
          <p>Giảm số bit biểu diễn mỗi tham số:</p>
          <LaTeX block>{"\\text{Memory} = \\text{Params} \\times \\frac{\\text{Bits}}{8} \\text{ bytes}"}</LaTeX>
          <p>
            Model 7B tham số: FP32 = 28GB, FP16 = 14GB, INT8 = 7GB, INT4 = 3.5GB.
          </p>

          <p><strong>2. <TopicLink slug="kv-cache">KV Cache</TopicLink></strong></p>
          <p>Lưu key-value attention đã tính, kết hợp với <TopicLink slug="model-serving">model serving</TopicLink>{" "}và <TopicLink slug="gpu-optimization">tối ưu GPU</TopicLink>{" "}để đạt throughput tối đa:</p>
          <LaTeX block>{"\\text{KV Cache size} = 2 \\times n_{\\text{layers}} \\times n_{\\text{heads}} \\times d_{\\text{head}} \\times \\text{seq\\_len} \\times \\text{batch} \\times \\text{bytes}"}</LaTeX>

          <p><strong>3. Continuous Batching</strong></p>
          <LaTeX block>{"\\text{GPU Utilization} = \\frac{\\text{Active compute}}{\\text{Available compute}} \\approx \\frac{\\text{batch\\_size} \\times \\text{FLOPs/token}}{\\text{GPU peak FLOPs}}"}</LaTeX>

          <Callout variant="tip" title="PagedAttention (vLLM)">
            Thay vì cấp phát bộ nhớ KV cache liên tục (gây lãng phí), PagedAttention chia thành page nhỏ như virtual memory trong hệ điều hành. Kết quả: tăng batch size 2-4x, giảm lãng phí bộ nhớ từ 60% xuống 4%.
          </Callout>

          <p><strong>4. Pruning (Tỉa mô hình)</strong></p>
          <LaTeX block>{"\\text{Pruned model} = \\text{Original} \\odot \\mathbf{M}, \\quad M_{ij} = \\begin{cases} 1 & |w_{ij}| > \\theta \\\\ 0 & \\text{otherwise} \\end{cases}"}</LaTeX>

          <CodeBlock language="python" title="Inference tối ưu với vLLM + AWQ quantization">
{`from vllm import LLM, SamplingParams

# Model đã quantize AWQ 4-bit: 70B params chỉ 35GB
llm = LLM(
    model="TheBloke/Llama-3-70B-AWQ",
    quantization="awq",            # 4-bit quantization
    tensor_parallel_size=2,        # 2 GPU A100
    max_model_len=8192,
    gpu_memory_utilization=0.95,
    enable_prefix_caching=True,    # Cache common prefixes
)

params = SamplingParams(
    temperature=0.7,
    max_tokens=512,
    top_p=0.9,
)

# vLLM tự động: continuous batching + PagedAttention + KV cache
outputs = llm.generate(["Giải thích AI cho học sinh Việt Nam"], params)
# Throughput: ~2000 tokens/s trên 2x A100 (vs 200 tokens/s naive)`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      {/* STEP 6: SUMMARY */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "Quantization giảm bit/param (FP32→INT4): giảm 8x bộ nhớ, tăng 2-4x tốc độ, chất lượng giảm rất ít.",
          "KV Cache lưu attention đã tính, tránh tính lại O(N^2) cho mỗi token mới.",
          "Continuous Batching cho request mới vào ngay khi có slot, tăng GPU utilization từ 30% lên 90%+.",
          "PagedAttention (vLLM) quản lý KV cache như virtual memory, tăng batch size 2-4x.",
          "Kết hợp tất cả kỹ thuật giảm chi phí serving 10-50x — biến model tỷ tham số thành sản phẩm thực tế.",
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
