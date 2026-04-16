"use client";

import { useState, useMemo, useCallback } from "react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
  TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "probability-statistics",
  title: "Probability & Statistics",
  titleVi: "Xác suất & Thống kê cơ bản",
  description:
    "Định lý Bayes, phân phối xác suất và cross-entropy — công cụ cốt lõi cho Machine Learning",
  category: "math-foundations",
  tags: ["probability", "bayes", "distribution", "cross-entropy"],
  difficulty: "intermediate",
  relatedSlugs: ["naive-bayes", "logistic-regression", "loss-functions"],
  vizType: "interactive",
  tocSections: [
    { id: "visualization", labelVi: "Hình minh họa" },
    { id: "explanation", labelVi: "Giải thích" },
  ],
};

/* ── Constants ── */
const TOTAL_PEOPLE = 1000;
const GRID_COLS = 40; // 40 cols × 25 rows = 1000
const TOTAL_STEPS = 8;

/* Icon size in the grid */
const ICON_R = 4;
const ICON_GAP = 2;
const CELL = ICON_R * 2 + ICON_GAP; // 10px per cell

const SVG_W = GRID_COLS * CELL;
const SVG_H = Math.ceil(TOTAL_PEOPLE / GRID_COLS) * CELL;

/* ── Types ── */
type PersonStatus = "tp" | "fn" | "fp" | "tn";

/* ── Color map ── */
const STATUS_COLORS: Record<PersonStatus, string> = {
  tp: "#EF4444", // red — sick + test positive (true positive)
  fn: "#F9A8D4", // pink — sick + test negative (false negative)
  fp: "#F59E0B", // yellow — healthy + test positive (false positive)
  tn: "#6B7280", // gray — healthy + test negative (true negative)
};

const STATUS_LABELS: Record<PersonStatus, string> = {
  tp: "Bệnh + Dương tính (TP)",
  fn: "Bệnh + Âm tính (FN)",
  fp: "Khỏe + Dương tính (FP)",
  tn: "Khỏe + Âm tính (TN)",
};

/* ── Computation helper ── */
function computePopulation(
  prevalence: number,
  sensitivity: number,
  specificity: number,
): PersonStatus[] {
  const sick = Math.round(TOTAL_PEOPLE * prevalence);
  const healthy = TOTAL_PEOPLE - sick;
  const tp = Math.round(sick * sensitivity);
  const fn = sick - tp;
  const fp = Math.round(healthy * (1 - specificity));
  const tn = healthy - fp;

  const result: PersonStatus[] = [];
  for (let i = 0; i < tp; i++) result.push("tp");
  for (let i = 0; i < fn; i++) result.push("fn");
  for (let i = 0; i < fp; i++) result.push("fp");
  for (let i = 0; i < tn; i++) result.push("tn");

  // Ensure exactly TOTAL_PEOPLE (rounding can cause off-by-one)
  while (result.length < TOTAL_PEOPLE) result.push("tn");
  while (result.length > TOTAL_PEOPLE) result.pop();

  return result;
}

