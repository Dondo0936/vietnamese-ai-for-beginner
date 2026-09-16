import {
  ArticleShell,
  ArticleSection,
  ArticleProse,
  ArticleViz,
  ArticleCompare,
  Term,
} from "@/components/article";
import { articleMap } from "./registry";

const meta = articleMap["grok-bot-vs-openclaw"]!;

/**
 * Comparison article. Grok Bot vs OpenClaw 2.0. Frames the trade-off as
 * architectural: a managed agent computer versus a user-owned Gateway.
 * Vietnamese voice: no em-dashes, claim-shaped headings, English product
 * names inline, full diacritics.
 */
export default function GrokBotVsOpenclawArticle() {
  return (
    <ArticleShell meta={meta} heroViz={<GrokOpenclawSplitHeroViz />}>
      <ArticleSection eyebrow="01 · Bối cảnh">
        <ArticleProse>
          <p>
            Chủ quán phở có một việc lặp đến nhàm. Mỗi 15 phút, ai đó phải
            mở Zalo OA, xem ticket mới, nhìn Google Calendar xem hôm nay
            còn slot giao hàng không, rồi soạn nháp trả lời. Việc không
            khó. Việc chỉ đòi 1 máy không ngủ.
          </p>
          <p>
            Tháng 8 năm 2026, hai câu trả lời xuất hiện sát nhau. Ngày 11,
            xAI mở <b>Grok Bot</b>: đội agent, tức tác nhân AI, sống trên
            1 máy ảo Linux, luôn bật. Ngày 26, Grok Bot được đưa vào
            gói SuperGrok và Cursor Pro. Ngày 30, OpenClaw ra bản 2.0: cùng
            ý tưởng máy bền, session bền, tức phiên không tắt, việc lặp,
            nhưng cái bạn nhận không phải một máy có sẵn. Cái bạn nhận
            là một{" "}
            <b>Gateway</b>, tức cổng tự chạy, đặt trên laptop, mini PC
            hoặc VPS, tức máy chủ ảo thuê, của bạn.
          </p>
          <p>
            Cùng một việc chăm ticket, hai sản phẩm cho hai thứ khác nhau.
            Grok Bot cho bạn cái máy. OpenClaw cho bạn cái cổng. Bài này
            đi vào chỗ khác đó, ranh giới bảo mật của từng bên, và lúc nào
            thì nên cầm cái nào.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="02 · Cơ chế"
        heading="Grok Bot cấp cái máy. OpenClaw cấp cái cổng, bạn giữ cái máy."
      >
        <ArticleProse>
          <p>
            <Term slug="grok-bot">Grok Bot</Term> là máy ảo do xAI giữ hộ.
            xAI cấp 1 máy ảo Linux cho cả tài khoản.
            Máy có trình duyệt, hệ thống tệp, terminal. Bạn tạo Bot đặt
            tên, giao vai trò, gắn connector, tức đầu nối sẵn, hoặc cho Bot
            tự đăng nhập website. Việc chạy khi laptop đã gấp, vì cái máy
            không nằm trong laptop.
          </p>
          <p>
            Nhiều người nghe câu &ldquo;mỗi Bot có máy riêng&rdquo; rồi
            nghĩ tạo 3 Bot thì được 3 máy tách nhau. Không. Cái máy, gọi
            là Computer, ở đây là 1 máy dùng chung. Mỗi Bot có cửa sổ riêng
            để làm song song. File, cookie, tức tệp đăng nhập trình duyệt,
            và phiên đăng nhập thì dùng chung theo tài khoản. Tài liệu ra
            mắt của xAI ghi đúng điều này.
          </p>
          <p>
            OpenClaw làm việc ở tầng khác. Phần mềm MIT, không có gói trả
            phí, không có máy chủ do hãng giữ hộ. Bạn cài một Gateway trên
            máy bạn. Gateway nối Zalo, Telegram, WhatsApp, Discord với
            agent. Model là plugin, tức gói gắn thêm: Claude, Codex, GPT,
            hay model chạy trên máy bạn. State, tức trạng thái, nhớ, và
            credential, tức
            thông tin đăng nhập, nằm trên phần cứng bạn chọn.
          </p>
          <p>
            OpenClaw 2.0 thu hẹp khoảng cách trải nghiệm: Quick Start dùng
            lại login Claude Code hoặc Codex, có giao diện web để gắn
            plugin. Chỗ khác cốt lõi không đổi. Grok Bot bán sự có mặt
            của cái máy. OpenClaw bán quyền đặt cái máy ở đâu, và bắt bạn
            làm người vận hành.
          </p>
        </ArticleProse>
        <MechanismSplitViz />
      </ArticleSection>

      <ArticleSection
        eyebrow="03 · Đối đầu"
        heading="Cùng việc Zalo OA, một bên mở app, một bên tự dựng cổng."
      >
        <ArticleCompare
          before={{
            label: "Grok Bot",
            value: "máy ảo xAI giữ hộ",
            note: "xAI giữ 1 máy ảo Linux cho cả tài khoản. Bot là vai trò trên máy đó. Việc chạy khi bạn đi họp. Không có nút chọn model công khai.",
          }}
          after={{
            label: "OpenClaw",
            value: "cổng bạn tự chạy",
            note: "Gateway đặt trên laptop, mini PC hoặc VPS, tức máy chủ ảo thuê. Model là plugin, tức gói gắn thêm. Zalo và Telegram là kênh có sẵn. Mất điện nhà là Gateway tắt, trừ khi bạn thuê VPS.",
          }}
        />
        <ArticleProse>
          <p>
            Đem cùng việc chăm ticket ra bốn chỗ so sánh, hai bên tách rất rõ.
          </p>
        </ArticleProse>
        <FourAxesViz />
        <ArticleProse>
          <p>
            Chỗ cài đặt. Grok Bot thắng dứt khoát. Tài khoản Cursor Pro
            hoặc SuperGrok là đủ. Tạo Bot, đăng nhập Zalo OA trên trình
            duyệt ảo, giao lịch 15 phút. OpenClaw đòi Node, tức môi trường
            chạy JavaScript, khóa API, và bạn hiểu Gateway đang chạy ở đâu.
            Bản 2.0 đỡ hơn, nhưng bạn vẫn là người cài.
          </p>
          <p>
            Chỗ cất file và đăng nhập. OpenClaw thắng nếu bạn muốn file quán,
            tin nhắn khách, cookie ngân hàng không nằm trên máy xAI. Grok
            Bot giữ mọi thứ trên máy ảo của xAI. Tiện, và bạn chấp nhận tin
            nhà cung cấp.
          </p>
          <p>
            Chỗ chọn model. OpenClaw để bạn đổi nhà, hạ model nhỏ cho
            việc lặp, giữ model mạnh cho lúc cần phán đoán. Grok Bot
            giấu lựa chọn đó. Đơn giản hơn. Cũng ít đòn bẩy hơn khi bạn
            muốn tiết kiệm.
          </p>
          <p>
            Chỗ trực ca. Mùa mưa, mất điện, OpenClaw trên máy nhà tắt.
            Grok Bot không tắt theo điện nhà bạn. OpenClaw chạy trên VPS
            thì sống sót, nhưng lúc đó bạn lại đang trả tiền máy chủ, tức
            là tự mua máy có người giữ hộ cho chính mình.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="04 · Ranh giới"
        heading="Grok Bot cho cả tài khoản dùng chung 1 máy. OpenClaw có hộp cát, nhưng mặc định tắt."
      >
        <ArticleProse>
          <p>
            Đây là chỗ nhiều bài so sánh chỉ đếm tính năng, bỏ qua ranh
            giới bảo mật, và là chỗ dễ làm hỏng quán nhất.
          </p>
          <p>
            Grok Bot cho cả tài khoản dùng chung 1 máy ảo. 3 Bot ticket,
            lịch, viết nhìn cùng phiên Zalo OA, cùng thư mục, cùng cookie
            Google.
            Đặt tên Finance Bot rồi nhét đăng nhập ngân hàng vào đó, Bot
            viết vẫn vào được. Tên Bot giúp bạn nhớ ai làm việc gì, không
            khoá file hay phiên đăng nhập.
          </p>
          <p>
            OpenClaw có thể tách chặt hơn. Bật sandbox, tức hộp cát,
            với Docker thì lệnh của agent chạy trong container riêng, có
            thể theo phiên, theo agent, hoặc dùng chung. Thông tin đăng
            nhập có thể gắn theo từng agent. Tài liệu nói rõ ổ cắm Docker
            trên máy chủ là ranh giới tin cậy, đừng gắn ổ Docker lung tung.
          </p>
          <p>
            Tuy nhiên, sandbox của OpenClaw <b>tắt mặc định</b>. Nếu cài
            Docker lỗi, script cài đặt có thể tắt sandbox im lặng chứ không
            từ chối khởi động. Người tưởng mình đang có hộp cát có thể
            đang chạy agent trên chính máy Gateway. Đó là giá của tự vận
            hành: bạn tự tách được, thì bạn cũng phải kiểm xem tách đó còn
            bật không.
          </p>
        </ArticleProse>
        <BoundaryViz />
      </ArticleSection>

      <ArticleSection
        eyebrow="05 · Đánh đổi"
        heading="Tiện thì bớt quyền. Mã mở thì bạn phải trực máy."
      >
        <ArticleProse>
          <p>
            Grok Bot không để bạn chọn máy, chọn model, hay nhìn cửa sổ
            ngữ cảnh, tức context window. Bạn nói chuyện với một vai trò có tên. Việc
            quanh kỹ thuật, tóm tắt, lịch, ticket, chăm khách, chạy ngon
            ở tầng đó. Việc cần nhìn từng lệnh, từng lần nén hội thoại,
            từng model nhỏ, thì lớp trừu tượng bắt đầu vướng.
          </p>
          <p>
            OpenClaw để máy, model, plugin, skill, tức kỹ năng gắn sẵn,
            nằm ra ngoài. Bạn đọc được code. Bạn đổi được nhà cung cấp.
            Bạn gắn Zalo ngay trong kênh chat, không phải giả lập trình
            duyệt. Đổi lại, phần mềm miễn phí không có nghĩa hệ thống
            miễn phí. Bạn trả VPS hoặc điện nhà, trả token, tức đơn vị
            tính phí model, trả thời gian vá, sao lưu, và đêm mất điện.
          </p>
          <p>
            Một nhầm lẫn hay gặp: Grok Bot không phải &ldquo;mỗi Bot một
            máy&rdquo;, OpenClaw không phải &ldquo;miễn phí&rdquo;. Grok
            Bot là 1 máy dùng chung, gói trong Cursor hoặc SuperGrok.
            OpenClaw là phần mềm MIT, cộng hoá đơn vận hành.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="06 · Dùng khi nào"
        heading="Cần Bot luôn bật hôm nay thì lấy máy. Cần Zalo trong chat và đổi model thì lấy cổng."
      >
        <ArticleProse>
          <p>
            Lấy Grok Bot khi bạn đã có Cursor hoặc SuperGrok, muốn giao
            việc quanh kỹ thuật ngay trong buổi, và chấp nhận trạng thái nằm
            trên máy ảo của xAI. Hợp với người cần một Bot luôn bật, không cần
            tự lắp máy chủ.
          </p>
          <p>
            Lấy OpenClaw khi bạn cần mã nguồn, file trên máy nhà, kênh Zalo
            hay Telegram sẵn trong chat, hoặc quyền đổi model. Những thứ đó
            là chuyện sống còn. Hợp với người chấp nhận làm trực ca cho
            một Gateway. Sandbox phải được bạn
            bật và kiểm, không phải tin mặc định.
          </p>
          <p>
            Nhiều người sẽ dùng cả hai. OpenClaw trên máy nhà cho việc đụng
            file quán. Grok Bot cho việc phải sống sót khi mất điện. Hiểu{" "}
            <Term slug="agent-architecture">kiến trúc agent</Term> và{" "}
            <Term slug="agentic-workflows">quy trình nhiều bước của agent</Term>{" "}
            giúp
            bạn đặt đúng việc lên đúng máy, hơn là trung thành với một
            logo.
          </p>
        </ArticleProse>
      </ArticleSection>
    </ArticleShell>
  );
}

