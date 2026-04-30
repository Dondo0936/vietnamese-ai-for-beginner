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
// Metadata — giữ nguyên theo yêu cầu
// ---------------------------------------------------------------------------

export const metadata: TopicMeta = {
  slug: "adversarial-robustness",
  title: "Adversarial Robustness",
  titleVi: "Bền vững trước tấn công — AI không dễ bị lừa",
  description:
    "Khả năng của mô hình AI duy trì hiệu suất chính xác khi đối mặt với dữ liệu đầu vào bị thao túng có chủ đích.",
  category: "ai-safety",
  tags: ["adversarial", "robustness", "attack", "defense"],
  difficulty: "advanced",
  relatedSlugs: ["red-teaming", "guardrails", "alignment"],
  vizType: "interactive",
};

const TOTAL_STEPS = 10;

// ---------------------------------------------------------------------------
// FGSM Simulator — lưới pixel 16×16
// ---------------------------------------------------------------------------

const GRID_SIZE = 16;
const CELL_PX = 18;
const CANVAS_PX = GRID_SIZE * CELL_PX;

/**
 * Tạo "ảnh mèo" bằng pattern có cấu trúc: hai mắt, mũi, tai, râu.
 * Mục tiêu không phải là ảnh thực — mà là một bản đồ pixel có hình dáng
 * nhận ra được, đủ để minh hoạ lớp nhiễu epsilon.
 */
function buildCatPixels(): number[][] {
  const g = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => 0.88),
  );

  // Nền mặt mèo (vùng tròn mờ)
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const dx = x - 7.5;
      const dy = y - 8.5;
      const r = Math.sqrt(dx * dx + dy * dy);
      if (r < 6.2) g[y][x] = 0.62;
      if (r < 4.8) g[y][x] = 0.48;
    }
  }

  // Tai trái và phải (tam giác nhọn)
  for (let y = 0; y < 5; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      if (x >= 2 && x <= 4 && y <= 4 - (x - 2)) g[y][x] = 0.32;
      if (x >= 11 && x <= 13 && y <= x - 11) g[y][x] = 0.32;
    }
  }

  // Mắt (hai ô tối hơn)
  g[7][5] = 0.08;
  g[7][6] = 0.1;
  g[7][10] = 0.08;
  g[7][11] = 0.1;
  g[8][5] = 0.18;
  g[8][10] = 0.18;

  // Mũi tam giác
  g[9][8] = 0.22;
  g[10][7] = 0.28;
  g[10][8] = 0.2;
  g[10][9] = 0.28;

  // Miệng nhỏ
  g[11][7] = 0.4;
  g[11][8] = 0.38;
  g[11][9] = 0.4;

  // Râu (hai vệt sáng)
  g[10][3] = 0.6;
  g[10][4] = 0.56;
  g[10][11] = 0.56;
  g[10][12] = 0.6;

  return g;
}

/**
 * Giả lập "sign of gradient" — một ma trận tiền tính đủ hỗn tạp để trông
 * giống adversarial perturbation thật khi nhân với epsilon.
 */
function buildSignGradient(): number[][] {
  const g = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => 0),
  );
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      // Pattern giả xoắn — không đều, có dấu dương và âm
      const v =
        Math.sin(x * 0.9 + y * 1.1) +
        Math.cos((x + y) * 0.7) +
        Math.sin(x * 1.3) * 0.5;
      g[y][x] = v > 0 ? 1 : -1;
    }
  }
  return g;
}

const CAT_PIXELS = buildCatPixels();
const SIGN_GRAD = buildSignGradient();

/**
 * Dự đoán mô phỏng:
 *   - epsilon rất nhỏ: vẫn "cat" nhưng confidence giảm
 *   - epsilon trung bình: lật sang "dog"
 *   - epsilon lớn: tự tin sai "dog"/"plane"
 *   - adversarial training bật: biên quyết định rộng hơn,
 *     cần epsilon lớn hơn nhiều mới lật
 */
function predict(
  epsilon: number,
  adversarialTraining: boolean,
): { label: string; confidence: number; correct: boolean; color: string } {
  const flipEps = adversarialTraining ? 0.22 : 0.035;
  const confidentWrongEps = adversarialTraining ? 0.28 : 0.08;

  if (epsilon < flipEps) {
    const confidence = Math.max(60, 95 - Math.round((epsilon / flipEps) * 30));
    return {
      label: "Mèo",
      confidence,
      correct: true,
      color: "#22c55e",
    };
  }
  if (epsilon < confidentWrongEps) {
    const confidence = 60 + Math.round(((epsilon - flipEps) / (confidentWrongEps - flipEps)) * 20);
    return {
      label: "Chó",
      confidence,
      correct: false,
      color: "#ef4444",
    };
  }
  const confidence = Math.min(
    95,
    82 + Math.round((epsilon - confidentWrongEps) * 40),
  );
  return {
    label: adversarialTraining ? "Chó" : "Máy bay",
    confidence,
    correct: false,
    color: "#ef4444",
  };
}

// ---------------------------------------------------------------------------
// Quiz — 8 câu hỏi theo yêu cầu
// ---------------------------------------------------------------------------

