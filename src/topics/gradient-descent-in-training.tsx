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
  slug: "gradient-descent-in-training",
  title: "Gradient Descent in GPT-4 Training",
  titleVi: "Gradient Descent trong Huấn luyện GPT-4",
  description:
    "Cách AdamW và learning rate schedule giúp tối ưu hàng trăm tỉ tham số của GPT-4 trên hàng ngàn GPU",
  category: "neural-fundamentals",
  tags: ["gradient-descent", "optimization", "application"],
  difficulty: "beginner",
  relatedSlugs: ["gradient-descent"],
  vizType: "static",
  applicationOf: "gradient-descent",
  featuredApp: {
    name: "GPT-4",
    productFeature: "Large-Scale Training",
    company: "OpenAI",
    countryOrigin: "US",
  },
  sources: [
    {
      title:
        "Decoupled Weight Decay Regularization (AdamW)",
      publisher: "Loshchilov & Hutter, ICLR 2019",
      url: "https://arxiv.org/abs/1711.05101",
      date: "2019-01",
      kind: "paper",
    },
    {
      title:
        "Analyzing & Reducing the Need for Learning Rate Warmup in GPT Training",
      publisher: "arXiv",
      url: "https://arxiv.org/html/2410.23922v1",
      date: "2024-10",
      kind: "paper",
    },
    {
      title: "Training Compute-Optimal Large Language Models (Chinchilla)",
      publisher: "Hoffmann et al., arXiv (DeepMind)",
      url: "https://arxiv.org/pdf/2203.15556",
      date: "2022-03",
      kind: "paper",
    },
    {
      title: "Scaling Laws for LLMs: From GPT-3 to o3",
      publisher: "Cameron R. Wolfe (Substack)",
      url: "https://cameronrwolfe.substack.com/p/llm-scaling-laws",
      date: "2024-06",
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

export default function GradientDescentInTraining() {
  return (
    <ApplicationLayout metadata={metadata} parentTitleVi="Gradient Descent">
      <ApplicationHero
        parentTitleVi="Gradient Descent"
        topicSlug="gradient-descent-in-training"
      >
        <p>
          GPT-4 (mô hình ngôn ngữ lớn thế hệ thứ 4 của OpenAI) có hàng trăm
          tỉ tham số (parameter &mdash; giá trị mà mô hình học được). Để huấn
          luyện mô hình này, OpenAI cần một thuật toán có thể tìm giá trị tối
          ưu cho tất cả tham số cùng lúc &mdash; trong không gian có hàng trăm
          tỉ chiều.
        </p>
        <p>
          Thuật toán đó là gradient descent (giảm gradient &mdash; di chuyển
          theo hướng giảm nhanh nhất của hàm mất mát). Cụ thể, OpenAI dùng
          biến thể AdamW (Adam with decoupled Weight decay &mdash; thuật toán
          tối ưu thích ứng kết hợp suy giảm trọng số) &mdash; tiêu chuẩn
          vàng cho huấn luyện Transformer &mdash; kết hợp lịch trình tốc
          độ học (learning rate schedule &mdash; cách thay đổi bước nhảy theo
          thời gian) để hội tụ ổn định.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="gradient-descent-in-training">
        <p>
          Bề mặt mất mát (loss surface &mdash; đồ thị hàm mất mát trong không
          gian tham số) của mô hình hàng trăm tỉ tham số cực kỳ phức tạp:
          đầy cực tiểu cục bộ (local minimum), điểm yên ngựa (saddle point),
          và vùng phẳng (plateau). SGD cơ bản (Stochastic Gradient Descent
          &mdash; giảm gradient ngẫu nhiên) có thể bị mắc kẹt hoặc dao động
          mãi không hội tụ.
        </p>
        <p>
          Thêm vào đó, huấn luyện phân tán trên hàng ngàn GPU tạo ra thách
          thức đồng bộ: gradient tính trên mỗi GPU phải được tổng hợp chính
          xác, learning rate phải phối hợp để mô hình không phân kỳ
          (diverge &mdash; mất mát tăng thay vì giảm).
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Gradient Descent"
        topicSlug="gradient-descent-in-training"
      >
        <Beat step={1}>
          <p>
            <strong>Tính gradient trên mini-batch.</strong> Dữ liệu huấn luyện
            được chia thành các mini-batch (lô nhỏ &mdash; nhóm mẫu dữ liệu
            xử lý cùng lúc). Mỗi GPU xử lý một phần batch, tính gradient cục
            bộ (local gradient &mdash; hướng giảm mất mát dựa trên dữ liệu
            cục bộ). Gradient từ tất cả GPU được tổng hợp qua all-reduce
            (phép giao tiếp tập thể &mdash; tổng hợp kết quả từ nhiều GPU).
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>
              AdamW cập nhật tham số.
            </strong>{" "}
            AdamW duy trì hai trạng thái cho mỗi tham số: (1) momentum (trung
            bình động bậc 1 của gradient &mdash; giúp vượt qua vùng phẳng) và
            (2) ước lượng phương sai (trung bình động bậc 2 &mdash; tự điều
            chỉnh bước nhảy cho mỗi tham số). Đặc biệt, AdamW tách riêng
            weight decay (suy giảm trọng số &mdash; phạt giá trị lớn) khỏi
            gradient update, cải thiện generalization (khả năng tổng quát hóa
            &mdash; hoạt động tốt trên dữ liệu mới).
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>
              Learning rate warmup rồi decay (khởi động rồi suy giảm).
            </strong>{" "}
            Giai đoạn warmup: learning rate tăng tuyến tính từ gần 0 đến đỉnh
            (peak) trong khoảng 750 triệu token đầu tiên. Điều này tránh
            gradient quá lớn khi trọng số còn ngẫu nhiên. Sau đó, learning
            rate giảm dần theo cosine schedule (lịch trình cosine) xuống còn
            ~10% giá trị đỉnh. Peak learning rate cho LLM lớn thường trong
            khoảng 4&times;10^{"{-4}"} đến 6&times;10^{"{-4}"}.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>Distributed training với ZeRO.</strong> Để tiết kiệm bộ
            nhớ, hệ thống dùng DeepSpeed ZeRO (Zero Redundancy Optimizer
            &mdash; tối ưu không dư thừa) chia trạng thái optimizer, gradient
            và tham số mô hình qua nhiều GPU. Mỗi GPU chỉ giữ một phần
            &mdash; giảm bộ nhớ gấp nhiều lần so với sao chép toàn bộ.
          </p>
        </Beat>
        <Beat step={5}>
          <p>
            <strong>Gradient clipping giữ ổn định.</strong> Gradient được cắt
            ngưỡng (gradient clipping &mdash; giới hạn độ lớn gradient) để
            tránh bùng nổ gradient (exploding gradient &mdash; gradient quá
            lớn gây mất ổn định). Thường cắt ở norm = 1.0. Bước này đặc biệt
            quan trọng cho mô hình cỡ lớn với batch size hàng triệu token.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="gradient-descent-in-training"
      >
        <Metric
          value="AdamW dùng weight decay tách riêng, cải thiện generalization so với Adam chuẩn cho Transformer"
          sourceRef={1}
        />
        <Metric
          value="Learning rate warmup trong ~750M token đầu, sau đó decay theo cosine xuống 10% giá trị đỉnh"
          sourceRef={2}
        />
        <Metric
          value="Chinchilla (2022) chỉ ra: mô hình tối ưu cần ~20 token/tham số — gradient descent phải hiệu quả ở mọi bước"
          sourceRef={3}
        />
        <Metric
          value="Peak learning rate cho LLM lớn nằm trong khoảng 4e-4 đến 6e-4 khi dùng AdamW"
          sourceRef={4}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Gradient Descent"
        topicSlug="gradient-descent-in-training"
      >
        <p>
          Nếu dùng SGD thuần thay AdamW, mô hình hàng trăm tỉ tham số sẽ cần
          tinh chỉnh learning rate thủ công cho từng nhóm tham số &mdash; gần
          như bất khả thi. AdamW tự thích ứng bước nhảy cho mỗi tham số, giúp
          huấn luyện ổn định hơn đáng kể.
        </p>
        <p>
          Không có learning rate schedule (warmup + decay), mô hình dễ phân kỳ
          ở giai đoạn đầu hoặc hội tụ quá chậm ở giai đoạn sau. Không có
          gradient clipping, một batch &ldquo;xấu&rdquo; duy nhất có thể phá
          hỏng toàn bộ quá trình huấn luyện đã tốn hàng triệu đô-la tính
          toán.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
