"use client";

import { useState, useMemo } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "perplexity-metric",
  title: "Perplexity",
  titleVi: "Perplexity - Độ bối rối của mô hình ngôn ngữ",
  description:
    "Chỉ số đánh giá mô hình ngôn ngữ, đo mức độ 'bất ngờ' khi mô hình gặp dữ liệu mới.",
  category: "nlp",
  tags: ["nlp", "evaluation", "language-model"],
  difficulty: "intermediate",
  relatedSlugs: ["gpt", "bert", "loss-functions"],
  vizType: "interactive",
};

const TOKENS = ["Tôi", "yêu", "học", "máy"];

export default function PerplexityMetricTopic() {
  const [probs, setProbs] = useState([0.8, 0.6, 0.4, 0.3]);

  const perplexity = useMemo(() => {
    const logSum = probs.reduce((s, p) => s + Math.log(p), 0);
    return Math.exp(-logSum / probs.length);
  }, [probs]);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang chơi <strong>đoán từ</strong> với bạn bè.
          Nếu bạn giỏi, bạn sẽ ít bị <strong>bất ngờ</strong> — bạn đoán đúng
          phần lớn các từ. Nếu bạn kém, mỗi từ đều khiến bạn &quot;ngỡ ngàng&quot;.
        </p>
        <p>
          Perplexity đo chính xác điều này: mô hình ngôn ngữ <strong>bối rối
          đến mức nào</strong> khi gặp văn bản mới. Perplexity thấp = mô hình tự
          tin và chính xác. Perplexity cao = mô hình &quot;hoang mang&quot;, dự đoán kém.
        </p>
        <p>
          Ví dụ: Perplexity = 10 nghĩa là mô hình &quot;phân vân&quot; giữa khoảng 10
          từ ứng viên cho mỗi vị trí. Perplexity = 2 nghĩa là chỉ phân vân
          giữa 2 từ — <strong>tự tin hơn nhiều</strong>!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <p className="text-sm text-muted text-center">
            Điều chỉnh xác suất dự đoán cho mỗi từ
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {TOKENS.map((token, i) => (
              <div key={token} className="space-y-1">
                <label className="text-sm font-medium text-muted">
                  P({token}): {probs[i].toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0.05"
                  max="0.99"
                  step="0.05"
                  value={probs[i]}
                  onChange={(e) => {
                    const newProbs = [...probs];
                    newProbs[i] = parseFloat(e.target.value);
                    setProbs(newProbs);
                  }}
                  className="w-full accent-accent"
                />
              </div>
            ))}
          </div>

          <svg viewBox="0 0 600 200" className="w-full max-w-2xl mx-auto">
            {/* Probability bars */}
            {TOKENS.map((token, i) => {
              const barH = probs[i] * 100;
              const x = 80 + i * 130;
              return (
                <g key={token}>
                  {/* Bar */}
                  <rect
                    x={x}
                    y={140 - barH}
                    width="60"
                    height={barH}
                    rx="4"
                    fill={probs[i] > 0.6 ? "#22c55e" : probs[i] > 0.3 ? "#f59e0b" : "#ef4444"}
                    opacity={0.8}
                  />
                  {/* Value */}
                  <text x={x + 30} y={135 - barH} textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="bold">
                    {probs[i].toFixed(2)}
                  </text>
                  {/* Token label */}
                  <text x={x + 30} y="160" textAnchor="middle" fill="#94a3b8" fontSize="12">
                    {token}
                  </text>
                </g>
              );
            })}

            {/* Perplexity display */}
            <rect
              x="380"
              y="25"
              width="180"
              height="55"
              rx="10"
              fill={perplexity < 3 ? "#22c55e" : perplexity < 8 ? "#f59e0b" : "#ef4444"}
              opacity={0.2}
              stroke={perplexity < 3 ? "#22c55e" : perplexity < 8 ? "#f59e0b" : "#ef4444"}
              strokeWidth="1.5"
            />
            <text x="470" y="48" textAnchor="middle" fill="#e2e8f0" fontSize="11">
              Perplexity
            </text>
            <text x="470" y="70" textAnchor="middle" fill="#e2e8f0" fontSize="20" fontWeight="bold">
              {perplexity.toFixed(2)}
            </text>
          </svg>

          <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
            <p className="text-sm text-muted">
              Perplexity = exp(-1/N &times; &sum;log P(w_i)) ={" "}
              <strong className={perplexity < 3 ? "text-green-500" : perplexity < 8 ? "text-yellow-500" : "text-red-500"}>
                {perplexity.toFixed(2)}
              </strong>{" "}
              — {perplexity < 3 ? "Mô hình rất tự tin!" : perplexity < 8 ? "Mô hình khá ổn" : "Mô hình khá bối rối"}
            </p>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Perplexity</strong> là chỉ số đánh giá nội tại (intrinsic)
          phổ biến nhất cho mô hình ngôn ngữ. Nó đo mức độ &quot;bất ngờ&quot; trung
          bình của mô hình khi gặp mỗi token trong tập kiểm tra.
        </p>
        <p>Cách hiểu perplexity:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Công thức:</strong> PPL = exp(-1/N &times; &sum;log P(w_i)),
            trong đó P(w_i) là xác suất mô hình gán cho token thứ i.
          </li>
          <li>
            <strong>Ý nghĩa trực quan:</strong> Perplexity ≈ k nghĩa là mô
            hình &quot;phân vân&quot; giữa khoảng k lựa chọn cho mỗi token.
          </li>
          <li>
            <strong>So sánh:</strong> Perplexity thấp hơn = mô hình tốt hơn.
            GPT-3 đạt perplexity khoảng 20 trên tập benchmark.
          </li>
        </ol>
        <p>
          Lưu ý: Perplexity chỉ so sánh được giữa các mô hình dùng{" "}
          <strong>cùng bộ từ vựng</strong> và <strong>cùng tập kiểm tra</strong>.
          Nó không phản ánh đầy đủ chất lượng văn bản sinh ra.
        </p>
      </ExplanationSection>
    </>
  );
}
