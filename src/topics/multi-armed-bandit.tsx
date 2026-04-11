"use client";

import { useState, useCallback } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "multi-armed-bandit",
  title: "Multi-Armed Bandit",
  titleVi: "Bài toán máy đánh bạc nhiều tay",
  description:
    "Bài toán cân bằng giữa khai thác kiến thức đã có và khám phá lựa chọn mới",
  category: "reinforcement-learning",
  tags: ["exploration", "exploitation", "epsilon-greedy"],
  difficulty: "beginner",
  relatedSlugs: ["q-learning", "recommendation-systems", "supervised-unsupervised-rl"],
  vizType: "interactive",
};

// True reward probabilities (hidden from user)
const TRUE_PROBS = [0.2, 0.55, 0.35, 0.75];
const ARM_NAMES = ["Phở Hà Nội", "Bún bò Huế", "Cơm tấm SG", "Hủ tiếu Nam Vang"];
const ARM_COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#22c55e"];

interface ArmStats {
  pulls: number;
  totalReward: number;
  avg: number;
}

function initArms(): ArmStats[] {
  return TRUE_PROBS.map(() => ({ pulls: 0, totalReward: 0, avg: 0 }));
}

export default function MultiArmedBanditTopic() {
  const [arms, setArms] = useState<ArmStats[]>(initArms);
  const [lastPull, setLastPull] = useState<{ arm: number; reward: number } | null>(null);
  const [totalPulls, setTotalPulls] = useState(0);
  const [totalReward, setTotalReward] = useState(0);
  const [epsilon, setEpsilon] = useState(0.2);
  const [strategy, setStrategy] = useState<"manual" | "epsilon">("manual");
  const [autoHistory, setAutoHistory] = useState<{ arm: number; reward: number }[]>([]);

  const pullArm = useCallback(
    (armIdx: number) => {
      const reward = Math.random() < TRUE_PROBS[armIdx] ? 1 : 0;

      setArms((prev) => {
        const next = prev.map((a) => ({ ...a }));
        next[armIdx].pulls += 1;
        next[armIdx].totalReward += reward;
        next[armIdx].avg =
          Math.round((next[armIdx].totalReward / next[armIdx].pulls) * 100) / 100;
        return next;
      });

      setLastPull({ arm: armIdx, reward });
      setTotalPulls((p) => p + 1);
      setTotalReward((p) => p + reward);
      setAutoHistory((prev) => [...prev.slice(-19), { arm: armIdx, reward }]);
    },
    []
  );

  const epsilonGreedyPull = useCallback(() => {
    let chosen: number;
    if (Math.random() < epsilon || arms.every((a) => a.pulls === 0)) {
      // Explore: random
      chosen = Math.floor(Math.random() * 4);
    } else {
      // Exploit: best known average
      chosen = 0;
      let bestAvg = -Infinity;
      arms.forEach((a, i) => {
        if (a.avg > bestAvg) {
          bestAvg = a.avg;
          chosen = i;
        }
      });
    }
    pullArm(chosen);
  }, [arms, epsilon, pullArm]);

  const runMany = useCallback(() => {
    // Run 10 epsilon-greedy pulls
    let curArms = arms.map((a) => ({ ...a }));
    const newHistory: { arm: number; reward: number }[] = [];
    let addedReward = 0;
    let lastA = 0;
    let lastR = 0;

    for (let i = 0; i < 10; i++) {
      let chosen: number;
      if (Math.random() < epsilon || curArms.every((a) => a.pulls === 0)) {
        chosen = Math.floor(Math.random() * 4);
      } else {
        chosen = 0;
        let bestAvg = -Infinity;
        curArms.forEach((a, idx) => {
          if (a.avg > bestAvg) {
            bestAvg = a.avg;
            chosen = idx;
          }
        });
      }

      const reward = Math.random() < TRUE_PROBS[chosen] ? 1 : 0;
      curArms[chosen].pulls += 1;
      curArms[chosen].totalReward += reward;
      curArms[chosen].avg =
        Math.round((curArms[chosen].totalReward / curArms[chosen].pulls) * 100) / 100;

      newHistory.push({ arm: chosen, reward });
      addedReward += reward;
      lastA = chosen;
      lastR = reward;
    }

    setArms(curArms);
    setLastPull({ arm: lastA, reward: lastR });
    setTotalPulls((p) => p + 10);
    setTotalReward((p) => p + addedReward);
    setAutoHistory((prev) => [...prev, ...newHistory].slice(-20));
  }, [arms, epsilon]);

  const reset = useCallback(() => {
    setArms(initArms());
    setLastPull(null);
    setTotalPulls(0);
    setTotalReward(0);
    setAutoHistory([]);
  }, []);

  const maxPulls = Math.max(1, ...arms.map((a) => a.pulls));
  const slotW = 110;
  const slotGap = 20;
  const slotStartX = 40;
  const slotTopY = 40;
  const slotHeight = 180;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn mới chuyển đến một thành phố và muốn tìm{" "}
          <strong>quán phở ngon nhất</strong>. Có 4 quán gần nhà:{" "}
          <strong>Phở Hà Nội</strong>, <strong>Bún bò Huế</strong>,{" "}
          <strong>Cơm tấm Sài Gòn</strong>, và <strong>Hủ tiếu Nam Vang</strong>.
        </p>
        <p>
          Mỗi lần ăn, bạn phải chọn: tiếp tục đến quán đã biết ngon (
          <strong>khai thác — exploit</strong>), hay thử quán mới có thể ngon hơn (
          <strong>khám phá — explore</strong>)? Nếu chỉ khai thác, bạn có thể bỏ lỡ quán
          ngon nhất. Nếu chỉ khám phá, bạn lãng phí tiền vào quán dở. Đây chính là{" "}
          <strong>bài toán Multi-Armed Bandit</strong> — tìm sự cân bằng tối ưu!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <p className="mb-3 text-sm text-muted">
          Nhấp vào từng quán để thử (chế độ thủ công), hoặc dùng chiến lược
          &epsilon;-greedy tự động. Mỗi quán có xác suất &quot;ngon&quot; ẩn khác nhau.
        </p>

        <svg
          viewBox="0 0 560 340"
          className="w-full rounded-lg border border-border bg-background"
        >
          {/* Title */}
          <text x={280} y={25} textAnchor="middle" fontSize="13" fill="currentColor" fontWeight={700}>
            Thử các quán ăn
          </text>

          {arms.map((arm, i) => {
            const x = slotStartX + i * (slotW + slotGap);
            const barH = arm.pulls > 0 ? (arm.pulls / maxPulls) * (slotHeight - 50) : 0;
            const isLast = lastPull !== null && lastPull.arm === i;

            return (
              <g
                key={`arm-${i}`}
                onClick={() => strategy === "manual" && pullArm(i)}
                style={{ cursor: strategy === "manual" ? "pointer" : "default" }}
              >
                {/* Slot machine body */}
                <rect
                  x={x}
                  y={slotTopY}
                  width={slotW}
                  height={slotHeight}
                  rx={10}
                  fill={ARM_COLORS[i] + "15"}
                  stroke={isLast ? ARM_COLORS[i] : "#94a3b8"}
                  strokeWidth={isLast ? 2.5 : 1}
                />

                {/* Restaurant name */}
                <text
                  x={x + slotW / 2}
                  y={slotTopY + 20}
                  textAnchor="middle"
                  fontSize="10"
                  fill={ARM_COLORS[i]}
                  fontWeight={700}
                >
                  {ARM_NAMES[i]}
                </text>

                {/* Pull count bar */}
                <rect
                  x={x + 15}
                  y={slotTopY + slotHeight - 15 - barH}
                  width={slotW - 30}
                  height={barH}
                  rx={4}
                  fill={ARM_COLORS[i]}
                  opacity={0.6}
                />

                {/* Pulls count */}
                <text
                  x={x + slotW / 2}
                  y={slotTopY + 40}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#64748b"
                >
                  Lần thử: {arm.pulls}
                </text>

                {/* Average */}
                <text
                  x={x + slotW / 2}
                  y={slotTopY + 55}
                  textAnchor="middle"
                  fontSize="11"
                  fill={ARM_COLORS[i]}
                  fontWeight={600}
                >
                  TB: {arm.pulls > 0 ? (arm.avg * 100).toFixed(0) + "%" : "?"}
                </text>

                {/* Total reward */}
                <text
                  x={x + slotW / 2}
                  y={slotTopY + 70}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#64748b"
                >
                  Ngon: {arm.totalReward}/{arm.pulls}
                </text>

                {/* Last result indicator */}
                {isLast && lastPull && (
                  <g>
                    <circle
                      cx={x + slotW / 2}
                      cy={slotTopY + slotHeight + 18}
                      r={12}
                      fill={lastPull.reward > 0 ? "#dcfce7" : "#fee2e2"}
                      stroke={lastPull.reward > 0 ? "#22c55e" : "#ef4444"}
                      strokeWidth={1.5}
                    />
                    <text
                      x={x + slotW / 2}
                      y={slotTopY + slotHeight + 22}
                      textAnchor="middle"
                      fontSize="10"
                      fill={lastPull.reward > 0 ? "#16a34a" : "#dc2626"}
                      fontWeight={700}
                    >
                      {lastPull.reward > 0 ? "!" : "X"}
                    </text>
                  </g>
                )}

                {/* Click hint */}
                {strategy === "manual" && arm.pulls === 0 && (
                  <text
                    x={x + slotW / 2}
                    y={slotTopY + slotHeight - 25}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#94a3b8"
                  >
                    Nhấp để thử
                  </text>
                )}
              </g>
            );
          })}

          {/* Running average line chart area */}
          <text x={280} y={280} textAnchor="middle" fontSize="10" fill="#64748b">
            {totalPulls > 0
              ? `Tỷ lệ tổng thể: ${((totalReward / totalPulls) * 100).toFixed(0)}% ngon (${totalReward}/${totalPulls})`
              : "Hãy bắt đầu thử các quán!"}
          </text>

          {/* History dots */}
          {autoHistory.length > 0 && (
            <g>
              <text x={40} y={310} fontSize="9" fill="#64748b">Lịch sử:</text>
              {autoHistory.map((h, i) => (
                <circle
                  key={`hist-${i}`}
                  cx={90 + i * 22}
                  cy={307}
                  r={6}
                  fill={h.reward > 0 ? ARM_COLORS[h.arm] : "#e2e8f0"}
                  stroke={ARM_COLORS[h.arm]}
                  strokeWidth={1.5}
                />
              ))}
            </g>
          )}
        </svg>

        {/* Strategy selector and epsilon */}
        <div className="mt-4 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-foreground">Chế độ:</label>
            <button
              onClick={() => setStrategy("manual")}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                strategy === "manual"
                  ? "bg-accent text-white"
                  : "border border-border bg-card text-foreground hover:bg-accent hover:text-white"
              }`}
            >
              Thủ công
            </button>
            <button
              onClick={() => setStrategy("epsilon")}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                strategy === "epsilon"
                  ? "bg-accent text-white"
                  : "border border-border bg-card text-foreground hover:bg-accent hover:text-white"
              }`}
            >
              &epsilon;-Greedy
            </button>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-foreground">&epsilon; =</label>
            <input
              type="range"
              min={0}
              max={100}
              value={epsilon * 100}
              onChange={(e) => setEpsilon(Number(e.target.value) / 100)}
              className="w-24 accent-accent"
            />
            <span className="w-10 text-center text-sm font-bold text-accent">
              {epsilon.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
            <p className="text-xs text-muted">Tổng lần thử</p>
            <p className="text-lg font-bold text-foreground">{totalPulls}</p>
          </div>
          <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
            <p className="text-xs text-muted">Tổng phần thưởng</p>
            <p className="text-lg font-bold text-foreground">{totalReward}</p>
          </div>
          <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
            <p className="text-xs text-muted">Tỷ lệ thắng</p>
            <p className="text-lg font-bold text-foreground">
              {totalPulls > 0
                ? ((totalReward / totalPulls) * 100).toFixed(0) + "%"
                : "—"}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          {strategy === "epsilon" && (
            <>
              <button
                onClick={epsilonGreedyPull}
                className="rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Thử 1 lần (&epsilon;-greedy)
              </button>
              <button
                onClick={runMany}
                className="rounded-lg border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-white"
              >
                Thử 10 lần
              </button>
            </>
          )}
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
          <strong>Multi-Armed Bandit</strong> (Bài toán máy đánh bạc nhiều tay) là bài
          toán nền tảng trong học tăng cường, mô tả tình huống phải{" "}
          <strong>cân bằng giữa khám phá (exploration) và khai thác
          (exploitation)</strong>.
        </p>

        <p>
          Tên gọi đến từ hình ảnh một người đứng trước nhiều{" "}
          <strong>máy đánh bạc</strong> (slot machine), mỗi máy có xác suất thắng khác
          nhau mà ta không biết trước. Mục tiêu: <strong>tối đa hóa tổng phần thưởng</strong>{" "}
          sau N lần kéo.
        </p>

        <p>Các chiến lược phổ biến:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Epsilon-Greedy (&epsilon;-greedy)</strong>: Đơn giản nhất — với xác suất
            &epsilon; chọn ngẫu nhiên (khám phá), với xác suất 1-&epsilon; chọn tay có
            trung bình cao nhất (khai thác). &epsilon; = 0.1 nghĩa là 10% thời gian khám
            phá.
          </li>
          <li>
            <strong>Upper Confidence Bound (UCB)</strong>: Thông minh hơn — chọn tay có
            giá trị &quot;trung bình + phần thưởng khám phá&quot; cao nhất. Tay ít được
            thử sẽ có phần thưởng khám phá lớn hơn, tự động khuyến khích thử.
            <div className="mt-1 rounded-lg bg-background/50 border border-border p-2 text-center font-mono text-foreground text-xs">
              UCB(a) = Q(a) + c &sdot; &radic;(ln(t) / N(a))
            </div>
          </li>
          <li>
            <strong>Thompson Sampling</strong>: Dùng xác suất Bayesian — duy trì một
            phân phối xác suất cho mỗi tay, lấy mẫu từ phân phối và chọn tay có mẫu
            cao nhất. Tay chưa chắc chắn sẽ có phân phối rộng hơn, tự nhiên được khám
            phá nhiều hơn.
          </li>
        </ol>

        <p>
          <strong>Ứng dụng thực tế</strong> rất phong phú:
        </p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>
            <strong>A/B Testing</strong>: Chọn phiên bản website tốt nhất trong khi vẫn
            thu thập dữ liệu
          </li>
          <li>
            <strong>Hệ thống gợi ý</strong>: Cân bằng giữa gợi ý nội dung quen thuộc
            và nội dung mới
          </li>
          <li>
            <strong>Quảng cáo trực tuyến</strong>: Chọn quảng cáo hiển thị để tối đa hóa
            click
          </li>
          <li>
            <strong>Y tế</strong>: Phân bổ bệnh nhân vào các phác đồ điều trị thử
            nghiệm
          </li>
        </ul>

        <p>
          Multi-Armed Bandit là <strong>trường hợp đặc biệt</strong> của học tăng cường
          — chỉ có 1 trạng thái (không có chuyển đổi trạng thái). Hiểu bài toán này là
          bước đệm tuyệt vời trước khi bước vào Q-Learning và các phương pháp RL phức
          tạp hơn.
        </p>
      </ExplanationSection>
    </>
  );
}
