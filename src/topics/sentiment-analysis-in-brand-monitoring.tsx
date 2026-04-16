"use client";

import type { TopicMeta } from "@/lib/types";
import ApplicationLayout from "@/components/application/ApplicationLayout";
import ApplicationHero from "@/components/application/ApplicationHero";
import ApplicationProblem from "@/components/application/ApplicationProblem";
import ApplicationMechanism from "@/components/application/ApplicationMechanism";
import Beat from "@/components/application/Beat";
import ApplicationMetrics from "@/components/application/ApplicationMetrics";
import Metric from "@/components/application/Metric";
import ApplicationTryIt from "@/components/application/ApplicationTryIt";
import ApplicationCounterfactual from "@/components/application/ApplicationCounterfactual";
import { InlineChallenge } from "@/components/interactive";

export const metadata: TopicMeta = {
  slug: "sentiment-analysis-in-brand-monitoring",
  title: "Sentiment Analysis in Brand Monitoring",
  titleVi: "Phân tích cảm xúc trong Giám sát thương hiệu",
  description:
    "Cách Brandwatch dùng phân tích cảm xúc để quét hơn 100 triệu nguồn trực tuyến, phát hiện khủng hoảng truyền thông thời gian thực",
  category: "nlp",
  tags: ["sentiment-analysis", "brand-monitoring", "application"],
  difficulty: "beginner",
  relatedSlugs: ["sentiment-analysis"],
  vizType: "static",
  applicationOf: "sentiment-analysis",
  featuredApp: {
    name: "Brandwatch",
    productFeature: "Listen (Social Listening)",
    company: "Brandwatch (Cision)",
    countryOrigin: "GB",
  },
  sources: [
    {
      title:
        "The Data Science Behind Brandwatch's New Sentiment Analysis",
      publisher: "Brandwatch",
      url: "https://www.brandwatch.com/blog/data-science-behind-brandwatchs-new-sentiment-analysis/",
      date: "2022-01",
      kind: "engineering-blog",
    },
    {
      title: "Sentiment and Emotion Analysis",
      publisher: "Brandwatch Help Center",
      url: "https://social-media-management-help.brandwatch.com/hc/en-us/articles/4555786479901-Sentiment-and-Emotion-Analysis",
      date: "2025",
      kind: "documentation",
    },
    {
      title: "Brandwatch is acquired by Cision for $450M",
      publisher: "TechCrunch",
      url: "https://techcrunch.com/2021/02/26/brandwatch-is-acquired-by-cision-for-450m-creating-a-pr-marketing-and-social-listening-giant/",
      date: "2021-02",
      kind: "news",
    },
  ],
  tocSections: [
    { id: "hero", labelVi: "Công ty nào?" },
    { id: "problem", labelVi: "Vấn đề" },
    { id: "mechanism", labelVi: "Cách giải quyết" },
    { id: "metrics", labelVi: "Con số thật" },
    { id: "tryIt", labelVi: "Thử tự tay" },
    { id: "counterfactual", labelVi: "Nếu không có" },
  ],
};

