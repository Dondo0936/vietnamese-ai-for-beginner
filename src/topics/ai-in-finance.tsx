"use client";
import { useMemo } from "react";
import { PredictionGate, LessonSection, AhaMoment, InlineChallenge, MiniSummary, Callout, CodeBlock, LaTeX } from "@/components/interactive";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = { slug: "ai-in-finance", title: "AI in Finance", titleVi: "AI trong Tai chinh", description: "Ung dung AI trong phat hien gian lan, phan tich rui ro va giao dich tu dong", category: "applied-ai", tags: ["fraud-detection", "risk", "trading"], difficulty: "beginner", relatedSlugs: ["decision-trees", "gradient-boosting", "sentiment-analysis"], vizType: "interactive" };

const TOTAL_STEPS = 7;
export default function AIInFinanceTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(() => [
    { question: "Phat hien gian lan the tin dung dung AI kieu nao?", options: ["Rule-based: neu > 10 trieu thi block", "ML model hoc patterns giao dich binh thuong cua MOI user. Giao dich bat thuong (khac pattern) → flag. XGBoost + real-time scoring", "AI tu dong block moi giao dich lon"], correct: 1, explanation: "Moi user co 'profile' rieng: thuong mua gi, o dau, gio nao, bao nhieu. Giao dich lech khoi profile → anomaly score cao → flag. VD: ban thuong mua 200K o Ha Noi, dot nhien co giao dich 50 trieu o Nigeria → flag! Vietcombank, Techcombank deu dung." },
    { question: "Credit scoring (cham diem tin dung) dung AI co van de gi ve fairness?", options: ["Khong co van de", "Model co the hoc BIAS tu data lich su: nhom nao it duoc vay truoc → model danh gia thap → tiep tuc it duoc vay (feedback loop)", "AI luon cong bang hon nguoi"], correct: 1, explanation: "Data lich su: phu nu/dan toc thieu so it duoc vay (bias xa hoi) → model hoc bias nay → score thap cho nhom nay → it duoc vay → confirm bias (vicious cycle). Can: fairness constraints, bias auditing, protected attributes, explainability." },
    { question: "Algorithmic trading co the gay 'flash crash'. Vi sao?", options: ["GPU qua nhanh", "Nhieu trading bots phan ung CUNG LUC voi tin hieu → ban dong loat → gia giam → bots ban them → cascade", "Loi phan cung"], correct: 1, explanation: "Flash Crash 2010: Dow giam 1000 diem trong 5 phut roi phuc hoi. Ly do: 1 bot ban lon → nhieu bots thay gia giam → ban theo → cascade. AI trading can: circuit breakers, position limits, diversity trong strategies." },
  ], []);

  return (
    <><LessonSection step={1} totalSteps={TOTAL_STEPS} label="Du doan">
      <PredictionGate question="Ngan hang Techcombank xu ly 10 trieu giao dich/ngay. 0.1% la gian lan (10K). Can phat hien real-time (<100ms). Con nguoi khong the. Giai phap?" options={["Thue 10.000 nhan vien kiem tra", "ML model scoring real-time: moi giao dich duoc cham diem anomaly trong 10ms, flag neu score cao", "Block tat ca giao dich quoc te"]} correct={1} explanation="AI fraud detection: moi giao dich → extract features (so tien, dia diem, thoi gian, merchant) → ML model (XGBoost/neural network) → anomaly score trong 10ms. Score > threshold → block/OTP. Techcombank, VPBank, Momo deu dung AI nhu vay!">

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Kham pha"><AhaMoment><p>AI trong tai chinh la <strong>cuoc dua vu trang</strong>: ngan hang dung AI phat hien gian lan, ke gian dung AI tao gian lan. 4 ung dung chinh: <strong>Fraud detection</strong>{" "}(real-time), <strong>Credit scoring</strong>{" "}(cho vay), <strong>Algorithmic trading</strong>{" "}(giao dich tu dong), <strong>Risk management</strong>{" "}(danh gia rui ro). VN: Techcombank, VPBank, Momo deu heavy AI users.</p></AhaMoment></LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoanh khac Aha"><InlineChallenge question="Fraud detection model: precision 99% (chi 1% false alarm), recall 80% (bat 80% fraud). 10K fraud/ngay. Bao nhieu fraud vuot qua?" options={["100", "2000 — recall 80% nghia la 20% fraud khong bi bat = 2000 giao dich gian lan/ngay!", "0"]} correct={1} explanation="Recall 80% = 20% fraud lọt = 2000/ngay x $500 trung binh = $1M mat/ngay! Tang recall len 95% = chi 500 lọt = $250K. Trade-off: tang recall → tang false alarm → nhieu user bi block nham. Can tim balance dua tren cost: cost(miss fraud) >> cost(false alarm)." /></LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thu thach"><ExplanationSection>
        <p><strong>AI in Finance</strong>{" "}ung dung ML cho fraud detection, credit scoring, trading, risk management.</p>
        <LaTeX block>{"\\text{Expected Loss} = P(\\text{fraud}) \\times \\text{Amount} \\times (1 - \\text{Recall})"}</LaTeX>
        <Callout variant="warning" title="Fairness va Explainability">Regulatory (Basel, EU AI Act) yeu cau: (1) Model GIAI THICH DUOC tai sao tu choi cho vay, (2) Khong discriminate theo gioi tinh/dan toc, (3) Regular bias auditing. SHAP values va LIME giup giai thich model decisions.</Callout>
        <CodeBlock language="python" title="Fraud detection voi XGBoost">{`import xgboost as xgb
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

# SHAP: giai thich tai sao bi flag
import shap
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(flagged_transaction)
# "Bi flag vi: amount bat thuong (0.4), dia diem moi (0.3)"`}</CodeBlock>
      </ExplanationSection></LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Tom tat"><MiniSummary points={["4 ung dung: Fraud detection (real-time), Credit scoring, Algorithmic trading, Risk management.", "Fraud detection: ML scoring moi giao dich trong 10ms. XGBoost + real-time features.", "Credit scoring can fairness: tranh bias tu data lich su (feedback loop). Can explainability.", "Algorithmic trading: AI trading 60-70% volume US. Risk: flash crash khi bots phan ung dong loat.", "VN: Techcombank, VPBank, Momo dung AI fraud detection. FE Credit dung AI credit scoring."]} /></LessonSection>
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Kiem tra"><QuizSection questions={quizQuestions} /></LessonSection>
      </PredictionGate></LessonSection>
    </>
  );
}
