"use client";

import { useState, useMemo } from "react";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX, TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "data-pipelines",
  title: "Data Pipelines",
  titleVi: "Đường ống dữ liệu",
  description:
    "Thiết kế quy trình tự động thu thập, xử lý và chuẩn bị dữ liệu cho huấn luyện mô hình AI",
  category: "infrastructure",
  tags: ["etl", "automation", "data-flow"],
  difficulty: "intermediate",
  relatedSlugs: ["data-preprocessing", "mlops", "feature-engineering"],
  vizType: "interactive",
};

/* ── Pipeline stage simulator ── */
interface PipelineStage {
  name: string;
  status: "idle" | "running" | "done" | "error";
  duration: string;
  inputRows: number;
  outputRows: number;
}

const INITIAL_STAGES: PipelineStage[] = [
  { name: "Thu thập (Ingest)", status: "idle", duration: "2 phút", inputRows: 0, outputRows: 1000000 },
  { name: "Xác thực (Validate)", status: "idle", duration: "30s", inputRows: 1000000, outputRows: 985000 },
  { name: "Biến đổi (Transform)", status: "idle", duration: "5 phút", inputRows: 985000, outputRows: 985000 },
  { name: "Lưu trữ (Store)", status: "idle", duration: "1 phút", inputRows: 985000, outputRows: 985000 },
  { name: "Phục vụ (Serve)", status: "idle", duration: "10s", inputRows: 985000, outputRows: 985000 },
];

const TOTAL_STEPS = 7;

