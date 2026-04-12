"use client";

import Link from "next/link";
import {
  GraduationCap,
  Briefcase,
  Code2,
  FlaskConical,
  Sparkles,
  Rocket,
  ArrowRight,
} from "lucide-react";
import type { TopicMeta } from "@/lib/types";

/* ─── Profession definitions ─── */

export interface Profession {
  id: string;
  nameVi: string;
  descriptionVi: string;
  icon: React.ElementType;
  topicSlugs: string[];
  /** Override for the link target. Defaults to /paths/:id if not set. */
  href?: string;
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
      "cnn", "rnn", "lstm", "gpt", "bert", "tokenization", "tokenizer-comparison", "kv-cache",
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
  {
    id: "kids-nhi",
    nameVi: "Bé làm quen với AI (6–10 tuổi)",
    descriptionVi: "18 bài vui vẻ — hình ảnh, kéo thả, có audio. Không cần biết đọc nhiều.",
    icon: Sparkles,
    topicSlugs: [], // Phase 5 populates; for Phase 1 the card shows 0 chủ đề.
    href: "/kids/nhi",
  },
  {
    id: "kids-teen",
    nameVi: "Teen tự làm dự án AI (11–15 tuổi)",
    descriptionVi: "30 bài — train mô hình nhỏ, hiểu AI tạo sinh, sẵn sàng cho lộ trình Học sinh.",
    icon: Rocket,
    topicSlugs: [], // Phase 5 populates.
    href: "/kids/teen",
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
        const Icon = prof.icon;
        const pct = resolved.length > 0 ? Math.round((readCount / resolved.length) * 100) : 0;

        return (
          <Link
            key={prof.id}
            href={prof.href ?? `/paths/${prof.id}`}
            className="group rounded-[16px] border border-border bg-card/50 backdrop-blur-sm overflow-hidden transition-all hover:bg-card hover:shadow-sm hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-muted group-hover:text-accent transition-colors">
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[13px] font-semibold text-foreground truncate leading-snug group-hover:text-accent transition-colors">
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
                <ArrowRight size={14} className="text-tertiary group-hover:text-accent transition-colors" />
              </div>
            </div>

            {/* Progress */}
            {readCount > 0 && (
              <div className="px-4 pb-3">
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
          </Link>
        );
      })}
    </div>
  );
}
