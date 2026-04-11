"use client";

import { useState, useMemo } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "vector-databases",
  title: "Vector Databases",
  titleVi: "Cơ sở dữ liệu vector",
  description:
    "Hệ thống lưu trữ và truy vấn dữ liệu dưới dạng vector nhúng, cho phép tìm kiếm theo ngữ nghĩa.",
  category: "search-retrieval",
  tags: ["vector", "database", "embedding", "similarity"],
  difficulty: "intermediate",
  relatedSlugs: ["faiss", "semantic-search", "embedding-model"],
  vizType: "interactive",
};

const POINTS = [
  { x: 120, y: 80, label: "Mèo", color: "#3b82f6", group: "animal" },
  { x: 150, y: 100, label: "Chó", color: "#3b82f6", group: "animal" },
  { x: 130, y: 60, label: "Thỏ", color: "#3b82f6", group: "animal" },
  { x: 350, y: 300, label: "Xe hơi", color: "#ef4444", group: "vehicle" },
  { x: 380, y: 280, label: "Xe máy", color: "#ef4444", group: "vehicle" },
  { x: 330, y: 320, label: "Xe buýt", color: "#ef4444", group: "vehicle" },
  { x: 250, y: 180, label: "Ngựa", color: "#f59e0b", group: "both" },
];

export default function VectorDatabasesTopic() {
  const [queryIdx, setQueryIdx] = useState<number | null>(null);

  const distances = useMemo(() => {
    if (queryIdx === null) return [];
    const qp = POINTS[queryIdx];
    return POINTS.map((p, i) => {
      if (i === queryIdx) return { idx: i, dist: 0 };
      const d = Math.sqrt((p.x - qp.x) ** 2 + (p.y - qp.y) ** 2);
      return { idx: i, dist: Math.round(d) };
    })
      .filter((d) => d.idx !== queryIdx)
      .sort((a, b) => a.dist - b.dist);
  }, [queryIdx]);

  const topK = distances.slice(0, 3);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn có một <strong>thư viện khổng lồ</strong>, nhưng sách
          không xếp theo bảng chữ cái mà theo <strong>nội dung tương tự</strong>. Sách
          về mèo nằm gần sách về chó, sách về xe hơi nằm gần sách về xe máy.
        </p>
        <p>
          Khi bạn hỏi &quot;tìm sách về thú cưng&quot;, thủ thư không cần đọc từng cuốn.
          Thay vào đó, thủ thư đi đến <strong>khu vực thú cưng</strong> và lấy những cuốn
          gần nhất. Đó chính là cách <strong>cơ sở dữ liệu vector</strong> hoạt động!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Nhấp vào một điểm để chọn làm truy vấn. Hệ thống sẽ tìm 3 điểm gần nhất.
          </p>

          <svg viewBox="0 0 500 400" className="w-full max-w-2xl mx-auto bg-background/30 rounded-lg">
            {/* Grid */}
            {[0, 100, 200, 300, 400].map((v) => (
              <g key={v}>
                <line x1={v} y1="0" x2={v} y2="400" stroke="#334155" strokeWidth="0.5" />
                <line x1="0" y1={v} x2="500" y2={v} stroke="#334155" strokeWidth="0.5" />
              </g>
            ))}

            {/* Connections to nearest */}
            {queryIdx !== null &&
              topK.map((d) => (
                <line
                  key={d.idx}
                  x1={POINTS[queryIdx].x}
                  y1={POINTS[queryIdx].y}
                  x2={POINTS[d.idx].x}
                  y2={POINTS[d.idx].y}
                  stroke="#22c55e"
                  strokeWidth="1.5"
                  strokeDasharray="4,3"
                  opacity={0.7}
                />
              ))}

            {/* Points */}
            {POINTS.map((p, i) => {
              const isQuery = queryIdx === i;
              const isNearest = topK.some((d) => d.idx === i);
              return (
                <g key={i} onClick={() => setQueryIdx(i)} className="cursor-pointer">
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isQuery ? 16 : isNearest ? 13 : 10}
                    fill={isQuery ? "#22c55e" : p.color}
                    stroke={isNearest ? "#22c55e" : "none"}
                    strokeWidth={isNearest ? 2.5 : 0}
                    opacity={queryIdx !== null && !isQuery && !isNearest ? 0.35 : 1}
                  />
                  <text
                    x={p.x}
                    y={p.y - 16}
                    textAnchor="middle"
                    fill={isQuery ? "#22c55e" : "#94a3b8"}
                    fontSize="10"
                    fontWeight={isQuery ? "bold" : "normal"}
                  >
                    {p.label}
                  </text>
                </g>
              );
            })}

            {/* Legend */}
            <circle cx="420" cy="20" r="6" fill="#3b82f6" />
            <text x="432" y="24" fill="#94a3b8" fontSize="9">Động vật</text>
            <circle cx="420" cy="40" r="6" fill="#ef4444" />
            <text x="432" y="44" fill="#94a3b8" fontSize="9">Phương tiện</text>
            <circle cx="420" cy="60" r="6" fill="#f59e0b" />
            <text x="432" y="64" fill="#94a3b8" fontSize="9">Hỗn hợp</text>
          </svg>

          {queryIdx !== null && (
            <div className="rounded-lg bg-background/50 border border-border p-4">
              <p className="text-sm font-medium text-green-500 mb-2">
                Truy vấn: &quot;{POINTS[queryIdx].label}&quot; &mdash; Top 3 kết quả gần nhất:
              </p>
              {topK.map((d, i) => (
                <p key={i} className="text-sm text-muted">
                  {i + 1}. {POINTS[d.idx].label} (khoảng cách: {d.dist})
                </p>
              ))}
            </div>
          )}
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Cơ sở dữ liệu vector</strong> (Vector Database) là hệ thống lưu trữ
          chuyên biệt, được thiết kế để lưu và truy vấn dữ liệu dưới dạng
          vector nhúng (embedding) nhiều chiều.
        </p>
        <p>Đặc điểm chính của cơ sở dữ liệu vector:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Lưu trữ vector nhúng:</strong> Mỗi đối tượng (văn bản, hình ảnh, âm
            thanh) được chuyển thành vector số học nhiều chiều.
          </li>
          <li>
            <strong>Tìm kiếm tương tự:</strong> Sử dụng các phép đo khoảng cách như
            cosine similarity hoặc Euclidean để tìm các vector gần nhất.
          </li>
          <li>
            <strong>Lập chỉ mục hiệu quả:</strong> Các thuật toán như HNSW, IVF giúp
            tìm kiếm nhanh ngay cả trên hàng tỷ vector.
          </li>
        </ol>
        <p>
          Các hệ thống phổ biến bao gồm <strong>Pinecone</strong>,{" "}
          <strong>Weaviate</strong>, <strong>Milvus</strong>, <strong>Chroma</strong> và{" "}
          <strong>Qdrant</strong>. Vector database là thành phần cốt lõi trong kiến trúc RAG.
        </p>
      </ExplanationSection>
    </>
  );
}
