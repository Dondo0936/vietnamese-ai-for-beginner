"use client";

import { useState, useMemo } from "react";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, TopicLink, MatchPairs,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "model-evaluation-selection",
  title: "Model Evaluation & Selection",
  titleVi: "Đánh giá và Chọn mô hình",
  description: "Cách chọn thuật toán phù hợp cho bài toán cụ thể — flowchart quyết định, so sánh metrics.",
  category: "classic-ml",
  tags: ["evaluation", "model-selection", "metrics", "comparison"],
  difficulty: "beginner",
  relatedSlugs: ["confusion-matrix", "bias-variance", "cross-validation", "overfitting-underfitting"],
  vizType: "interactive",
};

/* ── Decision flowchart state ── */
type FlowAnswer = "yes" | "no" | null;

interface FlowNode {
  id: string;
  question?: string;
  yes?: string;
  no?: string;
  result?: string;
  resultDetail?: string;
  examples?: string[];
}

const FLOW_NODES: FlowNode[] = [
  {
    id: "labeled",
    question: "Dữ liệu có nhãn (label)?",
    yes: "predict-type",
    no: "unsupervised",
  },
  {
    id: "predict-type",
    question: "Dự đoán số liên tục hay nhóm rời rạc?",
    yes: "regression",
    no: "classification",
  },
  {
    id: "regression",
    result: "Regression",
    resultDetail: "Dự đoán giá trị số",
    examples: ["Linear Regression", "SVR", "Random Forest Regressor"],
  },
  {
    id: "classification",
    result: "Classification",
    resultDetail: "Phân loại vào nhóm",
    examples: ["Logistic Regression", "Decision Tree", "KNN", "SVM"],
  },
  {
    id: "unsupervised",
    question: "Mục tiêu là tìm nhóm hay phát hiện bất thường?",
    yes: "clustering",
    no: "anomaly",
  },
  {
    id: "clustering",
    result: "Clustering",
    resultDetail: "Nhóm dữ liệu không nhãn",
    examples: ["K-Means", "DBSCAN", "Hierarchical"],
  },
  {
    id: "anomaly",
    result: "Anomaly Detection",
    resultDetail: "Phát hiện điểm bất thường",
    examples: ["Isolation Forest", "One-Class SVM", "Autoencoder"],
  },
];

/* Yes = "số liên tục", No = "nhóm rời rạc" for predict-type */
const PREDICT_TYPE_YES_LABEL = "Số liên tục";
const PREDICT_TYPE_NO_LABEL = "Nhóm rời rạc";
/* Yes = "tìm nhóm", No = "phát hiện bất thường" for unsupervised */
const UNSUPERVISED_YES_LABEL = "Tìm nhóm";
const UNSUPERVISED_NO_LABEL = "Phát hiện bất thường";

function getYesLabel(nodeId: string): string {
  if (nodeId === "predict-type") return PREDICT_TYPE_YES_LABEL;
  if (nodeId === "unsupervised") return UNSUPERVISED_YES_LABEL;
  return "Có";
}

function getNoLabel(nodeId: string): string {
  if (nodeId === "predict-type") return PREDICT_TYPE_NO_LABEL;
  if (nodeId === "unsupervised") return UNSUPERVISED_NO_LABEL;
  return "Không";
}

const TOTAL_STEPS = 8;

