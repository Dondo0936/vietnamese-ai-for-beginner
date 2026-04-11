"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, MessageSquare, Wand2 } from "lucide-react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  CodeBlock,
  Callout,
  TabView,
  LaTeX,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "prompt-engineering",
  title: "Prompt Engineering",
  titleVi: "Kỹ thuật viết prompt",
  description:
    "Nghệ thuật thiết kế prompt hiệu quả để hướng dẫn mô hình ngôn ngữ lớn cho ra kết quả mong muốn.",
  category: "llm-concepts",
  tags: ["prompt", "llm", "few-shot", "instruction"],
  difficulty: "beginner",
  relatedSlugs: ["chain-of-thought", "in-context-learning", "temperature"],
  vizType: "interactive",
};

// ─── Dữ liệu minh họa ───

// Mỗi cấp prompt cho cùng một nhiệm vụ, chất lượng output tăng dần
const PROMPT_LEVELS = [
  {
    level: 0,
    label: "Mơ hồ",
    prompt: "Viết gì đó về phở",
    output: "Phở là món ăn ngon. Nhiều người thích ăn phở. Phở có nhiều loại.",
    score: 25,
    issue: "Quá chung chung, không có hướng dẫn cụ thể — AI đoán bừa bạn muốn gì.",
  },
  {
    level: 1,
    label: "Cụ thể hơn",
    prompt: "Viết một đoạn văn 50 từ giới thiệu phở bò Hà Nội cho du khách nước ngoài.",
    output:
      "Phở bò Hà Nội là tinh hoa ẩm thực Việt Nam. Nước dùng được ninh từ xương bò trong 12-24 giờ với quế, hồi, thảo quả tạo hương thơm đặc trưng. Bánh phở mềm mịn cùng thịt bò tái hoặc chín, ăn kèm rau thơm, giá đỗ và tương ớt.",
    score: 65,
    issue: "Tốt hơn nhiều! Nhưng thiếu giọng văn và đối tượng cụ thể.",
  },
  {
    level: 2,
    label: "Có vai trò",
    prompt:
      "Bạn là food blogger nổi tiếng. Viết 50 từ giới thiệu phở bò Hà Nội cho du khách phương Tây lần đầu đến Việt Nam. Giọng văn thân thiện, hấp dẫn.",
    output:
      "Bạn chưa thật sự đến Hà Nội nếu chưa ngồi vỉa hè húp tô phở bò nóng hổi lúc 6 giờ sáng! Nước dùng trong vắt nhưng đậm vị, bánh phở mềm như lụa, thịt bò tái vừa chín tới. Thêm chút tương ớt, vắt chanh — và bạn sẽ hiểu vì sao người Hà Nội ăn phở mỗi ngày mà không bao giờ chán.",
    score: 88,
    issue: "Rất tốt! Có giọng văn, có persona, có đối tượng rõ ràng.",
  },
  {
    level: 3,
    label: "Có ví dụ mẫu",
    prompt: `Bạn là food blogger nổi tiếng. Viết giới thiệu phở bò cho du khách phương Tây.

Ví dụ output tốt:
"Bún chả Hà Nội — thịt nướng than hoa thơm phức, nước chấm chua ngọt hoàn hảo, bún mát lạnh. Obama đã ăn và 'say' ngay lần đầu."

Giọng văn: thân thiện, gợi cảm giác, có chi tiết cảm xúc. Khoảng 50 từ.`,
    output:
      "Phở bò Hà Nội — nước dùng ninh 24 giờ thơm hồi quế, trong vắt như hổ phách. Bánh phở trơn mềm, thịt bò tái hồng nhạt chín dần trong bát nóng. Húp một muỗng, bạn sẽ thấy cả Hà Nội — nhẹ nhàng, sâu lắng, và ấm áp đến ngạc nhiên.",
    score: 96,
    issue: "Xuất sắc! Ví dụ mẫu giúp AI hiểu chính xác phong cách bạn muốn.",
  },
];

