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
  titleVi: "Dữ liệu tổng hợp — AI tạo dữ liệu cho AI",
  description:
    "Dữ liệu được tạo bằng AI hoặc mô phỏng, dùng để huấn luyện mô hình khi dữ liệu thật khan hiếm, đắt đỏ hoặc nhạy cảm.",
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
  { name: "Dữ liệu thật (human)", quality: 95, cost: "$10-50/sample", volume: "Thấp (100-10K)", privacy: "Định danh được", risk: "Bias từ người label" },
  { name: "LLM distillation", quality: 85, cost: "$0.01/sample", volume: "Cao (1M+)", privacy: "Không định danh", risk: "Khuếch đại lỗi model gốc" },
  { name: "Self-instruct", quality: 75, cost: "$0.005/sample", volume: "Rất cao", privacy: "Không định danh", risk: "Model collapse nếu lặp nhiều" },
  { name: "Rule-based augment", quality: 70, cost: "$0.001/sample", volume: "Rất cao", privacy: "Không định danh", risk: "Thiếu đa dạng" },
];

const TOTAL_STEPS = 7;

export default function SyntheticDataTopic() {
  const [activeSource, setActiveSource] = useState(1);
  const source = SOURCES[activeSource];

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Model collapse xảy ra khi nào?",
      options: [
        "Model quá lớn không vừa GPU",
        "Train model trên dữ liệu SYNTHETIC của chính nó hoặc model tương tự — mất đa dạng, suy giảm chất lượng dần",
        "Dữ liệu training quá nhiều",
      ],
      correct: 1,
      explanation: "Model A sinh data → train Model B → Model B sinh data → train Model C... Qua mỗi thế hệ, dữ liệu mất đa dạng (mode collapse), lỗi được khuếch đại. Giống photocopy của photocopy — mỗi bản sao tệ hơn bản trước. Cần trộn dữ liệu thật + synthetic để tránh.",
    },
    {
      question: "Tại sao Phi-3 (Microsoft) dùng textbook-quality synthetic data thay vì web scraping?",
      options: [
        "Web data miễn phí nên không tốt",
        "Synthetic data chất lượng cao, có cấu trúc, giải thích rõ ràng → model học hiệu quả hơn dù ít data hơn",
        "Microsoft không có quyền dùng web data",
      ],
      correct: 1,
      explanation: "Web data: nhiều nhưng loạn (spam, sai, trùng lặp). Textbook synthetic: sạch, có cấu trúc, giải thích bước bước. Phi-3 3.8B train trên 3.3T textbook tokens → MMLU 69% (ngang GPT-3.5 175B train trên 300B web tokens). Chất lượng data > số lượng data!",
    },
    {
      question: "Dùng GPT-4 sinh training data cho model khác có vấn đề pháp lý gì?",
      options: [
        "Không vấn đề gì",
        "Vi phạm Terms of Service: OpenAI cấm dùng output để train model cạnh tranh",
        "Chỉ vi phạm nếu bán dữ liệu",
      ],
      correct: 1,
      explanation: "OpenAI ToS cấm dùng output để 'develop models that compete'. Nhiều mô hình open-source (Alpaca, Vicuna) đã bị chỉ trích vì train trên GPT output. Giải pháp: dùng model open-source (Llama, Mistral) để sinh data, hoặc tự xây pipeline từ scratch.",
    },
  ], []);

  return (
    <>
      {/* STEP 1: PREDICTION GATE */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn cần 100K cặp Q&A tiếng Việt về y tế để train chatbot. Thuê bác sĩ label: $30/cặp = $3 triệu, mất 6 tháng. Có cách nào rẻ hơn 100x và nhanh hơn 10x?"
          options={[
            "Không — dữ liệu y tế phải do chuyên gia tạo",
            "Dùng LLM sinh dữ liệu tổng hợp: $0.01/cặp = $1000, mất 1 ngày. Bác sĩ chỉ cần verify 10% sample",
            "Lấy dữ liệu từ internet là đủ",
          ]}
          correct={1}
          explanation="Đúng! Synthetic data cách mạng hoá: LLM sinh 100K cặp Q&A, bác sĩ verify 10K sample (quality control). Chi phí giảm 3000x, thời gian giảm 180x. Giống buồng mô phỏng bay — phi công không cần bay thật để luyện tập!"
        >

      {/* STEP 2: INTERACTIVE VIZ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          So sánh <strong className="text-foreground">các nguồn dữ liệu</strong>{" "}
          về chất lượng, chi phí, và rủi ro.
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
                <p className="text-xs text-muted">Rủi ro chính</p>
                <p className="text-sm font-bold text-amber-400">{source.risk}</p>
              </div>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* STEP 3: AHA */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Synthetic data là <strong>buồng mô phỏng bay</strong>{" "}cho AI — tạo tình huống 'giả nhưng hữu ích'
            khi dữ liệu thật khan hiếm, đắt, hoặc nhạy cảm. Phi-3 đã chứng minh:{" "}
            <strong>3.8B params + textbook synthetic data &gt; 175B params + web data</strong>.
            Nhưng cẩn quyền: <strong>model collapse</strong>{" "}xảy ra nếu chỉ train trên synthetic — cần trộn dữ liệu thật!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* STEP 4: CHALLENGE */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Bạn dùng GPT-4 sinh 1M samples train model Việt. Sau 3 thế hệ (model A sinh data → train B → B sinh data → train C), chất lượng C giảm 30% so với A. Nguyên nhân?"
          options={[
            "GPU không đủ mạnh",
            "Model collapse: mỗi thế hệ mất đa dạng, lỗi khuếch đại, phân phối thu hẹp dần",
            "1M samples không đủ nhiều",
          ]}
          correct={1}
          explanation="Model collapse điển hình! Thế hệ 1: đa dạng. Thế hệ 2: ít đa dạng hơn (mode collapse). Thế hệ 3: chỉ còn vài pattern chủ đạo. Giống photocopy của photocopy. Giải pháp: LUÔN trộn dữ liệu thật (ít nhất 10-20%), diversity filtering, và KHÔNG train quá nhiều thế hệ."
        />
      </LessonSection>

      {/* STEP 5: EXPLANATION */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Synthetic Data</strong>{" "}
            là dữ liệu được tạo bằng AI hoặc mô phỏng, dùng thay thế hoặc bổ sung dữ liệu thật khi dữ liệu thật khan hiếm, đắt, hoặc nhạy cảm.
          </p>

          <p><strong>3 phương pháp tạo chính:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>LLM Distillation:</strong>{" "}Model lớn (GPT-4) sinh data → train model nhỏ. Chất lượng 85-90% model gốc</li>
            <li><strong>Self-Instruct:</strong>{" "}Model tự sinh instruction → answer pairs. Rẻ nhưng dễ bị loop</li>
            <li><strong>Evol-Instruct:</strong>{" "}Bắt đầu từ instruction đơn giản, LLM tăng độ khó dần → đa dạng hơn</li>
          </ul>

          <p><strong>Model Collapse — rủi ro lớn nhất:</strong></p>
          <LaTeX block>{"P_{n+1}(x) = \\int P_{\\text{model}}(x|\\theta_n) \\, d\\theta_n \\rightarrow \\text{mode collapse khi } n \\to \\infty"}</LaTeX>
          <p>
            Qua mỗi thế hệ, phân phối dữ liệu thu hẹp (mất tail), đa dạng giảm, lỗi khuếch đại.
          </p>

          <Callout variant="warning" title="Ngày càng nghiêm trọng">
            Nghiên cứu Shumailov et al. (2024) chứng minh: model train 100% trên synthetic data của model trước SẼ suy giảm không thể phục hồi. Cần ÍT NHẤT 10% dữ liệu thật để giữ đa dạng và ngăn model collapse.
          </Callout>

          <p><strong>Quality control cho synthetic data:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Human verification:</strong>{" "}Verify 5-10% samples — phát hiện pattern lỗi</li>
            <li><strong>Diversity metrics:</strong>{" "}Đo n-gram diversity, embedding spread, topic coverage</li>
            <li><strong>Contamination check:</strong>{" "}Đảm bảo synthetic data không trùng với test set</li>
            <li><strong>Reward model filtering:</strong>{" "}Chỉ giữ samples có quality score cao</li>
          </ul>

          <CodeBlock language="python" title="Sinh synthetic training data với LLM">
{`import anthropic
import json
from typing import List

client = anthropic.Anthropic()

def generate_qa_pairs(topic: str, n: int = 100) -> List[dict]:
    """Sinh Q&A pairs chất lượng cao."""
    prompt = f"""Tạo {n} cặp hỏi-đáp về {topic} cho học sinh Việt Nam.
Yêu cầu:
- Câu hỏi đa dạng (kiến thức, ứng dụng, phân tích)
- Trả lời chi tiết, có giải thích
- Dùng tiếng Việt tự nhiên
- Mỗi cặp là JSON: {{"q": "...", "a": "..."}}

Trả về JSON array:"""

    resp = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=8000,
        temperature=0.9,  # Đa dạng hoá
        messages=[{"role": "user", "content": prompt}],
    )
    return json.loads(resp.content[0].text)

# Sinh + lọc chất lượng
pairs = generate_qa_pairs("sốt xuất huyết", n=1000)

# Quality filtering: chỉ giữ samples tốt
def score_quality(pair: dict) -> float:
    resp = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=10,
        messages=[{"role": "user", "content":
            f"Rate 0-10: Q: {pair['q']} A: {pair['a']}. Score:"}],
    )
    return float(resp.content[0].text.strip())

# Chỉ giữ samples score >= 8
high_quality = [p for p in pairs if score_quality(p) >= 8]
# Giảm từ 1000 → ~700 high-quality pairs`}
          </CodeBlock>

          <Callout variant="info" title="Synthetic data tại Việt Nam">
            Tiếng Việt là 'low-resource language' — ít dữ liệu chất lượng. Nhiều team Việt dùng Claude/GPT-4 sinh dữ liệu tiếng Việt cho chatbot, NER, sentiment analysis. VinAI dùng synthetic data để train PhoGPT. Chi phí giảm 100x so với thuê người label.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* STEP 6: SUMMARY */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "Synthetic data là 'buồng mô phỏng bay' — tạo dữ liệu 'giả nhưng hữu ích' khi dữ liệu thật khan hiếm hoặc đắt.",
          "3 phương pháp: LLM Distillation (85% quality), Self-Instruct (75%), Rule-based augment (70%).",
          "Model collapse: train nhiều thế hệ trên synthetic → mất đa dạng, lỗi khuếch đại. Cần trộn 10%+ dữ liệu thật.",
          "Quality control: human verify 5-10%, diversity metrics, reward model filtering.",
          "Phi-3 chứng minh: textbook-quality synthetic data + SLM 3.8B > web data + LLM 175B.",
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
