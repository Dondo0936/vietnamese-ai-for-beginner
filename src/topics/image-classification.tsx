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
  slug: "image-classification",
  title: "Image Classification",
  titleVi: "Phân loại hình ảnh",
  description:
    "Tác vụ gán nhãn danh mục cho toàn bộ hình ảnh, nền tảng của thị giác máy tính hiện đại.",
  category: "computer-vision",
  tags: ["computer-vision", "cnn", "classification"],
  difficulty: "beginner",
  relatedSlugs: ["cnn", "convolution", "feature-extraction-cnn"],
  vizType: "interactive",
};

/* ── data ─────────────────────────────────────────────────── */
const LAYERS = [
  { label: "Input", w: 70, h: 70, color: "#3b82f6", desc: "224x224x3" },
  { label: "Conv+Pool", w: 55, h: 55, color: "#8b5cf6", desc: "56x56x64" },
  { label: "Conv+Pool", w: 40, h: 40, color: "#8b5cf6", desc: "14x14x256" },
  { label: "Conv+Pool", w: 28, h: 28, color: "#8b5cf6", desc: "7x7x512" },
  { label: "Flatten", w: 10, h: 50, color: "#f59e0b", desc: "25088" },
  { label: "FC", w: 10, h: 35, color: "#ec4899", desc: "4096" },
  { label: "Softmax", w: 10, h: 20, color: "#22c55e", desc: "1000" },
];

const CLASSES = [
  { name: "Xe máy", prob: 0.82 },
  { name: "Ô tô", prob: 0.09 },
  { name: "Xe đạp", prob: 0.05 },
  { name: "Xe buýt", prob: 0.03 },
  { name: "Khác", prob: 0.01 },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Image Classification khác gì so với Object Detection?",
    options: [
      "Classification gán 1 nhãn cho cả ảnh, Detection tìm vị trí từng đối tượng",
      "Classification nhanh hơn Detection",
      "Classification dùng CNN, Detection dùng RNN",
      "Không có sự khác biệt",
    ],
    correct: 0,
    explanation:
      "Image Classification gán duy nhất 1 nhãn cho toàn bộ ảnh. Object Detection vừa phân loại vừa xác định vị trí (bounding box) của từng đối tượng.",
  },
  {
    question: "Lớp Softmax ở cuối mạng CNN có vai trò gì?",
    options: [
      "Trích xuất đặc trưng từ ảnh",
      "Chuyển đầu ra thành phân phối xác suất, tổng bằng 1",
      "Giảm kích thước ảnh đầu vào",
      "Tăng tốc quá trình huấn luyện",
    ],
    correct: 1,
    explanation:
      "Softmax chuyển vector điểm số thô (logits) thành phân phối xác suất trên tất cả các lớp, với tổng xác suất bằng 1.",
  },
  {
    question:
      "Tại sao mô hình phân loại ảnh cần hàng triệu ảnh huấn luyện (VD: ImageNet)?",
    options: [
      "Để chạy nhanh hơn khi inference",
      "Để học được các đặc trưng đa dạng và tổng quát hoá tốt",
      "Vì mỗi ảnh chỉ huấn luyện được 1 lần",
      "Để tiết kiệm bộ nhớ GPU",
    ],
    correct: 1,
    explanation:
      "Dữ liệu đa dạng giúp mô hình học được nhiều biến thể (góc chụp, ánh sáng, nền) và tổng quát hoá tốt thay vì chỉ nhớ tập huấn luyện.",
  },
];

