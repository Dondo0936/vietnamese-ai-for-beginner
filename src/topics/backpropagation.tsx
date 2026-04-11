"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate,
  StepReveal,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  CodeBlock,
  Callout,
  LaTeX,
  LessonSection,} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "backpropagation",
  title: "Backpropagation",
  titleVi: "Lan truyền ngược",
  description:
    "Thuật toán cốt lõi để huấn luyện mạng nơ-ron, tính gradient của hàm mất mát theo từng trọng số.",
  category: "neural-fundamentals",
  tags: ["neural-network", "training", "optimization", "gradient"],
  difficulty: "intermediate",
  relatedSlugs: [
    "forward-propagation",
    "gradient-descent",
    "loss-functions",
    "vanishing-exploding-gradients",
  ],
  vizType: "interactive",
};

// ─── Toán ───
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

function forwardPass(w: number[]) {
  const x1 = 0.6, x2 = 0.4;
  const z1 = x1 * w[0] + x2 * w[1];
  const h1 = sigmoid(z1);
  const z2 = h1 * w[2];
  const out = sigmoid(z2);
  return { h1, out, z1, z2 };
}

const TARGET = 0.85;

// ─── Quiz ───
const quizQuestions: QuizQuestion[] = [
  {
    question: "Backpropagation sử dụng quy tắc toán học nào để tính gradient qua nhiều lớp?",
    options: [
      "Quy tắc tích (product rule)",
      "Quy tắc chuỗi (chain rule)",
      "Quy tắc thương (quotient rule)",
      "Quy tắc L'Hôpital",
    ],
    correct: 1,
    explanation:
      "Chain rule cho phép tính đạo hàm của hàm hợp: dL/dw = dL/da · da/dz · dz/dw. Mỗi lớp nhân thêm một thừa số.",
  },
  {
    question: "Tại sao backpropagation hiệu quả hơn thử ngẫu nhiên các trọng số?",
    options: [
      "Nó dùng GPU nhanh hơn",
      "Nó tính CHÍNH XÁC hướng cần thay đổi mỗi trọng số chỉ trong 1 lần duyệt ngược",
      "Nó chỉ thay đổi trọng số ở lớp cuối",
      "Nó chọn ngẫu nhiên nhưng thông minh hơn",
    ],
    correct: 1,
    explanation:
      "Backprop tính gradient chính xác cho MỌI trọng số trong một lần duyệt ngược — không cần thử sai.",
  },
  {
    question: "Khi mạng có 100 lớp và mỗi đạo hàm có giá trị khoảng 0.5, gradient ở lớp đầu tiên sẽ ra sao?",
    options: [
      "Vẫn giữ nguyên",
      "Tăng lên rất lớn (bùng nổ)",
      "Giảm gần về 0 (biến mất)",
      "Dao động không ổn định",
    ],
    correct: 2,
    explanation:
      "0.5 nhân 100 lần ≈ 0. Đây là vanishing gradient — các lớp đầu không được cập nhật. Giải pháp: ReLU, ResNet, LSTM.",
  },
];

