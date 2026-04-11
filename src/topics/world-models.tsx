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
  { action: "Đẩy cốc ra mép bàn", prediction: "Cốc rơi xuống đất và vỡ", correct: true, type: "Vật lý" },
  { action: "Mở cửa sổ khi trời mưa", prediction: "Nước mưa bay vào phòng", correct: true, type: "Vật lý" },
  { action: "Nói 'xin lỗi' sau khi làm sai", prediction: "Người kia bớt giận", correct: true, type: "Xã hội" },
  { action: "Đặt tay lên bếp nóng", prediction: "Bị phỏng", correct: true, type: "Vật lý" },
];

const TOTAL_STEPS = 7;

export default function WorldModelsTopic() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const scenario = SCENARIOS[scenarioIdx];

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "World model khác LLM thường ở điểm nào?",
      options: [
        "World model lớn hơn nhiều",
        "World model có biểu diễn nội tại về cách thế giới vận hành, có thể dự đoán hậu quả hành động",
        "World model chỉ xử lý ảnh, không xử lý text",
      ],
      correct: 1,
      explanation: "LLM thường: dự đoán token tiếp theo dựa trên pattern ngôn ngữ. World model: xây dựng 'mô hình thu nhỏ' của thế giới — hiểu vật lý, nhân quả, xã hội. Có thể 'tưởng tượng' hậu quả trước khi hành động, giống cách con người suy nghĩ.",
    },
    {
      question: "Sora (OpenAI) được coi là world model vì lý do gì?",
      options: [
        "Tạo video đẹp",
        "Học được các quy luật vật lý (trọng lực, va chạm, ánh sáng) từ video — có thể dự đoán cách vật thể tương tác",
        "Dùng nhiều GPU",
      ],
      correct: 1,
      explanation: "Sora không chỉ 'vẽ' video — nó học được vật lý: vật rơi xuống, nước chảy, ánh phản chiếu. Đây là dấu hiệu của world model: hiểu cách thế giới vận hành, không chỉ copy pattern. Tuy nhiên, vẫn còn lỗi (ví dụ: vật thể 'biến mất').",
    },
    {
      question: "Tại sao xe tự lái VinFast cần world model?",
      options: [
        "Để tạo video quảng cáo",
        "Dự đoán hành vi của người đi đường, xe khác, và môi trường TRƯỚC KHI ra quyết định lái",
        "Nhận diện biển báo giao thông",
      ],
      correct: 1,
      explanation: "Xe tự lái cần: 'Nếu mình rẽ trái, xe kia sẽ làm gì? Người đi bộ sẽ đi đâu?' World model mô phỏng nhiều kịch bản trong 'tưởng tượng' → chọn hành động an toàn nhất. Tesla FSD và VinFast đều đang phát triển world model cho self-driving.",
    },
  ], []);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn đẩy cốc nước ra sát mép bàn. Không cần nhìn, bạn BIẾT chuyện gì sẽ xảy ra. AI có thể 'tưởng tượng' hậu quả tương tự không?"
          options={[
            "Không — AI chỉ xử lý text/ảnh, không hiểu vật lý",
            "Có — World Models xây dựng 'mô hình thu nhỏ' của thế giới, dự đoán hậu quả như con người",
            "Chỉ khi được lập trình từng trường hợp cụ thể",
          ]}
          correct={1}
          explanation="World Models là bước tiến lớn: AI không chỉ 'nhớ' patterns mà còn 'hiểu' cách thế giới vận hành. Giống cách bạn biết cốc sẽ rơi mà không cần thử — AI xây dựng mô hình vật lý nội tại để dự đoán. Sora, GAIA, và nhiều hệ thống tự lái đang phát triển khả năng này."
        >

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Chọn <strong className="text-foreground">kịch bản</strong>{" "}
          để xem world model dự đoán hậu quả hành động.
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
              <text x={130} y={40} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">Hành động</text>
              <text x={130} y={55} textAnchor="middle" fill="white" fontSize={8}>{scenario.action}</text>
              <text x={300} y={47} textAnchor="middle" fill="#f59e0b" fontSize={18}>→</text>
              <rect x={370} y={15} width={200} height={55} rx={8} fill="#1e293b" stroke="#22c55e" strokeWidth={2} />
              <text x={470} y={35} textAnchor="middle" fill="#22c55e" fontSize={9} fontWeight="bold">World Model dự đoán</text>
              <text x={470} y={52} textAnchor="middle" fill="#94a3b8" fontSize={8}>{scenario.prediction}</text>
              <text x={470} y={65} textAnchor="middle" fill="#64748b" fontSize={7}>Loại: {scenario.type}</text>
              <text x={300} y={110} textAnchor="middle" fill="#94a3b8" fontSize={10}>
                World model 'tưởng tượng' kết quả TRƯỚC KHI hành động thực sự xảy ra
              </text>
              <text x={300} y={130} textAnchor="middle" fill="#64748b" fontSize={8}>
                Giống con người: không cần thử để biết cốc sẽ rơi khi đẩy ra mép bàn
              </text>
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Con người <strong>không cần thử mọi thứ để hiểu thế giới</strong>{" "}
            — bạn biết lửa nóng, đá trơn, cốc rơi. Đây là vì não có <strong>world model</strong>.
            AI đang học cách tương tự: Sora học vật lý từ video, GAIA học tương tác từ mô phỏng.
            Đây là bước tiến từ 'AI biết nói' sang <strong>'AI biết nghĩ'</strong>.
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Xe tự lái VinFast đang chạy 60km/h, phía trước có người sang đường. World model cần dự đoán gì để ra quyết định?"
          options={[
            "Chỉ cần nhận diện người và phanh",
            "Dự đoán quỹ đạo người đi bộ, tốc độ, ý định (dừng lại hay tiếp tục), mô phỏng nhiều kịch bản → chọn hành động an toàn nhất",
            "Tra cứu luật giao thông",
          ]}
          correct={1}
          explanation="World model cho self-driving cần: dự đoán vị trí người sau 0.5s, 1s, 2s, mô phỏng nhiều kịch bản (người dừng/đi/chạy), đánh giá rủi ro từng hành động (phanh/lách/giữ tốc). 'Tưởng tượng' trước khi hành động — không đủ thời gian cho thử-và-sai!"
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>World Models</strong>{" "}
            là AI xây dựng biểu diễn nội tại về cách thế giới vận hành — có thể dự đoán hậu quả hành động trước khi thực hiện.
          </p>
          <p><strong>Core loop:</strong></p>
          <LaTeX block>{"\\hat{s}_{t+1} = f_{\\text{world}}(s_t, a_t) \\quad \\text{(dự đoán state tiếp theo)}"}</LaTeX>
          <LaTeX block>{"a^* = \\arg\\max_a \\sum_{t} r(\\hat{s}_t, a_t) \\quad \\text{(chọn action tốt nhất trong 'tưởng tượng')}"}</LaTeX>

          <Callout variant="tip" title="Video Generation = World Modeling">
            Sora không chỉ tạo video đẹp — nó học được vật lý: vật rơi do trọng lực, nước chảy theo địa hình, ánh phản chiếu. Đây là dấu hiệu của world model mới: học physics từ pixel thay vì phương trình.
          </Callout>

          <p><strong>3 hướng tiếp cận:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Learned Simulators:</strong>{" "}Neural network học physics từ data (Sora, GAIA)</li>
            <li><strong>Latent World Models:</strong>{" "}Mô hình trong latent space, không render pixel (JEPA, DreamerV3)</li>
            <li><strong>Foundation World Models:</strong>{" "}Train trên nhiều domain, transfer learning cho task mới</li>
          </ul>

          <CodeBlock language="python" title="World Model concept: dự đoán state tiếp theo">
{`import torch
import torch.nn as nn

class SimpleWorldModel(nn.Module):
    """World model: dự đoán state_{t+1} từ state_t và action_t."""
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
        next_state = self.state_predictor(h)  # Dự đoán
        reward = self.reward_predictor(h)
        return next_state, reward

    def imagine(self, state, actions_sequence):
        """'Tưởng tượng' nhiều bước tương lai."""
        states, rewards = [state], []
        for action in actions_sequence:
            state, reward = self.forward(state, action)
            states.append(state)
            rewards.append(reward)
        return states, rewards  # Trajectory trong 'tưởng tượng'`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "World model xây dựng 'mô hình thu nhỏ' của thế giới — dự đoán hậu quả hành động trước khi thực hiện.",
          "Từ 'AI biết nói' sang 'AI biết nghĩ': hiểu vật lý, nhân quả, tương tác xã hội.",
          "Sora học vật lý từ video, DreamerV3 học trong latent space, GAIA mô phỏng giao thông.",
          "Ứng dụng: xe tự lái (dự đoán hành vi), robot (lập kế hoạch), game (tạo thế giới mở).",
          "Thách thức: độ chính xác mô phỏng, long-horizon prediction, tính tổng quát hoá.",
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
