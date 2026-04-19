import type { Stage } from "@/components/paths/LearningPathPage";

/**
 * Path-aware navigation registry.
 *
 * Single source of truth for the four adult learning paths' stage structures.
 * TopicLayout reads ?path= from the URL and calls getPathNeighbors here to
 * derive prev/next links that follow the learner's current path rather than
 * the topic's category.
 *
 */

export type AdultPathId = "student" | "office" | "ai-engineer" | "ai-researcher";

export const ADULT_PATH_IDS: readonly AdultPathId[] = [
  "student",
  "office",
  "ai-engineer",
  "ai-researcher",
] as const;

export function isAdultPathId(value: unknown): value is AdultPathId {
  return (
    typeof value === "string" &&
    (ADULT_PATH_IDS as readonly string[]).includes(value)
  );
}

interface PathDefinition {
  id: AdultPathId;
  nameVi: string;
  stages: Stage[];
}

// ─── Student path ───────────────────────────────────────────────
const STUDENT_STAGES: Stage[] = [
  {
    title: "Giới thiệu",
    slugs: ["what-is-ml", "math-readiness", "data-and-datasets"],
  },
  {
    title: "Nền tảng toán",
    slugs: [
      "vectors-and-matrices",
      "vectors-and-matrices-in-photo-search",
      "eigendecomposition-pca",
      "probability-statistics",
      "probability-statistics-in-spam-filter",
      "derivatives-intuition",
      "calculus-for-backprop",
      "calculus-for-backprop-in-model-training",
      "gradient-intuition",
    ],
  },
  {
    title: "ML cơ bản",
    slugs: [
      "supervised-unsupervised-rl",
      "supervised-unsupervised-rl-in-netflix",
      "linear-regression",
      "linear-regression-in-housing",
      "logistic-regression",
      "logistic-regression-in-spam-filter",
      "information-theory",
      "information-theory-in-compression",
      "decision-trees",
      "decision-trees-in-loan-scoring",
      "knn",
      "knn-in-symptom-checker",
      "naive-bayes",
      "naive-bayes-in-email-classification",
      "k-means",
      "k-means-in-music-recs",
      "confusion-matrix",
      "confusion-matrix-in-medical-testing",
      "bias-variance",
      "bias-variance-in-netflix-prize",
      "overfitting-underfitting",
      "overfitting-underfitting-in-compas",
      "cross-validation",
      "cross-validation-in-kaggle",
      "train-val-test",
      "train-val-test-in-youtube",
    ],
  },
  {
    title: "Mạng nơ-ron",
    slugs: [
      "neural-network-overview",
      "neural-network-overview-in-voice-assistants",
      "perceptron",
      "perceptron-in-image-classification",
      "mlp",
      "mlp-in-credit-scoring",
      "activation-functions",
      "activation-functions-in-alphago",
      "forward-propagation",
      "forward-propagation-in-chat-response",
      "backpropagation",
      "backpropagation-in-translation",
      "gradient-descent",
      "gradient-descent-in-training",
      "loss-functions",
      "loss-functions-in-recommendation",
      "epochs-batches",
      "epochs-batches-in-gpt-training",
    ],
  },
  {
    title: "Kỹ năng thực hành",
    slugs: [
      "data-preprocessing",
      "data-preprocessing-in-uber-eta",
      "feature-engineering",
      "feature-engineering-in-fraud-detection",
      "python-for-ml",
      "model-evaluation-selection",
      "model-evaluation-selection-in-kaggle",
      "jupyter-colab-workflow",
      "end-to-end-ml-project",
    ],
  },
];

