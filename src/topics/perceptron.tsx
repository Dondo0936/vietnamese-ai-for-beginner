"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "perceptron",
  title: "Perceptron",
  titleVi: "Perceptron - Nơ-ron nhân tạo đơn giản",
  description:
    "Đơn vị tính toán cơ bản nhất của mạng nơ-ron, mô phỏng cách một nơ-ron sinh học ra quyết định.",
  category: "neural-fundamentals",
  tags: ["neural-network", "fundamentals", "classification"],
  difficulty: "beginner",
  relatedSlugs: ["mlp", "activation-functions", "forward-propagation"],
  vizType: "interactive",
};

export default function PerceptronTopic() {
  const [w1, setW1] = useState(0.6);
  const [w2, setW2] = useState(0.4);
  const [bias, setBias] = useState(-0.5);
  const [x1, setX1] = useState(1);
  const [x2, setX2] = useState(0);

  const weightedSum = useMemo(() => x1 * w1 + x2 * w2 + bias, [x1, x2, w1, w2, bias]);
  const output = weightedSum > 0 ? 1 : 0;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn là một <strong>giám khảo tuyển dụng</strong> đang
          quyết định có nhận một ứng viên hay không. Bạn xem xét hai tiêu chí:
          <strong> kinh nghiệm</strong> (x1) và <strong>bằng cấp</strong> (x2).
        </p>
        <p>
          Mỗi tiêu chí có một <strong>mức độ quan trọng</strong> (trọng số w)
          khác nhau. Ví dụ, bạn coi trọng kinh nghiệm hơn bằng cấp, nên w1 =
          0.6 và w2 = 0.4.
        </p>
        <p>
          Sau khi tính tổng điểm có trọng số, bạn so sánh với một{" "}
          <strong>ngưỡng tối thiểu</strong> (bias). Nếu vượt ngưỡng thì{" "}
          <strong>NHẬN</strong>, ngược lại thì <strong>TỪ CHỐI</strong>. Đó
          chính là cách Perceptron hoạt động!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          {/* Inputs */}
          <div className="flex flex-wrap gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted">
                Đầu vào x1 (Kinh nghiệm)
              </label>
              <div className="flex gap-2">
                {[0, 1].map((v) => (
                  <button
                    key={v}
                    onClick={() => setX1(v)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                      x1 === v
                        ? "bg-accent text-white"
                        : "bg-card border border-border text-muted hover:text-foreground"
                    }`}
                  >
                    {v === 1 ? "Có" : "Không"}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted">
                Đầu vào x2 (Bằng cấp)
              </label>
              <div className="flex gap-2">
                {[0, 1].map((v) => (
                  <button
                    key={v}
                    onClick={() => setX2(v)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                      x2 === v
                        ? "bg-accent text-white"
                        : "bg-card border border-border text-muted hover:text-foreground"
                    }`}
                  >
                    {v === 1 ? "Có" : "Không"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Weights & Bias Sliders */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted">
                Trọng số w1: {w1.toFixed(2)}
              </label>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.1"
                value={w1}
                onChange={(e) => setW1(parseFloat(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted">
                Trọng số w2: {w2.toFixed(2)}
              </label>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.1"
                value={w2}
                onChange={(e) => setW2(parseFloat(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted">
                Bias: {bias.toFixed(2)}
              </label>
              <input
                type="range"
                min="-2"
                max="2"
                step="0.1"
                value={bias}
                onChange={(e) => setBias(parseFloat(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
          </div>

          {/* SVG Diagram */}
          <svg viewBox="0 0 600 260" className="w-full max-w-2xl mx-auto">
            {/* Input nodes */}
            <motion.circle cx="80" cy="80" r="30" fill="#3b82f6" opacity={x1 ? 1 : 0.3} />
            <text x="80" y="85" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
              x1={x1}
            </text>
            <motion.circle cx="80" cy="190" r="30" fill="#3b82f6" opacity={x2 ? 1 : 0.3} />
            <text x="80" y="195" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
              x2={x2}
            </text>

            {/* Bias node */}
            <circle cx="80" cy="30" r="16" fill="#94a3b8" opacity={0.7} />
            <text x="80" y="34" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
              b
            </text>

            {/* Connections with weight labels */}
            <line x1="110" y1="80" x2="260" y2="130" stroke="#3b82f6" strokeWidth={Math.abs(w1) * 4 + 1} opacity={0.7} />
            <text x="170" y="95" fill="#3b82f6" fontSize="12" fontWeight="bold">
              w1={w1.toFixed(1)}
            </text>

            <line x1="110" y1="190" x2="260" y2="140" stroke="#3b82f6" strokeWidth={Math.abs(w2) * 4 + 1} opacity={0.7} />
            <text x="170" y="185" fill="#3b82f6" fontSize="12" fontWeight="bold">
              w2={w2.toFixed(1)}
            </text>

            <line x1="96" y1="30" x2="260" y2="125" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4,3" opacity={0.5} />

            {/* Summation node */}
            <circle cx="290" cy="135" r="35" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <text x="290" y="130" textAnchor="middle" fill="#e2e8f0" fontSize="12">
              &Sigma;
            </text>
            <text x="290" y="148" textAnchor="middle" fill="#94a3b8" fontSize="10">
              {weightedSum.toFixed(2)}
            </text>

            {/* Step function */}
            <line x1="325" y1="135" x2="390" y2="135" stroke="#475569" strokeWidth="2" />
            <rect x="390" y="110" width="60" height="50" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            {/* Step function icon inside */}
            <polyline points="400,145 415,145 415,125 440,125" fill="none" stroke="#94a3b8" strokeWidth="2" />
            <text x="420" y="155" textAnchor="middle" fill="#64748b" fontSize="8">
              bước
            </text>

            {/* Output */}
            <line x1="450" y1="135" x2="490" y2="135" stroke="#475569" strokeWidth="2" />
            <motion.circle
              cx="520"
              cy="135"
              r="30"
              fill={output === 1 ? "#22c55e" : "#ef4444"}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.3 }}
              key={output}
            />
            <text x="520" y="131" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
              {output}
            </text>
            <text x="520" y="147" textAnchor="middle" fill="white" fontSize="10">
              {output === 1 ? "NHẬN" : "TỪ CHỐI"}
            </text>
          </svg>

          {/* Computation detail */}
          <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
            <p className="text-sm text-muted">
              Tổng có trọng số: ({x1} &times; {w1.toFixed(2)}) + ({x2} &times;{" "}
              {w2.toFixed(2)}) + ({bias.toFixed(2)}) ={" "}
              <strong className={weightedSum > 0 ? "text-green-500" : "text-red-500"}>
                {weightedSum.toFixed(2)}
              </strong>
              {weightedSum > 0 ? " > 0 → Kết quả: 1 (NHẬN)" : " ≤ 0 → Kết quả: 0 (TỪ CHỐI)"}
            </p>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Perceptron</strong> là đơn vị tính toán đơn giản nhất trong mạng nơ-ron,
          được Frank Rosenblatt phát minh năm 1958. Nó mô phỏng cách một nơ-ron sinh học
          nhận tín hiệu, xử lý và đưa ra quyết định.
        </p>
        <p>
          Perceptron hoạt động theo 3 bước:
        </p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Nhận đầu vào:</strong> Mỗi đầu vào x_i được nhân với trọng số w_i
            tương ứng, thể hiện mức độ quan trọng của đầu vào đó.
          </li>
          <li>
            <strong>Tính tổng có trọng số:</strong> Cộng tất cả tích x_i &times; w_i rồi cộng
            thêm bias (độ lệch).
          </li>
          <li>
            <strong>Hàm kích hoạt bước:</strong> Nếu tổng &gt; 0 thì xuất ra 1, ngược lại
            xuất ra 0.
          </li>
        </ol>
        <p>
          Perceptron chỉ có thể giải quyết các bài toán <strong>phân tách tuyến tính</strong>{" "}
          (linearly separable) &mdash; tức là có thể vẽ một đường thẳng để chia hai lớp dữ liệu.
          Hạn chế này dẫn đến sự ra đời của <strong>mạng nhiều lớp (MLP)</strong>.
        </p>
      </ExplanationSection>
    </>
  );
}
