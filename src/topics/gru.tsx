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

export const metadata: TopicMeta = {
  slug: "gru",
  title: "Gated Recurrent Unit",
  titleVi: "Đơn vị hồi quy có cổng",
  description:
    "Phiên bản đơn giản hóa của LSTM với 2 cổng thay vì 3, hiệu quả tương đương",
  category: "dl-architectures",
  tags: ["sequence", "nlp", "rnn"],
  difficulty: "advanced",
  relatedSlugs: ["lstm", "rnn", "transformer"],
  vizType: "interactive",
};

/* ════════════════════════════════════════════════════════════
   DỮ LIỆU SO SÁNH LSTM VS GRU
   ════════════════════════════════════════════════════════════ */
interface CompareRow {
  feature: string;
  lstm: string;
  gru: string;
  winner: "lstm" | "gru" | "tie";
}

const COMPARE: CompareRow[] = [
  {
    feature: "Số cổng",
    lstm: "3 (forget, input, output)",
    gru: "2 (reset, update)",
    winner: "gru",
  },
  {
    feature: "Trạng thái",
    lstm: "Cell state + hidden state",
    gru: "Chỉ hidden state",
    winner: "gru",
  },
  {
    feature: "Tham số",
    lstm: "~4× RNN",
    gru: "~3× RNN (ít hơn ~25%)",
    winner: "gru",
  },
  {
    feature: "Tốc độ train",
    lstm: "Chậm hơn",
    gru: "Nhanh hơn ~15-20%",
    winner: "gru",
  },
  {
    feature: "Nhớ xa",
    lstm: "Tốt hơn nhẹ (cell state riêng)",
    gru: "Tốt (nhưng hơi kém LSTM)",
    winner: "lstm",
  },
  {
    feature: "Dataset lớn",
    lstm: "Thường tốt hơn nhẹ",
    gru: "Tương đương",
    winner: "tie",
  },
  {
    feature: "Dataset nhỏ",
    lstm: "Dễ overfit hơn",
    gru: "Tốt hơn (ít tham số)",
    winner: "gru",
  },
  {
    feature: "Độ phổ biến 2024",
    lstm: "Vẫn dùng nhiều trong time-series",
    gru: "Phổ biến trong seq2seq nhẹ",
    winner: "tie",
  },
];

/* ════════════════════════════════════════════════════════════
   QUIZ — 8 CÂU HỎI
   ════════════════════════════════════════════════════════════ */
const quizQuestions: QuizQuestion[] = [
  {
    question: "GRU dùng cổng update (zₜ) để làm gì?",
    options: [
      "Chỉ thêm thông tin mới vào hidden state",
      "Kiêm cả vai trò forget và input: zₜ gần 1 = giữ cũ, gần 0 = lấy mới",
      "Tính output cuối cùng",
      "Đặt lại hidden state về 0",
    ],
    correct: 1,
    explanation:
      "Update gate zₜ kiểm soát tỷ lệ trộn: hₜ = zₜ × hₜ₋₁ + (1-zₜ) × h̃ₜ. Khi zₜ→1: giữ nguyên cũ (= forget gate). Khi zₜ→0: lấy hoàn toàn mới (= input gate). Một cổng, hai vai trò!",
  },
  {
    question: "Khi nào nên chọn GRU thay vì LSTM?",
    options: [
      "Khi dataset rất lớn (>1M mẫu)",
      "Khi dataset nhỏ hoặc cần tốc độ — ít tham số → ít overfitting, train nhanh hơn",
      "Khi chuỗi rất dài (>1000 bước)",
      "Khi cần sinh text",
    ],
    correct: 1,
    explanation:
      "GRU có ít tham số hơn ~25% → ít overfitting trên dataset nhỏ và train nhanh hơn. Trên dataset lớn, LSTM thường ngang hoặc hơn nhẹ nhờ cell state riêng biệt.",
  },
  {
    question: "Cổng reset (rₜ) trong GRU kiểm soát điều gì?",
    options: [
      "Xóa toàn bộ hidden state về 0",
      "Quyết định bao nhiêu hidden state cũ dùng để tính candidate mới h̃ₜ",
      "Đặt lại learning rate",
      "Reset gradient về 0",
    ],
    correct: 1,
    explanation:
      "h̃ₜ = tanh(W·[rₜ ⊙ hₜ₋₁, xₜ]). Khi rₜ→0: bỏ qua quá khứ, candidate chỉ dựa vào input hiện tại ('quên sạch rồi nhìn mới'). Khi rₜ→1: dùng đầy đủ quá khứ.",
  },
  {
    question:
      "Giả sử LSTM có tham số là P. GRU tương đương có tham số khoảng bao nhiêu?",
    options: ["0.25P", "0.5P", "0.75P", "1.5P"],
    correct: 2,
    explanation:
      "GRU có 3 ma trận trọng số (Wr, Wz, W) thay vì 4 (Wf, Wi, Wo, Wc) của LSTM — tỷ lệ ~3/4 = 0.75P. Đây là lý do GRU nhẹ hơn ~25%.",
  },
  {
    question:
      "Tại sao GRU dùng biểu thức (1-zₜ) thay vì một cổng riêng biệt?",
    options: [
      "Để tiết kiệm bộ nhớ GPU",
      "Để ép ràng buộc zₜ + (1-zₜ) = 1 — giữ cũ và thêm mới luôn tổng 100%",
      "Vì lịch sử — Cho et al. thích số 1",
      "Để không cần hàm sigmoid",
    ],
    correct: 1,
    explanation:
      "LSTM cho phép forget gate và input gate độc lập — tổng có thể >1 hoặc <1. GRU ép ràng buộc chặt: nếu giữ 70% cũ thì tự động thêm 30% mới. Ít tham số hơn mà ổn định hơn trong nhiều trường hợp.",
  },
  {
    question:
      "Trong PyTorch, khi gọi output, h = gru(x), giá trị h có shape thế nào?",
    options: [
      "(batch, seq_len, hidden_size)",
      "(num_layers, batch, hidden_size)",
      "(batch, hidden_size, num_layers)",
      "(seq_len, batch, hidden_size)",
    ],
    correct: 1,
    explanation:
      "h là hidden state cuối cùng của mỗi layer. Shape mặc định là (num_layers * num_directions, batch, hidden_size). Khác với output có shape (batch, seq_len, hidden_size) khi batch_first=True.",
  },
  {
    question:
      "GRU có thể giải quyết hoàn toàn vanishing gradient như Transformer không?",
    options: [
      "Có, GRU tốt hơn Transformer",
      "Không hoàn toàn — vẫn có thể vanishing với chuỗi rất dài (>500 bước)",
      "Có, chỉ khi dùng tanh",
      "Không bao giờ có vanishing gradient",
    ],
    correct: 1,
    explanation:
      "GRU giảm vanishing gradient đáng kể nhờ update gate cho phép gradient 'chảy thẳng' qua zₜ. Nhưng với chuỗi dài hàng nghìn bước, gradient vẫn có thể suy giảm. Transformer giải quyết triệt để hơn nhờ self-attention nối trực tiếp mọi vị trí.",
  },
  {
    question:
      "Khi zₜ = 0.5 đều đặn, GRU hoạt động giống mô hình nào nhất?",
    options: [
      "RNN thuần túy",
      "Trung bình trượt có trọng số giữa hₜ₋₁ và h̃ₜ — giống moving average với α=0.5",
      "Transformer với 1 head",
      "Không có gì tương đương",
    ],
    correct: 1,
    explanation:
      "hₜ = 0.5·hₜ₋₁ + 0.5·h̃ₜ — đây chính là exponential moving average (EMA) với hệ số 0.5. Điều hay là GRU HỌC được giá trị zₜ phù hợp cho từng bước, từng chiều — không phải α cố định.",
  },
];

