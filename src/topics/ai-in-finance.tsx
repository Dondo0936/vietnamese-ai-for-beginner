"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "ai-in-finance",
  title: "AI in Finance",
  titleVi: "AI trong Tài chính",
  description:
    "Ứng dụng AI trong phát hiện gian lận, phân tích rủi ro và giao dịch tự động",
  category: "applied-ai",
  tags: ["fraud-detection", "risk", "trading"],
  difficulty: "beginner",
  relatedSlugs: ["decision-trees", "gradient-boosting", "sentiment-analysis"],
  vizType: "static",
};

export default function AIInFinanceTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn có một <strong>nhân viên bảo vệ</strong> có thể theo dõi{" "}
          <strong>hàng triệu giao dịch cùng lúc</strong>. Mỗi khi ai đó quẹt thẻ tín dụng
          hoặc chuyển tiền qua MoMo, ZaloPay, nhân viên này kiểm tra trong{" "}
          <strong>vài mili-giây</strong> — điều không đội ngũ con người nào làm được.
        </p>
        <p>
          Họ học được thói quen chi tiêu của <strong>từng người</strong>: bạn thường mua
          cà phê sáng ở Highlands, đổ xăng cuối tuần, mua sắm online trên Shopee. Nếu
          đột nhiên có giao dịch <strong>50 triệu đồng từ một quốc gia lạ</strong> lúc 3
          giờ sáng — AI lập tức đánh dấu giao dịch đáng ngờ và thông báo cho ngân hàng.
          Đó chính là AI trong tài chính!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <svg viewBox="0 0 600 380" className="w-full max-w-2xl mx-auto">
            <text x={300} y={22} textAnchor="middle" fill="#e2e8f0" fontSize={13} fontWeight="bold">
              3 Ứng dụng chính của AI trong Tài chính
            </text>

            {/* === Application 1: Fraud Detection === */}
            <g>
              {/* Input */}
              <rect x={20} y={45} width={130} height={85} rx={10} fill="#1e293b" stroke="#ef4444" strokeWidth={2} />
              <text x={85} y={68} textAnchor="middle" fill="#ef4444" fontSize={11} fontWeight="bold">
                Giao dịch
              </text>
              <text x={85} y={85} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                Chuyển khoản, quẹt thẻ
              </text>
              <text x={85} y={98} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                Thanh toán online
              </text>
              <text x={85} y={114} textAnchor="middle" fill="#64748b" fontSize={8}>
                💳 Hàng triệu/ngày
              </text>

              {/* Arrow */}
              <line x1={150} y1={87} x2={175} y2={87} stroke="#ef4444" strokeWidth={2} markerEnd="url(#arrowRed)" />

              {/* AI */}
              <rect x={175} y={52} width={120} height={70} rx={12} fill="#ef4444" fillOpacity={0.12} stroke="#ef4444" strokeWidth={1.5} />
              <text x={235} y={77} textAnchor="middle" fill="#ef4444" fontSize={10} fontWeight="bold">
                Phát hiện bất thường
              </text>
              <text x={235} y={93} textAnchor="middle" fill="#ef4444" fontSize={8}>
                Anomaly Detection
              </text>
              <text x={235} y={106} textAnchor="middle" fill="#ef4444" fontSize={8}>
                Mẫu hành vi bình thường
              </text>

              {/* Arrow */}
              <line x1={295} y1={87} x2={320} y2={87} stroke="#ef4444" strokeWidth={2} markerEnd="url(#arrowRed)" />

              {/* Result */}
              <rect x={320} y={45} width={260} height={85} rx={10} fill="#1e293b" stroke="#22c55e" strokeWidth={2} />
              <text x={450} y={68} textAnchor="middle" fill="#22c55e" fontSize={10} fontWeight="bold">
                Kết quả phát hiện gian lận
              </text>
              <text x={450} y={85} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                ✅ Giao dịch hợp lệ → Thông qua
              </text>
              <text x={450} y={100} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                ⚠️ Đáng ngờ → Xác minh thêm (OTP, gọi điện)
              </text>
              <text x={450} y={115} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                🚫 Gian lận → Chặn ngay & thông báo
              </text>
            </g>

            {/* === Application 2: Credit Scoring === */}
            <g>
              {/* Input */}
              <rect x={20} y={155} width={130} height={85} rx={10} fill="#1e293b" stroke="#3b82f6" strokeWidth={2} />
              <text x={85} y={178} textAnchor="middle" fill="#3b82f6" fontSize={11} fontWeight="bold">
                Dữ liệu khách hàng
              </text>
              <text x={85} y={195} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                Thu nhập, nghề nghiệp
              </text>
              <text x={85} y={208} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                Lịch sử tín dụng
              </text>
              <text x={85} y={224} textAnchor="middle" fill="#64748b" fontSize={8}>
                📋 Hồ sơ tài chính
              </text>

              {/* Arrow */}
              <line x1={150} y1={197} x2={175} y2={197} stroke="#3b82f6" strokeWidth={2} markerEnd="url(#arrowBlue2)" />

              {/* AI */}
              <rect x={175} y={162} width={120} height={70} rx={12} fill="#3b82f6" fillOpacity={0.12} stroke="#3b82f6" strokeWidth={1.5} />
              <text x={235} y={187} textAnchor="middle" fill="#3b82f6" fontSize={10} fontWeight="bold">
                Chấm điểm tín dụng
              </text>
              <text x={235} y={203} textAnchor="middle" fill="#3b82f6" fontSize={8}>
                Credit Scoring
              </text>
              <text x={235} y={216} textAnchor="middle" fill="#3b82f6" fontSize={8}>
                ML / Gradient Boosting
              </text>

              {/* Arrow */}
              <line x1={295} y1={197} x2={320} y2={197} stroke="#3b82f6" strokeWidth={2} markerEnd="url(#arrowBlue2)" />

              {/* Result */}
              <rect x={320} y={155} width={260} height={85} rx={10} fill="#1e293b" stroke="#22c55e" strokeWidth={2} />
              <text x={450} y={178} textAnchor="middle" fill="#22c55e" fontSize={10} fontWeight="bold">
                Điểm rủi ro tín dụng
              </text>
              <text x={450} y={195} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                🟢 Rủi ro thấp (750+) → Duyệt nhanh
              </text>
              <text x={450} y={210} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                🟡 Rủi ro TB (600–750) → Xem xét thêm
              </text>
              <text x={450} y={225} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                🔴 Rủi ro cao (&lt;600) → Từ chối / lãi cao
              </text>
            </g>

            {/* === Application 3: Algorithmic Trading === */}
            <g>
              {/* Input */}
              <rect x={20} y={265} width={130} height={85} rx={10} fill="#1e293b" stroke="#f59e0b" strokeWidth={2} />
              <text x={85} y={288} textAnchor="middle" fill="#f59e0b" fontSize={11} fontWeight="bold">
                Dữ liệu thị trường
              </text>
              <text x={85} y={305} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                Giá cổ phiếu, khối lượng
              </text>
              <text x={85} y={318} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                Tin tức, sentiment
              </text>
              <text x={85} y={334} textAnchor="middle" fill="#64748b" fontSize={8}>
                📈 Dữ liệu real-time
              </text>

              {/* Arrow */}
              <line x1={150} y1={307} x2={175} y2={307} stroke="#f59e0b" strokeWidth={2} markerEnd="url(#arrowAmber2)" />

              {/* AI */}
              <rect x={175} y={272} width={120} height={70} rx={12} fill="#f59e0b" fillOpacity={0.12} stroke="#f59e0b" strokeWidth={1.5} />
              <text x={235} y={297} textAnchor="middle" fill="#f59e0b" fontSize={10} fontWeight="bold">
                Chiến lược giao dịch
              </text>
              <text x={235} y={313} textAnchor="middle" fill="#f59e0b" fontSize={8}>
                Algorithmic Trading
              </text>
              <text x={235} y={326} textAnchor="middle" fill="#f59e0b" fontSize={8}>
                RL / Time Series
              </text>

              {/* Arrow */}
              <line x1={295} y1={307} x2={320} y2={307} stroke="#f59e0b" strokeWidth={2} markerEnd="url(#arrowAmber2)" />

              {/* Result */}
              <rect x={320} y={265} width={260} height={85} rx={10} fill="#1e293b" stroke="#22c55e" strokeWidth={2} />
              <text x={450} y={288} textAnchor="middle" fill="#22c55e" fontSize={10} fontWeight="bold">
                Lệnh giao dịch tự động
              </text>
              <text x={450} y={305} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                Mua/Bán tự động trong mili-giây
              </text>
              <text x={450} y={320} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                Quản lý danh mục đầu tư
              </text>
              <text x={450} y={335} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                Tối ưu hoá lợi nhuận & giảm rủi ro
              </text>
            </g>

            {/* Arrow markers */}
            <defs>
              <marker id="arrowRed" markerWidth={8} markerHeight={6} refX={8} refY={3} orient="auto">
                <path d="M0,0 L8,3 L0,6" fill="#ef4444" />
              </marker>
              <marker id="arrowBlue2" markerWidth={8} markerHeight={6} refX={8} refY={3} orient="auto">
                <path d="M0,0 L8,3 L0,6" fill="#3b82f6" />
              </marker>
              <marker id="arrowAmber2" markerWidth={8} markerHeight={6} refX={8} refY={3} orient="auto">
                <path d="M0,0 L8,3 L0,6" fill="#f59e0b" />
              </marker>
            </defs>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>AI trong Tài chính (AI in Finance)</strong> đang thay đổi cách ngành tài
          chính vận hành — từ bảo vệ khách hàng khỏi gian lận đến tự động hoá quyết định
          đầu tư. Tại Việt Nam, các ngân hàng như VPBank, Techcombank, VietinBank đang tích
          cực ứng dụng AI vào hoạt động kinh doanh.
        </p>
        <p>Các lĩnh vực ứng dụng chính:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Phát hiện gian lận (Fraud Detection):</strong> AI học mẫu hành vi bình
            thường của từng khách hàng và phát hiện giao dịch bất thường trong thời gian
            thực. Kỹ thuật chính: Anomaly Detection, Random Forest, mạng neural. Ví dụ:
            bạn luôn dùng thẻ ở Việt Nam, nếu đột nhiên có giao dịch từ Nigeria — AI sẽ
            chặn ngay.
          </li>
          <li>
            <strong>Chấm điểm tín dụng (Credit Scoring):</strong> Thay vì chỉ dựa vào thu
            nhập và tài sản, AI phân tích hàng trăm yếu tố (lịch sử thanh toán, hành vi
            tiêu dùng, dữ liệu viễn thông) để đánh giá khả năng trả nợ. Đặc biệt hữu ích
            cho người chưa có lịch sử tín dụng — phổ biến ở Việt Nam.
          </li>
          <li>
            <strong>Giao dịch thuật toán (Algorithmic Trading):</strong> AI phân tích dữ liệu
            thị trường, tin tức, sentiment mạng xã hội để đưa ra quyết định mua/bán trong
            mili-giây. Trên sàn HOSE và HNX, ngày càng nhiều quỹ đầu tư sử dụng AI.
          </li>
          <li>
            <strong>Quản lý rủi ro (Risk Management):</strong> AI dự báo rủi ro danh mục
            đầu tư, stress testing, và phát hiện sớm dấu hiệu khủng hoảng tài chính.
          </li>
        </ol>
        <p>Thách thức lớn nhất:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>
            <strong>Yêu cầu giải thích được (Explainability):</strong> Ngân hàng Nhà nước
            và cơ quan quản lý yêu cầu AI phải giải thích được tại sao từ chối cho vay —
            không thể chỉ nói &quot;AI quyết định vậy&quot;.
          </li>
          <li>
            <strong>Công bằng:</strong> AI không được phân biệt đối xử dựa trên giới tính,
            dân tộc, hay vùng miền khi chấm điểm tín dụng.
          </li>
          <li>
            <strong>An ninh mạng:</strong> Hệ thống AI tài chính là mục tiêu hấp dẫn cho
            tấn công — adversarial attacks có thể đánh lừa AI phát hiện gian lận.
          </li>
        </ul>
      </ExplanationSection>
    </>
  );
}
