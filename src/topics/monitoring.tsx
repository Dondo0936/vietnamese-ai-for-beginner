"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "monitoring",
  title: "AI Monitoring",
  titleVi: "Giám sát AI — Canh gác mô hình 24/7",
  description:
    "Theo dõi hiệu suất, phát hiện data drift và cảnh báo khi mô hình AI trong sản phẩm bắt đầu suy giảm chất lượng.",
  category: "infrastructure",
  tags: ["monitoring", "drift", "observability", "production"],
  difficulty: "intermediate",
  relatedSlugs: ["mlops", "model-serving", "cost-optimization"],
  vizType: "interactive",
};

const METRICS = [
  { name: "Độ chính xác", values: [95, 94, 93, 91, 88, 85, 80, 76], unit: "%" },
  { name: "Độ trễ", values: [120, 125, 130, 145, 160, 200, 250, 310], unit: "ms" },
];

export default function MonitoringTopic() {
  const [selectedMetric, setSelectedMetric] = useState(0);
  const metric = METRICS[selectedMetric];
  const maxVal = Math.max(...metric.values);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn có một chiếc xe mới. Ban đầu xe chạy rất tốt, nhưng theo
          thời gian — lốp mòn, dầu cũ, phanh yếu — <strong>hiệu suất giảm dần</strong>
          nếu không bảo dưỡng định kỳ.
        </p>
        <p>
          Mô hình AI cũng <strong>&quot;hao mòn&quot;</strong> theo thời gian! Dữ liệu thực tế
          thay đổi (data drift), người dùng hỏi những thứ mới, mùa vụ thay đổi...
          <strong> Giám sát AI</strong> giống như đồng hồ trên bảng điều khiển xe —
          cảnh báo khi cần &quot;bảo dưỡng&quot; (huấn luyện lại).
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <div className="flex gap-3">
            {METRICS.map((m, i) => (
              <button
                key={i}
                onClick={() => setSelectedMetric(i)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  selectedMetric === i
                    ? "bg-accent text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
          <svg viewBox="0 0 600 220" className="w-full max-w-2xl mx-auto">
            <text x={300} y={20} textAnchor="middle" fill="#e2e8f0" fontSize={12} fontWeight="bold">
              {metric.name} theo thời gian
            </text>
            {/* Y-axis */}
            <line x1={60} y1={35} x2={60} y2={180} stroke="#475569" strokeWidth={1} />
            {/* X-axis */}
            <line x1={60} y1={180} x2={560} y2={180} stroke="#475569" strokeWidth={1} />

            {/* Data points and line */}
            {metric.values.map((v, i) => {
              const x = 80 + i * 65;
              const y = 170 - (v / maxVal) * 130;
              const isWarning = selectedMetric === 0 ? v < 90 : v > 200;
              return (
                <g key={i}>
                  {i > 0 && (
                    <line
                      x1={80 + (i - 1) * 65}
                      y1={170 - (metric.values[i - 1] / maxVal) * 130}
                      x2={x}
                      y2={y}
                      stroke={isWarning ? "#ef4444" : "#3b82f6"}
                      strokeWidth={2}
                    />
                  )}
                  <circle cx={x} cy={y} r={4} fill={isWarning ? "#ef4444" : "#3b82f6"} />
                  <text x={x} y={y - 10} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                    {v}{metric.unit}
                  </text>
                  <text x={x} y={198} textAnchor="middle" fill="#64748b" fontSize={8}>
                    T{i + 1}
                  </text>
                </g>
              );
            })}

            {/* Warning threshold */}
            <line x1={60} y1={selectedMetric === 0 ? 112 : 100} x2={560} y2={selectedMetric === 0 ? 112 : 100} stroke="#ef4444" strokeWidth={1} strokeDasharray="5,3" />
            <text x={565} y={selectedMetric === 0 ? 116 : 104} fill="#ef4444" fontSize={8}>Ngưỡng cảnh báo</text>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Giám sát AI (AI Monitoring)</strong> là quá trình liên tục theo dõi
          mô hình đã triển khai để phát hiện sớm các vấn đề về hiệu suất, chất lượng
          và hành vi bất thường.
        </p>
        <p>Các yếu tố cần giám sát:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Data Drift:</strong> Phân phối dữ liệu đầu vào thay đổi so với dữ liệu huấn luyện.</li>
          <li><strong>Model Drift:</strong> Hiệu suất mô hình giảm dần theo thời gian.</li>
          <li><strong>Chỉ số kỹ thuật:</strong> Độ trễ, thông lượng, tỷ lệ lỗi, sử dụng GPU.</li>
          <li><strong>Chỉ số kinh doanh:</strong> Tỷ lệ chuyển đổi, sự hài lòng người dùng.</li>
        </ol>
        <p>
          Khi phát hiện vấn đề, hệ thống tự động <strong>cảnh báo</strong> và có thể
          <strong> kích hoạt huấn luyện lại</strong>. Công cụ phổ biến: <strong>Evidently</strong>,
          <strong> Whylabs</strong>, <strong>Arize</strong>.
        </p>
      </ExplanationSection>
    </>
  );
}
