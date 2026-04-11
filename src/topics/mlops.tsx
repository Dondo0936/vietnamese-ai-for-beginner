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
  slug: "mlops",
  title: "MLOps",
  titleVi: "MLOps — DevOps cho máy học",
  description:
    "Tập hợp thực hành và công cụ để tự động hoá vòng đời phát triển, triển khai và giám sát mô hình máy học.",
  category: "infrastructure",
  tags: ["mlops", "pipeline", "automation", "ci-cd"],
  difficulty: "intermediate",
  relatedSlugs: ["model-serving", "monitoring", "containerization"],
  vizType: "interactive",
};

/* ── MLOps maturity levels ── */
interface MaturityLevel {
  level: number;
  name: string;
  dataVer: boolean;
  autoTrain: boolean;
  ciCd: boolean;
  monitoring: boolean;
  autoRetrain: boolean;
  desc: string;
}

const LEVELS: MaturityLevel[] = [
  { level: 0, name: "Thủ công", dataVer: false, autoTrain: false, ciCd: false, monitoring: false, autoRetrain: false, desc: "Jupyter notebook, copy file model, không version gì cả" },
  { level: 1, name: "Pipeline cơ bản", dataVer: true, autoTrain: true, ciCd: false, monitoring: false, autoRetrain: false, desc: "Pipeline tự động train, data versioning, nhưng deploy thủ công" },
  { level: 2, name: "CI/CD cho ML", dataVer: true, autoTrain: true, ciCd: true, monitoring: true, autoRetrain: false, desc: "Tự động test + deploy, monitoring, nhưng retrain thủ công" },
  { level: 3, name: "Tự động hoàn toàn", dataVer: true, autoTrain: true, ciCd: true, monitoring: true, autoRetrain: true, desc: "Phát hiện drift → tự retrain → tự deploy → tự monitor" },
];

const TOTAL_STEPS = 7;

