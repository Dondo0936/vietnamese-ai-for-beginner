"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "autoencoder",
  title: "Autoencoder",
  titleVi: "Bộ tự mã hóa",
  description: "Mạng nén dữ liệu vào biểu diễn chiều thấp rồi tái tạo lại, học đặc trưng quan trọng nhất",
  category: "dl-architectures",
  tags: ["unsupervised-learning", "compression", "representation"],
  difficulty: "intermediate",
  relatedSlugs: ["vae", "pca", "gan"],
  vizType: "interactive",
};

export default function AutoencoderTopic() {
  const [bottleneck, setBottleneck] = useState(3);

  const encoderLayers = [8, 6, bottleneck];
  const decoderLayers = [bottleneck, 6, 8];
  const allLayers = [...encoderLayers, ...decoderLayers.slice(1)];

  const layerX = (i: number) => 50 + i * 85;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn cần gửi một bức ảnh qua đường truyền rất hẹp. Bạn phải
          <strong> nén</strong> bức ảnh xuống vài con số quan trọng nhất (encoder), truyền
          đi, rồi người nhận <strong>tái tạo</strong> bức ảnh từ những con số đó (decoder).
        </p>
        <p>
          <strong>Autoencoder</strong> học cách nén và giải nén sao cho ảnh tái tạo giống
          ảnh gốc nhất có thể. Phần &quot;cổ chai&quot; ở giữa chính là <strong>biểu diễn
          nén</strong> &mdash; bản chất của dữ liệu.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <p className="mb-3 text-sm text-muted">
          Kéo thanh trượt để thay đổi kích thước cổ chai (bottleneck). Bottleneck nhỏ
          hơn buộc mạng học biểu diễn nén hơn.
        </p>
        <svg
          viewBox="0 0 500 260"
          className="w-full rounded-lg border border-border bg-background"
        >
          {/* Encoder label */}
          <rect x={40} y={5} width={170} height={22} rx={6} fill="#3b82f6" opacity={0.1} />
          <text x={125} y={20} fontSize={11} fill="#3b82f6" textAnchor="middle" fontWeight={600}>
            Encoder (Mã hóa)
          </text>

          {/* Decoder label */}
          <rect x={290} y={5} width={170} height={22} rx={6} fill="#22c55e" opacity={0.1} />
          <text x={375} y={20} fontSize={11} fill="#22c55e" textAnchor="middle" fontWeight={600}>
            Decoder (Giải mã)
          </text>

          {/* Bottleneck label */}
          <text x={layerX(2)} y={20} fontSize={10} fill="#f59e0b" textAnchor="middle" fontWeight={700}>
            Bottleneck
          </text>

          {/* Layers and connections */}
          {allLayers.map((nodeCount, li) => {
            const x = layerX(li);
            const isBottleneck = li === 2;
            const isEncoder = li < 2;
            const color = isBottleneck ? "#f59e0b" : isEncoder ? "#3b82f6" : "#22c55e";

            return (
              <g key={li}>
                {/* Nodes */}
                {Array.from({ length: nodeCount }, (_, ni) => {
                  const y = 130 - ((nodeCount - 1) * 22) / 2 + ni * 22;
                  return (
                    <circle
                      key={ni}
                      cx={x} cy={y} r={8}
                      fill={color} opacity={0.3}
                      stroke={color} strokeWidth={1.5}
                    />
                  );
                })}

                {/* Connections to next layer */}
                {li < allLayers.length - 1 &&
                  Array.from({ length: nodeCount }, (_, ni) => {
                    const y1 = 130 - ((nodeCount - 1) * 22) / 2 + ni * 22;
                    const nextCount = allLayers[li + 1];
                    return Array.from({ length: nextCount }, (_, nj) => {
                      const y2 = 130 - ((nextCount - 1) * 22) / 2 + nj * 22;
                      return (
                        <line
                          key={`${ni}-${nj}`}
                          x1={x + 8} y1={y1}
                          x2={layerX(li + 1) - 8} y2={y2}
                          stroke={color} strokeWidth={0.4} opacity={0.3}
                        />
                      );
                    });
                  })}

                {/* Layer size label */}
                <text x={x} y={130 + ((nodeCount - 1) * 22) / 2 + 25} fontSize={10}
                  fill={color} textAnchor="middle" fontWeight={600}>
                  {nodeCount}
                </text>
              </g>
            );
          })}

          {/* Input/Output labels */}
          <text x={layerX(0)} y={240} fontSize={10} fill="currentColor" className="text-muted" textAnchor="middle">
            Input x
          </text>
          <text x={layerX(allLayers.length - 1)} y={240} fontSize={10} fill="currentColor" className="text-muted" textAnchor="middle">
            Output x&apos;
          </text>

          {/* Loss */}
          <text x={250} y={255} fontSize={10} fill="#ef4444" textAnchor="middle">
            Loss = ||x - x&apos;||&sup2; (Reconstruction Error)
          </text>
        </svg>
        <div className="mt-4 flex items-center gap-4">
          <label className="text-sm font-medium text-foreground">Kích thước bottleneck:</label>
          <input
            type="range"
            min={1}
            max={6}
            value={bottleneck}
            onChange={(e) => setBottleneck(Number(e.target.value))}
            className="flex-1 accent-accent"
          />
          <span className="w-6 text-center text-sm font-bold text-accent">{bottleneck}</span>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Autoencoder</strong> là mạng nơ-ron học <strong>nén và tái tạo</strong>
          dữ liệu. Encoder nén input x thành biểu diễn z chiều thấp (latent code), decoder
          tái tạo x&apos; từ z. Mục tiêu: tối thiểu <em>||x - x&apos;||&sup2;</em>.
        </p>
        <p>
          Bottleneck buộc mạng học <strong>đặc trưng quan trọng nhất</strong> &mdash; giống
          PCA nhưng phi tuyến. Ứng dụng: <strong>giảm chiều</strong>, <strong>phát hiện
          bất thường</strong> (anomaly detection), <strong>khử nhiễu</strong> (denoising
          autoencoder), <strong>nén dữ liệu</strong>.
        </p>
        <p>
          Biến thể quan trọng: <strong>VAE</strong> (thêm ràng buộc xác suất để sinh dữ
          liệu mới), <strong>Sparse Autoencoder</strong> (ép biểu diễn thưa), <strong>
          Contractive Autoencoder</strong> (ép biểu diễn robust).
        </p>
      </ExplanationSection>
    </>
  );
}
