// =============================================================================
// CONTRIBUTOR TOPIC TEMPLATE — src/topics/_template.tsx
// =============================================================================
//
// Hướng dẫn sử dụng (Instructions):
//   1. Sao chép file này thành src/topics/<slug>.tsx
//   2. Thay thế tất cả "xyz-khai-niem" / "XYZ" / "Khái Niệm XYZ" bằng nội dung thật
//   3. Xóa các comment hướng dẫn khi đã hiểu rõ
//   4. Chạy `next dev` để xem trước — file cần compile ngay khi copy
//
// Quy tắc cốt lõi (Core rules):
//   • Mọi văn bản đều bằng tiếng Việt có dấu
//   • Mỗi topic theo đúng 8 bước bên dưới
//   • Ưu tiên tương tác > văn bản tĩnh
//   • Không import bất cứ thứ gì không dùng
//
// =============================================================================

"use client";

// ---------------------------------------------------------------------------
// IMPORTS
// ---------------------------------------------------------------------------
// Chỉ import những primitive bạn thực sự dùng. Xóa phần còn lại.

// Khám phá (Discovery) — kích hoạt tò mò trước khi giải thích
import {
  PredictionGate, // Câu hỏi dự đoán trước khi unlock nội dung
  StepReveal,     // Tiết lộ từng bước, kiểm soát nhịp đọc
  BuildUp,        // Xây dựng khái niệm tích lũy dần
} from "@/components/interactive";

// Thao tác (Manipulation) — học qua tay
import {
  SliderGroup,      // Điều chỉnh nhiều tham số đồng thời
  ToggleCompare,    // So sánh hai trạng thái A/B
  DragDrop,         // Kéo thả phân loại
  Reorderable,      // Sắp xếp lại thứ tự
  MatrixEditor,     // Chỉnh sửa ma trận
  CanvasPlayground, // Vẽ tự do / sandbox
} from "@/components/interactive";

// Đánh giá (Assessment) — kiểm tra hiểu biết trong luồng
import {
  InlineChallenge, // Câu hỏi nhỏ ngay giữa bài, không điểm số
  MatchPairs,      // Nối cặp khái niệm - định nghĩa
  SortChallenge,   // Sắp xếp theo thứ tự đúng
  FillBlank,       // Điền vào chỗ trống
} from "@/components/interactive";

// Phản hồi (Feedback) — ghi nhớ và củng cố
import {
  AhaMoment,       // Khoảnh khắc "à ra thế!" — insight chính của bài
  ProgressSteps,   // Tiến trình có bước rõ ràng
  Callout,         // Ghi chú tip / warning / insight / info
  MiniSummary,     // Tóm tắt điểm chốt cuối section
} from "@/components/interactive";

// Bố cục (Layout) — tổ chức nội dung phức tạp
import {
  SplitView,          // Chia đôi: code bên trái, kết quả bên phải
  TabView,            // Nhiều tab, ví dụ "Python / JavaScript / Pseudocode"
  CollapsibleDetail,  // Chi tiết có thể thu gọn (không làm rối giao diện)
  CodeBlock,          // Code có syntax highlight và nút copy
} from "@/components/interactive";

// Section components từ topic/ — khung bố cục chung
import AnalogyCard from "@/components/topic/AnalogyCard";           // Ví dụ thực tế / ẩn dụ
import VisualizationSection from "@/components/topic/VisualizationSection"; // Hình minh họa tương tác
import ExplanationSection from "@/components/topic/ExplanationSection";     // Giải thích lý thuyết
import QuizSection from "@/components/topic/QuizSection";

// Types
import type { TopicMeta } from "@/lib/types";

// ---------------------------------------------------------------------------
// METADATA — Mọi field đều bắt buộc (trừ icon)
// ---------------------------------------------------------------------------

