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
  titleVi: "Ba mo hinh hoc — Co giam sat, Khong giam sat, Tang cuong",
  description:
    "Ba cach tiep can co ban trong hoc may: hoc tu nhan, hoc tu cau truc, va hoc tu phan thuong.",
  category: "foundations",
  tags: ["supervised", "unsupervised", "reinforcement-learning"],
  difficulty: "beginner",
  relatedSlugs: ["train-val-test", "data-preprocessing", "neural-network-overview"],
  vizType: "interactive",
};

const PARADIGMS = [
  { name: "Co giam sat", english: "Supervised", icon: "GV", color: "#3b82f6", analogy: "Hoc voi giao vien: co dap an dung", example: "Phan loai email spam/khong spam" },
  { name: "Khong giam sat", english: "Unsupervised", icon: "TH", color: "#22c55e", analogy: "Tu hoc: tim pattern an trong du lieu", example: "Nhom khach hang tuong tu" },
  { name: "Tang cuong", english: "Reinforcement", icon: "TC", color: "#f59e0b", analogy: "Hoc bang thu-va-sai: nhan thuong/phat", example: "Grab Routing toi uu duong di" },
];

const TOTAL_STEPS = 7;

export default function LearningParadigmsTopic() {
  const [activeParadigm, setActiveParadigm] = useState(0);
  const paradigm = PARADIGMS[activeParadigm];

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Ban co 10.000 anh cho va meo DA DUOC GAN NHAN. Mo hinh hoc nao phu hop?",
      options: [
        "Supervised Learning — co nhan (cho/meo) cho moi anh → hoc mapping input→label",
        "Unsupervised Learning — tim nhom tu nhien",
        "Reinforcement Learning — hoc bang thu-va-sai",
      ],
      correct: 0,
      explanation: "Co data + co nhan (labels) → Supervised Learning. Model hoc: anh nay co dac diem gi → label la 'cho' hay 'meo'. Giong hoc voi giao vien: giao vien cho dap an dung, hoc sinh hoc cach tu tra loi.",
    },
    {
      question: "Shopee muon nhom 50 trieu user thanh cac phan khuc khach hang. KHONG co nhan san. Dung gi?",
      options: [
        "Supervised Learning",
        "Unsupervised Learning — clustering tim nhom tu nhien dua tren hanh vi mua sam",
        "Reinforcement Learning",
      ],
      correct: 1,
      explanation: "Khong co nhan (khong biet truoc co bao nhieu nhom) → Unsupervised. K-means hoac DBSCAN phan nhom user dua tren features: tan suat mua, gio mua, gia trung binh, danh muc. Giong tu sap xep do choi thanh nhom ma khong co huong dan.",
    },
    {
      question: "Grab can toi uu duong di cho tai xe. Moi qua duong mat thoi gian khac nhau, khong biet truoc. Dung gi?",
      options: [
        "Supervised Learning — hoc tu data duong di cu",
        "Unsupervised Learning — nhom cac tuyen duong",
        "Reinforcement Learning — thu nhieu tuyen, nhan phan thuong (thoi gian ngan) hoac phat (ket xe), tu toi uu",
      ],
      correct: 2,
      explanation: "Moi truong thay doi (giao thong), khong co 'dap an dung' co dinh → RL. Agent (tai xe) thu hanh dong (re trai/phai), nhan reward (nhanh = +, cham = -), dan dan hoc chinh sach toi uu. Grab dung RL de routing 30 trieu chuyen/ngay tai Viet Nam!",
    },
  ], []);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Du doan">
        <PredictionGate
          question="Tre em hoc noi bang cach nao? Bo me noi 'day la con cho' (chi vao cho), tre nghe nhieu lan roi tu nhan biet. Day giong paradigm ML nao?"
          options={[
            "Supervised Learning — co 'nhan' (bo me noi ten) cho moi 'input' (hinh anh/am thanh)",
            "Unsupervised Learning — tre tu hoc khong can chi dan",
            "Reinforcement Learning — tre thu-va-sai",
          ]}
          correct={0}
          explanation="Dung! Bo me = giao vien, 'con cho' = label, hinh anh cho = input. Tre hoc mapping: thay con vat 4 chan + sung → 'cho'. Day chinh la Supervised Learning! Nhung tre con hoc kieu khac nua: tu nhom do vat (unsupervised) va hoc di bang thu-va-nga (RL)."
        >

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Kham pha">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Chon <strong className="text-foreground">paradigm</strong>{" "}
          de xem su khac biet giua 3 cach hoc co ban.
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
              <text x={300} y={85} textAnchor="middle" fill="#e2e8f0" fontSize={10}>Vi du: {paradigm.example}</text>
              <text x={300} y={115} textAnchor="middle" fill="#64748b" fontSize={9}>
                {activeParadigm === 0 ? "Input + Label → Hoc mapping" : activeParadigm === 1 ? "Chi co Input → Tim cau truc an" : "Action + Reward → Hoc chinh sach toi uu"}
              </text>
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoanh khac Aha">
        <AhaMoment>
          <p>
            3 paradigms giong <strong>3 cach hoc cua con nguoi</strong>:
            Supervised = hoc voi giao vien (co dap an).
            Unsupervised = tu kham pha (sap xep do choi).
            RL = hoc bang thu-va-sai (tap di xe dap — nga thi biet sai).
            Moi bai toan can paradigm phu hop — <strong>khong co cach nao tot nhat cho MOI truong hop!</strong>
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thu thach">
        <InlineChallenge
          question="FPT AI can phan loai email noi bo thanh 5 phong ban. Co 500 email DA GAN NHAN phong ban + 50.000 email CHUA GAN. Dung phuong phap nao?"
          options={[
            "Chi dung Supervised tren 500 email co nhan",
            "Semi-supervised: train tren 500 co nhan, dung model de pseudo-label 50K chua gan, train lai",
            "Chi dung Unsupervised tren 50K",
          ]}
          correct={1}
          explanation="Semi-supervised = ket hop tot nhat cua hai the gioi! 500 labeled data qua it cho supervised (5 classes). Semi-supervised: (1) train initial model tren 500, (2) model du doan 50K, (3) lay confident predictions lam pseudo-labels, (4) retrain. Accuracy tang 15-25%."
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Ly thuyet">
        <ExplanationSection>
          <p>
            <strong>Ba paradigm hoc may co ban</strong>{" "}
            dinh nghia cach model hoc tu du lieu — moi paradigm phu hop cho loai bai toan khac nhau.
          </p>
          <p><strong>1. Supervised Learning:</strong></p>
          <LaTeX block>{"\\min_\\theta \\sum_{i=1}^{N} \\mathcal{L}(f_\\theta(x_i), y_i) \\quad \\text{(co input } x_i \\text{ va label } y_i \\text{)}"}</LaTeX>

          <p><strong>2. Unsupervised Learning:</strong></p>
          <LaTeX block>{"\\min_\\theta \\mathcal{L}(f_\\theta(X)) \\quad \\text{(chi co input } X \\text{, khong co label)}"}</LaTeX>

          <p><strong>3. Reinforcement Learning:</strong></p>
          <LaTeX block>{"\\max_\\pi \\mathbb{E}\\left[\\sum_{t=0}^{T} \\gamma^t r(s_t, a_t)\\right] \\quad \\text{(toi uu chinh sach } \\pi \\text{ theo reward)}"}</LaTeX>

          <Callout variant="tip" title="Self-Supervised Learning">
            Xu huong hien dai: Self-Supervised = tu tao labels tu data. GPT: mask token tiep theo, tu du doan. BERT: mask random tokens, tu dien. Ket hop uu diem Supervised (co 'label') va Unsupervised (khong can human annotation). Day la cach GPT-4, Claude, Llama duoc train!
          </Callout>

          <CodeBlock language="python" title="3 paradigms voi scikit-learn">
{`from sklearn.linear_model import LogisticRegression
from sklearn.cluster import KMeans
# RL: dung gymnasium (khong co trong sklearn)

# 1. SUPERVISED: Phan loai email spam
clf = LogisticRegression()
clf.fit(X_train, y_train)  # X=features, y=spam/not_spam
pred = clf.predict(X_test)

# 2. UNSUPERVISED: Nhom khach hang
kmeans = KMeans(n_clusters=5)
clusters = kmeans.fit_predict(X_customers)  # Chi co X, khong co y
# Khach hang duoc chia thanh 5 nhom tu nhien

# 3. REINFORCEMENT LEARNING (Grab routing concept)
import gymnasium as gym
env = gym.make("Taxi-v3")
state, _ = env.reset()
for _ in range(100):
    action = agent.choose(state)      # Chon huong di
    next_state, reward, done, _, _ = env.step(action)
    agent.learn(state, action, reward, next_state)
    state = next_state
    if done: break
# Agent hoc: hanh dong nao → reward cao (den dich nhanh)`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tom tat">
        <MiniSummary points={[
          "Supervised: co input + label → hoc mapping. Phan loai, hoi quy, du doan.",
          "Unsupervised: chi co input → tim cau truc an. Clustering, dimensionality reduction.",
          "RL: action + reward → hoc chinh sach toi uu. Game, routing, robot, RLHF.",
          "Self-supervised (xu huong moi): tu tao labels tu data — cach GPT/Claude duoc train.",
          "Chon paradigm theo bai toan: co nhan → supervised. Khong nhan → unsupervised. Moi truong dong → RL.",
        ]} />
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiem tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>

        </PredictionGate>
      </LessonSection>
    </>
  );
}
