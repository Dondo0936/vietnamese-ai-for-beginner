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
  slug: "chain-of-thought-in-reasoning-models",
  title: "Chain of Thought in Reasoning Models",
  titleVi: "Chuỗi suy luận trong Mô hình Lý luận",
  description:
    "GPT-o1 và Claude thinking: mô hình lý luận hiển thị từng bước suy nghĩ trước khi trả lời",
  category: "llm-concepts",
  tags: ["chain-of-thought", "reasoning", "application"],
  difficulty: "beginner",
  relatedSlugs: ["chain-of-thought"],
  vizType: "static",
  applicationOf: "chain-of-thought",
  featuredApp: {
    name: "GPT-o1 / Claude Extended Thinking",
    productFeature: "Reasoning Models with Visible Chain of Thought",
    company: "OpenAI / Anthropic",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "Learning to reason with LLMs",
      publisher: "OpenAI",
      url: "https://openai.com/index/learning-to-reason-with-llms/",
      date: "2024-09",
      kind: "engineering-blog",
    },
    {
      title: "OpenAI o1 System Card",
      publisher: "OpenAI",
      url: "https://cdn.openai.com/o1-system-card-20241205.pdf",
      date: "2024-12",
      kind: "documentation",
    },
    {
      title: "Claude 3.7 Sonnet and Claude Code",
      publisher: "Anthropic",
      url: "https://www.anthropic.com/news/claude-3-7-sonnet",
      date: "2025-02",
      kind: "engineering-blog",
    },
    {
      title: "Claude's extended thinking",
      publisher: "Anthropic",
      url: "https://www.anthropic.com/news/visible-extended-thinking",
      date: "2025-02",
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

export default function ChainOfThoughtInReasoningModels() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Chain of Thought"
    >
      <ApplicationHero
        parentTitleVi="Chain of Thought"
        topicSlug="chain-of-thought-in-reasoning-models"
      >
        <p>
          Tháng 9 năm 2024, OpenAI ra mắt o1 &mdash; mô hình AI đầu tiên
          được huấn luyện để &ldquo;suy nghĩ&rdquo; trước khi trả lời. Thay
          vì đưa ra câu trả lời ngay lập tức, o1 tạo ra một chuỗi suy luận
          (chain of thought &mdash; quá trình trình bày từng bước lý luận)
          nội bộ, tự kiểm tra lỗi và thử nhiều cách tiếp cận.
        </p>
        <p>
          Tháng 2 năm 2025, Anthropic trả lời bằng Claude 3.7 Sonnet &mdash;
          mô hình lý luận lai (hybrid reasoning model) đầu tiên, cho phép
          người dùng bật chế độ &ldquo;extended thinking&rdquo; (suy nghĩ mở
          rộng) để xem Claude trình bày từng bước suy luận trước khi đưa ra
          đáp án cuối cùng.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="chain-of-thought-in-reasoning-models">
        <p>
          Chain of thought (chuỗi suy luận) là kỹ thuật yêu cầu mô hình AI
          trình bày từng bước lý luận thay vì nhảy thẳng đến kết quả. Giống
          như học sinh giải toán phải trình bày bài giải, AI cũng &ldquo;suy
          nghĩ&rdquo; có hệ thống hơn khi được yêu cầu giải thích từng bước.
        </p>
        <p>
          Các mô hình AI truyền thống thường mắc lỗi ở những bài toán phức
          tạp &mdash; toán học nhiều bước, lập trình, hoặc phân tích logic
          &mdash; vì chúng tạo ra câu trả lời trong một bước duy nhất, không
          có quá trình tự kiểm tra.
        </p>
        <p>
          Câu hỏi then chốt: liệu có thể huấn luyện AI tự động sử dụng chuỗi
          suy luận mà không cần người dùng phải yêu cầu, và hiển thị quá trình
          suy nghĩ đó cho người dùng kiểm chứng?
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Chain of Thought"
        topicSlug="chain-of-thought-in-reasoning-models"
      >
        <Beat step={1}>
          <p>
            <strong>o1 tự động kích hoạt chuỗi suy luận.</strong> Khác với GPT-4
            cần người dùng viết &ldquo;hãy suy nghĩ từng bước&rdquo;, o1 được
            huấn luyện bằng reinforcement learning (học tăng cường &mdash;
            phương pháp dạy AI bằng phần thưởng) để tự động tạo reasoning
            tokens (token lý luận &mdash; các bước suy nghĩ nội bộ) trước
            khi sinh câu trả lời.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>Mô hình tự sửa lỗi trong quá trình suy luận.</strong> o1
            học cách nhận diện sai lầm, quay lại, và thử cách tiếp cận khác.
            Khi gặp bài toán khó, mô hình chia thành các bước nhỏ hơn &mdash;
            giống cách một chuyên gia phân tích vấn đề phức tạp từ nhiều góc
            độ trước khi đưa ra kết luận.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>Claude hiển thị quá trình suy nghĩ cho người dùng.</strong>{" "}
            Claude 3.7 Sonnet cho phép bật/tắt chế độ extended thinking.
            Khi bật, người dùng thấy quá trình suy luận của Claude &mdash;
            cách nó cân nhắc các khả năng, phát hiện mâu thuẫn, và đi đến
            kết luận. Lập trình viên có thể đặt &ldquo;thinking budget&rdquo;
            (ngân sách suy nghĩ) để kiểm soát thời gian Claude dành cho mỗi
            câu hỏi.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>Hiệu suất tăng theo thời gian suy nghĩ.</strong> Cả hai mô
            hình cho thấy quy luật: càng dành nhiều tài nguyên tính toán cho
            quá trình suy luận (test-time compute &mdash; tài nguyên tính toán
            khi chạy mô hình), kết quả càng chính xác. Đây là bước ngoặt
            &mdash; hiệu suất không chỉ phụ thuộc vào kích thước mô hình mà
            còn vào thời gian &ldquo;suy nghĩ&rdquo;.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="chain-of-thought-in-reasoning-models"
      >
        <Metric
          value="o1 đạt top 49% trong Olympiad Tin học Quốc tế (IOI) 2024 với quy tắc thi thật"
          sourceRef={1}
        />
        <Metric
          value="Claude 3.7 Sonnet đạt 96,5% trên bài kiểm tra vật lý (GPQA Physics)"
          sourceRef={3}
        />
        <Metric
          value="84,8% trên Graduate-Level Google-Proof Q&A Benchmark cho Claude extended thinking"
          sourceRef={3}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Chain of Thought"
        topicSlug="chain-of-thought-in-reasoning-models"
      >
        <p>
          Nếu không có chuỗi suy luận tự động, các mô hình AI sẽ tiếp tục đưa
          ra câu trả lời &ldquo;bản năng&rdquo; &mdash; nhanh nhưng thường sai
          ở các bài toán cần nhiều bước lý luận. Người dùng sẽ phải tự viết
          prompt &ldquo;hãy suy nghĩ từng bước&rdquo; mỗi lần, và vẫn không
          thể kiểm chứng quá trình suy luận của AI.
        </p>
        <p>
          Các mô hình lý luận như o1 và Claude extended thinking đã chứng minh
          rằng việc dành thêm thời gian &ldquo;suy nghĩ&rdquo; có thể cải
          thiện đáng kể chất lượng trả lời, mở đường cho AI giải quyết các
          bài toán ngày càng phức tạp hơn.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
