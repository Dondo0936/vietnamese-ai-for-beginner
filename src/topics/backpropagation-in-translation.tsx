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
  slug: "backpropagation-in-translation",
  title: "Backpropagation in Translation",
  titleVi: "Lan truyền ngược trong Dịch thuật",
  description:
    "Cách Google Translate dùng lan truyền ngược để huấn luyện mạng nơ-ron sâu, cắt giảm 60% lỗi dịch",
  category: "neural-fundamentals",
  tags: ["backpropagation", "translation", "application"],
  difficulty: "intermediate",
  relatedSlugs: ["backpropagation"],
  vizType: "static",
  applicationOf: "backpropagation",
  featuredApp: {
    name: "Google Translate",
    productFeature: "Neural Machine Translation",
    company: "Google LLC",
    countryOrigin: "US",
  },
  sources: [
    {
      title:
        "Google's Neural Machine Translation System: Bridging the Gap between Human and Machine Translation",
      publisher: "arXiv (Google Research)",
      url: "https://arxiv.org/abs/1609.08144",
      date: "2016-09",
      kind: "paper",
    },
    {
      title: "A Neural Network for Machine Translation, at Production Scale",
      publisher: "Google Research Blog",
      url: "https://research.google/blog/a-neural-network-for-machine-translation-at-production-scale/",
      date: "2016-09",
      kind: "engineering-blog",
    },
    {
      title: "Recent Advances in Google Translate",
      publisher: "Google Research Blog",
      url: "https://research.google/blog/recent-advances-in-google-translate/",
      date: "2020-06",
      kind: "engineering-blog",
    },
    {
      title: "Attention Is All You Need",
      publisher: "arXiv (Google Brain / NeurIPS 2017)",
      url: "https://arxiv.org/abs/1706.03762",
      date: "2017-06",
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

export default function BackpropagationInTranslation() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Lan truyền ngược"
    >
      <ApplicationHero
        parentTitleVi="Lan truyền ngược"
        topicSlug="backpropagation-in-translation"
      >
        <p>
          Bạn mở Google Translate (dịch vụ dịch thuật trực tuyến của Google),
          gõ một câu tiếng Việt dài và phức tạp, rồi nhận lại bản dịch tiếng
          Anh đọc được gần như tự nhiên. Trước năm 2016, cùng câu đó sẽ cho ra
          kết quả rời rạc, ngữ pháp sai, nghĩa lệch.
        </p>
        <p>
          Google đã thay thế hệ thống dịch thống kê cũ bằng GNMT (Google Neural
          Machine Translation &mdash; hệ thống dịch máy thần kinh của Google)
          &mdash; một mạng nơ-ron sâu (deep neural network &mdash; mạng có
          nhiều tầng xử lý chồng lên nhau) được huấn luyện bằng lan truyền
          ngược (backpropagation &mdash; thuật toán tính gradient ngược từ đầu
          ra về đầu vào). Nhờ thuật toán này, mạng tự điều chỉnh hàng triệu
          tham số (parameter &mdash; các giá trị mà mô hình học được) để giảm
          sai lệch giữa bản dịch máy và bản dịch con người, cắt giảm lỗi dịch
          trung bình tới 60%.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="backpropagation-in-translation">
        <p>
          Dịch máy truyền thống dùng phương pháp thống kê: tách câu nguồn thành
          cụm từ, dịch riêng lẻ, rồi ghép lại. Ba vấn đề lớn: ngữ cảnh bị
          mất, ngữ pháp bị phá vỡ, từ hiếm bị bỏ qua.
        </p>
        <p>
          Google cần xem toàn bộ câu nguồn như một đơn vị duy nhất, rồi sinh ra
          câu đích trọn vẹn. Mạng nơ-ron encoder-decoder (mã hóa-giải mã
          &mdash; kiến trúc gồm phần nén đầu vào và phần sinh đầu ra) có thể
          làm điều này. Nhưng chỉ khi có thuật toán huấn luyện hiệu quả để
          điều chỉnh đồng thời hàng triệu trọng số (weight &mdash; giá trị kết
          nối giữa các nút trong mạng). Thuật toán đó chính là lan truyền ngược.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Lan truyền ngược"
        topicSlug="backpropagation-in-translation"
      >
        <Beat step={1}>
          <p>
            <strong>Mã hóa câu nguồn.</strong> Câu đầu vào được tách thành
            wordpiece (đơn vị từ con &mdash; chia từ thành mảnh nhỏ hơn) rồi
            đưa qua bộ mã hóa 8 tầng LSTM (Long Short-Term Memory &mdash; bộ
            nhớ dài-ngắn hạn, một loại mạng hồi quy), mỗi tầng 1.024 nút. Bộ
            mã hóa nén toàn bộ câu thành chuỗi vector ngữ nghĩa (véc-tơ biểu
            diễn ý nghĩa). Kết nối tắt (residual connection &mdash; đường tắt
            cho tín hiệu đi thẳng qua tầng) giúp gradient (đạo hàm chỉ hướng
            cập nhật) không bị triệt tiêu khi lan truyền ngược qua mạng sâu.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>Giải mã câu đích.</strong> Bộ giải mã 8 tầng LSTM sinh
            từng từ con một. Cơ chế chú ý (attention &mdash; cho phép mô hình
            tập trung vào phần quan trọng) nối tầng dưới cùng giải mã với tầng
            trên cùng mã hóa, cho phép mô hình nhìn lại đúng phần câu nguồn
            khi sinh mỗi từ đích.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>Tính hàm mất mát và lan truyền ngược.</strong> So sánh bản
            dịch dự đoán với bản dịch đúng bằng cross-entropy (hàm đo sai lệch
            giữa phân phối dự đoán và thực tế). Lan truyền ngược tính gradient
            theo từng trọng số &mdash; từ tầng giải mã cuối ngược về tầng mã
            hóa đầu. Gradient được cắt ngưỡng ở 5,0 (gradient clipping &mdash;
            giới hạn giá trị gradient để tránh bùng nổ). Hệ thống dùng Adam
            (thuật toán tối ưu thích ứng) trong 60.000 bước đầu rồi chuyển sang
            SGD (Stochastic Gradient Descent &mdash; giảm gradient ngẫu nhiên).
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>Tinh chỉnh bằng học tăng cường.</strong> Sau cross-entropy,
            mô hình được tinh chỉnh bằng phần thưởng GLEU (biến thể BLEU ở mức
            câu &mdash; thước đo chất lượng dịch). Hàm mục tiêu cuối = tổ hợp
            tuyến tính maximum likelihood (ước lượng hợp lý cực đại) + RL
            (Reinforcement Learning &mdash; học tăng cường) với &alpha; = 0,017.
            Bước này cũng dùng lan truyền ngược để cập nhật trọng số.
          </p>
        </Beat>
        <Beat step={5}>
          <p>
            <strong>Nâng cấp lên Transformer (2020).</strong> Google thay bộ mã
            hóa LSTM bằng Transformer (kiến trúc chỉ dùng cơ chế chú ý, không
            dùng mạng hồi quy). Mô hình lai được huấn luyện bằng lan truyền
            ngược trên 108 ngôn ngữ, đạt +5 BLEU trung bình, +7 BLEU cho 50
            ngôn ngữ ít tài nguyên (low-resource &mdash; ngôn ngữ có ít dữ liệu
            huấn luyện).
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="backpropagation-in-translation"
      >
        <Metric
          value="Giảm 60% lỗi dịch so với dịch thống kê (đánh giá bởi con người)"
          sourceRef={1}
        />
        <Metric
          value="26,30 BLEU trên WMT'14 Anh→Đức và 41,16 BLEU trên Anh→Pháp"
          sourceRef={1}
        />
        <Metric
          value="Mô hình lai Transformer-RNN (2020) cải thiện +5 BLEU trung bình trên hơn 100 ngôn ngữ"
          sourceRef={3}
        />
        <Metric
          value="Huấn luyện trên 96 GPU NVIDIA K80 trong khoảng 6 ngày"
          sourceRef={1}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Lan truyền ngược"
        topicSlug="backpropagation-in-translation"
      >
        <p>
          Nếu không có lan truyền ngược, không thể huấn luyện mạng LSTM 16 tầng
          sâu &mdash; không có cách nào tính gradient qua hàng triệu trọng số.
          Google sẽ phải tiếp tục dùng dịch thống kê, với lỗi dịch cao hơn 60%.
        </p>
        <p>
          Hơn 500 triệu người dùng Google Translate hàng ngày sẽ nhận bản dịch
          kém hơn đáng kể.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
