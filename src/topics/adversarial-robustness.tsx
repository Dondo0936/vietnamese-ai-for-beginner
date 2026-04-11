"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "adversarial-robustness",
  title: "Adversarial Robustness",
  titleVi: "Bền vững trước tấn công — AI không dễ bị lừa",
  description:
    "Khả năng của mô hình AI duy trì hiệu suất chính xác khi đối mặt với dữ liệu đầu vào bị thao túng có chủ đích.",
  category: "ai-safety",
  tags: ["adversarial", "robustness", "attack", "defense"],
  difficulty: "advanced",
  relatedSlugs: ["red-teaming", "guardrails", "alignment"],
  vizType: "interactive",
};

const SCENARIOS = [
  { label: "Ảnh gốc", perturbation: 0, prediction: "Mèo (99%)", correct: true },
  { label: "Nhiễu nhẹ (+0.01)", perturbation: 1, prediction: "Mèo (87%)", correct: true },
  { label: "Nhiễu vừa (+0.05)", perturbation: 5, prediction: "Chó (62%)", correct: false },
  { label: "Nhiễu mạnh (+0.1)", perturbation: 10, prediction: "Máy bay (78%)", correct: false },
];

export default function AdversarialRobustnessTopic() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const scenario = SCENARIOS[scenarioIdx];

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang lái xe và gặp biển báo <strong>&quot;DỪNG LẠI&quot;</strong>.
          Bạn dễ dàng nhận ra. Nhưng nếu ai đó dán vài miếng <strong>sticker nhỏ</strong>
          lên biển báo, mắt người vẫn đọc được, nhưng camera AI trên xe tự lái lại nhận thành
          &quot;Tốc độ tối đa 120 km/h&quot;!
        </p>
        <p>
          <strong>Tấn công đối kháng</strong> chính là dán sticker — thay đổi rất nhỏ mà
          con người không nhận ra nhưng khiến AI đưa ra dự đoán sai hoàn toàn.
          <strong> Bền vững đối kháng</strong> là khả năng AI &quot;nhìn xuyên&quot; qua những
          thay đổi lừa đảo này.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {SCENARIOS.map((s, i) => (
              <button
                key={i}
                onClick={() => setScenarioIdx(i)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  scenarioIdx === i
                    ? "bg-accent text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <svg viewBox="0 0 600 200" className="w-full max-w-2xl mx-auto">
            {/* Image placeholder with noise */}
            <rect x={50} y={30} width={120} height={120} rx={10} fill="#3b82f6" opacity={0.3} />
            <text x={110} y={85} textAnchor="middle" fill="white" fontSize={24}>🐱</text>
            {/* Noise dots */}
            {Array.from({ length: scenario.perturbation * 5 }).map((_, i) => (
              <circle
                key={i}
                cx={55 + Math.random() * 110}
                cy={35 + Math.random() * 110}
                r={2}
                fill="#ef4444"
                opacity={0.7}
              />
            ))}
            <text x={110} y={168} textAnchor="middle" fill="#94a3b8" fontSize={10}>
              {scenario.label}
            </text>

            {/* Arrow */}
            <line x1={190} y1={90} x2={260} y2={90} stroke="#475569" strokeWidth={2} />

            {/* Model */}
            <rect x={260} y={55} width={120} height={70} rx={10} fill="#1e293b" stroke="#475569" strokeWidth={2} />
            <text x={320} y={95} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold">Mô hình AI</text>

            {/* Arrow */}
            <line x1={380} y1={90} x2={440} y2={90} stroke="#475569" strokeWidth={2} />

            {/* Prediction */}
            <rect x={440} y={55} width={140} height={70} rx={10} fill={scenario.correct ? "#22c55e" : "#ef4444"} />
            <text x={510} y={85} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">Dự đoán</text>
            <text x={510} y={105} textAnchor="middle" fill="white" fontSize={12} fontWeight="bold">
              {scenario.prediction}
            </text>
          </svg>
          <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
            <p className="text-sm text-muted">
              {scenario.correct
                ? "Mô hình dự đoán đúng — chưa bị ảnh hưởng."
                : "Mô hình bị lừa! Nhiễu nhỏ khiến AI nhận sai hoàn toàn."}
            </p>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Bền vững đối kháng (Adversarial Robustness)</strong> là khả năng mô hình AI
          duy trì dự đoán chính xác khi đầu vào bị thay đổi nhỏ một cách cố ý.
        </p>
        <p>Các phương pháp phòng thủ chính:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Huấn luyện đối kháng:</strong> Đưa các mẫu bị thao túng vào dữ liệu
            huấn luyện để mô hình học cách nhận diện và kháng lại.
          </li>
          <li>
            <strong>Lọc đầu vào:</strong> Phát hiện và loại bỏ nhiễu đối kháng trước khi
            dữ liệu đến mô hình.
          </li>
          <li>
            <strong>Chứng minh bền vững:</strong> Đảm bảo toán học rằng mô hình không thay
            đổi dự đoán trong một phạm vi nhiễu nhất định.
          </li>
        </ol>
        <p>
          Bền vững đối kháng đặc biệt quan trọng trong các ứng dụng an toàn cao như
          <strong> xe tự lái</strong>, <strong>nhận dạng khuôn mặt</strong>,
          và <strong>phát hiện phần mềm độc hại</strong>.
        </p>
      </ExplanationSection>
    </>
  );
}
