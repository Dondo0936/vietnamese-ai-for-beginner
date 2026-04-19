"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
  CollapsibleDetail,
  TopicLink,
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
  description:
    "Thuật toán tối ưu tính attention nhanh hơn và tiết kiệm bộ nhớ GPU bằng kỹ thuật tiling",
  category: "dl-architectures",
  tags: ["attention", "memory-efficient", "tiling"],
  difficulty: "advanced",
  relatedSlugs: ["self-attention", "multi-head-attention", "gpu-optimization"],
  vizType: "interactive",
};

/* ──────────────────────────────────────────────────────────────
 * DỮ LIỆU MÔ HÌNH GPU
 * A100: HBM 80GB, bandwidth ~2 TB/s; SRAM ~20MB, bandwidth ~19 TB/s.
 * H100: HBM 80GB (HBM3), bandwidth ~3.35 TB/s; SRAM ~50MB, ~33 TB/s.
 * ────────────────────────────────────────────────────────────── */

type MemoryTier = {
  id: "register" | "sram" | "l2" | "hbm" | "dram";
  label: string;
  size: string;
  bandwidth: string;
  latency: string;
  color: string;
  description: string;
  note: string;
};

const MEMORY_HIERARCHY: MemoryTier[] = [
  {
    id: "register",
    label: "Registers",
    size: "256 KB / SM",
    bandwidth: "~80 TB/s",
    latency: "1 chu kỳ",
    color: "#facc15",
    description: "Nhanh nhất, nằm ngay trong lõi CUDA. Giữ các biến tạm trong kernel.",
    note: "Không thể cấp phát lớn — compiler quyết định phân bổ.",
  },
  {
    id: "sram",
    label: "SRAM (Shared Memory)",
    size: "~20 MB / GPU",
    bandwidth: "~19 TB/s",
    latency: "~20 chu kỳ",
    color: "#22c55e",
    description: "Bộ nhớ chia sẻ trong mỗi SM. Nhanh hơn HBM ~10 lần. Flash Attention giữ block Q, K, V ở đây.",
    note: "Chỉ 192 KB / SM — vì vậy block size phải nhỏ.",
  },
  {
    id: "l2",
    label: "L2 Cache",
    size: "40 MB",
    bandwidth: "~5 TB/s",
    latency: "~200 chu kỳ",
    color: "#06b6d4",
    description: "Cache chung cho toàn GPU. Tự động quản lý, không lập trình trực tiếp.",
    note: "Hữu ích cho các tensor dùng lặp.",
  },
  {
    id: "hbm",
    label: "HBM (Device Memory)",
    size: "80 GB",
    bandwidth: "~2 TB/s",
    latency: "~400 chu kỳ",
    color: "#ef4444",
    description: "Bộ nhớ chính GPU. Lớn, nhưng 'xa' — phần lớn thời gian GPU chờ HBM.",
    note: "Mọi tensor nằm đây giữa các kernel call.",
  },
  {
    id: "dram",
    label: "DRAM (Host)",
    size: "≥ 128 GB",
    bandwidth: "~50 GB/s (PCIe)",
    latency: "hàng µs",
    color: "#64748b",
    description: "RAM hệ thống. Đi qua PCIe/NVLink — rất chậm so với GPU memory.",
    note: "Cần tránh data transfer host↔device trong hot path.",
  },
];

// Các block trong ma trận attention N×N (ở đây N được chia thành grid Br × Bc).
type BlockKind = "untouched" | "loaded" | "computing" | "done";

interface BlockState {
  row: number;
  col: number;
  kind: BlockKind;
}

// Speedup ở các độ dài chuỗi khác nhau, từ paper và benchmark công khai.
// Đơn vị: thời gian (ms) cho 1 forward attention trên A100, batch 1, 8 heads, head_dim 64.
// Dữ liệu được làm tròn để dễ kể chuyện; nguồn: Dao 2022 + bloggers community.
type BenchmarkPoint = {
  seqLen: string;
  seqLenNum: number;
  standardMs: number;
  flashMs: number;
  standardMemGB: number;
  flashMemGB: number;
  note: string;
};

const BENCHMARK: BenchmarkPoint[] = [
  {
    seqLen: "2K",
    seqLenNum: 2048,
    standardMs: 4.6,
    flashMs: 2.1,
    standardMemGB: 0.016,
    flashMemGB: 0.001,
    note: "Chuỗi ngắn — cả hai chạy tốt, speedup ~2.2×.",
  },
  {
    seqLen: "8K",
    seqLenNum: 8192,
    standardMs: 74,
    flashMs: 24,
    standardMemGB: 0.25,
    flashMemGB: 0.004,
    note: "Sequence 8K — Flash nhanh ~3×; bộ nhớ giảm 60×.",
  },
  {
    seqLen: "32K",
    seqLenNum: 32768,
    standardMs: 1180,
    flashMs: 305,
    standardMemGB: 4,
    flashMemGB: 0.016,
    note: "32K — Flash nhanh ~3.9×; bộ nhớ giảm 250×.",
  },
  {
    seqLen: "128K",
    seqLenNum: 131072,
    standardMs: 19500,
    flashMs: 4600,
    standardMemGB: 64,
    flashMemGB: 0.064,
    note: "128K — Standard gần hết VRAM A100; Flash tiết kiệm ~1000×.",
  },
];

// Pseudocode của Flash Attention — chia tile và chạy online softmax.
// Br = block row (Q), Bc = block col (K,V), d = head dim.
// Trạng thái: O (output), l (sum exp), m (running max).

// Các ứng dụng thực tế.
const APPLICATIONS: Array<{ name: string; detail: string }> = [
  {
    name: "LLM context 128K+ tokens",
    detail:
      "GPT-4 Turbo, Claude 200K, Gemini 1.5 (1M tokens) đều dùng Flash Attention hoặc biến thể. Không có Flash, KV cache + attention matrix sẽ vượt VRAM.",
  },
  {
    name: "Huấn luyện Llama / Mistral / Qwen",
    detail:
      "Flash Attention 2 tăng throughput training ~2×, tiết kiệm ~40% memory — nghĩa là có thể fit batch lớn hơn hoặc sequence dài hơn trên cùng một cluster.",
  },
  {
    name: "Serving vLLM, TGI, SGLang",
    detail:
      "Các engine serving đều dùng Flash Attention cho prefill (encode prompt dài) kết hợp paged attention cho decode. Giảm tail latency đáng kể.",
  },
  {
    name: "Vision Transformer trên ảnh lớn",
    detail:
      "Ảnh 1024×1024 patch 16×16 → 4K tokens. Flash giúp train ViT-Huge trên ảnh HD không OOM.",
  },
  {
    name: "Protein folding / AlphaFold-like",
    detail:
      "Sequence amino acid có thể dài hàng ngàn. Memory-efficient attention là bắt buộc.",
  },
  {
    name: "Whisper / ASR long-form",
    detail:
      "Xử lý audio dài 30 phút = chuỗi token dài. Flash Attention giữ memory dưới ngưỡng GPU tiêu dùng.",
  },
];

