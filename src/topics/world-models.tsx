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

const TOTAL_STEPS = 7;

// ---------------------------------------------------------------------------
// Bản đồ đầy đủ (ground truth) — agent không thấy hết, phải suy luận
// ---------------------------------------------------------------------------
const MAP_ROWS = 8;
const MAP_COLS = 10;

type Terrain = "grass" | "tree" | "water" | "rock" | "goal" | "start";

// Bản đồ tĩnh — đủ đa dạng để thấy 'imagination' khác ground truth
const TRUE_MAP: Terrain[][] = [
  ["grass", "grass", "tree", "grass", "grass", "water", "water", "grass", "tree", "grass"],
  ["grass", "tree", "tree", "grass", "grass", "water", "grass", "grass", "grass", "rock"],
  ["grass", "grass", "grass", "rock", "grass", "grass", "grass", "tree", "grass", "rock"],
  ["start", "grass", "grass", "rock", "grass", "tree", "grass", "grass", "grass", "grass"],
  ["grass", "grass", "grass", "grass", "grass", "tree", "tree", "grass", "water", "grass"],
  ["grass", "tree", "grass", "grass", "grass", "grass", "grass", "grass", "water", "grass"],
  ["rock", "rock", "grass", "water", "water", "grass", "grass", "tree", "grass", "grass"],
  ["grass", "grass", "grass", "water", "grass", "grass", "tree", "grass", "grass", "goal"],
];

const TERRAIN_COLORS: Record<Terrain, string> = {
  grass: "#22c55e33",
  tree: "#15803d",
  water: "#1d4ed8",
  rock: "#64748b",
  goal: "#f59e0b",
  start: "#a855f7",
};

const TERRAIN_LABELS: Record<Terrain, string> = {
  grass: "Cỏ",
  tree: "Cây",
  water: "Nước",
  rock: "Đá",
  goal: "Đích",
  start: "Điểm bắt đầu",
};

// Quỹ đạo agent đi qua (tạo sẵn — không cho người dùng điều khiển để tập trung
// vào concept partial observability).
const AGENT_TRAJECTORY: Array<[number, number]> = [
  [3, 0],
  [3, 1],
  [3, 2],
  [2, 2],
  [1, 2],
  [1, 3],
  [1, 4],
  [2, 4],
  [3, 4],
  [4, 4],
  [4, 3],
  [5, 3],
  [5, 4],
  [5, 5],
  [5, 6],
  [5, 7],
  [6, 7],
  [6, 8],
  [7, 8],
  [7, 9],
];

