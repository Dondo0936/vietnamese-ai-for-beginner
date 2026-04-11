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
  slug: "random-forests",
  title: "Random Forests",
  titleVi: "Rừng ngẫu nhiên",
  description: "Kết hợp nhiều cây quyết định để tạo mô hình mạnh mẽ và ổn định hơn",
  category: "classic-ml",
  tags: ["ensemble", "classification", "bagging"],
  difficulty: "intermediate",
  relatedSlugs: ["decision-trees", "gradient-boosting", "bias-variance"],
  vizType: "interactive",
};

/* ── Tree simulation data ── */
interface TreeVote {
  id: number;
  features: string;
  vote: "A" | "B";
  confidence: number;
}

const TREES: TreeVote[] = [
  { id: 1, features: "giá, đánh giá", vote: "A", confidence: 0.82 },
  { id: 2, features: "đánh giá, ship", vote: "B", confidence: 0.65 },
  { id: 3, features: "giá, voucher", vote: "A", confidence: 0.91 },
  { id: 4, features: "ship, voucher", vote: "A", confidence: 0.73 },
  { id: 5, features: "giá, ship", vote: "B", confidence: 0.58 },
  { id: 6, features: "đánh giá, voucher", vote: "A", confidence: 0.88 },
  { id: 7, features: "giá, đánh giá", vote: "B", confidence: 0.70 },
  { id: 8, features: "ship, đánh giá", vote: "A", confidence: 0.77 },
  { id: 9, features: "voucher, giá", vote: "A", confidence: 0.85 },
];

const TOTAL_STEPS = 7;

