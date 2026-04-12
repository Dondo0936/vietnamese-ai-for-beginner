"use client";

import { useState, useMemo } from "react";
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
  slug: "lora",
  title: "LoRA",
  titleVi: "LoRA - Tinh chỉnh hạng thấp",
  description:
    "Kỹ thuật tinh chỉnh hiệu quả, chỉ huấn luyện ma trận nhỏ thay vì toàn bộ mô hình.",
  category: "training-optimization",
  tags: ["lora", "peft", "fine-tuning", "efficiency"],
  difficulty: "intermediate",
  relatedSlugs: ["fine-tuning", "qlora", "quantization"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

const QUIZ: QuizQuestion[] = [
  {
    question: "LoRA tiết kiệm bộ nhớ bằng cách nào?",
    options: [
      "Xoá bớt lớp trong mô hình gốc",
      "Đóng băng trọng số gốc, chỉ huấn luyện hai ma trận nhỏ A và B có tích bằng thay đổi cần thiết",
      "Nén mô hình xuống 4-bit",
      "Giảm kích thước batch size",
    ],
    correct: 1,
    explanation:
      "LoRA giữ nguyên W gốc (đóng băng), chỉ học hai ma trận hạng thấp A (d x r) và B (r x d) sao cho delta W = A x B. Với r << d, số tham số giảm hàng trăm lần.",
  },
  {
    question: "Rank r trong LoRA ảnh hưởng thế nào đến kết quả?",
    options: [
      "r lớn hơn luôn tốt hơn",
      "r nhỏ hơn luôn tốt hơn",
      "r lớn cho phép biểu diễn thay đổi phức tạp hơn nhưng tốn nhiều tham số hơn",
      "r không ảnh hưởng đến kết quả",
    ],
    correct: 2,
    explanation:
      "r là trade-off: r nhỏ (4-8) tiết kiệm nhưng hạn chế; r lớn (32-64) biểu diễn tốt hơn nhưng gần như full fine-tuning. Thực tế r = 8-16 thường là đủ.",
  },
  {
    question: "Lợi thế nào KHÔNG phải của LoRA so với full fine-tuning?",
    options: [
      "Có thể gộp adapter vào mô hình gốc mà không tăng latency",
      "Giảm hơn 99% số tham số cần huấn luyện",
      "Luôn cho kết quả tốt hơn full fine-tuning",
      "Cho phép fine-tune mô hình lớn trên GPU consumer",
    ],
    correct: 2,
    explanation:
      "LoRA KHÔNG luôn tốt hơn full fine-tuning. Trên tập dữ liệu đủ lớn, full FT vẫn có thể cho kết quả cao hơn. LoRA thắng ở hiệu quả, không phải luôn thắng ở chất lượng.",
  },
  {
    type: "fill-blank",
    question:
      "LoRA đóng băng W gốc và chỉ học hai ma trận {blank}-rank A và B. Với chiều d = 4096 và rank r = {blank}, adapter chỉ có ~65K tham số (so với 16.7M của W).",
    blanks: [
      { answer: "low", accept: ["hạng thấp", "thấp"] },
      { answer: "8", accept: ["r=8"] },
    ],
    explanation:
      "LoRA phân tích ΔW = BA với r << d. Với d = 4096, r = 8 → tham số LoRA = 2 × 4096 × 8 ≈ 65K, chỉ bằng 0.39% ma trận gốc. Rank r điển hình là 4-16 cho đa số tác vụ.",
  },
];

export default function LoRATopic() {
  const [rank, setRank] = useState(8);
  const [dim, setDim] = useState(4096);

  const stats = useMemo(() => {
    const originalParams = dim * dim;
    const loraParams = dim * rank + rank * dim;
    const ratio = (loraParams / originalParams * 100);
    return {
      original: originalParams,
      lora: loraParams,
      ratio: ratio.toFixed(3),
      saved: (100 - ratio).toFixed(1),
    };
  }, [rank, dim]);

  return (
    <>
      {/* ━━━ 1. HOOK ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Mô hình Llama 3 có 8 tỷ tham số. Bạn muốn fine-tune nó trên laptop GPU 8GB. Cần tối thiểu bao nhiêu tham số phải huấn luyện?"
          options={[
            "Phải huấn luyện cả 8 tỷ tham số — không có cách nào khác",
            "Chỉ cần huấn luyện khoảng 0.1% (~8 triệu tham số) là đủ",
            "Cần ít nhất 50% (~4 tỷ tham số)",
          ]}
          correct={1}
          explanation="LoRA cho phép fine-tune hiệu quả với chỉ 0.01-0.1% tổng tham số! Bí quyết: thay đổi trọng số nằm trong không gian hạng thấp, không cần cập nhật toàn bộ."
        >
          <p className="text-sm text-muted mt-2">
            Hãy cùng khám phá ý tưởng toán học đằng sau phép màu này.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ 2. TRỰC QUAN HOÁ ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Phân tích ma trận LoRA
          </h3>
          <p className="text-sm text-muted mb-4">
            Kéo thanh trượt để thấy rank r ảnh hưởng đến số tham số.
          </p>

          <div className="space-y-4 max-w-lg mx-auto mb-4">
            <div className="space-y-1">
              <label className="text-sm text-muted">
                Rank r = <strong className="text-foreground">{rank}</strong>
              </label>
              <input type="range" min={1} max={128} step={1} value={rank}
                onChange={e => setRank(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-surface accent-accent cursor-pointer" />
              <div className="flex justify-between text-xs text-muted">
                <span>1 (cực gọn)</span><span>128 (chi tiết)</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted">
                Chiều d = <strong className="text-foreground">{dim.toLocaleString()}</strong>
              </label>
              <input type="range" min={512} max={12288} step={512} value={dim}
                onChange={e => setDim(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-surface accent-accent cursor-pointer" />
              <div className="flex justify-between text-xs text-muted">
                <span>512</span><span>12.288</span>
              </div>
            </div>
          </div>

          {/* Matrix visualization */}
          <svg viewBox="0 0 700 200" className="w-full max-w-3xl mx-auto mb-4">
            {/* Original W */}
            <rect x="20" y="20" width="120" height="120" rx="8"
              fill="#1e3a5f" stroke="#3b82f6" strokeWidth="2" />
            <text x="80" y="70" textAnchor="middle" fill="#60a5fa" fontSize="14" fontWeight="bold">W</text>
            <text x="80" y="90" textAnchor="middle" fill="#94a3b8" fontSize="8">
              {dim} x {dim}
            </text>
            <text x="80" y="155" textAnchor="middle" fill="#3b82f6" fontSize="8">Đóng băng</text>

            <text x="158" y="85" textAnchor="middle" fill="var(--text-primary)" fontSize="20" fontWeight="bold">+</text>

            {/* Matrix A */}
            <rect x="180" y="20" width={Math.max(20, rank * 0.6)} height="120" rx="6"
              fill="#14532d" stroke="#22c55e" strokeWidth="2" />
            <text x={180 + Math.max(10, rank * 0.3)} y="75" textAnchor="middle" fill="#22c55e" fontSize="12" fontWeight="bold">A</text>
            <text x={180 + Math.max(10, rank * 0.3)} y="90" textAnchor="middle" fill="#86efac" fontSize="7">
              {dim} x {rank}
            </text>

            <text x={195 + Math.max(20, rank * 0.6)} y="85" textAnchor="middle" fill="var(--text-primary)" fontSize="14">x</text>

            {/* Matrix B */}
            <rect x={215 + Math.max(20, rank * 0.6)} y={80 - Math.min(rank * 0.5, 60)}
              width="120" height={Math.max(20, Math.min(rank * 1, 120))} rx="6"
              fill="#14532d" stroke="#22c55e" strokeWidth="2" />
            <text x={275 + Math.max(20, rank * 0.6)} y={80} textAnchor="middle" fill="#22c55e" fontSize="12" fontWeight="bold">B</text>
            <text x={275 + Math.max(20, rank * 0.6)} y={93} textAnchor="middle" fill="#86efac" fontSize="7">
              {rank} x {dim}
            </text>

            <text x="500" y="85" textAnchor="middle" fill="var(--text-primary)" fontSize="20">=</text>

            {/* Result */}
            <rect x="530" y="20" width="120" height="120" rx="8"
              fill="#14532d" stroke="#22c55e" strokeWidth="2" />
            <text x="590" y="70" textAnchor="middle" fill="#22c55e" fontSize="12" fontWeight="bold">
              W + AB
            </text>
            <text x="590" y="90" textAnchor="middle" fill="#86efac" fontSize="8">
              {dim} x {dim}
            </text>
          </svg>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-lg font-bold text-blue-400">{(stats.original / 1e6).toFixed(1)}M</p>
              <p className="text-xs text-muted">Tham số gốc W</p>
            </div>
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-lg font-bold text-green-400">
                {stats.lora > 1e6 ? (stats.lora / 1e6).toFixed(1) + "M" : (stats.lora / 1e3).toFixed(0) + "K"}
              </p>
              <p className="text-xs text-muted">Tham số LoRA (A + B)</p>
            </div>
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-lg font-bold text-yellow-400">{stats.ratio}%</p>
              <p className="text-xs text-muted">Tỷ lệ cần huấn luyện</p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ 3. AHA MOMENT ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          Thay đổi trọng số khi fine-tune thực ra nằm trong <strong>không gian hạng thấp</strong>
          — giống như bức tranh phong cảnh dù có hàng triệu pixel nhưng chỉ cần vài nét
          cọ chính là đã nắm bắt được bản chất. <strong>LoRA</strong>{" "}khai thác điều
          này: thay vì cập nhật ma trận khổng lồ W, chỉ cần học hai ma trận mỏng A và B
          mà tích của chúng xấp xỉ thay đổi cần thiết.
        </AhaMoment>
      </LessonSection>

      {/* ━━━ 4. THÁCH THỨC ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Ma trận gốc W có kích thước 4096 x 4096 (16.7M tham số). Với LoRA rank r = 8, tổng tham số của A và B là bao nhiêu?"
          options={[
            "32.768 (4096 x 8)",
            "65.536 (4096 x 8 + 8 x 4096)",
            "16.777.216 (4096 x 4096)",
            "8.192 (4096 x 2)",
          ]}
          correct={1}
          explanation="A có kích thước 4096 x 8 = 32.768 tham số, B có kích thước 8 x 4096 = 32.768 tham số. Tổng = 65.536 — chỉ bằng 0.39% so với ma trận gốc 16.7M!"
        />
      </LessonSection>

      {/* ━━━ 5. GIẢI THÍCH SÂU ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>LoRA (Low-Rank Adaptation)</strong>{" "}dựa trên giả thuyết rằng sự thay đổi
            trọng số khi <TopicLink slug="fine-tuning">fine-tune</TopicLink> có{" "}
            <strong>intrinsic rank thấp</strong>. Thay vì cập nhật
            toàn bộ ma trận W, LoRA phân tích:
          </p>

          <LaTeX block>{"W' = W_0 + \\Delta W = W_0 + \\frac{\\alpha}{r} \\cdot BA"}</LaTeX>

          <p>
            Trong đó <LaTeX>{"W_0"}</LaTeX> đóng băng, <LaTeX>{"B \\in \\mathbb{R}^{d \\times r}"}</LaTeX> và{" "}
            <LaTeX>{"A \\in \\mathbb{R}^{r \\times d}"}</LaTeX> là hai ma trận huấn luyện được, với{" "}
            <LaTeX>{"r \\ll d"}</LaTeX>. Hệ số <LaTeX>{"\\alpha"}</LaTeX> kiểm soát mức độ ảnh hưởng.
          </p>

          <p>Quy trình LoRA gồm 3 bước:</p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>Đóng băng W gốc:</strong>{" "}Ma trận pre-train không bị thay đổi
              — bảo toàn toàn bộ kiến thức nền.
            </li>
            <li>
              <strong>Thêm adapter:</strong>{" "}Khởi tạo A ngẫu nhiên (Gaussian), B = 0.
              Khi bắt đầu, delta W = BA = 0 — mô hình vẫn hoạt động như cũ.
            </li>
            <li>
              <strong>Gộp khi triển khai:</strong>{" "}Sau huấn luyện, tính W' = W + BA
              một lần. Không tăng latency khi suy luận.
            </li>
          </ul>

          <CodeBlock language="python" title="lora_example.py">{`from peft import LoraConfig, get_peft_model

# Cấu hình LoRA
config = LoraConfig(
    r=8,              # Rank — trade-off giữa hiệu quả và chi phí
    lora_alpha=16,    # Hệ số scaling
    target_modules=["q_proj", "v_proj"],  # Áp dụng cho attention
    lora_dropout=0.05,
)

# Thêm LoRA adapter vào mô hình
model = get_peft_model(base_model, config)
model.print_trainable_parameters()
# → trainable: 4.2M / 8B total = 0.05%`}</CodeBlock>

          <Callout variant="insight" title="Nhiều adapter, một mô hình">
            Vì trọng số gốc không đổi, bạn có thể huấn luyện nhiều LoRA adapter cho
            nhiều tác vụ khác nhau (y khoa, pháp luật, lập trình) và hoán đổi nhanh
            chóng mà không cần lưu nhiều bản sao mô hình. Kết hợp với{" "}
            <TopicLink slug="quantization">quantization</TopicLink>{" "}4-bit ta có{" "}
            <TopicLink slug="qlora">QLoRA</TopicLink>{" "}— fine-tune mô hình 65B trên 1 GPU.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ 6. TÓM TẮT ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về LoRA"
          points={[
            "LoRA đóng băng W gốc, chỉ học hai ma trận nhỏ A (d x r) và B (r x d) — giảm hơn 99% tham số huấn luyện.",
            "Rank r là tham số quan trọng nhất: r = 4-16 thường đủ tốt cho hầu hết tác vụ.",
            "Sau huấn luyện có thể gộp W' = W + BA — không tăng latency khi triển khai.",
            "Cho phép fine-tune mô hình 7B trên GPU 24GB, và lưu nhiều adapter cho nhiều tác vụ trên cùng một mô hình gốc.",
          ]}
        />
      </LessonSection>

      {/* ━━━ 7. QUIZ ━━━ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
