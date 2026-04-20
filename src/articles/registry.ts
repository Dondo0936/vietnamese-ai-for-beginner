import type { ArticleMeta } from "@/lib/article-types";

/**
 * Article metadata — one entry per file under src/articles/<slug>.tsx.
 * Sorted newest-first at read time; the authoring order here can be
 * anything, but convention is newest at top.
 */
export const articleList: ArticleMeta[] = [
  {
    slug: "claude-design-launch",
    title: "Claude Design — dựng mockup HTML/CSS bằng prompt, chuyển giao đã chuẩn hoá",
    dek: "Công cụ mới của Anthropic cho phép designer dựng mockup UI bằng prompt tiếng Việt, rồi xuất bundle gồm HTML, CSS, README và chat transcript để coding agent dựng thẳng thành sản phẩm. Bài viết này được làm ra bằng chính nó.",
    source: {
      name: "Anthropic",
      host: "claude.ai/design",
      url: "https://claude.ai/design",
    },
    date: "2026-04-20",
    readingTime: "7 phút",
    category: "tool",
    tag: "hot",
    lessonRefs: [
      "prompt-engineering",
      "ai-coding-assistants",
      "computer-use",
      "agentic-workflows",
    ],
    relatedArticles: ["claude-opus-4-7-launch", "mixture-of-depths"],
    heroViz: "design-handoff-flow",
    isLead: true,
  },
  {
    slug: "claude-opus-4-7-launch",
    title: "Claude Opus 4.7 — reasoning chain dài hơn, giá rẻ 30%",
    dek: "Flagship mới của Anthropic: context 500k token, SWE-bench 71.2%, giá ngang Claude 3.5. Reasoning chain dài thêm 2.4 lần nhưng cost-per-task vẫn giảm.",
    source: {
      name: "Anthropic",
      host: "anthropic.com",
      url: "https://www.anthropic.com/news",
    },
    date: "2026-04-18",
    readingTime: "6 phút",
    category: "model",
    tag: "flagship",
    lessonRefs: [
      "chain-of-thought",
      "reasoning-models",
      "kv-cache",
      "cost-latency-tokens",
    ],
    relatedArticles: ["mixture-of-depths", "deepseek-v4-open-weights"],
    heroViz: "reasoning-chain",
    isLead: true,
  },
  {
    slug: "mixture-of-depths",
    title: "Mixture-of-Depths — token nào cần nghĩ sâu, token nào không",
    dek: "DeepMind đề xuất router động: chỉ chừng 30% token đi qua toàn bộ layer. FLOPs giảm 50% mà MMLU giữ nguyên. Đây là cách transformer học cách chọn lọc, thay vì đối xử đều với mọi token.",
    source: {
      name: "arXiv · 2604.11283",
      host: "arxiv.org",
      url: "https://arxiv.org/abs/2604.11283",
    },
    date: "2026-04-17",
    readingTime: "9 phút",
    category: "paper",
    tag: "hot",
    lessonRefs: ["transformer", "attention-mechanism", "moe", "scaling-laws"],
    relatedArticles: ["claude-opus-4-7-launch", "deepseek-v4-open-weights"],
    heroViz: "depth-router",
    isLead: true,
  },
  {
    slug: "deepseek-v4-open-weights",
    title: "DeepSeek-V4 mở trọng số — số 1 OpenLLM với 37B active parameters",
    dek: "236B tổng tham số, 37B active qua MoE 8 expert. Apache 2.0, chạy được trên 2× H100 khi dùng INT4. Hơn 140 fine-tune được đẩy lên trong 3 ngày đầu.",
    source: {
      name: "HuggingFace",
      host: "huggingface.co",
      url: "https://huggingface.co/deepseek-ai",
    },
    date: "2026-04-16",
    readingTime: "5 phút",
    category: "open",
    tag: "mã mở",
    lessonRefs: ["moe", "quantization", "transformer"],
    relatedArticles: ["claude-opus-4-7-launch", "mixture-of-depths"],
    heroViz: "moe-routing",
    isLead: true,
  },
];

/** Lookup map: slug → ArticleMeta. */
export const articleMap: Record<string, ArticleMeta> = Object.fromEntries(
  articleList.map((a) => [a.slug, a]),
);

/** Look up a single article by slug. Returns undefined if not found. */
export function getArticleBySlug(slug: string): ArticleMeta | undefined {
  return articleMap[slug];
}

/** All articles, newest first (by `date`). Stable on tie. */
export function getAllArticles(): ArticleMeta[] {
  return [...articleList].sort((a, b) => {
    if (a.date === b.date) return 0;
    return a.date < b.date ? 1 : -1;
  });
}

/** Latest N articles (newest first). */
export function getLatestArticles(n: number): ArticleMeta[] {
  return getAllArticles().slice(0, n);
}

/**
 * Pick the current lead article (first `isLead: true` after sort),
 * and a couple of companion articles for the side rail.
 */
export function getLeadAndCompanions(): {
  lead: ArticleMeta;
  companions: ArticleMeta[];
  tail: ArticleMeta[];
} {
  const all = getAllArticles();
  const lead = all.find((a) => a.isLead) ?? all[0];
  const rest = all.filter((a) => a.slug !== lead.slug);
  const companions = rest.slice(0, 2);
  const tail = rest.slice(2);
  return { lead, companions, tail };
}
