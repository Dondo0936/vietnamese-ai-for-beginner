"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "multi-head-attention",
  title: "Multi-Head Attention",
  titleVi: "Chú ý đa đầu",
  description: "Chạy nhiều cơ chế attention song song, mỗi đầu học một kiểu quan hệ khác nhau",
  category: "dl-architectures",
  tags: ["attention", "transformer", "architecture"],
  difficulty: "advanced",
  relatedSlugs: ["self-attention", "transformer", "positional-encoding"],
  vizType: "interactive",
};

const tokens = ["Tôi", "yêu", "Việt", "Nam"];

const heads = [
  { name: "Đầu 1", desc: "Cú pháp (chủ-vị)", color: "#3b82f6",
    weights: [[0.1, 0.6, 0.2, 0.1], [0.5, 0.1, 0.2, 0.2], [0.1, 0.2, 0.3, 0.4], [0.1, 0.3, 0.4, 0.2]] },
  { name: "Đầu 2", desc: "Ngữ nghĩa (liên quan)", color: "#22c55e",
    weights: [[0.3, 0.2, 0.2, 0.3], [0.1, 0.1, 0.4, 0.4], [0.2, 0.3, 0.2, 0.3], [0.2, 0.3, 0.3, 0.2]] },
  { name: "Đầu 3", desc: "Vị trí (gần/xa)", color: "#f97316",
    weights: [[0.5, 0.3, 0.15, 0.05], [0.3, 0.4, 0.2, 0.1], [0.1, 0.2, 0.4, 0.3], [0.05, 0.1, 0.35, 0.5]] },
  { name: "Đầu 4", desc: "Tổ hợp từ (compound)", color: "#8b5cf6",
    weights: [[0.25, 0.25, 0.25, 0.25], [0.15, 0.15, 0.35, 0.35], [0.1, 0.1, 0.2, 0.6], [0.1, 0.1, 0.6, 0.2]] },
];

export default function MultiHeadAttentionTopic() {
  const [activeHead, setActiveHead] = useState(0);
  const [selectedToken, setSelectedToken] = useState(0);

  const head = heads[activeHead];
  const weights = head.weights[selectedToken];

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đọc một bài báo với <strong>nhiều &quot;cặp kính&quot;</strong>
          khác nhau. Kính thứ nhất cho bạn thấy <strong>cấu trúc ngữ pháp</strong> (chủ ngữ
          &rarr; động từ). Kính thứ hai cho bạn thấy <strong>quan hệ ngữ nghĩa</strong>
          (&quot;yêu&quot; liên quan &quot;Việt Nam&quot;). Kính thứ ba cho bạn thấy
          <strong> vị trí tương đối</strong>.
        </p>
        <p>
          <strong>Multi-Head Attention</strong> chạy nhiều &quot;đầu&quot; attention song
          song, mỗi đầu học một kiểu quan hệ khác nhau, rồi kết hợp tất cả.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <p className="mb-3 text-sm text-muted">
          Chọn đầu attention và từ truy vấn. Mỗi đầu học &quot;nhìn&quot; câu theo cách khác.
        </p>
        <svg
          viewBox="0 0 500 280"
          className="w-full rounded-lg border border-border bg-background"
        >
          {/* Head selector */}
          {heads.map((h, i) => {
            const x = 20 + i * 120;
            const isActive = i === activeHead;
            return (
              <g key={i} className="cursor-pointer" onClick={() => setActiveHead(i)}>
                <rect x={x} y={5} width={110} height={40} rx={8}
                  fill={h.color} opacity={isActive ? 0.25 : 0.08}
                  stroke={h.color} strokeWidth={isActive ? 2.5 : 1} />
                <text x={x + 55} y={22} fontSize={11} fill={h.color} textAnchor="middle" fontWeight={700}>
                  {h.name}
                </text>
                <text x={x + 55} y={38} fontSize={9} fill={h.color} textAnchor="middle">
                  {h.desc}
                </text>
              </g>
            );
          })}

          {/* Heatmap grid */}
          <text x={250} y={68} fontSize={11} fill={head.color} textAnchor="middle" fontWeight={600}>
            Attention Weights &mdash; {head.name}: {head.desc}
          </text>

          {/* Column labels */}
          {tokens.map((t, i) => (
            <text key={`col-${i}`} x={170 + i * 65} y={88} fontSize={11} fill="currentColor"
              className="text-foreground" textAnchor="middle" fontWeight={400}>
              {t}
            </text>
          ))}

          {/* Rows */}
          {tokens.map((t, r) => (
            <g key={`row-${r}`}>
              {/* Row label */}
              <text
                x={135} y={115 + r * 38}
                fontSize={11} fill={r === selectedToken ? head.color : "currentColor"}
                className={r === selectedToken ? "" : "text-foreground"}
                textAnchor="end"
                fontWeight={r === selectedToken ? 700 : 400}
                cursor="pointer"
                onClick={() => setSelectedToken(r)}
              >
                {t}
              </text>

              {/* Cells */}
              {head.weights[r].map((w, c) => {
                const x = 145 + c * 65;
                const y = 98 + r * 38;
                const isSelected = r === selectedToken;
                return (
                  <g key={`cell-${r}-${c}`}>
                    <rect x={x} y={y} width={55} height={28} rx={5}
                      fill={head.color} opacity={w * 0.6 + 0.05}
                      stroke={isSelected ? head.color : "transparent"} strokeWidth={isSelected ? 1.5 : 0} />
                    <text x={x + 27} y={y + 18} fontSize={11} fill="#fff" textAnchor="middle" fontWeight={600}>
                      {(w * 100).toFixed(0)}%
                    </text>
                  </g>
                );
              })}
            </g>
          ))}

          {/* Concat label */}
          <rect x={130} y={250} width={240} height={24} rx={6} fill="#ec4899" opacity={0.1}
            stroke="#ec4899" strokeWidth={1} />
          <text x={250} y={266} fontSize={10} fill="#ec4899" textAnchor="middle" fontWeight={600}>
            Concat(head₁, ..., headₙ) &middot; W&deg; &rarr; Output
          </text>
        </svg>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Multi-Head Attention</strong> chạy h phép self-attention song song, mỗi
          phép có bộ trọng số W<sub>Q</sub>, W<sub>K</sub>, W<sub>V</sub> riêng. Kết quả
          của h đầu được <strong>nối (concatenate)</strong> rồi nhân với W<sup>O</sup>.
        </p>
        <p>
          Mỗi &quot;đầu&quot; có thể học <strong>kiểu quan hệ khác nhau</strong>: cú pháp,
          ngữ nghĩa, vị trí, đồng tham chiếu... Trong GPT-3, có <strong>96 đầu</strong>
          chạy song song tại mỗi lớp.
        </p>
        <p>
          Tại sao chia thành nhiều đầu thay vì một đầu lớn? Vì mỗi đầu hoạt động trong
          <strong> không gian con (subspace)</strong> chiều thấp hơn, giúp mô hình học được
          nhiều kiểu quan hệ đa dạng hơn mà tổng chi phí tính toán không tăng.
        </p>
      </ExplanationSection>
    </>
  );
}
