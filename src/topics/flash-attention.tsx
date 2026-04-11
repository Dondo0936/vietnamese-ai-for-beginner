"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "flash-attention",
  title: "Flash Attention",
  titleVi: "Flash Attention",
  description:
    "Thuật toán tối ưu tính attention nhanh hơn và tiết kiệm bộ nhớ GPU bằng kỹ thuật tiling",
  category: "dl-architectures",
  tags: ["attention", "memory-efficient", "tiling"],
  difficulty: "advanced",
  relatedSlugs: ["self-attention", "multi-head-attention", "gpu-optimization"],
  vizType: "interactive",
};

export default function FlashAttentionTopic() {
  const [mode, setMode] = useState<"standard" | "flash">("standard");

  const tileSize = 40;
  const matrixSize = 4;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn cần so sánh <strong>1000 bức ảnh</strong> với nhau để tìm ảnh giống nhau.
          Cách thông thường: trải tất cả 1000 ảnh ra một bàn khổng lồ rồi so sánh — cần một căn phòng rất lớn
          (<strong>bộ nhớ GPU lớn</strong>).
        </p>
        <p>
          Flash Attention thông minh hơn: lấy ra <strong>từng nhóm nhỏ</strong> ảnh,
          so sánh trong nhóm, ghi lại kết quả, rồi đặt lại và lấy nhóm tiếp theo.
          Bàn nhỏ hơn nhiều (<strong>ít bộ nhớ</strong>), nhưng vẫn cho kết quả chính xác!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setMode("standard")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                mode === "standard" ? "bg-red-500 text-white" : "bg-card border border-border text-muted hover:text-foreground"
              }`}
            >
              Standard Attention
            </button>
            <button
              onClick={() => setMode("flash")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                mode === "flash" ? "bg-accent text-white" : "bg-card border border-border text-muted hover:text-foreground"
              }`}
            >
              Flash Attention
            </button>
          </div>

          <svg viewBox="0 0 600 350" className="w-full max-w-2xl mx-auto">
            <text x={300} y={20} textAnchor="middle" fontSize={14} fill="#0f172a" fontWeight="bold">
              {mode === "standard" ? "Standard: Tải toàn bộ ma trận vào bộ nhớ" : "Flash: Xử lý từng block nhỏ (tiling)"}
            </text>

            {/* Memory indicator */}
            <rect x={480} y={40} width={100} height={260} fill="#f1f5f9" rx={6} stroke="#e2e8f0" />
            <text x={530} y={58} textAnchor="middle" fontSize={10} fill="#64748b">GPU Memory</text>
            <rect
              x={490} y={70}
              width={80}
              height={mode === "standard" ? 220 : 80}
              fill={mode === "standard" ? "#ef4444" : "#22c55e"}
              rx={4}
              opacity={0.7}
            />
            <text x={530} y={mode === "standard" ? 190 : 118} textAnchor="middle" fontSize={11} fill="white" fontWeight="bold">
              {mode === "standard" ? "O(N²)" : "O(N)"}
            </text>

            {/* Attention matrix */}
            <text x={20} y={50} fontSize={11} fill="#64748b">Ma trận Attention (Q × K^T)</text>
            {Array.from({ length: matrixSize }).map((_, row) =>
              Array.from({ length: matrixSize }).map((_, col) => {
                const x = 30 + col * (tileSize + 2);
                const y = 60 + row * (tileSize + 2);
                const isFlashActive = mode === "flash";
                const tileRow = Math.floor(row / 2);
                const tileCol = Math.floor(col / 2);
                const isCurrentTile = tileRow === 0 && tileCol === 0;

                return (
                  <rect
                    key={`${row}-${col}`}
                    x={x} y={y}
                    width={tileSize} height={tileSize}
                    fill={
                      mode === "standard"
                        ? "#ef4444"
                        : isCurrentTile
                        ? "#14b8a6"
                        : "#e2e8f0"
                    }
                    opacity={
                      mode === "standard"
                        ? 0.6
                        : isFlashActive && isCurrentTile
                        ? 0.8
                        : 0.3
                    }
                    rx={3}
                    stroke={isFlashActive && isCurrentTile ? "#0d9488" : "#cbd5e1"}
                    strokeWidth={isFlashActive && isCurrentTile ? 2 : 0.5}
                  />
                );
              })
            )}

            {/* Labels */}
            <text x={110} y={250} textAnchor="middle" fontSize={12} fill="#0f172a" fontWeight="bold">
              {mode === "standard" ? "Tất cả ở trong HBM" : "Chỉ 1 block ở SRAM"}
            </text>

            {/* Speed comparison */}
            <g transform="translate(250, 70)">
              <text x={0} y={0} fontSize={11} fill="#64748b">Tốc độ so sánh</text>
              <rect x={0} y={10} width={mode === "standard" ? 120 : 200} height={24} fill={mode === "standard" ? "#ef4444" : "#22c55e"} rx={4} opacity={0.7} />
              <text x={mode === "standard" ? 60 : 100} y={27} textAnchor="middle" fontSize={11} fill="white" fontWeight="bold">
                {mode === "standard" ? "1×" : "2-4× nhanh hơn"}
              </text>
            </g>

            {/* IO diagram */}
            <g transform="translate(250, 130)">
              <text x={0} y={0} fontSize={11} fill="#64748b">Truy cập bộ nhớ (IO)</text>
              <rect x={0} y={15} width={200} height={50} fill="#f8fafc" rx={6} stroke="#e2e8f0" />
              {mode === "standard" ? (
                <>
                  <text x={100} y={35} textAnchor="middle" fontSize={10} fill="#ef4444">HBM → SRAM → HBM (nhiều lần)</text>
                  <text x={100} y={52} textAnchor="middle" fontSize={10} fill="#ef4444">Tắc nghẽn IO!</text>
                </>
              ) : (
                <>
                  <text x={100} y={35} textAnchor="middle" fontSize={10} fill="#22c55e">Tính toán tại chỗ trong SRAM</text>
                  <text x={100} y={52} textAnchor="middle" fontSize={10} fill="#22c55e">Giảm IO đáng kể</text>
                </>
              )}
            </g>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Flash Attention</strong> là một thuật toán tối ưu cách tính self-attention,
          giúp giảm sử dụng bộ nhớ GPU từ O(N²) xuống O(N) và tăng tốc 2-4 lần so với
          implementation tiêu chuẩn.
        </p>
        <p>Vấn đề của Standard Attention:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>Phải lưu toàn bộ ma trận attention N×N vào bộ nhớ GPU (HBM)</li>
          <li>Với chuỗi dài (N=128K), ma trận này <strong>rất lớn</strong></li>
          <li>Phần lớn thời gian bị tốn vào việc đọc/ghi bộ nhớ (memory-bound), không phải tính toán</li>
        </ul>
        <p>Flash Attention giải quyết bằng <strong>tiling</strong>:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Chia nhỏ:</strong> Chia ma trận Q, K, V thành các block nhỏ vừa khít bộ nhớ SRAM (nhanh hơn HBM 10-100×).</li>
          <li><strong>Tính tại chỗ:</strong> Tính attention cho từng block trong SRAM, không cần lưu ma trận N×N đầy đủ.</li>
          <li><strong>Online softmax:</strong> Sử dụng thuật toán online softmax để tích luỹ kết quả chính xác mà không cần toàn bộ hàng.</li>
          <li><strong>Fused kernel:</strong> Gộp nhiều bước (matmul, softmax, dropout) vào một CUDA kernel duy nhất.</li>
        </ol>
        <p>
          Flash Attention 2 và 3 tiếp tục cải tiến với song song hoá tốt hơn và hỗ trợ
          các loại attention mới (sliding window, block-sparse). Đây là thành phần không thể thiếu
          trong mọi LLM hiện đại.
        </p>
      </ExplanationSection>
    </>
  );
}
