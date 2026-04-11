"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "transfer-learning",
  title: "Transfer Learning",
  titleVi: "Học chuyển giao",
  description: "Tận dụng kiến thức từ mô hình đã huấn luyện trước để giải bài toán mới",
  category: "dl-architectures",
  tags: ["training", "fine-tuning", "practical"],
  difficulty: "intermediate",
  relatedSlugs: ["cnn", "transformer", "residual-connections"],
  vizType: "static",
};

const layers = [
  { name: "Conv 1: Cạnh", frozen: true },
  { name: "Conv 2: Kết cấu", frozen: true },
  { name: "Conv 3: Hình dạng", frozen: true },
  { name: "Conv 4: Bộ phận", frozen: true },
  { name: "FC 1: Kết hợp", frozen: false },
  { name: "FC 2: Phân loại mới", frozen: false },
];

export default function TransferLearningTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đã biết đá bóng và muốn học đá futsal. Bạn không cần học
          lại từ đầu &mdash; kỹ năng sút, chuyền, dẫn bóng (<strong>kiến thức nền
          tảng</strong>) vẫn dùng được. Bạn chỉ cần điều chỉnh chiến thuật và cách di
          chuyển trên sân nhỏ (<strong>tinh chỉnh</strong>).
        </p>
        <p>
          <strong>Transfer Learning</strong> tương tự: lấy mô hình đã huấn luyện trên dữ
          liệu lớn, <strong>đóng băng</strong> các lớp nền (đã học đặc trưng tổng quát),
          chỉ huấn luyện lại các lớp cuối cho bài toán mới.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <svg
          viewBox="0 0 500 300"
          className="w-full rounded-lg border border-border bg-background"
        >
          {/* Title */}
          <text x={250} y={20} fontSize={12} fill="currentColor" className="text-foreground" textAnchor="middle" fontWeight={600}>
            Fine-tuning: Đóng băng lớp nền, huấn luyện lại lớp cuối
          </text>

          {/* Layers */}
          {layers.map((layer, i) => {
            const y = 35 + i * 40;
            const frozen = layer.frozen;
            const color = frozen ? "#3b82f6" : "#f97316";

            return (
              <g key={i}>
                {/* Layer box */}
                <rect x={120} y={y} width={260} height={32} rx={8}
                  fill={color} opacity={frozen ? 0.1 : 0.2}
                  stroke={color} strokeWidth={frozen ? 1 : 2} />
                <text x={250} y={y + 20} fontSize={11} fill={color} textAnchor="middle" fontWeight={600}>
                  {layer.name}
                </text>

                {/* Lock/unlock icon */}
                <text x={395} y={y + 20} fontSize={14} fill={color}>
                  {frozen ? "\uD83D\uDD12" : "\uD83D\uDD13"}
                </text>

                {/* Status */}
                <text x={105} y={y + 20} fontSize={9} fill={color} textAnchor="end" fontWeight={600}>
                  {frozen ? "Đóng băng" : "Huấn luyện"}
                </text>

                {/* Arrow to next */}
                {i < layers.length - 1 && (
                  <line x1={250} y1={y + 32} x2={250} y2={y + 40}
                    stroke="#888" strokeWidth={1} />
                )}
              </g>
            );
          })}

          {/* Bracket for frozen layers */}
          <line x1={420} y1={40} x2={435} y2={40} stroke="#3b82f6" strokeWidth={1.5} />
          <line x1={435} y1={40} x2={435} y2={185} stroke="#3b82f6" strokeWidth={1.5} />
          <line x1={420} y1={185} x2={435} y2={185} stroke="#3b82f6" strokeWidth={1.5} />
          <text x={445} y={115} fontSize={10} fill="#3b82f6" fontWeight={600}>
            Từ mô hình
          </text>
          <text x={445} y={128} fontSize={10} fill="#3b82f6">
            tiền huấn luyện
          </text>
          <text x={445} y={141} fontSize={9} fill="#3b82f6">
            (ImageNet, GPT...)
          </text>

          {/* Bracket for trainable layers */}
          <line x1={420} y1={195} x2={435} y2={195} stroke="#f97316" strokeWidth={1.5} />
          <line x1={435} y1={195} x2={435} y2={265} stroke="#f97316" strokeWidth={1.5} />
          <line x1={420} y1={265} x2={435} y2={265} stroke="#f97316" strokeWidth={1.5} />
          <text x={445} y={225} fontSize={10} fill="#f97316" fontWeight={600}>
            Huấn luyện mới
          </text>
          <text x={445} y={240} fontSize={10} fill="#f97316">
            cho bài toán
          </text>
          <text x={445} y={253} fontSize={9} fill="#f97316">
            của bạn
          </text>

          {/* Bottom note */}
          <rect x={100} y={278} width={300} height={20} rx={6} fill="#22c55e" opacity={0.1} />
          <text x={250} y={292} fontSize={10} fill="#22c55e" textAnchor="middle" fontWeight={600}>
            Chỉ cần ít dữ liệu mới + ít thời gian huấn luyện!
          </text>
        </svg>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Transfer Learning</strong> tận dụng <strong>kiến thức đã học</strong> từ
          mô hình huấn luyện trên tập dữ liệu lớn (ImageNet, WebText, ...) để giải bài
          toán mới với <strong>ít dữ liệu hơn</strong> nhiều.
        </p>
        <p>
          Chiến lược phổ biến: (1) <strong>Feature extraction</strong>: đóng băng toàn bộ
          mô hình gốc, chỉ thay lớp cuối. (2) <strong>Fine-tuning</strong>: mở đông một số
          lớp trên cùng, huấn luyện với learning rate nhỏ. (3) <strong>Full fine-tuning</strong>:
          huấn luyện lại toàn bộ (cần nhiều dữ liệu hơn).
        </p>
        <p>
          Trong NLP hiện đại: <strong>GPT, BERT, LLaMA</strong> đều là mô hình tiền huấn
          luyện, được fine-tune cho từng tác vụ. Đây là mô hình chủ đạo trong AI ngày nay
          &mdash; <strong>pre-train once, fine-tune many</strong>.
        </p>
      </ExplanationSection>
    </>
  );
}
