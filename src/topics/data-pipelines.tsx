"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
  TopicLink,
  CollapsibleDetail,
  SplitView,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

// ---------------------------------------------------------------------------
// METADATA — giữ nguyên, không chỉnh slug/category
// ---------------------------------------------------------------------------

export const metadata: TopicMeta = {
  slug: "data-pipelines",
  title: "Data Pipelines",
  titleVi: "Đường ống dữ liệu",
  description:
    "Thiết kế quy trình tự động thu thập, xử lý và chuẩn bị dữ liệu cho huấn luyện mô hình AI",
  category: "infrastructure",
  tags: ["etl", "automation", "data-flow"],
  difficulty: "advanced",
  relatedSlugs: ["data-preprocessing", "mlops", "feature-engineering"],
  vizType: "interactive",
};

// ---------------------------------------------------------------------------
// TYPES & DATA — kiểu dữ liệu cho minh hoạ pipeline ETL
// ---------------------------------------------------------------------------

/** Mỗi giai đoạn trong pipeline: trạng thái, thời lượng, số record vào/ra. */
interface PipelineStage {
  /** Tên giai đoạn hiển thị trên thẻ SVG */
  name: string;
  /** Nhãn con giải thích ngắn (dùng trong bảng và tooltip) */
  sub: string;
  /** Trạng thái hiện tại để đổi màu thẻ */
  status: "idle" | "running" | "done" | "error";
  /** Thời lượng ước lượng cho batch 1 triệu record */
  duration: string;
  /** Số record vào giai đoạn */
  inputRows: number;
  /** Số record ra khỏi giai đoạn (sau khi lọc/validate) */
  outputRows: number;
  /** Mã màu chủ đạo cho thẻ khi đang chạy */
  accent: string;
}

/** Cấu hình mặc định cho 6 giai đoạn: Source → Ingest → Validate → Transform → Feature Store → Training. */
const INITIAL_STAGES: PipelineStage[] = [
  {
    name: "Nguồn (Source)",
    sub: "Postgres · Kafka · S3",
    status: "idle",
    duration: "—",
    inputRows: 0,
    outputRows: 1_050_000,
    accent: "#38bdf8",
  },
  {
    name: "Thu thập (Ingest)",
    sub: "Fivetran / Airbyte",
    status: "idle",
    duration: "2 phút",
    inputRows: 1_050_000,
    outputRows: 1_000_000,
    accent: "#22d3ee",
  },
  {
    name: "Xác thực (Validate)",
    sub: "Great Expectations",
    status: "idle",
    duration: "30 giây",
    inputRows: 1_000_000,
    outputRows: 985_000,
    accent: "#a78bfa",
  },
  {
    name: "Biến đổi (Transform)",
    sub: "Spark · dbt · Pandas",
    status: "idle",
    duration: "5 phút",
    inputRows: 985_000,
    outputRows: 985_000,
    accent: "#f472b6",
  },
  {
    name: "Feature Store",
    sub: "Feast · Tecton",
    status: "idle",
    duration: "1 phút",
    inputRows: 985_000,
    outputRows: 985_000,
    accent: "#f59e0b",
  },
  {
    name: "Huấn luyện (Training)",
    sub: "PyTorch · Ray",
    status: "idle",
    duration: "10 giây/phút",
    inputRows: 985_000,
    outputRows: 985_000,
    accent: "#22c55e",
  },
];

const TOTAL_STEPS = 7;

/** Khoá hiển thị cho bảng so sánh batch vs streaming. */
interface ComparisonRow {
  axis: string;
  batch: string;
  streaming: string;
}

const BATCH_VS_STREAMING: ComparisonRow[] = [
  {
    axis: "Độ trễ (latency)",
    batch: "Giờ → ngày",
    streaming: "Mili-giây → giây",
  },
  {
    axis: "Công cụ phổ biến",
    batch: "Airflow · Spark · dbt",
    streaming: "Kafka · Flink · Spark Streaming",
  },
  {
    axis: "Ví dụ use case",
    batch: "Báo cáo, huấn luyện lại hàng đêm",
    streaming: "Fraud detection, personalization real-time",
  },
  {
    axis: "Độ phức tạp",
    batch: "Thấp — job có điểm đầu/cuối rõ ràng",
    streaming: "Cao — state management, watermark, exactly-once",
  },
  {
    axis: "Khả năng backfill",
    batch: "Dễ: replay job là xong",
    streaming: "Khó: cần log-replay (Kafka), idempotency",
  },
  {
    axis: "Chi phí vận hành",
    batch: "Thấp — cluster chạy theo lịch",
    streaming: "Cao — luôn online, tài nguyên 24/7",
  },
];

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

