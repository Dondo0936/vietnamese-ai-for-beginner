"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "regularization",
  title: "Regularization",
  titleVi: "Chính quy hóa",
  description:
    "Các kỹ thuật chống overfitting bằng cách thêm ràng buộc vào quá trình huấn luyện.",
  category: "neural-fundamentals",
  tags: ["training", "overfitting", "techniques"],
  difficulty: "intermediate",
  relatedSlugs: ["overfitting-underfitting", "loss-functions", "batch-normalization"],
  vizType: "interactive",
};

type RegType = "none" | "l1" | "l2" | "dropout";

export default function RegularizationTopic() {
  const [regType, setRegType] = useState<RegType>("none");
  const [strength, setStrength] = useState(0.5);

  // Simulated weights for visualization
  const baseWeights = [0.8, -1.2, 0.3, 2.1, -0.5, 0.9, -1.8, 0.1, 1.5, -0.7, 0.4, 1.1];

  const getRegularizedWeights = () => {
    return baseWeights.map((w) => {
      if (regType === "none") return w;
      if (regType === "l1") {
        // L1: push toward 0, some become exactly 0
        const shrink = strength * 0.8;
        if (Math.abs(w) < shrink) return 0;
        return w > 0 ? w - shrink : w + shrink;
      }
      if (regType === "l2") {
        // L2: shrink proportionally
        return w * (1 - strength * 0.4);
      }
      // Dropout: randomly zero out
      const dropProb = strength * 0.6;
      return Math.random() < dropProb ? 0 : w;
    });
  };

  const weights = getRegularizedWeights();

  const svgW = 460;
  const svgH = 200;
  const barW = 28;
  const gap = 6;
  const startX = 40;

  const maxAbs = 2.5;
  const midY = svgH / 2;
  const scale = (svgH / 2 - 20) / maxAbs;

  const regConfigs: Record<RegType, { label: string; color: string; desc: string }> = {
    none: { label: "Không chính quy", color: "#64748b", desc: "Trọng số tự do, dễ overfitting" },
    l1: { label: "L1 (Lasso)", color: "#3b82f6", desc: "Đẩy trọng số về 0 - tạo sparsity" },
    l2: { label: "L2 (Ridge)", color: "#22c55e", desc: "Thu nhỏ trọng số - phân bổ đều" },
    dropout: { label: "Dropout", color: "#f59e0b", desc: "Tắt ngẫu nhiên một số nơ-ron" },
  };

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang <strong>huấn luyện đội bóng đá</strong>. Nếu để
          tự do, một vài cầu thủ ngôi sao sẽ &quot;ôm hết&quot; bóng, còn các cầu thủ
          khác đứng chơi &mdash; đội sẽ phụ thuộc quá nhiều vào vài người (overfitting).
        </p>
        <p>
          <strong>L1 (Lasso):</strong> Giống luật &quot;cầu thủ nào không đóng góp thì
          cho nghỉ&quot;. Loại bỏ những trọng số không cần thiết, giữ lại ít nhưng quan
          trọng.
        </p>
        <p>
          <strong>L2 (Ridge):</strong> Giống luật &quot;mỗi cầu thủ chỉ được giữ bóng
          tối đa 5 giây&quot;. Không loại ai nhưng buộc mọi người đóng góp đều hơn.
        </p>
        <p>
          <strong>Dropout:</strong> Giống việc &quot;mỗi trận đấu tập, ngẫu nhiên cho
          vài cầu thủ nghỉ&quot;. Buộc đội phải biết chơi với bất kỳ đội hình nào!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-5">
          {/* Type selector */}
          <div className="flex flex-wrap gap-2">
            {(Object.keys(regConfigs) as RegType[]).map((type) => (
              <button
                key={type}
                onClick={() => setRegType(type)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  regType === type
                    ? "text-white shadow-md"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
                style={regType === type ? { backgroundColor: regConfigs[type].color } : {}}
              >
                {regConfigs[type].label}
              </button>
            ))}
          </div>

          {/* Strength slider */}
          {regType !== "none" && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted">
                Cường độ chính quy hóa: <strong className="text-foreground">{strength.toFixed(2)}</strong>
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={strength}
                onChange={(e) => setStrength(parseFloat(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
          )}

          {/* Description */}
          <div
            className="rounded-lg p-3 text-center text-sm"
            style={{
              color: regConfigs[regType].color,
              backgroundColor: `${regConfigs[regType].color}15`,
              border: `1px solid ${regConfigs[regType].color}40`,
            }}
          >
            {regConfigs[regType].desc}
          </div>

          {/* Weight bar chart */}
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-xl mx-auto">
            {/* Center line */}
            <line x1="30" y1={midY} x2={svgW - 10} y2={midY} stroke="#334155" strokeWidth="1" />
            <text x="15" y={midY + 4} fill="#64748b" fontSize="9" textAnchor="middle">
              0
            </text>

            {/* Weight bars */}
            {weights.map((w, i) => {
              const x = startX + i * (barW + gap);
              const barHeight = Math.abs(w) * scale;
              const y = w >= 0 ? midY - barHeight : midY;
              const isZero = Math.abs(w) < 0.01;

              return (
                <g key={`weight-${i}`}>
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={Math.max(1, barHeight)}
                    rx={3}
                    fill={isZero ? "#334155" : regConfigs[regType].color}
                    opacity={isZero ? 0.3 : 0.8}
                  />
                  <text
                    x={x + barW / 2}
                    y={svgH - 5}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="8"
                  >
                    w{i + 1}
                  </text>
                  {/* Value on top/bottom of bar */}
                  <text
                    x={x + barW / 2}
                    y={w >= 0 ? y - 4 : y + barHeight + 12}
                    textAnchor="middle"
                    fill={isZero ? "#475569" : "#e2e8f0"}
                    fontSize="8"
                  >
                    {w.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* Label */}
            <text x={svgW / 2} y={15} textAnchor="middle" fill="#94a3b8" fontSize="11">
              Phân phối trọng số
            </text>
          </svg>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="rounded-lg bg-background/50 border border-border p-2">
              <p className="text-muted">Trọng số = 0</p>
              <p className="text-lg font-bold text-foreground">
                {weights.filter((w) => Math.abs(w) < 0.01).length}
              </p>
            </div>
            <div className="rounded-lg bg-background/50 border border-border p-2">
              <p className="text-muted">Trung bình |w|</p>
              <p className="text-lg font-bold text-foreground">
                {(weights.reduce((s, w) => s + Math.abs(w), 0) / weights.length).toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg bg-background/50 border border-border p-2">
              <p className="text-muted">Max |w|</p>
              <p className="text-lg font-bold text-foreground">
                {Math.max(...weights.map(Math.abs)).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Regularization (chính quy hóa)</strong> là tập hợp các kỹ thuật nhằm
          chống overfitting bằng cách thêm ràng buộc vào mô hình, ngăn nó trở nên quá
          phức tạp.
        </p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>
            <strong>L1 (Lasso):</strong> Thêm &lambda; &sdot; &Sigma;|w_i| vào loss.
            Đẩy nhiều trọng số về đúng 0, tạo ra mô hình thưa (sparse). Hữu ích cho
            feature selection.
          </li>
          <li>
            <strong>L2 (Ridge / Weight Decay):</strong> Thêm &lambda; &sdot;
            &Sigma;w_i&sup2; vào loss. Thu nhỏ tất cả trọng số nhưng hiếm khi về 0.
            Phổ biến nhất trong thực tế.
          </li>
          <li>
            <strong>Dropout:</strong> Trong mỗi bước huấn luyện, ngẫu nhiên &quot;tắt&quot;
            một tỷ lệ nơ-ron (thường 20-50%). Buộc mạng không phụ thuộc vào bất kỳ nơ-ron
            đơn lẻ nào. Chỉ áp dụng khi train, không dùng khi inference.
          </li>
        </ul>
        <p>
          Trong thực tế, người ta thường kết hợp nhiều kỹ thuật: <strong>L2 + Dropout
          + Early Stopping</strong> là combo phổ biến nhất để đạt hiệu quả tốt nhất.
        </p>
      </ExplanationSection>
    </>
  );
}
