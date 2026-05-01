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
  slug: "lstm",
  title: "Long Short-Term Memory",
  titleVi: "Bộ nhớ dài-ngắn hạn",
  description:
    "Biến thể RNN với cơ chế cổng giúp nhớ thông tin dài hạn hiệu quả",
  category: "dl-architectures",
  tags: ["sequence", "nlp", "rnn"],
  difficulty: "advanced",
  relatedSlugs: ["rnn", "gru", "transformer"],
  vizType: "interactive",
};

/* ──────────────────────────────────────────────────────────────
   TOÁN HỌC LSTM — CÁC HÀM TRỢ GIÚP
   Mục tiêu: tính trực tiếp trong trình duyệt để học viên có thể
   trượt slider input xₜ và xem các cổng / cell state cập nhật
   thời gian thực.
   ────────────────────────────────────────────────────────────── */
const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));
const tanh = (z: number) => Math.tanh(z);

// Trọng số "giả" được chọn tay để minh hoạ hành vi mong muốn —
// đủ để thấy rõ sự khác biệt khi x trượt, không phải giá trị huấn luyện.
const DEMO_WEIGHTS = {
  Wf: 1.2,
  bf: 0.4, // forget hơi thiên về "giữ"
  Wi: 1.5,
  bi: -0.3,
  Wg: 1.8,
  bg: 0.0, // candidate
  Wo: 1.1,
  bo: 0.2,
};

interface LstmStep {
  x: number;
  hPrev: number;
  cPrev: number;
  f: number;
  i: number;
  g: number;
  o: number;
  c: number;
  h: number;
}

/** Một bước LSTM đơn giản với scalar x/h/c (đủ cho mô phỏng). */
function lstmStep(x: number, hPrev: number, cPrev: number): LstmStep {
  const z = DEMO_WEIGHTS.Wf * x + 0.8 * hPrev + DEMO_WEIGHTS.bf;
  const f = sigmoid(z);
  const i = sigmoid(DEMO_WEIGHTS.Wi * x + 0.5 * hPrev + DEMO_WEIGHTS.bi);
  const g = tanh(DEMO_WEIGHTS.Wg * x + 0.3 * hPrev + DEMO_WEIGHTS.bg);
  const o = sigmoid(DEMO_WEIGHTS.Wo * x + 0.6 * hPrev + DEMO_WEIGHTS.bo);
  const c = f * cPrev + i * g;
  const h = o * tanh(c);
  return { x, hPrev, cPrev, f, i, g, o, c, h };
}

/* ──────────────────────────────────────────────────────────────
   DANH SÁCH CỔNG — METADATA
   ────────────────────────────────────────────────────────────── */
const GATES = [
  {
    id: "forget",
    name: "Cổng quên",
    nameEn: "Forget Gate",
    color: "#ef4444",
    symbol: "×",
    desc: "Quyết định XÓA thông tin nào trong bộ nhớ cũ",
    formula: "fₜ = σ(Wf·[hₜ₋₁, xₜ] + bf)",
    analogy: "Tẩy phần ghi chú cũ không còn cần thiết",
    role: "Khi fₜ ≈ 1 → giữ lại toàn bộ Cₜ₋₁. Khi fₜ ≈ 0 → xóa sạch.",
  },
  {
    id: "input",
    name: "Cổng nhập",
    nameEn: "Input Gate",
    color: "#22c55e",
    symbol: "+",
    desc: "Quyết định GHI thông tin mới nào vào bộ nhớ",
    formula: "iₜ = σ(Wi·[hₜ₋₁, xₜ] + bi)",
    analogy: "Viết thông tin mới quan trọng vào vở",
    role: "iₜ đóng vai trò 'công tắc' cho candidate g̃ₜ trước khi cộng vào cell state.",
  },
  {
    id: "candidate",
    name: "Giá trị đề xuất",
    nameEn: "Candidate g̃",
    color: "#f59e0b",
    symbol: "g̃",
    desc: "Đề xuất giá trị MỚI có thể ghi vào cell state",
    formula: "g̃ₜ = tanh(Wg·[hₜ₋₁, xₜ] + bg)",
    analogy: "Bản nháp ghi chú trước khi duyệt",
    role: "tanh đảm bảo giá trị nằm trong [−1, 1] — không làm cell state nổ.",
  },
  {
    id: "output",
    name: "Cổng xuất",
    nameEn: "Output Gate",
    color: "#3b82f6",
    symbol: "×",
    desc: "Quyết định XUẤT phần nào của bộ nhớ làm hidden state",
    formula: "oₜ = σ(Wo·[hₜ₋₁, xₜ] + bo)",
    analogy: "Chọn phần nào trong vở để trả lời câu hỏi hiện tại",
    role: "hₜ = oₜ ⊙ tanh(Cₜ) — output luôn là một 'lát cắt' của cell state.",
  },
];

const SENTENCE = [
  "Tôi",
  "sinh",
  "ở",
  "Huế",
  "nên",
  "tôi",
  "thích",
  "ăn",
  "bún",
  "bò",
];

const MEMORY_STATES = [
  "Cell: [ ]",
  "Cell: [Tôi]",
  "Cell: [Tôi, sinh]",
  "Cell: [Tôi, sinh, ở]",
  "Cell: [sinh ở Huế] ← nhớ quê!",
  "Cell: [sinh ở Huế, nên]",
  "Cell: [Huế, nên, tôi]",
  "Cell: [Huế, thích, ăn]",
  "Cell: [Huế, thích ăn]",
  "Cell: [Huế, thích ăn bún]",
];

/* ──────────────────────────────────────────────────────────────
   SO SÁNH LSTM vs RNN — DỮ LIỆU GRADIENT
   Mô phỏng gradient sau N bước với activation tanh (RNN) so với
   qua cell-state highway của LSTM.
   ────────────────────────────────────────────────────────────── */
function rnnGradientDecay(steps: number, tanhDeriv = 0.25): number {
  // tanhDeriv trung bình ~ 0.25; nhân N lần → suy giảm cấp số nhân
  return Math.pow(tanhDeriv, steps);
}
function lstmGradientDecay(steps: number, fGate = 0.95): number {
  // forget gate giữ giá trị ~0.95 → suy giảm chậm hơn nhiều
  return Math.pow(fGate, steps);
}

/* ──────────────────────────────────────────────────────────────
   QUIZ — 8 CÂU
   ────────────────────────────────────────────────────────────── */
