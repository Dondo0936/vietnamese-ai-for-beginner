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

// ────────────────────────────────────────────────────────────────────────────
// Metadata (giữ nguyên — giữ router và card trang tổng hợp khớp backend)
// ────────────────────────────────────────────────────────────────────────────
export const metadata: TopicMeta = {
  slug: "transfer-learning",
  title: "Transfer Learning",
  titleVi: "Học chuyển giao",
  description:
    "Tận dụng kiến thức từ mô hình đã huấn luyện trước để giải bài toán mới",
  category: "dl-architectures",
  tags: ["training", "fine-tuning", "practical"],
  difficulty: "intermediate",
  relatedSlugs: ["cnn", "transformer", "residual-connections"],
  vizType: "interactive",
};

const TOTAL_STEPS = 10;

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────
type StrategyId = "feature" | "last3" | "full";

interface NetLayer {
  id: string;
  name: string;
  shortName: string;
  kind: "conv" | "pool" | "fc" | "head";
  params: string;
  role: string;
  depth: number; // 1 = shallow, 5 = deep
}

interface Strategy {
  id: StrategyId;
  name: string;
  shortName: string;
  description: string;
  trainable: boolean[]; // song song với LAYERS
  dataNeeded: string;
  timeNeeded: string;
  riskOverfit: "low" | "mid" | "high";
  notes: string;
  // Curve: accuracy trên validation theo 10 epochs
  curve: number[];
  finalAcc: number;
  finalLoss: number;
}

// ────────────────────────────────────────────────────────────────────────────
// Kiến trúc mô phỏng: một CNN pretrained trên ImageNet, gồm các block nông →
// sâu. Bản vẽ không cần chính xác về số tham số; mục tiêu là minh họa khái
// niệm "frozen" vs "trainable" và vị trí block trong tháp đặc trưng.
// ────────────────────────────────────────────────────────────────────────────
const LAYERS: NetLayer[] = [
  {
    id: "input",
    name: "Input 224×224×3",
    shortName: "Input",
    kind: "conv",
    params: "—",
    role: "Ảnh đầu vào đã chuẩn hoá theo mean/std của ImageNet.",
    depth: 0,
  },
  {
    id: "conv1",
    name: "Conv Block 1",
    shortName: "Conv1",
    kind: "conv",
    params: "~9 K",
    role: "Phát hiện cạnh, gradient màu, kết cấu cực nông — gần như universal.",
    depth: 1,
  },
  {
    id: "conv2",
    name: "Conv Block 2",
    shortName: "Conv2",
    kind: "conv",
    params: "~74 K",
    role: "Góc, đường cong, hoa văn lặp đơn giản.",
    depth: 2,
  },
  {
    id: "conv3",
    name: "Conv Block 3",
    shortName: "Conv3",
    kind: "conv",
    params: "~295 K",
    role: "Bộ phận vật thể: mắt, bánh xe, tai, lá.",
    depth: 3,
  },
  {
    id: "conv4",
    name: "Conv Block 4",
    shortName: "Conv4",
    kind: "conv",
    params: "~1.2 M",
    role: "Vật thể phức tạp: khuôn mặt chó, chiếc xe hoàn chỉnh.",
    depth: 4,
  },
  {
    id: "conv5",
    name: "Conv Block 5",
    shortName: "Conv5",
    kind: "conv",
    params: "~2.4 M",
    role: "Khái niệm rất sát lớp phân loại: 'giống chó Husky', 'xe tải đỏ'.",
    depth: 5,
  },
  {
    id: "gap",
    name: "Global Avg Pool",
    shortName: "GAP",
    kind: "pool",
    params: "0",
    role: "Gom tensor không-gian thành vector đặc trưng.",
    depth: 5,
  },
  {
    id: "fc",
    name: "FC (bottleneck)",
    shortName: "FC",
    kind: "fc",
    params: "~524 K",
    role: "Kết hợp đặc trưng cao cấp, hình thành embedding.",
    depth: 5,
  },
  {
    id: "head",
    name: "Classifier head (MỚI)",
    shortName: "Head",
    kind: "head",
    params: "~10 K",
    role: "Lớp phân loại riêng cho bài toán mới — luôn được huấn luyện lại.",
    depth: 6,
  },
];

