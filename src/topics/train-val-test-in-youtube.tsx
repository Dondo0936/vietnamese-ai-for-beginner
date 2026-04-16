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
  slug: "train-val-test-in-youtube",
  title: "Train / Val / Test in YouTube Recommendations",
  titleVi: "Tập huấn luyện, kiểm định & kiểm tra trong Gợi ý YouTube",
  description:
    "Cách YouTube chia dữ liệu từ 2 tỷ người dùng thành train/val/test và dùng A/B test thực tế làm bước kiểm tra cuối cùng",
  category: "classic-ml",
  tags: ["data-split", "recommendation", "ab-testing", "application"],
  difficulty: "beginner",
  relatedSlugs: ["train-val-test"],
  vizType: "static",
  applicationOf: "train-val-test",
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
      title: "On YouTube's recommendation system",
      publisher: "YouTube Official Blog",
      url: "https://blog.youtube/inside-youtube/on-youtubes-recommendation-system/",
      date: "2021-09",
      kind: "engineering-blog",
    },
    {
      title: "YouTube by the Numbers: Stats, Demographics & Fun Facts",
      publisher: "Quartz / Statista",
      url: "https://www.oberlo.com/blog/youtube-statistics",
      date: "2024-01",
      kind: "news",
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

export default function TrainValTestInYoutube() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Tập huấn luyện, kiểm định & kiểm tra"
    >
      <ApplicationHero
        parentTitleVi="Tập huấn luyện, kiểm định & kiểm tra"
        topicSlug="train-val-test-in-youtube"
      >
        <p>
          Bạn mở YouTube (nền tảng video trực tuyến của Google) và trang
          chủ hiện ra danh sách video &mdash; khoảng 70% thời gian xem trên
          YouTube đến từ gợi ý của thuật toán. Hệ thống này phục vụ hơn
          2 tỷ người dùng, chọn lọc từ hơn 800 triệu video, xử lý hơn
          80 tỷ tín hiệu mỗi ngày.
        </p>
        <p>
          Nhưng thuật toán gợi ý không được triển khai ngay sau khi huấn
          luyện. YouTube dùng quy trình chia dữ liệu nghiêm ngặt &mdash;
          train (huấn luyện), validation (kiểm định), và test (kiểm tra)
          &mdash; kết hợp với A/B testing (thử nghiệm so sánh trên người
          dùng thật) để đảm bảo mỗi thay đổi thực sự cải thiện trải nghiệm,
          không chỉ cải thiện con số trên giấy.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="train-val-test-in-youtube">
        <p>
          YouTube thu thập dữ liệu tương tác từ 2 tỷ người dùng: lượt xem,
          thời gian xem, nhấn like, chia sẻ, bình luận, bỏ qua. Tổng cộng
          hơn 80 tỷ tín hiệu mỗi ngày. Thách thức không chỉ là xây mô
          hình chính xác trên dữ liệu quá khứ, mà là đảm bảo mô hình hoạt
          động tốt trên hành vi người dùng trong tương lai &mdash; vốn thay
          đổi liên tục.
        </p>
        <p>
          Vấn đề cốt lõi: nếu chỉ đánh giá offline (trên dữ liệu lịch
          sử), mô hình có thể đạt điểm cao nhưng thất bại khi gặp người
          dùng thật. Cần một quy trình chia dữ liệu đảm bảo mỗi giai
          đoạn đánh giá tiến gần hơn đến thực tế.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Tập huấn luyện, kiểm định & kiểm tra"
        topicSlug="train-val-test-in-youtube"
      >
        <Beat step={1}>
          <p>
            <strong>
              Tập huấn luyện (training set): học từ lịch sử tương tác.
            </strong>{" "}
            YouTube dùng hàng tỷ sự kiện tương tác trong quá khứ để huấn
            luyện mạng nơ-ron sâu. Covington và cộng sự (RecSys 2016) mô
            tả kiến trúc hai giai đoạn: mạng ứng viên (candidate generation
            &mdash; chọn vài trăm video từ 800 triệu+) và mạng xếp hạng
            (ranking &mdash; sắp xếp vài trăm video đó). Dữ liệu huấn
            luyện được cân bằng cẩn thận: mỗi người dùng đóng góp cùng số
            lượng ví dụ, tránh mô hình bị chi phối bởi nhóm xem nhiều.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>
              Tập kiểm định (validation set): chia theo người dùng.
            </strong>{" "}
            YouTube chia dữ liệu theo người dùng (user-level split), không
            theo sự kiện ngẫu nhiên. Nghĩa là: toàn bộ lịch sử của một
            người dùng nằm hoàn toàn trong tập train hoặc hoàn toàn trong
            tập validation &mdash; không bị rò rỉ (data leakage &mdash; khi
            thông tin từ tập kiểm tra lọt vào tập huấn luyện). Tập
            validation dùng để tinh chỉnh siêu tham số (hyperparameter) và
            so sánh các kiến trúc mô hình khác nhau.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>
              A/B test trên người dùng thật: tập kiểm tra thực sự.
            </strong>{" "}
            Sau khi mô hình vượt qua đánh giá offline, YouTube chạy A/B
            test (thử nghiệm so sánh &mdash; chia người dùng thành nhóm
            đối chứng và nhóm thử nghiệm). YouTube thực hiện hàng chục
            nghìn thử nghiệm A/B mỗi năm. Chỉ khi mô hình mới cải thiện
            chỉ số thực tế (thời gian xem, mức độ hài lòng) trên người
            dùng thật, nó mới được triển khai rộng.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>
              Quyết định từ chỉ số thực tế, không từ chỉ số offline.
            </strong>{" "}
            YouTube đã nhiều lần phát hiện: mô hình đạt chỉ số offline cao
            hơn nhưng lại giảm thời gian xem thực tế. Nguyên nhân thường
            là mô hình tối ưu hóa click (nhấp chuột) thay vì sự hài lòng
            &mdash; người dùng nhấp nhiều hơn nhưng thoát nhanh hơn. Chỉ
            A/B test mới phát hiện được sự khác biệt này.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="train-val-test-in-youtube"
      >
        <Metric
          value="Hơn 800 triệu video và 2 tỷ người dùng đăng nhập hàng tháng"
          sourceRef={3}
        />
        <Metric
          value="70% thời gian xem trên YouTube đến từ gợi ý thuật toán"
          sourceRef={2}
        />
        <Metric
          value="Hơn 80 tỷ tín hiệu hành vi được xử lý mỗi ngày"
          sourceRef={1}
        />
        <Metric
          value="Hàng chục nghìn thử nghiệm A/B được chạy mỗi năm"
          sourceRef={2}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Tập huấn luyện, kiểm định & kiểm tra"
        topicSlug="train-val-test-in-youtube"
      >
        <p>
          Không chia tách train/val/test nghiêm ngặt, YouTube sẽ triển khai
          mô hình chỉ dựa trên chỉ số offline &mdash; và nhiều thay đổi
          tưởng tốt trên giấy sẽ làm giảm trải nghiệm người dùng thực tế.
          Mô hình tối ưu click-bait (nội dung câu view) sẽ được ưu ái vì
          chỉ số nhấp chuột cao, dù người dùng bỏ xem sau vài giây.
        </p>
        <p>
          Quy trình 3 bước (train trên quá khứ, validate trên tập tách
          riêng, test trên người dùng thật qua A/B) đảm bảo rằng mỗi thay
          đổi thuật toán phải vượt qua cả đánh giá lý thuyết lẫn thử
          thách thực tế trước khi chạm đến 2 tỷ người dùng.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
