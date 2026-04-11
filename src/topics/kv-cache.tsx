"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate,
  StepReveal,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
  LessonSection,} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "kv-cache",
  title: "KV Cache",
  titleVi: "Bộ nhớ đệm KV",
  description:
    "Kỹ thuật lưu trữ key-value đã tính để tránh tính lại khi sinh token mới, tăng tốc suy luận LLM.",
  category: "llm-concepts",
  tags: ["inference", "caching", "key-value", "optimization"],
  difficulty: "intermediate",
  relatedSlugs: ["self-attention", "inference-optimization", "context-window", "transformer"],
  vizType: "interactive",
};

const TOKENS = ["Hà", "Nội", "là", "thủ", "đô"];

const quizQuestions: QuizQuestion[] = [
  {
    question: "KV Cache tiết kiệm tính toán bằng cách nào?",
    options: [
      "Nén model nhỏ hơn",
      "Lưu Key và Value của token đã sinh, chỉ tính attention cho token MỚI",
      "Bỏ qua attention hoàn toàn",
      "Dùng GPU nhanh hơn",
    ],
    correct: 1,
    explanation: "Khi sinh token thứ N, KV cache đã có K và V của token 1→(N-1). Chỉ cần tính K,V cho token N mới, rồi dùng lại cache cho attention. Tiết kiệm O(N) tính toán mỗi bước!",
  },
  {
    question: "KV Cache tốn bao nhiêu bộ nhớ GPU cho Llama 70B, context 4K token?",
    options: [
      "Vài MB — không đáng kể",
      "~2-5 GB — đáng kể, chiếm phần lớn VRAM",
      "Bằng kích thước model (140 GB)",
      "Không tốn bộ nhớ",
    ],
    correct: 1,
    explanation: "KV cache cho Llama 70B ≈ 2×80 layers × 4K × 128 dim × 2 bytes ≈ vài GB. Với batch size lớn hoặc context dài, KV cache có thể chiếm phần lớn VRAM!",
  },
  {
    question: "Kỹ thuật nào giúp giảm bộ nhớ KV Cache?",
    options: [
      "Tăng model size",
      "Multi-Query Attention (MQA) — chia sẻ K,V giữa các head",
      "Tăng context window",
      "Dùng temperature cao hơn",
    ],
    correct: 1,
    explanation: "MQA (dùng trong PaLM, Falcon) và GQA (Grouped-Query Attention, dùng trong Llama 2+) chia sẻ K,V giữa nhiều attention head, giảm KV cache 4-8 lần.",
  },
];

