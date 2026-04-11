"use client";

import { useState, useCallback } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "policy-gradient",
  title: "Policy Gradient",
  titleVi: "Gradient chính sách",
  description:
    "Phương pháp tối ưu trực tiếp chính sách hành động bằng gradient ascent trên phần thưởng kỳ vọng",
  category: "reinforcement-learning",
  tags: ["reinforce", "policy", "optimization"],
  difficulty: "intermediate",
  relatedSlugs: ["actor-critic", "q-learning", "gradient-descent"],
  vizType: "interactive",
};

const ACTIONS = ["Ném thẳng", "Ném vòng cung", "Ném nhanh", "Ném xoáy"];
const ACTION_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444"];

function softmax(logits: number[]): number[] {
  const maxL = Math.max(...logits);
  const exps = logits.map((l) => Math.exp(l - maxL));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

function sampleAction(probs: number[]): number {
  const r = Math.random();
  let cum = 0;
  for (let i = 0; i < probs.length; i++) {
    cum += probs[i];
    if (r < cum) return i;
  }
  return probs.length - 1;
}

export default function PolicyGradientTopic() {
  const [logits, setLogits] = useState<number[]>([1, 1, 1, 1]);
  const [history, setHistory] = useState<{ action: number; reward: number }[]>([]);
  const [lastAction, setLastAction] = useState<number | null>(null);
  const [lastReward, setLastReward] = useState<number | null>(null);
  const [totalReward, setTotalReward] = useState(0);

  // True reward probabilities (hidden from user)
  const trueRewardProbs = [0.3, 0.7, 0.5, 0.2];

  const probs = softmax(logits);

  const throwBall = useCallback(() => {
    const currentProbs = softmax(logits);
    const action = sampleAction(currentProbs);
    const reward = Math.random() < trueRewardProbs[action] ? 1 : 0;

    // Policy gradient update: increase logit of good actions, decrease bad
    const lr = 0.3;
    setLogits((prev) => {
      const newLogits = [...prev];
      for (let i = 0; i < newLogits.length; i++) {
        if (i === action) {
          // REINFORCE: logit += lr * reward * (1 - prob)
          newLogits[i] += lr * (reward - 0.5) * (1 - currentProbs[i]);
        } else {
          // Decrease others proportionally
          newLogits[i] -= lr * (reward - 0.5) * currentProbs[i];
        }
      }
      return newLogits;
    });

    setLastAction(action);
    setLastReward(reward);
    setTotalReward((prev) => prev + reward);
    setHistory((prev) => [...prev.slice(-11), { action, reward }]);
  }, [logits]);

  const throwMany = useCallback(() => {
    let currentLogits = [...logits];
    const newHistory: { action: number; reward: number }[] = [];
    let addedReward = 0;
    const lr = 0.3;

    for (let step = 0; step < 10; step++) {
      const currentProbs = softmax(currentLogits);
      const action = sampleAction(currentProbs);
      const reward = Math.random() < trueRewardProbs[action] ? 1 : 0;

      for (let i = 0; i < currentLogits.length; i++) {
        if (i === action) {
          currentLogits[i] += lr * (reward - 0.5) * (1 - currentProbs[i]);
        } else {
          currentLogits[i] -= lr * (reward - 0.5) * currentProbs[i];
        }
      }
      newHistory.push({ action, reward });
      addedReward += reward;
    }

    setLogits(currentLogits);
    setLastAction(newHistory[newHistory.length - 1].action);
    setLastReward(newHistory[newHistory.length - 1].reward);
    setTotalReward((prev) => prev + addedReward);
    setHistory((prev) => [...prev, ...newHistory].slice(-12));
  }, [logits]);

  const reset = useCallback(() => {
    setLogits([1, 1, 1, 1]);
    setHistory([]);
    setLastAction(null);
    setLastReward(null);
    setTotalReward(0);
  }, []);

  const barMaxHeight = 180;
  const barWidth = 80;
  const barGap = 30;
  const chartStartX = 60;
  const chartBaseY = 240;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn là một <strong>cầu thủ bóng rổ</strong> tập ném phạt.
          Thay vì tính toán giá trị của mỗi vị trí trên sân (value-based), bạn{" "}
          <strong>trực tiếp cải thiện kỹ thuật ném</strong> (policy) bằng cách luyện tập
          và điều chỉnh.
        </p>
        <p>
          Ném vào = phần thưởng tốt &#8594; tăng xác suất dùng kỹ thuật đó. Ném trượt =
          kết quả xấu &#8594; giảm xác suất. Dần dần, bạn tự nhiên chọn cách ném hiệu
          quả nhất. Đó chính là <strong>Policy Gradient</strong> — tối ưu trực tiếp
          chính sách hành động!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <p className="mb-3 text-sm text-muted">
          Nhấn &quot;Ném bóng&quot; để thử một kỹ thuật. Quan sát xác suất thay đổi —
          kỹ thuật thành công nhiều sẽ được chọn thường xuyên hơn.
        </p>

        <svg
          viewBox="0 0 520 290"
          className="w-full rounded-lg border border-border bg-background"
        >
          {/* Title */}
          <text x={260} y={22} textAnchor="middle" fontSize="13" fill="currentColor" fontWeight={700}>
            Phân phối xác suất chính sách
          </text>

          {/* Y axis */}
          <line x1={50} y1={40} x2={50} y2={chartBaseY} stroke="#94a3b8" strokeWidth={1} />
          <text x={26} y={48} fontSize="9" fill="#64748b" textAnchor="middle">100%</text>
          <text x={26} y={chartBaseY} fontSize="9" fill="#64748b" textAnchor="middle">0%</text>

          {/* Bars */}
          {probs.map((p, i) => {
            const x = chartStartX + i * (barWidth + barGap);
            const barH = p * barMaxHeight;
            const isLast = lastAction === i;

            return (
              <g key={`bar-${i}`}>
                {/* Bar */}
                <rect
                  x={x}
                  y={chartBaseY - barH}
                  width={barWidth}
                  height={barH}
                  rx={4}
                  fill={ACTION_COLORS[i]}
                  opacity={isLast ? 1 : 0.7}
                  stroke={isLast ? "#fff" : "none"}
                  strokeWidth={isLast ? 2 : 0}
                />

                {/* Percentage label */}
                <text
                  x={x + barWidth / 2}
                  y={chartBaseY - barH - 6}
                  textAnchor="middle"
                  fontSize="11"
                  fill={ACTION_COLORS[i]}
                  fontWeight={700}
                >
                  {(p * 100).toFixed(1)}%
                </text>

                {/* Action name */}
                <text
                  x={x + barWidth / 2}
                  y={chartBaseY + 16}
                  textAnchor="middle"
                  fontSize="10"
                  fill="currentColor"
                  fontWeight={500}
                >
                  {ACTIONS[i]}
                </text>

                {/* Last result indicator */}
                {isLast && lastReward !== null && (
                  <text
                    x={x + barWidth / 2}
                    y={chartBaseY + 30}
                    textAnchor="middle"
                    fontSize="10"
                    fill={lastReward > 0 ? "#22c55e" : "#ef4444"}
                    fontWeight={700}
                  >
                    {lastReward > 0 ? "Vào!" : "Trượt!"}
                  </text>
                )}
              </g>
            );
          })}

          {/* Baseline (x axis) */}
          <line x1={50} y1={chartBaseY} x2={500} y2={chartBaseY} stroke="#94a3b8" strokeWidth={1} />

          {/* Arrow showing gradient direction */}
          {lastAction !== null && lastReward !== null && (
            <g>
              <text x={260} y={280} textAnchor="middle" fontSize="10" fill="#64748b">
                {lastReward > 0
                  ? `↑ Tăng xác suất "${ACTIONS[lastAction]}" (thưởng tốt)`
                  : `↓ Giảm xác suất "${ACTIONS[lastAction]}" (thưởng xấu)`}
              </text>
            </g>
          )}
        </svg>

        {/* History */}
        <div className="mt-4">
          <p className="text-sm font-medium text-foreground mb-2">
            Lịch sử gần đây:
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {history.map((h, i) => (
              <div
                key={i}
                className="rounded-md px-2 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: ACTION_COLORS[h.action] + "22",
                  color: ACTION_COLORS[h.action],
                  border: `1px solid ${ACTION_COLORS[h.action]}44`,
                }}
              >
                {ACTIONS[h.action].substring(0, 4)} {h.reward > 0 ? "✓" : "✗"}
              </div>
            ))}
            {history.length === 0 && (
              <span className="text-xs text-muted italic">Chưa có lần ném nào</span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
            <p className="text-xs text-muted">Tổng lần ném</p>
            <p className="text-lg font-bold text-foreground">{history.length}</p>
          </div>
          <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
            <p className="text-xs text-muted">Tổng thưởng</p>
            <p className="text-lg font-bold text-foreground">{totalReward}</p>
          </div>
          <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
            <p className="text-xs text-muted">Tỷ lệ thành công</p>
            <p className="text-lg font-bold text-foreground">
              {history.length > 0
                ? ((totalReward / history.length) * 100).toFixed(0) + "%"
                : "—"}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <button
            onClick={throwBall}
            className="rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Ném bóng
          </button>
          <button
            onClick={throwMany}
            className="rounded-lg border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-white"
          >
            Ném 10 lần
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
          <strong>Policy Gradient</strong> là phương pháp học tăng cường{" "}
          <strong>tối ưu trực tiếp chính sách</strong> (policy) thay vì học hàm giá trị
          (value function) như Q-Learning. Chính sách &pi;(a|s) cho biết xác suất chọn
          hành động a tại trạng thái s.
        </p>

        <p>
          <strong>Sự khác biệt cốt lõi</strong> so với phương pháp dựa trên giá trị:
        </p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>
            <strong>Value-based</strong> (Q-Learning): Học Q(s,a) rồi suy ra chính sách
            bằng cách chọn argmax — chỉ xử lý được hành động rời rạc
          </li>
          <li>
            <strong>Policy-based</strong>: Tham số hóa chính sách trực tiếp bằng
            &theta; — có thể xử lý <strong>hành động liên tục</strong> (ví dụ: góc quay
            tay lái, lực đạp ga)
          </li>
        </ul>

        <p>
          Thuật toán <strong>REINFORCE</strong> (Monte Carlo Policy Gradient) cập nhật
          theo công thức:
        </p>
        <div className="rounded-lg bg-background/50 border border-border p-3 text-center font-mono text-foreground text-sm">
          &theta; &larr; &theta; + &alpha; &nabla; log &pi;(a|s; &theta;) &middot; G_t
        </div>
        <p>Trong đó:</p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>
            <strong>&nabla; log &pi;(a|s; &theta;)</strong>: hướng gradient để tăng xác
            suất hành động a
          </li>
          <li>
            <strong>G_t</strong>: tổng phần thưởng tích lũy từ bước t — đánh giá hành
            động tốt hay xấu
          </li>
          <li>
            Nếu G_t lớn (tốt) &#8594; đẩy chính sách <strong>tăng</strong> xác suất
            hành động đó
          </li>
          <li>
            Nếu G_t nhỏ (xấu) &#8594; đẩy chính sách <strong>giảm</strong> xác suất
          </li>
        </ul>

        <p>
          <strong>Hạn chế chính</strong> của REINFORCE là{" "}
          <strong>phương sai cao</strong> (high variance): phần thưởng Monte Carlo dao
          động nhiều giữa các episode, khiến quá trình học không ổn định. Giải pháp phổ
          biến là trừ đi một <strong>baseline</strong> (thường là giá trị trung bình)
          để giảm phương sai mà không thay đổi kỳ vọng gradient — đây chính là tiền đề
          cho phương pháp <strong>Actor-Critic</strong>.
        </p>
      </ExplanationSection>
    </>
  );
}
