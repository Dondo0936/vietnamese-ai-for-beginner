"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  PencilLine,
  GraduationCap,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
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
  slug: "train-val-test",
  title: "Train / Validation / Test Split",
  titleVi: "Tập train, val, test — Bài tập, thi thử, thi thật",
  description:
    "Train = bài tập. Val = đề thi thử. Test = đề thi thật. Không được xem test trước — nếu không, điểm không có ý nghĩa.",
  category: "foundations",
  tags: ["train", "validation", "test", "split"],
  difficulty: "beginner",
  relatedSlugs: ["cross-validation", "overfitting-underfitting", "bias-variance"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;
const DATASET_SIZE = 1000;

/* ---- Colors ---- */
const COLOR_TRAIN = "#3b82f6";
const COLOR_VAL = "#f59e0b";
const COLOR_TEST = "#22c55e";
const COLOR_LEAK = "#ef4444";

/* ════════════════════════════════════════════════════════════════════════
   DATA HELPERS
   ════════════════════════════════════════════════════════════════════════ */

interface Split {
  train: number;
  val: number;
  test: number;
}

function computeCounts(split: Split): Split {
  const train = Math.round((split.train / 100) * DATASET_SIZE);
  const val = Math.round((split.val / 100) * DATASET_SIZE);
  const test = DATASET_SIZE - train - val;
  return { train, val, test };
}

interface AccuracyPoint {
  epoch: number;
  train: number;
  val: number;
  test: number;
}

function buildCurve(
  epochs: number,
  trainPct: number,
  valPct: number,
  peeked: boolean,
): AccuracyPoint[] {
  const points: AccuracyPoint[] = [];
  const dataFactor = Math.min(1, trainPct / 70);
  const valStrength = Math.min(1, valPct / 15);
  for (let e = 1; e <= epochs; e++) {
    const t = e / epochs;
    const trainAcc = 0.55 + 0.44 * (1 - Math.exp(-3.2 * t * dataFactor));
    const peakVal = 0.52 + 0.3 * valStrength * dataFactor;
    const overfitPenalty = Math.max(0, t - 0.55) * (1 - valStrength) * 0.12;
    const valAcc = peakVal + (0.9 - peakVal) * (1 - Math.exp(-4.2 * t)) - overfitPenalty;
    const baseTest = valAcc - 0.015;
    const testAcc = peeked
      ? Math.min(0.99, baseTest + 0.12 + 0.08 * t) // inflated when peeking
      : Math.max(0.5, Math.min(0.95, baseTest));
    points.push({ epoch: e, train: trainAcc, val: valAcc, test: testAcc });
  }
  return points;
}

const PRESETS: Array<{ label: string; split: Split; note: string }> = [
  { label: "60 / 20 / 20", split: { train: 60, val: 20, test: 20 }, note: "Dữ liệu ít — để val/test đủ lớn đánh giá đáng tin." },
  { label: "70 / 15 / 15", split: { train: 70, val: 15, test: 15 }, note: "Mặc định phổ biến cho dataset vừa (10k–100k)." },
  { label: "80 / 10 / 10", split: { train: 80, val: 10, test: 10 }, note: "Dataset lớn (&gt;1M): 10% đủ tin cậy cho val/test." },
];

/* ════════════════════════════════════════════════════════════════════════
   QUIZ
   ════════════════════════════════════════════════════════════════════════ */
const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Tại sao KHÔNG được dùng test set để chọn model hay tune hyperparameters?",
    options: [
      "Test set quá nhỏ",
      "Nếu dùng test set để quyết định → model được 'tối ưu' cho test set → không còn khách quan, đánh giá giả tạo",
      "Test set không có nhãn",
      "Test set đã bị chia đúng một lần",
    ],
    correct: 1,
    explanation:
      "Test set là 'đề thi cuối kỳ' — chỉ mở 1 lần để đánh giá. Nếu 'luyện đề thi', điểm cao nhưng không phản ánh năng lực thật. Validation set là 'đề thi thử' — dùng để tune, không phải để báo cáo.",
  },
  {
    question:
      "Model accuracy: Train=99%, Val=75%, Test=73%. Vấn đề gì?",
    options: [
      "Model tốt — 99% accuracy",
      "Overfitting: model học thuộc train (99%) nhưng không tổng quát hoá (75% val, 73% test). Gap 24% quá lớn.",
      "Test set quá khó",
      "Validation set chọn sai",
    ],
    correct: 1,
    explanation:
      "Train-val gap = 24% → overfitting nghiêm trọng. Val ≈ test (75 vs 73) cho thấy val đại diện tốt cho test. Giải pháp: regularization, thêm dữ liệu, giảm độ phức tạp, early stopping.",
  },
  {
    question:
      "Một đồng nghiệp train, nhìn kết quả test, sửa kiến trúc, lại train, nhìn test, lặp 20 lần. Chuyện gì đang xảy ra?",
    options: [
      "Đây là quy trình chuẩn — lặp lại đến khi tốt",
      "Test set đã bị 'đốt' — mỗi lần nhìn test rồi sửa là một dạng tuning trên test → test không còn khách quan",
      "Không vấn đề gì vì không dùng test để train trực tiếp",
      "Cần tăng kích thước test set",
    ],
    correct: 1,
    explanation:
      "Dù không train trực tiếp trên test, việc lặp 'nhìn test → sửa → nhìn test' là leakage gián tiếp. Kết quả: test accuracy cao hơn thực tế. Nguyên tắc vàng: tune bằng val, chỉ mở test 1 lần ở cuối cùng.",
  },
  {
    type: "fill-blank",
    question:
      "Bạn fit StandardScaler CHỈ trên tập {blank}, sau đó chỉ transform (không fit) trên val và test để tránh data leakage.",
    blanks: [
      { answer: "train", accept: ["training", "tập train", "tập huấn luyện"] },
    ],
    explanation:
      "Data leakage thường xảy ra khi preprocessing 'nhìn' được toàn bộ dữ liệu. Fit scaler TRÊN TOÀN BỘ data trước khi chia → scaler đã biết phân phối của test → kết quả evaluation không khách quan. Fit chỉ trên train → transform val/test bằng scaler đó.",
  },
];

