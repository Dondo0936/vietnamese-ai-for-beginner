"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
  ToggleCompare,
  LessonSection,
  TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "top-k-top-p",
  title: "Top-K & Top-P Sampling",
  titleVi: "Top-K và Top-P — Lấy mẫu có chọn lọc",
  description:
    "Hai kỹ thuật lọc từ vựng trước khi chọn token tiếp theo, giúp kiểm soát chất lượng và đa dạng.",
  category: "llm-concepts",
  tags: ["top-k", "top-p", "nucleus-sampling", "generation"],
  difficulty: "advanced",
  relatedSlugs: ["temperature", "llm-overview", "context-window"],
  vizType: "interactive",
};

// ─── Dữ liệu xác suất ───
const ALL_WORDS = [
  { word: "phở", prob: 0.30 },
  { word: "cơm", prob: 0.22 },
  { word: "bún", prob: 0.15 },
  { word: "bánh mì", prob: 0.10 },
  { word: "xôi", prob: 0.08 },
  { word: "cháo", prob: 0.05 },
  { word: "mì", prob: 0.04 },
  { word: "nem", prob: 0.03 },
  { word: "trứng", prob: 0.02 },
  { word: "gió", prob: 0.01 },
];

const COLORS = ["#0D9488", "#2563EB", "#7C3AED", "#D97706", "#DC2626", "#6B7280", "#6B7280", "#6B7280", "#6B7280", "#6B7280"];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Top-K = 3 nghĩa là gì?",
    options: [
      "AI chỉ sinh đúng 3 từ",
      "AI chỉ CÂN NHẮC 3 từ có xác suất cao nhất, bỏ qua phần còn lại",
      "AI sinh 3 câu trả lời khác nhau",
      "AI chạy 3 lần",
    ],
    correct: 1,
    explanation: "Top-K = 3 lọc ra 3 từ xác suất cao nhất (ví dụ: phở 30%, cơm 22%, bún 15%), bỏ qua 7 từ còn lại. AI chỉ chọn trong 3 từ này.",
  },
  {
    question: "Top-P (nucleus sampling) = 0.9 nghĩa là gì?",
    options: [
      "Chọn 90% từ trong từ điển",
      "Chọn nhóm từ nhỏ nhất mà tổng xác suất ≥ 90%",
      "Xác suất mỗi từ giảm 90%",
      "AI hoạt động ở 90% công suất",
    ],
    correct: 1,
    explanation: "Top-P = 0.9 nghĩa là: sắp xếp theo xác suất giảm dần, lấy từ đầu tiên cho đến khi tổng ≥ 0.9. Số từ được chọn THAY ĐỔI tùy phân phối!",
  },
  {
    question: "Khi phân phối rất nhọn (1 từ chiếm 95%), Top-P = 0.9 sẽ chọn bao nhiêu từ?",
    options: [
      "Vẫn chọn nhiều từ (cố định)",
      "Chỉ chọn 1 từ duy nhất (vì nó đã ≥ 90%)",
      "Chọn 90% tổng số từ",
      "Không chọn từ nào",
    ],
    correct: 1,
    explanation: "Đây là ưu điểm của Top-P so với Top-K: khi model tự tin (1 từ 95%), Top-P chỉ chọn 1 từ. Khi model không chắc, Top-P mở rộng tự động. Top-K luôn chọn K từ bất kể model tự tin hay không.",
  },
  {
    type: "fill-blank",
    question:
      "Top-{blank} giữ đúng một số lượng cố định {blank} token xác suất cao nhất. Top-{blank} giữ nhóm nhỏ nhất có tổng xác suất ≥ {blank}.",
    blanks: [
      { answer: "K", accept: ["k"] },
      { answer: "k", accept: ["K"] },
      { answer: "P", accept: ["p"] },
      { answer: "p", accept: ["P"] },
    ],
    explanation:
      "Top-K lọc theo k (số lượng) token đầu bảng. Top-P (nucleus sampling) lọc theo ngưỡng xác suất tích lũy p — linh hoạt hơn vì số token giữ lại thay đổi tùy độ nhọn của phân phối.",
  },
];

