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
  slug: "u-net",
  title: "U-Net",
  titleVi: "Kiến trúc U-Net",
  description: "Kiến trúc encoder-decoder hình chữ U với skip connections cho phân đoạn ảnh",
  category: "dl-architectures",
  tags: ["segmentation", "computer-vision", "architecture"],
  difficulty: "intermediate",
  relatedSlugs: ["cnn", "residual-connections", "autoencoder", "diffusion-models"],
  vizType: "interactive",
};

const quizQuestions: QuizQuestion[] = [
  {
    question: "U-Net skip connections khác ResNet skip connections thế nào?",
    options: [
      "Giống hoàn toàn",
      "ResNet: cộng (x + F(x)). U-Net: nối (concatenate) encoder feature với decoder feature → decoder có cả chi tiết + ngữ cảnh",
      "U-Net không dùng skip connections",
    ],
    correct: 1,
    explanation: "ResNet skip cộng: output = x + F(x) → cùng kích thước. U-Net skip nối (concat): decoder nhận feature map từ encoder cùng cấp → gấp đôi số channel. Cho decoder cả thông tin chi tiết (encoder) và ngữ cảnh (bottleneck).",
  },
  {
    question: "Tại sao U-Net được dùng trong Stable Diffusion (diffusion models)?",
    options: [
      "Vì U-Net nhanh hơn CNN",
      "Vì U-Net nhận ảnh nhiễu + timestep → dự đoán nhiễu. Skip connections giữ chi tiết qua quá trình nén/giải nén",
      "Vì Stable Diffusion cần phân đoạn ảnh",
    ],
    correct: 1,
    explanation: "Trong diffusion: U-Net nhận x_t (ảnh nhiễu) và t (timestep) → dự đoán nhiễu ε. Encoder nén để hiểu tổng thể, decoder phóng to để giữ chi tiết. Skip connections truyền chi tiết pixel-level từ encoder sang decoder. Cross-attention thêm text conditioning.",
  },
  {
    question: "Encoder U-Net giảm 256×256 xuống 16×16 (4 lần pooling). Decoder cần gì để phóng lên lại?",
    options: [
      "Chỉ dùng upsampling (nearest neighbor) là đủ",
      "Transposed convolution ('Conv ngược') hoặc bilinear upsampling + conv, kết hợp skip features từ encoder",
      "Không thể phóng to lại — chỉ output 16×16",
    ],
    correct: 1,
    explanation: "Decoder dùng transposed conv (learnable upsampling) hoặc bilinear upsample + conv để tăng kích thước. Nhưng upsampling mất chi tiết → skip connections concat feature map từ encoder cùng cấp → khôi phục chi tiết pixel-level!",
  },
];

