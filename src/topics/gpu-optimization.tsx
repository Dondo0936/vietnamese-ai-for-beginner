"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "gpu-optimization",
  title: "GPU Optimization",
  titleVi: "Tối ưu GPU — Vắt kiệt sức mạnh phần cứng",
  description:
    "Các kỹ thuật tận dụng tối đa khả năng tính toán song song của GPU cho huấn luyện và suy luận mô hình AI.",
  category: "infrastructure",
  tags: ["gpu", "cuda", "parallel", "hardware"],
  difficulty: "advanced",
  relatedSlugs: ["inference-optimization", "model-serving", "cost-optimization"],
  vizType: "static",
};

export default function GPUOptimizationTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng <strong>CPU</strong> như một <strong>giáo sư toán</strong> giỏi —
          giải được bài toán phức tạp nhưng mỗi lần chỉ làm một bài.
          <strong> GPU</strong> giống <strong>lớp học 1000 học sinh</strong> — mỗi em chỉ
          làm phép tính đơn giản, nhưng cả ngàn phép tính chạy <em>cùng lúc</em>.
        </p>
        <p>
          AI cần hàng tỷ phép nhân ma trận — chính là bài toán mà &quot;lớp học 1000 em&quot;
          giải cực nhanh! <strong>Tối ưu GPU</strong> là nghệ thuật sắp xếp bài tập sao cho
          mọi &quot;học sinh&quot; đều bận rộn, không ai ngồi chờ.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <svg viewBox="0 0 600 260" className="w-full max-w-2xl mx-auto">
            {/* CPU */}
            <rect x={30} y={20} width={250} height={90} rx={10} fill="#1e293b" stroke="#3b82f6" strokeWidth={2} />
            <text x={155} y={42} textAnchor="middle" fill="#3b82f6" fontSize={11} fontWeight="bold">CPU — Tuần tự</text>
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={50 + i * 55} y={55} width={45} height={40} rx={4} fill="#3b82f6" opacity={0.3 + i * 0.2} />
            ))}
            <text x={155} y={80} textAnchor="middle" fill="white" fontSize={9}>4 lõi — 4 tác vụ tuần tự</text>

            {/* GPU */}
            <rect x={320} y={20} width={250} height={90} rx={10} fill="#1e293b" stroke="#22c55e" strokeWidth={2} />
            <text x={445} y={42} textAnchor="middle" fill="#22c55e" fontSize={11} fontWeight="bold">GPU — Song song</text>
            {Array.from({ length: 64 }).map((_, i) => (
              <rect
                key={i}
                x={335 + (i % 16) * 14}
                y={50 + Math.floor(i / 16) * 14}
                width={10}
                height={10}
                rx={1}
                fill="#22c55e"
                opacity={0.6}
              />
            ))}

            {/* Techniques */}
            <text x={300} y={145} textAnchor="middle" fill="#e2e8f0" fontSize={12} fontWeight="bold">
              Kỹ thuật tối ưu GPU
            </text>
            {[
              { label: "Tensor Parallelism", desc: "Chia mô hình qua nhiều GPU", color: "#3b82f6" },
              { label: "Flash Attention", desc: "Tối ưu bộ nhớ attention", color: "#22c55e" },
              { label: "Mixed Precision", desc: "Kết hợp FP16 + FP32", color: "#f59e0b" },
              { label: "Gradient Checkpointing", desc: "Đánh đổi tính toán lấy bộ nhớ", color: "#8b5cf6" },
            ].map((tech, i) => {
              const x = 75 + (i % 2) * 280;
              const y = 165 + Math.floor(i / 2) * 42;
              return (
                <g key={i}>
                  <rect x={x - 55} y={y} width={230} height={32} rx={6} fill="#1e293b" stroke={tech.color} strokeWidth={1.5} />
                  <text x={x + 60} y={y + 14} textAnchor="middle" fill={tech.color} fontSize={10} fontWeight="bold">{tech.label}</text>
                  <text x={x + 60} y={y + 27} textAnchor="middle" fill="#94a3b8" fontSize={8}>{tech.desc}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Tối ưu GPU</strong> là tập hợp kỹ thuật giúp tận dụng tối đa khả năng
          tính toán song song của GPU, giảm thời gian huấn luyện và chi phí suy luận.
        </p>
        <p>Bốn kỹ thuật quan trọng nhất:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Tensor Parallelism:</strong> Chia mô hình lớn qua nhiều GPU, mỗi GPU xử lý một phần.</li>
          <li><strong>Flash Attention:</strong> Thuật toán attention tối ưu bộ nhớ, nhanh gấp 2-4 lần attention thông thường.</li>
          <li><strong>Mixed Precision (FP16/BF16):</strong> Dùng độ chính xác thấp cho đa số phép tính, tiết kiệm bộ nhớ và tăng tốc.</li>
          <li><strong>Gradient Checkpointing:</strong> Không lưu tất cả activation, tính lại khi cần — đánh đổi tốc độ lấy bộ nhớ.</li>
        </ol>
        <p>
          GPU A100/H100 của NVIDIA là phần cứng chủ đạo. Tối ưu tốt có thể giảm
          <strong> chi phí huấn luyện hàng triệu đô-la</strong> xuống còn một phần nhỏ.
        </p>
      </ExplanationSection>
    </>
  );
}
