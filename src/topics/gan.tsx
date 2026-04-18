"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

/* ============================================================
 * METADATA
 * ============================================================ */
export const metadata: TopicMeta = {
  slug: "gan",
  title: "Generative Adversarial Network",
  titleVi: "Mạng đối sinh",
  description:
    "Hai mạng cạnh tranh: Generator tạo dữ liệu giả, Discriminator phân biệt thật/giả",
  category: "dl-architectures",
  tags: ["generative", "unsupervised-learning", "adversarial"],
  difficulty: "advanced",
  relatedSlugs: ["vae", "autoencoder", "diffusion-models"],
  vizType: "interactive",
};

const TOTAL_STEPS = 10;

/* ============================================================
 * 8x8 PIXEL ART PATTERNS
 * Used across the hook visualization so the user can play the
 * role of the Discriminator and see the Generator improve.
 * ============================================================ */
const HEART: number[] = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0,
  0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];
const STAR: number[] = [
  0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0,
  0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1,
  0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0,
  0, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 1, 1,
];
const ARROW: number[] = [
  0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0,
  0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1,
  0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0,
  0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0,
];
const CROSS: number[] = [
  0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0,
  0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0,
  0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0,
];

const PATTERNS = [HEART, STAR, ARROW, CROSS];
const PAT_COLORS = ["#ec4899", "#f59e0b", "#3b82f6", "#22c55e"];
const PAT_NAMES = ["tim", "sao", "mũi tên", "dấu cộng"];
const ROUNDS = 8;

/* Helper: degrade a real pattern to make a fake with diminishing noise */
function makeFake(real: number[], round: number, seed: number): number[] {
  const noise = 1 - (round / (ROUNDS - 1)) * 0.85;
  return real.map((v, i) => {
    const h = ((seed * 31 + i * 17) % 100) / 100;
    return h < noise ? (h > 0.5 ? 1 : 0) : v;
  });
}

function seededBool(round: number, salt: number): boolean {
  return ((round * 7 + salt * 13) % 10) >= 5;
}

/* ============================================================
 * PixelGrid — renders an 8x8 pattern as SVG
 * ============================================================ */
function PixelGrid({
  data,
  color,
  size = 160,
  label,
}: {
  data: number[];
  color: string;
  size?: number;
  label?: string;
}) {
  const c = size / 8;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="rounded-lg border border-border bg-background"
      >
        {data.map((v, i) => (
          <rect
            key={i}
            x={(i % 8) * c}
            y={Math.floor(i / 8) * c}
            width={c - 1}
            height={c - 1}
            rx={2}
            fill={v ? color : "var(--bg-surface)"}
            opacity={v ? 0.85 : 0.25}
          />
        ))}
      </svg>
      {label && <span className="text-xs text-muted font-medium">{label}</span>}
    </div>
  );
}

/* ============================================================
 * QUIZ QUESTIONS — 8 total
 * ============================================================ */
const quizQuestions: QuizQuestion[] = [
  {
    question: "Trong GAN, Generator nhận đầu vào là gì?",
    options: [
      "Ảnh thật từ tập dữ liệu",
      "Vector nhiễu ngẫu nhiên z",
      "Kết quả từ Discriminator",
      "Label của ảnh",
    ],
    correct: 1,
    explanation:
      "Generator nhận vector nhiễu z ~ N(0,1) và biến đổi nó thành dữ liệu giả. Nó không bao giờ thấy ảnh thật — chỉ học gián tiếp qua gradient từ Discriminator.",
  },
  {
    question: "Khi GAN đạt cân bằng Nash, Discriminator cho kết quả gì?",
    options: [
      "Luôn nói 'thật'",
      "Luôn nói 'giả'",
      "Xác suất 0.5 cho mọi ảnh",
      "Không chạy được nữa",
    ],
    correct: 2,
    explanation:
      "Khi Generator hoàn hảo, Discriminator không thể phân biệt thật/giả nên cho xác suất 0.5 — tương đương đoán ngẫu nhiên.",
  },
  {
    question: "Diffusion Models đang dần thay thế GAN vì lý do gì?",
    options: [
      "Chạy nhanh hơn GAN",
      "Huấn luyện ổn định hơn, đa dạng hơn, không bị mode collapse",
      "Dùng ít dữ liệu hơn",
      "Không cần GPU",
    ],
    correct: 1,
    explanation:
      "Diffusion Models huấn luyện ổn định hơn (không cần cân bằng 2 mạng), tạo ảnh đa dạng hơn (không bị mode collapse), và cho chất lượng tốt hơn ở nhiều tác vụ.",
  },
  {
    type: "fill-blank" as const,
    question:
      "GAN gồm hai mạng đối kháng: {blank} (tạo dữ liệu giả từ noise z) và {blank} (phân biệt thật/giả). Khi cân bằng Nash, mạng phân biệt chỉ đoán ngẫu nhiên 50/50.",
    blanks: [
      { answer: "Generator", accept: ["generator", "G", "mạng sinh"] },
      {
        answer: "Discriminator",
        accept: ["discriminator", "D", "mạng phân biệt"],
      },
    ],
    explanation:
      "Generator (G) biến vector nhiễu z ~ N(0,1) thành dữ liệu giả. Discriminator (D) là bộ phân loại thật/giả. Hai mạng tham gia trò chơi minimax: min_G max_D V(D,G). Cân bằng Nash: D(x) = 0.5 cho mọi x.",
  },
  {
    question:
      "Mode collapse trong GAN là hiện tượng gì?",
    options: [
      "Generator học quá chậm",
      "Generator chỉ tạo ra một vài mẫu giống nhau, thiếu đa dạng",
      "Discriminator không hội tụ",
      "Mô hình tiêu tốn nhiều GPU",
    ],
    correct: 1,
    explanation:
      "Mode collapse xảy ra khi Generator 'lười' học — tìm được một vài mẫu có thể lừa Discriminator và lặp lại mãi. Kết quả: ảnh tạo ra thiếu đa dạng dù loss trông ổn.",
  },
  {
    question:
      "Điều gì khiến WGAN ổn định hơn GAN gốc?",
    options: [
      "Dùng nhiều GPU hơn",
      "Thay binary cross-entropy bằng Wasserstein distance và weight clipping / gradient penalty",
      "Không cần Discriminator",
      "Dùng autoencoder thay cho Generator",
    ],
    correct: 1,
    explanation:
      "WGAN đo khoảng cách Wasserstein giữa phân phối thật và giả — loss mượt hơn, gradient không bị vanish, và mode collapse hiếm xảy ra hơn nhiều.",
  },
  {
    question:
      "Trong cGAN (Conditional GAN), tại sao ta đưa thêm label y vào Generator và Discriminator?",
    options: [
      "Để tăng số tham số",
      "Để điều khiển được loại ảnh sinh ra theo class label",
      "Để bỏ qua vector nhiễu",
      "Để ảnh nhỏ hơn",
    ],
    correct: 1,
    explanation:
      "cGAN học p(x | y). Đưa label y vào cả G và D giúp ta nói 'tạo cho tôi một ảnh số 7' hoặc 'tạo ảnh chó' — sinh có điều kiện, rất hữu ích cho ứng dụng thực tế.",
  },
  {
    question:
      "Đi dạo trong latent space (latent space walk) của StyleGAN cho ta thấy điều gì?",
    options: [
      "Ảnh bị nhiễu ngẫu nhiên",
      "Các ảnh láng giềng thay đổi mượt mà theo chiều đi — Generator đã học được manifold có ý nghĩa",
      "Discriminator bị sai",
      "Tập dữ liệu gốc",
    ],
    correct: 1,
    explanation:
      "Một latent tốt có tính liên tục: dịch chuyển z nhỏ → ảnh thay đổi nhỏ. StyleGAN còn disentangle các chiều (tuổi, nụ cười, giới tính) nên ta có thể chỉnh từng thuộc tính.",
  },
];

