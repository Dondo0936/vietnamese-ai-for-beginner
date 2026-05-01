"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  SliderGroup,
  SplitView,
  Callout,
  MiniSummary,
  CodeBlock,
  LessonSection,
  TopicLink,
  CollapsibleDetail,
  LaTeX,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

// ---------------------------------------------------------------------------
// METADATA — giữ nguyên slug, category, tags
// ---------------------------------------------------------------------------

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

const TOTAL_STEPS = 7;

// ---------------------------------------------------------------------------
// CONSTANTS — lưới hiển thị pixel và số bước timestep tối đa
// ---------------------------------------------------------------------------

const GRID = 8;
const CELLS = GRID * GRID;
const CELL_PX = 28;
const MAX_T = 10;
const PIXELS_PER_STEP = Math.ceil(CELLS / MAX_T); // ~6.4 → 7

// ---------------------------------------------------------------------------
// SEEDED RNG — để kết quả reproducible giữa các lần render
// ---------------------------------------------------------------------------

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ---------------------------------------------------------------------------
// NOISE HELPERS — xây lịch flip pixel cho forward process
// ---------------------------------------------------------------------------

/** Lập danh sách các chỉ số pixel sẽ bị flip tại mỗi timestep, có seed. */
function buildNoiseSchedule(seed: number): number[][] {
  const rng = seededRng(seed);
  const indices = Array.from({ length: CELLS }, (_, i) => i);
  // Fisher-Yates shuffle
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const schedule: number[][] = [];
  for (let t = 0; t < MAX_T; t++) {
    const start = t * PIXELS_PER_STEP;
    const end = Math.min(start + PIXELS_PER_STEP, CELLS);
    schedule.push(indices.slice(start, end));
  }
  return schedule;
}

/** Áp dụng nhiễu tới timestep t: flip các pixel được chọn ở từng bước. */
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

/** Sinh pattern ngẫu nhiên từ seed — dùng cho demo reverse "ảnh mới". */
function randomPattern(seed: number): boolean[][] {
  const rng = seededRng(seed);
  return Array.from({ length: GRID }, () =>
    Array.from({ length: GRID }, () => rng() > 0.55),
  );
}

// ---------------------------------------------------------------------------
// SVG GRID RENDERER
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// MINI FRAME STRIP — 5 frames nhỏ để so sánh forward/reverse
// ---------------------------------------------------------------------------