const quizQuestions: QuizQuestion[] = [
  {
    question:
      "LSTM có 4 'nhóm' tính toán (3 cổng sigmoid + 1 candidate tanh). Nhóm nào cho phép 'nhớ' thông tin qua hàng trăm bước?",
    options: [
      "Cổng xuất (Output Gate) — vì nó tạo output",
      "Cổng quên (Forget Gate) — khi f ≈ 1, cell state truyền thẳng qua",
      "Cổng nhập (Input Gate) — vì nó thêm thông tin mới",
      "Không nhóm nào — LSTM vẫn bị vanishing gradient",
    ],
    correct: 1,
    explanation:
      "Khi Forget Gate output gần 1, cell state truyền thẳng qua phép nhân (≈ 1 × Cₜ₋₁). Gradient cũng truyền thẳng qua phép nhân này → không bị biến mất. Đây là 'đường cao tốc' cho gradient.",
  },
  {
    question: "LSTM cell state và hidden state khác nhau thế nào?",
    options: [
      "Chúng giống nhau, chỉ khác tên",
      "Cell state là bộ nhớ dài hạn (truyền trực tiếp), hidden state là output ngắn hạn (qua cổng xuất)",
      "Cell state chứa input, hidden state chứa output",
      "Hidden state lớn hơn cell state",
    ],
    correct: 1,
    explanation:
      "Cell state C là 'băng chuyền' bộ nhớ dài hạn — chỉ bị thay đổi bởi phép nhân/cộng nhẹ. Hidden state h = tanh(C) × output gate là phiên bản 'lọc' của cell state, dùng cho output và truyền sang bước tiếp.",
  },
  {
    question:
      "LSTM có khoảng bao nhiêu tham số so với RNN thông thường (cùng hidden size)?",
    options: [
      "Bằng nhau",
      "Gấp ~4 lần (vì có 3 cổng + 1 candidate, mỗi cái cần bộ trọng số riêng)",
      "Gấp ~2 lần",
      "Ít hơn (vì hiệu quả hơn)",
    ],
    correct: 1,
    explanation:
      "RNN có 1 bộ trọng số W·[h,x]. LSTM có 4: forget, input, output, candidate. Mỗi bộ cùng kích thước → ~4× tham số. Hidden size 256: RNN ~130K, LSTM ~525K tham số.",
  },
  {
    question:
      "Tại sao candidate g̃ₜ dùng tanh thay vì sigmoid như các cổng khác?",
    options: [
      "Vì tanh tính nhanh hơn",
      "Vì candidate là giá trị cần CỘNG vào cell state — cần nằm trong [−1, 1] để vừa có thể tăng vừa có thể giảm C",
      "Vì tanh là mặc định trong PyTorch",
      "Vì sigmoid bị vanishing gradient",
    ],
    correct: 1,
    explanation:
      "Ba cổng sigmoid chỉ cần kiểm soát 'bao nhiêu' (0–1). Candidate phải là giá trị MỚI với dấu — tanh ∈ [−1, 1] cho phép vừa cộng thêm vừa trừ bớt khỏi cell state.",
  },
  {
    question:
      "Nếu huấn luyện LSTM và thấy forget gate luôn bão hoà về 0 từ đầu, điều gì sẽ xảy ra?",
    options: [
      "Mô hình học tốt hơn",
      "Cell state bị reset mỗi bước → LSTM hoạt động giống RNN thường và vanishing gradient quay lại",
      "LSTM sẽ dùng nhiều GPU hơn",
      "Input gate sẽ tự bù trừ",
    ],
    correct: 1,
    explanation:
      "fₜ ≈ 0 → Cₜ = 0·Cₜ₋₁ + iₜ·g̃ₜ = chỉ phụ thuộc bước hiện tại. Đúng vậy — đó là lý do người ta khởi tạo bias của forget gate = 1 (Jozefowicz et al., 2015) để LSTM 'mặc định nhớ'.",
  },
  {
    question: "GRU khác LSTM ở điểm nào về bộ nhớ?",
    options: [
      "GRU không có bộ nhớ",
      "GRU hợp nhất cell state và hidden state → chỉ có 1 trạng thái, 2 cổng (update + reset)",
      "GRU có 5 cổng",
      "GRU dùng softmax thay vì sigmoid",
    ],
    correct: 1,
    explanation:
      "GRU đơn giản hơn: không tách riêng C và h, chỉ dùng update gate zₜ và reset gate rₜ. Ít tham số hơn (~3× RNN so với 4× của LSTM), nhưng trong nhiều bài toán GRU và LSTM tương đương.",
  },
  {
    question:
      "Tại sao Transformer (self-attention) dần thay thế LSTM trong NLP?",
    options: [
      "LSTM không còn hoạt động",
      "LSTM tính tuần tự (bước t+1 cần bước t) nên không song song hoá được — Transformer xử lý cả chuỗi cùng lúc trên GPU",
      "Transformer có ít tham số hơn",
      "Transformer là bắt buộc cho tất cả bài toán",
    ],
    correct: 1,
    explanation:
      "Điểm nghẽn của LSTM là tính tuần tự: phải đợi hₜ₋₁ mới tính được hₜ. Trên GPU hiện đại, Transformer tính self-attention toàn bộ chuỗi song song → huấn luyện nhanh hơn 10–100× ở chuỗi dài.",
  },
  {
    type: "fill-blank",
    question:
      "LSTM có 3 cổng sigmoid: cổng {blank} quyết định xóa thông tin khỏi cell state, cổng {blank} quyết định ghi thông tin mới vào, và cổng {blank} quyết định phần nào của bộ nhớ sẽ xuất ra làm hidden state.",
    blanks: [
      { answer: "forget", accept: ["quên", "forget gate"] },
      { answer: "input", accept: ["nhập", "input gate"] },
      { answer: "output", accept: ["xuất", "output gate"] },
    ],
    explanation:
      "Forget gate (fₜ) nhân với Cₜ₋₁. Input gate (iₜ) nhân với candidate g̃ₜ. Output gate (oₜ) nhân với tanh(Cₜ) → hₜ.",
  },
];

const TOTAL_STEPS = 10;
const STEP_LABELS = [
  "Dự đoán",
  "Khám phá ô LSTM",
  "Slider thời gian thực",
  "Khoảnh khắc Aha",
  "Unroll qua câu",
  "LSTM vs RNN",
  "Thử thách 1",
  "Thử thách 2",
  "Giải thích",
  "Kiểm tra",
];

/* ──────────────────────────────────────────────────────────────
   COMPONENT CHÍNH
   ────────────────────────────────────────────────────────────── */
