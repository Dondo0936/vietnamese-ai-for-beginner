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
  slug: "information-theory-in-compression",
  title: "Information Theory in Data Compression",
  titleVi: "Lý thuyết thông tin trong Nén dữ liệu",
  description:
    "Cách entropy của Shannon đặt giới hạn lý thuyết cho JPEG, ZIP và H.265 — ba chuẩn nén định hình internet hiện đại",
  category: "classic-ml",
  tags: ["entropy", "compression", "information-theory", "application"],
  difficulty: "beginner",
  relatedSlugs: ["information-theory"],
  vizType: "static",
  applicationOf: "information-theory",
  featuredApp: {
    name: "JPEG / ZIP / H.265",
    productFeature: "Data Compression Standards",
    company: "ISO / ITU-T",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "A Mathematical Theory of Communication",
      publisher: "Claude E. Shannon, Bell System Technical Journal",
      url: "https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf",
      date: "1948-07",
      kind: "paper",
    },
    {
      title: "How Claude Shannon Invented the Future",
      publisher: "Quanta Magazine",
      url: "https://www.quantamagazine.org/how-claude-shannons-information-theory-invented-the-future-20201222/",
      date: "2020-12",
      kind: "news",
    },
    {
      title: "JPEG Standard (ISO/IEC 10918-1)",
      publisher: "International Organization for Standardization",
      url: "https://www.w3.org/Graphics/JPEG/itu-t81.pdf",
      date: "1992-09",
      kind: "documentation",
    },
    {
      title: "High Efficiency Video Coding (H.265/HEVC)",
      publisher: "ITU-T Recommendation H.265",
      url: "https://www.itu.int/rec/T-REC-H.265",
      date: "2013-04",
      kind: "documentation",
    },
    {
      title: "A Universal Algorithm for Sequential Data Compression (LZ77)",
      publisher: "Abraham Lempel & Jacob Ziv, IEEE Transactions on Information Theory",
      url: "https://ieeexplore.ieee.org/document/1055714",
      date: "1977-05",
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

export default function InformationTheoryInCompression() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Lý thuyết thông tin"
    >
      <ApplicationHero
        parentTitleVi="Lý thuyết thông tin"
        topicSlug="information-theory-in-compression"
      >
        <p>
          Bạn gửi ảnh chụp cho bạn bè qua tin nhắn &mdash; file gốc 12 MB
          (megabyte) nhưng ảnh JPEG chỉ còn 1,2 MB mà mắt thường không thấy
          khác biệt. Bạn nén thư mục bài tập thành file ZIP &mdash; 50 MB
          thành 10 MB. Bạn xem phim 4K trên Netflix mà mạng không giật &mdash;
          nhờ H.265 (chuẩn nén video thế hệ mới) giảm dung lượng xuống một nửa.
        </p>
        <p>
          Tất cả đều dựa trên một ý tưởng từ năm 1948: entropy (độ bất định
          thông tin) của Claude Shannon. Ông chứng minh rằng mỗi nguồn dữ liệu
          có một giới hạn nén lý thuyết &mdash; không thể nén nhỏ hơn mà không
          mất thông tin. Mọi thuật toán nén hiện đại đều cố tiến gần giới hạn
          đó nhất có thể.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="information-theory-in-compression">
        <p>
          Dữ liệu số ngày càng khổng lồ: mỗi ngày internet truyền tải hơn 5
          exabyte (5 triệu terabyte). Nếu không nén, băng thông sẽ không đủ,
          ổ cứng sẽ nhanh đầy, và chi phí lưu trữ tăng chóng mặt.
        </p>
        <p>
          Vấn đề cốt lõi: làm sao biểu diễn cùng một lượng thông tin bằng ít
          bit (đơn vị nhỏ nhất của dữ liệu số) hơn? Với nén không mất mát
          (lossless &mdash; khôi phục nguyên vẹn dữ liệu gốc) như ZIP, mọi
          bit phải được giữ nguyên. Với nén có mất mát (lossy &mdash; chấp nhận
          mất một phần thông tin) như JPEG, câu hỏi là: bỏ được bao nhiêu mà
          con người không nhận ra?
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Lý thuyết thông tin"
        topicSlug="information-theory-in-compression"
      >
        <Beat step={1}>
          <p>
            <strong>
              Giới hạn entropy của Shannon.
            </strong>{" "}
            Shannon chứng minh: entropy H(X) = &minus;&sum; p(x) log&#8322;
            p(x) cho biết số bit tối thiểu cần thiết để mã hóa mỗi ký hiệu
            trong nguồn dữ liệu. Ví dụ: nếu một ký tự xuất hiện 50% thời gian,
            nó chỉ cần 1 bit; ký tự hiếm hơn cần nhiều bit hơn. Đây là giới
            hạn lý thuyết mà không thuật toán nào vượt qua được.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>
              Mã Huffman (Huffman coding &mdash; gán mã ngắn cho ký hiệu phổ
              biến, mã dài cho ký hiệu hiếm).
            </strong>{" "}
            David Huffman (1952) thiết kế phương pháp nén không mất mát tiến
            gần entropy lý thuyết. Ký tự xuất hiện thường xuyên nhận mã ngắn
            hơn &mdash; giống như mã Morse dùng dấu chấm ngắn cho chữ E (chữ
            phổ biến nhất trong tiếng Anh). ZIP sử dụng Huffman coding làm
            bước cuối cùng trong quy trình nén.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>
              DCT và lượng tử hóa trong JPEG (nén ảnh có mất mát).
            </strong>{" "}
            JPEG chia ảnh thành khối 8&times;8 pixel, áp dụng DCT (Discrete
            Cosine Transform &mdash; biến đổi cosin rời rạc, chuyển dữ liệu
            không gian sang miền tần số). Thành phần tần số cao (chi tiết nhỏ
            mắt không nhạy) bị lượng tử hóa (quantization &mdash; làm tròn về
            ít giá trị hơn). Kết quả: tỷ lệ nén 10:1 mà chất lượng ảnh gần
            như không đổi.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>
              H.265 CABAC (nén video thế hệ mới).
            </strong>{" "}
            H.265 (còn gọi HEVC &mdash; High Efficiency Video Coding) dùng
            CABAC (Context-Adaptive Binary Arithmetic Coding &mdash; mã hóa
            số học nhị phân thích nghi theo ngữ cảnh) để nén tối ưu. CABAC ước
            lượng xác suất từng bit dựa trên ngữ cảnh xung quanh &mdash; tiến
            rất gần giới hạn entropy. Kết quả: giảm 50% dung lượng so với
            H.264 ở cùng chất lượng.
          </p>
        </Beat>
        <Beat step={5}>
          <p>
            <strong>
              ZIP: LZ77 kết hợp Huffman.
            </strong>{" "}
            Thuật toán Deflate trong ZIP dùng hai bước: LZ77 (Lempel-Ziv 1977
            &mdash; tìm chuỗi lặp lại và thay bằng tham chiếu ngược) loại bỏ
            dư thừa, rồi Huffman coding nén phần còn lại. Cả hai bước đều dựa
            trên nguyên lý entropy &mdash; loại bỏ bit dư thừa mà không mất
            thông tin.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="information-theory-in-compression"
      >
        <Metric
          value="JPEG đạt tỷ lệ nén 10:1 — ảnh 12 MB còn 1,2 MB mà mắt thường không phân biệt"
          sourceRef={3}
        />
        <Metric
          value="H.265 giảm 50% băng thông so với H.264 ở cùng chất lượng video"
          sourceRef={4}
        />
        <Metric
          value="Entropy Shannon đặt giới hạn lý thuyết tuyệt đối cho mọi phương pháp nén"
          sourceRef={1}
        />
        <Metric
          value="LZ77 + Huffman trong ZIP nén không mất mát, tiến gần giới hạn entropy"
          sourceRef={5}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Lý thuyết thông tin"
        topicSlug="information-theory-in-compression"
      >
        <p>
          Không có lý thuyết thông tin của Shannon, các kỹ sư sẽ thiết kế thuật
          toán nén mà không biết giới hạn nằm ở đâu &mdash; như cố đào vàng
          mà không biết mỏ sâu bao nhiêu. Họ sẽ không biết khi nào đã đạt mức
          tối ưu và khi nào còn cải thiện được.
        </p>
        <p>
          Entropy cho biết chính xác bao nhiêu bit là đủ và bao nhiêu là dư
          thừa. Nhờ đó, Huffman coding biết cách gán mã tối ưu, JPEG biết bỏ
          được bao nhiêu chi tiết, và H.265 biết xác suất nào cần ước lượng.
          Internet như chúng ta biết &mdash; ảnh tải nhanh, video không giật,
          file gửi gọn &mdash; đều bắt nguồn từ một bài báo 78 trang năm 1948.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