export default function DataPipelinesTopic() {
  // Trạng thái các giai đoạn pipeline
  const [stages, setStages] = useState<PipelineStage[]>(INITIAL_STAGES);
  const [running, setRunning] = useState(false);
  const [currentStage, setCurrentStage] = useState(-1);

  // Mô phỏng luồng dữ liệu: offset dùng cho animation các "hạt" chạy dọc pipeline
  const [flowOffset, setFlowOffset] = useState(0);

  // Animate flow khi đang chạy
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setFlowOffset((p) => (p + 4) % 600);
    }, 60);
    return () => clearInterval(id);
  }, [running]);

  const runPipeline = useCallback(() => {
    if (running) return;
    setRunning(true);
    setStages(INITIAL_STAGES);
    setCurrentStage(-1);

    let i = 0;
    const interval = setInterval(() => {
      setCurrentStage(i);
      setStages((prev) =>
        prev.map((s, idx) => ({
          ...s,
          status: idx < i ? "done" : idx === i ? "running" : "idle",
        })),
      );
      i++;
      if (i > INITIAL_STAGES.length) {
        clearInterval(interval);
        setStages((prev) => prev.map((s) => ({ ...s, status: "done" })));
        setRunning(false);
        setCurrentStage(-1);
      }
    }, 900);

    return () => clearInterval(interval);
  }, [running]);

  const resetPipeline = useCallback(() => {
    setRunning(false);
    setStages(INITIAL_STAGES);
    setCurrentStage(-1);
  }, []);

  // Tỉ lệ hao hụt record qua validate (để hiển thị cảnh báo data quality)
  const dropRate = useMemo(() => {
    const ingested = stages[1]?.outputRows ?? 0;
    const validated = stages[2]?.outputRows ?? 0;
    if (!ingested) return 0;
    return ((ingested - validated) / ingested) * 100;
  }, [stages]);

  // ---------------------------------------------------------------------
  // QUIZ (8 câu)
  // ---------------------------------------------------------------------

  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question: "ETL và ELT khác nhau ở điểm nào?",
        options: [
          "ETL: Transform trước khi Load vào warehouse. ELT: Load raw data trước, Transform trong warehouse",
          "Chúng giống nhau, chỉ khác tên",
          "ETL cho batch, ELT cho streaming",
        ],
        correct: 0,
        explanation:
          "ETL (Extract-Transform-Load): transform trên pipeline server trước khi lưu. ELT (Extract-Load-Transform): load raw data vào warehouse (BigQuery, Snowflake), transform bằng SQL trong warehouse. ELT phổ biến hơn vì warehouse hiện đại rất mạnh.",
      },
      {
        question: "Data validation ở đâu trong pipeline quan trọng nhất?",
        options: [
          "Chỉ ở cuối pipeline khi data đã hoàn thành",
          "Ngay sau ingestion (đầu vào) VÀ trước khi serve (đầu ra) — 'garbage in, garbage out'",
          "Không cần validate, model tự học từ data",
        ],
        correct: 1,
        explanation:
          "Validate sớm bắt lỗi sớm: schema violations, missing values, outliers. Validate trước serve đảm bảo data sạch cho model. 'Garbage in, garbage out' — model tốt nhất cũng cho kết quả tệ nếu data bẩn.",
      },
      {
        question: "Apache Airflow dùng để làm gì trong data pipeline?",
        options: [
          "Xử lý dữ liệu song song như Spark",
          "Điều phối (orchestrate) các bước pipeline: lên lịch, quản lý thứ tự, retry khi lỗi",
          "Lưu trữ dữ liệu như database",
        ],
        correct: 1,
        explanation:
          "Airflow là orchestrator, không xử lý data trực tiếp. Nó lên lịch chạy các task (DAG), quản lý dependencies giữa các bước, retry khi fail, alert khi error. Tương tự như 'quản lý nhà máy' — không tự tay làm mà điều phối.",
      },
      {
        question:
          "Trong Airflow DAG, nếu task B phụ thuộc task A, bạn viết như thế nào?",
        options: [
          "A.parent = B",
          "A >> B (hoặc A.set_downstream(B))",
          "depend(A, B)",
        ],
        correct: 1,
        explanation:
          "Airflow dùng toán tử bitshift để khai báo phụ thuộc: `A >> B` nghĩa là B chạy sau khi A thành công. Có thể viết chuỗi: `ingest >> validate >> transform >> load`. Đây là DSL đơn giản nhưng biểu đạt được cả đồ thị có hướng không chu trình (DAG).",
      },
      {
        question:
          "Batch pipeline chạy lúc 2h sáng nhận file CSV 500MB. File đến trễ 3 tiếng do mạng. Thiết kế robust nhất?",
        options: [
          "Cứng nhắc chạy đúng 2h, bỏ batch nếu thiếu file",
          "Dùng sensor/trigger đợi file tới, kèm timeout 4h, alert nếu quá hạn",
          "Chạy ngay cả khi thiếu file — sau đó điền null",
        ],
        correct: 1,
        explanation:
          "Airflow cung cấp `FileSensor`, `S3KeySensor` để đợi file xuất hiện mới chạy task tiếp theo. Luôn đặt timeout và alert để không treo pipeline vô hạn. Thiếu data + điền null = bug ngầm, tệ hơn là fail rõ ràng.",
      },
      {
        question:
          "Feature Store (ví dụ Feast, Tecton) giải quyết vấn đề gì?",
        options: [
          "Lưu model weights cho inference nhanh hơn",
          "Đảm bảo feature dùng ở training và serving giống hệt nhau, tránh train-serve skew",
          "Giúp GPU training nhanh hơn 10 lần",
        ],
        correct: 1,
        explanation:
          "Feature store lưu feature đã tính sẵn ở hai chế độ: offline (parquet cho training) và online (Redis/DynamoDB cho inference millisecond). Một định nghĩa feature duy nhất, dùng ở cả 2 nơi → tránh train-serve skew — lỗi kinh điển của ML production.",
      },
      {
        question:
          "Bạn đang xây pipeline real-time phát hiện gian lận thẻ tín dụng. Kiến trúc hợp lý nhất?",
        options: [
          "Airflow chạy batch mỗi giờ — đủ nhanh",
          "Kafka ingest event → Flink/Spark Streaming tính feature → model score → alert trong giây",
          "Chạy SQL trên warehouse mỗi 5 phút",
        ],
        correct: 1,
        explanation:
          "Fraud detection yêu cầu độ trễ sub-second. Kafka làm message bus (pub/sub, bền bỉ qua replay log), Flink/Spark Streaming tính feature cửa sổ trượt (rolling window), model inference in-stream, rồi publish cảnh báo. Batch 1h là quá trễ — tiền đã mất.",
      },
      {
        type: "fill-blank",
        question:
          "Quy trình Extract-Transform-Load viết tắt là {blank}. Pipeline chia làm hai kiểu theo tần suất: {blank} (gom theo lô định kỳ) và streaming (real-time từng event).",
        blanks: [
          { answer: "ETL", accept: ["elt", "e-t-l", "etl"] },
          { answer: "batch", accept: ["theo lô", "theo lo", "batching"] },
        ],
        explanation:
          "ETL (Extract-Transform-Load) là quy trình kinh điển; ELT là biến thể load trước rồi transform trong warehouse. Batch pipeline chạy theo lịch (giờ/ngày) cho analytics; streaming pipeline (Kafka, Flink) xử lý từng event real-time.",
      },
    ],
    [],
  );

  // ---------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------

  return (
    <>
      {/* ═══ STEP 1: PREDICTION GATE ════════════════════════════════════ */}
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
          {/* ═══ ANALOGY BLOCK ═══════════════════════════════════════════ */}
          <div className="my-6 rounded-2xl border border-border bg-surface/40 p-5">
            <h4 className="text-sm font-semibold text-foreground">
              Ẩn dụ: Nhà máy chế biến thực phẩm
            </h4>
            <p className="mt-2 text-sm text-muted leading-relaxed">
              Hãy tưởng tượng một <strong>nhà máy nước trái cây</strong> quy mô công nghiệp.
              Nguyên liệu (trái cây thô) đến từ nhiều nông trại — đó là <em>nguồn dữ liệu</em>{" "}
              (database, API, Kafka, S3). Nhà máy có 5 dây chuyền nối tiếp:
            </p>
            <ul className="mt-3 list-disc list-inside space-y-1 text-sm text-muted pl-2">
              <li>
                <strong>Rửa &amp; phân loại</strong> = Ingest: tập trung nguyên liệu về kho.
              </li>
              <li>
                <strong>Kiểm định chất lượng</strong> = Validate: loại trái thối, sai kích cỡ.
              </li>
              <li>
                <strong>Ép, lọc, pha chế</strong> = Transform: chuyển raw data thành feature.
              </li>
              <li>
                <strong>Đóng chai lưu kho</strong> = Feature Store: sản phẩm đã đóng gói sẵn.
              </li>
              <li>
                <strong>Giao hàng cho cửa hàng</strong> = Training/Serving: model hoặc API dùng feature.
              </li>
            </ul>
            <p className="mt-3 text-sm text-muted leading-relaxed">
              Có <strong>quản đốc</strong> đứng điều phối cả nhà máy — đó chính là{" "}
              <em>orchestrator</em> (Airflow, Dagster, Prefect). Quản đốc không trực tiếp ép trái cây,
              nhưng quyết định dây chuyền nào chạy lúc nào, báo động khi máy hỏng, và ghi nhật ký để
              truy vết lỗi. Không có quản đốc, các dây chuyền không biết thứ tự chạy — chaos.
            </p>
          </div>

          {/* ═══ STEP 2: VISUALIZATION — ETL PIPELINE DIAGRAM ═══════════ */}
          <LessonSection
            step={2}
            totalSteps={TOTAL_STEPS}
            label="Khám phá"
          >
            <p className="mb-4 text-sm text-muted leading-relaxed">
              Nhấn <strong className="text-foreground">Chạy pipeline</strong> để xem data đi qua sáu
              giai đoạn: <em>Source → Ingest → Validate → Transform → Feature Store → Training</em>.
              Quan sát: số record giảm sau bước Validate (data không đạt chuẩn bị loại) và các hạt
              dữ liệu chạy dọc theo các mũi tên khi pipeline đang active.
            </p>

            <VisualizationSection topicSlug={metadata.slug}>
              <div className="space-y-4">
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={runPipeline}
                    disabled={running}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                      running
                        ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                        : "bg-accent text-white hover:opacity-90"
                    }`}
                  >
                    {running ? "Đang chạy..." : "Chạy pipeline"}
                  </button>
                  <button
                    type="button"
                    onClick={resetPipeline}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface transition-colors"
                  >
                    Reset
                  </button>
                </div>

                {/* SVG: sơ đồ 6 thẻ nối liên tiếp */}
                <svg
                  viewBox="0 0 720 260"
                  className="w-full max-w-3xl mx-auto"
                  role="img"
                  aria-label="Sơ đồ ETL pipeline 6 giai đoạn"
                >
                  {/* Nguồn dữ liệu dưới cùng */}
                  <g>
                    <text
                      x={360}
                      y={220}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize={11}
                      fontWeight="bold"
                    >
                      Nguồn dữ liệu gốc
                    </text>
                    {["PostgreSQL", "Kafka", "REST API", "S3 Parquet"].map((src, i) => (
                      <g key={src}>
                        <rect
                          x={60 + i * 150}
                          y={230}
                          width={130}
                          height={22}
                          rx={4}
                          fill="#3b82f6"
                          opacity={0.15}
                          stroke="#3b82f6"
                          strokeWidth={1}
                        />
                        <text
                          x={125 + i * 150}
                          y={245}
                          textAnchor="middle"
                          fill="#3b82f6"
                          fontSize={11}
                        >
                          {src}
                        </text>
                      </g>
                    ))}
                  </g>

                  {/* Sáu thẻ giai đoạn */}
                  {stages.map((stage, i) => {
                    const cardW = 108;
                    const gap = 10;
                    const x = 10 + i * (cardW + gap);
                    const y = 40;
                    const activeColor =
                      stage.status === "done"
                        ? "#22c55e"
                        : stage.status === "running"
                          ? stage.accent
                          : "#475569";
                    const fillColor =
                      stage.status === "running"
                        ? stage.accent
                        : stage.status === "done"
                          ? "rgba(34,197,94,0.15)"
                          : "#1e293b";
                    return (
                      <g key={stage.name}>
                        <rect
                          x={x}
                          y={y}
                          width={cardW}
                          height={80}
                          rx={10}
                          fill={fillColor}
                          stroke={activeColor}
                          strokeWidth={stage.status === "idle" ? 1 : 2}
                        />
                        <text
                          x={x + cardW / 2}
                          y={y + 22}
                          textAnchor="middle"
                          fill={stage.status === "running" ? "#fff" : "#e2e8f0"}
                          fontSize={11}
                          fontWeight="bold"
                        >
                          {stage.name}
                        </text>
                        <text
                          x={x + cardW / 2}
                          y={y + 38}
                          textAnchor="middle"
                          fill="#94a3b8"
                          fontSize={11}
                        >
                          {stage.sub}
                        </text>
                        <text
                          x={x + cardW / 2}
                          y={y + 54}
                          textAnchor="middle"
                          fill="#cbd5e1"
                          fontSize={11}
                        >
                          {stage.duration}
                        </text>
                        {stage.status === "done" && (
                          <text
                            x={x + cardW / 2}
                            y={y + 70}
                            textAnchor="middle"
                            fill="#22c55e"
                            fontSize={11}
                          >
                            {stage.outputRows.toLocaleString()} rows
                          </text>
                        )}
                        {stage.status === "running" && (
                          <text
                            x={x + cardW / 2}
                            y={y + 70}
                            textAnchor="middle"
                            fill="#fde68a"
                            fontSize={11}
                          >
                            đang xử lý...
                          </text>
                        )}

                        {/* Mũi tên nối sang thẻ kế tiếp */}
                        {i < stages.length - 1 && (
                          <g>
                            <line
                              x1={x + cardW}
                              y1={y + 40}
                              x2={x + cardW + gap}
                              y2={y + 40}
                              stroke={
                                stage.status === "done" ? "#22c55e" : "#475569"
                              }
                              strokeWidth={2}
                            />
                            <polygon
                              points={`${x + cardW + gap},${y + 36} ${x + cardW + gap + 6},${y + 40} ${x + cardW + gap},${y + 44}`}
                              fill={
                                stage.status === "done" ? "#22c55e" : "#475569"
                              }
                            />
                            {/* Hạt dữ liệu chạy dọc mũi tên khi đang chạy */}
                            {running && stage.status === "running" && (
                              <circle
                                cx={x + cardW + (flowOffset % (cardW + gap))}
                                cy={y + 40}
                                r={3}
                                fill="#fde68a"
                              />
                            )}
                          </g>
                        )}
                      </g>
                    );
                  })}

                  {/* Mũi tên từ nguồn (dưới) lên thẻ Ingest */}
                  <g stroke="#38bdf8" strokeWidth={1} strokeDasharray="4 2">
                    {[0, 1, 2, 3].map((i) => (
                      <line
                        key={i}
                        x1={125 + i * 150}
                        y1={230}
                        x2={172}
                        y2={120}
                      />
                    ))}
                  </g>

                  {/* Orchestrator overlay */}
                  <g>
                    <rect
                      x={10}
                      y={10}
                      width={700}
                      height={22}
                      rx={4}
                      fill="#8b5cf6"
                      opacity={0.12}
                      stroke="#8b5cf6"
                      strokeWidth={1}
                    />
                    <text
                      x={360}
                      y={25}
                      textAnchor="middle"
                      fill="#c4b5fd"
                      fontSize={11}
                      fontWeight="bold"
                    >
                      Orchestrator: Apache Airflow · Dagster · Prefect — điều phối thứ tự, retry, alert
                    </text>
                  </g>
                </svg>

                {/* Bảng thống kê record */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-foreground">
                      Số record qua từng giai đoạn
                    </h4>
                    <span
                      className={`text-xs font-mono ${
                        dropRate > 5 ? "text-amber-500" : "text-muted"
                      }`}
                    >
                      Drop rate: {dropRate.toFixed(2)}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    {stages.map((s) => (
                      <div
                        key={s.name}
                        className="rounded-lg border border-border p-2 flex flex-col gap-0.5"
                        style={{
                          borderLeftColor: s.accent,
                          borderLeftWidth: 3,
                        }}
                      >
                        <span className="font-semibold text-foreground">
                          {s.name}
                        </span>
                        <span className="text-muted tabular-nums">
                          in: {s.inputRows.toLocaleString()}
                        </span>
                        <span className="text-muted tabular-nums">
                          out: {s.outputRows.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cảnh báo khi drop rate cao */}
                {dropRate > 1 && (
                  <Callout
                    variant={dropRate > 3 ? "warning" : "info"}
                    title={`Bước Validate loại bỏ ${dropRate.toFixed(1)}% bản ghi`}
                  >
                    Đây là dấu hiệu dữ liệu thượng nguồn có vấn đề: schema drift, null
                    bất thường, giá trị ngoài miền cho phép. Pipeline nên emit metric
                    này lên dashboard (Datadog, Grafana) và cảnh báo khi vượt ngưỡng —
                    ví dụ &gt; 5% thì chặn bước Transform để tránh "đầu độc" feature store.
                  </Callout>
                )}

                {currentStage >= 0 && (
                  <p className="text-center text-xs text-muted">
                    Đang ở giai đoạn <strong>{stages[currentStage]?.name}</strong>
                    {" — "}
                    {stages[currentStage]?.sub}
                  </p>
                )}
              </div>
            </VisualizationSection>

            {/* ═══ BATCH vs STREAMING COMPARISON ════════════════════════ */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-foreground mb-2">
                Batch vs Streaming — hai triết lý xử lý dữ liệu
              </h4>
              <p className="text-sm text-muted leading-relaxed mb-3">
                Cùng kiến trúc ETL nhưng tần suất khác nhau dẫn đến công cụ, độ phức tạp và chi phí
                rất khác. Bảng dưới so sánh sáu trục quan trọng khi chọn mô hình pipeline.
              </p>
              <SplitView
                leftLabel="Batch Pipeline"
                rightLabel="Streaming Pipeline"
                left={
                  <ul className="space-y-2 text-xs text-muted">
                    {BATCH_VS_STREAMING.map((row) => (
                      <li
                        key={`batch-${row.axis}`}
                        className="rounded-md border border-border p-2"
                      >
                        <div className="font-semibold text-foreground text-[11px]">
                          {row.axis}
                        </div>
                        <div className="mt-0.5">{row.batch}</div>
                      </li>
                    ))}
                  </ul>
                }
                right={
                  <ul className="space-y-2 text-xs text-muted">
                    {BATCH_VS_STREAMING.map((row) => (
                      <li
                        key={`stream-${row.axis}`}
                        className="rounded-md border border-border p-2"
                      >
                        <div className="font-semibold text-foreground text-[11px]">
                          {row.axis}
                        </div>
                        <div className="mt-0.5">{row.streaming}</div>
                      </li>
                    ))}
                  </ul>
                }
              />
            </div>

            {/* ═══ AIRFLOW DAG EXAMPLE ═══════════════════════════════════ */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-foreground mb-2">
                Airflow DAG — "bản thiết kế" của pipeline
              </h4>
              <p className="text-sm text-muted leading-relaxed mb-3">
                DAG (Directed Acyclic Graph) là đồ thị có hướng, không chu trình: mỗi node là một
                task, mỗi cạnh là dependency. Airflow parse file Python, dựng DAG, rồi scheduler
                chạy task theo đúng thứ tự. Dưới đây là sơ đồ đơn giản của pipeline ví dụ:
              </p>
              <div className="rounded-xl border border-border bg-surface/40 p-4">
                <svg
                  viewBox="0 0 640 170"
                  className="w-full max-w-2xl mx-auto"
                  role="img"
                  aria-label="Airflow DAG example"
                >
                  {/* Nodes */}
                  {[
                    { id: "ingest_pg", x: 20, y: 20, label: "ingest_postgres" },
                    { id: "ingest_s3", x: 20, y: 75, label: "ingest_s3" },
                    { id: "ingest_api", x: 20, y: 130, label: "ingest_api" },
                    { id: "validate", x: 210, y: 75, label: "validate_schema" },
                    { id: "transform", x: 380, y: 75, label: "transform_dbt" },
                    { id: "feature", x: 540, y: 20, label: "write_feature_store" },
                    { id: "train", x: 540, y: 130, label: "trigger_training" },
                  ].map((n) => (
                    <g key={n.id}>
                      <rect
                        x={n.x}
                        y={n.y}
                        width={140}
                        height={30}
                        rx={6}
                        fill="#1e293b"
                        stroke="#60a5fa"
                        strokeWidth={1}
                      />
                      <text
                        x={n.x + 70}
                        y={n.y + 19}
                        textAnchor="middle"
                        fill="#e2e8f0"
                        fontSize={11}
                        fontFamily="monospace"
                      >
                        {n.label}
                      </text>
                    </g>
                  ))}

                  {/* Edges */}
                  {[
                    { x1: 160, y1: 35, x2: 210, y2: 85 },
                    { x1: 160, y1: 90, x2: 210, y2: 90 },
                    { x1: 160, y1: 145, x2: 210, y2: 95 },
                    { x1: 350, y1: 90, x2: 380, y2: 90 },
                    { x1: 520, y1: 90, x2: 540, y2: 35 },
                    { x1: 520, y1: 90, x2: 540, y2: 145 },
                  ].map((e, i) => (
                    <g key={i}>
                      <line
                        x1={e.x1}
                        y1={e.y1}
                        x2={e.x2}
                        y2={e.y2}
                        stroke="#60a5fa"
                        strokeWidth={1.5}
                      />
                      <polygon
                        points={`${e.x2 - 6},${e.y2 - 3} ${e.x2},${e.y2} ${e.x2 - 6},${e.y2 + 3}`}
                        fill="#60a5fa"
                      />
                    </g>
                  ))}
                </svg>
                <p className="mt-2 text-[11px] text-muted italic text-center">
                  3 task ingest song song → validate tập trung → transform →
                  fan-out ghi feature store &amp; trigger training.
                </p>
              </div>
            </div>
          </LessonSection>

          {/* ═══ STEP 3: AHA MOMENT ════════════════════════════════════════ */}
          <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
            <AhaMoment>
              <p>
                80% thời gian của dự án ML là <strong>xử lý dữ liệu</strong>, chỉ 20% là train
                model! Data pipeline tốt = model tốt. Pipeline tệ = "garbage in, garbage out".
                Giống nhà máy chế biến thực phẩm: nguyên liệu tươi + quy trình sạch = sản phẩm
                chất lượng.
                <strong>{" "}Đầu tư vào pipeline là đầu tư khôn ngoan nhất!</strong>
              </p>
            </AhaMoment>
          </LessonSection>

          {/* ═══ STEP 4: INLINE CHALLENGES ════════════════════════════════ */}
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

            <div className="mt-4">
              <InlineChallenge
                question="Team ML thấy online metric của model tụt 20% sau deploy, dù offline metric vẫn tốt. Pipeline training dùng feature A = AVG(last_30_days), serving dùng feature A = AVG(last_7_days). Đây là lỗi gì?"
                options={[
                  "Overfitting — train quá kỹ",
                  "Train-serve skew — định nghĩa feature khác nhau giữa training và serving",
                  "Vanishing gradient trong mạng neural",
                ]}
                correct={1}
                explanation="Train-serve skew là lỗi silent killer: offline model học trên distribution A, production chạy trên distribution B. Giải pháp: dùng feature store (Feast, Tecton) có MỘT định nghĩa feature duy nhất cho cả offline (parquet) và online (Redis/DynamoDB). Xem thêm tại bài MLOps."
              />
            </div>
          </LessonSection>

          {/* ═══ STEP 5: EXPLANATION ═════════════════════════════════════ */}
          <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
            <ExplanationSection>
              {/* ── ĐỊNH NGHĨA ─────────────────────────────────────────── */}
              <p>
                <strong>Data Pipeline</strong> là quy trình tự động hoá thu thập, xử lý và chuẩn bị
                dữ liệu từ nguồn đến đích — thành phần không thể thiếu trong mọi hệ thống AI/ML, là
                nền tảng cho <TopicLink slug="mlops">MLOps</TopicLink> hoàn chỉnh. Một pipeline tốt
                đảm bảo dữ liệu đến đúng nơi, đúng lúc, đúng chất lượng, và có thể truy vết (data
                lineage) khi có sự cố.
              </p>

              <p>
                <strong>Sáu giai đoạn cốt lõi</strong> của một ML data pipeline:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>Source (Nguồn):</strong> cơ sở dữ liệu giao dịch (Postgres, MySQL), event
                  stream (Kafka, Kinesis), file storage (S3, GCS), REST API bên thứ ba.
                </li>
                <li>
                  <strong>Ingestion (Thu thập):</strong> Pull hoặc Push từ các nguồn về staging
                  area. Công cụ: Fivetran, Airbyte, Meltano cho batch; Kafka Connect cho streaming.
                </li>
                <li>
                  <strong>Validation (Xác thực):</strong> check schema, data quality, detect
                  anomalies. Great Expectations, Pandera, Soda.
                </li>
                <li>
                  <strong>Transformation (Biến đổi):</strong> clean, normalize, join, aggregate,
                  feature engineering. Spark, dbt, Pandas, Polars.
                </li>
                <li>
                  <strong>Feature Store (Lưu trữ feature):</strong> kho feature có 2 chế độ offline
                  (parquet/BigQuery) và online (Redis/DynamoDB) — Feast, Tecton, Hopsworks.
                </li>
                <li>
                  <strong>Serving (Phục vụ):</strong> API cho training pipeline (đọc offline store)
                  hoặc real-time inference (đọc online store với latency &lt; 10ms).
                </li>
              </ul>

              {/* ── LATEX: BATCH vs STREAMING ─────────────────────────── */}
              <p>
                <strong>Công thức độ tươi dữ liệu</strong> (data freshness) — chỉ số quan trọng
                đánh giá pipeline:
              </p>
              <LaTeX block>
                {
                  "\\text{freshness} = t_{\\text{now}} - t_{\\text{event}} \\quad \\text{với } \\begin{cases} \\text{batch:} & \\mathcal{O}(\\text{giờ}) \\\\ \\text{micro-batch:} & \\mathcal{O}(\\text{phút}) \\\\ \\text{streaming:} & \\mathcal{O}(\\text{giây}) \\end{cases}"
                }
              </LaTeX>

              <p>
                Một <strong>hàm đánh giá chất lượng dữ liệu</strong> tổng hợp:
              </p>
              <LaTeX block>
                {
                  "Q(D) = w_1 \\cdot \\text{Completeness} + w_2 \\cdot \\text{Accuracy} + w_3 \\cdot \\text{Timeliness} + w_4 \\cdot \\text{Consistency} + w_5 \\cdot \\text{Uniqueness}"
                }
              </LaTeX>

              {/* ── CODE BLOCK 1: AIRFLOW DAG ─────────────────────────── */}
              <CodeBlock language="python" title="1. Airflow DAG — orchestrate pipeline theo lịch">
                {`from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.sensors.filesystem import FileSensor
