"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
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
  TabView,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "supervised-unsupervised-rl",
  title: "Learning Paradigms",
  titleVi: "Ba mô hình học — Có giám sát, Không giám sát, Tăng cường",
  description:
    "Ba cách tiếp cận cơ bản trong học máy: học từ nhãn, học từ cấu trúc, và học từ phần thưởng.",
  category: "foundations",
  tags: ["supervised", "unsupervised", "reinforcement-learning"],
  difficulty: "beginner",
  relatedSlugs: ["train-val-test", "data-preprocessing", "neural-network-overview"],
  vizType: "interactive",
};

const TOTAL_STEPS = 7;

// ---------------------------------------------------------------------------
// Dữ liệu mô phỏng: scatter plot 2 lớp cho cả Supervised và Unsupervised
// ---------------------------------------------------------------------------
interface DataPoint {
  x: number;
  y: number;
  label: 0 | 1;
}

const DATA_POINTS: DataPoint[] = [
  // Lớp 0 (góc dưới-trái): "Cam"
  { x: 90, y: 200, label: 0 },
  { x: 110, y: 220, label: 0 },
  { x: 80, y: 240, label: 0 },
  { x: 130, y: 210, label: 0 },
  { x: 100, y: 260, label: 0 },
  { x: 150, y: 230, label: 0 },
  { x: 70, y: 215, label: 0 },
  { x: 120, y: 195, label: 0 },
  { x: 160, y: 255, label: 0 },
  { x: 95, y: 275, label: 0 },
  { x: 140, y: 265, label: 0 },
  { x: 115, y: 245, label: 0 },
  // Lớp 1 (góc trên-phải): "Táo"
  { x: 350, y: 80, label: 1 },
  { x: 380, y: 110, label: 1 },
  { x: 410, y: 90, label: 1 },
  { x: 340, y: 130, label: 1 },
  { x: 420, y: 120, label: 1 },
  { x: 360, y: 100, label: 1 },
  { x: 390, y: 70, label: 1 },
  { x: 400, y: 140, label: 1 },
  { x: 370, y: 60, label: 1 },
  { x: 430, y: 105, label: 1 },
  { x: 355, y: 95, label: 1 },
  { x: 405, y: 125, label: 1 },
];

// ---------------------------------------------------------------------------
// Grid world cho Reinforcement Learning
// ---------------------------------------------------------------------------
type Cell = "empty" | "agent" | "goal" | "pit";

const GRID_ROWS = 5;
const GRID_COLS = 6;

interface GridCell {
  row: number;
  col: number;
  type: Cell;
}

const BASE_GRID: GridCell[] = (() => {
  const cells: GridCell[] = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      let type: Cell = "empty";
      if (r === 2 && c === 3) type = "pit";
      if (r === 1 && c === 4) type = "pit";
      if (r === 4 && c === 5) type = "goal";
      if (r === 0 && c === 0) type = "agent";
      cells.push({ row: r, col: c, type });
    }
  }
  return cells;
})();