export const metadata: TopicMeta = {
  // URL slug — chỉ dùng chữ thường, dấu gạch ngang, khớp tên file
  // Ví dụ: "backpropagation", "attention-mechanism", "k-means"
  slug: "xyz-khai-niem",

  // Tên tiếng Anh — dùng cho SEO và tiêu đề trang
  title: "XYZ Concept",

  // Tên tiếng Việt — hiển thị trong UI
  titleVi: "Khái Niệm XYZ",

  // Mô tả 1-2 câu bằng tiếng Việt, bắt đầu bằng danh từ/động từ (không "Đây là")
  // Hiển thị trong thẻ topic và kết quả tìm kiếm
  description:
    "Khái niệm XYZ giải thích cách [làm gì đó] bằng [cơ chế nào đó], giúp [lợi ích cụ thể].",

  // Category slug — phải khớp với một trong các category trong data/categories.ts
  // Các giá trị phổ biến: "neural-fundamentals", "nlp", "computer-vision",
  // "rl", "generative", "ml-fundamentals", "mlops", "ai-applications"
  category: "ml-fundamentals",

  // Tags — tối đa 5, chữ thường, dấu gạch ngang, dùng để lọc và liên kết
  tags: ["fundamentals", "xyz-tag", "another-tag"],

  // Độ khó: "beginner" | "intermediate" | "advanced"
  difficulty: "beginner",

  // Các slug liên quan — hiển thị ở cuối trang dưới dạng "Xem thêm"
  // Dùng slug thật, không phải titleVi
  relatedSlugs: ["related-topic-one", "related-topic-two", "related-topic-three"],

  // Loại hình minh họa chính của topic
  // "interactive" — có tương tác người dùng (slider, drag-drop, canvas…)
  // "static"      — chỉ hình ảnh / SVG tĩnh
  vizType: "interactive",

  // Tùy chọn: emoji icon hiển thị bên cạnh tiêu đề trong sidebar
  // icon: "🧩",
};

// ---------------------------------------------------------------------------
// DEFAULT EXPORT — Component chính của topic
// ---------------------------------------------------------------------------
//
// 8 BƯỚC CỦA MỘT BÀI HỌC TỐT:
//   1. Hook / Dự đoán   → PredictionGate kích hoạt tò mò
//   2. Ẩn dụ thực tế    → AnalogyCard kết nối khái niệm với cuộc sống
//   3. Trực quan hóa    → VisualizationSection tương tác
//   4. Khoảnh khắc aha  → AhaMoment đóng đinh insight cốt lõi
//   5. Thách thức nhỏ   → InlineChallenge kiểm tra ngay trong luồng
//   6. Giải thích sâu   → ExplanationSection lý thuyết đầy đủ
//   7. Tóm tắt          → MiniSummary điểm chốt để nhớ
//   8. Kiểm tra         → QuizSection đánh giá cuối bài
//
// ---------------------------------------------------------------------------

