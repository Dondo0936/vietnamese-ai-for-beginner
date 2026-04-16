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
  slug: "decision-trees-in-loan-scoring",
  title: "Decision Trees in Credit Scoring",
  titleVi: "Cây quyết định trong Chấm điểm Tín dụng",
  description:
    "Cách FICO dùng cây quyết định để chấm điểm tín dụng cho hơn 200 triệu người Mỹ — nền tảng cho mọi quyết định cho vay",
  category: "classic-ml",
  tags: ["classification", "finance", "credit-scoring", "application"],
  difficulty: "beginner",
  relatedSlugs: ["decision-trees"],
  vizType: "static",
  applicationOf: "decision-trees",
  featuredApp: {
    name: "FICO Score",
    productFeature: "Credit Scoring",
    company: "Fair Isaac Corporation",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "Explainable Machine Learning in Credit Risk Management",
      publisher: "FICO Blog",
      url: "https://www.fico.com/blogs/explainable-machine-learning-credit-risk-management",
      date: "2020-06",
      kind: "engineering-blog",
    },
    {
      title: "Machine Learning and the FICO Score",
      publisher: "FICO Blog",
      url: "https://www.fico.com/blogs/machine-learning-and-fico-score",
      date: "2019-09",
      kind: "engineering-blog",
    },
    {
      title: "Using Alternative Data in Credit Underwriting",
      publisher: "Consumer Financial Protection Bureau (CFPB)",
      url: "https://www.consumerfinance.gov/data-research/research-reports/using-alternative-data-in-credit-underwriting/",
      date: "2019-12",
      kind: "documentation",
    },
    {
      title: "A Survey of Credit Scoring Research Based on Machine Learning",
      publisher: "Springer — Computational Economics",
      url: "https://link.springer.com/article/10.1007/s10614-023-10467-7",
      date: "2023-08",
      kind: "paper",
    },
    {
      title: "What Is a FICO Score?",
      publisher: "FICO",
      url: "https://www.myfico.com/credit-education/credit-scores",
      date: "2024-01",
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

export default function DecisionTreesInLoanScoring() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Cây quyết định"
    >
      <ApplicationHero
        parentTitleVi="Cây quyết định"
        topicSlug="decision-trees-in-loan-scoring"
      >
        <p>
          Bạn nộp đơn vay mua nhà. Trong vài giây, ngân hàng đã biết bạn có
          được duyệt hay không &mdash; dựa trên điểm FICO (Fair Isaac
          Corporation &mdash; thang điểm tín dụng phổ biến nhất nước Mỹ). Con
          số từ 300 đến 850 này quyết định lãi suất bạn được hưởng, hạn mức
          thẻ tín dụng, và thậm chí cả việc bạn có thuê được căn hộ hay không.
        </p>
        <p>
          Đằng sau điểm FICO là cây quyết định (decision tree &mdash; mô hình
          phân loại bằng chuỗi câu hỏi có/không). Từ dữ liệu tài chính của
          bạn, mô hình đi qua từng nhánh &mdash; &ldquo;Lịch sử thanh toán có
          trễ hạn không?&rdquo;, &ldquo;Tỷ lệ sử dụng tín dụng bao
          nhiêu?&rdquo; &mdash; để đến kết luận cuối cùng.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="decision-trees-in-loan-scoring">
        <p>
          Hơn 200 triệu người Mỹ trưởng thành có hồ sơ tín dụng. Mỗi ngày,
          ngân hàng và tổ chức tài chính thực hiện hơn 10 tỷ lượt truy vấn
          điểm FICO để ra quyết định cho vay. Quyết định sai &mdash; cho vay
          người không trả được &mdash; gây tổn thất hàng tỷ đô-la.
        </p>
        <p>
          Vấn đề cốt lõi: phân loại mỗi người vay thành mức rủi ro &mdash;
          nhưng phải giải thích được tại sao. Luật pháp Mỹ (Đạo luật ECOA
          &mdash; Equal Credit Opportunity Act, luật cơ hội tín dụng bình đẳng)
          yêu cầu khi từ chối cho vay, tổ chức tài chính phải nêu rõ lý do.
          Mô hình &ldquo;hộp đen&rdquo; không đáp ứng được yêu cầu pháp lý
          này.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Cây quyết định"
        topicSlug="decision-trees-in-loan-scoring"
      >
        <Beat step={1}>
          <p>
            <strong>
              Năm nhóm đặc trưng (feature groups &mdash; các nhóm thông tin
              đầu vào).
            </strong>{" "}
            FICO Score dựa trên 5 nhóm: lịch sử thanh toán (chiếm 35% trọng
            số), tổng nợ hiện tại (30%), thời gian sử dụng tín dụng (15%),
            tín dụng mới (10%), và đa dạng loại tín dụng (10%). Mỗi nhóm chứa
            nhiều biến chi tiết được rút từ báo cáo tín dụng của ba cơ quan
            Equifax, Experian và TransUnion.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>
              Phân chia bằng cây quyết định (decision tree splitting &mdash;
              chọn điều kiện tối ưu tại mỗi nút).
            </strong>{" "}
            Tại mỗi nút, thuật toán chọn câu hỏi phân chia tốt nhất: ví dụ
            &ldquo;Có trễ hạn thanh toán hơn 30 ngày trong 2 năm qua
            không?&rdquo;. Tiêu chí chọn dựa trên information gain (lượng
            thông tin thu được &mdash; đo bằng entropy) hoặc Gini impurity
            (chỉ số Gini &mdash; đo mức độ lẫn lộn giữa các lớp). Nhánh trái
            và phải tiếp tục phân chia cho đến khi đạt kết luận về mức rủi ro.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>
              Phương pháp ensemble (kết hợp nhiều cây).
            </strong>{" "}
            Một cây quyết định đơn lẻ dễ bị overfitting (quá khớp &mdash; học
            thuộc dữ liệu huấn luyện thay vì học mẫu tổng quát). FICO và các
            tổ chức tài chính dùng gradient boosted trees (cây tăng cường
            gradient &mdash; xây dựng nhiều cây tuần tự, mỗi cây sửa lỗi của
            cây trước) để cải thiện độ chính xác lên 20% so với scorecard
            truyền thống.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>
              Giải thích hành động bất lợi (adverse action explanation &mdash;
              nêu lý do khi từ chối tín dụng).
            </strong>{" "}
            Đây là lợi thế lớn nhất của cây quyết định: mỗi quyết định có thể
            truy ngược lại chuỗi câu hỏi. Khi bị từ chối, người vay nhận được
            lý do cụ thể: &ldquo;Tỷ lệ sử dụng tín dụng quá cao&rdquo; hoặc
            &ldquo;Lịch sử thanh toán có trễ hạn&rdquo;. Tính minh bạch này
            đáp ứng yêu cầu của ECOA và giúp người vay biết cần cải thiện
            điều gì.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="decision-trees-in-loan-scoring"
      >
        <Metric
          value="Hơn 200 triệu người Mỹ trưởng thành được chấm điểm FICO"
          sourceRef={5}
        />
        <Metric
          value="90% ngân hàng lớn nhất nước Mỹ sử dụng điểm FICO trong quyết định cho vay"
          sourceRef={5}
        />
        <Metric
          value="Hơn 10 tỷ lượt truy vấn điểm FICO mỗi năm"
          sourceRef={2}
        />
        <Metric
          value="Mô hình ML + scorecard cải thiện 20% độ chính xác so với phương pháp truyền thống"
          sourceRef={4}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Cây quyết định"
        topicSlug="decision-trees-in-loan-scoring"
      >
        <p>
          Không có cây quyết định, hệ thống chấm điểm tín dụng sẽ phải dùng
          mạng nơ-ron hoặc mô hình phức tạp khác &mdash; chính xác hơn nhưng
          không giải thích được tại sao từ chối. Điều này vi phạm pháp luật
          và gây mất niềm tin.
        </p>
        <p>
          Cây quyết định mang lại điều mà ít thuật toán khác làm được: vừa
          phân loại chính xác, vừa giải thích minh bạch. Mỗi nhánh cây là một
          lý do có thể hiểu được &mdash; từ &ldquo;trễ hạn thanh toán&rdquo;
          đến &ldquo;sử dụng quá nhiều tín dụng&rdquo;. Trong tài chính, nơi
          mỗi quyết định ảnh hưởng đến cuộc sống con người, tính minh bạch
          này không chỉ là ưu điểm kỹ thuật mà còn là yêu cầu đạo đức.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
