"use client";

import { useMemo } from "react";
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
  slug: "structured-outputs",
  title: "Structured Outputs",
  titleVi: "Dau ra co cau truc",
  description:
    "Ky thuat dam bao LLM sinh ra JSON, XML hoac schema co dinh thay vi van ban tu do",
  category: "emerging",
  tags: ["json-mode", "schema", "constrained-decoding"],
  difficulty: "intermediate",
  relatedSlugs: ["function-calling", "prompt-engineering", "guardrails"],
  vizType: "interactive",
};

const TOTAL_STEPS = 7;

export default function StructuredOutputsTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Constrained decoding dam bao JSON hop le bang cach nao?",
      options: [
        "Parse JSON sau khi sinh va retry neu sai",
        "Tai MOI BUOC sinh token, chi cho phep tokens tao JSON hop le (mask invalid tokens truoc softmax)",
        "Dung regex kiem tra output",
      ],
      correct: 1,
      explanation: "Constrained decoding: tai moi step, grammar/schema xac dinh tokens hop le tiep theo (vi du: sau '\"name\":' chi cho phep '\"'). Mask cac token khong hop le truoc softmax → 100% guarantee JSON valid. Khong can retry!",
    },
    {
      question: "Khi nao dung structured outputs thay vi free-form text?",
      options: [
        "Luon dung structured outputs vi an toan hon",
        "Khi output can duoc xu ly tu dong boi code (API response, database insert, UI rendering)",
        "Chi khi output la so",
      ],
      correct: 1,
      explanation: "Structured outputs can thiet khi: (1) downstream code can parse output (JSON cho API), (2) can validate schema (required fields), (3) can type safety (string vs number). Free-form tot cho: creative writing, chat, explanation.",
    },
    {
      question: "JSON schema strict mode trong OpenAI API lam gi?",
      options: [
        "Kiem tra JSON sau khi sinh",
        "Dam bao output LUON khop CHINH XAC voi schema da dinh nghia — moi field, moi type, khong thua khong thieu",
        "Chi ho tro JSON don gian",
      ],
      correct: 1,
      explanation: "Strict mode: constrained decoding theo schema. Moi field required se co, moi field type se dung, khong co field ngoai schema. 100% compliance — khong can try-catch JSON parse. Tuy nhien: chi ho tro subset cua JSON Schema.",
    },
  ], []);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Du doan">
        <PredictionGate
          question="Ban yeu cau LLM tra ve danh sach san pham JSON. 95% lan duoc JSON dung, 5% lan LLM them 'Day la danh sach...' truoc JSON → code parse loi. Giai phap?"
          options={[
            "Them 'chi tra ve JSON' vao prompt — van khong 100%",
            "Dung structured outputs (constrained decoding): dam bao 100% output la JSON hop le theo schema",
            "Parse va retry khi loi",
          ]}
          correct={1}
          explanation="Prompt engineering chi giam loi, khong triet de. Structured outputs dung constrained decoding: tai moi buoc sinh token, chi cho phep tokens tao JSON hop le. 100% guarantee — giong dien vao form (chi chap nhan format dung) thay vi viet thu tu do."
        >

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Kham pha">
        <VisualizationSection>
          <div className="space-y-4">
            <svg viewBox="0 0 600 160" className="w-full max-w-2xl mx-auto">
              <text x={300} y={16} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontWeight="bold">
                Free-form vs Structured Output
              </text>
              <rect x={20} y={30} width={260} height={100} rx={8} fill="#1e293b" stroke="#ef4444" strokeWidth={2} />
              <text x={150} y={50} textAnchor="middle" fill="#ef4444" fontSize={10} fontWeight="bold">Free-form (khong dam bao)</text>
              <text x={150} y={70} textAnchor="middle" fill="#94a3b8" fontSize={8}>Day la danh sach san pham:</text>
              <text x={150} y={85} textAnchor="middle" fill="#94a3b8" fontSize={8}>{'{"name": "Pho", "price": 50000}'}</text>
              <text x={150} y={100} textAnchor="middle" fill="#ef4444" fontSize={7}>Text thua → JSON parse FAIL</text>

              <rect x={320} y={30} width={260} height={100} rx={8} fill="#1e293b" stroke="#22c55e" strokeWidth={2} />
              <text x={450} y={50} textAnchor="middle" fill="#22c55e" fontSize={10} fontWeight="bold">Structured (100% valid)</text>
              <text x={450} y={70} textAnchor="middle" fill="#94a3b8" fontSize={8}>{'[{"name": "Pho",'}</text>
              <text x={450} y={85} textAnchor="middle" fill="#94a3b8" fontSize={8}>{'  "price": 50000}]'}</text>
              <text x={450} y={100} textAnchor="middle" fill="#22c55e" fontSize={7}>Luon valid JSON theo schema</text>

              <text x={300} y={150} textAnchor="middle" fill="#64748b" fontSize={9}>
                Constrained decoding: mask invalid tokens tai moi step → 100% compliance
              </text>
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoanh khac Aha">
        <AhaMoment>
          <p>
            Structured outputs giong <strong>dien form</strong>{" "}thay vi <strong>viet thu</strong>.
            Form chi chap nhan dung format (ten, email, so dien thoai). Thu tu do co the viet bat ky gi.
            LLM voi constrained decoding = <strong>form thong minh</strong>{" "}— luon cho output dung schema, 100% parseable!
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thu thach">
        <InlineChallenge
          question="Ban can LLM extract thong tin tu CV: ten, email, kinh nghiem (list), ky nang (list). Schema co 4 truong required. Khong co structured outputs, 1000 CVs co bao nhieu se parse loi?"
          options={[
            "0 — LLM luon tra ve JSON dung",
            "30-100 CVs (3-10%) se co format loi: thieu truong, sai type, text thua",
            "Tat ca deu loi",
          ]}
          correct={1}
          explanation="Khong co structured outputs: 3-10% failure rate la binh thuong. Voi 4 truong x 1000 CVs, co the 50-100 records loi. Trong production: 5% failure = 50 customers nhan loi/ngay. Structured outputs: 0% failure. Cost difference: vài dong code."
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Ly thuyet">
        <ExplanationSection>
          <p>
            <strong>Structured Outputs</strong>{" "}
            dam bao LLM sinh output theo schema co dinh (JSON, XML) thay vi van ban tu do — thiet yeu cho production systems.
          </p>
          <p><strong>3 cap do dam bao:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Prompt-based:</strong>{" "}&quot;Tra ve JSON&quot; — ~90-95% compliance. Khong du cho production</li>
            <li><strong>JSON mode:</strong>{" "}Dam bao valid JSON nhung khong dam bao schema. ~98%</li>
            <li><strong>Schema-strict:</strong>{" "}Constrained decoding theo schema. 100% compliance</li>
          </ul>

          <Callout variant="tip" title="Constrained Decoding">
            Tai moi step sinh token: context-free grammar (JSON schema → grammar) xac dinh set tokens hop le. Mask tokens khong hop le truoc softmax. Overhead: &lt;5% latency. Tools: Outlines, LMFE, vLLM built-in.
          </Callout>

          <CodeBlock language="python" title="Structured outputs voi Anthropic API">
{`import anthropic
from pydantic import BaseModel

client = anthropic.Anthropic()

# Dinh nghia schema bang Pydantic
class Product(BaseModel):
    name: str
    price: int
    category: str
    in_stock: bool

class ProductList(BaseModel):
    products: list[Product]

# Extract structured data tu text
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": """Extract san pham tu menu nha hang:
        Pho bo dac biet 65.000d, Com tam suon 55.000d (het hang),
        Bun cha Ha Noi 50.000d"""
    }],
    # Tool use for structured output
    tools=[{
        "name": "output_products",
        "description": "Output danh sach san pham",
        "input_schema": ProductList.model_json_schema(),
    }],
    tool_choice={"type": "tool", "name": "output_products"},
)
# 100% valid JSON theo ProductList schema
# {"products": [{"name": "Pho bo dac biet", "price": 65000, ...}]}`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tom tat">
        <MiniSummary points={[
          "Structured outputs dam bao LLM sinh JSON/schema co dinh — thiet yeu cho production (0% parse error).",
          "3 cap: Prompt (~95%), JSON mode (~98%), Schema-strict (100% constrained decoding).",
          "Constrained decoding: mask invalid tokens tai moi step → 100% compliance, <5% overhead.",
          "Dung khi output can xu ly tu dong: API response, DB insert, UI rendering.",
          "Tools: Pydantic schema + tool use (Anthropic), structured outputs (OpenAI), Outlines/LMFE (open source).",
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
