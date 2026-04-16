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
  slug: "naive-bayes-in-email-classification",
  title: "Naive Bayes in Email Classification",
  titleVi: "Naive Bayes trong Phân loại Email",
  description:
    "Cách SpamAssassin và Gmail dùng Naive Bayes làm bộ lọc spam kinh điển, chặn 15 tỷ thư rác mỗi ngày với tỷ lệ nhầm dưới 0,2%",
  category: "classic-ml",
  tags: ["classification", "email", "spam", "application"],
  difficulty: "beginner",
  relatedSlugs: ["naive-bayes"],
  vizType: "static",
  applicationOf: "naive-bayes",
  featuredApp: {
    name: "Gmail / SpamAssassin",
    productFeature: "Bayesian Spam Filter",
    company: "Google LLC / Apache Foundation",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "A Plan for Spam",
      publisher: "Paul Graham",
      url: "http://www.paulgraham.com/spam.html",
      date: "2002-08",
      kind: "paper",
    },
    {
      title: "SpamAssassin: Bayesian Poisoning",
      publisher: "Apache SpamAssassin Wiki",
      url: "https://wiki.apache.org/spamassassin/BayesianPoisoning",
      date: "2010-03",
      kind: "documentation",
    },
    {
      title: "Spam does not bring us joy — ridding Gmail of 100 million more spam messages with TensorFlow",
      publisher: "Google Workspace Blog",
      url: "https://workspace.google.com/blog/product-announcements/ridding-gmail-of-100-million-more-spam-messages-with-tensorflow",
      date: "2019-02",
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

export default function NaiveBayesInEmailClassification() {
  return (
    <ApplicationLayout metadata={metadata} parentTitleVi="Naive Bayes">
      <ApplicationHero
        parentTitleVi="Naive Bayes"
        topicSlug="naive-bayes-in-email-classification"
      >
        <p>
          Mỗi sáng bạn mở Gmail (dịch vụ email của Google) và hộp thư đến
          sạch sẽ &mdash; không quảng cáo thuốc giả, không lừa đảo trúng
          thưởng. Phần lớn thư rác đã bị chặn trước khi bạn kịp nhìn thấy.
        </p>
        <p>
          Kỹ thuật gốc đằng sau bộ lọc này là Naive Bayes (thuật toán phân
          loại dựa trên xác suất có điều kiện). Năm 2002, Paul Graham (lập
          trình viên và nhà đầu tư) công bố bài luận &ldquo;A Plan for
          Spam&rdquo; chứng minh rằng chỉ cần đếm tần suất từ và áp dụng
          định lý Bayes (Bayes&apos; theorem &mdash; công thức cập nhật xác
          suất khi có bằng chứng mới) đã lọc được hơn 99,5% spam. Ý tưởng
          này trở thành nền tảng cho SpamAssassin (bộ lọc thư rác mã nguồn
          mở) và bộ lọc đầu tiên của Gmail.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="naive-bayes-in-email-classification">
        <p>
          Mỗi ngày có khoảng 15 tỷ thư rác được gửi đi trên toàn cầu.
          Kẻ gửi spam liên tục đổi chiêu: viết sai chính tả cố ý, chèn ký
          tự vô hình, giả mạo địa chỉ người gửi. Luật cứng (rule-based
          &mdash; quy tắc do con người viết tay) không theo kịp tốc độ biến
          hóa này.
        </p>
        <p>
          Vấn đề cốt lõi: phân loại mỗi email thành spam hoặc ham (thư
          hợp lệ) với sai số cực thấp. Chặn nhầm một email quan trọng
          (false positive &mdash; dương tính giả) gây hậu quả nghiêm trọng
          hơn nhiều so với để lọt vài thư rác.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Naive Bayes"
        topicSlug="naive-bayes-in-email-classification"
      >
        <Beat step={1}>
          <p>
            <strong>
              Thu thập dữ liệu huấn luyện: ham và spam.
            </strong>{" "}
            Hệ thống cần tối thiểu khoảng 200 email spam và 200 email ham
            để bắt đầu. SpamAssassin cho phép người dùng tự gán nhãn, còn
            Gmail dùng phản hồi từ hàng tỷ lượt &ldquo;Báo cáo spam&rdquo;
            mỗi ngày làm tín hiệu huấn luyện.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>
              Tính xác suất có điều kiện cho từng từ.
            </strong>{" "}
            Với mỗi từ trong kho từ vựng, hệ thống tính P(từ|spam) &mdash;
            xác suất từ đó xuất hiện trong thư rác &mdash; và P(từ|ham) &mdash;
            xác suất xuất hiện trong thư hợp lệ. Ví dụ: từ
            &ldquo;miễn phí&rdquo; có P(từ|spam) rất cao, còn tên đồng nghiệp
            của bạn có P(từ|ham) rất cao.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>
              Kết hợp bằng định lý Bayes.
            </strong>{" "}
            Khi email mới đến, thuật toán nhân tất cả xác suất có điều kiện
            của các từ trong email lại với nhau (giả định &ldquo;ngây thơ&rdquo;
            rằng các từ độc lập) để tính P(spam|email) &mdash; xác suất email
            là spam khi biết nội dung. Phép nhân được thực hiện trong không
            gian logarit (log-space) để tránh tràn số (underflow &mdash; khi
            tích nhiều số nhỏ tiến về 0).
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>
              So sánh với ngưỡng quyết định.
            </strong>{" "}
            Nếu P(spam|email) vượt ngưỡng (threshold &mdash; thường từ 0,9
            trở lên để hạn chế chặn nhầm), email bị đánh dấu là spam. Ngưỡng
            cao đồng nghĩa ưu tiên giảm false positive &mdash; tỷ lệ nhầm
            thư hợp lệ thành spam dưới 0,2%.
          </p>
        </Beat>
        <Beat step={5}>
          <p>
            <strong>
              Vòng phản hồi từ người dùng.
            </strong>{" "}
            Khi người dùng nhấn &ldquo;Báo cáo spam&rdquo; hoặc kéo email
            ra khỏi thùng rác, hệ thống cập nhật bảng xác suất. Gmail thu
            thập tín hiệu từ 1,8 tỷ người dùng, tạo vòng lặp phản hồi
            (feedback loop) giúp bộ lọc tự cải thiện liên tục mà không cần
            kỹ sư can thiệp thủ công.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="naive-bayes-in-email-classification"
      >
        <Metric
          value="Paul Graham 2002: bộ lọc Bayesian đạt trên 99,5% chính xác chỉ với đếm từ"
          sourceRef={1}
        />
        <Metric
          value="SpamAssassin tích hợp Naive Bayes làm thành phần cốt lõi từ phiên bản 2.50"
          sourceRef={2}
        />
        <Metric
          value="Gmail chặn khoảng 15 tỷ thư rác mỗi ngày trên toàn hệ thống"
          sourceRef={3}
        />
        <Metric
          value="Tỷ lệ false positive (chặn nhầm thư hợp lệ) dưới 0,2%"
          sourceRef={1}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Naive Bayes"
        topicSlug="naive-bayes-in-email-classification"
      >
        <p>
          Không có Naive Bayes, bộ lọc spam sẽ phải dựa hoàn toàn vào luật
          cứng: nếu email chứa từ X thì chặn. Kẻ gửi spam chỉ cần thay đổi
          một từ là qua mặt được bộ lọc. Paul Graham mô tả đây là
          &ldquo;cuộc chạy đua vũ trang mà người phòng thủ luôn thua&rdquo;.
        </p>
        <p>
          Naive Bayes thay đổi cuộc chơi: thay vì đối phó từng chiêu trò
          riêng lẻ, thuật toán nhìn vào xác suất tổng hợp của toàn bộ nội
          dung. Kẻ gửi spam phải thay đổi gần như toàn bộ email mới qua
          được &mdash; và khi đó, email không còn đủ &ldquo;hấp dẫn&rdquo;
          để lừa người đọc nữa.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
