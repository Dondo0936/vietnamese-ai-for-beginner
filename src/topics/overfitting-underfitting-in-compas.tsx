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
  slug: "overfitting-underfitting-in-compas",
  title: "Overfitting & Underfitting in COMPAS",
  titleVi: "Overfitting & Underfitting trong COMPAS",
  description:
    "Hệ thống COMPAS dùng 137 đặc trưng nhưng chỉ đạt 65% chính xác — mô hình 2 biến đạt 67%, phơi bày overfitting trên thiên kiến chủng tộc",
  category: "classic-ml",
  tags: ["fairness", "criminal-justice", "bias", "application"],
  difficulty: "beginner",
  relatedSlugs: ["overfitting-underfitting"],
  vizType: "static",
  applicationOf: "overfitting-underfitting",
  featuredApp: {
    name: "COMPAS",
    productFeature: "Recidivism Risk Assessment",
    company: "Equivant (formerly Northpointe)",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "Machine Bias: There's software used across the country to predict future criminals. And it's biased against blacks.",
      publisher: "ProPublica",
      url: "https://www.propublica.org/article/machine-bias-risk-assessments-in-criminal-sentencing",
      date: "2016-05",
      kind: "news",
    },
    {
      title: "The accuracy, fairness, and limits of predicting recidivism",
      publisher: "Science Advances (Dressel & Farid)",
      url: "https://www.science.org/doi/10.1126/sciadv.aao5580",
      date: "2018-01",
      kind: "paper",
    },
    {
      title: "How We Analyzed the COMPAS Recidivism Algorithm",
      publisher: "ProPublica — Methodology",
      url: "https://www.propublica.org/article/how-we-analyzed-the-compas-recidivism-algorithm",
      date: "2016-05",
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

export default function OverfittingUnderfittingInCompas() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Overfitting & Underfitting"
    >
      <ApplicationHero
        parentTitleVi="Overfitting & Underfitting"
        topicSlug="overfitting-underfitting-in-compas"
      >
        <p>
          Tại Mỹ, hơn 1 triệu người đã bị đánh giá bởi COMPAS
          (Correctional Offender Management Profiling for Alternative
          Sanctions &mdash; hệ thống chấm điểm rủi ro tái phạm). Phần mềm
          này thu thập 137 đặc trưng (feature) từ lịch sử của bị cáo rồi
          trả về một con số: rủi ro cao hay thấp. Thẩm phán dùng con số
          này để quyết định tạm giam hay tại ngoại.
        </p>
        <p>
          Năm 2016, tổ chức báo chí điều tra ProPublica phát hiện: COMPAS
          đánh giá sai có hệ thống &mdash; người da đen bị gán nhãn
          &ldquo;rủi ro cao&rdquo; nhầm gần gấp đôi so với người da trắng.
          Câu chuyện này minh họa cả overfitting (quá khớp &mdash; mô hình
          học thuộc các mẫu thiên kiến trong dữ liệu) lẫn bài toán: liệu
          mô hình phức tạp hơn có thực sự tốt hơn?
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="overfitting-underfitting-in-compas">
        <p>
          COMPAS sử dụng 137 đặc trưng &mdash; từ tiền án, tuổi, tình
          trạng việc làm đến câu trả lời bảng hỏi tâm lý. Với lượng đặc
          trưng lớn như vậy, mô hình dễ overfit (quá khớp) trên các mẫu
          tương quan giả (spurious correlation) trong dữ liệu lịch sử, bao
          gồm cả các mẫu phản ánh thiên kiến hệ thống trong hệ thống tư
          pháp.
        </p>
        <p>
          Vấn đề cốt lõi: mô hình phức tạp (137 đặc trưng) đạt chính xác
          chỉ 65% &mdash; tương đương tung đồng xu có trọng lực. Liệu tất
          cả 137 đặc trưng đó có thực sự cần thiết, hay chúng chỉ giúp
          mô hình &ldquo;học thuộc&rdquo; thiên kiến thay vì dự đoán chính
          xác hơn?
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Overfitting & Underfitting"
        topicSlug="overfitting-underfitting-in-compas"
      >
        <Beat step={1}>
          <p>
            <strong>
              COMPAS thu thập 137 đặc trưng.
            </strong>{" "}
            Hệ thống hỏi bị cáo hàng chục câu về hoàn cảnh sống, lịch sử
            gia đình, bạn bè, tiền án, việc làm, rồi kết hợp với dữ liệu
            hồ sơ tư pháp. Mô hình sử dụng tất cả thông tin này để tính
            điểm rủi ro từ 1 đến 10. Hơn 1 triệu bị cáo tại Mỹ đã bị
            đánh giá bằng công cụ này.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>
              Overfitting trên mẫu thiên kiến chủng tộc.
            </strong>{" "}
            ProPublica phân tích 7.000 hồ sơ tại hạt Broward (bang Florida)
            và phát hiện: tỷ lệ dương tính giả (FP &mdash; gán nhãn rủi
            ro cao nhưng không tái phạm) ở người da đen là 44,9%, gần gấp
            đôi so với 23,5% ở người da trắng. Mô hình đã overfit trên các
            mẫu tương quan giữa đặc trưng nhân khẩu học và lịch sử tư pháp
            &mdash; vốn phản ánh bất bình đẳng hệ thống hơn là rủi ro tái
            phạm thực sự.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>
              Dressel & Farid (2018): 2 biến đạt 67%.
            </strong>{" "}
            Nhà nghiên cứu Julia Dressel và Hany Farid tại Đại học
            Dartmouth chứng minh: mô hình hồi quy logistic chỉ dùng 2 biến
            &mdash; tuổi và số tiền án &mdash; đạt chính xác 67%, cao hơn
            cả COMPAS với 137 đặc trưng (65%). Đây là bằng chứng rõ ràng
            của overfitting: 135 đặc trưng thêm vào không cải thiện mà còn
            làm giảm khả năng tổng quát hóa (generalization).
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>
              Con người cũng chỉ đạt 63&ndash;67%.
            </strong>{" "}
            Cùng nghiên cứu đó, Dressel & Farid cho 400 tình nguyện viên
            không chuyên đọc mô tả ngắn gọn về bị cáo và dự đoán tái phạm.
            Kết quả: con người đạt chính xác trung bình 63&ndash;67% &mdash;
            ngang COMPAS. Điều này cho thấy giới hạn nội tại (irreducible
            error) của bài toán: dù mô hình đơn giản hay phức tạp, độ chính
            xác dự đoán tái phạm dường như có trần khoảng 67%.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="overfitting-underfitting-in-compas"
      >
        <Metric
          value="COMPAS (137 đặc trưng): chính xác 65% — mô hình 2 biến: 67%"
          sourceRef={2}
        />
        <Metric
          value="Tỷ lệ FP ở người da đen 44,9% so với 23,5% ở người da trắng"
          sourceRef={1}
        />
        <Metric
          value="Hơn 1 triệu bị cáo tại Mỹ đã bị đánh giá bằng COMPAS"
          sourceRef={3}
        />
        <Metric
          value="Tình nguyện viên không chuyên đạt chính xác 63–67%, ngang COMPAS"
          sourceRef={2}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Overfitting & Underfitting"
        topicSlug="overfitting-underfitting-in-compas"
      >
        <p>
          Không hiểu overfitting, người ta dễ tin rằng mô hình có nhiều đặc
          trưng hơn sẽ chính xác hơn. COMPAS minh họa điều ngược lại:
          137 đặc trưng không những không cải thiện dự đoán mà còn &ldquo;giấu
          kín&rdquo; thiên kiến chủng tộc trong lớp vỏ phức tạp, khiến việc
          kiểm tra và phản biện trở nên khó khăn hơn.
        </p>
        <p>
          Hiểu overfitting và underfitting giúp đặt câu hỏi đúng: trước khi
          thêm đặc trưng, hãy hỏi &ldquo;Mô hình đơn giản nhất đạt bao
          nhiêu phần trăm?&rdquo; Nếu mô hình 2 biến đã đạt 67% và mô
          hình 137 biến chỉ đạt 65%, vấn đề không phải thiếu dữ liệu &mdash;
          mà là bài toán có giới hạn nội tại, và thêm phức tạp chỉ thêm
          rủi ro thiên kiến.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
