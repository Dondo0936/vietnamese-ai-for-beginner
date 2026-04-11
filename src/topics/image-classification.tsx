"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "image-classification",
  title: "Image Classification",
  titleVi: "Phân loại hình ảnh",
  description:
    "Tác vụ gán nhãn danh mục cho toàn bộ hình ảnh, nền tảng của thị giác máy tính hiện đại.",
  category: "computer-vision",
  tags: ["computer-vision", "cnn", "classification"],
  difficulty: "beginner",
  relatedSlugs: ["cnn", "convolution", "feature-extraction-cnn"],
  vizType: "static",
};

const LAYERS = [
  { label: "Ảnh đầu vào", w: 70, h: 70, color: "#3b82f6", desc: "224x224x3" },
  { label: "Conv + Pool", w: 55, h: 55, color: "#8b5cf6", desc: "56x56x64" },
  { label: "Conv + Pool", w: 40, h: 40, color: "#8b5cf6", desc: "14x14x256" },
  { label: "Conv + Pool", w: 28, h: 28, color: "#8b5cf6", desc: "7x7x512" },
  { label: "Flatten", w: 10, h: 50, color: "#f59e0b", desc: "25088" },
  { label: "FC", w: 10, h: 35, color: "#ec4899", desc: "4096" },
  { label: "Softmax", w: 10, h: 20, color: "#22c55e", desc: "1000" },
];

const CLASSES = [
  { name: "Mèo", prob: 0.85 },
  { name: "Chó", prob: 0.08 },
  { name: "Thỏ", prob: 0.04 },
  { name: "Cáo", prob: 0.02 },
  { name: "Khác", prob: 0.01 },
];

export default function ImageClassificationTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn dạy một <strong>em bé</strong> nhận biết động vật.
          Bạn cho bé xem hàng nghìn ảnh mèo, chó, chim... và nói tên mỗi con.
          Dần dần, bé <strong>tự nhận ra các đặc điểm</strong>: mèo có tai nhọn,
          chó có mõm dài.
        </p>
        <p>
          CNN (mạng nơ-ron tích chập) học tương tự: các lớp đầu nhận biết{" "}
          <strong>cạnh và góc</strong>, lớp giữa nhận biết <strong>bộ phận</strong>{" "}
          (mắt, tai), lớp cuối nhận biết <strong>toàn bộ đối tượng</strong>
          (mèo, chó). Từ đơn giản đến phức tạp!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <svg viewBox="0 0 600 260" className="w-full max-w-2xl mx-auto">
            <text x="300" y="20" textAnchor="middle" fill="#e2e8f0" fontSize="13" fontWeight="bold">
              Kiến trúc CNN cho phân loại ảnh
            </text>

            {/* CNN layers */}
            {LAYERS.map((layer, i) => {
              const x = 30 + i * 80;
              const yCenter = 100;
              return (
                <g key={i}>
                  <rect
                    x={x}
                    y={yCenter - layer.h / 2}
                    width={layer.w}
                    height={layer.h}
                    rx="4"
                    fill={layer.color}
                    opacity={0.3}
                    stroke={layer.color}
                    strokeWidth="1.5"
                  />
                  <text
                    x={x + layer.w / 2}
                    y={yCenter + 2}
                    textAnchor="middle"
                    fill="#e2e8f0"
                    fontSize="8"
                    fontWeight="bold"
                  >
                    {layer.desc}
                  </text>
                  <text
                    x={x + layer.w / 2}
                    y={yCenter + layer.h / 2 + 14}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="7"
                  >
                    {layer.label}
                  </text>
                  {i < LAYERS.length - 1 && (
                    <line
                      x1={x + layer.w + 2}
                      y1={yCenter}
                      x2={x + 78}
                      y2={yCenter}
                      stroke="#475569"
                      strokeWidth="1"
                      markerEnd="url(#arrow-ic)"
                    />
                  )}
                </g>
              );
            })}
            <defs>
              <marker id="arrow-ic" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill="#475569" />
              </marker>
            </defs>

            {/* Output probabilities */}
            <text x="300" y="170" textAnchor="middle" fill="#94a3b8" fontSize="11">
              Xác suất đầu ra (Softmax)
            </text>
            {CLASSES.map((cls, i) => {
              const x = 60 + i * 110;
              const barW = cls.prob * 100;
              return (
                <g key={cls.name}>
                  <text x={x} y="195" fill="#e2e8f0" fontSize="10">
                    {cls.name}
                  </text>
                  <rect
                    x={x}
                    y="200"
                    width={barW}
                    height="14"
                    rx="3"
                    fill={i === 0 ? "#22c55e" : "#3b82f6"}
                    opacity={i === 0 ? 0.9 : 0.4}
                  />
                  <text x={x + barW + 5} y="212" fill="#94a3b8" fontSize="9">
                    {(cls.prob * 100).toFixed(0)}%
                  </text>
                </g>
              );
            })}

            <text x="300" y="250" textAnchor="middle" fill="#64748b" fontSize="10">
              Ảnh được phân loại là: Mèo (85% tin cậy)
            </text>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Image Classification</strong> (Phân loại hình ảnh) là tác vụ
          cơ bản nhất trong thị giác máy tính — gán một nhãn danh mục cho toàn
          bộ hình ảnh.
        </p>
        <p>Kiến trúc CNN tiêu biểu:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Lớp tích chập (Conv):</strong> Trích xuất đặc trưng từ ảnh
            bằng các bộ lọc (kernel), từ cạnh đơn giản đến pattern phức tạp.
          </li>
          <li>
            <strong>Lớp gộp (Pooling):</strong> Giảm kích thước không gian,
            giữ lại thông tin quan trọng, tăng tính bất biến.
          </li>
          <li>
            <strong>Lớp kết nối đầy đủ (FC):</strong> Kết hợp các đặc trưng
            để phân loại, kết thúc bằng softmax cho xác suất mỗi lớp.
          </li>
        </ol>
        <p>
          Các kiến trúc nổi tiếng: <strong>AlexNet</strong> (2012),{" "}
          <strong>VGGNet</strong> (2014), <strong>ResNet</strong> (2015),{" "}
          <strong>EfficientNet</strong> (2019). ImageNet là benchmark chuẩn
          với 1000 danh mục và hơn 1 triệu ảnh huấn luyện.
        </p>
      </ExplanationSection>
    </>
  );
}
