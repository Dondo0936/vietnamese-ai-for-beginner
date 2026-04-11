"use client";

import { useState, useMemo } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "faiss",
  title: "FAISS",
  titleVi: "FAISS - Tìm kiếm tương tự siêu nhanh",
  description:
    "Thư viện mã nguồn mở của Meta dùng để tìm kiếm vector tương tự hiệu quả trên quy mô lớn.",
  category: "search-retrieval",
  tags: ["faiss", "vector-search", "indexing", "meta"],
  difficulty: "intermediate",
  relatedSlugs: ["vector-databases", "semantic-search", "rag"],
  vizType: "interactive",
};

const VECTORS = [
  { id: 0, coords: [0.2, 0.8], label: "Tài liệu A", cluster: 0 },
  { id: 1, coords: [0.3, 0.7], label: "Tài liệu B", cluster: 0 },
  { id: 2, coords: [0.1, 0.9], label: "Tài liệu C", cluster: 0 },
  { id: 3, coords: [0.7, 0.3], label: "Tài liệu D", cluster: 1 },
  { id: 4, coords: [0.8, 0.2], label: "Tài liệu E", cluster: 1 },
  { id: 5, coords: [0.6, 0.4], label: "Tài liệu F", cluster: 1 },
  { id: 6, coords: [0.5, 0.5], label: "Tài liệu G", cluster: 2 },
  { id: 7, coords: [0.4, 0.6], label: "Tài liệu H", cluster: 2 },
];

const CLUSTER_COLORS = ["#3b82f6", "#ef4444", "#f59e0b"];
const CENTROIDS = [
  [0.2, 0.8],
  [0.7, 0.3],
  [0.45, 0.55],
];

