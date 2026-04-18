"use client";
import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
  CollapsibleDetail,
  MiniSummary,
  CodeBlock,
  LessonSection,
  LaTeX,
  TopicLink,
  ProgressSteps,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

/* ═══════════════════════════════════════════════════════════════════
 * METADATA
 * ═══════════════════════════════════════════════════════════════════ */
export const metadata: TopicMeta = {
  slug: "decision-trees",
  title: "Decision Trees",
  titleVi: "Cây quyết định",
  description:
    "Mô hình phân loại bằng chuỗi câu hỏi có/không tạo thành cấu trúc cây",
  category: "classic-ml",
  tags: ["classification", "supervised-learning", "interpretable"],
  difficulty: "beginner",
  relatedSlugs: ["random-forests", "gradient-boosting", "bias-variance"],
  vizType: "interactive",
};

/* ═══════════════════════════════════════════════════════════════════
 * TYPES
 * ═══════════════════════════════════════════════════════════════════ */
interface Sample {
  id: number;
  age: number; // 18..65
  income: number; // in millions VND/month
  buy: 0 | 1; // 1 = buy, 0 = not
}

type SplitFeature = "age" | "income";

interface Split {
  feature: SplitFeature;
  threshold: number;
  gini: number; // weighted gini after split
  leftSamples: number[]; // indices
  rightSamples: number[]; // indices
}

interface TreeNode {
  id: string;
  depth: number;
  samples: number[]; // indices into DATASET
  prediction: 0 | 1; // majority class
  gini: number; // impurity at this node
  split?: Split;
  left?: TreeNode;
  right?: TreeNode;
  // Layout (filled later)
  x?: number;
  y?: number;
}

/* ═══════════════════════════════════════════════════════════════════
 * DATASET — 20 training samples
 * Feature 1: age (years)
 * Feature 2: income (triệu VND / month)
 * Label:    buy (1) / not (0)
 *
 * Pattern (intentional, learnable):
 *   - High income (>= 15) → mostly buy
 *   - Young (< 30) + low income → not buy
 *   - Middle age + medium income → mixed
 * ═══════════════════════════════════════════════════════════════════ */
const DATASET: Sample[] = [
  { id: 0, age: 22, income: 8, buy: 0 },
  { id: 1, age: 25, income: 12, buy: 0 },
  { id: 2, age: 28, income: 18, buy: 1 },
  { id: 3, age: 31, income: 22, buy: 1 },
  { id: 4, age: 35, income: 15, buy: 1 },
  { id: 5, age: 38, income: 10, buy: 0 },
  { id: 6, age: 42, income: 30, buy: 1 },
  { id: 7, age: 45, income: 16, buy: 1 },
  { id: 8, age: 48, income: 9, buy: 0 },
  { id: 9, age: 52, income: 25, buy: 1 },
  { id: 10, age: 55, income: 14, buy: 0 },
  { id: 11, age: 58, income: 20, buy: 1 },
  { id: 12, age: 24, income: 7, buy: 0 },
  { id: 13, age: 27, income: 11, buy: 0 },
  { id: 14, age: 33, income: 28, buy: 1 },
  { id: 15, age: 40, income: 13, buy: 0 },
  { id: 16, age: 46, income: 19, buy: 1 },
  { id: 17, age: 50, income: 17, buy: 1 },
  { id: 18, age: 60, income: 11, buy: 0 },
  { id: 19, age: 62, income: 24, buy: 1 },
];

/* ═══════════════════════════════════════════════════════════════════
 * GINI IMPURITY
 * ═══════════════════════════════════════════════════════════════════ */
function giniImpurity(sampleIndices: number[]): number {
  if (sampleIndices.length === 0) return 0;
  const n = sampleIndices.length;
  const buy = sampleIndices.filter((i) => DATASET[i].buy === 1).length;
  const notBuy = n - buy;
  const p1 = buy / n;
  const p0 = notBuy / n;
  return 1 - (p1 * p1 + p0 * p0);
}

/* ═══════════════════════════════════════════════════════════════════
 * FIND BEST SPLIT — try every threshold for every feature
 * ═══════════════════════════════════════════════════════════════════ */
function findBestSplit(sampleIndices: number[]): Split | null {
  if (sampleIndices.length < 2) return null;
  const parentGini = giniImpurity(sampleIndices);
  if (parentGini === 0) return null; // already pure

  let best: Split | null = null;
  let bestGini = parentGini;

  const features: SplitFeature[] = ["age", "income"];

  for (const feature of features) {
    // Candidate thresholds = midpoints between consecutive sorted unique values
    const values = [...new Set(sampleIndices.map((i) => DATASET[i][feature]))].sort(
      (a, b) => a - b,
    );
    for (let k = 0; k < values.length - 1; k++) {
      const threshold = (values[k] + values[k + 1]) / 2;
      const left = sampleIndices.filter((i) => DATASET[i][feature] <= threshold);
      const right = sampleIndices.filter((i) => DATASET[i][feature] > threshold);
      if (left.length === 0 || right.length === 0) continue;

      const wGini =
        (left.length / sampleIndices.length) * giniImpurity(left) +
        (right.length / sampleIndices.length) * giniImpurity(right);

      if (wGini < bestGini - 1e-9) {
        bestGini = wGini;
        best = {
          feature,
          threshold,
          gini: wGini,
          leftSamples: left,
          rightSamples: right,
        };
      }
    }
  }
  return best;
}

/* ═══════════════════════════════════════════════════════════════════
 * GROW TREE — greedy, step-by-step
 * Returns a new root with exactly one additional expanded node per call.
 * If no leaf can be split (all pure or maxDepth reached), returns null.
 * ═══════════════════════════════════════════════════════════════════ */
function majorityClass(samples: number[]): 0 | 1 {
  if (samples.length === 0) return 0;
  const buy = samples.filter((i) => DATASET[i].buy === 1).length;
  return buy * 2 > samples.length ? 1 : 0;
}

function makeLeaf(samples: number[], depth: number, idSuffix: string): TreeNode {
  return {
    id: `n_${idSuffix}`,
    depth,
    samples,
    prediction: majorityClass(samples),
    gini: giniImpurity(samples),
  };
}