const QUIZ: QuizQuestion[] = [
  {
    question: "FGSM (Fast Gradient Sign Method) tạo nhiễu đối kháng bằng cách nào?",
    options: [
      "Thêm nhiễu ngẫu nhiên (Gaussian) vào ảnh rồi thử cho đến khi lừa được mô hình",
      "Tính gradient của loss theo input, rồi thêm nhiễu theo HƯỚNG tăng loss nhiều nhất",
      "Thay đổi từng pixel một cho đến khi mô hình sai",
      "Xoay, cắt, lật ảnh để làm augmentation ngược",
    ],
    correct: 1,
    explanation:
      "FGSM dùng gradient ĐỐI VỚI INPUT (không phải weights). Gradient chỉ ra hướng thay đổi input khiến loss tăng nhiều nhất → thêm nhiễu nhỏ epsilon theo hướng đó. Chỉ cần MỘT bước forward + backward = tấn công cực nhanh, gần như miễn phí so với training.",
  },
  {
    question:
      "Camera an ninh tại sân bay Nội Bài dùng AI nhận dạng khuôn mặt. Kẻ xấu đeo kính có hoạ tiết đặc biệt khiến AI không nhận ra. Đây là loại tấn công gì?",
    options: [
      "Jailbreak — lừa AI bằng prompt văn bản",
      "Physical adversarial attack — adversarial perturbation trong thế giới vật lý (kính, sticker, áo)",
      "Prompt injection — chèn lệnh ẩn vào đầu vào",
      "Data poisoning — tiêm dữ liệu độc vào training set",
    ],
    correct: 1,
    explanation:
      "Đây là physical adversarial attack: adversarial perturbation được in ra vật thể thật (kính, áo, sticker). Nguy hiểm hơn digital attack vì hoạt động trong thế giới thực — ảnh hưởng xe tự lái, camera an ninh, nhận dạng khuôn mặt, và không cần truy cập hệ thống.",
  },
  {
    question: "Adversarial training (huấn luyện đối kháng) cải thiện robustness bằng cách nào?",
    options: [
      "Loại bỏ tất cả ảnh có nhiễu khỏi training set",
      "Tạo adversarial examples và ĐƯA VÀO training set, buộc mô hình học cách nhận dạng đúng dù có nhiễu",
      "Tăng kích thước mô hình để có nhiều tham số hơn",
      "Dùng dropout nhiều hơn để ép mô hình tổng quát hoá",
    ],
    correct: 1,
    explanation:
      "Adversarial training: mỗi batch, tạo adversarial examples bằng FGSM/PGD, rồi train mô hình trên CẢ ảnh gốc VÀ ảnh adversarial. Mô hình 'miễn dịch' dần với nhiễu đối kháng. Trade-off: accuracy trên dữ liệu sạch có thể giảm nhẹ 1-3%.",
  },
  {
    type: "fill-blank",
    question:
      "Một {blank} example được tạo bằng cách thêm {blank} nhỏ (mắt thường không thấy) vào input theo hướng gradient của loss.",
    blanks: [
      { answer: "adversarial", accept: ["đối kháng"] },
      { answer: "perturbation", accept: ["nhiễu", "noise"] },
    ],
    explanation:
      "Adversarial example = input gốc cộng thêm perturbation nhỏ theo sign của gradient — đủ để lừa mô hình nhưng không thay đổi nhận thức của con người.",
  },
  {
    question: "PGD (Projected Gradient Descent) mạnh hơn FGSM vì sao?",
    options: [
      "PGD dùng nhiều GPU hơn",
      "PGD chạy nhiều bước gradient nhỏ rồi chiếu về epsilon-ball, tìm được adversarial mạnh hơn 1 bước FGSM",
      "PGD thay đổi cả nhãn lẫn ảnh",
      "PGD không cần gradient",
    ],
    correct: 1,
    explanation:
      "FGSM = 1 bước lớn, PGD = K bước nhỏ + chiếu (projection) về hộp epsilon sau mỗi bước. Nhiều bước cho phép đi theo quỹ đạo phi tuyến, tìm điểm adversarial mạnh nhất trong epsilon-ball. PGD là chuẩn vàng để đánh giá robustness.",
  },
  {
    question: "Certified defense khác adversarial training chỗ nào?",
    options: [
      "Certified defense đắt hơn",
      "Certified defense cho bảo đảm TOÁN HỌC: trong bán kính epsilon, dự đoán không đổi; adversarial training chỉ kinh nghiệm",
      "Adversarial training mạnh hơn mọi mặt",
      "Cả hai giống nhau",
    ],
    correct: 1,
    explanation:
      "Certified defense (Randomized Smoothing, IBP) chứng minh bằng toán: với mọi nhiễu |δ| ≤ ε, output không đổi. Adversarial training chỉ mạnh với attack đã thấy — có thể thua adaptive attack mới. Trade-off: certified chậm hơn và thường có bound lỏng.",
  },
  {
    question: "Tại sao dự đoán đúng với accuracy 99% trên test set chưa đủ để coi là an toàn?",
    options: [
      "Test set quá nhỏ",
      "Test set là dữ liệu tự nhiên; adversarial examples được thiết kế theo gradient nằm NGOÀI phân phối tự nhiên, có thể lừa 100% mô hình",
      "99% là quá thấp",
      "Test set luôn có noise",
    ],
    correct: 1,
    explanation:
      "Clean accuracy đo trên phân phối tự nhiên. Adversarial examples không lấy mẫu từ phân phối tự nhiên — chúng được tối ưu để lừa mô hình. Một mô hình 99% accuracy có thể rớt còn 0-5% dưới PGD attack. An toàn thực sự cần đo adversarial accuracy.",
  },
  {
    question:
      "Xe tự lái tại Việt Nam phải nhận diện biển báo. Biện pháp phòng thủ TỐT NHẤT là gì?",
    options: [
      "Chỉ dùng ảnh sạch để train",
      "Kết hợp nhiều lớp: adversarial training + input preprocessing + ensemble + fallback qua bản đồ/GPS khi độ tin cậy thấp",
      "Thay camera bằng LiDAR thuần",
      "Xoá mọi biển báo khỏi dữ liệu",
    ],
    correct: 1,
    explanation:
      "Defense in depth: không có biện pháp đơn lẻ nào đủ. Nhiều lớp độc lập (adversarial training trong mô hình + preprocessing bên ngoài + ensemble nhiều mô hình + fallback sang cảm biến khác khi confidence thấp) làm kẻ tấn công phải xuyên qua tất cả — chi phí tăng theo cấp số nhân.",
  },
];

// ---------------------------------------------------------------------------
// Component phụ — lưới pixel với overlay perturbation
// ---------------------------------------------------------------------------

interface PixelGridProps {
  pixels: number[][];
  perturbation?: number[][];
  epsilon: number;
  label: string;
  highlight?: string;
}

