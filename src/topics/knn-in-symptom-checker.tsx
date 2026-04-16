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
  slug: "knn-in-symptom-checker",
  title: "KNN in Symptom Checkers",
  titleVi: "K láng giềng gần nhất trong Kiểm tra Triệu chứng",
  description:
    "Cách các ứng dụng kiểm tra triệu chứng dùng KNN để so khớp triệu chứng của bạn với hàng nghìn ca bệnh đã biết",
  category: "classic-ml",
  tags: ["classification", "healthcare", "knn", "application"],
  difficulty: "beginner",
  relatedSlugs: ["knn"],
  vizType: "static",
  applicationOf: "knn",
  featuredApp: {
    name: "Buoy Health",
    productFeature: "AI Symptom Checker",
    company: "Buoy Health, Inc.",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "KNN-Based Disease Detection from Clinical Data with Distance Metrics",
      publisher: "Nature Scientific Reports",
      url: "https://www.nature.com/articles/s41598-023-40459-8",
      date: "2023-08",
      kind: "paper",
    },
    {
      title: "Optimized KNN Classification for Stroke Prediction Using Medical Records",
      publisher: "Frontiers in Artificial Intelligence",
      url: "https://www.frontiersin.org/articles/10.3389/frai.2023.1229190",
      date: "2023-09",
      kind: "paper",
    },
    {
      title: "An Epidemiological Analysis of Buoy Health's AI Symptom Checker",
      publisher: "Buoy Health",
      url: "https://www.buoyhealth.com/research",
      date: "2022-06",
      kind: "documentation",
    },
    {
      title: "Machine Learning Approaches for Disease Prediction from Symptoms: A Review",
      publisher: "PMC — International Journal of Environmental Research and Public Health",
      url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9518091/",
      date: "2022-09",
      kind: "paper",
    },
    {
      title: "The Promise and Peril of Online Symptom Checkers",
      publisher: "Nature npj Digital Medicine",
      url: "https://www.nature.com/articles/s41746-019-0113-1",
      date: "2019-05",
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

export default function KnnInSymptomChecker() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="K láng giềng gần nhất"
    >
      <ApplicationHero
        parentTitleVi="K láng giềng gần nhất"
        topicSlug="knn-in-symptom-checker"
      >
        <p>
          Nửa đêm, bạn bị đau đầu kèm sốt nhẹ. Thay vì hoảng hốt tìm kiếm
          trên mạng, bạn mở ứng dụng Buoy Health (công cụ kiểm tra triệu
          chứng bằng trí tuệ nhân tạo) và nhập triệu chứng. Sau vài câu hỏi,
          ứng dụng gợi ý: nhiều khả năng là cảm cúm thông thường, nên nghỉ
          ngơi và uống nhiều nước, đến bác sĩ nếu triệu chứng kéo dài quá 3
          ngày.
        </p>
        <p>
          Đằng sau câu trả lời đó là thuật toán KNN (K-Nearest Neighbors
          &mdash; K láng giềng gần nhất). Hệ thống so sánh bộ triệu chứng
          của bạn với hàng nghìn ca bệnh đã được chẩn đoán, tìm những ca
          giống nhất, rồi &ldquo;bỏ phiếu&rdquo; để đưa ra gợi ý.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="knn-in-symptom-checker">
        <p>
          Hàng trăm triệu người tìm kiếm triệu chứng bệnh trên internet mỗi
          tháng &mdash; riêng WebMD (trang thông tin y tế) nhận hơn 95 triệu
          lượt truy cập mỗi tháng. Nhưng tìm kiếm thông thường trả về kết quả
          gây lo lắng: đau đầu có thể là cảm cúm, cũng có thể là u não.
        </p>
        <p>
          Vấn đề cốt lõi: từ một bộ triệu chứng mà người dùng mô tả, gợi ý
          những bệnh có khả năng cao nhất &mdash; và phân loại mức độ khẩn
          cấp (triage &mdash; phân loại ưu tiên điều trị) để biết nên tự chăm
          sóc, đặt lịch khám, hay đến phòng cấp cứu.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="K láng giềng gần nhất"
        topicSlug="knn-in-symptom-checker"
      >
        <Beat step={1}>
          <p>
            <strong>
              Mã hóa triệu chứng thành vector (symptom encoding &mdash; biến
              triệu chứng thành mảng số).
            </strong>{" "}
            Mỗi triệu chứng có thể có (sốt, đau đầu, ho, mệt mỏi...) trở
            thành một chiều trong vector. Nếu hệ thống theo dõi 200 triệu
            chứng, mỗi bệnh nhân là một vector 200 chiều, trong đó 1 = có
            triệu chứng, 0 = không có. Mức độ nghiêm trọng có thể được mã
            hóa bằng giá trị liên tục (ví dụ: sốt 38,5&deg;C thay vì chỉ
            có/không).
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>
              Tính khoảng cách (distance calculation &mdash; đo mức độ khác
              biệt giữa hai vector).
            </strong>{" "}
            KNN so sánh vector triệu chứng của bạn với mọi ca bệnh trong cơ
            sở dữ liệu bằng khoảng cách Euclid (Euclidean distance &mdash;
            khoảng cách đường thẳng trong không gian nhiều chiều) hoặc khoảng
            cách Hamming (Hamming distance &mdash; đếm số chiều khác nhau,
            phù hợp cho dữ liệu nhị phân). Ca nào có vector gần bạn nhất, ca
            đó có triệu chứng giống bạn nhất.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>
              Chọn K láng giềng gần nhất (K nearest selection &mdash; lấy K
              ca bệnh giống nhất).
            </strong>{" "}
            Thay vì chỉ lấy 1 ca giống nhất (dễ bị nhiễu), KNN lấy K ca gần
            nhất (ví dụ K = 7). Giá trị K được chọn qua thực nghiệm: K quá
            nhỏ thì nhạy với nhiễu, K quá lớn thì mất đặc trưng riêng. Trong
            y tế, K thường được chọn lẻ để tránh hòa khi bỏ phiếu.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>
              Bỏ phiếu (voting &mdash; K láng giềng &ldquo;bầu chọn&rdquo;
              bệnh phổ biến nhất).
            </strong>{" "}
            Trong K ca gần nhất, bệnh nào xuất hiện nhiều nhất được chọn làm
            kết quả. Có thể dùng bỏ phiếu có trọng số (weighted voting): ca
            nào gần hơn thì phiếu nặng hơn. Ví dụ: 5 trong 7 ca gần nhất là
            cảm cúm, 2 là viêm họng &rarr; gợi ý cảm cúm với độ tin cậy
            khoảng 71%.
          </p>
        </Beat>
        <Beat step={5}>
          <p>
            <strong>
              Phân loại mức độ khẩn cấp (triage &mdash; quyết định hành động
              tiếp theo).
            </strong>{" "}
            Dựa trên kết quả KNN, hệ thống phân thành 3 nhóm: tự chăm sóc
            tại nhà (self-care), đặt lịch khám bác sĩ (appointment), hoặc đến
            phòng cấp cứu ngay (emergency). Bước này kết hợp kết quả KNN với
            luật y khoa: một số tổ hợp triệu chứng luôn được ưu tiên cấp cứu
            bất kể kết quả bỏ phiếu.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="knn-in-symptom-checker"
      >
        <Metric
          value="KNN đạt 91,29% độ chính xác trong phát hiện bệnh từ dữ liệu lâm sàng"
          sourceRef={1}
        />
        <Metric
          value="KNN tối ưu đạt 97,18% độ chính xác trong dự đoán đột quỵ"
          sourceRef={2}
        />
        <Metric
          value="Hơn 95 triệu lượt truy cập mỗi tháng trên WebMD — nhu cầu kiểm tra triệu chứng rất lớn"
          sourceRef={5}
        />
        <Metric
          value="Công cụ kiểm tra triệu chứng đưa đúng chẩn đoán vào top 3 gợi ý trong 51% trường hợp"
          sourceRef={5}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="K láng giềng gần nhất"
        topicSlug="knn-in-symptom-checker"
      >
        <p>
          Không có KNN, công cụ kiểm tra triệu chứng sẽ phải dùng cây quyết
          định cứng hoặc hệ chuyên gia (expert system &mdash; tập hợp luật
          do bác sĩ viết tay). Cách này có hai hạn chế lớn: không mở rộng
          được khi có hàng nghìn bệnh và hàng trăm triệu chứng, và không cập
          nhật tự động khi có dữ liệu mới.
        </p>
        <p>
          KNN giải quyết cả hai: không cần huấn luyện phức tạp &mdash; chỉ cần
          lưu trữ các ca bệnh đã biết và so sánh trực tiếp. Khi có ca bệnh
          mới, chỉ cần thêm vào cơ sở dữ liệu mà không cần huấn luyện lại.
          Sự đơn giản này giúp KNN trở thành điểm khởi đầu tự nhiên cho bất
          kỳ ứng dụng y tế nào cần so khớp mẫu.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
