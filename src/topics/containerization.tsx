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

/* ──────────────────────────────────────────────────────────────────
 * METADATA
 * ──────────────────────────────────────────────────────────────── */
export const metadata: TopicMeta = {
  slug: "containerization",
  title: "Containerization",
  titleVi: "Container hoá — Đóng gói AI gọn gàng",
  description:
    "Kỹ thuật đóng gói mô hình AI cùng mọi phụ thuộc vào container, đảm bảo chạy nhất quán trên mọi môi trường.",
  category: "infrastructure",
  tags: ["docker", "kubernetes", "container", "deployment"],
  difficulty: "advanced",
  relatedSlugs: ["model-serving", "mlops", "gpu-optimization"],
  vizType: "interactive",
};

/* ──────────────────────────────────────────────────────────────────
 * LIFECYCLE STEPS — Dockerfile → Image → Container → Networking
 * ──────────────────────────────────────────────────────────────── */
interface LifecycleStep {
  id: number;
  title: string;
  command: string;
  description: string;
  output: string;
  color: string;
  icon: string;
}

const LIFECYCLE: LifecycleStep[] = [
  {
    id: 0,
    title: "1. Viết Dockerfile",
    command: "$ vim Dockerfile",
    description:
      "Dockerfile là bản thiết kế: mô tả base image, dependencies, mã nguồn, cổng, lệnh chạy.",
    output: `FROM python:3.11-slim
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY ./app /app
EXPOSE 8000
CMD ["uvicorn", "app:main", "--port", "8000"]`,
    color: "#3b82f6",
    icon: "📄",
  },
  {
    id: 1,
    title: "2. Build Image",
    command: "$ docker build -t ml-api:v1 .",
    description:
      "Docker đọc Dockerfile, thực thi từng lệnh, tạo layer cache tuần tự. Kết quả là một image bất biến.",
    output: `[+] Building 42.3s
 => [1/5] FROM python:3.11-slim
 => [2/5] COPY requirements.txt .
 => [3/5] RUN pip install -r requirements.txt
 => [4/5] COPY ./app /app
 => [5/5] EXPOSE 8000
 => exporting to image
 => => naming to docker.io/library/ml-api:v1
Size: 1.24 GB · 5 layers`,
    color: "#f59e0b",
    icon: "🏗️",
  },
  {
    id: 2,
    title: "3. Run Container",
    command: "$ docker run -d -p 8000:8000 --name serving ml-api:v1",
    description:
      "Container là một tiến trình đang chạy khởi tạo từ image, có namespace riêng (PID, net, mnt).",
    output: `a9f2c1e8…  ml-api:v1  Up 2s  0.0.0.0:8000->8000/tcp  serving
STATUS: healthy · PID 1: uvicorn · RSS 412 MB`,
    color: "#22c55e",
    icon: "🚀",
  },
  {
    id: 3,
    title: "4. Networking",
    command: "$ docker network connect prod-net serving",
    description:
      "Bridge/overlay network kết nối nhiều container. DNS nội bộ cho phép gọi nhau bằng tên dịch vụ.",
    output: `bridge/prod-net  10.0.0.0/24
- serving     10.0.0.11
- postgres    10.0.0.12
- nginx       10.0.0.13
Ping: serving → postgres  0.21ms`,
    color: "#a855f7",
    icon: "🌐",
  },
  {
    id: 4,
    title: "5. Orchestration",
    command: "$ kubectl apply -f deployment.yaml",
    description:
      "Kubernetes đóng gói 1..n container vào Pod, quản lý Deployment/Service, tự chữa, tự scale.",
    output: `deployment.apps/ml-api created
 └ replicas: 3/3 ready
service/ml-api created
 └ type: ClusterIP  cluster-ip: 10.96.12.4
HPA: ml-api  2→10 pods  target: 70% GPU`,
    color: "#06b6d4",
    icon: "⚙️",
  },
];

/* ──────────────────────────────────────────────────────────────────
 * ML SERVING STACK LAYERS — for the "containerized ML service" viz
 * ──────────────────────────────────────────────────────────────── */
interface StackLayer {
  key: string;
  title: string;
  detail: string;
  color: string;
}

const ML_STACK: StackLayer[] = [
  {
    key: "nginx",
    title: "nginx (reverse proxy)",
    detail: "TLS, rate-limit, static files, load-balance sang FastAPI workers.",
    color: "#22c55e",
  },
  {
    key: "fastapi",
    title: "FastAPI app (uvicorn)",
    detail: "Định nghĩa endpoint /predict, validate Pydantic, gọi model.",
    color: "#3b82f6",
  },
  {
    key: "pytorch",
    title: "PyTorch model",
    detail: "Trọng số .pt được load một lần vào VRAM qua torch.load().",
    color: "#f59e0b",
  },
  {
    key: "cuda",
    title: "CUDA 12.1 runtime",
    detail: "Thư viện GPU (cudart, cuDNN). Map từ host driver qua NVIDIA toolkit.",
    color: "#a855f7",
  },
  {
    key: "kernel",
    title: "Host Linux kernel",
    detail: "Container CHIA SẺ kernel với host. Không boot OS riêng.",
    color: "#64748b",
  },
];

/* ──────────────────────────────────────────────────────────────────
 * VM vs CONTAINER COMPARISON TABLE
 * ──────────────────────────────────────────────────────────────── */
interface DeployEnv {
  name: string;
  startup: string;
  size: string;
  overhead: string;
  isolation: string;
  gpu: string;
  density: string;
  notes: string;
}

