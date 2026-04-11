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
  slug: "world-models",
  title: "World Models",
  titleVi: "Mô hình thế giới — AI biết tưởng tượng",
  description:
    "Mô hình AI xây dựng biểu diễn nội tại về thế giới, có thể dự đoán hậu quả hành động trước khi thực hiện.",
  category: "emerging",
  tags: ["world-model", "simulation", "prediction", "planning"],
  difficulty: "advanced",
  relatedSlugs: ["reasoning-models", "planning", "text-to-video"],
  vizType: "interactive",
};

const SCENARIOS = [
  { action: "Day coc ra mep ban", prediction: "Coc roi xuong dat va vo", correct: true, type: "Vat ly" },
  { action: "Mo cua so khi troi mua", prediction: "Nuoc mua bay vao phong", correct: true, type: "Vat ly" },
  { action: "Noi 'xin loi' sau khi lam sai", prediction: "Nguoi kia bot gian", correct: true, type: "Xa hoi" },
  { action: "Dat tay len bep nong", prediction: "Bi phong", correct: true, type: "Vat ly" },
];

const TOTAL_STEPS = 7;

export default function WorldModelsTopic() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const scenario = SCENARIOS[scenarioIdx];

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "World model khac LLM thuong o diem nao?",
      options: [
        "World model lon hon nhieu",
        "World model co bieu dien noi tai ve cach the gioi van hanh, co the du doan hau qua hanh dong",
        "World model chi xu ly anh, khong xu ly text",
      ],
      correct: 1,
      explanation: "LLM thuong: du doan token tiep theo dua tren pattern ngon ngu. World model: xay dung 'mo hinh thu nho' cua the gioi — hieu vat ly, nhan qua, xa hoi. Co the 'tuong tuong' hau qua truoc khi hanh dong, giong cach con nguoi suy nghi.",
    },
    {
      question: "Sora (OpenAI) duoc coi la world model vi ly do gi?",
      options: [
        "Tao video dep",
        "Hoc duoc cac quy luat vat ly (trong luc, va cham, anh sang) tu video — co the du doan cach vat the tuong tac",
        "Dung nhieu GPU",
      ],
      correct: 1,
      explanation: "Sora khong chi 've' video — no hoc duoc vat ly: vat roi xuong, nuoc chay, anh phan chieu. Day la dau hieu cua world model: hieu cach the gioi van hanh, khong chi copy pattern. Tuy nhien, van con loi (vi du: vat the 'bien mat').",
    },
    {
      question: "Tai sao xe tu lai VinFast can world model?",
      options: [
        "De tao video quang cao",
        "Du doan hanh vi cua nguoi di duong, xe khac, va moi truong TRUOC KHI ra quyet dinh lai",
        "Nhan dien bien bao giao thong",
      ],
      correct: 1,
      explanation: "Xe tu lai can: 'Neu minh re trai, xe kia se lam gi? Nguoi di bo se di dau?' World model mo phong nhieu kich ban trong 'tuong tuong' → chon hanh dong an toan nhat. Tesla FSD va VinFast deu dang phat trien world model cho self-driving.",
    },
  ], []);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Du doan">
        <PredictionGate
          question="Ban day coc nuoc ra sat mep ban. Khong can nhin, ban BIET chuyen gi se xay ra. AI co the 'tuong tuong' hau qua tuong tu khong?"
          options={[
            "Khong — AI chi xu ly text/anh, khong hieu vat ly",
            "Co — World Models xay dung 'mo hinh thu nho' cua the gioi, du doan hau qua nhu con nguoi",
            "Chi khi duoc lap trinh tung truong hop cu the",
          ]}
          correct={1}
          explanation="World Models la buoc tien lon: AI khong chi 'nho' patterns ma con 'hieu' cach the gioi van hanh. Giong cach ban biet coc se roi ma khong can thu — AI xay dung mo hinh vat ly noi tai de du doan. Sora, GAIA, va nhieu he thong tu lai dang phat trien kha nang nay."
        >

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Kham pha">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Chon <strong className="text-foreground">kich ban</strong>{" "}
          de xem world model du doan hau qua hanh dong.
        </p>
        <VisualizationSection>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {SCENARIOS.map((s, i) => (
                <button key={i} onClick={() => setScenarioIdx(i)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${scenarioIdx === i ? "bg-accent text-white" : "bg-card border border-border text-muted hover:text-foreground"}`}
                >{s.action}</button>
              ))}
            </div>
            <svg viewBox="0 0 600 150" className="w-full max-w-2xl mx-auto">
              <rect x={30} y={20} width={200} height={45} rx={8} fill="#3b82f6" opacity={0.8} />
              <text x={130} y={40} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">Hanh dong</text>
              <text x={130} y={55} textAnchor="middle" fill="white" fontSize={8}>{scenario.action}</text>
              <text x={300} y={47} textAnchor="middle" fill="#f59e0b" fontSize={18}>→</text>
              <rect x={370} y={15} width={200} height={55} rx={8} fill="#1e293b" stroke="#22c55e" strokeWidth={2} />
              <text x={470} y={35} textAnchor="middle" fill="#22c55e" fontSize={9} fontWeight="bold">World Model du doan</text>
              <text x={470} y={52} textAnchor="middle" fill="#94a3b8" fontSize={8}>{scenario.prediction}</text>
              <text x={470} y={65} textAnchor="middle" fill="#64748b" fontSize={7}>Loai: {scenario.type}</text>
              <text x={300} y={110} textAnchor="middle" fill="#94a3b8" fontSize={10}>
                World model 'tuong tuong' ket qua TRUOC KHI hanh dong thuc su xay ra
              </text>
              <text x={300} y={130} textAnchor="middle" fill="#64748b" fontSize={8}>
                Giong con nguoi: khong can thu de biet coc se roi khi day ra mep ban
              </text>
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoanh khac Aha">
        <AhaMoment>
          <p>
            Con nguoi <strong>khong can thu moi thu de hieu the gioi</strong>{" "}
            — ban biet lua nong, da truot, coc roi. Day la vi nao co <strong>world model</strong>.
            AI dang hoc cach tuong tu: Sora hoc vat ly tu video, GAIA hoc tuong tac tu mo phong.
            Day la buoc tien tu &quot;AI biet noi&quot; sang <strong>&quot;AI biet nghi&quot;</strong>.
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thu thach">
        <InlineChallenge
          question="Xe tu lai VinFast dang chay 60km/h, phia truoc co nguoi sang duong. World model can du doan gi de ra quyet dinh?"
          options={[
            "Chi can nhan dien nguoi va phanh",
            "Du doan quy dao nguoi di bo, toc do, y dinh (dung lai hay tiep tuc), mo phong nhieu kich ban → chon hanh dong an toan nhat",
            "Tra cuu luat giao thong",
          ]}
          correct={1}
          explanation="World model cho self-driving can: du doan vi tri nguoi sau 0.5s, 1s, 2s, mo phong nhieu kich ban (nguoi dung/di/chay), danh gia rui ro tung hanh dong (phanh/lanh/giu toc). 'Tuong tuong' truoc khi hanh dong — khong du thoi gian cho thu-va-sai!"
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Ly thuyet">
        <ExplanationSection>
          <p>
            <strong>World Models</strong>{" "}
            la AI xay dung bieu dien noi tai ve cach the gioi van hanh — co the du doan hau qua hanh dong truoc khi thuc hien.
          </p>
          <p><strong>Core loop:</strong></p>
          <LaTeX block>{"\\hat{s}_{t+1} = f_{\\text{world}}(s_t, a_t) \\quad \\text{(du doan state tiep theo)}"}</LaTeX>
          <LaTeX block>{"a^* = \\arg\\max_a \\sum_{t} r(\\hat{s}_t, a_t) \\quad \\text{(chon action tot nhat trong 'tuong tuong')}"}</LaTeX>

          <Callout variant="tip" title="Video Generation = World Modeling">
            Sora khong chi tao video dep — no hoc duoc vat ly: vat roi do trong luc, nuoc chay theo dia hinh, anh phan chieu. Day la dau hieu cua world model moi: hoc physics tu pixel thay vi phuong trinh.
          </Callout>

          <p><strong>3 huong tiep can:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Learned Simulators:</strong>{" "}Neural network hoc physics tu data (Sora, GAIA)</li>
            <li><strong>Latent World Models:</strong>{" "}Mo hinh trong latent space, khong render pixel (JEPA, DreamerV3)</li>
            <li><strong>Foundation World Models:</strong>{" "}Train tren nhieu domain, transfer learning cho task moi</li>
          </ul>

          <CodeBlock language="python" title="World Model concept: du doan state tiep theo">
{`import torch
import torch.nn as nn

class SimpleWorldModel(nn.Module):
    """World model: du doan state_{t+1} tu state_t va action_t."""
    def __init__(self, state_dim=64, action_dim=4, hidden=256):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Linear(state_dim + action_dim, hidden),
            nn.ReLU(),
            nn.Linear(hidden, hidden),
            nn.ReLU(),
        )
        self.state_predictor = nn.Linear(hidden, state_dim)
        self.reward_predictor = nn.Linear(hidden, 1)

    def forward(self, state, action):
        x = torch.cat([state, action], dim=-1)
        h = self.encoder(x)
        next_state = self.state_predictor(h)  # Du doan
        reward = self.reward_predictor(h)
        return next_state, reward

    def imagine(self, state, actions_sequence):
        """'Tuong tuong' nhieu buoc tuong lai."""
        states, rewards = [state], []
        for action in actions_sequence:
            state, reward = self.forward(state, action)
            states.append(state)
            rewards.append(reward)
        return states, rewards  # Trajectory trong 'tuong tuong'`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tom tat">
        <MiniSummary points={[
          "World model xay dung 'mo hinh thu nho' cua the gioi — du doan hau qua hanh dong truoc khi thuc hien.",
          "Tu 'AI biet noi' sang 'AI biet nghi': hieu vat ly, nhan qua, tuong tac xa hoi.",
          "Sora hoc vat ly tu video, DreamerV3 hoc trong latent space, GAIA mo phong giao thong.",
          "Ung dung: xe tu lai (du doan hanh vi), robot (lap ke hoach), game (tao the gioi mo).",
          "Thach thuc: do chinh xac mo phong, long-horizon prediction, tinh tong quat hoa.",
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
