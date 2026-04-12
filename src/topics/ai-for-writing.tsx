"use client";

import { useMemo } from "react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  TopicLink,
  ToggleCompare,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "ai-for-writing",
  title: "AI for Writing",
  titleVi: "AI hỗ trợ viết lách",
  description:
    "Dùng AI để viết email, báo cáo, bài thuyết trình, và tóm tắt cuộc họp nhanh hơn.",
  category: "applied-ai",
  tags: ["writing", "email", "reports", "practical", "office"],
  difficulty: "beginner",
  relatedSlugs: [
    "prompt-engineering",
    "getting-started-with-ai",
    "ai-tool-evaluation",
  ],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

export default function AiForWritingTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "Bạn muốn AI viết email xin phép nghỉ. Prompt nào cho kết quả tốt nhất?",
        options: [
          "Viết email xin nghỉ",
          "Viết email xin phép nghỉ 2 ngày gửi trưởng phòng Nguyễn Văn A, lý do việc gia đình, giọng lịch sự chuyên nghiệp, khoảng 100 từ",
          "Email nghỉ phép, ngắn thôi",
          "Viết gì đó gửi sếp",
        ],
        correct: 1,
        explanation:
          "Prompt tốt cần có đủ: người nhận, lý do, giọng văn, độ dài mong muốn. Càng cụ thể, AI càng cho ra kết quả sát ý bạn.",
      },
      {
        question:
          "Trong khung RACE cho prompt viết lách, chữ C nghĩa là gì?",
        options: [
          "Copy — sao chép nội dung mẫu",
          "Context — ngữ cảnh và thông tin nền",
          "Create — tạo nội dung mới hoàn toàn",
          "Check — kiểm tra lỗi chính tả",
        ],
        correct: 1,
        explanation:
          "C = Context (Ngữ cảnh). Bạn cần cho AI biết bối cảnh cụ thể: viết cho ai, tình huống gì, thông tin nền nào cần đưa vào. Không có ngữ cảnh, AI chỉ viết chung chung.",
      },
      {
        type: "fill-blank",
        question:
          "Khung RACE gồm 4 bước: {blank} (vai trò), {blank} (hành động), Context (ngữ cảnh), Example (ví dụ mẫu).",
        blanks: [
          { answer: "Role", accept: ["role", "Vai trò", "vai trò"] },
          { answer: "Action", accept: ["action", "Hành động", "hành động"] },
        ],
        explanation:
          "RACE = Role + Action + Context + Example. Đây là công thức giúp bạn viết prompt rõ ràng và có cấu trúc khi nhờ AI hỗ trợ viết lách.",
      },
      {
        question:
          "Khi dùng AI tóm tắt cuộc họp, điều nào sau đây QUAN TRỌNG NHẤT cần kiểm tra?",
        options: [
          "Xem AI có dùng font đẹp không",
          "Kiểm tra xem AI có bịa thêm nội dung không có trong cuộc họp không",
          "Đếm xem bản tóm tắt có đủ 500 từ không",
          "Xem AI có thêm emoji vào không",
        ],
        correct: 1,
        explanation:
          "AI có thể bịa nội dung (hallucination) — đặc biệt nguy hiểm khi tóm tắt cuộc họp vì thông tin sai có thể ảnh hưởng đến quyết định kinh doanh. Luôn đối chiếu với ghi chú gốc.",
      },
    ],
    []
  );

  return (
    <>
      {/* ================================================================
          BƯỚC 1 — HOOK: Dự đoán
          ================================================================ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử đoán">
        <PredictionGate
          question="Mất bao lâu để viết email cho sếp?"
          options={[
            "5 phút — nghĩ nội dung, viết, đọc lại, sửa giọng văn",
            "30 giây — nhờ AI viết, chỉ cần kiểm tra lại",
            "Không khác biệt — AI viết cũng phải sửa nhiều nên mất tương đương",
          ]}
          correct={1}
          explanation="Với một prompt tốt, AI có thể soạn email chuyên nghiệp trong vài giây. Bạn chỉ cần kiểm tra lại và thêm chút cá nhân hóa — tiết kiệm đến 80% thời gian viết."
        >
          <p className="text-sm text-muted mt-4">
            Nhưng bí quyết nằm ở cách bạn ra chỉ thị cho AI.
            Hãy xem sự khác biệt giữa viết tay và dùng AI đúng cách.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ================================================================
          BƯỚC 2 — DISCOVER: ToggleCompare
          ================================================================ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-1">
            So sánh: Viết tay vs Dùng AI
          </h3>
          <p className="text-sm text-muted mb-4">
            Cùng một nhiệm vụ: viết email xin phép nghỉ gửi trưởng phòng.
            Xem hai cách tiếp cận khác nhau như thế nào.
          </p>

          <ToggleCompare
            labelA="Viết tay"
            labelB="Dùng AI"
            description="Nhấn vào từng tab để so sánh quy trình"
            childA={
              <div className="space-y-3 py-2">
                <div className="space-y-2">
                  {[
                    { step: "1", label: "Nghĩ nội dung", time: "2 phút" },
                    { step: "2", label: "Viết nháp", time: "3 phút" },
                    { step: "3", label: "Sửa giọng văn", time: "2 phút" },
                    { step: "4", label: "Kiểm tra lỗi chính tả", time: "1 phút" },
                    { step: "5", label: "Đọc lại lần cuối", time: "1 phút" },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-2.5"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/20 text-xs font-medium text-muted">
                        {item.step}
                      </span>
                      <span className="flex-1 text-sm text-foreground">
                        {item.label}
                      </span>
                      <span className="text-xs text-muted">{item.time}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800 p-3 text-center">
                  <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                    Tổng: ~9 phút
                  </span>
                </div>
              </div>
            }
            childB={
              <div className="space-y-3 py-2">
                <div className="space-y-2">
                  {[
                    { step: "1", label: "Viết prompt RACE", time: "30 giây" },
                    { step: "2", label: "AI soạn email", time: "5 giây" },
                    { step: "3", label: "Đọc + chỉnh giọng cá nhân", time: "1 phút" },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-2.5"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-medium text-accent">
                        {item.step}
                      </span>
                      <span className="flex-1 text-sm text-foreground">
                        {item.label}
                      </span>
                      <span className="text-xs text-muted">{item.time}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg bg-green-50 dark:bg-green-900/15 border border-green-200 dark:border-green-800 p-3 text-center">
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    Tổng: ~2 phút
                  </span>
                </div>
                <Callout variant="tip" title="Mấu chốt">
                  Tiết kiệm thời gian nhưng phải kiểm tra lại — đừng bao giờ gửi
                  email mà không đọc lại nội dung AI viết.
                </Callout>
              </div>
            }
          />
        </VisualizationSection>
      </LessonSection>

      {/* ================================================================
          BƯỚC 3 — REVEAL: Khung RACE
          ================================================================ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Phương pháp">
        <ExplanationSection>
          <p>
            Để viết prompt hiệu quả cho các tác vụ viết lách, bạn có thể dùng
            khung <strong>RACE</strong>{" "}
            — một công thức 4 bước giúp AI hiểu chính xác bạn muốn gì.
          </p>

          <div className="rounded-xl border border-border bg-card p-5 my-4 space-y-4">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-white text-sm font-bold">
                R
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Role — Vai trò
                </p>
                <p className="text-sm text-muted">
                  Gán vai trò cho AI: &quot;Bạn là trợ lý hành chính chuyên nghiệp&quot;
                  hoặc &quot;Bạn là quản lý dự án có 10 năm kinh nghiệm.&quot;
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-white text-sm font-bold">
                A
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Action — Hành động
                </p>
                <p className="text-sm text-muted">
                  Nêu rõ nhiệm vụ: &quot;Viết email xin phép nghỉ 2 ngày&quot;,
                  &quot;Tóm tắt biên bản họp&quot;, &quot;Soạn 5 slide cho báo cáo KPI.&quot;
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-white text-sm font-bold">
                C
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Context — Ngữ cảnh
                </p>
                <p className="text-sm text-muted">
                  Cung cấp bối cảnh: người nhận là ai, giọng văn nào, độ dài bao nhiêu,
                  thông tin nền cần đưa vào.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-white text-sm font-bold">
                E
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Example — Ví dụ mẫu
                </p>
                <p className="text-sm text-muted">
                  Cho AI xem ví dụ output bạn mong muốn — giúp AI hiểu đúng
                  phong cách và format.
                </p>
              </div>
            </div>
          </div>

          <Callout variant="insight" title="Tại sao RACE hiệu quả?">
            Giống như khi bạn nhờ đồng nghiệp giúp — bạn phải nói rõ tình huống,
            yêu cầu cụ thể, và cho ví dụ thì họ mới làm đúng ý. AI cũng vậy.
            Nếu bạn đã quen với{" "}
            <TopicLink slug="prompt-engineering">kỹ thuật viết prompt</TopicLink>
            , RACE là phiên bản đơn giản hóa cho công việc văn phòng.
          </Callout>

          <p>
            <strong>Ví dụ prompt RACE hoàn chỉnh:</strong>
          </p>
          <div className="rounded-lg bg-surface p-4 my-3 text-sm text-foreground leading-relaxed">
            <p>
              <strong>[R]</strong>{" "}
              Bạn là trợ lý hành chính chuyên nghiệp tại công ty công nghệ.
            </p>
            <p className="mt-2">
              <strong>[A]</strong>{" "}
              Viết email xin phép nghỉ 2 ngày (thứ 5-6 tuần này).
            </p>
            <p className="mt-2">
              <strong>[C]</strong>{" "}
              Gửi trưởng phòng Nguyễn Văn Minh. Lý do: việc gia đình cần giải quyết.
              Đã bàn giao công việc cho đồng nghiệp Lan. Giọng văn lịch sự, chuyên nghiệp.
              Khoảng 80-100 từ.
            </p>
            <p className="mt-2">
              <strong>[E]</strong>{" "}
              Kết thúc email bằng &quot;Trân trọng cảm ơn anh.&quot;
            </p>
          </div>
        </ExplanationSection>
      </LessonSection>

      {/* ================================================================
          BƯỚC 4 — DEEPEN: 4 use cases thực tế
          ================================================================ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Ứng dụng thực tế">
        <div className="space-y-6">
          <p className="text-sm text-muted leading-relaxed">
            AI hỗ trợ viết lách không chỉ dừng ở email. Dưới đây là 4 tình huống
            phổ biến nhất trong công việc văn phòng hàng ngày.
          </p>

          {/* Use case 1: Email */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h4 className="text-sm font-semibold text-foreground mb-2">
              1. Email công việc
            </h4>
            <p className="text-sm text-muted mb-3">
              Xin phép nghỉ, phản hồi khách hàng, nhắc deadline, cảm ơn đối tác
              — những email bạn viết mỗi ngày.
            </p>
            <div className="rounded-lg bg-surface p-3">
              <p className="text-xs text-muted mb-1 font-medium">Prompt mẫu:</p>
              <p className="text-sm text-foreground leading-relaxed">
                &quot;Viết email phản hồi khách hàng Nguyễn Thị Hoa về việc trễ giao hàng 3 ngày.
                Xin lỗi chân thành, giải thích do lỗi vận chuyển, cam kết giao trong 24h tới.
                Giọng chuyên nghiệp nhưng ấm áp. 100 từ.&quot;
              </p>
            </div>
          </div>

          {/* Use case 2: Báo cáo */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h4 className="text-sm font-semibold text-foreground mb-2">
              2. Báo cáo KPI / tiến độ
            </h4>
            <p className="text-sm text-muted mb-3">
              Báo cáo tuần, tháng, quý — AI giúp cấu trúc dữ liệu thô
              thành bản báo cáo rõ ràng, có nhận xét.
            </p>
            <div className="rounded-lg bg-surface p-3">
              <p className="text-xs text-muted mb-1 font-medium">Prompt mẫu:</p>
              <p className="text-sm text-foreground leading-relaxed">
                &quot;Tóm tắt báo cáo KPI tháng 3 của phòng kinh doanh. Dữ liệu:
                doanh thu 2.1 tỷ (mục tiêu 2.5 tỷ), khách mới 45 (mục tiêu 50),
                tỷ lệ chốt đơn 32%. Phân tích nguyên nhân chưa đạt target và đề xuất
                giải pháp cho tháng 4. Format: bullet points.&quot;
              </p>
            </div>
          </div>

          {/* Use case 3: Slides */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h4 className="text-sm font-semibold text-foreground mb-2">
              3. Bài thuyết trình / Slides
            </h4>
            <p className="text-sm text-muted mb-3">
              AI giúp soạn nội dung cho từng slide — tiêu đề, gạch đầu dòng,
              ghi chú thuyết trình.
            </p>
            <div className="rounded-lg bg-surface p-3">
              <p className="text-xs text-muted mb-1 font-medium">Prompt mẫu:</p>
              <p className="text-sm text-foreground leading-relaxed">
                &quot;Soạn nội dung 5 slide báo cáo quý 1 cho ban giám đốc. Chủ đề:
                kết quả kinh doanh Q1. Mỗi slide gồm: tiêu đề (ngắn), 3-4 bullet points,
                và 1 dòng ghi chú cho người trình bày. Dữ liệu: doanh thu tăng 15%,
                chi phí giảm 8%, 3 khách hàng lớn mới.&quot;
              </p>
            </div>
          </div>

          {/* Use case 4: Meeting notes */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h4 className="text-sm font-semibold text-foreground mb-2">
              4. Tóm tắt cuộc họp
            </h4>
            <p className="text-sm text-muted mb-3">
              Dán ghi chú thô hoặc transcript vào AI để nhận bản tóm tắt
              có cấu trúc: quyết định, action items, deadline.
            </p>
            <div className="rounded-lg bg-surface p-3">
              <p className="text-xs text-muted mb-1 font-medium">Prompt mẫu:</p>
              <p className="text-sm text-foreground leading-relaxed">
                &quot;Tóm tắt cuộc họp dưới đây thành 3 phần: (1) Các quyết định đã thống nhất,
                (2) Action items — ai làm gì, deadline khi nào, (3) Vấn đề cần theo dõi.
                Giữ nguyên tên người, ngày cụ thể. Không thêm thông tin ngoài nội dung họp.&quot;
              </p>
            </div>
            <Callout variant="warning" title="Cẩn thận với thông tin nhạy cảm">
              Không dán nội dung họp bí mật (lương, nhân sự, hợp đồng chưa ký) vào
              AI công cộng. Tìm hiểu thêm tại{" "}
              <TopicLink slug="ai-privacy-security">
                bảo mật khi dùng AI
              </TopicLink>
              .
            </Callout>
          </div>
        </div>
      </LessonSection>

      {/* ================================================================
          BƯỚC 5 — CHALLENGE: Cải thiện prompt
          ================================================================ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Bạn nhờ AI viết báo cáo: 'Viết báo cáo cho sếp'. Prompt này thiếu gì QUAN TRỌNG NHẤT để cho kết quả tốt?"
          options={[
            "Thiếu emoji để AI hiểu cảm xúc của bạn",
            "Thiếu ngữ cảnh: báo cáo gì, dữ liệu nào, cho ai, format ra sao",
            "Thiếu từ 'xin vui lòng' để AI lịch sự hơn",
            "Không thiếu gì — prompt ngắn gọn là tốt",
          ]}
          correct={1}
          explanation="Prompt 'Viết báo cáo cho sếp' quá mơ hồ — AI không biết báo cáo gì (KPI? tiến độ? tài chính?), cho ai (trưởng phòng? giám đốc?), format nào (bullet points? đoạn văn?). Áp dụng khung RACE để bổ sung đầy đủ ngữ cảnh."
        />
      </LessonSection>

      {/* ================================================================
          BƯỚC 6 — EXPLAIN: Pitfalls khi dùng AI viết
          ================================================================ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Lưu ý quan trọng">
        <ExplanationSection>
          <p>
            AI viết rất nhanh, nhưng nếu dùng không cẩn thận, bạn có thể gặp những
            vấn đề nghiêm trọng hơn cả viết chậm.
          </p>

          <h4 className="text-sm font-semibold text-foreground mt-4 mb-2">
            Bẫy #1: Văn phong &quot;AI quá rõ&quot;
          </h4>
          <p className="text-sm text-muted leading-relaxed">
            AI thường viết quá mượt mà, dùng từ hoa mỹ, lặp cấu trúc. Email gửi sếp
            mà đọc như bài văn mẫu thì mất tự nhiên. <strong>Giải pháp:</strong>{" "}
            luôn chỉnh sửa lại bằng giọng riêng của bạn — thêm tên riêng, chi tiết cụ thể
            mà chỉ bạn mới biết.
          </p>

          <h4 className="text-sm font-semibold text-foreground mt-4 mb-2">
            Bẫy #2: AI bịa thông tin
          </h4>
          <p className="text-sm text-muted leading-relaxed">
            Khi tóm tắt cuộc họp hoặc viết báo cáo có số liệu, AI có thể{" "}
            <TopicLink slug="hallucination">bịa nội dung</TopicLink>{" "}
            — thêm thông tin không có trong dữ liệu gốc. <strong>Giải pháp:</strong>{" "}
            luôn đối chiếu output với tài liệu gốc, đặc biệt với con số và tên người.
          </p>

          <h4 className="text-sm font-semibold text-foreground mt-4 mb-2">
            Bẫy #3: Copy-paste không đọc lại
          </h4>
          <p className="text-sm text-muted leading-relaxed">
            Gửi email mà không đọc lại = rủi ro cao. AI có thể hiểu sai ngữ cảnh,
            dùng sai kính ngữ, hoặc bỏ sót thông tin quan trọng.
          </p>

          <AhaMoment>
            AI là <strong>người soạn thảo nháp</strong>{" "}
            — không phải người gửi thay bạn.
            Bạn vẫn là người chịu trách nhiệm cuối cùng với mọi nội dung gửi đi.
            Dùng AI để viết nhanh hơn, nhưng luôn kiểm tra và thêm{" "}
            <strong>giọng văn cá nhân</strong>{" "}
            trước khi nhấn Gửi.
          </AhaMoment>

          <Callout variant="tip" title="Quy tắc 3 bước trước khi gửi">
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>
                <strong>Đọc lại</strong>{" "}
                toàn bộ nội dung — sửa những chỗ &quot;nghe không giống mình&quot;
              </li>
              <li>
                <strong>Kiểm tra</strong>{" "}
                số liệu, tên người, ngày tháng — AI hay bịa những thứ này
              </li>
              <li>
                <strong>Thêm chi tiết cá nhân</strong>{" "}
                — một câu hỏi thăm, một lời cảm ơn cụ thể mà AI không thể biết
              </li>
            </ol>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ================================================================
          BƯỚC 7 — CONNECT: MiniSummary + liên kết
          ================================================================ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về AI hỗ trợ viết lách"
          points={[
            "Dùng khung RACE (Role, Action, Context, Example) để viết prompt rõ ràng cho mọi tác vụ viết.",
            "4 ứng dụng phổ biến: email công việc, báo cáo KPI, slides thuyết trình, tóm tắt cuộc họp.",
            "AI là người soạn nháp, bạn là người chịu trách nhiệm — luôn đọc lại và chỉnh sửa trước khi gửi.",
            "Cẩn thận 3 bẫy: văn phong AI quá rõ, bịa thông tin, và copy-paste không kiểm tra.",
          ]}
        />

        <div className="mt-4 rounded-xl border border-border bg-card p-5">
          <h4 className="text-sm font-semibold text-foreground mb-3">
            Học thêm
          </h4>
          <p className="text-sm text-muted leading-relaxed">
            Muốn viết prompt chuyên sâu hơn? Xem{" "}
            <TopicLink slug="prompt-engineering">
              kỹ thuật viết prompt nâng cao
            </TopicLink>
            . Nếu bạn mới bắt đầu với AI, hãy quay lại{" "}
            <TopicLink slug="getting-started-with-ai">
              hướng dẫn bắt đầu dùng AI
            </TopicLink>
            . Và nhớ tìm hiểu về{" "}
            <TopicLink slug="ai-privacy-security">
              bảo mật khi dùng AI
            </TopicLink>{" "}
            trước khi dán nội dung công ty vào bất kỳ công cụ nào.
          </p>
        </div>
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
