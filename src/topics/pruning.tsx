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
  slug: "pruning",
  title: "Pruning",
  titleVi: "Pruning - Cắt tỉa mô hình",
  description:
    "Kỹ thuật loại bỏ các trọng số hoặc nơ-ron ít quan trọng để giảm kích thước mô hình.",
  category: "training-optimization",
  tags: ["pruning", "compression", "sparsity", "optimization"],
  difficulty: "intermediate",
  relatedSlugs: ["quantization", "distillation", "mixed-precision"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

interface Connection { from: number; to: number; weight: number; }

const CONNECTIONS: Connection[] = [
  { from: 0, to: 0, weight: 0.85 }, { from: 0, to: 1, weight: 0.12 },
  { from: 0, to: 2, weight: 0.67 }, { from: 0, to: 3, weight: 0.03 },
  { from: 1, to: 0, weight: 0.05 }, { from: 1, to: 1, weight: 0.92 },
  { from: 1, to: 2, weight: 0.08 }, { from: 1, to: 3, weight: 0.74 },
  { from: 2, to: 0, weight: 0.45 }, { from: 2, to: 1, weight: 0.02 },
  { from: 2, to: 2, weight: 0.55 }, { from: 2, to: 3, weight: 0.11 },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Phân biệt unstructured vs structured pruning:",
    options: [
      "Unstructured xoá từng trọng số lẻ (tạo ma trận thưa); Structured xoá toàn bộ neuron/filter (giảm kích thước thực sự)",
      "Unstructured tốt hơn structured trong mọi trường hợp",
      "Structured pruning chỉ dùng cho CNN, không dùng cho LLM",
      "Không có sự khác biệt — cả hai cho kết quả giống nhau",
    ],
    correct: 0,
    explanation:
      "Unstructured pruning tạo ma trận thưa — cần phần cứng chuyên biệt để tận dụng. Structured pruning xoá toàn bộ cấu trúc (neuron, attention head) — giảm kích thước thật sự trên phần cứng tiêu chuẩn.",
  },
  {
    question: "Lottery Ticket Hypothesis (giả thuyết vé số) nói gì?",
    options: [
      "Mọi mạng nơ-ron đều có thể pruning 90%",
      "Trong mạng lớn luôn tồn tại một mạng con nhỏ hơn mà khi huấn luyện lại từ đầu vẫn đạt hiệu suất tương đương",
      "Pruning ngẫu nhiên tốt hơn pruning theo trọng số",
      "Chỉ cần pruning 1 lần là đủ",
    ],
    correct: 1,
    explanation:
      "Frankle & Carlin (2019) chứng minh: mạng lớn chứa 'mạng con trúng thưởng' (winning ticket) — một tập con nhỏ mà nếu huấn luyện riêng với cùng khởi tạo ban đầu, đạt hiệu suất ngang mạng gốc.",
  },
  {
    question: "Quy trình pruning tối ưu thường theo thứ tự nào?",
    options: [
      "Pruning → Huấn luyện → Pruning tiếp",
      "Huấn luyện → Pruning → Fine-tune lại (để phục hồi chất lượng)",
      "Pruning → Không cần fine-tune",
      "Fine-tune → Pruning → Quantization → Fine-tune lại",
    ],
    correct: 1,
    explanation:
      "Quy trình chuẩn: train → prune → fine-tune. Pruning gây mất chất lượng, fine-tune lại giúp phục hồi. Có thể lặp lại nhiều vòng (iterative pruning) để đạt tỷ lệ cắt tỉa cao hơn.",
  },
  {
    type: "fill-blank",
    question:
      "Tiêu chí pruning phổ biến nhất là dựa trên {blank} — loại bỏ các trọng số có giá trị tuyệt đối nhỏ. Kết quả là ma trận có tỷ lệ {blank} (sparsity) cao.",
    blanks: [
      { answer: "magnitude", accept: ["độ lớn", "giá trị tuyệt đối", "|w|"] },
      { answer: "sparsity", accept: ["thưa", "sparse", "độ thưa"] },
    ],
    explanation:
      "Magnitude pruning đặt mask = 0 khi |w| < τ. Ma trận kết quả có nhiều phần tử 0 (sparsity). Tỷ lệ sparsity cao (như 90%) đồng nghĩa chỉ giữ 10% trọng số quan trọng nhất.",
  },
];

