"use client";

import { useState, useMemo } from "react";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "model-serving",
  title: "Model Serving",
  titleVi: "Phục vụ mô hình — Đưa AI vào thực tế",
  description:
    "Quy trình triển khai và cung cấp mô hình AI dưới dạng dịch vụ, xử lý yêu cầu từ người dùng trong thời gian thực.",
  category: "infrastructure",
  tags: ["serving", "deployment", "api", "inference"],
  difficulty: "intermediate",
  relatedSlugs: ["inference-optimization", "containerization", "mlops"],
  vizType: "interactive",
};

/* ── Serving simulation ── */
interface Request {
  id: number;
  status: "queued" | "processing" | "done";
  replica: number;
  latencyMs: number;
}

const TOTAL_STEPS = 7;

export default function ModelServingTopic() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [replicas, setReplicas] = useState(2);
  const [nextId, setNextId] = useState(1);

  const addBatch = () => {
    const batch: Request[] = Array.from({ length: 6 }, (_, i) => ({
      id: nextId + i,
      status: "queued" as const,
      replica: -1,
      latencyMs: 0,
    }));
    setNextId((p) => p + 6);

    /* Simulate round-robin assignment */
    const assigned = batch.map((r, i) => ({
      ...r,
      status: "processing" as const,
      replica: i % replicas,
      latencyMs: 80 + Math.floor(Math.random() * 120),
    }));

    setRequests((prev) => [...prev.slice(-12), ...assigned]);

    setTimeout(() => {
      setRequests((prev) =>
        prev.map((r) =>
          assigned.find((a) => a.id === r.id)
            ? { ...r, status: "done" as const }
            : r
        )
      );
    }, 1200);
  };

  const avgLatency = useMemo(() => {
    const done = requests.filter((r) => r.status === "done");
    if (done.length === 0) return 0;
    return Math.round(done.reduce((s, r) => s + r.latencyMs, 0) / done.length);
  }, [requests]);

  const throughput = useMemo(() => {
    const done = requests.filter((r) => r.status === "done").length;
    return done;
  }, [requests]);

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Tại sao cần load balancer trong hệ thống model serving?",
      options: [
        "Để mã hoá dữ liệu gửi đi",
        "Để phân phối yêu cầu đều giữa các bản sao mô hình, tránh quá tải",
        "Để huấn luyện mô hình nhanh hơn",
      ],
      correct: 1,
      explanation: "Load balancer phân phối request đều giữa các replica. Nếu không có, một replica quá tải trong khi các replica khác rảnh, gây tăng latency và giảm throughput.",
    },
    {
      question: "Continuous batching khác static batching ở điểm nào?",
      options: [
        "Gộp request ngay khi có slot trống, không đợi batch đầy",
        "Xử lý từng request một để đảm bảo chất lượng",
        "Chỉ hoạt động trên CPU, không dùng GPU",
      ],
      correct: 0,
      explanation: "Continuous batching cho phép request mới vào batch ngay khi có request cũ hoàn thành, tận dụng GPU tối đa thay vì đợi cả batch xong mới nhận batch tiếp.",
    },
    {
      question: "Khi nào nên dùng gRPC thay vì REST cho model serving?",
      options: [
        "Khi cần giao diện web đẹp",
        "Khi cần latency thấp, throughput cao và giao tiếp giữa các microservice",
        "Khi mô hình quá lớn để chạy trên GPU",
      ],
      correct: 1,
      explanation: "gRPC dùng Protocol Buffers (binary) thay vì JSON (text), giảm kích thước payload và tăng tốc serialize/deserialize. Rất phù hợp cho giao tiếp nội bộ giữa các service.",
    },
  ], []);

  return (
    <>
      {/* STEP 1: PREDICTION GATE */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn đã huấn luyện xong mô hình AI nhận diện khuôn mặt cho hệ thống chấm công FPT. Bước tiếp theo để 10.000 nhân viên dùng được là gì?"
          options={[
            "Gửi file model cho mỗi nhân viên tự chạy trên máy tính cá nhân",
            "Đặt model trên server, tạo API để ứng dụng gửi ảnh và nhận kết quả",
            "In kết quả nhận diện ra giấy và phân phát",
          ]}
          correct={1}
          explanation="Đúng vậy! Model Serving biến mô hình thành dịch vụ API — ứng dụng gửi request, server xử lý và trả kết quả. Giống nhà hàng: đầu bếp giỏi (model) cần nhà hàng (serving infrastructure) để phục vụ khách."
        >

      {/* STEP 2: INTERACTIVE VIZ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Thử điều chỉnh số <strong className="text-foreground">replica</strong>{" "}
          (bản sao mô hình) và gửi batch request để xem load balancer phân phối.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            {/* Replica control */}
            <div className="flex items-center gap-4 justify-center">
              <span className="text-sm text-muted">Số replica:</span>
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => { setReplicas(n); setRequests([]); }}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                    replicas === n
                      ? "bg-accent text-white"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={addBatch}
                className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Gửi 6 requests
              </button>
            </div>

            {/* Architecture SVG */}
            <svg viewBox="0 0 600 220" className="w-full max-w-2xl mx-auto">
              {/* Clients */}
              <rect x={20} y={80} width={90} height={50} rx={8} fill="#3b82f6" opacity={0.8} />
              <text x={65} y={102} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">Clients</text>
              <text x={65} y={118} textAnchor="middle" fill="white" fontSize={8}>{requests.length} reqs</text>

              {/* Arrow to LB */}
              <line x1={110} y1={105} x2={185} y2={105} stroke="#475569" strokeWidth={2} />
              <polygon points="183,100 193,105 183,110" fill="#475569" />

              {/* Load Balancer */}
              <rect x={195} y={75} width={100} height={60} rx={10} fill="#f59e0b" />
              <text x={245} y={100} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">Load Balancer</text>
              <text x={245} y={116} textAnchor="middle" fill="white" fontSize={7}>Round Robin</text>

              {/* Replicas */}
              {Array.from({ length: replicas }, (_, i) => {
                const y = 20 + i * (180 / replicas);
                const replicaReqs = requests.filter((r) => r.replica === i);
                const active = replicaReqs.some((r) => r.status === "processing");
                return (
                  <g key={i}>
                    <line x1={295} y1={105} x2={385} y2={y + 22} stroke="#475569" strokeWidth={1.5} />
                    <rect
                      x={390} y={y} width={130} height={44} rx={8}
                      fill={active ? "#22c55e" : "#1e293b"}
                      stroke="#22c55e" strokeWidth={active ? 2 : 1}
                    />
                    <text x={455} y={y + 18} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">
                      Replica {i + 1}
                    </text>
                    <text x={455} y={y + 33} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                      {replicaReqs.filter((r) => r.status === "done").length} done
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border border-border bg-card p-2">
                <p className="text-xs text-muted">Throughput</p>
                <p className="text-lg font-bold text-green-400">{throughput}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-2">
                <p className="text-xs text-muted">Avg Latency</p>
                <p className="text-lg font-bold text-blue-400">{avgLatency}ms</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-2">
                <p className="text-xs text-muted">Replicas</p>
                <p className="text-lg font-bold text-amber-400">{replicas}</p>
              </div>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* STEP 3: AHA */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Tăng replica giúp xử lý nhiều request hơn, nhưng <strong>chi phí tăng tuyến tính</strong>{" "}
            (2 replica = 2x GPU). Bí quyết thực tế: kết hợp <strong>auto-scaling</strong>{" "}
            (tự tăng/giảm replica) với <strong>continuous batching</strong>{" "}
            (gộp nhiều request vào 1 lần tính GPU) để tối ưu cả tốc độ lẫn chi phí!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* STEP 4: CHALLENGE */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Hệ thống serving của bạn nhận 1000 req/s nhưng chỉ có 2 GPU. Mỗi GPU xử lý 200 req/s. Giải pháp nào hiệu quả nhất?"
          options={[
            "Thêm 3 GPU nữa cho đủ 5 GPU",
            "Dùng continuous batching + quantization để mỗi GPU xử lý 500 req/s, chỉ cần 2 GPU",
            "Từ chối request vượt quá khả năng",
          ]}
          correct={1}
          explanation="Tối ưu phần mềm (batching, quantization) thường rẻ hơn nhiều so với thêm phần cứng. Continuous batching tăng GPU utilization từ 30% lên 90%, quantization giảm compute per request 2-4x."
        />
      </LessonSection>

      {/* STEP 5: EXPLANATION */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Model Serving</strong>{" "}
            là quá trình triển khai mô hình AI đã huấn luyện thành dịch vụ có thể nhận yêu cầu và trả về kết quả trong thời gian thực.
          </p>

          <p><strong>Kiến trúc serving cơ bản:</strong></p>

          <LaTeX block>{"\\text{Throughput} = \\frac{\\text{Requests processed}}{\\text{Time}} = \\text{Replicas} \\times \\text{Throughput per replica}"}</LaTeX>

          <LaTeX block>{"\\text{Latency}_{p99} = \\text{Queue wait} + \\text{Inference time} + \\text{Network overhead}"}</LaTeX>

          <Callout variant="tip" title="Latency vs Throughput">
            Hai chỉ số này thường đánh đổi nhau. Batching tăng throughput nhưng tăng latency cho request đầu tiên trong batch. Hệ thống tốt cân bằng cả hai theo yêu cầu cụ thể.
          </Callout>

          <p><strong>Các thành phần chính:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>API Gateway:</strong>{" "}Nhận HTTP/gRPC request, xác thực, rate limiting</li>
            <li><strong>Load Balancer:</strong>{" "}Phân phối request giữa các replica (Round Robin, Least Connections)</li>
            <li><strong>Inference Engine:</strong>{" "}Thực thi model trên GPU/CPU (vLLM, TGI, Triton)</li>
            <li><strong>Request Queue:</strong>{" "}Buffer khi traffic spike vượt capacity</li>
            <li><strong>Auto-scaler:</strong>{" "}Tự điều chỉnh số replica theo tải (HPA trong K8s)</li>
          </ul>

          <p><strong>Serving patterns cho LLM:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Continuous Batching:</strong>{" "}Request mới vào batch ngay khi có slot, không đợi cả batch xong</li>
            <li><strong>Speculative Decoding:</strong>{" "}Model nhỏ dự đoán trước, model lớn verify — tăng tốc 2-3x</li>
            <li><strong>Streaming:</strong>{" "}Trả token từng cái qua SSE/WebSocket, giảm time-to-first-token</li>
          </ul>

          <CodeBlock language="python" title="Serving LLM với vLLM">
{`from vllm import LLM, SamplingParams

# Khởi tạo engine (auto optimize: PagedAttention, continuous batching)
llm = LLM(
    model="meta-llama/Llama-3-8B-Instruct",
    tensor_parallel_size=2,    # Chia model qua 2 GPU
    max_model_len=4096,
    gpu_memory_utilization=0.9,
)

# Serving nhiều request cùng lúc
prompts = ["Thủ đô Việt Nam là", "FPT Cloud cung cấp"]
params = SamplingParams(temperature=0.7, max_tokens=256)
outputs = llm.generate(prompts, params)  # Auto batching

for out in outputs:
    print(out.outputs[0].text)`}
          </CodeBlock>

          <Callout variant="info" title="FPT Cloud AI">
            Tại Việt Nam, FPT Cloud cung cấp GPU serving infrastructure cho doanh nghiệp. Nhiều startup dùng kết hợp FPT Cloud cho production và cloud quốc tế cho dev/staging.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* STEP 6: SUMMARY */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "Model Serving biến model thành API service — nhận request, xử lý trên GPU, trả kết quả real-time.",
          "Load Balancer phân phối traffic giữa nhiều replica để tăng throughput và reliability.",
          "Continuous batching + quantization tối ưu GPU utilization, giảm chi phí 5-10x so với serving naive.",
          "Auto-scaling tự điều chỉnh số replica theo tải — tiết kiệm chi phí khi traffic thấp, đảm bảo SLA khi traffic cao.",
          "Công cụ phổ biến: vLLM, TGI, Triton cho inference; Kubernetes cho orchestration; Prometheus cho monitoring.",
        ]} />
      </LessonSection>

      {/* STEP 7: QUIZ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>

        </PredictionGate>
      </LessonSection>
    </>
  );
}
