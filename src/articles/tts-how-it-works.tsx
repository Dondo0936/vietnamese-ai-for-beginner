import {
  ArticleShell,
  ArticleSection,
  ArticleProse,
  ArticleViz,
  Term,
} from "@/components/article";
import { articleMap } from "./registry";

const meta = articleMap["tts-how-it-works"]!;

/**
 * Explainer: text-to-speech pipeline as used by ElevenLabs et al.
 * Walks from a plain input sentence through text normalisation,
 * grapheme-to-phoneme, prosody, acoustic model, and vocoder, ending
 * with voice cloning and the ethics of synthetic voices. Follows the
 * scene-first, no-em-dash body voice from writing-vietnamese-technical.
 */
export default function TtsHowItWorksArticle() {
  return (
    <ArticleShell meta={meta} heroViz={<TtsHeroViz />}>
      <ArticleSection eyebrow="01 · Ý tưởng">
        <ArticleProse>
          <p>
            Bạn mở Google Maps, bấm dẫn đường về nhà. Một giọng nói
            vang lên trong xe: &ldquo;Rẽ phải tại ngã tư Nguyễn Huệ
            sau 200 mét&rdquo;. Giọng đó không phải ai đọc sẵn từng
            câu trong phòng thu. Toàn bộ câu nói vừa được máy ghép
            ra trong chưa tới một giây, từ một chuỗi ký tự thuần mà
            app vừa tính ra từ bản đồ.
          </p>
          <p>
            Hiện tượng đó được gọi là{" "}
            <Term slug="tts">text-to-speech</Term> (TTS). Đầu vào là
            một đoạn văn bản bình thường. Đầu ra là một đoạn âm
            thanh nghe như người thật đang đọc. Nhìn từ ngoài trông
            đơn giản, nhưng ở giữa có năm sáu bước rất kỹ thuật,
            mỗi bước phụ trách một phần nhỏ của cảm giác &ldquo;nghe
            y như người&rdquo;.
          </p>
          <p>
            Bài viết này mổ xẻ chuỗi các bước đó theo thứ tự một câu
            tiếng Việt đi qua pipeline của một TTS hiện đại, lấy{" "}
            <b>ElevenLabs</b> làm mốc tham chiếu vì đây là hệ thống
            thương mại có tài liệu kỹ thuật công khai nhất hiện
            nay. Cuối bài nói tới voice cloning và những rủi ro mà
            cùng một pipeline tạo ra khi rơi vào tay kẻ xấu.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="02 · Cơ chế"
        heading="Pipeline từ chữ đến sóng âm"
      >
        <ArticleProse>
          <p>
            Ở mức cao nhất, một TTS model hiện đại không làm một
            phép biến đổi duy nhất từ chữ sang âm. Nó chia việc đó
            thành một dây chuyền năm khối, mỗi khối nhận đầu ra
            của khối trước, chế biến thêm, rồi đẩy sang khối sau.
            Bố cục đó cho phép mỗi khối được huấn luyện riêng với
            dữ liệu chuyên biệt, và cho phép thay một khối mới mà
            không phá vỡ toàn bộ hệ thống.
          </p>
          <p>
            Câu &ldquo;Chào bạn, hôm nay 23 tháng 4 năm 2026&rdquo;
            đi qua pipeline như sau. Đầu tiên{" "}
            <b>text normalisation</b> viết lại các con số và ký
            hiệu thành dạng chữ đọc được. Sau đó{" "}
            <b>grapheme-to-phoneme</b> (G2P) chuyển từng chữ thành
            chuỗi{" "}
            <Term slug="tts">phoneme</Term>, tức là đơn vị âm
            thanh nhỏ nhất phân biệt nghĩa trong ngôn ngữ. Tiếp
            theo <b>prosody model</b> quyết định nhịp, cao độ, và
            chỗ nhấn cho từng phoneme. Bộ <b>acoustic model</b>{" "}
            biến chuỗi phoneme kèm prosody thành một bảng năng
            lượng theo tần số và thời gian. Cuối cùng{" "}
            <b>vocoder</b> chuyển bảng năng lượng đó thành sóng âm
            thật mà loa có thể phát.
          </p>
          <p>
            Năm khối, năm model nhỏ, chạy nối tiếp. Từ bên ngoài,
            người dùng chỉ thấy duy nhất khoảng trễ từ lúc gõ chữ
            đến lúc loa kêu, thường nằm trong vài trăm ms với một
            server TTS được tối ưu.
          </p>
        </ArticleProse>
        <PipelineFlowViz />
      </ArticleSection>

      <ArticleSection
        eyebrow="03 · Chuẩn hoá văn bản"
        heading="Đọc con số, không phải nhìn con số"
      >
        <ArticleProse>
          <p>
            Đưa cho một người Việt chuỗi ký tự <code>23/4/2026</code>
            , họ biết phải đọc là &ldquo;ngày hai mươi ba tháng tư
            năm hai nghìn không trăm hai mươi sáu&rdquo;. Đưa chính
            chuỗi đó cho một acoustic model, nó không hiểu. Model
            chỉ có quan hệ giữa chuỗi ký tự và âm thanh tương ứng
            đã thấy trong dữ liệu huấn luyện. Chuỗi{" "}
            <code>23/4/2026</code> gần như không bao giờ xuất hiện
            nguyên văn trong tập audio huấn luyện, nên không có âm
            thanh đáng tin nào gắn với nó.
          </p>
          <p>
            Bước đầu tiên trong pipeline, <b>text normalisation</b>,
            giải quyết đúng vấn đề này. Một tập quy tắc cứng viết
            tay cộng với một model nhỏ đọc đoạn đầu vào, phát hiện
            các token đặc biệt, rồi viết lại chúng thành dạng đã
            có trong tập huấn luyện.
          </p>
          <p>
            Vài ví dụ trên tiếng Việt. Số{" "}
            <code>123</code> biến thành &ldquo;một trăm hai mươi
            ba&rdquo;. Viết tắt <code>TP.HCM</code> biến thành
            &ldquo;Thành phố Hồ Chí Minh&rdquo;. Số điện thoại{" "}
            <code>0903123456</code> biến thành &ldquo;không chín
            không ba, một hai ba, bốn năm sáu&rdquo; với nhịp
            nhóm ba chữ số. Ngày <code>23/4/2026</code> biến thành
            &ldquo;ngày hai mươi ba tháng tư năm hai nghìn không
            trăm hai mươi sáu&rdquo;. Mỗi quy tắc đi kèm một bộ
            heuristic cho ngữ cảnh: <code>12/3</code> có thể là
            ngày tháng, có thể là phân số, có thể là tỷ số trận
            đấu. Model hay hệ thống phía sau cần nhìn cả câu chứ
            không chỉ token rời.
          </p>
          <p>
            Tới cuối bước này, đầu vào không còn ký tự lạ nào. Toàn
            bộ chuỗi đều là từ đọc được. Đây cũng là bước quyết
            định phần lớn cảm giác &ldquo;TTS này nói tiếng Việt
            tự nhiên chưa&rdquo;: một pipeline dịch con số và từ
            viết tắt sai sẽ nghe lộ máy ngay từ giây đầu.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="04 · Phoneme"
        heading="Chữ viết và âm đọc không trùng nhau"
      >
        <ArticleProse>
          <p>
            Bạn nhìn chữ <code>phở</code>. Bạn đọc ra âm /fəː˧˩˧/.
            Giữa cái bạn nhìn và cái bạn phát ra có một bước dịch
            mà não bạn làm tự động, gần như miễn phí. Một TTS
            model cũng phải làm bước đó, gọi là{" "}
            <b>grapheme-to-phoneme</b> (G2P). Grapheme là ký tự
            trên trang. <b>Phoneme</b> là đơn vị âm thanh nhỏ
            nhất phân biệt nghĩa giữa hai từ trong cùng một
            ngôn ngữ.
          </p>
          <p>
            Lý do cần bước này nằm ở chỗ chữ viết và âm đọc không
            tương ứng một-một. Tiếng Anh có chữ <code>read</code>{" "}
            đọc thành /riːd/ ở thì hiện tại và /rɛd/ ở thì quá
            khứ. Tiếng Việt đỡ hơn nhờ bảng chữ cái latin đã được
            thiết kế theo âm, nhưng vẫn có trường hợp phụ âm
            ghép: <code>gi</code> trước <code>a</code> đọc là /z/
            ở Bắc và /j/ ở Nam, <code>ph</code> luôn đọc là /f/
            chứ không phải hai âm /p/ và /h/ ghép lại. Dấu thanh
            cũng cần được nhận ra riêng để phoneme mang đủ thông
            tin cho bước prosody sau đó.
          </p>
          <p>
            Các G2P model hiện đại là một seq2seq nhỏ, thường cỡ
            vài triệu tham số. Đầu vào là chuỗi ký tự, đầu ra là
            chuỗi phoneme trong bảng ký hiệu IPA hoặc một bảng nội
            bộ do nhóm làm TTS tự định nghĩa. Model này được huấn
            luyện trên một bảng tra thủ công cỡ trăm nghìn từ
            cộng với tập audio đã được gắn nhãn phoneme. Với từ
            mới hoặc tên riêng chưa xuất hiện trong bảng tra, model
            suy ra phoneme dựa trên mẫu chính tả học được, gần
            giống cách bạn đọc tên nước ngoài lần đầu.
          </p>
        </ArticleProse>
        <PhonemeMapViz />
      </ArticleSection>

      <ArticleSection
        eyebrow="05 · Prosody"
        heading="Cùng câu, khác dấu, khác nhạc"
      >
        <ArticleProse>
          <p>
            Gõ câu &ldquo;ăn chưa&rdquo; vào một TTS với dấu hỏi ở
            cuối. Nghe thấy cao độ đi lên ở âm cuối, ngữ điệu hỏi
            rõ ràng. Đổi dấu hỏi thành dấu chấm, gõ lại. Cùng một
            chuỗi phoneme, nhưng ngữ điệu đi ngang, thành một câu
            kể. Bước phụ trách sự khác biệt đó là{" "}
            <b>prosody model</b>.
          </p>
          <p>
            Prosody, tức <b>nhịp điệu</b>, là tập hợp ba tín hiệu
            trên mỗi phoneme: độ dài (duration), cao độ (pitch
            contour), và năng lượng (energy). Ba tín hiệu này
            quyết định một câu nghe như đang hỏi, đang kể, đang
            ngắt giữa hai ý, hay đang nhấn vào một từ quan trọng.
            Không có prosody, chuỗi phoneme đúng đến đâu cũng
            phát ra như một dòng chữ đọc đều đều, nghe máy móc
            tức thì.
          </p>
          <p>
            Prosody model nhận hai thứ: chuỗi phoneme đã sinh ở
            bước G2P, và một ngữ cảnh từ câu nguồn (dấu câu,
            trọng âm từ loại, nhãn cảm xúc nếu người dùng bật
            tuỳ chọn đó). Nó xuất ra một pitch contour (đường
            cong cao độ theo thời gian) và một bảng duration cho
            biết mỗi phoneme nên kéo dài bao lâu. Đây là khối
            nhỏ nhưng ảnh hưởng lớn: phần lớn khoảng cách cảm
            nhận giữa TTS rẻ và TTS đắt nằm ở chất lượng của
            prosody, không phải ở acoustic model.
          </p>
        </ArticleProse>
        <PitchContourViz />
      </ArticleSection>

      <ArticleSection
        eyebrow="06 · Acoustic model"
        heading="Từ âm vị đến bản đồ năng lượng"
      >
        <ArticleProse>
          <p>
            Sau G2P và prosody, pipeline đã có chuỗi phoneme kèm
            pitch, duration, energy cho từng âm. Bước tiếp theo
            là biến mớ đó thành một đối tượng trung gian mà vocoder
            ở cuối có thể đọc được. Đối tượng đó là{" "}
            <b>mel-spectrogram</b>.
          </p>
          <p>
            Một{" "}
            <Term slug="speech-recognition">mel-spectrogram</Term>{" "}
            là một bảng số hai chiều: trục ngang là thời gian cắt
            thành các khung nhỏ cỡ 10ms, trục dọc là tần số, mỗi
            ô chứa năng lượng âm thanh ở khung thời gian và tần
            số đó. Nhìn bằng mắt, nó giống một biểu đồ nhiệt,
            chỗ sáng là năng lượng cao, chỗ tối là im lặng. Trục
            tần số được chia theo thang mel, thang phi tuyến
            được thiết kế theo độ nhạy của tai người: tai nghe rõ
            khác biệt giữa 200Hz và 400Hz hơn là giữa 10kHz và
            10.2kHz, nên bảng dồn phân giải về phía tần số thấp.
          </p>
          <p>
            Acoustic model, thường là một transformer seq2seq kiểu
            FastSpeech hoặc một diffusion model, học quan hệ giữa
            (phoneme + prosody) và mel-spectrogram tương ứng. Nó
            được huấn luyện trên hàng nghìn giờ audio người thật
            đã được cắt khớp theo phoneme và bóc sẵn mel-spectrogram.
            Đầu ra là một bảng số chứ chưa phải âm thanh. Bảng
            này đẹp ở chỗ nó nhỏ, mịn, và dễ dự đoán hơn sóng âm
            thô: ở bước này model làm việc với vài chục khung
            trên một giây, thay vì hàng chục nghìn mẫu.
          </p>
        </ArticleProse>
        <MelSpectrogramViz />
      </ArticleSection>

      <ArticleSection
        eyebrow="07 · Vocoder"
        heading="Vocoder dựng sóng âm thật"
      >
        <ArticleProse>
          <p>
            Mel-spectrogram chưa phát được qua loa. Loa cần một
            chuỗi mẫu sóng âm ở tốc độ 22050 hoặc 44100 mẫu trên
            giây. Bước cuối cùng của pipeline làm đúng việc dựng
            lại sóng âm đó từ bảng năng lượng. Bước này do một{" "}
            <b>vocoder</b> đảm nhiệm.
          </p>
          <p>
            Thế hệ vocoder đầu tiên dùng một thuật toán xác định
            tên là Griffin-Lim. Nó ước lượng pha bị mất khi chuyển
            từ sóng âm sang spectrogram bằng cách lặp đi lặp lại
            một phép biến đổi Fourier thuận nghịch. Cách này rẻ,
            nhưng âm ra khô, lộ vết kim loại ở âm xát và âm bật.
            Thế hệ sau, khởi đầu bằng WaveNet của DeepMind năm
            2016, thay bằng một mạng nơ-ron tự hồi quy: sinh ra
            từng mẫu sóng âm một, mỗi mẫu phụ thuộc vào các mẫu
            đã sinh trước đó và vào mel-spectrogram đầu vào. Chất
            lượng gần như bằng giọng người, nhưng chạy chậm vì
            phải sinh tuần tự tới 22050 bước mỗi giây audio.
          </p>
          <p>
            Thế hệ đang chạy trong ElevenLabs và các hệ thống
            thương mại tương đương là vocoder dạng song song, đại
            diện phổ biến nhất là <b>HiFi-GAN</b>. Đây là một
            generator GAN được huấn luyện đối kháng với hai
            discriminator, sinh một khối mẫu sóng âm trong một
            lần forward thay vì từng mẫu một. Tốc độ nhanh hơn
            WaveNet cỡ vài trăm lần trên cùng phần cứng, với chất
            lượng xấp xỉ. Nhánh mới hơn nữa dùng diffusion model
            (WaveGrad, DiffWave), đánh đổi tốc độ lấy một ít chất
            lượng ở âm cuối dải cao.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="08 · Voice cloning"
        heading="30 giây để học một giọng"
      >
        <ArticleProse>
          <p>
            Một tính năng nổi bật của ElevenLabs là cho người dùng
            upload khoảng 30 giây đến vài phút thu âm giọng của
            mình, rồi tổng hợp câu mới bằng chính giọng đó. Hiện
            tượng này gọi là <b>voice cloning</b>, nhân bản giọng.
            Với một pipeline truyền thống, để có một giọng đọc
            mới cần vài chục giờ thu âm và một lần huấn luyện lại
            acoustic model. Giảm xuống còn 30 giây đòi hỏi một
            cách tiếp cận khác.
          </p>
          <p>
            Kỹ thuật chủ đạo là <b>speaker embedding</b>. Một
            encoder riêng, được huấn luyện trên hàng nghìn giọng
            khác nhau, học cách biến bất kỳ đoạn audio ngắn nào
            thành một vector vài trăm chiều đại diện cho đặc
            điểm của người nói: tần số cơ bản, hình thái formant,
            màu giọng, cách hít thở. Acoustic model và vocoder
            khi tổng hợp câu mới được điều hoà (conditioned) trên
            vector này. Nói cách khác, pipeline vẫn chạy năm
            bước như cũ, nhưng mỗi bước &ldquo;biết&rdquo; đang
            phải phát ra giọng ai.
          </p>
          <p>
            Kết quả là một giọng đọc gần giống bản gốc, đủ để
            qua mặt người quen trong một cuộc gọi ngắn. Càng
            nhiều audio tham chiếu (đi từ 30 giây lên vài phút
            lên vài giờ), độ giống càng cao và tay nghề giọng
            càng đa dạng. Hệ thống thương mại thêm một lớp
            fine-tune nhẹ cho các khách hàng professional, đẩy
            chất lượng lên mức có thể dùng cho audiobook dài
            hoặc podcast đều đặn.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="09 · Cạm bẫy và đạo đức"
        heading="Cùng một pipeline, hai mặt lợi hại"
      >
        <ArticleProse>
          <p>
            Voice cloning là trường hợp mẫu của một công nghệ hữu
            ích và nguy hiểm cùng lúc. Mặt hữu ích thì rõ: người
            mất giọng sau phẫu thuật lấy lại giọng cũ của mình,
            nhà làm phim dựng lại giọng diễn viên đã mất, studio
            tiểu thuyết audio sản xuất nhanh hơn vài bậc. Mặt
            nguy hiểm đã đi vào bản tin: kẻ gian ghép 30 giây
            giọng mẹ từ Facebook, gọi điện cho con cái dựng
            kịch bản cấp cứu, yêu cầu chuyển khoản gấp. Nạn nhân
            nhận ra giọng thân quen, bộ não tin ngay, tiền đi
            trước khi lý trí kịp kiểm chứng.
          </p>
          <p>
            Các biện pháp bảo vệ hiện tại đi theo hai hướng. Một,
            <b> audio watermark</b>: nhà cung cấp TTS nhúng một
            dấu hiệu rất nhỏ vào sóng âm, không nghe thấy nhưng
            máy phát hiện được. ElevenLabs công bố cơ chế này từ
            2023. Nhược điểm: watermark bị loại bỏ được nếu
            attacker biết cơ chế, và không áp dụng được cho TTS
            mã mở tự host. Hai, <b>model-level consent</b>:
            trước khi clone một giọng, hệ thống bắt người upload
            đọc một câu xác nhận ngẫu nhiên theo thời gian thực
            để khớp với audio gốc. Cách này ngăn được một phần
            trường hợp ghép giọng từ clip công khai trên mạng,
            nhưng chưa phải giải pháp toàn diện.
          </p>
          <p>
            Quy tắc thực tế cho người dùng phổ thông: nếu nhận
            một cuộc gọi khẩn cấp có yêu cầu tiền, dù giọng có
            quen đến đâu, gọi lại qua số cũ đã lưu trong danh
            bạ trước khi làm bất cứ điều gì. Đó là một thói quen
            rẻ, và nó vô hiệu hoá gần như toàn bộ kịch bản lừa
            đảo dựa trên voice cloning hiện nay.
          </p>
          <p>
            Nhìn cả pipeline, TTS hiện đại là một minh hoạ đẹp
            của nguyên tắc chia bài toán thành các module nhỏ:
            mỗi khối chỉ biết một việc, kết nối bằng một cấu trúc
            dữ liệu rõ ràng (ký tự, phoneme, mel-spectrogram,
            sóng âm). Chính sự tách lớp đó giúp ngành audio AI
            tiến bộ nhanh: cải tiến một khối không cần huấn
            luyện lại toàn bộ. Và cũng chính sự tách lớp đó, qua
            speaker embedding, biến một chiếc loa nhân tạo thành
            một bản sao giọng bất kỳ chỉ sau nửa phút nghe.
          </p>
        </ArticleProse>
      </ArticleSection>
    </ArticleShell>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Hero viz. A small waveform silhouette next to a short input line
 * ("Chào bạn.") with an arrow between. Communicates the core claim
 * of the article: plain text on the left, shaped waveform on the
 * right, pipeline in the middle.
 * ────────────────────────────────────────────────────────────── */
function TtsHeroViz() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        width: "100%",
        height: "100%",
        gap: 14,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.72em",
          color: "var(--text-tertiary)",
          textTransform: "uppercase",
          letterSpacing: "0.18em",
        }}
      >
        text → speech
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gap: 14,
          width: "100%",
          maxWidth: 520,
          alignItems: "center",
        }}
      >
        {/* Input text card */}
        <div
          style={{
            padding: "14px 16px",
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderLeft: "4px solid var(--text-tertiary)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.7em",
              color: "var(--text-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            input
          </div>
          <div
            style={{
              fontSize: "1.1em",
              color: "var(--text-primary)",
              fontWeight: 600,
            }}
          >
            Chào bạn.
          </div>
        </div>

        <div
          style={{
            fontSize: "1.2em",
            color: "var(--text-tertiary)",
          }}
        >
          →
        </div>

        {/* Output waveform card */}
        <div
          style={{
            padding: "14px 16px",
            background: "var(--bg-card)",
            border: `1px solid color-mix(in srgb, var(--accent) 28%, var(--border))`,
            borderLeft: "4px solid var(--accent)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.7em",
              color: "var(--accent)",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            waveform
          </div>
          <svg
            viewBox="0 0 200 40"
            style={{ width: "100%", height: 36 }}
            aria-hidden="true"
          >
            {Array.from({ length: 40 }).map((_, i) => {
              const h =
                6 +
                Math.round(
                  22 *
                    Math.abs(
                      Math.sin(i * 0.52) *
                        Math.cos(i * 0.19 + 1.2) *
                        Math.sin(i * 0.9 + 0.5),
                    ),
                );
              return (
                <rect
                  key={i}
                  x={i * 5}
                  y={(40 - h) / 2}
                  width={3}
                  height={h}
                  rx={1}
                  fill="var(--accent)"
                />
              );
            })}
          </svg>
        </div>
      </div>

      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.65em",
          color: "var(--text-tertiary)",
          textTransform: "uppercase",
          letterSpacing: "0.18em",
        }}
      >
        5 khối chạy nối tiếp ở giữa
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Section 02 viz. Horizontal pipeline: input text → normalise →
 * G2P → prosody → acoustic → vocoder → waveform. Each step is a
 * small labelled card. Uses a stepped colour scale from neutral
 * text tokens to accent.
 * ────────────────────────────────────────────────────────────── */
function PipelineFlowViz() {
  const steps: Array<{ label: string; role: string }> = [
    { label: "Chào bạn, 23/4.", role: "input" },
    { label: "Chào bạn, hai mươi ba tháng tư.", role: "normalise" },
    { label: "/ʨaːw˧˩ ɓaːn˦ / …", role: "G2P · phoneme" },
    { label: "pitch ↗ · dur ms", role: "prosody" },
    { label: "mel-spectrogram", role: "acoustic" },
    { label: "waveform", role: "vocoder" },
  ];
  return (
    <ArticleViz caption="Pipeline TTS hiện đại. Mỗi khối biến đổi đầu vào thành một dạng trung gian mà khối sau đọc được.">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          padding: "12px 6px",
        }}
      >
        {steps.map((s, i) => {
          const isLast = i === steps.length - 1;
          const isFirst = i === 0;
          const accent = isFirst
            ? "var(--text-tertiary)"
            : isLast
              ? "var(--accent)"
              : `color-mix(in srgb, var(--accent) ${20 + i * 12}%, var(--text-tertiary))`;
          return (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "120px 1fr",
                gap: 12,
                alignItems: "stretch",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.7em",
                  color: accent,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  fontWeight: 700,
                  textAlign: "right",
                }}
              >
                {s.role}
              </div>
              <div
                style={{
                  padding: "10px 14px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderLeft: `3px solid ${accent}`,
                  borderRadius: "var(--radius-md)",
                  fontFamily:
                    s.role === "G2P · phoneme" ||
                    s.role === "acoustic" ||
                    s.role === "vocoder"
                      ? "var(--font-mono)"
                      : "inherit",
                  fontSize: "0.95em",
                  color: "var(--text-primary)",
                }}
              >
                {s.label}
              </div>
            </div>
          );
        })}
      </div>
    </ArticleViz>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Section 04 viz. Three Vietnamese words with their phoneme mapping
 * below. Shows the grapheme-to-phoneme step concretely: same letters
 * can land on different phonemes depending on context.
 * ────────────────────────────────────────────────────────────── */
