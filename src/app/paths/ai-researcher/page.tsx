"use client";

import { FlaskConical } from "lucide-react";
import LearningPathPage from "@/components/paths/LearningPathPage";
import LearningObjectivesModal from "@/components/paths/LearningObjectivesModal";
import type { Stage } from "@/components/paths/LearningPathPage";
import type { PathObjectives } from "@/components/paths/LearningObjectivesModal";

const pathObjectives: PathObjectives = {
  audience:
    "Kỹ sư AI muốn đi sâu vào nghiên cứu, sinh viên thạc sĩ/tiến sĩ ngành AI/ML, hoặc bất kỳ ai muốn hiểu lý thuyết và xu hướng tiên tiến nhất.",
  prerequisites:
    "Nắm vững toán (đại số tuyến tính, xác suất, giải tích). Hiểu neural networks và backpropagation. Có kinh nghiệm huấn luyện mô hình deep learning. Đọc hiểu paper khoa học.",
  stageObjectives: [
    {
      stage: "Lý thuyết sâu",
      objectives: [
        "Hiểu sâu backpropagation và vấn đề vanishing/exploding gradients",
        "Nắm các kỹ thuật weight initialization và regularization",
        "So sánh các optimizer: SGD, Adam, AdaGrad, RMSProp",
      ],
    },
    {
      stage: "Kiến trúc tiên tiến",
      objectives: [
        "Hiểu Transformer và Flash Attention ở mức toán học",
        "Nắm kiến trúc generative: VAE, GAN, Diffusion Models",
        "Hiểu Mixture of Experts và State Space Models",
        "Biết Vision Transformer, U-Net, NeRF",
      ],
    },
    {
      stage: "NLP & Multimodal",
      objectives: [
        "Hiểu lịch sử word embeddings: Word2Vec → GloVe → Transformer-based",
        "Nắm Seq2Seq, Attention Mechanism, và các metric đánh giá",
        "Hiểu kiến trúc multimodal: CLIP, VLM, Unified Multimodal",
        "Biết text-to-image, text-to-video, speech recognition, TTS",
      ],
    },
    {
      stage: "Huấn luyện & Alignment",
      objectives: [
        "Hiểu RLHF, DPO, GRPO cho alignment",
        "Nắm Constitutional AI và scaling laws",
        "Hiểu test-time compute và adversarial robustness",
        "Biết AI watermarking và deepfake detection",
      ],
    },
    {
      stage: "Học tăng cường",
      objectives: [
        "Hiểu Q-Learning và Deep Q-Network",
        "Nắm Policy Gradient và Actor-Critic",
        "Biết Multi-Armed Bandit và ứng dụng thực tế",
      ],
    },
    {
      stage: "Xu hướng mới",
      objectives: [
        "Hiểu reasoning models và world models",
        "Nắm kỹ thuật long-context và synthetic data",
        "Biết Small Language Models và AI for Science",
      ],
    },
  ],
  outcomes: [
    "Đọc và hiểu paper nghiên cứu AI/ML tiên tiến",
    "Hiểu sâu lý thuyết đằng sau các kiến trúc hiện đại",
    "Nắm vững alignment, scaling laws, và training optimization",
    "Có nền tảng reinforcement learning vững chắc",
    "Theo kịp các xu hướng mới nhất trong nghiên cứu AI",
  ],
  estimatedTime: [
    { stage: "Lý thuyết sâu", hours: 14 },
    { stage: "Kiến trúc tiên tiến", hours: 25 },
    { stage: "NLP & Multimodal", hours: 22 },
    { stage: "Huấn luyện & Alignment", hours: 18 },
    { stage: "Học tăng cường", hours: 10 },
    { stage: "Xu hướng mới", hours: 12 },
  ],
  nextPath: null,
};

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

export default function AIResearcherPathPage() {
  return (
    <LearningPathPage
      pathId="ai-researcher"
      nameVi="AI Researcher"
      descriptionVi="Lý thuyết sâu & xu hướng mới — scaling laws, alignment, kiến trúc tiên tiến"
      icon={FlaskConical}
      stages={stages}
      headerExtra={<LearningObjectivesModal objectives={pathObjectives} />}
    />
  );
}
