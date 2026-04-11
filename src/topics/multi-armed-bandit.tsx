"use client";
import { useState, useCallback, useMemo } from "react";
import { PredictionGate, LessonSection, AhaMoment, InlineChallenge, MiniSummary, Callout, CodeBlock, LaTeX } from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = { slug: "multi-armed-bandit", title: "Multi-Armed Bandit", titleVi: "Bai toan may danh bac nhieu tay", description: "Bai toan can bang giua khai thac kien thuc da co va kham pha lua chon moi", category: "reinforcement-learning", tags: ["exploration", "exploitation", "epsilon-greedy"], difficulty: "beginner", relatedSlugs: ["q-learning", "recommendation-systems", "supervised-unsupervised-rl"], vizType: "interactive" };

const ARMS = [
  { name: "Pho A", trueReward: 0.6, color: "#3b82f6" },
  { name: "Pho B", trueReward: 0.8, color: "#22c55e" },
  { name: "Pho C", trueReward: 0.4, color: "#f59e0b" },
  { name: "Pho D", trueReward: 0.7, color: "#8b5cf6" },
];

const TOTAL_STEPS = 7;
export default function MultiArmedBanditTopic() {
  const [counts, setCounts] = useState([0, 0, 0, 0]);
  const [rewards, setRewards] = useState([0, 0, 0, 0]);
  const [totalReward, setTotalReward] = useState(0);

  const pull = useCallback((arm: number) => {
    const r = Math.random() < ARMS[arm].trueReward ? 1 : 0;
    setCounts(p => { const n = [...p]; n[arm]++; return n; });
    setRewards(p => { const n = [...p]; n[arm] += r; return n; });
    setTotalReward(p => p + r);
  }, []);

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    { question: "Explore vs Exploit dilemma la gi?", options: ["Chon model lon hay nho", "EXPLOIT: chon lua chon TOT NHAT da biet → toi da reward ngan han. EXPLORE: thu lua chon MOI → co the tim tot hon. Can can bang!", "Chon data nhieu hay it"], correct: 1, explanation: "Vi du: ban biet Pho A ngon (exploit). Nhung co Pho B chua thu — co the ngon hon! Neu chi exploit → miss Pho B. Neu chi explore → lang phi thoi gian thu nhieu quan te. Epsilon-greedy: 90% chon tot nhat, 10% thu random." },
    { question: "UCB (Upper Confidence Bound) tot hon epsilon-greedy the nao?", options: ["Nhanh hon", "UCB uu tien explore arms IT DUOC THU (uncertainty cao). Epsilon-greedy explore RANDOM khong care da thu hay chua", "Khong tot hon"], correct: 1, explanation: "UCB = mean reward + bonus cho uncertainty. Arm chua thu nhieu → bonus lon → duoc explore. Arm da thu nhieu → bonus nho → chi exploit neu mean cao. Thong minh hon random explore: explore CO MUC DICH (giam uncertainty)." },
    { question: "A/B testing tren Shopee la dang Bandit khong?", options: ["Khong lien quan", "Co! A/B test = 2-armed bandit. Variant A va B = 2 arms. Click rate = reward. Bandit approach (Thompson Sampling) tot hon A/B test truyen thong vi ADAPTIVE", "Chi la thong ke"], correct: 1, explanation: "A/B test: chia 50/50, doi du data, chon winner. Bandit: bat dau 50/50, DAN CHUYEN traffic sang variant tot hon. Bandit:ít user nhan variant te hon → ethical + hieu qua hon. Shopee, Grab, Netflix deu dung Bandit cho recommendation." },
  ], []);

  return (
    <><LessonSection step={1} totalSteps={TOTAL_STEPS} label="Du doan">
      <PredictionGate question="Ban moi den Ha Noi, co 4 quan pho. Lan 1 thu Pho A — ngon. Lan 2 nen lam gi?" options={["Quay lai Pho A vi da biet ngon (exploit)", "Thu Pho B — co the ngon hon (explore)", "Explore-exploit: 80% quay lai quan tot nhat, 20% thu quan moi"]} correct={2} explanation="Explore-Exploit dilemma! Chi exploit (Pho A mai) → miss Pho B ngon hon. Chi explore (thu het) → lang phi tien an pho te. Can bang: phan lon chon tot nhat da biet, thỉnh thoang thu moi. Day chinh la Multi-Armed Bandit!">

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Kham pha">
        <p className="mb-4 text-sm text-muted leading-relaxed">Click vao <strong className="text-foreground">quan pho</strong>{" "}de thu — nhan reward (ngon=1, khong=0). Tim quan tot nhat!</p>
        <VisualizationSection><div className="space-y-4">
          <div className="flex gap-3 justify-center">
            {ARMS.map((arm, i) => (<button key={i} onClick={() => pull(i)} className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-80" style={{ backgroundColor: arm.color }}>{arm.name}</button>))}
          </div>
          <svg viewBox="0 0 600 100" className="w-full max-w-2xl mx-auto">
            {ARMS.map((arm, i) => {
              const avg = counts[i] > 0 ? rewards[i] / counts[i] : 0;
              const x = 30 + i * 145;
              return (<g key={i}><rect x={x} y={10} width={120} height={50} rx={6} fill="#1e293b" stroke={arm.color} strokeWidth={1.5} />
                <text x={x + 60} y={28} textAnchor="middle" fill={arm.color} fontSize={9} fontWeight="bold">{arm.name}</text>
                <text x={x + 60} y={44} textAnchor="middle" fill="#94a3b8" fontSize={8}>Thu: {counts[i]} | Avg: {avg.toFixed(2)}</text>
                <rect x={x + 5} y={52} width={110 * avg} height={5} rx={2} fill={arm.color} />
              </g>);
            })}
            <text x={300} y={85} textAnchor="middle" fill="#e2e8f0" fontSize={10}>Tong reward: {totalReward} / {counts.reduce((a, b) => a + b, 0)} lan thu</text>
          </svg>
        </div></VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoanh khac Aha"><AhaMoment><p>Ban vua giai quyet <strong>bai toan co ban nhat cua RL</strong>: explore vs exploit. Epsilon-greedy: 90% chon tot nhat, 10% random. UCB: explore arms co <strong>uncertainty cao</strong>{" "}(chua thu nhieu). Thompson Sampling: model uncertainty bang <strong>phan phoi xac suat</strong>{" "}— thong minh nhat! Shopee, Netflix, Grab deu dung Bandit hang ngay.</p></AhaMoment></LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thu thach"><InlineChallenge question="Shopee test 3 thiet ke nut 'Mua ngay'. A/B/C test: chia deu 33/33/33, doi 2 tuan. Bandit approach: bat dau 33/33/33, nhanh chong chuyen traffic sang variant tot nhat. Uu diem Bandit?" options={["Nhanh hon", "IT USER NHAN VARIANT TE: A/B cham 2 tuan chia deu (nhieu user nhan variant te). Bandit chuyen nhanh → it user bi anh huong. ETHICAL + HIEU QUA hon", "Re hon"]} correct={1} explanation="A/B test: 100K users x 2 tuan x variant C (te nhat) = 33K users co trai nghiem te. Bandit: sau 1000 users nhan ra C te → giam traffic C xuong 5% → chi ~5K users nhan C. Bandit giam 6x so users bi anh huong. Day la ly do Shopee, Netflix, Google chuyen tu A/B sang Bandit." /></LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Ly thuyet"><ExplanationSection>
        <p><strong>Multi-Armed Bandit</strong>{" "}la bai toan can bang explore (thu moi) va exploit (dung tot nhat) — co ban nhat cua RL.</p>
        <p><strong>3 strategies chinh:</strong></p>
        <LaTeX block>{"\\text{Epsilon-greedy: } a = \\begin{cases} \\arg\\max_a Q(a) & \\text{voi xac suat } 1-\\epsilon \\\\ \\text{random} & \\text{voi xac suat } \\epsilon \\end{cases}"}</LaTeX>
        <LaTeX block>{"\\text{UCB: } a = \\arg\\max_a \\left[Q(a) + c\\sqrt{\\frac{\\ln t}{N(a)}}\\right] \\quad \\text{(bonus cho arms it thu)}"}</LaTeX>
        <LaTeX block>{"\\text{Thompson Sampling: } \\theta_a \\sim \\text{Beta}(\\alpha_a, \\beta_a), \\quad a = \\arg\\max_a \\theta_a"}</LaTeX>
        <Callout variant="tip" title="Thompson Sampling">Thompson Sampling tot nhat trong thuc te: model reward bang Beta distribution. Moi lan sample theta tu posterior → chon arm co theta cao nhat. Explore tu nhien: arm co uncertainty cao → theta dao dong nhieu → co co hoi duoc chon. Collect on va hieu qua hon UCB!</Callout>
        <CodeBlock language="python" title="Thompson Sampling cho A/B/C test">{`import numpy as np

class ThompsonSampling:
    def __init__(self, n_arms):
        self.alpha = np.ones(n_arms)  # Successes + 1
        self.beta = np.ones(n_arms)   # Failures + 1

    def select_arm(self):
        # Sample tu Beta posterior cho moi arm
        samples = [np.random.beta(a, b) for a, b in zip(self.alpha, self.beta)]
        return np.argmax(samples)

    def update(self, arm, reward):
        if reward: self.alpha[arm] += 1
        else: self.beta[arm] += 1

# A/B/C test cho nut 'Mua ngay' tren Shopee
ts = ThompsonSampling(3)
for user in range(10000):
    arm = ts.select_arm()       # Chon variant A/B/C
    reward = show_and_track(arm) # User co click khong?
    ts.update(arm, reward)
    # Sau ~500 users: variant tot nhat nhan 80%+ traffic
    # Sau ~2000 users: converge, chi variant tot nhat`}</CodeBlock>
      </ExplanationSection></LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tom tat"><MiniSummary points={["Multi-Armed Bandit: can bang explore (thu moi) va exploit (dung tot nhat da biet).", "3 strategies: Epsilon-greedy (don gian), UCB (explore uncertainty cao), Thompson Sampling (tot nhat).", "Ung dung: A/B testing (Shopee), recommendation (Netflix), ad placement (Google), clinical trials.", "Bandit tot hon A/B test truyen thong: adaptive, it user bi anh huong, converge nhanh hon.", "La bai toan co ban nhat cua RL — mo rong thanh full RL khi them states va transitions."]} /></LessonSection>
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiem tra"><QuizSection questions={quizQuestions} /></LessonSection>
      </PredictionGate></LessonSection>
    </>
  );
}
