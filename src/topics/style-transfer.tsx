"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
  CollapsibleDetail,
  MiniSummary,
  CodeBlock,
  LessonSection,
  LaTeX,
  TopicLink,
  ProgressSteps,
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

/* ── Color grid data ───────────────────────────────────────── */
// 4×4 grid representing the "content image" — architectural pattern
// (think: a window grid with warm accent). Each cell is [r,g,b] in 0–255.
const CONTENT_GRID: [number, number, number][][] = [
  [
    [40, 60, 90],
    [50, 70, 100],
    [45, 65, 95],
    [40, 60, 90],
  ],
  [
    [220, 180, 120],
    [230, 200, 140],
    [225, 190, 130],
    [220, 180, 120],
  ],
  [
    [40, 60, 90],
    [50, 70, 100],
    [45, 65, 95],
    [40, 60, 90],
  ],
  [
    [220, 180, 120],
    [230, 200, 140],
    [225, 190, 130],
    [220, 180, 120],
  ],
];

// 4×4 grid representing the "style image" — Van Gogh Starry Night swirls
// (deep blue background, yellow/orange swirl highlights)
const STYLE_GRID: [number, number, number][][] = [
  [
    [30, 50, 140],
    [60, 80, 180],
    [100, 110, 200],
    [50, 70, 160],
  ],
  [
    [80, 90, 180],
    [240, 200, 80],
    [220, 180, 60],
    [70, 90, 170],
  ],
  [
    [60, 80, 170],
    [210, 170, 70],
    [245, 210, 90],
    [90, 100, 190],
  ],
  [
    [30, 50, 140],
    [70, 85, 170],
    [90, 100, 190],
    [40, 60, 150],
  ],
];

type Triple = [number, number, number];

/** Linear blend two grids by alpha (0 = pure content, 1 = pure style). */
function blendGrids(
  content: Triple[][],
  style: Triple[][],
  alpha: number,
): Triple[][] {
  return content.map((row, i) =>
    row.map((c, j): Triple => {
      const s = style[i][j];
      return [
        Math.round(c[0] * (1 - alpha) + s[0] * alpha),
        Math.round(c[1] * (1 - alpha) + s[1] * alpha),
        Math.round(c[2] * (1 - alpha) + s[2] * alpha),
      ];
    }),
  );
}

/** Fake "Gram matrix" visualization: a 4×4 symmetric matrix of correlations. */
function computeGram(grid: Triple[][]): number[][] {
  // Flatten per channel into 3 feature vectors of length 16.
  const feats: number[][] = [[], [], []];
  for (const row of grid) {
    for (const cell of row) {
      feats[0].push(cell[0] / 255);
      feats[1].push(cell[1] / 255);
      feats[2].push(cell[2] / 255);
    }
  }
  // Add a fourth "spatial variance" feature so we get a 4×4 Gram matrix.
  const variance: number[] = [];
  for (let i = 0; i < 16; i++) {
    const f0 = feats[0][i];
    const f1 = feats[1][i];
    const f2 = feats[2][i];
    variance.push(Math.abs(f0 - f1) + Math.abs(f1 - f2));
  }
  feats.push(variance);

  // Gram = F · F^T, normalised by N.
  const N = 16;
  const gram: number[][] = [];
  for (let i = 0; i < 4; i++) {
    gram.push([]);
    for (let j = 0; j < 4; j++) {
      let s = 0;
      for (let k = 0; k < N; k++) s += feats[i][k] * feats[j][k];
      gram[i].push(s / N);
    }
  }
  return gram;
}

/** Convert a 3-tuple to a CSS rgb() string. */
const rgb = (c: Triple) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;

/* ── Small grid primitive for SVG ──────────────────────────── */
type GridProps = {
  grid: Triple[][];
  x: number;
  y: number;
  size: number;
  label: string;
  labelColor: string;
};

function ColorGrid({ grid, x, y, size, label, labelColor }: GridProps) {
  const cell = size / 4;
  return (
    <g>
      {grid.map((row, i) =>
        row.map((c, j) => (
          <rect
            key={`${i}-${j}`}
            x={x + j * cell}
            y={y + i * cell}
            width={cell - 1}
            height={cell - 1}
            rx={3}
            fill={rgb(c)}
          />
        )),
      )}
      <text
        x={x + size / 2}
        y={y + size + 16}
        textAnchor="middle"
        fill={labelColor}
        fontSize={11}
        fontWeight="bold"
      >
        {label}
      </text>
    </g>
  );
}

/* ── Gram matrix heatmap primitive ─────────────────────────── */
type GramProps = {
  gram: number[][];
  x: number;
  y: number;
  size: number;
  label: string;
};

function GramHeatmap({ gram, x, y, size, label }: GramProps) {
  const cell = size / 4;
  const max = Math.max(...gram.flat());
  const min = Math.min(...gram.flat());
  const span = max - min || 1;

  return (
    <g>
      {gram.map((row, i) =>
        row.map((v, j) => {
          const t = (v - min) / span;
          // Blue (low) → purple → orange (high) gradient
          const r = Math.round(60 + 180 * t);
          const g = Math.round(60 + 120 * t * 0.6);
          const b = Math.round(180 - 120 * t);
          return (
            <g key={`${i}-${j}`}>
              <rect
                x={x + j * cell}
                y={y + i * cell}
                width={cell - 1}
                height={cell - 1}
                rx={2}
                fill={`rgb(${r}, ${g}, ${b})`}
              />
              <text
                x={x + j * cell + cell / 2}
                y={y + i * cell + cell / 2 + 3}
                textAnchor="middle"
                fill="white"
                fontSize={11}
                fontFamily="monospace"
              >
                {v.toFixed(2)}
              </text>
            </g>
          );
        }),
      )}
      <text
        x={x + size / 2}
        y={y + size + 16}
        textAnchor="middle"
        fill="#c084fc"
        fontSize={11}
        fontWeight="bold"
      >
        {label}
      </text>
    </g>
  );
}