// Kỹ thuật prompt (cho tab view)
const TECHNIQUES = [
  {
    label: "Zero-shot",
    prompt: "Phân loại email này là spam hay không spam:\n\"Bạn đã trúng thưởng 1 tỷ đồng! Nhấp vào đây ngay!\"",
    output: "Spam",
    when: "Câu hỏi đơn giản, AI đã biết loại task này.",
  },
  {
    label: "Few-shot",
    prompt: `Phân loại email:
"Hóa đơn tháng 3 của bạn" → Không spam
"Trúng thưởng 1 tỷ!" → Spam
"Lịch họp team ngày mai" → Không spam

"Bạn được chọn nhận iPhone miễn phí!" →`,
    output: "Spam",
    when: "AI cần hiểu format output hoặc task lạ — cho vài ví dụ mẫu.",
  },
  {
    label: "Chain-of-Thought",
    prompt: `Phân loại email này. Suy nghĩ từng bước:
1. Xác định từ khóa đáng ngờ
2. Kiểm tra xem có yêu cầu hành động khẩn cấp không
3. Đánh giá xem nội dung có thực tế không

Email: "Bạn được chọn nhận iPhone miễn phí! Nhấp ngay trước khi hết hạn!"`,
    output: `1. Từ khóa đáng ngờ: "miễn phí", "nhấp ngay", "hết hạn"
2. Yêu cầu hành động khẩn cấp: Có — "nhấp ngay trước khi hết hạn"
3. Thực tế: Không — iPhone miễn phí không có thật
→ Kết luận: SPAM`,
    when: "Task cần lập luận logic, tính toán, hoặc phân tích nhiều bước.",
  },
  {
    label: "System Prompt",
    prompt: `[System] Bạn là chuyên gia an ninh mạng với 20 năm kinh nghiệm. Khi phân tích email, hãy đánh giá theo 3 tiêu chí: kỹ thuật lừa đảo, mức độ nguy hiểm, và khuyến nghị hành động.

[User] Phân tích email: "Tài khoản ngân hàng của bạn sẽ bị khóa. Xác nhận thông tin tại đây: bit.ly/xc9ak"`,
    output: `**Kỹ thuật lừa đảo:** Phishing cổ điển — tạo urgency (sắp bị khóa), dùng URL rút gọn để ẩn đích thật.
**Mức độ nguy hiểm:** CAO — nhắm vào thông tin ngân hàng.
**Khuyến nghị:** KHÔNG nhấp link. Liên hệ ngân hàng qua kênh chính thức. Báo cáo email này.`,
    when: "Cần output chuyên sâu theo góc nhìn cụ thể — gán vai trò cho AI.",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Bạn muốn AI viết email xin việc. Prompt nào cho kết quả tốt nhất?",
    options: [
      "Viết email xin việc",
      "Viết email xin việc vị trí data scientist tại FPT, nhấn mạnh kinh nghiệm Python và ML, giọng chuyên nghiệp, khoảng 200 từ",
      "Viết email hay",
      "Email xin việc, ngắn thôi",
    ],
    correct: 1,
    explanation:
      "Prompt tốt có: vai trò cụ thể, ngữ cảnh, yêu cầu chi tiết, giọng văn, và độ dài mong muốn.",
  },
  {
    question: "Kỹ thuật nào phù hợp nhất khi AI cần giải bài toán nhiều bước?",
    options: [
      "Zero-shot — hỏi thẳng",
      "Few-shot — cho ví dụ",
      "Chain-of-Thought — yêu cầu suy nghĩ từng bước",
      "System prompt — gán vai trò",
    ],
    correct: 2,
    explanation:
      "Chain-of-Thought buộc AI trình bày từng bước suy luận, giảm lỗi đáng kể ở bài toán logic và tính toán.",
  },
  {
    question: "Tại sao few-shot prompting hiệu quả?",
    options: [
      "Vì AI thích đọc ví dụ",
      "Vì ví dụ giúp AI hiểu chính xác format và phong cách output mong muốn",
      "Vì thêm nhiều chữ hơn = AI làm tốt hơn",
      "Vì AI học lại từ ví dụ trong prompt",
    ],
    correct: 1,
    explanation:
      "Ví dụ mẫu hoạt động như 'bản thiết kế' cho output — AI pattern-match theo format và style bạn cho, không phải 'học' từ chúng.",
  },
];

