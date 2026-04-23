import {
  ArticleShell,
  ArticleSection,
  ArticleProse,
  ArticleViz,
  Term,
} from "@/components/article";
import { articleMap } from "./registry";

const meta = articleMap["llm-math-weakness"]!;

/**
 * Explainer article: why LLM chat models (ChatGPT, Claude, Gemini) are
 * unreliable at pure arithmetic. Starts from a concrete scene (failed
 * multiplication), walks through tokenization and next-token prediction,
 * then shows how tool use and chain-of-thought move the task to the
 * right component. Follows the no-em-dash body voice (Rule 0 of
 * writing-vietnamese-technical).
 */
export default function LLMMathWeaknessArticle() {
  return (
    <ArticleShell meta={meta} heroViz={<MathFailHeroViz />}>
      <ArticleSection eyebrow="01 · Ý tưởng">
        <ArticleProse>
          <p>
            Bạn mở ChatGPT, nhập <code>7583 × 2947</code> rồi nhấn Enter.
            Một câu trả lời hiện ra gần như tức thì, chỉ sau khoảng một
            giây. Con số trả về trông rất thuyết phục: có đầy đủ chữ số,
            được đặt trong một câu gọn gàng, có khi còn kèm vài dòng
            diễn giải từng bước phép nhân ở dưới.
          </p>
          <p>
            Bạn bấm thử lại trên máy tính điện thoại. Con số không khớp.
            Thử thêm một phép nhân khác, vẫn một câu trả lời trôi chảy,
            vẫn một kết quả sai. Hiện tượng này không phải bug, cũng
            không phải dấu hiệu model dở. Nó là hệ quả trực tiếp của cách
            một <b>large language model</b> (LLM) được dựng nên: một cỗ
            máy đoán chữ tiếp theo dựa trên ngữ cảnh, chứ không phải một
            chiếc máy tính.
          </p>
          <p>
            Bài viết này giải thích chậm rãi vì sao ChatGPT, Claude,
            Gemini, và mọi chatbot dựa trên LLM đều yếu ở phép toán
            thuần, và làm cách nào để biến yếu điểm đó thành một bài
            toán giải quyết được bằng một vài thói quen rất đơn giản
            khi dùng chatbot hàng ngày.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="02 · Cơ chế"
        heading="Model không nhìn thấy chữ số"
      >
        <ArticleProse>
          <p>
            Trước khi đi vào phép nhân, cần nói một chút về cách model
            đọc văn bản đầu vào. Khi bạn gõ <code>7583</code> vào khung
            chat, phần tính toán bên trong không nhìn thấy bốn chữ số{" "}
            <code>7, 5, 8, 3</code>. Nó nhìn thấy một chuỗi{" "}
            <b>token</b>: tức là các mảnh chữ đã được cắt sẵn từ lúc
            model được huấn luyện. Bộ cắt đó được gọi là{" "}
            <Term slug="tokenization">tokenizer</Term>.
          </p>
          <p>
            Một tokenizer kiểu byte-pair encoding, bộ cắt phổ biến nhất
            hiện nay, nhìn vào lịch sử văn bản khổng lồ trong dữ liệu
            huấn luyện rồi chọn ra các cụm chữ hay xuất hiện cùng nhau.
            Cụm càng thường gặp, khả năng được gom thành một token riêng
            càng cao. Kết quả: số <code>7583</code> có thể được cắt
            thành hai mảnh{" "}
            <code>[&quot;75&quot;, &quot;83&quot;]</code>, hoặc ba mảnh{" "}
            <code>[&quot;7&quot;, &quot;58&quot;, &quot;3&quot;]</code>,
            tuỳ loại tokenizer. Từ góc nhìn của model, đó là hai hoặc
            ba từ rời cạnh nhau, không phải bốn chữ số liên tiếp.
          </p>
          <p>
            Nhìn như vậy, phép nhân hàng dọc quen thuộc thời cấp hai bị
            đảo lộn hoàn toàn. Khi con người nhân{" "}
            <code>7583 × 2947</code>, mắt đi theo từng vị trí: hàng đơn
            vị nhân với hàng đơn vị, rồi hàng chục, hàng trăm, có nhớ
            có mượn. Cơ chế đó hoạt động được vì bạn biết chữ số đang ở
            vị trí nào. Model không có cái biết đó. Mảnh{" "}
            <code>&quot;75&quot;</code> đứng cạnh mảnh{" "}
            <code>&quot;83&quot;</code> đối với model chỉ có nghĩa là
            hai từ liên tiếp, tương tự cách bạn thấy hai chữ{" "}
            &ldquo;sáng&rdquo; và &ldquo;nay&rdquo; đứng cạnh nhau.
          </p>
        </ArticleProse>
        <TokenSplitViz />
      </ArticleSection>

      <ArticleSection
        eyebrow="03 · Cơ chế"
        heading="Đoán token, không phải tính"
      >
        <ArticleProse>
          <p>
            Ngay cả khi tokenizer cắt từng chữ số ra riêng, model vẫn
            không biến thành máy tính. Lý do nằm ở nhiệm vụ gốc của nó.
            Một LLM được huấn luyện để làm đúng một việc: nhận vào một
            chuỗi token, đoán token tiếp theo có xác suất cao nhất.
            Toàn bộ phần cơ bắp bên trong, từ attention layer đến
            feed-forward layer, đều phục vụ mục tiêu đó.
          </p>
          <p>
            Vậy khi bạn gõ <code>2 + 2 =</code>, điều gì xảy ra? Model
            đã thấy cụm <code>&quot;2 + 2 = 4&quot;</code> hàng triệu
            lần trong dữ liệu huấn luyện, trên forum, trong sách giáo
            khoa, trên Wikipedia. Token <code>&quot;4&quot;</code> hiện
            ra với xác suất áp đảo, gần như bằng 1. Không có bước cộng
            nào thực sự diễn ra. Model chỉ lặp lại một mẫu đã thấy quá
            nhiều lần, giống cách bạn tự động nói tiếp &ldquo;thì
            sáng&rdquo; ngay khi nghe &ldquo;gần đèn&rdquo;.
          </p>
          <p>
            Với <code>7583 × 2947</code> thì khác. Cụm chữ cụ thể đó
            gần như không xuất hiện trong dữ liệu huấn luyện, vì có vô
            số cặp số bốn chữ số có thể ghép với nhau. Model rơi vào
            tình huống phải đoán một kết quả &ldquo;nghe có vẻ
            đúng&rdquo;: một con số bảy hay tám chữ số, bắt đầu bằng
            một chữ số có bậc phù hợp với ước lượng thô (7000 × 3000
            cỡ 21 triệu), phân bố các chữ số còn lại trông tự nhiên.
            Nó thường đoán trúng vài chữ số đầu, trật vài chữ số giữa,
            rồi kết thúc bằng một cụm ba hay bốn chữ số hoàn toàn bịa.
            Kết quả nhìn như một phép nhân, nhưng không phải.
          </p>
          <p>
            Nói cách khác,{" "}
            <b>
              dự đoán token là một dạng suy luận mờ, không phải một
              phép tính chính xác
            </b>
            . Model có thể làm tốt vô vàn công việc suy luận mờ: tóm
            tắt một bài báo, viết lại đoạn văn theo giọng khác, dịch,
            nghĩ ý tưởng, trả lời câu hỏi lịch sử. Nhưng một phép nhân
            bốn chữ số yêu cầu câu trả lời đúng đến từng chữ số cuối
            cùng. Ở địa hạt đó, suy luận mờ không cứu được.
          </p>
        </ArticleProse>
        <PredictVsComputeViz />
      </ArticleSection>

      <ArticleSection
        eyebrow="04 · Cách khắc phục"
        heading="Đưa phép tính cho đúng công cụ"
      >
        <ArticleProse>
          <p>
            Giải pháp hiệu quả nhất nghe có vẻ hiển nhiên một khi đã
            hiểu cơ chế: đừng bắt LLM tự tính. Thay vào đó, để nó viết
            một đoạn code ngắn, rồi chạy đoạn code đó trên một trình
            thông dịch Python thực. Tính năng này được gọi bằng nhiều
            tên: <b>code interpreter</b>, <b>tool use</b>, hoặc{" "}
            <Term slug="function-calling">function calling</Term>. Bản
            chất giống nhau.
          </p>
          <p>
            Khi bạn gõ <code>7583 × 2947</code> trên ChatGPT Plus với
            chế độ code interpreter đang bật, model sẽ không đoán con
            số. Nó viết ra đoạn code{" "}
            <code>print(7583 * 2947)</code>, gửi sang một sandbox
            Python để chạy thật, rồi nhận lại con số chính xác{" "}
            <code>22347301</code>, và chèn vào câu trả lời cho bạn. Từ
            đầu đến cuối, phép nhân do Python làm, còn LLM chỉ làm hai
            việc nó giỏi: hiểu yêu cầu bằng tiếng Việt, và trình bày
            kết quả lại thành câu đọc được. Đúng phân công.
          </p>
          <p>
            Với các phép tính nhỏ và khi không có code interpreter,
            còn một kỹ thuật rẻ hơn là{" "}
            <Term slug="chain-of-thought">chain-of-thought</Term>. Bạn
            yêu cầu model &ldquo;tính từng bước một&rdquo; hoặc{" "}
            &ldquo;hãy viết ra phép nhân hàng dọc&rdquo;. Model sẽ
            trải phép nhân ra, viết từng bước, từng hàng có nhớ. Vì
            mỗi bước chỉ là nhân một chữ số với một chữ số (phép tính
            rất hay xuất hiện trong dữ liệu huấn luyện), xác suất đúng
            của từng bước cao hơn hẳn. Nhưng cách này có giới hạn rõ:
            nhân ba chữ số với ba chữ số tạm ổn, nhân sáu với sáu thì
            sai số tích luỹ sẽ phá vỡ kết quả. Khi phép tính đủ lớn,
            quay về tool use.
          </p>
          <p>
            Cả hai cách đều đi theo một nguyên tắc chung: mỗi công cụ
            làm việc nó giỏi. LLM giỏi hiểu ngôn ngữ. Python giỏi tính.
            Cứ ghép chúng lại.
          </p>
        </ArticleProse>
        <ToolUseFlowViz />
      </ArticleSection>

      <ArticleSection
        eyebrow="05 · Dùng khi nào, bỏ khi nào"
        heading="Tin vào cái gì, kiểm tra cái gì"
      >
        <ArticleProse>
          <p>
            Hiểu yếu điểm này không có nghĩa là tránh xa LLM khi gặp
            con số. Nó chỉ giúp bạn biết chỗ nào nên tin và chỗ nào
            nên kiểm. Một vài nguyên tắc thực tế để áp dụng ngay hôm
            nay.
          </p>
          <p>
            <b>Tin được.</b> Bài toán có lời (word problem), giải
            thích công thức, biến đổi ký hiệu đại số, dịch một công
            đoạn tính thành mô tả, vẽ khung giải một bài toán từ đầu.
            Ở đây model đang làm đúng việc nó giỏi: liên kết ngôn ngữ
            với ý tưởng toán học. Con số cuối cùng nếu có thường vẫn
            nên kiểm, nhưng phần suy luận đa phần đúng hướng.
          </p>
          <p>
            <b>Không tin thẳng.</b> Mọi phép toán nhiều chữ số, so
            sánh hai số thập phân gần bằng nhau, tính lãi suất, tính
            thuế, tổng hợp số liệu từ một bảng dài, cộng trừ tiền tệ.
            Luôn để tool use làm phần tính, rồi dùng model để diễn
            giải kết quả và trình bày.
          </p>
          <p>
            <b>Luôn kiểm chứng.</b> Bất kỳ con số nào sẽ được dùng để
            ra quyết định. Bạn không cần tự bấm máy tính mỗi lần: chỉ
            cần bật code interpreter, hoặc yêu cầu model &ldquo;chạy
            code để xác nhận&rdquo;. Bước kiểm đó rẻ, và nó loại bỏ
            gần như toàn bộ rủi ro của phép toán sai trông như đúng.
          </p>
          <p>
            Điểm cần nhớ cuối cùng: LLM không ngu về toán. Nó chỉ
            được thiết kế cho một việc khác. Hỏi một người đầu bếp
            cách sửa xe máy, câu trả lời vẫn sẽ trôi chảy và tự tin,
            nhưng đó không phải câu trả lời bạn nên làm theo. Với
            phép tính, hãy gọi đúng công cụ.
          </p>
        </ArticleProse>
      </ArticleSection>
    </ArticleShell>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Hero viz. A chat-style card showing the wrong LLM answer
 * (22,347,501) side by side with the correct calculator answer
 * (22,347,301). The last three digits diverge, which matches the
 * typical LLM failure mode: the magnitude is right, the tail is
 * bluffed.
 * ────────────────────────────────────────────────────────────── */
function MathFailHeroViz() {
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
          fontSize: 11,
          color: "var(--text-tertiary)",
          textTransform: "uppercase",
          letterSpacing: "0.18em",
        }}
      >
        7583 × 2947 = ?
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          width: "100%",
          maxWidth: 460,
        }}
      >
        {/* LLM, wrong */}
        <div
          style={{
            padding: "14px 16px",
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
              marginBottom: 6,
            }}
          >
            LLM
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 22,
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            22,347,<span style={{ color: "var(--clay)" }}>501</span>
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 11,
              color: "var(--text-tertiary)",
            }}
          >
            đuôi số bịa
          </div>
        </div>

        {/* Calculator, right */}
        <div
          style={{
            padding: "14px 16px",
            background: "var(--bg-card)",
            border: "1px solid var(--turquoise-100)",
            borderLeft: "4px solid var(--turquoise-500)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--turquoise-700)",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            Máy tính
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 22,
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            22,347,
            <span style={{ color: "var(--turquoise-700)" }}>301</span>
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 11,
              color: "var(--text-tertiary)",
            }}
          >
            kết quả thật
          </div>
        </div>
      </div>

      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "var(--text-tertiary)",
          textTransform: "uppercase",
          letterSpacing: "0.18em",
        }}
      >
        LLM đoán bậc đúng, chữ số cuối bịa
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Section 02 viz. Shows how the number 7583 is split into tokens
 * by a BPE tokenizer. The reader sees why "vị trí chữ số" is lost.
 * ────────────────────────────────────────────────────────────── */