// ─── Office path ────────────────────────────────────────────────
const OFFICE_STAGES: Stage[] = [
  {
    title: "Bắt đầu với AI",
    slugs: [
      "getting-started-with-ai",
      "llm-overview",
      "llm-overview-in-chat-assistants",
      "prompt-engineering",
      "prompt-engineering-in-writing-tools",
      "chain-of-thought",
      "chain-of-thought-in-reasoning-models",
      "in-context-learning",
      "in-context-learning-in-chatbots",
      "temperature",
      "temperature-in-creative-writing",
      "hallucination",
      "hallucination-in-legal-research",
      "context-window",
      "context-window-in-long-documents",
    ],
  },
  {
    title: "Ứng dụng thực tế",
    slugs: [
      "rag",
      "semantic-search",
      "ai-coding-assistants",
      "agentic-workflows",
      "ai-for-writing",
      "ai-for-data-analysis",
      "ai-privacy-security",
      "ai-tool-evaluation",
    ],
  },
  {
    title: "An toàn & Đạo đức",
    slugs: ["bias-fairness", "bias-fairness-in-hiring", "ai-governance", "ai-governance-in-enterprise", "guardrails", "guardrails-in-chat-assistants", "explainability", "explainability-in-credit-decisions"],
  },
  {
    title: "Ứng dụng ngành",
    slugs: [
      "ai-in-finance",
      "ai-in-healthcare",
      "ai-in-education",
      "ai-in-agriculture",
      "recommendation-systems",
      "recommendation-systems-in-shopping",
      "sentiment-analysis",
      "sentiment-analysis-in-brand-monitoring",
      "text-classification",
      "text-classification-in-support-routing",
    ],
  },
];

// ─── AI Engineer path ───────────────────────────────────────────
const AI_ENGINEER_STAGES: Stage[] = [
  {
    title: "Kiến trúc",
    slugs: [
      "cnn",
      "rnn",
      "lstm",
      "transformer",
      "self-attention",
      "multi-head-attention",
      "positional-encoding",
      "residual-connections",
      "weight-initialization",
      "batch-normalization",
      "sgd",
      "optimizers",
    ],
  },
  {
    title: "LLM & NLP",
    slugs: [
      "prompt-engineering",
      "gpt",
      "bert",
      "tokenization",
      "tokenizer-comparison",
      "kv-cache",
      "temperature",
      "top-k-top-p",
      "beam-search",
      "context-window",
    ],
  },
  {
    title: "Fine-tuning & Tối ưu",
    slugs: [
      "fine-tuning",
      "lora",
      "qlora",
      "fine-tuning-vs-prompting",
      "quantization",
      "distillation",
      "pruning",
      "mixed-precision",
    ],
  },
  {
    title: "RAG & Agents",
    slugs: [
      "rag",
      "agentic-rag",
      "vector-databases",
      "faiss",
      "semantic-search",
      "hybrid-search",
      "re-ranking",
      "chunking",
      "embedding-model",
      "bm25",
      "function-calling",
      "react-framework",
      "agent-architecture",
      "orchestration",
      "structured-outputs",
      "computer-use",
    ],
  },
  {
    title: "Hạ tầng & Vận hành",
    slugs: [
      "model-serving",
      "inference-optimization",
      "mlops",
      "containerization",
      "monitoring",
      "edge-ai",
      "gpu-optimization",
      "cost-optimization",
      "data-pipelines",
    ],
  },
  {
    title: "Đánh giá & Quan sát hệ thống AI",
    slugs: [
      "llm-evaluation",
      "rag-evaluation",
      "agent-evaluation",
      "observability-for-ai",
      "cost-latency-tokens",
      "canary-releases-llm",
      "prompt-injection-defense",
    ],
  },
  {
    title: "An toàn & Chất lượng",
    slugs: ["guardrails", "red-teaming", "hallucination"],
  },
];

