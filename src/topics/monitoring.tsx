"use client";

import { useState, useMemo, useCallback } from "react";
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
  slug: "monitoring",
  title: "AI Monitoring",
  titleVi: "Giám sát AI — Canh gác mô hình 24/7",
  description:
    "Theo dõi hiệu suất, phát hiện data drift và cảnh báo khi mô hình AI trong sản phẩm bắt đầu suy giảm chất lượng.",
  category: "infrastructure",
  tags: ["monitoring", "drift", "observability", "production"],
  difficulty: "advanced",
  relatedSlugs: ["mlops", "model-serving", "cost-optimization"],
  vizType: "interactive",
};

/* ── Drift simulation ── */
const WEEKS = 12;

function generateMetrics(hasDrift: boolean): { accuracy: number; latency: number; driftScore: number }[] {
  return Array.from({ length: WEEKS }, (_, i) => {
    const week = i + 1;
    if (!hasDrift) {
      return {
        accuracy: 94 + Math.random() * 2,
        latency: 110 + Math.random() * 20,
        driftScore: 0.02 + Math.random() * 0.03,
      };
    }
    /* Drift kicks in around week 6 */
    const driftFactor = week > 5 ? (week - 5) * 0.08 : 0;
    return {
      accuracy: Math.max(70, 95 - driftFactor * 12 + Math.random() * 2),
      latency: 115 + driftFactor * 80 + Math.random() * 15,
      driftScore: Math.min(0.9, 0.03 + driftFactor + Math.random() * 0.02),
    };
  });
}

const TOTAL_STEPS = 7;

