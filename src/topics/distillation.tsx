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
  slug: "distillation",
  title: "Knowledge Distillation",
  titleVi: "Chưng cất kiến thức",
  description:
    "Kỹ thuật chuyển giao kiến thức từ mô hình lớn (teacher) sang mô hình nhỏ (student) hiệu quả hơn.",
  category: "training-optimization",
  tags: ["distillation", "compression", "teacher-student", "efficiency"],
  difficulty: "intermediate",
  relatedSlugs: ["pruning", "quantization", "fine-tuning"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

const WORDS = ["mèo", "chó", "thỏ", "cá"];
const TEACHER_PROBS = [0.7, 0.15, 0.1, 0.05];

const QUIZ: QuizQuestion[] = [
  {
    question: "Tại sao student học từ soft labels tốt hơn hard labels?",
    options: [
      "Soft labels có nhiều dữ liệu hơn",
      "Soft labels chứa 'dark knowledge' — mối quan hệ giữa các lớp mà hard labels không có",
      "Soft labels nhanh hơn khi huấn luyện",
      "Soft labels không bao giờ sai",
    ],
    correct: 1,
    explanation:
      "Hard label chỉ nói 'đây là mèo'. Soft label nói '70% mèo, 15% chó, 10% thỏ' — student học được rằng mèo và chó có đặc điểm tương tự nhau. Thông tin này (dark knowledge) rất quý giá.",
  },
  {
    question: "Temperature T trong distillation có vai trò gì?",
    options: [
      "T cao làm phân bố mềm hơn, tiết lộ nhiều dark knowledge hơn",
      "T cao làm phân bố sắc nét hơn",
      "T không ảnh hưởng đến kết quả",
      "T chỉ ảnh hưởng đến tốc độ huấn luyện",
    ],
    correct: 0,
    explanation:
      "Khi T = 1: phân bố sắc nét (gần hard label). Khi T cao (4-20): phân bố phẳng hơn, tiết lộ nhiều mối quan hệ giữa các lớp. T quá cao thì tín hiệu yếu — thường T = 3-10 là tốt nhất.",
  },
  {
    question: "DistilBERT nhỏ hơn BERT bao nhiêu mà vẫn giữ được bao nhiêu hiệu suất?",
    options: [
      "Nhỏ hơn 40%, giữ 97% hiệu suất",
      "Nhỏ hơn 10%, giữ 99% hiệu suất",
      "Nhỏ hơn 80%, giữ 60% hiệu suất",
      "Nhỏ hơn 50%, giữ 50% hiệu suất",
    ],
    correct: 0,
    explanation:
      "DistilBERT có 66M tham số (so với BERT 110M = giảm 40%), chạy nhanh hơn 60%, mà vẫn giữ 97% hiệu suất. Đây là ví dụ kinh điển về sức mạnh của distillation.",
  },
  {
    type: "fill-blank",
    question:
      "Trong knowledge distillation, mô hình lớn đóng vai {blank} sinh ra soft labels để mô hình nhỏ hơn, gọi là {blank}, học theo.",
    blanks: [
      { answer: "teacher", accept: ["giáo viên", "thầy"] },
      { answer: "student", accept: ["học sinh", "trò"] },
    ],
    explanation:
      "Teacher (lớn, chính xác) chạy inference tạo soft labels chứa dark knowledge. Student (nhỏ, nhanh) học từ cả soft labels lẫn hard labels — bắt chước không chỉ đáp án mà cả quá trình suy luận của teacher.",
  },
];

export default function DistillationTopic() {
  const [temperature, setTemperature] = useState(4);

  const softLabels = useMemo(() => {
    const logits = TEACHER_PROBS.map(p => Math.log(p + 1e-10) / temperature);
    const maxLogit = Math.max(...logits);
    const exps = logits.map(l => Math.exp(l - maxLogit));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / sum);
  }, [temperature]);

  return (
    <>
      {/* ━━━ 1. HOOK ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Mô hình GPT-4 rất giỏi nhưng quá lớn để chạy trên điện thoại. Cách nào tốt nhất để tạo phiên bản nhỏ?"
          options={[
            "Xoá bớt lớp và tham số ngẫu nhiên",
            "Dạy mô hình nhỏ bắt chước cách suy nghĩ của mô hình lớn — không chỉ đáp án mà cả quá trình suy luận",
            "Huấn luyện mô hình nhỏ từ đầu trên cùng dữ liệu",
          ]}
          correct={1}
          explanation="Knowledge Distillation: mô hình lớn (teacher) 'dạy' mô hình nhỏ (student) bằng cách chia sẻ quá trình suy luận (soft labels), không chỉ đáp án đúng/sai."
        >
          <p className="text-sm text-muted mt-2">
            Bí quyết nằm ở dark knowledge — kiến thức ẩn trong cách teacher suy nghĩ.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ 2. TRỰC QUAN HOÁ ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Soft Labels thay đổi theo nhiệt độ
          </h3>
          <p className="text-sm text-muted mb-4">
            Kéo thanh trượt nhiệt độ T và quan sát phân bố xác suất thay đổi.
          </p>

          <div className="space-y-1 max-w-lg mx-auto mb-4">
            <label className="text-sm text-muted">
              Nhiệt độ chưng cất T = <strong className="text-foreground">{temperature}</strong>
            </label>
            <input type="range" min={1} max={20} step={1} value={temperature}
              onChange={e => setTemperature(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-surface accent-accent cursor-pointer" />
            <div className="flex justify-between text-xs text-muted">
              <span>T=1 (sắc nét)</span><span>T=20 (rất mềm)</span>
            </div>
          </div>

          <svg viewBox="0 0 700 220" className="w-full max-w-3xl mx-auto mb-4">
            {/* Teacher (hard) */}
            <text x="120" y="18" textAnchor="middle" fill="#3b82f6" fontSize="11" fontWeight="bold">
              Teacher (Hard)
            </text>
            {TEACHER_PROBS.map((p, i) => {
              const barW = p * 180;
              return (
                <g key={`t-${i}`}>
                  <rect x="30" y={30 + i * 45} width={barW} height="28" rx="4" fill="#3b82f6" opacity={0.75} />
                  <text x={40 + barW} y={49 + i * 45} fill="#3b82f6" fontSize="10" fontWeight="bold">
                    {WORDS[i]}: {(p * 100).toFixed(0)}%
                  </text>
                </g>
              );
            })}

            {/* Arrow */}
            <text x="350" y="110" textAnchor="middle" fill="var(--text-tertiary)" fontSize="14">
              T={temperature}
            </text>
            <line x1="280" y1="110" x2="420" y2="110" stroke="var(--text-tertiary)" strokeWidth="2" markerEnd="url(#arr-dist)" />

            {/* Soft labels */}
            <text x="580" y="18" textAnchor="middle" fill="#f59e0b" fontSize="11" fontWeight="bold">
              Soft Labels (T={temperature})
            </text>
            {softLabels.map((p, i) => {
              const barW = p * 180;
              return (
                <g key={`s-${i}`}>
                  <rect x="490" y={30 + i * 45} width={barW} height="28" rx="4" fill="#f59e0b" opacity={0.75} />
                  <text x={500 + barW} y={49 + i * 45} fill="#f59e0b" fontSize="10" fontWeight="bold">
                    {WORDS[i]}: {(p * 100).toFixed(1)}%
                  </text>
                </g>
              );
            })}

            <defs>
              <marker id="arr-dist" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="var(--text-tertiary)" />
              </marker>
            </defs>
          </svg>

          <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
            <p className="text-sm text-muted">
              {temperature <= 3
                ? "Nhiệt độ thấp: Soft labels gần giống hard labels — student học ít dark knowledge."
                : temperature <= 10
                  ? "Nhiệt độ vừa: Phân bố mềm hơn — student học được mối quan hệ giữa các lớp."
                  : "Nhiệt độ cao: Phân bố rất phẳng — nhiều dark knowledge nhưng tín hiệu yếu."}
            </p>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ 3. AHA MOMENT ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          Khi teacher nói &quot;70% mèo, 15% chó, 10% thỏ&quot;, student không chỉ biết
          đáp án là mèo — mà còn biết <strong>mèo và chó giống nhau hơn mèo và cá</strong>.
          Thông tin &quot;ẩn&quot; này (<strong>dark knowledge</strong>) chính là lý do
          distillation hiệu quả hơn dạy bằng hard label thông thường.
        </AhaMoment>
      </LessonSection>

      {/* ━━━ 4. THÁCH THỨC ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Teacher cho soft label: [0.8, 0.15, 0.04, 0.01]. Hard label là [1, 0, 0, 0]. Thông tin gì bị mất khi dùng hard label?"
          options={[
            "Hard label vẫn giữ đủ thông tin",
            "Mất thông tin về mối quan hệ: lớp 2 gần lớp 1 hơn lớp 3 và lớp 4",
            "Hard label mất thông tin về tốc độ huấn luyện",
            "Hard label chỉ mất 20% thông tin",
          ]}
          correct={1}
          explanation="Hard label [1,0,0,0] nói 'chắc chắn là lớp 1, còn lại đều sai'. Soft label cho biết thêm: lớp 2 (15%) tương tự lớp 1 hơn lớp 3 (4%) hay lớp 4 (1%). Dark knowledge quý giá này giúp student tổng quát hoá tốt hơn."
        />
      </LessonSection>

      {/* ━━━ 5. GIẢI THÍCH SÂU ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Knowledge Distillation</strong>{" "}(Hinton et al., 2015) huấn luyện student
            trên hỗn hợp hard label và soft label từ teacher. Đây là một lựa chọn nén
            mô hình thay thế cho <TopicLink slug="quantization">quantization</TopicLink>{" "}
            và <TopicLink slug="pruning">pruning</TopicLink>:
          </p>

          <LaTeX block>{"\\mathcal{L} = \\alpha \\cdot \\mathcal{L}_{\\text{CE}}(y, \\hat{y}_s) + (1-\\alpha) \\cdot T^2 \\cdot D_{\\text{KL}}(\\sigma(z_t/T) \\| \\sigma(z_s/T))"}</LaTeX>

          <p>
            Trong đó <LaTeX>{"T"}</LaTeX> là temperature, <LaTeX>{"z_t, z_s"}</LaTeX> là logits
            của teacher và student, <LaTeX>{"\\alpha"}</LaTeX> cân bằng giữa hard và soft loss.
            Nhân <LaTeX>{"T^2"}</LaTeX> để gradient không bị thu nhỏ khi T tăng.
          </p>

          <p>Quy trình distillation:</p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>Teacher dự đoán:</strong>{" "}Mô hình lớn chạy inference trên tập huấn luyện, tạo soft labels.
            </li>
            <li>
              <strong>Làm mềm phân bố:</strong>{" "}Chia logits cho T trước softmax — T cao = phân bố phẳng hơn.
            </li>
            <li>
              <strong>Student học:</strong>{" "}Huấn luyện trên cả hard labels (ground truth) và soft labels (teacher).
            </li>
          </ul>

          <CodeBlock language="python" title="distillation.py">{`import torch.nn.functional as F

def distillation_loss(student_logits, teacher_logits, labels, T=4, alpha=0.5):
    # Soft loss — KL divergence giữa soft predictions
    soft_loss = F.kl_div(
        F.log_softmax(student_logits / T, dim=-1),
        F.softmax(teacher_logits / T, dim=-1),
        reduction="batchmean",
    ) * (T ** 2)  # Nhân T^2 để bù gradient

    # Hard loss — Cross-entropy với ground truth
    hard_loss = F.cross_entropy(student_logits, labels)

    return alpha * hard_loss + (1 - alpha) * soft_loss`}</CodeBlock>

          <Callout variant="insight" title="Distillation trong thời đại LLM">
            Ngoài logit distillation cổ điển, LLM dùng nhiều kỹ thuật mới:
            synthetic data (teacher sinh dữ liệu cho student), chain-of-thought
            distillation (dạy cả quá trình suy luận), và API distillation
            (dùng GPT-4 API để <TopicLink slug="fine-tuning">fine-tune</TopicLink>{" "}
            mô hình nhỏ).
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ 6. TÓM TẮT ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về Knowledge Distillation"
          points={[
            "Distillation dạy mô hình nhỏ (student) bắt chước mô hình lớn (teacher) qua soft labels — không chỉ đáp án mà cả quá trình suy luận.",
            "Dark knowledge: thông tin ẩn trong xác suất nhỏ (15% chó, 10% thỏ) giúp student tổng quát hoá tốt hơn hard labels.",
            "Temperature T kiểm soát độ mềm: T thấp (1-3) = sắc nét, T vừa (4-10) = cân bằng tốt nhất, T cao (>10) = quá mềm.",
            "DistilBERT: nhỏ hơn 40%, nhanh hơn 60%, giữ 97% hiệu suất — minh chứng sức mạnh của distillation.",
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