export default function FAISSTopic() {
  const [queryX, setQueryX] = useState(0.25);
  const [queryY, setQueryY] = useState(0.75);
  const [indexType, setIndexType] = useState<"flat" | "ivf">("flat");

  const scale = (v: number) => 40 + v * 380;

  const results = useMemo(() => {
    const dists = VECTORS.map((v) => ({
      ...v,
      dist: Math.sqrt((v.coords[0] - queryX) ** 2 + (v.coords[1] - queryY) ** 2),
    }));

    if (indexType === "flat") {
      return dists.sort((a, b) => a.dist - b.dist).slice(0, 3);
    }
    // IVF: find nearest centroid, then search only that cluster
    const centDists = CENTROIDS.map((c, i) => ({
      idx: i,
      dist: Math.sqrt((c[0] - queryX) ** 2 + (c[1] - queryY) ** 2),
    }));
    const nearestCluster = centDists.sort((a, b) => a.dist - b.dist)[0].idx;
    return dists
      .filter((v) => v.cluster === nearestCluster)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 3);
  }, [queryX, queryY, indexType]);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn cần tìm <strong>bạn thân nhất</strong> trong một sân vận
          động có 100.000 người. Cách thô nhất là đi hỏi từng người một (
          <strong>Flat Index</strong>) &mdash; chính xác nhưng mất cả ngày.
        </p>
        <p>
          Cách thông minh hơn: chia sân vận động thành{" "}
          <strong>các khu vực theo sở thích</strong>. Đầu tiên, xác định khu vực nào
          phù hợp nhất với bạn, rồi chỉ tìm trong khu vực đó (
          <strong>IVF Index</strong>). Nhanh hơn gấp nhiều lần!
        </p>
        <p>
          FAISS của Meta chính là công cụ giúp bạn tìm kiếm &quot;người bạn vector&quot;
          gần nhất một cách siêu tốc.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          {/* Index type selector */}
          <div className="flex gap-2">
            {(["flat", "ivf"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setIndexType(t)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  indexType === t
                    ? "bg-accent text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {t === "flat" ? "Flat Index (Duyệt toàn bộ)" : "IVF Index (Theo cụm)"}
              </button>
            ))}
          </div>

          {/* Query controls */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted">Truy vấn X: {queryX.toFixed(2)}</label>
              <input type="range" min="0" max="1" step="0.05" value={queryX}
                onChange={(e) => setQueryX(parseFloat(e.target.value))}
                className="w-full accent-accent" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted">Truy vấn Y: {queryY.toFixed(2)}</label>
              <input type="range" min="0" max="1" step="0.05" value={queryY}
                onChange={(e) => setQueryY(parseFloat(e.target.value))}
                className="w-full accent-accent" />
            </div>
          </div>

          <svg viewBox="0 0 460 460" className="w-full max-w-lg mx-auto">
            {/* Cluster regions for IVF */}
            {indexType === "ivf" &&
              CENTROIDS.map((c, i) => (
                <circle key={i} cx={scale(c[0])} cy={scale(1 - c[1])} r="90"
                  fill={CLUSTER_COLORS[i]} opacity={0.08} />
              ))}

            {/* Vectors */}
            {VECTORS.map((v) => {
              const isResult = results.some((r) => r.id === v.id);
              return (
                <g key={v.id}>
                  <circle
                    cx={scale(v.coords[0])}
                    cy={scale(1 - v.coords[1])}
                    r={isResult ? 12 : 8}
                    fill={CLUSTER_COLORS[v.cluster]}
                    stroke={isResult ? "#22c55e" : "none"}
                    strokeWidth={isResult ? 2.5 : 0}
                  />
                  <text x={scale(v.coords[0])} y={scale(1 - v.coords[1]) - 14}
                    textAnchor="middle" fill="#94a3b8" fontSize="8">{v.label}</text>
                </g>
              );
            })}

            {/* Query point */}
            <circle cx={scale(queryX)} cy={scale(1 - queryY)} r="10" fill="#22c55e" stroke="white" strokeWidth="2" />
            <text x={scale(queryX)} y={scale(1 - queryY) - 16}
              textAnchor="middle" fill="#22c55e" fontSize="10" fontWeight="bold">Truy vấn</text>

            {/* Lines to results */}
            {results.map((r) => (
              <line key={r.id}
                x1={scale(queryX)} y1={scale(1 - queryY)}
                x2={scale(r.coords[0])} y2={scale(1 - r.coords[1])}
                stroke="#22c55e" strokeWidth="1" strokeDasharray="3,3" opacity={0.6} />
            ))}
          </svg>

          <div className="rounded-lg bg-background/50 border border-border p-4">
            <p className="text-sm font-medium text-green-500 mb-2">
              {indexType === "flat" ? "Flat Index" : "IVF Index"} &mdash; Top 3 kết quả:
            </p>
            {results.map((r, i) => (
              <p key={r.id} className="text-sm text-muted">
                {i + 1}. {r.label} (khoảng cách: {r.dist.toFixed(3)})
              </p>
            ))}
            <p className="text-xs text-muted mt-2 italic">
              {indexType === "flat"
                ? "Duyệt toàn bộ vector &mdash; chính xác nhất nhưng chậm."
                : "Chỉ duyệt cụm gần nhất &mdash; nhanh hơn nhưng có thể bỏ sót."}
            </p>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>FAISS</strong> (Facebook AI Similarity Search) là thư viện mã nguồn mở
          do Meta phát triển, chuyên dùng để tìm kiếm vector tương tự trên quy mô lớn
          với tốc độ cực nhanh.
        </p>
        <p>FAISS hỗ trợ nhiều loại chỉ mục (index):</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Flat Index:</strong> So sánh truy vấn với mọi vector trong tập dữ liệu.
            Chính xác 100% nhưng chậm khi dữ liệu lớn.
          </li>
          <li>
            <strong>IVF (Inverted File Index):</strong> Phân chia vector thành các cụm,
            chỉ tìm trong cụm gần nhất. Nhanh hơn nhiều lần với độ chính xác gần tuyệt đối.
          </li>
          <li>
            <strong>HNSW:</strong> Sử dụng đồ thị phân tầng, cho tốc độ truy vấn cực
            nhanh trên tập dữ liệu hàng tỷ vector.
          </li>
        </ol>
        <p>
          FAISS hỗ trợ cả CPU và GPU, có thể xử lý hàng tỷ vector. Đây là nền tảng
          đằng sau nhiều hệ thống tìm kiếm AI quy mô lớn trên thế giới.
        </p>
      </ExplanationSection>
    </>
  );
}
