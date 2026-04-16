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
  slug: "calculus-for-backprop-in-model-training",
  title: "Calculus for Backpropagation in Model Training",
  titleVi: "Giải tích & Lan truyền ngược trong Huấn luyện Mô hình",
  description:
    "Cách Meta dùng quy tắc chuỗi, AdamW và gradient checkpointing để huấn luyện LLaMA 3.1 405 tỷ tham số trên 16.384 GPU H100 trong 54 ngày",
  category: "math-foundations",
  tags: ["calculus", "backpropagation", "model-training", "application"],
  difficulty: "intermediate",
  relatedSlugs: ["calculus-for-backprop"],
  vizType: "static",
  applicationOf: "calculus-for-backprop",
  featuredApp: {
    name: "LLaMA 3.1",
    productFeature: "405B Model Training",
    company: "Meta Platforms Inc.",
    countryOrigin: "US",
  },
  sources: [
    {
      title:
        "Language Models are Few-Shot Learners",
      publisher:
        "Tom Brown et al. — NeurIPS 2020",
      url: "https://arxiv.org/abs/2005.14165",
      date: "2020-07",
      kind: "paper",
    },
    {
      title: "LLaMA: Open and Efficient Foundation Language Models",
      publisher: "Hugo Touvron et al. — Meta AI, 2023",
      url: "https://arxiv.org/abs/2302.13971",
      date: "2023-02",
      kind: "paper",
    },
    {
      title:
        "Efficient Large-Scale Language Model Training on GPU Clusters Using Megatron-LM",
      publisher:
        "Deepak Narayanan et al. — SC 2021",
      url: "https://arxiv.org/abs/2104.04473",
      date: "2021-11",
      kind: "paper",
    },
    {
      title: "The Llama 3 Herd of Models",
      publisher: "Meta AI, 2024",
      url: "https://arxiv.org/abs/2407.21783",
      date: "2024-07",
      kind: "paper",
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

export default function CalculusForBackpropInModelTraining() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Giải tích cho lan truyền ngược"
    >
      <ApplicationHero
        parentTitleVi="Giải tích cho lan truyền ngược"
        topicSlug="calculus-for-backprop-in-model-training"
      >
        <p>
          Tháng 1 năm 2024, Meta (tập đoàn công nghệ sở hữu Facebook,
          Instagram) bắt đầu huấn luyện LLaMA 3.1 405B &mdash; mô hình ngôn
          ngữ lớn mã nguồn mở với 405 tỷ (billion) tham số. Cụm máy gồm 16.384
          GPU H100 (bộ xử lý đồ hoạ chuyên dụng cho AI) chạy liên tục 54 ngày,
          tiêu tốn tổng cộng khoảng 30,84 triệu giờ GPU.
        </p>
        <p>
          Đằng sau mỗi bước huấn luyện là phép lan truyền ngược
          (backpropagation) &mdash; thuật toán dùng quy tắc chuỗi (chain rule)
          từ giải tích để tính đạo hàm riêng (partial derivative) của hàm mất
          mát (loss function) theo từng tham số. Không có giải tích, không thể
          &ldquo;dạy&rdquo; mô hình học từ dữ liệu.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="calculus-for-backprop-in-model-training">
        <p>
          LLaMA 3.1 405B phải học từ 15,6 nghìn tỷ (trillion) token (đơn vị
          văn bản, thường là một từ hoặc phần từ). Mô hình có 405 tỷ tham số
          &mdash; mỗi tham số là một con số cần điều chỉnh để dự đoán token
          tiếp theo chính xác hơn.
        </p>
        <p>
          Vấn đề cốt lõi: làm sao tính được hướng cập nhật đúng cho mỗi tham
          số trong mạng 126 lớp (layer), khi mỗi lớp phụ thuộc vào đầu ra của
          lớp trước? Tổng lượng tính toán lên tới 3,8 &times; 10
          <sup>25</sup> FLOP (phép tính dấu phẩy động) &mdash; tương đương hàng
          triệu năm nếu chạy trên một máy tính thông thường.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Giải tích cho lan truyền ngược"
        topicSlug="calculus-for-backprop-in-model-training"
      >
        <Beat step={1}>
          <p>
            <strong>
              Lan truyền xuôi (forward pass) &mdash; tính đầu ra từ đầu vào.
            </strong>{" "}
            Mỗi batch (lô dữ liệu) gồm hàng triệu token được đưa qua 126 lớp
            Transformer. Mỗi lớp thực hiện phép nhân ma trận, hàm kích hoạt
            (activation function &mdash; hàm phi tuyến giúp mô hình học quan hệ
            phức tạp), rồi truyền kết quả sang lớp tiếp theo. Cuối cùng, hàm
            mất mát cross-entropy so sánh dự đoán với token thật để ra một con
            số duy nhất: L (loss &mdash; sai số).
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>
              Lan truyền ngược (backward pass) &mdash; quy tắc chuỗi chạy
              ngược.
            </strong>{" "}
            Thuật toán backpropagation áp dụng quy tắc chuỗi (chain rule) của
            giải tích: &part;L/&part;w = (&part;L/&part;a&#8345;)
            &sdot;(&part;a&#8345;/&part;a&#8345;&#8331;&#8321;)&sdot;&hellip;&sdot;(&part;a&#8321;/&part;w).
            Nghĩa là gradient (đạo hàm riêng) của mỗi tham số w được tính bằng
            cách nhân chuỗi các đạo hàm từ đầu ra ngược về đầu vào. Mỗi lớp
            chỉ cần tính đạo hàm cục bộ của mình, rồi nhân với gradient truyền
            từ lớp phía sau.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>
              AdamW cập nhật tham số &mdash; bộ tối ưu thông minh hơn gradient
              descent cơ bản.
            </strong>{" "}
            Thay vì trừ thẳng gradient, AdamW (Adaptive Moment Estimation with
            Weight Decay) theo dõi trung bình động (moving average) của gradient
            (m&#770;) và bình phương gradient (v&#770;), rồi cập nhật: w &larr;
            w &minus; &eta;&sdot;m&#770;/(&radic;v&#770; + &epsilon;). Trong đó
            &eta; (eta) là tốc độ học (learning rate), &epsilon; ngăn chia cho
            0. Cách này giúp tham số hội tụ nhanh và ổn định hơn trên 405 tỷ
            chiều.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>
              Gradient checkpointing &mdash; đánh đổi tính toán lấy bộ nhớ.
            </strong>{" "}
            Khi lan truyền ngược, thuật toán cần giá trị trung gian
            (activation) từ mỗi lớp. Lưu toàn bộ 126 lớp tiêu tốn bộ nhớ
            O(n). Gradient checkpointing chỉ lưu tại một số lớp chọn trước, khi
            cần thì tính lại phần còn lại &mdash; giảm bộ nhớ xuống O(&radic;n)
            nhưng tăng khoảng 30% lượng tính toán. Đây là sự đánh đổi cần
            thiết khi mỗi GPU chỉ có 80 GB HBM3 (bộ nhớ băng thông cao).
          </p>
        </Beat>
        <Beat step={5}>
          <p>
            <strong>
              Song song hoá gradient &mdash; 16.384 GPU tính cùng lúc.
            </strong>{" "}
            Meta kết hợp ba chiến lược: tensor parallelism (chia từng lớp ra
            nhiều GPU), pipeline parallelism (chia các lớp thành nhóm nối tiếp
            trên các GPU khác nhau), và data parallelism (mỗi nhóm GPU xử lý
            batch dữ liệu riêng rồi đồng bộ gradient). Gradient accumulation
            (tích luỹ gradient qua nhiều micro-batch) cho phép đạt batch hiệu
            dụng (effective batch size) khoảng 4 triệu token mà không vượt quá
            bộ nhớ. Tất cả đều dùng BF16 (bfloat16 &mdash; định dạng số thực
            16-bit giữ dải giá trị rộng) để tiết kiệm bộ nhớ gấp đôi so với
            FP32 truyền thống.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="calculus-for-backprop-in-model-training"
      >
        <Metric
          value="405 tỷ tham số, tổng cộng 3,8 × 10²⁵ FLOP để huấn luyện"
          sourceRef={4}
        />
        <Metric
          value="16.384 GPU H100, 54 ngày huấn luyện liên tục, 30,84 triệu giờ GPU"
          sourceRef={4}
        />
        <Metric
          value="LLaMA-13B (chỉ 13 tỷ tham số) vượt GPT-3 175B trên đa số benchmark"
          sourceRef={2}
        />
        <Metric
          value="Megatron-LM đạt 52% hiệu suất đỉnh GPU khi huấn luyện mô hình lớn"
          sourceRef={3}
        />
        <Metric
          value="419 sự cố phần cứng bất ngờ trong quá trình huấn luyện LLaMA 3.1"
          sourceRef={4}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Giải tích cho lan truyền ngược"
        topicSlug="calculus-for-backprop-in-model-training"
      >
        <p>
          Không có quy tắc chuỗi, không có cách nào tính gradient cho 405 tỷ
          tham số qua 126 lớp. Mỗi tham số sẽ phải được thử sai (perturbation)
          riêng lẻ &mdash; cần hàng trăm tỷ lần lan truyền xuôi cho một bước
          cập nhật duy nhất, biến bài toán 54 ngày thành hàng triệu năm.
        </p>
        <p>
          Backpropagation biến chi phí tính gradient từ O(n) lần forward pass
          (với n là số tham số) thành O(1) &mdash; chỉ cần một lần lan truyền
          ngược duy nhất. Kết hợp với AdamW, gradient checkpointing và song
          song hoá, giải tích là nền tảng toán học duy nhất khiến việc huấn
          luyện mô hình hàng trăm tỷ tham số trở nên khả thi.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
