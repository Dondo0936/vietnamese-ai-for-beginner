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
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "llm-evaluation",
  title: "LLM Evaluation",
  titleVi: "Đánh giá LLM — Đo chất lượng trước và sau khi deploy",
  description:
    "Khung đánh giá LLM toàn diện: offline (golden set, LLM-as-judge, human eval) + online (shadow traffic, A/B, drift detection) — điều kiện tiên quyết để đưa LLM vào production một cách có trách nhiệm.",
  category: "ai-safety",
  tags: ["evaluation", "llm-as-judge", "benchmark", "production"],
  difficulty: "advanced",
  relatedSlugs: [
    "agent-evaluation",
    "rag-evaluation",
    "hallucination",
    "guardrails",
    "red-teaming",
  ],
  vizType: "interactive",
};

// ──────────────────────────────────────────────────────────────────────
// DỮ LIỆU: 4 mô hình × 7 metric × 2 regime (offline / online)
// Số liệu được hard-code thực tế-tương-đối; mục đích là kể câu chuyện
// "offline ≠ online" — chứ không phải leaderboard thật.
// ──────────────────────────────────────────────────────────────────────

type ModelId = "gpt-4o" | "claude-sonnet-4-6" | "gemini-2-5-pro" | "llama-3-3-70b";
type Regime = "offline" | "online";
type MetricKey =
  | "taskSuccess"
  | "winRate"
  | "hallucinationRate"
  | "factuality"
  | "formatCompliance"
  | "refusalRate"
  | "costPerTask";

interface Metric {
  key: MetricKey;
  label: string;
  shortLabel: string;
  unit: string;
  higherIsBetter: boolean;
  tooltip: string;
}

const METRICS: Metric[] = [
  {
    key: "taskSuccess",
    label: "Task Success",
    shortLabel: "Task",
    unit: "%",
    higherIsBetter: true,
    tooltip:
      "Tỷ lệ mẫu model đáp ứng đầy đủ yêu cầu theo rubric — chấm tự động hoặc bởi judge. Đây là metric cơ bản nhất.",
  },
  {
    key: "winRate",
    label: "Win-rate (pairwise)",
    shortLabel: "Win",
    unit: "%",
    higherIsBetter: true,
    tooltip:
      "Trong so sánh cặp A vs B, tỷ lệ model thắng. Tổng hợp thường dùng thang Elo hoặc Bradley-Terry.",
  },
  {
    key: "hallucinationRate",
    label: "Hallucination Rate",
    shortLabel: "Halluc",
    unit: "%",
    higherIsBetter: false,
    tooltip:
      "Tỷ lệ phát biểu bịa hoặc không có cơ sở trong context. Đo bằng citation-check + LLM-as-judge đối chứng.",
  },
  {
    key: "factuality",
    label: "Factuality",
    shortLabel: "Fact",
    unit: "%",
    higherIsBetter: true,
    tooltip:
      "Mức độ trùng khớp giữa claim của model với nguồn tham chiếu (TruthfulQA, FactScore). Khác với hallucination: factuality đo sự đúng, hallucination đo sự bịa.",
  },
  {
    key: "formatCompliance",
    label: "Format Compliance",
    shortLabel: "Format",
    unit: "%",
    higherIsBetter: true,
    tooltip:
      "Output có đúng cấu trúc yêu cầu không (JSON schema, markdown, số lượng bullet). Yếu tố quyết định khi pipeline hạ lưu parse kết quả.",
  },
  {
    key: "refusalRate",
    label: "Refusal Rate",
    shortLabel: "Refuse",
    unit: "%",
    higherIsBetter: false,
    tooltip:
      "Tỷ lệ model từ chối yêu cầu hợp lệ vì over-align. Quá cao = mô hình ngại việc, quá thấp = có thể mất lớp an toàn.",
  },
  {
    key: "costPerTask",
    label: "Cost / task",
    shortLabel: "Cost",
    unit: "$",
    higherIsBetter: false,
    tooltip:
      "Chi phí token trung bình mỗi tác vụ. Đơn vị so sánh nên là $/task, không phải $/1K-token — vì mô hình dài dòng bị phạt đúng chỗ.",
  },
];

interface Model {
  id: ModelId;
  label: string;
  vendor: string;
}

const MODELS: Model[] = [
  { id: "gpt-4o", label: "GPT-4o", vendor: "OpenAI" },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", vendor: "Anthropic" },
  { id: "gemini-2-5-pro", label: "Gemini 2.5 Pro", vendor: "Google" },
  { id: "llama-3-3-70b", label: "Llama 3.3 70B", vendor: "Meta" },
];

type ScoreRow = Record<MetricKey, number>;
type ScoreTable = Record<ModelId, Record<Regime, ScoreRow>>;

// Con số thực tế-tương-đối. Đơn vị:
//   %: 0..100
//   $: USD (cost per task)
// Key design: offline ≠ online. Đa số model giảm 4-12 điểm khi ra prod.
const SCORES: ScoreTable = {
  "gpt-4o": {
    offline: {
      taskSuccess: 88,
      winRate: 62,
      hallucinationRate: 4.2,
      factuality: 91,
      formatCompliance: 94,
      refusalRate: 3.1,
      costPerTask: 0.021,
    },
    online: {
      taskSuccess: 81,
      winRate: 58,
      hallucinationRate: 7.8,
      factuality: 85,
      formatCompliance: 89,
      refusalRate: 5.9,
      costPerTask: 0.028,
    },
  },
  "claude-sonnet-4-6": {
    offline: {
      taskSuccess: 90,
      winRate: 66,
      hallucinationRate: 2.8,
      factuality: 93,
      formatCompliance: 96,
      refusalRate: 4.4,
      costPerTask: 0.018,
    },
    online: {
      taskSuccess: 86,
      winRate: 63,
      hallucinationRate: 4.1,
      factuality: 90,
      formatCompliance: 93,
      refusalRate: 6.2,
      costPerTask: 0.022,
    },
  },
  "gemini-2-5-pro": {
    offline: {
      taskSuccess: 85,
      winRate: 55,
      hallucinationRate: 5.1,
      factuality: 88,
      formatCompliance: 92,
      refusalRate: 2.6,
      costPerTask: 0.014,
    },
    online: {
      taskSuccess: 77,
      winRate: 49,
      hallucinationRate: 9.4,
      factuality: 82,
      formatCompliance: 84,
      refusalRate: 4.7,
      costPerTask: 0.019,
    },
  },
  "llama-3-3-70b": {
    offline: {
      taskSuccess: 79,
      winRate: 45,
      hallucinationRate: 6.7,
      factuality: 83,
      formatCompliance: 88,
      refusalRate: 2.1,
      costPerTask: 0.006,
    },
    online: {
      taskSuccess: 70,
      winRate: 41,
      hallucinationRate: 12.5,
      factuality: 76,
      formatCompliance: 79,
      refusalRate: 3.3,
      costPerTask: 0.008,
    },
  },
};

