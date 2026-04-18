"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "cost-latency-tokens",
  title: "Cost, Latency & Token Economics for LLM Apps",
  titleVi: "Kinh tế token — Chi phí, độ trễ và hiệu quả",
  description:
    "Đơn vị tiền tệ của LLM production là token. Biết cách đo $/task, phân rã latency (TTFT + decode + retrieval + tool), tính break-even với human baseline, và thấy tức thì tác dụng của prompt caching / model cascade / context compression.",
  category: "infrastructure",
  tags: ["cost", "latency", "tokens", "caching", "optimization"],
  difficulty: "advanced",
  relatedSlugs: [
    "cost-optimization",
    "inference-optimization",
    "kv-cache",
    "observability-for-ai",
    "model-serving",
  ],
  vizType: "interactive",
};

// ──────────────────────────────────────────────────────────────────────
// DỮ LIỆU MODEL — giá tham khảo theo bảng giá công khai đầu 2026
// Đơn vị: USD / 1 triệu token
// ──────────────────────────────────────────────────────────────────────

interface ModelPrice {
  id: string;
  label: string;
  vendor: string;
  inputPerM: number; // USD / 1M input tokens
  outputPerM: number; // USD / 1M output tokens
  // Các hằng số ảnh hưởng độ trễ (tương đối)
  ttftMs: number; // time-to-first-token base (ms)
  decodeTps: number; // tokens/s khi decode
  hint: string;
}

const MODELS: ModelPrice[] = [
  {
    id: "gpt-4o",
    label: "gpt-4o",
    vendor: "OpenAI",
    inputPerM: 2.5,
    outputPerM: 10,
    ttftMs: 420,
    decodeTps: 75,
    hint: "Flagship đa năng, mạnh cả code và reasoning.",
  },
  {
    id: "gpt-4o-mini",
    label: "gpt-4o-mini",
    vendor: "OpenAI",
    inputPerM: 0.15,
    outputPerM: 0.6,
    ttftMs: 260,
    decodeTps: 110,
    hint: "Giá thấp, đủ cho phân loại, trích xuất và draft đơn giản.",
  },
  {
    id: "claude-sonnet-4-6",
    label: "claude-sonnet-4.6",
    vendor: "Anthropic",
    inputPerM: 3,
    outputPerM: 15,
    ttftMs: 380,
    decodeTps: 70,
    hint: "Viết dài, phân tích tài liệu, agentic workflows.",
  },
  {
    id: "claude-haiku-4-5",
    label: "claude-haiku-4.5",
    vendor: "Anthropic",
    inputPerM: 1,
    outputPerM: 5,
    ttftMs: 230,
    decodeTps: 120,
    hint: "Giá trung, phù hợp là chặng đầu của cascade.",
  },
];

const TOTAL_STEPS = 9;

// Mức lương tham khảo một nhân viên CSKH Việt Nam (VND / tháng).
const HUMAN_SALARY_VND = 15_000_000;
const USD_VND = 25_000;

// ──────────────────────────────────────────────────────────────────────
// COMPONENT: Token Economy Calculator
// ──────────────────────────────────────────────────────────────────────

interface CalcConfig {
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  requestsPerDay: number;
  cacheHitRate: number; // 0..1
  cascadeOn: boolean;
  compressOn: boolean;
}

function computeCost(cfg: CalcConfig) {
  const model = MODELS.find((m) => m.id === cfg.modelId) ?? MODELS[0];

  // Context compression: giảm 30% input tokens nếu bật.
  const inputTok = cfg.compressOn ? cfg.inputTokens * 0.7 : cfg.inputTokens;
  const outputTok = cfg.outputTokens;

  // Giá "đã cache" = 10% giá gốc (discount 0.9).
  const cacheDiscount = 0.9;
  const effectiveInputPrice =
    (model.inputPerM / 1_000_000) *
    (1 - cfg.cacheHitRate * cacheDiscount);
  const outputPrice = model.outputPerM / 1_000_000;

  let perReq = inputTok * effectiveInputPrice + outputTok * outputPrice;

  // Cascade: giả định 70% traffic dừng ở model rẻ hơn → giảm 40% $/req.
  if (cfg.cascadeOn) perReq *= 0.6;

  const perDay = perReq * cfg.requestsPerDay;
  const perMonth = perDay * 30;
  const perYear = perDay * 365;

  // Latency synthetic: TTFT + decode + retrieval (cache penalty) + tool overhead.
  const baseTtft = model.ttftMs;
  const decodeMs = (outputTok / model.decodeTps) * 1000;
  // Cache miss mô phỏng retrieval overhead: miss cao → retrieval dài hơn.
  const retrievalMs = 150 + (1 - cfg.cacheHitRate) * 400;
  // Tool call: giả định 0.6 tool/req, mỗi tool 300ms.
  const toolMs = 0.6 * 300;
  const p95Ms = baseTtft + decodeMs + retrievalMs + toolMs;

  return {
    model,
    perReq,
    perDay,
    perMonth,
    perYear,
    ttftMs: baseTtft,
    decodeMs,
    retrievalMs,
    toolMs,
    p95Ms,
  };
}

// Slider log-scale cho requests/ngày 100 .. 1_000_000
function toLogSlider(value: number) {
  const min = Math.log10(100);
  const max = Math.log10(1_000_000);
  return ((Math.log10(value) - min) / (max - min)) * 100;
}
function fromLogSlider(pct: number) {
  const min = Math.log10(100);
  const max = Math.log10(1_000_000);
  return Math.round(Math.pow(10, min + (pct / 100) * (max - min)));
}

function formatUsd(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(3)}`;
  return `$${n.toFixed(4)}`;
}

function formatInt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${Math.round(n)}`;
}