export default function ProbabilityStatisticsTopic() {
  /* ── Slider state ── */
  const [prevalence, setPrevalence] = useState(0.01); // 1%
  const [sensitivity, setSensitivity] = useState(0.9); // 90%
  const [specificity, setSpecificity] = useState(0.95); // 95%

  /* ── Derived: population classification ── */
  const population = useMemo(
    () => computePopulation(prevalence, sensitivity, specificity),
    [prevalence, sensitivity, specificity],
  );

  /* ── Derived: counts ── */
  const counts = useMemo(() => {
    const c = { tp: 0, fn: 0, fp: 0, tn: 0 };
    for (const s of population) c[s]++;
    return c;
  }, [population]);

  /* ── Derived: posterior P(bệnh | dương tính) ── */
  const posterior = useMemo(() => {
    const totalPositive = counts.tp + counts.fp;
    if (totalPositive === 0) return 0;
    return counts.tp / totalPositive;
  }, [counts]);

  /* ── Slider handler factory ── */
  const handleSlider = useCallback(
    (setter: (v: number) => void) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setter(parseFloat(e.target.value));
      },
    [],
  );

  /* ── Quiz ── */
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "Bệnh X có tỷ lệ mắc 1%. Xét nghiệm có độ nhạy 90%, độ đặc hiệu 95%. Trong 1.000 người, khoảng bao nhiêu người khỏe mạnh bị xét nghiệm dương tính giả?",
        options: ["10", "~50", "90", "100"],
        correct: 1,
        explanation:
          "Trong 1.000 người, 990 người khỏe mạnh. Với độ đặc hiệu 95%, có 5% dương tính giả: 990 × 0,05 ≈ 50 người. Đây chính là lý do base rate quan trọng — dù test chính xác 95%, phần lớn dương tính vẫn là giả khi bệnh hiếm.",
      },
      {
        question: "Tại sao base rate (tỷ lệ nền) quan trọng trong Bayes?",
        options: [
          "Vì nó giúp tính nhanh hơn",
          "Bệnh hiếm thì phần lớn dương tính là giả, dù test chính xác",
          "Vì base rate luôn bằng 50%",
          "Vì không có base rate thì không tính được trung bình",
        ],
        correct: 1,
        explanation:
          "Base rate fallacy: khi bệnh hiếm (1%), dù test có độ chính xác 95%, số dương tính giả (~50) vẫn lớn hơn nhiều so với dương tính thật (~9). Hầu hết người xét nghiệm dương tính thực ra không mắc bệnh!",
      },
      {
        question: "Cross-entropy loss trong ML đo gì?",
        options: [
          "Khoảng cách Euclid giữa hai vector",
          "Khoảng cách giữa phân phối dự đoán và phân phối thực tế",
          "Độ chính xác (accuracy) của model",
          "Tốc độ hội tụ của gradient descent",
        ],
        correct: 1,
        explanation:
          "Cross-entropy H(p, q) = -Σ p(x) log q(x) đo khoảng cách giữa phân phối thực p và phân phối dự đoán q. Minimize cross-entropy = maximize likelihood = model dự đoán càng gần thực tế càng tốt.",
      },
      {
        type: "fill-blank",
        question:
          "Theo Bayes, P(bệnh|dương tính) = P(dương tính|bệnh) × P(bệnh) / {blank}",
        blanks: [
          {
            answer: "P(dương tính)",
            accept: [
              "P(dương tính)",
              "P(duong tinh)",
              "P(B)",
              "P(positive)",
              "evidence",
            ],
          },
        ],
        explanation:
          "Mẫu số P(dương tính) là xác suất tổng thể của kết quả dương tính, tính bằng: P(dương tính|bệnh) × P(bệnh) + P(dương tính|khỏe) × P(khỏe). Đây là normalizing constant đảm bảo posterior tổng bằng 1.",
      },
    ],
    [],
  );

  return (
    <>
      {/* ================================================================
          VISUALIZATION: Bayesian icon array
          ================================================================ */}
      <VisualizationSection topicSlug="probability-statistics">
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Bạn là bác sĩ tại Bệnh viện Chợ Rẫy xét nghiệm bệnh X
            </h3>
            <p className="text-sm text-muted leading-relaxed mt-1">
              1.000 người được xét nghiệm. Điều chỉnh 3 thanh trượt bên dưới
              và quan sát biểu đồ thay đổi theo thời gian thực.
            </p>
          </div>

          {/* ── Sliders ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Prevalence */}
            <div className="space-y-1">
              <label
                htmlFor="prevalence-slider"
                className="text-xs font-medium text-muted"
              >
                Tỷ lệ mắc bệnh (prevalence)
              </label>
              <input
                id="prevalence-slider"
                type="range"
                min={0.005}
                max={0.1}
                step={0.005}
                value={prevalence}
                onChange={handleSlider(setPrevalence)}
                className="w-full accent-accent"
              />
              <div className="text-center font-mono text-sm font-bold text-foreground">
                {(prevalence * 100).toFixed(1)}%
              </div>
            </div>

            {/* Sensitivity */}
            <div className="space-y-1">
              <label
                htmlFor="sensitivity-slider"
                className="text-xs font-medium text-muted"
              >
                Độ nhạy (sensitivity / TPR)
              </label>
              <input
                id="sensitivity-slider"
                type="range"
                min={0.8}
                max={0.99}
                step={0.01}
                value={sensitivity}
                onChange={handleSlider(setSensitivity)}
                className="w-full accent-accent"
              />
              <div className="text-center font-mono text-sm font-bold text-foreground">
                {(sensitivity * 100).toFixed(0)}%
              </div>
            </div>

            {/* Specificity */}
            <div className="space-y-1">
              <label
                htmlFor="specificity-slider"
                className="text-xs font-medium text-muted"
              >
                Độ đặc hiệu (specificity / TNR)
              </label>
              <input
                id="specificity-slider"
                type="range"
                min={0.8}
                max={0.99}
                step={0.01}
                value={specificity}
                onChange={handleSlider(setSpecificity)}
                className="w-full accent-accent"
              />
              <div className="text-center font-mono text-sm font-bold text-foreground">
                {(specificity * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* ── Icon grid ── */}
          <div className="overflow-x-auto rounded-lg border border-border bg-surface p-3">
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              className="w-full"
              aria-label={`1.000 biểu tượng người phân loại theo xét nghiệm: ${counts.tp} TP, ${counts.fn} FN, ${counts.fp} FP, ${counts.tn} TN`}
              role="img"
            >
              {population.map((status, i) => {
                const col = i % GRID_COLS;
                const row = Math.floor(i / GRID_COLS);
                return (
                  <circle
                    key={i}
                    cx={col * CELL + ICON_R}
                    cy={row * CELL + ICON_R}
                    r={ICON_R - 0.5}
                    fill={STATUS_COLORS[status]}
                  />
                );
              })}
            </svg>
          </div>

          {/* ── Legend ── */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
            {(["tp", "fn", "fp", "tn"] as PersonStatus[]).map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ background: STATUS_COLORS[s] }}
                />
                <span>
                  {STATUS_LABELS[s]}: <strong>{counts[s]}</strong>
                </span>
              </div>
            ))}
          </div>

          {/* ── Posterior result ── */}
          <div className="rounded-lg border-2 border-accent bg-accent/10 p-4 text-center">
            <div className="text-sm text-muted mb-1">
              Nếu xét nghiệm dương tính, xác suất bạn thực sự mắc bệnh:
            </div>
            <div className="font-mono text-3xl font-bold text-accent">
              {(posterior * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-muted mt-2">
              = {counts.tp} dương tính thật / ({counts.tp} TP + {counts.fp} FP)
              = {counts.tp} / {counts.tp + counts.fp}
            </div>
          </div>

          {/* ── Key insight callout ── */}
          {prevalence <= 0.02 && specificity <= 0.96 && (
            <Callout variant="warning" title="Nghịch lý base rate">
              Với tỷ lệ mắc bệnh chỉ{" "}
              {(prevalence * 100).toFixed(1)}% và độ đặc hiệu{" "}
              {(specificity * 100).toFixed(0)}%, phần lớn kết quả
              dương tính là <strong>dương tính giả</strong> ({counts.fp} FP
              so với {counts.tp} TP). Đây là lý do bác sĩ cần xét
              nghiệm lại trước khi kết luận!
            </Callout>
          )}
        </div>
      </VisualizationSection>

      {/* ================================================================
          EXPLANATION SECTION
          ================================================================ */}
      <ExplanationSection topicSlug="probability-statistics">
        {/* Step 1: Prediction Gate */}
        <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
          <PredictionGate
            question="Xét nghiệm bệnh X có độ chính xác 95%. Bạn dương tính. Xác suất bạn thực sự mắc bệnh (tỷ lệ mắc 1%) là bao nhiêu?"
            options={[
              "95% — test chính xác 95% mà!",
              "Khoảng 50% — xác suất nửa nửa",
              "Chỉ khoảng 15% — phần lớn dương tính là giả khi bệnh hiếm",
            ]}
            correct={2}
            explanation="Đáp án gây sốc: chỉ ~15%! Gigerenzer & Hoffrage (1995) cho thấy hầu hết bác sĩ cũng trả lời sai câu này. Trong 1.000 người: 10 người bệnh (9 dương tính thật), 990 người khỏe (50 dương tính giả). Vậy 9/(9+50) ≈ 15%. Hãy dùng biểu đồ phía trên để kiểm chứng!"
          >
            <p className="mt-3 text-sm text-muted leading-relaxed">
              Tiếp tục để hiểu tại sao trực giác con người thường sai khi xử lý
              xác suất — và cách định lý Bayes khắc phục điều đó.
            </p>
          </PredictionGate>
        </LessonSection>

        {/* Step 2: Aha moment */}
        <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
          <AhaMoment>
            <p>
              Bộ não con người tệ với xác suất vì chúng ta nghĩ bằng{" "}
              <strong>phần trăm trừu tượng</strong> thay vì{" "}
              <strong>tần số tự nhiên</strong> (natural frequencies). Nói
              &quot;95% chính xác&quot; nghe ấn tượng. Nhưng nói &quot;trong
              1.000 người, 50 người khỏe bị báo dương tính giả, chỉ 9 người
              bệnh thật sự dương tính&quot; — bức tranh hoàn toàn khác. Toàn bộ
              ML cũng vậy: loss function, model confidence, prior belief — tất
              cả đều là xác suất. Hiểu Bayes = hiểu cách ML &quot;nghĩ&quot;.
            </p>
          </AhaMoment>
        </LessonSection>

        {/* Step 3: Bayes Theorem */}
        <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Định lý Bayes">
          <p className="text-sm leading-relaxed">
            <strong>Định lý Bayes</strong> (Bayes&apos; theorem) cho phép cập nhật
            niềm tin khi có bằng chứng mới:
          </p>

          <LaTeX block>
            {String.raw`P(A|B) = \frac{P(B|A) \cdot P(A)}{P(B)}`}
          </LaTeX>

          <ul className="list-disc list-inside space-y-1 pl-2 text-sm leading-relaxed">
            <li>
              <strong>P(A)</strong> — prior (xác suất ban đầu, trước khi có bằng
              chứng)
            </li>
            <li>
              <strong>P(B|A)</strong> — likelihood (xác suất thấy bằng chứng nếu
              A đúng)
            </li>
            <li>
              <strong>P(A|B)</strong> — posterior (xác suất cập nhật sau khi thấy
              bằng chứng)
            </li>
            <li>
              <strong>P(B)</strong> — evidence (xác suất tổng thể của bằng chứng)
            </li>
          </ul>

          <Callout variant="tip" title="Ví dụ: Lọc spam">
            P(spam|&apos;miễn phí&apos;) = P(&apos;miễn phí&apos;|spam) × P(spam) /
            P(&apos;miễn phí&apos;). Prior P(spam) = tỷ lệ spam trong hộp thư (~30%).
            Nếu từ &quot;miễn phí&quot; xuất hiện trong 80% email spam nhưng chỉ 10%
            email thường: P(spam|&apos;miễn phí&apos;) = 0,8 × 0,3 / (0,8 × 0,3 + 0,1
            × 0,7) = 77%. Đây là cơ chế của{" "}
            <TopicLink slug="naive-bayes">Naive Bayes classifier</TopicLink>.
          </Callout>

          <InlineChallenge
            question="P(mưa) = 70% (tháng 7 ở Sài Gòn). Bạn thấy mây đen: P(mây đen|mưa) = 90%, P(mây đen|không mưa) = 20%. P(mưa|mây đen) = ?"
            options={["70%", "90%", "91,3%", "63%"]}
            correct={2}
            explanation="P(mưa|mây đen) = 0,9 × 0,7 / (0,9 × 0,7 + 0,2 × 0,3) = 0,63 / 0,69 ≈ 91,3%. Mây đen là bằng chứng mạnh nâng xác suất mưa từ 70% lên 91,3%."
          />
        </LessonSection>

        {/* Step 4: Natural frequencies */}
        <LessonSection
          step={4}
          totalSteps={TOTAL_STEPS}
          label="Tần số tự nhiên"
        >
          <p className="text-sm leading-relaxed">
            <strong>Tần số tự nhiên</strong> (natural frequencies) là cách diễn đạt
            xác suất bằng số đếm thực tế thay vì phần trăm. Gigerenzer &amp;
            Hoffrage (1995) chứng minh cách này giúp tỷ lệ suy luận Bayes đúng
            tăng từ ~10% lên ~65%.
          </p>

          <div className="rounded-lg border border-border bg-surface p-4 my-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-semibold text-red-400 mb-1">
                  Khó hiểu: phần trăm
                </div>
                <p className="text-muted leading-relaxed">
                  &quot;Xét nghiệm có độ nhạy 90% và độ đặc hiệu 95%. Tỷ lệ mắc
                  bệnh 1%. Tính P(bệnh|dương tính).&quot;
                </p>
              </div>
              <div>
                <div className="font-semibold text-green-400 mb-1">
                  Dễ hiểu: tần số tự nhiên
                </div>
                <p className="text-muted leading-relaxed">
                  &quot;Trong 1.000 người: 10 mắc bệnh (9 dương tính), 990 khỏe
                  mạnh (50 dương tính giả). Vậy 9 trong 59 dương tính thật sự
                  bệnh.&quot;
                </p>
              </div>
            </div>
          </div>

          <Callout variant="info" title="Biểu đồ phía trên dùng tần số tự nhiên">
            Biểu đồ 1.000 biểu tượng người ở đầu bài chính là tần số tự nhiên dạng
            hình ảnh. Mỗi chấm là một người thật — không có phần trăm trừu tượng.
            Bạn đếm trực tiếp: bao nhiêu đỏ (TP), bao nhiêu vàng (FP).
          </Callout>
        </LessonSection>

        {/* Step 5: Sensitivity & Specificity */}
        <LessonSection
          step={5}
          totalSteps={TOTAL_STEPS}
          label="Độ nhạy & Độ đặc hiệu"
        >
          <p className="text-sm leading-relaxed">
            Hai thước đo quan trọng nhất của xét nghiệm (và mọi classifier trong
            ML):
          </p>

          <div className="rounded-lg border border-border bg-surface p-4 my-3 space-y-3">
            <div className="text-sm">
              <strong>Độ nhạy (sensitivity / recall / TPR):</strong>
              <LaTeX block>
                {String.raw`\text{Sensitivity} = \frac{TP}{TP + FN} = P(\text{dương tính} | \text{bệnh})`}
              </LaTeX>
              <p className="text-muted leading-relaxed">
                Trong những người <em>thực sự bệnh</em>, bao nhiêu phần trăm được
                phát hiện? Độ nhạy cao = ít bỏ sót.
              </p>
            </div>
            <hr className="border-border" />
            <div className="text-sm">
              <strong>Độ đặc hiệu (specificity / TNR):</strong>
              <LaTeX block>
                {String.raw`\text{Specificity} = \frac{TN}{TN + FP} = P(\text{âm tính} | \text{khỏe})`}
              </LaTeX>
              <p className="text-muted leading-relaxed">
                Trong những người <em>thực sự khỏe</em>, bao nhiêu phần trăm được
                xác nhận khỏe? Độ đặc hiệu cao = ít báo nhầm.
              </p>
            </div>
          </div>

          <Callout variant="tip" title="Trade-off trong ML">
            Trong classification, sensitivity = recall. Model phát hiện ung thư cần
            recall cao (không bỏ sót). Model lọc spam cần precision cao (không xóa
            nhầm email quan trọng). Đây là bài toán{" "}
            <TopicLink slug="bias-variance">precision-recall trade-off</TopicLink>.
          </Callout>
        </LessonSection>

        {/* Step 6: Gaussian distribution & Cross-entropy */}
        <LessonSection
          step={6}
          totalSteps={TOTAL_STEPS}
          label="Phân phối & Cross-entropy"
        >
          <p className="text-sm leading-relaxed">
            <strong>Phân phối chuẩn</strong> (Gaussian / normal distribution) là nền
            tảng của thống kê và ML. Central Limit Theorem: trung bình của nhiều
            biến ngẫu nhiên luôn tiến về Gaussian, bất kể phân phối gốc.
          </p>

          <LaTeX block>
            {String.raw`p(x) = \frac{1}{\sqrt{2\pi\sigma^2}} \exp\!\left(-\frac{(x - \mu)^2}{2\sigma^2}\right)`}
          </LaTeX>

          <p className="text-sm leading-relaxed mt-3">
            Trong đó <LaTeX>{String.raw`\mu`}</LaTeX> là trung bình (mean) và{" "}
            <LaTeX>{String.raw`\sigma`}</LaTeX> là độ lệch chuẩn (standard
            deviation). Gaussian dùng khắp nơi trong ML: weight initialization,
            batch normalization, Gaussian Processes, VAE.
          </p>

          <hr className="border-border my-4" />

          <p className="text-sm leading-relaxed">
            <strong>Cross-entropy</strong> đo khoảng cách giữa phân phối dự đoán
            và phân phối thực tế — chính là loss function mặc định cho classification:
          </p>

          <LaTeX block>
            {String.raw`H(p, q) = -\sum_{x} p(x) \log q(x)`}
          </LaTeX>

          <Callout variant="tip" title="MLE = Minimize CE">
            Maximize likelihood = minimize negative log-likelihood = minimize
            cross-entropy. Khi label là one-hot [1, 0, 0] và prediction là
            [0,7; 0,2; 0,1]: CE = −log(0,7) = 0,357. Chỉ quan tâm xác suất của
            class đúng. Đây là lý do cross-entropy là loss mặc định cho mọi{" "}
            <TopicLink slug="logistic-regression">classification model</TopicLink>.
          </Callout>

          <CodeBlock language="python" title="Bayes và cross-entropy trong Python">
            {`import numpy as np

# === Bayes Theorem: P(bệnh | dương tính) ===
prevalence = 0.01          # P(bệnh) = 1%
sensitivity = 0.90         # P(dương tính | bệnh)
specificity = 0.95         # P(âm tính | khỏe)

# Tần số tự nhiên cho 1.000 người
sick = int(1000 * prevalence)        # 10
healthy = 1000 - sick                # 990
tp = int(sick * sensitivity)         # 9
fp = int(healthy * (1 - specificity))  # ~50

posterior = tp / (tp + fp)
print(f"P(bệnh|dương tính) = {posterior:.1%}")  # ~15.3%

# === Cross-Entropy Loss ===
y_true = np.array([1, 0, 0])         # One-hot: class 0
y_pred = np.array([0.7, 0.2, 0.1])   # Predictions
ce_loss = -np.sum(y_true * np.log(y_pred))
print(f"CE Loss = {ce_loss:.3f}")     # 0.357`}
          </CodeBlock>
        </LessonSection>

        {/* Step 7: Summary */}
        <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tổng kết">
          <MiniSummary
            points={[
              "Định lý Bayes: P(A|B) = P(B|A) × P(A) / P(B). Cập nhật niềm tin khi có bằng chứng mới — core của Naive Bayes và Bayesian ML.",
              "Tần số tự nhiên: \"9 trong 59\" dễ hiểu hơn \"15,3%\". Giúp tỷ lệ suy luận đúng tăng từ 10% lên 65% (Gigerenzer, 1995).",
              "Base rate fallacy: bệnh hiếm + test chính xác ≠ kết quả đáng tin. Tỷ lệ nền quyết định phần lớn posterior.",
              "Sensitivity (recall) = phát hiện đúng. Specificity = không báo nhầm. Trade-off giữa hai chỉ số này là bài toán cốt lõi trong ML.",
              "Cross-entropy = negative log-likelihood = MLE. Loss mặc định cho classification. Gaussian là phân phối mặc định của ML.",
            ]}
          />
        </LessonSection>

        {/* Step 8: Quiz */}
        <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
          <QuizSection questions={quizQuestions} />
        </LessonSection>
      </ExplanationSection>
    </>
  );
}
