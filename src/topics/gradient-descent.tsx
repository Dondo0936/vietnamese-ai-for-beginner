"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "gradient-descent",
  title: "Gradient Descent",
  titleVi: "Hạ gradient",
  description:
    "Thuật toán tối ưu cốt lõi trong học máy, tìm cực tiểu của hàm mất mát bằng cách đi theo hướng gradient âm.",
  category: "neural-fundamentals",
  tags: ["optimization", "training", "fundamentals"],
  difficulty: "beginner",
  relatedSlugs: ["learning-rate", "sgd", "loss-functions", "backpropagation"],
  vizType: "interactive",
};

// Loss surface: f(x) = (x-3)^2 + 1
function loss(x: number) {
  return (x - 3) * (x - 3) + 1;
}

function gradient(x: number) {
  return 2 * (x - 3);
}

// Map x in [xMin, xMax] to SVG x
function toSvgX(x: number, xMin: number, xMax: number, svgWidth: number, pad: number) {
  return pad + ((x - xMin) / (xMax - xMin)) * (svgWidth - 2 * pad);
}

// Map y to SVG y (inverted)
function toSvgY(y: number, yMin: number, yMax: number, svgHeight: number, pad: number) {
  return svgHeight - pad - ((y - yMin) / (yMax - yMin)) * (svgHeight - 2 * pad);
}

