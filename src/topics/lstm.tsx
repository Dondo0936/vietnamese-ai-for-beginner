"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
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
  slug: "lstm",
  title: "Long Short-Term Memory",
  titleVi: "Bộ nhớ dài-ngắn hạn",
  description: "Biến thể RNN với cơ chế cổng giúp nhớ thông tin dài hạn hiệu quả",
  category: "dl-architectures",
  tags: ["sequence", "nlp", "rnn"],
  difficulty: "advanced",
  relatedSlugs: ["rnn", "gru", "transformer"],
  vizType: "interactive",
};

/* ── Constants ── */
const GATES = [
  { id: "forget", name: "Cổng quên", nameEn: "Forget Gate", color: "#ef4444", symbol: "\u00D7",
    desc: "Quyết định XÓA thông tin nào trong bộ nhớ cũ", formula: "fₜ = σ(Wf·[hₜ₋₁, xₜ] + bf)",
    analogy: "Tẩy phần ghi chú cũ không còn cần" },
  { id: "input", name: "Cổng nhập", nameEn: "Input Gate", color: "#22c55e", symbol: "+",
    desc: "Quyết định GHI thông tin mới nào vào bộ nhớ", formula: "iₜ = σ(Wi·[hₜ₋₁, xₜ] + bi)",
    analogy: "Viết thông tin mới quan trọng vào vở" },
  { id: "output", name: "Cổng xuất", nameEn: "Output Gate", color: "#3b82f6", symbol: "\u00D7",
    desc: "Quyết định XUẤT phần nào của bộ nhớ làm output", formula: "oₜ = σ(Wo·[hₜ₋₁, xₜ] + bo)",
    analogy: "Chọn phần nào trong vở để trả lời câu hỏi" },
];

