"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX,
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
  description: "Phiên bản đơn giản hóa của LSTM với 2 cổng thay vì 3, hiệu quả tương đương",
  category: "dl-architectures",
  tags: ["sequence", "nlp", "rnn"],
  difficulty: "advanced",
  relatedSlugs: ["lstm", "rnn", "transformer"],
  vizType: "interactive",
};

/* ── Constants ── */
interface CompareRow {
  feature: string;
  lstm: string;
  gru: string;
  winner: "lstm" | "gru" | "tie";
}

const COMPARE: CompareRow[] = [
  { feature: "Số cổng", lstm: "3 (forget, input, output)", gru: "2 (reset, update)", winner: "gru" },
  { feature: "Trạng thái", lstm: "Cell state + hidden state", gru: "Chỉ hidden state", winner: "gru" },
  { feature: "Tham số", lstm: "~4× RNN", gru: "~3× RNN (ít hơn ~25%)", winner: "gru" },
  { feature: "Tốc độ train", lstm: "Chậm hơn", gru: "Nhanh hơn ~15-20%", winner: "gru" },
  { feature: "Nhớ xa", lstm: "Tốt hơn nhẹ (cell state riêng)", gru: "Tốt (nhưng hơi kém LSTM)", winner: "lstm" },
  { feature: "Dataset lớn", lstm: "Thường tốt hơn nhẹ", gru: "Tương đương", winner: "tie" },
];

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
    explanation: "Update gate zₜ kiểm soát tỷ lệ trộn: hₜ = zₜ × hₜ₋₁ + (1-zₜ) × h̃ₜ. Khi zₜ→1: giữ nguyên cũ (= forget gate). Khi zₜ→0: lấy hoàn toàn mới (= input gate). Một cổng, hai vai trò!",
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
    explanation: "GRU có ít tham số hơn ~25% → ít overfitting trên dataset nhỏ và train nhanh hơn. Trên dataset lớn, LSTM thường ngang hoặc hơn nhẹ nhờ cell state riêng biệt.",
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
    explanation: "h̃ₜ = tanh(W·[rₜ ⊙ hₜ₋₁, xₜ]). Khi rₜ→0: bỏ qua quá khứ, candidate chỉ dựa vào input hiện tại ('quên sạch rồi nhìn mới'). Khi rₜ→1: dùng đầy đủ quá khứ.",
  },
];

