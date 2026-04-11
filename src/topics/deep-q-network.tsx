"use client";

import { useState, useCallback } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "deep-q-network",
  title: "Deep Q-Network (DQN)",
  titleVi: "Mạng Q sâu",
  description:
    "Kết hợp Q-Learning với mạng nơ-ron sâu để xử lý không gian trạng thái lớn",
  category: "reinforcement-learning",
  tags: ["deep-rl", "atari", "experience-replay"],
  difficulty: "intermediate",
  relatedSlugs: ["q-learning", "actor-critic", "mlp"],
  vizType: "interactive",
};

interface Experience {
  state: number[];
  action: number;
  reward: number;
  nextState: number[];
}

const ACTIONS = ["Trái", "Phải", "Lên", "Xuống"];
const ACTION_COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b"];

function randomQValues(): number[] {
  return ACTIONS.map(() => Math.round((Math.random() * 10 - 3) * 10) / 10);
}

function randomState(): number[] {
  return [
    Math.round(Math.random() * 100) / 100,
    Math.round(Math.random() * 100) / 100,
    Math.round(Math.random() * 100) / 100,
    Math.round(Math.random() * 100) / 100,
  ];
}

export default function DeepQNetworkTopic() {
  const [qOutputs, setQOutputs] = useState<number[]>(() => randomQValues());
  const [currentState, setCurrentState] = useState<number[]>(() => randomState());
  const [replayBuffer, setReplayBuffer] = useState<Experience[]>([]);
  const [trainStep, setTrainStep] = useState(0);
  const [selectedAction, setSelectedAction] = useState<number | null>(null);
  const [showTarget, setShowTarget] = useState(false);

  const feedForward = useCallback(() => {
    const newState = randomState();
    const newQ = randomQValues();
    const bestAction = newQ.indexOf(Math.max(...newQ));

    const exp: Experience = {
      state: currentState,
      action: bestAction,
      reward: Math.round((Math.random() * 6 - 1) * 10) / 10,
      nextState: newState,
    };

    setCurrentState(newState);
    setQOutputs(newQ);
    setSelectedAction(bestAction);
    setReplayBuffer((prev) => [...prev.slice(-7), exp]);
    setTrainStep((s) => s + 1);
  }, [currentState]);

  const reset = useCallback(() => {
    setQOutputs(randomQValues());
    setCurrentState(randomState());
    setReplayBuffer([]);
    setTrainStep(0);
    setSelectedAction(null);
    setShowTarget(false);
  }, []);

  const neuronRadius = 14;
  const layerX = [80, 220, 360, 500];
  const inputNeurons = [60, 120, 180, 240];
  const hiddenNeurons1 = [50, 110, 170, 230, 290];
  const hiddenNeurons2 = [70, 140, 210, 280];
  const outputNeurons = [75, 135, 195, 255];

  const bestAction = qOutputs.indexOf(Math.max(...qOutputs));

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn có một <strong>cuốn sổ tay</strong> ghi lại đánh giá
          từng quán ăn (Q-table). Nhưng thành phố có <strong>hàng triệu quán</strong>{" "}
          — không thể ghi hết! Bạn nâng cấp lên một{" "}
          <strong>ứng dụng thông minh (mạng nơ-ron)</strong> có khả năng{" "}
          <strong>suy luận</strong>: dù chưa đến quán mới, app dự đoán được bạn có
          thích hay không dựa trên các đặc điểm (giá cả, khu vực, loại món...).
        </p>
        <p>
          <strong>Deep Q-Network (DQN)</strong> thay thế Q-table bằng mạng nơ-ron sâu,
          cho phép xử lý không gian trạng thái khổng lồ — ví dụ hình ảnh từ trò chơi
          Atari với hàng triệu pixel!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <p className="mb-3 text-sm text-muted">
          Nhấn &quot;Truyền tiếp&quot; để xem mạng nơ-ron nhận trạng thái đầu vào và
          xuất Q-value cho mỗi hành động. Kinh nghiệm được lưu vào Replay Buffer.
        </p>

        {/* Neural Network Diagram */}
        <svg
          viewBox="0 0 580 340"
          className="w-full rounded-lg border border-border bg-background"
        >
          {/* Layer labels */}
          <text x={layerX[0]} y={25} textAnchor="middle" fontSize="11" fill="currentColor" fontWeight={600}>
            Trạng thái
          </text>
          <text x={layerX[1]} y={25} textAnchor="middle" fontSize="11" fill="currentColor" fontWeight={600}>
            Ẩn 1
          </text>
          <text x={layerX[2]} y={25} textAnchor="middle" fontSize="11" fill="currentColor" fontWeight={600}>
            Ẩn 2
          </text>
          <text x={layerX[3]} y={25} textAnchor="middle" fontSize="11" fill="currentColor" fontWeight={600}>
            Q-values
          </text>

          {/* Connections: Input -> Hidden1 */}
          {inputNeurons.map((iy, i) =>
            hiddenNeurons1.map((hy, j) => (
              <line
                key={`ih1-${i}-${j}`}
                x1={layerX[0] + neuronRadius}
                y1={iy}
                x2={layerX[1] - neuronRadius}
                y2={hy}
                stroke="#94a3b8"
                strokeWidth={0.5}
                opacity={0.4}
              />
            ))
          )}

          {/* Connections: Hidden1 -> Hidden2 */}
          {hiddenNeurons1.map((hy1, i) =>
            hiddenNeurons2.map((hy2, j) => (
              <line
                key={`h1h2-${i}-${j}`}
                x1={layerX[1] + neuronRadius}
                y1={hy1}
                x2={layerX[2] - neuronRadius}
                y2={hy2}
                stroke="#94a3b8"
                strokeWidth={0.5}
                opacity={0.4}
              />
            ))
          )}

          {/* Connections: Hidden2 -> Output */}
          {hiddenNeurons2.map((hy, i) =>
            outputNeurons.map((oy, j) => (
              <line
                key={`h2o-${i}-${j}`}
                x1={layerX[2] + neuronRadius}
                y1={hy}
                x2={layerX[3] - neuronRadius}
                y2={oy}
                stroke={j === bestAction ? ACTION_COLORS[j] : "#94a3b8"}
                strokeWidth={j === bestAction ? 2 : 0.5}
                opacity={j === bestAction ? 0.8 : 0.4}
              />
            ))
          )}

          {/* Input neurons */}
          {inputNeurons.map((y, i) => (
            <g key={`in-${i}`}>
              <circle cx={layerX[0]} cy={y} r={neuronRadius} fill="#dbeafe" stroke="#3b82f6" strokeWidth={1.5} />
              <text x={layerX[0]} y={y + 4} textAnchor="middle" fontSize="9" fill="#1e40af" fontWeight={600}>
                {currentState[i].toFixed(2)}
              </text>
            </g>
          ))}

          {/* Hidden1 neurons */}
          {hiddenNeurons1.map((y, i) => (
            <g key={`h1-${i}`}>
              <circle cx={layerX[1]} cy={y} r={neuronRadius} fill="#f1f5f9" stroke="#64748b" strokeWidth={1.5} />
              <text x={layerX[1]} y={y + 4} textAnchor="middle" fontSize="9" fill="#475569">
                ReLU
              </text>
            </g>
          ))}

          {/* Hidden2 neurons */}
          {hiddenNeurons2.map((y, i) => (
            <g key={`h2-${i}`}>
              <circle cx={layerX[2]} cy={y} r={neuronRadius} fill="#f1f5f9" stroke="#64748b" strokeWidth={1.5} />
              <text x={layerX[2]} y={y + 4} textAnchor="middle" fontSize="9" fill="#475569">
                ReLU
              </text>
            </g>
          ))}

          {/* Output neurons (Q-values) */}
          {outputNeurons.map((y, i) => (
            <g key={`out-${i}`}>
              <circle
                cx={layerX[3]}
                cy={y}
                r={neuronRadius}
                fill={i === bestAction ? ACTION_COLORS[i] + "33" : "#f8fafc"}
                stroke={i === bestAction ? ACTION_COLORS[i] : "#94a3b8"}
                strokeWidth={i === bestAction ? 2.5 : 1.5}
              />
              <text
                x={layerX[3]}
                y={y + 4}
                textAnchor="middle"
                fontSize="9"
                fill={i === bestAction ? ACTION_COLORS[i] : "#475569"}
                fontWeight={i === bestAction ? 700 : 400}
              >
                {qOutputs[i].toFixed(1)}
              </text>
              {/* Action label on the right */}
              <text x={layerX[3] + 22} y={y + 4} fontSize="9" fill={ACTION_COLORS[i]} fontWeight={600}>
                {ACTIONS[i]}
              </text>
              {i === bestAction && (
                <text x={layerX[3] + 22} y={y + 16} fontSize="8" fill={ACTION_COLORS[i]}>
                  ★ chọn
                </text>
              )}
            </g>
          ))}

          {/* Target network indicator */}
          {showTarget && (
            <g>
              <rect x={155} y={305} width={270} height={28} rx={6} fill="#fef3c7" stroke="#f59e0b" strokeWidth={1} strokeDasharray="4 2" />
              <text x={290} y={323} textAnchor="middle" fontSize="10" fill="#92400e" fontWeight={600}>
                Target Network (bản sao đông cứng, cập nhật chậm)
              </text>
            </g>
          )}
        </svg>

        {/* Experience Replay Buffer */}
        <div className="mt-4">
          <p className="text-sm font-medium text-foreground mb-2">
            Replay Buffer ({replayBuffer.length}/8 kinh nghiệm):
          </p>
          <div className="flex gap-2 flex-wrap">
            {replayBuffer.map((exp, i) => (
              <div
                key={i}
                className="rounded-md border border-border bg-background/50 px-2 py-1 text-xs text-muted"
              >
                a={ACTIONS[exp.action]} r={exp.reward > 0 ? "+" : ""}{exp.reward}
              </div>
            ))}
            {replayBuffer.length === 0 && (
              <span className="text-xs text-muted italic">Chưa có kinh nghiệm nào</span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
            <p className="text-xs text-muted">Bước huấn luyện</p>
            <p className="text-lg font-bold text-foreground">{trainStep}</p>
          </div>
          <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
            <p className="text-xs text-muted">Hành động chọn</p>
            <p className="text-lg font-bold text-foreground">
              {selectedAction !== null ? ACTIONS[selectedAction] : "—"}
            </p>
          </div>
          <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
            <p className="text-xs text-muted">Max Q-value</p>
            <p className="text-lg font-bold text-foreground">
              {Math.max(...qOutputs).toFixed(1)}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <button
            onClick={feedForward}
            className="rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Truyền tiếp
          </button>
          <button
            onClick={() => setShowTarget((v) => !v)}
            className="rounded-lg border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-white"
          >
            {showTarget ? "Ẩn Target Network" : "Hiện Target Network"}
          </button>
          <button
            onClick={reset}
            className="rounded-lg border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-white"
          >
            Đặt lại
          </button>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Deep Q-Network (DQN)</strong> ra đời khi nhóm DeepMind chứng minh rằng
          AI có thể chơi game Atari ở trình độ siêu nhân. Ý tưởng cốt lõi: thay thế{" "}
          <strong>bảng Q</strong> (Q-table) bằng <strong>mạng nơ-ron sâu</strong> để xấp
          xỉ hàm Q(s,a).
        </p>

        <p>
          <strong>Tại sao Q-table không đủ?</strong> Với trò chơi có trạng thái là hình
          ảnh (ví dụ 84&times;84 pixel), số trạng thái khả dĩ là{" "}
          <strong>256^(84&times;84)</strong> — không thể lưu bảng! Mạng nơ-ron{" "}
          <strong>tổng quát hóa</strong>: học các đặc trưng từ pixel để dự đoán Q-value
          cho mọi trạng thái, kể cả chưa gặp.
        </p>

        <p>Hai kỹ thuật then chốt giúp DQN ổn định:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Experience Replay (Phát lại kinh nghiệm)</strong>: Lưu các bộ
            (s, a, r, s&apos;) vào bộ nhớ đệm, rồi lấy mẫu ngẫu nhiên để huấn luyện.
            Điều này phá vỡ tương quan giữa các mẫu liên tiếp, giúp học ổn định hơn —
            giống như ôn bài bằng cách xáo trộn flashcard thay vì đọc theo thứ tự.
          </li>
          <li>
            <strong>Target Network (Mạng mục tiêu)</strong>: Dùng một bản sao
            &quot;đông cứng&quot; của mạng để tính target Q-value. Bản sao này chỉ được
            cập nhật định kỳ, tránh việc mục tiêu thay đổi liên tục gây mất ổn định —
            giống như giữ đáp án cố định khi chấm bài, thay vì thay đổi đáp án mỗi lúc.
          </li>
        </ol>

        <p>
          Công thức cập nhật tương tự Q-Learning, nhưng thay vì cập nhật ô trong bảng,
          ta dùng <strong>gradient descent</strong> để cập nhật trọng số mạng:
        </p>
        <div className="rounded-lg bg-background/50 border border-border p-3 text-center font-mono text-foreground text-sm">
          Loss = (r + &gamma; max Q_target(s&apos;,a&apos;) &minus; Q(s,a))&sup2;
        </div>

        <p>
          DQN mở ra kỷ nguyên <strong>Deep Reinforcement Learning</strong>, trở thành
          nền tảng cho nhiều cải tiến sau này như Double DQN, Dueling DQN, Rainbow, và
          các phương pháp dựa trên policy gradient.
        </p>
      </ExplanationSection>
    </>
  );
}
