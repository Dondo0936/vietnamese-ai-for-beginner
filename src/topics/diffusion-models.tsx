"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PredictionGate, AhaMoment, InlineChallenge,
  SliderGroup, SplitView, Callout, MiniSummary, CodeBlock,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
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

/* ── Constants ─────────────────────────────────────── */
const GRID = 8;
const CELLS = GRID * GRID;
const CELL_PX = 28;
const MAX_T = 10;
const PIXELS_PER_STEP = Math.ceil(CELLS / MAX_T); // ~6.4 → 7

/* ── Seeded RNG for reproducible noise ─────────────── */
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ── Noise helpers ─────────────────────────────────── */

/** Produce a list of pixel indices to flip at each step, seeded. */
function buildNoiseSchedule(seed: number): number[][] {
  const rng = seededRng(seed);
  const indices = Array.from({ length: CELLS }, (_, i) => i);
  // Fisher-Yates shuffle
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  // Split into MAX_T chunks
  const schedule: number[][] = [];
  for (let t = 0; t < MAX_T; t++) {
    const start = t * PIXELS_PER_STEP;
    const end = Math.min(start + PIXELS_PER_STEP, CELLS);
    schedule.push(indices.slice(start, end));
  }
  return schedule;
}

/** Apply noise up to timestep t: flip selected pixels. */
function applyNoise(
  base: boolean[][],
  schedule: number[][],
  t: number,
): boolean[][] {
  const flat = base.flat();
  for (let step = 0; step < t; step++) {
    for (const idx of schedule[step]) {
      flat[idx] = !flat[idx];
    }
  }
  return Array.from({ length: GRID }, (_, r) =>
    flat.slice(r * GRID, (r + 1) * GRID),
  );
}

/** Generate a random grid from seed (for reverse demo "new" image). */
function randomPattern(seed: number): boolean[][] {
  const rng = seededRng(seed);
  return Array.from({ length: GRID }, () =>
    Array.from({ length: GRID }, () => rng() > 0.55),
  );
}

/* ── SVG Grid renderer ─────────────────────────────── */
function GridSVG({
  grid,
  size = CELL_PX,
  onClick,
  label,
}: {
  grid: boolean[][];
  size?: number;
  onClick?: (r: number, c: number) => void;
  label?: string;
}) {
  const w = GRID * size;
  return (
    <div className="flex flex-col items-center gap-1">
      {label && (
        <span className="text-xs font-medium text-muted">{label}</span>
      )}
      <svg
        width={w}
        height={w}
        viewBox={`0 0 ${w} ${w}`}
        className="rounded-lg border border-border"
      >
        {grid.map((row, r) =>
          row.map((on, c) => (
            <rect
              key={`${r}-${c}`}
              x={c * size}
              y={r * size}
              width={size - 1}
              height={size - 1}
              rx={3}
              fill={on ? "#1e293b" : "#f1f5f9"}
              className="transition-colors duration-150"
              style={{ cursor: onClick ? "pointer" : "default" }}
              onClick={onClick ? () => onClick(r, c) : undefined}
            />
          )),
        )}
      </svg>
    </div>
  );
}

