"use client";

import { Briefcase } from "lucide-react";
import LearningPathPage from "@/components/paths/LearningPathPage";
import type { Stage } from "@/components/paths/LearningPathPage";

const stages: Stage[] = [
  {
    title: "Hiểu LLM",
    slugs: [
      "llm-overview",
      "prompt-engineering",
      "chain-of-thought",
      "in-context-learning",
      "temperature",
      "hallucination",
      "context-window",
    ],
  },
  {
    title: "Ứng dụng thực tế",
    slugs: [
      "rag",
      "chunking",
      "semantic-search",
      "function-calling",
      "agent-architecture",
      "agentic-workflows",
      "ai-coding-assistants",
      "model-context-protocol",
    ],
  },
  {
    title: "An toàn & Đạo đức",
    slugs: [
      "bias-fairness",
      "ai-governance",
      "guardrails",
      "explainability",
    ],
  },
  {
    title: "Ứng dụng ngành",
    slugs: [
      "ai-in-finance",
      "ai-in-healthcare",
      "ai-in-education",
      "ai-in-agriculture",
      "recommendation-systems",
      "sentiment-analysis",
      "text-classification",
    ],
  },
];

export default function OfficePathPage() {
  return (
    <LearningPathPage
      pathId="office"
      nameVi="Nhân viên văn phòng"
      descriptionVi="Hiểu AI để ứng dụng trong công việc — prompt, RAG, agent, an toàn AI"
      icon={Briefcase}
      stages={stages}
    />
  );
}
