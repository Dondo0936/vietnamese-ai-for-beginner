"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "containerization",
  title: "Containerization",
  titleVi: "Container hoá — Đóng gói AI gọn gàng",
  description:
    "Kỹ thuật đóng gói mô hình AI cùng mọi phụ thuộc vào container, đảm bảo chạy nhất quán trên mọi môi trường.",
  category: "infrastructure",
  tags: ["docker", "kubernetes", "container", "deployment"],
  difficulty: "intermediate",
  relatedSlugs: ["model-serving", "mlops", "gpu-optimization"],
  vizType: "static",
};

export default function ContainerizationTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn muốn gửi một bể cá cho bạn ở thành phố khác.
          Bạn không chỉ gửi con cá — mà phải gửi kèm <strong>nước</strong>,
          <strong> máy sục khí</strong>, <strong>thức ăn</strong>, và <strong>nhiệt kế</strong>.
          Tất cả đóng trong một <strong>hộp kín</strong> để cá sống khoẻ bất kể
          đi đến đâu.
        </p>
        <p>
          <strong>Container</strong> làm điều tương tự cho mô hình AI — đóng gói mô hình
          cùng tất cả thư viện, cấu hình, driver vào một &quot;hộp&quot; tiêu chuẩn.
          Chạy trên laptop hay trên đám mây đều giống hệt nhau!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <svg viewBox="0 0 600 280" className="w-full max-w-2xl mx-auto">
            {/* Container 1 */}
            <rect x={30} y={20} width={250} height={120} rx={10} fill="#1e293b" stroke="#3b82f6" strokeWidth={2} />
            <text x={155} y={45} textAnchor="middle" fill="#3b82f6" fontSize={11} fontWeight="bold">Container A</text>
            {["Mô hình AI", "Python 3.11", "PyTorch 2.x", "CUDA Drivers"].map((item, i) => (
              <g key={i}>
                <rect x={50} y={55 + i * 20} width={210} height={16} rx={3} fill="#3b82f6" opacity={0.2} />
                <text x={155} y={67 + i * 20} textAnchor="middle" fill="#94a3b8" fontSize={9}>{item}</text>
              </g>
            ))}

            {/* Container 2 */}
            <rect x={320} y={20} width={250} height={120} rx={10} fill="#1e293b" stroke="#22c55e" strokeWidth={2} />
            <text x={445} y={45} textAnchor="middle" fill="#22c55e" fontSize={11} fontWeight="bold">Container B</text>
            {["API Server", "FastAPI", "Tokenizer", "Monitoring"].map((item, i) => (
              <g key={i}>
                <rect x={340} y={55 + i * 20} width={210} height={16} rx={3} fill="#22c55e" opacity={0.2} />
                <text x={445} y={67 + i * 20} textAnchor="middle" fill="#94a3b8" fontSize={9}>{item}</text>
              </g>
            ))}

            {/* Host OS */}
            <rect x={30} y={160} width={540} height={40} rx={8} fill="#f59e0b" opacity={0.3} />
            <text x={300} y={185} textAnchor="middle" fill="#f59e0b" fontSize={11} fontWeight="bold">Container Runtime (Docker)</text>

            {/* Hardware */}
            <rect x={30} y={215} width={540} height={35} rx={8} fill="#475569" opacity={0.3} />
            <text x={300} y={237} textAnchor="middle" fill="#94a3b8" fontSize={11}>Hệ điều hành + Phần cứng (GPU)</text>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Container hoá</strong> là kỹ thuật đóng gói mô hình AI cùng toàn bộ
          phụ thuộc (thư viện, framework, driver) vào một đơn vị tiêu chuẩn gọi là container.
        </p>
        <p>Lợi ích chính:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Nhất quán:</strong> Chạy giống nhau trên mọi máy — &quot;Works on my machine&quot; không còn là vấn đề.</li>
          <li><strong>Cô lập:</strong> Mỗi mô hình chạy trong môi trường riêng, không xung đột với nhau.</li>
          <li><strong>Mở rộng:</strong> Dễ dàng tạo nhiều bản sao khi tải tăng (Kubernetes).</li>
          <li><strong>Tái sản xuất:</strong> Đảm bảo kết quả thí nghiệm có thể lặp lại.</li>
        </ol>
        <p>
          Công cụ cốt lõi: <strong>Docker</strong> để đóng gói, <strong>Kubernetes</strong>
          để điều phối, và <strong>NVIDIA Container Toolkit</strong> để hỗ trợ GPU.
          Container giúp chuyển mô hình từ phòng lab sang sản phẩm nhanh và ổn định.
        </p>
      </ExplanationSection>
    </>
  );
}
