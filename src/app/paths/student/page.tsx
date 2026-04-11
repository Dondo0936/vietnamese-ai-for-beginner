"use client";

import { GraduationCap } from "lucide-react";
import LearningPathPage from "@/components/paths/LearningPathPage";
import type { Stage } from "@/components/paths/LearningPathPage";

const stages: Stage[] = [
  {
    title: "Nền tảng toán",
    slugs: [
      "linear-algebra-for-ml",
      "probability-statistics",
      "calculus-for-backprop",
      "information-theory",
    ],
  },
  {
    title: "ML cơ bản",
    slugs: [
      "supervised-unsupervised-rl",
      "linear-regression",
      "logistic-regression",
      "decision-trees",
      "k-means",
      "knn",
      "naive-bayes",
      "bias-variance",
      "overfitting-underfitting",
      "cross-validation",
      "confusion-matrix",
      "train-val-test",
    ],
  },
  {
    title: "Mạng nơ-ron",
    slugs: [
      "perceptron",
      "mlp",
      "activation-functions",
      "forward-propagation",
      "backpropagation",
      "gradient-descent",
      "loss-functions",
      "epochs-batches",
      "neural-network-overview",
    ],
  },
  {
    title: "Kỹ năng thực hành",
    slugs: [
      "data-preprocessing",
      "feature-engineering",
    ],
  },
];

export default function StudentPathPage() {
  return (
    <LearningPathPage
      pathId="student"
      nameVi="Học sinh · Sinh viên"
      descriptionVi="Nền tảng AI/ML từ con số 0 — toán, thuật toán cổ điển, mạng nơ-ron cơ bản"
      icon={GraduationCap}
      stages={stages}
    />
  );
}
