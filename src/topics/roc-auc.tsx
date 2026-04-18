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
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "roc-auc",
  title: "ROC & AUC",
  titleVi: "ROC & AUC — Đo khả năng phân biệt",
  description:
    "Đường cong ROC và diện tích AUC đo lường khả năng mô hình phân biệt lớp dương và lớp âm ở mọi ngưỡng quyết định.",
  category: "foundations",
  tags: ["roc", "auc", "classification", "metrics"],
  difficulty: "intermediate",
  relatedSlugs: ["confusion-matrix", "logistic-regression", "bias-variance"],
  vizType: "interactive",
};

const TOTAL_STEPS = 7;

// ============================================================================
// TỔNG QUAN VỀ KHỐI VISUALIZATION
// ----------------------------------------------------------------------------
// Mục tiêu: cho người học thấy mối quan hệ trực quan giữa (1) phân phối điểm
// của hai lớp, (2) ngưỡng quyết định, (3) cặp (FPR, TPR) tạo nên đường cong
// ROC, và (4) diện tích dưới đường cong (AUC) như một con số duy nhất tóm tắt
// khả năng phân biệt toàn cục của mô hình.
//
// Thiết kế tương tác gồm hai thanh trượt:
//   - threshold  (2..98): ngưỡng cắt score.
//   - separation (0..70): khoảng cách giữa hai trung bình phân phối; đại diện
//     cho "chất lượng" của mô hình — tách càng xa thì AUC càng cao.
//
// Các nút bổ sung:
//   - So với random: vẽ đè đường chéo FPR=TPR làm baseline tham chiếu.
//   - Chuyển tới Youden: đặt threshold tại ngưỡng có TPR-FPR lớn nhất.
//   - Hiện điểm Youden: đánh dấu điểm tối ưu trên ROC.
// ============================================================================

// ============================================================================
// SYNTHETIC DISTRIBUTIONS
// Hai phân phối điểm: lớp âm (negative) và lớp dương (positive).
// Người học kéo thanh ngưỡng → xem TPR/FPR thay đổi → vẽ ROC curve.
// ============================================================================

type Histogram = {
  /** Tâm bin (0..100) */
  center: number;
  /** Số lượng mẫu rơi vào bin (sau khi scale) */
  count: number;
};

/**
 * Tạo phân phối Gaussian rời rạc cho hai lớp.
 * Negative: mean thấp (khoảng 30), std ~ 15.
 * Positive: mean cao (khoảng 70), std ~ 15.
 * Mức độ "tách" giữa hai phân phối càng lớn → AUC càng cao.
 */
function buildDistributions(separation: number): {
  negative: Histogram[];
  positive: Histogram[];
} {
  const negMean = 50 - separation / 2;
  const posMean = 50 + separation / 2;
  const std = 14;
  const negative: Histogram[] = [];
  const positive: Histogram[] = [];
  for (let x = 0; x <= 100; x += 2) {
    const n = Math.exp(-Math.pow((x - negMean) / std, 2) / 2);
    const p = Math.exp(-Math.pow((x - posMean) / std, 2) / 2);
    negative.push({ center: x, count: n });
    positive.push({ center: x, count: p });
  }
  return { negative, positive };
}

/**
 * Tính TPR và FPR tại một ngưỡng cho trước.
 * TPR = tỷ lệ positive được dự đoán đúng (score >= threshold trong phân phối positive).
 * FPR = tỷ lệ negative bị gán sai (score >= threshold trong phân phối negative).
 */
function computeRates(
  threshold: number,
  dist: { negative: Histogram[]; positive: Histogram[] },
): { tpr: number; fpr: number } {
  const sum = (arr: Histogram[]) => arr.reduce((s, h) => s + h.count, 0);
  const sumAbove = (arr: Histogram[]) =>
    arr.filter((h) => h.center >= threshold).reduce((s, h) => s + h.count, 0);
  const totalN = sum(dist.negative) || 1;
  const totalP = sum(dist.positive) || 1;
  const tpr = sumAbove(dist.positive) / totalP;
  const fpr = sumAbove(dist.negative) / totalN;
  return { tpr, fpr };
}

/**
 * Lấy toàn bộ cặp (fpr, tpr) khi quét ngưỡng từ 100 xuống 0.
 * Đây chính là đường cong ROC.
 */
function buildCurve(dist: {
  negative: Histogram[];
  positive: Histogram[];
}): Array<{ fpr: number; tpr: number; threshold: number }> {
  const pts: Array<{ fpr: number; tpr: number; threshold: number }> = [];
  for (let t = 100; t >= 0; t -= 2) {
    const { tpr, fpr } = computeRates(t, dist);
    pts.push({ fpr, tpr, threshold: t });
  }
  return pts;
}

/**
 * Tính AUC bằng phương pháp hình thang trên danh sách điểm đã sắp theo FPR tăng.
 */
function computeAUC(
  curve: Array<{ fpr: number; tpr: number }>,
): number {
  const sorted = [...curve].sort((a, b) => a.fpr - b.fpr);
  let area = 0;
  for (let i = 1; i < sorted.length; i++) {
    const w = sorted[i].fpr - sorted[i - 1].fpr;
    const h = (sorted[i].tpr + sorted[i - 1].tpr) / 2;
    area += w * h;
  }
  return Math.max(0, Math.min(1, area));
}

