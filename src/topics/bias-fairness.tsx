"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "bias-fairness",
  title: "Bias & Fairness",
  titleVi: "Thiên kiến & Công bằng trong AI",
  description:
    "Nhận diện và giảm thiểu các thiên kiến trong dữ liệu và mô hình AI để đảm bảo kết quả công bằng cho mọi nhóm.",
  category: "ai-safety",
  tags: ["bias", "fairness", "ethics", "discrimination"],
  difficulty: "intermediate",
  relatedSlugs: ["alignment", "explainability", "ai-governance"],
  vizType: "interactive",
};

const BIAS_TYPES = [
  { id: "data", label: "Thiên kiến dữ liệu", desc: "Dữ liệu huấn luyện không đại diện — ví dụ: chủ yếu ảnh người da trắng.", pct: [75, 15, 10] },
  { id: "selection", label: "Thiên kiến chọn lọc", desc: "Chỉ chọn dữ liệu từ một số nguồn nhất định.", pct: [80, 12, 8] },
  { id: "confirmation", label: "Thiên kiến xác nhận", desc: "Mô hình củng cố thêm các định kiến đã có sẵn.", pct: [60, 25, 15] },
];

const GROUPS = ["Nhóm A", "Nhóm B", "Nhóm C"];
const GROUP_COLORS = ["#3b82f6", "#22c55e", "#f59e0b"];

export default function BiasFairnessTopic() {
  const [activeBias, setActiveBias] = useState("data");
  const bias = BIAS_TYPES.find((b) => b.id === activeBias)!;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng một <strong>giám khảo tuyển dụng</strong> chỉ từng phỏng vấn
          ứng viên từ <strong>một thành phố duy nhất</strong> trong 20 năm. Vô tình, giám khảo
          hình thành <strong>thiên kiến</strong>: cho rằng ứng viên thành phố đó giỏi hơn
          vì chưa bao giờ gặp ứng viên giỏi từ nơi khác.
        </p>
        <p>
          AI cũng vậy — nếu được huấn luyện trên dữ liệu <strong>không cân bằng</strong>
          hoặc <strong>thiếu đại diện</strong>, mô hình sẽ tạo ra kết quả bất công.
          Đảm bảo <strong>công bằng AI</strong> nghĩa là mọi nhóm người đều được đối xử
          bình đẳng bởi mô hình.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {BIAS_TYPES.map((b) => (
              <button
                key={b.id}
                onClick={() => setActiveBias(b.id)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  activeBias === b.id
                    ? "bg-accent text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
          <svg viewBox="0 0 600 200" className="w-full max-w-2xl mx-auto">
            <text x={300} y={20} textAnchor="middle" fill="#e2e8f0" fontSize={12} fontWeight="bold">
              Phân bổ dữ liệu theo nhóm
            </text>
            {GROUPS.map((g, i) => {
              const y = 40 + i * 50;
              const w = bias.pct[i] * 4;
              return (
                <g key={i}>
                  <text x={20} y={y + 22} fill="#94a3b8" fontSize={11}>{g}</text>
                  <rect x={100} y={y + 5} width={400} height={28} rx={4} fill="#1e293b" />
                  <rect x={100} y={y + 5} width={w} height={28} rx={4} fill={GROUP_COLORS[i]} />
                  <text x={100 + w + 10} y={y + 25} fill="white" fontSize={11} fontWeight="bold">
                    {bias.pct[i]}%
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
            <p className="text-sm text-muted">{bias.desc}</p>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Thiên kiến (Bias)</strong> trong AI xảy ra khi mô hình tạo ra kết quả
          bất công hoặc thiên vị đối với một nhóm người nhất định. Đây là vấn đề nghiêm trọng
          ảnh hưởng đến tuyển dụng, tín dụng, tư pháp hình sự và y tế.
        </p>
        <p>Các nguồn thiên kiến chính:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Thiên kiến dữ liệu:</strong> Dữ liệu huấn luyện không cân bằng hoặc phản ánh định kiến xã hội.</li>
          <li><strong>Thiên kiến thuật toán:</strong> Kiến trúc hoặc hàm mục tiêu vô tình ưu tiên một nhóm.</li>
          <li><strong>Thiên kiến đánh giá:</strong> Chỉ số đánh giá không phản ánh công bằng giữa các nhóm.</li>
        </ol>
        <p>
          Giải pháp bao gồm <strong>cân bằng dữ liệu</strong>, <strong>kiểm toán công bằng</strong>
          (fairness audit), <strong>ràng buộc công bằng</strong> trong quá trình huấn luyện,
          và <strong>đánh giá tác động</strong> trước khi triển khai.
        </p>
      </ExplanationSection>
    </>
  );
}