from airflow.utils.trigger_rule import TriggerRule
from datetime import datetime, timedelta

default_args = {
    "owner": "ml-platform",
    "retries": 3,
    "retry_delay": timedelta(minutes=5),
    "on_failure_callback": alert_slack,  # hook Slack khi fail
    "email_on_failure": True,
    "execution_timeout": timedelta(hours=2),
}

with DAG(
    dag_id="ml_data_pipeline_v2",
    start_date=datetime(2024, 1, 1),
    schedule_interval="0 2 * * *",     # cron: 2:00 AM mỗi ngày
    catchup=False,                      # bỏ qua backfill cũ
    max_active_runs=1,                  # chỉ 1 instance chạy cùng lúc
    default_args=default_args,
    tags=["ml", "feature-store"],
) as dag:

    # --- Bước 0: đợi file CSV từ vendor đến S3 ---
    wait_file = FileSensor(
        task_id="wait_for_raw_file",
        filepath="/data/raw/{{ ds }}/orders.csv",
        poke_interval=60,
        timeout=60 * 60 * 4,  # tối đa 4 giờ
        mode="reschedule",    # nhường slot cho task khác khi đang đợi
    )

    # --- Bước 1: ingest song song từ 3 nguồn ---
    ingest_pg = PythonOperator(
        task_id="ingest_postgres",
        python_callable=ingest_postgres_orders,
    )
    ingest_s3 = PythonOperator(
        task_id="ingest_s3",
        python_callable=ingest_s3_events,
    )
    ingest_api = PythonOperator(
        task_id="ingest_api",
        python_callable=ingest_third_party_api,
    )

    # --- Bước 2: validate tập trung ---
    validate = PythonOperator(
        task_id="validate_schema",
        python_callable=run_great_expectations,
        trigger_rule=TriggerRule.ALL_SUCCESS,   # chỉ chạy nếu 3 ingest OK
    )

    # --- Bước 3: transform với dbt ---
    transform = PythonOperator(
        task_id="transform_dbt",
        python_callable=run_dbt_models,
    )

    # --- Bước 4: fan-out — ghi feature store và trigger training ---
    write_feature = PythonOperator(
        task_id="write_feature_store",
        python_callable=materialize_feast_features,
    )
    trigger_train = PythonOperator(
        task_id="trigger_training",
        python_callable=submit_training_job,
    )

    # --- Dependencies ---
    wait_file >> [ingest_pg, ingest_s3, ingest_api] >> validate
    validate >> transform >> [write_feature, trigger_train]`}
              </CodeBlock>

              {/* ── CODE BLOCK 2: GREAT EXPECTATIONS ──────────────────── */}
              <CodeBlock
                language="python"
                title="2. Great Expectations — tầng bảo vệ data quality"
              >
                {`import great_expectations as gx