function PhonemeMapViz() {
  const pairs: Array<{ word: string; phonemes: string; note: string }> = [
    { word: "phở", phonemes: "/fəː˧˩˧/", note: "ph → /f/" },
    { word: "giá", phonemes: "/zaː˧˥/", note: "gi → /z/ (Bắc)" },
    { word: "ngủ", phonemes: "/ŋuː˧˩˧/", note: "ng → /ŋ/" },
  ];
  return (
    <ArticleViz caption="G2P dịch ký tự thành âm vị. Cùng chữ cái, ngữ cảnh khác, âm khác.">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 12,
          padding: "8px 4px",
        }}
      >
        {pairs.map((p) => (
          <div
            key={p.word}
            style={{
              padding: "14px 12px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "1.6em",
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              {p.word}
            </div>
            <div
              style={{
                fontSize: "1em",
                color: "var(--text-tertiary)",
              }}
            >
              ↓
            </div>
            <div
              style={{
                padding: "6px 12px",
                background: `color-mix(in srgb, var(--accent) 10%, var(--bg-card))`,
                border: `1px solid color-mix(in srgb, var(--accent) 30%, var(--border))`,
                borderRadius: 8,
                fontFamily: "var(--font-mono)",
                fontSize: "0.95em",
                fontWeight: 700,
                color: "var(--accent)",
              }}
            >
              {p.phonemes}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.65em",
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.14em",
              }}
            >
              {p.note}
            </div>
          </div>
        ))}
      </div>
    </ArticleViz>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Section 05 viz. Two pitch-contour mini charts: "ăn chưa?" rising
 * at the end versus "ăn chưa." flat at the end. Makes prosody
 * visible, not just a word in the paragraph.
 * ────────────────────────────────────────────────────────────── */
