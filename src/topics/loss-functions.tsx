"use client";

import { useState, useMemo } from "react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
  TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "loss-functions",
  title: "Loss Functions",
  titleVi: "Hàm mất mát",
  description:
    "Thước đo sai lệch giữa dự đoán và thực tế, hướng dẫn mạng nơ-ron học từ lỗi.",
  category: "neural-fundamentals",
  tags: ["training", "optimization", "fundamentals"],
  difficulty: "beginner",
  relatedSlugs: [
    "gradient-descent",
    "backpropagation",
    "forward-propagation",
  ],
  vizType: "interactive",
};

/* ---------- math helpers ---------- */
type LossType = "mse" | "mae" | "bce";

function mse(pred: number, target: number) {
  return (pred - target) ** 2;
}
function mae(pred: number, target: number) {
  return Math.abs(pred - target);
}
function bce(pred: number, target: number) {
  const p = Math.max(0.001, Math.min(0.999, pred));
  return -(target * Math.log(p) + (1 - target) * Math.log(1 - p));
}

const LOSS_CONFIG: Record<
  LossType,
  {
    fn: (p: number, t: number) => number;
    label: string;
    color: string;
    formula: string;
    useCase: string;
  }
> = {
  mse: {
    fn: mse,
    label: "MSE",
    color: "#3b82f6",
    formula: "L = \\frac{1}{N}\\sum_{i=1}^{N}(y_i - \\hat{y}_i)^2",
    useCase: "Hồi quy (dự đoán giá nhà, nhiệt độ)",
  },
  mae: {
    fn: mae,
    label: "MAE",
    color: "#22c55e",
    formula: "L = \\frac{1}{N}\\sum_{i=1}^{N}|y_i - \\hat{y}_i|",
    useCase: "Hồi quy, robust với outlier",
  },
  bce: {
    fn: bce,
    label: "Binary CE",
    color: "#f59e0b",
    formula: "L = -[y \\log(\\hat{y}) + (1-y)\\log(1-\\hat{y})]",
    useCase: "Phân loại nhị phân (spam/không spam)",
  },
};

const SVG_W = 460;
const SVG_H = 230;
const PAD = 35;