// Đường đi tối ưu (đã học) từ (0,0) tới goal (4,5)
const OPTIMAL_TRAIL: Array<[number, number]> = [
  [0, 0],
  [0, 1],
  [1, 1],
  [2, 1],
  [3, 1],
  [3, 2],
  [4, 2],
  [4, 3],
  [4, 4],
  [4, 5],
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function LearningParadigmsTopic() {
  const [activeStep, setActiveStep] = useState(1);

  const stepLabels = useMemo(
    () => [
      "Dự đoán",
      "Khám phá",
      "Aha",
      "Thử thách",
      "Lý thuyết",
      "Tóm tắt",
      "Kiểm tra",
    ],
    []
  );

  // ---------------- SUPERVISED TAB STATE ----------------
  const [showBoundary, setShowBoundary] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [testPoint, setTestPoint] = useState<{ x: number; y: number } | null>(
    null
  );

  const handleScatterClick = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      const svg = event.currentTarget;
      const rect = svg.getBoundingClientRect();
      const scaleX = 500 / rect.width;
      const scaleY = 320 / rect.height;
      const x = (event.clientX - rect.left) * scaleX;
      const y = (event.clientY - rect.top) * scaleY;
      if (x < 30 || x > 480 || y < 30 || y > 300) return;
      setTestPoint({ x, y });
    },
    []
  );

  // Quyết định nhãn cho điểm test bằng đường biên (đường chéo đơn giản)
  const predictedLabel = useMemo(() => {
    if (!testPoint) return null;
    // Boundary: y = -x + 420 → ở trên = táo (1), ở dưới = cam (0)
    return testPoint.y < -testPoint.x + 420 ? 1 : 0;
  }, [testPoint]);

  // ---------------- UNSUPERVISED TAB STATE ----------------
  const [numClusters, setNumClusters] = useState(2);
  const [clustersRevealed, setClustersRevealed] = useState(false);

  // Gán cluster bằng khoảng cách thô — demo K-means
  const clusterCenters = useMemo(() => {
    if (numClusters === 2) {
      return [
        { x: 110, y: 230 },
        { x: 385, y: 100 },
      ];
    }
    if (numClusters === 3) {
      return [
        { x: 95, y: 215 },
        { x: 135, y: 260 },
        { x: 385, y: 100 },
      ];
    }
    return [
      { x: 90, y: 210 },
      { x: 140, y: 255 },
      { x: 360, y: 90 },
      { x: 405, y: 125 },
    ];
  }, [numClusters]);

  const assignedClusters = useMemo(() => {
    return DATA_POINTS.map((p) => {
      let best = 0;
      let bestDist = Infinity;
      clusterCenters.forEach((c, i) => {
        const d = (p.x - c.x) ** 2 + (p.y - c.y) ** 2;
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      return best;
    });
  }, [clusterCenters]);

  const clusterColors = ["#22c55e", "#3b82f6", "#f59e0b", "#ec4899"];

  // ---------------- RL TAB STATE ----------------
  const [rlStep, setRlStep] = useState(0);
  const [rlMode, setRlMode] = useState<"random" | "learned">("learned");

  const rlTrail = useMemo(() => {
    if (rlMode === "learned") {
      return OPTIMAL_TRAIL.slice(0, rlStep + 1);
    }
    // "Random" mode — đường đi lộn xộn ban đầu
    const randomPath: Array<[number, number]> = [
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1],
      [2, 2],
      [1, 2],
      [1, 3],
      [2, 3], // rơi vào pit!
    ];
    return randomPath.slice(0, rlStep + 1);
  }, [rlStep, rlMode]);

  const currentAgentPos = rlTrail[rlTrail.length - 1] ?? [0, 0];
  const cumulativeReward = useMemo(() => {
    let reward = 0;
    rlTrail.forEach(([r, c], i) => {
      if (i === 0) return;
      const cell = BASE_GRID.find((cc) => cc.row === r && cc.col === c);
      if (cell?.type === "pit") reward -= 10;
      else if (cell?.type === "goal") reward += 10;
      else reward -= 1; // step cost
    });
    return reward;
  }, [rlTrail]);

  const advanceRL = useCallback(() => {
    setRlStep((s) => Math.min(s + 1, OPTIMAL_TRAIL.length - 1));
  }, []);
  const resetRL = useCallback(() => setRlStep(0), []);

  // -------------------- QUIZ --------------------
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "Bạn có 10.000 ảnh chó và mèo ĐÃ ĐƯỢC GẮN NHÃN. Mô hình học nào phù hợp?",
        options: [
          "Supervised Learning — có nhãn (chó/mèo) cho mỗi ảnh → học mapping input→label",
          "Unsupervised Learning — tìm nhóm tự nhiên",
          "Reinforcement Learning — học bằng thử-và-sai",
        ],
        correct: 0,
        explanation:
          "Có data + có nhãn (labels) → Supervised Learning. Model học: ảnh này có đặc điểm gì → label là 'chó' hay 'mèo'. Giống học với giáo viên: giáo viên cho đáp án đúng, học sinh học cách tự trả lời.",
      },
      {
        question:
          "Shopee muốn nhóm 50 triệu user thành các phân khúc khách hàng. KHÔNG có nhãn sẵn. Dùng gì?",
        options: [
          "Supervised Learning",
          "Unsupervised Learning — clustering tìm nhóm tự nhiên dựa trên hành vi mua sắm",
          "Reinforcement Learning",
        ],
        correct: 1,
        explanation:
          "Không có nhãn → Unsupervised. K-means hoặc DBSCAN phân nhóm user dựa trên features: tần suất mua, giờ mua, giá trung bình, danh mục.",
      },
      {
        question:
          "Grab cần tối ưu đường đi cho tài xế. Mỗi quãng đường mất thời gian khác nhau, không biết trước. Dùng gì?",
        options: [
          "Supervised Learning — học từ data đường đi cũ",
          "Unsupervised Learning — nhóm các tuyến đường",
          "Reinforcement Learning — thử nhiều tuyến, nhận reward (nhanh) hoặc penalty (kẹt)",
        ],
        correct: 2,
        explanation:
          "Môi trường thay đổi (giao thông), không có 'đáp án đúng' cố định → RL. Agent thử hành động, nhận reward, dần học chính sách tối ưu.",
      },
      {
        type: "fill-blank",
        question:
          "Supervised Learning cần dữ liệu có {blank}, trong khi Unsupervised Learning chỉ cần {blank} thô không có chú thích.",
        blanks: [
          { answer: "nhãn", accept: ["label", "labels", "đáp án", "nhãn (label)"] },
          { answer: "dữ liệu", accept: ["data", "input"] },
        ],
        explanation:
          "Supervised cần mỗi mẫu dữ liệu có nhãn (label). Unsupervised chỉ cần dữ liệu thô — model tự tìm cấu trúc ẩn.",
      },
      {
        question:
          "K-means là thuật toán điển hình của paradigm nào? Nó hoạt động thế nào?",
        options: [
          "Supervised — học hàm phân loại từ nhãn có sẵn",
          "Unsupervised — phân nhóm điểm dữ liệu quanh K tâm (centroid) mà không cần nhãn",
          "Reinforcement — tối đa hoá reward khi phân nhóm",
        ],
        correct: 1,
        explanation:
          "K-means: (1) khởi tạo K tâm ngẫu nhiên, (2) gán mỗi điểm vào tâm gần nhất, (3) cập nhật tâm = trung bình các điểm thuộc cụm, (4) lặp lại. Không cần label → Unsupervised.",
      },
      {
        question:
          "Trong RL, discount factor γ (gamma) dùng để làm gì?",
        options: [
          "Làm nhỏ học suất (learning rate)",
          "Đánh trọng số phần thưởng tương lai — γ gần 0 = chỉ quan tâm hiện tại, γ gần 1 = nhìn xa hơn",
          "Tăng độ chính xác của mô hình",
        ],
        correct: 1,
        explanation:
          "γ quyết định agent 'nhìn xa' bao nhiêu. Reward ở bước t được nhân với γ^t. γ = 0.99 cho long-horizon tasks (cờ vua), γ = 0.9 cho short tasks (arcade).",
      },
      {
        question:
          "Semi-supervised learning phù hợp với tình huống nào?",
        options: [
          "Có nhiều labeled data, không có unlabeled data",
          "Có ít labeled data + nhiều unlabeled data — train trên labeled, pseudo-label cho unlabeled, retrain",
          "Hoàn toàn không có data",
        ],
        correct: 1,
        explanation:
          "Labeling đắt. Semi-supervised tận dụng unlabeled data (cheap, nhiều) cùng ít labeled data (đắt, ít) → accuracy tốt hơn supervised thuần trên cùng lượng labeled.",
      },
      {
        question:
          "RLHF (Reinforcement Learning from Human Feedback) giúp ChatGPT như thế nào?",
        options: [
          "Giúp mô hình học ngôn ngữ từ đầu",
          "Căn chỉnh (align) mô hình với sở thích con người: con người xếp hạng câu trả lời → reward model → fine-tune bằng RL",
          "Thay thế hoàn toàn pre-training",
        ],
        correct: 1,
        explanation:
          "RLHF = (1) con người xếp hạng cặp câu trả lời, (2) train reward model dự đoán xếp hạng đó, (3) dùng reward model làm tín hiệu RL fine-tune LLM. Kết quả: LLM trả lời hữu ích và an toàn hơn.",
      },
    ],
    []
  );

  // -------------------- RENDER --------------------
  return (
    <>
      <div className="mb-6">
        <ProgressSteps current={activeStep} total={TOTAL_STEPS} labels={stepLabels} />
      </div>

      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Trẻ em học nói bằng cách nào? Bố mẹ nói 'đây là con chó' (chỉ vào chó), trẻ nghe nhiều lần rồi tự nhận biết. Đây giống paradigm ML nào?"
          options={[
            "Supervised Learning — có 'nhãn' (bố mẹ nói tên) cho mỗi 'input'",
            "Unsupervised Learning — trẻ tự học không cần chỉ dẫn",
            "Reinforcement Learning — trẻ thử-và-sai",
          ]}
          correct={0}
          explanation="Đúng! Bố mẹ = giáo viên, 'con chó' = label, hình ảnh chó = input. Trẻ học mapping: thấy con vật 4 chân + sủa → 'chó'. Đây chính là Supervised Learning! Nhưng trẻ còn học kiểu khác: tự nhóm đồ vật (unsupervised) và học đi bằng thử-và-ngã (RL)."
        >
          <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
            <p
              className="mb-4 text-sm text-muted leading-relaxed"
              onFocus={() => setActiveStep(2)}
            >
              Mỗi tab dưới đây tương ứng với một paradigm. Hãy tương tác với từng
              tab để cảm nhận <strong className="text-foreground">sự khác biệt cốt lõi</strong>{" "}
              giữa ba cách học — nhãn, cấu trúc, và phần thưởng.
            </p>

            <VisualizationSection>
              <TabView
                tabs={[
                  {
                    label: "Học có giám sát",
                    content: (
                      <SupervisedTab
                        showBoundary={showBoundary}
                        setShowBoundary={setShowBoundary}
                        showLabels={showLabels}
                        setShowLabels={setShowLabels}
                        testPoint={testPoint}
                        predictedLabel={predictedLabel}
                        onScatterClick={handleScatterClick}
                        onReset={() => setTestPoint(null)}
                      />
                    ),
                  },
                  {
                    label: "Học không giám sát",
                    content: (
                      <UnsupervisedTab
                        numClusters={numClusters}
                        setNumClusters={setNumClusters}
                        clustersRevealed={clustersRevealed}
                        setClustersRevealed={setClustersRevealed}
                        assignedClusters={assignedClusters}
                        clusterCenters={clusterCenters}
                        clusterColors={clusterColors}
                      />
                    ),
                  },
                  {
                    label: "Học tăng cường",
                    content: (
                      <ReinforcementTab
                        trail={rlTrail}
                        agentPos={currentAgentPos}
                        mode={rlMode}
                        setMode={setRlMode}
                        onStep={advanceRL}
                        onReset={resetRL}
                        reward={cumulativeReward}
                        stepNumber={rlStep}
                      />
                    ),
                  },
                ]}
              />
            </VisualizationSection>

            <Callout variant="info" title="Gợi ý tương tác">
              Supervised: bấm vào scatter plot để đặt 1 điểm thử, xem mô hình phân
              loại nó như thế nào. Unsupervised: đổi số cụm K rồi bấm 'Chạy
              K-means'. RL: chuyển giữa chế độ 'ngẫu nhiên' và 'đã học', bấm 'Bước
              tiếp' để xem agent di chuyển.
            </Callout>
          </LessonSection>

          <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
            <AhaMoment>
              <p>
                Ba paradigms giống <strong>ba cách học của con người</strong>:
                Supervised = học với giáo viên (có đáp án). Unsupervised = tự khám
                phá (sắp xếp đồ chơi). RL = học bằng thử-và-sai (tập đi xe đạp —
                ngã thì biết sai). Mỗi bài toán cần paradigm phù hợp —{" "}
                <strong>không có cách nào tốt nhất cho MỌI trường hợp!</strong>
              </p>
            </AhaMoment>
          </LessonSection>

          <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
            <InlineChallenge
              question="FPT AI cần phân loại email nội bộ thành 5 phòng ban. Có 500 email ĐÃ GẮN NHÃN + 50.000 email CHƯA GẮN. Dùng phương pháp nào?"
              options={[
                "Chỉ dùng Supervised trên 500 email có nhãn",
                "Semi-supervised: train trên 500, pseudo-label 50K, train lại",
                "Chỉ dùng Unsupervised trên 50K",
              ]}
              correct={1}
              explanation="Semi-supervised = kết hợp tốt nhất của hai thế giới! 500 labels quá ít cho supervised 5 lớp. (1) train initial model, (2) model dự đoán 50K, (3) giữ confident predictions làm pseudo-labels, (4) retrain. Accuracy tăng 15-25%."
            />

            <div className="mt-4">
              <InlineChallenge
                question="Một công ty game muốn AI tự chơi Mario và đạt điểm cao. KHÔNG có ai đánh dấu 'hành động đúng' từng bước. Dùng gì?"
                options={[
                  "Supervised Learning",
                  "Unsupervised Learning",
                  "Reinforcement Learning — reward = điểm số, action = phím bấm",
                ]}
                correct={2}
                explanation="Không có 'label' cho mỗi frame — chỉ có điểm số cuối cùng làm tín hiệu. RL phù hợp: agent thử nhiều action, điểm số = reward, tự tìm ra chính sách tối ưu. Đây chính là cách DeepMind huấn luyện AI chơi Atari."
              />
            </div>
          </LessonSection>

          <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
            <ExplanationSection>
              <p>
                <strong>Ba paradigm học máy cơ bản</strong> định nghĩa cách model
                học từ dữ liệu — mỗi paradigm phù hợp cho loại bài toán khác nhau.
              </p>

              <p>
                <strong>1. Supervised Learning</strong> — có input và label:{" "}
                <TopicLink slug="linear-regression">hồi quy tuyến tính</TopicLink>{" "}
                (dự đoán giá trị liên tục) và{" "}
                <TopicLink slug="logistic-regression">hồi quy logistic</TopicLink>{" "}
                (phân loại).
              </p>
              <LaTeX block>
                {
                  "\\min_\\theta \\sum_{i=1}^{N} \\mathcal{L}(f_\\theta(x_i), y_i) \\quad \\text{(có input } x_i \\text{ và label } y_i \\text{)}"
                }
              </LaTeX>

              <p>
                <strong>2. Unsupervised Learning</strong> — chỉ có input:{" "}
                <TopicLink slug="k-means">K-means clustering</TopicLink> phân nhóm
                dữ liệu không nhãn.
              </p>
              <LaTeX block>
                {
                  "\\min_\\theta \\mathcal{L}(f_\\theta(X)) \\quad \\text{(chỉ có input } X \\text{, không có label)}"
                }
              </LaTeX>

              <p>
                <strong>3. Reinforcement Learning</strong> — agent học chính sách
                tối ưu theo reward. Ngoài ra{" "}
                <TopicLink slug="decision-trees">cây quyết định</TopicLink> là ví
                dụ trực quan của supervised.
              </p>
              <LaTeX block>
                {
                  "\\max_\\pi \\mathbb{E}\\left[\\sum_{t=0}^{T} \\gamma^t r(s_t, a_t)\\right] \\quad \\text{(tối ưu chính sách } \\pi \\text{ theo reward)}"
                }
              </LaTeX>

              <Callout variant="tip" title="Self-Supervised Learning">
                Xu hướng hiện đại: Self-Supervised = tự tạo labels từ chính data.
                GPT mask token tiếp theo, tự dự đoán. BERT mask random tokens, tự
                điền. Kết hợp ưu điểm Supervised (có 'label') và Unsupervised
                (không cần human annotation). Đây là cách GPT-4, Claude, Llama
                được train!
              </Callout>

              <Callout variant="warning" title="Bẫy phổ biến">
                Nhiều người nghĩ 'data càng nhiều càng tốt'. Nhưng trong Supervised,
                chất lượng nhãn quan trọng hơn số lượng. 10.000 ảnh dán nhãn cẩu
                thả có thể tệ hơn 1.000 ảnh được gắn cẩn thận. Trong RL, 'reward
                shaping' sai có thể khiến agent học hành vi kỳ lạ (reward hacking).
              </Callout>

              <Callout variant="tip" title="Khi nào RL vượt trội?">
                RL toả sáng khi: (1) môi trường tương tác (game, robot), (2)
                feedback chậm và thưa (điểm cuối trận), (3) không có 'đáp án đúng'
                cố định (cờ vua có thể có nhiều nước đi tốt). Nó yếu khi cần dữ
                liệu lớn và môi trường mô phỏng không chính xác.
              </Callout>

              <Callout variant="info" title="Ma trận quyết định nhanh">
                Có nhãn → Supervised. Không nhãn → Unsupervised. Có môi trường
                tương tác và reward → RL. Có ít nhãn + nhiều data thô →
                Semi-supervised. Muốn pretrain cho task khác → Self-supervised.
              </Callout>

              <CodeBlock language="python" title="3 paradigms với scikit-learn">
                {`from sklearn.linear_model import LogisticRegression
from sklearn.cluster import KMeans
# RL: dùng gymnasium (không có trong sklearn)

# 1. SUPERVISED: Phân loại email spam
clf = LogisticRegression()
clf.fit(X_train, y_train)  # X=features, y=spam/not_spam
pred = clf.predict(X_test)

# 2. UNSUPERVISED: Nhóm khách hàng
kmeans = KMeans(n_clusters=5)
clusters = kmeans.fit_predict(X_customers)  # Chỉ có X, không có y
# Khách hàng được chia thành 5 nhóm tự nhiên

# 3. REINFORCEMENT LEARNING (Grab routing concept)
import gymnasium as gym
env = gym.make("Taxi-v3")
state, _ = env.reset()
for _ in range(100):
    action = agent.choose(state)      # Chọn hướng đi
    next_state, reward, done, _, _ = env.step(action)
    agent.learn(state, action, reward, next_state)
    state = next_state
    if done: break
# Agent học: hành động nào → reward cao (đến đích nhanh)`}
              </CodeBlock>

              <CodeBlock
                language="python"
                title="Q-learning tabular — tái hiện grid world trong tab 'Học tăng cường'"
              >
                {`import numpy as np

# Khởi tạo Q-table với tất cả số 0
# state: vị trí (row, col), action: 0=up, 1=down, 2=left, 3=right
Q = np.zeros((5, 6, 4))

ALPHA = 0.1      # learning rate
GAMMA = 0.95     # discount factor (nhìn tương lai)
EPSILON = 0.2    # exploration rate

def step(state, action, grid):
    r, c = state
    dr, dc = [(-1, 0), (1, 0), (0, -1), (0, 1)][action]
    nr, nc = max(0, min(4, r + dr)), max(0, min(5, c + dc))
    cell = grid[nr][nc]
    if cell == "pit":
        return (nr, nc), -10, True   # phạt khi rơi vào hố
    if cell == "goal":
        return (nr, nc), +10, True   # thưởng khi tới đích
    return (nr, nc), -1, False       # step cost khuyến khích đi ngắn

for episode in range(5000):
    state = (0, 0)
    done = False
    while not done:
        # Chiến lược ε-greedy: khám phá vs khai thác
        if np.random.rand() < EPSILON:
            action = np.random.randint(4)
        else:
            action = int(np.argmax(Q[state[0], state[1]]))

        next_state, reward, done = step(state, action, GRID)

        # Cập nhật Q theo Bellman
        best_next = np.max(Q[next_state[0], next_state[1]])
        Q[state[0], state[1], action] += ALPHA * (
            reward + GAMMA * best_next - Q[state[0], state[1], action]
        )
        state = next_state

# Sau khi train: greedy policy
def policy(state):
    return int(np.argmax(Q[state[0], state[1]]))`}
              </CodeBlock>

              <CollapsibleDetail title="Chi tiết: khi nào Supervised bị 'quá khớp'?">
                <p className="text-sm leading-relaxed mt-2">
                  Supervised có thể học thuộc lòng training set (high variance),
                  khiến hiệu năng trên data mới kém. Dấu hiệu: training accuracy
                  rất cao (99%+) nhưng validation accuracy thấp (70%). Cách xử lý:
                  (1) thêm dữ liệu, (2) regularization (L1/L2, dropout), (3) giảm
                  độ phức tạp model, (4) early stopping. Xem topic{" "}
                  <TopicLink slug="train-val-test">train/val/test split</TopicLink>{" "}
                  để học cách phát hiện overfit.
                </p>
              </CollapsibleDetail>

              <CollapsibleDetail title="Chi tiết: 'Hard Exploration' trong RL">
                <p className="text-sm leading-relaxed mt-2">
                  Trong game Montezuma's Revenge, reward rất thưa — có thể phải
                  chơi hàng ngàn bước mới nhận được điểm đầu tiên. Các thuật toán
                  RL cơ bản như DQN thất bại. Giải pháp: (1) curiosity-driven
                  exploration (thưởng cho state lạ), (2) hierarchical RL (chia
                  task thành sub-goal), (3) imitation learning (học từ demo của
                  người). Đây là hướng nghiên cứu rất sôi động hiện nay.
                </p>
              </CollapsibleDetail>
            </ExplanationSection>
          </LessonSection>

          <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
            <MiniSummary
              points={[
                "Supervised: có input + label → học mapping. Phân loại, hồi quy, dự đoán.",
                "Unsupervised: chỉ có input → tìm cấu trúc ẩn. Clustering, dimensionality reduction.",
                "RL: action + reward → học chính sách tối ưu. Game, routing, robot, RLHF.",
                "Self-supervised (xu hướng mới): tự tạo labels từ data — cách GPT/Claude được train.",
                "Semi-supervised: ít labels + nhiều unlabeled — tận dụng cả hai bằng pseudo-labeling.",
                "Chọn paradigm theo bài toán: có nhãn → supervised, không nhãn → unsupervised, môi trường động → RL.",
              ]}
            />
          </LessonSection>

          <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
            <QuizSection questions={quizQuestions} />
          </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}

