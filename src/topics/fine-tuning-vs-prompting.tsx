"use client";

import { useState } from "react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
  LessonSection,
  TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "fine-tuning-vs-prompting",
  title: "Fine-tuning vs Prompting",
  titleVi: "Fine-tuning hay Prompting?",
  description:
    "Khi nào nên tinh chỉnh model, khi nào chỉ cần kỹ thuật prompt — hướng dẫn chọn chiến lược phù hợp.",
  category: "llm-concepts",
  tags: ["fine-tuning", "prompting", "comparison", "strategy"],
  difficulty: "intermediate",
  relatedSlugs: ["prompt-engineering", "fine-tuning", "lora", "in-context-learning"],
  vizType: "interactive",
};

// ─── Kịch bản quyết định ───
const SCENARIOS = [
  {
    id: 1,
    question: "Bạn cần chatbot trả lời FAQ cho shop quần áo online. 50 câu hỏi cố định.",
    answer: "prompting",
    reasoning: "50 câu FAQ = đủ đưa vào prompt/RAG. Fine-tuning tốn tiền mà overkill cho task đơn giản.",
  },
  {
    id: 2,
    question: "Bạn cần AI viết báo cáo y tế theo đúng format bệnh viện Chợ Rẫy, dùng thuật ngữ chuyên ngành.",
    answer: "fine-tuning",
    reasoning: "Format và thuật ngữ chuyên ngành quá specific — prompting khó cover hết. Fine-tuning với 1.000+ báo cáo mẫu cho kết quả tốt hơn.",
  },
  {
    id: 3,
    question: "Bạn cần dịch menu nhà hàng Việt sang tiếng Anh, giữ phong cách 'thân thiện du khách'.",
    answer: "prompting",
    reasoning: "Dịch + style = prompt engineering xuất sắc. Cho vài ví dụ dịch mẫu (few-shot) là đủ. Không cần fine-tuning.",
  },
  {
    id: 4,
    question: "Bạn xây dựng AI phân loại 200 loại bệnh da liễu từ mô tả triệu chứng tiếng Việt.",
    answer: "fine-tuning",
    reasoning: "200 class phân loại chuyên ngành + tiếng Việt = quá phức tạp cho prompting. Cần fine-tuning với dataset lớn để model hiểu domain.",
  },
  {
    id: 5,
    question: "Bạn cần AI tóm tắt email dài thành 3 bullet points cho giám đốc.",
    answer: "prompting",
    reasoning: "Tóm tắt = khả năng có sẵn của LLM. Prompt rõ ràng ('tóm tắt 3 điểm, ngắn gọn, cho giám đốc') là đủ.",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Bạn có 100 ví dụ (input, output) cho một task. Đủ để fine-tuning chưa?",
    options: [
      "Quá ít — fine-tuning cần triệu ví dụ",
      "Đủ cho fine-tuning cơ bản (SFT), nhưng few-shot prompting có thể đủ tốt với ít dữ liệu hơn",
      "Quá nhiều — chỉ cần 5 ví dụ",
      "Không liên quan — fine-tuning không cần dữ liệu",
    ],
    correct: 1,
    explanation: "100 ví dụ đủ cho SFT/LoRA. Nhưng trước khi fine-tune, hãy thử few-shot prompting với 5-10 ví dụ — nếu đã đủ tốt thì khỏi fine-tune, tiết kiệm công sức!",
  },
  {
    question: "Nhược điểm lớn nhất của fine-tuning so với prompting?",
    options: [
      "Kết quả kém hơn",
      "Chi phí + công sức: cần dữ liệu, compute, thời gian, và phải re-train khi model mới ra",
      "Không thể dùng cho tiếng Việt",
      "Model fine-tuned chạy chậm hơn",
    ],
    correct: 1,
    explanation: "Fine-tuning tốn dữ liệu (gom + dọn), compute (GPU), thời gian, và khi provider ra model mới (GPT-5, Claude 5), bạn phải fine-tune LẠI. Prompting thì chỉ cần copy-paste prompt sang model mới.",
  },
  {
    question: "RAG (Retrieval-Augmented Generation) thuộc nhóm nào?",
    options: [
      "Fine-tuning — vì nó thay đổi model",
      "Prompting — vì nó đưa thông tin vào context, không thay đổi model",
      "Không thuộc nhóm nào",
      "Cả hai",
    ],
    correct: 1,
    explanation: "RAG = đưa tài liệu liên quan vào prompt trước khi AI trả lời. Model KHÔNG bị thay đổi — RAG là một dạng prompting nâng cao.",
  },
  {
    type: "fill-blank",
    question:
      "Quy tắc chọn chiến lược: khi có ít hơn 10 ví dụ và task phổ biến, hãy chọn {blank}. Khi cần domain chuyên sâu với hơn 1.000 ví dụ chuẩn hoá, hãy chọn {blank}.",
    blanks: [
      { answer: "prompting", accept: ["prompt", "prompt engineering"] },
      { answer: "fine-tuning", accept: ["fine tuning", "finetuning", "ft"] },
    ],
    explanation:
      "Heuristic: thử prompting/few-shot trước vì rẻ và nhanh. Chỉ chuyển sang fine-tuning khi có đủ dữ liệu chất lượng và task quá chuyên biệt để prompting xử lý hiệu quả.",
  },
];

