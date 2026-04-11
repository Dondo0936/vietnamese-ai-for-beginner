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
  slug: "style-transfer",
  title: "Style Transfer",
  titleVi: "Chuyển đổi phong cách",
  description:
    "Kỹ thuật áp dụng phong cách nghệ thuật của một ảnh lên nội dung của ảnh khác bằng mạng nơ-ron.",
  category: "computer-vision",
  tags: ["computer-vision", "generative", "artistic"],
  difficulty: "intermediate",
  relatedSlugs: ["cnn", "feature-extraction-cnn", "gan"],
  vizType: "interactive",
};

/* ── data ─────────────────────────────────────────────────── */
const QUIZ: QuizQuestion[] = [
  {
    question: "Style Transfer tách ảnh thành 2 thành phần nào?",
    options: [
      "Foreground (tiền cảnh) và Background (nền)",
      "Content (nội dung: đối tượng, bố cục) và Style (phong cách: nét cọ, màu sắc, kết cấu)",
      "High-resolution và Low-resolution",
      "RGB channels và Alpha channel",
    ],
    correct: 1,
    explanation: "Content = CÁI GÌ trong ảnh (Hồ Gươm, cây, người). Style = ảnh TRÔNG NHƯ THẾ NÀO (nét cọ dày, màu rực rỡ, kết cấu). Style Transfer kết hợp content ảnh A với style ảnh B.",
  },
  {
    question: "Gram matrix dùng để biểu diễn 'style' bằng cách nào?",
    options: [
      "Lưu trữ vị trí từng nét cọ",
      "Tính tương quan giữa các feature map -- nắm bắt kết cấu và pattern lặp lại",
      "Đo độ sáng trung bình của ảnh",
      "Đếm số màu khác nhau",
    ],
    correct: 1,
    explanation: "Gram matrix G = F * F^T: mỗi phần tử G[i,j] đo tương quan giữa feature map i và j. Tương quan cao giữa 'cạnh nghiêng' và 'màu vàng' = nét cọ vàng nghiêng. Nắm bắt style mà không phụ thuộc vị trí!",
  },
  {
    question: "Phương pháp gốc (Gatys 2015) chậm vì lý do gì?",
    options: [
      "Dùng mạng CNN quá lớn",
      "Cần tối ưu (gradient descent) RIÊNG CHO TỪNG ẢNH, không phải 1-shot",
      "Cần GPU đắt tiền",
      "Ảnh đầu vào quá lớn",
    ],
    correct: 1,
    explanation: "Gatys: bắt đầu từ ảnh random noise, chạy gradient descent hàng trăm iterations để minimize content + style loss CHO TỪNG ẢNH. Phương pháp feed-forward (Johnson 2016) huấn luyện mạng 1 lần, inference tức thì!",
  },
];

