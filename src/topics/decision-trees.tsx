"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "decision-trees",
  title: "Decision Trees",
  titleVi: "Cây quyết định",
  description: "Mô hình phân loại bằng chuỗi câu hỏi có/không tạo thành cấu trúc cây",
  category: "classic-ml",
  tags: ["classification", "supervised-learning", "interpretable"],
  difficulty: "beginner",
  relatedSlugs: ["random-forests", "gradient-boosting", "bias-variance"],
  vizType: "interactive",
};

/* ── Interactive tree data ── */
type Choice = "yes" | "no" | null;

interface TreeNode {
  id: string;
  question?: string;
  yesChild?: string;
  noChild?: string;
  result?: string;
  emoji?: string;
}

const TREE: TreeNode[] = [
  { id: "root", question: "Giá > 100K?", yesChild: "n1", noChild: "n2" },
  { id: "n1", question: "Đánh giá ≥ 4.5⭐?", yesChild: "l1", noChild: "l2" },
  { id: "n2", question: "Miễn phí ship?", yesChild: "l3", noChild: "n3" },
  { id: "n3", question: "Có voucher?", yesChild: "l4", noChild: "l5" },
  { id: "l1", result: "MUA", emoji: "🛒" },
  { id: "l2", result: "BỎ QUA", emoji: "❌" },
  { id: "l3", result: "MUA", emoji: "🛒" },
  { id: "l4", result: "MUA", emoji: "🛒" },
  { id: "l5", result: "BỎ QUA", emoji: "❌" },
];

/* Layout positions for the tree */
const POS: Record<string, { x: number; y: number }> = {
  root: { x: 250, y: 35 },
  n1: { x: 130, y: 120 },
  n2: { x: 370, y: 120 },
  n3: { x: 430, y: 205 },
  l1: { x: 65, y: 205 },
  l2: { x: 195, y: 205 },
  l3: { x: 310, y: 205 },
  l4: { x: 380, y: 280 },
  l5: { x: 480, y: 280 },
};

/* ── Gini calculator for explanation ── */
function gini(counts: number[]): number {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  return 1 - counts.reduce((s, c) => s + (c / total) ** 2, 0);
}

const TOTAL_STEPS = 7;