/* ═══════════════ MAIN ═══════════════ */
export default function RandomForestsTopic() {
  const [activeTrees, setActiveTrees] = useState<Set<number>>(
    new Set(TREES.map((t) => t.id))
  );

  const toggleTree = useCallback((id: number) => {
    setActiveTrees((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { if (next.size > 1) next.delete(id); }
      else next.add(id);
      return next;
    });
  }, []);

  const result = useMemo(() => {
    const active = TREES.filter((t) => activeTrees.has(t.id));
    const countA = active.filter((t) => t.vote === "A").length;
    const countB = active.filter((t) => t.vote === "B").length;
    const total = active.length;
    const winner = countA >= countB ? "A" : "B";
    const agreement = Math.max(countA, countB) / total;
    return { countA, countB, total, winner, agreement };
  }, [activeTrees]);

  /* Single tree accuracy vs forest accuracy simulation */
  const singleTreeAcc = 0.72;
  const forestAcc = useMemo(() => {
    const n = activeTrees.size;
    /* Simple formula: majority vote of n independent classifiers each with accuracy p */
    const p = singleTreeAcc;
    let acc = 0;
    const majority = Math.ceil(n / 2);
    for (let k = majority; k <= n; k++) {
      const comb = factorial(n) / (factorial(k) * factorial(n - k));
      acc += comb * Math.pow(p, k) * Math.pow(1 - p, n - k);
    }
    return acc;
  }, [activeTrees.size]);

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Tại sao Random Forest thường tốt hơn một cây quyết định đơn lẻ?",
      options: [
        "Vì rừng chạy nhanh hơn một cây",
        "Vì bỏ phiếu đa số triệt tiêu lỗi ngẫu nhiên của từng cây → giảm variance",
        "Vì rừng luôn có training accuracy = 100%",
      ],
      correct: 1,
      explanation: "Mỗi cây có thể sai ở các chỗ khác nhau. Khi bỏ phiếu đa số, lỗi ngẫu nhiên bù trừ nhau → kết quả ổn định hơn. Đây là nguyên lý 'trí tuệ đám đông'.",
    },
    {
      question: "Random Forest dùng kỹ thuật nào để tạo sự đa dạng giữa các cây?",
      options: [
        "Mỗi cây dùng toàn bộ dữ liệu và toàn bộ features",
        "Mỗi cây dùng tập bootstrap (lấy mẫu có hoàn lại) + chỉ xem tập con features ngẫu nhiên",
        "Mỗi cây dùng thuật toán khác nhau (KNN, SVM, ...)",
      ],
      correct: 1,
      explanation: "Hai nguồn ngẫu nhiên: (1) Bootstrap sampling cho dữ liệu, (2) random feature subset ở mỗi nút chia. Điều này làm các cây khác nhau → bỏ phiếu hiệu quả hơn.",
    },
    {
      question: "Khi nào nên dùng Random Forest thay vì Gradient Boosting?",
      options: [
        "Khi cần accuracy tuyệt đối cao nhất",
        "Khi cần mô hình ổn định, ít cần tune hyperparameter, chạy song song được",
        "Khi dữ liệu rất nhỏ (< 100 mẫu)",
      ],
      correct: 1,
      explanation: "Random Forest 'works out of the box' — ít nhạy với hyperparameter, chạy song song dễ. Gradient Boosting thường accuracy cao hơn nhưng cần tune cẩn thận hơn.",
    },
  ], []);

  return (
    <>
      {/* STEP 1: PREDICTION GATE */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn muốn mua xe máy cũ. Hỏi 1 người bạn → có thể nhận lời khuyên sai. Hỏi 9 người bạn (mỗi người xem xét vài tiêu chí khác nhau) rồi nghe đa số. Cách nào đáng tin hơn?"
          options={[
            "Hỏi 1 chuyên gia giỏi nhất — chất lượng hơn số lượng",
            "Hỏi 9 người rồi bỏ phiếu — nhiều góc nhìn bù trừ sai sót",
            "Không khác biệt — xác suất đúng như nhau",
          ]}
          correct={1}
          explanation="Đây là 'trí tuệ đám đông'! 9 người mỗi người đúng 72% → đa số đúng ~90%. Random Forest áp dụng ý tưởng này: nhiều cây 'trung bình' nhưng đa dạng → rừng mạnh!"
        >

      {/* STEP 2: INTERACTIVE VIZ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Mỗi cây xem <strong className="text-foreground">tập con features khác nhau</strong>{" "}
          và đưa ra phiếu bầu. Nhấp vào cây để bật/tắt. Quan sát kết quả bỏ phiếu và accuracy thay đổi.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            <svg viewBox="0 0 520 340" className="w-full rounded-lg border border-border bg-background">
              {/* Trees row */}
              {TREES.map((tree, i) => {
                const x = 30 + i * 55;
                const active = activeTrees.has(tree.id);
                const color = tree.vote === "A" ? "#3b82f6" : "#ef4444";
                return (
                  <g
                    key={tree.id}
                    className="cursor-pointer"
                    onClick={() => toggleTree(tree.id)}
                  >
                    <motion.g
                      animate={{ opacity: active ? 1 : 0.2 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Tree trunk */}
                      <rect x={x - 2} y={105} width={4} height={25} fill="#92400e" rx={1} />
                      {/* Tree crown */}
                      <polygon
                        points={`${x},55 ${x - 22},105 ${x + 22},105`}
                        fill="#22c55e" stroke="#166534" strokeWidth={0.8}
                      />
                      {/* Vote badge */}
                      <circle cx={x} cy={80} r={10} fill={color} opacity={0.9} />
                      <text x={x} y={84} fontSize={11} fill="white" textAnchor="middle" fontWeight={700}>
                        {tree.vote}
                      </text>
                      {/* Confidence */}
                      <text x={x} y={145} fontSize={8} fill="currentColor" className="text-muted" textAnchor="middle">
                        {(tree.confidence * 100).toFixed(0)}%
                      </text>
                      {/* Features */}
                      <text x={x} y={156} fontSize={6.5} fill="currentColor" className="text-muted" textAnchor="middle">
                        {tree.features}
                      </text>
                      {/* Tree label */}
                      <text x={x} y={170} fontSize={8} fill="currentColor" className="text-muted" textAnchor="middle" fontWeight={600}>
                        Cây {tree.id}
                      </text>
                    </motion.g>
                  </g>
                );
              })}

              {/* Arrow */}
              <line x1={260} y1={180} x2={260} y2={205} stroke="currentColor" className="text-muted" strokeWidth={2} />
              <polygon points="255,205 265,205 260,215" fill="#888" />

              {/* Voting result box */}
              <rect
                x={120} y={220} width={280} height={55} rx={12}
                fill={result.winner === "A" ? "#3b82f6" : "#ef4444"} opacity={0.1}
                stroke={result.winner === "A" ? "#3b82f6" : "#ef4444"} strokeWidth={2}
              />
              <text x={260} y={243} fontSize={14} fill={result.winner === "A" ? "#3b82f6" : "#ef4444"} textAnchor="middle" fontWeight={700}>
                Bỏ phiếu: Lớp {result.winner} thắng!
              </text>
              <text x={260} y={262} fontSize={11} fill="currentColor" className="text-muted" textAnchor="middle">
                A: {result.countA} | B: {result.countB} phiếu ({result.total} cây) — Đồng thuận: {(result.agreement * 100).toFixed(0)}%
              </text>

              {/* Accuracy comparison */}
              <text x={260} y={300} fontSize={10} fill="currentColor" className="text-muted" textAnchor="middle">
                Accuracy 1 cây: {(singleTreeAcc * 100).toFixed(0)}% → Rừng {result.total} cây: ~{(forestAcc * 100).toFixed(0)}%
              </text>

              {/* Accuracy bars */}
              <rect x={150} y={310} width={100 * singleTreeAcc} height={6} rx={3} fill="#f97316" opacity={0.5} />
              <rect x={150} y={320} width={100 * forestAcc} height={6} rx={3} fill="#22c55e" opacity={0.7} />
              <text x={150 + 100 * singleTreeAcc + 5} y={316} fontSize={8} fill="#f97316">1 cây</text>
              <text x={150 + 100 * forestAcc + 5} y={326} fontSize={8} fill="#22c55e">Rừng</text>
            </svg>

            <p className="text-xs text-muted">
              Thử tắt bớt cây — accuracy giảm! Bật thêm cây — accuracy tăng. Đó là sức mạnh của ensemble.
            </p>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* STEP 3: AHA */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>Random Forest</strong>{" "}
            = nhiều cây quyết định ĐA DẠNG + bỏ phiếu đa số. Mỗi cây &quot;trung bình&quot; nhưng nhìn dữ liệu từ góc khác → sai sót bù trừ nhau → rừng mạnh hơn từng cây!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* STEP 4: CHALLENGE */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Nếu tất cả 9 cây trong Random Forest đều giống hệt nhau (cùng dữ liệu, cùng features), rừng có tốt hơn 1 cây không?"
          options={[
            "Có — 9 cây luôn tốt hơn 1 cây",
            "Không — 9 cây giống nhau = 9 lần cùng 1 kết quả, bỏ phiếu vô nghĩa",
            "Tuỳ vào dữ liệu",
          ]}
          correct={1}
          explanation="Sức mạnh ensemble nằm ở sự ĐA DẠNG. 9 cây giống nhau → cùng sai ở cùng chỗ → bỏ phiếu không giúp gì. Random Forest tạo đa dạng bằng bootstrap + random features."
        />
      </LessonSection>

      {/* STEP 5: EXPLANATION */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Random Forest</strong>{" "}
            là kỹ thuật <strong>Bagging</strong>{" "}
            (Bootstrap AGGregatING) kết hợp nhiều cây quyết định:
          </p>

          <p><strong>Hai nguồn ngẫu nhiên:</strong></p>
          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li>
              <strong>Bootstrap sampling:</strong>{" "}
              Mỗi cây huấn luyện trên tập con lấy mẫu có hoàn lại từ dữ liệu gốc. Khoảng 63% dữ liệu xuất hiện, 37% bị bỏ ra (dùng làm OOB — Out-of-Bag estimate).
            </li>
            <li>
              <strong>Random feature subset:</strong>{" "}
              Tại mỗi nút chia, chỉ xem xét <LaTeX>{"\\sqrt{d}"}</LaTeX> features ngẫu nhiên (d = tổng features). Điều này tạo đa dạng giữa các cây.
            </li>
          </ol>

          <p><strong>Kết hợp kết quả:</strong></p>
          <LaTeX block>{"\\hat{y} = \\text{mode}(h_1(x), h_2(x), \\ldots, h_T(x)) \\quad \\text{(phân loại: bỏ phiếu đa số)}"}</LaTeX>
          <LaTeX block>{"\\hat{y} = \\frac{1}{T}\\sum_{t=1}^{T} h_t(x) \\quad \\text{(hồi quy: trung bình)}"}</LaTeX>

          <Callout variant="tip" title="Tại sao rừng mạnh hơn cây?">
            Giả sử mỗi cây accuracy 72% (độc lập). Với 9 cây, xác suất đa số đúng:
            <br />
            <LaTeX>{"P(\\text{majority correct}) = \\sum_{k=5}^{9} \\binom{9}{k} (0.72)^k (0.28)^{9-k} \\approx 90\\%"}</LaTeX>
            <br />
            Càng nhiều cây, accuracy càng tiến gần 100% — miễn là các cây ĐA DẠNG!
          </Callout>

          <CodeBlock language="python" title="Random Forest với scikit-learn">
{`from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_iris
from sklearn.model_selection import cross_val_score

X, y = load_iris(return_X_y=True)

# Random Forest 100 cây
rf = RandomForestClassifier(
    n_estimators=100,     # Số cây
    max_features="sqrt",  # √d features mỗi nút
    max_depth=5,          # Giới hạn chiều sâu
    oob_score=True,       # Đánh giá bằng OOB
    random_state=42,
)
rf.fit(X, y)

print(f"OOB Score: {rf.oob_score_:.1%}")
print(f"Cross-val: {cross_val_score(rf, X, y, cv=5).mean():.1%}")
print(f"Feature importance: {dict(zip(load_iris().feature_names, rf.feature_importances_.round(3)))}")`}
          </CodeBlock>

          <Callout variant="warning" title="Random Forest vs Gradient Boosting">
            Random Forest xây cây SONG SONG → nhanh, ổn định, ít cần tune. Gradient Boosting xây NỐI TIẾP → thường chính xác hơn nhưng chậm hơn và dễ overfit nếu tune sai.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* STEP 6: SUMMARY */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "Random Forest = nhiều cây quyết định đa dạng + bỏ phiếu đa số → giảm variance, tăng ổn định.",
          "Đa dạng từ: bootstrap sampling (dữ liệu) + random features (mỗi nút chia).",
          "OOB (Out-of-Bag) score cho phép đánh giá mà không cần tập validation riêng.",
          "Feature importance: đo mức đóng góp của từng feature → giúp hiểu dữ liệu.",
          "Ưu điểm: works out-of-the-box, ít cần tune, chạy song song. Nhược: kém giải thích hơn 1 cây.",
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

/* Helper: factorial for small n */
function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}
