"use client";

import { useState, useCallback } from "react";
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
  slug: "ai-watermarking",
  title: "AI Watermarking",
  titleVi: "Đánh dấu nội dung AI",
  description:
    "Kỹ thuật nhúng dấu hiệu ẩn vào nội dung do AI tạo ra để xác minh nguồn gốc",
  category: "ai-safety",
  tags: ["watermark", "detection", "provenance"],
  difficulty: "intermediate",
  relatedSlugs: ["guardrails", "ai-governance", "text-to-image"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

const SENTENCE = [
  { word: "Vịnh", list: "red" as const },
  { word: "Hạ", list: "green" as const },
  { word: "Long", list: "green" as const },
  { word: "là", list: "green" as const },
  { word: "một", list: "red" as const },
  { word: "kỳ", list: "green" as const },
  { word: "quan", list: "green" as const },
  { word: "thiên", list: "green" as const },
  { word: "nhiên", list: "green" as const },
  { word: "tuyệt", list: "green" as const },
  { word: "đẹp", list: "green" as const },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Watermark cho văn bản AI hoạt động bằng cách nào?",
    options: [
      "Chèn ký tự ẩn vào văn bản",
      "Chia từ vựng thành green/red list, thiên vị chọn từ green khi sinh — tỷ lệ green cao bất thường = AI viết",
      "Thêm metadata vào file",
      "Thay đổi font chữ",
    ],
    correct: 1,
    explanation:
      "Phương pháp Kirchenbauer: dùng hash của token trước để chia từ vựng thành green/red list ngẫu nhiên. Cộng bias vào logits của green tokens → AI ưu tiên chọn từ green. Khi kiểm tra, nếu tỷ lệ green cao hơn 50% đáng kể → có watermark.",
  },
  {
    question: "Kẻ xấu paraphrase (viết lại) văn bản AI để xoá watermark. Cách nào giảm thiểu?",
    options: [
      "Tăng bias cho green tokens thật cao",
      "Kết hợp watermark văn bản + watermark ngữ nghĩa (semantic watermark) — dù viết lại câu, ý nghĩa vẫn mang dấu hiệu",
      "Không thể ngăn được paraphrase",
      "Cấm người dùng copy-paste",
    ],
    correct: 1,
    explanation:
      "Token-level watermark dễ bị phá bằng paraphrase. Semantic watermark nhúng dấu hiệu vào CẤP ĐỘ Ý NGHĨA — dù diễn đạt lại, cấu trúc ngữ nghĩa vẫn mang watermark. Tương tự watermark ảnh nhúng vào tần số, bền hơn với crop/resize.",
  },
  {
    question: "Tiếng Việt có thách thức gì đặc biệt cho text watermarking?",
    options: [
      "Tiếng Việt không thể watermark",
      "Tiếng Việt có ít token hơn trong từ vựng LLM (tokenized kém hiệu quả) → green/red list nhỏ hơn → watermark yếu hơn, cần nhiều văn bản hơn để phát hiện",
      "Tiếng Việt có dấu nên dễ watermark hơn",
      "Không có thách thức đặc biệt",
    ],
    correct: 1,
    explanation:
      "Tokenizer (BPE) của GPT/LLaMA chia tiếng Việt thành nhiều sub-tokens hơn tiếng Anh (1 từ Việt = 2-3 tokens). Từ vựng effective nhỏ hơn → green/red partition kém đa dạng → cần đoạn văn dài hơn (200+ tokens) để phát hiện watermark đáng tin cậy.",
  },
];

