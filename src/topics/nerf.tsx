"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "nerf",
  title: "Neural Radiance Fields",
  titleVi: "Trường bức xạ nơ-ron",
  description: "Biểu diễn cảnh 3D bằng mạng nơ-ron, tái tạo góc nhìn mới từ ảnh 2D",
  category: "dl-architectures",
  tags: ["3d", "computer-vision", "rendering"],
  difficulty: "advanced",
  relatedSlugs: ["cnn", "positional-encoding", "transfer-learning"],
  vizType: "static",
};

export default function NerfTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn chụp <strong>vài chục bức ảnh</strong> của một chiếc cốc từ
          nhiều góc khác nhau. Giờ bạn muốn xem chiếc cốc từ <strong>một góc chưa chụp
          bao giờ</strong> &mdash; NeRF có thể tạo ra ảnh đó!
        </p>
        <p>
          Nó học một <strong>&quot;hàm 3D&quot;</strong>: cho biết tại mọi điểm (x, y, z)
          trong không gian, nhìn từ hướng (θ, φ), ánh sáng có màu gì và đậm nhạt ra sao.
          Như thể bạn đang nhìn vào một thế giới ảo được xây từ các bức ảnh thật.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <svg
          viewBox="0 0 500 300"
          className="w-full rounded-lg border border-border bg-background"
        >
          <text x={250} y={20} fontSize={12} fill="currentColor" className="text-foreground" textAnchor="middle" fontWeight={600}>
            NeRF: Từ ảnh 2D &rarr; Cảnh 3D
          </text>

          {/* Input photos (left) */}
          <text x={70} y={45} fontSize={10} fill="#3b82f6" textAnchor="middle" fontWeight={600}>
            Ảnh đầu vào
          </text>
          {[0, 1, 2].map((i) => {
            const y = 55 + i * 50;
            const rot = -10 + i * 10;
            return (
              <g key={i} transform={`rotate(${rot}, ${70}, ${y + 18})`}>
                <rect x={35} y={y} width={70} height={45} rx={4}
                  fill="#3b82f6" opacity={0.1} stroke="#3b82f6" strokeWidth={1.5} />
                <text x={70} y={y + 20} fontSize={8} fill="#3b82f6" textAnchor="middle">
                  Góc {i + 1}
                </text>
                {/* Camera icon */}
                <circle cx={70} cy={y + 32} r={6} fill="none" stroke="#3b82f6" strokeWidth={1} />
                <circle cx={70} cy={y + 32} r={2} fill="#3b82f6" />
              </g>
            );
          })}

          {/* Arrow: photos -> MLP */}
          <line x1={120} y1={130} x2={160} y2={130} stroke="#888" strokeWidth={2} />
          <polygon points="165,130 158,125 158,135" fill="#888" />

          {/* MLP (center) */}
          <rect x={170} y={60} width={160} height={140} rx={12}
            fill="#f97316" opacity={0.08} stroke="#f97316" strokeWidth={2} />
          <text x={250} y={85} fontSize={12} fill="#f97316" textAnchor="middle" fontWeight={700}>
            MLP (Mạng nơ-ron)
          </text>

          {/* Input to MLP */}
          <text x={250} y={108} fontSize={9} fill="#f97316" textAnchor="middle">
            Input: (x, y, z, θ, φ)
          </text>
          <text x={250} y={122} fontSize={9} fill="#f97316" textAnchor="middle">
            Vị trí 3D + Hướng nhìn
          </text>

          {/* Positional encoding note */}
          <rect x={190} y={130} width={120} height={18} rx={4}
            fill="#8b5cf6" opacity={0.1} stroke="#8b5cf6" strokeWidth={1} />
          <text x={250} y={143} fontSize={8} fill="#8b5cf6" textAnchor="middle">
            + Positional Encoding
          </text>

          {/* Output from MLP */}
          <text x={250} y={168} fontSize={9} fill="#f97316" textAnchor="middle">
            Output: (r, g, b, &sigma;)
          </text>
          <text x={250} y={182} fontSize={9} fill="#f97316" textAnchor="middle">
            Màu sắc + Mật độ
          </text>

          {/* Arrow: MLP -> rendering */}
          <line x1={330} y1={130} x2={360} y2={130} stroke="#888" strokeWidth={2} />
          <polygon points="365,130 358,125 358,135" fill="#888" />

          {/* Volume rendering (right) */}
          <rect x={370} y={70} width={120} height={55} rx={10}
            fill="#22c55e" opacity={0.1} stroke="#22c55e" strokeWidth={1.5} />
          <text x={430} y={92} fontSize={10} fill="#22c55e" textAnchor="middle" fontWeight={600}>
            Volume Rendering
          </text>
          <text x={430} y={108} fontSize={8} fill="#22c55e" textAnchor="middle">
            Tích phân dọc tia nhìn
          </text>

          {/* Output: novel view */}
          <rect x={380} y={140} width={100} height={70} rx={8}
            fill="#ec4899" opacity={0.1} stroke="#ec4899" strokeWidth={2} />
          <text x={430} y={165} fontSize={10} fill="#ec4899" textAnchor="middle" fontWeight={700}>
            Góc nhìn mới!
          </text>
          <text x={430} y={180} fontSize={8} fill="#ec4899" textAnchor="middle">
            (chưa từng chụp)
          </text>
          {/* Star effect */}
          <text x={430} y={200} fontSize={16} fill="#ec4899" textAnchor="middle">
            *
          </text>
          <line x1={430} y1={125} x2={430} y2={140} stroke="#22c55e" strokeWidth={1.5} />

          {/* Ray diagram */}
          <text x={250} y={225} fontSize={10} fill="currentColor" className="text-foreground" textAnchor="middle" fontWeight={600}>
            Volume Rendering: bắn tia qua cảnh
          </text>

          {/* Camera */}
          <circle cx={80} cy={260} r={8} fill="none" stroke="#3b82f6" strokeWidth={2} />
          <circle cx={80} cy={260} r={3} fill="#3b82f6" />

          {/* Ray */}
          <line x1={88} y1={260} x2={430} y2={260} stroke="#f59e0b" strokeWidth={1.5} />

          {/* Sample points along ray */}
          {[0, 1, 2, 3, 4].map((i) => {
            const x = 130 + i * 70;
            const opacity = 0.1 + Math.random() * 0.5;
            return (
              <g key={`sample-${i}`}>
                <circle cx={x} cy={260} r={4} fill="#f97316" opacity={opacity} />
                <text x={x} y={280} fontSize={7} fill="currentColor" className="text-muted" textAnchor="middle">
                  (r,g,b,&sigma;)
                </text>
              </g>
            );
          })}

          <text x={440} y={255} fontSize={9} fill="#22c55e" fontWeight={600}>
            &sum; &rarr; pixel
          </text>
        </svg>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>NeRF (Neural Radiance Fields)</strong> biểu diễn cảnh 3D bằng một
          <strong> MLP đơn giản</strong>: F(x, y, z, θ, φ) &rarr; (r, g, b, &sigma;).
          Với mỗi điểm trong không gian và hướng nhìn, MLP trả về màu sắc và mật độ.
        </p>
        <p>
          Để tạo ảnh từ góc mới: bắn tia (ray) từ camera, lấy mẫu nhiều điểm trên tia,
          hỏi MLP tại mỗi điểm, rồi tích phân (volume rendering) dọc tia để tính màu pixel.
          <strong> Positional encoding</strong> giúp MLP nắm bắt chi tiết tần số cao.
        </p>
        <p>
          Ứng dụng: <strong>Google Maps immersive view</strong>, VR/AR, điện ảnh (VFX),
          bất động sản ảo, bảo tồn di sản. Biến thể: <strong>Instant-NGP</strong> (nhanh
          hơn 1000x), <strong>3D Gaussian Splatting</strong> (render realtime).
        </p>
      </ExplanationSection>
    </>
  );
}