/* ── component ────────────────────────────────────────────── */
export default function StyleTransferTopic() {
  return (
    <>
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Bạn muốn biến ảnh chụp Hồ Gươm thành tranh theo phong cách Van Gogh (Starry Night). Cần giữ gì, thay đổi gì?"
          options={[
            "Giữ màu sắc gốc, chỉ thay hình dạng",
            "Giữ NỘI DUNG (Hồ Gươm, cây, nước) nhưng thay PHONG CÁCH (nét cọ xoáy, màu rực rỡ Van Gogh)",
            "Thay toàn bộ ảnh bằng Starry Night",
          ]}
          correct={1}
          explanation="Style Transfer = giữ CONTENT (đối tượng + bố cục) từ ảnh A + lấy STYLE (nét cọ + kết cấu + màu sắc) từ ảnh B. Kết quả: Hồ Gươm vẽ bằng nét cọ Van Gogh!"
        >

      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-6">
            <svg viewBox="0 0 600 320" className="w-full max-w-2xl mx-auto">
              {/* Content image */}
              <rect x="20" y="20" width="160" height="120" rx="8" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
              <rect x="25" y="90" width="150" height="45" fill="#22c55e" opacity={0.4} />
              <circle cx="60" cy="60" r="15" fill="#f59e0b" opacity={0.5} />
              <rect x="100" y="65" width="40" height="50" fill="#64748b" opacity={0.4} />
              <polygon points="100,65 120,40 140,65" fill="#64748b" opacity={0.5} />
              <text x="100" y="160" textAnchor="middle" fill="#3b82f6" fontSize="12" fontWeight="bold">Ảnh nội dung</text>
              <text x="100" y="175" textAnchor="middle" fill="#64748b" fontSize="9">Phong cảnh Hồ Gươm</text>

              <text x="210" y="85" fill="#94a3b8" fontSize="24" fontWeight="bold">+</text>

              {/* Style image */}
              <rect x="240" y="20" width="160" height="120" rx="8" fill="#1e293b" stroke="#8b5cf6" strokeWidth="2" />
              <circle cx="280" cy="50" r="20" fill="#ef4444" opacity={0.4} />
              <circle cx="340" cy="70" r="25" fill="#3b82f6" opacity={0.3} />
              <circle cx="300" cy="100" r="18" fill="#f59e0b" opacity={0.4} />
              <path d="M250,60 Q270,40 290,60 Q310,80 330,60" fill="none" stroke="#ec4899" strokeWidth="3" opacity={0.4} />
              <path d="M260,100 Q280,80 300,100 Q320,120 340,100" fill="none" stroke="#8b5cf6" strokeWidth="3" opacity={0.4} />
              <text x="320" y="160" textAnchor="middle" fill="#8b5cf6" fontSize="12" fontWeight="bold">Ảnh phong cách</text>
              <text x="320" y="175" textAnchor="middle" fill="#64748b" fontSize="9">Starry Night</text>

              <text x="430" y="85" fill="#94a3b8" fontSize="24" fontWeight="bold">=</text>

              {/* Result */}
              <rect x="460" y="20" width="120" height="120" rx="8" fill="#1e293b" stroke="#22c55e" strokeWidth="2" />
              <rect x="465" y="90" width="110" height="45" fill="#22c55e" opacity={0.3} />
              <circle cx="495" cy="60" r="15" fill="#f59e0b" opacity={0.4} />
              <rect x="530" y="65" width="30" height="50" fill="#64748b" opacity={0.3} />
              <path d="M470,55 Q490,45 510,55 Q530,65 550,55" fill="none" stroke="#ec4899" strokeWidth="2" opacity={0.5} />
              <path d="M470,85 Q490,75 510,85 Q530,95 550,85" fill="none" stroke="#8b5cf6" strokeWidth="2" opacity={0.4} />
              <text x="520" y="160" textAnchor="middle" fill="#22c55e" fontSize="12" fontWeight="bold">Kết quả</text>
              <text x="520" y="175" textAnchor="middle" fill="#64748b" fontSize="9">Content + Style</text>

              {/* Process */}
              <rect x="30" y="200" width="540" height="100" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="1" />
              <text x="300" y="225" textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="bold">Pipeline qua CNN (VGG-19)</text>

              <rect x="50" y="240" width="120" height="40" rx="6" fill="#3b82f6" opacity={0.2} stroke="#3b82f6" strokeWidth="1" />
              <text x="110" y="258" textAnchor="middle" fill="#3b82f6" fontSize="9" fontWeight="bold">Content Loss</text>
              <text x="110" y="272" textAnchor="middle" fill="#64748b" fontSize="8">Lớp sâu (Conv4_2)</text>

              <text x="190" y="262" fill="#475569" fontSize="14">+</text>

              <rect x="210" y="240" width="120" height="40" rx="6" fill="#8b5cf6" opacity={0.2} stroke="#8b5cf6" strokeWidth="1" />
              <text x="270" y="258" textAnchor="middle" fill="#8b5cf6" fontSize="9" fontWeight="bold">Style Loss</text>
              <text x="270" y="272" textAnchor="middle" fill="#64748b" fontSize="8">Gram matrix (nhiều lớp)</text>

              <text x="348" y="262" fill="#475569" fontSize="20">&rarr;</text>

              <rect x="370" y="240" width="180" height="40" rx="6" fill="#22c55e" opacity={0.2} stroke="#22c55e" strokeWidth="1" />
              <text x="460" y="258" textAnchor="middle" fill="#22c55e" fontSize="9" fontWeight="bold">Tối ưu hoá ảnh output</text>
              <text x="460" y="272" textAnchor="middle" fill="#64748b" fontSize="8">Gradient descent trên pixel</text>
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            CNN lớp sâu nắm bắt <strong>content</strong>{" "}(đối tượng, bố cục). Gram matrix giữa các feature map
            nắm bắt <strong>style</strong>{" "}(kết cấu, nét cọ, pattern). Style Transfer <strong>tối ưu hoá ảnh output</strong>{" "}
            để gần content ảnh A và gần style ảnh B cùng lúc. Pixel là biến số, không phải trọng số!
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Bạn chạy style transfer nhưng kết quả quá 'loạn' -- nét cọ Van Gogh che hết nội dung Hồ Gươm. Cần điều chỉnh gì?"
          options={[
            "Tăng learning rate",
            "Giảm trọng số style loss (hoặc tăng trọng số content loss)",
            "Dùng ảnh style có độ phân giải cao hơn",
          ]}
          correct={1}
          explanation="Total loss = alpha * content_loss + beta * style_loss. Tăng alpha (hoặc giảm beta) = giữ content nhiều hơn. Tỷ lệ alpha/beta quyết định cân bằng giữa 'giống ảnh gốc' vs 'giống phong cách'."
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={8} label="Giải thích sâu">
        <ExplanationSection>
          <p>
            <strong>Neural Style Transfer</strong>{" "}(Gatys et al., 2015) sử dụng CNN (thường VGG-19) để tách
            và kết hợp nội dung và phong cách từ 2 ảnh khác nhau.
          </p>

          <p><strong>Content Loss</strong>{" "}(giữ nội dung từ ảnh gốc):</p>
          <LaTeX block>{"\\mathcal{L}_{content} = \\frac{1}{2} \\sum_{i,j} (F^l_{ij} - P^l_{ij})^2"}</LaTeX>
          <p className="text-sm text-muted">
            <LaTeX>{"F^l"}</LaTeX> = feature map ảnh output, <LaTeX>{"P^l"}</LaTeX> = feature map ảnh content tại lớp l.
          </p>

          <p><strong>Style Loss</strong>{" "}(Gram matrix nắm bắt phong cách):</p>
          <LaTeX block>{"G^l_{ij} = \\sum_k F^l_{ik} F^l_{jk}, \\quad \\mathcal{L}_{style} = \\sum_l w_l \\frac{1}{4N_l^2 M_l^2} \\sum_{ij}(G^l_{ij} - A^l_{ij})^2"}</LaTeX>

          <p><strong>Total loss:</strong></p>
          <LaTeX block>{"\\mathcal{L}_{total} = \\alpha \\cdot \\mathcal{L}_{content} + \\beta \\cdot \\mathcal{L}_{style}"}</LaTeX>

          <Callout variant="insight" title="Phương pháp nhanh hơn">
            <div className="space-y-2 text-sm">
              <p><strong>Feed-forward (Johnson 2016):</strong>{" "}Huấn luyện mạng generator cho 1 style cụ thể. Inference tức thì! Nhưng 1 mạng = 1 style.</p>
              <p><strong>AdaIN (2017):</strong>{" "}Adaptive Instance Normalization. 1 mạng cho BẤT KỲ style nào bằng cách match mean/variance feature map.</p>
              <p><strong>Diffusion-based (2023+):</strong>{" "}ControlNet, IP-Adapter -- style transfer chất lượng cao hơn với diffusion models.</p>
            </div>
          </Callout>

          <CodeBlock language="python" title="Style Transfer cơ bản với PyTorch">
{`import torch
import torch.nn as nn
import torchvision.models as models

# VGG-19 pretrained (feature extractor)
vgg = models.vgg19(pretrained=True).features.eval()

# Lớp dùng cho content và style
content_layers = ['conv4_2']
style_layers = ['conv1_1', 'conv2_1', 'conv3_1', 'conv4_1', 'conv5_1']

def gram_matrix(x):
    """Gram matrix = F * F^T (tương quan feature map)"""
    b, c, h, w = x.size()
    F = x.view(b, c, h * w)
    G = torch.bmm(F, F.transpose(1, 2))
    return G / (c * h * w)

# Tối ưu hoá ảnh output
output = content_img.clone().requires_grad_(True)
optimizer = torch.optim.LBFGS([output])

for step in range(300):
    def closure():
        output.data.clamp_(0, 1)
        optimizer.zero_grad()
        # Tính feature maps cho output, content, style
        # content_loss = MSE(output_features, content_features)
        # style_loss = MSE(gram(output), gram(style))
        loss = alpha * content_loss + beta * style_loss
        loss.backward()
        return loss
    optimizer.step(closure)`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={8} label="Tóm tắt">
        <MiniSummary points={[
          "Style Transfer = Content (đối tượng, bố cục) từ ảnh A + Style (nét cọ, kết cấu, màu) từ ảnh B",
          "Content loss: MSE feature map lớp sâu. Style loss: MSE Gram matrix nhiều lớp",
          "Tỷ lệ alpha/beta quyết định cân bằng content vs style",
          "Feed-forward (1-shot inference) và AdaIN (arbitrary style) nhanh hơn Gatys gốc rất nhiều",
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
