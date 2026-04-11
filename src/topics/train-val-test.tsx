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
  slug: "train-val-test",
  title: "Train / Validation / Test Split",
  titleVi: "Chia du lieu — Hoc, Kiem tra, Thi that",
  description:
    "Phuong phap chia du lieu thanh ba tap rieng biet de huan luyen, dieu chinh va danh gia mo hinh mot cach khach quan.",
  category: "foundations",
  tags: ["train", "validation", "test", "split"],
  difficulty: "beginner",
  relatedSlugs: ["cross-validation", "overfitting-underfitting", "bias-variance"],
  vizType: "interactive",
};

const TOTAL_STEPS = 7;

export default function TrainValTestTopic() {
  const [trainPct, setTrainPct] = useState(70);
  const valPct = 15;
  const testPct = 100 - trainPct - valPct;

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Tai sao KHONG duoc dung test set de chon model hay tune hyperparameters?",
      options: [
        "Test set qua nho",
        "Neu dung test set de quyet dinh → model duoc 'toi uu' cho test set → khong con khach quan, danh gia gia tao",
        "Test set khong co labels",
      ],
      correct: 1,
      explanation: "Test set la 'de thi cuoi ky' — chi duoc mo 1 LAN de danh gia cuoi cung. Neu 'luyen de thi' tren test set → diem cao nhung khong phan anh nang luc that. Validation set la 'de kiem tra giua ky' — dung de tune, khong phai de danh gia cuoi.",
    },
    {
      question: "Data co 1000 mau. Chia 70/15/15. Co van de gi khong?",
      options: [
        "Khong van de gi",
        "Co the: 150 test samples it qua de danh gia dang tin cay. Can cross-validation hoac stratified split",
        "Can chia 50/25/25",
      ],
      correct: 1,
      explanation: "1000 mau la it. 150 test samples → confidence interval rong. Giai phap: (1) K-fold cross-validation (dung tat ca data cho train VÀ evaluate), (2) Stratified split (dam bao ty le classes deu), (3) Neu co the: thu thap them data.",
    },
    {
      question: "Model accuracy: Train=99%, Val=75%, Test=73%. Van de gi?",
      options: [
        "Model tot — 99% accuracy",
        "OVERFITTING: model hoc thuoc train set (99%) nhung khong generalize (75% val, 73% test). Gap 24% qua lon",
        "Test set qua kho",
      ],
      correct: 1,
      explanation: "Train-Val gap = 99-75 = 24% → overfitting nghiem trong. Model 'hoc thuoc' train set thay vi hoc patterns chung. Giai phap: regularization, dropout, tang data, giam model complexity, early stopping. Val ≈ Test (75 vs 73) cho thay val set dai dien tot.",
    },
  ], []);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Du doan">
        <PredictionGate
          question="Ban on thi dai hoc. Giao vien cho 100 de. Ban lam ca 100 de de luyen, roi dung chinh nhung de do de cham diem minh. Diem rat cao. Nhung di thi that lai truot. Tai sao?"
          options={[
            "De thi that kho hon de on",
            "Ban da 'hoc thuoc' dap an cua 100 de → diem cao gia tao. Can giu rieng vai de CHUA LAM de kiem tra nang luc that",
            "Ban khong on du",
          ]}
          correct={1}
          explanation="Dung! Giong ML: neu dung TAT CA data de train → model 'hoc thuoc' → accuracy cao tren train data nhung te tren data moi. Can giu rieng: validation set (de kiem tra giua ky) va test set (de thi cuoi ky — chi lam 1 lan)."
        >

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Kham pha">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Keo thanh truot de dieu chinh <strong className="text-foreground">ty le chia du lieu</strong>.
        </p>
        <VisualizationSection>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted">Train: {trainPct}%</label>
              <input type="range" min={50} max={85} value={trainPct} onChange={(e) => setTrainPct(parseInt(e.target.value))} className="w-full accent-accent" />
            </div>
            <svg viewBox="0 0 600 100" className="w-full max-w-2xl mx-auto">
              <rect x={20} y={20} width={560 * trainPct / 100} height={40} rx={6} fill="#3b82f6" />
              <text x={20 + 560 * trainPct / 200} y={44} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">
                Train {trainPct}%
              </text>

              <rect x={20 + 560 * trainPct / 100} y={20} width={560 * valPct / 100} height={40} rx={0} fill="#f59e0b" />
              <text x={20 + 560 * (trainPct + valPct / 2) / 100} y={44} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">
                Val {valPct}%
              </text>

              <rect x={20 + 560 * (trainPct + valPct) / 100} y={20} width={560 * testPct / 100} height={40} rx={6} fill="#22c55e" />
              <text x={20 + 560 * (trainPct + valPct + testPct / 2) / 100} y={44} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">
                Test {testPct}%
              </text>

              <text x={300} y={85} textAnchor="middle" fill="#94a3b8" fontSize={9}>
                Train: hoc | Val: dieu chinh hyperparams | Test: danh gia cuoi cung (chi 1 lan!)
              </text>
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoanh khac Aha">
        <AhaMoment>
          <p>
            Train set = <strong>sach giao khoa</strong>{" "}(hoc tu day).
            Validation set = <strong>de kiem tra giua ky</strong>{" "}(dieu chinh cach hoc).
            Test set = <strong>de thi cuoi ky</strong>{" "}(chi lam 1 lan — danh gia nang luc that).
            Neu &quot;luyen de thi&quot; tren test set → diem cao nhung <strong>khong phan anh nang luc that!</strong>
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thu thach">
        <InlineChallenge
          question="Dataset co 10.000 mau: 9500 class A, 500 class B (mat can bang 19:1). Random split 70/15/15. Co van de gi?"
          options={[
            "Khong van de",
            "Test set 1500 mau co the chi co 75 class B (5%) — qua it de danh gia dang tin cay. Can STRATIFIED split giu ty le classes",
            "Can chia 50/25/25",
          ]}
          correct={1}
          explanation="Random split co the cho test set voi rat it class B (hoac qua nhieu). Stratified split: dam bao TUNG TAP deu co ty le 19:1 giong tong the. Train: 6650 A + 350 B. Val: 1425 A + 75 B. Test: 1425 A + 75 B. Moi tap dai dien cho distribution goc!"
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Ly thuyet">
        <ExplanationSection>
          <p>
            <strong>Train/Validation/Test Split</strong>{" "}
            chia du lieu thanh 3 tap de dam bao danh gia model khach quan — co ban nhat cua ML methodology.
          </p>
          <p><strong>3 tap va muc dich:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Train (60-80%):</strong>{" "}Model hoc patterns tu day. Update weights</li>
            <li><strong>Validation (10-20%):</strong>{" "}Tune hyperparameters, chon model, early stopping</li>
            <li><strong>Test (10-20%):</strong>{" "}Danh gia cuoi cung. CHI DUNG 1 LAN. Khong duoc dung de quyet dinh bat ky gi</li>
          </ul>

          <LaTeX block>{"\\text{Generalization Error} = \\text{Test Error} \\approx \\mathbb{E}[\\mathcal{L}(f(x), y)] \\text{ tren data chua thay}"}</LaTeX>

          <Callout variant="warning" title="Data Leakage">
            Loi pho bien: feature engineering TRUOC khi split → thong tin tu test 'ro ri' vao train (vi du: StandardScaler fit tren TOAN BO data). DUNG: split truoc → fit scaler tren train → transform val/test bang scaler cua train.
          </Callout>

          <CodeBlock language="python" title="Chia du lieu dung cach">
{`from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# Buoc 1: Split TRUOC moi thu khac
X_temp, X_test, y_temp, y_test = train_test_split(
    X, y, test_size=0.15, stratify=y, random_state=42
)
X_train, X_val, y_train, y_val = train_test_split(
    X_temp, y_temp, test_size=0.176, stratify=y_temp, random_state=42
    # 0.176 of 85% ≈ 15% of total
)

# Buoc 2: Fit scaler CHI tren train
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)   # fit + transform
X_val = scaler.transform(X_val)           # chi transform (khong fit!)
X_test = scaler.transform(X_test)         # chi transform

# Buoc 3: Train + tune tren train/val
model.fit(X_train, y_train)
val_score = model.score(X_val, y_val)  # Dung de tune

# Buoc 4: Danh gia cuoi cung tren test (CHI 1 LAN)
test_score = model.score(X_test, y_test)
print(f"Final test accuracy: {test_score:.3f}")`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tom tat">
        <MiniSummary points={[
          "Train (hoc), Validation (kiem tra giua ky), Test (thi cuoi ky — chi 1 lan).",
          "KHONG dung test set de tune hay chon model — se mat tinh khach quan.",
          "Stratified split giu ty le classes deu o moi tap — quan trong cho data mat can bang.",
          "Data leakage: SPLIT TRUOC, fit scaler/encoder CHI tren train, transform val/test.",
          "Data it? Dung K-fold cross-validation — moi fold lan luot lam validation.",
        ]} />
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiem tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>

        </PredictionGate>
      </LessonSection>
    </>
  );
}
