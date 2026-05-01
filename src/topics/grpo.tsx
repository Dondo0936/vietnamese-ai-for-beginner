"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
  TopicLink,
  CollapsibleDetail,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "grpo",
  title: "GRPO",
  titleVi: "GRPO - Tối ưu hóa chính sách theo nhóm",
  description:
    "Phương pháp alignment hiệu quả, sử dụng phần thưởng nhóm thay vì reward model riêng biệt.",
  category: "training-optimization",
  tags: ["grpo", "alignment", "reinforcement-learning", "optimization"],
  difficulty: "advanced",
  relatedSlugs: ["rlhf", "dpo", "fine-tuning"],
  vizType: "interactive",
};

/* ════════════════════════════════════════════════════════════
   MÔ PHỎNG GRPO: 1 prompt → 8 phản hồi mẫu → reward → baseline
   Prompt mẫu: "Tính 47 × 13 = ?"
   Đáp án đúng: 611
   8 phản hồi được sinh, mỗi phản hồi có trả lời cuối + reward.
   Reward scheme (verifiable):
     • Đúng (=611): +1.0
     • Sai trong khoảng ±10: +0.2 (gần đúng)
     • Còn lại: 0.0
   Ngoài ra một số mẫu có format thưởng +0.1 nếu có "<answer>…</answer>".
   ──────────────────────────────────────────────────────────── */

type Sample = {
  id: number;
  text: string;
  answer: number | string;
  correct: boolean;
  nearMiss: boolean;
  hasFormat: boolean;
  reward: number;
};

const PROMPT = "Tính 47 × 13 = ?";
const GT = 611;

function makeReward(ans: number | string, hasFormat: boolean): number {
  let r = 0;
  if (typeof ans === "number") {
    if (ans === GT) r += 1.0;
    else if (Math.abs(ans - GT) <= 10) r += 0.2;
  }
  if (hasFormat) r += 0.1;
  return +r.toFixed(2);
}

const BASE_SAMPLES: Omit<Sample, "reward" | "correct" | "nearMiss">[] = [
  {
    id: 1,
    text: "47 × 13 = 47 × 10 + 47 × 3 = 470 + 141 = 611. <answer>611</answer>",
    answer: 611,
    hasFormat: true,
  },
  {
    id: 2,
    text: "47 × 13 ≈ 50 × 13 = 650, bớt 3 × 13 = 39 → 611. <answer>611</answer>",
    answer: 611,
    hasFormat: true,
  },
  {
    id: 3,
    text: "47 × 13 = 47 × 13 = 601.",
    answer: 601,
    hasFormat: false,
  },
  {
    id: 4,
    text: "Đặt 47 × 13: 47 × 3 = 141, 47 × 10 = 470, cộng = 611. <answer>611</answer>",
    answer: 611,
    hasFormat: true,
  },
  {
    id: 5,
    text: "Mình nghĩ là khoảng 600, cụ thể 620.",
    answer: 620,
    hasFormat: false,
  },
  {
    id: 6,
    text: "47 · 13 = 47 · 12 + 47 = 564 + 47 = 611.",
    answer: 611,
    hasFormat: false,
  },
  {
    id: 7,
    text: "47 × 13: thử (50−3)(10+3) = 500 + 150 − 30 − 9 = 611. <answer>611</answer>",
    answer: 611,
    hasFormat: true,
  },
  {
    id: 8,
    text: "Không chắc lắm, đáp án là 517.",
    answer: 517,
    hasFormat: false,
  },
];

const SAMPLES: Sample[] = BASE_SAMPLES.map((s) => {
  const reward = makeReward(s.answer, s.hasFormat);
  const correct = typeof s.answer === "number" && s.answer === GT;
  const nearMiss =
    typeof s.answer === "number" &&
    s.answer !== GT &&
    Math.abs(s.answer - GT) <= 10;
  return { ...s, reward, correct, nearMiss };
});

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
function std(xs: number[]): number {
  const m = mean(xs);
  const v = xs.reduce((s, x) => s + (x - m) ** 2, 0) / xs.length;
  return Math.sqrt(v);
}

const REWARDS = SAMPLES.map((s) => s.reward);
const REW_MEAN = +mean(REWARDS).toFixed(3);
const REW_STD = +std(REWARDS).toFixed(3);
const ADVANTAGES = SAMPLES.map((s) =>
  +((s.reward - REW_MEAN) / (REW_STD || 1e-8)).toFixed(3),
);

/* 5 bước diễn hoạt:
   0: Prompt + chưa sinh mẫu
   1: Sinh 8 mẫu (hiện text)
   2: Reward (chấm điểm)
   3: Baseline = mean, vẽ đường ngang
   4: Advantage = (r − mean) / std
   5: Clipping + KL penalty (cập nhật chính sách) */
const STEPS = 6;
const TOTAL_STEPS = 7;

/* ════════════════════════════════════════════════════════════
   QUIZ — 8 câu
   ──────────────────────────────────────────────────────────── */
