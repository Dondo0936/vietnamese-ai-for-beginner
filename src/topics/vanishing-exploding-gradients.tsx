"use client";

import { useState, useMemo } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "vanishing-exploding-gradients",
  title: "Vanishing & Exploding Gradients",
  titleVi: "Gradient triệt tiêu & bùng nổ",
  description:
    "Hai vấn đề khiến việc huấn luyện mạng sâu trở nên khó khăn khi gradient quá nhỏ hoặc quá lớn.",
  category: "neural-fundamentals",
  tags: ["training", "deep-learning", "gradient"],
  difficulty: "intermediate",
  relatedSlugs: [
    "backpropagation",
    "activation-functions",
    "batch-normalization",
    "weight-initialization",
  ],
  vizType: "interactive",
};

export default function VanishingExplodingGradientsTopic() {
  const [multiplier, setMultiplier] = useState(1.0);
  const numLayers = 8;

  const gradients = useMemo(() => {
    const grads: number[] = [];
    let g = 1.0;
    for (let i = 0; i < numLayers; i++) {
      grads.push(g);
      g *= multiplier;
    }
    return grads.reverse(); // Reverse: gradients flow backward
  }, [multiplier]);

  const maxGrad = Math.max(...gradients.map(Math.abs), 1);

  const svgW = 500;
  const svgH = 260;
  const barW = 40;
  const gap = 12;
  const startX = (svgW - numLayers * (barW + gap) + gap) / 2;
  const barMaxH = 140;

  let statusText: string;
  let statusColor: string;
  if (multiplier < 0.6) {
    statusText = "Gradient triệt tiêu! Các lớp đầu gần như không học được.";
    statusColor = "#3b82f6";
  } else if (multiplier <= 1.2) {
    statusText = "Gradient ổn định. Tất cả các lớp đều học hiệu quả.";
    statusColor = "#22c55e";
  } else {
    statusText = "Gradient bùng nổ! Giá trị tăng theo cấp số nhân.";
    statusColor = "#ef4444";
  }

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng trò chơi <strong>&quot;truyền tin&quot;</strong> qua hàng
          dài 10 người. Người cuối nghe một câu rồi thì thầm cho người kế tiếp, cứ
          thế truyền ngược về người đầu tiên.
        </p>
        <p>
          <strong>Vanishing gradient:</strong> Mỗi người nói <em>nhỏ hơn</em> người
          trước. Đến người đầu tiên thì gần như không nghe thấy gì &mdash; các lớp
          đầu không nhận được tín hiệu lỗi để sửa!
        </p>
        <p>
          <strong>Exploding gradient:</strong> Mỗi người nói <em>to hơn</em> người
          trước. Đến người đầu tiên thì tiếng hét đinh tai &mdash; trọng số bị cập
          nhật quá mạnh, mạng mất kiểm soát!
        </p>
        <p>
          Mạng sâu (nhiều lớp) đặc biệt dễ gặp vấn đề này vì gradient phải đi qua
          nhiều phép nhân liên tiếp.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-5">
          {/* Multiplier slider */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted">
              Hệ số gradient tại mỗi lớp:{" "}
              <strong className="text-foreground">{multiplier.toFixed(2)}</strong>
            </label>
            <input
              type="range"
              min="0.2"
              max="2.0"
              step="0.05"
              value={multiplier}
              onChange={(e) => setMultiplier(parseFloat(e.target.value))}
              className="w-full accent-accent"
            />
            <div className="flex justify-between text-xs text-muted">
              <span>0.2 (Triệt tiêu)</span>
              <span>1.0 (Ổn định)</span>
              <span>2.0 (Bùng nổ)</span>
            </div>
          </div>

          {/* Status */}
          <div
            className="rounded-lg p-3 text-center text-sm font-medium"
            style={{
              color: statusColor,
              backgroundColor: `${statusColor}15`,
              border: `1px solid ${statusColor}40`,
            }}
          >
            {statusText}
          </div>

          {/* Gradient magnitude per layer */}
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-xl mx-auto">
            {/* Title */}
            <text x={svgW / 2} y={18} textAnchor="middle" fill="#94a3b8" fontSize="11">
              Biên độ gradient tại mỗi lớp (lan truyền ngược &larr;)
            </text>

            {/* Zero line */}
            <line x1={startX - 5} y1={svgH - 40} x2={startX + numLayers * (barW + gap)} y2={svgH - 40} stroke="#334155" strokeWidth="1" />

            {/* Bars */}
            {gradients.map((g, i) => {
              const x = startX + i * (barW + gap);
              const normG = Math.min(Math.abs(g) / maxGrad, 1);
              const h = normG * barMaxH;
              const y = svgH - 40 - h;

              let barColor = statusColor;
              if (Math.abs(g) < 0.01) barColor = "#334155";

              return (
                <g key={`grad-${i}`}>
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={Math.max(2, h)}
                    rx={4}
                    fill={barColor}
                    opacity={0.8}
                  />
                  {/* Layer label */}
                  <text
                    x={x + barW / 2}
                    y={svgH - 25}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="9"
                  >
                    Lớp {i + 1}
                  </text>
                  {/* Value */}
                  <text
                    x={x + barW / 2}
                    y={y - 5}
                    textAnchor="middle"
                    fill="#e2e8f0"
                    fontSize="8"
                  >
                    {Math.abs(g) < 0.001
                      ? "~0"
                      : Math.abs(g) > 100
                        ? g.toExponential(1)
                        : g.toFixed(2)}
                  </text>
                </g>
              );
            })}

            {/* Direction arrow */}
            <g>
              <line x1={svgW - 40} y1={svgH - 10} x2={50} y2={svgH - 10} stroke="#475569" strokeWidth="1.5" />
              <polygon points={`50,${svgH - 13} 50,${svgH - 7} 42,${svgH - 10}`} fill="#475569" />
              <text x={svgW / 2} y={svgH - 3} textAnchor="middle" fill="#475569" fontSize="8">
                Hướng lan truyền ngược gradient
              </text>
            </g>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          Khi huấn luyện mạng sâu bằng backpropagation, gradient phải đi qua nhiều lớp.
          Tại mỗi lớp, gradient được nhân với đạo hàm cục bộ. Nếu các đạo hàm này
          nhất quán nhỏ hơn 1 hoặc lớn hơn 1, gradient sẽ{" "}
          <strong>thu nhỏ hoặc phóng đại theo cấp số nhân</strong>.
        </p>
        <p>
          <strong>Vanishing Gradient (triệt tiêu):</strong> Gradient tiến về 0 khi đi
          qua nhiều lớp. Các lớp gần đầu vào không nhận được tín hiệu gradient đủ mạnh
          để cập nhật, dẫn đến mạng &quot;ngừng học&quot; ở các lớp sâu. Nguyên nhân
          phổ biến: dùng hàm Sigmoid/Tanh (đạo hàm &lt; 1).
        </p>
        <p>
          <strong>Exploding Gradient (bùng nổ):</strong> Gradient tăng vô hạn, gây ra
          cập nhật trọng số cực lớn, khiến mạng phát sinh NaN. Phổ biến trong RNN.
        </p>
        <p>Các giải pháp đã được phát triển:</p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li><strong>ReLU:</strong> Đạo hàm = 1 khi dương, giảm vanishing gradient.</li>
          <li><strong>Batch Normalization:</strong> Ổn định phân phối giữa các lớp.</li>
          <li><strong>Residual connections (skip connections):</strong> Cho gradient &quot;đi tắt&quot; qua các lớp.</li>
          <li><strong>Gradient clipping:</strong> Giới hạn biên độ gradient để chống bùng nổ.</li>
          <li><strong>Proper initialization:</strong> Xavier/He initialization giữ phương sai ổn định.</li>
        </ul>
      </ExplanationSection>
    </>
  );
}
