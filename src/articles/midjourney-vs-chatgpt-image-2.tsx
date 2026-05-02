import {
  ArticleShell,
  ArticleSection,
  ArticleProse,
  ArticleViz,
  ArticleCompare,
  Term,
} from "@/components/article";
import { articleMap } from "./registry";

const meta = articleMap["midjourney-vs-chatgpt-image-2"]!;

/**
 * Comparison article. Midjourney V8.1 vs ChatGPT Images 2.0. Frames the
 * trade-off as architectural: diffusion is optimised for visual quality,
 * autoregressive token gen inherits LLM instruction-following. Same
 * prompt produces two very different outputs because the two systems
 * are minimising two different losses. Vietnamese voice from
 * writing-vietnamese-technical skill: no em-dashes, claim-shaped
 * headings, English tech terms inline, body sentences linked by
 * pedagogical connectives.
 */
export default function MidjourneyVsChatgptImage2Article() {
  return (
    <ArticleShell meta={meta} heroViz={<ImageGenSplitHeroViz />}>
      <ArticleSection eyebrow="01 · Bối cảnh">
        <ArticleProse>
          <p>
            Tháng 4 năm 2026, hai bản image gen mới ra trong cùng một tuần.
            Ngày 21, OpenAI tung <b>ChatGPT Images 2.0</b> (model{" "}
            <code>gpt-image-2</code>), bản image gen đầu tiên có{" "}
            <b>thinking mode</b> biết suy luận trước khi vẽ. Trong vòng 12
            giờ, nó leo lên hạng nhất Image Arena với cách biệt 242 điểm,
            mức cao nhất từng ghi nhận trên bảng xếp hạng đó. Ngày 30,
            Midjourney chuyển <b>V8.1</b> thành mặc định, mang ảnh 2K trực
            tiếp lên web app kèm text rendering tốt hơn V7 đáng kể.
          </p>
          <p>
            Bạn mở cả hai, gõ cùng một prompt:{" "}
            <i>
              &ldquo;quán phở Hà Nội buổi sáng, một con mèo nhỏ ngồi cạnh bát
              phở, biển hiệu trên tường ghi PHỞ BÒ NGON&rdquo;
            </i>
            . Cả hai cho ra hai bức ảnh hoàn toàn khác nhau.
          </p>
          <p>
            Bức Midjourney V8.1 trông như tranh sơn dầu chụp ngược sáng. Hơi
            nóng bốc lên từ bát, ánh đèn vàng phủ lên bàn ghế gỗ, con mèo có
            dáng rất chuẩn của mèo nhà. Tuy nhiên, biển hiệu trên tường lại
            ghi &ldquo;PHO BO NGOM&rdquo;, một dòng chữ giả-Việt-Nam mà mạng
            cứ ghép từ video huấn luyện ra. Phiên bản V8 đã cải thiện text
            rendering rõ rệt khi prompt đặt chữ trong dấu ngoặc kép, nhưng
            tiếng Việt có dấu phụ vẫn là vùng yếu. Bức ChatGPT Images 2.0
            thì ngược lại, trông giống ảnh chụp điện thoại bình thường. Ánh
            sáng đều, không khí ít kịch tính hơn, nhưng biển hiệu in đúng
            &ldquo;PHỞ BÒ NGON&rdquo; từng chữ một, dấu sắc dấu nặng đầy đủ.
          </p>
          <p>
            Hai bức khác nhau không phải do prompt sai. Chúng khác nhau vì
            hai mô hình được thiết kế để tối ưu hai mục tiêu khác nhau ngay
            từ kiến trúc. Bài này đi vào chỗ kiến trúc đó, vì sao nó dẫn đến
            hai phong cách vẽ rất khác, và lúc nào thì nên dùng bên nào.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="02 · Cơ chế"
        heading="Diffusion khử nhiễu cùng lúc, token sinh từng ô theo thứ tự."
      >
        <ArticleProse>
          <p>
            Midjourney chạy bằng <b>diffusion model</b>. Mạng bắt đầu từ
            một bức ảnh nhiễu hoàn toàn (nhìn như hột mì rơi đầy màn hình),
            rồi qua hàng chục bước, dần dần &ldquo;dọn&rdquo; nhiễu thành
            hình ảnh. Mỗi bước, mạng nhìn cả ảnh cùng lúc và quyết định
            xoá loại nhiễu nào để bức trở nên đẹp hơn theo thẩm mỹ đã học.
          </p>
          <p>
            Cụm từ khoá ở đây là &ldquo;đẹp theo thẩm mỹ đã học&rdquo;. Dữ
            liệu huấn luyện của Midjourney được tuyển chọn từ vô số ảnh
            nghệ thuật, ảnh chụp chuyên nghiệp, ảnh được con người đánh
            giá là đẹp. Mạng học cái không khí của những ảnh đó. Nhờ vậy,
            mạng rất giỏi tô màu, sắp ánh sáng, dựng không khí. Trong khi
            đó, các chi tiết nhỏ ràng buộc bằng lời như nội dung biển hiệu
            hay số chữ trên áo lại không phải mục tiêu mà mạng tối ưu.
            Mạng thường vẽ một biển hiệu trông giống biển hiệu, nhưng chữ
            thực tế chỉ là dấu vết của hàng nghìn biển hiệu khác nhau bị
            pha trộn lại.
          </p>
          <p>
            ChatGPT Images 2.0 sinh ảnh theo cách rất khác. Nó vẽ bức ảnh
            từng mảng nhỏ một, theo thứ tự từ trên xuống dưới và trái sang
            phải, mỗi mảng phụ thuộc vào các mảng đã sinh trước đó. Cách
            này gọi là <b>autoregressive token generation</b>: bức ảnh
            được biểu diễn dưới dạng một chuỗi token rời rạc, model dự
            đoán token tiếp theo dựa trên prompt và các token đã có. Đây
            là cùng cơ chế đã làm cho{" "}
            <Term slug="reasoning-models">các LLM hiện đại</Term> theo
            lệnh người dùng tốt như vậy.
          </p>
          <p>
            Khi prompt nói &ldquo;biển hiệu ghi PHỞ BÒ NGON&rdquo;, model
            coi đó là một ràng buộc cụ thể trên các token sẽ sinh ra ở vùng
            biển hiệu, giống như khi LLM được yêu cầu lặp lại đúng một câu
            trong câu trả lời. Nhờ vậy, ChatGPT Images 2.0 viết được chữ rõ
            ràng, làm theo lệnh chi tiết, và có thể chỉnh sửa từng phần qua
            nhiều lượt chat.
          </p>
          <p>
            Bản 2.0 còn cộng thêm một tầng mới chưa từng có ở các image gen
            trước: <b>thinking mode</b>. Trước khi sinh token ảnh, model
            dành ra vài giây để &ldquo;suy nghĩ&rdquo; bằng chuỗi reasoning
            text, giống cách <Term slug="reasoning-models">o1/o3/Claude
            reasoning</Term> nháp ý tưởng trước khi trả lời. Trong khoảng
            thời gian đó, model phân tích layout, tính toán vị trí chữ, kiểm
            tra ràng buộc, thậm chí có thể bật web search để tra cứu sự
            kiện. Đây là image gen đầu tiên có cơ chế này. Người dùng Plus
            (20 USD/tháng) và Pro (200 USD/tháng) bật được thinking mode.
            Người dùng free chỉ có instant mode, vốn vẫn dùng chung kiến
            trúc autoregressive nhưng bỏ qua bước nháp.
          </p>
          <p>
            Đổi lại, kiến trúc autoregressive ít có cơ hội &ldquo;cảm&rdquo;
            cái đẹp tổng thể như diffusion. Mỗi token chỉ thấy phần ảnh đã
            sinh trước nó, nên việc dựng không khí xuyên suốt toàn bức không
            phải là điểm mạnh của kiến trúc này. Đó là lý do nhiều designer
            đang dùng cả hai song song chứ không bỏ một bên nào.
          </p>
        </ArticleProse>
        <ArchitectureSplitViz />
      </ArticleSection>

      <ArticleSection
        eyebrow="03 · Đối đầu"
        heading="Cùng prompt, Midjourney bắt không khí, ChatGPT Images bắt chữ."
      >
        <ArticleCompare
          before={{
            label: "Midjourney V8.1 · diffusion",
            value: "không khí đẹp",
            note: "Quán phở chuẩn không khí, ánh sáng vàng kiểu phim Kodak. Biển hiệu ra 'PHO BO NGOM'. Tóm lại, mood rất tốt, tiếng Việt có dấu vẫn là vùng yếu.",
          }}
          after={{
            label: "ChatGPT Images 2.0 · token + thinking",
            value: "biển hiệu đúng",
            note: "Quán phở trông như ảnh chụp điện thoại. Biển hiệu in đúng 'PHỞ BÒ NGON' từng dấu. Tóm lại, chữ chính xác, ràng buộc chặt, multi-image consistency tốt, mood là điểm yếu.",
          }}
        />
        <ArticleProse>
          <p>
            Đem cả hai ra thi cùng bốn loại prompt khác nhau, kết quả tách
            ra rất rõ. Loại đầu tiên đã thấy ở trên: một cảnh có chữ Việt cụ
            thể trong ảnh. Một bài test được Tom&apos;s Guide chạy hồi tháng
            4 năm 2026 cũng cho ra cùng pattern với chữ tiếng Anh đơn
            giản: prompt yêu cầu một chai nước ghi chữ &ldquo;CLARITY&rdquo;,
            Midjourney V7 trả về &ldquo;CLARTIY&rdquo; (đảo hai chữ I và T),
            ChatGPT Images 2.0 trả về đúng &ldquo;CLARITY&rdquo;. V8.1 cải
            thiện được trường hợp tiếng Anh khi đặt chữ trong dấu ngoặc kép,
            nhưng tiếng Việt có dấu vẫn lệch.
          </p>
          <p>
            Loại prompt thứ hai là chân dung phong cách điện ảnh, ví dụ{" "}
            <i>
              &ldquo;một ông cụ cầm cốc trà, ánh sáng cửa sổ buổi chiều, máy
              phim Kodak Portra 400&rdquo;
            </i>
            . Midjourney dựng được không khí cinematic gần như nguyên bản,
            kèm hạt phim, bokeh và ánh sáng vàng đặc trưng của Portra.
            ChatGPT Images 2.0 vẽ ra một bức nhìn được, đúng prompt, nhưng
            cảm giác phim chiều nhập nhoạng phải tự cảm rất kĩ mới thấy.
            Đây là vùng Midjourney thắng dứt khoát.
          </p>
          <p>
            Loại prompt thứ ba là infographic có nhiều chữ, ví dụ{" "}
            <i>
              &ldquo;biểu đồ so sánh GDP Việt Nam và Indonesia 2015 đến
              2025, tiêu đề tiếng Anh, chú thích tiếng Việt&rdquo;
            </i>
            . Midjourney sinh ra một thứ trông giống biểu đồ. Các số sai
            gần như toàn bộ, chữ &ldquo;GDP&rdquo; có khi thành
            &ldquo;GBP&rdquo; hoặc
            &ldquo;GPD&rdquo;, chú thích tiếng Việt biến thành chữ
            giả-Việt-Nam. ChatGPT Images 2.0 với thinking mode bật lên còn
            đi xa hơn: model bật web search, tra số liệu GDP thực tế, dựng
            biểu đồ có số đúng và chữ đúng cả hai thứ tiếng. Đây là vùng
            ChatGPT Images 2.0 thắng dứt khoát.
          </p>
          <p>
            Loại prompt thứ tư là chỉnh sửa nhiều lượt, ví dụ vẽ một nhân
            vật hoạt hình rồi nói &ldquo;đổi áo sang màu xanh dương, thêm
            kính đen, giữ nguyên gương mặt&rdquo;. Midjourney có chức năng{" "}
            <code>--cref</code> để giữ nhân vật, nhưng mỗi lần chỉnh là một
            bức ảnh mới và phải tinh chỉnh prompt. Trong khi đó, ChatGPT
            Images 2.0 chỉnh sửa qua chat một cách trực tiếp: gửi ảnh, nhập
            câu lệnh, nhận lại bức mới với phần thay đổi đúng yêu cầu, các
            phần khác giữ nguyên. Bản 2.0 còn sinh được tới 8 bức cùng lúc
            mà giữ được nhân vật và đồ vật nhất quán xuyên suốt loạt ảnh.
            Đây là vùng ChatGPT Images 2.0 thắng nhờ kiến trúc, không phải
            nhờ ép tham số.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="04 · Đánh đổi"
        heading="Midjourney mạnh ở mood, ChatGPT Images mạnh ở chữ và ràng buộc."
      >
        <ArticleProse>
          <p>
            Có thể tổng kết bằng hai bảng đối xứng. Midjourney V8.1 mạnh ở
            mood, ánh sáng, kết cấu vật liệu, không khí phim cinematic, các
            phong cách hội hoạ. Yếu ở chữ trong ảnh (đặc biệt tiếng Việt có
            dấu), ràng buộc chính xác về nội dung, tính nhất quán giữa
            nhiều bức trong cùng một bộ. ChatGPT Images 2.0 thì ngược lại,
            mạnh ở chữ trong ảnh đa ngôn ngữ, làm theo lệnh chi tiết nhiều
            ràng buộc, chỉnh sửa từng phần qua chat, sinh tới 8 bức cùng
            lúc mà giữ nhân vật nhất quán, ảnh có cảm giác photorealistic.
            Yếu ở cảm giác nghệ thuật, mood phim cinematic, các phong cách
            lạ như hội hoạ Đông Á truyền thống hay tranh sơn mài.
          </p>
          <p>
            Hai điểm yếu trên không phải lỗi. Chúng là hệ quả tất yếu
            của việc hai kiến trúc cùng được tối ưu cho hai mục tiêu khác
            nhau. Nếu một mạng đặt instruction-following lên cao nhất thì
            nó sẽ phải hi sinh phần thẩm mỹ chủ quan. Nếu một mạng đặt
            thẩm mỹ chủ quan lên cao nhất thì nó phải hi sinh phần ràng
            buộc cứng. Image Arena tháng 4 năm 2026 cho ChatGPT Images
            2.0 lên hạng nhất ở mọi hạng mục với cách biệt 242 điểm,
            nhưng đó là điểm tổng hợp ưu tiên độ chính xác. Trong các
            test thuần aesthetic-only do designer chấm, Midjourney vẫn
            thắng nhiều.
          </p>
        </ArticleProse>
        <TradeoffViz />
      </ArticleSection>

      <ArticleSection
        eyebrow="05 · Dùng khi nào"
        heading="Midjourney cho concept và mood, ChatGPT Images cho thiết kế và chữ."
      >
        <ArticleProse>
          <p>
            Quy tắc thực tế: nếu bạn đang dựng concept, mood board, nhân
            vật trong truyện, bìa nhạc, hay ảnh không khí cho bài viết, thì
            Midjourney V8.1 là lựa chọn an toàn. Bức ra hầu như luôn đẹp,
            kể cả khi prompt còn vụng. Đây là công cụ cho người sáng tạo
            tìm hứng. Giá khởi điểm 10 USD/tháng cho gói Basic, không có
            tier free.
          </p>
          <p>
            Trong khi đó, nếu bạn đang làm thiết kế có chữ (poster, social
            card, infographic, sách hướng dẫn, slide), hoặc muốn chỉnh sửa
            lặp đi lặp lại trên cùng một bức cho đến khi nó chính xác như
            ý, thì ChatGPT Images 2.0 ưu thế hơn rõ rệt. Đây là công cụ cho
            người làm sản phẩm cần kiểm soát. Người dùng free đã có sẵn
            instant mode trong ChatGPT, đủ cho các tác vụ đơn giản. Thinking
            mode (suy luận trước khi vẽ, web search, multi-image batching)
            cần gói Plus 20 USD/tháng hoặc Pro 200 USD/tháng.
          </p>
          <p>
            Nhiều designer chuyên nghiệp dùng cả hai trong cùng một quy
            trình. Bước concept dùng Midjourney để khám phá hướng. Bước
            hoàn thiện có chữ dùng ChatGPT Images 2.0 với thinking mode bật
            để đẩy tới sản phẩm cuối. Bước cuối cùng vẫn cần Photoshop hoặc
            Figma cho phần con người không thể nhường cho mạng nơ-ron
            quyết, ví dụ căn chỉnh layout chính xác đến pixel hay đặt logo
            lên đúng vị trí kerning.
          </p>
          <p>
            Bạn không phải chọn một bên. Hiểu kiến trúc của từng bên cho
            phép bạn chọn đúng công cụ cho đúng việc. Đó là cách tiết kiệm
            thực sự lớn hơn cả phí subscription, vì thời gian sửa đi sửa
            lại trong công cụ sai luôn đắt hơn nhiều so với phí dùng đúng
            công cụ ngay từ đầu.
          </p>
        </ArticleProse>
      </ArticleSection>
    </ArticleShell>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Hero viz — split canvas. Left = Midjourney (painterly blobs in
 * clay/peach, scrambled "PHO BO NGOM" sign). Right = ChatGPT Image
 * (token grid in turquoise, correct "PHỞ BÒ NGON" sign). The
 * difference in shape (organic blobs vs grid) reads as the difference
 * in mechanism (continuous diffusion vs discrete tokens) without
 * having to render real generated images.
 * ────────────────────────────────────────────────────────────── */
export function ImageGenSplitHeroViz() {
  return (
    <svg
      viewBox="0 0 900 340"
      className="ar-viz"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="So sánh: Midjourney V8.1 vẽ biển hiệu sai chính tả 'PHO BO NGOM', ChatGPT Images 2.0 vẽ đúng 'PHỞ BÒ NGON'"
    >
      <defs>
        <linearGradient id="mj-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--peach-200)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="var(--clay)" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="gpt-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--turquoise-50)" />
          <stop offset="100%" stopColor="var(--bg-card)" />
        </linearGradient>
        <radialGradient id="mj-blob1" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="var(--clay)" stopOpacity="0.7" />
          <stop offset="100%" stopColor="var(--clay)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="mj-blob2" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="var(--peach-500)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="var(--peach-500)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="900" height="340" fill="var(--bg-card)" />

      {/* Title strip */}
      <text
        x="40"
        y="36"
        fontFamily="var(--font-mono)"
        fontSize="11"
        fill="var(--turquoise-ink)"
        letterSpacing="0.1em"
      >
        / DIFFUSION VS TOKEN · CÙNG MỘT PROMPT
      </text>

      {/* Left half: Midjourney */}
      <g>
        <rect x="40" y="60" width="380" height="220" rx="8" fill="url(#mj-bg)" />
        {/* organic blobs */}
        <ellipse cx="160" cy="140" rx="80" ry="60" fill="url(#mj-blob1)" />
        <ellipse cx="280" cy="180" rx="70" ry="55" fill="url(#mj-blob2)" />
        <ellipse cx="220" cy="220" rx="60" ry="40" fill="url(#mj-blob1)" />
        {/* scrambled sign */}
        <rect
          x="120"
          y="100"
          width="220"
          height="34"
          rx="2"
          fill="var(--paper)"
          stroke="var(--clay)"
          strokeWidth={1.5}
          opacity={0.92}
        />
        <text
          x="230"
          y="124"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="18"
          fontWeight={700}
          fill="var(--clay)"
          letterSpacing="0.04em"
        >
          PHO BO NGOM
        </text>
        <text
          x="230"
          y="252"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="10"
          fill="var(--text-tertiary)"
          letterSpacing="0.16em"
        >
          MIDJOURNEY · KHÔNG KHÍ ĐẸP
        </text>
      </g>

      {/* Right half: ChatGPT Image */}
      <g>
        <rect
          x="480"
          y="60"
          width="380"
          height="220"
          rx="8"
          fill="url(#gpt-bg)"
        />
        {/* token grid: left-to-right autoregressive fill, last cell ringed */}
        {Array.from({ length: 12 }).map((_, col) =>
          Array.from({ length: 7 }).map((__, row) => {
            const linearIdx = row * 12 + col;
            const totalCells = 12 * 7;
            const filledThreshold = Math.floor(totalCells * 0.78);
            const isFilled = linearIdx < filledThreshold;
            const isLast = linearIdx === filledThreshold - 1;
            return (
              <rect
                key={`tok-${col}-${row}`}
                x={486 + col * 31}
                y={66 + row * 31}
                width={28}
                height={28}
                rx={2}
                fill={isFilled ? "var(--turquoise-500)" : "var(--paper)"}
                stroke={isLast ? "var(--turquoise-700)" : "none"}
                strokeWidth={isLast ? 2 : 0}
                opacity={isFilled ? 0.78 : 0.45}
              />
            );
          }),
        )}
        {/* correct sign */}
        <rect
          x="560"
          y="100"
          width="220"
          height="34"
          rx="2"
          fill="var(--paper)"
          stroke="var(--turquoise-700)"
          strokeWidth={1.5}
          opacity={0.96}
        />
        <text
          x="670"
          y="124"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="18"
          fontWeight={700}
          fill="var(--turquoise-ink)"
          letterSpacing="0.04em"
        >
          PHỞ BÒ NGON
        </text>
        <text
          x="670"
          y="252"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="10"
          fill="var(--text-tertiary)"
          letterSpacing="0.16em"
        >
          CHATGPT IMAGES 2.0 · CHỮ ĐÚNG
        </text>
      </g>

      {/* Caption strip */}
      <line
        x1="40"
        y1="298"
        x2="860"
        y2="298"
        stroke="var(--border)"
        strokeWidth={1}
      />
      <text
        x="40"
        y="320"
        fontFamily="var(--font-mono)"
        fontSize="10"
        fill="var(--text-tertiary)"
        letterSpacing="0.08em"
      >
        DIFFUSION TỐI ƯU CẢM XÚC · TOKEN TỐI ƯU LỆNH · 05 · 2026
      </text>
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Section 02 viz — diffusion (noise to image, all-at-once denoising
 * in N steps) vs token (left-to-right autoregressive grid). Two
 * panels showing the mechanism shape, no text on the canvases.
 * ────────────────────────────────────────────────────────────── */
function ArchitectureSplitViz() {
  return (
    <ArticleViz caption="Diffusion (trên) khử nhiễu cùng lúc trên toàn bức qua nhiều bước. Token (dưới) sinh ra từng ô một theo thứ tự, mỗi ô chỉ thấy các ô đã sinh trước nó.">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 16,
        }}
      >
        {/* Diffusion strip */}
        <div
          style={{
            padding: "16px 20px",
            background: "var(--paper-2)",
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
              marginBottom: 10,
            }}
          >
            Diffusion · Midjourney
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {[0.95, 0.7, 0.45, 0.22, 0.05].map((noise, i) => (
              <div
                key={`diff-${i}`}
                style={{
                  flex: 1,
                  aspectRatio: "1",
                  position: "relative",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: `radial-gradient(ellipse at 45% 55%, var(--peach-500), transparent 65%)`,
                    opacity: 1 - noise,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: `repeating-conic-gradient(var(--graphite) 0% 1%, transparent 1% 2%)`,
                    opacity: noise,
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    bottom: 4,
                    right: 6,
                    fontFamily: "var(--font-mono)",
                    fontSize: 9,
                    color: "var(--text-tertiary)",
                  }}
                >
                  bước {i + 1}
                </span>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 8,
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--text-tertiary)",
              letterSpacing: "0.12em",
              textAlign: "center",
              textTransform: "uppercase",
            }}
          >
            nhiễu cao &nbsp;→&nbsp; ảnh rõ
          </div>
        </div>

        {/* Token strip */}
        <div
          style={{
            padding: "16px 20px",
            background: "var(--paper-2)",
            border: "1px solid var(--border)",
            borderLeft: "4px solid var(--turquoise-500)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--turquoise-ink)",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              fontWeight: 700,
              marginBottom: 10,
            }}
          >
            Token autoregressive · ChatGPT Images 2.0
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(20, 1fr)",
              gap: 3,
            }}
          >
            {Array.from({ length: 60 }).map((_, i) => {
              const filled = i < 38;
              const isLast = i === 37;
              return (
                <div
                  key={`tok-${i}`}
                  style={{
                    aspectRatio: "1",
                    background: filled
                      ? "var(--turquoise-500)"
                      : "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: 2,
                    opacity: filled ? (isLast ? 1 : 0.7) : 0.6,
                    boxShadow: isLast
                      ? `0 0 0 2px var(--turquoise-700)`
                      : undefined,
                  }}
                />
              );
            })}
          </div>
          <div
            style={{
              marginTop: 8,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--text-tertiary)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            <span>token đầu tiên</span>
            <span style={{ color: "var(--turquoise-700)", fontWeight: 700 }}>
              đang sinh token 38/60 →
            </span>
            <span>chưa sinh</span>
          </div>
        </div>
      </div>
    </ArticleViz>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Section 04 viz — head-to-head trade-off table. Strengths in
 * green ticks, weaknesses in muted dashes.
 * ────────────────────────────────────────────────────────────── */
function TradeoffViz() {
  const rows: Array<[string, "mj" | "gpt" | "tie"]> = [
    ["Mood + ánh sáng cinematic", "mj"],
    ["Phong cách hội hoạ lạ", "mj"],
    ["Kết cấu vật liệu", "mj"],
    ["Chữ đa ngôn ngữ trong ảnh", "gpt"],
    ["Tiếng Việt có dấu", "gpt"],
    ["Chỉnh sửa qua chat", "gpt"],
    ["Multi-image consistency (8 ảnh)", "gpt"],
    ["Thinking mode + web search", "gpt"],
    ["Tốc độ render đơn ảnh", "tie"],
  ];
  return (
    <ArticleViz caption="Mỗi dòng là một loại yêu cầu thực tế. ● bên nào đậm hơn là bên thắng rõ rệt. ◐ là ngang nhau. Bảng nghiêng về ChatGPT Images 2.0 vì các capability mới thinking mode và multi-image vốn là điểm Midjourney chưa có.">
      <div
        style={{
          background: "var(--paper-2)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 120px 120px",
            padding: "10px 16px",
            background: "var(--bg-card)",
            borderBottom: "1px solid var(--border)",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--text-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            fontWeight: 700,
          }}
        >
          <span>Tiêu chí</span>
          <span style={{ textAlign: "center", color: "var(--clay)" }}>
            Midjourney
          </span>
          <span
            style={{ textAlign: "center", color: "var(--turquoise-ink)" }}
          >
            ChatGPT Images 2.0
          </span>
        </div>
        {rows.map(([label, winner]) => (
          <div
            key={label}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 120px 120px",
              padding: "12px 16px",
              borderBottom: "1px solid var(--border)",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 14,
                color: "var(--text-primary)",
                fontWeight: 500,
              }}
            >
              {label}
            </span>
            <span style={{ textAlign: "center" }}>
              <Mark
                strong={winner === "mj"}
                tie={winner === "tie"}
                tone="clay"
              />
            </span>
            <span style={{ textAlign: "center" }}>
              <Mark
                strong={winner === "gpt"}
                tie={winner === "tie"}
                tone="turquoise"
              />
            </span>
          </div>
        ))}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 18,
            padding: "10px 16px",
            background: "var(--bg-card)",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--text-tertiary)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          <span>
            <span
              style={{ color: "var(--text-primary)", fontWeight: 700 }}
            >
              ●
            </span>{" "}
            thắng rõ
          </span>
          <span>
            <span style={{ opacity: 0.35 }}>○</span> yếu hơn
          </span>
          <span>
            <span style={{ color: "var(--text-tertiary)" }}>◐</span>{" "}
            ngang nhau
          </span>
        </div>
      </div>
    </ArticleViz>
  );
}

function Mark({
  strong,
  tie,
  tone,
}: {
  strong: boolean;
  tie: boolean;
  tone: "clay" | "turquoise";
}) {
  const color =
    tone === "clay" ? "var(--clay)" : "var(--turquoise-700)";
  if (tie) {
    return (
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          color: "var(--text-tertiary)",
        }}
      >
        ◐
      </span>
    );
  }
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 16,
        color: strong ? color : "var(--text-tertiary)",
        fontWeight: strong ? 700 : 400,
        opacity: strong ? 1 : 0.35,
      }}
    >
      {strong ? "●" : "○"}
    </span>
  );
}