const ENVS: DeployEnv[] = [
  {
    name: "Bare Metal",
    startup: "Phút",
    size: "N/A",
    overhead: "0%",
    isolation: "Không",
    gpu: "Trực tiếp",
    density: "1 app / máy",
    notes: "Hiệu năng tối đa nhưng không cô lập, khó scale.",
  },
  {
    name: "Virtual Machine",
    startup: "30–60 s",
    size: "GB",
    overhead: "15–20%",
    isolation: "Cao (full OS)",
    gpu: "Cần passthrough",
    density: "~10 VM / host",
    notes: "Cô lập mạnh, nhưng mỗi VM boot OS riêng — lãng phí.",
  },
  {
    name: "Docker Container",
    startup: "1–5 s",
    size: "MB–GB",
    overhead: "1–3%",
    isolation: "Tốt (namespace)",
    gpu: "NVIDIA Container Toolkit",
    density: "100+ / host",
    notes: "Chia sẻ kernel, khởi động nhanh, cộng đồng hệ sinh thái lớn.",
  },
  {
    name: "Serverless",
    startup: "100ms–30s",
    size: "MB",
    overhead: "Biến đổi",
    isolation: "Cao",
    gpu: "Hạn chế",
    density: "Ẩn (managed)",
    notes: "Không quản lý server, cold-start cao cho ML lớn.",
  },
];

/* ──────────────────────────────────────────────────────────────────
 * KUBERNETES POD/DEPLOYMENT MOCK
 * ──────────────────────────────────────────────────────────────── */
interface Pod {
  id: string;
  name: string;
  status: "running" | "pending" | "crashing";
  cpu: number;
  gpu: number;
  age: string;
}

function buildInitialPods(): Pod[] {
  return [
    { id: "p1", name: "ml-api-0", status: "running", cpu: 42, gpu: 68, age: "12m" },
    { id: "p2", name: "ml-api-1", status: "running", cpu: 39, gpu: 71, age: "12m" },
    { id: "p3", name: "ml-api-2", status: "running", cpu: 45, gpu: 74, age: "12m" },
  ];
}

/* ──────────────────────────────────────────────────────────────────
 * VIZ SUB-COMPONENTS
 * ──────────────────────────────────────────────────────────────── */
function StepChip({
  step,
  active,
  done,
  onClick,
}: {
  step: LifecycleStep;
  active: boolean;
  done: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative flex min-w-[120px] flex-col items-center gap-1 rounded-lg border-2 px-3 py-2 text-left transition-colors"
      style={{
        borderColor: active ? step.color : done ? `${step.color}66` : "var(--border)",
        backgroundColor: active ? `${step.color}18` : done ? `${step.color}08` : "transparent",
      }}
    >
      <span className="text-lg">{step.icon}</span>
      <span
        className="text-[11px] font-semibold"
        style={{ color: active ? step.color : "var(--foreground)" }}
      >
        {step.title}
      </span>
    </button>
  );
}

function TerminalBlock({
  command,
  output,
  accent,
}: {
  command: string;
  output: string;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-slate-950 p-3 font-mono text-[11px] leading-relaxed text-slate-200">
      <div className="mb-1 flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-red-400" />
        <span className="h-2 w-2 rounded-full bg-yellow-400" />
        <span className="h-2 w-2 rounded-full bg-green-400" />
        <span className="ml-2 text-[10px] uppercase tracking-wide text-slate-500">
          terminal
        </span>
      </div>
      <div className="whitespace-pre-wrap break-words">
        <span style={{ color: accent }}>{command}</span>
        {"\n"}
        <span className="text-slate-300">{output}</span>
      </div>
    </div>
  );
}