/* ═══════════════ MAIN ═══════════════ */
export default function ModelEvaluationSelectionTopic() {
  const [flowAnswers, setFlowAnswers] = useState<Record<string, FlowAnswer>>({});

  /* Follow the path through the flowchart */
  const flowPath = useMemo(() => {
    const path: string[] = ["labeled"];
    let curr = "labeled";
    while (true) {
      const node = FLOW_NODES.find((n) => n.id === curr);
      if (!node || node.result) break;
      const ans = flowAnswers[curr];
      if (ans === "yes" && node.yes) { path.push(node.yes); curr = node.yes; }
      else if (ans === "no" && node.no) { path.push(node.no); curr = node.no; }
      else break;
    }
    return path;
  }, [flowAnswers]);

  const currentNodeId = flowPath[flowPath.length - 1];
  const currentNode = FLOW_NODES.find((n) => n.id === currentNodeId);

  function answer(nodeId: string, choice: FlowAnswer) {
    setFlowAnswers((prev) => {
      const next = { ...prev, [nodeId]: choice };
      /* Clear answers for nodes that come after this in the path */
      const idx = flowPath.indexOf(nodeId);
      if (idx !== -1) {
        flowPath.slice(idx + 1).forEach((id) => { delete next[id]; });
      }
      return next;
    });
  }

  function resetFlow() {
    setFlowAnswers({});
  }

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Khi nào accuracy là một metric tệ để đánh giá mô hình?",
      options: [
        "Khi dữ liệu huấn luyện quá nhỏ, ít hơn 1.000 mẫu",
        "Khi dữ liệu mất cân bằng nghiêm trọng — ví dụ 99% lớp A và 1% lớp B",
        "Khi mô hình đang chạy trên GPU thay vì CPU",
      ],
      correct: 1,
      explanation: "Với dữ liệu 99% lớp A, một model luôn predict lớp A sẽ đạt accuracy 99% nhưng hoàn toàn vô dụng vì không phát hiện được lớp B. Trong trường hợp này, F1-Score, Precision, Recall, hoặc ROC-AUC phản ánh chất lượng model chính xác hơn.",
    },
    {
      question: "Cần phát hiện gian lận thẻ tín dụng (0.1% giao dịch gian lận). Metric nào quan trọng nhất?",
      options: [
        "Accuracy — vì cần đúng nhiều nhất có thể",
        "Precision và Recall (hoặc F1-Score) — vì data mất cân bằng cực đoan và chi phí bỏ sót gian lận rất cao",
        "R² — để đo mức độ giải thích của biến",
      ],
      correct: 1,
      explanation: "Phát hiện gian lận là bài toán imbalanced classification. Accuracy sẽ bị đánh lừa. Recall cao (ít bỏ sót gian lận thật) và Precision cao (ít báo động giả) đều quan trọng — F1-Score cân bằng hai yếu tố này. MSE/R² là cho bài toán regression.",
    },
    {
      type: "fill-blank",
      question: "Khi dữ liệu mất cân bằng, nên dùng {blank} thay vì accuracy để đánh giá mô hình phân loại.",
      blanks: [{ answer: "F1-Score", accept: ["f1-score", "f1 score", "f1", "F1"] }],
      explanation: "F1-Score là trung bình điều hòa của Precision và Recall, phản ánh đúng chất lượng model trên dữ liệu mất cân bằng hơn accuracy. Ngoài ra còn có thể dùng ROC-AUC.",
    },
    {
      question: "Cross-validation giúp gì khi so sánh nhiều mô hình?",
      options: [
        "Giúp mô hình huấn luyện nhanh hơn trên GPU",
        "Đánh giá mô hình trên nhiều tập dữ liệu khác nhau để ước lượng hiệu suất thực sự, tránh overfitting vào một tập validation duy nhất",
        "Tự động tìm hyperparameter tốt nhất cho mô hình",
      ],
      correct: 1,
      explanation: "Cross-validation chia dữ liệu thành K phần, lần lượt dùng mỗi phần làm validation set. Kết quả trung bình K lần đánh giá ổn định hơn nhiều so với chỉ dùng một tập validation duy nhất — đặc biệt quan trọng khi so sánh nhiều model để chọn model tốt nhất.",
    },
    {
      question: "VinAI cần xây dựng model nhận dạng tiếng Việt (Automatic Speech Recognition). Bước đầu tiên nên làm gì?",
      options: [
        "Ngay lập tức triển khai mạng neural LSTM sâu nhất có thể",
        "Xác định metric đánh giá (Word Error Rate), baseline đơn giản trước, rồi thử nhiều kiến trúc và so sánh theo metric đó",
        "Dùng model tiếng Anh và fine-tune — vì 'No Free Lunch' nên không model nào tốt hơn",
      ],
      correct: 1,
      explanation: "Quy trình chuẩn: xác định metric phù hợp (WER cho ASR), lập baseline đơn giản để có điểm so sánh, thử nhiều kiến trúc có hệ thống, dùng cross-validation để đánh giá công bằng. 'No Free Lunch' nghĩa là không có model 'tốt nhất' chung — phải thử nghiệm trên dữ liệu và bài toán cụ thể.",
    },
  ], []);

  return (
    <>
      {/* STEP 1: HOOK — PREDICTION GATE */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn cần dự đoán giá nhà TP.HCM. Nên dùng Linear Regression, Decision Tree, hay KNN?"
          options={[
            "Linear Regression — đơn giản và phổ biến nhất",
            "Decision Tree — dễ giải thích và trực quan",
            "KNN — dựa trên những căn nhà tương tự",
            "Phụ thuộc vào dữ liệu! Cần thử và đánh giá từng model",
          ]}
          correct={3}
          explanation="Không có thuật toán nào 'tốt nhất' cho mọi tình huống. Đây chính là định lý 'No Free Lunch'. Chìa khóa là hiểu bài toán, chọn metric đúng, thử nhiều model, và so sánh có hệ thống — đó là Model Evaluation & Selection!"
        >

          {/* STEP 2: INTERACTIVE FLOWCHART */}
          <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
            <p className="mb-4 text-sm text-muted leading-relaxed">
              Trả lời từng câu hỏi bên dưới để tìm loại thuật toán phù hợp cho bài toán của bạn.
              Flowchart này là điểm khởi đầu — không phải quy tắc tuyệt đối!
            </p>

            <VisualizationSection>
              <div className="space-y-4">
                {/* Breadcrumb path */}
                {flowPath.length > 1 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
                    {flowPath.map((id, i) => {
                      const node = FLOW_NODES.find((n) => n.id === id);
                      if (!node) return null;
                      const label = node.result ?? (
                        id === "labeled" ? "Có nhãn?" :
                        id === "predict-type" ? "Số hay nhóm?" :
                        "Nhóm hay bất thường?"
                      );
                      return (
                        <span key={id} className="flex items-center gap-1.5">
                          {i > 0 && <span className="text-tertiary">→</span>}
                          <span className={
                            i === flowPath.length - 1
                              ? "font-semibold text-accent"
                              : "text-muted"
                          }>
                            {label}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Current question or result */}
                <div className="rounded-xl border border-border bg-card p-5">
                  {currentNode?.result ? (
                    /* Result card */
                    <div className="text-center space-y-3">
                      <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5">
                        <span className="text-sm font-semibold text-accent">
                          {currentNode.result}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {currentNode.resultDetail}
                      </p>
                      {currentNode.examples && (
                        <div className="flex flex-wrap justify-center gap-2">
                          {currentNode.examples.map((ex) => (
                            <span
                              key={ex}
                              className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-muted"
                            >
                              {ex}
                            </span>
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={resetFlow}
                        className="mt-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground hover:bg-surface"
                      >
                        Thử lại từ đầu
                      </button>
                    </div>
                  ) : (
                    /* Question card */
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-foreground">
                        {currentNode?.question}
                      </p>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => answer(currentNodeId, "yes")}
                          className="flex-1 rounded-xl border border-green-400/40 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-800 transition-colors hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700 dark:hover:bg-green-900/40"
                        >
                          {getYesLabel(currentNodeId)}
                        </button>
                        <button
                          type="button"
                          onClick={() => answer(currentNodeId, "no")}
                          className="flex-1 rounded-xl border border-blue-400/40 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-800 transition-colors hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-900/40"
                        >
                          {getNoLabel(currentNodeId)}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* SVG overview of full flowchart */}
                <svg viewBox="0 0 560 200" className="w-full rounded-lg border border-border bg-background p-2">
                  {/* Level 0: labeled */}
                  <rect x={200} y={10} width={160} height={32} rx={8}
                    fill={flowPath.includes("labeled") ? "#6366f1" : "#334155"}
                    fillOpacity={0.15}
                    stroke={flowPath.includes("labeled") ? "#6366f1" : "#475569"}
                    strokeWidth={flowPath.includes("labeled") ? 2 : 1}
                  />
                  <text x={280} y={30} textAnchor="middle" fontSize={11}
                    fill={flowPath.includes("labeled") ? "#818cf8" : "#94a3b8"}
                    fontWeight={600}>
                    Dữ liệu có nhãn?
                  </text>

                  {/* Lines from labeled */}
                  <line x1={230} y1={42} x2={140} y2={88} stroke={flowPath.includes("predict-type") ? "#22c55e" : "#475569"} strokeWidth={flowPath.includes("predict-type") ? 2 : 1} />
                  <text x={172} y={72} fontSize={9} fill="#22c55e" fontWeight={600}>Có</text>
                  <line x1={330} y1={42} x2={420} y2={88} stroke={flowPath.includes("unsupervised") ? "#3b82f6" : "#475569"} strokeWidth={flowPath.includes("unsupervised") ? 2 : 1} />
                  <text x={372} y={72} fontSize={9} fill="#3b82f6" fontWeight={600}>Không</text>

                  {/* Level 1 left: predict-type */}
                  <rect x={60} y={88} width={160} height={32} rx={8}
                    fill={flowPath.includes("predict-type") ? "#22c55e" : "#334155"}
                    fillOpacity={0.12}
                    stroke={flowPath.includes("predict-type") ? "#22c55e" : "#475569"}
                    strokeWidth={flowPath.includes("predict-type") ? 2 : 1}
                  />
                  <text x={140} y={108} textAnchor="middle" fontSize={10}
                    fill={flowPath.includes("predict-type") ? "#86efac" : "#94a3b8"}
                    fontWeight={600}>
                    Số hay nhóm?
                  </text>

                  {/* Level 1 right: unsupervised */}
                  <rect x={340} y={88} width={160} height={32} rx={8}
                    fill={flowPath.includes("unsupervised") ? "#3b82f6" : "#334155"}
                    fillOpacity={0.12}
                    stroke={flowPath.includes("unsupervised") ? "#3b82f6" : "#475569"}
                    strokeWidth={flowPath.includes("unsupervised") ? 2 : 1}
                  />
                  <text x={420} y={108} textAnchor="middle" fontSize={10}
                    fill={flowPath.includes("unsupervised") ? "#93c5fd" : "#94a3b8"}
                    fontWeight={600}>
                    Nhóm / Bất thường?
                  </text>

                  {/* Lines from predict-type */}
                  <line x1={110} y1={120} x2={75} y2={158}
                    stroke={flowPath.includes("regression") ? "#22c55e" : "#475569"}
                    strokeWidth={flowPath.includes("regression") ? 2 : 1} />
                  <text x={80} y={143} fontSize={8} fill="#22c55e" fontWeight={600}>Số</text>
                  <line x1={170} y1={120} x2={200} y2={158}
                    stroke={flowPath.includes("classification") ? "#f59e0b" : "#475569"}
                    strokeWidth={flowPath.includes("classification") ? 2 : 1} />
                  <text x={175} y={143} fontSize={8} fill="#f59e0b" fontWeight={600}>Nhóm</text>

                  {/* Lines from unsupervised */}
                  <line x1={390} y1={120} x2={360} y2={158}
                    stroke={flowPath.includes("clustering") ? "#22c55e" : "#475569"}
                    strokeWidth={flowPath.includes("clustering") ? 2 : 1} />
                  <text x={356} y={143} fontSize={8} fill="#22c55e" fontWeight={600}>Nhóm</text>
                  <line x1={450} y1={120} x2={480} y2={158}
                    stroke={flowPath.includes("anomaly") ? "#ef4444" : "#475569"}
                    strokeWidth={flowPath.includes("anomaly") ? 2 : 1} />
                  <text x={456} y={143} fontSize={8} fill="#ef4444" fontWeight={600}>Bất thường</text>

                  {/* Leaf: Regression */}
                  <rect x={25} y={158} width={100} height={28} rx={6}
                    fill={flowPath.includes("regression") ? "#22c55e" : "#334155"} fillOpacity={0.15}
                    stroke={flowPath.includes("regression") ? "#22c55e" : "#475569"}
                    strokeWidth={flowPath.includes("regression") ? 2 : 1} />
                  <text x={75} y={175} textAnchor="middle" fontSize={10}
                    fill={flowPath.includes("regression") ? "#86efac" : "#94a3b8"} fontWeight={700}>
                    Regression
                  </text>

                  {/* Leaf: Classification */}
                  <rect x={145} y={158} width={120} height={28} rx={6}
                    fill={flowPath.includes("classification") ? "#f59e0b" : "#334155"} fillOpacity={0.15}
                    stroke={flowPath.includes("classification") ? "#f59e0b" : "#475569"}
                    strokeWidth={flowPath.includes("classification") ? 2 : 1} />
                  <text x={205} y={175} textAnchor="middle" fontSize={10}
                    fill={flowPath.includes("classification") ? "#fbbf24" : "#94a3b8"} fontWeight={700}>
                    Classification
                  </text>

                  {/* Leaf: Clustering */}
                  <rect x={310} y={158} width={100} height={28} rx={6}
                    fill={flowPath.includes("clustering") ? "#22c55e" : "#334155"} fillOpacity={0.15}
                    stroke={flowPath.includes("clustering") ? "#22c55e" : "#475569"}
                    strokeWidth={flowPath.includes("clustering") ? 2 : 1} />
                  <text x={360} y={175} textAnchor="middle" fontSize={10}
                    fill={flowPath.includes("clustering") ? "#86efac" : "#94a3b8"} fontWeight={700}>
                    Clustering
                  </text>

                  {/* Leaf: Anomaly Detection */}
                  <rect x={430} y={158} width={120} height={28} rx={6}
                    fill={flowPath.includes("anomaly") ? "#ef4444" : "#334155"} fillOpacity={0.15}
                    stroke={flowPath.includes("anomaly") ? "#ef4444" : "#475569"}
                    strokeWidth={flowPath.includes("anomaly") ? 2 : 1} />
                  <text x={490} y={175} textAnchor="middle" fontSize={10}
                    fill={flowPath.includes("anomaly") ? "#fca5a5" : "#94a3b8"} fontWeight={700}>
                    Anomaly Detection
                  </text>
                </svg>
              </div>
            </VisualizationSection>
          </LessonSection>

          {/* STEP 3: MATCH PAIRS */}
          <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Luyện tập">
            <p className="mb-4 text-sm text-muted leading-relaxed">
              Ghép từng bài toán với loại thuật toán phù hợp.
            </p>
            <MatchPairs
              instruction="Chọn một mục ở cột A, sau đó chọn mục tương ứng ở cột B."
              pairs={[
                { left: "Dự đoán giá nhà", right: "Regression" },
                { left: "Phân loại email spam", right: "Classification" },
                { left: "Nhóm khách hàng theo hành vi", right: "Clustering" },
                { left: "Phát hiện giao dịch gian lận hiếm gặp", right: "Anomaly Detection" },
              ]}
            />
          </LessonSection>

          {/* STEP 4: INLINE CHALLENGE */}
          <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
            <InlineChallenge
              question="Model A: accuracy 95% trên 1.000 mẫu (950 bình thường, 50 bất thường). Nếu model luôn predict 'bình thường' cho mọi mẫu, accuracy là bao nhiêu?"
              options={[
                "50% — vì model không phân biệt được hai lớp",
                "95% — vì 950/1000 mẫu được predict đúng là 'bình thường'",
                "0% — vì model không thực sự học được gì",
              ]}
              correct={1}
              explanation="Đúng! Accuracy 95% nhưng model hoàn toàn vô dụng — 50 mẫu bất thường bị bỏ sót 100%. Đây chính là bẫy accuracy với imbalanced data. Trong trường hợp này, Recall, F1-Score hoặc ROC-AUC phản ánh thực chất hơn nhiều."
            />
          </LessonSection>

          {/* STEP 5: EXPLANATION */}
          <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
            <ExplanationSection>
              <p>
                <strong>Quy trình đánh giá mô hình</strong>{" "}
                gồm 4 bước cốt lõi: <em>huấn luyện (train) → dự đoán (predict) → đo lường (measure) → so sánh (compare)</em>.
                Lặp lại chu trình này với nhiều thuật toán để chọn model tốt nhất cho bài toán cụ thể.
              </p>

              <p><strong>Metrics cho Classification:</strong></p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>Accuracy:</strong>{" "}
                  tỷ lệ dự đoán đúng — dễ hiểu nhưng bị đánh lừa khi data mất cân bằng.
                  Xem chi tiết tại <TopicLink slug="confusion-matrix">Confusion Matrix</TopicLink>.
                </li>
                <li>
                  <strong>Precision:</strong>{" "}
                  trong tất cả những gì model dự đoán là dương, bao nhiêu thực sự dương?
                </li>
                <li>
                  <strong>Recall (Sensitivity):</strong>{" "}
                  trong tất cả mẫu dương thực sự, model bắt được bao nhiêu?
                </li>
                <li>
                  <strong>F1-Score:</strong>{" "}
                  trung bình điều hòa của Precision và Recall — cân bằng cả hai khi data mất cân bằng.
                </li>
              </ul>

              <p><strong>Metrics cho Regression:</strong></p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>MSE (Mean Squared Error):</strong>{" "}
                  trung bình bình phương sai số — phạt nặng sai số lớn.
                </li>
                <li>
                  <strong>MAE (Mean Absolute Error):</strong>{" "}
                  trung bình giá trị tuyệt đối sai số — robust hơn với outliers.
                </li>
                <li>
                  <strong>R² (R-squared):</strong>{" "}
                  tỷ lệ phương sai được giải thích bởi model — từ 0 đến 1, càng cao càng tốt.
                </li>
              </ul>

              <p>
                <strong>So sánh nhiều model với Cross-Validation:</strong>{" "}
                dùng{" "}
                <TopicLink slug="cross-validation">cross-validation</TopicLink>{" "}
                để đánh giá công bằng — không overfitting vào một tập validation duy nhất.
                Xem thêm{" "}
                <TopicLink slug="bias-variance">Bias-Variance Tradeoff</TopicLink>{" "}
                để hiểu tại sao cần nhiều lần đánh giá.
              </p>

              <Callout variant="info" title="No Free Lunch Theorem">
                Định lý No Free Lunch (Wolpert, 1996) phát biểu: không có thuật toán nào tốt nhất cho
                mọi bài toán. Mỗi thuật toán có giả định ngầm về cấu trúc dữ liệu. Luôn thử nhiều model
                và so sánh trên dữ liệu thực tế của bạn. Tham khảo thêm:{" "}
                <TopicLink slug="linear-regression">Linear Regression</TopicLink>,{" "}
                <TopicLink slug="decision-trees">Decision Trees</TopicLink>,{" "}
                <TopicLink slug="knn">KNN</TopicLink>.
              </Callout>

              <CodeBlock language="python" title="So sánh nhiều model với scikit-learn">
{`from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.model_selection import cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
import numpy as np

# Giả sử X, y đã được chuẩn bị
models = {
    "Logistic Regression": Pipeline([
        ("scaler", StandardScaler()),
        ("clf", LogisticRegression(random_state=42)),
    ]),
    "Decision Tree": DecisionTreeClassifier(max_depth=5, random_state=42),
    "KNN (k=5)": Pipeline([
        ("scaler", StandardScaler()),
        ("clf", KNeighborsClassifier(n_neighbors=5)),
    ]),
}

results = {}
for name, model in models.items():
    # 5-fold cross-validation — đánh giá công bằng
    scores = cross_val_score(model, X, y, cv=5, scoring="f1_weighted")
    results[name] = scores
    print(f"{name}: F1 = {scores.mean():.3f} ± {scores.std():.3f}")

# Chọn model có F1 trung bình cao nhất
best_model_name = max(results, key=lambda k: results[k].mean())
print(f"\\nModel tốt nhất: {best_model_name}")`}
              </CodeBlock>
            </ExplanationSection>
          </LessonSection>

          {/* STEP 6: AHA MOMENT */}
          <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
            <AhaMoment>
              <p>
                Không có thuật toán <strong>&quot;tốt nhất&quot;</strong>.{" "}
                Chỉ có thuật toán <strong>&quot;phù hợp nhất&quot;</strong>{" "}
                cho dữ liệu và bài toán cụ thể của bạn. Luôn thử nhiều model, đo bằng
                metric đúng, và so sánh có hệ thống — đó mới là Data Science thực thụ!
              </p>
            </AhaMoment>
          </LessonSection>

          {/* STEP 7: MINI SUMMARY */}
          <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
            <MiniSummary points={[
              "Chọn loại thuật toán dựa vào bài toán: có nhãn hay không, dự đoán số hay phân nhóm.",
              "Accuracy bị đánh lừa khi dữ liệu mất cân bằng — dùng F1-Score, Precision, Recall thay thế.",
              "Metrics regression: MSE, MAE (đo sai số), R² (đo tỷ lệ giải thích phương sai).",
              "Cross-validation đánh giá model trên nhiều tập dữ liệu — ổn định hơn một lần test đơn lẻ.",
              "No Free Lunch: không model nào tốt nhất — luôn thử nhiều thuật toán và so sánh trên dữ liệu của bạn.",
            ]} />
          </LessonSection>

          {/* STEP 8: QUIZ */}
          <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
            <QuizSection questions={quizQuestions} />
          </LessonSection>

        </PredictionGate>
      </LessonSection>
    </>
  );
}