export default function XyzKhaiNiemTopic() {
  // Khai báo state nếu cần cho VisualizationSection tương tác
  // const [someValue, setSomeValue] = useState(0);

  return (
    <>
      {/* ===================================================================
          BƯỚC 1 — HOOK / DỰ ĐOÁN
          Mục đích: Kích hoạt tò mò ngay từ đầu. Người học phải commit
          vào một câu trả lời trước khi bài học bắt đầu — điều này tăng
          engagement và tạo "cognitive dissonance" nếu họ sai.

          Primitive: PredictionGate
            • question: câu hỏi trắc nghiệm dạng dự đoán (không phải kiểm tra)
            • options:  2-4 lựa chọn, ít nhất 1 lựa chọn nghe "hợp lý nhưng sai"
            • correct:  index của đáp án đúng (0-based)
            • explanation: giải thích ngắn sau khi chọn (~1-2 câu)
            • children: nội dung hiện ra SAU KHI người học đã chọn
              (thường là AnalogyCard hoặc đoạn văn mở đầu)

          Lưu ý: Không dùng PredictionGate cho câu hỏi quá dễ hoặc quá khó.
          Mục tiêu là tạo ra một "dự đoán" khả thi, không phải kiểm tra kiến thức.
          ================================================================= */}

      <PredictionGate
        question="Theo bạn, khi [mô tả tình huống liên quan đến Khái Niệm XYZ], điều gì sẽ xảy ra?"
        options={[
          // Gợi ý: đặt 1 đáp án đúng, 2-3 đáp án sai nhưng nghe hợp lý
          "Kết quả A — sai nhưng trực giác",
          "Kết quả B — đúng",
          "Kết quả C — sai theo hướng khác",
        ]}
        correct={1} // index của "Kết quả B"
        explanation="Kết quả B xảy ra vì [lý do cốt lõi của XYZ]. Điều này nghe có vẻ ngược trực giác, nhưng bài học hôm nay sẽ giải thích tại sao."
      >
        {/* Nội dung này chỉ hiện sau khi người học đã chọn đáp án */}
        <p className="text-sm text-muted mt-2">
          Hãy tiếp tục để khám phá tại sao Khái Niệm XYZ hoạt động theo cách đó.
        </p>
      </PredictionGate>

      {/* ===================================================================
          BƯỚC 2 — ẨN DỤ THỰC TẾ
          Mục đích: Kết nối khái niệm trừu tượng với thứ gì đó quen thuộc.
          Não người học theo mô hình nối kết — không có móc treo thì kiến thức
          sẽ rơi ra. Ẩn dụ là cái móc treo đó.

          Primitive: AnalogyCard
            • Chứa JSX thuần túy (paragraphs, strong, em)
            • Thường 2-4 đoạn văn ngắn
            • Kết thúc bằng câu chuyển tiếp sang visualization

          Tone: Gần gũi, dùng "bạn", dùng ẩn dụ từ đời thường Việt Nam
          (chợ, bếp, giao thông, thể thao…)
          ================================================================= */}

      <AnalogyCard>
        <p>
          Hãy tưởng tượng Khái Niệm XYZ giống như{" "}
          <strong>[ẩn dụ quen thuộc]</strong>. Khi bạn [hành động A], thì
          [hệ quả B] xảy ra — tương tự như khi [ẩn dụ] [làm gì đó].
        </p>
        <p>
          Điểm mấu chốt là <strong>[thuộc tính quan trọng]</strong>: [giải
          thích ngắn tại sao thuộc tính đó quan trọng trong bối cảnh ẩn dụ].
          Trong AI/ML, điều này có nghĩa là [kết nối ẩn dụ với kỹ thuật thực].
        </p>
        <p>
          Nếu không có XYZ, [điều gì sẽ xảy ra] — giống như [ẩn dụ hậu quả].
          Đó chính là lý do tại sao [tên kỹ thuật] cần Khái Niệm XYZ.
        </p>
      </AnalogyCard>

      {/* ===================================================================
          BƯỚC 3 — TRỰC QUAN HÓA TƯƠNG TÁC
          Mục đích: Cho người học TỰ KHÁM PHÁ thay vì chỉ đọc. Visualization
          tốt giúp build intuition mà lời văn không thể truyền đạt được.

          Primitive: VisualizationSection (wrapper)
          + Bên trong: SliderGroup, ToggleCompare, CanvasPlayground, hoặc
            custom SVG/Canvas với useState điều khiển

          Quy tắc:
            • Luôn có ít nhất 1 điều khiển (slider, button, toggle)
            • Label mọi trục và giá trị bằng tiếng Việt
            • Hiển thị kết quả numeric (vd: "Độ chính xác: 87.3%")
            • Không cần đẹp hoàn hảo — cần đúng và hoạt động được

          Ví dụ minh họa dưới đây dùng placeholder SVG.
          Thay bằng visualization thật khi implement.
          ================================================================= */}

      <VisualizationSection>
        {/*
          TODO: Thay placeholder này bằng visualization thật.
          Các lựa chọn phổ biến:
            a) SliderGroup — điều chỉnh tham số, cập nhật SVG/text ngay lập tức
            b) ToggleCompare — so sánh "trước XYZ" vs "sau XYZ"
            c) Custom SVG với useState — vẽ đồ thị, sơ đồ tương tác
            d) CanvasPlayground — vẽ tự do và quan sát output

          Ví dụ với SliderGroup:
          <SliderGroup
            sliders={[
              { label: "Tham số α", min: 0, max: 1, step: 0.01, defaultValue: 0.5 },
              { label: "Số bước lặp", min: 1, max: 100, step: 1, defaultValue: 10 },
            ]}
            onChange={(values) => {
              // values = { "Tham số α": 0.5, "Số bước lặp": 10 }
              // Cập nhật state để re-render visualization
            }}
          />
        */}
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="w-full max-w-md rounded-lg border border-dashed border-border bg-surface/50 py-12 text-center">
            <p className="text-sm text-muted">
              [ Visualization placeholder — thay bằng SVG/Canvas tương tác ]
            </p>
            <p className="mt-2 text-xs text-muted/60">
              Gợi ý: dùng SliderGroup để điều chỉnh tham số và xem kết quả thay đổi
            </p>
          </div>
          <Callout variant="tip" title="Thử nghiệm">
            Thay đổi các tham số và quan sát [thuộc tính gì thay đổi].
            Bạn có nhận thấy [pattern thú vị] không?
          </Callout>
        </div>
      </VisualizationSection>

      {/* ===================================================================
          BƯỚC 4 — KHOẢNH KHẮC AHA
          Mục đích: Đóng đinh insight CỐT LÕI nhất của toàn bài vào não người
          học. AhaMoment nên là câu trả lời cho "Vậy điểm mấu chốt là gì?"

          Primitive: AhaMoment
            • children: 1-2 câu insight ngắn gọn, memorable
            • Thường là một phát biểu mang tính "nguyên tắc" hoặc "quy luật"
            • Dùng bold/emphasis để highlight từ khóa

          Quy tắc: Chỉ có DUY NHẤT MỘT AhaMoment mỗi topic.
          Nếu bạn có nhiều insight, chỉ giữ cái quan trọng nhất ở đây;
          dùng Callout variant="insight" cho các cái còn lại.
          ================================================================= */}

      <AhaMoment>
        <strong>Khái Niệm XYZ</strong> không chỉ là [mô tả bề mặt] — thực ra
        đây là cách [mô hình / thuật toán] <strong>[làm điều gì đó sâu xa hơn]</strong>.
        Hiểu điều này giúp bạn giải thích tại sao [hệ quả quan trọng trong thực tế].
      </AhaMoment>

      {/* ===================================================================
          BƯỚC 5 — THÁCH THỨC NHỎ
          Mục đích: Kiểm tra ngay lập tức sau insight để consolidate memory.
          Không phải để chấm điểm mà để "flush" bộ nhớ làm việc và tạo
          retrieval practice — một trong những kỹ thuật học hiệu quả nhất.

          Primitive: InlineChallenge
            • Khác PredictionGate: người học đã có đủ thông tin để trả lời
            • question: câu hỏi áp dụng, không phải thuần lý thuyết
            • correct: index đúng
            • explanation: mở rộng thêm, không chỉ xác nhận đúng/sai

          Các lựa chọn thay thế nếu phù hợp hơn:
            • FillBlank — điền vào công thức / đoạn code
            • MatchPairs — nối khái niệm với ví dụ
            • SortChallenge — sắp xếp các bước của quy trình
          ================================================================= */}

      <InlineChallenge
        question="Trong tình huống [cụ thể], bạn sẽ áp dụng Khái Niệm XYZ như thế nào?"
        options={[
          "Cách A — nghe đúng nhưng bỏ qua [điều quan trọng]",
          "Cách B — đúng, áp dụng đúng nguyên tắc XYZ",
          "Cách C — đúng về hướng nhưng thiếu [chi tiết quan trọng]",
          "Cách D — sai hoàn toàn, lẫn lộn với [khái niệm khác]",
        ]}
        correct={1}
        explanation="Cách B đúng vì [giải thích cụ thể tại sao, liên kết lại với AhaMoment ở trên]. Cách A sai vì [lý do]. Cách C gần đúng nhưng [tại sao vẫn chưa đủ]."
      />

      {/* ===================================================================
          BƯỚC 6 — GIẢI THÍCH SÂU
          Mục đích: Cung cấp lý thuyết đầy đủ, chính xác. Đến đây người học
          đã có intuition (từ bước 2-4), nên họ sẵn sàng tiếp thu chi tiết kỹ
          thuật hơn.

          Primitive: ExplanationSection (wrapper)
          + Bên trong:
            • <p> — đoạn văn chính
            • <ul>/<ol> — danh sách có cấu trúc
            • <strong>/<em> — nhấn mạnh thuật ngữ kỹ thuật
            • CollapsibleDetail — chi tiết nâng cao (không bắt buộc đọc)
            • CodeBlock — công thức hoặc pseudocode
            • Callout variant="warning" — lưu ý quan trọng / pitfall
            • TabView — nếu có nhiều variant / ngôn ngữ lập trình

          Quy tắc:
            • Định nghĩa chính thức ở đoạn đầu tiên
            • Đừng giải thích lại những gì đã nói trong AnalogyCard
            • Kết thúc bằng "trong thực tế" hoặc "khi nào dùng"
          ================================================================= */}

      <ExplanationSection>
        <p>
          <strong>Khái Niệm XYZ</strong> là [định nghĩa chính thức, súc tích].
          Về mặt toán học, nó được biểu diễn như sau: [công thức hoặc mô tả
          bằng lời nếu không có công thức].
        </p>

        <p>Có [N] thành phần chính cần nắm vững:</p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>
            <strong>Thành phần 1:</strong> [Mô tả + tại sao quan trọng]
          </li>
          <li>
            <strong>Thành phần 2:</strong> [Mô tả + khi nào nó ảnh hưởng]
          </li>
          <li>
            <strong>Thành phần 3:</strong> [Mô tả + ví dụ cụ thể]
          </li>
        </ul>

        {/* CodeBlock — dùng khi muốn minh họa bằng code / pseudocode */}
        <CodeBlock language="python" title="Ví dụ Python">
          {`# Minh họa Khái Niệm XYZ
def xyz_example(input_data):
    # Bước 1: [mô tả]
    result = some_operation(input_data)
    # Bước 2: [mô tả]
    return result`}
        </CodeBlock>

        {/* Callout — dùng cho lưu ý quan trọng, pitfall phổ biến */}
        <Callout variant="warning" title="Lưu ý quan trọng">
          Sai lầm phổ biến nhất khi dùng XYZ là [mô tả lỗi]. Điều này xảy ra
          khi [điều kiện]. Để tránh, hãy [giải pháp đơn giản].
        </Callout>

        {/* CollapsibleDetail — chi tiết nâng cao, không bắt buộc */}
        <CollapsibleDetail title="Chứng minh toán học (nâng cao)">
          <p>
            Với những bạn muốn hiểu sâu hơn, đây là chứng minh tại sao XYZ
            hoạt động: [nội dung nâng cao, người mới có thể bỏ qua].
          </p>
        </CollapsibleDetail>

        <p>
          <strong>Trong thực tế</strong>, Khái Niệm XYZ được dùng khi [điều kiện
          cụ thể]. Ví dụ điển hình bao gồm: [ví dụ 1], [ví dụ 2]. Không nên
          dùng khi [điều kiện ngược lại].
        </p>
      </ExplanationSection>

      {/* ===================================================================
          BƯỚC 7 — TÓM TẮT
          Mục đích: Củng cố bộ nhớ dài hạn bằng cách buộc não "retrieval" lại
          những điểm chính. MiniSummary là checklist nhỏ gọn dễ scan lại sau.

          Primitive: MiniSummary
            • title: tiêu đề, mặc định là "Tóm tắt"
            • points: mảng string — mỗi điểm là 1 câu ngắn gọn, actionable

          Quy tắc: 3-5 điểm. Không lặp lại từng chữ từ ExplanationSection —
          hãy paraphrase để buộc não "encode" lại. Bắt đầu mỗi điểm bằng
          động từ hoặc danh từ chủ đề.
          ================================================================= */}

      <MiniSummary
        title="Những điều cần nhớ về Khái Niệm XYZ"
        points={[
          "XYZ là [định nghĩa cực ngắn] — dùng khi cần [trường hợp sử dụng].",
          "[Thành phần/thuộc tính quan trọng nhất] quyết định [kết quả/hành vi].",
          "Sai lầm phổ biến: [mô tả lỗi] — tránh bằng cách [giải pháp].",
          "Phân biệt XYZ với [khái niệm hay bị nhầm]: [điểm khác biệt then chốt].",
          // Thêm điểm thứ 5 nếu topic phức tạp, bỏ nếu không cần:
          // "Ứng dụng thực tế: [tên framework/thư viện] dùng XYZ để [làm gì].",
        ]}
      />

      {/* ===================================================================
          BƯỚC 8 — KIỂM TRA CUỐI BÀI
          Mục đích: Đánh giá toàn diện sau khi học xong. Khác InlineChallenge,
          QuizSection có điểm số và màn hình kết quả, phù hợp để kết thúc bài.

          Component: QuizSection
            • questions: mảng QuizQuestion[]
              - question: câu hỏi đầy đủ
              - options: 4 lựa chọn (nên có đúng 4)
              - correct: index đúng (0-based)
              - explanation: giải thích sau khi trả lời (tùy chọn nhưng khuyến khích)

          Quy tắc:
            • Tối thiểu 3 câu, tối đa 6 câu
            • Phân bổ: 1 câu khái niệm cơ bản, 1-2 câu áp dụng, 1 câu nâng cao
            • Câu hỏi phải cover các angle KHÁC NHAU của topic
            • Không hỏi lại y chang những gì đã hỏi trong InlineChallenge
          ================================================================= */}

      <QuizSection
        questions={[
          // Câu 1 — Khái niệm cơ bản (kiểm tra định nghĩa / mục đích)
          {
            question:
              "Khái Niệm XYZ được định nghĩa chính xác nhất là gì?",
            options: [
              "[Định nghĩa sai — lẫn lộn với khái niệm khác]",
              "[Định nghĩa đúng — súc tích và đầy đủ]",
              "[Định nghĩa đúng một phần — thiếu điều kiện quan trọng]",
              "[Định nghĩa sai — mô tả hệ quả thay vì bản chất]",
            ],
            correct: 1,
            explanation:
              "XYZ được định nghĩa là [lặp lại định nghĩa], không phải [lý do tại sao các đáp án kia sai].",
          },

          // Câu 2 — Áp dụng thực tế (kiểm tra khi nào dùng / không dùng)
          {
            question:
              "Trong tình huống nào SAU ĐÂY thì Khái Niệm XYZ là lựa chọn phù hợp nhất?",
            options: [
              "[Tình huống A — không phù hợp, cần giải thích tại sao]",
              "[Tình huống B — phù hợp vì XYZ giải quyết được vấn đề cụ thể]",
              "[Tình huống C — gần đúng nhưng có cách tốt hơn]",
              "[Tình huống D — sai hoàn toàn]",
            ],
            correct: 1,
            explanation:
              "Tình huống B phù hợp nhất vì [liên kết với use case đã nói trong ExplanationSection]. Tình huống A không cần XYZ vì [lý do cụ thể].",
          },

          // Câu 3 — Nâng cao (kiểm tra hiểu sâu / edge case)
          // Bỏ câu này nếu topic là beginner và đã đủ 2 câu trên
          {
            question:
              "[Câu hỏi nâng cao về XYZ, ví dụ: 'Điều gì xảy ra khi [edge case]?']",
            options: [
              "[Kết quả A]",
              "[Kết quả B]",
              "[Kết quả C — đúng]",
              "[Kết quả D]",
            ],
            correct: 2,
            explanation:
              "C đúng vì khi [edge case], [giải thích cơ chế sâu]. Đây là điểm thường bị bỏ qua khi mới học XYZ.",
          },
        ]}
      />
    </>
  );
}
