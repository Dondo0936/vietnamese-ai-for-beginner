"use client";

import { useState, useCallback } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "actor-critic",
  title: "Actor-Critic (A2C/A3C)",
  titleVi: "Actor-Critic",
  description:
    "Kiến trúc kết hợp mạng chính sách (Actor) và mạng đánh giá (Critic) để học ổn định hơn",
  category: "reinforcement-learning",
  tags: ["a2c", "a3c", "advantage"],
  difficulty: "advanced",
  relatedSlugs: ["policy-gradient", "deep-q-network", "rlhf"],
  vizType: "interactive",
};

const ACTIONS = ["Chuyền", "Sút", "Rê bóng", "Phòng ngự"];
const ACTION_COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b"];

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

export default function ActorCriticTopic() {
  const [actorLogits, setActorLogits] = useState<number[]>([1, 1, 1, 1]);
  const [criticValue, setCriticValue] = useState(0);
  const [advantage, setAdvantage] = useState<number | null>(null);
  const [lastAction, setLastAction] = useState<number | null>(null);
  const [lastReward, setLastReward] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const [totalReward, setTotalReward] = useState(0);
  const [history, setHistory] = useState<
    { action: number; reward: number; adv: number }[]
  >([]);

  const trueRewardMeans = [0.4, 0.8, 0.5, 0.3];

  const actorProbs = softmax(actorLogits);

  const act = useCallback(() => {
    const probs = softmax(actorLogits);
    const action = sampleAction(probs);
    const reward =
      Math.round(
        (trueRewardMeans[action] + (Math.random() - 0.5) * 0.6) * 10
      ) / 10;

    // Critic: TD error = reward + gamma * V(s') - V(s)
    const gamma = 0.9;
    const nextValue = criticValue + (reward - criticValue) * 0.1; // simple estimate
    const tdError = reward + gamma * nextValue - criticValue;
    const adv = Math.round(tdError * 100) / 100;

    // Update critic: V(s) <- V(s) + alpha_c * td_error
    const alphaC = 0.1;
    setCriticValue((prev) => Math.round((prev + alphaC * tdError) * 100) / 100);

    // Update actor: logit[a] += alpha_a * advantage * (1 - prob[a])
    const alphaA = 0.2;
    setActorLogits((prev) => {
      const newLogits = [...prev];
      for (let i = 0; i < newLogits.length; i++) {
        if (i === action) {
          newLogits[i] += alphaA * adv * (1 - probs[i]);
        } else {
          newLogits[i] -= alphaA * adv * probs[i];
        }
      }
      return newLogits;
    });

    setAdvantage(adv);
    setLastAction(action);
    setLastReward(reward);
    setTotalReward((prev) => Math.round((prev + reward) * 10) / 10);
    setStep((s) => s + 1);
    setHistory((prev) => [...prev.slice(-9), { action, reward, adv }]);
  }, [actorLogits, criticValue]);

  const actMany = useCallback(() => {
    let curLogits = [...actorLogits];
    let curCritic = criticValue;
    const newHistory: { action: number; reward: number; adv: number }[] = [];
    let addedReward = 0;
    let lastA = 0;
    let lastR = 0;
    let lastAdv = 0;

    for (let i = 0; i < 10; i++) {
      const probs = softmax(curLogits);
      const action = sampleAction(probs);
      const reward =
        Math.round(
          (trueRewardMeans[action] + (Math.random() - 0.5) * 0.6) * 10
        ) / 10;

      const gamma = 0.9;
      const nextValue = curCritic + (reward - curCritic) * 0.1;
      const tdError = reward + gamma * nextValue - curCritic;
      const adv = Math.round(tdError * 100) / 100;

      curCritic = Math.round((curCritic + 0.1 * tdError) * 100) / 100;

      for (let j = 0; j < curLogits.length; j++) {
        if (j === action) {
          curLogits[j] += 0.2 * adv * (1 - probs[j]);
        } else {
          curLogits[j] -= 0.2 * adv * probs[j];
        }
      }

      newHistory.push({ action, reward, adv });
      addedReward += reward;
      lastA = action;
      lastR = reward;
      lastAdv = adv;
    }

    setActorLogits(curLogits);
    setCriticValue(curCritic);
    setAdvantage(lastAdv);
    setLastAction(lastA);
    setLastReward(lastR);
    setTotalReward((prev) => Math.round((prev + addedReward) * 10) / 10);
    setStep((s) => s + 10);
    setHistory((prev) => [...prev, ...newHistory].slice(-10));
  }, [actorLogits, criticValue]);

  const reset = useCallback(() => {
    setActorLogits([1, 1, 1, 1]);
    setCriticValue(0);
    setAdvantage(null);
    setLastAction(null);
    setLastReward(null);
    setStep(0);
    setTotalReward(0);
    setHistory([]);
  }, []);

  // Layout constants for the two-network diagram
  const actorX = 60;
  const criticX = 340;
  const netW = 170;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng một <strong>đội bóng đá</strong> với{" "}
          <strong>cầu thủ (Actor)</strong> và <strong>huấn luyện viên (Critic)</strong>.
          Cầu thủ quyết định hành động trên sân — chuyền, sút, hay rê bóng. Huấn luyện
          viên ngồi ngoài đường biên, quan sát và nhận xét: &quot;Pha đó{" "}
          <strong>tốt hơn kỳ vọng</strong>&quot; hoặc &quot;Pha đó{" "}
          <strong>kém hơn kỳ vọng</strong>&quot;.
        </p>
        <p>
          Nhờ phản hồi <strong>tương đối</strong> từ HLV (không chỉ &quot;tốt&quot; hay
          &quot;xấu&quot; tuyệt đối), cầu thủ cải thiện nhanh hơn nhiều so với tự học
          một mình. Đó chính là <strong>Actor-Critic</strong> — kết hợp ưu điểm của cả
          Policy Gradient và Value-based methods!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <p className="mb-3 text-sm text-muted">
          Nhấn &quot;Hành động&quot; để Actor chọn và thực hiện. Critic đánh giá
          advantage — tốt hơn hay kém hơn kỳ vọng.
        </p>

        <svg
          viewBox="0 0 560 320"
          className="w-full rounded-lg border border-border bg-background"
        >
          {/* ===== ACTOR NETWORK (left) ===== */}
          <rect x={actorX - 10} y={15} width={netW + 20} height={245} rx={10} fill="#dbeafe" fillOpacity={0.3} stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="6 3" />
          <text x={actorX + netW / 2} y={35} textAnchor="middle" fontSize="13" fill="#2563eb" fontWeight={700}>
            Actor (Cầu thủ)
          </text>
          <text x={actorX + netW / 2} y={50} textAnchor="middle" fontSize="9" fill="#3b82f6">
            Xuất xác suất hành động
          </text>

          {/* Actor input */}
          <circle cx={actorX + 20} cy={100} r={12} fill="#bfdbfe" stroke="#3b82f6" strokeWidth={1.5} />
          <circle cx={actorX + 20} cy={140} r={12} fill="#bfdbfe" stroke="#3b82f6" strokeWidth={1.5} />
          <circle cx={actorX + 20} cy={180} r={12} fill="#bfdbfe" stroke="#3b82f6" strokeWidth={1.5} />
          <text x={actorX + 20} y={220} textAnchor="middle" fontSize="8" fill="#3b82f6">Trạng thái</text>

          {/* Actor hidden */}
          {[105, 145, 185].map((y, i) => (
            <g key={`ah-${i}`}>
              {[100, 140, 180].map((iy) => (
                <line key={`ahl-${iy}-${y}`} x1={actorX + 32} y1={iy} x2={actorX + 78} y2={y} stroke="#93c5fd" strokeWidth={0.5} opacity={0.5} />
              ))}
              <circle cx={actorX + 90} cy={y} r={10} fill="#eff6ff" stroke="#60a5fa" strokeWidth={1} />
            </g>
          ))}

          {/* Actor output - action probabilities */}
          {actorProbs.map((p, i) => {
            const y = 85 + i * 35;
            // Lines from hidden to output
            return (
              <g key={`ao-${i}`}>
                {[105, 145, 185].map((hy) => (
                  <line key={`aol-${hy}-${y}`} x1={actorX + 100} y1={hy} x2={actorX + 138} y2={y} stroke="#93c5fd" strokeWidth={0.5} opacity={0.5} />
                ))}
                <rect
                  x={actorX + 140}
                  y={y - 12}
                  width={40}
                  height={24}
                  rx={4}
                  fill={lastAction === i ? ACTION_COLORS[i] + "33" : "#f8fafc"}
                  stroke={lastAction === i ? ACTION_COLORS[i] : "#cbd5e1"}
                  strokeWidth={lastAction === i ? 2 : 1}
                />
                <text
                  x={actorX + 160}
                  y={y + 4}
                  textAnchor="middle"
                  fontSize="9"
                  fill={ACTION_COLORS[i]}
                  fontWeight={600}
                >
                  {(p * 100).toFixed(0)}%
                </text>
              </g>
            );
          })}

          {/* ===== CRITIC NETWORK (right) ===== */}
          <rect x={criticX - 10} y={15} width={netW + 20} height={245} rx={10} fill="#fef3c7" fillOpacity={0.3} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="6 3" />
          <text x={criticX + netW / 2} y={35} textAnchor="middle" fontSize="13" fill="#d97706" fontWeight={700}>
            Critic (HLV)
          </text>
          <text x={criticX + netW / 2} y={50} textAnchor="middle" fontSize="9" fill="#f59e0b">
            Xuất giá trị trạng thái V(s)
          </text>

          {/* Critic input */}
          <circle cx={criticX + 20} cy={100} r={12} fill="#fef9c3" stroke="#f59e0b" strokeWidth={1.5} />
          <circle cx={criticX + 20} cy={140} r={12} fill="#fef9c3" stroke="#f59e0b" strokeWidth={1.5} />
          <circle cx={criticX + 20} cy={180} r={12} fill="#fef9c3" stroke="#f59e0b" strokeWidth={1.5} />
          <text x={criticX + 20} y={220} textAnchor="middle" fontSize="8" fill="#d97706">Trạng thái</text>

          {/* Critic hidden */}
          {[105, 145, 185].map((y, i) => (
            <g key={`ch-${i}`}>
              {[100, 140, 180].map((iy) => (
                <line key={`chl-${iy}-${y}`} x1={criticX + 32} y1={iy} x2={criticX + 78} y2={y} stroke="#fcd34d" strokeWidth={0.5} opacity={0.5} />
              ))}
              <circle cx={criticX + 90} cy={y} r={10} fill="#fffbeb" stroke="#fbbf24" strokeWidth={1} />
            </g>
          ))}

          {/* Critic output - single value */}
          {[105, 145, 185].map((hy) => (
            <line key={`col-${hy}`} x1={criticX + 100} y1={hy} x2={criticX + 138} y2={145} stroke="#fcd34d" strokeWidth={0.5} opacity={0.5} />
          ))}
          <rect
            x={criticX + 140}
            y={130}
            width={40}
            height={30}
            rx={6}
            fill="#fffbeb"
            stroke="#f59e0b"
            strokeWidth={2}
          />
          <text x={criticX + 160} y={150} textAnchor="middle" fontSize="11" fill="#b45309" fontWeight={700}>
            {criticValue.toFixed(2)}
          </text>
          <text x={criticX + 160} y={175} textAnchor="middle" fontSize="8" fill="#92400e">V(s)</text>

          {/* ===== ADVANTAGE ARROW (center) ===== */}
          <line x1={270} y1={270} x2={290} y2={270} stroke="#64748b" strokeWidth={1.5} markerEnd="url(#arrowhead)" />
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <path d="M0,0 L8,3 L0,6 Z" fill="#64748b" />
            </marker>
          </defs>

          {/* Advantage display */}
          <rect
            x={205}
            y={275}
            width={150}
            height={35}
            rx={8}
            fill={
              advantage === null
                ? "#f1f5f9"
                : advantage > 0
                ? "#dcfce7"
                : "#fee2e2"
            }
            stroke={
              advantage === null
                ? "#94a3b8"
                : advantage > 0
                ? "#22c55e"
                : "#ef4444"
            }
            strokeWidth={1.5}
          />
          <text x={280} y={290} textAnchor="middle" fontSize="9" fill="#64748b">
            Advantage (TD Error)
          </text>
          <text
            x={280}
            y={304}
            textAnchor="middle"
            fontSize="12"
            fill={
              advantage === null
                ? "#64748b"
                : advantage > 0
                ? "#16a34a"
                : "#dc2626"
            }
            fontWeight={700}
          >
            {advantage !== null
              ? `A = ${advantage > 0 ? "+" : ""}${advantage.toFixed(2)}`
              : "—"}
          </text>
        </svg>

        {/* History */}
        <div className="mt-4">
          <p className="text-sm font-medium text-foreground mb-2">Lịch sử:</p>
          <div className="flex gap-1.5 flex-wrap">
            {history.map((h, i) => (
              <div
                key={i}
                className="rounded-md px-2 py-0.5 text-xs"
                style={{
                  backgroundColor: ACTION_COLORS[h.action] + "22",
                  color: ACTION_COLORS[h.action],
                  border: `1px solid ${ACTION_COLORS[h.action]}44`,
                }}
              >
                {ACTIONS[h.action].substring(0, 3)} r={h.reward} A=
                {h.adv > 0 ? "+" : ""}
                {h.adv.toFixed(1)}
              </div>
            ))}
            {history.length === 0 && (
              <span className="text-xs text-muted italic">Chưa có hành động nào</span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-4 gap-3">
          <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
            <p className="text-xs text-muted">Bước</p>
            <p className="text-lg font-bold text-foreground">{step}</p>
          </div>
          <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
            <p className="text-xs text-muted">V(s) Critic</p>
            <p className="text-lg font-bold text-foreground">
              {criticValue.toFixed(2)}
            </p>
          </div>
          <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
            <p className="text-xs text-muted">Advantage</p>
            <p className="text-lg font-bold text-foreground">
              {advantage !== null ? advantage.toFixed(2) : "—"}
            </p>
          </div>
          <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
            <p className="text-xs text-muted">Tổng thưởng</p>
            <p className="text-lg font-bold text-foreground">{totalReward}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <button
            onClick={act}
            className="rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Hành động
          </button>
          <button
            onClick={actMany}
            className="rounded-lg border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-white"
          >
            Chạy 10 bước
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
          <strong>Actor-Critic</strong> kết hợp hai thành phần học cùng lúc:{" "}
          <strong>Actor</strong> (chính sách — chọn hành động) và{" "}
          <strong>Critic</strong> (đánh giá — ước lượng giá trị trạng thái). Đây là sự
          kết hợp hoàn hảo của Policy Gradient và Value-based methods.
        </p>

        <p>
          <strong>Hàm Advantage</strong> là trái tim của Actor-Critic:
        </p>
        <div className="rounded-lg bg-background/50 border border-border p-3 text-center font-mono text-foreground text-sm">
          A(s,a) = r + &gamma; V(s&apos;) &minus; V(s)
        </div>
        <p>
          Advantage cho biết hành động <strong>tốt hơn hay kém hơn so với kỳ
          vọng</strong>:
        </p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>
            <strong>A &gt; 0</strong>: Hành động tốt hơn kỳ vọng &#8594; Critic nói
            &quot;Tốt lắm!&quot; &#8594; Actor tăng xác suất hành động này
          </li>
          <li>
            <strong>A &lt; 0</strong>: Hành động kém hơn kỳ vọng &#8594; Critic nói
            &quot;Cần cải thiện!&quot; &#8594; Actor giảm xác suất hành động này
          </li>
          <li>
            <strong>A &asymp; 0</strong>: Hành động đúng như kỳ vọng &#8594; Không thay
            đổi nhiều
          </li>
        </ul>

        <p>
          <strong>Tại sao tốt hơn Policy Gradient thuần?</strong> REINFORCE phải đợi
          hết episode mới cập nhật (Monte Carlo), gây phương sai cao. Actor-Critic dùng{" "}
          <strong>TD error</strong> (Temporal Difference) từ Critic làm baseline, cho
          phép cập nhật <strong>sau mỗi bước</strong> và giảm phương sai đáng kể.
        </p>

        <p>Hai biến thể phổ biến:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>A2C (Advantage Actor-Critic)</strong>: Chạy đồng bộ — nhiều worker
            song song thu thập kinh nghiệm, rồi cập nhật cùng lúc. Đơn giản và ổn định.
          </li>
          <li>
            <strong>A3C (Asynchronous A2C)</strong>: Mỗi worker cập nhật bất đồng bộ
            lên model chung. Nhanh hơn nhưng phức tạp hơn — hiện nay A2C thường được ưa
            chuộng hơn nhờ GPU song song hóa tốt.
          </li>
        </ol>

        <p>
          Actor-Critic là nền tảng cho các thuật toán hiện đại như{" "}
          <strong>PPO</strong>, <strong>SAC</strong>, <strong>DDPG</strong>, và đặc biệt
          là <strong>RLHF</strong> — phương pháp huấn luyện các mô hình ngôn ngữ lớn
          (LLM) như ChatGPT, nơi Actor là LLM và Critic là reward model đánh giá chất
          lượng câu trả lời.
        </p>
      </ExplanationSection>
    </>
  );
}