/* ---------- main component ---------- */
export default function LossFunctionsTopic() {
  const [prediction, setPrediction] = useState(0.3);
  const [target, setTarget] = useState(1.0);
  const [lossType, setLossType] = useState<LossType>("mse");

  const cfg = LOSS_CONFIG[lossType];
  const currentLoss = cfg.fn(prediction, target);

  // Generate curve
  const curvePoints = useMemo(() => {
    const pts: string[] = [];
    const maxLoss = lossType === "bce" ? 5 : 1.2;
    for (let i = 0; i <= 200; i++) {
      const p = i / 200;
      let l: number;
      if (lossType === "bce") {
        l = bce(Math.max(0.01, Math.min(0.99, p)), target);
      } else if (lossType === "mse") {
        l = mse(p, target);
      } else {
        l = mae(p, target);
      }
      const x = PAD + (i / 200) * (SVG_W - 2 * PAD);
      const y = SVG_H - PAD - (l / maxLoss) * (SVG_H - 2 * PAD);
      pts.push(`${x},${Math.max(PAD, y)}`);
    }
    return pts.join(" ");
  }, [lossType, target]);

  const maxLoss = lossType === "bce" ? 5 : 1.2;
  const markerX = PAD + prediction * (SVG_W - 2 * PAD);
  const markerY = Math.max(
    PAD,
    SVG_H - PAD - (currentLoss / maxLoss) * (SVG_H - 2 * PAD)
  );

  /* Quiz */
  const quizQuestions: QuizQuestion[] = [
    {
      question: "Mô hình dự đoán xác suất spam = 0.99 nhưng email thực tế KHÔNG phải spam (y=0). Cross-Entropy loss sẽ như thế nào?",
      options: [
        "Rất thấp — dự đoán gần 1 nên tốt",
        "Rất cao — mô hình 'tự tin sai', CE phạt cực nặng",
        "Bằng 0 — CE chỉ xem dự đoán đúng sai",
        "Âm — loss không bao giờ âm",
      ],
      correct: 1,
      explanation:
        "CE = -log(1-0.99) = -log(0.01) ≈ 4.6 — loss cực cao! CE phạt nặng khi mô hình tự tin nhưng sai. Đây là lý do CE hiệu quả hơn MSE cho phân loại.",
    },
    {
      question: "Khi nào nên dùng MAE thay vì MSE cho bài toán hồi quy?",
      options: [
        "Luôn luôn — MAE tốt hơn MSE",
        "Khi dữ liệu có nhiều outlier (giá trị ngoại lai)",
        "Khi muốn gradient lớn hơn",
        "Khi dữ liệu nhỏ",
      ],
      correct: 1,
      explanation:
        "MSE bình phương sai lệch → outlier (sai lệch lớn) bị phạt cực nặng, kéo mô hình lệch. MAE chỉ lấy trị tuyệt đối → ảnh hưởng của outlier nhẹ hơn.",
    },
    {
      question: "Bài toán phân loại ảnh 10 loại (mèo, chó, ...). Dùng loss function nào?",
      options: [
        "Binary Cross-Entropy",
        "MSE",
        "Categorical Cross-Entropy (Softmax + NLL)",
        "MAE",
      ],
      correct: 2,
      explanation:
        "10 lớp → cần Categorical CE (hoặc NLL Loss + Softmax). Binary CE chỉ cho 2 lớp. MSE/MAE dùng cho hồi quy, không phù hợp cho phân loại.",
    },
    {
      type: "fill-blank",
      question: "Cross-Entropy loss cho phân loại nhị phân: L = −[y·log(ŷ) + (1−y)·log(1−{blank})]. Số hạng trong ngoặc vuông cuối cùng biểu diễn loss khi nhãn thực là 0.",
      blanks: [{ answer: "ŷ", accept: ["y_hat", "pred", "p", "xác suất dự đoán"] }],
      explanation: "Khi nhãn y = 0, loss = −log(1−ŷ): nếu mô hình dự đoán ŷ gần 0 (đúng) → loss thấp; nếu ŷ gần 1 (sai và tự tin) → log(1−ŷ) = log(0) → loss rất cao. Đây là cơ chế phạt nặng 'tự tin sai' của Cross-Entropy.",
    },
  ];

  return (
    <>
      {/* ===== STEP 1: PREDICTION GATE ===== */}
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Bạn bắn cung. Mũi tên cách tâm 50cm. Huấn luyện viên nên phạt thế nào để bạn tiến bộ nhanh nhất?"
          options={[
            "Phạt bằng khoảng cách: 50 điểm (MAE)",
            "Phạt bằng bình phương khoảng cách: 2500 điểm (MSE) — sai càng xa, phạt càng nặng",
            "Phạt 1 điểm nếu trượt, 0 nếu trúng",
            "Không phạt — chỉ khen khi trúng",
          ]}
          correct={1}
          explanation="MSE phạt bình phương: sai 50cm bị phạt 2500, nhưng sai 5cm chỉ phạt 25. Cách phạt này buộc bạn ưu tiên sửa những lần sai lệch lớn trước — rất hiệu quả!"
        >
          <p className="mt-4 text-sm text-muted leading-relaxed">
            Hàm mất mát (loss function) chính là &quot;huấn luyện viên&quot; — nó đo sai lệch và cho
            gradient descent biết cần điều chỉnh bao nhiêu. Hãy{" "}
            <strong className="text-foreground">kéo thanh dự đoán</strong>{" "}
            để xem từng loại loss phản ứng khác nhau như thế nào.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ===== STEP 2: INTERACTIVE LOSS EXPLORER ===== */}
      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-4">
            {/* Loss type selector */}
            <div className="flex flex-wrap gap-2 justify-center">
              {(Object.keys(LOSS_CONFIG) as LossType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setLossType(type)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                    lossType === type
                      ? "text-white shadow-md"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                  style={
                    lossType === type
                      ? { backgroundColor: LOSS_CONFIG[type].color }
                      : {}
                  }
                >
                  {LOSS_CONFIG[type].label}
                </button>
              ))}
            </div>

            {/* Prediction slider */}
            <div className="space-y-2 max-w-lg mx-auto">
              <label className="text-sm font-medium text-muted">
                Dự đoán (<LaTeX>{"\\hat{y}"}</LaTeX>):{" "}
                <strong className="text-foreground">
                  {prediction.toFixed(2)}
                </strong>
                <span className="ml-4">
                  Giá trị thực (y):{" "}
                  <strong className="text-foreground">
                    {target.toFixed(1)}
                  </strong>
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={prediction}
                onChange={(e) =>
                  setPrediction(parseFloat(e.target.value))
                }
                className="w-full accent-accent"
              />
            </div>

            {/* Target toggle */}
            <div className="flex justify-center gap-2">
              <span className="text-xs text-muted">Giá trị thực:</span>
              {[0, 1].map((t) => (
                <button
                  key={t}
                  onClick={() => setTarget(t)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                    target === t
                      ? "bg-accent text-white"
                      : "border border-border text-muted hover:text-foreground"
                  }`}
                >
                  y = {t}
                </button>
              ))}
            </div>

            {/* Loss display */}
            <div className="flex items-center justify-between rounded-lg bg-background/50 border border-border p-4">
              <div>
                <p className="text-xs text-muted">
                  <LaTeX>{cfg.formula}</LaTeX>
                </p>
                <p
                  className="text-2xl font-bold"
                  style={{ color: cfg.color }}
                >
                  {currentLoss.toFixed(4)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted">Sai lệch |y - ŷ|</p>
                <p className="text-lg font-semibold text-foreground">
                  {Math.abs(prediction - target).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Graph */}
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              className="w-full max-w-xl mx-auto"
            >
              {/* Axes */}
              <line
                x1={PAD}
                y1={SVG_H - PAD}
                x2={SVG_W - PAD}
                y2={SVG_H - PAD}
                stroke="#334155"
                strokeWidth="1"
              />
              <line
                x1={PAD}
                y1={PAD}
                x2={PAD}
                y2={SVG_H - PAD}
                stroke="#334155"
                strokeWidth="1"
              />
              <text
                x={SVG_W / 2}
                y={SVG_H - 6}
                textAnchor="middle"
                fill="#64748b"
                fontSize="10"
              >
                Dự đoán (ŷ)
              </text>
              <text
                x={12}
                y={SVG_H / 2}
                fill="#64748b"
                fontSize="10"
                transform={`rotate(-90, 12, ${SVG_H / 2})`}
              >
                Loss
              </text>

              {/* Target line */}
              <line
                x1={PAD + target * (SVG_W - 2 * PAD)}
                y1={PAD}
                x2={PAD + target * (SVG_W - 2 * PAD)}
                y2={SVG_H - PAD}
                stroke="#22c55e"
                strokeWidth="1"
                strokeDasharray="4,3"
                opacity={0.5}
              />
              <text
                x={PAD + target * (SVG_W - 2 * PAD)}
                y={PAD - 5}
                textAnchor="middle"
                fill="#22c55e"
                fontSize="9"
              >
                y = {target}
              </text>

              {/* Loss curve */}
              <polyline
                points={curvePoints}
                fill="none"
                stroke={cfg.color}
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Current marker */}
              <circle
                cx={markerX}
                cy={markerY}
                r="6"
                fill={cfg.color}
                stroke="white"
                strokeWidth="2"
              />
              <line
                x1={markerX}
                y1={markerY}
                x2={markerX}
                y2={SVG_H - PAD}
                stroke={cfg.color}
                strokeWidth="1"
                strokeDasharray="3,3"
                opacity={0.4}
              />
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ===== STEP 3: AHA MOMENT ===== */}
      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>Loss function</strong>{" "}
            là &quot;la bàn&quot; của mạng nơ-ron — nó nói cho <TopicLink slug="gradient-descent">gradient descent</TopicLink> biết:
            &quot;bạn đang sai bao xa và theo hướng nào&quot;. Không có loss, mạng
            không biết cần cải thiện gì! Giống GPS trên Grab: không có thì tài xế
            đi mù.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ===== STEP 4: INLINE CHALLENGE ===== */}
      <LessonSection step={4} totalSteps={8} label="Thử thách">
        <p className="text-sm text-muted mb-3 leading-relaxed">
          Bạn đã thấy MSE phạt nặng sai lệch lớn, và Cross-Entropy phạt nặng khi &quot;tự tin sai&quot;.
          Bây giờ thử tình huống thực tế:
        </p>
        <InlineChallenge
          question="Mô hình dự đoán giá nhà. Dữ liệu có vài căn biệt thự giá 100 tỷ (outlier). Dùng MSE sẽ xảy ra gì?"
          options={[
            "Mô hình dự đoán chính xác hơn nhờ dữ liệu phong phú",
            "MSE phạt bình phương → biệt thự 100 tỷ bị phạt cực nặng → mô hình bị kéo lệch về phía outlier",
            "Không ảnh hưởng — MSE tự động bỏ qua outlier",
          ]}
          correct={1}
          explanation="MSE: sai 100 tỷ → loss = 10.000 tỷ²! Mô hình bị kéo về phía outlier. MAE hoặc Huber Loss (kết hợp MSE+MAE) robust hơn với outlier."
        />
      </LessonSection>

      {/* ===== STEP 5: DEEPER COMPARE ===== */}
      <LessonSection step={5} totalSteps={8} label="So sánh chi tiết">
        <ExplanationSection>
          <p>
            <strong>Loss function</strong>{" "}
            đo sai lệch giữa dự đoán <LaTeX>{"\\hat{y}"}</LaTeX> và
            giá trị thực <LaTeX>{"y"}</LaTeX>. Chọn loss phù hợp là bước quan trọng nhất
            khi thiết kế mô hình.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-semibold text-foreground">
                    Loss
                  </th>
                  <th className="text-left py-2 pr-3 font-semibold text-foreground">
                    Bài toán
                  </th>
                  <th className="text-left py-2 pr-3 font-semibold text-foreground">
                    Đặc điểm
                  </th>
                  <th className="text-left py-2 font-semibold text-foreground">
                    Ví dụ thực tế
                  </th>
                </tr>
              </thead>
              <tbody className="text-foreground/80">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium text-blue-400">MSE</td>
                  <td className="py-2 pr-3"><TopicLink slug="linear-regression">Hồi quy</TopicLink></td>
                  <td className="py-2 pr-3">Phạt nặng sai lệch lớn</td>
                  <td className="py-2">Dự đoán giá nhà, nhiệt độ</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium text-green-400">MAE</td>
                  <td className="py-2 pr-3">Hồi quy (outlier)</td>
                  <td className="py-2 pr-3">Robust, phạt đều</td>
                  <td className="py-2">Dự đoán thời gian giao hàng Shopee</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium text-amber-400">
                    Binary CE
                  </td>
                  <td className="py-2 pr-3"><TopicLink slug="logistic-regression">Phân loại 2 lớp</TopicLink></td>
                  <td className="py-2 pr-3">Phạt cực nặng &quot;tự tin sai&quot;</td>
                  <td className="py-2">Spam detection, phát hiện gian lận</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-medium text-purple-400">
                    Categorical CE
                  </td>
                  <td className="py-2 pr-3">Phân loại N lớp</td>
                  <td className="py-2 pr-3">Softmax + NLL</td>
                  <td className="py-2">Nhận diện 1000 loại ảnh (ImageNet)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <Callout variant="insight" title="Cross-Entropy vs MSE cho phân loại">
            Tại sao không dùng MSE cho phân loại? Vì gradient của MSE rất nhỏ khi
            sigmoid output gần 0 hoặc 1 → học chậm. Cross-Entropy có gradient lớn hơn
            khi dự đoán sai → học nhanh hơn nhiều. Đây là lý do{" "}
            <strong>CE + Softmax</strong>{" "}
            là combo mặc định cho mọi bài toán phân loại. Loss function được <TopicLink slug="backpropagation">backpropagation</TopicLink> dùng làm điểm khởi đầu để tính gradient qua toàn bộ mạng.
          </Callout>

          <CodeBlock language="python" title="loss_functions.py">
{`import torch.nn as nn

# Hồi quy: MSE
loss_reg = nn.MSELoss()
# loss = MSE(pred_price, true_price)

# Phân loại nhị phân: Binary CE
loss_bin = nn.BCEWithLogitsLoss()  # tự áp sigmoid
# loss = BCE(model(email), is_spam)

# Phân loại đa lớp: Cross-Entropy
loss_cls = nn.CrossEntropyLoss()   # tự áp softmax
# loss = CE(model(image), class_label)

# Hồi quy robust: Huber (kết hợp MSE + MAE)
loss_hub = nn.HuberLoss(delta=1.0)
# loss nhỏ → MSE, loss lớn → MAE (robust với outlier)`}
          </CodeBlock>

          <Callout variant="warning" title="Đừng quên: loss phải khả vi">
            Gradient descent cần tính đạo hàm của loss. MAE có đạo hàm không liên tục
            tại x = 0, nên thực tế hay dùng Smooth L1 (Huber) thay thế. Cross-Entropy
            cần clamp prediction tránh log(0) = -infinity.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ===== STEP 6: SECOND CHALLENGE ===== */}
      <LessonSection step={6} totalSteps={8} label="Thử thách nâng cao">
        <InlineChallenge
          question="Mô hình phân loại ảnh cho output softmax = [0.01, 0.01, 0.98] (3 lớp). Nhãn thực là lớp 3 (index 2). Cross-Entropy loss xấp xỉ bằng?"
          options={[
            "0.98 — bằng xác suất đúng",
            "-log(0.98) ≈ 0.02 — loss thấp vì dự đoán đúng và tự tin",
            "0.01 + 0.01 + 0.98 = 1.0 — tổng xác suất",
          ]}
          correct={1}
          explanation="CE = -log(p_đúng) = -log(0.98) ≈ 0.02 — rất thấp! CE chỉ quan tâm xác suất của lớp đúng. Nếu p_đúng = 0.01 → CE = -log(0.01) = 4.6 — rất cao."
        />
      </LessonSection>

      {/* ===== STEP 7: MINI SUMMARY ===== */}
      <LessonSection step={7} totalSteps={8} label="Tóm tắt">
        <MiniSummary
          title="Loss Functions — Điểm chốt"
          points={[
            "Loss function là 'la bàn' — đo sai lệch giữa dự đoán và thực tế, hướng dẫn gradient descent.",
            "Hồi quy: dùng MSE (phạt nặng sai lệch lớn) hoặc MAE (robust với outlier).",
            "Phân loại nhị phân: Binary Cross-Entropy. Đa lớp: Categorical Cross-Entropy + Softmax.",
            "Cross-Entropy phạt cực nặng khi mô hình 'tự tin sai' → gradient lớn → học nhanh.",
            "Chọn loss sai = mô hình tối ưu sai mục tiêu — bước quan trọng nhất khi thiết kế.",
          ]}
        />
      </LessonSection>

      {/* ===== STEP 8: QUIZ ===== */}
      <LessonSection step={8} totalSteps={8} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