function PitchContourViz() {
  // Five phonemes across the x axis. y = pitch in arbitrary units.
  const phonemes = ["ă", "n", "ch", "ư", "a"];
  const questionPitch = [42, 44, 46, 52, 74];
  const statementPitch = [52, 50, 48, 46, 44];
  return (
    <ArticleViz caption='Cùng chuỗi phoneme "ăn chưa", prosody model chọn hai đường cao độ khác nhau tuỳ dấu câu.'>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          padding: "6px 4px",
        }}
      >
        <PitchChart
          label="ăn chưa?"
          tone="accent"
          phonemes={phonemes}
          pitch={questionPitch}
          legend="dấu hỏi · cao độ dâng lên cuối câu"
        />
        <PitchChart
          label="ăn chưa."
          tone="neutral"
          phonemes={phonemes}
          pitch={statementPitch}
          legend="dấu chấm · cao độ đi ngang rồi lặng"
        />
      </div>
    </ArticleViz>
  );
}

function PitchChart({
  label,
  phonemes,
  pitch,
  legend,
  tone,
}: {
  label: string;
  phonemes: string[];
  pitch: number[];
  legend: string;
  tone: "accent" | "neutral";
}) {
  const color =
    tone === "accent" ? "var(--accent)" : "var(--text-tertiary)";
  const maxY = 100;
  const step = 40; // horizontal spacing between phoneme dots
  const yPad = 14;
  const width = step * (phonemes.length - 1) + 40;
  const height = maxY + yPad * 2;
  const points = pitch
    .map((p, i) => `${20 + i * step},${height - yPad - p}`)
    .join(" ");
  return (
    <div
      style={{
        padding: "14px 16px",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${color}`,
        borderRadius: "var(--radius-md)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.95em",
          fontWeight: 700,
          color: "var(--text-primary)",
        }}
      >
        {label}
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", height: "auto" }}
        aria-hidden="true"
      >
        {/* baseline */}
        <line
          x1={0}
          y1={height - yPad}
          x2={width}
          y2={height - yPad}
          stroke="var(--border)"
          strokeWidth={1}
        />
        {/* pitch line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* dots */}
        {pitch.map((p, i) => (
          <circle
            key={i}
            cx={20 + i * step}
            cy={height - yPad - p}
            r={3.5}
            fill={color}
          />
        ))}
        {/* phoneme labels */}
        {phonemes.map((ph, i) => (
          <text
            key={i}
            x={20 + i * step}
            y={height - 2}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="0.75em"
            fill="var(--text-tertiary)"
          >
            {ph}
          </text>
        ))}
      </svg>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.65em",
          color: "var(--text-tertiary)",
          textTransform: "uppercase",
          letterSpacing: "0.14em",
        }}
      >
        {legend}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Section 06 viz. An 8×16 mel-spectrogram grid. Each cell's colour
 * is blended from --bg-card to --accent based on a toy intensity
 * function that mimics a sentence pronounced over time.
 * ────────────────────────────────────────────────────────────── */
function MelSpectrogramViz() {
  const rows = 8;
  const cols = 16;
  // Intensity function: low-frequency energy in the middle, bursts
  // at a few time steps. Purely for illustration.
  function intensity(r: number, c: number): number {
    const timeEnv =
      0.3 +
      0.7 *
        Math.abs(
          Math.sin((c / cols) * Math.PI * 2 + 0.4) *
            Math.cos((c / cols) * Math.PI),
        );
    const freqBias = 1 - Math.abs((r - rows / 2) / rows);
    const burst = c === 3 || c === 9 || c === 13 ? 1.25 : 1;
    return Math.min(1, timeEnv * freqBias * burst);
  }
  return (
    <ArticleViz caption="Mel-spectrogram tương ứng với một câu ngắn. Cột là thời gian (~10ms mỗi cột), hàng là tần số. Ô sáng là năng lượng cao.">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: "6px 4px",
          alignItems: "center",
        }}
      >
        <svg
          viewBox={`0 0 ${cols * 22 + 40} ${rows * 22 + 40}`}
          style={{ width: "100%", maxWidth: 520, height: "auto" }}
          aria-hidden="true"
        >
          {/* Y-axis label: frequency */}
          <text
            x={10}
            y={rows * 22 / 2 + 20}
            fontFamily="var(--font-mono)"
            fontSize="0.7em"
            fill="var(--text-tertiary)"
            transform={`rotate(-90 12 ${rows * 22 / 2 + 20})`}
          >
            tần số ↑
          </text>
          {/* Cells */}
          {Array.from({ length: rows }).map((_, r) =>
            Array.from({ length: cols }).map((_, c) => {
              const v = intensity(r, c);
              const pct = Math.round(v * 100);
              return (
                <rect
                  key={`${r}-${c}`}
                  x={30 + c * 22}
                  y={10 + r * 22}
                  width={20}
                  height={20}
                  rx={3}
                  fill={`color-mix(in srgb, var(--accent) ${pct}%, var(--bg-card))`}
                  stroke="var(--border)"
                  strokeWidth={0.5}
                />
              );
            }),
          )}
          {/* X-axis label: time */}
          <text
            x={30 + (cols * 22) / 2}
            y={rows * 22 + 30}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="0.7em"
            fill="var(--text-tertiary)"
          >
            thời gian →
          </text>
        </svg>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontFamily: "var(--font-mono)",
            fontSize: "0.65em",
            color: "var(--text-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
          }}
        >
          <span>thấp</span>
          <span
            style={{
              display: "inline-block",
              width: 120,
              height: 8,
              borderRadius: 4,
              background:
                "linear-gradient(to right, var(--bg-card), var(--accent))",
              border: "1px solid var(--border)",
            }}
          />
          <span>cao</span>
        </div>
      </div>
    </ArticleViz>
  );
}
