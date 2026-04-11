"use client";

import { useState, useMemo } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "learning-rate",
  title: "Learning Rate",
  titleVi: "Tốc độ học",
  description:
    "Siêu tham số quan trọng nhất trong huấn luyện mạng nơ-ron, quyết định kích thước bước di chuyển khi tối ưu.",
  category: "neural-fundamentals",
  tags: ["optimization", "hyperparameter", "training"],
  difficulty: "beginner",
  relatedSlugs: ["gradient-descent", "sgd", "optimizers"],
  vizType: "interactive",
};

function loss(x: number) {
  return (x - 3) * (x - 3) + 0.5;
}

function grad(x: number) {
  return 2 * (x - 3);
}

export default function LearningRateTopic() {
  const [lr, setLr] = useState(0.3);

  // Simulate 15 steps from x=0.5
  const trajectory = useMemo(() => {
    const points: { x: number; y: number }[] = [];
    let x = 0.5;
    for (let i = 0; i < 20; i++) {
      points.push({ x, y: loss(x) });
      const g = grad(x);
      x = x - lr * g;
      x = Math.max(-2, Math.min(8, x));
    }
    return points;
  }, [lr]);

  const converged = Math.abs(trajectory[trajectory.length - 1].x - 3) < 0.1;
  const diverged = Math.abs(trajectory[trajectory.length - 1].x) > 6;

  const svgW = 500;
  const svgH = 250;
  const pad = 35;
  const xMin = -2;
  const xMax = 8;
  const yMin = 0;
  const yMax = 26;

  const toX = (v: number) => pad + ((v - xMin) / (xMax - xMin)) * (svgW - 2 * pad);
  const toY = (v: number) => svgH - pad - ((v - yMin) / (yMax - yMin)) * (svgH - 2 * pad);

  const curvePoints: string[] = [];
  for (let i = 0; i <= 200; i++) {
    const x = xMin + (i / 200) * (xMax - xMin);
    curvePoints.push(`${toX(x)},${toY(loss(x))}`);
  }

  let statusText = "";
  let statusColor = "";
  if (lr < 0.1) {
    statusText = "Quá chậm! Mất rất nhiều bước mới hội tụ.";
    statusColor = "#f59e0b";
  } else if (lr <= 0.5) {
    statusText = "Tốt! Hội tụ ổn định về cực tiểu.";
    statusColor = "#22c55e";
  } else if (lr <= 0.8) {
    statusText = "Dao động mạnh quanh cực tiểu, khó hội tụ.";
    statusColor = "#f59e0b";
  } else {
    statusText = "Phân kỳ! Bước quá lớn, nhảy qua cực tiểu liên tục.";
    statusColor = "#ef4444";
  }

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang <strong>chơi trò &quot;nóng - lạnh&quot;</strong> để
          tìm kho báu. Người dẫn đường nói &quot;nóng hơn&quot; hoặc &quot;lạnh hơn&quot;
          sau mỗi bước bạn đi.
        </p>
        <p>
          <strong>Learning rate nhỏ</strong> giống bạn bước tí xíu mỗi lần &mdash; chắc
          chắn tìm thấy nhưng mất cả ngày. <strong>Learning rate vừa phải</strong> thì
          bước dài vừa đủ &mdash; nhanh và chính xác.
        </p>
        <p>
          <strong>Learning rate quá lớn</strong> giống bạn nhảy cóc từ đầu phòng này
          sang đầu phòng kia &mdash; cứ nhảy qua nhảy lại mà không bao giờ dừng đúng
          chỗ kho báu!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-5">
          {/* LR slider */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted">
              Tốc độ học (&alpha;):{" "}
              <strong className="text-foreground">{lr.toFixed(2)}</strong>
            </label>
            <input
              type="range"
              min="0.01"
              max="1.1"
              step="0.01"
              value={lr}
              onChange={(e) => setLr(parseFloat(e.target.value))}
              className="w-full accent-accent"
            />
            <div className="flex justify-between text-xs text-muted">
              <span>0.01 (Rất chậm)</span>
              <span>0.5 (Vừa)</span>
              <span>1.1 (Phân kỳ)</span>
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

          {/* Graph */}
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-2xl mx-auto">
            {/* Axis */}
            <line x1={pad} y1={svgH - pad} x2={svgW - pad} y2={svgH - pad} stroke="#334155" strokeWidth="1" />

            {/* Loss curve */}
            <polyline
              points={curvePoints.join(" ")}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              opacity={0.5}
            />

            {/* Minimum marker */}
            <line
              x1={toX(3)}
              y1={svgH - pad}
              x2={toX(3)}
              y2={toY(loss(3))}
              stroke="#22c55e"
              strokeWidth="1"
              strokeDasharray="3,3"
              opacity={0.4}
            />
            <text x={toX(3)} y={svgH - pad + 13} textAnchor="middle" fill="#22c55e" fontSize="9">
              Cực tiểu
            </text>

            {/* Trajectory path */}
            {trajectory.length > 1 && (
              <polyline
                points={trajectory.map((p) => `${toX(p.x)},${toY(p.y)}`).join(" ")}
                fill="none"
                stroke="#ef4444"
                strokeWidth="1.5"
                opacity={0.6}
                strokeDasharray="4,2"
              />
            )}

            {/* Trajectory dots */}
            {trajectory.slice(0, 15).map((p, i) => (
              <circle
                key={`traj-${i}`}
                cx={toX(p.x)}
                cy={toY(p.y)}
                r={i === 0 ? 5 : 3}
                fill={i === 0 ? "#f59e0b" : "#ef4444"}
                opacity={0.4 + (i / 15) * 0.6}
              />
            ))}

            {/* Step number labels for first few */}
            {trajectory.slice(0, 6).map((p, i) => (
              <text
                key={`step-${i}`}
                x={toX(p.x)}
                y={toY(p.y) - 8}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="8"
              >
                {i}
              </text>
            ))}
          </svg>

          {/* Step table */}
          <div className="overflow-x-auto">
            <div className="flex gap-1 text-xs">
              {trajectory.slice(0, 8).map((p, i) => (
                <div
                  key={`cell-${i}`}
                  className="flex-shrink-0 rounded border border-border p-2 text-center min-w-[60px]"
                >
                  <p className="text-muted">Bước {i}</p>
                  <p className="font-mono text-foreground">{p.x.toFixed(2)}</p>
                  <p className="font-mono text-muted">{p.y.toFixed(2)}</p>
                </div>
              ))}
              <div className="flex items-center px-2 text-muted">...</div>
            </div>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Learning rate (&alpha;)</strong> là siêu tham số quan trọng nhất khi
          huấn luyện mạng nơ-ron. Nó quyết định mỗi bước cập nhật, trọng số thay đổi
          bao nhiêu theo hướng gradient.
        </p>
        <p>Ba trường hợp điển hình:</p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>
            <strong>Quá nhỏ (&alpha; &lt; 0.01):</strong> Mạng học rất chậm, có thể
            bị kẹt ở cực tiểu cục bộ, tốn nhiều thời gian tính toán.
          </li>
          <li>
            <strong>Vừa phải (&alpha; = 0.001 - 0.01):</strong> Hội tụ ổn định, là
            vùng giá trị phổ biến nhất. Giá trị 0.001 được dùng làm mặc định cho
            nhiều optimizer.
          </li>
          <li>
            <strong>Quá lớn (&alpha; &gt; 0.1):</strong> Mạng dao động mạnh, có thể
            phân kỳ (loss tăng dần thay vì giảm).
          </li>
        </ul>
        <p>Các kỹ thuật điều chỉnh learning rate phổ biến:</p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>
            <strong>Learning rate schedule:</strong> Giảm dần &alpha; theo thời gian
            (step decay, cosine annealing).
          </li>
          <li>
            <strong>Warmup:</strong> Bắt đầu với &alpha; nhỏ, tăng dần lên rồi mới
            giảm.
          </li>
          <li>
            <strong>Adaptive optimizers:</strong> Adam, RMSprop tự động điều chỉnh
            &alpha; cho từng trọng số.
          </li>
        </ul>
      </ExplanationSection>
    </>
  );
}