// Component con: số có hiệu ứng tween-count khi thay đổi
function AnimatedNumber({
  value,
  format,
  className,
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current;
    const to = value;
    prev.current = to;
    const start = performance.now();
    const dur = 450;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className={className}>{format(display)}</span>;
}

function TokenCalculator() {
  const [cfg, setCfg] = useState<CalcConfig>({
    modelId: "gpt-4o",
    inputTokens: 2000,
    outputTokens: 500,
    requestsPerDay: 50_000,
    cacheHitRate: 0,
    cascadeOn: false,
    compressOn: false,
  });

  const result = useMemo(() => computeCost(cfg), [cfg]);

  // Lịch sử cost (USD/ngày) — giữ 20 cấu hình gần nhất để vẽ sparkline.
  const [history, setHistory] = useState<number[]>([result.perDay]);
  useEffect(() => {
    setHistory((h) => {
      const next = [...h, result.perDay];
      if (next.length > 20) next.shift();
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.perDay]);

  // Break-even: chi phí 1 nhân viên/tháng theo USD
  const humanMonthlyUsd = HUMAN_SALARY_VND / USD_VND;
  const costRatio = result.perMonth / humanMonthlyUsd;
  const breakEvenText =
    costRatio <= 0.2
      ? "Rẻ hơn 5× lương người — cascade/caching làm tốt việc"
      : costRatio <= 1
        ? "Rẻ hơn lương 1 người — vẫn trong vùng an toàn"
        : costRatio <= 3
          ? `Bằng khoảng ${costRatio.toFixed(1)} nhân viên — review ngay cost lever`
          : "Cao hơn 3× lương người — cần dừng traffic không cần thiết";

  // Bar chart latency — 4 thanh ngang
  const latencyBars = [
    { label: "TTFT", ms: result.ttftMs, color: "#6366f1" },
    { label: "Decode", ms: result.decodeMs, color: "#22c55e" },
    { label: "Retrieval", ms: result.retrievalMs, color: "#f59e0b" },
    { label: "Tool calls", ms: result.toolMs, color: "#ef4444" },
  ];
  const totalLatencyMs = latencyBars.reduce((s, b) => s + b.ms, 0);

  // Sparkline SVG points
  const sparkW = 140;
  const sparkH = 34;
  const sparkMin = Math.min(...history);
  const sparkMax = Math.max(...history);
  const sparkRange = Math.max(1e-6, sparkMax - sparkMin);
  const sparkPts = history
    .map((v, i) => {
      const x = (i / Math.max(1, history.length - 1)) * sparkW;
      const y = sparkH - ((v - sparkMin) / sparkRange) * sparkH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* ─────────────── LEFT PANEL — SLIDERS + TOGGLES ─────────────── */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div>
          <p className="text-sm font-bold text-foreground">Cấu hình</p>
          <p className="text-[11px] text-muted">
            Kéo slider, bật toggle — mọi ô bên phải cập nhật ngay.
          </p>
        </div>

        {/* MODEL RADIO */}
        <div>
          <label className="text-[11px] font-semibold text-muted uppercase tracking-wide">
            Model
          </label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {MODELS.map((m) => {
              const active = cfg.modelId === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setCfg((c) => ({ ...c, modelId: m.id }))}
                  className={`rounded-lg border px-3 py-2 text-left transition ${
                    active
                      ? "border-accent bg-accent/10"
                      : "border-border bg-background hover:border-accent/60"
                  }`}
                >
                  <p className="text-[12px] font-semibold text-foreground">
                    {m.label}
                  </p>
                  <p className="text-[10px] font-mono text-muted mt-0.5">
                    ${m.inputPerM.toFixed(2)} / ${m.outputPerM.toFixed(2)} per 1M
                  </p>
                  <p className="text-[10px] text-muted/80 mt-0.5 leading-snug">
                    {m.hint}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* SLIDER: Input tokens */}
        <SliderRow
          label="Input tokens / request"
          valueText={formatInt(cfg.inputTokens)}
          min={500}
          max={8000}
          step={100}
          value={cfg.inputTokens}
          onChange={(v) => setCfg((c) => ({ ...c, inputTokens: v }))}
        />

        {/* SLIDER: Output tokens */}
        <SliderRow
          label="Output tokens / request"
          valueText={formatInt(cfg.outputTokens)}
          min={100}
          max={2000}
          step={50}
          value={cfg.outputTokens}
          onChange={(v) => setCfg((c) => ({ ...c, outputTokens: v }))}
        />

        {/* SLIDER log: Requests/ngày */}
        <div>
          <div className="flex items-baseline justify-between">
            <label className="text-[11px] font-semibold text-muted uppercase tracking-wide">
              Requests / ngày (log scale)
            </label>
            <span className="text-[12px] font-mono text-foreground">
              {formatInt(cfg.requestsPerDay)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={0.5}
            value={toLogSlider(cfg.requestsPerDay)}
            onChange={(e) =>
              setCfg((c) => ({
                ...c,
                requestsPerDay: fromLogSlider(parseFloat(e.target.value)),
              }))
            }
            className="mt-1 w-full accent-accent"
          />
          <div className="flex justify-between text-[9px] text-muted font-mono mt-0.5">
            <span>100</span>
            <span>10k</span>
            <span>1M</span>
          </div>
        </div>

        {/* SLIDER: Cache hit rate */}
        <SliderRow
          label="Cache hit rate"
          valueText={`${Math.round(cfg.cacheHitRate * 100)}%`}
          min={0}
          max={0.9}
          step={0.05}
          value={cfg.cacheHitRate}
          onChange={(v) => setCfg((c) => ({ ...c, cacheHitRate: v }))}
          hint="Cached read tính 10% giá gốc (discount 0.9×)"
        />

        {/* TOGGLES */}
        <div className="space-y-2 pt-1">
          <ToggleRow
            label="Bật model cascade (cheap-first routing)"
            checked={cfg.cascadeOn}
            onChange={(v) => setCfg((c) => ({ ...c, cascadeOn: v }))}
            hint="Giả định 70% traffic dừng ở model rẻ — $/req giảm ~40%"
          />
          <ToggleRow
            label="Context compression 30%"
            checked={cfg.compressOn}
            onChange={(v) => setCfg((c) => ({ ...c, compressOn: v }))}
            hint="Tóm tắt / nén prompt — input tokens giảm 30%"
          />
        </div>
      </div>

      {/* ─────────────── RIGHT PANEL — DERIVED ─────────────── */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div>
          <p className="text-sm font-bold text-foreground">Ước tính</p>
          <p className="text-[11px] text-muted">
            Dùng làm điểm khởi đầu — hãy xác thực bằng số đo thực tế trước khi
            báo cáo sếp.
          </p>
        </div>

        {/* BIG NUMBER — $/ngày */}
        <motion.div
          key={cfg.modelId + "-big"}
          initial={{ scale: 0.98, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="rounded-lg border border-accent/30 bg-accent/5 p-4"
        >
          <p className="text-[11px] text-muted uppercase tracking-wide font-semibold">
            Chi phí / ngày
          </p>
          <p className="text-3xl font-bold text-foreground mt-1">
            <AnimatedNumber value={result.perDay} format={formatUsd} />
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-md bg-background/60 px-2 py-1.5">
              <span className="text-muted">$/tháng · </span>
              <AnimatedNumber
                value={result.perMonth}
                format={formatUsd}
                className="font-mono text-foreground"
              />
            </div>
            <div className="rounded-md bg-background/60 px-2 py-1.5">
              <span className="text-muted">$/năm · </span>
              <AnimatedNumber
                value={result.perYear}
                format={formatUsd}
                className="font-mono text-foreground"
              />
            </div>
          </div>
          <p className="text-[10px] text-muted mt-2">
            $/request ={" "}
            <AnimatedNumber
              value={result.perReq}
              format={(n) => `$${n.toFixed(5)}`}
              className="font-mono text-foreground"
            />
          </p>
        </motion.div>

        {/* LATENCY BAR CHART */}
        <div className="rounded-lg border border-border bg-background/50 p-3">
          <div className="flex items-baseline justify-between">
            <p className="text-[11px] font-semibold text-muted uppercase tracking-wide">
              Phân rã latency (ước tính p95)
            </p>
            <p className="text-[12px] font-mono text-foreground">
              <AnimatedNumber
                value={totalLatencyMs / 1000}
                format={(n) => `${n.toFixed(2)}s`}
              />
            </p>
          </div>
          <div className="mt-2 space-y-1.5">
            {latencyBars.map((b) => {
              const pct = (b.ms / totalLatencyMs) * 100;
              return (
                <div key={b.label} className="flex items-center gap-2">
                  <span className="w-[70px] text-[10px] font-mono text-muted">
                    {b.label}
                  </span>
                  <div className="flex-1 h-3 rounded-sm bg-background overflow-hidden border border-border">
                    <motion.div
                      className="h-full"
                      style={{ background: b.color }}
                      initial={false}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.35 }}
                    />
                  </div>
                  <span className="w-14 text-right text-[10px] font-mono text-foreground">
                    {Math.round(b.ms)}ms
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* BREAK-EVEN */}
        <div className="rounded-lg border border-border bg-background/50 p-3">
          <p className="text-[11px] font-semibold text-muted uppercase tracking-wide">
            So với nhân viên lương 15tr / tháng
          </p>
          <div className="mt-2 relative h-8 rounded-sm bg-background border border-border overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-emerald-500/30"
              initial={false}
              animate={{
                width: `${Math.min(100, (humanMonthlyUsd / Math.max(result.perMonth, humanMonthlyUsd)) * 100)}%`,
              }}
              transition={{ duration: 0.35 }}
            />
            <motion.div
              className="absolute inset-y-0 left-0 bg-accent/60"
              initial={false}
              animate={{
                width: `${Math.min(100, (result.perMonth / Math.max(result.perMonth, humanMonthlyUsd)) * 100)}%`,
              }}
              transition={{ duration: 0.35 }}
              style={{ mixBlendMode: "screen" }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-[11px] font-mono text-foreground">
              <AnimatedNumber
                value={costRatio}
                format={(n) => `${n.toFixed(2)}× lương`}
              />
            </div>
          </div>
          <p className="text-[10px] text-muted mt-2 leading-snug">
            {breakEvenText}
          </p>
        </div>

        {/* SPARKLINE */}
        <div className="rounded-lg border border-border bg-background/50 p-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-muted uppercase tracking-wide">
              Cost history · {history.length}/20
            </p>
            <p className="text-[10px] font-mono text-muted">
              min {formatUsd(sparkMin)} · max {formatUsd(sparkMax)}
            </p>
          </div>
          <svg
            viewBox={`0 0 ${sparkW} ${sparkH}`}
            preserveAspectRatio="none"
            className="mt-1 w-full h-[44px]"
          >
            <polyline
              fill="none"
              stroke="#6366f1"
              strokeWidth={1.5}
              points={sparkPts}
            />
            {history.map((v, i) => {
              const x = (i / Math.max(1, history.length - 1)) * sparkW;
              const y =
                sparkH - ((v - sparkMin) / sparkRange) * sparkH;
              return <circle key={i} cx={x} cy={y} r={1.2} fill="#a5b4fc" />;
            })}
          </svg>
        </div>

        {/* QUICK READ */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${cfg.cascadeOn}-${cfg.compressOn}-${cfg.cacheHitRate}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-md border border-dashed border-border bg-background/40 px-3 py-2 text-[11px] text-muted leading-relaxed"
          >
            {cfg.cascadeOn || cfg.compressOn || cfg.cacheHitRate > 0 ? (
              <>
                Đang giảm chi phí nhờ:{" "}
                {cfg.cacheHitRate > 0 && (
                  <span className="text-foreground">
                    cache {Math.round(cfg.cacheHitRate * 100)}%
                  </span>
                )}
                {cfg.cacheHitRate > 0 && (cfg.cascadeOn || cfg.compressOn)
                  ? " · "
                  : ""}
                {cfg.cascadeOn && (
                  <span className="text-foreground">cascade</span>
                )}
                {cfg.cascadeOn && cfg.compressOn ? " · " : ""}
                {cfg.compressOn && (
                  <span className="text-foreground">compression</span>
                )}
                . Thử tắt để thấy chênh lệch.
              </>
            ) : (
              <>
                Chưa bật tối ưu nào — thử tăng cache lên 60% để thấy chi phí
                input sụt đáng kể.
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// Sub-component: slider với label + value
function SliderRow({
  label,
  valueText,
  min,
  max,
  step,
  value,
  onChange,
  hint,
}: {
  label: string;
  valueText: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="text-[11px] font-semibold text-muted uppercase tracking-wide">
          {label}
        </label>
        <span className="text-[12px] font-mono text-foreground">
          {valueText}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="mt-1 w-full accent-accent"
      />
      {hint && (
        <p className="text-[10px] text-muted/80 mt-0.5 leading-snug">{hint}</p>
      )}
    </div>
  );
}

// Sub-component: toggle
function ToggleRow({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="flex items-start gap-2 cursor-pointer select-none">
      <span
        className={`mt-0.5 inline-flex h-4 w-7 flex-none items-center rounded-full transition ${
          checked ? "bg-accent" : "bg-border"
        }`}
        aria-hidden
      >
        <motion.span
          layout
          className="h-3 w-3 rounded-full bg-background shadow"
          animate={{ x: checked ? 14 : 2 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      </span>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div>
        <span className="text-[12px] font-semibold text-foreground">
          {label}
        </span>
        {hint && (
          <p className="text-[10px] text-muted/80 leading-snug">{hint}</p>
        )}
      </div>
    </label>
  );
}

// ──────────────────────────────────────────────────────────────────────
// COMPONENT CHÍNH
// ──────────────────────────────────────────────────────────────────────

export default function CostLatencyTokensTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "Công thức $/task gần đúng cho LLM là gì? (giả sử không có cache)",
        options: [
          "$/task = số request × phí cố định / tháng",
          "$/task = (t_in × p_in + t_out × p_out) cho từng lần gọi model trong task",
          "$/task = tổng token × $0.01",
          "$/task = output tokens × p_out (input miễn phí)",
        ],
        correct: 1,
        explanation:
          "Một task thường gồm 1 hoặc nhiều lần gọi model. Với mỗi lần gọi, chi phí = input_tokens × input_price + output_tokens × output_price. $/task là tổng các lần gọi đó, cộng thêm chi phí retrieval/tool nếu có.",
      },
      {
        question:
          "Với prompt caching (Anthropic / OpenAI / Gemini), token input đã hit cache thường tính mức giá nào?",
        options: [
          "Miễn phí hoàn toàn",
          "Khoảng 10% giá gốc (discount 0.9×)",
          "Bằng giá output",
          "Gấp đôi vì phải lưu trữ",
        ],
        correct: 1,
        explanation:
          "Các nhà cung cấp hiện tính cached input ở mức ~10% giá chuẩn. Công thức tổng quát: giá hiệu dụng = p_in × (1 − r × d) với r = cache hit rate, d = discount (~0.9). Đó là lý do prompt caching có thể giảm 70-90% chi phí input cho system prompt dài.",
      },
      {
        question:
          "TTFT (time-to-first-token) khác gì với thời gian decode?",
        options: [
          "TTFT là prompt processing trước khi ra token đầu; decode là thời gian sinh từng token sau đó",
          "Hai khái niệm giống nhau",
          "TTFT chỉ có trên batch API, decode chỉ có trên streaming",
          "TTFT = total latency − decode",
        ],
        correct: 0,
        explanation:
          "TTFT bao gồm network, prompt tokenization, attention pass qua toàn bộ input (chi phí input-length-quadratic). Decode là vòng lặp sinh token, phụ thuộc tốc độ tokens/s và độ dài output. Tối ưu hai phần khác nhau: TTFT giảm nhờ KV cache + prompt caching; decode giảm nhờ chọn model nhanh, speculative decoding.",
      },
      {
        question:
          "Model cascade (Haiku → Sonnet → Opus) giảm chi phí chủ yếu nhờ đâu?",
        options: [
          "Vì model to luôn sai, phải dùng model nhỏ",
          "Vì 70-90% traffic có thể hoàn thành ở model rẻ; chỉ những case khó mới escalate, nhờ vậy $/req trung bình giảm đáng kể",
          "Vì caching tự động",
          "Vì giảm latency",
        ],
        correct: 1,
        explanation:
          "Ý tưởng cascade: thử model rẻ trước, đánh giá tự tin (confidence, rubric, heuristic), chỉ escalate khi cần. Nếu 80% dừng ở Haiku, 15% lên Sonnet, 5% lên Opus, chi phí trung bình xuống hẳn — thường 60-80% rẻ hơn chạy Opus cho mọi request.",
      },
      {
        question:
          "Bạn có bill $10,000/tháng cho LLM. 70% là input tokens, 30% là output. Đòn bẩy đầu tiên nên thử là gì?",
        options: [
          "Giảm output tokens bằng prompt 'trả lời ngắn'",
          "Bật prompt caching cho system prompt và tài liệu context thường lặp — giải quyết phần input 70%",
          "Chuyển sang nhà cung cấp rẻ nhất",
          "Tăng temperature để giảm tokens",
        ],
        correct: 1,
        explanation:
          "Quy tắc Pareto: chi phí nằm ở đâu, tối ưu ở đó. 70% là input → prompt caching có tác động trực tiếp và lớn. Đổi nhà cung cấp là biến pháp cuối (rủi ro quality regression), còn nén output chỉ tác động 30% phần bill.",
      },
      {
        question:
          "p95 latency của agent là 8s, user complain. Bạn đo thấy 60% latency là decode, 15% TTFT, 15% tool calls, 10% retrieval. Chiến thuật hợp lý nhất?",
        options: [
          "Tăng cache hit rate lên 90%",
          "Chuyển sang model nhanh hơn ở bước decode (haiku, mini) hoặc giảm output tokens — vì decode đang là phần chiếm 60% tổng thời gian",
          "Xoá tool calls",
          "Nâng CPU server",
        ],
        correct: 1,
        explanation:
          "60% ở decode nghĩa là model đang sinh output quá dài/chậm. Hai đòn bẩy: (a) chuyển sang model có tokens/s cao hơn (haiku, mini), (b) cắt output tokens (structured output ngắn, chunking). Tăng cache chỉ tác động 10% phần retrieval — đòn bẩy sai mức.",
      },
      {
        type: "fill-blank" as const,
        question:
          "Giá model thường được niêm yết theo đơn vị {blank} triệu token. Ví dụ gpt-4o có giá input $2.50 / 1M và output {blank} / 1M, nghĩa là 1 task 2k input + 500 output tốn ≈ $0.01.",
        blanks: [
          {
            answer: "1",
            accept: ["một", "1M", "mỗi"],
          },
          {
            answer: "$10",
            accept: ["10", "$10.00", "10 USD", "$10/1M"],
          },
        ],
        explanation:
          "Bảng giá chuẩn hiện nay tính theo USD / 1M token (trước 2024 thì tính / 1K). Luôn convert về $/task để hiểu tác động business — $10/1M output nghe rẻ, nhưng 50k request/ngày × 500 output tokens ≈ 25M token × $10 = $250/ngày.",
      },
      {
        type: "fill-blank" as const,
        question:
          "Break-even: chatbot tốn $4.500/tháng có chi phí tương đương khoảng {blank} nhân viên CSKH Việt Nam (lương 15 triệu VND, tỷ giá 25k) — nhưng nếu sau tối ưu còn $900/tháng thì còn {blank} nhân viên.",
        blanks: [
          {
            answer: "7.5",
            accept: ["7", "7-8", "~7.5", "7.5 nhân viên"],
          },
          {
            answer: "1.5",
            accept: ["1", "1-2", "~1.5", "1.5 nhân viên"],
          },
        ],
        explanation:
          "15 triệu VND ≈ $600. $4.500 / $600 ≈ 7.5 người; $900 / $600 = 1.5. Biến $/tháng thành 'đơn vị nhân viên' là cách nhanh nhất để sếp hình dung — đừng chỉ đưa con số USD trần trụi.",
      },
    ],
    [],
  );

  return (
    <>
      {/* ───────── 1. DỰ ĐOÁN ───────── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="CEO hỏi: 'Chatbot hỗ trợ khách hàng tốn bao nhiêu một tháng?' Bạn nên trả lời dựa trên số nào để vừa đúng, vừa an toàn cho quyết định?"
          options={[
            "Tổng số token / tháng — vì token là thứ chúng ta trả tiền",
            "$/request — vì đó là đơn vị atomic",
            "$/task × số task × margin buffer 30% — gắn thẳng với business, cộng đệm cho biến động",
            "Tổng hóa đơn API tháng trước — đã là fact rồi, không cần đoán",
          ]}
          correct={2}
          explanation="Token là đơn vị kỹ thuật, không phải đơn vị business. $/request quá chi tiết, mất hình dung. Hóa đơn tháng trước là lịch sử, không giúp dự báo. Công thức đúng cho dự báo là $/task × volume × buffer — business hiểu ngay, và buffer bảo vệ bạn khỏi spike + prompt length drift."
        >
          <p className="text-sm text-muted mt-2">
            Câu trả lời hay nhất cho sếp luôn là con số gắn với đơn vị tác vụ
            (task) — không phải token. Bài học hôm nay giúp bạn đi đúng 5 bước
            từ token đến $/task, và chỉ ra chính xác đòn bẩy nào đáng kéo.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ───────── 2. VISUALIZATION ───────── */}
      <LessonSection
        step={2}
        totalSteps={TOTAL_STEPS}
        label="Token Economy Calculator"
      >
        <p className="mb-3 text-sm text-muted leading-relaxed">
          Trước khi vào lý thuyết, hãy <strong>tự kéo slider</strong>. Chọn
          model, set input/output tokens, đẩy cache hit rate, bật cascade. Quan
          sát $/ngày, phân rã latency, và vạch break-even với lương nhân viên
          thật sự chuyển động.
        </p>

        <VisualizationSection>
          <TokenCalculator />
          <Callout variant="tip" title="Thử nghiệm có chủ đích">
            Bắt đầu với cấu hình mặc định (gpt-4o, 2k in / 500 out, 50k
            req/ngày, cache 0%). Ghi nhớ con số $/tháng. Sau đó: (1) bật cache
            60%, (2) bật cascade, (3) đổi sang gpt-4o-mini. Mỗi bước bạn tiết
            kiệm bao nhiêu % so với baseline?
          </Callout>
        </VisualizationSection>
      </LessonSection>

      {/* ───────── 3. AHA ───────── */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          <p>
            Token là đơn vị tính tiền kỹ thuật. Nhưng{" "}
            <strong>business mới cần biết $/task hoặc $/user</strong>. Giữa hai
            đó có <strong>5 bước chuyển đổi</strong>: token → $/call → $/task →
            $/user-session → $/ngày → $/tháng. Mỗi bước có đòn bẩy tối ưu
            riêng. Nếu chỉ nhìn &quot;tổng token&quot; bạn sẽ bỏ qua 4 điểm can
            thiệp có giá trị.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ───────── 4. CALLOUTS ───────── */}
      <LessonSection
        step={4}
        totalSteps={TOTAL_STEPS}
        label="Bốn lưu ý quan trọng"
      >
        <div className="space-y-3">
          <Callout variant="tip" title="Prompt caching: đòn bẩy lớn nhất cho input-heavy workload">
            Claude, OpenAI, và Gemini đều hỗ trợ prompt caching với cấu trúc
            tương đồng: hash prefix của prompt, tái sử dụng KV cache trong vài
            phút, tính cached input ở <strong>~10% giá gốc</strong>. Với system
            prompt 5k token + tool schema 2k token, cache hit rate thường đạt
            80-95% trong production steady-state → giảm{" "}
            <strong>70-90% chi phí input</strong>. Đây là lever đầu tiên nên
            bật — không đánh đổi chất lượng, chỉ đánh đổi một chút phức tạp
            trong thiết kế prompt.
          </Callout>

          <Callout variant="warning" title="Đừng tối ưu cost sớm — đo trước">
            Công thức <em>&quot;làm cái này sẽ giảm 40% cost&quot;</em> nghe
            hấp dẫn, nhưng không nghĩa lý gì nếu chưa biết baseline. Quy trình
            đúng: (1) đặt observability đếm tokens + $ per request, (2) chạy 2
            tuần lấy phân phối, (3) tìm tail nặng nhất (90th percentile request
            thường ngốn 3-5× cost trung bình), (4) tối ưu đúng tail đó. Và
            trong mọi thay đổi, <strong>task success rate không được sụt</strong>
            — nếu giảm cost 50% nhưng fail rate tăng 3%, đó không phải là
            thắng lợi.
          </Callout>

          <Callout variant="info" title="Model cascade: chi phí kỳ vọng, không phải chi phí tối đa">
            Thay vì dùng Opus cho tất cả, hãy xếp tầng: Haiku → Sonnet → Opus.
            Mỗi tier có một gate quyết định có escalate hay không (confidence
            score, rubric pass, LLM-as-judge nhỏ, hoặc rule-based). Nếu phân
            phối thực là 80% dừng ở Haiku, 15% ở Sonnet, 5% ở Opus, chi phí
            trung bình ≈ 0.8×$1 + 0.15×$3 + 0.05×$15 = $2.0/1M — so với
            $15/1M nếu chạy Opus thuần, đó là <strong>giảm ~87%</strong>.
            Thiết kế gate tốt (fail-closed về tier cao khi không chắc) quan
            trọng hơn tối ưu prompt ở từng tier.
          </Callout>

          <Callout variant="insight" title="Latency không chỉ là decode — tool call mới là vết nứt ngầm">
            Trong một agent điển hình, decode là 30-40% p95. Tool call tuần tự
            (sequential HTTP, DB queries, vendor APIs) có thể là{" "}
            <strong>40-60%</strong> — mỗi tool 200-500ms, chuỗi 4-5 tool dễ
            vượt ngưỡng 2s. Hai đòn bẩy: (a) parallel tool calls khi các tool
            độc lập, (b) tool caching (cache kết quả ổn định như&nbsp;
            <code>get_user_profile</code> trong 1-5 phút). Đừng tối ưu model
            khi nút cổ chai nằm ở tool graph.
          </Callout>
        </div>
      </LessonSection>

      {/* ───────── 5. INLINE CHALLENGES ───────── */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <div className="space-y-4">
          <InlineChallenge
            question="Bill LLM của bạn $10k/tháng. Breakdown: 70% input tokens, 30% output. Chiến thuật nào đáng ưu tiên đầu tiên?"
            options={[
              "Viết prompt ngắn hơn để giảm output",
              "Bật prompt caching — chi phí chủ yếu nằm ở input; caching đánh vào đúng phần 70% với rủi ro thấp nhất",
              "Chuyển hết sang nhà cung cấp rẻ nhất",
              "Chuyển sang batch API",
            ]}
            correct={1}
            explanation="Nguyên tắc: tối ưu ở đâu có nhiều tiền nhất. 70% ở input → prompt caching là lever chính xác. Đổi nhà cung cấp có rủi ro quality regression; cắt output chỉ tác động 30% bill; batch API giúp job async chứ không phải real-time."
          />

          <InlineChallenge
            question="p95 latency = 8s, user phàn nàn. Bạn phân rã: 60% decode, 15% TTFT, 15% tool calls, 10% retrieval. Bước đi đúng?"
            options={[
              "Tăng cache hit rate lên 90%",
              "Giảm output tokens (structured output ngắn gọn) + đổi sang model có decode tps cao hơn (haiku/mini) — đánh đúng vào 60%",
              "Parallelize tool calls",
              "Thêm CDN cho retrieval",
            ]}
            correct={1}
            explanation="60% nằm ở decode — đòn bẩy đầu tiên phải là cắt output hoặc tăng tokens/s. Cache tác động retrieval (10%) nên không đủ mạnh. Parallelize tool đúng nhưng chỉ đánh 15%. Nguyên tắc: tối ưu theo khối to nhất trong breakdown."
          />
        </div>
      </LessonSection>

      {/* ───────── 6. EXPLANATION ───────── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Kinh tế token</strong> là khung tư duy biến đơn vị kỹ thuật
            (token) thành đơn vị quyết định (chi phí / tác vụ, độ trễ, break-even
            so với nhân công). Trong production, bạn cần ba phương trình: công
            thức chi phí, công thức độ trễ, và công thức chi phí kỳ vọng khi có
            cascade.
          </p>

          <p>Công thức chi phí cho một task (một lần gọi model):</p>
          <p className="text-center">
            <LaTeX>
              {"C = N \\cdot \\left( t_{in} \\cdot p_{in} \\cdot (1 - r \\cdot d) + t_{out} \\cdot p_{out} \\right)"}
            </LaTeX>
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <code>N</code>: số lần gọi model trong một task (1 với chatbot
              đơn giản, 5-20 với agent).
            </li>
            <li>
              <code>t_in</code>, <code>t_out</code>: input và output tokens
              trung bình mỗi lần gọi.
            </li>
            <li>
              <code>p_in</code>, <code>p_out</code>: giá USD / token (tính từ
              bảng giá <strong>$/1M ÷ 1,000,000</strong>).
            </li>
            <li>
              <code>r</code>: cache hit rate (0..1); <code>d</code>: discount
              factor cho cached input (thường 0.9 — tức cached tính 10%).
            </li>
          </ul>

          <p className="mt-3">Phân rã độ trễ (latency):</p>
          <p className="text-center">
            <LaTeX>
              {"L = \\mathrm{TTFT} + \\frac{t_{out}}{R_{decode}} + L_{retrieval} + L_{tools}"}
            </LaTeX>
          </p>
          <p className="text-sm">
            <code>TTFT</code> là thời gian từ gửi request đến token đầu tiên —
            phụ thuộc network, prompt length, và prompt caching.{" "}
            <code>R_decode</code> là tốc độ sinh token (tokens/s) đặc trưng cho
            từng model. <code>L_retrieval</code> gồm vector search / rerank /
            reading file. <code>L_tools</code> là tổng thời gian các tool call
            (tuần tự hoặc song song). Phần nào lớn nhất chính là nơi bạn nên
            tối ưu trước — xem{" "}
            <TopicLink slug="kv-cache">KV cache</TopicLink> và{" "}
            <TopicLink slug="inference-optimization">inference
            optimization</TopicLink> để đi sâu.
          </p>

          <p className="mt-3">
            Với model cascade (cheap-first routing), chi phí{" "}
            <em>kỳ vọng</em> trên toàn phân phối traffic:
          </p>
          <p className="text-center">
            <LaTeX>
              {"E[C] = \\sum_{k} P(\\text{routed to model } k) \\cdot C_k"}
            </LaTeX>
          </p>
          <p className="text-sm">
            Thiết kế gate (quyết định có escalate không) quan trọng: gate quá
            lỏng → nhiều câu khó vẫn dừng ở tier rẻ → quality sụt; gate quá
            chặt → không ai đi qua tier rẻ → tiết kiệm không có. Calibrate
            bằng A/B trên một subset thật.
          </p>

          <CodeBlock language="python" title="token_budget.py — đo + cảnh báo khi vượt 80%">
            {`from dataclasses import dataclass
from typing import Callable

@dataclass
class TokenBudget:
    """Theo dõi token usage theo task. Emit metric + cảnh báo khi vượt 80%."""
    task_id: str
    max_input: int
    max_output: int
    emit_metric: Callable[[str, float, dict], None]

    used_input: int = 0
    used_output: int = 0

    def record(self, in_tok: int, out_tok: int) -> None:
        self.used_input += in_tok
        self.used_output += out_tok
        # Gửi metric realtime — dashboard \\$/task dựng trên metric này.
        self.emit_metric(
            "llm.tokens.used",
            in_tok + out_tok,
            {"task": self.task_id, "kind": "total"},
        )
        self._warn_if_over_budget()

    def _warn_if_over_budget(self) -> None:
        in_pct = self.used_input / max(1, self.max_input)
        out_pct = self.used_output / max(1, self.max_output)
        if max(in_pct, out_pct) >= 0.8:
            self.emit_metric(
                "llm.budget.warning",
                max(in_pct, out_pct),
                {"task": self.task_id},
            )

    def cost_usd(self, p_in_per_m: float, p_out_per_m: float,
                 cache_hit: float = 0.0, discount: float = 0.9) -> float:
        eff_in = (p_in_per_m / 1_000_000) * (1 - cache_hit * discount)
        eff_out = p_out_per_m / 1_000_000
        return self.used_input * eff_in + self.used_output * eff_out`}
          </CodeBlock>

          <CodeBlock language="typescript" title="token-meter.ts — middleware đo tokens / request">
            {`import type { NextRequest, NextResponse } from "next/server";

interface Usage {
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
  model: string;
  latencyMs: number;
}

// Middleware bọc tầng gọi LLM. Mỗi request emit đúng một record usage.
export async function withTokenMeter<T>(
  req: NextRequest,
  run: () => Promise<{ result: T; usage: Usage }>,
  sink: (u: Usage & { route: string; userId?: string }) => void,
): Promise<T> {
  const started = performance.now();
  const { result, usage } = await run();
  const latencyMs = performance.now() - started;

  // Báo về observability (Datadog, Honeycomb, OTLP...) — một record / request.
  sink({
    ...usage,
    latencyMs,
    route: req.nextUrl.pathname,
    userId: req.headers.get("x-user-id") ?? undefined,
  });

  return result;
}

// Dashboard dùng dữ liệu này để tính $/task realtime:
// SELECT route, SUM(input_tokens * p_in + output_tokens * p_out) / COUNT(DISTINCT task_id)
// FROM llm_usage WHERE ts > now() - interval '1 hour' GROUP BY route;`}
          </CodeBlock>

          <CollapsibleDetail title="Prompt caching — cơ chế hash + hit rate trong thực tế">
            <p className="text-sm">
              Các nhà cung cấp (Anthropic, OpenAI, Gemini) đều hash prefix của
              prompt — thường là system prompt + tool schema + tài liệu
              reference — và cache KV states của prefix đó trong 5-10 phút.
              Lần request tiếp theo có cùng prefix sẽ trả cached input price
              (~10% giá chuẩn).
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 pl-2 mt-2">
              <li>
                <strong>Cache bị invalidate</strong> khi bạn sửa 1 ký tự ở
                prefix — kể cả whitespace. Giữ prefix ổn định là quan trọng
                hơn tối ưu wording.
              </li>
              <li>
                <strong>Hit rate trong production steady-state</strong>: 80-95%
                là bình thường nếu traffic liên tục và prefix ổn định. Dưới
                50% thường do prefix đổi quá thường (dynamic timestamps, user
                data chèn vào đầu).
              </li>
              <li>
                <strong>Cold start</strong>: lần đầu trong 10 phút trả full
                price. Chi phí build cache = 1.25× giá gốc (có nơi tính break-even
                sau 2 hit). Do đó cache chỉ hiệu quả khi có traffic đều.
              </li>
              <li>
                <strong>Kỹ thuật thiết kế</strong>: đẩy mọi phần dynamic
                xuống cuối prompt; phần ổn định (system, tool schema, sample
                data) lên đầu. Mỗi 1k token prefix ổn định thêm vào có thể
                giúp hit rate tăng ~5% nhờ tăng lợi ích việc cache.
              </li>
            </ul>
          </CollapsibleDetail>

          <CollapsibleDetail title="Distillation vs compression vs cascade — 3 con đường giảm cost có trade-off khác nhau">
            <p className="text-sm">
              Ba hướng cùng mục tiêu &quot;giảm cost&quot;, nhưng đánh đổi
              khác nhau:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 pl-2 mt-2">
              <li>
                <strong>Distillation</strong>: train model nhỏ bắt chước model
                lớn trên task cụ thể. Đầu tư lớn (data + training), nhưng một
                khi có rồi thì giá inference rất thấp và ổn định. Phù hợp
                workload cố định, lặp nhiều (extract entity, classify).
              </li>
              <li>
                <strong>Context compression</strong>: tóm tắt history sau N
                turn, giữ lại chỉ phần quan trọng. Giảm input tokens ngay lập
                tức (20-40%), không cần training. Rủi ro: mất thông tin →
                quality sụt. Best practice: tóm tắt bằng LLM khác, lưu thread
                history đầy đủ song song phòng cần roll-back.
              </li>
              <li>
                <strong>Cascade</strong>: không đổi model, chỉ thêm lớp
                routing. Dễ triển khai, dễ rollback. Rủi ro lớn nhất là gate
                calibration — gate sai khiến phần lớn traffic vẫn lên tier
                đắt, hoặc tệ hơn, quality degradation vì dừng quá sớm ở tier
                rẻ.
              </li>
            </ul>
            <p className="text-sm mt-3">
              Quy trình thực tế: <strong>caching trước</strong> (zero
              trade-off, chỉ cần kỹ thuật), <strong>cascade tiếp</strong> (đánh
              đổi phức tạp routing), <strong>compression song song</strong>, và
              chỉ cân nhắc <strong>distillation</strong> khi volume đủ lớn (thường
              &gt; 100M token/tháng cùng task).
            </p>
          </CollapsibleDetail>

          <p className="text-sm mt-3">
            Để theo dõi những con số này realtime, bạn cần tầng quan sát phù
            hợp — xem{" "}
            <TopicLink slug="observability-for-ai">
              observability for AI
            </TopicLink>
            . Kết hợp ba topic này (token economics + inference optimization +
            observability) là nền tảng cost discipline cho LLM production.
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ───────── 7. CASE STUDY ───────── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Case study — MoMo chatbot CSKH">
        <div className="rounded-xl border border-border bg-card p-4 text-sm space-y-3">
          <p>
            <strong className="text-foreground">Bối cảnh.</strong> Một đội ở
            MoMo triển khai chatbot hỗ trợ CSKH: tra đơn, hủy giao dịch, hướng
            dẫn liên kết thẻ. Volume: ~180k conversation/ngày, mỗi
            conversation trung bình 4 turn, dùng gpt-4o-full cho toàn bộ.
          </p>
          <p>
            <strong className="text-foreground">Trước khi đo.</strong> Team
            nghĩ tốn &quot;khoảng vài nghìn đô&quot;. Không có dashboard
            $/task, không có alert khi spike. Cuối tháng hóa đơn về:{" "}
            <strong>$18.000</strong> — gần bằng 30 nhân viên CSKH. Sếp hỏi tại
            sao, không ai trả lời chắc.
          </p>
          <p>
            <strong className="text-foreground">Đo trước, tối ưu sau.</strong>{" "}
            Tuần 1-2: chỉ thêm observability. Kết quả phân rã:
          </p>
          <ul className="list-disc list-inside pl-2 space-y-1">
            <li>
              72% cost ở input tokens (system prompt 3.2k + FAQ 4k + lịch sử
              hội thoại).
            </li>
            <li>
              28% ở output. Trong output, 30% là câu trả lời đơn giản
              (yes/no/status).
            </li>
            <li>
              p95 latency 6.4s — decode 55%, TTFT 20%, tool 15%, retrieval
              10%.
            </li>
          </ul>
          <p>
            <strong className="text-foreground">Ba can thiệp.</strong>
          </p>
          <ol className="list-decimal list-inside pl-2 space-y-1">
            <li>
              <strong>Prompt caching</strong> cho system prompt + FAQ: hit
              rate steady-state đạt 88% → input cost giảm ~79%.
            </li>
            <li>
              <strong>Cascade</strong> gpt-4o-mini → gpt-4o-full: gate là một
              classifier nhỏ kiểm intent. 73% traffic (status, FAQ đơn giản)
              dừng ở mini; 27% khó (policy edge, refund) lên full. $/req
              giảm thêm ~45%.
            </li>
            <li>
              <strong>Tóm tắt context &gt; 5 turn</strong>: history dài tóm
              thành 300 token thay vì gửi full 2-3k token. Input tiếp tục
              giảm 15% ở phần variable.
            </li>
          </ol>
          <p>
            <strong className="text-foreground">Kết quả sau 4 tuần.</strong>{" "}
            Hóa đơn: <strong>$4.200/tháng</strong> (giảm 77%). CSAT không
            đổi (lấy từ 2k rating sampling mỗi tuần). p95 latency: 3.8s
            (nhờ mini nhanh hơn cho 73% traffic). Dashboard $/task realtime
            thay cho &quot;đoán cuối tháng&quot;; alert khi spike &gt; 20% so
            với baseline 7 ngày.
          </p>
          <p>
            <strong className="text-foreground">Bài học.</strong> Thứ tự
            đúng: <em>đo → tìm Pareto → tối ưu đúng chỗ → theo dõi CSAT</em>.
            Nếu team đi thẳng vào &quot;đổi model rẻ hơn&quot; từ đầu, khả
            năng cao CSAT tụt rồi phải rollback — mất cả tiền và niềm tin
            của sếp vào AI team.
          </p>
        </div>
      </LessonSection>

      {/* ───────── 8. MINI SUMMARY ───────── */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về kinh tế token"
          points={[
            "Đơn vị tính tiền là token, nhưng đơn vị quyết định phải là $/task hoặc $/user — có 5 bước chuyển đổi giữa hai đó.",
            "Luôn đo trước khi tối ưu: observability tokens/request + dashboard $/task realtime là tiền đề, không phải bonus.",
            "Latency có 4 thành phần (TTFT + decode + retrieval + tool) — tối ưu theo khối to nhất, không theo khối dễ nhất.",
            "Prompt caching là đòn bẩy lớn nhất, rủi ro thấp nhất — tiết kiệm 70-90% chi phí input cho system prompt dài.",
            "Model cascade (Haiku → Sonnet → Opus) tính chi phí kỳ vọng, không chi phí tối đa — gate calibration là phần khó nhất.",
            "Break-even với human baseline (15tr VND/tháng ≈ $600) là cách nhanh nhất giúp sếp hiểu giá trị đầu tư — đừng chỉ đưa con số USD trần trụi.",
          ]}
        />
      </LessonSection>

      {/* ───────── 9. QUIZ ───────── */}
      <LessonSection step={9} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
