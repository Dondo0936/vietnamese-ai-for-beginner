"use client";

import { Code2 } from "lucide-react";
import LearningPathPage from "@/components/paths/LearningPathPage";
import LearningObjectivesModal from "@/components/paths/LearningObjectivesModal";
import type { Stage } from "@/components/paths/LearningPathPage";
import type { PathObjectives } from "@/components/paths/LearningObjectivesModal";

const pathObjectives: PathObjectives = {
  audience:
    "Lập trình viên muốn chuyển sang xây dựng và triển khai hệ thống AI — từ fine-tuning mô hình đến serving production. Cần nền tảng ML cơ bản (hoặc hoàn thành lộ trình Học sinh/Sinh viên).",
  prerequisites:
    "Biết lập trình Python. Hiểu cơ bản về machine learning (supervised/unsupervised, neural networks). Quen thuộc với Linux/terminal và Git.",
  stageObjectives: [
    {
      stage: "Kiến trúc",
      objectives: [
        "Hiểu kiến trúc CNN, RNN, LSTM và hạn chế của chúng",
        "Nắm vững Transformer: self-attention, multi-head attention, positional encoding",
        "Hiểu tại sao Transformer vượt trội hơn các kiến trúc trước đó",
      ],
    },
    {
      stage: "LLM & NLP",
      objectives: [
        "Viết prompt hiệu quả cho các mô hình ngôn ngữ lớn",
        "Hiểu kiến trúc GPT và BERT, tokenization pipeline",
        "Nắm các tham số sinh văn bản: temperature, top-k/top-p, beam search",
        "Hiểu KV cache và context window trong inference",
      ],
    },
    {
      stage: "Fine-tuning & Tối ưu",
      objectives: [
        "Phân biệt khi nào dùng fine-tuning vs prompting",
        "Thực hành LoRA và QLoRA cho parameter-efficient fine-tuning",
        "Áp dụng quantization, distillation, pruning để tối ưu mô hình",
      ],
    },
    {
      stage: "RAG & Agents",
      objectives: [
        "Xây dựng hệ thống RAG end-to-end: chunking, embedding, retrieval, re-ranking",
        "Hiểu và sử dụng vector databases (FAISS, Pinecone)",
        "Thiết kế AI agent với function calling và structured outputs",
        "Nắm kiến trúc orchestration và agentic RAG",
      ],
    },
    {
      stage: "Hạ tầng & Vận hành",
      objectives: [
        "Triển khai model serving với tối ưu inference",
        "Xây dựng CI/CD pipeline cho ML (MLOps)",
        "Containerize và monitoring mô hình trong production",
        "Tối ưu chi phí GPU và edge deployment",
      ],
    },
    {
      stage: "An toàn & Chất lượng",
      objectives: [
        "Thiết lập guardrails cho AI systems",
        "Thực hiện red teaming để tìm lỗ hổng",
        "Phát hiện và giảm thiểu hallucination",
      ],
    },
  ],
  outcomes: [
    "Xây dựng hệ thống RAG và AI agent từ đầu đến cuối",
    "Fine-tune và tối ưu mô hình cho production",
    "Triển khai và vận hành mô hình AI ở quy mô lớn",
    "Đảm bảo an toàn và chất lượng cho hệ thống AI",
    "Sẵn sàng cho vị trí AI/ML Engineer tại doanh nghiệp",
  ],
  estimatedTime: [
    { stage: "Kiến trúc", hours: 12 },
    { stage: "LLM & NLP", hours: 15 },
    { stage: "Fine-tuning & Tối ưu", hours: 14 },
    { stage: "RAG & Agents", hours: 25 },
    { stage: "Hạ tầng & Vận hành", hours: 18 },
    { stage: "An toàn & Chất lượng", hours: 6 },
  ],
  nextPath: { slug: "ai-researcher", label: "AI Researcher" },
};

const stages: Stage[] = [
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
    title: "An toàn & Chất lượng",
    slugs: ["guardrails", "red-teaming", "hallucination"],
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
      headerExtra={<LearningObjectivesModal objectives={pathObjectives} />}
    />
  );
}
