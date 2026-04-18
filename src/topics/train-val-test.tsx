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
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

// ---------------------------------------------------------------------------
// Metadata — DO NOT change shape, slugs hoặc nội dung. Các phần khác có thể
// được mở rộng để phục vụ bài giảng chi tiết hơn, nhưng metadata phải giữ
// nguyên để không phá vỡ routing và mục lục.
// ---------------------------------------------------------------------------
export const metadata: TopicMeta = {
  slug: "train-val-test",
  title: "Train / Validation / Test Split",
  titleVi: "Chia dữ liệu — Học, Kiểm tra, Thi thật",
  description:
    "Phương pháp chia dữ liệu thành ba tập riêng biệt để huấn luyện, điều chỉnh và đánh giá mô hình một cách khách quan.",
  category: "foundations",
  tags: ["train", "validation", "test", "split"],
  difficulty: "beginner",
  relatedSlugs: ["cross-validation", "overfitting-underfitting", "bias-variance"],
  vizType: "interactive",
};

const TOTAL_STEPS = 9;
const DATASET_SIZE = 1000;

// ---------------------------------------------------------------------------
// Kiểu dữ liệu cho mô phỏng chia tập — giữ tường minh để dễ mở rộng sau này.
// ---------------------------------------------------------------------------
interface SplitState {
  train: number;
  val: number;
  test: number;
}

interface TrainingPoint {
  epoch: number;
  trainAcc: number;
  valAcc: number;
  testAcc: number;
}

// ---------------------------------------------------------------------------
// Bảng màu theo quy ước của codebase:
//   - train  → xanh dương (học)
//   - val    → vàng (điều chỉnh)
//   - test   → xanh lá (đánh giá cuối cùng)
// ---------------------------------------------------------------------------
const COLOR_TRAIN = "#3b82f6";
const COLOR_VAL = "#f59e0b";
const COLOR_TEST = "#22c55e";
const COLOR_LEAK = "#ef4444";

// ---------------------------------------------------------------------------
// Hàm mô phỏng đường cong huấn luyện — toàn bộ là deterministic để người học
// có thể quan sát "cùng một tham số cho cùng một kết quả". Khi trainPct càng
// lớn thì validation càng gần train (ít overfit); khi quá nhỏ thì khoảng cách
// mở rộng thành overfitting. Khi bật leakage, test set "nhìn trộm" được nên
// test accuracy tăng giả tạo.
// ---------------------------------------------------------------------------
function buildTrainingCurve(
  epochs: number,
  trainPct: number,
  valPct: number,
  testPct: number,
  leakage: boolean,
): TrainingPoint[] {
  const points: TrainingPoint[] = [];
  const dataFactor = Math.min(1, trainPct / 70); // càng nhiều train càng mượt
  const valStrength = Math.min(1, valPct / 15);
  const testStrength = Math.min(1, testPct / 15);

  for (let e = 1; e <= epochs; e++) {
    const t = e / epochs;
    // train accuracy tiệm cận 99% theo đường cong mũ
    const trainAcc = 0.55 + 0.44 * (1 - Math.exp(-3.2 * t * dataFactor));

    // val accuracy bão hoà sớm hơn, sau đó hơi tụt (overfitting) nếu train quá nhiều
    const peakVal = 0.52 + 0.30 * valStrength * dataFactor;
    const overfitPenalty = Math.max(0, t - 0.55) * (1 - valStrength) * 0.12;
    const valAcc = peakVal + (0.90 - peakVal) * (1 - Math.exp(-4.2 * t)) - overfitPenalty;

    // test accuracy đi song song với val, trừ khi leakage → vọt lên bám sát train
    const baseTest = valAcc - 0.015 + 0.03 * testStrength;
    const testAcc = leakage
      ? Math.min(0.99, baseTest + 0.14 + 0.10 * t)
      : Math.max(0.5, Math.min(0.95, baseTest));

    points.push({ epoch: e, trainAcc, valAcc, testAcc });
  }
  return points;
}

// ---------------------------------------------------------------------------
// Tính số lượng mẫu cho mỗi tập, nhớ làm tròn sao cho tổng luôn = 1000 mẫu.
// ---------------------------------------------------------------------------
function computeCounts(split: SplitState): { train: number; val: number; test: number } {
  const train = Math.round((split.train / 100) * DATASET_SIZE);
  const val = Math.round((split.val / 100) * DATASET_SIZE);
  const test = DATASET_SIZE - train - val;
  return { train, val, test };
}

// ---------------------------------------------------------------------------
// Chấm điểm "sức khoẻ" của cấu hình split — dùng để cho người dùng biết cấu
// hình họ chọn có hợp lý hay không và vì sao.
// ---------------------------------------------------------------------------
function diagnoseSplit(split: SplitState, leakage: boolean): {
  status: "good" | "warning" | "danger";
  message: string;
} {
  if (leakage) {
    return {
      status: "danger",
      message:
        "Bạn đang dùng test set trong quá trình tuning — đây là data leakage. Số đo test sẽ giả tạo.",
    };
  }
  if (split.train < 50) {
    return {
      status: "warning",
      message:
        "Train set quá nhỏ (<50%). Mô hình không có đủ dữ liệu để học patterns ổn định.",
    };
  }
  if (split.val < 5) {
    return {
      status: "warning",
      message:
        "Validation set quá nhỏ — tín hiệu chọn hyperparameters sẽ rất nhiễu.",
    };
  }
  if (split.test < 5) {
    return {
      status: "warning",
      message:
        "Test set quá nhỏ — độ tin cậy của đánh giá cuối cùng rất thấp (confidence interval rộng).",
    };
  }
  if (split.train > 85) {
    return {
      status: "warning",
      message:
        "Train set chiếm quá nhiều (>85%). Val và test còn lại quá ít để đánh giá đáng tin.",
    };
  }
  return {
    status: "good",
    message:
      "Cấu hình cân đối — mô hình có đủ dữ liệu để học, điều chỉnh và đánh giá khách quan.",
  };
}

