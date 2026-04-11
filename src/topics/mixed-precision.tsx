"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "mixed-precision",
  title: "Mixed Precision Training",
  titleVi: "Huấn luyện hỗn hợp độ chính xác",
  description:
    "Kỹ thuật kết hợp FP16 và FP32 trong huấn luyện để tăng tốc và giảm bộ nhớ mà vẫn giữ chính xác.",
  category: "training-optimization",
  tags: ["mixed-precision", "fp16", "training", "optimization"],
  difficulty: "advanced",
  relatedSlugs: ["quantization", "lora", "fine-tuning"],
  vizType: "static",
};

export default function MixedPrecisionTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang <strong>xây nhà</strong>. Không phải tất cả đều cần
          vật liệu cao cấp:
        </p>
        <p>
          <strong>Móng nhà và kết cấu chịu lực</strong> cần bê tông cường độ cao (
          <strong>FP32</strong> &mdash; độ chính xác cao). Nhưng <strong>tường ngăn
          và trang trí</strong> chỉ cần vật liệu nhẹ (
          <strong>FP16</strong> &mdash; độ chính xác thấp hơn).
        </p>
        <p>
          Mixed Precision làm tương tự: dùng <strong>FP16 cho phần lớn phép tính</strong>{" "}
          (nhanh, nhẹ) nhưng giữ <strong>FP32 cho các bước quan trọng</strong> (cập nhật
          trọng số, loss scaling) để tránh lỗi số học.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <svg viewBox="0 0 700 420" className="w-full max-w-3xl mx-auto">
            <text x="350" y="25" textAnchor="middle" fill="#e2e8f0" fontSize="14" fontWeight="bold">
              Luồng huấn luyện Mixed Precision
            </text>

            {/* Master weights FP32 */}
            <rect x="250" y="45" width="200" height="45" rx="8" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
            <text x="350" y="65" textAnchor="middle" fill="#3b82f6" fontSize="10" fontWeight="bold">
              Master Weights (FP32)
            </text>
            <text x="350" y="80" textAnchor="middle" fill="#64748b" fontSize="8">
              Bản gốc độ chính xác cao
            </text>

            {/* Arrow down */}
            <line x1="350" y1="90" x2="350" y2="110" stroke="#475569" strokeWidth="1.5" />
            <text x="370" y="105" fill="#f59e0b" fontSize="8">Copy &darr; FP16</text>

            {/* FP16 weights */}
            <rect x="250" y="110" width="200" height="40" rx="8" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="350" y="135" textAnchor="middle" fill="#f59e0b" fontSize="10" fontWeight="bold">
              FP16 Weights (Bản sao nhẹ)
            </text>

            {/* Forward pass */}
            <line x1="350" y1="150" x2="350" y2="175" stroke="#475569" strokeWidth="1.5" />

            <rect x="200" y="175" width="300" height="45" rx="8" fill="#14532d" stroke="#22c55e" strokeWidth="1.5" />
            <text x="350" y="195" textAnchor="middle" fill="#22c55e" fontSize="10" fontWeight="bold">
              Forward Pass (FP16) &mdash; Nhanh 2x
            </text>
            <text x="350" y="210" textAnchor="middle" fill="#86efac" fontSize="8">
              Nhân ma trận, convolution, attention
            </text>

            {/* Loss */}
            <line x1="350" y1="220" x2="350" y2="240" stroke="#475569" strokeWidth="1.5" />

            <rect x="250" y="240" width="200" height="40" rx="8" fill="#1e293b" stroke="#ef4444" strokeWidth="1.5" />
            <text x="350" y="255" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">
              Loss (FP32)
            </text>
            <text x="350" y="270" textAnchor="middle" fill="#fca5a5" fontSize="8">
              Loss Scaling: x1024
            </text>

            {/* Backward */}
            <line x1="350" y1="280" x2="350" y2="300" stroke="#475569" strokeWidth="1.5" />

            <rect x="200" y="300" width="300" height="45" rx="8" fill="#14532d" stroke="#22c55e" strokeWidth="1.5" />
            <text x="350" y="320" textAnchor="middle" fill="#22c55e" fontSize="10" fontWeight="bold">
              Backward Pass (FP16) &mdash; Nhanh 2x
            </text>
            <text x="350" y="335" textAnchor="middle" fill="#86efac" fontSize="8">
              Tính gradient bằng FP16
            </text>

            {/* Update */}
            <line x1="350" y1="345" x2="350" y2="365" stroke="#475569" strokeWidth="1.5" />

            <rect x="200" y="365" width="300" height="45" rx="8" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
            <text x="350" y="385" textAnchor="middle" fill="#3b82f6" fontSize="10" fontWeight="bold">
              Cập nhật trọng số (FP32)
            </text>
            <text x="350" y="400" textAnchor="middle" fill="#93c5fd" fontSize="8">
              Gradient FP16 &rarr; unscale &rarr; cập nhật Master FP32
            </text>

            {/* Loop arrow */}
            <path d="M 500 385 L 520 385 L 520 60 L 450 60" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="4,3" markerEnd="url(#arrow-mp)" />
            <text x="530" y="220" fill="#8b5cf6" fontSize="8" transform="rotate(90, 530, 220)">
              Lặp lại mỗi batch
            </text>

            <defs>
              <marker id="arrow-mp" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#8b5cf6" />
              </marker>
            </defs>
          </svg>

          {/* Benefits */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-background/50 border border-green-500/30 p-3 text-center">
              <p className="text-lg font-bold text-green-400">~2x</p>
              <p className="text-xs text-muted">Tăng tốc huấn luyện</p>
            </div>
            <div className="rounded-lg bg-background/50 border border-green-500/30 p-3 text-center">
              <p className="text-lg font-bold text-green-400">~50%</p>
              <p className="text-xs text-muted">Giảm bộ nhớ GPU</p>
            </div>
            <div className="rounded-lg bg-background/50 border border-green-500/30 p-3 text-center">
              <p className="text-lg font-bold text-green-400">~0%</p>
              <p className="text-xs text-muted">Mất mát chất lượng</p>
            </div>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Mixed Precision Training</strong> kết hợp hai độ chính xác (FP16 và FP32)
          trong quá trình huấn luyện: FP16 cho các phép tính nặng (forward/backward pass)
          và FP32 cho các bước nhạy cảm (cập nhật trọng số).
        </p>
        <p>Ba kỹ thuật quan trọng:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>FP32 Master Weights:</strong> Giữ một bản sao FP32 của trọng số để
            tránh mất mát thông tin khi cập nhật gradient rất nhỏ.
          </li>
          <li>
            <strong>Loss Scaling:</strong> Nhân loss lên hệ số lớn (ví dụ 1024) trước
            backward pass để tránh gradient quá nhỏ bị làm tròn về 0 trong FP16.
          </li>
          <li>
            <strong>FP16 Compute:</strong> Forward và backward pass dùng FP16, tận dụng
            Tensor Cores trên GPU NVIDIA để tính toán nhanh gấp 2 lần.
          </li>
        </ol>
        <p>
          Mixed Precision là tiêu chuẩn trong huấn luyện LLM hiện đại. Với BF16
          (Brain Float 16), loss scaling thường không cần thiết vì BF16 có dải biểu
          diễn rộng hơn FP16.
        </p>
      </ExplanationSection>
    </>
  );
}
