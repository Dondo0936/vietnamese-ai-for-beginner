"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PredictionGate, AhaMoment, InlineChallenge,
  Callout, MiniSummary, CodeBlock,
  LessonSection, TopicLink,} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "confusion-matrix",
  title: "Confusion Matrix",
  titleVi: "Ma trận nhầm lẫn",
  description: "Bảng đánh giá hiệu suất phân loại thể hiện True/False Positive/Negative",
  category: "classic-ml",
  tags: ["evaluation", "classification", "metrics"],
  difficulty: "beginner",
  relatedSlugs: ["logistic-regression", "cross-validation", "naive-bayes"],
  vizType: "interactive",
};

/* ── Patient data for classification game ── */
interface Patient {
  id: number;
  name: string;
  symptoms: string[];
  hasDisease: boolean;
}

const PATIENTS: Patient[] = [
  { id: 1, name: "Bệnh nhân A", symptoms: ["sốt cao", "ho kéo dài", "khó thở"], hasDisease: true },
  { id: 2, name: "Bệnh nhân B", symptoms: ["bình thường", "không triệu chứng"], hasDisease: false },
  { id: 3, name: "Bệnh nhân C", symptoms: ["sốt nhẹ", "mệt mỏi"], hasDisease: true },
  { id: 4, name: "Bệnh nhân D", symptoms: ["ho nhẹ", "sổ mũi"], hasDisease: false },
  { id: 5, name: "Bệnh nhân E", symptoms: ["sốt cao", "đau ngực", "ho ra máu"], hasDisease: true },
  { id: 6, name: "Bệnh nhân F", symptoms: ["bình thường", "hơi mệt"], hasDisease: false },
  { id: 7, name: "Bệnh nhân G", symptoms: ["sốt cao", "ho", "đau đầu"], hasDisease: true },
  { id: 8, name: "Bệnh nhân H", symptoms: ["sổ mũi", "hắt hơi"], hasDisease: false },
  { id: 9, name: "Bệnh nhân I", symptoms: ["ho kéo dài", "sụt cân"], hasDisease: true },
  { id: 10, name: "Bệnh nhân K", symptoms: ["bình thường", "ho nhẹ"], hasDisease: false },
];

/* ── Synthetic data for threshold slider ── */
const SYNTHETIC_DATA = Array.from({ length: 50 }, (_, i) => {
  const isPositive = i < 20;
  const score = isPositive
    ? 0.45 + Math.sin(i * 0.7) * 0.25 + 0.2
    : 0.15 + Math.sin(i * 0.5) * 0.2 + 0.1;
  return { score: Math.max(0.01, Math.min(0.99, score)), actual: isPositive };
});

function computeMatrix(threshold: number) {
  let tp = 0, fp = 0, fn = 0, tn = 0;
  for (const d of SYNTHETIC_DATA) {
    const predicted = d.score >= threshold;
    if (predicted && d.actual) tp++;
    else if (predicted && !d.actual) fp++;
    else if (!predicted && d.actual) fn++;
    else tn++;
  }
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const accuracy = (tp + tn) / (tp + tn + fp + fn);
  const f1 = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
  return { tp, fp, fn, tn, precision, recall, accuracy, f1 };
}

/* ── Symptom tag colors ── */
function symptomColor(s: string): string {
  if (s.includes("sốt cao") || s.includes("đau ngực") || s.includes("ho ra máu")) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  if (s.includes("sốt") || s.includes("ho kéo") || s.includes("sụt cân") || s.includes("mệt mỏi")) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  if (s.includes("bình thường") || s.includes("không triệu")) return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
  return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
}

/* ── Reusable matrix cell ── */
const CELL_META = [
  { label: "TP", color: "#22c55e" },
  { label: "FP", color: "#f97316" },
  { label: "FN", color: "#ef4444" },
  { label: "TN", color: "#3b82f6" },
] as const;

function MatrixCell({ idx, value, revealed }: { idx: number; value: number; revealed: boolean }) {
  const { label, color } = CELL_META[idx];
  if (!revealed) return <div className="rounded-lg border-2 border-dashed border-border px-6 py-4 min-w-[90px] text-muted text-xs">?</div>;
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className="rounded-lg border-2 px-6 py-4 min-w-[90px]"
      style={{ borderColor: color, backgroundColor: `${color}15` }}
    >
      <motion.div key={value} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="text-2xl font-bold" style={{ color }}>{value}</motion.div>
      <div className="text-[10px] font-medium" style={{ color }}>{label}</div>
    </motion.div>
  );
}

