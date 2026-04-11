"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "decision-trees",
  title: "Decision Trees",
  titleVi: "Cây quyết định",
  description: "Mô hình phân loại bằng chuỗi câu hỏi có/không tạo thành cấu trúc cây",
  category: "classic-ml",
  tags: ["classification", "supervised-learning", "interpretable"],
  difficulty: "beginner",
  relatedSlugs: ["random-forests", "gradient-boosting", "bias-variance"],
  vizType: "interactive",
};

type NodeState = "idle" | "yes" | "no";

interface TreeNode {
  id: string;
  question: string;
  x: number;
  y: number;
  yesChild?: string;
  noChild?: string;
  label?: string;
}

const treeNodes: TreeNode[] = [
  { id: "root", question: "Trời mưa?", x: 250, y: 40, yesChild: "n1", noChild: "n2" },
  { id: "n1", question: "Có ô?", x: 130, y: 130, yesChild: "l1", noChild: "l2" },
  { id: "n2", question: "Nóng > 35°C?", x: 370, y: 130, yesChild: "l3", noChild: "l4" },
  { id: "l1", x: 70, y: 220, question: "", label: "Đi chơi" },
  { id: "l2", x: 190, y: 220, question: "", label: "Ở nhà" },
  { id: "l3", x: 310, y: 220, question: "", label: "Bơi" },
  { id: "l4", x: 430, y: 220, question: "", label: "Đi chơi" },
];

export default function DecisionTreesTopic() {
  const [decisions, setDecisions] = useState<Record<string, NodeState>>({});

  const handleClick = (nodeId: string) => {
    setDecisions((prev) => {
      const current = prev[nodeId] || "idle";
      const next: NodeState = current === "idle" ? "yes" : current === "yes" ? "no" : "idle";
      const updated = { ...prev, [nodeId]: next };
      // Clear child decisions when parent changes
      const node = treeNodes.find((n) => n.id === nodeId);
      if (node?.yesChild) delete updated[node.yesChild];
      if (node?.noChild) delete updated[node.noChild];
      return updated;
    });
  };

  const isActive = (nodeId: string): boolean => {
    if (nodeId === "root") return true;
    const parent = treeNodes.find(
      (n) => n.yesChild === nodeId || n.noChild === nodeId
    );
    if (!parent) return false;
    const parentDecision = decisions[parent.id];
    if (parentDecision === "yes" && parent.yesChild === nodeId) return isActive(parent.id);
    if (parentDecision === "no" && parent.noChild === nodeId) return isActive(parent.id);
    return false;
  };

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang chơi trò <strong>&quot;20 câu hỏi&quot;</strong>. Bạn hỏi lần
          lượt các câu hỏi Có/Không để thu hẹp đáp án. Ví dụ: &quot;Nó có phải động vật
          không?&quot; &rarr; &quot;Nó sống trên cạn không?&quot; &rarr; &quot;Nó có 4 chân không?&quot;
        </p>
        <p>
          <strong>Cây quyết định</strong> hoạt động y hệt &mdash; mỗi nút hỏi một câu hỏi
          về dữ liệu, rồi rẽ nhánh dựa trên câu trả lời, cho đến khi đạt được kết luận.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <p className="mb-3 text-sm text-muted">
          Nhấp vào các nút câu hỏi để chọn Có (xanh) hoặc Không (đỏ). Quan sát đường đi
          trên cây quyết định.
        </p>
        <svg
          viewBox="0 0 500 280"
          className="w-full rounded-lg border border-border bg-background"
        >
          {/* Edges */}
          {treeNodes.map((node) => {
            if (!node.yesChild) return null;
            const yesNode = treeNodes.find((n) => n.id === node.yesChild)!;
            const noNode = treeNodes.find((n) => n.id === node.noChild)!;
            const nodeDecision = decisions[node.id];
            return (
              <g key={`edge-${node.id}`}>
                <line
                  x1={node.x} y1={node.y + 20} x2={yesNode.x} y2={yesNode.y - 15}
                  stroke={nodeDecision === "yes" ? "#22c55e" : "#666"}
                  strokeWidth={nodeDecision === "yes" ? 2.5 : 1.5}
                  opacity={isActive(node.id) ? 1 : 0.3}
                />
                <text
                  x={(node.x + yesNode.x) / 2 - 15}
                  y={(node.y + yesNode.y) / 2}
                  fontSize={10}
                  fill="#22c55e"
                  fontWeight={600}
                >
                  Có
                </text>
                <line
                  x1={node.x} y1={node.y + 20} x2={noNode.x} y2={noNode.y - 15}
                  stroke={nodeDecision === "no" ? "#ef4444" : "#666"}
                  strokeWidth={nodeDecision === "no" ? 2.5 : 1.5}
                  opacity={isActive(node.id) ? 1 : 0.3}
                />
                <text
                  x={(node.x + noNode.x) / 2 + 5}
                  y={(node.y + noNode.y) / 2}
                  fontSize={10}
                  fill="#ef4444"
                  fontWeight={600}
                >
                  Không
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {treeNodes.map((node) => {
            const active = isActive(node.id);
            if (node.label) {
              return (
                <g key={node.id} opacity={active ? 1 : 0.3}>
                  <rect
                    x={node.x - 35} y={node.y - 12} width={70} height={24}
                    rx={6} fill={active ? "#22c55e" : "#374151"} opacity={0.15}
                    stroke={active ? "#22c55e" : "#666"} strokeWidth={1.5}
                  />
                  <text x={node.x} y={node.y + 4} fontSize={12} fill={active ? "#22c55e" : "#999"}
                    textAnchor="middle" fontWeight={600}>
                    {node.label}
                  </text>
                </g>
              );
            }

            const decision = decisions[node.id] || "idle";
            const fill = decision === "yes" ? "#22c55e" : decision === "no" ? "#ef4444" : "#3b82f6";

            return (
              <g
                key={node.id}
                className={active ? "cursor-pointer" : ""}
                onClick={() => active && !node.label && handleClick(node.id)}
                opacity={active ? 1 : 0.3}
              >
                <rect
                  x={node.x - 55} y={node.y - 15} width={110} height={30}
                  rx={8} fill={fill} opacity={0.15}
                  stroke={fill} strokeWidth={1.5}
                />
                <text x={node.x} y={node.y + 4} fontSize={12} fill={fill}
                  textAnchor="middle" fontWeight={600}>
                  {node.question}
                </text>
              </g>
            );
          })}
        </svg>
        <button
          onClick={() => setDecisions({})}
          className="mt-3 rounded-lg border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-white"
        >
          Đặt lại
        </button>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Cây quyết định (Decision Tree)</strong> là thuật toán phân loại trực quan
          nhất. Mô hình chia không gian dữ liệu thành các vùng bằng cách đặt câu hỏi về
          từng đặc trưng (feature).
        </p>
        <p>
          Tại mỗi nút, thuật toán chọn câu hỏi &quot;tốt nhất&quot; &mdash; câu hỏi phân
          chia dữ liệu thuần nhất nhất. Tiêu chí phổ biến là <strong>Gini impurity</strong>
          hoặc <strong>information gain</strong> (dựa trên entropy).
        </p>
        <p>
          Ưu điểm lớn nhất là <strong>dễ hiểu và giải thích</strong> &mdash; bạn có thể
          đọc cây và hiểu tại sao mô hình đưa ra quyết định. Tuy nhiên, cây đơn lẻ dễ
          bị overfitting, nên thường được kết hợp trong Random Forest hoặc Gradient Boosting.
        </p>
      </ExplanationSection>
    </>
  );
}
