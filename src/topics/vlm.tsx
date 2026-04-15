"use client";

import { useState, useCallback } from "react";
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
  slug: "vlm",
  title: "Vision-Language Models",
  titleVi: "Mô hình Ngôn ngữ — Thị giác",
  description:
    "Mô hình AI có khả năng hiểu đồng thời cả hình ảnh và văn bản, cho phép hỏi đáp về nội dung hình ảnh.",
  category: "multimodal",
  tags: ["vision", "language", "multimodal", "image-understanding"],
  difficulty: "intermediate",
  relatedSlugs: ["clip", "unified-multimodal", "text-to-image"],
  vizType: "interactive",
};

/* ── Constants ── */
const TOTAL_STEPS = 8;

const TASKS = [
  {
    id: "caption",
    label: "Mô tả ảnh",
    input: "Ảnh bãi biển Nha Trang",
    output: "Bãi biển cát trắng với hàng dừa, biển xanh trong, du khách tắm nắng",
    detail: "VLM trích xuất đặc trưng thị giác (dừa, cát, biển) rồi chuyển sang ngôn ngữ tự nhiên.",
  },
  {
    id: "vqa",
    label: "Hỏi đáp hình ảnh",
    input: "Ảnh + 'Có mấy người?'",
    output: "Có 5 người đang tắm biển và 2 người ngồi trên bãi cát",
    detail: "VLM kết hợp thông tin thị giác (đếm người) với câu hỏi ngôn ngữ để tạo câu trả lời.",
  },
  {
    id: "ocr",
    label: "Đọc chữ trong ảnh",
    input: "Ảnh biển hiệu quán phở",
    output: "'Phở Thìn Bờ Hồ — Mở cửa 6h-22h — Giá từ 50.000đ'",
    detail: "VLM nhận dạng ký tự (OCR) trực tiếp, không cần module OCR riêng biệt.",
  },
  {
    id: "reasoning",
    label: "Suy luận hình ảnh",
    input: "Ảnh biểu đồ doanh thu",
    output: "Doanh thu quý 3 tăng 25% so với quý 2, chủ yếu nhờ mảng xuất khẩu",
    detail: "VLM không chỉ đọc số liệu mà còn suy luận xu hướng và nguyên nhân từ ngữ cảnh.",
  },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Trong kiến trúc VLM, Projection Layer có vai trò gì?",
    options: [
      "Nén hình ảnh để giảm dung lượng file",
      "Chuyển đổi đặc trưng hình ảnh sang không gian mà LLM hiểu được",
      "Tạo ra hình ảnh mới từ văn bản mô tả",
      "Phân loại hình ảnh thành các danh mục cố định",
    ],
    correct: 1,
    explanation:
      "Projection Layer là cầu nối giữa Vision Encoder và LLM. Nó chiếu vector đặc trưng ảnh vào cùng không gian embedding với ngôn ngữ, giúp LLM 'hiểu' thông tin thị giác như thể đang đọc văn bản.",
  },
  {
    question: "Tại sao VLM có thể đọc chữ trên biển hiệu tiếng Việt mà không cần module OCR riêng?",
    options: [
      "Vì tiếng Việt dùng chữ Latin nên đơn giản hơn tiếng Trung",
      "Vì Vision Encoder đã học nhận dạng ký tự như một phần của đặc trưng thị giác",
      "Vì VLM có sẵn từ điển tiếng Việt",
      "Vì VLM dùng API Google Translate để dịch",
    ],
    correct: 1,
    explanation:
      "Vision Encoder (thường là ViT) được huấn luyện trên hàng triệu ảnh chứa văn bản, nên nó học được cách nhận dạng ký tự như một loại đặc trưng thị giác tự nhiên, không cần pipeline OCR riêng.",
  },
  {
    question: "Khi VLM phân tích ảnh biểu đồ và đưa ra nhận xét 'doanh thu quý 3 tăng 25%', đây là ví dụ của năng lực nào?",
    options: [
      "Phân loại hình ảnh (image classification)",
      "Phát hiện vật thể (object detection)",
      "Suy luận thị giác (visual reasoning)",
      "Tạo chú thích ảnh (image captioning)",
    ],
    correct: 2,
    explanation:
      "Đây là suy luận thị giác — VLM không chỉ mô tả cái thấy mà còn rút ra kết luận, so sánh số liệu, và giải thích xu hướng. Đây là năng lực khó nhất và khác biệt nhất của VLM so với các mô hình thị giác truyền thống.",
  },
  {
    type: "fill-blank",
    question: "VLM là viết tắt của Vision-Language Model — kết hợp hai phương thức: {blank} (hình ảnh) và {blank} (ngôn ngữ tự nhiên) trong một kiến trúc duy nhất.",
    blanks: [
      { answer: "vision", accept: ["thị giác", "hình ảnh", "ảnh"] },
      { answer: "language", accept: ["ngôn ngữ", "văn bản", "text"] },
    ],
    explanation: "Tên gọi Vision-Language Model chỉ ra rõ hai phương thức cốt lõi: Vision (thị giác) xử lý ảnh qua Vision Encoder, Language (ngôn ngữ) xử lý qua LLM, và hai luồng được kết nối bằng Projection Layer.",
  },
];

