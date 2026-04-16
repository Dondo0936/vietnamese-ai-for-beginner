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
  slug: "confusion-matrix-in-medical-testing",
  title: "Confusion Matrix in Medical Testing",
  titleVi: "Ma trận nhầm lẫn trong Xét nghiệm Y tế",
  description:
    "Cách hiểu kết quả xét nghiệm COVID-19 RT-PCR qua ma trận nhầm lẫn — sensitivity thay đổi từ 0% đến 80% tùy thời điểm lấy mẫu",
  category: "classic-ml",
  tags: ["evaluation", "medical", "covid", "application"],
  difficulty: "beginner",
  relatedSlugs: ["confusion-matrix"],
  vizType: "static",
  applicationOf: "confusion-matrix",
  featuredApp: {
    name: "RT-PCR COVID-19",
    productFeature: "Xét nghiệm chẩn đoán",
    company: "WHO / CDC",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "Variation in False-Negative Rate of Reverse Transcriptase Polymerase Chain Reaction–Based SARS-CoV-2 Tests by Time Since Exposure",
      publisher: "Annals of Internal Medicine (Kucirka et al.)",
      url: "https://www.acpjournals.org/doi/10.7326/M20-1495",
      date: "2020-08",
      kind: "paper",
    },
    {
      title: "False Negative Tests for SARS-CoV-2 Infection — Challenges and Implications",
      publisher: "New England Journal of Medicine",
      url: "https://www.nejm.org/doi/full/10.1056/NEJMp2015897",
      date: "2020-06",
      kind: "paper",
    },
    {
      title: "False-positive COVID-19 results: hidden problems and costs",
      publisher: "The Lancet Respiratory Medicine",
      url: "https://www.thelancet.com/journals/lanres/article/PIIS2213-2600(20)30453-7/fulltext",
      date: "2020-09",
      kind: "paper",
    },
    {
      title: "Interpreting a COVID-19 test result",
      publisher: "The BMJ",
      url: "https://www.bmj.com/content/369/bmj.m1808",
      date: "2020-05",
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

export default function ConfusionMatrixInMedicalTesting() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Ma trận nhầm lẫn"
    >
      <ApplicationHero
        parentTitleVi="Ma trận nhầm lẫn"
        topicSlug="confusion-matrix-in-medical-testing"
      >
        <p>
          Năm 2020, hàng tỷ người trên thế giới đi xét nghiệm COVID-19
          bằng RT-PCR (Reverse Transcription Polymerase Chain Reaction &mdash;
          phản ứng chuỗi polymerase phiên mã ngược, phương pháp phát hiện
          vật liệu di truyền của virus). Kết quả trả về chỉ hai chữ: dương
          tính hoặc âm tính.
        </p>
        <p>
          Nhưng &ldquo;âm tính&rdquo; không phải lúc nào cũng có nghĩa
          &ldquo;không nhiễm&rdquo;. Để hiểu vì sao, ta cần ma trận nhầm
          lẫn (confusion matrix &mdash; bảng 2&times;2 so sánh dự đoán của
          xét nghiệm với thực tế). Bốn ô trong bảng này quyết định sinh
          mạng: một kết quả âm tính giả (false negative) có thể khiến người
          bệnh tiếp tục lây cho cả gia đình.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="confusion-matrix-in-medical-testing">
        <p>
          Xét nghiệm RT-PCR không hoàn hảo. Sensitivity (độ nhạy &mdash;
          khả năng phát hiện đúng người bệnh) dao động từ 70% đến 98% tùy
          thời điểm lấy mẫu. Nghiên cứu của Kucirka và cộng sự (Annals of
          Internal Medicine, 2020) cho thấy tỷ lệ âm tính giả thay đổi
          theo ngày kể từ khi nhiễm.
        </p>
        <p>
          Vấn đề cốt lõi: cùng một xét nghiệm, cùng một người bệnh, nhưng
          kết quả thay đổi tùy thời điểm. Nếu không hiểu bốn ô của ma trận
          nhầm lẫn, bác sĩ và bệnh nhân đều có thể đưa ra quyết định sai
          dựa trên kết quả &ldquo;âm tính&rdquo;.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Ma trận nhầm lẫn"
        topicSlug="confusion-matrix-in-medical-testing"
      >
        <Beat step={1}>
          <p>
            <strong>
              Định nghĩa bốn ô.
            </strong>{" "}
            Mỗi kết quả xét nghiệm rơi vào một trong bốn ô: True Positive
            (TP &mdash; dương tính thật, xét nghiệm đúng phát hiện người
            bệnh), False Positive (FP &mdash; dương tính giả, xét nghiệm
            báo dương nhưng người không bệnh), False Negative (FN &mdash;
            âm tính giả, xét nghiệm báo âm nhưng người đang bệnh), và True
            Negative (TN &mdash; âm tính thật, xét nghiệm đúng xác nhận
            người khỏe).
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>
              Sensitivity (độ nhạy) = TP / (TP + FN).
            </strong>{" "}
            Đây là khả năng xét nghiệm phát hiện đúng người thực sự nhiễm
            bệnh. Với COVID-19 RT-PCR, sensitivity dao động lớn: ngày thứ 1
            sau phơi nhiễm gần như 0% (virus chưa nhân bản đủ), đạt đỉnh
            khoảng 80% vào ngày thứ 8 (3 ngày sau khi có triệu chứng), rồi
            giảm dần xuống khoảng 34% vào ngày thứ 21.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>
              Specificity (độ đặc hiệu) = TN / (TN + FP).
            </strong>{" "}
            Đây là khả năng xét nghiệm xác nhận đúng người không nhiễm.
            RT-PCR có specificity rất cao, khoảng 99,1% đến 99,8% &mdash;
            tỷ lệ dương tính giả chỉ 0,2% đến 0,9%. Nghĩa là nếu kết quả
            dương tính, gần như chắc chắn bạn đã nhiễm.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>
              PPV (Positive Predictive Value &mdash; giá trị tiên đoán
              dương) phụ thuộc tỷ lệ nhiễm trong cộng đồng.
            </strong>{" "}
            PPV = TP / (TP + FP). Khi tỷ lệ nhiễm thấp (ví dụ 1%), dù
            specificity 99,8% thì cứ 6 kết quả dương tính vẫn có 1 là giả.
            Khi tỷ lệ nhiễm 20%, gần như mọi kết quả dương tính đều đúng.
            Đây là lý do WHO khuyến cáo xét nghiệm có mục tiêu thay vì xét
            nghiệm đại trà khi tỷ lệ nhiễm thấp.
          </p>
        </Beat>
        <Beat step={5}>
          <p>
            <strong>
              Tỷ lệ âm tính giả thay đổi theo thời gian.
            </strong>{" "}
            Nghiên cứu Kucirka (2020) chỉ ra rằng xét nghiệm cùng một
            người vào các ngày khác nhau cho kết quả khác nhau: tỷ lệ FN
            là 100% ngày thứ 1, giảm xuống 20% ngày thứ 8 (thời điểm tối
            ưu nhất để xét nghiệm), rồi tăng trở lại 66% vào ngày thứ 21.
            Ma trận nhầm lẫn không cố định &mdash; nó thay đổi theo giai
            đoạn bệnh.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="confusion-matrix-in-medical-testing"
      >
        <Metric
          value="Sensitivity RT-PCR dao động 70–98% tùy thời điểm lấy mẫu"
          sourceRef={1}
        />
        <Metric
          value="Tỷ lệ âm tính giả thay đổi: 100% ngày 1 → 20% ngày 8 → 66% ngày 21"
          sourceRef={1}
        />
        <Metric
          value="Tỷ lệ dương tính giả chỉ 0,2–0,9% (specificity rất cao)"
          sourceRef={3}
        />
        <Metric
          value="PPV phụ thuộc tỷ lệ nhiễm cộng đồng — WHO khuyến cáo xét nghiệm có mục tiêu"
          sourceRef={4}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Ma trận nhầm lẫn"
        topicSlug="confusion-matrix-in-medical-testing"
      >
        <p>
          Không có ma trận nhầm lẫn, mọi người sẽ hiểu kết quả xét nghiệm
          theo kiểu đen trắng: dương tính nghĩa là bệnh, âm tính nghĩa là
          khỏe. Hàng triệu người nhận kết quả âm tính giả sẽ tin mình an
          toàn và tiếp tục sinh hoạt bình thường, lây virus cho người thân.
        </p>
        <p>
          Ma trận nhầm lẫn buộc ta hỏi đúng câu: &ldquo;Xét nghiệm này
          sai ở đâu và sai bao nhiêu?&rdquo; Nhờ phân tích bốn ô, các
          cơ quan y tế đưa ra hướng dẫn cụ thể: xét nghiệm lại sau 2
          ngày nếu nghi ngờ, ưu tiên xét nghiệm vào ngày có triệu chứng,
          và không dựa vào một kết quả duy nhất để ra quyết định.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