/* ── Mini strip of 5 frames ────────────────────────── */
function FrameStrip({
  frames,
  labels,
}: {
  frames: boolean[][][];
  labels: string[];
}) {
  const smallSize = 14;
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1">
      {frames.map((grid, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5 shrink-0">
          <svg
            width={GRID * smallSize}
            height={GRID * smallSize}
            viewBox={`0 0 ${GRID * smallSize} ${GRID * smallSize}`}
            className="rounded border border-border"
          >
            {grid.map((row, r) =>
              row.map((on, c) => (
                <rect
                  key={`${r}-${c}`}
                  x={c * smallSize}
                  y={r * smallSize}
                  width={smallSize - 1}
                  height={smallSize - 1}
                  rx={1.5}
                  fill={on ? "#1e293b" : "#f1f5f9"}
                />
              )),
            )}
          </svg>
          <span className="text-[10px] text-muted">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Quiz data ─────────────────────────────────────── */
const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Forward process trong Diffusion Model thực hiện điều gì?",
    options: [
      "Sinh ảnh mới từ nhiễu",
      "Thêm nhiễu Gaussian dần dần vào dữ liệu",
      "Huấn luyện discriminator",
      "Nén ảnh vào latent space",
    ],
    correct: 1,
    explanation:
      "Forward process thêm nhiễu Gaussian từng bước nhỏ cho đến khi dữ liệu trở thành nhiễu thuần túy. Mạng neural sau đó học đảo ngược quá trình này.",
  },
  {
    question:
      "Tại sao Diffusion Models thường chậm hơn GAN khi sinh ảnh?",
    options: [
      "Vì mạng U-Net quá lớn",
      "Vì cần nhiều bước khử nhiễu tuần tự (20-1000 bước)",
      "Vì cần hai mạng đối kháng",
      "Vì phải tính toán trên latent space",
    ],
    correct: 1,
    explanation:
      "GAN chỉ cần 1 forward pass qua Generator. Diffusion cần 20-1000 bước khử nhiễu tuần tự. Các phương pháp như DDIM, DPM-Solver giúp giảm xuống 20-50 bước.",
  },
  {
    question:
      "Stable Diffusion khác biệt với Diffusion Model cơ bản ở điểm nào?",
    options: [
      "Dùng GAN thay vì diffusion",
      "Thực hiện khuếch tán trong latent space thay vì pixel space",
      "Không cần U-Net",
      "Chỉ sinh ảnh đen trắng",
    ],
    correct: 1,
    explanation:
      "Stable Diffusion mã hóa ảnh thành latent vector nhỏ hơn (ví dụ 64x64 thay vì 512x512), thực hiện diffusion trên không gian đó, rồi decode lại. Nhanh hơn rất nhiều.",
  },
];

/* ═══════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                     */
/* ═══════════════════════════════════════════════════ */

export default function DiffusionModelsTopic() {
  /* ── Phase A: Paint state ──────────────────────── */
  const emptyGrid = useCallback(
    () => Array.from({ length: GRID }, () => Array(GRID).fill(false) as boolean[]),
    [],
  );
  const [userGrid, setUserGrid] = useState<boolean[][]>(emptyGrid);
  const [paintDone, setPaintDone] = useState(false);
  const [paintCountdown, setPaintCountdown] = useState<number | null>(null);

  const handleCellClick = useCallback(
    (r: number, c: number) => {
      if (paintDone) return;
      setUserGrid((prev) => {
        const next = prev.map((row) => [...row]);
        next[r][c] = !next[r][c];
        return next;
      });
    },
    [paintDone],
  );

  const startPaintTimer = useCallback(() => {
    setPaintCountdown(10);
  }, []);

  useEffect(() => {
    if (paintCountdown === null || paintDone) return;
    if (paintCountdown <= 0) {
      setPaintDone(true);
      return;
    }
    const id = setTimeout(() => setPaintCountdown((p) => (p ?? 1) - 1), 1000);
    return () => clearTimeout(id);
  }, [paintCountdown, paintDone]);

  const finishPaint = useCallback(() => {
    setPaintDone(true);
    setPaintCountdown(null);
  }, []);

  const resetPaint = useCallback(() => {
    setUserGrid(emptyGrid());
    setPaintDone(false);
    setPaintCountdown(null);
    setNoiseT(0);
    setDenoiseT(MAX_T);
  }, [emptyGrid]);

  /* ── Phase B: Noise schedule (stable per painting) ── */
  const noiseSeed = useMemo(() => {
    // Derive seed from the painting content
    return userGrid.flat().reduce((s, v, i) => s + (v ? i * 7 : 0), 42);
  }, [userGrid]);

  const noiseSchedule = useMemo(() => buildNoiseSchedule(noiseSeed), [noiseSeed]);

  const [noiseT, setNoiseT] = useState(0);

  const noisyGrid = useMemo(
    () => applyNoise(userGrid, noiseSchedule, noiseT),
    [userGrid, noiseSchedule, noiseT],
  );

  /* ── Phase C: Denoise state ────────────────────── */
  const [denoiseT, setDenoiseT] = useState(MAX_T);

  const denoisedGrid = useMemo(
    () => applyNoise(userGrid, noiseSchedule, denoiseT),
    [userGrid, noiseSchedule, denoiseT],
  );

  const handleDenoiseStep = useCallback(() => {
    setDenoiseT((prev) => Math.max(0, prev - 1));
  }, []);

  /* ── Step 4: Forward vs Reverse comparison data ── */
  const compareBase = useMemo(() => {
    // A simple cross pattern for consistent demo
    return Array.from({ length: GRID }, (_, r) =>
      Array.from({ length: GRID }, (_, c) => r === 3 || r === 4 || c === 3 || c === 4),
    );
  }, []);

  const compareSchedule = useMemo(() => buildNoiseSchedule(777), []);
  const reverseBase = useMemo(() => randomPattern(999), []);
  const reverseSchedule = useMemo(() => buildNoiseSchedule(888), []);

  const forwardFrames = useMemo(() => {
    const steps = [0, 2, 5, 8, 10];
    return steps.map((t) => applyNoise(compareBase, compareSchedule, t));
  }, [compareBase, compareSchedule]);

  const reverseFrames = useMemo(() => {
    const steps = [10, 8, 5, 2, 0];
    return steps.map((t) => applyNoise(reverseBase, reverseSchedule, t));
  }, [reverseBase, reverseSchedule]);

  /* ── Has any pixel been painted? ───────────────── */
  const hasPainted = userGrid.some((row) => row.some(Boolean));

  return (
    <>
      {/* ═══ STEP 1: HOOK — PredictionGate ═══════════ */}
      <PredictionGate
        question="Bạn xem video mực nhỏ vào nước — mực lan ra dần. Nếu quay ngược video, mực sẽ..."
        options={[
          "Vẫn lan ra",
          "Tự gom lại thành giọt",
          "Biến mất",
        ]}
        correct={1}
        explanation="Quay ngược khuếch tán = tái tạo cấu trúc từ hỗn loạn. Đó chính là cách Diffusion Models sinh ảnh!"
      >

      {/* ═══ STEP 2: DISCOVER — Paint → Noise → Denoise ═══ */}
      <VisualizationSection>
        {/* ── Phase A: Paint ──────────────────────── */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            Bước 1: Vẽ hình của bạn
          </h3>
          <p className="text-sm text-muted">
            Click vào ô để tô đen/trắng. Vẽ chữ, hình, hoặc bất kỳ pattern nào bạn muốn.
          </p>

          <div className="flex flex-col items-center gap-3">
            <GridSVG grid={userGrid} onClick={paintDone ? undefined : handleCellClick} />

            {!paintDone ? (
              <div className="flex items-center gap-3">
                {paintCountdown === null ? (
                  <button
                    type="button"
                    onClick={startPaintTimer}
                    disabled={!hasPainted}
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-40 hover:enabled:opacity-90"
                  >
                    Bắt đầu đếm ngược 10s
                  </button>
                ) : (
                  <span className="text-sm font-mono text-accent">
                    Còn {paintCountdown}s...
                  </span>
                )}
                <button
                  type="button"
                  onClick={finishPaint}
                  disabled={!hasPainted}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface disabled:opacity-40"
                >
                  Xong
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={resetPaint}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:bg-surface transition-colors"
              >
                Vẽ lại
              </button>
            )}
          </div>
        </div>

        {/* ── Phase B: Add Noise ─────────────────── */}
        <AnimatePresence>
          {paintDone && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="mt-6 space-y-3"
            >
              <h3 className="text-sm font-semibold text-foreground">
                Bước 2: Thêm nhiễu (Forward Process)
              </h3>
              <p className="text-sm text-muted">
                Kéo thanh trượt sang phải — xem hình của bạn dần biến thành nhiễu ngẫu nhiên.
              </p>

              <div className="flex flex-col items-center gap-3">
                <GridSVG grid={noisyGrid} label={`t = ${noiseT}`} />

                <div className="w-full max-w-xs space-y-1">
                  <input
                    type="range"
                    min={0}
                    max={MAX_T}
                    value={noiseT}
                    onChange={(e) => setNoiseT(Number(e.target.value))}
                    className="w-full accent-accent"
                  />
                  <div className="flex justify-between text-xs text-muted">
                    <span>t=0 (ảnh gốc)</span>
                    <span>t=10 (nhiễu thuần)</span>
                  </div>
                </div>

                <p className="text-xs text-center text-accent font-medium">
                  {noiseT === 0 && "Ảnh gốc của bạn — chưa có nhiễu."}
                  {noiseT > 0 && noiseT <= 3 && "Vài pixel bị đảo — hình vẫn nhận ra được."}
                  {noiseT > 3 && noiseT <= 7 && "Nhiễu tăng dần — hình bắt đầu mờ nhòe."}
                  {noiseT > 7 && noiseT < 10 && "Gần như toàn nhiễu — rất khó nhận ra hình gốc."}
                  {noiseT === 10 && "Nhiễu thuần túy! Không còn dấu vết của hình gốc."}
                </p>
              </div>

              <Callout variant="info" title="Forward Process">
                Đây là quá trình thêm nhiễu dần dần — mỗi bước chỉ đảo vài pixel.
                Sau đủ bước, mọi ảnh đều thành nhiễu ngẫu nhiên giống nhau.
              </Callout>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Phase C: Denoise ───────────────────── */}
        <AnimatePresence>
          {paintDone && noiseT === MAX_T && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
              className="mt-6 space-y-3"
            >
              <h3 className="text-sm font-semibold text-foreground">
                Bước 3: Khử nhiễu (Reverse Process)
              </h3>
              <p className="text-sm text-muted">
                Bắt đầu từ nhiễu thuần — nhấn nút để khử nhiễu từng bước. Xem hình tái hiện!
              </p>

              <div className="flex flex-col items-center gap-3">
                <GridSVG grid={denoisedGrid} label={`t = ${denoiseT}`} />

                <button
                  type="button"
                  onClick={handleDenoiseStep}
                  disabled={denoiseT <= 0}
                  className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-30 hover:enabled:opacity-90"
                >
                  {denoiseT > 0
                    ? `Khử nhiễu: t=${denoiseT} → t=${denoiseT - 1}`
                    : "Hoàn tất!"}
                </button>

                <p className="text-xs text-center text-accent font-medium">
                  {denoiseT === MAX_T && "Nhiễu thuần túy — AI bắt đầu khử nhiễu..."}
                  {denoiseT > 0 && denoiseT < MAX_T && `Đã khử ${MAX_T - denoiseT}/${MAX_T} bước — hình dần hiện ra!`}
                  {denoiseT === 0 && "Ảnh gốc đã tái tạo hoàn toàn! AI học cách \"quay ngược\" nhiễu."}
                </p>
              </div>

              <Callout variant="tip" title="Reverse Process">
                AI học cách khử nhiễu từng bước nhỏ. Mỗi bước chỉ cần dự đoán
                &quot;pixel nào bị đảo ở bước này?&quot; rồi sửa lại. Đơn giản nhưng hiệu quả!
              </Callout>
            </motion.div>
          )}
        </AnimatePresence>
      </VisualizationSection>

      {/* ═══ STEP 3: AHA MOMENT ══════════════════════ */}
      <AhaMoment>
        <p>
          Quy trình <strong>Thêm nhiễu</strong> &rarr; <strong>Học khử nhiễu</strong>{" "}
          &rarr; <strong>Sinh ảnh mới</strong> chính là <strong>Diffusion Model</strong>{" "}
          — nền tảng của Stable Diffusion, DALL-E và Midjourney!
        </p>
      </AhaMoment>

      {/* ═══ STEP 4: DEEPEN — Forward vs Reverse ═════ */}
      <VisualizationSection>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          So sánh Forward vs Reverse Process
        </h3>
        <SplitView
          leftLabel="Forward (thêm nhiễu)"
          rightLabel="Reverse (khử nhiễu)"
          left={
            <FrameStrip
              frames={forwardFrames}
              labels={["t=0", "t=2", "t=5", "t=8", "t=10"]}
            />
          }
          right={
            <FrameStrip
              frames={reverseFrames}
              labels={["t=10", "t=8", "t=5", "t=2", "t=0"]}
            />
          }
        />

        <div className="mt-4">
          <SliderGroup
            title="Khám phá cùng lúc"
            sliders={[
              {
                key: "t",
                label: "Timestep",
                min: 0,
                max: MAX_T,
                step: 1,
                defaultValue: 0,
              },
            ]}
            visualization={(values) => {
              const t = values.t;
              const fwd = applyNoise(compareBase, compareSchedule, t);
              const rev = applyNoise(reverseBase, reverseSchedule, MAX_T - t);
              return (
                <div className="flex items-center gap-6">
                  <GridSVG grid={fwd} size={18} label={`Forward t=${t}`} />
                  <div className="flex flex-col items-center text-xs text-muted">
                    <span>&larr; Nhiễu tăng</span>
                    <span className="font-mono font-bold text-accent">t = {t}</span>
                    <span>Nhiễu giảm &rarr;</span>
                  </div>
                  <GridSVG grid={rev} size={18} label={`Reverse t=${MAX_T - t}`} />
                </div>
              );
            }}
          />
        </div>

        <p className="mt-3 text-sm text-muted">
          Forward bắt đầu từ ảnh sạch, thêm nhiễu dần. Reverse bắt đầu từ nhiễu,
          khử dần thành ảnh mới. Hai quá trình ngược chiều nhưng cùng số bước.
        </p>
      </VisualizationSection>

      {/* ═══ STEP 5: CHALLENGE ═══════════════════════ */}
      <InlineChallenge
        question="Diffusion model cần bao nhiêu bước để sinh 1 ảnh? (Thường là 20-1000 bước khử nhiễu). Đây là ưu điểm hay nhược điểm so với GAN?"
        options={[
          "Ưu điểm — nhiều bước = chất lượng cao",
          "Nhược điểm — nhiều bước = chậm",
          "Không ảnh hưởng",
        ]}
        correct={1}
        explanation="Chậm hơn GAN nhiều lần (GAN chỉ cần 1 forward pass). Nhưng chất lượng ổn định hơn, không bị mode collapse. DDIM, DPM-Solver giảm xuống 20-50 bước."
      />

      {/* ═══ STEP 6: EXPLAIN ═════════════════════════ */}
      <ExplanationSection>
        <h3 className="text-base font-semibold text-foreground">
          Forward Process — Thêm nhiễu có hệ thống
        </h3>
        <p>
          Ở mỗi bước <em>t</em>, ta thêm nhiễu Gaussian vào dữ liệu theo công thức:
        </p>
        <CodeBlock language="math" title="Forward Process">
{`q(xₜ | xₜ₋₁) = N(xₜ; √(1-βₜ) · xₜ₋₁, βₜ · I)

Trong đó:
  xₜ     = dữ liệu tại bước t (càng nhiễu hơn)
  xₜ₋₁   = dữ liệu bước trước
  βₜ     = noise schedule (thường 0.0001 → 0.02)
  I      = ma trận đơn vị

Sau T bước (T ≈ 1000): x_T ≈ N(0, I) — nhiễu thuần túy`}
        </CodeBlock>

        <h3 className="text-base font-semibold text-foreground mt-4">
          Reverse Process — U-Net học khử nhiễu
        </h3>
        <p>
          Mạng <strong>U-Net</strong> (mạng encoder-decoder có skip connections) được
          huấn luyện để dự đoán nhiễu <em>&epsilon;</em> đã thêm vào tại mỗi bước.
          Hàm loss rất đơn giản:
        </p>
        <CodeBlock language="math" title="Training Objective">
{`L = E[‖ε − ε_θ(xₜ, t)‖²]

Trong đó:
  ε        = nhiễu thực sự đã thêm vào
  ε_θ(xₜ,t) = nhiễu mà U-Net dự đoán
  xₜ       = ảnh đã thêm nhiễu tại bước t

→ U-Net chỉ cần "đoán đúng nhiễu" là được!`}
        </CodeBlock>

        <h3 className="text-base font-semibold text-foreground mt-4">
          Conditional Generation — Từ văn bản thành ảnh
        </h3>
        <p>
          Để sinh ảnh theo mô tả (text-to-image), ta thêm <strong>text embedding</strong>{" "}
          (từ CLIP hoặc T5) làm đầu vào cho U-Net qua cơ chế <strong>cross-attention</strong>.
          U-Net nhận cả <em>x_t</em> lẫn text embedding, nên học khử nhiễu theo hướng
          phù hợp với mô tả.
        </p>

        <CodeBlock language="python" title="Pseudo-code sinh ảnh">
{`# Sinh ảnh với Diffusion Model (simplified)
import torch

# 1. Bắt đầu từ nhiễu thuần túy
x = torch.randn(1, 3, 64, 64)  # noise

# 2. Text conditioning
text_emb = clip_encode("một con mèo ngồi trên bàn")

# 3. Khử nhiễu T bước
for t in reversed(range(T)):
    # U-Net dự đoán nhiễu
    noise_pred = unet(x, t, text_emb)
    # Trừ nhiễu dự đoán
    x = denoise_step(x, noise_pred, t)

# 4. x bây giờ là ảnh hoàn chỉnh!
image = decode(x)  # nếu dùng latent diffusion`}
        </CodeBlock>

        <Callout variant="insight" title="Stable Diffusion = Latent Diffusion">
          Stable Diffusion không khuếch tán trực tiếp trên pixel (512x512x3 = 786.432 chiều).
          Thay vào đó, ảnh được <strong>mã hóa thành latent vector</strong> nhỏ hơn (64x64x4)
          bằng VAE, rồi diffusion xảy ra trên latent space. Khi xong, VAE decode ngược lại thành ảnh.
          Kết quả: nhanh hơn ~50 lần mà chất lượng tương đương!
        </Callout>
      </ExplanationSection>

      {/* ═══ STEP 7: MINI SUMMARY ═══════════════════ */}
      <MiniSummary
        points={[
          "Forward Process thêm nhiễu Gaussian dần dần cho đến khi ảnh thành nhiễu thuần túy.",
          "Reverse Process dùng U-Net dự đoán và loại bỏ nhiễu tại mỗi bước để tái tạo ảnh.",
          "Chất lượng rất cao và ổn định (không bị mode collapse như GAN), nhưng chậm hơn do cần nhiều bước khử nhiễu.",
          "Stable Diffusion tối ưu bằng cách khuếch tán trong latent space + text conditioning qua CLIP/T5.",
        ]}
      />

      {/* ═══ STEP 8: QUIZ ═══════════════════════════ */}
      <QuizSection questions={quizQuestions} />

      </PredictionGate>
    </>
  );
}
