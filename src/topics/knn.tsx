"use client";

import { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX, TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "knn",
  title: "K-Nearest Neighbors",
  titleVi: "K láng giềng gần nhất",
  description: "Thuật toán phân loại dựa trên khoảng cách đến K điểm gần nhất",
  category: "classic-ml",
  tags: ["classification", "supervised-learning", "distance"],
  difficulty: "beginner",
  relatedSlugs: ["k-means", "svm", "logistic-regression"],
  vizType: "interactive",
};

/* ── Data ── */
type Pt = { x: number; y: number };

const CLASS_A: Pt[] = [
  { x: 80, y: 80 },  { x: 100, y: 140 }, { x: 130, y: 60 },
  { x: 60, y: 180 }, { x: 150, y: 120 }, { x: 110, y: 200 },
  { x: 170, y: 170 }, { x: 90, y: 100 },
];

const CLASS_B: Pt[] = [
  { x: 340, y: 100 }, { x: 370, y: 180 }, { x: 400, y: 70 },
  { x: 310, y: 220 }, { x: 420, y: 140 }, { x: 380, y: 250 },
  { x: 350, y: 50 },  { x: 395, y: 200 },
];

function dist(a: Pt, b: Pt) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

const TOTAL_STEPS = 7;

/* ═══════════════ MAIN ═══════════════ */
export default function KnnTopic() {
  const [k, setK] = useState(3);
  const [query, setQuery] = useState<Pt>({ x: 250, y: 150 });
  const [dragging, setDragging] = useState(false);

  const allPoints = useMemo(() => [
    ...CLASS_A.map((p) => ({ ...p, cls: "A" as const })),
    ...CLASS_B.map((p) => ({ ...p, cls: "B" as const })),
  ], []);

  const sorted = useMemo(() =>
    allPoints.map((p) => ({ ...p, d: dist(p, query) })).sort((a, b) => a.d - b.d),
  [allPoints, query]);

  const neighbors = useMemo(() => sorted.slice(0, k), [sorted, k]);

  const prediction = useMemo(() => {
    const countA = neighbors.filter((n) => n.cls === "A").length;
    const countB = neighbors.filter((n) => n.cls === "B").length;
    return countA > countB ? "A" : countB > countA ? "B" : "?";
  }, [neighbors]);

  const kRadius = useMemo(() =>
    neighbors.length > 0 ? neighbors[neighbors.length - 1].d : 0,
  [neighbors]);

  const handlePointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    setQuery({
      x: Math.max(10, Math.min(490, (e.clientX - rect.left) * (500 / rect.width))),
      y: Math.max(10, Math.min(290, (e.clientY - rect.top) * (300 / rect.height))),
    });
  }, [dragging]);

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "KNN có giai đoạn 'huấn luyện' không?",
      options: [
        "Có — tính toán trọng số cho mỗi feature",
        "Không — chỉ lưu dữ liệu, tính khoảng cách khi dự đoán (lazy learning)",
        "Có — xây cấu trúc cây để tìm nhanh",
      ],
      correct: 1,
      explanation: "KNN là 'lazy learner' — không học gì lúc train, chỉ lưu toàn bộ dữ liệu. Khi cần dự đoán mới tính khoảng cách đến tất cả điểm → chậm với dữ liệu lớn!",
    },
    {
      question: "K = 1 vs K = tổng số điểm. Trường hợp nào tốt hơn?",
      options: [
        "K = 1 luôn tốt hơn vì chính xác nhất",
        "K = tổng luôn tốt hơn vì dùng nhiều thông tin",
        "Cả hai đều tệ — K = 1 overfitting, K = tổng luôn chọn lớp đa số",
      ],
      correct: 2,
      explanation: "K = 1: mỗi điểm ảnh hưởng duy nhất → nhạy noise (overfitting). K = N: mọi điểm đều là neighbor → luôn trả lớp đa số (underfitting). Cần K vừa phải!",
    },
    {
      question: "Feature 'diện tích nhà' (30-200 m²) và 'số phòng' (1-5). KNN cho kết quả sai. Tại sao?",
      options: [
        "KNN không xử lý được 2 features",
        "Diện tích có thang lớn hơn → áp đảo khoảng cách. Cần chuẩn hoá!",
        "Cần dùng khoảng cách Manhattan thay vì Euclidean",
      ],
      correct: 1,
      explanation: "Diện tích: 30-200 → chênh lệch ~170. Số phòng: 1-5 → chênh lệch ~4. Khoảng cách Euclidean bị diện tích chi phối! StandardScaler đưa cả hai về thang [0,1].",
    },
    {
      type: "fill-blank",
      question: "KNN là thuật toán {blank} — không có giai đoạn học, chỉ lưu dữ liệu và tính khoảng cách khi cần dự đoán. Điều này khiến KNN {blank} với tập dữ liệu lớn.",
      blanks: [
        { answer: "lazy learning", accept: ["lười học", "lazy", "không học"] },
        { answer: "chậm", accept: ["tốn thời gian", "kém hiệu quả", "không hiệu quả"] },
      ],
      explanation: "KNN là 'lazy learner': thay vì xây mô hình trong giai đoạn train, nó chỉ lưu toàn bộ dữ liệu. Khi có điểm mới, phải tính khoảng cách đến TẤT CẢ n điểm → O(n·d) mỗi dự đoán. Với 1 triệu điểm, điều này rất chậm — cần KD-tree hoặc Approximate Nearest Neighbor.",
    },
  ], []);

  const spring = { type: "spring" as const, stiffness: 150, damping: 18 };

  return (
    <>
      {/* STEP 1: PREDICTION GATE */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn mới chuyển đến phố lạ, muốn tìm quán bún bò ngon. Hỏi 1 người → có thể sai. Hỏi 5 người gần nhất → đa số nói quán nào? Đó chính là cách máy tính phân loại!"
          options={[
            "Hỏi 1 người gần nhất — nhanh và chính xác",
            "Hỏi 5 người gần nhất rồi nghe đa số — giảm rủi ro sai",
            "Hỏi tất cả mọi người — càng nhiều càng tốt",
          ]}
          correct={1}
          explanation="Hỏi 5 người gần nhất rồi bỏ phiếu — K=5 trong KNN! Hỏi 1 người quá ít (nhạy noise), hỏi tất cả quá nhiều (bị lớp đa số áp đảo). K vừa phải là chìa khoá."
        >

      {/* STEP 2: INTERACTIVE VIZ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Kéo <strong className="text-foreground">hình thoi vàng</strong>{" "}
          đến vị trí bất kỳ — KNN tìm K láng giềng gần nhất và bỏ phiếu. Thay đổi K bằng thanh trượt.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            <svg
              viewBox="0 0 500 300"
              className="w-full rounded-lg border border-border bg-background touch-none"
              onPointerMove={handlePointerMove}
              onPointerUp={() => setDragging(false)}
              onPointerLeave={() => setDragging(false)}
            >
              {/* K-radius circle */}
              <motion.circle
                cx={query.x} cy={query.y} r={kRadius}
                fill="none" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 3" opacity={0.35}
                animate={{ cx: query.x, cy: query.y, r: kRadius }}
                transition={spring}
              />

              {/* Connection lines to neighbors */}
              {neighbors.map((n, i) => (
                <motion.line
                  key={`ln-${i}`}
                  x1={query.x} y1={query.y} x2={n.x} y2={n.y}
                  stroke={n.cls === "A" ? "#3b82f6" : "#ef4444"}
                  strokeWidth={2} strokeDasharray="4 3" opacity={0.5}
                  animate={{ x1: query.x, y1: query.y, x2: n.x, y2: n.y }}
                  transition={spring}
                />
              ))}

              {/* All data points */}
              {allPoints.map((p, i) => {
                const isNeighbor = neighbors.some((n) => n.x === p.x && n.y === p.y);
                return (
                  <circle
                    key={`pt-${i}`} cx={p.x} cy={p.y}
                    r={isNeighbor ? 7 : 5}
                    fill={p.cls === "A" ? "#3b82f6" : "#ef4444"}
                    stroke={isNeighbor ? "#fbbf24" : "#fff"}
                    strokeWidth={isNeighbor ? 2.5 : 1.5}
                  />
                );
              })}

              {/* Distance labels on neighbor connections */}
              {neighbors.map((n, i) => {
                const mx = (query.x + n.x) / 2;
                const my = (query.y + n.y) / 2;
                return (
                  <text key={`d-${i}`} x={mx} y={my - 5} fontSize={8}
                    fill={n.cls === "A" ? "#3b82f6" : "#ef4444"} textAnchor="middle" fontWeight={600}>
                    {n.d.toFixed(0)}
                  </text>
                );
              })}

              {/* Query point (diamond) */}
              <motion.polygon
                points={`${query.x},${query.y - 12} ${query.x + 9},${query.y} ${query.x},${query.y + 12} ${query.x - 9},${query.y}`}
                fill="#f59e0b" stroke="#fff" strokeWidth={2}
                className="cursor-grab"
                onPointerDown={() => setDragging(true)}
                animate={{ points: `${query.x},${query.y - 12} ${query.x + 9},${query.y} ${query.x},${query.y + 12} ${query.x - 9},${query.y}` }}
                transition={spring}
              />

              {/* Result box */}
              <rect
                x={360} y={5} width={135} height={50} rx={10}
                fill={prediction === "A" ? "#3b82f6" : prediction === "B" ? "#ef4444" : "#888"} opacity={0.12}
                stroke={prediction === "A" ? "#3b82f6" : prediction === "B" ? "#ef4444" : "#888"} strokeWidth={1.5}
              />
              <text x={427} y={25} fontSize={13}
                fill={prediction === "A" ? "#3b82f6" : prediction === "B" ? "#ef4444" : "#888"}
                textAnchor="middle" fontWeight={700}>
                Dự đoán: Lớp {prediction}
              </text>
              <text x={427} y={45} fontSize={9} fill="currentColor" className="text-muted" textAnchor="middle">
                A: {neighbors.filter((n) => n.cls === "A").length} | B: {neighbors.filter((n) => n.cls === "B").length} trong K={k}
              </text>
            </svg>

            {/* K slider */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-foreground">K =</label>
              <input
                type="range" min={1} max={9} value={k}
                onChange={(e) => setK(Number(e.target.value))}
                className="flex-1 accent-amber-500"
              />
              <span className="w-6 text-center text-sm font-bold text-amber-500">{k}</span>
            </div>

            {/* Quick K comparison */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              {[1, 3, 7].map((kv) => {
                const n = allPoints.map((p) => ({ ...p, d: dist(p, query) })).sort((a, b) => a.d - b.d).slice(0, kv);
                const cA = n.filter((x) => x.cls === "A").length;
                const pred = cA > kv / 2 ? "A" : "B";
                return (
                  <div key={kv} className={`rounded-lg border p-2 ${kv === k ? "border-amber-400 bg-amber-50 dark:bg-amber-900/10" : "border-border"}`}>
                    <div className="font-bold" style={{ color: kv === k ? "#f59e0b" : undefined }}>K={kv}</div>
                    <div className="text-muted">→ Lớp {pred}</div>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-muted">
              Viền vàng = K láng giềng được chọn. Thử kéo điểm truy vấn vào giữa hai nhóm — K khác nhau cho kết quả khác!
            </p>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* STEP 3: AHA */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>KNN</strong>{" "}
            cực kỳ đơn giản: tìm K điểm gần nhất → bỏ phiếu đa số. Không cần &quot;học&quot; gì cả — chỉ cần nhớ dữ liệu và tính khoảng cách. Đơn giản mà hiệu quả!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* STEP 4: CHALLENGE */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Dữ liệu có 1 triệu điểm, 100 features. KNN có vấn đề gì?"
          options={[
            "Không vấn đề — KNN xử lý tốt mọi kích thước",
            "Chậm (so khoảng cách 1M điểm) + curse of dimensionality (100 chiều → khoảng cách mất ý nghĩa)",
            "Quá nhiều features → overfitting",
          ]}
          correct={1}
          explanation="Hai vấn đề: (1) Tính khoảng cách 1M × 100 rất chậm — cần KD-tree hoặc ANN (Approximate NN). (2) 100 chiều → mọi điểm gần giống nhau → K neighbors không còn 'gần' thật sự."
        />
      </LessonSection>

      {/* STEP 5: EXPLANATION */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>KNN</strong>{" "}
            là thuật toán <strong>lazy learning</strong>{" "}
            — không có giai đoạn huấn luyện. Khi cần dự đoán điểm mới <LaTeX>{"\\mathbf{x}"}</LaTeX>:
          </p>

          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li>Tính khoảng cách từ <LaTeX>{"\\mathbf{x}"}</LaTeX> đến tất cả điểm dữ liệu</li>
            <li>Chọn K điểm gần nhất</li>
            <li>Bỏ phiếu đa số (phân loại) hoặc trung bình (hồi quy)</li>
          </ol>

          <p><strong>Khoảng cách phổ biến:</strong></p>

          <LaTeX block>{"d_{\\text{Euclidean}}(x, z) = \\sqrt{\\sum_{j=1}^{d}(x_j - z_j)^2}"}</LaTeX>
          <LaTeX block>{"d_{\\text{Manhattan}}(x, z) = \\sum_{j=1}^{d}|x_j - z_j|"}</LaTeX>

          <Callout variant="tip" title="Chọn K bao nhiêu?">
            K nhỏ (1-3): ranh giới phức tạp, nhạy noise →{" "}
            <TopicLink slug="overfitting-underfitting">overfitting</TopicLink>.{"\n"}
            K lớn: ranh giới mượt → có thể underfitting. Hiểu rõ{" "}
            <TopicLink slug="bias-variance">đánh đổi bias-variance</TopicLink>{" "}
            giúp chọn K tốt hơn.{"\n"}
            Thường dùng <TopicLink slug="cross-validation">kiểm định chéo</TopicLink>{" "}
            để chọn K. Mẹo: K lẻ tránh hoà phiếu!
          </Callout>

          <p><strong>Weighted KNN:</strong>{" "}Thay vì mỗi neighbor 1 phiếu, trọng số theo khoảng cách:</p>

          <LaTeX block>{"w_i = \\frac{1}{d(\\mathbf{x}, \\mathbf{x}_i)^2}"}</LaTeX>

          <p>Điểm gần hơn có ảnh hưởng lớn hơn — thường cải thiện accuracy.</p>

          <CodeBlock language="python" title="KNN với scikit-learn">
{`from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.model_selection import cross_val_score

# QUAN TRỌNG: Chuẩn hoá trước KNN!
model = make_pipeline(
    StandardScaler(),
    KNeighborsClassifier(
        n_neighbors=5,
        weights="distance",    # Weighted KNN
        metric="euclidean",
    )
)

from sklearn.datasets import load_iris
X, y = load_iris(return_X_y=True)

scores = cross_val_score(model, X, y, cv=5)
print(f"KNN (K=5) accuracy: {scores.mean():.1%}")

# Tìm K tối ưu
for k in [1, 3, 5, 7, 9]:
    m = make_pipeline(StandardScaler(), KNeighborsClassifier(k, weights="distance"))
    s = cross_val_score(m, X, y, cv=5).mean()
    print(f"  K={k}: {s:.1%}")`}
          </CodeBlock>

          <p>
            Ngoài ra, cần chú ý kỹ thuật{" "}
            <TopicLink slug="feature-engineering">feature engineering</TopicLink>{" "}
            để chọn và biến đổi features trước khi đưa vào KNN — đặc biệt quan trọng vì KNN nhạy cảm với thang đo.
          </p>

          <Callout variant="warning" title="Curse of Dimensionality">
            Ở chiều cao (100+ features), mọi điểm gần như cách đều nhau → khái niệm &quot;gần nhất&quot; mất ý nghĩa. Giải pháp: giảm chiều (PCA), chọn features, hoặc dùng thuật toán khác.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* STEP 6: SUMMARY */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "KNN: tìm K điểm gần nhất → bỏ phiếu đa số. Lazy learning — không train, chỉ lưu dữ liệu.",
          "K nhỏ → nhạy noise (overfitting). K lớn → quá mượt (underfitting). Dùng cross-validation chọn K.",
          "LUÔN chuẩn hoá dữ liệu (StandardScaler) — features có thang khác nhau sẽ lệch khoảng cách.",
          "Weighted KNN: điểm gần hơn có trọng số cao hơn → thường tốt hơn uniform voting.",
          "Hạn chế: chậm với dữ liệu lớn, curse of dimensionality ở chiều cao.",
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
