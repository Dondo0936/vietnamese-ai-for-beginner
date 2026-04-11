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
  slug: "fine-tuning",
  title: "Fine-tuning",
  titleVi: "Fine-tuning - Tinh chỉnh mô hình",
  description:
    "Quá trình huấn luyện thêm mô hình đã pre-train trên dữ liệu chuyên biệt để thực hiện tác vụ cụ thể.",
  category: "training-optimization",
  tags: ["fine-tuning", "transfer-learning", "training", "specialization"],
  difficulty: "intermediate",
  relatedSlugs: ["lora", "qlora", "fine-tuning-vs-prompting"],
  vizType: "interactive",
};

/* ── Constants ── */
const TOTAL_STEPS = 8;

const QUIZ: QuizQuestion[] = [
  {
    question: "Tại sao fine-tuning hiệu quả hơn huấn luyện từ đầu?",
    options: [
      "Vì fine-tuning dùng GPU mạnh hơn",
      "Vì mô hình đã có kiến thức nền từ pre-training, chỉ cần học thêm kiến thức chuyên biệt",
      "Vì fine-tuning không cần dữ liệu",
      "Vì fine-tuning chỉ thay đổi lớp cuối cùng",
    ],
    correct: 1,
    explanation:
      "Transfer learning cho phép tận dụng kiến thức đã học từ hàng tỷ token. Chỉ cần vài nghìn mẫu chuyên biệt là đủ để mô hình thích ứng.",
  },
  {
    question: "Khi nào KHÔNG nên fine-tune mà nên dùng prompt engineering thay thế?",
    options: [
      "Khi có ít hơn 10 mẫu dữ liệu và tác vụ đơn giản",
      "Khi muốn mô hình chuyên sâu về y khoa",
      "Khi cần mô hình nói tiếng Việt tốt hơn",
      "Khi có ngân sách lớn và dữ liệu phong phú",
    ],
    correct: 0,
    explanation:
      "Với tác vụ đơn giản và ít dữ liệu, prompt engineering (few-shot) thường đủ tốt và rẻ hơn nhiều so với fine-tuning.",
  },
  {
    question: "Catastrophic forgetting trong fine-tuning là gì?",
    options: [
      "Mô hình quên mất kiến thức pre-train khi học kiến thức mới quá mạnh",
      "Mô hình chạy quá chậm sau fine-tuning",
      "Mô hình không học được gì mới",
      "Dữ liệu fine-tuning bị mất trong quá trình huấn luyện",
    ],
    correct: 0,
    explanation:
      "Catastrophic forgetting xảy ra khi trọng số thay đổi quá nhiều, phá hủy kiến thức nền. Giải pháp: learning rate nhỏ, LoRA, hoặc regularization.",
  },
];

