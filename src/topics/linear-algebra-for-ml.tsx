"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "linear-algebra-for-ml",
  title: "Linear Algebra for ML",
  titleVi: "Đại số tuyến tính cho ML",
  description:
    "Vector, ma trận, phép nhân ma trận và trị riêng — nền tảng toán học cho mọi mô hình AI",
  category: "math-foundations",
  tags: ["vectors", "matrices", "eigenvalues"],
  difficulty: "beginner",
  relatedSlugs: ["pca", "word-embeddings", "neural-network-overview"],
  vizType: "interactive",
};

function toSvgX(val: number, min: number, max: number, w: number, pad: number) {
  return pad + ((val - min) / (max - min)) * (w - 2 * pad);
}

function toSvgY(val: number, min: number, max: number, h: number, pad: number) {
  return h - pad - ((val - min) / (max - min)) * (h - 2 * pad);
}

export default function LinearAlgebraForMlTopic() {
  const [vx, setVx] = useState(3);
  const [vy, setVy] = useState(2);
  const [matA, setMatA] = useState(1.5);
  const [matD, setMatD] = useState(0.8);

  const svgW = 500;
  const svgH = 400;
  const pad = 50;
  const gMin = -5;
  const gMax = 5;

  // Original vector
  const ox = toSvgX(0, gMin, gMax, svgW, pad);
  const oy = toSvgY(0, gMin, gMax, svgH, pad);
  const ax = toSvgX(vx, gMin, gMax, svgW, pad);
  const ay = toSvgY(vy, gMin, gMax, svgH, pad);

  // Transformed vector (matrix [[matA, 0], [0, matD]])
  const tvx = matA * vx;
  const tvy = matD * vy;
  const tx = toSvgX(tvx, gMin, gMax, svgW, pad);
  const ty = toSvgY(tvy, gMin, gMax, svgH, pad);

  // Dot product with unit vector (1,0)
  const dotProduct = vx;

  // Grid lines
  const gridLines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = gMin; i <= gMax; i++) {
    gridLines.push({
      x1: toSvgX(i, gMin, gMax, svgW, pad),
      y1: pad,
      x2: toSvgX(i, gMin, gMax, svgW, pad),
      y2: svgH - pad,
    });
    gridLines.push({
      x1: pad,
      y1: toSvgY(i, gMin, gMax, svgH, pad),
      x2: svgW - pad,
      y2: toSvgY(i, gMin, gMax, svgH, pad),
    });
  }

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang quản lý một <strong>nhà kho lớn</strong>. Mỗi
          sản phẩm được đặt trên một <strong>kệ</strong> tại vị trí xác định — đó
          chính là <strong>vector</strong> (tọa độ trong không gian).
        </p>
        <p>
          Khi bạn muốn <strong>sắp xếp lại</strong> toàn bộ nhà kho — xoay các kệ,
          kéo giãn khoảng cách, hoặc thu nhỏ lại — thao tác đó chính là
          <strong> phép nhân ma trận</strong>. Ma trận là &quot;bản hướng dẫn&quot;
          cho phép biến đổi tất cả các kệ cùng lúc.
        </p>
        <p>
          Khi bạn kết hợp nhiều lần sắp xếp (xoay rồi kéo giãn), đó là{" "}
          <strong>nhân ma trận liên tiếp</strong>. Và <strong>eigenvalue/eigenvector</strong>{" "}
          là những hướng kệ đặc biệt mà khi biến đổi, chúng chỉ bị kéo dài hoặc co lại
          mà không đổi hướng.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Kéo thanh trượt để thay đổi vector và ma trận biến đổi. Quan sát vector
            gốc (xanh) và vector sau biến đổi (cam).
          </p>

          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-2xl mx-auto">
            {/* Grid */}
            {gridLines.map((l, i) => (
              <line
                key={`grid-${i}`}
                x1={l.x1}
                y1={l.y1}
                x2={l.x2}
                y2={l.y2}
                stroke="#334155"
                strokeWidth={0.5}
                opacity={0.3}
              />
            ))}

            {/* Axes */}
            <line x1={pad} y1={oy} x2={svgW - pad} y2={oy} stroke="#64748b" strokeWidth={1} />
            <line x1={ox} y1={pad} x2={ox} y2={svgH - pad} stroke="#64748b" strokeWidth={1} />
            <text x={svgW - pad + 5} y={oy + 4} fill="#64748b" fontSize="10">x</text>
            <text x={ox + 5} y={pad - 5} fill="#64748b" fontSize="10">y</text>

            {/* Original vector */}
            <line x1={ox} y1={oy} x2={ax} y2={ay} stroke="#3b82f6" strokeWidth={2.5} />
            <circle cx={ax} cy={ay} r={5} fill="#3b82f6" stroke="#fff" strokeWidth={1.5} />
            <text x={ax + 8} y={ay - 8} fill="#3b82f6" fontSize="10" fontWeight="bold">
              v = ({vx}, {vy})
            </text>

            {/* Transformed vector */}
            <line x1={ox} y1={oy} x2={tx} y2={ty} stroke="#f97316" strokeWidth={2.5} strokeDasharray="6 3" />
            <circle cx={tx} cy={ty} r={5} fill="#f97316" stroke="#fff" strokeWidth={1.5} />
            <text x={tx + 8} y={ty - 8} fill="#f97316" fontSize="10" fontWeight="bold">
              Av = ({tvx.toFixed(1)}, {tvy.toFixed(1)})
            </text>

            {/* Matrix label */}
            <rect x={10} y={10} width={130} height={55} rx={6} fill="#1e293b" stroke="#475569" strokeWidth={1} />
            <text x={75} y={28} textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="bold">
              Ma trận A:
            </text>
            <text x={75} y={43} textAnchor="middle" fill="#f97316" fontSize="10" fontFamily="monospace">
              [{matA.toFixed(1)}, 0]
            </text>
            <text x={75} y={57} textAnchor="middle" fill="#f97316" fontSize="10" fontFamily="monospace">
              [0, {matD.toFixed(1)}]
            </text>

            {/* Dot product info */}
            <rect x={svgW - 160} y={10} width={150} height={35} rx={6} fill="#1e293b" stroke="#475569" strokeWidth={1} />
            <text x={svgW - 85} y={32} textAnchor="middle" fill="#22c55e" fontSize="10">
              Dot(v, e_x) = {dotProduct}
            </text>

            {/* Legend */}
            <line x1={15} y1={svgH - 25} x2={35} y2={svgH - 25} stroke="#3b82f6" strokeWidth={2.5} />
            <text x={40} y={svgH - 21} fill="#94a3b8" fontSize="9">Vector gốc</text>
            <line x1={130} y1={svgH - 25} x2={150} y2={svgH - 25} stroke="#f97316" strokeWidth={2.5} strokeDasharray="6 3" />
            <text x={155} y={svgH - 21} fill="#94a3b8" fontSize="9">Sau biến đổi</text>
          </svg>

          {/* Controls */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted">
                Vector x: <strong className="text-foreground">{vx}</strong>
              </label>
              <input
                type="range"
                min={-4}
                max={4}
                step={0.5}
                value={vx}
                onChange={(e) => setVx(parseFloat(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted">
                Vector y: <strong className="text-foreground">{vy}</strong>
              </label>
              <input
                type="range"
                min={-4}
                max={4}
                step={0.5}
                value={vy}
                onChange={(e) => setVy(parseFloat(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted">
                Kéo giãn trục x (a11): <strong className="text-foreground">{matA.toFixed(1)}</strong>
              </label>
              <input
                type="range"
                min={-2}
                max={3}
                step={0.1}
                value={matA}
                onChange={(e) => setMatA(parseFloat(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted">
                Kéo giãn trục y (a22): <strong className="text-foreground">{matD.toFixed(1)}</strong>
              </label>
              <input
                type="range"
                min={-2}
                max={3}
                step={0.1}
                value={matD}
                onChange={(e) => setMatD(parseFloat(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-xs text-muted">Độ dài vector gốc</p>
              <p className="text-lg font-bold text-foreground">
                {Math.sqrt(vx * vx + vy * vy).toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-xs text-muted">Độ dài sau biến đổi</p>
              <p className="text-lg font-bold text-foreground">
                {Math.sqrt(tvx * tvx + tvy * tvy).toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-xs text-muted">Eigenvalue</p>
              <p className="text-lg font-bold text-foreground">
                {matA.toFixed(1)}, {matD.toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Đại số tuyến tính</strong> là nền tảng toán học quan trọng nhất
          trong machine learning. Mọi dữ liệu đều được biểu diễn dưới dạng vector
          và ma trận.
        </p>

        <p>Các khái niệm cốt lõi:</p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>
            <strong>Vector:</strong> Một danh sách có thứ tự các số. Trong ML, mỗi
            điểm dữ liệu là một vector. Ví dụ: một bức ảnh 28&times;28 pixel là
            vector 784 chiều.
          </li>
          <li>
            <strong>Ma trận (Matrix):</strong> Bảng số 2 chiều, đại diện cho phép
            biến đổi tuyến tính. Trọng số (weights) của mạng nơ-ron được lưu trong
            các ma trận.
          </li>
          <li>
            <strong>Tích vô hướng (Dot Product):</strong> Phép đo &quot;độ tương
            đồng&quot; giữa hai vector. Khi hai vector cùng hướng, dot product lớn
            nhất. Đây là cốt lõi của cơ chế Attention trong Transformer.
          </li>
          <li>
            <strong>Phép nhân ma trận:</strong> Kết hợp nhiều phép biến đổi tuyến
            tính. Forward pass trong neural network chính là một chuỗi nhân ma trận:
            y = Wx + b.
          </li>
          <li>
            <strong>Eigenvalue &amp; Eigenvector:</strong> Eigenvector là hướng mà khi
            ma trận tác động, nó chỉ bị co giãn (theo eigenvalue) chứ không đổi
            hướng. PCA sử dụng eigen decomposition để tìm các hướng quan trọng nhất
            trong dữ liệu.
          </li>
        </ul>
        <p>
          Trong thực tế, thư viện như <strong>NumPy</strong> và <strong>PyTorch</strong>{" "}
          giúp thực hiện các phép tính đại số tuyến tính trên GPU với tốc độ cực nhanh,
          cho phép huấn luyện mô hình với hàng tỷ tham số.
        </p>
      </ExplanationSection>
    </>
  );
}