const TOTAL_STEPS = 11;

export default function StyleTransferTopic() {
  const [alpha, setAlpha] = useState(0.5);
  const [showGram, setShowGram] = useState(true);
  const [highlightCell, setHighlightCell] = useState<{
    i: number;
    j: number;
  } | null>(null);

  const blended = useMemo(
    () => blendGrids(CONTENT_GRID, STYLE_GRID, alpha),
    [alpha],
  );

  const contentGram = useMemo(() => computeGram(CONTENT_GRID), []);
  const styleGram = useMemo(() => computeGram(STYLE_GRID), []);
  const blendedGram = useMemo(() => computeGram(blended), [blended]);

  // Compute a "style loss" — MSE between blended gram and style gram
  const styleLoss = useMemo(() => {
    let s = 0;
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const d = blendedGram[i][j] - styleGram[i][j];
        s += d * d;
      }
    }
    return s / 16;
  }, [blendedGram, styleGram]);

  // Content loss — MSE between blended grid and content grid (RGB)
  const contentLoss = useMemo(() => {
    let s = 0;
    let n = 0;
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        for (let k = 0; k < 3; k++) {
          const d = (blended[i][j][k] - CONTENT_GRID[i][j][k]) / 255;
          s += d * d;
          n++;
        }
      }
    }
    return s / n;
  }, [blended]);

  const resetSlider = useCallback(() => setAlpha(0.5), []);

  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question: "Style Transfer tách ảnh thành 2 thành phần nào?",
        options: [
          "Foreground (tiền cảnh) và Background (nền)",
          "Content (nội dung: đối tượng, bố cục) và Style (phong cách: nét cọ, màu sắc, kết cấu)",
          "High-resolution và Low-resolution",
          "RGB channels và Alpha channel",
        ],
        correct: 1,
        explanation:
          "Content = CÁI GÌ trong ảnh (Hồ Gươm, cây, người). Style = ảnh TRÔNG NHƯ THẾ NÀO (nét cọ dày, màu rực rỡ, kết cấu). Style Transfer kết hợp content ảnh A với style ảnh B.",
      },
      {
        question: "Gram matrix biểu diễn 'style' bằng cách nào?",
        options: [
          "Lưu trữ vị trí từng nét cọ",
          "Tính tương quan giữa các feature map — nắm bắt kết cấu và pattern lặp lại",
          "Đo độ sáng trung bình của ảnh",
          "Đếm số màu khác nhau",
        ],
        correct: 1,
        explanation:
          "Gram matrix G = F · F^T: mỗi phần tử G[i,j] đo tương quan giữa feature map i và j. Tương quan cao giữa 'cạnh nghiêng' và 'màu vàng' ≈ nét cọ vàng nghiêng. Gram nắm bắt style độc lập với vị trí — đó là lý do kết quả giữ kết cấu mà không chép nguyên vị trí.",
      },
      {
        question: "Phương pháp gốc (Gatys 2015) chậm vì lý do gì?",
        options: [
          "Dùng mạng CNN quá lớn",
          "Cần tối ưu (gradient descent) RIÊNG CHO TỪNG ẢNH, không phải feed-forward",
          "Cần GPU đắt tiền",
          "Ảnh đầu vào quá lớn",
        ],
        correct: 1,
        explanation:
          "Gatys: khởi tạo từ ảnh noise, chạy gradient descent hàng trăm iteration để minimize content + style loss cho TỪNG cặp ảnh. Feed-forward (Johnson 2016) huấn luyện mạng một lần, inference tức thì — đánh đổi tính linh hoạt lấy tốc độ.",
      },
      {
        question:
          "Total loss của Neural Style Transfer (Gatys) có công thức nào?",
        options: [
          "L = L_content",
          "L = α·L_content + β·L_style — tỉ số α/β quyết định cân bằng giữa giữ nội dung và áp phong cách",
          "L = L_style / L_content",
          "L = cross-entropy giữa hai ảnh",
        ],
        correct: 1,
        explanation:
          "Tỉ số α/β (thường 1/10^4 đến 1/10^3) kiểm soát: α cao → output bảo toàn nội dung; β cao → output giống style hơn. Chọn tỉ số là nghệ thuật điều chỉnh.",
      },
      {
        question:
          "Vì sao người ta thường dùng VGG-19 chứ không phải ResNet hay MobileNet làm feature extractor cho style transfer?",
        options: [
          "VGG nhanh hơn",
          "VGG có các lớp conv tuần tự rõ ràng, không có skip-connection → feature map ở các độ sâu khác nhau mô tả content/style tốt; ngoài ra cộng đồng đã tune sẵn chọn lớp",
          "VGG mới hơn ResNet",
          "ResNet không tồn tại khi Gatys viết bài",
        ],
        correct: 1,
        explanation:
          "Skip-connection trong ResNet trộn feature nhiều lớp → khó lấy 'lớp sâu = content' và 'nhiều lớp = style'. VGG đơn giản, có feature map phân tầng rõ, và kết quả thực nghiệm đẹp hơn. Đây là chuẩn de facto trong hầu hết paper style transfer.",
      },
      {
        question:
          "Bạn tăng style weight β lên rất cao và content weight α rất thấp. Kết quả sẽ thế nào?",
        options: [
          "Ảnh giữ nguyên content",
          "Content biến mất — ảnh trở thành texture thuần giống style, không còn nhận ra Hồ Gươm",
          "Chất lượng ảnh tăng",
          "Thuật toán dừng hoạt động",
        ],
        correct: 1,
        explanation:
          "Khi β ≫ α, optimizer chỉ quan tâm khớp Gram matrix — kết quả là 'texture synthesis' thuần (Gatys 2015 texture). Đây là cách phát hiện bug tham số khi chạy style transfer.",
      },
      {
        question: "AdaIN (Adaptive Instance Normalization) khác Gatys ở điểm nào?",
        options: [
          "AdaIN chạy chậm hơn",
          "AdaIN dùng 1 mạng duy nhất cho BẤT KỲ style nào bằng cách match mean/variance của feature map (normalize theo style), inference 1-shot",
          "AdaIN không dùng CNN",
          "AdaIN chỉ hoạt động với ảnh đen trắng",
        ],
        correct: 1,
        explanation:
          "AdaIN (Huang & Belongie 2017): encoder-decoder, tại bottleneck normalize content feature theo mean/variance style feature. Một mạng, mọi style, feed-forward → thời gian thực. Nền tảng của nhiều real-time style transfer app.",
      },
      {
        question:
          "Style transfer hiện đại (2023+) với diffusion models có ưu điểm gì?",
        options: [
          "Chỉ đơn giản hơn",
          "Chất lượng cao hơn, kiểm soát tốt hơn qua ControlNet / IP-Adapter; có thể dùng prompt văn bản + ảnh style cùng lúc",
          "Không cần GPU",
          "Kết quả giống hệt Gatys",
        ],
        correct: 1,
        explanation:
          "Diffusion + ControlNet/IP-Adapter: inject style qua cross-attention hoặc adapter module. Người dùng viết prompt 'hồ nước yên tĩnh theo phong cách Van Gogh' + drop style image → kết quả phong phú hơn nhiều so với Gatys 2015.",
      },
    ],
    [],
  );

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn muốn biến ảnh chụp Hồ Gươm thành tranh theo phong cách Van Gogh (Starry Night). Cần giữ gì, thay đổi gì?"
          options={[
            "Giữ màu sắc gốc, chỉ thay hình dạng",
            "Giữ NỘI DUNG (Hồ Gươm, cây, nước) nhưng thay PHONG CÁCH (nét cọ xoáy, màu rực rỡ Van Gogh)",
            "Thay toàn bộ ảnh bằng Starry Night",
          ]}
          correct={1}
          explanation="Style Transfer = giữ CONTENT (đối tượng + bố cục) từ ảnh A + lấy STYLE (nét cọ + kết cấu + màu sắc) từ ảnh B. Kết quả: Hồ Gươm vẽ bằng nét cọ Van Gogh."
        >
          <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
            <p className="mb-4 text-sm text-muted leading-relaxed">
              Kéo <strong className="text-foreground">slider</strong> bên dưới
              để trộn dần phong cách từ 0 (thuần content) đến 1 (thuần style).
              Hai ma trận Gram 4×4 thể hiện <em>kết cấu</em> của ảnh content,
              ảnh style, và ảnh blend — quan sát cách Gram matrix của output
              dịch chuyển dần về phía Gram của style.
            </p>

            <VisualizationSection>
              <div className="space-y-6">
                <svg viewBox="0 0 720 420" className="w-full max-w-3xl mx-auto">
                  <defs>
                    <linearGradient
                      id="arrowFill"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>

                  {/* Three grids in a row: content → blended → style */}
                  <ColorGrid
                    grid={CONTENT_GRID}
                    x={30}
                    y={30}
                    size={140}
                    label="Content (Hồ Gươm 4×4)"
                    labelColor="#3b82f6"
                  />

                  <ColorGrid
                    grid={blended}
                    x={290}
                    y={30}
                    size={140}
                    label={`Blend · α = ${alpha.toFixed(2)}`}
                    labelColor="#22c55e"
                  />

                  <ColorGrid
                    grid={STYLE_GRID}
                    x={550}
                    y={30}
                    size={140}
                    label="Style (Starry Night 4×4)"
                    labelColor="#8b5cf6"
                  />

                  {/* Animated blend arrows */}
                  <motion.line
                    x1={175}
                    y1={100}
                    x2={285}
                    y2={100}
                    stroke="url(#arrowFill)"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    animate={{ strokeDashoffset: [0, -14] }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  <text x={230} y={92} textAnchor="middle" fill="#94a3b8" fontSize={11}>
                    1-α
                  </text>

                  <motion.line
                    x1={695}
                    y1={100}
                    x2={435}
                    y2={100}
                    stroke="url(#arrowFill)"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    animate={{ strokeDashoffset: [0, 14] }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  <text x={555} y={92} textAnchor="middle" fill="#94a3b8" fontSize={11}>
                    α
                  </text>

                  {/* Gram row */}
                  {showGram && (
                    <>
                      <GramHeatmap
                        gram={contentGram}
                        x={30}
                        y={220}
                        size={140}
                        label="Gram(content)"
                      />
                      <GramHeatmap
                        gram={blendedGram}
                        x={290}
                        y={220}
                        size={140}
                        label="Gram(blend)"
                      />
                      <GramHeatmap
                        gram={styleGram}
                        x={550}
                        y={220}
                        size={140}
                        label="Gram(style) = target"
                      />

                      {/* Caption */}
                      <text
                        x={360}
                        y={390}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize={11}
                      >
                        Gram matrix G[i,j] = ⟨F_i, F_j⟩ / N — tương quan giữa
                        feature maps, nắm bắt kết cấu không phụ thuộc vị trí
                      </text>
                      <text
                        x={360}
                        y={406}
                        textAnchor="middle"
                        fill="#64748b"
                        fontSize={11}
                      >
                        Khi α → 1, Gram(blend) tiệm cận Gram(style) — style
                        loss giảm dần.
                      </text>
                    </>
                  )}
                </svg>

                {/* Controls */}
                <div className="mx-auto max-w-2xl space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted w-24">Style weight α</span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={alpha}
                      onChange={(e) => setAlpha(parseFloat(e.target.value))}
                      className="flex-1 accent-primary"
                    />
                    <span className="text-xs font-mono text-foreground w-12 text-right">
                      {alpha.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setAlpha(0)}
                      className="px-3 py-1.5 rounded-md bg-card border border-border text-xs"
                    >
                      Content only (α=0)
                    </button>
                    <button
                      onClick={() => setAlpha(0.3)}
                      className="px-3 py-1.5 rounded-md bg-card border border-border text-xs"
                    >
                      Subtle (α=0.3)
                    </button>
                    <button
                      onClick={() => setAlpha(0.6)}
                      className="px-3 py-1.5 rounded-md bg-card border border-border text-xs"
                    >
                      Van Gogh-esque (α=0.6)
                    </button>
                    <button
                      onClick={() => setAlpha(1)}
                      className="px-3 py-1.5 rounded-md bg-card border border-border text-xs"
                    >
                      Pure style (α=1)
                    </button>
                    <button
                      onClick={resetSlider}
                      className="px-3 py-1.5 rounded-md bg-primary/20 text-primary text-xs"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => setShowGram((v) => !v)}
                      className="px-3 py-1.5 rounded-md bg-card border border-border text-xs"
                    >
                      {showGram ? "Ẩn Gram" : "Hiện Gram"}
                    </button>
                  </div>

                  {/* Live loss readout */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border bg-card/40 p-3 space-y-1">
                      <div className="text-[11px] text-muted uppercase tracking-wide">
                        Content loss (MSE trên pixel)
                      </div>
                      <div className="font-mono text-sm text-accent">
                        {contentLoss.toFixed(4)}
                      </div>
                      <div className="h-1.5 rounded-full bg-background overflow-hidden">
                        <motion.div
                          className="h-full bg-accent"
                          animate={{
                            width: `${Math.min(100, contentLoss * 4000)}%`,
                          }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                    <div className="rounded-lg border border-border bg-card/40 p-3 space-y-1">
                      <div className="text-[11px] text-muted uppercase tracking-wide">
                        Style loss (MSE trên Gram)
                      </div>
                      <div className="font-mono text-sm text-[#8b5cf6]">
                        {styleLoss.toFixed(4)}
                      </div>
                      <div className="h-1.5 rounded-full bg-background overflow-hidden">
                        <motion.div
                          className="h-full bg-[#8b5cf6]"
                          animate={{
                            width: `${Math.min(100, styleLoss * 400)}%`,
                          }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  </div>

                  <ProgressSteps
                    total={10}
                    current={Math.round(alpha * 10)}
                  />
                </div>

                {/* Pick a cell for inspection */}
                <div className="mx-auto max-w-2xl rounded-lg border border-border bg-card/40 p-3 text-xs">
                  <div className="text-muted mb-2">
                    Chọn ô 4×4 để xem phép blend tại pixel đó:
                  </div>
                  <div className="grid grid-cols-4 gap-1 max-w-[200px]">
                    {Array.from({ length: 16 }).map((_, idx) => {
                      const i = Math.floor(idx / 4);
                      const j = idx % 4;
                      const isOn =
                        highlightCell?.i === i && highlightCell?.j === j;
                      return (
                        <button
                          key={idx}
                          onClick={() => setHighlightCell({ i, j })}
                          className={`aspect-square rounded ${
                            isOn
                              ? "ring-2 ring-primary"
                              : "ring-1 ring-border"
                          }`}
                          style={{ backgroundColor: rgb(blended[i][j]) }}
                          aria-label={`cell ${i},${j}`}
                        />
                      );
                    })}
                  </div>
                  {highlightCell && (
                    <div className="mt-3 space-y-1 font-mono text-[11px]">
                      <div>
                        content[{highlightCell.i},{highlightCell.j}] ={" "}
                        <span className="text-accent">
                          rgb
                          {String(
                            CONTENT_GRID[highlightCell.i][highlightCell.j],
                          )}
                        </span>
                      </div>
                      <div>
                        style[{highlightCell.i},{highlightCell.j}] ={" "}
                        <span className="text-[#8b5cf6]">
                          rgb
                          {String(
                            STYLE_GRID[highlightCell.i][highlightCell.j],
                          )}
                        </span>
                      </div>
                      <div>
                        blend = (1-α)·content + α·style ={" "}
                        <span className="text-success">
                          rgb
                          {String(blended[highlightCell.i][highlightCell.j])}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </VisualizationSection>

            <Callout variant="tip" title="Mô hình rút gọn, ý tưởng không đổi">
              <div className="space-y-2 text-sm">
                <p>
                  Style transfer thật không blend pixel trực tiếp — nó tối ưu
                  ảnh output sao cho feature map của nó (từ VGG) vừa giống
                  content (lớp sâu) vừa có Gram matrix giống style (nhiều
                  lớp).
                </p>
                <p>
                  Demo 4×4 trên đây cho bạn thấy ý tưởng cốt lõi: chỉ số α
                  kiểm soát mức độ pha trộn, và Gram matrix là đặc tả kết cấu
                  của phong cách. Khi bạn tăng α, Gram của blend dịch chuyển
                  về phía Gram của style.
                </p>
              </div>
            </Callout>
          </LessonSection>

          <LessonSection
            step={3}
            totalSteps={TOTAL_STEPS}
            label="Khoảnh khắc Aha"
          >
            <AhaMoment>
              <p>
                CNN lớp sâu nắm bắt <strong>content</strong> (đối tượng, bố
                cục). Gram matrix giữa các feature map nắm bắt{" "}
                <strong>style</strong> (kết cấu, nét cọ, pattern). Style
                Transfer <strong>tối ưu hoá ảnh output</strong> để gần content
                ảnh A và gần style ảnh B cùng lúc. Pixel là biến số, không
                phải trọng số của mạng.
              </p>
            </AhaMoment>
          </LessonSection>

          <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách 1">
            <InlineChallenge
              question="Bạn chạy style transfer nhưng kết quả quá 'loạn' — nét cọ Van Gogh che hết nội dung Hồ Gươm. Cần điều chỉnh gì?"
              options={[
                "Tăng learning rate",
                "Giảm trọng số style loss (hoặc tăng trọng số content loss)",
                "Dùng ảnh style có độ phân giải cao hơn",
              ]}
              correct={1}
              explanation="Total loss = α·content_loss + β·style_loss. Tăng α (hoặc giảm β) = giữ content nhiều hơn. Tỉ số α/β quyết định cân bằng giữa 'giống ảnh gốc' và 'giống phong cách'."
            />
          </LessonSection>

          <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
            <ExplanationSection>
              <p>
                <strong>Neural Style Transfer</strong> (Gatys, Ecker, Bethge —
                2015) là bước ngoặt: lần đầu có công thức toán học rõ ràng để
                tách content và style, dùng feature map của CNN pretrained
                (thường VGG-19).
              </p>

              <p>
                <strong>Content representation.</strong> Ở các lớp sâu, VGG
                đã bỏ đi chi tiết nhỏ và chỉ giữ khái niệm cấp cao (có cái
                tháp, có cái hồ, có cái cây). Vì vậy MSE giữa feature map lớp
                sâu của ảnh output và ảnh content chính là thước đo "giữ nội
                dung".
              </p>

              <LaTeX block>
                {"\\mathcal{L}_{content} = \\frac{1}{2} \\sum_{i,j} (F^l_{ij} - P^l_{ij})^2"}
              </LaTeX>
              <p className="text-sm text-muted">
                <LaTeX>{"F^l"}</LaTeX> = feature map ảnh output,{" "}
                <LaTeX>{"P^l"}</LaTeX> = feature map ảnh content tại lớp{" "}
                <LaTeX>{"l"}</LaTeX> (thường chọn <LaTeX>{"conv4\\_2"}</LaTeX>).
              </p>

              <p>
                <strong>Style representation.</strong> Style là cái gì lặp đi
                lặp lại nhưng không có vị trí cố định: nét cọ xoáy, màu đối
                lập, texture. Gram matrix của feature map đúng là thứ lột tả
                điều này — mỗi phần tử là tương quan giữa hai filter:
              </p>

              <LaTeX block>
                {"G^l_{ij} = \\sum_k F^l_{ik} F^l_{jk}"}
              </LaTeX>

              <p>
                Rồi tổng bình phương sai lệch trên nhiều lớp:
              </p>

              <LaTeX block>
                {"\\mathcal{L}_{style} = \\sum_l w_l \\frac{1}{4N_l^2 M_l^2} \\sum_{i,j}(G^l_{ij} - A^l_{ij})^2"}
              </LaTeX>

              <p>
                <strong>Total loss</strong> và tối ưu:
              </p>

              <LaTeX block>
                {"\\mathcal{L}_{total} = \\alpha\\, \\mathcal{L}_{content} + \\beta\\, \\mathcal{L}_{style}"}
              </LaTeX>

              <p className="text-sm text-muted">
                Optimizer (thường L-BFGS) chạy trên <em>pixel của ảnh
                output</em> chứ không phải trọng số của VGG. VGG chỉ đóng vai
                trò feature extractor đứng yên.
              </p>

              <Callout variant="insight" title="Các phương pháp nhanh hơn">
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Feed-forward (Johnson 2016):</strong> huấn luyện
                    mạng generator cho <em>một</em> style cụ thể (ví dụ:
                    Starry Night). Inference tức thì — 1 mạng = 1 style.
                  </p>
                  <p>
                    <strong>AdaIN (Huang & Belongie 2017):</strong> Adaptive
                    Instance Normalization. 1 mạng cho BẤT KỲ style nào bằng
                    cách match mean/variance feature map — real-time.
                  </p>
                  <p>
                    <strong>WCT (2017):</strong> Whitening & Coloring
                    Transform — phương pháp không cần huấn luyện, chỉ thao
                    tác trên feature map.
                  </p>
                  <p>
                    <strong>Diffusion + ControlNet / IP-Adapter (2023+):</strong>{" "}
                    inject style qua cross-attention — chất lượng hàng đầu,
                    kết hợp text prompt và style image cùng lúc.
                  </p>
                </div>
              </Callout>

              <CodeBlock
                language="python"
                title="Style Transfer cơ bản với PyTorch (đầy đủ)"
              >
{`import torch
import torch.nn as nn
import torch.optim as optim
import torchvision.models as models
import torchvision.transforms as T
from PIL import Image

device = "cuda" if torch.cuda.is_available() else "cpu"

# 1. Feature extractor — VGG-19 pretrained ImageNet
vgg = models.vgg19(weights=models.VGG19_Weights.DEFAULT).features.eval().to(device)
for p in vgg.parameters():
    p.requires_grad_(False)

# 2. Chọn lớp dùng cho content và style
#    (indexing trong vgg.features tương ứng conv + ReLU)
CONTENT_LAYERS = {"conv4_2": 21}
STYLE_LAYERS = {
    "conv1_1": 0, "conv2_1": 5, "conv3_1": 10,
    "conv4_1": 19, "conv5_1": 28,
}

def extract_features(x, layer_ids):
    feats = {}
    for i, layer in enumerate(vgg):
        x = layer(x)
        for name, idx in layer_ids.items():
            if i == idx:
                feats[name] = x
    return feats

def gram_matrix(feat):
    """Gram = F · F^T / (C·H·W) — tương quan feature map."""
    b, c, h, w = feat.size()
    F = feat.view(b, c, h * w)
    G = torch.bmm(F, F.transpose(1, 2))
    return G / (c * h * w)

# 3. Load và chuẩn hoá ảnh
preprocess = T.Compose([
    T.Resize(512),
    T.CenterCrop(512),
    T.ToTensor(),
    T.Normalize(mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]),
])

content_img = preprocess(Image.open("ho_guom.jpg")).unsqueeze(0).to(device)
style_img = preprocess(Image.open("starry_night.jpg")).unsqueeze(0).to(device)

# 4. Ảnh output — biến số của optimization
#    Khởi tạo từ content để converge nhanh
output = content_img.clone().requires_grad_(True)

# 5. Tính target features (đứng yên)
with torch.no_grad():
    content_target = extract_features(content_img, CONTENT_LAYERS)
    style_feats = extract_features(style_img, STYLE_LAYERS)
    style_target = {k: gram_matrix(v) for k, v in style_feats.items()}

# 6. Loss weights
ALPHA = 1.0        # content
BETA = 1e4         # style
STYLE_WEIGHTS = {
    "conv1_1": 1.0, "conv2_1": 0.8, "conv3_1": 0.5,
    "conv4_1": 0.3, "conv5_1": 0.1,
}

optimizer = optim.LBFGS([output])
step_count = [0]

def closure():
    optimizer.zero_grad()

    # Forward: lấy tất cả feature cần thiết trong 1 pass
    all_layers = {**CONTENT_LAYERS, **STYLE_LAYERS}
    feats = extract_features(output, all_layers)

    # Content loss — MSE trên feature map lớp sâu
    c_loss = 0.0
    for name in CONTENT_LAYERS:
        c_loss = c_loss + nn.functional.mse_loss(
            feats[name], content_target[name]
        )

    # Style loss — MSE trên Gram matrix, có trọng số theo lớp
    s_loss = 0.0
    for name in STYLE_LAYERS:
        g_out = gram_matrix(feats[name])
        g_tgt = style_target[name]
        s_loss = s_loss + STYLE_WEIGHTS[name] * nn.functional.mse_loss(
            g_out, g_tgt
        )

    loss = ALPHA * c_loss + BETA * s_loss
    loss.backward()

    step_count[0] += 1
    if step_count[0] % 50 == 0:
        print(f"step {step_count[0]:>4d} "
              f"content={c_loss.item():.4f} "
              f"style={s_loss.item():.4f} "
              f"total={loss.item():.4f}")

    return loss

# 7. Chạy tối ưu
for _ in range(300):
    optimizer.step(closure)
    # Clamp để giữ trong khoảng ảnh hợp lệ
    with torch.no_grad():
        output.clamp_(-2.2, 2.7)

# 8. De-normalize và lưu ảnh
mean = torch.tensor([0.485, 0.456, 0.406], device=device).view(1, 3, 1, 1)
std = torch.tensor([0.229, 0.224, 0.225], device=device).view(1, 3, 1, 1)
final = (output * std + mean).clamp(0, 1)
T.ToPILImage()(final.squeeze().cpu()).save("ho_guom_vangogh.jpg")`}
              </CodeBlock>

              <CollapsibleDetail title="Vì sao Gram matrix capture được 'style'?">
                <div className="space-y-2 text-sm">
                  <p>
                    Trực giác: mỗi filter của CNN detect một pattern cục bộ
                    (cạnh xéo, đốm tròn, vệt sáng). Gram matrix đo{" "}
                    <em>mức độ xuất hiện đồng thời</em> giữa các filter.
                  </p>
                  <p>
                    Ví dụ: filter A phát hiện "nét cong", filter B phát hiện
                    "vàng sáng". Nếu chúng thường xuyên cùng bật mạnh ở các
                    vị trí → G[A,B] lớn → ảnh có "những đường cong vàng" —
                    đặc trưng Van Gogh.
                  </p>
                  <p>
                    Gram <em>bỏ thông tin vị trí</em> (sum over k = sum over
                    vị trí không gian). Đó chính là điều ta muốn: style là
                    "trông thế nào", không phải "ở đâu".
                  </p>
                  <p>
                    Về toán học: Gram matrix xấp xỉ covariance (không trừ
                    mean) của feature distribution → so khớp Gram tương đương
                    so khớp moment bậc hai của phân phối feature map.
                  </p>
                </div>
              </CollapsibleDetail>

              <CollapsibleDetail title="Các biến thể và artifact thường gặp">
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Total variation loss:</strong> thêm{" "}
                    <LaTeX>{"\\mathcal{L}_{tv} = \\sum (x_{i+1,j} - x_{i,j})^2 + (x_{i,j+1} - x_{i,j})^2"}</LaTeX>{" "}
                    để ảnh mịn hơn, giảm noise high-frequency.
                  </p>
                  <p>
                    <strong>Content-style imbalance:</strong> nếu β quá cao,
                    xuất hiện "psychedelic" — màu rực nhưng không còn nhận
                    ra ảnh. Nếu α quá cao, style nhạt gần như không thay đổi.
                  </p>
                  <p>
                    <strong>Flat regions:</strong> vùng trời/nước trong ảnh
                    content đôi khi bị style làm "bẩn". Giải pháp: semantic
                    style transfer — gán vùng content với vùng style tương
                    ứng (trời ↔ trời).
                  </p>
                  <p>
                    <strong>Resolution-dependent:</strong> style khớp tốt ở
                    độ phân giải nào thì phụ thuộc kích thước ảnh style đầu
                    vào. Tip: resize style image về cùng scale với content.
                  </p>
                  <p>
                    <strong>Ảnh khởi tạo:</strong> bắt đầu từ content image
                    → converge nhanh và giữ bố cục tốt. Bắt đầu từ noise →
                    kết quả artistic hơn nhưng bố cục lệch.
                  </p>
                </div>
              </CollapsibleDetail>
            </ExplanationSection>
          </LessonSection>

          <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Thử thách 2">
            <InlineChallenge
              question="Bạn muốn app mobile áp dụng Van Gogh style cho video selfie theo thời gian thực (30 FPS). Phương pháp nào phù hợp?"
              options={[
                "Gatys gốc — chạy tối ưu cho mỗi frame",
                "Feed-forward network (Johnson 2016) hoặc AdaIN — huấn luyện 1 lần, inference một bước, đạt tốc độ real-time",
                "Không thể làm được",
              ]}
              correct={1}
              explanation="Gatys cần hàng trăm iteration/ảnh (~vài giây). Feed-forward/AdaIN: huấn luyện offline một lần, tại runtime chỉ là 1 forward pass của generator — dễ dàng 30+ FPS trên điện thoại hiện đại. Đây là công nghệ đằng sau các app như Prisma, Clipdrop."
            />
          </LessonSection>

          <LessonSection
            step={7}
            totalSteps={TOTAL_STEPS}
            label="Mở rộng — Timeline"
          >
            <ExplanationSection>
              <p>
                Style transfer tiến hoá rất nhanh. Dưới đây là các cột mốc
                đáng nhớ:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>2015 — Gatys et al.:</strong> Neural style transfer
                  với VGG-19 + Gram matrix. Gốc rễ của mọi phương pháp sau
                  này.
                </li>
                <li>
                  <strong>2016 — Johnson et al.:</strong> Perceptual losses
                  + feed-forward network. 1000× nhanh hơn Gatys.
                </li>
                <li>
                  <strong>2016 — Ulyanov et al.:</strong> Instance
                  normalization — cải thiện chất lượng và ổn định.
                </li>
                <li>
                  <strong>2017 — AdaIN (Huang & Belongie):</strong> arbitrary
                  style qua feature statistics matching.
                </li>
                <li>
                  <strong>2017 — WCT (Li et al.):</strong> whitening &
                  coloring transform, zero-shot.
                </li>
                <li>
                  <strong>2019 — SANet:</strong> attention-based style
                  transfer, spatially-aware.
                </li>
                <li>
                  <strong>2022 — Stable Diffusion:</strong> text-to-image đưa
                  "style" thành một phần của prompt.
                </li>
                <li>
                  <strong>2023 — ControlNet, IP-Adapter:</strong> điều khiển
                  style và cấu trúc chi tiết cho diffusion.
                </li>
                <li>
                  <strong>2024 — Style transfer trong video diffusion:</strong>{" "}
                  nhất quán tạm thời qua nhiều frame.
                </li>
              </ul>

              <Callout variant="warning" title="Đạo đức và bản quyền">
                <div className="space-y-2 text-sm">
                  <p>
                    Style transfer từ tác phẩm của hoạ sĩ còn sống (hoặc
                    chưa hết bản quyền) đặt ra câu hỏi pháp lý và đạo đức
                    nghiêm túc. Nhiều hoạ sĩ đã phản đối việc dataset huấn
                    luyện chứa tác phẩm của họ mà không xin phép.
                  </p>
                  <p>
                    Khi publish sản phẩm thương mại, hãy: (1) dùng style từ
                    tác phẩm đã hết bản quyền (Van Gogh, Hokusai ...), (2)
                    xin phép tác giả, hoặc (3) dùng style do chính bạn/team
                    tạo ra. Tôn trọng nguồn gốc nghệ thuật là một phần của
                    trách nhiệm AI có đạo đức.
                  </p>
                </div>
              </Callout>

              <Callout variant="info" title="So sánh nhanh 3 trường phái">
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Optimization-based (Gatys):</strong> chậm
                    (~giây/ảnh), chất lượng cao, linh hoạt với mọi cặp ảnh.
                  </p>
                  <p>
                    <strong>Feed-forward:</strong> nhanh (~ms), 1 model/style
                    hoặc arbitrary với AdaIN, chất lượng tốt.
                  </p>
                  <p>
                    <strong>Diffusion-based:</strong> rất chậm (~giây-phút),
                    chất lượng xuất sắc, kiểm soát qua prompt + adapters.
                  </p>
                </div>
              </Callout>
            </ExplanationSection>
          </LessonSection>

          <LessonSection
            step={8}
            totalSteps={TOTAL_STEPS}
            label="Phụ lục — Debug loss"
          >
            <ExplanationSection>
              <p>
                Nhiều người lần đầu chạy style transfer sẽ thấy kết quả lạ:
                ảnh quá xám, ảnh đầy noise, hoặc gần như không thay đổi. Dưới
                đây là bộ chẩn đoán nhanh.
              </p>

              <p>
                <strong>Dấu hiệu #1 — Ảnh output gần như identical với
                content:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>β quá nhỏ so với α. Tăng β lên 10× và thử lại.</li>
                <li>
                  Style layers chọn sai — chỉ lấy lớp quá sâu → thiếu texture
                  chi tiết.
                </li>
                <li>Learning rate quá nhỏ với optimizer Adam.</li>
              </ul>

              <p>
                <strong>Dấu hiệu #2 — Ảnh output noise/loạn:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>β quá lớn — giảm β hoặc thêm TV loss.</li>
                <li>
                  Khởi tạo từ noise + chạy ít iterations → chưa converge.
                </li>
                <li>
                  Style image có texture cực mạnh (ví dụ: noise pattern) —
                  chọn style khác.
                </li>
              </ul>

              <p>
                <strong>Dấu hiệu #3 — Ảnh bị "lửa" / artefact màu:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>Quên clamp giá trị pixel → giá trị lệch khỏi [0,1].</li>
                <li>
                  De-normalize sai mean/std — kiểm tra giá trị ImageNet
                  chuẩn.
                </li>
                <li>
                  Gradient explode — giảm LR hoặc dùng L-BFGS thay Adam.
                </li>
              </ul>

              <CodeBlock
                language="python"
                title="Instrumentation — trace loss cho style transfer"
              >
{`import matplotlib.pyplot as plt
from collections import defaultdict

history = defaultdict(list)

def closure_with_trace():
    optimizer.zero_grad()
    feats = extract_features(output, {**CONTENT_LAYERS, **STYLE_LAYERS})

    c_loss = sum(
        nn.functional.mse_loss(feats[n], content_target[n])
        for n in CONTENT_LAYERS
    )

    s_losses_per_layer = {}
    for name in STYLE_LAYERS:
        g_out = gram_matrix(feats[name])
        s_l = nn.functional.mse_loss(g_out, style_target[name])
        s_losses_per_layer[name] = s_l.item()

    s_loss = sum(
        STYLE_WEIGHTS[n] * nn.functional.mse_loss(
            gram_matrix(feats[n]), style_target[n]
        )
        for n in STYLE_LAYERS
    )

    loss = ALPHA * c_loss + BETA * s_loss
    loss.backward()

    history["content"].append(c_loss.item())
    history["style"].append(s_loss.item())
    history["total"].append(loss.item())
    for name, val in s_losses_per_layer.items():
        history[f"style_{name}"].append(val)

    return loss

# Sau khi chạy xong, plot:
fig, axes = plt.subplots(2, 1, figsize=(8, 6))
axes[0].plot(history["content"], label="content", color="#3b82f6")
axes[0].plot(history["style"], label="style", color="#8b5cf6")
axes[0].plot(history["total"], label="total", color="#22c55e")
axes[0].set_yscale("log")
axes[0].set_title("Loss over iterations")
axes[0].legend()

for name in STYLE_LAYERS:
    axes[1].plot(history[f"style_{name}"], label=name)
axes[1].set_title("Style loss per layer")
axes[1].legend()
axes[1].set_yscale("log")

plt.tight_layout()
plt.savefig("loss_curves.png")`}
              </CodeBlock>

              <p>
                <strong>Kiểm tra Gram matrix thủ công.</strong> Trước khi
                chạy tối ưu dài, in ra một vài số đại diện của Gram
                target/output — đảm bảo chúng không NaN, không inf, và có
                cùng thang độ.
              </p>

              <CodeBlock language="python" title="Sanity check Gram">
{`import torch
with torch.no_grad():
    for name in STYLE_LAYERS:
        gt = style_target[name]
        print(f"Gram[{name}] shape={gt.shape} "
              f"mean={gt.mean():.4f} "
              f"max={gt.max():.4f} "
              f"min={gt.min():.4f} "
              f"has_nan={torch.isnan(gt).any().item()}")`}
              </CodeBlock>
            </ExplanationSection>
          </LessonSection>

          <LessonSection
            step={9}
            totalSteps={TOTAL_STEPS}
            label="Liên kết kiến thức"
          >
            <ExplanationSection>
              <p>
                Style transfer liên quan mật thiết tới các chủ đề khác trong
                deep learning thị giác — hãy xâu chuỗi:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <TopicLink slug="cnn">CNN</TopicLink>: lý do VGG-19 tách được content và
                  style nằm ở kiến trúc CNN phân tầng.
                </li>
                <li>
                  <TopicLink slug="feature-extraction-cnn">Feature extraction trong CNN</TopicLink>: lớp sâu =
                  content abstract, lớp nông = texture/edges.
                </li>
                <li>
                  <TopicLink slug="gan">GAN</TopicLink>: một hướng generative khác; style
                  transfer và GAN đều sinh ảnh nhưng mục tiêu khác nhau.
                </li>
              </ul>

              <Callout variant="info" title="Cách nhớ">
                Content = <em>"vẽ CÁI GÌ"</em>. Style ={" "}
                <em>"vẽ NHƯ THẾ NÀO"</em>. Feature map lớp sâu trả lời câu
                đầu; Gram matrix trả lời câu sau. Tổng của hai loss là hướng
                dẫn cho optimizer đi tìm ảnh trung dung.
              </Callout>
            </ExplanationSection>
          </LessonSection>

          <LessonSection step={10} totalSteps={TOTAL_STEPS} label="Tóm tắt">
            <MiniSummary
              points={[
                "Style Transfer = Content (đối tượng, bố cục) từ ảnh A + Style (nét cọ, kết cấu, màu) từ ảnh B.",
                "Content loss: MSE feature map lớp sâu của VGG-19 (thường conv4_2).",
                "Style loss: MSE giữa các Gram matrix trên nhiều lớp — Gram = F·F^T nắm bắt tương quan feature, không phụ thuộc vị trí.",
                "Total loss = α·L_content + β·L_style; tỉ số α/β quyết định cân bằng content ↔ style.",
                "Gatys 2015: tối ưu pixel trực tiếp — chậm nhưng linh hoạt. Feed-forward (Johnson 2016) và AdaIN (2017): 1-shot real-time.",
                "Diffusion 2023+ (ControlNet, IP-Adapter): chất lượng hàng đầu; style trở thành một 'điều kiện' của quá trình sinh ảnh.",
              ]}
            />
          </LessonSection>

          <LessonSection step={11} totalSteps={TOTAL_STEPS} label="Kiểm tra">
            <QuizSection questions={quizQuestions} />
          </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