// Pitfalls thường gặp.
const PITFALLS: Array<{ name: string; detail: string }> = [
  {
    name: "Kỳ vọng Flash thần kỳ với chuỗi ngắn",
    detail:
      "Dưới 1K tokens, Flash Attention có thể không nhanh hơn — compute đủ rẻ, overhead tile management chiếm tỷ trọng lớn. Speedup thực sự lộ ra khi N ≥ 4K.",
  },
  {
    name: "Dùng sai dtype",
    detail:
      "Flash Attention chính thức yêu cầu fp16 hoặc bf16. Nếu vô tình chạy fp32, PyTorch sẽ fallback về kernel thường — tưởng đã dùng Flash nhưng không. Luôn kiểm tra với profiler.",
  },
  {
    name: "Head dim > 128 không hỗ trợ",
    detail:
      "FA1/FA2 yêu cầu head_dim ≤ 128 (phải vừa SRAM). FA3 mở rộng lên 256 trên H100. Nếu mô hình có head lớn, phải fallback hoặc chia.",
  },
  {
    name: "Mask phức tạp",
    detail:
      "Custom attention mask (không phải causal/padding) khó tận dụng Flash. Dùng FlexAttention (PyTorch 2.5+) — compile mask thành kernel Flash tối ưu.",
  },
];

// Quiz 8 câu.
const quizQuestions: QuizQuestion[] = [
  {
    question: "Standard attention tốn O(N²) bộ nhớ. Flash Attention giảm xuống bao nhiêu?",
    options: [
      "O(N²) — không thay đổi bộ nhớ, chỉ nhanh hơn",
      "O(N) — không cần lưu ma trận attention N×N đầy đủ, chỉ lưu từng block nhỏ",
      "O(1) — không dùng bộ nhớ",
      "O(log N)",
    ],
    correct: 1,
    explanation:
      "Flash Attention tính attention từng block nhỏ trong SRAM (nhanh), không cần ghi ma trận N×N đầy đủ ra HBM (chậm). Bộ nhớ GPU giảm từ O(N²) xuống O(N). Với N=128K: tiết kiệm ~16 tỷ floats! Lưu ý: đây là memory cho attention matrix — KV cache vẫn O(N) và không được Flash giảm thêm.",
  },
  {
    question:
      "GPU có 2 loại bộ nhớ: HBM (lớn, chậm) và SRAM (nhỏ, nhanh). Standard attention tắc nghẽn ở đâu?",
    options: [
      "Tắc ở tính toán (compute-bound) — GPU không đủ nhanh",
      "Tắc ở bộ nhớ (memory-bound) — phải đọc/ghi ma trận N×N giữa HBM và SRAM nhiều lần",
      "Tắc ở network — truyền dữ liệu giữa GPU",
      "Tắc ở CPU",
    ],
    correct: 1,
    explanation:
      "GPU A100: 312 TFLOPS compute nhưng chỉ 2 TB/s HBM bandwidth. Attention matrix N×N phải đọc từ HBM → SRAM, tính softmax, ghi lại HBM → nhiều trips. Flash Attention giữ data trong SRAM, giảm HBM trips → nhanh 2–4×. Đây là insight cốt lõi của paper Dao 2022.",
  },
  {
    question: "Flash Attention dùng 'online softmax'. Tại sao cần kỹ thuật này?",
    options: [
      "Để softmax chính xác hơn",
      "Vì softmax cần max(row) trước khi tính — nhưng ta chỉ có 1 block, chưa thấy cả hàng. Online softmax tích lũy max/sum dần → kết quả chính xác",
      "Để giảm số phép tính",
      "Vì softmax dễ NaN",
    ],
    correct: 1,
    explanation:
      "softmax(x) = exp(x - max) / sum(exp(x - max)). Cần max của cả hàng trước! Nhưng Flash xử lý từng block → chưa thấy cả hàng. Online softmax: cập nhật running max + running sum khi xử lý mỗi block mới, rescale output đã tính → kết quả CHÍNH XÁC (không xấp xỉ!). Ý tưởng có từ Milakov & Gimelshein 2018.",
  },
  {
    type: "fill-blank",
    question:
      "Flash Attention giảm {blank} (từ O(N²) xuống O(N)) bằng kỹ thuật {blank} — chia Q, K, V thành block nhỏ vừa SRAM, tính attention từng block tại chỗ.",
    blanks: [
      { answer: "bộ nhớ", accept: ["memory", "VRAM", "RAM"] },
      { answer: "tiling", accept: ["Tiling", "chia block", "block"] },
    ],
    explanation:
      "Flash Attention giảm bộ nhớ O(N²) → O(N) nhờ kỹ thuật tiling: không lưu ma trận attention N×N đầy đủ, chỉ tính từng tile/block trong SRAM nhanh. Online softmax đảm bảo kết quả chính xác khi ghép các block lại. Đây chính xác là 'exact attention' — không xấp xỉ.",
  },
  {
    question: "Flash Attention 2 (2023) cải thiện gì so với Flash Attention 1?",
    options: [
      "Dùng thuật toán xấp xỉ mới",
      "Đảo thứ tự loop, song song hóa theo chiều sequence, giảm non-matmul FLOPs → gần 2× nhanh hơn FA1",
      "Chỉ hỗ trợ fp32",
      "Chạy được trên CPU",
    ],
    correct: 1,
    explanation:
      "FA2 (Dao 2023): (1) đảo loop order để song song tốt hơn theo N chứ không chỉ theo head; (2) giảm các phép non-matmul (softmax, rescale) vốn đắt trên Tensor Core; (3) sharing warp work hợp lý hơn. Kết quả: 50–70% peak flops trên A100, gần 2× nhanh hơn FA1.",
  },
  {
    question: "Flash Attention 3 (2024) tận dụng đặc điểm nào của H100?",
    options: [
      "Tensor Memory Accelerator (TMA), WGMMA, FP8 support, asynchronous prefetching",
      "Chỉ thêm cache lớn hơn",
      "Dùng GPU nhiều hơn",
      "Không khác gì FA2",
    ],
    correct: 0,
    explanation:
      "FA3 (Shah & Dao 2024) khai thác hardware H100: TMA giúp load tile không đồng bộ, WGMMA matmul cỡ warp-group, và FP8 giảm một nửa bandwidth. Kết quả: ~75% peak FP16 FLOPs, hoặc 1.2 PFLOPS FP8 — gần giới hạn vật lý GPU.",
  },
  {
    question:
      "Bạn có sequence 64K, head_dim 64, 8 heads. Standard attention cần bao nhiêu memory chỉ cho ma trận P = softmax(QK^T)?",
    options: [
      "~32 MB",
      "~128 MB",
      "~16 GB (64K × 64K × 4 bytes × 8 heads — không fit A100 80GB nếu cộng activation khác)",
      "~1 TB",
    ],
    correct: 2,
    explanation:
      "64K × 64K × 4 bytes (fp32) = 16 GB cho 1 head. Với 8 heads và cần cả S và dS cho backward → gấp nhiều lần. Fp16 giảm một nửa nhưng vẫn hàng GB. Flash Attention bỏ hoàn toàn ma trận P — chỉ giữ running stats O(N). Đây là lý do context dài chỉ khả thi với Flash.",
  },
  {
    question: "FlexAttention (PyTorch 2.5+) giúp gì?",
    options: [
      "Chỉ là alias của Flash Attention",
      "Cho phép viết mask/score function bằng Python, rồi torch.compile sẽ lower thành kernel Flash tối ưu",
      "Chạy attention trên CPU",
      "Chỉ dành cho vision model",
    ],
    correct: 1,
    explanation:
      "FlexAttention (PyTorch 2.5) mở rộng Flash Attention cho mọi dạng mask/score custom (sliding window, ALiBi, relative pos bias, causal + padding kết hợp...). Bạn khai báo bằng Python, compile thành một Flash kernel duy nhất — giữ được tốc độ Flash mà không cần viết CUDA.",
  },
];

