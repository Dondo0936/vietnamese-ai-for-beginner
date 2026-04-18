"use client";

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  CollapsibleDetail,
  TopicLink,
  LaTeX,
  ProgressSteps,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "end-to-end-ml-project",
  title: "End-to-End ML Project",
  titleVi: "Dự án ML từ A đến Z",
  description:
    "Capstone — hoàn thành dự án ML hoàn chỉnh: thu thập dữ liệu → tiền xử lý → huấn luyện → đánh giá → diễn giải kết quả.",
  category: "foundations",
  tags: ["project", "pipeline", "end-to-end", "capstone"],
  difficulty: "beginner",
  relatedSlugs: [
    "data-preprocessing",
    "feature-engineering",
    "model-evaluation-selection",
    "python-for-ml",
  ],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

/* ─────────────────────────────────────────────────────────────────────────────
 * Pipeline stage definitions — 8 bước kinh điển của một dự án ML thực chiến.
 * Mỗi stage gồm: tên, màu, icon, mô tả ngắn, tasks, pitfalls, giờ ước tính,
 * và tỉ lệ % thời gian trong một dự án trung bình.
 * ─────────────────────────────────────────────────────────────────────────── */

type Stage = {
  id: number;
  key: string;
  name: string;
  nameEn: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
  weekStart: number;
  weekEnd: number;
  hours: string;
  percent: number;
  summary: string;
  tasks: string[];
  pitfalls: string[];
  tools: string[];
  deliverable: string;
};

