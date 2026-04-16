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
  slug: "probability-statistics-in-spam-filter",
  title: "Probability & Statistics in Spam Filtering",
  titleVi: "Xác suất & Thống kê trong Lọc Thư rác",
  description:
    "Cách Gmail dùng lọc Bayes, TensorFlow và RETVec để chặn 15 tỷ email rác mỗi ngày với độ chính xác trên 99,9%",
  category: "math-foundations",
  tags: ["bayesian-filtering", "spam-detection", "application"],
  difficulty: "intermediate",
  relatedSlugs: ["probability-statistics"],
  vizType: "static",
  applicationOf: "probability-statistics",
  featuredApp: {
    name: "Gmail",
    productFeature: "Spam Classifier",
    company: "Google LLC",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "Spam Does Not Bring Us Joy — Ridding Gmail of 100 Million More Spam Messages with TensorFlow",
      publisher: "Google Workspace Blog",
      url: "https://workspace.google.com/blog/product-announcements/ridding-gmail-of-100-million-more-spam-messages-with-tensorflow",
      date: "2019-02",
      kind: "engineering-blog",
    },
    {
      title: "RETVec: Resilient and Efficient Text Vectorizer",
      publisher: "Google Security Blog",
      url: "https://security.googleblog.com/2023/11/google-retvec-open-source-text-vectorizer.html",
      date: "2023-11",
      kind: "engineering-blog",
    },
    {
      title: "Unwrapping the Holidays with Gmail: How We Block 15 Billion Spam Emails a Day",
      publisher: "Google Blog",
      url: "https://blog.google/products/gmail/gmail-security-end-of-year-2024/",
      date: "2024-12",
      kind: "engineering-blog",
    },
    {
      title: "A Plan for Spam",
      publisher: "Paul Graham",
      url: "http://www.paulgraham.com/spam.html",
      date: "2002-08",
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

export default function ProbabilityStatisticsInSpamFilter() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Xác suất & Thống kê cơ bản"
    >
      <ApplicationHero
        parentTitleVi="Xác suất & Thống kê cơ bản"
        topicSlug="probability-statistics-in-spam-filter"
      >
        <p>
          Mỗi ngày Gmail chặn khoảng 15 tỷ email rác &mdash; tương đương
          khoảng 10 triệu thư mỗi phút. Với 1,8 tỷ người dùng, Gmail là dịch
          vụ email lớn nhất thế giới và cũng là mục tiêu hàng đầu của các chiến
          dịch spam (thư rác &mdash; email không mong muốn gửi hàng loạt).
        </p>
        <p>
          Đằng sau khả năng lọc với độ chính xác trên 99,9% là sự kết hợp giữa
          lọc Bayes (Bayesian filtering &mdash; phương pháp tính xác suất thư
          rác dựa trên các từ xuất hiện), mạng nơ-ron TensorFlow và mô hình
          RETVec (Resilient and Efficient Text Vectorizer &mdash; bộ mã hoá văn
          bản bền vững). Tất cả đều bắt nguồn từ một ý tưởng đơn giản: dùng xác
          suất có điều kiện để phân loại email.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="probability-statistics-in-spam-filter">
        <p>
          Email rác chiếm hơn một nửa tổng lượng email toàn cầu. Nội dung spam
          thay đổi liên tục: từ quảng cáo thuốc giả, lừa đảo tài chính đến
          phishing (giả mạo danh tính &mdash; email giả trang thành ngân hàng
          hoặc dịch vụ uy tín để đánh cắp thông tin).
        </p>
        <p>
          Thách thức cốt lõi: làm sao phân biệt email rác và email thật trong
          mili-giây, khi kẻ gửi spam liên tục thay đổi cách viết &mdash; thêm
          ký tự đặc biệt, đổi ngôn ngữ, chèn hình ảnh &mdash; để qua mặt bộ
          lọc? Sai số nhỏ nhất cũng ảnh hưởng hàng triệu người: lọt spam gây
          phiền, chặn nhầm email quan trọng thì mất cơ hội kinh doanh.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Xác suất & Thống kê cơ bản"
        topicSlug="probability-statistics-in-spam-filter"
      >
        <Beat step={1}>
          <p>
            <strong>
              Lọc Bayes &mdash; nền tảng xác suất (Bayesian filtering).
            </strong>{" "}
            Năm 2002, Paul Graham công bố bài luận &ldquo;A Plan for
            Spam&rdquo; đặt nền móng cho lọc spam bằng xác suất. Ý tưởng: tính
            xác suất P(spam|từ) cho mỗi từ trong email dựa trên tần suất xuất
            hiện trong thư rác và thư thật. Công thức kết hợp Bayes tính xác
            suất tổng: P(spam|email) = &prod;P&#7522; / (&prod;P&#7522; +
            &prod;(1&minus;P&#7522;)). Nếu xác suất vượt ngưỡng 0,9, email bị
            đánh dấu là spam.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>
              Vòng phản hồi người dùng (user feedback loop).
            </strong>{" "}
            Khi bạn nhấn &ldquo;Báo cáo spam&rdquo; (Report spam) hoặc kéo
            email từ thư rác về hộp thư đến, Gmail cập nhật xác suất tiên
            nghiệm (prior probability &mdash; xác suất ban đầu trước khi có
            bằng chứng mới) cho từng mẫu từ. Hàng tỷ phản hồi mỗi ngày giúp
            hệ thống thống kê liên tục cải thiện, tạo thành vòng lặp học từ dữ
            liệu thực.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>
              TensorFlow nâng cấp mạng nơ-ron (2019).
            </strong>{" "}
            Google tích hợp TensorFlow (thư viện học máy mã nguồn mở) vào bộ
            lọc Gmail, cho phép mạng nơ-ron học các mẫu phức tạp hơn lọc Bayes
            truyền thống. Kết quả: chặn thêm 100 triệu email rác mỗi ngày so
            với trước đó. Mô hình xác suất vẫn là nền tảng &mdash; TensorFlow
            mở rộng khả năng ước lượng xác suất bằng cách học đặc trưng tự động
            từ nội dung email.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>
              RETVec &mdash; bộ mã hoá bền vững (2023).
            </strong>{" "}
            RETVec (Resilient and Efficient Text Vectorizer) biến văn bản thành
            vector (mảng số biểu diễn đặc trưng) trực tiếp từ byte UTF-8, chỉ
            với 200.000 tham số. Thiết kế này miễn nhiễm với các chiêu lẩn tránh
            như chèn ký tự vô hình, thay chữ bằng emoji, hoặc dùng ký tự
            homoglyph (ký tự trông giống nhau nhưng mã khác nhau, ví dụ chữ
            &ldquo;o&rdquo; Latin và &ldquo;о&rdquo; Cyrillic). RETVec giúp
            tăng 38% phát hiện spam, giảm 19,4% chặn nhầm và tiết kiệm 83%
            tài nguyên TPU.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="probability-statistics-in-spam-filter"
      >
        <Metric
          value="Gmail chặn khoảng 15 tỷ email rác mỗi ngày, phục vụ 1,8 tỷ người dùng"
          sourceRef={3}
        />
        <Metric
          value="Tích hợp TensorFlow (2019) chặn thêm 100 triệu spam/ngày"
          sourceRef={1}
        />
        <Metric
          value="RETVec tăng 38% phát hiện spam, giảm 19,4% false positive"
          sourceRef={2}
        />
        <Metric
          value="RETVec tiết kiệm 83% tài nguyên TPU so với mô hình trước"
          sourceRef={2}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Xác suất & Thống kê cơ bản"
        topicSlug="probability-statistics-in-spam-filter"
      >
        <p>
          Không có mô hình xác suất, hệ thống lọc thư rác chỉ có thể dùng
          danh sách đen (blacklist &mdash; danh sách địa chỉ bị chặn cố định)
          hoặc luật cứng (rule-based &mdash; kiểm tra từ khoá cố định). Cả hai
          đều dễ bị qua mặt: kẻ gửi spam chỉ cần đổi địa chỉ hoặc thay từ
          khoá là lọt qua.
        </p>
        <p>
          Lọc Bayes thay đổi cục diện bằng cách tính xác suất từ dữ liệu thực
          và tự cập nhật liên tục. Mô hình thống kê thích nghi với chiến thuật
          mới của spammer mà không cần lập trình viên viết thêm luật thủ công.
          Đây chính là sức mạnh của xác suất có điều kiện: biến kinh nghiệm quá
          khứ thành dự đoán tương lai.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
