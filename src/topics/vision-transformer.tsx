"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
  slug: "vision-transformer",
  title: "Vision Transformer (ViT)",
  titleVi: "Transformer thị giác",
  description: "Áp dụng kiến trúc Transformer trực tiếp cho hình ảnh bằng cách chia ảnh thành các patch",
  category: "dl-architectures",
  tags: ["vit", "image-patches", "transformer"],
  difficulty: "intermediate",
  relatedSlugs: ["transformer", "cnn", "image-classification", "self-attention"],
  vizType: "interactive",
};

const PATCH_COLORS = [
  "#3b82f6", "#8b5cf6", "#ef4444", "#22c55e",
  "#f59e0b", "#ec4899", "#06b6d4", "#f97316", "#84cc16",
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "ViT chia ảnh 224×224 thành patches 16×16. Có bao nhiêu patches (tokens)?",
    options: [
      "224 / 16 = 14 patches",
      "(224/16)² = 14² = 196 patches + 1 [CLS] token = 197 tokens",
      "16 × 16 = 256 patches",
    ],
    correct: 1,
    explanation: "14 hàng × 14 cột = 196 patches. Thêm 1 [CLS] token đặc biệt để tổng hợp thông tin → 197 tokens. Mỗi patch 16×16×3 = 768 pixel → flatten → Linear projection → 768-dim embedding (giống word embedding!)",
  },
  {
    question: "ViT cần bao nhiêu dữ liệu để vượt CNN (ResNet)?",
    options: [
      "Ít hơn CNN — ViT hiệu quả hơn",
      "ImageNet (1.4M) là đủ",
      "Rất nhiều: JFT-300M (300 triệu ảnh). Với ít data, CNN thắng nhờ inductive bias cục bộ",
    ],
    correct: 2,
    explanation: "CNN có inductive bias: locality (nhìn cục bộ) + translation equivariance (chia sẻ bộ lọc). ViT không có → phải học từ data. Với ImageNet (1.4M), ResNet thắng. Với JFT-300M, ViT vượt. DeiT (2021) giải quyết bằng data augmentation → ViT train tốt trên ImageNet.",
  },
  {
    question: "ViT [CLS] token có vai trò gì?",
    options: [
      "Chứa ảnh gốc",
      "Token đặc biệt attend đến tất cả patches → tổng hợp thông tin toàn bộ ảnh → dùng cho classification",
      "Đánh dấu vị trí đầu tiên",
    ],
    correct: 1,
    explanation: "[CLS] token không chứa thông tin patch nào cụ thể. Qua các lớp Transformer, nó attend đến mọi patch → tích lũy thông tin toàn cục. Output của [CLS] cuối cùng đưa vào classification head. Giống [CLS] trong BERT cho NLP!",
  },
];

