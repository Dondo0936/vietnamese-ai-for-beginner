import Link from "next/link";

/**
 * 6 hot-this-week featured cards, hardcoded per design.
 *
 * Each card has a bespoke inline SVG visualization so the grid feels
 * alive (not a row of gray placeholders). Real topic slugs link to the
 * existing topic pages where available.
 */

type Card = {
  kind: VizKind;
  cat: string;
  title: string;
  sub: string;
  meta: string;
  slug: string;
};

type VizKind =
  | "reasoning"
  | "rag"
  | "constitutional"
  | "moe"
  | "kvcache"
  | "lora";

const CARDS: Card[] = [
  {
    kind: "reasoning",
    cat: "Engineer",
    title: "Reasoning models",
    sub: "Vì sao o1, Claude 3.7, DeepSeek-R1 suy luận tốt hơn?",
    meta: "14 phút · bài #234",
    slug: "reasoning-models",
  },
  {
    kind: "rag",
    cat: "Engineer",
    title: "Agentic RAG",
    sub: "Khi RAG biết tự gọi tool và tự quyết định retrieve lại.",
    meta: "18 phút · bài #241",
    slug: "agentic-rag",
  },
  {
    kind: "constitutional",
    cat: "Researcher",
    title: "Constitutional AI",
    sub: "Anthropic dạy model tự phê bình ra sao — không cần RLHF.",
    meta: "16 phút · bài #198",
    slug: "constitutional-ai",
  },
  {
    kind: "moe",
    cat: "Researcher",
    title: "Mixture of Experts",
    sub: "Mixtral, DeepSeek — 'thuê chuyên gia' cho từng token.",
    meta: "12 phút · bài #189",
    slug: "mixture-of-experts",
  },
  {
    kind: "kvcache",
    cat: "Engineer",
    title: "KV cache",
    sub: "Vì sao token thứ 1000 chạy nhanh hơn token đầu tiên.",
    meta: "9 phút · bài #167",
    slug: "kv-cache",
  },
  {
    kind: "lora",
    cat: "Engineer",
    title: "LoRA & QLoRA",
    sub: "Fine-tune mô hình 70B trên một GPU consumer.",
    meta: "15 phút · bài #152",
    slug: "lora",
  },
];