const STAGES: Stage[] = [
  {
    id: 0,
    key: "framing",
    name: "Đóng khung bài toán",
    nameEn: "Problem Framing",
    icon: "🎯",
    color: "#f97316",
    bg: "bg-orange-500/10",
    border: "border-orange-500/40",
    weekStart: 0,
    weekEnd: 1,
    hours: "1-3 ngày",
    percent: 5,
    summary:
      "Biến câu hỏi kinh doanh thành bài toán ML cụ thể — input, output, metric.",
    tasks: [
      "Gặp stakeholder, hiểu vấn đề kinh doanh (business problem).",
      "Xác định ML task: classification / regression / ranking / forecasting?",
      "Định nghĩa target variable rõ ràng (vd: khách hàng churn trong 30 ngày).",
      "Chọn success metric tương thích business (ROI, precision@k, MAE triệu VND).",
      "Đặt baseline: heuristic đơn giản hoặc benchmark hiện tại cần vượt qua.",
    ],
    pitfalls: [
      "Nhảy vào code khi vấn đề còn mơ hồ — 'dự đoán churn' không đủ, phải có định nghĩa chính xác.",
      "Chọn accuracy cho dataset imbalanced — 99% majority → model dự đoán toàn majority vẫn 99% accuracy.",
      "Không agree với stakeholder về success criteria — model tốt về metric nhưng vô dụng business.",
    ],
    tools: ["Notion / Miro", "Tài liệu spec", "SQL exploration"],
    deliverable: "Spec document: mô tả bài toán, target, metric, baseline.",
  },
  {
    id: 1,
    key: "collect",
    name: "Thu thập dữ liệu",
    nameEn: "Data Collection",
    icon: "📥",
    color: "#eab308",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/40",
    weekStart: 1,
    weekEnd: 3,
    hours: "1-2 tuần",
    percent: 15,
    summary:
      "Kéo data từ nguồn, đảm bảo quyền truy cập, tạo pipeline có thể lặp lại.",
    tasks: [
      "Liệt kê tất cả nguồn dữ liệu: database nội bộ, logs, API, scraping.",
      "Thiết lập pipeline trích xuất (ETL) reproducible — SQL query hoặc script.",
      "Xác định time range phù hợp (tránh data quá cũ, tránh leakage tương lai).",
      "Documented schema: tên cột, kiểu, ý nghĩa, đơn vị.",
      "Lưu snapshot (DVC / Delta Lake / S3 versioned) để experiment lặp lại được.",
    ],
    pitfalls: [
      "Train trên slice sai → model tốt offline, chết online vì real data khác phân phối.",
      "Quên time leakage: dùng features chỉ có SAU khi target xảy ra.",
      "Không lưu snapshot → 6 tháng sau không reproduce được kết quả.",
    ],
    tools: ["SQL / dbt", "Python + pandas", "DVC / Delta Lake"],
    deliverable: "Raw dataset + schema doc + pipeline SQL/script lưu trong repo.",
  },
  {
    id: 2,
    key: "eda",
    name: "Khám phá dữ liệu (EDA)",
    nameEn: "Exploratory Data Analysis",
    icon: "🔎",
    color: "#22c55e",
    bg: "bg-green-500/10",
    border: "border-green-500/40",
    weekStart: 3,
    weekEnd: 4,
    hours: "3-7 ngày",
    percent: 15,
    summary:
      "Nhìn dữ liệu trước khi cho máy học — phân phối, missing, outlier, correlation.",
    tasks: [
      "Thống kê mô tả mọi cột: mean, std, min, max, quantiles, nunique.",
      "Vẽ histogram/boxplot cho numeric, bar chart cho categorical.",
      "Heatmap correlation giữa features và với target.",
      "Kiểm tra missing values — tỉ lệ, pattern (MCAR vs MAR vs MNAR).",
      "Phát hiện outlier — IQR, z-score, hoặc domain rule (vd giá âm là sai).",
      "Phân tích target: balance, phân phối, trend theo thời gian.",
    ],
    pitfalls: [
      "Skip EDA để 'tiết kiệm thời gian' — sau này debug gấp 10 lần.",
      "Chỉ nhìn số liệu, không vẽ biểu đồ — mean giống nhau không có nghĩa phân phối giống nhau (xem Anscombe's quartet).",
      "Chưa split train/test đã vẽ EDA trên toàn bộ → nhẹ thì bias, nặng thì leakage.",
    ],
    tools: ["pandas", "matplotlib", "seaborn", "ydata-profiling", "Jupyter"],
    deliverable: "EDA notebook + insights file (3-5 finding quan trọng).",
  },
  {
    id: 3,
    key: "features",
    name: "Feature Engineering",
    nameEn: "Feature Engineering",
    icon: "🛠️",
    color: "#06b6d4",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/40",
    weekStart: 4,
    weekEnd: 6,
    hours: "1-3 tuần",
    percent: 25,
    summary:
      "Biến raw data thành features có tín hiệu — thường quyết định >50% kết quả.",
    tasks: [
      "Xử lý missing values: impute median / mean / mode / domain default.",
      "Encode categorical: one-hot, target encoding, ordinal, hashing.",
      "Scale numeric: StandardScaler, MinMax, RobustScaler tuỳ model.",
      "Tạo interaction features (vd giá/m², tỉ lệ income/debt).",
      "Time-based: day of week, hour, rolling mean, time since last event.",
      "Feature selection: filter (correlation), wrapper (RFE), embedded (L1, tree importance).",
    ],
    pitfalls: [
      "Fit scaler trên toàn bộ data (bao gồm test) → data leakage kinh điển.",
      "Target encoding không CV → encoding 'nhìn thấy' target → leak.",
      "Tạo quá nhiều features rác → model overfit và chậm.",
    ],
    tools: ["sklearn Pipeline", "category_encoders", "Featuretools", "tsfresh"],
    deliverable: "Feature store / Pipeline transformer + feature dictionary.",
  },
  {
    id: 4,
    key: "train",
    name: "Huấn luyện mô hình",
    nameEn: "Model Training",
    icon: "🤖",
    color: "#a855f7",
    bg: "bg-purple-500/10",
    border: "border-purple-500/40",
    weekStart: 6,
    weekEnd: 8,
    hours: "1-2 tuần",
    percent: 15,
    summary:
      "Chọn thuật toán, tune hyperparameters, cross-validation, track experiments.",
    tasks: [
      "Baseline đơn giản: LogReg / LinearReg → số để vượt qua.",
      "Thử 3-5 họ model khác nhau: linear, tree, ensemble, neural.",
      "Cross-validation (K-fold, StratifiedK-fold, TimeSeriesSplit) — không chỉ single split.",
      "Hyperparameter tuning: GridSearch, RandomSearch, Optuna Bayesian.",
      "Track experiments: MLflow / Weights & Biases / tự viết log.",
      "Chọn model dựa trên CV metric, không phải single test score.",
    ],
    pitfalls: [
      "Nhảy thẳng deep learning trước khi thử baseline — thường thua LightGBM trên tabular.",
      "Tune trên test set → leakage, overfit metric.",
      "Không set random_state → không reproduce được kết quả.",
    ],
    tools: ["sklearn", "LightGBM / XGBoost / CatBoost", "PyTorch", "Optuna", "MLflow"],
    deliverable: "Best model.pkl + hyperparameter log + CV score table.",
  },
  {
    id: 5,
    key: "evaluate",
    name: "Đánh giá & diễn giải",
    nameEn: "Evaluation & Interpretability",
    icon: "📊",
    color: "#ec4899",
    bg: "bg-pink-500/10",
    border: "border-pink-500/40",
    weekStart: 8,
    weekEnd: 9,
    hours: "3-5 ngày",
    percent: 10,
    summary:
      "Không chỉ 1 số — confusion matrix, error slicing, fairness, SHAP.",
    tasks: [
      "Metrics đầy đủ: accuracy, precision, recall, F1, ROC-AUC, PR-AUC.",
      "Confusion matrix — xem FP vs FN chi tiết.",
      "Error analysis: slice theo segment (tuổi, region, thời gian) để xem model yếu ở đâu.",
      "Calibration: xem xác suất output có đáng tin không (Brier score, reliability diagram).",
      "Interpretability: SHAP, LIME, permutation importance.",
      "Fairness audit nếu model ảnh hưởng con người.",
    ],
    pitfalls: [
      "Chỉ báo cáo 1 metric → stakeholder không hiểu trade-off.",
      "Bỏ qua error slicing → model 85% overall nhưng 40% cho 1 segment quan trọng.",
      "Không kiểm tra calibration khi cần probability (lending, medical).",
    ],
    tools: ["sklearn.metrics", "SHAP", "LIME", "fairlearn", "yellowbrick"],
    deliverable: "Evaluation report + SHAP summary plot + error analysis doc.",
  },
  {
    id: 6,
    key: "deploy",
    name: "Triển khai",
    nameEn: "Deployment",
    icon: "🚀",
    color: "#3b82f6",
    bg: "bg-blue-500/10",
    border: "border-blue-500/40",
    weekStart: 9,
    weekEnd: 11,
    hours: "1-3 tuần",
    percent: 10,
    summary:
      "Đưa model ra production — API, batch, edge. Canary, A/B, rollback.",
    tasks: [
      "Đóng gói model: pickle / ONNX / TorchScript.",
      "Viết inference service: FastAPI / Flask / BentoML / TorchServe.",
      "Container hoá: Docker + docker-compose hoặc Kubernetes.",
      "Load testing: QPS, latency p99, memory footprint.",
      "Canary rollout: 5% → 25% → 100% traffic với health checks.",
      "A/B test với baseline / heuristic cũ.",
    ],
    pitfalls: [
      "Model train offline với pandas, deploy online phải tự reimplement transforms → sai khớp.",
      "Không có feature parity — features online khác offline gây silent failure.",
      "Quên health check / rollback plan → sự cố production thành incident.",
    ],
    tools: ["FastAPI", "Docker", "Kubernetes", "BentoML", "Ray Serve"],
    deliverable: "Service deployed + API doc + runbook + A/B experiment log.",
  },
  {
    id: 7,
    key: "monitor",
    name: "Giám sát & vòng lặp",
    nameEn: "Monitoring & Iteration",
    icon: "📡",
    color: "#14b8a6",
    bg: "bg-teal-500/10",
    border: "border-teal-500/40",
    weekStart: 11,
    weekEnd: 16,
    hours: "vô hạn",
    percent: 5,
    summary:
      "Model không phải là đích — là bắt đầu. Data drift, concept drift, retrain.",
    tasks: [
      "Log mọi request: input, output, latency, model version.",
      "Dashboard metric kinh doanh (conversion, retention) + metric ML (precision, recall).",
      "Data drift detection: KS test, PSI, Jensen-Shannon giữa train và production distribution.",
      "Concept drift: target stats thay đổi theo thời gian.",
      "Alerting: Slack/PagerDuty khi metric rớt quá threshold.",
      "Retrain schedule: hàng tuần / hàng tháng / trigger-based.",
    ],
    pitfalls: [
      "Deploy xong rồi quên → 6 tháng sau model vô dụng vì data drift.",
      "Không có ground truth feedback loop → không biết model sai đến đâu.",
      "Retrain tự động không kiểm soát → model xấu đi mà không ai biết.",
    ],
    tools: ["Prometheus + Grafana", "Evidently AI", "WhyLabs", "Arize", "MLflow"],
    deliverable: "Monitoring dashboard + drift alerts + retrain pipeline.",
  },
];