export default function DataPipelinesTopic() {
  const [stages, setStages] = useState<PipelineStage[]>(INITIAL_STAGES);
  const [running, setRunning] = useState(false);
  const [currentStage, setCurrentStage] = useState(-1);

  const runPipeline = () => {
    if (running) return;
    setRunning(true);
    setStages(INITIAL_STAGES);

    let i = 0;
    const interval = setInterval(() => {
      setCurrentStage(i);
      setStages((prev) =>
        prev.map((s, idx) => ({
          ...s,
          status: idx < i ? "done" : idx === i ? "running" : "idle",
        }))
      );
      i++;
      if (i > INITIAL_STAGES.length) {
        clearInterval(interval);
        setStages((prev) => prev.map((s) => ({ ...s, status: "done" })));
        setRunning(false);
        setCurrentStage(-1);
      }
    }, 800);
  };

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "ETL và ELT khác nhau ở điểm nào?",
      options: [
        "ETL: Transform trước khi Load vào warehouse. ELT: Load raw data trước, Transform trong warehouse",
        "Chúng giống nhau, chỉ khác tên",
        "ETL cho batch, ELT cho streaming",
      ],
      correct: 0,
      explanation: "ETL (Extract-Transform-Load): transform trên pipeline server trước khi lưu. ELT (Extract-Load-Transform): load raw data vào warehouse (BigQuery, Snowflake), transform bằng SQL trong warehouse. ELT phổ biến hơn vì warehouse hiện đại rất mạnh.",
    },
    {
      question: "Data validation ở đâu trong pipeline quan trọng nhất?",
      options: [
        "Chỉ ở cuối pipeline khi data đã hoàn thành",
        "Ngay sau ingestion (đầu vào) VÀ trước khi serve (đầu ra) — 'garbage in, garbage out'",
        "Không cần validate, model tự học từ data",
      ],
      correct: 1,
      explanation: "Validate sớm bắt lỗi sớm: schema violations, missing values, outliers. Validate trước serve đảm bảo data sạch cho model. 'Garbage in, garbage out' — model tốt nhất cũng cho kết quả tệ nếu data bẩn.",
    },
    {
      question: "Apache Airflow dùng để làm gì trong data pipeline?",
      options: [
        "Xử lý dữ liệu song song như Spark",
        "Điều phối (orchestrate) các bước pipeline: lên lịch, quản lý thứ tự, retry khi lỗi",
        "Lưu trữ dữ liệu như database",
      ],
      correct: 1,
      explanation: "Airflow là orchestrator, không xử lý data trực tiếp. Nó lên lịch chạy các task (DAG), quản lý dependencies giữa các bước, retry khi fail, alert khi error. Tương tự như 'quản lý nhà máy' — không tự tay làm mà điều phối.",
    },
    {
      type: "fill-blank",
      question: "Quy trình Extract-Transform-Load viết tắt là {blank}. Pipeline chia làm hai kiểu theo tần suất: {blank} (gom theo lô định kỳ) và streaming (real-time từng event).",
      blanks: [
        { answer: "ETL", accept: ["elt", "e-t-l", "etl"] },
        { answer: "batch", accept: ["theo lô", "theo lo", "batching"] },
      ],
      explanation: "ETL (Extract-Transform-Load) là quy trình kinh điển; ELT là biến thể load trước rồi transform trong warehouse. Batch pipeline chạy theo lịch (giờ/ngày) cho analytics; streaming pipeline (Kafka, Flink) xử lý từng event real-time.",
    },
  ], []);

  return (
    <>
      {/* STEP 1: PREDICTION GATE */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Model gợi ý sản phẩm Shopee cần data mua sắm của 50 triệu user. Data nằm rải ở 5 database khác nhau, cập nhật mỗi phút. Bạn cần gì để model luôn có data mới nhất?"
          options={[
            "Export CSV thủ công mỗi tuần rồi upload lên server",
            "Data pipeline tự động: thu thập từ 5 nguồn, làm sạch, biến đổi, đưa vào feature store real-time",
            "Model tự biết tìm data mình cần",
          ]}
          correct={1}
          explanation="Đúng! Data Pipeline là 'nhà máy chế biến' tự động — nguyên liệu thô (raw data) từ nhiều nguồn được thu thập, làm sạch, biến đổi, và giao đến model sẵn sàng sử dụng. Không có pipeline = data stale, model tệ!"
        >

      {/* STEP 2: INTERACTIVE VIZ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Click <strong className="text-foreground">Chạy Pipeline</strong>{" "}
          để xem data đi qua từng giai đoạn — từ thu thập đến phục vụ.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            <button
              onClick={runPipeline}
              disabled={running}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors mx-auto block ${
                running
                  ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {running ? "Đang chạy..." : "Chạy Pipeline"}
            </button>

            <svg viewBox="0 0 600 180" className="w-full max-w-2xl mx-auto">
              {stages.map((stage, i) => {
                const x = 15 + i * 118;
                const color = stage.status === "done" ? "#22c55e" : stage.status === "running" ? "#f59e0b" : "#475569";
                return (
                  <g key={i}>
                    <rect x={x} y={20} width={108} height={55} rx={8}
                      fill={stage.status === "running" ? color : "#1e293b"}
                      stroke={color} strokeWidth={stage.status === "idle" ? 1 : 2}
                    />
                    <text x={x + 54} y={42} textAnchor="middle" fill="white" fontSize={8} fontWeight="bold">
                      {stage.name}
                    </text>
                    <text x={x + 54} y={58} textAnchor="middle" fill="#94a3b8" fontSize={7}>
                      {stage.duration}
                    </text>
                    {stage.status === "done" && (
                      <text x={x + 54} y={72} textAnchor="middle" fill="#22c55e" fontSize={7}>
                        {stage.outputRows.toLocaleString()} rows
                      </text>
                    )}

                    {/* Arrow */}
                    {i < stages.length - 1 && (
                      <polygon
                        points={`${x + 112},42 ${x + 128},47 ${x + 112},52`}
                        fill={stage.status === "done" ? "#22c55e" : "#475569"}
                      />
                    )}
                  </g>
                );
              })}

              {/* Data sources */}
              <text x={300} y={110} textAnchor="middle" fill="#94a3b8" fontSize={9} fontWeight="bold">
                Nguồn dữ liệu
              </text>
              {["PostgreSQL", "Kafka Stream", "CSV/API", "S3 Files"].map((src, i) => (
                <g key={i}>
                  <rect x={60 + i * 130} y={120} width={110} height={24} rx={4} fill="#3b82f6" opacity={0.15} stroke="#3b82f6" strokeWidth={1} />
                  <text x={115 + i * 130} y={136} textAnchor="middle" fill="#3b82f6" fontSize={8}>{src}</text>
                </g>
              ))}

              {/* Orchestrator */}
              <rect x={60} y={155} width={480} height={20} rx={4} fill="#8b5cf6" opacity={0.1} stroke="#8b5cf6" strokeWidth={1} />
              <text x={300} y={169} textAnchor="middle" fill="#8b5cf6" fontSize={8}>
                Orchestrator: Apache Airflow / Dagster / Prefect
              </text>
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* STEP 3: AHA */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            80% thời gian của dự án ML là <strong>xử lý dữ liệu</strong>, chỉ 20% là train model!{" "}
            Data pipeline tốt = model tốt. Pipeline tệ = 'garbage in, garbage out'.
            Giống nhà máy chế biến thực phẩm: nguyên liệu tươi + quy trình sạch = sản phẩm chất lượng.
            <strong>{" "}Đầu tư vào pipeline là đầu tư khôn ngoan nhất!</strong>
          </p>
        </AhaMoment>
      </LessonSection>

      {/* STEP 4: CHALLENGE */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Pipeline chạy hàng đêm lúc 2h sáng. Một đêm, bước Transform fail vì data có cột mới (schema change). Sáng hôm sau team mới biết. Thiếu gì trong pipeline?"
          options={[
            "Thiếu GPU mạnh hơn để xử lý nhanh",
            "Thiếu data validation + alerting: check schema trước transform, alert Slack khi fail",
            "Thiếu nhiều data hơn",
          ]}
          correct={1}
          explanation="Data validation (Great Expectations, Pandera) check schema, data types, value ranges TRƯỚC khi transform. Khi fail: alert Slack/PagerDuty ngay lập tức, không đợi đến sáng. Pipeline robustness = validation + alerting + retry + fallback."
        />
      </LessonSection>

      {/* STEP 5: EXPLANATION */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Data Pipeline</strong>{" "}
            là quy trình tự động hoá thu thập, xử lý, và chuẩn bị dữ liệu từ nguồn đến đích — thành phần không thể thiếu trong mọi hệ thống AI/ML, là nền tảng cho <TopicLink slug="mlops">MLOps</TopicLink>{" "}hoàn chỉnh.
          </p>

          <p><strong>5 giai đoạn cốt lõi:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Ingestion (Thu thập):</strong>{" "}Pull/Push từ databases, APIs, files, streaming (Kafka)</li>
            <li><strong>Validation (Xác thực):</strong>{" "}Check schema, data quality, detect anomalies</li>
            <li><strong>Transformation (Biến đổi):</strong>{" "}Clean, normalize, feature engineering</li>
            <li><strong>Storage (Lưu trữ):</strong>{" "}Data lake (raw), warehouse (structured), feature store (ML)</li>
            <li><strong>Serving (Phục vụ):</strong>{" "}API cho training pipeline hoặc real-time inference</li>
          </ul>

          <p><strong>Batch vs Streaming Pipeline:</strong></p>
          <LaTeX block>{"\\text{Batch: } \\Delta t_{\\text{freshness}} = \\text{hours/days} \\quad vs \\quad \\text{Streaming: } \\Delta t = \\text{seconds}"}</LaTeX>

          <Callout variant="tip" title="ETL vs ELT">
            ETL (Extract-Transform-Load): transform trước khi lưu — khi warehouse yếu. ELT (Extract-Load-Transform): load raw, transform trong warehouse (BigQuery, Snowflake, Databricks) — xu hướng hiện đại vì warehouse rất mạnh.
          </Callout>

          <p><strong>Data Quality dimensions:</strong></p>
          <LaTeX block>{"\\text{Quality} = f(\\text{Completeness}, \\text{Accuracy}, \\text{Timeliness}, \\text{Consistency}, \\text{Uniqueness})"}</LaTeX>

          <CodeBlock language="python" title="Data Pipeline với Apache Airflow">
{`from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta

# Pipeline chạy mỗi ngày lúc 2h sáng
dag = DAG(
    "ml_data_pipeline",
    schedule_interval="0 2 * * *",  # Cron: 2:00 AM daily
    default_args={
        "retries": 3,
        "retry_delay": timedelta(minutes=5),
        "on_failure_callback": alert_slack,  # Alert khi fail
    },
)

# Bước 1: Thu thập từ nhiều nguồn
ingest = PythonOperator(
    task_id="ingest",
    python_callable=ingest_from_sources,
    op_kwargs={"sources": ["postgres", "kafka", "s3"]},
    dag=dag,
)

# Bước 2: Validate data quality
validate = PythonOperator(
    task_id="validate",
    python_callable=validate_with_great_expectations,
    # Fail pipeline nếu data không đạt chuẩn
    dag=dag,
)

# Bước 3: Transform + Feature Engineering
transform = PythonOperator(
    task_id="transform",
    python_callable=run_dbt_transform,
    dag=dag,
)

# Bước 4: Load vào Feature Store
serve = PythonOperator(
    task_id="serve_features",
    python_callable=update_feature_store,
    dag=dag,
)

# Dependencies: ingest >> validate >> transform >> serve
ingest >> validate >> transform >> serve`}
          </CodeBlock>

          <Callout variant="info" title="Data Pipeline tại Việt Nam">
            Shopee, Tiki, VNG xử lý hàng triệu events/giây qua Kafka + Spark. Startup nhỏ hơn dùng Airflow + dbt + BigQuery. FPT Cloud cung cấp managed Kafka và Spark cho doanh nghiệp Việt. Pipeline production cần kết hợp <TopicLink slug="monitoring">giám sát</TopicLink>{" "}để phát hiện schema drift và data quality issues.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* STEP 6: SUMMARY */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "Data Pipeline tự động hoá 5 bước: Ingest → Validate → Transform → Store → Serve.",
          "80% thời gian ML là xử lý data. Pipeline tốt = model tốt. 'Garbage in, garbage out'.",
          "Validation bắt buộc ở đầu vào và đầu ra — Great Expectations, Pandera detect anomalies sớm.",
          "Batch pipeline (hours) cho analytics, Streaming pipeline (seconds) cho real-time features.",
          "Orchestrator (Airflow, Dagster) quản lý thứ tự, retry, alerting — 'quản đốc nhà máy' dữ liệu.",
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
