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
  slug: "feature-extraction-cnn",
  title: "CNN Feature Extraction",
  titleVi: "Trích xuất đặc trưng CNN",
  description:
    "Cách mạng nơ-ron tích chập tự động học và trích xuất đặc trưng thị giác từ đơn giản đến phức tạp qua các lớp.",
  category: "computer-vision",
  tags: ["computer-vision", "cnn", "features"],
  difficulty: "intermediate",
  relatedSlugs: ["cnn", "convolution", "image-classification"],
  vizType: "interactive",
};

/* ── data ─────────────────────────────────────────────────── */
interface LayerInfo {
  name: string;
  description: string;
  features: string[];
  color: string;
  example: string;
}

const LAYERS: LayerInfo[] = [
  { name: "Lớp 1", description: "Cạnh và góc", features: ["Cạnh ngang", "Cạnh dọc", "Cạnh chéo", "Góc nhọn"], color: "#3b82f6", example: "Giống bộ lọc Sobel/Canny trong xử lý ảnh truyền thống" },
  { name: "Lớp 2-3", description: "Kết cấu và hình dạng", features: ["Sọc vằn", "Chấm tròn", "Đường cong", "Lưới ô"], color: "#8b5cf6", example: "Nhận ra vân vải, hoa văn gạch bông Việt Nam" },
  { name: "Lớp 4-5", description: "Bộ phận đối tượng", features: ["Mắt", "Tai", "Bánh xe", "Cửa sổ"], color: "#ec4899", example: "Nhận ra đèn pha xe máy, nón bảo hiểm" },
  { name: "Lớp cuối", description: "Đối tượng hoàn chỉnh", features: ["Khuôn mặt", "Con mèo", "Xe hơi", "Ngôi nhà"], color: "#22c55e", example: "Phân biệt được xe máy Honda Wave vs Yamaha Exciter" },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Lớp đầu tiên của CNN thường học được đặc trưng gì?",
    options: [
      "Khuôn mặt hoàn chỉnh",
      "Cạnh, góc, gradient màu sắc -- đặc trưng đơn giản nhất",
      "Bộ phận đối tượng (mắt, tai)",
      "Texture và pattern phức tạp",
    ],
    correct: 1,
    explanation: "Lớp đầu luôn học các đặc trưng cơ bản nhất: cạnh ngang, dọc, chéo, gradient. Đây là building blocks cho mọi đặc trưng phức tạp hơn ở lớp sau.",
  },
  {
    question: "Tại sao đặc trưng CNN có thể 'chuyển giao' (transfer) sang tác vụ khác?",
    options: [
      "Vì CNN luôn cho kết quả giống nhau",
      "Vì các lớp đầu học đặc trưng chung (cạnh, texture) -- hữu ích cho mọi ảnh",
      "Vì CNN không cần huấn luyện",
      "Vì transfer learning miễn phí",
    ],
    correct: 1,
    explanation: "Các lớp đầu học đặc trưng phổ quát (cạnh, kết cấu) áp dụng được cho mọi ảnh. Chỉ lớp cuối mới specific cho tác vụ. Đây là nền tảng Transfer Learning!",
  },
  {
    question: "Receptive field tăng dần qua các lớp CNN có ý nghĩa gì?",
    options: [
      "Mỗi neuron ở lớp sâu 'nhìn' một vùng ảnh gốc lớn hơn",
      "Mạng chạy nhanh hơn",
      "Ảnh đầu vào bị phóng to",
      "Số parameter tăng lên",
    ],
    correct: 0,
    explanation: "Receptive field là vùng pixel trên ảnh gốc mà 1 neuron 'nhìn thấy'. Lớp sâu hơn có receptive field lớn hơn, nên có thể nhận biết cấu trúc lớn hơn (từ cạnh -> bộ phận -> đối tượng).",
  },
];

