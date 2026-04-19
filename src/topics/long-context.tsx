"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
  CollapsibleDetail,
  MiniSummary,
  CodeBlock,
  LessonSection,
  LaTeX,
  TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "long-context",
  title: "Long Context",
  titleVi: "Ngữ cảnh dài — AI đọc cả cuốn sách",
  description:
    "Khả năng mô hình xử lý hàng trăm nghìn đến hàng triệu token trong một lần, cho phép phân tích tài liệu dài.",
  category: "emerging",
  tags: ["long-context", "context-window", "retrieval", "attention"],
  difficulty: "advanced",
  relatedSlugs: ["state-space-models", "reasoning-models", "inference-optimization"],
  vizType: "interactive",
};

// ============================================================================
// Context-size presets (slider stops)
// ============================================================================

interface ContextPreset {
  label: string;
  tokens: number;
  tokensLabel: string;
  era: string;
}

const CONTEXT_PRESETS: ContextPreset[] = [
  { label: "4K", tokens: 4_000, tokensLabel: "4,000", era: "GPT-3.5 (2023)" },
  { label: "32K", tokens: 32_000, tokensLabel: "32,000", era: "GPT-4 (2023)" },
  { label: "128K", tokens: 128_000, tokensLabel: "128,000", era: "GPT-4 Turbo (2024)" },
  { label: "200K", tokens: 200_000, tokensLabel: "200,000", era: "Claude 3.5 (2024)" },
  { label: "1M", tokens: 1_000_000, tokensLabel: "1,000,000", era: "Gemini 1.5 / Claude (2025)" },
];

// ============================================================================
// Synthetic document: list of chunks. Each chunk is ~4K tokens in the story,
// rendered as a single card. Chunk 7 holds the "golden answer" — useful for
// the lost-in-the-middle demonstration.
// ============================================================================

interface DocChunk {
  id: number;
  heading: string;
  preview: string;
  approxTokens: number;
  isGolden?: boolean;
}

const DOCUMENT: DocChunk[] = [
  {
    id: 1,
    heading: "Chương 1 — Giới thiệu hợp đồng",
    preview:
      "Bên A và Bên B ký hợp đồng dịch vụ phát triển phần mềm quản trị doanh nghiệp trọn gói.",
    approxTokens: 3800,
  },
  {
    id: 2,
    heading: "Chương 2 — Định nghĩa thuật ngữ",
    preview:
      "Các thuật ngữ 'Sản phẩm', 'Dịch vụ', 'Deliverable', 'Milestone' được định nghĩa cụ thể.",
    approxTokens: 4100,
  },
  {
    id: 3,
    heading: "Chương 3 — Phạm vi công việc",
    preview:
      "Bên B cam kết cung cấp: web app, mobile app iOS/Android, hạ tầng cloud, tài liệu kỹ thuật.",
    approxTokens: 4500,
  },
  {
    id: 4,
    heading: "Chương 4 — Lộ trình milestones",
    preview:
      "M1 (tháng 1): thiết kế UX. M2 (tháng 3): prototype có thể demo. M3 (tháng 6): GA release.",
    approxTokens: 3900,
  },
  {
    id: 5,
    heading: "Chương 5 — Tiêu chí nghiệm thu",
    preview:
      "Acceptance criteria: uptime 99.9%, response p95 < 200ms, không bug P0/P1 trong 7 ngày.",
    approxTokens: 4200,
  },
  {
    id: 6,
    heading: "Chương 6 — Điều khoản thanh toán",
    preview:
      "Thanh toán theo milestone: 20% ký HĐ + 30% M1 + 30% M2 + 20% M3. Giữ 10% bảo hành 12 tháng.",
    approxTokens: 4300,
  },
  {
    id: 7,
    heading: "Chương 7 — ⚠️ Điều khoản phạt (GOLDEN)",
    preview:
      "Phạt trễ hạn 2%/tuần, tối đa 30% giá trị hợp đồng. Gây thiệt hại Bên A có thể tính thêm ngoài phạt.",
    approxTokens: 4600,
    isGolden: true,
  },
  {
    id: 8,
    heading: "Chương 8 — Bảo mật & IP",
    preview:
      "Mọi source code, tài liệu là tài sản của Bên A ngay khi thanh toán milestone tương ứng.",
    approxTokens: 4100,
  },
  {
    id: 9,
    heading: "Chương 9 — Điều khoản bất khả kháng",
    preview:
      "Thiên tai, chiến tranh, đại dịch — các bên được miễn trách nhiệm trong thời gian sự kiện kéo dài.",
    approxTokens: 3700,
  },
  {
    id: 10,
    heading: "Chương 10 — Giải quyết tranh chấp",
    preview:
      "Trọng tài thương mại VIAC, ngôn ngữ tiếng Việt, địa điểm Hà Nội, phán quyết chung thẩm.",
    approxTokens: 3900,
  },
  {
    id: 11,
    heading: "Chương 11 — Luật áp dụng",
    preview:
      "Luật Việt Nam, Bộ luật Dân sự 2015, Luật Thương mại 2005, Nghị định 13/2023 về DL cá nhân.",
    approxTokens: 3600,
  },
  {
    id: 12,
    heading: "Chương 12 — Chấm dứt hợp đồng",
    preview:
      "Các trường hợp đơn phương chấm dứt: vi phạm nghiêm trọng, phá sản, ngừng hoạt động 30+ ngày.",
    approxTokens: 4000,
  },
  {
    id: 13,
    heading: "Chương 13 — Điều khoản chuyển nhượng",
    preview:
      "Không được chuyển nhượng hợp đồng cho bên thứ ba mà không có văn bản đồng ý của bên kia.",
    approxTokens: 3800,
  },
  {
    id: 14,
    heading: "Chương 14 — Sửa đổi hợp đồng",
    preview:
      "Mọi sửa đổi phải bằng văn bản, có chữ ký của đại diện pháp lý của cả hai bên ký kết.",
    approxTokens: 3500,
  },
  {
    id: 15,
    heading: "Chương 15 — Thông báo",
    preview:
      "Email, fax, thư bảo đảm. Ngày hiệu lực tính từ khi bên kia nhận được hoặc xác nhận đã đọc.",
    approxTokens: 3400,
  },
  {
    id: 16,
    heading: "Chương 16 — Điều khoản tổng thể",
    preview:
      "Hợp đồng thay thế mọi thoả thuận trước đó. Có 2 bản tiếng Việt, mỗi bên giữ 1 bản gốc.",
    approxTokens: 3300,
  },
  {
    id: 17,
    heading: "Phụ lục A — SLA chi tiết",
    preview:
      "Uptime guarantee 99.9%, support window 24/7, incident response time theo mức P0/P1/P2/P3.",
    approxTokens: 4400,
  },
  {
    id: 18,
    heading: "Phụ lục B — Bảng giá",
    preview:
      "Giá trọn gói 2,5 tỷ VND, bao gồm VAT 10%. Chi phí phát sinh ngoài phạm vi tính theo giờ.",
    approxTokens: 3700,
  },
  {
    id: 19,
    heading: "Phụ lục C — Danh sách nhân sự",
    preview:
      "PM: Nguyễn A. Tech Lead: Trần B. QA Lead: Lê C. DevOps Lead: Phạm D. UX Lead: Hoàng E.",
    approxTokens: 3500,
  },
  {
    id: 20,
    heading: "Phụ lục D — Template báo cáo",
    preview:
      "Báo cáo tuần gồm: tiến độ, rủi ro mới, blocker đang mở, kế hoạch tuần sau, yêu cầu hỗ trợ.",
    approxTokens: 3600,
  },
  {
    id: 21,
    heading: "Phụ lục E — Security checklist",
    preview:
      "OWASP Top 10 coverage, penetration test định kỳ 6 tháng, SOC 2 Type II trong 18 tháng đầu.",
    approxTokens: 4200,
  },
  {
    id: 22,
    heading: "Phụ lục F — Môi trường triển khai",
    preview:
      "AWS ap-southeast-1, multi-AZ, Terraform IaC, CI/CD GitHub Actions, monitoring bằng Datadog.",
    approxTokens: 4300,
  },
  {
    id: 23,
    heading: "Phụ lục G — Data processing agreement",
    preview:
      "Tuân thủ Nghị định 13/2023 về bảo vệ dữ liệu cá nhân, có điều khoản subprocessor.",
    approxTokens: 3900,
  },
  {
    id: 24,
    heading: "Phụ lục H — Escalation matrix",
    preview:
      "P0: 15 phút. P1: 1 giờ. P2: 4 giờ. P3: 1 ngày làm việc. Escalation qua PM → CTO → CEO.",
    approxTokens: 3100,
  },
  {
    id: 25,
    heading: "Phụ lục cuối — Chữ ký các bên",
    preview:
      "Ngày ký, địa điểm ký, đại diện pháp lý của các bên cùng dấu doanh nghiệp (nếu có).",
    approxTokens: 800,
  },
];

