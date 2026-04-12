"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX, TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "logistic-regression",
  title: "Logistic Regression",
  titleVi: "Hồi quy logistic",
  description: "Thuật toán phân loại nhị phân sử dụng hàm sigmoid để dự đoán xác suất",
  category: "classic-ml",
  tags: ["classification", "supervised-learning", "probability"],
  difficulty: "beginner",
  relatedSlugs: ["linear-regression", "naive-bayes", "svm"],
  vizType: "interactive",
};

/* ── Utilities ── */
function sigmoid(z: number) { return 1 / (1 + Math.exp(-z)); }

type Pt = { x: number; y: number; label: 0 | 1 };

/* Pre-set data: two classes roughly separable along x */
const INITIAL_DATA: Pt[] = [
  { x: 60, y: 80, label: 0 },   { x: 90, y: 200, label: 0 },
  { x: 120, y: 140, label: 0 }, { x: 140, y: 260, label: 0 },
  { x: 160, y: 100, label: 0 }, { x: 100, y: 170, label: 0 },
  { x: 175, y: 230, label: 0 },
  { x: 310, y: 90, label: 1 },  { x: 340, y: 210, label: 1 },
  { x: 370, y: 150, label: 1 }, { x: 390, y: 260, label: 1 },
  { x: 420, y: 120, label: 1 }, { x: 440, y: 200, label: 1 },
  { x: 360, y: 270, label: 1 },
];

const TOTAL_STEPS = 7;

