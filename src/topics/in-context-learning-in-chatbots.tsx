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
  slug: "in-context-learning-in-chatbots",
  title: "In-Context Learning in Chatbots",
  titleVi: "Học trong Ngữ cảnh ở Chatbot",
  description:
    "Intercom Fin: chatbot hỗ trợ khách hàng sử dụng few-shot learning để trả lời chính xác từ kho kiến thức",
  category: "llm-concepts",
  tags: ["in-context-learning", "chatbot", "application"],
  difficulty: "beginner",
  relatedSlugs: ["in-context-learning"],
  vizType: "static",
  applicationOf: "in-context-learning",
  featuredApp: {
    name: "Intercom Fin",
    productFeature: "AI Customer Support Chatbot",
    company: "Intercom",
    countryOrigin: "US",
  },
  sources: [
    {
      title:
        "Introducing Fin: Intercom's breakthrough AI chatbot, built on GPT-4",
      publisher: "Intercom Blog",
      url: "https://www.intercom.com/blog/announcing-intercoms-new-ai-chatbot/",
      date: "2023-03",
      kind: "engineering-blog",
    },
    {
      title:
        "Intercom Brings ChatGPT to Customer Service with Fin, the First AI Customer Service Bot Built with GPT-4 Technology",
      publisher: "PR Newswire",
      url: "https://www.prnewswire.com/news-releases/intercom-brings-chatgpt-to-customer-service-with-fin-the-first-ai-customer-service-bot-built-with-gpt-4-technology-301771944.html",
      date: "2023-03",
      kind: "news",
    },
    {
      title:
        "Everything you need to know about Fin, the breakthrough AI bot transforming customer service",
      publisher: "Intercom Blog",
      url: "https://www.intercom.com/blog/fin-ai-bot-customer-service/",
      date: "2023-06",
      kind: "engineering-blog",
    },
    {
      title:
        "Intercom's three lessons for creating a sustainable AI advantage",
      publisher: "OpenAI",
      url: "https://openai.com/index/intercom/",
      date: "2024-03",
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

export default function InContextLearningInChatbots() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Học trong Ngữ cảnh"
    >
      <ApplicationHero
        parentTitleVi="Học trong Ngữ cảnh"
        topicSlug="in-context-learning-in-chatbots"
      >
        <p>
          Tháng 3 năm 2023, Intercom &mdash; nền tảng hỗ trợ khách hàng phục
          vụ hơn 25.000 doanh nghiệp &mdash; ra mắt Fin, một trong những
          chatbot AI thương mại đầu tiên được xây dựng trên GPT-4. Fin không
          chỉ trả lời bằng kiến thức chung mà còn học từ chính kho kiến thức
          (knowledge base &mdash; tập hợp tài liệu hướng dẫn) của từng công ty.
        </p>
        <p>
          Điểm đặc biệt: Fin sử dụng in-context learning (học trong ngữ cảnh
          &mdash; khả năng AI học từ các ví dụ được cung cấp ngay trong cuộc
          trò chuyện) để trả lời chính xác dựa trên tài liệu cụ thể của doanh
          nghiệp, không cần huấn luyện lại mô hình.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="in-context-learning-in-chatbots">
        <p>
          In-context learning (học trong ngữ cảnh) là khả năng của mô hình
          ngôn ngữ lớn (LLM) học từ các ví dụ và thông tin được đặt trực tiếp
          trong prompt &mdash; mà không cần huấn luyện lại hay cập nhật tham
          số mô hình.
        </p>
        <p>
          Chatbot hỗ trợ khách hàng truyền thống hoạt động dựa trên quy tắc
          (rule-based &mdash; chỉ trả lời được những câu hỏi đã lập trình
          sẵn). Khi khách hàng hỏi ngoài kịch bản, bot không thể trả lời
          hoặc đưa ra câu trả lời sai, buộc phải chuyển sang nhân viên hỗ trợ.
        </p>
        <p>
          Thách thức lớn nhất: mỗi doanh nghiệp có sản phẩm, chính sách, và
          quy trình riêng &mdash; làm sao AI trả lời chính xác cho từng công
          ty mà không cần huấn luyện mô hình riêng cho mỗi khách hàng?
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Học trong Ngữ cảnh"
        topicSlug="in-context-learning-in-chatbots"
      >
        <Beat step={1}>
          <p>
            <strong>Thu nạp kho kiến thức của doanh nghiệp.</strong> Fin tự
            động quét toàn bộ help center (trung tâm trợ giúp &mdash; trang
            web chứa các bài hướng dẫn) của doanh nghiệp trên Intercom hoặc
            Zendesk. Không cần cấu hình hay huấn luyện &mdash; Fin đọc và
            hiểu nội dung có sẵn ngay lập tức.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>Đưa tài liệu liên quan vào ngữ cảnh.</strong> Khi khách
            hàng đặt câu hỏi, Fin tìm các bài viết phù hợp nhất từ kho kiến
            thức và đưa vào prompt cùng câu hỏi. Đây chính là in-context
            learning: mô hình &ldquo;học&rdquo; từ các ví dụ và thông tin ngay
            trong cuộc trò chuyện.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>Giảm ảo giác bằng ràng buộc nguồn.</strong> Intercom giảm
            tỷ lệ ảo giác (hallucination &mdash; AI bịa thông tin) xuống
            khoảng 10 lần bằng cách ràng buộc Fin chỉ trả lời dựa trên nội
            dung từ kho kiến thức đáng tin cậy. Mỗi câu trả lời đều kèm theo
            đường link đến bài viết nguồn để khách hàng kiểm chứng.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>Chuyển giao cho nhân viên khi cần.</strong> Khi gặp câu hỏi
            nằm ngoài phạm vi kho kiến thức, Fin nhận biết giới hạn của mình
            và tự động chuyển cuộc trò chuyện sang nhân viên hỗ trợ con người,
            thay vì đoán mò và đưa ra thông tin sai.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="in-context-learning-in-chatbots"
      >
        <Metric
          value="Giải quyết tự động lên đến 50% yêu cầu hỗ trợ khách hàng"
          sourceRef={3}
        />
        <Metric
          value="Giảm tỷ lệ ảo giác khoảng 10 lần so với chatbot AI thông thường"
          sourceRef={1}
        />
        <Metric
          value="Triển khai không cần cấu hình — chỉ cần kết nối với help center có sẵn"
          sourceRef={3}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Học trong Ngữ cảnh"
        topicSlug="in-context-learning-in-chatbots"
      >
        <p>
          Nếu không có in-context learning, mỗi doanh nghiệp sẽ cần huấn luyện
          riêng một mô hình AI cho sản phẩm của mình &mdash; tốn kém về thời
          gian, chi phí, và đòi hỏi chuyên gia machine learning. Chatbot sẽ chỉ
          trả lời được những câu hỏi chung chung, không thể hiểu chính sách
          cụ thể của từng công ty.
        </p>
        <p>
          In-context learning cho phép Fin &ldquo;trở thành chuyên gia&rdquo;
          về bất kỳ sản phẩm nào chỉ bằng cách đọc tài liệu &mdash; giống
          cách một nhân viên mới học từ sổ tay hướng dẫn trong ngày đầu đi làm.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
