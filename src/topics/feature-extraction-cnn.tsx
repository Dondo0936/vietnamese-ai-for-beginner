"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "feature-extraction-cnn",
  title: "CNN Feature Extraction",
  titleVi: "Trích xuất đặc trưng CNN",
  description:
    "Cách mạng nơ-ron tích chập tự động học và trích xuất đặc trưng thị giác từ đơn giản đến phức tạp qua các lớp.",
  category: "computer-vision",
  tags: ["computer-vision", "cnn", "features"],
  difficulty: "intermediate",
  relatedSlugs: ["cnn", "convolution", "image-classification"],
  vizType: "interactive",
};

interface LayerInfo {
  name: string;
  description: string;
  features: string[];
  color: string;
}

const LAYERS: LayerInfo[] = [
  {
    name: "Lớp 1",
    description: "Cạnh và góc",
    features: ["Cạnh ngang", "Cạnh dọc", "Cạnh chéo", "Góc nhọn"],
    color: "#3b82f6",
  },
  {
    name: "Lớp 2-3",
    description: "Kết cấu và hình dạng",
    features: ["Sọc vằn", "Chấm tròn", "Đường cong", "Lưới ô"],
    color: "#8b5cf6",
  },
  {
    name: "Lớp 4-5",
    description: "Bộ phận đối tượng",
    features: ["Mắt", "Tai", "Bánh xe", "Cửa sổ"],
    color: "#ec4899",
  },
  {
    name: "Lớp cuối",
    description: "Đối tượng hoàn chỉnh",
    features: ["Khuôn mặt", "Con mèo", "Xe hơi", "Ngôi nhà"],
    color: "#22c55e",
  },
];

export default function FeatureExtractionCnnTopic() {
  const [activeLayer, setActiveLayer] = useState(0);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang học <strong>vẽ chân dung</strong>. Đầu tiên
          bạn học vẽ <strong>nét cơ bản</strong> (đường thẳng, đường cong). Rồi
          bạn kết hợp chúng thành <strong>hình dạng</strong> (hình tròn, oval).
        </p>
        <p>
          Tiếp theo bạn ghép hình dạng thành <strong>bộ phận</strong> (mắt,
          mũi, miệng). Cuối cùng, bạn kết hợp tất cả thành{" "}
          <strong>khuôn mặt hoàn chỉnh</strong>! CNN trích xuất đặc trưng theo
          đúng thứ tự từ đơn giản đến phức tạp như vậy.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <div className="flex gap-2 justify-center flex-wrap">
            {LAYERS.map((layer, i) => (
              <button
                key={layer.name}
                onClick={() => setActiveLayer(i)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  activeLayer === i
                    ? "text-white"
                    : "bg-card border border-border text-muted"
                }`}
                style={activeLayer === i ? { backgroundColor: layer.color } : {}}
              >
                {layer.name}
              </button>
            ))}
          </div>

          <svg viewBox="0 0 600 280" className="w-full max-w-2xl mx-auto">
            {/* Layer hierarchy */}
            {LAYERS.map((layer, i) => {
              const x = 30 + i * 145;
              const isActive = activeLayer === i;
              const size = 90 - i * 10;
              return (
                <g key={layer.name}>
                  {/* Layer block */}
                  <rect
                    x={x}
                    y={60}
                    width={120}
                    height={size}
                    rx="8"
                    fill={layer.color}
                    opacity={isActive ? 0.4 : 0.15}
                    stroke={layer.color}
                    strokeWidth={isActive ? 2.5 : 1}
                  />
                  <text
                    x={x + 60}
                    y={55}
                    textAnchor="middle"
                    fill={isActive ? layer.color : "#64748b"}
                    fontSize="11"
                    fontWeight="bold"
                  >
                    {layer.name}
                  </text>
                  <text
                    x={x + 60}
                    y={60 + size / 2 + 4}
                    textAnchor="middle"
                    fill={isActive ? "#e2e8f0" : "#94a3b8"}
                    fontSize="10"
                  >
                    {layer.description}
                  </text>
                  {i < LAYERS.length - 1 && (
                    <line
                      x1={x + 120}
                      y1={60 + size / 2}
                      x2={x + 145}
                      y2={60 + (90 - (i + 1) * 10) / 2}
                      stroke="#475569"
                      strokeWidth="1.5"
                    />
                  )}
                </g>
              );
            })}

            {/* Feature maps for active layer */}
            <text x="300" y="185" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="bold">
              Đặc trưng học được ở {LAYERS[activeLayer].name}:
            </text>
            {LAYERS[activeLayer].features.map((feat, i) => {
              const x = 60 + i * 130;
              return (
                <g key={feat}>
                  <rect
                    x={x}
                    y="200"
                    width="110"
                    height="40"
                    rx="6"
                    fill={LAYERS[activeLayer].color}
                    opacity={0.25}
                    stroke={LAYERS[activeLayer].color}
                    strokeWidth="1"
                  />
                  <text
                    x={x + 55}
                    y="225"
                    textAnchor="middle"
                    fill="#e2e8f0"
                    fontSize="11"
                  >
                    {feat}
                  </text>
                </g>
              );
            })}

            {/* Complexity arrow */}
            <defs>
              <linearGradient id="complexGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
            <rect x="80" y="260" width="440" height="6" rx="3" fill="url(#complexGrad)" opacity={0.5} />
            <text x="80" y="278" fill="#3b82f6" fontSize="9">Đơn giản</text>
            <text x="520" y="278" fill="#22c55e" fontSize="9" textAnchor="end">Phức tạp</text>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Feature Extraction</strong> trong CNN là quá trình tự động
          học các biểu diễn (representation) có ý nghĩa từ dữ liệu thô.
          Mỗi lớp tích chập trích xuất đặc trưng ở mức trừu tượng khác nhau.
        </p>
        <p>Hệ thống phân cấp đặc trưng:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Lớp đầu (Low-level):</strong> Phát hiện cạnh, góc, gradient
            màu sắc — tương tự bộ lọc Gabor truyền thống.
          </li>
          <li>
            <strong>Lớp giữa (Mid-level):</strong> Kết hợp cạnh thành kết cấu,
            hình dạng, mẫu lặp lại (texture, patterns).
          </li>
          <li>
            <strong>Lớp sâu (High-level):</strong> Nhận biết bộ phận đối tượng
            và cuối cùng là toàn bộ đối tượng.
          </li>
        </ol>
        <p>
          Đặc trưng CNN học được có thể <strong>chuyển giao</strong> (transfer)
          sang tác vụ khác — đây là nền tảng của Transfer Learning. Các lớp
          đầu (đặc trưng chung) thường được giữ nguyên, chỉ tinh chỉnh lớp
          cuối cho tác vụ mới.
        </p>
      </ExplanationSection>
    </>
  );
}
