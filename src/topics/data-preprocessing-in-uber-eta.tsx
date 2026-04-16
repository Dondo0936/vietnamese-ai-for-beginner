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
  slug: "data-preprocessing-in-uber-eta",
  title: "Data Preprocessing in Uber ETA",
  titleVi: "Tiền xử lý dữ liệu trong Dự đoán ETA của Uber",
  description:
    "Cách Uber làm sạch hàng tỷ điểm GPS nhiễu, xử lý missing data và tính feature real-time để dự đoán thời gian đến chính xác dưới 1 phút sai số",
  category: "foundations",
  tags: ["preprocessing", "eta-prediction", "application"],
  difficulty: "intermediate",
  relatedSlugs: ["data-preprocessing"],
  vizType: "static",
  applicationOf: "data-preprocessing",
  featuredApp: {
    name: "Uber",
    productFeature: "DeepETA",
    company: "Uber Technologies",
    countryOrigin: "US",
  },
  sources: [
    {
      title:
        "DeepETA: How Uber Predicts Arrival Times Using Deep Learning",
      publisher: "Uber Engineering Blog",
      url: "https://www.uber.com/us/en/blog/deepeta-how-uber-predicts-arrival-times/",
      date: "2022-01",
      kind: "engineering-blog",
    },
    {
      title:
        "DeeprETA: An ETA Post-processing System at Scale",
      publisher: "arXiv (Uber AI)",
      url: "https://arxiv.org/pdf/2206.02127",
      date: "2022-06",
      kind: "paper",
    },
    {
      title: "Rethinking GPS: Engineering Next-Gen Location at Uber",
      publisher: "Uber Engineering Blog",
      url: "https://www.uber.com/us/en/blog/rethinking-gps/",
      date: "2023-08",
      kind: "engineering-blog",
    },
    {
      title:
        "Enhancing the Quality of Uber's Maps with Metrics Computation",
      publisher: "Uber Engineering Blog",
      url: "https://www.uber.com/us/en/blog/maps-metrics-computation/",
      date: "2022-04",
      kind: "engineering-blog",
    },
    {
      title:
        "Improving Uber's Mapping Accuracy with CatchME",
      publisher: "Uber Engineering Blog",
      url: "https://eng.uber.com/mapping-accuracy-with-catchme/",
      date: "2021-06",
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

export default function DataPreprocessingInUberEta() {
  return (
    <ApplicationLayout metadata={metadata} parentTitleVi="Tiền xử lý dữ liệu">
      <ApplicationHero
        parentTitleVi="Tiền xử lý dữ liệu"
        topicSlug="data-preprocessing-in-uber-eta"
      >
        <p>
          Bạn gọi Uber, màn hình hiển thị &ldquo;Tài xế đến trong 4
          phút.&rdquo; Con số đó không phải phỏng đoán &mdash; nó được tính toán
          bởi hệ thống DeepETA (Deep Learning cho Estimated Time of Arrival
          &mdash; dự đoán thời gian đến), xử lý hàng triệu chuyến đi mỗi ngày
          trên hơn 10.000 thành phố.
        </p>
        <p>
          Nhưng trước khi bất kỳ mô hình nào chạy, Uber phải giải quyết một
          bài toán khổng lồ: dữ liệu GPS (Global Positioning System &mdash; hệ
          thống định vị toàn cầu) từ hàng triệu điện thoại bị nhiễu nặng, toạ
          độ nhảy lung tung giữa các toà nhà, thiếu tín hiệu trong hầm và
          garage. Tiền xử lý dữ liệu chính là bước quyết định &mdash; nếu đầu
          vào bẩn, mọi dự đoán đều sai.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="data-preprocessing-in-uber-eta">
        <p>
          Uber thu thập hàng tỷ điểm GPS mỗi ngày từ tài xế và hành khách.
          Nhưng tín hiệu GPS trong thành phố cực kỳ nhiễu: hiệu ứng urban
          canyon (hẻm núi đô thị &mdash; tín hiệu bị phản xạ giữa các toà nhà
          cao tầng) khiến vị trí sai lệch 50&ndash;100 mét. Trong hầm hoặc
          garage, GPS mất tín hiệu hoàn toàn &mdash; tạo ra missing data
          (dữ liệu bị thiếu).
        </p>
        <p>
          Ngoài ra, dữ liệu giao thông thay đổi liên tục: một vụ tai nạn có
          thể khiến đoạn đường 5 phút thành 30 phút. Feature (đặc trưng) phải
          được tính trong thời gian thực, nhưng dữ liệu thô chứa đầy outlier
          (giá trị ngoại lai &mdash; dữ liệu bất thường) và noise (nhiễu).
          &ldquo;Garbage in, garbage out&rdquo; &mdash; nếu không làm sạch,
          DeepETA không thể dự đoán chính xác.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Tiền xử lý dữ liệu"
        topicSlug="data-preprocessing-in-uber-eta"
      >
        <Beat step={1}>
          <p>
            <strong>
              Khử nhiễu GPS bằng map matching (gắn toạ độ vào bản đồ).
            </strong>{" "}
            GPS thô báo bạn đang đứng giữa toà nhà, nhưng thực tế bạn đang
            trên đường. Uber dùng HMM (Hidden Markov Model &mdash; mô hình
            Markov ẩn) để &ldquo;kéo&rdquo; mỗi điểm GPS về đoạn đường gần
            nhất trên bản đồ. Hệ thống xử lý hai tầng: online matcher
            (gắn nhanh real-time cho hiển thị) và offline reprocess (xử lý lại
            chính xác hơn cho huấn luyện model). Bước này giảm sai số vị trí
            từ 50&ndash;100m xuống dưới 5m.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>
              Xử lý missing data và outlier ở cấp hệ thống.
            </strong>{" "}
            Khi GPS mất tín hiệu (hầm, garage), hệ thống dùng sensor fusion
            (kết hợp cảm biến &mdash; gyroscope, accelerometer, barometer) trên
            điện thoại để ước lượng vị trí. Với outlier giao thông (ví dụ: tốc
            độ 300 km/h do GPS nhảy), Uber áp dụng bộ lọc dựa trên domain
            knowledge (kiến thức chuyên ngành) &mdash; tốc độ vượt giới hạn vật
            lý bị loại bỏ, thời gian di chuyển âm bị đánh dấu invalid.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>
              Feature discretization (rời rạc hoá đặc trưng &mdash; chia giá
              trị liên tục thành nhóm).
            </strong>{" "}
            DeepETA không dùng giá trị liên tục trực tiếp. Thay vào đó, mọi
            continuous feature (đặc trưng liên tục) như khoảng cách, thời gian
            trong ngày được chia thành bucket (nhóm). Kết quả thực nghiệm cho
            thấy bucketing giúp model học pattern (mẫu) tốt hơn so với dùng
            giá trị thô. Vị trí (latitude, longitude) được mã hoá vào lưới đa
            phân giải (multi-resolution grid) vì mật độ chuyến đi rất không
            đều &mdash; trung tâm Manhattan cần ô lưới nhỏ, vùng ngoại ô chỉ
            cần ô lớn.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>
              Real-time feature computation (tính đặc trưng thời gian thực).
            </strong>{" "}
            Mỗi yêu cầu ETA cần features cập nhật trong mili-giây: tốc độ
            trung bình trên từng đoạn đường (tính từ stream GPS của tất cả tài
            xế), segment-wise traversal time (thời gian đi qua từng đoạn
            đường), và calibration feature (đặc trưng hiệu chỉnh) phân biệt
            loại chuyến đi &mdash; giao hàng, đi chung, hay chuyến riêng.
            Pipeline này chạy qua Kafka (hệ thống truyền dữ liệu stream) với
            độ trễ dưới 100ms.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="data-preprocessing-in-uber-eta"
      >
        <Metric
          value="DeepETA giảm sai số trung bình so với routing engine truyền thống, trên hơn 10.000 thành phố"
          sourceRef={1}
        />
        <Metric
          value="Xử lý hàng tỷ điểm GPS mỗi ngày, sau khử nhiễu sai số giảm từ 50–100m xuống dưới 5m"
          sourceRef={3}
        />
        <Metric
          value="Feature discretization (bucketing) cho accuracy tốt hơn dùng giá trị liên tục trực tiếp"
          sourceRef={1}
        />
        <Metric
          value="Pipeline real-time feature computation xử lý với độ trễ dưới 100ms qua Kafka"
          sourceRef={2}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Tiền xử lý dữ liệu"
        topicSlug="data-preprocessing-in-uber-eta"
      >
        <p>
          Không có bước tiền xử lý, GPS nhiễu sẽ khiến model nghĩ tài xế đang
          ở toà nhà bên cạnh thay vì trên đường &mdash; ETA có thể sai hàng
          chục phút. Outlier giao thông (tốc độ 300 km/h) sẽ kéo lệch mọi
          thống kê trung bình. Missing data từ hầm và garage tạo lỗ hổng trong
          lộ trình, khiến model không thể tính thời gian đi qua.
        </p>
        <p>
          Tiền xử lý biến dữ liệu thô đầy nhiễu thành đầu vào sạch: map
          matching sửa vị trí, sensor fusion lấp lỗ hổng, discretization chuẩn
          hoá scale, và real-time pipeline đảm bảo features luôn mới. Đây là lý
          do 80% công sức ML nằm ở xử lý dữ liệu, không phải ở model.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
