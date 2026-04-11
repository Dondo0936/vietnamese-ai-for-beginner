"use client";

import { useState, useCallback } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "t-sne",
  title: "t-SNE",
  titleVi: "Nhúng ngẫu nhiên láng giềng t-phân bố",
  description: "Kỹ thuật giảm chiều phi tuyến để trực quan hóa dữ liệu chiều cao",
  category: "classic-ml",
  tags: ["dimensionality-reduction", "visualization", "unsupervised-learning"],
  difficulty: "advanced",
  relatedSlugs: ["pca", "k-means", "dbscan"],
  vizType: "interactive",
};

// Simulate t-SNE optimization steps
const clusterCenters = [
  { cx: 120, cy: 100 },
  { cx: 380, cy: 100 },
  { cx: 250, cy: 230 },
];

function generatePoints(step: number) {
  const spread = Math.max(10, 120 - step * 15);
  const seedRng = (seed: number) => {
    let s = seed;
    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  };

  const rng = seedRng(42);

  return clusterCenters.flatMap((center, ci) =>
    Array.from({ length: 8 }, (_, i) => ({
      x: center.cx + (rng() - 0.5) * spread * 2,
      y: center.cy + (rng() - 0.5) * spread * 2,
      cluster: ci,
      id: ci * 8 + i,
    }))
  );
}

const colors = ["#3b82f6", "#ef4444", "#22c55e"];

export default function TsneTopic() {
  const [step, setStep] = useState(0);
  const maxStep = 7;

  const points = generatePoints(step);

  const animate = useCallback(() => {
    setStep((s) => Math.min(maxStep, s + 1));
  }, []);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn có bản đồ 3D của các ngôi sao trong vũ trụ và muốn vẽ chúng
          lên tờ giấy 2D sao cho các ngôi sao <strong>gần nhau trong 3D vẫn gần nhau trên
          giấy</strong>, và các ngôi sao xa nhau trong 3D vẫn xa nhau trên giấy.
        </p>
        <p>
          <strong>t-SNE</strong> làm điều này bằng cách tối ưu dần dần &mdash; ban đầu các
          điểm đặt ngẫu nhiên, rồi từ từ &quot;kéo&quot; các điểm giống nhau lại gần và
          &quot;đẩy&quot; các điểm khác nhau ra xa.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <p className="mb-3 text-sm text-muted">
          Nhấp nút để xem các điểm hội tụ dần thành cụm qua mỗi bước tối ưu hóa.
        </p>
        <svg
          viewBox="0 0 500 300"
          className="w-full rounded-lg border border-border bg-background"
        >
          {/* Points */}
          {points.map((p) => (
            <circle
              key={p.id}
              cx={Math.max(10, Math.min(490, p.x))}
              cy={Math.max(10, Math.min(290, p.y))}
              r={5}
              fill={colors[p.cluster]}
              stroke="#fff"
              strokeWidth={1.5}
              opacity={0.85}
            />
          ))}

          {/* Step label */}
          <text x={10} y={20} fontSize={13} fill="currentColor" className="text-foreground" fontWeight={600}>
            Bước tối ưu: {step}/{maxStep}
          </text>

          {step === 0 && (
            <text x={250} y={160} fontSize={14} fill="currentColor" className="text-muted" textAnchor="middle" opacity={0.5}>
              Vị trí ngẫu nhiên ban đầu
            </text>
          )}
          {step === maxStep && (
            <text x={250} y={290} fontSize={12} fill="#22c55e" textAnchor="middle" fontWeight={600}>
              Hội tụ! Các cụm đã tách rõ.
            </text>
          )}
        </svg>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={animate}
            disabled={step >= maxStep}
            className="rounded-lg border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-white disabled:opacity-30"
          >
            Bước tiếp
          </button>
          <button
            onClick={() => setStep(0)}
            className="rounded-lg border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-white"
          >
            Đặt lại
          </button>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>t-SNE (t-distributed Stochastic Neighbor Embedding)</strong> là kỹ thuật
          giảm chiều <strong>phi tuyến</strong>, chuyên dùng để <strong>trực quan hóa</strong>
          dữ liệu chiều cao xuống 2D hoặc 3D.
        </p>
        <p>
          Ý tưởng: trong không gian gốc, tính xác suất hai điểm là &quot;láng giềng&quot;
          (dùng phân bố Gaussian). Trong không gian thấp, tính xác suất tương tự (dùng
          phân bố Student-t). Tối thiểu hóa <strong>KL divergence</strong> giữa hai phân
          bố bằng gradient descent.
        </p>
        <p>
          Lưu ý: t-SNE chỉ dùng để <strong>trực quan hóa</strong>, không nên dùng để rút
          đặc trưng. Khoảng cách giữa các cụm không có ý nghĩa tuyệt đối. Tham số
          <strong> perplexity</strong> ảnh hưởng lớn đến kết quả &mdash; nên thử nhiều
          giá trị khác nhau.
        </p>
      </ExplanationSection>
    </>
  );
}
