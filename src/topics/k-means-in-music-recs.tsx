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
  slug: "k-means-in-music-recs",
  title: "K-Means in Music Recommendations",
  titleVi: "K-Means trong Gợi ý Nhạc",
  description:
    "Cách Spotify dùng phân cụm vector để tạo Discover Weekly cho hàng trăm triệu người dùng",
  category: "classic-ml",
  tags: ["clustering", "recommendation", "application"],
  difficulty: "intermediate",
  relatedSlugs: ["k-means"],
  vizType: "static",
  applicationOf: "k-means",
  featuredApp: {
    name: "Spotify",
    productFeature: "Discover Weekly",
    company: "Spotify AB",
    countryOrigin: "SE",
  },
  sources: [
    {
      title:
        "What Made Discover Weekly One of Our Most Successful Feature Launches to Date?",
      publisher: "Spotify Engineering",
      url: "https://engineering.atspotify.com/2015/11/what-made-discover-weekly-one-of-our-most-successful-feature-launches-to-date",
      date: "2015-11",
      kind: "engineering-blog",
    },
    {
      title: "From Idea to Execution: Spotify's Discover Weekly",
      publisher: "Chris Johnson & Edward Newett, DataEngConf NYC 2015",
      url: "https://www.slideshare.net/MrChrisJohnson/from-idea-to-execution-spotifys-discover-weekly",
      date: "2015-11",
      kind: "keynote",
    },
    {
      title: "Logistic Matrix Factorization for Implicit Feedback Data",
      publisher: "Chris Johnson, Spotify — NIPS 2014 Workshop",
      url: "https://research.atspotify.com/publications/logistic-matrix-factorization-for-implicit-feedback-data",
      date: "2014-12",
      kind: "paper",
    },
    {
      title:
        "Introducing Voyager: Spotify's New Nearest-Neighbor Search Library",
      publisher: "Spotify Engineering",
      url: "https://engineering.atspotify.com/2023/10/introducing-voyager-spotifys-new-nearest-neighbor-search-library",
      date: "2023-10",
      kind: "engineering-blog",
    },
    {
      title: "Recommending Music on Spotify with Deep Learning",
      publisher: "Sander Dieleman (Spotify internship)",
      url: "https://sander.ai/2014/08/05/spotify-cnns.html",
      date: "2014-08",
      kind: "engineering-blog",
    },
    {
      title: "How to Break Free of Spotify's Algorithm",
      publisher: "MIT Technology Review",
      url: "https://www.technologyreview.com/2024/08/16/1096276/spotify-algorithms-music-discovery-ux/",
      date: "2024-08",
      kind: "news",
    },
    {
      title:
        "How Fans Discover Your Music on Spotify — Made to Be Found",
      publisher: "Spotify for Artists",
      url: "https://artists.spotify.com/en/blog/how-fans-discover-music-on-spotify-playlists-made-to-be-found",
      date: "2022-03",
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

export default function KMeansInMusicRecs() {
  return (
    <ApplicationLayout metadata={metadata} parentTitleVi="Phân cụm K-Means">
      <ApplicationHero
        parentTitleVi="Phân cụm K-Means"
        topicSlug="k-means-in-music-recs"
      >
        <p>
          Mỗi sáng thứ Hai, bạn mở Spotify (dịch vụ phát nhạc trực tuyến) và
          thấy Discover Weekly (danh sách nhạc khám phá hàng tuần) đã cập nhật
          30 bài hát mới. Bạn nhấn play &mdash; bài đầu tiên lạ hoắc nhưng hợp
          gu đến kỳ lạ, như thể ai đó đã đọc được sở thích âm nhạc của bạn.
        </p>
        <p>
          Đằng sau trải nghiệm đó là một hệ thống xử lý hơn 1 TB (terabyte) dữ
          liệu mỗi ngày. Hệ thống biến hàng trăm triệu lượt nghe thành các
          vector (véc-tơ &mdash; mảng số biểu diễn đặc trưng) trong không gian
          nhiều chiều, rồi dùng phương pháp phân cụm (clustering &mdash; nhóm
          các điểm dữ liệu tương tự lại với nhau) để tìm người nghe có gu giống
          nhau.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="k-means-in-music-recs">
        <p>
          Spotify có hơn 100 triệu bài hát và hơn 600 triệu người dùng. Mỗi
          người có gu âm nhạc khác nhau &mdash; Spotify phân loại tới 6.291 thể
          loại vi mô (micro-genre).
        </p>
        <p>
          Vấn đề cốt lõi: làm sao từ ma trận tương tác (interaction matrix
          &mdash; bảng ghi lại ai nghe bài gì) giữa hàng trăm triệu người dùng
          và bài hát, tìm ra nhóm người nghe có gu giống nhau? Sau đó, gợi ý
          bài hát mà &ldquo;đồng minh thẩm mỹ&rdquo; yêu thích mà họ chưa
          từng nghe.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Phân cụm K-Means"
        topicSlug="k-means-in-music-recs"
      >
        <Beat step={1}>
          <p>
            <strong>Thu thập dữ liệu phản hồi ẩn (implicit feedback).</strong>{" "}
            Spotify ghi lại lượt nghe, lưu bài, bỏ qua, thêm vào playlist
            &mdash; khoảng 1 TB mỗi ngày. Hệ thống mã hóa nhị phân: 1 = đã
            nghe, 0 = chưa nghe, kèm trọng số (weight &mdash; hệ số phản ánh
            mức độ tương tác).
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>
              Phân rã ma trận (matrix factorization &mdash; tách ma trận lớn
              thành tích hai ma trận nhỏ).
            </strong>{" "}
            Ma trận người dùng &times; bài hát được phân rã bằng Implicit Matrix
            Factorization (phân rã ma trận cho dữ liệu phản hồi ẩn). Mỗi người
            dùng và bài hát trở thành một vector trong không gian ẩn khoảng 40
            chiều. Đây là phân cụm mềm: vector gần nhau nghĩa là gu âm nhạc
            tương đồng.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>
              Tìm kiếm láng giềng gần nhất (nearest neighbor search &mdash; tìm
              điểm dữ liệu gần nhất trong không gian vector).
            </strong>{" "}
            Spotify dùng thư viện Voyager (nhanh hơn Annoy 10 lần) để tìm bài
            hát gần nhất với vector người dùng. Việc này tương đương tìm cụm bài
            hát phù hợp nhất cho mỗi người nghe.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>
              Bổ sung tín hiệu nội dung (content-based signal &mdash; thông tin
              rút từ chính nội dung bài hát).
            </strong>{" "}
            CNN (Convolutional Neural Network &mdash; mạng nơ-ron tích chập)
            phân tích phổ mel-spectrogram (biểu đồ tần số âm thanh theo thời
            gian) của âm thanh thô để dự đoán vector cho bài hát mới chưa có
            lịch sử nghe. Bước này giải quyết bài toán cold-start (khởi đầu
            lạnh &mdash; khi chưa có dữ liệu tương tác). NLP (Natural Language
            Processing &mdash; xử lý ngôn ngữ tự nhiên) cũng phân tích tên và
            mô tả playlist.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="k-means-in-music-recs"
      >
        <Metric
          value="Ít nhất 30% lượt nghe trên Spotify đến từ gợi ý thuật toán"
          sourceRef={6}
        />
        <Metric
          value="33% lượt khám phá nghệ sĩ mới xảy ra qua playlist cá nhân hóa"
          sourceRef={7}
        />
        <Metric value="Xử lý 1 TB dữ liệu người dùng mỗi ngày" sourceRef={2} />
        <Metric
          value="Voyager nhanh hơn 10 lần so với Annoy, tiết kiệm bộ nhớ gấp 4 lần"
          sourceRef={4}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Phân cụm K-Means"
        topicSlug="k-means-in-music-recs"
      >
        <p>
          Không có phân cụm và biểu diễn vector, Spotify sẽ phải so sánh trực
          tiếp mỗi người dùng với hàng trăm triệu người khác &mdash; bất khả
          thi về mặt tính toán.
        </p>
        <p>
          Matrix factorization nén mỗi người dùng và bài hát thành vector ngắn
          gọn, biến bài toán so sánh thành phép nhân vector đơn giản. Thư viện
          tìm kiếm láng giềng gần đúng (approximate nearest neighbor) giúp truy
          vấn diễn ra trong mili-giây thay vì hàng giờ.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