export default function FineTuningTopic() {
  const [dataSize, setDataSize] = useState(5000);
  const [learningRate, setLearningRate] = useState(2);
  const [epochs, setEpochs] = useState(3);

  const result = useMemo(() => {
    const baseQuality = 60;
    const dataEffect = Math.min(dataSize / 1000, 20) * 1.5;
    const lrPenalty = learningRate > 5 ? (learningRate - 5) * 3 : 0;
    const epochBonus = Math.min(epochs, 5) * 2;
    const epochPenalty = epochs > 5 ? (epochs - 5) * 2.5 : 0;
    const quality = Math.min(98, Math.max(40, baseQuality + dataEffect + epochBonus - lrPenalty - epochPenalty));
    const overfitRisk = epochs > 5 || learningRate > 5 ? "Cao" : epochs > 3 || learningRate > 3 ? "Trung bình" : "Thấp";
    const forgettingRisk = learningRate > 4 ? "Cao" : learningRate > 2 ? "Trung bình" : "Thấp";
    return { quality: quality.toFixed(1), overfitRisk, forgettingRisk };
  }, [dataSize, learningRate, epochs]);

  return (
    <>
      {/* ━━━ 1. HOOK ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn có mô hình GPT-4 biết mọi thứ. Bạn muốn nó trở thành chuyên gia y khoa. Cách nào hiệu quả nhất?"
          options={[
            "Huấn luyện lại từ đầu trên dữ liệu y khoa (tốn 100 triệu USD)",
            "Cho mô hình đọc thêm vài nghìn tài liệu y khoa (fine-tuning)",
            "Chỉ cần viết prompt 'Hãy trả lời như bác sĩ' là đủ",
          ]}
          correct={1}
          explanation="Fine-tuning tận dụng kiến thức đã có và chỉ cần dữ liệu chuyên biệt nhỏ. Huấn luyện lại quá tốn kém, còn chỉ prompt thì chưa đủ sâu cho chuyên môn y khoa."
        >
          <p className="text-sm text-muted mt-2">
            Hãy cùng khám phá tại sao fine-tuning là bước nhảy vọt giúp mô hình
            đa năng trở thành chuyên gia.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ 2. TRỰC QUAN HOÁ ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Phòng thí nghiệm Fine-tuning
          </h3>
          <p className="text-sm text-muted mb-4">
            Điều chỉnh 3 tham số và quan sát chất lượng mô hình thay đổi.
          </p>

          <div className="space-y-4 max-w-lg mx-auto">
            <div className="space-y-1">
              <label className="text-sm text-muted">
                Số lượng dữ liệu: <strong className="text-foreground">{dataSize.toLocaleString()}</strong>{" "}mẫu
              </label>
              <input type="range" min={100} max={50000} step={100} value={dataSize}
                onChange={e => setDataSize(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-surface accent-accent cursor-pointer" />
              <div className="flex justify-between text-xs text-muted">
                <span>100</span><span>50.000</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-muted">
                Learning rate: <strong className="text-foreground">{learningRate}e-5</strong>
              </label>
              <input type="range" min={0.1} max={10} step={0.1} value={learningRate}
                onChange={e => setLearningRate(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-surface accent-accent cursor-pointer" />
              <div className="flex justify-between text-xs text-muted">
                <span>0.1e-5 (rất nhỏ)</span><span>10e-5 (rất lớn)</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-muted">
                Số epoch: <strong className="text-foreground">{epochs}</strong>
              </label>
              <input type="range" min={1} max={10} step={1} value={epochs}
                onChange={e => setEpochs(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-surface accent-accent cursor-pointer" />
              <div className="flex justify-between text-xs text-muted">
                <span>1</span><span>10</span>
              </div>
            </div>
          </div>

          {/* Results dashboard */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mt-6">
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className={`text-lg font-bold ${Number(result.quality) > 85 ? "text-green-400" : Number(result.quality) > 70 ? "text-yellow-400" : "text-red-400"}`}>
                {result.quality}%
              </p>
              <p className="text-xs text-muted">Chất lượng ước tính</p>
            </div>
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className={`text-lg font-bold ${result.overfitRisk === "Thấp" ? "text-green-400" : result.overfitRisk === "Trung bình" ? "text-yellow-400" : "text-red-400"}`}>
                {result.overfitRisk}
              </p>
              <p className="text-xs text-muted">Nguy cơ overfitting</p>
            </div>
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className={`text-lg font-bold ${result.forgettingRisk === "Thấp" ? "text-green-400" : result.forgettingRisk === "Trung bình" ? "text-yellow-400" : "text-red-400"}`}>
                {result.forgettingRisk}
              </p>
              <p className="text-xs text-muted">Nguy cơ quên kiến thức cũ</p>
            </div>
          </div>

          <Callout variant="tip" title="Thử nghiệm">
            Tăng learning rate lên 8-10 và quan sát nguy cơ quên kiến thức cũ tăng vọt.
            Đây chính là catastrophic forgetting!
          </Callout>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ 3. AHA MOMENT ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          <strong>Fine-tuning</strong>{" "}không phải dạy mô hình kiến thức mới từ con số 0 — mà là
          <strong>{" "}kích hoạt và chuyên biệt hoá</strong>{" "}kiến thức mà nó đã biết sẵn.
          Giống như bác sĩ đa khoa đã hiểu cơ thể người, chỉ cần học thêm chuyên khoa
          tim mạch thay vì vào lại trường y từ năm nhất.
        </AhaMoment>
      </LessonSection>

      {/* ━━━ 4. THÁCH THỨC NHỎ ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Bạn fine-tune mô hình trên 500 mẫu dữ liệu pháp lý trong 20 epoch. Mô hình đạt 99% trên dữ liệu huấn luyện nhưng chỉ 60% trên dữ liệu mới. Vấn đề là gì?"
          options={[
            "Dữ liệu không đủ đa dạng và mô hình đã overfitting",
            "Learning rate quá nhỏ",
            "Mô hình gốc quá yếu",
            "Cần thêm GPU mạnh hơn",
          ]}
          correct={0}
          explanation="500 mẫu + 20 epoch = overfitting điển hình. Mô hình 'thuộc bài' thay vì 'hiểu bài'. Giải pháp: thêm dữ liệu, giảm epoch (3-5), hoặc dùng LoRA để hạn chế số tham số thay đổi."
        />
      </LessonSection>

      {/* ━━━ 5. SO SÁNH TRỰC QUAN ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="So sánh">
        <VisualizationSection>
          <svg viewBox="0 0 700 380" className="w-full max-w-3xl mx-auto">
            <text x="350" y="25" textAnchor="middle" fill="var(--text-primary)" fontSize="14" fontWeight="bold">
              Pre-training vs Fine-tuning
            </text>

            {/* Pre-training phase */}
            <rect x="20" y="50" width="310" height="300" rx="12" fill="var(--bg-surface)" stroke="#3b82f6" strokeWidth="1.5" />
            <text x="175" y="77" textAnchor="middle" fill="#3b82f6" fontSize="13" fontWeight="bold">
              Giai đoạn 1: Pre-training
            </text>

            <text x="175" y="100" textAnchor="middle" fill="var(--text-tertiary)" fontSize="10">
              Dữ liệu huấn luyện:
            </text>
            {["Wikipedia (60TB)", "Sách (11TB)", "Mã nguồn (1TB)", "Web crawl (300TB)"].map((d, i) => (
              <g key={i}>
                <rect x="40" y={110 + i * 30} width="270" height="22" rx="4" fill="var(--bg-card)" />
                <text x="175" y={125 + i * 30} textAnchor="middle" fill="var(--text-tertiary)" fontSize="9">
                  {d}
                </text>
              </g>
            ))}

            <text x="175" y="250" textAnchor="middle" fill="#3b82f6" fontSize="10" fontWeight="bold">
              Mục tiêu: Dự đoán từ tiếp theo
            </text>

            <rect x="40" y="265" width="270" height="65" rx="8" fill="var(--bg-card)" />
            <text x="175" y="285" textAnchor="middle" fill="#ef4444" fontSize="9">
              Chi phí: $2-100 triệu USD
            </text>
            <text x="175" y="300" textAnchor="middle" fill="#ef4444" fontSize="9">
              Thời gian: Vài tuần - vài tháng
            </text>
            <text x="175" y="315" textAnchor="middle" fill="#ef4444" fontSize="9">
              Phần cứng: Hàng nghìn GPU
            </text>

            <line x1="330" y1="200" x2="370" y2="200" stroke="var(--text-tertiary)" strokeWidth="2.5" markerEnd="url(#arrow-ft)" />

            {/* Fine-tuning phase */}
            <rect x="370" y="50" width="310" height="300" rx="12" fill="var(--bg-surface)" stroke="#22c55e" strokeWidth="1.5" />
            <text x="525" y="77" textAnchor="middle" fill="#22c55e" fontSize="13" fontWeight="bold">
              Giai đoạn 2: Fine-tuning
            </text>

            <text x="525" y="100" textAnchor="middle" fill="var(--text-tertiary)" fontSize="10">
              Dữ liệu chuyên biệt:
            </text>
            {["Hỏi đáp y khoa (5K mẫu)", "Chẩn đoán (3K mẫu)", "Thuật ngữ chuyên ngành (2K mẫu)"].map((d, i) => (
              <g key={i}>
                <rect x="390" y={110 + i * 30} width="270" height="22" rx="4" fill="var(--bg-card)" />
                <text x="525" y={125 + i * 30} textAnchor="middle" fill="var(--text-tertiary)" fontSize="9">
                  {d}
                </text>
              </g>
            ))}

            <text x="525" y="220" textAnchor="middle" fill="#22c55e" fontSize="10" fontWeight="bold">
              Mục tiêu: Chuyên gia y khoa
            </text>

            <rect x="390" y="240" width="270" height="90" rx="8" fill="var(--bg-card)" />
            <text x="525" y="260" textAnchor="middle" fill="#22c55e" fontSize="9">
              Chi phí: $10 - $1.000
            </text>
            <text x="525" y="278" textAnchor="middle" fill="#22c55e" fontSize="9">
              Thời gian: Vài giờ
            </text>
            <text x="525" y="296" textAnchor="middle" fill="#22c55e" fontSize="9">
              Phần cứng: 1-8 GPU
            </text>
            <text x="525" y="316" textAnchor="middle" fill="#86efac" fontSize="9" fontWeight="bold">
              Kết quả: Mô hình chuyên biệt!
            </text>

            <defs>
              <marker id="arrow-ft" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="var(--text-tertiary)" />
              </marker>
            </defs>
          </svg>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ 6. GIẢI THÍCH SÂU ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Fine-tuning</strong>{" "}là quá trình huấn luyện thêm một mô hình đã được
            pre-train trên tập dữ liệu chuyên biệt nhỏ hơn, nhằm thích ứng mô hình cho
            tác vụ hoặc lĩnh vực cụ thể. Về mặt toán học:
          </p>

          <LaTeX block>{"\\theta^* = \\arg\\min_\\theta \\sum_{(x,y) \\in D_{\\text{ft}}} \\mathcal{L}(f_\\theta(x), y)"}</LaTeX>

          <p>
            Trong đó <LaTeX>{"\\theta"}</LaTeX> được khởi tạo từ trọng số pre-train thay vì
            ngẫu nhiên. Đây chính là sức mạnh của <strong>transfer learning</strong>{" "}
            — không phải bắt đầu từ số 0.
          </p>

          <p>Ba loại fine-tuning phổ biến:</p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>Full Fine-tuning:</strong>{" "}Cập nhật tất cả trọng số. Hiệu quả nhất
              nhưng tốn bộ nhớ GPU và dễ overfitting trên tập nhỏ.
            </li>
            <li>
              <strong>SFT (Supervised Fine-Tuning):</strong>{" "}Huấn luyện trên các cặp
              (instruction, response) để mô hình học cách tuân theo chỉ dẫn.
            </li>
            <li>
              <strong>PEFT (Parameter-Efficient):</strong>{" "}Chỉ cập nhật một phần nhỏ
              trọng số (LoRA, Adapter), tiết kiệm bộ nhớ đáng kể.
            </li>
          </ul>

          <CodeBlock language="python" title="fine_tune_example.py">{`from transformers import AutoModelForCausalLM, Trainer

# Tải mô hình đã pre-train
model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3-8B")

# Chuẩn bị dữ liệu chuyên biệt
dataset = load_medical_qa_dataset()  # 5K mẫu hỏi-đáp y khoa

# Fine-tune với learning rate nhỏ (tránh phá vỡ kiến thức cũ)
trainer = Trainer(
    model=model,
    train_dataset=dataset,
    args=TrainingArguments(
        learning_rate=2e-5,   # Nhỏ hơn pre-training 10-100x
        num_train_epochs=3,   # Ít epoch tránh overfitting
        per_device_train_batch_size=4,
    ),
)
trainer.train()`}</CodeBlock>

          <Callout variant="warning" title="Catastrophic forgetting">
            Khi learning rate quá lớn hoặc fine-tune quá lâu, mô hình có thể quên
            kiến thức nền. Giống như bác sĩ tim mạch quá chuyên sâu đến mức quên
            kiến thức cơ bản về hô hấp. Giải pháp: dùng learning rate nhỏ (1-5e-5),
            ít epoch (2-5), hoặc PEFT.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ 7. TÓM TẮT ━━━ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về Fine-tuning"
          points={[
            "Fine-tuning là huấn luyện thêm mô hình pre-train trên dữ liệu chuyên biệt — tận dụng transfer learning thay vì học từ đầu.",
            "Ba tham số quan trọng: số lượng dữ liệu (càng đa dạng càng tốt), learning rate (nhỏ: 1-5e-5), số epoch (ít: 2-5).",
            "Catastrophic forgetting xảy ra khi mô hình quên kiến thức cũ — dùng LoRA/PEFT để giảm thiểu.",
            "Full FT mạnh nhất nhưng tốn kém. PEFT (LoRA) tiết kiệm hơn 99% tham số mà vẫn hiệu quả.",
          ]}
        />
      </LessonSection>

      {/* ━━━ 8. QUIZ ━━━ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