/* ════════════════════════════════════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════════════════════════════════════ */
export default function TrainValTestTopic() {
  const [trainPct, setTrainPct] = useState(60);
  const [valPct, setValPct] = useState(20);
  const [peeked, setPeeked] = useState(false);

  const testPct = Math.max(5, 100 - trainPct - valPct);

  const split: Split = useMemo(
    () => ({ train: trainPct, val: valPct, test: testPct }),
    [trainPct, valPct, testPct],
  );

  const counts = useMemo(() => computeCounts(split), [split]);

  const curve = useMemo(
    () => buildCurve(40, trainPct, valPct, peeked),
    [trainPct, valPct, peeked],
  );

  const latest = curve[curve.length - 1];
  const trainValGap = Math.round((latest.train - latest.val) * 100);

  const applyPreset = useCallback((preset: Split) => {
    setTrainPct(preset.train);
    setValPct(preset.val);
  }, []);

  const handleTrainChange = useCallback(
    (v: number) => {
      setTrainPct(v);
      if (v + valPct > 95) setValPct(Math.max(5, 95 - v));
    },
    [valPct],
  );

  const handleValChange = useCallback(
    (v: number) => {
      setValPct(v);
      if (trainPct + v > 95) setTrainPct(Math.max(50, 95 - v));
    },
    [trainPct],
  );

  /* 1000 tiny segments grouped into 3 zones */
  const segments = useMemo(() => {
    const cols = 50;
    const rows = 20;
    const arr: Array<{ x: number; y: number; group: "train" | "val" | "test" }> = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        let group: "train" | "val" | "test" = "train";
        if (idx >= counts.train && idx < counts.train + counts.val) group = "val";
        else if (idx >= counts.train + counts.val) group = "test";
        arr.push({ x: c, y: r, group });
      }
    }
    return arr;
  }, [counts]);

  /* Curve SVG helper */
  const CURVE_W = 480;
  const CURVE_H = 150;
  const curvePath = useCallback(
    (key: "train" | "val" | "test") => {
      return curve
        .map((p, i) => {
          const x = 30 + (i / Math.max(1, curve.length - 1)) * (CURVE_W - 50);
          const y = 14 + (1 - p[key]) * (CURVE_H - 30);
          return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
        })
        .join(" ");
    },
    [curve],
  );

  return (
    <>
      {/* ═══════════ STEP 1 — HOOK ═══════════ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Hook">
        <div className="rounded-2xl border border-border bg-card p-6 mb-5">
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <GraduationCap size={20} className="text-accent" />
            Ba vai trò, ba loại &ldquo;đề&rdquo;
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <RoleCard
              color={COLOR_TRAIN}
              icon={BookOpen}
              label="Train"
              metaphor="Bài tập về nhà"
              desc="Mô hình HỌC ở đây. Cập nhật tham số, lặp đi lặp lại tới khi hiểu quy luật."
            />
            <RoleCard
              color={COLOR_VAL}
              icon={PencilLine}
              label="Validation"
              metaphor="Đề thi thử"
              desc="Mô hình CHỈNH ở đây. Tune hyperparameter, chọn kiến trúc, quyết early stopping."
            />
            <RoleCard
              color={COLOR_TEST}
              icon={GraduationCap}
              label="Test"
              metaphor="Đề thi thật"
              desc="Mô hình ĐƯỢC ĐÁNH GIÁ ở đây. Mở đúng 1 LẦN ở cuối. Không được nhìn trước."
            />
          </div>
          <p className="text-sm text-foreground/85 leading-relaxed mt-4">
            Quy tắc quan trọng nhất:{" "}
            <strong className="text-red-500">
              không được nhìn test trước khi nộp
            </strong>
            . Một khi đã nhìn, dù chỉ một lần, điểm test không còn ý nghĩa — nó trở thành một
            phần của quá trình tuning, không phải một phép đo khách quan.
          </p>
        </div>

        <PredictionGate
          question="Bạn ôn thi đại học. Giáo viên cho 100 đề. Bạn làm cả 100, rồi dùng chính 100 đề đó để chấm điểm. Điểm 10/10. Vào thi thật, trượt. Vì sao?"
          options={[
            "Đề thi thật khó hơn đề ôn",
            "Bạn đã 'học thuộc' đáp án — điểm cao giả tạo. Cần giữ riêng vài đề CHƯA LÀM để đo năng lực thật.",
            "Bạn không ôn đủ",
            "Bạn mệt hôm thi",
          ]}
          correct={1}
          explanation="Giống ML: dùng TẤT CẢ data để train → model thuộc lòng train → accuracy cao trên train nhưng tệ trên data mới. Cần giữ riêng: validation set (đề thi thử — dùng nhiều lần để tune), và test set (đề thi thật — chỉ mở 1 lần)."
        />
      </LessonSection>

      {/* ═══════════ STEP 2 — REVEAL: Interactive split ═══════════ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Bên dưới là <strong>1.000 điểm dữ liệu</strong>. Kéo các thanh trượt để chia thành
          train / val / test. Xem đường cong accuracy thay đổi thế nào. Rồi thử bật{" "}
          <strong>&ldquo;Nhìn test trước&rdquo;</strong> &mdash; bạn sẽ thấy test accuracy
          &ldquo;đẹp&rdquo; lên một cách giả tạo.
        </p>

        <VisualizationSection topicSlug={metadata.slug}>
          <div className="space-y-5">
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 justify-center">
              <LegendDot color={COLOR_TRAIN} label={`Train (${counts.train} mẫu)`} />
              <LegendDot color={COLOR_VAL} label={`Val (${counts.val} mẫu)`} />
              <LegendDot color={COLOR_TEST} label={`Test (${counts.test} mẫu)`} />
            </div>

            {/* 1000 dots visualization */}
            <svg
              viewBox="0 0 600 90"
              className="mx-auto w-full max-w-2xl"
              role="img"
              aria-label="1000 điểm dữ liệu chia thành ba tập"
            >
              {segments.map((seg, i) => {
                const color =
                  seg.group === "train"
                    ? COLOR_TRAIN
                    : seg.group === "val"
                      ? COLOR_VAL
                      : COLOR_TEST;
                return (
                  <rect
                    key={i}
                    x={20 + seg.x * 11}
                    y={10 + seg.y * 3.2}
                    width={10}
                    height={2.6}
                    rx={0.6}
                    fill={color}
                    opacity={0.9}
                  />
                );
              })}
            </svg>

            {/* Proportion bar with draggable dividers via sliders */}
            <svg viewBox="0 0 600 60" className="mx-auto w-full max-w-2xl">
              <motion.rect
                x={20}
                y={15}
                width={(560 * trainPct) / 100}
                height={30}
                rx={6}
                fill={COLOR_TRAIN}
                animate={{ width: (560 * trainPct) / 100 }}
                transition={{ duration: 0.3 }}
              />
              <motion.rect
                y={15}
                height={30}
                fill={COLOR_VAL}
                animate={{
                  x: 20 + (560 * trainPct) / 100,
                  width: (560 * valPct) / 100,
                }}
                transition={{ duration: 0.3 }}
              />
              <motion.rect
                y={15}
                height={30}
                rx={6}
                fill={COLOR_TEST}
                animate={{
                  x: 20 + (560 * (trainPct + valPct)) / 100,
                  width: (560 * testPct) / 100,
                }}
                transition={{ duration: 0.3 }}
              />
              <text
                x={20 + (560 * trainPct) / 200}
                y={34}
                textAnchor="middle"
                fill="white"
                fontSize={11}
                fontWeight={700}
              >
                Train {trainPct}%
              </text>
              <text
                x={20 + (560 * (trainPct + valPct / 2)) / 100}
                y={34}
                textAnchor="middle"
                fill="white"
                fontSize={11}
                fontWeight={700}
              >
                Val {valPct}%
              </text>
              <text
                x={20 + (560 * (trainPct + valPct + testPct / 2)) / 100}
                y={34}
                textAnchor="middle"
                fill="white"
                fontSize={11}
                fontWeight={700}
              >
                Test {testPct}%
              </text>
            </svg>

            {/* Sliders */}
            <div className="grid gap-4 md:grid-cols-3">
              <SplitSlider
                label="Train"
                value={trainPct}
                min={40}
                max={85}
                onChange={handleTrainChange}
                color={COLOR_TRAIN}
              />
              <SplitSlider
                label="Validation"
                value={valPct}
                min={5}
                max={30}
                onChange={handleValChange}
                color={COLOR_VAL}
              />
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">Test (tự tính)</span>
                  <span className="font-mono font-semibold" style={{ color: COLOR_TEST }}>
                    {testPct}%
                  </span>
                </div>
                <div className="h-2 w-full rounded bg-surface">
                  <div
                    className="h-2 rounded"
                    style={{
                      width: `${Math.min(100, (testPct / 40) * 100)}%`,
                      backgroundColor: COLOR_TEST,
                    }}
                  />
                </div>
                <p className="text-[10px] text-muted">
                  Test tự động = 100 − Train − Val. Luôn giữ &ge; 5%.
                </p>
              </div>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2 justify-center">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p.split)}
                  title={p.note}
                  className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Leakage toggle */}
            <label className="flex cursor-pointer items-center justify-between rounded-lg border-2 border-dashed border-red-300 dark:border-red-700 bg-red-50/40 dark:bg-red-900/10 px-4 py-3">
              <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                {peeked ? (
                  <Eye size={14} className="text-red-500" />
                ) : (
                  <EyeOff size={14} className="text-muted" />
                )}
                Bật &ldquo;nhìn test trước&rdquo; (data leakage)
              </span>
              <input
                type="checkbox"
                checked={peeked}
                onChange={(e) => setPeeked(e.target.checked)}
                className="h-5 w-5 accent-red-500"
              />
            </label>

            {/* Accuracy curve */}
            <div className="rounded-lg border border-border bg-surface/40 p-4 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <LegendDot color={COLOR_TRAIN} label="Train acc" />
                <LegendDot color={COLOR_VAL} label="Val acc" />
                <LegendDot
                  color={peeked ? COLOR_LEAK : COLOR_TEST}
                  label={peeked ? "Test (bị peek — tăng giả!)" : "Test acc"}
                />
              </div>
              <svg
                viewBox={`0 0 ${CURVE_W} ${CURVE_H + 30}`}
                className="mx-auto w-full max-w-2xl rounded-md border border-border bg-background"
                role="img"
                aria-label="Đường cong accuracy theo epoch"
              >
                <line x1={30} y1={14} x2={30} y2={CURVE_H - 16} stroke="currentColor" className="text-muted" strokeWidth={1} />
                <line x1={30} y1={CURVE_H - 16} x2={CURVE_W - 20} y2={CURVE_H - 16} stroke="currentColor" className="text-muted" strokeWidth={1} />
                <text x={10} y={16} fontSize={9} fill="currentColor" className="text-muted">100%</text>
                <text x={14} y={CURVE_H - 14} fontSize={9} fill="currentColor" className="text-muted">50%</text>
                <text
                  x={CURVE_W / 2}
                  y={CURVE_H + 20}
                  fontSize={9}
                  fill="currentColor"
                  className="text-muted"
                  textAnchor="middle"
                >
                  Epoch →
                </text>

                <motion.path d={curvePath("train")} fill="none" stroke={COLOR_TRAIN} strokeWidth={2.2} />
                <motion.path d={curvePath("val")} fill="none" stroke={COLOR_VAL} strokeWidth={2.2} />
                <motion.path
                  d={curvePath("test")}
                  fill="none"
                  stroke={peeked ? COLOR_LEAK : COLOR_TEST}
                  strokeWidth={2.2}
                  strokeDasharray={peeked ? "6,3" : "none"}
                />
              </svg>
            </div>

            {/* Diagnosis */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 text-sm">
              <DiagBox color={COLOR_TRAIN} label="Train acc" value={latest.train} />
              <DiagBox color={COLOR_VAL} label="Val acc" value={latest.val} />
              <DiagBox
                color={peeked ? COLOR_LEAK : COLOR_TEST}
                label={peeked ? "Test acc (FAKE)" : "Test acc"}
                value={latest.test}
              />
              <DiagBox
                color={trainValGap > 15 ? "#ef4444" : "#64748b"}
                label="Gap train-val"
                value={trainValGap / 100}
                isPct
              />
            </div>

            <AnimatePresence>
              {peeked && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <Callout variant="warning" title="Phát hiện data leakage!">
                    Test accuracy tăng lên một cách giả tạo vì bạn đang &ldquo;nhìn&rdquo; vào
                    test set trong lúc tuning. Kết quả này không phản ánh hiệu năng thật. Hãy
                    tắt toggle và chỉ mở test set đúng một lần ở cuối.
                  </Callout>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ═══════════ STEP 3 — AHA ═══════════ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Ba tập, ba vai trò <strong>không thay thế nhau</strong>: train để học, val để
            chỉnh, test để đánh giá. Nếu bạn dùng test để chỉnh (dù chỉ 1 lần), test đã trở
            thành val &mdash; và bạn không còn một phép đo khách quan nào nữa.
          </p>
          <p className="mt-3">
            Train loss thấp = mô hình nhớ bài tập. Val loss thấp = mô hình hợp với đề thi thử.
            Test loss thấp (được đo đúng 1 lần) = <strong>mô hình thực sự tổng quát hoá</strong>.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ═══════════ STEP 4 — DEEPEN: Typical ML workflow ═══════════ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Quy trình chuẩn">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Bấm <strong>&ldquo;Tiếp tục&rdquo;</strong> để đi qua từng giai đoạn trong một
          workflow ML chuẩn. Chú ý: test set xuất hiện rất muộn &mdash; chỉ ở bước cuối cùng.
        </p>

        <StepReveal
          labels={[
            "1 — Thu thập dữ liệu",
            "2 — Chia 3 tập (SPLIT TRƯỚC!)",
            "3 — Huấn luyện mô hình",
            "4 — Tune trên val",
            "5 — Đánh giá test (1 lần)",
            "6 — Triển khai",
          ]}
        >
          {[
            <WorkflowStep
              key="w1"
              step="Thu thập dữ liệu"
              desc="Tổng hợp toàn bộ dữ liệu có được. Giả sử 10.000 mẫu."
              color={COLOR_TRAIN}
              visual={
                <div className="flex items-center justify-center h-16 rounded-lg bg-background border border-border">
                  <span className="text-2xl font-bold text-foreground">10.000 mẫu</span>
                </div>
              }
            />,
            <WorkflowStep
              key="w2"
              step="Chia 3 tập — LÀM NGAY TỪ ĐẦU"
              desc="Chia trước khi làm bất cứ preprocessing nào. Ví dụ 60/20/20 → 6.000 train + 2.000 val + 2.000 test. Test set bị 'khoá' ngay lập tức."
              color={COLOR_VAL}
              visual={
                <div className="flex h-12 rounded-lg overflow-hidden">
                  <div className="bg-blue-500 flex items-center justify-center text-white text-xs font-bold" style={{ width: "60%" }}>
                    6.000 Train
                  </div>
                  <div className="bg-amber-500 flex items-center justify-center text-white text-xs font-bold" style={{ width: "20%" }}>
                    2.000 Val
                  </div>
                  <div className="bg-green-500 flex items-center justify-center text-white text-xs font-bold" style={{ width: "20%" }}>
                    2.000 Test 🔒
                  </div>
                </div>
              }
            />,
            <WorkflowStep
              key="w3"
              step="Huấn luyện mô hình"
              desc="Mô hình LUYỆN trên train. Cập nhật tham số qua nhiều epoch. Chưa chạm tới val/test."
              color={COLOR_TRAIN}
              visual={
                <div className="flex items-center gap-3 rounded-lg bg-background border border-border p-3">
                  <BookOpen size={32} className="text-blue-500" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Train: 6.000 mẫu</p>
                    <p className="text-xs text-muted">Mô hình đang học pattern</p>
                  </div>
                </div>
              }
            />,
            <WorkflowStep
              key="w4"
              step="Tune trên val"
              desc="Thử các hyperparameter khác nhau: learning rate, số lớp, số epoch. Mỗi lần đo accuracy trên val. Giữ cấu hình cho val accuracy cao nhất."
              color={COLOR_VAL}
              visual={
                <div className="rounded-lg bg-background border border-border p-3 space-y-2">
                  <p className="text-xs font-semibold text-amber-500">Val accuracy khi thử:</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted">lr=0.001: 78%</span>
                    <span className="text-muted">lr=0.01: 82% ✓</span>
                    <span className="text-muted">lr=0.1: 74%</span>
                  </div>
                </div>
              }
            />,
            <WorkflowStep
              key="w5"
              step="Đánh giá test — ĐÚNG 1 LẦN"
              desc="Cấu hình đã chốt từ val. Giờ mới mở test set. Đo accuracy một lần duy nhất. Con số này là 'điểm thi thật'."
              color={COLOR_TEST}
              visual={
                <div className="rounded-lg bg-background border border-border p-3 flex items-center gap-3">
                  <GraduationCap size={32} className="text-green-500" />
                  <div>
                    <p className="text-sm font-bold text-foreground">Test accuracy: 80%</p>
                    <p className="text-xs text-muted">Báo cáo — không tune nữa</p>
                  </div>
                </div>
              }
            />,
            <WorkflowStep
              key="w6"
              step="Triển khai"
              desc="Nếu test accuracy chấp nhận được → đưa mô hình vào production. Nếu không → quay lại bước 3 với insight mới, nhưng LƯU Ý: mỗi lần nhìn test là 1 lần 'đốt' nó. Sau 5-10 lần, test không còn đáng tin."
              color="#8b5cf6"
              visual={
                <div className="rounded-lg bg-background border border-border p-3 flex items-center gap-3">
                  <CheckCircle2 size={24} className="text-purple-500" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Mô hình triển khai
                    </p>
                    <p className="text-xs text-muted">Monitor hiệu năng thực tế, cập nhật định kỳ</p>
                  </div>
                </div>
              }
            />,
          ]}
        </StepReveal>
      </LessonSection>

      {/* ═══════════ STEP 5 — CHALLENGE ═══════════ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Vì sao validation set (chứ không phải test set) được dùng để tune hyperparameters? Cả hai đều là 'data mô hình chưa thấy' cơ mà?"
          options={[
            "Không có lý do đặc biệt — dùng tập nào cũng được",
            "Khi tune, bạn chọn cấu hình cho điểm cao nhất → tập đó đã 'bị dùng' để quyết định → không còn khách quan. Test set phải được giữ nguyên vẹn tới cuối để đo khách quan.",
            "Validation set thường lớn hơn test set",
            "Validation set đã được shuffle sẵn",
          ]}
          correct={1}
          explanation="Đây là cốt lõi. Dù không train trực tiếp trên val, việc chọn cấu hình dựa trên val đã 'gắn' val vào mô hình. Sau 50 thử nghiệm, mô hình tuning hiện tại là kết quả của 50 lần tối ưu trên val → val không còn 'khách quan'. Test set phải tránh chuyện đó: chỉ mở khi mọi quyết định đã chốt."
        />

        <div className="mt-5">
          <InlineChallenge
            question="Dataset chuỗi thời gian (giá cổ phiếu theo ngày). Chia train/val/test thế nào?"
            options={[
              "Random shuffle rồi chia 70/15/15 như bình thường",
              "Chia theo thời gian: train = dữ liệu cũ nhất, val = giữa, test = mới nhất. KHÔNG shuffle.",
              "Không cần chia vì dữ liệu thời gian đặc biệt",
              "Dùng cross-validation luôn, bỏ qua test set",
            ]}
            correct={1}
            explanation="Time series KHÔNG được shuffle — sẽ gây leakage tương lai vào quá khứ (model 'biết trước' giá tương lai). Cách đúng: chia theo thứ tự thời gian. Ví dụ: train 2020-2022, val 2023, test 2024. Ở thực tế, đây là cách duy nhất mô phỏng đúng tình huống production (dự đoán tương lai từ quá khứ)."
          />
        </div>
      </LessonSection>

      {/* ═══════════ STEP 6 — EXPLAIN ═══════════ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích">
        <ExplanationSection>
          <p className="leading-relaxed">
            <strong>Train / Val / Test split</strong> chia dữ liệu thành ba tập riêng biệt để
            đảm bảo đánh giá mô hình <em>khách quan</em>. Đây là nền tảng phương pháp luận của
            mọi dự án ML.
          </p>

          <LaTeX block>
            {"\\text{Generalization Error} \\approx \\text{Test Error (đo đúng 1 lần)}"}
          </LaTeX>

          <p className="leading-relaxed mt-3">
            Trong đó <em>Generalization Error</em> là lỗi kỳ vọng trên dữ liệu chưa hề thấy.
            Chúng ta không đo được con số này trực tiếp (dữ liệu tương lai là vô hạn), nên dùng
            test error làm ước lượng tốt nhất &mdash; với điều kiện: test set phải được{" "}
            <strong>giữ nguyên vẹn</strong>.
          </p>

          <h4 className="text-sm font-semibold text-foreground mt-5 mb-2">
            Tỷ lệ chia theo kích thước dataset
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-semibold text-foreground">Kích thước dataset</th>
                  <th className="text-left py-2 pr-3 font-semibold text-foreground">Tỷ lệ đề xuất</th>
                  <th className="text-left py-2 font-semibold text-foreground">Lý do</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3">&lt; 1.000 mẫu</td>
                  <td className="py-2 pr-3">Nên dùng cross-validation</td>
                  <td className="py-2">Hold-out quá nhiễu</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3">1.000–10.000</td>
                  <td className="py-2 pr-3">60/20/20</td>
                  <td className="py-2">Cần val/test đủ lớn (≥ 200 mẫu)</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3">10.000–100.000</td>
                  <td className="py-2 pr-3">70/15/15</td>
                  <td className="py-2">Phổ biến, cân bằng</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3">100.000–1.000.000</td>
                  <td className="py-2 pr-3">80/10/10</td>
                  <td className="py-2">10% đã đủ tin cậy</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3">&gt; 1.000.000</td>
                  <td className="py-2 pr-3">90/5/5 hoặc 98/1/1</td>
                  <td className="py-2">Train thiếu dữ liệu mới là vấn đề chính</td>
                </tr>
              </tbody>
            </table>
          </div>

          <Callout variant="warning" title="Cạm bẫy — data leakage kinh điển">
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>
                Fit scaler / encoder trên <strong>toàn bộ</strong> dữ liệu trước khi split →
                preprocessing &ldquo;nhìn&rdquo; được phân phối của test.
              </li>
              <li>
                Oversample / SMOTE trước khi split → bản sao của train có thể xuất hiện trong
                val/test.
              </li>
              <li>
                Time series bị shuffle → tương lai lọt vào tập train.
              </li>
              <li>
                Cùng một &ldquo;subject&rdquo; (bệnh nhân, user) có mẫu ở cả 2 tập → mô hình
                &ldquo;nhớ mặt&rdquo; chứ không học đặc điểm.
              </li>
            </ul>
          </Callout>

          <Callout variant="tip" title="Khi nào dùng cross-validation thay vì hold-out?">
            Với dataset nhỏ (&lt; 10k mẫu),{" "}
            <TopicLink slug="cross-validation">K-fold cross-validation</TopicLink> cho ước
            lượng ổn định hơn vì mỗi mẫu được dùng cả để train và đánh giá. Với dataset lớn
            (triệu mẫu), hold-out 80/10/10 hoặc 90/5/5 đủ tin cậy và rẻ hơn.
          </Callout>

          <CollapsibleDetail title="Vì sao val set 'hết thiêng' sau vài chục thử nghiệm?">
            <p className="text-sm leading-relaxed">
              Mỗi khi bạn chọn hyperparameter dựa trên val accuracy, bạn đang &ldquo;nhét&rdquo;
              một chút thông tin về val set vào mô hình (qua quyết định của bạn). Sau vài chục
              lần thử, mô hình gián tiếp &ldquo;biết&rdquo; val set &mdash; val accuracy bắt
              đầu overfit tương tự train. Giải pháp:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm mt-2">
              <li>Giới hạn số thử nghiệm (Optuna với pruning, Bayesian optimization).</li>
              <li>
                Dùng <strong>nested cross-validation</strong>: vòng ngoài đánh giá, vòng trong
                tune.
              </li>
              <li>Dành riêng một bộ <em>holdout cuối</em> chưa hề dùng trong bất kỳ vòng thử nào.</li>
            </ul>
          </CollapsibleDetail>

          <CollapsibleDetail title="Bao nhiêu test mẫu là đủ để báo cáo đáng tin?">
            <p className="text-sm leading-relaxed">
              Quy tắc: với sai số mong muốn ±2% và độ tin cậy 95%, cần khoảng{" "}
              <strong>~1.000–2.500 mẫu test</strong>. Công thức xấp xỉ:{" "}
              <code>n &ge; 1.96² × p(1-p) / &epsilon;²</code>. Với p ≈ 0.9, &epsilon; = 0.02 →
              ~864 mẫu. Nếu dataset tổng &lt; 2.000 mẫu, hãy dùng cross-validation thay vì
              hold-out &mdash; con số &ldquo;accuracy 92%&rdquo; trên test 100 mẫu có khoảng
              tin cậy rộng tới ±5% điểm %.
            </p>
          </CollapsibleDetail>
        </ExplanationSection>
      </LessonSection>

      {/* ═══════════ STEP 7 — SUMMARY ═══════════ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="5 điều cần nhớ về train / val / test"
          points={[
            "Train = bài tập (học). Val = đề thi thử (tune). Test = đề thi thật (đánh giá, chỉ 1 lần).",
            "Không bao giờ dùng test để chọn hyperparameter — nếu làm, test không còn khách quan.",
            "SPLIT TRƯỚC khi làm preprocessing. Fit scaler/encoder CHỈ trên train. Transform val/test bằng scaler của train.",
            "Dataset chuỗi thời gian: chia theo thời gian (train = cũ, test = mới). Không shuffle.",
            "Dataset nhỏ (<10k): dùng cross-validation. Dataset lớn (>1M): hold-out 90/5/5 là đủ.",
          ]}
        />

        <Callout variant="tip" title="Xem ứng dụng thực tế">
          YouTube chia dữ liệu từ 2 tỷ người dùng thế nào? Tại sao họ dùng A/B test thực tế
          thay cho chỉ số offline? Xem{" "}
          <TopicLink slug="train-val-test-in-youtube">
            Tập train/val/test trong YouTube
          </TopicLink>
          .
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

function RoleCard({
  color,
  icon: Icon,
  label,
  metaphor,
  desc,
}: {
  color: string;
  icon: typeof BookOpen;
  label: string;
  metaphor: string;
  desc: string;
}) {
  return (
    <div
      className="rounded-xl border-2 p-4 space-y-2"
      style={{ borderColor: `${color}50`, backgroundColor: `${color}10` }}
    >
      <div className="flex items-center gap-2">
        <Icon size={16} style={{ color }} />
        <span className="text-sm font-bold" style={{ color }}>
          {label}
        </span>
      </div>
      <p className="text-base font-semibold text-foreground">{metaphor}</p>
      <p className="text-xs text-foreground/80 leading-relaxed">{desc}</p>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

function SplitSlider({
  label,
  value,
  min,
  max,
  onChange,
  color,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  color: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="font-mono font-semibold tabular-nums" style={{ color }}>
          {value}%
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full"
        style={{ accentColor: color }}
      />
      <div className="flex justify-between text-[10px] text-tertiary">
        <span>{min}%</span>
        <span>{max}%</span>
      </div>
    </div>
  );
}

function DiagBox({
  color,
  label,
  value,
  isPct,
}: {
  color: string;
  label: string;
  value: number;
  isPct?: boolean;
}) {
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2">
      <div className="text-xs text-muted">{label}</div>
      <div className="font-mono text-lg font-semibold tabular-nums" style={{ color }}>
        {isPct ? `${(value * 100).toFixed(0)}%` : `${(value * 100).toFixed(1)}%`}
      </div>
    </div>
  );
}

interface WorkflowStepProps {
  step: string;
  desc: string;
  color: string;
  visual: React.ReactNode;
}

function WorkflowStep({ step, desc, color, visual }: WorkflowStepProps) {
  return (
    <div
      className="rounded-xl border-2 p-4 space-y-3"
      style={{ borderColor: `${color}50`, backgroundColor: `${color}08` }}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle size={14} style={{ color }} className="shrink-0" />
        <h4 className="text-sm font-bold" style={{ color }}>
          {step}
        </h4>
      </div>
      {visual}
      <p className="text-xs text-foreground/85 leading-relaxed">{desc}</p>
    </div>
  );
}
