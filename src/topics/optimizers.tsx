"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "optimizers",
  title: "Optimizers",
  titleVi: "Bộ tối ưu hóa",
  description:
    "Các thuật toán cải tiến gradient descent, giúp huấn luyện nhanh hơn và ổn định hơn.",
  category: "neural-fundamentals",
  tags: ["optimization", "training", "advanced"],
  difficulty: "intermediate",
  relatedSlugs: ["gradient-descent", "sgd", "learning-rate"],
  vizType: "interactive",
};

type OptimizerName = "sgd" | "momentum" | "rmsprop" | "adam";

// 2D loss surface with elongated valley: f(x,y) = 5*(x-3)^2 + 0.5*(y-3)^2
function gradX(x: number) {
  return 10 * (x - 3);
}
function gradY(y: number) {
  return 1.0 * (y - 3);
}

export default function OptimizersTopic() {
  const [selected, setSelected] = useState<OptimizerName>("adam");
  const [paths, setPaths] = useState<Record<OptimizerName, { x: number; y: number }[]>>({
    sgd: [],
    momentum: [],
    rmsprop: [],
    adam: [],
  });
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const svgW = 420;
  const svgH = 420;
  const pad = 25;

  const toSvg = (v: number) => pad + ((v - 0) / 6) * (svgW - 2 * pad);

  const runAll = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);

    // Initialize optimizer states
    const lr = 0.02;
    const states: Record<OptimizerName, { x: number; y: number; vx: number; vy: number; sx: number; sy: number; t: number }> = {
      sgd: { x: 0.5, y: 0.5, vx: 0, vy: 0, sx: 0, sy: 0, t: 0 },
      momentum: { x: 0.5, y: 0.5, vx: 0, vy: 0, sx: 0, sy: 0, t: 0 },
      rmsprop: { x: 0.5, y: 0.5, vx: 0, vy: 0, sx: 0.001, sy: 0.001, t: 0 },
      adam: { x: 0.5, y: 0.5, vx: 0, vy: 0, sx: 0.001, sy: 0.001, t: 0 },
    };

    const newPaths: Record<OptimizerName, { x: number; y: number }[]> = {
      sgd: [{ x: 0.5, y: 0.5 }],
      momentum: [{ x: 0.5, y: 0.5 }],
      rmsprop: [{ x: 0.5, y: 0.5 }],
      adam: [{ x: 0.5, y: 0.5 }],
    };
    setPaths(newPaths);

    let step = 0;
    intervalRef.current = setInterval(() => {
      step++;
      if (step > 80) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsRunning(false);
        return;
      }

      // SGD
      const sgdGx = gradX(states.sgd.x);
      const sgdGy = gradY(states.sgd.y);
      states.sgd.x -= lr * sgdGx;
      states.sgd.y -= lr * sgdGy;

      // Momentum
      const momBeta = 0.9;
      const momGx = gradX(states.momentum.x);
      const momGy = gradY(states.momentum.y);
      states.momentum.vx = momBeta * states.momentum.vx + (1 - momBeta) * momGx;
      states.momentum.vy = momBeta * states.momentum.vy + (1 - momBeta) * momGy;
      states.momentum.x -= lr * states.momentum.vx * 3;
      states.momentum.y -= lr * states.momentum.vy * 3;

      // RMSProp
      const rmsBeta = 0.99;
      const rmsGx = gradX(states.rmsprop.x);
      const rmsGy = gradY(states.rmsprop.y);
      states.rmsprop.sx = rmsBeta * states.rmsprop.sx + (1 - rmsBeta) * rmsGx * rmsGx;
      states.rmsprop.sy = rmsBeta * states.rmsprop.sy + (1 - rmsBeta) * rmsGy * rmsGy;
      states.rmsprop.x -= (lr * rmsGx) / (Math.sqrt(states.rmsprop.sx) + 1e-8);
      states.rmsprop.y -= (lr * rmsGy) / (Math.sqrt(states.rmsprop.sy) + 1e-8);

      // Adam
      const adamB1 = 0.9;
      const adamB2 = 0.999;
      states.adam.t++;
      const adamGx = gradX(states.adam.x);
      const adamGy = gradY(states.adam.y);
      states.adam.vx = adamB1 * states.adam.vx + (1 - adamB1) * adamGx;
      states.adam.vy = adamB1 * states.adam.vy + (1 - adamB1) * adamGy;
      states.adam.sx = adamB2 * states.adam.sx + (1 - adamB2) * adamGx * adamGx;
      states.adam.sy = adamB2 * states.adam.sy + (1 - adamB2) * adamGy * adamGy;
      const mxHat = states.adam.vx / (1 - Math.pow(adamB1, states.adam.t));
      const myHat = states.adam.vy / (1 - Math.pow(adamB1, states.adam.t));
      const sxHat = states.adam.sx / (1 - Math.pow(adamB2, states.adam.t));
      const syHat = states.adam.sy / (1 - Math.pow(adamB2, states.adam.t));
      states.adam.x -= (lr * mxHat) / (Math.sqrt(sxHat) + 1e-8);
      states.adam.y -= (lr * myHat) / (Math.sqrt(syHat) + 1e-8);

      // Clamp all
      for (const key of Object.keys(states) as OptimizerName[]) {
        states[key].x = Math.max(0, Math.min(6, states[key].x));
        states[key].y = Math.max(0, Math.min(6, states[key].y));
      }

      setPaths((prev) => ({
        sgd: [...prev.sgd, { x: states.sgd.x, y: states.sgd.y }],
        momentum: [...prev.momentum, { x: states.momentum.x, y: states.momentum.y }],
        rmsprop: [...prev.rmsprop, { x: states.rmsprop.x, y: states.rmsprop.y }],
        adam: [...prev.adam, { x: states.adam.x, y: states.adam.y }],
      }));
    }, 80);
  }, [isRunning]);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setPaths({ sgd: [], momentum: [], rmsprop: [], adam: [] });
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const optConfig: Record<OptimizerName, { color: string; label: string }> = {
    sgd: { color: "#64748b", label: "SGD" },
    momentum: { color: "#3b82f6", label: "Momentum" },
    rmsprop: { color: "#f59e0b", label: "RMSProp" },
    adam: { color: "#22c55e", label: "Adam" },
  };

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bốn người đang <strong>trượt xuống một thung lũng hẹp</strong>{" "}
          (mặt loss hình elip dài).
        </p>
        <p>
          <strong>SGD:</strong> Người này đi zig-zag chậm chạp, cứ lắc qua lắc lại
          giữa hai bờ thung lũng.
        </p>
        <p>
          <strong>Momentum:</strong> Giống viên bi lăn, tích lũy đà. Lao thẳng hơn
          nhưng có thể &quot;trượt quá&quot; rồi quay lại.
        </p>
        <p>
          <strong>RMSProp:</strong> Thông minh hơn &mdash; nhận ra trục nào dao động
          nhiều thì bước ngắn, trục nào ổn thì bước dài.
        </p>
        <p>
          <strong>Adam:</strong> Kết hợp cả Momentum lẫn RMSProp. Đi nhanh, ổn định,
          và là lựa chọn mặc định phổ biến nhất!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(optConfig) as OptimizerName[]).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSelected(opt)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    selected === opt
                      ? "text-white shadow-md"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                  style={selected === opt ? { backgroundColor: optConfig[opt].color } : {}}
                >
                  {optConfig[opt].label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={reset}
                className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
              >
                Đặt lại
              </button>
              <button
                onClick={runAll}
                disabled={isRunning}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isRunning ? "Đang chạy..." : "So sánh"}
              </button>
            </div>
          </div>

          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-md mx-auto">
            {/* Elliptical contours */}
            {[0.3, 0.7, 1.2, 1.8, 2.5].map((r, i) => (
              <ellipse
                key={`contour-${i}`}
                cx={toSvg(3)}
                cy={toSvg(3)}
                rx={(r / 3) * (svgW - 2 * pad) / 2}
                ry={(r / 3) * (svgH - 2 * pad) / 2 * 0.32}
                fill="none"
                stroke="#334155"
                strokeWidth="1"
                opacity={0.3}
                transform={`rotate(0, ${toSvg(3)}, ${toSvg(3)})`}
              />
            ))}

            {/* Target */}
            <circle cx={toSvg(3)} cy={toSvg(3)} r="4" fill="#22c55e" opacity={0.8} />

            {/* Paths */}
            {(Object.keys(optConfig) as OptimizerName[]).map((opt) => {
              const path = paths[opt];
              if (path.length < 2) return null;
              const highlighted = selected === opt;

              return (
                <g key={`path-${opt}`}>
                  <polyline
                    points={path.map((p) => `${toSvg(p.x)},${toSvg(p.y)}`).join(" ")}
                    fill="none"
                    stroke={optConfig[opt].color}
                    strokeWidth={highlighted ? 2.5 : 1}
                    opacity={highlighted ? 1 : 0.3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <motion.circle
                    cx={toSvg(path[path.length - 1].x)}
                    cy={toSvg(path[path.length - 1].y)}
                    r={highlighted ? 5 : 3}
                    fill={optConfig[opt].color}
                    initial={false}
                    animate={{
                      cx: toSvg(path[path.length - 1].x),
                      cy: toSvg(path[path.length - 1].y),
                    }}
                  />
                </g>
              );
            })}

            {/* Start */}
            {paths.sgd.length > 0 && (
              <circle cx={toSvg(0.5)} cy={toSvg(0.5)} r="4" fill="#f59e0b" stroke="white" strokeWidth="1" />
            )}

            <text x={svgW / 2} y={svgH - 3} textAnchor="middle" fill="#64748b" fontSize="10">w1</text>
            <text x={6} y={svgH / 2} fill="#64748b" fontSize="10" transform={`rotate(-90, 6, ${svgH / 2})`}>w2</text>
          </svg>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-center">
            {(Object.keys(optConfig) as OptimizerName[]).map((opt) => (
              <div
                key={`legend-${opt}`}
                className={`rounded-lg border p-2 text-xs transition-all cursor-pointer ${
                  selected === opt ? "border-accent bg-accent/10" : "border-border"
                }`}
                onClick={() => setSelected(opt)}
              >
                <div
                  className="mx-auto mb-1 h-2 w-8 rounded-full"
                  style={{ backgroundColor: optConfig[opt].color }}
                />
                <p className="font-semibold text-foreground">{optConfig[opt].label}</p>
              </div>
            ))}
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Optimizer (bộ tối ưu)</strong> là thuật toán quyết định cách cập nhật
          trọng số dựa trên gradient. Mỗi optimizer có chiến lược riêng để đi đến cực
          tiểu nhanh và ổn định hơn SGD thông thường.
        </p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>
            <strong>SGD + Momentum:</strong> Tích lũy gradient các bước trước (giống
            quán tính). Giảm dao động, tăng tốc trên những chiều gradient nhất quán.
          </li>
          <li>
            <strong>RMSProp:</strong> Chia learning rate cho căn bậc hai trung bình
            bình phương gradient gần đây. Tự động điều chỉnh bước đi cho mỗi tham số.
          </li>
          <li>
            <strong>Adam (Adaptive Moment Estimation):</strong> Kết hợp Momentum
            (moment bậc 1) và RMSProp (moment bậc 2), cộng thêm bias correction.
            Là optimizer mặc định phổ biến nhất hiện nay.
          </li>
        </ul>
        <p>
          Quy tắc chung: bắt đầu với <strong>Adam (lr=0.001)</strong>. Nếu cần
          generalization tốt hơn, thử <strong>SGD + Momentum</strong> với learning
          rate schedule. Trong nghiên cứu, SGD thường cho kết quả cuối tốt hơn Adam
          nhưng cần nhiều fine-tuning hơn.
        </p>
      </ExplanationSection>
    </>
  );
}