// Trọng số mặc định từ spec: 0.25, 0.15, 0.20, 0.15, 0.10, 0.05, 0.10.
// Thứ tự tương ứng với METRICS.
const DEFAULT_WEIGHTS: Record<MetricKey, number> = {
  taskSuccess: 0.25,
  winRate: 0.15,
  hallucinationRate: 0.2,
  factuality: 0.15,
  formatCompliance: 0.1,
  refusalRate: 0.05,
  costPerTask: 0.1,
};

// Chuẩn hoá một ô điểm về [0,1] để tính composite.
// - "%" higher-is-better: value / 100
// - "%" lower-is-better (hallucination, refusal): 1 − value/100
// - "$" cost: 1 − min(value / 0.05, 1)  (0.05$ là mốc "đắt")
function normalise(metric: Metric, raw: number): number {
  if (metric.unit === "$") {
    return Math.max(0, Math.min(1, 1 - raw / 0.05));
  }
  if (metric.higherIsBetter) {
    return Math.max(0, Math.min(1, raw / 100));
  }
  return Math.max(0, Math.min(1, 1 - raw / 100));
}

// Màu sắc ô: xanh / vàng / đỏ dựa trên giá trị đã chuẩn hoá.
function cellTone(norm: number): {
  bg: string;
  text: string;
  label: "good" | "mid" | "bad";
} {
  if (norm >= 0.75)
    return {
      bg: "bg-emerald-500/15 border-emerald-500/40",
      text: "text-emerald-400",
      label: "good",
    };
  if (norm >= 0.55)
    return {
      bg: "bg-amber-500/15 border-amber-500/40",
      text: "text-amber-400",
      label: "mid",
    };
  return {
    bg: "bg-red-500/15 border-red-500/40",
    text: "text-red-400",
    label: "bad",
  };
}

// Format raw value theo đơn vị.
function formatValue(metric: Metric, raw: number): string {
  if (metric.unit === "$") return `$${raw.toFixed(3)}`;
  return `${raw.toFixed(1)}%`;
}

const TOTAL_STEPS = 9;

// ──────────────────────────────────────────────────────────────────────
// COMPONENT CHÍNH
// ──────────────────────────────────────────────────────────────────────