// ---------------------------------------------------------------------------
// SUBCOMPONENTS
// ---------------------------------------------------------------------------
interface SupervisedTabProps {
  showBoundary: boolean;
  setShowBoundary: (v: boolean) => void;
  showLabels: boolean;
  setShowLabels: (v: boolean) => void;
  testPoint: { x: number; y: number } | null;
  predictedLabel: 0 | 1 | null;
  onScatterClick: (e: React.MouseEvent<SVGSVGElement>) => void;
  onReset: () => void;
}

function SupervisedTab({
  showBoundary,
  setShowBoundary,
  showLabels,
  setShowLabels,
  testPoint,
  predictedLabel,
  onScatterClick,
  onReset,
}: SupervisedTabProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          type="button"
          onClick={() => setShowLabels(!showLabels)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            showLabels
              ? "bg-accent text-white"
              : "bg-card border border-border text-muted"
          }`}
        >
          {showLabels ? "Ẩn nhãn" : "Hiện nhãn"}
        </button>
        <button
          type="button"
          onClick={() => setShowBoundary(!showBoundary)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            showBoundary
              ? "bg-accent text-white"
              : "bg-card border border-border text-muted"
          }`}
        >
          {showBoundary ? "Ẩn đường biên" : "Hiện đường biên"}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-card border border-border text-muted hover:text-foreground"
        >
          Xoá điểm thử
        </button>
      </div>

      <p className="text-xs text-muted text-center">
        Bấm vào biểu đồ để đặt điểm thử — mô hình sẽ phân loại theo đường biên đã
        học.
      </p>

      <svg
        viewBox="0 0 500 320"
        className="w-full max-w-2xl mx-auto cursor-crosshair rounded-lg bg-surface/40"
        onClick={onScatterClick}
      >
        {/* Axes */}
        <line x1={30} y1={300} x2={480} y2={300} stroke="#475569" strokeWidth={1} />
        <line x1={30} y1={30} x2={30} y2={300} stroke="#475569" strokeWidth={1} />
        <text x={255} y={315} textAnchor="middle" fill="#64748b" fontSize={9}>
          Đặc trưng 1 (độ tròn)
        </text>
        <text
          x={15}
          y={165}
          textAnchor="middle"
          fill="#64748b"
          fontSize={9}
          transform="rotate(-90 15 165)"
        >
          Đặc trưng 2 (màu sắc)
        </text>

        {/* Decision boundary: y = -x + 420 */}
        {showBoundary && (
          <motion.line
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            x1={120}
            y1={300}
            x2={480}
            y2={-60 + 0}
            stroke="#a855f7"
            strokeWidth={2}
            strokeDasharray="6 4"
          />
        )}

        {/* Data points */}
        {DATA_POINTS.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={6}
            fill={
              showLabels
                ? p.label === 0
                  ? "#f59e0b"
                  : "#ef4444"
                : "#94a3b8"
            }
            stroke="#0f172a"
            strokeWidth={1}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.015, duration: 0.25 }}
          />
        ))}

        {/* Test point */}
        {testPoint && (
          <>
            <motion.circle
              cx={testPoint.x}
              cy={testPoint.y}
              r={10}
              fill="none"
              stroke="#22d3ee"
              strokeWidth={2}
              initial={{ scale: 0.3 }}
              animate={{ scale: 1 }}
            />
            <circle
              cx={testPoint.x}
              cy={testPoint.y}
              r={5}
              fill={predictedLabel === 1 ? "#ef4444" : "#f59e0b"}
            />
            <text
              x={testPoint.x + 14}
              y={testPoint.y + 3}
              fontSize={10}
              fill="#22d3ee"
              fontWeight="bold"
            >
              Dự đoán: {predictedLabel === 1 ? "Táo" : "Cam"}
            </text>
          </>
        )}

        {/* Legend */}
        <g transform="translate(340, 40)">
          <rect
            x={0}
            y={0}
            width={140}
            height={55}
            rx={6}
            fill="#0f172a"
            opacity={0.7}
          />
          <circle cx={14} cy={18} r={5} fill="#f59e0b" />
          <text x={26} y={22} fill="#e2e8f0" fontSize={10}>
            Cam (nhãn 0)
          </text>
          <circle cx={14} cy={38} r={5} fill="#ef4444" />
          <text x={26} y={42} fill="#e2e8f0" fontSize={10}>
            Táo (nhãn 1)
          </text>
        </g>
      </svg>

      <p className="text-xs text-muted text-center">
        Mỗi điểm có nhãn rõ ràng (cam/táo). Mô hình học đường biên tách hai lớp
        — khi gặp điểm mới, nó dự đoán dựa trên phía của đường biên.
      </p>
    </div>
  );
}