export default function PruningTopic() {
  const [threshold, setThreshold] = useState(0.2);

  const { active, pruned } = useMemo(() => {
    const a = CONNECTIONS.filter(c => Math.abs(c.weight) >= threshold);
    const p = CONNECTIONS.filter(c => Math.abs(c.weight) < threshold);
    return { active: a, pruned: p };
  }, [threshold]);

  const prunedPercent = ((pruned.length / CONNECTIONS.length) * 100).toFixed(0);
  const inputY = (i: number) => 60 + i * 80;
  const outputY = (i: number) => 40 + i * 60;

  return (
    <>
      {/* ━━━ 1. HOOK ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Nghiên cứu cho thấy có thể xoá đến 90% trọng số của một mạng nơ-ron. Kết quả sẽ ra sao?"
          options={[
            "Mô hình sẽ hoàn toàn vô dụng — mất 90% = mất hết",
            "Chất lượng chỉ giảm dưới 2% — phần lớn trọng số gần 0 không đóng góp gì",
            "Tốc độ sẽ giảm vì mạng thưa khó tính toán",
          ]}
          correct={1}
          explanation="Giống cây bonsai: cắt bỏ 90% cành nhỏ yếu, cây vẫn đẹp vì dưỡng chất tập trung vào cành chính. Mạng nơ-ron có rất nhiều trọng số gần 0 — loại bỏ chúng hầu như không ảnh hưởng."
        >
          <p className="text-sm text-muted mt-2">
            Hãy tự mình cắt tỉa mạng nơ-ron và quan sát điều gì xảy ra!
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ 2. TRỰC QUAN HOÁ ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Cắt tỉa mạng nơ-ron tương tác
          </h3>
          <p className="text-sm text-muted mb-4">
            Kéo ngưỡng lên để cắt tỉa nhiều hơn. Quan sát kết nối nào biến mất.
          </p>

          <div className="space-y-1 max-w-lg mx-auto mb-4">
            <label className="text-sm text-muted">
              Ngưỡng cắt tỉa: <strong className="text-foreground">{threshold.toFixed(2)}</strong>{" "}
              (trọng số &lt; {threshold.toFixed(2)} sẽ bị loại)
            </label>
            <input type="range" min={0} max={0.8} step={0.05} value={threshold}
              onChange={e => setThreshold(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-surface accent-accent cursor-pointer" />
          </div>

          <svg viewBox="0 0 500 280" className="w-full max-w-xl mx-auto mb-4">
            <text x="250" y="18" textAnchor="middle" fill="var(--text-primary)" fontSize="11" fontWeight="bold">
              Mạng sau cắt tỉa ({prunedPercent}% đã cắt)
            </text>

            {pruned.map((c, i) => (
              <line key={`p-${i}`}
                x1="100" y1={inputY(c.from)} x2="400" y2={outputY(c.to)}
                stroke="var(--bg-card)" strokeWidth="1" strokeDasharray="3,3" opacity={0.3} />
            ))}

            {active.map((c, i) => (
              <line key={`a-${i}`}
                x1="100" y1={inputY(c.from)} x2="400" y2={outputY(c.to)}
                stroke="#3b82f6" strokeWidth={c.weight * 4 + 0.5} opacity={0.7} />
            ))}

            {[0, 1, 2].map(i => (
              <g key={`in-${i}`}>
                <circle cx="80" cy={inputY(i)} r="18" fill="#3b82f6" opacity={0.8} />
                <text x="80" y={inputY(i) + 4} textAnchor="middle" fill="white" fontSize="10">
                  x{i + 1}
                </text>
              </g>
            ))}

            {[0, 1, 2, 3].map(i => {
              const has = active.some(c => c.to === i);
              return (
                <g key={`out-${i}`}>
                  <circle cx="420" cy={outputY(i)} r="16"
                    fill={has ? "#22c55e" : "var(--bg-card)"} opacity={has ? 0.8 : 0.3} />
                  <text x="420" y={outputY(i) + 4} textAnchor="middle"
                    fill={has ? "white" : "var(--text-tertiary)"} fontSize="10">
                    y{i + 1}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-lg font-bold text-blue-400">{active.length}/{CONNECTIONS.length}</p>
              <p className="text-xs text-muted">Kết nối còn lại</p>
            </div>
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-lg font-bold text-red-400">{prunedPercent}%</p>
              <p className="text-xs text-muted">Đã cắt tỉa</p>
            </div>
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-lg font-bold text-green-400">
                {(100 - Number(prunedPercent) * 0.3).toFixed(0)}%
              </p>
              <p className="text-xs text-muted">Chất lượng ước tính</p>
            </div>
          </div>

          <Callout variant="tip" title="Thử nghiệm">
            Kéo ngưỡng lên 0.5 — chất lượng vẫn ~85% dù đã cắt gần nửa kết nối!
            Các trọng số lớn (đường đậm) mang phần lớn thông tin.
          </Callout>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ 3. AHA MOMENT ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          Mạng nơ-ron giống khu rừng um tùm: phần lớn cành lá nhỏ không đóng góp gì
          cho tán cây. <strong>Pruning</strong>{" "}phát hiện rằng chỉ một{" "}
          <strong>tập con nhỏ</strong>{" "}trọng số thực sự quan trọng (Lottery Ticket
          Hypothesis) — cắt bỏ phần còn lại không chỉ giảm kích thước mà còn có thể{" "}
          <strong>cải thiện tổng quát hoá</strong>{" "}vì giảm overfitting.
        </AhaMoment>
      </LessonSection>

      {/* ━━━ 4. THÁCH THỨC ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Bạn pruning 80% trọng số (unstructured). Mô hình nhỏ hơn 80% trên đĩa nhưng tốc độ inference KHÔNG nhanh hơn. Tại sao?"
          options={[
            "Vì GPU không thể tận dụng ma trận thưa — vẫn phải tính toán qua các vị trí zero",
            "Vì bạn pruning sai lớp",
            "Vì cần quantize thêm mới nhanh được",
            "Vì 80% là chưa đủ",
          ]}
          correct={0}
          explanation="Unstructured pruning tạo ma trận thưa (sparse) — nhưng GPU tiêu chuẩn tối ưu cho phép nhân ma trận đặc (dense). Cần phần cứng hỗ trợ sparsity (như NVIDIA Ampere 2:4) hoặc dùng structured pruning (xoá toàn bộ neuron/head)."
        />
      </LessonSection>

      {/* ━━━ 5. GIẢI THÍCH SÂU ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Pruning</strong>{" "}loại bỏ các thành phần ít quan trọng trong mô hình.
            Tiêu chí cơ bản: trọng số có giá trị tuyệt đối nhỏ thì ít quan trọng.
          </p>

          <LaTeX block>{"\\text{Mask}_{ij} = \\begin{cases} 1 & \\text{if } |w_{ij}| \\geq \\tau \\\\ 0 & \\text{if } |w_{ij}| < \\tau \\end{cases}"}</LaTeX>

          <p>Hai loại pruning chính:</p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>Unstructured Pruning:</strong>{" "}Xoá từng trọng số riêng lẻ. Tỷ lệ
              cắt tỉa cao (90%+) nhưng tạo ma trận thưa — cần phần cứng chuyên biệt.
            </li>
            <li>
              <strong>Structured Pruning:</strong>{" "}Xoá toàn bộ neuron, filter CNN, hoặc
              attention head. Giảm kích thước thật sự trên phần cứng tiêu chuẩn.
            </li>
          </ul>

          <CodeBlock language="python" title="pruning_example.py">{`import torch.nn.utils.prune as prune

# Unstructured pruning — xoá 50% trọng số nhỏ nhất
prune.l1_unstructured(model.layer1, name="weight", amount=0.5)

# Structured pruning — xoá 30% filter kém quan trọng nhất
prune.ln_structured(model.conv1, name="weight", amount=0.3, n=2, dim=0)

# Quy trình: Train → Prune → Fine-tune → (Lặp lại)
for round in range(3):
    train(model, epochs=5)           # Fine-tune phục hồi
    prune.l1_unstructured(model, amount=0.3)  # Cắt thêm`}</CodeBlock>

          <Callout variant="insight" title="Pruning + Quantization = Combo mạnh">
            Kết hợp pruning (giảm số tham số) và{" "}
            <TopicLink slug="quantization">quantization</TopicLink>{" "}(giảm bit/tham số)
            có thể giảm mô hình 10-40x. Ví dụ: pruning 75% + quantize INT4 =
            giảm 16x so với gốc FP32. Bạn cũng có thể kết hợp với{" "}
            <TopicLink slug="distillation">distillation</TopicLink>{" "}để phục hồi chất lượng.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ 6. TÓM TẮT ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về Pruning"
          points={[
            "Pruning loại bỏ trọng số/neuron ít quan trọng — có thể cắt 90% mà chỉ mất <2% chất lượng.",
            "Unstructured: cắt từng trọng số (tỷ lệ cao, cần phần cứng thưa). Structured: cắt toàn bộ neuron/head (tăng tốc thật sự trên GPU tiêu chuẩn).",
            "Quy trình: Huấn luyện → Cắt tỉa → Fine-tune lại → Lặp. Iterative pruning cho kết quả tốt nhất.",
            "Lottery Ticket Hypothesis: mạng lớn chứa mạng con nhỏ đạt hiệu suất tương đương — pruning tìm ra mạng con đó.",
          ]}
        />
      </LessonSection>

      {/* ━━━ 7. QUIZ ━━━ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