export default function FineTuningVsPromptingTopic() {
  const [currentScenario, setCurrentScenario] = useState(0);
  const [userGuess, setUserGuess] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const scenario = SCENARIOS[currentScenario];
  const isCorrect = userGuess === scenario.answer;

  function handleGuess(guess: string) {
    if (userGuess !== null) return;
    setUserGuess(guess);
    if (guess === scenario.answer) setScore(s => s + 1);
  }

  function nextScenario() {
    if (currentScenario < SCENARIOS.length - 1) {
      setCurrentScenario(i => i + 1);
      setUserGuess(null);
    } else {
      setFinished(true);
    }
  }

  function reset() {
    setCurrentScenario(0);
    setUserGuess(null);
    setScore(0);
    setFinished(false);
  }

  return (
    <>
      {/* ━━━ HOOK ━━━ */}
      <LessonSection step={1} totalSteps={5} label="Thử đoán">
      <PredictionGate
        question="Bạn cần AI viết email khách hàng cho công ty. Nên fine-tune model riêng hay chỉ cần viết prompt tốt?"
        options={[
          "Fine-tune — luôn tốt hơn vì model học style công ty",
          "Prompt — viết prompt rõ ràng với ví dụ mẫu là đủ cho task đơn giản như email",
          "Không cách nào hoạt động — cần lập trình viên viết code riêng",
        ]}
        correct={1}
        explanation="Email khách hàng = task mà LLM đã giỏi sẵn. Chỉ cần prompt tốt (gán vai trò, cho ví dụ style công ty, chỉ rõ giọng văn). Fine-tuning tốn tiền + thời gian mà không cải thiện đáng kể cho task này."
      >
        <p className="text-sm text-muted mt-4">
          Hãy thử phân biệt: 5 kịch bản thực tế — cái nào cần fine-tuning, cái nào prompting là đủ?
        </p>
      </PredictionGate>

      </LessonSection>

{/* ━━━ KHÁM PHÁ — Game phân loại kịch bản ━━━ */}
      <LessonSection step={2} totalSteps={5} label="Khám phá">
      <VisualizationSection>
        <h3 className="text-base font-semibold text-foreground mb-1">
          Prompting hay Fine-tuning?
        </h3>
        <p className="text-sm text-muted mb-4">
          Đọc kịch bản, chọn chiến lược phù hợp.
        </p>

        {!finished ? (
          <>
            {/* Progress */}
            <div className="flex items-center gap-1.5 mb-4">
              {SCENARIOS.map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${
                  i < currentScenario ? "bg-accent" : i === currentScenario ? "bg-accent/50" : "bg-surface"
                }`} />
              ))}
              <span className="text-xs text-muted ml-1">{currentScenario + 1}/{SCENARIOS.length}</span>
            </div>

            {/* Scenario */}
            <div className="rounded-lg bg-surface p-4 mb-4">
              <p className="text-sm text-foreground leading-relaxed">{scenario.question}</p>
            </div>

            {/* Buttons */}
            {userGuess === null ? (
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => handleGuess("prompting")}
                  className="rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/15 px-4 py-3 text-sm font-semibold text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/25 transition-colors">
                  Prompting đủ rồi
                </button>
                <button type="button" onClick={() => handleGuess("fine-tuning")}
                  className="rounded-lg border border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/15 px-4 py-3 text-sm font-semibold text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/25 transition-colors">
                  Cần Fine-tuning
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className={`rounded-lg border p-4 ${
                  isCorrect
                    ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/15"
                    : "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/15"
                }`}>
                  <p className={`text-sm font-semibold mb-1 ${
                    isCorrect ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
                  }`}>
                    {isCorrect ? "Chính xác!" : `Chưa đúng — đáp án: ${scenario.answer === "prompting" ? "Prompting" : "Fine-tuning"}`}
                  </p>
                  <p className="text-sm text-foreground/80">{scenario.reasoning}</p>
                </div>
                <button type="button" onClick={nextScenario}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark transition-colors">
                  {currentScenario < SCENARIOS.length - 1 ? "Kịch bản tiếp" : "Xem kết quả"}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-3xl font-bold text-accent mb-2">{score}/{SCENARIOS.length}</div>
            <p className="text-sm text-muted mb-4">
              {score >= 4 ? "Xuất sắc! Bạn phân biệt rất tốt khi nào cần fine-tuning." :
               score >= 3 ? "Khá tốt! Quy tắc chung: thử prompting trước, fine-tune khi thật cần." :
               "Quy tắc nhớ: prompting cho task đơn giản/phổ biến, fine-tuning cho domain chuyên sâu."}
            </p>
            <button type="button" onClick={reset}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors">
              Chơi lại
            </button>
          </div>
        )}
      </VisualizationSection>

      </LessonSection>

{/* ━━━ AHA MOMENT ━━━ */}
      <LessonSection step={3} totalSteps={5} label="Khám phá">
      <AhaMoment>
        <strong>Prompting</strong>{" "}= &quot;dạy AI bằng hướng dẫn&quot; (nhanh, rẻ, linh hoạt).
        <strong> Fine-tuning</strong>{" "}= &quot;đào tạo AI chuyên gia&quot; (tốn kém, mạnh cho domain specific).
        Luôn thử prompting trước — fine-tune chỉ khi prompting không đủ!
      </AhaMoment>

      </LessonSection>

{/* ━━━ THỬ THÁCH ━━━ */}
      <LessonSection step={4} totalSteps={5} label="Thử thách">
      <InlineChallenge
        question="GPT-5 vừa ra mắt, mạnh hơn GPT-4 nhiều. Bạn đã fine-tune GPT-4 cho task của mình. Muốn dùng GPT-5, bạn cần làm gì?"
        options={[
          "Chỉ đổi tên model — fine-tuning tự chuyển sang GPT-5",
          "Phải fine-tune LẠI trên GPT-5 — mất thêm thời gian và tiền",
          "GPT-5 tự động giỏi hơn mà không cần fine-tune lại",
          "Không thể dùng GPT-5 nếu đã fine-tune GPT-4",
        ]}
        correct={1}
        explanation="Fine-tuning gắn liền với phiên bản model cụ thể. Model mới = fine-tune lại! Đây là nhược điểm lớn — prompting thì chỉ cần copy prompt sang model mới là xong."
      />

      </LessonSection>

{/* ━━━ GIẢI THÍCH ━━━ */}
      <LessonSection step={5} totalSteps={5} label="Giải thích">
      <ExplanationSection>
        <p>
          <TopicLink slug="prompt-engineering">Prompting</TopicLink>{" "}và{" "}
          <TopicLink slug="fine-tuning">Fine-tuning</TopicLink>{" "}là hai chiến lược chính
          để tùy chỉnh LLM cho task cụ thể. Chọn đúng chiến lược giúp tiết kiệm thời gian và tiền bạc.
        </p>

        <div className="overflow-x-auto my-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-3 text-muted font-medium">Tiêu chí</th>
                <th className="text-left py-2 pr-3 text-muted font-medium">Prompting</th>
                <th className="text-left py-2 text-muted font-medium">Fine-tuning</th>
              </tr>
            </thead>
            <tbody className="text-foreground/80">
              <tr className="border-b border-border">
                <td className="py-2 pr-3 font-medium">Chi phí</td>
                <td className="py-2 pr-3">$0 (chỉ tốn API call)</td>
                <td className="py-2">$10 – $10.000+ (GPU, data)</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-3 font-medium">Thời gian</td>
                <td className="py-2 pr-3">Vài phút</td>
                <td className="py-2">Vài giờ → vài ngày</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-3 font-medium">Dữ liệu cần</td>
                <td className="py-2 pr-3">0–10 ví dụ (trong prompt)</td>
                <td className="py-2">100 – 10.000+ ví dụ</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-3 font-medium">Thay đổi model?</td>
                <td className="py-2 pr-3">Không — model giữ nguyên</td>
                <td className="py-2">Có — trọng số thay đổi vĩnh viễn</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 font-medium">Khi model mới ra?</td>
                <td className="py-2 pr-3">Copy prompt → xong</td>
                <td className="py-2">Phải fine-tune lại</td>
              </tr>
            </tbody>
          </table>
        </div>

        <Callout variant="tip" title="Quy trình quyết định">
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Thử <strong>zero-shot prompting</strong>{" "}trước — đủ tốt chưa?</li>
            <li>Nếu chưa → thử <strong>few-shot + RAG</strong></li>
            <li>Nếu vẫn chưa → <strong>fine-tuning</strong>{" "}(<TopicLink slug="lora">LoRA</TopicLink>{" "}nếu ít GPU)</li>
            <li>Task cực kỳ chuyên biệt → <strong>full fine-tuning</strong></li>
          </ol>
        </Callout>

        <CodeBlock language="python" title="decision.py">{`# Bước 1: Thử prompting trước
prompt = """Bạn là chuyên gia y tế.
Phân loại triệu chứng sau: "{symptoms}"
Trả lời: tên bệnh + mức độ nguy hiểm"""

# Bước 2: Nếu chưa đủ → thử RAG
# (đưa tài liệu y khoa vào context)

# Bước 3: Nếu vẫn chưa → fine-tuning với LoRA
from peft import LoraConfig, get_peft_model
peft_config = LoraConfig(r=16, lora_alpha=32)
model = get_peft_model(base_model, peft_config)
trainer.train(dataset)  # 1.000+ ví dụ y tế`}</CodeBlock>
      </ExplanationSection>

      <MiniSummary
        points={[
          "Prompting = hướng dẫn AI bằng prompt (nhanh, rẻ, linh hoạt, không đổi model)",
          "Fine-tuning = huấn luyện AI trên data của bạn (tốn kém, mạnh cho domain chuyên sâu)",
          "Luôn thử prompting + RAG trước — fine-tune chỉ khi thật cần thiết",
          "Nhược điểm fine-tuning: tốn data + compute, phải re-train khi model mới ra",
        ]}
      />

      <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
