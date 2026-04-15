"use client";
import { useMemo } from "react";
import { PredictionGate, LessonSection, AhaMoment, InlineChallenge, MiniSummary, Callout, CodeBlock, LaTeX, TopicLink } from "@/components/interactive";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = { slug: "ai-in-finance", title: "AI in Finance", titleVi: "AI trong Tài chính", description: "Ứng dụng AI trong phát hiện gian lận, phân tích rủi ro và giao dịch tự động", category: "applied-ai", tags: ["fraud-detection", "risk", "trading"], difficulty: "beginner", relatedSlugs: ["decision-trees", "gradient-boosting", "sentiment-analysis"], vizType: "interactive", tocSections: [{ id: "explanation", labelVi: "Giải thích" }] };

const TOTAL_STEPS = 7;
export default function AIInFinanceTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(() => [
    { question: "Phát hiện gian lận thẻ tín dụng dùng AI kiểu nào?", options: ["Rule-based: nếu > 10 triệu thì block", "ML model học patterns giao dịch bình thường của MỖI user. Giao dịch bất thường (khác pattern) → flag. XGBoost + real-time scoring", "AI tự động block mọi giao dịch lớn"], correct: 1, explanation: "Mỗi user có 'profile' riêng: thường mua gì, ở đâu, giờ nào, bao nhiêu. Giao dịch lệch khỏi profile → anomaly score cao → flag. VD: bạn thường mua 200K ở Hà Nội, đột nhiên có giao dịch 50 triệu ở Nigeria → flag! Vietcombank, Techcombank đều dùng." },
    { question: "Credit scoring (chấm điểm tín dụng) dùng AI có vấn đề gì về fairness?", options: ["Không có vấn đề", "Model có thể học BIAS từ data lịch sử: nhóm nào ít được vay trước → model đánh giá thấp → tiếp tục ít được vay (feedback loop)", "AI luôn công bằng hơn người"], correct: 1, explanation: "Data lịch sử: phụ nữ/dân tộc thiểu số ít được vay (bias xã hội) → model học bias này → score thấp cho nhóm này → ít được vay → confirm bias (vicious cycle). Cần: fairness constraints, bias auditing, protected attributes, explainability." },
    { question: "Algorithmic trading có thể gây 'flash crash'. Vì sao?", options: ["GPU quá nhanh", "Nhiều trading bots phản ứng CÙNG LÚC với tín hiệu → bán đồng loạt → giá giảm → bots bán thêm → cascade", "Lỗi phần cứng"], correct: 1, explanation: "Flash Crash 2010: Dow giảm 1000 điểm trong 5 phút rồi phục hồi. Lý do: 1 bot bán lớn → nhiều bots thấy giá giảm → bán theo → cascade. AI trading cần: circuit breakers, position limits, diversity trong strategies." },
    {
      type: "fill-blank",
      question: "Hai ứng dụng AI phổ biến nhất trong ngân hàng là {blank} để chặn giao dịch bất thường và {blank} để quyết định hạn mức cho vay.",
      blanks: [
        { answer: "fraud detection", accept: ["phát hiện gian lận", "chống gian lận", "anti-fraud"] },
        { answer: "credit scoring", accept: ["chấm điểm tín dụng", "chấm điểm tín nhiệm", "tín dụng"] },
      ],
      explanation: "Fraud detection: ML model chấm điểm anomaly real-time (<100ms) cho từng giao dịch, flag nếu lệch pattern. Credit scoring: ML đánh giá rủi ro tín dụng dựa trên lịch sử giao dịch, thu nhập, demographic — cần fairness audit tránh bias.",
    },
  ], []);

  return (
    <><LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
      <PredictionGate question="Ngân hàng Techcombank xử lý 10 triệu giao dịch/ngày. 0.1% là gian lận (10K). Cần phát hiện real-time (<100ms). Con người không thể. Giải pháp?" options={["Thuê 10.000 nhân viên kiểm tra", "ML model scoring real-time: mỗi giao dịch được chấm điểm anomaly trong 10ms, flag nếu score cao", "Block tất cả giao dịch quốc tế"]} correct={1} explanation="AI fraud detection: mỗi giao dịch → extract features (số tiền, địa điểm, thời gian, merchant) → ML model (XGBoost/neural network) → anomaly score trong 10ms. Score > threshold → block/OTP. Techcombank, VPBank, Momo đều dùng AI như vậy!">

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá"><AhaMoment><p>AI trong tài chính là <strong>cuộc đua vũ trang</strong>: ngân hàng dùng AI phát hiện gian lận, kẻ gian dùng AI tạo gian lận. 4 ứng dụng chính: <strong>Fraud detection</strong>{" "}(real-time), <strong>Credit scoring</strong>{" "}(cho vay), <strong>Algorithmic trading</strong>{" "}(giao dịch tự động), <strong>Risk management</strong>{" "}(đánh giá rủi ro). VN: Techcombank, VPBank, Momo đều heavy AI users.</p></AhaMoment></LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha"><InlineChallenge question="Fraud detection model: precision 99% (chỉ 1% false alarm), recall 80% (bắt 80% fraud). 10K fraud/ngày. Bao nhiêu fraud vượt qua?" options={["100", "2000 — recall 80% nghĩa là 20% fraud không bị bắt = 2000 giao dịch gian lận/ngày!", "0"]} correct={1} explanation="Recall 80% = 20% fraud lọt = 2000/ngày x $500 trung bình = $1M mất/ngày! Tăng recall lên 95% = chỉ 500 lọt = $250K. Trade-off: tăng recall → tăng false alarm → nhiều user bị block nhầm. Cần tìm balance dựa trên cost: cost(miss fraud) >> cost(false alarm)." /></LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách"><ExplanationSection>
        <p><strong>AI in Finance</strong>{" "}ứng dụng ML cho fraud detection, credit scoring, trading, risk management. Nhiều ngân hàng còn kết hợp <TopicLink slug="sentiment-analysis">sentiment analysis</TopicLink>{" "}tin tức/mạng xã hội để dự báo thị trường, và <TopicLink slug="recommendation-systems">recommendation systems</TopicLink>{" "}để gợi ý sản phẩm tài chính phù hợp với khách hàng.</p>
        <LaTeX block>{"\\text{Expected Loss} = P(\\text{fraud}) \\times \\text{Amount} \\times (1 - \\text{Recall})"}</LaTeX>
        <Callout variant="warning" title="Fairness và Explainability">Regulatory (Basel, EU AI Act) yêu cầu: (1) Model GIẢI THÍCH ĐƯỢC tại sao từ chối cho vay, (2) Không discriminate theo giới tính/dân tộc, (3) Regular bias auditing. SHAP values và LIME giúp giải thích model decisions.</Callout>
        <CodeBlock language="python" title="Fraud detection với XGBoost">{`import xgboost as xgb
from sklearn.metrics import precision_recall_curve

# Features: amount, time, location, merchant, device...
model = xgb.XGBClassifier(
    n_estimators=500, max_depth=6, learning_rate=0.05,
    scale_pos_weight=100,  # Imbalanced: 99.9% legit
)
model.fit(X_train, y_train)

# Real-time scoring: 10ms per transaction
score = model.predict_proba(transaction_features)[0][1]
if score > 0.7: block_and_notify()
elif score > 0.3: require_otp()
else: approve()

# SHAP: giải thích tại sao bị flag
import shap
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(flagged_transaction)
# "Bị flag vì: amount bất thường (0.4), địa điểm mới (0.3)"`}</CodeBlock>
      </ExplanationSection></LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Tóm tắt"><MiniSummary points={["4 ứng dụng: Fraud detection (real-time), Credit scoring, Algorithmic trading, Risk management.", "Fraud detection: ML scoring mỗi giao dịch trong 10ms. XGBoost + real-time features.", "Credit scoring cần fairness: tránh bias từ data lịch sử (feedback loop). Cần explainability.", "Algorithmic trading: AI trading 60-70% volume US. Risk: flash crash khi bots phản ứng đồng loạt.", "VN: Techcombank, VPBank, Momo dùng AI fraud detection. FE Credit dùng AI credit scoring."]} /></LessonSection>
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Kiểm tra"><QuizSection questions={quizQuestions} /></LessonSection>
      </PredictionGate></LessonSection>
    </>
  );
}
