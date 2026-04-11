"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "inference-optimization",
  title: "Inference Optimization",
  titleVi: "Tối ưu suy luận — Làm AI nhanh hơn",
  description:
    "Các kỹ thuật tăng tốc và giảm chi phí khi chạy mô hình AI, từ lượng tử hoá đến batching thông minh.",
  category: "infrastructure",
  tags: ["inference", "optimization", "quantization", "latency"],
  difficulty: "advanced",
  relatedSlugs: ["model-serving", "gpu-optimization", "cost-optimization"],
  vizType: "interactive",
};

const TECHNIQUES = [
  { id: "quantization", label: "Lượng tử hoá", speedup: "2-4x", memSave: "50-75%", desc: "Giảm độ chính xác trọng số: FP16 → INT8 → INT4" },
  { id: "batching", label: "Batching", speedup: "3-8x", memSave: "0%", desc: "Gộp nhiều yêu cầu xử lý cùng lúc trên GPU" },
  { id: "kv-cache", label: "KV Cache", speedup: "2-5x", memSave: "-20%", desc: "Lưu trữ key-value đã tính để tránh tính lại" },
  { id: "pruning", label: "Tỉa mô hình", speedup: "1.5-3x", memSave: "30-60%", desc: "Loại bỏ các trọng số không quan trọng" },
];

export default function InferenceOptimizationTopic() {
  const [activeTech, setActiveTech] = useState("quantization");
  const tech = TECHNIQUES.find((t) => t.id === activeTech)!;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang giao hàng bằng xe tải. Có nhiều cách tối ưu:
        </p>
        <p>
          <strong>Lượng tử hoá:</strong> Đóng gói hàng nhỏ gọn hơn → chở được nhiều hơn.
          <strong> Batching:</strong> Gộp nhiều đơn hàng cùng tuyến → ít chuyến đi hơn.
          <strong> KV Cache:</strong> Nhớ đường đi cũ → không cần tra bản đồ lại.
          <strong> Tỉa mô hình:</strong> Bỏ hàng không cần thiết → xe nhẹ chạy nhanh hơn.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {TECHNIQUES.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTech(t.id)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  activeTech === t.id
                    ? "bg-accent text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <svg viewBox="0 0 600 180" className="w-full max-w-2xl mx-auto">
            {/* Before */}
            <rect x={30} y={30} width={200} height={50} rx={8} fill="#ef4444" opacity={0.7} />
            <text x={130} y={50} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">Trước tối ưu</text>
            <text x={130} y={68} textAnchor="middle" fill="white" fontSize={9}>Tốc độ: 1x | Bộ nhớ: 100%</text>

            {/* Arrow */}
            <text x={300} y={60} textAnchor="middle" fill="#f59e0b" fontSize={20} fontWeight="bold">→</text>
            <text x={300} y={78} textAnchor="middle" fill="#94a3b8" fontSize={9}>{tech.label}</text>

            {/* After */}
            <rect x={370} y={30} width={200} height={50} rx={8} fill="#22c55e" opacity={0.7} />
            <text x={470} y={50} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">Sau tối ưu</text>
            <text x={470} y={68} textAnchor="middle" fill="white" fontSize={9}>
              Nhanh: {tech.speedup} | RAM: {tech.memSave}
            </text>

            {/* Description */}
            <text x={300} y={130} textAnchor="middle" fill="#e2e8f0" fontSize={11}>
              {tech.desc}
            </text>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Tối ưu suy luận</strong> là tập hợp các kỹ thuật giúp mô hình AI chạy
          nhanh hơn, tốn ít bộ nhớ hơn và chi phí thấp hơn khi phục vụ người dùng thực tế.
        </p>
        <p>Bốn kỹ thuật chính:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Lượng tử hoá (Quantization):</strong> Giảm độ chính xác của trọng số từ FP32 xuống FP16, INT8 hoặc INT4 — giảm bộ nhớ và tăng tốc đáng kể.</li>
          <li><strong>Batching liên tục:</strong> Gộp nhiều yêu cầu vào cùng một batch GPU, tận dụng tối đa khả năng song song.</li>
          <li><strong>KV Cache:</strong> Lưu trữ key-value attention đã tính để không cần tính lại cho các token trước đó.</li>
          <li><strong>Tỉa mô hình (Pruning):</strong> Loại bỏ các trọng số có giá trị gần 0, giảm kích thước mà ít ảnh hưởng chất lượng.</li>
        </ol>
        <p>
          Kết hợp nhiều kỹ thuật có thể giảm chi phí suy luận <strong>10-50 lần</strong>,
          biến các mô hình tỷ tham số từ &quot;chỉ dùng trong phòng lab&quot; thành sản phẩm thực tế.
        </p>
      </ExplanationSection>
    </>
  );
}
