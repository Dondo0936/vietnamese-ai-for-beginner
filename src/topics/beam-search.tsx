"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "beam-search",
  title: "Beam Search",
  titleVi: "Beam Search - Tìm kiếm chùm tia",
  description:
    "Thuật toán giải mã giữ lại k ứng viên tốt nhất ở mỗi bước, cân bằng giữa chất lượng và tốc độ.",
  category: "nlp",
  tags: ["nlp", "decoding", "search"],
  difficulty: "intermediate",
  relatedSlugs: ["gpt", "seq2seq", "attention-mechanism"],
  vizType: "interactive",
};

interface TreeNode {
  word: string;
  prob: number;
  children: TreeNode[];
  kept: boolean;
}

const TREE: TreeNode = {
  word: "BĐ",
  prob: 1.0,
  kept: true,
  children: [
    {
      word: "Tôi",
      prob: 0.6,
      kept: true,
      children: [
        { word: "yêu", prob: 0.5, kept: true, children: [] },
        { word: "thích", prob: 0.3, kept: true, children: [] },
        { word: "ghét", prob: 0.1, kept: false, children: [] },
      ],
    },
    {
      word: "Bạn",
      prob: 0.3,
      kept: true,
      children: [
        { word: "có", prob: 0.4, kept: true, children: [] },
        { word: "là", prob: 0.3, kept: false, children: [] },
        { word: "đi", prob: 0.2, kept: false, children: [] },
      ],
    },
    {
      word: "Chúng",
      prob: 0.1,
      kept: false,
      children: [
        { word: "ta", prob: 0.5, kept: false, children: [] },
        { word: "tôi", prob: 0.3, kept: false, children: [] },
      ],
    },
  ],
};

export default function BeamSearchTopic() {
  const [beamWidth, setBeamWidth] = useState(2);
  const [expandedDepth, setExpandedDepth] = useState(1);

  const renderNode = (
    node: TreeNode,
    x: number,
    y: number,
    depth: number,
    spread: number,
    idx: number,
    parentKept: boolean
  ): React.JSX.Element[] => {
    const isKept = parentKept && (depth === 0 || idx < beamWidth);
    const elements: React.JSX.Element[] = [];

    elements.push(
      <g key={`node-${depth}-${idx}-${node.word}`}>
        <rect
          x={x - 28}
          y={y}
          width="56"
          height="28"
          rx="6"
          fill={isKept ? "#3b82f6" : "#1e293b"}
          stroke={isKept ? "#60a5fa" : "#334155"}
          strokeWidth={isKept ? 2 : 1}
          opacity={isKept ? 1 : 0.4}
        />
        <text
          x={x}
          y={y + 14}
          textAnchor="middle"
          fill={isKept ? "white" : "#475569"}
          fontSize="10"
          fontWeight={isKept ? "bold" : "normal"}
        >
          {node.word}
        </text>
        <text
          x={x}
          y={y + 24}
          textAnchor="middle"
          fill={isKept ? "#bfdbfe" : "#334155"}
          fontSize="8"
        >
          {node.prob.toFixed(1)}
        </text>
      </g>
    );

    if (depth < expandedDepth && node.children.length > 0) {
      const childSpread = spread / (node.children.length + 0.5);
      const startX = x - (spread / 2) + childSpread / 2;

      node.children.forEach((child, ci) => {
        const cx = startX + ci * childSpread;
        const cy = y + 65;

        elements.push(
          <line
            key={`line-${depth}-${idx}-${ci}`}
            x1={x}
            y1={y + 28}
            x2={cx}
            y2={cy}
            stroke={isKept && ci < beamWidth ? "#3b82f6" : "#334155"}
            strokeWidth={isKept && ci < beamWidth ? 1.5 : 0.8}
            opacity={isKept && ci < beamWidth ? 0.7 : 0.3}
          />
        );

        elements.push(
          ...renderNode(child, cx, cy, depth + 1, childSpread, ci, isKept)
        );
      });
    }

    return elements;
  };

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang tìm đường trong <strong>mê cung</strong>.
          Greedy search chỉ chọn lối đi tốt nhất tại mỗi ngã rẽ — dễ sa vào
          ngõ cụt. Exhaustive search thử mọi lối — quá chậm.
        </p>
        <p>
          Beam Search là giải pháp thông minh: tại mỗi ngã rẽ, bạn giữ lại{" "}
          <strong>k con đường hứa hẹn nhất</strong> (beam width = k). Như một
          đội thám hiểm chia thành k nhóm, mỗi nhóm theo một hướng khác nhau,
          cuối cùng chọn nhóm tìm được lối ra tốt nhất!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1 flex-1 min-w-[150px]">
              <label className="text-sm font-medium text-muted">
                Beam Width (k): {beamWidth}
              </label>
              <input
                type="range"
                min="1"
                max="3"
                step="1"
                value={beamWidth}
                onChange={(e) => setBeamWidth(parseInt(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
            <div className="space-y-1 flex-1 min-w-[150px]">
              <label className="text-sm font-medium text-muted">
                Độ sâu mở rộng: {expandedDepth}
              </label>
              <input
                type="range"
                min="1"
                max="2"
                step="1"
                value={expandedDepth}
                onChange={(e) => setExpandedDepth(parseInt(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
          </div>

          <svg viewBox="0 0 600 220" className="w-full max-w-2xl mx-auto">
            {renderNode(TREE, 300, 10, 0, 500, 0, true)}

            {/* Legend */}
            <rect x="20" y="190" width="12" height="12" rx="2" fill="#3b82f6" />
            <text x="38" y="200" fill="#94a3b8" fontSize="10">Được giữ lại</text>
            <rect x="130" y="190" width="12" height="12" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="1" opacity={0.4} />
            <text x="148" y="200" fill="#94a3b8" fontSize="10">Bị loại bỏ</text>
          </svg>

          <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
            <p className="text-sm text-muted">
              Beam width = <strong className="text-accent">{beamWidth}</strong>: giữ lại{" "}
              <strong>{beamWidth}</strong> ứng viên tốt nhất mỗi bước.{" "}
              {beamWidth === 1
                ? "Tương đương Greedy Search!"
                : beamWidth === 3
                  ? "Khám phá nhiều hơn, chất lượng cao hơn!"
                  : "Cân bằng tốt giữa chất lượng và tốc độ."}
            </p>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Beam Search</strong> là thuật toán giải mã phổ biến trong các
          mô hình sinh chuỗi (dịch máy, tóm tắt, sinh văn bản). Nó cân bằng
          giữa chất lượng của exhaustive search và tốc độ của greedy search.
        </p>
        <p>So sánh các phương pháp giải mã:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Greedy Search (k=1):</strong> Luôn chọn token có xác suất
            cao nhất. Nhanh nhưng hay bỏ lỡ chuỗi tốt hơn.
          </li>
          <li>
            <strong>Beam Search (k=2-10):</strong> Giữ k chuỗi ứng viên tốt
            nhất, mở rộng song song. Chất lượng tốt hơn greedy.
          </li>
          <li>
            <strong>Sampling:</strong> Chọn ngẫu nhiên theo phân phối xác suất.
            Tạo văn bản đa dạng hơn, kém ổn định hơn.
          </li>
        </ol>
        <p>
          Beam search thường kết hợp với <strong>length penalty</strong> (phạt
          câu ngắn) và <strong>coverage penalty</strong> (đảm bảo dịch hết)
          để cải thiện chất lượng đầu ra.
        </p>
      </ExplanationSection>
    </>
  );
}
