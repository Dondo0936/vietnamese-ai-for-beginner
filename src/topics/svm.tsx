"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "svm",
  title: "Support Vector Machine",
  titleVi: "Máy vector hỗ trợ",
  description: "Thuật toán phân loại tìm siêu phẳng có khoảng cách lề lớn nhất giữa hai lớp",
  category: "classic-ml",
  tags: ["classification", "supervised-learning", "kernel"],
  difficulty: "intermediate",
  relatedSlugs: ["logistic-regression", "knn", "decision-trees"],
  vizType: "interactive",
};

const classA = [
  { x: 60, y: 60 }, { x: 80, y: 120 }, { x: 100, y: 80 },
  { x: 130, y: 150 }, { x: 90, y: 180 }, { x: 70, y: 140 },
  { x: 120, y: 100 },
];

const classB = [
  { x: 350, y: 70 }, { x: 370, y: 140 }, { x: 400, y: 100 },
  { x: 380, y: 200 }, { x: 420, y: 160 }, { x: 440, y: 90 },
  { x: 410, y: 230 },
];

export default function SvmTopic() {
  const [margin, setMargin] = useState(60);

  const boundaryX = 230;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn cần vẽ một đường phân chia giữa hai nhóm học sinh đứng trên
          sân trường. Bạn muốn đường phân chia cách đều hai nhóm nhất có thể &mdash; tức
          là tạo ra <strong>lề (margin) lớn nhất</strong>.
        </p>
        <p>
          Những học sinh đứng gần đường phân chia nhất chính là <strong>support
          vectors</strong> &mdash; họ &quot;chống đỡ&quot; vị trí của đường. Nếu dời họ,
          đường sẽ thay đổi.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <p className="mb-3 text-sm text-muted">
          Kéo thanh trượt để thay đổi khoảng cách lề. Quan sát vùng margin giữa hai lớp.
        </p>
        <svg
          viewBox="0 0 500 300"
          className="w-full rounded-lg border border-border bg-background"
        >
          {/* Margin zone */}
          <rect
            x={boundaryX - margin}
            y={0}
            width={margin * 2}
            height={300}
            fill="#8b5cf6"
            opacity={0.08}
          />

          {/* Margin boundaries */}
          <line
            x1={boundaryX - margin} y1={0} x2={boundaryX - margin} y2={300}
            stroke="#8b5cf6" strokeWidth={1} strokeDasharray="4 3" opacity={0.5}
          />
          <line
            x1={boundaryX + margin} y1={0} x2={boundaryX + margin} y2={300}
            stroke="#8b5cf6" strokeWidth={1} strokeDasharray="4 3" opacity={0.5}
          />

          {/* Decision boundary */}
          <line
            x1={boundaryX} y1={0} x2={boundaryX} y2={300}
            stroke="#8b5cf6" strokeWidth={2.5}
          />

          {/* Support vector indicators */}
          <circle cx={130} cy={150} r={9} fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="3 2" />
          <circle cx={350} cy={70} r={9} fill="none" stroke="#ef4444" strokeWidth={2} strokeDasharray="3 2" />

          {/* Class A */}
          {classA.map((p, i) => (
            <circle key={`a-${i}`} cx={p.x} cy={p.y} r={5} fill="#3b82f6" stroke="#fff" strokeWidth={1.5} />
          ))}

          {/* Class B */}
          {classB.map((p, i) => (
            <circle key={`b-${i}`} cx={p.x} cy={p.y} r={5} fill="#ef4444" stroke="#fff" strokeWidth={1.5} />
          ))}

          {/* Labels */}
          <text x={boundaryX} y={290} fontSize={11} fill="#8b5cf6" textAnchor="middle" fontWeight={600}>
            Siêu phẳng
          </text>
          <text x={boundaryX - margin / 2} y={16} fontSize={10} fill="#8b5cf6" textAnchor="middle">
            Margin
          </text>
          <text x={boundaryX + margin / 2} y={16} fontSize={10} fill="#8b5cf6" textAnchor="middle">
            Margin
          </text>
        </svg>
        <div className="mt-4 flex items-center gap-4">
          <label className="text-sm font-medium text-foreground">Khoảng cách lề:</label>
          <input
            type="range"
            min={20}
            max={110}
            value={margin}
            onChange={(e) => setMargin(Number(e.target.value))}
            className="flex-1 accent-accent"
          />
          <span className="w-10 text-center text-sm font-bold text-accent">{margin}px</span>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Support Vector Machine (SVM)</strong> tìm <strong>siêu phẳng (hyperplane)</strong>
          phân chia hai lớp sao cho <strong>khoảng cách lề (margin)</strong> giữa siêu phẳng
          và điểm gần nhất của mỗi lớp là lớn nhất.
        </p>
        <p>
          Điểm mạnh của SVM là <strong>kernel trick</strong>: chiếu dữ liệu lên không gian
          chiều cao hơn để tìm ranh giới phi tuyến, mà không thực sự tính toán trong không
          gian đó. Các kernel phổ biến: RBF, polynomial, sigmoid.
        </p>
        <p>
          SVM hoạt động rất tốt với dữ liệu chiều cao và tập dữ liệu nhỏ-vừa. Tuy nhiên,
          với dữ liệu rất lớn, thời gian huấn luyện có thể chậm so với các phương pháp
          khác như Random Forest hay neural network.
        </p>
      </ExplanationSection>
    </>
  );
}
