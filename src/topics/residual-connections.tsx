"use client";

import { useState, useMemo, useEffect } from "react";
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
  TopicLink,
  CollapsibleDetail,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

// ---------------------------------------------------------------------------
// METADATA — giữ nguyên theo yêu cầu
// ---------------------------------------------------------------------------

export const metadata: TopicMeta = {
  slug: "residual-connections",
  title: "Residual Connections",
  titleVi: "Kết nối tắt",
  description:
    "Đường tắt cho gradient đi qua, cho phép huấn luyện mạng rất sâu mà không bị gradient biến mất",
  category: "dl-architectures",
  tags: ["architecture", "training", "optimization"],
  difficulty: "advanced",
  relatedSlugs: ["transformer", "cnn", "u-net"],
  vizType: "interactive",
};

// ---------------------------------------------------------------------------
// CONSTANTS — pipeline bên trong một ResNet basic block
// Conv → BN → ReLU → Conv → BN → (+input) → ReLU
// ---------------------------------------------------------------------------

type BlockLayer = {
  id: string;
  name: string;
  short: string;
  kind: "conv" | "bn" | "act" | "add";
  desc: string;
};

const BLOCK_LAYERS: BlockLayer[] = [
  {
    id: "conv1",
    name: "Conv 3×3",
    short: "Conv",
    kind: "conv",
    desc: "Tích chập 3×3 học đặc trưng không gian. Trọng số W₁ cần backprop gradient tới đây.",
  },
  {
    id: "bn1",
    name: "BatchNorm",
    short: "BN",
    kind: "bn",
    desc: "Chuẩn hóa theo batch: trừ mean, chia std. Ổn định phân phối activation giữa các lớp.",
  },
  {
    id: "relu1",
    name: "ReLU",
    short: "ReLU",
    kind: "act",
    desc: "Hàm kích hoạt phi tuyến max(0, x). Gradient = 0 ở nửa âm → một nguồn gây vanishing.",
  },
  {
    id: "conv2",
    name: "Conv 3×3",
    short: "Conv",
    kind: "conv",
    desc: "Tích chập 3×3 thứ hai. Trọng số W₂ — phần cuối nhánh chính F(x).",
  },
  {
    id: "bn2",
    name: "BatchNorm",
    short: "BN",
    kind: "bn",
    desc: "BatchNorm cuối nhánh chính. Trước khi cộng với skip connection.",
  },
  {
    id: "add",
    name: "⊕ (+input)",
    short: "⊕",
    kind: "add",
    desc: "Phép cộng element-wise: F(x) + x. Đây là trái tim của residual block.",
  },
  {
    id: "relu2",
    name: "ReLU",
    short: "ReLU",
    kind: "act",
    desc: "ReLU sau cùng, áp dụng cho tổng F(x) + x để tạo output cuối.",
  },
];

// ---------------------------------------------------------------------------
// TRAINING CURVE DATA
// Mạng 20 lớp (not-really-20, tạo hiệu ứng): không skip => loss diverge;
// có skip => loss giảm sạch.
// ---------------------------------------------------------------------------

const CURVE_POINTS = 40;

const TRAINING_LOSS = {
  // Không skip — dao động mạnh, thậm chí đi lên, không hội tụ
  noSkip: Array.from({ length: CURVE_POINTS }, (_, i) => {
    const t = i / (CURVE_POINTS - 1);
    // Bắt đầu ở ~2.3 (cross-entropy với 10 lớp), dao động mạnh, drift lên
    const drift = 2.3 + 0.6 * t; // drift lên dần
    const osc = 0.25 * Math.sin(i * 0.7) + 0.18 * Math.cos(i * 1.1);
    const spike = i === 22 ? 0.9 : i === 31 ? 0.7 : 0;
    return Math.max(0, drift + osc + spike);
  }),
  // Có skip — giảm đều
  skip: Array.from({ length: CURVE_POINTS }, (_, i) => {
    const t = i / (CURVE_POINTS - 1);
    const smooth = 2.3 * Math.exp(-3.2 * t) + 0.12;
    const tinyNoise = 0.03 * Math.sin(i * 0.4);
    return smooth + tinyNoise;
  }),
};

// Gradient magnitude per layer (giả lập) — 20 lớp
const GRADIENT_LAYERS = 20;

const GRADIENT_MAIN_PATH = Array.from({ length: GRADIENT_LAYERS }, (_, i) => {
  // Nhân 0.85^i — vanishing
  return Math.pow(0.85, i);
});

const GRADIENT_SKIP_PATH = Array.from({ length: GRADIENT_LAYERS }, () => 1.0);

// ---------------------------------------------------------------------------
// Depth vs accuracy bar data (đã có sẵn trong bản cũ, giữ lại)
// ---------------------------------------------------------------------------

const DEPTH_DATA = [
  { depth: 8, withSkip: 92, withoutSkip: 90 },
  { depth: 20, withSkip: 95, withoutSkip: 85 },
  { depth: 56, withSkip: 97, withoutSkip: 72 },
  { depth: 110, withSkip: 97.5, withoutSkip: 55 },
  { depth: 152, withSkip: 97.8, withoutSkip: 40 },
];

// ---------------------------------------------------------------------------
// QUIZ (8 câu)
// ---------------------------------------------------------------------------

