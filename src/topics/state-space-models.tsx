"use client";

import { useState, useMemo } from "react";
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
  slug: "state-space-models",
  title: "State Space Models",
  titleVi: "Mô hình không gian trạng thái — Đối thủ của Transformer",
  description:
    "Kiến trúc mô hình tuần tự hiệu quả dựa trên lý thuyết hệ thống điều khiển, xử lý chuỗi dài nhanh hơn Transformer.",
  category: "emerging",
  tags: ["ssm", "mamba", "sequence", "linear"],
  difficulty: "advanced",
  relatedSlugs: ["long-context", "reasoning-models", "transformer"],
  vizType: "interactive",
};

const TOTAL_STEPS = 7;

export default function StateSpaceModelsTopic() {
  const [seqLen, setSeqLen] = useState(4000);

  const transformerFLOPs = (seqLen / 1000) ** 2;
  const ssmFLOPs = seqLen / 1000;
  const transformerMem = (seqLen / 1000) ** 2;
  const ssmMem = seqLen / 1000;

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Tại sao SSM có độ phức tạp O(N) thay vì O(N^2) như Transformer?",
      options: [
        "SSM dùng GPU mạnh hơn",
        "SSM nén toàn bộ lịch sử vào hidden state cố định, mỗi token mới chỉ cần cập nhật state — không cần xem lại toàn bộ chuỗi",
        "SSM bỏ qua một số token để giảm compute",
      ],
      correct: 1,
      explanation: "Transformer attention: mỗi token mới phải attend đến TẤT CẢ token trước → O(N^2). SSM: nén lịch sử vào state vector h_t, mỗi token cập nhật h_{t+1} = Ah_t + Bx_t → O(N). Giống đọc sách bằng cách ghi chú (SSM) vs đọc lại toàn bộ mỗi trang mới (Transformer).",
    },
    {
      question: "Mamba khác SSM cổ điển (S4) ở điểm nào?",
      options: [
        "Dùng attention thay vì recurrence",
        "Tham số A, B, C THAY ĐỔI theo input (input-dependent) — selective state space",
        "Có nhiều layer hơn S4",
      ],
      correct: 1,
      explanation: "S4: tham số A, B, C cố định (Linear Time Invariant). Mamba: A, B, C phụ thuộc vào input x_t → model có thể 'chọn lọc' thông tin nào nên nhớ, nào nên quên. Đây là cơ chế 'attention-like' nhưng với O(N) complexity.",
    },
    {
      question: "Hybrid architectures (Jamba, Mamba-2) kết hợp SSM + Transformer để làm gì?",
      options: [
        "Chạy nhanh hơn SSM thuần",
        "SSM xử lý context dài hiệu quả, Transformer attention xử lý in-context retrieval tốt — bổ sung cho nhau",
        "Giảm số tham số model",
      ],
      correct: 1,
      explanation: "SSM giỏi: nén sequence dài, inference nhanh. Kém: in-context lookup (tìm fact cụ thể trong context). Transformer giỏi: retrieve exact information từ context. Hybrid: SSM layers cho backbone + vài attention layers cho retrieval. Jamba đạt chất lượng tốt với throughput 3x Transformer thuần.",
    },
    {
      type: "fill-blank",
      question: "{blank} là mô hình SSM nổi bật nhất, đạt độ phức tạp {blank} (tuyến tính) theo độ dài chuỗi, nhờ đó xử lý context dài nhanh hơn Transformer rất nhiều.",
      blanks: [
        { answer: "Mamba", accept: ["mamba"] },
        { answer: "O(N)", accept: ["tuyến tính", "linear", "O(n)"] },
      ],
      explanation: "Mamba (Gu & Dao, 2023) là SSM selective với độ phức tạp O(N) — tuyến tính theo sequence length, so với O(N^2) của Transformer attention. Với 100K tokens, Mamba nhanh hơn khoảng 10.000x về FLOPs.",
    },
  ], []);

  return (
    <>
      {/* STEP 1: PREDICTION GATE */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Transformer attention tốn O(N^2) theo sequence length. Với context 1M tokens, chi phí attention tăng 1000000^2 = 1 nghìn tỷ phép tính. Có kiến trúc nào đạt chất lượng tương đương mà chỉ O(N)?"
          options={[
            "Không — attention là cần thiết, không có gì thay thế",
            "State Space Models (Mamba): nén lịch sử vào state cố định, mỗi token chỉ O(1) compute",
            "RNN cũ (LSTM) đã giải quyết rồi",
          ]}
          correct={1}
          explanation="SSM (đặc biệt Mamba) là đối thủ thực sự của Transformer! Nén toàn bộ chuỗi vào hidden state — giống ghi chú thay vì đọc lại toàn bộ sách mỗi lần. O(N) thay vì O(N^2), inference nhanh 5x cho chuỗi dài. Nhưng trade-off: kém hơn Transformer ở in-context retrieval."
        >

      {/* STEP 2: INTERACTIVE VIZ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Kéo thanh trượt <strong className="text-foreground">độ dài chuỗi</strong>{" "}
          để xem chi phí tính toán và bộ nhớ SSM vs Transformer khác nhau thế nào.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted">
                Độ dài chuỗi: {seqLen.toLocaleString()} tokens
              </label>
              <input
                type="range"
                min={500}
                max={100000}
                step={500}
                value={seqLen}
                onChange={(e) => setSeqLen(parseInt(e.target.value))}
                className="w-full accent-accent"
              />
            </div>

            <svg viewBox="0 0 600 200" className="w-full max-w-2xl mx-auto">
              <text x={300} y={16} textAnchor="middle" fill="var(--text-primary)" fontSize={11} fontWeight="bold">
                FLOPs &amp; Memory: Transformer vs SSM
              </text>

              {/* Transformer FLOPs */}
              <text x={15} y={48} fill="#ef4444" fontSize={11}>Transformer</text>
              <rect x={100} y={34} width={420} height={20} rx={4} fill="#1e293b" />
              <rect x={100} y={34} width={Math.min(420, 420 * Math.min(transformerFLOPs, 100) / 100)} height={20} rx={4} fill="#ef4444" opacity={0.7} />
              <text x={525} y={48} fill="#ef4444" fontSize={11} fontWeight="bold">
                O(N^2) = {transformerFLOPs.toFixed(1)}x
              </text>

              {/* SSM FLOPs */}
              <text x={15} y={78} fill="#22c55e" fontSize={11}>SSM/Mamba</text>
              <rect x={100} y={64} width={420} height={20} rx={4} fill="#1e293b" />
              <rect x={100} y={64} width={Math.min(420, 420 * ssmFLOPs / 100)} height={20} rx={4} fill="#22c55e" />
              <text x={525} y={78} fill="#22c55e" fontSize={11} fontWeight="bold">
                O(N) = {ssmFLOPs.toFixed(1)}x
              </text>

              {/* Memory comparison */}
              <text x={300} y={115} textAnchor="middle" fill="var(--text-secondary)" fontSize={11} fontWeight="bold">KV Cache Memory</text>

              <text x={15} y={138} fill="#ef4444" fontSize={11}>Transformer</text>
              <rect x={100} y={124} width={420} height={20} rx={4} fill="#1e293b" />
              <rect x={100} y={124} width={Math.min(420, 420 * Math.min(transformerMem, 100) / 100)} height={20} rx={4} fill="#ef4444" opacity={0.5} />
              <text x={525} y={138} fill="#ef4444" fontSize={11}>
                O(N) KV
              </text>

              <text x={15} y={168} fill="#22c55e" fontSize={11}>SSM</text>
              <rect x={100} y={154} width={420} height={20} rx={4} fill="#1e293b" />
              <rect x={100} y={154} width={20} height={20} rx={4} fill="#22c55e" />
              <text x={525} y={168} fill="#22c55e" fontSize={11}>
                O(1) state
              </text>

              <text x={300} y={193} textAnchor="middle" fill="var(--text-tertiary)" fontSize={11}>
                SSM nhanh hơn {(transformerFLOPs / ssmFLOPs).toFixed(0)}x FLOPs, memory KV cache O(1) vs O(N)
              </text>
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* STEP 3: AHA */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Transformer = <strong>đọc lại toàn bộ sách</strong>{" "}mỗi khi cần thông tin (O(N^2)).
            SSM = <strong>ghi chú tóm tắt</strong>{" "}khi đọc, tra ghi chú khi cần (O(N)).
            Với chuỗi 100K tokens, Transformer tốn <strong>10.000x compute</strong>{" "}
            so với SSM! Nhưng Transformer &quot;nhớ chính xác&quot; hơn (attention), SSM &quot;nhớ tóm tắt&quot; (state compression).
          </p>
        </AhaMoment>
      </LessonSection>

      {/* STEP 4: CHALLENGE */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="SSM Mamba nén 100K tokens vào hidden state 1024 dims. Bạn hỏi: 'Số điện thoại được nhắc ở đoạn 3 là gì?' SSM có thể trả lời chính xác không?"
          options={[
            "Có — state chứa tất cả thông tin",
            "Khó — state nén mất chi tiết cụ thể (lossy compression). Transformer attention lookup chính xác hơn",
            "Không bao giờ — SSM không thể xử lý retrieval",
          ]}
          correct={1}
          explanation="Nén 100K tokens vào 1024 dims = compression ratio 100:1 → mất chi tiết cụ thể (số điện thoại, tên riêng). Transformer attention CÓ THỂ attend trực tiếp đến token chứa số điện thoại. Đây là điểm yếu chính của SSM — và lý do hybrid (SSM + attention) là xu hướng."
        />
      </LessonSection>

      {/* STEP 5: EXPLANATION */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>State Space Models (SSM)</strong>{" "}
            là kiến trúc tuần tự dựa trên hệ phương trình vi phân, kế thừa ý tưởng hidden state từ{" "}
            <TopicLink slug="rnn">RNN</TopicLink>{" "}nhưng với O(N) complexity thay vì O(N^2) của{" "}
            <TopicLink slug="transformer">Transformer</TopicLink>, đặc biệt hiệu quả cho bài toán{" "}
            <TopicLink slug="long-context">long context</TopicLink>.
          </p>

          <p><strong>Phương trình SSM cơ bản:</strong></p>
          <LaTeX block>{"h_t = \\bar{A} h_{t-1} + \\bar{B} x_t \\quad (\\text{cập nhật state})"}</LaTeX>
          <LaTeX block>{"y_t = C h_t + D x_t \\quad (\\text{output})"}</LaTeX>
          <p>
            <LaTeX>{"h_t"}</LaTeX> là hidden state (ghi chú tóm tắt), <LaTeX>{"\\bar{A}"}</LaTeX> quyết định nhớ/quên,{" "}
            <LaTeX>{"\\bar{B}"}</LaTeX> quyết định input nào đưa vào state.
          </p>

          <p><strong>Tại sao O(N)?</strong></p>
          <LaTeX block>{"\\text{Transformer: } \\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d}}\\right)V \\quad \\rightarrow O(N^2 \\cdot d)"}</LaTeX>
          <LaTeX block>{"\\text{SSM: } h_t = f(h_{t-1}, x_t) \\quad \\rightarrow O(N \\cdot d)"}</LaTeX>

          <Callout variant="tip" title="Mamba: Selective State Space">
            Mamba (Gu &amp; Dao, 2023) biến SSM cố định thành input-dependent: tham số B, C, delta phụ thuộc vào input x_t. Model có thể &quot;chọn lọc&quot; thông tin — giống attention nhưng O(N). Sử dụng hardware-aware scan algorithm cho tốc độ thực tế nhanh gấp 5x.
          </Callout>

          <p><strong>Dual form: Recurrence vs Convolution</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Recurrence mode:</strong>{" "}O(1) per token — cho inference (autoregressive generation)</li>
            <li><strong>Convolution mode:</strong>{" "}Parallelizable trên GPU — cho training</li>
          </ul>
          <LaTeX block>{"\\text{Recurrence: } h_t = \\bar{A}h_{t-1} + \\bar{B}x_t \\quad (\\text{sequential, inference})"}</LaTeX>
          <LaTeX block>{"\\text{Convolution: } y = K * x, \\quad K_i = C\\bar{A}^i\\bar{B} \\quad (\\text{parallel, training})"}</LaTeX>

          <p><strong>Hybrid Architectures (xu hướng hiện tại):</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Jamba (AI21):</strong>{" "}Xen kẽ Mamba layers + Attention layers. Throughput 3x, context 256K</li>
            <li><strong>Mamba-2:</strong>{" "}Kết hợp structured state space + attention trong 1 framework</li>
            <li><strong>Zamba:</strong>{" "}SSM backbone + shared attention layers — parameter efficient</li>
          </ul>

          <CodeBlock language="python" title="Mamba model inference">
{`from mamba_ssm import Mamba

# Mamba block — thay thế Transformer attention + FFN
mamba = Mamba(
    d_model=2048,      # Hidden dimension
    d_state=128,       # State dimension (ghi chú)
    d_conv=4,          # Local convolution width
    expand=2,          # FFN expansion factor
).cuda()

# Forward pass — O(N) thay vì O(N^2)
import torch
x = torch.randn(1, 100000, 2048).cuda()  # 100K tokens
y = mamba(x)  # O(N) compute, O(1) memory per token

# So sánh inference speed (100K tokens):
# Transformer: 45 seconds (KV cache 32GB)
# Mamba: 3 seconds (state 1MB)
# → 15x nhanh hơn, 32000x ít memory!`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      {/* STEP 6: SUMMARY */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "SSM nén chuỗi vào hidden state cố định: O(N) compute, O(1) memory per token vs O(N^2) Transformer.",
          "Mamba: selective SSM với input-dependent parameters — 'chọn lọc' thông tin giống attention nhưng O(N).",
          "Dual mode: Recurrence cho inference nhanh (O(1)/token), Convolution cho training song song.",
          "Nhược điểm: kém Transformer ở in-context retrieval (lossy compression). Hybrid là xu hướng.",
          "Jamba, Mamba-2: SSM backbone + attention layers = throughput 3-5x, context 256K+, chất lượng tương đương.",
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