export default function GradientDescentTopic() {
  const [learningRate, setLearningRate] = useState(0.3);
  const [ballX, setBallX] = useState(0.5);
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const xMin = -1;
  const xMax = 7;
  const yMin = 0;
  const yMax = 18;
  const svgW = 500;
  const svgH = 280;
  const pad = 40;

  // Generate loss curve points
  const curvePoints: string[] = [];
  for (let px = 0; px <= 200; px++) {
    const x = xMin + (px / 200) * (xMax - xMin);
    const y = loss(x);
    curvePoints.push(
      `${toSvgX(x, xMin, xMax, svgW, pad)},${toSvgY(y, yMin, yMax, svgH, pad)}`
    );
  }

  const step = useCallback(() => {
    setBallX((prev) => {
      const grad = gradient(prev);
      const newX = prev - learningRate * grad;
      const clamped = Math.max(xMin, Math.min(xMax, newX));
      setTrail((t) => [...t.slice(-30), { x: prev, y: loss(prev) }]);
      return clamped;
    });
  }, [learningRate]);

  const startDescent = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    setTrail([]);
    setBallX(0.5);

    // Small delay then start
    setTimeout(() => {
      intervalRef.current = setInterval(() => {
        setBallX((prev) => {
          const grad = gradient(prev);
          const newX = prev - learningRate * grad;
          const clamped = Math.max(xMin, Math.min(xMax, newX));
          setTrail((t) => [...t.slice(-30), { x: prev, y: loss(prev) }]);

          // Stop if converged
          if (Math.abs(grad) < 0.01 || Math.abs(newX - prev) < 0.001) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsRunning(false);
          }
          return clamped;
        });
      }, 300);
    }, 100);
  }, [learningRate, isRunning]);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setBallX(0.5);
    setTrail([]);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const ballSvgX = toSvgX(ballX, xMin, xMax, svgW, pad);
  const ballSvgY = toSvgY(loss(ballX), yMin, yMax, svgH, pad);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn <strong>bị bịt mắt đứng trên một ngọn đồi</strong> và
          cần tìm đường xuống thung lũng thấp nhất. Bạn không nhìn thấy gì, nhưng bạn
          có thể <strong>cảm nhận độ dốc</strong> dưới chân mình.
        </p>
        <p>
          Chiến thuật của bạn: mỗi bước, hãy <strong>đi theo hướng dốc nhất</strong>{" "}
          xuống dưới. Bước đi lớn (learning rate cao) giúp bạn xuống nhanh nhưng có thể
          bước quá đà, nhảy qua đáy thung lũng. Bước nhỏ (learning rate thấp) thì an
          toàn nhưng rất chậm.
        </p>
        <p>
          <strong>Gradient</strong> chính là &quot;độ dốc&quot; đó. <strong>Gradient
          Descent</strong> là chiến thuật &quot;luôn bước theo hướng dốc xuống&quot; cho
          đến khi đến nơi bằng phẳng nhất (cực tiểu).
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1 flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-muted">
                Tốc độ học (Learning Rate): <strong className="text-foreground">{learningRate.toFixed(2)}</strong>
              </label>
              <input
                type="range"
                min="0.01"
                max="1.0"
                step="0.01"
                value={learningRate}
                onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                className="w-full accent-accent"
                disabled={isRunning}
              />
              <div className="flex justify-between text-xs text-muted">
                <span>Chậm & chính xác</span>
                <span>Nhanh & rủi ro</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={reset}
                className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
              >
                Đặt lại
              </button>
              <button
                onClick={startDescent}
                disabled={isRunning}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isRunning ? "Đang chạy..." : "Bắt đầu hạ gradient"}
              </button>
            </div>
          </div>

          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-2xl mx-auto">
            {/* Axes */}
            <line x1={pad} y1={svgH - pad} x2={svgW - pad} y2={svgH - pad} stroke="#334155" strokeWidth="1" />
            <line x1={pad} y1={pad} x2={pad} y2={svgH - pad} stroke="#334155" strokeWidth="1" />

            {/* Axis labels */}
            <text x={svgW / 2} y={svgH - 8} textAnchor="middle" fill="#64748b" fontSize="11">
              Trọng số (w)
            </text>
            <text x={15} y={svgH / 2} textAnchor="middle" fill="#64748b" fontSize="11" transform={`rotate(-90, 15, ${svgH / 2})`}>
              Loss
            </text>

            {/* Optimal point marker */}
            <line
              x1={toSvgX(3, xMin, xMax, svgW, pad)}
              y1={svgH - pad}
              x2={toSvgX(3, xMin, xMax, svgW, pad)}
              y2={toSvgY(loss(3), yMin, yMax, svgH, pad)}
              stroke="#22c55e"
              strokeWidth="1"
              strokeDasharray="4,3"
              opacity={0.5}
            />
            <text
              x={toSvgX(3, xMin, xMax, svgW, pad)}
              y={svgH - pad + 15}
              textAnchor="middle"
              fill="#22c55e"
              fontSize="9"
            >
              Cực tiểu
            </text>

            {/* Loss curve */}
            <polyline
              points={curvePoints.join(" ")}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Trail */}
            {trail.map((point, i) => (
              <circle
                key={`trail-${i}`}
                cx={toSvgX(point.x, xMin, xMax, svgW, pad)}
                cy={toSvgY(point.y, yMin, yMax, svgH, pad)}
                r={2}
                fill="#f59e0b"
                opacity={0.3 + (i / trail.length) * 0.7}
              />
            ))}

            {/* Ball */}
            <motion.circle
              cx={ballSvgX}
              cy={ballSvgY}
              r={8}
              fill="#ef4444"
              stroke="white"
              strokeWidth="2"
              initial={false}
              animate={{ cx: ballSvgX, cy: ballSvgY }}
              transition={{ type: "spring", stiffness: 100 }}
            />

            {/* Ball value label */}
            <motion.text
              x={ballSvgX}
              y={ballSvgY - 15}
              textAnchor="middle"
              fill="#ef4444"
              fontSize="10"
              fontWeight="bold"
              initial={false}
              animate={{ x: ballSvgX, y: ballSvgY - 15 }}
            >
              w={ballX.toFixed(2)}
            </motion.text>
          </svg>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-xs text-muted">Vị trí hiện tại</p>
              <p className="text-lg font-bold text-foreground">{ballX.toFixed(3)}</p>
            </div>
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-xs text-muted">Loss</p>
              <p className="text-lg font-bold text-foreground">{loss(ballX).toFixed(3)}</p>
            </div>
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-xs text-muted">Gradient</p>
              <p className="text-lg font-bold text-foreground">{gradient(ballX).toFixed(3)}</p>
            </div>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Gradient Descent</strong> (hạ gradient) là thuật toán tối ưu được sử dụng
          rộng rãi nhất trong machine learning. Mục tiêu là tìm bộ trọng số w sao cho hàm
          mất mát L(w) đạt giá trị nhỏ nhất.
        </p>
        <p>Công thức cập nhật cực kỳ đơn giản:</p>
        <div className="rounded-lg bg-background/50 border border-border p-3 text-center font-mono text-foreground">
          w_mới = w_cũ - &alpha; &times; &nabla;L(w)
        </div>
        <p>
          Trong đó <strong>&alpha;</strong> là tốc độ học (learning rate) và{" "}
          <strong>&nabla;L(w)</strong> là gradient của hàm mất mát. Gradient chỉ hướng
          tăng nhanh nhất, nên ta đi ngược hướng gradient (dấu trừ) để giảm loss.
        </p>
        <p>Ba biến thể chính:</p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>
            <strong>Batch GD:</strong> Tính gradient trên toàn bộ dữ liệu. Chính xác nhưng
            chậm với dữ liệu lớn.
          </li>
          <li>
            <strong>Stochastic GD (SGD):</strong> Tính gradient trên từng mẫu. Nhanh nhưng
            dao động nhiều.
          </li>
          <li>
            <strong>Mini-batch GD:</strong> Tính gradient trên một lô nhỏ. Cân bằng giữa
            tốc độ và ổn định.
          </li>
        </ul>
      </ExplanationSection>
    </>
  );
}
