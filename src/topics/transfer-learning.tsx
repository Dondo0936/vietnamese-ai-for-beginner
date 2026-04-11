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
  slug: "transfer-learning",
  title: "Transfer Learning",
  titleVi: "Học chuyển giao",
  description: "Tận dụng kiến thức từ mô hình đã huấn luyện trước để giải bài toán mới",
  category: "dl-architectures",
  tags: ["training", "fine-tuning", "practical"],
  difficulty: "intermediate",
  relatedSlugs: ["cnn", "transformer", "residual-connections"],
  vizType: "interactive",
};

/* ── Data ── */
const LAYERS = [
  { name: "Conv 1: Cạnh, kết cấu", frozen: true, trainable: false },
  { name: "Conv 2: Hình dạng đơn giản", frozen: true, trainable: false },
  { name: "Conv 3: Bộ phận (mắt, bánh xe)", frozen: true, trainable: false },
  { name: "Conv 4: Vật thể phức tạp", frozen: true, trainable: true },
  { name: "FC: Kết hợp đặc trưng", frozen: false, trainable: true },
  { name: "Output: Phân loại MỚI", frozen: false, trainable: true },
];

const STRATEGIES = [
  { name: "Feature Extraction", desc: "Đóng băng toàn bộ, chỉ train lớp cuối", layers: [false, false, false, false, false, true], data: "Rất ít (100-1K)", time: "Phút" },
  { name: "Fine-tuning", desc: "Mở đông vài lớp trên, train với LR nhỏ", layers: [false, false, false, true, true, true], data: "Trung bình (1K-10K)", time: "Giờ" },
  { name: "Full Fine-tuning", desc: "Train lại toàn bộ mạng", layers: [true, true, true, true, true, true], data: "Nhiều (10K+)", time: "Ngày" },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Bạn có 200 ảnh chó/mèo. Nên dùng chiến lược transfer learning nào?",
    options: [
      "Train mạng CNN từ đầu — 200 ảnh là đủ",
      "Feature extraction: đóng băng ResNet pretrained, chỉ train lớp FC cuối",
      "Full fine-tuning: train lại toàn bộ ResNet",
    ],
    correct: 1,
    explanation: "200 ảnh quá ít để train CNN từ đầu (dễ overfitting). Feature extraction dùng đặc trưng đã học từ ImageNet (1.4 triệu ảnh) → chỉ cần train 1 lớp FC với 200 ảnh. Nhanh và hiệu quả!",
  },
  {
    question: "Tại sao fine-tuning dùng learning rate nhỏ hơn training từ đầu?",
    options: [
      "Vì GPU yếu hơn",
      "Vì trọng số pretrained đã gần tối ưu — LR lớn sẽ phá hỏng kiến thức đã học",
      "Vì dataset nhỏ hơn nên cần LR nhỏ",
      "Không cần — dùng LR bình thường",
    ],
    correct: 1,
    explanation: "Trọng số pretrained đã 'biết' phát hiện cạnh, hình dạng, vật thể. LR lớn (ví dụ 0.01) sẽ thay đổi quá mạnh → phá hỏng kiến thức. LR nhỏ (ví dụ 1e-5) tinh chỉnh nhẹ nhàng → giữ kiến thức cũ + thích nghi bài toán mới.",
  },
  {
    question: "GPT, BERT, LLaMA đều là mô hình pretrained. Đây là ví dụ transfer learning ở đâu?",
    options: [
      "Chỉ trong Computer Vision",
      "NLP: pretrain trên text khổng lồ (WebText, C4), fine-tune cho từng tác vụ (chatbot, dịch, phân loại...)",
      "Chỉ trong Reinforcement Learning",
    ],
    correct: 1,
    explanation: "Mô hình NLP lớn pretrain trên hàng tỷ từ → học 'hiểu ngôn ngữ' tổng quát. Fine-tune cho chatbot (ChatGPT), dịch máy, tóm tắt, phân loại... Paradigm 'pretrain once, fine-tune many' thống trị AI hiện đại.",
  },
];

