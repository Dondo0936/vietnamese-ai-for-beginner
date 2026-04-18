"use client";
import { useMemo, useState, useCallback } from "react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CollapsibleDetail,
  CodeBlock,
  LaTeX,
  TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "ai-in-finance",
  title: "AI in Finance",
  titleVi: "AI trong Tài chính",
  description:
    "Ứng dụng AI trong phát hiện gian lận, phân tích rủi ro và giao dịch tự động",
  category: "applied-ai",
  tags: ["fraud-detection", "risk", "trading"],
  difficulty: "beginner",
  relatedSlugs: ["decision-trees", "gradient-boosting", "sentiment-analysis"],
  vizType: "interactive",
  tocSections: [{ id: "explanation", labelVi: "Giải thích" }],
};

const TOTAL_STEPS = 7;

// ---------------------------------------------------------------------------
// Dữ liệu mô phỏng cho visualization
// Mỗi "giao dịch" có (x, y) là 2 feature tổng hợp (đã chuẩn hóa về 0–100):
//   x  — mức độ lệch số tiền so với lịch sử của user (amount-deviation score)
//   y  — mức độ lệch ngữ cảnh (location/time/device/merchant deviation score)
// label = 1 nếu là gian lận thực sự, 0 nếu bình thường.
// Threshold là một đường tròn tâm (0,0): distance >= T ⇒ model flag là fraud.
// Dữ liệu được sinh tĩnh (deterministic) để tránh lệch giữa SSR/CSR.
// ---------------------------------------------------------------------------

type Txn = {
  id: number;
  x: number; // 0..100
  y: number; // 0..100
  label: 0 | 1; // 1 = fraud thực sự
  amount: number; // VND
  merchant: string;
  country: string;
};

const MERCHANTS = [
  "Shopee",
  "Lazada",
  "Tiki",
  "Grab",
  "VinMart",
  "Circle K",
  "CGV",
  "Highlands",
  "Booking.com",
  "Apple",
  "Unknown-Online",
  "Crypto-Exchange",
  "Forex-Broker",
  "Gift-Card-Shop",
];

const COUNTRIES_LOCAL = ["VN", "VN", "VN", "VN", "VN"];
const COUNTRIES_RISKY = ["NG", "RU", "KP", "IR", "UA", "BY"];

// Pseudo-random generator (mulberry32) để deterministic trên mọi lần render.
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildTransactions(seed = 42, n = 220): Txn[] {
  const rand = mulberry32(seed);
  const txns: Txn[] = [];

  // 92% giao dịch bình thường, tập trung gần gốc (0..40, 0..40)
  const nNormal = Math.round(n * 0.92);
  for (let i = 0; i < nNormal; i++) {
    // Gaussian-ish qua Box–Muller đơn giản
    const u1 = Math.max(1e-6, rand());
    const u2 = rand();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
    const x = Math.max(0, Math.min(100, 18 + z0 * 10));
    const y = Math.max(0, Math.min(100, 20 + z1 * 11));
    txns.push({
      id: i,
      x,
      y,
      label: 0,
      amount: Math.round(50000 + rand() * 950000),
      merchant: MERCHANTS[Math.floor(rand() * 10)]!,
      country: COUNTRIES_LOCAL[Math.floor(rand() * COUNTRIES_LOCAL.length)]!,
    });
  }

  // 8% gian lận thực sự — tập trung ở vùng distance cao (60..95)
  const nFraud = n - nNormal;
  for (let i = 0; i < nFraud; i++) {
    const angle = rand() * Math.PI * 0.5; // góc trong phần tư dương
    const radius = 55 + rand() * 40; // 55..95
    const x = Math.max(0, Math.min(100, Math.cos(angle) * radius));
    const y = Math.max(0, Math.min(100, Math.sin(angle) * radius));
    txns.push({
      id: nNormal + i,
      x,
      y,
      label: 1,
      amount: Math.round(2_000_000 + rand() * 48_000_000),
      merchant:
        MERCHANTS[10 + Math.floor(rand() * 4)] ??
        MERCHANTS[MERCHANTS.length - 1]!,
      country:
        COUNTRIES_RISKY[Math.floor(rand() * COUNTRIES_RISKY.length)]!,
    });
  }

  // Thêm một ít "gray zone" — giao dịch bình thường NHƯNG ở vùng lệch
  // (để tạo false positives rõ rệt khi threshold thấp)
  for (let i = 0; i < 10; i++) {
    txns.push({
      id: txns.length,
      x: 45 + rand() * 25,
      y: 40 + rand() * 25,
      label: 0,
      amount: Math.round(3_000_000 + rand() * 15_000_000),
      merchant: MERCHANTS[Math.floor(rand() * MERCHANTS.length)]!,
      country: rand() > 0.5 ? "VN" : "SG",
    });
  }

  // Thêm một vài fraud khó — nằm gần vùng bình thường (để recall không đạt 100%)
  for (let i = 0; i < 6; i++) {
    txns.push({
      id: txns.length,
      x: 30 + rand() * 18,
      y: 28 + rand() * 20,
      label: 1,
      amount: Math.round(1_500_000 + rand() * 6_000_000),
      merchant: MERCHANTS[10 + Math.floor(rand() * 4)]!,
      country: rand() > 0.5 ? "VN" : "TH",
    });
  }

  return txns;
}

// ---------------------------------------------------------------------------
// Interactive fraud-detection simulator
// ---------------------------------------------------------------------------