// ─── AI Researcher path ─────────────────────────────────────────
const AI_RESEARCHER_STAGES: Stage[] = [
  {
    title: "Lý thuyết sâu",
    slugs: [
      "backpropagation",
      "vanishing-exploding-gradients",
      "regularization",
    ],
  },
  {
    title: "Kiến trúc tiên tiến",
    slugs: [
      "transformer",
      "self-attention",
      "flash-attention",
      "vae",
      "gan",
      "diffusion-models",
      "autoencoder",
      "moe",
      "state-space-models",
      "vision-transformer",
      "u-net",
      "nerf",
    ],
  },
  {
    title: "NLP & Multimodal",
    slugs: [
      "word-embeddings",
      "word2vec",
      "glove",
      "seq2seq",
      "attention-mechanism",
      "perplexity-metric",
      "clip",
      "vlm",
      "unified-multimodal",
      "text-to-image",
      "text-to-video",
      "speech-recognition",
      "tts",
    ],
  },
  {
    title: "Huấn luyện & Alignment",
    slugs: [
      "rlhf",
      "dpo",
      "grpo",
      "constitutional-ai",
      "alignment",
      "scaling-laws",
      "test-time-compute",
      "adversarial-robustness",
      "ai-watermarking",
      "deepfake-detection",
      "explainability",
    ],
  },
  {
    title: "Học tăng cường",
    slugs: [
      "q-learning",
      "deep-q-network",
      "policy-gradient",
      "actor-critic",
      "multi-armed-bandit",
    ],
  },
  {
    title: "Xu hướng mới",
    slugs: [
      "reasoning-models",
      "world-models",
      "long-context",
      "synthetic-data",
      "small-language-models",
      "ai-for-science",
    ],
  },
];

export const PATHS: Record<AdultPathId, PathDefinition> = {
  student: {
    id: "student",
    nameVi: "Học sinh · Sinh viên",
    stages: STUDENT_STAGES,
  },
  office: {
    id: "office",
    nameVi: "Nhân viên văn phòng",
    stages: OFFICE_STAGES,
  },
  "ai-engineer": {
    id: "ai-engineer",
    nameVi: "AI Engineer",
    stages: AI_ENGINEER_STAGES,
  },
  "ai-researcher": {
    id: "ai-researcher",
    nameVi: "AI Researcher",
    stages: AI_RESEARCHER_STAGES,
  },
};

export function getPathStages(pathId: AdultPathId): Stage[] {
  return PATHS[pathId].stages;
}

export function getPathNameVi(pathId: AdultPathId): string {
  return PATHS[pathId].nameVi;
}

export interface PathNeighbor {
  slug: string;
  stageTitle: string;
}

export interface PathNeighbors {
  prev: PathNeighbor | null;
  next: PathNeighbor | null;
  /** 1-based position in the flattened slug list */
  current: number;
  total: number;
  pathId: AdultPathId;
  nameVi: string;
  currentStageTitle: string;
}

/**
 * Given a path and a slug, return the prev/next slugs **within that path's
 * stage ordering** (crossing stage boundaries seamlessly).
 *
 * Returns null if:
 *   - pathId is unknown
 *   - slug isn't in that path's stages
 *
 * The TopicLayout then falls back to category-based neighbors.
 */
export function getPathNeighbors(
  pathId: string | null | undefined,
  slug: string
): PathNeighbors | null {
  if (!pathId || !isAdultPathId(pathId)) return null;

  const path = PATHS[pathId];

  // Flatten stages, remembering which stage each slug came from.
  const flat: { slug: string; stageTitle: string }[] = [];
  for (const stage of path.stages) {
    for (const s of stage.slugs) {
      flat.push({ slug: s, stageTitle: stage.title });
    }
  }

  const idx = flat.findIndex((entry) => entry.slug === slug);
  if (idx === -1) return null;

  const prevEntry = idx > 0 ? flat[idx - 1] : null;
  const nextEntry = idx < flat.length - 1 ? flat[idx + 1] : null;

  return {
    prev: prevEntry
      ? { slug: prevEntry.slug, stageTitle: prevEntry.stageTitle }
      : null,
    next: nextEntry
      ? { slug: nextEntry.slug, stageTitle: nextEntry.stageTitle }
      : null,
    current: idx + 1,
    total: flat.length,
    pathId,
    nameVi: path.nameVi,
    currentStageTitle: flat[idx].stageTitle,
  };
}