export default function VLMTopic() {
  const [activeTask, setActiveTask] = useState("caption");
  const task = TASKS.find((t) => t.id === activeTask)!;

  const handleTaskChange = useCallback((id: string) => {
    setActiveTask(id);
  }, []);

  return (
    <>
      {/* ── Step 1: PredictionGate ── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn gửi ảnh chụp hoá đơn nhà hàng cho AI và hỏi 'Tổng tiền bao nhiêu?'. AI cần những năng lực nào?"
          options={[
            "Chỉ cần nhận dạng chữ (OCR) là đủ",
            "Cần cả nhận dạng chữ, hiểu cấu trúc bảng, VÀ tính toán",
            "Chỉ cần mô hình ngôn ngữ, không cần xử lý ảnh",
          ]}
          correct={1}
          explanation="Đúng! AI cần nhìn thấy (OCR), hiểu bố cục bảng (thị giác), VÀ suy luận tính toán (ngôn ngữ). Đây chính là lý do VLM cần kết hợp cả thị giác lẫn ngôn ngữ trong một mô hình duy nhất."
        />
      </LessonSection>

      {/* ── Step 2: Khám phá tương tác ── */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          VLM có thể thực hiện nhiều loại tác vụ khác nhau với cùng một kiến trúc. Hãy chọn từng tác vụ bên dưới để xem VLM xử lý đầu vào và tạo đầu ra như thế nào.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {TASKS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTaskChange(t.id)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    activeTask === t.id
                      ? "bg-accent text-white"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <svg viewBox="0 0 620 220" className="w-full max-w-2xl mx-auto">
              {/* Input */}
              <rect x={20} y={55} width={150} height={70} rx={10} fill="#3b82f6" />
              <text x={95} y={80} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">Đầu vào</text>
              <text x={95} y={100} textAnchor="middle" fill="#bfdbfe" fontSize={8}>
                {task.input.length > 22 ? task.input.slice(0, 22) + "..." : task.input}
              </text>

              {/* Arrow */}
              <line x1={170} y1={90} x2={215} y2={90} stroke="#475569" strokeWidth={2} markerEnd="url(#vlm-arrow)" />

              {/* VLM architecture */}
              <rect x={215} y={30} width={190} height={120} rx={12} fill="#1e293b" stroke="#8b5cf6" strokeWidth={2} />
              <text x={310} y={55} textAnchor="middle" fill="#c4b5fd" fontSize={9}>Vision Encoder (ViT)</text>
              <rect x={225} y={62} width={75} height={24} rx={4} fill="#3b82f6" opacity={0.4} />
              <text x={262} y={78} textAnchor="middle" fill="#93c5fd" fontSize={8}>Ảnh → Vector</text>
              <rect x={320} y={62} width={75} height={24} rx={4} fill="#22c55e" opacity={0.4} />
              <text x={357} y={78} textAnchor="middle" fill="#86efac" fontSize={8}>Projection</text>
              <line x1={265} y1={90} x2={310} y2={110} stroke="#475569" strokeWidth={1} strokeDasharray="3,2" />
              <line x1={355} y1={90} x2={310} y2={110} stroke="#475569" strokeWidth={1} strokeDasharray="3,2" />
              <rect x={255} y={105} width={110} height={28} rx={6} fill="#8b5cf6" opacity={0.5} />
              <text x={310} y={123} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">LLM</text>

              {/* Arrow */}
              <line x1={405} y1={90} x2={440} y2={90} stroke="#475569" strokeWidth={2} markerEnd="url(#vlm-arrow)" />

              {/* Output */}
              <rect x={440} y={50} width={160} height={80} rx={10} fill="#22c55e" />
              <text x={520} y={75} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">Đầu ra</text>
              <text x={520} y={95} textAnchor="middle" fill="#bbf7d0" fontSize={7}>
                {task.output.length > 28 ? task.output.slice(0, 28) + "..." : task.output}
              </text>

              <defs>
                <marker id="vlm-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="#475569" />
                </marker>
              </defs>
            </svg>

            <div className="rounded-lg bg-background/50 border border-border p-4 space-y-2">
              <p className="text-sm text-foreground">
                <strong>Kết quả:</strong>{" "}
                {task.output}
              </p>
              <p className="text-xs text-muted">
                {task.detail}
              </p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ── Step 3: AhaMoment ── */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          <strong>VLM</strong>{" "}
          không phải là OCR hay nhận dạng ảnh thông thường. Điều đặc biệt là nó kết hợp{" "}
          <strong>đôi mắt</strong>{" "}
          (Vision Encoder) với <strong>bộ não ngôn ngữ</strong>{" "}
          (LLM) qua một lớp cầu nối (Projection Layer), giúp AI{" "}
          <strong>suy luận</strong>{" "}
          về những gì nhìn thấy thay vì chỉ mô tả bề mặt.
        </AhaMoment>
      </LessonSection>

      {/* ── Step 4: InlineChallenge ── */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question="Bạn đưa VLM ảnh chụp thực đơn nhà hàng và hỏi 'Món nào phù hợp cho người ăn chay?'. VLM cần làm gì?"
          options={[
            "Chỉ cần đọc chữ trên thực đơn (OCR)",
            "Đọc chữ, hiểu mô tả nguyên liệu, VÀ suy luận món nào không có thịt",
            "Tìm kiếm trên internet các nhà hàng chay gần đó",
            "Phân loại ảnh thực đơn vào danh mục 'nhà hàng'",
          ]}
          correct={1}
          explanation="VLM cần kết hợp ba năng lực: (1) đọc chữ trên ảnh, (2) hiểu ngữ nghĩa mô tả món ăn, (3) suy luận về thành phần nguyên liệu để xác định món chay. Đây là sức mạnh của việc kết hợp thị giác và ngôn ngữ."
        />
      </LessonSection>

      {/* ── Step 5: Explanation ── */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Vision-Language Models (VLM)</strong>{" "}
            là mô hình AI kết hợp khả năng hiểu hình ảnh và ngôn ngữ tự nhiên trong một kiến trúc thống nhất. Thay vì dùng nhiều mô hình riêng lẻ cho OCR, phân loại ảnh, và trả lời câu hỏi, VLM làm tất cả với một bộ tham số duy nhất.
          </p>

          <Callout variant="insight" title="Kiến trúc ba thành phần">
            <div className="space-y-2">
              <p>
                <strong>1. Vision Encoder:</strong>{" "}
                Thường là Vision{" "}
                <TopicLink slug="transformer">Transformer</TopicLink>{" "}
                (ViT), chuyển ảnh đầu vào thành chuỗi vector đặc trưng. Mỗi patch 16x16 pixel trở thành một token thị giác. Nhiều VLM khởi tạo từ{" "}
                <TopicLink slug="clip">CLIP</TopicLink>{" "}
                encoder để tận dụng biểu diễn đã căn chỉnh với ngôn ngữ.
              </p>
              <p>
                <strong>2. Projection Layer:</strong>{" "}
                Lớp cầu nối chuyển đổi vector ảnh sang không gian embedding của LLM. Giống như phiên dịch viên giữa hai ngôn ngữ.
              </p>
              <p>
                <strong>3. LLM:</strong>{" "}
                Xử lý kết hợp token thị giác và token ngôn ngữ, tạo ra phản hồi bằng văn bản tự nhiên. VLM là nền tảng của các{" "}
                <TopicLink slug="unified-multimodal">mô hình đa phương thức thống nhất</TopicLink>{" "}
                hiện đại.
              </p>
            </div>
          </Callout>

          <p>Quá trình xử lý một câu hỏi về ảnh diễn ra như sau:</p>
          <LaTeX block>{"\\text{Image} \\xrightarrow{\\text{ViT}} \\mathbf{z}_{\\text{vis}} \\xrightarrow{\\text{Proj}} \\mathbf{h}_{\\text{vis}} \\;\\|\\; \\mathbf{h}_{\\text{text}} \\xrightarrow{\\text{LLM}} \\text{Response}"}</LaTeX>
          <p className="text-sm text-muted">
            Trong đó <LaTeX>{"\\mathbf{z}_{\\text{vis}}"}</LaTeX> là vector đặc trưng ảnh, <LaTeX>{"\\mathbf{h}_{\\text{vis}}"}</LaTeX> là vector đã chiếu, <LaTeX>{"\\|"}</LaTeX> là phép nối (concatenation) với embedding văn bản.
          </p>

          <CodeBlock language="python" title="vlm_inference.py">
{`from transformers import LlavaForConditionalGeneration, AutoProcessor
from PIL import Image

# Tải mô hình LLaVA (VLM mã nguồn mở)
model = LlavaForConditionalGeneration.from_pretrained(
    "llava-hf/llava-v1.6-mistral-7b-hf"
)
processor = AutoProcessor.from_pretrained(
    "llava-hf/llava-v1.6-mistral-7b-hf"
)

# Hỏi đáp về ảnh biển hiệu tiếng Việt
image = Image.open("bien-hieu-pho.jpg")
prompt = "<image>\\nBiển hiệu này ghi gì? Giá bao nhiêu?"

inputs = processor(prompt, image, return_tensors="pt")
output = model.generate(**inputs, max_new_tokens=200)
print(processor.decode(output[0], skip_special_tokens=True))
# "Phở Thìn Bờ Hồ - Mở cửa 6h-22h - Giá từ 50.000đ"`}
          </CodeBlock>

          <Callout variant="warning" title="Hạn chế của VLM hiện tại">
            VLM vẫn có thể bị ảo giác (hallucination) khi mô tả chi tiết không có trong ảnh. Ví dụ: ảnh chụp phố Hà Nội, VLM có thể bịa thêm chi tiết như tên cửa hàng không tồn tại. Luôn kiểm chứng thông tin quan trọng!
          </Callout>

          <Callout variant="tip" title="VLM và tiếng Việt">
            Các VLM lớn như GPT-4V, Claude 3, và Gemini đã hỗ trợ tiếng Việt khá tốt: đọc biển hiệu, hiểu hoá đơn, nhận dạng giọng nói kết hợp với ảnh. VLM mã nguồn mở như LLaVA cũng đang cải thiện khả năng tiếng Việt nhờ fine-tuning trên dữ liệu Việt.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ── Step 6: Deeper insight ── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Ứng dụng thực tế">
          <Callout variant="info" title="VLM trong đời sống Việt Nam">
            <div className="space-y-2">
              <p>
                <strong>Y tế:</strong>{" "}
                VLM phân tích ảnh X-quang kết hợp bệnh án tiếng Việt, hỗ trợ bác sĩ chẩn đoán tại các bệnh viện tuyến huyện thiếu chuyên gia.
              </p>
              <p>
                <strong>Giáo dục:</strong>{" "}
                Học sinh chụp ảnh bài toán hình học, VLM giải thích lời giải từng bước bằng tiếng Việt.
              </p>
              <p>
                <strong>Tiếp cận:</strong>{" "}
                Người khiếm thị dùng VLM qua điện thoại để mô tả môi trường xung quanh, đọc nhãn hàng hoá, và nhận dạng tiền Việt Nam.
              </p>
              <p>
                <strong>Thương mại điện tử:</strong>{" "}
                Chụp ảnh sản phẩm trên Shopee/Lazada, VLM tự động tạo mô tả sản phẩm tiếng Việt phong phú.
              </p>
            </div>
          </Callout>
      </LessonSection>

      {/* ── Step 7: MiniSummary ── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về VLM"
          points={[
            "VLM = Vision Encoder + Projection Layer + LLM, kết hợp 'nhìn' và 'hiểu' trong một mô hình.",
            "Projection Layer là cầu nối quan trọng nhất — chiếu vector ảnh sang không gian ngôn ngữ.",
            "VLM thực hiện được nhiều tác vụ: mô tả ảnh, hỏi đáp, OCR, suy luận thị giác.",
            "Hạn chế chính: ảo giác (hallucination) khi mô tả chi tiết không có trong ảnh.",
            "Các VLM hàng đầu: GPT-4V, Claude 3, Gemini (đóng), LLaVA (mở) — đều hỗ trợ tiếng Việt.",
          ]}
        />
      </LessonSection>

      {/* ── Step 8: Quiz ── */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
