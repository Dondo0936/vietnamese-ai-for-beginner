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