function TokenSplitViz() {
  const digits = ["7", "5", "8", "3"];
  const tokens = ["75", "83"];
  return (
    <ArticleViz caption='Tokenizer cắt "7583" thành hai mảnh. Từ góc nhìn của model, đó là hai từ rời, không phải bốn chữ số liên tiếp.'>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "24px 16px",
          gap: 16,
        }}
      >
        {/* Top row: the raw digits */}
        <div style={{ display: "flex", gap: 6 }}>
          {digits.map((d, i) => (
            <div
              key={i}
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                background: "var(--paper)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-mono)",
                fontSize: 20,
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              {d}
            </div>
          ))}
        </div>

        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 18,
            color: "var(--text-tertiary)",
          }}
        >
          ↓
        </div>

        {/* Bottom row: the tokens */}
        <div style={{ display: "flex", gap: 10 }}>
          {tokens.map((t, i) => (
            <div
              key={i}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                background: "var(--turquoise-50)",
                border: "1px solid var(--turquoise-300)",
                fontFamily: "var(--font-mono)",
                fontSize: 18,
                fontWeight: 700,
                color: "var(--turquoise-700)",
                letterSpacing: "0.02em",
              }}
            >
              &quot;{t}&quot;
            </div>
          ))}
        </div>

        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--text-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.18em",
          }}
        >
          2 token, không phải 4 chữ số
        </div>
      </div>
    </ArticleViz>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Section 03 viz. Two columns comparing "đoán token" (LLM) with
 * "tính chính xác" (máy tính). Reinforces the section's claim that
 * the two modes are fundamentally different.
 * ────────────────────────────────────────────────────────────── */
