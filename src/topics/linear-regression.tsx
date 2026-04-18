"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, CollapsibleDetail, LaTeX, TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "linear-regression",
  title: "Linear Regression",
  titleVi: "Hồi quy tuyến tính",
  description: "Vẽ đường thẳng tốt nhất qua các điểm dữ liệu để dự đoán giá trị liên tục",
  category: "classic-ml",
  tags: ["regression", "supervised-learning", "fundamentals"],
  difficulty: "beginner",
  relatedSlugs: ["polynomial-regression", "logistic-regression", "gradient-descent"],
  vizType: "interactive",
};

/* ── Utilities ── */
type Pt = { x: number; y: number };

function fitLine(points: Pt[]) {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: 160 };
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n };
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function mse(points: Pt[], slope: number, intercept: number) {
  if (points.length === 0) return 0;
  return points.reduce((s, p) => s + (p.y - (slope * p.x + intercept)) ** 2, 0) / points.length;
}

const INITIAL_POINTS: Pt[] = [
  { x: 50, y: 270 }, { x: 100, y: 235 }, { x: 150, y: 210 },
  { x: 200, y: 175 }, { x: 270, y: 145 }, { x: 320, y: 115 },
  { x: 400, y: 80 },
];

const TOTAL_STEPS = 8;

/* ═══════════════ MAIN ═══════════════ */
export default function LinearRegressionTopic() {
  const [points, setPoints] = useState<Pt[]>(INITIAL_POINTS);
  const [dragging, setDragging] = useState<number | null>(null);
  const [showErrors, setShowErrors] = useState(true);

  const { slope, intercept } = useMemo(() => fitLine(points), [points]);
  const lineY = useCallback((x: number) => slope * x + intercept, [slope, intercept]);
  const currentMSE = useMemo(() => mse(points, slope, intercept), [points, slope, intercept]);
  const r2 = useMemo(() => {
    if (points.length < 2) return 0;
    const meanY = points.reduce((s, p) => s + p.y, 0) / points.length;
    const ssTot = points.reduce((s, p) => s + (p.y - meanY) ** 2, 0);
    const ssRes = points.reduce((s, p) => s + (p.y - lineY(p.x)) ** 2, 0);
    return ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);
  }, [points, lineY]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (dragging !== null) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (500 / rect.width);
    const y = (e.clientY - rect.top) * (320 / rect.height);
    setPoints((prev) => [...prev, { x, y }]);
  }, [dragging]);

  const handlePointerDown = (idx: number) => (e: React.PointerEvent) => {
    e.stopPropagation();
    setDragging(idx);
  };

  const handlePointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (dragging === null) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = Math.max(0, Math.min(500, (e.clientX - rect.left) * (500 / rect.width)));
    const y = Math.max(0, Math.min(320, (e.clientY - rect.top) * (320 / rect.height)));
    setPoints((prev) => prev.map((p, i) => (i === dragging ? { x, y } : p)));
  }, [dragging]);

  const handlePointerUp = useCallback(() => setDragging(null), []);

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Hồi quy tuyến tính tối thiểu hoá đại lượng nào?",
      options: [
        "Tổng khoảng cách tuyệt đối từ điểm đến đường thẳng",
        "Tổng bình phương sai số (SSE) giữa giá trị thực và dự đoán",
        "Số điểm nằm xa đường thẳng nhất",
      ],
      correct: 1,
      explanation: "Phương pháp bình phương tối thiểu (OLS) tìm đường thẳng sao cho tổng bình phương khoảng cách dọc từ mỗi điểm đến đường thẳng là nhỏ nhất.",
    },
    {
      question: "Nếu tất cả điểm dữ liệu nằm chính xác trên một đường thẳng, MSE bằng bao nhiêu?",
      options: ["1", "0", "Không xác định"],
      correct: 1,
      explanation: "Khi mọi điểm nằm trên đường hồi quy, sai số tại mỗi điểm bằng 0, nên MSE = 0. Đây là trường hợp khớp hoàn hảo.",
    },
    {
      type: "fill-blank",
      question: "Công thức hồi quy tuyến tính một biến là ŷ = {blank}x + {blank}, trong đó tham số đầu tiên là hệ số góc và tham số thứ hai là hệ số chặn.",
      blanks: [
        { answer: "w1", accept: ["w_1", "w", "slope", "a"] },
        { answer: "w0", accept: ["w_0", "b", "intercept", "bias"] },
      ],
      explanation: "ŷ = w1·x + w0 là dạng chuẩn của hồi quy tuyến tính một biến. w1 (hệ số góc) cho biết: khi x tăng 1 đơn vị, ŷ thay đổi bao nhiêu. w0 (hệ số chặn) là giá trị dự đoán khi x = 0.",
    },
    {
      question: "Khi nào hồi quy tuyến tính KHÔNG phù hợp?",
      options: [
        "Khi dữ liệu có quan hệ tuyến tính rõ ràng",
        "Khi dữ liệu có dạng đường cong (phi tuyến)",
        "Khi có nhiều điểm dữ liệu",
      ],
      correct: 1,
      explanation: "Hồi quy tuyến tính chỉ tìm đường thẳng. Nếu dữ liệu có dạng đường cong, cần dùng hồi quy đa thức hoặc mô hình phức tạp hơn.",
    },
    {
      question: "Bạn tăng gấp đôi một điểm outlier (y gấp đôi giá trị gốc). So với dùng tổng giá trị tuyệt đối (MAE), MSE sẽ phản ứng với outlier đó như thế nào?",
      options: [
        "Giống MAE — tăng tuyến tính theo residual",
        "Mạnh hơn MAE — vì residual được bình phương, gấp đôi residual = gấp bốn phần đóng góp vào loss",
        "Yếu hơn MAE — MSE bỏ qua outlier",
        "Không đổi — loss không phụ thuộc vào y",
      ],
      correct: 1,
      explanation: "MSE bình phương residual, nên outlier ảnh hưởng gấp bội: residual 2× → loss 4×. Đây là lý do OLS nhạy cảm outlier. Giải pháp: chuyển sang MAE (robust regression) hoặc loại bỏ outlier trước khi fit.",
    },
    {
      question: "Bạn có 5 features nhưng chỉ có 8 mẫu dữ liệu. Điều gì có khả năng xảy ra nhất?",
      options: [
        "Mô hình sẽ khớp hoàn hảo trên train và tổng quát tốt trên test",
        "Mô hình dễ overfit — fit được mọi điểm train (R² gần 1) nhưng sai bét trên test",
        "Thuật toán sẽ báo lỗi không thể fit",
        "Kết quả chắc chắn là tuyến tính",
      ],
      correct: 1,
      explanation: "Quy tắc ngón tay cái: cần 10-20 mẫu cho mỗi feature. 5 features × ~15 = cần ~75 mẫu, bạn chỉ có 8 → mô hình có quá nhiều bậc tự do so với dữ liệu. OLS sẽ tìm được đường fit train hoàn hảo nhưng không nắm được pattern thực.",
    },
    {
      question: "R² = 0.92 nghĩa là gì?",
      options: [
        "92% dự đoán đúng chính xác",
        "92% biến thiên của y được mô hình giải thích; 8% còn lại là nhiễu hoặc yếu tố chưa biết",
        "Mô hình đúng 92% các trường hợp",
        "Có 92 mẫu trong tập dữ liệu",
      ],
      correct: 1,
      explanation: "R² (coefficient of determination) đo tỷ lệ variance của y được giải thích bởi mô hình. R² = 0.92 là tốt, nhưng không đồng nghĩa với accuracy — các giá trị dự đoán vẫn có sai số. R² cao có thể ẩn chứa overfitting nếu chưa test trên dữ liệu độc lập.",
    },
    {
      type: "fill-blank",
      question: "Khi dữ liệu quá lớn để tính nghịch đảo ma trận (XᵀX)⁻¹, người ta dùng {blank} để tối ưu dần dần thay cho nghiệm đóng.",
      blanks: [
        { answer: "gradient descent", accept: ["hạ gradient", "gradient descent", "GD", "gradient-descent"] },
      ],
      explanation: "Gradient descent là phương pháp lặp: bắt đầu từ w ngẫu nhiên, cập nhật w ← w − α∇L(w). Không cần tính nghịch đảo ma trận, chạy được cho hàng tỷ mẫu dữ liệu. Đây là nền tảng huấn luyện mọi mô hình deep learning hiện đại.",
    },
  ], []);

  return (
    <>
      {/* STEP 1: PREDICTION GATE */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn bán phở. Nhà hàng ghi lại: ngày nóng 35°C bán 80 tô, ngày mát 25°C bán 120 tô, ngày lạnh 18°C bán 150 tô. Ngày mai dự báo 30°C — bạn nấu bao nhiêu tô?"
          options={["Khoảng 100 tô — nội suy giữa các điểm đã biết", "150 tô — chuẩn bị nhiều cho chắc", "Không đoán được — cần thêm dữ liệu"]}
          correct={0}
          explanation="Bạn vừa tự làm hồi quy tuyến tính trong đầu! Nối các điểm (nhiệt độ, số tô) thành đường thẳng, rồi dóng từ 30°C lên để đọc kết quả."
        />

        <CollapsibleDetail title="4 liên tưởng đời thường (bia hơi, cân lúa, phòng trọ, điểm thi)">
          <div className="space-y-3 text-sm leading-relaxed">
            <p><strong>Bia hơi Tạ Hiện:</strong> trời nóng → bia bán chạy. Linear regression biến cảm giác thành công thức đo được.</p>
            <p><strong>Cân lúa Cần Thơ:</strong> giá ≈ w₁·khối_lượng + w₂·độ_ẩm + w₃·tạp_chất + bias — hồi quy tuyến tính nhiều biến.</p>
            <p><strong>Phòng trọ HUST:</strong> diện tích lớn → giá cao, xa trường → giá rẻ. Mô hình tuyến tính học &quot;công thức ngầm&quot; của thị trường.</p>
            <p><strong>Điểm thi đại học:</strong> dự đoán điểm trung bình từ giờ học thêm, tỉ lệ học sinh/lớp, chi phí giáo dục — baseline chính sách kinh điển.</p>
          </div>
        </CollapsibleDetail>
      </LessonSection>

      {/* STEP 2: BRIDGE + INTERACTIVE VIZ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Bạn vừa nội suy bằng mắt — bây giờ hãy tự tay kéo các điểm dữ liệu và xem máy tính tìm đường thẳng &quot;tốt nhất&quot; như thế nào.
          <strong className="text-foreground">{" "}Nhấp để thêm điểm, kéo để di chuyển.</strong>
        </p>

        <VisualizationSection>
          <div className="space-y-3">
            <svg
              viewBox="0 0 500 320"
              className="w-full cursor-crosshair rounded-lg border border-border bg-background touch-none"
              role="img"
              aria-label={`Biểu đồ hồi quy tương tác: ${points.length} điểm, MSE ${currentMSE.toFixed(1)}, R² ${r2.toFixed(2)}`}
              onClick={handleCanvasClick}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              <title>Đường hồi quy y = {slope.toFixed(2)}x + {intercept.toFixed(0)}, MSE {currentMSE.toFixed(1)}, R² {r2.toFixed(2)}</title>
              {/* Grid */}
              {[0, 80, 160, 240, 320].map((y) => (
                <line key={`gy-${y}`} x1={0} y1={y} x2={500} y2={y} stroke="currentColor" className="text-border" strokeWidth={0.5} />
              ))}
              {[0, 100, 200, 300, 400, 500].map((x) => (
                <line key={`gx-${x}`} x1={x} y1={0} x2={x} y2={320} stroke="currentColor" className="text-border" strokeWidth={0.5} />
              ))}

              {/* Regression line */}
              <motion.line
                x1={0} y1={lineY(0)} x2={500} y2={lineY(500)}
                stroke="#3b82f6" strokeWidth={2.5} strokeDasharray="8 4"
                animate={{ y1: lineY(0), y2: lineY(500) }}
                transition={{ type: "spring", stiffness: 120, damping: 18 }}
              />

              {/* Error lines */}
              <AnimatePresence>
                {showErrors && points.map((p, i) => (
                  <motion.line
                    key={`err-${i}`}
                    x1={p.x} y1={p.y} x2={p.x} y2={lineY(p.x)}
                    stroke="#ef4444" strokeWidth={1.5} opacity={0.5}
                    initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
                  />
                ))}
              </AnimatePresence>

              {/* Error squares (visual) */}
              <AnimatePresence>
                {showErrors && points.map((p, i) => {
                  const err = Math.abs(p.y - lineY(p.x));
                  if (err < 3) return null;
                  const size = Math.min(err, 40);
                  const yStart = Math.min(p.y, lineY(p.x));
                  return (
                    <motion.rect
                      key={`sq-${i}`}
                      x={p.x} y={yStart} width={size} height={size}
                      fill="#ef4444" opacity={0.07}
                      initial={{ opacity: 0 }} animate={{ opacity: 0.07 }} exit={{ opacity: 0 }}
                    />
                  );
                })}
              </AnimatePresence>

              {/* Data points */}
              {points.map((p, i) => (
                <motion.circle
                  key={`pt-${i}`} cx={p.x} cy={p.y} r={6}
                  fill="#f97316" stroke="#fff" strokeWidth={2}
                  className="cursor-grab"
                  animate={{ cx: p.x, cy: p.y }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  onPointerDown={handlePointerDown(i)}
                />
              ))}

              {/* Formula overlay */}
              <text x={10} y={20} fontSize={12} fill="#3b82f6" fontWeight={600}>
                y = {slope.toFixed(2)}x + {intercept.toFixed(0)}
              </text>
              <text x={10} y={38} fontSize={11} fill="currentColor" className="text-muted">
                MSE = {currentMSE.toFixed(1)} · R² = {r2.toFixed(2)}
              </text>
            </svg>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowErrors((v) => !v)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                {showErrors ? "Ẩn sai số" : "Hiện sai số"}
              </button>
              <button
                onClick={() => setPoints(INITIAL_POINTS)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                Đặt lại
              </button>
              <span className="ml-auto text-xs text-muted">
                {points.length} điểm
              </span>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* STEP 3: AHA MOMENT */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Bạn vừa thấy <strong>Hồi quy tuyến tính</strong>{" "}
            hoạt động — máy tính tìm đường thẳng sao cho các ô vuông đỏ (bình phương sai số) có tổng diện tích nhỏ nhất. Kéo một điểm ra xa để thấy MSE tăng vọt!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* STEP 4: INLINE CHALLENGE */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Bạn thêm một điểm rất xa (outlier) vào dữ liệu. Chuyện gì xảy ra với đường hồi quy?"
          options={[
            "Đường thẳng không thay đổi vì outlier bị bỏ qua",
            "Đường thẳng bị kéo lệch về phía outlier",
            "Thuật toán báo lỗi và dừng lại",
          ]}
          correct={1}
          explanation="Vì MSE dùng bình phương sai số, outlier có sai số rất lớn → bình phương càng lớn → đường hồi quy bị kéo về phía nó. Đây là nhược điểm lớn của hồi quy tuyến tính!"
        />

        <div className="mt-6">
          <InlineChallenge
            question="Bạn fit đường hồi quy y = 0.04·(diện tích) + 0.2 (đơn vị: tỷ VNĐ, m²). Một căn 100m² thực tế có giá 5 tỷ. Residual (y − ŷ) của điểm này là bao nhiêu?"
            options={[
              "+0.8 tỷ — mô hình dự đoán thấp hơn giá thực",
              "−0.8 tỷ — mô hình dự đoán cao hơn giá thực",
              "+4.2 tỷ — đây là giá dự đoán",
              "0 — điểm nằm đúng trên đường thẳng",
            ]}
            correct={0}
            explanation="ŷ = 0.04 × 100 + 0.2 = 4.2 tỷ. Residual = y − ŷ = 5 − 4.2 = +0.8 tỷ. Residual dương nghĩa là mô hình underestimate. Nếu bạn thấy nhiều residual dương liên tiếp theo một chiều, có thể quan hệ thực tế phi tuyến (cần polynomial regression)."
          />
        </div>

        <div className="mt-6">
          <InlineChallenge
            question="Đội marketing Shopee Việt Nam fit hồi quy: doanh_thu ≈ 1.2·chi_quảng_cáo + 0.8·số_voucher + 200. Họ tăng chi quảng cáo 10 triệu, dự đoán doanh thu tăng bao nhiêu (giả sử các biến khác giữ nguyên)?"
            options={[
              "+10 triệu — bằng chi quảng cáo",
              "+12 triệu — nhân hệ số 1.2 với 10 triệu",
              "+200 triệu — bằng hệ số chặn",
              "Không dự đoán được nếu không có R²",
            ]}
            correct={1}
            explanation="Diễn giải hệ số: khi chi_quảng_cáo tăng 1 đơn vị (triệu), doanh thu kỳ vọng tăng 1.2 triệu NẾU các biến khác giữ nguyên. Tăng 10 triệu → +12 triệu. Đây là một lý do hồi quy tuyến tính được yêu thích trong kinh doanh: hệ số dễ giải thích trước CEO (khác mạng nơ-ron sâu)."
          />
        </div>
      </LessonSection>

      {/* STEP 5: EXPLANATION */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Hồi quy tuyến tính</strong>{" "}
            tìm hàm tuyến tính khớp dữ liệu tốt nhất theo phương pháp bình phương tối thiểu (OLS):
          </p>

          <LaTeX block>{"\\hat{y} = w_1 x + w_0"}</LaTeX>

          <p>
            Mục tiêu là tối thiểu hoá{" "}
            <strong>Mean Squared Error (MSE)</strong>{" "}
            — đây là một{" "}
            <TopicLink slug="loss-functions">hàm mất mát</TopicLink>{" "}
            phổ biến nhất cho bài toán hồi quy:
          </p>

          <LaTeX block>{"\\text{MSE} = \\frac{1}{n} \\sum_{i=1}^{n} (y_i - \\hat{y}_i)^2"}</LaTeX>

          <p>
            Với dữ liệu 1 biến, công thức nghiệm tối ưu cho hệ số:
          </p>

          <LaTeX block>{"w_1 = \\frac{n\\sum x_i y_i - \\sum x_i \\sum y_i}{n\\sum x_i^2 - (\\sum x_i)^2}, \\quad w_0 = \\bar{y} - w_1 \\bar{x}"}</LaTeX>

          <p>
            Trong thực tế, thay vì tìm nghiệm trực tiếp, người ta thường dùng{" "}
            <TopicLink slug="gradient-descent">gradient descent</TopicLink>{" "}
            để tối ưu dần dần — đặc biệt khi dữ liệu quá lớn để nghịch ma trận.
          </p>

          <Callout variant="tip" title="Tương tự đời thật">
            Giống như bạn bán phở và quan sát: nhiệt độ tăng → số tô giảm. Hồi quy tuyến tính giúp bạn đo chính xác mối quan hệ đó — cứ mỗi độ C tăng thêm, bán ít hơn bao nhiêu tô.
          </Callout>

          <p>
            Với nhiều biến (multiple features), mô hình mở rộng thành:
          </p>

          <LaTeX block>{"\\hat{y} = w_0 + w_1 x_1 + w_2 x_2 + \\cdots + w_d x_d = \\mathbf{w}^T \\mathbf{x}"}</LaTeX>

          <Callout variant="info" title="Diễn giải hệ số trong thực tế">
            Nếu bạn dự đoán giá nhà và nhận được <code>w_diện_tích = 0.04</code>
            (tỷ VNĐ / m²) và <code>w_phòng_ngủ = 0.3</code>, đừng vội kết luận
            &quot;thêm phòng ngủ quý hơn thêm diện tích&quot;. Hệ số phụ thuộc
            vào đơn vị (m² khác phòng), và các biến có thể tương quan với nhau.
            Hãy chuẩn hoá dữ liệu (standardization) rồi mới so sánh độ lớn của w.
          </Callout>

          <CollapsibleDetail title="Dạng ma trận (nâng cao) — nghiệm OLS khi có nhiều biến">
            <p className="text-sm leading-relaxed">
              Khi có d biến, ta gom dữ liệu vào ma trận thiết kế{" "}
              <strong>X</strong> kích thước (n × d+1) — mỗi hàng là một mẫu,
              cột đầu toàn 1 để mô hình hoá hệ số chặn. Vector trọng số{" "}
              <strong>w</strong> tối ưu có công thức đóng (closed-form):
            </p>

            <LaTeX block>{"\\mathbf{w} = (\\mathbf{X}^T \\mathbf{X})^{-1} \\mathbf{X}^T \\mathbf{y}"}</LaTeX>

            <p className="text-sm leading-relaxed">
              Công thức này yêu cầu bạn biết vi tích phân nhiều biến, đại số
              tuyến tính, và nghịch đảo ma trận. Nếu bạn chưa học những phần
              đó, hãy bỏ qua — scikit-learn sẽ tính giúp bạn. Khi nào quay lại
              học sâu hơn, bạn sẽ gặp lại công thức này.
            </p>
            <p className="text-sm leading-relaxed mt-2">
              <strong>Lưu ý thực tế:</strong> khi n hoặc d lớn (hàng triệu
              mẫu, hàng nghìn features), nghịch đảo ma trận quá tốn kém —
              người ta dùng{" "}
              <TopicLink slug="gradient-descent">gradient descent</TopicLink>{" "}
              thay thế.
            </p>
          </CollapsibleDetail>

          <CodeBlock language="python" title="Hồi quy tuyến tính với scikit-learn">
{`from sklearn.linear_model import LinearRegression
import numpy as np

# Dữ liệu: diện tích (m²) → giá nhà (tỷ VNĐ)
X = np.array([[30], [50], [70], [90], [120]])
y = np.array([1.2, 2.0, 2.8, 3.5, 4.5])

model = LinearRegression()
model.fit(X, y)

print(f"Hệ số góc (w1): {model.coef_[0]:.4f}")
print(f"Hệ số chặn (w0): {model.intercept_:.4f}")
print(f"Dự đoán nhà 80m²: {model.predict([[80]])[0]:.2f} tỷ")`}
          </CodeBlock>

          <CodeBlock language="python" title="Đánh giá mô hình với R² và phát hiện outlier">
{`from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_squared_error
import numpy as np

# Dữ liệu giá nhà nhiều features (diện tích, số phòng, tuổi nhà)
X = np.array([
    [30, 1, 10], [50, 2, 5], [70, 2, 8], [90, 3, 3],
    [120, 4, 2], [45, 2, 15], [85, 3, 7], [110, 4, 5],
])
y = np.array([1.2, 2.0, 2.8, 3.5, 4.5, 1.8, 3.3, 4.2])

model = LinearRegression().fit(X, y)
y_pred = model.predict(X)

# R² — tỷ lệ biến thiên được mô hình giải thích (0-1, cao = tốt)
print(f"R²: {r2_score(y, y_pred):.3f}")
print(f"RMSE: {np.sqrt(mean_squared_error(y, y_pred)):.3f} tỷ")

# Phát hiện outlier: mẫu có residual lớn bất thường
residuals = y - y_pred
threshold = 2 * residuals.std()
outlier_idx = np.where(np.abs(residuals) > threshold)[0]
print(f"Chỉ số outlier nghi vấn: {outlier_idx}")`}
          </CodeBlock>

          <Callout variant="tip" title="Cần bao nhiêu dữ liệu?">
            Quy tắc ngón tay cái: ít nhất 10-20 mẫu cho mỗi feature. Với
            một hàm chỉ có 1 biến (diện tích), vài chục điểm là tạm đủ. Nếu
            bạn thêm 20 features (số phòng, tuổi, vị trí...) mà chỉ có 30
            mẫu — gần như chắc chắn overfit.
          </Callout>

          <CollapsibleDetail title="Giả định của hồi quy tuyến tính (nâng cao)">
            <p className="text-sm leading-relaxed mb-2">
              Hồi quy tuyến tính cổ điển có 4 giả định. Khi vi phạm, kết quả
              có thể lệch:
            </p>
            <ol className="list-decimal list-inside text-sm space-y-1 text-foreground/80">
              <li>
                <strong>Linearity:</strong> quan hệ giữa X và y phải tuyến
                tính (vẽ scatter plot kiểm tra).
              </li>
              <li>
                <strong>Independence:</strong> các mẫu độc lập — dữ liệu
                chuỗi thời gian thường vi phạm.
              </li>
              <li>
                <strong>Homoscedasticity:</strong> phương sai sai số đồng
                đều (không tăng theo x).
              </li>
              <li>
                <strong>Normality of residuals:</strong> sai số tuân theo
                phân phối chuẩn — quan trọng khi tính khoảng tin cậy.
              </li>
            </ol>
            <p className="text-sm text-muted mt-2">
              Nếu bạn chỉ làm dự đoán (không làm inference thống kê), bạn có
              thể nới lỏng các giả định này.
            </p>
          </CollapsibleDetail>

          <Callout variant="warning" title="Hạn chế cần biết">
            Hồi quy tuyến tính nhạy cảm với outlier (điểm ngoại lai) và chỉ nắm bắt được quan hệ tuyến tính. Dữ liệu cong → cần hồi quy đa thức hoặc mô hình phức tạp hơn. Cũng cần chú ý đến{" "}
            <TopicLink slug="bias-variance">đánh đổi bias-variance</TopicLink>{" "}
            và nguy cơ{" "}
            <TopicLink slug="overfitting-underfitting">overfitting/underfitting</TopicLink>{" "}
            khi thêm nhiều features.
          </Callout>

          <p>
            <strong>Ứng dụng thực tế trong ngành:</strong>
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2 text-sm leading-relaxed">
            <li>
              <strong>Tài chính ngân hàng (VPBank, Techcombank):</strong>{" "}
              hồi quy tuyến tính tính điểm tín dụng từ thu nhập, tuổi, lịch
              sử nợ. Minh bạch với cơ quan quản lý — mỗi hệ số giải thích rõ
              ảnh hưởng của yếu tố nào lên quyết định cho vay.
            </li>
            <li>
              <strong>Bất động sản (Batdongsan.com.vn):</strong>{" "}
              định giá căn hộ từ diện tích, số phòng, vị trí, tuổi nhà. Là
              baseline bắt buộc trước khi thử mô hình phức tạp hơn (random
              forest, gradient boosting).
            </li>
            <li>
              <strong>Dịch vụ công (SYT, GSO):</strong>{" "}
              dự báo số ca bệnh dựa trên chỉ số khí hậu; ước lượng chi tiêu
              hộ gia đình theo vùng/thu nhập. Đơn giản → dễ kiểm toán cho bên
              thứ ba.
            </li>
            <li>
              <strong>Marketing (Tiki, Shopee):</strong>{" "}
              phân bổ ngân sách quảng cáo giữa Google/Facebook/TikTok dựa trên
              lịch sử chuyển đổi. Hệ số &beta; âm = kênh &quot;ăn cắp&quot;
              ngân sách mà không mang doanh thu về.
            </li>
          </ul>

          <Callout variant="insight" title="Tại sao hồi quy tuyến tính không bao giờ lỗi thời">
            Dù deep learning thống trị mặt tiền, hồi quy tuyến tính vẫn là mô
            hình được triển khai nhiều nhất trong doanh nghiệp: <strong>huấn
            luyện cực nhanh</strong> (dưới 1 giây cho hàng triệu mẫu),{" "}
            <strong>dễ giải thích</strong> (một con số cho mỗi feature),{" "}
            <strong>ổn định</strong> (kết quả gần như tất định với cùng dữ
            liệu), và <strong>đạt chuẩn pháp lý</strong> trong các ngành phải
            minh bạch quyết định (ngân hàng, bảo hiểm, y tế). Khi deep model
            phức tạp chỉ cải thiện 1-2% accuracy, linear thắng về total cost
            of ownership.
          </Callout>

          <p>
            <strong>Cạm bẫy thường gặp khi triển khai:</strong>
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2 text-sm leading-relaxed">
            <li>
              <strong>Extrapolation (ngoại suy):</strong>{" "}
              Mô hình học từ nhà 30-120m². Bạn dùng để đoán giá biệt thự 500m²
              → dự đoán cực kỳ không đáng tin vì vượt ra khỏi miền dữ liệu huấn
              luyện. Hồi quy tuyến tính chỉ chạy tốt trong khoảng dữ liệu đã
              thấy.
            </li>
            <li>
              <strong>Đa cộng tuyến (multicollinearity):</strong>{" "}
              Khi diện_tích và số_phòng tương quan cao (&gt;0.9), hệ số
              w_diện_tích và w_phòng trở nên không ổn định — thay đổi chút
              dữ liệu có thể lật dấu hệ số. Giải pháp: tính VIF (Variance
              Inflation Factor), bỏ biến trùng lặp, hoặc dùng Ridge
              Regression.
            </li>
            <li>
              <strong>Bỏ biến quan trọng (omitted variable bias):</strong>{" "}
              Nếu bạn quên &quot;vị trí&quot; khi dự đoán giá nhà, tất cả ảnh
              hưởng của vị trí bị &quot;gom&quot; vào các biến còn lại, làm
              các hệ số khác bị sai lệch.
            </li>
            <li>
              <strong>Dùng R² để khoe hàng:</strong>{" "}
              R² chỉ tăng khi thêm feature, kể cả feature rác ngẫu nhiên. Luôn
              dùng <em>Adjusted R²</em> hoặc đánh giá trên tập test độc lập.
            </li>
          </ul>

          <Callout variant="info" title="Regularization — khi hồi quy tuyến tính cần kỷ luật">
            Khi có nhiều feature và dữ liệu ít, OLS dễ overfit. Hai mở rộng
            quan trọng: <strong>Ridge Regression</strong> (thêm L2 penalty
            &lambda;‖w‖² để co trọng số về 0 nhưng không tắt hẳn) và{" "}
            <strong>Lasso</strong> (L1 penalty &lambda;‖w‖₁ có thể đẩy một
            số hệ số về 0, tự động chọn feature). Đối với tiếng Việt/dataset
            nhỏ, Ridge/Lasso thường cải thiện accuracy đáng kể so với OLS
            thuần. Xem chi tiết ở{" "}
            <TopicLink slug="regularization">regularization</TopicLink>.
          </Callout>

          <CollapsibleDetail title="Đạo hàm MSE và suy ra gradient descent (nâng cao)">
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                Với loss <LaTeX>{"L(w_0, w_1)"}</LaTeX> là MSE, đạo hàm riêng theo từng
                tham số:
              </p>
              <LaTeX block>{"\\frac{\\partial L}{\\partial w_1} = -\\frac{2}{n}\\sum_{i=1}^{n} x_i (y_i - \\hat{y}_i)"}</LaTeX>
              <LaTeX block>{"\\frac{\\partial L}{\\partial w_0} = -\\frac{2}{n}\\sum_{i=1}^{n} (y_i - \\hat{y}_i)"}</LaTeX>
              <p>
                Gradient descent cập nhật lặp:{" "}
                <LaTeX>{"w \\leftarrow w - \\alpha \\nabla L(w)"}</LaTeX>
                . Trong đó <LaTeX>{"\\alpha"}</LaTeX> là learning rate. Với
                learning rate quá lớn, thuật toán có thể phân kỳ; quá nhỏ sẽ
                hội tụ chậm. Xem chi tiết ở{" "}
                <TopicLink slug="gradient-descent">gradient descent</TopicLink>.
              </p>
              <p>
                Điều đẹp của hàm loss MSE là nó lồi (convex) trong không gian
                tham số tuyến tính — nghĩa là tồn tại đúng một cực tiểu toàn
                cục, và gradient descent bảo đảm hội tụ tới đó (với learning
                rate phù hợp). Đây là lý do hồi quy tuyến tính là bài toán ML
                &quot;đã giải&quot;.
              </p>
              <p>
                <strong>Mini-batch vs full-batch:</strong> với dataset triệu
                mẫu, tính gradient trên toàn bộ rất tốn kém. Stochastic /
                mini-batch gradient descent dùng một phần nhỏ mỗi bước — nhiễu
                hơn nhưng rẻ và thường hội tụ nhanh hơn trên thực tế.
              </p>
            </div>
          </CollapsibleDetail>

          <p>
            <strong>Quy trình triển khai hồi quy tuyến tính từ A đến Z
            (Vietnamese case study):</strong>{" "}
            Giả sử bạn là analyst tại một startup F&amp;B TP.HCM cần dự đoán
            doanh thu chi nhánh mới:
          </p>

          <ol className="list-decimal list-inside space-y-2 pl-2 text-sm leading-relaxed">
            <li>
              <strong>Khung bài toán:</strong> y = doanh_thu_tháng_trung_bình.
              Features: dân_cư_bán_kính_2km, giao_thông (car + bike), số đối
              thủ cùng loại, giá thuê mặt bằng, chỉ số Google Maps (thời gian
              dừng trung bình).
            </li>
            <li>
              <strong>Thu thập dữ liệu:</strong> 40 chi nhánh hiện có (6 tháng
              đầu hoạt động), log doanh thu POS, thông tin GIS (OpenStreetMap),
              crawler BĐS cho giá thuê.
            </li>
            <li>
              <strong>Làm sạch:</strong> loại bỏ 2 chi nhánh đóng cửa dưới 3
              tháng, 1 chi nhánh ở trạm xăng bị sự cố cháy &rArr; outlier rõ.
              Chuẩn hoá (StandardScaler) các feature vì thang đo khác nhau.
            </li>
            <li>
              <strong>Chia tập:</strong> 70% train (28 chi nhánh), 30% test
              (10 chi nhánh) — giữ ngẫu nhiên theo quận để tránh data leakage
              địa lý.
            </li>
            <li>
              <strong>Fit OLS &amp; kiểm tra giả định:</strong> plot residual
              vs predicted, Q-Q plot kiểm tra tính chuẩn của residual. Nếu
              residual thể hiện đường cong → quan hệ thực sự phi tuyến.
            </li>
            <li>
              <strong>Diễn giải hệ số:</strong>{" "}
              <em>w_giao_thông</em> = 0.08 (triệu/đơn vị lưu lượng) —&gt; đi qua
              nhiều người thêm 1 độ lệch chuẩn bù thêm ~80k/tháng. <em>
              w_đối_thủ</em> = -0.12 —&gt; thêm 1 đối thủ trong bán kính lấy đi
              ~120k/tháng.
            </li>
            <li>
              <strong>Validate:</strong> test R² = 0.71, RMSE = 18 triệu — chấp
              nhận được cho quyết định &quot;mở/không mở&quot;. Đưa model cho
              stakeholder, kèm interval dự đoán thay vì điểm duy nhất.
            </li>
          </ol>

          <Callout variant="tip" title="Mẹo thực hành cho team nhỏ">
            Đừng bỏ qua hồi quy tuyến tính để nhảy thẳng vào XGBoost hay
            neural network. Bước 1 trong mọi dự án ML nghiêm túc là fit một
            linear model làm &quot;baseline&quot;. Nếu baseline đạt 80% hiệu
            quả của mô hình phức tạp, bạn nên giữ baseline vì: dễ bảo trì, dễ
            debug, dễ giải thích với sếp không chuyên. Có rất nhiều dự án AI
            bị đóng cửa vì overengineered ngay từ đầu.
          </Callout>

          <p>
            <strong>So sánh với các biến thể regression khác:</strong>{" "}
            Khi OLS không đủ, thường bạn sẽ gặp các mô hình mở rộng:
          </p>

          <ul className="list-disc list-inside space-y-2 pl-2 text-sm leading-relaxed">
            <li>
              <strong>
                <TopicLink slug="polynomial-regression">Polynomial
                regression</TopicLink>:
              </strong>{" "}
              thêm các feature x², x³ để bắt đường cong. Vẫn tuyến tính theo
              tham số nên OLS vẫn giải được.
            </li>
            <li>
              <strong>
                <TopicLink slug="logistic-regression">Logistic
                regression</TopicLink>:
              </strong>{" "}
              đầu ra là xác suất 0-1 qua hàm sigmoid. Dùng cho phân loại, loss
              là cross-entropy.
            </li>
            <li>
              <strong>Ridge / Lasso:</strong>{" "}
              OLS + penalty L2/L1. Giải quyết overfitting và đa cộng tuyến.
            </li>
            <li>
              <strong>Generalized Linear Model (GLM):</strong>{" "}
              khung tổng quát cho regression — Poisson (đếm), gamma (thời gian
              chờ), logistic (xác suất).
            </li>
          </ul>

          <Callout variant="warning" title="Khi hồi quy tuyến tính KHÔNG nên là lựa chọn">
            Nếu dữ liệu của bạn (1) có quan hệ phi tuyến mạnh (ảnh, âm thanh,
            text thô), (2) có rất nhiều feature rác không liên quan, (3) yêu
            cầu mô hình hóa tương tác phức tạp giữa các biến, hay (4) label
            rất mất cân đối — thì các mô hình khác (tree-based, deep learning)
            sẽ phù hợp hơn. Hồi quy tuyến tính là công cụ chính xác khi bạn
            dùng đúng nơi, không phải một giải pháp cho mọi bài toán.
          </Callout>

          <p>
            <strong>Chẩn đoán mô hình qua bốn biểu đồ kinh điển:</strong>{" "}
            Sau khi fit OLS, một analyst nghiêm túc không chỉ nhìn R². Họ vẽ
            bốn biểu đồ để kiểm tra sức khoẻ mô hình — gọi là{" "}
            <em>regression diagnostic plots</em>:
          </p>

          <ol className="list-decimal list-inside space-y-2 pl-2 text-sm leading-relaxed">
            <li>
              <strong>Residuals vs Fitted:</strong>{" "}
              Kỳ vọng: chấm rải ngẫu nhiên quanh đường 0. Nếu thấy hình phễu,
              hình chữ U, hay xu hướng nghiêng → vi phạm giả định tuyến tính
              hoặc phương sai không đồng đều.
            </li>
            <li>
              <strong>Q-Q plot của residuals:</strong>{" "}
              Nếu residual có phân phối chuẩn, các điểm sẽ nằm gần đường chéo.
              Điểm lệch ở đuôi &rArr; residual có đuôi dày (heavy tail) &rArr;
              intervals dự đoán không đáng tin.
            </li>
            <li>
              <strong>Scale-Location (Spread-Location):</strong>{" "}
              Vẽ căn-bậc-hai của |residual chuẩn hoá| theo fitted. Dùng để phát
              hiện heteroscedasticity (phương sai phụ thuộc x).
            </li>
            <li>
              <strong>Residuals vs Leverage:</strong>{" "}
              Xác định điểm có &quot;ảnh hưởng lớn&quot; (high leverage). Một
              outlier với leverage cao có thể tự tay xoay cả đường hồi quy —
              công cụ: Cook&apos;s distance &gt; 1 là cờ đỏ.
            </li>
          </ol>

          <CodeBlock language="python" title="regularization_vs_plain_ols.py — so sánh trên dữ liệu ít">
{`import numpy as np
from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error

# Dữ liệu mô phỏng: 20 mẫu, 15 feature (gần overdetermined)
rng = np.random.default_rng(42)
X = rng.normal(size=(20, 15))
true_w = np.zeros(15)
true_w[:3] = [2.0, -1.5, 0.8]  # chỉ 3 feature thực sự liên quan
y = X @ true_w + rng.normal(scale=0.3, size=20)

X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.4, random_state=0)

# 1. OLS thuần — dễ overfit
ols = LinearRegression().fit(X_tr, y_tr)
print("OLS    test MSE:", round(mean_squared_error(y_te, ols.predict(X_te)), 3))

# 2. Ridge (L2) — giảm variance
for lam in [0.1, 1.0, 10.0]:
    m = Ridge(alpha=lam).fit(X_tr, y_tr)
    print(f"Ridge  a={lam:<4}  MSE:", round(mean_squared_error(y_te, m.predict(X_te)), 3))

# 3. Lasso (L1) — tự động chọn feature (một số w về 0)
for lam in [0.05, 0.2, 0.5]:
    m = Lasso(alpha=lam).fit(X_tr, y_tr)
    n_nonzero = (m.coef_ != 0).sum()
    mse = mean_squared_error(y_te, m.predict(X_te))
    print(f"Lasso  a={lam:<5} nnz={n_nonzero}  MSE:", round(mse, 3))

# Thông thường Ridge/Lasso giảm test MSE ~40-60% so với OLS thuần khi
# features > 10% số mẫu và có biến rác.`}
          </CodeBlock>

          <Callout variant="insight" title="Tại sao phải luôn bắt đầu bằng baseline tuyến tính">
            Một trong những lỗi tốn kém nhất của đội ML ở Việt Nam (và khắp
            nơi) là nhảy thẳng vào deep learning mà không đo baseline. Khi
            baseline linear đạt 85% accuracy, bạn biết deep learning chỉ có
            thể thêm 0-15% cải tiến — không phải 0-100%. Điều này định hình
            estimate thời gian, ngân sách GPU, và cả lựa chọn có nên làm tiếp
            hay không. Nhiều khi baseline chính là lời giải cuối cùng, và
            toàn bộ team tiết kiệm được hàng trăm giờ GPU.
          </Callout>

          <p>
            <strong>Từ hồi quy đến &quot;hiểu&quot; nguyên nhân:</strong>{" "}
            Một cảnh báo quan trọng — hồi quy tuyến tính cho bạn{" "}
            <em>tương quan</em>, không phải <em>nhân quả</em>. Hệ số w_quảng_cáo
            dương không có nghĩa &quot;tăng quảng cáo sẽ tăng doanh thu&quot;.
            Có thể doanh thu cao khiến công ty chi nhiều quảng cáo hơn (reverse
            causation), hoặc có biến ẩn (mùa lễ tết) đẩy cả hai lên. Để nói
            được nhân quả cần: thí nghiệm A/B có kiểm soát, instrumental
            variables, hay các kỹ thuật causal inference hiện đại
            (DoWhy, EconML).
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* STEP 5.5: Case study depth */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Case study Việt Nam">
        <div className="space-y-4 text-sm leading-relaxed">
          <p>
            <strong>Bài toán:</strong> FlyNow Vietnam, một công ty logistics
            ở Đà Nẵng, muốn dự đoán chi phí nhiên liệu hàng tháng của đội xe
            tải 120 chiếc để lên kế hoạch ngân sách quý.
          </p>
          <p>
            <strong>Features khả dụng:</strong> quãng đường trung bình/xe
            (km), tải trọng trung bình (tấn), tuổi xe (năm), loại nhiên liệu
            (diesel/xăng), số ngày làm việc, giá nhiên liệu trung bình.
          </p>
          <p>
            <strong>Lựa chọn mô hình:</strong> đội dữ liệu thử 3 mô hình —
            OLS thuần, Ridge (alpha=1.0), và Random Forest 200 cây. Kết quả
            trên tập test 2.400 bản ghi (tháng gần nhất):
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>OLS: R² = 0.83, RMSE = 1.8 triệu VNĐ/xe/tháng</li>
            <li>Ridge: R² = 0.84, RMSE = 1.7 triệu VNĐ/xe/tháng</li>
            <li>Random Forest: R² = 0.88, RMSE = 1.4 triệu VNĐ/xe/tháng</li>
          </ul>
          <p>
            <strong>Lựa chọn cuối cùng:</strong> Ridge. Lý do: Random Forest
            chỉ tốt hơn ~15%, nhưng (1) không thể giải thích hệ số cho sếp
            tài chính, (2) thời gian huấn luyện gấp 40 lần, (3) khó đưa vào
            Excel dashboard mà kế toán đang dùng, (4) đội dữ liệu chỉ có 1
            người và cần mô hình dễ bảo trì.
          </p>
          <p>
            <strong>Bài học:</strong> &quot;Mô hình tốt nhất&quot; không phải
            là mô hình có accuracy cao nhất. Nó là mô hình phù hợp với ràng
            buộc kinh doanh — và rất thường, đó là một mô hình tuyến tính.
          </p>
        </div>

        <div className="mt-5 rounded-xl border border-border bg-surface p-4 text-sm">
          <p className="font-semibold text-foreground mb-2">
            Checklist 10 điểm trước khi deploy hồi quy tuyến tính:
          </p>
          <ol className="list-decimal list-inside space-y-1 pl-2 text-muted">
            <li>Đã chuẩn hoá/scaling các feature?</li>
            <li>Đã tách train/val/test theo thời gian (nếu time series)?</li>
            <li>Đã kiểm tra VIF cho đa cộng tuyến?</li>
            <li>Đã vẽ residual vs fitted?</li>
            <li>Đã kiểm tra Q-Q plot residual?</li>
            <li>Đã tính Adjusted R² trên test?</li>
            <li>Đã tính khoảng tin cậy cho hệ số?</li>
            <li>Đã có quy trình monitor drift trên production?</li>
            <li>Đã viết unit test cho pipeline preprocessing?</li>
            <li>Đã tài liệu hoá giả định/giới hạn cho stakeholder?</li>
          </ol>
        </div>
      </LessonSection>

      {/* STEP 6: SUMMARY */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "Hồi quy tuyến tính tìm đường thẳng y = wx + b tối thiểu hoá tổng bình phương sai số.",
          "MSE đo chất lượng khớp — càng nhỏ, đường thẳng càng sát dữ liệu.",
          "Nhạy cảm với outlier vì dùng bình phương → sai số lớn bị phóng đại.",
          "Mở rộng được cho nhiều biến — gọi là Multiple Linear Regression.",
          "Là nền tảng cho mọi thuật toán ML phức tạp hơn — phải nắm vững trước!",
          "R² đo tỷ lệ variance được giải thích; quy tắc 10-20 mẫu/feature để tránh overfitting.",
        ]} />
      </LessonSection>

      {/* STEP 7: QUIZ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
