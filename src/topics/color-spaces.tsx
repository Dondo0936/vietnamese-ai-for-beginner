"use client";

import { useState, useMemo } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "color-spaces",
  title: "Color Spaces",
  titleVi: "Không gian màu",
  description:
    "Các hệ thống biểu diễn màu sắc khác nhau (RGB, HSV, LAB) và ứng dụng trong xử lý ảnh.",
  category: "computer-vision",
  tags: ["computer-vision", "preprocessing", "color"],
  difficulty: "beginner",
  relatedSlugs: ["image-kernels", "data-augmentation", "image-classification"],
  vizType: "interactive",
};

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

export default function ColorSpacesTopic() {
  const [mode, setMode] = useState<"rgb" | "hsv">("rgb");
  const [r, setR] = useState(66);
  const [g, setG] = useState(135);
  const [b, setB] = useState(245);
  const [h, setH] = useState(220);
  const [s, setS] = useState(0.8);
  const [v, setV] = useState(0.96);

  const rgbFromHsv = useMemo(() => hsvToRgb(h, s, v), [h, s, v]);

  const displayColor =
    mode === "rgb"
      ? `rgb(${r},${g},${b})`
      : `rgb(${rgbFromHsv[0]},${rgbFromHsv[1]},${rgbFromHsv[2]})`;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn mô tả <strong>màu áo</strong> cho bạn bè. Bạn có
          thể nói: &quot;Trộn nhiều xanh dương + ít xanh lá + không đỏ&quot; (cách RGB) hoặc
          &quot;Màu xanh dương, khá đậm, sáng vừa&quot; (cách HSV).
        </p>
        <p>
          Cả hai cách đều mô tả <strong>cùng một màu</strong>, nhưng mỗi cách
          có ưu điểm riêng. RGB giống <strong>trộn màu sơn</strong> — tốt cho
          máy tính. HSV giống <strong>cách con người mô tả màu</strong> — tốt
          cho xử lý ảnh. Chuyển đổi giữa các không gian màu giúp giải quyết
          các bài toán khác nhau!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <div className="flex gap-2">
            {(["rgb", "hsv"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  mode === m
                    ? "bg-accent text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {m.toUpperCase()}
              </button>
            ))}
          </div>

          {mode === "rgb" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="text-sm font-medium" style={{ color: "#ef4444" }}>
                  Red: {r}
                </label>
                <input type="range" min="0" max="255" value={r} onChange={(e) => setR(parseInt(e.target.value))} className="w-full accent-red-500" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium" style={{ color: "#22c55e" }}>
                  Green: {g}
                </label>
                <input type="range" min="0" max="255" value={g} onChange={(e) => setG(parseInt(e.target.value))} className="w-full accent-green-500" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium" style={{ color: "#3b82f6" }}>
                  Blue: {b}
                </label>
                <input type="range" min="0" max="255" value={b} onChange={(e) => setB(parseInt(e.target.value))} className="w-full accent-blue-500" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted">
                  Hue (Sắc): {h}&deg;
                </label>
                <input type="range" min="0" max="359" value={h} onChange={(e) => setH(parseInt(e.target.value))} className="w-full accent-accent" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted">
                  Saturation (Bão hòa): {(s * 100).toFixed(0)}%
                </label>
                <input type="range" min="0" max="1" step="0.01" value={s} onChange={(e) => setS(parseFloat(e.target.value))} className="w-full accent-accent" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted">
                  Value (Sáng): {(v * 100).toFixed(0)}%
                </label>
                <input type="range" min="0" max="1" step="0.01" value={v} onChange={(e) => setV(parseFloat(e.target.value))} className="w-full accent-accent" />
              </div>
            </div>
          )}

          <svg viewBox="0 0 600 200" className="w-full max-w-2xl mx-auto">
            {/* Color preview */}
            <rect x="200" y="10" width="200" height="120" rx="12" fill={displayColor} stroke="#475569" strokeWidth="2" />

            {/* Channel breakdown */}
            {mode === "rgb" ? (
              <>
                <rect x="50" y="150" width={r / 255 * 150} height="14" rx="3" fill="#ef4444" opacity={0.8} />
                <text x="50" y="145" fill="#ef4444" fontSize="10">R={r}</text>
                <rect x="225" y="150" width={g / 255 * 150} height="14" rx="3" fill="#22c55e" opacity={0.8} />
                <text x="225" y="145" fill="#22c55e" fontSize="10">G={g}</text>
                <rect x="400" y="150" width={b / 255 * 150} height="14" rx="3" fill="#3b82f6" opacity={0.8} />
                <text x="400" y="145" fill="#3b82f6" fontSize="10">B={b}</text>
              </>
            ) : (
              <>
                <rect x="50" y="150" width={h / 360 * 150} height="14" rx="3" fill="#f59e0b" opacity={0.8} />
                <text x="50" y="145" fill="#f59e0b" fontSize="10">H={h}&deg;</text>
                <rect x="225" y="150" width={s * 150} height="14" rx="3" fill="#8b5cf6" opacity={0.8} />
                <text x="225" y="145" fill="#8b5cf6" fontSize="10">S={(s * 100).toFixed(0)}%</text>
                <rect x="400" y="150" width={v * 150} height="14" rx="3" fill="#e2e8f0" opacity={0.8} />
                <text x="400" y="145" fill="#e2e8f0" fontSize="10">V={(v * 100).toFixed(0)}%</text>
              </>
            )}

            <text x="300" y="190" textAnchor="middle" fill="#64748b" fontSize="10">
              {mode === "rgb" ? "RGB: 3 kênh (Đỏ, Xanh lá, Xanh dương) — mỗi kênh 0-255" : "HSV: Sắc (0-360°), Bão hòa (0-100%), Sáng (0-100%)"}
            </text>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Không gian màu</strong> (Color Space) là hệ thống toán học
          biểu diễn màu sắc. Mỗi không gian phù hợp với mục đích khác nhau
          trong xử lý ảnh và thị giác máy tính.
        </p>
        <p>Các không gian màu phổ biến:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>RGB (Red, Green, Blue):</strong> Chuẩn cho màn hình và ảnh
            số. Mỗi pixel = 3 giá trị 0-255. Phụ thuộc ánh sáng.
          </li>
          <li>
            <strong>HSV (Hue, Saturation, Value):</strong> Gần cách con người
            cảm nhận màu. Tách biệt sắc, độ đậm, và độ sáng — rất tốt cho
            phát hiện màu cụ thể.
          </li>
          <li>
            <strong>LAB (Lightness, A, B):</strong> Đồng đều về tri giác —
            khoảng cách Euclidean phản ánh sự khác biệt mà mắt người thấy.
          </li>
          <li>
            <strong>Grayscale:</strong> Một kênh duy nhất (0-255). Đơn giản,
            bỏ thông tin màu, giữ lại cấu trúc.
          </li>
        </ol>
        <p>
          Chuyển đổi không gian màu là bước tiền xử lý quan trọng. Ví dụ: dùng
          HSV để lọc đối tượng theo màu, LAB để so sánh màu, Grayscale để giảm
          tính toán.
        </p>
      </ExplanationSection>
    </>
  );
}
