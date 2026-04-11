"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "rlhf",
  title: "RLHF",
  titleVi: "RLHF - Học tăng cường từ phản hồi con người",
  description:
    "Kỹ thuật huấn luyện AI phù hợp với giá trị con người thông qua phản hồi và mô hình thưởng.",
  category: "training-optimization",
  tags: ["rlhf", "alignment", "reward-model", "ppo"],
  difficulty: "advanced",
  relatedSlugs: ["dpo", "fine-tuning", "grpo"],
  vizType: "interactive",
};

const STEPS = [
  {
    title: "Bước 1: SFT",
    subtitle: "Supervised Fine-Tuning",
    desc: "Huấn luyện mô hình tuân theo chỉ dẫn bằng dữ liệu do con người viết.",
    color: "#3b82f6",
  },
  {
    title: "Bước 2: Reward Model",
    subtitle: "Huấn luyện mô hình thưởng",
    desc: "Con người xếp hạng nhiều câu trả lời. Mô hình thưởng học từ sở thích này.",
    color: "#f59e0b",
  },
  {
    title: "Bước 3: PPO",
    subtitle: "Tối ưu hóa chính sách",
    desc: "Dùng RL (PPO) để mô hình sinh câu trả lời tối đa hóa điểm thưởng.",
    color: "#22c55e",
  },
];