const SENTENCE = ["Tôi", "sinh", "ở", "Huế", "nên", "tôi", "thích", "ăn", "bún", "bò"];
const MEMORY_STATES = [
  "Cell: []",
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

const quizQuestions: QuizQuestion[] = [
  {
    question: "LSTM có 3 cổng. Cổng nào cho phép 'nhớ' thông tin qua hàng trăm bước?",
    options: [
      "Cổng xuất (Output Gate) — vì nó tạo output",
      "Cổng quên (Forget Gate) — khi f ≈ 1, thông tin truyền thẳng qua cell state",
      "Cổng nhập (Input Gate) — vì nó thêm thông tin mới",
      "Không cổng nào — LSTM vẫn bị vanishing gradient",
    ],
    correct: 1,
    explanation: "Khi Forget Gate output gần 1, cell state truyền thẳng qua (nhân với ~1 = giữ nguyên). Gradient cũng truyền thẳng qua phép nhân này → không bị biến mất. Đây là 'đường cao tốc' cho gradient!",
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
    explanation: "Cell state (C) là 'băng chuyền' bộ nhớ dài hạn, chỉ bị thay đổi bởi phép nhân/cộng nhẹ nhàng. Hidden state (h) = tanh(C) × output gate — là phiên bản 'lọc' của cell state, dùng cho output và truyền sang bước tiếp.",
  },
  {
    question: "LSTM có khoảng bao nhiêu tham số so với RNN thông thường (cùng hidden size)?",
    options: [
      "Bằng nhau",
      "Gấp ~4 lần (vì có 3 cổng + 1 candidate, mỗi cái cần bộ trọng số riêng)",
      "Gấp ~2 lần",
      "Ít hơn (vì hiệu quả hơn)",
    ],
    correct: 1,
    explanation: "RNN có 1 bộ trọng số (W·[h,x]). LSTM có 4 bộ: forget gate, input gate, output gate, và candidate cell state. Mỗi bộ cùng kích thước → ~4× tham số. Hidden size 256: RNN ~130K, LSTM ~525K tham số.",
  },
  {
    type: "fill-blank",
    question: "LSTM có 3 cổng sigmoid: cổng {blank} quyết định xóa thông tin khỏi cell state, cổng {blank} quyết định ghi thông tin mới vào, và cổng {blank} quyết định phần nào của bộ nhớ sẽ xuất ra làm hidden state.",
    blanks: [
      { answer: "forget", accept: ["quên", "forget gate"] },
      { answer: "input", accept: ["nhập", "input gate"] },
      { answer: "output", accept: ["xuất", "output gate"] },
    ],
    explanation: "Forget gate (fₜ) nhân với C_{t-1} để quyết định giữ/xóa. Input gate (iₜ) nhân với candidate C̃ₜ để quyết định ghi gì. Output gate (oₜ) nhân với tanh(Cₜ) để tạo hidden state hₜ.",
  },
];

/* ── Component ── */
export default function LstmTopic() {
  const [activeGate, setActiveGate] = useState<string | null>(null);
  const [sentStep, setSentStep] = useState(0);

  const toggleGate = useCallback((id: string) => {
    setActiveGate((prev) => (prev === id ? null : id));
  }, []);

  const activeGateData = GATES.find((g) => g.id === activeGate);
  const TOTAL_STEPS = 8;

  return (
    <>
      {/* ═══ Step 1: HOOK ═══ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question={`Câu: "Tôi sinh ở Huế, học ở Sài Gòn, làm việc ở Hà Nội, nên tôi thích ăn bún bò ___". Từ cuối liên quan đến từ nào cách xa 15 từ? RNN thường nhớ nổi chuỗi bao dài?`}
          options={[
            "RNN nhớ tốt 100+ từ — không cần cải tiến",
            "RNN chỉ nhớ tốt ~10-20 từ gần nhất, cần cơ chế đặc biệt để nhớ xa hơn",
            "RNN không nhớ được gì cả",
          ]}
          correct={1}
          explanation={`Đúng! RNN bị vanishing gradient → quên thông tin xa. "Huế" cách "___" 15 từ, RNN gần như quên mất. LSTM giải quyết bằng cách thêm "bộ nhớ dài hạn" (cell state) — một đường truyền thẳng cho gradient không bị suy giảm.`}
        />
      </LessonSection>

      {/* ═══ Step 2: DISCOVER — Interactive LSTM Cell ═══ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá ô LSTM">
        <p className="text-sm text-foreground leading-relaxed mb-3">
          Hãy tưởng tượng bạn đang ghi chép trong lớp học với{" "}
          <strong>cuốn vở</strong>{" "}
          (cell state — bộ nhớ dài hạn). Tại mỗi thời điểm, bạn cần 3 quyết định: <strong>tẩy</strong>{" "}
          (cổng quên), <strong>viết</strong>{" "}
          (cổng nhập), <strong>đọc</strong>{" "}
          (cổng xuất).
        </p>

        <VisualizationSection topicSlug={metadata.slug}>
          <p className="text-sm text-muted mb-3">
            Nhấn vào từng cổng để xem chức năng chi tiết.
          </p>

          <svg viewBox="0 0 500 300" className="w-full rounded-lg border border-border bg-background">
            {/* Cell state highway */}
            <line x1={30} y1={55} x2={470} y2={55} stroke="#f59e0b" strokeWidth={3.5} />
            <text x={250} y={35} fontSize={11} fill="#f59e0b" textAnchor="middle" fontWeight={700}>
              Cell State C (Bộ nhớ dài hạn — &quot;cuốn vở&quot;)
            </text>
            <polygon points="470,55 462,49 462,61" fill="#f59e0b" />
            <text x={22} y={60} fontSize={9} fill="#f59e0b" fontWeight={500}>Cₜ₋₁</text>
            <text x={478} y={60} fontSize={9} fill="#f59e0b" fontWeight={500}>Cₜ</text>

            {/* Hidden state line */}
            <line x1={30} y1={230} x2={470} y2={230} stroke="#8b5cf6" strokeWidth={2.5} />
            <text x={250} y={270} fontSize={11} fill="#8b5cf6" textAnchor="middle" fontWeight={600}>
              Hidden State h (Trạng thái ẩn — &quot;câu trả lời&quot;)
            </text>
            <polygon points="470,230 462,225 462,235" fill="#8b5cf6" />

            {/* Gates */}
            {GATES.map((gate, i) => {
              const x = 100 + i * 135;
              const isActive = activeGate === gate.id;

              return (
                <g key={gate.id} className="cursor-pointer" onClick={() => toggleGate(gate.id)}>
                  {/* Gate box */}
                  <motion.rect
                    x={x - 45} y={95} width={90} height={75} rx={12}
                    fill={gate.color} opacity={isActive ? 0.35 : 0.08}
                    stroke={gate.color} strokeWidth={isActive ? 3 : 1.5}
                    animate={isActive ? { scale: 1.02 } : { scale: 1 }}
                  />
                  <text x={x} y={117} fontSize={12} fill={gate.color} textAnchor="middle" fontWeight={700}>
                    {gate.name}
                  </text>
                  <text x={x} y={133} fontSize={9} fill={gate.color} textAnchor="middle" opacity={0.8}>
                    {gate.nameEn}
                  </text>
                  <text x={x} y={155} fontSize={18} fill={gate.color} textAnchor="middle" fontWeight={700}>
                    &sigma;
                  </text>

                  {/* Connection to cell state */}
                  <line x1={x} y1={95} x2={x} y2={62}
                    stroke={gate.color} strokeWidth={isActive ? 2.5 : 1.5}
                    strokeDasharray={isActive ? "0" : "5 3"} opacity={isActive ? 1 : 0.4} />

                  {/* Connection from hidden state */}
                  <line x1={x} y1={170} x2={x} y2={224}
                    stroke={gate.color} strokeWidth={isActive ? 2.5 : 1.5}
                    strokeDasharray={isActive ? "0" : "5 3"} opacity={isActive ? 1 : 0.4} />

                  {/* Operation symbol on cell state */}
                  <circle cx={x} cy={55} r={11} fill="#0f172a" stroke={gate.color} strokeWidth={2} />
                  <text x={x} y={60} fontSize={15} fill={gate.color} textAnchor="middle" fontWeight={700}>
                    {gate.symbol}
                  </text>
                </g>
              );
            })}

            {/* Input label */}
            <text x={50} y={295} fontSize={10} fill="currentColor" className="text-muted" textAnchor="middle">
              xₜ (Input)
            </text>
            <line x1={50} y1={282} x2={50} y2={238} stroke="#888" strokeWidth={1} />
          </svg>

          {/* Gate detail panel */}
          {activeGateData && (
            <motion.div
              key={activeGateData.id}
              className="mt-3 rounded-xl border p-4"
              style={{ borderColor: activeGateData.color + "50", backgroundColor: activeGateData.color + "08" }}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-sm font-semibold" style={{ color: activeGateData.color }}>
                {activeGateData.name}: {activeGateData.desc}
              </p>
              <p className="text-xs text-muted mt-1">
                Phép ẩn dụ: {activeGateData.analogy}
              </p>
              <p className="text-xs text-muted mt-1">
                Công thức: <code className="text-xs bg-surface px-1.5 py-0.5 rounded">{activeGateData.formula}</code>
              </p>
            </motion.div>
          )}
        </VisualizationSection>

        <p className="text-sm text-muted mt-3">
          Bạn vừa thấy 3 cổng kiểm soát luồng thông tin vào/ra bộ nhớ. Nhưng điều kỳ diệu thật sự nằm ở cell state — hãy xem nó hoạt động trên câu dài...
        </p>
      </LessonSection>

      {/* ═══ Step 3: AHA MOMENT ═══ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>Cell state</strong>{" "}
            là &quot;đường cao tốc&quot; cho thông tin — chạy thẳng qua mà chỉ bị thay đổi nhẹ nhàng bởi phép nhân/cộng. Gradient cũng chảy thẳng qua đường này → không bị vanishing!
          </p>
          <p className="text-sm text-muted mt-1">
            <TopicLink slug="rnn">RNN</TopicLink>{" "}
            thường: gradient phải đi qua hàm tanh ở mỗi bước → bị nhân nhỏ dần → biến mất.{" "}
            LSTM: gradient đi thẳng qua cell state (nhân với forget gate ≈ 1) → sống sót qua hàng trăm bước!{" "}
            Sau này,{" "}
            <TopicLink slug="transformer">Transformer</TopicLink>{" "}
            giải quyết vấn đề này triệt để bằng self-attention song song.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ═══ Step 4: DEEPEN — Cell state tracking ═══ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Theo dõi bộ nhớ">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Cell state qua câu: &quot;Tôi sinh ở Huế nên tôi thích ăn bún bò&quot;
          </h3>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {SENTENCE.map((word, i) => (
              <button key={i} type="button" onClick={() => setSentStep(i)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  i <= sentStep
                    ? i === sentStep
                      ? "border-amber-500 bg-amber-500/20 text-amber-500"
                      : "border-green-500/30 bg-green-500/10 text-green-500"
                    : "border-border bg-card text-muted"
                }`}>
                {word}
              </button>
            ))}
          </div>

          <motion.div
            key={sentStep}
            className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-sm text-amber-500 font-semibold">
              Bước {sentStep + 1}: đọc &quot;{SENTENCE[sentStep]}&quot;
            </p>
            <p className="text-xs text-muted mt-1">{MEMORY_STATES[sentStep]}</p>
            {sentStep === 3 && (
              <p className="text-xs text-green-500 mt-2 font-medium">
                Cổng nhập: GHI &quot;Huế&quot; vào cell state! Thông tin quan trọng về quê quán.
              </p>
            )}
            {sentStep >= 4 && sentStep <= 7 && (
              <p className="text-xs text-amber-500 mt-2 font-medium">
                Cổng quên: giữ &quot;Huế&quot; (f ≈ 1), xóa bớt chi tiết không cần thiết.
              </p>
            )}
            {sentStep >= 8 && (
              <p className="text-xs text-blue-500 mt-2 font-medium">
                Cổng xuất: lấy &quot;Huế&quot; từ cell state → dự đoán &quot;bò Huế&quot;!
              </p>
            )}
          </motion.div>

          <p className="text-sm text-muted mt-3">
            RNN thường đã quên &quot;Huế&quot; sau 5-6 bước. LSTM giữ được nhờ cell state truyền thẳng!
          </p>
      </LessonSection>

      {/* ═══ Step 5: CHALLENGE ═══ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="LSTM hidden size = 256. RNN cùng kích thước có ~130K tham số. LSTM có bao nhiêu?"
          options={[
            "~130K (giống RNN vì cùng hidden size)",
            "~525K (gấp ~4× vì có 4 bộ trọng số: forget, input, output, candidate)",
            "~260K (gấp 2× vì thêm cell state)",
          ]}
          correct={1}
          explanation="LSTM có 4 phép tính riêng biệt (3 cổng + 1 candidate), mỗi phép cần bộ trọng số W và bias riêng. Nên tổng tham số ≈ 4× RNN. Đổi lại: LSTM nhớ xa hơn rất nhiều!"
        />
      </LessonSection>

      {/* ═══ Step 6: EXPLAIN ═══ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích chi tiết">
        <ExplanationSection>
          <p>
            <strong>LSTM (Long Short-Term Memory)</strong>{" "}
            được Hochreiter & Schmidhuber đề xuất năm 1997, giải quyết vấn đề vanishing gradient bằng cơ chế 3 cổng và cell state riêng biệt.
          </p>

          <p className="mt-3 font-semibold text-foreground">Các công thức cốt lõi:</p>

          <LaTeX block>{String.raw`f_t = \sigma(W_f \cdot [h_{t-1}, x_t] + b_f) \quad \text{(Forget Gate)}`}</LaTeX>
          <LaTeX block>{String.raw`i_t = \sigma(W_i \cdot [h_{t-1}, x_t] + b_i) \quad \text{(Input Gate)}`}</LaTeX>
          <LaTeX block>{String.raw`\tilde{C}_t = \tanh(W_C \cdot [h_{t-1}, x_t] + b_C) \quad \text{(Candidate)}`}</LaTeX>
          <LaTeX block>{String.raw`C_t = f_t \odot C_{t-1} + i_t \odot \tilde{C}_t \quad \text{(Cell State Update)}`}</LaTeX>
          <LaTeX block>{String.raw`o_t = \sigma(W_o \cdot [h_{t-1}, x_t] + b_o) \quad \text{(Output Gate)}`}</LaTeX>
          <LaTeX block>{String.raw`h_t = o_t \odot \tanh(C_t) \quad \text{(Hidden State)}`}</LaTeX>

          <Callout variant="insight" title="Tại sao LSTM nhớ xa được?">
            <p>
              Bí mật nằm ở công thức cell state:{" "}
              <LaTeX>{String.raw`C_t = f_t \odot C_{t-1} + ...`}</LaTeX>. Khi <LaTeX>{"f_t \\approx 1"}</LaTeX>, cell state truyền gần như nguyên vẹn:{" "}
              <LaTeX>{String.raw`C_t \approx C_{t-1}`}</LaTeX>. Gradient backprop qua phép nhân này cũng ≈ 1 → không biến mất!
            </p>
          </Callout>

          <Callout variant="info" title="Biến thể LSTM">
            <p>
              <strong>Peephole LSTM:</strong>{" "}
              các cổng nhìn trực tiếp vào cell state (thêm C vào input của cổng).{" "}
              <strong>Bidirectional LSTM:</strong>{" "}
              đọc chuỗi cả 2 chiều → hiểu ngữ cảnh đầy đủ hơn.{" "}
              <strong>Stacked LSTM:</strong>{" "}
              xếp nhiều lớp LSTM → biểu diễn phức tạp hơn.
            </p>
          </Callout>

          <CodeBlock language="python" title="lstm_pytorch.py">
{`import torch
import torch.nn as nn

class LSTMClassifier(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim, num_classes):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim)
        self.lstm = nn.LSTM(
            input_size=embed_dim,
            hidden_size=hidden_dim,
            num_layers=2,          # 2 lớp LSTM xếp chồng
            batch_first=True,
            bidirectional=True,     # Đọc cả 2 chiều
            dropout=0.3,
        )
        # Bidirectional → hidden_dim * 2
        self.fc = nn.Linear(hidden_dim * 2, num_classes)

    def forward(self, x):
        emb = self.embedding(x)           # (batch, seq_len, embed_dim)
        output, (h_n, c_n) = self.lstm(emb)
        # h_n: hidden state cuối, c_n: cell state cuối
        # Lấy hidden state cuối cùng từ 2 chiều
        h_cat = torch.cat([h_n[-2], h_n[-1]], dim=1)
        return self.fc(h_cat)

# Tổng tham số: ~4× RNN cùng hidden size
# Nhưng nhớ xa hơn rất nhiều!`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      {/* ═══ Step 7: SUMMARY ═══ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về LSTM"
          points={[
            "LSTM giải quyết vanishing gradient bằng cell state — 'đường cao tốc' cho gradient truyền thẳng qua.",
            "3 cổng sigmoid (forget, input, output) kiểm soát luồng thông tin: xóa gì, ghi gì, xuất gì.",
            "Cell state = bộ nhớ dài hạn (truyền trực tiếp). Hidden state = output ngắn hạn (qua cổng xuất).",
            "Tham số gấp ~4× RNN (4 bộ trọng số riêng), nhưng đổi lại nhớ xa hàng trăm bước.",
            "Ngày nay Transformer thay thế LSTM trong NLP, nhưng LSTM vẫn dùng cho time-series và streaming data.",
          ]}
        />
      </LessonSection>

      {/* ═══ Step 8: QUIZ ═══ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
