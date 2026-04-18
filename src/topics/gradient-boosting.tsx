"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
  CollapsibleDetail,
  TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "gradient-boosting",
  title: "Gradient Boosting",
  titleVi: "Tăng cường gradient",
  description:
    "Xây dựng mô hình mạnh bằng cách nối tiếp các mô hình yếu, mỗi mô hình sửa sai cho mô hình trước",
  category: "classic-ml",
  tags: ["ensemble", "boosting", "supervised-learning"],
  difficulty: "intermediate",
  relatedSlugs: ["decision-trees", "random-forests", "bias-variance"],
  vizType: "interactive",
};

/* ════════════════════════════════════════════════════════════
   DỮ LIỆU MÔ PHỎNG — BÀI TOÁN HỒI QUY 1D
   Ý tưởng: ta có tập điểm (x, y) theo đường cong phi tuyến.
   5 cây nhỏ được thêm lần lượt, mỗi cây fit trên RESIDUAL
   của tổ hợp trước. Mỗi bước hiển thị:
     - Scatter thực tế (xanh) vs dự đoán cộng dồn (cam)
     - Residual = y_thực − y_dự_đoán (đường dọc đỏ)
     - Cây vừa thêm (đường bậc thang tím)
     - Loss MSE qua các round
   ──────────────────────────────────────────────────────────── */

const N_POINTS = 16;
const X_VALUES: number[] = Array.from({ length: N_POINTS }, (_, i) =>
  +(i / (N_POINTS - 1) * 10).toFixed(3),
);

/* Hàm mục tiêu phi tuyến (ẩn): y = sin(x) * 4 + 0.3x + noise */
const Y_TRUE: number[] = X_VALUES.map((x) => {
  const base = Math.sin(x) * 4 + 0.3 * x;
  // noise nhỏ, cố định seed để bài học ổn định
  const seedNoise = Math.sin(x * 17.3) * 0.35;
  return +(base + seedNoise).toFixed(3);
});

const Y_MEAN = +(Y_TRUE.reduce((a, b) => a + b, 0) / N_POINTS).toFixed(3);

/* Mỗi "cây" là một bảng ánh xạ x → delta.
   Thực tế cây quyết định nông sẽ cắt x thành vài vùng và cho
   hằng số trên mỗi vùng. Ta mô phỏng bằng hàm bậc thang đơn giản.
   Learning rate η = 0.6 được nhân cố định vào delta khi cộng dồn. */

const ETA = 0.6;

function pieceTree(
  boundaries: number[],
  leafValues: number[],
): (x: number) => number {
  // boundaries sắp xếp tăng dần; leafValues độ dài = boundaries.length + 1
  return (x: number) => {
    let idx = boundaries.length;
    for (let i = 0; i < boundaries.length; i++) {
      if (x < boundaries[i]) {
        idx = i;
        break;
      }
    }
    return leafValues[idx];
  };
}

/* Năm cây được thiết kế để lần lượt giảm residual.
   Mỗi cây chỉ có 3–4 lá — nông, đúng "weak learner". */
const WEAK_TREES: Array<(x: number) => number> = [
  pieceTree([2.5, 5.5, 8.0], [-2.2, 3.8, -2.6, 1.4]),
  pieceTree([1.5, 4.0, 7.0, 9.0], [-0.6, 1.8, -1.4, 0.9, -0.4]),
  pieceTree([3.0, 6.5], [0.4, -0.9, 0.5]),
  pieceTree([2.0, 5.0, 8.5], [-0.25, 0.55, -0.4, 0.3]),
  pieceTree([4.5, 7.5], [0.15, -0.22, 0.18]),
];

const N_ROUNDS = WEAK_TREES.length; // 5 cây

/** Dự đoán tích luỹ sau round r (r = 0..N_ROUNDS). */
function predictAt(x: number, r: number): number {
  let y = Y_MEAN;
  for (let m = 0; m < r; m++) {
    y += ETA * WEAK_TREES[m](x);
  }
  return y;
}

/** Tập dự đoán cho toàn bộ X_VALUES ở round r. */
function predictAll(r: number): number[] {
  return X_VALUES.map((x) => predictAt(x, r));
}

/** Residual = y_true − y_pred. */
function residualsAt(r: number): number[] {
  const pred = predictAll(r);
  return Y_TRUE.map((y, i) => +(y - pred[i]).toFixed(3));
}

function mseAt(r: number): number {
  const pred = predictAll(r);
  return +(
    Y_TRUE.reduce((s, y, i) => s + (y - pred[i]) ** 2, 0) / N_POINTS
  ).toFixed(3);
}

/* Precompute history để vẽ đường loss */
const MSE_HISTORY: number[] = Array.from({ length: N_ROUNDS + 1 }, (_, r) =>
  mseAt(r),
);

const Y_MIN = Math.min(...Y_TRUE) - 1.5;
const Y_MAX = Math.max(...Y_TRUE) + 1.5;

const TOTAL_STEPS = 7;

/* ────────── TOẠ ĐỘ SVG ────────── */
const VIZ_W = 520;
const VIZ_H = 260;
const PAD_L = 36;
const PAD_R = 12;
const PAD_T = 18;
const PAD_B = 30;

function xToPx(x: number): number {
  return PAD_L + ((x - 0) / 10) * (VIZ_W - PAD_L - PAD_R);
}
function yToPx(y: number): number {
  return (
    PAD_T + ((Y_MAX - y) / (Y_MAX - Y_MIN)) * (VIZ_H - PAD_T - PAD_B)
  );
}

/* ────────── BẢNG SO SÁNH THƯ VIỆN ────────── */
type LibRow = {
  id: "xgb" | "lgbm" | "cat";
  name: string;
  color: string;
  strategy: string;
  tree: string;
  speed: string;
  missing: string;
  categorical: string;
  bestFor: string;
};

const LIBRARIES: LibRow[] = [
  {
    id: "xgb",
    name: "XGBoost",
    color: "#f97316",
    strategy: "Level-wise (cân bằng theo tầng)",
    tree: "Pre-sorted + histogram (tuỳ chọn)",
    speed: "Nhanh, ổn định",
    missing: "Học hướng đi riêng cho NaN",
    categorical: "Cần one-hot / target encoding",
    bestFor: "Tổng quát — dữ liệu bảng nhiều loại",
  },
  {
    id: "lgbm",
    name: "LightGBM",
    color: "#22c55e",
    strategy: "Leaf-wise (chọn lá lỗi lớn nhất)",
    tree: "Histogram binning + GOSS + EFB",
    speed: "Nhanh nhất (lớn)",
    missing: "Xử lý tự động qua bin",
    categorical: "Native categorical (integer)",
    bestFor: "Dataset hàng triệu dòng, ít RAM",
  },
  {
    id: "cat",
    name: "CatBoost",
    color: "#8b5cf6",
    strategy: "Symmetric (oblivious) trees",
    tree: "Ordered boosting — chống leakage",
    speed: "Trung bình — chậm hơn LGBM",
    missing: "Xử lý tự động",
    categorical: "Tốt nhất — target stats ordered",
    bestFor: "Nhiều feature dạng categorical",
  },
];

