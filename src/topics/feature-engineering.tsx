"use client";

import { useMemo } from "react";
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
  slug: "feature-engineering",
  title: "Feature Engineering",
  titleVi: "Ky thuat dac trung — Nghe thuat chon nguyen lieu",
  description:
    "Qua trinh tao, chon loc va bien doi cac dac trung dau vao de mo hinh may hoc de hoc va du doan chinh xac hon.",
  category: "foundations",
  tags: ["features", "engineering", "transformation", "selection"],
  difficulty: "beginner",
  relatedSlugs: ["data-preprocessing", "dimensionality-curse", "train-val-test"],
  vizType: "interactive",
};

const TOTAL_STEPS = 7;

export default function FeatureEngineeringTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Tai sao feature engineering quan trong hon chon algorithm?",
      options: [
        "Khong dung — algorithm quan trong hon",
        "Features tot giup MODEL DON GIAN cung du doan tot. Features te thi model phuc tap cung khong cuu duoc",
        "Feature engineering nhanh hon training",
      ],
      correct: 1,
      explanation: "'Garbage features in, garbage predictions out.' Linear regression voi features tot thuong thang deep learning voi features te. Andrew Ng: '80% thoi gian ML la feature engineering.' Features la NGUYEN LIEU — nguyen lieu tuoi thi mon an ngon, du bep gioi nao.",
    },
    {
      question: "Du doan gia nha tai Ha Noi. Feature 'so nha' (vi du: 42) co huu ich khong?",
      options: [
        "Co — so nha anh huong gia",
        "KHONG — so nha la ID, khong co quan he voi gia. Them feature noise → model overfit",
        "Tuy thuoc model",
      ],
      correct: 1,
      explanation: "So nha la identifier, khong phai feature co y nghia. Nha so 42 khong dat hon nha so 41. Them features vo nghia → model hoc noise → overfit. Features tot: dien tich, so phong, khoang cach Metro, quan/huyen. Chon features = loai bo nhieu!",
    },
    {
      question: "Feature 'ngay sinh' cua user co giup du doan so thich am nhac khong? Nen xu ly the nao?",
      options: [
        "Dung truc tiep ngay sinh lam feature",
        "Tao features moi: tuoi (2025 - nam_sinh), the_he (Gen Z/Millennial/Gen X), thang_sinh (zodiac effect)",
        "Bo di vi ngay sinh khong lien quan",
      ],
      correct: 1,
      explanation: "Ngay sinh raw khong huu ich (30/05/1995 ≠ pattern). Nhung FEATURES DUOC TAO TU ngay sinh rat huu ich: tuoi (30) → Gen Z, the_he → correlated voi so thich nhac. Day la core cua feature engineering: bien doi raw data thanh features co y nghia!",
    },
  ], []);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Du doan">
        <PredictionGate
          question="Ban du doan gia nha o Ha Noi. Data co: dien tich, so phong, nam xay, dia chi text ('42 Ly Thuong Kiet, Hoan Kiem'). Model accuracy chi 60%. Thieu gi?"
          options={[
            "Can model phuc tap hon (deep learning)",
            "Can feature engineering: tu dia chi text → extract quan/huyen, khoang cach trung tam, gan Metro? → accuracy tang 85%+",
            "Can nhieu data hon",
          ]}
          correct={1}
          explanation="Dia chi text '42 Ly Thuong Kiet' model khong hieu. Feature engineering: extract 'Hoan Kiem' (quan), tinh khoang cach Ho Guom (2km), gan Metro (500m), mat pho (co). Features nay CO Y NGHIA → model hieu 'nha o trung tam, gan Metro = dat'. Accuracy tang 25%+!"
        >

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Kham pha">
        <VisualizationSection>
          <div className="space-y-4">
            <svg viewBox="0 0 600 160" className="w-full max-w-2xl mx-auto">
              <text x={300} y={16} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontWeight="bold">
                Raw Data → Feature Engineering → Model Input
              </text>
              {/* Raw data */}
              <rect x={20} y={30} width={160} height={90} rx={8} fill="#1e293b" stroke="#ef4444" strokeWidth={1.5} />
              <text x={100} y={50} textAnchor="middle" fill="#ef4444" fontSize={9} fontWeight="bold">Raw Data</text>
              <text x={100} y={68} textAnchor="middle" fill="#94a3b8" fontSize={7}>ngay_sinh: 30/05/1995</text>
              <text x={100} y={82} textAnchor="middle" fill="#94a3b8" fontSize={7}>dia_chi: 42 Ly Thuong Kiet</text>
              <text x={100} y={96} textAnchor="middle" fill="#94a3b8" fontSize={7}>gia: 5.2 ty VND</text>

              <text x={235} y={75} fill="#f59e0b" fontSize={20}>→</text>

              {/* Engineered features */}
              <rect x={260} y={30} width={160} height={90} rx={8} fill="#1e293b" stroke="#22c55e" strokeWidth={1.5} />
              <text x={340} y={50} textAnchor="middle" fill="#22c55e" fontSize={9} fontWeight="bold">Engineered</text>
              <text x={340} y={68} textAnchor="middle" fill="#94a3b8" fontSize={7}>tuoi: 30, the_he: GenZ</text>
              <text x={340} y={82} textAnchor="middle" fill="#94a3b8" fontSize={7}>quan: Hoan Kiem, gan_metro: 1</text>
              <text x={340} y={96} textAnchor="middle" fill="#94a3b8" fontSize={7}>log_gia: 22.37</text>

              <text x={475} y={75} fill="#f59e0b" fontSize={20}>→</text>

              <rect x={500} y={50} width={80} height={40} rx={8} fill="#3b82f6" />
              <text x={540} y={75} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">Model</text>

              <text x={300} y={145} textAnchor="middle" fill="#64748b" fontSize={9}>
                Features tot = model don gian cung chinh xac. Features te = model phuc tap cung te.
              </text>
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoanh khac Aha">
        <AhaMoment>
          <p>
            Feature Engineering giong <strong>chon nguyen lieu nau an</strong>.
            Nguyen lieu tuoi, chat luong → mon an ngon du bep binh thuong.
            Nguyen lieu te → mon an te du bep gioi. <strong>80% thoi gian ML la feature engineering</strong>{" "}
            — khong phai training model!
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thu thach">
        <InlineChallenge
          question="Du doan khach hang Shopee co mua hang trong 7 ngay toi khong. Feature nao HUU ICH NHAT?"
          options={[
            "User ID (ma khach hang)",
            "so_ngay_tu_lan_mua_cuoi, tan_suat_mua_30_ngay, gia_trung_binh_don, so_san_pham_trong_gio",
            "mau_avatar (mau hinh dai dien)",
          ]}
          correct={1}
          explanation="User ID la identifier (khong co pattern). Mau avatar khong lien quan. Nhung: so_ngay_tu_lan_mua_cuoi (recency), tan_suat_mua (frequency), gia_trung_binh (monetary) = RFM features — kinh dien trong e-commerce. so_san_pham_trong_gio = intent signal manh!"
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Ly thuyet">
        <ExplanationSection>
          <p>
            <strong>Feature Engineering</strong>{" "}
            la qua trinh bien doi raw data thanh features co y nghia giup model hoc hieu qua hon.
          </p>
          <p><strong>5 ky thuat chinh:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Tao feature moi:</strong>{" "}ngay_sinh → tuoi, the_he. dia_chi → quan, khoang_cach</li>
            <li><strong>Encoding:</strong>{" "}Categorical → one-hot, target encoding. Text → TF-IDF, embeddings</li>
            <li><strong>Scaling:</strong>{" "}StandardScaler (mean=0, std=1), MinMaxScaler (0-1)</li>
            <li><strong>Feature selection:</strong>{" "}Loai features vo nghia, giam chieu, giam overfitting</li>
            <li><strong>Interaction features:</strong>{" "}dien_tich x so_tang = tong_dien_tich_san</li>
          </ul>

          <LaTeX block>{"\\text{StandardScaler: } x' = \\frac{x - \\mu}{\\sigma} \\quad \\text{MinMax: } x' = \\frac{x - x_{\\min}}{x_{\\max} - x_{\\min}}"}</LaTeX>

          <Callout variant="tip" title="Target Encoding">
            Categorical feature co nhieu gia tri (1000 quan/huyen) → one-hot tao 1000 cot (qua nhieu!). Target encoding: thay moi category bang mean(target) cua category do. Vi du: Hoan Kiem → mean(gia) = 8.5 ty. Giam chieu + giu thong tin!
          </Callout>

          <CodeBlock language="python" title="Feature Engineering cho du doan gia nha">
{`import pandas as pd
from sklearn.preprocessing import StandardScaler

# Raw data
df = pd.DataFrame({
    "dia_chi": ["42 Ly Thuong Kiet, Hoan Kiem", ...],
    "dien_tich": [65, 120, 45, ...],
    "nam_xay": [2015, 2020, 2008, ...],
})

# Feature Engineering
df["quan"] = df["dia_chi"].apply(extract_district)  # Text → category
df["tuoi_nha"] = 2025 - df["nam_xay"]  # Derived feature
df["gan_metro"] = df["dia_chi"].apply(check_near_metro)  # Binary
df["khoang_cach_tt"] = df["dia_chi"].apply(calc_distance_center)  # km
df["gia_per_m2"] = df["gia"] / df["dien_tich"]  # Interaction

# Scaling
scaler = StandardScaler()
numeric_cols = ["dien_tich", "tuoi_nha", "khoang_cach_tt"]
df[numeric_cols] = scaler.fit_transform(df[numeric_cols])

# Feature selection: loai features tuong quan cao
# cor_matrix = df.corr()
# Drop features co correlation > 0.95

# Accuracy: 60% (raw) → 85% (engineered features)`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tom tat">
        <MiniSummary points={[
          "Feature engineering bien doi raw data thanh features co y nghia — 80% thoi gian ML.",
          "5 ky thuat: tao feature moi, encoding, scaling, selection, interaction features.",
          "Features tot + model don gian > Features te + model phuc tap. 'Nguyen lieu quyet dinh mon an.'",
          "Loai features vo nghia (ID, noise) giam overfitting. Them features co y nghia tang accuracy.",
          "Xu huong: deep learning tu hoc features (end-to-end), nhung tabular data van can manual engineering.",
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
