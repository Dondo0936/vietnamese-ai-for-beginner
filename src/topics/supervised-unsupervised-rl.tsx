"use client";

import { useState, useMemo } from "react";
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

const PARADIGMS = [
  { name: "Có giám sát", english: "Supervised", icon: "GV", color: "#3b82f6", analogy: "Học với giáo viên: có đáp án đúng", example: "Phân loại email spam/không spam" },
  { name: "Không giám sát", english: "Unsupervised", icon: "TH", color: "#22c55e", analogy: "Tự học: tìm pattern ẩn trong dữ liệu", example: "Nhóm khách hàng tương tự" },
  { name: "Tăng cường", english: "Reinforcement", icon: "TC", color: "#f59e0b", analogy: "Học bằng thử-và-sai: nhận thưởng/phạt", example: "Grab Routing tối ưu đường đi" },
];

const TOTAL_STEPS = 7;

export default function LearningParadigmsTopic() {
  const [activeParadigm, setActiveParadigm] = useState(0);
  const paradigm = PARADIGMS[activeParadigm];

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Bạn có 10.000 ảnh chó và mèo ĐÃ ĐƯỢC GẮN NHÃN. Mô hình học nào phù hợp?",
      options: [
        "Supervised Learning — có nhãn (chó/mèo) cho mỗi ảnh → học mapping input→label",
        "Unsupervised Learning — tìm nhóm tự nhiên",
        "Reinforcement Learning — học bằng thử-và-sai",
      ],
      correct: 0,
      explanation: "Có data + có nhãn (labels) → Supervised Learning. Model học: ảnh này có đặc điểm gì → label là 'chó' hay 'mèo'. Giống học với giáo viên: giáo viên cho đáp án đúng, học sinh học cách tự trả lời.",
    },
    {
      question: "Shopee muốn nhóm 50 triệu user thành các phân khúc khách hàng. KHÔNG có nhãn sẵn. Dùng gì?",
      options: [
        "Supervised Learning",
        "Unsupervised Learning — clustering tìm nhóm tự nhiên dựa trên hành vi mua sắm",
        "Reinforcement Learning",
      ],
      correct: 1,
      explanation: "Không có nhãn (không biết trước có bao nhiêu nhóm) → Unsupervised. K-means hoặc DBSCAN phân nhóm user dựa trên features: tần suất mua, giờ mua, giá trung bình, danh mục. Giống tự sắp xếp đồ chơi thành nhóm mà không có hướng dẫn.",
    },
    {
      question: "Grab cần tối ưu đường đi cho tài xế. Mỗi quá đường mất thời gian khác nhau, không biết trước. Dùng gì?",
      options: [
        "Supervised Learning — học từ data đường đi cũ",
        "Unsupervised Learning — nhóm các tuyến đường",
        "Reinforcement Learning — thử nhiều tuyến, nhận phần thưởng (thời gian ngắn) hoặc phạt (kẹt xe), tự tối ưu",
      ],
      correct: 2,
      explanation: "Môi trường thay đổi (giao thông), không có 'đáp án đúng' cố định → RL. Agent (tài xế) thử hành động (rẽ trái/phải), nhận reward (nhanh = +, chậm = -), dần dần học chính sách tối ưu. Grab dùng RL để routing 30 triệu chuyến/ngày tại Việt Nam!",
    },
  ], []);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Trẻ em học nói bằng cách nào? Bố mẹ nói 'đây là con chó' (chỉ vào chó), trẻ nghe nhiều lần rồi tự nhận biết. Đây giống paradigm ML nào?"
          options={[
            "Supervised Learning — có 'nhãn' (bố mẹ nói tên) cho mỗi 'input' (hình ảnh/âm thanh)",
            "Unsupervised Learning — trẻ tự học không cần chỉ dẫn",
            "Reinforcement Learning — trẻ thử-và-sai",
          ]}
          correct={0}
          explanation="Đúng! Bố mẹ = giáo viên, 'con chó' = label, hình ảnh chó = input. Trẻ học mapping: thấy con vật 4 chân + sủng → 'chó'. Đây chính là Supervised Learning! Nhưng trẻ còn học kiểu khác nữa: tự nhóm đồ vật (unsupervised) và học đi bằng thử-và-ngã (RL)."
        >

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Chọn <strong className="text-foreground">paradigm</strong>{" "}
          để xem sự khác biệt giữa 3 cách học cơ bản.
        </p>
        <VisualizationSection>
          <div className="space-y-4">
            <div className="flex gap-3 justify-center">
              {PARADIGMS.map((p, i) => (
                <button key={i} onClick={() => setActiveParadigm(i)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${activeParadigm === i ? "bg-accent text-white" : "bg-card border border-border text-muted hover:text-foreground"}`}
                >{p.name}</button>
              ))}
            </div>
            <svg viewBox="0 0 600 140" className="w-full max-w-2xl mx-auto">
              <rect x={150} y={10} width={300} height={50} rx={10} fill={paradigm.color} opacity={0.15} stroke={paradigm.color} strokeWidth={2} />
              <text x={300} y={32} textAnchor="middle" fill={paradigm.color} fontSize={12} fontWeight="bold">
                {paradigm.name} ({paradigm.english})
              </text>
              <text x={300} y={50} textAnchor="middle" fill="#94a3b8" fontSize={9}>{paradigm.analogy}</text>
              <text x={300} y={85} textAnchor="middle" fill="#e2e8f0" fontSize={10}>Ví dụ: {paradigm.example}</text>
              <text x={300} y={115} textAnchor="middle" fill="#64748b" fontSize={9}>
                {activeParadigm === 0 ? "Input + Label → Học mapping" : activeParadigm === 1 ? "Chỉ có Input → Tìm cấu trúc ẩn" : "Action + Reward → Học chính sách tối ưu"}
              </text>
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            3 paradigms giống <strong>3 cách học của con người</strong>:
            Supervised = học với giáo viên (có đáp án).
            Unsupervised = tự khám phá (sắp xếp đồ chơi).
            RL = học bằng thử-và-sai (tập đi xe đạp — ngã thì biết sai).
            Mỗi bài toán cần paradigm phù hợp — <strong>không có cách nào tốt nhất cho MỌI trường hợp!</strong>
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="FPT AI cần phân loại email nội bộ thành 5 phòng ban. Có 500 email ĐÃ GẮN NHÃN phòng ban + 50.000 email CHƯA GẮN. Dùng phương pháp nào?"
          options={[
            "Chỉ dùng Supervised trên 500 email có nhãn",
            "Semi-supervised: train trên 500 có nhãn, dùng model để pseudo-label 50K chưa gắn, train lại",
            "Chỉ dùng Unsupervised trên 50K",
          ]}
          correct={1}
          explanation="Semi-supervised = kết hợp tốt nhất của hai thế giới! 500 labeled data quá ít cho supervised (5 classes). Semi-supervised: (1) train initial model trên 500, (2) model dự đoán 50K, (3) lấy confident predictions làm pseudo-labels, (4) retrain. Accuracy tăng 15-25%."
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Ba paradigm học máy cơ bản</strong>{" "}
            định nghĩa cách model học từ dữ liệu — mỗi paradigm phù hợp cho loại bài toán khác nhau.
          </p>
          <p><strong>1. Supervised Learning:</strong></p>
          <LaTeX block>{"\\min_\\theta \\sum_{i=1}^{N} \\mathcal{L}(f_\\theta(x_i), y_i) \\quad \\text{(có input } x_i \\text{ và label } y_i \\text{)}"}</LaTeX>

          <p><strong>2. Unsupervised Learning:</strong></p>
          <LaTeX block>{"\\min_\\theta \\mathcal{L}(f_\\theta(X)) \\quad \\text{(chỉ có input } X \\text{, không có label)}"}</LaTeX>

          <p><strong>3. Reinforcement Learning:</strong></p>
          <LaTeX block>{"\\max_\\pi \\mathbb{E}\\left[\\sum_{t=0}^{T} \\gamma^t r(s_t, a_t)\\right] \\quad \\text{(tối ưu chính sách } \\pi \\text{ theo reward)}"}</LaTeX>

          <Callout variant="tip" title="Self-Supervised Learning">
            Xu hướng hiện đại: Self-Supervised = tự tạo labels từ data. GPT: mask token tiếp theo, tự dự đoán. BERT: mask random tokens, tự điền. Kết hợp ưu điểm Supervised (có 'label') và Unsupervised (không cần human annotation). Đây là cách GPT-4, Claude, Llama được train!
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
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "Supervised: có input + label → học mapping. Phân loại, hồi quy, dự đoán.",
          "Unsupervised: chỉ có input → tìm cấu trúc ẩn. Clustering, dimensionality reduction.",
          "RL: action + reward → học chính sách tối ưu. Game, routing, robot, RLHF.",
          "Self-supervised (xu hướng mới): tự tạo labels từ data — cách GPT/Claude được train.",
          "Chọn paradigm theo bài toán: có nhãn → supervised. Không nhãn → unsupervised. Môi trường động → RL.",
        ]} />
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>

        </PredictionGate>
      </LessonSection>
    </>
  );
}
