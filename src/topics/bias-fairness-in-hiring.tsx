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
  slug: "bias-fairness-in-hiring",
  title: "Bias & Fairness in Hiring",
  titleVi: "Thiên kiến & Công bằng trong Tuyển dụng",
  description:
    "Công cụ AI tuyển dụng của Amazon bị huỷ vì phân biệt đối xử với ứng viên nữ",
  category: "ai-safety",
  tags: ["bias-fairness", "hiring", "application"],
  difficulty: "beginner",
  relatedSlugs: ["bias-fairness"],
  vizType: "static",
  applicationOf: "bias-fairness",
  featuredApp: {
    name: "Amazon",
    productFeature: "AI Recruiting Tool (scrapped)",
    company: "Amazon.com Inc.",
    countryOrigin: "US",
  },
  sources: [
    {
      title:
        "Amazon scraps secret AI recruiting tool that showed bias against women",
      publisher: "Reuters",
      url: "https://www.reuters.com/article/us-amazon-com-jobs-automation-insight/amazon-scraps-secret-ai-recruiting-tool-that-showed-bias-against-women-idUSKCN1MK08G",
      date: "2018-10",
      kind: "news",
    },
    {
      title:
        "Amazon ditched AI recruitment software because it was biased against women",
      publisher: "MIT Technology Review",
      url: "https://www.technologyreview.com/2018/10/10/139858/amazon-ditched-ai-recruitment-software-because-it-was-biased-against-women/",
      date: "2018-10",
      kind: "news",
    },
    {
      title:
        "Why Amazon's Automated Hiring Tool Discriminated Against Women",
      publisher: "American Civil Liberties Union",
      url: "https://www.aclu.org/news/womens-rights/why-amazons-automated-hiring-tool-discriminated-against",
      date: "2018-10",
      kind: "news",
    },
    {
      title:
        "Diversity in the High Tech Workforce and Sector 2014–2022",
      publisher: "U.S. Equal Employment Opportunity Commission",
      url: "https://www.eeoc.gov/sites/default/files/2024-09/20240910_Diversity%20in%20the%20High%20Tech%20Workforce%20and%20Sector%202014-2022.pdf",
      date: "2024-09",
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

export default function BiasFairnessInHiring() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Thiên kiến & Công bằng"
    >
      <ApplicationHero
        parentTitleVi="Thiên kiến & Công bằng"
        topicSlug="bias-fairness-in-hiring"
      >
        <p>
          Hãy tưởng tượng bạn nộp hồ sơ xin việc tại một trong những công ty
          công nghệ lớn nhất thế giới &mdash; nhưng trước khi bất kỳ nhà tuyển
          dụng nào đọc CV của bạn, một thuật toán (algorithm &mdash; bộ quy tắc
          để máy tính thực hiện nhiệm vụ) đã âm thầm hạ điểm bạn.
        </p>
        <p>
          Lý do? Bạn từng tham gia &ldquo;câu lạc bộ cờ vua nữ&rdquo; hoặc
          tốt nghiệp từ một trường đại học dành cho nữ giới. Không phải vì bạn
          thiếu năng lực, mà vì cỗ máy đã học rằng &ldquo;ứng viên
          giỏi&rdquo; nghĩa là &ldquo;ứng viên nam&rdquo;.
        </p>
        <p>
          Đó chính xác là những gì đã xảy ra tại Amazon (tập đoàn thương mại
          điện tử và công nghệ) từ năm 2014 đến 2017.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="bias-fairness-in-hiring">
        <p>
          Thiên kiến trong học máy (machine learning bias) xảy ra khi mô hình
          AI học và tái tạo các khuôn mẫu phân biệt đối xử có sẵn trong dữ
          liệu huấn luyện (training data &mdash; tập dữ liệu dùng để dạy mô
          hình).
        </p>
        <p>
          Khi dữ liệu lịch sử phản ánh sự bất bình đẳng &mdash; ngành công
          nghệ có tỷ lệ nam giới chiếm khoảng 77% lực lượng lao động kỹ thuật
          cao theo EEOC (Ủy ban Cơ hội Việc làm Bình đẳng Hoa Kỳ) &mdash;
          thuật toán sẽ mã hóa sự mất cân bằng thành &ldquo;tiêu chuẩn chất
          lượng&rdquo;.
        </p>
        <p>
          Kết quả là vòng lặp tự củng cố (feedback loop &mdash; vòng phản hồi):
          dữ liệu thiên lệch tạo mô hình thiên lệch, mô hình đưa ra quyết
          định thiên lệch, và quyết định đó lại trở thành dữ liệu huấn luyện
          tiếp theo.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Thiên kiến & Công bằng"
        topicSlug="bias-fairness-in-hiring"
      >
        <Beat step={1}>
          <p>
            <strong>Xây dựng công cụ AI sàng lọc hồ sơ.</strong> Năm 2014,
            Amazon thành lập đội ngũ khoảng 12 người tại Edinburgh (Scotland),
            xây dựng công cụ AI sàng lọc hồ sơ ứng viên. Hệ thống chấm điểm
            từ 1 đến 5 sao, tương tự cách đánh giá sản phẩm trên Amazon.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>Huấn luyện trên dữ liệu 10 năm.</strong> Mô hình được huấn
            luyện trên khoảng 10 năm hồ sơ xin việc, phân tích khoảng 50.000
            thuật ngữ từ CV (curriculum vitae &mdash; bản lý lịch nghề nghiệp).
            Đội ngũ tạo 500 mô hình ML (machine learning &mdash; học máy) riêng
            biệt, mỗi mô hình cho một vị trí và địa điểm cụ thể.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>Mô hình học thiên kiến giới tính.</strong> Do ngành công
            nghệ có tỷ lệ nam giới áp đảo, mô hình học rằng &ldquo;ứng viên
            lý tưởng&rdquo; mang đặc điểm nam giới. Hệ thống ưu tiên các động
            từ thường xuất hiện trong CV nam như &ldquo;executed&rdquo; (thực
            thi) và &ldquo;captured&rdquo; (nắm bắt).
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>Trừ điểm ứng viên nữ.</strong> Hệ thống trừ điểm hồ sơ
            chứa từ &ldquo;women&rsquo;s&rdquo; &mdash; ví dụ
            &ldquo;women&rsquo;s chess club captain&rdquo; (đội trưởng câu lạc
            bộ cờ vua nữ). Hệ thống cũng hạ điểm ứng viên tốt nghiệp từ hai
            trường đại học dành riêng cho nữ giới.
          </p>
        </Beat>
        <Beat step={5}>
          <p>
            <strong>Sửa lỗi thất bại.</strong> Kỹ sư cố sửa lỗi bằng cách
            loại bỏ yếu tố phân biệt đã phát hiện, nhưng không thể đảm bảo hệ
            thống không tìm ra cách mới để phân biệt ứng viên nữ. Hệ thống
            cũng đưa ra đề xuất gần như ngẫu nhiên cho nhiều vị trí.
          </p>
        </Beat>
        <Beat step={6}>
          <p>
            <strong>Huỷ dự án.</strong> Đầu năm 2017, Amazon giải tán đội ngũ
            và ngừng sử dụng công cụ. Amazon tuyên bố nhà tuyển dụng
            &ldquo;chưa bao giờ hoàn toàn dựa vào&rdquo; xếp hạng của công cụ.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="bias-fairness-in-hiring"
      >
        <Metric
          value="Huấn luyện trên khoảng 10 năm dữ liệu hồ sơ, phần lớn từ ứng viên nam"
          sourceRef={1}
        />
        <Metric
          value="500 mô hình ML, phân tích khoảng 50.000 thuật ngữ từ CV"
          sourceRef={1}
        />
        <Metric
          value="Phụ nữ chỉ chiếm khoảng 22,6% lực lượng lao động công nghệ cao tại Hoa Kỳ"
          sourceRef={4}
        />
        <Metric
          value="Đội ngũ khoảng 12 kỹ sư làm việc trong 3 năm (2014–2017) trước khi dự án bị huỷ"
          sourceRef={1}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Thiên kiến & Công bằng"
        topicSlug="bias-fairness-in-hiring"
      >
        <p>
          Nếu đội ngũ Amazon đã kiểm tra tính công bằng (fairness audit &mdash;
          đánh giá xem mô hình có cho kết quả khác nhau giữa các nhóm trên
          cùng mức năng lực) ngay từ đầu, họ có thể phát hiện thiên kiến trước
          khi triển khai.
        </p>
        <p>
          Các kỹ thuật như cân bằng dữ liệu (data balancing &mdash; điều chỉnh
          tỷ lệ các nhóm trong tập huấn luyện), ràng buộc công bằng trong hàm
          mục tiêu (fairness constraints &mdash; quy tắc buộc mô hình đối xử
          bình đẳng), hoặc loại bỏ đặc trưng tương quan với giới tính có thể
          giảm đáng kể thiên lệch.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
