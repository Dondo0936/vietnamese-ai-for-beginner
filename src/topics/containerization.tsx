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
  slug: "containerization",
  title: "Containerization",
  titleVi: "Container hoá — Đóng gói AI gọn gàng",
  description:
    "Kỹ thuật đóng gói mô hình AI cùng mọi phụ thuộc vào container, đảm bảo chạy nhất quán trên mọi môi trường.",
  category: "infrastructure",
  tags: ["docker", "kubernetes", "container", "deployment"],
  difficulty: "intermediate",
  relatedSlugs: ["model-serving", "mlops", "gpu-optimization"],
  vizType: "interactive",
};

/* ── Container vs VM comparison ── */
interface DeployEnv {
  name: string;
  startup: string;
  size: string;
  overhead: string;
  isolation: string;
  gpu: boolean;
}

const ENVS: DeployEnv[] = [
  { name: "Bare Metal", startup: "Phút", size: "N/A", overhead: "0%", isolation: "Không", gpu: true },
  { name: "Virtual Machine", startup: "30-60s", size: "GB", overhead: "15-20%", isolation: "Cao (full OS)", gpu: true },
  { name: "Docker Container", startup: "1-5s", size: "MB", overhead: "1-3%", isolation: "Tốt (namespace)", gpu: true },
  { name: "Serverless", startup: "100ms-30s", size: "MB", overhead: "Biến đổi", isolation: "Cao", gpu: false },
];

const TOTAL_STEPS = 7;

