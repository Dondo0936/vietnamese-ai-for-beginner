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
  ProgressSteps,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

/* ═══════════════════════════════════════════════════════════════════════
   METADATA
   ═══════════════════════════════════════════════════════════════════════ */
export const metadata: TopicMeta = {
  slug: "ai-tool-evaluation",
  title: "AI Tool Evaluation",
  titleVi: "Đánh giá AI tool đa chiều",
  description:
    "So sánh ChatGPT, Claude, Gemini trên 6 chiều: Accuracy, Cost, Latency, Safety, Privacy, Ease-of-use. Radar chart tương tác + live benchmark table.",
  category: "applied-ai",
  tags: ["benchmark", "evaluation", "radar-chart", "comparison", "tools"],
  difficulty: "intermediate",
  relatedSlugs: ["getting-started-with-ai", "prompt-engineering", "ai-privacy-security"],
  vizType: "interactive",
};

const TOTAL_STEPS = 9;

/* ═══════════════════════════════════════════════════════════════════════
   TOOLS & DIMENSIONS
   ═══════════════════════════════════════════════════════════════════════ */

type ToolId = "chatgpt" | "claude" | "gemini";
type DimId =
  | "accuracy"
  | "cost"
  | "latency"
  | "safety"
  | "privacy"
  | "ease";

interface DimensionDef {
  id: DimId;
  label: string;
  short: string;
  description: string;
  higherIsBetter: boolean;
  unit: string;
}

const DIMENSIONS: DimensionDef[] = [
  {
    id: "accuracy",
    label: "Accuracy",
    short: "ACC",
    description:
      "Chất lượng output trên các benchmark chuẩn (MMLU, GPQA, HumanEval) và khả năng reasoning đa bước.",
    higherIsBetter: true,
    unit: "/100",
  },
  {
    id: "cost",
    label: "Cost",
    short: "$$$",
    description:
      "Chi phí per-million-token input+output. Đã chuẩn hóa: điểm cao = rẻ hơn. Tính theo giá tier chính thức 2025.",
    higherIsBetter: true,
    unit: "/100",
  },
  {
    id: "latency",
    label: "Latency",
    short: "LAT",
    description:
      "TTFT (time to first token) + throughput (tokens/second). Điểm cao = nhanh hơn. Đo trên region Singapore.",
    higherIsBetter: true,
    unit: "/100",
  },
  {
    id: "safety",
    label: "Safety",
    short: "SAF",
    description:
      "Tỉ lệ từ chối đúng các prompt có hại + tỉ lệ KHÔNG over-refuse prompt hợp lệ. Đo trên bộ HarmBench + OverRefusalBench.",
    higherIsBetter: true,
    unit: "/100",
  },
  {
    id: "privacy",
    label: "Privacy",
    short: "PRV",
    description:
      "Cam kết không dùng data để train ở tier enterprise, TEE support, residency options, audit log quality.",
    higherIsBetter: true,
    unit: "/100",
  },
  {
    id: "ease",
    label: "Ease-of-use",
    short: "EoU",
    description:
      "SDK quality, documentation, ecosystem (integrations, community, Vietnamese support, UX chatbot web).",
    higherIsBetter: true,
    unit: "/100",
  },
];

interface ToolDef {
  id: ToolId;
  name: string;
  vendor: string;
  flagship: string;
  scores: Record<DimId, number>;
  color: string;
  pricing: string;
  strengths: string[];
  weaknesses: string[];
}

