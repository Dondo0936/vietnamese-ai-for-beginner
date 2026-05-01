"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  Callout,
  CollapsibleDetail,
  MiniSummary,
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
  slug: "canary-releases-llm",
  title: "Canary Releases & Shadow Traffic for LLM",
  titleVi: "Canary & Shadow Rollout — Triển khai LLM an toàn",
  description:
    "Đổi model LLM trong production không thể 'big bang'. Học cách triển khai gradient: shadow traffic (so sánh không ảnh hưởng user) → 1% canary → 10% → 50% → 100%, với gate theo eval, user-feedback, và cost; cùng rollback tự động khi metric vi phạm SLO.",
  category: "infrastructure",
  tags: ["deployment", "canary", "shadow", "rollout", "reliability"],
  difficulty: "advanced",
  relatedSlugs: [
    "mlops",
    "model-serving",
    "llm-evaluation",
    "observability-for-ai",
    "agent-evaluation",
  ],
  vizType: "interactive",
};

// ──────────────────────────────────────────────────────────────────────
// DỮ LIỆU MÔ PHỎNG: baseline vs candidate, các preset %, và timeline
// ──────────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 9;

// 6 preset stops trên dial. 0% = shadow; còn lại = % user-facing traffic.
const PRESETS = [0, 1, 5, 10, 25, 50, 100] as const;
type Preset = (typeof PRESETS)[number];

interface VariantSnapshot {
  success: number; // %
  thumbsUp: number; // %
  p95: number; // seconds
  costPerReq: number; // $
  safetyViolations: number; // count / 10k req
}

// Baseline đứng yên (v_current đã chạy ổn định tháng nay).
const BASELINE: VariantSnapshot = {
  success: 91,
  thumbsUp: 78,
  p95: 1.8,
  costPerReq: 0.012,
  safetyViolations: 0,
};

// Sinh snapshot cho candidate theo % canary. Ý tưởng:
// – % càng thấp → variance càng cao (ít sample).
// – Ở 0% (shadow) ta vẫn có log → số hiển thị dựa mẫu shadow.
// – Ở 100% số ổn định về một mean đã định sẵn.
function computeCandidate(
  pct: number,
  noiseSeed: number,
  injection: Injection,
): VariantSnapshot {
  // Mean target khi rollout đủ lớn.
  const mean: VariantSnapshot = {
    success: 93.5, // candidate hơi tốt hơn baseline
    thumbsUp: 82,
    p95: 1.9,
    costPerReq: 0.015,
    safetyViolations: 0,
  };

  // Variance giảm theo % (1/sqrt(n)). Ở 0% dùng shadow sample (pct=1 tương đương).
  const effectivePct = Math.max(pct, 1);
  const noiseScale = 6 / Math.sqrt(effectivePct);

  // Dùng noiseSeed giả lập, tạo biến thiên đủ thấy được khi pct thấp.
  const jitter = (seed: number, amp: number) => {
    const x = Math.sin(seed * 12.9898 + noiseSeed * 78.233) * 43758.5453;
    return (x - Math.floor(x) - 0.5) * 2 * amp;
  };

  let snapshot: VariantSnapshot = {
    success: mean.success + jitter(1, noiseScale * 0.35),
    thumbsUp: mean.thumbsUp + jitter(2, noiseScale * 0.4),
    p95: mean.p95 + jitter(3, noiseScale * 0.015),
    costPerReq: mean.costPerReq + jitter(4, noiseScale * 0.0004),
    safetyViolations: Math.max(0, Math.round(jitter(5, noiseScale * 0.05))),
  };

  // Inject SLO violation nếu được trigger.
  if (injection === "latency") {
    snapshot = { ...snapshot, p95: snapshot.p95 + 0.9 };
  } else if (injection === "halluc") {
    snapshot = {
      ...snapshot,
      success: snapshot.success - 8,
      safetyViolations: snapshot.safetyViolations + 3,
    };
  } else if (injection === "cost") {
    snapshot = { ...snapshot, costPerReq: snapshot.costPerReq + 0.008 };
  }

  // Clamp về [0, 100] cho tỷ lệ %.
  snapshot.success = Math.max(0, Math.min(100, snapshot.success));
  snapshot.thumbsUp = Math.max(0, Math.min(100, snapshot.thumbsUp));
  return snapshot;
}

type Injection = "none" | "latency" | "halluc" | "cost";

// Sparkline 20 điểm — sinh theo % + seed + injection.
function computeSpark(pct: number, seed: number, injection: Injection): number[] {
  const out: number[] = [];
  for (let i = 0; i < 20; i += 1) {
    const snap = computeCandidate(pct, seed + i * 0.11, injection);
    out.push(snap.success);
  }
  return out;
}

// Guardrails: tính pass/fail theo baseline.
interface GuardCheck {
  id: "success" | "latency" | "cost" | "safety";
  label: string;
  rule: string;
  pass: boolean;
}

function checkGuardrails(cand: VariantSnapshot): GuardCheck[] {
  return [
    {
      id: "success",
      label: "Task success ≥ 90% baseline",
      rule: `${cand.success.toFixed(1)}% vs ngưỡng ${(BASELINE.success * 0.9).toFixed(1)}%`,
      pass: cand.success >= BASELINE.success * 0.9,
    },
    {
      id: "latency",
      label: "p95 latency ≤ 1.1× baseline",
      rule: `${cand.p95.toFixed(2)}s vs ngưỡng ${(BASELINE.p95 * 1.1).toFixed(2)}s`,
      pass: cand.p95 <= BASELINE.p95 * 1.1,
    },
    {
      id: "cost",
      label: "$/req ≤ 1.2× baseline",
      rule: `$${cand.costPerReq.toFixed(4)} vs ngưỡng $${(BASELINE.costPerReq * 1.2).toFixed(4)}`,
      pass: cand.costPerReq <= BASELINE.costPerReq * 1.2,
    },
    {
      id: "safety",
      label: "Safety violations = 0",
      rule: `${cand.safetyViolations} vi phạm / 10k req`,
      pass: cand.safetyViolations === 0,
    },
  ];
}

// Timeline 7 checkpoint — mỗi mốc gắn với một preset.
interface Checkpoint {
  day: number;
  label: string;
  pct: Preset;
  phase: string;
}

const TIMELINE: Checkpoint[] = [
  { day: 1, label: "Day 1", pct: 0, phase: "Shadow traffic" },
  { day: 2, label: "Day 2", pct: 1, phase: "Canary 1%" },
  { day: 3, label: "Day 3", pct: 5, phase: "Canary 5%" },
  { day: 5, label: "Day 5", pct: 25, phase: "Progressive 25%" },
  { day: 7, label: "Day 7", pct: 50, phase: "Progressive 50%" },
  { day: 10, label: "Day 10", pct: 100, phase: "Full cutover" },
];

// ──────────────────────────────────────────────────────────────────────
// COMPONENT CHÍNH
// ──────────────────────────────────────────────────────────────────────

