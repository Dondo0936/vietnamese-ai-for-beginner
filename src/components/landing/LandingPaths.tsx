import Link from "next/link";

/**
 * The 4 profession paths. Matches the design's numbered grid (01–04),
 * each card linking to the corresponding `/paths/<slug>`.
 */

type Path = {
  num: string;
  name: string;
  slug: string;
  meta: string;
  desc: string;
  tag: string;
  topics: string[];
};

const PATHS: Path[] = [
  {
    num: "01",
    name: "Học sinh · Sinh viên",
    slug: "student",
    meta: "~52h · 48 bài",
    desc: "Toán nền tảng, ML cơ bản, mạng nơ-ron, kỹ năng thực hành. Có ẩn dụ chợ-phở-Grab cho mỗi khái niệm.",
    tag: "cho người mới bắt đầu",
    topics: ["vectors", "linear regression", "CNN", "backprop", "k-means"],
  },
  {
    num: "02",
    name: "Nhân viên văn phòng",
    slug: "office",
    meta: "~24h · 35 bài",
    desc: "Prompt, ứng dụng thực tế, an toàn & đạo đức — không code, không công thức. 50–70% là hình ảnh.",
    tag: "không cần nền kỹ thuật",
    topics: ["prompting", "LLM cơ bản", "hallucination", "AI governance"],
  },
  {
    num: "03",
    name: "AI Engineer",
    slug: "ai-engineer",
    meta: "~110h · 96 bài",
    desc: "Kiến trúc, LLM, fine-tuning, RAG & agents, MLOps, đánh giá, an toàn. Viết để build production được.",
    tag: "build được sản phẩm thật",
    topics: ["transformer", "RAG", "LoRA", "function calling", "kv-cache"],
  },
  {
    num: "04",
    name: "AI Researcher",
    slug: "ai-researcher",
    meta: "~92h · 78 bài",
    desc: "Lý thuyết sâu, kiến trúc tiên tiến, alignment, RL, multimodal. Đọc paper có ngữ cảnh.",
    tag: "đọc paper có ngữ cảnh",
    topics: ["alignment", "diffusion", "DPO", "MoE", "constitutional AI"],
  },
];

export function LandingPaths() {
  return (
    <section className="ld-paths" id="paths">
      <div className="ld-section__head">
        <span className="ld-section__eyebrow">(01) hoặc duyệt theo lộ trình</span>
        <h2 className="ld-section__title">
          Bốn con đường.<br />Một cho mỗi người.
        </h2>
        <Link href="/browse" className="ld-section__link">
          Xem cả 4 →
        </Link>
      </div>
      <div className="ld-paths__grid">
        {PATHS.map((p) => (
          <Link key={p.slug} href={`/paths/${p.slug}`} className="ld-path">
            <div className="ld-path__num">{p.num}</div>
            <div className="ld-path__body">
              <div className="ld-path__head">
                <h3>{p.name}</h3>
                <span className="ld-path__arrow" aria-hidden="true">→</span>
              </div>
              <div className="ld-path__meta">
                <span>{p.meta}</span>
                <span>·</span>
                <span className="ld-path__tag">{p.tag}</span>
              </div>
              <p>{p.desc}</p>
              <div className="ld-path__topics">
                {p.topics.map((t) => (
                  <span key={t} className="ld-path__topic">{t}</span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