const quizQuestions: QuizQuestion[] = [
  {
    question: "output = F(x) + x. Nếu F(x) = 0 (lớp không học được gì), output = ?",
    options: [
      "0 — mất hết thông tin",
      "x — input truyền thẳng qua, không mất gì! Trường hợp xấu nhất = identity function",
      "Không xác định",
      "Phụ thuộc vào activation function",
    ],
    correct: 1,
    explanation:
      "Đây là insight cốt lõi. Khi F(x) = 0 → output = x. Thêm lớp residual không bao giờ làm tệ hơn. Mạng chỉ cần học phần 'thay đổi' (residual) F(x) = H(x) − x.",
  },
  {
    question:
      "ResNet-152 có 152 lớp nhưng train tốt. Mạng 20 lớp KHÔNG có skip connection thì sao?",
    options: [
      "Train tốt — 20 lớp không cần skip connection",
      "Vẫn ok nhưng chậm hơn mạng nông",
      "Bắt đầu gặp vanishing gradient — gradient bị nhân nhỏ dần qua 20 lớp backprop",
      "Bung ngay sang exploding gradient",
    ],
    correct: 2,
    explanation:
      "Thực nghiệm (He et al., 2015): mạng plain 20 lớp đã bắt đầu có performance kém hơn mạng 8 lớp. Degradation problem: sâu hơn ≠ tốt hơn khi không có skip.",
  },
  {
    question:
      "Transformer dùng residual connection ở đâu? Pre-Norm vs Post-Norm khác gì?",
    options: [
      "Chỉ ở encoder, không ở decoder",
      "Quanh MỖI sub-layer (attention + FFN). Pre-Norm: LayerNorm trước; Post-Norm: LayerNorm sau",
      "Chỉ ở FFN, không ở attention",
      "Pre-Norm và Post-Norm giống nhau",
    ],
    correct: 1,
    explanation:
      "Mỗi lớp Transformer có 2 residual: x + Attention(x) và x + FFN(x). Pre-Norm (GPT, LLaMA) LN trước → dễ train; Post-Norm (BERT gốc) LN sau → performance nhỉnh hơn nhưng khó train.",
  },
  {
    type: "fill-blank",
    question:
      "Công thức residual block: output = {blank}. Đường tắt này (còn gọi là {blank}) cho gradient chảy trực tiếp qua, giúp train được mạng sâu 100+ lớp.",
    blanks: [
      { answer: "x + F(x)", accept: ["F(x) + x", "x+F(x)", "F(x)+x"] },
      { answer: "skip connection", accept: ["skip", "shortcut", "kết nối tắt"] },
    ],
    explanation:
      "Residual block: y = x + F(x). Skip connection cộng input x trực tiếp vào output của lớp F. Gradient theo x = 1 + dF/dx → luôn có thành phần 1, không vanishing.",
  },
  {
    question:
      "Trong ResNet basic block, thứ tự chuẩn của các lớp bên trong F(x) là gì?",
    options: [
      "Conv → ReLU → BN → Conv → ReLU → BN",
      "Conv → BN → ReLU → Conv → BN (rồi cộng với x, sau đó ReLU)",
      "BN → Conv → BN → Conv → ReLU",
      "Conv → Conv → BN → BN → ReLU",
    ],
    correct: 1,
    explanation:
      "Thứ tự chuẩn: Conv → BN → ReLU → Conv → BN → (+input) → ReLU. Lưu ý: phép cộng với skip xảy ra TRƯỚC ReLU cuối, để identity path không bị kẹp về 0 cho các giá trị âm.",
  },
  {
    question:
      "Giả sử một ResNet-34 có 33 residual block nối tiếp. Nếu mỗi nhánh F có gradient cục bộ ≈ 0, tổng gradient chảy ngược từ output về input xấp xỉ bao nhiêu?",
    options: [
      "Xấp xỉ 0 — vì tất cả nhánh F đều ~ 0",
      "Xấp xỉ 1 — vì mỗi block có đường skip với gradient = 1, 1^33 = 1",
      "Không xác định",
      "Xấp xỉ 33 — vì 33 block cộng dồn",
    ],
    correct: 1,
    explanation:
      "Chain rule với skip: ∂L/∂x ≈ ∏(1 + ∂F_i/∂x). Nếu ∂F_i/∂x ≈ 0 thì tích ≈ 1 — gradient vẫn chạy qua đường skip không bị vanishing. Đây là lý do ResNet train được rất sâu.",
  },
  {
    question:
      "Khi số kênh (channel) của input và output của block khác nhau, ta xử lý skip connection thế nào?",
    options: [
      "Bỏ luôn skip connection ở block đó",
      "Dùng 1×1 conv (projection shortcut) để chiếu x về đúng số kênh",
      "Nhân x với 0",
      "Resize bằng interpolation",
    ],
    correct: 1,
    explanation:
      "Khi dimension mismatch (thường do stride > 1 hoặc đổi số filter), ResNet dùng projection shortcut: y = F(x) + W_s · x, với W_s là 1×1 conv học được. Đây gọi là 'Option B' trong bài báo gốc.",
  },
  {
    question:
      "Tại sao ReLU cuối được đặt SAU phép cộng F(x) + x, chứ không phải SAU F(x) rồi mới cộng?",
    options: [
      "Để tiết kiệm bộ nhớ",
      "Để identity path không bị ReLU kẹp về 0 — x có thể âm vẫn được giữ nguyên qua skip",
      "Vì không quan trọng, hai cách tương đương",
      "Vì ReLU trước cộng làm gradient exploding",
    ],
    correct: 1,
    explanation:
      "Nếu đặt ReLU trước phép cộng trên nhánh skip, mọi giá trị âm của x sẽ bị cắt → phá vỡ identity path. Giữ ReLU SAU phép cộng để skip path luôn 'sạch' (đúng là identity tuyến tính).",
  },
];

// ---------------------------------------------------------------------------
// HELPER — compute path for training curve
// ---------------------------------------------------------------------------

