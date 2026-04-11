"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
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

export default function DistillationTopic() {
  const [temperature, setTemperature] = useState(4);
  const [step, setStep] = useState(0);

  const teacherProbs = [0.7, 0.15, 0.1, 0.05];
  const softProbs = teacherProbs.map((p) => {
    const logit = Math.log(p + 1e-10) / temperature;
    return logit;
  });
  const maxLogit = Math.max(...softProbs);
  const exps = softProbs.map((l) => Math.exp(l - maxLogit));
  const sumExps = exps.reduce((a, b) => a + b, 0);
  const softLabels = exps.map((e) => e / sumExps);

  const WORDS = ["mèo", "chó", "thỏ", "cá"];

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng một <strong>giáo sư đại học</strong> (Teacher model &mdash;
          mô hình lớn) đang dạy cho một <strong>sinh viên thông minh</strong>
          (Student model &mdash; mô hình nhỏ).
        </p>
        <p>
          Giáo sư không chỉ dạy đáp án đúng (hard label: &quot;Đây là mèo&quot;), mà
          còn chia sẻ <strong>quá trình suy nghĩ</strong> (soft label: &quot;70% là mèo,
          15% giống chó, 10% có thể là thỏ&quot;).
        </p>
        <p>
          Nhờ học từ &quot;kinh nghiệm suy nghĩ&quot; của giáo sư, sinh viên nhỏ bé
          có thể đạt kết quả <strong>gần bằng giáo sư</strong> mà chỉ cần{" "}
          <strong>ít tài nguyên hơn nhiều</strong>!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          {/* Temperature control */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted">
              Nhiệt độ chưng cất (T): {temperature}
            </label>
            <input type="range" min="1" max="20" step="1" value={temperature}
              onChange={(e) => setTemperature(parseInt(e.target.value))}
              className="w-full accent-accent" />
            <div className="flex justify-between text-xs text-muted">
              <span>T=1 (Hard labels)</span>
              <span>T=20 (Rất mềm)</span>
            </div>
          </div>

          {/* Step buttons */}
          <div className="flex gap-2">
            {["Teacher dự đoán", "Soft labels", "Student học"].map((label, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  step === i
                    ? "bg-accent text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <svg viewBox="0 0 700 280" className="w-full max-w-3xl mx-auto">
            {/* Teacher */}
            <rect x="20" y="20" width="200" height="240" rx="12" fill="#1e293b"
              stroke="#3b82f6" strokeWidth={step === 0 ? 2.5 : 1} opacity={step >= 0 ? 1 : 0.4} />
            <text x="120" y="48" textAnchor="middle" fill="#3b82f6" fontSize="12" fontWeight="bold">
              Teacher (Lớn)
            </text>
            <text x="120" y="65" textAnchor="middle" fill="#64748b" fontSize="8">
              70B tham số
            </text>

            {teacherProbs.map((p, i) => {
              const barW = p * 150;
              return (
                <g key={i}>
                  <rect x="35" y={80 + i * 40} width={barW} height="20" rx="4" fill="#3b82f6" opacity={0.7} />
                  <text x="35" y={95 + i * 40} fill="white" fontSize="8" dx="4">
                    {WORDS[i]}: {(p * 100).toFixed(0)}%
                  </text>
                </g>
              );
            })}

            {/* Arrow to soft labels */}
            <line x1="220" y1="140" x2="260" y2="140" stroke="#475569" strokeWidth="2" markerEnd="url(#arrow-dist)" />
            <text x="240" y="130" textAnchor="middle" fill="#f59e0b" fontSize="8">T={temperature}</text>

            {/* Soft labels */}
            <rect x="260" y="20" width="180" height="240" rx="12" fill="#1e293b"
              stroke="#f59e0b" strokeWidth={step === 1 ? 2.5 : 1} opacity={step >= 1 ? 1 : 0.4} />
            <text x="350" y="48" textAnchor="middle" fill="#f59e0b" fontSize="12" fontWeight="bold">
              Soft Labels
            </text>
            <text x="350" y="65" textAnchor="middle" fill="#64748b" fontSize="8">
              (Phân bố mềm)
            </text>

            {softLabels.map((p, i) => {
              const barW = p * 140;
              return (
                <g key={i}>
                  <rect x="275" y={80 + i * 40} width={barW} height="20" rx="4" fill="#f59e0b" opacity={0.7} />
                  <text x="275" y={95 + i * 40} fill="white" fontSize="8" dx="4">
                    {WORDS[i]}: {(p * 100).toFixed(1)}%
                  </text>
                </g>
              );
            })}

            {/* Arrow to student */}
            <line x1="440" y1="140" x2="480" y2="140" stroke="#475569" strokeWidth="2" markerEnd="url(#arrow-dist)" />

            {/* Student */}
            <rect x="480" y="40" width="200" height="200" rx="12" fill="#1e293b"
              stroke="#22c55e" strokeWidth={step === 2 ? 2.5 : 1} opacity={step >= 2 ? 1 : 0.4} />
            <text x="580" y="68" textAnchor="middle" fill="#22c55e" fontSize="12" fontWeight="bold">
              Student (Nhỏ)
            </text>
            <text x="580" y="85" textAnchor="middle" fill="#64748b" fontSize="8">
              7B tham số
            </text>

            <text x="580" y="120" textAnchor="middle" fill="#94a3b8" fontSize="9">
              Học từ soft labels
            </text>
            <text x="580" y="140" textAnchor="middle" fill="#94a3b8" fontSize="9">
              của Teacher
            </text>
            <text x="580" y="170" textAnchor="middle" fill="#22c55e" fontSize="10" fontWeight="bold">
              Nhỏ 10x
            </text>
            <text x="580" y="190" textAnchor="middle" fill="#22c55e" fontSize="10" fontWeight="bold">
              Nhanh 5x
            </text>
            <text x="580" y="210" textAnchor="middle" fill="#22c55e" fontSize="10" fontWeight="bold">
              Chất lượng ~95%
            </text>

            <defs>
              <marker id="arrow-dist" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#475569" />
              </marker>
            </defs>
          </svg>

          <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
            <p className="text-sm text-muted">
              {temperature <= 3
                ? "Nhiệt độ thấp: Soft labels gần giống hard labels. Student học ít kiến thức ẩn."
                : temperature <= 10
                  ? "Nhiệt độ vừa: Phân bố mềm hơn, Student học được mối quan hệ giữa các lớp."
                  : "Nhiệt độ cao: Phân bố rất phẳng, Student học nhiều kiến thức ẩn nhưng tín hiệu yếu."}
            </p>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Knowledge Distillation</strong> (Chưng cất kiến thức) là kỹ thuật nén
          mô hình bằng cách huấn luyện một mô hình nhỏ (student) bắt chước phân bố
          đầu ra của mô hình lớn (teacher).
        </p>
        <p>Quy trình distillation:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Teacher dự đoán:</strong> Mô hình lớn đã huấn luyện tạo ra phân bố
            xác suất (soft predictions) cho dữ liệu huấn luyện.
          </li>
          <li>
            <strong>Soft labels:</strong> Phân bố được làm mềm bằng temperature cao,
            tiết lộ kiến thức ẩn (dark knowledge) giữa các lớp.
          </li>
          <li>
            <strong>Student học:</strong> Mô hình nhỏ được huấn luyện trên cả hard labels
            (ground truth) và soft labels từ teacher.
          </li>
        </ol>
        <p>
          Ví dụ điển hình: DistilBERT nhỏ hơn BERT <strong>40%</strong> nhưng giữ lại{" "}
          <strong>97%</strong> hiệu suất. Distillation là nền tảng cho việc triển khai
          AI trên thiết bị di động và edge.
        </p>
      </ExplanationSection>
    </>
  );
}
