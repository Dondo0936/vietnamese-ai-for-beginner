"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
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
  vizType: "static",
};

const encoderLayers = [
  { w: 80, h: 80, label: "64", y: 30 },
  { w: 65, h: 65, label: "128", y: 50 },
  { w: 50, h: 50, label: "256", y: 70 },
  { w: 35, h: 35, label: "512", y: 90 },
];

const bottleneck = { w: 25, h: 25, label: "1024", y: 110 };

const decoderLayers = [
  { w: 35, h: 35, label: "512", y: 90 },
  { w: 50, h: 50, label: "256", y: 70 },
  { w: 65, h: 65, label: "128", y: 50 },
  { w: 80, h: 80, label: "64", y: 30 },
];

export default function UNetTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang vẽ bản đồ chi tiết từ ảnh vệ tinh. Bước 1: bạn
          <strong> thu nhỏ</strong> ảnh dần, nắm bắt &quot;bức tranh tổng thể&quot; (đâu
          là sông, đâu là rừng). Bước 2: bạn <strong>phóng to lại</strong> dần, vẽ chi tiết
          ranh giới từng vùng.
        </p>
        <p>
          Để không mất chi tiết khi thu nhỏ, bạn ghi chú lại ở mỗi mức &mdash; đây là
          <strong> skip connections</strong>. Kết quả: <strong>U-Net</strong> hiểu cả bức
          tranh tổng thể lẫn chi tiết pixel.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <svg
          viewBox="0 0 500 280"
          className="w-full rounded-lg border border-border bg-background"
        >
          <text x={250} y={18} fontSize={12} fill="currentColor" className="text-foreground" textAnchor="middle" fontWeight={600}>
            Kiến trúc U-Net (hình chữ U)
          </text>

          {/* Encoder (left side - going down) */}
          <text x={80} y={28} fontSize={10} fill="#3b82f6" textAnchor="middle" fontWeight={600}>
            Encoder
          </text>
          {encoderLayers.map((layer, i) => {
            const x = 40 + i * 30;
            const y = layer.y;
            return (
              <g key={`enc-${i}`}>
                <rect x={x} y={y} width={layer.w} height={20} rx={4}
                  fill="#3b82f6" opacity={0.2} stroke="#3b82f6" strokeWidth={1.5} />
                <text x={x + layer.w / 2} y={y + 14} fontSize={8} fill="#3b82f6" textAnchor="middle">
                  {layer.label}
                </text>
                {/* Down arrow */}
                {i < encoderLayers.length - 1 && (
                  <line x1={x + layer.w / 2 + 15} y1={y + 20} x2={x + 30 + (encoderLayers[i + 1].w) / 2}
                    y2={encoderLayers[i + 1].y}
                    stroke="#3b82f6" strokeWidth={1} />
                )}
              </g>
            );
          })}

          {/* Bottleneck */}
          <rect x={160} y={bottleneck.y} width={180} height={22} rx={6}
            fill="#f59e0b" opacity={0.2} stroke="#f59e0b" strokeWidth={2} />
          <text x={250} y={bottleneck.y + 15} fontSize={10} fill="#f59e0b" textAnchor="middle" fontWeight={700}>
            Bottleneck ({bottleneck.label})
          </text>

          {/* Last encoder to bottleneck */}
          <line x1={155} y1={110} x2={160} y2={bottleneck.y + 11}
            stroke="#3b82f6" strokeWidth={1} />

          {/* Bottleneck to first decoder */}
          <line x1={340} y1={bottleneck.y + 11} x2={345} y2={110}
            stroke="#22c55e" strokeWidth={1} />

          {/* Decoder (right side - going up) */}
          <text x={420} y={28} fontSize={10} fill="#22c55e" textAnchor="middle" fontWeight={600}>
            Decoder
          </text>
          {decoderLayers.map((layer, i) => {
            const x = 460 - i * 30 - layer.w;
            const y = layer.y;
            return (
              <g key={`dec-${i}`}>
                <rect x={x} y={y} width={layer.w} height={20} rx={4}
                  fill="#22c55e" opacity={0.2} stroke="#22c55e" strokeWidth={1.5} />
                <text x={x + layer.w / 2} y={y + 14} fontSize={8} fill="#22c55e" textAnchor="middle">
                  {layer.label}
                </text>
                {/* Up arrow */}
                {i < decoderLayers.length - 1 && (
                  <line x1={x + layer.w / 2 - 15} y1={y}
                    x2={460 - (i + 1) * 30 - decoderLayers[i + 1].w / 2}
                    y2={decoderLayers[i + 1].y + 20}
                    stroke="#22c55e" strokeWidth={1} />
                )}
              </g>
            );
          })}

          {/* Skip connections (horizontal arrows) */}
          {encoderLayers.map((enc, i) => {
            const dec = decoderLayers[decoderLayers.length - 1 - i];
            const encX = 40 + i * 30 + enc.w;
            const decX = 460 - (decoderLayers.length - 1 - i) * 30 - dec.w;
            const y = enc.y + 10;

            return (
              <g key={`skip-${i}`}>
                <line x1={encX + 5} y1={y} x2={decX - 5} y2={y}
                  stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="6 3" />
                <polygon points={`${decX - 5},${y} ${decX - 12},${y - 3} ${decX - 12},${y + 3}`}
                  fill="#8b5cf6" />
                {i === 0 && (
                  <text x={(encX + decX) / 2} y={y - 6} fontSize={8} fill="#8b5cf6" textAnchor="middle">
                    Skip Connection
                  </text>
                )}
              </g>
            );
          })}

          {/* Input/Output */}
          <text x={60} y={125} fontSize={9} fill="currentColor" className="text-muted" textAnchor="middle">
            Input Image
          </text>
          <text x={440} y={125} fontSize={9} fill="currentColor" className="text-muted" textAnchor="middle">
            Segmentation Map
          </text>

          {/* Legend */}
          <rect x={100} y={145} width={300} height={50} rx={8} fill="currentColor" className="text-card" opacity={0.5} />
          <line x1={120} y1={160} x2={150} y2={160} stroke="#3b82f6" strokeWidth={2} />
          <text x={155} y={164} fontSize={9} fill="#3b82f6">Encoder: nén &amp; trích đặc trưng</text>
          <line x1={120} y1={175} x2={150} y2={175} stroke="#22c55e" strokeWidth={2} />
          <text x={155} y={179} fontSize={9} fill="#22c55e">Decoder: phóng to &amp; tái tạo chi tiết</text>
          <line x1={120} y1={190} x2={150} y2={190} stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="6 3" />
          <text x={155} y={194} fontSize={9} fill="#8b5cf6">Skip: truyền chi tiết từ encoder sang decoder</text>
        </svg>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>U-Net</strong> (2015) là kiến trúc encoder-decoder hình chữ U, ban đầu
          thiết kế cho <strong>phân đoạn ảnh y tế</strong>. Ý tưởng: encoder nén ảnh xuống
          biểu diễn nhỏ, decoder phóng to lại; skip connections truyền chi tiết từ encoder
          sang decoder tương ứng.
        </p>
        <p>
          Skip connections giúp decoder có cả <strong>thông tin ngữ cảnh</strong> (từ
          bottleneck) lẫn <strong>chi tiết không gian</strong> (từ encoder). Kết quả:
          phân đoạn chính xác đến từng pixel.
        </p>
        <p>
          U-Net cũng là backbone chính trong <strong>Diffusion Models</strong> (Stable
          Diffusion dùng U-Net để dự đoán nhiễu). Ứng dụng: phân đoạn ảnh y tế, vệ tinh,
          tự lái, và sinh ảnh.
        </p>
      </ExplanationSection>
    </>
  );
}
