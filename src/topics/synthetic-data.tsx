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
  slug: "synthetic-data",
  title: "Synthetic Data",
  titleVi: "Du lieu tong hop — AI tao du lieu cho AI",
  description:
    "Du lieu duoc tao bang AI hoac mo phong, dung de huan luyen mo hinh khi du lieu that khan hiem, dat do hoac nhay cam.",
  category: "emerging",
  tags: ["synthetic-data", "generation", "augmentation", "privacy"],
  difficulty: "intermediate",
  relatedSlugs: ["small-language-models", "bias-fairness", "alignment"],
  vizType: "interactive",
};

/* ── Synthetic data quality slider ── */
interface DataSource {
  name: string;
  quality: number;
  cost: string;
  volume: string;
  privacy: string;
  risk: string;
}

const SOURCES: DataSource[] = [
  { name: "Du lieu that (human)", quality: 95, cost: "$10-50/sample", volume: "Thap (100-10K)", privacy: "Dinh danh duoc", risk: "Bias tu nguoi label" },
  { name: "LLM distillation", quality: 85, cost: "$0.01/sample", volume: "Cao (1M+)", privacy: "Khong dinh danh", risk: "Khuech dai loi model goc" },
  { name: "Self-instruct", quality: 75, cost: "$0.005/sample", volume: "Rat cao", privacy: "Khong dinh danh", risk: "Model collapse neu lap nhieu" },
  { name: "Rule-based augment", quality: 70, cost: "$0.001/sample", volume: "Rat cao", privacy: "Khong dinh danh", risk: "Thieu da dang" },
];

const TOTAL_STEPS = 7;

