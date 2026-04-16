"use client";

import type { TopicMeta } from "@/lib/types";
import ApplicationLayout from "@/components/application/ApplicationLayout";
import ApplicationHero from "@/components/application/ApplicationHero";
import ApplicationProblem from "@/components/application/ApplicationProblem";
import ApplicationMechanism from "@/components/application/ApplicationMechanism";
import Beat from "@/components/application/Beat";
import ApplicationMetrics from "@/components/application/ApplicationMetrics";
import Metric from "@/components/application/Metric";
import ApplicationCounterfactual from "@/components/application/ApplicationCounterfactual";

export const metadata: TopicMeta = {
  slug: "feature-engineering-in-fraud-detection",
  title: "Feature Engineering in Fraud Detection",
  titleVi: "Feature Engineering trong Phát hiện Gian lận",
  description:
    "Cách Stripe Radar chế tạo hơn 1.000 đặc trưng từ dữ liệu giao dịch toàn cầu để phát hiện gian lận trong dưới 100ms",
  category: "foundations",
  tags: ["feature-engineering", "fraud-detection", "application"],
  difficulty: "intermediate",
  relatedSlugs: ["feature-engineering"],
  vizType: "static",
  applicationOf: "feature-engineering",
  featuredApp: {
    name: "Stripe Radar",
    productFeature: "Fraud Detection",
    company: "Stripe Inc.",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "How we built it: Stripe Radar",
      publisher: "Stripe Dot Dev Blog",
      url: "https://stripe.dev/blog/how-we-built-it-stripe-radar",
      date: "2024-03",
      kind: "engineering-blog",
    },
    {
      title:
        "A primer on machine learning for fraud detection",
      publisher: "Stripe Guides",
      url: "https://stripe.com/guides/primer-on-machine-learning-for-fraud-protection",
      date: "2023-06",
      kind: "documentation",
    },
    {
      title:
        "Using AI to create dynamic, risk-based Radar rules",
      publisher: "Stripe Blog",
      url: "https://stripe.com/blog/using-ai-dynamic-radar-rules",
      date: "2024-09",
      kind: "engineering-blog",
    },
    {
      title:
        "Stripe debuts Radar anti-fraud AI tools for big businesses, says it has halted $4B in fraud to date",
      publisher: "TechCrunch",
      url: "https://techcrunch.com/2018/04/18/stripe-debuts-radar-anti-fraud-ai-tools-for-big-businesses-says-it-has-halted-4b-in-fraud-to-date/",
      date: "2018-04",
      kind: "news",
    },
    {
      title: "Updates to Stripe's advanced fraud detection",
      publisher: "Stripe Blog",
      url: "https://stripe.com/blog/advanced-fraud-detection-updates",
      date: "2023-11",
      kind: "engineering-blog",
    },
  ],
  tocSections: [
    { id: "hero", labelVi: "Công ty nào?" },
    { id: "problem", labelVi: "Vấn đề" },
    { id: "mechanism", labelVi: "Cách giải quyết" },
    { id: "metrics", labelVi: "Con số thật" },
    { id: "counterfactual", labelVi: "Nếu không có" },
  ],
};

