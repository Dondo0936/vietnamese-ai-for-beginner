"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "edge-ai",
  title: "Edge AI",
  titleVi: "AI biên — AI ngay trên thiết bị",
  description:
    "Triển khai mô hình AI trực tiếp trên thiết bị đầu cuối (điện thoại, IoT, camera) thay vì trên đám mây.",
  category: "infrastructure",
  tags: ["edge", "on-device", "mobile", "iot"],
  difficulty: "intermediate",
  relatedSlugs: ["inference-optimization", "small-language-models", "model-serving"],
  vizType: "static",
};

export default function EdgeAITopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng sự khác biệt giữa <strong>đặt hàng giao từ nhà hàng</strong> (Cloud AI)
          và <strong>tự nấu ở nhà</strong> (Edge AI).
        </p>
        <p>
          Đặt từ nhà hàng: đồ ăn ngon nhưng phải đợi giao, cần internet, và ai đó biết bạn ăn gì.
          Tự nấu: có ngay lập tức, không cần mạng, bí mật gia đình được giữ kín — nhưng
          bếp nhà nhỏ hơn bếp nhà hàng.
        </p>
        <p>
          <strong>Edge AI</strong> giống nấu ở nhà — mọi xử lý AI diễn ra ngay trên thiết bị
          của bạn, nhanh hơn, riêng tư hơn, nhưng với tài nguyên hạn chế hơn.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <svg viewBox="0 0 600 260" className="w-full max-w-2xl mx-auto">
            {/* Cloud AI */}
            <text x={150} y={20} textAnchor="middle" fill="#94a3b8" fontSize={11} fontWeight="bold">Cloud AI</text>
            <rect x={50} y={30} width={200} height={90} rx={10} fill="#1e293b" stroke="#3b82f6" strokeWidth={2} />
            <text x={150} y={55} textAnchor="middle" fill="#3b82f6" fontSize={10}>Máy chủ mạnh</text>
            <text x={150} y={72} textAnchor="middle" fill="#94a3b8" fontSize={8}>GPU lớn, mô hình đầy đủ</text>
            <text x={150} y={87} textAnchor="middle" fill="#94a3b8" fontSize={8}>Cần internet, độ trễ cao</text>
            <text x={150} y={102} textAnchor="middle" fill="#94a3b8" fontSize={8}>Dữ liệu gửi lên mây</text>

            {/* VS */}
            <text x={300} y={80} textAnchor="middle" fill="#f59e0b" fontSize={14} fontWeight="bold">VS</text>

            {/* Edge AI */}
            <text x={450} y={20} textAnchor="middle" fill="#94a3b8" fontSize={11} fontWeight="bold">Edge AI</text>
            <rect x={350} y={30} width={200} height={90} rx={10} fill="#1e293b" stroke="#22c55e" strokeWidth={2} />
            <text x={450} y={55} textAnchor="middle" fill="#22c55e" fontSize={10}>Thiết bị đầu cuối</text>
            <text x={450} y={72} textAnchor="middle" fill="#94a3b8" fontSize={8}>NPU/CPU nhỏ, mô hình tối ưu</text>
            <text x={450} y={87} textAnchor="middle" fill="#94a3b8" fontSize={8}>Không cần mạng, độ trễ thấp</text>
            <text x={450} y={102} textAnchor="middle" fill="#94a3b8" fontSize={8}>Dữ liệu ở trên thiết bị</text>

            {/* Devices */}
            {["Điện thoại", "Camera AI", "Xe tự lái", "IoT"].map((d, i) => {
              const x = 75 + i * 150;
              return (
                <g key={i}>
                  <rect x={x - 50} y={170} width={100} height={35} rx={6} fill="#22c55e" opacity={0.7} />
                  <text x={x} y={192} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">{d}</text>
                </g>
              );
            })}
            <text x={300} y={235} textAnchor="middle" fill="#94a3b8" fontSize={9}>
              Các thiết bị chạy Edge AI
            </text>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Edge AI</strong> là việc triển khai mô hình AI trực tiếp trên thiết bị
          đầu cuối — điện thoại, camera, cảm biến IoT — thay vì gửi dữ liệu lên
          máy chủ đám mây để xử lý.
        </p>
        <p>Ba ưu điểm chính:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Độ trễ cực thấp:</strong> Xử lý ngay tại chỗ, không cần đợi truyền dữ liệu qua mạng.</li>
          <li><strong>Bảo mật dữ liệu:</strong> Dữ liệu không rời khỏi thiết bị, bảo vệ quyền riêng tư.</li>
          <li><strong>Hoạt động ngoại tuyến:</strong> Vẫn hoạt động khi không có kết nối internet.</li>
        </ol>
        <p>
          Thách thức lớn nhất: tài nguyên tính toán hạn chế. Giải pháp gồm
          <strong> mô hình nhỏ</strong> (SLM), <strong>lượng tử hoá</strong>, và
          <strong> chip AI chuyên dụng</strong> (NPU) trên điện thoại hiện đại.
          Apple, Google, Qualcomm đều đang đầu tư mạnh vào Edge AI.
        </p>
      </ExplanationSection>
    </>
  );
}
