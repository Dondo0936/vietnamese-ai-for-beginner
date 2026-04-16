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
  slug: "logistic-regression-in-spam-filter",
  title: "Logistic Regression in Spam Filtering",
  titleVi: "Hồi quy logistic trong Lọc Spam",
  description:
    "Cách Gmail dùng hồi quy logistic làm nền tảng để lọc 15 tỷ thư rác mỗi ngày với độ chính xác 99,9%",
  category: "classic-ml",
  tags: ["classification", "email", "spam", "application"],
  difficulty: "beginner",
  relatedSlugs: ["logistic-regression"],
  vizType: "static",
  applicationOf: "logistic-regression",
  featuredApp: {
    name: "Gmail",
    productFeature: "Spam Filter",
    company: "Google LLC",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "Spam does not bring us joy — ridding Gmail of 100 million more spam messages with TensorFlow",
      publisher: "Google Workspace Blog",
      url: "https://workspace.google.com/blog/product-announcements/ridding-gmail-of-100-million-more-spam-messages-with-tensorflow",
      date: "2019-02",
      kind: "engineering-blog",
    },
    {
      title: "Introducing RETVec: Resilient and Efficient Text Vectorizer",
      publisher: "Google Research Blog",
      url: "https://blog.research.google/2023/11/retvec-resilient-efficient-text.html",
      date: "2023-11",
      kind: "engineering-blog",
    },
    {
      title: "Gmail turns 20: how Google has used AI to fight spam for two decades",
      publisher: "TechCrunch",
      url: "https://techcrunch.com/2024/04/01/gmail-turns-20/",
      date: "2024-04",
      kind: "news",
    },
    {
      title: "A Plan for Spam",
      publisher: "Paul Graham",
      url: "http://www.paulgraham.com/spam.html",
      date: "2002-08",
      kind: "paper",
    },
    {
      title: "Machine Learning Methods for Spam E-Mail Classification",
      publisher: "International Journal of Computer Science and Information Technology (PMC)",
      url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7512653/",
      date: "2020-09",
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

export default function LogisticRegressionInSpamFilter() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Hồi quy logistic"
    >
      <ApplicationHero
        parentTitleVi="Hồi quy logistic"
        topicSlug="logistic-regression-in-spam-filter"
      >
        <p>
          Mỗi ngày bạn mở Gmail (dịch vụ email của Google) và hộp thư đến sạch
          sẽ &mdash; không quảng cáo thuốc, không lừa đảo trúng thưởng, không
          email giả mạo ngân hàng. Bạn hiếm khi nghĩ về điều đó, nhưng hệ
          thống lọc spam (thư rác) đã âm thầm chặn hàng chục thư rác trước khi
          chúng chạm tới bạn.
        </p>
        <p>
          Nền tảng ban đầu của bộ lọc này là hồi quy logistic (logistic
          regression &mdash; phương pháp phân loại nhị phân, trả lời câu hỏi
          &ldquo;có hay không&rdquo;). Từ một email đầu vào, mô hình tính xác
          suất nó là spam, rồi quyết định: cho vào hộp thư hay chuyển thẳng
          vào thùng rác.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="logistic-regression-in-spam-filter">
        <p>
          Gmail phục vụ 1,8 tỷ người dùng. Mỗi ngày, hệ thống phải xử lý hàng
          chục tỷ email, trong đó khoảng 15 tỷ là thư rác. Kẻ gửi spam liên
          tục thay đổi chiến thuật: viết sai chính tả cố ý để qua bộ lọc, dùng
          hình ảnh thay chữ, giả mạo địa chỉ người gửi.
        </p>
        <p>
          Vấn đề cốt lõi: phân loại mỗi email thành hai nhóm &mdash; spam hoặc
          không spam &mdash; với độ chính xác cực cao. Sai một chiều (để lọt
          spam) gây phiền, sai chiều ngược (chặn nhầm email quan trọng) có thể
          gây hậu quả nghiêm trọng.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Hồi quy logistic"
        topicSlug="logistic-regression-in-spam-filter"
      >
        <Beat step={1}>
          <p>
            <strong>
              Trích xuất đặc trưng (feature extraction &mdash; rút ra các thuộc
              tính quan trọng từ dữ liệu thô).
            </strong>{" "}
            Hệ thống phân tích nội dung email: tần suất từ khóa đáng ngờ
            (&ldquo;miễn phí&rdquo;, &ldquo;trúng thưởng&rdquo;, &ldquo;nhấn
            ngay&rdquo;), cấu trúc HTML, thông tin tiêu đề (header), địa chỉ
            IP người gửi. Paul Graham (nhà nghiên cứu) đề xuất năm 2002 rằng
            chỉ cần đếm tần suất từ đã cho kết quả tốt &mdash; đây là nền
            tảng cho bộ lọc Bayesian (dựa trên xác suất có điều kiện).
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>
              Phân loại bằng hàm sigmoid (sigmoid function &mdash; hàm nén mọi
              giá trị về khoảng 0 đến 1).
            </strong>{" "}
            Hồi quy logistic nhận các đặc trưng đã trích xuất, nhân với trọng
            số (weights), rồi đưa qua hàm sigmoid để ra xác suất từ 0 đến 1.
            Nếu xác suất vượt ngưỡng (threshold &mdash; giá trị phân chia, ví
            dụ 0,5), email bị phân loại là spam. Công thức đơn giản nhưng hiệu
            quả: mỗi đặc trưng đóng góp một phần vào quyết định cuối cùng.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>
              Huấn luyện bằng log-loss (hàm mất mát logarit &mdash; đo sai
              lệch giữa dự đoán và thực tế cho bài toán phân loại).
            </strong>{" "}
            Mô hình được huấn luyện trên hàng tỷ email đã gán nhãn (spam hoặc
            không spam). Thuật toán tối ưu hóa log-loss &mdash; phạt nặng
            khi mô hình tự tin nhưng sai. Quá trình này điều chỉnh trọng số
            từng đặc trưng cho đến khi đạt độ chính xác tối ưu.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>
              Tiến hóa sang mạng nơ-ron và RETVec.
            </strong>{" "}
            Gmail dần thay thế hồi quy logistic thuần túy bằng TensorFlow
            (thư viện học sâu) và mới nhất là RETVec (Resilient and Efficient
            Text Vectorizer &mdash; bộ mã hóa văn bản chống nhiễu). RETVec
            giúp phát hiện spam ngay cả khi kẻ gửi cố tình viết sai chính tả
            hoặc chèn ký tự đặc biệt &mdash; cải thiện tỷ lệ phát hiện thêm
            38%. Dù vậy, nguyên lý &ldquo;tính xác suất rồi phân loại&rdquo;
            của hồi quy logistic vẫn là nền tảng tư duy.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="logistic-regression-in-spam-filter"
      >
        <Metric
          value="Độ chính xác 99,9% — chỉ 1 trong 1.000 thư rác lọt qua"
          sourceRef={3}
        />
        <Metric
          value="Chặn khoảng 15 tỷ thư rác mỗi ngày trên toàn hệ thống"
          sourceRef={1}
        />
        <Metric
          value="1,8 tỷ người dùng Gmail được bảo vệ"
          sourceRef={3}
        />
        <Metric
          value="RETVec cải thiện tỷ lệ phát hiện spam thêm 38%"
          sourceRef={2}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Hồi quy logistic"
        topicSlug="logistic-regression-in-spam-filter"
      >
        <p>
          Không có hồi quy logistic, bộ lọc spam sẽ phải dựa vào luật cứng
          (rule-based) do con người viết tay: nếu email chứa từ X thì chặn.
          Cách này dễ bị qua mặt và không thể mở rộng khi kẻ gửi spam thay
          đổi chiến thuật liên tục.
        </p>
        <p>
          Hồi quy logistic mang lại bước nhảy quan trọng: thay vì luật cố
          định, mô hình học từ dữ liệu để tự tìm ra tổ hợp đặc trưng nào
          phân biệt spam hiệu quả nhất. Nguyên lý &ldquo;tính xác suất nhị
          phân từ đặc trưng đầu vào&rdquo; này đã trở thành viên gạch đầu tiên
          cho mọi hệ thống phân loại email hiện đại.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