const QUIZ: QuizQuestion[] = [
  {
    question:
      "Điểm khác biệt CỐT LÕI giữa GRPO và PPO chuẩn dùng trong RLHF là gì?",
    options: [
      "GRPO chạy nhanh hơn vì dùng GPU tốt hơn",
      "GRPO BỎ critic/value function — thay nó bằng trung bình reward của một NHÓM G phản hồi cho cùng prompt",
      "GRPO chỉ dùng được cho bài dịch thuật",
      "GRPO là supervised learning, không phải RL",
    ],
    correct: 1,
    explanation:
      "PPO cần một value network huấn luyện song song với policy (tốn ≈ 2x VRAM). GRPO tính advantage hoàn toàn từ reward trong một group: baseline = mean(r_1…r_G). Không cần critic → tiết kiệm bộ nhớ, dễ ổn định trên LLM.",
  },
  {
    question:
      "Loại bài toán nào GRPO phù hợp nhất?",
    options: [
      "Bài toán viết thơ sáng tạo",
      "Bài toán có VERIFIABLE REWARD — đáp án có thể kiểm tra tự động (toán, code, logic, game)",
      "Bài toán dịch thuật tự do",
      "Bài toán tổng hợp tin tức mà chất lượng do con người đánh giá",
    ],
    correct: 1,
    explanation:
      "GRPO cần hàm reward rõ ràng cho nhiều mẫu song song. Bài toán toán/code có verifier tự động (so đáp án, chạy unit test) là môi trường lý tưởng. Đó là cách DeepSeek-R1, OpenAI o1 family và nhiều reasoning model được huấn luyện.",
  },
  {
    question:
      "Với G = 8 phản hồi, advantage của phản hồi i được tính thế nào trong GRPO?",
    options: [
      "Â_i = r_i (dùng reward thô)",
      "Â_i = (r_i − mean(r)) / std(r) — chuẩn hoá trong nhóm",
      "Â_i = r_i − r_max",
      "Â_i = r_i / Σ r",
    ],
    correct: 1,
    explanation:
      "Trung bình nhóm biến reward tuyệt đối thành tương đối: mẫu tốt hơn trung bình → advantage dương → tăng xác suất. Chuẩn hoá theo std ổn định bước cập nhật khi reward dao động lớn/nhỏ tuỳ prompt.",
  },
  {
    question:
      "Vai trò của KL penalty β · D_KL(π_θ || π_ref) trong GRPO?",
    options: [
      "Tăng tốc độ học",
      "Neo chính sách gần mô hình REFERENCE (thường là mô hình SFT trước khi RL) → tránh reward hacking, giữ tính đa dạng và an toàn",
      "Phạt độ dài câu trả lời",
      "Thay thế cho clipping",
    ],
    correct: 1,
    explanation:
      "Không có KL, policy có thể 'trôi' khỏi phân phối ngôn ngữ hợp lý và tìm ra cách hack reward (VD: đầu ra lặp lại, trống, hay dùng trick). Ràng buộc KL giữ output sát ref, β điều chỉnh độ chặt.",
  },
  {
    question:
      "Clipping min(ρ · Â, clip(ρ, 1−ε, 1+ε) · Â) trong GRPO có ý nghĩa gì?",
    options: [
      "Giới hạn reward tối đa",
      "Ngăn TỶ LỆ IMPORTANCE ρ = π_new/π_old thay đổi quá mạnh trong một bước — giữ update 'trust region' như PPO",
      "Cắt các phản hồi quá dài",
      "Normalise advantage",
    ],
    correct: 1,
    explanation:
      "Nếu ρ lệch nhiều so với 1 thì một bước gradient có thể phá chính sách. Clipping ε ≈ 0.2 tạo ra vùng an toàn: khi advantage dương, không cho ρ vượt 1+ε; khi advantage âm, không cho ρ nhỏ hơn 1−ε. Đây là cơ chế từ PPO được GRPO kế thừa.",
  },
  {
    question:
      "Với dataset 10k prompt và G = 16, GRPO phải sinh BAO NHIÊU phản hồi mỗi epoch?",
    options: [
      "10.000",
      "160.000 — đó là chi phí inference chính của GRPO; cần hệ thống rollout song song (vLLM, SGLang) để đủ nhanh",
      "1.600",
      "Không cần sinh — chỉ cần forward pass",
    ],
    correct: 1,
    explanation:
      "Chi phí chính của GRPO KHÔNG ở backward pass mà ở giai đoạn rollout. Thực tế production dùng inference engine tối ưu (vLLM, SGLang) và thường fix seed, batch prompt, hoặc giảm G với curriculum để cân bằng chất lượng vs tốc độ.",
  },
  {
    question:
      "Một group có 16 phản hồi, toàn bộ đều sai (reward = 0). Điều gì xảy ra với advantage?",
    options: [
      "Advantage = 0 cho tất cả → gradient tín hiệu bằng 0, group này không đóng góp học",
      "Advantage = 1 cho tất cả",
      "Mô hình bị crash",
      "Phải tự động tăng temperature",
    ],
    correct: 0,
    explanation:
      "Khi mọi r_i bằng nhau, r_i − mean = 0 và std ≈ 0 → advantage 0. Group không cung cấp tín hiệu phân biệt. Đó là lý do curriculum learning và prompt selection rất quan trọng với GRPO — tránh prompt quá khó (mọi sample sai) hoặc quá dễ (mọi sample đúng).",
  },
  {
    question:
      "So với DPO, GRPO có ưu thế chính nào?",
    options: [
      "GRPO đơn giản hơn DPO",
      "GRPO cho phép EXPLORATION qua sampling nhiều phản hồi và dùng được VERIFIABLE reward (cho toán/code) — DPO yêu cầu cặp chosen/rejected do người gán",
      "GRPO không cần tính toán gì cả",
      "GRPO chỉ cần một prompt duy nhất",
    ],
    correct: 1,
    explanation:
      "DPO là offline trên cặp preference cố định: (x, y_w, y_l). Mạnh khi đã có data preference, nhưng không khám phá thêm. GRPO là online — mô hình tự sinh các đáp án mới, reward tự động → tốt cho lĩnh vực có verifier và cần cải thiện vượt ngoài phân phối dữ liệu gán sẵn.",
  },
];

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ──────────────────────────────────────────────────────────── */
export default function GRPOTopic() {
  const [step, setStep] = useState(0);
  const [showAll, setShowAll] = useState(true);
  const [compareMode, setCompareMode] = useState<"grpo" | "ppo">("grpo");

  const nextStep = useCallback(() => setStep((s) => Math.min(STEPS - 1, s + 1)), []);
  const prevStep = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);
  const resetStep = useCallback(() => setStep(0), []);

  const rewardsShown = step >= 2;
  const baselineShown = step >= 3;
  const advantagesShown = step >= 4;
  const updateShown = step >= 5;

  // Max absolute reward/advantage for scaling
  const maxR = useMemo(() => Math.max(...REWARDS, 1.1), []);
  const maxA = useMemo(
    () => Math.max(...ADVANTAGES.map((a) => Math.abs(a)), 1),
    [],
  );

  return (
    <>
      {/* ═══════════════ STEP 1: PREDICTION GATE ═══════════════ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="RLHF truyền thống cần reward model (tốn kém). DPO cần dữ liệu cặp sở thích do người gán (khó thu thập ở quy mô lớn). Có cách alignment nào tránh được CẢ HAI nút cổ chai đó không?"
          options={[
            "Không — phải chọn giữa reward model hoặc preference pair",
            "Có — sinh NHIỀU phản hồi cho cùng một prompt, chấm bằng một hàm reward đơn giản, rồi SO SÁNH các phản hồi trong nhóm với nhau",
            "Có — chỉ cần supervised fine-tuning (SFT) là đủ",
            "Có — dùng người đánh giá trực tiếp mỗi lần inference",
          ]}
          correct={1}
          explanation="GRPO: cho prompt x, mô hình sinh G phản hồi y_1…y_G; chấm điểm bằng reward function (VD: verifier toán học); lấy mean nhóm làm baseline; advantage = (r − mean) / std. Không cần reward model, không cần preference pair. Đây là cách DeepSeek-R1 đạt kết quả reasoning ngang o1 với ngân sách rất khác biệt."
        >
          <p className="mt-2 text-sm text-muted">
            Bài này khám phá GRPO bằng mô phỏng 1 prompt → 8 phản hồi → group
            baseline → advantage → policy update, cùng so sánh trực tiếp
            GRPO với PPO truyền thống.
          </p>

          {/* ═══════════════ STEP 2: ANALOGY + VIZ ═══════════════ */}
          <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
            <div className="mb-4 rounded-xl border border-border bg-card p-4">
              <p className="text-sm font-semibold text-foreground mb-1">
                Phép so sánh: một lớp học KHÔNG có giáo viên chấm bài
              </p>
              <p className="text-sm text-muted leading-relaxed">
                Hãy tưởng tượng một lớp giải toán: thay vì thuê một chuyên
                gia chấm 1-1 (reward model), thầy giáo cho cả lớp cùng làm
                MỘT đề. Ai trả lời bằng đáp án đúng thì được cộng điểm, ai
                sai thì trừ (verifier đơn giản). Sau đó tất cả nhìn lên
                bảng: &quot;lớp mình trung bình đang được 0.6 điểm&quot;.
                Học sinh làm hơn trung bình → khen nhiều hơn; dưới trung
                bình → nhắc nhở. Không cần giám khảo trọng tài — lớp tự so
                với chính mình. Đó là tinh thần GRPO.
              </p>
            </div>

            <VisualizationSection>
              <div className="space-y-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-base font-semibold text-foreground">
                    GRPO trên prompt &quot;{PROMPT}&quot;
                  </h3>
                  <span className="text-xs text-muted">
                    G = 8 phản hồi · đáp án đúng = {GT}
                  </span>
                </div>

                {/* ─── PROGRESS PIPELINE ─── */}
                <div className="rounded-xl border border-border bg-card p-3">
                  <div className="grid grid-cols-5 gap-1 text-[10px]">
                    {[
                      { label: "Prompt", icon: "📝" },
                      { label: "Sinh G mẫu", icon: "🎲" },
                      { label: "Reward", icon: "⚖️" },
                      { label: "Baseline", icon: "📊" },
                      { label: "Update", icon: "🔄" },
                    ].map((s, i) => {
                      // Step index mapping: 0→0, 1→1, 2→2, 3→3, 4→3, 5→4
                      const active =
                        step >= i ||
                        (i === 3 && step >= 3) ||
                        (i === 4 && step >= 5);
                      return (
                        <div
                          key={i}
                          className={`rounded-lg px-2 py-1.5 text-center transition-colors ${
                            active
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold"
                              : "bg-surface text-muted"
                          }`}
                        >
                          <div className="text-base">{s.icon}</div>
                          <div>{s.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ─── 1 PROMPT BOX ─── */}
                <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3">
                  <p className="text-xs uppercase tracking-wide text-blue-500 font-semibold mb-1">
                    Prompt
                  </p>
                  <p className="text-sm text-foreground font-mono">
                    {PROMPT}
                  </p>
                </div>

                {/* ─── 8 SAMPLES ─── */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wide text-muted font-semibold">
                      {step >= 1
                        ? "8 phản hồi do policy π_old sinh"
                        : "(nhấn 'Bước tiếp' để mô hình sinh mẫu)"}
                    </p>
                    <label className="inline-flex items-center gap-1.5 text-xs text-muted cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showAll}
                        onChange={(e) => setShowAll(e.target.checked)}
                        className="accent-emerald-500"
                      />
                      hiện nội dung
                    </label>
                  </div>

                  <AnimatePresence>
                    {step >= 1 && (
                      <motion.div
                        key="samples"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid gap-2"
                      >
                        {SAMPLES.map((s, i) => {
                          const color = s.correct
                            ? "#22c55e"
                            : s.nearMiss
                              ? "#f59e0b"
                              : "#ef4444";
                          const adv = ADVANTAGES[i];
                          return (
                            <motion.div
                              key={s.id}
                              layout
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                delay: 0.04 * i,
                                duration: 0.25,
                              }}
                              className="rounded-lg border p-2.5 text-sm"
                              style={{
                                borderColor: color + "55",
                                backgroundColor: color + "08",
                              }}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span
                                  className="text-xs font-semibold"
                                  style={{ color }}
                                >
                                  y<sub>{s.id}</sub>
                                  {s.correct && " ✓"}
                                  {s.nearMiss && " ~"}
                                  {!s.correct && !s.nearMiss && " ✗"}
                                </span>
                                <div className="flex items-center gap-2 text-xs">
                                  {rewardsShown && (
                                    <motion.span
                                      initial={{ opacity: 0, x: -4 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      className="font-mono"
                                      style={{ color }}
                                    >
                                      r = {s.reward.toFixed(2)}
                                    </motion.span>
                                  )}
                                  {advantagesShown && (
                                    <motion.span
                                      initial={{ opacity: 0, x: -4 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      className={`font-mono font-semibold ${
                                        adv > 0
                                          ? "text-emerald-500"
                                          : adv < 0
                                            ? "text-red-500"
                                            : "text-muted"
                                      }`}
                                    >
                                      Â ={" "}
                                      {adv > 0 ? "+" : ""}
                                      {adv.toFixed(2)}
                                    </motion.span>
                                  )}
                                  {updateShown && (
                                    <motion.span
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                        adv > 0
                                          ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                          : "bg-red-500/20 text-red-500"
                                      }`}
                                    >
                                      {adv > 0 ? "↑ tăng P" : "↓ giảm P"}
                                    </motion.span>
                                  )}
                                </div>
                              </div>
                              {showAll && (
                                <p className="mt-1 text-xs text-muted font-mono leading-relaxed">
                                  {s.text}
                                </p>
                              )}
                            </motion.div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ─── REWARD BAR CHART + BASELINE ─── */}
                {rewardsShown && (
                  <div className="rounded-xl border border-border bg-card p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs uppercase tracking-wide text-muted font-semibold">
                        Reward theo phản hồi
                      </p>
                      <p className="text-xs text-muted">
                        mean ={" "}
                        <span className="font-mono text-foreground">
                          {REW_MEAN.toFixed(2)}
                        </span>{" "}
                        · std ={" "}
                        <span className="font-mono text-foreground">
                          {REW_STD.toFixed(2)}
                        </span>
                      </p>
                    </div>
                    <svg viewBox="0 0 400 140" className="w-full">
                      {/* Y axis */}
                      <line
                        x1={30}
                        y1={10}
                        x2={30}
                        y2={110}
                        stroke="currentColor"
                        className="text-muted"
                        strokeWidth={0.5}
                        opacity={0.4}
                      />
                      <line
                        x1={30}
                        y1={110}
                        x2={390}
                        y2={110}
                        stroke="currentColor"
                        className="text-muted"
                        strokeWidth={0.5}
                        opacity={0.4}
                      />
                      {/* Bars */}
                      {SAMPLES.map((s, i) => {
                        const x = 40 + i * 44;
                        const h = (s.reward / maxR) * 95;
                        const color = s.correct
                          ? "#22c55e"
                          : s.nearMiss
                            ? "#f59e0b"
                            : "#ef4444";
                        return (
                          <g key={s.id}>
                            <motion.rect
                              x={x}
                              y={110 - h}
                              width={32}
                              height={h}
                              fill={color}
                              rx={3}
                              initial={{ height: 0, y: 110 }}
                              animate={{ height: h, y: 110 - h }}
                              transition={{
                                delay: 0.04 * i,
                                type: "spring",
                                stiffness: 130,
                                damping: 16,
                              }}
                            />
                            <text
                              x={x + 16}
                              y={125}
                              fontSize={11}
                              fill="currentColor"
                              className="text-muted"
                              textAnchor="middle"
                            >
                              y{s.id}
                            </text>
                            {s.reward > 0 && (
                              <text
                                x={x + 16}
                                y={110 - h - 3}
                                fontSize={11}
                                fill={color}
                                textAnchor="middle"
                                fontWeight={700}
                              >
                                {s.reward.toFixed(1)}
                              </text>
                            )}
                          </g>
                        );
                      })}
                      {/* Baseline */}
                      {baselineShown && (
                        <>
                          <motion.line
                            x1={30}
                            x2={390}
                            y1={110 - (REW_MEAN / maxR) * 95}
                            y2={110 - (REW_MEAN / maxR) * 95}
                            stroke="#8b5cf6"
                            strokeWidth={1.5}
                            strokeDasharray="4 3"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.4 }}
                          />
                          <text
                            x={385}
                            y={110 - (REW_MEAN / maxR) * 95 - 4}
                            fontSize={11}
                            fill="#8b5cf6"
                            textAnchor="end"
                            fontWeight={700}
                          >
                            baseline = mean
                          </text>
                        </>
                      )}
                      {/* Y ticks */}
                      {[0, 0.5, 1.0].map((v) => {
                        const y = 110 - (v / maxR) * 95;
                        return (
                          <g key={v}>
                            <text
                              x={24}
                              y={y + 3}
                              fontSize={11}
                              fill="currentColor"
                              className="text-muted"
                              textAnchor="end"
                            >
                              {v.toFixed(1)}
                            </text>
                            <line
                              x1={28}
                              x2={30}
                              y1={y}
                              y2={y}
                              stroke="currentColor"
                              className="text-muted"
                              opacity={0.4}
                            />
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                )}

                {/* ─── ADVANTAGE CHART ─── */}
                {advantagesShown && (
                  <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-xs uppercase tracking-wide text-muted font-semibold mb-2">
                      Advantage Â<sub>i</sub> = (r<sub>i</sub> − mean) / std
                    </p>
                    <svg viewBox="0 0 400 130" className="w-full">
                      <line
                        x1={30}
                        y1={65}
                        x2={390}
                        y2={65}
                        stroke="currentColor"
                        className="text-muted"
                        strokeWidth={0.7}
                        opacity={0.5}
                      />
                      <text
                        x={30}
                        y={62}
                        fontSize={11}
                        fill="currentColor"
                        className="text-muted"
                      >
                        0
                      </text>
                      {ADVANTAGES.map((a, i) => {
                        const x = 40 + i * 44;
                        const h = (Math.abs(a) / maxA) * 45;
                        const up = a >= 0;
                        const color = up ? "#22c55e" : "#ef4444";
                        return (
                          <g key={i}>
                            <motion.rect
                              x={x}
                              y={up ? 65 - h : 65}
                              width={32}
                              height={h}
                              fill={color}
                              opacity={0.85}
                              rx={2}
                              initial={{ height: 0 }}
                              animate={{ height: h }}
                              transition={{
                                delay: 0.05 * i,
                                type: "spring",
                                stiffness: 120,
                              }}
                            />
                            <text
                              x={x + 16}
                              y={120}
                              fontSize={11}
                              fill="currentColor"
                              className="text-muted"
                              textAnchor="middle"
                            >
                              y{SAMPLES[i].id}
                            </text>
                            <text
                              x={x + 16}
                              y={up ? 65 - h - 3 : 65 + h + 9}
                              fontSize={11}
                              fill={color}
                              textAnchor="middle"
                              fontWeight={700}
                            >
                              {a > 0 ? "+" : ""}
                              {a.toFixed(2)}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                    <p className="mt-1 text-xs text-muted">
                      <strong className="text-emerald-500">
                        Â dương
                      </strong>{" "}
                      → tăng log π(y|x) qua gradient; {" "}
                      <strong className="text-red-500">Â âm</strong> → giảm.
                      Nhóm này có {SAMPLES.filter((s) => s.correct).length}/8
                      phản hồi đúng → học được rằng các bước tính như{" "}
                      <code>47×10 + 47×3</code> hay phân phối{" "}
                      <code>(50−3)(10+3)</code> là đường đi tốt.
                    </p>
                  </div>
                )}

                {/* ─── UPDATE: CLIP + KL ─── */}
                {updateShown && (
                  <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-3">
                    <p className="text-xs uppercase tracking-wide text-violet-500 font-semibold mb-2">
                      Cập nhật chính sách (clipping + KL)
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2 text-xs">
                      <div className="rounded-lg border border-border bg-background p-2">
                        <p className="font-semibold text-foreground mb-1">
                          Clipping (trust region)
                        </p>
                        <p className="text-muted leading-relaxed">
                          ρ<sub>i</sub> = π<sub>θ</sub>(y<sub>i</sub>|x) /
                          π<sub>old</sub>(y<sub>i</sub>|x). Không cho ρ đi
                          quá xa 1 ± ε (ε ≈ 0.2) → tránh chính sách nhảy
                          vọt, huấn luyện ổn định.
                        </p>
                      </div>
                      <div className="rounded-lg border border-border bg-background p-2">
                        <p className="font-semibold text-foreground mb-1">
                          KL penalty
                        </p>
                        <p className="text-muted leading-relaxed">
                          β · D<sub>KL</sub>(π<sub>θ</sub> ∥ π<sub>ref</sub>
                          ) neo policy gần mô hình SFT gốc → chống reward
                          hacking, giữ độ đa dạng ngôn ngữ. β điển hình
                          0.02–0.1.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── CONTROLS ─── */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={prevStep}
                    disabled={step === 0}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground disabled:opacity-30"
                  >
                    ← Lùi
                  </button>
                  <button
                    onClick={nextStep}
                    disabled={step === STEPS - 1}
                    className="rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-30"
                  >
                    Bước tiếp →
                  </button>
                  <button
                    onClick={resetStep}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
                  >
                    Đặt lại
                  </button>
                  <span className="ml-2 text-xs text-muted">
                    Bước {step + 1}/{STEPS} —{" "}
                    {
                      [
                        "Prompt",
                        "Sinh 8 mẫu",
                        "Reward",
                        "Group baseline",
                        "Advantage",
                        "Clip + KL",
                      ][step]
                    }
                  </span>
                </div>

                {/* ─── COMPARE: GRPO vs PPO ─── */}
                <div className="rounded-xl border border-border bg-card p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wide text-muted font-semibold">
                      So sánh GRPO ↔ PPO chuẩn
                    </p>
                    <div className="flex gap-1 rounded-lg border border-border p-0.5">
                      {(["grpo", "ppo"] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => setCompareMode(m)}
                          className={`rounded px-3 py-1 text-xs font-semibold transition-colors ${
                            compareMode === m
                              ? "bg-accent text-white"
                              : "text-muted hover:text-foreground"
                          }`}
                        >
                          {m.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-xs">
                      <thead className="bg-surface text-muted">
                        <tr>
                          <th className="px-2 py-1.5 text-left font-medium">
                            Khía cạnh
                          </th>
                          <th className="px-2 py-1.5 text-left font-medium">
                            {compareMode.toUpperCase()}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {(compareMode === "grpo"
                          ? [
                              ["Critic/value net", "KHÔNG cần"],
                              ["Baseline", "mean(r) trong group G phản hồi"],
                              ["Advantage", "(r − mean) / std"],
                              ["Bộ nhớ", "~1× model (chỉ policy + ref)"],
                              ["Exploration", "Qua sampling G mẫu với temperature > 0"],
                              ["Reward", "Verifiable (toán/code) hoặc RM — cả hai đều được"],
                              [
                                "Chi phí chính",
                                "Inference rollout (G mẫu × #prompt)",
                              ],
                              ["Ổn định", "Khá ổn với clip + KL; yếu khi group toàn bằng"],
                              [
                                "Ví dụ nổi bật",
                                "DeepSeek-R1, DeepSeek-Math, Qwen2.5-Math",
                              ],
                            ]
                          : [
                              ["Critic/value net", "CÓ — network riêng ước lượng V(s)"],
                              [
                                "Baseline",
                                "V(s) học cùng policy (GAE / TD)",
                              ],
                              ["Advantage", "A = r + γV(s') − V(s) (GAE)"],
                              [
                                "Bộ nhớ",
                                "~2× model (policy + critic); + reward model trong RLHF",
                              ],
                              [
                                "Exploration",
                                "Qua stochastic policy; entropy bonus",
                              ],
                              [
                                "Reward",
                                "Thường là reward model học từ preference (RLHF)",
                              ],
                              [
                                "Chi phí chính",
                                "Chạy đồng thời policy + critic + RM",
                              ],
                              [
                                "Ổn định",
                                "Nhạy với critic; cần tune nhiều; dễ drift",
                              ],
                              [
                                "Ví dụ nổi bật",
                                "ChatGPT (InstructGPT), Anthropic Claude RLHF gốc",
                              ],
                            ]
                        ).map(([k, v]) => (
                          <tr key={k}>
                            <td className="bg-surface/30 px-2 py-1.5 font-medium text-foreground">
                              {k}
                            </td>
                            <td className="px-2 py-1.5 text-muted">{v}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </VisualizationSection>
          </LessonSection>

          {/* ═══════════════ STEP 3: AHA MOMENT ═══════════════ */}
          <LessonSection
            step={3}
            totalSteps={TOTAL_STEPS}
            label="Khoảnh khắc Aha"
          >
            <AhaMoment>
              <p>
                GRPO thay thế <strong>giám khảo chuyên nghiệp</strong>{" "}
                (reward model + critic) bằng{" "}
                <strong>so sánh trong nhóm</strong>: cho mô hình sinh 8–64
                bài, bài nào vượt trung bình thì khen, dưới thì giảm. Baseline
                không phải một mạng thần kinh — mà chính là{" "}
                <em>mean của chính nhóm đó</em>. Nhờ vậy GRPO bỏ được critic,
                giữ nguyên tinh thần trust-region của PPO, và vẫn ổn định
                nhờ clipping + KL.
              </p>
            </AhaMoment>
          </LessonSection>

          {/* ═══════════════ STEP 4: CHALLENGES ═══════════════ */}
          <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
            <div className="space-y-4">
              <InlineChallenge
                question="GRPO sinh 8 phản hồi cho prompt '15 × 7 = ?'. Rewards: [1, 0, 1, 1, 0, 1, 0, 1]. Mean = 0.625, std ≈ 0.484. Phản hồi nào có advantage DƯƠNG?"
                options={[
                  "Chỉ những phản hồi có reward = 1 (ở các vị trí 1, 3, 4, 6, 8)",
                  "Tất cả 8 phản hồi đều dương",
                  "Chỉ phản hồi đầu tiên",
                  "Không phản hồi nào — vì mean ≠ 0",
                ]}
                correct={0}
                explanation="Â_i = (r − 0.625) / 0.484. r = 1 → Â ≈ +0.77 (dương, tăng P). r = 0 → Â ≈ −1.29 (âm, giảm P). 5 phản hồi đúng được tăng, 3 sai bị giảm xác suất trong bước gradient."
              />

              <InlineChallenge
                question="Với G = 32 phản hồi, TOÀN BỘ đều sai (reward = 0 cho cả 32). Lúc này bước cập nhật GRPO cho group này làm gì?"
                options={[
                  "Tăng xác suất ngẫu nhiên một phản hồi",
                  "Advantage = 0 cho mọi i (vì r − mean = 0 và std ≈ 0) → group không đóng góp gradient → thường thêm ε nhỏ rồi skip group",
                  "Crash chương trình",
                  "Chuyển sang PPO dự phòng",
                ]}
                correct={1}
                explanation="Khi mọi reward bằng nhau, group mất tín hiệu phân biệt. Implementation chuẩn thêm ε ~ 1e-8 vào std để tránh chia 0, và thực tế thường filter-out những prompt quá khó ở bước curriculum. Đây là lý do prompt selection / khó vừa phải quan trọng với GRPO."
              />
            </div>
          </LessonSection>

          {/* ═══════════════ STEP 5: EXPLANATION ═══════════════ */}
          <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
            <ExplanationSection>
              <p>
                <strong>GRPO</strong> (Group Relative Policy Optimization,
                DeepSeek 2024) là biến thể PPO tối ưu cho fine-tune LLM, đặc
                biệt cho các bài toán có{" "}
                <em>verifiable reward</em>. Nó là bước tiến quan trọng sau{" "}
                <TopicLink slug="rlhf">RLHF</TopicLink> và{" "}
                <TopicLink slug="dpo">DPO</TopicLink>, và là công thức huấn
                luyện của nhiều{" "}
                <TopicLink slug="reasoning-models">
                  reasoning model
                </TopicLink>{" "}
                hiện đại như DeepSeek-R1.
              </p>

              <p>
                <strong>Thiết lập.</strong> Cho prompt <LaTeX>{"x"}</LaTeX>,
                chính sách cũ <LaTeX>{"\\pi_{\\text{old}}"}</LaTeX> sinh G
                phản hồi <LaTeX>{"\\{y_1, \\dots, y_G\\}"}</LaTeX>. Một hàm
                reward <LaTeX>{"R(x, y)"}</LaTeX> cho điểm mỗi phản hồi (có
                thể là verifier toán, test code, rule-based, hay reward
                model — bất kể nguồn).
              </p>

              <p>
                <strong>Bước 1 — Group advantage.</strong> Tính mean và std
                trong nhóm, rồi chuẩn hoá:
              </p>
              <LaTeX block>
                {
                  "\\hat{A}_i \\;=\\; \\frac{r_i - \\text{mean}(\\{r_1,\\dots,r_G\\})}{\\text{std}(\\{r_1,\\dots,r_G\\}) + \\varepsilon}"
                }
              </LaTeX>

              <p>
                Chú ý <LaTeX>{"\\hat{A}_i"}</LaTeX> phụ thuộc HOÀN TOÀN vào
                group — không có value network V(s) học song song, khác với
                PPO.
              </p>

              <p>
                <strong>Bước 2 — Policy objective.</strong> Dùng PPO-style
                clipped objective, nhưng với advantage theo group:
              </p>
              <LaTeX block>
                {
                  "\\mathcal{J}_{\\text{GRPO}}(\\theta) = \\mathbb{E}_{x, \\{y_i\\}} \\left[ \\frac{1}{G}\\sum_{i=1}^{G} \\min\\left( \\rho_i(\\theta) \\hat{A}_i, \\; \\text{clip}\\left(\\rho_i(\\theta), 1-\\epsilon, 1+\\epsilon\\right) \\hat{A}_i \\right) \\right] - \\beta \\, D_{\\text{KL}}\\!\\left( \\pi_\\theta \\,\\|\\, \\pi_{\\text{ref}} \\right)"
                }
              </LaTeX>

              <p>
                Trong đó{" "}
                <LaTeX>
                  {
                    "\\rho_i(\\theta) = \\frac{\\pi_\\theta(y_i|x)}{\\pi_{\\text{old}}(y_i|x)}"
                  }
                </LaTeX>{" "}
                là importance ratio; <LaTeX>{"\\epsilon"}</LaTeX> ≈ 0.2;
                <LaTeX>{"\\beta"}</LaTeX> ≈ 0.02–0.1. Mục tiêu tổng: khuyến
                khích phản hồi có advantage dương, nhưng không cho chính
                sách thay đổi quá mạnh trong một bước (clipping) và phải
                giữ gần mô hình reference (KL).
              </p>

              <Callout
                variant="insight"
                title="Verifiable reward — chìa khoá bắt đầu từ DeepSeek-Math"
              >
                Với toán có đáp án số, ta lấy{" "}
                <LaTeX>{"R = 1"}</LaTeX> nếu trích xuất đúng đáp án,{" "}
                <LaTeX>{"R = 0"}</LaTeX> nếu sai. Với code, ta chạy unit
                test. Hàm reward hoàn toàn tự động, không cần con người gán
                nhãn và không có reward model riêng. Chính đây là điều cho
                phép DeepSeek-R1 huấn luyện hàng trăm ngàn rollout giá rẻ
                và đẩy khả năng reasoning lên rất cao.
              </Callout>

              <Callout
                variant="tip"
                title="Vì sao bỏ được critic?"
              >
                Trong PPO, critic V(s) để giảm variance gradient — nó ước
                tính &quot;phản hồi trung bình sẽ được thưởng bao nhiêu&quot;
                rồi lấy advantage = r − V(s). Nhưng critic cũng là mạng thần
                kinh cần học, thêm 2x VRAM và thường dao động.{"\n"}
                Nhóm GRPO nhận ra: với LLM, nếu ta sinh G phản hồi cho cùng
                x, thì <em>mean của group CHÍNH LÀ</em> một ước lượng
                Monte-Carlo không lệch của V(x). Không cần học gì thêm.
              </Callout>

              <Callout
                variant="warning"
                title="Khi nào GRPO KHÔNG phù hợp"
              >
                (1) Tác vụ chủ quan (thơ, dịch văn, trò chuyện) — reward
                hard-coded khó xây.{"\n"}(2) Tài nguyên hạn chế — sinh G
                phản hồi/prompt rất tốn nếu không có inference engine tối
                ưu.{"\n"}(3) Prompt quá dễ/quá khó — group toàn bằng nhau →
                gradient = 0, không học được gì.
              </Callout>

              <Callout variant="info" title="Một chi tiết thường bị bỏ qua">
                Trong bản gốc DeepSeek, KL được tính ở token level và dùng
                biến thể không lệch (unbiased KL estimator) thay vì đơn
                thuần log ratio. Công thức: D_KL ≈ exp(log_ratio) −
                log_ratio − 1, luôn ≥ 0 và ít phương sai hơn. Đây là mẹo kỹ
                thuật giúp GRPO ổn định với long-context.
              </Callout>

              <CodeBlock
                language="python"
                title="grpo_core.py — pseudocode ngắn gọn"
              >{`import torch
import torch.nn.functional as F

def grpo_step(
    prompt_batch,          # list of prompts
    policy,                # π_θ, sinh + log-prob
    policy_old,            # π_old (lưu tạm trước step)
    policy_ref,            # π_ref (mô hình SFT) — KL anchor
    reward_fn,             # reward(prompt, response) -> float
    G: int = 16,           # group size
    epsilon: float = 0.2,
    beta: float = 0.04,
    eps_std: float = 1e-8,
):
    """Một bước GRPO."""
    loss_total = 0.0
    for prompt in prompt_batch:
        # 1) Rollout G phản hồi từ π_old
        responses = policy_old.generate(prompt, num_return=G,
                                         temperature=0.9, top_p=0.95)

        # 2) Chấm reward
        rewards = torch.tensor(
            [reward_fn(prompt, y) for y in responses], dtype=torch.float32
        )

        # 3) Group advantage
        mean_r = rewards.mean()
        std_r = rewards.std() + eps_std
        advantages = (rewards - mean_r) / std_r   # (G,)

        # 4) Log-prob mới / cũ (tính ở token-level, ở đây vắn tắt)
        logp_new = policy.log_prob(prompt, responses)       # (G,)
        logp_old = policy_old.log_prob(prompt, responses)   # (G,)
        logp_ref = policy_ref.log_prob(prompt, responses)   # (G,)

        # 5) Importance ratio + clipped objective
        rho = torch.exp(logp_new - logp_old)
        unclipped = rho * advantages
        clipped = torch.clamp(rho, 1 - epsilon, 1 + epsilon) * advantages
        ppo_term = torch.min(unclipped, clipped).mean()

        # 6) KL penalty (unbiased estimator)
        log_ratio_ref = logp_new - logp_ref
        kl = (torch.exp(log_ratio_ref) - log_ratio_ref - 1).mean()

        loss = -(ppo_term - beta * kl)   # minimize -J
        loss_total = loss_total + loss

    loss_total = loss_total / len(prompt_batch)
    loss_total.backward()
    # optimizer.step(); optimizer.zero_grad() ở bên ngoài

    return loss_total.detach().item()
`}</CodeBlock>

              <CodeBlock
                language="python"
                title="Verifiable reward thực tế — toán và code"
              >{`import re, subprocess, tempfile, os

# ── Toán: trích xuất <answer>…</answer>, so khớp đáp án số ──
def math_reward(prompt, response, ground_truth: str) -> float:
    m = re.search(r"<answer>(.*?)</answer>", response, re.S)
    if not m:
        return 0.0
    pred = m.group(1).strip().replace(",", "")
    # reward chính + reward format nhỏ
    base = 1.0 if pred == ground_truth.strip() else 0.0
    fmt = 0.1  # có <answer>…</answer>
    return base + fmt

# ── Code: lưu file, chạy pytest với test có sẵn ──
def code_reward(prompt, response, test_code: str, timeout: int = 5) -> float:
    # Trích code block
    m = re.search(r"\`\`\`python(.*?)\`\`\`", response, re.S)
    if not m:
        return 0.0
    code = m.group(1)
    with tempfile.TemporaryDirectory() as d:
        open(os.path.join(d, "sol.py"), "w").write(code)
        open(os.path.join(d, "test_sol.py"), "w").write(test_code)
        try:
            r = subprocess.run(
                ["pytest", "-q", d],
                capture_output=True, timeout=timeout, text=True,
            )
            return 1.0 if r.returncode == 0 else 0.0
        except subprocess.TimeoutExpired:
            return -0.1   # phạt nhẹ nếu bị treo

# Reward tổng có thể cộng dồn: đúng + format + length penalty + ...
def combined_reward(prompt, response, meta):
    r = math_reward(prompt, response, meta["gt"])
    # Phạt câu trả lời dài hơn 2k tokens
    if len(response.split()) > 2000:
        r -= 0.2
    return r
`}</CodeBlock>

              <CollapsibleDetail title="Đi sâu: vì sao GRPO ổn định với LLM dài context hơn PPO?">
                <p>
                  Với PPO truyền thống, value network V(s) ở level token
                  thường không ổn định khi context dài: một token sai sớm
                  làm V chệch nhiều token sau. Advantage theo GAE kết hợp
                  nhiều bước, nhiễu tích tụ.
                </p>
                <p className="mt-2">
                  GRPO thay V(s) bằng mean group — ước tính{" "}
                  <em>Monte Carlo không lệch</em> của phần thưởng kỳ vọng.
                  Phương sai có thể cao hơn V(s) học tốt, nhưng với G ≥ 8
                  đã đủ nhỏ. Quan trọng hơn: không còn mạng thần kinh phụ
                  drift → KL chỉ phải kiểm soát một mô hình.
                </p>
                <p className="mt-2">
                  Ngoài ra, DeepSeek dùng{" "}
                  <em>reward normalization per prompt group</em> — tức là
                  chia theo std riêng từng group — nên prompt dễ (group có
                  variance nhỏ) không bị khuếch đại bởi gradient lớn. Tính
                  chất này rất hữu ích trong curriculum: các prompt dễ tự
                  nhiên &quot;ngủ yên&quot;, prompt khó đóng góp nhiều
                  hơn.
                </p>
              </CollapsibleDetail>

              <CollapsibleDetail title="Đi sâu: GRPO vs REINFORCE vs RLOO vs DPO">
                <p>
                  <strong>REINFORCE</strong> (Williams 1992): gradient =
                  r · ∇ log π(y|x). Không baseline → phương sai cực cao,
                  không ổn định cho LLM.
                </p>
                <p className="mt-2">
                  <strong>RLOO</strong> (REINFORCE Leave-One-Out,
                  Ahmadian 2024): baseline = mean của G−1 phản hồi còn lại
                  (không tính phản hồi i). Gần giống GRPO nhưng KHÔNG
                  chuẩn hoá theo std. Thường được so sánh trực tiếp;
                  GRPO ổn định hơn nhờ std normalization + KL anchor.
                </p>
                <p className="mt-2">
                  <strong>DPO</strong> (Rafailov 2023): supervised trên
                  cặp (y_w, y_l) preference; không RL, không cần reward
                  model tại huấn luyện. Rất đơn giản nhưng yêu cầu dữ liệu
                  preference và không khám phá ngoài phân phối. GRPO bổ sung
                  exploration qua sampling và verifiable reward.
                </p>
                <p className="mt-2">
                  <strong>PPO (RLHF gốc)</strong>: dùng reward model + value
                  network + clipping + KL. Mạnh và tổng quát nhất nhưng tốn
                  bộ nhớ và rất nhạy với tune.
                </p>
                <p className="mt-2">
                  Kinh nghiệm 2024–2025: với reasoning task và verifier rõ
                  ràng, GRPO thường cho sample-efficiency tốt hơn PPO-RLHF
                  ở cùng ngân sách tính toán. Với tác vụ chatty tổng quát
                  (helpful + harmless), RLHF-PPO hoặc DPO + IPO vẫn là
                  pipeline chủ đạo.
                </p>
              </CollapsibleDetail>

              <p>
                <strong>Ứng dụng thực tế.</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>Reasoning models:</strong> DeepSeek-R1,
                  DeepSeek-Math, Qwen2.5-Math — dùng GRPO với verifier
                  toán/code; đạt SOTA trên MATH, AIME, Codeforces.
                </li>
                <li>
                  <strong>Agent tool-use:</strong> huấn luyện agent gọi tool
                  đúng format + hoàn thành task đo được (VD: đúng API, đúng
                  JSON schema, đúng kết quả query).
                </li>
                <li>
                  <strong>Code generation:</strong> reward = pass/fail unit
                  test; đặc biệt mạnh cho competitive programming.
                </li>
                <li>
                  <strong>Game & simulation:</strong> reward trực tiếp từ
                  môi trường — GRPO thay thế PPO trong một số baseline RL
                  mới.
                </li>
                <li>
                  <strong>Safety & alignment:</strong> kết hợp verifier
                  &quot;đúng hướng dẫn&quot; (rule-based check) để fine-tune
                  tuân thủ format / từ chối nội dung nhạy cảm mà không cần
                  dữ liệu preference quy mô lớn.
                </li>
              </ul>

              <p>
                <strong>Pitfalls thường gặp.</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>Reward hacking:</strong> mô hình tìm ra đường đi
                  tắt đạt reward mà không giải đúng (VD: luôn in
                  &quot;42&quot;, lạm dụng format thưởng). Giảm thiểu bằng
                  verifier chặt + KL đủ lớn + reward shaping đa chiều (đúng
                  + format + length).
                </li>
                <li>
                  <strong>Reward sparsity:</strong> với task khó, hầu hết G
                  sample đều sai → group không có tín hiệu. Dùng curriculum
                  learning từ dễ → khó, hoặc pretrain SFT tốt trước khi RL.
                </li>
                <li>
                  <strong>Chi phí rollout:</strong> G × #prompt × tokens →
                  dễ tốn gấp 10–30 lần SFT. Bắt buộc dùng inference engine
                  tối ưu (vLLM, SGLang, TensorRT-LLM) và có thể fix seed để
                  reproducible.
                </li>
                <li>
                  <strong>KL drift chậm:</strong> β quá nhỏ → policy trôi
                  xa ref, mất ngôn ngữ tự nhiên; β quá lớn → policy không
                  học được. Theo dõi D_KL thực tế theo thời gian và tune.
                </li>
                <li>
                  <strong>Length bias:</strong> phản hồi dài dễ có reward
                  format cao hơn → mô hình viết dài thừa. Thêm length
                  penalty hoặc normalize reward theo token.
                </li>
                <li>
                  <strong>Group size quá nhỏ:</strong> G = 2 làm baseline
                  dao động mạnh, giống REINFORCE. Mặc định G = 8–16, mạnh
                  hơn có thể G = 32–64.
                </li>
              </ul>
            </ExplanationSection>
          </LessonSection>

          {/* ═══════════════ STEP 6: SUMMARY ═══════════════ */}
          <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
            <MiniSummary
              title="6 điều cần nhớ về GRPO"
              points={[
                "GRPO sinh G phản hồi cho cùng prompt, chấm reward, rồi dùng mean/std của NHÓM làm baseline — không cần critic/value network.",
                "Advantage Â_i = (r_i − mean(r)) / std(r) → mẫu vượt trung bình được tăng P, dưới trung bình bị giảm P.",
                "Kế thừa từ PPO: importance ratio ρ = π_new/π_old, clipping ε ≈ 0.2 giữ trust region, KL penalty β neo gần mô hình reference để chống reward hacking.",
                "Đặc biệt mạnh với VERIFIABLE REWARD (toán, code, logic) — DeepSeek-R1, DeepSeek-Math dùng GRPO đạt SOTA reasoning mà không cần reward model.",
                "Chi phí chính ở giai đoạn ROLLOUT (G × #prompt) — cần inference engine tối ưu (vLLM, SGLang) để ngân sách thực tế.",
                "Không phù hợp tác vụ chủ quan, tác vụ mà group dễ toàn sai/toàn đúng (advantage = 0); chọn DPO hoặc PPO-RLHF khi thích hợp hơn.",
              ]}
            />
          </LessonSection>

          {/* ═══════════════ STEP 7: QUIZ ═══════════════ */}
          <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
            <QuizSection questions={QUIZ} />
          </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
