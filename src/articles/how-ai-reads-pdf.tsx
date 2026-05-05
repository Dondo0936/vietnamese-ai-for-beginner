import {
  ArticleShell,
  ArticleSection,
  ArticleProse,
  ArticleViz,
  ArticleCompare,
  Term,
} from "@/components/article";
import { articleMap } from "./registry";

const meta = articleMap["how-ai-reads-pdf"]!;

/**
 * Beginner-audience explainer. Why PDFs are uniquely hard for AI to
 * read (Adobe designed PDF as a print description language, not a
 * structured document), and the two strategies products use in 2026:
 * vision-first (multimodal LLM sees the page like a human) versus
 * parse-first (Marker / Mistral OCR / LlamaParse extract Markdown
 * before the LLM ever sees the document). Hybrid wins. Voice follows
 * writing-vietnamese-technical: scene-first body progression, no
 * em-dash, English technical terms inline.
 */
export default function HowAIReadsPDFArticle() {
  return (
    <ArticleShell meta={meta} heroViz={<PDFCurtainHeroViz />}>
      <ArticleSection eyebrow="01 · Bối cảnh">
        <ArticleProse>
          <p>
            Bạn mở Claude hoặc ChatGPT, kéo thả một file PDF dài 50
            trang báo cáo tài chính, gõ một câu hỏi: &ldquo;Doanh thu
            Q3 năm ngoái là bao nhiêu?&rdquo;. Bốn giây sau, AI trả
            ra đúng con số 245 tỷ đồng, kèm trang nguồn 17. Bạn không
            mở file lần nào. AI đã đọc thay bạn.
          </p>
          <p>
            Cảm giác đầu tiên là mọi thứ trơn tru. Tuy nhiên, bên
            trong cái khoảnh khắc bốn giây đó là một quy trình khá
            cồng kềnh, và quy trình đó năm 2026 vẫn đang là chỗ các
            công ty AI cạnh tranh dữ dội. Cùng một file PDF, cùng
            một câu hỏi, mỗi sản phẩm cho ra cost và accuracy khác
            hẳn nhau. Bài viết này giải thích vì sao đọc PDF lại là
            việc khó với AI, và hai chiến lược chính các sản phẩm
            đang dùng để giải nó.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="02 · Vì sao PDF khó"
        heading="PDF được thiết kế cho máy in, không cho máy đọc"
      >
        <ArticleProse>
          <p>
            Adobe phát hành PDF lần đầu năm 1993. Mục tiêu thiết kế
            khi đó rất rõ: cùng một file, in ở Hà Nội và in ở
            Tokyo phải ra hai bản giấy giống hệt nhau. Để đạt mục
            tiêu in chính xác, PDF chọn cách mô tả trang theo toạ
            độ. Bên trong file PDF không có khái niệm{" "}
            <b>đoạn văn</b>, <b>tiêu đề</b>, hay <b>bảng</b>. Chỉ có
            một chuỗi lệnh kiểu &ldquo;vẽ chữ D tại toạ độ
            (72.0, 540.5) bằng font Times-Roman 11pt&rdquo;.
          </p>
          <p>
            Ví dụ câu &ldquo;Doanh thu Q3 đạt 245 tỷ đồng&rdquo;
            trong PDF không phải một string đơn giản. Nó là 25 lệnh
            <b> Tj</b> riêng lẻ, mỗi lệnh vẽ đúng một glyph tại đúng
            một toạ độ. Một bảng tài chính cũng vậy. Không có lệnh
            nào trong file đánh dấu &ldquo;đây là một cell&rdquo;,
            &ldquo;đây là một row&rdquo;. Chỉ có những con số nằm
            cách đều nhau trên trang. Mắt người nhìn vào nhận ra
            ngay đó là bảng. Máy đọc file thô chỉ thấy một đám
            toạ độ.
          </p>
          <p>
            Đây là điểm khiến PDF khác hẳn HTML hay Word. HTML có
            thẻ <code>&lt;table&gt;</code>, <code>&lt;p&gt;</code>,{" "}
            <code>&lt;h1&gt;</code>. Word có style structure rõ
            ràng. PDF thì không. Mọi cấu trúc người đọc cảm nhận
            được đều phải <b>tự tái dựng</b> từ toạ độ và font, sau
            khi file đã được sinh ra. Đây mới là phần khó. Một câu
            hỏi đơn giản như &ldquo;đoạn này thuộc cell nào của
            bảng nào?&rdquo; không có sẵn câu trả lời trong file,
            phải đoán.
          </p>
        </ArticleProse>
        <PdfRawCoordsViz />
      </ArticleSection>

      <ArticleSection
        eyebrow="03 · Cách thứ nhất"
        heading="Đọc bằng mắt. Đưa hẳn trang cho multimodal model."
      >
        <ArticleProse>
          <p>
            Cách giải đơn giản nhất là bỏ qua việc tái dựng cấu
            trúc. Mỗi trang PDF được render thành một bức ảnh độ
            phân giải khoảng 1568 × 2048 pixel, rồi nhét thẳng cho
            một <Term slug="multimodal">multimodal model</Term> như
            Claude Opus 4.7, GPT-5 Vision hoặc Gemini 2.5 Pro. Model
            nhìn ảnh đúng cách một con người nhìn: thấy tiêu đề ở
            đầu trang, thấy bảng có viền, thấy footnote ở chân trang,
            thấy biểu đồ.
          </p>
          <p>
            Hiện tượng &ldquo;upload PDF rồi hỏi&rdquo; trong Claude
            và ChatGPT mặc định chạy bằng cách này. Bạn không cần
            cài đặt gì, model thấy trang như bạn đang thấy. Mạnh
            nhất khi PDF có nhiều thứ ngoài chữ: bảng có border vẽ
            thẳng, công thức toán, biểu đồ tài chính, sơ đồ kỹ
            thuật, scan tay. Vision model nhìn cái nào thì hiểu cái
            đó, không cần biết bên dưới có Tj hay không.
          </p>
          <p>
            Điểm yếu duy nhất là <b>cost</b>. Một trang ở độ phân
            giải đó tốn khoảng 3.000 token chỉ để đại diện ảnh,
            chưa kể prompt và output. Một báo cáo 50 trang tốn
            150.000 token cho ảnh, gần chạm context window của các
            model hạng trung. Một sách 300 trang thì chạy không
            nổi: ngốn cả triệu token, đắt và chậm. Đây là chỗ chiến
            lược thứ hai vào cuộc.
          </p>
        </ArticleProse>
        <VisionPipelineViz />
      </ArticleSection>

      <ArticleSection
        eyebrow="04 · Cách thứ hai"
        heading="Bóc tách trước. Xuất Markdown sạch rồi mới đưa cho LLM."
      >
        <ArticleProse>
          <p>
            Cách thứ hai đặt một bước trung gian giữa file PDF và
            LLM. Bước trung gian là một công cụ chuyên dụng làm
            duy nhất một việc: tái dựng lại cấu trúc của trang.
            Đầu ra của nó là một file Markdown sạch (hoặc JSON có
            schema), với heading, paragraph, table, footnote đều
            được tag đúng. Sau khi có file Markdown, bạn đưa nó cho
            bất kỳ LLM nào, không cần multimodal.
          </p>
          <p>
            Các công cụ phổ biến năm 2026 gồm <b>Marker</b> (mã mở,
            mạnh nhất ở paper khoa học), <b>Mistral OCR</b> (free
            tier rộng tay, OCR đa ngôn ngữ tốt), <b>LlamaParse</b>{" "}
            (của LlamaIndex, trả phí, mạnh ở bảng phức tạp),{" "}
            <b>Unstructured.io</b> (enterprise, nhiều format),{" "}
            <b>Docling</b> (IBM, chuyên doc kỹ thuật).
          </p>
          <p>
            Bên trong, các công cụ này cùng dùng ba lớp phân tích.
            Lớp một là <b>text extraction</b>: đọc thẳng object
            stream của PDF, gom các Tj liền nhau thành chuỗi. Lớp
            hai là <b>OCR</b> bằng một mô hình thị giác chạy local,
            chỉ dùng cho trang scan không có text layer. Lớp ba là{" "}
            <b>layout analysis</b>: nhìn pattern toạ độ, font, kích
            thước, để đoán chỗ nào là heading, chỗ nào là paragraph,
            chỗ nào là cell của bảng.
          </p>
          <p>
            Một trang sau khi qua parser tốn khoảng 500 token cho
            LLM. Rẻ hơn vision sáu lần. Một báo cáo 50 trang chỉ
            tốn 25.000 token, nằm gọn trong context của LLM rẻ
            tiền. Một sách 300 trang vẫn chạy được. Đây là cách
            NotebookLM xử lý nguồn lớn, ChatPDF xử lý PDF doanh
            nghiệp, và phần lớn pipeline <Term slug="rag">RAG</Term>{" "}
            chạy bằng.
          </p>
          <p>
            Điểm yếu của parser nằm ở những trang khó: bảng có cell
            merge, header lồng hai tầng, công thức toán, layout 2
            cột báo. Parser hay nhập nhằng, đọc bảng thiếu cột,
            công thức bị lượm về dạng plain text mất ý nghĩa, hoặc
            flatten 2 cột thành một cột rối tung.
          </p>
        </ArticleProse>
        <ParserPipelineViz />
      </ArticleSection>

      <ArticleSection
        eyebrow="05 · Đánh đổi"
        heading="Cùng một báo cáo 50 trang. Hai cách. Cost lệch nhau 6 lần."
      >
        <ArticleCompare
          before={{
            label: "Vision · multimodal model nhìn ảnh từng trang",
            value: "1.50 đô · 200 giây",
            note: "Accuracy bảng 95%, formula 92%, scan tay 90%. Đắt và chậm với báo cáo dài.",
          }}
          after={{
            label: "Parser · Marker bóc tách Markdown trước",
            value: "0.25 đô · 15 giây",
            note: "Accuracy bảng 78%, formula 60% (mất LaTeX). Có thể hỏng vài bảng phức tạp.",
          }}
        />
        <ArticleProse>
          <p>
            Hai con số phía trên là chi phí cho cùng một báo cáo
            tài chính 50 trang, có chữ thường, vài bảng cell ghép,
            không có công thức. Vision đắt gần sáu lần parser nhưng
            đảm bảo đọc đúng từng bảng. Parser rẻ và nhanh nhưng
            có thể vấp ở 2 đến 4 bảng phức tạp, đếm thiếu cột hoặc
            lẫn dòng.
          </p>
          <p>
            Quy tắc thực dụng năm 2026: PDF thuần văn bản (hợp
            đồng, sách, báo cáo dài chỉ có chữ) thì parser luôn
            thắng. PDF nhiều ảnh, nhiều bảng cell ghép, scan
            tay thì vision thắng. PDF khoa học có công thức và
            figure thì hai bên huề, lúc đó cần một chiến lược
            chung. Phần kế tiếp nói về chiến lược đó.
          </p>
        </ArticleProse>
        <CostAccuracyViz />
      </ArticleSection>

      <ArticleSection
        eyebrow="06 · Hướng đi"
        heading="Sản phẩm tốt năm 2026 dùng cả hai. Hybrid thắng."
      >
        <ArticleProse>
          <p>
            Cách phổ biến nhất hiện nay không phải chọn một bên,
            mà là kết hợp. Logic thường thấy: chạy parser trên
            mọi trang trước. Trên mỗi trang, parser tự ước lượng
            độ tự tin của nó qua một số signal: trang có border
            bảng phức tạp, trang có ký hiệu toán, trang có ảnh
            bitmap lớn. Khi confidence thấp dưới ngưỡng, hệ thống
            <b> fallback</b> sang vision cho riêng trang đó. Trang
            còn lại vẫn đi đường rẻ.
          </p>
          <p>
            Kết quả: parser-cost trên khoảng 90% trang, vision-cost
            trên 10% trang khó. Cost giảm sáu đến tám lần so với
            vision thuần, accuracy gần bằng vision thuần. Đây là
            cách Claude xử lý PDF lớn từ Files API, NotebookLM xử
            lý nguồn dài, và pattern Mistral OCR cộng Claude phổ
            biến trong cộng đồng dev.
          </p>
          <p>
            Một bài học thực dụng: lần tới khi bạn upload một PDF
            lớn vào một sản phẩm AI và thấy nó chậm hoặc đắt, có
            khả năng sản phẩm đó đang chạy vision-only. Đó là một
            tín hiệu sản phẩm chưa tối ưu. Sản phẩm tốt sẽ phân
            loại trang trước, gửi đa số trang qua parser, chỉ giữ
            trang khó cho vision. Bạn có thể làm thủ công bước
            đó bằng Marker (mã mở, miễn phí) trên local, rồi paste
            Markdown sang LLM thường, tiết kiệm gần như cả khoản
            tiền vision.
          </p>
          <p>
            PDF không sắp được thay thế. Hợp đồng vẫn ký bằng PDF,
            báo cáo vẫn xuất bằng PDF, thư công vẫn ban hành bằng
            PDF. Tất cả các format mới (Markdown, EPUB, HTML doc)
            đều không lay được vị trí của PDF trong giấy tờ thật.
            Vì thế việc đọc hiểu PDF của AI sẽ còn quan trọng dài
            dài. Hai chiến lược ở trên đang là điểm cạnh tranh thật
            sự, không phải vẻ ngoài. Lần tới khi bạn so hai sản
            phẩm AI đọc tài liệu, hỏi đúng câu này: bên nào dùng
            vision, bên nào dùng parser, bên nào dùng cả hai. Trả
            lời được, bạn đã hiểu phần lõi.
          </p>
        </ArticleProse>
      </ArticleSection>
    </ArticleShell>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Hero viz : split panel. Top half shows the rendered PDF page as
 * a human sees it. Bottom half lifts the curtain: just (x, y)
 * coordinates and glyph operators, no structure. Visual claim:
 * the structure you see is not in the file.
 * ────────────────────────────────────────────────────────────── */
export function PDFCurtainHeroViz() {
  return (
    <svg
      viewBox="0 0 900 360"
      className="ar-viz"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="PDF page rendered above its raw glyph coordinates below"
    >
      <defs>
        <linearGradient id="pdf-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--turquoise-50)" />
          <stop offset="100%" stopColor="var(--bg-card)" />
        </linearGradient>
      </defs>
      <rect width="900" height="360" fill="url(#pdf-bg)" />

      <text
        x="40"
        y="34"
        fontFamily="var(--font-mono)"
        fontSize="11"
        fill="var(--turquoise-ink)"
        letterSpacing="0.1em"
      >
        / PDF · NHÌN BẰNG MẮT VS NHÌN BẰNG MÁY
      </text>

      {/* Rendered page on the left */}
      <g transform="translate(60, 70)">
        <rect
          width="320"
          height="240"
          fill="var(--paper-2)"
          stroke="var(--border)"
          strokeWidth="1"
          rx="6"
        />
        <text
          x="20"
          y="34"
          fontFamily="var(--font-display)"
          fontSize="18"
          fontWeight="700"
          fill="var(--text-primary)"
        >
          Báo cáo Q3
        </text>
        <line
          x1="20"
          y1="46"
          x2="240"
          y2="46"
          stroke="var(--turquoise-500)"
          strokeWidth="2"
        />
        <text
          x="20"
          y="74"
          fontFamily="var(--font-sans)"
          fontSize="11"
          fill="var(--text-secondary)"
        >
          Doanh thu quý ba đạt 245 tỷ đồng,
        </text>
        <text
          x="20"
          y="90"
          fontFamily="var(--font-sans)"
          fontSize="11"
          fill="var(--text-secondary)"
        >
          tăng 12% so với cùng kỳ năm trước.
        </text>

        {/* Mini table */}
        <g transform="translate(20, 120)">
          <rect
            width="280"
            height="92"
            fill="none"
            stroke="var(--border)"
            strokeWidth="1"
          />
          <line
            x1="0"
            y1="22"
            x2="280"
            y2="22"
            stroke="var(--border)"
          />
          <line
            x1="140"
            y1="0"
            x2="140"
            y2="92"
            stroke="var(--border)"
          />
          <text
            x="10"
            y="15"
            fontFamily="var(--font-mono)"
            fontSize="9"
            fontWeight="700"
            fill="var(--text-primary)"
            letterSpacing="0.04em"
          >
            QUÝ
          </text>
          <text
            x="150"
            y="15"
            fontFamily="var(--font-mono)"
            fontSize="9"
            fontWeight="700"
            fill="var(--text-primary)"
            letterSpacing="0.04em"
          >
            DOANH THU
          </text>
          {[
            { q: "Q1", v: "190 tỷ" },
            { q: "Q2", v: "215 tỷ" },
            { q: "Q3", v: "245 tỷ", highlight: true },
          ].map((r, i) => (
            <g key={i} transform={`translate(0, ${30 + i * 22})`}>
              <text
                x="10"
                y="0"
                fontFamily="var(--font-mono)"
                fontSize="10"
                fill={
                  r.highlight ? "var(--clay)" : "var(--text-secondary)"
                }
                fontWeight={r.highlight ? 700 : 400}
              >
                {r.q}
              </text>
              <text
                x="150"
                y="0"
                fontFamily="var(--font-mono)"
                fontSize="10"
                fill={
                  r.highlight ? "var(--clay)" : "var(--text-secondary)"
                }
                fontWeight={r.highlight ? 700 : 400}
              >
                {r.v}
              </text>
            </g>
          ))}
        </g>

        <text
          x="160"
          y="234"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="10"
          fill="var(--text-tertiary)"
          letterSpacing="0.18em"
        >
          NGƯỜI ĐỌC THẤY
        </text>
      </g>

      {/* Arrow + curtain handle */}
      <g transform="translate(420, 190)">
        <line
          x1="0"
          y1="0"
          x2="40"
          y2="0"
          stroke="var(--turquoise-500)"
          strokeWidth="2"
        />
        <polygon
          points="40,0 32,-5 32,5"
          fill="var(--turquoise-500)"
        />
        <text
          x="20"
          y="-12"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="9"
          fill="var(--turquoise-700)"
          letterSpacing="0.16em"
          fontWeight="700"
        >
          MỞ FILE
        </text>
      </g>

      {/* Raw glyph stream on the right */}
      <g transform="translate(485, 70)">
        <rect
          width="370"
          height="240"
          fill="var(--bg-card)"
          stroke="var(--border)"
          strokeWidth="1"
          rx="6"
        />

        {/* Scattered glyphs at coordinates */}
        {[
          { ch: "B", x: 22, y: 34, fs: 14 },
          { ch: "á", x: 32, y: 34, fs: 14 },
          { ch: "o", x: 40, y: 34, fs: 14 },
          { ch: " ", x: 48, y: 34, fs: 14 },
          { ch: "c", x: 56, y: 34, fs: 14 },
          { ch: "á", x: 64, y: 34, fs: 14 },
          { ch: "o", x: 72, y: 34, fs: 14 },
          { ch: "D", x: 22, y: 70, fs: 9 },
          { ch: "o", x: 30, y: 70, fs: 9 },
          { ch: "a", x: 36, y: 70, fs: 9 },
          { ch: "n", x: 42, y: 70, fs: 9 },
          { ch: "h", x: 48, y: 70, fs: 9 },
          { ch: " ", x: 54, y: 70, fs: 9 },
          { ch: "t", x: 58, y: 70, fs: 9 },
          { ch: "h", x: 62, y: 70, fs: 9 },
          { ch: "u", x: 68, y: 70, fs: 9 },
          { ch: "Q", x: 22, y: 130, fs: 9 },
          { ch: "1", x: 30, y: 130, fs: 9 },
          { ch: "1", x: 100, y: 130, fs: 9 },
          { ch: "9", x: 108, y: 130, fs: 9 },
          { ch: "0", x: 116, y: 130, fs: 9 },
          { ch: "Q", x: 22, y: 152, fs: 9 },
          { ch: "2", x: 30, y: 152, fs: 9 },
          { ch: "2", x: 100, y: 152, fs: 9 },
          { ch: "1", x: 108, y: 152, fs: 9 },
          { ch: "5", x: 116, y: 152, fs: 9 },
          { ch: "Q", x: 22, y: 174, fs: 9 },
          { ch: "3", x: 30, y: 174, fs: 9, hi: true },
          { ch: "2", x: 100, y: 174, fs: 9, hi: true },
          { ch: "4", x: 108, y: 174, fs: 9, hi: true },
          { ch: "5", x: 116, y: 174, fs: 9, hi: true },
        ].map((g, i) => (
          <text
            key={i}
            x={g.x}
            y={g.y}
            fontFamily="var(--font-mono)"
            fontSize={g.fs}
            fill={g.hi ? "var(--clay)" : "var(--text-tertiary)"}
            opacity={g.hi ? 1 : 0.85}
            fontWeight={g.hi ? 700 : 400}
          >
            {g.ch}
          </text>
        ))}

        {/* Coordinate annotations */}
        {[
          { x: 195, y: 70, t: "Tj (22, 740) 'D'" },
          { x: 195, y: 130, t: "Tj (22, 612) 'Q'" },
          { x: 195, y: 152, t: "Tj (100, 590) '215'" },
          { x: 195, y: 174, t: "Tj (100, 568) '245'", hi: true },
        ].map((a, i) => (
          <text
            key={`a-${i}`}
            x={a.x}
            y={a.y}
            fontFamily="var(--font-mono)"
            fontSize="9"
            fill={a.hi ? "var(--clay)" : "var(--ash)"}
            fontWeight={a.hi ? 700 : 400}
            letterSpacing="0.02em"
          >
            {a.t}
          </text>
        ))}

        <text
          x="185"
          y="234"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="10"
          fill="var(--text-tertiary)"
          letterSpacing="0.18em"
        >
          MÁY THẤY · TỌA ĐỘ + GLYPH
        </text>
      </g>

      {/* Caption strip */}
      <line
        x1="40"
        y1="332"
        x2="860"
        y2="332"
        stroke="var(--border)"
        strokeWidth="1"
      />
      <text
        x="40"
        y="350"
        fontFamily="var(--font-mono)"
        fontSize="10"
        fill="var(--text-tertiary)"
        letterSpacing="0.08em"
      >
        TRONG FILE PDF KHÔNG CÓ &ldquo;BẢNG&rdquo;. CHỈ CÓ TỌA ĐỘ.
        AI PHẢI TỰ TÁI DỰNG CẤU TRÚC.
      </text>
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Section 02 viz : One operand stream snippet vs the rendered
 * sentence on the same page. Show that "Doanh thu Q3 245" is
 * really 25 separate Tj instructions in the file.
 * ────────────────────────────────────────────────────────────── */
function PdfRawCoordsViz() {
  return (
    <ArticleViz caption="Một câu trong PDF không phải một string. Bên trái là cách bạn nhìn. Bên phải là cách file ghi: từng glyph một, kèm tọa độ.">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 0,
          background: "var(--paper-2)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderRight: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--turquoise-ink)",
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            Mắt người thấy
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 18,
              color: "var(--text-primary)",
              lineHeight: 1.5,
            }}
          >
            Doanh thu Q3 đạt 245 tỷ đồng.
          </div>
        </div>
        <div
          style={{
            padding: "20px 24px",
            background: "var(--bg-card)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--clay)",
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            File ghi (object stream)
          </div>
          <pre
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--graphite)",
              lineHeight: 1.55,
              margin: 0,
              whiteSpace: "pre-wrap",
            }}
          >
{`BT /F1 11 Tf
72.0 540.5 Td
(D) Tj 78.4 540.5 Td
(o) Tj 84.1 540.5 Td
(a) Tj 89.5 540.5 Td
(n) Tj 95.2 540.5 Td
(h) Tj ...
182.0 540.5 Td
(2) Tj 187.6 540.5 Td
(4) Tj 193.2 540.5 Td
(5) Tj ET`}
          </pre>
        </div>
      </div>
    </ArticleViz>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Section 03 viz : Vision pipeline. PDF page → render to image
 * → multimodal model → answer. Three-step diagram.
 * ────────────────────────────────────────────────────────────── */
function VisionPipelineViz() {
  return (
    <ArticleViz caption="Pipeline vision-first. Trang được render thành ảnh, đẩy thẳng cho multimodal model. Mạnh ở bảng và figure, đắt ở cost trên trang.">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 28px 1fr 28px 1fr",
          alignItems: "stretch",
        }}
      >
        <PipelineCard
          tone="turquoise"
          step="1 · Render"
          title="Trang PDF thành ảnh PNG"
          body="Mỗi trang xuất 1568 × 2048 pixel. Layout, font, bảng, figure giữ nguyên hệt như khi in."
        />
        <PipelineArrow />
        <PipelineCard
          tone="clay"
          step="2 · Multimodal"
          title="Model nhìn ảnh, trả ý"
          body="Claude, GPT-5 Vision, Gemini 2.5 Pro. Khoảng 3.000 token cho mỗi ảnh, chưa kể prompt."
        />
        <PipelineArrow />
        <PipelineCard
          tone="ink"
          step="3 · Trả lời"
          title="Câu trả lời cho người dùng"
          body="Đi kèm reference trang. Vision thấy gì thì hiểu cái đó, không cần biết Tj hay không."
        />
      </div>
    </ArticleViz>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Section 04 viz : Parser pipeline. PDF → (text + OCR + layout)
 * → Markdown → LLM. Five-step but compressed into 3 cards.
 * ────────────────────────────────────────────────────────────── */
function ParserPipelineViz() {
  return (
    <ArticleViz caption="Pipeline parse-first. Một bước trung gian tái dựng cấu trúc, xuất Markdown, rồi đưa cho LLM thường. Rẻ và nhanh, yếu ở bảng phức tạp.">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 28px 1.4fr 28px 1fr",
          alignItems: "stretch",
        }}
      >
        <PipelineCard
          tone="turquoise"
          step="1 · PDF gốc"
          title="File đầu vào"
          body="Có thể có text layer hoặc chỉ có ảnh scan. Parser xử lý cả hai."
        />
        <PipelineArrow />
        <div
          style={{
            padding: "18px 20px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderLeft: "4px solid var(--clay)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--clay)",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            2 · Parser (Marker · Mistral · LlamaParse)
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 16,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 10,
            }}
          >
            Ba lớp phân tích chạy song song
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {[
              { k: "Text extract", v: "Đọc thẳng object stream" },
              { k: "OCR", v: "Mô hình thị giác cho trang scan" },
              { k: "Layout", v: "Đoán heading, paragraph, cell" },
            ].map((r) => (
              <div
                key={r.k}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--text-secondary)",
                }}
              >
                <span style={{ color: "var(--clay)", fontWeight: 700 }}>
                  {r.k}
                </span>
                {" · "}
                {r.v}
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 12,
              padding: "8px 10px",
              background: "var(--paper-2)",
              border: "1px solid var(--border)",
              borderRadius: 4,
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--graphite)",
              lineHeight: 1.4,
            }}
          >
            # Báo cáo Q3{"\n"}
            | Quý | Doanh thu |{"\n"}
            | --- | --------- |{"\n"}
            | Q3 | <b>245 tỷ</b> |
          </div>
        </div>
        <PipelineArrow />
        <PipelineCard
          tone="ink"
          step="3 · LLM thường"
          title="500 token/trang"
          body="Bất kỳ LLM nào cũng đọc được Markdown. Sáu lần rẻ hơn vision."
        />
      </div>
    </ArticleViz>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Section 05 viz : Cost vs accuracy trade-off bars across two
 * strategies. Three rows: cost, table accuracy, formula accuracy.
 * ────────────────────────────────────────────────────────────── */
