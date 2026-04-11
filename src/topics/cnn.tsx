"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "cnn",
  title: "Convolutional Neural Network",
  titleVi: "Mạng nơ-ron tích chập",
  description: "Kiến trúc chuyên xử lý ảnh bằng các bộ lọc tích chập trượt qua dữ liệu",
  category: "dl-architectures",
  tags: ["computer-vision", "deep-learning", "architecture"],
  difficulty: "intermediate",
  relatedSlugs: ["convolution", "pooling", "transfer-learning"],
  vizType: "interactive",
};

const layers = [
  { name: "Ảnh gốc", w: 80, h: 80, color: "#3b82f6" },
  { name: "Conv 1", w: 70, h: 70, color: "#f97316" },
  { name: "Pool 1", w: 55, h: 55, color: "#22c55e" },
  { name: "Conv 2", w: 45, h: 45, color: "#f97316" },
  { name: "Pool 2", w: 35, h: 35, color: "#22c55e" },
  { name: "Flatten", w: 15, h: 80, color: "#8b5cf6" },
  { name: "FC", w: 15, h: 50, color: "#ef4444" },
  { name: "Output", w: 15, h: 25, color: "#ec4899" },
];

export default function CnnTopic() {
  const [activeLayer, setActiveLayer] = useState(-1);
  const [filterPos, setFilterPos] = useState(0);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang quét một <strong>kính lúp nhỏ</strong> qua bức ảnh.
          Ở mỗi vị trí, kính lúp tìm kiếm một đặc trưng cụ thể &mdash; cạnh ngang, cạnh
          dọc, góc, màu sắc. Nhiều kính lúp khác nhau tìm kiếm nhiều đặc trưng khác nhau.
        </p>
        <p>
          Lớp đầu tiên tìm <strong>cạnh đơn giản</strong>, lớp tiếp theo kết hợp cạnh thành
          <strong> hình dạng</strong> (mắt, mũi), lớp sau cùng nhận diện <strong>vật thể
          hoàn chỉnh</strong> (khuôn mặt). Đây chính là cách <strong>CNN</strong> &quot;nhìn&quot;
          thế giới.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <p className="mb-3 text-sm text-muted">
          Di chuột vào từng lớp để xem thông tin. Kéo thanh trượt để di chuyển bộ lọc trên ảnh.
        </p>
        <svg
          viewBox="0 0 500 200"
          className="w-full rounded-lg border border-border bg-background"
        >
          {layers.map((layer, i) => {
            const x = 20 + i * 60;
            const y = 100 - layer.h / 2;
            const isActive = activeLayer === i;

            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setActiveLayer(i)}
                onMouseLeave={() => setActiveLayer(-1)}
              >
                {/* Layer shape */}
                <rect
                  x={x} y={y}
                  width={layer.w} height={layer.h}
                  rx={4}
                  fill={layer.color}
                  opacity={isActive ? 0.4 : 0.2}
                  stroke={layer.color}
                  strokeWidth={isActive ? 2 : 1}
                />

                {/* Depth effect */}
                {layer.w > 20 && (
                  <rect
                    x={x + 4} y={y - 4}
                    width={layer.w} height={layer.h}
                    rx={4}
                    fill="none"
                    stroke={layer.color}
                    strokeWidth={0.5}
                    opacity={0.3}
                  />
                )}

                {/* Label */}
                <text
                  x={x + layer.w / 2}
                  y={100 + layer.h / 2 + 15}
                  fontSize={9}
                  fill={layer.color}
                  textAnchor="middle"
                  fontWeight={isActive ? 700 : 400}
                >
                  {layer.name}
                </text>

                {/* Arrow to next */}
                {i < layers.length - 1 && (
                  <line
                    x1={x + layer.w + 2} y1={100}
                    x2={x + 58} y2={100}
                    stroke="#666" strokeWidth={1}
                    markerEnd="url(#cnn-arrow)"
                  />
                )}
              </g>
            );
          })}

          {/* Filter sliding on first layer */}
          {activeLayer <= 0 && (
            <rect
              x={20 + (filterPos / 100) * 55}
              y={100 - 40 + (filterPos / 100) * 30}
              width={25} height={25}
              fill="none"
              stroke="#f59e0b"
              strokeWidth={2}
              rx={2}
            />
          )}

          <defs>
            <marker id="cnn-arrow" markerWidth={8} markerHeight={6} refX={7} refY={3} orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#666" />
            </marker>
          </defs>

          {/* Info box */}
          {activeLayer >= 0 && (
            <g>
              <rect x={10} y={170} width={480} height={25} rx={6} fill="currentColor" className="text-card" opacity={0.8} />
              <text x={250} y={187} fontSize={11} fill={layers[activeLayer].color} textAnchor="middle" fontWeight={600}>
                {activeLayer === 0 && "Ảnh đầu vào (ví dụ: 224x224x3 RGB)"}
                {activeLayer === 1 && "Tích chập: bộ lọc 3x3 trượt qua ảnh, phát hiện cạnh và kết cấu"}
                {activeLayer === 2 && "Pooling: giảm kích thước, giữ đặc trưng quan trọng nhất"}
                {activeLayer === 3 && "Tích chập sâu hơn: phát hiện hình dạng phức tạp hơn"}
                {activeLayer === 4 && "Pooling lần 2: tiếp tục giảm kích thước"}
                {activeLayer === 5 && "Flatten: duỗi thẳng tensor thành vector 1D"}
                {activeLayer === 6 && "Fully Connected: kết hợp đặc trưng để phân loại"}
                {activeLayer === 7 && "Output: xác suất từng lớp (ví dụ: mèo 95%, chó 5%)"}
              </text>
            </g>
          )}
        </svg>
        <div className="mt-4 flex items-center gap-4">
          <label className="text-sm font-medium text-foreground">Vị trí bộ lọc:</label>
          <input
            type="range"
            min={0}
            max={100}
            value={filterPos}
            onChange={(e) => setFilterPos(Number(e.target.value))}
            className="flex-1 accent-accent"
          />
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>CNN (Convolutional Neural Network)</strong> là kiến trúc nền tảng cho
          <strong> thị giác máy tính</strong>. Ý tưởng chính: dùng <strong>bộ lọc (kernel)</strong>
          nhỏ trượt qua ảnh để phát hiện đặc trưng cục bộ, thay vì kết nối đầy đủ.
        </p>
        <p>
          Ba loại lớp chính: <strong>Convolution</strong> (phát hiện đặc trưng),
          <strong> Pooling</strong> (giảm kích thước), <strong>Fully Connected</strong> (phân
          loại). Đặc điểm quan trọng: <strong>chia sẻ trọng số</strong> (cùng bộ lọc dùng
          cho mọi vị trí) giúp giảm tham số và tạo tính <strong>bất biến dịch chuyển</strong>.
        </p>
        <p>
          Các kiến trúc nổi tiếng: LeNet, AlexNet, VGGNet, ResNet, EfficientNet. CNN được
          dùng rộng rãi trong nhận diện ảnh, phát hiện vật thể, phân đoạn ảnh, và cả xử
          lý ngôn ngữ.
        </p>
      </ExplanationSection>
    </>
  );
}
