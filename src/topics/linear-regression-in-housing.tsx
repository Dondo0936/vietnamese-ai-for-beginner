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
  slug: "linear-regression-in-housing",
  title: "Linear Regression in Housing Valuation",
  titleVi: "Hồi quy tuyến tính trong Định giá Nhà",
  description:
    "Cách Zillow dùng hồi quy tuyến tính làm nền tảng cho Zestimate — định giá tự động 104 triệu ngôi nhà tại Mỹ",
  category: "classic-ml",
  tags: ["regression", "real-estate", "application"],
  difficulty: "beginner",
  relatedSlugs: ["linear-regression"],
  vizType: "static",
  applicationOf: "linear-regression",
  featuredApp: {
    name: "Zillow Zestimate",
    productFeature: "Automated Home Valuation",
    company: "Zillow Group, Inc.",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "Building the Neural Zestimate",
      publisher: "Zillow Tech Hub",
      url: "https://www.zillow.com/tech/building-the-neural-zestimate/",
      date: "2021-06",
      kind: "engineering-blog",
    },
    {
      title: "Zillow's Zestimate: From Idea to IPO",
      publisher: "PR Newswire",
      url: "https://www.prnewswire.com/news-releases/zillow-launches-neural-zestimate-yielding-major-accuracy-gains-301311931.html",
      date: "2021-06",
      kind: "news",
    },
    {
      title: "Zestimate Accuracy: How Accurate Is the Zestimate?",
      publisher: "Zillow Research",
      url: "https://www.zillow.com/z/zestimate/",
      date: "2024-01",
      kind: "documentation",
    },
    {
      title: "Zillow Prize: Zillow's Home Value Prediction Competition",
      publisher: "Kaggle",
      url: "https://www.kaggle.com/c/zillow-prize-1",
      date: "2017-05",
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

export default function LinearRegressionInHousing() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Hồi quy tuyến tính"
    >
      <ApplicationHero
        parentTitleVi="Hồi quy tuyến tính"
        topicSlug="linear-regression-in-housing"
      >
        <p>
          Bạn đang tìm mua nhà. Trước khi gọi môi giới, bạn vào Zillow (trang
          web bất động sản lớn nhất nước Mỹ) và gõ địa chỉ. Ngay lập tức,
          Zestimate (công cụ ước tính giá nhà tự động) hiện ra con số: căn nhà
          này trị giá khoảng 450.000 đô-la Mỹ. Con số ấy không phải phỏng
          đoán &mdash; nó được tính từ dữ liệu hàng triệu giao dịch thực tế.
        </p>
        <p>
          Nền tảng của Zestimate bắt đầu từ hồi quy tuyến tính (linear
          regression &mdash; phương pháp tìm đường thẳng tối ưu mô tả mối quan
          hệ giữa các biến số). Dù ngày nay Zillow đã nâng cấp lên mạng
          nơ-ron, nguyên lý cốt lõi vẫn không đổi: biến đặc trưng của ngôi nhà
          thành một con số dự đoán giá.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="linear-regression-in-housing">
        <p>
          Thị trường bất động sản Mỹ có hơn 104 triệu ngôi nhà. Mỗi ngôi nhà
          khác nhau về diện tích, số phòng, vị trí, tuổi đời, và hàng trăm yếu
          tố khác. Trước đây, định giá nhà phụ thuộc hoàn toàn vào chuyên gia
          thẩm định (appraiser) &mdash; tốn thời gian, chi phí cao, và kết quả
          có thể thiên lệch.
        </p>
        <p>
          Vấn đề cốt lõi: làm sao từ dữ liệu hàng triệu giao dịch đã hoàn
          tất, xây dựng công thức tính giá tự động cho mọi ngôi nhà &mdash; kể
          cả nhà chưa bao giờ được rao bán?
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Hồi quy tuyến tính"
        topicSlug="linear-regression-in-housing"
      >
        <Beat step={1}>
          <p>
            <strong>Thu thập dữ liệu giao dịch.</strong>{" "}
            Zillow thu thập hồ sơ giao dịch bất động sản từ cơ quan thuế địa
            phương, MLS (Multiple Listing Service &mdash; hệ thống đăng tin bất
            động sản) và nguồn công khai. Mỗi bản ghi gồm giá bán thực tế kèm
            hàng trăm thuộc tính: diện tích, số phòng, năm xây, khoảng cách
            đến trường học, tỷ lệ tội phạm khu vực.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>
              Kỹ thuật đặc trưng (feature engineering &mdash; biến dữ liệu thô
              thành biến số có ý nghĩa cho mô hình).
            </strong>{" "}
            Dữ liệu thô được biến đổi thành các đặc trưng có ý nghĩa: diện
            tích mỗi phòng, khoảng cách đến trung tâm, xu hướng giá khu vực
            theo thời gian. Bước này quyết định phần lớn độ chính xác &mdash;
            đặc trưng tốt quan trọng hơn thuật toán phức tạp.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>
              Mô hình ensemble (kết hợp nhiều mô hình).
            </strong>{" "}
            Zestimate ban đầu dùng hồi quy tuyến tính, rồi phát triển thành
            random forest (rừng ngẫu nhiên &mdash; kết hợp nhiều cây quyết
            định) và gradient boosting (tăng cường gradient &mdash; xây dựng mô
            hình tuần tự, mỗi mô hình sửa lỗi của mô hình trước). Các mô
            hình này đều mở rộng từ nguyên lý hồi quy: tìm mối quan hệ giữa
            đặc trưng đầu vào và giá nhà.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>
              Neural Zestimate &mdash; bước tiến lên mạng nơ-ron (2021).
            </strong>{" "}
            Năm 2021, Zillow thay thế bằng Neural Zestimate &mdash; mạng
            nơ-ron sâu (deep neural network) có khả năng học các mối quan hệ
            phi tuyến (non-linear &mdash; không theo đường thẳng) giữa đặc
            trưng. Kết quả: chính xác hơn 20% so với phiên bản cũ.
          </p>
        </Beat>
        <Beat step={5}>
          <p>
            <strong>Cập nhật liên tục.</strong>{" "}
            Mô hình được huấn luyện lại thường xuyên với dữ liệu giao dịch
            mới. Khi bạn sửa sang nhà hoặc khu vực thay đổi, Zestimate tự
            điều chỉnh. Chủ nhà cũng có thể cập nhật thông tin trực tiếp để
            cải thiện độ chính xác.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="linear-regression-in-housing"
      >
        <Metric
          value="104 triệu ngôi nhà được Zestimate định giá trên toàn nước Mỹ"
          sourceRef={3}
        />
        <Metric
          value="Sai số trung vị 1,74% cho nhà đang rao bán, 7,20% cho nhà chưa rao"
          sourceRef={3}
        />
        <Metric
          value="Neural Zestimate (2021) chính xác hơn 20% so với phiên bản trước"
          sourceRef={1}
        />
        <Metric
          value="Zillow Prize trên Kaggle thu hút 3.700 đội thi, giải thưởng 1 triệu đô-la Mỹ"
          sourceRef={4}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Hồi quy tuyến tính"
        topicSlug="linear-regression-in-housing"
      >
        <p>
          Không có hồi quy tuyến tính, không có nền tảng để xây dựng Zestimate.
          Phương pháp này cho phép biến hàng trăm thuộc tính của ngôi nhà thành
          một phương trình dự đoán giá &mdash; đơn giản, minh bạch, và dễ giải
          thích tại sao giá cao hay thấp.
        </p>
        <p>
          Dù Neural Zestimate ngày nay dùng mạng nơ-ron phức tạp hơn, hồi quy
          tuyến tính vẫn là bước đi đầu tiên không thể thiếu: nó thiết lập
          baseline (mức cơ sở) để đo lường tiến bộ, và nguyên lý &ldquo;tìm
          mối quan hệ tuyến tính giữa đặc trưng và kết quả&rdquo; vẫn là nền
          tảng cho mọi mô hình phức tạp hơn.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