export default function LlmEvaluationTopic() {
  // Mặc định chọn 2 flagship + 1 open-source để có 3 row ngay từ đầu.
  const [selected, setSelected] = useState<Set<ModelId>>(
    new Set<ModelId>(["gpt-4o", "claude-sonnet-4-6", "llama-3-3-70b"]),
  );
  const [regime, setRegime] = useState<Regime>("offline");
  const [weights, setWeights] =
    useState<Record<MetricKey, number>>(DEFAULT_WEIGHTS);
  const [hoverMetric, setHoverMetric] = useState<MetricKey | null>(null);

  const toggleModel = useCallback((id: ModelId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        // Không cho xoá hết — cần ít nhất 1 row để viz có nghĩa.
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const setWeight = useCallback((k: MetricKey, v: number) => {
    setWeights((prev) => ({ ...prev, [k]: v }));
  }, []);

  const resetWeights = useCallback(
    () => setWeights(DEFAULT_WEIGHTS),
    [],
  );

  // Tổng trọng số — hiển thị để người học thấy khi vượt/hụt 1.0.
  const weightSum = useMemo(
    () =>
      Object.values(weights).reduce((s, v) => s + v, 0),
    [weights],
  );

  // Chuẩn hoá trọng số để composite không phụ thuộc tổng.
  const normWeights = useMemo(() => {
    const s = weightSum || 1;
    const out = {} as Record<MetricKey, number>;
    (Object.keys(weights) as MetricKey[]).forEach((k) => {
      out[k] = weights[k] / s;
    });
    return out;
  }, [weights, weightSum]);

  // Composite score cho mỗi model selected + sort giảm dần.
  const leaderboard = useMemo(() => {
    const rows: Array<{
      model: Model;
      scores: ScoreRow;
      composite: number;
    }> = [];
    MODELS.filter((m) => selected.has(m.id)).forEach((m) => {
      const row = SCORES[m.id][regime];
      let composite = 0;
      for (const metric of METRICS) {
        composite += normWeights[metric.key] * normalise(metric, row[metric.key]);
      }
      rows.push({ model: m, scores: row, composite });
    });
    return rows.sort((a, b) => b.composite - a.composite);
  }, [selected, regime, normWeights]);

  const maxComposite = leaderboard[0]?.composite ?? 0;

  // ──────────────────────────────────────────────────────────────────
  // QUIZ — 8 câu (≥ 2 fill-blank)
  // ──────────────────────────────────────────────────────────────────
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "Tại sao không nên dùng MỘT con số duy nhất (vd 'MMLU 87%') để quyết định chọn LLM cho production?",
        options: [
          "Vì MMLU là benchmark dễ",
          "Vì chất lượng LLM là đa chiều (accuracy, hallucination, cost, format, latency, safety) và tuỳ trọng số use case sẽ ra xếp hạng khác nhau",
          "Vì MMLU không phổ biến",
          "Vì MMLU chỉ đánh giá tiếng Anh",
        ],
        correct: 1,
        explanation:
          "Một số duy nhất nén mất thông tin về trade-off. Model A có thể cao MMLU nhưng hallucinate nặng; model B thấp hơn chút nhưng ổn định format và rẻ hơn. Composite score có trọng số gắn với use case là lựa chọn đúng hơn.",
      },
      {
        type: "fill-blank",
        question:
          "Offline eval chạy trên {blank} (tập dữ liệu cố định, biết trước đáp án), còn online eval đo trên {blank} (lưu lượng người dùng thật) để bắt drift và phân phối thực.",
        blanks: [
          {
            answer: "golden set",
            accept: ["golden dataset", "tập vàng", "bộ vàng", "tập test cố định"],
          },
          {
            answer: "production traffic",
            accept: [
              "traffic sản xuất",
              "shadow traffic",
              "lưu lượng thực",
              "lưu lượng prod",
              "live traffic",
            ],
          },
        ],
        explanation:
          "Offline cho tín hiệu lặp được dùng gate CI. Online phản ánh phân phối thật và bắt drift. Team chín luôn có CẢ HAI + golden set chạy hàng ngày để phát hiện regression.",
      },
      {
        question:
          "LLM-as-judge (dùng một LLM để chấm output của LLM khác) có bẫy nào quan trọng nhất?",
        options: [
          "Tốn GPU",
          "Self-preference bias: judge hay chấm cao output của model cùng họ, cộng với positional bias khi so sánh cặp",
          "Không dùng được",
          "Không scale được",
        ],
        correct: 1,
        explanation:
          "Hai bias chính: (1) self-preference — GPT-4 chấm output GPT-4 cao hơn Claude, (2) positional — đưa A trước B thường được chấm cao hơn. Cách giảm: shuffle order, dùng 2 judge khác họ lấy trung bình, calibrate bằng human eval 30-50 mẫu/tuần.",
      },
      {
        question:
          "Bạn pass 95% golden nhưng CSAT production tụt 12 điểm sau 2 tuần. Hành động đầu tiên là gì?",
        options: [
          "Retrain model",
          "Bật online sampling + so sánh phân phối intent giữa golden và prod; gần như chắc chắn golden không đại diện — cập nhật golden từ conversation sampling",
          "Tăng temperature",
          "Chuyển sang model khác",
        ],
        correct: 1,
        explanation:
          "Cổ điển: golden stale hoặc skew. Sample 200-500 conversation prod, phân cụm intent, so sánh với phân phối golden. Intent nào prod có mà golden thiếu → bổ sung. Đây là vòng đời bắt buộc của golden set.",
      },
      {
        question:
          "Công thức nào dùng để tổng hợp win-rate pairwise thành một điểm đơn (rating)?",
        options: [
          "BLEU",
          "Elo rating: E_A = 1 / (1 + 10^((R_B − R_A) / 400)) — mượn từ cờ vua, dùng trong Chatbot Arena",
          "F1 score",
          "ROC-AUC",
        ],
        correct: 1,
        explanation:
          "Elo / Bradley-Terry là cách chuẩn để biến nhiều phép so sánh cặp thành một rating. Chatbot Arena (LMSYS) dùng chính công thức này để xếp hạng mô hình từ hàng triệu vote.",
      },
      {
        question:
          "Composite score tổng hợp 7 metric. Khi nào bạn PHẢI chỉnh trọng số khác mặc định?",
        options: [
          "Không bao giờ — mặc định luôn đúng",
          "Khi use case có ràng buộc đặc thù: chatbot y tế nâng trọng số hallucination + factuality, hệ thống low-latency giảm cost hạ format compliance, pipeline đọc JSON nâng format compliance lên hàng đầu",
          "Chỉ khi dùng model open-source",
          "Chỉ khi có ít hơn 3 model để so sánh",
        ],
        correct: 1,
        explanation:
          "Trọng số = phát biểu business priority. Copy weights từ paper mà không điều chỉnh = để paper author quyết định sản phẩm của bạn. Viết trọng số xong mới biết team có đồng thuận không — đây là bài tập alignment với stakeholder.",
      },
      {
        type: "fill-blank",
        question:
          "Để tổng hợp N metric thành một điểm duy nhất, dùng composite score tuyến tính có trọng số: S = Σ w_i · m̂_i. Trong đó m̂_i là giá trị đã {blank} về thang [0,1], còn w_i là {blank} — phải cộng lại bằng 1.",
        blanks: [
          {
            answer: "chuẩn hoá",
            accept: ["normalize", "normalised", "normalized", "chuẩn hóa", "chuẩn hoa"],
          },
          {
            answer: "trọng số",
            accept: ["weight", "weights", "trong so", "trọng so"],
          },
        ],
        explanation:
          "Với chiều 'càng thấp càng tốt' (hallucination, cost, refusal), dùng 1 − m thay vì m. Tổng trọng số = 1 là convention; nếu tổng ≠ 1 phải chia lại, nếu không composite sẽ phụ thuộc vào quy mô trọng số thay vì vào giá trị metric.",
      },
      {
        question:
          "Trong CI/CD, 'regression gate' cho LLM eval là gì?",
        options: [
          "Lint code Python",
          "Một ngưỡng cứng trên golden set (vd success ≥ 0.85, hallucination ≤ 0.02, format ≥ 0.95) — nếu PR đẩy metric xuống dưới ngưỡng thì build fail và không merge được",
          "Tên một mô hình",
          "Một tính năng của GitHub Copilot",
        ],
        correct: 1,
        explanation:
          "Gate biến eval từ 'đẹp nhưng bị bỏ qua' thành ràng buộc cứng trong merge flow. Thực thi bằng GitHub Action chạy nightly + pre-merge. Khi fail, PR author phải justify hoặc sửa. Không có gate, eval mất tác dụng sau 2 tháng.",
      },
    ],
    [],
  );

  // ──────────────────────────────────────────────────────────────────
  // RENDER HELPERS
  // ──────────────────────────────────────────────────────────────────

  const renderModelChips = () => (
    <div className="flex flex-wrap gap-2">
      {MODELS.map((m) => {
        const active = selected.has(m.id);
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => toggleModel(m.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              active
                ? "border-accent bg-accent/15 text-foreground shadow-sm"
                : "border-border bg-background text-muted hover:text-foreground hover:border-accent/60"
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  active ? "bg-accent" : "bg-border"
                }`}
              />
              {m.label}
              <span className="text-[10px] text-muted/80">· {m.vendor}</span>
            </span>
          </button>
        );
      })}
    </div>
  );

  const renderRegimeToggle = () => (
    <div className="inline-flex items-center rounded-lg border border-border bg-background p-0.5">
      {(["offline", "online"] as Regime[]).map((r) => {
        const active = regime === r;
        return (
          <button
            key={r}
            type="button"
            onClick={() => setRegime(r)}
            className={`relative rounded-md px-3 py-1 text-xs font-medium transition ${
              active
                ? "bg-accent/15 text-foreground"
                : "text-muted hover:text-foreground"
            }`}
          >
            {r === "offline" ? "Offline (golden)" : "Online (shadow)"}
          </button>
        );
      })}
    </div>
  );

  const renderScorecard = () => (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b border-border bg-background/60">
            <th className="sticky left-0 z-10 bg-background/80 px-3 py-2 text-left font-bold text-foreground">
              Model
            </th>
            {METRICS.map((m) => (
              <th
                key={m.key}
                onMouseEnter={() => setHoverMetric(m.key)}
                onMouseLeave={() => setHoverMetric(null)}
                className="relative cursor-help px-2 py-2 text-center font-semibold text-muted"
                title={m.tooltip}
              >
                <span className="inline-flex items-center gap-1">
                  {m.shortLabel}
                  <span className="text-[9px] text-muted/60">
                    {m.higherIsBetter ? "↑" : "↓"}
                  </span>
                </span>
                {hoverMetric === m.key && (
                  <motion.span
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute left-1/2 top-full z-20 mt-1 w-56 -translate-x-1/2 rounded-md border border-border bg-background px-2 py-1.5 text-left text-[10px] font-normal normal-case text-muted shadow-lg"
                  >
                    <strong className="text-foreground">{m.label}.</strong>{" "}
                    {m.tooltip}
                  </motion.span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leaderboard.map(({ model, scores }) => (
            <tr
              key={model.id}
              className="border-b border-border/40 last:border-b-0"
            >
              <td className="sticky left-0 z-10 bg-card px-3 py-2 font-semibold text-foreground whitespace-nowrap">
                {model.label}
                <span className="ml-1 text-[10px] text-muted">
                  {model.vendor}
                </span>
              </td>
              {METRICS.map((metric) => {
                const raw = scores[metric.key];
                const norm = normalise(metric, raw);
                const tone = cellTone(norm);
                return (
                  <td key={metric.key} className="px-1.5 py-1.5 text-center">
                    <motion.span
                      key={`${model.id}-${metric.key}-${regime}-${raw}`}
                      initial={{ opacity: 0.4, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25 }}
                      className={`inline-block min-w-[52px] rounded-md border px-1.5 py-0.5 font-mono text-[11px] ${tone.bg} ${tone.text}`}
                    >
                      {formatValue(metric, raw)}
                    </motion.span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderWeightSliders = () => (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <p className="text-sm font-bold text-foreground">
            Trọng số metric (business priority)
          </p>
          <p className="text-[11px] text-muted">
            Kéo slider — leaderboard tự sắp xếp lại. Tổng trọng số được chuẩn hoá
            về 1 trước khi tính composite.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-mono ${
              Math.abs(weightSum - 1) < 0.02
                ? "text-emerald-400"
                : "text-amber-400"
            }`}
          >
            Σw = {weightSum.toFixed(2)}
          </span>
          <button
            type="button"
            onClick={resetWeights}
            className="text-[11px] rounded-md border border-border bg-background px-2.5 py-1 text-muted hover:text-foreground transition"
          >
            ⟲ Reset
          </button>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {METRICS.map((m) => (
          <label key={m.key} className="block">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-medium text-foreground">{m.label}</span>
              <span className="font-mono text-muted">
                {weights[m.key].toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={0.5}
              step={0.01}
              value={weights[m.key]}
              onChange={(e) => setWeight(m.key, Number(e.target.value))}
              className="mt-1 w-full accent-accent"
            />
          </label>
        ))}
      </div>
    </div>
  );

  const renderCompositeBars = () => (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-foreground">
            Composite score — xếp hạng theo trọng số hiện tại
          </p>
          <p className="text-[11px] text-muted">
            Regime: <strong>{regime === "offline" ? "Offline (golden set)" : "Online (shadow traffic)"}</strong>
          </p>
        </div>
      </div>
      <div className="space-y-2">
        {leaderboard.map(({ model, composite }, idx) => {
          const pct = (composite / Math.max(maxComposite, 0.001)) * 100;
          const rankColor =
            idx === 0
              ? "text-emerald-400"
              : idx === 1
                ? "text-amber-400"
                : "text-muted";
          return (
            <div key={model.id} className="flex items-center gap-3">
              <span
                className={`w-6 text-center text-xs font-bold ${rankColor}`}
              >
                #{idx + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-baseline justify-between text-[11px]">
                  <span className="font-semibold text-foreground">
                    {model.label}
                  </span>
                  <span className="font-mono text-muted">
                    {composite.toFixed(3)}
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-background overflow-hidden">
                  <motion.div
                    layout
                    initial={false}
                    animate={{ width: `${pct}%` }}
                    transition={{ type: "spring", stiffness: 140, damping: 20 }}
                    className={`h-full rounded-full ${
                      idx === 0
                        ? "bg-emerald-500/70"
                        : idx === 1
                          ? "bg-amber-500/70"
                          : "bg-muted/50"
                    }`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ──────────────────────────────────────────────────────────────────
  // RENDER CHÍNH
  // ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ───────────── 1. DỰ ĐOÁN ───────────── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn chọn một LLM vì nó đứng #1 HumanEval (offline benchmark nổi tiếng). Deploy ra prod, CSAT của khách hàng tụt 40% so với model cũ. Lý do hợp lý nhất là gì?"
          options={[
            "Model bị lỗi kỹ thuật — gọi API sai",
            "Benchmark offline không đại diện phân phối người dùng thật; eval không thể là một con số duy nhất trên một dataset duy nhất",
            "Người dùng chưa quen model mới — chờ thêm vài tuần là ổn",
            "Cần tăng nhiệt độ sampling lên 1.2",
          ]}
          correct={1}
          explanation="HumanEval đo code completion trên bài toán học thuật. CSAT đo trải nghiệm trò chuyện của khách hàng. Hai phân phối khác nhau hoàn toàn. 'Một số duy nhất để rank LLM' là ảo tưởng — phải nghĩ theo MA TRẬN metric × regime × use case."
        >
          {/* ───────────── 2. VISUALIZATION ───────────── */}
          <LessonSection
            step={2}
            totalSteps={TOTAL_STEPS}
            label="LLM Eval Leaderboard"
          >
            <p className="mb-4 text-sm text-muted leading-relaxed">
              Từ dự đoán vừa rồi, câu hỏi kế tiếp là:{" "}
              <em>vậy phải đo thế nào để hợp lý?</em> Hãy nhập vai{" "}
              <strong className="text-foreground">ML lead</strong> đang chọn
              model cho production. Bật tối thiểu 2 model, kéo trọng số theo
              priority của use case, rồi chuyển giữa Offline và Online để thấy
              bảng xếp hạng <em>thay đổi</em>.
            </p>

            <VisualizationSection>
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {renderModelChips()}
                  {renderRegimeToggle()}
                </div>

                {renderScorecard()}

                <div className="grid lg:grid-cols-[1fr_1fr] gap-4">
                  {renderWeightSliders()}
                  {renderCompositeBars()}
                </div>

                <Callout variant="tip" title="Thử nghiệm ba bước">
                  <ol className="list-decimal list-inside text-sm space-y-1">
                    <li>
                      Bật cả 4 model, để trọng số mặc định. Ghi nhớ thứ tự ở{" "}
                      <em>offline</em>.
                    </li>
                    <li>
                      Chuyển sang <em>online</em>. Thứ tự có đổi không? Điểm
                      composite sụt bao nhiêu?
                    </li>
                    <li>
                      Kéo trọng số <code>hallucinationRate</code> lên 0.4 và{" "}
                      <code>costPerTask</code> xuống 0.02 (giống chatbot y tế).
                      Giờ #1 là ai?
                    </li>
                  </ol>
                </Callout>
              </div>
            </VisualizationSection>
          </LessonSection>

          {/* ───────────── 3. AHA ───────────── */}
          <LessonSection
            step={3}
            totalSteps={TOTAL_STEPS}
            label="Khoảnh khắc aha"
          >
            <AhaMoment>
              <p>
                Trải nghiệm bạn vừa làm chốt lại điều then chốt:{" "}
                <strong>
                  không có một số duy nhất đánh giá LLM
                </strong>
                . Thay vào đó là một <strong>ma trận metric × regime × use case</strong>,
                và <em>trọng số</em> là thứ ép business phải ra quyết định —
                không phải thuật toán. Khi bạn đổi trọng số, bạn đang nói với
                tổ chức <em>ưu tiên kinh doanh của chúng ta là gì</em>. Đó
                cũng là lý do tại sao chọn LLM khó hơn chọn thư viện
                open-source.
              </p>
            </AhaMoment>
          </LessonSection>

          {/* ───────────── 4. CALLOUTS ───────────── */}
          <LessonSection
            step={4}
            totalSteps={TOTAL_STEPS}
            label="Bốn lưu ý quan trọng"
          >
            <p className="mb-3 text-sm text-muted">
              Nhận thức &quot;ma trận metric&quot; ở trên là cần nhưng chưa đủ.
              Bốn gợi ý sau là những cạm bẫy phổ biến nhất khi triển khai
              khung eval vào thực tế:
            </p>
            <div className="space-y-3">
              <Callout variant="tip" title="Benchmarks học thuật phổ biến">
                <strong>MT-Bench</strong> (đa lượt hội thoại, 80 câu hỏi chấm
                bằng LLM-as-judge),{" "}
                <strong>MMLU</strong> (kiến thức 57 môn, multiple-choice),{" "}
                <strong>GSM8K</strong> (toán tiểu học có lý luận),{" "}
                <strong>TruthfulQA</strong> (bẫy misconception),{" "}
                <strong>HumanEval</strong> (code generation),{" "}
                <strong>Chatbot Arena</strong> (win-rate người dùng thật xếp
                bằng Elo). Mỗi cái đo một lát cắt — không có cái nào đại diện
                cho use case của <em>bạn</em>. Dùng chúng như tín hiệu sàng
                lọc, không phải quyết định cuối.
              </Callout>

              <Callout variant="warning" title="Bẫy 'benchmarks bị học thuộc'">
                Model càng mới càng dễ có các benchmark công khai trong training
                data (contamination). MMLU 2021 có thể bị leak trong Common
                Crawl 2024, khiến điểm cao mà khả năng thật không tương xứng.
                Giảm bằng: (1) giữ 10-20% golden riêng tư không công khai,
                (2) sinh biến thể (paraphrase) test set định kỳ,
                (3) theo dõi gap giữa public benchmark và private eval của bạn
                — nếu gap giãn rộng, có mùi contamination.
              </Callout>

              <Callout variant="info" title="LLM-as-judge không phải ‘free accuracy’">
                Dùng một LLM mạnh để chấm output là kỹ thuật scale tốt, nhưng
                có <strong>self-preference bias</strong> (judge hay chấm cao
                model cùng họ), <strong>positional bias</strong> (lựa chọn đầu
                tiên được chọn nhiều hơn), và <strong>verbose bias</strong>{" "}
                (câu trả lời dài được chấm tốt hơn). Cách giảm: shuffle thứ
                tự, dùng 2 judge khác họ rồi trung bình, calibrate bằng human
                eval 30-50 mẫu/tuần để kiểm hệ số đồng thuận (Cohen&apos;s
                kappa nên &gt; 0.6).
              </Callout>

              <Callout variant="insight" title="Golden set phải được cập nhật định kỳ">
                Một golden set đông cứng là một golden set sắp chết. Phân phối
                user, intent, và edge case thay đổi mỗi tháng. Quy trình
                khuyến nghị:{" "}
                <strong>
                  sample 200-500 conversation production mỗi 2 tuần → phân cụm
                  intent → bổ sung vào golden
                </strong>
                . Đánh dấu version (v1, v2…) và log lại khi gate thay đổi — vì
                ngưỡng pass trên v1 không so sánh trực tiếp với v2 được. Đây
                là vòng đời mà nhiều team bỏ qua, rồi ngạc nhiên vì sao
                production incident không bị bắt.
              </Callout>
            </div>
          </LessonSection>

          {/* ───────────── 5. THỬ THÁCH ───────────── */}
          <LessonSection
            step={5}
            totalSteps={TOTAL_STEPS}
            label="Thử thách áp dụng"
          >
            <p className="mb-3 text-sm text-muted">
              Đã có đủ khung, giờ kiểm tra xem bạn có thể ra quyết định ngoài
              lý thuyết không. Hai tình huống sau đều xảy ra thường xuyên
              trong các team AI năm 2026:
            </p>
            <div className="space-y-4">
              <InlineChallenge
                question="Model A đứng #1 overall (composite 0.82) trên golden set. Nhưng khi slice theo segment 'khách hàng VIP' (top 5% revenue), A đứng #3; model C đứng #1 trên segment này. Bạn quyết định thế nào?"
                options={[
                  "Chọn A — vì #1 overall luôn là lựa chọn an toàn",
                  "Route khác nhau: C cho VIP, A cho số còn lại — và giám sát kỹ segment VIP vì giá trị business cao hơn trung bình",
                  "Chọn C cho tất cả — để tối ưu segment quan trọng nhất",
                  "Không đủ dữ liệu — cần retrain",
                ]}
                correct={1}
                explanation="Aggregate che mất phân phối. Revenue concentration thường 80/20, nên một model #3 ở segment 5% top revenue có thể gây hại lớn hơn lợi ích của việc #1 overall. Model routing hoặc segment-specific prompt là giải pháp tiêu chuẩn — xem Chatbot Arena slice theo category (code, writing, reasoning) là lấy từ đúng nguyên tắc này."
              />

              <InlineChallenge
                question="Golden pass 95%. Nhưng user complaint tăng 3x trong 10 ngày. Bạn bật công cụ đo nào TRƯỚC TIÊN để điều tra?"
                options={[
                  "Tăng golden set lên 10x",
                  "Online sampling (lấy 500 conversation prod gần nhất) + phân cụm intent để so sánh phân phối intent giữa golden và prod — nếu lệch thì golden stale",
                  "Chuyển model khác thử 1 ngày",
                  "Reset weight composite về mặc định",
                ]}
                correct={1}
                explanation="Tình huống này rất gần với case 'CSAT tụt khi golden vẫn pass'. Khả năng cao: distribution drift hoặc golden không cover intent mới. Online sampling là công cụ số 1. Sau khi xác định có drift, mới quyết định bổ sung golden, retrain judge, hay rollback model."
              />
            </div>
          </LessonSection>

          {/* ───────────── 6. LÝ THUYẾT ───────────── */}
          <LessonSection
            step={6}
            totalSteps={TOTAL_STEPS}
            label="Khung lý thuyết đầy đủ"
          >
            <ExplanationSection>
              <p>
                Từ trực giác về ma trận metric, ta có thể hệ thống hoá thành
                một khung lý thuyết. <strong>Đánh giá LLM</strong> là quy
                trình đo chất lượng đầu ra của một mô hình ngôn ngữ trên một
                tập task, theo nhiều chiều, ở nhiều giai đoạn (offline →
                online → post-deployment). Nó khác cơ bản với{" "}
                <TopicLink slug="agent-evaluation">
                  đánh giá Agent
                </TopicLink>{" "}
                vì LLM chỉ cho một output, còn Agent có nhiều bước + tương
                tác môi trường.
              </p>

              <p>Có <strong>ba trụ cột</strong> cần nắm vững:</p>

              <h3 className="text-sm font-bold text-foreground mt-4">
                (i) Bốn loại eval theo hình thức chấm
              </h3>
              <ul className="list-disc list-inside space-y-2 pl-2 text-sm">
                <li>
                  <strong>Reference-based:</strong> có đáp án chuẩn; so sánh
                  output với reference bằng BLEU, ROUGE, exact match, F1, code
                  execution pass/fail. Phù hợp với dịch máy, tóm tắt có
                  reference, code generation.
                </li>
                <li>
                  <strong>Reference-free:</strong> không có đáp án chuẩn; đo
                  thuộc tính intrinsic (coherence, toxicity, format). Dùng
                  classifier model hoặc regex check. Phù hợp creative writing,
                  open-ended Q&amp;A.
                </li>
                <li>
                  <strong>Pairwise (preference):</strong> cho judge (người
                  hoặc LLM) chọn A vs B. Dễ hơn cho chấm 0-10. Tổng hợp bằng
                  Elo hoặc Bradley-Terry. Chatbot Arena, LMSYS leaderboard
                  hoạt động theo cơ chế này.
                </li>
                <li>
                  <strong>Rubric-based:</strong> judge (thường là LLM-as-judge)
                  chấm theo checklist rõ ràng: có citation không? format đúng
                  không? không vượt scope? Rubric cụ thể giảm noise gấp 3-5
                  lần so với &quot;chấm 1-10 tổng thể&quot;.
                </li>
              </ul>

              <h3 className="text-sm font-bold text-foreground mt-4">
                (ii) Hai giai đoạn: Offline và Online
              </h3>
              <p className="text-sm">
                Offline chạy trên dataset cố định (golden set, benchmark công
                khai), lặp được, rẻ, làm gate cho CI. Online đo trên traffic
                thật qua shadow traffic (chạy song song không ảnh hưởng user),
                A/B test, hoặc interleaving. Team chín luôn có cả hai — vì
                offline pass không chứng minh prod ổn (bạn đã thấy ở viz).
                Ngoài ra, một <strong>golden set nhỏ 50-200 mẫu</strong> nên
                chạy hàng ngày như canary, alert khi pass rate sụt &gt; 3%.
              </p>

              <h3 className="text-sm font-bold text-foreground mt-4">
                (iii) Gate và Reporting
              </h3>
              <p className="text-sm">
                Eval không gắn với merge flow sẽ bị bỏ qua sau 2 tháng. Ngưỡng
                cứng trong CI (success ≥ 0.85, hallucination ≤ 0.02, format ≥
                0.95) là cách biến eval từ &quot;decor&quot; thành{" "}
                <strong>ràng buộc</strong>. Kết quả eval nên đổ về kho có thể
                slice: <strong>BigQuery</strong> (SQL tự do),{" "}
                <strong>MLflow</strong> (theo dõi thí nghiệm), hoặc{" "}
                <strong>Langfuse</strong> (trace-centric, tích hợp sẵn cho
                app LLM). Hai tín hiệu cần nhìn mỗi ngày: pass rate trên
                golden, và delta so với tuần trước.
              </p>

              <h3 className="text-sm font-bold text-foreground mt-4">
                Công thức tổng hợp
              </h3>
              <p className="text-sm">
                Composite score là cách gói N metric thành một số duy nhất có
                thể rank:
              </p>
              <p className="text-center">
                <LaTeX>
                  {"S = \\sum_{i=1}^{N} w_i \\cdot \\hat{m}_i, \\quad \\sum_{i=1}^{N} w_i = 1"}
                </LaTeX>
              </p>
              <p className="text-xs text-muted">
                Trong đó <code>m̂_i ∈ [0,1]</code> là giá trị chuẩn hoá (với
                chiều &quot;càng thấp càng tốt&quot; như hallucination hay cost
                thì dùng <code>1 − m</code>), còn <code>w_i</code> là trọng số
                theo use case. Tổng trọng số phải bằng 1 — nếu không, điểm
                composite sẽ phụ thuộc vào quy mô trọng số thay vì vào giá trị
                thật sự của metric.
              </p>

              <p className="text-sm mt-4">
                Để tổng hợp nhiều phép so sánh cặp (A thắng B, B thắng C…)
                thành một rating số, dùng công thức Elo:
              </p>
              <p className="text-center">
                <LaTeX>
                  {"E_A = \\frac{1}{1 + 10^{(R_B - R_A)/400}}"}
                </LaTeX>
              </p>
              <p className="text-xs text-muted">
                <code>E_A</code> là xác suất A thắng khi rating hai bên là{" "}
                <code>R_A, R_B</code>. Sau mỗi trận, <code>R_A ← R_A + K (S_A
                − E_A)</code> với <code>S_A ∈ {"{0, 0.5, 1}"}</code>. Đây là
                công thức Chatbot Arena dùng để rank hàng trăm mô hình từ
                hàng triệu vote — và là cách đúng để tổng hợp pairwise
                preference.
              </p>

              <CodeBlock language="python" title="eval_harness.py — khung eval tối giản">
                {`from dataclasses import dataclass, field
from typing import Callable
from statistics import mean

@dataclass
class EvalResult:
    metric: str
    value: float
    higher_is_better: bool

@dataclass
class EvalHarness:
    golden_set: list          # [{"prompt": ..., "reference": ..., "tags": [...]}, ...]
    judges: dict[str, Callable]  # name -> judge(output, sample) -> float
    weights: dict[str, float] = field(default_factory=lambda: {
        "task_success": 0.25,
        "win_rate": 0.15,
        "hallucination": 0.20,   # càng thấp càng tốt
        "factuality": 0.15,
        "format": 0.10,
        "refusal": 0.05,         # càng thấp càng tốt
        "cost": 0.10,            # càng thấp càng tốt
    })
    gates: dict[str, float] = field(default_factory=lambda: {
        "task_success": 0.85,
        "hallucination": 0.02,
        "format": 0.95,
    })

    def run(self, model) -> dict:
        """Chạy model trên toàn bộ golden set, thu tất cả score."""
        per_sample = []
        for sample in self.golden_set:
            output = model.generate(sample["prompt"])
            scores = {name: j(output, sample) for name, j in self.judges.items()}
            scores["cost"] = model.last_cost_usd
            per_sample.append(scores)
        return self.aggregate(per_sample)

    def aggregate(self, per_sample: list[dict]) -> dict:
        """Gộp về metric tổng, rồi tính composite."""
        metrics = {k: mean(s[k] for s in per_sample) for k in per_sample[0].keys()}
        # Chuẩn hoá về [0, 1] với logic ngược chiều cho lower-is-better
        norm = {
            "task_success": metrics["task_success"],
            "win_rate": metrics.get("win_rate", 0.5),
            "hallucination": 1 - metrics["hallucination"],
            "factuality": metrics["factuality"],
            "format": metrics["format"],
            "refusal": 1 - metrics["refusal"],
            "cost": max(0, 1 - metrics["cost"] / 0.05),
        }
        composite = sum(self.weights[k] * norm[k] for k in norm)
        return {"metrics": metrics, "composite": composite}

    def gate(self, result: dict) -> tuple[bool, list[str]]:
        """Trả về (pass?, danh sách gate fail)."""
        failures = []
        for metric, threshold in self.gates.items():
            val = result["metrics"][metric]
            ok = (val >= threshold) if metric not in {"hallucination", "refusal", "cost"} \\
                 else (val <= threshold)
            if not ok:
                failures.append(f"{metric}={val:.3f} vs threshold {threshold}")
        return (len(failures) == 0, failures)`}
              </CodeBlock>

              <p className="text-sm mt-3">
                Harness ở trên là lõi; phần còn lại là integration. Chạy
                nightly bằng GitHub Actions, gate pre-merge trên PR, và đổ kết
                quả về BigQuery hoặc Langfuse để phân tích lịch sử:
              </p>

              <CodeBlock
                language="yaml"
                title=".github/workflows/llm-eval.yml"
              >
                {`name: LLM Eval (nightly + pre-merge)

on:
  schedule:
    - cron: "0 18 * * *"    # 01h sáng VN — chạy sau deploy cuối ngày
  pull_request:
    paths:
      - "prompts/**"
      - "models.yaml"
      - "src/chain/**"

jobs:
  golden:
    runs-on: ubuntu-latest
    timeout-minutes: 40
    steps:
      - uses: actions/checkout@v4

      - name: Run golden eval (500 mẫu, 2 judge)
        env:
          ANTHROPIC_API_KEY: \${{ secrets.ANTHROPIC_API_KEY }}
          OPENAI_API_KEY: \${{ secrets.OPENAI_API_KEY }}
        run: |
          python -m evals.run \\
            --suite golden/v4 \\
            --model-under-test $MODEL \\
            --judges hallucination_v3 format_v2 factuality_v1 \\
            --output reports/eval.json

      - name: Gate on thresholds
        run: |
          python -m evals.gate \\
            --report reports/eval.json \\
            --min-task-success 0.85 \\
            --max-hallucination 0.02 \\
            --min-format 0.95 \\
            --min-factuality 0.88

      - name: Push to Langfuse
        run: python -m evals.sink --backend langfuse --report reports/eval.json

      - name: Alert on regression
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {"text": "LLM eval regression on \${{ github.ref }} — see \${{ github.run_id }}"}`}
              </CodeBlock>

              <CollapsibleDetail title="LLM-as-judge: bias và calibration">
                <p className="text-sm">
                  Dùng LLM để chấm LLM là thứ giữ eval vận hành ở scale (hàng
                  nghìn mẫu mỗi đêm không thể dùng human). Nhưng có 5 bias
                  cần hiểu và chủ động kiểm soát:
                </p>
                <ol className="list-decimal list-inside text-sm space-y-1 pl-2 mt-2">
                  <li>
                    <strong>Self-preference bias:</strong> GPT-4 chấm cao
                    output GPT-4 hơn output Claude cho cùng chất lượng.
                    Cách giảm: dùng 2 judge khác họ (vd Claude + Gemini)
                    lấy trung bình, hoặc dùng judge open-source không liên
                    quan vendor.
                  </li>
                  <li>
                    <strong>Positional bias:</strong> khi so sánh A vs B,
                    judge ưu tiên đáp án đầu tiên ~55-58% (paper MT-Bench
                    báo cáo). Cách giảm: chạy hai chiều (A-B và B-A), chỉ
                    tính vote khi cả hai chiều nhất quán.
                  </li>
                  <li>
                    <strong>Verbose bias:</strong> câu trả lời dài được
                    chấm cao hơn, kể cả khi dài vô nghĩa. Cách giảm: ràng
                    buộc độ dài trong rubric (&quot;penalty nếu &gt; 400
                    token mà không có lý do&quot;).
                  </li>
                  <li>
                    <strong>Rubric drift:</strong> cùng rubric, judge khác
                    phiên bản chấm khác nhau. Cách giảm: pin version model
                    judge, log version vào mỗi record.
                  </li>
                  <li>
                    <strong>Calibration với human:</strong> mỗi tuần 30-50
                    mẫu human chấm, so sánh với judge. Cohen&apos;s kappa
                    nên &gt; 0.6. Nếu tụt, rewrite rubric hoặc đổi model
                    judge. Đây là vòng feedback BẮT BUỘC trong team nghiêm
                    túc.
                  </li>
                </ol>
              </CollapsibleDetail>

              <CollapsibleDetail title="Khi nào cần human eval + cost/benefit">
                <p className="text-sm">
                  Human eval đắt (~$1-5 per sample với labeler chuyên môn)
                  và chậm (24-72h), nhưng là <em>ground truth</em>. Khung
                  khi nào dùng:
                </p>
                <ul className="list-disc list-inside text-sm space-y-1 pl-2 mt-2">
                  <li>
                    <strong>Calibration</strong> (50 mẫu/tuần): cần thiết
                    với bất kỳ team nào dùng LLM-as-judge ở scale. Không
                    skip được.
                  </li>
                  <li>
                    <strong>Nhạy cảm / mơ hồ</strong>: y tế, pháp lý, tư
                    vấn tài chính. LLM-as-judge không đủ tin để gate
                    deployment ở domain có rủi ro.
                  </li>
                  <li>
                    <strong>Launch gate</strong>: trước release lớn, chạy
                    human eval 200-500 mẫu để có confidence. Thà chậm 3
                    ngày còn hơn rollback trong tuần đầu.
                  </li>
                  <li>
                    <strong>Red-team / adversarial</strong>: xem{" "}
                    <TopicLink slug="red-teaming">red-teaming</TopicLink> —
                    chỉ con người mới sáng tạo đủ để phá vỡ mô hình theo
                    những cách không nằm trong golden set.
                  </li>
                </ul>
                <p className="text-sm mt-3">
                  Công thức quyết định đơn giản: nếu sai 1 output có thể
                  gây thiệt hại &gt; $1000 (y tế, pháp lý, tài chính,
                  compliance), human eval là bắt buộc; nếu &lt; $10
                  (chatbot giải trí, gợi ý nội dung), LLM-as-judge đủ.
                </p>
              </CollapsibleDetail>

              <p className="text-sm mt-4">
                Đánh giá LLM không tồn tại độc lập. Nó kết hợp với{" "}
                <TopicLink slug="hallucination">
                  phát hiện hallucination
                </TopicLink>
                ,{" "}
                <TopicLink slug="guardrails">guardrails</TopicLink> ở runtime,{" "}
                <TopicLink slug="red-teaming">red-teaming</TopicLink> cho an
                toàn,{" "}
                <TopicLink slug="monitoring">monitoring</TopicLink> và{" "}
                <TopicLink slug="mlops">MLOps</TopicLink> cho vận hành sản xuất.
                Với các pipeline RAG, còn có{" "}
                <TopicLink slug="rag-evaluation">
                  đánh giá RAG
                </TopicLink>{" "}
                (faithfulness, context precision / recall) — chủ đề riêng vì
                RAG có nguồn ngữ cảnh nên cần metric khác.
              </p>
            </ExplanationSection>
          </LessonSection>

          {/* ───────────── 7. CASE STUDY ───────────── */}
          <LessonSection
            step={7}
            totalSteps={TOTAL_STEPS}
            label="Case study: Tiki chatbot hỗ trợ"
          >
            <div className="rounded-xl border border-border bg-card p-4 text-sm space-y-3">
              <p>
                <strong className="text-foreground">Bối cảnh.</strong> Tiki
                triển khai chatbot hỗ trợ khách hàng trên app, xử lý các
                intent: tra đơn, đổi/huỷ, hoàn tiền, FAQ sản phẩm. Trước
                deploy, team build golden set 420 mẫu từ log CS cũ, chọn
                Claude Sonnet làm model chính. Eval offline:{" "}
                <strong>task success 92%, hallucination 1.4%, format 97%</strong>
                . Composite 0.88 — vượt gate. Deploy tuần 1: ổn định, CSAT
                tương đương baseline tổng đài người.
              </p>

              <p>
                <strong className="text-foreground">Tuần 3 — drift.</strong>{" "}
                Team bật online sampling 300 conversation/ngày để calibrate
                judge. Phát hiện hai dịch chuyển: (i) 18% lưu lượng mới là
                intent &quot;so sánh 2 SKU&quot; và &quot;khi nào có
                flash-sale lại&quot; — intent không có trong golden; (ii)
                hallucination online tăng lên 6.2% (so với 1.4% offline) vì
                chatbot bịa ngày sale và thông số sản phẩm mà nó không có
                context. Golden vẫn pass 91%, nhưng user complaint tăng 3.4x.
              </p>

              <p>
                <strong className="text-foreground">Phản ứng.</strong> Team
                làm ba việc song song: (1) <em>mở rộng golden</em> — lấy 150
                conversation prod gắn với intent mới, gán reference thủ
                công, đẩy lên golden v2; (2) <em>thêm judge cho
                hallucination</em> dựa trên citation check + đối chứng với
                catalogue sản phẩm; (3) <em>thêm guardrail từ chối</em> khi
                câu hỏi vượt context (&quot;khi nào sale&quot; → trả lời
                không có thông tin thay vì đoán). Ba tuần sau, hallucination
                prod về 1.8%, CSAT quay lại baseline.
              </p>

              <ul className="list-disc list-inside pl-2 space-y-1 mt-2 border-t border-border pt-3">
                <li>
                  <strong>Bài học 1.</strong> Offline pass không bảo chứng
                  online — phải bật online sampling TỪ NGÀY 1, không đợi có
                  vấn đề.
                </li>
                <li>
                  <strong>Bài học 2.</strong> Golden set cần chu kỳ cập nhật
                  cố định (Tiki giờ làm 2 tuần/lần), với quy trình sampling →
                  cluster intent → gán reference.
                </li>
                <li>
                  <strong>Bài học 3.</strong> Eval là một hệ thống sống, gắn
                  chặt với guardrails và monitoring. Phát hiện drift mà
                  không có lớp fallback (refuse, clarify) = eval thành công
                  nhưng user vẫn khổ.
                </li>
              </ul>
            </div>
          </LessonSection>

          {/* ───────────── 8. TÓM TẮT ───────────── */}
          <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Tóm tắt">
            <MiniSummary
              title="Sáu điều cần nhớ về LLM Evaluation"
              points={[
                "Đánh giá LLM là MA TRẬN metric × regime × use case — không có một con số duy nhất nào đủ để xếp hạng mô hình cho production.",
                "Luôn chạy CẢ offline (gate CI) và online (shadow traffic, A/B) — offline pass không chứng minh prod ổn; Tiki case study là ví dụ kinh điển.",
                "Golden set phải được cập nhật định kỳ (2-4 tuần/lần) qua vòng sampling → cluster intent → gán reference — nếu không, sẽ stale và tạo cảm giác an toàn giả.",
                "LLM-as-judge scale tốt nhưng có self-preference / positional / verbose bias — calibrate 30-50 mẫu/tuần bằng human eval để giữ Cohen's kappa > 0.6.",
                "Composite score S = Σ w_i · m̂_i là cách ép business chọn trọng số — viết weights ra là một bài tập alignment với stakeholder, không phải tối ưu kỹ thuật.",
                "Gate trong CI (GitHub Actions + BigQuery/MLflow/Langfuse reporting) biến eval từ 'decor' thành ràng buộc cứng — không gate, eval mất tác dụng sau 2 tháng.",
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