export default function WorldModelsTopic() {
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

  // ---------------- STATE ----------------
  const [timeStep, setTimeStep] = useState(0);
  const [useWorldModel, setUseWorldModel] = useState(true);
  // slider compare: 0 = without, 1 = with, intermediate = blend
  const [blend, setBlend] = useState(1);

  const agentPos = AGENT_TRAJECTORY[Math.min(timeStep, AGENT_TRAJECTORY.length - 1)];

  // Tập hợp ô đã được agent NHÌN THẤY trực tiếp (3×3 quanh mỗi vị trí trong
  // quá khứ) — đây là "memory" của agent không có world model.
  const observedCells = useMemo(() => {
    const seen = new Set<string>();
    for (let t = 0; t <= timeStep && t < AGENT_TRAJECTORY.length; t++) {
      const [r, c] = AGENT_TRAJECTORY[t];
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < MAP_ROWS && nc >= 0 && nc < MAP_COLS) {
            seen.add(`${nr},${nc}`);
          }
        }
      }
    }
    return seen;
  }, [timeStep]);

  // Bản đồ 'tưởng tượng' của agent có world model — điền địa hình có vẻ hợp lý
  // dựa trên các ô đã thấy. Demo: nếu thấy 'water' gần đó → có thể hồ nước lớn;
  // thấy 'tree' → có thể là rừng. Thực tế world model dùng neural net; ở đây
  // giả lập bằng noisy ground truth.
  const imaginedMap = useMemo(() => {
    const imagined: (Terrain | "unknown")[][] = [];
    for (let r = 0; r < MAP_ROWS; r++) {
      const row: (Terrain | "unknown")[] = [];
      for (let c = 0; c < MAP_COLS; c++) {
        if (observedCells.has(`${r},${c}`)) {
          row.push(TRUE_MAP[r][c]);
        } else {
          // Noise model: 75% đúng, 25% nhầm thành 'grass' — đơn giản hoá
          const truth = TRUE_MAP[r][c];
          const distToAgent = Math.min(
            ...AGENT_TRAJECTORY.slice(0, timeStep + 1).map(([ar, ac]) => {
              return Math.abs(r - ar) + Math.abs(c - ac);
            })
          );
          // Confidence giảm theo khoảng cách
          const conf = Math.max(0, 1 - distToAgent * 0.08);
          // Với demo, dùng hash ổn định
          const seed = (r * 31 + c * 17) % 100;
          if (seed / 100 < conf) {
            row.push(truth);
          } else {
            row.push("grass");
          }
        }
      }
      imagined.push(row);
    }
    return imagined;
  }, [observedCells, timeStep]);

  const stepForward = useCallback(() => {
    setTimeStep((t) => Math.min(t + 1, AGENT_TRAJECTORY.length - 1));
  }, []);
  const stepBack = useCallback(() => {
    setTimeStep((t) => Math.max(t - 1, 0));
  }, []);
  const resetTime = useCallback(() => setTimeStep(0), []);

  const totalCells = MAP_ROWS * MAP_COLS;
  const observedCount = observedCells.size;
  const coverage = Math.round((observedCount / totalCells) * 100);

  // -------------------- QUIZ --------------------
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question: "World model khác LLM thường ở điểm nào?",
        options: [
          "World model lớn hơn nhiều",
          "World model có biểu diễn nội tại về cách thế giới vận hành, có thể dự đoán hậu quả hành động",
          "World model chỉ xử lý ảnh, không xử lý text",
        ],
        correct: 1,
        explanation:
          "LLM thường dự đoán token tiếp theo dựa trên pattern ngôn ngữ. World model xây dựng 'mô hình thu nhỏ' của thế giới — hiểu vật lý, nhân quả, xã hội. Có thể 'tưởng tượng' hậu quả trước khi hành động.",
      },
      {
        question: "Sora (OpenAI) được coi là world model vì lý do gì?",
        options: [
          "Tạo video đẹp",
          "Học được các quy luật vật lý (trọng lực, va chạm, ánh sáng) từ video — có thể dự đoán cách vật thể tương tác",
          "Dùng nhiều GPU",
        ],
        correct: 1,
        explanation:
          "Sora không chỉ 'vẽ' video — nó học được vật lý: vật rơi xuống, nước chảy, ánh phản chiếu. Đây là dấu hiệu của world model: hiểu cách thế giới vận hành, không chỉ copy pattern.",
      },
      {
        question: "Tại sao xe tự lái VinFast cần world model?",
        options: [
          "Để tạo video quảng cáo",
          "Dự đoán hành vi người đi đường, xe khác, môi trường TRƯỚC KHI ra quyết định lái",
          "Nhận diện biển báo giao thông",
        ],
        correct: 1,
        explanation:
          "Xe tự lái cần: 'Nếu mình rẽ trái, xe kia sẽ làm gì? Người đi bộ sẽ đi đâu?' World model mô phỏng nhiều kịch bản trong 'tưởng tượng' → chọn hành động an toàn nhất.",
      },
      {
        type: "fill-blank",
        question:
          "World model hoạt động như một {blank} nội bộ của thế giới, cho phép agent đưa ra {blank} về trạng thái tương lai trước khi hành động.",
        blanks: [
          { answer: "simulation", accept: ["simulator", "mô phỏng", "mo phong"] },
          { answer: "prediction", accept: ["dự đoán", "du doan", "forecast"] },
        ],
        explanation:
          "World model = internal simulator + future state prediction. Agent 'tưởng tượng' nhiều kịch bản bằng simulation, chọn hành động tối ưu dựa trên prediction.",
      },
      {
        question:
          "Trong visualization trên, 'imagined map' khác 'observed cells' ở điểm nào?",
        options: [
          "Imagined map giống hệt ground truth",
          "Imagined map điền các ô chưa thấy dựa trên prediction của world model — có thể sai",
          "Imagined map chỉ hiển thị ô agent hiện đang đứng",
        ],
        correct: 1,
        explanation:
          "Observed cells = agent nhìn thấy trực tiếp (chắc chắn đúng). Imagined map = world model tự điền ô chưa thấy bằng prediction — có thể sai nhưng cho agent cái nhìn toàn cảnh để lập kế hoạch.",
      },
      {
        question:
          "Dreamer (RL agent của DeepMind) huấn luyện bằng cách nào?",
        options: [
          "Chơi hàng triệu game thật, học từ reward",
          "Học world model từ ít dữ liệu thật, sau đó train policy bên trong 'dream' (mô phỏng tưởng tượng)",
          "Copy nước đi của người chơi giỏi",
        ],
        correct: 1,
        explanation:
          "Dreamer = Learn world model → roll out trong 'dream' → train policy bằng trajectory tưởng tượng. Tiết kiệm data thật, nhanh hơn model-free RL. Đây là 'dream-based training loop'.",
      },
      {
        question:
          "Partial observability (quan sát một phần) tại sao quan trọng với world model?",
        options: [
          "Không quan trọng — world model luôn thấy mọi thứ",
          "Thế giới thật hầu hết là partial — robot chỉ thấy những gì camera bắt được. World model giúp 'điền' phần còn lại",
          "Làm cho mô hình đơn giản hơn",
        ],
        correct: 1,
        explanation:
          "Hầu hết agent thật chỉ có quan sát giới hạn (camera, cảm biến). World model giúp duy trì 'niềm tin' (belief state) về phần chưa thấy — như cách bạn biết có căn phòng sau cánh cửa dù chưa mở.",
      },
      {
        question:
          "Latent world model (JEPA, DreamerV3) khác pixel-level world model (Sora) ở điểm nào?",
        options: [
          "Không khác gì",
          "Latent world model dự đoán trong không gian trừu tượng (nhanh, hiệu quả). Pixel-level dự đoán từng điểm ảnh (đẹp, nhưng chậm)",
          "Pixel-level chính xác hơn tuyệt đối",
        ],
        correct: 1,
        explanation:
          "Latent (JEPA): nén observation thành vector, dự đoán vector tiếp theo — nhanh, khái quát hoá tốt, không cần chi tiết không cần thiết. Pixel (Sora): dự đoán từng pixel — đẹp mắt nhưng tốn tài nguyên và dễ 'hallucinate'.",
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
          question="Bạn đẩy cốc nước ra sát mép bàn. Không cần nhìn, bạn BIẾT chuyện gì sẽ xảy ra. AI có thể 'tưởng tượng' hậu quả tương tự không?"
          options={[
            "Không — AI chỉ xử lý text/ảnh, không hiểu vật lý",
            "Có — World Models xây dựng 'mô hình thu nhỏ' của thế giới, dự đoán hậu quả như con người",
            "Chỉ khi được lập trình từng trường hợp cụ thể",
          ]}
          correct={1}
          explanation="World Models là bước tiến lớn: AI không chỉ 'nhớ' patterns mà còn 'hiểu' cách thế giới vận hành. Giống cách bạn biết cốc sẽ rơi mà không cần thử — AI xây dựng mô hình vật lý nội tại để dự đoán. Sora, GAIA, Dreamer đều đang phát triển khả năng này."
        >
          <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
            <p
              className="mb-4 text-sm text-muted leading-relaxed"
              onFocus={() => setActiveStep(2)}
            >
              Agent (màu xanh) chỉ thấy <strong className="text-foreground">3×3 ô quanh mình</strong>.
              Bên trái là những gì agent thực sự <strong>quan sát được</strong>; bên phải là
              những gì world model <strong>tưởng tượng</strong> cho toàn bộ bản đồ. Dịch
              thanh trượt để so sánh hai cách tiếp cận.
            </p>

            <VisualizationSection>
              <WorldModelViz
                agentPos={agentPos}
                observedCells={observedCells}
                imaginedMap={imaginedMap}
                blend={blend}
                setBlend={setBlend}
                useWorldModel={useWorldModel}
                setUseWorldModel={setUseWorldModel}
                timeStep={timeStep}
                onStep={stepForward}
                onBack={stepBack}
                onReset={resetTime}
                coverage={coverage}
                observedCount={observedCount}
                totalCells={totalCells}
              />
            </VisualizationSection>

            <Callout variant="info" title="Gợi ý tương tác">
              Bấm 'Bước tiếp' để agent di chuyển. Thanh trượt cho phép pha trộn
              giữa 'raw observation' (bên trái) và 'world model imagination' (bên
              phải). Khi chỉ dùng observation, agent mù hoàn toàn với phần chưa
              thấy; khi có world model, agent có ý niệm về toàn cảnh.
            </Callout>
          </LessonSection>

          <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
            <AhaMoment>
              <p>
                Con người <strong>không cần thử mọi thứ để hiểu thế giới</strong>{" "}
                — bạn biết lửa nóng, đá trơn, cốc rơi. Đây là vì não có{" "}
                <strong>world model</strong>. AI đang học cách tương tự: Sora học
                vật lý từ video, Dreamer tự chơi trong 'giấc mơ' để luyện chính
                sách, GAIA mô phỏng giao thông. Đây là bước tiến từ 'AI biết nói'
                sang <strong>'AI biết nghĩ trước khi hành động'</strong>.
              </p>
            </AhaMoment>
          </LessonSection>

          <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
            <InlineChallenge
              question="Xe tự lái VinFast đang chạy 60km/h, phía trước có người sang đường. World model cần dự đoán gì để ra quyết định?"
              options={[
                "Chỉ cần nhận diện người và phanh",
                "Dự đoán quỹ đạo người, tốc độ, ý định, mô phỏng nhiều kịch bản → chọn hành động an toàn nhất",
                "Tra cứu luật giao thông",
              ]}
              correct={1}
              explanation="World model cho self-driving: dự đoán vị trí người sau 0.5s / 1s / 2s, mô phỏng kịch bản (người dừng/đi/chạy), đánh giá rủi ro mỗi hành động (phanh/lách/giữ tốc). Không đủ thời gian cho thử-và-sai ngoài đời thật!"
            />

            <div className="mt-4">
              <InlineChallenge
                question="Robot hút bụi chỉ có cảm biến hồng ngoại (thấy ~30cm quanh nó). Làm sao để lập kế hoạch dọn cả phòng?"
                options={[
                  "Chạy ngẫu nhiên đến khi dọn hết",
                  "Xây world model: ghép các quan sát local thành bản đồ toàn cục, dự đoán vùng chưa dọn, lập kế hoạch tối ưu",
                  "Không làm được — robot phải có camera 360°",
                ]}
                correct={1}
                explanation="SLAM + world model: robot ghép các quan sát partial thành bản đồ (map building), sau đó dùng world model dự đoán phần chưa đi qua. Đây chính là nguyên lý Roborock, iRobot, Ecovacs."
              />
            </div>
          </LessonSection>

          <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
            <ExplanationSection>
              <p>
                <strong>World Models</strong> là AI xây dựng biểu diễn nội tại
                về cách thế giới vận hành — có thể dự đoán hậu quả hành động
                trước khi thực hiện. Đây là bước tiến bổ sung cho{" "}
                <TopicLink slug="reasoning-models">reasoning models</TopicLink>{" "}
                (suy luận bằng ngôn ngữ) và là 'simulator tưởng tượng' cho các
                tác tử{" "}
                <TopicLink slug="q-learning">reinforcement learning</TopicLink>{" "}
                lập kế hoạch.
              </p>
              <p>
                <strong>Core loop:</strong>
              </p>
              <LaTeX block>
                {
                  "\\hat{s}_{t+1} = f_{\\text{world}}(s_t, a_t) \\quad \\text{(dự đoán state tiếp theo)}"
                }
              </LaTeX>
              <LaTeX block>
                {
                  "a^* = \\arg\\max_a \\sum_{t} r(\\hat{s}_t, a_t) \\quad \\text{(chọn action tốt nhất trong 'tưởng tượng')}"
                }
              </LaTeX>

              <p>
                <strong>Belief state & partial observability:</strong> Khi agent
                chỉ thấy một phần (observation <em>o</em>), nó duy trì belief
                state <em>b(s)</em> — phân phối xác suất trên các state có thể.
                World model cập nhật belief theo action và observation mới, rồi
                plan trên belief đó.
              </p>
              <LaTeX block>
                {
                  "b_{t+1}(s') = \\eta \\cdot p(o_{t+1}|s') \\sum_s p(s'|s, a_t) \\, b_t(s)"
                }
              </LaTeX>

              <Callout variant="tip" title="Video Generation = World Modeling">
                Sora không chỉ tạo video đẹp — nó học được vật lý: vật rơi do
                trọng lực, nước chảy theo địa hình, ánh phản chiếu. Đây là dấu
                hiệu của world model mới: học physics từ pixel thay vì phương
                trình. Ý nghĩa lâu dài: có thể dùng 'video world model' làm
                simulator train robot ảo trước khi deploy thật.
              </Callout>

              <Callout variant="tip" title="Dream-based training (Dreamer)">
                Dreamer v3 của DeepMind: (1) thu thập ít data thật, (2) train
                world model, (3) policy học hoàn toàn BÊN TRONG imagination —
                rollout trajectory tưởng tượng. Nhờ vậy đạt SOTA trên 150+ task
                Atari/DMC với ít sample hơn hàng chục lần so với model-free RL.
              </Callout>

              <Callout variant="warning" title="Giới hạn: compounding error">
                World model không hoàn hảo. Khi rollout nhiều bước, sai số tích
                luỹ — bước 1 sai chút → bước 2 sai nhiều hơn → bước 50 hoàn toàn
                vô nghĩa. Đây là 'compounding error', lý do agent dựa 100% vào
                'dream' sẽ thất bại. Thường phải mix dream + real world data.
              </Callout>

              <Callout variant="info" title="World model ≠ Simulator cổ điển">
                Simulator truyền thống (PyBullet, CARLA) dùng phương trình vật
                lý viết tay. World model học từ data — có thể mô phỏng cả những
                hiện tượng khó lập trình (chuyển động quần áo, nước, đám đông).
                Nhược điểm: 'hallucination' — tạo ra thế giới trông hợp lý nhưng
                sai vật lý (vật biến mất, người có 3 tay).
              </Callout>

              <p>
                <strong>3 hướng tiếp cận:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>Learned Simulators:</strong> Neural network học physics
                  từ data (Sora, GAIA-1 của Wayve)
                </li>
                <li>
                  <strong>Latent World Models:</strong> Mô hình trong latent
                  space, không render pixel (JEPA của Meta, DreamerV3)
                </li>
                <li>
                  <strong>Foundation World Models:</strong> Train trên nhiều
                  domain, transfer cho task mới (Genie của DeepMind)
                </li>
              </ul>

              <CodeBlock
                language="python"
                title="World Model concept: dự đoán state tiếp theo"
              >
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
        """'Tưởng tượng' nhiều bước tương lai (rollout in dream)."""
        states, rewards = [state], []
        for action in actions_sequence:
            state, reward = self.forward(state, action)
            states.append(state)
            rewards.append(reward)
        return states, rewards  # Trajectory trong 'tưởng tượng'`}
              </CodeBlock>

              <CodeBlock
                language="python"
                title="Dream-based training loop (Dreamer style)"
              >
                {`import torch
from torch.optim import Adam

world_model = SimpleWorldModel()
policy = PolicyNetwork()
value = ValueNetwork()

opt_wm = Adam(world_model.parameters(), lr=1e-4)
opt_pi = Adam(policy.parameters(), lr=3e-5)

replay_buffer = []  # kinh nghiệm từ môi trường thật

for epoch in range(10_000):
    # ----- GIAI ĐOẠN 1: THU THẬP DATA THẬT -----
    state, _ = env.reset()
    done = False
    while not done:
        action = policy(state).sample()
        next_state, reward, done, _, _ = env.step(action)
        replay_buffer.append((state, action, reward, next_state))
        state = next_state

    # ----- GIAI ĐOẠN 2: HUẤN LUYỆN WORLD MODEL -----
    batch = sample(replay_buffer, 256)
    s, a, r, s_next = stack(batch)
    pred_s, pred_r = world_model(s, a)
    loss_wm = (pred_s - s_next).pow(2).mean() + (pred_r - r).pow(2).mean()
    opt_wm.zero_grad(); loss_wm.backward(); opt_wm.step()

    # ----- GIAI ĐOẠN 3: TRAIN POLICY TRONG 'GIẤC MƠ' -----
    # Không gọi env thật — tất cả diễn ra bên trong world model!
    dream_states = [sample_start_state(replay_buffer)]
    log_probs, rewards = [], []
    for _ in range(horizon := 15):
        dist = policy(dream_states[-1])
        a = dist.sample()
        log_probs.append(dist.log_prob(a))
        s_next, r = world_model(dream_states[-1], a)
        dream_states.append(s_next)
        rewards.append(r)
    # Policy gradient trên trajectory tưởng tượng
    returns = discounted_return(rewards, gamma=0.99)
    loss_pi = -(torch.stack(log_probs) * returns.detach()).mean()
    opt_pi.zero_grad(); loss_pi.backward(); opt_pi.step()
# → Policy đã tốt hơn MÀ KHÔNG cần tương tác thêm với env thật`}
              </CodeBlock>

              <CollapsibleDetail title="Chi tiết: JEPA và học không cần pixel">
                <p className="text-sm leading-relaxed mt-2">
                  Yann LeCun lập luận: dự đoán từng pixel là lãng phí — quá
                  nhiều chi tiết không quan trọng (hình dáng chính xác của mỗi
                  chiếc lá). Joint Embedding Predictive Architecture (JEPA)
                  encode observation thành vector trừu tượng, rồi dự đoán vector
                  tiếp theo. Kết quả: nhanh hơn, khái quát tốt hơn, ít
                  hallucinate. I-JEPA và V-JEPA (cho video) đã chứng minh trên
                  ImageNet và Kinetics. Đây là con đường Meta đi khác với
                  OpenAI/Sora.
                </p>
              </CollapsibleDetail>

              <CollapsibleDetail title="Chi tiết: World models trong robot thật">
                <p className="text-sm leading-relaxed mt-2">
                  Tesla FSD v12, Wayve GAIA-1, và Covariant RFM đều dựa trên
                  world model. Bài toán: robot phải quyết định an toàn trong
                  realtime khi chỉ có camera + một số sensor. World model (1) dự
                  đoán hành vi các agent khác (xe, người đi bộ), (2) mô phỏng
                  kết quả nhiều hành động của chính mình, (3) chọn hành động
                  tối ưu theo cost (an toàn + hiệu quả). Thử thách lớn nhất: độ
                  chính xác dưới điều kiện khó (mưa, đêm, đường xa lạ).
                </p>
              </CollapsibleDetail>

              <p>
                <strong>Chuỗi tiến hoá của world model:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>2018 — World Models (Ha & Schmidhuber):</strong> VAE +
                  RNN dự đoán frame tiếp theo trong game CarRacing. Bài paper
                  đầu tiên đặt tên 'world model' và chứng minh khái niệm dream
                  training.
                </li>
                <li>
                  <strong>2020 — Dreamer (Hafner et al.):</strong> Latent
                  dynamics model + policy học qua backprop xuyên qua imagination.
                  Vượt SOTA trên DeepMind Control Suite.
                </li>
                <li>
                  <strong>2023 — DreamerV3:</strong> Giải Minecraft không cần
                  reward shaping thủ công — lần đầu một agent tự học thu thập
                  kim cương.
                </li>
                <li>
                  <strong>2024 — Sora, Genie, GAIA-1:</strong> Video generation
                  khổng lồ, có thể 'chạy' như game engine neural.
                </li>
                <li>
                  <strong>Tương lai:</strong> Foundation world model đa modal
                  (text + image + video + action) — backbone chung cho robot,
                  agent, sim-to-real.
                </li>
              </ul>

              <p>
                <strong>Mối liên hệ với con người:</strong> Khoa học nhận thức
                cho rằng não người có 'generative model' dự đoán cảm giác tiếp
                theo (predictive coding). Khi dự đoán sai, não chú ý — đó là cơ
                chế học. World model của AI đang tiến tới mô hình tương tự: học
                bằng surprise, tập trung vào phần khó dự đoán.
              </p>
            </ExplanationSection>
          </LessonSection>

          <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
            <MiniSummary
              points={[
                "World model = biểu diễn nội tại về cách thế giới vận hành — dự đoán hậu quả hành động trước khi thực hiện.",
                "Giải quyết partial observability: agent chỉ thấy một phần, world model 'điền' phần còn lại.",
                "Dream-based training: train policy trong 'tưởng tượng' của world model — tiết kiệm data thật.",
                "Hai nhánh chính: pixel-level (Sora) vs latent (JEPA, DreamerV3). Đánh đổi giữa chi tiết và tốc độ.",
                "Ứng dụng: xe tự lái (dự đoán hành vi), robot (lập kế hoạch), game engine (Genie), sinh video (Sora).",
                "Giới hạn: compounding error khi rollout dài, hallucination, khó đánh giá 'độ đúng vật lý' của mô phỏng.",
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
interface WorldModelVizProps {
  agentPos: [number, number];
  observedCells: Set<string>;
  imaginedMap: (Terrain | "unknown")[][];
  blend: number;
  setBlend: (n: number) => void;
  useWorldModel: boolean;
  setUseWorldModel: (v: boolean) => void;
  timeStep: number;
  onStep: () => void;
  onBack: () => void;
  onReset: () => void;
  coverage: number;
  observedCount: number;
  totalCells: number;
}

function WorldModelViz({
  agentPos,
  observedCells,
  imaginedMap,
  blend,
  setBlend,
  useWorldModel,
  setUseWorldModel,
  timeStep,
  onStep,
  onBack,
  onReset,
  coverage,
  observedCount,
  totalCells,
}: WorldModelVizProps) {
  const cellSize = 36;
  const width = MAP_COLS * cellSize;
  const height = MAP_ROWS * cellSize;

  const [ar, ac] = agentPos;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 justify-center items-center">
        <button
          type="button"
          onClick={onBack}
          disabled={timeStep === 0}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-card border border-border text-muted hover:text-foreground disabled:opacity-40"
        >
          ← Bước trước
        </button>
        <button
          type="button"
          onClick={onStep}
          disabled={timeStep >= AGENT_TRAJECTORY.length - 1}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-accent text-white disabled:opacity-40"
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
        <div className="w-px h-5 bg-border mx-1" />
        <span className="text-xs text-muted">
          Thời điểm t = {timeStep} / {AGENT_TRAJECTORY.length - 1}
        </span>
      </div>

      <div className="flex flex-wrap gap-3 items-center justify-center text-xs">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={useWorldModel}
            onChange={(e) => setUseWorldModel(e.target.checked)}
            className="accent-emerald-500"
          />
          <span className="text-foreground">Bật world model</span>
        </label>
        <div className="flex items-center gap-2 min-w-[220px]">
          <span className="text-muted">Observation</span>
          <input
            type="range"
            min={0}
            max={100}
            value={blend * 100}
            onChange={(e) => setBlend(Number(e.target.value) / 100)}
            className="flex-1 accent-accent"
            disabled={!useWorldModel}
          />
          <span className="text-muted">Imagination</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LEFT: What agent actually sees */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">
              Quan sát thực tế (3×3 quanh agent)
            </span>
            <span className="text-muted">
              {observedCount}/{totalCells} ô ({coverage}%)
            </span>
          </div>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full rounded-lg bg-surface/40 border border-border"
          >
            {TRUE_MAP.map((row, r) =>
              row.map((cell, c) => {
                const visible = observedCells.has(`${r},${c}`);
                const inViewNow =
                  Math.abs(r - ar) <= 1 && Math.abs(c - ac) <= 1;
                const fill = visible ? TERRAIN_COLORS[cell] : "#0f172a";
                return (
                  <g key={`${r}-${c}`}>
                    <rect
                      x={c * cellSize}
                      y={r * cellSize}
                      width={cellSize}
                      height={cellSize}
                      fill={fill}
                      stroke={inViewNow ? "#22d3ee" : "#334155"}
                      strokeWidth={inViewNow ? 2 : 0.5}
                    />
                    {!visible && (
                      <text
                        x={c * cellSize + cellSize / 2}
                        y={r * cellSize + cellSize / 2 + 4}
                        textAnchor="middle"
                        fontSize={14}
                        fill="#475569"
                      >
                        ?
                      </text>
                    )}
                    {visible && cell === "goal" && (
                      <text
                        x={c * cellSize + cellSize / 2}
                        y={r * cellSize + cellSize / 2 + 5}
                        textAnchor="middle"
                        fontSize={14}
                        fill="#fbbf24"
                        fontWeight="bold"
                      >
                        ★
                      </text>
                    )}
                    {visible && cell === "start" && (
                      <text
                        x={c * cellSize + cellSize / 2}
                        y={r * cellSize + cellSize / 2 + 5}
                        textAnchor="middle"
                        fontSize={11}
                        fill="#e9d5ff"
                        fontWeight="bold"
                      >
                        S
                      </text>
                    )}
                  </g>
                );
              })
            )}
            {/* Agent */}
            <motion.circle
              cx={ac * cellSize + cellSize / 2}
              cy={ar * cellSize + cellSize / 2}
              r={cellSize * 0.35}
              fill="#3b82f6"
              stroke="#0f172a"
              strokeWidth={2}
              animate={{
                cx: ac * cellSize + cellSize / 2,
                cy: ar * cellSize + cellSize / 2,
              }}
              transition={{ duration: 0.3 }}
            />
          </svg>
          <p className="text-[11px] text-muted leading-relaxed">
            Khung xanh cyan = vùng agent đang nhìn (3×3). Ô tối với '?' =
            hoàn toàn chưa biết.
          </p>
        </div>

        {/* RIGHT: Imagined (world model) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">
              Bản đồ tưởng tượng (world model)
            </span>
            <span className="text-muted">
              opacity: {Math.round(blend * 100)}%
            </span>
          </div>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full rounded-lg bg-surface/40 border border-border"
          >
            {imaginedMap.map((row, r) =>
              row.map((cell, c) => {
                const observed = observedCells.has(`${r},${c}`);
                const baseColor =
                  cell === "unknown"
                    ? "#0f172a"
                    : TERRAIN_COLORS[cell as Terrain];
                return (
                  <g key={`${r}-${c}`}>
                    <rect
                      x={c * cellSize}
                      y={r * cellSize}
                      width={cellSize}
                      height={cellSize}
                      fill={baseColor}
                      opacity={useWorldModel ? (observed ? 1 : blend) : 0.05}
                      stroke="#334155"
                      strokeWidth={0.5}
                    />
                    {observed && (
                      <rect
                        x={c * cellSize + 1}
                        y={r * cellSize + 1}
                        width={cellSize - 2}
                        height={cellSize - 2}
                        fill="none"
                        stroke="#22d3ee"
                        strokeWidth={1}
                        opacity={0.5}
                      />
                    )}
                    {useWorldModel && cell === "goal" && (
                      <text
                        x={c * cellSize + cellSize / 2}
                        y={r * cellSize + cellSize / 2 + 5}
                        textAnchor="middle"
                        fontSize={14}
                        fill="#fbbf24"
                        fontWeight="bold"
                        opacity={observed ? 1 : blend}
                      >
                        ★
                      </text>
                    )}
                  </g>
                );
              })
            )}
            <motion.circle
              cx={ac * cellSize + cellSize / 2}
              cy={ar * cellSize + cellSize / 2}
              r={cellSize * 0.35}
              fill="#3b82f6"
              stroke="#0f172a"
              strokeWidth={2}
              animate={{
                cx: ac * cellSize + cellSize / 2,
                cy: ar * cellSize + cellSize / 2,
              }}
              transition={{ duration: 0.3 }}
            />
          </svg>
          <p className="text-[11px] text-muted leading-relaxed">
            Ô viền cyan = agent đã quan sát trực tiếp. Ô mờ = world model
            tưởng tượng — có thể sai nhưng giúp lập kế hoạch toàn cục.
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center text-[11px]">
        {(Object.keys(TERRAIN_COLORS) as Terrain[]).map((t) => (
          <div key={t} className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded"
              style={{
                background: TERRAIN_COLORS[t],
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: "#334155",
              }}
            />
            <span className="text-muted">{TERRAIN_LABELS[t]}</span>
          </div>
        ))}
      </div>

      {/* Dream-based training diagram */}
      <div className="rounded-lg border border-border bg-card/60 p-4 space-y-3">
        <div className="text-sm font-semibold text-foreground">
          Dream-based training loop
        </div>
        <svg viewBox="0 0 640 140" className="w-full max-w-3xl mx-auto">
          {/* 3 boxes + arrows */}
          <g>
            <rect
              x={10}
              y={40}
              width={170}
              height={60}
              rx={10}
              fill="#1e293b"
              stroke="#3b82f6"
              strokeWidth={2}
            />
            <text
              x={95}
              y={62}
              textAnchor="middle"
              fill="#93c5fd"
              fontSize={11}
              fontWeight="bold"
            >
              1. Thế giới thật
            </text>
            <text x={95} y={80} textAnchor="middle" fill="#94a3b8" fontSize={11}>
              Thu thập ít kinh nghiệm
            </text>
            <text x={95} y={92} textAnchor="middle" fill="#64748b" fontSize={11}>
              (s, a, r, s&apos;)
            </text>
          </g>
          <text x={195} y={73} fill="#f59e0b" fontSize={16}>
            →
          </text>
          <g>
            <rect
              x={215}
              y={40}
              width={170}
              height={60}
              rx={10}
              fill="#1e293b"
              stroke="#22c55e"
              strokeWidth={2}
            />
            <text
              x={300}
              y={62}
              textAnchor="middle"
              fill="#86efac"
              fontSize={11}
              fontWeight="bold"
            >
              2. Train world model
            </text>
            <text x={300} y={80} textAnchor="middle" fill="#94a3b8" fontSize={11}>
              f(s, a) → s&apos;, r
            </text>
            <text x={300} y={92} textAnchor="middle" fill="#64748b" fontSize={11}>
              Neural network
            </text>
          </g>
          <text x={400} y={73} fill="#f59e0b" fontSize={16}>
            →
          </text>
          <g>
            <rect
              x={420}
              y={40}
              width={200}
              height={60}
              rx={10}
              fill="#1e293b"
              stroke="#a855f7"
              strokeWidth={2}
            />
            <text
              x={520}
              y={62}
              textAnchor="middle"
              fill="#d8b4fe"
              fontSize={11}
              fontWeight="bold"
            >
              3. Train policy trong dream
            </text>
            <text x={520} y={80} textAnchor="middle" fill="#94a3b8" fontSize={11}>
              Rollout tưởng tượng
            </text>
            <text x={520} y={92} textAnchor="middle" fill="#64748b" fontSize={11}>
              Không tốn env thật
            </text>
          </g>
          {/* Loop arrow */}
          <path
            d="M 520 105 Q 520 130 260 130 Q 95 130 95 105"
            stroke="#f59e0b"
            strokeWidth={1.5}
            fill="none"
            strokeDasharray="4 3"
            markerEnd="url(#arrowhead)"
          />
          <text x={320} y={128} textAnchor="middle" fill="#f59e0b" fontSize={11}>
            lặp lại
          </text>
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="4"
              orient="auto"
            >
              <polygon points="0 0, 8 4, 0 8" fill="#f59e0b" />
            </marker>
          </defs>
        </svg>
        <p className="text-xs text-muted text-center">
          Policy được cải thiện chủ yếu nhờ rollout trong 'dream' — chỉ cần
          lượng nhỏ data thật để giữ world model chính xác.
        </p>
      </div>

      {/* Compare panel: without vs with world model */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3">
          <div className="font-semibold text-red-400 mb-2">
            Không có world model
          </div>
          <ul className="space-y-1 text-muted leading-relaxed list-disc list-inside">
            <li>Chỉ biết vùng 3×3 đang quan sát</li>
            <li>Không thể lập kế hoạch xa</li>
            <li>Phải thử từng hướng trong đời thực</li>
            <li>Tốn sample, tốn thời gian</li>
            <li>Rủi ro cao trong môi trường nguy hiểm</li>
          </ul>
        </div>
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3">
          <div className="font-semibold text-emerald-400 mb-2">
            Có world model
          </div>
          <ul className="space-y-1 text-muted leading-relaxed list-disc list-inside">
            <li>Có bản đồ 'tưởng tượng' toàn bộ</li>
            <li>Plan nhiều bước trước khi đi</li>
            <li>Rollout trong imagination, không tốn env thật</li>
            <li>Sample-efficient: ít data thật hơn</li>
            <li>Đánh giá rủi ro trước khi thử</li>
          </ul>
        </div>
      </div>

      {/* Pipeline: observation -> belief -> action */}
      <div className="rounded-lg border border-border bg-card/60 p-4 space-y-3">
        <div className="text-sm font-semibold text-foreground">
          Pipeline quyết định của agent có world model
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="rounded-md bg-surface/60 border border-border p-3">
            <div className="text-accent font-semibold">1. Observation</div>
            <div className="text-muted mt-1 leading-relaxed">
              o<sub>t</sub>: hình ảnh 3×3 quanh agent (partial).
            </div>
          </div>
          <div className="rounded-md bg-surface/60 border border-border p-3">
            <div className="text-accent font-semibold">2. Belief update</div>
            <div className="text-muted mt-1 leading-relaxed">
              b<sub>t</sub>: phân phối xác suất trên toàn bản đồ, cập nhật theo
              observation mới.
            </div>
          </div>
          <div className="rounded-md bg-surface/60 border border-border p-3">
            <div className="text-accent font-semibold">3. Imagination</div>
            <div className="text-muted mt-1 leading-relaxed">
              Rollout nhiều hành động giả định trong world model → đánh giá
              reward.
            </div>
          </div>
          <div className="rounded-md bg-surface/60 border border-border p-3">
            <div className="text-accent font-semibold">4. Action</div>
            <div className="text-muted mt-1 leading-relaxed">
              a<sub>t</sub>: hành động tối đa hoá expected return trên
              imagination.
            </div>
          </div>
        </div>
      </div>

      {/* Mini-timeline of milestone papers */}
      <div className="rounded-lg border border-border bg-card/60 p-4 space-y-2">
        <div className="text-sm font-semibold text-foreground">
          Timeline các cột mốc (2018 → nay)
        </div>
        <ol className="list-decimal list-inside text-xs space-y-1 leading-relaxed text-muted">
          <li>
            <span className="text-foreground font-semibold">2018:</span> Ha &
            Schmidhuber giới thiệu 'World Models' — VAE + MDN-RNN học dynamics
            của game đua xe.
          </li>
          <li>
            <span className="text-foreground font-semibold">2020:</span>{" "}
            Hafner công bố Dreamer — backprop xuyên qua latent dynamics.
          </li>
          <li>
            <span className="text-foreground font-semibold">2022:</span> DayDreamer —
            robot vật lý học bơi/đi trong thế giới thật chỉ với vài giờ kinh
            nghiệm nhờ dream-based RL.
          </li>
          <li>
            <span className="text-foreground font-semibold">2023:</span>{" "}
            DreamerV3 giải Minecraft end-to-end, GAIA-1 của Wayve mô phỏng
            lái xe.
          </li>
          <li>
            <span className="text-foreground font-semibold">2024:</span> Sora,
            Veo, Genie — world model khổng lồ xử lý video + có action
            controllable.
          </li>
          <li>
            <span className="text-foreground font-semibold">2025-nay:</span>{" "}
            Xu hướng foundation world model đa modal (JEPA2, Cosmos của
            NVIDIA) làm nền cho robot đa dạng.
          </li>
        </ol>
      </div>

      {/* Trade-off chart */}
      <div className="rounded-lg border border-border bg-card/60 p-4 space-y-3">
        <div className="text-sm font-semibold text-foreground">
          So sánh nhanh: latent vs pixel-level
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-muted border-b border-border">
              <tr>
                <th className="py-2 pr-3 font-semibold">Tiêu chí</th>
                <th className="py-2 pr-3 font-semibold text-emerald-400">
                  Latent (JEPA, DreamerV3)
                </th>
                <th className="py-2 font-semibold text-blue-400">
                  Pixel-level (Sora, GAIA)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-muted">
              <tr>
                <td className="py-2 pr-3 text-foreground">Tốc độ rollout</td>
                <td className="py-2 pr-3">Rất nhanh (vector)</td>
                <td className="py-2">Chậm (mỗi pixel)</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 text-foreground">Dễ train policy</td>
                <td className="py-2 pr-3">Dễ — không gian nhỏ</td>
                <td className="py-2">Khó — không gian lớn</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 text-foreground">
                  Tương tác với con người
                </td>
                <td className="py-2 pr-3">Khó trực quan hoá</td>
                <td className="py-2">Dễ — ra video xem được</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 text-foreground">
                  Sai số dài hạn
                </td>
                <td className="py-2 pr-3">Ít compounding</td>
                <td className="py-2">Nhiều hallucinate</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
