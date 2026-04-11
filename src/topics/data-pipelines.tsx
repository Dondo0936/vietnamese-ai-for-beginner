"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "data-pipelines",
  title: "Data Pipelines",
  titleVi: "Đường ống dữ liệu",
  description:
    "Thiết kế quy trình tự động thu thập, xử lý và chuẩn bị dữ liệu cho huấn luyện mô hình AI",
  category: "infrastructure",
  tags: ["etl", "automation", "data-flow"],
  difficulty: "intermediate",
  relatedSlugs: ["data-preprocessing", "mlops", "feature-engineering"],
  vizType: "static",
};

export default function DataPipelinesTopic() {
  const stages = [
    { label: "Thu thập", desc: "API, DB, File", color: "#3b82f6", icon: "📥" },
    { label: "Xác thực", desc: "Schema, Quality", color: "#8b5cf6", icon: "✓" },
    { label: "Biến đổi", desc: "Clean, Transform", color: "#f59e0b", icon: "⚙" },
    { label: "Lưu trữ", desc: "Data Lake/Warehouse", color: "#22c55e", icon: "💾" },
    { label: "Phục vụ", desc: "Feature Store, API", color: "#14b8a6", icon: "🚀" },
  ];

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng một <strong>nhà máy chế biến thực phẩm</strong>.
          Nguyên liệu thô (rau, thịt, gia vị) được đưa vào từ nhiều nguồn,
          qua các công đoạn rửa, cắt, nấu, đóng gói — cuối cùng ra sản phẩm sẵn sàng bán.
        </p>
        <p>
          Data Pipeline cũng vậy: dữ liệu thô từ nhiều nguồn (database, API, file)
          được <strong>tự động</strong> thu thập, làm sạch, biến đổi, và chuẩn bị
          thành dạng sẵn sàng cho mô hình AI &quot;ăn&quot;.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <svg viewBox="0 0 600 280" className="w-full max-w-2xl mx-auto">
          <text x={300} y={20} textAnchor="middle" fontSize={14} fill="#0f172a" fontWeight="bold">
            Các giai đoạn của Data Pipeline
          </text>

          {/* Pipeline stages */}
          {stages.map((stage, i) => {
            const x = 20 + i * 116;
            return (
              <g key={i}>
                <rect x={x} y={40} width={105} height={80} fill={stage.color} rx={10} opacity={0.15} />
                <rect x={x} y={40} width={105} height={30} fill={stage.color} rx={10} />
                <rect x={x} y={55} width={105} height={15} fill={stage.color} />
                <text x={x + 52} y={60} textAnchor="middle" fontSize={12} fill="white" fontWeight="bold">
                  {stage.label}
                </text>
                <text x={x + 52} y={90} textAnchor="middle" fontSize={10} fill={stage.color}>
                  {stage.desc}
                </text>
                {/* Arrow between stages */}
                {i < stages.length - 1 && (
                  <polygon
                    points={`${x + 110},75 ${x + 130},75 ${x + 130},70 ${x + 138},80 ${x + 130},90 ${x + 130},85 ${x + 110},85`}
                    fill="#94a3b8"
                    opacity={0.5}
                  />
                )}
              </g>
            );
          })}

          {/* Data sources */}
          <text x={60} y={155} textAnchor="middle" fontSize={11} fill="#64748b" fontWeight="bold">Nguồn dữ liệu</text>
          {["Database", "API", "CSV/JSON", "Streaming"].map((src, i) => (
            <g key={i}>
              <rect x={10 + i * 70} y={165} width={65} height={25} fill="#dbeafe" rx={4} stroke="#93c5fd" />
              <text x={42 + i * 70} y={182} textAnchor="middle" fontSize={9} fill="#1e40af">{src}</text>
            </g>
          ))}

          {/* Orchestration */}
          <rect x={10} y={210} width={580} height={55} fill="#f0fdf4" rx={8} stroke="#86efac" />
          <text x={300} y={232} textAnchor="middle" fontSize={12} fill="#166534" fontWeight="bold">
            Điều phối (Orchestration)
          </text>
          {["Apache Airflow", "Prefect", "Dagster", "dbt", "Spark"].map((tool, i) => (
            <g key={i}>
              <rect x={30 + i * 112} y={240} width={100} height={20} fill="#22c55e" rx={4} opacity={0.2} />
              <text x={80 + i * 112} y={254} textAnchor="middle" fontSize={9} fill="#166534">{tool}</text>
            </g>
          ))}
        </svg>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Data Pipeline</strong> là quy trình tự động hoá việc di chuyển và biến đổi
          dữ liệu từ nguồn đến đích — thành phần không thể thiếu trong bất kỳ hệ thống AI/ML
          nào hoạt động trong sản xuất.
        </p>
        <p>Các thành phần chính:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Thu thập (Ingestion):</strong> Lấy dữ liệu từ nhiều nguồn — database, REST API, file CSV/JSON, hoặc streaming real-time (Kafka, Pub/Sub).</li>
          <li><strong>Xác thực (Validation):</strong> Kiểm tra schema, phát hiện dữ liệu bất thường, đảm bảo chất lượng bằng Great Expectations hoặc Pandera.</li>
          <li><strong>Biến đổi (Transformation):</strong> Làm sạch, chuẩn hoá, trích xuất đặc trưng. Đây là bước ETL (Extract-Transform-Load) hoặc ELT.</li>
          <li><strong>Lưu trữ (Storage):</strong> Đưa vào Data Lake (file thô), Data Warehouse (dữ liệu có cấu trúc), hoặc Feature Store cho ML.</li>
          <li><strong>Phục vụ (Serving):</strong> Cung cấp dữ liệu cho huấn luyện mô hình hoặc suy luận real-time qua API.</li>
        </ol>
        <p>Các công cụ phổ biến:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li><strong>Orchestration:</strong> Apache Airflow, Prefect, Dagster — lên lịch và quản lý thứ tự các bước.</li>
          <li><strong>Xử lý phân tán:</strong> Apache Spark, Dask — xử lý dữ liệu lớn song song.</li>
          <li><strong>dbt:</strong> Biến đổi dữ liệu trong warehouse bằng SQL, có version control và testing.</li>
        </ul>
      </ExplanationSection>
    </>
  );
}
