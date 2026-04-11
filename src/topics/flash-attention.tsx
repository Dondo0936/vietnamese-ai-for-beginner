"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
  slug: "flash-attention",
  title: "Flash Attention",
  titleVi: "Flash Attention",
  description: "Thuật toán tối ưu tính attention nhanh hơn và tiết kiệm bộ nhớ GPU bằng kỹ thuật tiling",
  category: "dl-architectures",
  tags: ["attention", "memory-efficient", "tiling"],
  difficulty: "advanced",
  relatedSlugs: ["self-attention", "multi-head-attention", "gpu-optimization"],
  vizType: "interactive",
};

const quizQuestions: QuizQuestion[] = [
  {
    question: "Standard attention tốn O(N²) bộ nhớ. Flash Attention giảm xuống bao nhiêu?",
    options: [
      "O(N²) — không thay đổi bộ nhớ, chỉ nhanh hơn",
      "O(N) — không cần lưu ma trận attention N×N đầy đủ, chỉ lưu từng block nhỏ",
      "O(1) — không dùng bộ nhớ",
    ],
    correct: 1,
    explanation: "Flash Attention tính attention từng block nhỏ trong SRAM (nhanh), không cần ghi ma trận N×N đầy đủ ra HBM (chậm). Bộ nhớ GPU giảm từ O(N²) xuống O(N). Với N=128K: tiết kiệm ~16 tỷ floats!",
  },
  {
    question: "GPU có 2 loại bộ nhớ: HBM (lớn, chậm) và SRAM (nhỏ, nhanh). Standard attention tắc nghẽn ở đâu?",
    options: [
      "Tắc ở tính toán (compute-bound) — GPU không đủ nhanh",
      "Tắc ở bộ nhớ (memory-bound) — phải đọc/ghi ma trận N×N giữa HBM và SRAM nhiều lần",
      "Tắc ở network — truyền dữ liệu giữa GPU",
    ],
    correct: 1,
    explanation: "GPU A100: 312 TFLOPS compute nhưng chỉ 2TB/s HBM bandwidth. Attention matrix N×N phải đọc từ HBM → SRAM, tính softmax, ghi lại HBM → nhiều trips. Flash Attention giữ data trong SRAM, giảm HBM trips → nhanh 2-4×.",
  },
  {
    question: "Flash Attention dùng \"online softmax\". Tại sao cần kỹ thuật này?",
    options: [
      "Để softmax chính xác hơn",
      "Vì softmax cần max(row) trước khi tính — nhưng ta chỉ có 1 block, chưa thấy cả hàng. Online softmax tích lũy max/sum dần → kết quả chính xác",
      "Để giảm số phép tính",
    ],
    correct: 1,
    explanation: "softmax(x) = exp(x - max) / sum(exp(x - max)). Cần max của cả hàng trước! Nhưng Flash Attention xử lý từng block → chưa thấy cả hàng. Online softmax: cập nhật running max + running sum khi xử lý mỗi block mới → kết quả CHÍNH XÁC (không xấp xỉ!).",
  },
];

