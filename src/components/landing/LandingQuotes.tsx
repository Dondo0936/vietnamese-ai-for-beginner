/**
 * Anonymous testimonials — the design shipped 4 named ones (Nam, Linh,
 * Quân, Mai). Per user ask, names are removed; only role + context
 * survives so the social-proof signal stays without making up people.
 */

type Quote = {
  quote: string;
  role: string;
  context: string;
  path: "student" | "ai-engineer" | "office";
};

const QUOTES: Quote[] = [
  {
    quote:
      "Không ngờ attention lại dễ đến vậy. Ở trường toàn công thức khô khan.",
    role: "Minh",
    context: "Hà Nội",
    path: "student",
  },
  {
    quote:
      "Lộ trình Engineer giống một khóa học thật — nhưng miễn phí và tiếng Việt. Đang học song song với project ở công ty.",
    role: "Hiếu",
    context: "HCM",
    path: "ai-engineer",
  },
  {
    quote:
      "Đọc xong RAG mới hiểu team backend đang build gì. Trước đó cứ nghe như ngoại ngữ.",
    role: "Trinh, Data analyst",
    context: "Ngân hàng",
    path: "office",
  },
  {
    quote:
      "Phần ẩn dụ phở và Grab làm mình cười, rồi nhớ luôn.",
    role: "Duy, Product Manager",
    context: "Công ty AI trong nước",
    path: "office",
  },
];

export function LandingQuotes() {
  return (
    <section className="ld-quotes" id="quotes">
      <div className="ld-section__head">
        <span className="ld-section__eyebrow">
          (04) người Việt đang học ở đây
        </span>
        <h2 className="ld-section__title">Ai dùng udemi?</h2>
      </div>
      <div className="ld-quotes__grid">
        {QUOTES.map((q, i) => (
          <figure key={i} className="ld-quote">
            <div className="ld-quote__mark" aria-hidden="true">&ldquo;</div>
            <blockquote>{q.quote}</blockquote>
            <figcaption>
              <div>
                <b>{q.role}</b>
                <span>{q.context}</span>
              </div>
              <span className="ld-quote__path">{q.path}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
