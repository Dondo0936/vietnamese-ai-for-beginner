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
  slug: "mlp-in-credit-scoring",
  title: "MLP in Credit Scoring",
  titleVi: "Mạng đa tầng trong Chấm điểm Tín dụng",
  description:
    "Cách Upstart dùng mạng nơ-ron đa tầng để chấm điểm tín dụng, duyệt thêm 27% người vay với lãi suất thấp hơn 16%",
  category: "neural-fundamentals",
  tags: ["mlp", "credit-scoring", "application"],
  difficulty: "beginner",
  relatedSlugs: ["mlp"],
  vizType: "static",
  applicationOf: "mlp",
  featuredApp: {
    name: "Upstart",
    productFeature: "AI Credit Scoring",
    company: "Upstart Network, Inc.",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "How AI Drives More Affordable Credit Access",
      publisher: "Upstart",
      url: "https://info.upstart.com/how-ai-drives-more-affordable-credit-access",
      date: "2021-06",
      kind: "engineering-blog",
    },
    {
      title:
        "The Use of Machine Learning for Credit Underwriting: Market and Data Science Context",
      publisher: "FinRegLab",
      url: "https://finreglab.org/wp-content/uploads/2023/12/FinRegLab_2021-09-16_Research-Report_The-Use-of-Machine-Learning-for-Credit-Underwriting_Market-and-Data-Science-Context.pdf",
      date: "2021-09",
      kind: "paper",
    },
    {
      title:
        "Fresh Off IPO, Upstart Aims to Push Boundaries of AI-based Lending",
      publisher: "American Banker",
      url: "https://www.americanbanker.com/news/fresh-off-ipo-upstart-aims-to-push-boundaries-of-ai-based-lending",
      date: "2021-01",
      kind: "news",
    },
    {
      title: "Neural Network Credit Scoring Models",
      publisher: "Computers & Operations Research (Elsevier)",
      url: "https://www.cse.fau.edu/~xqzhu/courses/cap5615/reading/credit.score.pdf",
      date: "2000-01",
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

export default function MlpInCreditScoring() {
  return (
    <ApplicationLayout metadata={metadata} parentTitleVi="Mạng đa tầng">
      <ApplicationHero
        parentTitleVi="Mạng đa tầng"
        topicSlug="mlp-in-credit-scoring"
      >
        <p>
          Bạn nộp đơn vay tiêu dùng trên Upstart (nền tảng cho vay trực
          tuyến dùng AI). Thay vì chỉ xem điểm FICO (thang điểm tín dụng
          truyền thống dựa trên lịch sử vay-trả), hệ thống phân tích hàng
          trăm biến số &mdash; từ trình độ học vấn, lịch sử việc làm đến hành
          vi tài chính &mdash; và đưa ra quyết định trong vài phút.
        </p>
        <p>
          Đằng sau là một mạng nơ-ron đa tầng (Multi-Layer Perceptron &mdash;
          MLP, kiến trúc mạng gồm nhiều tầng nơ-ron nối tiếp nhau). MLP có
          khả năng nắm bắt mối quan hệ phi tuyến (nonlinear relationship
          &mdash; quan hệ không theo đường thẳng) giữa hàng trăm biến đầu vào,
          điều mà mô hình hồi quy logistic (logistic regression &mdash; phương
          pháp thống kê truyền thống) không thể làm hiệu quả.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="mlp-in-credit-scoring">
        <p>
          Hệ thống chấm điểm FICO truyền thống chỉ dựa trên khoảng 20 biến
          tài chính: lịch sử trả nợ, tổng dư nợ, thời gian có tín dụng. Mô
          hình hồi quy logistic &mdash; tiêu chuẩn ngành từ thập niên
          1980 &mdash; giả định mối quan hệ tuyến tính giữa các biến và xác
          suất vỡ nợ.
        </p>
        <p>
          Vấn đề: hàng triệu người có khả năng trả nợ tốt nhưng bị từ chối
          vì thiếu lịch sử tín dụng dài (&ldquo;thin file&rdquo; &mdash; hồ
          sơ mỏng). Đặc biệt là giới trẻ, người nhập cư, hoặc người chưa
          từng vay ngân hàng. Cần một mô hình có thể khai thác nhiều nguồn dữ
          liệu hơn và phát hiện các mẫu (pattern) phức tạp hơn.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Mạng đa tầng"
        topicSlug="mlp-in-credit-scoring"
      >
        <Beat step={1}>
          <p>
            <strong>Thu thập đặc trưng đa chiều.</strong> Upstart thu thập hơn
            1.600 biến số từ hồ sơ người vay: trình độ học vấn, chuyên ngành,
            lịch sử việc làm, thu nhập, hành vi tài chính, và nhiều yếu tố
            khác mà FICO bỏ qua. Dữ liệu được chuẩn hóa (normalize &mdash;
            đưa về cùng thang đo) trước khi đưa vào mạng.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>
              Lan truyền qua các tầng ẩn (hidden layers &mdash; tầng xử lý
              trung gian trong MLP).
            </strong>{" "}
            Dữ liệu đầu vào đi qua nhiều tầng nơ-ron. Mỗi nơ-ron tính tổng
            có trọng số (weighted sum) của đầu vào, rồi áp dụng hàm kích hoạt
            phi tuyến (nonlinear activation function). Qua mỗi tầng, mạng
            học được các mẫu phức tạp hơn &mdash; ví dụ: &ldquo;người có bằng
            kỹ sư + việc ổn định 2 năm + thu nhập trung bình&rdquo; có rủi ro
            thấp dù hồ sơ tín dụng mỏng.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>Đầu ra xác suất vỡ nợ.</strong> Tầng cuối cùng dùng hàm
            sigmoid (hàm S, nén giá trị về khoảng 0-1) để cho ra xác suất
            người vay sẽ vỡ nợ. Nếu xác suất dưới ngưỡng &mdash; duyệt đơn
            vay và tính lãi suất tương ứng rủi ro.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>Huấn luyện trên dữ liệu lịch sử.</strong> MLP được huấn
            luyện trên hàng triệu khoản vay đã có kết quả (trả đúng hạn hay
            vỡ nợ), dùng backpropagation (lan truyền ngược) để tối ưu trọng
            số. Khoảng 70% khoản vay trên Upstart được duyệt hoàn toàn tự
            động &mdash; không cần nhân viên xem xét.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="mlp-in-credit-scoring"
      >
        <Metric
          value="Mô hình AI của Upstart duyệt thêm 27% người vay so với mô hình truyền thống"
          sourceRef={1}
        />
        <Metric
          value="Lãi suất trung bình thấp hơn 16% so với mô hình chỉ dùng FICO"
          sourceRef={1}
        />
        <Metric
          value="~70% khoản vay được duyệt hoàn toàn tự động, không cần nhân viên xem xét"
          sourceRef={3}
        />
        <Metric
          value="Upstart IPO tháng 12/2020, định giá 1,5 tỉ USD — minh chứng thị trường tin tưởng mô hình MLP"
          sourceRef={3}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Mạng đa tầng"
        topicSlug="mlp-in-credit-scoring"
      >
        <p>
          Nếu chỉ dùng hồi quy logistic với 20 biến FICO, hàng triệu người
          có khả năng trả nợ nhưng thiếu lịch sử tín dụng sẽ tiếp tục bị từ
          chối hoặc phải chịu lãi suất cao bất hợp lý.
        </p>
        <p>
          MLP cho phép khai thác hàng trăm biến số và phát hiện mối quan hệ
          phi tuyến mà hồi quy logistic bỏ lỡ. Kết quả: mở rộng tiếp cận tín
          dụng cho nhóm dân số bị thiệt thòi, đồng thời giảm rủi ro vỡ nợ cho
          ngân hàng.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