function growOneStep(root: TreeNode, maxDepth: number): TreeNode | null {
  // BFS find first splittable leaf
  const queue: TreeNode[] = [root];
  while (queue.length) {
    const node = queue.shift()!;
    if (!node.left && !node.right) {
      // leaf
      if (node.depth >= maxDepth) continue;
      if (node.gini === 0) continue; // pure
      if (node.samples.length < 2) continue;
      const split = findBestSplit(node.samples);
      if (!split) continue;

      // Mutate this leaf into an internal node — return new root by mutation OK (caller clones)
      node.split = split;
      node.left = makeLeaf(split.leftSamples, node.depth + 1, `${node.id}_L`);
      node.right = makeLeaf(split.rightSamples, node.depth + 1, `${node.id}_R`);
      return root;
    }
    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }
  return null; // nothing more to grow
}

/* Fully grow tree up to maxDepth */
function growFullTree(maxDepth: number): TreeNode {
  const allIndices = DATASET.map((s) => s.id);
  let root: TreeNode = makeLeaf(allIndices, 0, "root");
  while (true) {
    const next = growOneStep(cloneTree(root), maxDepth);
    if (!next) break;
    root = next;
  }
  return root;
}

function cloneTree(n: TreeNode): TreeNode {
  const copy: TreeNode = {
    id: n.id,
    depth: n.depth,
    samples: [...n.samples],
    prediction: n.prediction,
    gini: n.gini,
    split: n.split ? { ...n.split, leftSamples: [...n.split.leftSamples], rightSamples: [...n.split.rightSamples] } : undefined,
  };
  if (n.left) copy.left = cloneTree(n.left);
  if (n.right) copy.right = cloneTree(n.right);
  return copy;
}

/* Count nodes and max depth for layout */
function countNodes(n: TreeNode): number {
  return 1 + (n.left ? countNodes(n.left) : 0) + (n.right ? countNodes(n.right) : 0);
}

function treeDepth(n: TreeNode): number {
  if (!n.left && !n.right) return n.depth;
  return Math.max(
    n.left ? treeDepth(n.left) : n.depth,
    n.right ? treeDepth(n.right) : n.depth,
  );
}

/* Layout — assign x, y positions */
function layoutTree(root: TreeNode, width: number, levelHeight: number = 80): void {
  // Collect leaves in inorder to space them evenly
  const leaves: TreeNode[] = [];
  const collect = (n: TreeNode) => {
    if (!n.left && !n.right) {
      leaves.push(n);
      return;
    }
    if (n.left) collect(n.left);
    if (n.right) collect(n.right);
  };
  collect(root);

  const leafGap = width / (leaves.length + 1);
  leaves.forEach((leaf, i) => {
    leaf.x = leafGap * (i + 1);
    leaf.y = 40 + leaf.depth * levelHeight;
  });

  // Bottom-up: internal nodes x = mean of children
  const assignInternal = (n: TreeNode) => {
    if (!n.left && !n.right) return;
    if (n.left) assignInternal(n.left);
    if (n.right) assignInternal(n.right);
    const lx = n.left?.x ?? 0;
    const rx = n.right?.x ?? 0;
    n.x = (lx + rx) / 2;
    n.y = 40 + n.depth * levelHeight;
  };
  assignInternal(root);
}

/* ═══════════════════════════════════════════════════════════════════
 * FEATURE IMPORTANCE
 * Computed as sum of (N_node / N_total) * (gini_parent - gini_weighted_children)
 * over all internal nodes, grouped by feature.
 * ═══════════════════════════════════════════════════════════════════ */
function featureImportance(root: TreeNode): Record<SplitFeature, number> {
  const imp: Record<SplitFeature, number> = { age: 0, income: 0 };
  const total = root.samples.length;
  const walk = (n: TreeNode) => {
    if (!n.split || !n.left || !n.right) return;
    const wChildGini =
      (n.left.samples.length / n.samples.length) * n.left.gini +
      (n.right.samples.length / n.samples.length) * n.right.gini;
    const reduction = n.gini - wChildGini;
    imp[n.split.feature] += (n.samples.length / total) * reduction;
    walk(n.left);
    walk(n.right);
  };
  walk(root);

  // Normalise
  const sum = imp.age + imp.income;
  if (sum > 0) {
    imp.age /= sum;
    imp.income /= sum;
  }
  return imp;
}

/* ═══════════════════════════════════════════════════════════════════
 * FLATTEN tree to array (for rendering order)
 * ═══════════════════════════════════════════════════════════════════ */
function flatten(root: TreeNode): TreeNode[] {
  const out: TreeNode[] = [];
  const walk = (n: TreeNode) => {
    out.push(n);
    if (n.left) walk(n.left);
    if (n.right) walk(n.right);
  };
  walk(root);
  return out;
}

const TOTAL_STEPS = 7;

/* ═══════════════════════════════════════════════════════════════════
 * MAIN COMPONENT
 * ═══════════════════════════════════════════════════════════════════ */
