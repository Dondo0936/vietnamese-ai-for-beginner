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
  { name: "Thu thập (Ingest)", status: "idle", duration: "2 phut", inputRows: 0, outputRows: 1000000 },
  { name: "Xac thuc (Validate)", status: "idle", duration: "30s", inputRows: 1000000, outputRows: 985000 },
  { name: "Bien doi (Transform)", status: "idle", duration: "5 phut", inputRows: 985000, outputRows: 985000 },
  { name: "Luu tru (Store)", status: "idle", duration: "1 phut", inputRows: 985000, outputRows: 985000 },
  { name: "Phuc vu (Serve)", status: "idle", duration: "10s", inputRows: 985000, outputRows: 985000 },
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
      question: "ETL va ELT khac nhau o diem nao?",
      options: [
        "ETL: Transform truoc khi Load vao warehouse. ELT: Load raw data truoc, Transform trong warehouse",
        "Chung giong nhau, chi khac ten",
        "ETL cho batch, ELT cho streaming",
      ],
      correct: 0,
      explanation: "ETL (Extract-Transform-Load): transform tren pipeline server truoc khi luu. ELT (Extract-Load-Transform): load raw data vao warehouse (BigQuery, Snowflake), transform bang SQL trong warehouse. ELT pho bien hon vi warehouse hien dai rat manh.",
    },
    {
      question: "Data validation o dau trong pipeline quan trong nhat?",
      options: [
        "Chi o cuoi pipeline khi data da hoan thanh",
        "Ngay sau ingestion (dau vao) VA truoc khi serve (dau ra) — 'garbage in, garbage out'",
        "Khong can validate, model tu hoc tu data",
      ],
      correct: 1,
      explanation: "Validate som bat loi som: schema violations, missing values, outliers. Validate truoc serve dam bao data sach cho model. 'Garbage in, garbage out' — model tot nhat cung cho ket qua te neu data ban.",
    },
    {
      question: "Apache Airflow dung de lam gi trong data pipeline?",
      options: [
        "Xu ly du lieu song song nhu Spark",
        "Dieu phoi (orchestrate) cac buoc pipeline: len lich, quan ly thu tu, retry khi loi",
        "Luu tru du lieu nhu database",
      ],
      correct: 1,
      explanation: "Airflow la orchestrator, khong xu ly data truc tiep. No len lich chay cac task (DAG), quan ly dependencies giua cac buoc, retry khi fail, alert khi error. Tuong tu nhu 'quan ly nha may' — khong tu tay lam ma dieu phoi.",
    },
  ], []);

  return (
    <>
      {/* STEP 1: PREDICTION GATE */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Du doan">
        <PredictionGate
          question="Model goi y san pham Shopee can data mua sam cua 50 trieu user. Data nam rai o 5 database khac nhau, cap nhat moi phut. Ban can gi de model luon co data moi nhat?"
          options={[
            "Export CSV thu cong moi tuan roi upload len server",
            "Data pipeline tu dong: thu thap tu 5 nguon, lam sach, bien doi, dua vao feature store real-time",
            "Model tu biet tim data minh can",
          ]}
          correct={1}
          explanation="Dung! Data Pipeline la 'nha may che bien' tu dong — nguyen lieu tho (raw data) tu nhieu nguon duoc thu thap, lam sach, bien doi, va giao den model san sang su dung. Khong co pipeline = data stale, model te!"
        >

      {/* STEP 2: INTERACTIVE VIZ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Kham pha">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Click <strong className="text-foreground">Chay Pipeline</strong>{" "}
          de xem data di qua tung giai doan — tu thu thap den phuc vu.
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
              {running ? "Dang chay..." : "Chay Pipeline"}
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
                Nguon du lieu
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
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoanh khac Aha">
        <AhaMoment>
          <p>
            80% thoi gian cua du an ML la <strong>xu ly du lieu</strong>, chi 20% la train model!{" "}
            Data pipeline tot = model tot. Pipeline te = &quot;garbage in, garbage out&quot;.
            Giong nha may che bien thuc pham: nguyen lieu tuoi + quy trinh sach = san pham chat luong.
            <strong>{" "}Dau tu vao pipeline la dau tu khon ngoan nhat!</strong>
          </p>
        </AhaMoment>
      </LessonSection>

      {/* STEP 4: CHALLENGE */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thu thach">
        <InlineChallenge
          question="Pipeline chay hang dem luc 2h sang. Mot dem, buoc Transform fail vi data co cot moi (schema change). Sang hom sau team moi biet. Thieu gi trong pipeline?"
          options={[
            "Thieu GPU manh hon de xu ly nhanh",
            "Thieu data validation + alerting: check schema truoc transform, alert Slack khi fail",
            "Thieu nhieu data hon",
          ]}
          correct={1}
          explanation="Data validation (Great Expectations, Pandera) check schema, data types, value ranges TRUOC khi transform. Khi fail: alert Slack/PagerDuty ngay lap tuc, khong doi den sang. Pipeline robustness = validation + alerting + retry + fallback."
        />
      </LessonSection>

      {/* STEP 5: EXPLANATION */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Ly thuyet">
        <ExplanationSection>
          <p>
            <strong>Data Pipeline</strong>{" "}
            la quy trinh tu dong hoa thu thap, xu ly, va chuan bi du lieu tu nguon den dich — thanh phan khong the thieu trong moi he thong AI/ML.
          </p>

          <p><strong>5 giai doan cot loi:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Ingestion (Thu thap):</strong>{" "}Pull/Push tu databases, APIs, files, streaming (Kafka)</li>
            <li><strong>Validation (Xac thuc):</strong>{" "}Check schema, data quality, detect anomalies</li>
            <li><strong>Transformation (Bien doi):</strong>{" "}Clean, normalize, feature engineering</li>
            <li><strong>Storage (Luu tru):</strong>{" "}Data lake (raw), warehouse (structured), feature store (ML)</li>
            <li><strong>Serving (Phuc vu):</strong>{" "}API cho training pipeline hoac real-time inference</li>
          </ul>

          <p><strong>Batch vs Streaming Pipeline:</strong></p>
          <LaTeX block>{"\\text{Batch: } \\Delta t_{\\text{freshness}} = \\text{hours/days} \\quad vs \\quad \\text{Streaming: } \\Delta t = \\text{seconds}"}</LaTeX>

          <Callout variant="tip" title="ETL vs ELT">
            ETL (Extract-Transform-Load): transform truoc khi luu — khi warehouse yeu. ELT (Extract-Load-Transform): load raw, transform trong warehouse (BigQuery, Snowflake, Databricks) — xu huong hien dai vi warehouse rat manh.
          </Callout>

          <p><strong>Data Quality dimensions:</strong></p>
          <LaTeX block>{"\\text{Quality} = f(\\text{Completeness}, \\text{Accuracy}, \\text{Timeliness}, \\text{Consistency}, \\text{Uniqueness})"}</LaTeX>

          <CodeBlock language="python" title="Data Pipeline voi Apache Airflow">
{`from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta

# Pipeline chay moi ngay luc 2h sang
dag = DAG(
    "ml_data_pipeline",
    schedule_interval="0 2 * * *",  # Cron: 2:00 AM daily
    default_args={
        "retries": 3,
        "retry_delay": timedelta(minutes=5),
        "on_failure_callback": alert_slack,  # Alert khi fail
    },
)

# Buoc 1: Thu thap tu nhieu nguon
ingest = PythonOperator(
    task_id="ingest",
    python_callable=ingest_from_sources,
    op_kwargs={"sources": ["postgres", "kafka", "s3"]},
    dag=dag,
)

# Buoc 2: Validate data quality
validate = PythonOperator(
    task_id="validate",
    python_callable=validate_with_great_expectations,
    # Fail pipeline neu data khong dat chuan
    dag=dag,
)

# Buoc 3: Transform + Feature Engineering
transform = PythonOperator(
    task_id="transform",
    python_callable=run_dbt_transform,
    dag=dag,
)

# Buoc 4: Load vao Feature Store
serve = PythonOperator(
    task_id="serve_features",
    python_callable=update_feature_store,
    dag=dag,
)

# Dependencies: ingest >> validate >> transform >> serve
ingest >> validate >> transform >> serve`}
          </CodeBlock>

          <Callout variant="info" title="Data Pipeline tai Viet Nam">
            Shopee, Tiki, VNG xu ly hang trieu events/giay qua Kafka + Spark. Startup nho hon dung Airflow + dbt + BigQuery. FPT Cloud cung cap managed Kafka va Spark cho doanh nghiep Viet.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* STEP 6: SUMMARY */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tom tat">
        <MiniSummary points={[
          "Data Pipeline tu dong hoa 5 buoc: Ingest → Validate → Transform → Store → Serve.",
          "80% thoi gian ML la xu ly data. Pipeline tot = model tot. 'Garbage in, garbage out'.",
          "Validation bat buoc o dau vao va dau ra — Great Expectations, Pandera detect anomalies som.",
          "Batch pipeline (hours) cho analytics, Streaming pipeline (seconds) cho real-time features.",
          "Orchestrator (Airflow, Dagster) quan ly thu tu, retry, alerting — 'quan doc nha may' du lieu.",
        ]} />
      </LessonSection>

      {/* STEP 7: QUIZ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiem tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>

        </PredictionGate>
      </LessonSection>
    </>
  );
}
