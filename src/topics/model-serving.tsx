"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "model-serving",
  title: "Model Serving",
  titleVi: "Phục vụ mô hình — Đưa AI vào thực tế",
  description:
    "Quy trình triển khai và cung cấp mô hình AI dưới dạng dịch vụ, xử lý yêu cầu từ người dùng trong thời gian thực.",
  category: "infrastructure",
  tags: ["serving", "deployment", "api", "inference"],
  difficulty: "intermediate",
  relatedSlugs: ["inference-optimization", "containerization", "mlops"],
  vizType: "static",
};

export default function ModelServingTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn là một đầu bếp giỏi (<strong>mô hình AI đã huấn luyện</strong>).
          Nhưng nấu ngon thôi chưa đủ — bạn cần mở <strong>nhà hàng</strong>
          (hệ thống phục vụ) để khách hàng có thể gọi món.
        </p>
        <p>
          Nhà hàng cần: <strong>quầy gọi món</strong> (API endpoint), <strong>bếp đủ rộng</strong>
          (GPU/CPU), <strong>hệ thống xếp hàng</strong> (request queue) khi đông khách,
          và <strong>tốc độ phục vụ nhanh</strong> (low latency). Model Serving giải quyết
          tất cả những thách thức này!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <svg viewBox="0 0 600 250" className="w-full max-w-2xl mx-auto">
            {/* Client requests */}
            {["Ứng dụng web", "Ứng dụng mobile", "API bên thứ ba"].map((client, i) => (
              <g key={i}>
                <rect x={20} y={30 + i * 70} width={120} height={40} rx={8} fill="#3b82f6" />
                <text x={80} y={55 + i * 70} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">{client}</text>
                <line x1={140} y1={50 + i * 70} x2={210} y2={125} stroke="#475569" strokeWidth={1.5} />
              </g>
            ))}

            {/* Load Balancer */}
            <rect x={210} y={95} width={100} height={60} rx={10} fill="#f59e0b" />
            <text x={260} y={120} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">Cân bằng tải</text>
            <text x={260} y={140} textAnchor="middle" fill="white" fontSize={8}>(Load Balancer)</text>

            {/* Model replicas */}
            {["Bản sao 1", "Bản sao 2", "Bản sao 3"].map((replica, i) => (
              <g key={i}>
                <line x1={310} y1={125} x2={400} y2={55 + i * 70} stroke="#475569" strokeWidth={1.5} />
                <rect x={400} y={30 + i * 70} width={110} height={45} rx={8} fill="#22c55e" />
                <text x={455} y={48 + i * 70} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">{replica}</text>
                <text x={455} y={63 + i * 70} textAnchor="middle" fill="white" fontSize={8}>GPU</text>
              </g>
            ))}

            {/* Label */}
            <text x={300} y={240} textAnchor="middle" fill="#94a3b8" fontSize={10}>
              Nhiều bản sao mô hình phục vụ song song → Tăng thông lượng
            </text>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Model Serving</strong> là quá trình triển khai mô hình AI đã huấn luyện
          thành dịch vụ có thể nhận yêu cầu và trả về kết quả dự đoán trong thời gian thực.
        </p>
        <p>Các thành phần chính:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>API Endpoint:</strong> Giao diện HTTP/gRPC để ứng dụng gửi yêu cầu dự đoán.</li>
          <li><strong>Inference Engine:</strong> Thực thi mô hình trên GPU/CPU — TensorRT, vLLM, TGI.</li>
          <li><strong>Cân bằng tải:</strong> Phân phối yêu cầu giữa nhiều bản sao mô hình.</li>
          <li><strong>Hàng đợi yêu cầu:</strong> Xử lý khi lượng truy cập vượt quá khả năng phục vụ.</li>
        </ol>
        <p>
          Các nền tảng phục vụ phổ biến: <strong>vLLM</strong>, <strong>TGI</strong> (HuggingFace),
          <strong> Triton</strong> (NVIDIA), <strong>BentoML</strong>. Lựa chọn phụ thuộc vào
          yêu cầu về độ trễ, thông lượng và chi phí.
        </p>
      </ExplanationSection>
    </>
  );
}
