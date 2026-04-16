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
  slug: "ai-governance-in-enterprise",
  title: "AI Governance in Enterprise",
  titleVi: "Quản trị AI trong Doanh nghiệp",
  description:
    "EU AI Act: OpenAI và Anthropic tuân thủ luật AI đầu tiên trên thế giới để tiếp tục hoạt động tại châu Âu",
  category: "ai-safety",
  tags: ["ai-governance", "regulation", "application"],
  difficulty: "beginner",
  relatedSlugs: ["ai-governance"],
  vizType: "static",
  applicationOf: "ai-governance",
  featuredApp: {
    name: "EU AI Act Compliance",
    productFeature: "Regulatory Compliance at OpenAI & Anthropic",
    company: "OpenAI / Anthropic",
    countryOrigin: "US",
  },
  sources: [
    {
      title:
        "AI Act — Shaping Europe's digital future",
      publisher: "European Commission",
      url: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai",
      date: "2024-08",
      kind: "documentation",
    },
    {
      title:
        "The EU Code of Practice and future of AI in Europe",
      publisher: "OpenAI",
      url: "https://openai.com/global-affairs/eu-code-of-practice/",
      date: "2025-07",
      kind: "engineering-blog",
    },
    {
      title: "Anthropic to sign the EU Code of Practice",
      publisher: "Anthropic",
      url: "https://www.anthropic.com/news/eu-code-practice",
      date: "2025-07",
      kind: "engineering-blog",
    },
    {
      title:
        "OpenAI Anthropic EU AI Code: Key Compliance Steps 2025",
      publisher: "Nemko Digital",
      url: "https://digital.nemko.com/news/openai-anthropic-signs-eu-ai-code",
      date: "2025-08",
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

export default function AiGovernanceInEnterprise() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Quản trị AI"
    >
      <ApplicationHero
        parentTitleVi="Quản trị AI"
        topicSlug="ai-governance-in-enterprise"
      >
        <p>
          Tháng 8 năm 2024, Liên minh Châu Âu (EU &mdash; European Union)
          chính thức ban hành EU AI Act &mdash; bộ luật quản lý trí tuệ nhân
          tạo toàn diện đầu tiên trên thế giới. Bộ luật này ảnh hưởng trực
          tiếp đến mọi công ty AI muốn hoạt động tại thị trường 450 triệu
          người tiêu dùng của châu Âu.
        </p>
        <p>
          Tháng 7 năm 2025, cả OpenAI (nhà phát triển ChatGPT) và Anthropic
          (nhà phát triển Claude) đều cam kết ký General-Purpose AI Code of
          Practice (Bộ quy tắc thực hành AI đa năng) &mdash; khung tuân thủ
          tự nguyện do Ủy ban Châu Âu công bố, cung cấp lộ trình rõ ràng
          để đáp ứng yêu cầu của EU AI Act.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="ai-governance-in-enterprise">
        <p>
          Quản trị AI (AI governance) là tập hợp các khung pháp lý, chính sách,
          và quy trình kiểm soát cách AI được phát triển, triển khai, và giám
          sát &mdash; đảm bảo an toàn, minh bạch, và trách nhiệm giải trình.
        </p>
        <p>
          Trước EU AI Act, ngành AI hoạt động gần như không có quy định ràng
          buộc. Các mô hình ngôn ngữ lớn được huấn luyện trên dữ liệu khổng
          lồ mà không cần công khai nguồn dữ liệu, không cần đánh giá rủi ro,
          và không có nghĩa vụ giải thích cách hoạt động.
        </p>
        <p>
          Khi AI ngày càng ảnh hưởng đến quyết định tuyển dụng, tín dụng, y
          tế, và an ninh, việc thiếu quản trị tạo ra rủi ro cho cả người dùng
          lẫn doanh nghiệp &mdash; từ thiên kiến thuật toán đến vi phạm bản
          quyền.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Quản trị AI"
        topicSlug="ai-governance-in-enterprise"
      >
        <Beat step={1}>
          <p>
            <strong>EU AI Act phân loại rủi ro theo bốn cấp.</strong> Bộ luật
            phân AI thành bốn cấp rủi ro: không chấp nhận được (bị cấm, ví dụ
            chấm điểm xã hội), rủi ro cao (tuyển dụng, tín dụng &mdash; phải
            tuân thủ nghiêm ngặt), rủi ro hạn chế (chatbot &mdash; cần minh
            bạch), và rủi ro thấp (bộ lọc spam &mdash; tự do hoạt động).
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>Yêu cầu minh bạch về dữ liệu huấn luyện.</strong> Nhà
            cung cấp AI đa năng (GPAI &mdash; General-Purpose AI) phải cung
            cấp tóm tắt công khai về dữ liệu huấn luyện, bao gồm nguồn gốc
            và cách xử lý dữ liệu &mdash; cho phép chủ sở hữu bản quyền
            kiểm tra xem tác phẩm của họ có bị sử dụng không.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>OpenAI và Anthropic ký Code of Practice.</strong> Cả hai
            công ty cam kết tuân thủ tự nguyện &mdash; được hưởng &ldquo;suy
            đoán tuân thủ&rdquo; (presumption of conformity), giảm đáng kể
            gánh nặng pháp lý so với công ty không ký. Công ty từ chối ký phải
            tự chứng minh tuân thủ bằng phương pháp thay thế, tốn kém và phức
            tạp hơn.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>Lộ trình thực thi theo giai đoạn.</strong> Nghĩa vụ cho
            GPAI bắt đầu từ tháng 8/2025, với Văn phòng AI (AI Office) của
            EU thực thi sau một năm cho mô hình mới và hai năm cho mô hình
            hiện có. Các công ty có thời gian chuẩn bị nhưng phải hành động
            ngay từ bây giờ.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="ai-governance-in-enterprise"
      >
        <Metric
          value="450 triệu người tiêu dùng trong thị trường EU chịu ảnh hưởng của EU AI Act"
          sourceRef={1}
        />
        <Metric
          value="Cả OpenAI và Anthropic đều ký Code of Practice vào tháng 7/2025"
          sourceRef={4}
        />
        <Metric
          value="Bộ luật AI toàn diện đầu tiên trên thế giới, có hiệu lực từ tháng 8/2024"
          sourceRef={1}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Quản trị AI"
        topicSlug="ai-governance-in-enterprise"
      >
        <p>
          Nếu không có khung quản trị AI, các công ty có thể phát triển và
          triển khai mô hình mà không cần đánh giá rủi ro, công khai dữ liệu
          huấn luyện, hay chịu trách nhiệm khi AI gây hại. Người dùng sẽ không
          có cơ chế bảo vệ khi bị ảnh hưởng bởi quyết định của AI.
        </p>
        <p>
          EU AI Act tạo tiền lệ toàn cầu &mdash; giống cách GDPR (Quy định
          Bảo vệ Dữ liệu Chung) đã trở thành tiêu chuẩn bảo mật dữ liệu
          quốc tế, EU AI Act đang định hình cách thế giới quản lý trí tuệ
          nhân tạo.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
