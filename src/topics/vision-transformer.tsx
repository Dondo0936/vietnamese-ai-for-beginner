"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "vision-transformer",
  title: "Vision Transformer (ViT)",
  titleVi: "Transformer thị giác",
  description:
    "Áp dụng kiến trúc Transformer trực tiếp cho hình ảnh bằng cách chia ảnh thành các patch",
  category: "dl-architectures",
  tags: ["vit", "image-patches", "transformer"],
  difficulty: "intermediate",
  relatedSlugs: ["transformer", "cnn", "image-classification", "self-attention"],
  vizType: "interactive",
};

const PATCH_COLORS = [
  "#3b82f6", "#8b5cf6", "#ef4444", "#22c55e",
  "#f59e0b", "#ec4899", "#06b6d4", "#f97316",
  "#84cc16",
];

export default function VisionTransformerTopic() {
  const [selectedPatch, setSelectedPatch] = useState<number | null>(null);
  const gridSize = 3;
  const patchSize = 120;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang đọc một bức tranh ghép hình (<strong>jigsaw puzzle</strong>).
          Thay vì nhìn toàn bộ bức ảnh cùng lúc như CNN, Vision Transformer chia ảnh thành
          các <strong>mảnh nhỏ</strong> (patch), rồi xem xét mối quan hệ giữa tất cả
          các mảnh cùng một lúc — giống như bạn nhìn từng miếng ghép và hỏi:{" "}
          <strong>&quot;Miếng này liên quan đến miếng nào?&quot;</strong>
        </p>
        <p>
          Đây chính là sức mạnh của cơ chế <strong>self-attention</strong> — mỗi mảnh ảnh
          có thể &quot;chú ý&quot; đến bất kỳ mảnh nào khác, dù ở xa hay gần.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <p className="text-sm text-muted text-center">Nhấp vào một patch để xem cách nó &quot;chú ý&quot; đến các patch khác</p>
          <svg viewBox="0 0 600 400" className="w-full max-w-2xl mx-auto">
            {/* Image divided into patches */}
            <text x={10} y={20} fontSize={12} fill="#64748b">Ảnh gốc → Chia thành patches</text>
            {Array.from({ length: gridSize * gridSize }).map((_, i) => {
              const row = Math.floor(i / gridSize);
              const col = i % gridSize;
              const x = 30 + col * (patchSize + 4);
              const y = 35 + row * (patchSize + 4);
              const isSelected = selectedPatch === i;
              const opacity = selectedPatch === null ? 0.7 : isSelected ? 1 : 0.3;

              return (
                <g key={i} onClick={() => setSelectedPatch(i === selectedPatch ? null : i)} style={{ cursor: "pointer" }}>
                  <rect
                    x={x} y={y}
                    width={patchSize} height={patchSize}
                    fill={PATCH_COLORS[i]}
                    opacity={opacity}
                    rx={4}
                    stroke={isSelected ? "#0f172a" : "none"}
                    strokeWidth={isSelected ? 3 : 0}
                  />
                  <text x={x + patchSize / 2} y={y + patchSize / 2 + 5} textAnchor="middle" fontSize={14} fill="white" fontWeight="bold">
                    P{i + 1}
                  </text>
                </g>
              );
            })}

            {/* Attention arrows from selected patch */}
            {selectedPatch !== null && Array.from({ length: gridSize * gridSize }).map((_, i) => {
              if (i === selectedPatch) return null;
              const fromRow = Math.floor(selectedPatch / gridSize);
              const fromCol = selectedPatch % gridSize;
              const toRow = Math.floor(i / gridSize);
              const toCol = i % gridSize;
              const fx = 30 + fromCol * (patchSize + 4) + patchSize / 2;
              const fy = 35 + fromRow * (patchSize + 4) + patchSize / 2;
              const tx = 30 + toCol * (patchSize + 4) + patchSize / 2;
              const ty = 35 + toRow * (patchSize + 4) + patchSize / 2;
              const weight = Math.random() * 0.7 + 0.3;

              return (
                <line
                  key={`att-${i}`}
                  x1={fx} y1={fy} x2={tx} y2={ty}
                  stroke="#14b8a6"
                  strokeWidth={weight * 4}
                  opacity={weight * 0.8}
                  strokeDasharray="4 2"
                />
              );
            })}
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Vision Transformer (ViT)</strong> là bước đột phá khi chứng minh rằng
          Transformer — vốn được thiết kế cho văn bản — có thể hoạt động xuất sắc trên hình ảnh,
          thậm chí vượt qua CNN khi có đủ dữ liệu huấn luyện.
        </p>
        <p>Quy trình hoạt động của ViT:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Chia ảnh thành patch:</strong> Ảnh được chia thành lưới các mảnh nhỏ (ví dụ: 16×16 pixel). Mỗi patch được &quot;duỗi phẳng&quot; thành một vector.</li>
          <li><strong>Nhúng tuyến tính:</strong> Mỗi vector patch được chiếu qua một lớp tuyến tính để tạo embedding, tương tự như token embedding trong NLP.</li>
          <li><strong>Thêm mã hoá vị trí:</strong> Positional encoding được thêm vào để mô hình biết patch nào ở đâu trong ảnh gốc.</li>
          <li><strong>Transformer Encoder:</strong> Các patch embedding được đưa qua nhiều lớp Transformer với self-attention, cho phép mỗi patch &quot;nhìn&quot; tất cả các patch khác.</li>
          <li><strong>Phân loại:</strong> Một token [CLS] đặc biệt tổng hợp thông tin từ tất cả patch và được dùng để phân loại ảnh.</li>
        </ol>
        <p>
          <strong>So sánh với CNN:</strong> CNN nhìn ảnh qua bộ lọc cục bộ (local receptive field),
          phải xếp nhiều lớp mới &quot;nhìn xa&quot; được. ViT nhìn toàn cục ngay từ lớp đầu tiên
          nhờ self-attention, nhưng cần nhiều dữ liệu hơn để học tốt.
        </p>
      </ExplanationSection>
    </>
  );
}