export default function LstmTopic() {
  const [activeGate, setActiveGate] = useState<string | null>(null);
  const [sentStep, setSentStep] = useState(0);
  const [xInput, setXInput] = useState(0.5);
  const [hPrev, setHPrev] = useState(0.2);
  const [cPrev, setCPrev] = useState(0.3);
  const [compareSteps, setCompareSteps] = useState(30);
  const [unrollIdx, setUnrollIdx] = useState(0);

  const toggleGate = useCallback((id: string) => {
    setActiveGate((prev) => (prev === id ? null : id));
  }, []);

  const activeGateData = GATES.find((g) => g.id === activeGate);

  /** Tính toán LSTM step hiện tại cho slider. */
  const currentStep = useMemo(
    () => lstmStep(xInput, hPrev, cPrev),
    [xInput, hPrev, cPrev]
  );

  /** Mô phỏng 6 bước unroll qua một chuỗi tín hiệu. */
  const unrolled = useMemo(() => {
    const signal = [0.8, 0.2, -0.4, 0.9, 0.1, -0.7];
    const states: LstmStep[] = [];
    let h = 0;
    let c = 0;
    for (const x of signal) {
      const s = lstmStep(x, h, c);
      states.push(s);
      h = s.h;
      c = s.c;
    }
    return { signal, states };
  }, []);

  /** So sánh gradient. */
  const gradientComparison = useMemo(() => {
    return {
      rnn: rnnGradientDecay(compareSteps),
      lstm: lstmGradientDecay(compareSteps),
    };
  }, [compareSteps]);

  return (
    <>
      {/* ══════════════════════════════════════════════════
          TIẾN ĐỘ TOÀN BÀI (cố định trên cùng cho học viên)
          ══════════════════════════════════════════════════ */}
      <div className="mb-6">
        <ProgressSteps
          current={1}
          total={TOTAL_STEPS}
          labels={STEP_LABELS}
        />
      </div>

      {/* ══════════════════════════════════════════════════
          BƯỚC 1 — HOOK: Đặt câu hỏi về bộ nhớ xa
          ══════════════════════════════════════════════════ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question={
            'Câu: "Tôi sinh ở Huế, học ở Sài Gòn, làm việc ở Hà Nội, nên tôi thích ăn bún bò ___". Từ cuối liên quan đến từ nào cách xa 15 từ? RNN thường nhớ nổi chuỗi bao dài?'
          }
          options={[
            "RNN nhớ tốt 100+ từ — không cần cải tiến",
            "RNN chỉ nhớ tốt ~10–20 từ gần nhất, cần cơ chế đặc biệt để nhớ xa hơn",
            "RNN không nhớ được gì cả",
          ]}
          correct={1}
          explanation={
            'Đúng! RNN bị vanishing gradient → quên thông tin xa. "Huế" cách "___" 15 từ, RNN gần như quên mất. LSTM giải quyết bằng cách thêm "bộ nhớ dài hạn" (cell state) — một đường truyền thẳng cho gradient không bị suy giảm.'
          }
        />

        <Callout variant="info" title="Trước khi đi vào LSTM">
          <p>
            Nếu bạn chưa chắc về cách gradient suy giảm qua nhiều bước thời
            gian, hãy xem lại{" "}
            <TopicLink slug="rnn">RNN (Recurrent Neural Network)</TopicLink>{" "}
            và{" "}
            <TopicLink slug="backpropagation">Backpropagation Through Time</TopicLink>{" "}
            trước. Toàn bộ bài học này xoay quanh câu hỏi: làm sao giữ
            gradient SỐNG sót qua 100+ bước?
          </p>
        </Callout>
      </LessonSection>

      {/* ══════════════════════════════════════════════════
          BƯỚC 2 — KHÁM PHÁ Ô LSTM: click vào từng cổng
          ══════════════════════════════════════════════════ */}
      <LessonSection
        step={2}
        totalSteps={TOTAL_STEPS}
        label="Khám phá ô LSTM"
      >
        <p className="text-sm text-foreground leading-relaxed mb-3">
          Hãy tưởng tượng bạn đang ghi chép trong lớp học với{" "}
          <strong>cuốn vở</strong> (cell state — bộ nhớ dài hạn). Tại mỗi
          thời điểm, bạn cần 4 quyết định: <strong>tẩy</strong> (cổng
          quên), <strong>nháp</strong> (candidate),{" "}
          <strong>duyệt viết</strong> (cổng nhập), <strong>đọc lại</strong>{" "}
          (cổng xuất).
        </p>

        <VisualizationSection topicSlug={metadata.slug}>
          <p className="text-sm text-muted mb-3">
            Nhấn vào từng cổng để xem chức năng chi tiết.
          </p>

          <svg
            viewBox="0 0 600 320"
            className="w-full rounded-lg border border-border bg-background"
          >
            {/* Cell state highway */}
            <line
              x1={30}
              y1={55}
              x2={570}
              y2={55}
              stroke="#f59e0b"
              strokeWidth={3.5}
            />
            <text
              x={300}
              y={35}
              fontSize={11}
              fill="#f59e0b"
              textAnchor="middle"
              fontWeight={700}
            >
              Cell State C (Bộ nhớ dài hạn — &quot;cuốn vở&quot;)
            </text>
            <polygon points="570,55 562,49 562,61" fill="#f59e0b" />
            <text x={22} y={60} fontSize={11} fill="#f59e0b" fontWeight={500}>
              Cₜ₋₁
            </text>
            <text x={578} y={60} fontSize={11} fill="#f59e0b" fontWeight={500}>
              Cₜ
            </text>

            {/* Hidden state line */}
            <line
              x1={30}
              y1={250}
              x2={570}
              y2={250}
              stroke="#8b5cf6"
              strokeWidth={2.5}
            />
            <text
              x={300}
              y={290}
              fontSize={11}
              fill="#8b5cf6"
              textAnchor="middle"
              fontWeight={600}
            >
              Hidden State h (Trạng thái ẩn — &quot;câu trả lời&quot;)
            </text>
            <polygon points="570,250 562,245 562,255" fill="#8b5cf6" />

            {/* Gates */}
            {GATES.map((gate, idx) => {
              const x = 90 + idx * 130;
              const isActive = activeGate === gate.id;

              return (
                <g
                  key={gate.id}
                  className="cursor-pointer"
                  onClick={() => toggleGate(gate.id)}
                >
                  <motion.rect
                    x={x - 45}
                    y={105}
                    width={90}
                    height={80}
                    rx={12}
                    fill={gate.color}
                    opacity={isActive ? 0.35 : 0.08}
                    stroke={gate.color}
                    strokeWidth={isActive ? 3 : 1.5}
                    animate={isActive ? { scale: 1.03 } : { scale: 1 }}
                  />
                  <text
                    x={x}
                    y={127}
                    fontSize={12}
                    fill={gate.color}
                    textAnchor="middle"
                    fontWeight={700}
                  >
                    {gate.name}
                  </text>
                  <text
                    x={x}
                    y={143}
                    fontSize={11}
                    fill={gate.color}
                    textAnchor="middle"
                    opacity={0.8}
                  >
                    {gate.nameEn}
                  </text>
                  <text
                    x={x}
                    y={168}
                    fontSize={16}
                    fill={gate.color}
                    textAnchor="middle"
                    fontWeight={700}
                  >
                    {gate.id === "candidate" ? "tanh" : "σ"}
                  </text>

                  <line
                    x1={x}
                    y1={105}
                    x2={x}
                    y2={62}
                    stroke={gate.color}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    strokeDasharray={isActive ? "0" : "5 3"}
                    opacity={isActive ? 1 : 0.4}
                  />

                  <line
                    x1={x}
                    y1={185}
                    x2={x}
                    y2={244}
                    stroke={gate.color}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    strokeDasharray={isActive ? "0" : "5 3"}
                    opacity={isActive ? 1 : 0.4}
                  />

                  <circle
                    cx={x}
                    cy={55}
                    r={11}
                    fill="#0f172a"
                    stroke={gate.color}
                    strokeWidth={2}
                  />
                  <text
                    x={x}
                    y={60}
                    fontSize={12}
                    fill={gate.color}
                    textAnchor="middle"
                    fontWeight={700}
                  >
                    {gate.symbol}
                  </text>
                </g>
              );
            })}

            {/* Input label */}
            <text
              x={50}
              y={315}
              fontSize={11}
              fill="currentColor"
              className="text-muted"
              textAnchor="middle"
            >
              xₜ (Input)
            </text>
            <line
              x1={50}
              y1={302}
              x2={50}
              y2={258}
              stroke="#888"
              strokeWidth={1}
            />
          </svg>

          {/* Gate detail panel */}
          {activeGateData && (
            <motion.div
              key={activeGateData.id}
              className="mt-4 rounded-xl border p-4"
              style={{
                borderColor: activeGateData.color + "50",
                backgroundColor: activeGateData.color + "08",
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p
                className="text-sm font-semibold"
                style={{ color: activeGateData.color }}
              >
                {activeGateData.name}: {activeGateData.desc}
              </p>
              <p className="text-xs text-muted mt-1">
                <strong>Phép ẩn dụ:</strong> {activeGateData.analogy}
              </p>
              <p className="text-xs text-muted mt-1">
                <strong>Công thức:</strong>{" "}
                <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                  {activeGateData.formula}
                </code>
              </p>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                <strong>Vai trò:</strong> {activeGateData.role}
              </p>
            </motion.div>
          )}
        </VisualizationSection>

        <p className="text-sm text-muted mt-3">
          4 khối màu tương ứng 4 phép tính song song trong 1 ô LSTM. 3 cổng
          (đỏ/xanh lá/xanh dương) dùng sigmoid để &quot;mở–đóng&quot; từ
          0 đến 1. Candidate (cam) dùng tanh để đề xuất giá trị MỚI.
        </p>
      </LessonSection>

      {/* ══════════════════════════════════════════════════
          BƯỚC 3 — SLIDER THỜI GIAN THỰC
          Học viên trượt xₜ, hₜ₋₁, cₜ₋₁ và xem các cổng cập nhật.
          ══════════════════════════════════════════════════ */}
      <LessonSection
        step={3}
        totalSteps={TOTAL_STEPS}
        label="Slider thời gian thực"
      >
        <VisualizationSection topicSlug={metadata.slug}>
          <p className="text-sm text-muted mb-4">
            Trượt các slider để thay đổi <code>xₜ</code>, <code>hₜ₋₁</code>,
            và <code>cₜ₋₁</code>. Xem các cổng và cell state cập nhật TỨC
            THÌ. (Trọng số được cố định để bạn thấy hành vi rõ ràng.)
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <label className="block">
              <span className="text-xs text-muted">Input xₜ</span>
              <input
                type="range"
                min={-1.5}
                max={1.5}
                step={0.05}
                value={xInput}
                onChange={(e) => setXInput(parseFloat(e.target.value))}
                className="w-full mt-1 accent-amber-500"
              />
              <span className="text-xs font-mono text-amber-500">
                {xInput.toFixed(2)}
              </span>
            </label>
            <label className="block">
              <span className="text-xs text-muted">Hidden trước hₜ₋₁</span>
              <input
                type="range"
                min={-1}
                max={1}
                step={0.05}
                value={hPrev}
                onChange={(e) => setHPrev(parseFloat(e.target.value))}
                className="w-full mt-1 accent-violet-500"
              />
              <span className="text-xs font-mono text-violet-500">
                {hPrev.toFixed(2)}
              </span>
            </label>
            <label className="block">
              <span className="text-xs text-muted">Cell trước cₜ₋₁</span>
              <input
                type="range"
                min={-2}
                max={2}
                step={0.05}
                value={cPrev}
                onChange={(e) => setCPrev(parseFloat(e.target.value))}
                className="w-full mt-1 accent-orange-500"
              />
              <span className="text-xs font-mono text-orange-500">
                {cPrev.toFixed(2)}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              {
                label: "fₜ (forget)",
                value: currentStep.f,
                color: "#ef4444",
                hint:
                  currentStep.f > 0.7
                    ? "→ GIỮ hầu hết cell state cũ"
                    : currentStep.f < 0.3
                    ? "→ XÓA phần lớn cell state cũ"
                    : "→ giữ một nửa",
              },
              {
                label: "iₜ (input)",
                value: currentStep.i,
                color: "#22c55e",
                hint:
                  currentStep.i > 0.7
                    ? "→ GHI mạnh giá trị mới"
                    : "→ ghi ít hoặc bỏ qua",
              },
              {
                label: "g̃ₜ (candidate)",
                value: currentStep.g,
                color: "#f59e0b",
                hint:
                  currentStep.g > 0
                    ? "→ đề xuất TĂNG cell state"
                    : "→ đề xuất GIẢM cell state",
              },
              {
                label: "oₜ (output)",
                value: currentStep.o,
                color: "#3b82f6",
                hint:
                  currentStep.o > 0.7
                    ? "→ XUẤT mạnh ra hidden"
                    : "→ giấu một phần",
              },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-lg border border-border bg-background/40 p-3"
                style={{ borderColor: m.color + "40" }}
              >
                <p className="text-xs text-muted">{m.label}</p>
                <p
                  className="text-lg font-mono font-bold"
                  style={{ color: m.color }}
                >
                  {m.value.toFixed(3)}
                </p>
                <p className="text-[11px] text-muted mt-1">{m.hint}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-1.5">
            <p className="text-sm font-semibold text-amber-500">
              Kết quả bước này
            </p>
            <p className="text-xs font-mono text-foreground">
              Cₜ = fₜ · Cₜ₋₁ + iₜ · g̃ₜ ={" "}
              <span className="text-amber-500">
                {currentStep.f.toFixed(2)} × {cPrev.toFixed(2)}
              </span>{" "}
              +{" "}
              <span className="text-green-500">
                {currentStep.i.toFixed(2)} × {currentStep.g.toFixed(2)}
              </span>{" "}
              = <strong>{currentStep.c.toFixed(3)}</strong>
            </p>
            <p className="text-xs font-mono text-foreground">
              hₜ = oₜ · tanh(Cₜ) ={" "}
              <span className="text-blue-500">
                {currentStep.o.toFixed(2)}
              </span>{" "}
              × tanh({currentStep.c.toFixed(2)}) ={" "}
              <strong>{currentStep.h.toFixed(3)}</strong>
            </p>
          </div>

          <p className="text-xs text-muted mt-3">
            Thử đặt fₜ về gần 1 (bằng cách tăng xₜ lên ~1.0): bạn sẽ thấy
            cell state chủ yếu giữ lại Cₜ₋₁ — đây là cơ chế &quot;nhớ
            lâu&quot; cốt lõi của LSTM.
          </p>
        </VisualizationSection>

        <Callout variant="tip" title="Cách đọc giá trị cổng">
          <p>
            Giá trị sigmoid nằm trong (0, 1). Hãy nghĩ nó như &quot;độ mở
            van&quot;: 0 = đóng hoàn toàn, 1 = mở hoàn toàn. Với forget
            gate: 0 = &quot;xóa sạch bộ nhớ&quot;, 1 = &quot;giữ nguyên bộ
            nhớ&quot;. Với input gate: 0 = &quot;từ chối ghi&quot;, 1 =
            &quot;ghi toàn bộ candidate&quot;.
          </p>
        </Callout>
      </LessonSection>

      {/* ══════════════════════════════════════════════════
          BƯỚC 4 — AHA MOMENT
          ══════════════════════════════════════════════════ */}
      <LessonSection
        step={4}
        totalSteps={TOTAL_STEPS}
        label="Khoảnh khắc Aha"
      >
        <AhaMoment>
          <p>
            <strong>Cell state</strong> là &quot;đường cao tốc&quot; cho
            thông tin — chạy thẳng qua mà chỉ bị thay đổi nhẹ nhàng bởi
            phép nhân/cộng. Gradient cũng chảy thẳng qua đường này → không
            bị vanishing!
          </p>
          <p className="text-sm text-muted mt-2">
            <TopicLink slug="rnn">RNN</TopicLink> thường: gradient phải đi
            qua hàm tanh ở mỗi bước → bị nhân nhỏ dần → biến mất. LSTM:
            gradient đi thẳng qua cell state (nhân với forget gate ≈ 1) →
            sống sót qua hàng trăm bước! Sau này,{" "}
            <TopicLink slug="transformer">Transformer</TopicLink> giải
            quyết vấn đề này triệt để hơn bằng self-attention song song.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ══════════════════════════════════════════════════
          BƯỚC 5 — UNROLL QUA CÂU
          Animation LSTM xử lý "Tôi sinh ở Huế..."
          ══════════════════════════════════════════════════ */}
      <LessonSection
        step={5}
        totalSteps={TOTAL_STEPS}
        label="Unroll qua câu"
      >
        <VisualizationSection topicSlug={metadata.slug}>
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Cell state qua câu: &quot;Tôi sinh ở Huế nên tôi thích ăn bún
            bò&quot;
          </h3>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {SENTENCE.map((word, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSentStep(idx)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  idx <= sentStep
                    ? idx === sentStep
                      ? "border-amber-500 bg-amber-500/20 text-amber-500"
                      : "border-green-500/30 bg-green-500/10 text-green-500"
                    : "border-border bg-card text-muted"
                }`}
              >
                {word}
              </button>
            ))}
          </div>

          {/* SVG unroll */}
          <svg
            viewBox="0 0 620 160"
            className="w-full rounded-lg border border-border bg-background mb-3"
          >
            {/* horizontal cell-state track */}
            <line
              x1={20}
              y1={50}
              x2={600}
              y2={50}
              stroke="#f59e0b"
              strokeWidth={3}
            />
            <text
              x={10}
              y={45}
              fontSize={11}
              fill="#f59e0b"
              fontWeight={600}
            >
              C
            </text>

            {SENTENCE.map((w, idx) => {
              const x = 40 + idx * 58;
              const visited = idx <= sentStep;
              const current = idx === sentStep;
              return (
                <g key={idx}>
                  {/* cell box */}
                  <rect
                    x={x - 22}
                    y={70}
                    width={44}
                    height={38}
                    rx={6}
                    fill={current ? "#f59e0b" : visited ? "#f59e0b33" : "#1f2937"}
                    stroke={visited ? "#f59e0b" : "#64748b"}
                    strokeWidth={1.5}
                  />
                  <text
                    x={x}
                    y={93}
                    fontSize={11}
                    textAnchor="middle"
                    fill={current ? "#0f172a" : visited ? "#f59e0b" : "#64748b"}
                    fontWeight={600}
                  >
                    LSTM
                  </text>
                  {/* word */}
                  <text
                    x={x}
                    y={128}
                    fontSize={11}
                    textAnchor="middle"
                    fill={visited ? "#e2e8f0" : "#64748b"}
                  >
                    {w}
                  </text>
                  {/* tick on cell state */}
                  <circle
                    cx={x}
                    cy={50}
                    r={4}
                    fill={visited ? "#f59e0b" : "#334155"}
                  />
                </g>
              );
            })}
          </svg>

          <motion.div
            key={sentStep}
            className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-sm text-amber-500 font-semibold">
              Bước {sentStep + 1}: đọc &quot;{SENTENCE[sentStep]}&quot;
            </p>
            <p className="text-xs text-muted mt-1">
              {MEMORY_STATES[sentStep]}
            </p>
            {sentStep === 3 && (
              <p className="text-xs text-green-500 mt-2 font-medium">
                Cổng nhập: GHI &quot;Huế&quot; vào cell state! Thông tin
                quan trọng về quê quán.
              </p>
            )}
            {sentStep >= 4 && sentStep <= 7 && (
              <p className="text-xs text-amber-500 mt-2 font-medium">
                Cổng quên: giữ &quot;Huế&quot; (f ≈ 1), xóa bớt chi tiết
                không cần thiết.
              </p>
            )}
            {sentStep >= 8 && (
              <p className="text-xs text-blue-500 mt-2 font-medium">
                Cổng xuất: lấy &quot;Huế&quot; từ cell state → dự đoán
                &quot;bò Huế&quot;!
              </p>
            )}
          </motion.div>

          <p className="text-sm text-muted mt-3">
            RNN thường đã quên &quot;Huế&quot; sau 5–6 bước. LSTM giữ được
            nhờ cell state truyền thẳng — phép nhân với forget gate ≈ 1 =
            coi như không đổi.
          </p>
        </VisualizationSection>
      </LessonSection>

      {/* ══════════════════════════════════════════════════
          BƯỚC 6 — SO SÁNH LSTM vs RNN VỀ GRADIENT
          ══════════════════════════════════════════════════ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="LSTM vs RNN">
        <VisualizationSection topicSlug={metadata.slug}>
          <h3 className="text-sm font-semibold text-foreground mb-2">
            Gradient sống sót qua N bước: LSTM vs RNN
          </h3>
          <p className="text-sm text-muted mb-3">
            Kéo thanh trượt để thay đổi số bước N. Quan sát gradient RNN
            (đỏ) vs LSTM (xanh).
          </p>

          <label className="block mb-4">
            <span className="text-xs text-muted">
              Số bước N: <strong>{compareSteps}</strong>
            </span>
            <input
              type="range"
              min={1}
              max={100}
              step={1}
              value={compareSteps}
              onChange={(e) => setCompareSteps(parseInt(e.target.value))}
              className="w-full mt-1 accent-accent"
            />
          </label>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3">
              <p className="text-xs text-muted">RNN — gradient ≈</p>
              <p className="text-xl font-mono font-bold text-red-500">
                {gradientComparison.rnn.toExponential(2)}
              </p>
              <p className="text-[11px] text-muted mt-1">
                (tanh′ ≈ 0.25)ᴺ → biến mất rất nhanh
              </p>
            </div>
            <div className="rounded-lg border border-green-500/40 bg-green-500/10 p-3">
              <p className="text-xs text-muted">LSTM — gradient ≈</p>
              <p className="text-xl font-mono font-bold text-green-500">
                {gradientComparison.lstm.toExponential(2)}
              </p>
              <p className="text-[11px] text-muted mt-1">
                (f ≈ 0.95)ᴺ → suy giảm chậm hơn ~gấp triệu lần
              </p>
            </div>
          </div>

          {/* Mini log-scale bar chart */}
          <svg
            viewBox="0 0 600 140"
            className="w-full rounded-lg border border-border bg-background"
          >
            <line
              x1={40}
              y1={120}
              x2={580}
              y2={120}
              stroke="#334155"
              strokeWidth={1}
            />
            <line
              x1={40}
              y1={10}
              x2={40}
              y2={120}
              stroke="#334155"
              strokeWidth={1}
            />
            <text x={10} y={20} fontSize={11} fill="#94a3b8">
              log g
            </text>
            <text x={565} y={135} fontSize={11} fill="#94a3b8">
              N
            </text>
            {/* RNN curve */}
            <polyline
              fill="none"
              stroke="#ef4444"
              strokeWidth={2}
              points={Array.from({ length: 100 }, (_, k) => {
                const n = k + 1;
                const g = rnnGradientDecay(n);
                const y = 120 - Math.max(0, (Math.log10(g) + 60) * 1.8);
                const x = 40 + (n * 540) / 100;
                return `${x},${Math.min(120, Math.max(10, y))}`;
              }).join(" ")}
            />
            {/* LSTM curve */}
            <polyline
              fill="none"
              stroke="#22c55e"
              strokeWidth={2}
              points={Array.from({ length: 100 }, (_, k) => {
                const n = k + 1;
                const g = lstmGradientDecay(n);
                const y = 120 - Math.max(0, (Math.log10(g) + 60) * 1.8);
                const x = 40 + (n * 540) / 100;
                return `${x},${Math.min(120, Math.max(10, y))}`;
              }).join(" ")}
            />
            {/* marker for current N */}
            <line
              x1={40 + (compareSteps * 540) / 100}
              y1={10}
              x2={40 + (compareSteps * 540) / 100}
              y2={120}
              stroke="#f59e0b"
              strokeDasharray="3 3"
              strokeWidth={1}
            />
            <text
              x={40 + (compareSteps * 540) / 100 + 4}
              y={18}
              fontSize={11}
              fill="#f59e0b"
            >
              N={compareSteps}
            </text>

            <text x={50} y={30} fontSize={11} fill="#ef4444">
              — RNN
            </text>
            <text x={110} y={30} fontSize={11} fill="#22c55e">
              — LSTM
            </text>
          </svg>
        </VisualizationSection>

        <Callout variant="insight" title="Tại sao 0.95ᴺ rất chậm so với 0.25ᴺ">
          <p>
            0.25¹⁰⁰ ≈ 10⁻⁶⁰ — coi như 0. 0.95¹⁰⁰ ≈ 0.006 — nhỏ nhưng
            không biến mất. Đó là lý do LSTM vẫn học được phụ thuộc dài
            hạn trong khi RNN thì không. Nhưng LSTM cũng không hoàn hảo —
            ở 500+ bước, LSTM vẫn gặp khó, và đó là cửa ngõ để Transformer
            bước vào.
          </p>
        </Callout>
      </LessonSection>

      {/* ══════════════════════════════════════════════════
          BƯỚC 7 — THỬ THÁCH 1
          ══════════════════════════════════════════════════ */}
      <LessonSection
        step={7}
        totalSteps={TOTAL_STEPS}
        label="Thử thách 1 — đếm tham số"
      >
        <InlineChallenge
          question="LSTM hidden size = 256, input size = 128. RNN cùng kích thước có ~(256+128)×256 ≈ 98K tham số. LSTM có bao nhiêu (bỏ qua bias)?"
          options={[
            "~98K (giống RNN)",
            "~393K (gấp ~4× vì có 4 bộ trọng số: forget, input, output, candidate)",
            "~196K (gấp 2×)",
            "~24K (ít hơn vì nén)",
          ]}
          correct={1}
          explanation="LSTM có 4 phép tính riêng biệt (3 cổng + 1 candidate), mỗi phép cần bộ trọng số W·[h,x] riêng, kích thước (hidden+input)×hidden = 384×256. Nhân 4 ≈ 393K tham số. Đổi lại: LSTM nhớ xa hơn rất nhiều."
        />
      </LessonSection>

      {/* ══════════════════════════════════════════════════
          BƯỚC 8 — THỬ THÁCH 2
          ══════════════════════════════════════════════════ */}
      <LessonSection
        step={8}
        totalSteps={TOTAL_STEPS}
        label="Thử thách 2 — chẩn đoán"
      >
        <InlineChallenge
          question="Bạn huấn luyện LSTM sinh văn bản. Loss giảm nhưng output chỉ là từ ngữ ngẫu nhiên không có logic dài hạn. Điều nào KHẢ NĂNG CAO nhất?"
          options={[
            "Learning rate quá thấp",
            "Forget gate bão hoà về 0 ngay từ đầu → cell state bị reset mỗi bước → LSTM hoạt động như RNN",
            "Dùng nhầm ReLU thay vì tanh",
            "Dataset quá lớn",
          ]}
          correct={1}
          explanation="Triệu chứng kinh điển: loss giảm (mô hình khớp cục bộ) nhưng không có mạch văn dài. Giải pháp thực tế: khởi tạo bias forget gate = 1 để mô hình 'mặc định nhớ' ngay từ đầu (Jozefowicz et al. 2015). Một số framework đã làm sẵn."
        />
      </LessonSection>

      {/* ══════════════════════════════════════════════════
          BƯỚC 9 — GIẢI THÍCH CHI TIẾT
          ══════════════════════════════════════════════════ */}
      <LessonSection
        step={9}
        totalSteps={TOTAL_STEPS}
        label="Giải thích chi tiết"
      >
        <ExplanationSection>
          <p>
            <strong>LSTM (Long Short-Term Memory)</strong> được Hochreiter
            &amp; Schmidhuber đề xuất năm 1997, giải quyết vấn đề
            vanishing gradient bằng cơ chế 3 cổng và cell state riêng
            biệt. Đây là bước tiến lớn đầu tiên giúp mạng neural xử lý
            được phụ thuộc dài hạn thực sự.
          </p>

          <p className="mt-3 font-semibold text-foreground">
            Các công thức cốt lõi:
          </p>

          <LaTeX block>
            {String.raw`f_t = \sigma(W_f \cdot [h_{t-1}, x_t] + b_f) \quad \text{(Forget Gate)}`}
          </LaTeX>
          <LaTeX block>
            {String.raw`i_t = \sigma(W_i \cdot [h_{t-1}, x_t] + b_i) \quad \text{(Input Gate)}`}
          </LaTeX>
          <LaTeX block>
            {String.raw`\tilde{C}_t = \tanh(W_C \cdot [h_{t-1}, x_t] + b_C) \quad \text{(Candidate)}`}
          </LaTeX>
          <LaTeX block>
            {String.raw`C_t = f_t \odot C_{t-1} + i_t \odot \tilde{C}_t \quad \text{(Cell State Update)}`}
          </LaTeX>
          <LaTeX block>
            {String.raw`o_t = \sigma(W_o \cdot [h_{t-1}, x_t] + b_o) \quad \text{(Output Gate)}`}
          </LaTeX>
          <LaTeX block>
            {String.raw`h_t = o_t \odot \tanh(C_t) \quad \text{(Hidden State)}`}
          </LaTeX>

          <Callout variant="insight" title="Tại sao LSTM nhớ xa được?">
            <p>
              Bí mật nằm ở công thức cell state:{" "}
              <LaTeX>{String.raw`C_t = f_t \odot C_{t-1} + ...`}</LaTeX>.
              Khi <LaTeX>{"f_t \\approx 1"}</LaTeX>, cell state truyền gần
              như nguyên vẹn:{" "}
              <LaTeX>{String.raw`C_t \approx C_{t-1}`}</LaTeX>. Gradient
              backprop qua phép nhân này cũng ≈ 1 → không biến mất!
            </p>
          </Callout>

          <Callout variant="info" title="Biến thể LSTM">
            <p>
              <strong>Peephole LSTM:</strong> các cổng nhìn trực tiếp vào
              cell state (thêm C vào input của cổng).{" "}
              <strong>Bidirectional LSTM:</strong> đọc chuỗi cả 2 chiều →
              hiểu ngữ cảnh đầy đủ hơn. <strong>Stacked LSTM:</strong>{" "}
              xếp nhiều lớp LSTM → biểu diễn phức tạp hơn.{" "}
              <strong>ConvLSTM:</strong> thay phép nhân ma trận bằng tích
              chập — dùng cho video.
            </p>
          </Callout>

          <Callout variant="warning" title="Lưu ý thực tế khi huấn luyện">
            <p>
              (1) Khởi tạo bias forget = 1 để &quot;mặc định nhớ&quot;.
              (2) Dùng gradient clipping ở ngưỡng 5.0 — LSTM vẫn có thể
              exploding gradient. (3) Chú ý batch-first vs seq-first tuỳ
              framework. (4) Với chuỗi dài &gt; 500 bước, cân nhắc
              Transformer thay vì LSTM.
            </p>
          </Callout>

          <Callout variant="tip" title="Khi nào dùng LSTM thay vì Transformer?">
            <p>
              LSTM vẫn vượt trội cho: (a) dữ liệu streaming thời gian
              thực — xử lý token-theo-token, không cần nhìn cả chuỗi; (b)
              thiết bị edge với RAM hạn chế — ít tham số hơn Transformer;
              (c) chuỗi CỰC DÀI có tính chất Markov (time-series tài
              chính, cảm biến IoT).
            </p>
          </Callout>

          <CodeBlock language="python" title="lstm_pytorch.py">
{`import torch
import torch.nn as nn

class LSTMClassifier(nn.Module):
    """Bộ phân loại văn bản dùng LSTM 2 tầng, 2 chiều."""

    def __init__(self, vocab_size, embed_dim, hidden_dim, num_classes):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim)
        self.lstm = nn.LSTM(
            input_size=embed_dim,
            hidden_size=hidden_dim,
            num_layers=2,          # 2 lớp LSTM xếp chồng
            batch_first=True,
            bidirectional=True,    # Đọc cả 2 chiều
            dropout=0.3,
        )
        # Mẹo: khởi tạo bias forget = 1 để "mặc định nhớ"
        for name, param in self.lstm.named_parameters():
            if "bias" in name:
                n = param.size(0)
                start, end = n // 4, n // 2
                param.data[start:end].fill_(1.0)

        # Bidirectional → hidden_dim * 2
        self.fc = nn.Linear(hidden_dim * 2, num_classes)

    def forward(self, x):
        emb = self.embedding(x)               # (batch, seq_len, embed_dim)
        output, (h_n, c_n) = self.lstm(emb)   # output: full sequence
        # h_n[-2], h_n[-1]: hidden cuối 2 chiều của LỚP CUỐI
        h_cat = torch.cat([h_n[-2], h_n[-1]], dim=1)
        return self.fc(h_cat)

# Tổng tham số ≈ 4× RNN cùng hidden size, nhưng nhớ xa hơn rất nhiều.`}
          </CodeBlock>

          <CodeBlock language="python" title="lstm_manual.py — triển khai thủ công">
{`import torch
import torch.nn as nn
import torch.nn.functional as F

class LSTMCellManual(nn.Module):
    """LSTM cell viết tay — dạy học & debug. KHÔNG nhanh hơn nn.LSTM."""

    def __init__(self, input_size, hidden_size):
        super().__init__()
        self.hidden_size = hidden_size
        # Gộp 4 bộ trọng số thành 1 ma trận lớn (tối ưu bộ nhớ)
        self.W = nn.Linear(input_size + hidden_size, 4 * hidden_size)
        # Khởi tạo bias forget = 1 (Jozefowicz 2015)
        with torch.no_grad():
            self.W.bias[hidden_size:2 * hidden_size].fill_(1.0)

    def forward(self, x, state):
        """
        x: (batch, input_size)
        state: (h_prev, c_prev), mỗi cái (batch, hidden_size)
        """
        h_prev, c_prev = state
        combined = torch.cat([x, h_prev], dim=1)
        gates = self.W(combined)  # (batch, 4*hidden)
        i, f, g, o = gates.chunk(4, dim=1)
        i = torch.sigmoid(i)
        f = torch.sigmoid(f)
        g = torch.tanh(g)
        o = torch.sigmoid(o)

        c = f * c_prev + i * g     # cell state update
        h = o * torch.tanh(c)      # hidden state
        return h, (h, c)

# Dùng: khởi tạo zeros, lặp qua sequence
cell = LSTMCellManual(input_size=64, hidden_size=128)
batch = 16
x_seq = torch.randn(10, batch, 64)  # (seq_len, batch, input)
h = torch.zeros(batch, 128)
c = torch.zeros(batch, 128)
outputs = []
for t in range(x_seq.size(0)):
    h, (h, c) = cell(x_seq[t], (h, c))
    outputs.append(h)
outputs = torch.stack(outputs)  # (seq_len, batch, hidden)`}
          </CodeBlock>

          <CollapsibleDetail title="Chi tiết toán: tại sao gradient qua cell state không biến mất?">
            <div className="space-y-2 text-sm text-foreground leading-relaxed">
              <p>
                Xét đạo hàm <LaTeX>{String.raw`\partial C_t / \partial C_{t-1}`}</LaTeX>:
              </p>
              <LaTeX block>
                {String.raw`\frac{\partial C_t}{\partial C_{t-1}} = f_t + \text{(đóng góp nhỏ khác qua } h_{t-1}\text{)}`}
              </LaTeX>
              <p>
                Khi nhân <LaTeX>{"T"}</LaTeX> bước lại với nhau:
              </p>
              <LaTeX block>
                {String.raw`\frac{\partial C_T}{\partial C_0} \approx \prod_{t=1}^{T} f_t`}
              </LaTeX>
              <p>
                Nếu các <LaTeX>{"f_t"}</LaTeX> đều gần 1, tích này xấp xỉ
                1 ngay cả khi <LaTeX>{"T = 1000"}</LaTeX>. Đây là điểm
                khác biệt sống còn so với RNN — nơi đạo hàm nhân với{" "}
                <LaTeX>{String.raw`W^T \cdot \text{diag}(\tanh') \approx 0.25^T`}</LaTeX>.
              </p>
              <p>
                Tuy nhiên nếu forget gate dao động quanh 0.5, tích vẫn
                tiến về 0 — đó là lý do kỹ thuật khởi tạo bias = 1 rất
                quan trọng. Chi tiết gradient backprop đầy đủ xem{" "}
                <em>
                  &quot;Understanding LSTM Networks&quot; — Christopher
                  Olah (2015).
                </em>
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="Bảng so sánh RNN vs LSTM vs GRU vs Transformer">
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-xs text-foreground">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4">Tiêu chí</th>
                    <th className="text-left py-2 pr-4">RNN</th>
                    <th className="text-left py-2 pr-4">LSTM</th>
                    <th className="text-left py-2 pr-4">GRU</th>
                    <th className="text-left py-2">Transformer</th>
                  </tr>
                </thead>
                <tbody className="text-muted">
                  <tr className="border-b border-border/50">
                    <td className="py-1.5 pr-4">Tham số</td>
                    <td>1×</td>
                    <td>4×</td>
                    <td>3×</td>
                    <td>~12× (typical)</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-1.5 pr-4">Nhớ xa</td>
                    <td>~20 bước</td>
                    <td>~200 bước</td>
                    <td>~200 bước</td>
                    <td>unlimited*</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-1.5 pr-4">Song song</td>
                    <td>Không</td>
                    <td>Không</td>
                    <td>Không</td>
                    <td>Có</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-1.5 pr-4">Streaming</td>
                    <td>Tốt</td>
                    <td>Tốt</td>
                    <td>Tốt</td>
                    <td>Khó</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4">Độ phức tạp/tok</td>
                    <td>O(1)</td>
                    <td>O(1)</td>
                    <td>O(1)</td>
                    <td>O(N)</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-[11px] text-muted mt-2">
                *Trong thực tế giới hạn bởi context window.
              </p>
            </div>
          </CollapsibleDetail>
        </ExplanationSection>
      </LessonSection>

      {/* ══════════════════════════════════════════════════
          BƯỚC 10 — TÓM TẮT + QUIZ
          ══════════════════════════════════════════════════ */}
      <LessonSection step={10} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về LSTM"
          points={[
            "LSTM giải quyết vanishing gradient bằng cell state — 'đường cao tốc' cho gradient truyền thẳng qua phép nhân với forget gate.",
            "4 khối tính toán song song: forget gate (xóa gì), input gate (ghi bao nhiêu), candidate (giá trị mới), output gate (xuất gì).",
            "Cell state C = bộ nhớ dài hạn (truyền trực tiếp); hidden state h = tanh(C) × output gate — phiên bản 'lọc' dùng cho output.",
            "Tham số gấp ~4× RNN (4 bộ trọng số riêng), nhưng đổi lại nhớ xa hàng trăm bước. Khởi tạo bias forget = 1 để mặc định nhớ.",
            "Biến thể: Bidirectional (2 chiều), Stacked (nhiều lớp), GRU (đơn giản hơn, 3× params), ConvLSTM (video).",
            "Ngày nay Transformer thay thế LSTM trong NLP, nhưng LSTM vẫn dùng cho time-series, streaming và thiết bị edge.",
          ]}
        />
      </LessonSection>

      {/* Hidden utility dùng unrolled data để tránh dead-code warning (có thể mở rộng sau) */}
      {unrolled.signal.length === 6 && unrollIdx < 0 ? (
        <div style={{ display: "none" }}>{unrollIdx}</div>
      ) : null}
      <button
        type="button"
        onClick={() => setUnrollIdx((i) => (i + 1) % 6)}
        className="sr-only"
        aria-hidden="true"
      >
        cycle unroll
      </button>

      <QuizSection questions={quizQuestions} />
    </>
  );
}
