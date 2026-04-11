"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "sgd",
  title: "Stochastic Gradient Descent",
  titleVi: "Hạ gradient ngẫu nhiên",
  description:
    "Biến thể hiệu quả của gradient descent, cập nhật trọng số sau mỗi mẫu hoặc mỗi lô nhỏ.",
  category: "neural-fundamentals",
  tags: ["optimization", "training"],
  difficulty: "intermediate",
  relatedSlugs: ["gradient-descent", "learning-rate", "optimizers", "epochs-batches"],
  vizType: "interactive",
};

type Method = "batch" | "sgd" | "mini-batch";

// Simple 2D loss surface: f(x,y) = (x-3)^2 + (y-3)^2
function loss(x: number, y: number) {
  return (x - 3) * (x - 3) + (y - 3) * (y - 3);
}

export default function SGDTopic() {
  const [method, setMethod] = useState<Method>("batch");
  const [paths, setPaths] = useState<Record<Method, { x: number; y: number }[]>>({
    batch: [],
    sgd: [],
    "mini-batch": [],
  });
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const svgW = 400;
  const svgH = 400;
  const pad = 30;

  const toSvg = (v: number) => pad + ((v - 0) / 6) * (svgW - 2 * pad);
  const fromSvg = (px: number) => ((px - pad) / (svgW - 2 * pad)) * 6;

  const runAll = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    const newPaths: Record<Method, { x: number; y: number }[]> = {
      batch: [{ x: 0.5, y: 0.5 }],
      sgd: [{ x: 0.5, y: 0.5 }],
      "mini-batch": [{ x: 0.5, y: 0.5 }],
    };
    setPaths(newPaths);

    let step = 0;
    intervalRef.current = setInterval(() => {
      step++;
      if (step > 30) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsRunning(false);
        return;
      }

      setPaths((prev) => {
        const updated = { ...prev };

        // Batch: smooth direct path
        const bLast = updated.batch[updated.batch.length - 1];
        const bGx = 2 * (bLast.x - 3) * 0.15;
        const bGy = 2 * (bLast.y - 3) * 0.15;
        updated.batch = [...updated.batch, { x: bLast.x - bGx, y: bLast.y - bGy }];

        // SGD: noisy path
        const sLast = updated.sgd[updated.sgd.length - 1];
        const noise = () => (Math.random() - 0.5) * 0.6;
        const sGx = 2 * (sLast.x - 3) * 0.15 + noise();
        const sGy = 2 * (sLast.y - 3) * 0.15 + noise();
        updated.sgd = [
          ...updated.sgd,
          { x: Math.max(0, Math.min(6, sLast.x - sGx)), y: Math.max(0, Math.min(6, sLast.y - sGy)) },
        ];

        // Mini-batch: moderate noise
        const mLast = updated["mini-batch"][updated["mini-batch"].length - 1];
        const mNoise = () => (Math.random() - 0.5) * 0.25;
        const mGx = 2 * (mLast.x - 3) * 0.15 + mNoise();
        const mGy = 2 * (mLast.y - 3) * 0.15 + mNoise();
        updated["mini-batch"] = [
          ...updated["mini-batch"],
          { x: Math.max(0, Math.min(6, mLast.x - mGx)), y: Math.max(0, Math.min(6, mLast.y - mGy)) },
        ];

        return updated;
      });
    }, 200);
  }, [isRunning]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setPaths({ batch: [], sgd: [], "mini-batch": [] });
  }, []);

  const methodConfig: Record<Method, { color: string; label: string; labelVi: string }> = {
    batch: { color: "#3b82f6", label: "Batch GD", labelVi: "GD theo lô" },
    sgd: { color: "#ef4444", label: "SGD", labelVi: "GD ngẫu nhiên" },
    "mini-batch": { color: "#22c55e", label: "Mini-batch", labelVi: "GD lô nhỏ" },
  };

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang <strong>tìm quán phở ngon nhất thành phố</strong>.
        </p>
        <p>
          <strong>Batch GD:</strong> Bạn ăn thử <em>tất cả</em> quán phở rồi mới
          quyết định đi hướng nào để tìm quán ngon hơn. Rất chính xác nhưng mất cả
          tháng!
        </p>
        <p>
          <strong>SGD:</strong> Bạn chỉ ăn <em>một quán</em> rồi ngay lập tức đổi
          hướng. Nhanh nhưng lúc đi đông lúc đi tây, rất lộn xộn.
        </p>
        <p>
          <strong>Mini-batch:</strong> Bạn ăn <em>vài quán</em> trong một khu vực
          rồi quyết định. Cân bằng giữa tốc độ và độ chính xác &mdash; đây là cách
          phổ biến nhất trong thực tế!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2">
              {(Object.keys(methodConfig) as Method[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    method === m
                      ? "text-white shadow-md"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                  style={method === m ? { backgroundColor: methodConfig[m].color } : {}}
                >
                  {methodConfig[m].label}
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
                {isRunning ? "Đang chạy..." : "So sánh cả ba"}
              </button>
            </div>
          </div>

          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-md mx-auto">
            {/* Contour circles for loss surface */}
            {[0.5, 1, 1.5, 2, 2.5].map((r, i) => (
              <circle
                key={`contour-${i}`}
                cx={toSvg(3)}
                cy={toSvg(3)}
                r={(r / 3) * (svgW - 2 * pad) / 2}
                fill="none"
                stroke="#334155"
                strokeWidth="1"
                opacity={0.4}
              />
            ))}

            {/* Target center */}
            <circle cx={toSvg(3)} cy={toSvg(3)} r="5" fill="#22c55e" opacity={0.8} />
            <text x={toSvg(3) + 10} y={toSvg(3) - 8} fill="#22c55e" fontSize="10">
              Cực tiểu
            </text>

            {/* Paths */}
            {(Object.keys(methodConfig) as Method[]).map((m) => {
              const path = paths[m];
              if (path.length < 2) return null;

              const highlighted = method === m;
              return (
                <g key={`path-${m}`}>
                  <polyline
                    points={path.map((p) => `${toSvg(p.x)},${toSvg(p.y)}`).join(" ")}
                    fill="none"
                    stroke={methodConfig[m].color}
                    strokeWidth={highlighted ? 2.5 : 1.5}
                    opacity={highlighted ? 1 : 0.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Current position */}
                  {path.length > 0 && (
                    <motion.circle
                      cx={toSvg(path[path.length - 1].x)}
                      cy={toSvg(path[path.length - 1].y)}
                      r={highlighted ? 6 : 4}
                      fill={methodConfig[m].color}
                      initial={false}
                      animate={{
                        cx: toSvg(path[path.length - 1].x),
                        cy: toSvg(path[path.length - 1].y),
                      }}
                    />
                  )}
                </g>
              );
            })}

            {/* Start marker */}
            {paths.batch.length > 0 && (
              <>
                <circle cx={toSvg(0.5)} cy={toSvg(0.5)} r="5" fill="#f59e0b" stroke="white" strokeWidth="1.5" />
                <text x={toSvg(0.5) + 8} y={toSvg(0.5) + 4} fill="#f59e0b" fontSize="9">
                  Bắt đầu
                </text>
              </>
            )}

            {/* Axes */}
            <text x={svgW / 2} y={svgH - 5} textAnchor="middle" fill="#64748b" fontSize="10">
              w1
            </text>
            <text x={8} y={svgH / 2} fill="#64748b" fontSize="10" transform={`rotate(-90, 8, ${svgH / 2})`}>
              w2
            </text>
          </svg>

          {/* Legend */}
          <div className="grid grid-cols-3 gap-3 text-center">
            {(Object.keys(methodConfig) as Method[]).map((m) => (
              <div
                key={`legend-${m}`}
                className={`rounded-lg border p-2 text-xs transition-all ${
                  method === m ? "border-accent bg-accent/10" : "border-border"
                }`}
              >
                <div
                  className="mx-auto mb-1 h-2 w-8 rounded-full"
                  style={{ backgroundColor: methodConfig[m].color }}
                />
                <p className="font-semibold text-foreground">{methodConfig[m].label}</p>
                <p className="text-muted">{methodConfig[m].labelVi}</p>
              </div>
            ))}
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Stochastic Gradient Descent (SGD)</strong> là biến thể hiệu quả hơn của
          Gradient Descent, đặc biệt với dữ liệu lớn. Thay vì tính gradient trên toàn bộ
          tập dữ liệu, SGD chỉ dùng một mẫu hoặc một lô nhỏ.
        </p>
        <p>So sánh ba phương pháp:</p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>
            <strong>Batch GD:</strong> Dùng toàn bộ dữ liệu cho mỗi bước cập nhật.
            Đường đi mượt mà nhưng mỗi bước rất tốn tài nguyên.
          </li>
          <li>
            <strong>SGD (từng mẫu):</strong> Dùng 1 mẫu duy nhất. Rất nhanh nhưng
            đường đi dao động mạnh (noisy), có thể thoát khỏi cực tiểu cục bộ.
          </li>
          <li>
            <strong>Mini-batch GD:</strong> Dùng một lô nhỏ (thường 32-256 mẫu). Cân
            bằng tốt nhất giữa tốc độ và ổn định &mdash; là lựa chọn mặc định trong
            thực tế.
          </li>
        </ul>
        <p>
          Một ưu điểm bất ngờ của noise trong SGD: nó giúp mô hình{" "}
          <strong>thoát khỏi các cực tiểu cục bộ</strong> (local minima) nông, tìm
          được các cực tiểu sâu hơn với khả năng tổng quát hóa tốt hơn.
        </p>
      </ExplanationSection>
    </>
  );
}
