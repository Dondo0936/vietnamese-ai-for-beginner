"use client";

import { useState, useMemo } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "vae",
  title: "Variational Autoencoder",
  titleVi: "Bộ tự mã hóa biến phân",
  description: "Autoencoder với không gian tiềm ẩn có cấu trúc xác suất, cho phép sinh dữ liệu mới",
  category: "dl-architectures",
  tags: ["generative", "unsupervised-learning", "probability"],
  difficulty: "advanced",
  relatedSlugs: ["autoencoder", "gan", "diffusion-models"],
  vizType: "interactive",
};

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export default function VaeTopic() {
  const [sampleX, setSampleX] = useState(250);
  const [sampleY, setSampleY] = useState(150);

  const latentPoints = useMemo(() => {
    const rng = seededRandom(42);
    return Array.from({ length: 30 }, () => ({
      x: 150 + (rng() - 0.5) * 200,
      y: 80 + (rng() - 0.5) * 160,
      label: rng() > 0.5 ? "A" : "B",
    }));
  }, []);

  const nearestLabel = useMemo(() => {
    let minD = Infinity;
    let label = "A";
    latentPoints.forEach((p) => {
      const d = (p.x - sampleX) ** 2 + (p.y - sampleY) ** 2;
      if (d < minD) { minD = d; label = p.label; }
    });
    return label;
  }, [latentPoints, sampleX, sampleY]);

  return (
    <>
      <AnalogyCard>
        <p>
          Autoencoder thường nén ảnh mèo thành một điểm cố định trong không gian tiềm ẩn.
          Nhưng nếu bạn lấy một điểm <strong>ngẫu nhiên gần đó</strong>, kết quả có thể vô
          nghĩa &mdash; giống như tìm một thành phố không tồn tại trên bản đồ.
        </p>
        <p>
          <strong>VAE</strong> giải quyết bằng cách ép không gian tiềm ẩn thành <strong>phân
          bố xác suất mượt</strong>. Mỗi ảnh mèo không phải một điểm mà là một <strong>vùng
          mờ</strong> (phân bố Gaussian). Nhờ vậy, bạn có thể lấy mẫu bất kỳ đâu và luôn
          giải mã được thứ có ý nghĩa.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <p className="mb-3 text-sm text-muted">
          Nhấp vào không gian tiềm ẩn để &quot;lấy mẫu&quot; tại vị trí đó. Quan sát
          các điểm đã mã hóa phân bố đều trong không gian.
        </p>
        <svg
          viewBox="0 0 500 280"
          className="w-full cursor-crosshair rounded-lg border border-border bg-background"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 500;
            const y = ((e.clientY - rect.top) / rect.height) * 280;
            if (x > 50 && x < 450 && y > 30 && y < 250) {
              setSampleX(x);
              setSampleY(y);
            }
          }}
        >
          {/* Title */}
          <text x={250} y={20} fontSize={12} fill="currentColor" className="text-foreground" textAnchor="middle" fontWeight={600}>
            Không gian tiềm ẩn (Latent Space)
          </text>

          {/* Background distribution (Gaussian contours) */}
          {[120, 80, 50].map((r, i) => (
            <ellipse
              key={i}
              cx={250} cy={140}
              rx={r * 1.5} ry={r}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth={0.8}
              opacity={0.15 + i * 0.05}
              strokeDasharray="4 3"
            />
          ))}

          {/* Encoded points */}
          {latentPoints.map((p, i) => (
            <circle
              key={i}
              cx={p.x} cy={p.y}
              r={4}
              fill={p.label === "A" ? "#3b82f6" : "#ef4444"}
              opacity={0.6}
              stroke="#fff"
              strokeWidth={0.8}
            />
          ))}

          {/* Sample point */}
          <circle cx={sampleX} cy={sampleY} r={8}
            fill="#f59e0b" stroke="#fff" strokeWidth={2} />
          <text x={sampleX + 12} y={sampleY + 4} fontSize={10} fill="#f59e0b" fontWeight={600}>
            Mẫu &rarr; {nearestLabel}
          </text>

          {/* Gaussian cloud around sample */}
          <circle cx={sampleX} cy={sampleY} r={25}
            fill="#f59e0b" opacity={0.08} />

          {/* Legend */}
          <circle cx={60} cy={265} r={4} fill="#3b82f6" />
          <text x={70} y={269} fontSize={10} fill="#3b82f6">Lớp A (mã hóa)</text>
          <circle cx={170} cy={265} r={4} fill="#ef4444" />
          <text x={180} y={269} fontSize={10} fill="#ef4444">Lớp B (mã hóa)</text>
          <circle cx={280} cy={265} r={5} fill="#f59e0b" />
          <text x={290} y={269} fontSize={10} fill="#f59e0b">Điểm lấy mẫu</text>

          {/* z ~ N(mu, sigma) */}
          <text x={420} y={269} fontSize={10} fill="#8b5cf6" fontWeight={600}>
            z ~ N(&mu;, &sigma;&sup2;)
          </text>
        </svg>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>VAE (Variational Autoencoder)</strong> biến autoencoder thành mô hình
          <strong> sinh (generative)</strong>. Thay vì mã hóa input thành một điểm z cố
          định, encoder xuất ra <strong>&mu;</strong> (trung bình) và <strong>&sigma;</strong>
          (độ lệch chuẩn) của phân bố Gaussian.
        </p>
        <p>
          Hàm mất mát gồm 2 phần: <strong>reconstruction loss</strong> (tái tạo giống input)
          + <strong>KL divergence</strong> (ép phân bố latent gần N(0,1)). KL divergence
          đảm bảo không gian tiềm ẩn <strong>mượt và liên tục</strong>.
        </p>
        <p>
          Ứng dụng: <strong>sinh ảnh mới</strong>, <strong>nội suy</strong> giữa hai ảnh
          (đi dọc latent space), <strong>chỉnh sửa thuộc tính</strong> (thay đổi một chiều
          của z). VAE tạo ảnh mờ hơn GAN nhưng latent space có cấu trúc tốt hơn.
        </p>
      </ExplanationSection>
    </>
  );
}
