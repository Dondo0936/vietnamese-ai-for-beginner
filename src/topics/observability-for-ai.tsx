"use client";
import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate, AhaMoment, InlineChallenge, Callout, CollapsibleDetail,
  MiniSummary, CodeBlock, LessonSection, LaTeX, TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "observability-for-ai",
  title: "Observability for AI Systems",
  titleVi: "Quan sát hệ thống AI — Trace, Log, Metric cho LLM app",
  description:
    "Đưa hệ thống LLM ra production cần quan sát được từng bước: distributed tracing đa tầng (retrieval + LLM + tool), metric p50/p95, structured logs có PII-safe redaction, và cảnh báo khi drift. Khung observability AI-native khác biệt với APM truyền thống như thế nào.",
  category: "infrastructure",
  tags: ["observability", "tracing", "metrics", "logging", "langfuse"],
  difficulty: "advanced",
  relatedSlugs: ["monitoring", "mlops", "agent-evaluation", "cost-latency-tokens", "model-serving"],
  vizType: "interactive",
};

// ──────────────────────────────────────────────────────────────────────
// DỮ LIỆU CHÍNH — 8 span của một request RAG + agentic workflow
// ──────────────────────────────────────────────────────────────────────

type SpanId =
  | "input.classify"
  | "retrieve.embed"
  | "retrieve.vector_search"
  | "retrieve.rerank"
  | "llm.generate"
  | "tool.call.query_db"
  | "llm.generate.continuation"
  | "postprocess.format";

type SpanStatus = "ok" | "warn" | "error";

interface SpanRecord {
  id: SpanId;
  label: string;
  kind: "router" | "retrieval" | "llm" | "tool" | "post";
  startMs: number;
  durationMs: number;
  // TTFT (time-to-first-token) tính từ đầu span. Chỉ có ý nghĩa với span LLM.
  ttftMs?: number;
  tokensIn?: number;
  tokensOut?: number;
  costUsd: number;
  model?: string;
  tool?: string;
  inputPreview: string;
  outputPreview: string;
  status: SpanStatus;
  errorNote?: string;
  // child span — dùng cho retry khi tool lỗi.
  child?: SpanRecord;
}

type FaultMode = "none" | "retrieval_timeout" | "llm_slow" | "tool_5xx";

const BASE_SPANS: SpanRecord[] = [
  {
    id: "input.classify", label: "input.classify", kind: "router",
    startMs: 0, durationMs: 78, tokensIn: 48, tokensOut: 6, costUsd: 0.0001,
    model: "router-small-v2",
    inputPreview: 'user: "Đơn A-2031 bao giờ giao?"',
    outputPreview: 'intent=order_status, entity=order_id:"A-2031"',
    status: "ok",
  },
  {
    id: "retrieve.embed", label: "retrieve.embed", kind: "retrieval",
    startMs: 80, durationMs: 56, tokensIn: 14, tokensOut: 0, costUsd: 0.00002,
    model: "text-embedding-3-small",
    inputPreview: '"Đơn A-2031 bao giờ giao?"',
    outputPreview: "vector<1536> (L2 norm=1.0)",
    status: "ok",
  },
  {
    id: "retrieve.vector_search", label: "retrieve.vector_search", kind: "retrieval",
    startMs: 140, durationMs: 220, costUsd: 0.0003, tool: "pgvector.knn",
    inputPreview: "top_k=20, filter=tenant_id=t_91",
    outputPreview: "20 chunks, score ∈ [0.42, 0.89]",
    status: "ok",
  },
  {
    id: "retrieve.rerank", label: "retrieve.rerank", kind: "retrieval",
    startMs: 365, durationMs: 340, tokensIn: 2400, tokensOut: 0, costUsd: 0.0009,
    model: "cohere-rerank-v3",
    inputPreview: "20 chunks → rerank, keep top_k=5",
    outputPreview: "5 chunks, score ∈ [0.71, 0.94]",
    status: "ok",
  },
  {
    id: "llm.generate", label: "llm.generate", kind: "llm",
    startMs: 710, durationMs: 2200, ttftMs: 620,
    tokensIn: 1840, tokensOut: 210, costUsd: 0.0184,
    model: "claude-sonnet-4.7",
    inputPreview: "system + 5 chunks + user query",
    outputPreview: 'Để tra đơn, tôi cần gọi tool orders.get(order_id="A-2031") …',
    status: "ok",
  },
  {
    id: "tool.call.query_db", label: "tool.call.query_db", kind: "tool",
    startMs: 2915, durationMs: 420, costUsd: 0.00005, tool: "orders.get",
    inputPreview: 'order_id="A-2031"',
    outputPreview: "order_id=A-2031, status=in_transit, eta=2026-04-20, carrier=GHN",
    status: "ok",
  },
  {
    id: "llm.generate.continuation", label: "llm.generate.continuation", kind: "llm",
    startMs: 3340, durationMs: 1180, ttftMs: 390,
    tokensIn: 2050, tokensOut: 84, costUsd: 0.0096,
    model: "claude-sonnet-4.7",
    inputPreview: "trước + tool_result(orders.get)",
    outputPreview: "Đơn A-2031 đang vận chuyển qua GHN, dự kiến giao 20/04/2026.",
    status: "ok",
  },
  {
    id: "postprocess.format", label: "postprocess.format", kind: "post",
    startMs: 4525, durationMs: 18, costUsd: 0, tool: "formatter.md",
    inputPreview: "raw LLM output",
    outputPreview: "markdown có link theo dõi đơn",
    status: "ok",
  },
];

// Áp dụng fault injection — trả về span list biến thể.
function applyFault(spans: SpanRecord[], fault: FaultMode): SpanRecord[] {
  if (fault === "none") return spans;
  const next = spans.map((s) => ({ ...s }));

  if (fault === "retrieval_timeout") {
    // vector_search kéo dài 3.5s rồi error → các span sau lùi lại.
    const idx = next.findIndex((s) => s.id === "retrieve.vector_search");
    next[idx] = {
      ...next[idx], durationMs: 3500, status: "error",
      errorNote: "DeadlineExceeded sau 3500ms. pgvector pool cạn connection, query xếp hàng.",
      outputPreview: "timeout — không có chunks",
    };
    const shift = 3500 - 220;
    for (let i = idx + 1; i < next.length; i += 1) next[i].startMs += shift;
  } else if (fault === "llm_slow") {
    const idx = next.findIndex((s) => s.id === "llm.generate");
    const add = 2800;
    next[idx] = {
      ...next[idx],
      durationMs: next[idx].durationMs + add,
      ttftMs: (next[idx].ttftMs ?? 0) + 900,
      status: "warn",
      errorNote: "Decode chậm — model bị throttle hoặc input context quá dài. p95 chạm SLO.",
    };
    for (let i = idx + 1; i < next.length; i += 1) next[i].startMs += add;
  } else if (fault === "tool_5xx") {
    const idx = next.findIndex((s) => s.id === "tool.call.query_db");
    const original = next[idx];
    const retryStart = original.startMs + original.durationMs;
    const retryDur = 380;
    next[idx] = {
      ...original, durationMs: 260, status: "error",
      errorNote: "HTTP 503 từ orders-service. Circuit breaker chưa mở.",
      outputPreview: "Error: service unavailable (after 260ms)",
      child: {
        id: "tool.call.query_db", label: "tool.call.query_db (retry #1)",
        kind: "tool", startMs: retryStart, durationMs: retryDur,
        costUsd: 0.00005, tool: "orders.get",
        inputPreview: 'order_id="A-2031" (retry)',
        outputPreview: "order_id=A-2031, status=in_transit, eta=2026-04-20, carrier=GHN",
        status: "ok",
      },
    };
    const add = retryDur;
    for (let i = idx + 1; i < next.length; i += 1) next[i].startMs += add;
  }
  return next;
}

