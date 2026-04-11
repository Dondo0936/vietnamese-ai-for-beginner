"use client";

import { FlaskConical } from "lucide-react";
import LearningPathPage from "@/components/paths/LearningPathPage";
import type { Stage } from "@/components/paths/LearningPathPage";

const stages: Stage[] = [
  {
    title: "Lý thuyết sâu",
    slugs: [
      "backpropagation",
      "vanishing-exploding-gradients",
      "weight-initialization",
      "regularization",
      "batch-normalization",
      "optimizers",
      "sgd",
    ],
  },
  {
    title: "Kiến trúc tiên tiến",
    slugs: [
      "transformer",
      "self-attention",
      "flash-attention",
      "residual-connections",
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
    title: "Xu hướng mới",
    slugs: [
      "reasoning-models",
      "world-models",
      "long-context",
      "synthetic-data",
      "small-language-models",
      "ai-for-science",
      "q-learning",
      "deep-q-network",
      "policy-gradient",
      "actor-critic",
      "multi-armed-bandit",
    ],
  },
];

export default function AIResearcherPathPage() {
  return (
    <LearningPathPage
      pathId="ai-researcher"
      nameVi="AI Researcher"
      descriptionVi="Lý thuyết sâu & xu hướng mới — scaling laws, alignment, kiến trúc tiên tiến"
      icon={FlaskConical}
      stages={stages}
    />
  );
}