function VmVsContainerSvg({ mode }: { mode: "vm" | "container" }) {
  if (mode === "vm") {
    return (
      <svg viewBox="0 0 600 260" className="w-full max-w-2xl mx-auto">
        <text x={300} y={16} textAnchor="middle" fill="#e2e8f0" fontSize={12} fontWeight="bold">
          Virtual Machine
        </text>
        {/* Hardware */}
        <rect x={20} y={210} width={560} height={30} rx={6} fill="#475569" opacity={0.4} />
        <text x={300} y={230} textAnchor="middle" fill="#94a3b8" fontSize={11}>
          Phần cứng (CPU, GPU, RAM)
        </text>
        {/* Host OS */}
        <rect x={20} y={170} width={560} height={30} rx={6} fill="#1e293b" stroke="#475569" />
        <text x={300} y={190} textAnchor="middle" fill="#94a3b8" fontSize={11}>
          Host OS + Hypervisor
        </text>
        {/* VMs */}
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect
              x={30 + i * 190}
              y={30}
              width={170}
              height={130}
              rx={8}
              fill="#1e293b"
              stroke="#8b5cf6"
              strokeWidth={2}
            />
            <text x={115 + i * 190} y={50} textAnchor="middle" fill="#a78bfa" fontSize={11} fontWeight="bold">
              VM {i + 1}
            </text>
            <rect
              x={45 + i * 190}
              y={60}
              width={140}
              height={28}
              rx={4}
              fill="#475569"
              opacity={0.6}
            />
            <text x={115 + i * 190} y={78} textAnchor="middle" fill="#e2e8f0" fontSize={11}>
              Guest OS (boot nguyên hệ điều hành)
            </text>
            <rect
              x={45 + i * 190}
              y={95}
              width={140}
              height={24}
              rx={4}
              fill="#3b82f6"
              opacity={0.3}
            />
            <text x={115 + i * 190} y={111} textAnchor="middle" fill="#93c5fd" fontSize={11}>
              Bin / Libs
            </text>
            <rect
              x={45 + i * 190}
              y={125}
              width={140}
              height={28}
              rx={4}
              fill="#22c55e"
              opacity={0.25}
            />
            <text x={115 + i * 190} y={143} textAnchor="middle" fill="#86efac" fontSize={11}>
              App
            </text>
          </g>
        ))}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 600 260" className="w-full max-w-2xl mx-auto">
      <text x={300} y={16} textAnchor="middle" fill="#e2e8f0" fontSize={12} fontWeight="bold">
        Docker Container
      </text>
      {/* Hardware */}
      <rect x={20} y={210} width={560} height={30} rx={6} fill="#475569" opacity={0.4} />
      <text x={300} y={230} textAnchor="middle" fill="#94a3b8" fontSize={11}>
        Phần cứng (CPU, GPU, RAM)
      </text>
      {/* Host OS kernel (SHARED) */}
      <rect x={20} y={170} width={560} height={30} rx={6} fill="#1e293b" stroke="#22c55e" strokeWidth={2} />
      <text x={300} y={190} textAnchor="middle" fill="#86efac" fontSize={11}>
        Host Linux Kernel (CHIA SẺ)
      </text>
      {/* Docker engine */}
      <rect x={20} y={130} width={560} height={30} rx={6} fill="#f59e0b" opacity={0.2} stroke="#f59e0b" />
      <text x={300} y={150} textAnchor="middle" fill="#fbbf24" fontSize={11}>
        Docker Engine + NVIDIA Container Toolkit
      </text>
      {/* Containers */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect
            x={25 + i * 145}
            y={30}
            width={135}
            height={90}
            rx={8}
            fill="#22c55e"
            opacity={0.12}
            stroke="#22c55e"
            strokeWidth={2}
          />
          <text x={92.5 + i * 145} y={50} textAnchor="middle" fill="#86efac" fontSize={11} fontWeight="bold">
            Container {i + 1}
          </text>
          <rect
            x={35 + i * 145}
            y={58}
            width={115}
            height={22}
            rx={3}
            fill="#3b82f6"
            opacity={0.25}
          />
          <text x={92.5 + i * 145} y={73} textAnchor="middle" fill="#93c5fd" fontSize={11}>
            Bin / Libs
          </text>
          <rect
            x={35 + i * 145}
            y={86}
            width={115}
            height={24}
            rx={3}
            fill="#22c55e"
            opacity={0.3}
          />
          <text x={92.5 + i * 145} y={102} textAnchor="middle" fill="#86efac" fontSize={11}>
            {["FastAPI", "PyTorch", "nginx", "Redis"][i]}
          </text>
        </g>
      ))}
    </svg>
  );
}

