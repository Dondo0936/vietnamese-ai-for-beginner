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
  slug: "cross-validation-in-kaggle",
  title: "Cross-Validation in Kaggle Competitions",
  titleVi: "Kiểm chứng chéo trong cuộc thi Kaggle",
  description:
    "Cách 'Trust Your CV' trở thành châm ngôn sống còn trên Kaggle — khi bảng xếp hạng public đánh lừa và rank nhảy từ 1485 lên hạng 1",
  category: "classic-ml",
  tags: ["evaluation", "competition", "leaderboard", "application"],
  difficulty: "beginner",
  relatedSlugs: ["cross-validation"],
  vizType: "static",
  applicationOf: "cross-validation",
  featuredApp: {
    name: "Kaggle",
    productFeature: "Leaderboard & Competitions",
    company: "Kaggle Inc. (Google)",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "The Ladder: A Reliable Leaderboard for Machine Learning Competitions",
      publisher: "Blum & Hardt, ICML 2015",
      url: "https://proceedings.mlr.press/v37/blum15.html",
      date: "2015-07",
      kind: "paper",
    },
    {
      title: "How to (Not) Overfit to a Public Leaderboard: A Postmortem",
      publisher: "Greg Park",
      url: "https://gregpark.io/blog/Kaggle-Decoding-Brain-Signals/",
      date: "2020-01",
      kind: "engineering-blog",
    },
    {
      title: "Winning Solutions and Tips — The Kaggle Book",
      publisher: "Konrad Banachewicz & Luca Massaron, Packt",
      url: "https://www.kaggle.com/discussion/351571",
      date: "2022-06",
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

export default function CrossValidationInKaggle() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Kiểm chứng chéo"
    >
      <ApplicationHero
        parentTitleVi="Kiểm chứng chéo"
        topicSlug="cross-validation-in-kaggle"
      >
        <p>
          Kaggle (nền tảng thi khoa học dữ liệu của Google) tổ chức hàng
          trăm cuộc thi mỗi năm. Hàng nghìn đội nộp bài dự thi và theo
          dõi thứ hạng trên bảng xếp hạng công khai (public leaderboard).
          Nhưng bảng xếp hạng này chỉ được tính trên khoảng 1/3 dữ liệu
          kiểm tra.
        </p>
        <p>
          Khi cuộc thi kết thúc, bảng xếp hạng cuối cùng (private
          leaderboard) dùng 2/3 dữ liệu còn lại &mdash; và xáo trộn thứ
          hạng diễn ra kinh hoàng. Nhiều đội từ top 10 rơi xuống hàng trăm,
          trong khi đội hạng 1.485 nhảy lên hạng 1. Bí quyết của người
          chiến thắng: &ldquo;Trust Your CV&rdquo; (tin vào cross-validation
          của mình, không chạy theo bảng xếp hạng công khai).
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="cross-validation-in-kaggle">
        <p>
          Bảng xếp hạng công khai trên Kaggle tạo cám dỗ nguy hiểm: mỗi
          lần nộp bài, bạn nhận phản hồi trên tập public &mdash; và bắt
          đầu tinh chỉnh mô hình để leo hạng trên tập đó. Blum & Hardt
          (ICML 2015) chứng minh rằng hành vi này tương đương overfitting
          trên tập kiểm tra: bạn đang &ldquo;học thuộc&rdquo; tập public
          thay vì tổng quát hóa.
        </p>
        <p>
          Vấn đề cốt lõi: làm sao đánh giá đáng tin cậy hiệu suất mô hình
          khi bảng xếp hạng trước mắt có thể đánh lừa? Cross-validation
          (kiểm chứng chéo &mdash; chia dữ liệu huấn luyện thành nhiều
          phần, luân phiên dùng mỗi phần làm tập kiểm tra) là câu trả lời.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Kiểm chứng chéo"
        topicSlug="cross-validation-in-kaggle"
      >
        <Beat step={1}>
          <p>
            <strong>
              K-fold CV nội bộ: nguồn tin đáng tin cậy nhất.
            </strong>{" "}
            Trước khi nộp bài, thí sinh chia dữ liệu huấn luyện thành k
            phần (thường k = 5 hoặc 10). Lần lượt giữ lại 1 phần để đánh
            giá, huấn luyện trên k&minus;1 phần còn lại. Trung bình k lần
            đánh giá cho ước lượng ổn định hơn bất kỳ phép chia đơn lẻ nào
            &mdash; đây là &ldquo;CV score&rdquo; mà thí sinh giỏi tin
            tưởng hơn cả bảng xếp hạng.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>
              So sánh CV score với public leaderboard.
            </strong>{" "}
            Nếu CV score và public score chênh lệch lớn, đó là dấu hiệu
            cảnh báo: có thể dữ liệu không đồng nhất hoặc mô hình đang
            overfit trên tập public. Thí sinh có kinh nghiệm xem public
            score chỉ như tín hiệu tham khảo, không phải chỉ số mục tiêu.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>
              &ldquo;Trust Your CV&rdquo; &mdash; châm ngôn sống còn.
            </strong>{" "}
            Khi public score và CV score mâu thuẫn, thí sinh giỏi chọn tin
            CV. Trong cuộc thi &ldquo;Decoding Brain Signals&rdquo;, đội
            xếp hạng 1.485 trên public leaderboard nhưng tin vào CV score
            của mình &mdash; và nhảy lên hạng 1 khi private leaderboard
            được công bố.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>
              Hai lần nộp cuối: quyết định sống còn.
            </strong>{" "}
            Kaggle cho phép mỗi đội chọn 2 bài nộp cuối cùng để chấm trên
            private leaderboard. Thí sinh dùng CV score để chọn: một bài
            có CV score cao nhất (bảo thủ) và một bài cân bằng giữa CV và
            public score. Đây là lúc cross-validation quyết định thắng thua
            &mdash; không phải lúc nộp bài hàng ngày.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="cross-validation-in-kaggle"
      >
        <Metric
          value="Public leaderboard chỉ dùng ~1/3 dữ liệu kiểm tra, private dùng ~2/3"
          sourceRef={3}
        />
        <Metric
          value="Xáo trộn cực đoan: từ hạng 1.485 (public) nhảy lên hạng 1 (private)"
          sourceRef={2}
        />
        <Metric
          value="Blum & Hardt (2015): nộp bài nhiều lần = overfitting trên tập kiểm tra"
          sourceRef={1}
        />
        <Metric
          value="Mỗi đội chỉ được chọn 2 bài nộp cuối cùng cho bảng xếp hạng private"
          sourceRef={3}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Kiểm chứng chéo"
        topicSlug="cross-validation-in-kaggle"
      >
        <p>
          Không có cross-validation, thí sinh sẽ hoàn toàn phụ thuộc vào
          bảng xếp hạng công khai &mdash; một nguồn phản hồi chỉ đại diện
          cho 1/3 dữ liệu và dễ bị overfit. Kết quả: hàng loạt đội leo
          top 10 trên public rồi rơi tự do khi private leaderboard được
          công bố.
        </p>
        <p>
          Cross-validation cho mỗi thí sinh một &ldquo;bảng xếp hạng cá
          nhân&rdquo; đáng tin cậy hơn cả bảng xếp hạng chính thức. Đó là
          lý do &ldquo;Trust Your CV&rdquo; trở thành bài học đầu tiên mà
          mọi Kaggle Grandmaster (danh hiệu cao nhất trên Kaggle) truyền
          lại cho người mới.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
