"use client";

import { useState, useMemo } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "temperature",
  title: "Temperature",
  titleVi: "Temperature - Nhiệt độ sinh văn bản",
  description:
    "Tham số kiểm soát mức độ ngẫu nhiên khi mô hình chọn từ tiếp theo, ảnh hưởng đến sự sáng tạo.",
  category: "llm-concepts",
  tags: ["temperature", "sampling", "llm", "generation"],
  difficulty: "beginner",
  relatedSlugs: ["top-k-top-p", "hallucination", "prompt-engineering"],
  vizType: "interactive",
};

const WORDS = ["mèo", "chó", "voi", "cá", "chim"];
const BASE_PROBS = [0.45, 0.25, 0.15, 0.10, 0.05];

function applyTemperature(probs: number[], temp: number): number[] {
  if (temp === 0) {
    const maxIdx = probs.indexOf(Math.max(...probs));
    return probs.map((_, i) => (i === maxIdx ? 1 : 0));
  }
  const logits = probs.map((p) => Math.log(p + 1e-10) / temp);
  const maxLogit = Math.max(...logits);
  const exps = logits.map((l) => Math.exp(l - maxLogit));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#a855f7"];

export default function TemperatureTopic() {
  const [temp, setTemp] = useState(1.0);

  const adjustedProbs = useMemo(
    () => applyTemperature(BASE_PROBS, temp),
    [temp]
  );

  const maxBarHeight = 160;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang <strong>gọi món ăn tối</strong>. Temperature giống
          như mức độ &quot;phiêu lưu&quot; của bạn:
        </p>
        <p>
          <strong>Temperature thấp (0)</strong>: Bạn luôn gọi món yêu thích &mdash;
          an toàn, dễ đoán, nhưng nhàm chán. Như người luôn ăn phở mỗi ngày.
        </p>
        <p>
          <strong>Temperature cao (2.0)</strong>: Bạn sẵn sàng thử món lạ, thậm chí
          món chưa bao giờ nghe tên. Sáng tạo nhưng đôi khi có thể &quot;dở tệ&quot;!
        </p>
        <p>
          <strong>Temperature vừa (0.7-1.0)</strong>: Bạn thỉnh thoảng thử món mới
          nhưng vẫn dựa trên sở thích. Cân bằng tốt nhất!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          {/* Temperature slider */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted">
              Temperature: {temp.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              value={temp}
              onChange={(e) => setTemp(parseFloat(e.target.value))}
              className="w-full accent-accent"
            />
            <div className="flex justify-between text-xs text-muted">
              <span>0 (Quyết định chắc chắn)</span>
              <span>1.0 (Mặc định)</span>
              <span>2.0 (Rất ngẫu nhiên)</span>
            </div>
          </div>

          {/* Probability distribution */}
          <svg viewBox="0 0 500 250" className="w-full max-w-xl mx-auto">
            <text x="250" y="20" textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="bold">
              Xác suất chọn từ tiếp theo
            </text>
            <text x="250" y="36" textAnchor="middle" fill="#64748b" fontSize="9">
              Câu: &quot;Con vật yêu thích của tôi là con ___&quot;
            </text>

            {/* Bars */}
            {adjustedProbs.map((prob, i) => {
              const barHeight = prob * maxBarHeight;
              const x = 60 + i * 85;
              const barY = 200 - barHeight;
              return (
                <g key={i}>
                  <rect
                    x={x}
                    y={barY}
                    width="55"
                    height={barHeight}
                    rx="4"
                    fill={COLORS[i]}
                    opacity={0.8}
                  />
                  <text x={x + 27.5} y={barY - 8} textAnchor="middle" fill={COLORS[i]} fontSize="10" fontWeight="bold">
                    {(prob * 100).toFixed(1)}%
                  </text>
                  <text x={x + 27.5} y="220" textAnchor="middle" fill="#94a3b8" fontSize="10">
                    {WORDS[i]}
                  </text>
                </g>
              );
            })}

            {/* Baseline */}
            <line x1="50" y1="200" x2="470" y2="200" stroke="#475569" strokeWidth="1" />
          </svg>

          {/* Description */}
          <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
            <p className="text-sm text-muted">
              {temp === 0
                ? "Temperature = 0: Luôn chọn từ có xác suất cao nhất (greedy). Kết quả hoàn toàn xác định."
                : temp < 0.5
                  ? "Temperature thấp: Phân bố tập trung vào từ có xác suất cao. Ít sáng tạo, nhiều dự đoán."
                  : temp <= 1.0
                    ? "Temperature vừa phải: Phân bố cân bằng. Sáng tạo vừa phải, kết quả đa dạng nhưng hợp lý."
                    : "Temperature cao: Phân bố gần đồng đều. Rất sáng tạo nhưng dễ tạo ra văn bản vô nghĩa."}
            </p>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Temperature</strong> là tham số kiểm soát mức độ ngẫu nhiên khi mô hình
          ngôn ngữ chọn từ tiếp theo. Nó ảnh hưởng trực tiếp đến phân bố xác suất
          softmax trước khi lấy mẫu.
        </p>
        <p>Cách Temperature hoạt động:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>T = 0 (Greedy):</strong> Luôn chọn từ có xác suất cao nhất. Kết quả
            xác định và lặp lại. Phù hợp cho bài toán cần chính xác.
          </li>
          <li>
            <strong>T &lt; 1 (Tập trung):</strong> Làm cho phân bố xác suất nhọn hơn,
            tập trung vào các từ có xác suất cao. Kết quả ổn định.
          </li>
          <li>
            <strong>T = 1 (Mặc định):</strong> Giữ nguyên phân bố xác suất gốc.
          </li>
          <li>
            <strong>T &gt; 1 (Phân tán):</strong> Làm phẳng phân bố, cho phép các từ
            ít xác suất cũng được chọn. Tăng sự đa dạng nhưng giảm chất lượng.
          </li>
        </ol>
        <p>
          Trong thực tế, temperature 0.0-0.3 dùng cho code và dữ liệu cấu trúc,
          0.5-0.8 cho văn bản thông thường, và 0.9-1.5 cho sáng tạo nội dung.
        </p>
      </ExplanationSection>
    </>
  );
}
