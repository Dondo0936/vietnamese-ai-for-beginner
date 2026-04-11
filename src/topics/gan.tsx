"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "gan",
  title: "Generative Adversarial Network",
  titleVi: "Mạng đối sinh",
  description: "Hai mạng cạnh tranh: Generator tạo dữ liệu giả, Discriminator phân biệt thật/giả",
  category: "dl-architectures",
  tags: ["generative", "unsupervised-learning", "adversarial"],
  difficulty: "advanced",
  relatedSlugs: ["vae", "autoencoder", "diffusion-models"],
  vizType: "interactive",
};

export default function GanTopic() {
  const [round, setRound] = useState(0);
  const maxRound = 6;

  const genQuality = Math.min(95, 20 + round * 13);
  const discAccuracy = Math.max(55, 95 - round * 7);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng cuộc đối đầu giữa <strong>họa sĩ giả mạo</strong> (Generator)
          và <strong>thám tử nghệ thuật</strong> (Discriminator). Họa sĩ cố vẽ tranh giả
          giống thật nhất; thám tử cố phân biệt tranh thật và giả.
        </p>
        <p>
          Ban đầu họa sĩ vẽ dở, thám tử dễ phân biệt. Nhưng họa sĩ học từ sai lầm, vẽ
          ngày càng giỏi hơn, buộc thám tử cũng phải giỏi hơn. Cuối cùng, tranh giả
          <strong> không thể phân biệt</strong> với tranh thật.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <p className="mb-3 text-sm text-muted">
          Nhấp nút để đi qua các vòng huấn luyện. Quan sát chất lượng Generator tăng dần.
        </p>
        <svg
          viewBox="0 0 500 280"
          className="w-full rounded-lg border border-border bg-background"
        >
          {/* Generator */}
          <rect x={20} y={30} width={140} height={90} rx={12}
            fill="#3b82f6" opacity={0.1} stroke="#3b82f6" strokeWidth={2} />
          <text x={90} y={55} fontSize={13} fill="#3b82f6" textAnchor="middle" fontWeight={700}>
            Generator
          </text>
          <text x={90} y={72} fontSize={10} fill="#3b82f6" textAnchor="middle">
            (Họa sĩ giả mạo)
          </text>
          <text x={90} y={92} fontSize={11} fill="#3b82f6" textAnchor="middle">
            Chất lượng: {genQuality}%
          </text>
          {/* Quality bar */}
          <rect x={35} y={100} width={110} height={8} rx={4} fill="#3b82f6" opacity={0.1} />
          <rect x={35} y={100} width={genQuality * 1.1} height={8} rx={4} fill="#3b82f6" opacity={0.5} />

          {/* Noise input */}
          <text x={90} y={20} fontSize={10} fill="currentColor" className="text-muted" textAnchor="middle">
            z ~ N(0,1) (Nhiễu)
          </text>
          <line x1={90} y1={22} x2={90} y2={30} stroke="#888" strokeWidth={1} />

          {/* Arrow: Gen -> Disc */}
          <line x1={160} y1={75} x2={205} y2={75} stroke="#888" strokeWidth={2} />
          <polygon points="210,75 203,70 203,80" fill="#888" />
          <text x={185} y={65} fontSize={9} fill="currentColor" className="text-muted" textAnchor="middle">
            Ảnh giả
          </text>

          {/* Discriminator */}
          <rect x={210} y={30} width={140} height={90} rx={12}
            fill="#ef4444" opacity={0.1} stroke="#ef4444" strokeWidth={2} />
          <text x={280} y={55} fontSize={13} fill="#ef4444" textAnchor="middle" fontWeight={700}>
            Discriminator
          </text>
          <text x={280} y={72} fontSize={10} fill="#ef4444" textAnchor="middle">
            (Thám tử)
          </text>
          <text x={280} y={92} fontSize={11} fill="#ef4444" textAnchor="middle">
            Phân biệt: {discAccuracy}%
          </text>
          <rect x={225} y={100} width={110} height={8} rx={4} fill="#ef4444" opacity={0.1} />
          <rect x={225} y={100} width={discAccuracy * 1.1} height={8} rx={4} fill="#ef4444" opacity={0.5} />

          {/* Real data input */}
          <text x={280} y={20} fontSize={10} fill="#22c55e" textAnchor="middle">
            Ảnh thật
          </text>
          <line x1={280} y1={22} x2={280} y2={30} stroke="#22c55e" strokeWidth={1} />

          {/* Output */}
          <line x1={350} y1={75} x2={395} y2={75} stroke="#888" strokeWidth={2} />
          <polygon points="400,75 393,70 393,80" fill="#888" />
          <rect x={400} y={55} width={80} height={40} rx={8}
            fill="#8b5cf6" opacity={0.1} stroke="#8b5cf6" strokeWidth={1.5} />
          <text x={440} y={72} fontSize={10} fill="#8b5cf6" textAnchor="middle" fontWeight={600}>
            Thật / Giả?
          </text>
          <text x={440} y={86} fontSize={10} fill="#8b5cf6" textAnchor="middle">
            {discAccuracy > 70 ? "Phân biệt được" : "Khó phân biệt!"}
          </text>

          {/* Feedback loop */}
          <path d="M 440,95 L 440,160 L 90,160 L 90,120" fill="none" stroke="#f59e0b" strokeWidth={1.5}
            strokeDasharray="6 3" />
          <polygon points="90,120 86,128 94,128" fill="#f59e0b" />
          <text x={265} y={175} fontSize={10} fill="#f59e0b" textAnchor="middle" fontWeight={600}>
            Gradient phản hồi (G học từ D)
          </text>

          {/* Round info */}
          <rect x={130} y={200} width={240} height={50} rx={10}
            fill="#f97316" opacity={0.08} stroke="#f97316" strokeWidth={1} />
          <text x={250} y={220} fontSize={13} fill="#f97316" textAnchor="middle" fontWeight={700}>
            Vòng huấn luyện: {round}/{maxRound}
          </text>
          <text x={250} y={238} fontSize={10} fill="currentColor" className="text-muted" textAnchor="middle">
            {round === 0 ? "Bắt đầu: G vẽ nhiễu, D dễ phân biệt" :
             round < 3 ? "G cải thiện, D vẫn phân biệt được" :
             round < 5 ? "G khá giỏi, D bắt đầu gặp khó" :
             "Cân bằng Nash: G tạo ảnh rất thật!"}
          </text>
        </svg>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => setRound(Math.min(maxRound, round + 1))}
            disabled={round >= maxRound}
            className="rounded-lg border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-white disabled:opacity-30"
          >
            Vòng tiếp
          </button>
          <button
            onClick={() => setRound(0)}
            className="rounded-lg border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-white"
          >
            Đặt lại
          </button>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>GAN (Generative Adversarial Network)</strong> gồm hai mạng huấn luyện
          đối kháng. <strong>Generator G</strong> biến nhiễu ngẫu nhiên thành dữ liệu giả.
          <strong> Discriminator D</strong> phân biệt dữ liệu thật và giả.
        </p>
        <p>
          Hàm mục tiêu là trò chơi minimax: G cố <strong>tối đa hóa</strong> xác suất D
          phân loại sai, D cố <strong>tối thiểu hóa</strong> lỗi phân loại. Khi đạt cân
          bằng Nash, D không phân biệt được thật/giả (xác suất = 0.5).
        </p>
        <p>
          Ứng dụng: <strong>sinh ảnh khuôn mặt</strong> (StyleGAN), <strong>chuyển đổi
          phong cách</strong> (CycleGAN), <strong>siêu phân giải</strong> (SRGAN). Thách
          thức: <strong>mode collapse</strong> (G chỉ tạo vài mẫu), huấn luyện không ổn
          định. Diffusion Models đang dần thay thế GAN trong nhiều ứng dụng.
        </p>
      </ExplanationSection>
    </>
  );
}
