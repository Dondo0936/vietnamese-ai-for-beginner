"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "world-models",
  title: "World Models",
  titleVi: "Mô hình thế giới — AI biết tưởng tượng",
  description:
    "Mô hình AI xây dựng biểu diễn nội tại về thế giới, có thể dự đoán hậu quả hành động trước khi thực hiện.",
  category: "emerging",
  tags: ["world-model", "simulation", "prediction", "planning"],
  difficulty: "advanced",
  relatedSlugs: ["reasoning-models", "planning", "text-to-video"],
  vizType: "interactive",
};

const SCENARIOS = [
  { action: "Đẩy cốc ra mép bàn", prediction: "Cốc rơi xuống đất và vỡ", physics: true },
  { action: "Mở cửa sổ khi trời mưa", prediction: "Nước mưa bay vào phòng", physics: true },
  { action: "Thả bóng lên trời", prediction: "Bóng bay lên rồi rơi xuống", physics: true },
];

export default function WorldModelsTopic() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const scenario = SCENARIOS[scenarioIdx];

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang lái xe và nhìn thấy trẻ em chơi bóng gần đường.
          Trước khi quả bóng lăn ra đường, bạn đã <strong>tưởng tượng trước</strong> kịch bản:
          &quot;Bóng có thể lăn ra → trẻ có thể chạy theo → nguy hiểm!&quot; — nên bạn giảm tốc.
        </p>
        <p>
          Bạn không cần <em>đã chứng kiến</em> tai nạn tương tự — bộ não bạn có
          <strong> mô hình thế giới</strong> giúp bạn <strong>dự đoán hậu quả</strong>
          trước khi sự việc xảy ra. AI cũng cần khả năng &quot;tưởng tượng&quot; tương tự.
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
                  scenarioIdx === i ? "bg-accent text-white" : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {s.action}
              </button>
            ))}
          </div>
          <svg viewBox="0 0 600 160" className="w-full max-w-2xl mx-auto">
            {/* Action */}
            <rect x={20} y={40} width={160} height={50} rx={10} fill="#3b82f6" />
            <text x={100} y={60} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">Hành động</text>
            <text x={100} y={78} textAnchor="middle" fill="#bfdbfe" fontSize={8}>
              {scenario.action.length > 22 ? scenario.action.slice(0, 22) + "..." : scenario.action}
            </text>

            {/* World Model */}
            <line x1={180} y1={65} x2={230} y2={65} stroke="#475569" strokeWidth={2} />
            <rect x={230} y={30} width={140} height={70} rx={12} fill="#1e293b" stroke="#f59e0b" strokeWidth={2} />
            <text x={300} y={58} textAnchor="middle" fill="#f59e0b" fontSize={10} fontWeight="bold">Mô hình</text>
            <text x={300} y={75} textAnchor="middle" fill="#f59e0b" fontSize={10} fontWeight="bold">Thế giới</text>

            {/* Prediction */}
            <line x1={370} y1={65} x2={420} y2={65} stroke="#475569" strokeWidth={2} />
            <rect x={420} y={35} width={160} height={60} rx={10} fill="#22c55e" />
            <text x={500} y={55} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">Dự đoán</text>
            <text x={500} y={75} textAnchor="middle" fill="#bbf7d0" fontSize={8}>
              {scenario.prediction.length > 25 ? scenario.prediction.slice(0, 25) + "..." : scenario.prediction}
            </text>
          </svg>
          <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
            <p className="text-sm text-muted">
              Mô hình thế giới dự đoán: <strong>{scenario.prediction}</strong>
            </p>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>World Models</strong> (Mô hình thế giới) là AI có khả năng xây dựng
          biểu diễn nội tại về thế giới vật lý và xã hội, cho phép dự đoán hậu quả
          của hành động mà <strong>không cần thực sự thực hiện</strong>.
        </p>
        <p>Ba khả năng cốt lõi:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Hiểu vật lý:</strong> Trọng lực, va chạm, quán tính — dự đoán vật thể di chuyển thế nào.</li>
          <li><strong>Lập kế hoạch trong tưởng tượng:</strong> Thử nhiều phương án trong &quot;đầu&quot; trước khi hành động, chọn phương án tốt nhất.</li>
          <li><strong>Tổng quát hoá:</strong> Áp dụng hiểu biết từ tình huống này sang tình huống khác chưa gặp.</li>
        </ol>
        <p>
          World Models là thành phần quan trọng cho <strong>xe tự lái</strong>,
          <strong> robot</strong>, và <strong>AI tổng quát</strong>. Đây được coi là bước tiến
          hướng tới AI thực sự &quot;hiểu&quot; thế giới thay vì chỉ nhận dạng mẫu.
        </p>
      </ExplanationSection>
    </>
  );
}
