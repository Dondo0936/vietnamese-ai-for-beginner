"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "calculus-for-backprop",
  title: "Calculus for Backpropagation",
  titleVi: "Giải tích cho lan truyền ngược",
  description:
    "Đạo hàm, quy tắc chuỗi và gradient — toán học đằng sau quá trình huấn luyện mạng nơ-ron",
  category: "math-foundations",
  tags: ["derivatives", "chain-rule", "gradient"],
  difficulty: "intermediate",
  relatedSlugs: ["backpropagation", "gradient-descent", "loss-functions"],
  vizType: "interactive",
};

// Loss curve: f(x) = (x-2)^2 + 0.5*sin(3x) + 2
function lossFunc(x: number) {
  return (x - 2) * (x - 2) + 0.5 * Math.sin(3 * x) + 2;
}

function lossDerivative(x: number) {
  return 2 * (x - 2) + 1.5 * Math.cos(3 * x);
}

export default function CalculusForBackpropTopic() {
  const [pointX, setPointX] = useState(0);
  const [lr, setLr] = useState(0.15);

  const svgW = 600;
  const svgH = 300;
  const pad = 45;
  const xMin = -1.5;
  const xMax = 5.5;
  const yMin = 0;
  const yMax = 14;

  const toX = (x: number) =>
    pad + ((x - xMin) / (xMax - xMin)) * (svgW - 2 * pad);
  const toY = (y: number) =>
    svgH - pad - ((y - yMin) / (yMax - yMin)) * (svgH - 2 * pad);

  // Generate loss curve
  const steps = 200;
  const curvePoints: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = xMin + (i / steps) * (xMax - xMin);
    const y = lossFunc(x);
    curvePoints.push(`${toX(x)},${toY(y)}`);
  }

  const yAtPoint = lossFunc(pointX);
  const deriv = lossDerivative(pointX);

  // Tangent line endpoints
  const tangentLen = 1.2;
  const t1x = pointX - tangentLen;
  const t1y = yAtPoint - tangentLen * deriv;
  const t2x = pointX + tangentLen;
  const t2y = yAtPoint + tangentLen * deriv;

  // Gradient descent step
  const nextX = pointX - lr * deriv;
  const nextY = lossFunc(nextX);

  const handleStep = () => {
    const nx = pointX - lr * deriv;
    setPointX(Math.max(xMin, Math.min(xMax, nx)));
  };

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang dùng một <strong>ứng dụng đi bộ leo núi</strong>{" "}
          mà luôn chỉ cho bạn <strong>hướng dốc xuống</strong>. Tại mỗi vị trí, ứng
          dụng đo <strong>độ dốc</strong> (đạo hàm) dưới chân bạn và bảo bạn đi ngược
          hướng dốc.
        </p>
        <p>
          Nhưng nếu bạn phải đi qua <strong>nhiều ngọn đồi nối tiếp</strong> (nhiều
          lớp trong mạng nơ-ron), bạn cần biết: &quot;Nếu tôi thay đổi vị trí ở đồi
          đầu tiên, nó ảnh hưởng thế nào đến vị trí cuối cùng?&quot; Đó chính là{" "}
          <strong>quy tắc chuỗi (chain rule)</strong> — kết nối độ dốc qua nhiều lớp,
          cho phép tính gradient từ đầu ra ngược về đầu vào.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Nhấn vào đường cong hoặc kéo thanh trượt để chọn vị trí. Đường tiếp tuyến
            (cam) thể hiện đạo hàm tại điểm đó. Nhấn &quot;Bước gradient&quot; để
            thực hiện một bước gradient descent.
          </p>

          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-2xl mx-auto">
            {/* Axes */}
            <line x1={pad} y1={svgH - pad} x2={svgW - pad} y2={svgH - pad} stroke="#64748b" strokeWidth={1} />
            <line x1={pad} y1={pad} x2={pad} y2={svgH - pad} stroke="#64748b" strokeWidth={1} />
            <text x={svgW / 2} y={svgH - 5} textAnchor="middle" fill="#64748b" fontSize="10">
              Trọng số (w)
            </text>
            <text
              x={12}
              y={svgH / 2}
              textAnchor="middle"
              fill="#64748b"
              fontSize="10"
              transform={`rotate(-90, 12, ${svgH / 2})`}
            >
              Loss L(w)
            </text>

            {/* Loss curve */}
            <polyline
              points={curvePoints.join(" ")}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={2.5}
              strokeLinecap="round"
            />

            {/* Tangent line */}
            <line
              x1={toX(t1x)}
              y1={toY(t1y)}
              x2={toX(t2x)}
              y2={toY(t2y)}
              stroke="#f97316"
              strokeWidth={2}
              strokeDasharray="6 3"
            />

            {/* Gradient arrow */}
            {Math.abs(deriv) > 0.1 && (
              <line
                x1={toX(pointX)}
                y1={toY(yAtPoint) + 15}
                x2={toX(nextX)}
                y2={toY(yAtPoint) + 15}
                stroke="#22c55e"
                strokeWidth={2}
                markerEnd="url(#gArrow)"
              />
            )}
            <defs>
              <marker id="gArrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#22c55e" />
              </marker>
            </defs>

            {/* Current point */}
            <circle
              cx={toX(pointX)}
              cy={toY(yAtPoint)}
              r={7}
              fill="#ef4444"
              stroke="#fff"
              strokeWidth={2}
            />
            <text
              x={toX(pointX)}
              y={toY(yAtPoint) - 14}
              textAnchor="middle"
              fill="#ef4444"
              fontSize="10"
              fontWeight="bold"
            >
              w = {pointX.toFixed(2)}
            </text>

            {/* Next point preview */}
            {nextX >= xMin && nextX <= xMax && (
              <circle
                cx={toX(nextX)}
                cy={toY(nextY)}
                r={5}
                fill="none"
                stroke="#22c55e"
                strokeWidth={2}
                strokeDasharray="3 2"
              />
            )}

            {/* Info box */}
            <rect x={svgW - 195} y={8} width={180} height={70} rx={6} fill="#1e293b" stroke="#475569" strokeWidth={1} />
            <text x={svgW - 105} y={26} textAnchor="middle" fill="#f97316" fontSize="10" fontWeight="bold">
              Đạo hàm: dL/dw = {deriv.toFixed(3)}
            </text>
            <text x={svgW - 105} y={43} textAnchor="middle" fill="#94a3b8" fontSize="9">
              Loss = {yAtPoint.toFixed(3)}
            </text>
            <text x={svgW - 105} y={58} textAnchor="middle" fill="#22c55e" fontSize="9">
              Bước tiếp: w = {nextX.toFixed(3)}
            </text>

            {/* Chain rule illustration */}
            <rect x={pad + 5} y={8} width={200} height={28} rx={6} fill="#1e293b" stroke="#8b5cf6" strokeWidth={1} />
            <text x={pad + 105} y={26} textAnchor="middle" fill="#8b5cf6" fontSize="9">
              Chain rule: dL/dw = dL/dy &times; dy/dw
            </text>
          </svg>

          {/* Controls */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted">
                Vị trí w:{" "}
                <strong className="text-foreground">{pointX.toFixed(2)}</strong>
              </label>
              <input
                type="range"
                min={xMin}
                max={xMax}
                step={0.05}
                value={pointX}
                onChange={(e) => setPointX(parseFloat(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted">
                Learning rate:{" "}
                <strong className="text-foreground">{lr.toFixed(2)}</strong>
              </label>
              <input
                type="range"
                min={0.01}
                max={0.5}
                step={0.01}
                value={lr}
                onChange={(e) => setLr(parseFloat(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => setPointX(0)}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
            >
              Đặt lại
            </button>
            <button
              onClick={handleStep}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Bước gradient
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-xs text-muted">Đạo hàm (dL/dw)</p>
              <p className="text-lg font-bold text-foreground">{deriv.toFixed(3)}</p>
            </div>
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-xs text-muted">Loss hiện tại</p>
              <p className="text-lg font-bold text-foreground">{yAtPoint.toFixed(3)}</p>
            </div>
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-xs text-muted">Hướng di chuyển</p>
              <p className="text-lg font-bold text-foreground">
                {deriv > 0.01 ? "Sang trái" : deriv < -0.01 ? "Sang phải" : "Tại cực trị"}
              </p>
            </div>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Giải tích (Calculus)</strong> là công cụ toán học cho phép mạng
          nơ-ron &quot;học&quot; bằng cách tối ưu hóa hàm mất mát. Không có giải
          tích, không có backpropagation.
        </p>

        <p>Các khái niệm cốt lõi:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Đạo hàm (Derivative):</strong> Đo tốc độ thay đổi của hàm số.
            Tại điểm w, đạo hàm dL/dw cho biết: nếu tăng w một chút, loss thay đổi
            bao nhiêu? Đạo hàm dương nghĩa là loss đang tăng &rarr; cần giảm w.
          </li>
          <li>
            <strong>Đạo hàm riêng (Partial Derivative):</strong> Khi hàm có nhiều
            biến (nhiều trọng số), ta tính đạo hàm theo từng biến trong khi giữ các
            biến khác cố định. Tập hợp tất cả đạo hàm riêng tạo thành{" "}
            <strong>gradient</strong>.
          </li>
          <li>
            <strong>Quy tắc chuỗi (Chain Rule):</strong> Nếu y = f(g(x)), thì
            dy/dx = dy/dg &times; dg/dx. Đây là trái tim của backpropagation —
            cho phép tính gradient qua nhiều lớp nối tiếp nhau. Mỗi lớp chỉ cần
            biết đạo hàm cục bộ, rồi nhân ngược lại.
          </li>
          <li>
            <strong>Gradient Descent:</strong> Cập nhật trọng số theo hướng ngược
            gradient: w_mới = w_cũ - &alpha; &times; dL/dw. &alpha; là learning rate
            quyết định bước đi lớn hay nhỏ.
          </li>
        </ol>
        <p>
          <strong>Backpropagation</strong> áp dụng chain rule từ lớp cuối (output)
          ngược về lớp đầu (input), tính gradient cho mọi trọng số trong mạng. Nhờ
          đó, mạng nơ-ron hàng triệu tham số vẫn có thể được huấn luyện hiệu quả.
        </p>
      </ExplanationSection>
    </>
  );
}