export function GrokOpenclawSplitHeroViz({
  idPrefix = "gb",
}: {
  idPrefix?: string;
} = {}) {
  const cloudId = `${idPrefix}-cloud-bg`;
  const hostId = `${idPrefix}-host-bg`;
  return (
    <svg
      viewBox="0 0 900 340"
      className="ar-viz"
      preserveAspectRatio="xMidYMid meet"
      overflow="visible"
      role="img"
      aria-label="So sánh: Grok Bot là máy ảo Linux dùng chung cho nhiều Bot, OpenClaw là Gateway tự chạy trên máy bạn nối Zalo và Telegram"
    >
      <defs>
        <linearGradient id={cloudId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--turquoise-50)" />
          <stop offset="100%" stopColor="var(--bg-card)" />
        </linearGradient>
        <linearGradient id={hostId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--peach-200)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--clay)" stopOpacity="0.08" />
        </linearGradient>
      </defs>

      <rect width="900" height="340" fill="var(--bg-card)" />

      <text
        x="40"
        y="36"
        fontFamily="var(--font-mono)"
        fontSize="0.7em"
        fill="var(--turquoise-ink)"
        letterSpacing="0.08em"
      >
        / MÁY ẢO XAI GIỮ HỘ · CỔNG BẠN TỰ CHẠY
      </text>

      <g>
        <rect
          x="40"
          y="56"
          width="390"
          height="240"
          rx="8"
          fill={`url(#${cloudId})`}
        />
        <rect
          x="95"
          y="88"
          width="280"
          height="108"
          rx="10"
          fill="var(--paper)"
          stroke="var(--turquoise-700)"
          strokeWidth={1.5}
        />
        <text
          x="235"
          y="122"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="0.85em"
          fontWeight={700}
          fill="var(--text-primary)"
        >
          Máy ảo Linux
        </text>
        <text
          x="235"
          y="146"
          textAnchor="middle"
          fontFamily="var(--font-sans, sans-serif)"
          fontSize="0.7em"
          fill="var(--text-primary)"
        >
          file, phiên đăng nhập chung
        </text>
        <text
          x="235"
          y="170"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="0.65em"
          fill="var(--turquoise-ink)"
        >
          mọi Bot cùng 1 máy
        </text>
        {[
          { x: 78, label: "Ticket" },
          { x: 188, label: "Lịch" },
          { x: 298, label: "Viết" },
        ].map((bot) => (
          <g key={bot.label}>
            <rect
              x={bot.x}
              y="214"
              width="94"
              height="36"
              rx="6"
              fill="var(--paper)"
              stroke="var(--turquoise-500)"
              strokeWidth={1.25}
            />
            <text
              x={bot.x + 47}
              y="237"
              textAnchor="middle"
              fontFamily="var(--font-sans, sans-serif)"
              fontSize="0.72em"
              fontWeight={600}
              fill="var(--text-primary)"
            >
              {bot.label}
            </text>
          </g>
        ))}
        <text
          x="235"
          y="276"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="0.62em"
          fill="var(--text-tertiary)"
          letterSpacing="0.12em"
        >
          GROK BOT
        </text>
      </g>

      <g>
        <rect
          x="470"
          y="56"
          width="390"
          height="240"
          rx="8"
          fill={`url(#${hostId})`}
        />
        <rect
          x="525"
          y="88"
          width="280"
          height="108"
          rx="10"
          fill="var(--paper)"
          stroke="var(--clay)"
          strokeWidth={1.5}
        />
        <text
          x="665"
          y="122"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="0.85em"
          fontWeight={700}
          fill="var(--text-primary)"
        >
          Gateway trên máy bạn
        </text>
        <text
          x="665"
          y="146"
          textAnchor="middle"
          fontFamily="var(--font-sans, sans-serif)"
          fontSize="0.7em"
          fill="var(--text-primary)"
        >
          laptop · mini PC · máy ảo
        </text>
        <text
          x="665"
          y="170"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="0.65em"
          fill="var(--clay)"
        >
          sandbox mặc định tắt
        </text>
        {[
          { x: 508, label: "Zalo" },
          { x: 618, label: "Telegram" },
          { x: 728, label: "máy ảo" },
        ].map((ch) => (
          <g key={ch.label}>
            <rect
              x={ch.x}
              y="214"
              width="94"
              height="36"
              rx="6"
              fill="var(--paper)"
              stroke="var(--clay)"
              strokeWidth={1.25}
            />
            <text
              x={ch.x + 47}
              y="237"
              textAnchor="middle"
              fontFamily="var(--font-sans, sans-serif)"
              fontSize="0.72em"
              fontWeight={600}
              fill="var(--text-primary)"
            >
              {ch.label}
            </text>
          </g>
        ))}
        <text
          x="665"
          y="276"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="0.62em"
          fill="var(--text-tertiary)"
          letterSpacing="0.12em"
        >
          OPENCLAW
        </text>
      </g>
    </svg>
  );
}

