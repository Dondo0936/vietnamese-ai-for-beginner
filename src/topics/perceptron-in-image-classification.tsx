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
  slug: "perceptron-in-image-classification",
  title: "Perceptron in Image Classification",
  titleVi: "Perceptron trong Phân loại Ảnh",
  description:
    "Câu chuyện Mark I Perceptron (1958) — cỗ máy đầu tiên học phân loại ảnh, tiền thân của mọi mạng nơ-ron hiện đại",
  category: "neural-fundamentals",
  tags: ["perceptron", "image-classification", "application"],
  difficulty: "beginner",
  relatedSlugs: ["perceptron"],
  vizType: "static",
  applicationOf: "perceptron",
  featuredApp: {
    name: "Mark I Perceptron",
    productFeature: "Image Classification",
    company: "Cornell Aeronautical Laboratory",
    countryOrigin: "US",
  },
  sources: [
    {
      title:
        "The Perceptron: A Probabilistic Model for Information Storage and Organization in the Brain",
      publisher: "Frank Rosenblatt, Psychological Review 65(6)",
      url: "https://www.ling.upenn.edu/courses/cogs501/Rosenblatt1958.pdf",
      date: "1958-01",
      kind: "paper",
    },
    {
      title:
        "Professor's Perceptron Paved the Way for AI — 60 Years Too Soon",
      publisher: "Cornell Chronicle",
      url: "https://news.cornell.edu/stories/2019/09/professors-perceptron-paved-way-ai-60-years-too-soon",
      date: "2019-09",
      kind: "news",
    },
    {
      title: "Mark I Perceptron",
      publisher: "Wikipedia",
      url: "https://en.wikipedia.org/wiki/Mark_I_Perceptron",
      date: "2024-01",
      kind: "documentation",
    },
    {
      title: "Perceptron",
      publisher: "Wikipedia",
      url: "https://en.wikipedia.org/wiki/Perceptron",
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

export default function PerceptronInImageClassification() {
  return (
    <ApplicationLayout metadata={metadata} parentTitleVi="Perceptron">
      <ApplicationHero
        parentTitleVi="Perceptron"
        topicSlug="perceptron-in-image-classification"
      >
        <p>
          Năm 1958, tại Cornell Aeronautical Laboratory (phòng thí nghiệm hàng
          không Cornell), nhà tâm lý học Frank Rosenblatt công bố một cỗ máy
          có thể học nhận dạng hình ảnh. Báo New York Times gọi nó
          là &ldquo;phôi thai của bộ não điện tử&rdquo; (embryo of an
          electronic brain).
        </p>
        <p>
          Cỗ máy đó &mdash; Mark I Perceptron &mdash; là mạng nơ-ron nhân tạo
          đầu tiên được chế tạo thành phần cứng thực sự. Nó có thể học phân
          biệt chữ cái, hình dạng đơn giản, và các mẫu hình ảnh &mdash; hoàn
          toàn từ dữ liệu, không cần lập trình quy tắc thủ công. Nguyên lý
          perceptron (đơn vị xử lý cơ bản nhất của mạng nơ-ron) mà Rosenblatt
          phát minh vẫn sống trong mọi mạng nơ-ron hiện đại.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="perceptron-in-image-classification">
        <p>
          Vào thập niên 1950, máy tính chỉ có thể thực hiện các phép tính
          được lập trình sẵn. Muốn máy nhận dạng chữ &ldquo;A&rdquo; hay
          chữ &ldquo;B&rdquo;, lập trình viên phải viết từng quy tắc
          thủ công: &ldquo;nếu pixel ở vị trí X sáng thì...&rdquo;. Cách này
          cực kỳ dễ vỡ &mdash; xoay ảnh vài độ hoặc thay đổi kích thước là
          quy tắc hỏng.
        </p>
        <p>
          Rosenblatt đặt câu hỏi: liệu máy có thể tự học nhận dạng mẫu
          (pattern recognition &mdash; nhận ra quy luật trong dữ liệu) từ ví
          dụ, giống cách bộ não con người học? Hải quân Hoa Kỳ (US Office of
          Naval Research) tài trợ dự án này với hy vọng tạo ra máy đọc ảnh
          trinh sát tự động.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Perceptron"
        topicSlug="perceptron-in-image-classification"
      >
        <Beat step={1}>
          <p>
            <strong>
              Thu nhận ảnh qua mắt cảm biến (sensory units).
            </strong>{" "}
            Mark I có một lưới 20&times;20 = 400 tế bào quang điện
            (photocell &mdash; cảm biến ánh sáng) đóng vai trò &ldquo;võng
            mạc&rdquo;. Mỗi tế bào ghi nhận một pixel: sáng hoặc tối. Ảnh
            đầu vào &mdash; chẳng hạn chữ cái viết tay &mdash; được chiếu lên
            lưới cảm biến này.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>
              Kết nối ngẫu nhiên tới tầng liên kết (association units).
            </strong>{" "}
            Tín hiệu từ các tế bào quang điện được nối ngẫu nhiên tới 512 đơn
            vị liên kết. Mỗi đơn vị nhận đầu vào từ nhiều cảm biến, tính tổng
            có trọng số (weighted sum &mdash; tổng các tín hiệu nhân với hệ số
            quan trọng), và kích hoạt nếu tổng vượt ngưỡng (threshold &mdash;
            giá trị giới hạn). Đây chính là phép tính cốt lõi của perceptron.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>
              Quyết định phân loại ở tầng phản hồi (response units).
            </strong>{" "}
            Các đơn vị phản hồi nhận tổng có trọng số từ tầng liên kết và đưa
            ra quyết định nhị phân (binary &mdash; hai lớp): ảnh thuộc lớp A
            hay lớp B. Ví dụ: chữ &ldquo;X&rdquo; hay chữ &ldquo;E&rdquo;,
            tờ giấy đánh dấu bên trái hay bên phải.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>
              Học bằng quy tắc cập nhật trọng số (Perceptron Learning Rule).
            </strong>{" "}
            Khi máy dự đoán sai, trọng số kết nối được điều chỉnh: tăng trọng
            số cho tín hiệu hữu ích, giảm cho tín hiệu gây nhiễu. Quy trình
            lặp lại nhiều lần trên tập dữ liệu huấn luyện cho đến khi máy
            phân loại đúng. Đây là thuật toán học đầu tiên cho mạng nơ-ron
            nhân tạo.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="perceptron-in-image-classification"
      >
        <Metric
          value="Phân biệt chữ X và E với độ chính xác 100% khi huấn luyện chỉ với 20 ảnh (10 ảnh mỗi lớp)"
          sourceRef={3}
        />
        <Metric
          value="Nhận dạng đúng ngay cả khi ảnh bị xoay tới 30 độ và thay đổi vị trí"
          sourceRef={3}
        />
        <Metric
          value="400 tế bào quang điện đầu vào, 512 đơn vị liên kết — hoàn toàn bằng phần cứng analog"
          sourceRef={1}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Perceptron"
        topicSlug="perceptron-in-image-classification"
      >
        <p>
          Nếu Rosenblatt không chứng minh được rằng máy có thể tự học từ dữ
          liệu, ngành AI có thể mắc kẹt trong paradigm lập trình quy tắc thủ
          công (rule-based &mdash; dựa trên quy tắc viết sẵn) thêm nhiều thập
          kỷ.
        </p>
        <p>
          Perceptron Learning Rule &mdash; ý tưởng điều chỉnh trọng số dựa
          trên sai số &mdash; là tiền thân trực tiếp của backpropagation (lan
          truyền ngược), thuật toán huấn luyện mọi mạng nơ-ron hiện đại từ
          GPT đến mạng nhận diện khuôn mặt. Mọi bước tiến của deep learning
          ngày nay đều bắt nguồn từ nguyên lý đơn giản mà Rosenblatt chứng
          minh năm 1958.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
