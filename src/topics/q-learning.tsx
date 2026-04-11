"use client";

import { useState, useCallback } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "q-learning",
  title: "Q-Learning",
  titleVi: "Q-Learning",
  description:
    "Thuật toán học tăng cường cơ bản học giá trị hành động tối ưu từ trải nghiệm",
  category: "reinforcement-learning",
  tags: ["reinforcement", "q-table", "reward"],
  difficulty: "beginner",
  relatedSlugs: ["deep-q-network", "multi-armed-bandit", "supervised-unsupervised-rl"],
  vizType: "interactive",
};

const GRID = 4;
const ACTIONS = ["↑", "→", "↓", "←"] as const;
const ACTION_DELTAS: Record<string, [number, number]> = {
  "↑": [-1, 0],
  "→": [0, 1],
  "↓": [1, 0],
  "←": [0, -1],
};

const GOAL = { r: 3, c: 3 };
const TRAP = { r: 1, c: 2 };

function getReward(r: number, c: number): number {
  if (r === GOAL.r && c === GOAL.c) return 10;
  if (r === TRAP.r && c === TRAP.c) return -5;
  return -0.1;
}

function qColor(val: number): string {
  if (val > 5) return "#22c55e";
  if (val > 1) return "#86efac";
  if (val > 0) return "#d1fae5";
  if (val < -2) return "#ef4444";
  if (val < 0) return "#fecaca";
  return "#e2e8f0";
}

function initQTable(): number[][][] {
  return Array.from({ length: GRID }, () =>
    Array.from({ length: GRID }, () => [0, 0, 0, 0])
  );
}