export function LandingFeatured() {
  return (
    <section className="ld-featured" id="featured">
      <div className="ld-section__head">
        <span className="ld-section__eyebrow">(02) chủ đề hot tuần này</span>
        <h2 className="ld-section__title">Mới trên udemi</h2>
        <span className="ld-section__meta">cập nhật hàng tuần · Chủ Nhật</span>
      </div>
      <div className="ld-featured__grid">
        {CARDS.map((c) => (
          <Link key={c.slug} href={`/topics/${c.slug}`} className="ld-card">
            <div className="ld-card__viz">
              <FeaturedViz kind={c.kind} />
              <span className="ld-card__badge">{c.cat}</span>
            </div>
            <div className="ld-card__body">
              <h4>{c.title}</h4>
              <p>{c.sub}</p>
              <div className="ld-card__meta">
                <span>{c.meta}</span>
                <span className="ld-card__arrow" aria-hidden="true">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function FeaturedViz({ kind }: { kind: VizKind }) {
  const common = {
    className: "ld-viz",
    viewBox: "0 0 220 120",
    preserveAspectRatio: "xMidYMid meet" as const,
  };

  if (kind === "reasoning") {
    return (
      <svg {...common}>
        {[
          [20, 60],
          [60, 30],
          [60, 90],
          [110, 60],
          [160, 30],
          [160, 90],
          [200, 60],
        ].map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="6"
            fill="var(--accent)"
            opacity={i === 3 ? 1 : 0.45}
          />
        ))}
        <path
          d="M20,60 L60,30 L110,60 L160,30 L200,60"
          fill="none"
          stroke="var(--foreground)"
          strokeWidth="1"
        />
        <path
          d="M20,60 L60,90 L110,60 L160,90 L200,60"
          fill="none"
          stroke="var(--foreground)"
          strokeWidth="1"
          strokeDasharray="3 2"
        />
        <text
          x="110"
          y="115"
          fontSize="9"
          textAnchor="middle"
          fill="var(--text-tertiary)"
          fontFamily="var(--font-mono)"
        >
          chain of thought
        </text>
      </svg>
    );
  }

  if (kind === "rag") {
    return (
      <svg {...common}>
        <defs>
          <marker
            id="rag-ar"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M0,0 L8,5 L0,10 Z" fill="var(--accent)" />
          </marker>
        </defs>
        <rect x="20" y="40" width="50" height="40" fill="none" stroke="var(--foreground)" />
        <text x="45" y="64" fontSize="10" textAnchor="middle" fill="var(--text-secondary)">
          query
        </text>
        <path d="M70,60 L95,60" stroke="var(--accent)" strokeWidth="2" markerEnd="url(#rag-ar)" />
        <circle cx="115" cy="60" r="20" fill="rgba(32,184,176,0.18)" stroke="var(--accent)" />
        <text x="115" y="64" fontSize="9" textAnchor="middle" fill="var(--turquoise-ink)">
          agent
        </text>
        <path d="M135,60 L160,60" stroke="var(--accent)" strokeWidth="2" markerEnd="url(#rag-ar)" />
        <rect x="160" y="30" width="40" height="18" fill="var(--bg-surface)" stroke="var(--foreground)" />
        <rect x="160" y="52" width="40" height="18" fill="var(--bg-surface)" stroke="var(--foreground)" />
        <rect x="160" y="74" width="40" height="18" fill="var(--bg-surface)" stroke="var(--foreground)" />
        <path
          d="M180,92 q-30,20 -65,-30"
          fill="none"
          stroke="var(--foreground)"
          strokeDasharray="2 2"
        />
      </svg>
    );
  }

  if (kind === "constitutional") {
    return (
      <svg {...common}>
        <rect x="40" y="20" width="140" height="30" fill="none" stroke="var(--foreground)" />
        <text x="110" y="40" fontSize="10" textAnchor="middle" fill="var(--text-secondary)">
          câu trả lời ban đầu
        </text>
        <path
          d="M110,50 L110,60 M110,60 L95,70 M110,60 L125,70"
          stroke="var(--foreground)"
          fill="none"
        />
        <rect x="20" y="70" width="80" height="30" fill="rgba(32,184,176,0.12)" stroke="var(--accent)" />
        <text x="60" y="90" fontSize="9" textAnchor="middle" fill="var(--turquoise-ink)">
          tự phê bình
        </text>
        <rect x="120" y="70" width="80" height="30" fill="none" stroke="var(--foreground)" />
        <text x="160" y="90" fontSize="9" textAnchor="middle" fill="var(--text-secondary)">
          sửa lại
        </text>
      </svg>
    );
  }

  if (kind === "moe") {
    return (
      <svg {...common}>
        <text x="20" y="64" fontSize="10" fill="var(--text-secondary)">
          token
        </text>
        <circle cx="70" cy="60" r="10" fill="var(--foreground)" />
        <path
          d="M80,60 L130,30 M80,60 L130,60 M80,60 L130,90"
          stroke="var(--text-tertiary)"
          strokeDasharray="2 2"
        />
        <rect x="130" y="20" width="70" height="20" fill="var(--accent)" />
        <text x="165" y="34" fontSize="9" textAnchor="middle" fill="var(--background)">
          expert 3 ←
        </text>
        <rect x="130" y="50" width="70" height="20" fill="none" stroke="var(--foreground)" />
        <text x="165" y="64" fontSize="9" textAnchor="middle" fill="var(--text-tertiary)">
          expert 7
        </text>
        <rect x="130" y="80" width="70" height="20" fill="none" stroke="var(--foreground)" />
        <text x="165" y="94" fontSize="9" textAnchor="middle" fill="var(--text-tertiary)">
          expert 1
        </text>
      </svg>
    );
  }

  if (kind === "kvcache") {
    return (
      <svg {...common}>
        {Array.from({ length: 10 }).map((_, i) => (
          <g key={i}>
            <rect
              x={18 + i * 18}
              y="40"
              width="14"
              height="14"
              fill={i < 7 ? "var(--accent)" : "none"}
              stroke="var(--foreground)"
            />
            <rect
              x={18 + i * 18}
              y="58"
              width="14"
              height="14"
              fill={i < 7 ? "rgba(32,184,176,0.55)" : "none"}
              stroke="var(--foreground)"
            />
          </g>
        ))}
        <text x="20" y="90" fontSize="9" fill="var(--text-tertiary)" fontFamily="var(--font-mono)">
          cached
        </text>
        <text
          x="150"
          y="90"
          fontSize="9"
          fill="var(--text-tertiary)"
          fontFamily="var(--font-mono)"
        >
          new
        </text>
        <text x="20" y="30" fontSize="10" fill="var(--text-secondary)">
          K / V
        </text>
      </svg>
    );
  }

  // lora
  return (
    <svg {...common}>
      <rect x="30" y="30" width="60" height="60" fill="var(--bg-surface)" stroke="var(--foreground)" />
      <text x="60" y="64" fontSize="10" textAnchor="middle" fill="var(--text-secondary)">
        W (frozen)
      </text>
      <text x="100" y="64" fontSize="18" textAnchor="middle" fill="var(--text-secondary)">
        +
      </text>
      <rect
        x="115"
        y="45"
        width="30"
        height="30"
        fill="rgba(32,184,176,0.2)"
        stroke="var(--accent)"
      />
      <text x="130" y="64" fontSize="10" textAnchor="middle" fill="var(--turquoise-ink)">
        A
      </text>
      <text x="155" y="64" fontSize="14" textAnchor="middle" fill="var(--text-secondary)">
        ×
      </text>
      <rect
        x="170"
        y="45"
        width="30"
        height="30"
        fill="rgba(32,184,176,0.2)"
        stroke="var(--accent)"
      />
      <text x="185" y="64" fontSize="10" textAnchor="middle" fill="var(--turquoise-ink)">
        B
      </text>
      <text x="115" y="100" fontSize="9" fill="var(--text-tertiary)" fontFamily="var(--font-mono)">
        rank 8 · chỉnh
      </text>
    </svg>
  );
}
