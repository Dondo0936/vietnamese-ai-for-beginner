"use client";

import { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Briefcase,
  Code2,
  FlaskConical,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { TopicMeta } from "@/lib/types";

/* ─── Profession definitions ─── */

export interface Profession {
  id: string;
  nameVi: string;
  descriptionVi: string;
  icon: React.ElementType;
  topicSlugs: string[];
}

export const professions: Profession[] = [
  {
    id: "student",
    nameVi: "Học sinh · Sinh viên",
    descriptionVi: "Nền tảng AI/ML từ con số 0 — toán, thuật toán cổ điển, mạng nơ-ron cơ bản",
    icon: GraduationCap,
    topicSlugs: [
      "linear-algebra-for-ml", "probability-statistics", "calculus-for-backprop", "information-theory",
      "supervised-unsupervised-rl", "linear-regression", "logistic-regression", "decision-trees",
      "k-means", "knn", "naive-bayes", "bias-variance", "overfitting-underfitting",
      "cross-validation", "confusion-matrix", "train-val-test",
      "perceptron", "mlp", "activation-functions", "forward-propagation", "backpropagation",
      "gradient-descent", "loss-functions", "epochs-batches",
      "neural-network-overview", "data-preprocessing", "feature-engineering",
    ],
  },
  {
    id: "office",
    nameVi: "Nhân viên văn phòng",
    descriptionVi: "Hiểu AI để ứng dụng trong công việc — prompt, RAG, agent, an toàn AI",
    icon: Briefcase,
    topicSlugs: [
      "llm-overview", "prompt-engineering", "chain-of-thought", "in-context-learning",
      "temperature", "hallucination", "context-window",
      "rag", "chunking", "semantic-search", "function-calling",
      "agent-architecture", "agentic-workflows", "ai-coding-assistants", "model-context-protocol",
      "bias-fairness", "ai-governance", "guardrails", "explainability",
      "ai-in-finance", "ai-in-healthcare", "ai-in-education", "ai-in-agriculture",
      "recommendation-systems", "sentiment-analysis", "text-classification",
    ],
  },
  {
    id: "ai-engineer",
    nameVi: "AI Engineer",
    descriptionVi: "Xây dựng & triển khai hệ thống AI — fine-tuning, RAG, serving, MLOps",
    icon: Code2,
    topicSlugs: [
      "transformer", "self-attention", "multi-head-attention", "positional-encoding",
      "cnn", "rnn", "lstm",
      "gpt", "bert", "tokenization", "tokenizer-comparison", "kv-cache",
      "temperature", "top-k-top-p", "beam-search", "context-window",
      "fine-tuning", "lora", "qlora", "fine-tuning-vs-prompting",
      "quantization", "distillation", "pruning", "mixed-precision",
      "rag", "agentic-rag", "vector-databases", "faiss", "semantic-search",
      "hybrid-search", "re-ranking", "chunking", "embedding-model", "bm25",
      "function-calling", "react-framework", "agent-architecture", "orchestration",
      "structured-outputs", "computer-use",
      "model-serving", "inference-optimization", "mlops", "containerization",
      "monitoring", "edge-ai", "gpu-optimization", "cost-optimization", "data-pipelines",
      "guardrails", "red-teaming", "hallucination",
    ],
  },
  {
    id: "ai-researcher",
    nameVi: "AI Researcher",
    descriptionVi: "Lý thuyết sâu & xu hướng mới — scaling laws, alignment, kiến trúc tiên tiến",
    icon: FlaskConical,
    topicSlugs: [
      "backpropagation", "vanishing-exploding-gradients", "weight-initialization",
      "regularization", "batch-normalization", "optimizers", "sgd",
      "transformer", "self-attention", "flash-attention", "residual-connections",
      "vae", "gan", "diffusion-models", "autoencoder",
      "moe", "state-space-models", "vision-transformer", "u-net", "nerf",
      "word-embeddings", "word2vec", "glove", "seq2seq", "attention-mechanism",
      "perplexity-metric",
      "rlhf", "dpo", "grpo", "constitutional-ai", "alignment",
      "scaling-laws", "test-time-compute",
      "reasoning-models", "world-models", "long-context", "synthetic-data",
      "small-language-models", "ai-for-science",
      "adversarial-robustness", "ai-watermarking", "deepfake-detection", "explainability",
      "q-learning", "deep-q-network", "policy-gradient", "actor-critic", "multi-armed-bandit",
      "clip", "vlm", "unified-multimodal", "text-to-image", "text-to-video",
      "speech-recognition", "tts",
    ],
  },
];

/* ─── Component ─── */

interface ProfessionPathsProps {
  topics: TopicMeta[];
  readTopics?: string[];
}

export default function ProfessionPaths({
  topics,
  readTopics = [],
}: ProfessionPathsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const topicMap = new Map(topics.map((t) => [t.slug, t]));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {professions.map((prof) => {
        const resolved = prof.topicSlugs
          .map((s) => topicMap.get(s))
          .filter((t): t is TopicMeta => t !== undefined);
        const readCount = resolved.filter((t) =>
          readTopics.includes(t.slug)
        ).length;
        const isExpanded = expandedId === prof.id;
        const Icon = prof.icon;
        const pct = resolved.length > 0 ? Math.round((readCount / resolved.length) * 100) : 0;

        return (
          <div
            key={prof.id}
            className="rounded-[16px] border border-border bg-card/50 backdrop-blur-sm overflow-hidden transition-all hover:bg-card hover:shadow-sm"
          >
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : prof.id)}
              className="w-full flex items-center gap-3 p-4 text-left"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface text-muted">
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[13px] font-semibold text-foreground truncate leading-snug">
                  {prof.nameVi}
                </h3>
                <p className="text-[11px] text-tertiary mt-0.5 line-clamp-1">
                  {prof.descriptionVi}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-tertiary">
                  {resolved.length} chủ đề
                </span>
                {isExpanded ? (
                  <ChevronUp size={14} className="text-tertiary" />
                ) : (
                  <ChevronDown size={14} className="text-tertiary" />
                )}
              </div>
            </button>

            {/* Progress */}
            {readCount > 0 && (
              <div className="px-4 pb-2">
                <div className="h-[3px] w-full rounded-full bg-surface">
                  <div
                    className="h-[3px] rounded-full bg-accent transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[10px] text-tertiary mt-1">
                  {readCount}/{resolved.length} đã đọc ({pct}%)
                </p>
              </div>
            )}

            {/* Expanded topic list */}
            {isExpanded && (
              <div className="px-4 pb-4">
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {resolved.map((topic) => {
                    const isRead = readTopics.includes(topic.slug);
                    return (
                      <Link
                        key={topic.slug}
                        href={`/topics/${topic.slug}`}
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                          isRead
                            ? "bg-accent/10 text-accent"
                            : "bg-surface text-muted hover:text-foreground hover:bg-surface-hover"
                        }`}
                      >
                        {topic.titleVi}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