export default function ContainerizationTopic() {
  const [activeEnv, setActiveEnv] = useState(2);
  const env = ENVS[activeEnv];

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Tại sao Docker container khởi động nhanh hơn VM nhiều lần?",
      options: [
        "Container dùng phần cứng tốt hơn",
        "Container chia sẻ kernel với host OS, không cần boot OS riêng",
        "Container không có hệ điều hành nên nhẹ hơn",
      ],
      correct: 1,
      explanation: "VM cần boot nguyên OS riêng (kernel + services). Container chia sẻ kernel của host, chỉ cần khởi tạo process mới — tương đương mở app mới vs bật máy tính mới.",
    },
    {
      question: "NVIDIA Container Toolkit giải quyết vấn đề gì?",
      options: [
        "Tạo GPU ảo trong container",
        "Cho phép container truy cập GPU vật lý của host thông qua driver mapping",
        "Tăng tốc CPU trong container",
      ],
      correct: 1,
      explanation: "Container mặc định không thấy GPU. NVIDIA Container Toolkit map GPU drivers và libraries từ host vào container, cho phép PyTorch/TensorFlow dùng CUDA mà không cần cài driver trong container.",
    },
    {
      question: "Kubernetes giải quyết vấn đề gì mà Docker không làm được?",
      options: [
        "Đóng gói ứng dụng thành image",
        "Điều phối hàng trăm container: auto-scaling, load balancing, self-healing",
        "Chạy container trên máy local",
      ],
      correct: 1,
      explanation: "Docker đóng gói và chạy 1 container. Kubernetes điều phối cluster: tự restart container chết, scale up/down theo tải, phân phối traffic, rolling updates. Giống so sánh lái 1 xe vs quản lý đội xe giao hàng.",
    },
  ], []);

  return (
    <>
      {/* STEP 1: PREDICTION GATE */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Team bạn train model trên Ubuntu 22.04 + CUDA 12.1 + PyTorch 2.1. Deploy lên server chạy Ubuntu 20.04 + CUDA 11.8 — model crash. Nguyên nhân và giải pháp?"
          options={[
            "Server quá yếu, cần nâng cấp phần cứng",
            "Xung đột phiên bản — cần đóng gói model + dependencies vào container để chạy nhất quán",
            "Model bị lỗi, cần train lại",
          ]}
          correct={1}
          explanation="'Works on my machine' là vấn đề kinh điển! Container đóng gói model + Python + PyTorch + CUDA vào một 'hộp' chuẩn — chạy giống hệt nhau trên mọi máy. Giống gửi bể cá kèm nước, máy sục khí, thức ăn — cá sống khoẻ bất kể đi đâu!"
        >

      {/* STEP 2: INTERACTIVE VIZ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          So sánh <strong className="text-foreground">4 cách triển khai</strong>{" "}
          mô hình AI — từ bare metal đến serverless. Click từng loại để xem trade-off.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {ENVS.map((e, i) => (
                <button
                  key={i}
                  onClick={() => setActiveEnv(i)}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    activeEnv === i
                      ? "bg-accent text-white"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                >
                  {e.name}
                </button>
              ))}
            </div>

            <svg viewBox="0 0 600 230" className="w-full max-w-2xl mx-auto">
              {/* Container architecture diagram */}
              <text x={300} y={20} textAnchor="middle" fill="#e2e8f0" fontSize={12} fontWeight="bold">
                {env.name}
              </text>

              {/* Hardware layer */}
              <rect x={30} y={180} width={540} height={35} rx={6} fill="#475569" opacity={0.4} />
              <text x={300} y={202} textAnchor="middle" fill="#94a3b8" fontSize={10}>
                Phần cứng (CPU, GPU, RAM)
              </text>

              {/* Host OS layer */}
              <rect x={30} y={140} width={540} height={35} rx={6} fill="#1e293b" stroke="#475569" strokeWidth={1} />
              <text x={300} y={162} textAnchor="middle" fill="#94a3b8" fontSize={10}>
                Host OS (Linux Kernel)
              </text>

              {/* Runtime layer */}
              {activeEnv >= 2 && (
                <>
                  <rect x={30} y={100} width={540} height={35} rx={6} fill="#f59e0b" opacity={0.2} stroke="#f59e0b" strokeWidth={1} />
                  <text x={300} y={122} textAnchor="middle" fill="#f59e0b" fontSize={10}>
                    {activeEnv === 3 ? "Serverless Runtime" : "Docker Engine + NVIDIA Container Toolkit"}
                  </text>
                </>
              )}

              {/* App containers */}
              {activeEnv === 0 ? (
                <rect x={130} y={35} width={340} height={55} rx={8} fill="#3b82f6" opacity={0.15} stroke="#3b82f6" strokeWidth={2}>
                </rect>
              ) : activeEnv === 1 ? (
                [0, 1].map((i) => (
                  <g key={i}>
                    <rect x={60 + i * 280} y={30} width={220} height={65} rx={8} fill="#1e293b" stroke="#8b5cf6" strokeWidth={2} />
                    <text x={170 + i * 280} y={52} textAnchor="middle" fill="#8b5cf6" fontSize={9} fontWeight="bold">Guest OS</text>
                    <rect x={75 + i * 280} y={58} width={190} height={28} rx={4} fill="#3b82f6" opacity={0.2} stroke="#3b82f6" strokeWidth={1} />
                    <text x={170 + i * 280} y={76} textAnchor="middle" fill="#3b82f6" fontSize={8}>App + Deps</text>
                  </g>
                ))
              ) : (
                [0, 1, 2].map((i) => (
                  <g key={i}>
                    <rect x={40 + i * 190} y={35} width={160} height={55} rx={8} fill="#22c55e" opacity={0.12} stroke="#22c55e" strokeWidth={2} />
                    <text x={120 + i * 190} y={55} textAnchor="middle" fill="#22c55e" fontSize={9} fontWeight="bold">
                      Container {i + 1}
                    </text>
                    <text x={120 + i * 190} y={72} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                      {["Model + PyTorch", "API + FastAPI", "Monitor"][i]}
                    </text>
                  </g>
                ))
              )}

              {activeEnv === 0 && (
                <text x={300} y={65} textAnchor="middle" fill="#3b82f6" fontSize={10}>
                  Tất cả cài trực tiếp — xung đột dependencies!
                </text>
              )}
            </svg>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
              <div className="rounded-lg border border-border bg-card p-2">
                <p className="text-xs text-muted">Khởi động</p>
                <p className="text-sm font-bold text-blue-400">{env.startup}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-2">
                <p className="text-xs text-muted">Kích thước</p>
                <p className="text-sm font-bold text-green-400">{env.size}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-2">
                <p className="text-xs text-muted">Overhead</p>
                <p className="text-sm font-bold text-amber-400">{env.overhead}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-2">
                <p className="text-xs text-muted">GPU Support</p>
                <p className="text-sm font-bold" style={{ color: env.gpu ? "#22c55e" : "#ef4444" }}>
                  {env.gpu ? "Co" : "Han che"}
                </p>
              </div>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* STEP 3: AHA */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Container <strong>chia sẻ kernel</strong>{" "}
            với host OS (không boot OS riêng) — nên khởi động trong giây thay vì phút.
            Overhead chỉ 1-3% (VM: 15-20%). Đây là lý do 90% ứng dụng AI production dùng Docker + Kubernetes:
            nhẹ như chạy app, cô lập như VM!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* STEP 4: CHALLENGE */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Docker image cho model AI thường rất lớn (5-15GB) vì chứa CUDA, PyTorch, model weights. Cách nào giảm kích thước hiệu quả nhất?"
          options={[
            "Nén file image bằng ZIP",
            "Multi-stage build: stage 1 build dependencies, stage 2 chỉ copy artifacts cần thiết",
            "Dùng image Windows thay vì Linux",
          ]}
          correct={1}
          explanation="Multi-stage build: stage 1 cài pip packages (cần compiler, headers), stage 2 base image nhỏ gọn + copy chỉ packages đã build. Giảm image từ 15GB xuống 5-8GB. Kết hợp .dockerignore loại bỏ file thừa."
        />
      </LessonSection>

      {/* STEP 5: EXPLANATION */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Container hoá</strong>{" "}
            là kỹ thuật đóng gói ứng dụng (model AI + code + dependencies) vào một đơn vị chuẩn chạy nhất quán trên mọi môi trường.
          </p>

          <p><strong>Container vs VM:</strong></p>
          <LaTeX block>{"\\text{VM} = \\text{App} + \\text{Guest OS} + \\text{Hypervisor} \\quad (\\text{startup: phút, overhead: 15-20\\%})"}</LaTeX>
          <LaTeX block>{"\\text{Container} = \\text{App} + \\text{Libs} \\quad (\\text{share host kernel, startup: giây, overhead: 1-3\\%})"}</LaTeX>

          <Callout variant="tip" title="NVIDIA Container Toolkit">
            Mặc định container không thấy GPU. NVIDIA Container Toolkit inject GPU drivers + CUDA vào container at runtime. Bạn chỉ cần base image có CUDA, không cần match version với host.
          </Callout>

          <p><strong>Docker cho AI workflow:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Reproducibility:</strong>{" "}Dockerfile = bản thiết kế chính xác, ai build cũng giống nhau</li>
            <li><strong>Isolation:</strong>{" "}Model A dùng PyTorch 2.0, Model B dùng 2.3 — không xung đột</li>
            <li><strong>Portability:</strong>{" "}Build trên laptop, chạy trên FPT Cloud/AWS/GCP — giống hệt</li>
            <li><strong>Scaling:</strong>{" "}Kubernetes tạo 100 replica từ 1 image trong vài giây</li>
          </ul>

          <CodeBlock language="dockerfile" title="Dockerfile tối ưu cho AI model serving">
{`# Stage 1: Build dependencies
FROM python:3.11-slim AS builder
WORKDIR /build
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Stage 2: Runtime (nhỏ gọn hơn nhiều)
FROM nvidia/cuda:12.1.0-runtime-ubuntu22.04
WORKDIR /app

# Copy chỉ Python packages đã build
COPY --from=builder /install /usr/local
COPY ./model /app/model
COPY ./src /app/src

# Model weights (hoặc download lúc start)
ENV MODEL_PATH=/app/model/llama-7b-q4.gguf
ENV CUDA_VISIBLE_DEVICES=0

EXPOSE 8000
CMD ["uvicorn", "src.server:app", "--host", "0.0.0.0", "--port", "8000"]
# Image: 5.2GB thay vì 15GB nếu single-stage`}
          </CodeBlock>

          <CodeBlock language="yaml" title="Kubernetes deployment với GPU">
{`apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-model-serving
spec:
  replicas: 3  # 3 bản sao cho high availability
  selector:
    matchLabels:
      app: ai-model
  template:
    spec:
      containers:
      - name: model
        image: registry.fpt.cloud/ai-team/model:v2.1
        resources:
          limits:
            nvidia.com/gpu: 1   # 1 GPU per replica
            memory: "16Gi"
          requests:
            memory: "8Gi"
        ports:
        - containerPort: 8000
      # Auto-scale 2-10 replicas based on GPU utilization
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec:
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: nvidia.com/gpu
      target:
        averageUtilization: 70`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      {/* STEP 6: SUMMARY */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "Container đóng gói model + dependencies vào 'hộp' chuẩn — chạy giống nhau trên mọi máy.",
          "Nhẹ hơn VM (share kernel, 1-3% overhead), khởi động trong giây thay vì phút.",
          "NVIDIA Container Toolkit cho phép container truy cập GPU mà không cần cài CUDA riêng.",
          "Multi-stage build giảm image size 2-3x, .dockerignore loại file thừa.",
          "Kubernetes điều phối hàng trăm container: auto-scaling, load balancing, self-healing, rolling updates.",
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
