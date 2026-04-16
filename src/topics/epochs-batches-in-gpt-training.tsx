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
  slug: "epochs-batches-in-gpt-training",
  title: "Epochs & Batches in GPT Training",
  titleVi: "Epochs & Batches trong Huấn luyện GPT",
  description:
    "Tại sao GPT-4 và LLaMA chỉ huấn luyện ~1 epoch trên dữ liệu internet, nhưng dùng hàng triệu batch",
  category: "neural-fundamentals",
  tags: ["epochs-batches", "training", "application"],
  difficulty: "beginner",
  relatedSlugs: ["epochs-batches"],
  vizType: "static",
  applicationOf: "epochs-batches",
  featuredApp: {
    name: "GPT-4 / LLaMA",
    productFeature: "Large-Scale Pretraining",
    company: "OpenAI / Meta AI",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "Training Compute-Optimal Large Language Models (Chinchilla)",
      publisher: "Hoffmann et al., arXiv (DeepMind)",
      url: "https://arxiv.org/pdf/2203.15556",
      date: "2022-03",
      kind: "paper",
    },
    {
      title: "Scaling Data-Constrained Language Models",
      publisher: "Muennighoff et al., arXiv",
      url: "https://arxiv.org/pdf/2305.16264",
      date: "2023-05",
      kind: "paper",
    },
    {
      title: "Llama 2: Open Foundation and Fine-Tuned Chat Models",
      publisher: "Meta AI (Touvron et al.)",
      url: "https://huggingface.co/meta-llama/Llama-2-7b",
      date: "2023-07",
      kind: "documentation",
    },
    {
      title: "Chinchilla Scaling Laws: Compute-Optimal LLM Training",
      publisher: "Michael Brenndoerfer",
      url: "https://mbrenndoerfer.com/writing/chinchilla-scaling-laws-compute-optimal-llm-training",
      date: "2024-01",
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

export default function EpochsBatchesInGptTraining() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Epochs, Batches & Iterations"
    >
      <ApplicationHero
        parentTitleVi="Epochs, Batches & Iterations"
        topicSlug="epochs-batches-in-gpt-training"
      >
        <p>
          Khi huấn luyện mạng nơ-ron phân loại ảnh, bạn thường chạy hàng chục
          đến hàng trăm epoch (kỷ nguyên &mdash; một lượt duyệt qua toàn bộ
          dữ liệu). Nhưng GPT-4 (mô hình ngôn ngữ lớn của OpenAI) và LLaMA
          (Large Language Model Meta AI &mdash; mô hình ngôn ngữ lớn của
          Meta) chỉ huấn luyện khoảng 1 epoch trên dữ liệu văn bản internet.
        </p>
        <p>
          Lý do: dữ liệu quá lớn &mdash; hàng nghìn tỉ token (đơn vị văn bản
          nhỏ nhất mà mô hình xử lý). Với lượng dữ liệu khổng lồ như vậy,
          mô hình đã &ldquo;thấy&rdquo; đủ mẫu trong một lượt. Nhưng mỗi
          lượt duyệt đó bao gồm hàng triệu batch (lô &mdash; nhóm mẫu dữ
          liệu xử lý cùng lúc) &mdash; mỗi batch là một bước cập nhật trọng
          số.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="epochs-batches-in-gpt-training">
        <p>
          Dữ liệu huấn luyện LLM có quy mô chưa từng có: LLaMA 2 dùng 2
          nghìn tỉ (2T) token, các mô hình lớn hơn còn dùng nhiều hơn. Không
          thể đưa tất cả vào bộ nhớ GPU cùng lúc &mdash; phải chia thành
          batch.
        </p>
        <p>
          Câu hỏi quan trọng: nên chạy nhiều epoch (lặp lại dữ liệu) với ít
          dữ liệu, hay chạy ít epoch với nhiều dữ liệu? Và batch size (kích
          thước lô) lớn bao nhiêu là tối ưu? Câu trả lời ảnh hưởng trực tiếp
          đến chi phí huấn luyện hàng chục triệu đô-la và chất lượng mô hình
          cuối cùng.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Epochs, Batches & Iterations"
        topicSlug="epochs-batches-in-gpt-training"
      >
        <Beat step={1}>
          <p>
            <strong>
              Quy luật Chinchilla: ~20 token/tham số, ~1 epoch.
            </strong>{" "}
            DeepMind phát hiện (2022) rằng mô hình tối ưu tính toán cần khoảng
            20 token dữ liệu cho mỗi tham số. GPT-3 chỉ dùng 1,7 token/tham
            số &mdash; quá ít. Chinchilla 70B dùng 1,4T token (20
            token/tham số), đạt hiệu năng tốt hơn nhiều. Với tỉ lệ này, dữ
            liệu internet đủ lớn để 1 epoch là tối ưu.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>
              Batch size hàng triệu token.
            </strong>{" "}
            LLaMA 2 dùng global batch size (tổng batch trên tất cả GPU) là 4
            triệu token. Với sequence length (độ dài chuỗi) 4.096 token, mỗi
            batch chứa khoảng 1.000 chuỗi. Batch lớn giúp gradient ổn định
            hơn (trung bình trên nhiều mẫu) và tận dụng tối đa GPU song
            song, nhưng cần learning rate phù hợp.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>
              Hàng triệu iterations trong 1 epoch.
            </strong>{" "}
            Với 2T token chia cho batch 4M token = khoảng 500.000 iteration
            (lần lặp &mdash; một bước cập nhật trọng số). Mỗi iteration, mô
            hình tính forward pass, backward pass, và cập nhật tham số. Toàn
            bộ 500.000 bước này tạo thành 1 epoch. Quá trình kéo dài hàng
            tháng trên hàng ngàn GPU.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>
              Lặp lại dữ liệu (&gt;1 epoch) gây hại.
            </strong>{" "}
            Nghiên cứu 2023 cho thấy: khi dữ liệu bị lặp quá 4 epoch, giá
            trị biên (marginal value) giảm nhanh &mdash; mô hình bắt đầu
            &ldquo;thuộc lòng&rdquo; (memorize) thay vì học mẫu tổng quát.
            Dữ liệu mới có giá trị hơn nhiều so với lặp lại dữ liệu cũ. Vì
            vậy, các lab AI đầu tư mạnh vào thu thập và làm sạch dữ liệu mới
            thay vì chạy nhiều epoch.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="epochs-batches-in-gpt-training"
      >
        <Metric
          value="Chinchilla (70B tham số, 1,4T token) vượt trội Gopher (280B tham số, 300B token) — dữ liệu quan trọng hơn kích thước mô hình"
          sourceRef={1}
        />
        <Metric
          value="LLaMA 2 huấn luyện trên 2T token với global batch size 4M token — khoảng 500.000 iterations"
          sourceRef={3}
        />
        <Metric
          value="Tỉ lệ tối ưu Chinchilla: ~20 token dữ liệu cho mỗi tham số mô hình"
          sourceRef={4}
        />
        <Metric
          value="Lặp dữ liệu quá 4 epoch khiến giá trị biên giảm nhanh — ưu tiên dữ liệu mới hơn nhiều epoch"
          sourceRef={2}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Epochs, Batches & Iterations"
        topicSlug="epochs-batches-in-gpt-training"
      >
        <p>
          Nếu GPT-3 được huấn luyện với tỉ lệ Chinchilla (20 token/tham số
          thay vì 1,7), nó sẽ cần 3,5T token &mdash; và có thể đạt hiệu năng
          tương đương một mô hình lớn hơn nhiều. Chinchilla 70B đã chứng minh
          điều này: nhỏ hơn Gopher 4 lần nhưng mạnh hơn.
        </p>
        <p>
          Hiểu đúng mối quan hệ giữa epoch, batch size, và tổng dữ liệu là
          khác biệt giữa lãng phí hàng triệu đô-la tính toán và huấn luyện
          mô hình tối ưu. Đây không chỉ là khái niệm lý thuyết &mdash; nó
          quyết định chi phí và chất lượng của mọi LLM hiện đại.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
