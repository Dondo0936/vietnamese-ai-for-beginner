"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "ai-in-agriculture",
  title: "AI in Agriculture",
  titleVi: "AI trong Nông nghiệp",
  description:
    "Ứng dụng AI trong phát hiện sâu bệnh, dự báo mùa vụ và nông nghiệp chính xác tại Việt Nam",
  category: "applied-ai",
  tags: ["crop", "pest-detection", "precision-farming"],
  difficulty: "beginner",
  relatedSlugs: ["image-classification", "object-detection", "edge-ai"],
  vizType: "static",
};

export default function AIInAgricultureTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng người nông dân Việt Nam có{" "}
          <strong>một đội chuyên gia nông nghiệp theo dõi từng cây lúa 24/7</strong>.
          Đội chuyên gia này có thể phát hiện bệnh đạo ôn trên ruộng lúa từ rất sớm,
          dự đoán chính xác thời điểm thu hoạch tối ưu, và cho biết{" "}
          <strong>chính xác bao nhiêu nước, bao nhiêu phân bón</strong> cần cho từng
          khu vực ruộng.
        </p>
        <p>
          <em>
            &quot;Như có một đội chuyên gia nông nghiệp theo dõi từng cây lúa.&quot;
          </em>{" "}
          Trước đây, nông dân phải dựa vào kinh nghiệm và mắt thường. Giờ đây, AI kết
          hợp với drone và vệ tinh có thể quét <strong>hàng nghìn hecta</strong> trong
          vài phút, phát hiện vùng cây bị stress trước cả khi mắt thường nhận ra.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <svg viewBox="0 0 600 420" className="w-full max-w-2xl mx-auto">
            <text x={300} y={22} textAnchor="middle" fill="#e2e8f0" fontSize={13} fontWeight="bold">
              AI trong Nông nghiệp Việt Nam
            </text>

            {/* === Top section: Data Collection === */}
            <rect x={150} y={40} width={300} height={55} rx={12} fill="#1e293b" stroke="#22c55e" strokeWidth={2} />
            <text x={300} y={62} textAnchor="middle" fill="#22c55e" fontSize={11} fontWeight="bold">
              Thu thập dữ liệu
            </text>
            <text x={300} y={80} textAnchor="middle" fill="#94a3b8" fontSize={9}>
              Drone / Vệ tinh / Cảm biến IoT / Ảnh điện thoại
            </text>

            {/* Arrows from data collection to 4 applications */}
            <line x1={200} y1={95} x2={100} y2={125} stroke="#475569" strokeWidth={1.5} />
            <line x1={260} y1={95} x2={240} y2={125} stroke="#475569" strokeWidth={1.5} />
            <line x1={340} y1={95} x2={360} y2={125} stroke="#475569" strokeWidth={1.5} />
            <line x1={400} y1={95} x2={500} y2={125} stroke="#475569" strokeWidth={1.5} />

            {/* === App 1: Crop Health Analysis === */}
            <g>
              <rect x={20} y={125} width={160} height={120} rx={10} fill="#1e293b" stroke="#22c55e" strokeWidth={2} />
              <text x={100} y={148} textAnchor="middle" fill="#22c55e" fontSize={10} fontWeight="bold">
                Sức khoẻ cây trồng
              </text>
              {/* Simple plant icon using shapes */}
              <circle cx={100} cy={175} r={18} fill="#22c55e" fillOpacity={0.15} stroke="#22c55e" strokeWidth={1} />
              <text x={100} y={180} textAnchor="middle" fill="#22c55e" fontSize={16}>
                🌾
              </text>
              <text x={100} y={210} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                Phát hiện bệnh đạo ôn
              </text>
              <text x={100} y={222} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                bệnh bạc lá trên lúa
              </text>
              <text x={100} y={236} textAnchor="middle" fill="#64748b" fontSize={7}>
                NDVI analysis từ ảnh vệ tinh
              </text>
            </g>

            {/* === App 2: Pest Detection === */}
            <g>
              <rect x={190} y={125} width={130} height={120} rx={10} fill="#1e293b" stroke="#f59e0b" strokeWidth={2} />
              <text x={255} y={148} textAnchor="middle" fill="#f59e0b" fontSize={10} fontWeight="bold">
                Phát hiện sâu bệnh
              </text>
              <circle cx={255} cy={175} r={18} fill="#f59e0b" fillOpacity={0.15} stroke="#f59e0b" strokeWidth={1} />
              <text x={255} y={180} textAnchor="middle" fill="#f59e0b" fontSize={16}>
                🐛
              </text>
              <text x={255} y={210} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                Rầy nâu, sâu cuốn lá
              </text>
              <text x={255} y={222} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                trên lúa, cà phê, thanh long
              </text>
              <text x={255} y={236} textAnchor="middle" fill="#64748b" fontSize={7}>
                Object detection từ ảnh drone
              </text>
            </g>

            {/* === App 3: Precision Irrigation === */}
            <g>
              <rect x={330} y={125} width={130} height={120} rx={10} fill="#1e293b" stroke="#3b82f6" strokeWidth={2} />
              <text x={395} y={148} textAnchor="middle" fill="#3b82f6" fontSize={10} fontWeight="bold">
                Tưới tiêu chính xác
              </text>
              <circle cx={395} cy={175} r={18} fill="#3b82f6" fillOpacity={0.15} stroke="#3b82f6" strokeWidth={1} />
              <text x={395} y={180} textAnchor="middle" fill="#3b82f6" fontSize={16}>
                💧
              </text>
              <text x={395} y={210} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                Tối ưu lượng nước
              </text>
              <text x={395} y={222} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                cho từng khu vực ruộng
              </text>
              <text x={395} y={236} textAnchor="middle" fill="#64748b" fontSize={7}>
                Cảm biến độ ẩm + thời tiết
              </text>
            </g>

            {/* === App 4: Yield Prediction === */}
            <g>
              <rect x={470} y={125} width={115} height={120} rx={10} fill="#1e293b" stroke="#8b5cf6" strokeWidth={2} />
              <text x={527} y={148} textAnchor="middle" fill="#8b5cf6" fontSize={10} fontWeight="bold">
                Dự báo năng suất
              </text>
              <circle cx={527} cy={175} r={18} fill="#8b5cf6" fillOpacity={0.15} stroke="#8b5cf6" strokeWidth={1} />
              <text x={527} y={180} textAnchor="middle" fill="#8b5cf6" fontSize={16}>
                📊
              </text>
              <text x={527} y={210} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                Dự đoán sản lượng
              </text>
              <text x={527} y={222} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                thời điểm thu hoạch
              </text>
              <text x={527} y={236} textAnchor="middle" fill="#64748b" fontSize={7}>
                Time series + thời tiết
              </text>
            </g>

            {/* === Bottom: Vietnam Context === */}
            <rect x={40} y={265} width={520} height={70} rx={10} fill="#22c55e" fillOpacity={0.08} stroke="#22c55e" strokeWidth={1.5} strokeDasharray="6,3" />
            <text x={300} y={288} textAnchor="middle" fill="#22c55e" fontSize={11} fontWeight="bold">
              Bối cảnh Việt Nam — Đồng bằng sông Cửu Long
            </text>
            <text x={300} y={305} textAnchor="middle" fill="#94a3b8" fontSize={9}>
              🌾 Lúa gạo: 7 triệu hecta | ☕ Cà phê: xuất khẩu top 2 thế giới
            </text>
            <text x={300} y={320} textAnchor="middle" fill="#94a3b8" fontSize={9}>
              🐉 Thanh long: Bình Thuận | 🦐 Thuỷ sản: nuôi tôm thông minh
            </text>

            {/* Challenge section */}
            <rect x={40} y={350} width={520} height={55} rx={10} fill="#f59e0b" fillOpacity={0.08} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="6,3" />
            <text x={300} y={373} textAnchor="middle" fill="#f59e0b" fontSize={10} fontWeight="bold">
              Thách thức: Nông hộ nhỏ lẻ • Hạ tầng Internet hạn chế • Chi phí công nghệ
            </text>
            <text x={300} y={392} textAnchor="middle" fill="#94a3b8" fontSize={9}>
              Giải pháp: AI trên điện thoại (Edge AI) + Ứng dụng đơn giản cho nông dân
            </text>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>AI trong Nông nghiệp (AI in Agriculture)</strong> là việc ứng dụng trí
          tuệ nhân tạo để giúp nông dân canh tác hiệu quả hơn, giảm lãng phí và tăng
          năng suất. Đây là lĩnh vực đặc biệt quan trọng với Việt Nam — quốc gia có{" "}
          <strong>nông nghiệp chiếm tỷ trọng lớn</strong> trong nền kinh tế.
        </p>
        <p>Các ứng dụng chính:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Nông nghiệp chính xác (Precision Farming):</strong> Thay vì bón phân,
            tưới nước đồng đều cho cả cánh đồng, AI phân tích ảnh vệ tinh và cảm biến
            để xác định <strong>chính xác từng khu vực</strong> cần bao nhiêu nước, phân
            bón — giảm chi phí 20–30% và giảm ô nhiễm môi trường.
          </li>
          <li>
            <strong>Phát hiện sâu bệnh cây trồng:</strong> AI sử dụng Computer Vision để
            phát hiện bệnh trên lá, thân cây từ ảnh chụp điện thoại hoặc drone. Đặc biệt
            quan trọng cho cây lúa (bệnh đạo ôn, bạc lá), cà phê (bệnh gỉ sắt), và
            thanh long — các cây trồng chủ lực của Việt Nam.
          </li>
          <li>
            <strong>Dự báo năng suất (Yield Prediction):</strong> AI kết hợp dữ liệu thời
            tiết, ảnh vệ tinh, lịch sử mùa vụ để dự đoán sản lượng thu hoạch. Giúp nông
            dân và doanh nghiệp lên kế hoạch bán hàng, xuất khẩu tốt hơn.
          </li>
          <li>
            <strong>Giám sát bằng drone:</strong> Drone bay quét ruộng, chụp ảnh đa phổ
            (multispectral) giúp phát hiện vùng cây bị stress, thiếu dinh dưỡng, hoặc
            ngập úng — đặc biệt hữu ích ở vùng Đồng bằng sông Cửu Long.
          </li>
        </ol>
        <p>
          <strong>Ví dụ cụ thể — Đồng bằng sông Cửu Long:</strong> Vùng sản xuất lúa
          gạo lớn nhất Việt Nam đang đối mặt với xâm nhập mặn do biến đổi khí hậu. AI
          có thể dự báo mức độ nhiễm mặn, giúp nông dân chọn giống lúa phù hợp và
          điều chỉnh lịch gieo sạ tối ưu.
        </p>
        <p>Thách thức riêng của Việt Nam:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>
            <strong>Nông hộ nhỏ lẻ:</strong> Phần lớn nông dân Việt Nam canh tác trên
            diện tích nhỏ (dưới 1 hecta), khó đầu tư công nghệ đắt tiền. Cần giải pháp
            AI giá rẻ chạy trên điện thoại.
          </li>
          <li>
            <strong>Hạ tầng:</strong> Nhiều vùng nông thôn còn hạn chế Internet — cần
            Edge AI (chạy AI trên thiết bị, không cần kết nối mạng liên tục).
          </li>
          <li>
            <strong>Dữ liệu:</strong> Thiếu bộ dữ liệu cây trồng Việt Nam được gán nhãn
            chất lượng — cần sự hợp tác giữa viện nghiên cứu và nông dân.
          </li>
        </ul>
      </ExplanationSection>
    </>
  );
}