/* ── Component ── */
export default function TransferLearningTopic() {
  const [strategy, setStrategy] = useState(1);
  const activeStrategy = STRATEGIES[strategy];
  const TOTAL_STEPS = 8;

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn cần phân loại 10 loại bệnh lá cây. Chỉ có 500 ảnh. Train CNN từ đầu cần hàng triệu ảnh. Làm sao?"
          options={[
            "Thu thập thêm hàng triệu ảnh lá cây",
            "Lấy CNN đã train trên ImageNet (1.4M ảnh), đóng băng các lớp đã học, chỉ train lớp cuối cho bài toán mới",
            "Dùng ảnh ngẫu nhiên từ internet để train",
          ]}
          correct={1}
          explanation="Transfer Learning! Mô hình đã train trên ImageNet biết phát hiện cạnh, hình dạng, kết cấu. Kiến thức này dùng được cho lá cây! Chỉ cần thay lớp cuối (1000 lớp ImageNet → 10 lớp bệnh) rồi train với 500 ảnh. Giống học futsal khi đã biết đá bóng!"
        />
      </LessonSection>

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="text-sm text-foreground leading-relaxed mb-3">
          Giống bạn đã biết nấu phở bò, giờ muốn nấu phở gà. Kỹ năng ninh nước dùng, nêm gia vị, trụng bánh phở vẫn dùng được (<strong>frozen layers</strong>). Chỉ cần học cách xử lý gà thay bò (<strong>trainable layers</strong>).
        </p>

        <VisualizationSection>
          <p className="text-sm text-muted mb-3">
            Chọn chiến lược transfer learning để xem lớp nào đóng băng, lớp nào train.
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {STRATEGIES.map((s, i) => (
              <button key={i} type="button" onClick={() => setStrategy(i)}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                  strategy === i ? "border-accent bg-accent/15 text-accent" : "border-border bg-card text-foreground hover:bg-surface"
                }`}>
                <span className="font-bold">{s.name}</span>
                <span className="block text-[10px] opacity-75">{s.desc}</span>
              </button>
            ))}
          </div>

          <svg viewBox="0 0 500 290" className="w-full rounded-lg border border-border bg-background">
            <text x={250} y={18} fontSize={11} fill="currentColor" className="text-foreground"
              textAnchor="middle" fontWeight={600}>
              {activeStrategy.name}: {activeStrategy.desc}
            </text>

            {LAYERS.map((layer, i) => {
              const y = 30 + i * 38;
              const isTrainable = activeStrategy.layers[i];
              const color = isTrainable ? "#f97316" : "#3b82f6";
              return (
                <g key={i}>
                  <motion.rect x={100} y={y} width={280} height={32} rx={8}
                    fill={color} opacity={isTrainable ? 0.2 : 0.08}
                    stroke={color} strokeWidth={isTrainable ? 2 : 1}
                    animate={{ opacity: isTrainable ? 0.25 : 0.08 }}
                    transition={{ duration: 0.3 }} />
                  <text x={240} y={y + 21} fontSize={10} fill={color} textAnchor="middle" fontWeight={600}>
                    {layer.name}
                  </text>
                  <text x={90} y={y + 21} fontSize={8} fill={color} textAnchor="end" fontWeight={600}>
                    {isTrainable ? "Train" : "Frozen"}
                  </text>
                  {i < LAYERS.length - 1 && (
                    <line x1={240} y1={y + 32} x2={240} y2={y + 38} stroke="#888" strokeWidth={1} />
                  )}
                </g>
              );
            })}

            <text x={250} y={268} fontSize={10} fill="currentColor" className="text-muted" textAnchor="middle">
              Dữ liệu cần: {activeStrategy.data} | Thời gian: {activeStrategy.time}
            </text>
          </svg>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>Transfer Learning</strong>{" "}
            = tận dụng kiến thức đã học. Lớp nông (cạnh, kết cấu) là <strong>universal</strong>{" "}
            — dùng được cho mọi bài toán ảnh. Chỉ lớp sâu (vật thể cụ thể) cần thay đổi. Tiết kiệm 99% thời gian và dữ liệu!
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Khi nào dùng gì?">
        <VisualizationSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
              <h4 className="text-sm font-semibold text-blue-500 mb-1">Dữ liệu ít + Giống pretrain</h4>
              <p className="text-xs text-muted">Ví dụ: phân loại chó/mèo (giống ImageNet). Dùng <strong>Feature Extraction</strong>.</p>
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
              <h4 className="text-sm font-semibold text-amber-500 mb-1">Dữ liệu ít + Khác pretrain</h4>
              <p className="text-xs text-muted">Ví dụ: ảnh y tế (khác ImageNet). <strong>Fine-tune vài lớp</strong>{" "}trên cùng.</p>
            </div>
            <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4">
              <h4 className="text-sm font-semibold text-green-500 mb-1">Dữ liệu nhiều + Giống</h4>
              <p className="text-xs text-muted"><strong>Fine-tune toàn bộ</strong>{" "}với LR nhỏ. Pretrained weights = khởi tạo tốt.</p>
            </div>
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
              <h4 className="text-sm font-semibold text-red-500 mb-1">Dữ liệu nhiều + Rất khác</h4>
              <p className="text-xs text-muted">Có thể <strong>train từ đầu</strong>{" "}hoặc chỉ dùng kiến trúc (không pretrained weights).</p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Fine-tuning BERT cho phân loại cảm xúc tiếng Việt. Nên dùng learning rate bao nhiêu?"
          options={[
            "LR = 0.01 (giống train từ đầu)",
            "LR = 2e-5 (rất nhỏ, tinh chỉnh nhẹ nhàng để không phá trọng số pretrained)",
            "LR = 1.0 (càng lớn càng nhanh)",
          ]}
          correct={1}
          explanation="BERT đã train trên hàng tỷ từ → trọng số rất tốt. LR 2e-5 (0.00002) tinh chỉnh nhẹ nhàng → giữ kiến thức ngôn ngữ + thích nghi phân loại cảm xúc. LR lớn sẽ phá hỏng kiến thức. Đây là LR phổ biến nhất cho fine-tuning BERT/GPT."
        />
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích chi tiết">
        <ExplanationSection>
          <p>
            <strong>Transfer Learning</strong>{" "}
            tận dụng kiến thức từ mô hình pretrained trên dataset lớn (ImageNet, WebText) để giải bài toán mới với ít dữ liệu hơn.
          </p>

          <Callout variant="insight" title="Tại sao hiệu quả?">
            <p>
              Lớp nông CNN học đặc trưng tổng quát (cạnh, kết cấu, màu sắc) — dùng được cho MỌI bài toán ảnh. LLM pretrain học &quot;hiểu ngôn ngữ&quot; tổng quát. Kiến thức nền tảng này là{" "}
              <strong>universal</strong>, chỉ lớp cuối cần task-specific.
            </p>
          </Callout>

          <CodeBlock language="python" title="transfer_learning.py">
{`import torch
import torchvision.models as models
import torch.nn as nn

# 1. Feature Extraction: đóng băng toàn bộ
model = models.resnet50(pretrained=True)
for param in model.parameters():
    param.requires_grad = False  # Đóng băng!

# Thay lớp cuối cho bài toán mới (10 lớp)
model.fc = nn.Linear(2048, 10)  # Chỉ lớp này train

# 2. Fine-tuning: mở đông vài lớp cuối
model = models.resnet50(pretrained=True)
for param in model.parameters():
    param.requires_grad = False
# Mở đông layer4 + fc
for param in model.layer4.parameters():
    param.requires_grad = True
model.fc = nn.Linear(2048, 10)

# LR nhỏ cho pretrained, lớn hơn cho lớp mới
optimizer = torch.optim.Adam([
    {'params': model.layer4.parameters(), 'lr': 1e-5},
    {'params': model.fc.parameters(), 'lr': 1e-3},
])`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Transfer Learning"
          points={[
            "Tận dụng pretrained model → tiết kiệm 99% dữ liệu và thời gian. 'Pre-train once, fine-tune many'.",
            "Feature Extraction: đóng băng toàn bộ, chỉ train lớp cuối (ít dữ liệu, nhanh).",
            "Fine-tuning: mở đông vài lớp trên, train với LR nhỏ (trung bình dữ liệu).",
            "Lớp nông = đặc trưng universal (cạnh, kết cấu). Lớp sâu = task-specific (cần thay đổi).",
            "Paradigm chủ đạo AI: ImageNet → fine-tune CNN. GPT/BERT → fine-tune NLP. Foundation models.",
          ]}
        />
      </LessonSection>

      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
