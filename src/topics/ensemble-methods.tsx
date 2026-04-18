"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
  CollapsibleDetail,
  MiniSummary,
  CodeBlock,
  LessonSection,
  LaTeX,
  TopicLink,
  ProgressSteps,
  StepReveal,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "ensemble-methods",
  title: "Ensemble Methods",
  titleVi: "Phương pháp kết hợp — Đồng tay vỗ nên kêu",
  description:
    "Kỹ thuật kết hợp nhiều mô hình yếu lại thành một mô hình mạnh hơn bất kỳ thành viên đơn lẻ nào.",
  category: "foundations",
  tags: ["ensemble", "bagging", "boosting", "stacking"],
  difficulty: "intermediate",
  relatedSlugs: ["random-forests", "gradient-boosting", "decision-trees"],
  vizType: "interactive",
};

const TOTAL_STEPS = 7;

/* ─────────────────────────────────────────────────────────────────────────────
 * Dataset & learner definitions for the VisualizationSection
 *
 * We generate a deterministic 2-class scatter (two noisy gaussians) and
 * define 5 weak learners — each is simply a line boundary defined by
 * a slope and intercept, plus a confidence weight w_i.
 *
 * Ensemble boundary aggregates sign(score_i(x,y)) × w_i across ACTIVE
 * learners, producing a piecewise-linear decision boundary.
 * ─────────────────────────────────────────────────────────────────────────── */

type Point = { x: number; y: number; label: 0 | 1 };

const SCATTER: Point[] = (() => {
  // deterministic pseudo-random points (LCG)
  let seed = 42;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const pts: Point[] = [];
  for (let i = 0; i < 18; i++) {
    // class 0 cluster around (35, 35)
    pts.push({
      x: 35 + (rand() - 0.5) * 28,
      y: 35 + (rand() - 0.5) * 28,
      label: 0,
    });
    // class 1 cluster around (75, 75)
    pts.push({
      x: 75 + (rand() - 0.5) * 28,
      y: 75 + (rand() - 0.5) * 28,
      label: 1,
    });
  }
  return pts;
})();

type Learner = {
  id: number;
  name: string;
  /** Boundary: ax + by + c = 0, sign(...) predicts class 1. */
  a: number;
  b: number;
  c: number;
  /** Accuracy on training set (for display). */
  acc: number;
  /** Weight for boosting mode. */
  weight: number;
  color: string;
};

const LEARNERS: Learner[] = [
  { id: 0, name: "Stump #1", a: 1, b: 0, c: -55, acc: 0.66, weight: 0.8, color: "#f97316" },
  { id: 1, name: "Stump #2", a: 0, b: 1, c: -55, acc: 0.64, weight: 0.7, color: "#eab308" },
  { id: 2, name: "Stump #3", a: 1, b: 1, c: -110, acc: 0.72, weight: 1.1, color: "#22c55e" },
  { id: 3, name: "Stump #4", a: -1, b: 1, c: 5, acc: 0.58, weight: 0.5, color: "#06b6d4" },
  { id: 4, name: "Stump #5", a: 1, b: 1, c: -100, acc: 0.70, weight: 1.0, color: "#a855f7" },
];

type Mode = "bagging" | "boosting" | "stacking";