/* ============================================================
 * LATENT SPACE GENERATOR
 * Fake but plausible — lerp between two PATTERNS using noise
 * ============================================================ */
function lerpPattern(a: number[], b: number[], t: number, jitter: number) {
  const result = new Array(64).fill(0);
  for (let i = 0; i < 64; i++) {
    const mixed = a[i] * (1 - t) + b[i] * t;
    const j = ((i * 97 + Math.floor(t * 1000)) % 100) / 100;
    const noise = (j - 0.5) * jitter;
    result[i] = mixed + noise > 0.5 ? 1 : 0;
  }
  return result;
}

/* ============================================================
 * MODE COLLAPSE DATASET
 * "real" modes = 4 clusters on a 2D plane; generator either
 * covers all (healthy) or collapses to one (mode collapse).
 * ============================================================ */
const MODES_2D: { x: number; y: number; color: string; name: string }[] = [
  { x: 30, y: 30, color: "#3b82f6", name: "A" },
  { x: 130, y: 30, color: "#ec4899", name: "B" },
  { x: 30, y: 130, color: "#22c55e", name: "C" },
  { x: 130, y: 130, color: "#f59e0b", name: "D" },
];

function sampleCluster(cx: number, cy: number, n: number, seed: number) {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const a = ((seed * 53 + i * 17) % 628) / 100;
    const r = (((seed * 31 + i * 41) % 100) / 100) * 14 + 2;
    pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
  return pts;
}