// ---------------------------------------------------------------------------
// Dạng cấu hình preset để người học so sánh nhanh ba lựa chọn phổ biến.
// ---------------------------------------------------------------------------
const PRESETS: Array<{ name: string; split: SplitState; note: string }> = [
  {
    name: "Chuẩn 70/15/15",
    split: { train: 70, val: 15, test: 15 },
    note: "Mặc định cân bằng — phù hợp với dataset vừa (10k–100k).",
  },
  {
    name: "Dữ liệu lớn 80/10/10",
    split: { train: 80, val: 10, test: 10 },
    note: "Khi có hàng triệu mẫu, 10% đã đủ tin cậy cho val/test.",
  },
  {
    name: "Dữ liệu ít 60/20/20",
    split: { train: 60, val: 20, test: 20 },
    note: "Khi data ít, cân nhắc thêm val/test để giảm nhiễu đánh giá.",
  },
];

// ---------------------------------------------------------------------------
// Câu hỏi trắc nghiệm — 8 câu như yêu cầu, kết hợp multi-choice và fill-blank.
// ---------------------------------------------------------------------------
const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "Tại sao KHÔNG được dùng test set để chọn model hay tune hyperparameters?",
    options: [
      "Test set quá nhỏ",
      "Nếu dùng test set để quyết định → model được 'tối ưu' cho test set → không còn khách quan, đánh giá giả tạo",
      "Test set không có labels",
    ],
    correct: 1,
    explanation:
      "Test set là 'đề thi cuối kỳ' — chỉ được mở 1 LẦN để đánh giá cuối cùng. Nếu 'luyện đề thi' trên test set → điểm cao nhưng không phản ánh năng lực thật. Validation set là 'đề kiểm tra giữa kỳ' — dùng để tune, không phải để đánh giá cuối.",
  },
  {
    question: "Data có 1000 mẫu. Chia 70/15/15. Có vấn đề gì không?",
    options: [
      "Không vấn đề gì",
      "Có thể: 150 test samples ít quá để đánh giá đáng tin cậy. Cần cross-validation hoặc stratified split",
      "Cần chia 50/25/25",
    ],
    correct: 1,
    explanation:
      "1000 mẫu là ít. 150 test samples → confidence interval rộng. Giải pháp: (1) K-fold cross-validation (dùng tất cả data cho train VÀ evaluate), (2) Stratified split (đảm bảo tỷ lệ classes đều), (3) Nếu có thể: thu thập thêm data.",
  },
  {
    question: "Model accuracy: Train=99%, Val=75%, Test=73%. Vấn đề gì?",
    options: [
      "Model tốt — 99% accuracy",
      "OVERFITTING: model học thuộc train set (99%) nhưng không generalize (75% val, 73% test). Gap 24% quá lớn",
      "Test set quá khó",
    ],
    correct: 1,
    explanation:
      "Train-Val gap = 99-75 = 24% → overfitting nghiêm trọng. Model 'học thuộc' train set thay vì học patterns chung. Giải pháp: regularization, dropout, tăng data, giảm model complexity, early stopping. Val ≈ Test (75 vs 73) cho thấy val set đại diện tốt.",
  },
  {
    type: "fill-blank",
    question:
      "Trong quy trình ML, ta fit (huấn luyện) StandardScaler CHỈ trên tập {blank}, sau đó chỉ dùng transform (không fit lại) trên tập {blank} và tập {blank} để tránh data leakage.",
    blanks: [
      { answer: "train", accept: ["training", "tập train", "tập huấn luyện"] },
      { answer: "validation", accept: ["val", "tập val", "tập validation"] },
      { answer: "test", accept: ["tập test", "tập kiểm tra"] },
    ],
    explanation:
      "Data leakage xảy ra khi thông tin từ val/test 'rò rỉ' vào quá trình huấn luyện. Fit scaler trên TOÀN BỘ data trước khi split là lỗi phổ biến — scaler sẽ 'biết' phân phối của test set, làm kết quả đánh giá không còn khách quan.",
  },
  {
    question:
      "Một đồng nghiệp train model, nhìn kết quả test, sửa kiến trúc, lại train, lại nhìn test, cứ thế 20 lần. Điều gì đang xảy ra?",
    options: [
      "Đây là quy trình chuẩn — lặp lại đến khi tốt",
      "Test set đã bị 'đốt' (burned). Mỗi lần nhìn test rồi sửa là một dạng tuning trên test → test không còn khách quan",
      "Không vấn đề gì vì không dùng test để train trực tiếp",
    ],
    correct: 1,
    explanation:
      "Dù không train trên test, việc lặp đi lặp lại 'nhìn test → sửa model → nhìn test' cũng là một dạng information leakage gián tiếp. Kết quả: test accuracy cao hơn thực tế. Nguyên tắc vàng: test set chỉ được mở 1 lần, ở cuối cùng.",
  },
  {
    question:
      "Dataset thời gian (time series). Cách split nào hợp lý?",
    options: [
      "Random shuffle rồi chia 70/15/15 như bình thường",
      "Chia theo thời gian: train = dữ liệu cũ nhất, val = giữa, test = mới nhất. Không shuffle",
      "Không cần chia vì time series đặc biệt",
    ],
    correct: 1,
    explanation:
      "Time series KHÔNG ĐƯỢC shuffle — sẽ gây leakage tương lai vào quá khứ (model 'biết trước' kết quả). Cách đúng: chia theo thứ tự thời gian. Ví dụ dữ liệu 2020–2024: train 2020–2022, val 2023, test 2024. Kỹ thuật nâng cao: TimeSeriesSplit của sklearn.",
  },
  {
    question:
      "Bạn có 50.000 ảnh chó-mèo thu thập từ 500 người dùng. Mỗi người đóng góp ~100 ảnh. Cách split?",
    options: [
      "Shuffle tất cả 50.000 ảnh rồi chia 70/15/15",
      "Group split theo người: 350 người cho train, 75 người val, 75 người test. Không để ảnh của cùng một người ở nhiều tập",
      "Chia ngẫu nhiên theo ảnh vì mỗi ảnh là độc lập",
    ],
    correct: 1,
    explanation:
      "Ảnh từ cùng một người thường giống nhau (cùng máy ảnh, cùng con thú, cùng ánh sáng). Nếu trộn lẫn → model 'nhớ' người chứ không 'hiểu' chó-mèo. GroupKFold / group split giữ các ảnh cùng nhóm trong cùng một tập. Đây là leakage do 'subject overlap'.",
  },
  {
    question:
      "Khi nào cross-validation tốt hơn hold-out split đơn thuần?",
    options: [
      "Luôn luôn — cross-validation luôn tốt hơn",
      "Khi dataset nhỏ (<10k) — CV dùng toàn bộ data để đánh giá, giảm phương sai. Khi dataset lớn hoặc train tốn kém, hold-out đủ dùng",
      "Khi có GPU mạnh",
    ],
    correct: 1,
    explanation:
      "Cross-validation mạnh khi data ít: mỗi mẫu được dùng cho cả train VÀ val (ở các fold khác nhau). Giảm variance trong ước lượng. Nhược điểm: tốn gấp K lần thời gian. Với data lớn (triệu mẫu), hold-out 80/10/10 đủ tin cậy và rẻ hơn.",
  },
];

