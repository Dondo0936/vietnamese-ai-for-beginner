"use client";

import { Code2 } from "lucide-react";
import LearningPathPage from "@/components/paths/LearningPathPage";
import type { Stage } from "@/components/paths/LearningPathPage";

const stages: Stage[] = [
  {
    title: "Kiến trúc",
    slugs: [
      "transformer",
      "self-attention",
      "multi-head-attention",
      "positional-encoding",
      "cnn",
      "rnn",
      "lstm",
    ],
  },
  {
    title: "LLM & NLP",
    slugs: [
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
    title: "Hạ tầng",
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
      "guardrails",
      "red-teaming",
      "hallucination",
    ],
  },
];

export default function AIEngineerPathPage() {
  return (
    <LearningPathPage
      pathId="ai-engineer"
      nameVi="AI Engineer"
      descriptionVi="Xây dựng & triển khai hệ thống AI — fine-tuning, RAG, serving, MLOps"
      icon={Code2}
      stages={stages}
    />
  );
}
