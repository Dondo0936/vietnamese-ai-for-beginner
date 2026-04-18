"use client";

import { useMemo } from "react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  CollapsibleDetail,
  TopicLink,
  DragDrop,
  ToggleCompare,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "what-is-ml",
  title: "What is Machine Learning?",
  titleVi: "Machine Learning là gì?",
  description:
    "Giới thiệu Machine Learning — khác gì lập trình truyền thống, giải quyết bài toán nào, và tại sao quan trọng.",
  category: "foundations",
  tags: ["introduction", "machine-learning", "basics"],
  difficulty: "beginner",
  relatedSlugs: [
    "supervised-unsupervised-rl",
    "linear-regression",
    "data-preprocessing",
  ],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

export default function WhatIsMlTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "Điều nào sau đây MÔ TẢ ĐÚNG NHẤT sự khác biệt giữa Machine Learning và lập trình truyền thống?",
        options: [
          "Lập trình truyền thống dùng CPU, còn Machine Learning dùng GPU",
          "Machine Learning học luật từ dữ liệu, lập trình truyền thống do lập trình viên viết luật thủ công",
          "Machine Learning chỉ dùng được cho ảnh và video, lập trình truyền thống dùng cho văn bản",
          "Hai cách tiếp cận cho kết quả giống hệt nhau, chỉ khác về tốc độ",
        ],
        correct: 1,
        explanation:
          "Điểm cốt lõi: lập trình truyền thống = người viết luật (if-else), ML = máy học luật từ dữ liệu. GPU/CPU là chi tiết phần cứng không phải bản chất; ML dùng được cho nhiều dạng dữ liệu, không riêng ảnh.",
      },
      {
        question:
          "Bài toán nào sau đây PHÙ HỢP NHẤT để áp dụng Machine Learning?",
        options: [
          "Tính tiền điện dựa trên số kWh × đơn giá cố định",
          "Chuyển đổi nhiệt độ từ Celsius sang Fahrenheit",
          "Phát hiện email spam trong hộp thư có hàng triệu mẫu",
          "Sắp xếp danh sách tên theo thứ tự bảng chữ cái",
        ],
        correct: 2,
        explanation:
          "Ba bài toán kia đều có công thức/quy tắc rõ ràng — lập trình truyền thống là đủ. Phát hiện spam phức tạp vì ngôn ngữ spam thay đổi liên tục, cần học từ hàng triệu ví dụ thực tế.",
      },
      {
        type: "fill-blank",
        question:
          "ML học từ {blank} thay vì tuân theo {blank} do con người viết sẵn.",
        blanks: [
          { answer: "dữ liệu", accept: ["data", "dữ liệu thực tế"] },
          {
            answer: "luật cố định",
            accept: ["quy tắc cố định", "luật", "quy tắc", "rules"],
          },
        ],
        explanation:
          "Đây là bản chất cốt lõi của Machine Learning: thay vì lập trình viên phải đặt ra mọi quy tắc, mô hình tự học các quy luật từ dữ liệu ví dụ.",
      },
      {
        question:
          "Grab sử dụng Machine Learning để tối ưu lộ trình và ước tính giá cước. Câu nào sau đây ĐÚNG về hệ thống này?",
        options: [
          "Grab thuê lập trình viên viết tay mọi trường hợp về giao thông Hà Nội, TP.HCM",
          "Hệ thống của Grab học từ hàng triệu chuyến đi thực tế để dự đoán thời gian và giá",
          "Grab dùng Google Maps theo cách thủ công, không có AI",
          "Hệ thống Grab hoạt động tốt nhất khi không có dữ liệu lịch sử",
        ],
        correct: 1,
        explanation:
          "Grab thu thập dữ liệu từ hàng triệu chuyến đi — tình trạng giao thông, thời gian, lộ trình — rồi dùng ML để học các pattern phức tạp mà không thể viết tay được.",
      },
      {
        question:
          "Bạn là quản lý một quán cà phê ở Hà Nội và muốn dự đoán doanh thu ngày mai. Bạn có log 2 năm doanh số, thời tiết, ngày lễ. Cách tiếp cận nào PHÙ HỢP NHẤT?",
        options: [
          "Viết một hàm if-else tổng hợp từ trực giác của chủ quán",
          "Huấn luyện mô hình ML dùng log 2 năm đó làm dữ liệu lịch sử",
          "Gọi điện cho 10 quán cà phê khác để hỏi doanh số của họ",
          "Luôn nấu cùng một lượng bất kể điều kiện",
        ],
        correct: 1,
        explanation:
          "Có đủ dữ liệu lịch sử (2 năm) + pattern phức tạp (thời tiết x ngày lễ x doanh số) + quy tắc thay đổi theo mùa → đúng ba điều kiện của bài toán ML. Viết if-else thủ công không nắm được tương tác giữa các yếu tố.",
      },
      {
        question:
          "Bạn chỉ có 30 mẫu dữ liệu cho bài toán phân loại ảnh X-quang phổi. Điều gì đáng lo ngại nhất?",
        options: [
          "Mô hình sẽ chạy quá chậm",
          "Mô hình dễ học thuộc lòng 30 ảnh (overfit) và không áp dụng được cho ảnh mới",
          "Thuật toán sẽ dừng giữa chừng",
          "Kết quả sẽ chính xác 100% mọi lúc",
        ],
        correct: 1,
        explanation:
          "30 mẫu là quá ít cho một bài toán ảnh y tế. Mô hình sẽ bắt 'dấu hiệu riêng' của 30 ảnh đó (có thể là nhiễu) thay vì pattern bệnh lý thực. Khi gặp ảnh mới, dự đoán sai bét — đây là overfitting, một trong những rủi ro lớn nhất của ML.",
      },
      {
        type: "fill-blank",
        question:
          "Trong pipeline ML cơ bản, bước dùng dữ liệu mới chưa từng thấy để đưa ra dự đoán được gọi là {blank} (tiếng Anh).",
        blanks: [
          {
            answer: "inference",
            accept: ["dự đoán", "prediction", "suy luận", "Inference"],
          },
        ],
        explanation:
          "Inference là bước triển khai (serve) — khi mô hình đã được huấn luyện xong và được dùng để đưa ra dự đoán cho dữ liệu thực tế. Đây chính là nơi ML tạo ra giá trị kinh doanh: mỗi lần Gmail phân loại spam, mỗi lần Grab ước tính ETA, đều là một lần inference.",
      },
      {
        question:
          "Một startup tuyên bố 'AI của chúng tôi luôn đạt độ chính xác 100%'. Lý do nghi ngờ LỚN NHẤT là gì?",
        options: [
          "Vì AI không bao giờ sai",
          "Vì trong ML thực tế, 100% chính xác thường là dấu hiệu test bị 'rò rỉ' (data leakage) hoặc overfit — không phải mô hình thật sự tốt",
          "Vì startup luôn nói đúng",
          "Vì AI chỉ đạt đúng 50%",
        ],
        correct: 1,
        explanation:
          "Trong ML thực tế, ngay cả các mô hình SOTA của Google/OpenAI cũng có lỗi. 100% accuracy thường là cờ đỏ: có thể dữ liệu test bị trùng với train (data leakage), hoặc mô hình đã học thuộc lòng. Câu hỏi đúng là: 'accuracy trên tập test ĐỘC LẬP là bao nhiêu, với baseline nào?'",
      },
    ],
    []
  );

  return (
    <>
      {/* ================================================================
          BƯỚC 1 — HOOK / DỰ ĐOÁN
          ================================================================ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Khởi động">
        <PredictionGate
          question="Bạn muốn xây app nhận diện ảnh chó/mèo. Bạn sẽ làm thế nào?"
          options={[
            "Viết hàng nghìn câu lệnh if-else: nếu tai nhọn thì là mèo, nếu mõm dài thì là chó…",
            "Cho máy tính xem hàng nghìn ảnh chó và mèo rồi để nó tự học cách phân biệt",
            "Hardcode trực tiếp đáp án cho từng ảnh trong một bảng tra cứu khổng lồ",
          ]}
          correct={1}
          explanation="Đúng vậy! Không ai có thể viết hết được các quy tắc — tai mèo không phải lúc nào cũng nhọn, chó cũng có nhiều giống khác nhau. Cho máy học từ ví dụ chính là ý tưởng cốt lõi của Machine Learning."
        >
          <p className="mt-3 text-sm text-muted leading-relaxed">
            Tiếp tục để khám phá tại sao cách tiếp cận này mạnh mẽ đến vậy —
            và ML thực sự là gì.
          </p>
        </PredictionGate>

        <div className="mt-6 space-y-3 text-sm leading-relaxed">
          <p>
            <strong>Liên tưởng 1 — Học nấu bún bò Huế từ bà ngoại:</strong>{" "}
            Bà không đưa bạn sách công thức — bà cho bạn đứng bếp, ngửi,
            nếm, chỉnh vị. Sau 30 nồi bún, bạn &quot;cảm&quot; được bao nhiêu
            muối, bao nhiêu mắm ruốc. Đây chính là machine learning: học qua
            ví dụ thực hành, không phải qua quy tắc cứng. Máy tính cũng vậy
            — cho nó hàng triệu &quot;nồi bún&quot; (dữ liệu), nó dần tự học
            được công thức ngầm.
          </p>
          <p>
            <strong>Liên tưởng 2 — Nhận mặt đồng nghiệp ở công ty:</strong>{" "}
            Ngày đầu đi làm, bạn không biết ai. Sau 1 tháng gặp mọi người, bạn
            tự nhận ra ai là ai — không cần ai dạy bạn quy tắc &quot;nếu tóc
            đen dài và đeo kính cận thì là chị Lan&quot;. Não bạn học pattern
            từ các gương mặt thực. ML nhận dạng khuôn mặt hoạt động bằng
            chính cơ chế này, chỉ là với CNN và hàng triệu ảnh thay vì 1 tháng
            làm việc.
          </p>
          <p>
            <strong>Liên tưởng 3 — Lớp học toán không có sách giáo
            khoa:</strong>{" "}
            Hãy tưởng tượng bạn đến lớp và giáo viên chỉ đưa cho bạn 1.000
            bài toán có lời giải sẵn. Bạn tự tìm ra quy tắc. Khi gặp bài toán
            mới, bạn áp dụng quy tắc mình vừa phát hiện. Đây chính là
            supervised learning — cho máy nhiều cặp &quot;câu hỏi - đáp
            án&quot;, máy tự tìm quy tắc.
          </p>
          <p>
            <strong>Liên tưởng 4 — Giao thông Hà Nội không theo luật
            cứng:</strong>{" "}
            Quy tắc giao thông Việt Nam có trên giấy, nhưng thực tế giao
            thông Hà Nội hỗn loạn hơn thế rất nhiều. Để xe tự lái hoạt động ở
            đây, không thể chỉ lập trình theo luật — phải học từ video hàng
            triệu chuyến đi thực tế. ML là công cụ DUY NHẤT hiện nay giải
            quyết được các bài toán mà quy tắc chính thức không đủ mô tả.
          </p>
        </div>
      </LessonSection>

      {/* ================================================================
          BƯỚC 2 — REVEAL: ToggleCompare hai mô hình
          ================================================================ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Hãy so sánh hai cách tiếp cận để giải cùng một bài toán. Nhấn vào
          từng tab để xem sự khác biệt.
        </p>

        <ToggleCompare
          labelA="Lập trình truyền thống"
          labelB="Machine Learning"
          description="Cùng bài toán, hai cách tiếp cận hoàn toàn khác nhau"
          childA={
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium text-center min-w-[100px]">
                  <div className="text-xs text-muted mb-1">Đầu vào</div>
                  <div>Dữ liệu</div>
                </div>
                <div className="text-muted text-lg font-light">+</div>
                <div className="rounded-lg border-2 border-accent bg-accent-light px-4 py-3 text-sm font-medium text-center min-w-[120px]">
                  <div className="text-xs text-muted mb-1">Do người viết</div>
                  <div className="text-accent-dark">Luật (if-else)</div>
                </div>
                <div className="text-muted text-lg font-light">→</div>
                <div className="rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium text-center min-w-[100px]">
                  <div className="text-xs text-muted mb-1">Kết quả</div>
                  <div>Đầu ra</div>
                </div>
              </div>
              <Callout variant="info" title="Ví dụ thực tế">
                Lọc spam: lập trình viên viết luật —{" "}
                <em>
                  &quot;nếu tiêu đề chứa 'trúng thưởng' thì là spam&quot;
                </em>
                . Khi spammer đổi sang &quot;trúng giải&quot;, phải viết luật
                mới.
              </Callout>
            </div>
          }
          childB={
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium text-center min-w-[100px]">
                  <div className="text-xs text-muted mb-1">Đầu vào</div>
                  <div>Dữ liệu</div>
                </div>
                <div className="text-muted text-lg font-light">+</div>
                <div className="rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium text-center min-w-[100px]">
                  <div className="text-xs text-muted mb-1">Ví dụ có nhãn</div>
                  <div>Đầu ra</div>
                </div>
                <div className="text-muted text-lg font-light">→</div>
                <div className="rounded-lg border-2 border-accent bg-accent-light px-4 py-3 text-sm font-medium text-center min-w-[120px]">
                  <div className="text-xs text-muted mb-1">Máy tự học</div>
                  <div className="text-accent-dark">Mô hình (model)</div>
                </div>
              </div>
              <Callout variant="tip" title="Ví dụ thực tế">
                Lọc spam bằng ML: cho máy xem hàng triệu email spam và không
                spam, máy tự học pattern. Khi spammer đổi cách viết, chỉ cần
                thêm dữ liệu mới — không cần lập trình lại.
              </Callout>
            </div>
          }
        />
      </LessonSection>

      {/* ================================================================
          BƯỚC 3 — DEEPEN: Pipeline ML trực quan
          ================================================================ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Hình minh họa">
        <VisualizationSection>
          <div className="space-y-6">
            <p className="text-sm text-muted text-center">
              Vòng đời của một hệ thống Machine Learning — từ dữ liệu thô đến
              dự đoán thực tế
            </p>

            {/* Pipeline SVG */}
            <div className="overflow-x-auto">
              <svg
                viewBox="0 0 640 180"
                className="w-full max-w-2xl mx-auto"
                aria-label="Sơ đồ pipeline Machine Learning"
              >
                {/* Dữ liệu */}
                <rect
                  x="10"
                  y="60"
                  width="110"
                  height="60"
                  rx="10"
                  fill="none"
                  stroke="currentColor"
                  className="text-accent"
                  strokeWidth="2"
                />
                <text
                  x="65"
                  y="85"
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="600"
                  fill="currentColor"
                  className="text-foreground"
                >
                  Dữ liệu
                </text>
                <text
                  x="65"
                  y="104"
                  textAnchor="middle"
                  fontSize="10"
                  fill="currentColor"
                  className="text-muted"
                >
                  (ảnh, text, số…)
                </text>

                {/* Mũi tên 1 */}
                <line
                  x1="120"
                  y1="90"
                  x2="168"
                  y2="90"
                  stroke="currentColor"
                  className="text-accent"
                  strokeWidth="2"
                />
                <polygon
                  points="168,85 178,90 168,95"
                  fill="currentColor"
                  className="text-accent"
                />

                {/* Huấn luyện */}
                <rect
                  x="178"
                  y="60"
                  width="120"
                  height="60"
                  rx="10"
                  fill="none"
                  stroke="currentColor"
                  className="text-accent"
                  strokeWidth="2"
                />
                <text
                  x="238"
                  y="85"
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="600"
                  fill="currentColor"
                  className="text-foreground"
                >
                  Huấn luyện
                </text>
                <text
                  x="238"
                  y="104"
                  textAnchor="middle"
                  fontSize="10"
                  fill="currentColor"
                  className="text-muted"
                >
                  (Training)
                </text>

                {/* Mũi tên 2 */}
                <line
                  x1="298"
                  y1="90"
                  x2="346"
                  y2="90"
                  stroke="currentColor"
                  className="text-accent"
                  strokeWidth="2"
                />
                <polygon
                  points="346,85 356,90 346,95"
                  fill="currentColor"
                  className="text-accent"
                />

                {/* Mô hình */}
                <rect
                  x="356"
                  y="50"
                  width="120"
                  height="80"
                  rx="10"
                  fill="currentColor"
                  className="text-accent"
                  opacity="0.12"
                />
                <rect
                  x="356"
                  y="50"
                  width="120"
                  height="80"
                  rx="10"
                  fill="none"
                  stroke="currentColor"
                  className="text-accent"
                  strokeWidth="2.5"
                />
                <text
                  x="416"
                  y="85"
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="700"
                  fill="currentColor"
                  className="text-accent"
                >
                  Mô hình
                </text>
                <text
                  x="416"
                  y="104"
                  textAnchor="middle"
                  fontSize="10"
                  fill="currentColor"
                  className="text-muted"
                >
                  (Model)
                </text>

                {/* Mũi tên 3 */}
                <line
                  x1="476"
                  y1="90"
                  x2="524"
                  y2="90"
                  stroke="currentColor"
                  className="text-accent"
                  strokeWidth="2"
                />
                <polygon
                  points="524,85 534,90 524,95"
                  fill="currentColor"
                  className="text-accent"
                />

                {/* Dự đoán */}
                <rect
                  x="534"
                  y="60"
                  width="96"
                  height="60"
                  rx="10"
                  fill="none"
                  stroke="currentColor"
                  className="text-accent"
                  strokeWidth="2"
                />
                <text
                  x="582"
                  y="85"
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="600"
                  fill="currentColor"
                  className="text-foreground"
                >
                  Dự đoán
                </text>
                <text
                  x="582"
                  y="104"
                  textAnchor="middle"
                  fontSize="10"
                  fill="currentColor"
                  className="text-muted"
                >
                  (Prediction)
                </text>

                {/* Label bên dưới */}
                <text
                  x="65"
                  y="148"
                  textAnchor="middle"
                  fontSize="9"
                  fill="currentColor"
                  className="text-muted"
                >
                  Bước 1
                </text>
                <text
                  x="238"
                  y="148"
                  textAnchor="middle"
                  fontSize="9"
                  fill="currentColor"
                  className="text-muted"
                >
                  Bước 2
                </text>
                <text
                  x="416"
                  y="148"
                  textAnchor="middle"
                  fontSize="9"
                  fill="currentColor"
                  className="text-muted"
                >
                  Bước 3
                </text>
                <text
                  x="582"
                  y="148"
                  textAnchor="middle"
                  fontSize="9"
                  fill="currentColor"
                  className="text-muted"
                >
                  Bước 4
                </text>
              </svg>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-border bg-surface p-3 space-y-1">
                <div className="font-semibold text-foreground">
                  1. Thu thập dữ liệu
                </div>
                <div className="text-muted text-xs leading-relaxed">
                  Ảnh chó mèo, email spam/không spam, giá nhà kèm diện
                  tích… Càng nhiều, càng chất lượng, mô hình càng tốt.
                </div>
              </div>
              <div className="rounded-lg border border-border bg-surface p-3 space-y-1">
                <div className="font-semibold text-foreground">
                  2. Huấn luyện (Training)
                </div>
                <div className="text-muted text-xs leading-relaxed">
                  Thuật toán phân tích dữ liệu, tìm các pattern ẩn, điều
                  chỉnh tham số nội bộ để dự đoán đúng hơn.
                </div>
              </div>
              <div className="rounded-lg border-2 border-accent bg-accent-light p-3 space-y-1">
                <div className="font-semibold text-accent-dark">
                  3. Mô hình (Model)
                </div>
                <div className="text-accent-dark/70 text-xs leading-relaxed">
                  Kết quả của quá trình học — một hàm toán học có thể nhận
                  đầu vào mới và đưa ra dự đoán.
                </div>
              </div>
              <div className="rounded-lg border border-border bg-surface p-3 space-y-1">
                <div className="font-semibold text-foreground">
                  4. Dự đoán (Inference)
                </div>
                <div className="text-muted text-xs leading-relaxed">
                  Dùng mô hình đã học để xử lý dữ liệu mới chưa thấy bao
                  giờ — đây là lúc ML tạo ra giá trị thực.
                </div>
              </div>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ================================================================
          BƯỚC 4 — CHALLENGE: InlineChallenge giữa bài
          ================================================================ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Gmail tự động phân loại email vào thư mục Spam mà không cần bạn làm gì. Đây là lập trình truyền thống hay Machine Learning?"
          options={[
            "Lập trình truyền thống — Google đã viết hàng nghìn quy tắc if-else để kiểm tra từng email",
            "Machine Learning — hệ thống học từ hàng tỷ email spam/không spam được người dùng đánh dấu",
            "Không phải cái nào — Gmail chỉ dùng danh sách đen (blacklist) IP",
            "Cả hai kết hợp theo tỷ lệ 50/50",
          ]}
          correct={1}
          explanation="Gmail dùng ML. Spammer liên tục thay đổi nội dung nên không thể viết hết quy tắc tĩnh. Hệ thống học từ hàng tỷ email người dùng đánh dấu spam, cập nhật model liên tục để bắt kịp các chiến thuật mới."
        />

        <div className="mt-6">
          <InlineChallenge
            question="Bạn cần xây hệ thống tính tiền taxi: cứ 1 km tính 15.000 VNĐ + phí khởi điểm 20.000 VNĐ. Đây là bài toán NÊN dùng Machine Learning không?"
            options={[
              "Nên — vì dữ liệu taxi có thể thay đổi theo thời gian",
              "Không nên — đây là quy tắc cố định, đơn giản, lập trình truyền thống với if/else là đủ và còn minh bạch hơn",
              "Nên — vì ML luôn tốt hơn lập trình truyền thống",
              "Không quyết định được nếu chưa có 1 triệu mẫu dữ liệu",
            ]}
            correct={1}
            explanation="Đây là bài toán công thức rõ ràng (giá = 20.000 + 15.000 × km). Dùng ML ở đây là 'overkill' — chậm hơn, khó giải thích hơn, và không cho kết quả tốt hơn một công thức đơn giản. Nguyên tắc vàng: ML chỉ nên dùng khi quy tắc PHỨC TẠP đến mức không thể viết tay."
          />
        </div>

        <div className="mt-6">
          <InlineChallenge
            question="Team bạn có 5.000 nhãn ảnh X-quang phổi, muốn xây model chẩn đoán viêm phổi. Sau khi train, accuracy trên tập train = 99%, trên tập test = 73%. Điều này nhiều khả năng là dấu hiệu của gì?"
            options={[
              "Model tuyệt vời — cần deploy ngay",
              "Overfitting — model học thuộc lòng dữ liệu train, không tổng quát hoá tới ảnh mới",
              "Thiếu dữ liệu validation",
              "Lỗi của GPU",
            ]}
            correct={1}
            explanation="Khoảng cách 26 điểm giữa train và test là dấu hiệu kinh điển của overfitting. Model đang bắt chi tiết ngẫu nhiên của 5.000 ảnh huấn luyện thay vì các dấu hiệu bệnh lý tổng quát. Giải pháp: (1) thêm dữ liệu, (2) data augmentation, (3) regularization (dropout, weight decay), (4) early stopping, (5) dùng model nhỏ hơn."
          />
        </div>
      </LessonSection>

      {/* ================================================================
          BƯỚC 5 — EXPLAIN: ExplanationSection lý thuyết đầy đủ
          ================================================================ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Giải thích">
        <ExplanationSection>
          <p>
            <strong>Machine Learning (ML)</strong>{" "}
            là nhánh của Trí tuệ nhân tạo (AI) cho phép máy tính học cách
            thực hiện nhiệm vụ từ dữ liệu — thay vì được lập trình tường
            minh bằng từng quy tắc cụ thể. Mô hình ML tìm kiếm các pattern
            ẩn trong dữ liệu và dùng chúng để đưa ra dự đoán hoặc quyết định
            cho dữ liệu mới chưa từng thấy.
          </p>

          <p>
            <strong>Ba ví dụ ML thực tế tại Việt Nam:</strong>
          </p>
          <ul className="list-disc list-inside space-y-3 pl-2 text-sm leading-relaxed">
            <li>
              <strong>Grab — tối ưu lộ trình:</strong>{" "}
              hệ thống học từ hàng triệu chuyến đi, tình trạng giao thông
              theo giờ, thời tiết để dự đoán thời gian và gợi ý lộ trình tối
              ưu. Không thể viết tay được vì giao thông Hà Nội thay đổi từng
              phút.
            </li>
            <li>
              <strong>Shopee — gợi ý sản phẩm:</strong>{" "}
              thuật toán phân tích hành vi duyệt web, lịch sử mua hàng, đánh
              giá của hàng triệu người dùng để cá nhân hóa trang chủ mỗi
              người — tăng tỷ lệ chuyển đổi đáng kể so với hiển thị ngẫu
              nhiên.
            </li>
            <li>
              <strong>VinAI — xe tự lái:</strong>{" "}
              mô hình nhận diện vật thể (người đi bộ, xe máy, biển báo) học
              từ hàng triệu khung hình video quay trên đường phố Việt Nam —
              môi trường lưu thông phức tạp và độc đáo so với phương Tây.
            </li>
          </ul>

          <p>
            <strong>Khi nào NÊN dùng ML:</strong>
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2 text-sm leading-relaxed">
            <li>
              Pattern phức tạp đến mức không thể viết tay toàn bộ quy tắc
              (nhận diện giọng nói, khuôn mặt, cảm xúc văn bản)
            </li>
            <li>
              Có đủ dữ liệu lịch sử có chất lượng (thường cần hàng nghìn đến
              hàng triệu mẫu)
            </li>
            <li>
              Quy tắc thay đổi theo thời gian và cần tự thích nghi (xu hướng
              mua sắm, mô hình gian lận)
            </li>
          </ul>

          <p>
            <strong>Khi nào KHÔNG nên dùng ML:</strong>
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2 text-sm leading-relaxed">
            <li>
              Quy tắc đơn giản, rõ ràng — tính thuế VAT, chuyển đổi đơn
              vị, sắp xếp bảng chữ cái
            </li>
            <li>
              Không có dữ liệu — không thể học nếu không có ví dụ
            </li>
            <li>
              Cần giải thích rõ ràng từng quyết định — trong một số lĩnh
              vực pháp lý/y tế, ML có thể không minh bạch đủ
            </li>
          </ul>

          <Callout variant="info" title="ML nằm ở đâu trong bức tranh lớn AI?">
            AI (Trí tuệ nhân tạo) là lĩnh vực rộng nhất. Machine Learning là
            một nhánh của AI. Deep Learning là nhánh của ML dùng mạng nơ-ron
            nhiều tầng. Bài học này tập trung vào ML; các bài sau sẽ đi sâu
            hơn.
          </Callout>

          <p>
            <strong>Hai mảnh code minh hoạ</strong> — cùng bài toán
            &quot;phân loại hoa iris&quot; nhưng viết theo hai cách hoàn toàn
            khác nhau:
          </p>

          <CodeBlock
            language="python"
            title="Lập trình truyền thống — người viết luật"
          >
{`def classify_iris_rule_based(sepal_length, petal_length, petal_width):
    """Phân loại hoa iris bằng luật do chuyên gia thực vật học đưa ra."""
    # Người viết phải nghiên cứu từng loại hoa rồi soạn quy tắc
    if petal_width < 0.8:
        return "setosa"
    if petal_length >= 5.0 and petal_width >= 1.7:
        return "virginica"
    if 3.0 <= petal_length < 5.0 and 1.0 <= petal_width < 1.7:
        return "versicolor"
    return "unknown"  # Gặp biến thể lạ → bó tay

# Vấn đề: nếu xuất hiện giống hoa mới, phải bổ sung luật thủ công.
# Khi có 1.000 đặc trưng thay vì 3 — viết tay luật gần như bất khả thi.`}
          </CodeBlock>

          <CodeBlock
            language="python"
            title="Machine Learning — máy tự học luật từ dữ liệu"
          >
{`from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score

# 1. Thu thập dữ liệu — dùng tập chuẩn 150 mẫu iris có sẵn
X, y = load_iris(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42, stratify=y
)

# 2. Huấn luyện — máy tự tìm luật phân loại
model = DecisionTreeClassifier(max_depth=3, random_state=42)
model.fit(X_train, y_train)

# 3. Dự đoán (inference) trên dữ liệu chưa từng thấy
y_pred = model.predict(X_test)
print(f"Độ chính xác trên test: {accuracy_score(y_test, y_pred):.2%}")

# 4. Khi xuất hiện dữ liệu mới, chỉ cần fit lại trên tập mở rộng —
#    KHÔNG phải viết thêm luật if/else bằng tay.`}
          </CodeBlock>

          <Callout variant="tip" title="Đọc code theo 4 bước pipeline">
            Đoạn mã ML ở trên ánh xạ chính xác với pipeline bạn đã thấy ở
            Bước 3: (1) <code>load_iris</code> — thu thập dữ liệu; (2){" "}
            <code>model.fit</code> — huấn luyện; (3) <code>model</code> — mô
            hình; (4) <code>model.predict</code> — dự đoán. Mọi thư viện ML
            (scikit-learn, TensorFlow, PyTorch) đều tuân theo mô hình
            fit/predict này.
          </Callout>

          <CollapsibleDetail title="Đi sâu: các loại ML và khi nào nên dùng (nâng cao)">
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                ML không phải một thuật toán duy nhất — nó là một họ các cách
                tiếp cận. Ba nhánh chính:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>
                  <strong>Supervised Learning (học có giám sát):</strong>{" "}
                  Dữ liệu có nhãn (label). Dự đoán nhà giá bao nhiêu (hồi
                  quy), email có phải spam không (phân loại). Đây là nhánh
                  được dùng trong ~80% dự án ML thực tế.
                </li>
                <li>
                  <strong>
                    Unsupervised Learning (học không giám sát):
                  </strong>{" "}
                  Dữ liệu không nhãn. Gom nhóm khách hàng theo hành vi mua
                  sắm (clustering), phát hiện giao dịch bất thường
                  (anomaly detection).
                </li>
                <li>
                  <strong>
                    Reinforcement Learning (học tăng cường):
                  </strong>{" "}
                  Agent học qua thử-sai với phần thưởng. Dùng cho game AI
                  (AlphaGo), robot, tối ưu hệ thống quảng cáo.
                </li>
              </ul>
              <p>
                Ngoài ra còn có semi-supervised, self-supervised (nền tảng
                của GPT), và transfer learning — nhưng bạn nên vững ba nhánh
                cơ bản trước khi đi vào các kỹ thuật kết hợp.
              </p>
              <p className="text-muted">
                Xem chi tiết ở{" "}
                <TopicLink slug="supervised-unsupervised-rl">
                  bài &quot;Ba loại học máy&quot;
                </TopicLink>
                .
              </p>
            </div>
          </CollapsibleDetail>

          <Callout variant="warning" title="Cạm bẫy thường gặp khi bắt đầu">
            Người mới dễ nghĩ &quot;có ML là giải được mọi thứ&quot;. Thực tế,
            phần lớn thời gian trong một dự án ML là: thu thập &amp; làm sạch
            dữ liệu (60-70%), chọn và thiết kế đặc trưng (15%), huấn luyện
            mô hình (chỉ 10%). Người mới cũng hay bỏ qua việc đánh giá trên{" "}
            <strong>tập test độc lập</strong> — và bị cú sốc khi triển khai
            thực tế.
          </Callout>

          <CollapsibleDetail title="ML Pipeline đầy đủ trong môi trường sản xuất (nâng cao)">
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                Sơ đồ 4 bước đơn giản bạn thấy ở đầu bài là phiên bản
                &quot;pedagogical&quot;. Trong production thực tế, một ML
                pipeline đầy đủ gồm nhiều bước hơn:
              </p>
              <ol className="list-decimal list-inside space-y-2 pl-2">
                <li>
                  <strong>Problem framing:</strong>{" "}
                  định nghĩa bài toán, metric đánh giá, baseline, và điều
                  kiện thành công.
                </li>
                <li>
                  <strong>Data collection:</strong>{" "}
                  crawl, mua, tổng hợp từ nhiều nguồn. Thường mất 40-60%
                  thời gian dự án.
                </li>
                <li>
                  <strong>Data labeling:</strong>{" "}
                  nếu supervised learning, cần người dán nhãn (Scale AI,
                  Label Studio). Đảm bảo chất lượng qua inter-annotator
                  agreement.
                </li>
                <li>
                  <strong>Data cleaning &amp; EDA:</strong>{" "}
                  loại outlier, xử lý missing values, vẽ phân phối, phát
                  hiện bias trong tập dữ liệu.
                </li>
                <li>
                  <strong>Feature engineering:</strong>{" "}
                  biến đổi, kết hợp, chuẩn hoá feature. Với deep learning,
                  bước này nhẹ hơn vì model tự học feature.
                </li>
                <li>
                  <strong>Train/val/test split:</strong>{" "}
                  thường 70/15/15 hoặc 80/10/10, hoặc cross-validation. Chia
                  theo thời gian nếu time-series.
                </li>
                <li>
                  <strong>Model selection &amp; hyperparameter tuning:</strong>{" "}
                  thử nhiều model, dùng validation set để chọn. Grid search,
                  random search, hoặc Bayesian optimization.
                </li>
                <li>
                  <strong>Evaluation:</strong>{" "}
                  test trên test set (chỉ 1 lần!), tính các metric phù hợp
                  (accuracy, F1, AUC, RMSE, BLEU...).
                </li>
                <li>
                  <strong>Deployment:</strong>{" "}
                  đóng gói model (ONNX, TorchScript), đưa vào service (REST
                  API, gRPC, edge device).
                </li>
                <li>
                  <strong>Monitoring &amp; retraining:</strong>{" "}
                  theo dõi data drift, concept drift. Retrain định kỳ hoặc
                  khi metric giảm quá ngưỡng.
                </li>
              </ol>
              <p>
                MLOps là ngành chuyên về automation các bước này — CI/CD cho
                ML, versioning cho data và model, observability cho production
                inference.
              </p>
            </div>
          </CollapsibleDetail>

          <p>
            <strong>Quan hệ AI - ML - DL - Data Science:</strong>{" "}
            Đây là bốn thuật ngữ thường bị nhầm lẫn trong giao tiếp kinh
            doanh và tuyển dụng:
          </p>

          <ul className="list-disc list-inside space-y-2 pl-2 text-sm leading-relaxed">
            <li>
              <strong>AI (Artificial Intelligence):</strong>{" "}
              khái niệm tổng quát về máy móc thực hiện tác vụ đòi hỏi trí
              thông minh. Bao gồm cả các hệ thống dựa trên luật (expert
              systems) lẫn ML.
            </li>
            <li>
              <strong>ML (Machine Learning):</strong>{" "}
              một nhánh con của AI — học từ dữ liệu thay vì luật cứng. Đây
              là trọng tâm của bài học này.
            </li>
            <li>
              <strong>DL (Deep Learning):</strong>{" "}
              một nhánh con của ML dùng mạng nơ-ron nhiều lớp. Đặc biệt
              thành công với ảnh, âm thanh, text, protein.
            </li>
            <li>
              <strong>Data Science:</strong>{" "}
              ngành nghề xoay quanh dữ liệu — phân tích, trực quan hoá, thống
              kê, và cả ML. Data scientist dùng ML như một công cụ, không
              nhất thiết phải là ML engineer.
            </li>
          </ul>

          <Callout variant="info" title="Khi nào ML trở nên hữu ích kinh tế">
            Một ước lượng kinh nghiệm: ML mang lại giá trị khi (1) quy mô
            đủ lớn — tiết kiệm/tăng doanh thu &gt; chi phí phát triển +
            vận hành; (2) có dữ liệu chất lượng đủ; (3) tồn tại baseline
            hiện tại mà ML có thể vượt qua được ít nhất 10-20%. Nếu thiếu
            bất kỳ điều kiện nào, chi phí sẽ vượt lợi ích và dự án thất
            bại. Đó là lý do 80% dự án ML ở giai đoạn thử nghiệm chưa bao
            giờ lên production (Gartner 2019).
          </Callout>

          <p className="text-sm leading-relaxed">
            Để học tiếp, hãy xem{" "}
            <TopicLink slug="supervised-unsupervised-rl">
              các loại học máy (có giám sát, không giám sát, học tăng cường)
            </TopicLink>
            , bắt đầu thực hành với{" "}
            <TopicLink slug="linear-regression">
              hồi quy tuyến tính
            </TopicLink>
            , hoặc tìm hiểu cách chuẩn bị dữ liệu qua{" "}
            <TopicLink slug="data-preprocessing">
              tiền xử lý dữ liệu
            </TopicLink>
            .
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ================================================================
          BƯỚC 6 — AHA MOMENT
          ================================================================ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            ML không &quot;hiểu&quot; theo nghĩa của con người — nó{" "}
            <strong>tìm pattern trong dữ liệu</strong>.{" "}
            Cho nó dữ liệu tốt = kết quả tốt. Cho rác = ra rác.
          </p>
          <p className="mt-2 text-sm font-normal text-muted">
            <strong>Garbage in, garbage out</strong>{" "}
            — nguyên tắc vàng của mọi dự án ML thực tế.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ================================================================
          BƯỚC 7 — CONNECT: MiniSummary
          ================================================================ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về Machine Learning"
          points={[
            "ML = máy tự học luật từ dữ liệu, thay vì lập trình viên viết tay từng quy tắc if-else.",
            "Pipeline cơ bản: Thu thập dữ liệu → Huấn luyện → Mô hình → Dự đoán.",
            "Dùng ML khi pattern phức tạp, có đủ dữ liệu, quy tắc thay đổi theo thời gian.",
            "Không dùng ML cho bài toán đơn giản hoặc khi không có dữ liệu lịch sử.",
            "Garbage in, garbage out — chất lượng dữ liệu quyết định chất lượng mô hình.",
            "Luôn đánh giá mô hình trên tập test ĐỘC LẬP — accuracy 100% trên train thường là dấu hiệu overfitting, không phải thành công.",
          ]}
        />
      </LessonSection>

      {/* ================================================================
          BƯỚC 8 — QUIZ
          ================================================================ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
