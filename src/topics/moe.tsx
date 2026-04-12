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
  slug: "moe",
  title: "Mixture of Experts",
  titleVi: "Hỗn hợp chuyên gia — Chia để trị",
  description:
    "Kiến trúc mô hình sử dụng nhiều mạng con chuyên biệt (chuyên gia), chỉ kích hoạt một vài chuyên gia cho mỗi đầu vào.",
  category: "emerging",
  tags: ["moe", "sparse", "experts", "efficiency"],
  difficulty: "advanced",
  relatedSlugs: ["reasoning-models", "small-language-models", "inference-optimization"],
  vizType: "interactive",
};

/* ── Expert activation simulator ── */
interface Query {
  text: string;
  activeExperts: number[];
  weights: number[];
}

const EXPERTS = [
  { id: 0, label: "Toán học", color: "#3b82f6" },
  { id: 1, label: "Ngôn ngữ", color: "#22c55e" },
  { id: 2, label: "Lập trình", color: "#f59e0b" },
  { id: 3, label: "Khoa học", color: "#8b5cf6" },
  { id: 4, label: "Lịch sử", color: "#ef4444" },
  { id: 5, label: "Sáng tạo", color: "#06b6d4" },
  { id: 6, label: "Y tế", color: "#ec4899" },
  { id: 7, label: "Kinh doanh", color: "#84cc16" },
];

const QUERIES: Query[] = [
  { text: "Giải phương trình x^2 + 3x - 4 = 0", activeExperts: [0, 3], weights: [0.72, 0.28] },
  { text: "Viết bài thơ về mùa thu Hà Nội", activeExperts: [1, 5], weights: [0.58, 0.42] },
  { text: "Debug hàm quicksort bị lỗi", activeExperts: [2, 0], weights: [0.81, 0.19] },
  { text: "Triệu chứng sốt xuất huyết", activeExperts: [6, 3], weights: [0.65, 0.35] },
];

const TOTAL_STEPS = 7;