const TOTAL_WEEKS = 16;

export default function EndToEndMlProjectTopic() {
  const [activeStage, setActiveStage] = useState<number>(0);
  const [showAllTasks, setShowAllTasks] = useState<boolean>(false);

  const stage = STAGES[activeStage];

  const nextStage = useCallback(() => {
    setActiveStage((s) => Math.min(s + 1, STAGES.length - 1));
  }, []);

  const prevStage = useCallback(() => {
    setActiveStage((s) => Math.max(s - 1, 0));
  }, []);

  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question: "Bước ĐẦU TIÊN trong bất kỳ dự án ML nào là gì?",
        options: [
          "Huấn luyện mô hình ngay với dữ liệu có sẵn",
          "Tìm thuật toán phức tạp nhất phù hợp với bài toán",
          "Problem framing + EDA — hiểu bài toán và dữ liệu trước khi xây mô hình",
          "Triển khai hạ tầng cloud để xử lý dữ liệu lớn",
        ],
        correct: 2,
        explanation:
          "Problem framing trả lời: target là gì? metric là gì? baseline ra sao? Sau đó EDA để hiểu data. Không có 2 bước này, mọi thứ sau đều là đoán mò — train ngay = 'garbage in, garbage out'.",
      },
      {
        question:
          "Trước khi train model, phải chia dữ liệu thành _______ và _______ (tối thiểu).",
        options: [
          "validation và production",
          "train và test",
          "input và output",
          "numeric và categorical",
        ],
        correct: 1,
        explanation:
          "Train/test split trước khi chạm dữ liệu. Thực chiến dùng 3 phần: train / validation (tuning) / test (final evaluation). Nếu dùng test set trong quá trình phát triển → data leakage → kết quả ảo.",
      },
      {
        question:
          "Tại sao KHÔNG nên đánh giá mô hình trên tập dữ liệu đã dùng để train?",
        options: [
          "Vì máy tính tốn nhiều tài nguyên hơn",
          "Vì mô hình 'thuộc lòng' train set — điểm cao ảo nhưng dự đoán kém trên dữ liệu mới (overfitting)",
          "Vì sklearn không hỗ trợ",
          "Vì quy trình ML yêu cầu tập riêng biệt theo convention",
        ],
        correct: 1,
        explanation:
          "Model học từ train set — nó 'nhớ' mọi pattern kể cả noise. Đánh giá cùng tập → điểm ảo. Đánh giá trên test set (chưa từng thấy) → phản ánh khả năng thực sự trên dữ liệu mới.",
      },
      {
        question:
          "Bạn xây model dự đoán churn với accuracy 99%. Tuy nhiên dataset có 99% khách hàng KHÔNG churn. Kết luận?",
        options: [
          "Model cực tốt — accuracy 99% rất cao",
          "Accuracy đánh lừa — model có thể chỉ đoán 'không churn' cho mọi người và vẫn đạt 99%. Phải xem precision/recall/F1 của class positive",
          "Cần train thêm 1 tuần",
          "Nên thay thuật toán",
        ],
        correct: 1,
        explanation:
          "Imbalanced dataset kinh điển. Accuracy vô dụng — phải dùng precision/recall/F1/PR-AUC cho minority class. Đây là lỗi framing: chọn sai metric từ đầu. Giai đoạn 1 (problem framing) phải chốt metric đúng.",
      },
      {
        question:
          "Trong dự án ML thực tế, % thời gian dành cho việc 'huấn luyện model' thường là bao nhiêu?",
        options: [
          "70-90% — vì model là linh hồn của dự án",
          "10-20% — phần lớn thời gian là data collection, EDA, feature engineering, deployment, monitoring",
          "50% — chia đều với data",
          "Tuỳ dự án, không có quy tắc",
        ],
        correct: 1,
        explanation:
          "Khảo sát Anaconda & Kaggle: data wrangling chiếm 45-50%, EDA + feature 25-30%, training chỉ 10-15%, deploy/monitor 10-15%. 'ML thực chiến là 80% data work' — câu này có cơ sở thực nghiệm.",
      },
      {
        question:
          "Hoàn thành: X_train, X_test, y_train, y_test = ___(X, y, test_size=0.2, random_state=42)",
        options: [
          "split_data",
          "train_test_split",
          "divide_dataset",
          "random_split",
        ],
        correct: 1,
        explanation:
          "sklearn.model_selection.train_test_split. test_size=0.2 = 20% test / 80% train. Luôn đặt random_state để reproducible. Với classification imbalanced dùng stratify=y.",
      },
      {
        question:
          "Model train offline đạt F1=0.85. Deploy production 1 tháng sau F1 tụt còn 0.62. Nguyên nhân có thể nhất?",
        options: [
          "Code deploy bị lỗi",
          "Data drift — phân phối input production đã thay đổi so với training set",
          "Server chậm",
          "Python version khác",
        ],
        correct: 1,
        explanation:
          "Đây là data drift / concept drift — kinh điển. Giải pháp: monitoring dashboard với PSI/KS test, alerting, retrain pipeline. Stage 8 (Monitoring) chính là để phát hiện sớm. Model là sản phẩm sống, không phải xong là xong.",
      },
      {
        question: "Deliverable cuối cùng của một dự án ML thành công là?",
        options: [
          "Một file model.pkl với accuracy cao",
          "Hệ thống đầy đủ: spec → data pipeline → model → service API → monitoring → retrain loop — tất cả reproducible và maintainable",
          "Báo cáo Jupyter notebook 500 dòng",
          "Model state-of-the-art trên benchmark",
        ],
        correct: 1,
        explanation:
          "Dự án ML thành công = end-to-end system, không phải single model. Reproducibility (DVC, MLflow), testability (unit tests cho features), monitoring (drift alerts), và runbook rollback là thành phần không thể thiếu.",
      },
    ],
    []
  );

  return (
    <>
      {/* ─────────── BƯỚC 1 — DỰ ĐOÁN ─────────── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <div className="mb-4">
          <ProgressSteps
            current={1}
            total={TOTAL_STEPS}
            labels={[
              "Dự đoán",
              "Pipeline",
              "Aha",
              "Thách thức",
              "Lý thuyết",
              "Kiểm tra",
              "Tóm tắt",
              "Quiz",
            ]}
          />
        </div>

        <PredictionGate
          question="Bạn có dữ liệu 5.000 căn nhà TP.HCM với diện tích, quận, số phòng, giá. Sếp giao dự án 2 tháng xây model dự đoán giá. Bước đầu tiên của bạn là gì?"
          options={[
            "Train model ngay — dữ liệu đã đủ để bắt đầu",
            "Problem framing — gặp stakeholder để hiểu vấn đề, định nghĩa target và metric, rồi mới EDA",
            "Tìm thuật toán tốt nhất rồi đọc dữ liệu sau",
            "Thuê cloud GPU để xử lý nhanh hơn",
          ]}
          correct={1}
          explanation="Problem framing luôn trước tiên. Sếp muốn gì? Định giá bất động sản, tư vấn người mua, hay detect giá ảo? Mỗi mục đích → target, metric, và threshold khác nhau. EDA sau đó để hiểu data, rồi mới đến feature engineering và training. Nhảy vào code ngay là sai lầm kinh điển."
        >
          {/* ─────────── BƯỚC 2 — VISUALIZATION: PIPELINE STAGES ─────────── */}
          <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Pipeline">
            <VisualizationSection>
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-muted leading-relaxed">
                    Một dự án ML hoàn chỉnh gồm{" "}
                    <strong className="text-foreground">8 giai đoạn</strong>. Bấm
                    vào từng giai đoạn để xem{" "}
                    <strong className="text-foreground">
                      tasks, pitfalls, thời gian ước tính, deliverable
                    </strong>
                    .
                  </p>
                </div>

                {/* Stage picker — horizontal scroll on mobile */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {STAGES.map((s, idx) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setActiveStage(idx)}
                      className={`rounded-xl border p-3 text-left transition-all ${
                        activeStage === idx
                          ? `${s.border} ${s.bg} shadow-lg scale-[1.02]`
                          : "border-border bg-surface/60 hover:border-accent/50 opacity-75 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{s.icon}</span>
                        <span
                          className="text-[10px] font-bold tabular-nums"
                          style={{ color: s.color }}
                        >
                          {idx + 1}/{STAGES.length}
                        </span>
                      </div>
                      <p
                        className="mt-1 text-xs font-semibold"
                        style={{ color: activeStage === idx ? s.color : undefined }}
                      >
                        {s.name}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted">{s.hours}</p>
                    </button>
                  ))}
                </div>

                {/* Active stage detail panel */}
                <motion.div
                  key={stage.key}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`rounded-2xl border ${stage.border} ${stage.bg} p-5 space-y-4`}
                >
                  <div className="flex flex-wrap items-start gap-3">
                    <span className="text-3xl">{stage.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[10px] font-bold uppercase tracking-wide"
                        style={{ color: stage.color }}
                      >
                        Giai đoạn {stage.id + 1} · {stage.nameEn}
                      </p>
                      <h4
                        className="text-lg font-bold"
                        style={{ color: stage.color }}
                      >
                        {stage.name}
                      </h4>
                      <p className="mt-1 text-sm text-foreground/85">
                        {stage.summary}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{
                          backgroundColor: `${stage.color}20`,
                          color: stage.color,
                        }}
                      >
                        ⏱️ {stage.hours}
                      </span>
                      <span className="text-[10px] text-muted">
                        ~{stage.percent}% effort
                      </span>
                    </div>
                  </div>

                  {/* Tasks list */}
                  <div>
                    <p className="mb-2 text-xs font-bold text-foreground">
                      ✅ Tasks quan trọng
                    </p>
                    <ul className="space-y-1.5">
                      {(showAllTasks ? stage.tasks : stage.tasks.slice(0, 4)).map(
                        (t, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-xs text-foreground/80"
                          >
                            <span
                              className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ backgroundColor: stage.color }}
                            />
                            <span>{t}</span>
                          </li>
                        )
                      )}
                    </ul>
                    {stage.tasks.length > 4 && (
                      <button
                        type="button"
                        onClick={() => setShowAllTasks((v) => !v)}
                        className="mt-2 text-[11px] font-medium text-muted hover:text-foreground underline-offset-2 hover:underline"
                      >
                        {showAllTasks
                          ? "Thu gọn"
                          : `Xem thêm ${stage.tasks.length - 4} tasks`}
                      </button>
                    )}
                  </div>

                  {/* Pitfalls */}
                  <div>
                    <p className="mb-2 text-xs font-bold text-red-400">
                      ⚠️ Pitfalls thường gặp
                    </p>
                    <ul className="space-y-1.5">
                      {stage.pitfalls.map((p, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-xs text-foreground/75"
                        >
                          <span className="mt-0.5 shrink-0 text-red-400">✗</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Tools + deliverable */}
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-border/60 bg-surface/60 p-3">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted">
                        Tools
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {stage.tools.map((t) => (
                          <span
                            key={t}
                            className="rounded bg-card px-1.5 py-0.5 text-[10px] font-medium text-foreground/80"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-surface/60 p-3">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted">
                        Deliverable
                      </p>
                      <p className="text-[11px] text-foreground/80">
                        {stage.deliverable}
                      </p>
                    </div>
                  </div>

                  {/* Nav buttons */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={prevStage}
                      disabled={activeStage === 0}
                      className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground disabled:opacity-40"
                    >
                      ← Trước
                    </button>
                    <span className="text-[11px] text-muted">
                      {activeStage + 1} / {STAGES.length}
                    </span>
                    <button
                      type="button"
                      onClick={nextStage}
                      disabled={activeStage === STAGES.length - 1}
                      className="rounded-lg border border-accent bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent hover:text-white disabled:opacity-40"
                    >
                      Tiếp →
                    </button>
                  </div>
                </motion.div>

                {/* ── GANTT CHART ── */}
                <div className="rounded-xl border border-border bg-surface/60 p-4">
                  <p className="mb-3 text-xs font-bold text-foreground">
                    📅 Gantt chart — timeline 16 tuần ước tính
                  </p>
                  <div className="space-y-1.5">
                    {/* Week markers */}
                    <div className="flex items-center gap-2 pl-[140px]">
                      <div className="relative flex-1 h-5">
                        {Array.from({ length: TOTAL_WEEKS + 1 }).map((_, w) => (
                          <span
                            key={w}
                            className="absolute top-0 text-[9px] text-muted -translate-x-1/2"
                            style={{ left: `${(w / TOTAL_WEEKS) * 100}%` }}
                          >
                            W{w}
                          </span>
                        ))}
                      </div>
                    </div>
                    {STAGES.map((s, idx) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setActiveStage(idx)}
                        className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left transition-colors ${
                          activeStage === idx
                            ? "bg-card"
                            : "hover:bg-card/60"
                        }`}
                      >
                        <div className="flex w-[140px] shrink-0 items-center gap-1.5">
                          <span className="text-xs">{s.icon}</span>
                          <span className="truncate text-[10px] font-medium text-foreground">
                            {s.name}
                          </span>
                        </div>
                        <div className="relative flex-1 h-5 rounded bg-surface/40">
                          <div
                            className="absolute top-0.5 bottom-0.5 rounded shadow-sm transition-all"
                            style={{
                              left: `${(s.weekStart / TOTAL_WEEKS) * 100}%`,
                              width: `${
                                ((s.weekEnd - s.weekStart) / TOTAL_WEEKS) * 100
                              }%`,
                              backgroundColor: s.color,
                              opacity: activeStage === idx ? 1 : 0.55,
                            }}
                          />
                          <span
                            className="absolute inset-y-0 flex items-center text-[9px] font-bold text-white drop-shadow"
                            style={{
                              left: `${
                                ((s.weekStart + (s.weekEnd - s.weekStart) / 2) /
                                  TOTAL_WEEKS) *
                                100
                              }%`,
                              transform: "translateX(-50%)",
                            }}
                          >
                            {s.percent}%
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-[10px] leading-relaxed text-muted">
                    💡 Các giai đoạn có overlap — EDA song song với data
                    collection đợt sau; feature engineering và training
                    thường lặp vòng 3-5 lần. Timeline trên là ước lượng cho
                    dự án ML quy mô vừa (1 engineer × 4 tháng).
                  </p>
                </div>

                {/* ── DISTRIBUTION OF EFFORT ── */}
                <div className="rounded-xl border border-dashed border-border bg-surface/40 p-4">
                  <p className="mb-2 text-xs font-bold text-foreground">
                    💼 Phân bố effort thực tế (theo khảo sát Anaconda / Kaggle)
                  </p>
                  <div className="flex h-6 w-full overflow-hidden rounded-lg">
                    {STAGES.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-center text-[9px] font-bold text-white transition-all"
                        style={{
                          width: `${s.percent}%`,
                          backgroundColor: s.color,
                        }}
                        title={`${s.name}: ${s.percent}%`}
                      >
                        {s.percent >= 10 ? `${s.percent}%` : ""}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
                    {STAGES.map((s) => (
                      <div key={s.id} className="flex items-center gap-1">
                        <span
                          className="inline-block h-2 w-2 rounded-sm"
                          style={{ backgroundColor: s.color }}
                        />
                        <span className="text-muted">{s.name}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[10px] leading-relaxed text-muted">
                    🔎 Thấy gì? <strong>Data work</strong> (collection +
                    EDA + feature engineering) chiếm ~55% effort.
                    &ldquo;Training&rdquo; chỉ 15%. Monitoring là nhỏ nhất
                    theo tuần nhưng kéo dài mãi mãi — nên nó là dự án con
                    riêng.
                  </p>
                </div>
              </div>
            </VisualizationSection>
          </LessonSection>

          {/* ─────────── BƯỚC 3 — AHA MOMENT ─────────── */}
          <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
            <AhaMoment>
              <p>
                <strong>ML không phải là model — ML là hệ thống.</strong> Mọi
                người nghĩ ML engineer ngồi chọn thuật toán cả ngày. Thực tế:{" "}
                <strong>80% thời gian là data work</strong> (collection +
                cleaning + feature engineering), chỉ{" "}
                <strong>10-15% là training</strong>, và{" "}
                <strong>phần còn lại là deploy + monitor</strong>. Dữ liệu tốt
                với model đơn giản luôn thắng dữ liệu tệ với model phức tạp!
              </p>
            </AhaMoment>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Callout variant="insight" title="Quy tắc 80/20 trong ML">
                80% kết quả đến từ 20% đầu tư đúng chỗ. 20% đó thường là
                feature engineering + hiểu data. Deep learning fancy chỉ
                giúp 5-10% cuối cùng — và chỉ khi nền tảng đã vững.
              </Callout>
              <Callout variant="tip" title="Iterate, đừng tuyến tính">
                Pipeline 8 bước KHÔNG waterfall. EDA phát hiện vấn đề →
                quay lại data collection. Training phát hiện leakage →
                quay lại feature engineering. Kỳ vọng lặp mỗi giai đoạn
                3-5 lần.
              </Callout>
            </div>
          </LessonSection>

          {/* ─────────── BƯỚC 4 — THÁCH THỨC ─────────── */}
          <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thách thức">
            <InlineChallenge
              question="Sau khi train model dự đoán giá nhà TP.HCM, bạn đạt R² = 0.98 trên train nhưng chỉ 0.52 trên test. Đây là vấn đề gì, và nên làm gì?"
              options={[
                "R² = 0.98 là tốt — cứ deploy dùng điểm train",
                "Overfitting kinh điển — model thuộc lòng train set. Cần regularization (Ridge/Lasso), giảm độ phức tạp, thêm data, hoặc cross-validation",
                "Tập test quá nhỏ — tăng test_size lên 0.5",
                "Đây là kết quả bình thường",
              ]}
              correct={1}
              explanation="Gap lớn giữa train và test là dấu hiệu overfitting kinh điển. Model memorize noise của train set. Giải pháp: (1) regularization L1/L2 cho linear, (2) giảm max_depth cho tree, (3) thu thập thêm data, (4) cross-validation để phát hiện sớm. Tuyệt đối không 'thay metric' để che giấu vấn đề."
            />

            <div className="mt-5">
              <InlineChallenge
                question="Model deploy 2 tháng: precision tuần đầu 0.88, giảm dần còn 0.62 tuần thứ 8. Stakeholder panic. Phản ứng của bạn?"
                options={[
                  "Roll back ngay không cần điều tra",
                  "Retrain với data mới — accuracy sẽ tự phục hồi",
                  "Chạy drift detection (PSI / KS test) so sánh input distribution production vs training. Nếu drift → retrain + root cause analysis trước khi deploy lại",
                  "Không làm gì — ML model phải chấp nhận suy giảm",
                ]}
                correct={2}
                explanation="Đây là dấu hiệu data drift hoặc concept drift. Quy trình đúng: (1) drift detection để xác định cột nào thay đổi, (2) root cause (season? policy change? adversarial?), (3) retrain với data mới + giữ model cũ làm champion, (4) canary rollout model mới. Monitoring stage tồn tại chính vì lý do này."
              />
            </div>
          </LessonSection>

          {/* ─────────── BƯỚC 5 — EXPLANATION ─────────── */}
          <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
            <ExplanationSection>
              <p>
                <strong>Dự án ML từ A đến Z</strong> là quy trình có hệ thống
                biến câu hỏi kinh doanh thành hệ thống production hoạt động
                lâu dài. Khác với việc học ML qua notebook 50 dòng,{" "}
                <strong>ML thực chiến là engineering</strong> — gồm data
                engineering, ML research, DevOps, monitoring, và business
                alignment.
              </p>

              <p>
                <strong>Định nghĩa chính thức:</strong>{" "}
                End-to-end ML project = vòng đời (lifecycle) từ problem
                framing → data collection → feature engineering → model
                training → evaluation → deployment → monitoring → retrain,
                tạo thành vòng lặp liên tục thay vì chuỗi tuyến tính.
              </p>

              <LaTeX block>
                {"\\text{ML Lifecycle} = \\{ \\text{Framing} \\to \\text{Data} \\to \\text{Features} \\to \\text{Train} \\to \\text{Eval} \\to \\text{Deploy} \\to \\text{Monitor} \\} \\circlearrowleft"}
              </LaTeX>

              <p>
                Ký hiệu vòng tròn nhắc: vòng đời không kết thúc. Mỗi lần
                monitoring phát hiện drift → retrain → deploy lại. Một model
                sống trung bình 3-12 tháng trước khi cần retrain lớn.
              </p>

              <LaTeX block>
                {"R^2 = 1 - \\frac{\\sum_i (y_i - \\hat{y}_i)^2}{\\sum_i (y_i - \\bar{y})^2} \\quad ; \\quad \\text{MAE} = \\frac{1}{n} \\sum_i |y_i - \\hat{y}_i|"}
              </LaTeX>

              <p>
                Đây là 2 metric quen thuộc cho regression (vd dự đoán giá
                nhà). R² càng gần 1 càng tốt; MAE cùng đơn vị với y nên dễ
                giải thích business (&ldquo;sai trung bình 500 triệu&rdquo;).
              </p>

              <Callout variant="tip" title="Quy tắc #1: Problem framing trước khi code">
                Dành ít nhất 1 ngày trao đổi stakeholder. Thay vì code 1
                tuần rồi phát hiện sai metric, 1 ngày framing tiết kiệm 1
                tháng làm lại.
              </Callout>

              <Callout variant="info" title="Quy tắc #2: EDA bắt buộc 30+ phút">
                Không train khi chưa xem phân phối target, missing values,
                outlier. &ldquo;Nhìn dữ liệu trước khi cho máy học&rdquo; —
                câu thần chú. Anscombe&apos;s quartet: 4 dataset cùng mean,
                std, correlation — nhưng biểu đồ khác nhau hoàn toàn.
              </Callout>

              <Callout variant="warning" title="Cảnh báo: Data leakage">
                Lỗi nguy hiểm nhất. Fit scaler/imputer trên toàn bộ data →
                test set &ldquo;nhìn&rdquo; vào train → metric ảo cao. Luôn
                fit trên train, transform trên test. Dùng{" "}
                <code>sklearn.pipeline.Pipeline</code> để tránh tự làm sai.
              </Callout>

              <Callout variant="insight" title="Quy tắc #3: Baseline trước, fancy sau">
                Luôn có baseline đơn giản (LogReg, DummyClassifier, heuristic)
                để so sánh. Không baseline thì không biết model của bạn có
                giá trị hay chỉ là may mắn. Nhiều dự án LightGBM không vượt
                nổi 1 SQL query thông minh.
              </Callout>

              <CodeBlock
                language="python"
                title="Pipeline hoàn chỉnh — từ CSV đến model đã tuned"
              >
                {`import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, r2_score

# ── 1. LOAD ──
df = pd.read_csv("houses_hcmc.csv")
print(df.shape, df.dtypes)
print(df.describe(include="all"))
print("Missing:\\n", df.isnull().sum())

# ── 2. SPLIT TRƯỚC MỌI THỨ ──
X = df.drop(columns=["gia"])
y = df["gia"]
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# ── 3. PIPELINE: impute → scale/encode → model ──
numeric_cols = ["dien_tich", "so_phong", "so_tang"]
cat_cols = ["quan", "loai_nha"]

numeric_pipe = Pipeline([
    ("impute", SimpleImputer(strategy="median")),
    ("scale", StandardScaler()),
])
cat_pipe = Pipeline([
    ("impute", SimpleImputer(strategy="most_frequent")),
    ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
])
preprocess = ColumnTransformer([
    ("num", numeric_pipe, numeric_cols),
    ("cat", cat_pipe, cat_cols),
])

model = Pipeline([
    ("pre", preprocess),
    ("reg", RandomForestRegressor(n_estimators=200, random_state=42, n_jobs=-1)),
])

# ── 4. CROSS-VALIDATE ──
cv_scores = cross_val_score(
    model, X_train, y_train, cv=5, scoring="neg_mean_absolute_error", n_jobs=-1
)
print(f"CV MAE = {-cv_scores.mean():.3f} ± {cv_scores.std():.3f}")

# ── 5. FIT + TEST ──
model.fit(X_train, y_train)
y_pred = model.predict(X_test)
print(f"Test MAE = {mean_absolute_error(y_test, y_pred):.3f}")
print(f"Test R²  = {r2_score(y_test, y_pred):.3f}")`}
              </CodeBlock>

              <CodeBlock
                language="python"
                title="Experiment tracking với MLflow — reproducibility bắt buộc"
              >
                {`import mlflow
import mlflow.sklearn
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, r2_score

mlflow.set_experiment("house-price-hcmc")

models = {
    "rf_200":  RandomForestRegressor(n_estimators=200, random_state=42),
    "rf_500":  RandomForestRegressor(n_estimators=500, max_depth=12, random_state=42),
    "gb_300":  GradientBoostingRegressor(n_estimators=300, learning_rate=0.05, random_state=42),
}

for name, m in models.items():
    with mlflow.start_run(run_name=name):
        m.fit(X_train, y_train)
        pred = m.predict(X_test)
        mae = mean_absolute_error(y_test, pred)
        r2  = r2_score(y_test, pred)

        # log params + metrics
        mlflow.log_params(m.get_params())
        mlflow.log_metric("mae", mae)
        mlflow.log_metric("r2", r2)
        mlflow.sklearn.log_model(m, "model")
        print(f"{name}: MAE={mae:.2f}, R²={r2:.3f}")

# Sau đó: mlflow ui → so sánh trực quan các run
# Reproducibility: mỗi run có git commit, params, artifacts, metrics đầy đủ.`}
              </CodeBlock>

              <CollapsibleDetail title="Chi tiết — Stratified split cho classification imbalanced">
                <p className="text-sm text-muted leading-relaxed">
                  Với dataset imbalanced (vd 99% negative), train_test_split
                  ngẫu nhiên có thể dẫn đến train/test có tỉ lệ class khác
                  nhau → metric không phản ánh thực tế. Dùng{" "}
                  <code>stratify=y</code> để giữ tỉ lệ class.
                </p>
                <pre className="mt-2 overflow-x-auto rounded bg-surface p-2 text-[11px] text-foreground/90">
{`X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)`}
                </pre>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  Tương tự, khi cross-validation hãy dùng{" "}
                  <code>StratifiedKFold</code> thay <code>KFold</code>. Với
                  time-series dùng <code>TimeSeriesSplit</code> — không bao
                  giờ ngẫu nhiên hóa dữ liệu thời gian vì sẽ leak tương lai.
                </p>
              </CollapsibleDetail>

              <CollapsibleDetail title="Chi tiết — Chọn metric theo business context">
                <p className="text-sm text-muted leading-relaxed">
                  Metric không phải cố định theo ML task, mà theo business:
                </p>
                <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-muted">
                  <li>
                    <strong>Fraud detection</strong> (1% positive): dùng{" "}
                    <strong>PR-AUC</strong> + <strong>recall@fixed
                    precision</strong> (vd recall khi precision ≥ 95%). ROC-AUC
                    đánh lừa với imbalanced.
                  </li>
                  <li>
                    <strong>Medical diagnosis</strong>: ưu tiên{" "}
                    <strong>recall</strong> (không bỏ sót bệnh nhân) —
                    precision thấp chấp nhận được, bỏ sót không.
                  </li>
                  <li>
                    <strong>Spam filter</strong>: ưu tiên{" "}
                    <strong>precision</strong> — thà bỏ lọt spam còn hơn
                    xoá email thật.
                  </li>
                  <li>
                    <strong>Recommendation</strong>: dùng{" "}
                    <strong>NDCG@k</strong>, <strong>MAP</strong>,{" "}
                    <strong>hit rate</strong>. Accuracy vô nghĩa.
                  </li>
                  <li>
                    <strong>Forecasting</strong>: MAPE, sMAPE, MASE cho so
                    sánh giữa scale khác nhau; MAE khi chỉ 1 target.
                  </li>
                </ul>
              </CollapsibleDetail>

              <p>
                <strong>Ứng dụng thực tế:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>Định giá bất động sản:</strong> pipeline 8 bước
                  trên áp dụng trực tiếp. Target = giá, metric = MAE (triệu
                  VND). Deploy thành API cho app tư vấn.
                </li>
                <li>
                  <strong>Churn prediction:</strong> target = churn trong 30
                  ngày (binary). Metric = PR-AUC + recall@precision=0.8.
                  Deploy thành batch job chạy hàng đêm.
                </li>
                <li>
                  <strong>Demand forecasting:</strong> target = doanh số 7
                  ngày tới. Metric = MAPE. TimeSeriesSplit CV bắt buộc.
                  Deploy thành scheduled job.
                </li>
                <li>
                  <strong>Recommendation:</strong> target = user-item score.
                  Metric = NDCG@10. Retraining tuần / ngày. Serve qua Redis.
                </li>
                <li>
                  <strong>Fraud detection:</strong> target = giao dịch gian
                  lận. Metric = recall @ precision cao. Real-time API với
                  p99 &lt; 100ms.
                </li>
              </ul>

              <p className="mt-4">
                <strong>Pitfalls tổng hợp (anti-pattern kinh điển):</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>Không baseline:</strong> LightGBM 0.82 AUC — tốt
                  hay xấu? Không biết nếu không so với baseline.
                </li>
                <li>
                  <strong>Data leakage:</strong> fit scaler trên toàn data,
                  target encoding không CV, features chỉ có sau khi target
                  xảy ra.
                </li>
                <li>
                  <strong>Metric ảo:</strong> accuracy cho imbalanced, R²
                  cho outlier-heavy regression.
                </li>
                <li>
                  <strong>Train/serve skew:</strong> transforms pandas offline,
                  reimplement SQL online → sai lệch nhẹ → prediction lệch
                  hẳn.
                </li>
                <li>
                  <strong>Không version:</strong> không git commit, không
                  DVC, không MLflow → 6 tháng sau mù mờ.
                </li>
                <li>
                  <strong>Deploy xong rồi quên:</strong> không monitoring,
                  không drift detection, không alerting. Model &ldquo;thối rữa
                  thầm lặng&rdquo;.
                </li>
              </ul>

              <p className="mt-4">
                <strong>Tài nguyên liên quan:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <TopicLink slug="data-preprocessing">
                    Tiền xử lý dữ liệu
                  </TopicLink>{" "}
                  — missing values, scaling, encoding chi tiết.
                </li>
                <li>
                  <TopicLink slug="feature-engineering">
                    Feature Engineering
                  </TopicLink>{" "}
                  — kỹ thuật tạo và chọn lọc đặc trưng.
                </li>
                <li>
                  <TopicLink slug="model-evaluation-selection">
                    Đánh giá &amp; Chọn mô hình
                  </TopicLink>{" "}
                  — MAE, R², cross-validation, model selection.
                </li>
                <li>
                  <TopicLink slug="python-for-ml">Python cho ML</TopicLink>{" "}
                  — pandas, sklearn, matplotlib nền tảng.
                </li>
              </ul>
            </ExplanationSection>
          </LessonSection>

          {/* ─────────── BƯỚC 6 — KIỂM TRA NHANH ─────────── */}
          <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Kiểm tra nhanh">
            <InlineChallenge
              question="Dự án 2 tháng, 1 engineer, dự đoán giá nhà. Nếu chỉ được phân bổ 4 tuần cho 1 giai đoạn, bạn chọn?"
              options={[
                "Training — vì đây là 'ML thực sự'",
                "Deployment — để có thể chạy production",
                "Feature engineering + EDA — đây là đòn bẩy lớn nhất cho quality và thường quyết định thành bại",
                "Monitoring — vì model sẽ drift",
              ]}
              correct={2}
              explanation="Feature engineering + EDA thường là đòn bẩy lớn nhất. LightGBM mặc định + feature tốt thường vượt LightGBM tune kỹ + feature cẩu thả. Nghiên cứu Kaggle: 60-70% top solution focus vào feature engineering chứ không phải model exotic."
            />
          </LessonSection>

          {/* ─────────── BƯỚC 7 — TÓM TẮT ─────────── */}
          <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
            <MiniSummary
              points={[
                "Pipeline ML gồm 8 giai đoạn: Framing → Data → EDA → Features → Train → Eval → Deploy → Monitor — vòng lặp, không tuyến tính.",
                "Problem framing đầu tiên: target, metric, baseline phải rõ trước khi code. 1 ngày framing tiết kiệm 1 tháng làm lại.",
                "EDA bắt buộc 30+ phút trước mọi training — 'nhìn dữ liệu trước khi cho máy học' là câu thần chú.",
                "Data work (collection + EDA + features) chiếm ~55% effort; training chỉ 10-15%. Feature engineering thường hơn đổi thuật toán.",
                "Luôn split train/test TRƯỚC khi chạm data — dùng sklearn Pipeline để tránh data leakage tự động.",
                "Deploy xong chưa xong — monitoring + drift detection + retrain pipeline mới là đích đến. Model là sản phẩm sống.",
              ]}
            />
          </LessonSection>

          {/* ─────────── BƯỚC 8 — QUIZ ─────────── */}
          <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Quiz">
            <p className="mb-3 text-sm text-muted leading-relaxed">
              8 câu hỏi bao phủ toàn bộ 8 giai đoạn pipeline từ framing đến
              monitoring. Trả lời để chốt kiến thức.
            </p>
            <QuizSection questions={quizQuestions} />
          </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
