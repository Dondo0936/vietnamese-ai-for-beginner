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
  slug: "guardrails-in-chat-assistants",
  title: "Guardrails in Chat Assistants",
  titleVi: "Rào chắn An toàn trong Trợ lý Trò chuyện",
  description:
    "Constitutional AI của Anthropic và Moderation API của OpenAI: hai cách tiếp cận bảo vệ người dùng khỏi nội dung có hại",
  category: "ai-safety",
  tags: ["guardrails", "safety", "application"],
  difficulty: "beginner",
  relatedSlugs: ["guardrails"],
  vizType: "static",
  applicationOf: "guardrails",
  featuredApp: {
    name: "Constitutional AI / Moderation API",
    productFeature: "AI Safety Guardrails",
    company: "Anthropic / OpenAI",
    countryOrigin: "US",
  },
  sources: [
    {
      title:
        "Constitutional AI: Harmlessness from AI Feedback",
      publisher: "Anthropic",
      url: "https://www.anthropic.com/research/constitutional-ai-harmlessness-from-ai-feedback",
      date: "2022-12",
      kind: "paper",
    },
    {
      title:
        "Constitutional Classifiers: Defending against universal jailbreaks",
      publisher: "Anthropic",
      url: "https://www.anthropic.com/research/constitutional-classifiers",
      date: "2025-01",
      kind: "paper",
    },
    {
      title: "Moderation — OpenAI API Guide",
      publisher: "OpenAI",
      url: "https://developers.openai.com/api/docs/guides/moderation",
      date: "2024-08",
      kind: "documentation",
    },
    {
      title:
        "New and improved content moderation tooling",
      publisher: "OpenAI",
      url: "https://openai.com/index/new-and-improved-content-moderation-tooling/",
      date: "2024-08",
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

export default function GuardrailsInChatAssistants() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Rào chắn An toàn"
    >
      <ApplicationHero
        parentTitleVi="Rào chắn An toàn"
        topicSlug="guardrails-in-chat-assistants"
      >
        <p>
          Khi hàng trăm triệu người sử dụng trợ lý AI hàng ngày, một câu hỏi
          then chốt xuất hiện: làm sao ngăn AI tạo ra nội dung nguy hiểm?
          Anthropic và OpenAI &mdash; hai công ty AI hàng đầu &mdash; đã phát
          triển hai cách tiếp cận khác nhau nhưng bổ sung cho nhau.
        </p>
        <p>
          Anthropic tạo ra Constitutional AI (AI Hiến pháp &mdash; phương pháp
          huấn luyện AI tuân theo bộ nguyên tắc đạo đức), trong khi OpenAI xây
          dựng Moderation API (giao diện lập trình kiểm duyệt &mdash; công cụ
          phát hiện và chặn nội dung có hại). Cả hai đều là &ldquo;rào chắn an
          toàn&rdquo; (guardrails) giúp AI hữu ích mà không gây hại.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="guardrails-in-chat-assistants">
        <p>
          Guardrails (rào chắn an toàn) là hệ thống lọc và kiểm soát đầu vào
          và đầu ra của mô hình AI, ngăn chặn nội dung có hại như thông tin
          nguy hiểm, phát ngôn thù ghét, hoặc hướng dẫn bất hợp pháp.
        </p>
        <p>
          Mô hình ngôn ngữ lớn được huấn luyện trên lượng dữ liệu khổng lồ
          từ internet &mdash; bao gồm cả nội dung độc hại. Nếu không có rào
          chắn, AI có thể bị lợi dụng bằng kỹ thuật jailbreak (phá rào &mdash;
          thủ thuật lừa AI vượt qua giới hạn an toàn) để tạo ra nội dung
          nguy hiểm.
        </p>
        <p>
          Thách thức: rào chắn phải đủ chặt để ngăn nội dung có hại, nhưng
          đủ linh hoạt để không chặn nhầm yêu cầu hợp lệ &mdash; ví dụ bác
          sĩ hỏi về triệu chứng bệnh hoặc nhà báo nghiên cứu về tội phạm.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Rào chắn An toàn"
        topicSlug="guardrails-in-chat-assistants"
      >
        <Beat step={1}>
          <p>
            <strong>Constitutional AI: dạy AI tự kiểm soát.</strong> Tháng 12
            năm 2022, Anthropic công bố phương pháp Constitutional AI. Thay vì
            dùng hàng nghìn nhân viên gắn nhãn &ldquo;tốt/xấu&rdquo; cho câu
            trả lời, họ cho AI một &ldquo;hiến pháp&rdquo; &mdash; bộ nguyên
            tắc bằng ngôn ngữ tự nhiên &mdash; và để AI tự đánh giá và sửa
            đầu ra của chính mình.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>RLAIF thay thế RLHF.</strong> Constitutional AI sử dụng
            RLAIF (Reinforcement Learning from AI Feedback &mdash; học tăng
            cường từ phản hồi của AI) thay vì RLHF (từ phản hồi của con
            người). AI đánh giá phản hồi theo nguyên tắc hiến pháp, tạo dữ
            liệu huấn luyện về sự vô hại &mdash; giảm chi phí và tránh tác
            động tâm lý lên nhân viên phải đọc nội dung độc hại.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>OpenAI Moderation API: lọc nội dung theo thời gian
            thực.</strong>{" "}
            OpenAI cung cấp Moderation API miễn phí, hoạt động như &ldquo;bộ
            lọc&rdquo; kiểm tra đầu vào và đầu ra. API phân loại nội dung
            theo các danh mục: bạo lực, thù ghét, tự hại, tình dục &mdash; và
            trả về điểm số cho mức độ vi phạm. Mô hình mới nhất
            (omni-moderation) hỗ trợ cả văn bản lẫn hình ảnh.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>Constitutional Classifiers chống jailbreak.</strong> Năm
            2025, Anthropic nâng cấp với Constitutional Classifiers &mdash; bộ
            phân loại giám sát đầu vào và đầu ra để phát hiện và chặn nội
            dung có hại theo thời gian thực. Được huấn luyện trên dữ liệu tổng
            hợp từ hiến pháp, hệ thống này bảo vệ hiệu quả chống lại các kỹ
            thuật jailbreak phổ biến.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="guardrails-in-chat-assistants"
      >
        <Metric
          value="Constitutional AI giảm nhu cầu gắn nhãn bởi con người bằng cách sử dụng AI tự đánh giá"
          sourceRef={1}
        />
        <Metric
          value="Moderation API miễn phí cho mọi nhà phát triển sử dụng OpenAI"
          sourceRef={3}
        />
        <Metric
          value="Constitutional Classifiers bảo vệ chống jailbreak phổ biến (universal jailbreaks)"
          sourceRef={2}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Rào chắn An toàn"
        topicSlug="guardrails-in-chat-assistants"
      >
        <p>
          Nếu không có rào chắn an toàn, các trợ lý AI sẽ dễ dàng bị lợi dụng
          để tạo ra hướng dẫn nguy hiểm, phát ngôn thù ghét, hoặc thông tin
          sai lệch. Niềm tin của người dùng và xã hội vào công nghệ AI sẽ sụp
          đổ nhanh chóng.
        </p>
        <p>
          Constitutional AI và Moderation API đại diện cho hai triết lý bổ sung:
          dạy AI tự kiểm soát từ bên trong (Anthropic) và lọc nội dung từ bên
          ngoài (OpenAI). Kết hợp cả hai tạo nên hệ thống phòng thủ nhiều lớp,
          giúp AI an toàn hơn cho hàng trăm triệu người dùng.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
