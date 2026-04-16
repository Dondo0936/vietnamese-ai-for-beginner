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
  slug: "loss-functions-in-recommendation",
  title: "Loss Functions in YouTube Recommendations",
  titleVi: "Hàm mất mát trong Gợi ý YouTube",
  description:
    "Cách YouTube thay đổi hàm mất mát từ click-through sang watch-time để chống clickbait và cải thiện trải nghiệm",
  category: "neural-fundamentals",
  tags: ["loss-functions", "recommendation", "application"],
  difficulty: "beginner",
  relatedSlugs: ["loss-functions"],
  vizType: "static",
  applicationOf: "loss-functions",
  featuredApp: {
    name: "YouTube",
    productFeature: "Recommendation System",
    company: "Google LLC",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "Deep Neural Networks for YouTube Recommendations",
      publisher: "Covington, Adams & Sargin, ACM RecSys 2016",
      url: "https://dl.acm.org/doi/10.1145/2959100.2959190",
      date: "2016-09",
      kind: "paper",
    },
    {
      title: "Deep Neural Networks for YouTube Recommendations (PDF)",
      publisher: "Google Research",
      url: "https://research.google.com/pubs/archive/45530.pdf",
      date: "2016-09",
      kind: "paper",
    },
    {
      title: "On YouTube's Recommendation System",
      publisher: "YouTube Official Blog",
      url: "https://blog.youtube/inside-youtube/on-youtubes-recommendation-system/",
      date: "2021-09",
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

export default function LossFunctionsInRecommendation() {
  return (
    <ApplicationLayout metadata={metadata} parentTitleVi="Hàm mất mát">
      <ApplicationHero
        parentTitleVi="Hàm mất mát"
        topicSlug="loss-functions-in-recommendation"
      >
        <p>
          Mỗi ngày, YouTube (nền tảng chia sẻ video của Google) phục vụ hơn
          1 tỉ giờ xem video. Khi bạn mở trang chủ, hệ thống gợi ý chọn vài
          chục video từ hàng trăm triệu ứng viên &mdash; mỗi lựa chọn được
          quyết định bởi hàm mất mát (loss function &mdash; hàm đo sai lệch
          giữa dự đoán và thực tế).
        </p>
        <p>
          Câu chuyện thú vị nhất: YouTube từng dùng hàm mất mát tối ưu cho
          tỉ lệ nhấp (click-through rate &mdash; CTR), nhưng phát hiện điều
          này khuyến khích clickbait (nội dung câu click &mdash; tiêu đề hấp
          dẫn nhưng nội dung kém). Chuyển sang hàm mất mát dựa trên thời gian
          xem (watch time) đã thay đổi hoàn toàn chất lượng gợi ý.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="loss-functions-in-recommendation">
        <p>
          YouTube cần gợi ý video mà người dùng thực sự muốn xem &mdash;
          không chỉ nhấp vào rồi bỏ. Hệ thống gồm hai giai đoạn: (1) tạo
          ứng viên (candidate generation &mdash; chọn vài trăm video từ hàng
          triệu) và (2) xếp hạng (ranking &mdash; sắp xếp ứng viên theo mức
          độ phù hợp).
        </p>
        <p>
          Vấn đề cốt lõi: hàm mất mát quyết định mô hình &ldquo;học&rdquo;
          điều gì. Nếu loss function tối ưu CTR, mô hình học cách dự đoán
          &ldquo;người này có nhấp không?&rdquo; &mdash; và clickbait luôn
          thắng. Cần hàm mất mát phản ánh đúng giá trị thực sự: người dùng
          xem bao lâu, có hài lòng không.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Hàm mất mát"
        topicSlug="loss-functions-in-recommendation"
      >
        <Beat step={1}>
          <p>
            <strong>
              Candidate generation dùng cross-entropy loss.
            </strong>{" "}
            Giai đoạn đầu mô hình hóa bài toán như phân loại nhiều lớp cực lớn
            (extreme multiclass classification): cho một người dùng, dự đoán
            video nào sẽ được xem trong số hàng triệu video. Loss function
            là softmax cross-entropy &mdash; tối thiểu hóa khoảng cách giữa
            phân phối xác suất dự đoán và hành vi thực tế. Sampled softmax
            (softmax trên tập mẫu con) giúp tính toán khả thi.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>
              Ranking dùng weighted logistic regression với watch-time.
            </strong>{" "}
            Đây là bước đột phá: thay vì dự đoán &ldquo;có nhấp hay
            không&rdquo; (binary classification &mdash; phân loại nhị phân),
            YouTube dùng logistic regression có trọng số (weighted logistic
            regression), trong đó trọng số bằng thời gian xem thực tế. Video
            được nhấp nhưng bị bỏ ngang nhận trọng số thấp, video được xem
            hết nhận trọng số cao. Loss function vẫn là cross-entropy, nhưng
            trọng số watch-time biến nó thành bài toán dự đoán thời gian xem
            kỳ vọng.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>
              Chuyển từ CTR sang watch-time chống clickbait.
            </strong>{" "}
            Khi tối ưu CTR, video clickbait có tiêu đề hấp dẫn nhưng nội dung
            kém sẽ được xếp hạng cao vì nhiều người nhấp. Khi chuyển sang
            watch-time, các video này bị phạt: người xem nhấp nhưng thoát
            nhanh, trọng số rất thấp. Video chất lượng giữ chân người xem lâu
            sẽ được ưu tiên.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>Tối ưu bằng gradient descent trên hàng tỉ mẫu.</strong>{" "}
            Mạng nơ-ron ranking được huấn luyện bằng gradient descent trên dữ
            liệu hàng tỉ lượt xem. Kiến trúc gồm nhiều tầng ẩn (hidden
            layers) xử lý đặc trưng liên tục (thời lượng video, thời gian kể
            từ upload) và đặc trưng rời rạc (ID video, ngôn ngữ). Gradient
            của weighted cross-entropy loss được lan truyền ngược để cập nhật
            tham số.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="loss-functions-in-recommendation"
      >
        <Metric
          value="Hệ thống gợi ý xử lý hàng trăm triệu video, phục vụ hơn 1 tỉ giờ xem mỗi ngày"
          sourceRef={3}
        />
        <Metric
          value="Ranking bằng weighted logistic regression với watch-time loại bỏ hiệu quả clickbait"
          sourceRef={1}
        />
        <Metric
          value="Candidate generation mô hình hóa bài toán phân loại hàng triệu lớp với sampled softmax"
          sourceRef={2}
        />
        <Metric
          value="Thời gian xem trung bình trên mobile tăng lên hơn 60 phút/ngày nhờ hệ thống gợi ý cải thiện"
          sourceRef={3}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Hàm mất mát"
        topicSlug="loss-functions-in-recommendation"
      >
        <p>
          Nếu YouTube vẫn dùng hàm mất mát tối ưu CTR thuần túy, trang chủ
          sẽ đầy clickbait &mdash; người dùng nhấp nhiều nhưng không hài lòng,
          dần bỏ nền tảng. Trải nghiệm xem video sẽ giống như &ldquo;bẫy
          nhấp&rdquo; liên tục.
        </p>
        <p>
          Việc thay đổi loss function &mdash; chỉ bằng cách thêm trọng số
          watch-time vào cross-entropy &mdash; đã thay đổi hoàn toàn hành vi
          của mô hình. Đây là minh chứng rõ ràng nhất: loss function không chỉ
          là chi tiết kỹ thuật &mdash; nó định nghĩa mô hình sẽ tối ưu điều
          gì, và qua đó quyết định trải nghiệm của hàng tỉ người dùng.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