/* ═══════════════ MAIN ═══════════════ */
export default function DecisionTreesTopic() {
  const [choices, setChoices] = useState<Record<string, Choice>>({});

  const makeChoice = useCallback((nodeId: string, choice: Choice) => {
    setChoices((prev) => {
      const updated = { ...prev, [nodeId]: choice };
      /* Clear all downstream choices */
      const clearDown = (nid: string) => {
        const node = TREE.find((n) => n.id === nid);
        if (node?.yesChild) { delete updated[node.yesChild]; clearDown(node.yesChild); }
        if (node?.noChild) { delete updated[node.noChild]; clearDown(node.noChild); }
      };
      clearDown(nodeId);
      return updated;
    });
  }, []);

  /* Which nodes are reachable given current choices? */
  const reachable = useMemo(() => {
    const set = new Set<string>(["root"]);
    const queue = ["root"];
    while (queue.length) {
      const id = queue.shift()!;
      const node = TREE.find((n) => n.id === id)!;
      const choice = choices[id];
      if (choice === "yes" && node.yesChild) { set.add(node.yesChild); queue.push(node.yesChild); }
      if (choice === "no" && node.noChild) { set.add(node.noChild); queue.push(node.noChild); }
    }
    return set;
  }, [choices]);

  /* Active path: find the leaf if fully decided */
  const activePath = useMemo(() => {
    const path: string[] = ["root"];
    let curr = "root";
    while (true) {
      const node = TREE.find((n) => n.id === curr)!;
      if (node.result) break;
      const ch = choices[curr];
      if (ch === "yes" && node.yesChild) { path.push(node.yesChild); curr = node.yesChild; }
      else if (ch === "no" && node.noChild) { path.push(node.noChild); curr = node.noChild; }
      else break;
    }
    return path;
  }, [choices]);

  const finalNode = useMemo(() => {
    const lastId = activePath[activePath.length - 1];
    return TREE.find((n) => n.id === lastId);
  }, [activePath]);

  /* Example Gini for the explanation */
  const giniExample = gini([6, 4]);

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Cây quyết định chọn câu hỏi nào để chia nhánh đầu tiên?",
      options: [
        "Câu hỏi ngẫu nhiên",
        "Câu hỏi giảm Gini impurity (hoặc tăng information gain) nhiều nhất",
        "Câu hỏi về feature có giá trị lớn nhất",
      ],
      correct: 1,
      explanation: "Tại mỗi nút, thuật toán thử TẤT CẢ các câu hỏi có thể và chọn câu hỏi chia dữ liệu 'thuần khiết' nhất — tức giảm Gini impurity nhiều nhất.",
    },
    {
      question: "Cây quyết định sâu (many levels) có vấn đề gì?",
      options: [
        "Chạy chậm hơn",
        "Dễ bị overfitting — học thuộc noise trong dữ liệu",
        "Không phân loại được dữ liệu phức tạp",
      ],
      correct: 1,
      explanation: "Cây sâu có thể tạo nhánh riêng cho từng điểm → học thuộc dữ liệu huấn luyện. Giải pháp: pruning (cắt tỉa), giới hạn chiều sâu, hoặc dùng Random Forest.",
    },
    {
      question: "So với logistic regression, ưu điểm lớn nhất của cây quyết định là gì?",
      options: [
        "Luôn chính xác hơn",
        "Dễ giải thích — có thể đọc từng nhánh để hiểu tại sao",
        "Huấn luyện nhanh hơn",
      ],
      correct: 1,
      explanation: "Cây quyết định tạo ra luật IF-THEN mà con người đọc được. Trong y tế, tài chính — nơi cần giải thích quyết định — đây là ưu điểm rất lớn.",
    },
  ], []);

  const spring = { type: "spring" as const, stiffness: 150, damping: 18 };

  return (
    <>
      {/* STEP 1: PREDICTION GATE */}
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
        >

      {/* STEP 2: INTERACTIVE TREE */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Hãy đóng vai AI: trả lời từng câu hỏi <strong className="text-foreground">Có/Không</strong>{" "}
          để đi xuống cây. Mỗi lựa chọn rẽ nhánh khác nhau, cuối cùng đến kết luận MUA hoặc BỎ QUA.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            <svg viewBox="0 0 530 310" className="w-full rounded-lg border border-border bg-background">
              {/* Edges */}
              {TREE.filter((n) => n.yesChild).map((node) => {
                const pos = POS[node.id];
                const yesPos = POS[node.yesChild!];
                const noPos = POS[node.noChild!];
                const ch = choices[node.id];
                const nodeReachable = reachable.has(node.id);
                return (
                  <g key={`e-${node.id}`}>
                    <line
                      x1={pos.x} y1={pos.y + 18} x2={yesPos.x} y2={yesPos.y - 18}
                      stroke={ch === "yes" && nodeReachable ? "#22c55e" : "#666"}
                      strokeWidth={ch === "yes" && nodeReachable ? 2.5 : 1}
                      opacity={nodeReachable ? (ch === "yes" ? 1 : 0.4) : 0.15}
                    />
                    <text
                      x={(pos.x + yesPos.x) / 2 - 12} y={(pos.y + yesPos.y) / 2 + 2}
                      fontSize={9} fill="#22c55e" fontWeight={600}
                      opacity={nodeReachable ? 0.8 : 0.2}
                    >
                      Có
                    </text>
                    <line
                      x1={pos.x} y1={pos.y + 18} x2={noPos.x} y2={noPos.y - 18}
                      stroke={ch === "no" && nodeReachable ? "#ef4444" : "#666"}
                      strokeWidth={ch === "no" && nodeReachable ? 2.5 : 1}
                      opacity={nodeReachable ? (ch === "no" ? 1 : 0.4) : 0.15}
                    />
                    <text
                      x={(pos.x + noPos.x) / 2 + 4} y={(pos.y + noPos.y) / 2 + 2}
                      fontSize={9} fill="#ef4444" fontWeight={600}
                      opacity={nodeReachable ? 0.8 : 0.2}
                    >
                      Không
                    </text>
                  </g>
                );
              })}

              {/* Nodes */}
              {TREE.map((node) => {
                const pos = POS[node.id];
                const isReachable = reachable.has(node.id);
                const isOnPath = activePath.includes(node.id);
                const ch = choices[node.id];

                /* Leaf node */
                if (node.result) {
                  const isBuy = node.result === "MUA";
                  return (
                    <motion.g key={node.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: isReachable ? 1 : 0.2, scale: isReachable ? 1 : 0.9 }}
                      transition={spring}
                    >
                      <rect
                        x={pos.x - 35} y={pos.y - 14} width={70} height={28} rx={8}
                        fill={isBuy ? "#22c55e" : "#ef4444"} opacity={isOnPath ? 0.2 : 0.1}
                        stroke={isBuy ? "#22c55e" : "#ef4444"} strokeWidth={isOnPath ? 2 : 1}
                      />
                      <text x={pos.x} y={pos.y + 5} fontSize={12}
                        fill={isBuy ? "#22c55e" : "#ef4444"} textAnchor="middle" fontWeight={700}>
                        {node.result}
                      </text>
                    </motion.g>
                  );
                }

                /* Decision node */
                const fillColor = ch === "yes" ? "#22c55e" : ch === "no" ? "#ef4444" : "#3b82f6";
                const needsChoice = isReachable && ch === undefined;
                return (
                  <g key={node.id}>
                    <motion.rect
                      x={pos.x - 60} y={pos.y - 16} width={120} height={32} rx={10}
                      fill={fillColor} opacity={isReachable ? 0.12 : 0.05}
                      stroke={fillColor} strokeWidth={isReachable ? 1.5 : 0.5}
                      animate={{ opacity: isReachable ? 0.12 : 0.05 }}
                    />
                    <text x={pos.x} y={pos.y + 4} fontSize={11}
                      fill={isReachable ? fillColor : "#888"} textAnchor="middle" fontWeight={600}>
                      {node.question}
                    </text>
                    {/* Yes/No buttons */}
                    {needsChoice && (
                      <>
                        <rect
                          x={pos.x - 55} y={pos.y + 18} width={48} height={18} rx={4}
                          fill="#22c55e" opacity={0.15} stroke="#22c55e" strokeWidth={1}
                          className="cursor-pointer"
                          onClick={() => makeChoice(node.id, "yes")}
                        />
                        <text
                          x={pos.x - 31} y={pos.y + 30} fontSize={10} fill="#22c55e"
                          textAnchor="middle" fontWeight={600} className="pointer-events-none"
                        >
                          Có
                        </text>
                        <rect
                          x={pos.x + 7} y={pos.y + 18} width={48} height={18} rx={4}
                          fill="#ef4444" opacity={0.15} stroke="#ef4444" strokeWidth={1}
                          className="cursor-pointer"
                          onClick={() => makeChoice(node.id, "no")}
                        />
                        <text
                          x={pos.x + 31} y={pos.y + 30} fontSize={10} fill="#ef4444"
                          textAnchor="middle" fontWeight={600} className="pointer-events-none"
                        >
                          Không
                        </text>
                      </>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Result banner */}
            <AnimatePresence>
              {finalNode?.result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className={`rounded-lg border p-3 text-center text-sm font-semibold ${
                    finalNode.result === "MUA"
                      ? "border-green-300 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300"
                      : "border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300"
                  }`}
                >
                  Kết luận: {finalNode.result} {finalNode.emoji} — qua {activePath.length - 1} câu hỏi
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => setChoices({})}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              Chơi lại
            </button>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* STEP 3: AHA */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Bạn vừa đi qua một <strong>Cây quyết định</strong>{" "}
            — chuỗi câu hỏi Có/Không thu hẹp dần đến kết luận. Máy tính cũng làm y hệt: tại mỗi nút, chọn câu hỏi chia dữ liệu &quot;sạch&quot; nhất!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* STEP 4: CHALLENGE */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
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
      </LessonSection>

      {/* STEP 5: EXPLANATION */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Cây quyết định</strong>{" "}
            chia không gian dữ liệu bằng chuỗi câu hỏi dạng &quot;feature X &gt; ngưỡng T?&quot;. Tại mỗi nút, thuật toán chọn câu hỏi tốt nhất theo tiêu chí:
          </p>

          <p><strong>Gini Impurity</strong>{" "}(mặc định trong scikit-learn):</p>
          <LaTeX block>{"G = 1 - \\sum_{k=1}^{K} p_k^2"}</LaTeX>

          <p>
            Ví dụ: nút chứa 6 mẫu lớp A và 4 mẫu lớp B → <LaTeX>{"G = 1 - (0.6^2 + 0.4^2) = "}</LaTeX> {giniExample.toFixed(2)}.
          </p>

          <p><strong>Information Gain</strong>{" "}(dựa trên entropy):</p>
          <LaTeX block>{"H = -\\sum_{k=1}^{K} p_k \\log_2 p_k"}</LaTeX>
          <LaTeX block>{"\\text{IG} = H(\\text{parent}) - \\sum \\frac{n_j}{n} H(\\text{child}_j)"}</LaTeX>

          <Callout variant="tip" title="Gini vs Entropy">
            Trong thực tế, hai tiêu chí cho kết quả gần giống nhau. Gini nhanh hơn (không cần tính log), Entropy cho cây cân bằng hơn. scikit-learn mặc định dùng Gini.
          </Callout>

          <p><strong>Kiểm soát overfitting:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>max_depth:</strong>{" "}Giới hạn chiều sâu cây</li>
            <li><strong>min_samples_split:</strong>{" "}Số mẫu tối thiểu để chia nhánh</li>
            <li><strong>min_samples_leaf:</strong>{" "}Số mẫu tối thiểu ở mỗi lá</li>
            <li><strong>Pruning:</strong>{" "}Cắt tỉa nhánh không cải thiện hiệu suất</li>
          </ul>

          <CodeBlock language="python" title="Cây quyết định với scikit-learn">
{`from sklearn.tree import DecisionTreeClassifier, export_text
from sklearn.datasets import load_iris

X, y = load_iris(return_X_y=True)

tree = DecisionTreeClassifier(
    max_depth=3,           # Giới hạn sâu 3 tầng
    min_samples_leaf=5,    # Mỗi lá ít nhất 5 mẫu
    criterion="gini",      # Hoặc "entropy"
    random_state=42,
)
tree.fit(X, y)

# In cây dưới dạng text
print(export_text(tree, feature_names=load_iris().feature_names))
print(f"Accuracy: {tree.score(X, y):.1%}")`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      {/* STEP 6: SUMMARY */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "Cây quyết định phân loại bằng chuỗi câu hỏi Có/Không — trực quan như cách não bạn suy nghĩ.",
          "Chọn câu hỏi tốt nhất bằng Gini impurity hoặc Information Gain — chia dữ liệu 'thuần khiết' nhất.",
          "Ưu điểm: dễ hiểu, dễ giải thích, không cần chuẩn hoá dữ liệu.",
          "Nhược điểm: dễ overfitting nếu quá sâu — cần pruning hoặc giới hạn chiều sâu.",
          "Là thành phần cơ sở của Random Forest và Gradient Boosting — hai thuật toán mạnh nhất hiện nay.",
        ]} />
      </LessonSection>

      {/* STEP 7: QUIZ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>

        </PredictionGate>
      </LessonSection>
    </>
  );
}
