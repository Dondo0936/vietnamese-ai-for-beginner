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
  slug: "long-context",
  title: "Long Context",
  titleVi: "Ngữ cảnh dài — AI đọc cả cuốn sách",
  description:
    "Khả năng mô hình xử lý hàng trăm nghìn đến hàng triệu token trong một lần, cho phép phân tích tài liệu dài.",
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
      question: "Tại sao KV cache là bottleneck chính của long context?",
      options: [
        "KV cache làm chậm CPU",
        "KV cache tăng tuyến tính theo context length: 1M tokens có thể cần 50-100GB VRAM chỉ cho cache",
        "KV cache làm model không chính xác",
      ],
      correct: 1,
      explanation: "KV cache = 2 x layers x heads x d_head x seq_len x bytes. Với Llama 70B, 1M tokens: KV cache ~ 80GB VRAM — hơn cả model weights! PagedAttention, GQA, quantized KV giảm được 4-8x nhưng vẫn là bottleneck chính.",
    },
    {
      question: "'Lost in the middle' problem là gì?",
      options: [
        "Model quên thông tin ở GIỮA context dài — nhớ tốt đầu và cuối, quên giữa",
        "Model mất context khi context quá dài",
        "Token ở giữa bị xoá để tiết kiệm memory",
      ],
      correct: 0,
      explanation: "Nghiên cứu (Liu et al. 2023) chỉ ra: model nhớ tốt thông tin ở đầu và cuối context, nhưng accuracy giảm 20-30% cho thông tin nằm ở giữa. Khi context 100K+, vấn đề này nghiêm trọng hơn. Giải pháp: document ordering, chunked retrieval.",
    },
    {
      question: "Khi nào nên dùng RAG thay vì long context?",
      options: [
        "Luôn dùng long context vì đơn giản hơn",
        "Khi corpus > 10M tokens, cần freshness, hoặc cần chi phí thấp cho nhiều queries trên cùng corpus",
        "Khi corpus nhỏ hơn 1000 tokens",
      ],
      correct: 1,
      explanation: "Long context: đơn giản, không cần index, tốt cho 1 tài liệu. RAG: scale tới hàng tỷ documents, chi phí per-query thấp (chỉ lấy top-K chunks), freshness (update index không cần re-process). Rule of thumb: < 200K tokens → long context. > 1M → RAG. Ở giữa → tuỳ use case.",
    },
    {
      type: "fill-blank",
      question: "Các model long context như Gemini 1.5 có thể xử lý tới {blank} tokens, nhưng chi phí attention vẫn tăng theo {blank} với độ dài chuỗi.",
      blanks: [
        { answer: "1 million", accept: ["1m", "1,000,000", "1 triệu", "million tokens", "một triệu"] },
        { answer: "O(N^2)", accept: ["quadratic", "n^2", "bình phương"] },
      ],
      explanation: "Gemini 1.5 Pro và Claude (2025) hỗ trợ 1 million tokens context. Tuy nhiên, self-attention vẫn có complexity O(N^2), khiến KV cache và FLOPs trở thành bottleneck — đây là lý do cần Flash Attention, GQA, state-space models.",
    },
  ], []);

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
          So sánh <strong className="text-foreground">context window</strong>{" "}
          của các model — từ 4K tokens đến 1M tokens.
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

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Từ 4K tokens (5 trang) đến 1M tokens (1250 trang) chỉ trong 2 năm!
            Như từ đọc <strong>1 bài báo</strong>{" "}sang đọc <strong>cả cuốn tiểu thuyết</strong>{" "}
            trong 1 lần. Long context không chỉ là 'nhiều hơn' — nó cho phép <strong>hiểu toàn cảnh</strong>{" "}
            thay vì ghép nhiều mảnh nhỏ.
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
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
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Long Context</strong>{" "}
            là khả năng model xử lý hàng trăm nghìn đến hàng triệu tokens trong 1 lần — cho phép phân tích tài liệu dài, codebase, video. Khái niệm mở rộng của{" "}
            <TopicLink slug="context-window">context window</TopicLink>{" "}
            truyền thống, thường đi kèm kiến trúc thay thế như{" "}
            <TopicLink slug="state-space-models">state-space models</TopicLink>{" "}
            và tối ưu{" "}
            <TopicLink slug="kv-cache">KV cache</TopicLink>{" "}
            để kiểm soát chi phí bộ nhớ.
          </p>
          <p><strong>Attention complexity:</strong></p>
          <LaTeX block>{"\\text{Attention FLOPs} = O(N^2 \\cdot d) \\quad \\text{KV Cache} = O(N \\cdot d \\cdot L)"}</LaTeX>
          <p><strong>Kỹ thuật mở rộng context:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>RoPE scaling:</strong>{" "}Nội suy vị trí tương đối, mở rộng từ 4K → 128K+ không cần retrain</li>
            <li><strong>Flash Attention:</strong>{" "}Giảm memory từ O(N^2) xuống O(N) bằng tiling</li>
            <li><strong>GQA (Grouped Query Attention):</strong>{" "}Giảm KV heads 4-8x, giảm KV cache tương ứng</li>
            <li><strong>Ring Attention:</strong>{" "}Phân phối sequence qua nhiều GPU, overlap compute và communication</li>
          </ul>

          <Callout variant="tip" title="Long context vs RAG">
            Long context: đơn giản (dump all docs), tốt cho reasoning across documents. RAG: scale tốt hơn (tỷ documents), chi phí per-query thấp, freshness. Hybrid: RAG chọn top-50 documents → long context xử lý toàn bộ.
          </Callout>

          <LaTeX block>{"\\text{KV Cache} = 2 \\times n_{\\text{layers}} \\times n_{\\text{kv\\_heads}} \\times d_{\\text{head}} \\times N \\times \\text{bytes}"}</LaTeX>

          <CodeBlock language="python" title="Long context analysis với Claude">
{`import anthropic

client = anthropic.Anthropic()

# Đọc toàn bộ tài liệu 500 trang
with open("contract_500_pages.txt") as f:
    full_document = f.read()  # ~250K tokens

response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=4096,
    messages=[{
        "role": "user",
        "content": f"""Phân tích hợp đồng sau và liệt kê:
1. Các điều khoản bất lợi cho bên mua
2. Các mâu thuẫn giữa các điều khoản
3. Các rủi ro pháp lý tiềm ẩn

Hợp đồng:
{full_document}"""
    }],
)
# Model đọc toàn bộ 500 trang, hiểu cross-references
# giữa trang 3 và trang 487`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "Long context: từ 4K (2023) đến 1M tokens (2025) — đọc cả cuốn sách trong 1 lần.",
          "KV cache là bottleneck chính: tăng tuyến tính với seq_len, có thể > model weights.",
          "Kỹ thuật: RoPE scaling, Flash Attention, GQA, Ring Attention giảm chi phí O(N^2).",
          "'Lost in the middle': model nhớ tốt đầu/cuối, quên giữa. Cần document ordering strategy.",
          "Long context vs RAG: complementary. Long context cho reasoning, RAG cho scale và freshness.",
        ]} />
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>

        </PredictionGate>
      </LessonSection>
    </>
  );
}