/* ── component ────────────────────────────────────────────── */
export default function ImageClassificationTopic() {
  const [showProbs, setShowProbs] = useState(false);

  return (
    <>
      {/* Step 1: Hook */}
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Bạn mở camera điện thoại, chĩa vào một chiếc xe máy trên phố Hà Nội. Ứng dụng hiện chữ 'Xe máy - 82%'. Nó đã làm gì?"
          options={[
            "Tìm vị trí xe máy trong ảnh",
            "Gán 1 nhãn cho toàn bộ bức ảnh",
            "Đếm số xe máy trong ảnh",
          ]}
          correct={1}
          explanation="Đây chính là Image Classification: nhìn toàn bộ bức ảnh và gán DUY NHẤT MỘT nhãn danh mục. Không tìm vị trí, không đếm số lượng!"
        >

      {/* Step 2: Discover */}
      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-6">
            <p className="text-sm text-muted text-center">
              Ảnh đi qua từng lớp CNN, thu nhỏ dần nhưng đặc trưng ngày càng phong phú
            </p>
            <svg viewBox="0 0 600 280" className="w-full max-w-2xl mx-auto">
              <text x="300" y="20" textAnchor="middle" fill="currentColor" className="fill-foreground" fontSize="13" fontWeight="bold">
                Kiến trúc CNN cho phân loại ảnh
              </text>
              {LAYERS.map((layer, i) => {
                const x = 30 + i * 80;
                const yCenter = 100;
                return (
                  <g key={i}>
                    <rect
                      x={x} y={yCenter - layer.h / 2}
                      width={layer.w} height={layer.h}
                      rx="4" fill={layer.color} opacity={0.3}
                      stroke={layer.color} strokeWidth="1.5"
                    />
                    <text x={x + layer.w / 2} y={yCenter + 2} textAnchor="middle"
                      fill="currentColor" className="fill-foreground" fontSize="8" fontWeight="bold">
                      {layer.desc}
                    </text>
                    <text x={x + layer.w / 2} y={yCenter + layer.h / 2 + 14} textAnchor="middle"
                      fill="currentColor" className="fill-muted" fontSize="7">
                      {layer.label}
                    </text>
                    {i < LAYERS.length - 1 && (
                      <line x1={x + layer.w + 2} y1={yCenter} x2={x + 78} y2={yCenter}
                        stroke="#475569" strokeWidth="1" markerEnd="url(#arrow-ic)" />
                    )}
                  </g>
                );
              })}
              <defs>
                <marker id="arrow-ic" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
                  <polygon points="0 0, 6 2, 0 4" fill="#475569" />
                </marker>
              </defs>

              {/* Output probabilities */}
              <text x="300" y="170" textAnchor="middle" fill="currentColor" className="fill-muted" fontSize="11">
                Xác suất đầu ra (Softmax)
              </text>
              {CLASSES.map((cls, i) => {
                const x = 60 + i * 110;
                const barW = cls.prob * 100;
                return (
                  <g key={cls.name}>
                    <text x={x} y="195" fill="currentColor" className="fill-foreground" fontSize="10">
                      {cls.name}
                    </text>
                    <rect x={x} y="200" width={barW} height="14" rx="3"
                      fill={i === 0 ? "#22c55e" : "#3b82f6"} opacity={i === 0 ? 0.9 : 0.4} />
                    <text x={x + barW + 5} y="212" fill="currentColor" className="fill-muted" fontSize="9">
                      {(cls.prob * 100).toFixed(0)}%
                    </text>
                  </g>
                );
              })}
              <text x="300" y="250" textAnchor="middle" fill="currentColor" className="fill-muted" fontSize="10">
                Kết quả: Xe máy (82% tin cậy)
              </text>
            </svg>

            <button
              type="button"
              onClick={() => setShowProbs(!showProbs)}
              className="mx-auto block rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              {showProbs ? "Ẩn chi tiết Softmax" : "Xem cách Softmax tính xác suất"}
            </button>

            {showProbs && (
              <div className="rounded-lg border border-border bg-card p-4 space-y-2 text-sm">
                <p>
                  <strong>Softmax</strong>{" "}chuyển vector logits thành xác suất:
                </p>
                <LaTeX block>{"P(y=k) = \\frac{e^{z_k}}{\\sum_{j=1}^{K} e^{z_j}}"}</LaTeX>
                <p className="text-muted">
                  Mỗi giá trị đầu ra nằm trong khoảng (0, 1) và tổng tất cả bằng 1.
                  Lớp có logit cao nhất sẽ có xác suất cao nhất.
                </p>
              </div>
            )}
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* Step 3: Aha */}
      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            CNN học đặc trưng theo <strong>thứ bậc</strong>{" "}giống cách mắt người hoạt động: lớp đầu nhận biết
            <strong>{" "}cạnh, góc</strong>, lớp giữa nhận biết <strong>bộ phận</strong>{" "}(bánh xe, đèn pha),
            lớp cuối kết hợp tất cả thành khái niệm <strong>xe máy</strong>. Từ đơn giản đến phức tạp!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* Step 4: Challenge */}
      <LessonSection step={4} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Ảnh chụp một chiếc xe máy chở đầy hàng hoá, nhìn từ phía sau. Mô hình phân loại nhầm thành 'xe ba gác'. Nguyên nhân có thể là gì?"
          options={[
            "Mô hình dùng sai hàm Softmax",
            "Tập huấn luyện thiếu ảnh xe máy chở hàng nhìn từ phía sau",
            "Ảnh quá lớn cho mô hình xử lý",
          ]}
          correct={1}
          explanation="Mô hình chỉ tốt bằng dữ liệu huấn luyện. Nếu thiếu ảnh xe máy chở hàng từ phía sau, mô hình không học được đặc trưng đó. Đây là vấn đề distribution shift trong thực tế Việt Nam!"
        />
      </LessonSection>

      {/* Step 5: Explain */}
      <LessonSection step={5} totalSteps={8} label="Giải thích sâu">
        <ExplanationSection>
          <p>
            <strong>Image Classification</strong>{" "}(Phân loại hình ảnh) là tác vụ cơ bản nhất trong thị giác máy tính
            -- gán một nhãn danh mục cho toàn bộ bức ảnh.
          </p>

          <Callout variant="insight" title="Pipeline phân loại ảnh">
            <p>Ảnh đầu vào (224x224x3) qua 3 giai đoạn chính:</p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li><strong>Feature Extraction:</strong>{" "}Các lớp Conv + Pool trích xuất đặc trưng, giảm kích thước không gian nhưng tăng số kênh</li>
              <li><strong>Flatten + FC:</strong>{" "}Duỗi phẳng tensor 3D thành vector 1D, rồi ánh xạ qua lớp kết nối đầy đủ</li>
              <li><strong>Softmax:</strong>{" "}Chuyển logits thành phân phối xác suất trên K lớp</li>
            </ol>
          </Callout>

          <p>
            <strong>Hàm mất mát Cross-Entropy</strong>{" "}được dùng để huấn luyện:
          </p>
          <LaTeX block>{"\\mathcal{L} = -\\sum_{k=1}^{K} y_k \\log(\\hat{y}_k)"}</LaTeX>
          <p className="text-sm text-muted">
            Trong đó <LaTeX>{"y_k"}</LaTeX> là nhãn one-hot và <LaTeX>{"\\hat{y}_k"}</LaTeX> là xác suất dự đoán cho lớp k.
          </p>

          <Callout variant="warning" title="Ứng dụng thực tế tại Việt Nam">
            <ul className="list-disc list-inside space-y-1">
              <li>Nhận diện loại phương tiện trên camera giao thông (xe máy chiếm 80% phương tiện)</li>
              <li>Phân loại ảnh sản phẩm trên Shopee, Tiki theo danh mục</li>
              <li>Phân loại ảnh CCCD/CMND trong hệ thống eKYC ngân hàng</li>
            </ul>
          </Callout>

          <p><strong>Các kiến trúc nổi tiếng:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>AlexNet</strong>{" "}(2012): Mở đầu kỷ nguyên deep learning cho CV</li>
            <li><strong>VGGNet</strong>{" "}(2014): Kiến trúc đơn giản, sâu (16-19 lớp)</li>
            <li><strong>ResNet</strong>{" "}(2015): Skip connections, huấn luyện được mạng 152 lớp</li>
            <li><strong>EfficientNet</strong>{" "}(2019): Cân bằng tối ưu giữa chiều rộng, sâu, và độ phân giải</li>
          </ul>

          <CodeBlock language="python" title="Phân loại ảnh với PyTorch (pretrained ResNet)">
{`import torch
from torchvision import models, transforms
from PIL import Image

# Load pretrained ResNet-50
model = models.resnet50(pretrained=True)
model.eval()

# Tiền xử lý ảnh
transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    ),
])

img = Image.open("xe_may.jpg")
x = transform(img).unsqueeze(0)  # (1, 3, 224, 224)

with torch.no_grad():
    logits = model(x)              # (1, 1000)
    probs = torch.softmax(logits, dim=1)
    top5 = torch.topk(probs, 5)

print(f"Top-1: class {top5.indices[0][0]}, prob {top5.values[0][0]:.2%}")`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      {/* Step 6: Summary */}
      <LessonSection step={6} totalSteps={8} label="Tóm tắt">
        <MiniSummary points={[
          "Image Classification gán DUY NHẤT 1 nhãn cho toàn bộ ảnh (không tìm vị trí)",
          "CNN trích xuất đặc trưng theo thứ bậc: cạnh -> hình dạng -> bộ phận -> đối tượng",
          "Softmax chuyển logits thành xác suất, Cross-Entropy dùng làm hàm mất mát",
          "ImageNet (1000 lớp, 1.2M ảnh) là benchmark chuẩn; ResNet là kiến trúc phổ biến nhất",
        ]} />
      </LessonSection>

      {/* Step 7: Quiz */}
      <LessonSection step={7} totalSteps={8} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