export default function MLOpsTopic() {
  const [activeLevel, setActiveLevel] = useState(0);
  const level = LEVELS[activeLevel];

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Tại sao ML cần MLOps riêng, không dùng DevOps thông thường?",
      options: [
        "ML dùng ngôn ngữ lập trình khác",
        "ML có thêm chiều dữ liệu: code thay đổi VÀ data thay đổi đều ảnh hưởng model",
        "ML không cần CI/CD",
      ],
      correct: 1,
      explanation: "DevOps quản lý code changes. MLOps phải quản lý thêm data changes, model versioning, experiment tracking, data drift. Model có thể 'hỏng' dù code không đổi — chỉ vì data thay đổi.",
    },
    {
      question: "Feature Store giải quyết vấn đề gì?",
      options: [
        "Lưu trữ model weights",
        "Cung cấp features nhất quán giữa training và serving, tránh training-serving skew",
        "Quản lý code version",
      ],
      correct: 1,
      explanation: "Training-serving skew: feature tính khác nhau khi train vs serve → model dự đoán sai. Feature Store đảm bảo cùng logic tính feature, có versioning, và serve features với latency thấp.",
    },
    {
      question: "Shadow deployment hoạt động thế nào?",
      options: [
        "Deploy model mới thay thế model cũ hoàn toàn",
        "Model mới nhận traffic thật nhưng không trả kết quả cho user, chỉ log để so sánh",
        "Chạy model trong shadow mode tiết kiệm GPU",
      ],
      correct: 1,
      explanation: "Shadow deployment: model mới chạy song song với model cũ, nhận cùng input, nhưng chỉ model cũ trả kết quả cho user. So sánh output hai model để đánh giá trước khi chuyển traffic thật.",
    },
  ], []);

  return (
    <>
      {/* STEP 1: PREDICTION GATE */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Team ML của bạn train model trong Jupyter notebook, copy file .pkl lên server bằng SCP, không có version data hay model. Tuần sau model cho kết quả tệ hơn. Vấn đề ở đâu?"
          options={[
            "Jupyter notebook không đủ mạnh, cần chuyển sang IDE",
            "Thiếu quy trình MLOps: không biết data nào train model nào, không monitor, không thể rollback",
            "Model bị hỏng file khi copy SCP",
          ]}
          correct={1}
          explanation="Đúng! Không có MLOps = không biết model version nào đang chạy, data nào đã train, khi nào model bắt đầu kém. Giống xây nhà không có bản vẽ — mọi thứ rối khi cần sửa."
        >

      {/* STEP 2: INTERACTIVE VIZ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Chọn từng <strong className="text-foreground">mức trưởng thành MLOps</strong>{" "}
          để xem những gì được tự động hoá ở mỗi cấp độ.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {LEVELS.map((l, i) => (
                <button
                  key={i}
                  onClick={() => setActiveLevel(i)}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    activeLevel === i
                      ? "bg-accent text-white"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                >
                  Level {l.level}: {l.name}
                </button>
              ))}
            </div>

            <svg viewBox="0 0 600 220" className="w-full max-w-2xl mx-auto">
              {/* Pipeline stages */}
              {[
                { label: "Data Version", active: level.dataVer, x: 60 },
                { label: "Auto Train", active: level.autoTrain, x: 180 },
                { label: "CI/CD", active: level.ciCd, x: 300 },
                { label: "Monitoring", active: level.monitoring, x: 420 },
                { label: "Auto Retrain", active: level.autoRetrain, x: 540 },
              ].map((stage, i) => (
                <g key={i}>
                  <rect
                    x={stage.x - 50} y={30} width={100} height={45} rx={8}
                    fill={stage.active ? "#22c55e" : "#1e293b"}
                    stroke={stage.active ? "#22c55e" : "#475569"}
                    strokeWidth={stage.active ? 2 : 1}
                  />
                  <text x={stage.x} y={50} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">
                    {stage.label}
                  </text>
                  <text x={stage.x} y={65} textAnchor="middle" fill={stage.active ? "#bbf7d0" : "#64748b"} fontSize={8}>
                    {stage.active ? "ON" : "OFF"}
                  </text>
                  {i < 4 && (
                    <line
                      x1={stage.x + 50} y1={52} x2={stage.x + 70} y2={52}
                      stroke={stage.active && [level.dataVer, level.autoTrain, level.ciCd, level.monitoring, level.autoRetrain][i + 1] ? "#22c55e" : "#475569"}
                      strokeWidth={2}
                    />
                  )}
                </g>
              ))}

              {/* Loop arrow for auto retrain */}
              {level.autoRetrain && (
                <>
                  <path d="M 540 75 C 560 160, 40 160, 60 75" fill="none" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5,3" />
                  <text x={300} y={155} textAnchor="middle" fill="#f59e0b" fontSize={9}>Vòng lặp tự động: Drift detected → Retrain → Deploy</text>
                </>
              )}

              {/* Description */}
              <text x={300} y={190} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontWeight="bold">
                Level {level.level}: {level.name}
              </text>
              <text x={300} y={210} textAnchor="middle" fill="#94a3b8" fontSize={9}>
                {level.desc}
              </text>
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* STEP 3: AHA */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            87% model ML không bao giờ lên production! Lý do chính: thiếu MLOps.
            Data scientist giỏi train model nhưng không biết deploy, monitor, retrain.{" "}
            <strong>MLOps chính là cầu nối</strong>{" "}
            giữa notebook thí nghiệm và sản phẩm thực tế — giống DevOps đã cách mạng hoá software, MLOps đang cách mạng hoá ML.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* STEP 4: CHALLENGE */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Model gợi ý sản phẩm trên Shopee đột nhiên gợi ý toàn áo ấm dù đang mùa hè. Code không thay đổi. Nguyên nhân có thể là gì?"
          options={[
            "Bug trong code preprocessing",
            "Data drift: dữ liệu training có mùa đông nhiều hơn, model không được retrain cho mùa hè",
            "GPU bị lỗi phần cứng",
          ]}
          correct={1}
          explanation="Data drift điển hình! Model train trên data cũ (có mùa đông) không phản ánh context hiện tại (mùa hè). MLOps monitoring phát hiện drift sớm và trigger retrain tự động với data gần nhất."
        />
      </LessonSection>

      {/* STEP 5: EXPLANATION */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>MLOps</strong>{" "}
            (Machine Learning Operations) là tập hợp thực hành và công cụ tự động hoá toàn bộ vòng đời ML: từ data đến production và quay lại.
          </p>

          <p><strong>Tại sao ML cần Ops riêng?</strong></p>
          <p>
            Software truyền thống: <LaTeX>{"\\text{Code} \\rightarrow \\text{Product}"}</LaTeX>.
            ML có thêm chiều dữ liệu:
          </p>
          <LaTeX block>{"\\text{Product} = f(\\text{Code}, \\text{Data}, \\text{Model}, \\text{Config})"}</LaTeX>
          <p>
            Bất kỳ thành phần nào thay đổi đều ảnh hưởng kết quả. MLOps quản lý tất cả.
          </p>

          <p><strong>5 trụ cột MLOps:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Data Management:</strong>{" "}Versioning (DVC), lineage tracking, quality checks</li>
            <li><strong>Experiment Tracking:</strong>{" "}Log metrics, params, artifacts (MLflow, W&B)</li>
            <li><strong>Model Registry:</strong>{" "}Version models, staging/production promotion</li>
            <li><strong>CI/CD for ML:</strong>{" "}Auto test data quality, model performance trước deploy</li>
            <li><strong>Monitoring:</strong>{" "}Phát hiện data drift, model degradation, trigger retrain</li>
          </ul>

          <Callout variant="tip" title="Training-Serving Skew">
            Lỗi phổ biến nhất khi deploy ML: feature tính khác nhau lúc train vs serve. Ví dụ: train dùng pandas normalize, serve dùng code khác → kết quả sai. Feature Store (Feast, Tecton) giải quyết bằng cách dùng chung 1 logic.
          </Callout>

          <p><strong>Deployment strategies:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Shadow:</strong>{" "}Model mới chạy song song, chỉ log không serve — an toàn nhất</li>
            <li><strong>Canary:</strong>{" "}Chuyển 5% traffic sang model mới, tăng dần nếu OK</li>
            <li><strong>Blue-Green:</strong>{" "}Hai môi trường, switch traffic nguyên khối</li>
            <li><strong>A/B Test:</strong>{" "}Chia user thành nhóm, đo business metric khác biệt</li>
          </ul>

          <CodeBlock language="yaml" title="MLOps Pipeline với GitHub Actions + MLflow">
{`# .github/workflows/ml-pipeline.yml
name: ML Pipeline
on:
  push:
    paths: ['data/**', 'models/**']

jobs:
  train-evaluate-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Data validation
      - name: Validate data quality
        run: python scripts/validate_data.py --threshold 0.95

      # Train with experiment tracking
      - name: Train model
        run: |
          python train.py \\
            --experiment "recommendation-v3" \\
            --tracking-uri $MLFLOW_URI
        env:
          MLFLOW_URI: $\{{ secrets.MLFLOW_URI }}

      # Evaluate against production model
      - name: Compare with production
        run: python evaluate.py --min-improvement 0.02

      # Deploy if better (canary 10%)
      - name: Canary deploy
        if: success()
        run: python deploy.py --strategy canary --traffic 0.1`}
          </CodeBlock>

          <Callout variant="info" title="MLOps tại Việt Nam">
            FPT AI, VNG, VinAI đều có team MLOps riêng. Startup Việt Nam thường bắt đầu từ Level 0-1 (notebook + manual deploy), rồi dần lên Level 2-3 khi scale. Công cụ phổ biến: MLflow (free), W&B (startup plan), DVC cho data versioning.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* STEP 6: SUMMARY */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "MLOps tự động hoá vòng đời ML: data → train → evaluate → deploy → monitor → retrain.",
          "Khác DevOps vì ML có thêm chiều data: model 'hỏng' dù code không đổi (data drift).",
          "4 mức trưởng thành: từ notebook thủ công (Level 0) đến tự động hoàn toàn (Level 3).",
          "Feature Store ngăn training-serving skew — lỗi phổ biến nhất khi deploy ML.",
          "Deploy strategies: Shadow → Canary → Blue-Green, tăng dần risk tolerance.",
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
