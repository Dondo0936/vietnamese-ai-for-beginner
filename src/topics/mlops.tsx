"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "mlops",
  title: "MLOps",
  titleVi: "MLOps — DevOps cho máy học",
  description:
    "Tập hợp thực hành và công cụ để tự động hoá vòng đời phát triển, triển khai và giám sát mô hình máy học.",
  category: "infrastructure",
  tags: ["mlops", "pipeline", "automation", "ci-cd"],
  difficulty: "intermediate",
  relatedSlugs: ["model-serving", "monitoring", "containerization"],
  vizType: "interactive",
};

const STAGES = [
  { label: "Dữ liệu", desc: "Thu thập, làm sạch, quản lý phiên bản dữ liệu", color: "#3b82f6" },
  { label: "Huấn luyện", desc: "Thử nghiệm, huấn luyện và đánh giá mô hình", color: "#8b5cf6" },
  { label: "Đánh giá", desc: "Kiểm tra chất lượng trước khi triển khai", color: "#f59e0b" },
  { label: "Triển khai", desc: "Đưa mô hình lên môi trường sản phẩm", color: "#22c55e" },
  { label: "Giám sát", desc: "Theo dõi hiệu suất và phát hiện drift", color: "#ef4444" },
];

export default function MLOpsTopic() {
  const [activeStage, setActiveStage] = useState(0);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng <strong>dây chuyền sản xuất ô tô</strong>. Không chỉ thiết kế xe
          là xong — bạn cần quy trình <strong>tự động hoá</strong> toàn bộ: nhập linh kiện,
          lắp ráp, kiểm tra chất lượng, giao hàng, và bảo hành sau bán.
        </p>
        <p>
          <strong>MLOps</strong> cũng vậy — không chỉ huấn luyện mô hình mà còn tự động hoá
          toàn bộ quy trình: quản lý dữ liệu, huấn luyện, đánh giá, triển khai, giám sát,
          và cập nhật liên tục. Giống DevOps nhưng dành riêng cho máy học.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <svg viewBox="0 0 700 160" className="w-full max-w-3xl mx-auto">
            {STAGES.map((s, i) => {
              const x = 70 + i * 140;
              const active = i === activeStage;
              return (
                <g key={i} onClick={() => setActiveStage(i)} className="cursor-pointer">
                  <rect
                    x={x - 55}
                    y={30}
                    width={110}
                    height={50}
                    rx={10}
                    fill={active ? s.color : "#1e293b"}
                    stroke={s.color}
                    strokeWidth={active ? 3 : 1.5}
                  />
                  <text x={x} y={55} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">{s.label}</text>
                  <text x={x} y={70} textAnchor="middle" fill="#cbd5e1" fontSize={7}>Bước {i + 1}</text>
                  {i < STAGES.length - 1 && (
                    <line x1={x + 55} y1={55} x2={x + 85} y2={55} stroke="#475569" strokeWidth={2} />
                  )}
                </g>
              );
            })}
            {/* Loop back arrow */}
            <path d="M 630 80 C 650 140, 50 140, 15 80" fill="none" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5,3" />
            <text x={350} y={140} textAnchor="middle" fill="#94a3b8" fontSize={9}>Vòng lặp liên tục — CI/CD cho ML</text>
          </svg>
          <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
            <p className="text-sm text-muted"><strong>{STAGES[activeStage].label}:</strong> {STAGES[activeStage].desc}</p>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>MLOps</strong> (Machine Learning Operations) là tập hợp thực hành, công cụ
          và quy trình tự động hoá vòng đời phát triển mô hình máy học — từ dữ liệu đến
          triển khai và giám sát.
        </p>
        <p>Vòng đời MLOps gồm 5 giai đoạn:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Dữ liệu:</strong> Thu thập, làm sạch, quản lý phiên bản (DVC, Delta Lake).</li>
          <li><strong>Huấn luyện:</strong> Thử nghiệm, theo dõi chỉ số (MLflow, W&B), tối ưu siêu tham số.</li>
          <li><strong>Đánh giá:</strong> Kiểm tra chất lượng, công bằng, và an toàn trước triển khai.</li>
          <li><strong>Triển khai:</strong> Đóng gói, containerize, đưa lên production (CI/CD).</li>
          <li><strong>Giám sát:</strong> Theo dõi hiệu suất, phát hiện data drift, và tự động huấn luyện lại.</li>
        </ol>
        <p>
          MLOps giải quyết &quot;khoảng cách sản phẩm hoá&quot; — biến mô hình từ
          notebook thí nghiệm thành dịch vụ ổn định, có thể bảo trì.
        </p>
      </ExplanationSection>
    </>
  );
}
