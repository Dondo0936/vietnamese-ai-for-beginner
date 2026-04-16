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
  slug: "explainability-in-credit-decisions",
  title: "Explainability in Credit Decisions",
  titleVi: "Giải thích được trong Quyết định Tín dụng",
  description:
    "GDPR và CFPB yêu cầu ngân hàng phải giải thích khi AI từ chối cấp tín dụng — không được dùng hộp đen",
  category: "ai-safety",
  tags: ["explainability", "credit", "application"],
  difficulty: "beginner",
  relatedSlugs: ["explainability"],
  vizType: "static",
  applicationOf: "explainability",
  featuredApp: {
    name: "GDPR / CFPB Credit Decisions",
    productFeature: "Right to Explanation for Automated Credit Scoring",
    company: "EU / US Regulators",
    countryOrigin: "EU",
  },
  sources: [
    {
      title:
        "Art. 22 GDPR — Automated individual decision-making, including profiling",
      publisher: "GDPR-info.eu",
      url: "https://gdpr-info.eu/art-22-gdpr/",
      date: "2018-05",
      kind: "documentation",
    },
    {
      title:
        "CFPB Issues Guidance on Credit Denials by Lenders Using Artificial Intelligence",
      publisher: "Consumer Financial Protection Bureau",
      url: "https://www.consumerfinance.gov/about-us/newsroom/cfpb-issues-guidance-on-credit-denials-by-lenders-using-artificial-intelligence/",
      date: "2023-09",
      kind: "documentation",
    },
    {
      title:
        "Understanding Right to Explanation and Automated Decision-Making in Europe's GDPR and AI Act",
      publisher: "TechPolicy.Press",
      url: "https://www.techpolicy.press/understanding-right-to-explanation-and-automated-decisionmaking-in-europes-gdpr-and-ai-act/",
      date: "2024-03",
      kind: "news",
    },
    {
      title:
        "CFPB Applies Adverse Action Notification Requirement to Artificial Intelligence Models",
      publisher: "Skadden, Arps, Slate, Meagher & Flom LLP",
      url: "https://www.skadden.com/insights/publications/2024/01/cfpb-applies-adverse-action-notification-requirement",
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

export default function ExplainabilityInCreditDecisions() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Giải thích được"
    >
      <ApplicationHero
        parentTitleVi="Giải thích được"
        topicSlug="explainability-in-credit-decisions"
      >
        <p>
          Bạn nộp đơn vay mua nhà và bị từ chối. Khi hỏi lý do, ngân hàng
          trả lời: &ldquo;Thuật toán AI quyết định&rdquo;. Không ai &mdash;
          kể cả nhân viên ngân hàng &mdash; có thể giải thích tại sao. Đây
          không phải kịch bản giả tưởng mà là vấn đề thực tế mà hàng triệu
          người đối mặt.
        </p>
        <p>
          Để bảo vệ người tiêu dùng, GDPR (Quy định Bảo vệ Dữ liệu Chung
          của EU) và CFPB (Cục Bảo vệ Tài chính Người tiêu dùng Hoa Kỳ) đã
          ban hành quy định yêu cầu: khi AI từ chối tín dụng, tổ chức tài
          chính phải giải thích lý do cụ thể và chính xác &mdash; không được
          dùng &ldquo;hộp đen&rdquo; (black box &mdash; hệ thống không thể
          giải thích).
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="explainability-in-credit-decisions">
        <p>
          Explainability (giải thích được / XAI &mdash; Explainable AI) là khả
          năng giải thích tại sao mô hình AI đưa ra một quyết định cụ thể,
          bằng ngôn ngữ mà con người có thể hiểu và kiểm chứng.
        </p>
        <p>
          Nhiều mô hình chấm điểm tín dụng hiện đại sử dụng deep learning
          (học sâu &mdash; mạng nơ-ron nhiều lớp) với hàng triệu tham số.
          Mặc dù chính xác, các mô hình này là &ldquo;hộp đen&rdquo; &mdash;
          ngay cả chuyên gia cũng khó giải thích tại sao mô hình cho người
          A được vay nhưng từ chối người B.
        </p>
        <p>
          Khi quyết định tín dụng ảnh hưởng đến cuộc sống của con người
          &mdash; mua nhà, khởi nghiệp, trả học phí &mdash; việc không thể
          giải thích tại sao bị từ chối là vi phạm quyền cơ bản của người
          tiêu dùng.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Giải thích được"
        topicSlug="explainability-in-credit-decisions"
      >
        <Beat step={1}>
          <p>
            <strong>GDPR Điều 22: quyền không bị quyết định tự động.</strong>{" "}
            GDPR quy định người dân EU có quyền không bị áp đặt bởi quyết định
            hoàn toàn tự động nếu quyết định đó tạo ra &ldquo;hiệu ứng pháp
            lý&rdquo; hoặc &ldquo;ảnh hưởng đáng kể tương tự&rdquo;. Tổ chức
            phải cung cấp &ldquo;thông tin có ý nghĩa về logic liên
            quan&rdquo; (meaningful information about the logic involved).
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>CJEU xác nhận quyền giải thích thực chất.</strong> Tòa án
            Công lý EU (CJEU &mdash; Court of Justice of the European Union)
            trong vụ Dun &amp; Bradstreet Austria xác nhận: tổ chức phải giải
            thích &ldquo;quy trình và nguyên tắc thực sự được áp dụng&rdquo;
            (procedure and principles actually applied) &mdash; không chỉ nói
            chung chung mà phải giải thích cụ thể cho từng trường hợp.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>CFPB cấm dùng biểu mẫu &ldquo;đánh dấu ô&rdquo;.</strong>{" "}
            Tháng 9 năm 2023, CFPB ban hành hướng dẫn: ngân hàng dùng AI để
            quyết định tín dụng không được sử dụng biểu mẫu từ chối chung
            (checkbox form). Mỗi lần từ chối phải nêu lý do cá nhân hóa, cụ
            thể, và liên quan trực tiếp đến hành vi tài chính thực tế của
            người nộp đơn.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>Buộc phải hiểu mô hình trước khi triển khai.</strong> CFPB
            tuyên bố rõ: tổ chức tín dụng phải hiểu hệ thống AI của mình
            &mdash; biết đầu vào nào được sử dụng và cách chúng ảnh hưởng đến
            kết quả &mdash; bất kể mô hình phức tạp đến đâu. ECOA (Đạo luật
            Cơ hội Tín dụng Bình đẳng) không cho phép sử dụng &ldquo;hộp
            đen&rdquo; nếu điều đó có nghĩa là không thể giải thích quyết
            định.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="explainability-in-credit-decisions"
      >
        <Metric
          value="GDPR Điều 22 bảo vệ hơn 450 triệu người dân EU khỏi quyết định tự động thiếu giải thích"
          sourceRef={1}
        />
        <Metric
          value="CFPB Circular 2023-03 yêu cầu lý do từ chối cá nhân hóa cho mọi quyết định tín dụng AI"
          sourceRef={2}
        />
        <Metric
          value="CJEU xác nhận quyền được giải thích thực chất — không chỉ giải thích hình thức"
          sourceRef={3}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Giải thích được"
        topicSlug="explainability-in-credit-decisions"
      >
        <p>
          Nếu không có yêu cầu giải thích, ngân hàng có thể triển khai mô hình
          AI &ldquo;hộp đen&rdquo; mà không ai &mdash; kể cả chính ngân
          hàng &mdash; hiểu tại sao người này được duyệt còn người kia bị từ
          chối. Thiên kiến ẩn trong dữ liệu lịch sử (phân biệt chủng tộc, giới
          tính) sẽ được mô hình tái tạo mà không ai phát hiện.
        </p>
        <p>
          Yêu cầu giải thích buộc ngành tài chính phải đầu tư vào Explainable
          AI &mdash; tạo ra các mô hình vừa chính xác vừa minh bạch, bảo vệ
          quyền lợi của hàng triệu người tiêu dùng trên toàn thế giới.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
