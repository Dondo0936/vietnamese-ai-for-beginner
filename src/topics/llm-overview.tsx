"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Zap } from "lucide-react";
import {
  PredictionGate,
  StepReveal,
  BuildUp,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
  LessonSection,} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "llm-overview",
  title: "Large Language Models",
  titleVi: "Mô hình ngôn ngữ lớn",
  description:
    "Hiểu bản chất và nguyên lý hoạt động của các mô hình ngôn ngữ lớn — nền tảng của ChatGPT, Claude, Gemini.",
  category: "llm-concepts",
  tags: ["llm", "transformer", "architecture", "overview"],
  difficulty: "beginner",
  relatedSlugs: ["transformer", "self-attention", "context-window", "prompt-engineering"],
  vizType: "interactive",
};

// ─── Trò chơi đoán từ tiếp theo ───
const PREDICTION_ROUNDS = [
  {
    context: "Thủ đô của Việt Nam là",
    options: ["Hà Nội", "Đà Nẵng", "Sài Gòn", "Huế"],
    correct: 0,
    difficulty: "dễ",
    explanation: "Với ngữ cảnh rõ ràng, bạn (và LLM) đều tự tin chọn đúng.",
  },
  {
    context: "Sáng nay trời mưa nên tôi mang theo",
    options: ["ô", "kính râm", "kem chống nắng", "quần short"],
    correct: 0,
    difficulty: "dễ",
    explanation: "Ngữ cảnh 'trời mưa' thu hẹp lựa chọn xuống rất ít từ hợp lý.",
  },
  {
    context: "Cô ấy học giỏi toán nhưng",
    options: ["không thích văn", "rất cao", "thích bơi", "có xe mới"],
    correct: 0,
    difficulty: "trung bình",
    explanation: "Từ 'nhưng' gợi ý một sự tương phản — LLM nhận ra pattern này từ hàng tỷ câu đã đọc.",
  },
  {
    context: "Anh ấy đặt hoa trên bàn, rót rượu, và chờ cô ấy đến để",
    options: ["cầu hôn", "ăn sáng", "đi làm", "sửa máy tính"],
    correct: 0,
    difficulty: "khó",
    explanation: "Với chuỗi manh mối (hoa + rượu + chờ), bạn suy luận ra ý định. LLM làm điều này bằng attention — nhìn TẤT CẢ các từ trước đó cùng lúc.",
  },
];

// ─── Dữ liệu timeline LLM ───
const LLM_TIMELINE = [
  { year: "2017", name: "Transformer", params: "65M", note: "Kiến trúc nền tảng ra đời" },
  { year: "2018", name: "GPT-1", params: "117M", note: "Đọc sách để dự đoán từ tiếp theo" },
  { year: "2018", name: "BERT", params: "340M", note: "Đọc hai chiều, hiểu ngữ cảnh sâu" },
  { year: "2020", name: "GPT-3", params: "175B", note: "Bắt đầu in-context learning" },
  { year: "2023", name: "GPT-4", params: "~1.7T", note: "Multimodal, suy luận mạnh" },
  { year: "2024", name: "Claude 3", params: "—", note: "200K context, an toàn, trung thực" },
  { year: "2025", name: "Claude 4", params: "—", note: "Coding agent, suy luận sâu" },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Bản chất, LLM làm gì trong mỗi bước sinh văn bản?",
    options: [
      "Tìm câu trả lời trong cơ sở dữ liệu",
      "Dự đoán từ tiếp theo dựa trên xác suất",
      "Dịch câu hỏi sang ngôn ngữ máy",
      "Copy-paste từ Internet",
    ],
    correct: 1,
    explanation:
      "LLM là máy dự đoán xác suất từ tiếp theo. Mỗi bước, nó tính P(từ | các từ trước đó) rồi chọn từ có xác suất cao nhất (hoặc sampling).",
  },
  {
    question: "Tại sao LLM cần hàng tỷ tham số?",
    options: [
      "Để chạy nhanh hơn",
      "Để lưu trữ mọi trang web",
      "Để nắm bắt các pattern ngôn ngữ phức tạp từ dữ liệu khổng lồ",
      "Để tiết kiệm điện",
    ],
    correct: 2,
    explanation:
      "Mỗi tham số là một 'nút điều chỉnh' giúp mô hình nắm bắt pattern ngôn ngữ. Ngôn ngữ cực kỳ phức tạp, nên cần rất nhiều tham số.",
  },
  {
    question:
      "LLM có thể viết code, dịch thuật, sáng tác — nhưng nó được dạy trực tiếp những kỹ năng này không?",
    options: [
      "Có, mỗi kỹ năng được dạy riêng",
      "Không — chúng 'nổi lên' từ việc dự đoán từ tiếp theo ở quy mô lớn",
      "Có, bằng cách lập trình thủ công",
      "Không — chúng copy từ Internet",
    ],
    correct: 1,
    explanation:
      "Đây là emergent abilities — khả năng nổi lên. LLM chỉ được dạy dự đoán từ tiếp theo, nhưng khi đủ lớn và đủ dữ liệu, nó tự phát triển khả năng phức tạp.",
  },
];

