"use client";

import { useState, useMemo } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "loss-functions",
  title: "Loss Functions",
  titleVi: "Hàm mất mát",
  description:
    "Thước đo sai lệch giữa dự đoán và thực tế, hướng dẫn mạng nơ-ron học từ lỗi.",
  category: "neural-fundamentals",
  tags: ["training", "optimization", "fundamentals"],
  difficulty: "beginner",
  relatedSlugs: ["gradient-descent", "backpropagation", "forward-propagation"],
  vizType: "interactive",
};

type LossType = "mse" | "mae" | "bce";

function mse(pred: number, target: number) {
  return (pred - target) * (pred - target);
}

function mae(pred: number, target: number) {
  return Math.abs(pred - target);
}

function bce(pred: number, target: number) {
  const p = Math.max(0.001, Math.min(0.999, pred));
  return -(target * Math.log(p) + (1 - target) * Math.log(1 - p));
}

export default function LossFunctionsTopic() {
  const [prediction, setPrediction] = useState(0.7);
  const [target] = useState(1.0);
  const [lossType, setLossType] = useState<LossType>("mse");

  const lossFns: Record<LossType, { fn: (p: number, t: number) => number; label: string; formula: string; color: string }> = {
    mse: {
      fn: mse,
      label: "MSE (Mean Squared Error)",
      formula: "L = (y - y\u0302)\u00B2",
      color: "#3b82f6",
    },
    mae: {
      fn: mae,
      label: "MAE (Mean Absolute Error)",
      formula: "L = |y - y\u0302|",
      color: "#22c55e",
    },
    bce: {
      fn: bce,
      label: "BCE (Binary Cross-Entropy)",
      formula: "L = -[y*log(y\u0302) + (1-y)*log(1-y\u0302)]",
      color: "#f59e0b",
    },
  };

  const currentLoss = lossFns[lossType].fn(prediction, target);

  // Graph: loss vs prediction for current target
  const svgW = 450;
  const svgH = 220;
  const pad = 35;

  const curvePoints = useMemo(() => {
    const points: string[] = [];
    for (let i = 0; i <= 200; i++) {
      const p = i / 200; // 0 to 1
      let l: number;
      if (lossType === "bce") {
        const pp = Math.max(0.01, Math.min(0.99, p));
        l = bce(pp, target);
      } else if (lossType === "mse") {
        l = mse(p, target);
      } else {
        l = mae(p, target);
      }
      const maxLoss = lossType === "bce" ? 5 : 1.2;
      const x = pad + (i / 200) * (svgW - 2 * pad);
      const y = svgH - pad - (l / maxLoss) * (svgH - 2 * pad);
      points.push(`${x},${Math.max(pad, y)}`);
    }
    return points.join(" ");
  }, [lossType, target]);

  const maxLoss = lossType === "bce" ? 5 : 1.2;
  const markerX = pad + prediction * (svgW - 2 * pad);
  const markerY = Math.max(
    pad,
    svgH - pad - (currentLoss / maxLoss) * (svgH - 2 * pad)
  );

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang <strong>luyện bắn cung</strong>. Mỗi lần bắn,
          huấn luyện viên đo <strong>khoảng cách từ mũi tên đến tâm bia</strong> và
          nói cho bạn biết bạn &quot;sai&quot; bao nhiêu. Đó chính là{" "}
          <strong>loss (mất mát)</strong>.
        </p>
        <p>
          Nếu huấn luyện viên tính <em>bình phương khoảng cách</em> (MSE), những lần
          bắn xa tâm sẽ bị &quot;phạt&quot; nặng hơn rất nhiều. Nếu chỉ tính{" "}
          <em>khoảng cách tuyệt đối</em> (MAE), mọi lần sai đều bị phạt như nhau.
        </p>
        <p>
          Mục tiêu huấn luyện: làm sao để <strong>loss giảm về 0</strong> &mdash; tức
          là mũi tên trúng tâm bia (dự đoán khớp với thực tế)!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-5">
          {/* Loss type selector */}
          <div className="flex flex-wrap gap-2">
            {(Object.keys(lossFns) as LossType[]).map((type) => (
              <button
                key={type}
                onClick={() => setLossType(type)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  lossType === type
                    ? "text-white shadow-md"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
                style={lossType === type ? { backgroundColor: lossFns[type].color } : {}}
              >
                {lossFns[type].label}
              </button>
            ))}
          </div>

          {/* Prediction slider */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted">
              Giá trị dự đoán (y&#x0302;):{" "}
              <strong className="text-foreground">{prediction.toFixed(2)}</strong>
              <span className="ml-3">
                Giá trị thực (y): <strong className="text-foreground">{target.toFixed(1)}</strong>
              </span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={prediction}
              onChange={(e) => setPrediction(parseFloat(e.target.value))}
              className="w-full accent-accent"
            />
          </div>

          {/* Loss display */}
          <div className="flex items-center justify-between rounded-lg bg-background/50 border border-border p-4">
            <div>
              <p className="text-xs text-muted">{lossFns[lossType].formula}</p>
              <p className="text-2xl font-bold text-foreground">{currentLoss.toFixed(4)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted">Sai lệch</p>
              <p className="text-lg font-semibold" style={{ color: lossFns[lossType].color }}>
                {Math.abs(prediction - target).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Graph */}
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-xl mx-auto">
            {/* Axes */}
            <line x1={pad} y1={svgH - pad} x2={svgW - pad} y2={svgH - pad} stroke="#334155" strokeWidth="1" />
            <line x1={pad} y1={pad} x2={pad} y2={svgH - pad} stroke="#334155" strokeWidth="1" />

            <text x={svgW / 2} y={svgH - 5} textAnchor="middle" fill="#64748b" fontSize="10">
              Dự đoán (y&#x0302;)
            </text>
            <text x={10} y={svgH / 2} fill="#64748b" fontSize="10" transform={`rotate(-90, 10, ${svgH / 2})`}>
              Loss
            </text>

            {/* Tick labels */}
            <text x={pad} y={svgH - pad + 14} textAnchor="middle" fill="#64748b" fontSize="9">0</text>
            <text x={svgW - pad} y={svgH - pad + 14} textAnchor="middle" fill="#64748b" fontSize="9">1</text>

            {/* Target line */}
            <line
              x1={pad + target * (svgW - 2 * pad)}
              y1={pad}
              x2={pad + target * (svgW - 2 * pad)}
              y2={svgH - pad}
              stroke="#22c55e"
              strokeWidth="1"
              strokeDasharray="4,3"
              opacity={0.5}
            />
            <text
              x={pad + target * (svgW - 2 * pad)}
              y={pad - 5}
              textAnchor="middle"
              fill="#22c55e"
              fontSize="9"
            >
              y={target}
            </text>

            {/* Curve */}
            <polyline
              points={curvePoints}
              fill="none"
              stroke={lossFns[lossType].color}
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Current position marker */}
            <circle cx={markerX} cy={markerY} r="6" fill={lossFns[lossType].color} />
            <line x1={markerX} y1={markerY} x2={markerX} y2={svgH - pad} stroke={lossFns[lossType].color} strokeWidth="1" strokeDasharray="3,3" opacity={0.4} />
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Hàm mất mát (Loss Function)</strong> đo lường mức độ sai lệch giữa
          dự đoán của mô hình và giá trị thực tế. Nó là &quot;la bàn&quot; hướng dẫn
          quá trình huấn luyện &mdash; mục tiêu là giảm loss về mức thấp nhất.
        </p>
        <p>Các hàm mất mát phổ biến:</p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>
            <strong>MSE (Mean Squared Error):</strong> Dùng cho bài toán hồi quy.
            Phạt nặng các dự đoán sai lệch lớn (do bình phương). Nhạy với outlier.
          </li>
          <li>
            <strong>MAE (Mean Absolute Error):</strong> Cũng dùng cho hồi quy nhưng
            robust hơn với outlier. Mọi sai lệch bị phạt tỷ lệ thuận.
          </li>
          <li>
            <strong>Cross-Entropy:</strong> Dùng cho phân loại. Binary CE cho hai
            lớp, Categorical CE cho nhiều lớp. Phạt rất nặng khi mô hình &quot;tự
            tin sai&quot; (dự đoán xa giá trị thực).
          </li>
        </ul>
        <p>
          Việc chọn hàm mất mát phụ thuộc vào <strong>bài toán</strong> (hồi quy hay
          phân loại), <strong>phân phối dữ liệu</strong> (có outlier không), và{" "}
          <strong>mục tiêu cụ thể</strong> (ưu tiên chính xác trung bình hay giảm sai
          lệch cực đại).
        </p>
      </ExplanationSection>
    </>
  );
}