// ---------------------------------------------------------------------------
// Component phụ: thanh trượt có nhãn — tách riêng để khối render chính gọn.
// ---------------------------------------------------------------------------
function LabeledSlider({
  label,
  value,
  min,
  max,
  onChange,
  color,
  disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  color: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span
          className="font-mono font-semibold"
          style={{ color }}
          aria-live="polite"
        >
          {value}%
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full"
        style={{ accentColor: color }}
        disabled={disabled}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component phụ: chú thích màu cho biểu đồ — dùng lại nhiều lần.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Component chính
// ---------------------------------------------------------------------------
export default function TrainValTestTopic() {
  // Cấu hình split — giữ lại raw percentages, tự tính số mẫu.
  const [trainPct, setTrainPct] = useState<number>(70);
  const [valPct, setValPct] = useState<number>(15);
  const [epochs, setEpochs] = useState<number>(30);
  const [leakage, setLeakage] = useState<boolean>(false);

  // Test luôn được tính ra, không có slider riêng — để bảo đảm tổng = 100.
  const testPct = Math.max(5, 100 - trainPct - valPct);

  const split: SplitState = useMemo(
    () => ({ train: trainPct, val: valPct, test: testPct }),
    [trainPct, valPct, testPct],
  );

  const counts = useMemo(() => computeCounts(split), [split]);

  const curve = useMemo(
    () => buildTrainingCurve(epochs, trainPct, valPct, testPct, leakage),
    [epochs, trainPct, valPct, testPct, leakage],
  );

  const diagnosis = useMemo(() => diagnoseSplit(split, leakage), [split, leakage]);

  const latestPoint = curve[curve.length - 1];
  const trainValGap = latestPoint
    ? Math.round((latestPoint.trainAcc - latestPoint.valAcc) * 100)
    : 0;

  const applyPreset = useCallback((preset: SplitState) => {
    setTrainPct(preset.train);
    setValPct(preset.val);
  }, []);

  const handleTrainChange = useCallback(
    (v: number) => {
      setTrainPct(v);
      // Nếu tổng vượt 100 thì giảm val dần để bảo đảm test >= 5.
      if (v + valPct > 95) {
        setValPct(Math.max(5, 95 - v));
      }
    },
    [valPct],
  );

  const handleValChange = useCallback(
    (v: number) => {
      setValPct(v);
      if (trainPct + v > 95) {
        setTrainPct(Math.max(50, 95 - v));
      }
    },
    [trainPct],
  );

  // Danh sách điểm dữ liệu minh hoạ (1000 segment nhỏ) — chỉ tạo một lần.
  const dataSegments = useMemo(() => {
    const arr: Array<{ x: number; y: number; group: "train" | "val" | "test" }> = [];
    const cols = 50;
    const rows = 20; // 50 × 20 = 1000
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

  const curveMaxX = 560;
  const curveMaxY = 140;

  const curvePath = useCallback(
    (key: keyof Pick<TrainingPoint, "trainAcc" | "valAcc" | "testAcc">) => {
      if (curve.length === 0) return "";
      return curve
        .map((p, i) => {
          const x = 30 + (i / Math.max(1, curve.length - 1)) * curveMaxX;
          const y = 20 + (1 - p[key]) * curveMaxY;
          return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
        })
        .join(" ");
    },
    [curve],
  );

  const calloutVariantForDiagnosis =
    diagnosis.status === "good"
      ? "tip"
      : diagnosis.status === "warning"
        ? "warning"
        : ("warning" as const);

  return (
    <>
      {/* Thanh tiến trình tổng thể — giúp người học biết mình đang ở bước nào */}
      <div className="mb-6 flex items-center justify-between">
        <ProgressSteps
          current={1}
          total={TOTAL_STEPS}
          labels={[
            "Dự đoán",
            "Khám phá",
            "Aha",
            "Leakage",
            "Thử thách",
            "Lý thuyết",
            "Góc sâu",
            "Tóm tắt",
            "Kiểm tra",
          ]}
        />
      </div>

      {/* ========================================================= */}
      {/* Bước 1 — Dự đoán                                           */}
      {/* ========================================================= */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn ôn thi đại học. Giáo viên cho 100 đề. Bạn làm cả 100 đề để luyện, rồi dùng chính những đề đó để chấm điểm mình. Điểm rất cao. Nhưng đi thi thật lại trượt. Tại sao?"
          options={[
            "Đề thi thật khó hơn đề ôn",
            "Bạn đã 'học thuộc' đáp án của 100 đề → điểm cao giả tạo. Cần giữ riêng vài đề CHƯA LÀM để kiểm tra năng lực thật",
            "Bạn không ôn đủ",
          ]}
          correct={1}
          explanation="Đúng! Giống ML: nếu dùng TẤT CẢ data để train → model 'học thuộc' → accuracy cao trên train data nhưng tệ trên data mới. Cần giữ riêng: validation set (đề kiểm tra giữa kỳ) và test set (đề thi cuối kỳ — chỉ làm 1 lần)."
        />
      </LessonSection>

      {/* ========================================================= */}
      {/* Bước 2 — Khám phá: mô phỏng chia dữ liệu + đường cong học  */}
      {/* ========================================================= */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm leading-relaxed text-muted">
          Mô phỏng bên dưới có{" "}
          <strong className="text-foreground">{DATASET_SIZE} điểm dữ liệu</strong>
          . Dùng các thanh trượt để chia thành train / val / test và quan sát đường
          cong học thay đổi qua từng epoch. Bật công tắc &quot;Data leakage&quot; để
          thấy điều gì xảy ra khi test set bị dùng sai.
        </p>
        <VisualizationSection>
          <div className="space-y-6">
            {/* ------------ Bar 1000 điểm dữ liệu ------------ */}
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <LegendDot color={COLOR_TRAIN} label={`Train (${counts.train})`} />
                <LegendDot color={COLOR_VAL} label={`Val (${counts.val})`} />
                <LegendDot color={COLOR_TEST} label={`Test (${counts.test})`} />
              </div>
              <svg viewBox="0 0 600 90" className="mx-auto w-full max-w-2xl" role="img" aria-label="Bảng 1000 điểm dữ liệu được chia thành ba tập">
                <defs>
                  <linearGradient id="trainGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={COLOR_TRAIN} stopOpacity={1} />
                    <stop offset="100%" stopColor={COLOR_TRAIN} stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                {dataSegments.map((seg, i) => {
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
            </div>

            {/* ------------ Bar tổng thể 1D ------------ */}
            <svg viewBox="0 0 600 60" className="mx-auto w-full max-w-2xl">
              <motion.rect
                x={20}
                y={15}
                width={(560 * trainPct) / 100}
                height={30}
                rx={6}
                fill={COLOR_TRAIN}
                initial={false}
                animate={{ width: (560 * trainPct) / 100 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
              <motion.rect
                x={20 + (560 * trainPct) / 100}
                y={15}
                width={(560 * valPct) / 100}
                height={30}
                fill={COLOR_VAL}
                initial={false}
                animate={{
                  x: 20 + (560 * trainPct) / 100,
                  width: (560 * valPct) / 100,
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
              <motion.rect
                x={20 + (560 * (trainPct + valPct)) / 100}
                y={15}
                width={(560 * testPct) / 100}
                height={30}
                rx={6}
                fill={COLOR_TEST}
                initial={false}
                animate={{
                  x: 20 + (560 * (trainPct + valPct)) / 100,
                  width: (560 * testPct) / 100,
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
              <text
                x={20 + (560 * trainPct) / 200}
                y={34}
                textAnchor="middle"
                fill="white"
                fontSize={11}
                fontWeight="bold"
              >
                Train {trainPct}%
              </text>
              <text
                x={20 + (560 * (trainPct + valPct / 2)) / 100}
                y={34}
                textAnchor="middle"
                fill="white"
                fontSize={11}
                fontWeight="bold"
              >
                Val {valPct}%
              </text>
              <text
                x={20 + (560 * (trainPct + valPct + testPct / 2)) / 100}
                y={34}
                textAnchor="middle"
                fill="white"
                fontSize={11}
                fontWeight="bold"
              >
                Test {testPct}%
              </text>
            </svg>

            {/* ------------ Sliders ------------ */}
            <div className="grid gap-4 md:grid-cols-3">
              <LabeledSlider
                label="Train"
                value={trainPct}
                min={40}
                max={85}
                onChange={handleTrainChange}
                color={COLOR_TRAIN}
              />
              <LabeledSlider
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
                  <span
                    className="font-mono font-semibold"
                    style={{ color: COLOR_TEST }}
                  >
                    {testPct}%
                  </span>
                </div>
                <div className="h-2 w-full rounded bg-surface">
                  <div
                    className="h-2 rounded"
                    style={{
                      width: `${(testPct / 40) * 100}%`,
                      backgroundColor: COLOR_TEST,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ------------ Preset buttons ------------ */}
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset.split)}
                  className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
                  title={preset.note}
                  type="button"
                >
                  {preset.name}
                </button>
              ))}
            </div>

            {/* ------------ Epochs + leakage toggle ------------ */}
            <div className="grid gap-4 md:grid-cols-2">
              <LabeledSlider
                label="Số epoch huấn luyện"
                value={epochs}
                min={5}
                max={80}
                onChange={setEpochs}
                color="#8b5cf6"
              />
              <label className="flex cursor-pointer items-center justify-between rounded-md border border-border bg-surface px-3 py-2">
                <span className="text-sm font-medium text-foreground">
                  Bật data leakage (sai)
                </span>
                <input
                  type="checkbox"
                  checked={leakage}
                  onChange={(e) => setLeakage(e.target.checked)}
                  className="h-4 w-4 accent-red-500"
                />
              </label>
            </div>

            {/* ------------ Đường cong huấn luyện ------------ */}
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <LegendDot color={COLOR_TRAIN} label="Train accuracy" />
                <LegendDot color={COLOR_VAL} label="Val accuracy" />
                <LegendDot
                  color={leakage ? COLOR_LEAK : COLOR_TEST}
                  label={leakage ? "Test (bị leakage!)" : "Test accuracy"}
                />
              </div>
              <svg
                viewBox="0 0 620 200"
                className="mx-auto w-full max-w-2xl rounded-md border border-border bg-background"
                role="img"
                aria-label="Đường cong huấn luyện theo epoch"
              >
                {/* trục & mức 50%/100% */}
                <line x1={30} y1={20} x2={30} y2={180} stroke="#475569" strokeWidth={1} />
                <line x1={30} y1={180} x2={600} y2={180} stroke="#475569" strokeWidth={1} />
                <line
                  x1={30}
                  y1={20 + 0.5 * curveMaxY}
                  x2={600}
                  y2={20 + 0.5 * curveMaxY}
                  stroke="#334155"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
                <text x={14} y={24} fill="#94a3b8" fontSize={9} textAnchor="end">
                  100%
                </text>
                <text x={14} y={24 + 0.5 * curveMaxY} fill="#94a3b8" fontSize={9} textAnchor="end">
                  75%
                </text>
                <text x={14} y={184} fill="#94a3b8" fontSize={9} textAnchor="end">
                  50%
                </text>
                <text x={315} y={196} fill="#94a3b8" fontSize={9} textAnchor="middle">
                  Epoch →
                </text>
                <motion.path
                  d={curvePath("trainAcc")}
                  fill="none"
                  stroke={COLOR_TRAIN}
                  strokeWidth={2.2}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6 }}
                />
                <motion.path
                  d={curvePath("valAcc")}
                  fill="none"
                  stroke={COLOR_VAL}
                  strokeWidth={2.2}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.7 }}
                />
                <motion.path
                  d={curvePath("testAcc")}
                  fill="none"
                  stroke={leakage ? COLOR_LEAK : COLOR_TEST}
                  strokeWidth={2.2}
                  strokeDasharray={leakage ? "6 3" : "none"}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8 }}
                />
              </svg>
            </div>

            {/* ------------ Bảng số ------------ */}
            <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              <div className="rounded-md border border-border bg-surface px-3 py-2">
                <div className="text-xs text-muted">Train acc</div>
                <div
                  className="font-mono text-lg font-semibold"
                  style={{ color: COLOR_TRAIN }}
                >
                  {(latestPoint.trainAcc * 100).toFixed(1)}%
                </div>
              </div>
              <div className="rounded-md border border-border bg-surface px-3 py-2">
                <div className="text-xs text-muted">Val acc</div>
                <div
                  className="font-mono text-lg font-semibold"
                  style={{ color: COLOR_VAL }}
                >
                  {(latestPoint.valAcc * 100).toFixed(1)}%
                </div>
              </div>
              <div className="rounded-md border border-border bg-surface px-3 py-2">
                <div className="text-xs text-muted">Test acc</div>
                <div
                  className="font-mono text-lg font-semibold"
                  style={{ color: leakage ? COLOR_LEAK : COLOR_TEST }}
                >
                  {(latestPoint.testAcc * 100).toFixed(1)}%
                </div>
              </div>
              <div className="rounded-md border border-border bg-surface px-3 py-2">
                <div className="text-xs text-muted">Gap Train−Val</div>
                <div
                  className={`font-mono text-lg font-semibold ${
                    trainValGap > 15 ? "text-red-500" : "text-foreground"
                  }`}
                >
                  {trainValGap}%
                </div>
              </div>
            </div>

            {/* ------------ Chẩn đoán cấu hình ------------ */}
            <Callout
              variant={calloutVariantForDiagnosis}
              title={
                diagnosis.status === "good"
                  ? "Cấu hình hợp lý"
                  : diagnosis.status === "warning"
                    ? "Có điểm cần lưu ý"
                    : "Phát hiện data leakage!"
              }
            >
              <p>{diagnosis.message}</p>
              {trainValGap > 15 && (
                <p className="mt-2">
                  Gap giữa train và val hiện ở mức{" "}
                  <strong>{trainValGap}%</strong> — dấu hiệu overfitting đáng kể.
                  Thử giảm epochs, thêm regularization hoặc giảm độ phức tạp của
                  mô hình.
                </p>
              )}
            </Callout>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ========================================================= */}
      {/* Bước 3 — Aha                                                */}
      {/* ========================================================= */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Train set ={" "}
            <strong>sách giáo khoa</strong>{" "}
            (học từ đây). Validation set ={" "}
            <strong>đề kiểm tra giữa kỳ</strong>{" "}
            (điều chỉnh cách học). Test set ={" "}
            <strong>đề thi cuối kỳ</strong>{" "}
            (chỉ làm 1 lần — đánh giá năng lực thật). Nếu{" "}
            &quot;luyện đề thi&quot; trên test set → điểm cao nhưng{" "}
            <strong>không phản ánh năng lực thật!</strong>
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ========================================================= */}
      {/* Bước 4 — Hiểu sâu về data leakage                           */}
      {/* ========================================================= */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Data leakage">
        <p className="mb-4 text-sm leading-relaxed text-muted">
          Data leakage là &quot;tai nạn nghề nghiệp&quot; phổ biến nhất trong ML.
          Dưới đây là các tình huống leakage thường gặp mà ngay cả kỹ sư có
          kinh nghiệm cũng có thể mắc.
        </p>
        <Callout variant="warning" title="5 kịch bản leakage phổ biến">
          <ol className="list-decimal space-y-1.5 pl-4 text-sm">
            <li>
              <strong>Fit scaler/encoder trên toàn bộ data</strong> trước khi
              split — scaler &quot;nhìn thấy&quot; phân phối của test.
            </li>
            <li>
              <strong>Oversample/SMOTE trước khi split</strong> — bản sao của
              mẫu train có thể xuất hiện trong val/test.
            </li>
            <li>
              <strong>Feature engineering dùng target</strong> — ví dụ tính
              mean-encoding trên toàn bộ data.
            </li>
            <li>
              <strong>Time series bị shuffle</strong> — tương lai lọt vào train.
            </li>
            <li>
              <strong>Cùng một &quot;subject&quot; ở nhiều tập</strong> — ảnh của
              cùng một người ở cả train và test.
            </li>
          </ol>
        </Callout>
        <div className="mt-4">
          <Callout variant="warning" title="Triệu chứng nghi ngờ leakage">
            <p>
              Khi kết quả trên test &quot;quá đẹp&quot; (gần bằng train hoặc cao
              bất thường so với đồng nghiệp cùng đề bài), hãy dừng lại. Kiểm tra
              lại pipeline theo thứ tự:{" "}
              <strong>
                split → fit preprocessing trên train → transform val/test → train
                model → evaluate.
              </strong>
            </p>
          </Callout>
        </div>
      </LessonSection>

      {/* ========================================================= */}
      {/* Bước 5 — Thử thách nhanh                                    */}
      {/* ========================================================= */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Dataset có 10.000 mẫu: 9500 class A, 500 class B (mất cân bằng 19:1). Random split 70/15/15. Có vấn đề gì?"
          options={[
            "Không vấn đề",
            "Test set 1500 mẫu có thể chỉ có 75 class B (5%) — quá ít để đánh giá đáng tin cậy. Cần STRATIFIED split giữ tỷ lệ classes",
            "Cần chia 50/25/25",
          ]}
          correct={1}
          explanation="Random split có thể cho test set với rất ít class B (hoặc quá nhiều). Stratified split: đảm bảo TỪNG TẬP đều có tỷ lệ 19:1 giống tổng thể. Train: 6650 A + 350 B. Val: 1425 A + 75 B. Test: 1425 A + 75 B. Mỗi tập đại diện cho distribution gốc!"
        />
        <div className="mt-4">
          <InlineChallenge
            question="Bạn train xong, xem test accuracy 94%. Bạn tăng hidden units từ 64 lên 128, train lại, test accuracy 95%. Bạn thử thêm 10 cấu hình khác, cuối cùng chọn cấu hình test tốt nhất (96%). Điểm test 96% này có đáng tin?"
            options={[
              "Có — bạn đã thử nhiều cấu hình và chọn tốt nhất",
              "Không — bạn đã biến test set thành validation set. Số liệu 96% cao hơn thực tế vì đã tuning trên test",
              "Có, miễn là bạn không train trực tiếp trên test",
            ]}
            correct={1}
            explanation="Đây là 'silent leakage'. Mỗi lần nhìn test rồi điều chỉnh là một lần chọn model dựa trên test. Sau 10 lần thử, test accuracy 96% bị thiên lệch cao. Quy tắc đúng: tune bằng val, chỉ mở test 1 lần cuối. Nếu muốn so nhiều cấu hình, dùng nested cross-validation."
          />
        </div>
      </LessonSection>

      {/* ========================================================= */}
      {/* Bước 6 — Lý thuyết + code                                   */}
      {/* ========================================================= */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Train/Validation/Test Split</strong>{" "}chia dữ liệu thành 3
            tập để đảm bảo đánh giá model khách quan — cơ bản nhất của ML
            methodology. Khi dữ liệu ít, nên thay thế bằng{" "}
            <TopicLink slug="cross-validation">K-Fold Cross-Validation</TopicLink>{" "}
            để tận dụng tối đa dữ liệu mà vẫn đánh giá được{" "}
            <TopicLink slug="overfitting-underfitting">overfitting</TopicLink>.
          </p>
          <p>
            <strong>3 tập và mục đích:</strong>
          </p>
          <ul className="list-inside list-disc space-y-1 pl-2 text-sm">
            <li>
              <strong>Train (60-80%):</strong>{" "}
              Model học patterns từ đây. Update weights.
            </li>
            <li>
              <strong>Validation (10-20%):</strong>{" "}
              Tune hyperparameters, chọn model, early stopping.
            </li>
            <li>
              <strong>Test (10-20%):</strong>{" "}
              Đánh giá cuối cùng. CHỈ DÙNG 1 LẦN.
            </li>
          </ul>

          <LaTeX block>
            {"\\text{Generalization Error} = \\text{Test Error} \\approx \\mathbb{E}[\\mathcal{L}(f(x), y)] \\text{ trên data chưa thấy}"}
          </LaTeX>

          <Callout variant="warning" title="Data Leakage trong pipeline">
            Lỗi phổ biến:{" "}
            <TopicLink slug="data-preprocessing">feature engineering</TopicLink>{" "}
            TRƯỚC khi split → thông tin từ test &quot;rò rỉ&quot; vào train (ví
            dụ: StandardScaler fit trên TOÀN BỘ data). ĐÚNG: split trước → fit
            scaler trên train → transform val/test bằng scaler của train.
          </Callout>

          <Callout variant="info" title="Khi nào dùng cross-validation thay vì hold-out?">
            Với dataset nhỏ (&lt; 10k mẫu), K-fold CV cho ước lượng ổn định hơn
            vì mỗi mẫu được dùng cả để train và đánh giá. Với dataset lớn (vài
            triệu mẫu), hold-out 80/10/10 đủ tin cậy và tiết kiệm chi phí tính
            toán gấp K lần.
          </Callout>

          <CodeBlock language="python" title="Chia dữ liệu đúng cách (sklearn)">
{`from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# Bước 1: Split TRƯỚC mọi thứ khác — stratify giữ tỷ lệ class
X_temp, X_test, y_temp, y_test = train_test_split(
    X, y,
    test_size=0.15,
    stratify=y,
    random_state=42,
)
X_train, X_val, y_train, y_val = train_test_split(
    X_temp, y_temp,
    test_size=0.176,   # 0.176 * 0.85 ≈ 0.15 của tổng
    stratify=y_temp,
    random_state=42,
)

# Bước 2: Fit scaler CHỈ trên train → transform val/test
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_val   = scaler.transform(X_val)
X_test  = scaler.transform(X_test)

# Bước 3: Train + tune trên train/val
model.fit(X_train, y_train)
val_score = model.score(X_val, y_val)

# Bước 4: Đánh giá cuối cùng trên test — CHỈ 1 LẦN
test_score = model.score(X_test, y_test)
print(f"Val: {val_score:.3f} | Test: {test_score:.3f}")`}
          </CodeBlock>

          <CodeBlock
            language="python"
            title="GroupKFold — chống leakage do 'subject overlap'"
          >
{`from sklearn.model_selection import GroupKFold

# groups[i] = id của người/bệnh nhân/thiết bị/phiên mà mẫu i thuộc về
gkf = GroupKFold(n_splits=5)

for fold, (train_idx, val_idx) in enumerate(gkf.split(X, y, groups=groups)):
    X_tr, X_val = X[train_idx], X[val_idx]
    y_tr, y_val = y[train_idx], y[val_idx]
    # Không có group nào nằm ở cả train và val
    model.fit(X_tr, y_tr)
    print(f"Fold {fold}: val acc = {model.score(X_val, y_val):.3f}")`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      {/* ========================================================= */}
      {/* Bước 7 — Góc sâu (CollapsibleDetail x 2)                   */}
      {/* ========================================================= */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Góc sâu">
        <div className="space-y-3">
          <CollapsibleDetail title="Tại sao val set 'hết thiêng' sau vài chục thử nghiệm?">
            <p className="text-sm text-muted">
              Mỗi khi bạn chọn hyperparameters dựa trên val accuracy, bạn đang
              &quot;nhét&quot; một chút thông tin của val set vào model (qua
              quyết định của bạn). Sau vài chục lần thử, model gián tiếp
              &quot;biết&quot; val set — val accuracy bắt đầu overfit tương tự
              như train. Giải pháp:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted">
              <li>
                Giới hạn số thử nghiệm, hoặc dùng công cụ như Optuna với
                pruning.
              </li>
              <li>
                Dùng <strong>nested CV</strong>: vòng ngoài đánh giá, vòng
                trong tune — ước lượng không thiên lệch.
              </li>
              <li>
                Với mô hình sản xuất, dành riêng một bộ &quot;holdout cuối&quot;
                chưa hề được dùng trong bất kỳ vòng thử nào.
              </li>
            </ul>
          </CollapsibleDetail>

          <CollapsibleDetail title="Confidence interval của test accuracy">
            <p className="text-sm text-muted">
              Test accuracy là một ước lượng có sai số. Với test set n mẫu và
              accuracy p, sai số chuẩn xấp xỉ{" "}
              <code className="rounded bg-surface px-1">
                sqrt(p(1-p)/n)
              </code>
              . Ví dụ: n=100, p=0.90 → SE ≈ 3% → khoảng tin cậy 95% là
              [84%, 96%]. Hai model khác nhau 2% có thể không thực sự khác
              nhau. Khi so sánh, hãy báo cáo kèm CI và dùng bootstrap hoặc
              McNemar&apos;s test.
            </p>
            <LaTeX block>
              {"\\widehat{SE}(p) = \\sqrt{\\frac{p(1-p)}{n}},\\quad CI_{95\\%} \\approx p \\pm 1.96 \\cdot \\widehat{SE}(p)"}
            </LaTeX>
          </CollapsibleDetail>
        </div>
      </LessonSection>

      {/* ========================================================= */}
      {/* Bước 8 — Tóm tắt                                            */}
      {/* ========================================================= */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          points={[
            "Train (học), Validation (kiểm tra giữa kỳ), Test (thi cuối kỳ — chỉ 1 lần).",
            "KHÔNG dùng test set để tune hay chọn model — sẽ mất tính khách quan.",
            "Stratified split giữ tỷ lệ classes đều — quan trọng cho data mất cân bằng.",
            "Data leakage: SPLIT TRƯỚC, fit scaler/encoder CHỈ trên train, transform val/test.",
            "Time series và group data cần split đặc thù (theo thời gian / theo subject).",
            "Data ít? Dùng K-fold cross-validation — mỗi fold lần lượt làm validation.",
          ]}
        />
      </LessonSection>

      {/* ========================================================= */}
      {/* Bước 9 — Kiểm tra                                           */}
      {/* ========================================================= */}
      <LessonSection step={9} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ_QUESTIONS} />
      </LessonSection>
    </>
  );
}

// ---------------------------------------------------------------------------
// Ghi chú phát triển — dành cho maintainer:
//
// 1. Phần mô phỏng đường cong ở đây cố tình đơn giản hoá để người học thấy
//    rõ xu hướng. Trong thực tế, đường cong phụ thuộc vào loss surface, kích
//    thước mini-batch, learning rate schedule, và nhiều yếu tố khác.
//
// 2. Khi cần thêm bài tập mới, thêm vào mảng QUIZ_QUESTIONS ở đầu file và
//    đảm bảo câu trả lời đúng đã được kiểm tra với ít nhất một người học
//    mới vào để tránh hiệu ứng "đúng-theo-tác-giả".
//
// 3. Các slider có min/max được chọn để luôn bảo toàn test >= 5%. Nếu thay
//    đổi giới hạn, nhớ cập nhật handleTrainChange / handleValChange kèm
//    guard để tránh test = 0.
//
// 4. Giá trị 0.176 trong CodeBlock đến từ công thức 0.15 / 0.85 — giữ cho
//    test set xấp xỉ 15% của tổng sau hai lần split liên tiếp.
//
// 5. Nếu người học báo đường cong "giật" khi kéo slider, cân nhắc debounce
//    các sự kiện onChange 40-60ms để giảm recompute trong buildTrainingCurve.
//
// 6. Các callout màu warning/danger/success/info được quyết định qua
//    calloutVariantForDiagnosis — thêm variant mới nhớ map đầy đủ ở đó.
//
// 7. Khi cần i18n, text Việt ở đây nên chuyển sang key của messages.vi.json
//    để đồng bộ với các topic khác. Hiện tại inline cho đơn giản.
//
// 8. 2 CollapsibleDetail ở bước 7 có thể mở rộng thêm một mục nữa về
//    nested cross-validation nếu cần — giữ ở 2 mục để không làm loãng.
//
// 9. Thanh ProgressSteps ở đầu cần đồng bộ số bước với TOTAL_STEPS nếu
//    thay đổi TOTAL_STEPS ở trên.
//
// 10. Khi cập nhật metadata, nhớ đồng bộ với lib/topics index để navigation
//     không bị lệch.
//
// ---------------------------------------------------------------------------
// Phụ lục A — Bảng tra nhanh các tình huống thực tế
//
// Tình huống 1: Image classification 20k ảnh, balanced 10 class.
//   Đề xuất: stratified 80/10/10, không có subject overlap.
//
// Tình huống 2: Medical imaging 5k ảnh, 500 bệnh nhân, mỗi bệnh nhân ~10 ảnh.
//   Đề xuất: GroupKFold theo bệnh nhân, 5 fold, k-fold CV.
//   Lý do: ảnh cùng bệnh nhân cực kỳ tương quan.
//
// Tình huống 3: NLP classification 1M văn bản, imbalanced 95/5.
//   Đề xuất: stratified 90/5/5, đủ tin cậy vì data lớn.
//
// Tình huống 4: Time series IoT sensor, 1 năm dữ liệu.
//   Đề xuất: train Q1-Q2, val Q3, test Q4. Hoặc rolling window CV.
//
// Tình huống 5: Recommender system, user-item interactions.
//   Đề xuất: leave-one-out per user, hoặc temporal split theo timestamp
//   của tương tác. Lưu ý cold-start: user/item mới không có trong train.
//
// Tình huống 6: Audio classification, 100k clip, 200 người nói.
//   Đề xuất: GroupKFold theo người nói; nếu không, model sẽ học giọng
//   thay vì học nội dung/loại âm thanh.
//
// Tình huống 7: Fraud detection 10M giao dịch, 0.1% fraud.
//   Đề xuất: temporal split + stratified; kết hợp với undersampling
//   CHỈ trên train (không trên val/test).
//
// Tình huống 8: Kaggle competition.
//   Đề xuất: local val đúng cách; không "chạy đua leaderboard public"
//   vì public LB = một dạng test set bị dùng nhiều lần.
//
// ---------------------------------------------------------------------------
// Phụ lục B — Checklist pre-flight trước khi báo cáo kết quả
//
// [ ] Đã split trước khi làm bất cứ preprocessing nào?
// [ ] Scaler/encoder chỉ fit trên train?
// [ ] Stratified nếu data mất cân bằng?
// [ ] GroupKFold nếu có subject/group?
// [ ] Time series không bị shuffle?
// [ ] Oversampling/SMOTE chỉ trên train?
// [ ] Mean-target encoding dùng out-of-fold?
// [ ] Feature dựa trên target bị loại bỏ?
// [ ] Test set chỉ được mở 1 lần cuối cùng?
// [ ] Báo cáo kèm confidence interval?
// [ ] So sánh model bằng test thống kê (bootstrap/McNemar)?
// [ ] Seed được cố định để tái lập?
//
// Nếu còn một ô chưa tick, hãy dừng lại trước khi báo cáo. Một báo cáo
// sạch ở dự án nhỏ còn quý hơn một báo cáo "đẹp" bị leakage ở dự án lớn
// — vì leakage được phát hiện sau này sẽ phá hỏng uy tín của cả nhóm.
//
// ---------------------------------------------------------------------------
// Phụ lục C — Công thức xấp xỉ cỡ test set cần thiết
//
// Giả sử bạn muốn ước lượng accuracy với sai số tối đa ±epsilon, độ tin
// cậy 95% (z = 1.96). Cỡ test cần:
//
//   n_test >= (1.96)^2 * p(1-p) / epsilon^2
//
// Với p ≈ 0.9, epsilon = 0.02:
//   n_test >= 3.84 * 0.09 / 0.0004 ≈ 864 mẫu.
//
// Với p ≈ 0.5 (khó nhất), epsilon = 0.02:
//   n_test >= 3.84 * 0.25 / 0.0004 = 2400 mẫu.
//
// Kết luận: để "chốt số" accuracy trong sai số 2%, cần test cỡ ~1000-2500.
// Nếu data tổng chỉ 1000-2000, hãy dùng cross-validation thay vì hold-out.
//
// ---------------------------------------------------------------------------
// Phụ lục D — So sánh test thống kê cho hai model
//
// Khi so sánh model A và B trên CÙNG test set, đừng chỉ nhìn delta accuracy.
// Dùng McNemar's test (cho phân loại nhị phân) hoặc bootstrap 10000 lần.
//
// Bootstrap procedure (pseudo):
//   deltas = []
//   for i in 1..10000:
//     idx = sample_with_replacement(1..n_test)
//     d = acc_A(idx) - acc_B(idx)
//     deltas.append(d)
//   CI_95 = percentile(deltas, [2.5, 97.5])
//   if 0 not in CI_95: B khác A có ý nghĩa thống kê
//
// ---------------------------------------------------------------------------
// Phụ lục E — Lỗi thiết kế thường gặp khi review code của đồng nghiệp
//
//   (a) scaler = StandardScaler(); X = scaler.fit_transform(X); split(X)
//       → Đã fit trên toàn bộ X, bao gồm cả dữ liệu sau này là test.
//
//   (b) df['mean_encoded'] = df.groupby('category')['y'].transform('mean')
//       → mean_encoded của mẫu train bị ảnh hưởng bởi y của mẫu cùng
//         category ở val/test. Giải pháp: out-of-fold target encoding.
//
//   (c) X, y = shuffle(X, y); split(X, y) với X là time series
//       → Tương lai lọt vào quá khứ. Không shuffle time series.
//
//   (d) SMOTE(X_train, y_train); split(X_train, ...)
//       → Bản sao synthetic có thể tương tự mẫu gốc ở val. Luôn SMOTE
//         SAU khi split, và CHỈ trên tập train.
//
//   (e) best_model = None; for lr in [1e-4,...,1]: ...
//         if test_acc > best: best_model = model
//       → Đang tune trên test. Đổi test_acc → val_acc. Chỉ mở test
//         sau khi chọn xong best_model.
//
// Các lỗi này nhìn qua rất nhỏ nhưng hậu quả cực lớn: kết quả báo cáo
// không thể tái lập, khi triển khai production model "tụt" 10-20 điểm.
//
// ---------------------------------------------------------------------------
// Kết — mục tiêu của bài học
//
// Sau khi hoàn thành chuỗi bước ở trên, người học nên có thể:
//   1. Giải thích được vai trò của từng tập (train/val/test).
//   2. Viết đúng thứ tự pipeline: split → fit preprocessing → evaluate.
//   3. Nhận biết và tránh 5 loại data leakage phổ biến.
//   4. Lựa chọn giữa hold-out và K-fold CV dựa trên cỡ dữ liệu.
//   5. Áp dụng stratified / group / temporal split đúng ngữ cảnh.
//   6. Báo cáo kết quả kèm confidence interval, không chỉ một con số.
//
// Đó là nền tảng của mọi project ML có thể tin cậy được.
// ---------------------------------------------------------------------------