export default function SyntheticDataTopic() {
  const [activeSource, setActiveSource] = useState(1);
  const source = SOURCES[activeSource];

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Model collapse xay ra khi nao?",
      options: [
        "Model qua lon khong vua GPU",
        "Train model tren du lieu SYNTHETIC cua chinh no hoac model tuong tu — mat da dang, suy giam chat luong dan",
        "Du lieu training qua nhieu",
      ],
      correct: 1,
      explanation: "Model A sinh data → train Model B → Model B sinh data → train Model C... Qua moi the he, du lieu mat da dang (mode collapse), loi duoc khuech dai. Giong photocopy cua photocopy — moi ban sao te hon ban truoc. Can tron du lieu that + synthetic de tranh.",
    },
    {
      question: "Tai sao Phi-3 (Microsoft) dung textbook-quality synthetic data thay vi web scraping?",
      options: [
        "Web data mien phi nen khong tot",
        "Synthetic data chat luong cao, co cau truc, giai thich ro rang → model hoc hieu qua hon du it data hon",
        "Microsoft khong co quyen dung web data",
      ],
      correct: 1,
      explanation: "Web data: nhieu nhung loan (spam, sai, trung lap). Textbook synthetic: sach, co cau truc, giai thich buoc buoc. Phi-3 3.8B train tren 3.3T textbook tokens → MMLU 69% (ngang GPT-3.5 175B train tren 300B web tokens). Chat luong data > so luong data!",
    },
    {
      question: "Dung GPT-4 sinh training data cho model khac co van de phap ly gi?",
      options: [
        "Khong van de gi",
        "Vi pham Terms of Service: OpenAI cam dung output de train model canh tranh",
        "Chi vi pham neu ban du lieu",
      ],
      correct: 1,
      explanation: "OpenAI ToS cam dung output de 'develop models that compete'. Nhieu mo hinh open-source (Alpaca, Vicuna) da bi chi trich vi train tren GPT output. Giai phap: dung model open-source (Llama, Mistral) de sinh data, hoac tu xay pipeline tu scratch.",
    },
  ], []);

  return (
    <>
      {/* STEP 1: PREDICTION GATE */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Du doan">
        <PredictionGate
          question="Ban can 100K cap Q&A tieng Viet ve y te de train chatbot. Thue bac si label: $30/cap = $3 trieu, mat 6 thang. Co cach nao re hon 100x va nhanh hon 10x?"
          options={[
            "Khong — du lieu y te phai do chuyen gia tao",
            "Dung LLM sinh du lieu tong hop: $0.01/cap = $1000, mat 1 ngay. Bac si chi can verify 10% sample",
            "Lay du lieu tu internet la du",
          ]}
          correct={1}
          explanation="Dung! Synthetic data cach mang hoa: LLM sinh 100K cap Q&A, bac si verify 10K sample (quality control). Chi phi giam 3000x, thoi gian giam 180x. Giong buong mo phong bay — phi cong khong can bay that de luyen tap!"
        >

      {/* STEP 2: INTERACTIVE VIZ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Kham pha">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          So sanh <strong className="text-foreground">cac nguon du lieu</strong>{" "}
          ve chat luong, chi phi, va rui ro.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {SOURCES.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSource(i)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    activeSource === i
                      ? "bg-accent text-white"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>

            <svg viewBox="0 0 600 170" className="w-full max-w-2xl mx-auto">
              {/* Quality bars for all sources */}
              {SOURCES.map((s, i) => {
                const y = 10 + i * 38;
                const isActive = i === activeSource;
                return (
                  <g key={i}>
                    <text x={15} y={y + 16} fill={isActive ? "#e2e8f0" : "#64748b"} fontSize={8} fontWeight={isActive ? "bold" : "normal"}>
                      {s.name}
                    </text>
                    <rect x={160} y={y} width={300} height={22} rx={3} fill="#1e293b" />
                    <rect x={160} y={y} width={300 * (s.quality / 100)} height={22} rx={3}
                      fill={s.quality > 90 ? "#22c55e" : s.quality > 80 ? "#3b82f6" : "#f59e0b"}
                      opacity={isActive ? 1 : 0.3}
                    />
                    <text x={165 + 300 * (s.quality / 100)} y={y + 15} fill="white" fontSize={9} fontWeight="bold">
                      {s.quality}%
                    </text>
                    <text x={500} y={y + 15} fill="#94a3b8" fontSize={7}>{s.cost}</text>
                  </g>
                );
              })}
            </svg>

            {/* Selected source details */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-lg border border-border bg-card p-2">
                <p className="text-xs text-muted">Volume</p>
                <p className="text-sm font-bold text-blue-400">{source.volume}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-2">
                <p className="text-xs text-muted">Privacy</p>
                <p className="text-sm font-bold text-green-400">{source.privacy}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-2 col-span-2">
                <p className="text-xs text-muted">Rui ro chinh</p>
                <p className="text-sm font-bold text-amber-400">{source.risk}</p>
              </div>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* STEP 3: AHA */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoanh khac Aha">
        <AhaMoment>
          <p>
            Synthetic data la <strong>buong mo phong bay</strong>{" "}cho AI — tao tinh huong &quot;gia nhung huu ich&quot;
            khi du lieu that khan hiem, dat, hoac nhay cam. Phi-3 da chung minh:{" "}
            <strong>3.8B params + textbook synthetic data &gt; 175B params + web data</strong>.
            Nhung can quyen: <strong>model collapse</strong>{" "}xay ra neu chi train tren synthetic — can tron du lieu that!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* STEP 4: CHALLENGE */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thu thach">
        <InlineChallenge
          question="Ban dung GPT-4 sinh 1M samples train model Viet. Sau 3 the he (model A sinh data → train B → B sinh data → train C), chat luong C giam 30% so voi A. Nguyen nhan?"
          options={[
            "GPU khong du manh",
            "Model collapse: moi the he mat da dang, loi khuech dai, phan phoi thu hep dan",
            "1M samples khong du nhieu",
          ]}
          correct={1}
          explanation="Model collapse dien hinh! The he 1: da dang. The he 2: it da dang hon (mode collapse). The he 3: chi con vai pattern chu dao. Giong photocopy cua photocopy. Giai phap: LUON tron du lieu that (it nhat 10-20%), diversity filtering, va KHONG train qua nhieu the he."
        />
      </LessonSection>

      {/* STEP 5: EXPLANATION */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Ly thuyet">
        <ExplanationSection>
          <p>
            <strong>Synthetic Data</strong>{" "}
            la du lieu duoc tao bang AI hoac mo phong, dung thay the hoac bo sung du lieu that khi du lieu that khan hiem, dat, hoac nhay cam.
          </p>

          <p><strong>3 phuong phap tao chinh:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>LLM Distillation:</strong>{" "}Model lon (GPT-4) sinh data → train model nho. Chat luong 85-90% model goc</li>
            <li><strong>Self-Instruct:</strong>{" "}Model tu sinh instruction → answer pairs. Re nhung de bi loop</li>
            <li><strong>Evol-Instruct:</strong>{" "}Bat dau tu instruction don gian, LLM tang do kho dan → da dang hon</li>
          </ul>

          <p><strong>Model Collapse — rui ro lon nhat:</strong></p>
          <LaTeX block>{"P_{n+1}(x) = \\int P_{\\text{model}}(x|\\theta_n) \\, d\\theta_n \\rightarrow \\text{mode collapse khi } n \\to \\infty"}</LaTeX>
          <p>
            Qua moi the he, phan phoi du lieu thu hep (mat tail), da dang giam, loi khuech dai.
          </p>

          <Callout variant="warning" title="Ngay cang nghiem trong">
            Nghien cuu Shumailov et al. (2024) chung minh: model train 100% tren synthetic data cua model truoc SE suy giam khong the phuc hoi. Can IT NHAT 10% du lieu that de giu da dang va ngan model collapse.
          </Callout>

          <p><strong>Quality control cho synthetic data:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Human verification:</strong>{" "}Verify 5-10% samples — phat hien pattern loi</li>
            <li><strong>Diversity metrics:</strong>{" "}Do n-gram diversity, embedding spread, topic coverage</li>
            <li><strong>Contamination check:</strong>{" "}Dam bao synthetic data khong trung voi test set</li>
            <li><strong>Reward model filtering:</strong>{" "}Chi giu samples co quality score cao</li>
          </ul>

          <CodeBlock language="python" title="Sinh synthetic training data voi LLM">
{`import anthropic
import json
from typing import List

client = anthropic.Anthropic()

def generate_qa_pairs(topic: str, n: int = 100) -> List[dict]:
    """Sinh Q&A pairs chat luong cao."""
    prompt = f"""Tao {n} cap hoi-dap ve {topic} cho hoc sinh Viet Nam.
Yeu cau:
- Cau hoi da dang (kien thuc, ung dung, phan tich)
- Tra loi chi tiet, co giai thich
- Dung tieng Viet tu nhien
- Moi cap la JSON: {{"q": "...", "a": "..."}}

Tra ve JSON array:"""

    resp = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=8000,
        temperature=0.9,  # Da dang hoa
        messages=[{"role": "user", "content": prompt}],
    )
    return json.loads(resp.content[0].text)

# Sinh + loc chat luong
pairs = generate_qa_pairs("sot xuat huyet", n=1000)

# Quality filtering: chi giu samples tot
def score_quality(pair: dict) -> float:
    resp = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=10,
        messages=[{"role": "user", "content":
            f"Rate 0-10: Q: {pair['q']} A: {pair['a']}. Score:"}],
    )
    return float(resp.content[0].text.strip())

# Chi giu samples score >= 8
high_quality = [p for p in pairs if score_quality(p) >= 8]
# Giam tu 1000 → ~700 high-quality pairs`}
          </CodeBlock>

          <Callout variant="info" title="Synthetic data tai Viet Nam">
            Tieng Viet la &quot;low-resource language&quot; — it du lieu chat luong. Nhieu team Viet dung Claude/GPT-4 sinh du lieu tieng Viet cho chatbot, NER, sentiment analysis. VinAI dung synthetic data de train PhoGPT. Chi phi giam 100x so voi thue nguoi label.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* STEP 6: SUMMARY */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tom tat">
        <MiniSummary points={[
          "Synthetic data la 'buong mo phong bay' — tao du lieu 'gia nhung huu ich' khi du lieu that khan hiem hoac dat.",
          "3 phuong phap: LLM Distillation (85% quality), Self-Instruct (75%), Rule-based augment (70%).",
          "Model collapse: train nhieu the he tren synthetic → mat da dang, loi khuech dai. Can tron 10%+ du lieu that.",
          "Quality control: human verify 5-10%, diversity metrics, reward model filtering.",
          "Phi-3 chung minh: textbook-quality synthetic data + SLM 3.8B > web data + LLM 175B.",
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
