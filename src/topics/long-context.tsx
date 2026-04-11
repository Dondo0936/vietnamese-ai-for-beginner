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
  slug: "long-context",
  title: "Long Context",
  titleVi: "Ngu canh dai — AI doc ca cuon sach",
  description:
    "Kha nang mo hinh xu ly hang tram nghin den hang trieu token trong mot lan, cho phep phan tich tai lieu dai.",
  category: "emerging",
  tags: ["long-context", "context-window", "retrieval", "attention"],
  difficulty: "intermediate",
  relatedSlugs: ["state-space-models", "reasoning-models", "inference-optimization"],
  vizType: "interactive",
};

const MODELS = [
  { name: "GPT-3.5 (2023)", context: 4096, pages: 5, color: "#64748b" },
  { name: "GPT-4 Turbo", context: 128000, pages: 160, color: "#3b82f6" },
  { name: "Claude 3.5 Sonnet", context: 200000, pages: 250, color: "#8b5cf6" },
  { name: "Gemini 1.5 Pro", context: 1000000, pages: 1250, color: "#22c55e" },
  { name: "Claude (2025)", context: 1000000, pages: 1250, color: "#f59e0b" },
];

const TOTAL_STEPS = 7;

export default function LongContextTopic() {
  const [activeModel, setActiveModel] = useState(2);

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Tai sao KV cache la bottleneck chinh cua long context?",
      options: [
        "KV cache lam cham CPU",
        "KV cache tang tuyen tinh theo context length: 1M tokens co the can 50-100GB VRAM chi cho cache",
        "KV cache lam model khong chinh xac",
      ],
      correct: 1,
      explanation: "KV cache = 2 x layers x heads x d_head x seq_len x bytes. Voi Llama 70B, 1M tokens: KV cache ~ 80GB VRAM — hon ca model weights! PagedAttention, GQA, quantized KV giam duoc 4-8x nhung van la bottleneck chinh.",
    },
    {
      question: "'Lost in the middle' problem la gi?",
      options: [
        "Model quen thong tin o GIUA context dai — nho tot dau va cuoi, quen giua",
        "Model mat context khi context qua dai",
        "Token o giua bi xoa de tiet kiem memory",
      ],
      correct: 0,
      explanation: "Nghien cuu (Liu et al. 2023) chi ra: model nho tot thong tin o dau va cuoi context, nhung accuracy giam 20-30% cho thong tin nam o giua. Khi context 100K+, van de nay nghiem trong hon. Giai phap: document ordering, chunked retrieval.",
    },
    {
      question: "Khi nao nen dung RAG thay vi long context?",
      options: [
        "Luon dung long context vi don gian hon",
        "Khi corpus > 10M tokens, can freshness, hoac can chi phi thap cho nhieu queries tren cung corpus",
        "Khi corpus nho hon 1000 tokens",
      ],
      correct: 1,
      explanation: "Long context: don gian, khong can index, tot cho 1 tai lieu. RAG: scale toi hang ty documents, chi phi per-query thap (chi lay top-K chunks), freshness (update index khong can re-process). Rule of thumb: < 200K tokens → long context. > 1M → RAG. O giua → tuy use case.",
    },
  ], []);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Du doan">
        <PredictionGate
          question="Ban can AI phan tich hop dong 500 trang (250K tokens) de tim dieu khoan bat loi. Cach nao hieu qua nhat?"
          options={[
            "Cat nho thanh 100 phan, hoi AI tung phan mot",
            "Cho toan bo 500 trang vao context window cua model ho tro 1M tokens",
            "Doc thu cong — AI khong xu ly duoc tai lieu dai",
          ]}
          correct={1}
          explanation="Long context models (Claude, Gemini) doc ca 500 trang trong 1 lan — hieu toan canh, khong bi mat context giua cac phan. Giong doc nguyen cuon sach thay vi doc tung trang roi. Dieu khoan o trang 3 lien quan den trang 487? Long context bat duoc!"
        >

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Kham pha">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          So sanh <strong className="text-foreground">context window</strong>{" "}
          cua cac model — tu 4K tokens den 1M tokens.
        </p>
        <VisualizationSection>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {MODELS.map((m, i) => (
                <button key={i} onClick={() => setActiveModel(i)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${activeModel === i ? "bg-accent text-white" : "bg-card border border-border text-muted hover:text-foreground"}`}
                >{m.name}</button>
              ))}
            </div>
            <svg viewBox="0 0 600 170" className="w-full max-w-2xl mx-auto">
              {MODELS.map((m, i) => {
                const y = 10 + i * 30;
                const barW = Math.max(3, (Math.log10(m.context) / Math.log10(1000000)) * 380);
                const isActive = i === activeModel;
                return (
                  <g key={i}>
                    <text x={15} y={y + 16} fill={isActive ? "#e2e8f0" : "#64748b"} fontSize={8} fontWeight={isActive ? "bold" : "normal"}>
                      {m.name}
                    </text>
                    <rect x={140} y={y} width={380} height={22} rx={3} fill="#1e293b" />
                    <rect x={140} y={y} width={barW} height={22} rx={3} fill={m.color} opacity={isActive ? 1 : 0.3} />
                    <text x={145 + barW} y={y + 15} fill="white" fontSize={8} fontWeight="bold">
                      {m.context >= 1000000 ? "1M" : `${(m.context / 1000).toFixed(0)}K`}
                    </text>
                    <text x={555} y={y + 15} fill="#94a3b8" fontSize={7}>~{m.pages} trang</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoanh khac Aha">
        <AhaMoment>
          <p>
            Tu 4K tokens (5 trang) den 1M tokens (1250 trang) chi trong 2 nam!
            Nhu tu doc <strong>1 bai bao</strong>{" "}sang doc <strong>ca cuon tieu thuyet</strong>{" "}
            trong 1 lan. Long context khong chi la &quot;nhieu hon&quot; — no cho phep <strong>hieu toan canh</strong>{" "}
            thay vi ghep nhieu manh nho.
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thu thach">
        <InlineChallenge
          question="KV cache cua Llama 70B voi 1M tokens context mat khoang 80GB VRAM. Model weights FP16 = 140GB. Tong can bao nhieu GPU A100 (80GB)?"
          options={[
            "2 GPU (140GB weights)",
            "3 GPU (220GB tong = weights + KV cache)",
            "1 GPU neu dung quantization",
          ]}
          correct={1}
          explanation="Weights 140GB + KV cache 80GB = 220GB. A100 80GB → can 3 GPU minimum. KV cache la 'chi phi an' cua long context — tang tuyen tinh voi seq_len. Giai phap: GQA giam KV 4-8x, quantized KV cache (INT8), PagedAttention giam fragmentation."
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Ly thuyet">
        <ExplanationSection>
          <p>
            <strong>Long Context</strong>{" "}
            la kha nang model xu ly hang tram nghin den hang trieu tokens trong 1 lan — cho phep phan tich tai lieu dai, codebase, video.
          </p>
          <p><strong>Attention complexity:</strong></p>
          <LaTeX block>{"\\text{Attention FLOPs} = O(N^2 \\cdot d) \\quad \\text{KV Cache} = O(N \\cdot d \\cdot L)"}</LaTeX>
          <p><strong>Ky thuat mo rong context:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>RoPE scaling:</strong>{" "}Noi suy vi tri tuong doi, mo rong tu 4K → 128K+ khong can retrain</li>
            <li><strong>Flash Attention:</strong>{" "}Giam memory tu O(N^2) xuong O(N) bang tiling</li>
            <li><strong>GQA (Grouped Query Attention):</strong>{" "}Giam KV heads 4-8x, giam KV cache tuong ung</li>
            <li><strong>Ring Attention:</strong>{" "}Phan phoi sequence qua nhieu GPU, overlap compute va communication</li>
          </ul>

          <Callout variant="tip" title="Long context vs RAG">
            Long context: don gian (dump all docs), tot cho reasoning across documents. RAG: scale tot hon (ty documents), chi phi per-query thap, freshness. Hybrid: RAG chon top-50 documents → long context xu ly toan bo.
          </Callout>

          <LaTeX block>{"\\text{KV Cache} = 2 \\times n_{\\text{layers}} \\times n_{\\text{kv\\_heads}} \\times d_{\\text{head}} \\times N \\times \\text{bytes}"}</LaTeX>

          <CodeBlock language="python" title="Long context analysis voi Claude">
{`import anthropic

client = anthropic.Anthropic()

# Doc toan bo tai lieu 500 trang
with open("contract_500_pages.txt") as f:
    full_document = f.read()  # ~250K tokens

response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=4096,
    messages=[{
        "role": "user",
        "content": f"""Phan tich hop dong sau va liet ke:
1. Cac dieu khoan bat loi cho ben mua
2. Cac mau thuan giua cac dieu khoan
3. Cac rui ro phap ly tiem an

Hop dong:
{full_document}"""
    }],
)
# Model doc toan bo 500 trang, hieu cross-references
# giua trang 3 va trang 487`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tom tat">
        <MiniSummary points={[
          "Long context: tu 4K (2023) den 1M tokens (2025) — doc ca cuon sach trong 1 lan.",
          "KV cache la bottleneck chinh: tang tuyen tinh voi seq_len, co the > model weights.",
          "Ky thuat: RoPE scaling, Flash Attention, GQA, Ring Attention giam chi phi O(N^2).",
          "'Lost in the middle': model nho tot dau/cuoi, quen giua. Can document ordering strategy.",
          "Long context vs RAG: complementary. Long context cho reasoning, RAG cho scale va freshness.",
        ]} />
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiem tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>

        </PredictionGate>
      </LessonSection>
    </>
  );
}