/* ════════════════════════════════════════════════════════════
   QUIZ 8 CÂU
   ──────────────────────────────────────────────────────────── */
const QUIZ: QuizQuestion[] = [
  {
    question:
      "Gradient Boosting và Random Forest khác nhau cơ bản ở cách huấn luyện?",
    options: [
      "Random Forest dùng cây, Gradient Boosting dùng mạng nơ-ron",
      "Random Forest xây cây SONG SONG (bagging); Gradient Boosting xây cây NỐI TIẾP, mỗi cây sửa sai cây trước (boosting)",
      "Gradient Boosting luôn chậm và kém chính xác hơn Random Forest",
      "Cả hai đều chỉ dùng cho dữ liệu ảnh",
    ],
    correct: 1,
    explanation:
      "Random Forest tạo T cây độc lập trên các bootstrap sample rồi bỏ phiếu — mục tiêu giảm variance. Gradient Boosting xây từng cây một, cây m+1 học phần residual của tổ hợp F_m — mục tiêu giảm bias.",
  },
  {
    question:
      "Vì sao tên gọi lại có chữ 'Gradient' trong Gradient Boosting?",
    options: [
      "Vì thuật toán dùng GPU và tính gradient song song",
      "Vì residual y − F(x) chính là GRADIENT ÂM của hàm loss bình phương — huấn luyện cây mới là một bước gradient descent trong không gian hàm",
      "Vì mỗi cây được tối ưu bằng SGD",
      "Vì dùng hàm kích hoạt có gradient",
    ],
    correct: 1,
    explanation:
      "Với L = (y − F)² / 2, đạo hàm theo F là −(y − F). Residual = y − F = −∂L/∂F. Boosting cộng thêm cây theo hướng gradient âm → giảm loss. Đây là tổng quát hoá Friedman (2001).",
  },
  {
    question:
      "Learning rate η = 0.01 so với η = 0.5 (giữ nguyên n_estimators). Điều gì có xu hướng đúng?",
    options: [
      "η = 0.01 cho kết quả huấn luyện giống hệt, chỉ chậm hơn",
      "η = 0.01 cần NHIỀU cây hơn để đạt cùng độ fit, nhưng generalize tốt hơn và ít overfit hơn",
      "η = 0.01 luôn tệ hơn trên test set",
      "η = 0.5 tự động chống overfit",
    ],
    correct: 1,
    explanation:
      "η nhỏ là 'regularization by shrinkage' (Friedman). Mỗi cây đóng góp ít nên mô hình tổng tiến chậm và mượt — ít khả năng học noise. Trade-off: cần n_estimators lớn + early stopping.",
  },
  {
    question:
      "LightGBM có chiến lược phát triển cây 'leaf-wise'. Hệ quả phổ biến nhất?",
    options: [
      "Cây luôn cân bằng hoàn hảo",
      "Cây có thể RẤT sâu, giảm loss nhanh nhưng dễ overfit trên dữ liệu nhỏ — cần hạn chế num_leaves / min_data_in_leaf",
      "Cây chỉ có 1 lá",
      "LightGBM không thể phát triển cây lớn",
    ],
    correct: 1,
    explanation:
      "Leaf-wise luôn tách lá có lỗi lớn nhất → cây lệch, sâu cục bộ. Trên dataset nhỏ dễ overfit. XGBoost level-wise cân bằng hơn. Vì vậy tham số num_leaves / max_depth / min_data_in_leaf rất quan trọng với LightGBM.",
  },
  {
    question:
      "CatBoost nổi tiếng với 'ordered boosting'. Mục đích chính?",
    options: [
      "Sắp xếp dữ liệu theo thời gian trước khi train",
      "Tránh TARGET LEAKAGE khi dùng target statistics cho feature categorical — dùng permutation để tính encode chỉ từ dữ liệu 'trước' mẫu đang xét",
      "Làm cho cây luôn đối xứng",
      "Tăng tốc độ huấn luyện",
    ],
    correct: 1,
    explanation:
      "Target encoding kinh điển dùng y của chính mẫu đang encode → leakage. CatBoost permute dữ liệu, khi encode mẫu i chỉ dùng thống kê từ i-1 mẫu đầu. Cây đối xứng (oblivious) là feature riêng khác giúp inference nhanh.",
  },
  {
    question:
      "Early stopping trong Gradient Boosting dựa trên gì?",
    options: [
      "Dừng khi training loss = 0",
      "Theo dõi loss trên tập VALIDATION — dừng khi không giảm sau k round (tham số early_stopping_rounds)",
      "Dừng khi learning rate giảm về 0",
      "Dừng ngẫu nhiên sau 100 round",
    ],
    correct: 1,
    explanation:
      "Training loss luôn giảm khi thêm cây, nhưng validation loss sẽ chạm đáy rồi tăng (overfit). Early stopping chọn số cây tối ưu tự động thay vì phải grid-search n_estimators.",
  },
  {
    question:
      "Bạn dùng GBDT cho bài toán phân loại nhị phân. Loss function phù hợp nhất?",
    options: [
      "Mean Squared Error trên nhãn 0/1",
      "Log-loss (binary cross-entropy) — gradient và hessian được dẫn xuất theo logit, hồi quy residual tương ứng",
      "Hinge loss của SVM",
      "Không có loss — phân loại không cần loss",
    ],
    correct: 1,
    explanation:
      "XGBoost/LGBM/CatBoost đều hỗ trợ objective='binary:logistic' hoặc 'binary'. Mỗi cây hồi quy trên pseudo-residual g_i = y_i − σ(F(x_i)) trong logit space, dùng cả gradient và hessian (Newton boosting).",
  },
  {
    question:
      "Khi nào nên chọn Random Forest THAY VÌ Gradient Boosting?",
    options: [
      "Khi cần mô hình mạnh nhất có thể",
      "Khi cần BASELINE nhanh, ít tune; dataset nhiễu nặng; hoặc cần mô hình robust với hyperparameter mặc định",
      "Khi dataset có hàng triệu dòng và cần tốc độ inference cực nhanh",
      "Không bao giờ — GBDT luôn tốt hơn",
    ],
    correct: 1,
    explanation:
      "RF cho kết quả khá ngay với tham số mặc định, ít nhạy với noise do trung bình nhiều cây độc lập. GBDT thường cho điểm cao hơn trên Kaggle nhưng cần tune η, max_depth, reg_alpha, early stopping. RF là baseline tốt để so sánh.",
  },
];

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ──────────────────────────────────────────────────────────── */
export default function GradientBoostingTopic() {
  const [round, setRound] = useState(0);
  const [showTree, setShowTree] = useState(true);
  const [showResidual, setShowResidual] = useState(true);
  const [libId, setLibId] = useState<LibRow["id"]>("xgb");

  const predictions = useMemo(() => predictAll(round), [round]);
  const residuals = useMemo(() => residualsAt(round), [round]);
  const mse = useMemo(() => mseAt(round), [round]);
  const selectedLib = useMemo(
    () => LIBRARIES.find((l) => l.id === libId)!,
    [libId],
  );

  /* Đường bậc thang của cây vừa thêm (round > 0): tree index = round - 1 */
  const currentTreePath = useMemo(() => {
    if (round === 0) return null;
    const treeFn = WEAK_TREES[round - 1];
    const xs = Array.from({ length: 200 }, (_, i) => (i / 199) * 10);
    const deltas = xs.map((x) => treeFn(x));
    return { xs, deltas };
  }, [round]);

  /* Dự đoán trước đó (để highlight phần CÂY mới đóng góp) */
  const prevPredictions = useMemo(
    () => (round === 0 ? predictAll(0) : predictAll(round - 1)),
    [round],
  );

  const next = useCallback(
    () => setRound((r) => Math.min(N_ROUNDS, r + 1)),
    [],
  );
  const prev = useCallback(() => setRound((r) => Math.max(0, r - 1)), []);
  const reset = useCallback(() => setRound(0), []);

  const maxMSE = MSE_HISTORY[0];

  return (
    <>
      {/* ═══════════════ STEP 1: PREDICTION GATE ═══════════════ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn đoán giá nhà sai 30%. Một người khác nhìn đúng phần sai 30% đó và sửa — còn lệch 15%. Người thứ ba sửa tiếp phần 15% còn lại. Mỗi lượt sửa như thế, sai số tổng thể thay đổi thế nào?"
          options={[
            "Sai số giảm dần mỗi lượt — tổng dự đoán tiến gần đáp án đúng",
            "Sai số không đổi — mỗi người sửa một phần lại tạo ra lỗi mới",
            "Sai số tăng lên vì càng nhiều người sửa càng rối",
            "Không đủ thông tin để biết",
          ]}
          correct={0}
          explanation="Đúng. Mỗi người chỉ tập trung vào RESIDUAL — phần sai còn sót lại sau bước trước. Đây chính là trực giác của Gradient Boosting: dự đoán cuối = tổng của mô hình gốc + các 'miếng vá' chuyên sửa sai."
        >
          <p className="mt-2 text-sm text-muted">
            Hãy ghi nhớ ý tưởng này — chỉ trong vài phút nữa bạn sẽ thấy nó
            biến thành một thuật toán thắng hàng loạt cuộc thi Kaggle.
          </p>

          {/* ═══════════════ STEP 2: ANALOGY + VISUALIZATION ═══════════════ */}
          <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
            <div className="mb-4 rounded-xl border border-border bg-card p-4">
              <p className="text-sm font-semibold text-foreground mb-1">
                Phép so sánh: thợ làm tượng
              </p>
              <p className="text-sm text-muted leading-relaxed">
                Hình dung một người thợ điêu khắc: đầu tiên đục khối đá thô
                thành hình dáng chung (đây là <em>dự đoán gốc</em> — trung
                bình của tất cả y). Sau đó dùng đục nhỏ hơn chỉnh các đường
                cong (cây thứ 1). Rồi dao tỉa nhỏ hơn nữa để ra chi tiết (cây
                thứ 2). Cuối cùng là giấy nhám mịn (cây thứ 5). Mỗi công cụ
                chỉ xử lý phần chưa hoàn thiện — không ai làm lại từ đầu.
                Gradient Boosting hoạt động đúng như vậy trên một tập điểm
                dữ liệu.
              </p>
            </div>

            <VisualizationSection>
              <div className="space-y-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-base font-semibold text-foreground">
                    5 cây yếu được thêm tuần tự — fit trên residual
                  </h3>
                  <span className="text-xs text-muted">
                    η = {ETA}, {N_POINTS} điểm dữ liệu
                  </span>
                </div>
                <p className="text-sm text-muted">
                  Nhấn{" "}
                  <strong className="text-foreground">&quot;Vòng tiếp&quot;</strong>{" "}
                  để thêm một cây. Quan sát ba điều cùng lúc: (1) đường dự
                  đoán cam tiến gần điểm xanh, (2) đoạn đỏ (residual) ngắn
                  lại, (3) MSE bên phải giảm nhanh rồi chậm lại.
                </p>

                {/* ─── SCATTER + ĐƯỜNG FIT ─── */}
                <svg
                  viewBox={`0 0 ${VIZ_W} ${VIZ_H}`}
                  className="w-full rounded-lg border border-border bg-background"
                >
                  {/* Trục */}
                  <line
                    x1={PAD_L}
                    y1={VIZ_H - PAD_B}
                    x2={VIZ_W - PAD_R}
                    y2={VIZ_H - PAD_B}
                    stroke="currentColor"
                    className="text-muted"
                    strokeWidth={0.8}
                    opacity={0.5}
                  />
                  <line
                    x1={PAD_L}
                    y1={PAD_T}
                    x2={PAD_L}
                    y2={VIZ_H - PAD_B}
                    stroke="currentColor"
                    className="text-muted"
                    strokeWidth={0.8}
                    opacity={0.5}
                  />
                  {/* Lưới ngang */}
                  {[0, 0.25, 0.5, 0.75, 1].map((p) => {
                    const yPix = PAD_T + p * (VIZ_H - PAD_T - PAD_B);
                    return (
                      <line
                        key={p}
                        x1={PAD_L}
                        y1={yPix}
                        x2={VIZ_W - PAD_R}
                        y2={yPix}
                        stroke="currentColor"
                        className="text-muted"
                        opacity={0.08}
                        strokeWidth={0.5}
                      />
                    );
                  })}

                  {/* Đường y = 0 */}
                  {Y_MIN < 0 && Y_MAX > 0 && (
                    <line
                      x1={PAD_L}
                      y1={yToPx(0)}
                      x2={VIZ_W - PAD_R}
                      y2={yToPx(0)}
                      stroke="currentColor"
                      className="text-muted"
                      opacity={0.2}
                      strokeDasharray="2 3"
                    />
                  )}

                  {/* Đường cong TRUE (tham khảo, mờ) */}
                  <path
                    d={
                      "M " +
                      Array.from({ length: 120 }, (_, i) => {
                        const xv = (i / 119) * 10;
                        const yv = Math.sin(xv) * 4 + 0.3 * xv;
                        return `${xToPx(xv).toFixed(2)},${yToPx(yv).toFixed(2)}`;
                      }).join(" L ")
                    }
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth={1}
                    opacity={0.25}
                  />

                  {/* Đường cây mới (bậc thang, tím) */}
                  {showTree && currentTreePath && (
                    <AnimatePresence mode="wait">
                      <motion.path
                        key={`tree-${round}`}
                        d={
                          "M " +
                          currentTreePath.xs
                            .map((x, i) => {
                              // đặt cây ở dưới đáy biểu đồ, tỉ lệ lại
                              const yBase = Y_MIN + 1.0;
                              const yShow = yBase + currentTreePath.deltas[i];
                              return `${xToPx(x).toFixed(2)},${yToPx(yShow).toFixed(2)}`;
                            })
                            .join(" L ")
                        }
                        fill="none"
                        stroke="#8b5cf6"
                        strokeWidth={1.5}
                        strokeDasharray="4 3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.85 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                      />
                    </AnimatePresence>
                  )}

                  {/* Đường dự đoán cộng dồn (cam) */}
                  <motion.path
                    d={
                      "M " +
                      X_VALUES.map(
                        (x, i) =>
                          `${xToPx(x).toFixed(2)},${yToPx(predictions[i]).toFixed(2)}`,
                      ).join(" L ")
                    }
                    fill="none"
                    stroke="#f97316"
                    strokeWidth={2}
                    initial={false}
                    animate={{ opacity: 1 }}
                    transition={{ type: "spring", stiffness: 80, damping: 14 }}
                  />

                  {/* Residual: đoạn thẳng đỏ dọc từ pred → true */}
                  {showResidual &&
                    X_VALUES.map((x, i) => {
                      const x1 = xToPx(x);
                      const y1 = yToPx(predictions[i]);
                      const y2 = yToPx(Y_TRUE[i]);
                      if (Math.abs(y1 - y2) < 1.5) return null;
                      return (
                        <motion.line
                          key={`res-${i}`}
                          x1={x1}
                          y1={y1}
                          x2={x1}
                          y2={y2}
                          stroke="#ef4444"
                          strokeWidth={1.2}
                          strokeDasharray="3 2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.7 }}
                          transition={{ duration: 0.3 }}
                        />
                      );
                    })}

                  {/* Điểm thật (xanh) */}
                  {X_VALUES.map((x, i) => (
                    <circle
                      key={`true-${i}`}
                      cx={xToPx(x)}
                      cy={yToPx(Y_TRUE[i])}
                      r={3.5}
                      fill="#3b82f6"
                      opacity={0.85}
                    />
                  ))}

                  {/* Điểm dự đoán (cam nhỏ hơn) */}
                  {X_VALUES.map((x, i) => (
                    <motion.circle
                      key={`pred-${i}`}
                      cx={xToPx(x)}
                      cy={yToPx(predictions[i])}
                      r={2.3}
                      fill="#f97316"
                      initial={false}
                      animate={{
                        cx: xToPx(x),
                        cy: yToPx(predictions[i]),
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 120,
                        damping: 16,
                      }}
                    />
                  ))}

                  {/* Tiêu đề trong SVG */}
                  <text
                    x={PAD_L}
                    y={12}
                    fontSize={11}
                    fill="#f97316"
                    fontWeight={700}
                  >
                    Vòng {round}/{N_ROUNDS}
                  </text>
                  <text
                    x={PAD_L + 80}
                    y={12}
                    fontSize={10}
                    fill="currentColor"
                    className="text-muted"
                  >
                    MSE = {mse.toFixed(2)}
                  </text>

                  {/* Legend */}
                  <g transform={`translate(${VIZ_W - 130}, 8)`}>
                    <circle cx={4} cy={4} r={3} fill="#3b82f6" />
                    <text
                      x={12}
                      y={7}
                      fontSize={9}
                      fill="currentColor"
                      className="text-muted"
                    >
                      y thực
                    </text>
                    <circle cx={50} cy={4} r={2.5} fill="#f97316" />
                    <text
                      x={58}
                      y={7}
                      fontSize={9}
                      fill="currentColor"
                      className="text-muted"
                    >
                      dự đoán
                    </text>
                    <line
                      x1={0}
                      y1={16}
                      x2={12}
                      y2={16}
                      stroke="#ef4444"
                      strokeDasharray="3 2"
                    />
                    <text
                      x={15}
                      y={19}
                      fontSize={9}
                      fill="currentColor"
                      className="text-muted"
                    >
                      residual
                    </text>
                    <line
                      x1={60}
                      y1={16}
                      x2={72}
                      y2={16}
                      stroke="#8b5cf6"
                      strokeDasharray="4 3"
                    />
                    <text
                      x={75}
                      y={19}
                      fontSize={9}
                      fill="currentColor"
                      className="text-muted"
                    >
                      cây mới
                    </text>
                  </g>
                </svg>

                {/* ─── BIỂU ĐỒ LOSS ─── */}
                <div className="rounded-lg border border-border bg-card p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium text-muted">
                      MSE qua từng vòng
                    </p>
                    <p className="text-xs text-muted">
                      <span className="text-foreground font-semibold">
                        {mse.toFixed(2)}
                      </span>{" "}
                      / ban đầu {maxMSE.toFixed(2)} →{" "}
                      <span className="text-emerald-500 font-semibold">
                        giảm{" "}
                        {(((maxMSE - mse) / maxMSE) * 100).toFixed(0)}%
                      </span>
                    </p>
                  </div>
                  <svg viewBox="0 0 320 80" className="w-full">
                    {/* Trục ngang */}
                    <line
                      x1={20}
                      y1={65}
                      x2={310}
                      y2={65}
                      stroke="currentColor"
                      className="text-muted"
                      strokeWidth={0.5}
                      opacity={0.4}
                    />
                    {/* Đường loss */}
                    <path
                      d={
                        "M " +
                        MSE_HISTORY.map((m, r) => {
                          const x = 20 + (r / N_ROUNDS) * 280;
                          const y = 65 - (m / maxMSE) * 55;
                          return `${x.toFixed(1)},${y.toFixed(1)}`;
                        }).join(" L ")
                      }
                      fill="none"
                      stroke="#f97316"
                      strokeWidth={1.5}
                      opacity={0.5}
                    />
                    {/* Điểm cho mỗi round */}
                    {MSE_HISTORY.map((m, r) => {
                      const x = 20 + (r / N_ROUNDS) * 280;
                      const y = 65 - (m / maxMSE) * 55;
                      const current = r === round;
                      return (
                        <g key={r}>
                          <circle
                            cx={x}
                            cy={y}
                            r={current ? 5 : 3}
                            fill={current ? "#f97316" : "#e2e8f0"}
                            stroke={current ? "#f97316" : "#94a3b8"}
                            strokeWidth={1}
                          />
                          <text
                            x={x}
                            y={78}
                            fontSize={8}
                            fill={current ? "#f97316" : "currentColor"}
                            className={
                              current ? "" : "text-muted"
                            }
                            textAnchor="middle"
                            fontWeight={current ? 700 : 400}
                          >
                            R{r}
                          </text>
                          {current && (
                            <text
                              x={x}
                              y={y - 8}
                              fontSize={8}
                              fill="#f97316"
                              textAnchor="middle"
                              fontWeight={700}
                            >
                              {m.toFixed(2)}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* ─── ĐIỀU KHIỂN ─── */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={prev}
                    disabled={round === 0}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground disabled:opacity-30"
                  >
                    ← Lùi
                  </button>
                  <button
                    onClick={next}
                    disabled={round === N_ROUNDS}
                    className="rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-30"
                  >
                    Vòng tiếp →
                  </button>
                  <button
                    onClick={reset}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
                  >
                    Đặt lại
                  </button>
                  <span className="mx-2 text-muted">|</span>
                  <label className="inline-flex items-center gap-1.5 text-xs text-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showResidual}
                      onChange={(e) => setShowResidual(e.target.checked)}
                      className="accent-red-500"
                    />
                    residual
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs text-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showTree}
                      onChange={(e) => setShowTree(e.target.checked)}
                      className="accent-violet-500"
                    />
                    cây mới
                  </label>
                </div>

                {/* Hiển thị residual dạng thanh */}
                <div className="rounded-lg border border-border bg-card p-3">
                  <p className="mb-2 text-xs font-medium text-muted">
                    Residual từng điểm (y − F
                    <sub>{round}</sub>(x))
                  </p>
                  <svg viewBox="0 0 320 70" className="w-full">
                    <line
                      x1={10}
                      y1={35}
                      x2={310}
                      y2={35}
                      stroke="currentColor"
                      className="text-muted"
                      strokeWidth={0.5}
                      opacity={0.3}
                    />
                    {residuals.map((r, i) => {
                      const x = 15 + i * 19;
                      const h = Math.min(28, Math.abs(r) * 7);
                      const up = r >= 0;
                      return (
                        <motion.rect
                          key={i}
                          x={x}
                          y={up ? 35 - h : 35}
                          width={12}
                          height={h}
                          fill={up ? "#22c55e" : "#ef4444"}
                          opacity={0.75}
                          rx={1}
                          initial={false}
                          animate={{
                            height: h,
                            y: up ? 35 - h : 35,
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 140,
                            damping: 18,
                          }}
                        />
                      );
                    })}
                    <text
                      x={10}
                      y={55}
                      fontSize={8}
                      fill="currentColor"
                      className="text-muted"
                    >
                      + dưới đường (pred cao hơn y)
                    </text>
                    <text
                      x={170}
                      y={55}
                      fontSize={8}
                      fill="currentColor"
                      className="text-muted"
                    >
                      − trên đường (pred thấp hơn y)
                    </text>
                  </svg>
                </div>

                {/* Chú thích pedagogical */}
                <div className="rounded-lg border-l-4 border-l-accent bg-accent/5 p-3 text-sm">
                  <p className="text-muted leading-relaxed">
                    {round === 0 && (
                      <>
                        <strong className="text-foreground">
                          Vòng 0:
                        </strong>{" "}
                        F<sub>0</sub>(x) = trung bình của y ={" "}
                        {Y_MEAN.toFixed(2)}. Mọi dự đoán đều là một đường
                        thẳng. Các đoạn đỏ dài = residual lớn = công việc
                        cho những cây tiếp theo.
                      </>
                    )}
                    {round === 1 && (
                      <>
                        <strong className="text-foreground">
                          Vòng 1:
                        </strong>{" "}
                        Cây đầu tiên fit trên residual ở vòng 0. Nó bắt
                        được pha chính của đường sin — residual giảm mạnh.
                      </>
                    )}
                    {round === 2 && (
                      <>
                        <strong className="text-foreground">
                          Vòng 2:
                        </strong>{" "}
                        Cây thứ hai chỉ nhìn phần sai còn lại. Chú ý nó
                        nông và chỉ chỉnh vài vùng — weak learner là vậy.
                      </>
                    )}
                    {round === 3 && (
                      <>
                        <strong className="text-foreground">
                          Vòng 3:
                        </strong>{" "}
                        Residual đã nhỏ. Cây 3 chỉ chỉnh biên độ vài vùng
                        — đóng góp nhỏ hơn.
                      </>
                    )}
                    {round === 4 && (
                      <>
                        <strong className="text-foreground">
                          Vòng 4:
                        </strong>{" "}
                        Gần như đã fit xong. Cây 4 tinh chỉnh thêm chút —
                        learning rate η giữ cho nó không 'bồi đắp' quá
                        mạnh.
                      </>
                    )}
                    {round === 5 && (
                      <>
                        <strong className="text-foreground">
                          Vòng 5:
                        </strong>{" "}
                        Residual đã rất nhỏ (chủ yếu là noise). Thêm cây
                        nữa bắt đầu nguy hiểm → đây là lúc early stopping
                        kiểm tra validation.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </VisualizationSection>
          </LessonSection>

          {/* ═══════════════ STEP 3: AHA MOMENT ═══════════════ */}
          <LessonSection
            step={3}
            totalSteps={TOTAL_STEPS}
            label="Khoảnh khắc Aha"
          >
            <AhaMoment>
              <p>
                <strong>Gradient Boosting</strong> xây mô hình NỐI TIẾP — mỗi
                cây mới chỉ học phần RESIDUAL của tổ hợp trước. Tên
                &quot;Gradient&quot; xuất hiện vì với loss bình phương,
                residual chính là <em>gradient âm</em> của loss theo dự đoán.
                Thêm một cây là đi một bước gradient descent — nhưng trong
                không gian <strong>hàm số</strong>, không phải trong không
                gian tham số.
              </p>
            </AhaMoment>
          </LessonSection>

          {/* ═══════════════ STEP 4: CHALLENGES ═══════════════ */}
          <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
            <div className="space-y-4">
              <InlineChallenge
                question="Gradient Boosting với 1000 cây và learning rate η = 1.0. Điều gì có xu hướng xảy ra trên tập test?"
                options={[
                  "Mô hình cực kỳ chính xác trên cả train và test vì có nhiều cây",
                  "Mỗi cây đóng góp toàn phần → các cây sau 'chồng mạnh' lên nhau → overfit nghiêm trọng, test error tệ",
                  "Kết quả giống hệt η = 0.1 vì số cây lớn sẽ bù lại",
                  "Training loss tăng sau một số vòng",
                ]}
                correct={1}
                explanation="η = 1 nghĩa là tin tưởng tuyệt đối vào mỗi cây yếu — không 'shrinkage'. Training loss giảm nhanh, nhưng mô hình học cả noise. Thực tế dùng η ∈ [0.01, 0.1] và early stopping."
              />

              <InlineChallenge
                question="Sau 3 cây, tập X có residual gần 0 nhưng tập test vẫn lỗi cao. Chỉ số nào đang cho tín hiệu?"
                options={[
                  "Bias quá lớn — cần cây sâu hơn",
                  "Khoảng cách train-MSE vs validation-MSE đang lớn và càng mở rộng → dấu hiệu OVERFIT, nên dừng sớm hoặc giảm max_depth / tăng reg",
                  "Learning rate quá nhỏ",
                  "Dataset có bug",
                ]}
                correct={1}
                explanation="Gap giữa train loss và val loss là chỉ báo chính của overfit. Giải pháp: early_stopping_rounds, tăng min_child_weight / min_data_in_leaf, giảm max_depth, tăng subsample/colsample_bytree, hoặc thêm L1/L2 reg (reg_alpha / reg_lambda)."
              />
            </div>
          </LessonSection>

          {/* ═══════════════ STEP 5: EXPLANATION ═══════════════ */}
          <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
            <ExplanationSection>
              <p>
                <strong>Gradient Boosting</strong> là một họ thuật toán
                ensemble thuộc nhóm{" "}
                <TopicLink slug="bias-variance">boosting</TopicLink>, xây
                dựng mô hình dự đoán dưới dạng tổng cộng dồn các hàm đơn
                giản:
              </p>

              <LaTeX block>
                {"F_M(x) \\;=\\; F_0(x) + \\eta \\sum_{m=1}^{M} h_m(x)"}
              </LaTeX>

              <p>
                Trong đó <LaTeX>{"F_0"}</LaTeX> là dự đoán khởi tạo (thường
                là trung bình <LaTeX>{"\\bar{y}"}</LaTeX> cho hồi quy, hoặc
                log-odds cho phân loại), <LaTeX>{"h_m"}</LaTeX> là một
                &quot;weak learner&quot; (thường là{" "}
                <TopicLink slug="decision-trees">cây quyết định</TopicLink>{" "}
                nông, độ sâu 3–8), và <LaTeX>{"\\eta"}</LaTeX> là{" "}
                <em>learning rate</em> (còn gọi là shrinkage) kiểm soát đóng
                góp của từng cây.
              </p>

              <p>
                Huấn luyện cây <LaTeX>{"h_m"}</LaTeX> theo công thức
                residual:
              </p>

              <LaTeX block>
                {
                  "r_i^{(m)} \\;=\\; y_i - F_{m-1}(x_i) \\;=\\; -\\left.\\frac{\\partial L(y_i, F(x_i))}{\\partial F(x_i)}\\right|_{F = F_{m-1}}"
                }
              </LaTeX>

              <p>
                Khi <LaTeX>{"L(y, F) = \\tfrac{1}{2}(y - F)^2"}</LaTeX>,
                residual thông thường TRÙNG với gradient âm. Với các loss
                khác (log-loss, Huber, Quantile…), ta dùng{" "}
                <em>pseudo-residual</em> bằng gradient âm tương ứng — đó là
                lý do thuật toán vẫn được gọi là Gradient Boosting khi mở
                rộng sang phân loại.
              </p>

              <Callout variant="tip" title="Ví dụ: dự giá nhà Hà Nội">
                Vòng 0: dự đoán giá trung bình 3.5 tỷ cho mọi căn.
                {"\n"}Vòng 1: cây 1 chia theo quận — nội thành +2 tỷ, ngoại
                thành −1 tỷ. Residual giảm.
                {"\n"}Vòng 2: cây 2 nhìn phần sai còn lại — căn có thang máy
                +0.4 tỷ, chung cư cũ −0.3 tỷ.
                {"\n"}Vòng 3: cây 3 bắt được 'căn gần ga metro' +0.2 tỷ.
                {"\n"}Mỗi vòng tinh chỉnh thêm, như thợ chỉnh đồng hồ từ thô
                đến tinh.
              </Callout>

              <p>
                <strong>Kết nối với gradient descent.</strong> Trong mạng
                nơ-ron, ta cập nhật tham số{" "}
                <LaTeX>{"\\theta_{t+1} = \\theta_t - \\eta \\nabla L"}</LaTeX>
                . Trong Gradient Boosting, ta cập nhật HÀM số:{" "}
                <LaTeX>{"F_{m} = F_{m-1} - \\eta \\cdot \\nabla L"}</LaTeX>,
                nhưng không gian hàm là vô hạn chiều — nên ta{" "}
                <em>xấp xỉ</em> gradient bằng một cây quyết định khớp gần
                nhất với các pseudo-residual.
              </p>

              <p>
                <strong>Newton boosting (XGBoost).</strong> XGBoost không
                chỉ dùng gradient <LaTeX>{"g_i"}</LaTeX> mà còn dùng hessian{" "}
                <LaTeX>{"h_i = \\partial^2 L / \\partial F^2"}</LaTeX>. Hàm
                mục tiêu tối ưu xấp xỉ bậc 2:
              </p>

              <LaTeX block>
                {
                  "\\tilde{\\mathcal{L}}^{(m)} = \\sum_i \\left[ g_i f(x_i) + \\tfrac{1}{2} h_i f(x_i)^2 \\right] + \\Omega(f)"
                }
              </LaTeX>

              <p>
                Với <LaTeX>{"\\Omega(f) = \\gamma T + \\tfrac{1}{2} \\lambda \\|w\\|^2"}</LaTeX>
                là regularization — phạt cây có nhiều lá và lá có giá trị
                lớn. Đây là khác biệt kỹ thuật quan trọng giữa XGBoost và
                GBM truyền thống.
              </p>

              <CodeBlock
                language="python"
                title="Ba cú pháp quen thuộc — XGBoost, LightGBM, CatBoost"
              >{`import xgboost as xgb
import lightgbm as lgb
from catboost import CatBoostRegressor
from sklearn.datasets import fetch_california_housing
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error

X, y = fetch_california_housing(return_X_y=True)
X_tr, X_va, y_tr, y_va = train_test_split(X, y, test_size=0.2, random_state=42)

# ── XGBoost ──────────────────────────────────────────────────
xgb_model = xgb.XGBRegressor(
    n_estimators=2000,
    learning_rate=0.05,
    max_depth=6,
    subsample=0.8,
    colsample_bytree=0.8,
    reg_alpha=0.1,       # L1 trên weight lá
    reg_lambda=1.0,      # L2 trên weight lá
    tree_method="hist",  # histogram — nhanh
    random_state=42,
    early_stopping_rounds=50,
)
xgb_model.fit(X_tr, y_tr, eval_set=[(X_va, y_va)], verbose=False)
print("XGBoost MSE:", mean_squared_error(y_va, xgb_model.predict(X_va)))

# ── LightGBM ─────────────────────────────────────────────────
lgb_model = lgb.LGBMRegressor(
    n_estimators=2000,
    learning_rate=0.05,
    num_leaves=63,       # leaf-wise — tham số CHÍNH
    min_data_in_leaf=40,
    subsample=0.8,
    feature_fraction=0.8,
    random_state=42,
)
lgb_model.fit(
    X_tr, y_tr,
    eval_set=[(X_va, y_va)],
    callbacks=[lgb.early_stopping(50), lgb.log_evaluation(0)],
)
print("LightGBM MSE:", mean_squared_error(y_va, lgb_model.predict(X_va)))

# ── CatBoost ─────────────────────────────────────────────────
cat_model = CatBoostRegressor(
    iterations=2000,
    learning_rate=0.05,
    depth=6,             # oblivious tree, depth quyết định kích cỡ
    l2_leaf_reg=3.0,
    od_type="Iter",
    od_wait=50,          # early stopping
    verbose=False,
    random_state=42,
)
cat_model.fit(X_tr, y_tr, eval_set=(X_va, y_va))
print("CatBoost MSE:", mean_squared_error(y_va, cat_model.predict(X_va)))`}</CodeBlock>

              <p>
                <strong>Mã giả thuật toán gốc (Friedman, 2001).</strong>{" "}
                Dưới đây là phiên bản không phụ thuộc thư viện, viết với
                <code>scikit-learn</code> để bạn thấy mọi thứ &quot;từ đáy
                lên&quot;:
              </p>

              <CodeBlock
                language="python"
                title="Gradient Boosting từ số không bằng DecisionTreeRegressor"
              >{`import numpy as np
from sklearn.tree import DecisionTreeRegressor

class GradientBoostingFromScratch:
    def __init__(self, n_estimators=100, learning_rate=0.1, max_depth=3):
        self.n_estimators = n_estimators
        self.eta = learning_rate
        self.max_depth = max_depth
        self.trees = []
        self.F0 = 0.0

    def fit(self, X, y):
        # F0: dự đoán khởi tạo — trung bình tối ưu cho MSE
        self.F0 = float(np.mean(y))
        F = np.full_like(y, self.F0, dtype=float)

        for m in range(self.n_estimators):
            # pseudo-residual = gradient âm của MSE = y - F
            residual = y - F

            # Fit cây vào residual (weak learner)
            tree = DecisionTreeRegressor(max_depth=self.max_depth)
            tree.fit(X, residual)

            # Cập nhật F với learning rate
            update = tree.predict(X)
            F = F + self.eta * update
            self.trees.append(tree)

        return self

    def predict(self, X):
        F = np.full(X.shape[0], self.F0, dtype=float)
        for tree in self.trees:
            F += self.eta * tree.predict(X)
        return F

# Dùng thử:
# model = GradientBoostingFromScratch(n_estimators=500, learning_rate=0.05, max_depth=4)
# model.fit(X_tr, y_tr)
# preds = model.predict(X_va)`}</CodeBlock>

              <Callout
                variant="insight"
                title="Shrinkage — 'tin ít hơn' là 'học tốt hơn'"
              >
                Friedman chứng minh empirically: học chậm với η nhỏ (0.01 –
                0.1) và nhiều cây luôn generalize tốt hơn là học nhanh với η
                lớn. Trực giác: mỗi cây nhỏ là ước lượng NHIỄU của gradient,
                cộng nhiều bước nhỏ trung bình sẽ triệt tiêu nhiễu; cộng một
                bước lớn thì nhiễu giữ nguyên.
              </Callout>

              <Callout
                variant="warning"
                title="Ba tội đồ overfit phổ biến"
              >
                (1) max_depth quá sâu → cây bắt nhiễu. Giữ 3–8.{"\n"}
                (2) learning_rate quá lớn khi n_estimators nhỏ → mỗi cây
                đóng góp mạnh, không có thời gian để trung bình.{"\n"}
                (3) Không dùng validation + early stopping → mô hình chạy
                đến cuối, overfit âm thầm. LUÔN theo dõi val loss.
              </Callout>

              <Callout
                variant="info"
                title="Tại sao không áp dụng Deep Learning thay luôn?"
              >
                Trên dữ liệu BẢNG (tabular) cỡ 10k–1M hàng, GBDT hầu như
                luôn thắng hoặc ngang neural net (benchmark của Shwartz-Ziv
                & Armon 2022, Grinsztajn 2022). Lý do: GBDT xử lý feature
                dạng số và categorical không đều mượt mà, không cần
                normalize, tự chọn feature, và có bias phù hợp với cấu trúc
                cây của dữ liệu bảng.
              </Callout>

              <p>
                <strong>Ba biến thể phổ biến — khi nào chọn gì?</strong>{" "}
                Chọn thư viện bên dưới để xem đối sánh chi tiết:
              </p>

              <div className="my-3 flex flex-wrap gap-2">
                {LIBRARIES.map((lib) => (
                  <button
                    key={lib.id}
                    onClick={() => setLibId(lib.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      libId === lib.id
                        ? "text-white"
                        : "bg-card border border-border text-muted hover:text-foreground"
                    }`}
                    style={
                      libId === lib.id
                        ? { backgroundColor: lib.color }
                        : undefined
                    }
                  >
                    {lib.name}
                  </button>
                ))}
              </div>

              <div
                className="rounded-xl border p-4 text-sm"
                style={{
                  borderColor: selectedLib.color + "55",
                  backgroundColor: selectedLib.color + "0f",
                }}
              >
                <p
                  className="mb-2 text-base font-bold"
                  style={{ color: selectedLib.color }}
                >
                  {selectedLib.name}
                </p>
                <ul className="space-y-1 text-muted">
                  <li>
                    <strong className="text-foreground">
                      Chiến lược tách:
                    </strong>{" "}
                    {selectedLib.strategy}
                  </li>
                  <li>
                    <strong className="text-foreground">Cấu trúc cây:</strong>{" "}
                    {selectedLib.tree}
                  </li>
                  <li>
                    <strong className="text-foreground">Tốc độ:</strong>{" "}
                    {selectedLib.speed}
                  </li>
                  <li>
                    <strong className="text-foreground">Missing:</strong>{" "}
                    {selectedLib.missing}
                  </li>
                  <li>
                    <strong className="text-foreground">Categorical:</strong>{" "}
                    {selectedLib.categorical}
                  </li>
                  <li>
                    <strong className="text-foreground">Phù hợp:</strong>{" "}
                    {selectedLib.bestFor}
                  </li>
                </ul>
              </div>

              <CollapsibleDetail title="Đi sâu: Histogram binning — vì sao LightGBM nhanh bất thường?">
                <p>
                  GBM gốc sắp xếp toàn bộ giá trị của mỗi feature để tìm
                  điểm tách tối ưu — O(N log N) cho mỗi tách, với N =
                  #samples. Khi N = 10 triệu, điều này rất tốn.
                </p>
                <p className="mt-2">
                  Histogram binning: nhóm giá trị feature vào{" "}
                  <em>k</em> bin (thường k = 255, vừa một byte). Tìm điểm
                  tách chỉ cần quét qua k-1 ngưỡng — O(k) cho mỗi tách, K
                  cố định. LightGBM còn dùng thêm:
                </p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li>
                    <strong>GOSS</strong> (Gradient-based One-Side Sampling):
                    giữ tất cả sample có gradient lớn + lấy ngẫu nhiên một
                    phần nhỏ sample có gradient nhỏ → đỡ tính toán nhưng
                    vẫn chính xác.
                  </li>
                  <li>
                    <strong>EFB</strong> (Exclusive Feature Bundling): gom
                    các feature thưa (sparse) ít khi non-zero cùng lúc vào
                    một &quot;bundle&quot; để giảm số feature thực.
                  </li>
                </ul>
                <p className="mt-2">
                  Kết hợp cả ba, LightGBM có thể huấn luyện trên 10M hàng ×
                  100 cột trên một laptop trong vài phút — điều mà GBM
                  scikit-learn phải mất hàng giờ.
                </p>
              </CollapsibleDetail>

              <CollapsibleDetail title="Đi sâu: Monotonic constraints và interaction constraints">
                <p>
                  Trong nhiều bài toán business (tín dụng, bảo hiểm,
                  pricing), ta biết trước quan hệ monotonic: ví dụ &quot;thu
                  nhập càng cao, xác suất được duyệt càng cao&quot;, không
                  thể khác. Cây GBDT thuần túy có thể học ngược chiều nếu
                  có noise.
                </p>
                <p className="mt-2">
                  XGBoost/LightGBM/CatBoost đều hỗ trợ{" "}
                  <code>monotone_constraints</code>: bạn chỉ định{" "}
                  <code>[1, 0, -1, …]</code> cho từng feature (1 = đơn điệu
                  tăng, −1 = giảm, 0 = tự do). Thuật toán chỉ chọn điểm tách
                  thoả mãn ràng buộc → mô hình ổn định và giải thích được
                  cho regulator.
                </p>
                <p className="mt-2">
                  Tương tự <code>interaction_constraints</code> cho phép khai
                  báo &quot;feature A chỉ được tương tác với B, C&quot; —
                  hữu ích để ngăn mô hình tạo ra tương tác giả do noise và
                  dễ SHAP hoá về sau.
                </p>
              </CollapsibleDetail>

              <p>
                <strong>Ứng dụng điển hình.</strong> GBDT là &quot;vũ khí
                mặc định&quot; trên dữ liệu bảng ở nhiều lĩnh vực:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>Tín dụng và rủi ro:</strong> scoring khách hàng,
                  phát hiện gian lận thẻ, dự báo vỡ nợ.
                </li>
                <li>
                  <strong>Quảng cáo và đề xuất:</strong> CTR prediction,
                  ranking (pairwise/listwise), LambdaMART.
                </li>
                <li>
                  <strong>Search ranking:</strong> LightGBM có chế độ{" "}
                  <code>lambdarank</code>; Bing dùng MART biến thể trong
                  production nhiều năm.
                </li>
                <li>
                  <strong>Bán lẻ & chuỗi cung ứng:</strong> dự báo nhu cầu,
                  tồn kho, định giá động.
                </li>
                <li>
                  <strong>Y tế:</strong> dự báo re-admission, triage, phân
                  tầng rủi ro bệnh nhân từ EHR.
                </li>
                <li>
                  <strong>Kaggle & cuộc thi:</strong> giải pháp chiến thắng
                  của hầu hết cuộc thi tabular trong 10 năm qua đều có chứa
                  XGBoost / LightGBM / CatBoost.
                </li>
              </ul>

              <p>
                <strong>Pitfalls thường gặp.</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>Leakage thời gian:</strong> nếu dữ liệu có chiều
                  thời gian mà bạn chia train/test ngẫu nhiên → mô hình
                  &quot;nhìn thấy tương lai&quot;. Luôn split theo thời gian
                  cho bài toán time-aware.
                </li>
                <li>
                  <strong>One-hot blow-up:</strong> feature categorical 10k
                  level mà one-hot → ma trận thưa khổng lồ. Dùng target
                  encoding hoặc để CatBoost / LightGBM xử lý native.
                </li>
                <li>
                  <strong>Sai đo lường (wrong metric):</strong> dùng MSE cho
                  bài toán xếp hạng, hoặc dùng accuracy cho dataset mất cân
                  bằng 99/1. Luôn chọn metric phản ánh business.
                </li>
                <li>
                  <strong>Feature importance ảo:</strong> feature
                  high-cardinality (ID, zipcode) dễ &quot;hút&quot;
                  importance vì cây tách được nhiều lần — dùng{" "}
                  <em>permutation importance</em> hoặc SHAP để kiểm tra.
                </li>
                <li>
                  <strong>Imbalance:</strong> dùng{" "}
                  <code>scale_pos_weight</code> (XGBoost) hoặc{" "}
                  <code>is_unbalance=True</code> (LightGBM) cho phân loại
                  lệch. Tránh undersample ngây thơ.
                </li>
                <li>
                  <strong>Quá nhiều feature noise:</strong> GBDT khá robust
                  nhưng vẫn có thể overfit với hàng nghìn feature rác. Lọc
                  bớt bằng mutual information hoặc baseline RF.
                </li>
              </ul>
            </ExplanationSection>
          </LessonSection>

          {/* ═══════════════ STEP 6: SUMMARY ═══════════════ */}
          <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
            <MiniSummary
              title="6 điều cần nhớ về Gradient Boosting"
              points={[
                "Mô hình tổng = F₀ + η · Σ cây — xây tuần tự, cây m học residual của cộng dồn F_{m-1}.",
                "Residual = gradient âm của loss theo F → từ đó có tên 'Gradient' Boosting; mở rộng được cho log-loss, Huber, Quantile…",
                "Learning rate η là shrinkage: η nhỏ + nhiều cây + early stopping = công thức tiêu chuẩn chống overfit.",
                "XGBoost (level-wise + Newton + reg), LightGBM (leaf-wise + histogram + GOSS/EFB), CatBoost (ordered boosting + native categorical) — ba lựa chọn với thế mạnh khác nhau.",
                "GBDT thắng áp đảo trên dữ liệu BẢNG cỡ trung (10k–10M) — là baseline cần vượt qua trước khi nói tới deep learning.",
                "Random Forest (song song, robust, ít tune) vs Gradient Boosting (nối tiếp, chính xác hơn nhưng cần tune và validation) — chọn theo mục tiêu.",
              ]}
            />
          </LessonSection>

          {/* ═══════════════ STEP 7: QUIZ ═══════════════ */}
          <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
            <QuizSection questions={QUIZ} />
          </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