export default function FeatureEngineeringInFraudDetection() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Kỹ thuật đặc trưng"
    >
      <ApplicationHero
        parentTitleVi="Kỹ thuật đặc trưng"
        topicSlug="feature-engineering-in-fraud-detection"
      >
        <p>
          Bạn mua hàng online, nhập số thẻ, nhấn &ldquo;Thanh toán&rdquo;
          &mdash; và trong chưa đầy 100 mili-giây, hệ thống Stripe Radar (công
          cụ phát hiện gian lận của Stripe) đã phân tích hơn 1.000 đặc trưng
          để quyết định giao dịch này hợp lệ hay đáng ngờ. Mỗi năm, Radar bảo
          vệ hàng triệu doanh nghiệp khỏi thiệt hại hàng tỷ đô-la gian lận.
        </p>
        <p>
          Bí quyết không nằm ở model phức tạp &mdash; mà nằm ở cách Stripe
          chế tạo features (đặc trưng &mdash; các tín hiệu đầu vào cho model).
          Từ dữ liệu thô của một giao dịch (số thẻ, IP, thiết bị), kỹ sư
          Stripe tạo ra hàng trăm velocity features (đặc trưng tốc độ), network
          graph features (đặc trưng đồ thị mạng lưới), và device fingerprints
          (dấu vân tay thiết bị) &mdash; đây chính là Feature Engineering ở
          quy mô toàn cầu.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="feature-engineering-in-fraud-detection">
        <p>
          Stripe xử lý hàng trăm tỷ đô-la thanh toán mỗi năm cho hàng triệu
          doanh nghiệp. Chỉ khoảng 0,1% giao dịch là gian lận, nhưng con số
          tuyệt đối lên tới hàng tỷ đô-la. Mỗi giao dịch chỉ cung cấp dữ liệu
          thô rất ít: số thẻ, số tiền, IP, thời gian, và vài metadata.
        </p>
        <p>
          Vấn đề cốt lõi: từ vài trường dữ liệu thô đó, làm sao tạo ra
          features đủ mạnh để phân biệt giao dịch hợp lệ và gian lận? Kẻ gian
          liên tục thay đổi chiến thuật &mdash; dùng VPN, thẻ ảo, danh tính
          giả. Dữ liệu mất cân bằng cực đoan (imbalanced data): 99,9% giao
          dịch hợp lệ, 0,1% gian lận. Model cần features thông minh để
          &ldquo;nhìn xuyên&rdquo; qua lớp ngụy trang.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Kỹ thuật đặc trưng"
        topicSlug="feature-engineering-in-fraud-detection"
      >
        <Beat step={1}>
          <p>
            <strong>
              Velocity features (đặc trưng tốc độ &mdash; đo tần suất hành vi
              trong cửa sổ thời gian).
            </strong>{" "}
            Stripe tính: &ldquo;Thẻ này đã thử bao nhiêu giao dịch trong 1
            giờ qua? 10 phút qua? Từ bao nhiêu IP khác nhau?&rdquo; Giao dịch
            hợp lệ thường 1&ndash;2 lần/ngày. Kẻ gian lận thử hàng chục lần
            liên tiếp (card testing &mdash; thử thẻ hàng loạt). Velocity
            features bắt ngay pattern bất thường này. Stripe xây dựng hệ thống
            tính velocity trong thời gian thực trên toàn bộ mạng lưới.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>
              Device fingerprinting (dấu vân tay thiết bị &mdash; nhận diện
              thiết bị qua tổ hợp tín hiệu).
            </strong>{" "}
            Stripe.js (thư viện JavaScript phía client) thu thập hàng chục tín
            hiệu từ trình duyệt: độ phân giải màn hình, timezone, font đã cài,
            ngôn ngữ hệ thống, WebGL renderer. Tổ hợp các tín hiệu này tạo
            thành một &ldquo;vân tay&rdquo; gần như duy nhất cho mỗi thiết bị.
            Kẻ gian dùng danh tính mới nhưng cùng laptop &mdash; device
            fingerprint vẫn nhận ra. Radar phát hiện cả IP spoofing (giả mạo
            IP) và proxy usage (dùng máy chủ trung gian).
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>
              Network graph features (đặc trưng đồ thị mạng lưới &mdash; mối
              quan hệ giữa các thực thể).
            </strong>{" "}
            Stripe liên kết mọi giao dịch trên toàn mạng lưới: thẻ A đã dùng
            ở merchant B, từ thiết bị C, cùng email D. Khi thẻ mới xuất hiện
            nhưng dùng cùng thiết bị với thẻ đã bị đánh dấu gian lận trước đó
            &mdash; network graph ngay lập tức nâng mức rủi ro. Đây là lợi thế
            lớn nhất của Stripe: dữ liệu từ hàng triệu doanh nghiệp tạo ra
            &ldquo;tầm nhìn mạng lưới&rdquo; mà không merchant đơn lẻ nào có
            được.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>
              Aggregated risk scoring (chấm điểm rủi ro tổng hợp &mdash; kết
              hợp tất cả features thành một điểm duy nhất).
            </strong>{" "}
            Hơn 1.000 features được đưa vào model ML. Model gán mỗi giao dịch
            một risk score (điểm rủi ro). Giao dịch rủi ro cao bị chặn tự động
            hoặc yêu cầu xác thực thêm (3D Secure). Toàn bộ pipeline chạy
            trong dưới 100ms &mdash; nhanh đến mức người dùng không nhận ra có
            kiểm tra nào xảy ra. Stripe liên tục cập nhật features vì kẻ gian
            thay đổi chiến thuật, đạt cải thiện 20% hiệu suất phát hiện mỗi năm.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="feature-engineering-in-fraud-detection"
      >
        <Metric
          value="Phân tích hơn 1.000 đặc trưng cho mỗi giao dịch trong dưới 100 mili-giây"
          sourceRef={1}
        />
        <Metric
          value="Ngăn chặn hàng tỷ đô-la gian lận, bảo vệ hàng triệu doanh nghiệp trên toàn cầu"
          sourceRef={4}
        />
        <Metric
          value="Cải thiện hiệu suất phát hiện gian lận hơn 20% mỗi năm nhờ cập nhật features liên tục"
          sourceRef={1}
        />
        <Metric
          value="Tốc độ phát hành model tăng gấp 3 lần nhờ tự động hoá pipeline huấn luyện và đánh giá"
          sourceRef={1}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Kỹ thuật đặc trưng"
        topicSlug="feature-engineering-in-fraud-detection"
      >
        <p>
          Không có feature engineering, model chỉ thấy dữ liệu thô: số thẻ, số
          tiền, IP. Một giao dịch $50 từ thẻ mới trông giống hệt giao dịch hợp
          lệ. Nhưng velocity feature tiết lộ: thẻ này đã thử 20 lần trong 5
          phút qua. Device fingerprint cho biết: cùng laptop đã dùng 8 thẻ bị
          báo gian lận. Network graph liên kết: email này xuất hiện cùng thiết
          bị đã bị chặn ở merchant khác.
        </p>
        <p>
          Features thông minh biến dữ liệu thô vô hồn thành tín hiệu có ý
          nghĩa &mdash; giống như thám tử không chỉ nhìn hiện trường mà còn
          kiểm tra tiền sử, mối quan hệ, và hành vi trong quá khứ. Feature
          engineering là lý do Stripe Radar vượt trội: cùng model ML, features
          tốt hơn luôn thắng.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
