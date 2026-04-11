"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "dpo",
  title: "DPO",
  titleVi: "DPO - Tối ưu hóa sở thích trực tiếp",
  description:
    "Phương pháp alignment đơn giản hơn RLHF, tối ưu hóa trực tiếp từ dữ liệu sở thích mà không cần reward model.",
  category: "training-optimization",
  tags: ["dpo", "alignment", "preference", "optimization"],
  difficulty: "advanced",
  relatedSlugs: ["rlhf", "grpo", "fine-tuning"],
  vizType: "static",
};

export default function DPOTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Quay lại ví dụ <strong>dạy đầu bếp</strong>. RLHF giống như thuê một{" "}
          <strong>nhà phê bình ẩm thực</strong> (reward model) chấm điểm mỗi món,
          rồi đầu bếp nấu lại dựa trên điểm. Phức tạp và tốn kém!
        </p>
        <p>
          DPO đơn giản hơn nhiều: bạn chỉ cần cho đầu bếp xem{" "}
          <strong>cặp so sánh trực tiếp</strong>: &quot;Món A ngon hơn món B&quot;.
          Đầu bếp tự học từ so sánh này mà <strong>không cần nhà phê bình</strong>!
        </p>
        <p>
          Kết quả gần tương đương RLHF nhưng quá trình đơn giản hơn rất nhiều &mdash;
          không cần huấn luyện reward model, không cần thuật toán RL phức tạp.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <svg viewBox="0 0 700 400" className="w-full max-w-3xl mx-auto">
            <text x="350" y="25" textAnchor="middle" fill="#e2e8f0" fontSize="14" fontWeight="bold">
              RLHF vs DPO
            </text>

            {/* RLHF pipeline */}
            <rect x="20" y="45" width="660" height="140" rx="12" fill="#1e293b" stroke="#ef4444" strokeWidth="1.5" />
            <text x="50" y="70" fill="#ef4444" fontSize="12" fontWeight="bold">RLHF (3 bước phức tạp)</text>

            {[
              { label: "Dữ liệu\nsở thích", x: 60, color: "#64748b" },
              { label: "Huấn luyện\nReward Model", x: 210, color: "#f59e0b" },
              { label: "Chạy RL\n(PPO)", x: 370, color: "#ef4444" },
              { label: "Mô hình\nđã align", x: 540, color: "#22c55e" },
            ].map((item, i) => (
              <g key={i}>
                <rect x={item.x} y="85" width="120" height="50" rx="8" fill="#334155" stroke={item.color} strokeWidth="1" />
                <text x={item.x + 60} y="108" textAnchor="middle" fill={item.color} fontSize="9">
                  {item.label.split("\n")[0]}
                </text>
                <text x={item.x + 60} y="122" textAnchor="middle" fill={item.color} fontSize="9">
                  {item.label.split("\n")[1]}
                </text>
                {i < 3 && (
                  <line x1={item.x + 120} y1="110" x2={item.x + 150} y2="110"
                    stroke="#475569" strokeWidth="1.5" markerEnd="url(#arrow-dpo)" />
                )}
              </g>
            ))}

            <text x="350" y="170" textAnchor="middle" fill="#64748b" fontSize="8">
              Cần reward model riêng + RL không ổn định + nhiều hyperparameter
            </text>

            {/* DPO pipeline */}
            <rect x="20" y="210" width="660" height="140" rx="12" fill="#1e293b" stroke="#22c55e" strokeWidth="1.5" />
            <text x="50" y="235" fill="#22c55e" fontSize="12" fontWeight="bold">DPO (1 bước đơn giản)</text>

            {[
              { label: "Dữ liệu\nsở thích", x: 120, color: "#64748b" },
              { label: "Tối ưu\ntrực tiếp", x: 330, color: "#22c55e" },
              { label: "Mô hình\nđã align", x: 500, color: "#22c55e" },
            ].map((item, i) => (
              <g key={i}>
                <rect x={item.x} y="250" width="120" height="50" rx="8" fill="#334155" stroke={item.color} strokeWidth="1" />
                <text x={item.x + 60} y="273" textAnchor="middle" fill={item.color} fontSize="9">
                  {item.label.split("\n")[0]}
                </text>
                <text x={item.x + 60} y="287" textAnchor="middle" fill={item.color} fontSize="9">
                  {item.label.split("\n")[1]}
                </text>
                {i < 2 && (
                  <line x1={item.x + 120} y1="275" x2={item.x + (i === 0 ? 210 : 170)} y2="275"
                    stroke="#475569" strokeWidth="1.5" markerEnd="url(#arrow-dpo)" />
                )}
              </g>
            ))}

            <text x="350" y="335" textAnchor="middle" fill="#64748b" fontSize="8">
              Không cần reward model, loss function đơn giản như supervised learning
            </text>

            {/* Comparison stats */}
            <text x="350" y="375" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="bold">
              DPO: Đơn giản hơn, ổn định hơn, kết quả tương đương RLHF
            </text>

            <defs>
              <marker id="arrow-dpo" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#475569" />
              </marker>
            </defs>
          </svg>

          {/* Comparison cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-background/50 border border-red-500/30 p-3">
              <p className="text-sm font-semibold text-red-400">RLHF</p>
              <ul className="text-xs text-muted space-y-1 mt-1 list-disc list-inside">
                <li>Cần huấn luyện reward model riêng</li>
                <li>Thuật toán RL (PPO) không ổn định</li>
                <li>Nhiều hyperparameter cần chỉnh</li>
                <li>Tốn tài nguyên tính toán lớn</li>
              </ul>
            </div>
            <div className="rounded-lg bg-background/50 border border-green-500/30 p-3">
              <p className="text-sm font-semibold text-green-400">DPO</p>
              <ul className="text-xs text-muted space-y-1 mt-1 list-disc list-inside">
                <li>Tối ưu trực tiếp từ dữ liệu sở thích</li>
                <li>Ổn định như supervised learning</li>
                <li>Ít hyperparameter hơn nhiều</li>
                <li>Dễ triển khai và debug hơn</li>
              </ul>
            </div>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>DPO (Direct Preference Optimization)</strong> là phương pháp alignment
          đơn giản hóa RLHF bằng cách tối ưu hóa trực tiếp từ dữ liệu sở thích con
          người, bỏ qua bước huấn luyện reward model.
        </p>
        <p>Ý tưởng cốt lõi:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Mục tiêu RLHF:</strong> Tối đa reward - KL penalty. DPO cho thấy
            nghiệm tối ưu của bài toán này có dạng closed-form.
          </li>
          <li>
            <strong>Loss function DPO:</strong> Chỉ cần dữ liệu (prompt, y_win, y_lose)
            và mô hình tham chiếu. Tính loss giống cross-entropy quen thuộc.
          </li>
          <li>
            <strong>Huấn luyện:</strong> Chỉ cần một bước supervised learning, tăng xác
            suất cho y_win và giảm cho y_lose.
          </li>
        </ol>
        <p>
          DPO ngày càng phổ biến trong cộng đồng vì tính đơn giản. Tuy nhiên, RLHF
          vẫn có lợi thế trong một số tình huống cần khám phá không gian chính sách
          rộng hơn.
        </p>
      </ExplanationSection>
    </>
  );
}