// Chuỗi baseline cho biểu đồ p50/p95 (20 request gần nhất, tổng hợp mô phỏng).
const BASELINE_SERIES = [
  4200, 4480, 4330, 4610, 4250, 4410, 4720, 4380, 4550, 4390, 4460, 4610, 4290,
  4500, 4720, 4380, 4430, 4610, 4300, 4540,
];

function appendLatency(series: number[], nextWallClockMs: number): number[] {
  return [...series.slice(1), Math.round(nextWallClockMs)];
}

function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

const KIND_COLOR: Record<SpanRecord["kind"], string> = {
  router: "#64748b", retrieval: "#3b82f6", llm: "#8b5cf6", tool: "#eab308", post: "#14b8a6",
};
const STATUS_RING: Record<SpanStatus, string> = {
  ok: "rgba(34,197,94,0.75)", warn: "rgba(234,179,8,0.85)", error: "rgba(239,68,68,0.95)",
};

const TOTAL_STEPS = 9;

// ──────────────────────────────────────────────────────────────────────
// COMPONENT CHÍNH
// ──────────────────────────────────────────────────────────────────────

export default function ObservabilityForAiTopic() {
  const [fault, setFault] = useState<FaultMode>("none");
  const [activeSpan, setActiveSpan] = useState<SpanId | null>("llm.generate");
  const [latencySeries, setLatencySeries] = useState<number[]>(BASELINE_SERIES);

  const spans = useMemo(() => applyFault(BASE_SPANS, fault), [fault]);

  // Wall-clock = max(end của mọi span), kể cả child.
  const wallClockMs = useMemo(() => {
    let end = 0;
    for (const s of spans) {
      end = Math.max(end, s.startMs + s.durationMs);
      if (s.child) {
        end = Math.max(end, s.child.startMs + s.child.durationMs);
      }
    }
    return end;
  }, [spans]);

  const totalTokens = useMemo(
    () =>
      spans.reduce(
        (acc, s) => acc + (s.tokensIn ?? 0) + (s.tokensOut ?? 0),
        0,
      ),
    [spans],
  );

  const totalCost = useMemo(
    () =>
      spans.reduce(
        (acc, s) => acc + s.costUsd + (s.child ? s.child.costUsd : 0),
        0,
      ),
    [spans],
  );

  const overallStatus: SpanStatus = useMemo(() => {
    if (spans.some((s) => s.status === "error" && !s.child)) return "error";
    if (spans.some((s) => s.status === "warn")) return "warn";
    if (spans.some((s) => s.status === "error" && s.child)) return "warn";
    return "ok";
  }, [spans]);

  const activeRecord = useMemo(() => {
    if (!activeSpan) return null;
    for (const s of spans) {
      if (s.id === activeSpan) return s;
      if (s.child && s.child.id === activeSpan) return s.child;
    }
    return null;
  }, [activeSpan, spans]);

  const injectFault = useCallback(
    (mode: FaultMode) => {
      setFault(mode);
      // Cập nhật biểu đồ p50/p95 theo wall-clock mới nhất sau fault.
      const mutated = applyFault(BASE_SPANS, mode);
      let end = 0;
      for (const s of mutated) {
        end = Math.max(end, s.startMs + s.durationMs);
        if (s.child) end = Math.max(end, s.child.startMs + s.child.durationMs);
      }
      setLatencySeries((prev) => appendLatency(prev, end));
    },
    [],
  );

  const resetTrace = useCallback(() => {
    setFault("none");
    setActiveSpan("llm.generate");
    setLatencySeries(BASELINE_SERIES);
  }, []);

  // ──────────────────────────────────────────────────────────────────
  // QUIZ — 8 câu, 2 fill-blank
  // ──────────────────────────────────────────────────────────────────
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "Ba trụ cột của observability là gì và vai trò từng cái ra sao?",
        options: [
          "Traces, Metrics, Dashboards — cả ba đều đo hiệu suất",
          "Traces (chuỗi span mô tả một request), Metrics (đếm/đo tổng hợp theo thời gian), Logs (event chi tiết) — mỗi cái trả lời một câu hỏi khác nhau",
          "Logs, Alerts, Graphs — tập trung vào cảnh báo",
          "Prompts, Completions, Embeddings — dành riêng cho LLM",
        ],
        correct: 1,
        explanation:
          "Traces trả lời 'đường đi của MỘT request', metrics trả lời 'hành vi TỔNG HỢP theo thời gian', logs trả lời 'chính xác chuyện gì đã xảy ra tại một điểm'. Thiếu một trụ cột thì debug production sẽ mù một nửa.",
      },
      {
        question:
          "Vì sao APM truyền thống (DataDog, New Relic) chưa đủ cho LLM app, dù đã có tracing?",
        options: [
          "APM truyền thống chậm hơn",
          "APM truyền thống không hiểu prompt, token, model version, retrieval chunks, tool call — cần AI-native observability (Langfuse, Phoenix, LangSmith) bổ sung",
          "APM truyền thống không hỗ trợ Python",
          "APM truyền thống quá đắt",
        ],
        correct: 1,
        explanation:
          "APM thấy 'HTTP POST /chat = 8s' nhưng không biết nội bộ: prompt gì, retrieval lấy chunk nào, model trả bao nhiêu token, tool gọi ra sao. AI-native observability gắn các attribute gen_ai.* lên span để debug đúng nguyên nhân.",
      },
      {
        question:
          "Vì sao p95 latency quan trọng hơn mean cho LLM app đối diện người dùng?",
        options: [
          "Vì mean khó tính hơn",
          "Vì phân phối latency LLM lệch phải (long tail) — mean bị che bởi đuôi chậm, p95 phản ánh trải nghiệm của người dùng tệ nhất 5%",
          "Vì p95 luôn thấp hơn mean",
          "Vì p95 chính xác hơn về mặt thống kê",
        ],
        correct: 1,
        explanation:
          "Latency LLM có long tail do model throttle, context dài, retrieval chậm. Mean = 2s trông ổn, nhưng p95 = 12s nghĩa là 5% user chờ 12 giây — họ rời app. SLO production luôn viết theo p95/p99, không theo mean.",
      },
      {
        type: "fill-blank",
        question:
          "OpenTelemetry semantic conventions cho GenAI đặt tất cả attribute dưới namespace {blank}.*, ví dụ model hỏi được đặt tên là gen_ai.request.{blank}.",
        blanks: [
          { answer: "gen_ai", accept: ["genai", "gen-ai"] },
          { answer: "model", accept: ["model_id"] },
        ],
        explanation:
          "OTel chuẩn hóa attribute cho LLM: gen_ai.request.model, gen_ai.usage.input_tokens, gen_ai.usage.output_tokens, gen_ai.response.finish_reason. Dùng semantic conventions giúp swap backend (Langfuse ↔ Phoenix ↔ Helicone) mà không phải đổi code instrumentation.",
      },
      {
        question:
          "Vì sao log prompt và output LLM cần redaction (che mờ PII) trước khi gửi đi storage?",
        options: [
          "Để tiết kiệm dung lượng",
          "Vì prompt + output có thể chứa email, số điện thoại, CCCD, thông tin y tế — lưu nguyên bản vi phạm quy định bảo mật và tăng bề mặt tấn công khi kho log bị lộ",
          "Vì log không nén được nếu có PII",
          "Vì prompt không phải dữ liệu người dùng",
        ],
        correct: 1,
        explanation:
          "Prompt/output thường chứa PII được người dùng dán vào. Pattern chuẩn: hash hoặc masking bằng regex (email, phone, ID) ở SDK trước khi gửi tới backend; chỉ giữ bản gốc trong vùng lưu trữ có kiểm soát truy cập. Kết hợp với sampling để giảm lượng nhạy cảm ra ngoài.",
      },
      {
        question:
          "Head sampling và tail sampling khác nhau ở điểm nào, và khi nào chọn tail?",
        options: [
          "Không có khác biệt, chỉ là tên gọi",
          "Head sampling quyết định giữ/bỏ trace ngay khi span đầu bắt đầu (rẻ, mất trace lỗi hiếm); tail sampling đợi trace xong rồi quyết định (đắt nhưng luôn giữ trace lỗi/chậm) — chọn tail khi cần debug tail latency",
          "Head sampling dành cho frontend, tail cho backend",
          "Head sampling chậm hơn tail sampling",
        ],
        correct: 1,
        explanation:
          "Head: sampler = ParentBased + TraceIdRatio, quyết định ở lúc bắt đầu span. Rẻ nhưng dễ bỏ sót trace lỗi vì lỗi thường hiếm. Tail: gom toàn bộ span, quyết định sau (giữ nếu duration > p95 hoặc status = error). OTel Collector tail sampling processor là triển khai phổ biến.",
      },
      {
        type: "fill-blank",
        question:
          "Data drift là phân phối input thay đổi: P_prod(X) ≠ P_train(X). Còn {blank} drift là khi quan hệ input → output thay đổi: P_prod(Y|X) ≠ P_train(Y|X). Cả hai đều phải theo dõi qua metric liên tục, kết hợp với {blank} — tập trace baseline chạy hàng ngày.",
        blanks: [
          { answer: "concept", accept: ["khái niệm", "khai niem"] },
          { answer: "golden trace", accept: ["golden set", "golden", "canary"] },
        ],
        explanation:
          "Data drift phát hiện bằng PSI/KL; concept drift cần ground-truth (thường trễ). Golden trace là vài chục request nominal lưu sẵn, chạy mỗi sáng — nếu latency/token/output khác baseline > ngưỡng, alert ngay, giúp phát hiện drift sớm hơn nhiều so với chờ user báo.",
      },
      {
        question:
          "Langfuse (SaaS hoặc self-hosted) và Phoenix/Arize là công cụ AI-native phổ biến. Khi nào chọn self-hosted thay vì SaaS?",
        options: [
          "Luôn chọn SaaS vì rẻ hơn",
          "Luôn chọn self-hosted vì bảo mật hơn",
          "Chọn self-hosted khi prompt/output chứa PII không được rời mạng nội bộ (y tế, tài chính, khu vực bị ràng buộc quyền riêng tư); chọn SaaS khi muốn ship nhanh và không có đội ops",
          "Không có khác biệt đáng kể",
        ],
        correct: 2,
        explanation:
          "Đánh đổi điển hình: SaaS = tốc độ + không phải vận hành, nhưng dữ liệu ra ngoài. Self-hosted = kiểm soát dữ liệu + chi phí tuân thủ thấp, nhưng cần đội DevOps, Postgres, S3, TLS, IAM. Langfuse bản open-source deploy bằng Docker Compose/Kubernetes; Phoenix chạy local cho dev và cluster cho prod.",
      },
    ],
    [],
  );

  // ──────────────────────────────────────────────────────────────────
  // RENDER — trace waterfall
  // ──────────────────────────────────────────────────────────────────

  const renderWaterfall = () => {
    // Scale thời gian theo wall-clock hiện tại (padding 5%).
    const scaleMax = Math.max(wallClockMs * 1.05, 5200);
    const rowH = 34;
    const labelW = 180;
    const chartW = 520;
    const chartH = spans.reduce((acc, s) => acc + rowH * (s.child ? 2 : 1), 0) + 16;

    let yCursor = 8;

    return (
      <svg
        viewBox={`0 0 ${labelW + chartW + 16} ${chartH}`}
        className="w-full"
      >
        {/* Lưới trục thời gian */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const x = labelW + t * chartW;
          return (
            <g key={t}>
              <line
                x1={x}
                y1={0}
                x2={x}
                y2={chartH}
                stroke="var(--border)"
                strokeOpacity={0.35}
                strokeDasharray="2 3"
              />
              <text x={x} y={10} fontSize={11} fill="#94a3b8" textAnchor="middle">
                {Math.round(scaleMax * t)}ms
              </text>
            </g>
          );
        })}

        {spans.map((s) => {
          const xStart = labelW + (s.startMs / scaleMax) * chartW;
          const width = Math.max(2, (s.durationMs / scaleMax) * chartW);
          const y = yCursor;
          const isActive = activeSpan === s.id;
          const fill = KIND_COLOR[s.kind];
          const ring = STATUS_RING[s.status];

          const barOpacity = s.status === "error" ? 0.85 : 0.75;

          const rowNode = (
            <g
              key={s.id}
              className="cursor-pointer"
              onClick={() => setActiveSpan(s.id)}
            >
              {/* Nhãn span */}
              <text
                x={labelW - 8}
                y={y + 14}
                fontSize={11}
                textAnchor="end"
                fontFamily="ui-monospace, Menlo, monospace"
                fill={isActive ? "#f8fafc" : "#cbd5e1"}
              >
                {s.label}
              </text>
              {/* Thanh bar */}
              <motion.rect
                x={xStart}
                y={y + 4}
                rx={3}
                ry={3}
                height={18}
                width={width}
                fill={s.status === "error" ? "#ef4444" : fill}
                fillOpacity={barOpacity}
                stroke={isActive ? "#f8fafc" : ring}
                strokeWidth={isActive ? 2 : 1.2}
                initial={false}
                animate={{ x: xStart, width }}
                transition={{ type: "spring", stiffness: 180, damping: 24 }}
              />
              {/* TTFT marker (chỉ span llm) */}
              {s.ttftMs !== undefined && (
                <motion.line
                  x1={xStart + (s.ttftMs / s.durationMs) * width}
                  x2={xStart + (s.ttftMs / s.durationMs) * width}
                  y1={y + 2}
                  y2={y + 24}
                  stroke="#fde68a"
                  strokeWidth={1.6}
                  strokeDasharray="3 2"
                  initial={false}
                  animate={{
                    x1: xStart + (s.ttftMs / s.durationMs) * width,
                    x2: xStart + (s.ttftMs / s.durationMs) * width,
                  }}
                  transition={{ type: "spring", stiffness: 180, damping: 24 }}
                />
              )}
              {/* Nhãn duration bên phải bar */}
              <text
                x={xStart + width + 6}
                y={y + 17}
                fontSize={11}
                fill="#94a3b8"
                fontFamily="ui-monospace, Menlo, monospace"
              >
                {s.durationMs}ms
              </text>
            </g>
          );

          yCursor += rowH;

          // Retry child
          let childNode = null;
          if (s.child) {
            const cStart =
              labelW + (s.child.startMs / scaleMax) * chartW;
            const cW = Math.max(2, (s.child.durationMs / scaleMax) * chartW);
            const cy = yCursor;
            childNode = (
              <g
                key={`${s.id}-child`}
                className="cursor-pointer"
                onClick={() => setActiveSpan(s.child!.id)}
              >
                <text
                  x={labelW - 8}
                  y={cy + 14}
                  fontSize={11}
                  textAnchor="end"
                  fontFamily="ui-monospace, Menlo, monospace"
                  fill="#94a3b8"
                >
                  ↳ retry
                </text>
                <motion.rect
                  x={cStart}
                  y={cy + 6}
                  rx={3}
                  ry={3}
                  height={14}
                  width={cW}
                  fill={KIND_COLOR[s.child.kind]}
                  fillOpacity={0.8}
                  stroke="rgba(34,197,94,0.7)"
                  strokeWidth={1.2}
                  initial={false}
                  animate={{ x: cStart, width: cW }}
                  transition={{ type: "spring", stiffness: 180, damping: 24 }}
                />
                <text
                  x={cStart + cW + 6}
                  y={cy + 16}
                  fontSize={11}
                  fill="#94a3b8"
                  fontFamily="ui-monospace, Menlo, monospace"
                >
                  {s.child.durationMs}ms
                </text>
              </g>
            );
            yCursor += rowH;
          }

          return (
            <g key={`row-${s.id}`}>
              {rowNode}
              {childNode}
            </g>
          );
        })}
      </svg>
    );
  };

  const renderSidePanel = () => {
    if (!activeRecord) {
      return (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-4 text-center">
          <p className="text-xs text-muted">
            Nhấn một span để xem chi tiết →
          </p>
        </div>
      );
    }
    const r = activeRecord;
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-mono font-semibold text-foreground truncate">
            {r.label}
          </p>
          <span
            className={`text-[10px] font-mono rounded-md px-1.5 py-0.5 ${
              r.status === "ok"
                ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                : r.status === "warn"
                  ? "bg-amber-500/20 text-amber-800 dark:text-amber-300"
                  : "bg-red-500/20 text-red-800 dark:text-red-300"
            }`}
          >
            {r.status.toUpperCase()}
          </span>
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
          <dt className="text-muted">duration</dt>
          <dd className="font-mono text-foreground">{r.durationMs}ms</dd>

          <dt className="text-muted">start</dt>
          <dd className="font-mono text-foreground">t+{r.startMs}ms</dd>

          {r.ttftMs !== undefined && (
            <>
              <dt className="text-muted">ttft</dt>
              <dd className="font-mono text-foreground">{r.ttftMs}ms</dd>
            </>
          )}
          {r.tokensIn !== undefined && (
            <>
              <dt className="text-muted">tokens.in</dt>
              <dd className="font-mono text-foreground">{r.tokensIn}</dd>
            </>
          )}
          {r.tokensOut !== undefined && (
            <>
              <dt className="text-muted">tokens.out</dt>
              <dd className="font-mono text-foreground">{r.tokensOut}</dd>
            </>
          )}
          <dt className="text-muted">cost</dt>
          <dd className="font-mono text-foreground">
            ${r.costUsd.toFixed(5)}
          </dd>

          {r.model && (
            <>
              <dt className="text-muted">model</dt>
              <dd className="font-mono text-foreground">{r.model}</dd>
            </>
          )}
          {r.tool && (
            <>
              <dt className="text-muted">tool</dt>
              <dd className="font-mono text-foreground">{r.tool}</dd>
            </>
          )}
        </dl>

        <div className="mt-3 rounded-md border border-border bg-background/60 p-2">
          <p className="text-[10px] text-muted uppercase tracking-wide">
            input
          </p>
          <p className="text-[11px] text-foreground/90 mt-0.5 whitespace-pre-wrap break-words">
            {r.inputPreview}
          </p>
        </div>
        <div className="mt-2 rounded-md border border-border bg-background/60 p-2">
          <p className="text-[10px] text-muted uppercase tracking-wide">
            output
          </p>
          <p className="text-[11px] text-foreground/90 mt-0.5 whitespace-pre-wrap break-words">
            {r.outputPreview}
          </p>
        </div>
        {r.errorNote && (
          <div className="mt-2 rounded-md border border-red-500/50 bg-red-500/10 p-2">
            <p className="text-[10px] text-red-800 dark:text-red-300 uppercase tracking-wide">
              error
            </p>
            <p className="text-[11px] text-red-900 dark:text-red-200 mt-0.5 leading-relaxed">
              {r.errorNote}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderLatencyChart = () => {
    const w = 260;
    const h = 80;
    const max = Math.max(...latencySeries, 8000);
    const pts = latencySeries
      .map((v, i) => {
        const x = (i / (latencySeries.length - 1)) * w;
        const y = h - (v / max) * h;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
    const p50 = percentile(latencySeries, 50);
    const p95 = percentile(latencySeries, 95);
    const p50Y = h - (p50 / max) * h;
    const p95Y = h - (p95 / max) * h;

    return (
      <div className="rounded-xl border border-border bg-card p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-foreground">
            p50 / p95 — 20 request gần nhất
          </p>
          <button
            type="button"
            onClick={resetTrace}
            className="text-[10px] rounded-md border border-border bg-background px-2 py-0.5 text-muted hover:text-foreground transition"
          >
            ⟲ reset
          </button>
        </div>
        <svg viewBox={`0 0 ${w} ${h + 20}`} className="w-full mt-1">
          {/* p50 line */}
          <line
            x1={0}
            x2={w}
            y1={p50Y}
            y2={p50Y}
            stroke="#22c55e"
            strokeDasharray="3 3"
            strokeWidth={1}
          />
          <text x={w - 2} y={p50Y - 2} fontSize={11} fill="#22c55e" textAnchor="end">
            p50 {p50}ms
          </text>
          {/* p95 line */}
          <line
            x1={0}
            x2={w}
            y1={p95Y}
            y2={p95Y}
            stroke="#ef4444"
            strokeDasharray="3 3"
            strokeWidth={1}
          />
          <text x={w - 2} y={p95Y - 2} fontSize={11} fill="#ef4444" textAnchor="end">
            p95 {p95}ms
          </text>
          <motion.polyline
            fill="none"
            stroke="#60a5fa"
            strokeWidth={1.6}
            points={pts}
            initial={false}
            animate={{ points: pts }}
            transition={{ duration: 0.35 }}
          />
          {latencySeries.map((v, i) => {
            const x = (i / (latencySeries.length - 1)) * w;
            const y = h - (v / max) * h;
            return <circle key={i} cx={x} cy={y} r={1.6} fill="#60a5fa" />;
          })}
          <text x={2} y={h + 14} fontSize={11} fill="#94a3b8">
            cũ ←
          </text>
          <text x={w - 2} y={h + 14} fontSize={11} fill="#94a3b8" textAnchor="end">
            → mới
          </text>
        </svg>
        <p className="text-[10px] text-muted mt-1 leading-snug">
          Mỗi lần inject fault, giá trị wall-clock của request kế tiếp sẽ được
          đẩy vào chuỗi — quan sát p95 phản ứng thế nào so với p50.
        </p>
      </div>
    );
  };

  const faultButton = (mode: FaultMode, label: string) => {
    const active = fault === mode;
    return (
      <button
        key={mode}
        type="button"
        onClick={() => injectFault(mode)}
        className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
          active
            ? "border-accent bg-accent/15 text-foreground"
            : "border-border bg-background text-muted hover:text-foreground"
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <>
      {/* ───────────── 1. DỰ ĐOÁN ───────────── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Production LLM app của bạn đang chậm. Dashboard APM (DataDog) cho thấy 'POST /chat p95 = 8s'. Bạn làm gì tiếp theo?"
          options={[
            "Scale up — thêm replica để giảm hàng đợi",
            "Thêm cache — memoize theo prompt hash",
            "Thêm tracing tới từng span (retrieve, LLM, tool) vì APM truyền thống không hiểu nội bộ LLM pipeline — phải biết bước nào chậm trước khi sửa",
            "Rollback về phiên bản tuần trước",
          ]}
          correct={2}
          explanation="APM truyền thống chỉ thấy lớp HTTP bên ngoài: một request = 8s. Bên trong là 5-10 span (embed, vector search, rerank, LLM, tool). Nếu chưa biết rerank chiếm 3s hay LLM decode 5s thì mọi giả thuyết về scale/cache/rollback đều là đoán mò. Bước đầu tiên luôn là cài đặt observability AI-native, không phải tối ưu mù quáng."
        >
          <p className="text-sm text-muted mt-2">
            Bài hôm nay: xem một trace waterfall thật cho agentic RAG — và học
            cách nhìn xuyên qua con số p95 đến nguồn gốc của nó.
          </p>

          {/* ───────────── 2. VISUALIZATION ───────────── */}
          <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Trace waterfall">
            <p className="mb-4 text-sm text-muted leading-relaxed">
              Đây là trace của một request qua pipeline{" "}
              <em>agentic RAG</em> điển hình. Mỗi thanh là một{" "}
              <strong className="text-foreground">span</strong> — có{" "}
              <em>start</em>, <em>duration</em>, và attribute kèm theo.
              Nhấn vào span để mở chi tiết, hoặc bấm một nút fault để xem
              điều gì vỡ ra khi production đau tim.
            </p>

            <VisualizationSection>
              <div className="space-y-4">
                {/* Summary bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { k: "wall-clock", v: `${(wallClockMs / 1000).toFixed(2)}s` },
                    { k: "tổng tokens", v: totalTokens.toLocaleString() },
                    { k: "tổng cost", v: `$${totalCost.toFixed(4)}` },
                  ].map((c) => (
                    <div key={c.k} className="rounded-lg border border-border bg-card p-2">
                      <p className="text-[10px] text-muted uppercase tracking-wide">{c.k}</p>
                      <p className="text-sm font-mono font-bold text-foreground">{c.v}</p>
                    </div>
                  ))}
                  <div className={`rounded-lg border p-2 ${
                    overallStatus === "ok" ? "border-emerald-500/50 bg-emerald-500/10"
                    : overallStatus === "warn" ? "border-amber-500/50 bg-amber-500/10"
                    : "border-red-500/50 bg-red-500/10"
                  }`}>
                    <p className="text-[10px] text-muted uppercase tracking-wide">status</p>
                    <p className={`text-sm font-mono font-bold ${
                      overallStatus === "ok" ? "text-emerald-800 dark:text-emerald-300"
                      : overallStatus === "warn" ? "text-amber-800 dark:text-amber-300" : "text-red-800 dark:text-red-300"
                    }`}>
                      {overallStatus === "ok" ? "OK" : overallStatus === "warn" ? "DEGRADED" : "FAIL"}
                    </p>
                  </div>
                </div>

                {/* Fault injector */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-muted">Inject fault:</span>
                  {faultButton("none", "— nominal")}
                  {faultButton("retrieval_timeout", "Retrieval timeout")}
                  {faultButton("llm_slow", "LLM slow decode")}
                  {faultButton("tool_5xx", "Tool 5xx → retry")}
                </div>

                <div className="grid lg:grid-cols-[1fr_300px] gap-4">
                  <div className="rounded-xl border border-border bg-card p-3 overflow-x-auto">
                    {renderWaterfall()}
                  </div>
                  <div className="space-y-3">
                    {renderSidePanel()}
                    {renderLatencyChart()}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 text-[10px] text-muted">
                  {(["router", "retrieval", "llm", "tool", "post"] as const).map((k) => (
                    <span key={k} className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: KIND_COLOR[k] }} />
                      {k}
                    </span>
                  ))}
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-0.5 bg-amber-300" /> TTFT
                  </span>
                </div>
              </div>
            </VisualizationSection>
          </LessonSection>

          {/* ───────────── 3. AHA ───────────── */}
          <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
            <AhaMoment>
              <p>
                Một request LLM nhìn bên ngoài là{" "}
                <code>POST /chat = 4.5s</code>, nhưng bên trong là{" "}
                <strong>một distributed system tí hon</strong>: router, embed,
                vector DB, reranker, LLM, tool — mỗi thứ có latency, cost,
                model version, và prompt riêng. APM truyền thống chỉ thấy
                lớp ngoài cùng; muốn debug thật sự bạn cần{" "}
                <strong>AI-native observability</strong> — tracing biết về
                token, prompt, tool call, và TTFT, không chỉ HTTP status.
              </p>
            </AhaMoment>
          </LessonSection>

          {/* ───────────── 4. CALLOUTS ───────────── */}
          <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Bốn lưu ý quan trọng">
            <div className="space-y-3">
              <Callout variant="tip" title="Công cụ phổ biến — và đánh đổi SaaS vs self-hosted">
                Bức tranh 2026:{" "}
                <strong>Langfuse</strong> (open-source, có cả SaaS và Docker
                Compose tự triển khai — phổ biến cho team Việt Nam),{" "}
                <strong>Phoenix/Arize</strong> (mạnh về eval + drift, có bản
                chạy local cho dev),{" "}
                <strong>LangSmith</strong> (SaaS của LangChain, đẹp nhưng
                khóa vào hệ sinh thái),{" "}
                <strong>Helicone</strong> (proxy gateway, ít code),{" "}
                <strong>OpenLLMetry</strong> (SDK thuần OTel, trung lập với
                backend). Chọn SaaS khi muốn ship tuần này; chọn
                self-hosted khi prompt/output chứa dữ liệu nhạy cảm không
                được rời hạ tầng nội bộ.
              </Callout>

              <Callout variant="warning" title="PII trong prompt và output — cần redaction trước khi log">
                Prompt LLM thường là dữ liệu người dùng dán nguyên văn vào —
                email, số điện thoại, CCCD, hồ sơ y tế, hợp đồng. Lưu nguyên
                bản sang vendor SaaS là bề mặt tấn công khổng lồ. Pattern
                tối thiểu: (1) regex mask ở SDK cho
                email/phone/credit-card/CCCD trước khi gửi đi,
                (2) presidio hoặc rule engine cho PII phức tạp,
                (3) sampling — giữ 100% trace metadata nhưng chỉ 1-5% body,
                (4) retention ngắn (7-30 ngày) cho vùng chứa bản gốc.
              </Callout>

              <Callout variant="info" title="OpenTelemetry semantic conventions cho GenAI">
                OTel nhóm đặc tả đã chuẩn hóa attribute cho LLM dưới namespace{" "}
                <code>gen_ai.*</code>:{" "}
                <code>gen_ai.request.model</code>,{" "}
                <code>gen_ai.request.temperature</code>,{" "}
                <code>gen_ai.usage.input_tokens</code>,{" "}
                <code>gen_ai.usage.output_tokens</code>,{" "}
                <code>gen_ai.response.finish_reason</code>,{" "}
                <code>gen_ai.operation.name</code>. Dùng đúng semantic
                conventions cho phép swap backend (Langfuse ↔ Phoenix ↔
                Helicone) mà không đổi code instrumentation — tương tự như
                SQL chuẩn giúp swap Postgres ↔ MySQL.
              </Callout>

              <Callout variant="insight" title="Golden trace — baseline để on-call không phải đoán">
                Lưu sẵn 30-100 request{" "}
                <em>nominal</em> đại diện (short answer, long answer, tool
                call, retrieval-heavy...) rồi replay mỗi giờ. Mỗi lần pager
                kêu lúc 3h sáng, việc đầu tiên không phải đọc log — mà là
                so sánh trace hiện tại với golden trace tương ứng. Bước
                nào chậm hơn 2x, bước nào có status khác, prompt có đổi
                shape không. Golden trace biến cuộc săn lỗi từ{" "}
                <em>đoán mò</em> thành <em>chênh lệch</em>.
              </Callout>
            </div>
          </LessonSection>

          {/* ───────────── 5. THÁCH THỨC ───────────── */}
          <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
            <div className="space-y-4">
              <InlineChallenge
                question="Dashboard cho thấy /chat p95 = 6.5s (vượt SLO 5s) nhưng kênh support không có phàn nàn và CSAT tuần này thậm chí còn tăng. Bạn giải thích và hành động ra sao?"
                options={[
                  "Tắt alert — rõ ràng p95 là đo sai",
                  "Xem cohort: p95 có thể bị kéo bởi một nhóm request hiếm (long context / research mode) mà user của nhóm đó chấp nhận chờ lâu. Kiểm tra breakdown theo intent + so với trace golden, nếu cohort chính vẫn dưới SLO thì giữ alert nhưng nới ngưỡng riêng cho long-context",
                  "Rollback ngay — p95 vượt là luôn nguy hiểm",
                  "Không làm gì, bỏ qua",
                ]}
                correct={1}
                explanation="p95 aggregate che mất cohort. Một tính năng 'deep research' trả sau 15s nhưng user vui vẻ chấp nhận có thể kéo p95 tổng mà không ảnh hưởng UX. Observability tốt phải slice theo intent, route, user tier — không chỉ dashboard tổng. SLO chia theo cohort là practice production trưởng thành."
              />

              <InlineChallenge
                question="Wall-clock trace của một request = 4.5s, nhưng tổng duration cộng lại của 8 span = 6.2s. Vì sao không khớp — và điều này gợi ý gì?"
                options={[
                  "Bug trong instrumentation — span bị đếm sai",
                  "Có parallelism: một số span chạy song song (ví dụ embed + policy lookup), nên sum(durations) > wall-clock. Ngược lại, nếu sum < wall-clock thì có khoảng gap không được instrument (queue/waiting không được bọc span) — cần thêm span cho khoảng đó",
                  "Clock skew giữa các service",
                  "Retry làm sai wall-clock",
                ]}
                correct={1}
                explanation="Waterfall là công cụ trực quan cho chính điều này: nhìn ngang để thấy parallel (span chồng lên nhau) hoặc gap (khoảng trắng giữa hai span nối tiếp). Nếu sum > wall-clock → tốt, có parallel. Nếu sum < wall-clock → có thời gian không được bọc span (thường là queue trong message bus, TLS handshake, cold start) — đó là nơi cần instrument thêm."
              />
            </div>
          </LessonSection>

          {/* ───────────── 6. LÝ THUYẾT ───────────── */}
          <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Lý thuyết">
            <ExplanationSection>
              <p>
                <strong>Observability</strong> (khả năng quan sát) là khả
                năng suy luận về <em>trạng thái bên trong</em> hệ thống chỉ
                từ <em>tín hiệu bên ngoài</em> mà nó phát ra. Khác với{" "}
                <em>monitoring</em> (biết trước bạn sẽ đo gì), observability
                để bạn đặt câu hỏi mới sau khi hệ thống đã chạy. Với LLM
                app — nơi hành vi phi tất định, phụ thuộc prompt, phụ
                thuộc phiên bản model — observability không phải một tính
                năng mà là tiền đề để sống sót trong production.
              </p>

              <p>
                Observability đứng trên{" "}
                <strong>ba trụ cột</strong>, mỗi cái trả lời một câu hỏi
                khác nhau:
              </p>

              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>
                  <strong>Traces</strong> — &quot;đường đi của MỘT request
                  qua hệ thống&quot;. Mỗi trace là cây các span; mỗi span
                  có <code>start</code>, <code>duration</code>,{" "}
                  <code>status</code>, và{" "}
                  <em>attribute</em> (key-value). Trace là tín hiệu đầu
                  tiên cần có cho LLM app vì kiến trúc tự nhiên là nhiều
                  bước.
                </li>
                <li>
                  <strong>Metrics</strong> — &quot;hành vi TỔNG HỢP theo
                  thời gian&quot;. Counter (<code>requests_total</code>),
                  gauge (<code>queue_depth</code>), histogram (
                  <code>latency_ms</code>). Metric là rẻ và dùng cho
                  dashboard + alert.
                </li>
                <li>
                  <strong>Logs</strong> — &quot;event chi tiết tại một
                  điểm&quot;. Log có structure (JSON) + correlation ID
                  (gắn với trace_id + span_id) là log dùng được; log text
                  tự do là log để đọc-một-lần.
                </li>
              </ul>

              <p>
                Phần lớn sự cố production không giải được bằng một trụ cột
                đơn lẻ: metric báo p95 cao → mở trace tiêu biểu để xem
                span nào chậm → mở log của span đó để thấy prompt/tham số
                cụ thể. Ba trụ cột bổ sung, không thay thế.
              </p>

              <p>
                <strong>Vì sao p95 quan trọng hơn mean?</strong> Phân phối
                latency LLM lệch phải nặng do throttling, context dài, và
                cold start. Mean bị che bởi đuôi. p95 (percentile thứ 95)
                là ngưỡng mà <em>5% request tệ nhất</em> vượt qua — tức là
                &quot;ngưỡng tệ nhất của trải nghiệm người dùng thông
                thường&quot;:
              </p>

              <p className="text-center">
                <LaTeX>
                  {
                    "p_{95} = \\inf\\{t \\mid F_L(t) \\geq 0.95\\}, \\quad F_L(t) = P(L \\leq t)"
                  }
                </LaTeX>
              </p>

              <p className="text-xs text-muted">
                Với <code>L</code> là biến ngẫu nhiên latency. SLO chuẩn
                của LLM app đối diện người dùng thường viết dạng &quot;p95
                &lt; 5s trong cửa sổ 30 ngày, đo theo intent&quot;. Không
                viết theo mean. Không viết không có cửa sổ.
              </p>

              <p>
                <strong>
                  OpenTelemetry semantic conventions cho GenAI.
                </strong>{" "}
                OTel đã chuẩn hóa attribute cho LLM dưới namespace{" "}
                <code>gen_ai.*</code>. Dùng đúng semantic conventions là
                cách rẻ nhất để khóa chặt code instrumentation với backend
                — bạn có thể đổi Langfuse → Phoenix → Helicone mà không
                phải viết lại SDK. Các attribute cốt lõi cần biết:
              </p>

              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <code>gen_ai.system</code> — nhà cung cấp (openai,
                  anthropic, azure.openai...)
                </li>
                <li>
                  <code>gen_ai.request.model</code> — tên model được hỏi
                  (<code>claude-sonnet-4.7</code>)
                </li>
                <li>
                  <code>gen_ai.request.temperature</code>,{" "}
                  <code>gen_ai.request.top_p</code>,{" "}
                  <code>gen_ai.request.max_tokens</code>
                </li>
                <li>
                  <code>gen_ai.usage.input_tokens</code>,{" "}
                  <code>gen_ai.usage.output_tokens</code> — cho metric chi
                  phí
                </li>
                <li>
                  <code>gen_ai.response.finish_reason</code> —{" "}
                  <code>stop</code> / <code>length</code> /{" "}
                  <code>tool_calls</code>
                </li>
                <li>
                  <code>gen_ai.operation.name</code> —{" "}
                  <code>chat</code> / <code>embeddings</code> /{" "}
                  <code>completion</code>
                </li>
              </ul>

              <p>
                Ví dụ instrument một pipeline RAG bằng OpenTelemetry
                Python. Mọi span được bọc bằng tracer, context tự động
                truyền qua <code>with</code> block:
              </p>

              <CodeBlock language="python" title="rag_pipeline.py — OTel instrumentation cho RAG">
                {`from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter

trace.set_tracer_provider(TracerProvider())
trace.get_tracer_provider().add_span_processor(
    BatchSpanProcessor(OTLPSpanExporter(endpoint="http://otel-collector:4318/v1/traces"))
)
tracer = trace.get_tracer("rag.pipeline")

GENAI_SYSTEM = "anthropic"
MODEL = "claude-sonnet-4.7"

def redact_pii(text: str) -> str:
    # tối giản — production dùng presidio hoặc rule engine đầy đủ
    import re
    text = re.sub(r"\\b\\d{9,12}\\b", "<ID>", text)
    text = re.sub(r"[\\w.+-]+@[\\w-]+\\.[\\w.-]+", "<EMAIL>", text)
    return text[:2000]

def answer(query: str, tenant_id: str) -> str:
    with tracer.start_as_current_span("chat.request") as root:
        root.set_attribute("tenant.id", tenant_id)
        root.set_attribute("gen_ai.operation.name", "chat")
        root.set_attribute("user.query_preview", redact_pii(query))

        with tracer.start_as_current_span("retrieve.embed") as sp:
            sp.set_attribute("gen_ai.request.model", "text-embedding-3-small")
            vec = embed(query)
            sp.set_attribute("vector.dim", len(vec))

        with tracer.start_as_current_span("retrieve.vector_search") as sp:
            sp.set_attribute("db.system", "pgvector")
            sp.set_attribute("retrieval.top_k", 20)
            chunks = vector_search(vec, tenant_id, top_k=20)
            sp.set_attribute("retrieval.hits", len(chunks))

        with tracer.start_as_current_span("retrieve.rerank") as sp:
            sp.set_attribute("gen_ai.request.model", "cohere-rerank-v3")
            top = rerank(query, chunks, keep=5)

        with tracer.start_as_current_span("llm.generate") as sp:
            sp.set_attribute("gen_ai.system", GENAI_SYSTEM)
            sp.set_attribute("gen_ai.request.model", MODEL)
            sp.set_attribute("gen_ai.request.temperature", 0.2)
            out = llm_chat(query, context=top, model=MODEL)
            sp.set_attribute("gen_ai.usage.input_tokens", out.usage.input)
            sp.set_attribute("gen_ai.usage.output_tokens", out.usage.output)
            sp.set_attribute("gen_ai.response.finish_reason", out.finish_reason)
            sp.set_attribute("gen_ai.response.output_preview",
                             redact_pii(out.text))

        root.set_attribute("chat.status", "ok")
        return out.text`}
              </CodeBlock>

              <p>
                Backend observability cần một điểm thu nhận chung — thường
                là <strong>OTel Collector</strong> đứng giữa ứng dụng và
                các backend cụ thể. Cấu hình tối giản cho Langfuse + sampling:
              </p>

              <CodeBlock language="yaml" title="otel-collector.yaml — sampling + Langfuse">
                {`receivers:
  otlp:
    protocols:
      http:
        endpoint: 0.0.0.0:4318
      grpc:
        endpoint: 0.0.0.0:4317

processors:
  # Tail sampling — quyết định sau khi trace xong
  tail_sampling:
    decision_wait: 10s
    num_traces: 50000
    policies:
      - name: keep-errors
        type: status_code
        status_code: { status_codes: [ERROR] }
      - name: keep-slow
        type: latency
        latency: { threshold_ms: 5000 }
      - name: sample-nominal
        type: probabilistic
        probabilistic: { sampling_percentage: 5 }

  # Chặn PII ở cạnh collector — tầng phòng thủ thứ hai
  attributes/redact:
    actions:
      - key: user.query_preview
        action: hash
      - key: gen_ai.response.output_preview
        action: hash

  batch: {}

exporters:
  otlphttp/langfuse:
    endpoint: https://cloud.langfuse.com/api/public/otel
    headers:
      Authorization: Basic \${LANGFUSE_AUTH}

  prometheus:
    endpoint: 0.0.0.0:9464

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [tail_sampling, attributes/redact, batch]
      exporters: [otlphttp/langfuse]
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [prometheus]`}
              </CodeBlock>

              <Callout variant="warning" title="Đừng nhầm observability với dashboard đẹp">
                Dashboard chỉ là lớp trình bày. Tín hiệu tốt hay tệ phụ
                thuộc vào span/attribute được instrument. Một dashboard
                Grafana màu mè dựa trên log không có trace_id là{" "}
                <em>theatre</em>, không phải observability. Ưu tiên:
                instrument đúng → export qua OTel → sau đó mới chọn
                backend (Langfuse, Phoenix, Grafana Tempo...).
              </Callout>

              <CollapsibleDetail title="Sampling — head vs tail khi trace 1 triệu request/ngày">
                <p className="text-sm">
                  Ở scale production, lưu 100% trace là không thực tế
                  (chi phí storage + egress). Hai chiến lược chính:
                </p>
                <ul className="list-disc list-inside text-sm space-y-1 pl-2 mt-2">
                  <li>
                    <strong>Head sampling</strong>: quyết định giữ/bỏ{" "}
                    <em>ngay khi span đầu bắt đầu</em> (TraceIdRatioBased
                    sampler). Rẻ, dễ triển khai, nhưng dễ bỏ sót trace
                    lỗi vì lỗi thường hiếm (&lt;1%). Phù hợp cho dev và
                    môi trường đồng nhất.
                  </li>
                  <li>
                    <strong>Tail sampling</strong>: gom toàn bộ span của
                    trace lại, đợi một khoảng (5-30s), rồi quyết định
                    dựa trên policy (status = ERROR, duration &gt; p95,
                    tenant quan trọng). Đắt về CPU/RAM nhưng{" "}
                    <em>luôn giữ</em> trace lỗi và trace chậm — đúng cái
                    cần để debug.
                  </li>
                  <li>
                    <strong>Hybrid</strong>: head sampling 1-5% trên
                    nominal + tail sampling giữ 100% lỗi + replay golden
                    trace. Đây là pattern phổ biến ở 1M+ req/ngày.
                  </li>
                </ul>
                <p className="text-sm mt-2">
                  Công cụ: OpenTelemetry Collector có processor{" "}
                  <code>tail_sampling</code> built-in; nếu tự triển khai
                  thì cần shard theo trace_id để mọi span của cùng trace
                  đến cùng một collector node.
                </p>
              </CollapsibleDetail>

              <CollapsibleDetail title="Drift detection — data drift vs concept drift, khi nào alert">
                <p className="text-sm">
                  LLM app không đứng im. Phân phối câu hỏi, ngữ cảnh,
                  thậm chí phiên bản model — đều trôi. Hai loại drift:
                </p>
                <ul className="list-disc list-inside text-sm space-y-1 pl-2 mt-2">
                  <li>
                    <strong>Data drift</strong>: phân phối input thay
                    đổi. Đo bằng PSI trên embedding của query tuần này
                    vs baseline, alert nếu PSI &gt; 0.25.
                  </li>
                  <li>
                    <strong>Concept drift</strong>: quan hệ input →
                    output thay đổi. Khó hơn vì cần ground-truth; proxy
                    khả thi là độ tương đồng output với golden trace,
                    hoặc CSAT giảm không giải thích được.
                  </li>
                  <li>
                    <strong>Model vendor drift</strong>: provider âm
                    thầm cập nhật snapshot model. Baseline{" "}
                    <code>gen_ai.response_id</code> hoặc fingerprint đầu
                    ra, alert khi hash shift bất thường.
                  </li>
                </ul>
                <p className="text-sm mt-2">
                  Xem thêm <TopicLink slug="monitoring">monitoring</TopicLink>{" "}
                  cho các công thức PSI và KL divergence cụ thể. So sánh
                  với <TopicLink slug="mlops">mlops</TopicLink> để hiểu
                  vị trí của observability trong vòng lặp
                  build-deploy-observe-retrain.
                </p>
              </CollapsibleDetail>

              <p>
                Muốn đi sâu về chi phí và độ trễ ở từng tầng token? Xem{" "}
                <TopicLink slug="cost-latency-tokens">
                  cost, latency, tokens
                </TopicLink>
                . Muốn hiểu tầng dưới — nơi các span LLM thật sự được
                phục vụ? Xem{" "}
                <TopicLink slug="model-serving">model serving</TopicLink>.
                Observability là lớp <em>nhìn xuyên</em> các lớp đó.
              </p>
            </ExplanationSection>
          </LessonSection>

          {/* ───────────── 7. CASE STUDY ───────────── */}
          <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Case study: chatbot tư vấn sức khỏe">
            <div className="rounded-xl border border-border bg-card p-4 text-sm space-y-3">
              <p>
                <strong className="text-foreground">Bối cảnh.</strong>{" "}
                Một startup y tế Việt Nam triển khai chatbot tư vấn sức
                khỏe trên hạ tầng VNG Cloud, tích hợp RAG với tài liệu
                hướng dẫn của Bộ Y tế. Sau launch, dashboard APM hiển thị
                p95 = 12s. SLO ban đầu viết là &lt; 6s. User complain
                tăng; CSAT tụt từ 4.6 xuống 3.9 trong 2 tuần.
              </p>
              <p>
                <strong className="text-foreground">Đoán mò (thất bại).</strong>{" "}
                Team thử scale replica × 3 (không đổi), bật Redis cache
                trên prompt hash (hit rate 2% — prompt y tế đa dạng), đổi
                model từ claude-sonnet-4.7 sang haiku (CSAT tụt thêm).
                Ba ngày, không fix được.
              </p>
              <p>
                <strong className="text-foreground">Bật observability.</strong>{" "}
                Team cài Langfuse self-hosted (yêu cầu tuân thủ dữ liệu y
                tế, không ra khỏi mạng nội bộ) + OTel Collector với PII
                redaction trước khi lưu. Một trace waterfall cho câu hỏi
                &quot;triệu chứng sốt kéo dài 3 ngày&quot; lộ ra:
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li>
                  <code>retrieve.vector_search</code> = 0.4s (ổn).
                </li>
                <li>
                  <code>retrieve.rerank</code> = 4.1s (bất thường — model
                  rerank chạy trên CPU, batch size 1).
                </li>
                <li>
                  <code>llm.generate</code> = 6.8s — và điều đáng lẽ phải
                  bắt đầu ngay sau vector_search lại chờ xong rerank.
                  Rerank và LLM đang chạy <em>tuần tự</em>.
                </li>
              </ul>
              <p>
                <strong className="text-foreground">Sửa.</strong> Hai
                thay đổi: (1) chuyển rerank sang GPU batch + cho chạy{" "}
                <em>song song</em> với việc gửi prompt đầu tiên tới LLM
                (speculative — LLM bắt đầu với top-20 chưa rerank, cập
                nhật khi rerank xong); (2) cache rerank theo intent.
                Kết quả: p95 từ 12s xuống 5.2s. CSAT hồi phục sau 10 ngày.
              </p>
              <p>
                <strong className="text-foreground">Bài học.</strong>{" "}
                Không có trace, debug latency là đoán mò — scale,
                cache, đổi model đều là giả thuyết không bằng chứng.
                Một trace tốt biến câu hỏi &quot;vì sao chậm?&quot;
                thành một <em>đồ thị trực quan với đáp án nhìn thấy được
                bằng mắt thường</em>. Với domain nhạy cảm (y tế, tài
                chính), self-hosted Langfuse + PII redaction là điều
                kiện bắt buộc, không phải tùy chọn.
              </p>
            </div>
          </LessonSection>

          {/* ───────────── 8. TÓM TẮT ───────────── */}
          <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Tóm tắt">
            <MiniSummary
              title="Những điều cần nhớ về Observability cho AI"
              points={[
                "LLM app là distributed system tí hon — một request = 5-10 span. APM HTTP truyền thống không đủ; cần AI-native observability hiểu prompt, token, model, tool.",
                "Ba trụ cột: Traces (đường đi của MỘT request), Metrics (hành vi tổng hợp), Logs (event chi tiết) — mỗi cái trả lời một câu hỏi, bổ sung không thay thế.",
                "p95 > mean cho LLM vì phân phối latency lệch phải; SLO production luôn viết theo p95 hoặc p99 kèm cửa sổ thời gian, thường chia theo cohort/intent.",
                "OpenTelemetry semantic conventions cho GenAI (gen_ai.*) là ngôn ngữ chung — dùng đúng để swap backend (Langfuse ↔ Phoenix ↔ Helicone) không phải viết lại SDK.",
                "Prompt và output chứa PII — redact ở SDK (regex, presidio) + tầng hai ở OTel Collector, kết hợp sampling và retention ngắn cho vùng chứa bản gốc.",
                "Golden trace + tail sampling là cặp đôi vận hành: golden replay mỗi giờ để bắt drift sớm, tail sampling giữ 100% trace lỗi/chậm để debug khi bị pager.",
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