function CostAccuracyViz() {
  const rows = [
    { label: "Cost / 50 trang", vision: 100, parser: 17, unit: "% (vision = 100%)" },
    { label: "Accuracy bảng", vision: 95, parser: 78, unit: "%" },
    { label: "Accuracy công thức", vision: 92, parser: 60, unit: "%" },
  ];
  return (
    <ArticleViz caption="Ba chiều đánh đổi. Vision đắt hơn rõ nhưng giữ được bảng và công thức tốt hơn. Parser rẻ và nhanh nhưng vấp ở chỗ phức tạp.">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {rows.map((r) => (
          <div key={r.label}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontWeight: 600,
                }}
              >
                {r.label}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--text-tertiary)",
                }}
              >
                Vision {r.vision} · Parser {r.parser}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div
                style={{
                  height: 14,
                  width: "100%",
                  background: "var(--paper-2)",
                  borderRadius: 6,
                  overflow: "hidden",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    width: `${Math.min(r.vision, 100)}%`,
                    height: "100%",
                    background: "var(--clay)",
                    opacity: 0.85,
                  }}
                />
              </div>
              <div
                style={{
                  height: 14,
                  width: "100%",
                  background: "var(--paper-2)",
                  borderRadius: 6,
                  overflow: "hidden",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    width: `${Math.min(r.parser, 100)}%`,
                    height: "100%",
                    background: "var(--turquoise-500)",
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </ArticleViz>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Shared pipeline-card primitive used in sections 03 and 04.
 * ────────────────────────────────────────────────────────────── */
function PipelineCard({
  tone,
  step,
  title,
  body,
}: {
  tone: "turquoise" | "clay" | "ink";
  step: string;
  title: string;
  body: string;
}) {
  const accent =
    tone === "turquoise"
      ? "var(--turquoise-500)"
      : tone === "clay"
      ? "var(--clay)"
      : "var(--text-secondary)";
  const accentText =
    tone === "turquoise"
      ? "var(--turquoise-ink)"
      : tone === "clay"
      ? "var(--clay)"
      : "var(--text-secondary)";
  return (
    <div
      style={{
        padding: "18px 20px",
        background: "var(--paper-2)",
        border: "1px solid var(--border)",
        borderLeft: `4px solid ${accent}`,
        borderRadius: "var(--radius-md)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: accentText,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        {step}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 17,
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: 8,
          lineHeight: 1.25,
        }}
      >
        {title}
      </div>
      <p
        style={{
          fontSize: 13,
          lineHeight: 1.5,
          color: "var(--text-secondary)",
          margin: 0,
        }}
      >
        {body}
      </p>
    </div>
  );
}

function PipelineArrow() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-tertiary)",
        fontSize: 18,
      }}
    >
      →
    </div>
  );
}