function FraudSimulator() {
  const transactions = useMemo(() => buildTransactions(42, 220), []);
  const [threshold, setThreshold] = useState<number>(55);
  const [hoverId, setHoverId] = useState<number | null>(null);
  const [showOnly, setShowOnly] = useState<"all" | "fraud" | "normal">("all");

  // Tính metrics dựa trên threshold
  const stats = useMemo(() => {
    let tp = 0;
    let fp = 0;
    let fn = 0;
    let tn = 0;
    let blockedAmount = 0;
    let missedAmount = 0;
    let falseBlockedAmount = 0;
    for (const t of transactions) {
      const dist = Math.sqrt(t.x * t.x + t.y * t.y);
      const flagged = dist >= threshold;
      if (flagged && t.label === 1) {
        tp += 1;
        blockedAmount += t.amount;
      } else if (flagged && t.label === 0) {
        fp += 1;
        falseBlockedAmount += t.amount;
      } else if (!flagged && t.label === 1) {
        fn += 1;
        missedAmount += t.amount;
      } else {
        tn += 1;
      }
    }
    const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
    const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
    const f1 =
      precision + recall === 0
        ? 0
        : (2 * precision * recall) / (precision + recall);
    const fraudTotal = tp + fn;
    const normalTotal = fp + tn;
    return {
      tp,
      fp,
      fn,
      tn,
      precision,
      recall,
      f1,
      fraudTotal,
      normalTotal,
      blockedAmount,
      missedAmount,
      falseBlockedAmount,
    };
  }, [transactions, threshold]);

  const handleThreshold = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setThreshold(Number(e.target.value));
    },
    [],
  );

  // Kích thước SVG
  const W = 520;
  const H = 360;
  const pad = 28;
  const plotW = W - pad * 2;
  const plotH = H - pad * 2;

  const xScale = (x: number) => pad + (x / 100) * plotW;
  const yScale = (y: number) => H - pad - (y / 100) * plotH;
  // Đường tròn threshold trong hệ tọa độ pixel: do x và y có scale khác nhau nên
  // ta vẽ như 1 ellipse để trực quan hóa ranh giới "distance = T".
  const rX = (threshold / 100) * plotW;
  const rY = (threshold / 100) * plotH;

  const hovered = hoverId == null ? null : transactions.find((t) => t.id === hoverId) ?? null;

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold">
          Mô phỏng phát hiện gian lận — Techcombank Demo
        </h3>
        <p className="text-sm text-muted-foreground">
          Mỗi chấm là một giao dịch. Trục X: độ lệch số tiền so với lịch sử
          user. Trục Y: độ lệch ngữ cảnh (địa điểm, thời gian, thiết bị). Đường
          cong = ngưỡng phát hiện của model — giao dịch nằm NGOÀI cung sẽ bị
          flag.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_260px]">
        {/* SVG scatter */}
        <div className="relative">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label="Biểu đồ scatter các giao dịch với ngưỡng phát hiện"
            className="h-auto w-full rounded-xl border border-border/60 bg-background"
          >
            {/* Grid */}
            {Array.from({ length: 6 }).map((_, i) => {
              const gx = pad + (i / 5) * plotW;
              const gy = pad + (i / 5) * plotH;
              return (
                <g key={`g-${i}`}>
                  <line
                    x1={gx}
                    x2={gx}
                    y1={pad}
                    y2={H - pad}
                    stroke="currentColor"
                    strokeOpacity={0.08}
                  />
                  <line
                    x1={pad}
                    x2={W - pad}
                    y1={gy}
                    y2={gy}
                    stroke="currentColor"
                    strokeOpacity={0.08}
                  />
                </g>
              );
            })}

            {/* Axes */}
            <line
              x1={pad}
              x2={W - pad}
              y1={H - pad}
              y2={H - pad}
              stroke="currentColor"
              strokeOpacity={0.4}
            />
            <line
              x1={pad}
              x2={pad}
              y1={pad}
              y2={H - pad}
              stroke="currentColor"
              strokeOpacity={0.4}
            />
            <text
              x={W - pad}
              y={H - 6}
              textAnchor="end"
              fontSize={11}
              fill="currentColor"
              opacity={0.6}
            >
              Độ lệch số tiền →
            </text>
            <text
              x={10}
              y={pad + 4}
              fontSize={11}
              fill="currentColor"
              opacity={0.6}
            >
              ↑ Độ lệch ngữ cảnh
            </text>

            {/* Threshold arc (1/4 ellipse trong phần tư dương) */}
            <path
              d={`M ${xScale(0)} ${yScale(threshold)} A ${rX} ${rY} 0 0 0 ${xScale(threshold)} ${yScale(0)}`}
              fill="none"
              stroke="#ef4444"
              strokeOpacity={0.85}
              strokeWidth={2}
              strokeDasharray="6 4"
            />
            {/* Vùng "flag" được tô nhẹ */}
            <path
              d={`
                M ${xScale(100)} ${yScale(0)}
                L ${xScale(100)} ${yScale(100)}
                L ${xScale(0)} ${yScale(100)}
                L ${xScale(0)} ${yScale(threshold)}
                A ${rX} ${rY} 0 0 0 ${xScale(threshold)} ${yScale(0)}
                Z
              `}
              fill="#ef4444"
              fillOpacity={0.06}
            />

            {/* Các chấm giao dịch */}
            {transactions.map((t) => {
              if (showOnly === "fraud" && t.label === 0) return null;
              if (showOnly === "normal" && t.label === 1) return null;
              const dist = Math.sqrt(t.x * t.x + t.y * t.y);
              const flagged = dist >= threshold;
              const fill =
                t.label === 1
                  ? flagged
                    ? "#dc2626" // TP
                    : "#fb923c" // FN (fraud bị lọt) — cam cảnh báo
                  : flagged
                  ? "#a78bfa" // FP
                  : "#34d399"; // TN
              return (
                <circle
                  key={t.id}
                  cx={xScale(t.x)}
                  cy={yScale(t.y)}
                  r={hoverId === t.id ? 6 : 3.5}
                  fill={fill}
                  fillOpacity={0.85}
                  stroke={hoverId === t.id ? "#111827" : "none"}
                  strokeWidth={1}
                  onMouseEnter={() => setHoverId(t.id)}
                  onMouseLeave={() => setHoverId(null)}
                  onFocus={() => setHoverId(t.id)}
                  onBlur={() => setHoverId(null)}
                  tabIndex={0}
                />
              );
            })}
          </svg>

          {hovered ? (
            <div className="pointer-events-none absolute right-2 top-2 rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
              <div className="font-mono">#{hovered.id}</div>
              <div>
                {hovered.amount.toLocaleString("vi-VN")} VND · {hovered.merchant}
              </div>
              <div className="text-muted-foreground">
                {hovered.country} · {hovered.label === 1 ? "FRAUD thực sự" : "Bình thường"}
              </div>
            </div>
          ) : null}
        </div>

        {/* Control panel */}
        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">Ngưỡng phát hiện (T)</span>
              <span className="font-mono text-sm tabular-nums">
                {threshold.toFixed(0)}
              </span>
            </div>
            <input
              type="range"
              min={15}
              max={95}
              step={1}
              value={threshold}
              onChange={handleThreshold}
              className="w-full accent-red-500"
              aria-label="Ngưỡng phát hiện gian lận"
            />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>Nhạy (bắt nhiều, báo nhầm nhiều)</span>
              <span>An toàn user (bỏ lọt fraud)</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setShowOnly("all")}
              className={`rounded-md border px-2 py-1 ${showOnly === "all" ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"}`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setShowOnly("fraud")}
              className={`rounded-md border px-2 py-1 ${showOnly === "fraud" ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"}`}
            >
              Chỉ fraud
            </button>
            <button
              type="button"
              onClick={() => setShowOnly("normal")}
              className={`rounded-md border px-2 py-1 ${showOnly === "normal" ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"}`}
            >
              Chỉ hợp lệ
            </button>
          </div>

          <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm">
            <div className="mb-2 font-semibold">Kết quả ở ngưỡng T = {threshold}</div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-xs tabular-nums">
              <dt>Precision</dt>
              <dd className="text-right">{(stats.precision * 100).toFixed(1)}%</dd>
              <dt>Recall</dt>
              <dd className="text-right">{(stats.recall * 100).toFixed(1)}%</dd>
              <dt>F1</dt>
              <dd className="text-right">{(stats.f1 * 100).toFixed(1)}%</dd>
              <dt>TP (bắt đúng)</dt>
              <dd className="text-right">{stats.tp}</dd>
              <dt>FP (báo nhầm)</dt>
              <dd className="text-right">{stats.fp}</dd>
              <dt>FN (lọt lưới)</dt>
              <dd className="text-right">{stats.fn}</dd>
              <dt>TN (bỏ qua đúng)</dt>
              <dd className="text-right">{stats.tn}</dd>
            </dl>
          </div>

          <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs leading-relaxed">
            <div className="mb-1 font-semibold">Tác động tài chính</div>
            <div>
              Chặn đúng: {(stats.blockedAmount / 1_000_000).toFixed(1)}M VND
            </div>
            <div className="text-orange-600 dark:text-orange-400">
              Fraud lọt: {(stats.missedAmount / 1_000_000).toFixed(1)}M VND
            </div>
            <div className="text-purple-600 dark:text-purple-400">
              User bị chặn nhầm: {(stats.falseBlockedAmount / 1_000_000).toFixed(1)}M VND
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-xs">
            <LegendDot color="#dc2626" label="TP — fraud bị bắt" />
            <LegendDot color="#fb923c" label="FN — fraud lọt" />
            <LegendDot color="#a78bfa" label="FP — báo nhầm" />
            <LegendDot color="#34d399" label="TN — bình thường" />
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Gợi ý: kéo slider sang trái (T nhỏ) → model bắt được gần như mọi fraud
        (recall cao) nhưng chặn nhầm rất nhiều user (precision tụt). Kéo sang
        phải (T lớn) → precision cao, gần như không chặn nhầm ai, nhưng rất
        nhiều fraud lọt lưới. Ngành ngân hàng chọn T dựa trên{" "}
        <em>chi phí</em> của mỗi loại lỗi, không phải trên accuracy.
      </p>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Topic component
