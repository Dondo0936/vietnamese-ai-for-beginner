"use client";

import { useState, useMemo } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "weight-initialization",
  title: "Weight Initialization",
  titleVi: "Khởi tạo trọng số",
  description:
    "Chiến lược chọn giá trị ban đầu cho trọng số, ảnh hưởng lớn đến tốc độ và khả năng hội tụ.",
  category: "neural-fundamentals",
  tags: ["training", "techniques", "fundamentals"],
  difficulty: "intermediate",
  relatedSlugs: ["vanishing-exploding-gradients", "activation-functions", "batch-normalization"],
  vizType: "static",
};

type InitMethod = "zeros" | "random-large" | "xavier" | "he";

// Seeded pseudo-random for consistent display
function seededRandom(seed: number) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateWeights(method: InitMethod, count: number): number[] {
  const weights: number[] = [];
  const fanIn = 128;

  for (let i = 0; i < count; i++) {
    const r = seededRandom(i + 42); // consistent seed
    const r2 = seededRandom(i + 99);
    // Box-Muller for normal-ish distribution
    const normal = Math.sqrt(-2 * Math.log(Math.max(0.001, r))) * Math.cos(2 * Math.PI * r2);

    switch (method) {
      case "zeros":
        weights.push(0);
        break;
      case "random-large":
        weights.push(normal * 2.0);
        break;
      case "xavier":
        weights.push(normal * Math.sqrt(1.0 / fanIn));
        break;
      case "he":
        weights.push(normal * Math.sqrt(2.0 / fanIn));
        break;
    }
  }
  return weights;
}

