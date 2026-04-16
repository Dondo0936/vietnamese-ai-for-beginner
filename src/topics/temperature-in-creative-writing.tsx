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
  slug: "temperature-in-creative-writing",
  title: "Temperature in Creative Writing",
  titleVi: "Temperature trong Viết Sáng tạo",
  description:
    "ChatGPT viết sáng tạo vs trang trọng: tham số temperature điều chỉnh mức độ ngẫu nhiên của AI",
  category: "llm-concepts",
  tags: ["temperature", "creative-writing", "application"],
  difficulty: "beginner",
  relatedSlugs: ["temperature"],
  vizType: "static",
  applicationOf: "temperature",
  featuredApp: {
    name: "ChatGPT",
    productFeature: "Creative vs Formal Writing via Temperature",
    company: "OpenAI",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "Understanding OpenAI's Temperature Parameter",
      publisher: "Colt Steele",
      url: "https://www.coltsteele.com/tips/understanding-openai-s-temperature-parameter",
      date: "2024-01",
      kind: "documentation",
    },
    {
      title:
        "Cheat Sheet: Mastering Temperature and Top_p in ChatGPT API",
      publisher: "OpenAI Developer Community",
      url: "https://community.openai.com/t/cheat-sheet-mastering-temperature-and-top-p-in-chatgpt-api/172683",
      date: "2023-06",
      kind: "documentation",
    },
    {
      title: "How to use OpenAI GPT models temperature",
      publisher: "GPT for Work",
      url: "https://gptforwork.com/guides/openai-gpt-ai-temperature",
      date: "2024-03",
      kind: "documentation",
    },
    {
      title: "What Is OpenAI Temperature?",
      publisher: "Coursera",
      url: "https://www.coursera.org/articles/openai-temperature",
      date: "2024-06",
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

export default function TemperatureInCreativeWriting() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Temperature"
    >
      <ApplicationHero
        parentTitleVi="Temperature"
        topicSlug="temperature-in-creative-writing"
      >
        <p>
          Hãy thử yêu cầu ChatGPT viết một bài thơ về mùa thu. Chạy lại cùng
          câu hỏi đó ba lần &mdash; mỗi lần bạn nhận được một bài thơ khác
          nhau, với hình ảnh và cách diễn đạt hoàn toàn mới. Nhưng nếu bạn hỏi
          &ldquo;1 + 1 = ?&rdquo;, ba lần đều cho kết quả giống nhau: 2.
        </p>
        <p>
          Sự khác biệt này được điều khiển bởi một tham số gọi là temperature
          (nhiệt độ &mdash; con số kiểm soát mức độ ngẫu nhiên khi AI chọn từ
          tiếp theo). Temperature là lý do ChatGPT có thể vừa viết thơ sáng
          tạo, vừa tính toán chính xác.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="temperature-in-creative-writing">
        <p>
          Temperature là tham số điều chỉnh phân phối xác suất (probability
          distribution &mdash; cách AI đánh giá khả năng xuất hiện của mỗi từ
          tiếp theo) khi mô hình ngôn ngữ lớn sinh văn bản.
        </p>
        <p>
          Với temperature thấp (gần 0), AI luôn chọn từ có xác suất cao nhất,
          tạo ra văn bản nhất quán nhưng lặp đi lặp lại. Với temperature cao
          (0,7&ndash;1,0), AI chấp nhận chọn những từ ít phổ biến hơn, tạo ra
          sự đa dạng và bất ngờ.
        </p>
        <p>
          Thách thức cho nhà phát triển: cùng một mô hình phải phục vụ cả tác
          vụ cần sự chính xác tuyệt đối (viết code, tính toán) lẫn tác vụ cần
          sự sáng tạo (viết truyện, brainstorm ý tưởng). Temperature chính là
          &ldquo;nút vặn&rdquo; giải quyết bài toán này.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Temperature"
        topicSlug="temperature-in-creative-writing"
      >
        <Beat step={1}>
          <p>
            <strong>Temperature = 0: luôn chọn từ chắc chắn nhất.</strong> Khi
            temperature bằng 0, mô hình luôn chọn token (đơn vị văn bản nhỏ
            nhất) có xác suất cao nhất. Kết quả gần như giống hệt nhau mỗi lần
            chạy &mdash; lý tưởng cho viết code, trích xuất dữ liệu, hoặc trả
            lời câu hỏi có đáp án duy nhất.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>
              Temperature 0,3&ndash;0,5: cân bằng giữa chính xác và tự
              nhiên.
            </strong>{" "}
            Ở mức này, mô hình thỉnh thoảng chọn các từ ít phổ biến hơn, tạo
            ra văn bản nghe tự nhiên hơn nhưng vẫn đáng tin cậy. Phù hợp cho
            email công việc, tóm tắt tài liệu, hoặc dịch thuật.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>
              Temperature 0,7&ndash;1,0: mở cửa cho sáng tạo.
            </strong>{" "}
            Mô hình sẵn sàng khám phá các lựa chọn từ bất ngờ hơn, tạo ra
            nội dung đa dạng và độc đáo. Đây là vùng phù hợp nhất cho viết
            quảng cáo, sáng tác truyện, hoặc tạo ý tưởng mới. Tuy nhiên, cần
            kiểm tra kết quả kỹ hơn vì nguy cơ ảo giác tăng lên.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>ChatGPT tự động điều chỉnh cho người dùng.</strong> Giao
            diện ChatGPT không hiển thị nút chỉnh temperature trực tiếp, mà tự
            động chọn giá trị phù hợp dựa trên loại câu hỏi. API (giao diện
            lập trình &mdash; cổng kết nối cho lập trình viên) cho phép kiểm
            soát chi tiết hơn, với giá trị từ 0 đến 2.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="temperature-in-creative-writing"
      >
        <Metric
          value="Temperature 0 cho kết quả lặp lại gần như 100% — lý tưởng cho tác vụ chính xác"
          sourceRef={1}
        />
        <Metric
          value="Temperature 0,7–0,9 được khuyến nghị phổ biến nhất cho tác vụ sáng tạo"
          sourceRef={2}
        />
        <Metric
          value="API OpenAI hỗ trợ dải temperature từ 0 đến 2, mặc định là 1"
          sourceRef={3}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Temperature"
        topicSlug="temperature-in-creative-writing"
      >
        <p>
          Nếu không có tham số temperature, AI sẽ phải chọn: hoặc luôn trả lời
          cứng nhắc (chọn từ phổ biến nhất), hoặc luôn trả lời ngẫu nhiên. Không
          thể có một mô hình vừa viết code chính xác vừa sáng tác thơ.
        </p>
        <p>
          Temperature cho phép cùng một mô hình ngôn ngữ lớn phục vụ hàng triệu
          trường hợp sử dụng khác nhau &mdash; từ kế toán cần số liệu chính
          xác đến nhà văn cần nguồn cảm hứng &mdash; chỉ bằng cách điều chỉnh
          một con số duy nhất.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