export default function VisionTransformerTopic() {
  const [selectedPatch, setSelectedPatch] = useState<number | null>(null);
  const gridSize = 3;
  const patchPx = 52;
  const TOTAL_STEPS = 8;

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Transformer thống trị NLP (text). Nhưng ảnh không phải chuỗi từ — làm sao áp dụng Transformer cho ảnh?"
          options={[
            "Không thể — Transformer chỉ cho text",
            "Chia ảnh thành mảnh nhỏ (patches), mỗi patch = 1 \"từ\", rồi dùng Transformer bình thường!",
            "Chuyển ảnh thành text mô tả rồi dùng Transformer",
          ]}
          correct={1}
          explanation="Vision Transformer (ViT): chia ảnh 224×224 thành lưới patches 16×16, mỗi patch flatten → linear projection → embedding. 196 patches = 196 \"tokens\". Thêm [CLS] token + positional encoding → đưa vào Transformer encoder. Patches = tokens!"
        />
      </LessonSection>

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá ViT">
        <p className="text-sm text-foreground leading-relaxed mb-3">
          Hãy tưởng tượng bạn có tấm ảnh chụp phố c�� Hội An và cắt thành 9 mảnh ghép (jigsaw). Mỗi mảnh tự hỏi: &quot;Mảnh nào liên quan đến tôi?&quot; — đó là self-attention! Mảnh có đèn lồng sẽ &quot;chú ý&quot; đến mảnh có phố — dù chúng cách xa nhau.
        </p>

        <VisualizationSection>
          <p className="text-sm text-muted mb-3">
            Nhấn vào patch để xem attention connections. Mỗi patch &quot;nhìn&quot; tất cả patches khác.
          </p>

          <svg viewBox="0 0 420 250" className="w-full max-w-lg mx-auto rounded-lg border border-border bg-background">
            <text x={210} y={18} fontSize={11} fill="currentColor" className="text-foreground"
              textAnchor="middle" fontWeight={600}>
              Ảnh → Chia patches → Self-Attention
            </text>

            {/* Grid of patches */}
            {Array.from({ length: gridSize * gridSize }).map((_, i) => {
              const row = Math.floor(i / gridSize);
              const col = i % gridSize;
              const x = 30 + col * (patchPx + 4);
              const y = 30 + row * (patchPx + 4);
              const isSelected = selectedPatch === i;
              const opacity = selectedPatch === null ? 0.7 : isSelected ? 1 : 0.25;

              return (
                <g key={i} className="cursor-pointer" onClick={() => setSelectedPatch(i === selectedPatch ? null : i)}>
                  <motion.rect x={x} y={y} width={patchPx} height={patchPx} rx={5}
                    fill={PATCH_COLORS[i]} opacity={opacity}
                    stroke={isSelected ? "#fff" : "transparent"} strokeWidth={isSelected ? 3 : 0}
                    animate={{ opacity }} transition={{ duration: 0.2 }} />
                  <text x={x + patchPx / 2} y={y + patchPx / 2 + 5} textAnchor="middle"
                    fontSize={13} fill="white" fontWeight="bold">
                    P{i + 1}
                  </text>
                </g>
              );
            })}

            {/* Attention lines from selected */}
            {selectedPatch !== null && Array.from({ length: gridSize * gridSize }).map((_, i) => {
              if (i === selectedPatch) return null;
              const fromRow = Math.floor(selectedPatch / gridSize);
              const fromCol = selectedPatch % gridSize;
              const toRow = Math.floor(i / gridSize);
              const toCol = i % gridSize;
              const fx = 30 + fromCol * (patchPx + 4) + patchPx / 2;
              const fy = 30 + fromRow * (patchPx + 4) + patchPx / 2;
              const tx = 30 + toCol * (patchPx + 4) + patchPx / 2;
              const ty = 30 + toRow * (patchPx + 4) + patchPx / 2;
              const dist = Math.sqrt((toRow - fromRow) ** 2 + (toCol - fromCol) ** 2);
              const weight = 1 / (dist + 0.5);

              return (
                <line key={`att-${i}`} x1={fx} y1={fy} x2={tx} y2={ty}
                  stroke="#14b8a6" strokeWidth={weight * 4} opacity={weight * 0.8} />
              );
            })}

            {/* Pipeline on right */}
            <g transform="translate(220, 30)">
              {["Patches", "Flatten", "Linear Proj", "+ Pos Enc", "Transformer", "[CLS] → Class"].map((label, i) => {
                const y = i * 32;
                const colors = ["#3b82f6", "#8b5cf6", "#f97316", "#22c55e", "#ef4444", "#ec4899"];
                return (
                  <g key={i}>
                    <rect x={0} y={y} width={170} height={26} rx={6}
                      fill={colors[i]} opacity={0.12} stroke={colors[i]} strokeWidth={1} />
                    <text x={85} y={y + 17} fontSize={9} fill={colors[i]} textAnchor="middle" fontWeight={600}>
                      {label}
                    </text>
                    {i < 5 && (
                      <line x1={85} y1={y + 26} x2={85} y2={y + 32} stroke="#888" strokeWidth={1} />
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>ViT</strong>{" "}
            coi ảnh là chuỗi patches, giống Transformer coi văn bản là chuỗi tokens. Patches = tokens! Self-attention cho mỗi patch &quot;nhìn&quot; toàn bộ ảnh ngay từ lớp đầu tiên — CNN phải xếp nhiều lớp mới &quot;nhìn xa&quot; được.
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="ViT vs CNN">
        <VisualizationSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
              <h4 className="text-sm font-semibold text-blue-500 mb-2">CNN</h4>
              <ul className="text-xs text-muted space-y-1">
                <li>Inductive bias: cục bộ + chia sẻ bộ lọc</li>
                <li>Train tốt với ít data (1-10M ảnh)</li>
                <li>Nhìn cục bộ → xếp lớp mới nhìn xa</li>
                <li>Hiệu quả tham số hơn</li>
              </ul>
            </div>
            <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4">
              <h4 className="text-sm font-semibold text-purple-500 mb-2">ViT</h4>
              <ul className="text-xs text-muted space-y-1">
                <li>Không inductive bias → cần nhiều data hơn</li>
                <li>Vượt CNN khi data lớn (&gt;100M ảnh)</li>
                <li>Nhìn toàn cục ngay lớp đầu (attention)</li>
                <li>Scale tốt hơn (ViT-22B)</li>
              </ul>
            </div>
          </div>
          <Callout variant="info" title="DeiT: ViT cho người ít data">
            <p>
              DeiT (2021) cho thấy ViT train được trên ImageNet (1.4M) nhờ data augmentation mạnh + knowledge distillation từ CNN. Không cần 300M ảnh nữa! Ngày nay ViT là lựa chọn hàng đầu cho computer vision.
            </p>
          </Callout>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="ViT-Base: 12 lớp Transformer, 768 hidden, 12 heads, patch 16×16, ảnh 224×224. Có bao nhiêu tokens trong sequence?"
          options={[
            "224 × 224 = 50.176 tokens (mỗi pixel 1 token)",
            "(224/16)² + 1 = 197 tokens (196 patches + 1 [CLS])",
            "12 tokens (1 cho mỗi lớp Transformer)",
          ]}
          correct={1}
          explanation="14 × 14 = 196 patches. Thêm 1 [CLS] token = 197. Attention matrix: 197 × 197 = ~39K elements — rất nhẹ! So sánh: nếu mỗi pixel 1 token → 50K tokens → attention 2,5 tỷ elements. Patches là cách brilliant để giữ sequence ngắn."
        />
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích chi tiết">
        <ExplanationSection>
          <p>
            <strong>Vision Transformer (ViT)</strong>{" "}
            (Dosovitskiy et al., 2020) chứng minh Transformer thuần túy (không CNN) đạt SOTA trên image classification.
          </p>
          <LaTeX block>{String.raw`\mathbf{z}_0 = [\mathbf{x}_{\text{class}}; \; \mathbf{x}_p^1 E; \; \mathbf{x}_p^2 E; \; \cdots; \; \mathbf{x}_p^N E] + \mathbf{E}_{pos}`}</LaTeX>
          <p className="text-sm text-muted mt-1">
            <LaTeX>{String.raw`\mathbf{x}_p^i \in \mathbb{R}^{P^2 \cdot C}`}</LaTeX> = patch flatten,{" "}
            <LaTeX>{String.raw`E \in \mathbb{R}^{(P^2 C) \times D}`}</LaTeX> = linear projection,{" "}
            <LaTeX>{String.raw`\mathbf{E}_{pos}`}</LaTeX> = positional embedding.
          </p>

          <CodeBlock language="python" title="vit_simplified.py">
{`import torch
import torch.nn as nn

class ViT(nn.Module):
    def __init__(self, img_size=224, patch_size=16, d_model=768,
                 n_layers=12, n_heads=12, num_classes=1000):
        super().__init__()
        n_patches = (img_size // patch_size) ** 2  # 196

        # Patch embedding: flatten patch → linear projection
        self.patch_embed = nn.Conv2d(
            3, d_model, kernel_size=patch_size, stride=patch_size
        )  # (B, 3, 224, 224) → (B, 768, 14, 14)

        self.cls_token = nn.Parameter(torch.zeros(1, 1, d_model))
        self.pos_embed = nn.Parameter(torch.zeros(1, n_patches + 1, d_model))

        # Transformer encoder
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model, nhead=n_heads, batch_first=True
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, n_layers)
        self.head = nn.Linear(d_model, num_classes)

    def forward(self, x):
        B = x.shape[0]
        # 1. Patch embedding
        x = self.patch_embed(x).flatten(2).transpose(1, 2)  # (B, 196, 768)
        # 2. Prepend [CLS] token
        cls = self.cls_token.expand(B, -1, -1)
        x = torch.cat([cls, x], dim=1)  # (B, 197, 768)
        # 3. Add positional encoding
        x = x + self.pos_embed
        # 4. Transformer
        x = self.transformer(x)
        # 5. [CLS] output → classification
        return self.head(x[:, 0])`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Vision Transformer"
          points={[
            "ViT: chia ảnh thành patches → flatten → linear projection → Transformer encoder. Patches = tokens!",
            "[CLS] token attend đến mọi patch → tổng hợp thông tin toàn bộ ảnh → classification head.",
            "Không có inductive bias của CNN (locality, weight sharing) → cần nhiều data hơn hoặc augmentation mạnh (DeiT).",
            "Với data đủ lớn (>100M), ViT vượt CNN. Scale rất t���t: ViT-22B có 22 tỷ tham số.",
            "Biến thể: DeiT (ít data), Swin Transformer (hierarchical + shifted window), DINO (self-supervised).",
          ]}
        />
      </LessonSection>

      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