function PixelGrid({
  pixels,
  perturbation,
  epsilon,
  label,
  highlight,
}: PixelGridProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="rounded-lg border border-border overflow-hidden"
        style={{
          width: CANVAS_PX,
          height: CANVAS_PX,
          display: "grid",
          gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_PX}px)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_PX}px)`,
        }}
      >
        {pixels.flatMap((row, y) =>
          row.map((v, x) => {
            const p = perturbation?.[y]?.[x] ?? 0;
            const adjusted = Math.max(0, Math.min(1, v + p * epsilon));
            const gray = Math.round(adjusted * 255);
            // Nếu có perturbation áp dụng, chuyển sắc hồng theo cường độ
            const pink = perturbation && epsilon > 0 ? Math.abs(p * epsilon) * 2.4 : 0;
            const r = Math.min(255, gray + Math.round(pink * 180));
            const g = Math.max(0, gray - Math.round(pink * 40));
            const b = Math.min(255, gray + Math.round(pink * 80));
            return (
              <div
                key={`${x}-${y}`}
                style={{
                  backgroundColor: `rgb(${r},${g},${b})`,
                }}
              />
            );
          }),
        )}
      </div>
      <div className="text-xs font-semibold text-foreground">{label}</div>
      {highlight ? (
        <div className="text-[11px] text-muted">{highlight}</div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component phụ — ô hiển thị dự đoán
// ---------------------------------------------------------------------------

interface PredictionCardProps {
  label: string;
  confidence: number;
  color: string;
  correct: boolean;
}

function PredictionCard({
  label,
  confidence,
  color,
  correct,
}: PredictionCardProps) {
  return (
    <div
      className="rounded-xl border px-4 py-3 w-full max-w-[220px]"
      style={{ borderColor: color, background: `${color}18` }}
    >
      <div className="text-[11px] uppercase tracking-wide text-muted mb-1">
        Dự đoán mô hình
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className="text-lg font-bold"
          style={{ color }}
        >
          {label}
        </span>
        <span className="text-sm text-foreground">({confidence}%)</span>
      </div>
      <div className="text-[11px] mt-1" style={{ color }}>
        {correct ? "Đúng" : "SAI — mô hình bị lừa"}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AdversarialRobustnessTopic() {
  const [epsilon, setEpsilon] = useState(0);
  const [advTraining, setAdvTraining] = useState(false);

  const prediction = useMemo(
    () => predict(epsilon, advTraining),
    [epsilon, advTraining],
  );

  const handleEpsilon = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEpsilon(Number(e.target.value));
  }, []);

  const handleToggleAdv = useCallback(() => {
    setAdvTraining((v) => !v);
  }, []);

  const handleReset = useCallback(() => {
    setEpsilon(0);
  }, []);

  const epsilonDisplay = epsilon.toFixed(3);

  // Cảnh báo động cho người học
  const attackStatus = useMemo(() => {
    if (epsilon === 0) return "Chưa có nhiễu — mô hình nhìn ảnh gốc.";
    if (prediction.correct) {
      return advTraining
        ? "Adversarial training đang hoạt động — mô hình vẫn giữ dự đoán đúng dù có nhiễu."
        : "Nhiễu còn rất nhỏ — mô hình chưa bị ảnh hưởng.";
    }
    if (prediction.confidence < 75) {
      return "Mô hình đã bị lật sang nhãn sai — đây là ranh giới nguy hiểm.";
    }
    return "Mô hình bị lừa HOÀN TOÀN — tự tin cao vào nhãn sai.";
  }, [epsilon, prediction, advTraining]);

  return (
    <>
      {/* --------------------------------------------------------------- */}
      {/* Bước 1 — Dự đoán                                                */}
      {/* --------------------------------------------------------------- */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <div className="mb-4">
          <ProgressSteps current={1} total={TOTAL_STEPS} />
        </div>
        <PredictionGate
          question="Bạn thêm nhiễu CỰC NHỎ (mắt người không thấy) vào ảnh con mèo. AI nhận dạng sẽ thế nào?"
          options={[
            "Vẫn nhận ra mèo — nhiễu nhỏ thì ảnh hưởng nhỏ, đây là tính chất trơn của mạng neural",
            "CÓ THỂ nhận nhầm hoàn toàn thành vật khác — đây là adversarial attack, nhiễu nhỏ nhưng được thiết kế theo gradient để lừa AI",
            "AI sẽ báo 'không biết' vì phát hiện ra nhiễu bất thường trong đầu vào",
          ]}
          correct={1}
          explanation="Nghe khó tin nhưng đúng! Adversarial perturbation nhỏ đến mức mắt người KHÔNG THỂ phân biệt, nhưng được thiết kế theo gradient để đẩy dự đoán lệch HOÀN TOÀN. Ảnh con mèo có thể bị nhận thành máy bay, chó, hoặc bất cứ gì kẻ tấn công muốn — và mô hình vẫn tự tin cao vào câu trả lời sai!"
        />
      </LessonSection>

      {/* --------------------------------------------------------------- */}
      {/* Bước 2 — FGSM Simulator (16×16 grid)                            */}
      {/* --------------------------------------------------------------- */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Mô phỏng FGSM">
        <div className="mb-4">
          <ProgressSteps current={2} total={TOTAL_STEPS} />
        </div>
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Dưới đây là lưới pixel <strong>16×16</strong> mô phỏng ảnh con mèo.
          Kéo thanh trượt để tăng epsilon (biên độ nhiễu). Ba ô: ảnh gốc,
          nhiễu đối kháng (hồng = dấu dương, xanh = dấu âm), và ảnh cuối
          cùng mà mô hình nhìn thấy.
        </p>

        <VisualizationSection>
          <div className="space-y-6">
            {/* Hàng lưới: gốc → nhiễu → adversarial */}
            <div className="flex flex-col items-center gap-6">
              <div className="flex flex-wrap items-center justify-center gap-6">
                <PixelGrid
                  pixels={CAT_PIXELS}
                  epsilon={0}
                  label="Ảnh gốc x"
                  highlight="Mèo (95%)"
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: epsilon > 0 ? 1 : 0.35, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div
                    className="rounded-lg border border-border overflow-hidden"
                    style={{
                      width: CANVAS_PX,
                      height: CANVAS_PX,
                      display: "grid",
                      gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_PX}px)`,
                      gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_PX}px)`,
                    }}
                  >
                    {SIGN_GRAD.flatMap((row, y) =>
                      row.map((s, x) => {
                        const intensity = Math.abs(s) * epsilon * 3.2;
                        const r = s > 0 ? Math.round(180 * intensity + 40) : 40;
                        const b = s < 0 ? Math.round(180 * intensity + 40) : 40;
                        const g = 40;
                        return (
                          <div
                            key={`p-${x}-${y}`}
                            style={{
                              backgroundColor:
                                epsilon === 0
                                  ? "#0f172a"
                                  : `rgb(${r},${g},${b})`,
                            }}
                          />
                        );
                      }),
                    )}
                  </div>
                  <div className="text-xs font-semibold text-foreground">
                    Nhiễu ε · sign(∇L)
                  </div>
                  <div className="text-[11px] text-muted">
                    ε = {epsilonDisplay}
                  </div>
                </motion.div>

                <PixelGrid
                  pixels={CAT_PIXELS}
                  perturbation={SIGN_GRAD}
                  epsilon={epsilon}
                  label="Ảnh adversarial x′"
                  highlight={`${prediction.label} (${prediction.confidence}%)`}
                />
              </div>

              <PredictionCard
                label={prediction.label}
                confidence={prediction.confidence}
                color={prediction.color}
                correct={prediction.correct}
              />
            </div>

            {/* Controls */}
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-foreground">
                    Epsilon (ε) — biên độ nhiễu
                  </label>
                  <span className="text-sm font-mono text-accent">
                    {epsilonDisplay}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={0.3}
                  step={0.005}
                  value={epsilon}
                  onChange={handleEpsilon}
                  className="w-full accent-accent"
                />
                <div className="flex justify-between text-[10px] text-muted mt-1">
                  <span>0 (sạch)</span>
                  <span>0.015 (không nhìn thấy)</span>
                  <span>0.1</span>
                  <span>0.3 (rõ)</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleToggleAdv}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors border ${
                    advTraining
                      ? "bg-accent text-white border-accent"
                      : "bg-card text-foreground border-border hover:border-accent"
                  }`}
                >
                  {advTraining ? "✓ Adversarial Training BẬT" : "Adversarial Training TẮT"}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-lg px-4 py-2 text-sm font-semibold bg-card text-muted border border-border hover:text-foreground"
                >
                  Reset ε = 0
                </button>
              </div>

              {/* Dải cảnh báo động */}
              <motion.div
                key={attackStatus}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`rounded-lg border px-4 py-3 text-sm ${
                  prediction.correct
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
                    : "border-red-500/40 bg-red-500/10 text-red-900 dark:text-red-200"
                }`}
              >
                {attackStatus}
              </motion.div>

              {/* Diễn giải */}
              <div className="rounded-lg bg-background/50 border border-border p-3 text-sm text-foreground">
                <p className="mb-1">
                  <strong>Công thức:</strong>{" "}
                  <LaTeX>{"x' = x + \\epsilon \\cdot \\text{sign}(\\nabla_x \\mathcal{L})"}</LaTeX>
                </p>
                <p className="text-muted text-[13px]">
                  Nhiễu đối kháng được cộng vào ảnh gốc. Khi ε ≈ 0.01, mắt
                  người hoàn toàn không phân biệt được x và x′, nhưng mô
                  hình không có adversarial training thường đã bắt đầu lật
                  nhãn từ ε ≈ 0.035.
                </p>
              </div>
            </div>
          </div>
        </VisualizationSection>

        <div className="mt-4 grid md:grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-card p-3 text-[13px]">
            <div className="font-semibold text-foreground mb-1">
              Thử nghiệm 1
            </div>
            <p className="text-muted">
              Giữ adversarial training <strong>TẮT</strong>, tăng ε dần. Ghi
              nhận ε nhỏ nhất làm mô hình lật nhãn.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 text-[13px]">
            <div className="font-semibold text-foreground mb-1">
              Thử nghiệm 2
            </div>
            <p className="text-muted">
              <strong>BẬT</strong> adversarial training, lặp lại. So sánh
              ngưỡng lật nhãn — mô hình đã bền vững hơn bao nhiêu lần?
            </p>
          </div>
        </div>
      </LessonSection>

      {/* --------------------------------------------------------------- */}
      {/* Bước 3 — Khoảnh khắc A-ha                                       */}
      {/* --------------------------------------------------------------- */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <div className="mb-4">
          <ProgressSteps current={3} total={TOTAL_STEPS} />
        </div>
        <AhaMoment>
          Adversarial attack không phải <strong>thêm nhiễu ngẫu nhiên</strong>
          {" "}— nó là <strong>nhiễu được thiết kế có mục đích</strong> dựa
          trên gradient. AI nhìn theo hàng nghìn chiều trong không gian
          feature — nhiễu nhỏ ở <em>mỗi</em> chiều cộng lại đủ để đẩy
          quyết định <strong>vượt qua ranh giới phân loại</strong>. Với
          người, ảnh không đổi; với mô hình, feature vector đã dịch
          chuyển xa.
        </AhaMoment>
      </LessonSection>

      {/* --------------------------------------------------------------- */}
      {/* Bước 4 — Callout #1: FGSM Gradient                              */}
      {/* --------------------------------------------------------------- */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Hiểu FGSM">
        <div className="mb-4">
          <ProgressSteps current={4} total={TOTAL_STEPS} />
        </div>

        <Callout variant="insight" title="FGSM — Tấn công một bước gần như miễn phí">
          <p className="mb-2">
            Fast Gradient Sign Method (Goodfellow et al., 2014) là attack đơn
            giản nhất nhưng vẫn rất hiệu quả:
          </p>
          <LaTeX block>
            {"x_{\\text{adv}} = x + \\epsilon \\cdot \\text{sign}(\\nabla_x \\mathcal{L}(\\theta, x, y))"}
          </LaTeX>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
            <li>
              Gradient được tính theo <strong>input</strong> (không phải theo
              weights) — cùng engine autograd đã có trong PyTorch.
            </li>
            <li>
              <code>sign()</code> chỉ giữ dấu — mỗi pixel thay đổi đúng ±ε,
              tối ưu hoá tăng loss dưới ràng buộc L∞.
            </li>
            <li>
              Chi phí: 1 forward + 1 backward — rẻ hơn 1 epoch training
              vài triệu lần.
            </li>
          </ul>
        </Callout>

        <div className="mt-4">
          <CollapsibleDetail title="Vì sao 'sign' thay vì gradient đầy đủ?">
            <div className="space-y-2 text-sm text-foreground">
              <p>
                Nếu dùng gradient đầy đủ, nhiễu ở pixel có gradient lớn sẽ
                rất rõ (nhìn thấy được), còn pixel gradient nhỏ gần như
                không đổi. <code>sign()</code> chuẩn hoá tất cả về ±1 —
                mọi pixel đóng góp đều nhau, nhiễu phân bố đều và khó phát
                hiện hơn.
              </p>
              <p>
                Về mặt tối ưu hoá: <code>sign(∇)</code> là nghiệm chính xác
                của bài toán cực đại hoá linear approximation của loss
                dưới ràng buộc L∞. Đó là lý do FGSM là attack L∞ "tự nhiên"
                nhất.
              </p>
              <p>
                Nếu đổi sang L2 ball, ta dùng gradient đã chuẩn hoá L2 thay
                vì <code>sign</code>. Họ tấn công rộng lớn (FGM, PGD-L2,
                CW-L2) xoay quanh lựa chọn norm này.
              </p>
            </div>
          </CollapsibleDetail>
        </div>
      </LessonSection>

      {/* --------------------------------------------------------------- */}
      {/* Bước 5 — Thử thách nhanh #1                                     */}
      {/* --------------------------------------------------------------- */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <div className="mb-4">
          <ProgressSteps current={5} total={TOTAL_STEPS} />
        </div>
        <InlineChallenge
          question="Xe tự lái dùng camera nhận dạng biển báo giao thông. Kẻ xấu dán sticker nhỏ lên biển 'DỪNG LẠI' khiến AI đọc thành 'Tốc độ 120 km/h'. Hậu quả nguy hiểm nhất là gì?"
          options={[
            "Xe chạy nhanh hơn một chút — không nguy hiểm",
            "Xe KHÔNG DỪNG tại nơi phải dừng — có thể gây tai nạn chết người. Physical adversarial attack cực kỳ nguy hiểm!",
            "Camera sẽ phát hiện sticker bất thường và cảnh báo cho lái xe",
            "Xe sẽ chuyển sang dùng GPS thay camera nên không ảnh hưởng",
          ]}
          correct={1}
          explanation="Đây là ví dụ kinh điển về physical adversarial attack: sticker nhỏ (mắt người vẫn đọc được 'DỪNG LẠI') nhưng AI đọc sai hoàn toàn. Đây là lý do adversarial robustness là BẮT BUỘC cho AI safety-critical: xe tự lái, y tế, an ninh. Eykholt et al. (2018) đã chứng minh attack này hoạt động ngoài đời thực."
        />
      </LessonSection>

      {/* --------------------------------------------------------------- */}
      {/* Bước 6 — Lý thuyết đầy đủ                                       */}
      {/* --------------------------------------------------------------- */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <div className="mb-4">
          <ProgressSteps current={6} total={TOTAL_STEPS} />
        </div>

        <ExplanationSection topicSlug={metadata.slug}>
          <p>
            <strong>Adversarial Robustness</strong> là khả năng AI duy trì
            dự đoán chính xác khi đầu vào bị thao túng có chủ đích. Khái
            niệm liên quan chặt chẽ tới{" "}
            <TopicLink slug="red-teaming">red-teaming</TopicLink>{" "}
            (tìm lỗ hổng chủ động) và{" "}
            <TopicLink slug="guardrails">guardrails</TopicLink>{" "}
            (hàng rào bảo vệ đầu ra), và là một mảnh ghép trung tâm của{" "}
            <TopicLink slug="alignment">alignment</TopicLink>.
          </p>

          <Callout variant="info" title="Ba họ tấn công phổ biến nhất">
            <div className="space-y-2">
              <p>
                <strong>1. FGSM — Fast Gradient Sign Method:</strong> 1 bước
                ±ε theo sign của gradient. Nhanh nhất, làm baseline.
              </p>
              <p>
                <strong>2. PGD — Projected Gradient Descent:</strong> K bước
                nhỏ + chiếu về epsilon-ball sau mỗi bước. Mạnh hơn FGSM
                nhiều, được coi là "strongest first-order attack".
              </p>
              <p>
                <strong>3. CW — Carlini & Wagner:</strong> optimization-based,
                min hoá nhiễu sao cho dự đoán đổi. Tạo nhiễu nhỏ hơn nữa
                nhưng tốn nhiều bước optimizer (khó phát hiện nhất).
              </p>
            </div>
          </Callout>

          <p className="mt-4">
            Phương trình PGD nhìn như FGSM lặp lại:
          </p>
          <LaTeX block>
            {"x^{t+1} = \\Pi_{\\mathcal{B}(x, \\epsilon)}\\left(x^t + \\alpha \\cdot \\text{sign}(\\nabla_x \\mathcal{L}(\\theta, x^t, y))\\right)"}
          </LaTeX>
          <p className="text-sm text-muted">
            <LaTeX>{"\\Pi_{\\mathcal{B}}"}</LaTeX> là phép chiếu về
            epsilon-ball quanh x; <LaTeX>{"\\alpha"}</LaTeX> là step size
            (thường ε/10); sau K bước, nhiễu không vượt quá ε.
          </p>

          <Callout variant="info" title="Ba phương pháp phòng thủ chính">
            <div className="space-y-2">
              <p>
                <strong>1. Adversarial Training (AT):</strong> Tạo
                adversarial examples mỗi batch, train trên cả dữ liệu gốc
                + adversarial. Hiệu quả nhất nhưng tốn 3-10x thời gian
                training. Madry et al. (2018) là tham chiếu chuẩn.
              </p>
              <p>
                <strong>2. Certified Defense:</strong> Chứng minh toán học
                rằng dự đoán không đổi trong phạm vi epsilon. Ví dụ:{" "}
                <em>Randomized Smoothing</em> (Cohen et al., 2019),{" "}
                <em>Interval Bound Propagation</em>.
              </p>
              <p>
                <strong>3. Input Preprocessing:</strong> Lọc / biến đổi
                input trước khi đến mô hình: JPEG compression, spatial
                smoothing, feature squeezing. Rẻ nhưng dễ bị bypass bằng
                adaptive attack.
              </p>
            </div>
          </Callout>

          <h3 className="text-base font-semibold text-foreground mt-5 mb-2">
            Min-max formulation của adversarial training
          </h3>
          <p>
            Adversarial training giải bài toán hai cấp:
          </p>
          <LaTeX block>
            {"\\min_{\\theta} \\; \\mathbb{E}_{(x,y)}\\left[\\max_{\\|\\delta\\|_\\infty \\le \\epsilon} \\mathcal{L}(\\theta, x+\\delta, y)\\right]"}
          </LaTeX>
          <p className="text-sm text-muted">
            Vòng trong (max) là attack — tìm nhiễu tồi tệ nhất. Vòng
            ngoài (min) là training — cập nhật trọng số để robust với
            nhiễu đó. Xấp xỉ vòng trong bằng PGD K-bước → được gọi là{" "}
            <em>PGD adversarial training</em>.
          </p>

          <CodeBlock language="python" title="fgsm_pgd_with_cleverhans.py">
{`"""Adversarial attacks & training — PyTorch + CleverHans.

CleverHans (https://github.com/cleverhans-lab/cleverhans) là thư viện
chuẩn cho adversarial ML. Ở đây ta kết hợp CleverHans cho attack +
PyTorch training loop cho defense.
"""
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader
from cleverhans.torch.attacks.fast_gradient_method import fast_gradient_method
from cleverhans.torch.attacks.projected_gradient_descent import projected_gradient_descent


# ---------------------------------------------------------------------
# 1. Attacks
# ---------------------------------------------------------------------

def fgsm_attack(model: nn.Module, x: torch.Tensor, y: torch.Tensor, eps: float = 0.03):
    """1 bước FGSM — rẻ, hữu ích làm baseline."""
    model.eval()
    # CleverHans API: fast_gradient_method(model, x, eps, norm, ...)
    x_adv = fast_gradient_method(
        model_fn=model,
        x=x,
        eps=eps,
        norm=float("inf"),
        y=y,
        targeted=False,
    )
    return x_adv.detach()


def pgd_attack(model: nn.Module, x: torch.Tensor, y: torch.Tensor,
               eps: float = 0.03, alpha: float = 0.007, steps: int = 10):
    """PGD-K — attack chuẩn để đo robustness."""
    model.eval()
    x_adv = projected_gradient_descent(
        model_fn=model,
        x=x,
        eps=eps,
        eps_iter=alpha,
        nb_iter=steps,
        norm=float("inf"),
        y=y,
        targeted=False,
        rand_init=True,       # khởi tạo ngẫu nhiên trong ball → mạnh hơn
        sanitize=True,
    )
    return x_adv.detach()


# ---------------------------------------------------------------------
# 2. Adversarial training loop (Madry-style)
# ---------------------------------------------------------------------

def train_robust(
    model: nn.Module,
    loader: DataLoader,
    optimizer: torch.optim.Optimizer,
    device: torch.device,
    eps: float = 0.03,
    steps: int = 7,
    clean_weight: float = 0.5,
):
    model.train()
    for x, y in loader:
        x, y = x.to(device), y.to(device)

        # (a) Sinh adversarial batch — mỗi step train đều có attack mới
        x_adv = pgd_attack(model, x, y, eps=eps, alpha=eps/4, steps=steps)
        model.train()  # pgd_attack gọi model.eval()

        # (b) Loss kết hợp clean + adversarial
        logits_clean = model(x)
        logits_adv = model(x_adv)
        loss = (
            clean_weight * F.cross_entropy(logits_clean, y)
            + (1 - clean_weight) * F.cross_entropy(logits_adv, y)
        )

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()


# ---------------------------------------------------------------------
# 3. Đánh giá robustness
# ---------------------------------------------------------------------

@torch.no_grad()
def clean_accuracy(model, loader, device):
    model.eval()
    correct, total = 0, 0
    for x, y in loader:
        x, y = x.to(device), y.to(device)
        correct += (model(x).argmax(1) == y).sum().item()
        total += y.size(0)
    return correct / total


def pgd_accuracy(model, loader, device, eps=0.03, steps=20):
    """Robust accuracy — dùng PGD mạnh (nhiều bước) để đánh giá."""
    model.eval()
    correct, total = 0, 0
    for x, y in loader:
        x, y = x.to(device), y.to(device)
        x_adv = pgd_attack(model, x, y, eps=eps, alpha=eps/10, steps=steps)
        with torch.no_grad():
            correct += (model(x_adv).argmax(1) == y).sum().item()
        total += y.size(0)
    return correct / total


# Thông thường: clean_acc giảm 1-3%, robust_acc tăng từ ~0% → 45-60%.
`}
          </CodeBlock>

          <Callout variant="warning" title="Physical adversarial attacks tại Việt Nam">
            <div className="space-y-1">
              <p>
                Camera giao thông AI (Hà Nội, TP.HCM) có thể bị lừa bằng
                hoạ tiết dán trên biển số xe.
              </p>
              <p>
                AI nhận dạng khuôn mặt tại sân bay có thể bị đánh bại bằng
                kính hoa văn đặc biệt (Sharif et al., 2016).
              </p>
              <p>
                Chatbot tiếng Việt có thể bị ép sai qua homoglyph (thay
                chữ Latin bằng chữ Cyrillic trông giống) — adversarial
                attack cho NLP.
              </p>
              <p>
                Cần kết hợp adversarial training, ensemble, và kiểm định
                bên ngoài cho mọi AI safety-critical.
              </p>
            </div>
          </Callout>

          <h3 className="text-base font-semibold text-foreground mt-5 mb-2">
            Demo tấn công với CleverHans — chạy được ngay
          </h3>
          <p>
            Đoạn code dưới đây là demo tối thiểu: tải một mô hình CNN đã
            train, tấn công bằng FGSM + PGD từ CleverHans, và đo accuracy
            trước/sau.
          </p>
          <CodeBlock language="python" title="demo_cleverhans_attack.py">
{`"""Demo: Tấn công một mô hình CIFAR-10 đã train bằng CleverHans.

Chạy: python demo_cleverhans_attack.py
Kết quả mong đợi: clean_acc ≈ 0.92, fgsm_acc ≈ 0.15, pgd_acc ≈ 0.02
                  (nếu mô hình KHÔNG được adversarial training)
"""
import torch
import torchvision as tv
from cleverhans.torch.attacks.fast_gradient_method import fast_gradient_method
from cleverhans.torch.attacks.projected_gradient_descent import projected_gradient_descent

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# 1. Tải CIFAR-10 test set
mean = torch.tensor([0.4914, 0.4822, 0.4465])
std = torch.tensor([0.2470, 0.2435, 0.2616])
transform = tv.transforms.Compose([
    tv.transforms.ToTensor(),
    tv.transforms.Normalize(mean, std),
])
testset = tv.datasets.CIFAR10(root="./data", train=False, download=True, transform=transform)
loader = torch.utils.data.DataLoader(testset, batch_size=128, shuffle=False)

# 2. Tải mô hình — ví dụ ResNet-18 từ torchvision hub
model = torch.hub.load("chenyaofo/pytorch-cifar-models",
                       "cifar10_resnet20", pretrained=True).to(device)
model.eval()

# 3. Hàm đánh giá
def eval_attack(attack_fn, name: str):
    correct, total = 0, 0
    for x, y in loader:
        x, y = x.to(device), y.to(device)
        x_adv = attack_fn(x, y) if attack_fn is not None else x
        with torch.no_grad():
            pred = model(x_adv).argmax(1)
        correct += (pred == y).sum().item()
        total += y.size(0)
    acc = correct / total
    print(f"{name:>10s}  accuracy = {acc:.4f}")
    return acc

# 4. Clean
eval_attack(None, "clean")

# 5. FGSM — 1 bước
eval_attack(
    lambda x, y: fast_gradient_method(model, x, 8/255, float("inf"), y=y),
    "FGSM",
)

# 6. PGD-20 — chuẩn công bố
eval_attack(
    lambda x, y: projected_gradient_descent(
        model, x,
        eps=8/255, eps_iter=2/255, nb_iter=20,
        norm=float("inf"), y=y, rand_init=True,
    ),
    "PGD-20",
)

# 7. AutoAttack (nếu cài autoattack pip package)
# from autoattack import AutoAttack
# aa = AutoAttack(model, norm="Linf", eps=8/255, version="standard")
# x_adv = aa.run_standard_evaluation(x, y)
`}
          </CodeBlock>

          <h3 className="text-base font-semibold text-foreground mt-5 mb-2">
            White-box, Black-box, Gray-box — ba mô hình mối đe doạ
          </h3>
          <p>
            Khi đánh giá robustness, ta phân loại theo mức quyền truy cập
            của kẻ tấn công:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-foreground">
            <li>
              <strong>White-box:</strong> kẻ tấn công biết toàn bộ kiến
              trúc, trọng số, và gradient. FGSM / PGD / CW đều là
              white-box. Kịch bản tệ nhất — dùng để đánh giá upper bound.
            </li>
            <li>
              <strong>Black-box:</strong> chỉ truy vấn qua API, không
              biết nội tại mô hình. Dùng Square Attack, NES, transfer
              attack. Thực tế hơn nhưng vẫn hiệu quả đáng sợ.
            </li>
            <li>
              <strong>Gray-box:</strong> biết kiến trúc nhưng không biết
              trọng số, hoặc có query limit. Tấn công qua transferability:
              train surrogate model, attack surrogate, transfer lên target.
            </li>
          </ul>

          <p className="mt-4">
            Transferability là hiện tượng đáng lo ngại: adversarial
            examples tạo cho mô hình A thường lừa được cả mô hình B có
            kiến trúc khác. Đây là lý do ensemble đơn thuần không đủ —
            cần ensemble <em>đa dạng</em> (khác kiến trúc, khác data
            augmentation, khác training objective).
          </p>

          <div className="mt-4">
            <CollapsibleDetail title="Bài toán 'obfuscated gradients' và vì sao nhiều defense bị phá">
              <div className="space-y-2 text-sm text-foreground">
                <p>
                  Athalye et al. (2018) đã phân tích 9 defense tại ICLR 2018
                  và phá 7 trong số đó. Nguyên nhân chung: các defense làm
                  gradient <em>khó tính</em> (shattered, stochastic,
                  vanishing) khiến white-box attack trông như thất bại —
                  nhưng adaptive attack (BPDA, EOT) vượt qua được.
                </p>
                <p>
                  Bài học: khi báo cáo robust accuracy, phải dùng{" "}
                  <em>adaptive attack</em> — attack biết defense là gì và
                  tuỳ biến theo nó. Chuẩn đánh giá hiện tại: AutoAttack
                  (Croce & Hein, 2020) — ensemble 4 attack mạnh.
                </p>
                <p>
                  Nếu defense của bạn chỉ đánh giá với FGSM default, con
                  số có thể sai đến 50%. Luôn dùng PGD-50 + AutoAttack.
                </p>
              </div>
            </CollapsibleDetail>
          </div>
        </ExplanationSection>
      </LessonSection>

      {/* --------------------------------------------------------------- */}
      {/* Bước 7 — Callout #2 & #3: Trade-off + Defense in Depth          */}
      {/* --------------------------------------------------------------- */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Trade-off & phòng thủ nhiều lớp">
        <div className="mb-4">
          <ProgressSteps current={7} total={TOTAL_STEPS} />
        </div>

        <Callout variant="tip" title="Trade-off: Accuracy sạch ⇄ Robustness">
          <p>
            Adversarial training cải thiện robust accuracy (từ ~0% lên
            40-60% dưới PGD) nhưng thường giảm clean accuracy 1-3%. Trade-off
            đáng chấp nhận cho ứng dụng safety-critical (xe tự lái, y tế,
            an ninh), có thể không cần cho ứng dụng rủi ro thấp (gợi ý
            sản phẩm, nhận dạng ảnh giải trí).
          </p>
          <p className="mt-2">
            Tsipras et al. (2019) chứng minh trade-off này là{" "}
            <strong>nội tại</strong> — không chỉ do thuật toán kém, mà vì
            feature robust và feature chính xác có thể xung đột nhau.
          </p>
        </Callout>

        <div className="mt-4">
          <Callout variant="warning" title="Defense in depth — nhiều lớp độc lập">
            <p>
              Không có biện pháp đơn lẻ nào đủ. Kiến trúc bền vững đi
              theo nguyên tắc <em>Defense in Depth</em>:
            </p>
            <ol className="list-decimal pl-5 mt-2 space-y-1 text-sm">
              <li>
                <strong>Input level:</strong> preprocessing (JPEG, total
                variation denoising), anomaly detector.
              </li>
              <li>
                <strong>Model level:</strong> adversarial training,
                ensemble nhiều mô hình có kiến trúc khác nhau.
              </li>
              <li>
                <strong>Output level:</strong> confidence threshold, uncertainty
                estimation (dropout-at-inference).
              </li>
              <li>
                <strong>System level:</strong> fallback sang cảm biến khác
                (LiDAR, GPS), human in the loop khi confidence thấp.
              </li>
            </ol>
          </Callout>
        </div>
      </LessonSection>

      {/* --------------------------------------------------------------- */}
      {/* Bước 8 — Thử thách nhanh #2                                     */}
      {/* --------------------------------------------------------------- */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Thử thách phòng thủ">
        <div className="mb-4">
          <ProgressSteps current={8} total={TOTAL_STEPS} />
        </div>
        <InlineChallenge
          question="Một startup Việt Nam triển khai AI nhận dạng chữ ký cho ngân hàng. Họ đo clean accuracy 99%. Bạn là security reviewer — đâu là yêu cầu BẮT BUỘC?"
          options={[
            "Chỉ cần tăng test set lên 10x là đủ",
            "Phải đo robust accuracy dưới PGD / AutoAttack, áp dụng adversarial training, và thêm anomaly detector + human review khi confidence thấp",
            "Chuyển sang mô hình nhỏ hơn để không bị tấn công",
            "Mã hoá toàn bộ pipeline rồi coi như an toàn",
          ]}
          correct={1}
          explanation="Clean accuracy 99% vô nghĩa cho ứng dụng an ninh nếu robust accuracy = 0%. Kẻ xấu chỉ cần FGSM ε=0.01 là đã lật được dự đoán. Quy trình đúng: (1) đo robust accuracy với AutoAttack, (2) adversarial training với ngân sách tính toán phù hợp, (3) anomaly detection chặn input bất thường, (4) khi confidence <95% → chuyển human review. Defense in depth cho ứng dụng tài chính là bắt buộc."
        />
      </LessonSection>

      {/* --------------------------------------------------------------- */}
      {/* Bước 9 — Callout #4: Đánh giá đúng                              */}
      {/* --------------------------------------------------------------- */}
      <LessonSection step={9} totalSteps={TOTAL_STEPS} label="Cách đánh giá đúng">
        <div className="mb-4">
          <ProgressSteps current={9} total={TOTAL_STEPS} />
        </div>
        <Callout variant="info" title="Checklist đo robustness cho mô hình production">
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>
              <strong>Không</strong> chỉ báo cáo accuracy dưới FGSM default —
              dễ cho kết quả ảo.
            </li>
            <li>
              Dùng <strong>PGD-50 + AutoAttack</strong> (ensemble APGD-CE,
              APGD-DLR, FAB, Square) làm chuẩn.
            </li>
            <li>
              Báo cáo cả <strong>L∞</strong>, <strong>L2</strong>, và{" "}
              <strong>L0</strong> (nếu tấn công sparse quan trọng).
            </li>
            <li>
              Thử <strong>adaptive attack</strong> biết rõ defense của
              bạn — đây mới là bài kiểm tra thật.
            </li>
            <li>
              Với LLM / NLP: đo robustness với paraphrase, homoglyph,
              unicode confusable, prompt injection.
            </li>
            <li>
              Công khai weights + attack script — không có robustness nào
              tồn tại dưới "security through obscurity".
            </li>
          </ul>
        </Callout>

        <div className="mt-5 grid md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs uppercase tracking-wide text-muted mb-1">
              Attack budget
            </div>
            <div className="text-foreground font-semibold">
              ε = 8/255 (L∞)
            </div>
            <p className="text-[12px] text-muted mt-1">
              Chuẩn CIFAR-10 / ImageNet. Nhiễu ≈ 3% mỗi pixel — mắt người
              không thấy.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs uppercase tracking-wide text-muted mb-1">
              Attack steps
            </div>
            <div className="text-foreground font-semibold">
              PGD-50, 10 restarts
            </div>
            <p className="text-[12px] text-muted mt-1">
              50 bước gradient + 10 khởi tạo ngẫu nhiên. Số liệu tối
              thiểu để công bố.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs uppercase tracking-wide text-muted mb-1">
              Mục tiêu robust acc
            </div>
            <div className="text-foreground font-semibold">
              ≥ 45% (CIFAR-10)
            </div>
            <p className="text-[12px] text-muted mt-1">
              Mô hình không phòng thủ thường ≈ 0%. SOTA robust ≈ 70%
              nhưng tốn nhiều tài nguyên.
            </p>
          </div>
        </div>
      </LessonSection>

      {/* --------------------------------------------------------------- */}
      {/* Bước 10 — Tóm tắt + Quiz                                        */}
      {/* --------------------------------------------------------------- */}
      <LessonSection step={10} totalSteps={TOTAL_STEPS} label="Tóm tắt & kiểm tra">
        <div className="mb-4">
          <ProgressSteps current={10} total={TOTAL_STEPS} />
        </div>

        <MiniSummary
          title="Ghi nhớ về Adversarial Robustness"
          points={[
            "Adversarial attack = nhiễu CỰC NHỎ nhưng thiết kế theo gradient, đủ để lừa AI hoàn toàn.",
            "FGSM: 1 bước, nhanh. PGD: nhiều bước + projection, mạnh hơn. CW: optimization-based, khó phát hiện nhất.",
            "Physical attacks (sticker biển báo, kính, áo hoạ tiết) nguy hiểm hơn digital — hoạt động trong thế giới thực.",
            "Adversarial training (min-max) hiệu quả nhất nhưng tốn 3-10x thời gian và giảm clean accuracy 1-3%.",
            "Defense in depth: preprocessing + adversarial training + ensemble + fallback — không biện pháp đơn lẻ nào đủ.",
            "BẮT BUỘC đánh giá bằng PGD-50 + AutoAttack + adaptive attack trước khi claim robustness cho production.",
          ]}
        />

        <div className="mt-6 rounded-xl border border-border bg-card px-5 py-4">
          <div className="text-sm font-semibold text-foreground mb-2">
            Đọc thêm
          </div>
          <ul className="list-disc pl-5 space-y-1 text-[13px] text-muted">
            <li>
              Goodfellow, Shlens, Szegedy (2014) — Explaining and Harnessing
              Adversarial Examples (FGSM gốc).
            </li>
            <li>
              Madry et al. (2018) — Towards Deep Learning Models Resistant
              to Adversarial Attacks (PGD adversarial training).
            </li>
            <li>
              Croce & Hein (2020) — Reliable evaluation of adversarial
              robustness with AutoAttack.
            </li>
            <li>
              RobustBench (robustbench.github.io) — leaderboard chuẩn cho
              robust accuracy trên CIFAR / ImageNet.
            </li>
          </ul>
        </div>

        <div className="mt-6">
          <QuizSection questions={QUIZ} />
        </div>
      </LessonSection>
    </>
  );
}