/* ── Component ── */
export default function GruTopic() {
  const [activeGate, setActiveGate] = useState<"reset" | "update" | null>(null);
  const [showCompare, setShowCompare] = useState(false);

  const toggleGate = useCallback((gate: "reset" | "update") => {
    setActiveGate((prev) => (prev === gate ? null : gate));
  }, []);

  const TOTAL_STEPS = 8;

  return (
    <>
      {/* ═══ Step 1: HOOK ═══ */}
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

      {/* ═══ Step 2: DISCOVER — Interactive GRU Cell ═══ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá ô GRU">
        <p className="text-sm text-foreground leading-relaxed mb-3">
          Nếu LSTM là chiếc xe máy Honda Wave đầy đủ tính năng, thì GRU là chiếc{" "}
          <strong>Wave Alpha</strong>{" "}
          — bỏ bớt vài tính năng ít dùng, nhẹ hơn, tiết kiệm xăng hơn, mà đi vẫn tốt.
        </p>

        <VisualizationSection topicSlug={metadata.slug}>
          <p className="text-sm text-muted mb-3">
            Nhấn vào cổng để xem chi tiết. So sánh: LSTM 3 cổng + cell state riêng, GRU chỉ 2 cổng.
          </p>

          <svg viewBox="0 0 500 290" className="w-full rounded-lg border border-border bg-background">
            {/* Hidden state line (no separate cell state!) */}
            <line x1={30} y1={80} x2={470} y2={80} stroke="#8b5cf6" strokeWidth={3.5} />
            <polygon points="470,80 462,74 462,86" fill="#8b5cf6" />
            <text x={250} y={30} fontSize={12} fill="#8b5cf6" textAnchor="middle" fontWeight={700}>
              Hidden State hₜ (GRU gộp cell state vào đây!)
            </text>
            <text x={22} y={85} fontSize={9} fill="#8b5cf6" fontWeight={500}>hₜ₋₁</text>
            <text x={478} y={85} fontSize={9} fill="#8b5cf6" fontWeight={500}>hₜ</text>

            {/* Note: no cell state */}
            <text x={250} y={52} fontSize={9} fill="#f59e0b" textAnchor="middle" fontWeight={500} opacity={0.7}>
              Không có cell state riêng — đơn giản hơn LSTM!
            </text>

            {/* Reset Gate */}
            <g className="cursor-pointer" onClick={() => toggleGate("reset")}>
              <motion.rect x={60} y={115} width={150} height={75} rx={14}
                fill="#ef4444" opacity={activeGate === "reset" ? 0.35 : 0.08}
                stroke="#ef4444" strokeWidth={activeGate === "reset" ? 3 : 1.5}
                animate={activeGate === "reset" ? { scale: 1.02 } : { scale: 1 }} />
              <text x={135} y={140} fontSize={13} fill="#ef4444" textAnchor="middle" fontWeight={700}>
                Cổng đặt lại
              </text>
              <text x={135} y={157} fontSize={10} fill="#ef4444" textAnchor="middle" opacity={0.8}>
                Reset Gate (rₜ)
              </text>
              <text x={135} y={178} fontSize={9} fill="#ef4444" textAnchor="middle">
                &sigma;(Wᵣ&middot;[hₜ₋₁, xₜ])
              </text>
              <line x1={135} y1={115} x2={135} y2={88}
                stroke="#ef4444" strokeWidth={activeGate === "reset" ? 2.5 : 1.5}
                strokeDasharray={activeGate === "reset" ? "0" : "5 3"} opacity={activeGate === "reset" ? 1 : 0.4} />
              <circle cx={135} cy={80} r={11} fill="#0f172a" stroke="#ef4444" strokeWidth={2} />
              <text x={135} y={85} fontSize={15} fill="#ef4444" textAnchor="middle" fontWeight={700}>&times;</text>
            </g>

            {/* Update Gate */}
            <g className="cursor-pointer" onClick={() => toggleGate("update")}>
              <motion.rect x={280} y={115} width={150} height={75} rx={14}
                fill="#22c55e" opacity={activeGate === "update" ? 0.35 : 0.08}
                stroke="#22c55e" strokeWidth={activeGate === "update" ? 3 : 1.5}
                animate={activeGate === "update" ? { scale: 1.02 } : { scale: 1 }} />
              <text x={355} y={140} fontSize={13} fill="#22c55e" textAnchor="middle" fontWeight={700}>
                Cổng cập nhật
              </text>
              <text x={355} y={157} fontSize={10} fill="#22c55e" textAnchor="middle" opacity={0.8}>
                Update Gate (zₜ)
              </text>
              <text x={355} y={178} fontSize={9} fill="#22c55e" textAnchor="middle">
                &sigma;(Wᵤ&middot;[hₜ₋₁, xₜ])
              </text>
              <line x1={355} y1={115} x2={355} y2={88}
                stroke="#22c55e" strokeWidth={activeGate === "update" ? 2.5 : 1.5}
                strokeDasharray={activeGate === "update" ? "0" : "5 3"} opacity={activeGate === "update" ? 1 : 0.4} />
              <circle cx={355} cy={80} r={11} fill="#0f172a" stroke="#22c55e" strokeWidth={2} />
              <text x={355} y={85} fontSize={15} fill="#22c55e" textAnchor="middle" fontWeight={700}>+</text>
            </g>

            {/* Input */}
            <line x1={250} y1={262} x2={250} y2={230} stroke="#888" strokeWidth={1} />
            <text x={250} y={278} fontSize={10} fill="currentColor" className="text-muted" textAnchor="middle">
              xₜ (Input)
            </text>

            {/* Gate detail */}
            {activeGate && (
              <g>
                <rect x={60} y={206} width={380} height={24} rx={6}
                  fill={activeGate === "reset" ? "#ef4444" : "#22c55e"} opacity={0.1}
                  stroke={activeGate === "reset" ? "#ef4444" : "#22c55e"} strokeWidth={1} />
                <text x={250} y={222} fontSize={10}
                  fill={activeGate === "reset" ? "#ef4444" : "#22c55e"}
                  textAnchor="middle" fontWeight={600}>
                  {activeGate === "reset"
                    ? "Kiểm soát bao nhiêu hₜ₋₁ dùng để tính trạng thái ứng viên h̃ₜ"
                    : "Trộn hₜ₋₁ cũ và h̃ₜ mới: hₜ = zₜ × hₜ₋₁ + (1-zₜ) × h̃ₜ"}
                </text>
              </g>
            )}
          </svg>
        </VisualizationSection>

        <p className="text-sm text-muted mt-3">
          Chỉ 2 cổng thay vì 3 — nhưng cổng update kiêm luôn vai trò forget và input. Hãy xem so sánh chi tiết LSTM vs GRU...
        </p>
      </LessonSection>

      {/* ═══ Step 3: AHA MOMENT ═══ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Cổng <strong>update</strong>{" "}
            là phát minh thông minh nhất của GRU: <LaTeX>{String.raw`h_t = z_t \odot h_{t-1} + (1 - z_t) \odot \tilde{h}_t`}</LaTeX>. Khi <LaTeX>{"z_t \\to 1"}</LaTeX>: giữ nguyên cũ (forget). Khi <LaTeX>{"z_t \\to 0"}</LaTeX>: lấy hoàn toàn mới (input). Một cổng, hai vai trò!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ═══ Step 4: DEEPEN — LSTM vs GRU ═══ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="So sánh LSTM vs GRU">
          <button type="button" onClick={() => setShowCompare(!showCompare)}
            className="rounded-lg border border-accent bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-white mb-4">
            {showCompare ? "Ẩn bảng so sánh" : "Xem bảng so sánh chi tiết"}
          </button>

          {showCompare && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              className="overflow-x-auto"
            >
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-2 text-muted border-b border-border">Tiêu chí</th>
                    <th className="text-left p-2 text-blue-500 border-b border-border">LSTM</th>
                    <th className="text-left p-2 text-green-500 border-b border-border">GRU</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE.map((row, i) => (
                    <tr key={i}>
                      <td className="p-2 text-foreground font-medium border-b border-border/50">{row.feature}</td>
                      <td className={`p-2 border-b border-border/50 ${row.winner === "lstm" ? "text-blue-500 font-semibold" : "text-muted"}`}>
                        {row.lstm}
                      </td>
                      <td className={`p-2 border-b border-border/50 ${row.winner === "gru" ? "text-green-500 font-semibold" : "text-muted"}`}>
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
              <strong>Dataset nhỏ/trung bình + cần tốc độ?</strong>{" "}
              → GRU.{" "}
              <strong>Dataset lớn + chuỗi rất dài?</strong>{" "}
              → LSTM.{" "}
              <strong>Bài toán NLP hiện đại?</strong>{" "}
              → Transformer (cả hai đều thua). Trong thực tế, thử cả hai rồi chọn cái tốt hơn trên validation set!
            </p>
          </Callout>
      </LessonSection>

      {/* ═══ Step 5: CHALLENGE ═══ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
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
      </LessonSection>

      {/* ═══ Step 6: EXPLAIN ═══ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích chi tiết">
        <ExplanationSection>
          <p>
            <strong>GRU (Gated Recurrent Unit)</strong>{" "}
            được Cho et al. đề xuất năm 2014, đơn giản hóa LSTM mà vẫn giữ khả năng nhớ xa. Hai cổng chính:
          </p>

          <p className="mt-3 font-semibold text-foreground">Các công thức:</p>

          <LaTeX block>{String.raw`r_t = \sigma(W_r \cdot [h_{t-1}, x_t] + b_r) \quad \text{(Reset Gate)}`}</LaTeX>
          <LaTeX block>{String.raw`z_t = \sigma(W_z \cdot [h_{t-1}, x_t] + b_z) \quad \text{(Update Gate)}`}</LaTeX>
          <LaTeX block>{String.raw`\tilde{h}_t = \tanh(W \cdot [r_t \odot h_{t-1}, x_t] + b) \quad \text{(Candidate)}`}</LaTeX>
          <LaTeX block>{String.raw`h_t = z_t \odot h_{t-1} + (1 - z_t) \odot \tilde{h}_t \quad \text{(Hidden State)}`}</LaTeX>

          <Callout variant="insight" title="Sự thông minh của (1 - zₜ)">
            <p>
              LSTM dùng forget gate (fₜ) và input gate (iₜ) độc lập — tổng không cần bằng 1. GRU ép tổng luôn bằng 1: zₜ + (1-zₜ) = 1. Nghĩa là &quot;giữ nhiều cũ&quot; tự động = &quot;thêm ít mới&quot;. Ít tham số hơn mà ràng buộc chặt hơn!
            </p>
          </Callout>

          <CodeBlock language="python" title="gru_comparison.py">
{`import torch.nn as nn

# GRU — đơn giản hơn
gru = nn.GRU(input_size=128, hidden_size=256,
             num_layers=2, batch_first=True)

# LSTM — để so sánh
lstm = nn.LSTM(input_size=128, hidden_size=256,
               num_layers=2, batch_first=True)

# So sánh tham số
gru_params = sum(p.numel() for p in gru.parameters())
lstm_params = sum(p.numel() for p in lstm.parameters())
print(f"GRU: {gru_params:,} params")   # ~788,480
print(f"LSTM: {lstm_params:,} params") # ~1,050,624
print(f"GRU nhẹ hơn: {(1 - gru_params/lstm_params)*100:.0f}%")  # ~25%

# Sử dụng giống nhau
output_gru, h_gru = gru(x)          # h: (layers, batch, hidden)
output_lstm, (h_lstm, c_lstm) = lstm(x)  # thêm cell state c

# GRU chỉ trả h, LSTM trả cả h và c
# Đây là sự khác biệt rõ nhất khi code`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      {/* ═══ Step 7: SUMMARY ═══ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về GRU"
          points={[
            "GRU đơn giản hóa LSTM: 2 cổng (reset, update) thay vì 3, gộp cell state vào hidden state.",
            "Update gate kiêm cả forget + input: zₜ × cũ + (1-zₜ) × mới. Tổng luôn bằng 1 — ràng buộc chặt hơn LSTM.",
            "Ít tham số hơn ~25% → train nhanh hơn, ít overfitting hơn trên dataset nhỏ.",
            "Hiệu suất thường ngang LSTM — chọn tùy bài toán (nhỏ → GRU, lớn → LSTM, NLP → Transformer).",
            "Reset gate cho phép 'quên sạch' quá khứ khi cần bắt đầu context mới.",
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
