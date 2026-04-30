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

// ---------------------------------------------------------------------------
// METADATA
// ---------------------------------------------------------------------------

export const metadata: TopicMeta = {
  slug: "model-serving",
  title: "Model Serving",
  titleVi: "Phục vụ mô hình — Đưa AI vào thực tế",
  description:
    "Quy trình triển khai và cung cấp mô hình AI dưới dạng dịch vụ, xử lý yêu cầu từ người dùng trong thời gian thực với latency thấp và throughput cao.",
  category: "infrastructure",
  tags: ["serving", "deployment", "api", "inference"],
  difficulty: "intermediate",
  relatedSlugs: ["inference-optimization", "containerization", "mlops"],
  vizType: "interactive",
};

// ---------------------------------------------------------------------------
// DOMAIN TYPES
// ---------------------------------------------------------------------------

type ServerKind = "vllm" | "tgi" | "triton" | "rayserve";
type BatchMode = "static" | "dynamic" | "continuous";

interface IncomingRequest {
  id: number;
  arrivalMs: number;
  promptTokens: number;
  status: "queued" | "batching" | "processing" | "done" | "dropped";
  serverIdx: number;
  batchId: number | null;
  startedAtMs: number | null;
  finishedAtMs: number | null;
  waitMs: number;
  inferMs: number;
}

interface BatchGroup {
  id: number;
  serverIdx: number;
  startedAtMs: number;
  requestIds: number[];
  mode: BatchMode;
}

interface ServerReplica {
  idx: number;
  busy: boolean;
  gpuUtil: number;
  activeBatchId: number | null;
  processed: number;
  kind: ServerKind;
}

interface ServerProfile {
  name: string;
  subtitle: string;
  strengths: string[];
  weaknesses: string[];
  batching: string;
  bestFor: string;
  color: string;
}

// ---------------------------------------------------------------------------
// STATIC TABLES & PROFILES
// ---------------------------------------------------------------------------

const SERVER_PROFILES: Record<ServerKind, ServerProfile> = {
  vllm: {
    name: "vLLM",
    subtitle: "PagedAttention + continuous batching",
    strengths: [
      "Throughput cao nhất cho LLM decoder-only",
      "PagedAttention cho KV-cache hiệu quả",
      "OpenAI-compatible API sẵn",
    ],
    weaknesses: [
      "Tập trung LLM text; ít hỗ trợ vision / tabular",
      "Khởi động lần đầu tốn thời gian compile CUDA graph",
    ],
    batching: "Continuous batching (mặc định)",
    bestFor: "LLM online serving quy mô lớn",
    color: "#22c55e",
  },
  tgi: {
    name: "TGI",
    subtitle: "Text Generation Inference của Hugging Face",
    strengths: [
      "Tích hợp chặt với Hugging Face Hub",
      "Hỗ trợ tensor parallel, flash-attention",
      "Tốt cho quantized model (AWQ, GPTQ)",
    ],
    weaknesses: [
      "Throughput thường thấp hơn vLLM ~10-20%",
      "Ít tuỳ chỉnh hơn so với vLLM",
    ],
    batching: "Dynamic batching với prefill/decode tách biệt",
    bestFor: "Đội đã dùng Hugging Face stack",
    color: "#f59e0b",
  },
  triton: {
    name: "Triton Inference Server",
    subtitle: "NVIDIA — đa backend (TensorRT, ONNX, PyTorch...)",
    strengths: [
      "Hỗ trợ nhiều framework và loại model",
      "Model ensemble, scheduler linh hoạt",
      "Tối ưu sâu với TensorRT-LLM",
    ],
    weaknesses: [
      "Cấu hình phức tạp hơn vLLM/TGI",
      "Yêu cầu hiểu config.pbtxt, model repository",
    ],
    batching: "Dynamic batching (có preferred batch size)",
    bestFor: "Production đa dạng model (CV + NLP + Tabular)",
    color: "#3b82f6",
  },
  rayserve: {
    name: "Ray Serve",
    subtitle: "Python-native serving framework của Anyscale",
    strengths: [
      "Scale lên cụm nhiều node dễ dàng",
      "Pipeline nhiều model / bussiness logic phức tạp",
      "Tích hợp autoscaler, traffic split",
    ],
    weaknesses: [
      "Overhead Ray cluster cho use-case đơn giản",
      "Throughput thô có thể thua vLLM/TGI nếu không tune",
    ],
    batching: "Dynamic batching ở deployment handle",
    bestFor: "Pipeline nhiều model, RAG phức tạp",
    color: "#8b5cf6",
  },
};

const SERVER_ORDER: ServerKind[] = ["vllm", "tgi", "triton", "rayserve"];

const BATCH_DESCRIPTIONS: Record<BatchMode, string> = {
  static:
    "Batch tĩnh: đợi đủ N request mới phóng vào GPU. Throughput ổn nhưng request đến sớm phải chờ lâu.",
  dynamic:
    "Batch động: sau một khoảng chờ ngắn (ví dụ 5ms) hoặc khi đủ max batch thì phóng. Cân bằng giữa latency và throughput.",
  continuous:
    "Continuous batching: request mới được nhét vào batch đang chạy ngay khi có slot trống. GPU luôn bận — chuẩn cho LLM.",
};

const TOTAL_STEPS = 8;

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

/**
 * Percentile helper — tính phân vị p của mảng đã sắp xếp tăng dần.
 * Dùng cho P50/P95/P99 latency.
 */
function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  const idx = Math.min(
    sortedValues.length - 1,
    Math.floor((p / 100) * sortedValues.length),
  );
  return sortedValues[idx];
}

/**
 * Format một số millisecond thành chuỗi hiển thị ngắn gọn.
 */
