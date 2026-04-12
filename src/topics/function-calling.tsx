"use client";

import { useState } from "react";
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
  slug: "function-calling",
  title: "Function Calling",
  titleVi: "Gọi hàm — Khi AI biết dùng công cụ",
  description:
    "Cơ chế cho phép mô hình ngôn ngữ lớn gọi các hàm bên ngoài để lấy dữ liệu hoặc thực thi hành động thực tế.",
  category: "ai-agents",
  tags: ["tools", "api", "agent"],
  difficulty: "intermediate",
  relatedSlugs: ["react-framework", "agent-architecture", "orchestration"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

const TOOLS = [
  { id: "weather", name: "Thời tiết", desc: "get_weather(city)", result: '{"temp": 32, "condition": "Nắng"}' },
  { id: "calc", name: "Máy tính", desc: "calculate(expr)", result: '{"result": 42}' },
  { id: "search", name: "Tìm kiếm", desc: "web_search(query)", result: '{"results": ["Dân số VN: 100 triệu"]}' },
  { id: "email", name: "Email", desc: "send_email(to, subject)", result: '{"status": "sent"}' },
];

const STEPS_LABELS = ["Nhận câu hỏi", "Chọn công cụ", "Tạo tham số JSON", "Thực thi hàm", "Tổng hợp kết quả"];

const QUIZ: QuizQuestion[] = [
  {
    question: "Trong function calling, AI có trực tiếp thực thi hàm không?",
    options: [
      "Có — AI gọi API trực tiếp",
      "Không — AI chỉ sinh ra JSON mô tả hàm cần gọi, hệ thống bên ngoài thực thi rồi trả kết quả lại",
      "Có — AI chạy code trong sandbox",
      "Tuỳ thuộc vào mô hình",
    ],
    correct: 1,
    explanation:
      "AI KHÔNG trực tiếp thực thi. Nó chỉ sinh JSON: {function: 'get_weather', args: {city: 'Hanoi'}}. Ứng dụng nhận JSON này, gọi API thật, trả kết quả lại cho AI tổng hợp.",
  },
  {
    question: "Tại sao function calling quan trọng cho AI Agent?",
    options: [
      "Vì AI cần giao diện đẹp",
      "Vì nó cho phép AI tương tác với thế giới thực — lấy dữ liệu mới, thực hiện hành động, vượt qua giới hạn kiến thức tĩnh",
      "Vì AI không thể tính toán",
      "Vì API rẻ hơn GPU",
    ],
    correct: 1,
    explanation:
      "LLM bị giới hạn bởi dữ liệu huấn luyện (kiến thức cũ, không có dữ liệu cá nhân). Function calling mở cánh cửa để AI gọi API thời gian thực, truy vấn database, gửi email — tương tác với thế giới thực.",
  },
  {
    question: "Khi LLM nhận danh sách 10 công cụ, điều gì có thể xảy ra nếu mô tả công cụ kém?",
    options: [
      "AI chọn sai công cụ hoặc truyền sai tham số — kết quả sai",
      "AI tự động sửa mô tả",
      "Không ảnh hưởng — AI đủ thông minh",
      "AI từ chối sử dụng công cụ",
    ],
    correct: 0,
    explanation:
      "AI chọn công cụ dựa trên mô tả. Nếu mô tả mơ hồ, AI có thể chọn sai (gọi search thay vì calculator) hoặc truyền sai tham số. Mô tả công cụ rõ ràng là yếu tố quan trọng nhất.",
  },
  {
    type: "fill-blank",
    question: "Trong function calling, developer khai báo mỗi {blank} cho LLM bằng một {blank} mô tả tên, mô tả, và các tham số bắt buộc.",
    blanks: [
      { answer: "tool", accept: ["công cụ", "function", "hàm"] },
      { answer: "JSON schema", accept: ["JSON Schema", "schema", "json-schema"] },
    ],
    explanation: "Mỗi tool (công cụ) được mô tả bằng JSON Schema: tên hàm, mô tả công dụng, danh sách tham số kèm kiểu dữ liệu. LLM đọc schema này để quyết định khi nào gọi và truyền tham số gì.",
  },
];

export default function FunctionCallingTopic() {
  const [selectedTool, setSelectedTool] = useState(0);
  const [step, setStep] = useState(0);

  const tool = TOOLS[selectedTool];

  return (
    <>
      {/* ━━━ 1. HOOK ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn hỏi AI: 'Thời tiết Hà Nội hôm nay thế nào?' AI được huấn luyện đến tháng 3/2025. Nó sẽ làm gì?"
          options={[
            "Bịa một con số dựa trên kiến thức cũ",
            "Nhận ra mình không biết và GỌI HÀM lấy dữ liệu thời tiết thực từ API bên ngoài",
            "Từ chối trả lời vì không có dữ liệu",
          ]}
          correct={1}
          explanation="Với function calling, AI biết khi nào cần gọi công cụ bên ngoài thay vì tự bịa. Nó sinh ra lệnh gọi hàm get_weather('Ha Noi'), hệ thống thực thi rồi trả kết quả lại."
        >
          <p className="text-sm text-muted mt-2">
            Hãy cùng xem AI quyết định gọi hàm nào và truyền tham số gì.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ 2. TRỰC QUAN HOÁ ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Quy trình gọi hàm 5 bước
          </h3>
          <p className="text-sm text-muted mb-4">
            Chọn công cụ, rồi nhấn &quot;Bước tiếp&quot; để theo dõi AI gọi hàm.
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {TOOLS.map((t, i) => (
              <button key={t.id} onClick={() => { setSelectedTool(i); setStep(0); }}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  selectedTool === i ? "bg-accent text-white" : "bg-card border border-border text-muted hover:text-foreground"
                }`}>
                {t.name}
              </button>
            ))}
          </div>

          <svg viewBox="0 0 700 120" className="w-full max-w-3xl mx-auto mb-4">
            {STEPS_LABELS.map((label, i) => {
              const x = 70 + i * 145;
              const active = i <= step;
              return (
                <g key={i}>
                  <rect x={x - 60} y={25} width={120} height={40} rx={8}
                    fill={active ? "#3b82f6" : "var(--bg-surface)"}
                    stroke={active ? "#60a5fa" : "var(--text-tertiary)"} strokeWidth={2} />
                  <text x={x} y={50} textAnchor="middle"
                    fill={active ? "white" : "var(--text-tertiary)"} fontSize={10} fontWeight="bold">
                    {label}
                  </text>
                  {i < STEPS_LABELS.length - 1 && (
                    <line x1={x + 60} y1={45} x2={x + 85} y2={45}
                      stroke={i < step ? "#3b82f6" : "var(--text-tertiary)"} strokeWidth={2} markerEnd="url(#arr-fc)" />
                  )}
                </g>
              );
            })}
            <defs>
              <marker id="arr-fc" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#60a5fa" />
              </marker>
            </defs>
            <text x="350" y="95" textAnchor="middle" fill="var(--text-tertiary)" fontSize="10">
              Bước {step + 1}/{STEPS_LABELS.length} — Công cụ: {tool.name}
            </text>
          </svg>

          {step >= 2 && (
            <div className="rounded-lg bg-background/50 border border-border p-3 mb-3">
              <p className="text-xs text-muted mb-1">AI sinh JSON:</p>
              <p className="text-sm text-green-400">{tool.desc}</p>
            </div>
          )}
          {step >= 4 && (
            <div className="rounded-lg bg-background/50 border border-border p-3 mb-3">
              <p className="text-xs text-muted mb-1">Kết quả trả về:</p>
              <p className="text-sm text-blue-400">{tool.result}</p>
            </div>
          )}

          <div className="flex gap-2 justify-center">
            <button onClick={() => setStep(s => Math.min(s + 1, STEPS_LABELS.length - 1))}
              disabled={step >= STEPS_LABELS.length - 1}
              className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white disabled:opacity-40">
              Bước tiếp theo
            </button>
            <button onClick={() => setStep(0)}
              className="rounded-lg bg-card border border-border px-5 py-2 text-sm font-semibold text-muted hover:text-foreground">
              Đặt lại
            </button>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ 3. AHA MOMENT ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          AI <strong>không thực sự gọi hàm</strong> — nó chỉ sinh ra JSON mô tả
          hàm cần gọi và tham số (một dạng{" "}
          <TopicLink slug="structured-outputs">structured output</TopicLink>).
          Hệ thống bên ngoài thực thi rồi trả kết quả lại. Giống lễ tân khách sạn: không tự nấu ăn mà{" "}
          <strong>gọi điện cho nhà hàng</strong>{" "}và chuyển món đến khách. Đây là nền tảng để xây dựng{" "}
          <TopicLink slug="agent-architecture">AI Agent</TopicLink>{" "}và hoạt động trơn tru trong vòng lặp{" "}
          <TopicLink slug="react-framework">ReAct</TopicLink>.
        </AhaMoment>
      </LessonSection>

      {/* ━━━ 4. THÁCH THỨC ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Người dùng hỏi: 'Gửi email cho An báo rằng ngày mai trời mưa ở Đà Nẵng'. AI cần gọi mấy hàm và theo thứ tự nào?"
          options={[
            "1 hàm: send_email() — AI biết thời tiết rồi",
            "2 hàm: get_weather('Da Nang') trước, rồi send_email() sau — vì cần dữ liệu thời tiết thật mới gửi mail",
            "3 hàm: search → weather → email",
            "0 hàm — AI tự trả lời",
          ]}
          correct={1}
          explanation="AI cần gọi get_weather('Da Nang') trước để lấy dự báo thực. Sau đó dùng kết quả để gọi send_email(). Thứ tự quan trọng: hàm sau phụ thuộc kết quả hàm trước — đây là chain of function calls."
        />
      </LessonSection>

      {/* ━━━ 5. GIẢI THÍCH SÂU ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Function Calling</strong>{" "}cho phép LLM tương tác với thế giới bên ngoài
            qua một giao thức chuẩn hoá. Quy trình:
          </p>

          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>Định nghĩa công cụ:</strong>{" "}Developer mô tả mỗi hàm bằng JSON Schema
              (tên, mô tả, tham số, kiểu dữ liệu).
            </li>
            <li>
              <strong>Phân tích yêu cầu:</strong>{" "}LLM đọc câu hỏi người dùng và danh sách
              công cụ, quyết định có cần gọi hàm không.
            </li>
            <li>
              <strong>Sinh lệnh gọi:</strong>{" "}LLM output JSON chứa tên hàm và tham số.
              Ứng dụng parse và thực thi.
            </li>
            <li>
              <strong>Tổng hợp:</strong>{" "}Kết quả hàm được đưa lại cho LLM.
              LLM viết câu trả lời tự nhiên cho người dùng.
            </li>
          </ul>

          <CodeBlock language="python" title="function_calling.py">{`import openai

# Định nghĩa công cụ bằng JSON Schema
tools = [{
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "Lấy thời tiết hiện tại của thành phố",
        "parameters": {
            "type": "object",
            "properties": {
                "city": {"type": "string", "description": "Tên thành phố"},
            },
            "required": ["city"],
        },
    },
}]

# LLM quyết định gọi hàm nào
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Thời tiết HN?"}],
    tools=tools,
)

# Kiểm tra: AI muốn gọi hàm
call = response.choices[0].message.tool_calls[0]
# → {"name": "get_weather", "arguments": {"city": "Ha Noi"}}`}</CodeBlock>

          <Callout variant="tip" title="Mô tả công cụ = Chất lượng kết quả">
            Mô tả công cụ càng rõ ràng, AI chọn đúng công cụ càng chính xác. Luôn
            ghi rõ: hàm làm gì, khi nào dùng, tham số có ý nghĩa gì. Đây là
            &quot;prompt engineering cho công cụ&quot;.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ 6. TÓM TẮT ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về Function Calling"
          points={[
            "AI không thực thi hàm — chỉ sinh JSON mô tả. Hệ thống bên ngoài thực thi rồi trả kết quả lại.",
            "5 bước: Nhận câu hỏi → Chọn công cụ → Sinh tham số JSON → Thực thi → Tổng hợp kết quả.",
            "Mô tả công cụ rõ ràng (JSON Schema) quyết định AI chọn đúng hay sai — quan trọng như prompt engineering.",
            "Là nền tảng xây dựng AI Agent: cho phép AI tương tác với API, database, web — vượt qua giới hạn kiến thức tĩnh.",
          ]}
        />
      </LessonSection>

      {/* ━━━ 7. QUIZ ━━━ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
