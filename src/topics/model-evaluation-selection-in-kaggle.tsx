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
  slug: "model-evaluation-selection-in-kaggle",
  title: "Model Evaluation & Selection in Kaggle",
  titleVi: "Đánh giá & Chọn mô hình trên Kaggle",
  description:
    "Chiến thuật chọn model, cross-validation, và ensemble stacking mà Kaggle Grandmaster dùng để chiến thắng các cuộc thi dữ liệu lớn",
  category: "classic-ml",
  tags: ["model-evaluation", "kaggle", "application"],
  difficulty: "intermediate",
  relatedSlugs: ["model-evaluation-selection"],
  vizType: "static",
  applicationOf: "model-evaluation-selection",
  featuredApp: {
    name: "Kaggle",
    productFeature: "Competition Platform",
    company: "Google LLC",
    countryOrigin: "US",
  },
  sources: [
    {
      title:
        "Kaggle Champions: Ensemble Methods in Machine Learning",
      publisher: "Toptal Engineering",
      url: "https://www.toptal.com/developers/machine-learning/ensemble-methods-kaggle-machine-learn",
      date: "2023-05",
      kind: "engineering-blog",
    },
    {
      title:
        "Grandmaster Pro Tip: Winning First Place in a Kaggle Competition with Stacking Using cuML",
      publisher: "NVIDIA Technical Blog",
      url: "https://developer.nvidia.com/blog/grandmaster-pro-tip-winning-first-place-in-a-kaggle-competition-with-stacking-using-cuml/",
      date: "2025-04",
      kind: "engineering-blog",
    },
    {
      title:
        "The Kaggle Grandmasters Playbook: 7 Battle-Tested Modeling Techniques for Tabular Data",
      publisher: "NVIDIA Technical Blog",
      url: "https://developer.nvidia.com/blog/the-kaggle-grandmasters-playbook-7-battle-tested-modeling-techniques-for-tabular-data/",
      date: "2024-12",
      kind: "engineering-blog",
    },
    {
      title:
        "Ensembling with Blending and Stacking Solutions — The Kaggle Book",
      publisher: "Packt Publishing (Luca Massaron & Konrad Banachewicz)",
      url: "https://www.oreilly.com/library/view/the-kaggle-book/9781835083208/Text/Chapter_10.xhtml",
      date: "2024-06",
      kind: "documentation",
    },
    {
      title:
        "Winning Tips on Machine Learning Competitions by Kazanova, Kaggle #3",
      publisher: "HackerEarth",
      url: "https://www.hackerearth.com/practice/machine-learning/advanced-techniques/winning-tips-machine-learning-competitions-kazanova-current-kaggle-3/tutorial/",
      date: "2017-03",
      kind: "documentation",
    },
    {
      title:
        "How to Select Your Final Models in a Kaggle Competition",
      publisher: "Cheng-Tao Chu",
      url: "http://www.chioka.in/how-to-select-your-final-models-in-a-kaggle-competitio/",
      date: "2015-01",
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

export default function ModelEvaluationSelectionInKaggle() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Đánh giá & Chọn mô hình"
    >
      <ApplicationHero
        parentTitleVi="Đánh giá & Chọn mô hình"
        topicSlug="model-evaluation-selection-in-kaggle"
      >
        <p>
          Kaggle (nền tảng thi đấu khoa học dữ liệu của Google) là &ldquo;đấu
          trường&rdquo; nơi hàng chục nghìn kỹ sư và nhà nghiên cứu cạnh tranh
          để tìm model tốt nhất cho cùng một bộ dữ liệu. Giải thưởng lên tới
          hàng triệu đô-la, và thứ hạng được quyết định bởi từng phần nghìn
          của metric đánh giá.
        </p>
        <p>
          Bài học lớn nhất từ Kaggle: bạn không bao giờ thắng bằng một model
          đơn lẻ. Các Grandmaster (cấp bậc cao nhất, top 0,1% thế giới) chiến
          thắng nhờ chiến thuật đánh giá và chọn model có hệ thống &mdash;
          cross-validation (kiểm chứng chéo) chặt chẽ, metric selection (chọn
          thước đo đúng), và ensemble stacking (xếp chồng nhiều model).
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="model-evaluation-selection-in-kaggle">
        <p>
          Kaggle chia test data thành hai phần ẩn: public leaderboard (bảng xếp
          hạng công khai, chỉ dùng một phần nhỏ test data) và private
          leaderboard (bảng xếp hạng cuối cùng, dùng phần còn lại). Nhiều đội
          đứng top 10 trên public board nhưng rớt hàng trăm bậc khi private
          board được công bố &mdash; hiện tượng gọi là leaderboard shakeup
          (xáo trộn bảng xếp hạng).
        </p>
        <p>
          Vấn đề cốt lõi: làm sao biết model thực sự tốt hay chỉ may mắn trên
          phần public? Làm sao chọn 2 bài nộp cuối cùng từ hàng trăm thí
          nghiệm? Cần chiến thuật đánh giá model đáng tin cậy &mdash; không
          phụ thuộc vào leaderboard, mà dựa trên cross-validation nội bộ.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Đánh giá & Chọn mô hình"
        topicSlug="model-evaluation-selection-in-kaggle"
      >
        <Beat step={1}>
          <p>
            <strong>
              Cross-validation strategy (chiến thuật kiểm chứng chéo &mdash;
              đánh giá model trên nhiều phần dữ liệu khác nhau).
            </strong>{" "}
            Kaggle Grandmaster xây dựng CV strategy trước mọi thứ khác. K-Fold
            CV (chia dữ liệu thành K phần, lần lượt dùng mỗi phần để kiểm tra)
            là nền tảng, nhưng tuỳ bài toán cần biến thể: Stratified K-Fold cho
            data mất cân bằng, Group K-Fold khi có nhóm dữ liệu (ví dụ: cùng
            bệnh nhân), Time-Series Split cho dữ liệu theo thời gian. Quy tắc
            vàng: nếu CV score và public LB score tương quan tốt, tin CV &mdash;
            nếu không, xem lại strategy.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>
              Metric selection (chọn thước đo &mdash; hiểu chính xác cuộc thi
              đo gì).
            </strong>{" "}
            Mỗi cuộc thi Kaggle dùng một metric riêng: RMSE cho regression, AUC
            cho classification, MAP@K cho ranking. Grandmaster phân tích metric
            trước khi viết dòng code đầu tiên &mdash; vì metric quyết định mọi
            thứ: loss function nào để train, threshold nào để cut-off, và cách
            tối ưu ensemble. Ví dụ: metric log loss phạt nặng dự đoán tự tin mà
            sai &mdash; cần calibrate probability thay vì chỉ maximize accuracy.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>
              Ensemble stacking (xếp chồng model &mdash; kết hợp dự đoán của
              nhiều model bằng meta-model).
            </strong>{" "}
            Grandmaster huấn luyện hàng chục, đôi khi hàng trăm model đa dạng:
            XGBoost, LightGBM, CatBoost, neural network, linear model. Dự đoán
            của các model này trở thành features đầu vào cho meta-model (model
            cấp 2). Bài nộp chiến thắng Kaggle tháng 4/2025 dùng 3 tầng
            stacking: tầng 1 gồm 33 model, tầng 2 thêm 3 model (XGBoost, neural
            network, AdaBoost), tầng 3 là trung bình có trọng số. Giải pháp cuối
            cùng dùng 75 model tầng 1 được chọn từ 500 thí nghiệm.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>
              Final submission strategy (chiến thuật nộp bài cuối &mdash; chọn
              2 bài nộp tốt nhất).
            </strong>{" "}
            Kaggle cho phép chọn 2 bài nộp cuối cùng. Grandmaster áp dụng
            nguyên tắc &ldquo;diversity&rdquo; (đa dạng): chọn hai bài nộp rất
            khác nhau &mdash; một bài an toàn (strong CV, ensemble lớn) và một
            bài mạo hiểm (single model mạnh hoặc ensemble nhỏ đặc biệt). Nếu
            chọn hai bài giống nhau, chúng thắng cùng nhau hoặc thua cùng nhau
            &mdash; mất lợi thế đa dạng hoá. Quyết định này thường là yếu tố
            phân biệt giữa top 10 và top 100.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="model-evaluation-selection-in-kaggle"
      >
        <Metric
          value="Bài nộp chiến thắng dùng stacking 3 tầng: 33 model tầng 1, chọn từ 500 thí nghiệm"
          sourceRef={2}
        />
        <Metric
          value="Giải pháp cuối cùng sử dụng 75 model tầng 1 đa dạng để tối đa hoá ensemble"
          sourceRef={2}
        />
        <Metric
          value="Grandmaster Kazanova (top 3 Kaggle): 'Ensemble luôn thắng single model ở bảng xếp hạng cuối'"
          sourceRef={5}
        />
        <Metric
          value="CV strategy đúng giúp tương quan cao giữa validation score và private leaderboard"
          sourceRef={6}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Đánh giá & Chọn mô hình"
        topicSlug="model-evaluation-selection-in-kaggle"
      >
        <p>
          Không có chiến thuật đánh giá, bạn train một model, thấy public
          leaderboard cao, tự tin nộp bài &mdash; rồi rớt hàng trăm bậc khi
          private board công bố. Đây là shakeup kinh điển: model đã overfit vào
          phần public test mà bạn không biết.
        </p>
        <p>
          Cross-validation nội bộ chính là la bàn đáng tin: nó đánh giá model
          trên nhiều phần dữ liệu, không phụ thuộc vào leaderboard. Ensemble
          stacking giảm variance (dao động) của dự đoán &mdash; như hỏi ý kiến
          100 chuyên gia thay vì 1 người. Và final submission strategy đảm bảo
          bạn không &ldquo;bỏ trứng vào một giỏ.&rdquo; Ba yếu tố này biến
          Kaggle từ trò may rủi thành khoa học có hệ thống.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