export default function UNetTopic() {
  const [activeLevel, setActiveLevel] = useState<number | null>(null);
  const TOTAL_STEPS = 8;

  const LEVELS = [
    { enc: "64ch, 256×256", dec: "64ch, 256×256", bottleneck: false },
    { enc: "128ch, 128×128", dec: "128ch, 128×128", bottleneck: false },
    { enc: "256ch, 64×64", dec: "256ch, 64×64", bottleneck: false },
    { enc: "512ch, 32×32", dec: "512ch, 32×32", bottleneck: false },
    { enc: "1024ch, 16×16", dec: "", bottleneck: true },
  ];

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn cần gán nhãn MỖI pixel trong ảnh (ví dụ: pixel này là đường, pixel kia là xe). Autoencoder nén ảnh rồi giải nén, nhưng chi tiết pixel bị mất. Làm sao khắc phục?"
          options={[
            "Không nén ảnh — xử lý trực tiếp",
            "Nén nhưng truyền chi tiết từ encoder sang decoder qua skip connections — giữ cả ngữ cảnh lẫn chi tiết",
            "Dùng autoencoder lớn hơn",
          ]}
          correct={1}
          explanation="U-Net! Encoder nén để hiểu 'bức tranh tổng thể' (đâu là đường, đâu là nhà). Decoder phóng to lại, nhưng nhận thêm chi tiết pixel từ encoder qua skip connections. Kết quả: phân đoạn chính xác đến từng pixel!"
        />
      </LessonSection>

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá kiến trúc chữ U">
        <p className="text-sm text-foreground leading-relaxed mb-3">
          Hãy tưởng tượng bạn vẽ bản đồ từ ảnh vệ tinh. Bước 1: bạn <strong>zoom out</strong>{" "}
          dần để thấy bức tranh tổng thể (encoder). Bước 2: bạn <strong>zoom in</strong>{" "}
          lại, vẽ chi tiết ranh giới (decoder). Ghi chú từ mỗi mức zoom (skip connections) giúp bạn không quên chi tiết.
        </p>

        <VisualizationSection>
          <p className="text-sm text-muted mb-3">
            Nhấn vào từng cấp để xem skip connection truyền chi tiết từ encoder sang decoder.
          </p>

          <svg viewBox="0 0 500 280" className="w-full rounded-lg border border-border bg-background">
            <text x={80} y={18} fontSize={10} fill="#3b82f6" textAnchor="middle" fontWeight={600}>Encoder</text>
            <text x={420} y={18} fontSize={10} fill="#22c55e" textAnchor="middle" fontWeight={600}>Decoder</text>
            <text x={250} y={18} fontSize={10} fill="#f59e0b" textAnchor="middle" fontWeight={700}>U-Net</text>

            {LEVELS.map((lvl, i) => {
              const w = 85 - i * 14;
              const yPos = 30 + i * 48;
              const isActive = activeLevel === i;
              const isBottleneck = lvl.bottleneck;

              return (
                <g key={i} className="cursor-pointer" onClick={() => setActiveLevel(isActive ? null : i)}>
                  {/* Encoder block */}
                  <rect x={40 + i * 18} y={yPos} width={w} height={22} rx={5}
                    fill="#3b82f6" opacity={isActive ? 0.35 : 0.15}
                    stroke="#3b82f6" strokeWidth={isActive ? 2 : 1} />
                  <text x={40 + i * 18 + w / 2} y={yPos + 15} fontSize={7} fill="#3b82f6"
                    textAnchor="middle" fontWeight={500}>{lvl.enc}</text>

                  {/* Decoder block (if not bottleneck) */}
                  {!isBottleneck && (
                    <>
                      <rect x={460 - i * 18 - w} y={yPos} width={w} height={22} rx={5}
                        fill="#22c55e" opacity={isActive ? 0.35 : 0.15}
                        stroke="#22c55e" strokeWidth={isActive ? 2 : 1} />
                      <text x={460 - i * 18 - w / 2} y={yPos + 15} fontSize={7} fill="#22c55e"
                        textAnchor="middle" fontWeight={500}>{lvl.dec}</text>

                      {/* Skip connection */}
                      <motion.line
                        x1={40 + i * 18 + w + 3} y1={yPos + 11}
                        x2={460 - i * 18 - w - 3} y2={yPos + 11}
                        stroke="#8b5cf6" strokeWidth={isActive ? 2.5 : 1}
                        strokeDasharray={isActive ? "0" : "6 3"}
                        opacity={isActive ? 0.8 : 0.3}
                        animate={isActive ? { opacity: [0.5, 1, 0.5] } : {}}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      />
                      {isActive && (
                        <text x={250} y={yPos + 8} fontSize={7} fill="#8b5cf6" textAnchor="middle" fontWeight={600}>
                          skip (concat)
                        </text>
                      )}
                    </>
                  )}

                  {/* Bottleneck */}
                  {isBottleneck && (
                    <rect x={190} y={yPos} width={120} height={22} rx={6}
                      fill="#f59e0b" opacity={0.2} stroke="#f59e0b" strokeWidth={2} />
                  )}
                  {isBottleneck && (
                    <text x={250} y={yPos + 15} fontSize={8} fill="#f59e0b" textAnchor="middle" fontWeight={700}>
                      Bottleneck (1024ch)
                    </text>
                  )}
                </g>
              );
            })}

            <text x={50} y={275} fontSize={9} fill="currentColor" className="text-muted">Input</text>
            <text x={440} y={275} fontSize={9} fill="currentColor" className="text-muted" textAnchor="end">Segmentation Map</text>
          </svg>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>U-Net</strong>{" "}
            = Encoder (nén) + Decoder (phóng to) + Skip connections (giữ chi tiết). Hình chữ U! Encoder nắm ngữ cảnh (&quot;đây là con đường&quot;), decoder vẽ chính xác ranh giới pixel, skip connections truyền chi tiết không bị mất khi nén.
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="U-Net trong Diffusion">
        <VisualizationSection>
          <Callout variant="insight" title="U-Net trong Stable Diffusion">
            <p>
              Stable Diffusion dùng U-Net với 3 bổ sung: (1) <strong>Timestep embedding</strong>{" "}
              — cho U-Net biết đang ở bước khử nhiễu nào. (2) <strong>Cross-attention</strong>{" "}
              — nhận text embedding từ CLIP, cho phép sinh ảnh theo mô tả. (3) <strong>Latent space</strong>{" "}
              — hoạt động trên latent 64×64 thay vì pixel 512×512.
            </p>
          </Callout>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Encoder U-Net: 256×256→128→64→32→16 (bottleneck). Mỗi lần max pool 2×2. Skip connection ở cấp 64×64 truyền feature map 64×64. Decoder nhận concat: kích thước?"
          options={[
            "64×64 (giống encoder)",
            "Concat: 64×64 từ skip + 64×64 từ upsample = 64×64 nhưng GẤP ĐÔI số channel",
            "128×128 (phóng to trước rồi concat)",
          ]}
          correct={1}
          explanation="Decoder upsample 32→64, rồi concat với skip 64×64 từ encoder. Kích thước không gian vẫn 64×64 nhưng số channel gấp đôi (256 + 256 = 512). Conv tiếp theo giảm channel xuống lại."
        />
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích chi tiết">
        <ExplanationSection>
          <p>
            <strong>U-Net</strong>{" "}
            (Ronneberger et al., 2015) là kiến trúc encoder-decoder hình chữ U, ban đầu cho phân đoạn ảnh y tế, nay dùng rộng rãi trong diffusion models.
          </p>
          <CodeBlock language="python" title="unet_simple.py">
{`import torch.nn as nn

class UNet(nn.Module):
    def __init__(self, in_ch=3, out_ch=1):
        super().__init__()
        # Encoder
        self.enc1 = self.conv_block(in_ch, 64)
        self.enc2 = self.conv_block(64, 128)
        self.pool = nn.MaxPool2d(2)
        # Bottleneck
        self.bottleneck = self.conv_block(128, 256)
        # Decoder
        self.up2 = nn.ConvTranspose2d(256, 128, 2, stride=2)
        self.dec2 = self.conv_block(256, 128)  # 128+128=256 input (concat!)
        self.up1 = nn.ConvTranspose2d(128, 64, 2, stride=2)
        self.dec1 = self.conv_block(128, 64)   # 64+64=128 input
        self.out = nn.Conv2d(64, out_ch, 1)

    def conv_block(self, in_ch, out_ch):
        return nn.Sequential(
            nn.Conv2d(in_ch, out_ch, 3, padding=1), nn.ReLU(),
            nn.Conv2d(out_ch, out_ch, 3, padding=1), nn.ReLU(),
        )

    def forward(self, x):
        e1 = self.enc1(x)                      # Skip 1
        e2 = self.enc2(self.pool(e1))           # Skip 2
        b = self.bottleneck(self.pool(e2))      # Bottleneck
        d2 = self.dec2(torch.cat([self.up2(b), e2], 1))  # Concat skip!
        d1 = self.dec1(torch.cat([self.up1(d2), e1], 1))
        return self.out(d1)`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về U-Net"
          points={[
            "U-Net = Encoder (nén) + Bottleneck + Decoder (phóng to) + Skip connections (concat chi tiết).",
            "Skip connections concat (nối) feature map encoder với decoder cùng cấp → giữ chi tiết pixel-level.",
            "Khác ResNet skip (cộng): U-Net skip nối → decoder nhận gấp đôi channel → phong phú thông tin hơn.",
            "Ứng dụng: phân đoạn ảnh y tế, vệ tinh, tự lái. Là backbone của Stable Diffusion (diffusion models).",
            "Trong Diffusion: U-Net + timestep embedding + cross-attention (text) → sinh ảnh theo mô tả.",
          ]}
        />
      </LessonSection>

      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
