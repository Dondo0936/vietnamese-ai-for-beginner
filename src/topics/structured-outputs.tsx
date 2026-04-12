"use client";

import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "structured-outputs",
  title: "Structured Outputs",
  titleVi: "Đầu ra có cấu trúc",
  description:
    "Kỹ thuật đảm bảo LLM sinh ra JSON, XML hoặc schema cố định thay vì văn bản tự do.",
  category: "emerging",
  tags: ["json-mode", "schema", "constrained-decoding"],
  difficulty: "intermediate",
  relatedSlugs: ["function-calling", "prompt-engineering", "guardrails"],
  vizType: "interactive",
};

const quizQuestions: QuizQuestion[] = [
  {
    question: "Constrained decoding đảm bảo JSON hợp lệ bằng cách nào?",
    options: [
      "Parse JSON sau khi sinh và retry nếu sai",
      "Tại MỖI BƯỚC sinh token, chỉ cho phép tokens tạo JSON hợp lệ (mask invalid tokens trước softmax)",
      "Dùng regex kiểm tra output",
    ],
    correct: 1,
    explanation:
      "Constrained decoding: tại mỗi step, grammar/schema xác định tokens hợp lệ tiếp theo. Mask các token không hợp lệ trước softmax cho 100% guarantee JSON valid. Không cần retry!",
  },
  {
    question: "Khi nào dùng structured outputs thay vì free-form text?",
    options: [
      "Luôn dùng structured outputs vì an toàn hơn",
      "Khi output cần được xử lý tự động bởi code (API response, database insert, UI rendering)",
      "Chỉ khi output là số",
    ],
    correct: 1,
    explanation:
      "Structured outputs cần thiết khi: (1) downstream code cần parse output (JSON cho API), (2) cần validate schema (required fields), (3) cần type safety (string vs number). Free-form tốt cho: creative writing, chat, giải thích.",
  },
  {
    question: "JSON schema strict mode trong API làm gì?",
    options: [
      "Kiểm tra JSON sau khi sinh",
      "Đảm bảo output LUÔN khớp CHÍNH XÁC với schema đã định nghĩa — mọi field, mọi type, không thừa không thiếu",
      "Chỉ hỗ trợ JSON đơn giản",
    ],
    correct: 1,
    explanation:
      "Strict mode: constrained decoding theo schema. Mọi field required sẽ có, mọi field type sẽ đúng, không có field ngoài schema. 100% compliance — không cần try-catch JSON parse.",
  },
  {
    type: "fill-blank",
    question: "Để ép LLM trả về đúng cấu trúc, ta mô tả output bằng một {blank} (ví dụ sinh từ lớp {blank} trong Python) rồi bật strict mode trên API.",
    blanks: [
      { answer: "JSON schema", accept: ["JSON Schema", "schema", "json-schema"] },
      { answer: "Pydantic", accept: ["pydantic", "BaseModel", "pydantic BaseModel"] },
    ],
    explanation: "Flow chuẩn: định nghĩa lớp Pydantic BaseModel → gọi Model.model_json_schema() để lấy JSON schema → truyền schema này cho API với strict mode. LLM sẽ bị ràng buộc sinh output khớp chính xác schema.",
  },
];