function PredictVsComputeViz() {
  return (
    <ArticleViz caption="LLM chọn token có xác suất cao nhất dựa trên ngữ cảnh. Máy tính chạy phép toán bằng thuật toán xác định. Hai chế độ khác nhau.">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
        }}
      >
        {/* LLM column */}
        <div
          style={{
            padding: "18px 20px",
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
            LLM · đoán token
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 14,
              color: "var(--text-secondary)",
              marginBottom: 10,
            }}
          >
            prompt: <span style={{ color: "var(--text-primary)" }}>2 + 2 =</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <TokenBar label='"4"' weight={0.97} tone="clay" />
            <TokenBar label='"5"' weight={0.02} tone="clay" />
            <TokenBar label='"bốn"' weight={0.01} tone="clay" />
          </div>
          <p
            style={{
              marginTop: 10,
              fontSize: 12,
              color: "var(--text-secondary)",
              lineHeight: 1.5,
            }}
          >
            Chọn token có xác suất cao nhất. Không có bước cộng thật,
            chỉ có thống kê ngữ cảnh.
          </p>
        </div>

        {/* Calculator column */}
        <div
          style={{
            padding: "18px 20px",
            background: "var(--bg-card)",
            border: "1px solid var(--turquoise-100)",
            borderLeft: "4px solid var(--turquoise-500)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--turquoise-700)",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              fontWeight: 700,
              marginBottom: 10,
            }}
          >
            Máy tính · tính chính xác
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 14,
              color: "var(--text-secondary)",
              marginBottom: 10,
            }}
          >
            input: <span style={{ color: "var(--text-primary)" }}>2 + 2</span>
          </div>
          <div
            style={{
              padding: "10px 14px",
              background: "var(--turquoise-50)",
              border: "1px solid var(--turquoise-300)",
              borderRadius: 8,
              fontFamily: "var(--font-mono)",
              fontSize: 18,
              fontWeight: 700,
              color: "var(--turquoise-700)",
              textAlign: "center",
            }}
          >
            4
          </div>
          <p
            style={{
              marginTop: 10,
              fontSize: 12,
              color: "var(--text-secondary)",
              lineHeight: 1.5,
            }}
          >
            Chạy thuật toán cộng trên byte. Kết quả xác định, không
            có xác suất nào ở đây.
          </p>
        </div>
      </div>
    </ArticleViz>
  );
}

