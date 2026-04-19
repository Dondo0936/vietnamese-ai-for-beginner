"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Shuffle,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  BookOpenCheck,
} from "lucide-react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  LaTeX,
  TopicLink,
  StepReveal,
  CollapsibleDetail,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

/* ════════════════════════════════════════════════════════════════════════
   METADATA
   ════════════════════════════════════════════════════════════════════════ */
export const metadata: TopicMeta = {
  slug: "cross-validation",
  title: "Cross-Validation",
  titleVi: "Kiểm định chéo — xoay vòng 5 đề thi thử",
  description:
    "Một đề thi thử may rủi không nói lên gì. Chia đề thành nhiều phần và xoay vòng — đó là kiểm định chéo.",
  category: "classic-ml",
  tags: ["evaluation", "model-selection", "theory"],
  difficulty: "beginner",
  relatedSlugs: ["train-val-test", "overfitting-underfitting", "bias-variance"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

const FOLD_COLORS = [
  "#3b82f6",
  "#f97316",
  "#22c55e",
  "#8b5cf6",
  "#ef4444",
  "#0ea5e9",
  "#eab308",
  "#ec4899",
  "#14b8a6",
  "#a855f7",
];

/* ════════════════════════════════════════════════════════════════════════
   DATA
   ════════════════════════════════════════════════════════════════════════ */

const K_OPTIONS = [3, 5, 7, 10] as const;
type KValue = (typeof K_OPTIONS)[number];

function getScores(k: KValue): number[] {
  const table: Record<KValue, number[]> = {
    3: [0.83, 0.87, 0.85],
    5: [0.85, 0.88, 0.82, 0.9, 0.86],
    7: [0.84, 0.87, 0.83, 0.89, 0.86, 0.88, 0.85],
    10: [0.85, 0.87, 0.82, 0.9, 0.86, 0.84, 0.89, 0.83, 0.88, 0.85],
  };
  return table[k];
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function std(arr: number[]): number {
  if (arr.length === 0) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}

function pct(x: number): string {
  return `${(x * 100).toFixed(1)}%`;
}

/* ════════════════════════════════════════════════════════════════════════
   QUIZ
   ════════════════════════════════════════════════════════════════════════ */
const quizQuestions: QuizQuestion[] = [
  {
    question: "Tại sao cross-validation tốt hơn chia train/test một lần?",
    options: [
      "Cross-validation chạy nhanh hơn",
      "Mỗi điểm dữ liệu đều được dùng để test đúng 1 lần → ước lượng ổn định hơn, ít phụ thuộc vào cú cắt may rủi",
      "Cross-validation luôn cho accuracy cao hơn",
      "Cross-validation giúp mô hình học nhiều hơn",
    ],
    correct: 1,
    explanation:
      "Chia 1 lần → kết quả phụ thuộc vào 'may rủi' của lần cắt đó. Cross-validation thử K lần cắt khác nhau → trung bình ổn định hơn. Đồng thời, mọi mẫu đều được dùng để đánh giá.",
  },
  {
    question: "K=5 hay K=10 tốt hơn?",
    options: [
      "K=10 luôn tốt hơn vì test nhiều hơn",
      "Tuỳ: K=5 rẻ hơn, K=10 ước lượng ổn định hơn nhưng chậm gấp đôi. K=5 là mặc định phổ biến.",
      "K=5 luôn tốt hơn vì tập train lớn hơn",
      "Không khác gì nhau",
    ],
    correct: 1,
    explanation:
      "K nhỏ → mỗi tập train nhỏ hơn → bias cao hơn. K lớn → test có ít mẫu → variance ước lượng cao hơn. K=5 hoặc K=10 là lựa chọn cân bằng. Thực tế thường bắt đầu với K=5.",
  },
  {
    question:
      "Leave-One-Out CV (K = n) phù hợp nhất với trường hợp nào?",
    options: [
      "Dataset hàng triệu mẫu",
      "Dataset rất nhỏ (vài chục mẫu) và thuật toán huấn luyện rất nhanh",
      "Luôn luôn — càng nhiều fold càng tốt",
      "Chuỗi thời gian",
    ],
    correct: 1,
    explanation:
      "Leave-One-Out = K = n: mỗi lần chỉ bỏ ra 1 mẫu làm test. Bias thấp nhất nhưng chi phí cực cao. Chỉ khả thi khi: (1) dataset nhỏ nên n × thời gian 1 lần train vẫn chịu được, (2) dataset quá nhỏ khiến K-Fold thường có fold kém ổn định.",
  },
  {
    type: "fill-blank",
    question:
      "Với 5-Fold CV, mỗi điểm dữ liệu được dùng làm tập test đúng {blank} lần. Kết quả cuối là {blank} của 5 lượt đánh giá.",
    blanks: [
      { answer: "1", accept: ["một", "1 lần"] },
      { answer: "trung bình", accept: ["mean", "giá trị trung bình"] },
    ],
    explanation:
      "Đây là tính chất cốt lõi của K-Fold: mỗi mẫu test đúng 1 lần (không bỏ qua, không lặp). Kết quả cuối là trung bình của K lượt → ổn định hơn chia 1 lần.",
  },
];

/* ════════════════════════════════════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════════════════════════════════════ */
export default function CrossValidationTopic() {
  const [k, setK] = useState<KValue>(5);
  const [activeFold, setActiveFold] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const scores = useMemo(() => getScores(k), [k]);
  const avgScore = useMemo(() => mean(scores), [scores]);
  const stdScore = useMemo(() => std(scores), [scores]);

  /* Auto-play animation */
  useEffect(() => {
    if (!isAnimating) return;
    const interval = setInterval(() => {
      setActiveFold((prev) => {
        const next = prev + 1;
        if (next >= k) {
          setIsAnimating(false);
          return 0;
        }
        return next;
      });
    }, 1100);
    return () => clearInterval(interval);
  }, [isAnimating, k]);

  const handleStart = useCallback(() => {
    setActiveFold(0);
    setIsAnimating(true);
  }, []);
  const handleStop = useCallback(() => setIsAnimating(false), []);
  const handleReset = useCallback(() => {
    setIsAnimating(false);
    setActiveFold(0);
  }, []);

  const handleKChange = useCallback((kv: KValue) => {
    setK(kv);
    setActiveFold(0);
    setIsAnimating(false);
  }, []);

  return (
    <>
      {/* ═══════════ STEP 1 — HOOK + PREDICTION ═══════════ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Hook">
        <div className="rounded-2xl border border-border bg-card p-6 mb-5">
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <BookOpenCheck size={20} className="text-accent" />
            Một đề thi thử không nói lên gì
          </h3>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Bạn làm <strong>một</strong> đề thi thử và được 9 điểm. Bạn có chắc mình giỏi thật
            không? Biết đâu hôm đó may đề dễ. Hôm sau làm đề khác được 5. Rồi 7. Rồi 8. Chỉ khi
            làm <strong>nhiều đề khác nhau và tính trung bình</strong>, bạn mới biết thực lực.
          </p>
          <p className="text-sm text-foreground/85 leading-relaxed mt-3">
            Đó chính là cross-validation trong ML.{" "}
            <strong>Kiểm định chéo chia dữ liệu thành K phần bằng nhau, rồi xoay vòng</strong>:
            mỗi lượt một phần làm &ldquo;đề thi&rdquo;, K-1 phần còn lại làm &ldquo;sách ôn&rdquo;.
            K điểm đánh giá &rArr; trung bình = thực lực mô hình.
          </p>
        </div>

        <PredictionGate
          question="Bạn chia dataset thành train/test một lần rồi đo accuracy được 88%. Bạn chia lại (random seed khác) — lần này được 82%. Chuyện gì đang xảy ra?"
          options={[
            "Mô hình bị lỗi, cần huấn luyện lại từ đầu",
            "Việc chia dữ liệu là ngẫu nhiên, kết quả dao động theo cú chia — một số đo duy nhất không đáng tin",
            "Accuracy luôn dao động ngẫu nhiên, không có ý nghĩa",
            "Cần thêm dữ liệu mới",
          ]}
          correct={1}
          explanation="Chia một lần là 'một đề thi'. Kết quả phụ thuộc vào tập test rơi vào điểm nào. Cross-validation giải quyết bằng cách đo K lần với K tập test khác nhau, rồi báo cáo (trung bình ± độ lệch chuẩn). Nếu std lớn &rArr; báo động về tính ổn định."
        />
      </LessonSection>

      {/* ═══════════ STEP 2 — REVEAL: K-Fold interactive ═══════════ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Bên dưới là minh hoạ K-Fold. Chọn <strong>K</strong> để đổi số phần, bấm từng fold để
          xem phần nào đang làm test, hoặc bấm <strong>Play</strong> để xem xoay vòng tự động.
        </p>

        <VisualizationSection topicSlug={metadata.slug}>
          <div className="space-y-5">
            {/* K selector */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs font-semibold text-muted">Số fold (K) =</span>
              {K_OPTIONS.map((kv) => (
                <button
                  key={kv}
                  type="button"
                  onClick={() => handleKChange(kv)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                    k === kv
                      ? "bg-accent text-white"
                      : "border border-border text-muted hover:text-foreground hover:border-accent/50"
                  }`}
                >
                  {kv}
                </button>
              ))}
            </div>

            {/* Main K-Fold diagram */}
            <svg
              viewBox="0 0 520 340"
              className="mx-auto w-full max-w-2xl rounded-lg border border-border bg-background"
              role="img"
              aria-label={`${k}-fold cross-validation diagram, fold ${activeFold + 1} đang test`}
            >
              <text
                x={260}
                y={24}
                fontSize={13}
                fill="currentColor"
                className="text-foreground"
                textAnchor="middle"
                fontWeight={700}
              >
                {k}-Fold CV — Fold F{activeFold + 1} đang làm test
              </text>

              {/* Column headers */}
              {Array.from({ length: k }, (_, block) => {
                const blockW = Math.min(62, 380 / k - 4);
                const bx = 48 + block * (blockW + 4);
                return (
                  <text
                    key={`hdr-${block}`}
                    x={bx + blockW / 2}
                    y={46}
                    fontSize={9}
                    textAnchor="middle"
                    fill="currentColor"
                    className="text-muted"
                  >
                    Phần {block + 1}
                  </text>
                );
              })}

              {/* Fold rows */}
              {scores.map((score, fold) => {
                const y = 58 + fold * (220 / k);
                const isActive = fold === activeFold;
                const blockW = Math.min(62, 380 / k - 4);
                const foldColour = FOLD_COLORS[fold % FOLD_COLORS.length];

                return (
                  <g
                    key={fold}
                    className="cursor-pointer"
                    onClick={() => {
                      setActiveFold(fold);
                      setIsAnimating(false);
                    }}
                  >
                    <motion.g
                      animate={{ opacity: isActive ? 1 : 0.45 }}
                      transition={{ duration: 0.25 }}
                    >
                      <text
                        x={14}
                        y={y + 15}
                        fontSize={11}
                        fill="currentColor"
                        className="text-muted"
                        fontWeight={isActive ? 700 : 500}
                      >
                        F{fold + 1}
                      </text>

                      {Array.from({ length: k }, (_, block) => {
                        const bx = 48 + block * (blockW + 4);
                        const isTest = block === fold;
                        return (
                          <g key={block}>
                            <motion.rect
                              x={bx}
                              y={y}
                              width={blockW}
                              height={22}
                              rx={5}
                              fill={isTest ? foldColour : "#64748b"}
                              stroke={isTest ? foldColour : "transparent"}
                              strokeWidth={isTest ? 2 : 0}
                              initial={false}
                              animate={{
                                opacity: isTest
                                  ? isActive
                                    ? 0.92
                                    : 0.55
                                  : isActive
                                    ? 0.2
                                    : 0.1,
                              }}
                              transition={{ duration: 0.35 }}
                            />
                            <text
                              x={bx + blockW / 2}
                              y={y + 15}
                              fontSize={9}
                              fill={isTest ? "#fff" : "#94a3b8"}
                              textAnchor="middle"
                              fontWeight={isTest ? 700 : 500}
                            >
                              {isTest ? "Test" : "Train"}
                            </text>
                          </g>
                        );
                      })}

                      <text
                        x={52 + k * (blockW + 4)}
                        y={y + 15}
                        fontSize={11}
                        fill={foldColour}
                        fontWeight={700}
                      >
                        {pct(score)}
                      </text>
                    </motion.g>
                  </g>
                );
              })}

              {/* Divider */}
              <line
                x1={48}
                y1={58 + scores.length * (220 / k) + 8}
                x2={48 + k * (Math.min(62, 380 / k - 4) + 4) + 40}
                y2={58 + scores.length * (220 / k) + 8}
                stroke="currentColor"
                className="text-border"
                strokeWidth={1}
              />

              <text
                x={260}
                y={310}
                fontSize={14}
                fill="#22c55e"
                textAnchor="middle"
                fontWeight={800}
              >
                Trung bình: {pct(avgScore)} ± {pct(stdScore)}
              </text>
              <text
                x={260}
                y={328}
                fontSize={10}
                fill="currentColor"
                className="text-muted"
                textAnchor="middle"
              >
                K = {k} fold, mỗi mẫu test đúng 1 lần, train (K-1) lần
              </text>
            </svg>

            {/* Per-fold bar chart */}
            <div className="rounded-lg border border-border bg-surface/50 p-4">
              <h4 className="mb-3 text-sm font-semibold text-foreground">
                Điểm từng fold
              </h4>
              <div className="flex items-end gap-2 h-24">
                {scores.map((score, i) => {
                  const heightPct = ((score - 0.6) / 0.4) * 100;
                  const foldColour = FOLD_COLORS[i % FOLD_COLORS.length];
                  const isActive = i === activeFold;
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <span
                        className="text-[10px] font-semibold tabular-nums"
                        style={{ color: foldColour }}
                      >
                        {pct(score)}
                      </span>
                      <motion.div
                        className="w-full rounded-t-md"
                        style={{
                          backgroundColor: foldColour,
                          height: `${Math.max(6, heightPct)}%`,
                        }}
                        animate={{
                          opacity: isActive ? 1 : 0.45,
                          scaleY: isActive ? 1.05 : 1,
                        }}
                        transition={{ duration: 0.3 }}
                      />
                      <span className="text-[10px] text-muted">F{i + 1}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                <span className="inline-block h-0.5 w-6 bg-green-500" />
                <span>
                  Trung bình: {pct(avgScore)} (độ lệch chuẩn ± {pct(stdScore)})
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {!isAnimating ? (
                <button
                  type="button"
                  onClick={handleStart}
                  className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  <Play size={14} /> Xoay vòng tự động
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStop}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
                >
                  <Pause size={14} /> Dừng
                </button>
              )}
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                <RotateCcw size={14} /> Đặt lại
              </button>
            </div>

            <p className="text-xs text-muted text-center leading-relaxed italic">
              Quan sát: K càng lớn, mỗi phần (fold) càng nhỏ, nhưng tổng số lượt huấn luyện
              cũng tăng theo &rArr; tốn thời gian hơn.
            </p>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ═══════════ STEP 3 — AHA ═══════════ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>Một đề không nói lên gì — K đề cho ta trung bình đáng tin.</strong> Mỗi mẫu
            trong dataset đều được thử làm &ldquo;đề thi&rdquo; đúng 1 lần, và &ldquo;sách
            ôn&rdquo; (K-1) lần. Điểm cuối cùng không phải một con số mà là{" "}
            <strong>cặp (trung bình, độ lệch chuẩn)</strong>.
          </p>
          <p className="mt-3">
            Độ lệch chuẩn thấp = mô hình ổn định. Độ lệch chuẩn cao = có fold đặc biệt dễ/khó
            → nên kiểm tra dữ liệu có cân đối không.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ═══════════ STEP 4 — DEEPEN: 20-row dataset animated through 5-fold ═══════════ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Mổ xẻ từng lượt">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Bên dưới là dataset 20 hàng, chia thành 5 fold (4 hàng mỗi fold). Bấm{" "}
          <strong>&ldquo;Tiếp tục&rdquo;</strong> để xem 5 lượt huấn luyện &mdash; mỗi lượt,
          một fold chuyển thành test (màu), 4 fold còn lại là train (xám).
        </p>

        <StepReveal
          labels={[
            "Lượt 1 — Fold 1 test",
            "Lượt 2 — Fold 2 test",
            "Lượt 3 — Fold 3 test",
            "Lượt 4 — Fold 4 test",
            "Lượt 5 — Fold 5 test",
            "Tổng kết 5 lượt",
          ]}
        >
          {[
            <FoldRound key="r1" testFold={0} score={0.85} />,
            <FoldRound key="r2" testFold={1} score={0.88} />,
            <FoldRound key="r3" testFold={2} score={0.82} />,
            <FoldRound key="r4" testFold={3} score={0.9} />,
            <FoldRound key="r5" testFold={4} score={0.86} />,
            <div
              key="sum"
              className="rounded-xl border border-border bg-surface/60 p-4 space-y-3"
            >
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <TrendingUp size={16} className="text-accent" />
                Tổng kết: 5 điểm xoay vòng = (85 + 88 + 82 + 90 + 86) / 5 = 86.2%
              </h4>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Mỗi hàng dữ liệu đã được thử nghiệm đúng 1 lần. Ước lượng độ chính xác thực tế:{" "}
                <strong className="text-green-600">86.2% ± 2.6%</strong>. So với &ldquo;chia
                một lần được 88%&rdquo;, con số trung bình này đáng tin hơn vì nó đã &ldquo;trải
                qua&rdquo; 5 cách chia khác nhau.
              </p>
              <div className="grid grid-cols-5 gap-2">
                {[0.85, 0.88, 0.82, 0.9, 0.86].map((s, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-border bg-card p-2 text-center"
                  >
                    <p className="text-[10px] text-muted">Lượt {i + 1}</p>
                    <p
                      className="text-sm font-bold tabular-nums"
                      style={{ color: FOLD_COLORS[i] }}
                    >
                      {pct(s)}
                    </p>
                  </div>
                ))}
              </div>
            </div>,
          ]}
        </StepReveal>
      </LessonSection>

      {/* ═══════════ STEP 5 — CHALLENGE ═══════════ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Leave-One-Out CV (LOO) là K-Fold với K = n (n là số mẫu dataset). Khi nào dùng LOO hợp lý nhất?"
          options={[
            "Khi có hàng triệu mẫu để tận dụng GPU",
            "Khi dataset rất nhỏ (vài chục mẫu) và thuật toán huấn luyện nhanh, ta cần tận dụng tối đa dữ liệu cho train",
            "Luôn luôn — càng nhiều fold càng tốt",
            "Khi muốn accuracy cao hơn",
          ]}
          correct={1}
          explanation="LOO = n lần huấn luyện (mỗi lần giữ lại đúng 1 mẫu làm test). Ưu: bias thấp nhất, tận dụng tối đa dữ liệu cho train. Nhược: cực kỳ tốn (n lần train). Chỉ dùng khi: (1) dataset quá nhỏ — K-Fold thường cho fold kém ổn định, (2) thuật toán huấn luyện rẻ (ví dụ linear regression có công thức đóng). Với dataset lớn, K = 5 hoặc 10 là đủ."
        />

        <div className="mt-5">
          <InlineChallenge
            question="Bạn chạy 5-Fold CV và nhận được scores [95%, 50%, 93%, 48%, 94%]. Trung bình là 76%. Điểm đáng chú ý là gì?"
            options={[
              "Mô hình tốt — 76% là điểm thực tế",
              "Độ lệch chuẩn cực lớn (dao động 48–95%) — có fold dễ và fold khó bất thường, có thể do phân bố lớp không đều hoặc có data leakage cục bộ",
              "Cần tăng K lên 10 để &ldquo;sửa&rdquo;",
              "Mô hình cần huấn luyện thêm epoch",
            ]}
            correct={1}
            explanation="Chênh lệch ~47% giữa các fold là cờ đỏ. Trung bình (76%) che giấu vấn đề. Cần: (1) kiểm tra phân bố lớp giữa các fold → dùng Stratified K-Fold nếu mất cân bằng, (2) kiểm tra data leakage — có thể một fold có mẫu 'dễ' vì chung nhóm với train, (3) xem xét xem các mẫu gây fold 'xấu' có điểm gì đặc biệt không."
          />
        </div>
      </LessonSection>

      {/* ═══════════ STEP 6 — EXPLAIN ═══════════ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích">
        <ExplanationSection>
          <p className="leading-relaxed">
            <strong>K-Fold Cross-Validation</strong> là cách &ldquo;nhân bản&rdquo; phép đo hiệu
            năng. Dataset được chia thành K phần bằng nhau. Ta lặp K lần: mỗi lần, 1 phần làm
            test, K-1 phần còn lại làm train. K điểm đánh giá &rArr; trung bình và độ lệch
            chuẩn.
          </p>

          <LaTeX block>
            {"\\text{CV Score} = \\frac{1}{K}\\sum_{k=1}^{K} \\text{Score}_k"}
          </LaTeX>

          <p className="text-sm text-muted mt-2">
            Kèm theo là độ lệch chuẩn, đo tính ổn định của ước lượng:
          </p>

          <LaTeX block>
            {"\\text{CV Std} = \\sqrt{\\frac{1}{K}\\sum_{k=1}^{K} (\\text{Score}_k - \\overline{\\text{Score}})^2}"}
          </LaTeX>

          <h4 className="text-sm font-semibold text-foreground mt-5 mb-2">
            Các biến thể thường gặp (ngắn gọn)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <VariantCard
              color="#3b82f6"
              title="K-Fold thường"
              desc="Chia ngẫu nhiên K phần đều nhau. Mặc định cho hồi quy, phân loại cân bằng."
            />
            <VariantCard
              color="#f97316"
              title="Stratified K-Fold"
              desc="Giữ tỷ lệ lớp trong mỗi fold. Bắt buộc cho phân loại mất cân bằng."
            />
            <VariantCard
              color="#8b5cf6"
              title="Leave-One-Out"
              desc="K = n (mỗi lần 1 mẫu test). Dùng khi dataset rất nhỏ."
            />
            <VariantCard
              color="#22c55e"
              title="Time Series Split"
              desc="Luôn train quá khứ, test tương lai. Bắt buộc cho dữ liệu có thứ tự thời gian."
            />
            <VariantCard
              color="#ef4444"
              title="Group K-Fold"
              desc="Giữ các mẫu cùng nhóm (bệnh nhân, user) trong cùng một fold — tránh data leakage."
            />
            <VariantCard
              color="#14b8a6"
              title="Repeated K-Fold"
              desc="Chạy K-Fold nhiều lần với seed khác → ước lượng cực kỳ ổn định, tính được khoảng tin cậy."
            />
          </div>

          <Callout variant="warning" title="Cạm bẫy — data leakage trong pipeline">
            <p>
              KHÔNG được fit scaler / feature selection / imputer trên{" "}
              <strong>toàn bộ dữ liệu</strong> trước khi CV. Phải đặt trong một pipeline để mỗi
              fold có preprocessing riêng. Nếu không, thông tin từ test lọt vào train &rArr; kết
              quả CV &ldquo;ảo&rdquo; (lạc quan hơn thực tế).
            </p>
          </Callout>

          <Callout variant="info" title="Luôn báo cáo mean ± std">
            Con số đơn lẻ &ldquo;accuracy 87%&rdquo; vô nghĩa nếu không kèm độ lệch chuẩn. Nên
            báo cáo <strong>87.0% ± 1.8%</strong> (ổn định) thay vì chỉ{" "}
            <strong>87.0%</strong>. Nếu hai mô hình có khoảng (mean ± std) chồng lấn nhau,
            chúng chưa chắc khác nhau thực sự.
          </Callout>

          <h4 className="text-sm font-semibold text-foreground mt-5 mb-2">
            Khi nào nên dùng cross-validation vs train/val/test split?
          </h4>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>
              Dataset nhỏ (&lt; 10k mẫu): <strong>CV</strong> &mdash; tận dụng tối đa dữ liệu.
            </li>
            <li>
              Dataset lớn (&gt; 100k mẫu):{" "}
              <TopicLink slug="train-val-test">train/val/test split</TopicLink> một lần là đủ —
              variance tự nhiên đã thấp.
            </li>
            <li>
              Cần báo cáo khoa học / benchmark chính thức:{" "}
              <strong>Repeated K-Fold</strong> hoặc <strong>Nested CV</strong>.
            </li>
            <li>
              Có time series / group / mất cân bằng: dùng biến thể tương ứng (TimeSeriesSplit,
              GroupKFold, StratifiedKFold).
            </li>
          </ul>

          <CollapsibleDetail title="Bias-variance của K — vì sao K=5 hoặc K=10 là mặc định?">
            <p className="text-sm leading-relaxed">
              Chọn K là một sự đánh đổi:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm mt-2">
              <li>
                <strong>K nhỏ (ví dụ K=2):</strong> tập train chỉ ~50% dataset → mô hình học từ
                ít dữ liệu → ước lượng lỗi cao hơn thực tế (bias dương).
              </li>
              <li>
                <strong>K lớn (ví dụ K=n):</strong> tập train gần như toàn bộ → bias thấp, nhưng
                K tập train rất giống nhau → K điểm đánh giá tương quan cao → variance không
                giảm như kỳ vọng.
              </li>
              <li>
                <strong>K = 5 hoặc 10:</strong> cân bằng tốt. Kohavi (1995) thực nghiệm đề xuất
                K = 10 cho nhiều loại bài toán.
              </li>
            </ul>
          </CollapsibleDetail>

          <CollapsibleDetail title="Nested CV — khi cần báo cáo không thiên vị">
            <p className="text-sm leading-relaxed">
              Khi dùng GridSearchCV, điểm tốt nhất đã là kết quả của quá trình chọn lọc trên CV
              &rArr; lạc quan hơn điểm thực tế. Nested CV giải quyết bằng 2 vòng:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm mt-2">
              <li>
                <strong>Vòng ngoài</strong>: đánh giá hiệu năng tổng quát (K_outer fold).
              </li>
              <li>
                <strong>Vòng trong</strong>: chọn hyperparameter (K_inner fold) trong mỗi fold
                của vòng ngoài.
              </li>
            </ul>
            <p className="text-sm leading-relaxed mt-2">
              Chi phí: K_outer × K_inner × |grid| lần huấn luyện. Đắt, nhưng là cách duy nhất
              báo cáo điểm không thiên vị khi viết paper hoặc benchmark công khai.
            </p>
          </CollapsibleDetail>

          <h4 className="text-sm font-semibold text-foreground mt-6 mb-2">
            Sáu tình huống thực tế &mdash; chọn biến thể CV nào?
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-semibold text-foreground">Bài toán</th>
                  <th className="text-left py-2 pr-3 font-semibold text-foreground">Dataset</th>
                  <th className="text-left py-2 font-semibold text-accent">CV đề xuất</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-foreground/85">
                <tr>
                  <td className="py-2 pr-3">Phát hiện gian lận thẻ tín dụng (0.5% gian lận)</td>
                  <td className="py-2 pr-3">1 triệu giao dịch</td>
                  <td className="py-2">Stratified 5-Fold</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3">Phân loại X-quang phổi (500 bệnh nhân)</td>
                  <td className="py-2 pr-3">5.000 ảnh</td>
                  <td className="py-2">Group 5-Fold theo bệnh nhân</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3">Dự báo giá điện theo giờ</td>
                  <td className="py-2 pr-3">8.760 giờ × 5 năm</td>
                  <td className="py-2">Time Series Split</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3">Hồi quy giá nhà</td>
                  <td className="py-2 pr-3">20.000 mẫu</td>
                  <td className="py-2">K-Fold thường (K=10)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3">Nhận dạng giọng nói đa người</td>
                  <td className="py-2 pr-3">10k clip, 200 speaker</td>
                  <td className="py-2">Group 5-Fold theo speaker</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3">Publication benchmark về NLP</td>
                  <td className="py-2 pr-3">50k văn bản</td>
                  <td className="py-2">Repeated Stratified 5-Fold</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h4 className="text-sm font-semibold text-foreground mt-6 mb-2">
            Checklist 6 điểm trước khi báo cáo kết quả CV
          </h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-foreground/85">
            <li>Preprocessing nằm trong pipeline (fit riêng mỗi fold)?</li>
            <li>Đã dùng Stratified nếu dữ liệu mất cân bằng?</li>
            <li>Đã dùng Time Series Split nếu có thứ tự thời gian?</li>
            <li>Đã dùng Group K-Fold nếu có nhóm tự nhiên?</li>
            <li>Báo cáo kèm cả mean VÀ std (không chỉ mean)?</li>
            <li>Nếu so sánh model: khoảng (mean ± std) có chồng lấn không? Nếu chồng → chưa chắc khác nhau.</li>
          </ol>

          <Callout variant="insight" title="Cross-validation trong dự án Việt Nam thực tế">
            Ở các ngân hàng và công ty fintech Việt Nam (VPBank, Techcombank, MoMo), Stratified
            K-Fold là mặc định vì dữ liệu tín dụng và gian lận thường rất mất cân bằng
            (&lt; 5% dương). Các nhóm ML cũng thường dùng thêm một tập hold-out &ldquo;cuối
            cùng&rdquo; không bao giờ chạm đến trong quá trình thử nghiệm, chỉ mở khi sếp yêu
            cầu báo cáo chính thức &mdash; cách này an toàn nhất để tránh overfitting lên CV.
          </Callout>

          <h4 className="text-sm font-semibold text-foreground mt-6 mb-2">
            Ba sai lầm phổ biến khi dùng cross-validation
          </h4>
          <div className="space-y-3">
            <MistakeCard
              wrong="Fit StandardScaler trên toàn bộ X trước khi chạy cross_val_score"
              why="Scaler đã biết mean/std của test fold → leakage. Kết quả CV lạc quan hơn thực tế 3-8%."
              fix="Đặt scaler TRONG pipeline → scaler fit riêng trên mỗi fold train, rồi transform fold test."
            />
            <MistakeCard
              wrong="Shuffle dữ liệu chuỗi thời gian rồi K-Fold"
              why="Tương lai (fold train) 'biết' quá khứ (fold test) → mô hình không phải học dự đoán, mà học nội suy."
              fix="Dùng TimeSeriesSplit — luôn train trước test, không bao giờ ngược lại."
            />
            <MistakeCard
              wrong="Báo cáo 'accuracy 87%' mà không kèm độ lệch chuẩn"
              why="Có thể đây là 87% ± 9% (rất không ổn định) hoặc 87% ± 1% (rất ổn định). Hai tình huống khác hẳn."
              fix="Luôn báo cáo (mean ± std) của K fold. Nếu cần so sánh 2 mô hình, dùng paired test."
            />
          </div>
        </ExplanationSection>
      </LessonSection>

      {/* ═══════════ STEP 7 — SUMMARY ═══════════ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="5 điều cần nhớ về cross-validation"
          points={[
            "Chia một lần = một đề thi may rủi. Chia K phần và xoay vòng = K đề, trung bình ổn định hơn.",
            "K=5 hoặc K=10 là mặc định. Báo cáo luôn kèm mean ± std. Std cao là cờ đỏ.",
            "Stratified cho phân loại mất cân bằng, Time Series Split cho dữ liệu thời gian, Group K-Fold cho dữ liệu có nhóm tự nhiên.",
            "Cạm bẫy: fit preprocessing TRƯỚC CV → leakage. Luôn đặt scaler/encoder trong pipeline để mỗi fold có preprocessing riêng.",
            "Leave-One-Out chỉ dùng khi dataset cực nhỏ; Repeated K-Fold khi cần báo cáo khoa học với khoảng tin cậy.",
          ]}
        />

        <Callout variant="tip" title="Xem ứng dụng thực tế">
          Muốn thấy cross-validation quan trọng thế nào khi thi đấu thật? Xem{" "}
          <TopicLink slug="cross-validation-in-kaggle">CV trong Kaggle</TopicLink> &mdash; nơi
          đội xếp 1.485 trên public leaderboard nhảy lên hạng 1 trên private, chỉ vì tin vào CV
          của mình thay vì chạy theo bảng xếp hạng công khai.
        </Callout>

        <Callout variant="info" title="Một cảnh báo cuối">
          Cross-validation không phải thuốc chữa bách bệnh. Nếu dataset quá nhỏ
          (&lt; 50 mẫu), mọi phương pháp CV đều cho variance cao &mdash; hãy tập trung vào thu
          thập dữ liệu trước. Nếu dataset có data leakage nội tại (ví dụ: nhãn được dán bởi
          cùng một người cho cả train và test), CV sẽ che giấu vấn đề chứ không giải quyết nó.
          Luôn kiểm tra phân phối của từng fold trước khi tin vào con số trung bình.
        </Callout>
      </LessonSection>

      {/* ═══════════ STEP 8 — QUIZ ═══════════ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   LOCAL HELPERS
   ════════════════════════════════════════════════════════════════════════ */

function VariantCard({
  color,
  title,
  desc,
}: {
  color: string;
  title: string;
  desc: string;
}) {
  return (
    <div
      className="rounded-xl border p-3 space-y-1"
      style={{ borderColor: `${color}55`, backgroundColor: `${color}0F` }}
    >
      <p className="text-sm font-bold" style={{ color }}>
        {title}
      </p>
      <p className="text-xs text-foreground/80 leading-relaxed">{desc}</p>
    </div>
  );
}

function MistakeCard({
  wrong,
  why,
  fix,
}: {
  wrong: string;
  why: string;
  fix: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4 space-y-2">
      <div className="flex items-start gap-2">
        <span className="shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
          SAI
        </span>
        <p className="text-sm font-semibold text-foreground">{wrong}</p>
      </div>
      <p className="text-xs text-muted leading-relaxed pl-10">
        <strong className="text-foreground/85">Vì sao sai: </strong>
        {why}
      </p>
      <div className="flex items-start gap-2 pt-1 border-t border-border/60">
        <span className="shrink-0 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white">
          ĐÚNG
        </span>
        <p className="text-sm text-foreground/85">{fix}</p>
      </div>
    </div>
  );
}

/* ------- 20-row × 5-fold layout helpers ------- */
function FoldRound({
  testFold,
  score,
}: {
  testFold: number;
  score: number;
}) {
  // Build 5 × 4 grid — each row = one fold
  const rowsPerFold = 4;
  const color = FOLD_COLORS[testFold];

  return (
    <div
      className="rounded-xl border-2 p-4 space-y-3"
      style={{ borderColor: `${color}60`, backgroundColor: `${color}0D` }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Shuffle size={14} style={{ color }} />
          <h4 className="text-sm font-bold" style={{ color }}>
            Lượt {testFold + 1} &mdash; Fold F{testFold + 1} làm test
          </h4>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {pct(score)}
        </span>
      </div>

      <svg viewBox="0 0 520 140" className="w-full" role="img" aria-label={`Dataset 20 hàng, fold ${testFold + 1} làm test`}>
        {Array.from({ length: 5 }, (_, fold) => (
          <g key={`fold-${fold}`}>
            <text
              x={16}
              y={22 + fold * 24}
              fontSize={10}
              fill="currentColor"
              className="text-muted"
              fontWeight={fold === testFold ? 700 : 500}
            >
              F{fold + 1}
            </text>
            {Array.from({ length: rowsPerFold }, (_, cellIdx) => {
              const isTest = fold === testFold;
              const rowId = fold * rowsPerFold + cellIdx + 1;
              return (
                <g key={`cell-${fold}-${cellIdx}`}>
                  <rect
                    x={40 + cellIdx * 110}
                    y={10 + fold * 24}
                    width={100}
                    height={18}
                    rx={4}
                    fill={isTest ? color : "#64748b"}
                    opacity={isTest ? 0.9 : 0.18}
                    stroke={isTest ? color : "transparent"}
                    strokeWidth={isTest ? 1.5 : 0}
                  />
                  <text
                    x={40 + cellIdx * 110 + 50}
                    y={23 + fold * 24}
                    fontSize={9}
                    fill={isTest ? "#fff" : "#94a3b8"}
                    textAnchor="middle"
                    fontWeight={isTest ? 700 : 500}
                  >
                    Hàng {rowId} {isTest ? "(test)" : "(train)"}
                  </text>
                </g>
              );
            })}
          </g>
        ))}
      </svg>

      <p className="text-xs text-foreground/85 leading-relaxed">
        Lượt này: 4 hàng của Fold {testFold + 1} là &ldquo;đề thi&rdquo;; 16 hàng còn lại (Fold{" "}
        {[1, 2, 3, 4, 5].filter((n) => n - 1 !== testFold).join(", ")}) là &ldquo;sách
        ôn&rdquo;. Kết quả: {pct(score)}.
      </p>
    </div>
  );
}