// ────────────────────────────────────────────────────────────────────────────
// 3 chiến lược: Feature extraction / Fine-tune 3 lớp cuối / Fine-tune all
// trainable[] song song với LAYERS[]. Đường cong accuracy (validation) theo
// 10 epochs — số liệu được thiết kế để phản ánh đúng xu hướng kỳ vọng.
// ────────────────────────────────────────────────────────────────────────────
const STRATEGIES: Record<StrategyId, Strategy> = {
  feature: {
    id: "feature",
    name: "Feature extraction",
    shortName: "Feature",
    description:
      "Đóng băng toàn bộ backbone, chỉ huấn luyện classifier head mới.",
    trainable: [
      false, // input
      false, // conv1
      false, // conv2
      false, // conv3
      false, // conv4
      false, // conv5
      false, // gap
      false, // fc
      true, // head
    ],
    dataNeeded: "Rất ít (vài trăm – 1K ảnh)",
    timeNeeded: "Vài phút trên 1 GPU",
    riskOverfit: "low",
    notes:
      "Nhanh, rẻ, ít overfit. Nhược điểm: nếu bài toán khác xa ImageNet, đặc trưng có thể không đủ tốt.",
    // Lên nhanh, cao nguyên sớm vì backbone không học thêm
    curve: [0.32, 0.58, 0.69, 0.74, 0.77, 0.78, 0.79, 0.79, 0.80, 0.80],
    finalAcc: 0.8,
    finalLoss: 0.58,
  },
  last3: {
    id: "last3",
    name: "Fine-tune 3 lớp cuối",
    shortName: "Last 3",
    description:
      "Đóng băng các block nông, mở khoá conv4, conv5, fc và head để học.",
    trainable: [
      false, // input
      false, // conv1
      false, // conv2
      false, // conv3
      true, // conv4
      true, // conv5
      false, // gap
      true, // fc
      true, // head
    ],
    dataNeeded: "Trung bình (1K – 10K ảnh)",
    timeNeeded: "1–2 giờ trên 1 GPU",
    riskOverfit: "mid",
    notes:
      "Kết hợp tốt giữa tốc độ và linh hoạt. Dùng learning rate rất nhỏ cho block pretrained để không phá trọng số.",
    // Học lâu hơn, đạt đỉnh cao hơn
    curve: [0.28, 0.55, 0.70, 0.78, 0.83, 0.86, 0.88, 0.89, 0.90, 0.91],
    finalAcc: 0.91,
    finalLoss: 0.3,
  },
  full: {
    id: "full",
    name: "Fine-tune toàn bộ",
    shortName: "Full",
    description:
      "Mở khoá mọi lớp, huấn luyện lại cả backbone với learning rate thấp.",
    trainable: [
      false, // input (vẫn không có tham số)
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
    ],
    dataNeeded: "Nhiều (≥10K ảnh khuyến nghị)",
    timeNeeded: "Nhiều giờ đến vài ngày",
    riskOverfit: "high",
    notes:
      "Linh hoạt nhất nhưng dễ overfit với dữ liệu ít. Cần early stopping, augmentation, và LR schedule phù hợp.",
    // Học chậm ban đầu, nếu có đủ data sẽ vượt last3; ở đây mô phỏng dữ liệu
    // đủ nhiều để đạt đỉnh cao nhất, nhưng bắt đầu chậm hơn vì phải điều
    // chỉnh nhiều tham số hơn.
    curve: [0.22, 0.47, 0.64, 0.75, 0.82, 0.87, 0.90, 0.92, 0.93, 0.94],
    finalAcc: 0.94,
    finalLoss: 0.22,
  },
};

const STRATEGY_ORDER: StrategyId[] = ["feature", "last3", "full"];

