"use client";

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
  slug: "mixed-precision",
  title: "Mixed Precision Training",
  titleVi: "Huấn luyện hỗn hợp độ chính xác",
  description:
    "Kỹ thuật kết hợp FP16 và FP32 trong huấn luyện để tăng tốc và giảm bộ nhớ mà vẫn giữ chính xác.",
  category: "training-optimization",
  tags: ["mixed-precision", "fp16", "training", "optimization"],
  difficulty: "advanced",
  relatedSlugs: ["quantization", "lora", "fine-tuning"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

const QUIZ: QuizQuestion[] = [
  {
    question: "Tại sao mixed precision giữ master weights ở FP32 thay vì dùng toàn bộ FP16?",
    options: [
      "Vì FP32 nhanh hơn FP16",
      "Vì gradient rất nhỏ (1e-7) bị làm tròn về 0 trong FP16, nên cập nhật trọng số phải ở FP32 để không mất thông tin",
      "Vì GPU chỉ hỗ trợ FP32",
      "Vì FP16 không lưu được số âm",
    ],
    correct: 1,
    explanation:
      "FP16 có dải số nhỏ nhất ~6e-8. Gradient thường nhỏ hơn (1e-7 * lr), nên bị flush về 0. Master weights FP32 giữ đủ chính xác để tích luỹ các thay đổi nhỏ qua nhiều bước.",
  },
  {
    question: "Loss scaling trong mixed precision để làm gì?",
    options: [
      "Tăng tốc huấn luyện",
      "Nhân loss lên hệ số lớn (vd: 1024) để gradient không bị underflow trong FP16, rồi chia lại trước khi cập nhật",
      "Giảm kích thước mô hình",
      "Chuẩn hoá loss về khoảng [0, 1]",
    ],
    correct: 1,
    explanation:
      "Gradient nhỏ bị flush về 0 trong FP16. Loss scaling nhân lên 1024x → gradient cũng lớn 1024x → nằm trong dải FP16. Trước khi cập nhật, chia lại 1024x để về giá trị đúng.",
  },
  {
    question: "BF16 (bfloat16) khác FP16 ở điểm nào và tại sao LLM ưa dùng BF16?",
    options: [
      "BF16 nhanh hơn FP16",
      "BF16 có dải biểu diễn rộng như FP32 (8 bit exponent) nên ít cần loss scaling, dù chính xác kém hơn FP16",
      "BF16 tương thích nhiều GPU hơn",
      "BF16 dùng ít bộ nhớ hơn FP16",
    ],
    correct: 1,
    explanation:
      "BF16 có 8 bit exponent (như FP32) → dải số rộng, ít underflow. FP16 có 5 bit exponent → dải hẹp, dễ underflow. LLM dùng BF16 vì gần như không cần loss scaling, huấn luyện ổn định hơn.",
  },
];

export default function MixedPrecisionTopic() {
  return (
    <>
      {/* ━━━ 1. HOOK ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Huấn luyện mô hình 7B mất 4 ngày trên 8 GPU. Có cách nào giảm xuống 2 ngày mà KHÔNG mất chất lượng?"
          options={[
            "Mua thêm 8 GPU nữa",
            "Dùng FP16 cho phép tính nặng (nhanh 2x) nhưng giữ FP32 cho bước nhạy cảm (cập nhật trọng số)",
            "Giảm kích thước dữ liệu huấn luyện",
          ]}
          correct={1}
          explanation="Mixed Precision: forward/backward pass dùng FP16 (nhanh 2x trên Tensor Cores), nhưng master weights và cập nhật dùng FP32 (giữ chính xác). Tốn nửa bộ nhớ, nhanh gấp đôi!"
        >
          <p className="text-sm text-muted mt-2">
            Giống xây nhà: dùng bê tông cường độ cao cho móng (FP32), gạch nhẹ cho tường (FP16).
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ 2. TRỰC QUAN HOÁ ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Luồng huấn luyện Mixed Precision
          </h3>
          <p className="text-sm text-muted mb-4">
            Theo dõi dữ liệu chảy qua các giai đoạn với độ chính xác khác nhau.
          </p>

          <svg viewBox="0 0 700 420" className="w-full max-w-3xl mx-auto">
            {/* Master weights FP32 */}
            <rect x="250" y="15" width="200" height="45" rx="8" fill="var(--bg-surface)" stroke="#3b82f6" strokeWidth="2" />
            <text x="350" y="35" textAnchor="middle" fill="#3b82f6" fontSize="10" fontWeight="bold">
              Master Weights (FP32)
            </text>
            <text x="350" y="50" textAnchor="middle" fill="var(--text-tertiary)" fontSize="8">
              Bản gốc — độ chính xác cao
            </text>

            <line x1="350" y1="60" x2="350" y2="80" stroke="var(--text-tertiary)" strokeWidth="1.5" />
            <text x="380" y="75" fill="#f59e0b" fontSize="8">Copy sang FP16</text>

            <rect x="250" y="80" width="200" height="40" rx="8" fill="var(--bg-surface)" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="350" y="105" textAnchor="middle" fill="#f59e0b" fontSize="10" fontWeight="bold">
              FP16 Weights (Bản sao nhẹ)
            </text>

            <line x1="350" y1="120" x2="350" y2="140" stroke="var(--text-tertiary)" strokeWidth="1.5" />

            <rect x="200" y="140" width="300" height="45" rx="8" fill="#14532d" stroke="#22c55e" strokeWidth="1.5" />
            <text x="350" y="160" textAnchor="middle" fill="#22c55e" fontSize="10" fontWeight="bold">
              Forward Pass (FP16) — Nhanh 2x
            </text>
            <text x="350" y="175" textAnchor="middle" fill="#86efac" fontSize="8">
              Nhân ma trận trên Tensor Cores
            </text>

            <line x1="350" y1="185" x2="350" y2="205" stroke="var(--text-tertiary)" strokeWidth="1.5" />

            <rect x="250" y="205" width="200" height="40" rx="8" fill="var(--bg-surface)" stroke="#ef4444" strokeWidth="1.5" />
            <text x="350" y="222" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">
              Loss (FP32)
            </text>
            <text x="350" y="237" textAnchor="middle" fill="#fca5a5" fontSize="8">
              Loss Scaling: x1024
            </text>

            <line x1="350" y1="245" x2="350" y2="265" stroke="var(--text-tertiary)" strokeWidth="1.5" />

            <rect x="200" y="265" width="300" height="45" rx="8" fill="#14532d" stroke="#22c55e" strokeWidth="1.5" />
            <text x="350" y="285" textAnchor="middle" fill="#22c55e" fontSize="10" fontWeight="bold">
              Backward Pass (FP16) — Nhanh 2x
            </text>
            <text x="350" y="300" textAnchor="middle" fill="#86efac" fontSize="8">
              Tính gradient bằng FP16
            </text>

            <line x1="350" y1="310" x2="350" y2="330" stroke="var(--text-tertiary)" strokeWidth="1.5" />

            <rect x="200" y="330" width="300" height="45" rx="8" fill="var(--bg-surface)" stroke="#3b82f6" strokeWidth="2" />
            <text x="350" y="350" textAnchor="middle" fill="#3b82f6" fontSize="10" fontWeight="bold">
              Cập nhật Master Weights (FP32)
            </text>
            <text x="350" y="365" textAnchor="middle" fill="#93c5fd" fontSize="8">
              Unscale gradient → cập nhật FP32
            </text>

            {/* Loop arrow */}
            <path d="M 500 352 L 520 352 L 520 37 L 450 37" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="4,3" markerEnd="url(#arr-mp)" />
            <text x="535" y="195" fill="#8b5cf6" fontSize="8" transform="rotate(90, 535, 195)">
              Lặp lại mỗi batch
            </text>

            <defs>
              <marker id="arr-mp" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#8b5cf6" />
              </marker>
            </defs>
          </svg>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mt-4">
            <div className="rounded-lg bg-background/50 border border-green-500/30 p-3 text-center">
              <p className="text-lg font-bold text-green-400">~2x</p>
              <p className="text-xs text-muted">Tăng tốc huấn luyện</p>
            </div>
            <div className="rounded-lg bg-background/50 border border-green-500/30 p-3 text-center">
              <p className="text-lg font-bold text-green-400">~50%</p>
              <p className="text-xs text-muted">Giảm bộ nhớ GPU</p>
            </div>
            <div className="rounded-lg bg-background/50 border border-green-500/30 p-3 text-center">
              <p className="text-lg font-bold text-green-400">~0%</p>
              <p className="text-xs text-muted">Mất mát chất lượng</p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ 3. AHA MOMENT ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          Không phải mọi phép tính đều cần chính xác như nhau! <strong>Nhân ma trận</strong>{" "}
          (forward/backward) chịu được sai số nhỏ — dùng FP16 nhanh 2x. Nhưng{" "}
          <strong>cập nhật trọng số</strong>{" "}cần tích luỹ thay đổi cực nhỏ qua hàng
          triệu bước — phải dùng FP32. Mixed Precision khai thác đúng sự khác biệt này.
        </AhaMoment>
      </LessonSection>

      {/* ━━━ 4. THÁCH THỨC ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Gradient có giá trị 1e-8. FP16 có số nhỏ nhất ~6e-8. Điều gì xảy ra khi lưu gradient này ở FP16?"
          options={[
            "Gradient được lưu chính xác",
            "Gradient bị làm tròn về 0 (underflow) — trọng số không được cập nhật",
            "Gradient bị làm tròn lên 6e-8",
            "FP16 tự động chuyển sang FP32",
          ]}
          correct={1}
          explanation="1e-8 < 6e-8 (số nhỏ nhất FP16) → bị flush về 0. Trọng số không thay đổi = không học được. Loss scaling nhân gradient lên 1024x → 1e-5 → nằm trong dải FP16!"
        />
      </LessonSection>

      {/* ━━━ 5. GIẢI THÍCH SÂU ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Mixed Precision Training</strong>{" "}(Micikevicius et al., 2018) kết hợp
            FP16 và FP32 qua 3 kỹ thuật:
          </p>

          <p><strong>1. FP32 Master Weights:</strong></p>
          <LaTeX block>{"W_{\\text{FP32}} \\leftarrow W_{\\text{FP32}} - \\eta \\cdot \\text{unscale}(g_{\\text{FP16}})"}</LaTeX>
          <p>
            Giữ bản sao FP32 để tích luỹ gradient nhỏ qua nhiều bước mà không bị mất.
          </p>

          <p><strong>2. Loss Scaling:</strong></p>
          <LaTeX block>{"\\hat{L} = S \\cdot L \\quad \\Rightarrow \\quad \\hat{g} = S \\cdot g \\quad \\Rightarrow \\quad g = \\hat{g} / S"}</LaTeX>
          <p>
            Nhân loss lên S (thường 1024-65536) trước backward, gradient cũng tăng S lần.
            Trước khi cập nhật, chia lại S.
          </p>

          <p><strong>3. FP16 Compute:</strong></p>
          <p>
            Forward và backward pass dùng FP16 trên Tensor Cores — nhanh 2-8x tuỳ kiến
            trúc GPU (Volta, Ampere, Hopper).
          </p>

          <CodeBlock language="python" title="mixed_precision.py">{`from torch.amp import autocast, GradScaler

scaler = GradScaler()  # Loss scaling tự động

for batch in dataloader:
    optimizer.zero_grad()

    # Forward pass FP16 tự động
    with autocast(device_type="cuda", dtype=torch.float16):
        output = model(batch)
        loss = criterion(output, target)

    # Backward pass + loss scaling
    scaler.scale(loss).backward()   # Nhân loss lên S
    scaler.step(optimizer)           # Unscale + cập nhật FP32
    scaler.update()                  # Điều chỉnh S`}</CodeBlock>

          <Callout variant="insight" title="BF16 — Tương lai của mixed precision">
            BF16 (Brain Float 16) có 8 bit exponent như FP32 → dải số rộng, gần
            như không cần loss scaling. Từ GPU Ampere (A100) trở đi, BF16 là lựa
            chọn mặc định cho huấn luyện LLM. PyTorch, JAX đều hỗ trợ native.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ 6. TÓM TẮT ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về Mixed Precision"
          points={[
            "FP16 cho forward/backward (nhanh 2x), FP32 cho master weights (giữ chính xác) — tốt nhất của cả hai.",
            "Loss scaling ngăn gradient underflow: nhân lên trước backward, chia lại trước update.",
            "BF16 có dải rộng như FP32 → gần như không cần loss scaling. Là tiêu chuẩn cho huấn luyện LLM từ 2022.",
            "Giảm 50% bộ nhớ, tăng 2x tốc độ, mất ~0% chất lượng. Đây là baseline mà MỌI huấn luyện LLM đều dùng.",
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