export default function MonitoringTopic() {
  const [hasDrift, setHasDrift] = useState(true);
  const [metrics, setMetrics] = useState(() => generateMetrics(true));
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  const toggleDrift = useCallback((drift: boolean) => {
    setHasDrift(drift);
    setMetrics(generateMetrics(drift));
    setSelectedWeek(null);
  }, []);

  const alertWeek = useMemo(() => {
    return metrics.findIndex((m) => m.accuracy < 88 || m.driftScore > 0.3);
  }, [metrics]);

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Data drift và concept drift khác nhau thế nào?",
      options: [
        "Chúng giống nhau, chỉ khác tên gọi",
        "Data drift: phân phối input thay đổi. Concept drift: quan hệ input→output thay đổi",
        "Data drift xảy ra nhanh, concept drift xảy ra chậm",
      ],
      correct: 1,
      explanation: "Data drift: P(X) thay đổi (VD: khách hàng mới khác profile cũ). Concept drift: P(Y|X) thay đổi (VD: cùng profile nhưng hành vi mua sắm thay đổi vì COVID). Cần detect cả hai!",
    },
    {
      question: "Metric nào KHÔNG phải là dấu hiệu model degradation?",
      options: [
        "Accuracy giảm dần qua các tuần",
        "Training loss thấp hơn lần trước",
        "Prediction distribution thay đổi so với baseline",
      ],
      correct: 1,
      explanation: "Training loss thấp hơn là dấu hiệu tốt (model học tốt hơn). Còn accuracy giảm và prediction distribution shift đều là dấu hiệu model đang degradation trong production.",
    },
    {
      question: "Khi phát hiện model degradation, bước đầu tiên nên làm gì?",
      options: [
        "Retrain ngay trên data mới nhất",
        "Phân tích root cause: data drift, concept drift, hay bug kỹ thuật",
        "Rollback về model cũ và bỏ qua",
      ],
      correct: 1,
      explanation: "Retrain mù quáng có thể không giải quyết vấn đề (nếu root cause là bug). Phân tích trước: xem data distribution, feature importance, error analysis. Có thể vấn đề ở pipeline chứ không phải model.",
    },
    {
      type: "fill-blank",
      question: "Khi phân phối dữ liệu production thay đổi so với training, ta gọi là data {blank}. Để phát hiện sớm, cần theo dõi {blank} như accuracy, PSI, và latency liên tục.",
      blanks: [
        { answer: "drift", accept: ["trôi", "troi", "shift"] },
        { answer: "metric", accept: ["metrics", "chỉ số", "chi so"] },
      ],
      explanation: "Data drift là khi P(X) production khác P(X) training. Metric (chỉ số) như PSI, KL divergence, accuracy được log liên tục — alert tự động khi vượt ngưỡng để trigger retrain.",
    },
  ], []);

  return (
    <>
      {/* STEP 1: PREDICTION GATE */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Model gợi ý sản phẩm của Shopee cho accuracy 95% khi deploy tháng 1. Đến tháng 6, không ai thay đổi code gì cả, nhưng user phàn nàn gợi ý ngày càng tệ. Chuyện gì xảy ra?"
          options={[
            "GPU server bị quá tải, cần thêm phần cứng",
            "Model bị 'lão hoá' vì data thực tế thay đổi (data drift) — cần monitoring để phát hiện sớm",
            "User quá khó tính, model vẫn tốt",
          ]}
          correct={1}
          explanation="Chính xác! Model AI 'lão hoá' theo thời gian dù code không đổi. Mùa hè khác mùa đông, trend thời trang thay đổi, sản phẩm mới xuất hiện. Monitoring phát hiện sớm để retrain kịp thời — giống bảo dưỡng xe định kỳ!"
        >

      {/* STEP 2: INTERACTIVE VIZ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Toggle <strong className="text-foreground">có/không drift</strong>{" "}
          để xem accuracy và drift score thay đổi qua 12 tuần. Click vào tuần bất kỳ để xem chi tiết.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => toggleDrift(true)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  hasDrift ? "bg-red-600 text-white" : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                Có Data Drift
              </button>
              <button
                onClick={() => toggleDrift(false)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  !hasDrift ? "bg-green-600 text-white" : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                Không Drift
              </button>
            </div>

            <svg viewBox="0 0 600 240" className="w-full max-w-2xl mx-auto">
              <text x={300} y={16} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontWeight="bold">
                Accuracy &amp; Drift Score qua {WEEKS} tuần
              </text>

              {/* Y-axis labels */}
              <text x={25} y={45} fill="#94a3b8" fontSize={11}>100%</text>
              <text x={25} y={145} fill="#94a3b8" fontSize={11}>70%</text>
              <line x1={45} y1={30} x2={45} y2={170} stroke="#475569" strokeWidth={1} />
              <line x1={45} y1={170} x2={575} y2={170} stroke="#475569" strokeWidth={1} />

              {/* Alert threshold line */}
              <line x1={45} y1={93} x2={575} y2={93} stroke="#ef4444" strokeWidth={1} strokeDasharray="4,3" />
              <text x={578} y={97} fill="#ef4444" fontSize={11}>88% threshold</text>

              {/* Accuracy line */}
              {metrics.map((m, i) => {
                const x = 55 + i * 44;
                const y = 170 - ((m.accuracy - 70) / 30) * 140;
                const isAlert = m.accuracy < 88 || m.driftScore > 0.3;
                return (
                  <g key={i} onClick={() => setSelectedWeek(i)} className="cursor-pointer">
                    {i > 0 && (
                      <line
                        x1={55 + (i - 1) * 44}
                        y1={170 - ((metrics[i - 1].accuracy - 70) / 30) * 140}
                        x2={x} y2={y}
                        stroke={isAlert ? "#ef4444" : "#22c55e"} strokeWidth={2}
                      />
                    )}
                    <circle cx={x} cy={y} r={selectedWeek === i ? 6 : 4}
                      fill={isAlert ? "#ef4444" : "#22c55e"}
                      stroke={selectedWeek === i ? "white" : "none"} strokeWidth={2}
                    />
                    <text x={x} y={185} textAnchor="middle" fill="#64748b" fontSize={11}>W{i + 1}</text>
                  </g>
                );
              })}

              {/* Drift score bars */}
              {metrics.map((m, i) => {
                const x = 55 + i * 44;
                const barH = m.driftScore * 50;
                return (
                  <rect key={`d${i}`} x={x - 8} y={200 - barH} width={16} height={barH} rx={2}
                    fill={m.driftScore > 0.3 ? "#ef4444" : "#3b82f6"} opacity={0.6}
                  />
                );
              })}
              <text x={300} y={215} textAnchor="middle" fill="#94a3b8" fontSize={11}>Drift Score (thấp = ổn định)</text>

              {/* Alert marker */}
              {alertWeek >= 0 && hasDrift && (
                <text x={55 + alertWeek * 44} y={25} textAnchor="middle" fill="#ef4444" fontSize={11} fontWeight="bold">
                  ALERT
                </text>
              )}
            </svg>

            {/* Detail panel */}
            {selectedWeek !== null && (
              <div className="rounded-lg border border-border bg-card p-3 text-sm">
                <p className="font-semibold">Tuần {selectedWeek + 1}:</p>
                <p>Accuracy: <strong>{metrics[selectedWeek].accuracy.toFixed(1)}%</strong></p>
                <p>Latency: <strong>{metrics[selectedWeek].latency.toFixed(0)}ms</strong></p>
                <p>Drift Score: <strong>{metrics[selectedWeek].driftScore.toFixed(3)}</strong>
                  {metrics[selectedWeek].driftScore > 0.3 && <span className="ml-2 text-red-700 dark:text-red-400">Data drift detected!</span>}
                </p>
              </div>
            )}
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* STEP 3: AHA */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Model AI không phải &quot;deploy xong là xong&quot; — chúng <strong>lão hoá</strong>{" "}
            theo thời gian! Dữ liệu thực tế thay đổi liên tục (mùa vụ, trend, hành vi user),
            nhưng model vẫn &quot;nhớ&quot; patterns cũ. Monitoring giống <strong>bác sĩ khám định kỳ</strong>{" "}
            — phát hiện &quot;bệnh&quot; sớm trước khi model &quot;sụp đổ&quot;.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* STEP 4: CHALLENGE */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Model phân loại email spam. Accuracy trên test set = 98%. Sau 3 tháng deploy, user báo nhiều email quan trọng bị đánh spam. Ground-truth accuracy thật sự? Không biết — vì user không report email spam lọt qua. Đây gọi là gì?"
          options={[
            "Overfitting trên test set",
            "Label bias — chỉ có negative feedback (false positive), không có positive feedback (false negative)",
            "Model quá mạnh nên phân loại sai",
          ]}
          correct={1}
          explanation="Feedback loop bias! User chỉ report khi email tốt bị spam (false positive), nhưng email spam lọt qua thì không biết (false negative). Monitoring cần measure cả hai chiều — dùng sampling strategy hoặc human review random emails."
        />
      </LessonSection>

      {/* STEP 5: EXPLANATION */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>AI Monitoring</strong>{" "}
            là quá trình liên tục theo dõi model đã deploy để phát hiện sớm vấn đề về hiệu suất, chất lượng, và hành vi bất thường.
          </p>

          <p><strong>Hai loại drift chính:</strong></p>

          <p><strong>1. Data Drift</strong>{" "}— phân phối đầu vào thay đổi:</p>
          <LaTeX block>{"P_{\\text{production}}(X) \\neq P_{\\text{training}}(X)"}</LaTeX>
          <p>
            Phát hiện bằng: KL Divergence, PSI (Population Stability Index), KS Test.
          </p>

          <LaTeX block>{"\\text{PSI} = \\sum_{i=1}^{N} (p_i^{\\text{new}} - p_i^{\\text{old}}) \\ln \\frac{p_i^{\\text{new}}}{p_i^{\\text{old}}}"}</LaTeX>

          <p><strong>2. Concept Drift</strong>{" "}— quan hệ input-output thay đổi:</p>
          <LaTeX block>{"P_{\\text{production}}(Y|X) \\neq P_{\\text{training}}(Y|X)"}</LaTeX>
          <p>
            Khó phát hiện hơn vì cần ground-truth labels (thường delayed).
          </p>

          <Callout variant="warning" title="Silent Failure">
            Nguy hiểm nhất là model degradation từ từ mà không ai biết. Accuracy giảm 0.5%/tuần — sau 3 tháng giảm 6%. Không có monitoring = không biết cho đến khi user phàn nàn ồ ạt.
          </Callout>

          <p><strong>4 tầng monitoring:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Infrastructure:</strong>{" "}GPU utilization, latency, memory, error rate</li>
            <li><strong>Data Quality:</strong>{" "}Missing values, schema violations, distribution shift</li>
            <li><strong>Model Performance:</strong>{" "}Accuracy, precision, recall, prediction distribution — với LLM còn cần đo <TopicLink slug="hallucination">ảo giác (hallucination)</TopicLink>{" "}và vi phạm <TopicLink slug="guardrails">guardrails</TopicLink></li>
            <li><strong>Business Metrics:</strong>{" "}Conversion rate, user satisfaction, revenue impact</li>
          </ul>

          <CodeBlock language="python" title="Monitoring với Evidently AI">
{`from evidently import ColumnMapping
from evidently.report import Report
from evidently.metric_preset import (
    DataDriftPreset,
    TargetDriftPreset,
    DataQualityPreset,
)

# So sánh data production vs training
report = Report(metrics=[
    DataDriftPreset(),       # Phát hiện data drift
    TargetDriftPreset(),     # Phát hiện prediction drift
    DataQualityPreset(),     # Check data quality
])

report.run(
    reference_data=train_df,     # Data gốc khi training
    current_data=production_df,  # Data production tuần này
    column_mapping=ColumnMapping(
        target="prediction",
        prediction="prediction",
    ),
)

# Lấy drift score
drift_result = report.as_dict()
drift_detected = drift_result["metrics"][0]["result"]["dataset_drift"]
# True → ALERT: cần retrain!
print(f"Drift detected: {drift_detected}")`}
          </CodeBlock>

          <Callout variant="info" title="Alerting Pipeline">
            Monitoring mà không alert = vô nghĩa. Setup alert qua Slack/PagerDuty: PSI &gt; 0.25 → warning, accuracy &lt; threshold → critical. On-call engineer investigate và quyết định retrain hay rollback — khép kín vòng lặp <TopicLink slug="mlops">MLOps</TopicLink>.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* STEP 6: SUMMARY */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "Model AI 'lão hoá' dù code không đổi — data drift và concept drift làm giảm chất lượng dần.",
          "Data drift: P(X) thay đổi. Concept drift: P(Y|X) thay đổi. Phát hiện bằng PSI, KL divergence.",
          "4 tầng monitoring: Infrastructure → Data Quality → Model Performance → Business Metrics.",
          "Silent failure nguy hiểm nhất: accuracy giảm từ từ mà không ai biết cho đến khi quá muộn.",
          "Monitoring + alerting + auto-retrain = vòng lặp MLOps hoàn chỉnh, model luôn khoẻ mạnh.",
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
