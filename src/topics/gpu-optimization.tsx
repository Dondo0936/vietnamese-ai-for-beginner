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
  slug: "gpu-optimization",
  title: "GPU Optimization",
  titleVi: "Tối ưu GPU — Vắt kiệt sức mạnh phần cứng",
  description:
    "Các kỹ thuật tận dụng tối đa khả năng tính toán song song của GPU cho huấn luyện và suy luận mô hình AI.",
  category: "infrastructure",
  tags: ["gpu", "cuda", "parallel", "hardware"],
  difficulty: "advanced",
  relatedSlugs: ["inference-optimization", "model-serving", "cost-optimization"],
  vizType: "interactive",
};

/* ── Parallelism strategy simulator ── */
interface Strategy {
  name: string;
  desc: string;
  gpuUtil: number;
  memUtil: number;
  commOverhead: number;
  maxModelSize: string;
}

const STRATEGIES: Strategy[] = [
  { name: "Không tối ưu", desc: "1 GPU, FP32, batch nhỏ", gpuUtil: 25, memUtil: 90, commOverhead: 0, maxModelSize: "7B" },
  { name: "Mixed Precision", desc: "FP16/BF16 training", gpuUtil: 50, memUtil: 55, commOverhead: 0, maxModelSize: "13B" },
  { name: "Data Parallel", desc: "Copy model ra N GPU", gpuUtil: 70, memUtil: 90, commOverhead: 15, maxModelSize: "13B" },
  { name: "Tensor Parallel", desc: "Chia layer qua N GPU", gpuUtil: 80, memUtil: 60, commOverhead: 25, maxModelSize: "70B" },
  { name: "Pipeline Parallel", desc: "Chia layers thành stages", gpuUtil: 65, memUtil: 50, commOverhead: 10, maxModelSize: "175B" },
  { name: "Full FSDP", desc: "Shard mọi thứ qua N GPU", gpuUtil: 85, memUtil: 40, commOverhead: 20, maxModelSize: "405B" },
];

const TOTAL_STEPS = 7;