/* ── component ────────────────────────────────────────────── */
export default function FeatureExtractionCnnTopic() {
  const [activeLayer, setActiveLayer] = useState(0);

  return (
    <>
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Bạn nhìn ảnh chụp phố cổ Hội An và nhận ra ngay: mái ngói, đèn lồng, du khách. Bộ não bạn xử lý thế nào?"
          options={[
            "Nhận ra ngay toàn bộ cảnh trong 1 bước",
            "Xử lý từ chi tiết nhỏ (cạnh, màu) -> hình dạng -> bộ phận -> đối tượng",
            "So sánh với mọi ảnh đã thấy từ trước",
          ]}
          correct={1}
          explanation="Thị giác con người (và CNN) xử lý theo thứ bậc: từ cạnh/góc đơn giản -> kết cấu/hình dạng -> bộ phận -> nhận ra đối tượng hoàn chỉnh. Đây là Feature Hierarchy!"
        >

      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-6">
            <div className="flex gap-2 justify-center flex-wrap">
              {LAYERS.map((layer, i) => (
                <button
                  key={layer.name}
                  type="button"
                  onClick={() => setActiveLayer(i)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    activeLayer === i ? "text-white" : "bg-card border border-border text-muted"
                  }`}
                  style={activeLayer === i ? { backgroundColor: layer.color } : {}}
                >
                  {layer.name}
                </button>
              ))}
            </div>

            <svg viewBox="0 0 600 280" className="w-full max-w-2xl mx-auto">
              {LAYERS.map((layer, i) => {
                const x = 30 + i * 145;
                const isActive = activeLayer === i;
                const size = 90 - i * 10;
                return (
                  <g key={layer.name}>
                    <rect x={x} y={60} width={120} height={size} rx="8"
                      fill={layer.color} opacity={isActive ? 0.4 : 0.15}
                      stroke={layer.color} strokeWidth={isActive ? 2.5 : 1} />
                    <text x={x + 60} y={55} textAnchor="middle"
                      fill={isActive ? layer.color : "#64748b"} fontSize="11" fontWeight="bold">
                      {layer.name}
                    </text>
                    <text x={x + 60} y={60 + size / 2 + 4} textAnchor="middle"
                      fill={isActive ? "#e2e8f0" : "#94a3b8"} fontSize="10">
                      {layer.description}
                    </text>
                    {i < LAYERS.length - 1 && (
                      <line x1={x + 120} y1={60 + size / 2} x2={x + 145} y2={60 + (90 - (i + 1) * 10) / 2}
                        stroke="#475569" strokeWidth="1.5" />
                    )}
                  </g>
                );
              })}

              <text x="300" y="185" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="bold">
                {LAYERS[activeLayer].name}: {LAYERS[activeLayer].description}
              </text>
              {LAYERS[activeLayer].features.map((feat, i) => {
                const x = 60 + i * 130;
                return (
                  <g key={feat}>
                    <rect x={x} y="200" width="110" height="40" rx="6"
                      fill={LAYERS[activeLayer].color} opacity={0.25}
                      stroke={LAYERS[activeLayer].color} strokeWidth="1" />
                    <text x={x + 55} y="225" textAnchor="middle" fill="#e2e8f0" fontSize="11">
                      {feat}
                    </text>
                  </g>
                );
              })}

              <defs>
                <linearGradient id="complexGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>
              <rect x="80" y="260" width="440" height="6" rx="3" fill="url(#complexGrad)" opacity={0.5} />
              <text x="80" y="278" fill="#3b82f6" fontSize="9">Đơn giản</text>
              <text x="520" y="278" fill="#22c55e" fontSize="9" textAnchor="end">Phức tạp</text>
            </svg>

            <div className="rounded-lg border border-border bg-card p-3 text-sm text-muted">
              <strong className="text-foreground">{LAYERS[activeLayer].name}:</strong>{" "}
              {LAYERS[activeLayer].example}
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            CNN <strong>không được lập trình</strong>{" "}để phát hiện cạnh hay mắt mèo -- nó{" "}
            <strong>tự học</strong>{" "}thông qua dữ liệu! Lớp 1 tự phát hiện cạnh vì cạnh là đặc trưng
            hữu ích nhất để giảm loss. Từ cạnh, lớp tiếp tổ hợp thành kết cấu, rồi bộ phận, rồi đối tượng.
            <strong>{" "}Mọi thứ đều emergent từ backpropagation!</strong>
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Bạn có mô hình CNN huấn luyện trên ImageNet (phân loại 1000 lớp). Bạn muốn dùng nó để phân loại ảnh sản phẩm Shopee (50 lớp). Nên làm gì?"
          options={[
            "Huấn luyện lại từ đầu vì bài toán khác hoàn toàn",
            "Giữ nguyên các lớp đầu (đặc trưng chung), chỉ thay và fine-tune lớp cuối",
            "Chỉ cần thay lớp Softmax từ 1000 thành 50",
          ]}
          correct={1}
          explanation="Các lớp đầu học cạnh, texture -- phổ quát cho mọi ảnh. Chỉ cần thay lớp cuối (FC + Softmax) cho 50 lớp mới và fine-tune. Đây là Transfer Learning -- tiết kiệm 90% thời gian huấn luyện!"
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={8} label="Giải thích sâu">
        <ExplanationSection>
          <p>
            <strong>Feature Extraction</strong>{" "}trong CNN là quá trình tự động học các biểu diễn (representation) có
            ý nghĩa từ dữ liệu thô. Mỗi lớp tích chập trích xuất đặc trưng ở mức trừu tượng khác nhau.
          </p>

          <Callout variant="insight" title="Feature Hierarchy (Thứ bậc đặc trưng)">
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li><strong>Low-level (Lớp 1-2):</strong>{" "}Cạnh, góc, gradient -- phổ quát cho mọi ảnh</li>
              <li><strong>Mid-level (Lớp 3-4):</strong>{" "}Kết cấu, hình dạng, pattern lặp lại</li>
              <li><strong>High-level (Lớp 5+):</strong>{" "}Bộ phận đối tượng, rồi đối tượng hoàn chỉnh</li>
            </ol>
          </Callout>

          <p><strong>Receptive Field</strong>{" "}tăng dần qua các lớp:</p>
          <LaTeX block>{"RF_l = RF_{l-1} + (k_l - 1) \\times \\prod_{i=1}^{l-1} s_i"}</LaTeX>
          <p className="text-sm text-muted">
            Với <LaTeX>{"k_l"}</LaTeX> là kích thước kernel và <LaTeX>{"s_i"}</LaTeX> là stride ở lớp i.
            Receptive field lớn hơn cho phép nhận biết cấu trúc lớn hơn trên ảnh gốc.
          </p>

          <Callout variant="warning" title="Transfer Learning -- Sức mạnh của đặc trưng CNN">
            <p className="text-sm">
              Đặc trưng CNN học được có thể <strong>chuyển giao</strong>{" "}sang tác vụ khác.
              Các lớp đầu (đặc trưng chung) được giữ nguyên, chỉ fine-tune lớp cuối cho tác vụ mới.
              VD: ResNet pretrained trên ImageNet dùng cho phân loại ảnh CCCD, sản phẩm Shopee.
            </p>
          </Callout>

          <CodeBlock language="python" title="Feature Extraction + Transfer Learning">
{`import torch
import torch.nn as nn
from torchvision import models

# Load ResNet-50 pretrained
resnet = models.resnet50(pretrained=True)

# Cách 1: Dùng CNN làm feature extractor
# Bỏ lớp FC cuối, lấy feature vector 2048-d
feature_extractor = nn.Sequential(*list(resnet.children())[:-1])
feature_extractor.eval()

img_tensor = torch.randn(1, 3, 224, 224)
with torch.no_grad():
    features = feature_extractor(img_tensor)  # (1, 2048, 1, 1)
    features = features.flatten(1)             # (1, 2048)

# Cách 2: Fine-tune cho tác vụ mới (50 lớp Shopee)
resnet.fc = nn.Linear(2048, 50)  # Thay lớp cuối

# Freeze các lớp đầu (không cập nhật)
for param in list(resnet.parameters())[:-2]:
    param.requires_grad = False

# Chỉ huấn luyện lớp FC mới
optimizer = torch.optim.Adam(resnet.fc.parameters(), lr=1e-3)`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={8} label="Tóm tắt">
        <MiniSummary points={[
          "CNN trích xuất đặc trưng theo thứ bậc: cạnh -> kết cấu -> bộ phận -> đối tượng",
          "Tất cả đều tự học qua backpropagation -- không cần thiết kế thủ công",
          "Receptive field tăng dần: lớp sâu 'nhìn' vùng ảnh gốc lớn hơn",
          "Transfer Learning: giữ lớp đầu (đặc trưng chung), fine-tune lớp cuối cho tác vụ mới",
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