export default function MoETopic() {
  const [queryIdx, setQueryIdx] = useState(0);
  const query = QUERIES[queryIdx];

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Mixtral 8x7B có 47B tham số tổng nhưng mỗi token chỉ kích hoạt 13B. Tại sao?",
      options: [
        "6/8 expert bị tắt hoàn toàn",
        "Router chọn top-2 experts (mỗi 7B), cộng shared layers ≈ 13B active parameters per token",
        "Quantization giảm 47B xuống 13B",
      ],
      correct: 1,
      explanation: "Mỗi MoE layer có 8 experts (7B mỗi cái). Router chọn top-2 → 14B expert params active. Cộng attention + embedding (shared) ≈ 13B total active. Kết quả: chất lượng gần model 47B dense, compute chỉ bằng model 13B!",
    },
    {
      question: "Load balancing loss trong MoE giải quyết vấn đề gì?",
      options: [
        "Cân bằng tải GPU giữa các server",
        "Ngăn router gửi MỌI token đến 1-2 expert 'giỏi nhất', ép phân phối đều để TẤT CẢ expert đều được dùng",
        "Giảm loss function cho từng expert",
      ],
      correct: 1,
      explanation: "Không có load balancing, router tendency gửi token đến expert 'dễ' nhất → expert đó overfit, expert khác under-trained → collapse. Load balancing loss phạt phân phối không đều: L_balance = N * sum(fraction_i * probability_i).",
    },
    {
      question: "MoE cần nhiều VRAM hơn dense model cùng compute. Tại sao?",
      options: [
        "Router network rất lớn",
        "Phải load TẤT CẢ expert weights vào VRAM dù chỉ dùng 2/8 per token",
        "KV cache lớn hơn",
      ],
      correct: 1,
      explanation: "Mixtral 8x7B: 47B params tất cả phải nằm trong VRAM (≈94GB FP16). Dense model 13B chỉ cần 26GB. MoE trade-off: compute = 13B dense nhưng memory = 47B. Đây là bottleneck chính khi serving MoE trên consumer GPU.",
    },
    {
      type: "fill-blank",
      question: "Trong kiến trúc MoE, mỗi mạng con chuyên biệt được gọi là một {blank}, và mạng chọn ra những mạng nào được kích hoạt cho mỗi token được gọi là {blank} (hay gating network).",
      blanks: [
        { answer: "expert", accept: ["Expert", "chuyên gia"] },
        { answer: "router", accept: ["Router", "gate", "Gate"] },
      ],
      explanation: "MoE gồm nhiều expert (chuyên gia) và một router (gating network) chọn top-K expert phù hợp nhất với input. Trong Mixtral 8x7B, router chọn 2 trong 8 expert cho mỗi token.",
    },
  ], []);

  return (
    <>
      {/* STEP 1: PREDICTION GATE */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn muốn model có kiến thức rộng (nhiều tham số) nhưng inference nhanh (ít compute). Hai mục tiêu mâu thuẫn — có cách nào được cả hai?"
          options={[
            "Không thể — nhiều tham số = nhiều compute, đó là quy luật",
            "Dùng Mixture of Experts: nhiều tham số tổng nhưng chỉ kích hoạt 2/8 expert mỗi token",
            "Giảm kích thước model xuống nhỏ nhất có thể",
          ]}
          correct={1}
          explanation="MoE phá vỡ trade-off truyền thống! Giống bệnh viện 100 bác sĩ chuyên khoa — khi bệnh nhân đến, chỉ 2-3 bác sĩ phù hợp khám. Bệnh viện có nhiều chuyên gia (kiến thức rộng) nhưng chi phí mỗi lần khám thấp."
        >

      {/* STEP 2: INTERACTIVE VIZ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Chọn <strong className="text-foreground">câu hỏi khác nhau</strong>{" "}
          để xem router kích hoạt experts nào và với trọng số bao nhiêu.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {QUERIES.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setQueryIdx(i)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    queryIdx === i
                      ? "bg-accent text-white"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                >
                  {q.text.slice(0, 25)}...
                </button>
              ))}
            </div>

            <svg viewBox="0 0 600 230" className="w-full max-w-2xl mx-auto">
              {/* Input query */}
              <rect x={180} y={5} width={240} height={28} rx={6} fill="#1e293b" stroke="#475569" strokeWidth={1} />
              <text x={300} y={23} textAnchor="middle" fill="#e2e8f0" fontSize={8}>
                {query.text.slice(0, 35)}...
              </text>

              {/* Router */}
              <rect x={230} y={45} width={140} height={30} rx={8} fill="#f59e0b" />
              <text x={300} y={64} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">
                Router (Gating)
              </text>
              <line x1={300} y1={33} x2={300} y2={45} stroke="#475569" strokeWidth={1.5} />

              {/* Experts */}
              {EXPERTS.map((e, i) => {
                const x = 45 + i * 70;
                const isActive = query.activeExperts.includes(e.id);
                const weightIdx = query.activeExperts.indexOf(e.id);
                const weight = weightIdx >= 0 ? query.weights[weightIdx] : 0;
                return (
                  <g key={i}>
                    <line x1={300} y1={75} x2={x} y2={100}
                      stroke={isActive ? e.color : "#475569"}
                      strokeWidth={isActive ? 2.5 : 0.5}
                      opacity={isActive ? 1 : 0.15}
                    />
                    <rect x={x - 30} y={100} width={60} height={40} rx={6}
                      fill={isActive ? e.color : "#1e293b"}
                      stroke={e.color}
                      strokeWidth={isActive ? 2 : 0.5}
                      opacity={isActive ? 1 : 0.2}
                    />
                    <text x={x} y={118} textAnchor="middle" fill="white" fontSize={7} fontWeight="bold">
                      {e.label}
                    </text>
                    {isActive && (
                      <text x={x} y={133} textAnchor="middle" fill="white" fontSize={8}>
                        {(weight * 100).toFixed(0)}%
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Output merge */}
              {query.activeExperts.map((eid) => {
                const x = 45 + eid * 70;
                return (
                  <line key={eid} x1={x} y1={140} x2={300} y2={165} stroke={EXPERTS[eid].color} strokeWidth={2} />
                );
              })}
              <rect x={230} y={165} width={140} height={28} rx={6} fill="#22c55e" opacity={0.2} stroke="#22c55e" strokeWidth={1.5} />
              <text x={300} y={183} textAnchor="middle" fill="#22c55e" fontSize={9} fontWeight="bold">
                Output (weighted sum)
              </text>

              {/* Info */}
              <text x={300} y={215} textAnchor="middle" fill="#94a3b8" fontSize={9}>
                Top-2 routing: chỉ {query.activeExperts.length}/{EXPERTS.length} experts active | Compute = 2/8 = 25% tổng params
              </text>
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* STEP 3: AHA */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            MoE phá vỡ quy luật &quot;nhiều tham số = nhiều compute&quot;.
            Mixtral 8x7B: <strong>47B tham số</strong>{" "}(kiến thức rộng) nhưng mỗi token chỉ kích hoạt <strong>13B</strong>{" "}
            (compute thấp). Kết quả: chất lượng gần GPT-3.5, chi phí chạy bằng model 13B.
            Giống bệnh viện 100 bác sĩ — mỗi lần khám chỉ tốn chi phí 2 bác sĩ!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* STEP 4: CHALLENGE */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Mixtral 8x7B (47B params) cần bao nhiêu VRAM FP16 để serving? GPU A100 80GB, cần mấy GPU?"
          options={[
            "26GB (chỉ 13B active) → 1 GPU A100 đủ",
            "94GB (toàn bộ 47B x 2 bytes) → cần 2 GPU A100",
            "376GB (47B x 8 bytes FP32) → cần 5 GPU",
          ]}
          correct={1}
          explanation="Phải load TẤT CẢ 47B params vào VRAM (router cần truy cập bất kỳ expert nào). 47B x 2 bytes FP16 = 94GB > 80GB 1 GPU. Cần 2 GPU A100. Đây là trade-off chính của MoE: compute thấp nhưng MEMORY cao. Quantization (INT4) giảm còn 24GB → vừa 1 GPU!"
        />
      </LessonSection>

      {/* STEP 5: EXPLANATION */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Mixture of Experts (MoE)</strong>{" "}
            là kiến trúc sparse thường thay thế lớp FFN trong <TopicLink slug="transformer">Transformer</TopicLink>: nhiều expert networks nhưng chỉ kích hoạt subset nhỏ cho mỗi input. Đạt chất lượng model lớn với compute model nhỏ, giúp vượt qua giới hạn của <TopicLink slug="scaling-laws">scaling laws</TopicLink>{" "}truyền thống.
          </p>

          <p><strong>Cấu trúc MoE layer:</strong></p>
          <LaTeX block>{"\\text{Output} = \\sum_{i=1}^{K} g_i(x) \\cdot E_i(x), \\quad K = \\text{top-}k \\text{ experts}"}</LaTeX>
          <p>
            Trong đó <LaTeX>{"g_i(x)"}</LaTeX> là trọng số từ router, <LaTeX>{"E_i(x)"}</LaTeX> là output của expert thứ i.
          </p>

          <p><strong>Router (Gating Network):</strong></p>
          <LaTeX block>{"g(x) = \\text{TopK}(\\text{Softmax}(W_{\\text{gate}} \\cdot x), k)"}</LaTeX>
          <p>
            Router là linear layer nhỏ. Input: hidden state. Output: probability distribution trên N experts.
            Chọn top-K (thường K=2).
          </p>

          <p><strong>Load Balancing Loss:</strong></p>
          <LaTeX block>{"\\mathcal{L}_{\\text{balance}} = N \\cdot \\sum_{i=1}^{N} f_i \\cdot p_i"}</LaTeX>
          <p>
            <LaTeX>{"f_i"}</LaTeX> = fraction tokens gửi đến expert i, <LaTeX>{"p_i"}</LaTeX> = average routing probability.
            Phạt phân phối không đều → ép dùng tất cả experts.
          </p>

          <Callout variant="tip" title="Expert Parallelism">
            MoE serving cần strategy riêng: Expert Parallelism — mỗi GPU hold subset experts. Token được route đến đúng GPU chứa expert đó. Cần all-to-all communication — bottleneck chính trên cluster lớn.
          </Callout>

          <CodeBlock language="python" title="Serving MoE model với vLLM">
{`from vllm import LLM, SamplingParams

# Mixtral 8x7B — vLLM tự xử lý expert routing
llm = LLM(
    model="mistralai/Mixtral-8x7B-Instruct-v0.1",
    tensor_parallel_size=2,  # 2 GPU (47B FP16 = 94GB)
    max_model_len=32768,
    gpu_memory_utilization=0.9,
    # vLLM auto: expert parallelism, continuous batching
)

# Inference — user không cần biết MoE internals
params = SamplingParams(temperature=0.7, max_tokens=512)
output = llm.generate(["Giải thích MoE cho sinh viên Việt Nam"], params)

# Benchmark Mixtral 8x7B:
# - Quality ≈ GPT-3.5 Turbo (MMLU 70.6%)
# - Throughput: 2x model 47B dense (vì chỉ compute 13B)
# - VRAM: 94GB FP16 → 24GB INT4 (1 GPU A100)`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      {/* STEP 6: SUMMARY */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "MoE = nhiều expert chuyên biệt, router chọn top-K (thường 2) cho mỗi token.",
          "Phá vỡ trade-off: 47B params (kiến thức rộng) nhưng compute chỉ 13B (inference nhanh).",
          "Router = linear layer nhỏ, quyết định expert nào xử lý token nào dựa trên hidden state.",
          "Load balancing loss ép dùng tất cả experts đều — tránh expert collapse.",
          "Trade-off: compute thấp nhưng MEMORY cao (phải load tất cả experts). Quantization giải quyết.",
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
