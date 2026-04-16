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
  slug: "vectors-and-matrices-in-photo-search",
  title: "Vectors & Matrices in Photo Search",
  titleVi: "Vector & Ma trận trong Tìm kiếm Ảnh",
  description:
    "Cách Google Photos dùng vector nhúng 128 chiều và phép đo khoảng cách để gom hàng nghìn ảnh cùng một khuôn mặt",
  category: "math-foundations",
  tags: ["vectors", "embeddings", "face-recognition", "application"],
  difficulty: "beginner",
  relatedSlugs: ["vectors-and-matrices"],
  vizType: "static",
  applicationOf: "vectors-and-matrices",
  featuredApp: {
    name: "Google Photos",
    productFeature: "Face Grouping",
    company: "Google LLC",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "FaceNet: A Unified Embedding for Face Recognition and Clustering",
      publisher: "Florian Schroff, Dmitry Kalenichenko, James Philbin — CVPR 2015",
      url: "https://arxiv.org/abs/1503.03832",
      date: "2015-06",
      kind: "paper",
    },
    {
      title: "Spanner: Google's Globally-Distributed Database",
      publisher: "Google Cloud Blog",
      url: "https://cloud.google.com/blog/topics/developers-practitioners/what-cloud-spanner",
      date: "2017-11",
      kind: "engineering-blog",
    },
    {
      title: "Search your photos by people, places & things",
      publisher: "Google Support",
      url: "https://support.google.com/photos/answer/6128838",
      date: "2024-01",
      kind: "documentation",
    },
    {
      title:
        "Automatic large-scale clustering of faces in images and videos (US8977061B2)",
      publisher: "Google Patent",
      url: "https://patents.google.com/patent/US8977061B2",
      date: "2015-03",
      kind: "patent",
    },
    {
      title:
        "Google Photos Now Stores Over 9 Trillion Photos — And the Number Is Growing Fast",
      publisher: "PetaPixel",
      url: "https://petapixel.com/2025/02/18/google-photos-now-stores-over-9-trillion-photos/",
      date: "2025-02",
      kind: "news",
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

export default function VectorsAndMatricesInPhotoSearch() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Vector & Ma trận"
    >
      <ApplicationHero
        parentTitleVi="Vector & Ma trận"
        topicSlug="vectors-and-matrices-in-photo-search"
      >
        <p>
          Bạn mở Google Photos (ứng dụng quản lý ảnh của Google), gõ
          &ldquo;Bà Ngoại&rdquo; &mdash; hàng trăm tấm ảnh bà suốt mười năm
          qua hiện ra tức thì, kể cả những lúc bà đội nón hay đeo kính.
        </p>
        <p>
          Đằng sau trải nghiệm đó là FaceNet (mạng nhúng khuôn mặt do Google
          phát triển), hệ thống biến mỗi khuôn mặt thành một vector (véc-tơ
          &mdash; mảng số biểu diễn đặc trưng) gồm 128 con số. Hai khuôn mặt
          cùng một người sẽ cho ra hai vector gần nhau trong không gian 128
          chiều; hai người khác nhau sẽ cho vector xa nhau. Toàn bộ phép so
          sánh &ldquo;giống hay khác&rdquo; quy về một phép toán quen thuộc:
          đo khoảng cách giữa hai vector.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="vectors-and-matrices-in-photo-search">
        <p>
          Google Photos lưu trữ hơn 9 nghìn tỷ tấm ảnh, phục vụ 1,5 tỷ người
          dùng mỗi tháng, với 28 tỷ ảnh mới được tải lên mỗi tuần. Mỗi tấm
          ảnh có thể chứa nhiều khuôn mặt ở nhiều góc độ, điều kiện ánh sáng
          và biểu cảm khác nhau.
        </p>
        <p>
          Vấn đề cốt lõi: làm sao để máy tính nhận biết hai tấm ảnh &mdash;
          một chụp năm 2015 ngoài trời nắng, một chụp năm 2024 trong phòng
          tối &mdash; là cùng một người? Và làm sao thực hiện việc này trên
          quy mô hàng tỷ khuôn mặt, trong thời gian thực?
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Vector & Ma trận"
        topicSlug="vectors-and-matrices-in-photo-search"
      >
        <Beat step={1}>
          <p>
            <strong>
              Phát hiện khuôn mặt (face detection &mdash; xác định vùng chứa
              mặt người trong ảnh).
            </strong>{" "}
            CNN (Convolutional Neural Network &mdash; mạng nơ-ron tích chập)
            quét qua mỗi tấm ảnh, đánh dấu hình chữ nhật bao quanh từng khuôn
            mặt. Bước này tách riêng khuôn mặt khỏi phông nền trước khi đưa
            vào bước tiếp theo.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>
              Nhúng khuôn mặt thành vector (face embedding &mdash; biến khuôn
              mặt thành mảng số).
            </strong>{" "}
            FaceNet nhận vùng ảnh khuôn mặt và xuất ra một vector 128 chiều.
            Mô hình được huấn luyện trên 100&ndash;200 triệu ảnh từ khoảng
            8 triệu danh tính khác nhau, sử dụng hàm mất mát bộ ba (triplet
            loss): hệ thống học cách kéo vector của cùng một người lại gần
            nhau và đẩy vector của người khác ra xa, với biên an toàn
            &alpha; = 0,2.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>
              Đo khoảng cách giữa các vector (distance measurement &mdash;
              tính độ tương đồng bằng phép toán trên vector).
            </strong>{" "}
            Hệ thống dùng độ tương đồng cosine (cosine similarity &mdash;
            phép đo góc giữa hai vector) hoặc khoảng cách Euclid (Euclidean
            distance &mdash; phép đo chiều dài đoạn thẳng nối hai điểm) để
            so sánh vector mới với các vector đã lưu. Hai vector càng gần
            nhau, hai khuôn mặt càng giống nhau.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>
              Gom cụm khuôn mặt (agglomerative clustering &mdash; nhóm các
              điểm dữ liệu tương tự lại với nhau từ dưới lên).
            </strong>{" "}
            Các vector gần nhau được gom vào cùng một nhóm, tạo thành album
            theo từng người. Hệ thống bổ sung tín hiệu phụ trợ như thời gian
            chụp, trang phục để tăng độ chính xác. Cơ sở dữ liệu Spanner
            (hệ quản trị dữ liệu phân tán toàn cầu của Google) hỗ trợ tìm
            kiếm láng giềng gần đúng (ANN &mdash; Approximate Nearest
            Neighbor) trên hơn 10 tỷ vector.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="vectors-and-matrices-in-photo-search"
      >
        <Metric
          value="Độ chính xác 99,63% trên tập LFW — vượt mức 97,53% của con người"
          sourceRef={1}
        />
        <Metric
          value="Độ chính xác 95,12% trên tập YouTube Faces DB"
          sourceRef={1}
        />
        <Metric
          value="Lưu trữ hơn 9 nghìn tỷ tấm ảnh, phục vụ 1,5 tỷ người dùng mỗi tháng"
          sourceRef={5}
        />
        <Metric
          value="28 tỷ ảnh mới được tải lên mỗi tuần"
          sourceRef={5}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Vector & Ma trận"
        topicSlug="vectors-and-matrices-in-photo-search"
      >
        <p>
          Không có vector nhúng, hệ thống sẽ phải so sánh trực tiếp từng điểm
          ảnh (pixel) của mỗi khuôn mặt với hàng tỷ khuôn mặt khác &mdash;
          chỉ cần thay đổi nhỏ về ánh sáng hay góc chụp là phép so sánh sai
          hoàn toàn.
        </p>
        <p>
          FaceNet nén mỗi khuôn mặt thành vector 128 chiều, biến bài toán so
          sánh hình ảnh phức tạp thành phép đo khoảng cách đơn giản giữa hai
          mảng số. Nhờ đó, việc tìm kiếm trên hàng tỷ vector diễn ra trong
          mili-giây thay vì hàng giờ, và hệ thống vẫn nhận đúng người dù
          khuôn mặt thay đổi theo năm tháng.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
