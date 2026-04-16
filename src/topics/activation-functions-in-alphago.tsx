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
  slug: "activation-functions-in-alphago",
  title: "Activation Functions in AlphaGo",
  titleVi: "Hàm kích hoạt trong AlphaGo",
  description:
    "Cách DeepMind dùng ReLU và tanh trong mạng nơ-ron 13 tầng để AlphaGo đánh bại nhà vô địch cờ vây thế giới",
  category: "neural-fundamentals",
  tags: ["activation-functions", "reinforcement-learning", "application"],
  difficulty: "intermediate",
  relatedSlugs: ["activation-functions"],
  vizType: "static",
  applicationOf: "activation-functions",
  featuredApp: {
    name: "AlphaGo",
    productFeature: "Go Game AI",
    company: "DeepMind (Google)",
    countryOrigin: "GB",
  },
  sources: [
    {
      title:
        "Mastering the Game of Go with Deep Neural Networks and Tree Search",
      publisher: "Silver et al., Nature 529",
      url: "https://www.nature.com/articles/nature16961",
      date: "2016-01",
      kind: "paper",
    },
    {
      title: "Mastering the Game of Go without Human Knowledge",
      publisher: "Silver et al., Nature 550 (AlphaGo Zero)",
      url: "https://discovery.ucl.ac.uk/10045895/1/agz_unformatted_nature.pdf",
      date: "2017-10",
      kind: "paper",
    },
    {
      title:
        "The Go Files: AI Computer Wraps Up 4-1 Victory Against Human Champion",
      publisher: "Nature News",
      url: "https://www.nature.com/articles/nature.2016.19575",
      date: "2016-03",
      kind: "news",
    },
    {
      title: "AlphaGo: A Technical Deep Dive",
      publisher: "AI Revolution",
      url: "https://airev.us/alpha-go",
      date: "2023-01",
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

export default function ActivationFunctionsInAlphaGo() {
  return (
    <ApplicationLayout metadata={metadata} parentTitleVi="Hàm kích hoạt">
      <ApplicationHero
        parentTitleVi="Hàm kích hoạt"
        topicSlug="activation-functions-in-alphago"
      >
        <p>
          Tháng 3 năm 2016, AlphaGo (chương trình AI chơi cờ vây của
          DeepMind, công ty thuộc Google) đánh bại Lee Sedol &mdash; một trong
          những kỳ thủ cờ vây mạnh nhất lịch sử &mdash; với tỉ số 4-1. Cả
          thế giới kinh ngạc: cờ vây có 10^{170} trạng thái khả dĩ, được coi
          là &ldquo;pháo đài cuối cùng&rdquo; mà AI chưa thể chinh phục.
        </p>
        <p>
          Trái tim của AlphaGo là hai mạng nơ-ron tích chập (convolutional
          neural network &mdash; CNN) 13 tầng. Và ở mỗi tầng, hàm kích hoạt
          (activation function &mdash; hàm toán học quyết định nơ-ron có kích
          hoạt hay không) đóng vai trò then chốt: ReLU (Rectified Linear
          Unit &mdash; hàm chỉnh lưu tuyến tính) cho các tầng ẩn và tanh (hàm
          tang hyperbolic) cho đầu ra mạng giá trị (value network).
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="activation-functions-in-alphago">
        <p>
          Bàn cờ vây 19&times;19 có khoảng 2,1 &times; 10^{170} trạng thái
          hợp lệ &mdash; nhiều hơn số nguyên tử trong vũ trụ quan sát được.
          Không thể duyệt hết mọi nước đi như cờ vua. Cần mạng nơ-ron đánh
          giá vị trí bàn cờ và chọn nước đi tốt.
        </p>
        <p>
          Nhưng mạng nơ-ron tuyến tính (linear network &mdash; mạng chỉ dùng
          phép nhân và cộng) không đủ mạnh: dù xếp bao nhiêu tầng, kết quả
          vẫn chỉ là một phép biến đổi tuyến tính đơn. Để mạng 13 tầng thực
          sự &ldquo;sâu&rdquo; &mdash; mỗi tầng học được đặc trưng phức tạp
          hơn tầng trước &mdash; cần hàm kích hoạt phi tuyến giữa các tầng.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Hàm kích hoạt"
        topicSlug="activation-functions-in-alphago"
      >
        <Beat step={1}>
          <p>
            <strong>Biểu diễn bàn cờ.</strong> Bàn cờ 19&times;19 được mã hóa
            thành tensor (mảng nhiều chiều) 19&times;19&times;48, trong đó 48
            kênh chứa thông tin: vị trí quân đen/trắng, lịch sử 8 nước gần
            nhất, số khí (liberty &mdash; ô trống liền kề nhóm quân), và thông
            tin lượt đi.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>
              Mạng chính sách (policy network) 13 tầng CNN + ReLU.
            </strong>{" "}
            Tầng đầu dùng bộ lọc 5&times;5 với 192 kênh, các tầng tiếp theo
            dùng 3&times;3 với 192 kênh. Sau mỗi tầng tích chập, ReLU kích
            hoạt: f(x) = max(0, x). ReLU loại bỏ giá trị âm, giữ nguyên giá
            trị dương &mdash; tạo tính phi tuyến (nonlinearity) nhưng không gây
            triệt tiêu gradient (vanishing gradient &mdash; gradient quá nhỏ
            khi lan truyền ngược) như sigmoid hay tanh ở tầng sâu. Đầu ra
            qua softmax cho xác suất mỗi nước đi.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>
              Mạng giá trị (value network) dùng ReLU + tanh ở đầu ra.
            </strong>{" "}
            Kiến trúc tương tự mạng chính sách nhưng tầng cuối là một nơ-ron
            duy nhất với hàm tanh: f(x) = (e^x - e^{"{-x}"}) / (e^x +
            e^{"{-x}"}), cho giá trị từ -1 đến +1 &mdash; biểu diễn xác suất
            thắng của bên đang đi. Tanh phù hợp vì kết quả ván cờ là liên tục
            từ thua (-1) đến thắng (+1).
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>
              Kết hợp với MCTS (Monte Carlo Tree Search &mdash; tìm kiếm cây
              Monte Carlo).
            </strong>{" "}
            Mạng chính sách thu hẹp không gian tìm kiếm: chỉ khám phá nước đi
            có xác suất cao. Mạng giá trị đánh giá vị trí mà không cần mô
            phỏng đến cuối ván. Cả hai mạng cần hàm kích hoạt phi tuyến để học
            các đặc trưng bàn cờ phức tạp qua 13 tầng sâu.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="activation-functions-in-alphago"
      >
        <Metric
          value="Mạng chính sách dự đoán nước đi chuyên gia với độ chính xác 57,0% — vượt xa mọi hệ thống trước đó"
          sourceRef={1}
        />
        <Metric
          value="AlphaGo thắng 99,8% khi đấu với các chương trình cờ vây khác"
          sourceRef={1}
        />
        <Metric
          value="Thắng Lee Sedol (9 đẳng) 4-1 vào tháng 3/2016 — lần đầu AI chiến thắng kỳ thủ cờ vây chuyên nghiệp"
          sourceRef={3}
        />
        <Metric
          value="AlphaGo Zero (2017) dùng kiến trúc tương tự, tự học từ số 0, đánh bại phiên bản gốc 100-0"
          sourceRef={2}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Hàm kích hoạt"
        topicSlug="activation-functions-in-alphago"
      >
        <p>
          Nếu dùng hàm kích hoạt sigmoid thay ReLU trong 13 tầng CNN, gradient
          sẽ bị triệt tiêu (vanishing gradient) ở các tầng sâu &mdash; mạng
          không thể học được đặc trưng phức tạp của bàn cờ. Nếu không có hàm
          kích hoạt nào, 13 tầng sẽ sụp thành một phép biến đổi tuyến tính
          đơn, mất hoàn toàn khả năng biểu diễn.
        </p>
        <p>
          Sự kết hợp ReLU (cho tầng ẩn &mdash; gradient ổn định) và tanh (cho
          đầu ra giá trị &mdash; phạm vi [-1, 1]) là lựa chọn thiết kế quan
          trọng giúp AlphaGo đạt được hiệu năng đột phá, mở ra kỷ nguyên AI
          chinh phục các bài toán tưởng chừng bất khả thi.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
