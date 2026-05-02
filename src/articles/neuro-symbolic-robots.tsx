import {
  ArticleShell,
  ArticleSection,
  ArticleProse,
  ArticleViz,
  ArticleCompare,
  Term,
} from "@/components/article";
import { articleMap } from "./registry";

const meta = articleMap["neuro-symbolic-robots"]!;

/**
 * Beginner-audience explainer — neuro-symbolic robots from Tufts
 * (ICRA Vienna 2026). Tower of Hanoi as the central scene. Slow
 * pace, lots of metaphors (học vẹt vs học hiểu), no math. Designed
 * for the same reader who liked llm-math-weakness: chatbot user
 * who is curious about how it actually works. Follows the
 * scene-first, no-em-dash voice from
 * writing-vietnamese-technical.
 */
export default function NeuroSymbolicRobotsArticle() {
  return (
    <ArticleShell meta={meta} heroViz={<TowerOfHanoiHeroViz />}>
      <ArticleSection eyebrow="01 · Bối cảnh">
        <ArticleProse>
          <p>
            Tháp Hà Nội là một trò đố cổ điển. Có ba cọc và một chồng đĩa
            kích thước khác nhau, đĩa to nằm dưới, đĩa nhỏ nằm trên. Bạn
            phải dời cả chồng từ cọc bên trái sang cọc bên phải, mỗi
            lượt chỉ được nhấc một đĩa, và không bao giờ được đặt một
            đĩa to lên một đĩa nhỏ hơn. Trẻ con vẫn chơi được, miễn là
            kiên nhẫn lập kế hoạch từng bước.
          </p>
          <p>
            Một nhóm ở đại học Tufts, dẫn đầu là giáo sư Matthias Scheutz,
            mang chính trò chơi đó làm bài thi cho hai cánh tay robot.
            Cánh tay thứ nhất chạy bằng một loại AI đang được dùng phổ
            biến trong lab robot năm 2026, gọi là{" "}
            <b>vision-language-action model</b> (VLA). Mô hình này nhìn
            ảnh từ camera, đọc lệnh tiếng người, rồi xuất thẳng ra lệnh
            điều khiển khớp tay. Cánh tay thứ hai chạy một thiết kế lai,
            gọi là <b>neuro-symbolic</b>: vẫn dùng mạng nơ-ron để nhìn,
            nhưng kèm thêm một bộ luật suy luận cổ điển để lập kế hoạch.
          </p>
          <p>
            Cùng một bài thi, hai cánh tay cho ra kết quả rất khác nhau.
            Cánh tay VLA chỉ thắng 34%, trong khi cánh tay neuro-symbolic
            thắng tới 95%. Khi nhóm làm khó bằng các biến thể tháp chưa
            từng có trong dữ liệu huấn luyện, VLA rớt về 0% còn
            neuro-symbolic vẫn giữ được 78%. Tuy nhiên, điều khiến giới
            robot chú ý nhất không nằm ở tỷ lệ thắng mà ở chi phí điện.
            So với VLA, cánh tay neuro-symbolic chỉ tốn khoảng 1% điện
            cho việc huấn luyện và 5% điện cho việc vận hành. Bài viết
            sẽ đi sâu vào hai chữ &ldquo;biết nghĩ&rdquo; thực sự nghĩa
            là gì với một con robot.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="02 · Cách nghĩ kiểu cũ"
        heading="VLA học bằng cách xem hàng triệu video"
      >
        <ArticleProse>
          <p>
            Cách dạy robot phổ biến nhất bây giờ là cho nó xem rất nhiều.
            Người ta thu video người thật làm cùng một việc, hàng triệu
            lần, ở các vị trí và ánh sáng khác nhau. Một mạng nơ-ron lớn
            được huấn luyện để bắt chước đoạn video. Đầu vào là khung
            ảnh hiện tại, đầu ra là góc quay của các khớp tay ở khung kế
            tiếp.
          </p>
          <p>
            Cách này hoạt động tuyệt vời cho những việc đã có sẵn nhiều
            video gần giống. Robot pha cà phê, gấp khăn, lau bàn nếu
            được huấn luyện đúng dạng. Tuy nhiên, trò tháp Hà Nội đặt
            ra một yêu cầu khác hẳn. Việc thắng đòi hỏi phải nghĩ trước
            nhiều bước, trong khi mỗi tình huống tháp lại khác nhau dù
            trông giống nhau. Mạng nơ-ron không có khái niệm
            &ldquo;kế hoạch&rdquo;. Ở mỗi khung hình, nó chỉ đoán động
            tác kế tiếp giống nhất với hàng triệu video đã xem.
          </p>
          <p>
            Đây là kiểu <b>học vẹt</b> rất nặng, dùng quy mô dữ liệu để
            bù cho việc thiếu khả năng suy luận. Robot đã từng thấy
            hàng nghìn pha &ldquo;nhấc đĩa nhỏ đặt qua cọc bên cạnh&rdquo;,
            nên hay lặp lại động tác đó dù không phải bước đúng. Khi
            gặp tháp 4 đĩa thay vì 3, hoặc khi vị trí cọc xê dịch, số
            mẫu video huấn luyện khớp được với cảnh trước mắt giảm đi
            và xác suất thắng tụt nhanh.
          </p>
        </ArticleProse>
        <VlaTrainingViz />
      </ArticleSection>

      <ArticleSection
        eyebrow="03 · Cách nghĩ kiểu mới"
        heading="Neuro-symbolic chia việc giữa mạng nơ-ron và bộ luật"
      >
        <ArticleProse>
          <p>
            Robot neuro-symbolic chia việc thành hai phần. Phần đầu vẫn
            là một mạng nơ-ron, nhưng mạng được giao đúng một việc đơn
            giản: nhìn ảnh từ camera và trả ra trạng thái của bài toán
            ngay lúc đó. Cụ thể: cọc nào có những đĩa nào, đĩa nào đang
            ở trên cùng, vị trí mục tiêu là gì. Đây là phần
            &ldquo;mạng&rdquo; của tên gọi.
          </p>
          <p>
            Phần thứ hai không phải mạng nơ-ron. Nó là một bộ luật suy
            luận viết bằng code thông thường: &ldquo;muốn dời chồng N
            đĩa từ cọc A sang cọc C, hãy dời N-1 đĩa trên đỉnh sang cọc
            phụ B, rồi nhấc đĩa lớn nhất từ A sang C, rồi dời chồng N-1
            từ B sang C&rdquo;. Đây là{" "}
            <Term slug="planning">planner</Term>: một thuật toán cổ điển
            nhận đầu vào là trạng thái hiện tại và mục tiêu, trả ra một
            chuỗi bước cần làm. Đây là phần &ldquo;symbolic&rdquo; (ký
            hiệu) của tên gọi: nó làm việc bằng các biểu tượng rõ ràng
            chứ không phải xác suất.
          </p>
          <p>
            Hai phần ăn khớp nhau như mắt và bộ não. Mạng nơ-ron đảm
            nhận thứ mạng nơ-ron giỏi: đọc thế giới hỗn độn từ pixel
            sang biểu tượng. Planner đảm nhận thứ planner giỏi: lập kế
            hoạch chính xác trên biểu tượng. Mỗi nhịp, mạng quan sát,
            planner lệnh động tác kế tiếp, cánh tay làm, mạng quan sát
            lại, planner cập nhật. Lặp đến khi xong tháp.
          </p>
        </ArticleProse>
        <NeuroSymbolicPipeline />
      </ArticleSection>

      <ArticleSection
        eyebrow="04 · Số liệu"
        heading="Độ chính xác cao hơn, năng lượng giảm 100 lần"
      >
        <ArticleCompare
          before={{
            label: "Robot VLA · học vẹt từ video",
            value: "34% thắng",
            note: "Hơn 36 giờ huấn luyện. Tháp biến thể chưa từng thấy: 0% thắng. Mức điện huấn luyện chuẩn 100%.",
          }}
          after={{
            label: "Robot neuro-symbolic · mạng + luật",
            value: "95% thắng",
            note: "34 phút huấn luyện. Tháp biến thể: vẫn 78%. Điện huấn luyện còn 1%. Điện vận hành còn 5%.",
          }}
        />
        <ArticleProse>
          <p>
            Hai con số 1% và 5% là điểm thực sự khiến giới làm robot
            chú ý. AI hiện đại đang là một ngành ngốn điện rõ rệt: cụm
            GPU chạy huấn luyện hàng tuần, datacenter tốn nước làm
            mát. Nếu cùng một bài toán có thể giải được bằng cách viết
            thêm một bộ luật vài chục dòng và để mạng nơ-ron chỉ làm
            phần nó giỏi, thì lượng điện cần thiết đột nhiên rơi
            xuống một mức gần như nồi cơm điện so với ô tô.
          </p>
          <p>
            Tỷ lệ thắng cao trên các biến thể chưa thấy có thể giải
            thích đơn giản: planner không cần thấy biến thể đó trong
            dữ liệu, nó chỉ chạy luật. Tháp 4 đĩa, tháp 5 đĩa, tháp
            với cọc xê dịch, tất cả đều cùng một luật. Mạng nơ-ron mà
            planner gọi cũng không cần học cả tháp, nó chỉ học nhìn
            đĩa và cọc. Khả năng giải các bài chưa thấy đến từ việc
            chia rạch ròi vai trò, chứ không đến từ việc cho mạng học
            thêm dữ liệu.
          </p>
        </ArticleProse>
        <EnergyComparisonViz />
      </ArticleSection>

      <ArticleSection
        eyebrow="05 · Ý nghĩa"
        heading="Lai mạng nơ-ron với luật cổ điển. Hướng đi đáng theo dõi."
      >
        <ArticleProse>
          <p>
            Trong vài năm vừa rồi, công nghệ robot học đang đi theo
            hướng &ldquo;mạng to hơn, dữ liệu nhiều hơn&rdquo;: model
            VLA ngày càng đồ sộ, datacenter ngày càng đắt. Bài của
            Tufts gợi ra một con đường khác. Không phải cứ mạng to thì
            sẽ thay được mọi việc. Một số việc, đặc biệt là những việc
            cần lập kế hoạch nhiều bước, có cách giải đã tồn tại từ
            trước thời học máy: thuật toán cổ điển, code do con người
            viết. Khi lai hai bên lại trên cùng một bài toán, độ chính
            xác bằng hoặc cao hơn, trong khi năng lượng tiêu thụ giảm
            rõ rệt.
          </p>
          <p>
            Hướng này không xoá bỏ <Term slug="reasoning-models">model
            suy luận</Term> kiểu LLM. Nó chỉ đặt câu hỏi: trong các mảng
            có cấu trúc rõ (rút ngân hàng, xếp lịch, điều phối kho hàng,
            chơi game), liệu có nên cố nhồi việc cho mạng nơ-ron, hay
            tốt hơn là viết phần thuật toán bằng code và để mạng làm
            phần khó tự động hoá: cảm nhận thế giới? Câu trả lời từ
            tháp Hà Nội rõ ràng nghiêng về vế sau.
          </p>
          <p>
            Bạn không cần làm robot để áp dụng tinh thần này. Lần tới
            khi bạn lắp một <Term slug="agent-architecture">agent</Term>{" "}
            chạy bằng LLM, ví dụ một agent đặt vé, hãy tự hỏi: phần nào
            cần &ldquo;hiểu&rdquo; (đọc email, xác định thông tin), và
            phần nào chỉ là quy tắc (tính ngày, kiểm tra điều kiện, gọi
            API)? Phần thứ hai nên giao cho code thông thường. Nó rẻ
            hơn, đáng tin cậy hơn, và dễ debug hơn nhiều so với việc
            nhờ LLM tự suy luận.
          </p>
        </ArticleProse>
      </ArticleSection>
    </ArticleShell>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Hero viz — Tower of Hanoi snapshot showing the start state
 * (3 disks on left peg) and the goal (3 disks on right peg).
 * Beginner-friendly: bright clay disks, calm peg labels.
 * ────────────────────────────────────────────────────────────── */
export function TowerOfHanoiHeroViz() {
  const pegX = [180, 450, 720];
  const baseY = 240;
  const disks = [
    { w: 120, color: "var(--clay)" },
    { w: 90, color: "var(--peach-500)" },
    { w: 60, color: "var(--turquoise-500)" },
  ];
  return (
    <svg
      viewBox="0 0 900 340"
      className="ar-viz"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Tower of Hanoi puzzle showing start and goal state"
    >
      <defs>
        <linearGradient id="ns-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--turquoise-50)" />
          <stop offset="100%" stopColor="var(--bg-card)" />
        </linearGradient>
      </defs>
      <rect width="900" height="340" fill="url(#ns-bg)" />

      <text
        x="40"
        y="36"
        fontFamily="var(--font-mono)"
        fontSize="11"
        fill="var(--turquoise-ink)"
        letterSpacing="0.1em"
      >
        / THÁP HÀ NỘI · BÀI THI 95% VS 34%
      </text>

      {/* Ground line */}
      <line
        x1="60"
        y1={baseY + 6}
        x2="840"
        y2={baseY + 6}
        stroke="var(--text-tertiary)"
        strokeWidth={2}
      />

      {/* Three pegs */}
      {pegX.map((x, i) => (
        <g key={`peg-${i}`}>
          <rect
            x={x - 4}
            y={120}
            width={8}
            height={baseY - 120 + 6}
            rx={2}
            fill="var(--text-tertiary)"
          />
          <text
            x={x}
            y={baseY + 30}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="10"
            fill="var(--text-tertiary)"
            letterSpacing="0.16em"
          >
            {["A", "B", "C"][i]}
          </text>
        </g>
      ))}

      {/* Start: 3 disks on left peg (A) */}
      {disks.map((d, i) => {
        const y = baseY - (disks.length - i) * 26;
        return (
          <rect
            key={`start-${i}`}
            x={pegX[0] - d.w / 2}
            y={y}
            width={d.w}
            height={22}
            rx={4}
            fill={d.color}
            opacity={0.95}
          />
        );
      })}

      {/* Goal: 3 disks on right peg (C), drawn lighter as outline */}
      {disks.map((d, i) => {
        const y = baseY - (disks.length - i) * 26;
        return (
          <rect
            key={`goal-${i}`}
            x={pegX[2] - d.w / 2}
            y={y}
            width={d.w}
            height={22}
            rx={4}
            fill="none"
            stroke={d.color}
            strokeWidth={2}
            strokeDasharray="3 4"
            opacity={0.7}
          />
        );
      })}

      {/* Goal arrow over the middle peg */}
      <text
        x="450"
        y="160"
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="10"
        fill="var(--text-tertiary)"
        letterSpacing="0.14em"
      >
        DỜI CẢ CHỒNG
      </text>
      <line
        x1={260}
        y1={180}
        x2={640}
        y2={180}
        stroke="var(--turquoise-500)"
        strokeWidth={2}
      />
      <polygon
        points="640,180 632,174 632,186"
        fill="var(--turquoise-500)"
      />

      {/* Caption strip */}
      <line
        x1="40"
        y1="290"
        x2="860"
        y2="290"
        stroke="var(--border)"
        strokeWidth={1}
      />
      <text
        x="40"
        y="312"
        fontFamily="var(--font-mono)"
        fontSize="10"
        fill="var(--text-tertiary)"
        letterSpacing="0.08em"
      >
        ROBOT VLA: 34% · ROBOT NEURO-SYMBOLIC: 95% · ICRA VIENNA · 05 · 2026
      </text>
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Section 02 viz — VLA training scale: cluster of tiny video
 * frames suggesting the millions-of-demonstrations data pile.
 * ────────────────────────────────────────────────────────────── */
function VlaTrainingViz() {
  const cols = 16;
  const rows = 6;
  return (
    <ArticleViz caption="Mỗi ô là một đoạn video huấn luyện. Mạng VLA học bằng cách xem hàng triệu đoạn như vậy. Khi gặp tháp đúng cấu hình đã thấy, nó chép tốt; khác đi một chút thì lúng túng.">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 4,
          background: "var(--paper-2)",
          padding: 16,
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
        }}
      >
        {Array.from({ length: cols * rows }).map((_, i) => {
          const seed = (Math.sin(i * 12.9898) * 43758.5453) % 1;
          const intensity = 0.25 + Math.abs(seed) * 0.6;
          const isMatch = i % 11 === 0;
          return (
            <div
              key={i}
              style={{
                aspectRatio: "1",
                background: isMatch
                  ? "var(--clay)"
                  : "var(--graphite)",
                opacity: intensity,
                borderRadius: 2,
              }}
            />
          );
        })}
      </div>
    </ArticleViz>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Section 03 viz — Neural net (vision) feeds symbolic planner;
 * planner emits action; loop back. Beginner-readable diagram.
 * ────────────────────────────────────────────────────────────── */
function NeuroSymbolicPipeline() {
  return (
    <ArticleViz caption="Mạng nơ-ron đọc thế giới thành biểu tượng. Bộ luật suy luận lập kế hoạch trên biểu tượng. Cánh tay làm động tác. Lặp lại.">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 28px 1fr 28px 1fr",
          gap: 0,
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            padding: "18px 20px",
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
              marginBottom: 8,
            }}
          >
            1 · Mạng nơ-ron
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 18,
              fontWeight: 500,
              color: "var(--text-primary)",
              marginBottom: 8,
            }}
          >
            Nhìn ảnh, đọc thế giới
          </div>
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.5,
              color: "var(--text-secondary)",
              margin: 0,
            }}
          >
            Camera đưa pixel. Mạng trả: cọc nào có đĩa nào, đĩa nào trên
            đỉnh, đĩa nào đang được cầm.
          </p>
        </div>

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
            2 · Bộ luật (planner)
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 18,
              fontWeight: 500,
              color: "var(--text-primary)",
              marginBottom: 8,
            }}
          >
            Lập kế hoạch từng bước
          </div>
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.5,
              color: "var(--text-secondary)",
              margin: 0,
            }}
          >
            Code thông thường, vài chục dòng. Đầu vào: trạng thái + mục
            tiêu. Đầu ra: chuỗi nước đi.
          </p>
        </div>

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

        <div
          style={{
            padding: "18px 20px",
            background: "var(--paper-2)",
            border: "1px solid var(--border)",
            borderLeft: "4px solid var(--text-secondary)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            3 · Cánh tay
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 18,
              fontWeight: 500,
              color: "var(--text-primary)",
              marginBottom: 8,
            }}
          >
            Làm một động tác
          </div>
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.5,
              color: "var(--text-secondary)",
              margin: 0,
            }}
          >
            Nhấc đúng đĩa, dời sang đúng cọc. Vòng lặp đóng lại: mạng
            quan sát lại, planner cập nhật.
          </p>
        </div>
      </div>
    </ArticleViz>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Section 04 viz — three side-by-side bars: training energy,
 * runtime energy, training time. Neuro-symbolic vs VLA.
 * ────────────────────────────────────────────────────────────── */
function EnergyComparisonViz() {
  const rows = [
    { label: "Điện huấn luyện", vla: 100, ns: 1, unit: "%" },
    { label: "Điện vận hành", vla: 100, ns: 5, unit: "%" },
    { label: "Thời gian huấn luyện", vla: 100, ns: 1.6, unit: "%" },
  ];
  return (
    <ArticleViz caption="Cùng một bài tháp Hà Nội, ba chiều chi phí. Mỗi thanh bên trên là VLA, bên dưới là neuro-symbolic. Số nhỏ là tốt.">
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
                VLA {r.vla}
                {r.unit} · NS {r.ns}
                {r.unit}
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
                    width: `${Math.min(r.vla, 100)}%`,
                    height: "100%",
                    background: "var(--graphite)",
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
                    width: `${Math.min(r.ns, 100)}%`,
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
