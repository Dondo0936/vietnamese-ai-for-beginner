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
  slug: "forward-propagation-in-chat-response",
  title: "Forward Propagation in Chat Response",
  titleVi: "Lan truyền xuôi trong Trả lời Chat",
  description:
    "Cách ChatGPT dùng một lượt lan truyền xuôi qua hàng trăm tỉ tham số để sinh từng token trả lời",
  category: "neural-fundamentals",
  tags: ["forward-propagation", "inference", "application"],
  difficulty: "beginner",
  relatedSlugs: ["forward-propagation"],
  vizType: "static",
  applicationOf: "forward-propagation",
  featuredApp: {
    name: "ChatGPT",
    productFeature: "Token Generation",
    company: "OpenAI",
    countryOrigin: "US",
  },
  sources: [
    {
      title:
        "ChatGPT's Technical Foundations: Transformers to RLHF",
      publisher: "IntuitionLabs",
      url: "https://intuitionlabs.ai/articles/key-innovations-behind-chatgpt",
      date: "2023-06",
      kind: "engineering-blog",
    },
    {
      title:
        "All About Transformer Inference: How to Scale Your Model",
      publisher: "JAX ML — The Scaling Book",
      url: "https://jax-ml.github.io/scaling-book/inference/",
      date: "2024-01",
      kind: "documentation",
    },
    {
      title: "Attention Is All You Need",
      publisher: "Vaswani et al., NeurIPS 2017",
      url: "https://arxiv.org/abs/1706.03762",
      date: "2017-06",
      kind: "paper",
    },
    {
      title:
        "The Full GPT Architecture: Understanding the End-to-End Forward Pass",
      publisher: "Shreyash Mogaveera (Medium)",
      url: "https://medium.com/@shreyashmogaveera/the-full-gpt-architecture-understanding-the-end-to-end-forward-pass-538acfb6238d",
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

export default function ForwardPropagationInChatResponse() {
  return (
    <ApplicationLayout metadata={metadata} parentTitleVi="Lan truyền xuôi">
      <ApplicationHero
        parentTitleVi="Lan truyền xuôi"
        topicSlug="forward-propagation-in-chat-response"
      >
        <p>
          Bạn gõ một câu hỏi vào ChatGPT (chatbot AI của OpenAI) và thấy câu
          trả lời hiện ra từng từ, mượt mà như ai đó đang đánh máy. Mỗi từ
          (chính xác hơn là mỗi token &mdash; đơn vị văn bản nhỏ nhất mà mô
          hình xử lý) xuất hiện nhờ một lượt lan truyền xuôi (forward
          propagation &mdash; quá trình dữ liệu đi từ đầu vào qua các tầng
          đến đầu ra) xuyên qua toàn bộ mạng nơ-ron.
        </p>
        <p>
          GPT-4 có hàng trăm tỉ tham số (parameter &mdash; các giá trị mà mô
          hình đã học). Mỗi lượt forward pass thực hiện khoảng 2N phép
          nhân-cộng (với N là số tham số) &mdash; một khối lượng tính toán khổng
          lồ, nhưng chỉ mất vài chục mili-giây nhờ GPU song song hóa.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="forward-propagation-in-chat-response">
        <p>
          Khi bạn hỏi ChatGPT, mô hình cần đọc toàn bộ đoạn hội thoại trước
          đó (context &mdash; ngữ cảnh), rồi dự đoán token tiếp theo phù hợp
          nhất. Với mỗi token mới, quá trình này lặp lại &mdash; nghĩa là một
          câu trả lời 200 từ cần khoảng 250-300 lượt forward pass liên tiếp.
        </p>
        <p>
          Thách thức: mỗi lượt forward pass phải đi qua hàng trăm tầng
          Transformer (kiến trúc mạng nơ-ron dùng cơ chế chú ý), xử lý hàng
          trăm tỉ phép tính &mdash; nhưng người dùng kỳ vọng phản hồi trong
          vài giây. Nếu forward pass chậm, trải nghiệm chat thời gian thực sẽ
          bất khả thi.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Lan truyền xuôi"
        topicSlug="forward-propagation-in-chat-response"
      >
        <Beat step={1}>
          <p>
            <strong>Mã hóa đầu vào (tokenization + embedding).</strong> Câu hỏi
            của bạn được tách thành token bằng BPE (Byte Pair Encoding &mdash;
            mã hóa cặp byte). Mỗi token được ánh xạ thành vector nhúng
            (embedding vector &mdash; mảng số biểu diễn ý nghĩa) có hàng ngàn
            chiều. Vector vị trí (positional encoding &mdash; thông tin về thứ
            tự từ) được cộng vào để mô hình biết thứ tự các token.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>
              Lan truyền qua các tầng Transformer.
            </strong>{" "}
            Vector đi qua hàng trăm tầng Transformer nối tiếp. Mỗi tầng gồm
            hai bước chính: (1) Multi-Head Attention (cơ chế chú ý đa đầu
            &mdash; cho phép mỗi token &ldquo;nhìn&rdquo; mọi token trước đó)
            và (2) Feed-Forward Network (mạng lan truyền tiến &mdash; hai tầng
            tuyến tính với hàm kích hoạt ở giữa). Dữ liệu chỉ đi một
            chiều &mdash; từ tầng đầu đến tầng cuối &mdash; đó là bản chất của
            lan truyền xuôi.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>Dự đoán token tiếp theo.</strong> Tầng cuối cho ra vector
            xác suất trên toàn bộ từ vựng (vocabulary &mdash; tập hợp tất cả
            token có thể). Hệ thống chọn token có xác suất cao (hoặc lấy mẫu
            với nhiệt độ temperature để tăng tính sáng tạo). Token mới được
            thêm vào chuỗi, và forward pass tiếp theo bắt đầu.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>
              Tối ưu bằng KV Cache (bộ nhớ đệm khóa-giá trị).
            </strong>{" "}
            Thay vì tính lại toàn bộ chuỗi mỗi lượt, hệ thống lưu key và
            value (khóa và giá trị &mdash; kết quả trung gian của attention) từ
            các token trước vào bộ nhớ đệm. Forward pass cho token mới chỉ cần
            tính phần gia tăng &mdash; tiết kiệm hàng tỉ phép tính mỗi bước.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="forward-propagation-in-chat-response"
      >
        <Metric
          value="Mỗi forward pass thực hiện ~2N phép nhân-cộng (N = số tham số phi embedding)"
          sourceRef={2}
        />
        <Metric
          value="KV Cache giúp forward pass cho token mới chỉ xử lý 1 token thay vì toàn bộ chuỗi"
          sourceRef={2}
        />
        <Metric
          value="Kiến trúc Transformer gốc cho phép song song hóa hoàn toàn trên GPU, khác hẳn mạng hồi quy tuần tự"
          sourceRef={3}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Lan truyền xuôi"
        topicSlug="forward-propagation-in-chat-response"
      >
        <p>
          Nếu không có forward propagation &mdash; tức là không có cơ chế
          truyền dữ liệu có hệ thống qua các tầng &mdash; mạng nơ-ron sẽ
          không thể biến đầu vào thành đầu ra. Không có forward pass, không
          có ChatGPT.
        </p>
        <p>
          Hơn nữa, nếu không có KV Cache tối ưu forward pass, mỗi token mới
          sẽ phải tính lại từ đầu toàn bộ chuỗi hội thoại. Một câu trả lời
          200 token sẽ chậm gấp hàng trăm lần &mdash; trải nghiệm chat thời
          gian thực sẽ không tồn tại.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
