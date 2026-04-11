"use client";

import { useState, useMemo } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "activation-functions",
  title: "Activation Functions",
  titleVi: "Hàm kích hoạt",
  description:
    "Các hàm phi tuyến giúp mạng nơ-ron học được các mối quan hệ phức tạp trong dữ liệu.",
  category: "neural-fundamentals",
  tags: ["neural-network", "fundamentals", "math"],
  difficulty: "beginner",
  relatedSlugs: ["perceptron", "mlp", "vanishing-exploding-gradients"],
  vizType: "interactive",
};

type ActivationName = "sigmoid" | "relu" | "tanh" | "leaky-relu";

const activations: Record<ActivationName, { fn: (x: number) => number; color: string; label: string }> = {
  sigmoid: {
    fn: (x) => 1 / (1 + Math.exp(-x)),
    color: "#3b82f6",
    label: "Sigmoid",
  },
  relu: {
    fn: (x) => Math.max(0, x),
    color: "#22c55e",
    label: "ReLU",
  },
  tanh: {
    fn: (x) => Math.tanh(x),
    color: "#f59e0b",
    label: "Tanh",
  },
  "leaky-relu": {
    fn: (x) => (x > 0 ? x : 0.1 * x),
    color: "#ef4444",
    label: "Leaky ReLU",
  },
};

