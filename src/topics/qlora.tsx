"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "qlora",
  title: "QLoRA",
  titleVi: "QLoRA - LoRA lượng tử hóa",
  description:
    "Kết hợp lượng tử hóa 4-bit với LoRA, cho phép fine-tune mô hình 65B trên GPU 48GB.",
  category: "training-optimization",
  tags: ["qlora", "quantization", "lora", "efficiency"],
  difficulty: "advanced",
  relatedSlugs: ["lora", "quantization", "fine-tuning"],
  vizType: "static",
};

export default function QLoRATopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Nếu LoRA là đặt <strong>lớp kính mỏng</strong> lên bức tranh để vẽ thêm,
          thì QLoRA còn đi xa hơn: nó <strong>nén bức tranh gốc</strong> thành file
          JPEG nhỏ (lượng tử hóa 4-bit), rồi mới đặt lớp kính LoRA lên trên.
        </p>
        <p>
          Giống như bạn có <strong>căn phòng nhỏ</strong> (GPU 24GB) nhưng muốn treo
          một bức tranh khổng lồ (mô hình 65B). Bạn{" "}
          <strong>thu nhỏ bức tranh</strong> (quantize) để vừa phòng, rồi vẽ thêm
          chi tiết mới trên lớp kính (LoRA).
        </p>
        <p>
          Kết quả: fine-tune mô hình siêu lớn trên phần cứng bình thường, với chất
          lượng gần bằng full fine-tuning!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          {/* Memory comparison chart */}
          <svg viewBox="0 0 700 360" className="w-full max-w-3xl mx-auto">
            <text x="350" y="25" textAnchor="middle" fill="#e2e8f0" fontSize="14" fontWeight="bold">
              So sánh bộ nhớ GPU cần thiết (Mô hình 65B)
            </text>

            {/* Bars */}
            {[
              { label: "Full Fine-tuning", mem: 780, color: "#ef4444", unit: "GB", desc: "FP16 + Optimizer + Gradients" },
              { label: "LoRA (FP16)", mem: 156, color: "#f59e0b", unit: "GB", desc: "FP16 gốc + LoRA adapters" },
              { label: "QLoRA (4-bit)", mem: 33, color: "#22c55e", unit: "GB", desc: "4-bit gốc + LoRA FP16" },
            ].map((item, i) => {
              const barWidth = (item.mem / 780) * 420;
              const y = 60 + i * 95;
              return (
                <g key={i}>
                  <text x="20" y={y + 15} fill="#e2e8f0" fontSize="11" fontWeight="bold">
                    {item.label}
                  </text>
                  <text x="20" y={y + 32} fill="#64748b" fontSize="8">
                    {item.desc}
                  </text>
                  <rect x="220" y={y} width={barWidth} height="40" rx="6" fill={item.color} opacity={0.8} />
                  <text x={225 + barWidth} y={y + 25} fill={item.color} fontSize="12" fontWeight="bold">
                    {item.mem} {item.unit}
                  </text>

                  {/* GPU indicator */}
                  {item.mem <= 48 && (
                    <text x={225 + barWidth} y={y + 42} fill="#22c55e" fontSize="8">
                      1 GPU A100 (48GB)
                    </text>
                  )}
                  {item.mem > 48 && item.mem <= 160 && (
                    <text x={225 + barWidth} y={y + 42} fill="#f59e0b" fontSize="8">
                      4 GPU A100
                    </text>
                  )}
                  {item.mem > 160 && (
                    <text x={225 + barWidth} y={y + 42} fill="#ef4444" fontSize="8">
                      16+ GPU A100
                    </text>
                  )}
                </g>
              );
            })}

            {/* QLoRA innovations */}
            <text x="350" y="330" textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="bold">
              Ba đổi mới chính của QLoRA
            </text>

            {[
              { name: "NF4 Quantization", desc: "Lượng tử hóa 4-bit phù hợp phân bố chuẩn", x: 120 },
              { name: "Double Quantization", desc: "Lượng tử hóa cả hằng số lượng tử hóa", x: 350 },
              { name: "Paged Optimizers", desc: "Quản lý bộ nhớ GPU thông minh", x: 580 },
            ].map((item, i) => (
              <g key={i}>
                <rect x={item.x - 100} y={340} width="200" height="18" rx="4" fill="#334155" />
                <text x={item.x} y={353} textAnchor="middle" fill="#22c55e" fontSize="8" fontWeight="bold">
                  {item.name}
                </text>
              </g>
            ))}
          </svg>

          {/* Key stats */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-background/50 border border-green-500/30 p-3 text-center">
              <p className="text-lg font-bold text-green-400">~96%</p>
              <p className="text-xs text-muted">Tiết kiệm bộ nhớ so với Full FT</p>
            </div>
            <div className="rounded-lg bg-background/50 border border-green-500/30 p-3 text-center">
              <p className="text-lg font-bold text-green-400">4-bit</p>
              <p className="text-xs text-muted">Lượng tử hóa trọng số gốc</p>
            </div>
            <div className="rounded-lg bg-background/50 border border-green-500/30 p-3 text-center">
              <p className="text-lg font-bold text-green-400">~99%</p>
              <p className="text-xs text-muted">Chất lượng so với Full FT</p>
            </div>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>QLoRA</strong> (Quantized LoRA) kết hợp lượng tử hóa 4-bit với LoRA,
          cho phép fine-tune các mô hình khổng lồ trên phần cứng consumer-grade mà
          vẫn đạt chất lượng gần bằng full fine-tuning.
        </p>
        <p>Ba đổi mới kỹ thuật chính:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>NF4 (NormalFloat 4-bit):</strong> Kiểu dữ liệu 4-bit tối ưu cho phân
            bố trọng số dạng chuẩn (Gaussian), bảo toàn thông tin tốt hơn INT4 thông thường.
          </li>
          <li>
            <strong>Double Quantization:</strong> Lượng tử hóa cả các hằng số quantization,
            tiết kiệm thêm ~0.37 bit mỗi tham số.
          </li>
          <li>
            <strong>Paged Optimizers:</strong> Sử dụng NVIDIA unified memory để tự động
            chuyển dữ liệu giữa GPU và CPU khi cần, tránh lỗi hết bộ nhớ.
          </li>
        </ol>
        <p>
          QLoRA cho phép fine-tune mô hình 65B tham số trên <strong>một GPU 48GB</strong>,
          mở ra khả năng tùy biến LLM cho cá nhân và doanh nghiệp nhỏ.
        </p>
      </ExplanationSection>
    </>
  );
}