/* ═══════════════ MAIN ═══════════════ */
export default function LogisticRegressionTopic() {
  const [boundary, setBoundary] = useState(250);
  const [steepness, setSteepness] = useState(6);
  const [threshold, setThreshold] = useState(0.5);
  const [addLabel, setAddLabel] = useState<0 | 1>(0);
  const [data, setData] = useState<Pt[]>(INITIAL_DATA);

  /* Compute accuracy */
  const stats = useMemo(() => {
    let correct = 0;
    for (const p of data) {
      const z = ((p.x - boundary) / 500) * steepness * 4;
      const prob = sigmoid(z);
      const predicted = prob >= threshold ? 1 : 0;
      if (predicted === p.label) correct++;
    }
    return { accuracy: data.length > 0 ? correct / data.length : 0, total: data.length, correct };
  }, [data, boundary, steepness, threshold]);

  /* Sigmoid curve path */
  const sigmoidPath = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 100; i++) {
      const x = (i / 100) * 500;
      const z = ((x - boundary) / 500) * steepness * 4;
      const y = 320 - sigmoid(z) * 280 - 20;
      pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return pts.join(" ");
  }, [boundary, steepness]);

  /* Threshold line y position */
  const thresholdY = useMemo(() => 320 - threshold * 280 - 20, [threshold]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (500 / rect.width);
    const y = (e.clientY - rect.top) * (320 / rect.height);
    setData((prev) => [...prev, { x, y, label: addLabel }]);
  }, [addLabel]);

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Tại sao không dùng hồi quy tuyến tính trực tiếp cho bài toán phân loại?",
      options: [
        "Hồi quy tuyến tính chậm hơn logistic regression",
        "Hồi quy tuyến tính cho giá trị ngoài [0,1] — không phải xác suất hợp lệ",
        "Hồi quy tuyến tính không xử lý được dữ liệu số",
      ],
      correct: 1,
      explanation: "Hồi quy tuyến tính cho output từ -∞ đến +∞, không đảm bảo nằm trong [0,1]. Hàm sigmoid ép output về [0,1] — phù hợp làm xác suất.",
    },
    {
      question: "Khi tăng độ dốc (steepness) của sigmoid, ranh giới quyết định thay đổi thế nào?",
      options: [
        "Ranh giới mở rộng — vùng không chắc chắn lớn hơn",
        "Ranh giới sắc nét hơn — gần giống nhảy bậc 0/1",
        "Ranh giới không thay đổi, chỉ xác suất thay đổi",
      ],
      correct: 1,
      explanation: "Steepness cao → sigmoid dốc → chuyển đổi nhanh từ 0 sang 1 quanh ranh giới. Cực đoan: sigmoid trở thành hàm bậc thang (step function).",
    },
    {
      question: "Logistic regression dùng hàm mất mát nào?",
      options: [
        "Mean Squared Error (MSE)",
        "Binary Cross-Entropy (Log Loss)",
        "Hinge Loss",
      ],
      correct: 1,
      explanation: "Binary cross-entropy phạt nặng dự đoán tự tin nhưng sai. Ví dụ: dự đoán xác suất 0.99 nhưng thực tế là lớp 0 → loss rất cao.",
    },
    {
      type: "fill-blank",
      question: "Hàm sigmoid σ(z) = 1 / (1 + e^{-z}) trả về giá trị trong khoảng {blank} đến {blank}, làm cho output phù hợp làm xác suất.",
      blanks: [
        { answer: "0", accept: ["0.0"] },
        { answer: "1", accept: ["1.0"] },
      ],
      explanation: "Sigmoid ép mọi đầu vào thực z ∈ (-∞, +∞) về khoảng (0, 1) — đây chính là lý do sigmoid được chọn cho logistic regression. Khi z → -∞ thì σ → 0; khi z → +∞ thì σ → 1; khi z = 0 thì σ = 0.5 (ranh giới quyết định mặc định).",
    },
  ], []);

  return (
    <>
      {/* STEP 1: PREDICTION GATE */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Shopee muốn dự đoán đơn hàng bị huỷ hay không dựa trên thời gian thanh toán. Thời gian ngắn → ít huỷ, thời gian dài → hay huỷ. Output cần gì?"
          options={[
            "Một con số từ 0 đến vô cùng — càng lớn càng hay huỷ",
            "Một xác suất từ 0% đến 100% — để đặt ngưỡng cảnh báo",
            "Nhãn 'huỷ' hoặc 'không huỷ' trực tiếp",
          ]}
          correct={1}
          explanation="Xác suất 0-100% linh hoạt nhất! Shopee có thể đặt ngưỡng 70% để gửi nhắc nhở, 90% để gọi điện. Hàm sigmoid biến mọi input thành xác suất — đó là logistic regression."
        >

      {/* STEP 2: INTERACTIVE VIZ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Kéo thanh trượt để di chuyển <strong className="text-foreground">ranh giới quyết định</strong>{" "}
          và điều chỉnh <strong className="text-foreground">độ dốc sigmoid</strong>. Thử thay đổi ngưỡng (threshold) để thấy accuracy thay đổi.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            <svg
              viewBox="0 0 500 320"
              className="w-full cursor-crosshair rounded-lg border border-border bg-background"
              onClick={handleCanvasClick}
            >
              {/* Background regions */}
              <rect x={0} y={0} width={boundary} height={320} fill="#3b82f6" opacity={0.05} />
              <rect x={boundary} y={0} width={500 - boundary} height={320} fill="#ef4444" opacity={0.05} />

              {/* Decision boundary */}
              <motion.line
                x1={boundary} y1={0} x2={boundary} y2={320}
                stroke="#8b5cf6" strokeWidth={2} strokeDasharray="6 3"
                animate={{ x1: boundary, x2: boundary }}
                transition={{ type: "spring", stiffness: 150, damping: 20 }}
              />

              {/* Sigmoid curve */}
              <motion.path
                d={sigmoidPath} fill="none" stroke="#3b82f6" strokeWidth={2.5}
                initial={false}
                animate={{ d: sigmoidPath }}
                transition={{ duration: 0.2 }}
              />

              {/* Threshold line */}
              <line
                x1={0} y1={thresholdY} x2={500} y2={thresholdY}
                stroke="#22c55e" strokeWidth={1} strokeDasharray="4 4" opacity={0.6}
              />
              <text x={505} y={thresholdY + 4} fontSize={9} fill="#22c55e" dominantBaseline="middle">
                {(threshold * 100).toFixed(0)}%
              </text>

              {/* Data points */}
              {data.map((p, i) => {
                const z = ((p.x - boundary) / 500) * steepness * 4;
                const prob = sigmoid(z);
                const predicted = prob >= threshold ? 1 : 0;
                const correct = predicted === p.label;
                return (
                  <g key={`pt-${i}`}>
                    <circle
                      cx={p.x} cy={p.y} r={5}
                      fill={p.label === 0 ? "#3b82f6" : "#ef4444"}
                      stroke={correct ? "#fff" : "#fbbf24"}
                      strokeWidth={correct ? 1.5 : 2.5}
                    />
                  </g>
                );
              })}

              {/* Labels */}
              <text x={boundary / 2} y={310} fontSize={12} fill="#3b82f6" textAnchor="middle" fontWeight={600}>
                Lớp 0
              </text>
              <text x={boundary + (500 - boundary) / 2} y={310} fontSize={12} fill="#ef4444" textAnchor="middle" fontWeight={600}>
                Lớp 1
              </text>

              {/* Accuracy overlay */}
              <text x={10} y={20} fontSize={12} fill="currentColor" className="text-foreground" fontWeight={600}>
                Accuracy: {(stats.accuracy * 100).toFixed(0)}% ({stats.correct}/{stats.total})
              </text>
            </svg>

            {/* Controls */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <label className="w-20 text-xs font-medium text-muted">Ranh giới</label>
                <input type="range" min={50} max={450} value={boundary} onChange={(e) => setBoundary(Number(e.target.value))} className="flex-1 accent-purple-500" />
              </div>
              <div className="flex items-center gap-3">
                <label className="w-20 text-xs font-medium text-muted">Độ dốc</label>
                <input type="range" min={1} max={20} value={steepness} onChange={(e) => setSteepness(Number(e.target.value))} className="flex-1 accent-blue-500" />
              </div>
              <div className="flex items-center gap-3">
                <label className="w-20 text-xs font-medium text-muted">Ngưỡng</label>
                <input type="range" min={10} max={90} value={threshold * 100} onChange={(e) => setThreshold(Number(e.target.value) / 100)} className="flex-1 accent-green-500" />
                <span className="text-xs font-bold text-green-500 w-10 text-right">{(threshold * 100).toFixed(0)}%</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted">Thêm điểm:</span>
                <button
                  onClick={() => setAddLabel(0)}
                  className={`rounded-md px-3 py-1 font-medium transition-colors ${addLabel === 0 ? "bg-blue-500 text-white" : "border border-border text-muted"}`}
                >
                  Lớp 0
                </button>
                <button
                  onClick={() => setAddLabel(1)}
                  className={`rounded-md px-3 py-1 font-medium transition-colors ${addLabel === 1 ? "bg-red-500 text-white" : "border border-border text-muted"}`}
                >
                  Lớp 1
                </button>
              </div>
              <button
                onClick={() => setData(INITIAL_DATA)}
                className="ml-auto rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                Đặt lại
              </button>
            </div>

            <p className="text-xs text-muted">
              Viền vàng = dự đoán sai. Thử di chuyển ranh giới hoặc ngưỡng để giảm số điểm sai!
            </p>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* STEP 3: AHA */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>Logistic Regression</strong>{" "}
            = <TopicLink slug="linear-regression">hồi quy tuyến tính</TopicLink> + hàm sigmoid! Nó tính z = wx + b (tuyến tính), rồi ép qua sigmoid để ra xác suất 0-1. Ranh giới quyết định là nơi xác suất = ngưỡng.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* STEP 4: CHALLENGE */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Mô hình dự đoán xác suất mắc bệnh. Bạn dùng ngưỡng 50% và bỏ sót 30% bệnh nhân thật. Nên tăng hay giảm ngưỡng?"
          options={[
            "Tăng ngưỡng lên 70% — chỉ chẩn đoán khi rất chắc",
            "Giảm ngưỡng xuống 30% — để bắt được nhiều bệnh nhân hơn",
            "Giữ nguyên 50% — đó là ngưỡng chuẩn",
          ]}
          correct={1}
          explanation="Trong y tế, bỏ sót bệnh nhân (False Negative) nguy hiểm hơn báo nhầm (False Positive). Giảm ngưỡng = dễ dự đoán 'có bệnh' hơn → bắt được nhiều ca thật → tăng Recall."
        />
      </LessonSection>

      {/* STEP 5: EXPLANATION */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Logistic Regression</strong>{" "}
            dự đoán xác suất thuộc lớp dương bằng{" "}
            <TopicLink slug="activation-functions">hàm kích hoạt</TopicLink>{" "}
            sigmoid:
          </p>

          <LaTeX block>{"P(y=1|x) = \\sigma(z) = \\frac{1}{1 + e^{-z}}, \\quad z = \\mathbf{w}^T \\mathbf{x} + b"}</LaTeX>

          <p>
            Hàm sigmoid nén mọi giá trị z từ <LaTeX>{"-\\infty"}</LaTeX> đến <LaTeX>{"+\\infty"}</LaTeX> về đoạn [0, 1]:
          </p>

          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>z rất âm → <LaTeX>{"\\sigma(z) \\approx 0"}</LaTeX> (gần chắc lớp 0)</li>
            <li>z = 0 → <LaTeX>{"\\sigma(0) = 0.5"}</LaTeX> (ranh giới quyết định)</li>
            <li>z rất dương → <LaTeX>{"\\sigma(z) \\approx 1"}</LaTeX> (gần chắc lớp 1)</li>
          </ul>

          <p>
            <strong>Hàm mất mát Binary Cross-Entropy:</strong>
          </p>

          <LaTeX block>{"\\mathcal{L} = -\\frac{1}{n}\\sum_{i=1}^{n}\\left[y_i \\log(\\hat{p}_i) + (1-y_i)\\log(1-\\hat{p}_i)\\right]"}</LaTeX>

          <Callout variant="tip" title="Tại sao không dùng MSE?">
            MSE + sigmoid tạo hàm loss không lồi (non-convex) → gradient descent có thể mắc kẹt ở cực tiểu địa phương. Binary cross-entropy luôn lồi → đảm bảo tìm được nghiệm tối ưu toàn cục.
          </Callout>

          <CodeBlock language="python" title="Logistic Regression với scikit-learn">
{`from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
import numpy as np

# Dữ liệu: thời gian thanh toán (phút) → huỷ đơn?
X = np.array([[2], [5], [3], [10], [15], [8], [1], [20]])
y = np.array([0, 0, 0, 1, 1, 1, 0, 1])

model = LogisticRegression()
model.fit(X, y)

# Dự đoán xác suất
proba = model.predict_proba([[7]])
print(f"Xác suất huỷ đơn (7 phút): {proba[0][1]:.1%}")

# Thay đổi ngưỡng
custom_pred = (model.predict_proba(X)[:, 1] >= 0.3).astype(int)
print(f"Accuracy (ngưỡng 30%): {accuracy_score(y, custom_pred):.1%}")`}
          </CodeBlock>

          <Callout variant="warning" title="Ranh giới tuyến tính">
            Logistic regression chỉ tạo được ranh giới là đường thẳng (hoặc siêu phẳng). Nếu hai lớp không thể phân tách bằng đường thẳng, cần SVM với kernel hoặc neural network. Để đánh giá model chi tiết hơn, hãy xem{" "}
            <TopicLink slug="confusion-matrix">ma trận nhầm lẫn</TopicLink>{" "}
            và kết hợp với{" "}
            <TopicLink slug="cross-validation">kiểm định chéo</TopicLink>{" "}
            để chọn ngưỡng tối ưu.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* STEP 6: SUMMARY */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "Logistic regression = hồi quy tuyến tính + hàm sigmoid → output là xác suất [0,1].",
          "Ranh giới quyết định là nơi P(y=1) = ngưỡng. Mặc định 0.5, nhưng có thể tuỳ chỉnh.",
          "Dùng Binary Cross-Entropy (không phải MSE) để tối ưu — đảm bảo hàm loss lồi.",
          "Ngưỡng thấp → tăng Recall (bắt nhiều ca dương). Ngưỡng cao → tăng Precision (ít báo nhầm).",
          "Đơn giản, nhanh, dễ giải thích — lựa chọn đầu tiên cho bài toán phân loại nhị phân.",
        ]} />
      </LessonSection>

      {/* STEP 7: QUIZ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>

        </PredictionGate>
      </LessonSection>
    </>
  );
}