function MlStackSvg({ highlighted }: { highlighted: string | null }) {
  return (
    <svg viewBox="0 0 600 320" className="w-full max-w-2xl mx-auto">
      <text x={300} y={18} textAnchor="middle" fill="#e2e8f0" fontSize={12} fontWeight="bold">
        Container phục vụ mô hình ML (FastAPI + PyTorch + nginx)
      </text>
      {ML_STACK.map((layer, i) => {
        const y = 40 + i * 52;
        const active = highlighted === layer.key;
        return (
          <g key={layer.key}>
            <rect
              x={30}
              y={y}
              width={540}
              height={44}
              rx={8}
              fill={active ? `${layer.color}33` : `${layer.color}15`}
              stroke={layer.color}
              strokeWidth={active ? 3 : 1}
            />
            <text x={50} y={y + 22} fill={layer.color} fontSize={12} fontWeight="bold">
              {layer.title}
            </text>
            <text x={50} y={y + 38} fill="#cbd5e1" fontSize={11}>
              {layer.detail}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function PodTile({
  pod,
  onKill,
  onRestart,
}: {
  pod: Pod;
  onKill: () => void;
  onRestart: () => void;
}) {
  const color =
    pod.status === "running"
      ? "#22c55e"
      : pod.status === "pending"
        ? "#f59e0b"
        : "#ef4444";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="rounded-lg border bg-surface p-3 text-xs space-y-2"
      style={{ borderColor: `${color}88` }}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono font-semibold text-foreground">{pod.name}</span>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
          style={{ backgroundColor: `${color}22`, color }}
        >
          {pod.status}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[10px] text-muted">
        <div>
          CPU: <span className="text-foreground">{pod.cpu}%</span>
        </div>
        <div>
          GPU: <span className="text-foreground">{pod.gpu}%</span>
        </div>
        <div>
          Age: <span className="text-foreground">{pod.age}</span>
        </div>
        <div>
          IP:{" "}
          <span className="font-mono text-foreground">
            10.0.0.{(parseInt(pod.id.slice(1), 10) + 10) || 11}
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onKill}
          className="flex-1 rounded border border-red-500/40 px-2 py-1 text-[10px] text-red-500 transition-colors hover:bg-red-500/10"
        >
          Kill
        </button>
        <button
          onClick={onRestart}
          className="flex-1 rounded border border-accent/40 px-2 py-1 text-[10px] text-accent transition-colors hover:bg-accent/10"
        >
          Restart
        </button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 * COMPONENT
 * ════════════════════════════════════════════════════════════════ */
export default function ContainerizationTopic() {
  /* ── LIFECYCLE STATE ── */
  const [stepIdx, setStepIdx] = useState(0);
  const currentStep = LIFECYCLE[stepIdx];

  /* ── VM vs CONTAINER ── */
  const [compareMode, setCompareMode] = useState<"vm" | "container">("container");

  /* ── ML STACK HIGHLIGHT ── */
  const [highlighted, setHighlighted] = useState<string | null>(null);

  /* ── DEPLOY ENV PICKER ── */
  const [activeEnv, setActiveEnv] = useState(2);
  const env = ENVS[activeEnv];

  /* ── KUBERNETES POD STATE ── */
  const [pods, setPods] = useState<Pod[]>(() => buildInitialPods());
  const [replicas, setReplicas] = useState(3);

  /* ── HANDLERS ── */
  const handleNext = useCallback(() => {
    setStepIdx((i) => (i < LIFECYCLE.length - 1 ? i + 1 : i));
  }, []);
  const handlePrev = useCallback(() => {
    setStepIdx((i) => (i > 0 ? i - 1 : i));
  }, []);

  const handleKillPod = useCallback((id: string) => {
    setPods((prev) => {
      const pod = prev.find((p) => p.id === id);
      if (!pod) return prev;
      // Mark as crashing, then K8s "replaces" with a new one after brief delay
      const next = prev.map((p) =>
        p.id === id ? { ...p, status: "crashing" as const } : p,
      );
      setTimeout(() => {
        setPods((cur) =>
          cur.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: "running" as const,
                  cpu: 15 + Math.floor(Math.random() * 20),
                  gpu: 20 + Math.floor(Math.random() * 20),
                  age: "0s",
                }
              : p,
          ),
        );
      }, 1500);
      return next;
    });
  }, []);

  const handleRestartPod = useCallback((id: string) => {
    setPods((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: "pending" as const,
              cpu: 5,
              gpu: 0,
              age: "0s",
            }
          : p,
      ),
    );
    setTimeout(() => {
      setPods((cur) =>
        cur.map((p) =>
          p.id === id ? { ...p, status: "running" as const, cpu: 30, gpu: 55 } : p,
        ),
      );
    }, 1200);
  }, []);

  const handleScale = useCallback((n: number) => {
    const target = Math.max(1, Math.min(10, n));
    setReplicas(target);
    setPods((prev) => {
      if (target === prev.length) return prev;
      if (target > prev.length) {
        const extra: Pod[] = [];
        for (let i = prev.length; i < target; i += 1) {
          extra.push({
            id: `p${i + 1}`,
            name: `ml-api-${i}`,
            status: "pending",
            cpu: 0,
            gpu: 0,
            age: "0s",
          });
        }
        return [...prev, ...extra];
      }
      return prev.slice(0, target);
    });
    setTimeout(() => {
      setPods((cur) =>
        cur.map((p) =>
          p.status === "pending"
            ? {
                ...p,
                status: "running" as const,
                cpu: 28 + Math.floor(Math.random() * 20),
                gpu: 50 + Math.floor(Math.random() * 25),
                age: "5s",
              }
            : p,
        ),
      );
    }, 1200);
  }, []);

  /* ── QUIZ ── */
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question: "Tại sao Docker container khởi động nhanh hơn VM nhiều lần?",
        options: [
          "Container dùng phần cứng tốt hơn",
          "Container chia sẻ kernel với host OS, không cần boot OS riêng",
          "Container không có hệ điều hành nên nhẹ hơn",
          "Container được nén bằng thuật toán mới",
        ],
        correct: 1,
        explanation:
          "VM cần boot nguyên OS riêng (kernel + services). Container chia sẻ kernel của host, chỉ cần khởi tạo process mới — tương đương mở app mới vs bật máy tính mới.",
      },
      {
        question: "NVIDIA Container Toolkit giải quyết vấn đề gì?",
        options: [
          "Tạo GPU ảo trong container",
          "Cho phép container truy cập GPU vật lý của host thông qua driver mapping",
          "Tăng tốc CPU trong container",
          "Đóng gói CUDA vào image",
        ],
        correct: 1,
        explanation:
          "Container mặc định không thấy GPU. NVIDIA Container Toolkit map GPU drivers và libraries từ host vào container, cho phép PyTorch/TensorFlow dùng CUDA mà không cần cài driver trong container.",
      },
      {
        question: "Kubernetes giải quyết vấn đề gì mà Docker (standalone) không làm được?",
        options: [
          "Đóng gói ứng dụng thành image",
          "Điều phối hàng trăm container: auto-scaling, load balancing, self-healing",
          "Chạy container trên máy local",
          "Viết Dockerfile",
        ],
        correct: 1,
        explanation:
          "Docker đóng gói và chạy container. Kubernetes điều phối cluster: tự restart container chết, scale up/down theo tải, phân phối traffic, rolling update.",
      },
      {
        type: "fill-blank",
        question:
          "{blank} đóng gói model + dependencies vào image chuẩn, còn {blank} điều phối cluster hàng trăm container với auto-scaling và self-healing.",
        blanks: [
          { answer: "Docker", accept: ["docker", "container"] },
          { answer: "Kubernetes", accept: ["k8s", "kubernetes"] },
        ],
        explanation:
          "Docker build image một lần, chạy mọi nơi. Kubernetes quản lý lifecycle container: deploy, scale, restart khi crash, rolling update — không thể thiếu cho production AI serving quy mô lớn.",
      },
      {
        question: "Multi-stage build trong Dockerfile giúp điều gì?",
        options: [
          "Tạo image nhỏ hơn bằng cách chỉ copy artifacts cần thiết sang stage cuối",
          "Chạy container nhanh hơn",
          "Tăng bảo mật bằng mã hoá",
          "Tạo bản sao dự phòng",
        ],
        correct: 0,
        explanation:
          "Stage 1 build/compile (có compiler, headers, cache), stage 2 chỉ copy binary/package cần chạy. Image giảm 2–3×, ít bề mặt tấn công hơn.",
      },
      {
        question: "Pod trong Kubernetes là gì?",
        options: [
          "Một container đơn lẻ",
          "Đơn vị nhỏ nhất có thể deploy; chứa 1..n container chia sẻ network + storage",
          "Một máy ảo",
          "Một cluster",
        ],
        correct: 1,
        explanation:
          "Pod là nhóm container 'đi cùng nhau', chia sẻ network namespace (cùng IP) và volume. Thường 1 pod = 1 main container + 0..n sidecar (logging, proxy…).",
      },
      {
        question:
          "Khi một pod bị crash, Kubernetes làm gì (với cấu hình Deployment mặc định)?",
        options: [
          "Không làm gì, cần con người can thiệp",
          "Tự động tạo pod mới để duy trì số replicas mong muốn (self-healing)",
          "Tắt toàn bộ cluster",
          "Thông báo qua email và chờ",
        ],
        correct: 1,
        explanation:
          "Deployment khai báo desired state (replicas = N). Controller liên tục so sánh với trạng thái thật và tự tạo pod mới khi có pod chết — đây chính là self-healing.",
      },
      {
        question:
          "Vì sao 'works on my machine' ít gặp hơn khi dùng container?",
        options: [
          "Container làm code chạy nhanh hơn",
          "Image đóng gói toàn bộ OS userland + dependencies → mọi nơi chạy đều giống nhau",
          "Container tự sửa bug",
          "Container bắt buộc dùng cùng CPU",
        ],
        correct: 1,
        explanation:
          "Image chứa Python, thư viện, CUDA runtime, model weights cụ thể. Chỉ cần kernel host tương thích là image chạy nhất quán trên laptop, staging, production.",
      },
    ],
    [],
  );

  /* ── STYLE HELPERS ── */
  const btnPrimary =
    "rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40";
  const btnSecondary =
    "rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground disabled:opacity-40";

  /* ═══════════════════════════════════════════════════════════════
   * RENDER
   * ════════════════════════════════════════════════════════════ */
  return (
    <>
      {/* ── STEP 1: HOOK ── */}
      <PredictionGate
        question="Team train model trên Ubuntu 22.04 + CUDA 12.1 + PyTorch 2.1. Deploy lên server Ubuntu 20.04 + CUDA 11.8 → crash. Nguyên nhân gốc rễ?"
        options={[
          "Server quá yếu, cần nâng cấp phần cứng",
          "Xung đột phiên bản dependencies — cần container hoá để chạy nhất quán",
          "Model bị lỗi, phải train lại",
          "Phải đổi sang ngôn ngữ khác",
        ]}
        correct={1}
        explanation="'Works on my machine' là kinh điển. Container đóng gói Python + PyTorch + CUDA + model vào một hộp chuẩn → chạy giống nhau trên mọi máy có kernel tương thích."
      >
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Container hoá là kỹ thuật đóng gói ứng dụng cùng mọi phụ thuộc vào
          một đơn vị chuẩn. Bài này đi qua vòng đời:{" "}
          <strong className="text-foreground">
            Dockerfile → Image → Container → Network → Orchestration
          </strong>
          , so VM với container, và mô phỏng Kubernetes thật.
        </p>

        <ProgressSteps
          current={1}
          total={7}
          labels={[
            "Hook",
            "Vòng đời",
            "Aha",
            "VM vs Ctr",
            "K8s",
            "Lý thuyết",
            "Quiz",
          ]}
        />

        {/* ── STEP 2: DISCOVER — LIFECYCLE ── */}
        <LessonSection step={2} totalSteps={7} label="Vòng đời container">
          <VisualizationSection topicSlug={metadata.slug}>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    Dockerfile → Image → Container → Network
                  </div>
                  <div className="text-xs text-muted">
                    Nhấn từng bước hoặc dùng Next để xem từng lệnh và output.
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrev}
                    disabled={stepIdx === 0}
                    className={btnSecondary}
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={stepIdx === LIFECYCLE.length - 1}
                    className={btnPrimary}
                  >
                    Next →
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {LIFECYCLE.map((s, i) => (
                  <StepChip
                    key={s.id}
                    step={s}
                    active={i === stepIdx}
                    done={i < stepIdx}
                    onClick={() => setStepIdx(i)}
                  />
                ))}
              </div>

              <motion.div
                key={currentStep.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-surface p-4 space-y-3"
              >
                <div
                  className="text-sm font-bold"
                  style={{ color: currentStep.color }}
                >
                  {currentStep.title}
                </div>
                <p className="text-sm text-muted">{currentStep.description}</p>
                <TerminalBlock
                  command={currentStep.command}
                  output={currentStep.output}
                  accent={currentStep.color}
                />
              </motion.div>

              {/* ML stack visualization — interactive */}
              <div className="space-y-2">
                <div className="text-sm font-semibold text-foreground">
                  Kiến trúc container phục vụ ML
                </div>
                <MlStackSvg highlighted={highlighted} />
                <div className="flex flex-wrap justify-center gap-2">
                  {ML_STACK.map((l) => (
                    <button
                      key={l.key}
                      onMouseEnter={() => setHighlighted(l.key)}
                      onMouseLeave={() => setHighlighted(null)}
                      onClick={() =>
                        setHighlighted(highlighted === l.key ? null : l.key)
                      }
                      className="rounded-full border px-3 py-1 text-[11px] font-medium transition-colors"
                      style={{
                        borderColor: l.color,
                        color: l.color,
                        backgroundColor:
                          highlighted === l.key ? `${l.color}22` : "transparent",
                      }}
                    >
                      {l.title.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </VisualizationSection>
        </LessonSection>

        {/* ── STEP 3: AHA ── */}
        <LessonSection step={3} totalSteps={7} label="Khoảnh khắc Aha">
          <AhaMoment>
            <p>
              Container <strong>chia sẻ kernel</strong> với host (không boot OS
              riêng) → khởi động trong vài giây thay vì vài phút. Overhead chỉ
              1–3% (VM: 15–20%). Chính vì thế 90% workload AI production hiện
              chạy trên Docker + Kubernetes: nhẹ như app, cô lập như VM.
            </p>
          </AhaMoment>
        </LessonSection>

        {/* ── STEP 4: VM vs CONTAINER + ENV PICKER ── */}
        <LessonSection step={4} totalSteps={7} label="VM vs Container">
          <div className="space-y-5">
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCompareMode("vm")}
                className={
                  compareMode === "vm" ? btnPrimary : btnSecondary
                }
              >
                Virtual Machine
              </button>
              <button
                onClick={() => setCompareMode("container")}
                className={
                  compareMode === "container" ? btnPrimary : btnSecondary
                }
              >
                Container
              </button>
            </div>

            <VmVsContainerSvg mode={compareMode} />

            <div className="rounded-lg border border-accent/30 bg-accent-light p-3 text-sm text-foreground">
              <strong>Điểm khác biệt cốt lõi:</strong> VM boot OS riêng (Guest
              OS) trong mỗi hộp → hàng GB RAM và 30–60s khởi động. Container
              chia sẻ kernel host → chỉ cần process namespace → MB và 1–5s.
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-foreground">
                Bảng so sánh 4 cách triển khai
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {ENVS.map((e, i) => (
                  <button
                    key={e.name}
                    onClick={() => setActiveEnv(i)}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      activeEnv === i
                        ? "bg-accent text-white"
                        : "bg-surface border border-border text-muted hover:text-foreground"
                    }`}
                  >
                    {e.name}
                  </button>
                ))}
              </div>

              <motion.div
                key={env.name}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <div className="text-sm font-bold text-foreground">{env.name}</div>
                <p className="mt-1 text-xs text-muted">{env.notes}</p>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 text-center">
                  {[
                    { label: "Khởi động", value: env.startup, color: "text-blue-500" },
                    { label: "Kích thước", value: env.size, color: "text-green-500" },
                    { label: "Overhead", value: env.overhead, color: "text-amber-500" },
                    { label: "Cô lập", value: env.isolation, color: "text-foreground" },
                    { label: "GPU", value: env.gpu, color: "text-purple-500" },
                    { label: "Mật độ", value: env.density, color: "text-cyan-500" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-lg border border-border bg-background p-2"
                    >
                      <div className="text-[10px] uppercase tracking-wide text-muted">
                        {stat.label}
                      </div>
                      <div className={`text-sm font-semibold ${stat.color}`}>
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </LessonSection>

        {/* ── STEP 5: KUBERNETES SANDBOX ── */}
        <LessonSection step={5} totalSteps={7} label="Điều phối Kubernetes">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-foreground">
                  Deployment: ml-api — replicas {replicas}
                </div>
                <div className="text-xs text-muted">
                  Kill một pod để thấy K8s tự tạo pod mới. Tăng replicas để
                  scale.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleScale(replicas - 1)}
                  disabled={replicas <= 1}
                  className={btnSecondary}
                >
                  − Scale down
                </button>
                <button
                  onClick={() => handleScale(replicas + 1)}
                  disabled={replicas >= 10}
                  className={btnPrimary}
                >
                  + Scale up
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pods.map((p) => (
                <PodTile
                  key={p.id}
                  pod={p}
                  onKill={() => handleKillPod(p.id)}
                  onRestart={() => handleRestartPod(p.id)}
                />
              ))}
            </div>

            <TerminalBlock
              command="$ kubectl get pods -l app=ml-api"
              output={pods
                .map(
                  (p) =>
                    `${p.name.padEnd(12)} ${p.status.toUpperCase().padEnd(10)} cpu=${p.cpu}%  gpu=${p.gpu}%  age=${p.age}`,
                )
                .join("\n")}
              accent="#06b6d4"
            />

            <InlineChallenge
              question="Docker image cho model AI thường rất lớn (5–15GB) vì chứa CUDA, PyTorch, model weights. Cách nào giảm kích thước hiệu quả nhất?"
              options={[
                "Nén file image bằng ZIP",
                "Multi-stage build: stage 1 build deps, stage 2 chỉ copy artifacts",
                "Dùng image Windows thay vì Linux",
                "Tắt hết log",
              ]}
              correct={1}
              explanation="Multi-stage build: stage 1 cài pip packages (cần compiler, headers), stage 2 base nhỏ gọn + copy chỉ packages đã build. Giảm image 2–3×. Kết hợp .dockerignore loại file thừa."
            />

            <InlineChallenge
              question="Mô hình load weights 12GB vào VRAM mỗi lần container khởi động. Cách làm nào giảm cold-start hiệu quả?"
              options={[
                "Thêm RAM vào container",
                "Dùng readiness probe + preloaded volume + giữ pod 'warm' (minReplicas ≥ 1)",
                "Giảm chất lượng model",
                "Tắt GPU",
              ]}
              correct={1}
              explanation="Để weights trong ReadOnlyMany volume (đã warm cache filesystem), đặt minReplicas ≥ 1 để luôn có pod sẵn sàng, dùng readiness probe để K8s không route traffic vào pod đang load."
            />
          </div>
        </LessonSection>

        {/* ── STEP 6: EXPLAIN ── */}
        <LessonSection step={6} totalSteps={7} label="Lý thuyết">
          <ExplanationSection>
            <p>
              <strong>Container hoá</strong> là kỹ thuật đóng gói ứng dụng
              (model AI + code + dependencies) vào một đơn vị chuẩn chạy nhất
              quán trên mọi môi trường. Đây là nền tảng của{" "}
              <TopicLink slug="mlops">MLOps</TopicLink> hiện đại và hỗ trợ{" "}
              <TopicLink slug="model-serving">model serving</TopicLink> đa môi
              trường.
            </p>

            <p>
              <strong>Công thức khái niệm — Container vs VM:</strong>
            </p>
            <LaTeX block>
              {"\\text{VM} = \\text{App} + \\text{Guest OS} + \\text{Hypervisor} \\ (\\text{startup: phút, overhead: 15-20\\%})"}
            </LaTeX>
            <LaTeX block>
              {"\\text{Container} = \\text{App} + \\text{Libs} \\ (\\text{share host kernel, startup: giây, overhead: 1-3\\%})"}
            </LaTeX>

            <p>
              <strong>Vòng đời Docker:</strong>
            </p>
            <ol className="list-decimal pl-5 text-sm space-y-1">
              <li>
                <strong>Dockerfile</strong> — bản thiết kế khai báo từng bước
                build.
              </li>
              <li>
                <strong>Image</strong> — kết quả build, bất biến, có thể push
                lên registry.
              </li>
              <li>
                <strong>Container</strong> — instance runtime của image với
                namespace riêng.
              </li>
              <li>
                <strong>Network / Volume</strong> — kết nối với nhau và với
                storage bền vững.
              </li>
              <li>
                <strong>Orchestration</strong> — Kubernetes/Nomad quản lý ở
                quy mô cluster.
              </li>
            </ol>

            <Callout variant="tip" title="NVIDIA Container Toolkit">
              Mặc định container không thấy GPU. NVIDIA Container Toolkit
              inject GPU drivers + CUDA vào container tại runtime. Bạn chỉ cần
              base image có CUDA runtime; không cần match version driver với
              host. Kết hợp với{" "}
              <TopicLink slug="gpu-optimization">tối ưu GPU</TopicLink> để đạt
              hiệu năng cực đại.
            </Callout>

            <Callout variant="warning" title="Image quá lớn = cold start lâu">
              Model 15GB, image 20GB → pull lần đầu tốn phút. Giảm bằng:
              multi-stage build, .dockerignore, tách model weights ra
              volume/object storage, hoặc dùng lazy-loading.
            </Callout>

            <Callout variant="info" title="12-Factor App & Immutable Infrastructure">
              Container hoá đẩy nhanh nguyên tắc 12-Factor: config qua env
              vars, logs là stream, state ở backing services, build–release–
              run tách biệt. Container là <em>immutable</em>: không SSH vào
              sửa; đổi code → build image mới → deploy.
            </Callout>

            <Callout variant="info" title="Docker vs Kubernetes">
              Docker <em>đóng gói & chạy</em> container trên một máy. Kubernetes{" "}
              <em>điều phối</em> hàng trăm container qua nhiều máy: scheduling,
              auto-scaling, rolling update, self-healing, service discovery.
            </Callout>

            <p>
              <strong>Docker cho AI workflow:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
              <li>
                <strong>Reproducibility:</strong> Dockerfile là bản thiết kế
                chính xác, ai build cũng ra image giống.
              </li>
              <li>
                <strong>Isolation:</strong> Model A dùng PyTorch 2.0, Model B
                dùng 2.3 — không xung đột vì mỗi container có libs riêng.
              </li>
              <li>
                <strong>Portability:</strong> Build trên laptop, chạy trên FPT
                Cloud/AWS/GCP — giống hệt.
              </li>
              <li>
                <strong>Scaling:</strong> Kubernetes tạo 100 replica từ 1
                image chỉ trong vài giây.
              </li>
            </ul>

            <CodeBlock
              language="dockerfile"
              title="Dockerfile tối ưu cho AI model serving"
            >
              {`# ── Stage 1: Build dependencies ───────────────────────────
FROM python:3.11-slim AS builder
WORKDIR /build

# System deps cần để compile một số wheel
RUN apt-get update && apt-get install -y --no-install-recommends \\
        build-essential git && \\
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ── Stage 2: Runtime (nhỏ gọn, CUDA đầy đủ) ───────────────
FROM nvidia/cuda:12.1.0-runtime-ubuntu22.04
WORKDIR /app

# Tạo user không phải root để tăng bảo mật
RUN useradd -m -u 1000 appuser

# Copy Python từ builder, chỉ những package đã cài
COPY --from=builder /install /usr/local
COPY --chown=appuser:appuser ./src /app/src
COPY --chown=appuser:appuser ./model /app/model

# Config qua env vars (12-Factor)
ENV MODEL_PATH=/app/model/llama-7b-q4.gguf \\
    CUDA_VISIBLE_DEVICES=0 \\
    PYTHONUNBUFFERED=1 \\
    PORT=8000

# Healthcheck để K8s biết pod sẵn sàng
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s \\
    CMD curl -fsS http://localhost:\${PORT}/healthz || exit 1

USER appuser
EXPOSE 8000
CMD ["uvicorn", "src.server:app", "--host", "0.0.0.0", "--port", "8000"]
# Image: ~5.2GB (so với ~15GB nếu single-stage)`}
            </CodeBlock>

            <CodeBlock
              language="yaml"
              title="Kubernetes Deployment + HPA với GPU"
            >
              {`apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-api
  labels: { app: ml-api }
spec:
  replicas: 3                # baseline 3 bản sao
  selector:
    matchLabels: { app: ml-api }
  strategy:
    type: RollingUpdate
    rollingUpdate: { maxSurge: 1, maxUnavailable: 0 }
  template:
    metadata:
      labels: { app: ml-api }
    spec:
      containers:
      - name: serving
        image: registry.fpt.cloud/ai-team/ml-api:v2.1
        ports:
        - containerPort: 8000
        env:
        - name: MODEL_PATH
          value: /models/llama-7b-q4.gguf
        resources:
          limits:
            nvidia.com/gpu: 1
            memory: "16Gi"
            cpu: "4"
          requests:
            memory: "8Gi"
            cpu: "2"
        readinessProbe:
          httpGet: { path: /healthz, port: 8000 }
          initialDelaySeconds: 30
          periodSeconds: 10
        livenessProbe:
          httpGet: { path: /livez, port: 8000 }
          initialDelaySeconds: 60
        volumeMounts:
        - name: model-cache
          mountPath: /models
          readOnly: true
      volumes:
      - name: model-cache
        persistentVolumeClaim: { claimName: model-pvc }
---
apiVersion: v1
kind: Service
metadata: { name: ml-api }
spec:
  selector: { app: ml-api }
  ports:
  - port: 80
    targetPort: 8000
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: ml-api-hpa }
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ml-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: nvidia.com/gpu
      target:
        type: Utilization
        averageUtilization: 70`}
            </CodeBlock>

            <CollapsibleDetail title="Namespaces & cgroups — vì sao container 'cô lập'?">
              <p className="text-sm leading-relaxed">
                Linux cung cấp <strong>namespaces</strong> (PID, NET, MNT,
                USER, UTS, IPC) tạo ảo giác mỗi container có hệ thống riêng:
                danh sách process, card mạng, filesystem, users… Đồng thời{" "}
                <strong>cgroups</strong> (control groups) giới hạn CPU, RAM,
                I/O. Container = process chạy trên kernel host nhưng được
                &quot;nhìn&quot; qua lăng kính namespaces và bị giới hạn bởi
                cgroups — không phải máy ảo, không có hypervisor.
              </p>
            </CollapsibleDetail>

            <CollapsibleDetail title="Layer caching & vì sao thứ tự lệnh trong Dockerfile quan trọng">
              <p className="text-sm leading-relaxed">
                Mỗi lệnh trong Dockerfile tạo một <em>layer</em>; Docker cache
                layer theo hash của lệnh + nội dung file liên quan. Nếu đặt{" "}
                <code>COPY ./src</code> trước <code>RUN pip install</code>,
                mỗi lần sửa code sẽ invalidate cache pip → build lại toàn bộ.
                Thứ tự chuẩn: <em>hiếm thay đổi trước, hay thay đổi sau</em> —
                requirements.txt trước, src/ sau. Tiết kiệm 5–15 phút mỗi lần
                build.
              </p>
            </CollapsibleDetail>

            <p className="text-sm text-muted">
              Container hoá không phải &quot;viên đạn bạc&quot;: cần đầu tư
              vào image scanning, registry auth, secrets management, log
              aggregation. Nhưng một khi có nền tảng, đó là bệ phóng cho mọi{" "}
              <TopicLink slug="mlops">MLOps</TopicLink> và{" "}
              <TopicLink slug="model-serving">model serving</TopicLink> ở quy
              mô.
            </p>
          </ExplanationSection>
        </LessonSection>

        {/* ── STEP 7: SUMMARY + QUIZ ── */}
        <LessonSection step={7} totalSteps={7} label="Tóm tắt & Kiểm tra">
          <MiniSummary
            points={[
              "Container đóng gói model + dependencies vào 'hộp' chuẩn — chạy giống nhau trên mọi máy có kernel tương thích.",
              "Nhẹ hơn VM vì chia sẻ kernel (1–3% overhead); khởi động trong vài giây thay vì phút.",
              "Dockerfile là bản thiết kế; Image là kết quả build bất biến; Container là instance runtime có namespace riêng.",
              "NVIDIA Container Toolkit cho phép container truy cập GPU mà không cần cài CUDA driver riêng.",
              "Multi-stage build + .dockerignore + tách model weights ra volume giảm image 2–3× và cold-start đáng kể.",
              "Kubernetes điều phối cluster: Pod là đơn vị deploy, Deployment giữ N replicas, HPA auto-scale, Service cân bằng tải.",
            ]}
          />
          <QuizSection questions={quizQuestions} />
        </LessonSection>
      </PredictionGate>
    </>
  );
}