/* ─────────────────────────────────────────────────────────────────────────────
 * Quiz — 8 câu bao phủ Bagging / Boosting / Stacking + real-world tuning.
 * ─────────────────────────────────────────────────────────────────────────── */

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "Bagging giảm gì: bias hay variance?",
    options: [
      "BIAS — vì mỗi model yếu được làm cho mạnh lên",
      "VARIANCE — train nhiều models trên random subsets, average giảm variance (overfitting)",
      "Cả hai cùng lúc như nhau",
    ],
    correct: 1,
    explanation:
      "Bagging: mỗi model overfit theo cách khác nhau (random subset + random feature). Average nhiều models → random errors triệt tiêu nhau → variance giảm. Bias không đổi vì mỗi model cùng độ phức tạp. Random Forest = Bagging + Decision Trees.",
  },
  {
    question: "Boosting giảm gì: bias hay variance?",
    options: [
      "BIAS — mỗi model mới focus vào lỗi còn lại, dần giảm bias",
      "VARIANCE — nhiều model giúp cân bằng dự đoán",
      "Không giảm gì đáng kể",
    ],
    correct: 0,
    explanation:
      "Boosting: model 1 sai ở đâu → model 2 focus vào đó → model 3 focus vào lỗi còn lại... Dần dần giảm bias (underfitting). Nhưng quá nhiều rounds → overfit (tăng variance). Cần early stopping và learning_rate nhỏ!",
  },
  {
    question:
      "Tại sao XGBoost thắng hầu hết cuộc thi Kaggle cho tabular data?",
    options: [
      "Vì nó mới nhất trong danh sách thuật toán sklearn",
      "Kết hợp boosting mạnh (giảm bias) + regularization (kiểm soát variance) + xử lý missing values + parallel",
      "Vì nó chạy deep learning dưới hood",
    ],
    correct: 1,
    explanation:
      "XGBoost: gradient boosting + L1/L2 regularization + tree pruning + built-in cross-validation + missing value handling + parallel training. Trên tabular data, XGBoost/LightGBM vẫn thắng deep learning trong đa số trường hợp!",
  },
  {
    type: "fill-blank",
    question:
      "Random Forest thuộc nhóm {blank} — trainings song song nhiều cây trên bootstrap sample rồi vote/average.",
    blanks: [{ answer: "bagging", accept: ["Bagging", "BAGGING"] }],
    explanation:
      "Random Forest = Bagging với Decision Trees + random feature subsampling. Điểm khác Bagging gốc: tại mỗi split, cây chỉ được xem m &lt; d features ngẫu nhiên → giảm correlation giữa các cây → giảm variance mạnh hơn.",
  },
  {
    question:
      "3 models độc lập, accuracy lần lượt 80%, 82%, 85%. Majority voting. Ensemble có thể đạt bao nhiêu?",
    options: [
      "85% — không vượt model tốt nhất được",
      "87-92% — khi lỗi DIVERSE, ensemble thường tốt hơn model tốt nhất vài điểm %",
      "100% nếu kết hợp đúng cách",
    ],
    correct: 1,
    explanation:
      "Nguyên lý: khi models SAI Ở NHỮNG CHỖ KHÁC NHAU, majority vote hiệu quả vì 2/3 đúng → ensemble đúng. Nếu 3 models sai chung chỗ → ensemble cũng sai. Key: diversity quan trọng hơn accuracy cá nhân.",
  },
  {
    question: "Stacking khác Voting ở điểm nào?",
    options: [
      "Stacking chỉ dùng tree-based models, Voting dùng linear",
      "Stacking có meta-learner học cách TRỌNG SỐ output của các base models. Voting dùng quy tắc cố định (majority / average)",
      "Không có khác biệt thực sự",
    ],
    correct: 1,
    explanation:
      "VotingClassifier: kết hợp output theo quy tắc đơn giản (hard/soft vote). StackingClassifier: base models → đầu ra của chúng được làm feature cho meta-learner (thường LogReg) — meta-learner tự học trọng số tối ưu. Stacking linh hoạt hơn, nhưng dễ overfit, cần CV cẩn thận.",
  },
  {
    question:
      "Trong Gradient Boosting, learning_rate nhỏ (eg 0.05) vs lớn (eg 0.5)?",
    options: [
      "Nhỏ → cần nhiều cây hơn (n_estimators lớn) nhưng thường generalize tốt hơn",
      "Lớn → generalize tốt hơn vì học nhanh",
      "Không ảnh hưởng đến kết quả cuối cùng",
    ],
    correct: 0,
    explanation:
      "Quy tắc kinh nghiệm: learning_rate nhỏ (0.01-0.1) + n_estimators lớn (500-2000) + early stopping thường tốt hơn rate lớn + ít cây. Rate nhỏ buộc mô hình học từ từ, mỗi cây chỉ sửa 1 chút lỗi → robust với noise.",
  },
  {
    question:
      "Dataset cực imbalanced (99% negative, 1% positive). Chọn ensemble nào?",
    options: [
      "RandomForest với mặc định — ensemble luôn giải quyết mọi thứ",
      "XGBoost với scale_pos_weight hoặc BalancedRandomForest + threshold tuning — ensemble không tự xử lý imbalance",
      "Bỏ ensemble, dùng logistic regression đơn thuần",
    ],
    correct: 1,
    explanation:
      "Ensemble không magic — vẫn cần xử lý imbalance: (1) class weights (scale_pos_weight trong XGBoost, class_weight='balanced' trong RF); (2) oversampling SMOTE / undersampling; (3) threshold tuning dựa trên precision-recall curve thay vì default 0.5.",
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
 * Component
 * ─────────────────────────────────────────────────────────────────────────── */

export default function EnsembleMethodsTopic() {
  const [mode, setMode] = useState<Mode>("bagging");
  const [active, setActive] = useState<boolean[]>([true, true, true, true, true]);

  const toggleLearner = useCallback((idx: number) => {
    setActive((prev) => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  }, []);

  const resetLearners = useCallback(() => {
    setActive([true, true, true, true, true]);
  }, []);

  const activeCount = active.filter(Boolean).length;

  /* ── score function: computes weighted sum over active learners ── */
  const scoreAt = useCallback(
    (x: number, y: number) => {
      let s = 0;
      let totalW = 0;
      LEARNERS.forEach((L, idx) => {
        if (!active[idx]) return;
        const raw = L.a * x + L.b * y + L.c;
        const side = raw >= 0 ? 1 : -1;
        if (mode === "boosting") {
          s += side * L.weight;
          totalW += L.weight;
        } else if (mode === "stacking") {
          // stacking: use learner's accuracy as weight
          s += side * (L.acc - 0.5) * 2;
          totalW += (L.acc - 0.5) * 2;
        } else {
          // bagging: equal vote
          s += side;
          totalW += 1;
        }
      });
      return totalW === 0 ? 0 : s / totalW;
    },
    [active, mode]
  );

  /* ── precomputed low-res grid for combined decision contour ── */
  const gridCells = useMemo(() => {
    const cells: { x: number; y: number; cls: number }[] = [];
    for (let gx = 0; gx <= 100; gx += 4) {
      for (let gy = 0; gy <= 100; gy += 4) {
        const score = scoreAt(gx, gy);
        cells.push({ x: gx, y: gy, cls: score >= 0 ? 1 : 0 });
      }
    }
    return cells;
  }, [scoreAt]);

  /* ── compute ensemble accuracy over the scatter ── */
  const ensembleAcc = useMemo(() => {
    if (activeCount === 0) return 0;
    let correct = 0;
    SCATTER.forEach((p) => {
      const pred = scoreAt(p.x, p.y) >= 0 ? 1 : 0;
      if (pred === p.label) correct += 1;
    });
    return correct / SCATTER.length;
  }, [scoreAt, activeCount]);

  /* ── helper: line endpoints for each learner ── */
  const lineEndpoints = (L: Learner) => {
    // a*x + b*y + c = 0
    if (Math.abs(L.b) < 1e-6) {
      const x = -L.c / L.a;
      return { x1: x, y1: 0, x2: x, y2: 100 };
    }
    const y1 = (-L.a * 0 - L.c) / L.b;
    const y2 = (-L.a * 100 - L.c) / L.b;
    return { x1: 0, y1, x2: 100, y2 };
  };

  return (
    <>
      {/* ─────────── STEP 1 ── PREDICTION ─────────── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <div className="mb-4">
          <ProgressSteps
            current={1}
            total={TOTAL_STEPS}
            labels={[
              "Dự đoán",
              "Khám phá",
              "Aha",
              "Thử thách",
              "Lý thuyết",
              "Tóm tắt",
              "Kiểm tra",
            ]}
          />
        </div>

        <PredictionGate
          question="Bạn hỏi 100 người dự đoán thời tiết ngày mai. Mỗi người đúng 70%, và sai độc lập. Nếu lấy đa số phiếu, độ chính xác sẽ thế nào?"
          options={[
            "Vẫn 70% — không thể vượt trung bình cá nhân",
            "Cao hơn nhiều — ~97% vì lỗi của từng người triệt tiêu nhau khi kết hợp",
            "Thấp hơn 70% vì nhiều ý kiến trái chiều",
          ]}
          correct={1}
          explanation="Đúng! Luật số lớn (Condorcet's Jury Theorem): nếu mỗi người đúng > 50% và SAI ĐỘC LẬP, majority voting tăng accuracy theo cấp số nhân. 100 người x 70% → ~97%. Đây chính là nguyên lý Ensemble: kết hợp nhiều model yếu thành model mạnh!"
        >
          {/* ─────────── STEP 2 ── VISUALIZATION ─────────── */}
          <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
            <p className="mb-4 text-sm text-muted leading-relaxed">
              Mỗi <strong className="text-foreground">weak learner</strong>{" "}
              (line stump) chỉ cắt không gian thành 2 nửa. Bật/tắt từng
              learner để xem <strong>đường biên ensemble</strong> thay đổi
              thế nào. Đổi tab để so sánh 3 chiến lược kết hợp.
            </p>

            <VisualizationSection>
              <div className="space-y-5">
                {/* mode tabs */}
                <div className="flex flex-wrap gap-2">
                  {(["bagging", "boosting", "stacking"] as Mode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
                        mode === m
                          ? "bg-accent text-white"
                          : "bg-card border border-border text-muted hover:text-foreground"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={resetLearners}
                    className="ml-auto rounded-lg px-3 py-2 text-xs font-medium text-muted hover:text-foreground"
                  >
                    ↺ Bật lại tất cả
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* left: scatter + learner lines */}
                  <div className="rounded-xl border border-border bg-surface p-3">
                    <p className="mb-2 text-xs font-semibold text-muted">
                      Scatter + 5 learner ({activeCount}/5 active)
                    </p>
                    <svg viewBox="0 0 100 100" className="w-full h-auto">
                      <rect
                        x={0}
                        y={0}
                        width={100}
                        height={100}
                        fill="#0f172a"
                        rx={2}
                      />

                      {/* scatter points */}
                      {SCATTER.map((p, i) => (
                        <circle
                          key={i}
                          cx={p.x}
                          cy={p.y}
                          r={1.3}
                          fill={p.label === 1 ? "#22c55e" : "#f43f5e"}
                          opacity={0.8}
                        />
                      ))}

                      {/* learner boundaries */}
                      {LEARNERS.map((L, idx) => {
                        const { x1, y1, x2, y2 } = lineEndpoints(L);
                        return (
                          <line
                            key={L.id}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={L.color}
                            strokeWidth={active[idx] ? 0.6 : 0.2}
                            strokeDasharray={active[idx] ? "0" : "2,2"}
                            opacity={active[idx] ? 0.9 : 0.35}
                          />
                        );
                      })}
                    </svg>
                  </div>

                  {/* right: combined decision boundary */}
                  <div className="rounded-xl border border-border bg-surface p-3">
                    <p className="mb-2 text-xs font-semibold text-muted">
                      Combined boundary — {mode} · acc ={" "}
                      {(ensembleAcc * 100).toFixed(1)}%
                    </p>
                    <svg viewBox="0 0 100 100" className="w-full h-auto">
                      <rect
                        x={0}
                        y={0}
                        width={100}
                        height={100}
                        fill="#0f172a"
                        rx={2}
                      />

                      {/* decision regions */}
                      {gridCells.map((c, i) => (
                        <rect
                          key={i}
                          x={c.x}
                          y={c.y}
                          width={4}
                          height={4}
                          fill={c.cls === 1 ? "#22c55e" : "#f43f5e"}
                          opacity={0.18}
                        />
                      ))}

                      {/* scatter on top */}
                      {SCATTER.map((p, i) => (
                        <circle
                          key={i}
                          cx={p.x}
                          cy={p.y}
                          r={1.3}
                          fill={p.label === 1 ? "#22c55e" : "#f43f5e"}
                          stroke="#0f172a"
                          strokeWidth={0.3}
                        />
                      ))}
                    </svg>
                  </div>
                </div>

                {/* learner toggles */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                    Toggle learners
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {LEARNERS.map((L, idx) => (
                      <button
                        key={L.id}
                        type="button"
                        onClick={() => toggleLearner(idx)}
                        className={`rounded-lg border px-2 py-2 text-left text-[11px] font-medium transition-all ${
                          active[idx]
                            ? "bg-card border-accent text-foreground"
                            : "bg-surface border-border text-muted opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: L.color }}
                          />
                          <span>{L.name}</span>
                        </div>
                        <div className="mt-1 text-[10px] text-muted">
                          acc={Math.round(L.acc * 100)}% · w=
                          {L.weight.toFixed(1)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* status row */}
                <motion.div
                  key={`${mode}-${activeCount}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-lg bg-surface px-4 py-3 text-xs leading-relaxed"
                >
                  <p className="text-muted">
                    <strong className="text-foreground">Chế độ {mode}</strong>:{" "}
                    {mode === "bagging" &&
                      "mỗi learner một phiếu bằng nhau (equal vote). Càng nhiều learner DIVERSE, variance càng giảm."}
                    {mode === "boosting" &&
                      "learner có trọng số khác nhau — learner sau được tăng trọng số nếu sửa được lỗi của learner trước. Bias giảm dần."}
                    {mode === "stacking" &&
                      "trọng số = (accuracy - 0.5) × 2 — gần giống meta-learner đơn giản học cách kết hợp base models."}
                  </p>
                </motion.div>

                <div className="rounded-lg border border-dashed border-border bg-surface/60 p-3 text-[11px] text-muted leading-relaxed">
                  <strong className="text-foreground">Gợi ý:</strong> tắt
                  hết chỉ để 1 learner → xem biên chỉ là 1 đường thẳng. Bật
                  cả 5 → biên combine thành piecewise-linear phức tạp hơn
                  nhiều. Đó chính là power của ensemble.
                </div>
              </div>
            </VisualizationSection>
          </LessonSection>

          {/* ─────────── STEP 3 ── AHA ─────────── */}
          <LessonSection
            step={3}
            totalSteps={TOTAL_STEPS}
            label="Khoảnh khắc Aha"
          >
            <AhaMoment>
              <p>
                Bagging giảm <strong>variance</strong> (nhiều model random
                → average triệt tiêu noise). Boosting giảm{" "}
                <strong>bias</strong> (mỗi model focus vào lỗi còn lại).
                Stacking <strong>kết hợp tốt nhất của cả hai</strong> —
                meta-learner học cách trọng số tối ưu. Đây là lý do ensemble
                LUÔN (gần như luôn) mạnh hơn single model!
              </p>
            </AhaMoment>

            <div className="mt-4">
              <Callout variant="insight" title="Diversity là vua">
                Ensemble mạnh không phải vì từng model giỏi, mà vì các
                model SAI Ở NHỮNG CHỖ KHÁC NHAU. 3 models 80% diverse &gt; 3
                models 90% giống nhau.
              </Callout>
            </div>
          </LessonSection>

          {/* ─────────── STEP 4 ── CHALLENGE ─────────── */}
          <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
            <InlineChallenge
              question="Model A accuracy 85%, Model B 82%, Model C 80%. Ensemble (voting) có thể đạt bao nhiêu?"
              options={[
                "85% (bằng model tốt nhất) — không thể vượt ceiling này",
                "87-90% — ensemble thường tốt hơn model tốt nhất 2-5% vì lỗi khác nhau triệt tiêu",
                "100% nếu kết hợp đủ nhiều model",
              ]}
              correct={1}
              explanation="Ensemble hiệu quả khi models SAI Ở NHỮNG CHỖ KHÁC NHAU (diverse). Nếu 3 models đều sai cùng chỗ → ensemble cũng sai. A sai chỗ X, B sai chỗ Y, C sai chỗ Z → majority voting đúng cho X, Y, Z. Key: diversity > individual accuracy!"
            />

            <div className="mt-5">
              <InlineChallenge
                question="Bạn train 100 RandomForest trên CÙNG bootstrap sample, CÙNG features. Ensemble có cải thiện không?"
                options={[
                  "Có, luôn luôn cải thiện khi thêm model",
                  "Không — 100 cây giống hệt nhau = 1 cây. Variance không giảm vì không có diversity",
                  "Chỉ cải thiện khi dữ liệu có noise",
                ]}
                correct={1}
                explanation="Nguyên lý cốt lõi: ensemble giảm variance qua TRIỆT TIÊU noise ĐỘC LẬP. Nếu models giống hệt nhau, errors tương quan 100% → không có gì để trung bình. Random Forest chèn randomness (bootstrap + random features) chính vì vậy — để tạo diversity."
              />
            </div>
          </LessonSection>

          {/* ─────────── STEP 5 ── EXPLANATION ─────────── */}
          <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
            <ExplanationSection>
              <p>
                <strong>Ensemble Methods</strong> kết hợp nhiều models thành
                1 model mạnh hơn — nguyên lý cơ bản nhất để tăng accuracy
                sau preprocessing. Trong thực tế, hầu hết các mô hình sản
                xuất (production) và các mô hình thắng Kaggle đều là
                ensemble. Xem thêm{" "}
                <TopicLink slug="random-forests">Random Forest</TopicLink>{" "}
                và{" "}
                <TopicLink slug="gradient-boosting">
                  Gradient Boosting
                </TopicLink>{" "}
                để đi sâu vào từng họ.
              </p>

              <p>
                <strong>1) Bagging (Bootstrap Aggregating):</strong>
              </p>
              <LaTeX block>
                {
                  "\\hat{f}_{\\text{bag}}(x) = \\frac{1}{B} \\sum_{b=1}^{B} f_b(x) \\quad \\text{(average B models trên bootstrap samples)}"
                }
              </LaTeX>
              <p>
                Mỗi model được train trên 1 bootstrap sample (sampling có
                hoàn lại) của dataset gốc. Dự đoán cuối = majority vote
                (classification) hoặc average (regression). Vì các model
                thấy data hơi khác nhau, chúng overfit khác nhau → average
                làm mượt.
              </p>

              <p>
                <strong>2) Boosting:</strong>
              </p>
              <LaTeX block>
                {
                  "\\hat{f}_{\\text{boost}}(x) = \\sum_{m=1}^{M} \\alpha_m f_m(x) \\quad \\text{(weighted sum, model sau focus lỗi model trước)}"
                }
              </LaTeX>
              <p>
                Các model train tuần tự. Sau mỗi round, dữ liệu sai được
                tăng trọng số (AdaBoost) hoặc model kế tiếp fit residual
                (Gradient Boosting). Kết quả: 1 chuỗi weak learner cùng tay
                nhau giảm bias.
              </p>

              <p>
                <strong>3) Stacking:</strong>
              </p>
              <LaTeX block>
                {
                  "\\hat{f}_{\\text{stack}}(x) = g\\Big(f_1(x), f_2(x), \\ldots, f_K(x)\\Big)"
                }
              </LaTeX>
              <p>
                K base models dự đoán, output của chúng trở thành feature
                đầu vào cho 1 meta-learner <em>g</em> (thường là
                LogisticRegression hoặc LinearRegression). Meta-learner tự
                học trọng số tối ưu — linh hoạt hơn voting cố định nhưng
                cũng dễ overfit hơn.
              </p>

              <Callout
                variant="tip"
                title="XGBoost/LightGBM vẫn thắng Deep Learning cho tabular data"
              >
                Trên Kaggle tabular competitions, XGBoost/LightGBM/CatBoost
                thắng deep learning trong 80%+ trường hợp. Deep learning
                cần nhiều data + tốt cho unstructured (ảnh, text). Tabular:
                tree-based ensembles vẫn là vua.
              </Callout>

              <Callout variant="info" title="Khi nào không nên dùng ensemble?">
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>Latency cực thấp</strong> (vd dưới 1ms/req):
                    ensemble tốn nhiều lần forward pass.
                  </li>
                  <li>
                    <strong>Memory chặt</strong>: RandomForest 500 cây ×
                    depth 20 có thể &gt; 1GB.
                  </li>
                  <li>
                    <strong>Explainability bắt buộc</strong>: ensemble khó
                    giải thích hơn single tree hoặc linear model (dù có
                    SHAP).
                  </li>
                  <li>
                    <strong>Data rất ít</strong>: ensemble phức tạp dễ
                    overfit; baseline đơn giản thường cạnh tranh hơn.
                  </li>
                </ul>
              </Callout>

              <Callout variant="warning" title="Đừng lạm dụng stacking">
                Stacking là con dao 2 lưỡi: dễ overfit nếu bạn không dùng
                out-of-fold predictions cho meta-learner. Luôn cross-
                validate base models để sinh features cho meta-learner, và
                giữ 1 holdout set cho đánh giá cuối.
              </Callout>

              <Callout
                variant="insight"
                title="Mẹo thực chiến cho Kaggle / production"
              >
                Baseline mạnh thường là 1 model LightGBM tuned tốt. Trước
                khi nhảy sang stacking 10 model, hãy tune thật kỹ 1 model,
                rồi mới thêm dần. Phần lớn gain đến từ feature engineering
                + single-model tuning, không phải stacking 100 model.
              </Callout>

              <CodeBlock
                language="python"
                title="RandomForestClassifier — Bagging ensemble"
              >
                {`from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42,
)

rf = RandomForestClassifier(
    n_estimators=300,          # số cây — càng nhiều càng tốt, tới lúc bão hoà
    max_depth=None,             # None = cây sâu tối đa (giảm bias)
    min_samples_leaf=2,         # chống overfit trên lá quá nhỏ
    max_features="sqrt",        # randomness giữa các split
    bootstrap=True,             # mẫu có hoàn lại
    n_jobs=-1,                  # parallel trên mọi core
    random_state=42,
)

# 5-fold CV để đánh giá
scores = cross_val_score(rf, X_train, y_train, cv=5, scoring="roc_auc")
print(f"CV AUC = {scores.mean():.3f} ± {scores.std():.3f}")

rf.fit(X_train, y_train)
print("Test AUC:", rf.score(X_test, y_test))

# Feature importance — điểm cộng của RF
import pandas as pd
imp = pd.Series(rf.feature_importances_, index=X_train.columns)
print(imp.sort_values(ascending=False).head(10))`}
              </CodeBlock>

              <CodeBlock
                language="python"
                title="GradientBoostingClassifier + StackingClassifier"
              >
                {`from sklearn.ensemble import (
    GradientBoostingClassifier,
    RandomForestClassifier,
    StackingClassifier,
)
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC

# ── Boosting đơn lẻ ──
gb = GradientBoostingClassifier(
    n_estimators=500,
    learning_rate=0.05,         # nhỏ + nhiều cây thường generalize tốt hơn
    max_depth=3,                 # cây cạn, vì boosting giảm bias qua NHIỀU cây cạn
    subsample=0.8,               # stochastic GB giảm variance
    random_state=42,
)
gb.fit(X_train, y_train)
print("GB test AUC:", gb.score(X_test, y_test))

# ── Stacking: RF + GB + SVM → LogReg ──
stack = StackingClassifier(
    estimators=[
        ("rf", RandomForestClassifier(n_estimators=200, n_jobs=-1, random_state=42)),
        ("gb", GradientBoostingClassifier(n_estimators=300, learning_rate=0.05, random_state=42)),
        ("svm", SVC(probability=True, C=1.0, kernel="rbf")),
    ],
    final_estimator=LogisticRegression(max_iter=1000),
    cv=5,                         # out-of-fold predictions → meta-learner
    n_jobs=-1,
    passthrough=False,            # meta-learner chỉ thấy output base models
)
stack.fit(X_train, y_train)
print("Stacking test AUC:", stack.score(X_test, y_test))
# Thường tốt hơn bất kỳ model đơn lẻ nào 1-3%`}
              </CodeBlock>

              <CollapsibleDetail title="Chi tiết: bagging thực sự giảm variance thế nào?">
                <p className="text-sm text-muted leading-relaxed">
                  Giả sử bạn có B models độc lập cùng variance σ². Trung
                  bình B models có variance σ²/B (theo công thức cơ bản của
                  Var(mean)). Khi B → ∞, variance → 0. Thực tế, các model
                  trên bootstrap samples KHÔNG hoàn toàn độc lập — chúng
                  thấy cùng dataset gốc → correlation ρ &gt; 0.
                </p>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  Công thức chính xác: Var(average) = ρσ² + (1 − ρ)σ²/B.
                  Khi B lớn, term thứ hai → 0, term thứ nhất là
                  &ldquo;sàn&rdquo; không thể giảm thêm. Vì vậy Random
                  Forest cố ý đưa thêm randomness (random features tại mỗi
                  split) để giảm ρ → giảm variance sàn.
                </p>
              </CollapsibleDetail>

              <CollapsibleDetail title="Chi tiết: gradient boosting là gradient descent trong hàm space">
                <p className="text-sm text-muted leading-relaxed">
                  Gradient Boosting tối thiểu hoá loss L(y, F(x)) bằng cách
                  xem F như điểm trong không gian hàm. Mỗi iteration:
                </p>
                <ol className="mt-2 list-decimal list-inside space-y-1 text-sm text-muted">
                  <li>
                    Tính residual <em>r_i = −∂L/∂F(x_i)</em> — &ldquo;chiều
                    gradient&rdquo; tại mỗi điểm.
                  </li>
                  <li>
                    Fit 1 cây h_m(x) dự đoán r_i. Cây này = bước gradient
                    descent trong function space.
                  </li>
                  <li>
                    Cập nhật F ← F + η · h_m, với η là learning_rate.
                  </li>
                </ol>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  Vì vậy &ldquo;gradient&rdquo; trong Gradient Boosting
                  không phải cập nhật weights, mà cập nhật HÀM F. Đây là
                  cái nhìn đẹp thống nhất GB với optimizer SGD thông
                  thường.
                </p>
              </CollapsibleDetail>

              <div className="mt-4 rounded-xl border border-border bg-card p-4 text-sm leading-relaxed text-foreground/90">
                <p className="mb-2 font-semibold text-foreground">
                  Bảng so sánh nhanh 3 họ ensemble
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted">
                  <li>
                    <strong>Bagging</strong> — giảm variance, model song
                    song, ít tune. Đại diện: RandomForest, ExtraTrees.
                  </li>
                  <li>
                    <strong>Boosting</strong> — giảm bias, model tuần tự,
                    cần tune learning_rate + n_estimators + depth. Đại
                    diện: XGBoost, LightGBM, CatBoost.
                  </li>
                  <li>
                    <strong>Stacking</strong> — meta-learner học trọng số
                    tối ưu. Mạnh nhưng dễ overfit, cần CV. Đại diện:
                    Stacked Generalization (Wolpert 1992).
                  </li>
                </ul>
              </div>

              <div className="mt-4 rounded-xl border border-border bg-card p-4 text-sm leading-relaxed text-foreground/90">
                <p className="mb-2 font-semibold text-foreground">
                  Hyperparameter cheat sheet
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted">
                  <li>
                    <strong>RandomForest:</strong> n_estimators 200-500,
                    max_depth None, min_samples_leaf 1-5,
                    max_features=&quot;sqrt&quot;.
                  </li>
                  <li>
                    <strong>XGBoost/LightGBM:</strong> learning_rate
                    0.01-0.1, n_estimators 500-2000 + early_stopping,
                    max_depth 4-8, subsample 0.7-0.9, colsample_bytree
                    0.7-0.9, reg_lambda 1-10.
                  </li>
                  <li>
                    <strong>Stacking:</strong> 3-5 base models đa dạng
                    (linear, tree, svm) + meta = LogReg regularised.
                  </li>
                </ul>
              </div>

              <p className="mt-4">
                <strong>Một workflow chiến thắng cho tabular data</strong>:
              </p>
              <ol className="mt-2 list-decimal list-inside space-y-1 pl-2 text-sm">
                <li>Baseline: LogisticRegression + basic features.</li>
                <li>
                  RandomForest mặc định — đã thường vượt baseline rõ.
                </li>
                <li>
                  LightGBM tuned kỹ (learning_rate, num_leaves, depth,
                  lambda).
                </li>
                <li>
                  Feature engineering sâu hơn (interactions, target
                  encoding, time-based aggregations).
                </li>
                <li>
                  Ensemble cuối cùng: LightGBM + XGBoost + CatBoost với
                  weighted average hoặc stacking nhẹ.
                </li>
              </ol>

              <p className="mt-3 text-sm text-muted">
                Workflow này chiếm phần lớn các giải Top 10 Kaggle tabular
                suốt 5 năm qua. Ngay cả khi deep learning lên ngôi ở các
                domain khác, trên tabular tree-based ensemble vẫn thống
                trị.
              </p>

              <LaTeX block>
                {
                  "\\text{AdaBoost weights: } w_i^{(m+1)} = w_i^{(m)} \\exp\\big(\\alpha_m \\cdot \\mathbb{1}[y_i \\neq f_m(x_i)]\\big)"
                }
              </LaTeX>

              <LaTeX block>
                {
                  "\\alpha_m = \\tfrac{1}{2} \\ln\\!\\left(\\frac{1 - \\epsilon_m}{\\epsilon_m}\\right), \\quad \\epsilon_m = \\text{training error round } m"
                }
              </LaTeX>

              <p className="mt-3">
                Công thức trên cho thấy rõ cơ chế boosting: mẫu nào bị
                model hiện tại phân sai sẽ được tăng trọng số ở round sau,
                còn trọng số model <em>α_m</em> cao khi lỗi thấp. Chính
                xếp hạng mẫu theo độ khó + trọng số model theo độ chính xác
                đã tạo nên sức mạnh của boosting.
              </p>

              <p className="mt-4">
                <strong>Hiểu sâu: bias-variance tradeoff qua ensemble.</strong>{" "}
                Mỗi model có bias (sai lệch hệ thống) và variance (nhạy
                theo từng sample). Ensemble tác động theo 2 cách đối
                nghịch:
              </p>

              <ul className="mt-2 list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>Bagging:</strong> giữ bias, giảm variance. Dùng
                  khi base model có variance cao (cây sâu, KNN với k nhỏ).
                </li>
                <li>
                  <strong>Boosting:</strong> giữ variance thấp, giảm bias.
                  Dùng khi base model đơn giản (cây cạn, stump) nhưng cần
                  capacity lớn.
                </li>
                <li>
                  <strong>Stacking:</strong> có thể làm cả hai nếu base
                  models có bias/variance khác nhau và meta-learner học
                  được mix đúng.
                </li>
              </ul>

              <LaTeX block>
                {
                  "\\mathbb{E}[(y - \\hat{f}(x))^2] = \\underbrace{(\\bar{f}(x) - f(x))^2}_{\\text{bias}^2} + \\underbrace{\\mathrm{Var}(\\hat{f}(x))}_{\\text{variance}} + \\sigma_\\varepsilon^2"
                }
              </LaTeX>

              <p>
                Công thức tổng error = bias² + variance + irreducible
                noise. Bagging tấn công term thứ hai, boosting tấn công
                term thứ nhất — vì vậy cả hai được coi là bổ sung nhau.
              </p>

              <CodeBlock
                language="python"
                title="Early stopping trong Gradient Boosting"
              >
                {`from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
import numpy as np

X_tr, X_val, y_tr, y_val = train_test_split(
    X_train, y_train, test_size=0.2, stratify=y_train, random_state=0,
)

gb = GradientBoostingClassifier(
    n_estimators=1000,
    learning_rate=0.05,
    max_depth=3,
    validation_fraction=0.2,
    n_iter_no_change=20,          # early stopping!
    tol=1e-4,
    random_state=42,
)
gb.fit(X_tr, y_tr)

print("Số cây thực tế dùng:", gb.n_estimators_)
print("Validation loss history:", gb.train_score_[:5])

# Khi val loss không giảm trong 20 rounds → dừng, tránh overfit.
# Đây là cách gần như tất cả implementation hiện đại (XGBoost,
# LightGBM, CatBoost) đều dùng để chọn số cây tối ưu.`}
              </CodeBlock>

              <CodeBlock
                language="python"
                title="Soft voting vs hard voting — khi nào?"
              >
                {`from sklearn.ensemble import VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier

# 3 base models đa dạng
clf1 = LogisticRegression(max_iter=1000)
clf2 = DecisionTreeClassifier(max_depth=5)
clf3 = KNeighborsClassifier(n_neighbors=7)

vote = VotingClassifier(
    estimators=[("lr", clf1), ("dt", clf2), ("knn", clf3)],
    voting="soft",   # dùng xác suất — thường tốt hơn hard voting
    weights=[2, 1, 1],  # linear model mạnh hơn trong trường hợp này
)

vote.fit(X_train, y_train)
print("Voting ensemble AUC:", vote.score(X_test, y_test))`}
              </CodeBlock>

              {/* ── BAGGING VS BOOSTING VS STACKING — MỞ RỘNG ── */}
              <div className="mt-8 rounded-2xl border border-accent/40 bg-accent/5 p-5">
                <p className="mb-3 text-sm font-bold text-foreground">
                  🔍 So sánh chi tiết: Bagging vs Boosting vs Stacking
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-[11px]">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="px-2 py-2 font-semibold text-muted">Tiêu chí</th>
                        <th className="px-2 py-2 font-semibold text-green-400">Bagging</th>
                        <th className="px-2 py-2 font-semibold text-orange-400">Boosting</th>
                        <th className="px-2 py-2 font-semibold text-purple-400">Stacking</th>
                      </tr>
                    </thead>
                    <tbody className="text-foreground/80">
                      <tr className="border-b border-border/40">
                        <td className="px-2 py-2 font-medium">Training</td>
                        <td className="px-2 py-2">Parallel</td>
                        <td className="px-2 py-2">Sequential</td>
                        <td className="px-2 py-2">Parallel base + meta</td>
                      </tr>
                      <tr className="border-b border-border/40">
                        <td className="px-2 py-2 font-medium">Giảm</td>
                        <td className="px-2 py-2">Variance (mạnh)</td>
                        <td className="px-2 py-2">Bias (mạnh)</td>
                        <td className="px-2 py-2">Cả hai nếu base đa dạng</td>
                      </tr>
                      <tr className="border-b border-border/40">
                        <td className="px-2 py-2 font-medium">Base model</td>
                        <td className="px-2 py-2">Cây sâu, variance cao</td>
                        <td className="px-2 py-2">Cây cạn (depth 3-8)</td>
                        <td className="px-2 py-2">Đa dạng: linear+tree+svm</td>
                      </tr>
                      <tr className="border-b border-border/40">
                        <td className="px-2 py-2 font-medium">Overfit risk</td>
                        <td className="px-2 py-2">Thấp</td>
                        <td className="px-2 py-2">Cao nếu không early stop</td>
                        <td className="px-2 py-2">Cao (cần CV)</td>
                      </tr>
                      <tr className="border-b border-border/40">
                        <td className="px-2 py-2 font-medium">Tune effort</td>
                        <td className="px-2 py-2">Ít</td>
                        <td className="px-2 py-2">Nhiều (lr, depth, reg)</td>
                        <td className="px-2 py-2">Nhiều (base+meta+CV)</td>
                      </tr>
                      <tr className="border-b border-border/40">
                        <td className="px-2 py-2 font-medium">Latency</td>
                        <td className="px-2 py-2">Nhanh</td>
                        <td className="px-2 py-2">Trung bình</td>
                        <td className="px-2 py-2">Chậm (K+1 models)</td>
                      </tr>
                      <tr className="border-b border-border/40">
                        <td className="px-2 py-2 font-medium">Đại diện</td>
                        <td className="px-2 py-2">RF, ExtraTrees</td>
                        <td className="px-2 py-2">XGB, LGBM, CatBoost, Ada</td>
                        <td className="px-2 py-2">StackingClassifier, blending</td>
                      </tr>
                      <tr>
                        <td className="px-2 py-2 font-medium">Kaggle win</td>
                        <td className="px-2 py-2">~15%</td>
                        <td className="px-2 py-2">~60% (tabular)</td>
                        <td className="px-2 py-2">~25% (top sol.)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="mt-4 text-[11px] leading-relaxed text-muted">
                  💡 <strong className="text-foreground">Quy tắc:</strong>{" "}
                  Bagging mặc định → Boosting nếu chưa đủ → Stacking vét
                  1-2% cuối. Ngược lại là anti-pattern.
                </p>
              </div>

              {/* ── XGBOOST CODEBLOCK ── */}
              <CodeBlock
                language="python"
                title="XGBoost — baseline thực chiến + early stopping + hyperparameter quan trọng"
              >
                {`import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score

X_tr, X_val, y_tr, y_val = train_test_split(
    X_train, y_train, test_size=0.2, stratify=y_train, random_state=0,
)

# ── XGBoost tối ưu cho tabular classification ──
model = xgb.XGBClassifier(
    # CORE
    n_estimators=2000,            # nhiều cây, sẽ dừng sớm bằng early stopping
    learning_rate=0.05,           # nhỏ = generalize tốt hơn
    max_depth=6,                  # 4-8 là sweet spot tabular
    min_child_weight=1,           # min weight (sum hessian) mỗi leaf
    # RANDOMNESS (giống bagging, giúp giảm variance)
    subsample=0.8,                # 80% rows mỗi cây
    colsample_bytree=0.8,         # 80% cols mỗi cây
    colsample_bylevel=0.8,        # 80% cols mỗi level
    # REGULARIZATION
    reg_alpha=0.1,                # L1
    reg_lambda=1.0,               # L2 (default 1)
    gamma=0,                      # min loss reduction for split
    # MISC
    scale_pos_weight=(y_tr == 0).sum() / (y_tr == 1).sum(),  # cho imbalanced
    tree_method="hist",           # 10x nhanh hơn "exact"
    eval_metric="auc",
    early_stopping_rounds=50,
    n_jobs=-1,
    random_state=42,
)

model.fit(
    X_tr, y_tr,
    eval_set=[(X_val, y_val)],
    verbose=False,
)

print(f"Best iteration: {model.best_iteration}")
print(f"Val AUC: {model.best_score:.4f}")

# Feature importance
imp = sorted(zip(X_tr.columns, model.feature_importances_),
             key=lambda t: t[1], reverse=True)[:10]
for name, score in imp:
    print(f"  {name}: {score:.4f}")`}
              </CodeBlock>

              {/* ── LIGHTGBM CODEBLOCK ── */}
              <CodeBlock
                language="python"
                title="LightGBM — histogram-based GBDT, nhanh nhất cho dataset lớn"
              >
                {`import lightgbm as lgb
from sklearn.model_selection import StratifiedKFold
import numpy as np

# ── LightGBM 5-fold CV với early stopping ──
skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
oof = np.zeros(len(X_train))
val_aucs = []

params = dict(
    objective="binary",
    metric="auc",
    learning_rate=0.05,
    num_leaves=63,              # 2^6 - 1; trade-off depth
    max_depth=-1,                # unlimited (num_leaves controls)
    min_data_in_leaf=20,         # chống overfit leaf quá nhỏ
    feature_fraction=0.8,        # cols sampling
    bagging_fraction=0.8,        # rows sampling
    bagging_freq=5,
    lambda_l1=0.1,
    lambda_l2=0.1,
    verbosity=-1,
    n_jobs=-1,
    seed=42,
)

for fold, (tr_idx, val_idx) in enumerate(skf.split(X_train, y_train)):
    X_tr_f, X_val_f = X_train.iloc[tr_idx], X_train.iloc[val_idx]
    y_tr_f, y_val_f = y_train.iloc[tr_idx], y_train.iloc[val_idx]

    dtrain = lgb.Dataset(X_tr_f, label=y_tr_f)
    dvalid = lgb.Dataset(X_val_f, label=y_val_f, reference=dtrain)

    model = lgb.train(
        params,
        dtrain,
        num_boost_round=5000,
        valid_sets=[dvalid],
        callbacks=[
            lgb.early_stopping(stopping_rounds=100),
            lgb.log_evaluation(0),
        ],
    )
    oof[val_idx] = model.predict(X_val_f, num_iteration=model.best_iteration)
    val_aucs.append(roc_auc_score(y_val_f, oof[val_idx]))
    print(f"Fold {fold}: AUC = {val_aucs[-1]:.4f}, iters = {model.best_iteration}")

print(f"\\nOOF AUC mean: {np.mean(val_aucs):.4f} ± {np.std(val_aucs):.4f}")
print(f"OOF overall:  {roc_auc_score(y_train, oof):.4f}")

# Tại sao LightGBM nhanh hơn XGBoost?
# - Histogram binning thay exact search → O(#bins) thay O(#samples)
# - Leaf-wise growth (greedy) thay level-wise → ít cây hơn đạt cùng loss
# - Exclusive Feature Bundling (EFB) cho high-dim sparse
# - GOSS (Gradient One-Side Sampling): sample instance theo gradient`}
              </CodeBlock>

              {/* ── CATBOOST CODEBLOCK ── */}
              <CodeBlock
                language="python"
                title="CatBoost — xử lý categorical tự động, ít overfit nhất"
              >
                {`from catboost import CatBoostClassifier, Pool

cat_features = ["quan", "loai_nha", "huong_nha", "noi_that"]

train_pool = Pool(X_train, y_train, cat_features=cat_features)
val_pool   = Pool(X_val, y_val,     cat_features=cat_features)

model = CatBoostClassifier(
    iterations=5000,
    learning_rate=0.05,
    depth=6,                     # cân bằng cho tabular
    l2_leaf_reg=3.0,
    random_strength=1.0,         # random hóa split score → chống overfit
    bagging_temperature=1.0,     # Bayesian bootstrap (CatBoost-specific)
    border_count=128,            # #bins cho numeric
    # Xử lý categorical mạnh nhất thị trường hiện nay:
    # - Ordered target encoding (chống leakage)
    # - Combination features (tự động tạo feature từ cặp cat)
    one_hot_max_size=10,         # cat cardinality < 10 → one-hot
    eval_metric="AUC",
    early_stopping_rounds=100,
    use_best_model=True,
    task_type="CPU",             # hoặc "GPU" nếu có CUDA
    thread_count=-1,
    random_seed=42,
    verbose=200,
)

model.fit(train_pool, eval_set=val_pool, verbose=200)

print(f"Best iteration: {model.get_best_iteration()}")
print(f"Val AUC: {model.get_best_score()['validation']['AUC']:.4f}")

# CatBoost strengths:
# 1. Categorical gốc — không cần OneHot, không cần target encoding tự viết.
# 2. Symmetric trees → inference CỰC NHANH (O(depth) thay O(n_leaves)).
# 3. Ordered boosting → giảm prediction shift (gần như cross-validation built-in).
# 4. Ít overfit hơn XGBoost/LightGBM với default params — tốt cho người mới.`}
              </CodeBlock>

              {/* ── STACKING CHI TIẾT ── */}
              <CodeBlock
                language="python"
                title="StackingClassifier chi tiết — 3 base (RF + GB + LogReg) + meta = LogReg"
              >
                {`from sklearn.ensemble import (
    StackingClassifier,
    RandomForestClassifier,
    GradientBoostingClassifier,
)
from sklearn.linear_model import LogisticRegression, LogisticRegressionCV
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

# ── BASE MODELS đa dạng ──
# Lý tưởng: mỗi base có "góc nhìn" khác nhau — linear, tree, non-parametric.
estimators = [
    ("rf", RandomForestClassifier(
        n_estimators=300, max_features="sqrt", n_jobs=-1, random_state=42,
    )),
    ("gb", GradientBoostingClassifier(
        n_estimators=300, learning_rate=0.05, max_depth=4, random_state=42,
    )),
    ("lr", Pipeline([
        ("scale", StandardScaler()),
        ("lr", LogisticRegression(C=1.0, max_iter=2000, random_state=42)),
    ])),
]

# ── META LEARNER ──
# LogReg regularised là lựa chọn an toàn nhất — ít overfit output base.
meta = LogisticRegressionCV(
    Cs=[0.01, 0.1, 1.0, 10.0],
    cv=5,
    scoring="roc_auc",
    max_iter=2000,
)

stack = StackingClassifier(
    estimators=estimators,
    final_estimator=meta,
    cv=5,                          # 5-fold OOF predictions cho meta-learner
    stack_method="predict_proba",  # meta thấy probability thay vì label
    passthrough=False,             # True = cũng cho meta thấy X gốc
    n_jobs=-1,
    verbose=0,
)

stack.fit(X_train, y_train)

# Model 'nghe' từng base bao nhiêu?
print("Meta learner coefs:", stack.final_estimator_.coef_)
print("  (cột tương ứng: proba class 1 từ rf, gb, lr)")

# Score ensemble
from sklearn.metrics import roc_auc_score
proba = stack.predict_proba(X_test)[:, 1]
print(f"Stacking AUC: {roc_auc_score(y_test, proba):.4f}")`}
              </CodeBlock>

              {/* ── COLLAPSIBLE: ADABOOST MATH ── */}
              <CollapsibleDetail title="Chi tiết — AdaBoost: toán học đầy đủ từng round">
                <p className="text-sm text-muted leading-relaxed">
                  AdaBoost (Freund &amp; Schapire 1997) là thuật toán boosting
                  đầu tiên có bảo đảm lý thuyết. Mỗi round m, tăng trọng số
                  mẫu bị sai → model kế tiếp tập trung vào chúng.
                </p>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  Khởi tạo: w_i^(1) = 1/N. Mỗi round m:
                </p>
                <ol className="mt-2 list-decimal list-inside space-y-1 text-sm text-muted">
                  <li>Fit weak learner f_m (stump) trên data có trọng số w^(m).</li>
                  <li>Tính weighted error ε_m:</li>
                </ol>
                <LaTeX block>
                  {"\\epsilon_m = \\frac{\\sum_i w_i^{(m)} \\mathbb{1}[y_i \\neq f_m(x_i)]}{\\sum_i w_i^{(m)}}"}
                </LaTeX>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted" start={3}>
                  <li>Trọng số model α_m — càng nhỏ ε_m thì α_m càng lớn:</li>
                </ol>
                <LaTeX block>
                  {"\\alpha_m = \\tfrac{1}{2} \\ln\\!\\left(\\tfrac{1 - \\epsilon_m}{\\epsilon_m}\\right)"}
                </LaTeX>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted" start={4}>
                  <li>Update: w_i^(m+1) = w_i^(m) · exp(α_m · 𝟙[sai]), sau đó normalize về 1.</li>
                </ol>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  Dự đoán cuối (class −1/+1):
                </p>
                <LaTeX block>
                  {"F(x) = \\text{sign}\\!\\left(\\sum_{m=1}^{M} \\alpha_m f_m(x)\\right)"}
                </LaTeX>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  <strong>Kết nối exponential loss:</strong> AdaBoost chính
                  là gradient descent trên L(y, F) = exp(−y·F). Kết quả
                  của Friedman–Hastie–Tibshirani (2000) tổng quát hoá cho
                  mọi loss differentiable (MSE, log-loss, quantile, custom)
                  → Gradient Boosting.
                </p>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  <strong>Ví dụ số:</strong> round 1, stump sai 3/10 mẫu
                  đều nhau → ε_1 = 0.3 → α_1 = ½ ln(0.7/0.3) ≈ 0.42. Mẫu
                  sai: w × exp(0.42) ≈ 1.52w. Sau normalize: mẫu sai tăng
                  tỉ trọng ~2.3x.
                </p>
              </CollapsibleDetail>

              {/* ── COLLAPSIBLE: GRADIENT BOOSTING LOSS ── */}
              <CollapsibleDetail title="Chi tiết — Gradient Boosting: loss function và pseudo-residual">
                <p className="text-sm text-muted leading-relaxed">
                  Gradient Boosting (Friedman 2001) tổng quát hoá AdaBoost
                  cho bất kỳ loss differentiable. Mỗi round fit trên{" "}
                  <strong className="text-foreground">pseudo-residual</strong>{" "}
                  — đạo hàm âm của loss theo prediction.
                </p>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  Objective tổng: F* = argmin_F Σ L(y_i, F(x_i)). Khởi tạo
                  F_0 = argmin_c Σ L(y_i, c) (MSE → mean(y); log-loss →
                  log-odds).
                </p>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  Mỗi round m:
                </p>
                <ol className="mt-1 list-decimal list-inside space-y-1 text-sm text-muted">
                  <li>Tính pseudo-residual (negative gradient):</li>
                </ol>
                <LaTeX block>
                  {"r_{i,m} = -\\left[\\partial L / \\partial F \\right]_{F=F_{m-1}}"}
                </LaTeX>
                <p className="text-sm text-muted leading-relaxed">
                  Ví dụ MSE L = ½(y−F)² → r = y − F_{`{m-1}`} (residual thực).
                  Log-loss → r = y − σ(F_{`{m-1}`}) (y − probability).
                </p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted" start={2}>
                  <li>Fit tree h_m regress r_{`{i,m}`}.</li>
                  <li>Line search γ_m = argmin Σ L(y_i, F_{`{m-1}`}+γ·h_m).</li>
                  <li>Update F_m = F_{`{m-1}`} + η · γ_m · h_m (η = learning rate).</li>
                </ol>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  η nhỏ (0.01-0.1) + nhiều cây → generalize tốt hơn.
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  XGBoost mở rộng: second-order gradient (Hessian).
                </p>
                <p className="text-sm text-muted leading-relaxed">
                  Taylor bậc 2: L ≈ L(F_{`{m-1}`}) + g·h_m + ½·H·h_m². Split
                  score:
                </p>
                <LaTeX block>
                  {"\\text{Gain} = \\tfrac{1}{2}\\!\\left[\\tfrac{G_L^2}{H_L+\\lambda} + \\tfrac{G_R^2}{H_R+\\lambda} - \\tfrac{(G_L+G_R)^2}{H_L+H_R+\\lambda}\\right] - \\gamma"}
                </LaTeX>
                <p className="text-sm text-muted leading-relaxed">
                  G = sum(g), H = sum(H), λ = L2 reg, γ = min loss
                  reduction. Gradient + Hessian + built-in regularization
                  là lý do XGBoost nhanh + chính xác hơn GB classic.
                </p>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  <strong>Quantile loss:</strong> L_α(y, F) = max(α(y−F),
                  (α−1)(y−F)), α ∈ (0, 1). LightGBM/XGBoost hỗ trợ native
                  để dự đoán khoảng tin cậy.
                </p>
              </CollapsibleDetail>

              {/* ── EXTRA CALLOUT ── */}
              <Callout variant="insight" title="Mẹo Kaggle Top 10 — seed averaging">
                Train 1 model với 5-10 seeds, average prediction. Gain
                0.1-0.5% miễn phí do giảm variance initialization. Kết
                hợp K-fold CV (5 folds × 5 seeds = 25 models) = mega
                ensemble của dân Kaggle.
              </Callout>

              <Callout variant="warning" title="Pitfall — target leakage khi stack">
                Nếu base model thấy target trong FE (vd target encoding
                không CV), stacking amplifies leak. Mọi transform phụ
                thuộc y phải fit trong CV fold, không fit trên toàn train.
              </Callout>

              {/* ── BIAS-VARIANCE QUANTITATIVE ── */}
              <div className="mt-6 rounded-xl border border-border bg-card p-4 text-sm leading-relaxed text-foreground/90">
                <p className="mb-2 font-semibold text-foreground">
                  Quantitative: bagging trên variance
                </p>
                <p className="text-muted">
                  B model độc lập, variance σ² → Var(avg) = σ²/B. Thực tế
                  models KHÔNG độc lập (cùng dataset → ρ &gt; 0):
                </p>
                <LaTeX block>
                  {"\\mathrm{Var}(\\bar{f}) = \\rho \\sigma^2 + \\frac{1 - \\rho}{B} \\sigma^2"}
                </LaTeX>
                <p className="text-muted">
                  B → ∞: Var → ρσ². Random Forest bơm randomness (random
                  features mỗi split) để giảm ρ → variance sàn thấp hơn.
                </p>
              </div>

              {/* ── FINAL CALLOUT ── */}
              <Callout variant="tip" title="Checklist ensemble trước production">
                <ul className="list-disc list-inside space-y-1">
                  <li>Đã có baseline (LogReg / single tree) để so sánh?</li>
                  <li>CV scheme phù hợp (Stratified / TimeSeriesSplit)?</li>
                  <li>Tuning trên val, không phải test?</li>
                  <li>Feature pipeline reproducible (sklearn.Pipeline)?</li>
                  <li>Inference latency &lt; SLA? Model size fit memory?</li>
                  <li>Monitoring + drift detection sẵn sàng?</li>
                </ul>
              </Callout>
            </ExplanationSection>
          </LessonSection>

          {/* ─────────── STEP 6 ── SUMMARY ─────────── */}
          <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
            <MiniSummary
              points={[
                "Ensemble kết hợp nhiều model yếu → model mạnh. 'Đồng tay vỗ nên kêu.'",
                "Bagging (Random Forest): giảm variance. Boosting (XGBoost, LightGBM): giảm bias. Stacking: kết hợp cả hai.",
                "Hiệu quả khi models DIVERSE — sai ở những chỗ khác nhau → triệt tiêu lỗi.",
                "XGBoost/LightGBM vẫn thắng deep learning cho tabular data (80%+ Kaggle competitions).",
                "Key: diversity > individual accuracy. 3 models 80% diverse > 3 models 90% giống nhau.",
                "Đừng lạm dụng stacking — LightGBM tuned tốt + feature engineering kỹ đã đi được 90% đường.",
              ]}
            />

            <div className="mt-4">
              <StepReveal
                labels={[
                  "Baseline",
                  "RandomForest",
                  "Boosting",
                  "Ensemble cuối",
                ]}
              >
                <div className="rounded-lg border border-border bg-surface p-3 text-xs text-muted">
                  <strong className="text-foreground">
                    Bước 1 — Baseline:
                  </strong>{" "}
                  LogReg đơn giản + feature cơ bản. Đo AUC/F1 trên val. Đây
                  là &ldquo;ceiling&rdquo; để tất cả mọi ensemble phải vượt
                  qua.
                </div>
                <div className="rounded-lg border border-border bg-surface p-3 text-xs text-muted">
                  <strong className="text-foreground">
                    Bước 2 — RandomForest:
                  </strong>{" "}
                  mặc định n_estimators=300, n_jobs=-1. Thường vượt baseline
                  rõ, cho feature importance miễn phí.
                </div>
                <div className="rounded-lg border border-border bg-surface p-3 text-xs text-muted">
                  <strong className="text-foreground">
                    Bước 3 — Boosting:
                  </strong>{" "}
                  LightGBM hoặc XGBoost tuned: learning_rate 0.05, depth
                  4-6, early stopping 50. Tune bằng Optuna/GridSearchCV.
                </div>
                <div className="rounded-lg border border-border bg-surface p-3 text-xs text-muted">
                  <strong className="text-foreground">
                    Bước 4 — Ensemble cuối:
                  </strong>{" "}
                  weighted average hoặc stacking của LGBM + XGB + CatBoost.
                  Gain 1-3% thường là mảnh ghép cuối.
                </div>
              </StepReveal>
            </div>
          </LessonSection>

          {/* ─────────── STEP 7 ── QUIZ ─────────── */}
          <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
            <p className="mb-3 text-sm text-muted leading-relaxed">
              8 câu hỏi bao phủ Bagging / Boosting / Stacking cùng tuning và
              thực chiến. Trả lời để xem tổng kết.
            </p>
            <QuizSection questions={QUIZ_QUESTIONS} />

            <div className="mt-6 rounded-xl border border-border bg-surface/60 p-4 text-xs text-muted leading-relaxed">
              <p className="mb-1 font-semibold text-foreground">
                Đào sâu hơn
              </p>
              <p>
                Xem chi tiết từng họ tại{" "}
                <TopicLink slug="random-forests">Random Forest</TopicLink>{" "}
                và{" "}
                <TopicLink slug="gradient-boosting">
                  Gradient Boosting
                </TopicLink>
                . Nếu chưa quen với cây đơn, ghé{" "}
                <TopicLink slug="decision-trees">Decision Trees</TopicLink>{" "}
                trước.
              </p>
            </div>
          </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