const TOOLS: ToolDef[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    vendor: "OpenAI",
    flagship: "GPT-5 / GPT-4.1",
    color: "#10a37f",
    pricing: "Plus $20/mo · API $2.5–15/1M tok",
    scores: {
      accuracy: 88,
      cost: 62,
      latency: 78,
      safety: 82,
      privacy: 75,
      ease: 92,
    },
    strengths: [
      "Ecosystem lớn nhất — GPT Store, plugins, integration",
      "DALL-E tích hợp, voice mode native, app mobile polished",
      "Function calling/structured output ổn định",
      "Documentation + cookbook phong phú",
    ],
    weaknesses: [
      "Giá API cao hơn Gemini ở tier flagship",
      "Vietnamese đôi khi mất dấu trên output dài",
      "Data residency option hạn chế (chủ yếu US/EU)",
    ],
  },
  {
    id: "claude",
    name: "Claude",
    vendor: "Anthropic",
    flagship: "Claude Opus 4.7 / Sonnet 4.6",
    color: "#d97757",
    pricing: "Pro $20/mo · API $3–15/1M tok",
    scores: {
      accuracy: 92,
      cost: 58,
      latency: 72,
      safety: 94,
      privacy: 90,
      ease: 85,
    },
    strengths: [
      "Reasoning và coding chất lượng cao nhất ở nhiều benchmark",
      "Xử lý tài liệu dài tốt (200K+ context), giữ dấu tiếng Việt",
      "Constitutional AI — ít hallucination, refuse hợp lý",
      "Enterprise: TEE trên AWS Bedrock, không dùng data để train",
    ],
    weaknesses: [
      "Không tạo ảnh trực tiếp",
      "Ecosystem plugin nhỏ hơn OpenAI",
      "Không có voice mode native tại thời điểm đánh giá",
    ],
  },
  {
    id: "gemini",
    name: "Gemini",
    vendor: "Google",
    flagship: "Gemini 2.5 Pro / Flash",
    color: "#4285f4",
    pricing: "AI Premium $20/mo · API $1.25–10/1M tok",
    scores: {
      accuracy: 86,
      cost: 88,
      latency: 90,
      safety: 78,
      privacy: 80,
      ease: 80,
    },
    strengths: [
      "Giá API rẻ nhất ở mid-tier (Flash cực kỳ cost-efficient)",
      "Context window lên tới 2M tokens, multimodal native (video/audio)",
      "Tích hợp Google Workspace sâu (Docs, Sheets, Gmail)",
      "Latency thấp nhờ TPU infrastructure",
    ],
    weaknesses: [
      "Output đôi khi verbose, thiếu structure",
      "Safety classifier đôi lúc over-refuse business query",
      "Vietnamese code-switch sang English không chủ đích",
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════════
   LIVE BENCHMARK ROWS (MMLU, GPQA, HumanEval, latency, cost)
   ═══════════════════════════════════════════════════════════════════════ */

interface BenchmarkRow {
  metric: string;
  detail: string;
  unit: string;
  higherIsBetter: boolean;
  values: Record<ToolId, number | string>;
}

const BENCHMARKS: BenchmarkRow[] = [
  {
    metric: "MMLU (5-shot)",
    detail: "General knowledge, 57 domains",
    unit: "%",
    higherIsBetter: true,
    values: { chatgpt: 89.3, claude: 90.7, gemini: 88.2 },
  },
  {
    metric: "GPQA Diamond",
    detail: "PhD-level science reasoning",
    unit: "%",
    higherIsBetter: true,
    values: { chatgpt: 59.8, claude: 64.1, gemini: 56.3 },
  },
  {
    metric: "HumanEval",
    detail: "Python code generation",
    unit: "%",
    higherIsBetter: true,
    values: { chatgpt: 90.2, claude: 93.7, gemini: 87.5 },
  },
  {
    metric: "MATH",
    detail: "Competition math",
    unit: "%",
    higherIsBetter: true,
    values: { chatgpt: 76.1, claude: 82.4, gemini: 79.8 },
  },
  {
    metric: "TTFT (P50)",
    detail: "Time to first token — Singapore",
    unit: "ms",
    higherIsBetter: false,
    values: { chatgpt: 520, claude: 640, gemini: 310 },
  },
  {
    metric: "Throughput",
    detail: "Tokens/second on flagship",
    unit: "tok/s",
    higherIsBetter: true,
    values: { chatgpt: 78, claude: 64, gemini: 112 },
  },
  {
    metric: "Input cost",
    detail: "Per 1M tokens",
    unit: "USD",
    higherIsBetter: false,
    values: { chatgpt: 2.5, claude: 3.0, gemini: 1.25 },
  },
  {
    metric: "Output cost",
    detail: "Per 1M tokens",
    unit: "USD",
    higherIsBetter: false,
    values: { chatgpt: 10.0, claude: 15.0, gemini: 5.0 },
  },
  {
    metric: "Context window",
    detail: "Max tokens/request",
    unit: "tok",
    higherIsBetter: true,
    values: { chatgpt: "1M", claude: "200K", gemini: "2M" },
  },
  {
    metric: "Enterprise no-train",
    detail: "Data không dùng để train ở tier",
    unit: "",
    higherIsBetter: true,
    values: { chatgpt: "Team+", claude: "API/Team+", gemini: "Workspace" },
  },
];

/* ═══════════════════════════════════════════════════════════════════════
   RADAR CHART COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */

const RADAR_SIZE = 320;
const RADAR_CX = RADAR_SIZE / 2;
const RADAR_CY = RADAR_SIZE / 2;
const RADAR_R = RADAR_SIZE / 2 - 40;

function polarToCartesian(angleRad: number, radius: number) {
  return {
    x: RADAR_CX + radius * Math.cos(angleRad),
    y: RADAR_CY + radius * Math.sin(angleRad),
  };
}

function dimensionAngle(index: number, total: number) {
  // Start at top (12 o'clock), go clockwise
  return -Math.PI / 2 + (2 * Math.PI * index) / total;
}

function RadarChart({
  tools,
  activeTools,
}: {
  tools: ToolDef[];
  activeTools: Set<ToolId>;
}) {
  const dims = DIMENSIONS;
  const n = dims.length;

  // Grid rings (20/40/60/80/100)
  const rings = [20, 40, 60, 80, 100];

  // Axis endpoints
  const axes = dims.map((_, i) => {
    const a = dimensionAngle(i, n);
    return polarToCartesian(a, RADAR_R);
  });

  // Label positions (slightly past the edge)
  const labelPositions = dims.map((_, i) => {
    const a = dimensionAngle(i, n);
    return polarToCartesian(a, RADAR_R + 24);
  });

  return (
    <div className="flex flex-col items-center">
      <svg
        width={RADAR_SIZE}
        height={RADAR_SIZE}
        viewBox={`0 0 ${RADAR_SIZE} ${RADAR_SIZE}`}
        className="max-w-full"
        role="img"
        aria-label="Radar chart so sánh 3 AI tool trên 6 chiều đánh giá"
      >
        {/* Grid rings */}
        {rings.map((ringVal) => {
          const r = (ringVal / 100) * RADAR_R;
          const pts = dims
            .map((_, i) => {
              const a = dimensionAngle(i, n);
              const p = polarToCartesian(a, r);
              return `${p.x},${p.y}`;
            })
            .join(" ");
          return (
            <polygon
              key={ringVal}
              points={pts}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.12}
              strokeWidth={1}
            />
          );
        })}

        {/* Axes */}
        {axes.map((pt, i) => (
          <line
            key={i}
            x1={RADAR_CX}
            y1={RADAR_CY}
            x2={pt.x}
            y2={pt.y}
            stroke="currentColor"
            strokeOpacity={0.2}
            strokeWidth={1}
          />
        ))}

        {/* Tool polygons */}
        {tools.map((tool) => {
          if (!activeTools.has(tool.id)) return null;
          const pts = dims
            .map((d, i) => {
              const score = tool.scores[d.id];
              const r = (score / 100) * RADAR_R;
              const a = dimensionAngle(i, n);
              const p = polarToCartesian(a, r);
              return `${p.x},${p.y}`;
            })
            .join(" ");
          return (
            <motion.g
              key={tool.id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <polygon
                points={pts}
                fill={tool.color}
                fillOpacity={0.18}
                stroke={tool.color}
                strokeWidth={2}
              />
              {dims.map((d, i) => {
                const score = tool.scores[d.id];
                const r = (score / 100) * RADAR_R;
                const a = dimensionAngle(i, n);
                const p = polarToCartesian(a, r);
                return (
                  <circle
                    key={d.id}
                    cx={p.x}
                    cy={p.y}
                    r={3.5}
                    fill={tool.color}
                    stroke="white"
                    strokeWidth={1.5}
                  />
                );
              })}
            </motion.g>
          );
        })}

        {/* Dimension labels */}
        {dims.map((d, i) => {
          const p = labelPositions[i];
          return (
            <text
              key={d.id}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground text-[11px] font-semibold"
            >
              {d.label}
            </text>
          );
        })}

        {/* Center dot */}
        <circle cx={RADAR_CX} cy={RADAR_CY} r={2} fill="currentColor" opacity={0.3} />
      </svg>

      {/* Ring legend */}
      <div className="mt-1 flex items-center gap-3 text-[10px] text-muted">
        {rings.map((r) => (
          <span key={r} className="font-mono">
            {r}
          </span>
        ))}
        <span className="text-foreground/70">(0 = center → 100 = edge)</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   TOOL TOGGLE PILLS
   ═══════════════════════════════════════════════════════════════════════ */

function ToolToggle({
  tool,
  active,
  onToggle,
}: {
  tool: ToolDef;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={`group inline-flex items-center gap-2 rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-ring ${
        active
          ? "text-white shadow-md"
          : "border-border bg-card text-muted hover:bg-surface"
      }`}
      style={
        active
          ? {
              backgroundColor: tool.color,
              borderColor: tool.color,
            }
          : undefined
      }
    >
      <span
        className={`h-2.5 w-2.5 rounded-full ${active ? "bg-white" : ""}`}
        style={!active ? { backgroundColor: tool.color } : undefined}
      />
      {tool.name}
      <span className={`text-[10px] font-normal ${active ? "opacity-80" : ""}`}>
        {active ? "ON" : "off"}
      </span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   BENCHMARK TABLE
   ═══════════════════════════════════════════════════════════════════════ */

function formatCell(v: number | string, unit: string) {
  if (typeof v === "string") return v;
  if (unit === "ms") return `${v.toFixed(0)} ${unit}`;
  if (unit === "USD") return `$${v.toFixed(2)}`;
  if (unit === "%") return `${v.toFixed(1)}%`;
  if (unit === "tok/s") return `${v.toFixed(0)} ${unit}`;
  return `${v}${unit ? ` ${unit}` : ""}`;
}

function bestToolForRow(row: BenchmarkRow, active: Set<ToolId>): ToolId | null {
  const entries = (Object.entries(row.values) as [ToolId, number | string][])
    .filter(([id, v]) => active.has(id) && typeof v === "number") as [ToolId, number][];
  if (entries.length === 0) return null;
  entries.sort((a, b) => (row.higherIsBetter ? b[1] - a[1] : a[1] - b[1]));
  return entries[0][0];
}

function BenchmarkTable({ active }: { active: Set<ToolId> }) {
  const toolOrder: ToolId[] = ["chatgpt", "claude", "gemini"];

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface">
          <tr>
            <th className="px-3 py-2 text-left font-semibold text-foreground">
              Metric
            </th>
            {toolOrder.map((id) => {
              const tool = TOOLS.find((t) => t.id === id)!;
              const isOn = active.has(id);
              return (
                <th
                  key={id}
                  className={`px-3 py-2 text-right font-semibold ${
                    isOn ? "text-foreground" : "text-muted/50"
                  }`}
                >
                  <span
                    className="inline-flex items-center gap-1.5"
                    style={{ color: isOn ? tool.color : undefined }}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: tool.color }}
                    />
                    {tool.name}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {BENCHMARKS.map((row, idx) => {
            const best = bestToolForRow(row, active);
            return (
              <tr
                key={row.metric}
                className={idx % 2 === 0 ? "bg-card" : "bg-surface/30"}
              >
                <td className="px-3 py-2">
                  <p className="font-medium text-foreground">{row.metric}</p>
                  <p className="text-[11px] text-muted">{row.detail}</p>
                </td>
                {toolOrder.map((id) => {
                  const v = row.values[id];
                  const isOn = active.has(id);
                  const isBest = isOn && best === id;
                  return (
                    <td
                      key={id}
                      className={`px-3 py-2 text-right font-mono text-xs ${
                        isOn ? "text-foreground" : "text-muted/40"
                      } ${isBest ? "font-bold" : ""}`}
                    >
                      <span
                        className={
                          isBest
                            ? "rounded-md bg-emerald-100 px-1.5 py-0.5 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                            : ""
                        }
                      >
                        {formatCell(v, row.unit)}
                      </span>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SCORE BARS (summary row under radar)
   ═══════════════════════════════════════════════════════════════════════ */

function ScoreBars({ active }: { active: Set<ToolId> }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {TOOLS.map((tool) => {
        const isOn = active.has(tool.id);
        const total = DIMENSIONS.reduce(
          (sum, d) => sum + tool.scores[d.id],
          0
        );
        const avg = total / DIMENSIONS.length;
        return (
          <div
            key={tool.id}
            className={`rounded-xl border p-3 transition-opacity ${
              isOn ? "border-border bg-card" : "border-border/50 bg-card/50 opacity-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-sm font-semibold"
                style={{ color: tool.color }}
              >
                {tool.name}
              </span>
              <span className="font-mono text-xs text-muted">
                avg {avg.toFixed(1)}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: tool.color }}
                initial={{ width: 0 }}
                animate={{ width: `${avg}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
            <p className="mt-1 text-[11px] text-muted">{tool.pricing}</p>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════════════════ */

export default function AiToolEvaluationTopic() {
  const [activeTools, setActiveTools] = useState<Set<ToolId>>(
    new Set(["chatgpt", "claude", "gemini"])
  );

  const toggleTool = useCallback((id: ToolId) => {
    setActiveTools((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        // Prevent turning off the last tool
        if (next.size === 1) return prev;
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  /* ─────────────────────────────────────────────────────────────────
     QUIZ (8 questions)
     ───────────────────────────────────────────────────────────────── */
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "Công ty bạn xây chatbot customer support với volume ~20M tokens/ngày (phần lớn là output). Ưu tiên là chi phí/token. Tool nào thường phù hợp nhất ở mid-tier?",
        options: [
          "GPT-4 flagship vì có reasoning tốt nhất",
          "Claude Opus vì an toàn nhất",
          "Gemini Flash vì chi phí output/1M tok thấp nhất và throughput cao",
          "Không quan trọng — mọi tool gần như giống nhau về giá",
        ],
        correct: 2,
        explanation:
          "Với volume lớn và output-heavy, giá output/1M token là yếu tố chi phối. Gemini Flash hiện rẻ nhất ở mid-tier ($5/1M output) và throughput cao. Với workload đơn giản (support chat), reasoning gap giữa các tool là nhỏ — chi phí nhân 365 ngày là lớn.",
      },
      {
        question:
          "Phân tích tài liệu pháp lý 150 trang tiếng Việt, cần chính xác cao, bảo mật tốt. Chọn gì?",
        options: [
          "Claude Sonnet/Opus — accuracy cao trên benchmark, giữ dấu VN tốt, enterprise no-train",
          "GPT-4 mini — rẻ nhất",
          "Gemini Flash — latency thấp nhất",
          "Open-source model chạy local — miễn phí",
        ],
        correct: 0,
        explanation:
          "Claude thắng ở 3 tiêu chí quan trọng cho case này: (1) MMLU/GPQA score cao → ít hallucination trên domain pháp lý, (2) giữ dấu tiếng Việt ổn định trên output dài, (3) Anthropic cam kết no-train ở tier API/Team+ (và TEE trên AWS Bedrock). Open-source local có privacy tốt nhưng accuracy trên pháp lý VN thường thua Claude.",
      },
      {
        question:
          "Metric nào SAI về cách so sánh AI tool?",
        options: [
          "Luôn dùng benchmark chuẩn (MMLU, GPQA) làm proxy cho chất lượng thực tế",
          "Đánh giá trên workload thực của bạn với eval set của bạn (held-out)",
          "Tính Total Cost of Ownership: giá API + latency * cost_of_delay + eng time để integrate",
          "Xem xét cả over-refusal — an toàn quá đôi khi từ chối cả prompt hợp lệ",
        ],
        correct: 0,
        explanation:
          "Benchmark chuẩn là proxy tốt nhưng KHÔNG thay thế được eval trên use case cụ thể. MMLU điểm cao không đảm bảo model phù hợp với domain của bạn (pháp lý VN, y tế, báo cáo tài chính). Luôn build eval set nội bộ từ workload thực tế và đo head-to-head.",
      },
      {
        question:
          "Bạn build agent tool-use có khả năng gửi email và chạy SQL. Tiêu chí Safety quan trọng hơn bình thường vì sao?",
        options: [
          "Agent có thể bị prompt injection từ email/document → gọi tool sai, hậu quả thật",
          "Safety chỉ quan trọng với chatbot dành cho trẻ em",
          "Agent luôn an toàn vì có tool-use",
          "Cost quan trọng hơn Safety",
        ],
        correct: 0,
        explanation:
          "Khi agent có quyền action có hậu quả (email, SQL, chuyển tiền), prompt injection không còn là vấn đề về text mà trở thành vấn đề thực thi code trái phép. Chọn model với safety score cao + dùng allowlist tool + human-in-the-loop cho action high-stakes. Xem thêm topic AI Privacy & Security.",
      },
      {
        question:
          "Chọn 1 phát biểu ĐÚNG về context window.",
        options: [
          "Context lớn hơn luôn tốt hơn — dùng càng nhiều càng ổn",
          "Context lớn giúp khi cần feed tài liệu dài, nhưng performance có thể degrade ở cuối context (lost-in-the-middle); phải test head-to-head",
          "Context window không ảnh hưởng chất lượng",
          "200K và 2M tokens cho chất lượng tương đương trên mọi workload",
        ],
        correct: 1,
        explanation:
          "Hiện tượng lost-in-the-middle (Liu et al. 2023) cho thấy nhiều model recall thông tin đầu/cuối context tốt hơn giữa. Context 2M không đảm bảo tận dụng hết 2M — phải benchmark cụ thể với needle-in-a-haystack test trên workload của bạn.",
      },
      {
        question:
          "Bạn dùng Gemini Pro qua Google Cloud Vertex AI ở region asia-southeast1 cho dữ liệu khách hàng VN. Privacy score tăng vì:",
        options: [
          "Google Cloud nằm ở Mỹ nên luôn bảo mật hơn",
          "Region Singapore cho data residency gần VN, latency thấp, và Vertex AI có cam kết không dùng data để train ở tier enterprise",
          "Không ảnh hưởng — privacy giống nhau mọi region",
          "Gemini tự động tuân thủ Nghị định 13/2023",
        ],
        correct: 1,
        explanation:
          "Chọn region gần (Singapore) cho data residency hợp lý với VN, latency thấp hơn, và tier enterprise của Vertex AI có DPA (Data Processing Agreement) cam kết no-train. Tuy nhiên, tuân thủ Nghị định 13/2023 là trách nhiệm của khách hàng — provider chỉ cung cấp công cụ kỹ thuật.",
      },
      {
        question:
          "TTFT (Time To First Token) thấp quan trọng với workload nào NHẤT?",
        options: [
          "Batch job offline tổng hợp báo cáo hàng tuần",
          "Chatbot realtime người dùng cuối — cảm giác 'phản hồi ngay' quan trọng với UX",
          "Vector index building",
          "Fine-tuning",
        ],
        correct: 1,
        explanation:
          "Với chatbot người dùng cuối, UX perception bị chi phối bởi TTFT — user cần thấy output xuất hiện trong <1s. Throughput (tok/s) quan trọng cho output dài, nhưng TTFT là first impression. Batch/offline workload không nhạy với TTFT.",
      },
      {
        question:
          "Chiến lược đa-model (multi-model routing) là gì và khi nào nên dùng?",
        options: [
          "Luôn gọi cả 3 model, chọn kết quả tốt nhất — để đảm bảo chất lượng",
          "Route query theo loại: simple Q&A → cheap/fast model; complex reasoning → flagship. Giảm chi phí mà giữ chất lượng trên bucket quan trọng",
          "Chỉ dùng khi có budget không giới hạn",
          "Không bao giờ hiệu quả — luôn stick với 1 model",
        ],
        correct: 1,
        explanation:
          "Multi-model routing thông minh: dùng classifier (có thể nhỏ/rẻ) phân loại query, route simple → Gemini Flash/GPT-4 mini, complex → Claude Opus/GPT-5. Tiết kiệm 40-70% chi phí, latency giảm cho bucket đơn giản. Luôn gọi 3 model song song chỉ hợp lý cho mission-critical và ngay cả khi đó thường chỉ dùng 2.",
      },
    ],
    []
  );

  /* ─────────────────────────────────────────────────────────────────
     RENDER
     ───────────────────────────────────────────────────────────────── */
  return (
    <>
      {/* ================================================================
          BƯỚC 1 — PREDICTION
          ================================================================ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Trong ba AI tool (ChatGPT, Claude, Gemini), tool nào 'tốt nhất' cho một doanh nghiệp Việt Nam 100 người dùng nội bộ với workload hỗn hợp (viết email, phân tích tài liệu, hỗ trợ code)?"
          options={[
            "ChatGPT — vì phổ biến nhất",
            "Claude — vì coding và văn bản dài tốt nhất",
            "Gemini — vì rẻ nhất và tích hợp Google Workspace",
            "Không có 'tốt nhất' — phụ thuộc trọng số 6 chiều (accuracy, cost, latency, safety, privacy, ease) ứng với use case cụ thể",
          ]}
          correct={3}
          explanation="Mỗi tool có hình dạng radar khác nhau trên 6 chiều. Chọn tool là bài toán trọng số: nếu công ty ưu tiên cost → Gemini thắng; nếu ưu tiên safety + accuracy → Claude; nếu ưu tiên ecosystem/ease → ChatGPT. Nhiều trường hợp optimal là kết hợp 2 tool (multi-model routing)."
        >
          <p className="mt-3 text-sm text-muted leading-relaxed">
            Topic này không phải là {'"tool nào tốt nhất"'}. Thay vào đó, chúng ta xây một
            framework 6 chiều có thể áp dụng cho BẤT KỲ so sánh AI tool nào — kể cả khi
            có tool mới ra mắt tuần sau.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ================================================================
          BƯỚC 2 — VISUALIZATION: RADAR + BENCHMARK
          ================================================================ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Radar so sánh">
        <VisualizationSection topicSlug={metadata.slug}>
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Radar 6 chiều × 3 tool
              </h3>
              <p className="mt-1 text-sm text-muted leading-relaxed">
                Bật/tắt từng tool để so sánh hình dạng. Điểm càng xa tâm = chiều đó càng tốt.
                Một tool {'"tốt toàn diện"'} sẽ có polygon lớn và cân; tool chuyên dụng sẽ có
                polygon lệch về phía chiều mạnh.
              </p>
            </div>

            {/* Tool toggles */}
            <div className="flex flex-wrap gap-2">
              {TOOLS.map((tool) => (
                <ToolToggle
                  key={tool.id}
                  tool={tool}
                  active={activeTools.has(tool.id)}
                  onToggle={() => toggleTool(tool.id)}
                />
              ))}
            </div>

            {/* Radar + per-tool score bars */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,380px)_1fr] lg:items-start">
              <div className="flex justify-center rounded-xl bg-surface p-4">
                <RadarChart tools={TOOLS} activeTools={activeTools} />
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Điểm tổng hợp
                  </p>
                  <div className="mt-2">
                    <ScoreBars active={activeTools} />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Giải thích 6 chiều
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {DIMENSIONS.map((d) => (
                      <li
                        key={d.id}
                        className="rounded-lg border border-border bg-card px-3 py-2 text-[12px]"
                      >
                        <span className="mr-1.5 font-mono text-[10px] font-semibold text-accent">
                          {d.short}
                        </span>
                        <span className="font-semibold text-foreground">
                          {d.label}
                        </span>
                        <span className="ml-1 text-muted">— {d.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Benchmark table */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Live benchmark table
                  </p>
                  <p className="text-xs text-muted">
                    Cột được chọn tốt nhất cho mỗi metric (trong các tool ON) được highlight xanh.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                  2025 · Q1
                </span>
              </div>
              <BenchmarkTable active={activeTools} />
            </div>

            <Callout variant="info" title="Cảnh báo: con số này là snapshot">
              Ngành AI thay đổi theo tuần. Số liệu này chính xác tại thời điểm viết (Q1 2025)
              dựa trên public benchmark. Trước khi commit tool cho dự án dài hạn, chạy eval
              riêng của bạn trên workload thực và theo dõi leaderboard (LMSYS Arena, HELM).
            </Callout>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ================================================================
          BƯỚC 3 — EXPLANATION
          ================================================================ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Giải thích">
        <ExplanationSection topicSlug={metadata.slug}>
          <p>
            <strong>Đánh giá AI tool là bài toán đa mục tiêu có trọng số.</strong>{" "}
            Không tồn tại thứ tự tổng thể (total order) trên tập tool — A có thể tốt hơn B
            ở chiều này và kém ở chiều khác. Cách duy nhất có câu trả lời ý nghĩa là:
            xác định workload cụ thể, gán trọng số cho từng chiều, rồi tính điểm gia quyền.
          </p>

          <Callout variant="insight" title="Công thức đánh giá gia quyền">
            <p>
              Với tool <LaTeX>{`t`}</LaTeX>, tập chiều <LaTeX>{`D = \\{d_1, ..., d_6\\}`}</LaTeX>,
              trọng số <LaTeX>{`w_i`}</LaTeX> với <LaTeX>{`\\sum w_i = 1`}</LaTeX>,
              điểm chuẩn hóa <LaTeX>{`s_i(t) \\in [0, 100]`}</LaTeX>:
            </p>
            <LaTeX block>
              {`\\text{Score}(t) = \\sum_{i=1}^{6} w_i \\cdot s_i(t)`}
            </LaTeX>
            <p className="mt-2">
              Tool tốt nhất là argmax trên Score. <strong>Chìa khóa: trọng số phụ thuộc USE CASE</strong>.
              Customer support volume cao: <LaTeX>{`w_{\\text{cost}} = 0.35`}</LaTeX>,{" "}
              <LaTeX>{`w_{\\text{latency}} = 0.25`}</LaTeX>, accuracy ít quan trọng hơn
              vì prompt đã được template hóa. Phân tích pháp lý: đảo ngược —{" "}
              <LaTeX>{`w_{\\text{accuracy}} = 0.40`}</LaTeX>,{" "}
              <LaTeX>{`w_{\\text{safety}} = 0.25`}</LaTeX>, cost ít quan trọng.
            </p>
          </Callout>

          <p>
            <strong>Cạm bẫy benchmark.</strong>{" "}
            MMLU, GPQA, HumanEval là proxy thuận tiện nhưng có ba vấn đề:
          </p>

          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>
              <strong>Contamination:</strong> nhiều benchmark công khai đã bị leak vào training data.
              Điểm cao có thể do model đã thấy đáp án, không phải do reasoning thực sự.
            </li>
            <li>
              <strong>Distribution shift:</strong> MMLU là multiple-choice. Workload của bạn có thể là
              open-ended generation. Điểm benchmark cao không đảm bảo output production tốt.
            </li>
            <li>
              <strong>Language bias:</strong> hầu hết benchmark bằng tiếng Anh.
              Performance trên tiếng Việt có thể chênh 10-20% so với English score.
            </li>
          </ul>

          <Callout variant="tip" title="Build eval set nội bộ">
            <div className="space-y-2 text-sm">
              <p>
                Giải pháp: xây <em>eval set nội bộ</em> 50–500 example từ workload thật.
                Mỗi example có: input, expected output, rubric chấm điểm.
              </p>
              <p>
                <strong>Quy trình:</strong>
              </p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Sample từ production log (đã masked PII).</li>
                <li>SME review và viết expected output.</li>
                <li>Chạy eval set qua mỗi candidate model.</li>
                <li>Chấm tự động (LLM-as-judge) + human spot-check.</li>
                <li>Track metric theo model version — re-run mỗi khi provider cập nhật.</li>
              </ol>
              <p>
                Đầu tư 2–3 ngày eng time để build eval set tiết kiệm hàng chục lần so với
                chọn model sai và phải migrate sau 6 tháng.
              </p>
            </div>
          </Callout>

          <CollapsibleDetail title="Total Cost of Ownership (TCO) — chi tiết">
            <div className="space-y-2 text-sm">
              <p>
                Giá API/1M token chỉ là một thành phần. TCO thực tế:
              </p>
              <LaTeX block>
                {`\\text{TCO} = C_{\\text{api}} + C_{\\text{infra}} + C_{\\text{eng}} + C_{\\text{delay}} + C_{\\text{migration}}`}
              </LaTeX>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>C_api:</strong> (input_tokens × price_in + output_tokens × price_out) × volume.
                </li>
                <li>
                  <strong>C_infra:</strong> orchestration, vector DB, caching, observability. Thường bị bỏ quên.
                </li>
                <li>
                  <strong>C_eng:</strong> thời gian kỹ sư để integrate, viết prompt, eval, fine-tune.
                  SDK kém document → C_eng cao.
                </li>
                <li>
                  <strong>C_delay:</strong> latency cao ảnh hưởng user, có thể quy thành $
                  (nghiên cứu: mỗi +100ms giảm conversion 1% trong e-commerce).
                </li>
                <li>
                  <strong>C_migration:</strong> nếu phải đổi model sau này, cost = rewrite prompt +
                  re-eval + re-deploy + downtime.
                </li>
              </ul>
              <p>
                Chọn tool rẻ nhất ở C_api có thể đắt nhất ở TCO nếu C_eng hoặc C_migration lớn.
                Claude pricing cao hơn Gemini ~2x nhưng nếu prompt portability tốt hơn → tiết kiệm C_migration.
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="Over-refusal — sai lầm của safety score đơn giản">
            <div className="space-y-2 text-sm">
              <p>
                Nhiều đánh giá coi safety = tỉ lệ từ chối prompt có hại. Nhưng cùng một policy
                chặt có thể từ chối cả prompt business hợp lệ. Ví dụ Claude/GPT-4 đôi khi
                refuse {'"viết đoạn quảng cáo thuốc giảm cân"'} vì policy về health advice,
                trong khi đây là use case marketing bình thường.
              </p>
              <p>
                <strong>Safety score đúng</strong> phải là F1 giữa:
              </p>
              <LaTeX block>
                {`\\text{Safety-F1} = \\frac{2 \\cdot P \\cdot R}{P + R}`}
              </LaTeX>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Precision:</strong> trong các prompt bị từ chối, bao nhiêu thực sự có hại.
                </li>
                <li>
                  <strong>Recall:</strong> trong các prompt có hại, bao nhiêu bị từ chối.
                </li>
              </ul>
              <p>
                Model có safety-F1 cao vừa không gây hại vừa không làm phiền user. Bộ test
                OverRefusalBench + HarmBench kết hợp cho đánh giá đầy đủ hơn dùng một bộ.
              </p>
            </div>
          </CollapsibleDetail>
        </ExplanationSection>
      </LessonSection>

      {/* ================================================================
          BƯỚC 4 — AHA MOMENT
          ================================================================ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Aha">
        <AhaMoment>
          Không có tool {'"tốt nhất"'} — chỉ có tool <strong>phù hợp nhất với trọng số
          ưu tiên của workload cụ thể</strong>. Thay vì hỏi {'"ChatGPT hay Claude tốt hơn?"'},
          hãy hỏi: {'"Với workload X, trọng số Y, tool nào maximize weighted score?"'}.
          Câu trả lời của câu hỏi thứ hai có thể thay đổi giữa các phòng ban trong cùng công ty.
        </AhaMoment>

        <Callout variant="warning" title="Đừng fall-in-love với một tool">
          Nhiều kỹ sư cá nhân có {'"favorite model"'} và tự động chọn nó cho mọi project.
          Đây là bias — hãy đánh giá bằng eval set, không bằng cảm giác. Hệ thống production
          nên được thiết kế để dễ swap model (LangChain, LiteLLM, abstraction layer),
          vì leader của năm nay có thể không phải của năm sau.
        </Callout>
      </LessonSection>

      {/* ================================================================
          BƯỚC 5 — CODE: EVAL RUNNER + MULTI-MODEL ROUTER
          ================================================================ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Code thực hành">
        <p className="mb-3 text-sm text-muted leading-relaxed">
          Hai đoạn code: (1) eval runner so sánh 3 tool trên eval set, (2) multi-model router
          để tiết kiệm chi phí mà vẫn giữ chất lượng trên bucket quan trọng.
        </p>

        <CodeBlock language="python" title="Head-to-head eval runner (Python)">
{`"""
head_to_head.py — run eval set against 3 providers, compute weighted score.

Usage:  python head_to_head.py eval_set.jsonl --weights weights.json
"""
import asyncio
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List

import anthropic
from openai import AsyncOpenAI
from google import genai

# ── Tool adapters (uniform interface) ───────────────────────────────────
class Tool:
    name: str
    async def generate(self, prompt: str) -> str: ...

class ChatGPT(Tool):
    name = "chatgpt"
    def __init__(self): self.client = AsyncOpenAI()
    async def generate(self, p):
        r = await self.client.chat.completions.create(
            model="gpt-4.1",
            messages=[{"role": "user", "content": p}],
        )
        return r.choices[0].message.content or ""

class Claude(Tool):
    name = "claude"
    def __init__(self): self.client = anthropic.AsyncAnthropic()
    async def generate(self, p):
        r = await self.client.messages.create(
            model="claude-opus-4-7",
            max_tokens=1024,
            messages=[{"role": "user", "content": p}],
        )
        return r.content[0].text

class Gemini(Tool):
    name = "gemini"
    def __init__(self): self.client = genai.Client()
    async def generate(self, p):
        r = await self.client.aio.models.generate_content(
            model="gemini-2.5-pro",
            contents=p,
        )
        return r.text

# ── LLM-as-judge scorer ─────────────────────────────────────────────────
JUDGE_PROMPT = '''
You are an evaluator. Given a prompt, an expected answer rubric,
and a model response, output a JSON object:
{"accuracy": 0-100, "safety": 0-100, "ease": 0-100, "notes": "..."}

Prompt: {prompt}
Expected rubric: {rubric}
Model response: {response}
'''

async def judge(prompt: str, rubric: str, response: str) -> dict:
    client = anthropic.AsyncAnthropic()
    j = await client.messages.create(
        model="claude-opus-4-7",
        max_tokens=512,
        messages=[{
            "role": "user",
            "content": JUDGE_PROMPT.format(
                prompt=prompt, rubric=rubric, response=response
            ),
        }],
    )
    return json.loads(j.content[0].text)

# ── Runner ───────────────────────────────────────────────────────────────
@dataclass
class EvalCase:
    prompt: str
    rubric: str

async def run_case(tool: Tool, case: EvalCase) -> dict:
    response = await tool.generate(case.prompt)
    scores   = await judge(case.prompt, case.rubric, response)
    return {"tool": tool.name, **scores}

async def main(cases: List[EvalCase], weights: Dict[str, float]):
    tools: List[Tool] = [ChatGPT(), Claude(), Gemini()]
    results: Dict[str, List[dict]] = {t.name: [] for t in tools}

    # Run cases in parallel across tools, sequential across cases
    for case in cases:
        case_results = await asyncio.gather(*(run_case(t, case) for t in tools))
        for r in case_results:
            results[r["tool"]].append(r)

    # Weighted aggregate
    report = {}
    for name, runs in results.items():
        avg = {k: sum(r[k] for r in runs) / len(runs)
               for k in ("accuracy", "safety", "ease")}
        weighted = sum(avg[k] * weights.get(k, 0) for k in avg)
        report[name] = {"avg": avg, "weighted": round(weighted, 2)}
    return report

if __name__ == "__main__":
    cases = [
        EvalCase(**json.loads(line))
        for line in Path("eval_set.jsonl").read_text().splitlines()
    ]
    weights = {"accuracy": 0.5, "safety": 0.25, "ease": 0.25}
    print(json.dumps(asyncio.run(main(cases, weights)), indent=2))
`}
        </CodeBlock>

        <CodeBlock language="typescript" title="Multi-model router (TypeScript)">
{`/**
 * router.ts — classify query, route to cheap/fast model for simple tasks
 * and flagship for complex reasoning. Typical savings: 50-70%.
 */
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

type Complexity = "simple" | "medium" | "complex";

interface ModelChoice {
  provider: "openai" | "anthropic" | "google";
  model: string;
  estCostPer1M: number;
}

const ROUTES: Record<Complexity, ModelChoice> = {
  simple:  { provider: "google",    model: "gemini-2.5-flash",    estCostPer1M: 0.75 },
  medium:  { provider: "openai",    model: "gpt-4.1-mini",        estCostPer1M: 3.00 },
  complex: { provider: "anthropic", model: "claude-opus-4-7",     estCostPer1M: 18.0 },
};

/* ── Step 1: classify with a tiny, cheap model ──────────────────────── */
const classifier = new OpenAI();
async function classifyComplexity(query: string): Promise<Complexity> {
  const res = await classifier.chat.completions.create({
    model: "gpt-4.1-nano",
    messages: [
      {
        role: "system",
        content: \`Classify the query complexity. Output ONE token: simple | medium | complex.
- simple: short factual question, greeting, single-step task.
- medium: multi-step reasoning or moderate analysis (100-500 tokens out).
- complex: long document analysis, coding, multi-hop reasoning, legal/medical.\`,
      },
      { role: "user", content: query },
    ],
    max_tokens: 4,
    temperature: 0,
  });
  const label = res.choices[0].message.content?.trim().toLowerCase();
  if (label === "simple" || label === "medium" || label === "complex") return label;
  return "medium"; // safe fallback
}

/* ── Step 2: dispatch to chosen provider ───────────────────────────── */
const openai    = new OpenAI();
const anthropic = new Anthropic();
const google    = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function callModel(choice: ModelChoice, query: string): Promise<string> {
  if (choice.provider === "openai") {
    const r = await openai.chat.completions.create({
      model: choice.model,
      messages: [{ role: "user", content: query }],
    });
    return r.choices[0].message.content ?? "";
  }
  if (choice.provider === "anthropic") {
    const r = await anthropic.messages.create({
      model: choice.model,
      max_tokens: 2048,
      messages: [{ role: "user", content: query }],
    });
    return r.content[0].type === "text" ? r.content[0].text : "";
  }
  // google
  const m = google.getGenerativeModel({ model: choice.model });
  const r = await m.generateContent(query);
  return r.response.text();
}

/* ── Public entry ──────────────────────────────────────────────────── */
export async function route(query: string) {
  const complexity = await classifyComplexity(query);
  const choice     = ROUTES[complexity];
  const start      = Date.now();
  const answer     = await callModel(choice, query);
  const ms         = Date.now() - start;

  return {
    answer,
    meta: {
      complexity,
      model: \`\${choice.provider}/\${choice.model}\`,
      est_cost_per_1m_tok: choice.estCostPer1M,
      latency_ms: ms,
    },
  };
}

// Example usage
// const r = await route("What is 2+2?");
// → complexity=simple, model=gemini-2.5-flash, cost=$0.75/1M
`}
        </CodeBlock>

        <Callout variant="tip" title="Hiệu quả thực tế của router">
          Trên workload support chatbot (85% query là simple/FAQ, 10% medium, 5% complex),
          router giảm ~65% chi phí so với dùng flagship cho mọi query. Latency trung bình
          cũng giảm vì đa số query được serve bởi Flash model có TTFT ~300ms.
        </Callout>
      </LessonSection>

      {/* ================================================================
          BƯỚC 6 — INLINE CHALLENGES
          ================================================================ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Thử thách">
        <div className="space-y-5">
          <InlineChallenge
            question="Một công ty fintech VN cần chatbot kiểm tra trạng thái giao dịch cho khách hàng (8M request/tháng, 90% là FAQ đơn giản, 10% là case phức tạp cần escalate). Kiến trúc model nào tối ưu?"
            options={[
              "Dùng Claude Opus cho tất cả — chất lượng nhất",
              "Multi-model router: Gemini Flash cho 90% FAQ (rẻ, nhanh), Claude Sonnet cho 10% complex. Tiết kiệm ~70% chi phí mà vẫn giữ chất lượng cho bucket khó.",
              "Dùng GPT-4 flagship vì phổ biến",
              "Tự train model riêng — tiết kiệm nhất dài hạn",
            ]}
            correct={1}
            explanation="Đây là textbook multi-model routing. 90% query đơn giản không cần flagship — Flash đáp ứng tốt với giá 1/10. 10% phức tạp cần Claude để trả lời chính xác. Self-training model cho fintech rất tốn (hàng triệu $ + team ML) và không chắc vượt được flagship commercial."
          />

          <InlineChallenge
            question="Sếp yêu cầu so sánh 3 AI tool và quyết định chọn 1 cho toàn công ty trong 1 tuần. Cách làm ĐÚNG NHẤT là?"
            options={[
              "Đọc review trên YouTube/Reddit và tổng hợp",
              "Build eval set 50-100 example từ workload thực tế, chạy head-to-head với rubric rõ ràng, present kết quả có số liệu; nếu sát nhau, khuyến nghị multi-model thay vì chọn 1",
              "Chọn tool phổ biến nhất trên Twitter",
              "Yêu cầu thêm 3 tháng để nghiên cứu kỹ",
            ]}
            correct={1}
            explanation="Eval-driven evaluation là gold standard. Review bên thứ 3 không reflect workload của bạn. Áp đặt lựa chọn dựa trên popularity dễ dẫn đến quyết định tệ. Nếu 3 tool sát nhau trên eval set, đúng câu trả lời kỹ thuật là 'dùng đa model qua abstraction layer' — không khóa vào 1 vendor."
          />
        </div>
      </LessonSection>

      {/* ================================================================
          BƯỚC 7 — USE CASE MATRIX
          ================================================================ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Use case matrix">
        <p className="mb-3 text-sm text-muted leading-relaxed">
          Kết hợp 6 chiều lại thành ma trận ra quyết định cho 5 use case điển hình ở VN.
        </p>

        <Callout variant="insight" title="Ma trận Use Case → Trọng số → Tool gợi ý">
          <div className="space-y-3 text-sm">
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="font-semibold text-foreground">
                1. Customer support chatbot (volume cao, workload đơn giản)
              </p>
              <p className="mt-1 text-muted">
                Trọng số: cost 0.35, latency 0.25, accuracy 0.15, ease 0.15, safety 0.05, privacy 0.05.
                Tool phù hợp: <strong>Gemini Flash</strong> (primary) + <strong>Claude Sonnet</strong>{" "}
                (escalation).
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="font-semibold text-foreground">
                2. Phân tích hợp đồng pháp lý (độ chính xác quan trọng)
              </p>
              <p className="mt-1 text-muted">
                Trọng số: accuracy 0.40, safety 0.20, privacy 0.20, cost 0.10, ease 0.05, latency 0.05.
                Tool phù hợp: <strong>Claude Opus</strong> qua AWS Bedrock (TEE) hoặc Enterprise tier.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="font-semibold text-foreground">
                3. Code assistant cho dev team
              </p>
              <p className="mt-1 text-muted">
                Trọng số: accuracy 0.35, ease 0.25, latency 0.20, cost 0.10, safety 0.05, privacy 0.05.
                Tool phù hợp: <strong>Claude</strong> (via API hoặc GitHub Copilot nếu team đã dùng VSCode)
                — HumanEval top, reasoning coding cao.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="font-semibold text-foreground">
                4. Content marketing (volume vừa, creativity + Vietnamese)
              </p>
              <p className="mt-1 text-muted">
                Trọng số: accuracy 0.25, ease 0.25, cost 0.20, safety 0.15, latency 0.10, privacy 0.05.
                Tool phù hợp: <strong>ChatGPT</strong> (DALL-E tích hợp cho hình ảnh) hoặc{" "}
                <strong>Claude</strong> (giữ dấu VN ổn định hơn trên bài dài).
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="font-semibold text-foreground">
                5. Internal knowledge base search (RAG cho tài liệu công ty)
              </p>
              <p className="mt-1 text-muted">
                Trọng số: privacy 0.30, accuracy 0.25, cost 0.15, latency 0.15, safety 0.10, ease 0.05.
                Tool phù hợp: <strong>Claude Enterprise</strong> hoặc{" "}
                <strong>Gemini for Workspace</strong> — cả hai có DPA và no-train commitment.
                Xem thêm{" "}
                <TopicLink slug="ai-privacy-security">AI Privacy &amp; Security</TopicLink>.
              </p>
            </div>
          </div>
        </Callout>

        <Callout variant="warning" title="Lỗi phổ biến khi chọn tool">
          <div className="space-y-2 text-sm">
            <p>
              <strong>1. Chọn theo hype:</strong> tool mới ra luôn được ca ngợi. Chờ 4-8 tuần,
              đợi benchmark độc lập và feedback cộng đồng trước khi migrate production.
            </p>
            <p>
              <strong>2. Vendor lock-in ngẫu nhiên:</strong> viết prompt phụ thuộc quirks của 1 model,
              fine-tune trên platform đóng. Migration cost cao về sau. Thiết kế portable từ đầu.
            </p>
            <p>
              <strong>3. Bỏ qua TCO:</strong> tính chi phí chỉ bằng giá API.
              Thêm C_eng + C_infra + C_delay vào tổng.
            </p>
            <p>
              <strong>4. Không có exit plan:</strong> nếu provider ngừng dịch vụ hoặc tăng giá 3x,
              mất bao lâu để chuyển? Kiểm tra qua drill định kỳ.
            </p>
          </div>
        </Callout>
      </LessonSection>

      {/* ================================================================
          BƯỚC 8 — SUMMARY
          ================================================================ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="6 điểm cốt lõi khi đánh giá AI tool"
          points={[
            "Đánh giá AI tool là bài toán đa chiều có trọng số: Accuracy, Cost, Latency, Safety, Privacy, Ease-of-use. Không có thứ tự tổng thể — chỉ có argmax gia quyền theo use case.",
            "Benchmark công khai (MMLU, GPQA, HumanEval) là proxy hữu ích nhưng có contamination, distribution shift, và language bias. Xây eval set nội bộ 50-500 example từ workload thực.",
            "TCO = C_api + C_infra + C_eng + C_delay + C_migration. Tool rẻ nhất ở C_api có thể đắt nhất tổng thể. Abstraction layer (LiteLLM, LangChain) giảm C_migration.",
            "Multi-model routing là chiến lược tiết kiệm 50-70% chi phí: classify query → simple/medium → cheap model, complex → flagship. Đặc biệt hiệu quả cho workload có long tail.",
            "Safety score đúng là F1 giữa harm-block precision và recall. Over-refusal cũng là failure mode. Bộ HarmBench + OverRefusalBench cho đánh giá đầy đủ.",
            "Privacy gắn với compliance: enterprise tier no-train, data residency region, TEE/confidential compute, DPA cho cross-border transfer. Xem AI Privacy & Security để đi sâu.",
          ]}
        />
      </LessonSection>

      {/* ================================================================
          BƯỚC 9 — QUIZ
          ================================================================ */}
      <LessonSection step={9} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <ProgressSteps total={TOTAL_STEPS} current={TOTAL_STEPS} />
        <div className="mt-4">
          <QuizSection questions={quizQuestions} />
        </div>
      </LessonSection>
    </>
  );
}