// ────────────────────────────────────────────────────────────────────────────
// 8 quiz questions
// ────────────────────────────────────────────────────────────────────────────
const QUIZ: QuizQuestion[] = [
  {
    question:
      "Bạn có 200 ảnh chó/mèo. Nên dùng chiến lược transfer learning nào?",
    options: [
      "Train CNN từ đầu — 200 ảnh là đủ",
      "Feature extraction: đóng băng ResNet pretrained, chỉ train lớp FC cuối",
      "Full fine-tuning: train lại toàn bộ ResNet",
      "Bỏ qua transfer learning, dùng k-NN trên pixel",
    ],
    correct: 1,
    explanation:
      "200 ảnh quá ít để train CNN từ đầu (dễ overfitting). Feature extraction dùng đặc trưng đã học từ ImageNet (1,4 triệu ảnh) → chỉ cần train 1 lớp FC với 200 ảnh. Nhanh và hiệu quả!",
  },
  {
    question:
      "Tại sao fine-tuning dùng learning rate nhỏ hơn training từ đầu?",
    options: [
      "Vì GPU yếu hơn",
      "Vì trọng số pretrained đã gần tối ưu — LR lớn sẽ phá hỏng kiến thức đã học",
      "Vì dataset nhỏ hơn nên cần LR nhỏ",
      "Không cần — dùng LR bình thường",
    ],
    correct: 1,
    explanation:
      "Trọng số pretrained đã 'biết' phát hiện cạnh, hình dạng, vật thể. LR lớn (ví dụ 0.01) sẽ thay đổi quá mạnh → phá hỏng kiến thức. LR nhỏ (ví dụ 1e-5) tinh chỉnh nhẹ nhàng → giữ kiến thức cũ + thích nghi bài toán mới.",
  },
  {
    question:
      "GPT, BERT, LLaMA đều là mô hình pretrained. Đây là ví dụ transfer learning ở đâu?",
    options: [
      "Chỉ trong Computer Vision",
      "NLP: pretrain trên text khổng lồ (WebText, C4), fine-tune cho từng tác vụ (chatbot, dịch, phân loại...)",
      "Chỉ trong Reinforcement Learning",
      "Không phải transfer learning, chỉ là pretraining",
    ],
    correct: 1,
    explanation:
      "Mô hình NLP lớn pretrain trên hàng tỷ từ → học 'hiểu ngôn ngữ' tổng quát. Fine-tune cho chatbot (ChatGPT), dịch máy, tóm tắt, phân loại... Paradigm 'pretrain once, fine-tune many' thống trị AI hiện đại.",
  },
  {
    type: "fill-blank",
    question:
      "Trong transfer learning, ta thường {blank} (giữ nguyên không cập nhật gradient) các lớp nông và {blank} (tiếp tục huấn luyện) các lớp gần đầu ra.",
    blanks: [
      {
        answer: "đóng băng",
        accept: ["freeze", "đóng băng", "frozen", "freezes"],
      },
      {
        answer: "fine-tune",
        accept: ["fine tune", "finetune", "tinh chỉnh", "fine-tuning"],
      },
    ],
    explanation:
      "'Freeze' (đặt requires_grad=False) giữ nguyên trọng số. 'Fine-tune' là huấn luyện tiếp với learning rate nhỏ. Cặp thao tác này là nền tảng cú pháp của mọi pipeline transfer learning.",
  },
  {
    question:
      "Vì sao lớp nông (conv1, conv2) thường đáng được đóng băng hơn lớp sâu?",
    options: [
      "Vì lớp nông có nhiều tham số hơn",
      "Vì đặc trưng lớp nông (cạnh, màu) gần như universal giữa các bài toán ảnh — rất khó cải thiện thêm từ dữ liệu mới ít ỏi",
      "Vì lớp nông chạy nhanh hơn",
      "Không có lý do, đây chỉ là quy ước",
    ],
    correct: 1,
    explanation:
      "Các công trình như Yosinski et al. (2014) đã chỉ ra đặc trưng lớp nông có tính transferable cao giữa các tập ảnh tự nhiên. Fine-tune chúng với dữ liệu nhỏ thường làm tệ đi (overfitting) chứ không cải thiện.",
  },
  {
    question:
      "Một bác sĩ muốn phân loại ảnh X-quang phổi (khác rất xa ảnh ImageNet). Điều gì đúng?",
    options: [
      "Vẫn nên feature extraction thuần — luôn tốt nhất",
      "Nên fine-tune nhiều lớp hơn (ít nhất 3–5 block cuối) vì domain lệch xa, đặc trưng sâu cần điều chỉnh mạnh",
      "Phải train từ đầu, không tận dụng được pretrained",
      "Dùng ResNet cho ảnh X-quang là sai hoàn toàn",
    ],
    correct: 1,
    explanation:
      "Khi domain khác xa (y khoa, ảnh vệ tinh), đặc trưng sâu của ImageNet ít phù hợp → cần fine-tune nhiều hơn. Lớp nông (cạnh, tương phản) vẫn hữu ích nên thường vẫn giữ nguyên.",
  },
  {
    question:
      "Khi fine-tune toàn bộ với dataset nhỏ, dấu hiệu overfitting điển hình là gì?",
    options: [
      "Train loss giảm, val loss cũng giảm",
      "Train loss tiếp tục giảm nhưng val loss bắt đầu tăng sau vài epoch",
      "Val accuracy vượt train accuracy",
      "Learning rate tăng tự động",
    ],
    correct: 1,
    explanation:
      "Biểu hiện kinh điển: training loss tiếp tục giảm (mô hình nhớ training set) trong khi validation loss tăng trở lại. Đây là lúc cần early stopping, giảm LR, tăng augmentation hoặc đóng băng bớt lớp.",
  },
  {
    question:
      "Trong PyTorch, câu nào sau đây ĐÚNG để đóng băng backbone của một mô hình?",
    options: [
      "model.eval() là đủ để đóng băng",
      "Đặt requires_grad=False cho mọi param của backbone và chỉ truyền param của head vào optimizer",
      "Xoá param của backbone",
      "Gọi torch.no_grad() quanh forward pass",
    ],
    correct: 1,
    explanation:
      "model.eval() chỉ chuyển sang chế độ inference (BN/Dropout). Để THỰC SỰ không cập nhật trọng số: set requires_grad=False và chỉ đưa param trainable vào optimizer. Kết hợp cả hai để đóng băng đúng nghĩa.",
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Sub-component: vẽ một block mạng (layer) dưới dạng thẻ
// ────────────────────────────────────────────────────────────────────────────
function LayerBlock({
  layer,
  trainable,
  highlighted,
}: {
  layer: NetLayer;
  trainable: boolean;
  highlighted: boolean;
}) {
  const color = trainable ? "#f97316" : "#64748b"; // orange vs slate
  const fill = trainable ? "rgba(249,115,22,0.18)" : "rgba(100,116,139,0.12)";
  const border = trainable ? color : "rgba(100,116,139,0.45)";

  return (
    <motion.div
      layout
      initial={false}
      animate={{
        opacity: 1,
        scale: highlighted ? 1.02 : 1,
      }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border p-2 flex items-center gap-2 text-xs"
      style={{ background: fill, borderColor: border }}
    >
      <div
        className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center font-bold text-[10px] text-white uppercase"
        style={{ background: color }}
        aria-hidden
      >
        {layer.shortName}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-foreground">{layer.name}</span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase"
            style={{ background: fill, color }}
          >
            {trainable ? "Trainable" : "Frozen"}
          </span>
        </div>
        <div className="text-[10px] text-muted mt-0.5">
          {layer.params} params · depth {layer.depth}
        </div>
        <div className="text-[11px] text-muted mt-0.5 leading-snug">
          {layer.role}
        </div>
      </div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Sub-component: vẽ đường cong accuracy vs epochs cho cả ba chiến lược
// ────────────────────────────────────────────────────────────────────────────
function TrainingCurves({ active }: { active: StrategyId }) {
  const epochs = 10;
  const width = 460;
  const height = 220;
  const pad = { l: 40, r: 10, t: 18, b: 28 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;

  const xScale = (i: number) => pad.l + (i / (epochs - 1)) * innerW;
  const yScale = (v: number) => pad.t + (1 - v) * innerH;

  const curveFor = (id: StrategyId) => STRATEGIES[id].curve;

  const colorFor = (id: StrategyId) =>
    id === "feature" ? "#3b82f6" : id === "last3" ? "#22c55e" : "#f97316";

  const pathFor = (id: StrategyId) =>
    curveFor(id)
      .map((v, i) => `${i === 0 ? "M" : "L"}${xScale(i)},${yScale(v)}`)
      .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Đường cong accuracy trên validation theo epoch"
      className="w-full max-w-xl mx-auto"
    >
      {/* Lưới */}
      {[0, 0.25, 0.5, 0.75, 1].map((v) => (
        <g key={v}>
          <line
            x1={pad.l}
            x2={width - pad.r}
            y1={yScale(v)}
            y2={yScale(v)}
            stroke="currentColor"
            opacity={0.1}
          />
          <text
            x={pad.l - 6}
            y={yScale(v) + 3}
            fontSize={11}
            textAnchor="end"
            className="fill-muted"
          >
            {(v * 100).toFixed(0)}%
          </text>
        </g>
      ))}

      {/* Trục X: epoch */}
      {Array.from({ length: epochs }, (_, i) => i).map((i) => (
        <text
          key={i}
          x={xScale(i)}
          y={height - pad.b + 14}
          fontSize={11}
          textAnchor="middle"
          className="fill-muted"
        >
          {i + 1}
        </text>
      ))}
      <text
        x={pad.l + innerW / 2}
        y={height - 4}
        fontSize={11}
        textAnchor="middle"
        className="fill-muted"
      >
        Epoch
      </text>
      <text
        x={12}
        y={pad.t + innerH / 2}
        fontSize={11}
        textAnchor="middle"
        transform={`rotate(-90 12 ${pad.t + innerH / 2})`}
        className="fill-muted"
      >
        Val accuracy
      </text>

      {/* Các đường curve */}
      {STRATEGY_ORDER.map((id) => {
        const isActive = id === active;
        return (
          <g key={id} opacity={isActive ? 1 : 0.45}>
            <path
              d={pathFor(id)}
              fill="none"
              stroke={colorFor(id)}
              strokeWidth={isActive ? 2.5 : 1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {curveFor(id).map((v, i) => (
              <circle
                key={i}
                cx={xScale(i)}
                cy={yScale(v)}
                r={isActive ? 3 : 2}
                fill={colorFor(id)}
              />
            ))}
          </g>
        );
      })}

      {/* Chú thích */}
      <g transform={`translate(${pad.l + 10}, ${pad.t + 4})`}>
        {STRATEGY_ORDER.map((id, i) => (
          <g key={id} transform={`translate(0, ${i * 14})`}>
            <rect width={10} height={10} rx={2} fill={colorFor(id)} />
            <text x={14} y={9} fontSize={11} className="fill-foreground">
              {STRATEGIES[id].shortName} · cuối epoch 10 ={" "}
              {(STRATEGIES[id].finalAcc * 100).toFixed(0)}%
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Bảng so sánh — tóm tắt nhanh để người học đối chiếu
// ────────────────────────────────────────────────────────────────────────────
function StrategyComparisonTable({ active }: { active: StrategyId }) {
  const riskBadge = (r: Strategy["riskOverfit"]) => {
    const map = {
      low: { text: "Thấp", color: "#22c55e", bg: "rgba(34,197,94,0.15)" },
      mid: { text: "Trung bình", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
      high: { text: "Cao", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
    }[r];
    return (
      <span
        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
        style={{ color: map.color, background: map.bg }}
      >
        {map.text}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface">
          <tr className="text-left">
            <th className="px-3 py-2 font-semibold">Chiến lược</th>
            <th className="px-3 py-2 font-semibold">Dữ liệu cần</th>
            <th className="px-3 py-2 font-semibold">Thời gian</th>
            <th className="px-3 py-2 font-semibold">Rủi ro overfit</th>
            <th className="px-3 py-2 font-semibold">Val acc (mô phỏng)</th>
          </tr>
        </thead>
        <tbody>
          {STRATEGY_ORDER.map((id) => {
            const s = STRATEGIES[id];
            const isActive = id === active;
            return (
              <tr
                key={id}
                className={
                  "border-t border-border align-top " +
                  (isActive ? "bg-accent/10" : "hover:bg-surface/50")
                }
              >
                <td className="px-3 py-2 font-semibold text-foreground">
                  {s.name}
                </td>
                <td className="px-3 py-2 text-muted">{s.dataNeeded}</td>
                <td className="px-3 py-2 text-muted">{s.timeNeeded}</td>
                <td className="px-3 py-2">{riskBadge(s.riskOverfit)}</td>
                <td className="px-3 py-2 text-muted">
                  {(s.finalAcc * 100).toFixed(0)}% (loss {s.finalLoss.toFixed(2)})
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Component chính
// ────────────────────────────────────────────────────────────────────────────
export default function TransferLearningTopic() {
  const [strategyId, setStrategyId] = useState<StrategyId>("last3");
  const [highlightedLayer, setHighlightedLayer] = useState<string | null>(null);

  const strategy = STRATEGIES[strategyId];

  const trainableCount = useMemo(
    () => strategy.trainable.filter(Boolean).length,
    [strategy]
  );
  const frozenCount = LAYERS.length - trainableCount;

  const selectStrategy = useCallback((id: StrategyId) => {
    setStrategyId(id);
  }, []);

  return (
    <>
      {/* ═══════════════════════ 1. HOOK: Dự đoán ═══════════════════════ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn cần phân loại 10 loại bệnh lá cây. Chỉ có 500 ảnh. Train CNN từ đầu cần hàng triệu ảnh. Làm sao?"
          options={[
            "Thu thập thêm hàng triệu ảnh lá cây",
            "Lấy CNN đã train trên ImageNet (1,4M ảnh), đóng băng các lớp đã học, chỉ train lớp cuối cho bài toán mới",
            "Dùng ảnh ngẫu nhiên từ internet để train",
          ]}
          correct={1}
          explanation="Transfer Learning! Mô hình đã train trên ImageNet biết phát hiện cạnh, hình dạng, kết cấu. Kiến thức này dùng được cho lá cây. Chỉ cần thay lớp cuối (1000 lớp ImageNet → 10 lớp bệnh) rồi train với 500 ảnh. Giống học futsal khi đã biết đá bóng!"
        >
          <p className="text-sm text-muted mt-2">
            Ở phần tiếp theo, bạn sẽ chọn chiến lược và thấy trực tiếp lớp nào
            bị đóng băng, lớp nào được học, cùng đường cong accuracy tương
            ứng.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ═══════════════════════ 2. Trực quan hoá ═══════════════════════ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1">
                Transfer learning trên một CNN pretrained ImageNet
              </h3>
              <p className="text-sm text-muted">
                Chọn chiến lược để xem lớp nào đóng băng (xám) và lớp nào được
                huấn luyện (cam).
              </p>
            </div>
            <ProgressSteps
              current={STRATEGY_ORDER.indexOf(strategyId) + 1}
              total={STRATEGY_ORDER.length}
              labels={STRATEGY_ORDER.map((id) => STRATEGIES[id].shortName)}
            />
          </div>

          {/* Nút chọn chiến lược */}
          <div
            className="flex flex-wrap gap-2 mb-4"
            role="tablist"
            aria-label="Chọn chiến lược transfer learning"
          >
            {STRATEGY_ORDER.map((id) => {
              const s = STRATEGIES[id];
              const active = id === strategyId;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => selectStrategy(id)}
                  role="tab"
                  aria-selected={active}
                  className={
                    "rounded-lg border px-3 py-2 text-xs font-medium text-left max-w-[240px] transition-all " +
                    (active
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border bg-card text-foreground hover:bg-surface")
                  }
                >
                  <div className="font-bold">{s.name}</div>
                  <div className="text-[10px] opacity-75 mt-0.5 line-clamp-2">
                    {s.description}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Tóm tắt nhanh chiến lược đang chọn */}
          <div className="rounded-xl border border-border bg-background p-3 mb-3 text-xs text-muted">
            <div className="flex flex-wrap gap-4">
              <span>
                <strong className="text-foreground">Trainable:</strong>{" "}
                {trainableCount} / {LAYERS.length} lớp
              </span>
              <span>
                <strong className="text-foreground">Frozen:</strong>{" "}
                {frozenCount} / {LAYERS.length} lớp
              </span>
              <span>
                <strong className="text-foreground">Dữ liệu:</strong>{" "}
                {strategy.dataNeeded}
              </span>
              <span>
                <strong className="text-foreground">Thời gian:</strong>{" "}
                {strategy.timeNeeded}
              </span>
            </div>
            <p className="mt-2 italic text-[11px]">{strategy.notes}</p>
          </div>

          {/* Sơ đồ các lớp */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {LAYERS.map((layer, i) => (
              <div
                key={layer.id}
                onMouseEnter={() => setHighlightedLayer(layer.id)}
                onMouseLeave={() => setHighlightedLayer(null)}
                onFocus={() => setHighlightedLayer(layer.id)}
                onBlur={() => setHighlightedLayer(null)}
                tabIndex={0}
                className="outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
              >
                <LayerBlock
                  layer={layer}
                  trainable={strategy.trainable[i] ?? false}
                  highlighted={highlightedLayer === layer.id}
                />
              </div>
            ))}
          </div>

          {/* Đường cong accuracy */}
          <h4 className="text-sm font-semibold text-foreground mb-2">
            Đường cong accuracy (mô phỏng 10 epochs)
          </h4>
          <TrainingCurves active={strategyId} />

          <p className="mt-2 text-xs text-muted">
            Feature extraction (xanh dương) đạt cao nguyên sớm vì backbone cố
            định. Fine-tune 3 lớp cuối (xanh lá) linh hoạt và thường là cân
            bằng tốt nhất. Full fine-tune (cam) cần nhiều dữ liệu hơn nhưng
            trần cao nhất.
          </p>

          {/* Bảng so sánh */}
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-foreground mb-2">
              So sánh nhanh
            </h4>
            <StrategyComparisonTable active={strategyId} />
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ═══════════════════════ 3. Aha moment ═══════════════════════ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          <p>
            <strong>Transfer Learning</strong> = tận dụng kiến thức đã học. Lớp
            nông (cạnh, kết cấu) là <strong>universal</strong> — dùng được cho
            mọi bài toán ảnh. Chỉ lớp sâu (vật thể cụ thể) cần thay đổi. Tiết
            kiệm 99% thời gian và dữ liệu! Cùng ý tưởng áp dụng cho
            {" "}<TopicLink slug="transformer">Transformer</TopicLink>{" "}(BERT,
            GPT) và mọi kiến trúc hiện đại.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ═══════════════════════ 4. Callouts ═══════════════════════ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Khi nào dùng gì?">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Callout variant="insight" title="Dữ liệu ít + giống ImageNet">
            <p className="text-sm">
              Ví dụ: phân loại chó/mèo, hoa, đồ vật đời thường. Dùng{" "}
              <strong>Feature Extraction</strong>: đóng băng toàn bộ backbone,
              chỉ train classifier head. Vài trăm ảnh đã đủ.
            </p>
          </Callout>
          <Callout variant="tip" title="Dữ liệu ít + hơi khác pretrain">
            <p className="text-sm">
              Ví dụ: ảnh sản phẩm bán hàng, biển báo Việt Nam. Dùng{" "}
              <strong>Fine-tune 2–3 lớp cuối</strong> với LR rất nhỏ (1e-5 đến
              1e-4) để điều chỉnh nhẹ đặc trưng sâu mà không phá lớp nông.
            </p>
          </Callout>
          <Callout variant="info" title="Dữ liệu nhiều + khác xa ImageNet">
            <p className="text-sm">
              Ví dụ: ảnh y tế, ảnh vệ tinh, ảnh kính hiển vi. Nên{" "}
              <strong>Full fine-tune</strong> với LR nhỏ và schedule cosine,
              cộng augmentation mạnh. Nếu data cực lớn, có thể train từ đầu
              nhưng pretrained vẫn là điểm khởi tạo tốt.
            </p>
          </Callout>
          <Callout variant="warning" title="Dấu hiệu cần cảnh giác">
            <p className="text-sm">
              Val loss tăng trong khi train loss giảm → overfit. Giảm LR, tăng
              weight decay, thêm augmentation, đóng băng thêm lớp, hoặc dùng
              early stopping. Không tin cao nhất chỉ sau 1 epoch — luôn xác
              minh bằng nhiều seed.
            </p>
          </Callout>
        </div>
      </LessonSection>

      {/* ═══════════════════════ 5. Thử thách 1 ═══════════════════════ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách 1">
        <InlineChallenge
          question="Fine-tune BERT cho phân loại cảm xúc tiếng Việt. Nên dùng learning rate bao nhiêu?"
          options={[
            "LR = 0.01 (giống train từ đầu)",
            "LR = 2e-5 (rất nhỏ, tinh chỉnh nhẹ nhàng để không phá trọng số pretrained)",
            "LR = 1.0 (càng lớn càng nhanh)",
            "LR phải bằng 0, không được cập nhật",
          ]}
          correct={1}
          explanation="BERT đã train trên hàng tỷ từ → trọng số rất tốt. LR 2e-5 (0,00002) tinh chỉnh nhẹ nhàng → giữ kiến thức ngôn ngữ + thích nghi phân loại cảm xúc. LR lớn sẽ phá hỏng kiến thức. Đây là LR phổ biến nhất cho fine-tuning BERT/GPT."
        />
      </LessonSection>

      {/* ═══════════════════════ 6. Lý thuyết ═══════════════════════ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Transfer Learning</strong> tận dụng kiến thức từ mô hình
            pretrained trên dataset lớn (ImageNet, WebText, Common Crawl) để
            giải bài toán mới với ít dữ liệu hơn. Thay vì khởi tạo trọng số
            ngẫu nhiên, ta khởi tạo từ một điểm đã rất gần tối ưu cho các đặc
            trưng chung.
          </p>

          <Callout variant="insight" title="Tại sao hiệu quả?">
            <p>
              Lớp nông CNN học đặc trưng tổng quát (cạnh, kết cấu, màu sắc) —
              dùng được cho MỌI bài toán ảnh. LLM pretrain học &quot;hiểu ngôn
              ngữ&quot; tổng quát. Kiến thức nền tảng này là{" "}
              <strong>universal</strong>, chỉ lớp cuối cần task-specific.
            </p>
          </Callout>

          <p className="mt-3">
            Về toán, gọi <LaTeX>{`\\theta^* = \\arg\\min_\\theta L_{src}(\\theta)`}</LaTeX>{" "}
            là trọng số tối ưu cho bài toán nguồn (ImageNet). Khi chuyển sang
            bài toán đích, ta khởi tạo{" "}
            <LaTeX>{`\\theta_0 = \\theta^*`}</LaTeX> và tối ưu{" "}
            <LaTeX>{`\\min_\\theta L_{tgt}(\\theta)`}</LaTeX> với regularizer
            mềm kéo về gần <LaTeX>{`\\theta^*`}</LaTeX>:
          </p>

          <p className="text-center">
            <LaTeX>
              {`\\min_\\theta \\; L_{tgt}(\\theta) \\;+\\; \\lambda \\cdot \\lVert \\theta - \\theta^* \\rVert^2`}
            </LaTeX>
          </p>

          <p>
            Hệ số <LaTeX>\lambda</LaTeX> lớn tương đương đóng băng; nhỏ tương
            đương fine-tune tự do. Learning rate nhỏ là một cách ngầm để đạt
            hiệu ứng tương tự — gradient nhỏ giữ{" "}
            <LaTeX>\theta</LaTeX> gần <LaTeX>{`\\theta^*`}</LaTeX>.
          </p>

          <CodeBlock language="python" title="transfer_learning_pytorch.py">{`import torch
import torch.nn as nn
import torchvision.models as models
from torch.utils.data import DataLoader

NUM_CLASSES = 10  # bài toán mới

# ──────────────────────────────────────────────────────────────
# 1. Feature extraction — đóng băng toàn bộ backbone
# ──────────────────────────────────────────────────────────────
def build_feature_extractor() -> nn.Module:
    model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V2)
    for param in model.parameters():
        param.requires_grad = False          # đóng băng
    # Thay classifier head cho bài toán mới
    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, NUM_CLASSES)
    return model

# ──────────────────────────────────────────────────────────────
# 2. Fine-tune 3 lớp cuối — mở khoá layer4 + fc
# ──────────────────────────────────────────────────────────────
def build_last3_finetune() -> nn.Module:
    model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V2)
    for param in model.parameters():
        param.requires_grad = False
    for param in model.layer4.parameters():
        param.requires_grad = True
    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, NUM_CLASSES)  # trainable theo mặc định
    return model

# ──────────────────────────────────────────────────────────────
# 3. Full fine-tune — mở khoá toàn bộ
# ──────────────────────────────────────────────────────────────
def build_full_finetune() -> nn.Module:
    model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V2)
    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, NUM_CLASSES)
    # Mặc định tất cả requires_grad=True
    return model

# ──────────────────────────────────────────────────────────────
# 4. Optimizer với LR theo nhóm tham số
#    - Lớp mới (head): LR lớn hơn
#    - Backbone pretrained: LR rất nhỏ
# ──────────────────────────────────────────────────────────────
def make_optimizer(model: nn.Module, strategy: str):
    if strategy == "feature":
        # chỉ head được cập nhật
        return torch.optim.AdamW(model.fc.parameters(), lr=1e-3, weight_decay=1e-4)
    if strategy == "last3":
        return torch.optim.AdamW(
            [
                {"params": model.layer4.parameters(), "lr": 1e-5},
                {"params": model.fc.parameters(), "lr": 1e-3},
            ],
            weight_decay=1e-4,
        )
    # full
    return torch.optim.AdamW(
        [
            {"params": [p for n, p in model.named_parameters()
                        if not n.startswith("fc")], "lr": 1e-5},
            {"params": model.fc.parameters(), "lr": 1e-3},
        ],
        weight_decay=1e-4,
    )

# ──────────────────────────────────────────────────────────────
# 5. Vòng lặp huấn luyện rút gọn
# ──────────────────────────────────────────────────────────────
def train(model, loader: DataLoader, optim, epochs: int = 10, device="cuda"):
    criterion = nn.CrossEntropyLoss()
    model.to(device).train()
    for epoch in range(epochs):
        running = 0.0
        for x, y in loader:
            x, y = x.to(device), y.to(device)
            optim.zero_grad(set_to_none=True)
            logits = model(x)
            loss = criterion(logits, y)
            loss.backward()
            optim.step()
            running += loss.item() * x.size(0)
        print(f"epoch {epoch+1}: loss={running / len(loader.dataset):.4f}")
    return model`}</CodeBlock>

          <CollapsibleDetail title="Yosinski et al. 2014 — 'How transferable are features?'">
            <p className="text-sm">
              Công trình kinh điển về transferability của đặc trưng trong deep
              nets. Các phát hiện chính: (1) Đặc trưng lớp nông rất chung,
              transferable gần như tuyệt đối giữa các task ảnh tự nhiên. (2)
              Đặc trưng lớp sâu càng chuyên biệt theo task gốc, khả năng
              transfer giảm dần. (3) Fine-tune giải quyết hiện tượng này bằng
              cách cho phép lớp sâu điều chỉnh. (4) Thậm chí khi task rất khác,
              khởi tạo từ pretrained vẫn thường tốt hơn khởi tạo ngẫu nhiên —
              hiệu ứng &quot;generalization boost&quot;.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Foundation models và paradigm 'pretrain once, fine-tune many'">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <strong>NLP:</strong> BERT, GPT, T5, LLaMA — pretrain trên
                hàng trăm tỷ token, fine-tune cho từng nhiệm vụ (phân loại,
                tóm tắt, dịch, chatbot).
              </li>
              <li>
                <strong>Vision:</strong> ResNet, EfficientNet, ViT, DINO,
                CLIP — pretrain trên ImageNet hoặc dữ liệu web quy mô lớn.
              </li>
              <li>
                <strong>Multimodal:</strong> CLIP, SigLIP, Flamingo — học
                đồng thời ngôn ngữ và ảnh, fine-tune cho VQA, retrieval.
              </li>
              <li>
                <strong>Audio:</strong> Whisper, wav2vec — pretrain tự giám
                sát trên vài trăm ngàn giờ âm thanh, fine-tune cho ASR/dịch
                nói.
              </li>
              <li>
                <strong>Code:</strong> CodeLlama, StarCoder — pretrain trên
                kho code khổng lồ, fine-tune cho ngôn ngữ/công ty cụ thể.
              </li>
            </ul>
          </CollapsibleDetail>
        </ExplanationSection>
      </LessonSection>

      {/* ═══════════════════════ 7. Thử thách 2 ═══════════════════════ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Thử thách 2">
        <InlineChallenge
          question="Bạn fine-tune ResNet50 cho 500 ảnh X-quang phổi, nhưng val accuracy chỉ đạt 62% trong khi train accuracy đã 99%. Can thiệp nào KHÔNG nên thử đầu tiên?"
          options={[
            "Tăng data augmentation: xoay, lật, crop, mixup",
            "Đóng băng thêm các block sâu, giảm số tham số được học",
            "Tăng learning rate lên 10 lần để thoát khỏi local minimum",
            "Giảm số epoch, bật early stopping theo val loss",
          ]}
          correct={2}
          explanation="Đây là overfit rõ ràng (train cao, val thấp). Các biện pháp đúng: augmentation, giảm năng lực mô hình (đóng băng thêm), early stopping, weight decay. Tăng LR lên 10 lần chỉ làm suy luận thêm bất ổn và phá trọng số pretrained — không giải quyết overfit."
        />
      </LessonSection>

      {/* ═══════════════════════ 8. Mã low-level: differential LR ═══════════════════════ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Mẹo thực chiến">
        <ExplanationSection>
          <p className="text-sm text-muted mb-3">
            Trong thực tế, kỹ thuật quan trọng nhất khi fine-tune là{" "}
            <strong>differential learning rate</strong> — chia mạng thành
            nhiều nhóm, mỗi nhóm có LR riêng. Lớp càng nông, LR càng nhỏ.
          </p>

          <CodeBlock language="python" title="discriminative_lr.py">{`import torch
from torch.optim import AdamW

def discriminative_param_groups(model, base_lr: float = 1e-3, decay: float = 0.3):
    """
    Chia ResNet thành 4 nhóm theo độ sâu và gán LR giảm dần vào lớp nông.
    decay = 0.3 nghĩa là mỗi nhóm sâu hơn có LR gấp 1/0.3 ≈ 3.3 lần lớp trước.
    """
    groups = [
        {"params": list(model.conv1.parameters())
                   + list(model.bn1.parameters())
                   + list(model.layer1.parameters()),
         "lr": base_lr * decay ** 3},
        {"params": list(model.layer2.parameters()),
         "lr": base_lr * decay ** 2},
        {"params": list(model.layer3.parameters()),
         "lr": base_lr * decay},
        {"params": list(model.layer4.parameters())
                   + list(model.fc.parameters()),
         "lr": base_lr},
    ]
    return groups


optim = AdamW(discriminative_param_groups(model, base_lr=1e-3),
              weight_decay=1e-4)

# Kết hợp với cosine schedule và warmup
scheduler = torch.optim.lr_scheduler.OneCycleLR(
    optim,
    max_lr=[g["lr"] for g in optim.param_groups],
    total_steps=len(train_loader) * EPOCHS,
    pct_start=0.1,
    div_factor=10,
)`}</CodeBlock>

          <Callout variant="tip" title="Checklist fine-tuning ngắn gọn">
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Chọn pretrained phù hợp domain (ImageNet cho ảnh tự nhiên, MedCLIP/CheXNet cho y tế, v.v.).</li>
              <li>Thay classifier head trước khi load weights vào, hoặc sau khi load rồi khởi tạo lại.</li>
              <li>Quyết định chiến lược: feature / last-k / full dựa vào lượng data và độ lệch domain.</li>
              <li>Dùng differential LR + cosine schedule + warmup 5–10% bước đầu.</li>
              <li>Data augmentation phù hợp: không lật ảnh y tế, nhưng rotate được; mixup/cutmix cho ảnh tự nhiên.</li>
              <li>Early stopping trên val loss, lưu checkpoint theo val metric (F1/AUC), không theo loss nếu mất cân bằng.</li>
              <li>Đừng quên freeze BatchNorm stats (eval mode trên các block đóng băng) — đây là bug cực kỳ phổ biến.</li>
            </ol>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ═══════════════════════ 9. Tóm tắt ═══════════════════════ */}
      <LessonSection step={9} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Transfer Learning"
          points={[
            "Tận dụng pretrained model → tiết kiệm 99% dữ liệu và thời gian. Paradigm 'pretrain once, fine-tune many'.",
            "Feature extraction: đóng băng toàn bộ backbone, chỉ train head — phù hợp khi data rất ít và domain gần ImageNet.",
            "Fine-tune 2–3 lớp cuối: cân bằng tốt giữa linh hoạt và ổn định — lựa chọn mặc định cho đa số project thực tế.",
            "Full fine-tune: linh hoạt nhất nhưng tốn data và dễ overfit — dùng khi domain khác xa pretrain hoặc data lớn.",
            "Lớp nông = đặc trưng universal (cạnh, kết cấu); lớp sâu = task-specific. Luôn giữ LR cho backbone rất nhỏ (1e-5 đến 1e-4).",
            "Paradigm chủ đạo của AI hiện đại: ResNet/ViT cho ảnh, BERT/GPT/LLaMA cho NLP, CLIP cho multimodal — đều là foundation model + fine-tune.",
          ]}
        />
      </LessonSection>

      {/* ═══════════════════════ 10. Quiz ═══════════════════════ */}
      <LessonSection step={10} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
