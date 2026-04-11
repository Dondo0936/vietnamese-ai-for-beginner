"use client";

import { useState } from "react";
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
  slug: "data-augmentation",
  title: "Data Augmentation",
  titleVi: "Tăng cường dữ liệu",
  description:
    "Kỹ thuật mở rộng tập dữ liệu huấn luyện bằng cách tạo biến thể mới từ dữ liệu gốc, giảm overfitting.",
  category: "computer-vision",
  tags: ["computer-vision", "training", "regularization"],
  difficulty: "beginner",
  relatedSlugs: ["overfitting-underfitting", "image-classification", "regularization"],
  vizType: "interactive",
};

/* ── data ─────────────────────────────────────────────────── */
interface AugType { name: string; transform: string; description: string }

const AUGMENTATIONS: AugType[] = [
  { name: "Gốc", transform: "", description: "Ảnh gốc không biến đổi" },
  { name: "Lật ngang", transform: "scale(-1, 1) translate(-120, 0)", description: "Phản chiếu theo trục dọc" },
  { name: "Xoay 15 độ", transform: "rotate(15, 60, 60)", description: "Xoay nhẹ quanh tâm" },
  { name: "Phóng to", transform: "scale(1.3) translate(-18, -18)", description: "Thu phóng ngẫu nhiên" },
  { name: "Dịch chuyển", transform: "translate(15, 10)", description: "Dịch vị trí ngẫu nhiên" },
  { name: "Xoay -10 độ", transform: "rotate(-10, 60, 60)", description: "Xoay ngược nhẹ" },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Tại sao Data Augmentation giúp giảm overfitting?",
    options: [
      "Vì nó giảm số parameter của mô hình",
      "Vì mô hình thấy nhiều biến thể hơn, học được tính bất biến thay vì nhớ tập train",
      "Vì ảnh augmented dễ phân loại hơn ảnh gốc",
      "Vì augmentation thay đổi nhãn của dữ liệu",
    ],
    correct: 1,
    explanation: "Augmentation tạo nhiều biến thể (xoay, lật, đổi sáng) giúp mô hình học được tính invariance -- nhận ra xe máy dù chụp từ góc nào, ánh sáng nào.",
  },
  {
    question: "Phép augmentation nào KHÔNG nên dùng cho bài toán nhận dạng chữ số viết tay?",
    options: [
      "Thay đổi độ sáng",
      "Lật ngang (horizontal flip)",
      "Xoay nhẹ (5-10 độ)",
      "Thêm nhiễu Gaussian",
    ],
    correct: 1,
    explanation: "Lật ngang số '6' thành '6' ngược (giống số '9') -- sai nhãn! Augmentation phải BẢO TOÀN NHÃN. Cần chọn phép biến đổi phù hợp từng bài toán.",
  },
  {
    question: "MixUp tạo dữ liệu mới bằng cách nào?",
    options: [
      "Cắt và dán vùng từ ảnh này sang ảnh khác",
      "Trộn 2 ảnh với trọng số ngẫu nhiên, nhãn cũng trộn tương ứng",
      "Thêm nhiễu ngẫu nhiên vào ảnh",
      "Xoay ảnh 180 độ",
    ],
    correct: 1,
    explanation: "MixUp: ảnh mới = lambda * ảnh_A + (1-lambda) * ảnh_B, nhãn mới = lambda * nhãn_A + (1-lambda) * nhãn_B. Giúp mô hình học quyết định mềm (soft decisions).",
  },
];