// ─── Component chính ───
export default function BackpropagationTopic() {
  // Trạng thái cho phần người dùng tự thử
  const [weights, setWeights] = useState([0.5, -0.3, 0.8]);
  const [attempts, setAttempts] = useState(0);
  const [solved, setSolved] = useState(false);

  // Trạng thái cho animation backprop
  const [bpPhase, setBpPhase] = useState<"idle" | "forward" | "loss" | "backward" | "update">("idle");
  const [bpStep, setBpStep] = useState(0);

  const { h1, out } = useMemo(() => forwardPass(weights), [weights]);
  const loss = (TARGET - out) ** 2;

  const handleWeightChange = useCallback((idx: number, val: number) => {
    setWeights(prev => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
    setAttempts(prev => prev + 1);
    if (loss < 0.005 && !solved) setSolved(true);
  }, [loss, solved]);

  // Backprop tính toán (cho demo)
  const bpResult = useMemo(() => {
    const x1 = 0.6, x2 = 0.4;
    const bpW = [0.5, -0.3, 0.8]; // từ init
    const fp = forwardPass(bpW);
    const dLoss = -2 * (TARGET - fp.out);
    const dOut = fp.out * (1 - fp.out);
    const dW2 = dLoss * dOut * fp.h1;
    const dH1 = dLoss * dOut * bpW[2];
    const dH1Act = fp.h1 * (1 - fp.h1);
    const dW0 = dH1 * dH1Act * x1;
    const dW1 = dH1 * dH1Act * x2;
    const lr = 0.5;
    const newW = [bpW[0] - lr * dW0, bpW[1] - lr * dW1, bpW[2] - lr * dW2];
    const newFp = forwardPass(newW);
    const newLoss = (TARGET - newFp.out) ** 2;
    return { dW0, dW1, dW2, newW, newLoss, oldLoss: (TARGET - fp.out) ** 2 };
  }, []);

  function runBackprop() {
    setBpPhase("forward");
    setBpStep(0);
    setTimeout(() => { setBpPhase("loss"); setBpStep(1); }, 800);
    setTimeout(() => { setBpPhase("backward"); setBpStep(2); }, 1600);
    setTimeout(() => { setBpPhase("update"); setBpStep(3); }, 2400);
    setTimeout(() => { setBpPhase("idle"); setBpStep(4); }, 3500);
  }

  const phaseColor: Record<string, string> = {
    idle: "text-muted", forward: "text-blue-500", loss: "text-amber-500",
    backward: "text-red-500", update: "text-green-500",
  };
  const phaseLabel: Record<string, string> = {
    idle: "Sẵn sàng", forward: "→ Lan truyền xuôi", loss: "⚠ Tính lỗi",
    backward: "← Lan truyền ngược", update: "✓ Cập nhật trọng số",
  };

  return (
    <>
      {/* ━━━ BƯỚC 1: HOOK ━━━ */}
      <LessonSection step={1} totalSteps={7} label="Thử đoán">
      <PredictionGate
        question="Mạng nơ-ron đưa ra dự đoán SAI. Bạn cần sửa các trọng số để nó dự đoán đúng hơn. Làm sao biết trọng số nào cần sửa, và sửa bao nhiêu?"
        options={[
          "Sửa tất cả trọng số một lượng như nhau",
          "Truy ngược từ đầu ra về đầu vào — trọng số nào ảnh hưởng nhiều đến lỗi thì sửa nhiều",
          "Chỉ sửa trọng số ở lớp cuối cùng",
        ]}
        correct={1}
        explanation="Chính xác! Truy ngược lỗi từ output về input, phân bổ trách nhiệm cho từng trọng số — đó chính là ý tưởng cốt lõi của Backpropagation."
      >
        <p className="text-sm text-muted mt-4 mb-2">
          Bây giờ hãy <strong className="text-foreground">tự mình</strong> thử
          điều chỉnh trọng số để thấy khó như thế nào khi làm thủ công.
        </p>
      </PredictionGate>

            </LessonSection>

{/* ━━━ BƯỚC 2: KHÁM PHÁ — Người dùng tự tay tối ưu ━━━ */}
      <LessonSection step={2} totalSteps={7} label="Khám phá">
      <VisualizationSection>
        <h3 className="text-base font-semibold text-foreground mb-1">
          Thử điều chỉnh trọng số thủ công!
        </h3>
        <p className="text-sm text-muted mb-4">
          Mạng đơn giản: 2 đầu vào → 1 nơ-ron ẩn → 1 đầu ra.
          Hãy kéo 3 thanh trượt để output gần mục tiêu <strong className="text-accent">{TARGET}</strong>.
          Cố gắng đưa Loss xuống dưới 0.005!
        </p>

        {/* Biểu đồ mạng */}
        <svg viewBox="0 0 420 180" className="w-full max-w-md mx-auto mb-4">
          {/* Đầu vào */}
          <circle cx={60} cy={55} r={22} fill="none" stroke="var(--accent)" strokeWidth={2} />
          <text x={60} y={59} textAnchor="middle" fontSize={12} fill="var(--text-primary)" fontWeight={600}>0.6</text>
          <text x={60} y={35} textAnchor="middle" fontSize={10} fill="var(--text-tertiary)">x₁</text>

          <circle cx={60} cy={130} r={22} fill="none" stroke="var(--accent)" strokeWidth={2} />
          <text x={60} y={134} textAnchor="middle" fontSize={12} fill="var(--text-primary)" fontWeight={600}>0.4</text>
          <text x={60} y={110} textAnchor="middle" fontSize={10} fill="var(--text-tertiary)">x₂</text>

          {/* Liên kết → nơ-ron ẩn */}
          <line x1={82} y1={55} x2={178} y2={90} stroke="var(--accent)" strokeWidth={1.5} opacity={0.5} />
          <text x={125} y={62} fontSize={9} fill="var(--text-secondary)" textAnchor="middle">w₁={weights[0].toFixed(2)}</text>

          <line x1={82} y1={130} x2={178} y2={90} stroke="var(--accent)" strokeWidth={1.5} opacity={0.5} />
          <text x={125} y={128} fontSize={9} fill="var(--text-secondary)" textAnchor="middle">w₂={weights[1].toFixed(2)}</text>

          {/* Nơ-ron ẩn */}
          <circle cx={200} cy={90} r={22} fill="none" stroke="#8B5CF6" strokeWidth={2} />
          <text x={200} y={94} textAnchor="middle" fontSize={11} fill="var(--text-primary)" fontWeight={600}>{h1.toFixed(3)}</text>
          <text x={200} y={72} textAnchor="middle" fontSize={10} fill="var(--text-tertiary)">h₁</text>

          {/* Liên kết → đầu ra */}
          <line x1={222} y1={90} x2={318} y2={90} stroke="#8B5CF6" strokeWidth={1.5} opacity={0.5} />
          <text x={270} y={80} fontSize={9} fill="var(--text-secondary)" textAnchor="middle">w₃={weights[2].toFixed(2)}</text>

          {/* Đầu ra */}
          <motion.circle
            cx={340} cy={90} r={22}
            fill={loss < 0.005 ? "rgba(5,150,105,0.15)" : "rgba(220,38,38,0.1)"}
            stroke={loss < 0.005 ? "#059669" : "#DC2626"}
            strokeWidth={2}
            animate={{ scale: loss < 0.005 ? [1, 1.1, 1] : 1 }}
            transition={{ duration: 0.5 }}
          />
          <text x={340} y={94} textAnchor="middle" fontSize={11} fill="var(--text-primary)" fontWeight={700}>{out.toFixed(3)}</text>
          <text x={340} y={72} textAnchor="middle" fontSize={10} fill="var(--text-tertiary)">ŷ</text>

          {/* Mục tiêu */}
          <text x={390} y={94} fontSize={10} fill="var(--text-tertiary)">mục tiêu: {TARGET}</text>
        </svg>

        {/* Thanh trượt */}
        <div className="space-y-3 max-w-md mx-auto">
          {["w₁", "w₂", "w₃"].map((label, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs font-mono text-muted w-6">{label}</span>
              <input
                type="range" min={-2} max={2} step={0.01}
                value={weights[i]}
                onChange={e => handleWeightChange(i, parseFloat(e.target.value))}
                className="flex-1 h-1.5 rounded-full appearance-none bg-surface accent-accent cursor-pointer"
              />
              <span className="text-xs font-mono text-accent w-12 text-right">{weights[i].toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Kết quả */}
        <div className="flex items-center justify-between mt-4 px-2 max-w-md mx-auto">
          <div className="text-sm">
            <span className="text-muted">Loss: </span>
            <span className={`font-mono font-bold ${loss < 0.005 ? "text-green-600" : "text-red-500"}`}>
              {loss.toFixed(4)}
            </span>
          </div>
          <div className="text-xs text-tertiary">
            {attempts} lần thử
          </div>
        </div>

        {solved && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 text-sm text-green-700 dark:text-green-400 text-center max-w-md mx-auto"
          >
            Tuyệt vời! Bạn đã đưa loss xuống rất thấp sau {attempts} lần thử.
            Nhưng backpropagation chỉ cần <strong>1 lần tính toán</strong> để biết chính xác cần thay đổi bao nhiêu!
          </motion.div>
        )}
      </VisualizationSection>

            </LessonSection>

{/* ━━━ BƯỚC 3: AHA MOMENT ━━━ */}
      <LessonSection step={3} totalSteps={7} label="Khám phá">
      <AhaMoment>
        Thay vì thử từng chút như bạn vừa làm, <strong>Backpropagation</strong> tính
        <em> chính xác </em> mỗi trọng số cần thay đổi bao nhiêu — chỉ bằng một lần
        duyệt ngược qua mạng, dùng <strong>quy tắc chuỗi</strong> (chain rule) trong đạo hàm.
      </AhaMoment>

            </LessonSection>

{/* ━━━ BƯỚC 4: ĐI SÂU — Xem backprop hoạt động ━━━ */}
      <LessonSection step={4} totalSteps={7} label="Đi sâu">
      <VisualizationSection>
        <h3 className="text-base font-semibold text-foreground mb-2">
          Xem Backpropagation tự động tối ưu
        </h3>
        <p className="text-sm text-muted mb-4">
          Cùng mạng, cùng trọng số ban đầu. Nhấn nút để xem backprop tính gradient
          và cập nhật trọng số trong 4 bước.
        </p>

        {/* Chỉ báo giai đoạn */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className={`text-sm font-medium ${phaseColor[bpPhase]}`}>
            {phaseLabel[bpPhase]}
          </span>
        </div>

        <StepReveal
          labels={[
            "Bước 1: Lan truyền xuôi (Forward Pass)",
            "Bước 2: Tính hàm mất mát",
            "Bước 3: Lan truyền ngược (Backward Pass)",
            "Bước 4: Cập nhật trọng số",
          ]}
        >
          {/* Bước 1 */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/15 border border-blue-200 dark:border-blue-800 p-4">
            <p className="text-sm text-foreground mb-2">
              Dữ liệu đi từ trái sang phải. Mỗi nơ-ron nhận đầu vào, nhân với trọng số,
              cộng lại, rồi đưa qua hàm sigmoid.
            </p>
            <div className="text-sm font-mono text-muted space-y-1">
              <p>h₁ = σ(0.6 × 0.5 + 0.4 × (−0.3)) = σ(0.18) = <strong className="text-blue-600 dark:text-blue-400">0.5449</strong></p>
              <p>ŷ = σ(0.5449 × 0.8) = σ(0.4359) = <strong className="text-blue-600 dark:text-blue-400">0.6073</strong></p>
            </div>
          </div>

          {/* Bước 2 */}
          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800 p-4">
            <p className="text-sm text-foreground mb-2">
              So sánh dự đoán với mục tiêu. Sai lệch bao nhiêu?
            </p>
            <div className="text-sm">
              <LaTeX block>{"L = (y - \\hat{y})^2 = (0.85 - 0.6073)^2 = 0.0589"}</LaTeX>
            </div>
            <p className="text-xs text-muted mt-2">
              Loss = 0.0589 — mạng dự đoán thiếu khá nhiều so với mục tiêu 0.85.
            </p>
          </div>

          {/* Bước 3 */}
          <div className="rounded-lg bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800 p-4">
            <p className="text-sm text-foreground mb-2">
              Đây là phần quan trọng nhất! Tính <strong>gradient</strong> — mỗi trọng số ảnh hưởng
              đến lỗi bao nhiêu, theo hướng nào.
            </p>
            <div className="text-sm mb-2">
              <LaTeX block>{"\\frac{\\partial L}{\\partial w} = \\frac{\\partial L}{\\partial \\hat{y}} \\cdot \\frac{\\partial \\hat{y}}{\\partial z} \\cdot \\frac{\\partial z}{\\partial w}"}</LaTeX>
            </div>
            <div className="text-sm font-mono text-muted space-y-1">
              <p>∂L/∂w₃ = <strong className="text-red-600 dark:text-red-400">{bpResult.dW2.toFixed(4)}</strong></p>
              <p>∂L/∂w₁ = <strong className="text-red-600 dark:text-red-400">{bpResult.dW0.toFixed(4)}</strong></p>
              <p>∂L/∂w₂ = <strong className="text-red-600 dark:text-red-400">{bpResult.dW1.toFixed(4)}</strong></p>
            </div>
          </div>

          {/* Bước 4 */}
          <div className="rounded-lg bg-green-50 dark:bg-green-900/15 border border-green-200 dark:border-green-800 p-4">
            <p className="text-sm text-foreground mb-2">
              Trọng số mới = trọng số cũ − learning rate × gradient
            </p>
            <div className="text-sm mb-2">
              <LaTeX block>{"w_{\\text{new}} = w_{\\text{old}} - \\alpha \\cdot \\nabla L"}</LaTeX>
            </div>
            <div className="text-sm font-mono text-muted space-y-1">
              <p>w₁: 0.50 → <strong className="text-green-600 dark:text-green-400">{bpResult.newW[0].toFixed(4)}</strong></p>
              <p>w₂: −0.30 → <strong className="text-green-600 dark:text-green-400">{bpResult.newW[1].toFixed(4)}</strong></p>
              <p>w₃: 0.80 → <strong className="text-green-600 dark:text-green-400">{bpResult.newW[2].toFixed(4)}</strong></p>
            </div>
            <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-2">
              Loss: {bpResult.oldLoss.toFixed(4)} → {bpResult.newLoss.toFixed(4)} — giảm sau chỉ 1 bước!
            </p>
          </div>
        </StepReveal>
      </VisualizationSection>

            </LessonSection>

{/* ━━━ BƯỚC 5: THỬ THÁCH ━━━ */}
      <LessonSection step={5} totalSteps={7} label="Thử thách">
      <InlineChallenge
        question="Trong mạng 100 lớp, gradient phải nhân qua 100 đạo hàm. Nếu mỗi đạo hàm có giá trị khoảng 0.5, gradient ở lớp đầu tiên sẽ như thế nào?"
        options={[
          "Vẫn giữ nguyên giá trị",
          "Tăng rất lớn (bùng nổ)",
          "Giảm gần về 0 (biến mất)",
          "Dao động không ổn định",
        ]}
        correct={2}
        explanation="0.5 nhân 100 lần ≈ 0. Gradient 'biến mất' khiến các lớp đầu không được cập nhật. Đây là vanishing gradient — lý do LSTM và ResNet ra đời!"
      />

            </LessonSection>

{/* ━━━ BƯỚC 6: GIẢI THÍCH ━━━ */}
      <LessonSection step={6} totalSteps={7} label="Giải thích">
      <ExplanationSection>
        <p>
          <strong>Backpropagation</strong> (lan truyền ngược) có nguồn gốc từ công trình của
          Seppo Linnainmaa (1970) về vi phân tự động và Paul Werbos (1974), nhưng phiên bản
          hiện đại áp dụng cho mạng nơ-ron được Rumelhart, Hinton & Williams công bố năm 1986.
          Đây là thuật toán nền tảng để huấn luyện mọi mạng nơ-ron ngày nay.
        </p>

        <Callout variant="insight" title="Tại sao gọi là 'lan truyền ngược'?">
          Vì lỗi (loss) được tính ở đầu ra, rồi <em>lan truyền ngược</em> về
          từng lớp trước đó để phân bổ trách nhiệm cho mỗi trọng số. Giống như
          một chuỗi domino — đổ từ cuối về đầu.
        </Callout>

        <p>Công thức cập nhật trọng số:</p>
        <LaTeX block>{"w \\leftarrow w - \\alpha \\cdot \\frac{\\partial L}{\\partial w}"}</LaTeX>
        <p>
          Trong đó <LaTeX>{"\\alpha"}</LaTeX> là learning rate (tốc độ học) và{" "}
          <LaTeX>{"\\frac{\\partial L}{\\partial w}"}</LaTeX> là gradient — đạo hàm
          riêng của hàm mất mát theo trọng số đó.
        </p>

        <Callout variant="tip" title="Quy tắc chuỗi — trái tim của backprop">
          Chain rule cho phép tính đạo hàm qua nhiều lớp bằng cách nhân chuỗi:
          <LaTeX block>{"\\frac{\\partial L}{\\partial w_1} = \\frac{\\partial L}{\\partial \\hat{y}} \\cdot \\frac{\\partial \\hat{y}}{\\partial h} \\cdot \\frac{\\partial h}{\\partial w_1}"}</LaTeX>
          Mỗi lớp đóng góp một thừa số. Không cần tính lại từ đầu — chỉ nhân thêm!
        </Callout>

        <CodeBlock language="python" title="backprop_example.py">{`import torch

# Mạng đơn giản: 2 → 1 → 1
model = torch.nn.Sequential(
    torch.nn.Linear(2, 1),
    torch.nn.Sigmoid(),
    torch.nn.Linear(1, 1),
    torch.nn.Sigmoid()
)

x = torch.tensor([0.6, 0.4])
target = torch.tensor([0.85])

# Forward
output = model(x)
loss = (target - output) ** 2

# Backward — tính gradient tự động!
loss.backward()

# Mỗi trọng số giờ có .grad
for name, param in model.named_parameters():
    print(f"{name}: grad = {param.grad}")`}</CodeBlock>

        <Callout variant="warning" title="Vanishing & Exploding Gradient">
          Khi mạng quá sâu, gradient có thể biến mất (nhân nhiều số nhỏ) hoặc
          bùng nổ (nhân nhiều số lớn). Giải pháp: dùng ReLU thay sigmoid,
          Batch Normalization, Residual Connections (ResNet), hoặc LSTM cho chuỗi.
        </Callout>
      </ExplanationSection>

            </LessonSection>

{/* ━━━ BƯỚC 7: TÓM TẮT ━━━ */}
      <LessonSection step={7} totalSteps={7} label="Tổng kết">
      <MiniSummary
        points={[
          "Backpropagation tính chính xác gradient (hướng + độ lớn cần thay đổi) cho mọi trọng số trong một lần duyệt ngược",
          "Dùng chain rule (quy tắc chuỗi) để phân bổ lỗi từ output ngược về từng lớp",
          "Kết hợp với gradient descent để cập nhật trọng số: w_new = w_old − lr × gradient",
          "Vanishing/exploding gradient là thách thức chính khi mạng sâu — giải pháp: ReLU, ResNet, LayerNorm",
        ]}
      />

      {/* ━━━ BƯỚC 8: KIỂM TRA ━━━ */}
      <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