export default function AIWatermarkingTopic() {
  const [showWatermark, setShowWatermark] = useState(false);
  const toggleWatermark = useCallback(() => { setShowWatermark((p) => !p); }, []);

  const greenCount = SENTENCE.filter((w) => w.list === "green").length;
  const greenRatio = greenCount / SENTENCE.length;

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Sinh viên nộp bài luận. Làm sao giáo viên biết bài do AI viết mà KHÔNG cần đọc nội dung?"
          options={[
            "Không thể biết nếu không đọc",
            "Phân tích thống kê: AI watermark nhúng pattern ẩn vào phân phối từ — phát hiện bằng toán, không cần đọc nội dung",
            "Kiểm tra metadata file",
          ]}
          correct={1}
          explanation="AI Watermarking nhúng dấu hiệu thống kê ẩn vào văn bản: LLM ưu tiên chọn từ từ 'danh sách xanh' bí mật. Văn bản đọc bình thường, nhưng khi phân tích tỷ lệ từ xanh cao BẤT THƯỜNG → chứng tỏ do AI viết. Giống chữ ký ẩn trong bức tranh!"
        />
      </LessonSection>

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Nhấn nút để{" "}
          <strong>hiện watermark ẩn</strong>{" "}
          trong đoạn văn bản AI. Từ xanh = green list (AI ưu tiên chọn). Từ đỏ = red list. Tỷ lệ xanh cao bất thường = bằng chứng AI viết.
        </p>
        <VisualizationSection>
          <div className="space-y-4">
            <div className="flex justify-center">
              <button type="button" onClick={toggleWatermark} className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${showWatermark ? "bg-accent text-white" : "bg-card border border-border text-muted hover:text-foreground"}`}>
                {showWatermark ? "Ẩn watermark" : "Hiện watermark ẩn"}
              </button>
            </div>
            <svg viewBox="0 0 620 280" className="w-full max-w-2xl mx-auto">
              <text x={310} y={22} textAnchor="middle" fontSize={12} fill="#94a3b8" fontWeight="bold">Văn bản do AI tạo ra:</text>
              {SENTENCE.map((w, i) => {
                const x = 25 + (i % 6) * 98;
                const y = 35 + Math.floor(i / 6) * 45;
                return (
                  <g key={i}>
                    <rect x={x} y={y} width={90} height={32} fill={showWatermark ? (w.list === "green" ? "#dcfce7" : "#fee2e2") : "#f1f5f9"} rx={5} stroke={showWatermark ? (w.list === "green" ? "#22c55e" : "#ef4444") : "#e2e8f0"} strokeWidth={showWatermark ? 2 : 1} />
                    <text x={x + 45} y={y + 20} textAnchor="middle" fontSize={12} fill="#0f172a" fontWeight="bold">{w.word}</text>
                  </g>
                );
              })}
              {showWatermark && (
                <g transform="translate(25, 135)">
                  <rect x={0} y={0} width={15} height={15} fill="#dcfce7" stroke="#22c55e" rx={2} />
                  <text x={20} y={12} fontSize={10} fill="#166534">Green list ({greenCount}/{SENTENCE.length})</text>
                  <rect x={200} y={0} width={15} height={15} fill="#fee2e2" stroke="#ef4444" rx={2} />
                  <text x={220} y={12} fontSize={10} fill="#991b1b">Red list ({SENTENCE.length - greenCount}/{SENTENCE.length})</text>
                </g>
              )}
              <g transform="translate(25, 165)">
                <rect x={0} y={0} width={570} height={90} fill="#f8fafc" rx={8} stroke="#e2e8f0" />
                <text x={285} y={20} textAnchor="middle" fontSize={12} fill="#64748b" fontWeight="bold">Phân tích thống kê</text>
                <rect x={15} y={30} width={540} height={18} fill="#fee2e2" rx={4} />
                <rect x={15} y={30} width={540 * greenRatio} height={18} fill="#22c55e" rx={4} />
                <text x={285} y={44} textAnchor="middle" fontSize={10} fill="white" fontWeight="bold">Tỷ lệ green: {Math.round(greenRatio * 100)}% (kỳ vọng ngẫu nhiên: 50%)</text>
                <text x={285} y={73} textAnchor="middle" fontSize={11} fill={greenRatio > 0.6 ? "#166534" : "#64748b"} fontWeight="bold">
                  {greenRatio > 0.6 ? "Ty le green cao bat thuong → CO watermark (do AI viet)" : "Ty le binh thuong → Kho xac dinh"}
                </text>
              </g>
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          Watermark AI giống{" "}
          <strong>tiền giả với dải bảo mật</strong>{" "}
          — mắt thường đọc văn bản bình thường, nhưng{" "}
          <strong>phân tích thống kê</strong>{" "}
          phát hiện pattern ẩn. Tỷ lệ green tokens {Math.round(greenRatio * 100)}% thay vì 50% ngẫu nhiên — xác suất xảy ra tự nhiên{" "}
          <strong>cực kỳ nhỏ</strong>, gần như chắc chắn do AI viết.
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question="Sinh viên dùng ChatGPT viết bài rồi paraphrase (viết lại) 30% câu. Watermark còn phát hiện được không?"
          options={[
            "Không — paraphrase xoá sạch watermark",
            "Phát hiện được PHẦN CHƯA BỊ VIẾT LẠI (70%), nhưng confidence thấp hơn. Cần đoạn văn đủ dài để đảm bảo thống kê",
            "Phát hiện 100% vì watermark không bị ảnh hưởng",
            "Phụ thuộc vào ngôn ngữ",
          ]}
          correct={1}
          explanation="Paraphrase phá huỷ watermark ở câu bị viết lại, nhưng 70% còn lại vẫn mang dấu hiệu. Nếu đoạn văn đủ dài (>200 tokens), phân tích z-score vẫn phát hiện được tỷ lệ green cao bất thường. Đây là trade-off: watermark mạnh hơn (bias cao) = chất lượng văn bản giảm."
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p><strong>AI Watermarking</strong>{" "} là kỹ thuật nhúng dấu hiệu ẩn vào nội dung AI, cho phép phát hiện nguồn gốc mà không ảnh hưởng đến chất lượng.</p>
          <Callout variant="insight" title="Cách hoạt động (Kirchenbauer et al., 2023)">
            <div className="space-y-2">
              <p><strong>1. Chia từ vựng:</strong>{" "} Dùng hash(token trước) chia từ vựng thành green list và red list — ngẫu nhiên nhưng deterministic.</p>
              <p><strong>2. Thiên vị khi sinh:</strong>{" "} Cộng bias delta vào logits của green tokens trước softmax. AI ưu tiên chọn từ green.</p>
              <p><strong>3. Phát hiện:</strong>{" "} Đếm số green tokens. Nếu z-score cao (tỷ lệ green cao hơn 50% đáng kể) → có watermark.</p>
            </div>
          </Callout>
          <p>Z-score phát hiện watermark:</p>
          <LaTeX block>{"z = \\frac{|g| - T/2}{\\sqrt{T/4}} \\quad \\text{(} |g| \\text{ = số green tokens, } T \\text{ = tổng tokens)}"}</LaTeX>
          <p className="text-sm text-muted">
            Nếu <LaTeX>{"z > 4"}</LaTeX> (p-value &lt; 0.00003), gần như chắc chắn có watermark. Văn bản con người ngẫu nhiên sẽ có <LaTeX>{"z \\approx 0"}</LaTeX>.
          </p>
          <CodeBlock language="python" title="watermark_detect.py">
{`import hashlib
import numpy as np

def detect_watermark(tokens, vocab_size, gamma=0.5):
    """Phát hiện watermark trong chuỗi token"""
    green_count = 0
    total = len(tokens) - 1  # Bỏ token đầu

    for i in range(1, len(tokens)):
        # Hash token trước để tạo green list
        seed = hashlib.sha256(
            str(tokens[i-1]).encode()
        ).hexdigest()
        rng = np.random.RandomState(int(seed[:8], 16))
        green_list = set(rng.choice(
            vocab_size, int(vocab_size * gamma), replace=False
        ))

        if tokens[i] in green_list:
            green_count += 1

    # Tính z-score
    z = (green_count - total * gamma) / np.sqrt(
        total * gamma * (1 - gamma)
    )
    return {
        "z_score": z,
        "green_ratio": green_count / total,
        "is_ai": z > 4.0,  # Threshold
        "confidence": f"{'Cao' if z > 6 else 'Vừa' if z > 4 else 'Thấp'}",
    }`}
          </CodeBlock>
          <Callout variant="warning" title="Thách thức watermark cho tiếng Việt">
            <div className="space-y-1">
              <p><strong>Tokenization:</strong>{" "} BPE chia tiếng Việt thành 2-3 tokens/từ (nhiều hơn tiếng Anh) → effective vocabulary nhỏ → watermark yếu hơn.</p>
              <p><strong>Paraphrase:</strong>{" "} Tiếng Việt linh hoạt trong diễn đạt → dễ paraphrase xoá watermark.</p>
              <p><strong>Ảnh AI:</strong>{" "} Watermark cho ảnh (Stable Diffusion, DALL-E) nhúng vào tần số không gian — bền hơn với chỉnh sửa.</p>
            </div>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Ứng dụng">
        <ExplanationSection>
          <Callout variant="tip" title="Watermark trong thực tế">
            <div className="space-y-1">
              <p><strong>Giáo dục:</strong>{" "} Phát hiện bài luận do AI viết — hỗ trợ giáo viên Việt Nam.</p>
              <p><strong>Tin tức:</strong>{" "} Ghi nhãn tin tức do AI tạo — chống tin giả trên mạng xã hội VN.</p>
              <p><strong>Pháp luật:</strong>{" "} EU AI Act yêu cầu ghi nhãn nội dung AI — watermark là giải pháp kỹ thuật.</p>
              <p><strong>Google SynthID:</strong>{" "} Watermark cho ảnh, văn bản, audio do Google AI tạo.</p>
            </div>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về AI Watermarking"
          points={[
            "Watermark văn bản: chia từ vựng thành green/red, thiên vị green khi sinh. Tỷ lệ green cao = AI viết.",
            "Phát hiện bằng z-score: z > 4 gần như chắc chắn có watermark (p < 0.00003).",
            "Paraphrase có thể phá huỷ watermark — cần semantic watermark bền hơn.",
            "Tiếng Việt tokenize kém hiệu quả → watermark yếu hơn tiếng Anh, cần văn bản dài hơn.",
            "Ứng dụng: phát hiện bài AI trong giáo dục, ghi nhãn tin tức AI, tuân thủ EU AI Act.",
          ]}
        />
      </LessonSection>

      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