/* ════════════════════════════════════════════════════════════
   GRU TOPIC COMPONENT
   ════════════════════════════════════════════════════════════ */
export default function GruTopic() {
  const [activeGate, setActiveGate] = useState<
    "reset" | "update" | "candidate" | "output" | null
  >(null);
  const [showCompare, setShowCompare] = useState(false);

  /* Input sliders: xₜ và hₜ₋₁ */
  const [xInput, setXInput] = useState(0.6);
  const [hPrev, setHPrev] = useState(0.3);

  /* View mode: GRU vs LSTM side-by-side */
  const [viewMode, setViewMode] = useState<"gru" | "lstm" | "both">("gru");

  const toggleGate = useCallback(
    (gate: "reset" | "update" | "candidate" | "output") => {
      setActiveGate((prev) => (prev === gate ? null : gate));
    },
    [],
  );

  /* ──────────────────────────────────────────────────────────
     TÍNH TOÁN GRU CELL — Live values từ slider
     Dùng giá trị trọng số giả để demo ý tưởng
     ────────────────────────────────────────────────────────── */
  const cellValues = useMemo(() => {
    const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
    const tanh = (x: number) => Math.tanh(x);

    /* Trọng số giả — được chọn để ví dụ "đẹp" */
    const Wr = 0.9;
    const Ur = 0.4;
    const br = -0.2;

    const Wz = 0.7;
    const Uz = 0.6;
    const bz = -0.1;

    const W = 1.1;
    const U = 0.8;
    const b = 0.0;

    /* Reset gate */
    const r = sigmoid(Wr * xInput + Ur * hPrev + br);

    /* Update gate */
    const z = sigmoid(Wz * xInput + Uz * hPrev + bz);

    /* Candidate hidden state */
    const hTilde = tanh(W * xInput + U * (r * hPrev) + b);

    /* New hidden state */
    const hNew = z * hPrev + (1 - z) * hTilde;

    return {
      r: Number(r.toFixed(3)),
      z: Number(z.toFixed(3)),
      hTilde: Number(hTilde.toFixed(3)),
      hNew: Number(hNew.toFixed(3)),
      /* Bước trung gian cho visualization */
      rTimesH: Number((r * hPrev).toFixed(3)),
      zTimesHPrev: Number((z * hPrev).toFixed(3)),
      oneMinusZTimesHTilde: Number(((1 - z) * hTilde).toFixed(3)),
    };
  }, [xInput, hPrev]);

  /* ──────────────────────────────────────────────────────────
     TÍNH TOÁN SỐ THAM SỐ — GRU vs LSTM
     ────────────────────────────────────────────────────────── */
  const paramCount = useMemo(() => {
    /* Giả định input_size=128, hidden_size=256 */
    const inputSize = 128;
    const hiddenSize = 256;

    /* GRU: 3 ma trận gate (reset, update, candidate) */
    /* Mỗi gate có W (input→hidden) + U (hidden→hidden) + b */
    const gruParams =
      3 * (inputSize * hiddenSize + hiddenSize * hiddenSize + hiddenSize);

    /* LSTM: 4 ma trận gate (forget, input, output, candidate) */
    const lstmParams =
      4 * (inputSize * hiddenSize + hiddenSize * hiddenSize + hiddenSize);

    return {
      gru: gruParams,
      lstm: lstmParams,
      reduction: Number(((1 - gruParams / lstmParams) * 100).toFixed(1)),
    };
  }, []);

  const TOTAL_STEPS = 10;

  return (
    <>
      {/* ═══════════════════════════════════════════════════════
          STEP 1 — HOOK
          ═══════════════════════════════════════════════════════ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="LSTM có 3 cổng và cell state riêng → mạnh nhưng nặng. Nếu bạn muốn đơn giản hóa mà vẫn giữ khả năng nhớ xa, bạn sẽ gộp hoặc bỏ gì?"
          options={[
            "Bỏ hết cổng — quay về RNN đơn giản",
            "Gộp forget + input thành 1 cổng, bỏ cell state riêng → chỉ cần 2 cổng",
            "Giữ nguyên 3 cổng nhưng giảm hidden size",
          ]}
          correct={1}
          explanation="GRU gộp forget gate và input gate thành một update gate duy nhất (zₜ), và gộp cell state vào hidden state. Kết quả: 2 cổng thay vì 3, ít tham số hơn ~25%, mà hiệu suất thường ngang LSTM!"
        />
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════
          STEP 2 — KHÁM PHÁ — Interactive GRU Cell Internals
          ═══════════════════════════════════════════════════════ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Nội tạng ô GRU">
        <div className="mb-4">
          <ProgressSteps
            current={2}
            total={TOTAL_STEPS}
            labels={[
              "Dự đoán",
              "Nội tạng",
              "Tính toán",
              "So sánh",
              "Tham số",
              "Aha",
              "Thử thách",
              "Giải thích",
              "Tóm tắt",
              "Kiểm tra",
            ]}
          />
        </div>

        <p className="text-sm text-foreground leading-relaxed mb-3">
          Nếu LSTM là chiếc xe máy Honda Wave đầy đủ tính năng, thì GRU là chiếc{" "}
          <strong>Wave Alpha</strong> — bỏ bớt vài tính năng ít dùng, nhẹ hơn,
          tiết kiệm xăng hơn, mà đi vẫn tốt. Hãy mổ xẻ ô GRU và xem từng cổng
          làm gì.
        </p>

        <VisualizationSection topicSlug={metadata.slug}>
          <div className="mb-4 space-y-3">
            <p className="text-sm text-muted">
              Nhấn vào cổng để xem chi tiết. Kéo slider để thay đổi input
              xₜ và hₜ₋₁ — xem ô GRU tính toán thế nào.
            </p>

            {/* Slider điều khiển input */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-card p-3">
                <label className="flex items-center justify-between text-xs font-medium text-muted mb-1.5">
                  <span>Input hiện tại xₜ</span>
                  <span className="font-mono text-accent text-sm">
                    {xInput.toFixed(2)}
                  </span>
                </label>
                <input
                  type="range"
                  min={-1}
                  max={1}
                  step={0.05}
                  value={xInput}
                  onChange={(e) => setXInput(Number(e.target.value))}
                  className="w-full accent-accent"
                />
                <div className="flex justify-between text-[10px] text-tertiary mt-0.5">
                  <span>-1 (âm)</span>
                  <span>0</span>
                  <span>+1 (dương)</span>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-3">
                <label className="flex items-center justify-between text-xs font-medium text-muted mb-1.5">
                  <span>Hidden state trước hₜ₋₁</span>
                  <span className="font-mono text-accent text-sm">
                    {hPrev.toFixed(2)}
                  </span>
                </label>
                <input
                  type="range"
                  min={-1}
                  max={1}
                  step={0.05}
                  value={hPrev}
                  onChange={(e) => setHPrev(Number(e.target.value))}
                  className="w-full accent-accent"
                />
                <div className="flex justify-between text-[10px] text-tertiary mt-0.5">
                  <span>-1</span>
                  <span>0</span>
                  <span>+1</span>
                </div>
              </div>
            </div>
          </div>

          {/* ══════ SVG Diagram: GRU Cell với live values ══════ */}
          <svg
            viewBox="0 0 560 360"
            className="w-full rounded-lg border border-border bg-background"
          >
            {/* Hidden state highway — không có cell state riêng! */}
            <line
              x1={30}
              y1={90}
              x2={530}
              y2={90}
              stroke="#8b5cf6"
              strokeWidth={3.5}
            />
            <polygon points="530,90 520,84 520,96" fill="#8b5cf6" />
            <text
              x={280}
              y={30}
              fontSize={12}
              fill="#8b5cf6"
              textAnchor="middle"
              fontWeight={700}
            >
              Hidden State hₜ (GRU gộp cell state vào đây!)
            </text>
            <text x={22} y={95} fontSize={11} fill="#8b5cf6" fontWeight={500}>
              hₜ₋₁
            </text>
            <text x={540} y={95} fontSize={11} fill="#8b5cf6" fontWeight={500}>
              hₜ
            </text>

            {/* Live value: hₜ₋₁ */}
            <rect
              x={40}
              y={64}
              width={55}
              height={20}
              rx={4}
              fill="#8b5cf6"
              opacity={0.15}
              stroke="#8b5cf6"
              strokeWidth={1}
            />
            <text
              x={67.5}
              y={78}
              fontSize={11}
              fill="#8b5cf6"
              textAnchor="middle"
              fontWeight={600}
            >
              {hPrev.toFixed(2)}
            </text>

            {/* Live value: hₜ */}
            <rect
              x={470}
              y={64}
              width={55}
              height={20}
              rx={4}
              fill="#22c55e"
              opacity={0.15}
              stroke="#22c55e"
              strokeWidth={1}
            />
            <text
              x={497.5}
              y={78}
              fontSize={11}
              fill="#22c55e"
              textAnchor="middle"
              fontWeight={600}
            >
              {cellValues.hNew.toFixed(2)}
            </text>

            {/* Note: no cell state */}
            <text
              x={280}
              y={52}
              fontSize={11}
              fill="#f59e0b"
              textAnchor="middle"
              fontWeight={500}
              opacity={0.8}
            >
              Không có cell state riêng — đơn giản hơn LSTM!
            </text>

            {/* ══════ RESET GATE ══════ */}
            <g
              className="cursor-pointer"
              onClick={() => toggleGate("reset")}
            >
              <motion.rect
                x={60}
                y={140}
                width={140}
                height={70}
                rx={14}
                fill="#ef4444"
                opacity={activeGate === "reset" ? 0.35 : 0.08}
                stroke="#ef4444"
                strokeWidth={activeGate === "reset" ? 3 : 1.5}
                animate={
                  activeGate === "reset" ? { scale: 1.02 } : { scale: 1 }
                }
              />
              <text
                x={130}
                y={164}
                fontSize={13}
                fill="#ef4444"
                textAnchor="middle"
                fontWeight={700}
              >
                Reset Gate rₜ
              </text>
              <text
                x={130}
                y={180}
                fontSize={11}
                fill="#ef4444"
                textAnchor="middle"
              >
                σ(Wᵣ·xₜ + Uᵣ·hₜ₋₁ + bᵣ)
              </text>
              {/* Live value */}
              <rect
                x={95}
                y={188}
                width={70}
                height={16}
                rx={3}
                fill="#ef4444"
                opacity={0.2}
              />
              <text
                x={130}
                y={200}
                fontSize={11}
                fill="#ef4444"
                textAnchor="middle"
                fontWeight={700}
              >
                = {cellValues.r.toFixed(3)}
              </text>
              <line
                x1={130}
                y1={140}
                x2={130}
                y2={98}
                stroke="#ef4444"
                strokeWidth={activeGate === "reset" ? 2.5 : 1.5}
                strokeDasharray={activeGate === "reset" ? "0" : "5 3"}
                opacity={activeGate === "reset" ? 1 : 0.4}
              />
              <circle
                cx={130}
                cy={90}
                r={11}
                fill="#0f172a"
                stroke="#ef4444"
                strokeWidth={2}
              />
              <text
                x={130}
                y={95}
                fontSize={15}
                fill="#ef4444"
                textAnchor="middle"
                fontWeight={700}
              >
                ×
              </text>
            </g>

            {/* ══════ UPDATE GATE ══════ */}
            <g
              className="cursor-pointer"
              onClick={() => toggleGate("update")}
            >
              <motion.rect
                x={340}
                y={140}
                width={140}
                height={70}
                rx={14}
                fill="#22c55e"
                opacity={activeGate === "update" ? 0.35 : 0.08}
                stroke="#22c55e"
                strokeWidth={activeGate === "update" ? 3 : 1.5}
                animate={
                  activeGate === "update" ? { scale: 1.02 } : { scale: 1 }
                }
              />
              <text
                x={410}
                y={164}
                fontSize={13}
                fill="#22c55e"
                textAnchor="middle"
                fontWeight={700}
              >
                Update Gate zₜ
              </text>
              <text
                x={410}
                y={180}
                fontSize={11}
                fill="#22c55e"
                textAnchor="middle"
              >
                σ(W_z·xₜ + U_z·hₜ₋₁ + b_z)
              </text>
              {/* Live value */}
              <rect
                x={375}
                y={188}
                width={70}
                height={16}
                rx={3}
                fill="#22c55e"
                opacity={0.2}
              />
              <text
                x={410}
                y={200}
                fontSize={11}
                fill="#22c55e"
                textAnchor="middle"
                fontWeight={700}
              >
                = {cellValues.z.toFixed(3)}
              </text>
              <line
                x1={410}
                y1={140}
                x2={410}
                y2={98}
                stroke="#22c55e"
                strokeWidth={activeGate === "update" ? 2.5 : 1.5}
                strokeDasharray={activeGate === "update" ? "0" : "5 3"}
                opacity={activeGate === "update" ? 1 : 0.4}
              />
              <circle
                cx={410}
                cy={90}
                r={11}
                fill="#0f172a"
                stroke="#22c55e"
                strokeWidth={2}
              />
              <text
                x={410}
                y={95}
                fontSize={15}
                fill="#22c55e"
                textAnchor="middle"
                fontWeight={700}
              >
                +
              </text>
            </g>

            {/* ══════ CANDIDATE h̃ₜ ══════ */}
            <g
              className="cursor-pointer"
              onClick={() => toggleGate("candidate")}
            >
              <motion.rect
                x={200}
                y={230}
                width={140}
                height={60}
                rx={12}
                fill="#3b82f6"
                opacity={activeGate === "candidate" ? 0.35 : 0.08}
                stroke="#3b82f6"
                strokeWidth={activeGate === "candidate" ? 3 : 1.5}
                animate={
                  activeGate === "candidate" ? { scale: 1.02 } : { scale: 1 }
                }
              />
              <text
                x={270}
                y={252}
                fontSize={12}
                fill="#3b82f6"
                textAnchor="middle"
                fontWeight={700}
              >
                Candidate h̃ₜ
              </text>
              <text
                x={270}
                y={266}
                fontSize={11}
                fill="#3b82f6"
                textAnchor="middle"
              >
                tanh(W·xₜ + U·(rₜ⊙hₜ₋₁))
              </text>
              <rect
                x={230}
                y={272}
                width={80}
                height={14}
                rx={3}
                fill="#3b82f6"
                opacity={0.2}
              />
              <text
                x={270}
                y={283}
                fontSize={11}
                fill="#3b82f6"
                textAnchor="middle"
                fontWeight={700}
              >
                = {cellValues.hTilde.toFixed(3)}
              </text>
            </g>

            {/* Input xₜ */}
            <line
              x1={280}
              y1={335}
              x2={280}
              y2={300}
              stroke="#888"
              strokeWidth={1.2}
            />
            <text
              x={280}
              y={350}
              fontSize={11}
              fill="currentColor"
              className="text-muted"
              textAnchor="middle"
            >
              xₜ = {xInput.toFixed(2)} (Input hiện tại)
            </text>

            {/* Gate detail explanation — shows at bottom when active */}
            {activeGate && (
              <g>
                <rect
                  x={30}
                  y={308}
                  width={500}
                  height={20}
                  rx={4}
                  fill={
                    activeGate === "reset"
                      ? "#ef4444"
                      : activeGate === "update"
                        ? "#22c55e"
                        : "#3b82f6"
                  }
                  opacity={0.08}
                />
                <text
                  x={280}
                  y={322}
                  fontSize={11}
                  fill={
                    activeGate === "reset"
                      ? "#ef4444"
                      : activeGate === "update"
                        ? "#22c55e"
                        : "#3b82f6"
                  }
                  textAnchor="middle"
                  fontWeight={600}
                >
                  {activeGate === "reset" &&
                    `rₜ × hₜ₋₁ = ${cellValues.r.toFixed(2)} × ${hPrev.toFixed(2)} = ${cellValues.rTimesH.toFixed(3)} — lọc quá khứ trước khi tính candidate`}
                  {activeGate === "update" &&
                    `hₜ = ${cellValues.z.toFixed(2)}·${hPrev.toFixed(2)} + ${(1 - cellValues.z).toFixed(2)}·${cellValues.hTilde.toFixed(2)} = ${cellValues.hNew.toFixed(3)}`}
                  {activeGate === "candidate" &&
                    `h̃ₜ = tanh(W·${xInput.toFixed(2)} + U·${cellValues.rTimesH.toFixed(2)}) = ${cellValues.hTilde.toFixed(3)}`}
                </text>
              </g>
            )}
          </svg>

          {/* ══════ Live matrix multiplication breakdown ══════ */}
          <div className="mt-4 rounded-lg border border-border bg-surface p-3 space-y-2">
            <p className="text-xs font-semibold text-foreground">
              Phép nhân ma trận trực tiếp:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="rounded bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800 p-2">
                <div className="text-red-700 dark:text-red-400 font-semibold mb-0.5">
                  Reset Gate
                </div>
                <div className="text-foreground/80">
                  rₜ = σ(0.9·{xInput.toFixed(2)} + 0.4·{hPrev.toFixed(2)} +
                  (-0.2))
                </div>
                <div className="text-red-600 dark:text-red-300">
                  = σ({(0.9 * xInput + 0.4 * hPrev - 0.2).toFixed(3)}) ={" "}
                  {cellValues.r.toFixed(3)}
                </div>
              </div>
              <div className="rounded bg-green-50 dark:bg-green-900/15 border border-green-200 dark:border-green-800 p-2">
                <div className="text-green-700 dark:text-green-400 font-semibold mb-0.5">
                  Update Gate
                </div>
                <div className="text-foreground/80">
                  zₜ = σ(0.7·{xInput.toFixed(2)} + 0.6·{hPrev.toFixed(2)} +
                  (-0.1))
                </div>
                <div className="text-green-600 dark:text-green-300">
                  = σ({(0.7 * xInput + 0.6 * hPrev - 0.1).toFixed(3)}) ={" "}
                  {cellValues.z.toFixed(3)}
                </div>
              </div>
              <div className="rounded bg-blue-50 dark:bg-blue-900/15 border border-blue-200 dark:border-blue-800 p-2">
                <div className="text-blue-700 dark:text-blue-400 font-semibold mb-0.5">
                  Candidate
                </div>
                <div className="text-foreground/80">
                  h̃ₜ = tanh(1.1·{xInput.toFixed(2)} + 0.8·
                  {cellValues.rTimesH.toFixed(2)})
                </div>
                <div className="text-blue-600 dark:text-blue-300">
                  = tanh(
                  {(1.1 * xInput + 0.8 * cellValues.rTimesH).toFixed(3)}) ={" "}
                  {cellValues.hTilde.toFixed(3)}
                </div>
              </div>
              <div className="rounded bg-purple-50 dark:bg-purple-900/15 border border-purple-200 dark:border-purple-800 p-2">
                <div className="text-purple-700 dark:text-purple-400 font-semibold mb-0.5">
                  Output (new h)
                </div>
                <div className="text-foreground/80">
                  hₜ = zₜ·hₜ₋₁ + (1-zₜ)·h̃ₜ
                </div>
                <div className="text-purple-600 dark:text-purple-300">
                  = {cellValues.zTimesHPrev.toFixed(3)} +{" "}
                  {cellValues.oneMinusZTimesHTilde.toFixed(3)} ={" "}
                  {cellValues.hNew.toFixed(3)}
                </div>
              </div>
            </div>
          </div>
        </VisualizationSection>

        <p className="text-sm text-muted mt-3">
          Chỉ 2 cổng thay vì 3 — nhưng cổng update kiêm luôn vai trò forget và
          input. Thử kéo xₜ về -1 và hₜ₋₁ lên 1 xem update gate phản ứng thế
          nào.
        </p>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════
          STEP 3 — TÍNH TOÁN TAY
          ═══════════════════════════════════════════════════════ */}
      <LessonSection
        step={3}
        totalSteps={TOTAL_STEPS}
        label="Tính toán từng bước"
      >
        <p className="text-sm text-foreground leading-relaxed mb-3">
          Hãy cùng đi qua một bước GRU đầy đủ, từ input xₜ và hₜ₋₁ cho tới hₜ
          mới. Mọi phép toán đều là phép nhân/cộng ma trận và hàm kích hoạt quen
          thuộc.
        </p>

        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
              1
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Tính reset gate rₜ
              </p>
              <LaTeX block>
                {String.raw`r_t = \sigma(W_r x_t + U_r h_{t-1} + b_r)`}
              </LaTeX>
              <p className="text-xs text-muted">
                Giá trị trong [0, 1]. Gần 0 = &quot;quên quá khứ&quot;, gần 1 =
                &quot;giữ đầy đủ quá khứ&quot;.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
              2
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Tính update gate zₜ
              </p>
              <LaTeX block>
                {String.raw`z_t = \sigma(W_z x_t + U_z h_{t-1} + b_z)`}
              </LaTeX>
              <p className="text-xs text-muted">
                Cũng trong [0, 1]. Đây là cổng &quot;thông minh nhất&quot; của
                GRU — kiểm soát tỷ lệ giữ/thay.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
              3
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Tính candidate h̃ₜ
              </p>
              <LaTeX block>
                {String.raw`\tilde{h}_t = \tanh(W x_t + U (r_t \odot h_{t-1}) + b)`}
              </LaTeX>
              <p className="text-xs text-muted">
                Đây là &quot;đề xuất hidden state mới&quot; — chưa được áp dụng
                ngay. Lưu ý rₜ nhân theo phần tử với hₜ₋₁ trước khi vào tanh.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
              4
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Trộn cũ và mới → hₜ
              </p>
              <LaTeX block>
                {String.raw`h_t = z_t \odot h_{t-1} + (1 - z_t) \odot \tilde{h}_t`}
              </LaTeX>
              <p className="text-xs text-muted">
                Nếu zₜ = 0.9: giữ 90% cũ, chỉ thêm 10% mới. Nếu zₜ = 0.1: gần
                như thay hoàn toàn bằng candidate.
              </p>
            </div>
          </div>
        </div>

        <Callout variant="tip" title="Mẹo đọc công thức GRU nhanh">
          <p>
            Đếm &quot;3 ma trận trọng số&quot;: Wᵣ cho reset, W_z cho update, W
            cho candidate. LSTM có 4. Đây là lý do GRU nhẹ hơn ~25%.
          </p>
        </Callout>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════
          STEP 4 — SO SÁNH LSTM VS GRU
          ═══════════════════════════════════════════════════════ */}
      <LessonSection
        step={4}
        totalSteps={TOTAL_STEPS}
        label="So sánh LSTM vs GRU"
      >
        <p className="text-sm text-foreground leading-relaxed mb-3">
          Cùng bài toán, cùng dữ liệu — LSTM và GRU thường cho kết quả gần giống
          nhau. Khác biệt nằm ở <strong>tham số</strong>,{" "}
          <strong>tốc độ train</strong>, và một vài tình huống ngoại lệ.
        </p>

        {/* Toggle view mode */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setViewMode("gru")}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
              viewMode === "gru"
                ? "border-green-400 bg-green-50 dark:bg-green-900/15 text-green-700 dark:text-green-400"
                : "border-border bg-card text-muted hover:bg-surface"
            }`}
          >
            Chỉ GRU
          </button>
          <button
            type="button"
            onClick={() => setViewMode("lstm")}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
              viewMode === "lstm"
                ? "border-blue-400 bg-blue-50 dark:bg-blue-900/15 text-blue-700 dark:text-blue-400"
                : "border-border bg-card text-muted hover:bg-surface"
            }`}
          >
            Chỉ LSTM
          </button>
          <button
            type="button"
            onClick={() => setViewMode("both")}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
              viewMode === "both"
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-card text-muted hover:bg-surface"
            }`}
          >
            Song song
          </button>
        </div>

        {/* Side-by-side architecture diagram */}
        <VisualizationSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ══ LSTM Diagram ══ */}
            {(viewMode === "lstm" || viewMode === "both") && (
              <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/10 p-3">
                <h4 className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-2">
                  LSTM (3 cổng)
                </h4>
                <svg viewBox="0 0 260 180" className="w-full">
                  {/* Cell state line */}
                  <line
                    x1={10}
                    y1={40}
                    x2={250}
                    y2={40}
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                  />
                  <text
                    x={130}
                    y={18}
                    fontSize={11}
                    fill="#3b82f6"
                    textAnchor="middle"
                    fontWeight={600}
                  >
                    Cell State cₜ (riêng biệt!)
                  </text>
                  {/* Hidden state line */}
                  <line
                    x1={10}
                    y1={100}
                    x2={250}
                    y2={100}
                    stroke="#60a5fa"
                    strokeWidth={2}
                  />
                  <text
                    x={130}
                    y={116}
                    fontSize={11}
                    fill="#60a5fa"
                    textAnchor="middle"
                  >
                    Hidden State hₜ
                  </text>
                  {/* Forget gate */}
                  <rect
                    x={30}
                    y={130}
                    width={50}
                    height={32}
                    rx={6}
                    fill="#ef4444"
                    opacity={0.15}
                    stroke="#ef4444"
                    strokeWidth={1}
                  />
                  <text
                    x={55}
                    y={150}
                    fontSize={11}
                    fill="#ef4444"
                    textAnchor="middle"
                    fontWeight={600}
                  >
                    Forget fₜ
                  </text>
                  {/* Input gate */}
                  <rect
                    x={100}
                    y={130}
                    width={50}
                    height={32}
                    rx={6}
                    fill="#f59e0b"
                    opacity={0.15}
                    stroke="#f59e0b"
                    strokeWidth={1}
                  />
                  <text
                    x={125}
                    y={150}
                    fontSize={11}
                    fill="#f59e0b"
                    textAnchor="middle"
                    fontWeight={600}
                  >
                    Input iₜ
                  </text>
                  {/* Output gate */}
                  <rect
                    x={170}
                    y={130}
                    width={50}
                    height={32}
                    rx={6}
                    fill="#22c55e"
                    opacity={0.15}
                    stroke="#22c55e"
                    strokeWidth={1}
                  />
                  <text
                    x={195}
                    y={150}
                    fontSize={11}
                    fill="#22c55e"
                    textAnchor="middle"
                    fontWeight={600}
                  >
                    Output oₜ
                  </text>
                </svg>
                <div className="mt-2 text-xs text-foreground/80 space-y-1">
                  <p>
                    • <strong>4 ma trận trọng số</strong> (Wf, Wi, Wo, Wc)
                  </p>
                  <p>
                    • <strong>2 trạng thái</strong>: cell + hidden
                  </p>
                  <p>
                    • ~<strong>4× tham số RNN</strong>
                  </p>
                </div>
              </div>
            )}

            {/* ══ GRU Diagram ══ */}
            {(viewMode === "gru" || viewMode === "both") && (
              <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10 p-3">
                <h4 className="text-sm font-bold text-green-700 dark:text-green-400 mb-2">
                  GRU (2 cổng)
                </h4>
                <svg viewBox="0 0 260 180" className="w-full">
                  {/* Hidden state only */}
                  <line
                    x1={10}
                    y1={60}
                    x2={250}
                    y2={60}
                    stroke="#22c55e"
                    strokeWidth={3}
                  />
                  <text
                    x={130}
                    y={30}
                    fontSize={11}
                    fill="#22c55e"
                    textAnchor="middle"
                    fontWeight={600}
                  >
                    Chỉ Hidden State hₜ
                  </text>
                  <text
                    x={130}
                    y={46}
                    fontSize={11}
                    fill="#888"
                    textAnchor="middle"
                    fontStyle="italic"
                  >
                    (không có cell state riêng)
                  </text>
                  {/* Reset gate */}
                  <rect
                    x={50}
                    y={110}
                    width={60}
                    height={38}
                    rx={6}
                    fill="#ef4444"
                    opacity={0.15}
                    stroke="#ef4444"
                    strokeWidth={1}
                  />
                  <text
                    x={80}
                    y={132}
                    fontSize={11}
                    fill="#ef4444"
                    textAnchor="middle"
                    fontWeight={600}
                  >
                    Reset rₜ
                  </text>
                  {/* Update gate */}
                  <rect
                    x={150}
                    y={110}
                    width={60}
                    height={38}
                    rx={6}
                    fill="#22c55e"
                    opacity={0.15}
                    stroke="#22c55e"
                    strokeWidth={1}
                  />
                  <text
                    x={180}
                    y={132}
                    fontSize={11}
                    fill="#22c55e"
                    textAnchor="middle"
                    fontWeight={600}
                  >
                    Update zₜ
                  </text>
                </svg>
                <div className="mt-2 text-xs text-foreground/80 space-y-1">
                  <p>
                    • <strong>3 ma trận trọng số</strong> (Wᵣ, W_z, W)
                  </p>
                  <p>
                    • <strong>1 trạng thái</strong>: hidden (gộp)
                  </p>
                  <p>
                    • ~<strong>3× tham số RNN</strong> (ít hơn LSTM 25%)
                  </p>
                </div>
              </div>
            )}
          </div>
        </VisualizationSection>

        <button
          type="button"
          onClick={() => setShowCompare(!showCompare)}
          className="mt-4 rounded-lg border border-accent bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-white"
        >
          {showCompare
            ? "Ẩn bảng so sánh"
            : "Xem bảng so sánh chi tiết 8 tiêu chí"}
        </button>

        {showCompare && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="overflow-x-auto mt-3"
          >
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-2 text-muted border-b border-border">
                    Tiêu chí
                  </th>
                  <th className="text-left p-2 text-blue-500 border-b border-border">
                    LSTM
                  </th>
                  <th className="text-left p-2 text-green-500 border-b border-border">
                    GRU
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row, i) => (
                  <tr key={i}>
                    <td className="p-2 text-foreground font-medium border-b border-border/50">
                      {row.feature}
                    </td>
                    <td
                      className={`p-2 border-b border-border/50 ${
                        row.winner === "lstm"
                          ? "text-blue-500 font-semibold"
                          : "text-muted"
                      }`}
                    >
                      {row.lstm}
                    </td>
                    <td
                      className={`p-2 border-b border-border/50 ${
                        row.winner === "gru"
                          ? "text-green-500 font-semibold"
                          : "text-muted"
                      }`}
                    >
                      {row.gru}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        <Callout variant="info" title="Quy tắc chọn nhanh">
          <p>
            <strong>Dataset nhỏ/trung bình + cần tốc độ?</strong> → GRU.{" "}
            <strong>Dataset lớn + chuỗi rất dài?</strong> → LSTM.{" "}
            <strong>Bài toán NLP hiện đại?</strong> →{" "}
            <TopicLink slug="transformer">Transformer</TopicLink> (cả hai đều
            thua). Trong thực tế, thử cả hai rồi chọn cái tốt hơn trên
            validation set!
          </p>
        </Callout>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════
          STEP 5 — THAM SỐ VISUALIZATION
          ═══════════════════════════════════════════════════════ */}
      <LessonSection
        step={5}
        totalSteps={TOTAL_STEPS}
        label="Giảm tham số trực quan"
      >
        <p className="text-sm text-foreground leading-relaxed mb-3">
          Với cấu hình phổ biến (input_size=128, hidden_size=256), đây là số
          tham số trainable của GRU so với LSTM:
        </p>

        <VisualizationSection>
          <div className="rounded-lg border border-border bg-surface p-4">
            {/* Bar chart */}
            <div className="space-y-3">
              {/* LSTM bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-blue-500">
                    LSTM (4 ma trận)
                  </span>
                  <span className="text-xs font-mono text-blue-500">
                    {paramCount.lstm.toLocaleString()} tham số
                  </span>
                </div>
                <div className="h-7 w-full rounded-md bg-card border border-border overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.8 }}
                    className="h-full bg-blue-500/40 border-r border-blue-500"
                  />
                </div>
              </div>
              {/* GRU bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-green-500">
                    GRU (3 ma trận)
                  </span>
                  <span className="text-xs font-mono text-green-500">
                    {paramCount.gru.toLocaleString()} tham số
                  </span>
                </div>
                <div className="h-7 w-full rounded-md bg-card border border-border overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "75%" }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="h-full bg-green-500/40 border-r border-green-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <div className="text-3xl font-bold text-accent">
                -{paramCount.reduction}%
              </div>
              <div className="text-xs text-muted">
                tham số giảm khi thay LSTM bằng GRU ở cùng hidden_size
              </div>
            </div>

            <div className="mt-3 text-[11px] text-tertiary leading-relaxed">
              Công thức: mỗi gate trong GRU/LSTM có W (input×hidden) + U
              (hidden×hidden) + b. GRU có 3 gates, LSTM có 4. Với input=128,
              hidden=256: GRU ={" "}
              <span className="font-mono">3×(128·256 + 256·256 + 256)</span>;
              LSTM ={" "}
              <span className="font-mono">4×(128·256 + 256·256 + 256)</span>.
            </div>
          </div>
        </VisualizationSection>

        <Callout variant="insight" title="Tiết kiệm không chỉ là tham số">
          <p>
            Ít tham số → <strong>train nhanh hơn</strong> (ít phép nhân ma
            trận), <strong>tốn ít VRAM hơn</strong> (đặc biệt khi batch lớn),
            và <strong>ít overfitting</strong> (khi data khan hiếm). Đổi lại
            GRU hơi kém LSTM khi chuỗi cực dài — một đánh đổi hợp lý.
          </p>
        </Callout>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════
          STEP 6 — AHA MOMENT
          ═══════════════════════════════════════════════════════ */}
      <LessonSection
        step={6}
        totalSteps={TOTAL_STEPS}
        label="Khoảnh khắc Aha"
      >
        <AhaMoment>
          <p>
            Cổng <strong>update</strong> là phát minh thông minh nhất của GRU:{" "}
            <LaTeX>
              {String.raw`h_t = z_t \odot h_{t-1} + (1 - z_t) \odot \tilde{h}_t`}
            </LaTeX>
            . Khi <LaTeX>{"z_t \\to 1"}</LaTeX>: giữ nguyên cũ (forget). Khi{" "}
            <LaTeX>{"z_t \\to 0"}</LaTeX>: lấy hoàn toàn mới (input). Một
            cổng, hai vai trò — tổng luôn bằng 1, ràng buộc tự nhiên!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════
          STEP 7 — THỬ THÁCH (2 challenges)
          ═══════════════════════════════════════════════════════ */}
      <LessonSection
        step={7}
        totalSteps={TOTAL_STEPS}
        label="Thử thách tư duy"
      >
        <div className="space-y-4">
          <InlineChallenge
            question="GRU update gate: hₜ = zₜ × hₜ₋₁ + (1-zₜ) × h̃ₜ. Nếu zₜ = 0.9 cho mọi bước, GRU sẽ hoạt động thế nào?"
            options={[
              "Như RNN thường — mỗi bước ghi đè hoàn toàn",
              "Như bộ nhớ cực dài — giữ 90% cũ, chỉ thêm 10% mới mỗi bước",
              "Không hoạt động — zₜ phải bằng 0.5",
            ]}
            correct={1}
            explanation="Khi zₜ = 0.9: hₜ = 0.9 × hₜ₋₁ + 0.1 × h̃ₜ. Hidden state thay đổi rất chậm — giữ 90% quá khứ mỗi bước. Sau 10 bước, thông tin ban đầu vẫn còn 0.9¹⁰ ≈ 35%! Đây là cách GRU nhớ xa."
          />

          <InlineChallenge
            question="Nếu reset gate rₜ = 0 liên tục, candidate h̃ₜ lúc đó phụ thuộc vào gì?"
            options={[
              "Chỉ hₜ₋₁ — bỏ qua xₜ",
              "Chỉ xₜ hiện tại — bỏ qua quá khứ hoàn toàn",
              "Cả hai, nhưng có thêm bias",
              "Luôn bằng 0",
            ]}
            correct={1}
            explanation="h̃ₜ = tanh(W·xₜ + U·(rₜ·hₜ₋₁)). Khi rₜ = 0: rₜ·hₜ₋₁ = 0 → h̃ₜ = tanh(W·xₜ). Candidate chỉ còn phụ thuộc xₜ — GRU 'quên sạch' để làm lại từ đầu. Hữu ích khi bắt đầu câu mới trong dịch máy."
          />
        </div>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════
          STEP 8 — GIẢI THÍCH CHI TIẾT + CODE
          ═══════════════════════════════════════════════════════ */}
      <LessonSection
        step={8}
        totalSteps={TOTAL_STEPS}
        label="Giải thích chi tiết"
      >
        <ExplanationSection>
          <p>
            <strong>GRU (Gated Recurrent Unit)</strong> được Cho et al. đề xuất
            năm 2014 trong paper &quot;Learning Phrase Representations using
            RNN Encoder-Decoder&quot;. Ý tưởng chính: đơn giản hóa LSTM mà vẫn
            giữ khả năng nhớ xa. Hai cổng chính:
          </p>

          <p className="mt-3 font-semibold text-foreground">
            Đầy đủ 4 công thức:
          </p>

          <LaTeX block>
            {String.raw`r_t = \sigma(W_r \cdot [h_{t-1}, x_t] + b_r) \quad \text{(Reset Gate)}`}
          </LaTeX>
          <LaTeX block>
            {String.raw`z_t = \sigma(W_z \cdot [h_{t-1}, x_t] + b_z) \quad \text{(Update Gate)}`}
          </LaTeX>
          <LaTeX block>
            {String.raw`\tilde{h}_t = \tanh(W \cdot [r_t \odot h_{t-1}, x_t] + b) \quad \text{(Candidate)}`}
          </LaTeX>
          <LaTeX block>
            {String.raw`h_t = z_t \odot h_{t-1} + (1 - z_t) \odot \tilde{h}_t \quad \text{(Hidden State)}`}
          </LaTeX>

          <Callout variant="insight" title="Sự thông minh của (1 - zₜ)">
            <p>
              <TopicLink slug="lstm">LSTM</TopicLink> dùng forget gate (fₜ) và
              input gate (iₜ) độc lập — tổng không cần bằng 1. GRU ép tổng
              luôn bằng 1: zₜ + (1-zₜ) = 1. Nghĩa là &quot;giữ nhiều cũ&quot;
              tự động = &quot;thêm ít mới&quot;. Ít tham số hơn mà ràng buộc
              chặt hơn!
            </p>
          </Callout>

          <Callout variant="tip" title="GRU giải vanishing gradient thế nào?">
            <p>
              Đạo hàm riêng <LaTeX>{String.raw`\partial h_t / \partial h_{t-1}`}</LaTeX>{" "}
              có một thành phần là zₜ — có thể gần 1. Khi backprop qua nhiều
              bước, gradient không nhân liên tục các số nhỏ (như RNN thường)
              mà &quot;đi thẳng&quot; qua cổng update. Đây là lý do GRU (và
              LSTM) tránh được vanishing gradient tốt hơn RNN thường.
            </p>
          </Callout>

          <CollapsibleDetail title="Toán chi tiết: Tại sao GRU khắc phục vanishing gradient?">
            <div className="space-y-2 text-sm">
              <p>
                Trong <TopicLink slug="rnn">RNN</TopicLink> thường,{" "}
                <LaTeX>{String.raw`h_t = \tanh(W h_{t-1} + U x_t)`}</LaTeX>.
                Đạo hàm <LaTeX>{String.raw`\partial h_t / \partial h_{t-1}`}</LaTeX>{" "}
                = <LaTeX>{String.raw`W \cdot \tanh'(\cdot)`}</LaTeX>, với{" "}
                <LaTeX>{String.raw`\tanh' \leq 1`}</LaTeX>. Khi backprop qua
                T bước, gradient nhân T lần các số {"<"} 1 → suy giảm theo
                hàm mũ.
              </p>
              <p>
                Với GRU:{" "}
                <LaTeX>{String.raw`h_t = z_t h_{t-1} + (1-z_t) \tilde{h}_t`}</LaTeX>
                . Đạo hàm gồm <LaTeX>{"z_t"}</LaTeX> cộng với các thành phần
                khác. Nếu zₜ gần 1 (nhớ lâu), gradient gần như đi thẳng qua —
                không bị nhân với số nhỏ. Mạng học được &quot;đóng cổng
                forget&quot; cho chiều nào cần giữ lâu.
              </p>
              <p>
                Thực nghiệm: GRU và{" "}
                <TopicLink slug="lstm">LSTM</TopicLink> xử lý ổn chuỗi dài
                cỡ vài trăm bước. Với chuỗi hàng nghìn bước, cả hai vẫn gặp
                khó khăn — đó là lúc <TopicLink slug="transformer">Transformer</TopicLink>{" "}
                thay thế.
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="Biến thể: Minimal GRU, Coupled input-forget, bidirectional GRU">
            <div className="space-y-2 text-sm">
              <p>
                <strong>Minimal GRU</strong> (M-GRU): bỏ luôn reset gate, chỉ
                giữ update gate. Đơn giản hơn nữa nhưng kém hơn GRU chuẩn trên
                nhiều benchmark.
              </p>
              <p>
                <strong>Coupled input-forget LSTM</strong>: biến thể LSTM dùng
                cùng ý tưởng (1-fₜ) cho input gate — giống GRU nhưng vẫn giữ
                cell state.
              </p>
              <p>
                <strong>Bidirectional GRU (BiGRU)</strong>: chạy GRU từ trái
                sang phải và phải sang trái, nối kết quả. Hiệu quả cho NER,
                sentiment analysis — những bài toán cần cả context trước và
                sau.
              </p>
              <p>
                <strong>Stacked GRU</strong>: nhiều lớp GRU chồng lên nhau,
                output của lớp dưới là input của lớp trên. num_layers={"{"}2-3
                {"}"} thường đủ; sâu hơn ít khi có lợi.
              </p>
            </div>
          </CollapsibleDetail>

          <p className="mt-4 font-semibold text-foreground">
            Code ví dụ 1: Khai báo GRU trong PyTorch
          </p>

          <CodeBlock language="python" title="gru_comparison.py">
            {`import torch
import torch.nn as nn

# GRU — đơn giản hơn
gru = nn.GRU(
    input_size=128,
    hidden_size=256,
    num_layers=2,
    batch_first=True,
    dropout=0.2,
    bidirectional=False,
)

# LSTM — để so sánh
lstm = nn.LSTM(
    input_size=128,
    hidden_size=256,
    num_layers=2,
    batch_first=True,
    dropout=0.2,
    bidirectional=False,
)

# So sánh tham số
gru_params = sum(p.numel() for p in gru.parameters())
lstm_params = sum(p.numel() for p in lstm.parameters())
print(f"GRU:  {gru_params:,} params")   # ~788,480
print(f"LSTM: {lstm_params:,} params")  # ~1,050,624
print(f"GRU nhẹ hơn: {(1 - gru_params/lstm_params)*100:.1f}%")  # ~25%

# Sử dụng
batch_size, seq_len, feat = 32, 50, 128
x = torch.randn(batch_size, seq_len, feat)
h0 = torch.zeros(2, batch_size, 256)  # (num_layers, batch, hidden)

# GRU chỉ trả 1 state (h), LSTM trả 2 (h, c)
output_gru, h_gru = gru(x, h0)
output_lstm, (h_lstm, c_lstm) = lstm(x)

print(output_gru.shape)  # torch.Size([32, 50, 256])
print(h_gru.shape)       # torch.Size([2, 32, 256])

# Đây là khác biệt rõ nhất khi code: LSTM trả tuple (h, c)
# vì có cell state riêng, GRU thì không.`}
          </CodeBlock>

          <p className="mt-4 font-semibold text-foreground">
            Code ví dụ 2: Viết tay GRU cell từ đầu (để hiểu sâu)
          </p>

          <CodeBlock language="python" title="gru_from_scratch.py">
            {`import torch
import torch.nn as nn
import torch.nn.functional as F

class GRUCellManual(nn.Module):
    """GRU cell viết tay — khớp với công thức trong bài."""
    def __init__(self, input_size: int, hidden_size: int):
        super().__init__()
        self.hidden_size = hidden_size

        # 3 ma trận trọng số (thay vì 4 của LSTM)
        # W_r, W_z, W — mỗi cái xử lý (input + hidden) nối lại
        self.W_r = nn.Linear(input_size + hidden_size, hidden_size)
        self.W_z = nn.Linear(input_size + hidden_size, hidden_size)
        self.W   = nn.Linear(input_size + hidden_size, hidden_size)

    def forward(self, x_t: torch.Tensor, h_prev: torch.Tensor):
        # Nối input và hidden trước đó
        combined = torch.cat([x_t, h_prev], dim=-1)

        # Reset gate và Update gate — đều dùng cùng combined
        r_t = torch.sigmoid(self.W_r(combined))
        z_t = torch.sigmoid(self.W_z(combined))

        # Candidate — reset gate nhân theo phần tử với h_prev
        combined_reset = torch.cat([x_t, r_t * h_prev], dim=-1)
        h_tilde = torch.tanh(self.W(combined_reset))

        # Trộn cũ và mới — đây là phép "magic" của GRU
        h_t = z_t * h_prev + (1 - z_t) * h_tilde
        return h_t

# Sử dụng cho chuỗi đầy đủ
cell = GRUCellManual(128, 256)
h = torch.zeros(1, 256)  # initial hidden
for t in range(seq_len):
    x_t = x[:, t, :]  # (batch, input_size)
    h = cell(x_t, h)
# h cuối cùng chứa summary toàn chuỗi

# So sánh với nn.GRU có sẵn:
# - nn.GRU tối ưu với cuDNN, nhanh hơn ~5-10x
# - Viết tay hữu ích để debug hoặc custom (vd: attention over hidden)`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════
          STEP 9 — TÓM TẮT
          ═══════════════════════════════════════════════════════ */}
      <LessonSection step={9} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="6 điểm nhớ về GRU"
          points={[
            "GRU đơn giản hóa LSTM: 2 cổng (reset, update) thay vì 3, gộp cell state vào hidden state.",
            "Update gate kiêm cả forget + input: hₜ = zₜ·hₜ₋₁ + (1-zₜ)·h̃ₜ. Tổng luôn bằng 1 — ràng buộc chặt hơn LSTM.",
            "Reset gate cho phép 'quên sạch' quá khứ khi cần bắt đầu context mới: h̃ₜ = tanh(W·xₜ + U·(rₜ·hₜ₋₁)).",
            "Ít tham số hơn ~25% → train nhanh hơn ~15-20%, ít overfitting hơn trên dataset nhỏ.",
            "Hiệu suất thường ngang LSTM — chọn tùy bài toán (nhỏ → GRU, lớn → LSTM, NLP → Transformer).",
            "Giải vanishing gradient nhờ đường đi 'thẳng' qua zₜ, nhưng vẫn hạn chế với chuỗi >1000 bước.",
          ]}
        />
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════
          STEP 10 — QUIZ
          ═══════════════════════════════════════════════════════ */}
      <LessonSection step={10} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
