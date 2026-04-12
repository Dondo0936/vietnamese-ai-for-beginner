"use client";
import { useState, useCallback, useMemo } from "react";
import { PredictionGate, LessonSection, AhaMoment, InlineChallenge, MiniSummary, Callout, CodeBlock, LaTeX, TopicLink } from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = { slug: "multi-armed-bandit", title: "Multi-Armed Bandit", titleVi: "Bài toán máy đánh bạc nhiều tay", description: "Bài toán cân bằng giữa khai thác kiến thức đã có và khám phá lựa chọn mới", category: "reinforcement-learning", tags: ["exploration", "exploitation", "epsilon-greedy"], difficulty: "beginner", relatedSlugs: ["q-learning", "recommendation-systems", "supervised-unsupervised-rl"], vizType: "interactive" };

const ARMS = [
  { name: "Phở A", trueReward: 0.6, color: "#3b82f6" },
  { name: "Phở B", trueReward: 0.8, color: "#22c55e" },
  { name: "Phở C", trueReward: 0.4, color: "#f59e0b" },
  { name: "Phở D", trueReward: 0.7, color: "#8b5cf6" },
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
    { question: "Explore vs Exploit dilemma là gì?", options: ["Chọn model lớn hay nhỏ", "EXPLOIT: chọn lựa chọn TỐT NHẤT đã biết → tối đa reward ngắn hạn. EXPLORE: thử lựa chọn MỚI → có thể tìm tốt hơn. Cần cân bằng!", "Chọn data nhiều hay ít"], correct: 1, explanation: "Ví dụ: bạn biết Phở A ngon (exploit). Nhưng có Phở B chưa thử — có thể ngon hơn! Nếu chỉ exploit → miss Phở B. Nếu chỉ explore → lãng phí thời gian thử nhiều quán tệ. Epsilon-greedy: 90% chọn tốt nhất, 10% thử random." },
    { question: "UCB (Upper Confidence Bound) tốt hơn epsilon-greedy thế nào?", options: ["Nhanh hơn", "UCB ưu tiên explore arms ÍT ĐƯỢC THỬ (uncertainty cao). Epsilon-greedy explore RANDOM không care đã thử hay chưa", "Không tốt hơn"], correct: 1, explanation: "UCB = mean reward + bonus cho uncertainty. Arm chưa thử nhiều → bonus lớn → được explore. Arm đã thử nhiều → bonus nhỏ → chỉ exploit nếu mean cao. Thông minh hơn random explore: explore CÓ MỤC ĐÍCH (giảm uncertainty)." },
    { question: "A/B testing trên Shopee là dạng Bandit không?", options: ["Không liên quan", "Có! A/B test = 2-armed bandit. Variant A và B = 2 arms. Click rate = reward. Bandit approach (Thompson Sampling) tốt hơn A/B test truyền thống vì ADAPTIVE", "Chỉ là thống kê"], correct: 1, explanation: "A/B test: chia 50/50, đợi đủ data, chọn winner. Bandit: bắt đầu 50/50, DẦN CHUYỂN traffic sang variant tốt hơn. Bandit: ít user nhận variant tệ hơn → ethical + hiệu quả hơn. Shopee, Grab, Netflix đều dùng Bandit cho recommendation." },
    {
      type: "fill-blank",
      question: "Bandit phải cân bằng hai mục tiêu: {blank} (thử arm mới để giảm bất định) và {blank} (khai thác arm tốt nhất đã biết).",
      blanks: [
        { answer: "exploration", accept: ["explore", "khám phá", "kham pha"] },
        { answer: "exploitation", accept: ["exploit", "khai thác", "khai thac"] },
      ],
      explanation: "Đây là trade-off cốt lõi của mọi bài toán RL. Epsilon-greedy, UCB, Thompson Sampling là ba chiến lược phổ biến để cân bằng exploration và exploitation.",
    },
  ], []);

  return (
    <><LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
      <PredictionGate question="Bạn mới đến Hà Nội, có 4 quán phở. Lần 1 thử Phở A — ngon. Lần 2 nên làm gì?" options={["Quay lại Phở A vì đã biết ngon (exploit)", "Thử Phở B — có thể ngon hơn (explore)", "Explore-exploit: 80% quay lại quán tốt nhất, 20% thử quán mới"]} correct={2} explanation="Explore-Exploit dilemma! Chỉ exploit (Phở A mãi) → miss Phở B ngon hơn. Chỉ explore (thử hết) → lãng phí tiền ăn phở tệ. Cân bằng: phần lớn chọn tốt nhất đã biết, thỉnh thoảng thử mới. Đây chính là Multi-Armed Bandit!">

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">Click vào <strong className="text-foreground">quán phở</strong>{" "}để thử — nhận reward (ngon=1, không=0). Tìm quán tốt nhất!</p>
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
                <text x={x + 60} y={44} textAnchor="middle" fill="#94a3b8" fontSize={8}>Thử: {counts[i]} | Avg: {avg.toFixed(2)}</text>
                <rect x={x + 5} y={52} width={110 * avg} height={5} rx={2} fill={arm.color} />
              </g>);
            })}
            <text x={300} y={85} textAnchor="middle" fill="#e2e8f0" fontSize={10}>Tổng reward: {totalReward} / {counts.reduce((a, b) => a + b, 0)} lần thử</text>
          </svg>
        </div></VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha"><AhaMoment><p>Bạn vừa giải quyết <strong>bài toán cơ bản nhất của RL</strong>: explore vs exploit. Epsilon-greedy: 90% chọn tốt nhất, 10% random. UCB: explore arms có <strong>uncertainty cao</strong>{" "}(chưa thử nhiều). Thompson Sampling: model uncertainty bằng <strong>phân phối xác suất</strong>{" "}— thông minh nhất! Shopee, Netflix, Grab đều dùng Bandit hàng ngày.</p></AhaMoment></LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách"><InlineChallenge question="Shopee test 3 thiết kế nút 'Mua ngay'. A/B/C test: chia đều 33/33/33, đợi 2 tuần. Bandit approach: bắt đầu 33/33/33, nhanh chóng chuyển traffic sang variant tốt nhất. Ưu điểm Bandit?" options={["Nhanh hơn", "ÍT USER NHẬN VARIANT TỆ: A/B chậm 2 tuần chia đều (nhiều user nhận variant tệ). Bandit chuyển nhanh → ít user bị ảnh hưởng. ETHICAL + HIỆU QUẢ hơn", "Rẻ hơn"]} correct={1} explanation="A/B test: 100K users x 2 tuần x variant C (tệ nhất) = 33K users có trải nghiệm tệ. Bandit: sau 1000 users nhận ra C tệ → giảm traffic C xuống 5% → chỉ ~5K users nhận C. Bandit giảm 6x số users bị ảnh hưởng. Đây là lý do Shopee, Netflix, Google chuyển từ A/B sang Bandit." /></LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết"><ExplanationSection>
        <p><strong>Multi-Armed Bandit</strong>{" "}là bài toán cân bằng explore (thử mới) và exploit (dùng tốt nhất) — cơ bản nhất của RL. Khi thêm state và transition, bandit mở rộng thành full RL như{" "}
          <TopicLink slug="q-learning">Q-Learning</TopicLink>{" "}
          hoặc{" "}
          <TopicLink slug="policy-gradient">Policy Gradient</TopicLink>.</p>
        <p><strong>3 strategies chính:</strong></p>
        <LaTeX block>{"\\text{Epsilon-greedy: } a = \\begin{cases} \\arg\\max_a Q(a) & \\text{với xác suất } 1-\\epsilon \\\\ \\text{random} & \\text{với xác suất } \\epsilon \\end{cases}"}</LaTeX>
        <LaTeX block>{"\\text{UCB: } a = \\arg\\max_a \\left[Q(a) + c\\sqrt{\\frac{\\ln t}{N(a)}}\\right] \\quad \\text{(bonus cho arms ít thử)}"}</LaTeX>
        <LaTeX block>{"\\text{Thompson Sampling: } \\theta_a \\sim \\text{Beta}(\\alpha_a, \\beta_a), \\quad a = \\arg\\max_a \\theta_a"}</LaTeX>
        <Callout variant="tip" title="Thompson Sampling">Thompson Sampling tốt nhất trong thực tế: model reward bằng Beta distribution. Mỗi lần sample theta từ posterior → chọn arm có theta cao nhất. Explore tự nhiên: arm có uncertainty cao → theta dao động nhiều → có cơ hội được chọn. Collect ổn và hiệu quả hơn UCB!</Callout>
        <CodeBlock language="python" title="Thompson Sampling cho A/B/C test">{`import numpy as np

class ThompsonSampling:
    def __init__(self, n_arms):
        self.alpha = np.ones(n_arms)  # Successes + 1
        self.beta = np.ones(n_arms)   # Failures + 1

    def select_arm(self):
        # Sample từ Beta posterior cho mỗi arm
        samples = [np.random.beta(a, b) for a, b in zip(self.alpha, self.beta)]
        return np.argmax(samples)

    def update(self, arm, reward):
        if reward: self.alpha[arm] += 1
        else: self.beta[arm] += 1

# A/B/C test cho nút 'Mua ngay' trên Shopee
ts = ThompsonSampling(3)
for user in range(10000):
    arm = ts.select_arm()       # Chọn variant A/B/C
    reward = show_and_track(arm) # User có click không?
    ts.update(arm, reward)
    # Sau ~500 users: variant tốt nhất nhận 80%+ traffic
    # Sau ~2000 users: converge, chỉ variant tốt nhất`}</CodeBlock>
      </ExplanationSection></LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt"><MiniSummary points={["Multi-Armed Bandit: cân bằng explore (thử mới) và exploit (dùng tốt nhất đã biết).", "3 strategies: Epsilon-greedy (đơn giản), UCB (explore uncertainty cao), Thompson Sampling (tốt nhất).", "Ứng dụng: A/B testing (Shopee), recommendation (Netflix), ad placement (Google), clinical trials.", "Bandit tốt hơn A/B test truyền thống: adaptive, ít user bị ảnh hưởng, converge nhanh hơn.", "Là bài toán cơ bản nhất của RL — mở rộng thành full RL khi thêm states và transitions."]} /></LessonSection>
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra"><QuizSection questions={quizQuestions} /></LessonSection>
      </PredictionGate></LessonSection>
    </>
  );
}