export default function TopKTopPTopic() {
  const [topK, setTopK] = useState(5);
  const [topP, setTopP] = useState(0.85);
  const [mode, setMode] = useState<"k" | "p">("k");

  // Top-K filtering
  const topKWords = useMemo(() => ALL_WORDS.slice(0, topK), [topK]);

  // Top-P filtering
  const topPWords = useMemo(() => {
    let cumProb = 0;
    const result: typeof ALL_WORDS = [];
    for (const w of ALL_WORDS) {
      if (cumProb >= topP) break;
      result.push(w);
      cumProb += w.prob;
    }
    return result;
  }, [topP]);

  const activeWords = mode === "k" ? topKWords : topPWords;
  const excludedWords = ALL_WORDS.filter(w => !activeWords.includes(w));

  // Renormalize probs
  const totalActiveProb = activeWords.reduce((s, w) => s + w.prob, 0);

  return (
    <>
      {/* ━━━ HOOK ━━━ */}
      <LessonSection step={1} totalSteps={6} label="Thử đoán">
      <PredictionGate
        question="AI đang chọn từ tiếp theo. Có 50.000 từ trong từ điển. Nên cho AI chọn từ TẤT CẢ 50.000 từ hay chỉ từ vài từ xác suất cao nhất?"
        options={[
          "Tất cả — để AI tự do sáng tạo",
          "Chỉ vài từ xác suất cao — để tránh chọn từ vô nghĩa",
          "Không quan trọng — kết quả như nhau",
        ]}
        correct={1}
        explanation="Nếu chọn từ tất cả 50.000, AI có thể chọn từ xác suất 0.001% — vô nghĩa! Top-K và Top-P lọc bớt, chỉ giữ nhóm từ hợp lý nhất. Giống như chọn nhà hàng: bạn không xem TẤT CẢ 10.000 quán trên Grab mà chỉ xem top đánh giá cao."
      >
        <p className="text-sm text-muted mt-4">
          Hãy kéo thanh trượt để xem Top-K và Top-P lọc từ như thế nào.
        </p>
      </PredictionGate>

      </LessonSection>

{/* ━━━ KHÁM PHÁ ━━━ */}
      <LessonSection step={2} totalSteps={6} label="Khám phá">
      <VisualizationSection topicSlug={metadata.slug}>
        <h3 className="text-base font-semibold text-foreground mb-1">
          Lọc từ trước khi chọn
        </h3>
        <p className="text-sm text-muted mb-3">
          Câu: &quot;Sáng nay tôi ăn ___&quot; — 10 từ ứng viên với xác suất khác nhau.
        </p>

        {/* Toggle K vs P */}
        <div className="flex items-center justify-center gap-1 mb-4">
          <button
            type="button"
            onClick={() => setMode("k")}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
              mode === "k" ? "bg-accent text-white" : "text-muted hover:text-foreground"
            }`}
          >
            Top-K
          </button>
          <button
            type="button"
            onClick={() => setMode("p")}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
              mode === "p" ? "bg-accent text-white" : "text-muted hover:text-foreground"
            }`}
          >
            Top-P
          </button>
        </div>

        {/* Slider */}
        <div className="max-w-md mx-auto mb-4">
          {mode === "k" ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">K = {topK}</span>
                <span className="text-xs text-muted">Giữ {topK} từ xác suất cao nhất</span>
              </div>
              <input
                type="range" min={1} max={10} step={1} value={topK}
                onChange={e => setTopK(parseInt(e.target.value))}
                className="w-full h-2 rounded-full appearance-none bg-surface accent-accent cursor-pointer"
              />
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">P = {topP.toFixed(2)}</span>
                <span className="text-xs text-muted">Giữ từ cho đến tổng xác suất ≥ {(topP * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range" min={0.1} max={1.0} step={0.05} value={topP}
                onChange={e => setTopP(parseFloat(e.target.value))}
                className="w-full h-2 rounded-full appearance-none bg-surface accent-accent cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Biểu đồ */}
        <svg viewBox="0 0 500 200" className="w-full max-w-lg mx-auto">
          {ALL_WORDS.map((w, i) => {
            const barW = 40;
            const gap = 10;
            const x = 10 + i * (barW + gap);
            const maxH = 140;
            const h = w.prob * maxH * 3;
            const y = 160 - h;
            const isActive = activeWords.includes(w);

            return (
              <g key={w.word}>
                <motion.rect
                  x={x} y={y} width={barW} height={h} rx={3}
                  fill={isActive ? COLORS[i] : "var(--bg-surface-hover)"}
                  opacity={isActive ? 1 : 0.3}
                  initial={false}
                  animate={{ opacity: isActive ? 1 : 0.3 }}
                  transition={{ duration: 0.2 }}
                />
                {/* Percentage */}
                <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={9} fontWeight={600}
                  fill={isActive ? "var(--text-primary)" : "var(--text-tertiary)"}>
                  {(w.prob * 100).toFixed(0)}%
                </text>
                {/* Word label */}
                <text x={x + barW / 2} y={178} textAnchor="middle" fontSize={8}
                  fill={isActive ? "var(--text-secondary)" : "var(--text-tertiary)"}>
                  {w.word}
                </text>
                {/* X mark for excluded */}
                {!isActive && (
                  <text x={x + barW / 2} y={y + h / 2 + 4} textAnchor="middle" fontSize={14}
                    fill="var(--text-tertiary)" opacity={0.5}>
                    ✕
                  </text>
                )}
              </g>
            );
          })}

          {/* Divider line */}
          {mode === "k" && topK < 10 && (
            <line
              x1={10 + topK * 50 - 5} y1={10} x2={10 + topK * 50 - 5} y2={165}
              stroke="var(--accent)" strokeWidth={2} strokeDasharray="4,4"
            />
          )}
        </svg>

        {/* Stats */}
        <div className="flex items-center justify-center gap-6 mt-2">
          <span className="text-xs text-accent font-medium">
            ✓ {activeWords.length} từ được giữ ({(totalActiveProb * 100).toFixed(1)}% xác suất)
          </span>
          <span className="text-xs text-tertiary">
            ✕ {excludedWords.length} từ bị loại
          </span>
        </div>
      </VisualizationSection>

      </LessonSection>

{/* ━━━ AHA MOMENT ━━━ */}
      <LessonSection step={3} totalSteps={6} label="Khám phá">
      <AhaMoment>
        <strong>Top-K</strong>{" "}giữ đúng K từ xác suất cao nhất (cố định).
        <strong> Top-P</strong>{" "}(nucleus sampling) giữ từ cho đến khi tổng xác suất ≥ P (linh hoạt).
        Cả hai đều lọc bớt &quot;rác&quot; trước khi AI chọn — nhưng Top-P thông minh hơn vì
        tự điều chỉnh theo mức tự tin của model.
      </AhaMoment>

      </LessonSection>

{/* ━━━ ĐI SÂU — So sánh K vs P ━━━ */}
      <LessonSection step={4} totalSteps={6} label="Đi sâu">
        <h3 className="text-base font-semibold text-foreground mb-3">
          Khi nào Top-K gặp vấn đề?
        </h3>

        <ToggleCompare
          labelA="Model tự tin (1 từ 85%)"
          labelB="Model không chắc (đều nhau)"
          childA={
            <div className="space-y-2">
              <p className="text-sm text-foreground">Phân phối: &quot;phở&quot; = 85%, &quot;cơm&quot; = 8%, &quot;bún&quot; = 4%, còn lại &lt; 1%</p>
              <p className="text-xs text-muted">
                <strong>Top-K = 5:</strong>{" "}Giữ 5 từ — nhưng 3 từ cuối gần như vô nghĩa (0.5%, 0.3%...). Lãng phí!
              </p>
              <p className="text-xs text-accent">
                <strong>Top-P = 0.9:</strong>{" "}Chỉ giữ &quot;phở&quot; (85% đã ≥ 90% → chỉ 1 từ). Hiệu quả!
              </p>
            </div>
          }
          childB={
            <div className="space-y-2">
              <p className="text-sm text-foreground">Phân phối: &quot;phở&quot; = 15%, &quot;cơm&quot; = 14%, &quot;bún&quot; = 13%... đều nhau</p>
              <p className="text-xs text-muted">
                <strong>Top-K = 5:</strong>{" "}Giữ 5 từ — nhưng bỏ sót nhiều từ xác suất gần bằng!
              </p>
              <p className="text-xs text-accent">
                <strong>Top-P = 0.9:</strong>{" "}Giữ 7-8 từ (cần nhiều từ mới đạt 90%). Linh hoạt!
              </p>
            </div>
          }
          description="Top-P tự điều chỉnh số từ tùy mức tự tin — ít từ khi chắc chắn, nhiều từ khi không chắc."
        />

      </LessonSection>

{/* ━━━ THỬ THÁCH ━━━ */}
      <LessonSection step={5} totalSteps={6} label="Thử thách">
      <InlineChallenge
        question="Trong thực tế, API như Claude và GPT thường dùng cả temperature LẪN top_p. Nếu đặt temperature = 0, top_p = 0.9 — cái nào thắng?"
        options={[
          "Top-P thắng — vẫn chọn ngẫu nhiên trong 90%",
          "Temperature thắng — temp = 0 luôn chọn từ xác suất cao nhất, bất kể top_p",
          "Cả hai kết hợp — kết quả khác hoàn toàn",
          "Chúng mâu thuẫn, API báo lỗi",
        ]}
        correct={1}
        explanation="Temperature = 0 khiến phân phối thành argmax (1 từ = 100%), nên Top-P không có gì để lọc thêm. Trong thực tế, hầu hết API khuyên: chỉnh temperature HOẶC top_p, không nên chỉnh cả hai."
      />

      </LessonSection>

{/* ━━━ GIẢI THÍCH ━━━ */}
      <LessonSection step={6} totalSteps={6} label="Giải thích">
      <ExplanationSection>
        <p>
          <strong>Top-K</strong>{" "}và <strong>Top-P</strong>{" "}là hai kỹ thuật lọc từ vựng
          trước khi chọn token tiếp theo, bổ sung cho{" "}
          <TopicLink slug="temperature">temperature</TopicLink>
          . Khác với{" "}
          <TopicLink slug="beam-search">beam search</TopicLink>
          {" "}(deterministic, khám phá nhiều nhánh song song), top-k/top-p giữ tính ngẫu nhiên nhưng loại bỏ các token xác suất thấp để tránh output vô nghĩa.
        </p>

        <Callout variant="insight" title="Pipeline sinh text đầy đủ">
          <p className="text-sm">Logits → <strong>Temperature</strong>{" "}(điều chỉnh phân phối)
          → <strong>Top-K/Top-P</strong>{" "}(lọc từ) → <strong>Sampling</strong>{" "}(chọn ngẫu nhiên từ nhóm đã lọc)</p>
        </Callout>

        <p><strong>So sánh:</strong></p>
        <div className="overflow-x-auto my-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-muted font-medium">Tiêu chí</th>
                <th className="text-left py-2 pr-4 text-muted font-medium">Top-K</th>
                <th className="text-left py-2 text-muted font-medium">Top-P</th>
              </tr>
            </thead>
            <tbody className="text-foreground/80">
              <tr className="border-b border-border">
                <td className="py-2 pr-4">Cách lọc</td>
                <td className="py-2 pr-4">Giữ đúng K từ</td>
                <td className="py-2">Giữ từ đến khi tổng ≥ P</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-4">Số từ</td>
                <td className="py-2 pr-4">Cố định</td>
                <td className="py-2">Linh hoạt (thay đổi theo phân phối)</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Ưu điểm</td>
                <td className="py-2 pr-4">Đơn giản, dễ hiểu</td>
                <td className="py-2">Thông minh hơn — tự điều chỉnh</td>
              </tr>
            </tbody>
          </table>
        </div>

        <CodeBlock language="python" title="sampling.py">{`response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=100,
    # Chỉ chỉnh MỘT trong hai:
    temperature=0.8,  # Hoặc...
    top_p=0.9,        # ...cái này (không nên cả hai)
    # top_k=40,       # Ít dùng hơn top_p
    messages=[{"role": "user", "content": "Viết thơ về Hà Nội"}]
)`}</CodeBlock>

        <Callout variant="tip" title="Khuyến nghị thực tế">
          Hầu hết trường hợp, chỉ cần chỉnh <strong>temperature</strong>.
          Nếu cần kiểm soát thêm, dùng <strong>top_p</strong>{" "}(linh hoạt hơn top_k).
          Không nên chỉnh cả temperature lẫn top_p — chúng có thể xung đột.
        </Callout>
      </ExplanationSection>

      <MiniSummary
        points={[
          "Top-K giữ đúng K từ xác suất cao nhất (cố định) — đơn giản nhưng cứng nhắc",
          "Top-P (nucleus sampling) giữ từ đến khi tổng xác suất ≥ P — linh hoạt theo mức tự tin",
          "Pipeline: Logits → Temperature → Top-K/P → Sampling — mỗi bước lọc thêm",
          "Thực tế: chỉnh temperature HOẶC top_p, không nên chỉnh cả hai cùng lúc",
        ]}
      />

      <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
