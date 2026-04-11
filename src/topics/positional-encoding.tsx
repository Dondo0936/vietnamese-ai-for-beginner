"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "positional-encoding",
  title: "Positional Encoding",
  titleVi: "Mã hóa vị trí",
  description: "Thêm thông tin vị trí vào embedding vì Transformer không có khái niệm thứ tự",
  category: "dl-architectures",
  tags: ["transformer", "fundamentals", "encoding"],
  difficulty: "intermediate",
  relatedSlugs: ["transformer", "self-attention", "multi-head-attention"],
  vizType: "static",
};

const positions = 8;
const dims = 6;

function pe(pos: number, dim: number, dModel: number) {
  if (dim % 2 === 0) {
    return Math.sin(pos / Math.pow(10000, dim / dModel));
  }
  return Math.cos(pos / Math.pow(10000, (dim - 1) / dModel));
}

export default function PositionalEncodingTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn xáo trộn các từ trong câu: &quot;mèo bắt chuột&quot; thành
          &quot;chuột bắt mèo&quot;. Nghĩa hoàn toàn khác! Nhưng Transformer xử lý tất cả
          từ <strong>song song</strong>, nên nó không biết từ nào đứng trước, từ nào đứng sau.
        </p>
        <p>
          <strong>Positional Encoding</strong> giải quyết bằng cách gắn &quot;mã vạch&quot;
          vị trí cho mỗi từ &mdash; dùng sóng <strong>sin/cos</strong> với tần số khác nhau.
          Như số nhà giúp bưu tá biết thứ tự trên đường phố.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <svg
          viewBox="0 0 500 300"
          className="w-full rounded-lg border border-border bg-background"
        >
          <text x={250} y={20} fontSize={12} fill="currentColor" className="text-foreground" textAnchor="middle" fontWeight={600}>
            Ma trận Positional Encoding (sin/cos)
          </text>

          {/* Column headers (dimensions) */}
          {Array.from({ length: dims }, (_, d) => (
            <text key={`col-${d}`} x={130 + d * 55} y={42} fontSize={10} fill="#8b5cf6" textAnchor="middle">
              d={d}
            </text>
          ))}

          {/* Function labels */}
          {Array.from({ length: dims }, (_, d) => (
            <text key={`fn-${d}`} x={130 + d * 55} y={54} fontSize={8} fill="#8b5cf6" textAnchor="middle">
              {d % 2 === 0 ? "sin" : "cos"}
            </text>
          ))}

          {/* Row headers (positions) + cells */}
          {Array.from({ length: positions }, (_, pos) =>
            <>
              <text key={`row-${pos}`} x={70} y={78 + pos * 28} fontSize={10} fill="#3b82f6" textAnchor="end">
                pos={pos}
              </text>
              {Array.from({ length: dims }, (_, d) => {
                const val = pe(pos, d, dims);
                const normalized = (val + 1) / 2;
                const r = Math.round(59 + normalized * 180);
                const g = Math.round(130 - normalized * 80);
                const b = Math.round(246 - normalized * 200);
                return (
                  <g key={`cell-${pos}-${d}`}>
                    <rect
                      x={105 + d * 55} y={62 + pos * 28}
                      width={50} height={24} rx={4}
                      fill={`rgb(${r},${g},${b})`} opacity={0.3}
                      stroke={`rgb(${r},${g},${b})`} strokeWidth={0.5}
                    />
                    <text x={130 + d * 55} y={78 + pos * 28} fontSize={9}
                      fill="currentColor" className="text-foreground" textAnchor="middle">
                      {val.toFixed(2)}
                    </text>
                  </g>
                );
              })}
            </>
          )}

          {/* Sine wave illustration */}
          <text x={430} y={78} fontSize={10} fill="#f97316" fontWeight={600}>
            Tần số
          </text>
          {[0, 2, 4].map((d, i) => {
            const path = Array.from({ length: 50 }, (_, j) => {
              const x = 420 + (j / 50) * 70;
              const y = 100 + i * 70 + Math.sin(j / (2 + i * 3)) * 20;
              return `${j === 0 ? "M" : "L"}${x},${y}`;
            }).join(" ");
            return (
              <g key={`wave-${d}`}>
                <path d={path} fill="none" stroke="#f97316" strokeWidth={1.5} opacity={0.6} />
                <text x={460} y={130 + i * 70} fontSize={8} fill="#f97316" textAnchor="middle">
                  d={d}
                </text>
              </g>
            );
          })}
        </svg>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Positional Encoding</strong> thêm thông tin vị trí vào word embedding.
          Công thức: <em>PE(pos, 2i) = sin(pos/10000^(2i/d))</em> và
          <em> PE(pos, 2i+1) = cos(pos/10000^(2i/d))</em>.
        </p>
        <p>
          Tại sao sin/cos? Vì (1) mỗi vị trí có mã duy nhất, (2) khoảng cách tương đối
          có thể được biểu diễn bằng phép biến đổi tuyến tính &mdash; PE(pos+k) là hàm
          tuyến tính của PE(pos), và (3) <strong>ngoại suy</strong> được cho chuỗi dài hơn
          khi huấn luyện.
        </p>
        <p>
          Biến thể hiện đại: <strong>RoPE (Rotary Position Embedding)</strong> dùng trong
          LLaMA, <strong>ALiBi</strong> dùng bias vị trí trực tiếp, <strong>Learned PE</strong>
          (BERT) học embedding vị trí thay vì dùng công thức cố định.
        </p>
      </ExplanationSection>
    </>
  );
}