# 1. Context + Datasource
context = gx.get_context()
source = context.sources.add_pandas("orders")
asset = source.add_dataframe_asset("raw_orders")

# 2. Expectation Suite — khai báo "kỳ vọng" về dữ liệu
suite = context.add_expectation_suite("orders_suite")
validator = context.get_validator(
    batch_request=asset.build_batch_request(dataframe=df),
    expectation_suite=suite,
)

# Schema & bắt buộc có
validator.expect_table_columns_to_match_ordered_list(
    column_list=["order_id", "user_id", "amount", "currency", "created_at"]
)
validator.expect_column_values_to_not_be_null("order_id")
validator.expect_column_values_to_be_unique("order_id")

# Miền giá trị
validator.expect_column_values_to_be_between(
    column="amount", min_value=0, max_value=1_000_000_000
)
validator.expect_column_values_to_be_in_set(
    column="currency", value_set=["VND", "USD", "EUR"]
)

# Statistical checks
validator.expect_column_mean_to_be_between(
    column="amount", min_value=50_000, max_value=5_000_000
)

# 3. Save & chạy validation mỗi đêm trong Airflow
validator.save_expectation_suite()
result = validator.validate()
if not result.success:
    raise AirflowException(
        f"Data quality failed: {result.statistics['unsuccessful_expectations']} rules violated"
    )`}
              </CodeBlock>

              {/* ── 4 CALLOUTS ─────────────────────────────────────────── */}
              <Callout variant="tip" title="ETL vs ELT — chọn sao cho đúng?">
                <strong>ETL</strong> (Extract-Transform-Load): transform trên pipeline server trước
                khi lưu — phù hợp khi warehouse yếu hoặc data nhạy cảm cần làm sạch ở vùng tin cậy.
                <strong> ELT</strong> (Extract-Load-Transform): load raw trước, transform trong
                warehouse (BigQuery, Snowflake, Databricks) bằng SQL/dbt — xu hướng hiện đại vì
                warehouse có compute cực mạnh, separation of storage &amp; compute, phân quyền
                tốt hơn.
              </Callout>

              <Callout variant="info" title="Idempotency — chạy lại nhiều lần phải ra kết quả giống nhau">
                Mọi task trong pipeline nên <em>idempotent</em>: chạy lần 1 và lần 2 cho kết quả
                giống hệt. Cách làm: partition theo ngày (<code>WHERE date = &#39;2024-01-15&#39;</code>),
                dùng <code>MERGE INTO</code> thay <code>INSERT</code>, lưu watermark trong metadata
                store. Nếu không idempotent, retry sẽ nhân đôi dữ liệu → đại hoạ.
              </Callout>

              <Callout variant="warning" title="Schema evolution là kẻ thù ngầm">
                Upstream thêm/đổi cột bất ngờ sẽ làm vỡ bước Transform lúc 2h sáng. Phòng ngừa:
                (1) contract test giữa team producer và consumer; (2) Great Expectations block
                pipeline khi schema thay đổi; (3) dùng Avro/Protobuf với schema registry (Confluent
                Schema Registry) để enforce compatibility rules (backward/forward compatible).
              </Callout>

              <Callout variant="insight" title="Data lineage — truy vết gốc gác mỗi feature">
                Khi model cho dự đoán kỳ lạ, câu hỏi đầu tiên là "feature này tính từ nguồn nào,
                biến đổi qua những bước gì?". Công cụ lineage (OpenLineage, Marquez, DataHub) vẽ
                đồ thị phụ thuộc từ model → feature → transform → table → column gốc. Bắt buộc cho
                doanh nghiệp tuân thủ GDPR, HIPAA hoặc SOC2.
              </Callout>

              {/* ── 2 COLLAPSIBLE DETAILS ─────────────────────────────── */}
              <CollapsibleDetail title="Chi tiết: Airflow vs Dagster vs Prefect — chọn orchestrator nào?">
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Airflow</strong> (2014, Airbnb): thư viện lâu đời nhất, cộng đồng lớn
                    nhất. DAG viết bằng Python đơn thuần. Ưu: plugin bạt ngàn, tài liệu phong phú,
                    có managed service (MWAA, Astronomer, Cloud Composer). Nhược: mô hình
                    task-level khó biểu đạt dataflow phức tạp, UI đôi khi lag, testing DAG hơi
                    cồng kềnh.
                  </p>
                  <p>
                    <strong>Dagster</strong> (2019, Elementl): triết lý software-defined assets —
                    thay vì nghĩ theo task, nghĩ theo "dataset" (asset) và pipeline materialize
                    asset. Tích hợp sâu với dbt, Pandas, Polars. Mạnh về type system, testing,
                    observability. Nhược: đường học hơi dốc, cộng đồng nhỏ hơn.
                  </p>
                  <p>
                    <strong>Prefect</strong> (2018, Prefect Technologies): code-first, flow-first,
                    hybrid execution (agent chạy ở hạ tầng của bạn nhưng control plane trên cloud).
                    Ưu: API Python rất Pythonic, dễ bắt đầu. Nhược: một số feature enterprise cần
                    trả phí.
                  </p>
                  <p>
                    <strong>Khi nào dùng gì?</strong> Team mới, cần nhiều connector sẵn → Airflow.
                    Team dữ liệu mạnh, muốn type-safety + asset-based thinking → Dagster. Team
                    đã quen decorator-based Python, muốn nhẹ → Prefect.
                  </p>
                </div>
              </CollapsibleDetail>

              <CollapsibleDetail title="Chi tiết: Medallion architecture — Bronze / Silver / Gold">
                <div className="space-y-2 text-sm">
                  <p>
                    Databricks phổ biến mô hình <strong>Medallion</strong> để tổ chức data lake
                    thành 3 tầng chất lượng tăng dần:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    <li>
                      <strong>Bronze</strong> — raw, append-only, giữ đúng schema nguồn. Mục đích:
                      lưu trữ "nguyên bản lịch sử", có thể replay mọi logic tương lai từ đây.
                    </li>
                    <li>
                      <strong>Silver</strong> — đã validate, clean, deduplicate, join các bronze
                      table. Đây là tầng "đáng tin cậy" cho analyst và ML team dùng.
                    </li>
                    <li>
                      <strong>Gold</strong> — aggregated, business-ready: dashboards, KPI, feature
                      store. Mỗi gold table giải đáp một câu hỏi nghiệp vụ cụ thể.
                    </li>
                  </ul>
                  <p>
                    Lợi ích: trách nhiệm rõ ràng (bronze thuộc data engineer, silver thuộc
                    platform, gold thuộc nghiệp vụ), dễ truy vết lỗi, tái tính toán khi logic thay
                    đổi. Áp dụng được cả trên lakehouse (Delta, Iceberg, Hudi) lẫn warehouse
                    (BigQuery + dbt).
                  </p>
                </div>
              </CollapsibleDetail>

              {/* ── ỨNG DỤNG THỰC TẾ ──────────────────────────────────── */}
              <p>
                <strong>Ứng dụng thực tế</strong> — data pipeline là xương sống của mọi sản phẩm
                dữ liệu hiện đại:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>Recommendation (Shopee, TikTok):</strong> Kafka ingest event click/view →
                  Flink tính feature rolling (last 30 min) → Feast online store → model re-score
                  trong 50ms.
                </li>
                <li>
                  <strong>Fraud detection (VPBank, Momo):</strong> streaming feature cửa sổ trượt
                  + feature historical batch → XGBoost score real-time.
                </li>
                <li>
                  <strong>Forecasting (VNG, Grab):</strong> batch pipeline hàng đêm aggregate đơn
                  hàng, chạy Prophet/ARIMA, publish dashboard sáng hôm sau.
                </li>
                <li>
                  <strong>LLM fine-tuning (OpenAI, Anthropic):</strong> crawl + clean + dedupe
                  hàng petabyte text → shard parquet → DataLoader streaming cho GPU cluster.
                </li>
                <li>
                  <strong>IoT &amp; cảm biến (EVN, nhà máy Samsung):</strong> MQTT → Kafka →
                  TimescaleDB, pipeline phát hiện anomaly nhiệt độ trong vài giây.
                </li>
              </ul>

              {/* ── PITFALLS ──────────────────────────────────────────── */}
              <p>
                <strong>Bẫy thường gặp (pitfalls)</strong>:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>Silent data loss:</strong> bước ingest thất bại nhưng không alert → pipe
                  vẫn "xanh", dashboard sai lệch âm thầm. Khắc phục: monitor row count, so sánh
                  với baseline.
                </li>
                <li>
                  <strong>Thiếu idempotency:</strong> retry làm duplicate record. Dùng{" "}
                  <code>MERGE</code> / upsert / partition-overwrite thay{" "}
                  <code>INSERT INTO ... SELECT</code>.
                </li>
                <li>
                  <strong>Giờ/múi giờ lộn xộn:</strong> lưu timestamp mix UTC và giờ địa phương →
                  join sai. Chuẩn hoá về UTC ngay ở bước ingest.
                </li>
                <li>
                  <strong>Không versioning pipeline code:</strong> hotfix trực tiếp trên prod. Dùng
                  Git + CI/CD, deploy DAG qua pull request.
                </li>
                <li>
                  <strong>Quá nhiều small files:</strong> 100k file 1MB ở S3 → đọc cực chậm. Compact
                  lại thành file 128MB–1GB (Parquet, ORC).
                </li>
                <li>
                  <strong>Bỏ qua cost monitoring:</strong> job dbt nhỏ nhưng scan 20TB mỗi lần chạy,
                  hoá đơn BigQuery tăng theo tháng. Dùng partitioning, clustering, incremental dbt
                  models.
                </li>
              </ul>

              <Callout variant="info" title="Data Pipeline tại Việt Nam">
                Shopee, Tiki, VNG xử lý hàng triệu events/giây qua Kafka + Spark. Startup nhỏ hơn
                dùng Airflow + dbt + BigQuery. FPT Cloud cung cấp managed Kafka và Spark cho doanh
                nghiệp Việt. Pipeline production cần kết hợp{" "}
                <TopicLink slug="monitoring">giám sát</TopicLink> để phát hiện schema drift và
                data quality issues. Xem thêm bài{" "}
                <TopicLink slug="feature-engineering">feature engineering</TopicLink> để hiểu cách
                biến raw data thành feature có giá trị.
              </Callout>
            </ExplanationSection>
          </LessonSection>

          {/* ═══ STEP 6: MINI SUMMARY (6 điểm) ══════════════════════════ */}
          <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
            <MiniSummary
              points={[
                "Data Pipeline tự động hoá 6 bước: Source → Ingest → Validate → Transform → Feature Store → Training.",
                "80% thời gian ML là xử lý data. Pipeline tốt = model tốt; 'garbage in, garbage out'.",
                "Validation bắt buộc ở cả đầu vào và đầu ra — Great Expectations, Pandera detect anomalies sớm.",
                "Batch (latency giờ) cho analytics/retrain, Streaming (latency giây) cho real-time features.",
                "Orchestrator (Airflow, Dagster, Prefect) quản lý DAG: thứ tự, retry, alerting, lineage.",
                "Feature Store (Feast, Tecton) chống train-serve skew bằng một định nghĩa feature duy nhất cho cả offline lẫn online.",
              ]}
            />
          </LessonSection>

          {/* ═══ STEP 7: QUIZ (8 câu) ═══════════════════════════════════ */}
          <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
            <QuizSection questions={quizQuestions} />
          </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