export default function CanaryReleasesLLMTopic() {
  const [pct, setPct] = useState<Preset>(5);
  const [injection, setInjection] = useState<Injection>("none");
  const [rollbackActive, setRollbackActive] = useState(false);
  // noiseSeed bump mỗi khi user thao tác → tái sinh snapshot.
  const [noiseSeed, setNoiseSeed] = useState(0.3);

  // Khi có injection làm vi phạm guardrail → tự kích hoạt rollback.
  const candidate = useMemo(
    () => computeCandidate(pct, noiseSeed, injection),
    [pct, noiseSeed, injection],
  );
  const guards = useMemo(() => checkGuardrails(candidate), [candidate]);
  const allPass = guards.every((g) => g.pass);
  const spark = useMemo(
    () => computeSpark(pct, noiseSeed, injection),
    [pct, noiseSeed, injection],
  );

  // Auto-rollback: nếu có guard fail thì set rollbackActive; dial chạy về 0% sau 900ms.
  useEffect(() => {
    if (!allPass && pct > 0) {
      setRollbackActive(true);
      const t = setTimeout(() => {
        setPct(0);
      }, 900);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [allPass, pct]);

  // Khi user thay đổi pct mà guard pass → tắt rollback banner sau chút.
  useEffect(() => {
    if (allPass && rollbackActive) {
      const t = setTimeout(() => setRollbackActive(false), 1600);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [allPass, rollbackActive]);

  const resetInject = useCallback(() => {
    setInjection("none");
    setRollbackActive(false);
    setNoiseSeed((s) => s + 0.13);
  }, []);

  const triggerInject = useCallback((kind: Injection) => {
    setInjection(kind);
    setNoiseSeed((s) => s + 0.17);
  }, []);

  const jumpTo = useCallback((p: Preset) => {
    setPct(p);
    setInjection("none");
    setRollbackActive(false);
    setNoiseSeed((s) => s + 0.09);
  }, []);

  // ──────────────────────────────────────────────────────────────────
  // DIAL — toạ độ và góc
  // ──────────────────────────────────────────────────────────────────
  const DIAL_SIZE = 240;
  const DIAL_CX = DIAL_SIZE / 2;
  const DIAL_CY = DIAL_SIZE / 2;
  const DIAL_R = 92;
  // Mapping 0..100 → 0..270deg (vòng cung 3/4).
  const angleFor = (p: number) => (p / 100) * 270 - 135;
  const handleAngle = angleFor(pct);
  // Toạ độ các tick preset.
  const tickPositions = PRESETS.map((p) => {
    const a = (angleFor(p) * Math.PI) / 180;
    return {
      x: DIAL_CX + DIAL_R * Math.sin(a),
      y: DIAL_CY - DIAL_R * Math.cos(a),
      p,
    };
  });
  // Arc path từ 0% đến pct hiện tại.
  const buildArc = (fromPct: number, toPct: number) => {
    if (toPct <= fromPct) return "";
    const a1 = (angleFor(fromPct) * Math.PI) / 180;
    const a2 = (angleFor(toPct) * Math.PI) / 180;
    const x1 = DIAL_CX + DIAL_R * Math.sin(a1);
    const y1 = DIAL_CY - DIAL_R * Math.cos(a1);
    const x2 = DIAL_CX + DIAL_R * Math.sin(a2);
    const y2 = DIAL_CY - DIAL_R * Math.cos(a2);
    const large = Math.abs(angleFor(toPct) - angleFor(fromPct)) > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${DIAL_R} ${DIAL_R} 0 ${large} 1 ${x2} ${y2}`;
  };

  // ──────────────────────────────────────────────────────────────────
  // QUIZ — 8 câu, 2 fill-blank
  // ──────────────────────────────────────────────────────────────────
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "Shadow traffic khác canary release ở điểm cốt lõi nào?",
        options: [
          "Shadow nhanh hơn canary",
          "Shadow chạy song song v_candidate nhưng KHÔNG trả output cho user — chỉ log để so sánh offline; canary trả output thật cho một tỷ lệ user",
          "Shadow và canary là hai tên của cùng một kỹ thuật",
          "Shadow chỉ dùng cho batch, canary chỉ dùng cho online",
        ],
        correct: 1,
        explanation:
          "Shadow = double-dispatch, chỉ log, user không thấy. Canary = một % user thật sự nhận output từ v_candidate. Shadow phát hiện crash/format diff mà không rủi ro; canary cần guardrail vì user bị ảnh hưởng thật.",
      },
      {
        question:
          "Blue-green vs canary — khi nào chọn blue-green?",
        options: [
          "Khi muốn rollout dần dần từng %",
          "Khi cần cutover tức thời (flip traffic 100% trong 1 giây) và có sẵn capacity gấp đôi để chạy song song 2 môi trường",
          "Khi muốn A/B test lâu dài",
          "Blue-green chỉ dùng cho DB migration",
        ],
        correct: 1,
        explanation:
          "Blue-green: duy trì 2 environment (blue = current, green = candidate), flip load balancer để cutover. Ưu: rollback nhanh, cutover atomic. Nhược: tốn capacity gấp đôi. Canary: không cần gấp đôi capacity, nhưng rollout chậm.",
      },
      {
        question:
          "Bạn chạy canary 10% cho candidate. Goal metric (CSAT) +4pp, guardrail metric (p95 latency) +25%. Làm gì?",
        options: [
          "Rollout lên 50% vì CSAT cải thiện",
          "Rollback hoặc pause — guardrail bị vi phạm (vượt ngưỡng 1.1×). Nguyên tắc: chỉ rollout khi goal tốt lên VÀ guardrail không xấu đi",
          "Tăng ngưỡng guardrail lên 1.5× cho xong",
          "Bỏ qua latency, user chưa phàn nàn là được",
        ],
        correct: 1,
        explanation:
          "Pattern 'goal vs guardrail': goal (CSAT, revenue, task success) để chọn candidate; guardrail (latency, cost, safety) để chặn candidate xấu. Guardrail vi phạm = rollback, bất kể goal tốt đến đâu. Mục đích guardrail là giữ lằn ranh đỏ không thể đổi.",
      },
      {
        type: "fill-blank",
        question:
          "Khi so sánh 2 variant LLM với sample lớn và variance khác nhau, công thức Welch t-test dùng thống kê t = (X̄_a − X̄_b) / √(s_a²/n_a + s_b²/n_b). Trong đó s² là {blank} và n là {blank} của mỗi nhánh.",
        blanks: [
          {
            answer: "variance",
            accept: ["phương sai", "độ lệch chuẩn bình phương"],
          },
          {
            answer: "sample size",
            accept: ["cỡ mẫu", "kích thước mẫu", "số mẫu", "n mẫu"],
          },
        ],
        explanation:
          "Welch t-test là mở rộng Student's t-test, không đòi hỏi variance bằng nhau giữa hai nhánh — phù hợp cho LLM vì v_candidate thường có variance khác v_current. Nhớ: p-value một mình không đủ, cần effect size + confidence interval để quyết định ra hướng.",
      },
      {
        question:
          "Tại sao A/B test LLM cần sample size LỚN HƠN A/B test UI truyền thống?",
        options: [
          "Vì LLM chậm hơn",
          "Vì output LLM không deterministic — cùng input có thể ra output khác → variance cao hơn → cần nhiều mẫu hơn để đạt cùng power thống kê. Dùng sequential testing hoặc CUPED để giảm sample size",
          "Vì LLM đắt hơn",
          "Không khác gì — vẫn dùng sample size formula thường",
        ],
        correct: 1,
        explanation:
          "Output variance của LLM (temp > 0) cao hơn nhiều so với UI A/B (bấm hay không bấm). Công thức n ∝ σ²/δ² → variance gấp 4× cần sample 4×. Sequential testing (alpha spending) và CUPED (control variance bằng pre-period data) là hai kỹ thuật phổ biến để rút ngắn.",
      },
      {
        question:
          "Khi auto-rollback trigger, hệ thống cần làm gì TRƯỚC TIÊN?",
        options: [
          "Xoá v_candidate khỏi registry",
          "Đặt lại traffic weight về 0% cho v_candidate (flip feature flag) và ghi lại snapshot metric lúc vi phạm để postmortem — KHÔNG xoá candidate, cần giữ để debug",
          "Gửi email cho sếp",
          "Retry v_candidate ngay lập tức",
        ],
        correct: 1,
        explanation:
          "Auto-rollback = set weight về 0, feature flag off, giữ lại artifact để debug. Xoá candidate ngay sẽ mất bằng chứng. Quy trình chuẩn: (1) flip flag, (2) snapshot metric + sample request vi phạm, (3) page on-call, (4) postmortem sau.",
      },
      {
        question:
          "Feature flag cho model version — lợi ích chính so với deploy mới?",
        options: [
          "Không cần test",
          "Đổi model mà KHÔNG cần deploy lại code — config reload nóng; ramp/rollback tính bằng giây thay vì phút; A/B theo segment user dễ dàng",
          "Flag chạy nhanh hơn code",
          "Flag thay thế hoàn toàn quy trình CI/CD",
        ],
        correct: 1,
        explanation:
          "Pattern 'model version as feature flag' (LaunchDarkly, Unleash, hoặc Postgres + config reload): tách lựa chọn model khỏi deploy binary. Ramp 5% → 10% → 50% chỉ cần update config, không cần restart service. Cực quan trọng với LLM vì rollout là hoạt động hàng tuần, không hàng quý.",
      },
      {
        type: "fill-blank",
        question:
          "Trong rollout LLM, metric dùng để QUYẾT ĐỊNH có rollout hay không gọi là {blank} metric (vd: CSAT, task success). Metric dùng để CHẶN rollout nếu vượt ngưỡng gọi là {blank} metric (vd: p95 latency, $/req, safety).",
        blanks: [
          { answer: "goal", accept: ["primary", "mục tiêu", "north-star"] },
          {
            answer: "guardrail",
            accept: ["rào cản", "bảo vệ", "safety", "guard"],
          },
        ],
        explanation:
          "Pattern quan trọng nhất trong rollout: tách 2 loại metric. Goal (north-star) — để chọn candidate tốt hơn. Guardrail — để đảm bảo không gây hại ở chiều khác. Một candidate có goal tốt nhưng guardrail xấu = rollback. Đây là 'do no harm' dịch sang ngôn ngữ metric.",
      },
    ],
    [],
  );

  // ──────────────────────────────────────────────────────────────────
  // RENDER HELPERS
  // ──────────────────────────────────────────────────────────────────

  const renderDial = () => (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-bold text-foreground">
            Rollout dial — kéo tay quay để đổi % canary
          </p>
          <p className="text-[11px] text-muted">
            0% = shadow (log nhưng không trả output). 100% = full cutover.
          </p>
        </div>
        {rollbackActive && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[10px] font-mono rounded-md bg-red-500/20 text-red-800 dark:text-red-300 px-2 py-0.5 border border-red-500/40"
          >
            ROLLBACK
          </motion.span>
        )}
      </div>

      <motion.svg
        viewBox={`0 0 ${DIAL_SIZE} ${DIAL_SIZE}`}
        className="w-full max-w-[260px] mx-auto"
        animate={
          rollbackActive
            ? { x: [-4, 4, -3, 3, -2, 2, 0] }
            : { x: 0 }
        }
        transition={{ duration: 0.45 }}
      >
        {/* Vòng cung nền */}
        <path
          d={buildArc(0, 100)}
          fill="none"
          stroke="var(--border)"
          strokeWidth={6}
          strokeLinecap="round"
          strokeOpacity={0.5}
        />
        {/* Vòng cung đã fill */}
        {pct > 0 && (
          <motion.path
            d={buildArc(0, pct)}
            fill="none"
            stroke={allPass ? "#22c55e" : "#ef4444"}
            strokeWidth={6}
            strokeLinecap="round"
            initial={false}
            animate={{ d: buildArc(0, pct) }}
            transition={{ type: "spring", stiffness: 140, damping: 18 }}
          />
        )}
        {/* Preset ticks */}
        {tickPositions.map((t) => (
          <g key={t.p}>
            <circle
              cx={t.x}
              cy={t.y}
              r={t.p === pct ? 6 : 3.5}
              fill={t.p === pct ? "#6366f1" : "var(--border)"}
              stroke="#0b1021"
              strokeWidth={1.5}
            />
            <text
              x={t.x}
              y={t.y + (t.y < DIAL_CY - 30 ? -10 : 18)}
              textAnchor="middle"
              fontSize={11}
              fill="var(--muted)"
              fontWeight="bold"
            >
              {t.p}%
            </text>
          </g>
        ))}
        {/* Handle (tay quay) — xoay theo pct */}
        <motion.g
          animate={{ rotate: handleAngle }}
          transition={{ type: "spring", stiffness: 140, damping: 18 }}
          style={{ transformOrigin: `${DIAL_CX}px ${DIAL_CY}px` }}
        >
          <line
            x1={DIAL_CX}
            y1={DIAL_CY}
            x2={DIAL_CX}
            y2={DIAL_CY - DIAL_R}
            stroke={allPass ? "#6366f1" : "#ef4444"}
            strokeWidth={3}
            strokeLinecap="round"
          />
          <circle
            cx={DIAL_CX}
            cy={DIAL_CY - DIAL_R}
            r={8}
            fill={allPass ? "#6366f1" : "#ef4444"}
            stroke="#0b1021"
            strokeWidth={2}
          />
        </motion.g>
        {/* Giá trị chính giữa */}
        <text
          x={DIAL_CX}
          y={DIAL_CY + 6}
          textAnchor="middle"
          fontSize={28}
          fontWeight="bold"
          fill="var(--foreground)"
        >
          {pct}%
        </text>
        <text
          x={DIAL_CX}
          y={DIAL_CY + 26}
          textAnchor="middle"
          fontSize={11}
          fill="var(--muted)"
        >
          {pct === 0 ? "shadow" : "canary"}
        </text>
      </motion.svg>

      <div className="mt-2 flex flex-wrap justify-center gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => jumpTo(p)}
            className={`text-[10px] rounded-md px-2 py-0.5 font-mono transition-colors ${
              pct === p
                ? "bg-accent text-white"
                : "bg-background border border-border text-muted hover:text-foreground"
            }`}
          >
            {p}%
          </button>
        ))}
      </div>
    </div>
  );

  const renderVariantCard = (
    title: string,
    subtitle: string,
    v: VariantSnapshot,
    isCandidate: boolean,
  ) => (
    <div
      className={`rounded-xl border p-3 ${
        isCandidate
          ? allPass
            ? "border-indigo-500/50 bg-indigo-500/10"
            : "border-red-500/50 bg-red-500/10"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs font-bold text-foreground">{title}</p>
          <p className="text-[10px] text-muted">{subtitle}</p>
        </div>
        {isCandidate && (
          <span
            className={`text-[9px] font-mono rounded px-1.5 py-0.5 ${
              allPass
                ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                : "bg-red-500/20 text-red-800 dark:text-red-300"
            }`}
          >
            {allPass ? "healthy" : "breach"}
          </span>
        )}
      </div>
      <dl className="text-[11px] space-y-1">
        <div className="flex justify-between">
          <dt className="text-muted">Task success</dt>
          <dd className="font-mono text-foreground">
            <motion.span
              key={`ts-${v.success.toFixed(1)}`}
              initial={{ opacity: 0, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {v.success.toFixed(1)}%
            </motion.span>
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Thumbs up</dt>
          <dd className="font-mono text-foreground">
            {v.thumbsUp.toFixed(0)}%
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">p95 latency</dt>
          <dd className="font-mono text-foreground">{v.p95.toFixed(2)}s</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">$/req</dt>
          <dd className="font-mono text-foreground">
            ${v.costPerReq.toFixed(4)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Safety viol.</dt>
          <dd className="font-mono text-foreground">
            {v.safetyViolations}
          </dd>
        </div>
      </dl>
      {isCandidate && (
        <div className="mt-2">
          <p className="text-[9px] text-muted mb-1">
            Success rate — 20 phút gần nhất
          </p>
          <svg viewBox="0 0 120 28" className="w-full h-7">
            <polyline
              fill="none"
              stroke={allPass ? "#6366f1" : "#ef4444"}
              strokeWidth={1.5}
              points={spark
                .map((s, i) => {
                  const x = (i / (spark.length - 1)) * 120;
                  const y = 28 - ((s - 70) / 30) * 28;
                  return `${x},${Math.max(2, Math.min(26, y))}`;
                })
                .join(" ")}
            />
          </svg>
        </div>
      )}
    </div>
  );

  const renderGuardrails = () => (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-foreground">Guardrails SLO</p>
        <span
          className={`text-[9px] font-mono rounded px-1.5 py-0.5 ${
            allPass
              ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300"
              : "bg-red-500/20 text-red-800 dark:text-red-300"
          }`}
        >
          {allPass ? "ALL PASS" : "BREACH"}
        </span>
      </div>
      <ul className="space-y-1.5">
        {guards.map((g) => (
          <motion.li
            key={g.id}
            initial={false}
            animate={{
              backgroundColor: g.pass
                ? "rgba(34, 197, 94, 0.05)"
                : "rgba(239, 68, 68, 0.08)",
            }}
            className="rounded-md border border-border/60 p-2"
          >
            <div className="flex items-start gap-2">
              <span
                className={`mt-0.5 text-[11px] font-mono ${
                  g.pass ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
                }`}
              >
                {g.pass ? "✓" : "✗"}
              </span>
              <div className="flex-1">
                <p className="text-[11px] font-semibold text-foreground leading-snug">
                  {g.label}
                </p>
                <p className="text-[10px] text-muted font-mono leading-snug">
                  {g.rule}
                </p>
              </div>
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );

  const renderTimeline = () => (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-xs font-bold text-foreground mb-2">
        Journey — 10 ngày rollout
      </p>
      <div className="flex items-center justify-between gap-1">
        {TIMELINE.map((cp, i) => {
          const active = cp.pct === pct;
          return (
            <button
              key={cp.day}
              type="button"
              onClick={() => jumpTo(cp.pct)}
              className={`flex-1 flex flex-col items-center gap-1 rounded-md px-1.5 py-2 transition-colors ${
                active
                  ? "bg-accent/15 border border-accent/50"
                  : "hover:bg-background border border-transparent"
              }`}
            >
              <span
                className={`h-3 w-3 rounded-full border-2 ${
                  active
                    ? "bg-accent border-accent"
                    : i === 0
                      ? "bg-background border-muted"
                      : "bg-background border-border"
                }`}
              />
              <span className="text-[10px] font-mono text-foreground">
                {cp.label}
              </span>
              <span className="text-[9px] text-muted leading-tight text-center">
                {cp.phase}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderInjectors = () => (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-xs font-bold text-foreground mb-2">
        Inject fault — thấy auto-rollback chạy thế nào
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => triggerInject("latency")}
          className={`text-[11px] rounded-md border px-2 py-1.5 transition ${
            injection === "latency"
              ? "border-red-500/60 bg-red-500/10 text-red-900 dark:text-red-200"
              : "border-border bg-background text-muted hover:text-foreground"
          }`}
        >
          +0.9s p95 latency
        </button>
        <button
          type="button"
          onClick={() => triggerInject("halluc")}
          className={`text-[11px] rounded-md border px-2 py-1.5 transition ${
            injection === "halluc"
              ? "border-red-500/60 bg-red-500/10 text-red-900 dark:text-red-200"
              : "border-border bg-background text-muted hover:text-foreground"
          }`}
        >
          −8pp success + hallucination
        </button>
        <button
          type="button"
          onClick={() => triggerInject("cost")}
          className={`text-[11px] rounded-md border px-2 py-1.5 transition ${
            injection === "cost"
              ? "border-red-500/60 bg-red-500/10 text-red-900 dark:text-red-200"
              : "border-border bg-background text-muted hover:text-foreground"
          }`}
        >
          +$0.008 /req (cost regression)
        </button>
        <button
          type="button"
          onClick={resetInject}
          className="text-[11px] rounded-md border border-border bg-background px-2 py-1.5 text-muted hover:text-foreground transition"
        >
          ⟲ Reset fault
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ───────────── 1. DỰ ĐOÁN ───────────── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Vendor vừa release Claude Sonnet 4.7. Bạn sẽ switch chatbot của VPBank sang model mới như thế nào?"
          options={[
            "Flip env var `MODEL=sonnet-4.7`, restart service, xong",
            "Shadow traffic → canary 1% → ramp 7 ngày với auto-rollback trên 4 SLO (success, latency, cost, safety)",
            "Chạy A/B 50/50 ngay từ đầu để có sample lớn nhanh",
            "Chờ 1 năm xem ai khác bị lỗi trước rồi mới đổi",
          ]}
          correct={1}
          explanation="Flip env var = 'big bang', không có rollback nhanh khi LLM mới vi phạm SLO. A/B 50/50 ngay lập tức đưa 50% user vào vùng chưa kiểm chứng — rủi ro cao. Chờ 1 năm thì vendor đã release model mới hơn. Đáp án đúng: gradient rollout — shadow để kiểm crash/format, rồi 1% canary để bắt tín hiệu thật ở cỡ mẫu an toàn, rồi ramp dần với guardrail."
        >
          {/* ───────────── 2. VISUALIZATION ───────────── */}
          <LessonSection
            step={2}
            totalSteps={TOTAL_STEPS}
            label="Rollout Control Dial"
          >
            <p className="mb-4 text-sm text-muted leading-relaxed">
              Hãy nhập vai <strong className="text-foreground">release
              engineer</strong>. Kéo tay quay hoặc bấm preset để đổi %
              canary. Quan sát: (a) metric của v_candidate thay đổi thế
              nào theo %, (b) guardrail chuyển pass/fail, (c) khi một
              guard bị vi phạm → dial tự động về 0% và rung cảnh báo.
            </p>

            <VisualizationSection>
              <div className="space-y-4">
                <AnimatePresence>
                  {rollbackActive && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="rounded-lg border border-red-500/60 bg-red-500/10 p-3 text-center"
                    >
                      <p className="text-sm font-bold text-red-800 dark:text-red-300">
                        AUTO-ROLLBACK TRIGGERED
                      </p>
                      <p className="text-[11px] text-red-900/80 dark:text-red-200/80 mt-0.5">
                        Một guardrail SLO bị vi phạm — traffic weight về
                        0%, feature flag tắt candidate, trang on-call.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid lg:grid-cols-[1fr_1fr] gap-4">
                  <div>{renderDial()}</div>
                  <div>{renderGuardrails()}</div>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  {renderVariantCard(
                    "v_current (baseline)",
                    "claude-sonnet-4.5 · ổn định 30 ngày",
                    BASELINE,
                    false,
                  )}
                  {renderVariantCard(
                    "v_candidate",
                    "claude-sonnet-4.7 · rollout",
                    candidate,
                    true,
                  )}
                </div>

                <div className="grid lg:grid-cols-[1.3fr_1fr] gap-3">
                  {renderTimeline()}
                  {renderInjectors()}
                </div>
              </div>
            </VisualizationSection>
          </LessonSection>

          {/* ───────────── 3. AHA ───────────── */}
          <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
            <AhaMoment>
              <p>
                LLM <strong>không deterministic</strong>. Thay đổi model
                → phân phối output thay đổi → downstream metric thay
                đổi theo cách khó đoán trước. Chính vì vậy{" "}
                <strong>rollout gradient là cách duy nhất an toàn</strong>
                : shadow để bắt lỗi crash/format, canary 1% để bắt tín
                hiệu thật trên user ở cỡ mẫu đủ nhỏ mà không gây hại,
                rồi ramp dần với guardrail tự động. &quot;Big bang&quot;
                một model mới vào production là đặt cược business trên
                thay đổi mà bạn không thể lường hết hệ quả.
              </p>
            </AhaMoment>
          </LessonSection>

          {/* ───────────── 4. CALLOUTS ───────────── */}
          <LessonSection
            step={4}
            totalSteps={TOTAL_STEPS}
            label="Bốn lưu ý quan trọng"
          >
            <div className="space-y-3">
              <Callout variant="tip" title="Gọi tên đúng: shadow, canary, blue-green, progressive delivery">
                <strong>Shadow / Dark launch</strong>: chạy song song 2
                model, chỉ log v_candidate — không trả cho user. Dùng
                trước canary để bắt crash/format diff.{" "}
                <strong>Canary</strong>: một % user nhận v_candidate
                thật, ramp dần với guardrail (1% → 5% → 25% → 50% →
                100%). <strong>Blue-green</strong>: 2 môi trường song
                song, flip tức thời — cần capacity gấp đôi, nhưng cutover
                nguyên tử. <strong>Rolling</strong>: thay từng instance
                một, phù hợp infra hơn chiến lược model.{" "}
                <strong>Progressive delivery</strong> = canary + feature
                flag + auto-rollback, là mẫu chuẩn cho LLM 2026.
              </Callout>

              <Callout
                variant="warning"
                title="A/B test LLM cần sample lớn hơn — dùng sequential testing hoặc CUPED"
              >
                Output LLM có variance cao hơn UI A/B truyền thống
                nhiều. Công thức sample size{" "}
                <code>n ∝ σ²/δ²</code> nghĩa là variance gấp 4× cần
                sample gấp 4×. Hai cách cắt ngắn:{" "}
                <strong>sequential testing</strong> (alpha spending kiểu
                Always Valid Inference của Netflix/Optimizely — cho
                phép peek dữ liệu mà không bị false positive) và{" "}
                <strong>CUPED</strong> (dùng pre-period covariate để
                giảm variance 30-50%). Nếu không áp dụng, bạn sẽ kết
                luận quá sớm hoặc chờ quá lâu.
              </Callout>

              <Callout
                variant="info"
                title="Shadow traffic = đôi dispatch, một output"
              >
                Shadow: mỗi request được gửi đến CẢ v_current và
                v_candidate. User chỉ nhận output từ v_current. Log cả
                hai output (+ tool call, + token, + latency) vào một
                bảng so sánh. Sau 1-2 ngày bạn có: (1) bằng chứng
                candidate không crash, (2) phân phối diff format,
                (3) estimate cost và latency. Chi phí: tăng 2× inference
                trong giai đoạn shadow — đáng vì tránh incident
                production.
              </Callout>

              <Callout
                variant="insight"
                title='"Feature flag" cho model version là pattern chuẩn'
              >
                LaunchDarkly, Unleash, hoặc tự làm trên Postgres +
                config reload. Ý tưởng: tách <em>chọn model</em> khỏi{" "}
                <em>deploy binary</em>. Rollout trở thành thao tác
                config — update một hàng trong bảng{" "}
                <code>model_routing</code> với weight theo segment, hot
                reload ở service layer. Rollback tính bằng giây, A/B
                theo tenant/user/region cực dễ. Đây là nền của mọi
                canary LLM nghiêm túc.
              </Callout>
            </div>
          </LessonSection>

          {/* ───────────── 5. INLINE CHALLENGES ───────────── */}
          <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
            <div className="space-y-4">
              <InlineChallenge
                question="Bạn đang canary 10% candidate. Quan sát: cost tăng 15% nhưng CSAT tăng 8%. Ngưỡng guardrail cost = 1.2× baseline. Rollback hay tiếp tục ramp?"
                options={[
                  "Rollback — cost tăng 15% là tệ",
                  "Tiếp tục ramp — cost 15% < ngưỡng 20%, CSAT tốt hơn rõ rệt. Nhưng cần tính lifetime: nếu cost tăng nền 15% và CSAT không quy ra revenue đủ bù, cần escalate quyết định lên PM",
                  "Tăng ngưỡng cost lên 1.5× rồi ramp tiếp",
                  "Chạy luôn 100% vì CSAT dương",
                ]}
                correct={1}
                explanation="Guardrail CHƯA vi phạm (15% < 20%) nên technically được phép ramp. Nhưng quyết định cuối thuộc business: CSAT +8pp có đáng trade 15% cost dài hạn không? Đây là lúc cần breakdown theo segment (high-value user có chấp nhận chi phí cao hơn?) và ngưỡng nên có 2 mức: soft (warn + escalate) và hard (auto-rollback)."
              />

              <InlineChallenge
                question="Shadow traffic 1 ngày: v_candidate ĐÔI KHI output JSON khác format (thiếu field optional). Downstream parser fail 0.4% request. Bạn làm gì?"
                options={[
                  "Bỏ qua — 0.4% là thấp",
                  "BLOCK canary cho đến khi fix. Lỗi format ở shadow = lỗi format ở canary với user thật. Sửa 1 trong 2 chiều: (a) prompt cứng thêm 'output đầy đủ mọi field kể cả null', hoặc (b) parser tolerant với field missing — rồi test lại shadow",
                  "Rollout candidate luôn, parser tự sửa sau",
                  "Tăng traffic candidate lên 5% để có sample lớn hơn",
                ]}
                correct={1}
                explanation="Đây chính là lý do có bước shadow. Lỗi format JSON ở shadow = incident thật ở canary vì downstream vẫn parse cùng cách. Pattern chuẩn: (1) gate canary start bằng 'shadow must be clean 48h', (2) dùng structured output / JSON schema với retry khi parse fail, (3) parser bên downstream tolerant với schema evolve. Đừng bao giờ ramp một format bug — nó không tự hết khi tăng %."
              />
            </div>
          </LessonSection>

          {/* ───────────── 6. LÝ THUYẾT ───────────── */}
          <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Lý thuyết">
            <ExplanationSection>
              <p>
                <strong>Canary release</strong> là pattern triển khai
                trong đó phiên bản mới (v_candidate) nhận một tỷ lệ
                nhỏ traffic production, được đo đạc so với baseline
                (v_current), và được ramp dần hoặc rollback tự động
                dựa trên metric. Khác với A/B test (tối đa hoá
                statistical power để so sánh), canary tối ưu cho{" "}
                <em>an toàn triển khai</em>: phát hiện regression sớm,
                ảnh hưởng user tối thiểu, rollback nhanh.
              </p>

              <p>Bảng so sánh 5 pattern thường gặp:</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-border rounded-lg overflow-hidden">
                  <thead className="bg-background text-foreground">
                    <tr>
                      <th className="text-left p-2 border-b border-border">Pattern</th>
                      <th className="text-left p-2 border-b border-border">
                        User nhận output
                      </th>
                      <th className="text-left p-2 border-b border-border">
                        Capacity
                      </th>
                      <th className="text-left p-2 border-b border-border">
                        Rollback
                      </th>
                      <th className="text-left p-2 border-b border-border">
                        Dùng cho
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-muted">
                    <tr className="border-b border-border/60">
                      <td className="p-2 font-semibold text-foreground">
                        Shadow / Dark launch
                      </td>
                      <td className="p-2">Không (chỉ log)</td>
                      <td className="p-2">2× (chạy song song)</td>
                      <td className="p-2">Không cần</td>
                      <td className="p-2">Kiểm format, crash, cost trước canary</td>
                    </tr>
                    <tr className="border-b border-border/60">
                      <td className="p-2 font-semibold text-foreground">Canary</td>
                      <td className="p-2">% nhỏ user</td>
                      <td className="p-2">1× + buffer</td>
                      <td className="p-2">Giây (flip flag)</td>
                      <td className="p-2">Ramp dần, bắt regression thật</td>
                    </tr>
                    <tr className="border-b border-border/60">
                      <td className="p-2 font-semibold text-foreground">Blue-green</td>
                      <td className="p-2">Toàn bộ (sau flip)</td>
                      <td className="p-2">2× (2 environment)</td>
                      <td className="p-2">Giây (flip LB)</td>
                      <td className="p-2">Cần cutover atomic, rollback tức thời</td>
                    </tr>
                    <tr className="border-b border-border/60">
                      <td className="p-2 font-semibold text-foreground">Rolling</td>
                      <td className="p-2">Thay dần instance</td>
                      <td className="p-2">~1×</td>
                      <td className="p-2">Phút</td>
                      <td className="p-2">Infra (pod/node), ít phù hợp cho model version</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold text-foreground">
                        Progressive delivery
                      </td>
                      <td className="p-2">Ramp theo segment</td>
                      <td className="p-2">1× + buffer</td>
                      <td className="p-2">Tự động theo SLO</td>
                      <td className="p-2">
                        Canary + flag + auto-rollback — mẫu chuẩn LLM
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="mt-4">
                <strong>Đánh giá thống kê hai variant.</strong> Khi có
                đủ sample, ta dùng <em>Welch t-test</em> vì variance
                giữa 2 model thường khác nhau:
              </p>
              <p className="text-center">
                <LaTeX>
                  {"t = \\frac{\\bar{X}_a - \\bar{X}_b}{\\sqrt{s_a^2/n_a + s_b^2/n_b}}"}
                </LaTeX>
              </p>
              <p className="text-xs text-muted">
                Trong đó <code>X̄</code> là mean metric (vd task
                success rate) mỗi variant, <code>s²</code> là variance
                mẫu, <code>n</code> là sample size. p-value tính từ
                phân phối t với bậc tự do theo công thức
                Welch-Satterthwaite. Nhớ rằng với LLM: (1){" "}
                <em>peeking</em> (nhìn kết quả sớm rồi quyết định) làm
                phát sinh false positive — dùng{" "}
                <strong>sequential testing</strong>; (2) variance của
                temp &gt; 0 khá cao — <strong>CUPED</strong>{" "}
                (control with pre-experiment data) giúp giảm 30-50%
                sample size.
              </p>

              <p>
                <strong>Goal metric vs Guardrail metric.</strong> Quy
                tắc vàng của rollout:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>
                  <strong>Goal metric</strong> (a.k.a. north-star,
                  primary): để <em>chọn</em> v_candidate có đáng
                  rollout hay không. Ví dụ: task success rate, CSAT,
                  revenue per session, số lượt chuyển đổi.
                </li>
                <li>
                  <strong>Guardrail metric</strong>: để <em>chặn</em>{" "}
                  v_candidate nếu vi phạm, bất kể goal. Ví dụ: p95
                  latency, $/req, safety violations, error rate.
                </li>
              </ul>
              <p className="text-sm">
                Công thức quyết định:{" "}
                <code>rollout = goal_improved AND all_guardrails_pass</code>
                . Nếu goal tốt nhưng guardrail vi phạm → rollback hoặc
                block, không bao giờ đánh đổi. Guardrail là lằn ranh
                &quot;do no harm&quot;, không phải số để mặc cả.
              </p>

              <CodeBlock
                language="python"
                title="canary_controller.py — per-request sampling + SLO check + rollback"
              >
                {`import random
import time
from dataclasses import dataclass, field
from typing import Callable


@dataclass
class SLO:
    name: str
    check: Callable[[dict, dict], bool]   # (candidate_stats, baseline_stats) -> bool
    rule_desc: str


@dataclass
class CanaryController:
    """Điều khiển canary: quyết định route request nào đi v_candidate,
    giám sát SLO, tự động rollback khi bị vi phạm."""

    weight: float = 0.0              # % traffic đi v_candidate, 0..1
    baseline_stats: dict = field(default_factory=dict)
    candidate_stats: dict = field(default_factory=dict)
    slos: list[SLO] = field(default_factory=list)
    on_rollback: Callable[[str], None] | None = None
    min_sample_for_slo: int = 200    # ít mẫu quá thì đừng trigger rollback

    def route(self, request_id: str) -> str:
        """Trả về 'candidate' hoặc 'baseline'. Dùng hash stable theo
        request/user để một user luôn rơi vào một variant."""
        bucket = stable_hash(request_id) % 10_000 / 10_000.0
        return "candidate" if bucket < self.weight else "baseline"

    def record(self, variant: str, metrics: dict) -> None:
        """Ghi metric (success, latency_ms, cost, safety_viol) cho mỗi
        request hoàn thành. Gọi từ request middleware sau khi response
        về."""
        store = (
            self.candidate_stats if variant == "candidate" else self.baseline_stats
        )
        for k, v in metrics.items():
            store.setdefault(k, []).append(v)
        if variant == "candidate":
            self._check_slos()

    def _check_slos(self) -> None:
        n = len(self.candidate_stats.get("success", []))
        if n < self.min_sample_for_slo:
            return  # chưa đủ sample — bỏ qua vòng này
        for slo in self.slos:
            if not slo.check(self.candidate_stats, self.baseline_stats):
                self._rollback(f"SLO {slo.name!r} vi phạm: {slo.rule_desc}")
                return

    def _rollback(self, reason: str) -> None:
        prev_weight = self.weight
        self.weight = 0.0
        # Giữ stats để postmortem — KHÔNG clear candidate_stats.
        if self.on_rollback:
            self.on_rollback(f"Rollback từ {prev_weight:.1%} → 0%: {reason}")

    def ramp(self, target_weight: float, step: float = 0.01, dwell_s: int = 60):
        """Ramp dần đến target với dwell time giữa các bước."""
        while self.weight < target_weight:
            self.weight = min(self.weight + step, target_weight)
            time.sleep(dwell_s)
            self._check_slos()
            if self.weight == 0.0:
                break  # đã rollback trong vòng này


def stable_hash(s: str) -> int:
    # Ổn định — một user luôn rơi vào cùng bucket trong suốt canary.
    import hashlib
    return int(hashlib.md5(s.encode()).hexdigest(), 16)


# ────────── Ví dụ sử dụng ──────────

def slo_success(cand, base):
    from statistics import mean
    return mean(cand["success"]) >= 0.90 * mean(base["success"])


def slo_p95_latency(cand, base):
    p95c = percentile(cand["latency_ms"], 95)
    p95b = percentile(base["latency_ms"], 95)
    return p95c <= 1.1 * p95b


ctl = CanaryController(
    slos=[
        SLO("task_success", slo_success, "cand success ≥ 90% baseline"),
        SLO("p95_latency",  slo_p95_latency, "cand p95 ≤ 1.1× baseline"),
    ],
    on_rollback=lambda msg: page_oncall(msg),
)
ctl.ramp(target_weight=0.50, step=0.05, dwell_s=900)  # 5%/15min`}
              </CodeBlock>

              <p>
                Nếu bạn dùng Kubernetes, stack chuẩn là{" "}
                <strong>Argo Rollouts</strong> hoặc{" "}
                <strong>Flagger</strong> — chúng wrap logic trên thành
                resource declarative và tích hợp sẵn với Prometheus
                cho SLO check:
              </p>

              <CodeBlock language="yaml" title="flagger-canary.yaml">
                {`apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: chatbot-llm
  namespace: prod
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: chatbot-llm
  service:
    port: 8080
  analysis:
    interval: 5m
    threshold: 3          # 3 check fail liên tiếp → rollback
    maxWeight: 50         # canary tối đa 50% trước khi promote
    stepWeight: 5         # tăng 5% mỗi vòng
    stepWeights: [1, 5, 10, 25, 50]

    # Metric tuỳ chỉnh — hỏi Prometheus theo query chứa model version
    metrics:
      - name: llm-task-success
        thresholdRange:
          min: 0.88
        query: |
          sum(rate(llm_task_success{model="candidate",app="chatbot"}[5m]))
          /
          sum(rate(llm_task_total{model="candidate",app="chatbot"}[5m]))

      - name: llm-p95-latency
        thresholdRange:
          max: 2.0        # giây
        query: |
          histogram_quantile(0.95,
            sum(rate(llm_latency_seconds_bucket{model="candidate"}[5m]))
            by (le))

      - name: llm-cost-per-request
        thresholdRange:
          max: 0.0144     # = 1.2 × baseline 0.012
        query: |
          sum(rate(llm_cost_usd{model="candidate"}[5m]))
          /
          sum(rate(llm_requests{model="candidate"}[5m]))

      - name: llm-safety-violations
        thresholdRange:
          max: 0
        query: |
          sum(rate(llm_safety_violation_total{model="candidate"}[5m]))

    # Nếu bất kỳ metric nào fail threshold 3 vòng liên tiếp → Flagger
    # giảm weight về 0 và rollback.`}
              </CodeBlock>

              <CollapsibleDetail title="Sample size tính thế nào cho LLM A/B?">
                <p className="text-sm">
                  Công thức two-sample test với power{" "}
                  <code>1−β</code>, độ tin cậy <code>1−α</code>:
                </p>
                <p className="text-center">
                  <LaTeX>
                    {"n \\approx \\frac{2 \\sigma^2 (z_{\\alpha/2} + z_{\\beta})^2}{\\delta^2}"}
                  </LaTeX>
                </p>
                <p className="text-sm">
                  Ví dụ: σ (SD của task success) = 0.35, δ (minimum
                  detectable effect) = 0.02 (2 điểm phần trăm), α =
                  0.05, β = 0.20 (power 80%). Khi đó z_{"{α/2}"} = 1.96,
                  z_β = 0.84. Tính ra n ≈ 2 × 0.35² × (1.96+0.84)² /
                  0.02² ≈ <strong>4800 request mỗi nhánh</strong>. Với
                  traffic 10k req/giờ và canary 5%, cần khoảng 10 giờ
                  để đạt power.
                </p>
                <p className="text-sm mt-2">
                  Mẹo rút ngắn trong thực tế:
                </p>
                <ul className="list-disc list-inside text-sm pl-2 space-y-1 mt-1">
                  <li>
                    <strong>CUPED</strong>: dùng pre-period success
                    rate làm covariate → giảm σ² 30-50% → cần ít
                    sample hơn.
                  </li>
                  <li>
                    <strong>Sequential testing</strong> (alpha
                    spending): peek dữ liệu liên tục mà vẫn kiểm soát
                    false positive — dừng sớm khi có tín hiệu mạnh.
                  </li>
                  <li>
                    <strong>Stratified sampling</strong>: chia segment
                    user trước, cân bằng giữa canary và baseline →
                    giảm variance do segment mix.
                  </li>
                </ul>
              </CollapsibleDetail>

              <CollapsibleDetail title="Multi-armed bandit thay vì A/B truyền thống — khi nào hợp?">
                <p className="text-sm">
                  A/B test: cố định tỷ lệ traffic, chạy đủ sample, rồi
                  quyết định. Khi test chạy, cost của việc đẩy user
                  vào nhánh xấu là cố định.{" "}
                  <strong>Multi-armed bandit</strong> (Thompson
                  sampling, UCB, ε-greedy): cập nhật tỷ lệ{" "}
                  <em>liên tục</em>, đẩy nhiều traffic hơn vào nhánh
                  đang thắng → giảm tổng regret.
                </p>
                <p className="text-sm mt-2">Phù hợp khi:</p>
                <ul className="list-disc list-inside text-sm pl-2 space-y-1">
                  <li>
                    Goal metric đo được nhanh (vd click, thumbs-up) —
                    không phải retention tuần sau.
                  </li>
                  <li>
                    Nhiều hơn 2 variant (3-10 model / prompt) — A/B
                    multi-arm quá tốn sample, bandit tự phân bổ tốt
                    hơn.
                  </li>
                  <li>
                    Muốn ship nhanh, chấp nhận ít rigorous về
                    statistical test.
                  </li>
                </ul>
                <p className="text-sm mt-2">Không phù hợp khi:</p>
                <ul className="list-disc list-inside text-sm pl-2 space-y-1">
                  <li>
                    Cần báo cáo thống kê chính thức (compliance, y
                    khoa) — bandit khó giải trình p-value.
                  </li>
                  <li>
                    Delayed reward (feedback đến sau hàng giờ/ngày).
                  </li>
                  <li>
                    Guardrail nghiêm ngặt — bandit có thể đẩy traffic
                    vào nhánh nhất thời tốt nhưng safety kém.
                  </li>
                </ul>
              </CollapsibleDetail>

              <p className="text-sm mt-4">
                Canary không đứng một mình — nó phụ thuộc vào hệ thống
                đo đạc. Xem{" "}
                <TopicLink slug="llm-evaluation">llm-evaluation</TopicLink>{" "}
                để thiết kế bộ metric offline/online,{" "}
                <TopicLink slug="observability-for-ai">
                  observability for AI
                </TopicLink>{" "}
                để capture trace + feedback làm tín hiệu SLO, và{" "}
                <TopicLink slug="mlops">mlops</TopicLink> cho phần
                pipeline từ train đến deploy.
              </p>
            </ExplanationSection>
          </LessonSection>

          {/* ───────────── 7. CASE STUDY ───────────── */}
          <LessonSection
            step={7}
            totalSteps={TOTAL_STEPS}
            label="Case study: Sendo upgrade chatbot tư vấn"
          >
            <div className="rounded-xl border border-border bg-card p-4 text-sm space-y-3">
              <p>
                <strong className="text-foreground">Bối cảnh.</strong>{" "}
                Sendo chạy chatbot tư vấn sản phẩm trên{" "}
                <code>gpt-4o-mini</code> (cost ~$0.0025/req). Tháng 3,
                team nhận thấy chatbot hay đưa gợi ý lạc đề khi user
                hỏi sâu về thông số sản phẩm. Vendor vừa release{" "}
                <code>claude-sonnet-4.5</code> — team quyết định thử
                upgrade.
              </p>

              <p>
                <strong className="text-foreground">Day 1 — Shadow.</strong>{" "}
                Chạy song song 2 model trên 100% traffic (chỉ log
                candidate). Kết quả sau 24 giờ, 180k request:
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li>
                  Faithfulness (LLM-as-judge đối chiếu với catalog):{" "}
                  <strong className="text-emerald-700 dark:text-emerald-400">+6pp</strong>{" "}
                  (76% → 82%).
                </li>
                <li>
                  p95 latency:{" "}
                  <strong className="text-amber-700 dark:text-amber-400">+1.1s</strong>{" "}
                  (0.8s → 1.9s).
                </li>
                <li>
                  Cost/request:{" "}
                  <strong className="text-red-700 dark:text-red-400">×3.2</strong>{" "}
                  ($0.0025 → $0.008).
                </li>
                <li>
                  Format JSON: OK, không có downstream parser fail.
                </li>
              </ul>

              <p>
                <strong className="text-foreground">Day 2-4 — Canary.</strong>{" "}
                Ramp 1% → 5%. Goal metric (CSAT) thật sự tăng 4-5 điểm
                trong nhóm canary. Nhưng{" "}
                <em>guardrail cost</em> của team đặt ≤ 1.2× baseline =
                $0.003. Candidate ở mức $0.008 — vượt hơn 2.6× ngưỡng.{" "}
                <strong>Auto-rollback không kích hoạt</strong> vì
                guard cost được config là &quot;warn&quot; chứ không
                phải &quot;hard stop&quot;. Team quyết định{" "}
                <strong>dừng ở 5%</strong> thay vì ramp tiếp, và họp
                với PM.
              </p>

              <p>
                <strong className="text-foreground">
                  Đổi chiến thuật — Prompt distillation.
                </strong>{" "}
                Thay vì cutover sang sonnet cho 100% user, team chạy
                offline:
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li>
                  Dùng sonnet-4.5 làm teacher: sinh 5000 câu trả lời
                  gold trên tập query đại diện.
                </li>
                <li>
                  Soạn lại system prompt cho gpt-4o-mini, chèn few-shot
                  từ output sonnet + checklist các điểm faithfulness
                  hay sai.
                </li>
                <li>
                  Chạy eval lại: mini với prompt mới đạt faithfulness
                  80% (vs sonnet 82%, mini cũ 76%).
                </li>
              </ul>

              <p>
                <strong className="text-foreground">Kết quả.</strong>{" "}
                Shadow lại với mini-prompt-v2: faithfulness +4pp, cost
                gần bằng mini cũ, latency giữ nguyên. Canary 1% → 5% →
                25% → 100% trong 6 ngày, không rollback. Chatbot
                improve mà không đốt 3× ngân sách.
              </p>

              <p className="italic text-muted border-l-2 border-accent pl-3">
                <strong className="text-foreground">Bài học.</strong>{" "}
                &quot;Model xịn hơn&quot; không phải lúc nào cũng
                thắng trong production. Đo toàn hệ metric (goal +
                guardrail), đừng chỉ so chất lượng. Đôi khi giải pháp
                là giữ model cũ với prompt đã học từ model mới — rẻ
                hơn, ổn hơn, và vẫn cải thiện. Canary không chỉ dùng
                để deploy, mà còn để <em>học xem candidate có đáng
                deploy không</em>.
              </p>
            </div>
          </LessonSection>

          {/* ───────────── 8. TÓM TẮT ───────────── */}
          <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Tóm tắt">
            <MiniSummary
              title="Những điều cần nhớ về Canary & Shadow Rollout"
              points={[
                "LLM không deterministic → rollout gradient (shadow → canary 1% → ramp) là cách duy nhất an toàn để đổi model trong production.",
                "Shadow = log cả hai output, user chỉ nhận baseline; canary = một % user thật nhận candidate. Dùng shadow TRƯỚC canary để bắt crash/format.",
                "Goal metric (CSAT, success) để chọn; guardrail metric (latency, cost, safety) để chặn. Rollout khi goal tốt VÀ guardrail pass — không đánh đổi.",
                "Auto-rollback: flip feature flag về 0% trong giây, giữ artifact để postmortem, page on-call. Dùng Flagger/Argo Rollouts hoặc tự viết CanaryController.",
                "A/B LLM cần sample lớn hơn UI A/B vì output variance cao — dùng Welch t-test, sequential testing, hoặc CUPED để rút ngắn thời gian.",
                "Pattern 'model version as feature flag' (LaunchDarkly/Unleash/Postgres): tách chọn model khỏi deploy code, rollback tính bằng giây.",
              ]}
            />
          </LessonSection>

          {/* ───────────── 9. QUIZ ───────────── */}
          <LessonSection step={9} totalSteps={TOTAL_STEPS} label="Kiểm tra">
            <QuizSection questions={quizQuestions} />
          </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
