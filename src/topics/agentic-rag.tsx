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
  titleVi: "RAG tang cuong voi Agent",
  description:
    "Ket hop RAG voi AI Agent de tu quyet dinh khi nao truy xuat, xac minh va tong hop thong tin",
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
      question: "Agentic RAG khac Basic RAG o diem nao?",
      options: [
        "Dung model lon hon",
        "Agent TU QUYET DINH: co can retrieve khong, retrieve tu dau, bao nhieu lan, co can verify khong",
        "Dung vector database tot hon",
      ],
      correct: 1,
      explanation: "Basic RAG: luon retrieve → generate (1 buoc co dinh). Agentic RAG: agent danh gia cau hoi → quyet dinh co can retrieve? → retrieve tu nguon nao? → ket qua du tot? → can retrieve them? → verify thong tin? Linh hoat va chinh xac hon nhieu.",
    },
    {
      question: "Khi nao Agentic RAG quyet dinh KHONG retrieve?",
      options: [
        "Khong bao gio — luon retrieve de an toan",
        "Khi cau hoi thuoc kien thuc chung ma model da biet (vi du: '1+1=?'), retrieve se lang phi va co the gay nhieu",
        "Khi database trong",
      ],
      correct: 1,
      explanation: "Adaptive retrieval: cau hoi kien thuc chung → tra loi truc tiep (nhanh, re). Cau hoi can thong tin cu the → retrieve. Cau hoi phuc tap → multi-step retrieve. Khong phai moi cau deu can retrieve — giong khong can tra Google cho '1+1=?'.",
    },
    {
      question: "Self-RAG technique hoat dong the nao?",
      options: [
        "Model tu danh gia: (1) co can retrieve? (2) retrieved docs co relevance? (3) response co supported by docs?",
        "Model tu tao database rieng",
        "Model retrieve tu chinh output cua minh",
      ],
      correct: 0,
      explanation: "Self-RAG (Asai et al. 2023): model tu sinh 'reflection tokens' de tu danh gia tung buoc. [Retrieve]: co can retrieve? [ISREL]: doc co relevant? [ISSUP]: answer co duoc support? [ISUSE]: answer co huu ich? Moi buoc co quyet dinh → ket qua chinh xac hon.",
    },
  ], []);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Du doan">
        <PredictionGate
          question="Chatbot cong ty ban dung Basic RAG. User hoi 'Chinh sach nghi phep nam 2025 la gi?' — RAG tra ve document 2024 (chua update). Chatbot tra loi sai. Giai phap?"
          options={[
            "Update document thuong xuyen hon",
            "Dung Agentic RAG: agent kiem tra document date, nhan biet outdated, tu dong tim document moi hon hoac bao cho user",
            "Thay doi LLM manh hon",
          ]}
          correct={1}
          explanation="Agentic RAG thong minh hon: kiem tra metadata (date, version), cross-check nhieu nguon, tu nhan biet 'document nay tu 2024, cau hoi ve 2025 — co the outdated'. Agent tu quyet dinh: retrieve them, canh bao user, hoac tu choi tra loi thay vi dua thong tin sai."
        >

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Kham pha">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          So sanh <strong className="text-foreground">Basic RAG vs Agentic RAG</strong>{" "}
          — tu pipeline co dinh sang agent linh hoat.
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
                  <text x={300} y={130} textAnchor="middle" fill="#94a3b8" fontSize={10}>Pipeline co dinh: luon retrieve 1 lan → generate</text>
                  <text x={300} y={150} textAnchor="middle" fill="#ef4444" fontSize={9}>Van de: khong verify, khong retry, khong adaptive</text>
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
                  <text x={310} y={120} textAnchor="middle" fill="#f59e0b" fontSize={8}>Retry neu khong du tot</text>
                  <text x={300} y={145} textAnchor="middle" fill="#22c55e" fontSize={10}>Agent tu quyet dinh moi buoc — adaptive va self-correcting</text>
                  <text x={300} y={165} textAnchor="middle" fill="#94a3b8" fontSize={9}>Co the skip retrieve, multi-source, verify before answer</text>
                </>
              )}
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoanh khac Aha">
        <AhaMoment>
          <p>
            Basic RAG giong <strong>may tra cuu tu dong</strong>{" "}— luon tim, luon tra.
            Agentic RAG giong <strong>nha nghien cuu thong minh</strong>{" "}— suy nghi truoc khi tim,
            kiem tra nguon, cross-check, va biet noi &quot;toi khong chac chan&quot; khi thong tin khong du.
            Buoc nhay tu &quot;retrieve and read&quot; sang <strong>&quot;think, retrieve, verify, synthesize&quot;</strong>.
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thu thach">
        <InlineChallenge
          question="User hoi: 'So sanh doanh thu Q3 2024 cua FPT va Viettel.' Basic RAG retrieve 2 documents rieng. Nhung 2 docs dung don vi khac nhau (trieu vs ty VND). Agentic RAG xu ly the nao?"
          options={[
            "Tra ve 2 con so va de user tu so sanh",
            "Agent nhan biet don vi khac nhau, tu chuyen doi, cross-check voi nguon thu 3, tra ve so sanh chuẩn hoá",
            "Bao loi vi data khong tuong thich",
          ]}
          correct={1}
          explanation="Agentic RAG: (1) retrieve FPT doc + Viettel doc, (2) nhan biet don vi khac nhau, (3) chuyen doi ve cung don vi, (4) cross-check voi bao cao tong hop, (5) tra ve bang so sanh chuan hoa + ghi chu nguon. Multi-step reasoning + tool use!"
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Ly thuyet">
        <ExplanationSection>
          <p>
            <strong>Agentic RAG</strong>{" "}
            ket hop RAG voi AI Agent — agent tu quyet dinh khi nao retrieve, tu nguon nao, bao nhieu lan, va co can verify khong.
          </p>
          <p><strong>4 kha nang cot loi:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Adaptive Retrieval:</strong>{" "}Quyet dinh CO CAN retrieve hay khong (skip cho cau don gian)</li>
            <li><strong>Multi-source:</strong>{" "}Retrieve tu nhieu nguon: vector DB, SQL, web search, API</li>
            <li><strong>Self-reflection:</strong>{" "}Tu danh gia: retrieved docs co relevant? answer co supported?</li>
            <li><strong>Iterative refinement:</strong>{" "}Khong du tot → reformulate query → retrieve lai</li>
          </ul>

          <Callout variant="tip" title="CRAG - Corrective RAG">
            CRAG (Yan et al. 2024): sau khi retrieve, evaluator danh gia relevance. Correct → dung. Ambiguous → web search bo sung. Incorrect → bo retrieved docs, dung web search thay the. Ket qua: +15% accuracy so voi basic RAG.
          </Callout>

          <CodeBlock language="python" title="Agentic RAG voi tool use">
{`import anthropic

client = anthropic.Anthropic()

tools = [
    {
        "name": "search_docs",
        "description": "Tim tai lieu trong knowledge base",
        "input_schema": {"type": "object", "properties": {
            "query": {"type": "string"},
            "source": {"type": "string", "enum": ["internal", "web", "database"]},
        }},
    },
    {
        "name": "verify_fact",
        "description": "Verify thong tin voi nguon thu 3",
        "input_schema": {"type": "object", "properties": {
            "claim": {"type": "string"},
        }},
    },
]

# Agent tu quyet dinh: can retrieve? tu nguon nao? can verify?
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=4096,
    tools=tools,
    messages=[{
        "role": "user",
        "content": "So sanh chinh sach nghi phep cua FPT va VNG nam 2025"
    }],
)
# Agent co the:
# 1. search_docs("chinh sach nghi phep FPT 2025", "internal")
# 2. search_docs("chinh sach nghi phep VNG 2025", "internal")
# 3. verify_fact("FPT cho 15 ngay nghi phep/nam")
# 4. Synthesize va so sanh`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tom tat">
        <MiniSummary points={[
          "Agentic RAG: agent TU QUYET DINH retrieve hay khong, tu nguon nao, bao nhieu lan, co verify khong.",
          "4 kha nang: Adaptive Retrieval, Multi-source, Self-reflection, Iterative Refinement.",
          "CRAG: evaluator danh gia relevance sau retrieve — correct/ambiguous/incorrect → hành dong khac nhau.",
          "Self-RAG: model tu sinh reflection tokens de tu danh gia tung buoc.",
          "Tu 'may tra cuu' sang 'nha nghien cuu': suy nghi, tim, kiem tra, tong hop — chinh xac hon 15-30%.",
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
