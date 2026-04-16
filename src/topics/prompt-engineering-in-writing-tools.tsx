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
  slug: "prompt-engineering-in-writing-tools",
  title: "Prompt Engineering in Writing Tools",
  titleVi: "Prompt Engineering trong Công cụ Viết",
  description:
    "Jasper AI và Notion AI: công cụ viết sử dụng prompt engineering để tạo nội dung chuyên nghiệp",
  category: "llm-concepts",
  tags: ["prompt-engineering", "writing", "application"],
  difficulty: "beginner",
  relatedSlugs: ["prompt-engineering"],
  vizType: "static",
  applicationOf: "prompt-engineering",
  featuredApp: {
    name: "Jasper / Notion AI",
    productFeature: "AI-powered Writing Assistants",
    company: "Jasper AI / Notion Labs",
    countryOrigin: "US",
  },
  sources: [
    {
      title:
        "AI content platform Jasper raises $125M at a $1.5B valuation",
      publisher: "TechCrunch",
      url: "https://techcrunch.com/2022/10/18/ai-content-platform-jasper-raises-125m-at-a-1-7b-valuation/",
      date: "2022-10",
      kind: "news",
    },
    {
      title:
        "Jasper Announces $125M Series A Funding Round, Bringing Total Valuation to $1.5B",
      publisher: "Jasper Blog",
      url: "https://www.jasper.ai/blog/jasper-announces-125m-series-a-funding",
      date: "2022-10",
      kind: "news",
    },
    {
      title:
        "Generative AI Assistant Notion AI Launched by Productivity App Notion",
      publisher: "Voicebot.ai",
      url: "https://voicebot.ai/2023/02/22/generative-ai-assistant-notion-ai-launched-by-productivity-app-notion/",
      date: "2023-02",
      kind: "news",
    },
    {
      title: "Explore Notion AI: Augment Your Writing & Creativity Now",
      publisher: "Notion",
      url: "https://www.notion.com/blog/notion-ai-is-here-for-everyone",
      date: "2023-02",
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

export default function PromptEngineeringInWritingTools() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Prompt Engineering"
    >
      <ApplicationHero
        parentTitleVi="Prompt Engineering"
        topicSlug="prompt-engineering-in-writing-tools"
      >
        <p>
          Tháng 10 năm 2022, Jasper AI &mdash; một nền tảng viết nội dung bằng
          AI &mdash; huy động 125 triệu đô-la Mỹ với định giá 1,5 tỷ đô-la
          Mỹ. Bí quyết? Jasper biến prompt engineering (kỹ thuật viết câu lệnh
          &mdash; nghệ thuật thiết kế câu lệnh để hướng dẫn AI tạo kết quả
          mong muốn) thành sản phẩm dễ sử dụng cho hơn 70.000 khách hàng.
        </p>
        <p>
          Chỉ vài tháng sau, Notion &mdash; ứng dụng quản lý công việc phổ
          biến &mdash; ra mắt Notion AI, đưa sức mạnh viết bằng AI ngay vào
          không gian làm việc hàng ngày. Hơn 2 triệu người đăng ký danh sách
          chờ, gấp 10 lần dự đoán của Notion.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="prompt-engineering-in-writing-tools">
        <p>
          Prompt engineering là kỹ thuật thiết kế câu lệnh đầu vào (prompt
          &mdash; câu hỏi hoặc chỉ dẫn) để mô hình ngôn ngữ lớn tạo ra kết
          quả chính xác và hữu ích nhất.
        </p>
        <p>
          Phần lớn người dùng không biết cách viết prompt hiệu quả. Một câu
          lệnh mơ hồ như &ldquo;viết bài quảng cáo&rdquo; cho kết quả chung
          chung, trong khi prompt có cấu trúc rõ ràng &mdash; chỉ định đối
          tượng, giọng văn, độ dài, và mục tiêu &mdash; tạo ra nội dung chất
          lượng chuyên nghiệp.
        </p>
        <p>
          Thách thức kinh doanh là: làm sao biến kiến thức prompt engineering
          phức tạp thành giao diện đơn giản mà bất kỳ ai cũng có thể sử dụng
          hiệu quả?
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Prompt Engineering"
        topicSlug="prompt-engineering-in-writing-tools"
      >
        <Beat step={1}>
          <p>
            <strong>Jasper xây dựng thư viện template prompt.</strong> Jasper
            tạo hơn 50 mẫu (template &mdash; khuôn mẫu có sẵn) cho các tình
            huống viết phổ biến: bài blog, quảng cáo Facebook, mô tả sản phẩm
            Amazon. Mỗi template chứa prompt đã được tối ưu hóa sẵn &mdash;
            người dùng chỉ cần điền thông tin cụ thể.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>Notion AI tích hợp ngay trong không gian làm việc.</strong>{" "}
            Notion AI cho phép gọi trợ lý AI bằng cách gõ <code>/ai</code>{" "}
            hoặc nhấn phím cách trên dòng trống. Hệ thống cung cấp các tùy
            chọn có sẵn: viết nháp, cải thiện văn bản, sửa lỗi chính tả, thay
            đổi giọng văn, tóm tắt, dịch thuật, và brainstorm (động não &mdash;
            tìm ý tưởng mới).
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>Prompt hệ thống ẩn đằng sau giao diện.</strong> Cả Jasper
            và Notion AI đều sử dụng system prompt (prompt hệ thống &mdash; câu
            lệnh ẩn chạy ngầm) để kiểm soát chất lượng đầu ra. Khi người dùng
            chọn &ldquo;viết email chuyên nghiệp&rdquo;, hệ thống tự động thêm
            các chỉ dẫn về giọng văn, cấu trúc, và phong cách vào prompt gửi
            đến LLM.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>Điều chỉnh qua phản hồi liên tục.</strong> Jasper và Notion
            sử dụng dữ liệu từ hàng triệu lượt sử dụng để cải thiện prompt
            template. Notion kết hợp nhiều mô hình (GPT-4 của OpenAI và Claude
            của Anthropic) cho các tác vụ khác nhau, chọn mô hình phù hợp nhất
            cho mỗi loại yêu cầu.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="prompt-engineering-in-writing-tools"
      >
        <Metric
          value="1,5 tỷ đô-la Mỹ định giá cho Jasper AI với hơn 70.000 khách hàng"
          sourceRef={1}
        />
        <Metric
          value="Hơn 2 triệu người đăng ký danh sách chờ Notion AI (gấp 10 lần dự đoán)"
          sourceRef={3}
        />
        <Metric
          value="45 triệu đô-la doanh thu năm 2021, dự kiến gấp đôi vào năm 2022 cho Jasper"
          sourceRef={2}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Prompt Engineering"
        topicSlug="prompt-engineering-in-writing-tools"
      >
        <p>
          Nếu không có prompt engineering, người dùng sẽ phải tự thử nghiệm
          hàng chục cách diễn đạt khác nhau để có được kết quả chấp nhận được
          từ AI. Mỗi lần viết một bài blog hay email, họ sẽ mất nhiều thời
          gian chỉnh sửa prompt hơn là viết trực tiếp.
        </p>
        <p>
          Các công cụ như Jasper và Notion AI đã đóng gói kiến thức prompt
          engineering thành sản phẩm &mdash; biến một kỹ năng chuyên môn thành
          trải nghiệm &ldquo;nhấn một nút&rdquo; cho hàng triệu người dùng.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
