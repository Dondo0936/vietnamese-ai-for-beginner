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
  slug: "text-classification-in-support-routing",
  title: "Text Classification in Support Routing",
  titleVi: "Phân loại Văn bản trong Điều phối Hỗ trợ",
  description:
    "Zendesk AI tự động phân loại và điều phối ticket hỗ trợ — giảm 45% thời gian phản hồi",
  category: "nlp",
  tags: ["text-classification", "support", "application"],
  difficulty: "beginner",
  relatedSlugs: ["text-classification"],
  vizType: "static",
  applicationOf: "text-classification",
  featuredApp: {
    name: "Zendesk",
    productFeature: "AI Ticket Classification & Auto-Routing",
    company: "Zendesk Inc.",
    countryOrigin: "US",
  },
  sources: [
    {
      title:
        "AI-powered ticketing automation: A complete guide for 2026",
      publisher: "Zendesk",
      url: "https://www.zendesk.com/blog/ai-powered-ticketing/",
      date: "2026-01",
      kind: "documentation",
    },
    {
      title:
        "Zendesk AI ticket classification: Complete rundown in 2026",
      publisher: "Eesel AI",
      url: "https://www.eesel.ai/blog/zendesk-ai-ticket-classification-complete-rundown-in-2025",
      date: "2026-01",
      kind: "news",
    },
    {
      title:
        "Zendesk Automated Ticket Routing with Ticket Classification",
      publisher: "Swifteq",
      url: "https://swifteq.com/post/automated-ticket-routing-with-ticket-classification",
      date: "2024-06",
      kind: "documentation",
    },
    {
      title:
        "Routing and automation options for incoming tickets",
      publisher: "Zendesk Help",
      url: "https://support.zendesk.com/hc/en-us/articles/4408831658650-Routing-and-automation-options-for-incoming-tickets",
      date: "2024-09",
      kind: "documentation",
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

export default function TextClassificationInSupportRouting() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Phân loại Văn bản"
    >
      <ApplicationHero
        parentTitleVi="Phân loại Văn bản"
        topicSlug="text-classification-in-support-routing"
      >
        <p>
          Mỗi ngày, hàng triệu yêu cầu hỗ trợ đổ về từ khách hàng trên toàn
          thế giới: &ldquo;Tôi không đăng nhập được&rdquo;, &ldquo;Đơn hàng
          bị giao nhầm&rdquo;, &ldquo;Muốn hủy gói đăng ký&rdquo;. Mỗi yêu
          cầu cần được chuyển đến đúng bộ phận &mdash; kỹ thuật, vận chuyển,
          hay thanh toán &mdash; để được giải quyết nhanh nhất.
        </p>
        <p>
          Zendesk &mdash; nền tảng hỗ trợ khách hàng phục vụ hàng trăm nghìn
          doanh nghiệp &mdash; sử dụng AI phân loại văn bản (text
          classification) để tự động đọc, phân loại, và điều phối ticket (yêu
          cầu hỗ trợ) đến đúng nhóm xử lý, giảm thời gian phản hồi lên đến
          45%.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="text-classification-in-support-routing">
        <p>
          Phân loại văn bản (text classification) là bài toán NLP (xử lý ngôn
          ngữ tự nhiên) gán nhãn tự động cho văn bản vào các danh mục đã định
          sẵn &mdash; ví dụ phân loại email thành &ldquo;spam&rdquo; hay
          &ldquo;không spam&rdquo;, hoặc phân loại yêu cầu hỗ trợ theo
          chủ đề.
        </p>
        <p>
          Trong hệ thống hỗ trợ truyền thống, nhân viên phải đọc từng ticket,
          hiểu nội dung, và thủ công chuyển đến đúng bộ phận. Với hàng nghìn
          ticket mỗi ngày, quá trình này tốn thời gian, dễ sai sót, và gây
          trì hoãn &mdash; khách hàng phải chờ lâu hơn.
        </p>
        <p>
          Khách hàng không mô tả vấn đề theo cách có cấu trúc: họ viết bằng
          ngôn ngữ tự nhiên, có khi dùng tiếng lóng, viết tắt, hoặc mô tả
          mơ hồ. AI phải hiểu được ý định thực sự đằng sau từng tin nhắn.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Phân loại Văn bản"
        topicSlug="text-classification-in-support-routing"
      >
        <Beat step={1}>
          <p>
            <strong>Phát hiện ý định bằng NLP.</strong> Khi ticket mới đến,
            hệ thống AI của Zendesk phân tích nội dung bằng NLP (Natural
            Language Processing &mdash; xử lý ngôn ngữ tự nhiên) để xác định
            intent (ý định &mdash; mục đích thực sự của khách hàng). Thay vì
            chỉ so khớp từ khóa, AI hiểu ngữ nghĩa &mdash;
            &ldquo;app bị đơ&rdquo; và &ldquo;phần mềm không phản hồi&rdquo;
            đều được nhận diện là lỗi kỹ thuật.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>Phân loại đa chiều.</strong> Hệ thống không chỉ phân loại
            theo chủ đề mà còn đánh giá ngôn ngữ (language detection &mdash;
            nhận diện ngôn ngữ), cảm xúc (sentiment analysis &mdash; phân tích
            cảm xúc), và mức độ khẩn cấp. Một ticket tức giận về thanh toán bị
            lỗi sẽ được ưu tiên cao hơn câu hỏi thông thường về tính năng.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>Điều phối thông minh đến đúng nhân viên.</strong>{" "}
            Intelligent routing (điều phối thông minh) cân nhắc nhiều yếu tố:
            ý định đã phát hiện, chuyên môn cần thiết, khối lượng công việc
            hiện tại của nhân viên, và giờ làm việc. Ticket được tự động gán
            tag (nhãn) và chuyển đến nhóm phù hợp nhất.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>Học liên tục từ phản hồi.</strong> Khi nhân viên phân loại
            lại một ticket (vì AI gán sai), hệ thống học từ sự điều chỉnh đó.
            Qua thời gian, độ chính xác phân loại tăng lên khi AI tích lũy
            thêm dữ liệu từ chính doanh nghiệp sử dụng.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="text-classification-in-support-routing"
      >
        <Metric
          value="Giảm thời gian phản hồi lên đến 45% nhờ phân loại và điều phối tự động"
          sourceRef={1}
        />
        <Metric
          value="AI vượt xa so khớp từ khóa — phân tích ý định, ngôn ngữ, và cảm xúc đồng thời"
          sourceRef={2}
        />
        <Metric
          value="Tag AI tự động tích hợp với Zendesk triggers để điều phối không cần can thiệp thủ công"
          sourceRef={3}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Phân loại Văn bản"
        topicSlug="text-classification-in-support-routing"
      >
        <p>
          Nếu không có phân loại văn bản AI, mỗi ticket sẽ phải được nhân viên
          đọc và phân loại thủ công. Với hàng nghìn ticket mỗi ngày, đội ngũ
          hỗ trợ sẽ dành phần lớn thời gian cho việc sắp xếp thay vì giải
          quyết vấn đề. Khách hàng phải chờ lâu hơn, ticket bị chuyển sai
          bộ phận nhiều hơn.
        </p>
        <p>
          Phân loại văn bản AI biến quá trình điều phối từ nút thắt (bottleneck
          &mdash; điểm gây trì hoãn) thành quy trình tự động trong tích tắc,
          giúp đội ngũ hỗ trợ tập trung vào việc quan trọng nhất: giải quyết
          vấn đề cho khách hàng.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