/* ──────────────────────────────────────────────────────────────
 * HELPERS
 * ────────────────────────────────────────────────────────────── */

function computeTilingSchedule(matSize: number, blockSize: number): BlockState[][] {
  const blocks = matSize / blockSize;
  const steps: BlockState[][] = [];
  // Duyệt block hàng trước rồi block cột (row-major) — giống FA2.
  for (let i = 0; i < blocks; i++) {
    for (let j = 0; j < blocks; j++) {
      const step: BlockState[] = [];
      for (let r = 0; r < blocks; r++) {
        for (let c = 0; c < blocks; c++) {
          let kind: BlockKind = "untouched";
          if (r < i || (r === i && c < j)) kind = "done";
          else if (r === i && c === j) kind = "computing";
          step.push({ row: r, col: c, kind });
        }
      }
      steps.push(step);
    }
  }
  return steps;
}

/* ──────────────────────────────────────────────────────────────
 * COMPONENT CHÍNH
 * ────────────────────────────────────────────────────────────── */

export default function FlashAttentionTopic() {
  const [mode, setMode] = useState<"standard" | "flash">("standard");
  const [step, setStep] = useState(0);
  const [seqChoice, setSeqChoice] = useState<"2K" | "8K" | "32K" | "128K">("8K");

  const matSize = 8; // 8×8 blocks
  const blockSize = 2; // block 2×2 ⇒ 16 cells
  const cellSize = 30;
  const svgSize = matSize * cellSize + 20;

  const tilingSchedule = useMemo(
    () => computeTilingSchedule(matSize, blockSize),
    [matSize, blockSize],
  );
  const currentStep = Math.min(step, tilingSchedule.length - 1);

  const benchmarkSelected = useMemo(
    () => BENCHMARK.find((b) => b.seqLen === seqChoice) ?? BENCHMARK[1],
    [seqChoice],
  );

  const TOTAL_STEPS = 8;

  return (
    <>
      {/* ─────────────── STEP 1: PREDICTION ─────────────── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Attention matrix cho 128K tokens cần 128K × 128K × 4 bytes ≈ 64GB bộ nhớ. GPU A100 chỉ có 80GB. Gần hết! Làm sao tính attention mà không cần lưu toàn bộ ma trận N×N?"
          options={[
            "Dùng GPU có nhiều bộ nhớ hơn",
            "Chia ma trận thành blocks nhỏ, tính từng block trong bộ nhớ nhanh (SRAM), không cần lưu toàn bộ",
            "Xấp xỉ attention bằng ma trận thưa",
          ]}
          correct={1}
          explanation="Flash Attention! Chia Q, K, V thành blocks nhỏ vừa SRAM (20MB, nhanh gấp 10–100× HBM). Tính attention từng block tại chỗ, dùng online softmax để tích lũy kết quả. Không cần lưu ma trận N×N → O(N) bộ nhớ thay vì O(N²). Và nhanh hơn 2–4× vì giảm IO! Quan trọng: kết quả CHÍNH XÁC, không xấp xỉ — thuật toán đồng nhất về toán học với standard attention, chỉ khác cách tính."
        />
      </LessonSection>

      {/* ─────────────── STEP 2: VISUALIZATION ─────────────── */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá — Bộ nhớ, tile, và speedup">
        <p className="text-sm text-foreground leading-relaxed mb-3">
          Hãy tưởng tượng bạn cần so sánh 1000 hồ sơ Shopee với nhau. Cách cũ (
          <TopicLink slug="self-attention">self-attention</TopicLink> gốc): trải hết 1000 hồ sơ
          ra sàn nhà khổng lồ, so từng cặp — mất đất và mất thời gian vì phải chạy ra chạy vô.
          Cách Flash: lấy ra 50 hồ sơ, so sánh trên bàn nhỏ (SRAM), ghi kết quả, cất lại, lấy 50
          hồ sơ tiếp. Bàn nhỏ hơn nhiều mà kết quả chính xác — vì bạn tích lũy tổng chứ không bỏ
          hồ sơ nào!
        </p>

        <VisualizationSection topicSlug={metadata.slug}>
          {/* Top: toggle standard vs flash */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setMode("standard");
                setStep(0);
              }}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                mode === "standard"
                  ? "border-red-500 bg-red-500/15 text-red-500"
                  : "border-border bg-card text-foreground hover:bg-surface"
              }`}
            >
              Standard Attention
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("flash");
                setStep(0);
              }}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                mode === "flash"
                  ? "border-green-500 bg-green-500/15 text-green-500"
                  : "border-border bg-card text-foreground hover:bg-surface"
              }`}
            >
              Flash Attention (tiled)
            </button>
            {mode === "flash" && (
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep(Math.max(0, step - 1))}
                  className="rounded-md border border-border px-2 py-1 text-xs hover:bg-surface"
                >
                  ← Lùi
                </button>
                <span className="text-xs text-muted">
                  Tile {currentStep + 1}/{tilingSchedule.length}
                </span>
                <button
                  type="button"
                  onClick={() => setStep(Math.min(tilingSchedule.length - 1, step + 1))}
                  className="rounded-md border border-border px-2 py-1 text-xs hover:bg-surface"
                >
                  Tiến →
                </button>
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="rounded-md border border-border px-2 py-1 text-xs hover:bg-surface"
                >
                  Reset
                </button>
              </div>
            )}
          </div>

          {/* Main panel */}
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            {/* Column 1: Ma trận attention + memory usage */}
            <div className="rounded-xl border border-border bg-background p-3">
              <div className="mb-2 text-xs font-semibold text-foreground">
                {mode === "standard"
                  ? "Ma trận attention N×N — tất cả nằm trong HBM"
                  : "Ma trận attention chia tile — mỗi lúc chỉ 1 tile trong SRAM"}
              </div>
              <svg viewBox={`0 0 ${svgSize + 40} ${svgSize + 40}`} className="w-full">
                {/* vẽ toàn bộ grid */}
                {Array.from({ length: matSize }).map((_, r) =>
                  Array.from({ length: matSize }).map((_, c) => {
                    const blockRow = Math.floor(r / blockSize);
                    const blockCol = Math.floor(c / blockSize);

                    let fill = "#1f2937";
                    let opacity = 0.2;
                    let stroke = "transparent";
                    let strokeWidth = 0;

                    if (mode === "standard") {
                      fill = "#ef4444";
                      opacity = 0.35;
                    } else {
                      const block = tilingSchedule[currentStep].find(
                        (b) => b.row === blockRow && b.col === blockCol,
                      );
                      if (block?.kind === "done") {
                        fill = "#22c55e";
                        opacity = 0.22;
                      } else if (block?.kind === "computing") {
                        fill = "#22c55e";
                        opacity = 0.8;
                        stroke = "#16a34a";
                        strokeWidth = 1.5;
                      } else {
                        fill = "#374151";
                        opacity = 0.1;
                      }
                    }

                    return (
                      <motion.rect
                        key={`${r}-${c}`}
                        x={10 + c * cellSize}
                        y={10 + r * cellSize}
                        width={cellSize - 2}
                        height={cellSize - 2}
                        rx={2}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        animate={{ opacity }}
                        transition={{ duration: 0.25 }}
                      />
                    );
                  }),
                )}

                {/* Viền block để dễ thấy tile */}
                {mode === "flash" &&
                  Array.from({ length: matSize / blockSize + 1 }).map((_, i) => (
                    <g key={`grid-${i}`}>
                      <line
                        x1={10 + i * blockSize * cellSize}
                        y1={10}
                        x2={10 + i * blockSize * cellSize}
                        y2={10 + matSize * cellSize}
                        stroke="#475569"
                        strokeWidth={0.7}
                        strokeDasharray="2 2"
                      />
                      <line
                        x1={10}
                        y1={10 + i * blockSize * cellSize}
                        x2={10 + matSize * cellSize}
                        y2={10 + i * blockSize * cellSize}
                        stroke="#475569"
                        strokeWidth={0.7}
                        strokeDasharray="2 2"
                      />
                    </g>
                  ))}

                {/* Annotation Q labels */}
                <text x={10} y={svgSize + 18} fontSize={11} fill="#94a3b8">
                  Q (query rows)
                </text>
                <text x={svgSize - 50} y={svgSize + 18} fontSize={11} fill="#94a3b8">
                  → K columns
                </text>
              </svg>

              <div className="mt-2 text-[11px] text-muted">
                {mode === "standard"
                  ? `Toàn bộ ma trận ${matSize}×${matSize} cells nằm trong HBM. Mỗi access phải đi đến HBM và quay về → nhiều round-trip.`
                  : `Tile đang active: hàng ${Math.floor(currentStep / (matSize / blockSize))}, cột ${currentStep % (matSize / blockSize)}. Chỉ tile này ở trong SRAM.`}
              </div>
            </div>

            {/* Column 2: GPU memory hierarchy */}
            <div className="rounded-xl border border-border bg-background p-3">
              <div className="mb-2 text-xs font-semibold text-foreground">
                Bộ nhớ đang dùng — hierarchy GPU
              </div>
              <svg viewBox="0 0 320 320" className="w-full">
                {/* Kim tự tháp memory */}
                {MEMORY_HIERARCHY.slice(0, 4).map((tier, i) => {
                  const y = 15 + i * 65;
                  const w = 280 - i * 20;
                  const x = (320 - w) / 2;
                  const isUsed =
                    mode === "standard"
                      ? tier.id === "hbm" || tier.id === "l2"
                      : tier.id === "sram" || tier.id === "register" || tier.id === "hbm";
                  const isHot =
                    mode === "standard"
                      ? tier.id === "hbm"
                      : tier.id === "sram";

                  return (
                    <g key={tier.id}>
                      <motion.rect
                        x={x}
                        y={y}
                        width={w}
                        height={52}
                        rx={8}
                        fill={tier.color}
                        animate={{
                          fillOpacity: isHot ? 0.6 : isUsed ? 0.25 : 0.08,
                          strokeOpacity: isHot ? 1 : 0.4,
                        }}
                        stroke={tier.color}
                        strokeWidth={isHot ? 2 : 1}
                      />
                      <text
                        x={160}
                        y={y + 18}
                        textAnchor="middle"
                        fontSize={11}
                        fontWeight="bold"
                        fill={tier.color}
                      >
                        {tier.label}
                      </text>
                      <text x={160} y={y + 33} textAnchor="middle" fontSize={11} fill="#e2e8f0">
                        {tier.size} · {tier.bandwidth}
                      </text>
                      <text x={160} y={y + 46} textAnchor="middle" fontSize={11} fill="#94a3b8">
                        {tier.latency}
                      </text>
                    </g>
                  );
                })}

                {/* Mũi tên data flow */}
                {mode === "standard" ? (
                  <g>
                    <motion.path
                      d="M 70 250 Q 40 200 70 150"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth={2}
                      strokeDasharray="4 3"
                      animate={{ strokeDashoffset: [0, -14] }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                    />
                    <motion.path
                      d="M 250 150 Q 280 200 250 250"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth={2}
                      strokeDasharray="4 3"
                      animate={{ strokeDashoffset: [0, 14] }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                    />
                    <text x={160} y={305} textAnchor="middle" fontSize={11} fill="#ef4444">
                      ↕ nhiều round-trip HBM ↔ SRAM
                    </text>
                  </g>
                ) : (
                  <g>
                    <motion.circle
                      cx={160}
                      cy={105}
                      r={8}
                      fill="#22c55e"
                      animate={{ scale: [1, 1.4, 1] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                    />
                    <text x={160} y={305} textAnchor="middle" fontSize={11} fill="#22c55e">
                      ✓ dữ liệu ở lại SRAM cho cả tile
                    </text>
                  </g>
                )}
              </svg>
            </div>
          </div>

          {/* Memory + speed bars */}
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-3">
              <div className="mb-2 text-xs font-semibold text-foreground">
                Bộ nhớ attention matrix
              </div>
              <div className="space-y-2">
                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="text-red-500">Standard</span>
                    <span className="text-muted">O(N²)</span>
                  </div>
                  <div className="h-3 rounded-full bg-red-500/20">
                    <motion.div
                      className="h-3 rounded-full bg-red-500"
                      animate={{ width: mode === "standard" ? "100%" : "100%" }}
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="text-green-500">Flash</span>
                    <span className="text-muted">O(N)</span>
                  </div>
                  <div className="h-3 rounded-full bg-green-500/20">
                    <motion.div
                      className="h-3 rounded-full bg-green-500"
                      animate={{ width: "2%" }}
                      style={{ width: "2%" }}
                    />
                  </div>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-muted">
                Với N=128K, fp16: Standard 32 GB · Flash ~0.5 MB.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-3">
              <div className="mb-2 text-xs font-semibold text-foreground">
                Tốc độ forward attention
              </div>
              <div className="space-y-2">
                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="text-red-500">Standard</span>
                    <span className="text-muted">1×</span>
                  </div>
                  <div className="h-3 rounded-full bg-red-500/20">
                    <motion.div className="h-3 rounded-full bg-red-500" style={{ width: "33%" }} />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="text-green-500">Flash (FA2)</span>
                    <span className="text-muted">~3×</span>
                  </div>
                  <div className="h-3 rounded-full bg-green-500/20">
                    <motion.div
                      className="h-3 rounded-full bg-green-500"
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-muted">
                FA3 trên H100 đạt ~75% peak FP16, hoặc 1.2 PFLOPS với FP8.
              </p>
            </div>
          </div>

          {/* Speedup chart — chọn sequence length */}
          <div className="mt-4 rounded-xl border border-border bg-background p-4">
            <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
              <div className="text-xs font-semibold text-foreground">
                Speedup theo độ dài chuỗi (A100, fp16)
              </div>
              <div className="flex gap-1">
                {BENCHMARK.map((b) => (
                  <button
                    key={b.seqLen}
                    type="button"
                    onClick={() => setSeqChoice(b.seqLen as "2K" | "8K" | "32K" | "128K")}
                    className={`rounded-md border px-2 py-1 text-[11px] font-semibold transition-all ${
                      seqChoice === b.seqLen
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border bg-card text-muted hover:bg-surface"
                    }`}
                  >
                    N={b.seqLen}
                  </button>
                ))}
              </div>
            </div>

            <svg viewBox="0 0 520 260" className="w-full">
              <defs>
                <linearGradient id="barRed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f87171" />
                  <stop offset="100%" stopColor="#dc2626" />
                </linearGradient>
                <linearGradient id="barGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4ade80" />
                  <stop offset="100%" stopColor="#16a34a" />
                </linearGradient>
              </defs>

              {/* Trục */}
              <line x1={60} y1={30} x2={60} y2={210} stroke="#475569" strokeWidth={1} />
              <line x1={60} y1={210} x2={500} y2={210} stroke="#475569" strokeWidth={1} />

              <text x={16} y={115} fontSize={11} fill="#94a3b8" transform="rotate(-90 16 115)">
                Thời gian (log ms)
              </text>

              {/* Vẽ bars cho từng sequence */}
              {BENCHMARK.map((b, i) => {
                const x = 90 + i * 105;
                // Log scale: map ms vào pixel
                const maxMs = 20000;
                const stdH = 170 * (Math.log10(b.standardMs + 1) / Math.log10(maxMs));
                const flashH = 170 * (Math.log10(b.flashMs + 1) / Math.log10(maxMs));
                const selected = b.seqLen === seqChoice;
                return (
                  <g key={b.seqLen}>
                    {selected && (
                      <rect
                        x={x - 8}
                        y={25}
                        width={85}
                        height={195}
                        rx={6}
                        fill="#3b82f6"
                        fillOpacity={0.08}
                        stroke="#3b82f6"
                        strokeOpacity={0.4}
                        strokeDasharray="3 2"
                      />
                    )}
                    <rect
                      x={x}
                      y={210 - stdH}
                      width={30}
                      height={stdH}
                      rx={3}
                      fill="url(#barRed)"
                    />
                    <text x={x + 15} y={205 - stdH} textAnchor="middle" fontSize={11} fill="#f87171">
                      {b.standardMs < 1000 ? `${b.standardMs}ms` : `${(b.standardMs / 1000).toFixed(1)}s`}
                    </text>
                    <rect
                      x={x + 35}
                      y={210 - flashH}
                      width={30}
                      height={flashH}
                      rx={3}
                      fill="url(#barGreen)"
                    />
                    <text
                      x={x + 50}
                      y={205 - flashH}
                      textAnchor="middle"
                      fontSize={11}
                      fill="#4ade80"
                    >
                      {b.flashMs < 1000 ? `${b.flashMs}ms` : `${(b.flashMs / 1000).toFixed(1)}s`}
                    </text>
                    <text x={x + 32} y={225} textAnchor="middle" fontSize={11} fill="#94a3b8" fontWeight="bold">
                      N={b.seqLen}
                    </text>
                    <text x={x + 32} y={240} textAnchor="middle" fontSize={11} fill="#22c55e">
                      {(b.standardMs / b.flashMs).toFixed(1)}× nhanh hơn
                    </text>
                  </g>
                );
              })}

              {/* Legend */}
              <rect x={400} y={40} width={12} height={12} fill="url(#barRed)" rx={2} />
              <text x={418} y={50} fontSize={11} fill="#e2e8f0">
                Standard
              </text>
              <rect x={400} y={60} width={12} height={12} fill="url(#barGreen)" rx={2} />
              <text x={418} y={70} fontSize={11} fill="#e2e8f0">
                Flash Attn
              </text>
            </svg>

            <div className="mt-2 rounded-lg border border-border bg-card p-3 text-xs">
              <div className="font-semibold text-foreground">N = {benchmarkSelected.seqLen}</div>
              <div className="mt-1 grid grid-cols-2 gap-2 text-muted">
                <div>
                  Standard: <strong className="text-red-500">{benchmarkSelected.standardMs} ms</strong>
                  , mem{" "}
                  <strong className="text-red-500">
                    {benchmarkSelected.standardMemGB >= 1
                      ? `${benchmarkSelected.standardMemGB} GB`
                      : `${(benchmarkSelected.standardMemGB * 1024).toFixed(0)} MB`}
                  </strong>
                </div>
                <div>
                  Flash: <strong className="text-green-500">{benchmarkSelected.flashMs} ms</strong>, mem{" "}
                  <strong className="text-green-500">
                    {benchmarkSelected.flashMemGB >= 1
                      ? `${benchmarkSelected.flashMemGB} GB`
                      : `${(benchmarkSelected.flashMemGB * 1024).toFixed(1)} MB`}
                  </strong>
                </div>
              </div>
              <p className="mt-1 text-muted">{benchmarkSelected.note}</p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ─────────────── STEP 3: AHA MOMENT ─────────────── */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>Flash Attention</strong> không thay đổi toán học — kết quả CHÍNH XÁC giống
            standard attention. Nó chỉ thay đổi <strong>cách tính</strong>: chia thành blocks
            nhỏ, tính trong SRAM (nhanh), dùng online softmax để tích lũy. Giảm IO = giảm thời
            gian thật sự!
          </p>
          <p className="text-sm text-muted mt-1">
            Insight sâu hơn: GPU hiện đại tắc ở bộ nhớ (memory-bound) chứ không phải tính toán
            (compute-bound). Tỷ lệ FLOPS/bandwidth của A100 là ~150; tức GPU có thể làm 150 phép
            nhân cho mỗi byte đọc. Attention chuẩn có arithmetic intensity thấp hơn giá trị đó
            → bỏ phí compute. Flash Attention nâng arithmetic intensity bằng cách &ldquo;tái
            dùng&rdquo; data trong SRAM nhiều lần — gần đến peak compute của GPU.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ─────────────── STEP 4: GPU MEMORY HIERARCHY ─────────────── */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Bộ nhớ GPU — chi tiết">
        <div className="grid gap-3 md:grid-cols-2">
          {MEMORY_HIERARCHY.map((tier) => (
            <div
              key={tier.id}
              className="rounded-xl border p-4"
              style={{ borderColor: `${tier.color}66`, backgroundColor: `${tier.color}12` }}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold" style={{ color: tier.color }}>
                  {tier.label}
                </h4>
                <span className="text-[11px] text-muted">{tier.latency}</span>
              </div>
              <div className="mt-1 text-[11px] text-muted">
                <span className="font-semibold text-foreground">{tier.size}</span> ·{" "}
                {tier.bandwidth}
              </div>
              <p className="mt-2 text-xs text-muted">{tier.description}</p>
              <p className="mt-1 text-[11px] italic text-muted">Lưu ý: {tier.note}</p>
            </div>
          ))}
        </div>

        <Callout variant="insight" title="Tại sao nhanh hơn mà vẫn chính xác?">
          <p>
            Flash Attention không bỏ phần tử nào, không xấp xỉ. Nó chỉ thay đổi thứ tự tính toán:
            thay vì tính toàn bộ hàng softmax → tính từng block + cập nhật online softmax. Toán
            học tương đương, IO ít hơn → nhanh hơn. Điều này giống việc bạn cộng số trong Excel
            theo từng cột rồi tổng lại — kết quả cuối giống hệt cộng tất cả cùng lúc.
          </p>
        </Callout>

        <Callout variant="info" title="Arithmetic intensity — khái niệm then chốt">
          <p>
            Arithmetic intensity = FLOPs / bytes loaded. Một operation có AI cao nghĩa là mỗi byte
            load được tái dùng nhiều lần → gần peak compute. Attention chuẩn có AI thấp vì nó
            chỉ load data một lần, compute, write back. Flash giữ data trong SRAM → tái dùng qua
            nhiều inner loop → AI tăng lên, memory-bound biến thành compute-bound.
          </p>
        </Callout>
      </LessonSection>

      {/* ─────────────── STEP 5: CHALLENGES ─────────────── */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách 1 — Tính toán bộ nhớ">
        <InlineChallenge
          question="Chuỗi 128K tokens. Standard attention cần 128K × 128K × 4 bytes ≈ 64GB cho attention matrix. Flash Attention cần bao nhiêu?"
          options={[
            "~64GB (giống standard)",
            "~0.5MB (chỉ cần lưu 1 block SRAM-sized + running stats cho online softmax)",
            "~32GB (giảm một nửa)",
            "~8GB",
          ]}
          correct={1}
          explanation="Flash Attention không lưu ma trận N×N. Chỉ cần 1 block Q, K, V (~100KB) và running stats O(N) cho online softmax (running max + running sum, mỗi cái N floats). Tổng vào khoảng 0.5–1 MB thay vì 64GB — giảm hơn 100,000 lần! Đây là lý do LLM có context window 128K+ tokens như GPT-4 Turbo hay Claude trở nên khả thi."
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách 2 — Chẩn đoán perf">
        <InlineChallenge
          question="Bạn train Llama với torch.compile + F.scaled_dot_product_attention nhưng GPU utilization chỉ 35%, profiler thấy nhiều _aten::attention native. Lỗi đâu?"
          options={[
            "Dữ liệu quá nhỏ",
            "Có khả năng attention fallback về kernel thường vì dtype không hỗ trợ (fp32) hoặc mask không Flash-compatible",
            "GPU hỏng",
            "Cần GPU mới",
          ]}
          correct={1}
          explanation="Khi PyTorch không thể chọn Flash kernel (dtype sai, head_dim > 128, mask custom không nằm trong causal/padding), nó âm thầm fallback về math/mem-efficient kernel. Profiler hiện native attention op chứ không phải Flash. Cách khắc phục: ép fp16/bf16, dùng với torch.nn.attention.sdpa_kernel(SDPBackend.FLASH_ATTENTION), hoặc dùng FlexAttention để compile mask custom thành Flash kernel."
        />
      </LessonSection>

      {/* ─────────────── STEP 6: EXPLANATION SECTION ─────────────── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích chi tiết">
        <ExplanationSection>
          <p>
            <strong>Flash Attention</strong> (Dao et al., 2022) là thuật toán{" "}
            <em>IO-aware exact attention</em>. Không thay đổi toán học, chỉ tối ưu cách tính trên
            hardware. Ý tưởng cốt lõi: phần lớn thời gian GPU không làm toán — nó đợi data đi
            lại giữa HBM và SRAM. Tránh round-trip đó là thắng.
          </p>

          <p className="mt-3 font-semibold text-foreground">
            Standard Attention — IO bottleneck
          </p>
          <LaTeX block>
            {String.raw`S = QK^T \in \mathbb{R}^{N \times N} \xrightarrow{\text{write HBM}} P = \text{softmax}(S) \xrightarrow{\text{write HBM}} O = PV`}
          </LaTeX>
          <p className="text-sm text-muted">
            3 lần ghi/đọc HBM cho ma trận N×N. Memory = O(N²). Đây là HBM trip thứ 1 (ghi S),
            thứ 2 (đọc S + ghi P), thứ 3 (đọc P + ghi O) — cộng dồn rất đáng kể khi N lớn.
          </p>

          <p className="mt-3 font-semibold text-foreground">
            Flash Attention — tiling + online softmax
          </p>
          <LaTeX block>
            {String.raw`\text{For each block } (Q_b, K_b, V_b): \quad O_b = \text{softmax}(Q_b K_b^T / \sqrt{d}) \cdot V_b`}
          </LaTeX>
          <p className="text-sm text-muted">
            Mỗi block tính hoàn toàn trong SRAM. Online softmax cập nhật running max/sum.
            Memory = O(N). Không có ma trận P cỡ N×N bao giờ xuất hiện trong HBM!
          </p>

          <p className="mt-3 font-semibold text-foreground">Online softmax — kỹ thuật cốt lõi</p>
          <p className="text-sm">
            Để tính softmax ổn định, ta cần <LaTeX>{"m = \\max(x)"}</LaTeX> rồi{" "}
            <LaTeX>{"s = \\sum e^{x - m}"}</LaTeX>. Online softmax cho phép tính dần khi chỉ thấy
            một phần của x mỗi lần. Khi gặp giá trị mới <LaTeX>{"x'"}</LaTeX>:
          </p>
          <LaTeX block>
            {String.raw`m_{\text{new}} = \max(m, x'), \quad s_{\text{new}} = e^{m - m_{\text{new}}} \cdot s + e^{x' - m_{\text{new}}}`}
          </LaTeX>
          <p className="text-sm text-muted">
            Output cũng được rescale tương ứng khi m thay đổi. Kết quả cuối cùng hoàn toàn chính
            xác — không sai số so với tính một lần với toàn bộ hàng.
          </p>

          <Callout variant="info" title="Flash Attention 2 & 3">
            <p>
              <strong>FA2</strong> (Dao 2023): đảo loop order (outer loop theo Q block),
              song song hóa theo sequence length chứ không chỉ theo head/batch, giảm non-matmul
              FLOPs → khoảng 2× nhanh hơn FA1. Đạt 50–70% peak A100 FP16 TFLOPs.
            </p>
            <p className="mt-1">
              <strong>FA3</strong> (Shah &amp; Dao 2024): thiết kế cho Hopper/H100. Tận dụng
              Tensor Memory Accelerator (TMA) cho async load, WGMMA warp-group matmul, FP8 cho
              bandwidth 2× nữa. Kết quả: ~75% peak FP16 hoặc 1.2 PFLOPS FP8 — gần giới hạn vật lý
              của GPU. Mọi LLM hiện đại (GPT-4, Claude, Llama, Gemini) đều dùng Flash Attention,
              thường kết hợp với <TopicLink slug="kv-cache">KV cache</TopicLink> và{" "}
              <TopicLink slug="transformer">Transformer</TopicLink> architecture.
            </p>
          </Callout>

          <Callout variant="warning" title="Không phải Linear Attention!">
            <p>
              Flash Attention KHÁC với Linear Attention, Performer, Linformer. Những cái đó là
              <em> xấp xỉ</em> — dùng kernel trick hoặc low-rank projection để giảm O(N²) →
              O(N). Flash Attention là <em>exact</em> — kết quả đồng nhất với standard. Bạn có
              thể dùng Flash làm drop-in replacement mà không mất độ chính xác của mô hình.
            </p>
          </Callout>

          <Callout variant="tip" title="Khi nào dùng Flash?">
            <p>
              Mặc định luôn dùng. PyTorch 2.0+ tự động chọn Flash khi có thể. Bạn chỉ cần đảm
              bảo: (1) dtype là fp16 hoặc bf16; (2) head_dim ≤ 128 (FA1/FA2) hoặc ≤ 256 (FA3);
              (3) mask nằm trong các pattern hỗ trợ (causal, padding, sliding window) — nếu
              custom, dùng FlexAttention.
            </p>
          </Callout>

          <Callout variant="insight" title="Impact trong cộng đồng">
            <p>
              Flash Attention là một trong những optimization có tác động lớn nhất trong hệ sinh
              thái LLM. Nó cho phép training và serving context dài (32K–1M tokens) trở nên kinh
              tế. Không có Flash, Retrieval-Augmented Generation trên tài liệu dài, long-form
              writing, hoặc analyzing codebase đều sẽ đắt hơn hàng chục lần.
            </p>
          </Callout>

          <CodeBlock language="python" title="flash_attention_usage.py">
{`# Cách dùng Flash Attention trong PyTorch
import torch
import torch.nn.functional as F
from torch.nn.attention import SDPBackend, sdpa_kernel

# PyTorch 2.0+ có built-in Flash Attention!
# Tự động chọn Flash Attention khi có thể.

q = torch.randn(1, 8, 4096, 64, device="cuda", dtype=torch.float16)  # (B, heads, N, d_k)
k = torch.randn(1, 8, 4096, 64, device="cuda", dtype=torch.float16)
v = torch.randn(1, 8, 4096, 64, device="cuda", dtype=torch.float16)

# Tự động dùng Flash Attention nếu available
output = F.scaled_dot_product_attention(q, k, v, is_causal=True)
# Memory: O(N) thay vì O(N²)
# Speed: 2–4× nhanh hơn naive implementation

# Ép dùng Flash backend (báo lỗi nếu không được) để debug
with sdpa_kernel(SDPBackend.FLASH_ATTENTION):
    output = F.scaled_dot_product_attention(q, k, v, is_causal=True)

# Hoặc dùng thư viện flash-attn trực tiếp (chi tiết hơn)
# pip install flash-attn --no-build-isolation
from flash_attn import flash_attn_func
output = flash_attn_func(q, k, v, causal=True, dropout_p=0.0, softmax_scale=1.0 / (64 ** 0.5))

# So sánh memory:
# N=4096:  Standard ~64MB,  Flash ~0.5MB (giảm 128×)
# N=128K:  Standard ~64GB,  Flash ~0.5MB (giảm 130,000×)
`}
          </CodeBlock>

          <CodeBlock language="python" title="pseudocode_flash_attention.py">
{`# Pseudocode Flash Attention forward pass
# Tham khảo: Dao et al. 2022, Algorithm 1
# N: seq length, d: head dim, Br/Bc: block row/col sizes

import math
import torch

def flash_attention_forward(Q, K, V, Br=64, Bc=64, causal=False):
    """
    Q, K, V: (N, d) tensors trên HBM
    Trả về O: (N, d) — tương đương softmax(QK^T / sqrt(d)) V
    Bộ nhớ thêm: O(N) (running stats), KHÔNG phải O(N^2)
    """
    N, d = Q.shape
    scale = 1.0 / math.sqrt(d)

    # Output + running stats, chỉ O(N) bộ nhớ
    O = torch.zeros_like(Q)             # (N, d)
    l = torch.zeros(N, device=Q.device) # running sum of exp
    m = torch.full((N,), -float("inf"), device=Q.device)  # running max

    Tr = (N + Br - 1) // Br  # số block của Q
    Tc = (N + Bc - 1) // Bc  # số block của K, V

    # OUTER loop trên Q blocks (FA2 đổi thứ tự: outer là Q)
    for i in range(Tr):
        qi_s, qi_e = i * Br, min((i + 1) * Br, N)
        Qi = Q[qi_s:qi_e]                        # (Br, d) — load SRAM
        Oi = torch.zeros(qi_e - qi_s, d, device=Q.device)
        li = torch.zeros(qi_e - qi_s, device=Q.device)
        mi = torch.full((qi_e - qi_s,), -float("inf"), device=Q.device)

        # INNER loop trên K,V blocks
        for j in range(Tc):
            if causal and j * Bc > qi_e - 1:
                break
            kj_s, kj_e = j * Bc, min((j + 1) * Bc, N)
            Kj = K[kj_s:kj_e]   # (Bc, d)
            Vj = V[kj_s:kj_e]   # (Bc, d)

            # Attention scores cho tile này — hoàn toàn trong SRAM
            Sij = Qi @ Kj.transpose(0, 1) * scale  # (Br, Bc)
            if causal:
                mask = torch.arange(kj_s, kj_e, device=Q.device) \
                     > torch.arange(qi_s, qi_e, device=Q.device)[:, None]
                Sij.masked_fill_(mask, -float("inf"))

            # ── Online softmax ───────────────────────────────
            mij_local = Sij.max(dim=-1).values          # (Br,)
            mi_new = torch.maximum(mi, mij_local)
            Pij = torch.exp(Sij - mi_new[:, None])      # (Br, Bc)
            lij_local = Pij.sum(dim=-1)                 # (Br,)
            alpha = torch.exp(mi - mi_new)              # rescale factor cho O cũ
            li = alpha * li + lij_local
            Oi = alpha[:, None] * Oi + Pij @ Vj
            mi = mi_new
            # ─────────────────────────────────────────────────

        # Ghi kết quả block Q này ra HBM
        O[qi_s:qi_e] = Oi / li[:, None]
        l[qi_s:qi_e] = li
        m[qi_s:qi_e] = mi

    return O, l, m  # l, m dùng lại ở backward
`}
          </CodeBlock>

          <CollapsibleDetail title="Backward pass — tại sao vẫn O(N) memory?">
            <p className="text-sm">
              Standard backward cần lưu ma trận P = softmax(S) trong forward để tính gradient. Đó
              là O(N²). Flash Attention thay vào đó lưu chỉ <em>running stats</em> (l, m) kích
              thước O(N). Ở backward, ta tính lại P tại chỗ cho từng block — đổi memory lấy
              compute thêm, nhưng compute đó diễn ra trong SRAM nên rẻ. Tổng thể, backward chỉ
              tốn O(N) memory phụ và nhanh tương đương hoặc nhanh hơn standard.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Liên hệ với Multi-Query / Grouped-Query Attention">
            <p className="text-sm">
              MQA và GQA giảm số K/V heads để tiết kiệm KV cache memory và bandwidth trong
              decode. Flash Attention vẫn áp dụng được — thực tế, FA2+ còn thêm tối ưu đặc biệt
              cho MQA/GQA khi broadcast K/V qua các query heads. Llama 2/3 dùng GQA + FA2, và
              Llama-3.1 405B với 128K context là kết quả trực tiếp của combo này.
            </p>
          </CollapsibleDetail>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="text-sm font-semibold text-foreground">Ứng dụng thực tế</div>
              <ul className="mt-2 space-y-2 text-xs text-muted">
                {APPLICATIONS.map((app) => (
                  <li key={app.name}>
                    <strong className="text-foreground">{app.name}:</strong> {app.detail}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="text-sm font-semibold text-foreground">Pitfall thường gặp</div>
              <ul className="mt-2 space-y-2 text-xs text-muted">
                {PITFALLS.map((p) => (
                  <li key={p.name}>
                    <strong className="text-foreground">{p.name}:</strong> {p.detail}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </ExplanationSection>
      </LessonSection>

      {/* ─────────────── STEP 7: SUMMARY ─────────────── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Flash Attention"
          points={[
            "Flash Attention = exact attention (không xấp xỉ) nhưng IO-efficient: chia thành blocks, tính trong SRAM nhanh gấp 10× HBM.",
            "Giảm bộ nhớ O(N²) → O(N): không lưu ma trận attention N×N đầy đủ, chỉ giữ running stats cho online softmax.",
            "Nhanh hơn 2–4× nhờ giảm HBM IO trips. Insight: GPU tắc ở memory bandwidth, không phải compute — giảm IO quan trọng hơn giảm FLOPs.",
            "Online softmax: cập nhật running max + running sum qua mỗi block, rescale output tương ứng → kết quả đồng nhất với softmax một lần.",
            "FA1 (2022) → FA2 (2023, 2× nhanh hơn, song song tốt hơn) → FA3 (2024, tận dụng H100 TMA/WGMMA/FP8, ~75% peak).",
            "Mọi LLM hiện đại dùng Flash Attention — GPT-4, Claude, Llama, Mistral, Gemini. Cho phép context 128K–1M tokens kinh tế.",
          ]}
        />
      </LessonSection>

      {/* ─────────────── STEP 8: QUIZ ─────────────── */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
