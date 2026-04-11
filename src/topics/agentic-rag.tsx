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
  slug: "agentic-rag",
  title: "Agentic RAG",
  titleVi: "RAG tăng cường với Agent",
  description:
    "Kết hợp RAG với AI Agent để tự quyết định khi nào truy xuất, xác minh và tổng hợp thông tin",
  category: "emerging",
  tags: ["rag", "agent", "adaptive-retrieval"],
  difficulty: "intermediate",
  relatedSlugs: ["rag", "agent-architecture", "react-framework"],
  vizType: "interactive",
};

const TOTAL_STEPS = 7;

export default function AgenticRAGTopic() {
  const [mode, setMode] = useState<"basic" | "agentic">("basic");

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Agentic RAG khác Basic RAG ở điểm nào?",
      options: [
        "Dùng model lớn hơn",
        "Agent TỰ QUYẾT ĐỊNH: có cần retrieve không, retrieve từ đâu, bao nhiêu lần, có cần verify không",
        "Dùng vector database tốt hơn",
      ],
      correct: 1,
      explanation: "Basic RAG: luôn retrieve → generate (1 bước cố định). Agentic RAG: agent đánh giá câu hỏi → quyết định có cần retrieve? → retrieve từ nguồn nào? → kết quả đủ tốt? → cần retrieve thêm? → verify thông tin? Linh hoạt và chính xác hơn nhiều.",
    },
    {
      question: "Khi nào Agentic RAG quyết định KHÔNG retrieve?",
      options: [
        "Không bao giờ — luôn retrieve để an toàn",
        "Khi câu hỏi thuộc kiến thức chung mà model đã biết (ví dụ: '1+1=?'), retrieve sẽ lãng phí và có thể gây nhiễu",
        "Khi database trống",
      ],
      correct: 1,
      explanation: "Adaptive retrieval: câu hỏi kiến thức chung → trả lời trực tiếp (nhanh, rẻ). Câu hỏi cần thông tin cụ thể → retrieve. Câu hỏi phức tạp → multi-step retrieve. Không phải mọi câu đều cần retrieve — giống không cần tra Google cho '1+1=?'.",
    },
    {
      question: "Self-RAG technique hoạt động thế nào?",
      options: [
        "Model tự đánh giá: (1) có cần retrieve? (2) retrieved docs có relevance? (3) response có supported by docs?",
        "Model tự tạo database riêng",
        "Model retrieve từ chính output của mình",
      ],
      correct: 0,
      explanation: "Self-RAG (Asai et al. 2023): model tự sinh 'reflection tokens' để tự đánh giá từng bước. [Retrieve]: có cần retrieve? [ISREL]: doc có relevant? [ISSUP]: answer có được support? [ISUSE]: answer có hữu ích? Mỗi bước có quyết định → kết quả chính xác hơn.",
    },
  ], []);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Chatbot công ty bạn dùng Basic RAG. User hỏi 'Chính sách nghỉ phép năm 2025 là gì?' — RAG trả về document 2024 (chưa update). Chatbot trả lời sai. Giải pháp?"
          options={[
            "Update document thường xuyên hơn",
            "Dùng Agentic RAG: agent kiểm tra document date, nhận biết outdated, tự động tìm document mới hơn hoặc báo cho user",
            "Thay đổi LLM mạnh hơn",
          ]}
          correct={1}
          explanation="Agentic RAG thông minh hơn: kiểm tra metadata (date, version), cross-check nhiều nguồn, tự nhận biết 'document này từ 2024, câu hỏi về 2025 — có thể outdated'. Agent tự quyết định: retrieve thêm, cảnh báo user, hoặc từ chối trả lời thay vì đưa thông tin sai."
        >

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          So sánh <strong className="text-foreground">Basic RAG vs Agentic RAG</strong>{" "}
          — từ pipeline cố định sang agent linh hoạt.
        </p>
        <VisualizationSection>
          <div className="space-y-4">
            <div className="flex gap-3 justify-center">
              <button onClick={() => setMode("basic")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${mode === "basic" ? "bg-blue-600 text-white" : "bg-card border border-border text-muted"}`}
              >Basic RAG</button>
              <button onClick={() => setMode("agentic")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${mode === "agentic" ? "bg-purple-600 text-white" : "bg-card border border-border text-muted"}`}
              >Agentic RAG</button>
            </div>
            <svg viewBox="0 0 600 180" className="w-full max-w-2xl mx-auto">
              {mode === "basic" ? (
                <>
                  {["Query", "Retrieve", "Generate"].map((step, i) => {
                    const x = 80 + i * 200;
                    return (
                      <g key={i}>
                        <rect x={x - 55} y={50} width={110} height={40} rx={8} fill="#3b82f6" />
                        <text x={x} y={75} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">{step}</text>
                        {i < 2 && <text x={x + 80} y={75} fill="#94a3b8" fontSize={16}>→</text>}
                      </g>
                    );
                  })}
                  <text x={300} y={130} textAnchor="middle" fill="#94a3b8" fontSize={10}>Pipeline cố định: luôn retrieve 1 lần → generate</text>
                  <text x={300} y={150} textAnchor="middle" fill="#ef4444" fontSize={9}>Vấn đề: không verify, không retry, không adaptive</text>
                </>
              ) : (
                <>
                  {[
                    { label: "Query", color: "#3b82f6", x: 60 },
                    { label: "Plan", color: "#8b5cf6", x: 160 },
                    { label: "Retrieve", color: "#f59e0b", x: 260 },
                    { label: "Verify", color: "#ef4444", x: 360 },
                    { label: "Synthesize", color: "#22c55e", x: 480 },
                  ].map((step, i) => (
                    <g key={i}>
                      <rect x={step.x - 45} y={40} width={90} height={35} rx={8} fill={step.color} />
                      <text x={step.x} y={62} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">{step.label}</text>
                      {i < 4 && <text x={step.x + 55} y={62} fill="#94a3b8" fontSize={14}>→</text>}
                    </g>
                  ))}
                  <path d="M 360 75 C 360 110, 260 110, 260 75" fill="none" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4,3" />
                  <text x={310} y={120} textAnchor="middle" fill="#f59e0b" fontSize={8}>Retry nếu không đủ tốt</text>
                  <text x={300} y={145} textAnchor="middle" fill="#22c55e" fontSize={10}>Agent tự quyết định mỗi bước — adaptive và self-correcting</text>
                  <text x={300} y={165} textAnchor="middle" fill="#94a3b8" fontSize={9}>Có thể skip retrieve, multi-source, verify before answer</text>
                </>
              )}
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Basic RAG giống <strong>máy tra cứu tự động</strong>{" "}— luôn tìm, luôn trả.
            Agentic RAG giống <strong>nhà nghiên cứu thông minh</strong>{" "}— suy nghĩ trước khi tìm,
            kiểm tra nguồn, cross-check, và biết nói 'tôi không chắc chắn' khi thông tin không đủ.
            Bước nhảy từ 'retrieve and read' sang <strong>'think, retrieve, verify, synthesize'</strong>.
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="User hỏi: 'So sánh doanh thu Q3 2024 của FPT và Viettel.' Basic RAG retrieve 2 documents riêng. Nhưng 2 docs dùng đơn vị khác nhau (triệu vs tỷ VND). Agentic RAG xử lý thế nào?"
          options={[
            "Trả về 2 con số và để user tự so sánh",
            "Agent nhận biết đơn vị khác nhau, tự chuyển đổi, cross-check với nguồn thứ 3, trả về so sánh chuẩn hoá",
            "Báo lỗi vì data không tương thích",
          ]}
          correct={1}
          explanation="Agentic RAG: (1) retrieve FPT doc + Viettel doc, (2) nhận biết đơn vị khác nhau, (3) chuyển đổi về cùng đơn vị, (4) cross-check với báo cáo tổng hợp, (5) trả về bảng so sánh chuẩn hoá + ghi chú nguồn. Multi-step reasoning + tool use!"
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Agentic RAG</strong>{" "}
            kết hợp RAG với AI Agent — agent tự quyết định khi nào retrieve, từ nguồn nào, bao nhiêu lần, và có cần verify không.
          </p>
          <p><strong>4 khả năng cốt lõi:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Adaptive Retrieval:</strong>{" "}Quyết định CÓ CẦN retrieve hay không (skip cho câu đơn giản)</li>
            <li><strong>Multi-source:</strong>{" "}Retrieve từ nhiều nguồn: vector DB, SQL, web search, API</li>
            <li><strong>Self-reflection:</strong>{" "}Tự đánh giá: retrieved docs có relevant? answer có supported?</li>
            <li><strong>Iterative refinement:</strong>{" "}Không đủ tốt → reformulate query → retrieve lại</li>
          </ul>

          <Callout variant="tip" title="CRAG - Corrective RAG">
            CRAG (Yan et al. 2024): sau khi retrieve, evaluator đánh giá relevance. Correct → dùng. Ambiguous → web search bổ sung. Incorrect → bỏ retrieved docs, dùng web search thay thế. Kết quả: +15% accuracy so với basic RAG.
          </Callout>

          <CodeBlock language="python" title="Agentic RAG với tool use">
{`import anthropic

client = anthropic.Anthropic()

tools = [
    {
        "name": "search_docs",
        "description": "Tìm tài liệu trong knowledge base",
        "input_schema": {"type": "object", "properties": {
            "query": {"type": "string"},
            "source": {"type": "string", "enum": ["internal", "web", "database"]},
        }},
    },
    {
        "name": "verify_fact",
        "description": "Verify thông tin với nguồn thứ 3",
        "input_schema": {"type": "object", "properties": {
            "claim": {"type": "string"},
        }},
    },
]

# Agent tự quyết định: cần retrieve? từ nguồn nào? cần verify?
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=4096,
    tools=tools,
    messages=[{
        "role": "user",
        "content": "So sánh chính sách nghỉ phép của FPT và VNG năm 2025"
    }],
)
# Agent có thể:
# 1. search_docs("chính sách nghỉ phép FPT 2025", "internal")
# 2. search_docs("chính sách nghỉ phép VNG 2025", "internal")
# 3. verify_fact("FPT cho 15 ngày nghỉ phép/năm")
# 4. Synthesize và so sánh`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "Agentic RAG: agent TỰ QUYẾT ĐỊNH retrieve hay không, từ nguồn nào, bao nhiêu lần, có verify không.",
          "4 khả năng: Adaptive Retrieval, Multi-source, Self-reflection, Iterative Refinement.",
          "CRAG: evaluator đánh giá relevance sau retrieve — correct/ambiguous/incorrect → hành động khác nhau.",
          "Self-RAG: model tự sinh reflection tokens để tự đánh giá từng bước.",
          "Từ 'máy tra cứu' sang 'nhà nghiên cứu': suy nghĩ, tìm, kiểm tra, tổng hợp — chính xác hơn 15-30%.",
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
