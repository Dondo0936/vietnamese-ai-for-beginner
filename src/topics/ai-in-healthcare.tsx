"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "ai-in-healthcare",
  title: "AI in Healthcare",
  titleVi: "AI trong Y tế",
  description:
    "Ứng dụng AI trong chẩn đoán hình ảnh y khoa, phát triển thuốc và dự đoán bệnh",
  category: "applied-ai",
  tags: ["medical", "diagnosis", "drug-discovery"],
  difficulty: "beginner",
  relatedSlugs: ["image-classification", "cnn", "ai-for-science"],
  vizType: "static",
};

export default function AIInHealthcareTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn có một <strong>bác sĩ đã nghiên cứu hàng triệu phim X-quang,
          CT scan và hồ sơ bệnh án</strong>. Vị bác sĩ này có thể phát hiện những dấu hiệu
          mà ngay cả bác sĩ giàu kinh nghiệm cũng có thể bỏ sót — ví dụ như một{" "}
          <strong>khối u nhỏ xíu</strong> trên phim chụp X-quang ngực mà mắt thường rất
          khó nhận ra.
        </p>
        <p>
          Giống như ở bệnh viện Bạch Mai hay Chợ Rẫy, nếu mỗi bác sĩ phải đọc hàng trăm
          phim mỗi ngày thì rất dễ mệt mỏi và sai sót. AI đóng vai trò như một{" "}
          <strong>&quot;trợ lý đọc phim&quot; không bao giờ mệt</strong>, luôn cảnh giác
          và giúp bác sĩ ra quyết định chính xác hơn.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <svg viewBox="0 0 600 360" className="w-full max-w-2xl mx-auto">
            <text x={300} y={22} textAnchor="middle" fill="#e2e8f0" fontSize={13} fontWeight="bold">
              3 Ứng dụng chính của AI trong Y tế
            </text>

            {/* Application 1: Medical Imaging */}
            <g>
              <rect x={20} y={45} width={170} height={90} rx={10} fill="#1e293b" stroke="#3b82f6" strokeWidth={2} />
              <text x={105} y={68} textAnchor="middle" fill="#3b82f6" fontSize={11} fontWeight="bold">
                Chẩn đoán hình ảnh
              </text>
              <text x={105} y={86} textAnchor="middle" fill="#94a3b8" fontSize={9}>
                X-quang, CT, MRI
              </text>
              <text x={105} y={100} textAnchor="middle" fill="#94a3b8" fontSize={9}>
                Siêu âm, Nội soi
              </text>
              <text x={105} y={118} textAnchor="middle" fill="#64748b" fontSize={8}>
                🏥 Phát hiện ung thư sớm
              </text>
            </g>

            {/* Arrow 1 */}
            <line x1={190} y1={90} x2={215} y2={90} stroke="#3b82f6" strokeWidth={2} markerEnd="url(#arrowBlue)" />

            {/* AI Processing - Medical Imaging */}
            <g>
              <rect x={215} y={55} width={100} height={70} rx={12} fill="#3b82f6" fillOpacity={0.15} stroke="#3b82f6" strokeWidth={1.5} />
              <text x={265} y={80} textAnchor="middle" fill="#3b82f6" fontSize={10} fontWeight="bold">
                AI phân tích
              </text>
              <text x={265} y={95} textAnchor="middle" fill="#3b82f6" fontSize={9}>
                CNN / Vision
              </text>
              <text x={265} y={108} textAnchor="middle" fill="#3b82f6" fontSize={9}>
                Transformer
              </text>
            </g>

            {/* Arrow 2 */}
            <line x1={315} y1={90} x2={340} y2={90} stroke="#3b82f6" strokeWidth={2} markerEnd="url(#arrowBlue)" />

            {/* Result - Medical Imaging */}
            <g>
              <rect x={340} y={55} width={240} height={70} rx={10} fill="#1e293b" stroke="#22c55e" strokeWidth={2} />
              <text x={460} y={78} textAnchor="middle" fill="#22c55e" fontSize={10} fontWeight="bold">
                Kết quả chẩn đoán
              </text>
              <text x={460} y={95} textAnchor="middle" fill="#94a3b8" fontSize={9}>
                Xác suất bệnh: 94.2%
              </text>
              <text x={460} y={110} textAnchor="middle" fill="#94a3b8" fontSize={9}>
                Vùng bất thường được đánh dấu trên ảnh
              </text>
            </g>

            {/* Application 2: Drug Discovery */}
            <g>
              <rect x={20} y={150} width={170} height={90} rx={10} fill="#1e293b" stroke="#f59e0b" strokeWidth={2} />
              <text x={105} y={173} textAnchor="middle" fill="#f59e0b" fontSize={11} fontWeight="bold">
                Phát triển thuốc
              </text>
              <text x={105} y={191} textAnchor="middle" fill="#94a3b8" fontSize={9}>
                Cấu trúc phân tử
              </text>
              <text x={105} y={205} textAnchor="middle" fill="#94a3b8" fontSize={9}>
                Dữ liệu thử nghiệm
              </text>
              <text x={105} y={223} textAnchor="middle" fill="#64748b" fontSize={8}>
                💊 Hàng triệu hợp chất
              </text>
            </g>

            {/* Arrow */}
            <line x1={190} y1={195} x2={215} y2={195} stroke="#f59e0b" strokeWidth={2} markerEnd="url(#arrowAmber)" />

            {/* AI Processing - Drug Discovery */}
            <g>
              <rect x={215} y={160} width={100} height={70} rx={12} fill="#f59e0b" fillOpacity={0.15} stroke="#f59e0b" strokeWidth={1.5} />
              <text x={265} y={185} textAnchor="middle" fill="#f59e0b" fontSize={10} fontWeight="bold">
                AI sàng lọc
              </text>
              <text x={265} y={200} textAnchor="middle" fill="#f59e0b" fontSize={9}>
                Mô phỏng
              </text>
              <text x={265} y={213} textAnchor="middle" fill="#f59e0b" fontSize={9}>
                phân tử ảo
              </text>
            </g>

            {/* Arrow */}
            <line x1={315} y1={195} x2={340} y2={195} stroke="#f59e0b" strokeWidth={2} markerEnd="url(#arrowAmber)" />

            {/* Result - Drug Discovery */}
            <g>
              <rect x={340} y={160} width={240} height={70} rx={10} fill="#1e293b" stroke="#22c55e" strokeWidth={2} />
              <text x={460} y={183} textAnchor="middle" fill="#22c55e" fontSize={10} fontWeight="bold">
                Ứng viên thuốc tiềm năng
              </text>
              <text x={460} y={200} textAnchor="middle" fill="#94a3b8" fontSize={9}>
                Giảm thời gian từ 10 năm → 2–3 năm
              </text>
              <text x={460} y={215} textAnchor="middle" fill="#94a3b8" fontSize={9}>
                Tiết kiệm hàng tỷ đô-la chi phí
              </text>
            </g>

            {/* Application 3: Patient Monitoring */}
            <g>
              <rect x={20} y={255} width={170} height={90} rx={10} fill="#1e293b" stroke="#8b5cf6" strokeWidth={2} />
              <text x={105} y={278} textAnchor="middle" fill="#8b5cf6" fontSize={11} fontWeight="bold">
                Theo dõi bệnh nhân
              </text>
              <text x={105} y={296} textAnchor="middle" fill="#94a3b8" fontSize={9}>
                Nhịp tim, huyết áp, SpO2
              </text>
              <text x={105} y={310} textAnchor="middle" fill="#94a3b8" fontSize={9}>
                Hồ sơ bệnh án điện tử
              </text>
              <text x={105} y={328} textAnchor="middle" fill="#64748b" fontSize={8}>
                📊 Dữ liệu liên tục 24/7
              </text>
            </g>

            {/* Arrow */}
            <line x1={190} y1={300} x2={215} y2={300} stroke="#8b5cf6" strokeWidth={2} markerEnd="url(#arrowPurple)" />

            {/* AI Processing - Patient Monitoring */}
            <g>
              <rect x={215} y={265} width={100} height={70} rx={12} fill="#8b5cf6" fillOpacity={0.15} stroke="#8b5cf6" strokeWidth={1.5} />
              <text x={265} y={290} textAnchor="middle" fill="#8b5cf6" fontSize={10} fontWeight="bold">
                AI giám sát
              </text>
              <text x={265} y={305} textAnchor="middle" fill="#8b5cf6" fontSize={9}>
                Phát hiện
              </text>
              <text x={265} y={318} textAnchor="middle" fill="#8b5cf6" fontSize={9}>
                bất thường
              </text>
            </g>

            {/* Arrow */}
            <line x1={315} y1={300} x2={340} y2={300} stroke="#8b5cf6" strokeWidth={2} markerEnd="url(#arrowPurple)" />

            {/* Result - Patient Monitoring */}
            <g>
              <rect x={340} y={265} width={240} height={70} rx={10} fill="#1e293b" stroke="#22c55e" strokeWidth={2} />
              <text x={460} y={288} textAnchor="middle" fill="#22c55e" fontSize={10} fontWeight="bold">
                Cảnh báo sớm
              </text>
              <text x={460} y={305} textAnchor="middle" fill="#94a3b8" fontSize={9}>
                Dự đoán biến chứng trước 6–12 giờ
              </text>
              <text x={460} y={320} textAnchor="middle" fill="#94a3b8" fontSize={9}>
                Thông báo bác sĩ kịp thời can thiệp
              </text>
            </g>

            {/* Arrow markers */}
            <defs>
              <marker id="arrowBlue" markerWidth={8} markerHeight={6} refX={8} refY={3} orient="auto">
                <path d="M0,0 L8,3 L0,6" fill="#3b82f6" />
              </marker>
              <marker id="arrowAmber" markerWidth={8} markerHeight={6} refX={8} refY={3} orient="auto">
                <path d="M0,0 L8,3 L0,6" fill="#f59e0b" />
              </marker>
              <marker id="arrowPurple" markerWidth={8} markerHeight={6} refX={8} refY={3} orient="auto">
                <path d="M0,0 L8,3 L0,6" fill="#8b5cf6" />
              </marker>
            </defs>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>AI trong Y tế (AI in Healthcare)</strong> là một trong những lĩnh vực ứng
          dụng AI có tác động lớn nhất đến cuộc sống con người. AI giúp bác sĩ chẩn đoán
          chính xác hơn, phát triển thuốc nhanh hơn và chăm sóc bệnh nhân tốt hơn.
        </p>
        <p>Ba lĩnh vực ứng dụng chính:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Chẩn đoán hình ảnh y khoa:</strong> AI sử dụng mạng CNN và Vision
            Transformer để phân tích X-quang, CT, MRI. Ví dụ, AI có thể phát hiện ung thư
            phổi giai đoạn sớm trên phim chụp với độ chính xác tương đương hoặc cao hơn
            bác sĩ chuyên khoa. Tại Việt Nam, các bệnh viện lớn đang bắt đầu ứng dụng
            AI đọc phim để giảm tải cho bác sĩ.
          </li>
          <li>
            <strong>Phát triển thuốc (Drug Discovery):</strong> AI mô phỏng tương tác
            phân tử ảo, sàng lọc hàng triệu hợp chất trong vài giờ thay vì vài năm.
            Trong đại dịch COVID-19, AI đã giúp tăng tốc quá trình phát triển vaccine
            và thuốc điều trị đáng kể.
          </li>
          <li>
            <strong>Theo dõi bệnh nhân & Hồ sơ y tế điện tử:</strong> AI phân tích dữ
            liệu sinh hiệu liên tục, dự đoán biến chứng trước khi xảy ra, giúp bác sĩ
            can thiệp kịp thời. AI cũng hỗ trợ khai thác hồ sơ bệnh án điện tử để phát
            hiện xu hướng dịch bệnh.
          </li>
        </ol>
        <p>Những thách thức cần giải quyết:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>
            <strong>Bảo mật dữ liệu:</strong> Dữ liệu y tế rất nhạy cảm — cần tuân thủ
            quy định bảo mật nghiêm ngặt (HIPAA, GDPR).
          </li>
          <li>
            <strong>Phê duyệt pháp lý:</strong> AI y tế phải qua quy trình kiểm định
            nghiêm ngặt trước khi được sử dụng trên bệnh nhân thật (FDA, Bộ Y tế).
          </li>
          <li>
            <strong>Thiên lệch dữ liệu:</strong> Nếu dữ liệu huấn luyện chủ yếu từ
            bệnh nhân phương Tây, AI có thể hoạt động kém chính xác trên bệnh nhân
            Việt Nam và châu Á — đây là vấn đề cần đặc biệt quan tâm.
          </li>
        </ul>
      </ExplanationSection>
    </>
  );
}