function MetricsRow({ m, decimals = 0 }: { m: { accuracy: number; precision: number; recall: number; f1: number }; decimals?: number }) {
  const items = [
    { label: "Accuracy", value: m.accuracy, color: "text-foreground" },
    { label: "Precision", value: m.precision, color: "text-green-500" },
    { label: "Recall", value: m.recall, color: "text-blue-500" },
    { label: "F1 Score", value: m.f1, color: "text-purple-500" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map(({ label, value, color }) => (
        <div key={label} className="rounded-lg border border-border bg-surface p-3 text-center">
          <div className={`text-lg font-bold ${color}`}>{(value * 100).toFixed(decimals)}%</div>
          <div className="text-xs text-muted">{label}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Shared matrix table header ── */
function MatrixHeader({ posLabel, negLabel }: { posLabel: string; negLabel: string }) {
  return (
    <thead>
      <tr>
        <th className="p-2" /><th className="p-2" />
        <th colSpan={2} className="px-4 pb-2 font-semibold text-foreground">Thực tế</th>
      </tr>
      <tr>
        <th className="p-2" /><th className="p-2" />
        <th className="px-4 pb-2 text-xs font-medium" style={{ color: "#22c55e" }}>{posLabel}</th>
        <th className="px-4 pb-2 text-xs font-medium" style={{ color: "#ef4444" }}>{negLabel}</th>
      </tr>
    </thead>
  );
}

/* ═══════════════ MAIN ═══════════════ */
export default function ConfusionMatrixTopic() {
  /* Classification game state */
  const [predictions, setPredictions] = useState<Record<number, boolean>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [gamePhase, setGamePhase] = useState<"playing" | "building" | "done">("playing");
  const [revealStep, setRevealStep] = useState(0);

  /* Threshold slider state */
  const [threshold, setThreshold] = useState(0.5);

  const gameFinished = Object.keys(predictions).length === PATIENTS.length;

  /* Compute user's confusion matrix */
  const userMatrix = useMemo(() => {
    if (!gameFinished) return { tp: 0, fp: 0, fn: 0, tn: 0, precision: 0, recall: 0, accuracy: 0, f1: 0 };
    let tp = 0, fp = 0, fn = 0, tn = 0;
    for (const p of PATIENTS) {
      const pred = predictions[p.id];
      if (pred && p.hasDisease) tp++;
      else if (pred && !p.hasDisease) fp++;
      else if (!pred && p.hasDisease) fn++;
      else tn++;
    }
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const accuracy = (tp + tn) / PATIENTS.length;
    const f1 = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
    return { tp, fp, fn, tn, precision, recall, accuracy, f1 };
  }, [predictions, gameFinished]);

  /* Threshold-based matrix */
  const thresholdMatrix = useMemo(() => computeMatrix(threshold), [threshold]);

  const handleClassify = useCallback((hasDis: boolean) => {
    const patient = PATIENTS[currentIdx];
    setPredictions((prev) => ({ ...prev, [patient.id]: hasDis }));
    if (currentIdx < PATIENTS.length - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      setGamePhase("building");
    }
  }, [currentIdx]);

  const handleBuildNext = useCallback(() => {
    if (revealStep < 4) {
      setRevealStep((s) => s + 1);
    } else {
      setGamePhase("done");
    }
  }, [revealStep]);

  const handleResetGame = useCallback(() => {
    setPredictions({});
    setCurrentIdx(0);
    setGamePhase("playing");
    setRevealStep(0);
  }, []);

  const cellValues = [userMatrix.tp, userMatrix.fp, userMatrix.fn, userMatrix.tn];

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Mô hình spam filter có 95% accuracy nhưng chỉ 10% email là spam. Nếu mô hình luôn đoán 'Không spam', accuracy sẽ là bao nhiêu?",
      options: ["50%", "90%", "95%", "10%"],
      correct: 1,
      explanation: "Nếu 10% là spam mà mô hình luôn đoán 'Không spam', nó đúng 90% trường hợp! Đây là bẫy accuracy với dữ liệu mất cân bằng — cần xem Precision, Recall, F1.",
    },
    {
      question: "F1 Score là gì?",
      options: ["Trung bình cộng của Precision và Recall", "Trung bình điều hòa của Precision và Recall", "Tích của Precision và Recall", "Tỷ lệ dự đoán đúng trên tổng số"],
      correct: 1,
      explanation: "F1 = 2 × (P × R) / (P + R) — trung bình điều hòa, thiên về giá trị thấp hơn. Nếu Precision hoặc Recall rất thấp, F1 cũng thấp.",
    },
    {
      question: "Khi tăng ngưỡng quyết định (threshold) từ 0.3 lên 0.8, điều gì xảy ra?",
      options: ["Precision và Recall đều tăng", "Precision tăng, Recall giảm", "Precision giảm, Recall tăng", "Cả hai đều giảm"],
      correct: 1,
      explanation: "Ngưỡng cao hơn → mô hình 'khó tính' hơn → ít dự đoán dương → Precision tăng (ít FP) nhưng Recall giảm (nhiều FN hơn).",
    },
    {
      type: "fill-blank",
      question: "Khi mô hình dự đoán DƯƠNG nhưng thực tế là ÂM, đó là trường hợp {blank}. Khi mô hình dự đoán ÂM nhưng thực tế là DƯƠNG, đó là {blank}.",
      blanks: [
        { answer: "False Positive", accept: ["FP", "false positive"] },
        { answer: "False Negative", accept: ["FN", "false negative"] },
      ],
      explanation: "False Positive (FP): báo nhầm — dự đoán dương nhưng thực tế âm. False Negative (FN): bỏ sót — dự đoán âm nhưng thực tế dương. Trong y tế, FN thường nguy hiểm hơn FP.",
    },
  ], []);

  const btnPrimary = "rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90";
  const btnSecondary = "rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground";

  return (
    <>
      {/* ── STEP 1: HOOK ── */}
      <PredictionGate
        question="Bạn là bác sĩ. Xét nghiệm cho kết quả dương tính với bệnh X. Nhưng xét nghiệm này đúng 90% thời gian. Bạn có chắc bệnh nhân thực sự mắc bệnh không?"
        options={[
          "Có, 90% chính xác mà",
          "Không chắc, cần biết thêm",
          "Chắc chắn không",
        ]}
        correct={1}
        explanation="90% chính xác nghe cao, nhưng LOẠI SAI nào mới quan trọng. Đó là lý do cần confusion matrix!"
      >
        <p className="mb-4 text-sm text-muted leading-relaxed">
          90% nghe cao nhưng <strong className="text-foreground">LOẠI</strong> sai mới quan trọng. Hãy tự mình trải nghiệm — bạn sẽ đóng vai bác sĩ, phân loại 10 bệnh nhân, và xây confusion matrix từ quyết định của mình.
        </p>

        {/* ── STEP 2: DISCOVER — User IS the Classifier ── */}
        <VisualizationSection>
          <div className="space-y-4">
            {gamePhase === "playing" && (
              <>
                <p className="text-sm text-muted">
                  Bạn là bác sĩ! Khám <strong className="text-foreground">{PATIENTS.length} bệnh nhân</strong> và chẩn đoán từng người.
                  Bệnh nhân <strong className="text-foreground">{currentIdx + 1}/{PATIENTS.length}</strong>:
                </p>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIdx}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-xl border border-border bg-surface p-5 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-lg">
                        {PATIENTS[currentIdx].hasDisease ? "🤒" : "😊"}
                      </div>
                      <span className="font-semibold text-foreground">{PATIENTS[currentIdx].name}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {PATIENTS[currentIdx].symptoms.map((s) => (
                        <span key={s} className={`rounded-full px-3 py-1 text-xs font-medium ${symptomColor(s)}`}>
                          {s}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-3 pt-1">
                      <button onClick={() => handleClassify(true)} className={btnPrimary}>
                        Bệnh
                      </button>
                      <button onClick={() => handleClassify(false)} className={btnSecondary}>
                        Không bệnh
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Progress bar */}
                <div className="flex gap-1">
                  {PATIENTS.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        i < currentIdx ? "bg-accent" : i === currentIdx ? "bg-accent/50" : "bg-surface-hover"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Building the matrix cell by cell */}
            {(gamePhase === "building" || gamePhase === "done") && (
              <div className="space-y-4">
                <p className="text-sm text-muted">
                  {gamePhase === "building"
                    ? "Kết quả chẩn đoán! Hãy nhấn để xây dựng bảng từng ô một..."
                    : "Ma trận nhầm lẫn của bạn hoàn chỉnh!"}
                </p>

                {/* The 2x2 matrix */}
                <div className="overflow-x-auto">
                  <table className="mx-auto border-collapse text-center text-sm">
                    <MatrixHeader posLabel="Bệnh" negLabel="Không bệnh" />
                    <tbody>
                      <tr>
                        <th rowSpan={2} className="pr-2 text-xs font-semibold text-foreground" style={{ writingMode: "vertical-lr", transform: "rotate(180deg)" }}>Dự đoán</th>
                        <th className="px-2 py-1 text-xs font-medium text-blue-500">Bệnh</th>
                        <td className="p-1"><MatrixCell idx={0} value={cellValues[0]} revealed={revealStep >= 1} /></td>
                        <td className="p-1"><MatrixCell idx={1} value={cellValues[1]} revealed={revealStep >= 2} /></td>
                      </tr>
                      <tr>
                        <th className="px-2 py-1 text-xs font-medium text-orange-500">Không bệnh</th>
                        <td className="p-1"><MatrixCell idx={2} value={cellValues[2]} revealed={revealStep >= 3} /></td>
                        <td className="p-1"><MatrixCell idx={3} value={cellValues[3]} revealed={revealStep >= 4} /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Metrics — appear after all cells revealed */}
                <AnimatePresence>
                  {gamePhase === "done" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
                      <MetricsRow m={userMatrix} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Controls */}
                <div className="flex flex-wrap gap-3">
                  {gamePhase === "building" && (
                    <button onClick={handleBuildNext} className={btnPrimary}>
                      Hiện ô tiếp theo ({revealStep}/4)
                    </button>
                  )}
                  <button onClick={handleResetGame} className={btnSecondary}>
                    Chơi lại
                  </button>
                </div>
              </div>
            )}
          </div>
        </VisualizationSection>

        {/* ── STEP 3: REVEAL ── */}
        <AhaMoment>
          <p>
            Bảng 2x2 bạn vừa xây chính là <strong>Confusion Matrix</strong> — công cụ đánh giá mọi mô hình phân loại!
          </p>
        </AhaMoment>

        {/* ── STEP 4: DEEPEN — Threshold Slider ── */}
        <VisualizationSection>
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Kéo ngưỡng (threshold) để thấy sự đánh đổi giữa Precision và Recall. Dữ liệu mô phỏng 50 mẫu.
            </p>

            {/* Interactive threshold matrix */}
            <div className="overflow-x-auto">
              <table className="mx-auto border-collapse text-center text-sm">
                <MatrixHeader posLabel="Dương" negLabel="Âm" />
                <tbody>
                  <tr>
                    <th rowSpan={2} className="pr-2 text-xs font-semibold text-foreground" style={{ writingMode: "vertical-lr", transform: "rotate(180deg)" }}>Dự đoán</th>
                    <th className="px-2 py-1 text-xs font-medium text-blue-500">Dương</th>
                    <td className="p-1"><MatrixCell idx={0} value={thresholdMatrix.tp} revealed /></td>
                    <td className="p-1"><MatrixCell idx={1} value={thresholdMatrix.fp} revealed /></td>
                  </tr>
                  <tr>
                    <th className="px-2 py-1 text-xs font-medium text-orange-500">Âm</th>
                    <td className="p-1"><MatrixCell idx={2} value={thresholdMatrix.fn} revealed /></td>
                    <td className="p-1"><MatrixCell idx={3} value={thresholdMatrix.tn} revealed /></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Metrics row */}
            <MetricsRow m={thresholdMatrix} decimals={1} />

            {/* Threshold slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Ngưỡng quyết định (threshold)</label>
                <span className="font-mono text-sm font-bold text-accent">{threshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0.05}
                max={0.95}
                step={0.01}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-accent"
                style={{
                  background: `linear-gradient(to right, var(--color-accent) ${((threshold - 0.05) / 0.9) * 100}%, var(--bg-surface-hover, #E2E8F0) ${((threshold - 0.05) / 0.9) * 100}%)`,
                }}
              />
              <div className="flex justify-between text-xs text-muted">
                <span>0.05</span>
                <span>0.95</span>
              </div>
            </div>

            {/* Tradeoff insight */}
            <div className="rounded-lg border border-accent/30 bg-accent-light p-3 text-sm text-foreground">
              <strong>Quy luật:</strong> Threshold &#8593; &#8594; Precision &#8593; nhưng Recall &#8595;.
              Ngưỡng thấp bắt nhiều bệnh nhân hơn (ít bỏ sót) nhưng cũng báo nhầm nhiều hơn.
            </div>
          </div>
        </VisualizationSection>

        {/* ── STEP 5: CHALLENGE ── */}
        <InlineChallenge
          question="Trong hệ thống phát hiện ung thư, metric nào quan trọng nhất?"
          options={["Accuracy", "Precision", "Recall", "F1"]}
          correct={2}
          explanation="Bỏ sót bệnh nhân ung thư (FN) nguy hiểm hơn báo nhầm (FP). Recall đo tỷ lệ phát hiện đúng trong số tất cả ca thực sự dương tính!"
        />

        {/* ── STEP 6: EXPLAIN ── */}
        <ExplanationSection>
          <p>
            <strong>Ma trận nhầm lẫn (Confusion Matrix)</strong> là bảng 2&times;2 tóm tắt hiệu suất mô hình phân loại nhị phân, thường dùng cùng với{" "}<TopicLink slug="logistic-regression">hồi quy logistic</TopicLink>{" "}và các mô hình phân loại khác.
            Từ 4 ô TP, TN, FP, FN, ta tính được các chỉ số quan trọng:
          </p>
          <div className="rounded-lg bg-surface p-4 space-y-2 font-mono text-sm">
            <p><strong>Precision</strong> = TP / (TP + FP) — Trong số dự đoán dương, bao nhiêu đúng?</p>
            <p><strong>Recall</strong> = TP / (TP + FN) — Trong số thực sự dương, ta tìm được bao nhiêu?</p>
            <p><strong>Accuracy</strong> = (TP + TN) / (TP + TN + FP + FN) — Tỷ lệ đúng tổng thể</p>
            <p><strong>F1 Score</strong> = 2 &times; (P &times; R) / (P + R) — Trung bình điều hòa</p>
          </div>
          <CodeBlock language="python" title="Confusion Matrix với scikit-learn">
{`from sklearn.metrics import (confusion_matrix,
    precision_score, recall_score, f1_score,
    classification_report)

y_true = [1, 0, 1, 1, 0, 1, 0, 0, 1, 0]
y_pred = [1, 0, 0, 1, 0, 1, 1, 0, 1, 0]

cm = confusion_matrix(y_true, y_pred)
print("Confusion Matrix:")
print(cm)
# [[3, 1],   # TN=3, FP=1
#  [1, 4]]   # FN=1, TP=4

print(f"Precision: {precision_score(y_true, y_pred):.2f}")
print(f"Recall:    {recall_score(y_true, y_pred):.2f}")
print(f"F1 Score:  {f1_score(y_true, y_pred):.2f}")
print(classification_report(y_true, y_pred))`}
          </CodeBlock>
          <Callout variant="tip" title="Khi nào ưu tiên Precision vs Recall?">
            <strong>Ưu tiên Recall</strong> khi bỏ sót (FN) nguy hiểm: phát hiện ung thư, phát hiện gian lận, cảnh báo cháy rừng.
            <br />
            <strong>Ưu tiên Precision</strong> khi báo nhầm (FP) tốn kém: lọc spam email (xóa nhầm email quan trọng), đề xuất sản phẩm.
          </Callout>
          <Callout variant="warning" title="Bẫy Accuracy">
            Với dữ liệu mất cân bằng (99% âm, 1% dương), mô hình luôn đoán &quot;âm&quot; có 99% accuracy nhưng Recall = 0%.
            Luôn kiểm tra Precision, Recall và F1 cùng Accuracy! Để ước lượng ổn định hơn, kết hợp với{" "}<TopicLink slug="cross-validation">cross-validation</TopicLink>.
          </Callout>
          <p className="text-sm text-muted">
            Khi mô hình có dấu hiệu <TopicLink slug="bias-variance">bias-variance</TopicLink>{" "}
            không cân bằng, confusion matrix giúp xác định loại lỗi cụ thể (FP hay FN) để chọn hướng cải thiện phù hợp.
          </p>
        </ExplanationSection>

        {/* ── STEP 7: SUMMARY ── */}
        <MiniSummary points={[
          "Confusion Matrix là bảng 2x2 với 4 ô: TP, FP, FN, TN — cho thấy mô hình sai ở đâu.",
          "Precision đo độ chính xác dự đoán dương, Recall đo tỷ lệ phát hiện đúng ca dương thực sự.",
          "Threshold thay đổi sự đánh đổi: ngưỡng cao → Precision cao nhưng Recall thấp, và ngược lại.",
          "Chọn metric phù hợp bài toán: y tế ưu tiên Recall, lọc spam ưu tiên Precision.",
        ]} />

        {/* ── STEP 8: QUIZ ── */}
        <QuizSection questions={quizQuestions} />
      </PredictionGate>
    </>
  );
}
