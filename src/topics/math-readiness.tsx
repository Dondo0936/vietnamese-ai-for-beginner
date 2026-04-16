"use client";

import { useState, useMemo, useCallback } from "react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  LaTeX,
  TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "math-readiness",
  title: "Math Readiness for ML",
  titleVi: "Sẵn sàng cho toán ML",
  description:
    "Biến số, hàm số, mặt phẳng toạ độ và ký hiệu tổng — chuẩn bị toán học cho Machine Learning",
  category: "foundations",
  tags: ["functions", "notation", "summation", "prerequisites"],
  difficulty: "beginner",
  relatedSlugs: ["what-is-ml", "vectors-and-matrices", "data-and-datasets"],
  vizType: "interactive",
};

/* ── Constants ── */
const TOTAL_STEPS = 7;
const X_VALUES = [-3, -2, -1, 0, 1, 2, 3];

/* SVG coordinate system for graph */
const GW = 340;
const GH = 280;
const PADDING = 40;
const PLOT_W = GW - 2 * PADDING;
const PLOT_H = GH - 2 * PADDING;

/* Summation demo data: exam scores */
const EXAM_SCORES = [8, 6, 9, 7, 10];

export default function MathReadinessTopic() {
  /* ── State for function explorer ── */
  const [a, setA] = useState(1);
  const [b, setB] = useState(0);

  /* ── State for summation builder ── */
  const [sumStep, setSumStep] = useState(0);

  /* ── Derived: function values ── */
  const tableData = useMemo(
    () =>
      X_VALUES.map((x) => ({
        x,
        computation: `${a} \u00d7 ${x >= 0 ? x : `(${x})`} + ${b >= 0 ? b : `(${b})`}`,
        result: a * x + b,
      })),
    [a, b],
  );

  /* ── Derived: running total for summation ── */
  const runningTotal = useMemo(() => {
    const totals: number[] = [];
    let sum = 0;
    for (const score of EXAM_SCORES) {
      sum += score;
      totals.push(sum);
    }
    return totals;
  }, []);

  /* ── SVG helpers ── */
  const toSvgX = useCallback(
    (x: number) => PADDING + ((x + 3) / 6) * PLOT_W,
    [],
  );
  const toSvgY = useCallback(
    (y: number) => {
      const yMin = -15;
      const yMax = 15;
      return PADDING + ((yMax - y) / (yMax - yMin)) * PLOT_H;
    },
    [],
  );

  /* ── Quiz ── */
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question: "Cho f(x) = 3x + 2. Giá trị f(4) bằng bao nhiêu?",
        options: ["10", "14", "12", "15"],
        correct: 1,
        explanation:
          "f(4) = 3 \u00d7 4 + 2 = 12 + 2 = 14. Thay x = 4 vào công thức rồi tính theo thứ tự phép tính.",
      },
      {
        question:
          "Trong hàm y = ax + b, khi a tăng từ 1 lên 3 (giữ b không đổi), đồ thị thay đổi thế nào?",
        options: [
          "Dốc hơn (steeper)",
          "Thoải hơn (flatter)",
          "Dịch sang phải",
          "Không đổi",
        ],
        correct: 0,
        explanation:
          "Hệ số a quyết định độ dốc của đường thẳng. a càng lớn, đường càng dốc. Đây chính là lý do trong ML, thay đổi tham số a sẽ thay đổi mạnh hành vi của mô hình.",
      },
      {
        question:
          "Biểu thức \u03a3_{i=1}^{4} i\u00b2 có nghĩa là gì?",
        options: [
          "1 + 2 + 3 + 4",
          "1\u00b2 + 2\u00b2 + 3\u00b2 + 4\u00b2",
          "4\u00b2",
          "(1 + 2 + 3 + 4)\u00b2",
        ],
        correct: 1,
        explanation:
          "Ký hiệu \u03a3 yêu cầu tính tổng của biểu thức i\u00b2 với i chạy từ 1 đến 4. Vậy kết quả là 1\u00b2 + 2\u00b2 + 3\u00b2 + 4\u00b2 = 1 + 4 + 9 + 16 = 30.",
      },
      {
        type: "fill-blank",
        question:
          "Cho f(x) = 2x \u2212 1. Tính \u03a3_{i=0}^{2} f(i) = {blank}",
        blanks: [{ answer: "3", accept: ["3", "3,0"] }],
        explanation:
          "f(0) = \u22121, f(1) = 1, f(2) = 3. Tổng = (\u22121) + 1 + 3 = 3. Đây là kết hợp hàm số và ký hiệu tổng — dùng rất nhiều trong công thức ML.",
      },
    ],
    [],
  );

  /* ── Handlers ── */
  const handleSliderA = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setA(Number(e.target.value)),
    [],
  );
  const handleSliderB = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setB(Number(e.target.value)),
    [],
  );
  const handleSumNext = useCallback(
    () => setSumStep((prev) => Math.min(prev + 1, EXAM_SCORES.length)),
    [],
  );
  const handleSumReset = useCallback(() => setSumStep(0), []);

  return (
    <>
      {/* ================================================================
          VISUALIZATION SECTION
          ================================================================ */}
      <VisualizationSection topicSlug="math-readiness">
        <div className="space-y-8">
          {/* ── PRIMARY: Triple-linked function explorer ── */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground">
              Khám phá hàm tuyến tính: y = ax + b
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              Kéo thanh trượt để thay đổi tham số (parameter){" "}
              <strong>a</strong> và <strong>b</strong>. Quan sát cách đồ thị,
              bảng giá trị, và phương trình thay đổi đồng bộ.
            </p>

            {/* Equation panel */}
            <div className="rounded-lg border border-border bg-surface p-4 text-center">
              <LaTeX block>
                {`y = ${a < 0 ? `(${a})` : a}x + ${b < 0 ? `(${b})` : b}`}
              </LaTeX>
            </div>

            {/* Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-foreground font-medium">
                    Hệ số góc a (độ dốc)
                  </label>
                  <span className="font-mono text-sm font-medium text-accent">
                    {a.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min={-3}
                  max={3}
                  step={0.1}
                  value={a}
                  onChange={handleSliderA}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer accent-accent"
                  style={{
                    background: `linear-gradient(to right, var(--color-accent) ${((a + 3) / 6) * 100}%, var(--bg-surface-hover, #E2E8F0) ${((a + 3) / 6) * 100}%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-tertiary">
                  <span>-3,0</span>
                  <span>3,0</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-foreground font-medium">
                    Hệ số tự do b (cắt trục y)
                  </label>
                  <span className="font-mono text-sm font-medium text-accent">
                    {b.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min={-5}
                  max={5}
                  step={0.5}
                  value={b}
                  onChange={handleSliderB}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer accent-accent"
                  style={{
                    background: `linear-gradient(to right, var(--color-accent) ${((b + 5) / 10) * 100}%, var(--bg-surface-hover, #E2E8F0) ${((b + 5) / 10) * 100}%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-tertiary">
                  <span>-5,0</span>
                  <span>5,0</span>
                </div>
              </div>
            </div>

            {/* Value table + Graph side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Value table */}
              <div className="rounded-lg border border-border bg-surface overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-hover/50">
                      <th className="px-3 py-2 text-left font-medium text-foreground">
                        x
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-foreground">
                        Phép tính
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-foreground">
                        f(x)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row) => (
                      <tr
                        key={row.x}
                        className="border-t border-border/50 hover:bg-surface-hover/30 transition-colors"
                      >
                        <td className="px-3 py-1.5 font-mono text-foreground">
                          {row.x}
                        </td>
                        <td className="px-3 py-1.5 font-mono text-muted text-xs">
                          {row.computation}
                        </td>
                        <td className="px-3 py-1.5 font-mono text-accent text-right font-medium">
                          {row.result.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* SVG Graph */}
              <div className="rounded-lg border border-border bg-surface p-2 flex items-center justify-center">
                <svg
                  viewBox={`0 0 ${GW} ${GH}`}
                  className="w-full max-w-[340px]"
                  aria-label="Đồ thị hàm tuyến tính y = ax + b"
                >
                  {/* Grid lines */}
                  {[-10, -5, 0, 5, 10].map((y) => (
                    <line
                      key={`grid-y-${y}`}
                      x1={PADDING}
                      y1={toSvgY(y)}
                      x2={GW - PADDING}
                      y2={toSvgY(y)}
                      stroke="currentColor"
                      className="text-border"
                      strokeWidth="0.5"
                      strokeDasharray={y === 0 ? "none" : "3,3"}
                    />
                  ))}
                  {X_VALUES.map((x) => (
                    <line
                      key={`grid-x-${x}`}
                      x1={toSvgX(x)}
                      y1={PADDING}
                      x2={toSvgX(x)}
                      y2={GH - PADDING}
                      stroke="currentColor"
                      className="text-border"
                      strokeWidth="0.5"
                      strokeDasharray={x === 0 ? "none" : "3,3"}
                    />
                  ))}

                  {/* Axes */}
                  <line
                    x1={PADDING}
                    y1={toSvgY(0)}
                    x2={GW - PADDING}
                    y2={toSvgY(0)}
                    stroke="currentColor"
                    className="text-foreground"
                    strokeWidth="1.5"
                  />
                  <line
                    x1={toSvgX(0)}
                    y1={PADDING}
                    x2={toSvgX(0)}
                    y2={GH - PADDING}
                    stroke="currentColor"
                    className="text-foreground"
                    strokeWidth="1.5"
                  />

                  {/* Axis labels */}
                  <text
                    x={GW - PADDING + 5}
                    y={toSvgY(0) + 4}
                    fontSize="11"
                    fill="currentColor"
                    className="text-muted"
                  >
                    x
                  </text>
                  <text
                    x={toSvgX(0) - 12}
                    y={PADDING - 5}
                    fontSize="11"
                    fill="currentColor"
                    className="text-muted"
                  >
                    y
                  </text>

                  {/* X-axis tick labels */}
                  {X_VALUES.map((x) => (
                    <text
                      key={`xlabel-${x}`}
                      x={toSvgX(x)}
                      y={toSvgY(0) + 16}
                      textAnchor="middle"
                      fontSize="9"
                      fill="currentColor"
                      className="text-tertiary"
                    >
                      {x}
                    </text>
                  ))}
                  {/* Y-axis tick labels */}
                  {[-10, -5, 5, 10].map((y) => (
                    <text
                      key={`ylabel-${y}`}
                      x={toSvgX(0) - 8}
                      y={toSvgY(y) + 3}
                      textAnchor="end"
                      fontSize="9"
                      fill="currentColor"
                      className="text-tertiary"
                    >
                      {y}
                    </text>
                  ))}

                  {/* The line: draw from x=-3 to x=3 */}
                  <line
                    x1={toSvgX(-3)}
                    y1={toSvgY(a * -3 + b)}
                    x2={toSvgX(3)}
                    y2={toSvgY(a * 3 + b)}
                    stroke="currentColor"
                    className="text-accent"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Dots from table */}
                  {tableData.map((row) => {
                    const sy = toSvgY(row.result);
                    const inBounds =
                      sy >= PADDING && sy <= GH - PADDING;
                    if (!inBounds) return null;
                    return (
                      <circle
                        key={`dot-${row.x}`}
                        cx={toSvgX(row.x)}
                        cy={sy}
                        r="4"
                        fill="currentColor"
                        className="text-accent"
                        stroke="white"
                        strokeWidth="1.5"
                      />
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>

          {/* Divider */}
          <hr className="border-border" />

          {/* ── SECONDARY: Summation builder ── */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground">
              Ký hiệu tổng: <LaTeX>{String.raw`\Sigma`}</LaTeX> (Sigma)
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              Em có 5 bài kiểm tra với điểm số:{" "}
              <span className="font-mono font-medium text-foreground">
                8, 6, 9, 7, 10
              </span>
              . Bấm &quot;Bước tiếp&quot; để xem từng bước cộng dồn.
            </p>

            {/* Sigma formula display */}
            <div className="rounded-lg border border-border bg-surface p-4 text-center">
              <LaTeX block>
                {String.raw`\sum_{i=1}^{5} x_i = x_1 + x_2 + x_3 + x_4 + x_5`}
              </LaTeX>
            </div>

            {/* Step-through visualization */}
            <div className="rounded-lg border border-border bg-surface p-4 space-y-4">
              {/* Score cards */}
              <div className="flex flex-wrap gap-2 justify-center">
                {EXAM_SCORES.map((score, i) => {
                  const isActive = i < sumStep;
                  const isCurrent = i === sumStep - 1;
                  return (
                    <div
                      key={i}
                      className={`flex flex-col items-center rounded-lg border-2 px-3 py-2 transition-all duration-300 min-w-[56px] ${
                        isCurrent
                          ? "border-accent bg-accent-light scale-105"
                          : isActive
                            ? "border-accent/50 bg-accent-light/50"
                            : "border-border bg-surface"
                      }`}
                    >
                      <span className="text-xs text-muted">
                        x<sub>{i + 1}</sub>
                      </span>
                      <span
                        className={`text-lg font-bold font-mono ${
                          isActive ? "text-accent-dark" : "text-foreground/40"
                        }`}
                      >
                        {score}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Running total bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Tổng hiện tại:</span>
                  <span className="font-mono font-bold text-accent text-lg">
                    {sumStep === 0 ? "0" : runningTotal[sumStep - 1]}
                  </span>
                </div>
                <div className="h-4 rounded-full bg-surface-hover overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
                    style={{
                      width: `${sumStep === 0 ? 0 : (runningTotal[sumStep - 1] / runningTotal[runningTotal.length - 1]) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Computation display */}
              <div className="text-center font-mono text-sm text-foreground min-h-[24px]">
                {sumStep === 0 && (
                  <span className="text-muted">
                    Bấm &quot;Bước tiếp&quot; để bắt đầu...
                  </span>
                )}
                {sumStep > 0 && (
                  <span>
                    {EXAM_SCORES.slice(0, sumStep).join(" + ")} ={" "}
                    <span className="font-bold text-accent">
                      {runningTotal[sumStep - 1]}
                    </span>
                  </span>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleSumNext}
                  disabled={sumStep >= EXAM_SCORES.length}
                  className="rounded-lg px-4 py-2 text-sm font-medium bg-accent text-white hover:bg-accent-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {sumStep >= EXAM_SCORES.length
                    ? "Hoàn thành!"
                    : `Bước tiếp (i = ${sumStep + 1})`}
                </button>
                <button
                  onClick={handleSumReset}
                  className="rounded-lg px-4 py-2 text-sm font-medium border border-border text-foreground hover:bg-surface-hover transition-colors"
                >
                  Làm lại
                </button>
              </div>

              {/* MSE teaser */}
              {sumStep >= EXAM_SCORES.length && (
                <div className="mt-2 rounded-lg border border-accent/30 bg-accent-light/30 p-3 text-sm text-foreground leading-relaxed">
                  <p className="font-semibold text-accent-dark mb-1">
                    Kết nối với ML:
                  </p>
                  <p className="text-muted">
                    Trong ML, công thức sai số trung bình bình phương (MSE)
                    dùng ký hiệu{" "}
                    <LaTeX>{String.raw`\Sigma`}</LaTeX> y hệt như vậy:
                  </p>
                  <div className="mt-2">
                    <LaTeX block>
                      {String.raw`MSE = \frac{1}{n} \sum_{i=1}^{n} (y_i - \hat{y}_i)^2`}
                    </LaTeX>
                  </div>
                  <p className="text-muted mt-1">
                    Thay vì cộng điểm bài thi, ta cộng bình phương sai số
                    giữa dự đoán và thực tế.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </VisualizationSection>

      {/* ================================================================
          EXPLANATION SECTION
          ================================================================ */}
      <ExplanationSection topicSlug="math-readiness">
        <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
          <PredictionGate
            question="Trong ML, khi mô hình 'học', nó thực sự đang làm gì?"
            options={[
              "Ghi nhớ toàn bộ dữ liệu đầu vào",
              "Điều chỉnh các con số (tham số) để đưa ra dự đoán chính xác hơn",
              "Viết code tự động",
            ]}
            correct={1}
            explanation="Đúng! 'Học' trong ML nghĩa là điều chỉnh các tham số — những con số như a và b trong y = ax + b — sao cho dự đoán sát với thực tế nhất. Bài này sẽ giúp bạn hiểu rõ những khái niệm toán học nền tảng này."
          >
            <p className="mt-3 text-sm text-muted leading-relaxed">
              Tiếp tục để khám phá các công cụ toán học mà ML dùng mỗi ngày.
            </p>
          </PredictionGate>
        </LessonSection>

        <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Biến số & Tham số">
          <p className="text-sm leading-relaxed">
            Trong toán lớp 7, bạn đã gặp <strong>biến số</strong> (variable):{" "}
            <LaTeX>{"x"}</LaTeX>, <LaTeX>{"y"}</LaTeX> là những ký hiệu đại diện
            cho giá trị thay đổi. Trong ML, có thêm một khái niệm quan trọng:{" "}
            <strong>tham số</strong> (parameter).
          </p>

          <Callout variant="tip" title="Ví dụ: Quán cà phê máy pha">
            Tưởng tượng một máy pha cà phê có hai nút vặn:{" "}
            <strong>a</strong> = độ đậm và <strong>b</strong> = độ ngọt.
            Mỗi tổ hợp (a, b) khác nhau cho ra một vị cà phê khác nhau.
            Trong ML, mô hình có hàng triệu &quot;nút vặn&quot; như vậy — mỗi
            nút là một tham số mà máy tự điều chỉnh khi học.
          </Callout>

          <p className="text-sm leading-relaxed mt-3">
            Sự khác biệt chính:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2 text-sm leading-relaxed">
            <li>
              <strong>Biến số</strong> (variable): đầu vào thay đổi —{" "}
              <LaTeX>{"x"}</LaTeX> là dữ liệu mới bạn đưa cho mô hình
            </li>
            <li>
              <strong>Tham số</strong> (parameter): con số mà mô hình tự điều chỉnh
              trong quá trình học — <LaTeX>{"a"}</LaTeX> và{" "}
              <LaTeX>{"b"}</LaTeX> trong{" "}
              <LaTeX>{"y = ax + b"}</LaTeX>
            </li>
          </ul>

          <AhaMoment>
            Tham số giống như nút vặn volume trên loa: một con số nhỏ thôi nhưng
            thay đổi nó là thay đổi toàn bộ hành vi của hệ thống. Trong ML,
            &quot;huấn luyện&quot; chính là quá trình tìm ra vị trí tốt nhất cho
            các nút vặn này.
          </AhaMoment>
        </LessonSection>

        <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Hàm số">
          <p className="text-sm leading-relaxed">
            <strong>Hàm số</strong> (function) là một quy tắc biến đổi:{" "}
            cho đầu vào, trả ra đầu ra. Cách viết:{" "}
            <LaTeX>{"f(x) = 2x + 1"}</LaTeX> nghĩa là &quot;hàm{" "}
            <LaTeX>{"f"}</LaTeX> nhận <LaTeX>{"x"}</LaTeX>, nhân đôi lên rồi cộng
            thêm 1&quot;.
          </p>

          <Callout variant="info" title="Ví dụ: Công thức nấu phở">
            Một tô phở ngon phụ thuộc vào lượng gia vị. Đổi lượng nước mắm{" "}
            <LaTeX>{"x"}</LaTeX> sẽ đổi vị <LaTeX>{"f(x)"}</LaTeX>.
            Công thức nấu chính là hàm số — nó cho bạn biết: với mỗi &quot;đầu
            vào&quot; (lượng gia vị), &quot;đầu ra&quot; (vị phở) sẽ là gì.
          </Callout>

          <p className="text-sm leading-relaxed mt-3">
            Trong ML, <strong>mô hình chính là một hàm số khổng lồ</strong>.{" "}
            Khi bạn cho ChatGPT một câu hỏi (đầu vào{" "}
            <LaTeX>{"x"}</LaTeX>), nó tính toán qua hàng tỷ tham số để trả ra
            câu trả lời (đầu ra <LaTeX>{"f(x)"}</LaTeX>).
          </p>

          <InlineChallenge
            question="Cho f(x) = 5x \u2212 3. Giá trị f(2) là bao nhiêu?"
            options={["3", "7", "10", "13"]}
            correct={1}
            explanation="f(2) = 5 \u00d7 2 \u2212 3 = 10 \u2212 3 = 7. Thay x = 2 vào công thức rồi tính."
          />
        </LessonSection>

        <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Mặt phẳng toạ độ">
          <p className="text-sm leading-relaxed">
            <strong>Mặt phẳng toạ độ</strong> (coordinate plane) là một &quot;bản
            đồ 2D&quot; với hai trục: trục ngang <LaTeX>{"x"}</LaTeX> và trục
            dọc <LaTeX>{"y"}</LaTeX>. Bạn đã học nó ở lớp 7-8 rồi!
          </p>

          <Callout variant="tip" title="Ví dụ: Google Maps">
            Google Maps là một mặt phẳng toạ độ khổng lồ: kinh độ là trục{" "}
            <LaTeX>{"x"}</LaTeX>, vĩ độ là trục <LaTeX>{"y"}</LaTeX>. Mỗi địa
            điểm có một cặp số xác định vị trí. Tương tự, mỗi điểm trên đồ thị
            hàm số có toạ độ <LaTeX>{"(x, y)"}</LaTeX>.
          </Callout>

          <p className="text-sm leading-relaxed mt-3">
            Tại sao mặt phẳng toạ độ quan trọng trong ML? Vì nó giúp ta{" "}
            <strong>nhìn thấy dữ liệu</strong>. Khi vẽ dữ liệu lên đồ thị, ta có
            thể nhận ra các pattern: điểm nào thì chung nhóm, xu hướng tăng hay
            giảm, có điểm nào bất thường không.
          </p>

          <p className="text-sm leading-relaxed">
            Quay lại phần{" "}
            <strong>Hình minh hoạ</strong> phía trên và thử kéo thanh trượt{" "}
            <LaTeX>{"a"}</LaTeX> và <LaTeX>{"b"}</LaTeX>{" "}
            để thấy đồ thị thay đổi thế nào!
          </p>
        </LessonSection>

        <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Ký hiệu tổng \u03a3">
          <p className="text-sm leading-relaxed">
            Đây là khái niệm hoàn toàn mới — <strong>ký hiệu tổng</strong>{" "}
            (summation notation) viết bằng chữ cái Hy Lạp{" "}
            <LaTeX>{String.raw`\Sigma`}</LaTeX> (sigma, đọc là &quot;xích-ma&quot;).
          </p>

          <LaTeX block>
            {String.raw`\sum_{i=1}^{n} x_i = x_1 + x_2 + \cdots + x_n`}
          </LaTeX>

          <p className="text-sm leading-relaxed">
            Nghĩa là: &quot;cộng tất cả các <LaTeX>{"x_i"}</LaTeX> từ{" "}
            <LaTeX>{"i = 1"}</LaTeX> đến <LaTeX>{"i = n"}</LaTeX>&quot;.
            Phần phía dưới (<LaTeX>{"i=1"}</LaTeX>) là điểm bắt đầu, phía trên
            (<LaTeX>{"n"}</LaTeX>) là điểm kết thúc.
          </p>

          <Callout variant="info" title="Ví dụ: Tính tổng điểm bài thi">
            Em có 5 bài kiểm tra: 8, 6, 9, 7, 10 điểm. Thay vì viết
            &quot;8 + 6 + 9 + 7 + 10&quot;, toán học viết gọn:{" "}
            <LaTeX>{String.raw`\sum_{i=1}^{5} x_i = 40`}</LaTeX>. Khi có 1.000
            bài thi, ký hiệu này tiết kiệm được rất nhiều giấy mực!
          </Callout>

          <p className="text-sm leading-relaxed mt-3">
            Trong ML, <LaTeX>{String.raw`\Sigma`}</LaTeX>{" "}
            xuất hiện ở khắp nơi: tính sai số, tính trung bình, cập nhật
            tham số. Hiểu ký hiệu này là bạn có thể đọc được{" "}
            <strong>hầu hết các công thức ML</strong>.
          </p>
        </LessonSection>

        <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tổng kết">
          <MiniSummary
            title="Những điều cần nhớ"
            points={[
              "Biến số (variable) = đầu vào thay đổi, tham số (parameter) = 'nút vặn' mô hình tự chỉnh.",
              "Hàm số (function) = quy tắc biến đổi đầu vào thành đầu ra. Mô hình ML là một hàm số khổng lồ.",
              "Mặt phẳng toạ độ (coordinate plane) = 'bản đồ 2D' giúp ta hình dung dữ liệu và quan hệ giữa các biến.",
              "Ký hiệu tổng \u03a3 (sigma) = cách viết gọn 'cộng tất cả từ i = 1 đến n'. Xuất hiện ở khắp nơi trong ML.",
              "Tất cả khái niệm này kết nối với nhau: ML điều chỉnh tham số của hàm số để tối ưu tổng sai số trên mặt phẳng dữ liệu.",
            ]}
          />
          <p className="text-sm leading-relaxed mt-4">
            Tiếp theo, hãy tìm hiểu{" "}
            <TopicLink slug="vectors-and-matrices">
              vector và ma trận
            </TopicLink>{" "}
            để mở rộng từ 1 biến thành hàng trăm biến cùng lúc, hoặc quay lại{" "}
            <TopicLink slug="what-is-ml">
              Machine Learning là gì?
            </TopicLink>{" "}
            nếu bạn muốn ôn lại nền tảng.
          </p>
        </LessonSection>

        <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
          <QuizSection questions={quizQuestions} />
        </LessonSection>
      </ExplanationSection>
    </>
  );
}