export default function QLearningTopic() {
  const [qTable, setQTable] = useState<number[][][]>(initQTable);
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [agentPos, setAgentPos] = useState({ r: 0, c: 0 });
  const [episode, setEpisode] = useState(0);
  const [totalReward, setTotalReward] = useState(0);
  const [epsilon] = useState(0.3);
  const [alpha] = useState(0.5);
  const [gamma] = useState(0.9);

  const step = useCallback(() => {
    setQTable((prev) => {
      const qt = prev.map((row) => row.map((cell) => [...cell]));
      const { r, c } = agentPos;

      // Epsilon-greedy action selection
      let actionIdx: number;
      if (Math.random() < epsilon) {
        actionIdx = Math.floor(Math.random() * 4);
      } else {
        actionIdx = qt[r][c].indexOf(Math.max(...qt[r][c]));
      }

      const [dr, dc] = ACTION_DELTAS[ACTIONS[actionIdx]];
      const nr = Math.max(0, Math.min(GRID - 1, r + dr));
      const nc = Math.max(0, Math.min(GRID - 1, c + dc));

      const reward = getReward(nr, nc);
      const maxNextQ = Math.max(...qt[nr][nc]);

      // Bellman update
      qt[r][c][actionIdx] =
        qt[r][c][actionIdx] + alpha * (reward + gamma * maxNextQ - qt[r][c][actionIdx]);

      setTotalReward((prev) => prev + reward);

      // Move agent, reset if reached goal or trap
      if ((nr === GOAL.r && nc === GOAL.c) || (nr === TRAP.r && nc === TRAP.c)) {
        setAgentPos({ r: 0, c: 0 });
        setEpisode((e) => e + 1);
      } else {
        setAgentPos({ r: nr, c: nc });
      }

      return qt;
    });
  }, [agentPos, epsilon, alpha, gamma]);

  const runEpisode = useCallback(() => {
    for (let i = 0; i < 20; i++) {
      setTimeout(() => step(), i * 100);
    }
  }, [step]);

  const reset = useCallback(() => {
    setQTable(initQTable());
    setAgentPos({ r: 0, c: 0 });
    setEpisode(0);
    setTotalReward(0);
    setSelectedCell(null);
  }, []);

  const cellSize = 120;
  const padding = 10;
  const svgW = GRID * cellSize + 2 * padding;
  const svgH = GRID * cellSize + 2 * padding;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn mới chuyển đến một thành phố và muốn tìm{" "}
          <strong>quán ăn ngon nhất</strong>. Bạn xây dựng một{" "}
          <strong>&quot;bảng đánh giá&quot;</strong> — ghi lại mỗi quán (trạng thái) với
          mỗi món (hành động) cho bạn bao nhiêu sự hài lòng (phần thưởng).
        </p>
        <p>
          Ban đầu bảng trống — bạn thử ngẫu nhiên. Mỗi lần ăn, bạn cập nhật điểm:{" "}
          <strong>&quot;Quán A, món phở = 9 điểm&quot;</strong>. Dần dần, bạn biết chính
          xác nên đi đâu và gọi gì. Đó chính là cách <strong>Q-Learning</strong> hoạt
          động — xây dựng bảng Q (Q-table) từ trải nghiệm.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <p className="mb-3 text-sm text-muted">
          Nhấp vào ô để xem Q-values. Nhấn &quot;Bước tiếp&quot; để agent di chuyển và
          học, hoặc &quot;Chạy 20 bước&quot; để chạy nhanh. Ô xanh lá = đích (thưởng +10),
          ô đỏ = bẫy (phạt -5).
        </p>

        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="w-full max-w-2xl mx-auto rounded-lg border border-border bg-background"
        >
          {Array.from({ length: GRID }, (_, r) =>
            Array.from({ length: GRID }, (_, c) => {
              const x = padding + c * cellSize;
              const y = padding + r * cellSize;
              const maxQ = Math.max(...qTable[r][c]);
              const isGoal = r === GOAL.r && c === GOAL.c;
              const isTrap = r === TRAP.r && c === TRAP.c;
              const isAgent = r === agentPos.r && c === agentPos.c;
              const isSelected =
                selectedCell !== null && selectedCell.r === r && selectedCell.c === c;

              return (
                <g
                  key={`cell-${r}-${c}`}
                  onClick={() => setSelectedCell({ r, c })}
                  style={{ cursor: "pointer" }}
                >
                  {/* Cell background */}
                  <rect
                    x={x + 2}
                    y={y + 2}
                    width={cellSize - 4}
                    height={cellSize - 4}
                    rx={8}
                    fill={isGoal ? "#bbf7d0" : isTrap ? "#fecaca" : qColor(maxQ)}
                    stroke={isSelected ? "#3b82f6" : "#94a3b8"}
                    strokeWidth={isSelected ? 3 : 1}
                  />

                  {/* Goal / Trap labels */}
                  {isGoal && (
                    <text
                      x={x + cellSize / 2}
                      y={y + 20}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="bold"
                      fill="#16a34a"
                    >
                      🎯 ĐÍCH
                    </text>
                  )}
                  {isTrap && (
                    <text
                      x={x + cellSize / 2}
                      y={y + 20}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="bold"
                      fill="#dc2626"
                    >
                      ⚠️ BẪY
                    </text>
                  )}

                  {/* Q-values for each action (arrows) */}
                  {ACTIONS.map((action, ai) => {
                    const val = qTable[r][c][ai];
                    const positions = [
                      { tx: x + cellSize / 2, ty: y + 35 }, // up
                      { tx: x + cellSize - 18, ty: y + cellSize / 2 + 4 }, // right
                      { tx: x + cellSize / 2, ty: y + cellSize - 15 }, // down
                      { tx: x + 18, ty: y + cellSize / 2 + 4 }, // left
                    ];
                    return (
                      <text
                        key={`q-${r}-${c}-${ai}`}
                        x={positions[ai].tx}
                        y={positions[ai].ty}
                        textAnchor="middle"
                        fontSize="10"
                        fill={val > 0 ? "#16a34a" : val < 0 ? "#dc2626" : "#64748b"}
                      >
                        {action} {val.toFixed(1)}
                      </text>
                    );
                  })}

                  {/* Max Q in center */}
                  <text
                    x={x + cellSize / 2}
                    y={y + cellSize / 2 + 5}
                    textAnchor="middle"
                    fontSize="14"
                    fontWeight="bold"
                    fill="#1e293b"
                  >
                    {maxQ.toFixed(1)}
                  </text>

                  {/* Agent marker */}
                  {isAgent && (
                    <circle
                      cx={x + cellSize / 2}
                      cy={y + cellSize - 30}
                      r={10}
                      fill="#3b82f6"
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  )}
                </g>
              );
            })
          )}
        </svg>

        {/* Selected cell detail */}
        {selectedCell && (
          <div className="mt-3 rounded-lg bg-background/50 border border-border p-3">
            <p className="text-sm font-medium text-foreground">
              Ô ({selectedCell.r}, {selectedCell.c}) — Q-values:
            </p>
            <div className="mt-1 grid grid-cols-4 gap-2 text-sm">
              {ACTIONS.map((a, i) => (
                <div key={a} className="text-center">
                  <span className="text-muted">{a}</span>{" "}
                  <strong>{qTable[selectedCell.r][selectedCell.c][i].toFixed(2)}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
            <p className="text-xs text-muted">Episode</p>
            <p className="text-lg font-bold text-foreground">{episode}</p>
          </div>
          <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
            <p className="text-xs text-muted">Tổng thưởng</p>
            <p className="text-lg font-bold text-foreground">{totalReward.toFixed(1)}</p>
          </div>
          <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
            <p className="text-xs text-muted">Epsilon (ε)</p>
            <p className="text-lg font-bold text-foreground">{epsilon}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={step}
            className="rounded-lg border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-white"
          >
            Bước tiếp
          </button>
          <button
            onClick={runEpisode}
            className="rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Chạy 20 bước
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
          <strong>Q-Learning</strong> là thuật toán <strong>học tăng cường</strong> cơ bản
          nhất, thuộc nhóm phương pháp <strong>off-policy</strong> và{" "}
          <strong>model-free</strong>. Agent học cách hành động tối ưu mà không cần biết
          trước mô hình của môi trường.
        </p>

        <p>
          Ý tưởng cốt lõi là xây dựng một <strong>bảng Q (Q-table)</strong> — với mỗi cặp
          (trạng thái, hành động), ta lưu một giá trị Q thể hiện &quot;phần thưởng kỳ vọng
          tổng cộng nếu thực hiện hành động đó tại trạng thái đó&quot;.
        </p>

        <p>
          Công thức cập nhật dựa trên <strong>phương trình Bellman</strong>:
        </p>
        <div className="rounded-lg bg-background/50 border border-border p-3 text-center font-mono text-foreground text-sm">
          Q(s,a) ← Q(s,a) + α [r + γ max Q(s&apos;,a&apos;) − Q(s,a)]
        </div>
        <p>Trong đó:</p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>
            <strong>α (alpha)</strong>: tốc độ học — mức độ tin tưởng thông tin mới so với
            thông tin cũ
          </li>
          <li>
            <strong>γ (gamma)</strong>: hệ số chiết khấu — mức độ quan tâm đến phần thưởng
            tương lai (0 = chỉ quan tâm hiện tại, 1 = quan tâm xa)
          </li>
          <li>
            <strong>r</strong>: phần thưởng nhận được ngay sau khi thực hiện hành động
          </li>
          <li>
            <strong>max Q(s&apos;,a&apos;)</strong>: giá trị Q lớn nhất tại trạng thái
            tiếp theo — đây là phần &quot;tham lam&quot; (greedy)
          </li>
        </ul>

        <p>
          <strong>Chiến lược Epsilon-Greedy (ε-greedy)</strong> giúp cân bằng giữa{" "}
          <strong>khám phá</strong> (exploration) và <strong>khai thác</strong>{" "}
          (exploitation):
        </p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>
            Với xác suất <strong>ε</strong>: chọn hành động ngẫu nhiên (khám phá đường mới)
          </li>
          <li>
            Với xác suất <strong>1-ε</strong>: chọn hành động có Q-value cao nhất (khai thác
            kinh nghiệm)
          </li>
        </ul>

        <p>
          Khi đủ trải nghiệm, bảng Q sẽ <strong>hội tụ</strong> — các giá trị Q ổn định
          và phản ánh chính sách tối ưu. Lúc này, agent chỉ cần chọn hành động có Q-value
          cao nhất tại mỗi trạng thái để hành động tốt nhất.
        </p>
      </ExplanationSection>
    </>
  );
}
