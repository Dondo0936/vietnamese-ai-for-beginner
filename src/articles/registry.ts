import type { ArticleMeta } from "@/lib/article-types";

/**
 * Article metadata — one entry per file under src/articles/<slug>.tsx.
 * Sorted newest-first at read time; the authoring order here can be
 * anything, but convention is newest at top.
 */
export const articleList: ArticleMeta[] = [
  {
    slug: "midjourney-vs-chatgpt-image-2",
    title:
      "Midjourney V8.1 vẽ đẹp, ChatGPT Images 2.0 vẽ đúng chữ.",
    dek: "Tháng 4 năm 2026, hai bản image gen mới ra cùng tuần. Ngày 21, OpenAI tung ChatGPT Images 2.0 (model gpt-image-2), bản image gen đầu tiên có thinking mode biết suy luận trước khi vẽ. Trong khi đó, ngày 30, Midjourney chuyển V8.1 thành mặc định, mang ảnh 2K trực tiếp lên web app kèm text rendering tốt hơn V7 đáng kể. Cùng một prompt yêu cầu vẽ biển hiệu PHỞ BÒ NGON, Midjourney vẽ ra một bức không khí đẹp nhưng biển hiệu vẫn sai chính tả. Tuy nhiên, Images 2.0 vẽ một bức trông giống ảnh chụp điện thoại, biển hiệu đúng từng dấu, và còn suy nghĩ về layout trước khi vẽ. Bài viết phân tích vì sao diffusion (Midjourney) và token autoregressive kèm thinking mode (Images 2.0) sinh ra hai phong cách rất khác, lúc nào nên dùng bên nào, và tại sao nhiều designer dùng cả hai trong cùng một quy trình.",
    source: {
      name: "udemi.tech · phân tích so sánh",
      host: "udemi.tech",
      url: "https://udemi.tech/articles/midjourney-vs-chatgpt-image-2",
    },
    date: "2026-05-02",
    readingTime: "9 phút",
    category: "tool",
    tag: "hot",
    lessonRefs: [
      "agent-architecture",
      "reasoning-models",
      "chain-of-thought",
    ],
    relatedArticles: [
      "neuro-symbolic-robots",
      "turboquant-kv-cache-compression",
    ],
    heroViz: "image-gen-split",
    isLead: true,
  },
  {
    slug: "neuro-symbolic-robots",
    title:
      "Vì sao một robot biết nghĩ lại tiết kiệm năng lượng gấp 100 lần.",
    dek: "Trong bài thi tháp Hà Nội, một cánh tay robot chạy AI kiểu cũ chỉ thắng 34%. Loại AI này học bằng cách bắt chước hàng triệu video người làm. Robot mới của đại học Tufts cộng thêm một bộ luật suy luận, vừa thắng 95% vừa giải được cả các biến thể tháp chưa từng có trong dữ liệu. Cái tốn kém nhất không phải độ chính xác mà là điện: cách nghĩ mới chỉ tốn khoảng 1% điện cho việc huấn luyện và 5% điện cho việc vận hành. Nghiên cứu vừa được công bố tại hội nghị ICRA Vienna tháng 5 năm 2026. Bài viết giải thích vì sao một mạng nơ-ron lai với bộ luật cổ điển lại vừa chính xác vừa tiết kiệm hơn việc nhồi cho mạng học thật to.",
    source: {
      name: "arXiv · 2602.11743",
      host: "arxiv.org",
      url: "https://arxiv.org/abs/2602.11743",
    },
    date: "2026-05-01",
    readingTime: "8 phút",
    category: "paper",
    tag: "hot",
    lessonRefs: [
      "agent-architecture",
      "reasoning-models",
      "chain-of-thought",
      "agentic-workflows",
    ],
    relatedArticles: [
      "turboquant-kv-cache-compression",
      "mixture-of-depths",
    ],
    heroViz: "tower-of-hanoi",
    isLead: true,
  },
  {
    slug: "turboquant-kv-cache-compression",
    title:
      "TurboQuant. Nén KV cache xuống 3 bit mà accuracy không đổi.",
    dek: "Hỏi một câu vào model đang giữ 200K token context, GPU nuốt vài chục GB chỉ để nhớ KV. TurboQuant của Google Research xoay vector trước khi quantize, nén key và value xuống 3 bit, giảm 6 lần memory, chạy nhanh hơn tới 8 lần trên H100. Không cần fine-tune, không cần calibration, accuracy trên LongBench gần như không sứt mẻ. Bài viết mổ xẻ tại sao quantize thẳng KV cache hỏng, phép quay Hadamard biến đường cong outlier thành phân phối beta thế nào, và lớp Quantized Johnson-Lindenstrauss khử nốt bias còn lại.",
    source: {
      name: "arXiv · 2504.19874",
      host: "arxiv.org",
      url: "https://arxiv.org/abs/2504.19874",
    },
    date: "2026-05-01",
    readingTime: "9 phút",
    category: "paper",
    tag: "hot",
    lessonRefs: [
      "kv-cache",
      "quantization",
      "inference-optimization",
      "long-context",
    ],
    relatedArticles: [
      "mixture-of-depths",
      "response-streaming",
    ],
    heroViz: "kv-rotation",
    isLead: true,
  },
  {
    slug: "claude-controls-apps-adobe",
    title:
      "Claude điều khiển ứng dụng thế nào. Bộ Adobe Creative Cloud 2026 làm ví dụ.",
    dek: "Bạn gõ một câu, Claude xoá price tag, đổi nền, xuất 80 ảnh sản phẩm. Ngày 28 tháng 4 năm 2026, Anthropic ship 9 connector cho công cụ sáng tạo, gồm Adobe for creativity với hơn 50 tool xuyên Photoshop, Premiere, Illustrator. Bài viết mổ xẻ ba cơ chế Claude dùng để điều khiển một desktop app: computer use (screenshot và toạ độ), MCP server (tool call có cấu trúc), UXP plugin (code chạy bên trong Photoshop). Khi nào dùng cái nào, mặt phẳng tấn công nào kèm theo, và đâu là cạm bẫy thực tế.",
    source: {
      name: "udemi · giải thích",
      host: "udemi.tech",
      url: "https://udemi.tech/articles/claude-controls-apps-adobe",
    },
    date: "2026-04-29",
    readingTime: "11 phút",
    category: "tool",
    tag: "giải thích",
    lessonRefs: [
      "computer-use",
      "model-context-protocol",
      "function-calling",
      "agentic-workflows",
      "prompt-injection-defense",
    ],
    relatedArticles: [
      "claude-in-excel-how-it-works",
      "claude-design-launch",
    ],
  },
  {
    slug: "claude-in-excel-how-it-works",
    title:
      "Claude trong Excel hoạt động thế nào. Bên trong cách AI sửa bảng tính.",
    dek: "Bạn bấm Ctrl+Alt+C, sidebar trượt ra, gõ một câu. Vài giây sau hai cell đổi màu cam và một citation chỉ thẳng tới ô lỗi. Bài viết mổ xẻ Office.js taskpane, vòng lặp tool use bốn nhịp đọc-đề-xuất-ghi-kiểm-chứng, lớp diff, ranh giới quyền truy cập, và lỗ hổng prompt injection CellShock đầu năm 2026.",
    source: {
      name: "udemi · giải thích",
      host: "udemi.tech",
      url: "https://udemi.tech/articles/claude-in-excel-how-it-works",
    },
    date: "2026-04-25",
    readingTime: "10 phút",
    category: "tool",
    tag: "giải thích",
    lessonRefs: [
      "function-calling",
      "agentic-workflows",
      "prompt-injection-defense",
      "prompt-engineering",
    ],
    relatedArticles: ["claude-design-launch", "claude-opus-4-7-launch"],
  },
  {
    slug: "tts-how-it-works",
    title: "Máy đọc thành tiếng thế nào. Bên trong kỹ thuật ElevenLabs.",
    dek: "Bạn gõ một câu. Loa phát ra giọng người. Giữa hai thứ đó là một pipeline năm khối: chuẩn hoá văn bản, grapheme-to-phoneme, prosody, acoustic model, vocoder. Thêm một lớp speaker embedding, và hệ thống học xong một giọng chỉ sau 30 giây audio.",
    source: {
      name: "udemi · giải thích",
      host: "udemi.tech",
      url: "https://udemi.tech/articles/tts-how-it-works",
    },
    date: "2026-04-23",
    readingTime: "9 phút",
    category: "infra",
    tag: "giải thích",
    lessonRefs: [
      "tts",
      "speech-recognition",
      "transformer",
      "embedding-model",
    ],
    relatedArticles: ["llm-math-weakness", "response-streaming"],
  },
  {
    slug: "llm-math-weakness",
    title: "Vì sao ChatGPT hay sai khi tính toán",
    dek: "Hỏi ChatGPT tính 7583 × 2947, bạn nhận được một con số trông rất thuyết phục nhưng thường sai. Lỗi này có nguyên nhân cơ học: tokenizer cắt nhỏ chữ số, và model chỉ đoán chữ kế tiếp chứ không thực sự tính. Bài viết giải thích cơ chế, rồi chỉ ra cách chuyển việc tính cho đúng công cụ.",
    source: {
      name: "udemi · giải thích",
      host: "udemi.tech",
      url: "https://udemi.tech/articles/llm-math-weakness",
    },
    date: "2026-04-23",
    readingTime: "7 phút",
    category: "infra",
    tag: "giải thích",
    lessonRefs: [
      "tokenization",
      "chain-of-thought",
      "function-calling",
      "prompt-engineering",
    ],
    relatedArticles: ["response-streaming", "claude-opus-4-7-launch"],
  },
  {
    slug: "large-tabular-models",
    title:
      "Large Tabular Models — khi AI biết đọc bảng mà không cần train",
    dek: "TabPFN v2 được train một lần trên hàng trăm triệu bảng giả, sau đó đoán cột thiếu cho bất kỳ bảng nào — không fine-tune, không hyperparameter. Trên bảng dưới 10K dòng, nó đang vượt XGBoost, thứ đã thống trị dữ liệu bảng suốt hơn một thập kỷ.",
    source: {
      name: "Nature",
      host: "nature.com",
      url: "https://www.nature.com/articles/s41586-024-08328-6",
    },
    date: "2026-04-22",
    readingTime: "8 phút",
    category: "paper",
    tag: "hot",
    lessonRefs: [
      "transformer",
      "in-context-learning",
      "decision-trees",
      "fine-tuning-vs-prompting",
    ],
    relatedArticles: ["claude-opus-4-7-launch", "mixture-of-depths"],
  },
  {
    slug: "response-streaming",
    title: "Response streaming — vì sao chatbot hiện chữ từng chút một",
    dek: "Một câu trả lời dài 8 giây. Bạn thấy chữ đầu tiên sau 280ms. Đó không phải hiệu ứng — đó là SSE và TTFT, hai khái niệm quyết định chatbot cảm giác sống hay chết.",
    source: {
      name: "udemi · giải thích",
      host: "udemi.tech",
      url: "https://udemi.tech/articles/response-streaming",
    },
    date: "2026-04-21",
    readingTime: "6 phút",
    category: "infra",
    tag: "giải thích",
    lessonRefs: [
      "tokenization",
      "model-serving",
      "cost-latency-tokens",
      "function-calling",
    ],
    relatedArticles: ["claude-opus-4-7-launch", "mixture-of-depths"],
  },
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
  {
    slug: "operator-2-browser-agent",
    title: "Operator 2 — agent và người cùng điều khiển một tab",
    dek: "OpenAI cho agent và người dùng chung một trình duyệt: cùng cursor, cùng tab, cùng form. Mỗi hành động có hậu quả đều phải có xác nhận từ người trước khi chạy.",
    source: {
      name: "OpenAI blog",
      host: "openai.com",
      url: "https://openai.com/blog",
    },
    date: "2026-04-15",
    readingTime: "5 phút",
    category: "agent",
    tag: "agent",
    lessonRefs: [
      "agent-architecture",
      "agentic-workflows",
      "computer-use",
      "ai-coding-assistants",
    ],
    relatedArticles: ["claude-design-launch", "claude-opus-4-7-launch"],
    heroViz: "co-browser",
  },
  {
    slug: "phogpt-7b-reasoning",
    title: "PhoGPT-7B Reasoning — model suy luận tiếng Việt đầu tiên",
    dek: "VinAI tune Llama-3.1 trên 40B token tiếng Việt có giải thích. VMLU 68%, ngang GPT-4o ở môn Văn và Sử. Model đầu tiên làm reasoning tốt trên tiếng Việt.",
    source: {
      name: "VinAI Research",
      host: "vinai.io",
      url: "https://vinai.io",
    },
    date: "2026-04-14",
    readingTime: "6 phút",
    category: "vietnam",
    tag: "Việt Nam",
    lessonRefs: [
      "tokenization",
      "reasoning-models",
      "chain-of-thought",
      "fine-tuning-vs-prompting",
    ],
    relatedArticles: ["deepseek-v4-open-weights", "claude-opus-4-7-launch"],
    heroViz: "vmlu-bars",
  },
  {
    slug: "ai-index-report-2026",
    title: "AI Index Report 2026 — chi phí inference giảm 86% trong 12 tháng",
    dek: "Báo cáo thường niên của Stanford HAI: giá GPT-4 level rơi từ 30 đô xuống 4 đô mỗi triệu token. Số model mở tăng 3.1 lần. Benchmark GPQA gần bão hoà.",
    source: {
      name: "Stanford HAI",
      host: "hai.stanford.edu",
      url: "https://hai.stanford.edu/ai-index",
    },
    date: "2026-04-13",
    readingTime: "10 phút",
    category: "report",
    tag: "thị trường",
    lessonRefs: ["cost-latency-tokens", "scaling-laws"],
    relatedArticles: ["claude-opus-4-7-launch", "deepseek-v4-open-weights"],
    heroViz: "cost-curve",
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