export default function ActivationFunctionsTopic() {
  const [selected, setSelected] = useState<ActivationName>("sigmoid");
  const [inputVal, setInputVal] = useState(0);

  const act = activations[selected];
  const outputVal = act.fn(inputVal);

  // Generate curve points
  const curvePoints = useMemo(() => {
    const points: string[] = [];
    for (let px = 0; px <= 400; px += 2) {
      const x = ((px - 200) / 200) * 5; // map 0-400 to -5..5
      const y = act.fn(x);
      // Map y to SVG coordinates: y range is roughly -1..5 for relu, -1..1 for others
      let svgY: number;
      if (selected === "relu" || selected === "leaky-relu") {
        svgY = 200 - y * 40; // scale for relu
      } else {
        svgY = 200 - y * 150; // scale for sigmoid/tanh
      }
      svgY = Math.max(10, Math.min(390, svgY));
      points.push(`${px + 50},${svgY}`);
    }
    return points.join(" ");
  }, [selected, act]);

  // Input marker position
  const markerX = ((inputVal + 5) / 10) * 400 + 50;
  const markerY = useMemo(() => {
    const y = act.fn(inputVal);
    if (selected === "relu" || selected === "leaky-relu") {
      return Math.max(10, Math.min(390, 200 - y * 40));
    }
    return Math.max(10, Math.min(390, 200 - y * 150));
  }, [inputVal, selected, act]);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng mỗi nơ-ron trong mạng là một{" "}
          <strong>nhân viên kiểm duyệt</strong>. Sau khi nhận tín hiệu tổng hợp từ các
          đồng nghiệp, nhân viên này phải quyết định: <em>có nên chuyển tiếp tín hiệu
          không, và chuyển bao nhiêu?</em>
        </p>
        <p>
          <strong>Sigmoid</strong> giống nhân viên cẩn thận, luôn cho điểm từ 0 đến 1
          (xác suất). <strong>ReLU</strong> giống nhân viên thẳng tính: tín hiệu dương
          thì cho qua nguyên vẹn, âm thì chặn hết. <strong>Tanh</strong> cho phép cả
          giá trị âm lẫn dương (-1 đến 1).
        </p>
        <p>
          Nếu không có hàm kích hoạt, dù mạng có bao nhiêu lớp thì cũng chỉ là một
          phép biến đổi tuyến tính đơn giản &mdash; giống như xếp chồng nhiều tấm kính
          trong suốt, ánh sáng vẫn đi thẳng!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-5">
          {/* Function selector */}
          <div className="flex flex-wrap gap-2">
            {(Object.keys(activations) as ActivationName[]).map((name) => (
              <button
                key={name}
                onClick={() => setSelected(name)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  selected === name
                    ? "text-white shadow-md"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
                style={selected === name ? { backgroundColor: activations[name].color } : {}}
              >
                {activations[name].label}
              </button>
            ))}
          </div>

          {/* Graph */}
          <svg viewBox="0 0 500 400" className="w-full max-w-xl mx-auto">
            {/* Grid lines */}
            <line x1="50" y1="200" x2="450" y2="200" stroke="#334155" strokeWidth="1" />
            <line x1="250" y1="10" x2="250" y2="390" stroke="#334155" strokeWidth="1" />

            {/* Axis labels */}
            <text x="455" y="205" fill="#64748b" fontSize="12">x</text>
            <text x="255" y="18" fill="#64748b" fontSize="12">y</text>
            <text x="38" y="205" fill="#64748b" fontSize="10">0</text>

            {/* Tick marks */}
            {[-4, -2, 2, 4].map((v) => {
              const px = ((v + 5) / 10) * 400 + 50;
              return (
                <g key={`tick-x-${v}`}>
                  <line x1={px} y1="197" x2={px} y2="203" stroke="#475569" strokeWidth="1" />
                  <text x={px} y="216" textAnchor="middle" fill="#64748b" fontSize="9">
                    {v}
                  </text>
                </g>
              );
            })}

            {/* Curve */}
            <polyline
              points={curvePoints}
              fill="none"
              stroke={act.color}
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Input marker */}
            <circle cx={markerX} cy={markerY} r="6" fill={act.color} />
            <line
              x1={markerX}
              y1={markerY}
              x2={markerX}
              y2="200"
              stroke={act.color}
              strokeWidth="1"
              strokeDasharray="4,3"
              opacity={0.5}
            />

            {/* Value label */}
            <rect
              x={markerX - 35}
              y={markerY - 28}
              width="70"
              height="20"
              rx="4"
              fill="#0f172a"
              opacity={0.85}
            />
            <text
              x={markerX}
              y={markerY - 14}
              textAnchor="middle"
              fill={act.color}
              fontSize="11"
              fontWeight="bold"
            >
              f(x) = {outputVal.toFixed(3)}
            </text>
          </svg>

          {/* Input slider */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted">
              Giá trị đầu vào (x): <strong className="text-foreground">{inputVal.toFixed(1)}</strong>
              {" → "}
              Đầu ra: <strong style={{ color: act.color }}>{outputVal.toFixed(4)}</strong>
            </label>
            <input
              type="range"
              min="-5"
              max="5"
              step="0.1"
              value={inputVal}
              onChange={(e) => setInputVal(parseFloat(e.target.value))}
              className="w-full accent-accent"
            />
          </div>

          {/* Quick info */}
          <div className="rounded-lg bg-background/50 border border-border p-4 text-sm text-muted">
            {selected === "sigmoid" && (
              <p>
                <strong>Sigmoid:</strong> f(x) = 1/(1+e^(-x)). Đầu ra nằm trong khoảng (0, 1).
                Thường dùng cho lớp đầu ra trong bài toán phân loại nhị phân. Nhược điểm:
                dễ gặp vấn đề triệt tiêu gradient.
              </p>
            )}
            {selected === "relu" && (
              <p>
                <strong>ReLU:</strong> f(x) = max(0, x). Đơn giản và hiệu quả nhất hiện nay.
                Tính toán nhanh, giảm vấn đề triệt tiêu gradient. Nhược điểm: nơ-ron có thể
                &quot;chết&quot; nếu đầu vào luôn âm.
              </p>
            )}
            {selected === "tanh" && (
              <p>
                <strong>Tanh:</strong> f(x) = tanh(x). Đầu ra nằm trong khoảng (-1, 1), có tâm
                tại 0. Gradient mạnh hơn Sigmoid nhưng vẫn có thể bị triệt tiêu ở hai đầu.
              </p>
            )}
            {selected === "leaky-relu" && (
              <p>
                <strong>Leaky ReLU:</strong> f(x) = x nếu x &gt; 0, 0.1x nếu x &le; 0.
                Giải quyết vấn đề &quot;nơ-ron chết&quot; của ReLU bằng cách cho phép một gradient
                nhỏ khi đầu vào âm.
              </p>
            )}
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Hàm kích hoạt (Activation Function)</strong> là thành phần không thể thiếu
          trong mạng nơ-ron. Chúng thêm tính <strong>phi tuyến</strong> vào mạng, cho phép
          mạng học được các mối quan hệ phức tạp mà phép biến đổi tuyến tính không thể
          biểu diễn.
        </p>
        <p>Các hàm kích hoạt phổ biến và cách sử dụng:</p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>
            <strong>ReLU:</strong> Lựa chọn mặc định cho các lớp ẩn. Đơn giản, nhanh và
            hiệu quả.
          </li>
          <li>
            <strong>Sigmoid:</strong> Dùng cho lớp đầu ra trong phân loại nhị phân (0 hoặc 1).
          </li>
          <li>
            <strong>Tanh:</strong> Dùng khi cần đầu ra có tâm tại 0, ví dụ trong RNN.
          </li>
          <li>
            <strong>Softmax:</strong> Dùng cho lớp đầu ra trong phân loại đa lớp (biến đổi
            thành phân phối xác suất).
          </li>
        </ul>
        <p>
          Việc chọn hàm kích hoạt phù hợp ảnh hưởng trực tiếp đến tốc độ hội tụ và chất
          lượng của mô hình. Trong thực tế, <strong>ReLU và các biến thể</strong> của nó
          (Leaky ReLU, ELU, GELU) là lựa chọn phổ biến nhất cho các lớp ẩn.
        </p>
      </ExplanationSection>
    </>
  );
}
