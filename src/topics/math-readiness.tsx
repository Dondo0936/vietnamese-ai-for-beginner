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
  titleVi: "San sang cho toan ML",
  description:
    "Bien so, ham so, mat phang toa do va ky hieu tong — chuan bi toan hoc cho Machine Learning",
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
        question: "Cho f(x) = 3x + 2. Gia tri f(4) bang bao nhieu?",
        options: ["10", "14", "12", "15"],
        correct: 1,
        explanation:
          "f(4) = 3 \u00d7 4 + 2 = 12 + 2 = 14. Thay x = 4 vao cong thuc roi tinh theo thu tu phep tinh.",
      },
      {
        question:
          "Trong ham y = ax + b, khi a tang tu 1 len 3 (giu b khong doi), do thi thay doi the nao?",
        options: [
          "Doc hon (steeper)",
          "Thoai hon (flatter)",
          "Dich sang phai",
          "Khong doi",
        ],
        correct: 0,
        explanation:
          "He so a quyet dinh do doc cua duong thang. a cang lon, duong cang doc. Day chinh la ly do trong ML, thay doi tham so a se thay doi manh hanh vi cua mo hinh.",
      },
      {
        question:
          "Bieu thuc \u03a3_{i=1}^{4} i\u00b2 co nghia la gi?",
        options: [
          "1 + 2 + 3 + 4",
          "1\u00b2 + 2\u00b2 + 3\u00b2 + 4\u00b2",
          "4\u00b2",
          "(1 + 2 + 3 + 4)\u00b2",
        ],
        correct: 1,
        explanation:
          "Ky hieu \u03a3 yeu cau tinh tong cua bieu thuc i\u00b2 voi i chay tu 1 den 4. Vay ket qua la 1\u00b2 + 2\u00b2 + 3\u00b2 + 4\u00b2 = 1 + 4 + 9 + 16 = 30.",
      },
      {
        type: "fill-blank",
        question:
          "Cho f(x) = 2x \u2212 1. Tinh \u03a3_{i=0}^{2} f(i) = {blank}",
        blanks: [{ answer: "3", accept: ["3", "3,0"] }],
        explanation:
          "f(0) = \u22121, f(1) = 1, f(2) = 3. Tong = (\u22121) + 1 + 3 = 3. Day la ket hop ham so va ky hieu tong — dung rat nhieu trong cong thuc ML.",
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
              Kham pha ham tuyen tinh: y = ax + b
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              Keo thanh truot de thay doi tham so (parameter){" "}
              <strong>a</strong> va <strong>b</strong>. Quan sat cach do thi,
              bang gia tri, va phuong trinh thay doi dong bo.
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
                    He so goc a (do doc)
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
                    He so tu do b (cat truc y)
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
                        Phep tinh
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
                  aria-label="Do thi ham tuyen tinh y = ax + b"
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
              Ky hieu tong: <LaTeX>{String.raw`\Sigma`}</LaTeX> (Sigma)
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              Em co 5 bai kiem tra voi diem so:{" "}
              <span className="font-mono font-medium text-foreground">
                8, 6, 9, 7, 10
              </span>
              . Bam &quot;Buoc tiep&quot; de xem tung buoc cong don.
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
                  <span className="text-muted">Tong hien tai:</span>
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
                    Bam &quot;Buoc tiep&quot; de bat dau...
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
                    ? "Hoan thanh!"
                    : `Buoc tiep (i = ${sumStep + 1})`}
                </button>
                <button
                  onClick={handleSumReset}
                  className="rounded-lg px-4 py-2 text-sm font-medium border border-border text-foreground hover:bg-surface-hover transition-colors"
                >
                  Lam lai
                </button>
              </div>

              {/* MSE teaser */}
              {sumStep >= EXAM_SCORES.length && (
                <div className="mt-2 rounded-lg border border-accent/30 bg-accent-light/30 p-3 text-sm text-foreground leading-relaxed">
                  <p className="font-semibold text-accent-dark mb-1">
                    Ket noi voi ML:
                  </p>
                  <p className="text-muted">
                    Trong ML, cong thuc sai so trung binh binh phuong (MSE)
                    dung ky hieu{" "}
                    <LaTeX>{String.raw`\Sigma`}</LaTeX> y het nhu vay:
                  </p>
                  <div className="mt-2">
                    <LaTeX block>
                      {String.raw`MSE = \frac{1}{n} \sum_{i=1}^{n} (y_i - \hat{y}_i)^2`}
                    </LaTeX>
                  </div>
                  <p className="text-muted mt-1">
                    Thay vi cong diem bai thi, ta cong binh phuong sai so
                    giua du doan va thuc te.
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
        <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Du doan">
          <PredictionGate
            question="Trong ML, khi mo hinh 'hoc', no thuc su dang lam gi?"
            options={[
              "Ghi nho toan bo du lieu dau vao",
              "Dieu chinh cac con so (tham so) de dua ra du doan chinh xac hon",
              "Viet code tu dong",
            ]}
            correct={1}
            explanation="Dung! 'Hoc' trong ML nghia la dieu chinh cac tham so — nhung con so nhu a va b trong y = ax + b — sao cho du doan sat voi thuc te nhat. Bai nay se giup ban hieu ro nhung khai niem toan hoc nen tang nay."
          >
            <p className="mt-3 text-sm text-muted leading-relaxed">
              Tiep tuc de kham pha cac cong cu toan hoc ma ML dung moi ngay.
            </p>
          </PredictionGate>
        </LessonSection>

        <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Bien so & Tham so">
          <p className="text-sm leading-relaxed">
            Trong toan lop 7, ban da gap <strong>bien so</strong> (variable):{" "}
            <LaTeX>{"x"}</LaTeX>, <LaTeX>{"y"}</LaTeX> la nhung ky hieu dai dien
            cho gia tri thay doi. Trong ML, co them mot khai niem quan trong:{" "}
            <strong>tham so</strong> (parameter).
          </p>

          <Callout variant="tip" title="Vi du: Quan ca phe may pha">
            Tuong tuong mot may pha ca phe co hai nut van:{" "}
            <strong>a</strong> = do dam va <strong>b</strong> = do ngot.
            Moi to hop (a, b) khac nhau cho ra mot vi ca phe khac nhau.
            Trong ML, mo hinh co hang trieu &quot;nut van&quot; nhu vay — moi
            nut la mot tham so ma may tu dieu chinh khi hoc.
          </Callout>

          <p className="text-sm leading-relaxed mt-3">
            Su khac biet chinh:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2 text-sm leading-relaxed">
            <li>
              <strong>Bien so</strong> (variable): dau vao thay doi —{" "}
              <LaTeX>{"x"}</LaTeX> la du lieu moi ban dua cho mo hinh
            </li>
            <li>
              <strong>Tham so</strong> (parameter): con so ma mo hinh tu dieu chinh
              trong qua trinh hoc — <LaTeX>{"a"}</LaTeX> va{" "}
              <LaTeX>{"b"}</LaTeX> trong{" "}
              <LaTeX>{"y = ax + b"}</LaTeX>
            </li>
          </ul>

          <AhaMoment>
            Tham so giong nhu nut van volume tren loa: mot con so nho thoi nhung
            thay doi no la thay doi toan bo hanh vi cua he thong. Trong ML,
            &quot;huan luyen&quot; chinh la qua trinh tim ra vi tri tot nhat cho
            cac nut van nay.
          </AhaMoment>
        </LessonSection>

        <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Ham so">
          <p className="text-sm leading-relaxed">
            <strong>Ham so</strong> (function) la mot quy tac bien doi:{" "}
            cho dau vao, tra ra dau ra. Cach viet:{" "}
            <LaTeX>{"f(x) = 2x + 1"}</LaTeX> nghia la &quot;ham{" "}
            <LaTeX>{"f"}</LaTeX> nhan <LaTeX>{"x"}</LaTeX>, nhan doi len roi cong
            them 1&quot;.
          </p>

          <Callout variant="info" title="Vi du: Cong thuc nau pho">
            Mot to pho ngon phu thuoc vao luong gia vi. Doi luong nuoc mam{" "}
            <LaTeX>{"x"}</LaTeX> se doi vi <LaTeX>{"f(x)"}</LaTeX>.
            Cong thuc nau chinh la ham so — no cho ban biet: voi moi &quot;dau
            vao&quot; (luong gia vi), &quot;dau ra&quot; (vi pho) se la gi.
          </Callout>

          <p className="text-sm leading-relaxed mt-3">
            Trong ML, <strong>mo hinh chinh la mot ham so khong lo</strong>.{" "}
            Khi ban cho ChatGPT mot cau hoi (dau vao{" "}
            <LaTeX>{"x"}</LaTeX>), no tinh toan qua hang ty tham so de tra ra
            cau tra loi (dau ra <LaTeX>{"f(x)"}</LaTeX>).
          </p>

          <InlineChallenge
            question="Cho f(x) = 5x \u2212 3. Gia tri f(2) la bao nhieu?"
            options={["3", "7", "10", "13"]}
            correct={1}
            explanation="f(2) = 5 \u00d7 2 \u2212 3 = 10 \u2212 3 = 7. Thay x = 2 vao cong thuc roi tinh."
          />
        </LessonSection>

        <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Mat phang toa do">
          <p className="text-sm leading-relaxed">
            <strong>Mat phang toa do</strong> (coordinate plane) la mot &quot;ban
            do 2D&quot; voi hai truc: truc ngang <LaTeX>{"x"}</LaTeX> va truc
            dung <LaTeX>{"y"}</LaTeX>. Ban da hoc no o lop 7-8 roi!
          </p>

          <Callout variant="tip" title="Vi du: Google Maps">
            Google Maps la mot mat phang toa do khong lo: kinh do la truc{" "}
            <LaTeX>{"x"}</LaTeX>, vi do la truc <LaTeX>{"y"}</LaTeX>. Moi dia
            diem co mot cap so xac dinh vi tri. Tuong tu, moi diem tren do thi
            ham so co toa do <LaTeX>{"(x, y)"}</LaTeX>.
          </Callout>

          <p className="text-sm leading-relaxed mt-3">
            Tai sao mat phang toa do quan trong trong ML? Vi no giup ta{" "}
            <strong>nhin thay du lieu</strong>. Khi ve du lieu len do thi, ta co
            the nhan ra cac pattern: diem nao thi chung nhom, xu huong tang hay
            giam, co diem nao bat thuong khong.
          </p>

          <p className="text-sm leading-relaxed">
            Quay lai phan{" "}
            <strong>Hinh minh hoa</strong> phia tren va thu keo thanh truot{" "}
            <LaTeX>{"a"}</LaTeX> va <LaTeX>{"b"}</LaTeX>{" "}
            de thay do thi thay doi the nao!
          </p>
        </LessonSection>

        <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Ky hieu tong \u03a3">
          <p className="text-sm leading-relaxed">
            Day la khai niem hoan toan moi — <strong>ky hieu tong</strong>{" "}
            (summation notation) viet bang chu cai Hy Lap{" "}
            <LaTeX>{String.raw`\Sigma`}</LaTeX> (sigma, doc la &quot;xich-ma&quot;).
          </p>

          <LaTeX block>
            {String.raw`\sum_{i=1}^{n} x_i = x_1 + x_2 + \cdots + x_n`}
          </LaTeX>

          <p className="text-sm leading-relaxed">
            Nghia la: &quot;cong tat ca cac <LaTeX>{"x_i"}</LaTeX> tu{" "}
            <LaTeX>{"i = 1"}</LaTeX> den <LaTeX>{"i = n"}</LaTeX>&quot;.
            Phan phia duoi (<LaTeX>{"i=1"}</LaTeX>) la diem bat dau, phia tren
            (<LaTeX>{"n"}</LaTeX>) la diem ket thuc.
          </p>

          <Callout variant="info" title="Vi du: Tinh tong diem bai thi">
            Em co 5 bai kiem tra: 8, 6, 9, 7, 10 diem. Thay vi viet
            &quot;8 + 6 + 9 + 7 + 10&quot;, toan hoc viet gon:{" "}
            <LaTeX>{String.raw`\sum_{i=1}^{5} x_i = 40`}</LaTeX>. Khi co 1.000
            bai thi, ky hieu nay tiet kiem duoc rat nhieu giay muc!
          </Callout>

          <p className="text-sm leading-relaxed mt-3">
            Trong ML, <LaTeX>{String.raw`\Sigma`}</LaTeX>{" "}
            xuat hien o khap noi: tinh sai so, tinh trung binh, cap nhat
            tham so. Hieu ky hieu nay la ban co the doc duoc{" "}
            <strong>hau het cac cong thuc ML</strong>.
          </p>
        </LessonSection>

        <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tong ket">
          <MiniSummary
            title="Nhung dieu can nho"
            points={[
              "Bien so (variable) = dau vao thay doi, tham so (parameter) = 'nut van' mo hinh tu chinh.",
              "Ham so (function) = quy tac bien doi dau vao thanh dau ra. Mo hinh ML la mot ham so khong lo.",
              "Mat phang toa do (coordinate plane) = 'ban do 2D' giup ta hinh dung du lieu va quan he giua cac bien.",
              "Ky hieu tong \u03a3 (sigma) = cach viet gon 'cong tat ca tu i = 1 den n'. Xuat hien o khap noi trong ML.",
              "Tat ca khai niem nay ket noi voi nhau: ML dieu chinh tham so cua ham so de toi uu tong sai so tren mat phang du lieu.",
            ]}
          />
          <p className="text-sm leading-relaxed mt-4">
            Tiep theo, hay tim hieu{" "}
            <TopicLink slug="vectors-and-matrices">
              vector va ma tran
            </TopicLink>{" "}
            de mo rong tu 1 bien thanh hang tram bien cung luc, hoac quay lai{" "}
            <TopicLink slug="what-is-ml">
              Machine Learning la gi?
            </TopicLink>{" "}
            neu ban muon on lai nen tang.
          </p>
        </LessonSection>

        <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiem tra">
          <QuizSection questions={quizQuestions} />
        </LessonSection>
      </ExplanationSection>
    </>
  );
}