interface UnsupervisedTabProps {
  numClusters: number;
  setNumClusters: (n: number) => void;
  clustersRevealed: boolean;
  setClustersRevealed: (v: boolean) => void;
  assignedClusters: number[];
  clusterCenters: { x: number; y: number }[];
  clusterColors: string[];
}

function UnsupervisedTab({
  numClusters,
  setNumClusters,
  clustersRevealed,
  setClustersRevealed,
  assignedClusters,
  clusterCenters,
  clusterColors,
}: UnsupervisedTabProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 justify-center items-center">
        <span className="text-xs text-muted">Số cụm K:</span>
        {[2, 3, 4].map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setNumClusters(k);
              setClustersRevealed(false);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              numClusters === k
                ? "bg-accent text-white"
                : "bg-card border border-border text-muted"
            }`}
          >
            K = {k}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setClustersRevealed(!clustersRevealed)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            clustersRevealed
              ? "bg-emerald-500 text-white"
              : "bg-card border border-border text-muted"
          }`}
        >
          {clustersRevealed ? "Ẩn kết quả K-means" : "Chạy K-means"}
        </button>
      </div>

      <p className="text-xs text-muted text-center">
        Cùng biểu đồ như tab trước, nhưng <strong>không có nhãn</strong>. K-means
        tìm {numClusters} cụm tự nhiên chỉ dựa trên vị trí.
      </p>

      <svg viewBox="0 0 500 320" className="w-full max-w-2xl mx-auto rounded-lg bg-surface/40">
        <line x1={30} y1={300} x2={480} y2={300} stroke="#475569" strokeWidth={1} />
        <line x1={30} y1={30} x2={30} y2={300} stroke="#475569" strokeWidth={1} />
        <text x={255} y={315} textAnchor="middle" fill="#64748b" fontSize={9}>
          Đặc trưng 1 (độ tròn)
        </text>

        {DATA_POINTS.map((p, i) => {
          const cluster = assignedClusters[i];
          const color = clustersRevealed
            ? clusterColors[cluster] ?? "#94a3b8"
            : "#94a3b8";
          return (
            <motion.circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={6}
              fill={color}
              stroke="#0f172a"
              strokeWidth={1}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.015, duration: 0.25 }}
            />
          );
        })}

        {clustersRevealed &&
          clusterCenters.map((c, i) => (
            <motion.g key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <circle
                cx={c.x}
                cy={c.y}
                r={14}
                fill="none"
                stroke={clusterColors[i]}
                strokeWidth={2.5}
                strokeDasharray="3 3"
              />
              <text
                x={c.x}
                y={c.y - 18}
                textAnchor="middle"
                fontSize={10}
                fill={clusterColors[i]}
                fontWeight="bold"
              >
                Tâm {i + 1}
              </text>
            </motion.g>
          ))}
      </svg>

      <p className="text-xs text-muted text-center">
        {clustersRevealed
          ? `K-means đã gom ${DATA_POINTS.length} điểm thành ${numClusters} cụm quanh các tâm. Không hề cần biết trước đâu là 'cam', đâu là 'táo'.`
          : "Bấm 'Chạy K-means' để thuật toán tự tìm cụm — không cần nhãn."}
      </p>
    </div>
  );
}

