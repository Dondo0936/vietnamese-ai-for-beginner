"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "roc-auc",
  title: "ROC & AUC",
  titleVi: "ROC & AUC — Đo khả năng phân biệt",
  description:
    "Đường cong ROC và diện tích AUC đo lường khả năng mô hình phân biệt lớp dương và lớp âm ở mọi ngưỡng quyết định.",
  category: "foundations",
  tags: ["roc", "auc", "classification", "metrics"],
  difficulty: "intermediate",
  relatedSlugs: ["confusion-matrix", "logistic-regression", "bias-variance"],
  vizType: "interactive",
};

const MODELS = [
  { name: "Mô hình tốt", auc: 0.92, points: [[0,0],[0.05,0.4],[0.1,0.65],[0.2,0.82],[0.4,0.93],[0.6,0.97],[1,1]] },
  { name: "Mô hình TB", auc: 0.75, points: [[0,0],[0.1,0.2],[0.25,0.45],[0.4,0.62],[0.6,0.78],[0.8,0.9],[1,1]] },
  { name: "Ngẫu nhiên", auc: 0.50, points: [[0,0],[0.2,0.2],[0.4,0.4],[0.6,0.6],[0.8,0.8],[1,1]] },
];

export default function ROCAUCTopic() {
  const [modelIdx, setModelIdx] = useState(0);
  const model = MODELS[modelIdx];

  const chartW = 300;
  const chartH = 300;
  const ox = 100;
  const oy = 20;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn là <strong>bác sĩ sàng lọc bệnh</strong>. Nếu bạn nói
          &quot;ai cũng bệnh&quot;, bạn không bỏ sót bệnh nhân nào (tốt!) nhưng khám thừa
          rất nhiều người khoẻ (lãng phí!). Nếu bạn quá thận trọng, bạn bỏ sót bệnh nhân thật.
        </p>
        <p>
          Đường cong <strong>ROC</strong> cho thấy sự đánh đổi này ở <em>mọi ngưỡng</em>:
          với mỗi mức &quot;thận trọng&quot;, bạn bắt được bao nhiêu bệnh nhân thật (TPR)
          nhưng cũng báo động giả bao nhiêu (FPR). Đường cong càng cong về góc trên trái
          → mô hình càng giỏi phân biệt bệnh vs khoẻ.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <div className="flex gap-3 justify-center">
            {MODELS.map((m, i) => (
              <button
                key={i}
                onClick={() => setModelIdx(i)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  modelIdx === i ? "bg-accent text-white" : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
          <svg viewBox="0 0 500 370" className="w-full max-w-lg mx-auto">
            {/* Axes */}
            <line x1={ox} y1={oy} x2={ox} y2={oy + chartH} stroke="#475569" strokeWidth={1.5} />
            <line x1={ox} y1={oy + chartH} x2={ox + chartW} y2={oy + chartH} stroke="#475569" strokeWidth={1.5} />

            {/* Diagonal */}
            <line x1={ox} y1={oy + chartH} x2={ox + chartW} y2={oy} stroke="#64748b" strokeWidth={1} strokeDasharray="5,3" />

            {/* ROC Curve */}
            <polyline
              points={model.points.map(([x, y]) => `${ox + x * chartW},${oy + chartH - y * chartH}`).join(" ")}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={3}
            />

            {/* Points */}
            {model.points.map(([x, y], i) => (
              <circle key={i} cx={ox + x * chartW} cy={oy + chartH - y * chartH} r={4} fill="#3b82f6" />
            ))}

            {/* Labels */}
            <text x={ox + chartW / 2} y={oy + chartH + 35} textAnchor="middle" fill="#94a3b8" fontSize={11}>
              Tỷ lệ dương tính giả (FPR)
            </text>
            <text x={ox - 35} y={oy + chartH / 2} textAnchor="middle" fill="#94a3b8" fontSize={11} transform={`rotate(-90, ${ox - 35}, ${oy + chartH / 2})`}>
              Tỷ lệ dương tính đúng (TPR)
            </text>

            {/* AUC */}
            <text x={ox + chartW / 2} y={oy + chartH - 30} textAnchor="middle" fill="#f59e0b" fontSize={14} fontWeight="bold">
              AUC = {model.auc.toFixed(2)}
            </text>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>ROC</strong> (Receiver Operating Characteristic) là đường cong biểu diễn
          mối quan hệ giữa tỷ lệ dương tính đúng (TPR) và tỷ lệ dương tính giả (FPR)
          ở mọi ngưỡng phân loại.
        </p>
        <p>Cách đọc ROC-AUC:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>AUC = 1.0:</strong> Mô hình hoàn hảo — phân biệt đúng 100% mọi trường hợp.</li>
          <li><strong>AUC = 0.5:</strong> Mô hình ngẫu nhiên — không có khả năng phân biệt, như tung đồng xu.</li>
          <li><strong>AUC &gt; 0.8:</strong> Mô hình tốt. AUC &gt; 0.9 là xuất sắc.</li>
        </ol>
        <p>
          ROC-AUC đặc biệt hữu ích khi <strong>dữ liệu mất cân bằng</strong> vì nó đánh giá
          khả năng phân biệt tổng thể, không phụ thuộc vào ngưỡng cố định hay tỷ lệ lớp.
        </p>
      </ExplanationSection>
    </>
  );
}
