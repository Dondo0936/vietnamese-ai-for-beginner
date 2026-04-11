"use client";

import { useState, useMemo } from "react";
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
  slug: "t-sne",
  title: "t-SNE",
  titleVi: "Nhúng ngẫu nhiên láng giềng t-phân bố",
  description: "Kỹ thuật giảm chiều phi tuyến để trực quan hóa dữ liệu chiều cao",
  category: "classic-ml",
  tags: ["dimensionality-reduction", "visualization", "unsupervised-learning"],
  difficulty: "advanced",
  relatedSlugs: ["pca", "k-means", "dbscan"],
  vizType: "interactive",
};

/* ── Simulation: t-SNE optimization steps ── */
const CLUSTER_CENTERS = [
  { cx: 120, cy: 100, color: "#3b82f6", label: "MNIST '0'" },
  { cx: 380, cy: 100, color: "#ef4444", label: "MNIST '1'" },
  { cx: 250, cy: 240, color: "#22c55e", label: "MNIST '7'" },
];

function seedRng(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function generatePoints(step: number, perplexity: number) {
  const spread = Math.max(8, 130 - step * 17);
  /* Perplexity affects cluster separation */
  const sepFactor = 0.7 + (perplexity / 50) * 0.6;
  const rng = seedRng(42);

  return CLUSTER_CENTERS.flatMap((center, ci) =>
    Array.from({ length: 10 }, (_, i) => ({
      x: Math.max(15, Math.min(485,
        250 + (center.cx - 250) * sepFactor + (rng() - 0.5) * spread * 2)),
      y: Math.max(15, Math.min(285,
        150 + (center.cy - 150) * sepFactor + (rng() - 0.5) * spread * 2)),
      cluster: ci,
      id: ci * 10 + i,
    }))
  );
}

const MAX_STEP = 7;
const TOTAL_STEPS = 7;

/* ═══════════════ MAIN ═══════════════ */
export default function TsneTopic() {
  const [step, setStep] = useState(0);
  const [perplexity, setPerplexity] = useState(30);

  const points = useMemo(() => generatePoints(step, perplexity), [step, perplexity]);

  /* KL divergence decreases as we optimize (simulated) */
  const klDiv = useMemo(() => Math.max(0.01, 3.5 * Math.exp(-step * 0.5)), [step]);

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "t-SNE phù hợp dùng cho mục đích nào?",
      options: [
        "Giảm chiều trước khi train ML model",
        "Trực quan hoá dữ liệu chiều cao (nhìn cụm, nhìn pattern)",
        "Tính khoảng cách chính xác giữa các nhóm",
      ],
      correct: 1,
      explanation: "t-SNE chỉ dùng để NHÌN dữ liệu, không dùng làm features cho ML (vì stochastic, không deterministic). Khoảng cách giữa cụm trên biểu đồ t-SNE KHÔNG có ý nghĩa tuyệt đối.",
    },
    {
      question: "Perplexity trong t-SNE ảnh hưởng gì?",
      options: [
        "Tốc độ chạy thuật toán",
        "Số láng giềng hiệu quả — perplexity thấp = focus cấu trúc cục bộ, cao = cấu trúc toàn cục",
        "Số chiều output",
      ],
      correct: 1,
      explanation: "Perplexity ≈ số láng giềng mà mỗi điểm 'chú ý'. Perplexity = 5: chỉ nhìn 5 neighbor → nhiều cụm nhỏ. Perplexity = 50: nhìn 50 neighbor → ít cụm, lớn hơn. Thử nhiều giá trị!",
    },
    {
      question: "Chạy t-SNE 2 lần trên cùng dữ liệu. Kết quả có giống nhau không?",
      options: [
        "Luôn giống nhau",
        "Khác nhau — vì khởi tạo ngẫu nhiên và gradient descent không convex",
        "Giống nếu dùng cùng perplexity",
      ],
      correct: 1,
      explanation: "t-SNE stochastic + non-convex optimization → mỗi lần chạy cho layout khác! Cụm vẫn tách nhau nhưng VỊ TRÍ cụm trên biểu đồ thay đổi. Đặt random_state để reproducible.",
    },
  ], []);

  return (
    <>
      {/* STEP 1: PREDICTION GATE */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn có 10.000 ảnh chữ số viết tay (0-9), mỗi ảnh 784 pixel. Muốn vẽ lên biểu đồ 2D để xem các chữ số tạo cụm hay không. PCA đưa từ 784D xuống 2D — nhưng cụm chồng chéo. Có cách nào tốt hơn?"
          options={[
            "PCA 2D là tốt nhất rồi — không thể cải thiện",
            "Dùng t-SNE: phi tuyến, giữ cấu trúc láng giềng → cụm tách rõ hơn",
            "Dùng K-Means trước rồi tô màu",
          ]}
          correct={1}
          explanation="PCA tuyến tính nên nhiều cụm chồng nhau trong 2D. t-SNE phi tuyến — giữ quan hệ 'gần-xa' giữa các điểm → chữ số giống nhau tạo cụm rõ ràng trên 2D!"
        >

      {/* STEP 2: INTERACTIVE VIZ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Nhấn <strong className="text-foreground">&quot;Bước tiếp&quot;</strong>{" "}
          để xem t-SNE tối ưu dần: ban đầu ngẫu nhiên, dần dần kéo điểm giống nhau lại gần và đẩy điểm khác ra xa.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            <svg viewBox="0 0 500 300" className="w-full rounded-lg border border-border bg-background">
              {/* Points */}
              {points.map((p) => (
                <motion.circle
                  key={p.id}
                  r={5}
                  fill={CLUSTER_CENTERS[p.cluster].color}
                  stroke="#fff" strokeWidth={1.5} opacity={0.85}
                  animate={{ cx: p.x, cy: p.y }}
                  transition={{ type: "spring", stiffness: 80, damping: 15 }}
                />
              ))}

              {/* Step label */}
              <text x={10} y={20} fontSize={12} fill="currentColor" className="text-foreground" fontWeight={600}>
                Bước {step}/{MAX_STEP}
              </text>
              <text x={10} y={38} fontSize={10} fill="currentColor" className="text-muted">
                KL Divergence: {klDiv.toFixed(2)}
              </text>
              <text x={10} y={54} fontSize={10} fill="currentColor" className="text-muted">
                Perplexity: {perplexity}
              </text>

              {/* Legend */}
              {CLUSTER_CENTERS.map((c, i) => (
                <g key={i}>
                  <circle cx={380} cy={14 + i * 16} r={4} fill={c.color} />
                  <text x={390} y={18 + i * 16} fontSize={9} fill="currentColor" className="text-muted">{c.label}</text>
                </g>
              ))}

              {step === 0 && (
                <text x={250} y={160} fontSize={14} fill="currentColor" className="text-muted" textAnchor="middle" opacity={0.4}>
                  Khởi tạo ngẫu nhiên
                </text>
              )}
            </svg>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setStep((s) => Math.min(MAX_STEP, s + 1))}
                disabled={step >= MAX_STEP}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-30"
              >
                Bước tiếp
              </button>
              <button
                onClick={() => setStep(0)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                Đặt lại
              </button>
            </div>

            {/* Perplexity slider */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-muted whitespace-nowrap">Perplexity:</label>
              <input type="range" min={5} max={50} value={perplexity}
                onChange={(e) => { setPerplexity(Number(e.target.value)); setStep(0); }}
                className="flex-1 accent-accent" />
              <span className="w-8 text-center text-xs font-bold text-accent">{perplexity}</span>
            </div>

            {/* Convergence status */}
            <AnimatePresence>
              {step === MAX_STEP && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="rounded-lg border border-green-300 bg-green-50 p-3 text-center text-sm font-medium text-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300"
                >
                  Hội tụ! Các cụm đã tách rõ ràng trên 2D.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* STEP 3: AHA */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>t-SNE</strong>{" "}
            &quot;kéo&quot; điểm giống nhau lại gần và &quot;đẩy&quot; điểm khác nhau ra xa — tối ưu dần từ vị trí ngẫu nhiên. Kết quả: cấu trúc cụm ẩn trong 784 chiều hiện rõ trên 2D!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* STEP 4: CHALLENGE */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Trên biểu đồ t-SNE, cụm A cách cụm B gấp 3 lần cụm C. Kết luận gì?"
          options={[
            "A khác B hơn khác C — khoảng cách t-SNE phản ánh tương đồng",
            "KHÔNG kết luận được — khoảng cách giữa cụm t-SNE không có ý nghĩa tuyệt đối",
            "A và C rất giống nhau",
          ]}
          correct={1}
          explanation="Đây là bẫy phổ biến! t-SNE chỉ giữ cấu trúc CỤC BỘ (gần vẫn gần, xa vẫn xa). Khoảng cách TUYỆT ĐỐI giữa các cụm phụ thuộc vào perplexity và quá trình tối ưu — KHÔNG nên so sánh."
        />
      </LessonSection>

      {/* STEP 5: EXPLANATION */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>t-SNE</strong>{" "}
            (t-distributed Stochastic Neighbor Embedding) giảm chiều bằng cách giữ quan hệ &quot;láng giềng&quot;:
          </p>

          <p><strong>Bước 1: Không gian cao chiều</strong>{" "}— xác suất &quot;láng giềng&quot; bằng Gaussian:</p>
          <LaTeX block>{"p_{j|i} = \\frac{\\exp(-||x_i - x_j||^2 / 2\\sigma_i^2)}{\\sum_{k \\neq i}\\exp(-||x_i - x_k||^2 / 2\\sigma_i^2)}"}</LaTeX>

          <p><strong>Bước 2: Không gian thấp (2D)</strong>{" "}— xác suất bằng Student-t (đuôi nặng):</p>
          <LaTeX block>{"q_{ij} = \\frac{(1 + ||y_i - y_j||^2)^{-1}}{\\sum_{k \\neq l}(1 + ||y_k - y_l||^2)^{-1}}"}</LaTeX>

          <p><strong>Bước 3: Tối thiểu KL divergence</strong>{" "}bằng gradient descent:</p>
          <LaTeX block>{"\\text{KL}(P||Q) = \\sum_{i \\neq j} p_{ij} \\log \\frac{p_{ij}}{q_{ij}}"}</LaTeX>

          <Callout variant="tip" title="Tại sao dùng Student-t chứ không phải Gaussian?">
            Gaussian trong không gian thấp ép mọi thứ gần nhau (crowding problem). Student-t có đuôi nặng → cho phép điểm xa ở xa hơn → cụm tách rõ hơn. Đây là &quot;trick&quot; quan trọng nhất của t-SNE.
          </Callout>

          <p><strong>Perplexity</strong>{" "}= 2^entropy = &quot;số láng giềng hiệu quả&quot;:</p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>Perplexity 5-10: focus cục bộ → nhiều cụm nhỏ</li>
            <li>Perplexity 30-50: cân bằng → phổ biến nhất</li>
            <li>Perplexity &gt; 50: focus toàn cục → ít cụm, giống PCA hơn</li>
          </ul>

          <CodeBlock language="python" title="t-SNE với scikit-learn">
{`from sklearn.manifold import TSNE
from sklearn.preprocessing import StandardScaler
from sklearn.datasets import load_digits
import matplotlib.pyplot as plt

X, y = load_digits(return_X_y=True)
X_scaled = StandardScaler().fit_transform(X)

# t-SNE giảm từ 64D xuống 2D
tsne = TSNE(
    n_components=2,
    perplexity=30,        # Thử 10, 30, 50
    learning_rate="auto",
    n_iter=1000,
    random_state=42,      # Reproducible
)
X_2d = tsne.fit_transform(X_scaled)

# Vẽ scatter plot
plt.scatter(X_2d[:, 0], X_2d[:, 1], c=y, cmap="tab10", s=5, alpha=0.7)
plt.colorbar(label="Chữ số")
plt.title("t-SNE: 64D → 2D (MNIST digits)")
plt.savefig("tsne_digits.png", dpi=150)`}
          </CodeBlock>

          <Callout variant="warning" title="3 lỗi phổ biến khi dùng t-SNE">
            1. So sánh khoảng cách giữa cụm → SAI (chỉ cấu trúc cục bộ có ý nghĩa).{"\n"}
            2. Kết luận từ 1 lần chạy → SAI (chạy nhiều lần, thử nhiều perplexity).{"\n"}
            3. Dùng t-SNE features cho ML → SAI (stochastic, không deterministic — dùng PCA cho pipeline).
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* STEP 6: SUMMARY */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "t-SNE giảm chiều PHI TUYẾN: giữ cấu trúc láng giềng, cụm tách rõ trên 2D.",
          "Gaussian (chiều cao) + Student-t (chiều thấp) + KL divergence → tối ưu bằng gradient descent.",
          "Perplexity = số láng giềng hiệu quả. Thấp = cục bộ, cao = toàn cục. Thử nhiều giá trị!",
          "CHỈ dùng để trực quan hoá — khoảng cách giữa cụm không có ý nghĩa tuyệt đối.",
          "PCA cho pipeline ML, t-SNE cho visualization. UMAP nhanh hơn t-SNE và giữ cấu trúc toàn cục tốt hơn.",
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