export default function KVCacheTopic() {
  const [step, setStep] = useState(0);

  // Số phép tính attention: without cache = tất cả lại từ đầu, with cache = chỉ token mới
  const withoutCache = TOKENS.slice(0, step + 1).reduce((s, _, i) => s + (i + 1), 0);
  const withCache = step + 1; // Chỉ tính attention cho token mới với tất cả token cũ

  return (
    <>
      {/* ━━━ HOOK ━━━ */}
      <LessonSection step={1} totalSteps={6} label="Thử đoán">
      <LessonSection step={1} totalSteps={6} label="Thử đoán">
      <PredictionGate
        question="LLM sinh text từng token một. Khi sinh token thứ 100, nó cần tính attention giữa token 100 với tất cả 99 token trước. Phải tính LẠI attention cho 99 token cũ không?"
        options={[
          "Phải — tính lại TẤT CẢ mỗi lần sinh token mới",
          "Không — lưu kết quả cũ lại (cache), chỉ tính cho token mới",
          "Không cần attention sau token đầu tiên",
        ]}
        correct={1}
        explanation="Nếu tính lại hết mỗi lần → O(n²) phép tính, cực kỳ chậm! KV Cache lưu Key và Value đã tính → chỉ cần tính cho token mới → tiết kiệm ~99% phép tính."
      >
        <p className="text-sm text-muted mt-4">
          Hãy xem trực tiếp sự khác biệt giữa có và không có KV Cache.
        </p>
      </PredictionGate>

            </LessonSection>

      </LessonSection>

{/* ━━━ KHÁM PHÁ — So sánh có/không cache ━━━ */}
      <LessonSection step={2} totalSteps={6} label="Khám phá">
      <LessonSection step={2} totalSteps={6} label="Khám phá">
      <VisualizationSection>
        <h3 className="text-base font-semibold text-foreground mb-1">
          Sinh câu: &quot;{TOKENS.join(" ")}&quot;
        </h3>
        <p className="text-sm text-muted mb-4">
          Nhấn &quot;Sinh token tiếp&quot; để xem AI sinh từng token. So sánh số phép tính có/không cache.
        </p>

        {/* Tokens đang sinh */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {TOKENS.map((t, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: i <= step ? 1 : 0.2, scale: i <= step ? 1 : 0.9 }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium border transition-all ${
                i < step
                  ? "bg-accent-light text-accent border-accent/20"
                  : i === step
                  ? "bg-accent text-white border-accent"
                  : "bg-surface text-tertiary border-border"
              }`}
            >
              {t}
              {i < step && (
                <span className="ml-1 text-[9px] text-accent">cached</span>
              )}
            </motion.span>
          ))}
        </div>

        {/* So sánh */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 p-4">
            <span className="text-[10px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider block mb-2">
              Không có KV Cache
            </span>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{withoutCache}</div>
            <span className="text-xs text-red-500/70">phép tính attention</span>
            <p className="text-[10px] text-red-500/60 mt-1">Tính LẠI tất cả mỗi bước</p>
          </div>
          <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10 p-4">
            <span className="text-[10px] font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider block mb-2">
              Có KV Cache
            </span>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{withCache}</div>
            <span className="text-xs text-green-500/70">phép tính attention</span>
            <p className="text-[10px] text-green-500/60 mt-1">Chỉ tính cho token mới</p>
          </div>
        </div>

        {/* Tiết kiệm */}
        {step > 0 && (
          <div className="rounded-lg bg-surface p-3 mb-4 text-center">
            <span className="text-sm text-foreground">
              Tiết kiệm:{" "}
              <strong className="text-accent">
                {Math.round((1 - withCache / withoutCache) * 100)}%
              </strong>{" "}
              phép tính
            </span>
          </div>
        )}

        {/* Nút điều khiển */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStep(s => Math.min(s + 1, TOKENS.length - 1))}
            disabled={step >= TOKENS.length - 1}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-30 transition-colors"
          >
            Sinh token tiếp
          </button>
          <button
            type="button"
            onClick={() => setStep(0)}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
          >
            Reset
          </button>
        </div>
      </VisualizationSection>

            </LessonSection>

      </LessonSection>

{/* ━━━ AHA MOMENT ━━━ */}
      <LessonSection step={3} totalSteps={6} label="Khám phá">
      <LessonSection step={3} totalSteps={6} label="Khám phá">
      <AhaMoment>
        <strong>KV Cache</strong>{" "}lưu Key và Value đã tính cho mọi token cũ. Khi sinh token mới,
        chỉ cần tính K,V cho token đó rồi &quot;look up&quot; cache — không tính lại 99 token trước!
        Tiết kiệm tới <strong>99%</strong>{" "}phép tính ở token thứ 100.
      </AhaMoment>

            </LessonSection>

      </LessonSection>

{/* ━━━ ĐI SÂU — Cách KV Cache hoạt động ━━━ */}
      <LessonSection step={4} totalSteps={6} label="Đi sâu">
      <LessonSection step={4} totalSteps={6} label="Đi sâu">
      <VisualizationSection>
        <h3 className="text-base font-semibold text-foreground mb-3">
          Bên trong KV Cache
        </h3>

        <StepReveal
          labels={[
            "Token 1: Tính K₁, V₁ → lưu cache",
            "Token 2: Tính K₂, V₂ → dùng K₁V₁ từ cache",
            "Token N: Chỉ tính Kₙ, Vₙ → dùng tất cả cache",
          ]}
        >
          <div className="rounded-lg bg-surface p-4">
            <p className="text-sm text-foreground mb-2">
              <strong>Sinh token đầu tiên &quot;Hà&quot;:</strong>
            </p>
            <p className="text-xs text-muted">
              Tính Q₁, K₁, V₁ cho &quot;Hà&quot;. Attention: Q₁ × K₁ᵀ → softmax → × V₁.
              Lưu K₁, V₁ vào cache.
            </p>
            <div className="mt-2 rounded bg-card border border-border p-2 text-xs text-center">
              Cache: [K₁, V₁]
            </div>
          </div>

          <div className="rounded-lg bg-surface p-4">
            <p className="text-sm text-foreground mb-2">
              <strong>Sinh token thứ 2 &quot;Nội&quot;:</strong>
            </p>
            <p className="text-xs text-muted">
              Tính Q₂, K₂, V₂ cho &quot;Nội&quot;. Attention: Q₂ × [K₁, K₂]ᵀ → softmax → × [V₁, V₂].
              <strong className="text-accent">{" "}K₁, V₁ lấy từ cache</strong>{" "}— không tính lại!
            </p>
            <div className="mt-2 rounded bg-card border border-border p-2 text-xs text-center">
              Cache: [K₁, V₁, K₂, V₂]
            </div>
          </div>

          <div className="rounded-lg bg-surface p-4">
            <p className="text-sm text-foreground mb-2">
              <strong>Sinh token thứ N:</strong>
            </p>
            <p className="text-xs text-muted">
              Chỉ tính Qₙ, Kₙ, Vₙ cho token mới. Attention dùng TẤT CẢ K,V từ cache.
            </p>
            <LaTeX block>{"\\text{Attention}_N = \\text{softmax}\\left(\\frac{Q_N \\cdot [K_1, ..., K_N]^T}{\\sqrt{d_k}}\\right) \\cdot [V_1, ..., V_N]"}</LaTeX>
            <div className="mt-2 rounded bg-card border border-border p-2 text-xs text-center">
              Cache: [K₁, V₁, ..., Kₙ, Vₙ] — tăng dần mỗi bước
            </div>
          </div>
        </StepReveal>
      </VisualizationSection>

            </LessonSection>

      </LessonSection>

{/* ━━━ THỬ THÁCH ━━━ */}
      <LessonSection step={5} totalSteps={6} label="Thử thách">
      <LessonSection step={5} totalSteps={6} label="Thử thách">
      <InlineChallenge
        question="KV Cache tăng dần mỗi token → tốn bộ nhớ. Context 200K token sẽ tốn cache rất lớn. Giải pháp nào được dùng phổ biến?"
        options={[
          "Giới hạn context nhỏ (4K)",
          "Multi-Query/Grouped-Query Attention — chia sẻ K,V giữa nhiều attention head",
          "Tắt KV Cache khi context dài",
          "Dùng CPU thay GPU để lưu cache",
        ]}
        correct={1}
        explanation="MQA/GQA (dùng trong Llama 2+, Mistral, Falcon) giảm số K,V cần lưu bằng cách chia sẻ giữa nhiều head. Llama 2 dùng GQA giảm KV cache ~4 lần mà hiệu suất gần như giữ nguyên."
      />

            </LessonSection>

      </LessonSection>

{/* ━━━ GIẢI THÍCH ━━━ */}
      <LessonSection step={6} totalSteps={6} label="Giải thích">
      <LessonSection step={6} totalSteps={6} label="Giải thích">
      <ExplanationSection>
        <p>
          <strong>KV Cache</strong>{" "}là kỹ thuật tối ưu inference cho Transformer, lưu lại
          Key và Value tensor đã tính để tránh tính lại khi sinh mỗi token mới.
        </p>

        <Callout variant="insight" title="Tại sao chỉ cache K và V, không cache Q?">
          Trong autoregressive generation, mỗi bước chỉ sinh 1 token mới → chỉ có 1 Query mới (Qₙ).
          Nhưng token này cần attend đến TẤT CẢ token trước → cần tất cả K₁...Kₙ₋₁ và V₁...Vₙ₋₁.
          Query không cần cache vì luôn chỉ có 1 query mới mỗi bước.
        </Callout>

        <Callout variant="warning" title="Đánh đổi: tốc độ vs bộ nhớ">
          KV Cache đổi bộ nhớ lấy tốc độ. Với Llama 70B, 128K context, KV cache có thể tốn 10-20 GB VRAM.
          Đây là lý do chính khiến LLM inference cần GPU VRAM lớn — không chỉ model weights!
        </Callout>

        <CodeBlock language="python" title="kv_cache_concept.py">{`# Pseudocode minh họa KV Cache
kv_cache = {"keys": [], "values": []}

for token in generated_tokens:
    # Tính Q, K, V cho token mới
    q_new = compute_query(token)
    k_new = compute_key(token)
    v_new = compute_value(token)

    # Thêm vào cache
    kv_cache["keys"].append(k_new)
    kv_cache["values"].append(v_new)

    # Attention dùng TẤT CẢ keys/values từ cache
    all_keys = torch.stack(kv_cache["keys"])
    all_values = torch.stack(kv_cache["values"])

    # Chỉ cần 1 query mới × tất cả keys
    attention = softmax(q_new @ all_keys.T / sqrt(d))
    output = attention @ all_values`}</CodeBlock>
      </ExplanationSection>

      <MiniSummary
        points={[
          "KV Cache lưu Key và Value đã tính, tránh tính lại khi sinh token mới",
          "Giảm từ O(n²) xuống O(n) phép tính — tiết kiệm ~99% ở token thứ 100",
          "Đánh đổi: tốn bộ nhớ GPU — cache tăng dần theo context length",
          "GQA/MQA giảm cache 4-8 lần bằng cách chia sẻ K,V giữa attention heads",
        ]}
      />

      <QuizSection questions={quizQuestions} />
      </LessonSection>
      </LessonSection>
    </>
  );
}
