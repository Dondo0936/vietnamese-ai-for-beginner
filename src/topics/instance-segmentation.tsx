"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "instance-segmentation",
  title: "Instance Segmentation",
  titleVi: "Phân đoạn thể hiện",
  description:
    "Kết hợp phát hiện đối tượng và phân đoạn, phân biệt từng thể hiện riêng lẻ của cùng loại đối tượng.",
  category: "computer-vision",
  tags: ["computer-vision", "segmentation", "detection"],
  difficulty: "advanced",
  relatedSlugs: ["semantic-segmentation", "object-detection", "panoptic-segmentation"],
  vizType: "interactive",
};

interface Instance {
  id: number;
  label: string;
  color: string;
  points: string;
  cx: number;
  cy: number;
}

const INSTANCES: Instance[] = [
  { id: 1, label: "Người #1", color: "#3b82f6", points: "80,180 100,80 130,70 160,80 180,180 150,200 110,200", cx: 130, cy: 140 },
  { id: 2, label: "Người #2", color: "#8b5cf6", points: "250,200 270,100 300,90 330,100 350,200 320,220 280,220", cx: 300, cy: 155 },
  { id: 3, label: "Người #3", color: "#ec4899", points: "420,190 440,95 465,85 490,95 510,190 485,210 445,210", cx: 465, cy: 148 },
  { id: 4, label: "Xe #1", color: "#22c55e", points: "60,280 60,250 140,240 200,250 200,280 190,300 70,300", cx: 130, cy: 270 },
  { id: 5, label: "Xe #2", color: "#f59e0b", points: "380,290 380,260 460,250 520,260 520,290 510,310 390,310", cx: 450, cy: 280 },
];

export default function InstanceSegmentationTopic() {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn là <strong>giáo viên điểm danh</strong>. Semantic
          Segmentation chỉ nói &quot;có học sinh trong lớp&quot;. Object Detection nói
          &quot;có 3 học sinh và vẽ khung bao&quot;.
        </p>
        <p>
          Instance Segmentation đi xa hơn:{" "}
          <strong>tô màu riêng biệt từng học sinh</strong> — Lan màu xanh, Hùng
          màu đỏ, Mai màu vàng. Mỗi cá thể được phân biệt rõ ràng, kể cả khi
          họ đứng cạnh nhau hay che khuất nhau!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <p className="text-sm text-muted text-center">
            Nhấn vào từng thể hiện để xem chi tiết
          </p>

          <svg viewBox="0 0 600 340" className="w-full max-w-2xl mx-auto">
            {/* Background */}
            <rect x="0" y="0" width="600" height="340" rx="8" fill="#0f172a" />
            <rect x="0" y="230" width="600" height="110" fill="#1e293b" opacity={0.5} />

            {/* Instances */}
            {INSTANCES.map((inst) => {
              const isSelected = selectedId === inst.id;
              const dimmed = selectedId !== null && !isSelected;
              return (
                <g
                  key={inst.id}
                  onClick={() => setSelectedId(isSelected ? null : inst.id)}
                  style={{ cursor: "pointer" }}
                >
                  <polygon
                    points={inst.points}
                    fill={inst.color}
                    opacity={dimmed ? 0.15 : 0.5}
                    stroke={inst.color}
                    strokeWidth={isSelected ? 3 : 1.5}
                  />
                  <text
                    x={inst.cx}
                    y={inst.cy}
                    textAnchor="middle"
                    fill="white"
                    fontSize="10"
                    fontWeight="bold"
                    opacity={dimmed ? 0.3 : 1}
                  >
                    {inst.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Info panel */}
          {selectedId && (
            <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
              <p className="text-sm text-muted">
                Đã chọn:{" "}
                <strong className="text-accent">
                  {INSTANCES.find((i) => i.id === selectedId)?.label}
                </strong>{" "}
                — Mỗi thể hiện có mask (mặt nạ) riêng biệt, cho phép tách rời
                từng đối tượng.
              </p>
            </div>
          )}

          {/* Comparison diagram */}
          <div className="flex flex-wrap gap-4 justify-center">
            {[
              { name: "Phân loại ảnh", desc: "'Có người và xe'", color: "#3b82f6" },
              { name: "Phát hiện đối tượng", desc: "Bounding box", color: "#22c55e" },
              { name: "Phân đoạn ngữ nghĩa", desc: "Pixel-level nhưng cùng màu", color: "#f59e0b" },
              { name: "Phân đoạn thể hiện", desc: "Pixel-level, màu riêng biệt", color: "#8b5cf6" },
            ].map((item) => (
              <div
                key={item.name}
                className="rounded-lg border p-3 text-center w-[130px]"
                style={{ borderColor: item.color }}
              >
                <p className="text-xs font-bold" style={{ color: item.color }}>
                  {item.name}
                </p>
                <p className="text-xs text-muted mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Instance Segmentation</strong> (Phân đoạn thể hiện) kết hợp
          phát hiện đối tượng và phân đoạn ngữ nghĩa — không chỉ tô màu theo
          danh mục mà còn <strong>phân biệt từng thể hiện</strong> riêng lẻ.
        </p>
        <p>Phương pháp chính:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Mask R-CNN:</strong> Mở rộng Faster R-CNN bằng cách thêm
            một nhánh dự đoán mask cho mỗi vùng đề xuất. Đây là phương pháp
            phổ biến nhất.
          </li>
          <li>
            <strong>YOLACT:</strong> Phương pháp one-stage, sinh mask bằng cách
            kết hợp các prototype mask với hệ số dự đoán.
          </li>
          <li>
            <strong>SAM (Segment Anything):</strong> Mô hình mới của Meta, có
            thể phân đoạn bất kỳ đối tượng nào mà không cần huấn luyện.
          </li>
        </ol>
        <p>
          Ứng dụng: robot thao tác vật thể (cần biết chính xác đường biên),
          chỉnh sửa ảnh/video chuyên nghiệp, phân tích hình ảnh y tế.
        </p>
      </ExplanationSection>
    </>
  );
}