function MechanismSplitViz() {
  return (
    <ArticleViz caption="Cùng muốn máy không ngủ. Một bên lấy máy ảo có sẵn. Một bên tự đặt máy.">
      <GrokOpenclawSplitHeroViz idPrefix="gb2" />
    </ArticleViz>
  );
}

function FourAxesViz() {
  const axes = [
    {
      axis: "Cài đặt",
      grok: "Mở app, tạo Bot",
      openclaw: "Cài Gateway, giữ máy chạy",
    },
    {
      axis: "Chỗ cất state",
      grok: "Máy xAI, theo tài khoản",
      openclaw: "Phần cứng bạn chọn",
    },
    {
      axis: "Chọn model",
      grok: "Không có picker công khai",
      openclaw: "Plugin, đổi nhà được",
    },
    {
      axis: "Ai trực khi mất điện",
      grok: "xAI giữ máy",
      openclaw: "Bạn, trừ khi đã thuê VPS",
    },
  ];

  return (
    <ArticleViz caption="Bốn chỗ khác nhau. Không cộng thành một điểm thắng thua.">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {axes.map((row) => (
          <div
            key={row.axis}
            className="rounded-xl border border-border bg-card p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {row.axis}
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              Grok Bot: {row.grok}
            </p>
            <p className="mt-1 text-sm text-foreground">
              OpenClaw: {row.openclaw}
            </p>
          </div>
        ))}
      </div>
    </ArticleViz>
  );
}

function BoundaryViz() {
  return (
    <ArticleViz caption="Đường vẽ được và đường đang bật sẵn là hai chuyện khác nhau.">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border-2 border-amber-500 bg-amber-500/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
            Grok Bot
          </p>
          <p className="mt-2 text-lg font-bold text-foreground">Tài khoản</p>
          <p className="mt-2 text-sm leading-relaxed text-foreground">
            Mọi Bot nhìn cùng máy. Đăng nhập ngân hàng trên Finance Bot
            không khoá Bot viết.
          </p>
        </div>
        <div className="rounded-xl border-2 border-violet-500 bg-violet-500/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
            OpenClaw
          </p>
          <p className="mt-2 text-lg font-bold text-foreground">
            Sandbox tùy chọn
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground">
            Docker vẽ được đường theo agent. Mặc định tắt. Cài lỗi có thể
            tắt hộp cát im lặng.
          </p>
        </div>
      </div>
    </ArticleViz>
  );
}