export default function RocAucTopic() {
  // --------------------------------------------------------------------------
  // STATE: ngưỡng quyết định, mức tách (separation), bật/tắt baseline random
  // --------------------------------------------------------------------------
  const [threshold, setThreshold] = useState(50);
  const [separation, setSeparation] = useState(40);
  const [showRandom, setShowRandom] = useState(false);
  const [showOptimal, setShowOptimal] = useState(false);

  // --------------------------------------------------------------------------
  // DERIVED DATA
  // --------------------------------------------------------------------------
  const dist = useMemo(() => buildDistributions(separation), [separation]);
  const rates = useMemo(() => computeRates(threshold, dist), [threshold, dist]);
  const curve = useMemo(() => buildCurve(dist), [dist]);
  const auc = useMemo(() => computeAUC(curve), [curve]);

  const maxNegCount = useMemo(
    () => Math.max(...dist.negative.map((d) => d.count)),
    [dist.negative],
  );
  const maxPosCount = useMemo(
    () => Math.max(...dist.positive.map((d) => d.count)),
    [dist.positive],
  );
  const maxAny = Math.max(maxNegCount, maxPosCount);

  // Tìm ngưỡng "tối ưu" theo Youden's J (TPR - FPR lớn nhất)
  const optimalThreshold = useMemo(() => {
    let best = { j: -Infinity, threshold: 50 };
    for (let t = 0; t <= 100; t += 2) {
      const r = computeRates(t, dist);
      const j = r.tpr - r.fpr;
      if (j > best.j) best = { j, threshold: t };
    }
    return best.threshold;
  }, [dist]);

  const handleResetToOptimal = useCallback(() => {
    setThreshold(optimalThreshold);
    setShowOptimal(true);
  }, [optimalThreshold]);

  // --------------------------------------------------------------------------
  // QUIZ QUESTIONS (8 câu)
  // --------------------------------------------------------------------------
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question: "AUC = 0.5 có nghĩa là gì?",
        options: [
          "Model tốt — đúng 50% trường hợp",
          "Model KHÔNG HƠN đoán ngẫu nhiên — đường ROC nằm trên đường chéo, không có khả năng phân biệt",
          "Model hoàn hảo cho binary classification",
        ],
        correct: 1,
        explanation:
          "AUC 0.5 = đường ROC trùng với đường chéo (random classifier). Model không phân biệt được positive và negative tốt hơn tung đồng xu. AUC 1.0 = hoàn hảo. AUC < 0.5 = tệ hơn random (đảo nhãn!). AUC 0.7-0.8 = khá. AUC > 0.9 = tốt.",
      },
      {
        question: "Tại sao AUC tốt hơn accuracy cho imbalanced data?",
        options: [
          "AUC nhanh hơn tính",
          "Accuracy bị misleading khi data mất cân bằng (99% class A → predict A luôn = 99% accuracy). AUC đánh giá khả năng PHÂN BIỆT giữa classes, không phụ thuộc tỷ lệ",
          "AUC luôn lớn hơn accuracy",
        ],
        correct: 1,
        explanation:
          "Phát hiện gian lận (1% fraud): model predict 'không gian lận' cho tất cả → 99% accuracy nhưng KHÔNG phát hiện bất kỳ fraud nào! AUC = 0.5 (random). AUC đo: với MỌI threshold, model phân biệt fraud vs legit tốt thế nào — không bị tỷ lệ ảnh hưởng.",
      },
      {
        question: "ROC curve nằm ở phía trên-trái là tốt hay xấu?",
        options: [
          "Tốt — TPR cao (bắt nhiều positive) và FPR thấp (ít false alarm) = phân biệt giỏi",
          "Xấu — model quá tự tin",
          "Không liên quan đến chất lượng",
        ],
        correct: 0,
        explanation:
          "Góc trên-trái: TPR=1, FPR=0 = hoàn hảo (bắt hết positive, không false alarm nào). Đường ROC càng gần góc này → AUC càng gần 1.0 → model phân biệt càng tốt. Đường chéo (TPR=FPR) = random = AUC 0.5.",
      },
      {
        question:
          "Khi chuyển threshold từ 0.5 lên 0.7, TPR và FPR sẽ ra sao?",
        options: [
          "Cả TPR và FPR đều tăng",
          "Cả TPR và FPR đều giảm (ít sample vượt ngưỡng hơn, cả positive lẫn negative)",
          "TPR tăng, FPR giảm",
        ],
        correct: 1,
        explanation:
          "Tăng threshold → ít sample được classify là 'positive' hơn → TPR giảm (bắt sót positive) VÀ FPR giảm (ít false alarm). Đây là trade-off cơ bản. ROC curve thể hiện toàn bộ trade-off này ở mọi ngưỡng.",
      },
      {
        question:
          "Model của bạn có AUC = 0.3. Nên làm gì?",
        options: [
          "Vứt model đi và train lại từ đầu",
          "Đảo nhãn dự đoán — model đang học NGƯỢC, đảo nhãn sẽ cho AUC = 0.7",
          "Tăng threshold",
        ],
        correct: 1,
        explanation:
          "AUC < 0.5 có nghĩa model phân biệt ngược (negative có score cao hơn positive). Chỉ cần đảo nhãn: nếu AUC = 0.3, thì đảo cho AUC = 1 - 0.3 = 0.7. Bug thường gặp: đặt nhầm label positive/negative khi train.",
      },
      {
        question:
          "PR-AUC (Precision-Recall AUC) khác ROC-AUC ở điểm nào?",
        options: [
          "PR-AUC nhạy hơn với imbalanced data vì tập trung vào precision của lớp dương",
          "PR-AUC luôn cao hơn ROC-AUC",
          "PR-AUC chỉ dùng cho multi-class",
        ],
        correct: 0,
        explanation:
          "Khi positive class rất hiếm (ví dụ 0.1% fraud), ROC-AUC có thể cao đánh lừa vì TN áp đảo. PR-AUC (precision-recall) tập trung vào positive class → phản ánh tốt hơn hiệu suất trong imbalanced tasks.",
      },
      {
        question:
          "Youden's J statistic dùng để làm gì?",
        options: [
          "Tính diện tích AUC",
          "Tìm threshold tối ưu — ngưỡng maximize (TPR - FPR), tức cách xa nhất khỏi đường chéo random",
          "Kiểm định ý nghĩa thống kê của AUC",
        ],
        correct: 1,
        explanation:
          "J = TPR - FPR. Ngưỡng cho J lớn nhất = điểm trên ROC xa đường chéo nhất (về phía trên-trái). Đây là heuristic phổ biến chọn threshold mặc định, tuy nhiên context (y tế, fraud, ads) có thể yêu cầu khác.",
      },
      {
        question:
          "Chọn model dựa trên AUC có phải lúc nào cũng đúng không?",
        options: [
          "Có — AUC cao nhất luôn thắng",
          "Không — AUC là chỉ số tổng thể; phải xét thêm calibration, chi phí lỗi, tính ổn định trên subgroup",
          "Không — AUC không áp dụng cho classification",
        ],
        correct: 1,
        explanation:
          "AUC tốt cho so sánh ranking, nhưng: (1) không đo calibration (probability tin cậy); (2) không phản ánh cost của từng loại lỗi; (3) có thể cao trên toàn bộ nhưng thấp ở subgroup thiểu số. Luôn xem thêm Precision-Recall, confusion matrix theo nhóm.",
      },
    ],
    [],
  );

  // --------------------------------------------------------------------------
  // SVG helpers
  // --------------------------------------------------------------------------
  const distSvgW = 620;
  const distSvgH = 220;
  const distPadL = 44;
  const distPadR = 20;
  const distPadT = 24;
  const distPadB = 30;
  const distPlotW = distSvgW - distPadL - distPadR;
  const distPlotH = distSvgH - distPadT - distPadB;

  const rocSvgW = 420;
  const rocSvgH = 360;
  const rocPad = 44;
  const rocPlotW = rocSvgW - rocPad * 2;
  const rocPlotH = rocSvgH - rocPad * 2;

  const distX = useCallback(
    (score: number) => distPadL + (score / 100) * distPlotW,
    [distPadL, distPlotW],
  );
  const distY = useCallback(
    (count: number) =>
      distPadT + distPlotH - (count / Math.max(maxAny, 0.0001)) * distPlotH,
    [distPadT, distPlotH, maxAny],
  );

  const rocX = useCallback(
    (fpr: number) => rocPad + fpr * rocPlotW,
    [rocPad, rocPlotW],
  );
  const rocY = useCallback(
    (tpr: number) => rocPad + (1 - tpr) * rocPlotH,
    [rocPad, rocPlotH],
  );

  const rocPath = useMemo(() => {
    const sorted = [...curve].sort((a, b) => a.fpr - b.fpr);
    return sorted
      .map((p, i) => `${i === 0 ? "M" : "L"} ${rocX(p.fpr)} ${rocY(p.tpr)}`)
      .join(" ");
  }, [curve, rocX, rocY]);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Model phát hiện gian lận ngân hàng: 10.000 giao dịch, 100 gian lận (1%). Model predict 'không gian lận' cho TẤT CẢ → accuracy 99%. Model này tốt không?"
          options={[
            "Tốt — 99% accuracy rất cao",
            "TỆ — 99% accuracy là giả tạo, model không phát hiện BẤT KỲ gian lận nào. Cần metric khác: ROC-AUC",
            "Trung bình — cần cải thiện thêm",
          ]}
          correct={1}
          explanation="Accuracy bị 'lừa' bởi imbalanced data! 99% accuracy nhưng 0% fraud detected = vô dụng. ROC-AUC đo khả năng phân biệt THỰC SỰ giữa fraud và legit tại MỌI ngưỡng. Model này có AUC = 0.5 (random) dù accuracy 99%."
        >
          <LessonSection
            step={2}
            totalSteps={TOTAL_STEPS}
            label="Khám phá"
          >
            <p className="mb-4 text-sm text-muted leading-relaxed">
              Hai phân phối điểm bên dưới đại diện cho hai lớp — lớp{" "}
              <strong className="text-foreground">âm</strong> (giao dịch hợp
              lệ) và lớp <strong className="text-foreground">dương</strong>{" "}
              (gian lận). Kéo <strong className="text-foreground">ngưỡng
              quyết định</strong> để xem có bao nhiêu mẫu rơi về mỗi phía.
              Đường cong ROC bên phải sẽ cập nhật trực tiếp theo bạn. Thay
              đổi <strong className="text-foreground">độ tách</strong> để
              thấy AUC biến thiên ra sao.
            </p>

            <VisualizationSection>
              <div className="space-y-6">
                {/* ------- SLIDER CONTROLS ------- */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center justify-between text-sm font-medium text-muted">
                      <span>Ngưỡng quyết định</span>
                      <span className="font-mono text-foreground">
                        {threshold}
                      </span>
                    </label>
                    <input
                      type="range"
                      min={2}
                      max={98}
                      step={2}
                      value={threshold}
                      onChange={(e) =>
                        setThreshold(parseInt(e.target.value, 10))
                      }
                      className="w-full accent-accent"
                    />
                    <p className="text-xs text-muted">
                      Mọi giao dịch có score ≥ {threshold} → dự đoán là gian
                      lận.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center justify-between text-sm font-medium text-muted">
                      <span>Độ tách hai phân phối</span>
                      <span className="font-mono text-foreground">
                        {separation}
                      </span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={70}
                      step={2}
                      value={separation}
                      onChange={(e) =>
                        setSeparation(parseInt(e.target.value, 10))
                      }
                      className="w-full accent-accent"
                    />
                    <p className="text-xs text-muted">
                      Tách nhỏ → AUC thấp (model yếu). Tách lớn → AUC cao.
                    </p>
                  </div>
                </div>

                {/* ------- DISTRIBUTIONS ------- */}
                <div className="rounded-xl border border-border bg-card/40 p-3">
                  <svg
                    viewBox={`0 0 ${distSvgW} ${distSvgH}`}
                    className="w-full"
                  >
                    <text
                      x={distSvgW / 2}
                      y={14}
                      textAnchor="middle"
                      fill="#e2e8f0"
                      fontSize={11}
                      fontWeight="bold"
                    >
                      Phân phối điểm theo lớp
                    </text>

                    {/* Axes */}
                    <line
                      x1={distPadL}
                      y1={distPadT}
                      x2={distPadL}
                      y2={distPadT + distPlotH}
                      stroke="#475569"
                      strokeWidth={1}
                    />
                    <line
                      x1={distPadL}
                      y1={distPadT + distPlotH}
                      x2={distPadL + distPlotW}
                      y2={distPadT + distPlotH}
                      stroke="#475569"
                      strokeWidth={1}
                    />

                    {/* Ticks trục x */}
                    {[0, 25, 50, 75, 100].map((t) => (
                      <g key={t}>
                        <line
                          x1={distX(t)}
                          y1={distPadT + distPlotH}
                          x2={distX(t)}
                          y2={distPadT + distPlotH + 4}
                          stroke="#475569"
                        />
                        <text
                          x={distX(t)}
                          y={distPadT + distPlotH + 16}
                          textAnchor="middle"
                          fill="#94a3b8"
                          fontSize={8}
                        >
                          {t}
                        </text>
                      </g>
                    ))}
                    <text
                      x={distSvgW / 2}
                      y={distSvgH - 4}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize={9}
                    >
                      Score dự đoán
                    </text>

                    {/* Negative distribution */}
                    {dist.negative.map((h, i) => (
                      <rect
                        key={`n-${i}`}
                        x={distX(h.center) - 4}
                        y={distY(h.count)}
                        width={4}
                        height={Math.max(
                          0,
                          distPadT + distPlotH - distY(h.count),
                        )}
                        fill="#60a5fa"
                        opacity={h.center >= threshold ? 0.25 : 0.85}
                      />
                    ))}

                    {/* Positive distribution */}
                    {dist.positive.map((h, i) => (
                      <rect
                        key={`p-${i}`}
                        x={distX(h.center)}
                        y={distY(h.count)}
                        width={4}
                        height={Math.max(
                          0,
                          distPadT + distPlotH - distY(h.count),
                        )}
                        fill="#f97316"
                        opacity={h.center >= threshold ? 0.85 : 0.25}
                      />
                    ))}

                    {/* Threshold line */}
                    <motion.line
                      x1={distX(threshold)}
                      y1={distPadT}
                      x2={distX(threshold)}
                      y2={distPadT + distPlotH}
                      stroke="#ef4444"
                      strokeWidth={2}
                      strokeDasharray="5 3"
                      initial={false}
                      animate={{ x1: distX(threshold), x2: distX(threshold) }}
                      transition={{ type: "spring", stiffness: 200 }}
                    />
                    <text
                      x={distX(threshold)}
                      y={distPadT - 4}
                      textAnchor="middle"
                      fill="#ef4444"
                      fontSize={9}
                      fontWeight="bold"
                    >
                      ngưỡng
                    </text>

                    {/* Legend */}
                    <g transform={`translate(${distSvgW - 180}, ${distPadT})`}>
                      <rect
                        x={0}
                        y={0}
                        width={10}
                        height={10}
                        fill="#60a5fa"
                      />
                      <text x={14} y={9} fill="#cbd5e1" fontSize={8}>
                        Lớp âm (hợp lệ)
                      </text>
                      <rect
                        x={0}
                        y={14}
                        width={10}
                        height={10}
                        fill="#f97316"
                      />
                      <text x={14} y={23} fill="#cbd5e1" fontSize={8}>
                        Lớp dương (gian lận)
                      </text>
                    </g>
                  </svg>
                </div>

                {/* ------- ROC + STATS ------- */}
                <div className="grid md:grid-cols-5 gap-4">
                  <div className="md:col-span-3 rounded-xl border border-border bg-card/40 p-3">
                    <svg
                      viewBox={`0 0 ${rocSvgW} ${rocSvgH}`}
                      className="w-full"
                    >
                      <text
                        x={rocSvgW / 2}
                        y={16}
                        textAnchor="middle"
                        fill="#e2e8f0"
                        fontSize={11}
                        fontWeight="bold"
                      >
                        Đường cong ROC (AUC ≈ {auc.toFixed(3)})
                      </text>

                      {/* Grid */}
                      {[0, 0.25, 0.5, 0.75, 1].map((v) => (
                        <g key={v}>
                          <line
                            x1={rocX(v)}
                            y1={rocPad}
                            x2={rocX(v)}
                            y2={rocPad + rocPlotH}
                            stroke="#1e293b"
                          />
                          <line
                            x1={rocPad}
                            y1={rocY(v)}
                            x2={rocPad + rocPlotW}
                            y2={rocY(v)}
                            stroke="#1e293b"
                          />
                          <text
                            x={rocX(v)}
                            y={rocPad + rocPlotH + 14}
                            textAnchor="middle"
                            fill="#94a3b8"
                            fontSize={8}
                          >
                            {v.toFixed(2)}
                          </text>
                          <text
                            x={rocPad - 6}
                            y={rocY(v) + 3}
                            textAnchor="end"
                            fill="#94a3b8"
                            fontSize={8}
                          >
                            {v.toFixed(2)}
                          </text>
                        </g>
                      ))}

                      {/* Axes */}
                      <line
                        x1={rocPad}
                        y1={rocPad}
                        x2={rocPad}
                        y2={rocPad + rocPlotH}
                        stroke="#475569"
                      />
                      <line
                        x1={rocPad}
                        y1={rocPad + rocPlotH}
                        x2={rocPad + rocPlotW}
                        y2={rocPad + rocPlotH}
                        stroke="#475569"
                      />

                      <text
                        x={rocSvgW / 2}
                        y={rocSvgH - 6}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize={9}
                      >
                        FPR (false positive rate)
                      </text>
                      <text
                        x={14}
                        y={rocSvgH / 2}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize={9}
                        transform={`rotate(-90 14 ${rocSvgH / 2})`}
                      >
                        TPR (true positive rate)
                      </text>

                      {/* AUC shading */}
                      <path
                        d={`${rocPath} L ${rocX(1)} ${rocY(0)} L ${rocX(0)} ${rocY(0)} Z`}
                        fill="#3b82f6"
                        opacity={0.12}
                      />

                      {/* Baseline random */}
                      {showRandom && (
                        <line
                          x1={rocX(0)}
                          y1={rocY(0)}
                          x2={rocX(1)}
                          y2={rocY(1)}
                          stroke="#f97316"
                          strokeDasharray="4 3"
                          strokeWidth={1.5}
                        />
                      )}

                      {/* ROC curve */}
                      <path
                        d={rocPath}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth={2.25}
                      />

                      {/* Diagonal (reference for random) */}
                      <line
                        x1={rocX(0)}
                        y1={rocY(0)}
                        x2={rocX(1)}
                        y2={rocY(1)}
                        stroke="#475569"
                        strokeDasharray="3 3"
                        strokeWidth={1}
                      />

                      {/* Current point */}
                      <motion.circle
                        cx={rocX(rates.fpr)}
                        cy={rocY(rates.tpr)}
                        r={7}
                        fill="#ef4444"
                        stroke="white"
                        strokeWidth={2}
                        initial={false}
                        animate={{
                          cx: rocX(rates.fpr),
                          cy: rocY(rates.tpr),
                        }}
                        transition={{ type: "spring", stiffness: 220 }}
                      />

                      {/* Optimal point */}
                      {showOptimal && (
                        <g>
                          <circle
                            cx={rocX(computeRates(optimalThreshold, dist).fpr)}
                            cy={rocY(computeRates(optimalThreshold, dist).tpr)}
                            r={5}
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth={2}
                          />
                          <text
                            x={
                              rocX(computeRates(optimalThreshold, dist).fpr) +
                              8
                            }
                            y={
                              rocY(computeRates(optimalThreshold, dist).tpr) -
                              6
                            }
                            fill="#22c55e"
                            fontSize={9}
                            fontWeight="bold"
                          >
                            Youden J
                          </text>
                        </g>
                      )}
                    </svg>
                  </div>

                  <div className="md:col-span-2 flex flex-col gap-2">
                    <div className="rounded-xl border border-border bg-card/40 p-3">
                      <div className="text-xs uppercase tracking-wide text-muted">
                        Điểm hiện tại
                      </div>
                      <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <div className="text-muted text-xs">TPR</div>
                          <div className="font-mono text-base text-foreground">
                            {rates.tpr.toFixed(3)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted text-xs">FPR</div>
                          <div className="font-mono text-base text-foreground">
                            {rates.fpr.toFixed(3)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card/40 p-3">
                      <div className="text-xs uppercase tracking-wide text-muted">
                        Diện tích AUC
                      </div>
                      <div className="mt-1 font-mono text-2xl text-accent">
                        {auc.toFixed(3)}
                      </div>
                      <p className="text-xs text-muted mt-1">
                        {auc > 0.9
                          ? "Xuất sắc — model phân biệt rất tốt."
                          : auc > 0.8
                            ? "Tốt — model chạy ổn ở phần lớn ngưỡng."
                            : auc > 0.7
                              ? "Khá — có thể cải thiện thêm."
                              : auc > 0.6
                                ? "Yếu — chỉ nhỉnh hơn random."
                                : "Gần random — xem xét lại feature/model."}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setShowRandom((v) => !v)}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-surface transition-colors"
                      >
                        {showRandom
                          ? "Ẩn baseline random"
                          : "So với random"}
                      </button>
                      <button
                        type="button"
                        onClick={handleResetToOptimal}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-surface transition-colors"
                      >
                        Chuyển tới ngưỡng Youden
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowOptimal((v) => !v)}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-surface transition-colors"
                      >
                        {showOptimal ? "Ẩn điểm tối ưu" : "Hiện điểm Youden"}
                      </button>
                    </div>

                    <div className="rounded-xl border border-border bg-card/40 p-3 text-xs text-muted">
                      Gợi ý: để <em>separation</em> về <strong>0</strong> rồi
                      kéo threshold — bạn sẽ thấy ROC sát đường chéo và AUC
                      ~0.5. Đó chính là <em>random classifier</em>.
                    </div>
                  </div>
                </div>
              </div>
            </VisualizationSection>
          </LessonSection>

          <LessonSection
            step={3}
            totalSteps={TOTAL_STEPS}
            label="Khoảnh khắc Aha"
          >
            <AhaMoment>
              <p>
                Kéo ngưỡng qua-lại và để ý hai việc: (1) khi ngưỡng{" "}
                <strong>tăng</strong>, cả TPR và FPR đều giảm — bạn bắt ít
                gian lận hơn nhưng cũng báo động giả ít hơn; (2) khi hai
                phân phối <strong>tách xa</strong>, vùng chồng lấn biến mất
                và AUC tiến về 1.0 mà không cần chọn ngưỡng nào cụ thể. Đó
                là lý do AUC được gọi là "chỉ số không phụ thuộc ngưỡng" —
                nó tóm tắt <em>toàn bộ</em> đường cong ROC thành một con số
                duy nhất.
              </p>
            </AhaMoment>
          </LessonSection>

          <LessonSection
            step={4}
            totalSteps={TOTAL_STEPS}
            label="Thử thách"
          >
            <div className="space-y-4">
              <InlineChallenge
                question="Hai model phát hiện ung thư: Model A (AUC=0.95), Model B (AUC=0.85). Nhưng Model B có recall=0.98 tại threshold 0.3. Chọn model nào cho screening?"
                options={[
                  "Model A vì AUC cao hơn",
                  "Model B vì recall 0.98: trong y tế, BỎ SÓT (false negative) nguy hiểm hơn BÁO ĐỘNG GIẢ (false positive). AUC cao nhưng recall thấp = bỏ sót bệnh nhân",
                  "Dùng cả hai",
                ]}
                correct={1}
                explanation="AUC đo overall, nhưng trong y tế: false negative (bỏ sót ung thư) = nguy hiểm. Model B với recall 0.98 chỉ bỏ sót 2% bệnh nhân. Model A AUC cao hơn nhưng tại threshold cụ thể, recall có thể thấp hơn. CONTEXT quyết định metric nào quan trọng — không có metric 'tốt nhất' cho mọi bài toán."
              />

              <InlineChallenge
                question="Bạn có 1% spam trong hộp thư (imbalanced). Model X đạt AUC-ROC = 0.92 nhưng Precision-Recall AUC chỉ 0.35. Kết luận gì?"
                options={[
                  "Model rất mạnh vì AUC-ROC cao",
                  "Model bị đánh lừa bởi TN áp đảo — precision thực tế với email spam còn yếu. Cần xem PR-AUC để ra quyết định triển khai.",
                  "AUC-ROC và PR-AUC luôn bằng nhau",
                ]}
                correct={1}
                explanation="Trong imbalanced data, TN rất lớn → FPR cực thấp dễ dàng → ROC-AUC trông đẹp. PR-AUC nhìn vào precision (bao nhiêu email được gắn nhãn spam là spam thật) → phản ánh chính xác hơn giá trị mô hình với lớp dương hiếm."
              />
            </div>
          </LessonSection>

          <LessonSection
            step={5}
            totalSteps={TOTAL_STEPS}
            label="Lý thuyết"
          >
            <ExplanationSection>
              <p>
                <strong>ROC (Receiver Operating Characteristic)</strong> và{" "}
                <strong>AUC (Area Under Curve)</strong> đo khả năng mô hình
                phân biệt class dương và class âm tại mọi ngưỡng quyết
                định. Ý tưởng cốt lõi: thay vì chọn một ngưỡng rồi đánh giá,
                ta <em>quét</em> ngưỡng từ cao xuống thấp và vẽ đường đi qua
                toàn bộ các cặp (FPR, TPR).
              </p>

              <p>
                <strong>Hai metric trên ROC:</strong>
              </p>
              <LaTeX block>
                {
                  "\\text{TPR (Sensitivity)} = \\frac{TP}{TP + FN} \\quad \\text{FPR} = \\frac{FP}{FP + TN}"
                }
              </LaTeX>
              <LaTeX block>
                {
                  "\\text{AUC} = \\int_0^1 \\text{TPR}(\\text{FPR}) \\, d(\\text{FPR}) = P(\\text{score}_{\\text{pos}} > \\text{score}_{\\text{neg}})"
                }
              </LaTeX>

              <p>
                Cách diễn giải thứ hai rất thú vị: AUC chính là{" "}
                <strong>
                  xác suất một mẫu dương ngẫu nhiên có điểm cao hơn một mẫu
                  âm ngẫu nhiên
                </strong>
                . Nói cách khác, AUC đo khả năng "xếp hạng" các mẫu theo
                điểm — không phụ thuộc ta cắt ngưỡng ở đâu.
              </p>

              <Callout variant="tip" title="Khi nào dùng AUC?">
                AUC tốt cho: binary classification, so sánh nhiều model,
                imbalanced data vừa phải, ranking tasks. KHÔNG tốt cho:
                multi-class (cần macro/micro-average, one-vs-rest), khi cần
                calibration (probability phải "đúng nghĩa"), khi cost của FP
                và FN rất khác nhau (hãy tính chi phí trực tiếp).
              </Callout>

              <Callout variant="info" title="Mẹo đọc nhanh một ROC">
                Nhìn ROC cong về phía <strong>trên-trái</strong> — AUC cao.
                Nhìn gần đường chéo — model chẳng khác gì tung xu. Nhìn cong
                về phía <strong>dưới-phải</strong> — bạn đã đảo nhãn ở đâu
                đó; cứ flip và AUC sẽ lật thành 1 − AUC.
              </Callout>

              <Callout variant="warning" title="Cảnh báo imbalanced">
                Với tập cực kỳ imbalanced (0.1% positive), ROC-AUC có thể
                đẹp "lừa mắt". Luôn xem thêm{" "}
                <strong>Precision-Recall curve</strong> và{" "}
                <strong>calibration plot</strong>. Chỉ AUC thôi chưa đủ để
                quyết định triển khai.
              </Callout>

              <Callout variant="insight" title="AUC không quan tâm scale">
                Nhân đôi tất cả score, hay áp logistic function vào score,
                AUC không đổi — vì AUC chỉ quan tâm <em>thứ tự</em> chứ không
                quan tâm giá trị tuyệt đối. Đây là lý do AUC đôi khi được
                gọi là <em>ranking metric</em>.
              </Callout>

              <p className="mt-4">
                <strong>Liên kết nội dung:</strong> trước khi đào sâu ROC,
                bạn nên hiểu{" "}
                <TopicLink slug="confusion-matrix">confusion matrix</TopicLink>{" "}
                (nguồn gốc của TP/FP/TN/FN) và{" "}
                <TopicLink slug="logistic-regression">
                  logistic regression
                </TopicLink>{" "}
                — vì đây là mô hình đầu tiên xuất ra score xác suất. Khi
                debug một AUC thấp, hãy xem lại khía cạnh{" "}
                <TopicLink slug="bias-variance">bias-variance</TopicLink> của
                model.
              </p>

              <CollapsibleDetail title="Chi tiết toán: vì sao AUC = P(score_pos > score_neg)?">
                <p className="text-sm">
                  Gọi <em>S⁺</em> là biến ngẫu nhiên điểm của một mẫu dương
                  và <em>S⁻</em> là điểm của một mẫu âm. Khi ta quét ngưỡng
                  từ cao xuống thấp:
                </p>
                <ul className="list-disc list-inside text-sm pl-2 space-y-1 mt-2">
                  <li>
                    Tăng 1 bước về bên trái (FPR tăng): ta vừa đưa thêm một
                    mẫu âm vào vùng "dự đoán dương".
                  </li>
                  <li>
                    Khi đó, phần diện tích thêm vào bằng chiều cao TPR hiện
                    tại × chiều rộng ΔFPR.
                  </li>
                  <li>
                    Tổng diện tích = xác suất bất kỳ cặp (dương, âm) nào mà
                    điểm dương lớn hơn điểm âm — đúng định nghĩa của
                    Mann-Whitney U / Wilcoxon rank-sum.
                  </li>
                </ul>
                <p className="text-sm mt-2">
                  Đây cũng là lý do AUC có thể ước lượng không thiên lệch từ
                  mẫu hữu hạn bằng cách đếm số cặp xếp đúng — một công thức
                  rất dễ cài bằng tay.
                </p>
              </CollapsibleDetail>

              <p className="mt-4">
                <strong>Ba loại curve thường gặp trong thực tế:</strong>
              </p>
              <ul className="list-disc list-inside text-sm pl-2 space-y-1">
                <li>
                  <strong>ROC curve</strong>: FPR vs TPR — như bạn đang thấy
                  ở trên. Ổn cho dữ liệu cân bằng, dễ so sánh giữa các
                  model.
                </li>
                <li>
                  <strong>Precision-Recall curve</strong>: Recall vs
                  Precision — phản ánh tốt hơn cho imbalanced datasets.
                  Thường đi kèm với PR-AUC hoặc Average Precision (AP).
                </li>
                <li>
                  <strong>Detection Error Tradeoff (DET)</strong>: FPR vs
                  FNR trên trục log-log — hay dùng trong biometrics và
                  speaker verification.
                </li>
              </ul>

              <p className="mt-4">
                <strong>Công thức nhanh để ước lượng AUC từ mẫu:</strong>
              </p>
              <LaTeX block>
                {
                  "\\widehat{\\text{AUC}} = \\frac{1}{n_+ n_-} \\sum_{i \\in P} \\sum_{j \\in N} \\mathbb{1}[s_i > s_j] + \\frac{1}{2}\\mathbb{1}[s_i = s_j]"
                }
              </LaTeX>
              <p className="text-sm text-muted">
                Đây là ước lượng Mann-Whitney — duyệt qua mọi cặp (dương,
                âm) và đếm tỷ lệ điểm dương cao hơn điểm âm. Nếu bằng nhau
                thì cho 0.5 điểm.
              </p>

              <CollapsibleDetail title="AUC, ROC và kinh tế của lỗi">
                <p className="text-sm">
                  Khi cost của FP và FN khác nhau (ví dụ FN của ung thư đắt
                  gấp 100 lần FP), AUC không đủ để chọn model. Ta cần{" "}
                  <em>expected cost</em>:
                </p>
                <LaTeX block>
                  {
                    "\\mathbb{E}[\\text{cost}] = \\pi \\cdot c_{FN} \\cdot (1 - \\text{TPR}) + (1-\\pi) \\cdot c_{FP} \\cdot \\text{FPR}"
                  }
                </LaTeX>
                <p className="text-sm">
                  Trong đó π là tỷ lệ positive, c_FN và c_FP là chi phí của
                  từng loại lỗi. Thực tế: vẽ ROC rồi tối ưu theo kinh tế
                  thay vì cứ đuổi theo AUC tuyệt đối.
                </p>
              </CollapsibleDetail>

              <CodeBlock
                language="python"
                title="Tính ROC-AUC với scikit-learn"
              >
{`from sklearn.metrics import roc_auc_score, roc_curve
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt
import numpy as np

# y_true: labels thật (0/1)
# y_scores: xác suất dự đoán (0.0 - 1.0)
# Ví dụ: y_scores = model.predict_proba(X_test)[:, 1]

auc = roc_auc_score(y_true, y_scores)
print(f"AUC: {auc:.3f}")

# Vẽ ROC curve
fpr, tpr, thresholds = roc_curve(y_true, y_scores)
plt.figure(figsize=(5, 5))
plt.plot(fpr, tpr, label=f"Model (AUC={auc:.2f})")
plt.plot([0, 1], [0, 1], "k--", label="Random (AUC=0.5)")
plt.xlabel("FPR (False Positive Rate)")
plt.ylabel("TPR (True Positive Rate)")
plt.title("ROC Curve - Phát hiện gian lận")
plt.legend(loc="lower right")
plt.grid(alpha=0.3)
plt.tight_layout()

# Tìm ngưỡng tối ưu (Youden's J)
j_scores = tpr - fpr
best_idx = int(np.argmax(j_scores))
best_threshold = thresholds[best_idx]
print(f"Optimal threshold: {best_threshold:.3f}")
print(f"TPR={tpr[best_idx]:.3f}, FPR={fpr[best_idx]:.3f}")

# Bootstrap CI cho AUC
def bootstrap_auc(y, s, n=1000, seed=0):
    rng = np.random.default_rng(seed)
    vals = []
    for _ in range(n):
        idx = rng.integers(0, len(y), len(y))
        if len(np.unique(y[idx])) < 2:
            continue
        vals.append(roc_auc_score(y[idx], s[idx]))
    return np.percentile(vals, [2.5, 97.5])

lo, hi = bootstrap_auc(np.array(y_true), np.array(y_scores))
print(f"95% CI for AUC: [{lo:.3f}, {hi:.3f}]")

# Kiểm tra AUC theo subgroup (ví dụ: giới tính, độ tuổi)
# Một AUC toàn cục 0.9 có thể che giấu AUC = 0.6 ở một nhóm nhỏ.
def subgroup_auc(y, s, groups):
    for g in np.unique(groups):
        mask = groups == g
        if len(np.unique(y[mask])) < 2:
            continue
        print(f"group={g}: AUC={roc_auc_score(y[mask], s[mask]):.3f} "
              f"(n={mask.sum()})")

# subgroup_auc(np.array(y_true), np.array(y_scores), np.array(groups))`}
              </CodeBlock>

              <CodeBlock
                language="python"
                title="So sánh nhiều model và chọn theo cost"
              >
{`from sklearn.metrics import roc_auc_score, precision_recall_curve, auc as pr_auc_fn
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
import numpy as np

models = {
    "logreg": LogisticRegression(max_iter=1000),
    "rf": RandomForestClassifier(n_estimators=300, n_jobs=-1),
    "gbm": GradientBoostingClassifier(),
}

def evaluate(name, clf, X_tr, y_tr, X_te, y_te):
    clf.fit(X_tr, y_tr)
    s = clf.predict_proba(X_te)[:, 1]
    roc = roc_auc_score(y_te, s)
    prec, rec, _ = precision_recall_curve(y_te, s)
    pr = pr_auc_fn(rec, prec)
    return name, roc, pr, s

# Gán chi phí cho từng loại lỗi và chọn ngưỡng theo expected cost
def expected_cost(y, scores, thr, c_fp=1.0, c_fn=10.0, prior=None):
    pred = (scores >= thr).astype(int)
    fp = np.sum((pred == 1) & (y == 0))
    fn = np.sum((pred == 0) & (y == 1))
    return c_fp * fp + c_fn * fn

results = []
for name, clf in models.items():
    results.append(evaluate(name, clf, X_tr, y_tr, X_te, y_te))

for name, roc, pr, s in results:
    # quét ngưỡng 0..1 và chọn cost nhỏ nhất
    thrs = np.linspace(0.01, 0.99, 99)
    costs = [expected_cost(y_te, s, t) for t in thrs]
    best_t = thrs[int(np.argmin(costs))]
    print(f"{name}: ROC-AUC={roc:.3f} | PR-AUC={pr:.3f} | "
          f"best_thr={best_t:.2f} cost={min(costs):.0f}")`}
              </CodeBlock>

              <p className="mt-4">
                <strong>Bảng quy chiếu nhanh các chỉ số:</strong>
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 text-muted">
                        Chỉ số
                      </th>
                      <th className="text-left py-2 pr-4 text-muted">
                        Ý nghĩa
                      </th>
                      <th className="text-left py-2 text-muted">
                        Khi nào ưu tiên
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/60">
                      <td className="py-2 pr-4">Accuracy</td>
                      <td className="py-2 pr-4">
                        Tỷ lệ dự đoán đúng tổng thể
                      </td>
                      <td className="py-2">Dữ liệu cân bằng, cost đối xứng</td>
                    </tr>
                    <tr className="border-b border-border/60">
                      <td className="py-2 pr-4">ROC-AUC</td>
                      <td className="py-2 pr-4">
                        Khả năng ranking dương vs âm
                      </td>
                      <td className="py-2">
                        So sánh model, imbalanced vừa phải
                      </td>
                    </tr>
                    <tr className="border-b border-border/60">
                      <td className="py-2 pr-4">PR-AUC</td>
                      <td className="py-2 pr-4">
                        Precision vs Recall tổng thể
                      </td>
                      <td className="py-2">
                        Positive hiếm (fraud, spam, rare disease)
                      </td>
                    </tr>
                    <tr className="border-b border-border/60">
                      <td className="py-2 pr-4">F1</td>
                      <td className="py-2 pr-4">
                        Trung bình điều hòa P và R
                      </td>
                      <td className="py-2">
                        Chọn một ngưỡng cụ thể, cân bằng P/R
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">Expected cost</td>
                      <td className="py-2 pr-4">
                        Tổng chi phí lỗi có trọng số
                      </td>
                      <td className="py-2">Triển khai thực tế, cost rõ</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </ExplanationSection>
          </LessonSection>

          <LessonSection
            step={6}
            totalSteps={TOTAL_STEPS}
            label="Tóm tắt"
          >
            <MiniSummary
              title="Ghi nhớ nhanh"
              points={[
                "ROC curve: TPR vs FPR tại mọi ngưỡng. AUC = diện tích dưới ROC = khả năng phân biệt tổng thể.",
                "AUC = xác suất điểm positive > điểm negative (Mann-Whitney U). Không phụ thuộc scale, chỉ phụ thuộc thứ tự.",
                "AUC 0.5 = random, 0.7-0.8 = khá, 0.8-0.9 = tốt, > 0.9 = xuất sắc. AUC < 0.5 → đảo nhãn.",
                "Imbalanced cực đoan: xem kèm PR-AUC và calibration, đừng chỉ tin ROC-AUC.",
                "Context quyết định: y tế ưu tiên recall (không bỏ sót), spam filter ưu tiên precision.",
                "Youden's J (TPR - FPR max) là heuristic chọn ngưỡng mặc định; trong sản xuất hãy tối ưu theo cost thực.",
              ]}
            />
          </LessonSection>

          <LessonSection
            step={7}
            totalSteps={TOTAL_STEPS}
            label="Kiểm tra"
          >
            <QuizSection questions={quizQuestions} />
          </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