export default function RLHFTopic() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang <strong>dạy một đầu bếp học việc</strong>:
        </p>
        <p>
          <strong>Bước 1 (SFT):</strong> Cho đầu bếp xem sách dạy nấu ăn với công
          thức mẫu. Đầu bếp học nấu theo công thức.
        </p>
        <p>
          <strong>Bước 2 (Reward Model):</strong> Nhiều khách hàng thử các món và xếp
          hạng: &quot;Món A ngon hơn món B&quot;. Bạn ghi lại sở thích này.
        </p>
        <p>
          <strong>Bước 3 (PPO):</strong> Đầu bếp liên tục thử nấu và nhận phản hồi:
          &quot;Được điểm cao!&quot; hoặc &quot;Chưa ngon lắm&quot;. Dần dần, đầu bếp
          nấu ngày càng hợp khẩu vị!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          {/* Step selector */}
          <div className="flex gap-2 flex-wrap">
            {STEPS.map((s, i) => (
              <button
                key={i}
                onClick={() => setActiveStep(i)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  activeStep === i
                    ? "text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
                style={activeStep === i ? { backgroundColor: s.color } : {}}
              >
                {s.title}
              </button>
            ))}
          </div>

          <svg viewBox="0 0 700 280" className="w-full max-w-3xl mx-auto">
            {/* Pipeline */}
            {STEPS.map((s, i) => {
              const x = 30 + i * 230;
              const isActive = activeStep === i;
              return (
                <g key={i}>
                  <rect x={x} y="30" width="200" height="200" rx="12"
                    fill="#1e293b" stroke={s.color}
                    strokeWidth={isActive ? 2.5 : 1} opacity={isActive ? 1 : 0.4} />
                  <text x={x + 100} y="58" textAnchor="middle" fill={s.color}
                    fontSize="12" fontWeight="bold">{s.title}</text>
                  <text x={x + 100} y="75" textAnchor="middle" fill="#64748b" fontSize="9">
                    {s.subtitle}
                  </text>

                  {/* Step-specific content */}
                  {i === 0 && (
                    <>
                      <rect x={x + 15} y="90" width="170" height="25" rx="4" fill="#334155" />
                      <text x={x + 100} y="107" textAnchor="middle" fill="#94a3b8" fontSize="8">
                        Prompt: &quot;Viết bài thơ&quot;
                      </text>
                      <text x={x + 100} y="130" textAnchor="middle" fill="#475569" fontSize="12">
                        &darr;
                      </text>
                      <rect x={x + 15} y="140" width="170" height="25" rx="4" fill="#334155" />
                      <text x={x + 100} y="157" textAnchor="middle" fill="#94a3b8" fontSize="8">
                        Response mẫu (con người viết)
                      </text>
                      <text x={x + 100} y="185" textAnchor="middle" fill="#475569" fontSize="12">
                        &darr;
                      </text>
                      <text x={x + 100} y="210" textAnchor="middle" fill={s.color} fontSize="9">
                        Mô hình SFT
                      </text>
                    </>
                  )}
                  {i === 1 && (
                    <>
                      <rect x={x + 15} y="90" width="80" height="55" rx="4" fill="#334155" />
                      <text x={x + 55} y="112" textAnchor="middle" fill="#22c55e" fontSize="8">
                        Phản hồi A
                      </text>
                      <text x={x + 55} y="128" textAnchor="middle" fill="#22c55e" fontSize="10">
                        Tốt hơn
                      </text>
                      <rect x={x + 105} y="90" width="80" height="55" rx="4" fill="#334155" />
                      <text x={x + 145} y="112" textAnchor="middle" fill="#ef4444" fontSize="8">
                        Phản hồi B
                      </text>
                      <text x={x + 145} y="128" textAnchor="middle" fill="#ef4444" fontSize="10">
                        Kém hơn
                      </text>
                      <text x={x + 100} y="170" textAnchor="middle" fill="#475569" fontSize="12">
                        &darr;
                      </text>
                      <text x={x + 100} y="195" textAnchor="middle" fill={s.color} fontSize="9">
                        Mô hình thưởng
                      </text>
                      <text x={x + 100} y="210" textAnchor="middle" fill="#94a3b8" fontSize="8">
                        score(response)
                      </text>
                    </>
                  )}
                  {i === 2 && (
                    <>
                      <rect x={x + 25} y="90" width="150" height="30" rx="4" fill="#334155" />
                      <text x={x + 100} y="110" textAnchor="middle" fill="#94a3b8" fontSize="8">
                        Mô hình sinh phản hồi
                      </text>
                      <text x={x + 100} y="135" textAnchor="middle" fill="#475569" fontSize="8">
                        &darr; Reward Model chấm điểm
                      </text>
                      <rect x={x + 25} y="145" width="150" height="30" rx="4" fill="#334155" />
                      <text x={x + 100} y="164" textAnchor="middle" fill="#22c55e" fontSize="8">
                        PPO cập nhật trọng số
                      </text>
                      <text x={x + 100} y="195" textAnchor="middle" fill="#f59e0b" fontSize="20">
                        &#x21bb;
                      </text>
                      <text x={x + 100} y="215" textAnchor="middle" fill="#94a3b8" fontSize="8">
                        Lặp lại nhiều lần
                      </text>
                    </>
                  )}

                  {/* Arrow between steps */}
                  {i < 2 && (
                    <line x1={x + 200} y1="130" x2={x + 230} y2="130"
                      stroke="#475569" strokeWidth="2" markerEnd="url(#arrow-rlhf)" />
                  )}
                </g>
              );
            })}

            <defs>
              <marker id="arrow-rlhf" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#475569" />
              </marker>
            </defs>
          </svg>

          <div className="rounded-lg bg-background/50 border border-border p-4">
            <p className="text-sm font-medium" style={{ color: STEPS[activeStep].color }}>
              {STEPS[activeStep].title}: {STEPS[activeStep].subtitle}
            </p>
            <p className="text-xs text-muted mt-1">{STEPS[activeStep].desc}</p>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>RLHF (Reinforcement Learning from Human Feedback)</strong> là phương
          pháp huấn luyện AI phù hợp với giá trị và sở thích con người, được sử dụng
          bởi ChatGPT, Claude và các LLM hàng đầu.
        </p>
        <p>Quy trình 3 bước:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>SFT:</strong> Huấn luyện mô hình trên dữ liệu (prompt, response) do
            con người viết, giúp mô hình học cách tuân theo chỉ dẫn.
          </li>
          <li>
            <strong>Reward Model:</strong> Con người so sánh và xếp hạng nhiều câu trả
            lời. Một mô hình thưởng được huấn luyện để dự đoán sở thích con người.
          </li>
          <li>
            <strong>PPO (Proximal Policy Optimization):</strong> Mô hình ngôn ngữ được
            tối ưu hóa bằng RL để tối đa hóa điểm từ reward model, với ràng buộc
            KL-divergence để không đi quá xa mô hình SFT.
          </li>
        </ol>
        <p>
          RLHF giúp mô hình trở nên <strong>hữu ích</strong>, <strong>trung thực</strong>{" "}
          và <strong>an toàn</strong> hơn. Tuy nhiên, quá trình này tốn kém vì cần
          nhiều phản hồi từ con người và ổn định thuật toán RL.
        </p>
      </ExplanationSection>
    </>
  );
}
