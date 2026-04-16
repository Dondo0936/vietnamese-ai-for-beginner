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
  slug: "llm-overview-in-chat-assistants",
  title: "LLM Overview in Chat Assistants",
  titleVi: "Tổng quan LLM trong Trợ lý Trò chuyện",
  description:
    "ChatGPT, Claude, Gemini: ba trợ lý trò chuyện AI hàng đầu đạt hàng trăm triệu người dùng",
  category: "llm-concepts",
  tags: ["llm-overview", "chatbot", "application"],
  difficulty: "beginner",
  relatedSlugs: ["llm-overview"],
  vizType: "static",
  applicationOf: "llm-overview",
  featuredApp: {
    name: "ChatGPT / Claude / Gemini",
    productFeature: "General-purpose Chat Assistants",
    company: "OpenAI / Anthropic / Google",
    countryOrigin: "US",
  },
  sources: [
    {
      title:
        "Sam Altman says ChatGPT has hit 800M weekly active users",
      publisher: "TechCrunch",
      url: "https://techcrunch.com/2025/10/06/sam-altman-says-chatgpt-has-hit-800m-weekly-active-users/",
      date: "2025-10",
      kind: "news",
    },
    {
      title:
        "ChatGPT Hits 200m Users: The Rise of OpenAI's AI Gamechanger",
      publisher: "Technology Magazine",
      url: "https://technologymagazine.com/articles/partnerships-and-updates-examining-chatgpts-usage-doubling",
      date: "2024-08",
      kind: "news",
    },
    {
      title: "Anthropic to sign the EU Code of Practice",
      publisher: "Anthropic",
      url: "https://www.anthropic.com/news/eu-code-practice",
      date: "2025-07",
      kind: "news",
    },
    {
      title:
        "AI Act — Shaping Europe's digital future",
      publisher: "European Commission",
      url: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai",
      date: "2024-08",
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

export default function LlmOverviewInChatAssistants() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Tổng quan LLM"
    >
      <ApplicationHero
        parentTitleVi="Tổng quan LLM"
        topicSlug="llm-overview-in-chat-assistants"
      >
        <p>
          Ngày 30 tháng 11 năm 2022, OpenAI phát hành ChatGPT &mdash; một trợ
          lý trò chuyện được xây dựng trên mô hình ngôn ngữ lớn (LLM &mdash;
          Large Language Model). Chỉ trong 5 ngày, ChatGPT đạt 1 triệu người
          dùng, trở thành ứng dụng tăng trưởng nhanh nhất lịch sử.
        </p>
        <p>
          Không lâu sau, Anthropic ra mắt Claude và Google ra mắt Gemini
          (trước đó là Bard). Ba trợ lý trò chuyện này &mdash; mỗi cái
          được xây dựng trên một mô hình ngôn ngữ lớn riêng &mdash; đã thay
          đổi cách hàng trăm triệu người tìm kiếm thông tin, viết văn bản,
          và giải quyết vấn đề hàng ngày.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="llm-overview-in-chat-assistants">
        <p>
          Mô hình ngôn ngữ lớn (LLM) là loại trí tuệ nhân tạo được huấn luyện
          trên lượng văn bản khổng lồ từ internet, sách, và tài liệu &mdash;
          cho phép nó hiểu và tạo ra ngôn ngữ tự nhiên ở mức độ gần giống
          con người.
        </p>
        <p>
          Trước khi có các trợ lý trò chuyện AI, người dùng phải dựa vào công
          cụ tìm kiếm truyền thống &mdash; nhận danh sách đường link thay vì
          câu trả lời trực tiếp. Viết email, tóm tắt tài liệu, hay dịch thuật
          đều đòi hỏi thời gian đáng kể hoặc phần mềm chuyên dụng.
        </p>
        <p>
          Thách thức là làm sao đưa sức mạnh của LLM đến tay người dùng phổ
          thông thông qua giao diện trò chuyện (chat interface &mdash; giao
          diện cho phép gõ câu hỏi và nhận trả lời bằng ngôn ngữ tự nhiên)
          đơn giản và trực quan.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Tổng quan LLM"
        topicSlug="llm-overview-in-chat-assistants"
      >
        <Beat step={1}>
          <p>
            <strong>ChatGPT mở đầu kỷ nguyên trò chuyện với AI.</strong> OpenAI
            xây dựng ChatGPT trên nền GPT-3.5, sau đó nâng cấp lên GPT-4. Mô
            hình được tinh chỉnh bằng RLHF (Reinforcement Learning from Human
            Feedback &mdash; học tăng cường từ phản hồi của con người) để trả
            lời tự nhiên, hữu ích, và an toàn hơn.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>Claude tập trung vào an toàn và ngữ cảnh dài.</strong>{" "}
            Anthropic phát triển Claude với phương pháp Constitutional AI (AI
            Hiến pháp &mdash; huấn luyện mô hình tuân theo bộ nguyên tắc đạo
            đức). Claude 2 ra mắt với cửa sổ ngữ cảnh 100.000 token, cho phép
            xử lý tài liệu dài gấp 25 lần so với GPT-3.5.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>Gemini kết hợp đa phương thức.</strong> Google ra mắt Gemini
            với khả năng xử lý đồng thời văn bản, hình ảnh, và mã nguồn. Gemini
            1.5 Pro hỗ trợ cửa sổ ngữ cảnh lên đến 1 triệu token, cho phép
            phân tích toàn bộ sách hoặc cơ sở mã nguồn trong một cuộc trò
            chuyện.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>Cạnh tranh thúc đẩy cải tiến liên tục.</strong> Ba nền tảng
            liên tục nâng cấp: ChatGPT thêm plugin và duyệt web, Claude mở
            rộng lên 1 triệu token ngữ cảnh, Gemini tích hợp sâu vào hệ sinh
            thái Google. Mỗi cải tiến buộc đối thủ phải đáp trả, tạo vòng xoáy
            đổi mới có lợi cho người dùng.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="llm-overview-in-chat-assistants"
      >
        <Metric
          value="800 triệu người dùng hoạt động hàng tuần cho ChatGPT (tháng 10/2025)"
          sourceRef={1}
        />
        <Metric
          value="1 triệu người dùng trong 5 ngày đầu tiên — nhanh gấp 15 lần Instagram"
          sourceRef={2}
        />
        <Metric
          value="200 triệu người dùng hoạt động hàng tuần chỉ sau 2 năm ra mắt"
          sourceRef={2}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Tổng quan LLM"
        topicSlug="llm-overview-in-chat-assistants"
      >
        <p>
          Nếu không có mô hình ngôn ngữ lớn, các trợ lý trò chuyện sẽ vẫn bị
          giới hạn ở chatbot (trợ lý tự động) dựa trên quy tắc &mdash; chỉ có
          thể trả lời những câu hỏi đã được lập trình sẵn, không thể viết văn
          bản sáng tạo, tóm tắt tài liệu, hay suy luận về các vấn đề phức tạp.
        </p>
        <p>
          Sự bùng nổ của ChatGPT, Claude, và Gemini cho thấy LLM đã biến trợ
          lý AI từ một công cụ hạn chế thành một nền tảng đa năng phục vụ hàng
          trăm triệu người dùng mỗi ngày.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