/* ── component ────────────────────────────────────────────── */
export default function DataAugmentationTopic() {
  const [activeAugs, setActiveAugs] = useState<Set<number>>(new Set([0]));

  const toggleAug = (idx: number) => {
    const next = new Set(activeAugs);
    if (next.has(idx)) { if (idx !== 0) next.delete(idx); }
    else next.add(idx);
    setActiveAugs(next);
  };

  return (
    <>
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Bạn chỉ có 100 ảnh xe máy để huấn luyện mô hình phân loại. Mô hình bị overfitting nặng. Cách nào tốt nhất để cải thiện mà KHÔNG cần thu thập thêm ảnh?"
          options={[
            "Tăng số epoch huấn luyện",
            "Tạo biến thể mới từ 100 ảnh gốc (lật, xoay, đổi sáng...)",
            "Giảm learning rate xuống rất nhỏ",
          ]}
          correct={1}
          explanation="Data Augmentation tạo hàng nghìn biến thể từ dữ liệu có sẵn. 100 ảnh gốc x 10 phép biến đổi = 1000 ảnh huấn luyện! Mô hình học được tính bất biến thay vì nhớ tập train."
        >

      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {AUGMENTATIONS.map((aug, i) => (
                <button
                  key={aug.name}
                  type="button"
                  onClick={() => toggleAug(i)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    activeAugs.has(i)
                      ? "bg-accent text-white"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                >
                  {aug.name}
                </button>
              ))}
            </div>

            <svg viewBox="0 0 600 260" className="w-full max-w-2xl mx-auto">
              {Array.from(activeAugs).map((augIdx, pos) => {
                const aug = AUGMENTATIONS[augIdx];
                const col = pos % 3;
                const row = Math.floor(pos / 3);
                const x = 50 + col * 190;
                const y = 10 + row * 140;
                return (
                  <g key={augIdx}>
                    <rect x={x} y={y} width="140" height="105" rx="8"
                      fill="#1e293b" stroke={augIdx === 0 ? "#3b82f6" : "#22c55e"} strokeWidth="1.5" />
                    <g transform={`translate(${x + 10}, ${y + 8})`}>
                      <g transform={aug.transform}>
                        <ellipse cx="60" cy="55" rx="35" ry="25" fill="#94a3b8" opacity={0.6} />
                        <circle cx="60" cy="30" r="18" fill="#94a3b8" opacity={0.7} />
                        <polygon points="47,15 42,5 52,12" fill="#94a3b8" />
                        <polygon points="73,15 78,5 68,12" fill="#94a3b8" />
                        <circle cx="54" cy="28" r="3" fill="#22c55e" />
                        <circle cx="66" cy="28" r="3" fill="#22c55e" />
                        <circle cx="60" cy="34" r="2" fill="#ec4899" />
                        <path d="M95,50 Q110,30 105,55" fill="none" stroke="#94a3b8" strokeWidth="3" />
                      </g>
                    </g>
                    <text x={x + 70} y={y + 100} textAnchor="middle"
                      fill={augIdx === 0 ? "#3b82f6" : "#22c55e"} fontSize="10" fontWeight="bold">
                      {aug.name}
                    </text>
                  </g>
                );
              })}
            </svg>

            <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
              <p className="text-sm text-muted">
                <strong className="text-accent">{activeAugs.size}</strong> biến thể từ 1 ảnh gốc.
                Nhấn các nút để bật/tắt phép biến đổi.
                Tất cả đều là <strong>cùng con mèo</strong> -- nhãn không thay đổi!
              </p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Data Augmentation dạy mô hình tính <strong>bất biến</strong>{" "}(invariance): mèo lật ngược vẫn là mèo,
            xe máy xoay nghiêng vẫn là xe máy. Giống cách trẻ em Việt Nam nhận ra
            <strong>{" "}phở</strong> dù bát to, bát nhỏ, góc chụp khác nhau -- vì đã thấy <strong>nhiều biến thể</strong>!
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Bạn augment ảnh chữ số viết tay bằng cách lật ngang (horizontal flip). Chữ số '6' bị lật thành hình giống '6' ngược. Vấn đề gì xảy ra?"
          options={[
            "Không vấn đề gì vì ảnh vẫn rõ nét",
            "Nhãn bị sai vì '6' ngược trông giống '9'",
            "Mô hình sẽ chạy chậm hơn",
          ]}
          correct={1}
          explanation="Augmentation phải BẢO TOÀN NHÃN! Lật '6' thành '9' là gán nhãn sai. Cần chọn phép biến đổi phù hợp từng bài toán -- không phải augmentation nào cũng đúng!"
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={8} label="Giải thích sâu">
        <ExplanationSection>
          <p>
            <strong>Data Augmentation</strong>{" "}tạo thêm dữ liệu huấn luyện bằng cách áp dụng các phép biến đổi lên
            dữ liệu gốc. Đây là phương pháp regularization hiệu quả, giảm overfitting đáng kể.
          </p>

          <Callout variant="insight" title="Ba nhóm phép biến đổi">
            <div className="space-y-2 text-sm">
              <p><strong>1. Hình học:</strong>{" "}Lật (flip), xoay (rotate), cắt (crop), co giãn (scale), dịch chuyển (translate)</p>
              <p><strong>2. Quang học:</strong>{" "}Đổi độ sáng, contrast, bão hoà màu, thêm nhiễu, làm mờ</p>
              <p><strong>3. Nâng cao:</strong>{" "}MixUp, CutMix, AutoAugment, RandAugment</p>
            </div>
          </Callout>

          <p><strong>MixUp</strong>{" "}-- trộn 2 ảnh:</p>
          <LaTeX block>{"\\tilde{x} = \\lambda x_i + (1-\\lambda) x_j, \\quad \\tilde{y} = \\lambda y_i + (1-\\lambda) y_j"}</LaTeX>
          <p className="text-sm text-muted">
            Với <LaTeX>{"\\lambda \\sim \\text{Beta}(\\alpha, \\alpha)"}</LaTeX>. Giúp mô hình học quyết định mềm, giảm overconfidence.
          </p>

          <p><strong>CutMix</strong>{" "}-- cắt dán vùng:</p>
          <LaTeX block>{"\\tilde{x} = M \\odot x_i + (1-M) \\odot x_j"}</LaTeX>
          <p className="text-sm text-muted">
            M là mask nhị phân hình chữ nhật. Nhãn tỷ lệ theo diện tích vùng. Hiệu quả hơn CutOut vì không lãng phí pixel.
          </p>

          <Callout variant="warning" title="Nguyên tắc quan trọng">
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Bảo toàn nhãn:</strong>{" "}Biến đổi không được thay đổi ý nghĩa nhãn</li>
              <li><strong>Domain-specific:</strong>{" "}Ảnh y tế không nên đổi màu quá mạnh, ảnh vệ tinh cần augmentation khác ảnh selfie</li>
              <li><strong>AutoAugment:</strong>{" "}Dùng RL/search tự động tìm policy augmentation tối ưu cho dataset cụ thể</li>
            </ul>
          </Callout>

          <CodeBlock language="python" title="Data Augmentation với Albumentations">
{`import albumentations as A
from albumentations.pytorch import ToTensorV2

# Pipeline augmentation cho ảnh giao thông Việt Nam
train_transform = A.Compose([
    A.HorizontalFlip(p=0.5),        # Lật ngang
    A.RandomRotate90(p=0.2),         # Xoay 90 độ
    A.ShiftScaleRotate(              # Dịch + zoom + xoay
        shift_limit=0.1,
        scale_limit=0.2,
        rotate_limit=15,
        p=0.5,
    ),
    A.OneOf([                        # 1 trong 3 biến đổi quang học
        A.RandomBrightnessContrast(p=1),
        A.HueSaturationValue(p=1),
        A.GaussNoise(p=1),
    ], p=0.5),
    A.CoarseDropout(                 # CutOut: che vùng ngẫu nhiên
        max_holes=8, max_height=32,
        max_width=32, p=0.3,
    ),
    A.Normalize(),
    ToTensorV2(),
])

# 1 ảnh gốc -> nhiều biến thể mỗi epoch
augmented = train_transform(image=image)
aug_image = augmented["image"]`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={8} label="Tóm tắt">
        <MiniSummary points={[
          "Data Augmentation tạo biến thể mới từ dữ liệu gốc, giúp mô hình học tính bất biến",
          "3 nhóm: hình học (lật, xoay), quang học (sáng, màu), nâng cao (MixUp, CutMix)",
          "Nguyên tắc vàng: phép biến đổi phải BẢO TOÀN NHÃN -- chọn phù hợp từng bài toán",
          "AutoAugment tự tìm policy tối ưu; Albumentations là thư viện phổ biến nhất",
        ]} />
      </LessonSection>

      <LessonSection step={7} totalSteps={8} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