// ============================================================================
// Quiz questions (8)
// ============================================================================

const TOTAL_STEPS = 7;

// ============================================================================
// Main component
// ============================================================================

export default function LongContextTopic() {
  const [presetIdx, setPresetIdx] = useState<number>(2); // default 128K
  const [attentionMode, setAttentionMode] = useState<"standard" | "long">(
    "standard",
  );
  const [focusChunk, setFocusChunk] = useState<number | null>(7);

  const preset = CONTEXT_PRESETS[presetIdx];

  // ==========================================================================
  // Derived: cumulative tokens per chunk → decide "fit" vs "truncated"
  // ==========================================================================

  const chunkState = useMemo(() => {
    let cumulative = 0;
    return DOCUMENT.map((c) => {
      const start = cumulative;
      cumulative += c.approxTokens;
      const fits = cumulative <= preset.tokens;
      return {
        ...c,
        cumulativeStart: start,
        cumulativeEnd: cumulative,
        fits,
      };
    });
  }, [preset.tokens]);

  const totalDocTokens = chunkState[chunkState.length - 1].cumulativeEnd;
  const fittingCount = chunkState.filter((c) => c.fits).length;
  const usagePct = Math.min(
    100,
    Math.round((Math.min(totalDocTokens, preset.tokens) / preset.tokens) * 100),
  );

  // ==========================================================================
  // Derived: attention weights from focusChunk to every other chunk.
  // Standard model: falls off with distance (exp decay).
  // Long-context model: nearly constant (uniform attention over window).
  // ==========================================================================

  const attentionWeights = useMemo(() => {
    if (focusChunk == null) {
      return chunkState.map(() => 0);
    }
    return chunkState.map((c) => {
      const distance = Math.abs(c.id - focusChunk);
      if (!c.fits) return 0; // truncated chunks have zero attention
      if (attentionMode === "standard") {
        // exponential falloff: close chunks strong, far chunks weak
        return Math.exp(-distance / 3.5);
      }
      // long-context model: nearly uniform, slight emphasis on nearby
      return 0.55 + 0.35 * Math.exp(-distance / 9);
    });
  }, [chunkState, focusChunk, attentionMode]);

  const setPresetBySlider = useCallback((value: number) => {
    setPresetIdx(Math.max(0, Math.min(CONTEXT_PRESETS.length - 1, value)));
  }, []);

  // ==========================================================================
  // Quiz (8 questions)
  // ==========================================================================

  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question: "Tại sao KV cache là bottleneck chính của long context?",
        options: [
          "KV cache làm chậm CPU",
          "KV cache tăng tuyến tính theo context length: 1M tokens có thể cần 50-100GB VRAM chỉ cho cache",
          "KV cache làm model không chính xác",
        ],
        correct: 1,
        explanation:
          "KV cache = 2 x layers x heads x d_head x seq_len x bytes. Với Llama 70B, 1M tokens: KV cache ~ 80GB VRAM — hơn cả model weights! PagedAttention, GQA, quantized KV giảm được 4-8x nhưng vẫn là bottleneck chính.",
      },
      {
        question: "'Lost in the middle' problem là gì?",
        options: [
          "Model quên thông tin ở GIỮA context dài — nhớ tốt đầu và cuối, quên giữa",
          "Model mất context khi context quá dài",
          "Token ở giữa bị xoá để tiết kiệm memory",
        ],
        correct: 0,
        explanation:
          "Nghiên cứu (Liu et al. 2023) chỉ ra: model nhớ tốt thông tin ở đầu và cuối context, nhưng accuracy giảm 20-30% cho thông tin nằm ở giữa. Khi context 100K+, vấn đề này nghiêm trọng hơn. Giải pháp: document ordering, chunked retrieval.",
      },
      {
        question: "Khi nào nên dùng RAG thay vì long context?",
        options: [
          "Luôn dùng long context vì đơn giản hơn",
          "Khi corpus > 10M tokens, cần freshness, hoặc cần chi phí thấp cho nhiều queries trên cùng corpus",
          "Khi corpus nhỏ hơn 1000 tokens",
        ],
        correct: 1,
        explanation:
          "Long context: đơn giản, không cần index, tốt cho 1 tài liệu. RAG: scale tới hàng tỷ documents, chi phí per-query thấp (chỉ lấy top-K chunks), freshness (update index không cần re-process). Rule of thumb: < 200K tokens → long context. > 1M → RAG. Ở giữa → tuỳ use case.",
      },
      {
        question:
          "Self-attention có complexity O(N²). Nếu context tăng từ 100K → 1M tokens, FLOPs attention tăng bao nhiêu lần?",
        options: ["10 lần", "100 lần (vì N² tăng 100x khi N tăng 10x)", "1,000 lần"],
        correct: 1,
        explanation:
          "N tăng 10x → N² tăng 100x. Đó là lý do attention là bottleneck compute chính ở long context. Flash Attention giảm memory xuống O(N) nhưng FLOPs vẫn O(N²). State-space models (Mamba) có O(N) FLOPs thật sự — đó là động lực nghiên cứu.",
      },
      {
        question:
          "Context caching trong Claude/Gemini giúp gì khi query nhiều lần trên cùng tài liệu dài?",
        options: [
          "Không giúp gì đáng kể",
          "Prefill (forward pass trên document) chỉ tính 1 lần, cache lại KV; các query sau chỉ trả tiền cho phần query mới — rẻ hơn 5-10x",
          "Làm model chính xác hơn",
        ],
        correct: 1,
        explanation:
          "Prompt caching / context caching: nếu prefix không đổi (ví dụ tài liệu 500 trang), KV của prefix được cache. Các query sau chỉ cần prefill phần khác nhau. Chi phí giảm 5-10x, latency giảm 80%+. Claude có prompt caching, Gemini có context caching — tính năng bắt buộc cho production long context.",
      },
      {
        question:
          "Tại sao 'needle-in-a-haystack' benchmark không đủ để đánh giá long-context model?",
        options: [
          "Nó quá khó",
          "Nó chỉ test retrieval đơn giản 1 fact; không test reasoning across many facts ở nhiều vị trí xa nhau",
          "Nó không có dữ liệu Tiếng Việt",
        ],
        correct: 1,
        explanation:
          "NIAH: nhét 1 câu ngẫu nhiên vào context dài, hỏi lại → chỉ test retrieval. Nhưng use case thực: tổng hợp 5 điều khoản nằm ở chương 3, 7, 12, 18, 22. Benchmark mới (RULER, LongBench, InfiniteBench) test multi-hop reasoning, aggregation, ordering — nơi model thường fail dù NIAH 99%+.",
      },
      {
        question:
          "RoPE scaling (YaRN, NTK) là kỹ thuật gì?",
        options: [
          "Thay attention bằng convolution",
          "Nội suy/điều chỉnh rotary position embeddings để model pretrain ở 4K có thể hoạt động ở 128K mà không retrain từ đầu",
          "Chỉ là tên một thư viện",
        ],
        correct: 1,
        explanation:
          "RoPE mã hoá vị trí bằng xoay vector. Nếu extrapolate thẳng lên context dài hơn pretrain, accuracy tụt. YaRN/NTK-aware scaling nội suy frequency → model generalize tốt hơn. Kết hợp với continued pretraining ngắn trên data dài cho kết quả tốt nhất. Đây là cách Llama và Qwen đạt 128K.",
      },
      {
        type: "fill-blank",
        question:
          "Các model long context như Gemini 1.5 có thể xử lý tới {blank} tokens, nhưng chi phí attention vẫn tăng theo {blank} với độ dài chuỗi.",
        blanks: [
          {
            answer: "1 million",
            accept: [
              "1m",
              "1,000,000",
              "1 triệu",
              "million tokens",
              "một triệu",
            ],
          },
          { answer: "O(N^2)", accept: ["quadratic", "n^2", "bình phương"] },
        ],
        explanation:
          "Gemini 1.5 Pro và Claude (2025) hỗ trợ 1 million tokens context. Tuy nhiên, self-attention vẫn có complexity O(N^2), khiến KV cache và FLOPs trở thành bottleneck — đây là lý do cần Flash Attention, GQA, state-space models.",
      },
    ],
    [],
  );

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn cần AI phân tích hợp đồng 500 trang (250K tokens) để tìm điều khoản bất lợi. Cách nào hiệu quả nhất?"
          options={[
            "Cắt nhỏ thành 100 phần, hỏi AI từng phần một",
            "Cho toàn bộ 500 trang vào context window của model hỗ trợ 1M tokens",
            "Đọc thủ công — AI không xử lý được tài liệu dài",
          ]}
          correct={1}
          explanation="Long context models (Claude, Gemini) đọc cả 500 trang trong 1 lần — hiểu toàn cảnh, không bị mất context giữa các phần. Giống đọc nguyên cuốn sách thay vì đọc từng trang rời. Điều khoản ở trang 3 liên quan đến trang 487? Long context bắt được!"
        >
          <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
            <p className="mb-4 text-sm text-muted leading-relaxed">
              Kéo slider để thay đổi <strong className="text-foreground">context size</strong>{" "}
              (4K → 1M tokens). Quan sát xem tài liệu 25 chương nào &quot;lọt&quot; vào
              context, và so sánh pattern <strong className="text-foreground">attention</strong>{" "}
              giữa model thường và long-context model.
            </p>
            <VisualizationSection>
              <div className="space-y-5">
                {/* ---------- Slider + stats ---------- */}
                <div className="rounded-xl border border-border bg-card/40 p-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <label
                      htmlFor="ctx-slider"
                      className="text-xs font-semibold text-muted"
                    >
                      Context size:
                    </label>
                    <div className="text-base font-bold text-foreground">
                      {preset.label}{" "}
                      <span className="text-xs text-muted font-normal">
                        ({preset.tokensLabel} tokens · {preset.era})
                      </span>
                    </div>
                  </div>
                  <input
                    id="ctx-slider"
                    type="range"
                    min={0}
                    max={CONTEXT_PRESETS.length - 1}
                    step={1}
                    value={presetIdx}
                    onChange={(e) => setPresetBySlider(Number(e.target.value))}
                    className="w-full accent-accent"
                  />
                  <div className="flex justify-between text-[10px] text-muted font-mono">
                    {CONTEXT_PRESETS.map((p, i) => (
                      <button
                        key={p.label}
                        onClick={() => setPresetIdx(i)}
                        className={`hover:text-foreground transition-colors ${
                          i === presetIdx
                            ? "text-accent font-bold"
                            : ""
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <Stat
                      label="Tài liệu"
                      value={`${totalDocTokens.toLocaleString()} tok`}
                      hint={`${DOCUMENT.length} chương`}
                    />
                    <Stat
                      label="Lọt context"
                      value={`${fittingCount} / ${DOCUMENT.length}`}
                      hint={`${usagePct}% window`}
                    />
                    <Stat
                      label="Bị truncate"
                      value={`${DOCUMENT.length - fittingCount} chương`}
                      hint={
                        DOCUMENT.length - fittingCount === 0
                          ? "OK — toàn bộ fit"
                          : "Phần đuôi bị cắt"
                      }
                    />
                  </div>
                </div>

                {/* ---------- Attention mode toggle ---------- */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-muted">
                    Attention pattern:
                  </span>
                  <button
                    onClick={() => setAttentionMode("standard")}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                      attentionMode === "standard"
                        ? "bg-accent text-white"
                        : "border border-border bg-card text-muted hover:text-foreground"
                    }`}
                  >
                    Standard (gần = mạnh, xa = yếu)
                  </button>
                  <button
                    onClick={() => setAttentionMode("long")}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                      attentionMode === "long"
                        ? "bg-accent text-white"
                        : "border border-border bg-card text-muted hover:text-foreground"
                    }`}
                  >
                    Long-context (gần uniform)
                  </button>
                  <span className="ml-auto text-[10px] text-muted">
                    Click chunk để đổi focus. Golden = chunk chứa đáp án.
                  </span>
                </div>

                {/* ---------- Document chunk list ---------- */}
                <div className="rounded-xl border border-border bg-[#0a0f1c] p-3 max-h-[420px] overflow-y-auto">
                  <div className="space-y-1.5">
                    {chunkState.map((c, i) => {
                      const fits = c.fits;
                      const w = attentionWeights[i];
                      const isFocus = c.id === focusChunk;
                      const barW = Math.round(w * 100);
                      return (
                        <motion.button
                          key={c.id}
                          onClick={() => setFocusChunk(c.id)}
                          initial={false}
                          animate={{
                            opacity: fits ? 1 : 0.35,
                          }}
                          transition={{ duration: 0.2 }}
                          className={`w-full text-left rounded-md border px-3 py-2 transition-all ${
                            isFocus
                              ? "border-accent bg-accent/15"
                              : fits
                              ? "border-border bg-card/60 hover:bg-card"
                              : "border-border/40 bg-card/20"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Chunk id badge */}
                            <div
                              className={`shrink-0 w-7 h-7 rounded flex items-center justify-center text-[10px] font-bold ${
                                fits
                                  ? c.isGolden
                                    ? "bg-yellow-500 text-black"
                                    : "bg-slate-700 text-white"
                                  : "bg-slate-800 text-slate-500 line-through"
                              }`}
                            >
                              {c.id}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-xs font-semibold ${
                                    fits
                                      ? "text-foreground"
                                      : "text-muted line-through"
                                  }`}
                                >
                                  {c.heading}
                                </span>
                                {!fits && (
                                  <span className="text-[9px] text-red-400 font-mono">
                                    [TRUNCATED]
                                  </span>
                                )}
                                {c.isGolden && fits && (
                                  <span className="text-[9px] text-yellow-400 font-mono">
                                    [GOLDEN ANSWER]
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-muted mt-0.5 truncate">
                                {c.preview}
                              </div>

                              {/* Token position bar + attention */}
                              <div className="mt-1.5 flex items-center gap-2">
                                <span className="text-[9px] text-muted font-mono w-16 shrink-0">
                                  {c.cumulativeStart.toLocaleString()}
                                </span>
                                <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={false}
                                    animate={{ width: `${barW}%` }}
                                    transition={{ duration: 0.25 }}
                                    className={`h-full rounded-full ${
                                      attentionMode === "standard"
                                        ? "bg-gradient-to-r from-blue-500 to-purple-500"
                                        : "bg-gradient-to-r from-emerald-500 to-teal-400"
                                    }`}
                                  />
                                </div>
                                <span className="text-[9px] text-muted font-mono w-10 shrink-0 text-right">
                                  {w > 0 ? w.toFixed(2) : "—"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* ---------- Legend / explanation ---------- */}
                <div className="grid md:grid-cols-2 gap-3 text-[11px]">
                  <div className="rounded-lg border border-border bg-card/40 p-3">
                    <div className="font-semibold text-foreground mb-1">
                      Standard attention
                    </div>
                    <p className="text-muted leading-relaxed">
                      Attention weight tụt nhanh theo khoảng cách. Chunk xa
                      focus hầu như không đóng góp → nguyên nhân &quot;lost in
                      the middle&quot;. Với context 100K+, model chỉ nhớ rõ
                      vùng cuối.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-card/40 p-3">
                    <div className="font-semibold text-foreground mb-1">
                      Long-context model
                    </div>
                    <p className="text-muted leading-relaxed">
                      Training data dài + positional tricks (RoPE scaling, YaRN)
                      + continued pretraining giúp attention phân bố đều hơn —
                      chunk ở cuối tài liệu vẫn được nhìn thấy bởi query ở đầu.
                    </p>
                  </div>
                </div>
              </div>
            </VisualizationSection>
          </LessonSection>

          <LessonSection
            step={3}
            totalSteps={TOTAL_STEPS}
            label="Khoảnh khắc Aha"
          >
            <AhaMoment>
              <p>
                Từ 4K tokens (5 trang) đến 1M tokens (1250 trang) chỉ trong 2
                năm! Như từ đọc <strong>1 bài báo</strong> sang đọc{" "}
                <strong>cả cuốn tiểu thuyết</strong> trong 1 lần. Long context
                không chỉ là &apos;nhiều hơn&apos; — nó cho phép{" "}
                <strong>hiểu toàn cảnh</strong> thay vì ghép nhiều mảnh nhỏ.
              </p>
              <p className="mt-3 text-sm">
                Điểm tinh tế: context dài không đồng nghĩa với{" "}
                <em>nhớ đều</em>. Model có window 1M nhưng attention vẫn có thể
                &quot;lười&quot; ở giữa. Đo bằng benchmark RULER/LongBench quan
                trọng hơn con số &quot;supports 1M tokens&quot; trên marketing
                page.
              </p>
            </AhaMoment>
          </LessonSection>

          <LessonSection
            step={4}
            totalSteps={TOTAL_STEPS}
            label="Thử thách"
          >
            <InlineChallenge
              question="KV cache của Llama 70B với 1M tokens context mất khoảng 80GB VRAM. Model weights FP16 = 140GB. Tổng cần bao nhiêu GPU A100 (80GB)?"
              options={[
                "2 GPU (140GB weights)",
                "3 GPU (220GB tổng = weights + KV cache)",
                "1 GPU nếu dùng quantization",
              ]}
              correct={1}
              explanation="Weights 140GB + KV cache 80GB = 220GB. A100 80GB → cần 3 GPU minimum. KV cache là 'chi phí ẩn' của long context — tăng tuyến tính với seq_len. Giải pháp: GQA giảm KV 4-8x, quantized KV cache (INT8), PagedAttention giảm fragmentation."
            />
            <div className="mt-4">
              <InlineChallenge
                question="Bạn có tài liệu 600K tokens và cần hỏi 50 câu hỏi khác nhau về nó. Cách nào rẻ nhất trên Claude?"
                options={[
                  "Gửi 50 request, mỗi request đính kèm toàn bộ tài liệu 600K tokens → bill 30M input tokens",
                  "Dùng prompt caching: đính kèm tài liệu 1 lần (đắt), 49 lần sau chỉ tính 10% giá input cho phần cached → tiết kiệm gần 90% chi phí",
                  "Không thể dùng lại vì mỗi request là stateless",
                ]}
                correct={1}
                explanation="Anthropic prompt caching: khi prefix (document) lặp lại, phần cached tính giá 10% input tokens (read) hoặc 125% (write lần đầu). 50 queries trên 600K tokens: không cache = 30M tokens. Có cache: 600K write + 49 x 600K x 0.1 = ~3.5M — tiết kiệm ~88%."
              />
            </div>
          </LessonSection>

          <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
            <ExplanationSection>
              <p>
                <strong>Long Context</strong> là khả năng model xử lý hàng trăm
                nghìn đến hàng triệu tokens trong 1 lần — cho phép phân tích tài
                liệu dài, codebase, video. Khái niệm mở rộng của{" "}
                <TopicLink slug="context-window">context window</TopicLink>{" "}
                truyền thống, thường đi kèm kiến trúc thay thế như{" "}
                <TopicLink slug="state-space-models">state-space models</TopicLink>{" "}
                và tối ưu <TopicLink slug="kv-cache">KV cache</TopicLink> để
                kiểm soát chi phí bộ nhớ.
              </p>

              <p>
                <strong>Attention complexity:</strong>
              </p>
              <LaTeX block>
                {
                  "\\text{Attention FLOPs} = O(N^2 \\cdot d) \\quad \\text{KV Cache} = O(N \\cdot d \\cdot L)"
                }
              </LaTeX>

              <p>
                <strong>Kỹ thuật mở rộng context:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>RoPE scaling:</strong> Nội suy vị trí tương đối, mở
                  rộng từ 4K → 128K+ không cần retrain
                </li>
                <li>
                  <strong>Flash Attention:</strong> Giảm memory từ O(N²) xuống
                  O(N) bằng tiling
                </li>
                <li>
                  <strong>GQA (Grouped Query Attention):</strong> Giảm KV heads
                  4-8x, giảm KV cache tương ứng
                </li>
                <li>
                  <strong>Ring Attention:</strong> Phân phối sequence qua nhiều
                  GPU, overlap compute và communication
                </li>
                <li>
                  <strong>Prompt / context caching:</strong> Cache KV của prefix
                  không đổi, giảm chi phí re-query 5-10x
                </li>
              </ul>

              <Callout variant="tip" title="Long context vs RAG — không loại trừ nhau">
                Long context: đơn giản (dump all docs), tốt cho reasoning
                across documents. RAG: scale tốt hơn (tỷ documents), chi phí
                per-query thấp, freshness. Hybrid: RAG chọn top-50 documents →
                long context xử lý toàn bộ.
              </Callout>

              <Callout variant="warning" title="Lost in the middle">
                Benchmark needle-in-a-haystack (NIAH) thường &quot;xanh&quot;
                100%, nhưng với multi-hop reasoning (RULER, LongBench), accuracy
                có thể tụt 30-50% ở giữa context. Đừng tin tưởng mù quáng con số
                &quot;1M tokens&quot;.
              </Callout>

              <Callout variant="info" title="KV cache dominates">
                Ở 1M tokens, KV cache thường lớn hơn cả model weights. Đây là
                lý do cần GQA, MLA (Multi-head Latent Attention), quantized KV,
                và PagedAttention — nếu không sẽ không bao giờ fit GPU.
              </Callout>

              <Callout variant="warning" title="Cost realism">
                1 call với 500K tokens input ở giá $3/1M = $1.50 per query. 1000
                queries/ngày = $1,500/ngày không có cache. Luôn tính chi phí
                TRƯỚC khi chọn long-context-only. Dùng prompt caching hoặc RAG
                nếu query lặp lại.
              </Callout>

              <CollapsibleDetail title="KV cache size — công thức chi tiết">
                <p className="text-sm">Công thức tổng quát:</p>
                <LaTeX block>
                  {
                    "\\text{KV Cache} = 2 \\times n_{\\text{layers}} \\times n_{\\text{kv heads}} \\times d_{\\text{head}} \\times N \\times \\text{bytes}"
                  }
                </LaTeX>
                <p className="text-sm">
                  Với Llama 3 70B (80 layers, 8 KV heads sau GQA, d_head=128),
                  FP16 (2 bytes):
                </p>
                <ul className="list-disc list-inside text-sm space-y-1 pl-2">
                  <li>Per token: 2 × 80 × 8 × 128 × 2 = 327 KB/token</li>
                  <li>100K tokens: ~32 GB</li>
                  <li>1M tokens: ~320 GB (không còn fit 1 GPU)</li>
                </ul>
                <p className="text-sm mt-2">
                  Đây là lý do sản xuất: quantize KV xuống INT8 (giảm 2x) hoặc
                  INT4 (giảm 4x) với ít tổn thất chất lượng. Hoặc dùng MLA như
                  DeepSeek-V2 để giảm tiếp 5-10x.
                </p>
              </CollapsibleDetail>

              <CollapsibleDetail title="Chọn chiến lược: long context vs RAG vs hybrid">
                <p className="text-sm">Rule of thumb theo kích thước corpus:</p>
                <ul className="list-disc list-inside text-sm space-y-1 pl-2">
                  <li>
                    <strong>&lt; 200K tokens, 1 tài liệu:</strong> long context
                    thuần. Đơn giản, accuracy cao.
                  </li>
                  <li>
                    <strong>200K-2M tokens, nhiều query lặp:</strong> long
                    context + prompt caching. Rẻ hơn 5-10x.
                  </li>
                  <li>
                    <strong>2M-100M tokens:</strong> RAG (retrieve top-K) →
                    long context xử lý K chunks được chọn.
                  </li>
                  <li>
                    <strong>&gt; 100M tokens, freshness cao:</strong> RAG thuần.
                    Long context không khả thi cost-wise.
                  </li>
                </ul>
                <p className="text-sm mt-2">
                  Hybrid thường thắng: retrieval gọi nhanh (50ms), trả về 50-100
                  chunks liên quan nhất, đưa vào long context (200K) để model
                  reason toàn cảnh. Cân bằng giữa scale và chất lượng.
                </p>
              </CollapsibleDetail>

              <CodeBlock language="python" title="Claude API context window — Python">
                {`import anthropic

client = anthropic.Anthropic()

# Đọc toàn bộ tài liệu 500 trang
with open("contract_500_pages.txt") as f:
    full_document = f.read()  # ~250K tokens

# Use prompt caching so re-asking is cheap
response = client.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=4096,
    system=[
        {
            "type": "text",
            "text": (
                "Bạn là trợ lý pháp lý. Phân tích hợp đồng được cung cấp "
                "và trả lời chính xác, ngắn gọn, trích dẫn điều khoản."
            ),
            "cache_control": {"type": "ephemeral"},
        },
        {
            "type": "text",
            "text": full_document,
            "cache_control": {"type": "ephemeral"},
        },
    ],
    messages=[{
        "role": "user",
        "content": (
            "Liệt kê các điều khoản phạt có thể gây bất lợi cho Bên A, "
            "kèm số chương và trích dẫn."
        ),
    }],
)

# Lần đầu: 'cache_creation_input_tokens' = ~250K (125% giá input)
# Lần thứ 2+: 'cache_read_input_tokens' = ~250K (10% giá input)
# → giảm chi phí tới 90% cho các câu hỏi follow-up
for block in response.content:
    if block.type == "text":
        print(block.text)

print("\\nUsage:", response.usage)
`}
              </CodeBlock>

              <CodeBlock language="python" title="Đo tokens và chia nhỏ khi vượt context">
                {`import anthropic
from dataclasses import dataclass

client = anthropic.Anthropic()
MODEL = "claude-sonnet-4-5"

# ----------------------------------------------------------------------------
# Count helpers — dùng API count_tokens để ước lượng chính xác theo tokenizer
# của Claude (khác tokenizer OpenAI, nên không dùng tiktoken).
# ----------------------------------------------------------------------------

def count_tokens(text: str, model: str = MODEL) -> int:
    resp = client.messages.count_tokens(
        model=model,
        messages=[{"role": "user", "content": text}],
    )
    return resp.input_tokens

def fits_in_context(text: str, budget: int = 180_000) -> bool:
    """Reserve ~20K tokens cho system prompt + response."""
    return count_tokens(text) <= budget

# ----------------------------------------------------------------------------
# Chunking fallback — khi document > context window
# Chia theo đoạn văn, tôn trọng biên đoạn để giữ semantic coherence.
# ----------------------------------------------------------------------------

@dataclass
class Chunk:
    text: str
    tokens: int
    index: int

def chunk_for_rag(text: str, chunk_tokens: int = 2000) -> list[Chunk]:
    """Split khi document > 1M tokens hoặc cần RAG index."""
    paragraphs = text.split("\\n\\n")
    chunks: list[Chunk] = []
    current: list[str] = []
    current_toks = 0
    for p in paragraphs:
        toks = count_tokens(p)
        if current_toks + toks > chunk_tokens and current:
            chunks.append(
                Chunk(
                    text="\\n\\n".join(current),
                    tokens=current_toks,
                    index=len(chunks),
                )
            )
            current = [p]
            current_toks = toks
        else:
            current.append(p)
            current_toks += toks
    if current:
        chunks.append(
            Chunk(
                text="\\n\\n".join(current),
                tokens=current_toks,
                index=len(chunks),
            )
        )
    return chunks

# ----------------------------------------------------------------------------
# Strategy selector — chọn long context / hybrid / RAG theo kích thước
# ----------------------------------------------------------------------------

def choose_strategy(doc_path: str) -> str:
    with open(doc_path) as f:
        text = f.read()
    tokens = count_tokens(text)

    if tokens < 180_000:
        return "long-context-single-call"
    if tokens < 900_000:
        return "long-context-with-caching"
    if tokens < 10_000_000:
        return "hybrid-retrieval-plus-long-context"
    return "pure-rag"

# ----------------------------------------------------------------------------
# Example run — áp dụng chiến lược đã chọn
# ----------------------------------------------------------------------------

def analyze(doc_path: str, question: str) -> str:
    strategy = choose_strategy(doc_path)
    text = open(doc_path).read()

    if strategy == "long-context-single-call":
        resp = client.messages.create(
            model=MODEL,
            max_tokens=2048,
            messages=[{
                "role": "user",
                "content": f"Tài liệu:\\n{text}\\n\\nCâu hỏi: {question}",
            }],
        )
        return resp.content[0].text

    if strategy == "long-context-with-caching":
        resp = client.messages.create(
            model=MODEL,
            max_tokens=2048,
            system=[
                {"type": "text", "text": "Bạn là trợ lý phân tích tài liệu."},
                {
                    "type": "text",
                    "text": text,
                    "cache_control": {"type": "ephemeral"},
                },
            ],
            messages=[{"role": "user", "content": question}],
        )
        return resp.content[0].text

    # hybrid or pure RAG: embed + top-K retrieval, omitted for brevity
    raise NotImplementedError(strategy)

print(analyze("huge_doc.txt", "Điều khoản phạt tối đa là bao nhiêu?"))
`}
              </CodeBlock>

              <CodeBlock language="python" title="Đo 'lost in the middle' bằng needle-in-a-haystack tự chế">
                {`"""
Đơn giản hoá: nhét 1 "needle" (câu có thể truy vấn) vào vị trí d (0..1)
trong haystack dài N tokens, sau đó hỏi model nội dung needle.
So sánh accuracy theo vị trí → tái hiện 'lost in the middle'.
"""

import anthropic
import random
import string

client = anthropic.Anthropic()

NEEDLE = (
    "Mật khẩu truy cập khẩn cấp của Bên A là 'LOVELACE-1815'. "
    "Chỉ dùng trong tình huống khẩn cấp, không chia sẻ với bên thứ ba."
)

def make_haystack(n_tokens: int) -> str:
    """Sinh filler bằng văn bản luật giả lập."""
    paragraph = (
        "Điều khoản tiếp theo quy định các trách nhiệm bên liên quan "
        "trong quá trình thực hiện công việc theo hợp đồng. "
    )
    return (paragraph * (n_tokens // 20))[: n_tokens * 4]

def inject_needle(haystack: str, depth: float) -> str:
    pos = int(len(haystack) * depth)
    return haystack[:pos] + "\\n\\n" + NEEDLE + "\\n\\n" + haystack[pos:]

def ask(text: str) -> str:
    resp = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=256,
        messages=[{
            "role": "user",
            "content": (
                "Dựa vào tài liệu bên dưới, trích xuất 'mật khẩu khẩn cấp' "
                "nếu có. Trả lời 'NOT FOUND' nếu không có.\\n\\n"
                f"{text}\\n\\nTrả lời:"
            ),
        }],
    )
    return resp.content[0].text.strip()

def evaluate(n_tokens: int, depths: list[float]) -> dict[float, bool]:
    haystack = make_haystack(n_tokens)
    results: dict[float, bool] = {}
    for d in depths:
        doc = inject_needle(haystack, d)
        answer = ask(doc)
        results[d] = "LOVELACE-1815" in answer
    return results

# Example run
if __name__ == "__main__":
    depths = [0.0, 0.1, 0.25, 0.5, 0.75, 0.9, 1.0]
    for n in [10_000, 100_000, 500_000]:
        r = evaluate(n, depths)
        passed = sum(1 for v in r.values() if v)
        print(f"{n:>8} tokens: {passed}/{len(depths)} positions passed")
`}
              </CodeBlock>

              <p className="mt-4">
                <strong>Liên hệ các chủ đề</strong>: Long context kết nối chặt
                với <TopicLink slug="kv-cache">KV cache</TopicLink>,{" "}
                <TopicLink slug="state-space-models">state-space models</TopicLink>
                , và{" "}
                <TopicLink slug="inference-optimization">
                  inference optimization
                </TopicLink>
                . Trong thực tế, long context luôn đi kèm{" "}
                <TopicLink slug="rag">RAG</TopicLink>{" "}
                ở phần pipeline dữ liệu đầu vào.
              </p>

              <p>
                <strong>Bảng so sánh nhanh</strong> các lựa chọn tiếp cận tài
                liệu dài cho một query:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-border rounded-md overflow-hidden">
                  <thead className="bg-card/80 text-foreground">
                    <tr>
                      <th className="text-left px-2 py-1.5 border-b border-border">
                        Tiếp cận
                      </th>
                      <th className="text-left px-2 py-1.5 border-b border-border">
                        Điểm mạnh
                      </th>
                      <th className="text-left px-2 py-1.5 border-b border-border">
                        Điểm yếu
                      </th>
                      <th className="text-left px-2 py-1.5 border-b border-border">
                        Khi dùng
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-muted">
                    <tr className="border-b border-border/60">
                      <td className="px-2 py-1.5 font-semibold text-foreground">
                        Long context thuần
                      </td>
                      <td className="px-2 py-1.5">
                        Đơn giản, reasoning xuyên tài liệu
                      </td>
                      <td className="px-2 py-1.5">
                        Đắt, lost-in-the-middle
                      </td>
                      <td className="px-2 py-1.5">&lt; 200K tokens, 1 query</td>
                    </tr>
                    <tr className="border-b border-border/60">
                      <td className="px-2 py-1.5 font-semibold text-foreground">
                        Long context + caching
                      </td>
                      <td className="px-2 py-1.5">
                        Rẻ hơn 5-10x khi query lặp
                      </td>
                      <td className="px-2 py-1.5">
                        Cache timeout 5 phút (ephemeral)
                      </td>
                      <td className="px-2 py-1.5">
                        200K-2M tokens, nhiều query
                      </td>
                    </tr>
                    <tr className="border-b border-border/60">
                      <td className="px-2 py-1.5 font-semibold text-foreground">
                        RAG thuần
                      </td>
                      <td className="px-2 py-1.5">
                        Scale tới tỷ documents, rẻ
                      </td>
                      <td className="px-2 py-1.5">
                        Phụ thuộc chất lượng retrieval
                      </td>
                      <td className="px-2 py-1.5">
                        &gt; 10M tokens, freshness cao
                      </td>
                    </tr>
                    <tr>
                      <td className="px-2 py-1.5 font-semibold text-foreground">
                        Hybrid (RAG → LC)
                      </td>
                      <td className="px-2 py-1.5">
                        Cân bằng scale + chất lượng
                      </td>
                      <td className="px-2 py-1.5">
                        Complexity cao hơn
                      </td>
                      <td className="px-2 py-1.5">Production realistic</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </ExplanationSection>
          </LessonSection>

          <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
            <MiniSummary
              points={[
                "Long context: từ 4K (2023) đến 1M tokens (2025) — đọc cả cuốn sách trong 1 lần.",
                "KV cache là bottleneck chính: tăng tuyến tính với seq_len, có thể lớn hơn model weights.",
                "Attention vẫn O(N²) FLOPs: Flash Attention giảm memory O(N), SSM giảm FLOPs thực sự.",
                "'Lost in the middle': model nhớ tốt đầu/cuối, yếu ở giữa; cần RULER/LongBench để đánh giá.",
                "Prompt caching giảm chi phí query lặp 5-10x: prefix không đổi → KV cache tái sử dụng.",
                "Long context vs RAG là complementary: dưới 200K dùng long context, trên 2M dùng RAG; ở giữa hybrid.",
              ]}
            />
          </LessonSection>

          <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
            <QuizSection questions={quizQuestions} />
          </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}

// ============================================================================
// Small presentational helper
// ============================================================================

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-md border border-border bg-card/60 p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted">
        {label}
      </div>
      <div className="text-sm font-bold text-foreground">{value}</div>
      {hint && <div className="text-[10px] text-muted mt-0.5">{hint}</div>}
    </div>
  );
}