export default function LLMOverviewTopic() {
  const [round, setRound] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(
    new Array(PREDICTION_ROUNDS.length).fill(null)
  );
  const [gameFinished, setGameFinished] = useState(false);

  const currentRound = PREDICTION_ROUNDS[round];
  const userScore = userAnswers.filter(
    (a, i) => a === PREDICTION_ROUNDS[i].correct
  ).length;

  const handleAnswer = useCallback(
    (optionIdx: number) => {
      if (userAnswers[round] !== null) return;
      setUserAnswers((prev) => {
        const next = [...prev];
        next[round] = optionIdx;
        return next;
      });
    },
    [round, userAnswers]
  );

  const nextRound = useCallback(() => {
    if (round < PREDICTION_ROUNDS.length - 1) {
      setRound((r) => r + 1);
    } else {
      setGameFinished(true);
    }
  }, [round]);

  const answered = userAnswers[round] !== null;
  const isCorrect = userAnswers[round] === currentRound.correct;

  return (
    <>
      {/* ━━━ HOOK ━━━ */}
      <PredictionGate
        question="Hoàn thành câu: 'Sáng nay tôi uống một ly ___'. Bạn đã suy nghĩ gì khi đoán từ còn thiếu?"
        options={[
          "Tôi nhớ lại thói quen buổi sáng",
          "Tôi dựa vào ngữ cảnh của câu để đoán từ phù hợp nhất",
          "Tôi chọn ngẫu nhiên",
        ]}
        correct={1}
        explanation="Bạn dùng ngữ cảnh ('sáng', 'uống', 'ly') để thu hẹp lựa chọn xuống vài từ hợp lý: cà phê, trà, sữa... LLM hoạt động CHÍNH XÁC như vậy — dự đoán từ tiếp theo dựa trên xác suất."
      >
        <p className="text-sm text-muted mt-4">
          Hãy thử đóng vai LLM — đoán từ tiếp theo trong 4 câu, từ dễ đến khó.
        </p>
      </PredictionGate>

      {/* ━━━ KHÁM PHÁ — Trò chơi dự đoán từ tiếp theo ━━━ */}
      <VisualizationSection>
        <h3 className="text-base font-semibold text-foreground mb-1">
          Bạn là LLM: Đoán từ tiếp theo
        </h3>
        <p className="text-sm text-muted mb-4">
          Đọc đoạn text, chọn từ tiếp theo phù hợp nhất. Bạn đang làm đúng việc mà LLM làm 100 tỷ lần khi huấn luyện!
        </p>

        {!gameFinished ? (
          <>
            {/* Thanh tiến trình */}
            <div className="flex items-center gap-2 mb-5">
              {PREDICTION_ROUNDS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    i < round
                      ? "bg-accent"
                      : i === round
                      ? "bg-accent/50"
                      : "bg-surface"
                  }`}
                />
              ))}
              <span className="text-xs text-muted ml-1">
                {round + 1}/{PREDICTION_ROUNDS.length}
              </span>
            </div>

            {/* Câu đang đoán */}
            <AnimatePresence mode="wait">
              <motion.div
                key={round}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                {/* Ngữ cảnh */}
                <div className="rounded-lg bg-surface p-4 mb-4">
                  <span className="text-xs font-medium text-tertiary block mb-1">
                    Độ khó: {currentRound.difficulty}
                  </span>
                  <p className="text-lg text-foreground font-medium">
                    {currentRound.context}{" "}
                    <span className="inline-block w-20 border-b-2 border-accent" />
                  </p>
                </div>

                {/* Lựa chọn */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {currentRound.options.map((opt, i) => {
                    let cls =
                      "rounded-lg border px-4 py-3 text-sm font-medium text-left transition-all ";
                    if (answered) {
                      if (i === currentRound.correct)
                        cls +=
                          "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400";
                      else if (i === userAnswers[round])
                        cls +=
                          "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400";
                      else cls += "border-border text-tertiary opacity-50";
                    } else {
                      cls +=
                        "border-border text-foreground hover:border-accent cursor-pointer";
                    }

                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleAnswer(i)}
                        disabled={answered}
                        className={cls}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {/* Giải thích sau khi chọn */}
                {answered && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <p className="text-xs text-muted mb-3 leading-relaxed">
                      {isCorrect ? "Chính xác! " : "Chưa đúng. "}
                      {currentRound.explanation}
                    </p>
                    <button
                      type="button"
                      onClick={nextRound}
                      className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark transition-colors"
                    >
                      {round < PREDICTION_ROUNDS.length - 1
                        ? "Câu tiếp theo"
                        : "Xem kết quả"}
                    </button>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </>
        ) : (
          /* Kết quả trò chơi */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-4"
          >
            <div className="text-3xl font-bold text-accent mb-2">
              {userScore}/{PREDICTION_ROUNDS.length}
            </div>
            <p className="text-sm text-muted mb-4">
              {userScore === 4
                ? "Hoàn hảo! Bạn đoán từ giỏi như một LLM!"
                : userScore >= 3
                ? "Rất tốt! Bạn và LLM cùng dùng ngữ cảnh để đoán."
                : "Không sao — LLM cũng mất hàng tỷ lần luyện tập!"}
            </p>
            <p className="text-xs text-muted">
              LLM làm chính xác điều này — nhưng trên <strong>hàng nghìn tỷ câu</strong>,
              với <strong>hàng tỷ tham số</strong>, và chọn từ trong
              <strong> hàng chục nghìn từ</strong> cùng lúc.
            </p>
          </motion.div>
        )}
      </VisualizationSection>

      {/* ━━━ AHA MOMENT ━━━ */}
      <AhaMoment>
        Bạn vừa làm chính xác điều mà <strong>Mô hình Ngôn ngữ Lớn (LLM)</strong>{" "}làm:
        nhìn vào ngữ cảnh, suy ra từ tiếp theo phù hợp nhất. Chỉ từ nhiệm vụ đơn giản
        &quot;dự đoán từ tiếp theo&quot; lặp lại hàng nghìn tỷ lần, LLM phát triển khả
        năng viết, dịch, sáng tạo, và suy luận!
      </AhaMoment>

      {/* ━━━ ĐI SÂU — Xây dựng một LLM ━━━ */}
      <VisualizationSection>
        <h3 className="text-base font-semibold text-foreground mb-3">
          Hành trình xây dựng một LLM
        </h3>
        <p className="text-sm text-muted mb-4">
          Từ dữ liệu thô đến ChatGPT — qua 3 giai đoạn chính. Nhấn &quot;Tiếp tục&quot; để xem từng bước.
        </p>

        <StepReveal
          labels={[
            "Giai đoạn 1: Thu thập dữ liệu",
            "Giai đoạn 2: Pre-training — Dự đoán từ tiếp theo",
            "Giai đoạn 3: Post-training — Dạy AI trả lời tốt",
            "Kết quả: LLM sẵn sàng sử dụng",
          ]}
        >
          {/* Giai đoạn 1 */}
          <div className="rounded-lg bg-surface p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">1</div>
              <span className="text-sm font-semibold text-foreground">Thu thập dữ liệu</span>
            </div>
            <p className="text-sm text-muted mb-3">
              Gom gần như toàn bộ văn bản trên Internet: sách, Wikipedia, báo, code, forum...
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: "Web crawl", size: "~300TB" },
                { label: "Sách", size: "~11TB" },
                { label: "Wikipedia", size: "~20GB" },
                { label: "Code", size: "~1TB" },
              ].map((d) => (
                <div key={d.label} className="rounded-md bg-card border border-border p-2 text-center">
                  <span className="text-xs font-medium text-foreground block">{d.label}</span>
                  <span className="text-[10px] text-tertiary">{d.size}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Giai đoạn 2 */}
          <div className="rounded-lg bg-surface p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">2</div>
              <span className="text-sm font-semibold text-foreground">Pre-training: Dự đoán từ tiếp theo</span>
            </div>
            <p className="text-sm text-muted mb-3">
              Mô hình đọc hàng nghìn tỷ từ. Với mỗi vị trí, nó phải đoán từ tiếp theo.
              Sai → điều chỉnh trọng số. Lặp lại hàng triệu lần.
            </p>
            <div className="rounded-md bg-card border border-border p-3 mb-2">
              <LaTeX block>{"P(w_t \\mid w_1, w_2, ..., w_{t-1}) = \\text{softmax}(\\text{Transformer}(w_1, ..., w_{t-1}))"}</LaTeX>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md bg-card border border-border p-2">
                <span className="text-xs font-medium text-foreground block">Chi phí</span>
                <span className="text-[10px] text-tertiary">$2M — $100M+</span>
              </div>
              <div className="rounded-md bg-card border border-border p-2">
                <span className="text-xs font-medium text-foreground block">Thời gian</span>
                <span className="text-[10px] text-tertiary">Tuần → Tháng</span>
              </div>
              <div className="rounded-md bg-card border border-border p-2">
                <span className="text-xs font-medium text-foreground block">GPU</span>
                <span className="text-[10px] text-tertiary">Hàng nghìn</span>
              </div>
            </div>
          </div>

          {/* Giai đoạn 3 */}
          <div className="rounded-lg bg-surface p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">3</div>
              <span className="text-sm font-semibold text-foreground">Post-training: Dạy AI trả lời tốt</span>
            </div>
            <p className="text-sm text-muted mb-3">
              Sau pre-training, model biết ngôn ngữ nhưng chưa biết cách <em>trả lời</em>.
              Cần thêm 2 bước:
            </p>
            <div className="space-y-2">
              <div className="rounded-md bg-card border border-border p-3">
                <span className="text-xs font-semibold text-foreground block mb-1">
                  SFT (Supervised Fine-Tuning)
                </span>
                <span className="text-xs text-muted">
                  Huấn luyện trên hàng chục nghìn cặp (câu hỏi, câu trả lời tốt) do con người viết.
                </span>
              </div>
              <div className="rounded-md bg-card border border-border p-3">
                <span className="text-xs font-semibold text-foreground block mb-1">
                  RLHF (Reinforcement Learning from Human Feedback)
                </span>
                <span className="text-xs text-muted">
                  Con người chấm điểm các câu trả lời, model học ưu tiên câu trả lời được đánh giá cao hơn.
                </span>
              </div>
            </div>
          </div>

          {/* Kết quả */}
          <div className="rounded-lg border-2 border-accent bg-accent-light p-4 text-center">
            <Brain size={24} className="mx-auto text-accent mb-2" />
            <p className="text-sm font-semibold text-foreground mb-1">
              LLM sẵn sàng!
            </p>
            <p className="text-xs text-muted">
              Từ &quot;máy dự đoán từ&quot; → biết trả lời câu hỏi, viết code, dịch thuật,
              sáng tạo — tất cả từ việc luyện tập dự đoán từ tiếp theo ở quy mô khổng lồ.
            </p>
          </div>
        </StepReveal>
      </VisualizationSection>

      {/* ━━━ TIMELINE ━━━ */}
      <VisualizationSection>
        <h3 className="text-base font-semibold text-foreground mb-3">
          Cuộc đua LLM: 2017 → Nay
        </h3>
        <div className="space-y-2">
          {LLM_TIMELINE.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3 rounded-lg bg-surface p-3"
            >
              <span className="text-xs tabular-nums text-tertiary w-10 shrink-0">{item.year}</span>
              <div className="h-2 w-2 rounded-full bg-accent shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-foreground">{item.name}</span>
                {item.params !== "—" && (
                  <span className="ml-2 text-xs text-tertiary">{item.params} params</span>
                )}
              </div>
              <span className="text-[10px] text-muted hidden sm:block max-w-[180px] text-right">
                {item.note}
              </span>
            </motion.div>
          ))}
        </div>
      </VisualizationSection>

      {/* ━━━ THỬ THÁCH ━━━ */}
      <InlineChallenge
        question="LLM chỉ được dạy dự đoán từ tiếp theo. Vậy tại sao nó có thể viết thơ, giải toán, viết code — những thứ chưa bao giờ được dạy trực tiếp?"
        options={[
          "Nó lén copy từ Internet khi trả lời",
          "Các khả năng này 'nổi lên' tự nhiên khi model đủ lớn và đủ dữ liệu",
          "Lập trình viên code tay từng khả năng",
          "Nó chỉ giả vờ — thực ra chỉ là pattern matching đơn giản",
        ]}
        correct={1}
        explanation="Đây gọi là 'emergent abilities' — khả năng nổi lên. Khi dự đoán từ tiếp theo ở quy mô hàng tỷ tham số và hàng nghìn tỷ từ, model phải 'hiểu' logic, ngữ pháp, suy luận, code... để đoán chính xác. Hiểu biết này không được dạy trực tiếp — nó tự phát triển."
      />

      {/* ━━━ GIẢI THÍCH ━━━ */}
      <ExplanationSection>
        <p>
          <strong>Mô hình Ngôn ngữ Lớn (LLM)</strong> là hệ thống AI được huấn luyện
          trên lượng văn bản khổng lồ để hiểu và sinh ngôn ngữ tự nhiên.
          Bản chất của nó đơn giản đến bất ngờ:
        </p>

        <Callout variant="insight" title="Một câu tóm tắt toàn bộ LLM">
          LLM là một <strong>máy dự đoán xác suất từ tiếp theo</strong> cực kỳ phức tạp.
          Cho trước &quot;Thủ đô của Việt Nam là&quot;, nó tính xác suất cho MỌI từ trong
          từ điển (~50.000 từ) và chọn từ có xác suất cao nhất.
        </Callout>

        <p>Công thức cốt lõi:</p>
        <LaTeX block>{"P(w_{\\text{next}} \\mid w_1, w_2, ..., w_n) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right) V"}</LaTeX>
        <p>
          Đây là cơ chế <strong>self-attention</strong>{" "}trong Transformer — cho phép mỗi từ
          &quot;nhìn&quot; mọi từ khác để hiểu ngữ cảnh trước khi dự đoán.
        </p>

        <Callout variant="tip" title="Tại sao lớn = giỏi?">
          Ngôn ngữ con người cực kỳ phức tạp. Để nắm bắt mọi sắc thái — mỉa mai,
          ẩn dụ, logic, hài hước — cần rất nhiều tham số (nút điều chỉnh).
          GPT-4 có ~1.7 nghìn tỷ tham số. Não người có ~100 nghìn tỷ synapse.
        </Callout>

        <p><strong>Giới hạn của LLM:</strong></p>
        <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
          <li><strong>Ảo giác (Hallucination):</strong> LLM có thể tự tin nói sai vì nó dự đoán từ &quot;nghe hợp lý&quot;, không phải &quot;đúng sự thật&quot;</li>
          <li><strong>Cửa sổ ngữ cảnh:</strong> Chỉ xử lý được một lượng text nhất định (128K–1M tokens)</li>
          <li><strong>Training cutoff:</strong> Không biết sự kiện xảy ra sau thời điểm huấn luyện</li>
          <li><strong>Không thật sự &quot;hiểu&quot;:</strong> Dự đoán pattern, không có trải nghiệm hay ý thức</li>
        </ul>

        <CodeBlock language="python" title="llm_basics.py">{`from anthropic import Anthropic

client = Anthropic()

# LLM sinh text bằng cách dự đoán từ tiếp theo
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=200,
    messages=[{
        "role": "user",
        "content": "Thủ đô của Việt Nam là"
    }]
)

print(response.content[0].text)
# → "Hà Nội. Hà Nội nằm ở..."`}</CodeBlock>
      </ExplanationSection>

      {/* ━━━ TÓM TẮT ━━━ */}
      <MiniSummary
        points={[
          "LLM = máy dự đoán từ tiếp theo, được huấn luyện trên hàng nghìn tỷ từ",
          "Kiến trúc nền tảng là Transformer với cơ chế self-attention",
          "Xây dựng qua 3 giai đoạn: thu thập dữ liệu → pre-training → post-training (SFT + RLHF)",
          "Các khả năng phức tạp (viết code, suy luận, sáng tạo) 'nổi lên' từ quy mô, không được dạy trực tiếp",
          "Giới hạn chính: hallucination, context window, training cutoff",
        ]}
      />

      {/* ━━━ KIỂM TRA ━━━ */}
      <QuizSection questions={quizQuestions} />
    </>
  );
}