export default function SentimentAnalysisInBrandMonitoring() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Phân tích cảm xúc"
    >
      <ApplicationHero
        parentTitleVi="Phân tích cảm xúc"
        topicSlug="sentiment-analysis-in-brand-monitoring"
      >
        <p>
          Một buổi sáng thứ Hai, đội truyền thông của một hãng hàng không phát
          hiện làn sóng phẫn nộ trên mạng xã hội sau video hành khách bị đối xử
          thô bạo. Brandwatch (nền tảng lắng nghe mạng xã hội của Cision, Anh
          Quốc) đã quét hơn 100 triệu nguồn trực tuyến, phân loại tự động hàng
          triệu bài đăng thành tích cực, tiêu cực hoặc trung lập chỉ trong vài
          phút.
        </p>
        <p>
          Nhờ cảnh báo thời gian thực từ hệ thống phân tích cảm xúc (sentiment
          analysis &mdash; kỹ thuật xử lý ngôn ngữ tự nhiên xác định sắc thái
          của văn bản), đội ngũ xử lý khủng hoảng kịp thời phản hồi trước khi
          cảm xúc tiêu cực lan rộng.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="sentiment-analysis-in-brand-monitoring">
        <p>
          Mỗi ngày, hàng triệu người bày tỏ ý kiến về thương hiệu trên mạng xã
          hội, diễn đàn và trang đánh giá. Đọc thủ công từng bài viết là bất khả
          thi.
        </p>
        <p>
          Phân tích cảm xúc là kỹ thuật xử lý ngôn ngữ tự nhiên (NLP &mdash;
          Natural Language Processing) giúp máy tính tự động xác định một đoạn
          văn bản mang sắc thái tích cực, tiêu cực hay trung lập. Hệ thống phân
          tích từ ngữ, cấu trúc câu, biểu tượng cảm xúc (emoji), phủ định và
          ngữ cảnh.
        </p>
        <p>
          Trong giám sát thương hiệu (brand monitoring), phân tích cảm xúc cho
          phép theo dõi dư luận thời gian thực, phát hiện khủng hoảng sớm, và đo
          lường hiệu quả chiến dịch truyền thông.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Phân tích cảm xúc"
        topicSlug="sentiment-analysis-in-brand-monitoring"
      >
        <Beat step={1}>
          <p>
            <strong>Thu thập dữ liệu đa nguồn.</strong> Brandwatch thu thập văn
            bản từ hơn 100 triệu nguồn gồm mạng xã hội, diễn đàn, blog, trang
            tin tức. Tổng cộng hơn 1,4 nghìn tỷ bài đăng được lưu trong cơ sở
            dữ liệu Consumer Research (bộ dữ liệu nghiên cứu người tiêu dùng).
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>Huấn luyện mô hình bằng học chuyển giao.</strong> Mô hình
            transformer (kiến trúc mạng nơ-ron dùng cơ chế chú ý) được tiền huấn
            luyện (pre-train &mdash; huấn luyện ban đầu trên dữ liệu lớn) trên
            104 ngôn ngữ. Sau đó, mô hình được tinh chỉnh (fine-tune &mdash;
            huấn luyện thêm trên dữ liệu chuyên biệt) trên dữ liệu mạng xã hội
            gồm viết tắt, tiếng lóng và biểu tượng cảm xúc. Bước cuối: huấn
            luyện có giám sát (supervised learning &mdash; học từ dữ liệu đã gán
            nhãn) với dữ liệu gán nhãn từ 12 ngôn ngữ, nhưng đánh giá tốt trên
            44 ngôn ngữ nhờ chuyển giao tri thức (transfer learning &mdash;
            chuyển kiến thức từ ngôn ngữ này sang ngôn ngữ khác).
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>Phân loại theo ngữ cảnh.</strong> Mô hình phân tích toàn bộ
            ngữ cảnh: thứ tự từ, phủ định (&ldquo;not good&rdquo; = tiêu cực),
            biểu tượng cảm xúc, chữ hoa/thường, và phân tách hình thái
            (morphological decomposition &mdash; tách từ thành các thành phần có
            nghĩa). Mỗi bài đăng được gán nhãn tích cực, tiêu cực hoặc trung
            lập.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>Phân tích cảm xúc sâu.</strong> Ngoài ba nhãn cơ bản, hệ
            thống phân loại 6 cảm xúc phổ quát: giận dữ, ghê tởm, sợ hãi, vui
            mừng, ngạc nhiên, buồn bã. Hệ thống dùng logistic regression (hồi
            quy logistic &mdash; thuật toán phân loại xác suất) được huấn luyện
            trên hơn 2 triệu bài đăng, đạt độ chính xác 60&ndash;70%.
          </p>
        </Beat>
        <Beat step={5}>
          <p>
            <strong>Cảnh báo thời gian thực.</strong> Tính năng Signals (tín
            hiệu) phát hiện đột biến khối lượng đề cập hoặc thay đổi cảm xúc,
            gửi cảnh báo sớm cho đội thương hiệu. Iris AI (trợ lý AI tích hợp)
            hỗ trợ tóm tắt xu hướng và đề xuất phản hồi.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="sentiment-analysis-in-brand-monitoring"
      >
        <Metric
          value="Độ chính xác 60–75% (con người chỉ đồng thuận khoảng 80%)"
          sourceRef={2}
        />
        <Metric
          value="Cải thiện 18% độ chính xác nhờ kiến trúc transformer với học chuyển giao"
          sourceRef={1}
        />
        <Metric
          value="Hỗ trợ 44 ngôn ngữ, tiền huấn luyện trên 104 ngôn ngữ, quét hơn 100 triệu nguồn"
          sourceRef={1}
        />
        <Metric
          value="2/3 thương hiệu giá trị nhất Forbes tin dùng Brandwatch"
          sourceRef={3}
        />
      </ApplicationMetrics>

      <ApplicationTryIt topicSlug="sentiment-analysis-in-brand-monitoring">
        <p className="mb-4 text-sm text-muted">
          Bạn là AI phân tích cảm xúc. Hãy gán nhãn cho từng bài đăng mạng xã
          hội bên dưới: tích cực, tiêu cực, hay trung lập?
        </p>

        <div className="space-y-4">
          <InlineChallenge
            question="Bài 1: 'Vừa bay hãng X xong, dịch vụ tuyệt vời, tiếp viên thân thiện lắm! ✈️❤️'"
            options={["Tích cực", "Tiêu cực", "Trung lập"]}
            correct={0}
            explanation="Từ ngữ 'tuyệt vời', 'thân thiện' cùng emoji ❤️ cho thấy sắc thái tích cực rõ ràng. Đây là trường hợp dễ nhất cho AI."
          />

          <InlineChallenge
            question="Bài 2: 'Hãng Y hoãn chuyến 3 tiếng mà không một lời xin lỗi. Không bao giờ bay lại.'"
            options={["Tích cực", "Tiêu cực", "Trung lập"]}
            correct={1}
            explanation="'Không một lời xin lỗi' và 'không bao giờ bay lại' thể hiện sự phẫn nộ. Phủ định kép ('không... không') tăng mức tiêu cực."
          />

          <InlineChallenge
            question="Bài 3: 'Hãng Z vừa mở đường bay Hà Nội – Đà Nẵng, giá vé từ 1,2 triệu đồng.'"
            options={["Tích cực", "Tiêu cực", "Trung lập"]}
            correct={2}
            explanation="Đây là thông tin thuần túy, không có từ ngữ đánh giá hay cảm xúc. AI cần phân biệt tin tức khách quan với ý kiến chủ quan."
          />

          <InlineChallenge
            question="Bài 4: 'Ôi dịch vụ 5 sao thật đấy 🙄 Chờ hành lý 2 tiếng luôn.'"
            options={["Tích cực", "Tiêu cực", "Trung lập"]}
            correct={1}
            explanation="Đây là mỉa mai (sarcasm). '5 sao' trông tích cực nhưng emoji 🙄 và 'chờ 2 tiếng' cho thấy người viết đang phàn nàn. Mỉa mai là thách thức lớn nhất cho AI phân tích cảm xúc."
          />

          <InlineChallenge
            question="Bài 5: 'Wifi trên máy bay hãng W không tệ lắm, dùng tạm được.'"
            options={["Tích cực", "Tiêu cực", "Trung lập"]}
            correct={0}
            explanation="'Không tệ lắm' là phủ định của tiêu cực — nghĩa là hơi tích cực. 'Dùng tạm được' xác nhận sắc thái tích cực nhẹ. AI cần hiểu phủ định kép ('không' + 'tệ') để phân loại đúng."
          />
        </div>
      </ApplicationTryIt>

      <ApplicationCounterfactual
        parentTitleVi="Phân tích cảm xúc"
        topicSlug="sentiment-analysis-in-brand-monitoring"
      >
        <p>
          Nếu không có phân tích cảm xúc tự động, doanh nghiệp phải thuê hàng
          trăm nhân viên đọc thủ công hàng triệu bài đăng mỗi ngày &mdash; chậm
          hàng giờ, tốn kém, và không mở rộng sang 44 ngôn ngữ.
        </p>
        <p>
          Khủng hoảng truyền thông sẽ bùng phát trước khi được phát hiện.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
