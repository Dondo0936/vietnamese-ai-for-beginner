"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
  SliderGroup,
  LessonSection,
  TopicLink,} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "scaling-laws",
  title: "Scaling Laws",
  titleVi: "Định luật tỷ lệ",
  description:
    "Quy luật toán học dự đoán hiệu suất mô hình dựa trên kích thước tham số, dữ liệu và compute.",
  category: "llm-concepts",
  tags: ["scaling", "compute", "chinchilla", "training"],
  difficulty: "intermediate",
  relatedSlugs: ["llm-overview", "cost-optimization", "training-optimization"],
  vizType: "interactive",
};

// ─── Data: model size vs performance ───
const MODEL_POINTS = [
  { name: "GPT-2", params: 1.5, loss: 3.3, year: "2019" },
  { name: "GPT-3", params: 175, loss: 2.0, year: "2020" },
  { name: "Chinchilla", params: 70, loss: 1.75, year: "2022" },
  { name: "Llama 2 70B", params: 70, loss: 1.7, year: "2023" },
  { name: "GPT-4", params: 1700, loss: 1.2, year: "2023" },
  { name: "Llama 3 405B", params: 405, loss: 1.1, year: "2024" },
];

// Simplified power law: loss ≈ a * N^(-b)
function predictLoss(paramsB: number): number {
  return 5.5 * Math.pow(paramsB, -0.076);
}

const quizQuestions: QuizQuestion[] = [
  {
    question: "Theo scaling laws, gấp đôi số tham số model sẽ giảm loss bao nhiêu?",
    options: [
      "Giảm 50% (giảm một nửa)",
      "Giảm khoảng 5-7% (power law, diminishing returns)",
      "Giảm 100% (loss về 0)",
      "Không giảm — loss chỉ phụ thuộc dữ liệu",
    ],
    correct: 1,
    explanation: "Scaling laws là power law: L ∝ N^(-0.076). Gấp đôi N → loss giảm ~5%. Diminishing returns — mỗi lần gấp đôi ít hiệu quả hơn. Đó là lý do train model 10× lớn hơn chỉ tốt hơn 'một chút'.",
  },
  {
    question: "Chinchilla paper (2022) phát hiện điều gì quan trọng?",
    options: [
      "Model càng lớn càng tốt, không cần thêm dữ liệu",
      "Với cùng budget compute, nên train model NHỎ hơn trên NHIỀU dữ liệu hơn — cân bằng model size và data",
      "Không cần dữ liệu, chỉ cần model lớn",
      "LLM không thể cải thiện thêm",
    ],
    correct: 1,
    explanation: "Chinchilla chứng minh: GPT-3 (175B params, 300B tokens) là 'under-trained'. Chinchilla (70B params, 1.4T tokens) tốt HƠN dù nhỏ hơn 2.5 lần — vì train trên nhiều data hơn. Tỷ lệ tối ưu: ~20 token/tham số.",
  },
  {
    question: "Nếu bạn có budget $10M để train LLM, scaling laws khuyên gì?",
    options: [
      "Dồn hết vào model lớn nhất có thể",
      "Dồn hết vào dữ liệu nhiều nhất có thể",
      "Phân bổ cân bằng: ~50% cho model size, ~50% cho lượng dữ liệu",
      "Tiết kiệm, chỉ dùng $1M",
    ],
    correct: 2,
    explanation: "Scaling laws = compute-optimal: phân bổ CÂN BẰNG giữa model size và data. Chinchilla rule: nếu model có N tham số, cần ~20N token dữ liệu. Dồn lệch 1 phía = lãng phí compute.",
  },
  {
    type: "fill-blank",
    question: "Kaplan & Chinchilla scaling laws mô tả mối quan hệ giữa loss và ba yếu tố: số {blank} (N), lượng {blank} (D), và {blank} huấn luyện (C) — theo quy luật power law với diminishing returns.",
    blanks: [
      { answer: "tham số", accept: ["parameters", "params", "parameter", "số tham số"] },
      { answer: "dữ liệu", accept: ["data", "tokens", "token", "dữ liệu huấn luyện"] },
      { answer: "compute", accept: ["tính toán", "flops", "compute budget"] },
    ],
    explanation: "Ba yếu tố cốt lõi của scaling laws: N (parameters), D (data/tokens), C (compute/FLOPs). Công thức Kaplan: L ∝ N^(-0.076). Chinchilla rule: D ≈ 20N để tối ưu compute budget. Gấp 10× N chỉ giảm ~40% loss — diminishing returns là đặc trưng của power law.",
  },
];