function fmtMs(ms: number): string {
  if (ms < 1) return "0ms";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// ---------------------------------------------------------------------------
// TOPIC COMPONENT
// ---------------------------------------------------------------------------

export default function ModelServingTopic() {
  // ----- Viz state -----
  const [serverKind, setServerKind] = useState<ServerKind>("vllm");
  const [batchMode, setBatchMode] = useState<BatchMode>("continuous");
  const [replicas, setReplicas] = useState<number>(2);
  const [qpsTarget, setQpsTarget] = useState<number>(12); // QPS user muốn đẩy vào
  const [autoscale, setAutoscale] = useState<boolean>(true);
  const [tick, setTick] = useState<number>(0); // Đếm lần bấm "simulate"

  const [requests, setRequests] = useState<IncomingRequest[]>([]);
  const [batches, setBatches] = useState<BatchGroup[]>([]);
  const [servers, setServers] = useState<ServerReplica[]>(() =>
    Array.from({ length: 4 }, (_, i) => ({
      idx: i,
      busy: false,
      gpuUtil: 0,
      activeBatchId: null,
      processed: 0,
      kind: "vllm" as ServerKind,
    })),
  );

  // ----- Derived: per-request latency sample -----
  const doneRequests = useMemo(
    () => requests.filter((r) => r.status === "done"),
    [requests],
  );

  const sortedLatencies = useMemo(() => {
    const values = doneRequests
      .map((r) => (r.finishedAtMs ?? 0) - r.arrivalMs)
      .filter((v) => v > 0)
      .sort((a, b) => a - b);
    return values;
  }, [doneRequests]);

  const p50 = useMemo(() => percentile(sortedLatencies, 50), [sortedLatencies]);
  const p95 = useMemo(() => percentile(sortedLatencies, 95), [sortedLatencies]);
  const p99 = useMemo(() => percentile(sortedLatencies, 99), [sortedLatencies]);

  const totalInQueue = useMemo(
    () => requests.filter((r) => r.status === "queued").length,
    [requests],
  );

  const avgGpuUtil = useMemo(() => {
    const active = servers.slice(0, replicas);
    if (active.length === 0) return 0;
    return (
      active.reduce((sum, s) => sum + s.gpuUtil, 0) / active.length
    );
  }, [servers, replicas]);

  const currentQps = useMemo(() => {
    // Rough QPS estimate: done / (window 10s)
    if (doneRequests.length === 0) return 0;
    const span = Math.max(
      1000,
      (doneRequests.at(-1)?.finishedAtMs ?? 0) - doneRequests[0].arrivalMs,
    );
    return (doneRequests.length * 1000) / span;
  }, [doneRequests]);

  // ----- Autoscale decision -----
  // Rule: nếu avgGpuUtil > 75% 2 chu kỳ liên tiếp → +1 replica.
  // Nếu avgGpuUtil < 25% và replicas > 1 → -1 replica.
  const shouldScaleUp = autoscale && avgGpuUtil > 0.75 && replicas < 4;
  const shouldScaleDown = autoscale && avgGpuUtil < 0.25 && replicas > 1;

  // ----- Simulation step -----
  const simulateBatch = useCallback(() => {
    const nowMs = tick * 1000;
    const incoming = Math.max(1, Math.round(qpsTarget));

    const newRequests: IncomingRequest[] = Array.from(
      { length: incoming },
      (_, i) => ({
        id: nowMs + i,
        arrivalMs: nowMs + i * (1000 / incoming),
        promptTokens: 60 + Math.floor(Math.random() * 180),
        status: "queued",
        serverIdx: -1,
        batchId: null,
        startedAtMs: null,
        finishedAtMs: null,
        waitMs: 0,
        inferMs: 0,
      }),
    );

    // Build a batch according to mode
    const newBatchId = batches.length + 1;
    const serverIdx = newBatchId % replicas;
    const batchMembers = newRequests.map((r) => ({
      ...r,
      status: "batching" as const,
      serverIdx,
      batchId: newBatchId,
    }));

    // Inference time depends on batch mode + server kind + batch size
    const baseInfer =
      serverKind === "vllm"
        ? 120
        : serverKind === "tgi"
          ? 140
          : serverKind === "triton"
            ? 150
            : 170;
    const batchPenalty =
      batchMode === "static"
        ? 1.6
        : batchMode === "dynamic"
          ? 1.15
          : 1.0; // continuous is most efficient
    const perReqInfer =
      (baseInfer * batchPenalty) / Math.max(1, batchMembers.length * 0.35 + 1);

    const finished = batchMembers.map((r) => {
      const inferMs = perReqInfer + Math.random() * 30;
      const waitMs =
        batchMode === "static"
          ? 150 + Math.random() * 200
          : batchMode === "dynamic"
            ? 30 + Math.random() * 60
            : 8 + Math.random() * 20;
      return {
        ...r,
        status: "done" as const,
        startedAtMs: r.arrivalMs + waitMs,
        finishedAtMs: r.arrivalMs + waitMs + inferMs,
        waitMs,
        inferMs,
      };
    });

    setRequests((prev) => [...prev.slice(-48), ...finished]);
    setBatches((prev) => [
      ...prev.slice(-12),
      {
        id: newBatchId,
        serverIdx,
        startedAtMs: nowMs,
        requestIds: finished.map((r) => r.id),
        mode: batchMode,
      },
    ]);

    setServers((prev) =>
      prev.map((s, i) => {
        if (i !== serverIdx) return s;
        const util = Math.min(
          1,
          0.4 + (finished.length / 18) * (batchMode === "continuous" ? 1.3 : 1),
        );
        return {
          ...s,
          busy: true,
          gpuUtil: util,
          activeBatchId: newBatchId,
          processed: s.processed + finished.length,
          kind: serverKind,
        };
      }),
    );

    setTick((t) => t + 1);

    // Apply autoscale for next cycle
    if (shouldScaleUp) {
      setReplicas((r) => Math.min(4, r + 1));
    } else if (shouldScaleDown) {
      setReplicas((r) => Math.max(1, r - 1));
    }
  }, [
    tick,
    qpsTarget,
    batches.length,
    replicas,
    serverKind,
    batchMode,
    shouldScaleUp,
    shouldScaleDown,
  ]);

  const resetSim = useCallback(() => {
    setRequests([]);
    setBatches([]);
    setTick(0);
    setServers((prev) =>
      prev.map((s) => ({
        ...s,
        busy: false,
        gpuUtil: 0,
        activeBatchId: null,
        processed: 0,
      })),
    );
  }, []);

  // ----- Quiz questions -----
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "Continuous batching khác static batching ở điểm cốt lõi nào khi serving LLM?",
        options: [
          "Continuous batching gộp theo thời gian cố định 1 giây",
          "Continuous batching cho request mới vào slot trống của batch đang chạy, không đợi cả batch kết thúc",
          "Continuous batching chạy trên CPU còn static chạy trên GPU",
          "Continuous batching chỉ dành cho model encoder-only",
        ],
        correct: 1,
        explanation:
          "Continuous batching (còn gọi iteration-level scheduling) bổ sung request mới ngay khi có slot rảnh trong batch đang decode. Nhờ đó GPU không bao giờ idle và throughput tăng 5-10× so với static batching.",
      },
      {
        question:
          "Trong cấu trúc client → load balancer → server, vai trò chính của load balancer là gì?",
        options: [
          "Huấn luyện lại model khi traffic cao",
          "Phân phối request đều giữa các replica và che giấu replica lỗi",
          "Nén payload HTTP để tiết kiệm băng thông",
          "Tạo batch từ nhiều request cho GPU",
        ],
        correct: 1,
        explanation:
          "Load balancer (ví dụ Envoy, NGINX, AWS ALB) chia traffic theo thuật toán round-robin / least-connections, health-check replica và đưa replica lỗi ra khỏi pool. Batching là việc của inference server, không phải load balancer.",
      },
      {
        question:
          "Với SLA P99 latency 500ms, bạn đo được P50 = 180ms, P95 = 320ms, P99 = 720ms. Kết luận đúng?",
        options: [
          "Hệ thống đạt SLA vì trung bình ok",
          "Hệ thống vi phạm SLA vì 1% request chậm hơn 500ms",
          "Hệ thống vượt SLA vì P50 thấp",
          "Không thể kết luận nếu không biết throughput",
        ],
        correct: 1,
        explanation:
          "SLA P99 500ms nghĩa là 99% request phải ≤ 500ms. P99 đo được 720ms nghĩa 1% request vi phạm. Tail latency rất quan trọng vì chính các request này quyết định trải nghiệm người dùng phàn nàn nhất.",
      },
      {
        question:
          "Autoscale dựa trên QPS trigger khi nào là hợp lý nhất cho một LLM serving cluster?",
        options: [
          "Khi QPS vượt 80% capacity hiện tại và dự đoán còn tăng",
          "Chỉ khi CPU usage > 99%",
          "Mỗi phút một lần, không cần metric",
          "Khi người dùng phàn nàn qua support ticket",
        ],
        correct: 0,
        explanation:
          "Autoscale tốt nhất dùng metric đi trước (leading indicator) như QPS / queue depth. Đợi CPU full là quá trễ — request đã dồn đống. Trigger ở ~80% capacity để replica mới warm up kịp trước khi saturate.",
      },
      {
        question: "vLLM nổi bật so với TGI/Triton chủ yếu ở điểm nào?",
        options: [
          "Chỉ chạy được trên CPU",
          "PagedAttention quản lý KV-cache theo page và continuous batching tối ưu",
          "Tự động huấn luyện model khi serving",
          "Là thư viện duy nhất hỗ trợ model computer vision",
        ],
        correct: 1,
        explanation:
          "vLLM giới thiệu PagedAttention (quản lý KV-cache như paging trong OS) giúp tận dụng VRAM gần 100% và continuous batching iteration-level. Nhờ đó throughput LLM tăng 2-4× so với giải pháp baseline.",
      },
      {
        question:
          "Một batch tĩnh (static) cỡ 32 bị bottleneck bởi request 'dài nhất'. Hiện tượng này gọi là gì?",
        options: [
          "Starvation — request ngắn chết đói",
          "Head-of-line blocking — mọi request trong batch bị kéo theo request chậm nhất",
          "Thrashing — hoán đổi page liên tục",
          "Race condition — nhiều thread ghi chung biến",
        ],
        correct: 1,
        explanation:
          "Static batching bị head-of-line blocking: một request sinh 2000 token khiến 31 request còn lại dù chỉ cần 50 token cũng phải chờ. Continuous batching giải quyết vì request hoàn thành sớm sẽ trả về luôn, thay bằng request mới.",
      },
      {
        question: "Ray Serve phù hợp nhất cho bài toán nào?",
        options: [
          "Chỉ serving một LLM đơn lẻ throughput tối đa",
          "Pipeline nhiều model + business logic (ví dụ RAG: embed → retrieve → rerank → generate)",
          "Training distributed duy nhất",
          "Chạy model trên thiết bị edge offline",
        ],
        correct: 1,
        explanation:
          "Ray Serve tỏa sáng ở orchestration nhiều deployment (mỗi deployment tự autoscale). Một request có thể đi qua embedding model → vector DB → reranker → LLM với traffic split A/B dễ dàng. Cho single-LLM thuần, vLLM/TGI nhanh hơn.",
      },
      {
        type: "fill-blank",
        question:
          "Hai chỉ số cốt lõi của model serving là {blank} (thời gian xử lý một request, đơn vị ms) và {blank} (số request xử lý trong một giây).",
        blanks: [
          { answer: "latency", accept: ["độ trễ", "do tre", "Latency"] },
          {
            answer: "throughput",
            accept: ["thông lượng", "thong luong", "Throughput", "QPS", "qps"],
          },
        ],
        explanation:
          "Latency và throughput thường đánh đổi nhau: batching tăng throughput (tốt) nhưng request đầu tiên phải chờ batch đầy (xấu cho latency). Continuous batching phá trade-off này vì không còn 'chờ batch đầy'.",
      },
    ],
    [],
  );

  // ----- Shared UI helpers (server tab) -----
  const activeProfile = SERVER_PROFILES[serverKind];

  // ----- Render -----
  return (
    <>
      {/* ================================================================
          STEP 1 — HOOK / DỰ ĐOÁN
          Kết nối bài học với một tình huống cụ thể ở Việt Nam để
          người học cam kết trả lời trước khi nội dung mở ra.
          ================================================================ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <div className="mb-4">
          <ProgressSteps
            current={1}
            total={TOTAL_STEPS}
            labels={[
              "Dự đoán",
              "Ẩn dụ",
              "Kiến trúc tương tác",
              "Aha",
              "Thử thách",
              "Lý thuyết",
              "Tóm tắt",
              "Kiểm tra",
            ]}
          />
        </div>

        <PredictionGate
          question="Đội bạn vừa fine-tune xong một LLM 8B cho chatbot chăm sóc khách hàng của một ngân hàng Việt Nam. 500 nhân viên tổng đài sẽ dùng đồng thời. Bước kế tiếp để đưa model vào sản xuất là gì?"
          options={[
            "Gửi file checkpoint .bin cho từng nhân viên tự load trên máy cá nhân",
            "Đưa model lên server GPU, bọc thành HTTP API, đặt load balancer phía trước và thiết lập autoscale theo QPS",
            "Export sang PDF và đính kèm email cho khách hàng",
            "In toàn bộ trọng số ra giấy để backup",
          ]}
          correct={1}
          explanation="Đúng rồi — model chỉ là file cho đến khi bạn biến nó thành một dịch vụ: server giữ model trong VRAM, nhận request qua API, gom batch rồi gọi GPU, và có nhiều replica chịu tải. Đó chính là Model Serving — mạch sống của mọi hệ thống AI sản xuất."
        >
          <p className="mt-3 text-sm text-muted leading-relaxed">
            Bài học hôm nay mở ra từng lớp của hệ thống serving: từ client đến
            load balancer, đến vLLM/TGI server, xuống đến cách GPU hình thành
            batch, rồi leo lên bức tranh autoscale và so sánh các framework.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ================================================================
          STEP 2 — ẨN DỤ / CONTEXT
          Kết nối khái niệm với một hình ảnh đời thường trước khi vào
          phần kỹ thuật.
          ================================================================ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Ẩn dụ">
        <p>
          Hãy tưởng tượng một chuỗi nhà hàng phở: <strong>khách hàng</strong>{" "}
          là client, <strong>lễ tân</strong> là load balancer, từng{" "}
          <strong>đầu bếp</strong> là một replica mô hình, và{" "}
          <strong>bếp</strong> chính là GPU. Khi đông khách, lễ tân phân bàn
          đều cho các đầu bếp. Khi một đầu bếp làm nhiều tô cùng lúc cho tiết
          kiệm củi, đó là <em>batching</em>. Khi quản lý thấy hàng chờ dài,
          anh gọi thêm đầu bếp mới — đó là <em>autoscale</em>.
        </p>

        <p>
          Trong bối cảnh AI hiện đại, mỗi request thường là một chuỗi prompt
          token cần sinh ra tiếp theo một chuỗi completion token. GPU xử lý
          nhanh nhưng kích hoạt kernel đắt, cho nên mô hình muốn được gửi
          batch lớn để khấu hao chi phí khởi động kernel. Đây là lý do
          batching là trái tim của serving LLM.
        </p>

        <Callout variant="info" title="Vì sao serving khác training?">
          Training tối ưu cho <strong>throughput thô</strong> (số token/giây
          xử lý qua cụm lớn), còn serving tối ưu cho{" "}
          <strong>tail latency</strong> (độ trễ của request xấu nhất). Một
          hệ thống tốt cho training không nhất thiết tốt cho serving.
        </Callout>
      </LessonSection>

      {/* ================================================================
          STEP 3 — INTERACTIVE VISUALIZATION
          Kiến trúc inference server đầy đủ, có batching, queue, GPU util,
          latency distribution, autoscale.
          ================================================================ */}
      <LessonSection
        step={3}
        totalSteps={TOTAL_STEPS}
        label="Kiến trúc tương tác"
      >
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Điều chỉnh inference server, chế độ batching, số replica và QPS
          mục tiêu. Mỗi lần bấm <strong>Mô phỏng</strong> sẽ bơm một lô
          request vào hệ thống và cập nhật metrics phía dưới.
        </p>

        <VisualizationSection>
          <div className="space-y-6">
            {/* ======================= CONTROLS ======================= */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Server kind */}
              <div className="rounded-xl border border-border bg-card p-3 space-y-2">
                <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Inference server
                </p>
                <div className="flex flex-wrap gap-2">
                  {SERVER_ORDER.map((kind) => (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => setServerKind(kind)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        serverKind === kind
                          ? "bg-accent text-white"
                          : "bg-surface border border-border text-muted hover:text-foreground"
                      }`}
                    >
                      {SERVER_PROFILES[kind].name}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted leading-snug pt-1">
                  {activeProfile.subtitle}
                </p>
              </div>

              {/* Batch mode */}
              <div className="rounded-xl border border-border bg-card p-3 space-y-2">
                <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Batching
                </p>
                <div className="flex flex-wrap gap-2">
                  {(
                    ["static", "dynamic", "continuous"] as BatchMode[]
                  ).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setBatchMode(mode)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        batchMode === mode
                          ? "bg-accent text-white"
                          : "bg-surface border border-border text-muted hover:text-foreground"
                      }`}
                    >
                      {mode === "static"
                        ? "Tĩnh"
                        : mode === "dynamic"
                          ? "Động"
                          : "Continuous"}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted leading-snug pt-1">
                  {BATCH_DESCRIPTIONS[batchMode]}
                </p>
              </div>

              {/* Replicas */}
              <div className="rounded-xl border border-border bg-card p-3 space-y-2">
                <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Số replica ({replicas})
                </p>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setReplicas(n)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        replicas === n
                          ? "bg-accent text-white"
                          : "bg-surface border border-border text-muted hover:text-foreground"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-2 text-[11px] text-muted pt-1">
                  <input
                    type="checkbox"
                    checked={autoscale}
                    onChange={(e) => setAutoscale(e.target.checked)}
                    className="h-3.5 w-3.5 rounded"
                  />
                  <span>
                    Autoscale theo QPS (scale-up khi GPU util &gt; 75%,
                    scale-down khi &lt; 25%)
                  </span>
                </label>
              </div>

              {/* QPS slider */}
              <div className="rounded-xl border border-border bg-card p-3 space-y-2">
                <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                  QPS mục tiêu ({qpsTarget})
                </p>
                <input
                  type="range"
                  min={1}
                  max={32}
                  step={1}
                  value={qpsTarget}
                  onChange={(e) => setQpsTarget(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-muted">
                  <span>1 QPS</span>
                  <span>16 QPS</span>
                  <span>32 QPS</span>
                </div>
              </div>
            </div>

            {/* ======================= ACTION BAR ======================= */}
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                type="button"
                onClick={simulateBatch}
                className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Mô phỏng 1 giây
              </button>
              <button
                type="button"
                onClick={() => {
                  for (let i = 0; i < 10; i++) {
                    // Chúng ta chỉ gọi 10 lần — state cập nhật batched bởi React.
                    simulateBatch();
                  }
                }}
                className="rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
              >
                Mô phỏng 10 giây
              </button>
              <button
                type="button"
                onClick={resetSim}
                className="rounded-lg bg-surface border border-border px-4 py-1.5 text-sm font-semibold text-muted hover:text-foreground transition-colors"
              >
                Reset
              </button>
            </div>

            {/* ======================= ARCHITECTURE DIAGRAM ======================= */}
            <svg
              viewBox="0 0 640 280"
              className="w-full max-w-3xl mx-auto rounded-xl border border-border bg-card"
            >
              {/* Clients column */}
              <g>
                <rect
                  x={16}
                  y={60}
                  width={90}
                  height={160}
                  rx={10}
                  fill="#1e293b"
                  stroke="#475569"
                />
                <text
                  x={61}
                  y={82}
                  textAnchor="middle"
                  fill="white"
                  fontSize={11}
                  fontWeight="bold"
                >
                  Clients
                </text>
                <text
                  x={61}
                  y={100}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize={11}
                >
                  HTTP / gRPC
                </text>
                <text
                  x={61}
                  y={140}
                  textAnchor="middle"
                  fill="#60a5fa"
                  fontSize={18}
                  fontWeight="bold"
                >
                  {qpsTarget}
                </text>
                <text
                  x={61}
                  y={156}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize={11}
                >
                  QPS target
                </text>
                <text
                  x={61}
                  y={190}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize={11}
                >
                  Queue: {totalInQueue}
                </text>
                <text
                  x={61}
                  y={206}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize={11}
                >
                  Done: {doneRequests.length}
                </text>
              </g>

              {/* Arrow to LB */}
              <line
                x1={106}
                y1={140}
                x2={175}
                y2={140}
                stroke="#64748b"
                strokeWidth={2}
              />
              <polygon points="170,135 182,140 170,145" fill="#64748b" />

              {/* Load balancer */}
              <rect
                x={180}
                y={90}
                width={110}
                height={100}
                rx={12}
                fill="#f59e0b"
              />
              <text
                x={235}
                y={120}
                textAnchor="middle"
                fill="white"
                fontSize={11}
                fontWeight="bold"
              >
                Load Balancer
              </text>
              <text
                x={235}
                y={138}
                textAnchor="middle"
                fill="white"
                fontSize={11}
              >
                Envoy / NGINX
              </text>
              <text
                x={235}
                y={154}
                textAnchor="middle"
                fill="white"
                fontSize={11}
                opacity={0.85}
              >
                Round robin
              </text>
              <text
                x={235}
                y={170}
                textAnchor="middle"
                fill="white"
                fontSize={11}
                opacity={0.85}
              >
                Health check
              </text>

              {/* Arrows to each replica */}
              {Array.from({ length: replicas }).map((_, i) => {
                const y = 30 + i * (220 / Math.max(1, replicas));
                return (
                  <line
                    key={i}
                    x1={290}
                    y1={140}
                    x2={360}
                    y2={y + 20}
                    stroke="#64748b"
                    strokeWidth={1.4}
                  />
                );
              })}

              {/* Replicas */}
              {Array.from({ length: replicas }).map((_, i) => {
                const y = 10 + i * (250 / Math.max(1, replicas));
                const server = servers[i];
                const util = server?.gpuUtil ?? 0;
                const profile = SERVER_PROFILES[serverKind];
                return (
                  <g key={i}>
                    <rect
                      x={370}
                      y={y + 8}
                      width={170}
                      height={46}
                      rx={10}
                      fill="#0f172a"
                      stroke={profile.color}
                      strokeWidth={server?.busy ? 2 : 1}
                    />
                    <text
                      x={385}
                      y={y + 26}
                      fill="white"
                      fontSize={11}
                      fontWeight="bold"
                    >
                      {profile.name} #{i + 1}
                    </text>
                    <text
                      x={385}
                      y={y + 42}
                      fill="#94a3b8"
                      fontSize={11}
                    >
                      Batches {server?.processed ?? 0} · util{" "}
                      {(util * 100).toFixed(0)}%
                    </text>
                    {/* GPU util bar */}
                    <rect
                      x={460}
                      y={y + 18}
                      width={70}
                      height={8}
                      rx={4}
                      fill="#1e293b"
                    />
                    <rect
                      x={460}
                      y={y + 18}
                      width={70 * util}
                      height={8}
                      rx={4}
                      fill={profile.color}
                    />
                  </g>
                );
              })}

              {/* GPU cluster label */}
              <text
                x={455}
                y={275}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize={11}
              >
                Server pool — mỗi replica giữ model trong VRAM
              </text>

              {/* Autoscale indicator */}
              {autoscale && (
                <motion.g
                  key={`scale-${replicas}-${shouldScaleUp ? 1 : 0}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <circle
                    cx={600}
                    cy={30}
                    r={14}
                    fill={shouldScaleUp ? "#22c55e" : "#1e293b"}
                    stroke="#22c55e"
                    strokeWidth={1.5}
                  />
                  <text
                    x={600}
                    y={34}
                    textAnchor="middle"
                    fill="white"
                    fontSize={11}
                    fontWeight="bold"
                  >
                    {shouldScaleUp ? "↑" : shouldScaleDown ? "↓" : "="}
                  </text>
                </motion.g>
              )}
            </svg>

            {/* ======================= METRICS GRID ======================= */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl border border-border bg-card p-3 text-center">
                <p className="text-[11px] text-muted">QPS thực đo</p>
                <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                  {currentQps.toFixed(1)}
                </p>
                <p className="text-[10px] text-muted">req/s</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-3 text-center">
                <p className="text-[11px] text-muted">GPU util TB</p>
                <p className="text-lg font-bold text-green-700 dark:text-green-400">
                  {(avgGpuUtil * 100).toFixed(0)}%
                </p>
                <p className="text-[10px] text-muted">trên {replicas} replica</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-3 text-center">
                <p className="text-[11px] text-muted">Hàng chờ</p>
                <p className="text-lg font-bold text-amber-700 dark:text-amber-400">
                  {totalInQueue}
                </p>
                <p className="text-[10px] text-muted">req chưa phục vụ</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-3 text-center">
                <p className="text-[11px] text-muted">Đã hoàn thành</p>
                <p className="text-lg font-bold text-foreground">
                  {doneRequests.length}
                </p>
                <p className="text-[10px] text-muted">request</p>
              </div>
            </div>

            {/* Latency percentile panel */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  Phân phối latency
                </p>
                <p className="text-[11px] text-muted">
                  dựa trên {sortedLatencies.length} request
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[11px] text-muted">P50</p>
                  <p className="text-lg font-bold text-green-700 dark:text-green-400">
                    {fmtMs(p50)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted">P95</p>
                  <p className="text-lg font-bold text-amber-700 dark:text-amber-400">
                    {fmtMs(p95)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted">P99</p>
                  <p className="text-lg font-bold text-red-700 dark:text-red-400">
                    {fmtMs(p99)}
                  </p>
                </div>
              </div>
              {/* Mini histogram */}
              <div className="flex items-end gap-0.5 h-16">
                {Array.from({ length: 40 }).map((_, i) => {
                  const cutoff =
                    sortedLatencies.length === 0
                      ? 0
                      : sortedLatencies[sortedLatencies.length - 1];
                  const bucket =
                    sortedLatencies.filter(
                      (v) =>
                        v >= (cutoff / 40) * i && v < (cutoff / 40) * (i + 1),
                    ).length;
                  const h = Math.min(64, bucket * 12 + 2);
                  const color =
                    i >= 36 ? "#ef4444" : i >= 32 ? "#f59e0b" : "#22c55e";
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-t"
                      style={{ height: h, background: color, opacity: 0.75 }}
                    />
                  );
                })}
              </div>
              <p className="text-[11px] text-muted">
                Cột xanh — request nhanh. Cột cam — tail. Cột đỏ — outlier
                (những request 1% xấu nhất — chính chúng quyết định SLA P99).
              </p>
            </div>

            {/* Server card */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ background: activeProfile.color }}
                />
                <p className="text-sm font-semibold">
                  {activeProfile.name}
                </p>
                <p className="text-[11px] text-muted">
                  — {activeProfile.subtitle}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px]">
                <div>
                  <p className="text-muted font-semibold">Mạnh ở</p>
                  <ul className="list-disc list-inside space-y-0.5 pl-1">
                    {activeProfile.strengths.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-muted font-semibold">Hạn chế</p>
                  <ul className="list-disc list-inside space-y-0.5 pl-1">
                    {activeProfile.weaknesses.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="text-[11px] text-muted pt-1">
                Batching mặc định: {activeProfile.batching}. Phù hợp nhất
                cho: {activeProfile.bestFor}.
              </p>
            </div>

            <Callout variant="tip" title="Thử nghiệm gợi ý">
              (1) Giữ batching <strong>static</strong> và đẩy QPS lên 30 —
              quan sát P99 tăng vọt vì head-of-line blocking. (2) Chuyển
              sang <strong>continuous</strong> — GPU util leo lên gần 100%
              nhưng P99 giảm. (3) Bật autoscale với 1 replica và QPS 25 —
              hệ thống sẽ tự tăng lên 2-3 replica.
            </Callout>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ================================================================
          STEP 4 — AHA MOMENT
          ================================================================ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Trái tim của một hệ thống serving hiện đại không phải là kiến
            trúc mạng, mà là <strong>chiến lược batching</strong>. Continuous
            batching biến GPU từ một cỗ máy &quot;đợi đầy mới chạy&quot;
            thành một băng chuyền luôn bận: request cũ vừa xong một
            iteration thì request mới đã nhảy vào slot trống. Đó là lý do
            vLLM đạt throughput <strong>5-10×</strong> so với serving
            kiểu &quot;một request — một inference&quot;, mà vẫn giữ được P99
            latency thấp.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ================================================================
          STEP 5 — INLINE CHALLENGES
          ================================================================ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Sản phẩm của bạn cần P99 latency ≤ 300ms với 50 QPS sustained. Bạn đang dùng batching tĩnh 16 với 2 GPU. Bước nào sẽ giúp ngay?"
          options={[
            "Tăng batch size tĩnh lên 32 để throughput cao hơn",
            "Chuyển sang continuous batching và bật streaming để cắt time-to-first-token",
            "Tắt load balancer để bớt một hop",
            "Giảm model về 1B để chắc chắn nhanh",
          ]}
          correct={1}
          explanation="Continuous batching loại bỏ head-of-line blocking và streaming trả token ngay khi có, nên người dùng cảm nhận 'đang chạy' rất sớm. Tăng batch size tĩnh chỉ làm P99 tệ hơn. Giảm model là giải pháp cuối cùng, không phải đầu tiên."
        />

        <div className="mt-4">
          <InlineChallenge
            question="Một replica đang xử lý continuous batching 48 slot, GPU util 95%, P50 140ms, P99 520ms. Autoscale nên làm gì theo QPS rule?"
            options={[
              "Scale-down vì P50 còn thấp",
              "Giữ nguyên vì GPU chưa 100%",
              "Scale-up: GPU gần bão hoà và tail latency đã vượt ngưỡng — cần thêm replica để chia tải",
              "Reboot server cho chắc",
            ]}
            correct={2}
            explanation="Ở 95% util, replica sắp bão hoà. Khi bão hoà, queue tăng và P99 bay thẳng lên. Scale-up một bước trước khi nghẽn mới là kịp — replica mới cần ~30-90s để warm up (load weight, allocate KV-cache)."
          />
        </div>
      </LessonSection>

      {/* ================================================================
          STEP 6 — EXPLANATION
          ================================================================ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Model serving</strong> là quá trình biến một checkpoint
            đã huấn luyện thành một dịch vụ trực tuyến có SLA rõ ràng về{" "}
            <em>latency</em>, <em>throughput</em> và <em>availability</em>.
            Khác với batch inference (offline, chạy 1 lần qua dataset),
            serving phải trả lời từng request trong hàng chục mili giây
            đến vài giây, 24/7.
          </p>

          <p>
            <strong>Hai chỉ số nền tảng:</strong>
          </p>

          <LaTeX block>
            {
              "\\text{Throughput} = \\frac{\\#\\text{req hoàn thành}}{\\Delta t} = \\text{replicas} \\times \\text{per\\_replica\\_throughput}"
            }
          </LaTeX>

          <LaTeX block>
            {
              "\\text{Latency}_{p99} = \\underbrace{W_{\\text{queue}}}_{\\text{chờ}} + \\underbrace{W_{\\text{batch}}}_{\\text{form batch}} + \\underbrace{T_{\\text{infer}}}_{\\text{GPU}} + \\underbrace{T_{\\text{net}}}_{\\text{mạng}}"
            }
          </LaTeX>

          <p>
            Tail latency (P95/P99) thường quan trọng hơn trung bình, vì
            đúng những request chậm đó mới là nơi người dùng phàn nàn, mất
            conversion và khiếu nại support.
          </p>

          <Callout variant="info" title="SLI / SLO / SLA">
            SLI là số đo được (ví dụ: P99 latency). SLO là mục tiêu nội bộ
            (≤ 500ms). SLA là cam kết có ràng buộc với khách hàng (nếu vi
            phạm → hoàn tiền). Với LLM thương mại, SLA tiêu biểu: P50 ≤
            500ms đến token đầu, P99 ≤ 2s đến hoàn tất 256 token.
          </Callout>

          <p>
            <strong>Các thành phần kiến trúc chuẩn:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <strong>API Gateway:</strong> terminate TLS, xác thực JWT / API
              key, rate-limit theo user/tenant, log request.
            </li>
            <li>
              <strong>Load Balancer (L4/L7):</strong> Envoy, NGINX, AWS ALB —
              phân phối request, health-check replica, blue/green deploy.
            </li>
            <li>
              <strong>Inference Server:</strong> vLLM, TGI, Triton, Ray Serve
              — đây là nơi model thực thi, batching, và KV-cache sống.
            </li>
            <li>
              <strong>Request Queue:</strong> đệm khi traffic spike; có thể
              là queue nội bộ của server hoặc hệ thống ngoài (Redis, Kafka)
              với fanout đến nhiều replica.
            </li>
            <li>
              <strong>Autoscaler:</strong> HPA/KEDA trên Kubernetes đo QPS
              hoặc GPU util để thêm / bớt pod.
            </li>
            <li>
              <strong>Observability:</strong> Prometheus + Grafana cho
              metric, OpenTelemetry cho trace, Loki cho log.
            </li>
          </ul>

          <p>
            <strong>Ba kiểu batching:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <strong>Static batching:</strong> chờ đủ N request rồi mới
              phóng. Throughput ổn định nhưng tail latency tệ vì
              head-of-line blocking.
            </li>
            <li>
              <strong>Dynamic batching:</strong> gom trong cửa sổ thời gian
              ngắn (ví dụ 5-20ms). Triton mặc định kiểu này.
            </li>
            <li>
              <strong>Continuous batching (iteration-level):</strong> request
              mới nhảy vào batch đang decode ngay khi có slot — vLLM là
              người tiên phong. Đây là chuẩn cho LLM hiện đại.
            </li>
          </ul>

          <CodeBlock language="python" title="Serving LLM với vLLM — full example">
            {`from vllm import LLM, SamplingParams
from vllm.entrypoints.openai.api_server import run_server

# 1) Khởi tạo engine
#    - PagedAttention + continuous batching bật mặc định
#    - tensor_parallel_size=2 chia model qua 2 GPU
llm = LLM(
    model="meta-llama/Meta-Llama-3-8B-Instruct",
    tensor_parallel_size=2,
    max_model_len=8192,
    gpu_memory_utilization=0.90,
    swap_space=8,            # GB host memory cho CPU offload
    enable_prefix_caching=True,
)

# 2) Offline inference (test nhanh)
prompts = [
    "Tóm tắt tin: 'FPT mở mảng AI...'",
    "Viết email xin nghỉ phép 2 ngày, giọng văn thân thiện.",
]
sp = SamplingParams(temperature=0.7, max_tokens=256, top_p=0.95)
for out in llm.generate(prompts, sp):
    print(out.prompt[:40], "=>", out.outputs[0].text[:80])

# 3) Serving qua OpenAI-compatible API:
#    $ python -m vllm.entrypoints.openai.api_server \\
#        --model meta-llama/Meta-Llama-3-8B-Instruct \\
#        --host 0.0.0.0 --port 8000 \\
#        --tensor-parallel-size 2 \\
#        --max-num-seqs 256          # continuous batch size tối đa
#
#    Client dùng openai SDK trỏ vào base_url http://localhost:8000/v1`}
          </CodeBlock>

          <Callout variant="warning" title="Pitfall phổ biến">
            Để <strong>max_num_seqs</strong> (kích thước batch continuous)
            quá cao sẽ tốn nhiều VRAM cho KV-cache và dễ OOM. Quá thấp thì
            GPU chưa bão hoà, throughput kém. Tune theo sequence length
            trung bình và VRAM còn lại — bắt đầu từ 128 rồi điều chỉnh.
          </Callout>

          <p>
            <strong>Autoscale dựa trên QPS:</strong> trong Kubernetes, KEDA
            là lựa chọn phổ biến. Cấu hình dưới đây trigger scale-up khi
            QPS đo qua Prometheus vượt 40 req/s mỗi pod:
          </p>

          <CodeBlock language="yaml" title="KEDA ScaledObject cho QPS autoscale">
            {`apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: vllm-llama-scaler
  namespace: ai-serving
spec:
  scaleTargetRef:
    name: vllm-llama
  minReplicaCount: 1
  maxReplicaCount: 8
  pollingInterval: 15
  cooldownPeriod: 120
  triggers:
    - type: prometheus
      metadata:
        serverAddress: http://prometheus.observability:9090
        query: |
          sum(rate(vllm_requests_total[1m])) by (deployment)
        threshold: "40"        # req/s / pod trước khi +1 pod
        metricName: vllm_qps
    - type: prometheus
      metadata:
        serverAddress: http://prometheus.observability:9090
        query: |
          avg(nvidia_gpu_utilization{pod=~"vllm-llama-.*"})
        threshold: "75"        # % GPU util
        metricName: gpu_util`}
          </CodeBlock>

          <CollapsibleDetail title="Chi tiết — tại sao continuous batching thắng static batching">
            <p>
              Trong decoder-only LLM, mỗi token mới cần đúng một bước forward
              qua toàn bộ layer, và bước này gần như không song song được
              trong một request (tuần tự bản chất). GPU chỉ &quot;phí thời
              gian&quot; nếu batch nhỏ so với năng lực của nó. Continuous
              batching giữ batch luôn gần cực đại bằng cách cho request mới
              lấp chỗ trống ngay lập tức ở mỗi iteration — không cần đợi
              request cũ sinh hết 2000 token.
            </p>
            <p className="mt-2">
              Bản chất đây là một dạng <em>work-conserving scheduler</em>:
              GPU không bao giờ idle nếu hàng chờ còn request. Kết hợp với
              PagedAttention (KV-cache chia page), vLLM có thể nhét nhiều
              request có độ dài khác nhau vào cùng batch mà không phí VRAM
              cho padding — đây là khác biệt kỹ thuật chính so với các
              giải pháp cũ.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Chi tiết — so sánh 4 framework ở khía cạnh vận hành">
            <ul className="list-disc list-inside space-y-1 pl-2 text-[13px]">
              <li>
                <strong>vLLM</strong> — throughput vô địch cho LLM.
                OpenAI-compatible API sẵn dùng. Bật prefix caching cho
                RAG dùng lại system prompt lớn.
              </li>
              <li>
                <strong>TGI</strong> — Hugging Face stack, đồng bộ tốt với
                Hub. Hỗ trợ quantize AWQ/GPTQ + flash-attn. Throughput
                thường thua vLLM nhẹ nhưng stable.
              </li>
              <li>
                <strong>Triton</strong> — lựa chọn tốt khi production
                không chỉ LLM: bạn có vision model + recommender + LLM,
                tất cả cùng một server. Cần hiểu config.pbtxt.
              </li>
              <li>
                <strong>Ray Serve</strong> — khi workload là pipeline
                phức tạp: embedding → retrieve → rerank → generate. Mỗi
                bước autoscale độc lập, traffic split A/B dễ.
              </li>
            </ul>
          </CollapsibleDetail>

          <p>
            <strong>Trong thực tế — stack production Việt Nam:</strong> một
            pattern quen thuộc là Kubernetes (GKE / EKS / FPT Cloud K8s)
            + vLLM + Envoy + KEDA + Prometheus. Cold-start model 70B mất
            60-120 giây nên pre-provision minReplicas = 1 luôn sống,
            maxReplicas cover peak. Xem thêm{" "}
            <TopicLink slug="inference-optimization">
              tối ưu suy luận
            </TopicLink>{" "}
            để biết cách giảm latency từng request, và{" "}
            <TopicLink slug="containerization">container hoá</TopicLink>{" "}
            để đóng gói runtime tái lập được.
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ================================================================
          STEP 7 — SUMMARY
          ================================================================ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="6 điều cốt lõi về Model Serving"
          points={[
            "Serving biến checkpoint thành dịch vụ online với SLA về latency, throughput, availability — khác hẳn batch inference offline.",
            "Hai chỉ số nền tảng: latency (thường đo P50/P95/P99) và throughput (req/s). Tail latency quan trọng hơn trung bình.",
            "Continuous batching là đột phá quan trọng nhất cho LLM serving: GPU luôn bận, không còn head-of-line blocking, throughput 5-10× so với static.",
            "Kiến trúc chuẩn: Client → API Gateway → Load Balancer → Inference Server (vLLM/TGI/Triton/Ray Serve) → GPU, kèm Queue và Observability.",
            "Autoscale nên dùng leading indicator (QPS, queue depth, GPU util) chứ không đợi CPU 100%. KEDA + Prometheus là combo phổ biến trên Kubernetes.",
            "Chọn framework theo bài toán: vLLM cho LLM throughput tối đa; TGI nếu đã có stack Hugging Face; Triton cho đa dạng model; Ray Serve cho pipeline phức tạp.",
          ]}
        />
      </LessonSection>

      {/* ================================================================
          STEP 8 — QUIZ
          ================================================================ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