export default function DecisionTreesTopic() {
  const [maxDepth, setMaxDepth] = useState(3);
  const [tree, setTree] = useState<TreeNode>(() =>
    makeLeaf(
      DATASET.map((s) => s.id),
      0,
      "root",
    ),
  );
  const [selectedLeaf, setSelectedLeaf] = useState<string | null>(null);
  const [currentProgress, setCurrentProgress] = useState(1);
  const [autoGrow, setAutoGrow] = useState(false);

  /* Reset tree when maxDepth changes */
  useEffect(() => {
    setTree(
      makeLeaf(
        DATASET.map((s) => s.id),
        0,
        "root",
      ),
    );
    setSelectedLeaf(null);
    setAutoGrow(false);
  }, [maxDepth]);

  /* Auto-grow animation */
  useEffect(() => {
    if (!autoGrow) return;
    const t = setTimeout(() => {
      setTree((prev) => {
        const cloned = cloneTree(prev);
        const grown = growOneStep(cloned, maxDepth);
        if (!grown) {
          setAutoGrow(false);
          return prev;
        }
        return grown;
      });
    }, 600);
    return () => clearTimeout(t);
  }, [autoGrow, tree, maxDepth]);

  /* Layout recomputed on every tree change */
  const laidOut = useMemo(() => {
    const clone = cloneTree(tree);
    layoutTree(clone, 520);
    return clone;
  }, [tree]);

  const nodes = useMemo(() => flatten(laidOut), [laidOut]);
  const importance = useMemo(() => featureImportance(laidOut), [laidOut]);
  const isFullyGrown = useMemo(() => {
    // Check if any internal leaf can still be split
    const clone = cloneTree(laidOut);
    return growOneStep(clone, maxDepth) === null;
  }, [laidOut, maxDepth]);

  const nodeCount = useMemo(() => countNodes(laidOut), [laidOut]);
  const depth = useMemo(() => treeDepth(laidOut), [laidOut]);

  /* Training accuracy on current tree */
  const trainAccuracy = useMemo(() => {
    let correct = 0;
    for (const s of DATASET) {
      // Route through tree
      let n: TreeNode = laidOut;
      while (n.left && n.right && n.split) {
        const v = s[n.split.feature];
        if (v <= n.split.threshold) n = n.left;
        else n = n.right;
      }
      if (n.prediction === s.buy) correct++;
    }
    return correct / DATASET.length;
  }, [laidOut]);

  /* Find currently-selected leaf */
  const selectedLeafNode = useMemo(() => {
    if (!selectedLeaf) return null;
    return nodes.find((n) => n.id === selectedLeaf && !n.left && !n.right) ?? null;
  }, [selectedLeaf, nodes]);

  /* Actions */
  const handleGrow = useCallback(() => {
    setTree((prev) => {
      const cloned = cloneTree(prev);
      const grown = growOneStep(cloned, maxDepth);
      return grown ?? prev;
    });
  }, [maxDepth]);

  const handleGrowAll = useCallback(() => {
    setAutoGrow(true);
  }, []);

  const handleReset = useCallback(() => {
    setAutoGrow(false);
    setTree(
      makeLeaf(
        DATASET.map((s) => s.id),
        0,
        "root",
      ),
    );
    setSelectedLeaf(null);
  }, []);

  /* ═══════════════════════════════════════════════════════════════════
   * QUIZ — 8 questions
   * ═══════════════════════════════════════════════════════════════════ */
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question: "Cây quyết định chọn câu hỏi nào để chia nhánh đầu tiên?",
        options: [
          "Câu hỏi ngẫu nhiên",
          "Câu hỏi giảm Gini impurity (hoặc tăng information gain) nhiều nhất",
          "Câu hỏi về feature có giá trị lớn nhất",
          "Câu hỏi về feature đầu tiên trong danh sách",
        ],
        correct: 1,
        explanation:
          "Tại mỗi nút, thuật toán thử TẤT CẢ các câu hỏi có thể (mọi feature × mọi threshold) và chọn câu hỏi chia dữ liệu 'thuần khiết' nhất — tức giảm Gini impurity nhiều nhất.",
      },
      {
        question: "Cây quyết định sâu (many levels) có vấn đề gì?",
        options: [
          "Chạy chậm hơn",
          "Dễ bị overfitting — học thuộc noise trong dữ liệu",
          "Không phân loại được dữ liệu phức tạp",
          "Chiếm nhiều RAM",
        ],
        correct: 1,
        explanation:
          "Cây sâu có thể tạo nhánh riêng cho từng điểm → học thuộc dữ liệu huấn luyện. Giải pháp: pruning (cắt tỉa), giới hạn max_depth, hoặc dùng Random Forest.",
      },
      {
        question: "So với logistic regression, ưu điểm lớn nhất của cây quyết định là gì?",
        options: [
          "Luôn chính xác hơn",
          "Dễ giải thích — có thể đọc từng nhánh để hiểu tại sao",
          "Huấn luyện nhanh hơn trên dữ liệu lớn",
          "Không cần dữ liệu huấn luyện",
        ],
        correct: 1,
        explanation:
          "Cây quyết định tạo ra luật IF-THEN mà con người đọc được. Trong y tế, tài chính — nơi cần giải thích quyết định — đây là ưu điểm rất lớn.",
      },
      {
        question:
          "Gini impurity bằng bao nhiêu khi một nút chứa 100% một lớp (thuần khiết hoàn toàn)?",
        options: ["0", "0.5", "1", "Tuỳ vào số lớp"],
        correct: 0,
        explanation:
          "G = 1 − Σ p_k². Khi nút chứa 100% lớp A: p_A = 1 → G = 1 − 1² = 0. Đạt giá trị cao nhất 0.5 khi hai lớp bằng nhau 50/50.",
      },
      {
        question: "Feature importance trong cây quyết định được tính như thế nào?",
        options: [
          "Tần suất feature xuất hiện trong cây",
          "Tổng có trọng số của lượng giảm Gini tại các nút sử dụng feature đó",
          "Độ lớn trung bình của feature",
          "Tương quan với label",
        ],
        correct: 1,
        explanation:
          "Feature importance = Σ (N_node / N_total) × (Gini_parent − Gini_weighted_children) với tổng lấy trên các nút chia bằng feature đó. Sau đó chuẩn hoá để tổng = 1.",
      },
      {
        question: "Cây quyết định có cần chuẩn hoá dữ liệu không?",
        options: [
          "Có, luôn luôn",
          "Không — vì chia dựa trên ngưỡng trong mỗi feature, không so sánh giữa feature",
          "Chỉ khi dùng Gini",
          "Chỉ khi feature có phân phối lệch",
        ],
        correct: 1,
        explanation:
          "Đây là ưu điểm lớn của cây quyết định. Mỗi split chỉ so sánh một feature với một ngưỡng; scale của feature khác không ảnh hưởng. Trái ngược với SVM, KNN, neural nets.",
      },
      {
        question:
          "Khi cây quyết định dự đoán cho một điểm mới, nó làm gì tại nút lá?",
        options: [
          "Trả về giá trị trung bình của feature",
          "Trả về lớp đa số trong các mẫu huấn luyện rơi vào lá đó (hoặc trung bình cho hồi quy)",
          "Trả về xác suất bằng softmax",
          "Trả về nút gốc",
        ],
        correct: 1,
        explanation:
          "Mỗi lá lưu phân phối các lớp trong mẫu huấn luyện. Dự đoán = mode (phân loại) hoặc mean (hồi quy). Có thể trả xác suất bằng tỉ lệ mỗi lớp trong lá.",
      },
      {
        question: "Vì sao Random Forest thường tốt hơn một cây quyết định đơn?",
        options: [
          "Random Forest sâu hơn",
          "Trung bình hoá nhiều cây trên các tập bootstrap → giảm variance (overfitting)",
          "Random Forest dùng Entropy thay vì Gini",
          "Random Forest có nhiều lớp hơn",
        ],
        correct: 1,
        explanation:
          "Một cây đơn có variance cao — đổi dữ liệu chút là cây thay đổi nhiều. Random Forest huấn luyện hàng trăm cây trên các bootstrap + random feature subset, rồi vote. Variance giảm mạnh, bias giữ nguyên.",
      },
    ],
    [],
  );

  /* Spring config for node appearance */
  const spring = { type: "spring" as const, stiffness: 150, damping: 18 };

  /* ═══════════════════════════════════════════════════════════════════
   * RENDER
   * ═══════════════════════════════════════════════════════════════════ */
  return (
    <>
      <div className="mb-6">
        <ProgressSteps
          current={currentProgress}
          total={TOTAL_STEPS}
          labels={[
            "Dự đoán",
            "Khám phá",
            "Khoảnh khắc Aha",
            "Thử thách",
            "Lý thuyết",
            "Tóm tắt",
            "Kiểm tra",
          ]}
        />
      </div>

      {/* ═══ STEP 1: PREDICTION GATE ═══ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn lướt Shopee và cần quyết định có mua sản phẩm hay không. Bạn kiểm tra: giá, đánh giá, phí ship, voucher. Não bạn xử lý thông tin này theo cách nào?"
          options={[
            "Tính điểm tổng hợp cho mọi yếu tố rồi so sánh",
            "Hỏi tuần tự: giá ổn không? → đánh giá tốt không? → ship miễn phí không?",
            "Chọn ngẫu nhiên dựa trên cảm hứng",
          ]}
          correct={1}
          explanation="Não bạn tự nhiên đưa ra quyết định theo chuỗi câu hỏi Có/Không — đó chính là cây quyết định! Mỗi câu hỏi loại bỏ một nhánh, thu hẹp dần đến kết luận."
        />
      </LessonSection>

          {/* ═══ STEP 2: INTERACTIVE TREE BUILDER ═══ */}
          <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
            <p className="mb-4 text-sm text-muted leading-relaxed">
              <strong className="text-foreground">Bộ dữ liệu 20 khách hàng</strong>{" "}
              với 2 feature (tuổi, thu nhập triệu VND) và nhãn{" "}
              <strong>MUA / KHÔNG MUA</strong>. Nhấn{" "}
              <strong>&quot;Trồng cây&quot;</strong> để thuật toán chọn split tối ưu
              (Gini) từng bước. Click vào nút lá để xem các khách hàng rơi vào đó.
            </p>

            <VisualizationSection>
              <div className="space-y-4">
                {/* Dataset scatter preview */}
                <div className="rounded-lg border border-border bg-background p-3">
                  <div className="mb-2 text-xs font-medium text-muted">
                    20 khách hàng (xanh = MUA, đỏ = KHÔNG MUA)
                  </div>
                  <svg viewBox="0 0 500 180" className="w-full" role="img" aria-label={`Scatter 20 khách hàng theo tuổi và thu nhập${selectedLeafNode ? `, đang làm nổi bật ${selectedLeafNode.samples.length} khách của lá đã chọn` : ""}`}>
                    <title>{DATASET.filter((s)=>s.buy===1).length} khách MUA, {DATASET.filter((s)=>s.buy===0).length} khách KHÔNG MUA</title>
                    {/* axes */}
                    <line
                      x1={40}
                      y1={150}
                      x2={470}
                      y2={150}
                      stroke="currentColor"
                      className="text-border"
                      strokeWidth={1}
                    />
                    <line
                      x1={40}
                      y1={20}
                      x2={40}
                      y2={150}
                      stroke="currentColor"
                      className="text-border"
                      strokeWidth={1}
                    />
                    <text
                      x={255}
                      y={170}
                      fontSize={10}
                      fill="currentColor"
                      className="text-muted"
                      textAnchor="middle"
                    >
                      Tuổi (18–65)
                    </text>
                    <text
                      x={15}
                      y={85}
                      fontSize={10}
                      fill="currentColor"
                      className="text-muted"
                      textAnchor="middle"
                      transform="rotate(-90 15 85)"
                    >
                      Thu nhập
                    </text>
                    {DATASET.map((s) => {
                      const x = 40 + ((s.age - 18) / 47) * 420;
                      const y = 150 - ((s.income - 5) / 28) * 125;
                      const isInLeaf =
                        selectedLeafNode?.samples.includes(s.id) ?? false;
                      return (
                        <circle
                          key={s.id}
                          cx={x}
                          cy={y}
                          r={isInLeaf ? 6 : 4}
                          fill={s.buy === 1 ? "#22c55e" : "#ef4444"}
                          stroke={isInLeaf ? "#fbbf24" : "#fff"}
                          strokeWidth={isInLeaf ? 2.5 : 1}
                          opacity={
                            selectedLeafNode && !isInLeaf ? 0.25 : 1
                          }
                        />
                      );
                    })}
                  </svg>
                </div>

                {/* The tree SVG */}
                <div className="rounded-lg border border-border bg-background p-3">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-medium text-muted">
                      Cây · {nodeCount} nút · sâu {depth} · accuracy train{" "}
                      <strong className="text-foreground">
                        {(trainAccuracy * 100).toFixed(0)}%
                      </strong>
                    </span>
                    {isFullyGrown && (
                      <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:text-green-400">
                        Đã mọc đầy đủ
                      </span>
                    )}
                  </div>

                  <svg
                    viewBox={`0 0 560 ${Math.max(200, depth * 80 + 120)}`}
                    className="w-full"
                    role="img"
                    aria-label={`Cây quyết định với ${nodeCount} nút, sâu ${depth}, accuracy train ${(trainAccuracy*100).toFixed(0)}%`}
                  >
                    <title>Cây: {nodeCount} nút · sâu {depth} · acc {(trainAccuracy*100).toFixed(0)}%{isFullyGrown ? " · đã mọc đầy đủ" : ""}</title>
                    {/* Edges */}
                    {nodes.map((n) => {
                      if (!n.left || !n.right) return null;
                      return (
                        <g key={`e-${n.id}`}>
                          <line
                            x1={n.x}
                            y1={(n.y ?? 0) + 20}
                            x2={n.left.x}
                            y2={(n.left.y ?? 0) - 20}
                            stroke="#22c55e"
                            strokeWidth={1.8}
                            opacity={0.7}
                          />
                          <text
                            x={((n.x ?? 0) + (n.left.x ?? 0)) / 2 - 14}
                            y={((n.y ?? 0) + (n.left.y ?? 0)) / 2}
                            fontSize={9}
                            fill="#22c55e"
                            fontWeight={600}
                          >
                            ≤
                          </text>
                          <line
                            x1={n.x}
                            y1={(n.y ?? 0) + 20}
                            x2={n.right.x}
                            y2={(n.right.y ?? 0) - 20}
                            stroke="#ef4444"
                            strokeWidth={1.8}
                            opacity={0.7}
                          />
                          <text
                            x={((n.x ?? 0) + (n.right.x ?? 0)) / 2 + 4}
                            y={((n.y ?? 0) + (n.right.y ?? 0)) / 2}
                            fontSize={9}
                            fill="#ef4444"
                            fontWeight={600}
                          >
                            &gt;
                          </text>
                        </g>
                      );
                    })}

                    {/* Nodes */}
                    {nodes.map((n) => {
                      const isLeaf = !n.left && !n.right;
                      const isSelected = selectedLeaf === n.id;
                      const buyCount = n.samples.filter(
                        (i) => DATASET[i].buy === 1,
                      ).length;
                      const notBuyCount = n.samples.length - buyCount;
                      const predColor = n.prediction === 1 ? "#22c55e" : "#ef4444";

                      return (
                        <motion.g
                          key={n.id}
                          initial={{ opacity: 0, scale: 0.7 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={spring}
                        >
                          {isLeaf ? (
                            <g
                              className="cursor-pointer"
                              onClick={() => setSelectedLeaf(isSelected ? null : n.id)}
                            >
                              <rect
                                x={(n.x ?? 0) - 40}
                                y={(n.y ?? 0) - 18}
                                width={80}
                                height={36}
                                rx={10}
                                fill={predColor}
                                opacity={isSelected ? 0.35 : 0.15}
                                stroke={predColor}
                                strokeWidth={isSelected ? 2.5 : 1.5}
                              />
                              <text
                                x={n.x}
                                y={(n.y ?? 0) - 3}
                                fontSize={11}
                                fill={predColor}
                                textAnchor="middle"
                                fontWeight={700}
                              >
                                {n.prediction === 1 ? "MUA" : "BỎ QUA"}
                              </text>
                              <text
                                x={n.x}
                                y={(n.y ?? 0) + 10}
                                fontSize={9}
                                fill="currentColor"
                                className="text-muted"
                                textAnchor="middle"
                              >
                                {buyCount}/{notBuyCount} · G={n.gini.toFixed(2)}
                              </text>
                            </g>
                          ) : (
                            <g>
                              <rect
                                x={(n.x ?? 0) - 60}
                                y={(n.y ?? 0) - 20}
                                width={120}
                                height={40}
                                rx={10}
                                fill="#3b82f6"
                                opacity={0.1}
                                stroke="#3b82f6"
                                strokeWidth={1.5}
                              />
                              <text
                                x={n.x}
                                y={(n.y ?? 0) - 4}
                                fontSize={11}
                                fill="#3b82f6"
                                textAnchor="middle"
                                fontWeight={700}
                              >
                                {n.split?.feature} ≤{" "}
                                {n.split?.threshold.toFixed(1)}
                              </text>
                              <text
                                x={n.x}
                                y={(n.y ?? 0) + 10}
                                fontSize={9}
                                fill="currentColor"
                                className="text-muted"
                                textAnchor="middle"
                              >
                                n={n.samples.length} · G={n.gini.toFixed(2)}
                              </text>
                            </g>
                          )}
                        </motion.g>
                      );
                    })}
                  </svg>
                </div>

                {/* Controls */}
                <div className="space-y-3 rounded-lg border border-border bg-surface/50 p-3">
                  <div className="flex items-center gap-3">
                    <label className="w-24 text-xs font-medium text-muted">
                      max_depth
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={maxDepth}
                      onChange={(e) => setMaxDepth(Number(e.target.value))}
                      className="flex-1 accent-accent"
                    />
                    <span className="w-10 text-center text-xs font-bold text-accent">
                      {maxDepth}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleGrow}
                      disabled={isFullyGrown || autoGrow}
                      className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface disabled:opacity-50"
                    >
                      Trồng cây → 1 bước
                    </button>
                    <button
                      onClick={handleGrowAll}
                      disabled={isFullyGrown || autoGrow}
                      className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {autoGrow ? "Đang mọc..." : "Mọc toàn bộ ▶"}
                    </button>
                    <button
                      onClick={handleReset}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
                    >
                      Đặt lại
                    </button>
                  </div>
                </div>

                {/* Feature importance bars */}
                <div className="rounded-lg border border-border bg-background p-3">
                  <div className="mb-2 text-xs font-medium text-muted">
                    Feature importance (tổng giảm Gini có trọng số)
                  </div>
                  <div className="space-y-2">
                    {(["income", "age"] as SplitFeature[]).map((f) => {
                      const val = importance[f];
                      return (
                        <div key={f} className="flex items-center gap-2">
                          <span className="w-16 text-xs font-medium text-foreground">
                            {f === "age" ? "Tuổi" : "Thu nhập"}
                          </span>
                          <div className="flex-1 h-5 rounded-full bg-surface overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${val * 100}%` }}
                              transition={{ duration: 0.5 }}
                              className="h-full bg-gradient-to-r from-accent to-blue-500"
                            />
                          </div>
                          <span className="w-12 text-right text-xs font-bold text-accent tabular-nums">
                            {(val * 100).toFixed(0)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Leaf details */}
                <AnimatePresence>
                  {selectedLeafNode && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="rounded-lg border border-accent/40 bg-accent/5 p-3 text-xs"
                    >
                      <div className="mb-2 font-semibold text-foreground">
                        Lá{" "}
                        <span className="font-mono text-accent">
                          {selectedLeafNode.id}
                        </span>{" "}
                        — dự đoán:{" "}
                        <span
                          className={
                            selectedLeafNode.prediction === 1
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }
                        >
                          {selectedLeafNode.prediction === 1 ? "MUA" : "BỎ QUA"}
                        </span>{" "}
                        · Gini {selectedLeafNode.gini.toFixed(3)}
                      </div>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {selectedLeafNode.samples.map((i) => {
                          const s = DATASET[i];
                          return (
                            <div
                              key={i}
                              className="flex items-center gap-2 text-muted"
                            >
                              <span
                                className={`inline-block h-2 w-2 rounded-full ${
                                  s.buy === 1 ? "bg-green-500" : "bg-red-500"
                                }`}
                              />
                              #{s.id}: tuổi {s.age}, thu nhập {s.income} triệu →{" "}
                              <strong className="text-foreground">
                                {s.buy === 1 ? "MUA" : "KHÔNG MUA"}
                              </strong>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <p className="text-xs text-muted">
                  Thử max_depth = 1 → cây có 1 split, accuracy thấp (underfitting).
                  Thử max_depth = 5 → cây rất sâu, accuracy train ~100% nhưng
                  overfitting. Giá trị &quot;vừa đủ&quot; thường là 2–3 với dataset
                  nhỏ này.
                </p>
              </div>
            </VisualizationSection>
          </LessonSection>

          {/* ═══ STEP 3: AHA MOMENT ═══ */}
          <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
            <AhaMoment>
              <p>
                Bạn vừa thấy thuật toán <strong>thử hết mọi câu hỏi</strong> tại mỗi
                nút và chọn câu hỏi làm dữ liệu &quot;sạch&quot; nhất (giảm Gini
                nhiều nhất). Máy tính không &quot;biết&quot; feature nào quan trọng —
                nó chỉ tham lam (greedy) tối ưu từng bước. Vậy mà cuối cùng cây lại
                diễn giải được quy luật ẩn trong dữ liệu!
              </p>
            </AhaMoment>
          </LessonSection>

          {/* ═══ STEP 4: CHALLENGE — 2 inline ═══ */}
          <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
            <div className="space-y-4">
              <InlineChallenge
                question="Một cây quyết định có thể khớp hoàn hảo mọi điểm dữ liệu nếu đủ sâu. Đây là điều tốt hay xấu?"
                options={[
                  "Tốt — accuracy 100% trên training set là mục tiêu",
                  "Xấu — cây quá sâu overfitting, gặp dữ liệu mới sẽ sai",
                  "Tuỳ — luôn tốt nếu dữ liệu đủ lớn",
                ]}
                correct={1}
                explanation="Cây sâu = mỗi lá chứa 1 điểm → học thuộc cả noise. Giống việc bạn nhớ từng gương mặt thay vì nhận biết đặc điểm chung. Cần pruning hoặc giới hạn max_depth!"
              />
              <InlineChallenge
                question="Bạn có 2 cây: cây A (sâu 2, train accuracy 82%, val accuracy 80%) vs cây B (sâu 8, train 99%, val 73%). Chọn cây nào deploy?"
                options={[
                  "Cây B — train accuracy cao hơn",
                  "Cây A — val accuracy cao hơn, không overfitting",
                  "Trung bình của cả hai",
                ]}
                correct={1}
                explanation="Val accuracy là thước đo thật — mô hình sẽ gặp dữ liệu mới tương tự val set. Cây A generalise tốt hơn; cây B học thuộc train. Luôn chọn theo val/test, không theo train!"
              />
            </div>
          </LessonSection>

          {/* ═══ STEP 5: EXPLANATION ═══ */}
          <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
            <ExplanationSection>
              <p>
                <strong>Cây quyết định</strong>{" "}
                chia không gian dữ liệu bằng chuỗi câu hỏi dạng{" "}
                <em>&quot;feature X ≤ ngưỡng T?&quot;</em>. Tại mỗi nút, thuật
                toán chọn câu hỏi tốt nhất theo một trong hai tiêu chí:
              </p>

              <p>
                <strong>1. Gini Impurity</strong>{" "}
                (mặc định trong scikit-learn — nhanh, không cần log):
              </p>
              <LaTeX block>{"G = 1 - \\sum_{k=1}^{K} p_k^2"}</LaTeX>

              <p>
                Ví dụ: nút chứa 6 mẫu MUA và 4 mẫu KHÔNG MUA →{" "}
                <LaTeX>{"G = 1 - (0.6^2 + 0.4^2) = 0.48"}</LaTeX>. Thuần khiết hoàn
                toàn (toàn MUA) → G = 0. Lẫn lộn 50/50 → G = 0.5 (cao nhất cho 2
                lớp).
              </p>

              <p>
                <strong>2. Information Gain</strong>{" "}
                (dựa trên entropy — liên hệ với{" "}
                <TopicLink slug="information-theory">lý thuyết thông tin</TopicLink>):
              </p>
              <LaTeX block>{"H = -\\sum_{k=1}^{K} p_k \\log_2 p_k"}</LaTeX>
              <LaTeX block>
                {
                  "\\text{IG} = H(\\text{parent}) - \\sum_{j} \\frac{n_j}{n} H(\\text{child}_j)"
                }
              </LaTeX>

              <p>
                <strong>Quy trình tại mỗi nút:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1 pl-2 text-sm">
                <li>
                  Với mỗi feature, liệt kê tất cả threshold ứng viên (trung điểm
                  giữa các giá trị liên tiếp sau khi sort).
                </li>
                <li>
                  Với mỗi (feature, threshold), chia tập thành left/right và tính
                  Gini trọng số.
                </li>
                <li>
                  Chọn cặp (feature, threshold) cho Gini trọng số thấp nhất — giảm
                  impurity nhiều nhất.
                </li>
                <li>
                  Đệ quy trên hai con cho đến khi: nút thuần khiết, đạt max_depth,
                  hoặc kích thước nút dưới min_samples_split.
                </li>
              </ol>

              <Callout variant="tip" title="Gini vs Entropy — khi nào chọn cái nào?">
                Trong thực tế, hai tiêu chí cho kết quả gần giống nhau. Gini nhanh
                hơn (không cần log), Entropy có nền tảng lý thuyết thông tin chặt
                chẽ và cho cây cân bằng hơn một chút. scikit-learn mặc định dùng
                Gini, LightGBM dùng cả hai.
              </Callout>

              <p>
                <strong>Kiểm soát{" "}
                <TopicLink slug="overfitting-underfitting">overfitting</TopicLink></strong>{" "}
                — cây sâu có thể học thuộc noise. Hiểu rõ{" "}
                <TopicLink slug="bias-variance">đánh đổi bias-variance</TopicLink>{" "}
                giúp chọn hyperparameters phù hợp. Dùng{" "}
                <TopicLink slug="cross-validation">kiểm định chéo</TopicLink>{" "}
                để đánh giá:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>max_depth:</strong> Giới hạn chiều sâu cây (2–10 thường
                  ổn)
                </li>
                <li>
                  <strong>min_samples_split:</strong> Số mẫu tối thiểu để chia
                  nhánh (thường 10–50)
                </li>
                <li>
                  <strong>min_samples_leaf:</strong> Số mẫu tối thiểu ở mỗi lá
                  (thường 5–20)
                </li>
                <li>
                  <strong>ccp_alpha:</strong> Cost-complexity pruning — hệ số phạt
                  cho cây lớn
                </li>
              </ul>

              <Callout variant="info" title="Feature importance — đọc như thế nào?">
                Importance của feature = tổng (N_node / N_total) × (Gini_parent −
                Gini_children) qua mọi nút dùng feature đó, chuẩn hoá về tổng 1.
                Feature dùng ở gốc (nhiều mẫu, giảm Gini nhiều) có importance cao.
                Đây là lý do tại sao cây quyết định có thể dùng làm feature
                selector nhanh.
              </Callout>

              <CodeBlock language="python" title="DecisionTreeClassifier với scikit-learn">
                {`from sklearn.tree import DecisionTreeClassifier, export_text, plot_tree
from sklearn.datasets import load_iris
from sklearn.model_selection import cross_val_score, GridSearchCV
import matplotlib.pyplot as plt

# --- 1. Dữ liệu ---
X, y = load_iris(return_X_y=True)
feature_names = load_iris().feature_names

# --- 2. Huấn luyện với hyperparameter hợp lý ---
tree = DecisionTreeClassifier(
    max_depth=3,           # Giới hạn sâu 3 tầng
    min_samples_leaf=5,    # Mỗi lá ít nhất 5 mẫu
    criterion="gini",      # hoặc "entropy", "log_loss"
    random_state=42,
)
tree.fit(X, y)

# --- 3. In cây ra text ---
print(export_text(tree, feature_names=feature_names))

# --- 4. Feature importance ---
for name, imp in zip(feature_names, tree.feature_importances_):
    print(f"  {name:25s} {imp:.3f}")

# --- 5. Vẽ cây ---
plot_tree(tree, feature_names=feature_names, filled=True, fontsize=8)
plt.show()

# --- 6. Cross-validation để chọn max_depth ---
for d in [2, 3, 5, 8, None]:  # None = không giới hạn
    model = DecisionTreeClassifier(max_depth=d, random_state=42)
    scores = cross_val_score(model, X, y, cv=5, scoring="accuracy")
    print(f"max_depth={d}: {scores.mean():.3f} ± {scores.std():.3f}")`}
              </CodeBlock>

              <Callout variant="warning" title="Cẩn thận với cây sâu — khi nào dùng Random Forest?">
                Một cây đơn có variance rất cao: đổi vài điểm dữ liệu là cây thay
                đổi hoàn toàn. Để giảm variance, dùng{" "}
                <TopicLink slug="random-forests">Random Forest</TopicLink> (trung
                bình hàng trăm cây trên bootstrap) hoặc{" "}
                <TopicLink slug="gradient-boosting">Gradient Boosting</TopicLink>{" "}
                (XGBoost/LightGBM) cho hiệu suất cao nhất. Cây đơn chỉ nên dùng khi
                interpretability quan trọng hơn accuracy.
              </Callout>

              <Callout variant="tip" title="Ưu điểm ít ai nhớ của cây quyết định">
                (1) Không cần chuẩn hoá — scale feature không ảnh hưởng.{" "}
                (2) Xử lý mixed data (số + categorical) tự nhiên.{" "}
                (3) Robust với outliers — outlier chỉ rơi vào 1 lá, không lấn át.{" "}
                (4) Handles missing values (qua surrogate splits). (5) Rất nhanh ở
                inference — chỉ vài phép so sánh.
              </Callout>

              <CodeBlock language="python" title="Pruning cost-complexity (ccp) để chống overfitting">
                {`from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
import numpy as np

X_train, X_val, y_train, y_val = train_test_split(
    X, y, test_size=0.3, random_state=42
)

# --- 1. Trồng cây đầy đủ (chưa pruning) ---
full_tree = DecisionTreeClassifier(random_state=42)
full_tree.fit(X_train, y_train)

# --- 2. Lấy alpha path — các mức pruning từ nhẹ đến nặng ---
path = full_tree.cost_complexity_pruning_path(X_train, y_train)
ccp_alphas = path.ccp_alphas[:-1]  # bỏ alpha cuối (chỉ còn 1 nút)

# --- 3. Huấn luyện nhiều cây với từng alpha, chọn alpha tốt nhất ---
best_alpha, best_val = 0, 0
for alpha in ccp_alphas:
    tree = DecisionTreeClassifier(ccp_alpha=alpha, random_state=42)
    tree.fit(X_train, y_train)
    val_acc = tree.score(X_val, y_val)
    if val_acc > best_val:
        best_val = val_acc
        best_alpha = alpha

print(f"Best alpha: {best_alpha:.4f}, Val acc: {best_val:.3f}")

# --- 4. Huấn luyện lại với alpha tốt nhất ---
final = DecisionTreeClassifier(ccp_alpha=best_alpha, random_state=42)
final.fit(X_train, y_train)
print(f"Final nodes: {final.tree_.node_count}")  # ít hơn cây full`}
              </CodeBlock>

              <CollapsibleDetail title="Cây hồi quy (regression tree) — khác gì với phân loại?">
                <div className="space-y-2 text-sm">
                  <p>
                    Thay vì Gini, cây hồi quy dùng <strong>MSE</strong> (hoặc MAE).
                    Tại mỗi nút, chọn split giảm:
                  </p>
                  <LaTeX block>
                    {
                      "\\text{MSE} = \\frac{1}{n} \\sum_{i \\in \\text{node}} (y_i - \\bar{y}_{\\text{node}})^2"
                    }
                  </LaTeX>
                  <p>
                    Mỗi lá trả về <strong>giá trị trung bình</strong> của các mẫu
                    trong lá đó (thay vì lớp đa số). Scikit-learn dùng{" "}
                    <code>DecisionTreeRegressor</code> với cùng giao diện.
                  </p>
                  <p>
                    Hạn chế: dự đoán của cây hồi quy là bậc thang (step function)
                    — không mượt. Với dữ liệu liên tục, boosting (LightGBM) hoặc
                    neural net thường tốt hơn.
                  </p>
                </div>
              </CollapsibleDetail>

              <CollapsibleDetail title="Greedy vs optimal — vì sao cây không tối ưu toàn cục?">
                <div className="space-y-2 text-sm">
                  <p>
                    Thuật toán CART chọn split tốt nhất <strong>tại mỗi nút</strong>{" "}
                    (greedy) — không đảm bảo cây tối ưu toàn cục. Tìm cây tối ưu là
                    bài toán NP-hard.
                  </p>
                  <p>
                    Ví dụ: split A giảm Gini 0.3 ngay lập tức, nhưng split B giảm
                    0.2 và mở đường cho giảm 0.5 ở tầng sau. Greedy chọn A, bỏ lỡ
                    B.
                  </p>
                  <p>
                    Trong thực tế, greedy &quot;đủ tốt&quot; nhờ đa dạng dữ liệu và
                    khi kết hợp ensembling (Random Forest / Gradient Boosting) thì
                    suboptimality hầu như biến mất.
                  </p>
                  <p>
                    Gần đây có nghiên cứu về <em>optimal decision trees</em>{" "}
                    (GOSDT, DL8.5) dùng ILP, nhưng chỉ khả thi cho dataset nhỏ &amp;
                    cây rất nông.
                  </p>
                </div>
              </CollapsibleDetail>

              <p>
                <strong>Liên hệ kiến thức:</strong> Cây quyết định là nền tảng của{" "}
                <TopicLink slug="random-forests">Random Forest</TopicLink>{" "}
                (bagging), <TopicLink slug="gradient-boosting">Gradient Boosting</TopicLink>{" "}
                (XGBoost, LightGBM), và{" "}
                <TopicLink slug="ensemble-methods">ensemble methods</TopicLink>{" "}
                — nhóm thuật toán mạnh nhất cho dữ liệu bảng (tabular data) hiện
                nay.
              </p>
            </ExplanationSection>
          </LessonSection>

          {/* ═══ STEP 6: MINI SUMMARY — 6 points ═══ */}
          <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
            <MiniSummary
              points={[
                "Cây quyết định phân loại bằng chuỗi câu hỏi 'feature ≤ ngưỡng?' — trực quan như cách não bạn suy nghĩ.",
                "Chọn split tốt nhất bằng Gini impurity (mặc định) hoặc Entropy — giảm impurity nhiều nhất.",
                "Ưu điểm: dễ hiểu, không cần chuẩn hoá, xử lý mixed data, robust với outliers.",
                "Nhược điểm: variance cao, dễ overfitting nếu quá sâu — cần max_depth / min_samples / pruning.",
                "Feature importance = tổng giảm Gini có trọng số → dùng được làm feature selector.",
                "Là thành phần cơ sở của Random Forest và Gradient Boosting — thuật toán mạnh nhất cho tabular data.",
              ]}
            />
          </LessonSection>

          {/* ═══ STEP 7: QUIZ — 8 questions ═══ */}
          <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
            <QuizSection questions={quizQuestions} />
          </LessonSection>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 * END OF FILE — decision-trees.tsx
 *
 * Design notes:
 *   - Interactive tree BUILDER (vs. the old "click Y/N through a fixed
 *     tree" interaction). User presses "Grow" and watches the CART
 *     algorithm pick splits greedy-optimally based on Gini.
 *   - Dataset: 20 customers with (age, income) → buy/not. Designed
 *     so that income is a stronger feature than age — feature
 *     importance bars reflect this naturally.
 *   - Click a leaf → highlighted both in the tree AND in the scatter
 *     plot above, so learners see which region of feature space each
 *     leaf covers.
 *   - max_depth slider resets the tree (to avoid confusing partial
 *     state). "Mọc toàn bộ" button auto-grows one level at a time
 *     with a 600ms delay — feels like watching the tree sprout.
 *   - Feature importance is animated with framer-motion bars.
 *
 * Algorithmic details:
 *   - findBestSplit() iterates over candidate thresholds for each
 *     feature, picks lowest weighted Gini.
 *   - growOneStep() does BFS to find the first splittable leaf and
 *     expands it. This is slightly different from scikit-learn (which
 *     grows depth-first), but BFS makes the animation more
 *     satisfying — the tree grows in layers.
 *   - featureImportance() = standard mean-decrease-in-impurity (MDI),
 *     normalised to sum to 1.
 *
 * ───────────────────────────────────────────────────────────────────
 * Pedagogical choices
 * ───────────────────────────────────────────────────────────────────
 *
 * The scatter plot above the tree lets learners see the{" "}
 * decision-boundary semantics of each split. When they click a leaf,
 * the corresponding points highlight — making the abstract "tree path"
 * concrete as "this rectangular region of feature space".
 *
 * We intentionally do NOT include bootstrap/bagging here — that would
 * overload the lesson. Instead we link to Random Forest and Gradient
 * Boosting topics for the "how to make this better" follow-up.
 *
 * The quiz mixes conceptual (overfitting, feature importance) with
 * practical (do I need to normalise? how does feature importance work?)
 * to catch both newcomers and folks reviewing for interviews.
 *
 * ───────────────────────────────────────────────────────────────────
 * Colour-coding convention (consistent with project design language)
 * ───────────────────────────────────────────────────────────────────
 *
 *   - Decision node : blue (#3b82f6)  — "question"
 *   - Leaf BUY      : green (#22c55e) — positive class
 *   - Leaf NOT BUY  : red   (#ef4444) — negative class
 *   - "≤" edge      : green — left subtree
 *   - ">" edge      : red   — right subtree
 *   - Selected leaf : amber outline (#fbbf24) for focus state
 *
 * ═══════════════════════════════════════════════════════════════════ */
