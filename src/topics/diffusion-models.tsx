"use client";

import { useState, useMemo } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "diffusion-models",
  title: "Diffusion Models",
  titleVi: "Mô hình khuếch tán",
  description: "Sinh dữ liệu bằng cách học đảo ngược quá trình thêm nhiễu từng bước",
  category: "dl-architectures",
  tags: ["generative", "image-generation", "state-of-the-art"],
  difficulty: "advanced",
  relatedSlugs: ["gan", "vae", "u-net"],
  vizType: "interactive",
};

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export default function DiffusionModelsTopic() {
  const [step, setStep] = useState(5);
  const maxStep = 10;

  const noiseLevel = step / maxStep;
  const denoiseLevel = 1 - noiseLevel;

  const gridSize = 8;
  const cellSize = 30;

  const pixels = useMemo(() => {
    const rng = seededRandom(123);
    const basePattern = Array.from({ length: gridSize }, (_, r) =>
      Array.from({ length: gridSize }, (_, c) => {
        const inCircle = Math.sqrt((r - 3.5) ** 2 + (c - 3.5) ** 2) < 3;
        return inCircle ? 0.8 : 0.15;
      })
    );

    return basePattern.map((row) =>
      row.map((val) => {
        const noise = (rng() - 0.5) * noiseLevel * 1.5;
        return Math.max(0, Math.min(1, val * denoiseLevel + noiseLevel * 0.5 + noise));
      })
    );
  }, [noiseLevel, denoiseLevel]);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn xem video <strong>quay ngược</strong> của mực bị nhỏ vào nước.
          Theo chiều xuôi: mực lan ra, hòa vào nước (thêm nhiễu). Theo chiều ngược: mực
          tập trung lại thành hình (khử nhiễu).
        </p>
        <p>
          <strong>Diffusion Models</strong> học cách &quot;quay ngược&quot; &mdash; bắt đầu
          từ nhiễu thuần túy và <strong>từng bước khử nhiễu</strong> cho đến khi tạo ra ảnh
          rõ ràng. Mỗi bước chỉ cần khử một chút nhiễu, nên rất ổn định.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <p className="mb-3 text-sm text-muted">
          Kéo thanh trượt: trái = ảnh rõ (đã khử nhiễu), phải = nhiễu thuần túy. Quá trình
          sinh ảnh đi từ phải sang trái.
        </p>
        <svg
          viewBox="0 0 500 300"
          className="w-full rounded-lg border border-border bg-background"
        >
          {/* Forward process arrow */}
          <text x={250} y={18} fontSize={11} fill="currentColor" className="text-foreground" textAnchor="middle" fontWeight={600}>
            t = {step} / {maxStep}
          </text>

          {/* Grid */}
          {pixels.map((row, r) =>
            row.map((val, c) => {
              const x = 125 + c * cellSize;
              const y = 30 + r * cellSize;
              const gray = Math.round(val * 255);
              return (
                <rect
                  key={`${r}-${c}`}
                  x={x} y={y}
                  width={cellSize - 1} height={cellSize - 1}
                  rx={3}
                  fill={`rgb(${gray}, ${gray}, ${gray})`}
                  stroke="currentColor"
                  className="text-border"
                  strokeWidth={0.3}
                />
              );
            })
          )}

          {/* Process labels */}
          <text x={100} y={155} fontSize={10} fill="#22c55e" textAnchor="end" fontWeight={600}>
            Ảnh rõ
          </text>
          <text x={375} y={155} fontSize={10} fill="#ef4444" fontWeight={600}>
            Nhiễu
          </text>

          {/* Arrow labels at bottom */}
          <line x1={140} y1={278} x2={360} y2={278} stroke="#3b82f6" strokeWidth={1.5} />
          <polygon points="140,278 148,274 148,282" fill="#3b82f6" />
          <text x={250} y={293} fontSize={10} fill="#3b82f6" textAnchor="middle" fontWeight={600}>
            &larr; Reverse (Khử nhiễu - Sinh ảnh)
          </text>

          <line x1={140} y1={265} x2={360} y2={265} stroke="#ef4444" strokeWidth={1.5} />
          <polygon points="360,265 352,261 352,269" fill="#ef4444" />
          <text x={250} y={260} fontSize={10} fill="#ef4444" textAnchor="middle" fontWeight={600}>
            Forward (Thêm nhiễu) &rarr;
          </text>
        </svg>
        <div className="mt-4 flex items-center gap-4">
          <label className="text-sm font-medium text-foreground">Mức nhiễu (t):</label>
          <input
            type="range"
            min={0}
            max={maxStep}
            value={step}
            onChange={(e) => setStep(Number(e.target.value))}
            className="flex-1 accent-accent"
          />
          <span className="w-10 text-center text-sm font-bold text-accent">{step}/{maxStep}</span>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Diffusion Models</strong> gồm 2 quá trình: <strong>Forward</strong> (thêm
          nhiễu Gaussian dần dần cho đến khi dữ liệu thành nhiễu thuần) và <strong>
          Reverse</strong> (học dự đoán và loại bỏ nhiễu tại mỗi bước để tái tạo dữ liệu).
        </p>
        <p>
          Mạng nơ-ron (thường là <strong>U-Net</strong>) được huấn luyện để dự đoán nhiễu
          &epsilon; đã thêm vào tại mỗi bước t. Khi sinh ảnh: bắt đầu từ nhiễu ngẫu nhiên,
          gọi mạng T lần để khử nhiễu dần &mdash; mỗi lần một chút.
        </p>
        <p>
          Ưu điểm: ảnh <strong>chất lượng cao, đa dạng</strong>, huấn luyện <strong>ổn
          định</strong> hơn GAN. Nhược điểm: <strong>chậm</strong> khi sinh (cần nhiều bước).
          Ứng dụng: <strong>Stable Diffusion</strong>, <strong>DALL-E</strong>,
          <strong> Midjourney</strong>.
        </p>
      </ExplanationSection>
    </>
  );
}