function ModeCollapseViz({
  collapsed,
  t,
}: {
  collapsed: boolean;
  t: number;
}) {
  const realPts = useMemo(() => {
    return MODES_2D.flatMap((m, idx) =>
      sampleCluster(m.x, m.y, 18, idx * 7 + 3).map((p) => ({
        ...p,
        color: m.color,
      }))
    );
  }, []);

  const genPts = useMemo(() => {
    if (collapsed) {
      // all samples around one mode (B)
      return sampleCluster(130, 30, 72, Math.floor(t * 10) + 11).map((p) => ({
        ...p,
        color: "#9ca3af",
      }));
    }
    // healthy: cover all 4
    return MODES_2D.flatMap((m, idx) =>
      sampleCluster(m.x, m.y, 18, idx * 13 + Math.floor(t * 10) + 5).map(
        (p) => ({ ...p, color: "#9ca3af" })
      )
    );
  }, [collapsed, t]);

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-xl border border-border bg-background p-2">
        <p className="text-xs text-muted text-center mb-1">
          Dữ liệu thật (4 modes)
        </p>
        <svg viewBox="0 0 160 160" className="w-full h-auto">
          {realPts.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={p.color} opacity={0.8} />
          ))}
        </svg>
      </div>
      <div className="rounded-xl border border-border bg-background p-2">
        <p className="text-xs text-muted text-center mb-1">
          {collapsed ? "Generator bị collapse (1 mode)" : "Generator khỏe mạnh"}
        </p>
        <svg viewBox="0 0 160 160" className="w-full h-auto">
          {MODES_2D.map((m, idx) => (
            <circle
              key={idx}
              cx={m.x}
              cy={m.y}
              r={18}
              fill="none"
              stroke={m.color}
              strokeDasharray="2 3"
              opacity={0.35}
            />
          ))}
          {genPts.map((p, i) => (
            <motion.circle
              key={i}
              initial={false}
              animate={{ cx: p.x, cy: p.y }}
              transition={{ duration: 0.5 }}
              r={2.5}
              fill={p.color}
              opacity={0.85}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}

/* ============================================================
 * LOSS CURVE — oscillating G/D losses
 * ============================================================ */
function lossSeries(steps: number) {
  const gen: number[] = [];
  const disc: number[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    // discriminator loss: starts low, climbs, oscillates around 0.69 (log 2)
    const dOsc = Math.sin(i * 0.35) * 0.08 * (1 - t * 0.5);
    const d = 0.25 + t * 0.4 + dOsc;
    // generator loss: starts high, falls, oscillates (anti-correlated)
    const gOsc = -Math.sin(i * 0.35) * 0.12 * (1 - t * 0.4);
    const g = 1.9 - t * 1.1 + gOsc;
    gen.push(Math.max(0.2, g));
    disc.push(Math.max(0.1, Math.min(0.95, d)));
  }
  return { gen, disc };
}

function LossCurve({ step, total }: { step: number; total: number }) {
  const { gen, disc } = useMemo(() => lossSeries(total), [total]);
  const W = 360;
  const H = 180;
  const pad = 28;
  const plotW = W - pad * 2;
  const plotH = H - pad * 2;
  const yMax = 2.2;
  const toPath = (series: number[], upto: number) => {
    return series
      .slice(0, upto + 1)
      .map((v, i) => {
        const x = pad + (i / (total - 1)) * plotW;
        const y = pad + plotH - (v / yMax) * plotH;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {/* grid */}
      <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="var(--color-border)" />
      <line
        x1={pad}
        y1={H - pad}
        x2={W - pad}
        y2={H - pad}
        stroke="var(--color-border)"
      />
      <line
        x1={pad}
        y1={pad + plotH / 2}
        x2={W - pad}
        y2={pad + plotH / 2}
        stroke="var(--color-border)"
        strokeDasharray="2 3"
        opacity={0.4}
      />
      {/* axes labels */}
      <text x={pad - 4} y={pad + 4} fontSize="9" textAnchor="end" fill="currentColor" opacity={0.6}>
        loss
      </text>
      <text x={W - pad} y={H - pad + 14} fontSize="9" textAnchor="end" fill="currentColor" opacity={0.6}>
        step
      </text>
      {/* G curve */}
      <path
        d={toPath(gen, step)}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={2}
      />
      {/* D curve */}
      <path
        d={toPath(disc, step)}
        fill="none"
        stroke="#ef4444"
        strokeWidth={2}
      />
      {/* legend */}
      <g transform={`translate(${W - pad - 120}, ${pad + 4})`}>
        <rect width="120" height="28" rx="4" fill="var(--bg-card)" opacity={0.8} />
        <circle cx={10} cy={10} r={3} fill="#3b82f6" />
        <text x={18} y={13} fontSize="9" fill="currentColor">Generator loss</text>
        <circle cx={10} cy={22} r={3} fill="#ef4444" />
        <text x={18} y={25} fontSize="9" fill="currentColor">Discriminator loss</text>
      </g>
    </svg>
  );
}

/* ============================================================
 * CONDITIONAL GAN DEMO
 * Pick a class label — generator outputs pixel art of that class
 * ============================================================ */
function CGanDemo() {
  const [label, setLabel] = useState(0);
  const [seed, setSeed] = useState(3);
  const pattern = PATTERNS[label];
  const fake = useMemo(() => {
    // produce a "nearly real" sample at high training step
    return makeFake(pattern, ROUNDS - 2, seed);
  }, [pattern, seed]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {PAT_NAMES.map((n, i) => (
          <button
            key={n}
            type="button"
            onClick={() => setLabel(i)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
              label === i
                ? "border-accent bg-accent text-white"
                : "border-border bg-card text-foreground hover:bg-surface"
            }`}
          >
            Lớp: {n}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-center gap-4 flex-wrap">
        <div className="rounded-lg border border-border bg-card px-3 py-2 text-center">
          <p className="text-xs text-muted mb-1">Nhiễu z</p>
          <p className="font-mono text-sm text-foreground">z ~ N(0,1)</p>
        </div>
        <span className="text-muted">+</span>
        <div className="rounded-lg border border-border bg-card px-3 py-2 text-center">
          <p className="text-xs text-muted mb-1">Label y</p>
          <p className="font-mono text-sm text-foreground">y = {label}</p>
          <p className="text-xs text-muted mt-0.5">({PAT_NAMES[label]})</p>
        </div>
        <span className="text-accent font-bold">&rarr;</span>
        <div className="rounded-lg border-2 border-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 text-center">
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400">cG</p>
          <p className="text-xs text-blue-500">Conditional</p>
          <p className="text-xs text-blue-500">Generator</p>
        </div>
        <span className="text-accent font-bold">&rarr;</span>
        <PixelGrid
          data={fake}
          color={PAT_COLORS[label]}
          size={80}
          label="Ảnh sinh ra"
        />
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setSeed((s) => s + 1)}
          className="rounded-xl border border-border px-4 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface"
        >
          Lấy mẫu z mới
        </button>
      </div>

      <p className="text-xs text-muted text-center leading-relaxed">
        cGAN học phân phối có điều kiện <LaTeX>{"p(x \\mid y)"}</LaTeX>. Giữ nguyên y, đổi z → cùng loại, khác chi tiết. Đổi y →
        sang lớp khác.
      </p>
    </div>
  );
}

/* ============================================================
 * STYLEGAN LATENT WALK
 * ============================================================ */
function LatentWalk() {
  const [t, setT] = useState(0);
  const [from, setFrom] = useState(0);
  const [to, setTo] = useState(1);
  const [jitter, setJitter] = useState(0.15);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => {
      setT((prev) => {
        const next = prev + 0.04;
        if (next >= 1) return 0;
        return next;
      });
    }, 60);
    return () => clearInterval(iv);
  }, [playing]);

  const pattern = useMemo(
    () => lerpPattern(PATTERNS[from], PATTERNS[to], t, jitter),
    [from, to, t, jitter]
  );
  const color = useMemo(() => {
    // simple color interpolation between two hex
    const a = PAT_COLORS[from];
    const b = PAT_COLORS[to];
    const toRgb = (h: string) => [
      parseInt(h.slice(1, 3), 16),
      parseInt(h.slice(3, 5), 16),
      parseInt(h.slice(5, 7), 16),
    ];
    const ca = toRgb(a);
    const cb = toRgb(b);
    const m = ca.map((v, i) => Math.round(v * (1 - t) + cb[i] * t));
    return `rgb(${m[0]}, ${m[1]}, ${m[2]})`;
  }, [from, to, t]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3 items-center">
        <div className="flex flex-col items-center gap-1">
          <PixelGrid data={PATTERNS[from]} color={PAT_COLORS[from]} size={80} />
          <p className="text-xs text-muted">z_start</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <motion.div
            key={`${from}-${to}-${t.toFixed(2)}`}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            <PixelGrid data={pattern} color={color} size={100} />
          </motion.div>
          <p className="text-xs text-muted">
            z(t), t = {t.toFixed(2)}
          </p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <PixelGrid data={PATTERNS[to]} color={PAT_COLORS[to]} size={80} />
          <p className="text-xs text-muted">z_end</p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted flex items-center justify-between">
          <span>Vị trí đi dạo t</span>
          <span className="font-mono text-foreground">{t.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={t}
          onChange={(e) => {
            setT(Number(e.target.value));
            setPlaying(false);
          }}
          className="w-full accent-accent"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted flex items-center justify-between">
          <span>Nhiễu phong cách (style jitter)</span>
          <span className="font-mono text-foreground">{jitter.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={0.4}
          step={0.01}
          value={jitter}
          onChange={(e) => setJitter(Number(e.target.value))}
          className="w-full accent-accent"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-muted">Từ:</span>
          {PATTERNS.map((_, i) => (
            <button
              key={`from-${i}`}
              type="button"
              onClick={() => setFrom(i)}
              disabled={i === to}
              className={`rounded-md px-2 py-0.5 text-[11px] border transition-colors ${
                from === i
                  ? "border-accent bg-accent text-white"
                  : "border-border bg-card text-foreground disabled:opacity-30"
              }`}
            >
              {PAT_NAMES[i]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-muted">Tới:</span>
          {PATTERNS.map((_, i) => (
            <button
              key={`to-${i}`}
              type="button"
              onClick={() => setTo(i)}
              disabled={i === from}
              className={`rounded-md px-2 py-0.5 text-[11px] border transition-colors ${
                to === i
                  ? "border-accent bg-accent text-white"
                  : "border-border bg-card text-foreground disabled:opacity-30"
              }`}
            >
              {PAT_NAMES[i]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          {playing ? "Dừng" : "Đi dạo tự động"}
        </button>
      </div>

      <p className="text-xs text-muted text-center leading-relaxed">
        StyleGAN học một latent space &quot;disentangled&quot;: mỗi chiều kiểm soát một
        thuộc tính. Đi dạo mượt ở đây tương ứng với nội suy khuôn mặt, tuổi, hay
        phong cách trong các mô hình thực tế.
      </p>
    </div>
  );
}

/* ============================================================
 * DCGAN vs WGAN COMPARISON
 * ============================================================ */
const VARIANT_DATA = [
  {
    name: "DCGAN",
    loss: "Binary cross-entropy",
    lossFormula: "\\min_G \\max_D \\; \\mathbb{E}[\\log D(x)] + \\mathbb{E}[\\log(1 - D(G(z)))]",
    stability: 35,
    quality: 65,
    diversity: 45,
    speed: 90,
    collapse: "Thường xuyên",
    note: "Baseline mạnh, đơn giản, dùng CNN thay FC layers. Hay bị mode collapse và unstable training.",
  },
  {
    name: "WGAN (GP)",
    loss: "Wasserstein + Gradient Penalty",
    lossFormula:
      "\\min_G \\max_D \\; \\mathbb{E}[D(x)] - \\mathbb{E}[D(G(z))] + \\lambda \\, \\mathbb{E}[(\\|\\nabla D\\| - 1)^2]",
    stability: 85,
    quality: 80,
    diversity: 85,
    speed: 70,
    collapse: "Hiếm",
    note: "Wasserstein distance cho loss landscape mượt, gradient không vanish. Chậm hơn chút nhưng ổn định hơn hẳn.",
  },
];

function VariantBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 text-[11px] text-muted shrink-0">{label}</span>
      <div className="flex-1 h-2.5 rounded-full bg-surface overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6 }}
        />
      </div>
      <span className="w-8 text-[11px] font-mono text-foreground text-right">
        {value}
      </span>
    </div>
  );
}

function DcganVsWgan() {
  const [active, setActive] = useState<0 | 1>(0);
  const v = VARIANT_DATA[active];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 justify-center">
        {VARIANT_DATA.map((vv, i) => (
          <button
            key={vv.name}
            type="button"
            onClick={() => setActive(i as 0 | 1)}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold border transition-colors ${
              active === i
                ? "border-accent bg-accent text-white"
                : "border-border bg-card text-foreground hover:bg-surface"
            }`}
          >
            {vv.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <p className="text-sm font-semibold text-foreground">{v.name}</p>
          <p className="text-xs text-muted">Loss: {v.loss}</p>
          <div className="rounded-md bg-surface p-2 overflow-x-auto">
            <LaTeX block>{v.lossFormula}</LaTeX>
          </div>
          <p className="text-xs text-muted mt-2">
            Mode collapse: <span className="font-semibold text-foreground">{v.collapse}</span>
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <p className="text-sm font-semibold text-foreground mb-2">So sánh chỉ số</p>
          <VariantBar label="Stability" value={v.stability} color="#22c55e" />
          <VariantBar label="Quality" value={v.quality} color="#3b82f6" />
          <VariantBar label="Diversity" value={v.diversity} color="#a855f7" />
          <VariantBar label="Speed" value={v.speed} color="#f59e0b" />
        </div>
      </div>

      <p className="text-xs text-muted leading-relaxed text-center">{v.note}</p>
    </div>
  );
}

/* ============================================================
 * MAIN COMPONENT
 * ============================================================ */
export default function GanTopic() {
  // ---- Game state (original hook) ----
  const [gameRound, setGameRound] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [scores, setScores] = useState<(boolean | null)[]>(() =>
    Array(ROUNDS).fill(null)
  );
  const [picked, setPicked] = useState<"left" | "right" | null>(null);

  // ---- Training simulation ----
  const [trainStep, setTrainStep] = useState(0);
  const [trainRunning, setTrainRunning] = useState(false);

  // ---- Loss curve simulation ----
  const TOTAL_LOSS_STEPS = 40;
  const [lossStep, setLossStep] = useState(4);
  const [lossAuto, setLossAuto] = useState(false);

  useEffect(() => {
    if (!lossAuto) return;
    const iv = setInterval(() => {
      setLossStep((s) => {
        if (s >= TOTAL_LOSS_STEPS - 1) {
          setLossAuto(false);
          return s;
        }
        return s + 1;
      });
    }, 150);
    return () => clearInterval(iv);
  }, [lossAuto]);

  // ---- Mode collapse state ----
  const [collapsed, setCollapsed] = useState(true);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setTick((v) => v + 1), 800);
    return () => clearInterval(iv);
  }, []);

  // ---- Derived state ----
  const rd = useMemo(() => {
    const pi = gameRound % PATTERNS.length;
    const real = PATTERNS[pi];
    const fake = makeFake(real, gameRound, gameRound * 37 + 11);
    const realLeft = seededBool(gameRound, 42);
    return { real, fake, realLeft, color: PAT_COLORS[pi], pi };
  }, [gameRound]);

  const realSide = rd.realLeft ? "left" : "right";

  const handlePick = useCallback(
    (side: "left" | "right") => {
      if (picked !== null) return;
      setPicked(side);
      setScores((prev) => {
        const n = [...prev];
        n[gameRound] = side !== realSide;
        return n;
      });
    },
    [picked, realSide, gameRound]
  );

  const handleNext = useCallback(() => {
    if (gameRound < ROUNDS - 1) {
      setGameRound((r) => r + 1);
      setPicked(null);
    } else {
      setGameFinished(true);
    }
  }, [gameRound]);

  const handleReset = useCallback(() => {
    setGameRound(0);
    setGameStarted(false);
    setGameFinished(false);
    setScores(Array(ROUNDS).fill(null));
    setPicked(null);
  }, []);

  const stats = useMemo(() => {
    const pct = (arr: (boolean | null)[]) => {
      const valid = arr.filter((s): s is boolean => s !== null);
      return valid.length === 0
        ? null
        : Math.round(
            (valid.filter(Boolean).length / valid.length) * 100
          );
    };
    return {
      early: pct(scores.slice(0, 3)),
      mid: pct(scores.slice(3, 5)),
      late: pct(scores.slice(5, 8)),
    };
  }, [scores]);

  const totalCorrect = scores.filter((s) => s === true).length;
  const genQ = Math.min(95, 20 + trainStep * 15);
  const discA = Math.max(52, 95 - trainStep * 8);

  const handleTrain = useCallback(() => {
    if (trainRunning) return;
    setTrainRunning(true);
    setTrainStep((s) => Math.min(s + 1, 5));
    setTimeout(() => setTrainRunning(false), 600);
  }, [trainRunning]);

  const gridBtn = (side: "left" | "right") => {
    const isReal = (side === "left") === rd.realLeft;
    const data = isReal ? rd.real : rd.fake;
    const cls =
      picked === null
        ? "border-transparent hover:border-accent/50 cursor-pointer"
        : picked === side
          ? picked !== realSide
            ? "border-green-500 bg-green-50 dark:bg-green-900/20"
            : "border-red-400 bg-red-50 dark:bg-red-900/20"
          : !isReal
            ? "border-green-500/40"
            : "border-transparent opacity-60";
    return (
      <button
        type="button"
        onClick={() => handlePick(side)}
        disabled={picked !== null}
        className={`rounded-xl p-3 border-2 transition-all ${cls}`}
      >
        <PixelGrid
          data={data}
          color={rd.color}
          label={side === "left" ? "Ảnh A" : "Ảnh B"}
        />
      </button>
    );
  };

  return (
    <>
      {/* ═══════════════════════════════════════════════════════
          STEP 1 — HOOK
          ═══════════════════════════════════════════════════════ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <ProgressSteps current={1} total={TOTAL_STEPS} />
        <div className="mt-4">
          <PredictionGate
            question="Bạn nhìn 2 bức tranh. Một do hoạ sĩ vẽ, một do AI tạo. Bạn có thể phân biệt không?"
            options={[
              "Dễ, AI vẽ xấu lắm",
              "Khó lắm, AI vẽ giống thật rồi",
              "Không thể vì AI giỏi hơn người",
            ]}
            correct={1}
            explanation="AI sinh ảnh ngày nay rất giỏi — nhờ GAN, nơi AI 'giả mạo' và AI 'thám tử' cạnh tranh nhau!"
          >
            <p className="text-sm text-foreground/90 leading-relaxed">
              Bài học này sẽ đưa bạn vào vai trò của
              <strong> Discriminator</strong>: một thám tử phải phân biệt ảnh
              thật và ảnh giả. Qua 8 vòng chơi, bạn sẽ cảm nhận được điều mà một
              mạng neural thực sự đối mặt — đối thủ ngày càng tinh vi hơn.
            </p>
          </PredictionGate>
        </div>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════
          STEP 2 — DISCOVER (User IS the Discriminator)
          ═══════════════════════════════════════════════════════ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Chơi làm Discriminator">
        <VisualizationSection topicSlug={metadata.slug}>
          {!gameStarted && !gameFinished && (
            <div className="text-center space-y-4">
              <p className="text-sm text-foreground leading-relaxed">
                Bạn sắp đóng vai <strong>Discriminator</strong> — thám tử phân
                biệt thật/giả.
                <br />
                Mỗi vòng bạn thấy 2 bức pixel art. Hãy chọn bức nào là{" "}
                <strong>giả</strong>!
              </p>
              <p className="text-xs text-muted">
                Qua 8 vòng, Generator sẽ ngày càng giỏi hơn. Bạn có giữ được độ
                chính xác?
              </p>
              <button
                type="button"
                onClick={() => setGameStarted(true)}
                className="rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Bắt đầu thử thách
              </button>
            </div>
          )}

          {gameStarted && !gameFinished && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                  Vòng {gameRound + 1}/{ROUNDS}
                </span>
                <div className="flex gap-1">
                  {scores.map((s, i) => (
                    <div
                      key={i}
                      className={`h-2 w-5 rounded-full transition-colors ${
                        s === null
                          ? "bg-surface"
                          : s
                            ? "bg-green-500"
                            : "bg-red-400"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <p className="text-xs text-muted text-center">
                {gameRound < 2
                  ? "Generator mới bắt đầu học — dễ phát hiện"
                  : gameRound < 5
                    ? "Generator đang cải thiện..."
                    : "Generator gần hoàn hảo — rất khó phân biệt!"}
              </p>

              <div className="flex items-center justify-center gap-6 flex-wrap">
                {gridBtn("left")}
                <span className="text-muted text-lg font-bold">vs</span>
                {gridBtn("right")}
              </div>

              <p className="text-center text-sm font-medium text-accent">
                Nhấn vào ảnh bạn nghĩ là <strong>GIẢ</strong>
              </p>

              <AnimatePresence>
                {picked !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-3"
                  >
                    <p
                      className={`text-sm font-semibold ${
                        picked !== realSide
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-500"
                      }`}
                    >
                      {picked !== realSide
                        ? "Chính xác! Bạn phát hiện được ảnh giả."
                        : `Sai rồi! Ảnh ${
                            realSide === "left" ? "A" : "B"
                          } mới là ảnh thật (hình ${PAT_NAMES[rd.pi]}).`}
                    </p>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    >
                      {gameRound < ROUNDS - 1 ? "Vòng tiếp" : "Xem kết quả"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {gameFinished && (
            <div className="space-y-5">
              <div className="text-center">
                <p className="text-2xl font-bold text-accent">
                  {totalCorrect}/{ROUNDS}
                </p>
                <p className="text-sm text-muted">câu đúng</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                {(
                  [
                    ["early", "Vòng 1-3", "text-green-600 dark:text-green-400"],
                    ["mid", "Vòng 4-5", "text-amber-600 dark:text-amber-400"],
                    ["late", "Vòng 6-8", "text-red-500"],
                  ] as const
                ).map(([key, label, cls]) => (
                  <div key={key} className="rounded-xl border border-border p-3">
                    <p className={`text-lg font-bold ${cls}`}>
                      {stats[key] ?? "—"}%
                    </p>
                    <p className="text-xs text-muted">{label}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-foreground text-center leading-relaxed">
                Generator ngày càng giỏi hơn, bạn (Discriminator) ngày càng khó
                phân biệt!
                <br />
                Đây chính là cách GAN hoạt động.
              </p>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-xl border border-border px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface"
                >
                  Chơi lại
                </button>
              </div>
            </div>
          )}
        </VisualizationSection>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════
          STEP 3 — AHA MOMENT
          ═══════════════════════════════════════════════════════ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc vỡ lẽ">
        <AhaMoment>
          <p>
            Bạn vừa đóng vai <strong>Discriminator</strong> trong một{" "}
            <strong>GAN</strong>! Generator tạo ảnh giả, Discriminator (bạn) cố
            phân biệt. Hai bên cạnh tranh &rarr; ảnh giả ngày càng thật!
          </p>
        </AhaMoment>

        <div className="mt-4">
          <Callout variant="info" title="Mẹo quan trọng">
            GAN không cần nhãn thật/giả do con người gắn — nó{" "}
            <strong>tự sinh</strong> nhãn: mọi thứ G tạo ra đều là &quot;giả&quot;, mọi thứ
            từ tập dữ liệu đều là &quot;thật&quot;. Đây là lý do GAN được xếp vào học
            không giám sát (unsupervised).
          </Callout>
        </div>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════
          STEP 4 — TRAINING DYNAMICS + LOSS CURVE
          ═══════════════════════════════════════════════════════ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Loss dao động">
        <h3 className="text-base font-semibold text-foreground mb-2">
          Hai đường loss dao động quanh điểm cân bằng
        </h3>
        <p className="text-sm text-muted mb-3">
          Không giống mạng bình thường (loss chỉ giảm), GAN có 2 mạng chơi tay
          đôi. Khi D giỏi hơn, loss G tăng. Khi G giỏi hơn, loss D tăng. Cuối
          cùng cả hai dao động gần đường log 2 ≈ 0.69.
        </p>

        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <LossCurve step={lossStep} total={TOTAL_LOSS_STEPS} />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setLossStep((s) => Math.max(0, s - 1))
                }
                className="rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-surface"
              >
                ← Lùi
              </button>
              <button
                type="button"
                onClick={() =>
                  setLossStep((s) => Math.min(TOTAL_LOSS_STEPS - 1, s + 1))
                }
                className="rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-surface"
              >
                Tiến →
              </button>
            </div>
            <div className="flex-1">
              <input
                type="range"
                min={0}
                max={TOTAL_LOSS_STEPS - 1}
                value={lossStep}
                onChange={(e) => setLossStep(Number(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (lossStep >= TOTAL_LOSS_STEPS - 1) setLossStep(0);
                setLossAuto((a) => !a);
              }}
              className="rounded-md bg-accent px-3 py-1 text-xs font-semibold text-white"
            >
              {lossAuto ? "⏸" : "▶"}
            </button>
          </div>
          <p className="text-xs text-muted text-center">
            Step {lossStep + 1}/{TOTAL_LOSS_STEPS} — quan sát 2 đường dao động
            ngược pha.
          </p>
        </div>

        <div className="mt-4">
          <Callout variant="warning" title="Dấu hiệu bệnh lý">
            Nếu <em>loss D đi về 0</em> và <em>loss G tăng vô hạn</em>: D đã
            quá mạnh, gradient về G biến mất. Nếu cả hai <em>đứng yên quá
            sớm</em>: rất có thể G đã <strong>mode collapse</strong>.
          </Callout>
        </div>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════
          STEP 5 — MODE COLLAPSE
          ═══════════════════════════════════════════════════════ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Mode collapse">
        <h3 className="text-base font-semibold text-foreground mb-2">
          Khi Generator chọn đường &quot;dễ&quot; — mode collapse
        </h3>
        <p className="text-sm text-muted mb-3">
          Nếu G tìm được một mẫu nào đó lừa được D, nó có thể &quot;lười&quot; và sinh
          mẫu đó mãi. Dữ liệu thật có 4 modes (cụm), nhưng G chỉ phủ 1 — thiếu
          đa dạng hoàn toàn.
        </p>

        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <ModeCollapseViz collapsed={collapsed} t={tick} />
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className={`rounded-lg px-4 py-1.5 text-xs font-medium border transition-colors ${
                collapsed
                  ? "border-red-400 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                  : "border-border bg-card text-foreground hover:bg-surface"
              }`}
            >
              Collapsed
            </button>
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className={`rounded-lg px-4 py-1.5 text-xs font-medium border transition-colors ${
                !collapsed
                  ? "border-green-400 bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                  : "border-border bg-card text-foreground hover:bg-surface"
              }`}
            >
              Healthy
            </button>
          </div>
          <p className="text-xs text-muted text-center leading-relaxed">
            Các chấm xám là mẫu Generator sinh. Khi healthy, chúng phủ đều 4
            vòng; khi collapsed, tất cả tập trung về một vòng.
          </p>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <CollapsibleDetail title="Tại sao mode collapse lại xảy ra?">
            <ul className="list-disc list-inside space-y-1 text-sm text-foreground/90">
              <li>
                Cân bằng minimax rất bất ổn — G có thể kẹt ở &quot;điểm chiến thắng
                cục bộ&quot; (chỉ cần lừa D một pattern).
              </li>
              <li>
                Learning rate G quá cao → G nhảy sang 1 mode rồi bỏ quên phần
                còn lại.
              </li>
              <li>
                D không đủ mạnh hoặc cập nhật quá chậm — nó không phạt được G
                khi bỏ mode.
              </li>
            </ul>
          </CollapsibleDetail>
          <CollapsibleDetail title="Cách giảm mode collapse">
            <ul className="list-disc list-inside space-y-1 text-sm text-foreground/90">
              <li>
                Dùng <strong>WGAN-GP</strong> — Wasserstein loss cho gradient
                mượt.
              </li>
              <li>
                <strong>Minibatch discrimination</strong>: D nhìn cả batch, phát
                hiện &quot;các ảnh giống hệt nhau&quot;.
              </li>
              <li>
                <strong>Unrolled GAN</strong>: G nhìn trước vài bước của D khi
                tính gradient.
              </li>
              <li>Chuyển sang Diffusion Models hoặc VAE nếu đa dạng quan trọng hơn sắc nét.</li>
            </ul>
          </CollapsibleDetail>
        </div>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════
          STEP 6 — CONDITIONAL GAN (cGAN)
          ═══════════════════════════════════════════════════════ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="cGAN — sinh có điều kiện">
        <h3 className="text-base font-semibold text-foreground mb-2">
          Conditional GAN: nói cho G biết muốn tạo gì
        </h3>
        <p className="text-sm text-muted mb-3">
          Trong GAN gốc, G tạo ảnh ngẫu nhiên. Trong cGAN, ta đưa thêm{" "}
          <strong>label y</strong> (ví dụ: &quot;số 7&quot;, &quot;ảnh chó&quot;, &quot;ảnh mũi tên&quot;)
          vào cả G và D. Ta điều khiển được loại ảnh được sinh ra.
        </p>

        <div className="rounded-xl border border-border bg-card p-4">
          <CGanDemo />
        </div>

        <div className="mt-4">
          <Callout variant="insight" title="Ứng dụng thực tế của cGAN">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <strong>Pix2Pix</strong>: y = ảnh bản phác &rarr; x = ảnh thật (ví
                dụ: label map &rarr; ảnh đường phố).
              </li>
              <li>
                <strong>Super-resolution</strong>: y = ảnh thấp phân giải
                &rarr; x = ảnh cao phân giải.
              </li>
              <li>
                <strong>Text-to-image (early)</strong>: y = câu mô tả &rarr; x = ảnh.
              </li>
            </ul>
          </Callout>
        </div>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════
          STEP 7 — STYLEGAN LATENT WALK
          ═══════════════════════════════════════════════════════ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Latent space walk">
        <h3 className="text-base font-semibold text-foreground mb-2">
          Đi dạo trong latent space (StyleGAN style)
        </h3>
        <p className="text-sm text-muted mb-3">
          Một Generator tốt học một không gian latent <em>liên tục</em>: mỗi
          điểm z tương ứng một ảnh, và các điểm gần nhau sinh ra ảnh giống
          nhau. Di chuyển z dọc theo một chiều = biến đổi ảnh theo một thuộc
          tính.
        </p>

        <div className="rounded-xl border border-border bg-card p-4">
          <LatentWalk />
        </div>

        <div className="mt-4">
          <InlineChallenge
            question="StyleGAN nổi bật nhờ điểm gì so với GAN gốc?"
            options={[
              "Không cần GPU",
              "Style-based generator với AdaIN và mapping network — disentangle các thuộc tính ở nhiều độ phân giải",
              "Huấn luyện không cần loss",
              "Dùng ít dữ liệu hơn",
            ]}
            correct={1}
            explanation="StyleGAN dùng mapping network (z → w) và chèn style w vào mỗi tầng của generator qua AdaIN. Kết quả: disentangled latents + kiểm soát phong cách ở nhiều scale (coarse: tư thế, middle: tóc, fine: màu da)."
          />
        </div>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════
          STEP 8 — DCGAN vs WGAN
          ═══════════════════════════════════════════════════════ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="DCGAN vs WGAN">
        <h3 className="text-base font-semibold text-foreground mb-2">
          So sánh hai biến thể cơ bản
        </h3>
        <p className="text-sm text-muted mb-3">
          DCGAN (2015) là baseline CNN mạnh nhưng unstable. WGAN (2017) thay
          loss bằng Wasserstein distance — ổn định hơn nhiều, đổi lại tốc độ
          huấn luyện chậm hơn.
        </p>

        <div className="rounded-xl border border-border bg-card p-4">
          <DcganVsWgan />
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <CollapsibleDetail title="DCGAN trick: kiến trúc thuần CNN">
            <ul className="list-disc list-inside space-y-1 text-sm text-foreground/90">
              <li>Thay FC bằng strided convolutions (D) + fractional-strided conv (G).</li>
              <li>Dùng BatchNorm ở cả G và D (trừ output layer).</li>
              <li>G dùng ReLU + Tanh ở output; D dùng LeakyReLU.</li>
              <li>Không dùng pooling — chỉ strided conv.</li>
            </ul>
          </CollapsibleDetail>
          <CollapsibleDetail title="WGAN-GP trick: Gradient Penalty">
            <p className="text-sm text-foreground/90 mb-2">
              WGAN gốc dùng weight clipping (|w| ≤ 0.01) để đảm bảo Lipschitz
              — đơn giản nhưng làm giảm capacity của D.
            </p>
            <p className="text-sm text-foreground/90">
              WGAN-GP thay bằng penalty:
            </p>
            <div className="my-2">
              <LaTeX block>
                {"\\lambda \\cdot \\mathbb{E}_{\\hat{x}}\\left[(\\|\\nabla_{\\hat{x}} D(\\hat{x})\\|_2 - 1)^2\\right]"}
              </LaTeX>
            </div>
            <p className="text-sm text-foreground/90">
              Trong đó x̂ lấy mẫu dọc đường thẳng giữa ảnh thật và giả. Mềm mà
              hiệu quả.
            </p>
          </CollapsibleDetail>
        </div>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════
          STEP 9 — TRAINING LOOP + CODE
          ═══════════════════════════════════════════════════════ */}
      <LessonSection step={9} totalSteps={TOTAL_STEPS} label="Giải thích & mã nguồn">
        <ExplanationSection>
          <p>
            <strong>GAN (Generative Adversarial Network)</strong> gồm hai mạng
            huấn luyện đối kháng theo trò chơi minimax:
          </p>

          <div className="my-3">
            <LaTeX block>
              {"\\min_G \\max_D \\; V(D, G) = \\mathbb{E}_{x \\sim p_{data}}[\\log D(x)] + \\mathbb{E}_{z \\sim p_z}[\\log(1 - D(G(z)))]"}
            </LaTeX>
          </div>

          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>D muốn tối đa V: phân biệt đúng thật/giả.</li>
            <li>G muốn tối thiểu V: lừa D nghĩ ảnh giả là thật.</li>
            <li>
              Cân bằng Nash:{" "}
              <LaTeX>{"D^*(x) = \\tfrac{p_{data}(x)}{p_{data}(x) + p_g(x)}"}</LaTeX>{" "}
              và khi{" "}
              <LaTeX>{"p_g = p_{data}"}</LaTeX> thì{" "}
              <LaTeX>{"D^*(x) = 0.5"}</LaTeX> cho mọi x.
            </li>
          </ul>

          <p className="mt-3">
            <strong>Vòng huấn luyện:</strong> Mỗi bước, ta huấn luyện D trước
            (cố định G), rồi huấn luyện G (cố định D). Hai mạng luân phiên cải
            thiện cho đến khi đạt cân bằng — hoặc phân kỳ nếu không cẩn thận.
          </p>

          <CodeBlock language="python" title="Training loop cơ bản (DCGAN)">
            {`for epoch in range(epochs):
    for real_batch in dataloader:
        # 1. Huấn luyện Discriminator
        z = torch.randn(batch_size, latent_dim, device=device)
        fake = generator(z).detach()

        loss_D = -torch.mean(
            torch.log(discriminator(real_batch) + 1e-8)
            + torch.log(1 - discriminator(fake) + 1e-8)
        )
        optimizer_D.zero_grad()
        loss_D.backward()
        optimizer_D.step()

        # 2. Huấn luyện Generator
        z = torch.randn(batch_size, latent_dim, device=device)
        fake = generator(z)
        loss_G = -torch.mean(torch.log(discriminator(fake) + 1e-8))
        optimizer_G.zero_grad()
        loss_G.backward()
        optimizer_G.step()`}
          </CodeBlock>

          <CodeBlock language="python" title="WGAN-GP — biến thể ổn định hơn">
            {`def gradient_penalty(D, real, fake):
    alpha = torch.rand(real.size(0), 1, 1, 1, device=real.device)
    interp = alpha * real + (1 - alpha) * fake
    interp.requires_grad_(True)

    d_interp = D(interp)
    grads = torch.autograd.grad(
        outputs=d_interp, inputs=interp,
        grad_outputs=torch.ones_like(d_interp),
        create_graph=True, retain_graph=True,
    )[0]
    grads = grads.view(real.size(0), -1)
    gp = ((grads.norm(2, dim=1) - 1) ** 2).mean()
    return gp

# Trong training loop
for epoch in range(epochs):
    for real in dataloader:
        # D step (lặp 5 lần mỗi G step)
        for _ in range(5):
            z = torch.randn(real.size(0), latent_dim, device=device)
            fake = generator(z).detach()

            gp = gradient_penalty(discriminator, real, fake)
            loss_D = (
                discriminator(fake).mean()
                - discriminator(real).mean()
                + 10.0 * gp
            )
            optimizer_D.zero_grad()
            loss_D.backward()
            optimizer_D.step()

        # G step
        z = torch.randn(real.size(0), latent_dim, device=device)
        fake = generator(z)
        loss_G = -discriminator(fake).mean()
        optimizer_G.zero_grad()
        loss_G.backward()
        optimizer_G.step()`}
          </CodeBlock>

          <p className="mt-3">
            <strong>Biến thể quan trọng:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>
              <strong>StyleGAN</strong> — kiểm soát phong cách ở nhiều mức (tóc,
              khuôn mặt, nền). Tạo khuôn mặt siêu thực.
            </li>
            <li>
              <strong>CycleGAN</strong> — chuyển đổi phong cách không cần cặp ảnh
              (ngựa &harr; ngựa vằn, ảnh &harr; tranh Monet).
            </li>
            <li>
              <strong>Pix2Pix</strong> — biến đổi ảnh theo cặp (bản phác &rarr;
              ảnh thật, nhãn &rarr; ảnh đường phố).
            </li>
            <li>
              <strong>BigGAN / StyleGAN-XL</strong> — scale lên hàng trăm triệu
              tham số, ảnh 1024×1024 chất lượng cao.
            </li>
            <li>
              <strong>GigaGAN</strong> — biến thể lớn cho text-to-image, cạnh
              tranh với diffusion về chất lượng nhưng nhanh hơn.
            </li>
          </ul>

          <Callout variant="insight" title="Diffusion Models vs GAN">
            Từ 2022,{" "}
            <TopicLink slug="diffusion-models">Diffusion Models</TopicLink>{" "}
            (DALL-E 2, Stable Diffusion, Midjourney) đang dần thay thế GAN cho
            nhiều tác vụ sinh ảnh. Lý do: huấn luyện ổn định hơn, không bị mode
            collapse, và cho kết quả đa dạng hơn. Tuy nhiên GAN vẫn nhanh hơn ở
            inference — quan trọng cho ứng dụng thời gian thực. So sánh với{" "}
            <TopicLink slug="vae">VAE</TopicLink>: VAE có latent space mượt
            nhưng ảnh mờ; GAN sắc nét nhưng khó train.
          </Callout>
        </ExplanationSection>

        {/* Legacy training bars kept from original */}
        <div className="rounded-xl border border-border bg-surface p-4 space-y-4 mt-6">
          <p className="text-sm text-foreground text-center font-medium">
            Chu trình lặp lại hàng nghìn lần &mdash; cả hai ngày càng giỏi hơn!
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 w-24 shrink-0">
                Generator
              </span>
              <div className="flex-1 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-blue-500"
                  animate={{ width: `${genQ}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
              <span className="text-xs font-mono text-foreground w-10 text-right">
                {genQ}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-red-600 dark:text-red-400 w-24 shrink-0">
                Discriminator
              </span>
              <div className="flex-1 h-5 rounded-full bg-red-100 dark:bg-red-900/30 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-red-500"
                  animate={{ width: `${discA}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
              <span className="text-xs font-mono text-foreground w-10 text-right">
                {discA}%
              </span>
            </div>
          </div>
          <p className="text-xs text-muted text-center">
            {trainStep === 0
              ? "Generator dở, Discriminator dễ phân biệt."
              : trainStep < 3
                ? "Generator cải thiện, Discriminator vẫn khá tốt."
                : trainStep < 5
                  ? "Hai bên tiến gần đến cân bằng..."
                  : "Cân bằng Nash! D chỉ còn đoán ~50/50."}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleTrain}
              disabled={trainStep >= 5 || trainRunning}
              className="rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {trainRunning
                ? "Đang huấn luyện..."
                : trainStep >= 5
                  ? "Đã hội tụ"
                  : `Huấn luyện (${trainStep}/5)`}
            </button>
            <button
              type="button"
              onClick={() => {
                setTrainStep(0);
                setTrainRunning(false);
              }}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground hover:bg-surface"
            >
              Đặt lại
            </button>
          </div>
        </div>

        <div className="mt-4">
          <Callout variant="tip" title="Mẹo thực chiến khi train GAN">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                Dùng Adam với <LaTeX>{"\\beta_1 = 0.5"}</LaTeX> (không phải
                0.9 như bình thường).
              </li>
              <li>
                Label smoothing: thay vì target 1.0 cho ảnh thật, dùng 0.9 —
                giảm quá tự tin của D.
              </li>
              <li>
                TTUR (Two Time-scale Update Rule): learning rate của D và G
                khác nhau, thường lr_D &lt; lr_G.
              </li>
              <li>
                Theo dõi chất lượng bằng FID/IS, không chỉ loss — loss GAN
                không luôn phản ánh chất lượng.
              </li>
            </ul>
          </Callout>
        </div>

        <div className="mt-4">
          <InlineChallenge
            question="Nếu Generator quá giỏi nhưng chỉ tạo được MỘT loại ảnh (luôn là mèo), vấn đề gì xảy ra?"
            options={[
              "Không vấn đề gì",
              "Mode collapse — thiếu đa dạng",
              "Discriminator thắng",
            ]}
            correct={1}
            explanation="Mode collapse là khi Generator chỉ học 1 pattern 'an toàn'. Đây là thách thức lớn nhất của GAN!"
          />
        </div>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════
          STEP 10 — SUMMARY + QUIZ
          ═══════════════════════════════════════════════════════ */}
      <LessonSection step={10} totalSteps={TOTAL_STEPS} label="Tóm tắt & kiểm tra">
        <MiniSummary
          title="Những điều cần nhớ về GAN"
          points={[
            "GAN gồm Generator (tạo dữ liệu giả từ z ~ N(0,1)) và Discriminator (phân biệt thật/giả), huấn luyện đối kháng.",
            "Mục tiêu minimax V(D,G): G cố lừa D, D cố phát hiện G — cân bằng Nash khi D(x) = 0.5 với mọi x.",
            "Loss G và D dao động ngược pha; không bao giờ giảm mượt như mạng bình thường — đừng hoảng khi thấy loss lên xuống.",
            "Thách thức lớn nhất: mode collapse — G chỉ học 1 pattern 'an toàn'. WGAN-GP giảm đáng kể rủi ro này.",
            "cGAN thêm label y vào cả G và D để điều khiển loại ảnh; StyleGAN thêm mapping network cho latent disentangled.",
            "Biến thể phổ biến: DCGAN (baseline CNN), WGAN-GP (ổn định), CycleGAN, Pix2Pix, BigGAN, StyleGAN. Diffusion Models đang dần thay thế GAN cho text-to-image.",
          ]}
        />

        <div className="mt-6">
          <QuizSection questions={quizQuestions} />
        </div>
      </LessonSection>
    </>
  );
}