export default function WeightInitializationTopic() {
  const [method, setMethod] = useState<InitMethod>("xavier");
  const count = 50;

  const weights = useMemo(() => generateWeights(method, count), [method]);

  const methodConfig: Record<InitMethod, { label: string; color: string; desc: string }> = {
    zeros: {
      label: "Zeros",
      color: "#64748b",
      desc: "Tất cả = 0. Mạng không học được (symmetry problem).",
    },
    "random-large": {
      label: "Random lớn",
      color: "#ef4444",
      desc: "Ngẫu nhiên biên độ lớn. Dễ gây bùng nổ gradient.",
    },
    xavier: {
      label: "Xavier/Glorot",
      color: "#3b82f6",
      desc: "Var = 1/fan_in. Tốt cho Sigmoid/Tanh.",
    },
    he: {
      label: "He/Kaiming",
      color: "#22c55e",
      desc: "Var = 2/fan_in. Tốt nhất cho ReLU.",
    },
  };

  const svgW = 470;
  const svgH = 200;
  const pad = 30;

  // Build histogram
  const bins = 20;
  const maxAbs = method === "random-large" ? 5 : method === "zeros" ? 0.5 : 0.5;
  const binWidth = (2 * maxAbs) / bins;

  const histogram = useMemo(() => {
    const counts = new Array(bins).fill(0);
    weights.forEach((w) => {
      const idx = Math.floor((w + maxAbs) / (2 * maxAbs) * bins);
      const clampedIdx = Math.max(0, Math.min(bins - 1, idx));
      counts[clampedIdx]++;
    });
    return counts;
  }, [weights, maxAbs]);

  const maxCount = Math.max(...histogram, 1);
  const barW = (svgW - 2 * pad) / bins - 1;
  const barMaxH = svgH - 2 * pad - 20;

  // Stats
  const meanW = weights.reduce((s, w) => s + w, 0) / weights.length;
  const varW = weights.reduce((s, w) => s + (w - meanW) ** 2, 0) / weights.length;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang chuẩn bị <strong>một đội vận động viên</strong> cho
          cuộc đua. Trước khi xuất phát, mỗi vận động viên phải đứng ở một{" "}
          <strong>vị trí ban đầu</strong> trên đường đua.
        </p>
        <p>
          <strong>Zeros:</strong> Tất cả đứng chung một chỗ &mdash; ai cũng đi cùng
          hướng, không ai khác biệt. <strong>Random lớn:</strong> Mỗi người nhảy một
          phương ngẫu nhiên rất xa &mdash; hỗn loạn!
        </p>
        <p>
          <strong>Xavier/He:</strong> Mỗi người được phân bổ vị trí hợp lý, đủ xa nhau
          để đa dạng nhưng không quá xa để mất kiểm soát. Đây là &quot;vạch xuất phát
          vàng&quot; giúp đội chạy hiệu quả nhất!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-5">
          {/* Method selector */}
          <div className="flex flex-wrap gap-2">
            {(Object.keys(methodConfig) as InitMethod[]).map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  method === m
                    ? "text-white shadow-md"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
                style={method === m ? { backgroundColor: methodConfig[m].color } : {}}
              >
                {methodConfig[m].label}
              </button>
            ))}
          </div>

          {/* Description */}
          <div
            className="rounded-lg p-3 text-center text-sm"
            style={{
              color: methodConfig[method].color,
              backgroundColor: `${methodConfig[method].color}15`,
              border: `1px solid ${methodConfig[method].color}40`,
            }}
          >
            {methodConfig[method].desc}
          </div>

          {/* Histogram */}
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-xl mx-auto">
            <text x={svgW / 2} y={15} textAnchor="middle" fill="#94a3b8" fontSize="10">
              Phân phối trọng số ban đầu (fan_in = 128)
            </text>

            {/* X axis */}
            <line x1={pad} y1={svgH - pad} x2={svgW - pad} y2={svgH - pad} stroke="#334155" strokeWidth="1" />
            <text x={pad} y={svgH - pad + 14} fill="#64748b" fontSize="8" textAnchor="middle">
              {(-maxAbs).toFixed(1)}
            </text>
            <text x={svgW / 2} y={svgH - pad + 14} fill="#64748b" fontSize="8" textAnchor="middle">
              0
            </text>
            <text x={svgW - pad} y={svgH - pad + 14} fill="#64748b" fontSize="8" textAnchor="middle">
              {maxAbs.toFixed(1)}
            </text>

            {/* Histogram bars */}
            {histogram.map((c, i) => {
              const x = pad + i * (barW + 1);
              const h = (c / maxCount) * barMaxH;
              const y = svgH - pad - h;
              return (
                <rect
                  key={`hist-${i}`}
                  x={x}
                  y={y}
                  width={barW}
                  height={Math.max(0, h)}
                  rx={2}
                  fill={methodConfig[method].color}
                  opacity={0.75}
                />
              );
            })}

            {/* Zero line */}
            <line
              x1={svgW / 2}
              y1={svgH - pad}
              x2={svgW / 2}
              y2={pad + 20}
              stroke="#475569"
              strokeWidth="1"
              strokeDasharray="3,3"
              opacity={0.5}
            />
          </svg>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="rounded-lg bg-background/50 border border-border p-2">
              <p className="text-muted">Trung bình</p>
              <p className="text-lg font-bold text-foreground">{meanW.toFixed(4)}</p>
            </div>
            <div className="rounded-lg bg-background/50 border border-border p-2">
              <p className="text-muted">Phương sai</p>
              <p className="text-lg font-bold text-foreground">{varW.toFixed(4)}</p>
            </div>
            <div className="rounded-lg bg-background/50 border border-border p-2">
              <p className="text-muted">Max |w|</p>
              <p className="text-lg font-bold text-foreground">
                {Math.max(...weights.map(Math.abs)).toFixed(4)}
              </p>
            </div>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Khởi tạo trọng số</strong> là bước đầu tiên trước khi bắt đầu huấn
          luyện. Giá trị ban đầu của trọng số ảnh hưởng trực tiếp đến việc mạng có hội
          tụ được hay không.
        </p>
        <p>Các phương pháp phổ biến:</p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>
            <strong>Zero initialization:</strong> Tất cả trọng số = 0. Mạng không học
            được vì mọi nơ-ron cùng lớp sẽ luôn giống hệt nhau (symmetry problem).
          </li>
          <li>
            <strong>Random lớn:</strong> Phương sai quá lớn gây bùng nổ gradient và
            bão hòa hàm kích hoạt.
          </li>
          <li>
            <strong>Xavier/Glorot (2010):</strong> Var(w) = 1/fan_in. Giữ phương sai
            đầu ra ổn định qua các lớp. Phù hợp với Sigmoid và Tanh.
          </li>
          <li>
            <strong>He/Kaiming (2015):</strong> Var(w) = 2/fan_in. Thiết kế riêng cho
            ReLU, bù đắp việc ReLU &quot;tắt&quot; một nửa đầu vào.
          </li>
        </ul>
        <p>
          Nguyên tắc chung: chọn phương pháp khởi tạo <strong>phù hợp với hàm kích
          hoạt</strong>. Dùng ReLU thì chọn He. Dùng Sigmoid/Tanh thì chọn Xavier.
          Với Batch Normalization, việc khởi tạo ít quan trọng hơn.
        </p>
      </ExplanationSection>
    </>
  );
}