function TokenBar({
  label,
  weight,
  tone,
}: {
  label: string;
  weight: number;
  tone: "clay" | "turquoise";
}) {
  const fill = tone === "clay" ? "var(--clay)" : "var(--turquoise-500)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span
        style={{
          width: 48,
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "var(--text-primary)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          flex: 1,
          height: 10,
          background: "var(--paper-3)",
          borderRadius: 5,
          overflow: "hidden",
        }}
      >
        <span
          style={{
            display: "block",
            width: `${Math.max(6, weight * 100)}%`,
            height: "100%",
            background: fill,
          }}
        />
      </span>
      <span
        style={{
          width: 44,
          textAlign: "right",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--text-tertiary)",
        }}
      >
        {(weight * 100).toFixed(0)}%
      </span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Section 04 viz. A four-step horizontal flow showing tool use:
 * prompt → LLM writes code → Python runs → LLM formats the answer.
 * Each step is a small card with a role chip.
 * ────────────────────────────────────────────────────────────── */
function ToolUseFlowViz() {
  const steps: Array<{
    role: string;
    roleTone: "clay" | "turquoise" | "ink";
    body: string;
    mono?: boolean;
  }> = [
    {
      role: "Bạn",
      roleTone: "ink",
      body: "7583 × 2947 = ?",
      mono: true,
    },
    {
      role: "LLM",
      roleTone: "clay",
      body: "print(7583 * 2947)",
      mono: true,
    },
    {
      role: "Python",
      roleTone: "turquoise",
      body: "22347301",
      mono: true,
    },
    {
      role: "LLM",
      roleTone: "clay",
      body: "Kết quả là 22.347.301.",
    },
  ];

  return (
    <ArticleViz caption="Tool use: LLM viết code, Python chạy, LLM diễn giải. Mỗi công cụ làm phần nó giỏi.">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 16px 1fr 16px 1fr 16px 1fr",
          gap: 8,
          alignItems: "stretch",
        }}
      >
        {steps.flatMap((s, i) => {
          const card = (
            <FlowCard
              key={`card-${i}`}
              role={s.role}
              roleTone={s.roleTone}
              body={s.body}
              mono={s.mono}
            />
          );
          if (i === steps.length - 1) return [card];
          return [
            card,
            <div
              key={`arrow-${i}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                color: "var(--text-tertiary)",
              }}
            >
              →
            </div>,
          ];
        })}
      </div>
    </ArticleViz>
  );
}

function FlowCard({
  role,
  roleTone,
  body,
  mono,
}: {
  role: string;
  roleTone: "clay" | "turquoise" | "ink";
  body: string;
  mono?: boolean;
}) {
  const toneColor =
    roleTone === "turquoise"
      ? "var(--turquoise-700)"
      : roleTone === "clay"
        ? "var(--clay)"
        : "var(--text-secondary)";
  const accentBorder =
    roleTone === "turquoise"
      ? "var(--turquoise-500)"
      : roleTone === "clay"
        ? "var(--clay)"
        : "var(--border-strong)";
  const bg =
    roleTone === "turquoise" ? "var(--bg-card)" : "var(--paper-2)";
  return (
    <div
      style={{
        padding: "12px 14px",
        background: bg,
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${accentBorder}`,
        borderRadius: "var(--radius-md)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          color: toneColor,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          fontWeight: 700,
        }}
      >
        {role}
      </div>
      <div
        style={{
          fontFamily: mono ? "var(--font-mono)" : "inherit",
          fontSize: mono ? 13 : 12.5,
          lineHeight: 1.4,
          color: "var(--text-primary)",
          wordBreak: "break-word",
        }}
      >
        {body}
      </div>
    </div>
  );
}