export default function ScalingLawsTopic() {
  const [selectedModel, setSelectedModel] = useState<number | null>(null);

  // For the interactive slider
  const sliderViz = (values: Record<string, number>) => {
    const paramsB = values.params;
    const predictedLoss = predictLoss(paramsB);
    const optimalTokens = paramsB * 20;

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-surface p-3">
            <div className="text-lg font-bold text-foreground">{paramsB.toFixed(0)}B</div>
            <div className="text-[10px] text-muted">Tham số</div>
          </div>
          <div className="rounded-lg bg-surface p-3">
            <div className="text-lg font-bold text-accent">{predictedLoss.toFixed(2)}</div>
            <div className="text-[10px] text-muted">Loss dự đoán</div>
          </div>
          <div className="rounded-lg bg-surface p-3">
            <div className="text-lg font-bold text-foreground">{optimalTokens >= 1000 ? `${(optimalTokens / 1000).toFixed(1)}T` : `${optimalTokens.toFixed(0)}B`}</div>
            <div className="text-[10px] text-muted">Token tối ưu (×20)</div>
          </div>
        </div>

        {/* Visual bar comparing to known models */}
        <div className="space-y-1">
          {MODEL_POINTS.map((m, i) => {
            const isClose = Math.abs(m.params - paramsB) < paramsB * 0.3;
            return (
              <div key={i} className={`flex items-center gap-2 text-xs transition-opacity ${isClose ? "opacity-100" : "opacity-40"}`}>
                <span className="w-24 text-right text-muted truncate">{m.name}</span>
                <div className="flex-1 h-2 rounded-full bg-card overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent/60"
                    style={{ width: `${Math.min(100, (1 / m.loss) * 70)}%` }}
                  />
                </div>
                <span className="w-10 text-muted">{m.loss.toFixed(1)}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ━━━ HOOK ━━━ */}
      <LessonSection step={1} totalSteps={6} label="Thử đoán">
      <PredictionGate
        question="GPT-3 có 175 tỷ tham số. GPT-4 có ~1.700 tỷ (gấp 10 lần). GPT-4 giỏi hơn GPT-3 bao nhiêu lần?"
        options={[
          "Giỏi hơn 10 lần — tỷ lệ thuận với số tham số",
          "Giỏi hơn khoảng 30-50% — không tỷ lệ thuận, hiệu quả giảm dần",
          "Giống nhau — số tham số không quan trọng",
          "Giỏi hơn 100 lần",
        ]}
        correct={1}
        explanation="Gấp 10× tham số KHÔNG cho gấp 10× hiệu suất! Scaling laws là power law: L ∝ N^(-0.076). Gấp 10× N → loss giảm ~40%. Đó là 'diminishing returns' — mỗi lần gấp đôi ít hiệu quả hơn. Hiểu quy luật này giúp quyết định đầu tư compute thông minh."
      >
        <p className="text-sm text-muted mt-4">
          Hãy xem mối quan hệ giữa kích thước model và hiệu suất — nó tuân theo một quy luật toán học chính xác.
        </p>
      </PredictionGate>

      </LessonSection>

{/* ━━━ KHÁM PHÁ — Biểu đồ scaling ━━━ */}
      <LessonSection step={2} totalSteps={6} label="Khám phá">
      <VisualizationSection>
        <h3 className="text-base font-semibold text-foreground mb-1">
          Biểu đồ Scaling: Model lớn hơn → Loss thấp hơn (nhưng chậm dần)
        </h3>
        <p className="text-sm text-muted mb-4">
          Nhấp vào mỗi model để xem chi tiết. Đường cong là power law — KHÔNG phải đường thẳng.
        </p>

        <svg viewBox="0 0 450 280" className="w-full max-w-lg mx-auto mb-4">
          {/* Axes */}
          <line x1={60} y1={240} x2={430} y2={240} stroke="var(--text-tertiary)" strokeWidth={1} />
          <line x1={60} y1={20} x2={60} y2={240} stroke="var(--text-tertiary)" strokeWidth={1} />
          <text x={250} y={270} textAnchor="middle" fontSize={10} fill="var(--text-secondary)">
            Tham số (tỷ)
          </text>
          <text x={15} y={130} textAnchor="middle" fontSize={10} fill="var(--text-secondary)" transform="rotate(-90,15,130)">
            Loss
          </text>

          {/* Power law curve */}
          {Array.from({ length: 50 }, (_, i) => {
            const params = 1 + i * 40;
            const loss = predictLoss(params);
            const x = 60 + (Math.log10(params) / Math.log10(2000)) * 370;
            const y = 20 + ((4 - loss) / 3) * 220;
            return { x, y };
          }).map((p, i, arr) => {
            if (i === 0) return null;
            return (
              <line
                key={i}
                x1={arr[i - 1].x} y1={arr[i - 1].y}
                x2={p.x} y2={p.y}
                stroke="var(--accent)" strokeWidth={2} opacity={0.4}
              />
            );
          })}

          {/* Model points */}
          {MODEL_POINTS.map((m, i) => {
            const x = 60 + (Math.log10(m.params) / Math.log10(2000)) * 370;
            const y = 240 - ((4 - m.loss) / 3) * 220;
            const isSelected = selectedModel === i;

            return (
              <g key={i} onClick={() => setSelectedModel(isSelected ? null : i)} className="cursor-pointer">
                <motion.circle
                  cx={x} cy={y}
                  r={isSelected ? 8 : 5}
                  fill={isSelected ? "var(--accent)" : "var(--text-secondary)"}
                  stroke="var(--bg-card)"
                  strokeWidth={2}
                  animate={{ r: isSelected ? 8 : 5 }}
                />
                <text x={x} y={y - 12} textAnchor="middle" fontSize={8}
                  fill="var(--text-primary)" fontWeight={isSelected ? 700 : 400}>
                  {m.name}
                </text>
                {isSelected && (
                  <text x={x} y={y + 20} textAnchor="middle" fontSize={7} fill="var(--text-secondary)">
                    {m.params}B params, loss={m.loss}
                  </text>
                )}
              </g>
            );
          })}

          {/* X-axis labels */}
          {[1, 10, 100, 1000].map(p => {
            const x = 60 + (Math.log10(p) / Math.log10(2000)) * 370;
            return (
              <g key={p}>
                <line x1={x} y1={240} x2={x} y2={244} stroke="var(--text-tertiary)" strokeWidth={1} />
                <text x={x} y={255} textAnchor="middle" fontSize={8} fill="var(--text-tertiary)">
                  {p >= 1000 ? `${p / 1000}T` : `${p}B`}
                </text>
              </g>
            );
          })}

          {/* Y-axis labels */}
          {[1.0, 2.0, 3.0, 4.0].map(l => {
            const y = 20 + ((4 - l) / 3) * 220;
            return (
              <g key={l}>
                <line x1={56} y1={y} x2={60} y2={y} stroke="var(--text-tertiary)" strokeWidth={1} />
                <text x={50} y={y + 3} textAnchor="end" fontSize={8} fill="var(--text-tertiary)">
                  {l.toFixed(1)}
                </text>
              </g>
            );
          })}
        </svg>
      </VisualizationSection>

      </LessonSection>

{/* ━━━ AHA MOMENT ━━━ */}
      <LessonSection step={3} totalSteps={6} label="Khám phá">
      <AhaMoment>
        Hiệu suất LLM tuân theo <strong>power law</strong>{" "}— một quy luật toán học dự đoán được!
        Gấp 10× tham số chỉ giảm ~40% loss (không phải 10×). Biết quy luật này, các lab AI
        có thể <em>tính trước</em>{" "}cần bao nhiêu compute để đạt hiệu suất mong muốn trước khi bỏ hàng triệu đô.
      </AhaMoment>

      </LessonSection>

{/* ━━━ ĐI SÂU — Slider dự đoán ━━━ */}
      <LessonSection step={4} totalSteps={6} label="Đi sâu">
      <VisualizationSection>
        <h3 className="text-base font-semibold text-foreground mb-3">
          Dự đoán hiệu suất model
        </h3>
        <p className="text-sm text-muted mb-2">
          Kéo thanh trượt để thay đổi kích thước model — xem loss dự đoán và lượng data tối ưu (Chinchilla rule: 20 token/tham số).
        </p>

        <SliderGroup
          sliders={[
            { key: "params", label: "Tham số (tỷ)", min: 1, max: 1000, step: 1, defaultValue: 70, unit: "B" },
          ]}
          visualization={sliderViz}
        />
      </VisualizationSection>

      </LessonSection>

{/* ━━━ THỬ THÁCH ━━━ */}
      <LessonSection step={5} totalSteps={6} label="Thử thách">
      <InlineChallenge
        question="Chinchilla (70B params, train trên 1.4T tokens) vs GPT-3 (175B params, train trên 300B tokens). Ai thắng?"
        options={[
          "GPT-3 — lớn hơn 2.5 lần nên phải giỏi hơn",
          "Chinchilla — nhỏ hơn nhưng train trên nhiều data hơn, cân bằng tốt hơn",
          "Hòa — khác model khác data nên không so sánh được",
          "GPT-3 — ra trước nên đã được tối ưu kỹ hơn",
        ]}
        correct={1}
        explanation="Chinchilla thắng! Dù nhỏ hơn 2.5×, nó train trên 4.7× nhiều data hơn. GPT-3 bị 'under-trained' — có budget compute đủ train 175B nhưng không cho đủ data. Chinchilla rule: cân bằng model size và data."
      />

      </LessonSection>

{/* ━━━ GIẢI THÍCH ━━━ */}
      <LessonSection step={6} totalSteps={6} label="Giải thích">
      <ExplanationSection>
        <p>
          <strong>Scaling Laws</strong>{" "}là các quy luật toán học mô tả mối quan hệ giữa
          hiệu suất model (loss) với ba yếu tố: số tham số (N), lượng dữ liệu (D), và compute (C).
        </p>

        <Callout variant="insight" title="Công thức Kaplan et al. (2020)">
          <LaTeX block>{"L(N) \\approx \\left(\\frac{N_c}{N}\\right)^{\\alpha_N}, \\quad \\alpha_N \\approx 0.076"}</LaTeX>
          <p className="text-sm mt-2">
            Loss giảm theo power law khi tăng N. Nhưng vì <LaTeX>{"\\alpha"}</LaTeX>{" "}rất nhỏ (0.076),
            gấp 10× N chỉ giảm ~40% loss. Diminishing returns!
          </p>
        </Callout>

        <Callout variant="tip" title="Chinchilla Rule (Hoffmann et al., 2022)">
          Với budget compute cố định C, tỷ lệ tối ưu:
          <LaTeX block>{"D_{\\text{optimal}} \\approx 20 \\times N"}</LaTeX>
          <p className="text-sm mt-1">
            Model 70B tham số → cần 1.4 nghìn tỷ (1.4T) token dữ liệu.
            GPT-3 có 175B nhưng chỉ train 300B token = under-trained!
          </p>
        </Callout>

        <p><strong>3 phát hiện chính:</strong></p>
        <ul className="list-disc list-inside space-y-2 pl-2 text-sm">
          <li>
            <strong>Smooth power law:</strong>{" "}Loss giảm dự đoán được khi tăng N, D, hoặc C — không có &quot;magic threshold&quot;
          </li>
          <li>
            <strong>Compute-optimal:</strong>{" "}Phân bổ CÂN BẰNG giữa model size và data cho kết quả tốt nhất. Kiến trúc{" "}
            <TopicLink slug="moe">MoE (Mixture of Experts)</TopicLink>{" "}
            mở rộng scaling laws bằng cách tăng tham số mà giữ compute gần như không đổi.
          </li>
          <li>
            <strong>Emergent abilities:</strong>{" "}Một số khả năng (CoT, few-shot,{" "}
            <TopicLink slug="long-context">long context</TopicLink>) chỉ xuất hiện ở quy mô đủ lớn — dù scaling smooth
          </li>
        </ul>

        <CodeBlock language="python" title="scaling_prediction.py">{`import math

# Dự đoán loss theo Kaplan scaling law
def predict_loss(params_billions):
    """Ước tính cross-entropy loss từ model size"""
    N_c = 8.8e13  # constant
    alpha = 0.076
    N = params_billions * 1e9
    return (N_c / N) ** alpha

# Chinchilla optimal data
def optimal_tokens(params_billions):
    """Tokens tối ưu theo Chinchilla rule"""
    return params_billions * 20  # tỷ token

# Ví dụ
print(f"Llama 70B: loss ≈ {predict_loss(70):.2f}")
print(f"  Cần ≈ {optimal_tokens(70):.0f}B tokens")
print(f"GPT-4 1.7T: loss ≈ {predict_loss(1700):.2f}")
print(f"  Cần ≈ {optimal_tokens(1700)/1000:.1f}T tokens")`}</CodeBlock>
      </ExplanationSection>

      <MiniSummary
        points={[
          "Scaling laws: loss giảm theo power law khi tăng params, data, compute — dự đoán được trước!",
          "Diminishing returns: gấp 10× params chỉ giảm ~40% loss — mỗi bước cải thiện tốn kém hơn",
          "Chinchilla rule: cân bằng model size và data. Tỷ lệ tối ưu ≈ 20 token/tham số",
          "Ứng dụng: giúp lab AI tính trước budget compute cần thiết trước khi đầu tư hàng triệu đô",
        ]}
      />

      <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
