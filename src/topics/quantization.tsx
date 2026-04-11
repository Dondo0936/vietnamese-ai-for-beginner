"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "quantization",
  title: "Quantization",
  titleVi: "Lượng tử hóa mô hình",
  description:
    "Kỹ thuật giảm kích thước mô hình bằng cách giảm độ chính xác số học, từ FP32 xuống INT8/INT4.",
  category: "training-optimization",
  tags: ["quantization", "optimization", "inference", "compression"],
  difficulty: "intermediate",
  relatedSlugs: ["qlora", "pruning", "mixed-precision"],
  vizType: "interactive",
};

const PRECISIONS = [
  { name: "FP32", bits: 32, size: 100, quality: 100, speed: 1, color: "#3b82f6" },
  { name: "FP16", bits: 16, size: 50, quality: 99.9, speed: 2, color: "#8b5cf6" },
  { name: "INT8", bits: 8, size: 25, quality: 99.5, speed: 3.5, color: "#f59e0b" },
  { name: "INT4", bits: 4, size: 12.5, quality: 97, speed: 5, color: "#22c55e" },
];

export default function QuantizationTopic() {
  const [selected, setSelected] = useState(0);

  const current = PRECISIONS[selected];

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn chụp ảnh bằng máy ảnh chuyên nghiệp: file RAW{" "}
          <strong>50MB</strong> chất lượng tuyệt hảo (<strong>FP32</strong>).
        </p>
        <p>
          Khi chia sẻ lên mạng, bạn nén thành JPEG <strong>5MB</strong> (
          <strong>FP16</strong>) &mdash; mắt thường không phân biệt được.
          Nén tiếp thành thumbnail <strong>500KB</strong> (<strong>INT8</strong>)
          &mdash; vẫn nhận ra nội dung. Nén cực mạnh thành icon{" "}
          <strong>100KB</strong> (<strong>INT4</strong>) &mdash; hơi mờ nhưng
          vẫn dùng được!
        </p>
        <p>
          Lượng tử hóa mô hình cũng vậy: <strong>giảm độ chính xác</strong> của
          mỗi số, đổi lại mô hình nhỏ hơn và chạy nhanh hơn!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          {/* Precision selector */}
          <div className="flex flex-wrap gap-2">
            {PRECISIONS.map((p, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  selected === i
                    ? "text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
                style={selected === i ? { backgroundColor: p.color } : {}}
              >
                {p.name} ({p.bits}-bit)
              </button>
            ))}
          </div>

          {/* Comparison bars */}
          <svg viewBox="0 0 600 240" className="w-full max-w-2xl mx-auto">
            <text x="300" y="20" textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="bold">
              So sánh {current.name} ({current.bits}-bit)
            </text>

            {/* Size bar */}
            <text x="20" y="55" fill="#94a3b8" fontSize="10">Kích thước</text>
            <rect x="120" y="40" width={current.size * 4} height="22" rx="4" fill={current.color} opacity={0.8} />
            <text x={130 + current.size * 4} y="56" fill={current.color} fontSize="10" fontWeight="bold">
              {current.size}%
            </text>
            <rect x="120" y="40" width="400" height="22" rx="4" fill="none" stroke="#334155" strokeWidth="1" />

            {/* Quality bar */}
            <text x="20" y="95" fill="#94a3b8" fontSize="10">Chất lượng</text>
            <rect x="120" y="80" width={current.quality * 4} height="22" rx="4" fill="#22c55e" opacity={0.8} />
            <text x={130 + current.quality * 4} y="96" fill="#22c55e" fontSize="10" fontWeight="bold">
              {current.quality}%
            </text>
            <rect x="120" y="80" width="400" height="22" rx="4" fill="none" stroke="#334155" strokeWidth="1" />

            {/* Speed bar */}
            <text x="20" y="135" fill="#94a3b8" fontSize="10">Tốc độ</text>
            <rect x="120" y="120" width={current.speed * 80} height="22" rx="4" fill="#f59e0b" opacity={0.8} />
            <text x={130 + current.speed * 80} y="136" fill="#f59e0b" fontSize="10" fontWeight="bold">
              {current.speed}x
            </text>
            <rect x="120" y="120" width="400" height="22" rx="4" fill="none" stroke="#334155" strokeWidth="1" />

            {/* Number representation */}
            <text x="300" y="180" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="bold">
              Biểu diễn số 3.14159 trong {current.name}
            </text>
            <rect x="100" y="190" width="400" height="35" rx="8" fill="#1e293b" stroke={current.color} strokeWidth="1.5" />
            <text x="300" y="213" textAnchor="middle" fill={current.color} fontSize="11" fontFamily="monospace">
              {current.bits === 32
                ? "3.14159265358979... (32 bit chính xác)"
                : current.bits === 16
                  ? "3.14160... (16 bit, mất vài chữ số)"
                  : current.bits === 8
                    ? "3.14 (8 bit, chỉ giữ 3 chữ số)"
                    : "3.0 (4 bit, làm tròn thô)"}
            </text>
          </svg>

          {/* Model size example */}
          <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
            <p className="text-sm text-muted">
              Ví dụ: Mô hình Llama 70B &mdash;{" "}
              {current.bits === 32
                ? "280 GB (không chạy được trên consumer GPU)"
                : current.bits === 16
                  ? "140 GB (cần 2+ GPU A100 80GB)"
                  : current.bits === 8
                    ? "70 GB (1 GPU A100 80GB)"
                    : "35 GB (1 GPU RTX 4090 24GB + offload)"}
            </p>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Lượng tử hóa</strong> (Quantization) là kỹ thuật giảm số bit dùng để
          biểu diễn mỗi tham số trong mô hình, từ đó giảm kích thước và tăng tốc độ
          suy luận.
        </p>
        <p>Các phương pháp lượng tử hóa:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Post-Training Quantization (PTQ):</strong> Lượng tử hóa sau khi huấn
            luyện xong. Nhanh nhưng có thể giảm chất lượng, đặc biệt ở 4-bit.
          </li>
          <li>
            <strong>Quantization-Aware Training (QAT):</strong> Mô phỏng lượng tử hóa
            trong quá trình huấn luyện, giúp mô hình thích nghi và giữ chất lượng tốt hơn.
          </li>
          <li>
            <strong>GPTQ / AWQ / GGUF:</strong> Các format lượng tử hóa phổ biến cho LLM,
            mỗi loại tối ưu cho phần cứng và trường hợp sử dụng khác nhau.
          </li>
        </ol>
        <p>
          Lượng tử hóa là chìa khóa để <strong>dân chủ hóa AI</strong>: cho phép chạy
          các mô hình mạnh mẽ trên phần cứng bình thường, từ laptop đến điện thoại.
        </p>
      </ExplanationSection>
    </>
  );
}
