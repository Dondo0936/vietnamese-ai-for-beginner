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
  slug: "bias-variance-in-netflix-prize",
  title: "Bias-Variance in the Netflix Prize",
  titleVi: "Đánh đổi Bias-Variance trong Netflix Prize",
  description:
    "Câu chuyện cuộc thi 1 triệu đô Netflix Prize — 800+ mô hình để giảm 10,06% RMSE nhưng cuối cùng chỉ 2 thuật toán được triển khai",
  category: "classic-ml",
  tags: ["ensemble", "recommendation", "competition", "application"],
  difficulty: "beginner",
  relatedSlugs: ["bias-variance"],
  vizType: "static",
  applicationOf: "bias-variance",
  featuredApp: {
    name: "Netflix",
    productFeature: "Netflix Prize",
    company: "Netflix Inc.",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "The BellKor Solution to the Netflix Grand Prize",
      publisher: "BellKor Team (AT&T Labs)",
      url: "https://www.netflixprize.com/assets/GrandPrize2009_BPC_BellKor.pdf",
      date: "2009-09",
      kind: "paper",
    },
    {
      title: "Why Netflix Never Implemented The Algorithm That Won The Netflix $1 Million Challenge",
      publisher: "Techdirt",
      url: "https://www.techdirt.com/2012/04/13/why-netflix-never-implemented-algorithm-that-won-netflix-1-million-challenge/",
      date: "2012-04",
      kind: "news",
    },
    {
      title: "The Netflix Prize and Production Machine Learning Systems: An Insider Look",
      publisher: "Xavier Amatriain, ACM RecSys",
      url: "https://dl.acm.org/doi/10.1145/2507157.2507163",
      date: "2013-10",
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

export default function BiasVarianceInNetflixPrize() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Đánh đổi Bias-Variance"
    >
      <ApplicationHero
        parentTitleVi="Đánh đổi Bias-Variance"
        topicSlug="bias-variance-in-netflix-prize"
      >
        <p>
          Năm 2006, Netflix (dịch vụ phát video trực tuyến) tuyên bố thưởng
          1 triệu đô-la Mỹ cho bất kỳ ai cải thiện hệ thống gợi ý phim
          của họ thêm 10%. Cuộc thi kéo dài 3 năm, thu hút hơn 40.000
          đội từ 186 quốc gia &mdash; và trở thành bài học kinh điển nhất
          về sự đánh đổi giữa bias (sai số do mô hình quá đơn giản) và
          variance (sai số do mô hình quá phức tạp).
        </p>
        <p>
          Đội chiến thắng dùng hơn 800 mô hình kết hợp lại để đạt mục
          tiêu. Nhưng Netflix cuối cùng không triển khai giải pháp đó &mdash;
          vì chi phí vận hành quá cao so với lợi ích. Câu chuyện này minh
          họa rõ ràng: giảm bias bằng cách tăng phức tạp mô hình không
          phải lúc nào cũng đáng.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="bias-variance-in-netflix-prize">
        <p>
          Hệ thống gợi ý ban đầu của Netflix dựa trên Cinematch &mdash;
          thuật toán so sánh điểm đánh giá giữa người dùng. RMSE (Root Mean
          Squared Error &mdash; căn bậc hai sai số bình phương trung bình)
          của Cinematch là 0,9525 trên tập kiểm tra. Netflix đặt mục tiêu:
          đạt RMSE dưới 0,8572 (cải thiện 10%) để nhận 1 triệu đô-la.
        </p>
        <p>
          Vấn đề cốt lõi: mỗi mô hình đơn lẻ đều có giới hạn &mdash; hoặc
          quá đơn giản (high bias, bỏ sót xu hướng phức tạp) hoặc quá nhạy
          với dữ liệu huấn luyện (high variance, hoạt động kém trên dữ liệu
          mới). Làm sao vượt qua giới hạn này?
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Đánh đổi Bias-Variance"
        topicSlug="bias-variance-in-netflix-prize"
      >
        <Beat step={1}>
          <p>
            <strong>
              SVD đơn lẻ: high bias, cải thiện khoảng 7%.
            </strong>{" "}
            Bước đầu tiên, các đội dùng SVD (Singular Value Decomposition
            &mdash; phân rã giá trị suy biến, phương pháp nén ma trận đánh
            giá thành vector ngắn gọn). SVD giảm RMSE khoảng 7% &mdash;
            nhưng vẫn còn bias đáng kể vì nó giả định tất cả người dùng
            tuân theo cùng một mô hình tuyến tính.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>
              Bổ sung RBM và kNN: giảm bias, tăng variance.
            </strong>{" "}
            Các đội thêm RBM (Restricted Boltzmann Machine &mdash; mạng
            Boltzmann giới hạn) và kNN (k-Nearest Neighbors &mdash; k láng
            giềng gần nhất) để nắm bắt các mẫu (pattern) mà SVD bỏ sót.
            Mỗi mô hình mới giảm bias nhưng tăng variance &mdash; riêng lẻ
            chúng hoạt động không ổn định.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>
              Blending 107 mô hình: triệt variance bằng trung bình hóa.
            </strong>{" "}
            Đội BellKor (AT&T Labs) kết hợp 107 mô hình bằng blending
            (pha trộn &mdash; dùng hồi quy tuyến tính hoặc gradient boosting
            để gán trọng số cho dự đoán của từng mô hình). Khi các mô hình
            có variance khác hướng, trung bình hóa triệt tiêu sai số ngẫu
            nhiên &mdash; đây chính là nguyên lý cốt lõi của giảm variance.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>
              Grand Prize: 800+ mô hình, RMSE 0,8554.
            </strong>{" "}
            Để đạt 10,06% cải thiện, đội chiến thắng
            &ldquo;BellKor&apos;s Pragmatic Chaos&rdquo; hợp nhất ba siêu
            đội, dùng hơn 800 mô hình. Họ nộp bài chỉ sớm hơn đội thứ hai
            (The Ensemble) 22 phút &mdash; cả hai đội đạt cùng RMSE.
          </p>
        </Beat>
        <Beat step={5}>
          <p>
            <strong>
              Thực tế: Netflix chỉ cần 2 thuật toán.
            </strong>{" "}
            Netflix tiết lộ rằng chỉ SVD và RBM đã cho 99% lợi ích. 800+
            mô hình còn lại chỉ cải thiện thêm vài phần trăm RMSE cuối
            cùng nhưng tăng chi phí tính toán và độ phức tạp vận hành lên
            gấp nhiều lần. Cuộc thi dạy bài học kinh điển: giảm bias đến
            cực hạn bằng ensemble (kết hợp nhiều mô hình) có thể không
            đáng trong sản xuất thực tế.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="bias-variance-in-netflix-prize"
      >
        <Metric
          value="RMSE ban đầu (Cinematch): 0,9525 — RMSE chiến thắng: 0,8554 (cải thiện 10,06%)"
          sourceRef={1}
        />
        <Metric
          value="Hơn 800 mô hình được kết hợp trong giải pháp Grand Prize"
          sourceRef={1}
        />
        <Metric
          value="Đội chiến thắng nộp bài sớm hơn đội thứ hai chỉ 22 phút"
          sourceRef={2}
        />
        <Metric
          value="Netflix xác nhận chỉ 2 thuật toán (SVD + RBM) cho gần như toàn bộ lợi ích"
          sourceRef={3}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Đánh đổi Bias-Variance"
        topicSlug="bias-variance-in-netflix-prize"
      >
        <p>
          Không hiểu sự đánh đổi bias-variance, các đội thi sẽ mắc kẹt ở
          hai thái cực: hoặc dùng một mô hình đơn giản và chấp nhận sai
          số cao (high bias), hoặc xây mô hình cực phức tạp rồi thất vọng
          khi nó hoạt động kém trên dữ liệu mới (high variance).
        </p>
        <p>
          Hiểu đánh đổi bias-variance giúp nhìn ra lối thoát: kết hợp
          nhiều mô hình khác nhau (ensemble) để giảm variance mà không
          tăng bias. Đồng thời, bài học Netflix cũng cho thấy mặt trái:
          ensemble quá lớn có thể &ldquo;thắng cuộc thi nhưng thua thực
          tế&rdquo; &mdash; một lời nhắc rằng lý thuyết luôn cần đối chiếu
          với ràng buộc sản xuất.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
