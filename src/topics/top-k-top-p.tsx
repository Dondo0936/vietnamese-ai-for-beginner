"use client";

import { useState, useMemo } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "top-k-top-p",
  title: "Top-K & Top-P Sampling",
  titleVi: "Top-K và Top-P - Lấy mẫu có chọn lọc",
  description:
    "Hai kỹ thuật lọc từ vựng trước khi lấy mẫu, giúp kiểm soát chất lượng văn bản sinh ra.",
  category: "llm-concepts",
  tags: ["top-k", "top-p", "nucleus-sampling", "generation"],
  difficulty: "intermediate",
  relatedSlugs: ["temperature", "llm-overview", "context-window"],
  vizType: "interactive",
};

const WORDS = [
  { word: "mèo", prob: 0.30 },
  { word: "chó", prob: 0.22 },
  { word: "thỏ", prob: 0.18 },
  { word: "voi", prob: 0.12 },
  { word: "cá", prob: 0.08 },
  { word: "rắn", prob: 0.05 },
  { word: "ếch", prob: 0.03 },
  { word: "kiến", prob: 0.02 },
];

const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#a855f7", "#ec4899", "#06b6d4", "#84cc16"];

export default function TopKTopPTopic() {
  const [k, setK] = useState(4);
  const [p, setP] = useState(0.8);
  const [mode, setMode] = useState<"top-k" | "top-p">("top-k");

  const selectedWords = useMemo(() => {
    if (mode === "top-k") {
      return WORDS.slice(0, k);
    }
    let cumProb = 0;
    const result: typeof WORDS = [];
    for (const w of WORDS) {
      if (cumProb >= p) break;
      result.push(w);
      cumProb += w.prob;
    }
    return result;
  }, [k, p, mode]);

  const selectedSet = new Set(selectedWords.map((w) => w.word));

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang chọn quà sinh nhật từ một danh sách dài 1.000 món.
          Quá nhiều lựa chọn sẽ khiến bạn rối!
        </p>
        <p>
          <strong>Top-K</strong> giống như nói: &quot;Chỉ xem {k} món được yêu thích
          nhất&quot;. Luôn giữ đúng {k} lựa chọn, bất kể chênh lệch điểm.
        </p>
        <p>
          <strong>Top-P</strong> giống như nói: &quot;Xem đủ món cho đến khi tổng xác suất
          đạt {(p * 100).toFixed(0)}%&quot;. Số lượng lựa chọn thay đổi linh hoạt theo
          phân bố xác suất.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          {/* Mode selector */}
          <div className="flex gap-2">
            {(["top-k", "top-p"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  mode === m
                    ? "bg-accent text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {m === "top-k" ? "Top-K" : "Top-P (Nucleus)"}
              </button>
            ))}
          </div>

          {/* Parameter control */}
          {mode === "top-k" ? (
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted">K = {k}</label>
              <input type="range" min="1" max="8" step="1" value={k}
                onChange={(e) => setK(parseInt(e.target.value))}
                className="w-full accent-accent" />
              <div className="flex justify-between text-xs text-muted">
                <span>1 (Rất hẹp)</span>
                <span>8 (Tất cả)</span>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted">P = {p.toFixed(2)}</label>
              <input type="range" min="0.1" max="1" step="0.05" value={p}
                onChange={(e) => setP(parseFloat(e.target.value))}
                className="w-full accent-accent" />
              <div className="flex justify-between text-xs text-muted">
                <span>0.1 (Rất hẹp)</span>
                <span>1.0 (Tất cả)</span>
              </div>
            </div>
          )}

          {/* Visualization */}
          <svg viewBox="0 0 600 220" className="w-full max-w-2xl mx-auto">
            <text x="300" y="20" textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="bold">
              Từ &quot;Con vật yêu thích là con ___&quot;
            </text>

            {WORDS.map((w, i) => {
              const isSelected = selectedSet.has(w.word);
              const barHeight = w.prob * 350;
              const x = 30 + i * 70;
              return (
                <g key={i}>
                  <rect
                    x={x}
                    y={170 - barHeight}
                    width="50"
                    height={barHeight}
                    rx="4"
                    fill={isSelected ? COLORS[i] : "#334155"}
                    opacity={isSelected ? 0.9 : 0.3}
                    stroke={isSelected ? COLORS[i] : "none"}
                    strokeWidth={isSelected ? 1.5 : 0}
                  />
                  <text x={x + 25} y={165 - barHeight} textAnchor="middle"
                    fill={isSelected ? COLORS[i] : "#475569"} fontSize="9" fontWeight="bold">
                    {(w.prob * 100).toFixed(0)}%
                  </text>
                  <text x={x + 25} y="190" textAnchor="middle"
                    fill={isSelected ? "#e2e8f0" : "#475569"} fontSize="9">
                    {w.word}
                  </text>
                  {isSelected && (
                    <text x={x + 25} y="205" textAnchor="middle" fill="#22c55e" fontSize="8">
                      Chọn
                    </text>
                  )}
                </g>
              );
            })}

            {/* Threshold line for top-p */}
            {mode === "top-p" && (
              <line x1="28" y1={170 - p * 350} x2="590" y2={170 - p * 350}
                stroke="#f59e0b" strokeWidth="1" strokeDasharray="4,3" opacity={0.5} />
            )}

            <line x1="28" y1="170" x2="590" y2="170" stroke="#475569" strokeWidth="1" />
          </svg>

          <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
            <p className="text-sm text-muted">
              {mode === "top-k"
                ? `Top-K = ${k}: Chỉ xem xét ${k} từ có xác suất cao nhất. Tổng xác suất: ${(selectedWords.reduce((s, w) => s + w.prob, 0) * 100).toFixed(0)}%`
                : `Top-P = ${p.toFixed(2)}: Chọn đủ từ cho đến khi tổng xác suất >= ${(p * 100).toFixed(0)}%. Được ${selectedWords.length} từ.`}
            </p>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Top-K</strong> và <strong>Top-P</strong> là hai kỹ thuật lọc từ vựng
          trước khi lấy mẫu, giúp loại bỏ các từ có xác suất quá thấp (nhiễu) để
          cải thiện chất lượng văn bản sinh ra.
        </p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Top-K:</strong> Giữ lại K từ có xác suất cao nhất, loại bỏ phần còn
            lại. Ưu điểm: đơn giản. Nhược điểm: K cố định nên đôi khi quá rộng hoặc quá hẹp.
          </li>
          <li>
            <strong>Top-P (Nucleus Sampling):</strong> Giữ lại tập từ nhỏ nhất sao cho
            tổng xác suất &ge; P. Tự động điều chỉnh số lượng từ theo phân bố.
          </li>
        </ol>
        <p>
          Trong thực tế, Top-P thường được ưa chuộng hơn vì tính linh hoạt: khi phân
          bố nhọn (mô hình tự tin), ít từ được chọn; khi phân bố phẳng (mô hình không
          chắc chắn), nhiều từ hơn được xem xét. Có thể kết hợp cả Top-K và Top-P
          cùng lúc.
        </p>
      </ExplanationSection>
    </>
  );
}
