import type { ReactNode } from "react";
import {
  ArticleShell,
  ArticleSection,
  ArticleProse,
  ArticleViz,
  ArticleStat,
  ArticleCompare,
  Term,
} from "@/components/article";
import { articleMap } from "./registry";

const meta = articleMap["speculative-decoding-2026"]!;

/**
 * Explainer article — speculative decoding, trạng thái 2026.
 * Đi từ trải nghiệm "cùng model nhưng nhà cung cấp này nhanh hơn",
 * xuống nút thắt memory bandwidth ở bước decode, rồi tới phép toán
 * accept/reject giữ nguyên phân phối, và ba nâng cấp của năm 2026
 * (tree drafting, block verification, drafter rẻ hơn).
 */
/**
 * Các viz dưới đây rộng 900 đơn vị viewBox. Trên màn hình hẹp, SVG co lại
 * theo chiều rộng khung, kéo chữ mono 11px xuống dưới 6px thật và thành
 * không đọc nổi. Khoá một chiều rộng tối thiểu rồi cho cuộn ngang trong
 * chính khối viz, thay vì để cả trang co chữ.
 */
function VizScroll({ children }: { children: ReactNode }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: 720 }}>{children}</div>
    </div>
  );
}

export default function SpeculativeDecoding2026Article() {
  return (
    <ArticleShell
      meta={meta}
      heroViz={
        <VizScroll>
          <SpecDecodeHeroViz />
        </VizScroll>
      }
    >
      <ArticleSection eyebrow="01 · Ý tưởng">
        <ArticleProse>
          <p>
            Bạn chạy cùng một model mã mở trên hai nhà cung cấp. Cùng
            trọng số, cùng prompt, cùng nhiệt độ. Một bên trả chữ ra
            mượt như nước, bên kia nhỏ giọt. Chênh lệch có thể tới ba
            lần, và nó không nằm ở model. Nó nằm ở cách token rời khỏi
            GPU.
          </p>
          <p>
            Kỹ thuật đứng sau phần lớn khoảng cách đó tên là{" "}
            <b>speculative decoding</b>. Ý tưởng nghe gần như gian lận:
            cho một model nhỏ và nhanh đoán trước vài token kế tiếp,
            rồi bắt model lớn kiểm tra cả xâu đoán đó trong đúng một
            lượt tính. Đoán trúng thì lấy hết. Đoán trật thì cắt tại
            chỗ trật và sửa. Điểm mấu chốt: luật chấp nhận được thiết
            kế sao cho phân phối đầu ra <b>không đổi một chút nào</b>{" "}
            so với chạy model lớn thẳng tay. Đây là tốc độ miễn phí,
            không phải một đánh đổi chất lượng.
          </p>
          <p>
            Bài gốc là của Yaniv Leviathan, Matan Kalman và Yossi
            Matias ở Google, công bố cuối năm 2022 và trình bày tại
            ICML 2023. Trên T5-XXL họ đo được nhanh hơn 2 tới 3 lần,
            không train lại, không đụng vào kiến trúc. Bốn năm sau, kỹ
            thuật này là mặc định trong vLLM, trong stack TPU của
            Google, và là lý do một model Flash trả lời nhanh tới mức
            khó tin.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="02 · Nút thắt"
        heading="Vì sao kiểm tra năm token gần như rẻ bằng sinh một token"
      >
        <ArticleProse>
          <p>
            Để hiểu vì sao trò đoán trước lại có lãi, phải nhìn vào
            thứ thật sự tốn thời gian ở bước{" "}
            <Term slug="inference-optimization">decode</Term>. Trực
            giác thông thường là GPU đang bận tính toán. Sai. Ở batch
            nhỏ, GPU đang bận <b>chờ bộ nhớ</b>.
          </p>
          <p>
            Sinh một token nghĩa là đẩy một vector qua toàn bộ mạng.
            Muốn làm thế, mọi trọng số của model phải được nạp từ HBM
            về các đơn vị tính. Với một model 8B ở fp16, đó là khoảng
            16GB phải chảy qua bus bộ nhớ, chỉ để đẻ ra một chữ. Phép
            nhân ma trận thực tế thì bé xíu so với lượng dữ liệu vừa
            nạp. Các nhân tính toán làm xong việc rồi ngồi không, chờ
            đợt trọng số kế tiếp.
          </p>
          <p>
            Đây là chỗ trò đoán ăn tiền. Nếu bạn đưa vào một lượt tính
            năm token thay vì một, trọng số vẫn chỉ nạp đúng một lần.
            Phần việc thêm chỉ là ma trận rộng hơn năm cột, thứ mà
            phần cứng đang rảnh sẵn sàng nuốt. Chính blog kỹ thuật của
            Google mô tả đúng điều này khi nói về TPU: trên phần cứng
            cao cấp, thời gian bị chi phối bởi việc nạp trọng số chứ
            không phải phép toán. Nói cách khác, <b>bốn token kia gần
            như miễn phí</b>, miễn là bạn có gì đó để đưa vào kiểm
            tra.
          </p>
        </ArticleProse>
        <ArticleViz caption="Cùng một lượt forward, cùng một lần nạp trọng số. Số token đi kèm gần như không đổi thời gian.">
          <VizScroll>
            <BandwidthWallViz />
          </VizScroll>
        </ArticleViz>
      </ArticleSection>

      <ArticleSection
        eyebrow="03 · Cơ chế"
        heading="Đoán, kiểm tra, và phép toán giữ nguyên phân phối"
      >
        <ArticleProse>
          <p>
            Một vòng speculative decoding có ba nhịp.
          </p>
          <p>
            <b>Nhịp một, đoán.</b> Model nháp, gọi là drafter, sinh k
            token kế tiếp theo cách thường. Drafter có thể là một model
            nhỏ cùng họ, hoặc một đầu dự đoán nhẹ gắn thẳng vào model
            lớn. Vì nó bé nên k lượt của nó vẫn rẻ hơn một lượt của
            model lớn.
          </p>
          <p>
            <b>Nhịp hai, kiểm tra.</b> Model lớn nhận cả prefix lẫn k
            token nháp và chạy <b>một</b> lượt forward. Nhờ cơ chế
            nhân quả của{" "}
            <Term slug="attention-mechanism">attention</Term>, một lượt
            này cho ra phân phối xác suất tại cả k cộng một vị trí, tức
            là nó vừa chấm điểm mọi token nháp vừa chuẩn bị sẵn token
            tiếp theo.
          </p>
          <p>
            <b>Nhịp ba, chấp nhận hoặc từ chối.</b> Đây là phần đẹp
            nhất. Gọi q là xác suất drafter gán cho token nó vừa đoán,
            p là xác suất model lớn gán cho chính token đó. Token được
            nhận với xác suất bằng p chia q, chặn trên ở 1. Nếu bị từ
            chối tại vị trí thứ i, hệ thống cắt bỏ phần đuôi và lấy
            một token mới rút từ phân phối hiệu p trừ q, phần âm cắt
            về 0 rồi chuẩn hoá lại.
          </p>
          <p>
            Chứng minh trong bài gốc cho thấy quy trình này sinh ra
            token theo <b>đúng</b> phân phối của model lớn. Không phải
            xấp xỉ, không phải gần đúng. Nếu drafter đoán ngu, bạn mất
            công vô ích nhưng kết quả vẫn chuẩn. Nếu drafter đoán giỏi,
            bạn lấy được nhiều token cho mỗi lượt của model lớn. Và khi
            cả k token đều được nhận, model lớn tặng thêm một token
            miễn phí từ vị trí cuối, nên một lượt có thể trả về tới k
            cộng một token.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="04 · Con số quyết định"
        heading="Tốc độ phụ thuộc vào việc bạn hỏi gì"
      >
        <ArticleProse>
          <p>
            Vì mọi thứ dồn vào chuyện đoán trúng hay trật, chỉ số quan
            trọng nhất không phải TFLOPS mà là <b>acceptance length</b>:
            trung bình bao nhiêu token được nhận trên mỗi lượt của
            model lớn. Đó chính là hệ số tăng tốc thô.
          </p>
          <p>
            EAGLE-3, drafter phổ biến nhất năm 2026, đo được trung bình
            2,77 token mỗi lượt trên 11 lĩnh vực của SPEED-Bench. Nhưng
            con số trung bình giấu mất điều thú vị: nó lệch rất mạnh
            theo loại nội dung. Code đạt 3,16. Toán 3,12. RAG 3,11. Đa
            ngôn ngữ 3,07.
          </p>
          <p>
            Quy luật rất người: những gì <b>dễ đoán</b> thì chạy nhanh.
            Code đầy cú pháp bắt buộc, dấu đóng ngoặc, tên biến vừa
            khai báo xong. RAG thì phần lớn câu trả lời là trích lại
            đoạn văn bản đã nằm sẵn trong context. Ngược lại, một đoạn
            văn sáng tạo, nhiều lựa chọn từ ngang nhau, sẽ làm drafter
            trật liên tục và tốc độ tụt về gần mức thường.
          </p>
          <p>
            Hệ quả thực tế cho người dùng: cùng một hệ thống, tác vụ
            sinh code hoặc tóm tắt tài liệu sẽ cảm giác nhanh hơn hẳn
            tác vụ viết nội dung tự do. Đó không phải ảo giác.
          </p>
        </ArticleProse>
        <ArticleViz caption="EAGLE-3 · acceptance length trung bình theo lĩnh vực, đo trên SPEED-Bench">
          <VizScroll>
            <AcceptanceByDomainViz />
          </VizScroll>
        </ArticleViz>
      </ArticleSection>

      <ArticleSection
        eyebrow="05 · Năm 2026"
        heading="Ba hướng nâng cấp đang đẩy con số này lên"
      >
        <ArticleProse>
          <p>
            <b>Một, đoán theo cây thay vì theo chuỗi.</b> Bản gốc đoán
            một đường thẳng: nếu token thứ hai trật, ba token sau vứt
            hết. Tree drafting đưa ra nhiều ứng viên tại mỗi vị trí,
            tạo thành một cây, rồi dùng tree attention để model lớn
            kiểm tra tất cả nhánh trong cùng một lượt. Vì lượt kiểm tra
            gần như miễn phí, thêm nhánh nghĩa là thêm cơ hội trúng mà
            hầu như không thêm chi phí.
          </p>
          <p>
            <b>Hai, duyệt cả khối thay vì từng token.</b> Nhóm Ziteng
            Sun, Uri Mendlovic, Yaniv Leviathan và cộng sự chỉ ra rằng
            luật chấp nhận từng token một là chưa tối ưu. Block
            verification duyệt cả khối nháp cùng lúc, và họ chứng minh
            được nó tối ưu về số token kỳ vọng mỗi vòng, đồng thời{" "}
            <b>không bao giờ tệ hơn</b> cách cũ. Thực đo thêm 5 tới 8
            phần trăm wall-clock, không thêm dòng code phức tạp nào,
            vẫn giữ nguyên tính lossless. Đây là loại cải tiến hiếm:
            bật lên là có, không cần cân nhắc.
          </p>
          <p>
            <b>Ba, làm cho việc đoán rẻ đi.</b> Nghịch lý của 2026 là
            drafter đã trở thành nút thắt mới. EAGLE-3 gọi drafter một
            cách tuần tự, và các lượt đó ngốn khoảng 30 phần trăm độ
            trễ. SpecBlock, công bố tháng 5 năm 2026, cho drafter đẻ 4
            token phụ thuộc nhau trong một lượt duy nhất, đồng thời
            dùng một đầu xếp hạng để phân bổ độ rộng nhánh theo từng vị
            trí thay vì cắt top-k cứng. Kết quả: nhanh hơn EAGLE-3 từ 8
            tới 13 phần trăm trong khi chỉ tốn 44 tới 52 phần trăm chi
            phí drafting, kéo thời gian đoán từ khoảng 17ms xuống
            khoảng 7ms trên model đích cỡ 8B. Bên vLLM, P-EAGLE đi
            hướng song song hoá và báo cáo nhanh hơn EAGLE-3 gốc tới
            1,69 lần.
          </p>
        </ArticleProse>
        <ArticleViz caption="Chuỗi nháp một đường so với cây nháp nhiều nhánh, cùng được duyệt trong một lượt forward">
          <VizScroll>
            <TreeVsChainViz />
          </VizScroll>
        </ArticleViz>
      </ArticleSection>

      <ArticleSection
        eyebrow="06 · Số liệu"
        heading="Cùng chất lượng, một phần tư chi phí"
      >
        <ArticleCompare
          before={{
            label: "vLLM tiêu chuẩn · H100 SXM5",
            value: "0,903 đô / 1M token",
            note: "Decode tuần tự, mỗi lượt forward của model lớn trả về đúng 1 token.",
          }}
          after={{
            label: "Cùng model · EAGLE-3",
            value: "0,246 đô / 1M token",
            note: "Nhanh hơn khoảng 3 tới 4 lần trên tokens-per-dollar. Đầu ra không đổi chất lượng.",
          }}
        />
        <ArticleProse>
          <p>
            Phía TPU, con số còn mạnh hơn. Trong bài đo tháng 5 năm
            2026 của Google trên TPU v5p với Llama-3.1-8B, cách nháp
            kiểu diffusion đạt trung bình nhanh hơn 3,13 lần trên toàn
            bộ dataset, và trên tập toán math500 thời gian sinh mỗi
            token rơi từ 8,02ms xuống 1,40ms. Khi so trực tiếp trong
            điều kiện serving, cách này đạt 2,29 lần còn EAGLE-3 đạt
            1,30 lần.
          </p>
          <p>
            Tại I/O 2026, Google nói thẳng rằng block verification và
            tree-structured drafting, cài đặt tối ưu cho kiến trúc TPU,
            chính là thứ tạo ra tốc độ hiện tại của Gemini 3.5 Flash.
            Model đó đang chạy ở mức trên 280 token đầu ra mỗi giây,
            nhanh tới mức nhiều người tưởng nó là một model nhỏ hơn
            thực tế.
          </p>
        </ArticleProse>
        <div>
          <ArticleStat value="2,77" label="token nhận mỗi lượt · EAGLE-3 trung bình" />
          <ArticleStat value="5-8%" label="thêm từ block verification, không rủi ro" />
          <ArticleStat value="0%" label="thay đổi phân phối đầu ra" />
        </div>
      </ArticleSection>

      <ArticleSection
        eyebrow="07 · Đánh đổi"
        heading="Nó miễn phí ở batch nhỏ, không miễn phí ở batch lớn"
      >
        <ArticleProse>
          <p>
            Toàn bộ lập luận miễn phí dựa trên một giả định: GPU đang
            rảnh tính toán vì kẹt băng thông bộ nhớ. Giả định đó đúng
            khi phục vụ ít request cùng lúc. Khi bạn nhồi hàng chục
            request vào một batch, GPU đã bận thật, và mỗi token nháp
            bị từ chối trở thành phép tính vứt đi. Số liệu của EAGLE
            3.1 trên Kimi K2.6 cho thấy rõ đường cong này: nhanh hơn
            2,03 lần khi phục vụ một người, còn 1,71 lần ở bốn, và
            1,66 lần ở mười sáu.
          </p>
          <p>
            Chi phí thứ hai là bộ nhớ. Drafter phải nằm cùng chỗ với
            model lớn, ăn thêm VRAM và thêm một{" "}
            <Term slug="kv-cache">KV cache</Term> riêng. Với GPU đã
            chật, phần VRAM đó có thể đáng giá hơn nếu dùng để tăng
            batch.
          </p>
          <p>
            Chi phí thứ ba ít ai nói: drafter phải hợp với model đích.
            Một drafter luyện trên hội thoại tiếng Anh đem đi đoán cho
            tác vụ sinh SQL tiếng Việt sẽ trật liên tục, acceptance
            length tụt về gần 1, và bạn trả tiền cho phần nháp mà không
            nhận lại gì. Đây là lý do các bản EAGLE được huấn luyện
            riêng cho từng model đích.
          </p>
          <p>
            Cuối cùng, hãy đọc kỹ chữ lossless. Một số biến thể phổ
            biến nới lỏng luật chấp nhận để nhận nhiều token hơn, và
            khi làm thế thì phân phối đầu ra <b>không</b> còn giống bản
            gốc nữa. Chúng vẫn hữu ích, nhưng đó là một quyết định sản
            phẩm, không phải một tối ưu thuần kỹ thuật. Nếu nhà cung
            cấp quảng cáo tốc độ mà không nói rõ luật chấp nhận, đó là
            câu đáng hỏi lại.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="08 · Ý nghĩa"
        heading="Độ trễ giờ là thuộc tính của stack, không phải của model"
      >
        <ArticleProse>
          <p>
            Bài học lớn nhất cho người chọn công cụ năm 2026: khi bạn
            đo hai nhà cung cấp trên cùng một model mã mở và thấy chênh
            lệch tốc độ, rất có thể bạn không đang đo model. Bạn đang
            đo drafter của họ, luật duyệt của họ, và mức batch họ đang
            chạy.
          </p>
          <p>
            Điều đó cũng đổi cách đọc bảng giá. Speculative decoding
            không làm model thông minh hơn, nó chỉ làm mỗi lượt tính
            đắt tiền của GPU sinh ra nhiều chữ hơn. Vì phân phối đầu ra
            giữ nguyên,{" "}
            <Term slug="cost-latency-tokens">chi phí mỗi token</Term>{" "}
            giảm mà không có ô nào trong bảng chất lượng bị đánh đổi.
            Đó là loại tối ưu hiếm hoi trong ngành này.
          </p>
          <p>
            Và nếu bạn đang tự dựng hệ thống phục vụ model, thứ tự ưu
            tiên khá rõ. Bật speculative decoding trước, vì nó là mức
            tăng lớn nhất cho công sức bỏ ra. Bật block verification vì
            nó không bao giờ tệ hơn. Rồi mới tính tới việc luyện một
            drafter riêng cho đúng loại nội dung mà người dùng của bạn
            thật sự gõ vào.
          </p>
        </ArticleProse>
      </ArticleSection>
    </ArticleShell>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Hero viz — một vòng draft/verify. Model nhỏ đoán 5 token,
 * model lớn duyệt trong một lượt: 4 token được nhận, token thứ 5
 * bị từ chối và thay bằng token model lớn tự rút.
 * Static SVG, export ra cho lead-card dùng lại.
 * ────────────────────────────────────────────────────────────── */
export function SpecDecodeHeroViz() {
  const drafted = ["là", "thủ", "đô", "của", "Nhật"];
  const verified = ["là", "thủ", "đô", "của", "Việt"];
  const accepted = [true, true, true, true, false];

  const chipW = 132;
  const gap = 16;
  const startX = 88;
  const chipX = (i: number) => startX + i * (chipW + gap);

  return (
    <svg
      viewBox="0 0 900 340"
      className="ar-viz"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Model nhỏ đoán năm token, model lớn duyệt trong một lượt và nhận bốn token"
    >
      <text
        x={startX}
        y="32"
        fontFamily="var(--font-mono)"
        fontSize="11"
        fill="var(--accent-dark)"
        letterSpacing="0.12em"
      >
        / SPECULATIVE DECODING · MỘT LƯỢT DUYỆT, NHIỀU TOKEN
      </text>

      <text
        x={startX}
        y="60"
        fontFamily="var(--font-mono)"
        fontSize="11"
        fill="var(--text-tertiary)"
        letterSpacing="0.06em"
      >
        ĐÃ SINH: Hà Nội
      </text>

      {/* Hàng 1 — model nhỏ đoán */}
      <text
        x={startX}
        y="84"
        fontFamily="var(--font-mono)"
        fontSize="10"
        fill="var(--text-tertiary)"
        letterSpacing="0.14em"
      >
        MODEL NHỎ ĐOÁN 5 TOKEN
      </text>
      {drafted.map((t, i) => (
        <g key={`d-${t}-${i}`}>
          <rect
            x={chipX(i)}
            y={94}
            width={chipW}
            height={44}
            rx={6}
            fill="var(--bg-card)"
            stroke="var(--border-strong)"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
          <text
            x={chipX(i) + chipW / 2}
            y={122}
            textAnchor="middle"
            fontFamily="var(--font-sans)"
            fontSize="18"
            fill="var(--text-secondary)"
          >
            {t}
          </text>
        </g>
      ))}

      {/* Mũi tên duyệt */}
      <g>
        <line
          x1={154}
          y1={148}
          x2={154}
          y2={172}
          stroke="var(--turquoise-500)"
          strokeWidth={2}
        />
        <path d="M 148 168 L 154 178 L 160 168 Z" fill="var(--turquoise-500)" />
        <text
          x={176}
          y={170}
          fontFamily="var(--font-mono)"
          fontSize="11"
          fill="var(--accent-dark)"
          letterSpacing="0.1em"
        >
          MODEL LỚN DUYỆT CẢ 5 TRONG 1 LƯỢT FORWARD
        </text>
      </g>

      {/* Hàng 2 — kết quả duyệt */}
      {verified.map((t, i) => (
        <g key={`v-${t}-${i}`}>
          <rect
            x={chipX(i)}
            y={192}
            width={chipW}
            height={48}
            rx={6}
            fill={accepted[i] ? "var(--turquoise-100)" : "var(--bg-card)"}
            stroke={accepted[i] ? "var(--turquoise-500)" : "var(--clay)"}
            strokeWidth={2}
          />
          <text
            x={chipX(i) + chipW / 2}
            y={223}
            textAnchor="middle"
            fontFamily="var(--font-sans)"
            fontSize="20"
            fontWeight={600}
            fill={accepted[i] ? "var(--turquoise-ink)" : "var(--text-primary)"}
          >
            {t}
          </text>
          <text
            x={chipX(i) + chipW / 2}
            y={262}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="10"
            fill={accepted[i] ? "var(--accent-dark)" : "var(--text-secondary)"}
            letterSpacing="0.1em"
          >
            {accepted[i] ? "NHẬN" : "TỪ CHỐI · THAY"}
          </text>
        </g>
      ))}

      <text
        x={startX}
        y="302"
        fontFamily="var(--font-mono)"
        fontSize="11"
        fill="var(--text-tertiary)"
        letterSpacing="0.06em"
      >
        1 lượt của model lớn trả về 5 token thay vì 1. Phân phối đầu ra không đổi.
      </text>
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Viz 2 — bức tường băng thông. Hai thanh cùng độ dài phần nạp
 * trọng số, khác nhau chút xíu ở phần tính toán.
 * ────────────────────────────────────────────────────────────── */
export function BandwidthWallViz() {
  const loadW = 460;
  const barX = 220;
  const rows = [
    { label: "SINH 1 TOKEN", compute: 24, note: "1 token ra" },
    { label: "DUYỆT 5 TOKEN", compute: 60, note: "tới 5 token ra" },
  ];

  return (
    <svg
      viewBox="0 0 900 250"
      className="ar-viz"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Hai thanh so sánh: phần nạp trọng số từ bộ nhớ giống hệt nhau, phần tính toán chênh nhau rất ít"
    >
      <text
        x="24"
        y="28"
        fontFamily="var(--font-mono)"
        fontSize="11"
        fill="var(--accent-dark)"
        letterSpacing="0.12em"
      >
        / THỜI GIAN MỘT LƯỢT FORWARD, THEO THÀNH PHẦN
      </text>

      {rows.map((r, i) => {
        const y = 70 + i * 84;
        return (
          <g key={r.label}>
            <text
              x="24"
              y={y + 26}
              fontFamily="var(--font-mono)"
              fontSize="11"
              fill="var(--text-secondary)"
              letterSpacing="0.1em"
            >
              {r.label}
            </text>
            <rect
              x={barX}
              y={y}
              width={loadW}
              height={40}
              rx={4}
              fill="var(--clay)"
              opacity={0.85}
            />
            <text
              x={barX + 18}
              y={y + 25}
              fontFamily="var(--font-mono)"
              fontSize="11"
              fill="var(--turquoise-50)"
              letterSpacing="0.08em"
            >
              NẠP TRỌNG SỐ TỪ HBM
            </text>
            <rect
              x={barX + loadW}
              y={y}
              width={r.compute}
              height={40}
              rx={4}
              fill="var(--turquoise-500)"
            />
            <text
              x={barX + loadW + r.compute + 14}
              y={y + 25}
              fontFamily="var(--font-mono)"
              fontSize="11"
              fill="var(--text-tertiary)"
              letterSpacing="0.08em"
            >
              {r.note}
            </text>
          </g>
        );
      })}

      <text
        x="24"
        y="228"
        fontFamily="var(--font-mono)"
        fontSize="11"
        fill="var(--text-tertiary)"
        letterSpacing="0.06em"
      >
        Phần đỏ đất là băng thông bộ nhớ, không đổi. Phần xanh là phép
        tính, nơi 4 token thêm gần như miễn phí.
      </text>
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Viz 3 — acceptance length theo lĩnh vực (EAGLE-3, SPEED-Bench).
 * ────────────────────────────────────────────────────────────── */
export function AcceptanceByDomainViz() {
  const bars = [
    { label: "CODE", value: 3.16 },
    { label: "TOÁN", value: 3.12 },
    { label: "RAG", value: 3.11 },
    { label: "ĐA NGÔN NGỮ", value: 3.07 },
    { label: "TB 11 LĨNH VỰC", value: 2.77 },
  ];
  const maxV = 3.4;
  const baseY = 236;
  const plotH = 168;
  const barW = 96;
  const gap = 54;
  const startX = 78;

  return (
    <svg
      viewBox="0 0 900 300"
      className="ar-viz"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Biểu đồ cột acceptance length của EAGLE-3 theo lĩnh vực, cao nhất là code với 3,16 token"
    >
      <text
        x="24"
        y="28"
        fontFamily="var(--font-mono)"
        fontSize="11"
        fill="var(--accent-dark)"
        letterSpacing="0.12em"
      >
        / TOKEN ĐƯỢC NHẬN TRÊN MỖI LƯỢT CỦA MODEL LỚN
      </text>

      {/* Đường mốc "không dùng speculative" */}
      <line
        x1={60}
        y1={baseY - (1 / maxV) * plotH}
        x2={788}
        y2={baseY - (1 / maxV) * plotH}
        stroke="var(--border-strong)"
        strokeDasharray="4 4"
        strokeWidth={1}
      />
      <text
        x={24}
        y={baseY - (1 / maxV) * plotH + 4}
        fontFamily="var(--font-mono)"
        fontSize="10"
        fill="var(--text-tertiary)"
      >
        1,0
      </text>
      <text
        x={798}
        y={baseY - (1 / maxV) * plotH + 4}
        fontFamily="var(--font-mono)"
        fontSize="10"
        fill="var(--text-tertiary)"
      >
        decode thường
      </text>

      {bars.map((b, i) => {
        const h = (b.value / maxV) * plotH;
        const x = startX + i * (barW + gap);
        const isAvg = i === bars.length - 1;
        return (
          <g key={b.label}>
            <rect
              x={x}
              y={baseY - h}
              width={barW}
              height={h}
              rx={4}
              fill={isAvg ? "var(--clay)" : "var(--turquoise-500)"}
              opacity={isAvg ? 0.85 : 1}
            />
            <text
              x={x + barW / 2}
              y={baseY - h - 12}
              textAnchor="middle"
              fontFamily="var(--font-display, var(--font-sans))"
              fontSize="22"
              fontWeight={600}
              fill="var(--text-primary)"
            >
              {b.value.toFixed(2).replace(".", ",")}
            </text>
            <text
              x={x + barW / 2}
              y={baseY + 20}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize="10"
              fill="var(--text-tertiary)"
              letterSpacing="0.08em"
            >
              {b.label}
            </text>
          </g>
        );
      })}

      <line
        x1={60}
        y1={baseY}
        x2={788}
        y2={baseY}
        stroke="var(--border)"
        strokeWidth={1}
      />

      <text
        x="24"
        y="288"
        fontFamily="var(--font-mono)"
        fontSize="11"
        fill="var(--text-tertiary)"
        letterSpacing="0.06em"
      >
        Nội dung càng đoán được, tốc độ càng cao. Văn sáng tạo tụt về
        gần mốc 1,0.
      </text>
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Viz 4 — chuỗi nháp so với cây nháp.
 * ────────────────────────────────────────────────────────────── */
export function TreeVsChainViz() {
  const chainX = 96;
  const treeX = 520;
  const nodeR = 17;

  const chain = [0, 1, 2, 3].map((i) => ({ cx: chainX + i * 86, cy: 152 }));

  const tree = [
    { id: "r", cx: treeX, cy: 152, on: true },
    { id: "a1", cx: treeX + 92, cy: 120, on: true },
    { id: "a2", cx: treeX + 92, cy: 192, on: false },
    { id: "b1", cx: treeX + 184, cy: 100, on: false },
    { id: "b2", cx: treeX + 184, cy: 140, on: true },
    { id: "b3", cx: treeX + 184, cy: 176, on: false },
    { id: "b4", cx: treeX + 184, cy: 216, on: false },
  ];
  const edges: Array<[string, string]> = [
    ["r", "a1"],
    ["r", "a2"],
    ["a1", "b1"],
    ["a1", "b2"],
    ["a2", "b3"],
    ["a2", "b4"],
  ];
  const nodeById = Object.fromEntries(tree.map((n) => [n.id, n]));

  return (
    <svg
      viewBox="0 0 900 290"
      className="ar-viz"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Bên trái là chuỗi nháp một đường, bên phải là cây nháp nhiều nhánh với một đường được chấp nhận"
    >
      <text
        x="24"
        y="28"
        fontFamily="var(--font-mono)"
        fontSize="11"
        fill="var(--accent-dark)"
        letterSpacing="0.12em"
      >
        / CHUỖI NHÁP SO VỚI CÂY NHÁP
      </text>

      {/* Vách ngăn */}
      <line
        x1={452}
        y1={80}
        x2={452}
        y2={240}
        stroke="var(--border)"
        strokeWidth={1}
      />

      {/* Trái: chuỗi */}
      <text
        x={chainX - 32}
        y={64}
        fontFamily="var(--font-mono)"
        fontSize="10"
        fill="var(--text-tertiary)"
        letterSpacing="0.14em"
      >
        CHUỖI · 1 ĐƯỜNG
      </text>
      {chain.slice(0, -1).map((n, i) => (
        <line
          key={`ce-${i}`}
          x1={n.cx + nodeR}
          y1={n.cy}
          x2={chain[i + 1].cx - nodeR}
          y2={chain[i + 1].cy}
          stroke="var(--border-strong)"
          strokeWidth={2}
        />
      ))}
      {chain.map((n, i) => (
        <circle
          key={`cn-${i}`}
          cx={n.cx}
          cy={n.cy}
          r={nodeR}
          fill={i < 2 ? "var(--turquoise-100)" : "var(--bg-card)"}
          stroke={i < 2 ? "var(--turquoise-500)" : "var(--clay)"}
          strokeWidth={2}
        />
      ))}
      <text
        x={chainX - 32}
        y={262}
        fontFamily="var(--font-mono)"
        fontSize="10"
        fill="var(--text-tertiary)"
        letterSpacing="0.06em"
      >
        Trật ở node 3, hai node sau vứt đi.
      </text>

      {/* Phải: cây */}
      <text
        x={treeX - 26}
        y={64}
        fontFamily="var(--font-mono)"
        fontSize="10"
        fill="var(--text-tertiary)"
        letterSpacing="0.14em"
      >
        CÂY · NHIỀU ỨNG VIÊN
      </text>
      {edges.map(([a, b]) => (
        <line
          key={`te-${a}-${b}`}
          x1={nodeById[a].cx + nodeR}
          y1={nodeById[a].cy}
          x2={nodeById[b].cx - nodeR}
          y2={nodeById[b].cy}
          stroke={
            nodeById[a].on && nodeById[b].on
              ? "var(--turquoise-500)"
              : "var(--border-strong)"
          }
          strokeWidth={nodeById[a].on && nodeById[b].on ? 2.5 : 1.5}
        />
      ))}
      {tree.map((n) => (
        <circle
          key={`tn-${n.id}`}
          cx={n.cx}
          cy={n.cy}
          r={nodeR}
          fill={n.on ? "var(--turquoise-100)" : "var(--bg-card)"}
          stroke={n.on ? "var(--turquoise-500)" : "var(--border-strong)"}
          strokeWidth={2}
        />
      ))}
      <text
        x={treeX - 26}
        y={262}
        fontFamily="var(--font-mono)"
        fontSize="10"
        fill="var(--text-tertiary)"
        letterSpacing="0.06em"
      >
        Model lớn duyệt cả cây trong 1 lượt, giữ lại đường trúng.
      </text>
    </svg>
  );
}
