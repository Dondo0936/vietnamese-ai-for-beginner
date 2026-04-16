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
  slug: "recommendation-systems-in-shopping",
  title: "Recommendation Systems in Shopping",
  titleVi: "Hệ thống Gợi ý trong Mua sắm",
  description:
    "Shopee dùng AI gợi ý sản phẩm cá nhân hóa cho hàng trăm triệu người dùng Đông Nam Á",
  category: "applied-ai",
  tags: ["recommendation-systems", "e-commerce", "application"],
  difficulty: "beginner",
  relatedSlugs: ["recommendation-systems"],
  vizType: "static",
  applicationOf: "recommendation-systems",
  featuredApp: {
    name: "Shopee",
    productFeature: "Personalized Product Recommendations",
    company: "Sea Group",
    countryOrigin: "SG",
  },
  sources: [
    {
      title:
        "How Shopee's AI-Powered Personalization Is Dominating Southeast Asia's E-Commerce Growth In 2024",
      publisher: "GrowthHQ",
      url: "https://www.growthhq.io/our-thinking/how-shopees-ai-powered-personalization-is-dominating-southeast-asias-e-commerce-growth-in-2024",
      date: "2024-08",
      kind: "news",
    },
    {
      title:
        "Shopee's AI Revolution: How Hyper-Personalization Is Reshaping E-Commerce In Southeast Asia, Malaysia, And Thailand",
      publisher: "GrowthHQ",
      url: "https://www.growthhq.io/our-thinking/shopees-ai-revolution-how-hyper-personalization-is-reshaping-e-commerce-in-southeast-asia-malaysia-and-thailand",
      date: "2024-10",
      kind: "news",
    },
    {
      title:
        "Shopee AI: How Artificial Intelligence Is Redefining E-Commerce on Southeast Asia's Most Visited Platform",
      publisher: "Saint Augustines University",
      url: "https://explore.st-aug.edu/exp/shopee-ai-how-artificial-intelligence-is-redefining-ecommerce-on-southeast-asias-most-visited-platform",
      date: "2024-06",
      kind: "news",
    },
    {
      title:
        "AI Personalization: How eCommerce Transform their Business",
      publisher: "Kitameraki",
      url: "https://www.kitameraki.com/post/how-shopee-and-others-transforming-ecommerce-with-ai-personalization-strategies",
      date: "2024-05",
      kind: "news",
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

export default function RecommendationSystemsInShopping() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Hệ thống Gợi ý"
    >
      <ApplicationHero
        parentTitleVi="Hệ thống Gợi ý"
        topicSlug="recommendation-systems-in-shopping"
      >
        <p>
          Khi mở ứng dụng Shopee, trang chủ của mỗi người trông hoàn toàn
          khác nhau. Một bà mẹ thấy đồ trẻ em và sản phẩm gia dụng, trong
          khi sinh viên đại học thấy phụ kiện điện thoại và đồ ăn vặt. Không
          phải ngẫu nhiên &mdash; hệ thống gợi ý AI (recommendation system)
          đang phân tích hàng tỷ tương tác để cá nhân hóa trải nghiệm mua
          sắm cho từng người.
        </p>
        <p>
          Năm 2024, Shopee chiếm 52% tổng giá trị hàng hóa thương mại điện
          tử (GMV &mdash; Gross Merchandise Value) của Đông Nam Á, đạt giá
          trị thị trường 66,8 tỷ đô-la Mỹ. AI cá nhân hóa là yếu tố then
          chốt đằng sau sự thống trị này.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="recommendation-systems-in-shopping">
        <p>
          Hệ thống gợi ý (recommendation system) là thuật toán AI dự đoán sản
          phẩm, nội dung, hoặc dịch vụ mà người dùng có khả năng quan tâm,
          dựa trên lịch sử hành vi và sở thích tương tự từ người dùng khác.
        </p>
        <p>
          Shopee có hàng trăm triệu sản phẩm từ hàng triệu người bán. Nếu
          không có hệ thống gợi ý, người dùng phải tự tìm kiếm trong biển
          sản phẩm &mdash; tốn thời gian và dễ bỏ lỡ sản phẩm phù hợp.
          Người bán nhỏ cũng khó tiếp cận khách hàng khi bị lấn át bởi các
          thương hiệu lớn.
        </p>
        <p>
          Thách thức đặc biệt của Đông Nam Á: thị trường đa quốc gia với
          ngôn ngữ, văn hóa, và thói quen mua sắm khác nhau giữa Việt Nam,
          Thái Lan, Indonesia, và các nước khác.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Hệ thống Gợi ý"
        topicSlug="recommendation-systems-in-shopping"
      >
        <Beat step={1}>
          <p>
            <strong>Thu thập tín hiệu từ hàng tỷ tương tác.</strong> AI của
            Shopee phân tích lịch sử duyệt web, tìm kiếm, nhấp chuột, thêm
            vào giỏ hàng, mua hàng, và cả đánh giá sản phẩm. Mỗi hành động
            là một tín hiệu (signal &mdash; dữ liệu cho biết sở thích người
            dùng) giúp AI hiểu rõ hơn về từng khách hàng.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>Kết hợp lọc cộng tác và phân tích nội dung.</strong> Hệ
            thống sử dụng collaborative filtering (lọc cộng tác &mdash; gợi ý
            dựa trên hành vi người dùng tương tự) kết hợp content analysis
            (phân tích nội dung &mdash; so sánh đặc điểm sản phẩm). Nếu
            người dùng A và B có lịch sử mua hàng giống nhau, sản phẩm B mua
            mà A chưa mua sẽ được gợi ý cho A.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>Cá nhân hóa theo ngữ cảnh địa phương.</strong> Shopee tinh
            chỉnh gợi ý cho từng thị trường: sản phẩm phổ biến ở Việt Nam khác
            với Thailand, xu hướng mùa vụ khác nhau, và cả cách viết mô tả
            sản phẩm cũng được tối ưu hóa theo ngôn ngữ và văn hóa địa phương.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>AI tóm tắt đánh giá giúp quyết định nhanh.</strong> Shopee
            sử dụng AI tóm tắt hàng nghìn đánh giá sản phẩm thành những nhận
            xét ngắn gọn, giúp người mua lần đầu đưa ra quyết định nhanh và
            tự tin hơn &mdash; giảm do dự và tăng tỷ lệ chuyển đổi
            (conversion rate &mdash; tỷ lệ người dùng thực hiện mua hàng).
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="recommendation-systems-in-shopping"
      >
        <Metric
          value="52% thị phần GMV thương mại điện tử Đông Nam Á năm 2024 (tăng từ 48% năm 2023)"
          sourceRef={1}
        />
        <Metric
          value="66,8 tỷ đô-la Mỹ giá trị thị trường của Shopee"
          sourceRef={1}
        />
        <Metric
          value="Chatbot AI Sophie xử lý 18 triệu cuộc hội thoại hỗ trợ năm 2023, giải quyết 80% tự động"
          sourceRef={3}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Hệ thống Gợi ý"
        topicSlug="recommendation-systems-in-shopping"
      >
        <p>
          Nếu không có hệ thống gợi ý, Shopee sẽ hiển thị cùng một trang chủ
          cho mọi người &mdash; phần lớn sản phẩm sẽ không liên quan đến nhu
          cầu cá nhân. Người dùng phải tự tìm kiếm, người bán nhỏ bị vùi
          lấp, và tỷ lệ chuyển đổi giảm mạnh.
        </p>
        <p>
          Hệ thống gợi ý AI cho phép Shopee phục vụ hàng trăm triệu người
          dùng với trải nghiệm cá nhân hóa &mdash; mỗi người thấy một
          &ldquo;cửa hàng&rdquo; riêng phù hợp với sở thích, ngân sách, và
          ngữ cảnh văn hóa của mình.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