// ---------------------------------------------------------------------------

export default function AIInFinanceTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question: "Phát hiện gian lận thẻ tín dụng dùng AI kiểu nào?",
        options: [
          "Rule-based: nếu > 10 triệu thì block",
          "ML model học patterns giao dịch bình thường của MỖI user. Giao dịch bất thường (khác pattern) → flag. XGBoost + real-time scoring",
          "AI tự động block mọi giao dịch lớn",
        ],
        correct: 1,
        explanation:
          "Mỗi user có 'profile' riêng: thường mua gì, ở đâu, giờ nào, bao nhiêu. Giao dịch lệch khỏi profile → anomaly score cao → flag. VD: bạn thường mua 200K ở Hà Nội, đột nhiên có giao dịch 50 triệu ở Nigeria → flag! Vietcombank, Techcombank đều dùng.",
      },
      {
        question:
          "Credit scoring (chấm điểm tín dụng) dùng AI có vấn đề gì về fairness?",
        options: [
          "Không có vấn đề",
          "Model có thể học BIAS từ data lịch sử: nhóm nào ít được vay trước → model đánh giá thấp → tiếp tục ít được vay (feedback loop)",
          "AI luôn công bằng hơn người",
        ],
        correct: 1,
        explanation:
          "Data lịch sử: phụ nữ/dân tộc thiểu số ít được vay (bias xã hội) → model học bias này → score thấp cho nhóm này → ít được vay → confirm bias (vicious cycle). Cần: fairness constraints, bias auditing, protected attributes, explainability.",
      },
      {
        question: "Algorithmic trading có thể gây 'flash crash'. Vì sao?",
        options: [
          "GPU quá nhanh",
          "Nhiều trading bots phản ứng CÙNG LÚC với tín hiệu → bán đồng loạt → giá giảm → bots bán thêm → cascade",
          "Lỗi phần cứng",
        ],
        correct: 1,
        explanation:
          "Flash Crash 2010: Dow giảm 1000 điểm trong 5 phút rồi phục hồi. Lý do: 1 bot bán lớn → nhiều bots thấy giá giảm → bán theo → cascade. AI trading cần: circuit breakers, position limits, diversity trong strategies.",
      },
      {
        question:
          "Một hệ thống fraud detection đạt precision = 99% và recall = 80%. Ngân hàng cần bắt nhiều fraud hơn. Nên làm gì với threshold?",
        options: [
          "Tăng threshold để precision còn cao hơn",
          "Giảm threshold: model flag dễ dãi hơn → recall tăng (bắt nhiều hơn) nhưng precision giảm (báo nhầm nhiều hơn)",
          "Giữ nguyên — không có cách nào cả",
        ],
        correct: 1,
        explanation:
          "Threshold và recall NGHỊCH chiều. Threshold thấp → model gọi nhiều cái là 'fraud' → bắt được nhiều fraud thật (recall ↑) nhưng cũng bắt nhầm nhiều giao dịch thật (precision ↓). Đây là trade-off cơ bản của classification.",
      },
      {
        question:
          "Giao dịch 5 triệu VND ở Hà Nội lúc 14h, merchant Shopee. Mô hình flag 'fraud'. SHAP value cho thấy đóng góp chính là 'device_id mới'. Phản ứng hợp lý nhất?",
        options: [
          "Block thẳng, user phải ra chi nhánh",
          "Challenge bằng OTP / sinh trắc học — nếu user xác nhận được thì thả, đồng thời cập nhật device_id vào profile",
          "Bỏ qua — flag sai",
        ],
        correct: 1,
        explanation:
          "Risk-based authentication: thay vì block cứng, leo thang xác thực (OTP, Face ID). User thật vượt qua dễ dàng, kẻ gian không có OTP. Đây là cách các ví như MoMo, ZaloPay xử lý — giảm friction mà vẫn an toàn.",
      },
      {
        question:
          "Vì sao dữ liệu fraud cực kỳ mất cân bằng (99.9% legit, 0.1% fraud) lại LÀ vấn đề nghiêm trọng khi train model?",
        options: [
          "Không phải vấn đề, càng nhiều data càng tốt",
          "Model có thể đạt accuracy 99.9% chỉ bằng cách dự đoán 'mọi thứ đều legit' — accuracy cao nhưng hoàn toàn vô dụng",
          "GPU không xử lý được dữ liệu lớn",
        ],
        correct: 1,
        explanation:
          "Class imbalance: model lười dự đoán toàn majority class → accuracy 99.9% nhưng recall ≈ 0. Phải dùng class weights (scale_pos_weight), resampling (SMOTE), hoặc focal loss. Và đánh giá bằng precision/recall/PR-AUC thay vì accuracy.",
      },
      {
        question:
          "EU AI Act và Basel III yêu cầu credit scoring model phải 'giải thích được'. Công cụ nào phù hợp nhất?",
        options: [
          "Confusion matrix",
          "SHAP values hoặc LIME — gán đóng góp của từng feature cho từng quyết định cụ thể",
          "Loss curve",
        ],
        correct: 1,
        explanation:
          "SHAP (SHapley Additive exPlanations) dựa trên lý thuyết trò chơi, phân rã output thành đóng góp của từng feature cho từng instance. Cho phép trả lời 'tại sao khách hàng X bị từ chối vay': 60% do thu nhập, 25% do nợ cũ, 15% do lịch sử tín dụng ngắn.",
      },
      {
        type: "fill-blank",
        question:
          "Hai ứng dụng AI phổ biến nhất trong ngân hàng là {blank} để chặn giao dịch bất thường và {blank} để quyết định hạn mức cho vay.",
        blanks: [
          {
            answer: "fraud detection",
            accept: [
              "phát hiện gian lận",
              "chống gian lận",
              "anti-fraud",
            ],
          },
          {
            answer: "credit scoring",
            accept: [
              "chấm điểm tín dụng",
              "chấm điểm tín nhiệm",
              "tín dụng",
            ],
          },
        ],
        explanation:
          "Fraud detection: ML model chấm điểm anomaly real-time (<100ms) cho từng giao dịch, flag nếu lệch pattern. Credit scoring: ML đánh giá rủi ro tín dụng dựa trên lịch sử giao dịch, thu nhập, demographic — cần fairness audit tránh bias.",
      },
    ],
    [],
  );

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Ngân hàng Techcombank xử lý 10 triệu giao dịch/ngày. 0.1% là gian lận (10K). Cần phát hiện real-time (<100ms). Con người không thể. Giải pháp?"
          options={[
            "Thuê 10.000 nhân viên kiểm tra",
            "ML model scoring real-time: mỗi giao dịch được chấm điểm anomaly trong 10ms, flag nếu score cao",
            "Block tất cả giao dịch quốc tế",
          ]}
          correct={1}
          explanation="AI fraud detection: mỗi giao dịch → extract features (số tiền, địa điểm, thời gian, merchant) → ML model (XGBoost/neural network) → anomaly score trong 10ms. Score > threshold → block/OTP. Techcombank, VPBank, Momo đều dùng AI như vậy!"
        >
          <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Phép ẩn dụ">
            <p>
              Hãy hình dung một <strong>chốt an ninh sân bay</strong>. Mỗi phút
              có hàng trăm hành khách đi qua. Nhân viên không thể hỏi cung từng
              người — họ dựa vào <em>tín hiệu bất thường</em>: ánh mắt lảng
              tránh, hành lý nặng bất thường, vé một chiều mua bằng tiền mặt
              phút chót. Mỗi tín hiệu riêng lẻ chưa đủ để giữ người, nhưng
              chồng nhiều tín hiệu lên nhau thì mô hình rủi ro tăng nhanh.
            </p>
            <p>
              Một <strong>hệ thống fraud detection</strong> của ngân hàng hoạt
              động y hệt. Mỗi giao dịch là một "hành khách": số tiền, địa điểm,
              thiết bị, merchant, thời điểm, tốc độ click, cả độ rung của bàn
              phím khi gõ mật khẩu. Model học <em>profile bình thường</em> của
              từng khách hàng trong nhiều tháng, rồi chấm điểm bất thường cho
              mỗi giao dịch mới trong vài chục mili-giây. Giao dịch nào có
              điểm vượt ngưỡng sẽ bị leo thang xác thực — đúng như nhân viên
              an ninh mời một hành khách vào phòng kiểm tra phụ.
            </p>
            <p>
              Cái hay của phép ẩn dụ này là nó cũng lộ ra các{" "}
              <em>đánh đổi</em> mà ta sắp gặp: nếu chốt quá ngặt, hàng dài
              hành khách bị chặn oan, sân bay tê liệt. Nếu quá lỏng, kẻ xấu
              lọt qua. Ngành tài chính không đi tìm một con số "accuracy" đẹp
              — họ đi tìm <strong>đường cân bằng chi phí</strong> giữa hai loại
              sai lầm.
            </p>
          </LessonSection>

          <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khám phá">
            <VisualizationSection topicSlug="ai-in-finance">
              <FraudSimulator />
            </VisualizationSection>
          </LessonSection>

          <LessonSection
            step={4}
            totalSteps={TOTAL_STEPS}
            label="Khoảnh khắc Aha"
          >
            <AhaMoment>
              <p>
                AI trong tài chính không phải là một "thuật toán ma thuật" đoán
                tương lai. Nó là một <strong>kính lúp xác suất</strong>: nhìn
                vào biển dữ liệu giao dịch, nó khuếch đại những tín hiệu mà con
                người không kịp nhìn, và quy chúng về một con số duy nhất — xác
                suất sự kiện xấu.
              </p>
              <p>
                Bốn ứng dụng lớn cùng chia sẻ cấu trúc đó:{" "}
                <strong>Fraud detection</strong> (real-time),{" "}
                <strong>Credit scoring</strong> (cho vay),{" "}
                <strong>Algorithmic trading</strong> (giao dịch tự động),{" "}
                <strong>Risk management</strong> (đánh giá rủi ro danh mục).
                Công nghệ có thể khác nhau, nhưng câu hỏi cốt lõi là một:{" "}
                <em>
                  chi phí của việc tôi sai theo hướng A so với hướng B là bao
                  nhiêu, và đâu là ngưỡng tối ưu?
                </em>
              </p>
              <p>
                Tại Việt Nam, Techcombank, VPBank, Momo, ZaloPay đều vận hành
                các hệ thống scoring real-time. FE Credit và Home Credit dùng
                ML cho quyết định cho vay. VNG, VinGroup đã bắt đầu đưa{" "}
                <TopicLink slug="sentiment-analysis">
                  sentiment analysis
                </TopicLink>{" "}
                tin tức vào pipeline quản lý rủi ro danh mục.
              </p>
            </AhaMoment>
          </LessonSection>

          <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
            <InlineChallenge
              question="Fraud detection model: precision 99% (chỉ 1% false alarm), recall 80% (bắt 80% fraud). 10K fraud/ngày. Bao nhiêu fraud vượt qua?"
              options={[
                "100",
                "2000 — recall 80% nghĩa là 20% fraud không bị bắt = 2000 giao dịch gian lận/ngày!",
                "0",
              ]}
              correct={1}
              explanation="Recall 80% = 20% fraud lọt = 2000/ngày x $500 trung bình = $1M mất/ngày! Tăng recall lên 95% = chỉ 500 lọt = $250K. Trade-off: tăng recall → tăng false alarm → nhiều user bị block nhầm. Cần tìm balance dựa trên cost: cost(miss fraud) >> cost(false alarm)."
            />
            <InlineChallenge
              question="Một model credit scoring đạt AUC 0.92 trên tập test nhưng khi triển khai thật, tỉ lệ default tăng 40%. Giả thuyết hợp lý nhất?"
              options={[
                "GPU quá nóng",
                "Data drift: phân phối khách hàng thực tế khác với data train (kinh tế suy thoái, nhóm khách hàng mới, sản phẩm mới) → model stale",
                "Random bad luck",
              ]}
              correct={1}
              explanation="Data drift (hoặc concept drift) là nguyên nhân phổ biến nhất khi model performance tụt sau deploy. Giải pháp: monitoring phân phối feature, alert khi PSI (Population Stability Index) vượt ngưỡng, retrain định kỳ, champion-challenger framework."
            />
            <InlineChallenge
              question="Ví điện tử muốn chặn 'account takeover' — kẻ gian chiếm tài khoản rồi rút sạch ví. Feature nào KHÓ giả mạo nhất?"
              options={[
                "Số điện thoại",
                "Behavior biometrics: tốc độ gõ, nhịp vuốt, độ nghiêng điện thoại — các đặc trưng hành vi học qua nhiều session",
                "Email",
              ]}
              correct={1}
              explanation="Credentials (mật khẩu, OTP) có thể bị đánh cắp qua phishing. Nhưng nhịp gõ và cách cầm máy là 'behavioral fingerprint' gần như không thể copy. BioCatch, TypingDNA là các vendor chuyên cung cấp layer này. Momo, ZaloPay đang thử nghiệm."
            />
          </LessonSection>

          <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích">
            <ExplanationSection>
              <p>
                <strong>AI in Finance</strong> là tập hợp các ứng dụng học máy
                cho fraud detection, credit scoring, algorithmic trading và
                risk management. Điểm chung: mỗi bài toán quy về một hàm mục
                tiêu được định nghĩa bằng <em>chi phí kỳ vọng</em> của sai lầm,
                và mô hình học từ dữ liệu lịch sử để xấp xỉ hàm ra quyết định
                tối ưu. Nhiều ngân hàng kết hợp{" "}
                <TopicLink slug="sentiment-analysis">
                  sentiment analysis
                </TopicLink>{" "}
                tin tức/mạng xã hội để dự báo thị trường, và{" "}
                <TopicLink slug="recommendation-systems">
                  recommendation systems
                </TopicLink>{" "}
                để gợi ý sản phẩm tài chính phù hợp với khách hàng.
              </p>

              <h3>Định nghĩa hình thức</h3>
              <p>
                Cho một dòng sự kiện tài chính{" "}
                <em>(giao dịch, đơn vay, phiên giao dịch chứng khoán…)</em>,
                gọi <em>x ∈ ℝ^d</em> là vector đặc trưng của sự kiện và{" "}
                <em>y ∈ {"{0, 1}"}</em> là biến ẩn cho biết sự kiện có "xấu"
                hay không (gian lận, vỡ nợ, lệnh bị đảo ngược…). Ta cần ước
                lượng xác suất <em>p(y = 1 | x)</em> đủ chính xác và đủ nhanh
                để ra quyết định real-time.
              </p>

              <LaTeX block>
                {
                  "\\text{Expected Loss} = P(\\text{fraud}) \\times \\text{Amount} \\times (1 - \\text{Recall})"
                }
              </LaTeX>

              <p>
                Trong bài toán fraud detection, công thức trên cho phép ngân
                hàng định giá <em>tổn thất kỳ vọng hằng ngày</em> trực tiếp từ
                recall của model. Tương tự, với credit scoring, ta tối ưu hàm:
              </p>

              <LaTeX block>
                {
                  "\\mathcal{L}(\\theta) = \\mathbb{E}_{(x,y) \\sim \\mathcal{D}}\\big[ C_{\\text{FN}} \\cdot y (1 - \\hat{p}_\\theta(x)) + C_{\\text{FP}} \\cdot (1-y) \\hat{p}_\\theta(x) \\big]"
                }
              </LaTeX>

              <p>
                trong đó <em>C_FN</em> là chi phí cho một khoản vay vỡ nợ
                (thường lớn — toàn bộ dư nợ), <em>C_FP</em> là chi phí cơ hội
                khi từ chối một khách hàng tốt. Tỉ số <em>C_FN / C_FP</em>{" "}
                chính là chìa khóa quyết định threshold tối ưu, chứ không phải
                accuracy.
              </p>

              <Callout variant="insight" title="Threshold không phải là 0.5">
                Mặc định của nhiều thư viện (scikit-learn, XGBoost) là{" "}
                <code>0.5</code>, nhưng đó là giá trị tệ nhất cho hầu hết bài
                toán tài chính. Threshold tối ưu đến từ <em>PR curve</em> và
                ma trận chi phí, và thường nằm giữa 0.1 và 0.3 cho fraud (vì{" "}
                <em>C_FN ≫ C_FP</em>).
              </Callout>

              <Callout
                variant="warning"
                title="Fairness và Explainability"
              >
                Regulatory (Basel, EU AI Act, NHNN Circular 01/2024) yêu cầu:
                (1) Model GIẢI THÍCH ĐƯỢC tại sao từ chối cho vay, (2) Không
                discriminate theo giới tính/dân tộc, (3) Regular bias auditing
                với các metric như demographic parity, equal opportunity.{" "}
                <strong>SHAP values</strong> và <strong>LIME</strong> là hai
                công cụ phổ biến giúp giải thích model decisions ở mức từng
                instance.
              </Callout>

              <Callout
                variant="tip"
                title="Dùng features rẻ cho tầng 1, features đắt cho tầng 2"
              >
                Đa số giao dịch lành tính — không cần gọi mô hình nặng cho mọi
                giao dịch. Pattern chuẩn: <em>tầng 1</em> là một model
                logistic / GBDT rất nhẹ (~1 ms) lọc &gt; 99% giao dịch. Chỉ
                những trường hợp "xám" mới được đẩy lên <em>tầng 2</em> — một
                ensemble nặng hoặc kể cả graph neural network nhìn vào mạng
                lưới liên kết giữa các account.
              </Callout>

              <Callout variant="info" title="Vì sao XGBoost vẫn thống trị?">
                Dữ liệu tài chính phần lớn là tabular (có bảng, đa kiểu, nhiều
                missing value). Gradient boosting xử lý native các đặc điểm
                này, không cần chuẩn hóa, robust với outlier, và cho SHAP
                values rất tốt. Neural network chỉ vượt trội khi ta có dữ liệu
                phi cấu trúc (văn bản email khiếu nại, ảnh CMND, tiếng nói
                tổng đài) hoặc dữ liệu đồ thị.
              </Callout>

              <h3>Pipeline fraud detection điển hình</h3>

              <CodeBlock language="python" title="Fraud detection với XGBoost">
                {`import xgboost as xgb
from sklearn.metrics import precision_recall_curve, average_precision_score
from sklearn.model_selection import TimeSeriesSplit

# Features: amount, time, location, merchant, device, velocity,
# so giao dich 1h/24h, so device khac nhau 7 ngay,
# khoang cach dia ly so voi giao dich truoc, do lech pattern giờ...
model = xgb.XGBClassifier(
    n_estimators=500,
    max_depth=6,
    learning_rate=0.05,
    scale_pos_weight=100,     # Imbalanced: 99.9% legit
    tree_method="hist",
    eval_metric="aucpr",      # PR-AUC, không phải accuracy
    early_stopping_rounds=30,
)

# Time-series CV: KHÔNG shuffle — tương lai không được lọt vào train
cv = TimeSeriesSplit(n_splits=5)
for fold, (tr, va) in enumerate(cv.split(X)):
    model.fit(
        X.iloc[tr], y.iloc[tr],
        eval_set=[(X.iloc[va], y.iloc[va])],
        verbose=False,
    )
    ap = average_precision_score(y.iloc[va], model.predict_proba(X.iloc[va])[:, 1])
    print(f"fold {fold} PR-AUC = {ap:.3f}")

# Chon threshold theo ma tran chi phi, khong phai 0.5
prec, rec, thr = precision_recall_curve(y_val, proba_val)
C_FN, C_FP = 500_000, 2_000   # VND trung binh: bo lot fraud vs block nham
cost = C_FN * (1 - rec) * y_val.sum() + C_FP * (1 - prec) * (proba_val > thr[:, None]).sum(0)
best = cost.argmin()
print(f"threshold toi uu = {thr[best]:.3f}")

# Real-time scoring: 5–10 ms per transaction
score = model.predict_proba(transaction_features)[0][1]
if score > thr[best]:
    decision = "block_and_notify"
elif score > thr[best] * 0.5:
    decision = "require_otp"
else:
    decision = "approve"

# SHAP: giai thich vi sao bi flag
import shap
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(flagged_transaction)
# "Bi flag vi: amount bat thuong (+0.41), device_id moi (+0.28),
#  khoang cach dia ly so voi giao dich truoc (+0.19)"
`}
              </CodeBlock>

              <p>
                Đoạn code trên thể hiện bốn quyết định kỹ thuật quan trọng mà
                nhiều người mới bỏ qua:
              </p>
              <ul>
                <li>
                  <strong>Time-series split</strong>: nếu shuffle dữ liệu, bạn
                  đã "nhìn trộm tương lai" và mọi metric đều quá lạc quan.
                </li>
                <li>
                  <strong>PR-AUC thay vì ROC-AUC</strong>: với class imbalance
                  cực lớn, ROC-AUC bão hòa và trông đẹp kể cả khi model kém.
                </li>
                <li>
                  <strong>Threshold theo chi phí</strong>: 0.5 chỉ đúng khi
                  <em> C_FN = C_FP</em> và base rate = 50%. Không bao giờ đúng
                  trong finance.
                </li>
                <li>
                  <strong>SHAP ngay trong pipeline</strong>: để compliance
                  team có audit trail cho từng quyết định chặn giao dịch.
                </li>
              </ul>

              <h3>Credit scoring với gradient boosting</h3>

              <CodeBlock
                language="python"
                title="Credit scoring + fairness audit"
              >
                {`import lightgbm as lgb
import shap
import numpy as np
import pandas as pd
from fairlearn.metrics import (
    MetricFrame, selection_rate, false_negative_rate
)

# Feature: thu nhap, so nam lam viec, debt-to-income,
# lich su tin dung 24 thang, so lan cham no, san pham vay hien tai...
model = lgb.LGBMClassifier(
    n_estimators=400,
    num_leaves=63,
    min_child_samples=200,   # tranh overfit tren nhom nho
    objective="binary",
    class_weight="balanced",
)
model.fit(X_tr, y_tr, eval_set=[(X_va, y_va)], callbacks=[lgb.early_stopping(30)])

# Base performance
proba = model.predict_proba(X_va)[:, 1]
pred  = (proba > 0.35).astype(int)   # threshold theo ma tran chi phi

# Fairness audit: khong duoc lech FN rate giua nhom duoc bao ve
protected = X_va["gender"]     # demographic-only nhan, KHONG input vao model
mf = MetricFrame(
    metrics={
        "approval_rate": selection_rate,
        "miss_default":  false_negative_rate,
    },
    y_true=y_va, y_pred=pred, sensitive_features=protected,
)
print(mf.by_group)

# Equal Opportunity: chenh lech FNR giua cac nhom phai < 5 pp
disparity = mf.by_group["miss_default"].max() - mf.by_group["miss_default"].min()
assert disparity < 0.05, "Model vi pham equal-opportunity, can reweight hoac postprocess"

# Explainability o cap instance
explainer = shap.TreeExplainer(model)
sv = explainer.shap_values(applicant_features)[1]
top3 = np.argsort(-np.abs(sv))[:3]
for idx in top3:
    print(f"{X_va.columns[idx]:30s} contribution = {sv[idx]:+.2f}")
# thu_nhap_hang_thang           contribution = -0.51
# debt_to_income_ratio          contribution = +0.38
# so_lan_cham_no_12_thang       contribution = +0.22
`}
              </CodeBlock>

              <Callout
                variant="info"
                title="Fairness không phải là một metric duy nhất"
              >
                Có ít nhất 21 định nghĩa fairness khác nhau (Narayanan 2018),
                và một số định nghĩa <em>mâu thuẫn</em> với nhau một cách toán
                học. Tùy bối cảnh, ngân hàng chọn một trong ba tiêu chí chính:{" "}
                <strong>demographic parity</strong> (tỉ lệ được duyệt đồng đều
                giữa các nhóm), <strong>equal opportunity</strong> (tỉ lệ bỏ
                lỡ khách hàng tốt đồng đều), hoặc{" "}
                <strong>calibration</strong> (điểm 0.7 nghĩa là 70% rủi ro
                đồng đều giữa các nhóm).
              </Callout>

              <h3>Chi tiết đáng quan tâm</h3>

              <CollapsibleDetail title="Vì sao PR-AUC tốt hơn ROC-AUC khi fraud rate &lt; 1%?">
                <p>
                  ROC-AUC đo trade-off giữa <em>true positive rate</em> và{" "}
                  <em>false positive rate</em>. Khi negative class cực kỳ lớn
                  (99.9% giao dịch là bình thường), mẫu số của FPR =
                  FP/(FP+TN) gần như không bao giờ di chuyển, khiến FPR luôn
                  rất nhỏ và ROC-AUC bão hòa về 1.0 kể cả với model tầm
                  thường.
                </p>
                <p>
                  PR-AUC dùng precision = TP/(TP+FP), trong đó FP <em>có</em>{" "}
                  tác động nhìn thấy được — vì mỗi FP là một khách hàng thật
                  bị chặn nhầm, rất đắt. PR-AUC phân biệt được model tốt và
                  model dở ở dải low-recall, là dải mà ngân hàng thực sự vận
                  hành. Tóm lại:{" "}
                  <em>
                    khi positive rare và chi phí FP/FN bất đối xứng, luôn
                    dùng PR-AUC.
                  </em>
                </p>
                <p>
                  Một lưu ý phụ: PR-AUC không bất biến với class balance — số
                  này sẽ thay đổi nếu bạn resample dữ liệu. Vì thế khi báo
                  cáo, luôn kèm theo base rate của tập test.
                </p>
              </CollapsibleDetail>

              <CollapsibleDetail title="Graph-based fraud detection: khi XGBoost không đủ">
                <p>
                  Một nhóm gian lận tinh vi không để lại dấu vết ở một giao
                  dịch đơn lẻ — chúng lộ ra ở <em>mạng lưới</em>: 50 tài
                  khoản cùng mới mở, dùng chung một tầng IP, gửi tiền cho
                  nhau theo hình sao rồi rút về một ví duy nhất. Features
                  flatten của XGBoost không nhìn thấy cấu trúc này.
                </p>
                <p>
                  Các hệ thống hiện đại (PayPal, Stripe, và gần đây là một số
                  fintech VN) dùng{" "}
                  <strong>graph neural networks</strong> hoặc{" "}
                  <em>community detection</em> trên đồ thị giao dịch. Node =
                  account, edge = giao dịch. GNN học embedding cho mỗi account
                  dựa trên hàng xóm của nó trong 1–2 hops, rồi feed embedding
                  này như feature bổ sung cho XGBoost tầng 2.
                </p>
                <p>
                  Kết quả điển hình: recall ở dải FPR &lt; 1% tăng 8–15 điểm
                  phần trăm so với model chỉ dùng feature tĩnh. Chi phí: khó
                  trở thành real-time &lt; 100ms, thường chạy trong chế độ
                  near-real-time (vài giây) như một tầng audit phụ.
                </p>
              </CollapsibleDetail>

              <CollapsibleDetail title="Adversarial và concept drift trong finance">
                <p>
                  Không như nhận dạng ảnh, môi trường tài chính có{" "}
                  <em>đối thủ thích nghi</em>: kẻ gian liên tục thử nghiệm,
                  học cách model phản ứng và điều chỉnh pattern. Hệ quả: một
                  model triển khai tốt tháng này có thể giảm hiệu quả đáng kể
                  sau 90 ngày.
                </p>
                <p>
                  Giải pháp chuẩn gồm ba tầng:
                </p>
                <ul>
                  <li>
                    <strong>Monitoring</strong>: PSI trên từng feature, KS
                    test trên phân phối score, alert khi drift vượt ngưỡng.
                  </li>
                  <li>
                    <strong>Retraining cadence</strong>: nightly fine-tune
                    trên cửa sổ trượt 30 ngày; full retrain hằng tuần.
                  </li>
                  <li>
                    <strong>Champion–challenger</strong>: luôn có một model
                    mới chạy song song trên 5–10% traffic, tự động promote
                    nếu beat champion trên A/B.
                  </li>
                </ul>
                <p>
                  Một trick hữu ích: đưa cả <em>các pattern gian lận tổng
                  hợp</em> (synthetic) vào pipeline retrain để model không bị
                  "quên" những mẫu hiếm gặp nhưng tác hại lớn.
                </p>
              </CollapsibleDetail>

              <h3>Các ứng dụng chính chi tiết</h3>

              <h4>1. Fraud detection</h4>
              <p>
                Mục tiêu: chặn giao dịch gian lận trong thời gian người dùng
                còn đang chờ màn hình thanh toán. Ràng buộc:{" "}
                <em>p95 &lt; 100 ms</em>, <em>p99 &lt; 200 ms</em>.
                Architecture điển hình: feature store (Redis/DragonflyDB) lưu
                state quay vòng cho mỗi user, một model phục vụ qua gRPC,
                fallback sang rule engine nếu model lag.
              </p>

              <h4>2. Credit scoring</h4>
              <p>
                Đánh giá xác suất vỡ nợ để quyết định có duyệt, hạn mức bao
                nhiêu, lãi suất nào. Thời gian phản hồi cho phép dài hơn (vài
                giây đến vài phút trong quy trình cho vay tiêu dùng). Khác
                biệt lớn nhất so với fraud: <em>explainability là bắt buộc
                pháp lý</em> — khách hàng bị từ chối có quyền biết lý do cụ
                thể, và ngân hàng phải chứng minh model không phân biệt đối
                xử.
              </p>

              <h4>3. Algorithmic trading</h4>
              <p>
                Từ high-frequency trading (microsecond) đến statistical
                arbitrage (phút, giờ) và systematic macro (tuần, tháng). AI
                được dùng cho: dự báo tín hiệu ngắn hạn, tối ưu thực thi
                (giảm slippage), xếp hạng trái phiếu, tối ưu danh mục.{" "}
                <strong>Cảnh báo</strong>: thị trường là trò chơi{" "}
                <em>adversarial</em> và <em>non-stationary</em> — nghiên cứu
                backtest đẹp thường không sống sót khi deploy vì alpha bị ăn
                mòn nhanh.
              </p>

              <h4>4. Risk management và stress testing</h4>
              <p>
                Mô phỏng Monte Carlo trên danh mục, ước lượng VaR (Value at
                Risk), CVaR, stress test khi lãi suất / FX / giá cổ phiếu
                sốc. AI bổ sung cho mô hình truyền thống ở việc ước lượng
                correlation thời gian thực và dự báo tail risk từ dữ liệu
                phi cấu trúc (tin tức, báo cáo).
              </p>

              <h3>Pitfalls — những cái bẫy nên tránh</h3>
              <ol>
                <li>
                  <strong>Lấy accuracy làm KPI chính.</strong> Trong fraud với
                  class imbalance 1:1000, model dự đoán "legit" cho mọi giao
                  dịch có accuracy 99.9% và hoàn toàn vô dụng. Luôn dùng
                  precision/recall/PR-AUC và ma trận chi phí.
                </li>
                <li>
                  <strong>Shuffle dữ liệu khi split.</strong> Giao dịch tương
                  lai lọt vào training set gây data leakage, metric backtest
                  cao gấp đôi thực tế. Luôn dùng time-series split.
                </li>
                <li>
                  <strong>Feature leakage từ hậu quả.</strong> Features như{" "}
                  <code>so_lan_bi_khieu_nai_30_ngay</code> chỉ biết được sau
                  khi giao dịch đã xong — đưa vào training set là leakage.
                </li>
                <li>
                  <strong>Quên monitoring sau deploy.</strong> Model tài chính
                  phải được giám sát drift, calibration, và fairness hàng
                  ngày. Một model "forgotten" sau 6 tháng có thể gây thiệt
                  hại hàng tỉ đồng trước khi ai đó nhận ra.
                </li>
                <li>
                  <strong>Fit threshold trên tập validation, report trên
                  cùng tập đó.</strong> Threshold là hyperparameter — phải
                  chọn trên tập val, đo performance trên tập test độc lập.
                </li>
                <li>
                  <strong>Không có fallback.</strong> Khi feature store lag
                  hoặc model service down, luôn cần một rule engine đơn giản
                  đứng sau chặn các pattern hiển nhiên (giao dịch từ quốc gia
                  bị cấm vận, số tiền vượt hạn mức cứng…).
                </li>
                <li>
                  <strong>Bỏ qua cost-sensitive learning.</strong> Việc
                  reweight sample theo chi phí (hoặc dùng focal loss) thường
                  giúp model hội tụ về biên quyết định hữu ích hơn là chỉ
                  dùng default loss.
                </li>
                <li>
                  <strong>Trộn môi trường train và sandbox.</strong> Model
                  fraud cần được train trên dữ liệu production thật (có đầy
                  đủ edge case) nhưng được <em>test</em> trong sandbox với
                  traffic được replay — không bao giờ thử nghiệm threshold
                  mới trực tiếp trên live traffic mà không có kill-switch.
                </li>
                <li>
                  <strong>Dùng feature chứa PII không mã hóa.</strong> Số
                  CMND, số thẻ, địa chỉ nhà — không nên đi thẳng vào model.
                  Hash, tokenize, hoặc thay bằng các đại lượng phái sinh để
                  giảm bề mặt rủi ro khi rò rỉ mô hình.
                </li>
              </ol>

              <p className="text-sm text-muted-foreground">
                Khi bạn đã nắm được bộ khung chi phí và trade-off ở trên, việc
                triển khai cụ thể chỉ còn là chuyện kỹ thuật. Phần lớn các lỗi
                tai hại trong production đều xuất phát từ việc quên một trong
                các pitfalls phía trên, chứ không phải từ "thuật toán chưa đủ
                mạnh".
              </p>
            </ExplanationSection>
          </LessonSection>

          <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
            <MiniSummary
              title="Những gì bạn cần mang đi"
              points={[
                "4 ứng dụng lớn: Fraud detection (real-time), Credit scoring (cho vay), Algorithmic trading (giao dịch tự động), Risk management (rủi ro danh mục).",
                "Fraud detection không đi tìm accuracy — đi tìm ngưỡng tối ưu dựa trên ma trận chi phí (C_FN ≫ C_FP). Threshold 0.5 gần như luôn sai.",
                "Credit scoring bắt buộc phải explainable (SHAP/LIME) và fair — audit bias định kỳ theo giới tính/dân tộc để tránh feedback loop.",
                "Dữ liệu tài chính có class imbalance cực lớn: luôn dùng PR-AUC, time-series split, class weighting, và monitoring drift sau deploy.",
                "Algorithmic trading là trò chơi adversarial: alpha ăn mòn nhanh, cần circuit breakers, position limits và champion-challenger.",
                "VN landscape: Techcombank, VPBank, Momo, ZaloPay dùng AI fraud detection; FE Credit, Home Credit dùng AI credit scoring; hệ sinh thái đang bổ sung graph-based detection và behavior biometrics.",
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
