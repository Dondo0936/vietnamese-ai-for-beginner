"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "text-to-image",
  title: "Text-to-Image",
  titleVi: "Tạo ảnh từ văn bản — AI hoạ sĩ",
  description:
    "Mô hình AI tạo ra hình ảnh chất lượng cao từ mô tả bằng ngôn ngữ tự nhiên.",
  category: "multimodal",
  tags: ["text-to-image", "diffusion", "generation"],
  difficulty: "intermediate",
  relatedSlugs: ["diffusion-models", "text-to-video", "clip"],
  vizType: "interactive",
};

const STEPS = [
  { label: "Nhập prompt", desc: "\"Một chú mèo đang ngồi trên mặt trăng\"", color: "#3b82f6" },
  { label: "Mã hoá văn bản", desc: "Chuyển từ ngữ thành vector đặc trưng", color: "#8b5cf6" },
  { label: "Khởi tạo nhiễu", desc: "Bắt đầu từ ảnh hoàn toàn ngẫu nhiên", color: "#ef4444" },
  { label: "Khử nhiễu dần", desc: "Lặp lại 20-50 bước, ảnh rõ nét dần", color: "#f59e0b" },
  { label: "Ảnh hoàn chỉnh", desc: "Hình ảnh cuối cùng chi tiết và sắc nét", color: "#22c55e" },
];

export default function TextToImageTopic() {
  const [step, setStep] = useState(0);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn nhờ một <strong>hoạ sĩ</strong> vẽ tranh. Bạn mô tả:
          &quot;Một chú mèo ngồi trên mặt trăng, phong cách anime.&quot;
        </p>
        <p>
          Hoạ sĩ bắt đầu từ <strong>bản phác thảo mờ</strong>, rồi từng bước
          <strong> thêm chi tiết</strong>: hình dáng mèo, ánh trăng, bóng đổ...
          Mỗi nét vẽ làm bức tranh <strong>rõ ràng hơn</strong> cho đến khi hoàn thiện.
        </p>
        <p>
          Mô hình text-to-image hoạt động tương tự — bắt đầu từ &quot;nhiễu&quot; ngẫu nhiên
          rồi <strong>khử nhiễu từng bước</strong>, được dẫn dắt bởi mô tả của bạn.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <svg viewBox="0 0 700 160" className="w-full max-w-3xl mx-auto">
            {STEPS.map((s, i) => {
              const x = 70 + i * 145;
              const active = i <= step;
              return (
                <g key={i}>
                  <rect
                    x={x - 55}
                    y={30}
                    width={110}
                    height={50}
                    rx={10}
                    fill={active ? s.color : "#1e293b"}
                    stroke={active ? s.color : "#475569"}
                    strokeWidth={2}
                    opacity={active ? 1 : 0.5}
                  />
                  <text x={x} y={52} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">
                    {s.label}
                  </text>
                  <text x={x} y={68} textAnchor="middle" fill="#e2e8f0" fontSize={7}>
                    {s.desc.length > 25 ? s.desc.slice(0, 25) + "..." : s.desc}
                  </text>
                  {i < STEPS.length - 1 && (
                    <line x1={x + 55} y1={55} x2={x + 90} y2={55} stroke={i < step ? s.color : "#475569"} strokeWidth={2} />
                  )}
                </g>
              );
            })}
            {/* Noise to image gradient */}
            <rect x={70} y={110} width={560} height={20} rx={4} fill="url(#noise-grad)" opacity={0.6} />
            <text x={70} y={145} fill="#94a3b8" fontSize={9}>Nhiễu</text>
            <text x={630} y={145} textAnchor="end" fill="#94a3b8" fontSize={9}>Ảnh rõ nét</text>
            <defs>
              <linearGradient id="noise-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
          </svg>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              className="rounded-lg bg-card border border-border px-4 py-2 text-sm text-muted hover:text-foreground"
            >
              Quay lại
            </button>
            <button
              onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))}
              className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              Bước tiếp
            </button>
          </div>
          <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
            <p className="text-sm text-muted"><strong>Bước {step + 1}:</strong> {STEPS[step].desc}</p>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Text-to-Image</strong> là công nghệ sử dụng mô hình sinh (generative model)
          để tạo hình ảnh từ mô tả bằng ngôn ngữ tự nhiên. Công nghệ này đã phát triển
          vượt bậc nhờ các mô hình khuếch tán (diffusion).
        </p>
        <p>Quy trình tạo ảnh gồm 5 giai đoạn:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Mã hoá prompt:</strong> Bộ mã hoá văn bản (như CLIP) chuyển mô tả thành vector.</li>
          <li><strong>Khởi tạo nhiễu:</strong> Bắt đầu từ tensor ngẫu nhiên (ảnh nhiễu Gaussian).</li>
          <li><strong>Khử nhiễu có điều kiện:</strong> U-Net dự đoán và loại bỏ nhiễu, được hướng dẫn bởi vector prompt.</li>
          <li><strong>Lặp lại:</strong> Quá trình khử nhiễu lặp 20-50 bước, ảnh rõ dần.</li>
          <li><strong>Giải mã:</strong> VAE decoder chuyển ảnh latent thành ảnh pixel cuối cùng.</li>
        </ol>
        <p>
          Các mô hình tiêu biểu: <strong>Stable Diffusion</strong>, <strong>DALL-E 3</strong>,
          <strong> Midjourney</strong>, và <strong>Imagen</strong>.
        </p>
      </ExplanationSection>
    </>
  );
}
