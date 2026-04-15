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
  CodeBlock,
  StepReveal,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "ai-for-data-analysis",
  title: "AI for Data Analysis",
  titleVi: "AI phân tích dữ liệu",
  description:
    "Dùng AI để phân tích bảng tính, tạo biểu đồ, viết SQL, và tìm insight từ dữ liệu.",
  category: "applied-ai",
  tags: ["data-analysis", "spreadsheet", "sql", "practical", "office"],
  difficulty: "beginner",
  relatedSlugs: ["prompt-engineering", "ai-for-writing", "getting-started-with-ai"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

export default function AiForDataAnalysisTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "Khi muốn AI phân tích dữ liệu bán hàng, bước đầu tiên bạn nên làm là gì?",
        options: [
          "Yêu cầu AI tự truy cập file Excel của bạn",
          "Copy-paste dữ liệu vào prompt kèm mô tả cột và câu hỏi cụ thể",
          "Gửi link Google Sheets cho AI",
          "Chỉ cần gõ 'phân tích dữ liệu' là đủ",
        ],
        correct: 1,
        explanation:
          "AI không thể tự truy cập file trên máy bạn. Bạn cần copy dữ liệu vào prompt, mô tả rõ từng cột nghĩa là gì, và đặt câu hỏi cụ thể để AI hiểu bạn muốn phân tích điều gì.",
      },
      {
        question:
          "AI trả lời: 'Doanh thu trung bình tháng 3 là 523 triệu đồng.' Bạn nên làm gì tiếp theo?",
        options: [
          "Tin ngay vì AI rất chính xác với số liệu",
          "Kiểm tra lại bằng cách tính trung bình thủ công hoặc dùng công thức Excel",
          "Bỏ qua vì con số nghe hợp lý",
          "Yêu cầu AI tính lại 5 lần rồi lấy trung bình",
        ],
        correct: 1,
        explanation:
          "AI có thể 'bịa' số liệu (hallucination). Luôn kiểm tra lại các con số quan trọng bằng công thức Excel hoặc tính thủ công. AI giỏi nhất ở việc gợi ý cách phân tích, không phải thay thế bạn kiểm tra.",
      },
      {
        type: "fill-blank" as const,
        question:
          "Để AI tạo công thức Excel tính tổng doanh thu cột D từ dòng 2 đến dòng 100, bạn nên viết prompt: 'Viết công thức Excel để {blank} cột D từ D2 đến D100.'",
        blanks: [
          {
            answer: "tính tổng",
            accept: ["cộng tổng", "SUM", "sum", "tổng"],
          },
        ],
        explanation:
          "Prompt rõ ràng giúp AI tạo đúng công thức =SUM(D2:D100). Nếu bạn mô tả mơ hồ, AI có thể cho công thức sai hoặc không đúng phạm vi dữ liệu.",
      },
      {
        question:
          "Bạn có bảng dữ liệu 500 dòng với các cột: Ngày, Sản phẩm, Số lượng, Đơn giá, Khu vực. Prompt nào giúp AI phân tích hiệu quả nhất?",
        options: [
          "'Phân tích dữ liệu giúp tôi'",
          "'Tôi có dữ liệu bán hàng 6 tháng gần nhất với các cột: Ngày, Sản phẩm, Số lượng, Đơn giá, Khu vực. Hãy: 1) Tìm sản phẩm bán chạy nhất theo khu vực, 2) Xu hướng doanh thu theo tháng, 3) Gợi ý biểu đồ phù hợp'",
          "'Cho tôi biểu đồ đẹp'",
          "'Sản phẩm nào tốt nhất?'",
        ],
        correct: 1,
        explanation:
          "Prompt tốt cần có: mô tả dữ liệu (các cột gì), bối cảnh (6 tháng bán hàng), và yêu cầu cụ thể (3 câu hỏi phân tích rõ ràng). Càng cụ thể, AI càng cho kết quả hữu ích.",
      },
    ],
    []
  );

  return (
    <>
      {/* ━━━ Bước 1: HOOK — Dự đoán ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử đoán">
        <PredictionGate
          question="Bạn có file Excel 10.000 dòng dữ liệu bán hàng. Mất bao lâu để tìm ra xu hướng doanh thu và sản phẩm bán chạy nhất?"
          options={[
            "Vài giờ — lọc, tạo pivot table, vẽ biểu đồ thủ công",
            "Vài phút — nhờ AI phân tích và gợi ý insight",
            "Không thể — cần phải biết lập trình Python",
          ]}
          correct={1}
          explanation="Với AI, bạn chỉ cần mô tả dữ liệu và đặt câu hỏi — AI sẽ gợi ý cách phân tích, viết công thức Excel, thậm chí viết SQL cho bạn. Không cần biết lập trình!"
        >
          <p className="text-sm text-muted mt-4">
            Hãy cùng khám phá cách dùng AI để biến dữ liệu thô thành{" "}
            <strong className="text-foreground">insight hữu ích</strong>{" "}
            chỉ trong vài phút.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ Bước 2: DISCOVER — Mô tả dữ liệu cho AI từng bước ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-1">
            3 bước mô tả dữ liệu cho AI
          </h3>
          <p className="text-sm text-muted mb-4">
            AI không thể đọc file trên máy bạn. Bạn cần &quot;kể&quot; cho AI
            nghe về dữ liệu theo 3 bước. Nhấn &quot;Tiếp tục&quot; để xem từng
            bước.
          </p>

          <StepReveal
            labels={[
              "Bước 1: Mô tả cấu trúc",
              "Bước 2: Cho dữ liệu mẫu",
              "Bước 3: Đặt câu hỏi cụ thể",
            ]}
          >
            {/* Bước 1: Mô tả cấu trúc */}
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs font-semibold text-accent uppercase tracking-wide mb-2">
                Bước 1 — Mô tả cấu trúc dữ liệu
              </p>
              <p className="text-sm text-foreground leading-relaxed mb-3">
                Cho AI biết bảng dữ liệu có những cột nào, mỗi cột chứa loại
                thông tin gì.
              </p>
              <CodeBlock language="text" title="Ví dụ prompt">
                {`Tôi có bảng dữ liệu bán hàng gồm 6 cột:
- Ngày (dd/mm/yyyy): ngày phát sinh đơn hàng
- Mã sản phẩm: mã nội bộ, ví dụ SP001
- Tên sản phẩm: tên đầy đủ
- Số lượng: số đơn vị bán được
- Đơn giá (VNĐ): giá bán mỗi đơn vị
- Khu vực: Bắc / Trung / Nam`}
              </CodeBlock>
            </div>

            {/* Bước 2: Cho dữ liệu mẫu */}
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs font-semibold text-accent uppercase tracking-wide mb-2">
                Bước 2 — Dán vài dòng dữ liệu mẫu
              </p>
              <p className="text-sm text-foreground leading-relaxed mb-3">
                Copy 5-10 dòng đầu tiên từ Excel để AI hiểu format thực tế.
                Nếu dữ liệu quá dài, hãy copy phần đại diện.
              </p>
              <CodeBlock language="text" title="Dữ liệu mẫu">
                {`Ngày       | Mã SP  | Tên sản phẩm    | SL | Đơn giá    | Khu vực
01/01/2025 | SP001  | Bàn phím cơ     | 15 | 1.200.000  | Bắc
01/01/2025 | SP003  | Tai nghe BT     | 22 | 890.000    | Nam
02/01/2025 | SP001  | Bàn phím cơ     | 8  | 1.200.000  | Trung
02/01/2025 | SP007  | Chuột không dây | 30 | 450.000    | Bắc
03/01/2025 | SP003  | Tai nghe BT     | 18 | 890.000    | Bắc`}
              </CodeBlock>
            </div>

            {/* Bước 3: Đặt câu hỏi cụ thể */}
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs font-semibold text-accent uppercase tracking-wide mb-2">
                Bước 3 — Đặt câu hỏi phân tích cụ thể
              </p>
              <p className="text-sm text-foreground leading-relaxed mb-3">
                Nói rõ bạn muốn biết điều gì. Càng cụ thể, AI càng cho câu trả
                lời hữu ích.
              </p>
              <CodeBlock language="text" title="Câu hỏi phân tích">
                {`Từ dữ liệu trên (10.000 dòng, quý 1-4 năm 2025), hãy:
1. Tính tổng doanh thu mỗi khu vực (Bắc/Trung/Nam)
2. Tìm 3 sản phẩm bán chạy nhất theo số lượng
3. Xu hướng doanh thu theo tháng — tăng hay giảm?
4. Gợi ý loại biểu đồ phù hợp để trình bày cho sếp`}
              </CodeBlock>
            </div>
          </StepReveal>

          <Callout variant="tip" title="Mẹo hay">
            Nếu dữ liệu quá dài, hãy copy 10-20 dòng đại diện kèm mô tả:
            &quot;Tổng cộng có 10.000 dòng, đây là mẫu.&quot; AI sẽ hiểu
            context và gợi ý cách phân tích toàn bộ.
          </Callout>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ Bước 3: REVEAL — 3 cách AI giúp phân tích dữ liệu ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khám phá">
        <ExplanationSection>
          <p>
            AI hỗ trợ phân tích dữ liệu theo <strong>3 cấp độ</strong>{" "}
            từ đơn giản đến nâng cao. Bạn không cần biết lập trình để dùng
            cả 3 cấp này.
          </p>

          <ul className="list-disc list-inside space-y-3 pl-2">
            <li>
              <strong>Mô tả dữ liệu:</strong>{" "}
              AI đọc hiểu cấu trúc bảng, giải thích ý nghĩa các cột, phát
              hiện dữ liệu thiếu hoặc bất thường. Ví dụ: &quot;Cột
              doanh thu có 12 dòng trống ở tháng 8, có thể do chưa nhập
              liệu.&quot;
            </li>
            <li>
              <strong>Phân tích và tính toán:</strong>{" "}
              AI gợi ý công thức Excel, viết truy vấn SQL, tính trung bình,
              tìm giá trị lớn nhất, so sánh các nhóm. Ví dụ: AI viết công
              thức =SUMIFS() để tính doanh thu theo khu vực.
            </li>
            <li>
              <strong>Trực quan hoá:</strong>{" "}
              AI đề xuất loại biểu đồ phù hợp (cột, đường, tròn), giải
              thích cách tạo trong Excel hoặc Google Sheets, thậm chí viết
              code Python nếu bạn cần.
            </li>
          </ul>

          <AhaMoment>
            AI không thay thế bạn phân tích dữ liệu — AI là{" "}
            <strong>trợ lý thông minh</strong>{" "}
            giúp bạn đặt đúng câu hỏi, chọn đúng công thức, và nhìn ra
            pattern mà mắt thường dễ bỏ lỡ trong hàng nghìn dòng dữ liệu.
          </AhaMoment>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ Bước 4: DEEPEN — Ví dụ prompt cụ thể ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Đi sâu">
          <p>
            Dưới đây là những prompt thực tế mà dân văn phòng hay dùng khi nhờ
            AI phân tích dữ liệu. Bạn có thể copy và chỉnh sửa cho phù hợp
            với dữ liệu của mình. Hãy áp dụng kỹ thuật{" "}
            <TopicLink slug="prompt-engineering">viết prompt</TopicLink>{" "}
            để có kết quả tốt nhất.
          </p>

          <CodeBlock language="text" title="Prompt 1 — Phân tích doanh thu">
            {`Tôi có dữ liệu doanh thu cửa hàng điện tử 4 quý (Q1-Q4 2025).
Các cột: Tháng, Doanh thu (triệu VNĐ), Chi phí, Lợi nhuận, Khu vực.

Hãy:
1. So sánh lợi nhuận giữa 4 quý
2. Khu vực nào có biên lợi nhuận cao nhất?
3. Tháng nào doanh thu đột biến? Có thể do nguyên nhân gì?
4. Viết công thức Excel tính biên lợi nhuận (%) cho từng dòng`}
          </CodeBlock>

          <CodeBlock language="text" title="Prompt 2 — Tìm sản phẩm bán chạy">
            {`Đây là dữ liệu bán hàng 6 tháng (đã dán 20 dòng mẫu ở trên).
Tổng cộng 8.500 dòng.

Hãy giúp tôi:
1. Top 5 sản phẩm bán chạy nhất theo số lượng
2. Top 5 sản phẩm có doanh thu cao nhất (SL × Đơn giá)
3. Sản phẩm nào bán tốt ở miền Bắc nhưng yếu ở miền Nam?
4. Viết công thức VLOOKUP để tra tên sản phẩm từ mã SP`}
          </CodeBlock>

          <CodeBlock language="text" title="Prompt 3 — Tạo công thức Excel">
            {`Tôi cần các công thức Excel cho bảng lương nhân viên:
- Cột A: Họ tên
- Cột B: Lương cơ bản
- Cột C: Số ngày công (chuẩn 22 ngày)
- Cột D: Phụ cấp
- Cột E: Thuế TNCN (nếu > 11 triệu)

Hãy viết công thức cho:
1. Lương thực nhận = (Lương CB / 22) × Ngày công + Phụ cấp - Thuế
2. Tổng quỹ lương toàn công ty
3. Lương trung bình theo phòng ban (cột F)`}
          </CodeBlock>

          <Callout variant="insight" title="AI viết SQL cũng rất giỏi">
            Nếu dữ liệu nằm trong database, bạn có thể mô tả bảng và cột cho
            AI rồi yêu cầu viết SQL. Ví dụ: &quot;Viết SQL lấy top 10 khách
            hàng mua nhiều nhất trong tháng 3, nhóm theo khu vực.&quot;
          </Callout>
      </LessonSection>

      {/* ━━━ Bước 5: CHALLENGE — Viết prompt phân tích dữ liệu ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Bạn có bảng báo cáo KPI nhân viên với các cột: Tên, Phòng ban, Doanh số tháng, Chỉ tiêu, Tỷ lệ hoàn thành. Prompt nào giúp AI phân tích hiệu quả nhất?"
          options={[
            "Phân tích KPI giúp tôi",
            "Cho tôi biểu đồ KPI",
            "Tôi có bảng KPI 50 nhân viên (5 cột: Tên, Phòng ban, Doanh số tháng, Chỉ tiêu, Tỷ lệ hoàn thành). Hãy: 1) Phòng ban nào đạt KPI cao nhất? 2) Ai là top 3 nhân viên xuất sắc? 3) Gợi ý công thức Excel tính tỷ lệ hoàn thành tự động",
            "Ai làm việc kém nhất công ty?",
          ]}
          correct={2}
          explanation="Prompt C cụ thể nhất: mô tả rõ dữ liệu (50 nhân viên, 5 cột), đặt 3 câu hỏi phân tích rõ ràng, và yêu cầu output thực tế (công thức Excel). Prompt A và B quá mơ hồ, prompt D thiếu bối cảnh dữ liệu."
        />
      </LessonSection>

      {/* ━━━ Bước 6: EXPLAIN — Pitfalls khi dùng AI với dữ liệu ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Lưu ý quan trọng">
          <p>
            AI rất hữu ích cho phân tích dữ liệu, nhưng có <strong>3 điểm yếu
            nghiêm trọng</strong>{" "}
            bạn cần biết để tránh sai lầm.
          </p>

          <Callout variant="warning" title="AI không truy cập được file của bạn">
            AI chatbot (ChatGPT, Claude, Gemini) không thể mở file Excel trên
            máy tính của bạn. Bạn phải copy-paste dữ liệu vào khung chat.
            Nếu file quá lớn, hãy copy phần đại diện hoặc dùng tính năng
            upload file (nếu có).
          </Callout>

          <Callout variant="warning" title="AI có thể bịa số liệu">
            Đây là hiện tượng{" "}
            <TopicLink slug="hallucination">hallucination</TopicLink>
            . AI có thể tự &quot;sáng tác&quot; ra con số nghe hợp lý nhưng hoàn
            toàn sai. Ví dụ: bạn hỏi trung bình doanh thu, AI trả lời một con
            số &quot;đẹp&quot; nhưng không khớp dữ liệu thật. Luôn kiểm tra
            lại bằng Excel.
          </Callout>

          <Callout variant="warning" title="Dữ liệu nhạy cảm — cẩn thận bảo mật">
            Không nên dán dữ liệu chứa thông tin cá nhân (CMND, số tài khoản,
            lương cụ thể từng người) vào AI công cộng. Hãy ẩn danh hoặc thay
            tên trước khi paste. Nếu công ty có chính sách bảo mật, hãy tuân
            thủ.
          </Callout>

          <Callout variant="tip" title="Quy tắc vàng">
            Dùng AI để <strong>gợi ý cách phân tích</strong>{" "}
            và <strong>viết công thức</strong>, nhưng luôn{" "}
            <strong>kiểm tra kết quả</strong>{" "}
            bằng dữ liệu thật trong Excel. AI là trợ lý, không phải người thay
            thế bạn ra quyết định.
          </Callout>
      </LessonSection>

      {/* ━━━ Bước 7: CONNECT — Tóm tắt và liên kết ━━━ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tổng kết">
        <MiniSummary
          title="Những điều cần nhớ về AI phân tích dữ liệu"
          points={[
            "Mô tả dữ liệu cho AI theo 3 bước: cấu trúc cột → dữ liệu mẫu → câu hỏi cụ thể.",
            "AI hỗ trợ 3 cấp: mô tả dữ liệu, phân tích/viết công thức, và gợi ý trực quan hoá.",
            "Luôn kiểm tra lại số liệu AI đưa ra — AI có thể hallucinate con số.",
            "Không dán dữ liệu nhạy cảm (lương, CMND, tài khoản) vào AI công cộng.",
            "Kết hợp kỹ thuật viết prompt tốt để có kết quả phân tích chính xác hơn.",
          ]}
        />

        <div className="mt-4 rounded-xl border border-border bg-card p-5 space-y-3">
          <p className="text-sm font-medium text-foreground">
            Khám phá thêm:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2 text-sm text-foreground/90">
            <li>
              <TopicLink slug="prompt-engineering">
                Kỹ thuật viết prompt
              </TopicLink>{" "}
              — viết prompt tốt hơn để AI hiểu chính xác yêu cầu phân tích
              của bạn.
            </li>
            <li>
              <TopicLink slug="hallucination">
                Hallucination
              </TopicLink>{" "}
              — hiểu vì sao AI đôi khi bịa số liệu và cách phòng tránh.
            </li>
          </ul>
        </div>
      </LessonSection>

      {/* ━━━ Bước 8: QUIZ — Kiểm tra cuối bài ━━━ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