export default function PromptEngineeringTopic() {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [revealedLevels, setRevealedLevels] = useState(new Set([0]));
  const current = PROMPT_LEVELS[currentLevel];

  const advanceLevel = useCallback(() => {
    if (currentLevel < PROMPT_LEVELS.length - 1) {
      const next = currentLevel + 1;
      setCurrentLevel(next);
      setRevealedLevels((prev) => new Set([...prev, next]));
    }
  }, [currentLevel]);

  return (
    <>
      {/* ━━━ HOOK ━━━ */}
      <PredictionGate
        question="Bạn nhờ AI viết email xin việc. Hai prompt dưới đây, prompt nào cho kết quả tốt hơn?"
        options={[
          "A: \"Viết email xin việc\"",
          "B: \"Viết email xin việc vị trí data analyst tại Shopee, nhấn mạnh kỹ năng SQL và Python, giọng chuyên nghiệp nhưng thân thiện, khoảng 200 từ\"",
          "Cả hai cho kết quả như nhau",
        ]}
        correct={1}
        explanation="Prompt B cụ thể hơn rất nhiều — có vị trí, công ty, kỹ năng, giọng văn, độ dài. AI không đọc được suy nghĩ của bạn, nên bạn phải nói rõ bạn muốn gì. Đó chính là Prompt Engineering!"
      >
        <p className="text-sm text-muted mt-4">
          Hãy xem sự khác biệt khi bạn cải thiện prompt <strong className="text-foreground">từng bước</strong> — từ mơ hồ đến xuất sắc.
        </p>
      </PredictionGate>

      {/* ━━━ KHÁM PHÁ — Xem prompt cải thiện từng bước ━━━ */}
      <VisualizationSection>
        <h3 className="text-base font-semibold text-foreground mb-1">
          Cải thiện prompt từng bước
        </h3>
        <p className="text-sm text-muted mb-4">
          Cùng một nhiệm vụ: &quot;viết về phở&quot;. Xem output thay đổi khi prompt tốt hơn.
        </p>

        {/* Thanh tiến trình các cấp */}
        <div className="flex items-center gap-2 mb-6">
          {PROMPT_LEVELS.map((lvl, i) => (
            <button
              key={i}
              type="button"
              disabled={!revealedLevels.has(i)}
              onClick={() => revealedLevels.has(i) && setCurrentLevel(i)}
              className={`flex-1 rounded-lg py-2 text-xs font-medium transition-all ${
                i === currentLevel
                  ? "bg-accent text-white shadow-sm"
                  : revealedLevels.has(i)
                  ? "bg-surface text-muted hover:text-foreground cursor-pointer"
                  : "bg-surface text-tertiary cursor-not-allowed opacity-50"
              }`}
            >
              {lvl.label}
            </button>
          ))}
        </div>

        {/* Prompt + Output */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentLevel}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {/* Prompt */}
            <div className="rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/15 p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare size={14} className="text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                  Prompt
                </span>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {current.prompt}
              </p>
            </div>

            {/* Output */}
            <div className="rounded-lg border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/15 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-green-600 dark:text-green-400" />
                <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">
                  Output của AI
                </span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {current.output}
              </p>
            </div>

            {/* Điểm chất lượng */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-surface overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: current.score > 85 ? "#059669" : current.score > 60 ? "#D97706" : "#DC2626",
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${current.score}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-sm font-bold text-accent w-12 text-right">{current.score}%</span>
            </div>

            {/* Nhận xét */}
            <p className="text-xs text-muted italic">{current.issue}</p>
          </motion.div>
        </AnimatePresence>

        {/* Nút tiến tới */}
        {currentLevel < PROMPT_LEVELS.length - 1 && (
          <button
            type="button"
            onClick={advanceLevel}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark transition-colors"
          >
            <Wand2 size={14} />
            Cải thiện prompt
            <ArrowRight size={14} />
          </button>
        )}
      </VisualizationSection>

      {/* ━━━ AHA MOMENT ━━━ */}
      <AhaMoment>
        Bạn vừa thấy cùng một nhiệm vụ, chỉ bằng cách viết prompt tốt hơn, chất lượng
        output tăng từ <strong>25%</strong> lên <strong>96%</strong>.
        Đó chính là sức mạnh của <strong>Prompt Engineering</strong> — nghệ thuật
        giao tiếp hiệu quả với AI.
      </AhaMoment>

      {/* ━━━ ĐI SÂU — 4 kỹ thuật chính ━━━ */}
      <VisualizationSection>
        <h3 className="text-base font-semibold text-foreground mb-3">
          4 kỹ thuật prompt phổ biến nhất
        </h3>
        <p className="text-sm text-muted mb-4">
          Mỗi kỹ thuật phù hợp với một loại task khác nhau. Nhấp vào tab để xem ví dụ cụ thể.
        </p>

        <TabView
          tabs={TECHNIQUES.map((tech) => ({
            label: tech.label,
            content: (
              <div className="space-y-4">
                {/* Khi nào dùng */}
                <div className="flex items-center gap-2 rounded-lg bg-surface p-3">
                  <span className="text-xs font-medium text-accent">Khi nào dùng:</span>
                  <span className="text-xs text-muted">{tech.when}</span>
                </div>

                {/* Prompt */}
                <div className="rounded-lg border border-border bg-card p-4">
                  <span className="text-[10px] font-semibold text-tertiary uppercase tracking-wider block mb-2">
                    Prompt
                  </span>
                  <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                    {tech.prompt}
                  </p>
                </div>

                {/* Output */}
                <div className="rounded-lg border border-accent/30 bg-accent-light p-4">
                  <span className="text-[10px] font-semibold text-accent uppercase tracking-wider block mb-2">
                    Output
                  </span>
                  <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                    {tech.output}
                  </p>
                </div>
              </div>
            ),
          }))}
        />
      </VisualizationSection>

      {/* ━━━ THỬ THÁCH ━━━ */}
      <InlineChallenge
        question="Bạn muốn AI giải bài toán: 'Một cửa hàng giảm giá 20%, sau đó giảm thêm 10%. Tổng giảm giá là bao nhiêu phần trăm?' Kỹ thuật nào phù hợp nhất?"
        options={[
          "Zero-shot — hỏi thẳng đáp án",
          "Few-shot — cho vài ví dụ giảm giá",
          "Chain-of-Thought — yêu cầu tính từng bước",
          "System prompt — gán vai giáo viên toán",
        ]}
        correct={2}
        explanation="Chain-of-Thought phù hợp nhất cho bài toán nhiều bước! AI sẽ tính: giá sau giảm 20% = 80%, rồi giảm 10% nữa = 80% × 90% = 72%. Tổng giảm = 28%, không phải 30%!"
      />

      {/* ━━━ GIẢI THÍCH ━━━ */}
      <ExplanationSection>
        <p>
          <strong>Prompt Engineering</strong> là kỹ năng thiết kế chỉ dẫn (prompt) sao cho
          LLM hiểu chính xác bạn muốn gì và trả lời đúng format, phong cách, nội dung bạn cần.
        </p>

        <Callout variant="insight" title="Tại sao prompt quan trọng đến vậy?">
          LLM không đọc được suy nghĩ của bạn. Nó chỉ thấy đúng những gì bạn viết.
          Prompt mơ hồ = output mơ hồ. Prompt rõ ràng = output chính xác.
          Một prompt tốt có thể thay thế cả giờ fine-tuning model.
        </Callout>

        <p><strong>Công thức prompt hiệu quả:</strong></p>
        <div className="rounded-lg bg-surface p-4 my-3">
          <p className="text-sm font-semibold text-foreground">
            <strong>Vai trò</strong> + <strong>Nhiệm vụ cụ thể</strong> + <strong>Ngữ cảnh</strong> + <strong>Format output</strong> + <strong>Ví dụ mẫu</strong> (nếu cần)
          </p>
        </div>

        <Callout variant="tip" title="5 quy tắc vàng">
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li><strong>Cụ thể:</strong> &quot;Viết 200 từ&quot; tốt hơn &quot;viết ngắn&quot;</li>
            <li><strong>Có ví dụ:</strong> Cho AI thấy output bạn muốn</li>
            <li><strong>Từng bước:</strong> Yêu cầu &quot;suy nghĩ từng bước&quot; cho task phức tạp</li>
            <li><strong>Gán vai:</strong> &quot;Bạn là chuyên gia...&quot; giúp AI đi vào đúng chế độ</li>
            <li><strong>Lặp lại:</strong> Không có prompt hoàn hảo lần đầu — thử, xem kết quả, cải thiện</li>
          </ol>
        </Callout>

        <CodeBlock language="python" title="prompt_template.py">{`# Template prompt chuẩn
prompt = f"""
[Vai trò] Bạn là {role}.
[Nhiệm vụ] Hãy {task}.
[Ngữ cảnh] {context}
[Format] Trả lời dưới dạng {format}.
[Ví dụ]
Input: {example_input}
Output: {example_output}

[Câu hỏi thực tế]
Input: {real_input}
Output:"""

# Gửi đến API
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    messages=[{"role": "user", "content": prompt}]
)`}</CodeBlock>
      </ExplanationSection>

      {/* ━━━ TÓM TẮT ━━━ */}
      <MiniSummary
        points={[
          "Prompt Engineering là kỹ năng giao tiếp hiệu quả với AI — cụ thể, rõ ràng, có cấu trúc",
          "4 kỹ thuật chính: Zero-shot (hỏi thẳng), Few-shot (cho ví dụ), Chain-of-Thought (từng bước), System prompt (gán vai trò)",
          "Prompt tốt = Vai trò + Nhiệm vụ cụ thể + Ngữ cảnh + Format output + Ví dụ mẫu",
          "Lặp lại là chìa khóa — không có prompt hoàn hảo lần đầu, luôn thử và cải thiện",
        ]}
      />

      {/* ━━━ KIỂM TRA ━━━ */}
      <QuizSection questions={quizQuestions} />
    </>
  );
}