interface ReinforcementTabProps {
  trail: Array<[number, number]>;
  agentPos: [number, number];
  mode: "random" | "learned";
  setMode: (m: "random" | "learned") => void;
  onStep: () => void;
  onReset: () => void;
  reward: number;
  stepNumber: number;
}

function ReinforcementTab({
  trail,
  agentPos,
  mode,
  setMode,
  onStep,
  onReset,
  reward,
  stepNumber,
}: ReinforcementTabProps) {
  const cellSize = 50;
  const gridWidth = GRID_COLS * cellSize;
  const gridHeight = GRID_ROWS * cellSize;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 justify-center items-center">
        <span className="text-xs text-muted">Policy:</span>
        <button
          type="button"
          onClick={() => {
            setMode("random");
            onReset();
          }}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            mode === "random"
              ? "bg-red-500 text-white"
              : "bg-card border border-border text-muted"
          }`}
        >
          Ngẫu nhiên
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("learned");
            onReset();
          }}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            mode === "learned"
              ? "bg-emerald-500 text-white"
              : "bg-card border border-border text-muted"
          }`}
        >
          Đã học
        </button>
        <div className="w-px h-5 bg-border mx-1" />
        <button
          type="button"
          onClick={onStep}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-accent text-white"
        >
          Bước tiếp →
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-card border border-border text-muted hover:text-foreground"
        >
          Reset
        </button>
      </div>

      <div className="flex flex-wrap gap-4 justify-center items-start">
        <svg
          viewBox={`0 0 ${gridWidth} ${gridHeight}`}
          className="max-w-md rounded-lg bg-surface/40"
          style={{ width: "100%" }}
        >
          {/* Grid cells */}
          {BASE_GRID.map((cell, i) => {
            const x = cell.col * cellSize;
            const y = cell.row * cellSize;
            let fill = "#1e293b";
            if (cell.type === "goal") fill = "#22c55e33";
            if (cell.type === "pit") fill = "#ef444433";
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={cellSize}
                  height={cellSize}
                  fill={fill}
                  stroke="#334155"
                  strokeWidth={1}
                />
                {cell.type === "goal" && (
                  <text
                    x={x + cellSize / 2}
                    y={y + cellSize / 2 + 5}
                    textAnchor="middle"
                    fontSize={18}
                    fill="#22c55e"
                    fontWeight="bold"
                  >
                    ★
                  </text>
                )}
                {cell.type === "pit" && (
                  <text
                    x={x + cellSize / 2}
                    y={y + cellSize / 2 + 5}
                    textAnchor="middle"
                    fontSize={18}
                    fill="#ef4444"
                    fontWeight="bold"
                  >
                    ✕
                  </text>
                )}
              </g>
            );
          })}

          {/* Trail */}
          {trail.map((pos, i) => {
            if (i === 0) return null;
            const [r, c] = pos;
            const [pr, pc] = trail[i - 1];
            return (
              <motion.line
                key={i}
                x1={pc * cellSize + cellSize / 2}
                y1={pr * cellSize + cellSize / 2}
                x2={c * cellSize + cellSize / 2}
                y2={r * cellSize + cellSize / 2}
                stroke={mode === "learned" ? "#22c55e" : "#ef4444"}
                strokeWidth={3}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3 }}
              />
            );
          })}

          {/* Agent */}
          <motion.circle
            cx={agentPos[1] * cellSize + cellSize / 2}
            cy={agentPos[0] * cellSize + cellSize / 2}
            r={14}
            fill="#3b82f6"
            stroke="#0f172a"
            strokeWidth={2}
            animate={{
              cx: agentPos[1] * cellSize + cellSize / 2,
              cy: agentPos[0] * cellSize + cellSize / 2,
            }}
            transition={{ duration: 0.3 }}
          />
          <text
            x={agentPos[1] * cellSize + cellSize / 2}
            y={agentPos[0] * cellSize + cellSize / 2 + 4}
            textAnchor="middle"
            fontSize={11}
            fill="white"
            fontWeight="bold"
          >
            A
          </text>
        </svg>

        <div className="flex-1 min-w-[180px] space-y-2 text-xs">
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="text-muted mb-1">Bước</div>
            <div className="text-foreground font-mono text-base">
              {stepNumber}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="text-muted mb-1">Tổng reward</div>
            <div
              className={`font-mono text-base ${
                reward >= 0 ? "text-emerald-500" : "text-red-500"
              }`}
            >
              {reward}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 leading-relaxed">
            <div className="text-muted mb-1">Luật chơi</div>
            <div className="text-foreground">★ Goal: +10</div>
            <div className="text-foreground">✕ Pit: −10</div>
            <div className="text-foreground">· Step: −1</div>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted text-center">
        {mode === "learned"
          ? "Sau hàng ngàn episode thử-và-sai, agent đã học được đường đi tối ưu: né pit, đến goal nhanh nhất."
          : "Khi chưa học (random policy), agent rơi vào pit và tích điểm âm. Đây là dữ liệu để cải thiện policy."}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg border border-border bg-card/60 p-3">
          <div className="text-accent font-semibold mb-1">State</div>
          <div className="text-muted leading-relaxed">
            Toạ độ hiện tại (row, col). Mô tả đầy đủ hoàn cảnh agent cần quyết
            định.
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card/60 p-3">
          <div className="text-accent font-semibold mb-1">Action</div>
          <div className="text-muted leading-relaxed">
            Di chuyển lên/xuống/trái/phải. Tập hành động rời rạc, giới hạn bởi
            môi trường.
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card/60 p-3">
          <div className="text-accent font-semibold mb-1">Reward</div>
          <div className="text-muted leading-relaxed">
            Tín hiệu vô hướng: +10 khi tới goal, −10 khi rơi pit, −1 mỗi bước.
            Agent tối đa hoá tổng reward.
          </div>
        </div>
      </div>
    </div>
  );
}
