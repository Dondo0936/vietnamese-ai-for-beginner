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
  slug: "supervised-unsupervised-rl-in-netflix",
  title: "Supervised, Unsupervised & RL in Netflix",
  titleVi: "Học có giám sát, không giám sát & tăng cường tại Netflix",
  description:
    "Cách Netflix kết hợp ba mô hình học máy — có giám sát, không giám sát và tăng cường — để cá nhân hóa nội dung cho 247 triệu người dùng",
  category: "classic-ml",
  tags: ["supervised-learning", "unsupervised-learning", "reinforcement-learning", "recommendation", "application"],
  difficulty: "beginner",
  relatedSlugs: ["supervised-unsupervised-rl"],
  vizType: "static",
  applicationOf: "supervised-unsupervised-rl",
  featuredApp: {
    name: "Netflix",
    productFeature: "Personalized Recommendations",
    company: "Netflix, Inc.",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "System Architectures for Personalization and Recommendation",
      publisher: "Netflix Tech Blog",
      url: "https://netflixtechblog.com/system-architectures-for-personalization-and-recommendation-e081aa94b5d8",
      date: "2013-03",
      kind: "engineering-blog",
    },
    {
      title: "Learning a Personalized Homepage",
      publisher: "Netflix Tech Blog",
      url: "https://netflixtechblog.com/learning-a-personalized-homepage-aa8ec670359a",
      date: "2015-04",
      kind: "engineering-blog",
    },
    {
      title: "Artwork Personalization at Netflix",
      publisher: "Netflix Tech Blog",
      url: "https://netflixtechblog.com/artwork-personalization-c589f074ad76",
      date: "2017-12",
      kind: "engineering-blog",
    },
    {
      title: "Bandits for Recommender Systems",
      publisher: "Netflix Tech Blog",
      url: "https://netflixtechblog.com/bandits-for-recommender-systems-b5b5e8de9883",
      date: "2022-03",
      kind: "engineering-blog",
    },
    {
      title: "Netflix's recommendation engine is worth $1 billion per year",
      publisher: "Quartz",
      url: "https://qz.com/571007/the-recommendation-engine-is-worth-1-billion-per-year-to-netflix",
      date: "2016-01",
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

export default function SupervisedUnsupervisedRlInNetflix() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Học có giám sát, không giám sát & tăng cường"
    >
      <ApplicationHero
        parentTitleVi="Học có giám sát, không giám sát & tăng cường"
        topicSlug="supervised-unsupervised-rl-in-netflix"
      >
        <p>
          Bạn mở Netflix (dịch vụ phát phim trực tuyến) vào buổi tối. Trang chủ
          hiện ra hàng chục hàng phim &mdash; mỗi hàng một chủ đề riêng, mỗi
          bộ phim kèm ảnh bìa khác nhau tùy người xem. Bạn nhấn vào bộ phim
          đầu tiên và thấy nó hợp gu đến bất ngờ.
        </p>
        <p>
          Đằng sau trải nghiệm đó là ba loại học máy phối hợp cùng lúc: học có
          giám sát (supervised learning &mdash; học từ dữ liệu đã gán nhãn) dự
          đoán điểm đánh giá, học không giám sát (unsupervised learning &mdash;
          tìm cấu trúc ẩn trong dữ liệu chưa gán nhãn) phân nhóm sở thích,
          và học tăng cường (reinforcement learning &mdash; học qua thử và sai)
          quyết định hiển thị nội dung nào trước.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="supervised-unsupervised-rl-in-netflix">
        <p>
          Netflix có hơn 247 triệu người đăng ký trên toàn cầu và thư viện
          hàng nghìn bộ phim, series. Mỗi người có gu khác nhau &mdash; có
          người thích phim kinh dị, người lại mê phim tài liệu, thậm chí cùng
          thể loại nhưng khẩu vị về nhịp phim và phong cách diễn xuất vẫn khác
          biệt.
        </p>
        <p>
          Vấn đề cốt lõi: nếu không gợi ý đúng, người dùng lướt trang chủ
          mà không tìm được gì muốn xem, họ sẽ rời đi &mdash; và tỷ lệ hủy
          đăng ký (churn rate &mdash; phần trăm người dùng ngừng sử dụng dịch
          vụ) tăng lên. Netflix cần dự đoán chính xác bạn muốn xem gì, phân
          nhóm hàng triệu người theo sở thích, và liên tục thử nghiệm cách
          trình bày tối ưu.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Học có giám sát, không giám sát & tăng cường"
        topicSlug="supervised-unsupervised-rl-in-netflix"
      >
        <Beat step={1}>
          <p>
            <strong>Thu thập dữ liệu hành vi.</strong>{" "}
            Netflix ghi lại mọi tương tác: lượt xem, thời gian xem, lượt tạm
            dừng, tua lại, đánh giá, và cả thiết bị sử dụng. Dữ liệu này tạo
            thành nền tảng cho cả ba phương pháp học máy.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>
              Học có giám sát &mdash; dự đoán điểm đánh giá.
            </strong>{" "}
            Mô hình supervised (học có giám sát) được huấn luyện trên dữ liệu
            đã gán nhãn: người dùng A cho phim X bao nhiêu sao. Thuật toán học
            mối quan hệ giữa đặc trưng (features &mdash; các thuộc tính đầu
            vào) của người dùng và phim, rồi dự đoán điểm cho phim chưa xem.
            Đây là phương pháp cốt lõi trong cuộc thi Netflix Prize (giải thưởng
            1 triệu đô-la Mỹ năm 2009).
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>
              Học không giám sát &mdash; phân nhóm sở thích
              (taste communities).
            </strong>{" "}
            Netflix dùng phân cụm (clustering &mdash; nhóm các điểm dữ liệu
            tương tự) để chia 247 triệu người dùng thành hơn 2.000 cộng đồng
            sở thích (taste communities). Mỗi cộng đồng có mẫu hành vi riêng
            biệt &mdash; không cần gán nhãn trước, thuật toán tự phát hiện cấu
            trúc ẩn trong dữ liệu.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>
              Học tăng cường &mdash; khám phá và khai thác
              (exploration vs. exploitation).
            </strong>{" "}
            Khi quyết định hiển thị ảnh bìa nào cho mỗi bộ phim, Netflix dùng
            mô hình bandit (một dạng học tăng cường). Hệ thống cân bằng giữa
            khai thác (exploitation &mdash; chọn ảnh đã biết hiệu quả) và khám
            phá (exploration &mdash; thử ảnh mới để tìm phương án tốt hơn). Mỗi
            lần bạn thấy ảnh bìa khác nhau cho cùng bộ phim, đó là học tăng
            cường đang hoạt động.
          </p>
        </Beat>
        <Beat step={5}>
          <p>
            <strong>Thử nghiệm A/B liên tục.</strong>{" "}
            Netflix chạy hàng trăm thử nghiệm A/B (so sánh hai phiên bản để
            đo hiệu quả) đồng thời. Kết quả từ mỗi thử nghiệm quay ngược lại
            cải thiện cả ba loại mô hình &mdash; tạo vòng lặp cải tiến không
            ngừng.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="supervised-unsupervised-rl-in-netflix"
      >
        <Metric
          value="80% nội dung được xem trên Netflix đến từ hệ thống gợi ý"
          sourceRef={1}
        />
        <Metric
          value="Hơn 2.000 cộng đồng sở thích (taste communities) được phân nhóm tự động"
          sourceRef={2}
        />
        <Metric
          value="Tỷ lệ hủy đăng ký chỉ 2,3–2,4% mỗi tháng nhờ cá nhân hóa"
          sourceRef={5}
        />
        <Metric
          value="Hệ thống gợi ý tiết kiệm hơn 1 tỷ đô-la Mỹ mỗi năm cho Netflix"
          sourceRef={5}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Học có giám sát, không giám sát & tăng cường"
        topicSlug="supervised-unsupervised-rl-in-netflix"
      >
        <p>
          Nếu chỉ dùng một loại học máy, Netflix sẽ thiếu một mảnh ghép quan
          trọng. Chỉ supervised learning thì dự đoán được điểm nhưng không hiểu
          cấu trúc nhóm sở thích. Chỉ unsupervised learning thì phân nhóm được
          nhưng không xếp hạng chính xác phim nào nên xem trước. Chỉ
          reinforcement learning thì tối ưu được cách hiển thị nhưng không biết
          nội dung nào phù hợp.
        </p>
        <p>
          Sức mạnh thực sự nằm ở việc kết hợp cả ba: supervised dự đoán, unsupervised
          phân nhóm, reinforcement learning tối ưu trải nghiệm &mdash; cùng nhau
          giữ chân 247 triệu người dùng mỗi tháng.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