export default function StructuredOutputsTopic() {
  return (
    <>
      <LessonSection step={1} totalSteps={6} label="Thử đoán">
        <PredictionGate
          question="Bạn yêu cầu LLM trả về danh sách sản phẩm JSON. 95% lần được JSON đúng, 5% lần LLM thêm 'Đây là danh sách...' trước JSON khiến code parse lỗi. Giải pháp?"
          options={[
            "Thêm 'chỉ trả về JSON' vào prompt — vẫn không 100%",
            "Dùng structured outputs (constrained decoding): đảm bảo 100% output là JSON hợp lệ theo schema",
            "Parse và retry khi lỗi",
          ]}
          correct={1}
          explanation="Prompt engineering chỉ giảm lỗi, không triệt để. Structured outputs dùng constrained decoding: tại mỗi bước sinh token, chỉ cho phép tokens tạo JSON hợp lệ. 100% guarantee — giống điền form (chỉ chấp nhận format đúng) thay vì viết thư tự do."
        />
      </LessonSection>

      <LessonSection step={2} totalSteps={6} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground">
              Free-form vs Structured Output
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg border-2 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10 p-4">
                <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">
                  Free-form (không đảm bảo)
                </span>
                <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed mt-2">
                  Đây là danh sách sản phẩm:{"\n"}
                  {`{"name": "Phở", "price": 50000}`}
                </p>
                <p className="text-[10px] text-red-600 dark:text-red-400 mt-2">
                  Text thừa trước JSON → parse FAIL
                </p>
              </div>
              <div className="rounded-lg border-2 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10 p-4">
                <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">
                  Structured (100% valid)
                </span>
                <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed mt-2">
                  {`[{"name": "Phở",`}{"\n"}
                  {`  "price": 50000}]`}
                </p>
                <p className="text-[10px] text-green-600 dark:text-green-400 mt-2">
                  Luôn valid JSON theo schema
                </p>
              </div>
            </div>
            <p className="text-xs text-tertiary text-center">
              Constrained decoding: mask invalid tokens tại mỗi step → 100% compliance
            </p>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={6} label="Khoảnh khắc Aha">
        <AhaMoment>
          Structured outputs giống <strong>điền form</strong>{" "}thay vì <strong>viết thư</strong>.
          Form chỉ chấp nhận đúng format (tên, email, số điện thoại). Thư tự do có thể viết bất kỳ gì.
          LLM với constrained decoding = <strong>form thông minh</strong>{" "}— luôn cho output đúng schema, 100% parseable! Đây cũng chính là cơ chế dưới{" "}
          <TopicLink slug="function-calling">function calling</TopicLink>, và là cách đáng tin cậy hơn nhiều so với chỉ dựa vào{" "}
          <TopicLink slug="prompt-engineering">prompt engineering</TopicLink>{" "}để xin JSON.
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={6} label="Thử thách">
        <InlineChallenge
          question="Bạn cần LLM extract thông tin từ CV: tên, email, kinh nghiệm (list), kỹ năng (list). Schema có 4 trường required. Không có structured outputs, 1000 CVs có bao nhiêu sẽ parse lỗi?"
          options={[
            "0 — LLM luôn trả về JSON đúng",
            "30-100 CVs (3-10%) sẽ có format lỗi: thiếu trường, sai type, text thừa",
            "Tất cả đều lỗi",
          ]}
          correct={1}
          explanation="Không có structured outputs: 3-10% failure rate là bình thường. Với 4 trường x 1000 CVs, có thể 50-100 records lỗi. Trong production: 5% failure = 50 customers nhận lỗi/ngày. Structured outputs: 0% failure."
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={6} label="Giải thích">
        <ExplanationSection>
          <p>
            <strong>Structured Outputs</strong>{" "}đảm bảo LLM sinh output theo schema cố định
            (JSON, XML) thay vì văn bản tự do — thiết yếu cho production systems.
          </p>
          <p><strong>3 cấp độ đảm bảo:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Prompt-based:</strong>{" "}&quot;Trả về JSON&quot; — khoảng 90-95% compliance. Không đủ cho production</li>
            <li><strong>JSON mode:</strong>{" "}Đảm bảo valid JSON nhưng không đảm bảo schema. Khoảng 98%</li>
            <li><strong>Schema-strict:</strong>{" "}Constrained decoding theo schema. 100% compliance</li>
          </ul>

          <Callout variant="tip" title="Constrained Decoding">
            Tại mỗi step sinh token: context-free grammar (JSON schema → grammar) xác định set tokens hợp lệ.
            Mask tokens không hợp lệ trước softmax. Overhead: dưới 5% latency. Tools: Outlines, LMFE, vLLM built-in.
          </Callout>

          <CodeBlock language="python" title="structured_outputs.py">
{`import anthropic
from pydantic import BaseModel

client = anthropic.Anthropic()

class Product(BaseModel):
    name: str
    price: int
    category: str
    in_stock: bool

class ProductList(BaseModel):
    products: list[Product]

response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": "Extract sản phẩm từ menu: Phở bò 65.000đ, Cơm tấm 55.000đ (hết hàng), Bún chả 50.000đ"
    }],
    tools=[{
        "name": "output_products",
        "description": "Output danh sách sản phẩm",
        "input_schema": ProductList.model_json_schema(),
    }],
    tool_choice={"type": "tool", "name": "output_products"},
)
# 100% valid JSON theo ProductList schema`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={6} label="Tổng kết">
        <MiniSummary points={[
          "Structured outputs đảm bảo LLM sinh JSON/schema cố định — thiết yếu cho production (0% parse error)",
          "3 cấp: Prompt (khoảng 95%), JSON mode (khoảng 98%), Schema-strict (100% constrained decoding)",
          "Constrained decoding: mask invalid tokens tại mỗi step cho 100% compliance, dưới 5% overhead",
          "Dùng khi output cần xử lý tự động: API response, DB insert, UI rendering",
        ]} />
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
