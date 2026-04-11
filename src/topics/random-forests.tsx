"use client";

import { useState, useMemo } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "random-forests",
  title: "Random Forests",
  titleVi: "Rừng ngẫu nhiên",
  description: "Kết hợp nhiều cây quyết định để tạo mô hình mạnh mẽ và ổn định hơn",
  category: "classic-ml",
  tags: ["ensemble", "classification", "bagging"],
  difficulty: "intermediate",
  relatedSlugs: ["decision-trees", "gradient-boosting", "bias-variance"],
  vizType: "interactive",
};

const treeVotes = [
  { id: 1, vote: "A", confidence: 0.8 },
  { id: 2, vote: "B", confidence: 0.6 },
  { id: 3, vote: "A", confidence: 0.9 },
  { id: 4, vote: "A", confidence: 0.7 },
  { id: 5, vote: "B", confidence: 0.5 },
  { id: 6, vote: "A", confidence: 0.85 },
  { id: 7, vote: "B", confidence: 0.75 },
];

export default function RandomForestsTopic() {
  const [activeTrees, setActiveTrees] = useState<Set<number>>(
    new Set(treeVotes.map((t) => t.id))
  );

  const toggleTree = (id: number) => {
    setActiveTrees((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const result = useMemo(() => {
    const active = treeVotes.filter((t) => activeTrees.has(t.id));
    const countA = active.filter((t) => t.vote === "A").length;
    const countB = active.filter((t) => t.vote === "B").length;
    return { countA, countB, total: active.length, winner: countA >= countB ? "A" : "B" };
  }, [activeTrees]);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn hỏi ý kiến của <strong>nhiều chuyên gia</strong> trước khi
          quyết định. Mỗi chuyên gia có thể sai, nhưng nếu đa số đồng ý một đáp án, đáp
          án đó nhiều khả năng đúng hơn ý kiến của một người duy nhất.
        </p>
        <p>
          <strong>Rừng ngẫu nhiên</strong> tạo ra nhiều cây quyết định, mỗi cây được huấn
          luyện trên tập con ngẫu nhiên của dữ liệu. Kết quả cuối cùng là phiếu bầu đa số
          từ tất cả các cây.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <p className="mb-3 text-sm text-muted">
          Nhấp vào từng cây để bật/tắt. Quan sát kết quả bỏ phiếu thay đổi.
        </p>
        <svg
          viewBox="0 0 500 300"
          className="w-full rounded-lg border border-border bg-background"
        >
          {/* Trees */}
          {treeVotes.map((tree, i) => {
            const x = 40 + i * 65;
            const active = activeTrees.has(tree.id);
            const color = tree.vote === "A" ? "#3b82f6" : "#ef4444";

            return (
              <g
                key={tree.id}
                className="cursor-pointer"
                onClick={() => toggleTree(tree.id)}
                opacity={active ? 1 : 0.25}
              >
                {/* Tree trunk */}
                <rect x={x - 3} y={120} width={6} height={30} fill="#92400e" rx={2} />
                {/* Tree crown */}
                <polygon
                  points={`${x},60 ${x - 25},120 ${x + 25},120`}
                  fill="#22c55e"
                  stroke="#166534"
                  strokeWidth={1}
                />
                {/* Vote label */}
                <circle cx={x} cy={90} r={12} fill={color} opacity={0.9} />
                <text x={x} y={95} fontSize={12} fill="white" textAnchor="middle" fontWeight={700}>
                  {tree.vote}
                </text>
                {/* Tree number */}
                <text x={x} y={170} fontSize={10} fill="currentColor" className="text-muted" textAnchor="middle">
                  Cây {tree.id}
                </text>
              </g>
            );
          })}

          {/* Arrow */}
          <line x1={250} y1={185} x2={250} y2={210} stroke="currentColor" className="text-muted" strokeWidth={2} markerEnd="url(#arrowhead)" />
          <defs>
            <marker id="arrowhead" markerWidth={10} markerHeight={7} refX={9} refY={3.5} orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#888" />
            </marker>
          </defs>

          {/* Result box */}
          <rect x={150} y={220} width={200} height={60} rx={12} fill={result.winner === "A" ? "#3b82f6" : "#ef4444"} opacity={0.15}
            stroke={result.winner === "A" ? "#3b82f6" : "#ef4444"} strokeWidth={2} />
          <text x={250} y={245} fontSize={14} fill={result.winner === "A" ? "#3b82f6" : "#ef4444"} textAnchor="middle" fontWeight={700}>
            Kết quả: {result.winner}
          </text>
          <text x={250} y={268} fontSize={11} fill="currentColor" className="text-muted" textAnchor="middle">
            A: {result.countA} phiếu | B: {result.countB} phiếu ({result.total} cây)
          </text>
        </svg>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Rừng ngẫu nhiên (Random Forest)</strong> là kỹ thuật <strong>ensemble</strong>
          kết hợp nhiều cây quyết định để cải thiện độ chính xác và giảm overfitting.
        </p>
        <p>
          Mỗi cây được huấn luyện trên một <strong>tập bootstrap</strong> (lấy mẫu có hoàn
          lại) của dữ liệu, và tại mỗi lần chia nhánh chỉ xem xét <strong>tập con ngẫu
          nhiên</strong> các đặc trưng. Hai yếu tố ngẫu nhiên này làm các cây đa dạng hơn.
        </p>
        <p>
          Kết quả cuối cùng được quyết định bằng <strong>bỏ phiếu đa số</strong> (phân loại)
          hoặc <strong>trung bình</strong> (hồi quy). Random Forest thường cho kết quả tốt
          &quot;ngay lập tức&quot; mà không cần nhiều điều chỉnh siêu tham số.
        </p>
      </ExplanationSection>
    </>
  );
}