export default function FlashAttentionTopic() {
  const [mode, setMode] = useState<"standard" | "flash">("standard");
  const tileSize = 42;
  const matSize = 4;
  const TOTAL_STEPS = 8;

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Attention matrix cho 128K tokens cần 128K × 128K × 4 bytes = ~64GB bộ nhớ. GPU A100 chỉ có 80GB. Gần hết! Làm sao tính attention mà không cần lưu toàn bộ ma trận N×N?"
          options={[
            "Dùng GPU có nhiều bộ nhớ hơn",
            "Chia ma trận thành blocks nhỏ, tính từng block trong bộ nhớ nhanh (SRAM), không cần lưu toàn bộ",
            "Xấp xỉ attention bằng ma trận thưa",
          ]}
          correct={1}
          explanation="Flash Attention! Chia Q, K, V thành blocks nhỏ vừa SRAM (20MB, nhanh gấp 10-100× HBM). Tính attention từng block tại chỗ, dùng online softmax để tích lũy kết quả. Không cần lưu ma trận N×N → O(N) bộ nhớ thay vì O(N²). Và nhanh hơn 2-4× vì giảm IO!"
        />
      </LessonSection>

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="text-sm text-foreground leading-relaxed mb-3">
          Hãy tưởng tượng bạn cần so sánh 1000 hồ sơ Shopee với nhau. Cách cũ: trải hết 1000 hồ sơ ra sàn nhà khổng lồ, so từng cặp. Cách Flash: lấy ra 50 hồ sơ, so sánh trên bàn nhỏ, ghi kết quả, cất lại, lấy 50 hồ sơ tiếp. Bàn nhỏ hơn nhiều mà kết quả chính xác!
        </p>

        <VisualizationSection>
          <p className="text-sm text-muted mb-3">
            Chuyển đổi giữa Standard và Flash Attention để thấy sự khác biệt về bộ nhớ và tốc độ.
          </p>

          <div className="flex justify-center gap-2 mb-4">
            <button type="button" onClick={() => setMode("standard")}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-all ${
                mode === "standard" ? "border-red-500 bg-red-500/15 text-red-500" : "border-border bg-card text-foreground hover:bg-surface"
              }`}>
              Standard Attention
            </button>
            <button type="button" onClick={() => setMode("flash")}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-all ${
                mode === "flash" ? "border-green-500 bg-green-500/15 text-green-500" : "border-border bg-card text-foreground hover:bg-surface"
              }`}>
              Flash Attention
            </button>
          </div>

          <svg viewBox="0 0 520 300" className="w-full rounded-lg border border-border bg-background">
            <text x={260} y={20} textAnchor="middle" fontSize={12} fill="currentColor"
              className="text-foreground" fontWeight="bold">
              {mode === "standard" ? "Standard: Toàn bộ N×N trong HBM (chậm)" : "Flash: Từng block trong SRAM (nhanh)"}
            </text>

            {/* Attention matrix */}
            <text x={20} y={45} fontSize={10} fill="currentColor" className="text-muted">
              Ma trận Attention (Q &times; K&#x1D40;)
            </text>
            {Array.from({ length: matSize }).map((_, row) =>
              Array.from({ length: matSize }).map((_, col) => {
                const x = 25 + col * (tileSize + 2);
                const y = 52 + row * (tileSize + 2);
                const tileRow = Math.floor(row / 2);
                const tileCol = Math.floor(col / 2);
                const isCurrentTile = tileRow === 0 && tileCol === 0;

                return (
                  <motion.rect key={`${row}-${col}`}
                    x={x} y={y} width={tileSize} height={tileSize} rx={4}
                    fill={mode === "standard" ? "#ef4444" : isCurrentTile ? "#22c55e" : "#666"}
                    opacity={mode === "standard" ? 0.5 : isCurrentTile ? 0.7 : 0.08}
                    stroke={mode === "flash" && isCurrentTile ? "#22c55e" : "transparent"}
                    strokeWidth={mode === "flash" && isCurrentTile ? 2.5 : 0}
                    animate={{ opacity: mode === "standard" ? 0.5 : isCurrentTile ? 0.7 : 0.08 }}
                    transition={{ duration: 0.3 }}
                  />
                );
              })
            )}

            {mode === "flash" && (
              <text x={70} y={250} fontSize={9} fill="#22c55e" textAnchor="middle" fontWeight={600}>
                Chỉ 1 block trong SRAM
              </text>
            )}
            {mode === "standard" && (
              <text x={110} y={250} fontSize={9} fill="#ef4444" textAnchor="middle">
                Tất cả N×N trong HBM
              </text>
            )}

            {/* GPU Memory indicator */}
            <rect x={420} y={40} width={85} height={210} fill="currentColor" className="text-card"
              opacity={0.5} rx={6} stroke="#666" strokeWidth={1} />
            <text x={462} y={56} textAnchor="middle" fontSize={9} fill="currentColor" className="text-muted">
              GPU Memory
            </text>
            <motion.rect x={428} y={65} width={70}
              height={mode === "standard" ? 175 : 55}
              fill={mode === "standard" ? "#ef4444" : "#22c55e"}
              rx={4} opacity={0.6}
              animate={{ height: mode === "standard" ? 175 : 55 }}
              transition={{ duration: 0.5 }}
            />
            <text x={462} y={mode === "standard" ? 160 : 98}
              textAnchor="middle" fontSize={12} fill="white" fontWeight="bold">
              {mode === "standard" ? "O(N\u00B2)" : "O(N)"}
            </text>

            {/* Speed comparison */}
            <g transform="translate(210, 55)">
              <text x={0} y={0} fontSize={10} fill="currentColor" className="text-muted">Tốc độ</text>
              <motion.rect x={0} y={8} width={mode === "standard" ? 100 : 190} height={22}
                fill={mode === "standard" ? "#ef4444" : "#22c55e"} rx={4} opacity={0.6}
                animate={{ width: mode === "standard" ? 100 : 190 }}
                transition={{ duration: 0.4 }} />
              <text x={mode === "standard" ? 50 : 95} y={24}
                textAnchor="middle" fontSize={10} fill="white" fontWeight="bold">
                {mode === "standard" ? "1\u00D7" : "2-4\u00D7 nhanh hơn"}
              </text>
            </g>

            {/* IO comparison */}
            <g transform="translate(210, 105)">
              <text x={0} y={0} fontSize={10} fill="currentColor" className="text-muted">IO Access</text>
              <rect x={0} y={8} width={195} height={38} rx={6}
                fill="currentColor" className="text-card" opacity={0.5} stroke="#666" strokeWidth={0.5} />
              {mode === "standard" ? (
                <>
                  <text x={97} y={25} textAnchor="middle" fontSize={9} fill="#ef4444">
                    HBM → SRAM → HBM (nhiều lần!)
                  </text>
                  <text x={97} y={40} textAnchor="middle" fontSize={8} fill="#ef4444" opacity={0.7}>
                    Tắc nghẽn IO = memory-bound
                  </text>
                </>
              ) : (
                <>
                  <text x={97} y={25} textAnchor="middle" fontSize={9} fill="#22c55e">
                    Tính tại chỗ trong SRAM
                  </text>
                  <text x={97} y={40} textAnchor="middle" fontSize={8} fill="#22c55e" opacity={0.7}>
                    Giảm IO trips → compute-bound
                  </text>
                </>
              )}
            </g>

            {/* Key insight */}
            <g transform="translate(210, 170)">
              <text x={0} y={0} fontSize={10} fill="currentColor" className="text-muted">Online Softmax</text>
              <rect x={0} y={8} width={195} height={38} rx={6}
                fill="currentColor" className="text-card" opacity={0.5} stroke="#666" strokeWidth={0.5} />
              <text x={97} y={25} textAnchor="middle" fontSize={9} fill="#8b5cf6">
                Tích lũy max + sum dần qua mỗi block
              </text>
              <text x={97} y={40} textAnchor="middle" fontSize={8} fill="#8b5cf6" opacity={0.7}>
                Kết quả CHÍNH XÁC (không xấp xỉ!)
              </text>
            </g>
          </svg>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>Flash Attention</strong>{" "}
            không thay đổi toán học — kết quả CHÍNH XÁC giống standard attention. Nó chỉ thay đổi{" "}
            <strong>cách tính</strong>: chia thành blocks nhỏ, tính trong SRAM (nhanh), dùng online softmax để tích lũy. Giảm IO = giảm thời gian thật sự!
          </p>
          <p className="text-sm text-muted mt-1">
            Insight: GPU hiện đại tắc ở bộ nhớ (memory-bound), không phải tính toán (compute-bound). Giảm đọc/ghi HBM quan trọng hơn giảm số phép nhân!
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Bộ nhớ GPU">
        <VisualizationSection>
          <div className="space-y-3">
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
              <h4 className="text-sm font-semibold text-red-500 mb-1">HBM (High Bandwidth Memory)</h4>
              <p className="text-xs text-muted">80GB trên A100. Lớn nhưng &quot;xa&quot; — ~2 TB/s bandwidth. Phần lớn thời gian GPU đợi data từ HBM.</p>
            </div>
            <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4">
              <h4 className="text-sm font-semibold text-green-500 mb-1">SRAM (Static RAM / Shared Memory)</h4>
              <p className="text-xs text-muted">~20MB trên A100. Nhỏ nhưng &quot;gần&quot; — ~19 TB/s bandwidth. Nhanh hơn HBM ~10×! Flash Attention giữ data ở đây.</p>
            </div>
          </div>

          <Callout variant="insight" title="Tại sao nhanh hơn mà chính xác?">
            <p>
              Flash Attention không bỏ phần tử nào, không xấp xỉ. Nó chỉ thay đổi thứ tự tính toán: thay vì tính toàn bộ hàng softmax → tính từng block + cập nhật online softmax. Toán học tương đương, IO ít hơn → nhanh hơn.
            </p>
          </Callout>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Chuỗi 128K tokens. Standard attention cần 128K × 128K × 4 bytes = ~64GB cho attention matrix. Flash Attention cần bao nhiêu?"
          options={[
            "~64GB (giống standard)",
            "~0.5MB (chỉ cần lưu 1 block SRAM-sized + running stats cho online softmax)",
            "~32GB (giảm một nửa)",
          ]}
          correct={1}
          explanation="Flash Attention không lưu ma trận N×N! Chỉ cần: 1 block Q, K, V (~vài KB mỗi cái) + running max, sum cho online softmax (~vài KB). Tổng ~0.5MB thay vì 64GB. Giảm ~130.000×! Đây là lý do LLM có context window 128K+ tokens.",
        />
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích chi tiết">
        <ExplanationSection>
          <p>
            <strong>Flash Attention</strong>{" "}
            (Dao et al., 2022) là IO-aware exact attention algorithm. Không thay đổi toán học, chỉ tối ưu cách tính trên hardware.
          </p>

          <p className="mt-3 font-semibold text-foreground">Standard Attention (IO bottleneck):</p>
          <LaTeX block>{String.raw`S = QK^T \in \mathbb{R}^{N \times N} \xrightarrow{\text{write HBM}} P = \text{softmax}(S) \xrightarrow{\text{write HBM}} O = PV`}</LaTeX>
          <p className="text-sm text-muted">3 lần đọc/ghi HBM cho ma trận N&times;N. Memory = O(N&sup2;).</p>

          <p className="mt-3 font-semibold text-foreground">Flash Attention (tiling + online softmax):</p>
          <LaTeX block>{String.raw`\text{For each block } (Q_b, K_b, V_b): \quad O_b = \text{softmax}(Q_b K_b^T / \sqrt{d}) \cdot V_b`}</LaTeX>
          <p className="text-sm text-muted">Mỗi block tính hoàn toàn trong SRAM. Online softmax cập nhật running max/sum. Memory = O(N).</p>

          <Callout variant="info" title="Flash Attention 2 & 3">
            <p>
              <strong>FA2</strong>{" "}
              (2023): song song hóa tốt hơn (over sequence length), giảm non-matmul FLOPs → 2× nhanh hơn FA1.{" "}
              <strong>FA3</strong>{" "}
              (2024): tối ưu cho H100, FP8 support, asynchronous prefetching → gần peak GPU throughput. Mọi LLM hiện đại dùng Flash Attention.
            </p>
          </Callout>

          <CodeBlock language="python" title="flash_attention_usage.py">
{`# Cách dùng Flash Attention trong PyTorch
import torch
import torch.nn.functional as F

# PyTorch 2.0+ có built-in Flash Attention!
# Tự động chọn Flash Attention khi có thể

q = torch.randn(1, 8, 4096, 64, device='cuda')  # (B, heads, N, d_k)
k = torch.randn(1, 8, 4096, 64, device='cuda')
v = torch.randn(1, 8, 4096, 64, device='cuda')

# Tự động dùng Flash Attention nếu available
output = F.scaled_dot_product_attention(q, k, v)
# Memory: O(N) thay vì O(N²)
# Speed: 2-4× nhanh hơn naive implementation

# Hoặc dùng thư viện flash-attn trực tiếp
# pip install flash-attn
from flash_attn import flash_attn_func
output = flash_attn_func(q, k, v, causal=True)

# So sánh memory:
# N=4096: Standard ~64MB, Flash ~0.5MB (giảm 128×)
# N=128K: Standard ~64GB, Flash ~0.5MB (giảm 130,000×)`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Flash Attention"
          points={[
            "Flash Attention = exact attention (không xấp xỉ) nhưng IO-efficient: chia thành blocks, tính trong SRAM nhanh.",
            "Giảm bộ nhớ O(N²) → O(N): không lưu ma trận attention N×N đầy đủ.",
            "Nhanh hơn 2-4× nhờ giảm HBM IO trips. GPU tắc ở memory, không phải compute!",
            "Online softmax: tích lũy running max/sum qua mỗi block → kết quả chính xác.",
            "Mọi LLM hiện đại dùng Flash Attention: GPT-4, Claude, LLaMA, Gemini. Cho phép context 128K+ tokens.",
          ]}
        />
      </LessonSection>

      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