function makePath(values: number[], width: number, height: number, maxY: number): string {
  const stepX = width / (values.length - 1);
  return values
    .map((v, i) => {
      const x = i * stepX;
      const y = height - (v / maxY) * height;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

export default function ResidualConnectionsTopic() {
  // Toggle skip path on / off inside the block
  const [skipOn, setSkipOn] = useState(true);

  // Which layer is highlighted (hovered / clicked) inside the block
  const [activeLayer, setActiveLayer] = useState<string>("add");

  // Show backprop gradient flow animation
  const [showGradient, setShowGradient] = useState(false);

  // Animate the training curve reveal
  const [curveProgress, setCurveProgress] = useState(0);

  // Stream-on effect: every time skipOn changes, replay the curve animation
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const duration = 1600;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setCurveProgress(t);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [skipOn]);

  const TOTAL_STEPS = 9;

  // Derived: gradient magnitudes per layer depending on skip state
  const gradientPerLayer = useMemo(
    () =>
      skipOn
        ? GRADIENT_LAYERS > 0
          ? GRADIENT_SKIP_PATH
          : []
        : GRADIENT_MAIN_PATH,
    [skipOn],
  );

  // Width / height used by curve SVG
  const CURVE_W = 480;
  const CURVE_H = 180;
  const CURVE_MAX_Y = 3.2;

  const pathNoSkip = useMemo(
    () => makePath(TRAINING_LOSS.noSkip, CURVE_W, CURVE_H, CURVE_MAX_Y),
    [],
  );
  const pathSkip = useMemo(
    () => makePath(TRAINING_LOSS.skip, CURVE_W, CURVE_H, CURVE_MAX_Y),
    [],
  );

  // Description of the active layer
  const activeLayerMeta = BLOCK_LAYERS.find((l) => l.id === activeLayer) ?? BLOCK_LAYERS[5];

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 1 — HOOK / PREDICTION GATE
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Mạng 20 lớp đạt accuracy 90%. Bạn thêm thành mạng 56 lớp — kỳ vọng accuracy sẽ tăng. Kết quả thực tế trong thí nghiệm của He et al. (2015)?"
          options={[
            "Accuracy tăng lên 95% — sâu hơn = tốt hơn",
            "Accuracy GIẢM xuống 72% — gradient biến mất qua nhiều lớp, mạng sâu train tệ hơn mạng nông!",
            "Accuracy giữ nguyên 90%",
            "Mạng không train được chút nào — loss = NaN từ epoch đầu",
          ]}
          correct={1}
          explanation="Đây là 'degradation problem' — mạng sâu hơn lại tệ hơn mạng nông. Và quan trọng: KHÔNG phải do overfitting (training loss cũng tăng). ResNet giải quyết bằng skip connection: output = F(x) + x. Gradient chảy thẳng qua đường tắt."
        >
          <p className="mt-4 text-sm text-muted leading-relaxed">
            Đây là hệ quả trực tiếp của{" "}
            <TopicLink slug="vanishing-exploding-gradients">vanishing gradients</TopicLink>.
            Residual connections là giải pháp then chốt cho mạng rất sâu và là một trong
            những ý tưởng có ảnh hưởng lớn nhất trong toàn bộ lịch sử deep learning hiện đại.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 2 — ẨN DỤ THỰC TẾ
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Ẩn dụ">
        <p className="text-sm leading-relaxed text-foreground">
          Hãy tưởng tượng bạn gửi một tin nhắn bằng miệng qua một dãy 20 người truyền
          miệng. Qua mỗi người, tin nhắn bị méo mó thêm một chút — thiếu một từ, sai một
          chữ, hoặc bị hiểu lệch. Đến người thứ 20, tin nhắn gốc đã biến thành chuyện
          &quot;tam sao thất bản&quot;, không còn nhận ra được nữa.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-foreground">
          <strong>Skip connection</strong> giống như việc bạn gửi thêm một{" "}
          <em>bản sao của tin nhắn gốc</em> — bằng giấy, đi thẳng tới người cuối cùng.
          Dù đường truyền miệng có méo tới đâu, người cuối vẫn có tin nhắn gốc để đối
          chiếu. Người cuối cùng học cách{" "}
          <strong>sửa tin nhắn miệng bằng tin nhắn gốc</strong>, thay vì phải dựng lại
          toàn bộ nội dung từ đầu — nhiệm vụ dễ hơn rất nhiều.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-foreground">
          Trong deep learning, &quot;truyền miệng&quot; là các lớp trung gian học đặc
          trưng, còn &quot;bản sao giấy&quot; là chính input x đi qua đường skip. Mạng
          chỉ cần học <strong>phần chênh lệch</strong> F(x) = H(x) − x — phần{" "}
          <em>residual</em> (phần dư). Thay vì buộc mỗi lớp học một ánh xạ phức tạp H(x),
          ta buộc mỗi lớp học một thay đổi nhỏ F(x). Nếu chẳng có gì đáng thay đổi, F(x)
          chỉ cần = 0.
        </p>
        <Callout variant="insight" title="Học phần dư dễ hơn học toàn bộ">
          <p>
            Học &quot;không thay đổi gì&quot; (identity) thông qua một chuỗi Conv + BN +
            ReLU là rất khó — bạn cần nhiều trọng số phối hợp chính xác. Nhưng học
            &quot;F(x) ≈ 0&quot; chỉ cần đẩy các trọng số về gần 0 — dễ hơn rất nhiều.
            ResNet biến bài toán khó thành bài toán dễ.
          </p>
        </Callout>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 3 — VISUALIZATION (ResNet skip connection block + training + grad)
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <div className="space-y-6">
            {/* ─── Controls ─── */}
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2">
                ResNet Basic Block — bật/tắt Skip Connection
              </h3>
              <p className="text-sm text-muted mb-3 leading-relaxed">
                Bật skip để thấy đường tắt x chảy song song với nhánh chính F(x) =
                Conv → BN → ReLU → Conv → BN, sau đó cộng lại rồi qua ReLU cuối. Tắt skip
                để thấy mạng &quot;plain&quot; — gradient sẽ vanishing khi backprop.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSkipOn((v) => !v)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors border ${
                    skipOn
                      ? "bg-accent text-white border-accent"
                      : "bg-card text-muted border-border hover:text-foreground"
                  }`}
                >
                  {skipOn ? "Skip Connection: BẬT" : "Skip Connection: TẮT"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowGradient((v) => !v)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors border ${
                    showGradient
                      ? "bg-accent text-white border-accent"
                      : "bg-card text-muted border-border hover:text-foreground"
                  }`}
                >
                  {showGradient ? "Ẩn gradient backprop" : "Hiện gradient backprop"}
                </button>
              </div>
            </div>

            {/* ─── SVG BLOCK DIAGRAM ─── */}
            <div className="rounded-lg border border-border bg-background p-3">
              <svg viewBox="0 0 560 460" className="w-full">
                {/* Arrow marker */}
                <defs>
                  <marker
                    id="arrow-main"
                    markerWidth="10"
                    markerHeight="8"
                    refX="9"
                    refY="4"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 4, 0 8" fill="#64748b" />
                  </marker>
                  <marker
                    id="arrow-skip"
                    markerWidth="10"
                    markerHeight="8"
                    refX="9"
                    refY="4"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 4, 0 8" fill="#3b82f6" />
                  </marker>
                  <marker
                    id="arrow-grad"
                    markerWidth="10"
                    markerHeight="8"
                    refX="9"
                    refY="4"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 4, 0 8" fill="#ef4444" />
                  </marker>
                </defs>

                {/* Input node */}
                <g
                  onClick={() => setActiveLayer("input")}
                  style={{ cursor: "pointer" }}
                >
                  <rect
                    x={200}
                    y={10}
                    width={160}
                    height={38}
                    rx={10}
                    fill="#0ea5e9"
                    opacity={0.15}
                    stroke="#0ea5e9"
                    strokeWidth={1.5}
                  />
                  <text
                    x={280}
                    y={34}
                    textAnchor="middle"
                    fontSize={13}
                    fontWeight={600}
                    fill="#0ea5e9"
                  >
                    Input x
                  </text>
                </g>

                {/* Main branch: Conv → BN → ReLU → Conv → BN */}
                {BLOCK_LAYERS.slice(0, 5).map((layer, idx) => {
                  const y = 70 + idx * 55;
                  const isActive = activeLayer === layer.id;
                  const color =
                    layer.kind === "conv"
                      ? "#8b5cf6"
                      : layer.kind === "bn"
                        ? "#f59e0b"
                        : "#22c55e";
                  return (
                    <g
                      key={layer.id}
                      onClick={() => setActiveLayer(layer.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <rect
                        x={200}
                        y={y}
                        width={160}
                        height={38}
                        rx={10}
                        fill={color}
                        opacity={isActive ? 0.35 : 0.15}
                        stroke={color}
                        strokeWidth={isActive ? 2.5 : 1.5}
                      />
                      <text
                        x={280}
                        y={y + 24}
                        textAnchor="middle"
                        fontSize={12}
                        fontWeight={600}
                        fill={color}
                      >
                        {layer.name}
                      </text>
                      {/* Gradient magnitude badge on the layer */}
                      {showGradient && (
                        <text
                          x={370}
                          y={y + 24}
                          fontSize={11}
                          fill={skipOn ? "#22c55e" : "#ef4444"}
                          opacity={0.9}
                        >
                          grad ≈{" "}
                          {skipOn
                            ? "1.00"
                            : Math.pow(0.7, 5 - idx).toFixed(2)}
                        </text>
                      )}
                      {/* Forward arrow between layers */}
                      {idx < 4 && (
                        <line
                          x1={280}
                          y1={y + 38}
                          x2={280}
                          y2={y + 55}
                          stroke="#64748b"
                          strokeWidth={1.5}
                          markerEnd="url(#arrow-main)"
                        />
                      )}
                    </g>
                  );
                })}

                {/* Arrow from input to first Conv */}
                <line
                  x1={280}
                  y1={48}
                  x2={280}
                  y2={70}
                  stroke="#64748b"
                  strokeWidth={1.5}
                  markerEnd="url(#arrow-main)"
                />

                {/* ADD node */}
                {(() => {
                  const layer = BLOCK_LAYERS[5];
                  const isActive = activeLayer === layer.id;
                  const y = 355;
                  return (
                    <g
                      onClick={() => setActiveLayer(layer.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <circle
                        cx={280}
                        cy={y}
                        r={22}
                        fill="#f59e0b"
                        opacity={isActive ? 0.4 : 0.15}
                        stroke="#f59e0b"
                        strokeWidth={isActive ? 3 : 2}
                      />
                      <text
                        x={280}
                        y={y + 6}
                        textAnchor="middle"
                        fontSize={22}
                        fontWeight={800}
                        fill="#f59e0b"
                      >
                        +
                      </text>
                      {/* Arrow from last BN to ADD */}
                      <line
                        x1={280}
                        y1={70 + 4 * 55 + 38}
                        x2={280}
                        y2={y - 22}
                        stroke="#64748b"
                        strokeWidth={1.5}
                        markerEnd="url(#arrow-main)"
                      />
                    </g>
                  );
                })()}

                {/* Output ReLU */}
                {(() => {
                  const layer = BLOCK_LAYERS[6];
                  const isActive = activeLayer === layer.id;
                  return (
                    <g
                      onClick={() => setActiveLayer(layer.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <rect
                        x={200}
                        y={400}
                        width={160}
                        height={38}
                        rx={10}
                        fill="#22c55e"
                        opacity={isActive ? 0.35 : 0.15}
                        stroke="#22c55e"
                        strokeWidth={isActive ? 2.5 : 1.5}
                      />
                      <text
                        x={280}
                        y={424}
                        textAnchor="middle"
                        fontSize={12}
                        fontWeight={600}
                        fill="#22c55e"
                      >
                        {layer.name} (output)
                      </text>
                      <line
                        x1={280}
                        y1={377}
                        x2={280}
                        y2={400}
                        stroke="#64748b"
                        strokeWidth={1.5}
                        markerEnd="url(#arrow-main)"
                      />
                    </g>
                  );
                })()}

                {/* Skip connection arrow (left side, curving around the block) */}
                <AnimatePresence>
                  {skipOn && (
                    <motion.g
                      key="skip-arrow"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.path
                        d="M 200,30 L 110,30 L 110,355 L 258,355"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth={3.5}
                        strokeDasharray={showGradient ? "0" : "8 4"}
                        markerEnd="url(#arrow-skip)"
                        animate={
                          showGradient
                            ? { strokeDashoffset: [0, -24] }
                            : { strokeDashoffset: 0 }
                        }
                        transition={{
                          repeat: Infinity,
                          duration: 1.2,
                          ease: "linear",
                        }}
                      />
                      <text
                        x={80}
                        y={195}
                        fontSize={11}
                        fontWeight={700}
                        fill="#3b82f6"
                        textAnchor="middle"
                        transform="rotate(-90, 80, 195)"
                      >
                        skip (identity): x
                      </text>
                      <text
                        x={80}
                        y={215}
                        fontSize={11}
                        fill="#3b82f6"
                        textAnchor="middle"
                        transform="rotate(-90, 80, 215)"
                        opacity={0.9}
                      >
                        gradient = 1 (không suy giảm)
                      </text>
                    </motion.g>
                  )}
                </AnimatePresence>

                {/* Gradient backprop overlay (red arrows going up) */}
                <AnimatePresence>
                  {showGradient && (
                    <motion.g
                      key="grad-overlay"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {/* Red arrows on main path (bottom to top) */}
                      {!skipOn &&
                        [0, 1, 2, 3, 4].map((i) => {
                          const y = 70 + i * 55;
                          const alpha = Math.pow(0.7, 5 - i);
                          return (
                            <line
                              key={`grad-main-${i}`}
                              x1={420}
                              y1={y + 38}
                              x2={420}
                              y2={y + 6}
                              stroke="#ef4444"
                              strokeWidth={2.5}
                              opacity={alpha}
                              markerEnd="url(#arrow-grad)"
                            />
                          );
                        })}
                      {!skipOn && (
                        <text
                          x={460}
                          y={200}
                          fontSize={11}
                          fill="#ef4444"
                          fontWeight={700}
                        >
                          grad suy giảm
                        </text>
                      )}
                      {/* Red arrow on skip path when skip on */}
                      {skipOn && (
                        <motion.path
                          d="M 258,355 L 110,355 L 110,30 L 200,30"
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth={3}
                          strokeDasharray="6 4"
                          animate={{ strokeDashoffset: [0, 20] }}
                          transition={{
                            repeat: Infinity,
                            duration: 1.1,
                            ease: "linear",
                          }}
                          opacity={0.8}
                        />
                      )}
                    </motion.g>
                  )}
                </AnimatePresence>

                {/* Label: F(x) */}
                <text
                  x={395}
                  y={200}
                  fontSize={13}
                  fontWeight={700}
                  fill="#8b5cf6"
                >
                  F(x)
                </text>
                <text x={395} y={216} fontSize={11} fill="#8b5cf6" opacity={0.9}>
                  nhánh residual
                </text>

                {/* Label near ADD */}
                <text
                  x={320}
                  y={360}
                  fontSize={11}
                  fontWeight={600}
                  fill="#f59e0b"
                >
                  {skipOn ? "F(x) + x" : "F(x) only"}
                </text>
              </svg>
            </div>

            {/* ─── Active layer detail ─── */}
            <div className="rounded-lg border border-border bg-background/60 p-3">
              <p className="text-xs font-semibold text-accent uppercase tracking-wide">
                Layer được chọn
              </p>
              <p className="text-sm font-semibold text-foreground mt-1">
                {activeLayerMeta.name}
              </p>
              <p className="text-sm text-muted mt-1 leading-relaxed">
                {activeLayerMeta.desc}
              </p>
            </div>

            {/* ─── Training curve ─── */}
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2">
                Training curve — depth = 20 (loss giảm theo epoch)
              </h3>
              <p className="text-sm text-muted mb-3 leading-relaxed">
                Cùng kiến trúc, cùng hyperparameter — chỉ khác có/không skip connection.
                Không skip: loss dao động mạnh và drift lên (diverge). Có skip: loss
                giảm trơn xuống gần 0.
              </p>
              <div className="rounded-lg border border-border bg-background p-3">
                <svg viewBox={`-30 -10 ${CURVE_W + 60} ${CURVE_H + 40}`} className="w-full">
                  {/* Axes */}
                  <line
                    x1={0}
                    y1={0}
                    x2={0}
                    y2={CURVE_H}
                    stroke="#475569"
                    strokeWidth={1}
                  />
                  <line
                    x1={0}
                    y1={CURVE_H}
                    x2={CURVE_W}
                    y2={CURVE_H}
                    stroke="#475569"
                    strokeWidth={1}
                  />
                  {/* Y labels */}
                  {[0, 1, 2, 3].map((v) => {
                    const y = CURVE_H - (v / CURVE_MAX_Y) * CURVE_H;
                    return (
                      <g key={v}>
                        <line
                          x1={-4}
                          y1={y}
                          x2={0}
                          y2={y}
                          stroke="#475569"
                          strokeWidth={1}
                        />
                        <text x={-8} y={y + 3} fontSize={11} fill="#94a3b8" textAnchor="end">
                          {v.toFixed(1)}
                        </text>
                      </g>
                    );
                  })}
                  {/* X labels */}
                  {[0, 10, 20, 30, 39].map((i) => {
                    const x = (i / (CURVE_POINTS - 1)) * CURVE_W;
                    return (
                      <g key={i}>
                        <line
                          x1={x}
                          y1={CURVE_H}
                          x2={x}
                          y2={CURVE_H + 4}
                          stroke="#475569"
                          strokeWidth={1}
                        />
                        <text
                          x={x}
                          y={CURVE_H + 16}
                          fontSize={11}
                          fill="#94a3b8"
                          textAnchor="middle"
                        >
                          {i}
                        </text>
                      </g>
                    );
                  })}
                  <text
                    x={CURVE_W / 2}
                    y={CURVE_H + 30}
                    fontSize={11}
                    fill="#cbd5e1"
                    textAnchor="middle"
                  >
                    epoch
                  </text>
                  <text
                    x={-24}
                    y={CURVE_H / 2}
                    fontSize={11}
                    fill="#cbd5e1"
                    textAnchor="middle"
                    transform={`rotate(-90, -24, ${CURVE_H / 2})`}
                  >
                    loss
                  </text>

                  {/* No-skip curve */}
                  <motion.path
                    d={pathNoSkip}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray={CURVE_W * 2}
                    animate={{
                      strokeDashoffset: skipOn ? 0 : CURVE_W * 2 - CURVE_W * 2 * curveProgress,
                    }}
                    transition={{ duration: 0.1 }}
                    opacity={skipOn ? 0.4 : 1}
                  />
                  {/* Skip curve */}
                  <motion.path
                    d={pathSkip}
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth={2.5}
                    strokeDasharray={CURVE_W * 2}
                    animate={{
                      strokeDashoffset: skipOn ? CURVE_W * 2 - CURVE_W * 2 * curveProgress : CURVE_W * 2,
                    }}
                    transition={{ duration: 0.1 }}
                    opacity={skipOn ? 1 : 0.3}
                  />

                  {/* Legend */}
                  <g transform={`translate(${CURVE_W - 160}, 5)`}>
                    <rect
                      x={0}
                      y={0}
                      width={150}
                      height={36}
                      rx={6}
                      fill="#0f172a"
                      opacity={0.85}
                      stroke="#334155"
                      strokeWidth={1}
                    />
                    <line x1={8} y1={12} x2={22} y2={12} stroke="#ef4444" strokeWidth={2} />
                    <text x={28} y={15} fontSize={11} fill="#ef4444">
                      plain (không skip) — diverge
                    </text>
                    <line x1={8} y1={26} x2={22} y2={26} stroke="#22c55e" strokeWidth={2.5} />
                    <text x={28} y={29} fontSize={11} fill="#22c55e">
                      ResNet (có skip) — converge
                    </text>
                  </g>
                </svg>
              </div>
            </div>

            {/* ─── Gradient-flow bar chart (per layer) ─── */}
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2">
                Gradient magnitude per layer (backprop 20 lớp)
              </h3>
              <p className="text-sm text-muted mb-3 leading-relaxed">
                Magnitude của ∂L/∂W tại mỗi lớp khi backprop từ loss về đầu mạng. Không
                skip: gradient bị nhân với tích dF/dx &lt; 1 qua nhiều lớp → nhỏ xíu ở đầu.
                Có skip: đường tắt đóng góp thành phần 1 → gradient luôn ≥ ~1.
              </p>
              <div className="space-y-1.5">
                {gradientPerLayer.map((g, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted w-12 text-right">
                      Layer {i + 1}
                    </span>
                    <div className="flex-1 h-3 rounded-full bg-surface overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background: skipOn ? "#22c55e" : "#ef4444",
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${g * 100}%` }}
                        transition={{ duration: 0.4, delay: i * 0.03 }}
                      />
                    </div>
                    <span
                      className="text-[10px] w-14 text-right font-mono"
                      style={{ color: skipOn ? "#22c55e" : "#ef4444" }}
                    >
                      {g.toFixed(3)}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                Khi backprop về layer 1 của mạng plain: gradient ≈ 0.85²⁰ ≈ 0.039 — rất
                nhỏ, trọng số gần như không được cập nhật. Với skip, mỗi block giữ lại
                thành phần = 1 qua đường tắt → tổng gradient giữ ở mức ≥ 1.
              </p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 4 — AHA MOMENT
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>output = F(x) + x</strong>. Mạng không cần học toàn bộ ánh xạ H(x) —
            chỉ cần học <strong>phần dư</strong> F(x) = H(x) − x. Nếu lớp tối ưu là
            identity (không cần thay đổi gì), F(x) chỉ cần = 0 — dễ hơn rất nhiều so
            với việc học lại identity từ một đống Conv + BN + ReLU.
          </p>
          <p className="text-sm text-muted mt-2">
            Và gradient của x + F(x) theo x = 1 + dF/dx. Dù dF/dx nhỏ cỡ nào, gradient
            vẫn có thành phần ≥ 1. Không vanishing. Mạng có thể sâu 100, 152, thậm chí
            1000 lớp.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 5 — INLINE CHALLENGES (2 câu)
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <p className="text-sm text-muted leading-relaxed mb-3">
          Residual connections là thành phần cốt lõi của{" "}
          <TopicLink slug="transformer">Transformer</TopicLink> — được dùng quanh cả
          attention và FFN. Hai câu hỏi dưới đây kiểm tra mức độ nắm vững cơ chế này.
        </p>
        <div className="space-y-4">
          <InlineChallenge
            question="Transformer có 2 residual connections mỗi lớp. Chúng bao quanh gì?"
            options={[
              "Chỉ bao quanh Attention — FFN không cần skip",
              "x + Attention(x) và x + FFN(x) — bao quanh CẢ Attention và FFN riêng biệt",
              "Chỉ 1 skip từ input đến output của toàn bộ lớp",
              "Cả 2 skip cùng bao quanh Attention",
            ]}
            correct={1}
            explanation="Mỗi lớp Transformer: out₁ = x + MultiHeadAttention(x), out₂ = out₁ + FFN(out₁). Hai residual riêng biệt. Gradient chảy tắt qua cả hai — train được GPT-3 96 lớp, PaLM 118 lớp, v.v."
          />
          <InlineChallenge
            question="Bạn có một mạng plain 56 lớp và một ResNet 56 lớp cùng số tham số, cùng optimizer, cùng learning rate. Training loss sau 100 epoch kỳ vọng?"
            options={[
              "Mạng plain thấp hơn ResNet — vì đơn giản hơn",
              "Bằng nhau — skip không ảnh hưởng training loss, chỉ test loss",
              "ResNet thấp hơn hẳn — và mạng plain thậm chí cao hơn mạng 20 lớp",
              "ResNet cao hơn — skip làm mạng &apos;lười học&apos;",
            ]}
            correct={2}
            explanation="Thí nghiệm gốc cho thấy training loss của plain-56 cao hơn plain-20. Đó là bằng chứng degradation KHÔNG phải do overfitting (overfitting chỉ làm test loss tăng, không làm training loss tăng). ResNet-56 giải quyết vấn đề này."
          />
        </div>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 6 — DEPTH VS ACCURACY (bar chart từ bản cũ, giữ lại)
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Độ sâu vs Accuracy">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          ImageNet accuracy theo độ sâu mạng (minh họa)
        </h3>
        <div className="space-y-3">
          {DEPTH_DATA.map((d, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-background/50 p-3"
            >
              <p className="text-xs text-muted mb-2 font-medium">{d.depth} lớp</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-400 w-20">Không skip:</span>
                  <div className="flex-1 h-4 rounded-full bg-surface overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-red-500/60"
                      initial={{ width: 0 }}
                      animate={{ width: `${d.withoutSkip}%` }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                    />
                  </div>
                  <span className="text-xs text-red-400 w-10 text-right">
                    {d.withoutSkip}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-green-400 w-20">Có skip:</span>
                  <div className="flex-1 h-4 rounded-full bg-surface overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-green-500/60"
                      initial={{ width: 0 }}
                      animate={{ width: `${d.withSkip}%` }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                    />
                  </div>
                  <span className="text-xs text-green-400 w-10 text-right">
                    {d.withSkip}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Callout variant="warning" title="Degradation Problem">
          <p>
            Không có skip: 8 lớp (90%) &gt; 56 lớp (72%) &gt; 152 lớp (40%). Sâu hơn =
            TỆ hơn. Có skip: 8 lớp (92%) &lt; 56 lớp (97%) &lt; 152 lớp (97.8%). Sâu
            hơn = TỐT hơn. Khác biệt duy nhất: skip connection.
          </p>
        </Callout>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 7 — EXPLANATION SECTION (definition + LaTeX + 2 CodeBlocks +
                                       4 Callouts + 2 CollapsibleDetails +
                                       applications + pitfalls)
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Giải thích chi tiết">
        <ExplanationSection>
          {/* ── Định nghĩa ── */}
          <p>
            <strong>Residual Connection</strong> (He et al., 2015, &quot;Deep Residual
            Learning for Image Recognition&quot;) là một cơ chế kiến trúc trong đó
            input của một khối lớp được <em>cộng trực tiếp</em> vào output của khối đó
            qua một đường &quot;tắt&quot; (shortcut). Thay vì buộc khối phải học ánh xạ
            mục tiêu H(x) trực tiếp, ta cho khối học phần dư F(x) = H(x) − x. Công thức
            tổng quát của một residual block là:
          </p>

          <LaTeX block>{String.raw`y = F(x, \{W_i\}) + x`}</LaTeX>

          <p className="mt-3">
            với F là hàm residual do các trọng số W₁, W₂, ... biểu diễn (thường là 2
            hoặc 3 lớp Conv+BN+ReLU). Khi kích thước của x và F(x) khác nhau (do đổi
            số kênh hoặc downsample bằng stride), ta dùng <em>projection shortcut</em>:
          </p>

          <LaTeX block>{String.raw`y = F(x, \{W_i\}) + W_s \, x`}</LaTeX>

          <p className="mt-3">
            với W_s là một lớp 1×1 convolution chỉ để đồng bộ dimension. Gradient của
            loss theo input của block:
          </p>

          <LaTeX block>{String.raw`\frac{\partial \mathcal{L}}{\partial x} = \frac{\partial \mathcal{L}}{\partial y} \cdot \left( 1 + \frac{\partial F}{\partial x} \right)`}</LaTeX>

          <p className="text-sm text-muted mt-2 leading-relaxed">
            Gradient luôn có thành phần <strong>1</strong> từ skip connection cộng với
            dF/dx. Dù dF/dx nhỏ → gradient vẫn ≥ 1. Tổng gradient qua N block xếp chồng
            là ∏(1 + dF_i/dx), không phải ∏(dF_i/dx) — đây là lý do ResNet không bị
            vanishing gradient dù sâu bao nhiêu lớp.
          </p>

          {/* ── Callout 1 — insight: Pre-Norm vs Post-Norm ── */}
          <Callout variant="insight" title="Pre-Norm vs Post-Norm">
            <p>
              <strong>Post-Norm</strong> (ResNet gốc, BERT gốc): y = LayerNorm(x +
              F(x)). Performance tốt nhưng khó train cho mạng rất sâu vì LayerNorm nằm
              TRÊN đường skip, chặn một phần gradient.{" "}
              <strong>Pre-Norm</strong> (GPT, LLaMA, hầu hết LLM hiện đại): y = x +
              F(LayerNorm(x)). Dễ train hơn vì gradient chảy thẳng qua skip không bị
              LayerNorm chặn — đổi lại cần một LayerNorm cuối cùng trước output.
            </p>
          </Callout>

          {/* ── CodeBlock 1 — Residual block cơ bản ── */}
          <CodeBlock language="python" title="residual_block.py">
            {`import torch
import torch.nn as nn
import torch.nn.functional as F

class BasicResidualBlock(nn.Module):
    """
    ResNet basic block: Conv → BN → ReLU → Conv → BN → (+input) → ReLU

    Nếu số kênh đầu vào và ra khác nhau hoặc stride > 1,
    dùng projection shortcut (1x1 conv) để khớp dimension.
    """

    expansion = 1

    def __init__(self, in_ch: int, out_ch: int, stride: int = 1):
        super().__init__()
        self.conv1 = nn.Conv2d(in_ch, out_ch, kernel_size=3,
                               stride=stride, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(out_ch)
        self.conv2 = nn.Conv2d(out_ch, out_ch, kernel_size=3,
                               stride=1, padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(out_ch)

        # Skip connection: identity nếu dimension khớp,
        # còn không thì dùng 1x1 conv (projection shortcut).
        if stride != 1 or in_ch != out_ch * self.expansion:
            self.shortcut = nn.Sequential(
                nn.Conv2d(in_ch, out_ch * self.expansion,
                          kernel_size=1, stride=stride, bias=False),
                nn.BatchNorm2d(out_ch * self.expansion),
            )
        else:
            self.shortcut = nn.Identity()

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        identity = self.shortcut(x)

        # Nhánh chính F(x): Conv → BN → ReLU → Conv → BN
        out = self.conv1(x)
        out = self.bn1(out)
        out = F.relu(out, inplace=True)
        out = self.conv2(out)
        out = self.bn2(out)

        # Cộng với skip TRƯỚC khi qua ReLU cuối
        out = out + identity
        out = F.relu(out, inplace=True)
        return out


# Ví dụ: xếp chồng 3 block tạo thành một stage của ResNet
layers = nn.Sequential(
    BasicResidualBlock(in_ch=64, out_ch=64),
    BasicResidualBlock(in_ch=64, out_ch=64),
    BasicResidualBlock(in_ch=64, out_ch=128, stride=2),  # downsample
)
x = torch.randn(8, 64, 56, 56)
y = layers(x)
print(y.shape)  # torch.Size([8, 128, 28, 28])`}
          </CodeBlock>

          {/* ── Callout 2 — tip: Bottleneck block ── */}
          <Callout variant="tip" title="Bottleneck block — tiết kiệm tham số">
            <p>
              ResNet-50/101/152 dùng <em>bottleneck block</em> với 3 lớp: 1×1 (giảm
              kênh) → 3×3 (xử lý không gian) → 1×1 (tăng kênh lại). Tên &quot;bottleneck&quot;
              vì tầng giữa có số kênh nhỏ hơn. Giúp giảm tham số mà vẫn giữ depth lớn.
              Output cuối cùng có số kênh = 4× input (expansion = 4).
            </p>
          </Callout>

          {/* ── CollapsibleDetail 1 — Identity Mapping paper (He 2016) ── */}
          <CollapsibleDetail title="Chứng minh toán: Identity Mapping đảm bảo gradient không bị tiêu biến">
            <p>
              Trong bài báo follow-up &quot;Identity Mappings in Deep Residual
              Networks&quot; (He et al., 2016), các tác giả chứng minh rằng nếu skip
              path là identity thuần khiết (không có BN, ReLU, conv chặn ở giữa), thì
              với N block xếp chồng, ta có:
            </p>
            <LaTeX block>{String.raw`x_L = x_{\ell} + \sum_{i=\ell}^{L-1} F(x_i, W_i)`}</LaTeX>
            <p className="mt-2">
              Nghĩa là activation tại lớp sâu L là tổng của activation tại lớp nông ℓ
              cộng toàn bộ các residual. Khi backprop, gradient theo x_ℓ là:
            </p>
            <LaTeX block>{String.raw`\frac{\partial \mathcal{L}}{\partial x_\ell} = \frac{\partial \mathcal{L}}{\partial x_L} \left( 1 + \frac{\partial}{\partial x_\ell} \sum_{i=\ell}^{L-1} F \right)`}</LaTeX>
            <p className="mt-2">
              Thành phần 1 đảm bảo gradient luôn chảy ngược về lớp ℓ không bị triệt
              tiêu, dù các F_i có gradient nhỏ. Đây là chứng minh lý thuyết cho việc
              ResNet train được 1000+ lớp.
            </p>
          </CollapsibleDetail>

          {/* ── Callout 3 — warning: Projection shortcut phá vỡ identity ── */}
          <Callout variant="warning" title="Projection shortcut phá vỡ tính identity">
            <p>
              Khi dùng 1×1 conv trên skip path (option B/C), đường tắt không còn là
              identity thuần khiết — nó trở thành một phép biến đổi tuyến tính có
              trọng số. Điều này có thể làm giảm nhẹ lợi ích gradient flow, nhưng cần
              thiết khi downsample. Trong thực hành, người ta chỉ dùng projection ở
              block đầu của mỗi stage (khi đổi số kênh), còn lại là identity thuần.
            </p>
          </Callout>

          {/* ── CodeBlock 2 — Pre-Norm Transformer block ── */}
          <CodeBlock language="python" title="transformer_block_pre_norm.py">
            {`import torch
import torch.nn as nn

class PreNormTransformerBlock(nn.Module):
    """
    Một block Transformer kiểu Pre-Norm (GPT-2, LLaMA, Mistral).

    2 residual connections mỗi block:
      1) x = x + MultiHeadAttention(LayerNorm(x))
      2) x = x + FFN(LayerNorm(x))

    Gradient chảy thẳng qua 2 đường skip không bị LayerNorm chặn.
    """

    def __init__(self, d_model: int, n_heads: int, d_ff: int,
                 dropout: float = 0.1):
        super().__init__()
        self.norm1 = nn.LayerNorm(d_model)
        self.attn = nn.MultiheadAttention(
            d_model, n_heads, dropout=dropout, batch_first=True
        )
        self.norm2 = nn.LayerNorm(d_model)
        self.ffn = nn.Sequential(
            nn.Linear(d_model, d_ff),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(d_ff, d_model),
        )
        self.drop = nn.Dropout(dropout)

    def forward(self, x: torch.Tensor,
                attn_mask: torch.Tensor | None = None) -> torch.Tensor:
        # Residual 1: quanh self-attention
        a = self.norm1(x)
        attn_out, _ = self.attn(a, a, a, attn_mask=attn_mask,
                                need_weights=False)
        x = x + self.drop(attn_out)

        # Residual 2: quanh FFN
        x = x + self.drop(self.ffn(self.norm2(x)))
        return x


# Xếp chồng 48 block như GPT-2 Medium
blocks = nn.Sequential(*[
    PreNormTransformerBlock(d_model=1024, n_heads=16, d_ff=4096)
    for _ in range(48)
])
x = torch.randn(2, 256, 1024)
y = blocks(x)
print(y.shape)  # torch.Size([2, 256, 1024])`}
          </CodeBlock>

          {/* ── CollapsibleDetail 2 — Why "residual" helps optimization ── */}
          <CollapsibleDetail title="Tại sao &apos;học phần dư&apos; dễ hơn &apos;học toàn bộ&apos;?">
            <p>
              Đây là câu hỏi then chốt. Câu trả lời liên quan đến geometry của loss
              landscape:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>
                Nếu ánh xạ tối ưu H*(x) gần với identity (ví dụ: mạng đã khá tốt, chỉ
                cần &quot;vi chỉnh&quot;), thì F*(x) = H*(x) − x ≈ 0 — gần gốc tọa độ.
              </li>
                <li>
                Hàm gần 0 có <em>low magnitude</em> — SGD dễ hội tụ hơn vì khởi tạo
                ngẫu nhiên (mean 0) đã gần với lời giải.
              </li>
              <li>
                Ngược lại, để mạng plain học identity từ đầu, các trọng số phải phối hợp
                chính xác (Conv phải khử hiệu ứng BN, BN phải khử hiệu ứng ReLU, ...) —
                lời giải nằm ở một &quot;hẻm núi hẹp&quot; khó tìm.
              </li>
              <li>
                Thí nghiệm loss landscape (Li et al., 2018) chứng minh ResNet có loss
                surface <em>trơn hơn hẳn</em> so với plain network cùng depth — thung
                lũng rộng, ít local minima xấu.
              </li>
            </ul>
          </CollapsibleDetail>

          {/* ── Callout 4 — info: Ứng dụng ngoài ResNet ── */}
          <Callout variant="insight" title="Skip connection có mặt ở khắp mọi nơi">
            <p>
              Ngoài ResNet, skip connection là thành phần bắt buộc của: Transformer
              (Attention + FFN), U-Net (encoder → decoder concatenate), DenseNet (nối
              tất cả các lớp trước với mọi lớp sau), Highway Networks (tiền nhiệm của
              ResNet với gating), Diffusion Models (U-Net backbone), GNN (residual
              giữa các layer), và thậm chí cả LSTM/GRU (cell-state carry-over là một
              dạng skip qua thời gian).
            </p>
          </Callout>

          {/* ── Ứng dụng thực tế ── */}
          <h3 className="text-base font-semibold text-foreground mt-6 mb-2">
            Ứng dụng thực tế
          </h3>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>
              <strong>Computer Vision:</strong> ResNet-50/101/152 là backbone chuẩn
              cho object detection (Faster R-CNN), segmentation (Mask R-CNN, DeepLab),
              pose estimation, v.v. Hầu hết mọi CNN từ 2016 trở đi đều có skip.
            </li>
            <li>
              <strong>NLP / LLM:</strong> Mọi Transformer (BERT, GPT, T5, LLaMA,
              Claude, Gemini) đều có 2 residual connections mỗi block. GPT-3 96 lớp,
              GPT-4 ước tính 120+ lớp — không có skip là không train được.
            </li>
            <li>
              <strong>Generative Models:</strong> U-Net backbone của Stable Diffusion
              có skip từ encoder sang decoder ở mọi resolution. DDPM, Flow Matching,
              Rectified Flow đều dùng.
            </li>
            <li>
              <strong>Reinforcement Learning:</strong> AlphaGo, AlphaZero, MuZero dùng
              ResNet làm policy/value network. Dreamer, IMPALA dùng residual trong
              world model.
            </li>
            <li>
              <strong>Speech:</strong> Whisper, wav2vec 2.0 có skip connection trong
              cả convolutional feature extractor và Transformer encoder.
            </li>
          </ul>

          {/* ── Pitfalls ── */}
          <h3 className="text-base font-semibold text-foreground mt-6 mb-2">
            Những lỗi thường gặp (pitfalls)
          </h3>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>
              <strong>Quên cộng x trước ReLU cuối:</strong> Một số implementation đặt
              ReLU trước phép cộng — điều này cắt toàn bộ giá trị âm của F(x) và có
              thể làm mạng kém đi. Đặt ReLU SAU phép cộng F(x) + x.
            </li>
            <li>
              <strong>Dimension mismatch không xử lý:</strong> Khi stride &gt; 1 hoặc
              đổi số kênh, quên projection shortcut → torch báo lỗi shape. Luôn kiểm
              tra x.shape == F(x).shape trước khi cộng.
            </li>
            <li>
              <strong>Khởi tạo F(x) quá lớn:</strong> Nếu trọng số của F khởi tạo lớn,
              F(x) át hẳn x — skip mất tác dụng. Dùng <em>zero-init</em> cho lớp cuối
              của F hoặc gamma = 0 cho BN cuối (&quot;ZeroInit&quot;, &quot;Fixup&quot;).
            </li>
            <li>
              <strong>BN trên skip path:</strong> Đặt BN trên đường tắt làm skip không
              còn là identity. Tránh — chỉ đặt BN trong nhánh F(x) hoặc dùng projection
              thật cẩn trọng.
            </li>
            <li>
              <strong>Dropout trên skip path:</strong> Tương tự, dropout ngẫu nhiên
              &quot;ngắt&quot; đường skip → mất lợi thế gradient flow. Dropout chỉ
              trong nhánh F(x).
            </li>
          </ul>

          {/* ── Closing ── */}
          <p className="mt-4">
            <strong>Trong thực tế:</strong> Gần như mọi kiến trúc sâu hiện đại đều có
            skip connection ở một dạng nào đó. Khi bạn tự thiết kế mạng &gt; 10 lớp,
            thêm skip gần như không bao giờ hại — chỉ có lợi hoặc không đổi. Đây là
            một trong những &quot;default choice&quot; an toàn nhất trong deep
            learning.
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 8 — MINI SUMMARY (6 điểm)
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Residual Connections"
          points={[
            "Công thức: output = F(x) + x. Mạng chỉ học phần dư F(x) = H(x) − x thay vì học toàn bộ H(x).",
            "Gradient = 1 + dF/dx → luôn có thành phần 1 → không vanishing, train được mạng 100+ lớp (ResNet-152, GPT-3, LLaMA).",
            "Trường hợp xấu nhất: F(x) = 0 → output = x (identity). Thêm block không bao giờ làm tệ hơn.",
            "Thứ tự chuẩn trong basic block: Conv → BN → ReLU → Conv → BN → (+x) → ReLU. ReLU cuối SAU phép cộng.",
            "Dimension mismatch: dùng projection shortcut (1×1 conv với stride phù hợp) để khớp kích thước x với F(x).",
            "Skip connection có mặt trong Transformer (2 per block), U-Net, DenseNet, Diffusion U-Net, LSTM/GRU — là default của deep learning hiện đại.",
          ]}
        />
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 9 — QUIZ (8 câu)
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={9} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