export default function GPUOptimizationTopic() {
  const [activeStrategy, setActiveStrategy] = useState(0);
  const strategy = STRATEGIES[activeStrategy];

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Mixed Precision (FP16) tăng tốc GPU bằng cách nào?",
      options: [
        "Sử dụng nhiều GPU hơn",
        "Giảm số bit/phép tính, tăng gấp đôi throughput Tensor Cores + giảm memory bandwidth",
        "Bỏ một số layer để model nhỏ hơn",
      ],
      correct: 1,
      explanation: "Tensor Cores trên NVIDIA GPU xử lý FP16 nhanh gấp 2x FP32. FP16 cũng giảm 50% memory bandwidth (bottleneck chính). Kết hợp cả hai: training nhanh hơn 1.5-2x mà accuracy gần như không đổi.",
    },
    {
      question: "Data Parallelism vs Tensor Parallelism khác nhau thế nào?",
      options: [
        "Data Parallel chia data qua GPU, Tensor Parallel chia model qua GPU",
        "Chúng giống nhau, chỉ khác tên gọi",
        "Data Parallel cho inference, Tensor Parallel cho training",
      ],
      correct: 0,
      explanation: "Data Parallel: mỗi GPU có copy đầy đủ model, xử lý batch data khác nhau, sync gradients. Tensor Parallel: mỗi GPU chỉ có 1 phần model, cần giao tiếp mỗi layer. DP dễ triển khai, TP cần thiết khi model không vừa 1 GPU.",
    },
    {
      question: "Tại sao GPU utilization thường chỉ 30-50% trong thực tế?",
      options: [
        "GPU bị lỗi phần cứng",
        "Data loading, CPU preprocessing, memory copy, synchronization tạo idle time cho GPU",
        "Hệ điều hành giới hạn GPU usage",
      ],
      correct: 1,
      explanation: "GPU nhanh nhưng phải đợi: data loading từ disk, CPU preprocess, copy data CPU→GPU, gradient sync giữa GPU. Giải pháp: prefetch data, overlap compute-communication, CUDA graphs. Nâng utilization từ 30% lên 85% = tăng tốc gần 3x!",
    },
  ], []);

  return (
    <>
      {/* STEP 1: PREDICTION GATE */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn thuê 8 GPU A100 (80GB mỗi GPU = 640GB tổng) để train model 70B params. Nhưng nvidia-smi cho thấy mỗi GPU chỉ sử dụng 35% compute. Vấn đề ở đâu?"
          options={[
            "Cần mua GPU mạnh hơn (H100)",
            "GPU đang đợi data loading và gradient sync — cần tối ưu pipeline song song",
            "Model 70B quá nhỏ cho 8 GPU",
          ]}
          correct={1}
          explanation="GPU utilization thấp = GPU ngồi chờ! Chờ data từ disk, chờ CPU preprocess, chờ gradient sync. Tối ưu GPU là nghệ thuật giữ 'lớp học 10.000 học sinh' luôn bận rộn — không ai ngồi chơi!"
        >

      {/* STEP 2: INTERACTIVE VIZ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Chọn <strong className="text-foreground">chiến lược parallelism</strong>{" "}
          để xem GPU utilization, memory usage và communication overhead thay đổi.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {STRATEGIES.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStrategy(i)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    activeStrategy === i
                      ? "bg-accent text-white"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>

            <svg viewBox="0 0 600 200" className="w-full max-w-2xl mx-auto">
              {/* GPU Utilization */}
              <text x={15} y={38} fill="#94a3b8" fontSize={9}>GPU Util</text>
              <rect x={90} y={24} width={420} height={20} rx={4} fill="#1e293b" />
              <rect x={90} y={24} width={420 * strategy.gpuUtil / 100} height={20} rx={4}
                fill={strategy.gpuUtil > 70 ? "#22c55e" : strategy.gpuUtil > 50 ? "#f59e0b" : "#ef4444"} />
              <text x={95 + 420 * strategy.gpuUtil / 100} y={38} fill="white" fontSize={10} fontWeight="bold">
                {strategy.gpuUtil}%
              </text>

              {/* Memory Utilization */}
              <text x={15} y={72} fill="#94a3b8" fontSize={9}>Memory</text>
              <rect x={90} y={58} width={420} height={20} rx={4} fill="#1e293b" />
              <rect x={90} y={58} width={420 * strategy.memUtil / 100} height={20} rx={4} fill="#3b82f6" />
              <text x={95 + 420 * strategy.memUtil / 100} y={72} fill="white" fontSize={10} fontWeight="bold">
                {strategy.memUtil}%
              </text>

              {/* Communication Overhead */}
              <text x={15} y={106} fill="#94a3b8" fontSize={9}>Comm OH</text>
              <rect x={90} y={92} width={420} height={20} rx={4} fill="#1e293b" />
              <rect x={90} y={92} width={420 * strategy.commOverhead / 100} height={20} rx={4} fill="#ef4444" opacity={0.7} />
              <text x={95 + 420 * strategy.commOverhead / 100} y={106} fill="white" fontSize={10} fontWeight="bold">
                {strategy.commOverhead}%
              </text>

              {/* Strategy info */}
              <text x={300} y={145} textAnchor="middle" fill="#e2e8f0" fontSize={12} fontWeight="bold">
                {strategy.name}
              </text>
              <text x={300} y={165} textAnchor="middle" fill="#94a3b8" fontSize={10}>
                {strategy.desc} | Max model: {strategy.maxModelSize}
              </text>

              {/* GPU grid visualization */}
              {Array.from({ length: 8 }, (_, i) => {
                const x = 120 + (i % 4) * 95;
                const y = 175 + Math.floor(i / 4) * 12;
                const active = strategy.gpuUtil > 25;
                return (
                  <rect key={i} x={x} y={y} width={80} height={8} rx={2}
                    fill={active ? "#22c55e" : "#475569"}
                    opacity={active ? 0.3 + (strategy.gpuUtil / 100) * 0.7 : 0.2}
                  />
                );
              })}
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* STEP 3: AHA */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            CPU giống <strong>giáo sư giỏi</strong>{" "}(giải 1 bài phức tạp).
            GPU giống <strong>lớp học 10.000 học sinh</strong>{" "}(mỗi em 1 phép tính đơn giản, nhưng cùng lúc).
            AI cần hàng tỷ phép nhân ma trận — chính là bài toán mà &quot;lớp học&quot; giải cực nhanh!
            Tối ưu GPU = sắp xếp bài tập sao cho <strong>không em nào ngồi chờ</strong>.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* STEP 4: CHALLENGE */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Model 70B params ở FP16 cần 140GB VRAM (70B x 2 bytes). Training cần thêm 3x cho gradients + optimizer states = 560GB. Bạn có 8 GPU A100 80GB (640GB tổng). Chiến lược nào phù hợp?"
          options={[
            "Data Parallel — copy model ra 8 GPU",
            "FSDP — shard model + optimizer states qua 8 GPU",
            "Chỉ dùng 1 GPU với gradient checkpointing",
          ]}
          correct={1}
          explanation="Data Parallel copy nguyên model ra mỗi GPU — 140GB/GPU x 8 = 1120GB (không đủ!). FSDP (Fully Sharded Data Parallel) chia nhỏ model + gradients + optimizer qua 8 GPU: 560/8 = 70GB/GPU — vừa đủ 80GB/GPU. 1 GPU 80GB hoàn toàn không thể chứa 560GB!"
        />
      </LessonSection>

      {/* STEP 5: EXPLANATION */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Tối ưu GPU</strong>{" "}
            là tập hợp kỹ thuật tận dụng tối đa khả năng tính toán song song của GPU, giảm thời gian training và chi phí inference.
          </p>

          <p><strong>Memory breakdown khi training:</strong></p>
          <LaTeX block>{"\\text{Total Memory} = \\underbrace{W}_{\\text{weights}} + \\underbrace{G}_{\\text{gradients}} + \\underbrace{O}_{\\text{optimizer}} + \\underbrace{A}_{\\text{activations}}"}</LaTeX>
          <p>
            Với Adam optimizer, FP32: <LaTeX>{"O = 2W"}</LaTeX> (momentum + variance). Tổng: <LaTeX>{"4W + A"}</LaTeX>.
          </p>

          <p><strong>Mixed Precision Training:</strong></p>
          <LaTeX block>{"\\text{FP16: } W_{fp16} = \\frac{W_{fp32}}{2}, \\quad \\text{Tensor Core throughput} = 2 \\times \\text{FP32}"}</LaTeX>

          <Callout variant="tip" title="BF16 vs FP16">
            BF16 (Brain Float 16) có range giống FP32 (8 bit exponent) nhưng precision thấp hơn FP16. Ưu điểm: không cần loss scaling, ít NaN hơn. H100/A100 đều hỗ trợ BF16. Nên dùng BF16 cho training, FP16 cho inference.
          </Callout>

          <p><strong>5 chiến lược parallelism:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Data Parallel (DP):</strong>{" "}Copy model ra N GPU, mỗi GPU xử lý batch khác nhau, AllReduce gradients</li>
            <li><strong>Tensor Parallel (TP):</strong>{" "}Chia mỗi layer qua N GPU — cần giao tiếp mỗi layer (NVLink)</li>
            <li><strong>Pipeline Parallel (PP):</strong>{" "}Chia layers thành stages, micro-batching giảm bubble</li>
            <li><strong>FSDP/ZeRO:</strong>{" "}Shard weights + gradients + optimizer qua N GPU, gather khi cần</li>
            <li><strong>Sequence Parallel:</strong>{" "}Chia sequence dimension — cho context dài (1M+ tokens)</li>
          </ul>

          <p><strong>Flash Attention:</strong></p>
          <LaTeX block>{"\\text{Standard: } O(N^2) \\text{ memory} \\quad vs \\quad \\text{Flash: } O(N) \\text{ memory (tiling + recomputation)}"}</LaTeX>

          <CodeBlock language="python" title="Training tối ưu với PyTorch FSDP + BF16">
{`import torch
from torch.distributed.fsdp import FullyShardedDataParallel as FSDP
from torch.distributed.fsdp import MixedPrecision

# Mixed precision policy: BF16 compute, FP32 reduce
mp_policy = MixedPrecision(
    param_dtype=torch.bfloat16,      # Weights BF16
    reduce_dtype=torch.float32,       # Gradient reduce FP32
    buffer_dtype=torch.bfloat16,
)

# Wrap model với FSDP — auto shard qua N GPU
model = FSDP(
    model,
    mixed_precision=mp_policy,
    use_orig_params=True,
    limit_all_gathers=True,  # Giảm peak memory
)

# Gradient checkpointing — đánh đổi compute lấy memory
from torch.utils.checkpoint import checkpoint
# Tiết kiệm 60% activation memory, tốn thêm 33% compute

# Training loop với torch.compile
model = torch.compile(model)  # CUDA graphs + kernel fusion
optimizer = torch.optim.AdamW(model.parameters(), lr=3e-4)

for batch in dataloader:
    loss = model(batch)
    loss.backward()
    optimizer.step()
    optimizer.zero_grad()`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      {/* STEP 6: SUMMARY */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "GPU là 'lớp 10.000 học sinh' — mạnh ở tính toán song song, yếu ở tác vụ tuần tự.",
          "Training memory = Weights + Gradients + Optimizer + Activations. Adam FP32: tổng ~4x model size.",
          "Mixed Precision (BF16): tăng 2x throughput Tensor Cores, giảm 50% memory bandwidth.",
          "FSDP shard mọi thứ qua N GPU — train model 405B trên cluster 8 GPU A100.",
          "Flash Attention giảm memory từ O(N^2) xuống O(N) — cho phép context 1M+ tokens.",
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