function FrameStrip({ frames, labels }: { frames: boolean[][][]; labels: string[] }) {
  const smallSize = 14;
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1">
      {frames.map((grid, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5 shrink-0">
          <svg width={GRID * smallSize} height={GRID * smallSize} viewBox={`0 0 ${GRID * smallSize} ${GRID * smallSize}`} className="rounded border border-border">
            {grid.map((row, r) =>
              row.map((on, c) => (
                <rect key={`${r}-${c}`} x={c * smallSize} y={r * smallSize} width={smallSize - 1} height={smallSize - 1} rx={1.5} fill={on ? "#1e293b" : "#f1f5f9"} />
              )),
            )}
          </svg>
          <span className="text-[10px] text-muted">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// QUIZ — 8 câu trộn multiple choice + fill-blank
// ---------------------------------------------------------------------------

const quizQuestions: QuizQuestion[] = [
  {
    question: "Forward process trong Diffusion Model thực hiện điều gì?",
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
    question: "Tại sao Diffusion Models thường chậm hơn GAN khi sinh ảnh?",
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
  {
    question: "DDIM khác gì so với DDPM về cơ bản?",
    options: [
      "DDIM dùng deterministic sampler, bỏ bớt noise ngẫu nhiên giữa các bước — cho phép giảm số step và consistent output",
      "DDIM là mô hình hoàn toàn mới, không liên quan tới DDPM",
      "DDIM chạy trên GPU còn DDPM chỉ chạy CPU",
    ],
    correct: 0,
    explanation:
      "DDPM (Ho et al. 2020) là sampler stochastic: mỗi bước reverse có thêm noise ngẫu nhiên theo β. DDIM (Song et al. 2021) tổng quát hoá chuỗi reverse thành non-Markovian và đặt độ ngẫu nhiên η = 0 → deterministic. Kết quả: cùng starting noise → cùng output, có thể bỏ bước (skip timesteps) mà chất lượng vẫn giữ, giảm 1000 → 20-50 steps.",
  },
  {
    question: "Classifier-Free Guidance (CFG) hoạt động thế nào?",
    options: [
      "Thêm một classifier riêng để 'lái' quá trình sampling",
      "U-Net được train với cả prompt thật lẫn prompt rỗng (unconditional). Khi sample: ε̂ = ε_uncond + w·(ε_cond − ε_uncond), w là guidance scale",
      "Chỉ là trick tên khác của CLIP guidance",
    ],
    correct: 1,
    explanation:
      "CFG (Ho & Salimans 2022) loại bỏ nhu cầu classifier riêng. Trong training, random drop prompt 10% để model học cả phân phối conditional p(x|c) lẫn unconditional p(x). Khi inference, nội suy tuyến tính giữa hai prediction với hệ số w > 1 để 'khuếch đại' hướng prompt. w = 7.5 là sweet spot cho Stable Diffusion.",
  },
  {
    question: "Trong Stable Diffusion, VAE đóng vai trò gì?",
    options: [
      "Làm text encoder",
      "Nén 512×512×3 pixel → 64×64×4 latent (encoder) và decode latent → ảnh (decoder)",
      "Thực hiện diffusion process thay cho U-Net",
    ],
    correct: 1,
    explanation:
      "Stable Diffusion có 3 thành phần: (1) VAE encoder/decoder nén-giải nén ảnh, (2) U-Net làm diffusion trên latent 4×64×64, (3) text encoder (CLIP ViT-L hoặc T5) biến prompt thành embedding. Làm diffusion ở latent nhỏ hơn ~48 lần → nhanh hơn và dùng ít VRAM hơn.",
  },
  {
    question:
      "Guidance scale (w) quá cao (ví dụ w = 20) sẽ gây hiện tượng gì?",
    options: [
      "Ảnh sắc nét, bám prompt hoàn hảo",
      "Ảnh quá bão hoà, colour clipping, artifact, thiếu đa dạng — 'over-guided'",
      "Model crash",
    ],
    correct: 1,
    explanation:
      "Tăng w làm output bám prompt chặt hơn nhưng cũng khuếch đại noise prediction error, gây oversaturated, bớt sáng tạo, artifact. Thực nghiệm: w = 5–9 tốt nhất cho SD 1.5, SDXL thì w = 4–7. Có kỹ thuật như 'dynamic thresholding' (Imagen) để giảm artifact khi w cao.",
  },
  {
    type: "fill-blank",
    question:
      "Diffusion Model có 2 quá trình: forward thêm {blank} Gaussian dần dần (x → nhiễu thuần), và reverse dùng U-Net để {blank} (nhiễu → ảnh mới).",
    blanks: [
      { answer: "nhiễu", accept: ["noise", "Nhiễu", "Noise"] },
      {
        answer: "khử nhiễu",
        accept: ["denoise", "denoising", "Khử nhiễu", "Denoise"],
      },
    ],
    explanation:
      "Forward process: thêm nhiễu Gaussian theo β_t schedule cho đến khi x_T ≈ N(0, I). Reverse process: U-Net học dự đoán ε (nhiễu đã thêm) tại mỗi timestep, rồi khử nhiễu (denoise) ngược từ nhiễu thuần về ảnh. Loss đơn giản: ||ε - ε_θ(x_t, t)||².",
  },
];

// ---------------------------------------------------------------------------
// DDIM vs DDPM — bảng so sánh sampler
// ---------------------------------------------------------------------------

interface SamplerRow {
  axis: string;
  ddpm: string;
  ddim: string;
}

const DDPM_VS_DDIM: SamplerRow[] = [
  {
    axis: "Số bước tiêu biểu",
    ddpm: "1000 (có thể 250–4000)",
    ddim: "20–50 step",
  },
  {
    axis: "Tính ngẫu nhiên (η)",
    ddpm: "Stochastic: η = 1, mỗi lần sample khác nhau",
    ddim: "Deterministic khi η = 0 — cùng noise → cùng ảnh",
  },
  {
    axis: "Quá trình ngược",
    ddpm: "Markovian: x_{t-1} chỉ phụ thuộc x_t",
    ddim: "Non-Markovian: x_{t-1} phụ thuộc cả x_t và x_0 dự đoán",
  },
  {
    axis: "Tốc độ",
    ddpm: "Chậm, ~30–60 giây/ảnh trên A100",
    ddim: "Nhanh ~10× với 50 step, chất lượng vẫn ổn",
  },
  {
    axis: "Ứng dụng",
    ddpm: "Research baseline, nghiên cứu lý thuyết",
    ddim: "Production — Stable Diffusion mặc định",
  },
  {
    axis: "Tái hiện (reproducibility)",
    ddpm: "Khó — do stochasticity giữa các bước",
    ddim: "Dễ — seed cố định → ảnh cố định",
  },
];

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

export default function DiffusionModelsTopic() {
  /* ── Phase A: Paint state ──────────────────────── */
  const emptyGrid = useCallback(
    () =>
      Array.from({ length: GRID }, () =>
        Array(GRID).fill(false) as boolean[],
      ),
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
    const id = setTimeout(
      () => setPaintCountdown((p) => (p ?? 1) - 1),
      1000,
    );
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

  /* ── Phase B: Noise schedule (ổn định theo painting) ── */
  const noiseSeed = useMemo(() => {
    return userGrid.flat().reduce((s, v, i) => s + (v ? i * 7 : 0), 42);
  }, [userGrid]);

  const noiseSchedule = useMemo(
    () => buildNoiseSchedule(noiseSeed),
    [noiseSeed],
  );

  const [noiseT, setNoiseT] = useState(0);

  const noisyGrid = useMemo(
    () => applyNoise(userGrid, noiseSchedule, noiseT),
    [userGrid, noiseSchedule, noiseT],
  );

  /* ── Phase C: Denoise state ─────────────────────── */
  const [denoiseT, setDenoiseT] = useState(MAX_T);

  const denoisedGrid = useMemo(
    () => applyNoise(userGrid, noiseSchedule, denoiseT),
    [userGrid, noiseSchedule, denoiseT],
  );

  const handleDenoiseStep = useCallback(() => {
    setDenoiseT((prev) => Math.max(0, prev - 1));
  }, []);

  /* ── Forward vs Reverse demo data ──────────────── */
  const compareBase = useMemo(() => {
    // Một pattern chữ thập đơn giản cho demo ổn định
    return Array.from({ length: GRID }, (_, r) =>
      Array.from(
        { length: GRID },
        (_, c) => r === 3 || r === 4 || c === 3 || c === 4,
      ),
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

  const hasPainted = userGrid.some((row) => row.some(Boolean));

  /* ── DDIM vs DDPM interactive simulation ──────── */
  const [samplerSteps, setSamplerSteps] = useState(50);
  // Ước lượng thời gian sampling (mô phỏng: tỉ lệ tuyến tính)
  const samplingTime = useMemo(() => {
    // Giả định 1000 step DDPM mất 60s trên A100
    return ((samplerSteps / 1000) * 60).toFixed(2);
  }, [samplerSteps]);

  /* ── Classifier-Free Guidance demo state ──────── */
  const [cfgScale, setCfgScale] = useState(7.5);

  const cfgArtifactLevel = useMemo(() => {
    // Mô phỏng "artifact risk" tăng phi tuyến khi w > 10
    if (cfgScale <= 3) return "under-guided";
    if (cfgScale <= 9) return "sweet-spot";
    if (cfgScale <= 15) return "over-guided";
    return "severe-artifacts";
  }, [cfgScale]);

  const cfgHue = useMemo(() => {
    // Ánh xạ cfg 1 → hue 220 (xanh), 20 → hue 0 (đỏ)
    const clamped = Math.max(1, Math.min(20, cfgScale));
    return 220 - ((clamped - 1) / 19) * 220;
  }, [cfgScale]);

  return (
    <>
      {/* ═══ STEP 1: HOOK — PredictionGate ═════════════════════════════ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn xem video mực nhỏ vào nước — mực lan ra dần. Nếu quay ngược video, mực sẽ..."
          options={["Vẫn lan ra", "Tự gom lại thành giọt", "Biến mất"]}
          correct={1}
          explanation="Quay ngược khuếch tán = tái tạo cấu trúc từ hỗn loạn. Đó chính là cách Diffusion Models sinh ảnh!"
        />
      </LessonSection>

          {/* ═══ ANALOGY BLOCK ═══════════════════════════════════════════ */}
          <div className="my-6 rounded-2xl border border-border bg-surface/40 p-5">
            <h4 className="text-sm font-semibold text-foreground">
              Ẩn dụ: Người điêu khắc đá cẩm thạch
            </h4>
            <p className="mt-2 text-sm text-muted leading-relaxed">
              Michelangelo từng nói: <em>"Pho tượng đã có sẵn trong khối đá, tôi chỉ đục bỏ phần
              thừa."</em> Diffusion model hoạt động đúng như vậy. Khối đá thô =
              nhiễu Gaussian thuần túy. Mỗi nhát đục nhỏ = một bước khử nhiễu. Kết quả sau hàng
              trăm nhát = pho tượng (ảnh) hiện ra dần từ hỗn loạn.
            </p>
            <p className="mt-2 text-sm text-muted leading-relaxed">
              Điểm thú vị: model <strong>không ghi nhớ</strong> pho tượng cụ thể nào. Nó học một
              quy luật tổng quát "cạnh này nên sắc hơn, vùng kia nên mịn hơn" — gọi là
              <em> score function</em>. Prompt chỉ đơn giản là nói với người điêu khắc: "hôm nay
              hãy đục ra một con rồng đang bay trong mưa". Cùng một người, cùng bộ kỹ năng, nhưng
              prompt khác → kết quả khác hoàn toàn.
            </p>
          </div>

          {/* ═══ STEP 2: DISCOVER — Paint → Noise → Denoise ═════════════ */}
          <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
            <VisualizationSection topicSlug={metadata.slug}>
              {/* ── Phase A: Paint ──────────────────────── */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Bước 1: Vẽ hình của bạn
                </h3>
                <p className="text-sm text-muted">
                  Click vào ô để tô đen/trắng. Vẽ chữ, hình, hoặc bất kỳ pattern nào bạn muốn.
                </p>

                <div className="flex flex-col items-center gap-3">
                  <GridSVG
                    grid={userGrid}
                    onClick={paintDone ? undefined : handleCellClick}
                  />

                  {!paintDone ? (
                    <div className="flex items-center gap-3">
                      {paintCountdown === null ? (
                        <button type="button" onClick={startPaintTimer} disabled={!hasPainted} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-40 hover:enabled:opacity-90">
                          Bắt đầu đếm ngược 10s
                        </button>
                      ) : (
                        <span className="text-sm tabular-nums text-accent">Còn {paintCountdown}s...</span>
                      )}
                      <button type="button" onClick={finishPaint} disabled={!hasPainted} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface disabled:opacity-40">
                        Xong
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={resetPaint} className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:bg-surface transition-colors">
                      Vẽ lại
                    </button>
                  )}
                </div>
              </div>

              {/* ── Phase B: Add Noise ─────────────────── */}
              <AnimatePresence>
                {paintDone && (
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} className="mt-6 space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">Bước 2: Thêm nhiễu (Forward Process)</h3>
                    <p className="text-sm text-muted">Kéo thanh trượt sang phải — xem hình của bạn dần biến thành nhiễu ngẫu nhiên.</p>
                    <div className="flex flex-col items-center gap-3">
                      <GridSVG grid={noisyGrid} label={`t = ${noiseT}`} />
                      <div className="w-full max-w-xs space-y-1">
                        <input type="range" min={0} max={MAX_T} value={noiseT} onChange={(e) => setNoiseT(Number(e.target.value))} className="w-full accent-accent" />
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
                      Đây là quá trình thêm nhiễu dần dần — mỗi bước chỉ đảo vài pixel. Sau đủ bước, mọi ảnh đều thành nhiễu ngẫu nhiên giống nhau.
                    </Callout>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Phase C: Denoise ───────────────────── */}
              <AnimatePresence>
                {paintDone && noiseT === MAX_T && (
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }} className="mt-6 space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">Bước 3: Khử nhiễu (Reverse Process)</h3>
                    <p className="text-sm text-muted">Bắt đầu từ nhiễu thuần — nhấn nút để khử nhiễu từng bước. Xem hình tái hiện!</p>
                    <div className="flex flex-col items-center gap-3">
                      <GridSVG grid={denoisedGrid} label={`t = ${denoiseT}`} />
                      <button type="button" onClick={handleDenoiseStep} disabled={denoiseT <= 0} className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-30 hover:enabled:opacity-90">
                        {denoiseT > 0 ? `Khử nhiễu: t=${denoiseT} → t=${denoiseT - 1}` : "Hoàn tất!"}
                      </button>
                      <p className="text-xs text-center text-accent font-medium">
                        {denoiseT === MAX_T && "Nhiễu thuần túy — AI bắt đầu khử nhiễu..."}
                        {denoiseT > 0 && denoiseT < MAX_T && `Đã khử ${MAX_T - denoiseT}/${MAX_T} bước — hình dần hiện ra!`}
                        {denoiseT === 0 && "Ảnh gốc đã tái tạo hoàn toàn! AI học cách 'quay ngược' nhiễu."}
                      </p>
                    </div>
                    <Callout variant="tip" title="Reverse Process">
                      AI học cách khử nhiễu từng bước nhỏ. Mỗi bước chỉ cần dự đoán &quot;pixel nào bị đảo ở bước này?&quot; rồi sửa lại. Đơn giản nhưng hiệu quả!
                    </Callout>
                  </motion.div>
                )}
              </AnimatePresence>
            </VisualizationSection>

            {/* ═══ FORWARD vs REVERSE SPLIT VIEW ═════════════════════════ */}
            <div className="mt-8">
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
                    const rev = applyNoise(
                      reverseBase,
                      reverseSchedule,
                      MAX_T - t,
                    );
                    return (
                      <div className="flex items-center gap-6">
                        <GridSVG grid={fwd} size={18} label={`Forward t=${t}`} />
                        <div className="flex flex-col items-center text-xs text-muted">
                          <span>&larr; Nhiễu tăng</span>
                          <span className="font-mono font-bold text-accent">
                            t = {t}
                          </span>
                          <span>Nhiễu giảm &rarr;</span>
                        </div>
                        <GridSVG
                          grid={rev}
                          size={18}
                          label={`Reverse t=${MAX_T - t}`}
                        />
                      </div>
                    );
                  }}
                />
              </div>

              <p className="mt-3 text-sm text-muted">
                Forward bắt đầu từ ảnh sạch, thêm nhiễu dần. Reverse bắt đầu từ nhiễu, khử dần
                thành ảnh mới. Hai quá trình ngược chiều nhưng cùng số bước.
              </p>
            </div>

            {/* ═══ DDIM vs DDPM INTERACTIVE ══════════════════════════════ */}
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                So sánh sampler: DDPM vs DDIM
              </h3>
              <p className="text-sm text-muted leading-relaxed mb-3">
                Cùng một diffusion model (cùng U-Net đã train), nhưng chọn sampler khác nhau cho
                kết quả rất khác. Kéo thanh trượt dưới để thấy ảnh hưởng của số step tới thời gian
                sinh ảnh.
              </p>
              <div className="rounded-xl border border-border bg-surface/40 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-xs text-muted min-w-[110px]">
                    Số sampling step
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={1000}
                    step={10}
                    value={samplerSteps}
                    onChange={(e) => setSamplerSteps(Number(e.target.value))}
                    className="flex-1 accent-accent"
                  />
                  <span className="font-mono text-sm text-foreground min-w-[60px] text-right">
                    {samplerSteps}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-md bg-card border border-border p-3">
                    <div className="font-semibold text-foreground mb-1">
                      DDPM (stochastic)
                    </div>
                    <p className="text-muted">
                      Cần đủ step để khử nhiễu mượt. Với {samplerSteps} step, chất lượng ≈{" "}
                      <strong
                        className={
                          samplerSteps < 100
                            ? "text-amber-500"
                            : "text-green-600"
                        }
                      >
                        {samplerSteps < 100
                          ? "kém (ảnh nhoè)"
                          : samplerSteps < 500
                            ? "ổn"
                            : "tốt"}
                      </strong>
                      . Thời gian ~ {samplingTime}s/ảnh.
                    </p>
                  </div>
                  <div className="rounded-md bg-card border border-border p-3">
                    <div className="font-semibold text-foreground mb-1">
                      DDIM (deterministic)
                    </div>
                    <p className="text-muted">
                      Với {samplerSteps} step, chất lượng ≈{" "}
                      <strong
                        className={
                          samplerSteps < 20
                            ? "text-amber-500"
                            : "text-green-600"
                        }
                      >
                        {samplerSteps < 20
                          ? "kém"
                          : samplerSteps < 50
                            ? "ổn"
                            : "rất tốt"}
                      </strong>
                      . Cùng seed → cùng output. 50 step là đủ cho hầu hết prompt.
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-muted italic">
                  Lưu ý: đây là mô phỏng trực quan, không phải benchmark thực tế.
                </p>
              </div>

              <div className="mt-4">
                <SplitView
                  leftLabel="DDPM — Markovian, stochastic"
                  rightLabel="DDIM — Non-Markovian, deterministic"
                  left={
                    <ul className="space-y-2 text-xs text-muted">
                      {DDPM_VS_DDIM.map((row) => (
                        <li key={`ddpm-${row.axis}`} className="rounded-md border border-border p-2">
                          <div className="font-semibold text-foreground text-[11px]">{row.axis}</div>
                          <div className="mt-0.5">{row.ddpm}</div>
                        </li>
                      ))}
                    </ul>
                  }
                  right={
                    <ul className="space-y-2 text-xs text-muted">
                      {DDPM_VS_DDIM.map((row) => (
                        <li key={`ddim-${row.axis}`} className="rounded-md border border-border p-2">
                          <div className="font-semibold text-foreground text-[11px]">{row.axis}</div>
                          <div className="mt-0.5">{row.ddim}</div>
                        </li>
                      ))}
                    </ul>
                  }
                />
              </div>
            </div>

            {/* ═══ CLASSIFIER-FREE GUIDANCE VISUALIZATION ═══════════════ */}
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Classifier-Free Guidance — kéo slider để khám phá
              </h3>
              <p className="text-sm text-muted leading-relaxed mb-3">
                Guidance scale <strong>w</strong> điều khiển mức độ "bám prompt". Công thức:{" "}
                <code>ε̂ = ε_uncond + w · (ε_cond − ε_uncond)</code>. Kéo slider để xem trạng thái
                đầu ra — thấp thì lờ mờ không bám prompt, quá cao thì bão hoà, sweet spot ở
                w ≈ 7.5.
              </p>
              <div className="rounded-xl border border-border bg-surface/40 p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <label className="text-xs text-muted min-w-[110px]">
                    Guidance scale w
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    step={0.5}
                    value={cfgScale}
                    onChange={(e) => setCfgScale(Number(e.target.value))}
                    className="flex-1 accent-accent"
                  />
                  <span className="font-mono text-sm text-foreground min-w-[60px] text-right">
                    {cfgScale.toFixed(1)}
                  </span>
                </div>

                {/* SVG minh hoạ nội suy giữa uncond và cond */}
                <svg viewBox="0 0 600 160" className="w-full max-w-2xl mx-auto" role="img" aria-label="CFG">
                  <line x1={40} y1={110} x2={560} y2={110} stroke="#475569" strokeWidth={1} />
                  {[1, 5, 7.5, 10, 15, 20].map((mark) => {
                    const x = 40 + ((mark - 1) / 19) * 520;
                    return (
                      <g key={mark}>
                        <line x1={x} y1={106} x2={x} y2={114} stroke="#475569" strokeWidth={1} />
                        <text x={x} y={128} textAnchor="middle" fill="var(--text-secondary)" fontSize={11}>w={mark}</text>
                      </g>
                    );
                  })}
                  <rect x={40} y={30} width={((3 - 1) / 19) * 520} height={60} fill="#60a5fa" opacity={0.12} />
                  <rect x={40 + ((3 - 1) / 19) * 520} y={30} width={((9 - 3) / 19) * 520} height={60} fill="#22c55e" opacity={0.18} />
                  <rect x={40 + ((9 - 1) / 19) * 520} y={30} width={((15 - 9) / 19) * 520} height={60} fill="#f59e0b" opacity={0.18} />
                  <rect x={40 + ((15 - 1) / 19) * 520} y={30} width={((20 - 15) / 19) * 520} height={60} fill="#ef4444" opacity={0.18} />
                  <text x={60} y={52} fill="#60a5fa" fontSize={11} fontWeight="bold">Under-guided</text>
                  <text x={60} y={66} fill="#60a5fa" fontSize={11}>bỏ qua prompt</text>
                  <text x={210} y={52} fill="#22c55e" fontSize={11} fontWeight="bold">Sweet spot</text>
                  <text x={210} y={66} fill="#22c55e" fontSize={11}>w=5–9 cho SD 1.5</text>
                  <text x={360} y={52} fill="#f59e0b" fontSize={11} fontWeight="bold">Over-guided</text>
                  <text x={360} y={66} fill="#f59e0b" fontSize={11}>oversaturated</text>
                  <text x={470} y={52} fill="#ef4444" fontSize={11} fontWeight="bold">Severe</text>
                  <text x={470} y={66} fill="#ef4444" fontSize={11}>artifact nặng</text>
                  <g transform={`translate(${40 + ((cfgScale - 1) / 19) * 520}, 60)`}>
                    <circle r={10} fill={`hsl(${cfgHue}, 70%, 55%)`} stroke="#fff" strokeWidth={2} />
                    <text y={-18} textAnchor="middle" fill="var(--text-primary)" fontSize={11} fontWeight="bold">
                      w = {cfgScale.toFixed(1)}
                    </text>
                  </g>
                  <text x={300} y={150} textAnchor="middle" fill="var(--text-secondary)" fontSize={11} fontFamily="monospace">
                    ε̂ = ε_uncond + w · (ε_cond − ε_uncond)
                  </text>
                </svg>

                <div className="rounded-md border border-border bg-card p-3 text-xs text-muted">
                  Trạng thái hiện tại:{" "}
                  <strong
                    className={
                      cfgArtifactLevel === "sweet-spot"
                        ? "text-green-600"
                        : cfgArtifactLevel === "severe-artifacts"
                          ? "text-red-500"
                          : "text-amber-500"
                    }
                  >
                    {cfgArtifactLevel === "under-guided" &&
                      "Under-guided — model gần như bỏ qua prompt, ảnh generic"}
                    {cfgArtifactLevel === "sweet-spot" &&
                      "Sweet spot — prompt được tôn trọng, ảnh đa dạng và sắc nét"}
                    {cfgArtifactLevel === "over-guided" &&
                      "Over-guided — màu bão hoà, contrast gắt, giảm đa dạng"}
                    {cfgArtifactLevel === "severe-artifacts" &&
                      "Severe artifacts — halo, oversaturation, deformity rõ rệt"}
                  </strong>
                </div>
              </div>
            </div>

            {/* ═══ STABLE DIFFUSION ARCHITECTURE DIAGRAM ════════════════ */}
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Kiến trúc Stable Diffusion: VAE + U-Net + Text Encoder
              </h3>
              <p className="text-sm text-muted leading-relaxed mb-3">
                Stable Diffusion là <em>latent diffusion model</em>: thay vì khuếch tán trên pixel
                512×512×3 = 786k chiều, ta nén ảnh xuống latent 64×64×4 = 16k chiều bằng VAE, rồi
                diffusion chạy trong không gian ít hơn ~48 lần. Text encoder (CLIP-L hoặc T5) cung
                cấp điều kiện qua cross-attention.
              </p>
              <div className="rounded-xl border border-border bg-surface/40 p-4">
                <svg
                  viewBox="0 0 760 340"
                  className="w-full max-w-4xl mx-auto"
                  role="img"
                  aria-label="Stable Diffusion architecture"
                >
                  {/* --- Input text --- */}
                  <rect x={10} y={10} width={160} height={36} rx={6} fill="#1e293b" stroke="#a78bfa" strokeWidth={1.5} />
                  <text x={90} y={28} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontWeight="bold">Prompt (text)</text>
                  <text x={90} y={40} textAnchor="middle" fill="#a78bfa" fontSize={11}>"a cat astronaut"</text>

                  {/* --- Text encoder --- */}
                  <rect x={10} y={70} width={160} height={60} rx={8} fill="rgba(167,139,250,0.15)" stroke="#a78bfa" strokeWidth={2} />
                  <text x={90} y={92} textAnchor="middle" fill="#c4b5fd" fontSize={11} fontWeight="bold">Text Encoder</text>
                  <text x={90} y={106} textAnchor="middle" fill="#c4b5fd" fontSize={11}>CLIP ViT-L / OpenCLIP</text>
                  <text x={90} y={118} textAnchor="middle" fill="var(--text-secondary)" fontSize={11}>77 × 768 dim</text>

                  {/* Arrow prompt → text encoder */}
                  <line x1={90} y1={46} x2={90} y2={70} stroke="#a78bfa" strokeWidth={1.5} />
                  <polygon points="86,66 90,70 94,66" fill="#a78bfa" />

                  {/* --- Input image (training only) --- */}
                  <rect x={10} y={160} width={160} height={36} rx={6} fill="#1e293b" stroke="#f472b6" strokeWidth={1.5} strokeDasharray="3 2" />
                  <text x={90} y={178} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontWeight="bold">Image 512×512×3</text>
                  <text x={90} y={190} textAnchor="middle" fill="#f472b6" fontSize={11}>(chỉ khi training)</text>

                  {/* --- VAE Encoder --- */}
                  <rect x={10} y={220} width={160} height={50} rx={8} fill="rgba(244,114,182,0.15)" stroke="#f472b6" strokeWidth={2} />
                  <text x={90} y={240} textAnchor="middle" fill="#f9a8d4" fontSize={11} fontWeight="bold">VAE Encoder</text>
                  <text x={90} y={254} textAnchor="middle" fill="#f9a8d4" fontSize={11}>512×512×3 → 64×64×4</text>
                  <text x={90} y={266} textAnchor="middle" fill="var(--text-secondary)" fontSize={11}>compression ratio 48×</text>

                  {/* arrow */}
                  <line x1={90} y1={196} x2={90} y2={220} stroke="#f472b6" strokeWidth={1.5} strokeDasharray="3 2" />
                  <polygon points="86,216 90,220 94,216" fill="#f472b6" />

                  {/* --- U-Net (center, big) --- */}
                  <rect x={220} y={70} width={320} height={200} rx={12} fill="rgba(34,211,238,0.10)" stroke="#22d3ee" strokeWidth={2} />
                  <text x={380} y={92} textAnchor="middle" fill="#67e8f9" fontSize={13} fontWeight="bold">Denoising U-Net</text>
                  <text x={380} y={108} textAnchor="middle" fill="#67e8f9" fontSize={11}>~860M parameters (SD 1.5)</text>

                  {/* Encoder blocks */}
                  {[0, 1, 2, 3].map((i) => (
                    <rect key={`enc-${i}`} x={240 + i * 30} y={130 + i * 12} width={30 - i * 3} height={20 - i * 2} rx={2} fill="#0891b2" opacity={0.8} />
                  ))}
                  <text x={260} y={200} fill="var(--text-secondary)" fontSize={11}>encoder (down)</text>
                  <rect x={370} y={180} width={20} height={14} rx={2} fill="#22d3ee" />
                  <text x={380} y={210} textAnchor="middle" fill="#22d3ee" fontSize={11} fontWeight="bold">mid block</text>
                  {[0, 1, 2, 3].map((i) => (
                    <rect key={`dec-${i}`} x={420 + i * 30} y={178 - i * 12} width={21 + i * 3} height={14 + i * 2} rx={2} fill="#0891b2" opacity={0.8} />
                  ))}
                  <text x={480} y={200} fill="var(--text-secondary)" fontSize={11}>decoder (up)</text>
                  {[0, 1, 2].map((i) => (
                    <path key={`skip-${i}`} d={`M ${255 + i * 28} ${140 + i * 12} Q ${380} ${120 + i * 5} ${510 - i * 28} ${184 - i * 12}`} stroke="#22d3ee" strokeWidth={1} strokeDasharray="2 2" fill="none" />
                  ))}
                  <text x={380} y={250} textAnchor="middle" fill="#22d3ee" fontSize={11}>skip connections (U-Net)</text>
                  <path d="M 170 100 Q 200 90 240 140" stroke="#a78bfa" strokeWidth={1.5} fill="none" markerEnd="url(#arrow-purple)" />
                  <path d="M 170 100 Q 200 80 440 140" stroke="#a78bfa" strokeWidth={1.5} fill="none" markerEnd="url(#arrow-purple)" />
                  <text x={200} y={80} fill="#c4b5fd" fontSize={11} fontWeight="bold">cross-attention</text>
                  <line x1={170} y1={245} x2={220} y2={200} stroke="#f472b6" strokeWidth={1.5} />
                  <polygon points="216,196 220,200 216,204" fill="#f472b6" />
                  <text x={175} y={240} fill="#f9a8d4" fontSize={11}>z_t</text>
                  <rect x={225} y={285} width={80} height={20} rx={4} fill="rgba(251,191,36,0.15)" stroke="#fbbf24" strokeWidth={1} />
                  <text x={265} y={299} textAnchor="middle" fill="#fde68a" fontSize={11} fontWeight="bold">timestep t emb</text>
                  <line x1={265} y1={285} x2={320} y2={250} stroke="#fbbf24" strokeWidth={1.5} />
                  <rect x={590} y={160} width={160} height={60} rx={8} fill="rgba(244,114,182,0.15)" stroke="#f472b6" strokeWidth={2} />
                  <text x={670} y={182} textAnchor="middle" fill="#f9a8d4" fontSize={11} fontWeight="bold">VAE Decoder</text>
                  <text x={670} y={196} textAnchor="middle" fill="#f9a8d4" fontSize={11}>64×64×4 → 512×512×3</text>
                  <text x={670} y={208} textAnchor="middle" fill="var(--text-secondary)" fontSize={11}>giải nén latent</text>
                  <rect x={590} y={240} width={160} height={36} rx={6} fill="#1e293b" stroke="#22c55e" strokeWidth={1.5} />
                  <text x={670} y={258} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontWeight="bold">Output 512×512</text>
                  <text x={670} y={270} textAnchor="middle" fill="#22c55e" fontSize={11}>ảnh cuối cùng</text>
                  <line x1={540} y1={170} x2={590} y2={185} stroke="#22d3ee" strokeWidth={1.5} />
                  <polygon points="586,181 590,185 586,189" fill="#22d3ee" />
                  <text x={550} y={165} fill="#67e8f9" fontSize={11}>ẑ_0</text>
                  <line x1={670} y1={220} x2={670} y2={240} stroke="#f472b6" strokeWidth={1.5} />
                  <polygon points="666,236 670,240 674,236" fill="#f472b6" />
                  <defs>
                    <marker id="arrow-purple" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={6} markerHeight={6} orient="auto">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#a78bfa" />
                    </marker>
                  </defs>
                  <text x={380} y={330} textAnchor="middle" fill="var(--text-primary)" fontSize={11}>
                    Inference loop: với mỗi t = T,…,0 → U-Net dự đoán ε, cập nhật z_t → z_{"t-1"}, cuối cùng VAE decode z_0
                  </text>
                </svg>
              </div>
            </div>
          </LessonSection>

          {/* ═══ STEP 3: AHA MOMENT ══════════════════════════════════════ */}
          <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
            <AhaMoment>
              <p>
                Quy trình <strong>Thêm nhiễu</strong> &rarr;{" "}
                <strong>Học khử nhiễu</strong> &rarr; <strong>Sinh ảnh mới</strong> chính là{" "}
                <strong>Diffusion Model</strong> — nền tảng của Stable Diffusion, DALL·E và
                Midjourney! Bí mật không phải ở việc "nhớ" ảnh huấn luyện, mà là học một trường
                vector <em>score function</em> chỉ đường về phân phối dữ liệu thật: mỗi bước chỉ
                đi một đoạn ngắn theo hướng giảm nhiễu, và sau hàng chục bước, điểm bắt đầu ngẫu
                nhiên tự rơi vào manifold của ảnh có nghĩa.
              </p>
            </AhaMoment>
          </LessonSection>

          {/* ═══ STEP 4: CHALLENGES ══════════════════════════════════════ */}
          <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
            <p className="text-sm text-muted leading-relaxed mb-3">
              So với <TopicLink slug="gan">GAN</TopicLink> chỉ cần 1 forward pass, diffusion phải
              lặp lại nhiều bước — đây là trade-off giữa chất lượng và tốc độ.
            </p>
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

            <div className="mt-4">
              <InlineChallenge
                question="Bạn nhận deliverable một mô hình SD fine-tune cho prompt 'Vietnamese food photography'. Team cần tái hiện chính xác một ảnh cho poster quảng cáo. Nên chọn sampler nào và vì sao?"
                options={[
                  "DDPM — vì có randomness nên đẹp hơn",
                  "DDIM với η = 0 + fixed seed — deterministic, cùng seed → cùng ảnh, dễ tái hiện để in poster",
                  "Không sampler nào tái hiện được, phải train lại",
                ]}
                correct={1}
                explanation="Khi cần reproducibility (poster, A/B test, debugging), luôn dùng DDIM với η = 0 + cố định seed + cố định CFG scale + cố định số step. Sản phẩm thiết kế cần ảnh nhất quán, không thể để model lottery."
              />
            </div>
          </LessonSection>

          {/* ═══ STEP 5: EXPLANATION ════════════════════════════════════ */}
          <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
            <ExplanationSection>
              {/* ── ĐỊNH NGHĨA ─────────────────────────────────────────── */}
              <p>
                <strong>Diffusion Model</strong> là lớp mô hình sinh (generative model) học phân
                phối dữ liệu <em>p(x)</em> bằng cách định nghĩa một quá trình{" "}
                <strong>forward</strong> dần phá huỷ thông tin bằng nhiễu Gaussian, và học một
                quá trình <strong>reverse</strong> để tái tạo dữ liệu từ nhiễu thuần tuý. Diffusion
                vượt trội GAN về độ ổn định huấn luyện, độ đa dạng (không mode collapse) và chất
                lượng sinh — đồng thời dễ điều kiện hoá (conditional generation) cho{" "}
                <TopicLink slug="text-to-image">text-to-image</TopicLink>,{" "}
                <TopicLink slug="text-to-video">text-to-video</TopicLink>, inpainting,
                super-resolution, v.v.
              </p>

              {/* ── FORWARD PROCESS ───────────────────────────────────── */}
              <h3 className="text-base font-semibold text-foreground">
                Forward Process — Thêm nhiễu có hệ thống
              </h3>
              <p>
                Tại mỗi bước <em>t</em>, ta thêm nhiễu Gaussian theo schedule{" "}
                <em>β_t</em> ∈ (0, 1):
              </p>
              <LaTeX block>
                {
                  "q(x_t \\mid x_{t-1}) = \\mathcal{N}\\big(x_t;\\ \\sqrt{1-\\beta_t}\\,x_{t-1},\\ \\beta_t \\mathbf{I}\\big)"
                }
              </LaTeX>
              <p>
                Bằng tham số hoá <em>ᾱ_t = ∏_{"{s=1}"}^{"t"}(1-β_s)</em>, ta có closed-form cho
                bước bất kỳ:
              </p>
              <LaTeX block>
                {
                  "q(x_t \\mid x_0) = \\mathcal{N}\\big(x_t;\\ \\sqrt{\\bar\\alpha_t}\\,x_0,\\ (1-\\bar\\alpha_t)\\mathbf{I}\\big)"
                }
              </LaTeX>
              <p>
                Khi <em>T</em> đủ lớn (thường 1000), <em>ᾱ_T → 0</em>, nên{" "}
                <em>x_T ≈ 𝒩(0, I)</em> — nhiễu thuần Gaussian. Đây là điểm khởi đầu của reverse
                process.
              </p>

              {/* ── REVERSE PROCESS ───────────────────────────────────── */}
              <h3 className="text-base font-semibold text-foreground mt-4">
                Reverse Process — U-Net học khử nhiễu
              </h3>
              <p>
                Ta muốn học <em>p_θ(x_{"{t-1}"} | x_t)</em>. Với β nhỏ, phân phối này xấp xỉ
                Gaussian, tham số hoá:
              </p>
              <LaTeX block>
                {
                  "p_\\theta(x_{t-1} \\mid x_t) = \\mathcal{N}\\big(x_{t-1};\\ \\mu_\\theta(x_t, t),\\ \\Sigma_\\theta(x_t, t)\\big)"
                }
              </LaTeX>
              <p>
                Ho et al. (2020) chứng minh reparametrisation sau đưa loss về dạng rất gọn — chỉ
                cần <strong>U-Net dự đoán nhiễu ε</strong> đã thêm:
              </p>
              <LaTeX block>
                {
                  "\\mathcal{L}_{\\text{simple}} = \\mathbb{E}_{x_0, \\varepsilon, t}\\Big[\\lVert \\varepsilon - \\varepsilon_\\theta(x_t, t)\\rVert^2\\Big]"
                }
              </LaTeX>
              <p>
                Với <em>x_t = √ᾱ_t x_0 + √(1-ᾱ_t) ε, ε ∼ 𝒩(0, I)</em>. Ý nghĩa: training chỉ đơn
                giản là cho U-Net xem ảnh đã thêm nhiễu và đoán lại nhiễu — rồi tối thiểu hoá MSE.
                Không cần discriminator, không cần adversarial, không mode collapse.
              </p>

              {/* ── LATEX: CFG ──────────────────────────────────────── */}
              <h3 className="text-base font-semibold text-foreground mt-4">
                Classifier-Free Guidance (CFG)
              </h3>
              <p>
                Để tăng độ bám prompt mà không cần classifier riêng, ta huấn luyện U-Net với cả
                prompt thật và prompt rỗng (drop prompt 10% thời gian). Khi inference:
              </p>
              <LaTeX block>
                {
                  "\\hat\\varepsilon_\\theta(x_t, t, c) = \\varepsilon_\\theta(x_t, t, \\varnothing) + w\\,\\big(\\varepsilon_\\theta(x_t, t, c) - \\varepsilon_\\theta(x_t, t, \\varnothing)\\big)"
                }
              </LaTeX>
              <p>
                Với <em>w</em> là <em>guidance scale</em>. <em>w = 1</em> nghĩa là chỉ dùng
                conditional (không boost), <em>w &gt; 1</em> khuếch đại chênh lệch → bám prompt
                chặt hơn. SD 1.5 khuyến nghị <em>w ≈ 7.5</em>; quá cao gây oversaturation như đã
                thấy trong viz ở trên.
              </p>

              {/* ── CODE BLOCK 1: SIMPLE TRAINING LOOP ─────────────── */}
              <CodeBlock
                language="python"
                title="1. Training loop đơn giản — DDPM objective"
              >
                {`import torch
import torch.nn.functional as F

# 1. Noise schedule (β_t) — thường dùng linear hoặc cosine
T = 1000
betas = torch.linspace(1e-4, 0.02, T)  # linear schedule
alphas = 1.0 - betas
alphas_cumprod = torch.cumprod(alphas, dim=0)  # ᾱ_t

def sample_noisy(x0, t, noise):
    """Thêm nhiễu tới bước t bằng closed-form (không cần loop)."""
    a_bar = alphas_cumprod[t].view(-1, 1, 1, 1)
    return a_bar.sqrt() * x0 + (1 - a_bar).sqrt() * noise

# 2. Training step
def train_step(unet, x0, optimizer):
    batch = x0.size(0)
    # Lấy t ngẫu nhiên cho mỗi ảnh trong batch
    t = torch.randint(0, T, (batch,), device=x0.device)
    # ε ~ N(0, I)
    noise = torch.randn_like(x0)
    # Tạo x_t
    x_t = sample_noisy(x0, t, noise)
    # U-Net dự đoán nhiễu
    noise_pred = unet(x_t, t)
    # MSE loss giữa ε thực và ε dự đoán
    loss = F.mse_loss(noise_pred, noise)

    optimizer.zero_grad()
    loss.backward()
    optimizer.step()
    return loss.item()

# 3. Vòng lặp training
for epoch in range(n_epochs):
    for x0 in dataloader:
        loss = train_step(unet, x0.to(device), optimizer)`}
              </CodeBlock>

              {/* ── CODE BLOCK 2: DDIM SAMPLING ───────────────────── */}
              <CodeBlock language="python" title="2. DDIM sampling loop — deterministic & nhanh">
                {`@torch.no_grad()
def ddim_sample(unet, shape, timesteps=50, eta=0.0, device="cuda"):
    """DDIM sampling: non-Markovian, deterministic khi eta=0."""
    x = torch.randn(shape, device=device)

    # Chọn 50 bước rải đều trong [0, T)
    step_ratio = T // timesteps
    ddim_steps = torch.arange(0, T, step_ratio).flip(0)

    for i, t in enumerate(ddim_steps):
        t_batch = torch.full((shape[0],), t, device=device)
        t_prev = ddim_steps[i + 1] if i + 1 < len(ddim_steps) else -1

        # U-Net predict noise
        eps = unet(x, t_batch)

        a_t = alphas_cumprod[t]
        a_prev = alphas_cumprod[t_prev] if t_prev >= 0 else torch.tensor(1.0)

        # Dự đoán x_0
        x0_pred = (x - (1 - a_t).sqrt() * eps) / a_t.sqrt()

        # Hệ số stochastic (eta=0 → fully deterministic)
        sigma = eta * ((1 - a_prev) / (1 - a_t)).sqrt() * (1 - a_t / a_prev).sqrt()
        direction = (1 - a_prev - sigma ** 2).sqrt() * eps
        noise = sigma * torch.randn_like(x) if eta > 0 else 0.0

        # Cập nhật x theo DDIM formula
        x = a_prev.sqrt() * x0_pred + direction + noise

    return x  # ảnh sinh ra`}
              </CodeBlock>

              {/* ── CODE BLOCK 3: STABLE DIFFUSION INFERENCE WITH CFG ─ */}
              <CodeBlock
                language="python"
                title="3. Stable Diffusion inference với CFG"
              >
                {`import torch
from diffusers import StableDiffusionPipeline, DDIMScheduler

# Load pipeline Stable Diffusion 1.5
pipe = StableDiffusionPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5",
    torch_dtype=torch.float16,
).to("cuda")

# Thay scheduler mặc định bằng DDIM để deterministic
pipe.scheduler = DDIMScheduler.from_config(pipe.scheduler.config)

# Inference với CFG scale + seed cố định
generator = torch.Generator("cuda").manual_seed(42)
image = pipe(
    prompt="a Vietnamese pho bowl, studio lighting, 8k photography",
    negative_prompt="blurry, low quality, deformed",
    num_inference_steps=30,       # DDIM chỉ cần 20-50 steps
    guidance_scale=7.5,            # CFG sweet spot
    generator=generator,
).images[0]

image.save("pho.png")

# --- CFG bên trong thực chất làm gì? (pseudo-code) ---
# for t in timesteps:
#     # 1. Duplicate latent: [cond, uncond]
#     latent_in = torch.cat([latent] * 2)
#     # 2. Text embedding: [cond_emb, uncond_emb]
#     text_emb = torch.cat([cond_emb, uncond_emb])
#     # 3. U-Net forward một lần cho cả 2
#     eps_cond, eps_uncond = unet(latent_in, t, text_emb).chunk(2)
#     # 4. Guided noise
#     eps_hat = eps_uncond + guidance_scale * (eps_cond - eps_uncond)
#     # 5. Scheduler step
#     latent = scheduler.step(eps_hat, t, latent).prev_sample`}
              </CodeBlock>

              {/* ── CODE BLOCK 4: LATENT DIFFUSION ARCHITECTURE ───── */}
              <CodeBlock
                language="python"
                title="4. Kiến trúc Latent Diffusion (Stable Diffusion) — pseudo-code"
              >
                {`class StableDiffusion(nn.Module):
    def __init__(self):
        super().__init__()
        # 1. VAE: nén và giải nén ảnh
        self.vae = AutoencoderKL(
            in_channels=3, out_channels=3,
            latent_channels=4,   # 4 kênh latent
            downsample_factor=8, # 512 → 64
        )
        # 2. Text encoder: prompt → embedding
        self.text_encoder = CLIPTextModel.from_pretrained("clip-vit-large")
        # 3. U-Net: denoise latent có điều kiện text
        self.unet = UNet2DConditionModel(
            sample_size=64,          # latent resolution
            in_channels=4,           # latent channels
            cross_attention_dim=768, # khớp CLIP-L
        )

    def encode_image(self, image):
        """512×512×3 → 64×64×4 latent."""
        latent = self.vae.encode(image).latent_dist.sample()
        return latent * 0.18215  # scale factor của SD 1.5

    def decode_latent(self, latent):
        """64×64×4 → 512×512×3 ảnh."""
        return self.vae.decode(latent / 0.18215).sample

    def forward(self, latent, t, prompt_emb):
        """Predict noise từ latent có điều kiện prompt embedding."""
        return self.unet(latent, t, encoder_hidden_states=prompt_emb).sample

    @torch.no_grad()
    def generate(self, prompt, steps=50, cfg=7.5):
        # Encode prompt + empty prompt
        cond = self.text_encoder(tokenize(prompt))
        uncond = self.text_encoder(tokenize(""))
        # Random latent noise
        z = torch.randn(1, 4, 64, 64, device="cuda")
        # Denoise loop (DDIM)
        for t in reversed(range(0, 1000, 1000 // steps)):
            eps_c = self.forward(z, t, cond)
            eps_u = self.forward(z, t, uncond)
            eps = eps_u + cfg * (eps_c - eps_u)
            z = ddim_step(z, eps, t)
        # Decode latent → image
        return self.decode_latent(z)`}
              </CodeBlock>

              {/* ── 4 CALLOUTS ───────────────────────────────────── */}
              <Callout variant="info" title="Stable Diffusion = Latent Diffusion + Cross-Attention">
                Không khuếch tán trực tiếp trên pixel (512×512×3 = 786 432 chiều). Thay vào đó,
                ảnh được <strong>mã hóa thành latent vector</strong> nhỏ hơn (64×64×4 = 16 384
                chiều) bằng <TopicLink slug="vae">VAE</TopicLink>, rồi diffusion xảy ra trên latent
                space. Khi xong, VAE decode ngược lại thành ảnh. Kết quả: nhanh hơn ~48 lần mà chất
                lượng tương đương!
              </Callout>

              <Callout variant="tip" title="DDIM — 'xương sống' của mọi pipeline production">
                Nếu bạn chỉ nhớ một sampler duy nhất: hãy nhớ DDIM. Song et al. (2021) chứng minh
                rằng DDIM cho phép <em>skip step</em> mà chất lượng gần như không đổi, và khi
                <em> η = 0</em> thì deterministic — cùng seed → cùng ảnh. Stable Diffusion,
                Midjourney, DALL·E 3 đều dùng DDIM hoặc biến thể (DPM-Solver, Euler Ancestral)
                làm mặc định.
              </Callout>

              <Callout variant="warning" title="Cẩn thận với Guidance Scale quá cao">
                Nhiều người mới nghĩ "w càng cao càng bám prompt, càng đẹp" — sai. Thực nghiệm cho
                thấy <em>w &gt; 12</em> làm ảnh oversaturated, contrast gắt, mất đa dạng. Imagen
                (Google) đề xuất <em>dynamic thresholding</em>: cắt các giá trị ngoài phân vị p
                trước khi rescale, giúp dùng <em>w</em> cao mà không artifact.
              </Callout>

              <Callout variant="insight" title="Score-based view — cái nhìn thống nhất">
                Song &amp; Ermon (2019) cho thấy diffusion là trường hợp riêng của{" "}
                <em>score matching</em>: U-Net dự đoán <em>∇ log p(x_t)</em> — gradient của
                log-density. Công thức đẹp: <em>ε_θ ≈ −√(1-ᾱ) · ∇ log p(x_t)</em>. Điều này mở ra
                một nhóm phương pháp SDE/ODE mới (score-SDE, EDM) tổng quát hơn DDPM/DDIM — cùng
                một model có thể sample theo nhiều sampler khác nhau.
              </Callout>

              {/* ── 2 COLLAPSIBLE DETAILS ─────────────────────────── */}
              <CollapsibleDetail title="Chi tiết: Noise schedule — linear, cosine, sigmoid, zero-SNR">
                <div className="space-y-2 text-sm">
                  <p>
                    Chọn schedule <em>β_t</em> (hoặc tương đương <em>ᾱ_t</em>) ảnh hưởng lớn tới
                    chất lượng:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    <li>
                      <strong>Linear</strong> (Ho 2020): <em>β_1 = 1e-4 → β_T = 0.02</em>. Đơn
                      giản, hoạt động tốt cho CIFAR-10, 32×32. Với ảnh lớn (256+), ᾱ_T ≫ 0 gây
                      "information leak" — x_T vẫn còn tín hiệu ảnh gốc.
                    </li>
                    <li>
                      <strong>Cosine</strong> (Nichol &amp; Dhariwal 2021): <em>ᾱ_t = cos²((t/T + s)/(1 + s) · π/2)</em>.
                      Đầu gần 1, cuối gần 0 — khắc phục leak. Là schedule mặc định cho nhiều model
                      hiện đại.
                    </li>
                    <li>
                      <strong>Sigmoid / Karras</strong>: tập trung step ở vùng noise trung bình
                      (nơi model học tốt nhất), bỏ step ở cực trị.
                    </li>
                    <li>
                      <strong>Zero-SNR</strong> (Lin 2023): ép <em>ᾱ_T = 0</em> tuyệt đối, bắt
                      buộc x_T là nhiễu thuần. Cải thiện đáng kể dynamic range (hết bị grey shift)
                      — áp dụng trong SD 2.1, SDXL.
                    </li>
                  </ul>
                  <p>
                    Quy tắc kinh nghiệm: ảnh càng lớn, schedule càng cần nhiều noise ở cuối để
                    đảm bảo <em>x_T ≈ 𝒩(0, I)</em>. Đây cũng là lý do SD 2.1 &amp; SDXL dùng
                    offset noise / zero-SNR thay vì linear như SD 1.x.
                  </p>
                </div>
              </CollapsibleDetail>

              <CollapsibleDetail title="Chi tiết: Từ DDPM → DDIM → DPM-Solver → LCM — lịch sử 'tăng tốc' diffusion">
                <div className="space-y-2 text-sm">
                  <p>
                    Một trong những hướng nghiên cứu nóng nhất là giảm số sampling step mà vẫn giữ
                    chất lượng:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    <li>
                      <strong>DDPM (2020)</strong>: 1000 step, stochastic, Markovian. Baseline.
                    </li>
                    <li>
                      <strong>DDIM (2021)</strong>: non-Markovian, deterministic khi η = 0. Giảm
                      xuống 50 step với chất lượng gần tương đương.
                    </li>
                    <li>
                      <strong>DPM-Solver (2022)</strong>: xem reverse diffusion là ODE, dùng
                      higher-order solver (Runge-Kutta). 10–20 step là đủ.
                    </li>
                    <li>
                      <strong>UniPC (2023)</strong>: predictor-corrector unified cho nhiều
                      schedule. 8–12 step.
                    </li>
                    <li>
                      <strong>Consistency Models / LCM (2023)</strong>: distill U-Net để 1–4 step
                      là đủ cho preview chất lượng tương đối. Latent Consistency Model (LCM-LoRA)
                      đặc biệt hữu ích cho real-time editing (sinh ảnh 500ms/ảnh trên laptop).
                    </li>
                    <li>
                      <strong>SDXL Turbo &amp; SD3 (2023-2024)</strong>: Adversarial Diffusion
                      Distillation — 1 step tạo ảnh 512×512 nhanh gần bằng GAN.
                    </li>
                  </ul>
                  <p>
                    Xu thế chung: diffusion đang chạm tới tốc độ GAN nhưng giữ lợi thế về chất
                    lượng, đa dạng và điều kiện hoá. Với phần cứng 2024 (H100, M3 Max), sinh ảnh
                    4K &lt; 2 giây là hiện thực.
                  </p>
                </div>
              </CollapsibleDetail>

              {/* ── ỨNG DỤNG ──────────────────────────────────────── */}
              <p>
                <strong>Ứng dụng thực tế</strong> của diffusion model đã bùng nổ từ 2022:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>Text-to-image:</strong> Stable Diffusion, Midjourney, DALL·E 3, Imagen,
                  Firefly, Ideogram.
                </li>
                <li>
                  <strong>Image editing:</strong> inpainting, outpainting (mở rộng ảnh),
                  instruct-pix2pix, ControlNet (điều khiển theo pose/canny/depth).
                </li>
                <li>
                  <strong>Text-to-video:</strong> Sora (OpenAI), Veo (Google), Runway Gen-3, Pika,
                  Kling, Luma Dream Machine — dùng diffusion 3D (thêm chiều thời gian).
                </li>
                <li>
                  <strong>Text-to-3D:</strong> DreamFusion, Magic3D — dùng SDS loss để guide NeRF.
                </li>
                <li>
                  <strong>Audio:</strong> Riffusion (nhạc), AudioLDM, Stable Audio — diffusion
                  trên spectrogram hoặc latent audio.
                </li>
                <li>
                  <strong>Protein &amp; khoa học:</strong> RFdiffusion (thiết kế protein),
                  AlphaFold 3 (cấu trúc protein-ligand), DiffDock (docking phân tử).
                </li>
                <li>
                  <strong>Robotics:</strong> Diffusion Policy — sinh action sequence cho robot,
                  hơn hẳn MLP policy truyền thống.
                </li>
                <li>
                  <strong>Super-resolution &amp; restoration:</strong> SUPIR, StableSR, Real-ESRGAN
                  hybrid với diffusion.
                </li>
              </ul>

              {/* ── PITFALLS ─────────────────────────────────────── */}
              <p>
                <strong>Bẫy thường gặp (pitfalls)</strong>:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>Schedule mismatch giữa training &amp; inference:</strong> train với
                  linear nhưng sample với cosine → ảnh bị "xám", thiếu contrast. Luôn dùng cùng
                  schedule.
                </li>
                <li>
                  <strong>CFG scale quá cao:</strong> w = 20 không phải "siêu bám prompt" — là
                  artifact nặng. Giữ w ∈ [5, 9] cho SD.
                </li>
                <li>
                  <strong>Bỏ qua negative prompt:</strong> "low quality, blurry, deformed, extra
                  fingers" — nâng chất lượng đáng kể miễn phí.
                </li>
                <li>
                  <strong>VAE decode bị 'banding':</strong> dùng <em>fp16 decoder</em> gây artifact
                  dải màu. Giải: decode ở fp32 hoặc dùng VAE fine-tune (madebyollin/sdxl-vae-fp16-fix).
                </li>
                <li>
                  <strong>Overfit khi fine-tune:</strong> LoRA/DreamBooth dễ học thuộc vài ảnh →
                  bị "memorise" (vi phạm bản quyền). Dùng augmentation, prior preservation loss,
                  rank LoRA nhỏ (8–16).
                </li>
                <li>
                  <strong>Ignoring prompt weighting syntax:</strong> mỗi pipeline có cú pháp khác
                  nhau — <code>(word:1.3)</code> trong Automatic1111, <code>word++</code> trong
                  ComfyUI. Học cú pháp đúng cho tool đang dùng.
                </li>
                <li>
                  <strong>Latent leak giữa concept:</strong> khi training custom model trên dataset
                  nhỏ, embedding bị "đa nghĩa" (token gốc + concept mới). Dùng token mới
                  (rare-token) thay vì override token có sẵn.
                </li>
              </ul>

              <Callout variant="info" title="Diffusion tại Việt Nam">
                Cộng đồng Vietnam Diffusion đã fine-tune nhiều model chuyên biệt: ảnh áo dài, món
                ăn Việt, kiến trúc đô thị Hà Nội-Sài Gòn. Các công ty như Vingroup, FPT, VNG dùng
                SDXL + ControlNet cho marketing, nội thất, game art. VCCorp phát triển pipeline
                kết hợp diffusion + <TopicLink slug="clip">CLIP</TopicLink> để tìm kiếm ảnh
                semantic. Tham khảo thêm bài{" "}
                <TopicLink slug="text-to-image">text-to-image</TopicLink> và{" "}
                <TopicLink slug="u-net">U-Net</TopicLink> để hiểu chi tiết hơn về các thành phần.
              </Callout>
            </ExplanationSection>
          </LessonSection>

          {/* ═══ STEP 6: MINI SUMMARY (6 điểm) ════════════════════════ */}
          <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
            <MiniSummary
              points={[
                "Forward Process thêm nhiễu Gaussian theo β_t schedule; sau T bước, x_T ≈ 𝒩(0, I) — nhiễu thuần.",
                "Reverse Process dùng U-Net dự đoán ε (MSE loss đơn giản); sample lặp lại từ nhiễu về ảnh có nghĩa.",
                "DDPM stochastic, 1000 step; DDIM non-Markovian, deterministic khi η=0, chỉ cần 20–50 step — production chuẩn.",
                "Classifier-Free Guidance: ε̂ = ε_uncond + w·(ε_cond − ε_uncond). Sweet spot w ≈ 5–9; quá cao gây oversaturation.",
                "Stable Diffusion = VAE (nén 512→64) + U-Net (diffusion trên latent) + Text Encoder (CLIP/T5 + cross-attention).",
                "Chất lượng cao, không mode collapse, dễ điều kiện hoá — nhưng chậm hơn GAN. DPM-Solver, LCM, SDXL Turbo đang đóng gap tốc độ.",
              ]}
            />
          </LessonSection>

          {/* ═══ STEP 7: QUIZ (8 câu) ═════════════════════════════════ */}
          <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
            <QuizSection questions={quizQuestions} />
          </LessonSection>
    </>
  );
}
