"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Snowflake,
  Wind,
  Target,
  Gauge,
  Zap,
  Activity,
  Scissors,
  Thermometer,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  Mountain,
} from "lucide-react";
import type { TopicMeta } from "@/lib/types";
import ApplicationLayout from "@/components/application/ApplicationLayout";
import ApplicationHero from "@/components/application/ApplicationHero";
import ApplicationProblem from "@/components/application/ApplicationProblem";
import ApplicationMechanism from "@/components/application/ApplicationMechanism";
import Beat from "@/components/application/Beat";
import ApplicationMetrics from "@/components/application/ApplicationMetrics";
import Metric from "@/components/application/Metric";
import ApplicationCounterfactual from "@/components/application/ApplicationCounterfactual";
import {
  SliderGroup,
  StepReveal,
  InlineChallenge,
  Callout,
  MiniSummary,
  TopicLink,
} from "@/components/interactive";

export const metadata: TopicMeta = {
  slug: "gradient-descent-in-training",
  title: "Gradient Descent in GPT Training",
  titleVi: "Gradient Descent trong huấn luyện mô hình",
  description:
    "Huấn luyện GPT-3 tốn ~12 triệu USD chỉ cho tính toán, phần lớn là chạy gradient descent. Vặn thử learning rate, momentum, batch size — xem loss hội tụ, dao động hay nổ tung.",
  category: "neural-fundamentals",
  tags: ["gradient-descent", "optimization", "training", "application"],
  difficulty: "intermediate",
  relatedSlugs: ["gradient-descent"],
  vizType: "interactive",
  applicationOf: "gradient-descent",
  featuredApp: {
    name: "GPT-3",
    productFeature: "Huấn luyện mô hình 175 tỉ tham số",
    company: "OpenAI",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "Language Models are Few-Shot Learners (GPT-3)",
      publisher: "Brown et al. — OpenAI, NeurIPS 2020",
      url: "https://arxiv.org/abs/2005.14165",
      date: "2020-07",
      kind: "paper",
    },
    {
      title: "Decoupled Weight Decay Regularization (AdamW)",
      publisher: "Loshchilov & Hutter — ICLR 2019",
      url: "https://arxiv.org/abs/1711.05101",
      date: "2019-01",
      kind: "paper",
    },
    {
      title:
        "Analyzing & Reducing the Need for Learning Rate Warmup in GPT Training",
      publisher: "Kosson et al. — arXiv 2410.23922",
      url: "https://arxiv.org/abs/2410.23922",
      date: "2024-10",
      kind: "paper",
    },
    {
      title: "On the difficulty of training Recurrent Neural Networks",
      publisher: "Pascanu et al. — ICML 2013 (gradient clipping)",
      url: "https://arxiv.org/abs/1211.5063",
      date: "2013-02",
      kind: "paper",
    },
    {
      title: "The cost of training GPT-3 and scaling laws for neural LMs",
      publisher: "Lambda Labs — engineering blog",
      url: "https://lambdalabs.com/blog/demystifying-gpt-3",
      date: "2020-06",
      kind: "engineering-blog",
    },
  ],
  tocSections: [
    { id: "hero", labelVi: "Tại sao 12 triệu USD?" },
    { id: "problem", labelVi: "Vấn đề" },
    { id: "mechanism", labelVi: "Simulator huấn luyện" },
    { id: "metrics", labelVi: "Con số thật" },
    { id: "counterfactual", labelVi: "Nếu không có" },
  ],
};

/* ────────────────────────────────────────────────────────────
   SIMULATION — toy MNIST-like binary classifier learning w* ≈ 1.5
   ──────────────────────────────────────────────────────────── */

interface TrainingPoint {
  epoch: number;
  loss: number;
  accuracy: number;
  wMean: number;
  wSpread: number;
  diverged: boolean;
}

interface SimConfig {
  lr: number;
  momentum: number;
  batchSize: number;
  epochs: number;
  seed: number;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function simulateMnistLike(cfg: SimConfig): TrainingPoint[] {
  const rand = mulberry32(cfg.seed);
  const wStar = 1.5;
  let w = -2.3;
  let velocity = 0;
  const points: TrainingPoint[] = [];
  const noiseScale = 1.0 / Math.sqrt(cfg.batchSize);
  let diverged = false;

  for (let e = 0; e <= cfg.epochs; e++) {
    const delta = w - wStar;
    const baseLoss = 0.5 * delta * delta + 0.03;
    const batchNoise = (rand() - 0.5) * noiseScale * 0.8;
    const loss = Math.max(0.01, baseLoss + batchNoise);
    const safeDelta = Math.min(Math.abs(w), 80);
    const accuracy = Math.max(
      0.1,
      Math.min(0.995, 1 - safeDelta * 0.35 - Math.max(0, batchNoise) * 0.2),
    );
    const spread = 0.12 + 0.4 * Math.min(1, Math.abs(delta)) + noiseScale * 0.25;
    points.push({
      epoch: e,
      loss: Math.min(loss, 120),
      accuracy,
      wMean: w,
      wSpread: spread,
      diverged,
    });
    if (diverged) continue;
    const stochGrad = delta + (rand() - 0.5) * noiseScale * 1.4;
    velocity = cfg.momentum * velocity - cfg.lr * stochGrad;
    w = w + velocity;
    if (!Number.isFinite(w) || Math.abs(w) > 60) {
      diverged = true;
      w = Math.sign(w || 1) * 60;
      velocity = 0;
    }
  }
  return points;
}

interface Diagnosis {
  label: string;
  accent: string;
  note: string;
  icon: typeof Flame;
  tone: "converge" | "slow" | "oscillate" | "explode" | "plateau";
}

function diagnoseRun(points: TrainingPoint[]): Diagnosis {
  if (points.length < 4) {
    return { label: "Không đủ dữ liệu", accent: "#6b7280", note: "Cần thêm epoch.", icon: Wind, tone: "slow" };
  }
  const final = points[points.length - 1];
  const first = points[0];
  const maxLoss = Math.max(...points.map((p) => p.loss));
  const anyDiverged = points.some((p) => p.diverged);
  if (anyDiverged || maxLoss > first.loss * 6) {
    return {
      label: "Phân kỳ — loss nổ tung",
      accent: "#ef4444",
      note: "Learning rate quá lớn. Bước cập nhật nhảy qua đáy thung lũng sang sườn còn dốc hơn. Trong thực tế, một run 12 triệu USD có thể hỏng vĩnh viễn kiểu này — phải rollback checkpoint và giảm η.",
      icon: Flame,
      tone: "explode",
    };
  }
  let flips = 0;
  for (let i = 2; i < points.length; i++) {
    const a = points[i].loss - points[i - 1].loss;
    const b = points[i - 1].loss - points[i - 2].loss;
    if (a * b < 0) flips++;
  }
  if (flips > points.length * 0.45 && final.loss > 0.2) {
    return {
      label: "Dao động mạnh — loss nhấp nhô",
      accent: "#f59e0b",
      note: "Learning rate hoặc batch noise hơi to. Mô hình bước qua đáy rồi bật ngược. Giảm η hoặc tăng batch size để trung hoà noise.",
      icon: Activity,
      tone: "oscillate",
    };
  }
  if (final.loss > first.loss * 0.7) {
    return {
      label: "Plateau — loss đứng yên",
      accent: "#0ea5e9",
      note: "Learning rate quá nhỏ. Mỗi bước nhích không đáng kể — lãng phí giờ GPU. Tăng η, hoặc thêm momentum để vượt saddle point.",
      icon: Snowflake,
      tone: "plateau",
    };
  }
  if (final.loss < 0.2) {
    return {
      label: "Hội tụ êm — lý tưởng",
      accent: "#22c55e",
      note: "Learning rate + momentum + batch size phối hợp tốt. Loss giảm đều, accuracy tăng đều, phân bố trọng số ổn định. Đây là tín hiệu OpenAI theo dõi suốt 34 ngày.",
      icon: Target,
      tone: "converge",
    };
  }
  return {
    label: "Chậm nhưng đúng hướng",
    accent: "#8b5cf6",
    note: "Loss có giảm nhưng chưa về đáy. Thử nâng η hoặc giảm batch size một chút.",
    icon: TrendingDown,
    tone: "slow",
  };
}

/* ────────────────────────────────────────────────────────────
   PRESETS
   ──────────────────────────────────────────────────────────── */

interface Preset {
  key: "low" | "good" | "high" | "diverge";
  label: string;
  desc: string;
  color: string;
  lr: number;
  momentum: number;
  batchSize: number;
  icon: typeof Flame;
}

const PRESETS: Preset[] = [
  { key: "low", label: "Too low", desc: "η quá nhỏ — loss gần như đứng yên", color: "#0ea5e9", lr: 0.008, momentum: 0.2, batchSize: 64, icon: Snowflake },
  { key: "good", label: "Just right", desc: "Cân bằng — loss giảm êm, accuracy tăng đều", color: "#22c55e", lr: 0.08, momentum: 0.85, batchSize: 64, icon: Target },
  { key: "high", label: "Too high", desc: "η hơi lớn — loss dao động quanh đáy", color: "#f59e0b", lr: 0.45, momentum: 0.9, batchSize: 16, icon: Activity },
  { key: "diverge", label: "Diverge", desc: "η quá lớn + momentum cao — loss nổ", color: "#ef4444", lr: 1.1, momentum: 0.95, batchSize: 8, icon: Flame },
];

/* ────────────────────────────────────────────────────────────
   COMPONENT CHÍNH
   ──────────────────────────────────────────────────────────── */

export default function GradientDescentInTraining() {
  const [activePreset, setActivePreset] = useState<Preset["key"] | null>("good");
  const [activeBeat, setActiveBeat] = useState<number>(1);

  return (
    <ApplicationLayout metadata={metadata} parentTitleVi="Gradient Descent">
      {/* ━━━ HERO ━━━ */}
      <ApplicationHero parentTitleVi="Gradient Descent" topicSlug={metadata.slug}>
        <p>
          Tháng 6 năm 2020, OpenAI công bố <strong>GPT-3</strong> — mô hình
          ngôn ngữ 175 tỉ tham số. Con số ấn tượng không kém: theo Lambda
          Labs, chi phí tính toán để huấn luyện một lần là{" "}
          <strong>khoảng 12 triệu USD</strong>. Phần lớn số tiền đó không tiêu
          vào kiến trúc sang trọng. Nó tiêu vào một việc duy nhất, lặp lại
          hàng triệu lần trên 1.024 GPU V100.
        </p>
        <p>
          Việc đó tên là <strong>gradient descent</strong> — thuật toán hỏi
          &ldquo;nếu ta nhích trọng số này xuống một chút, loss giảm bao
          nhiêu?&rdquo; rồi trả lời bằng một bước rất nhỏ về phía đáy thung
          lũng mất mát. Lặp vài trăm triệu lần, mô hình đi từ ngẫu nhiên hoàn
          toàn tới trả lời được câu hỏi tiếng Việt. Tại sao OpenAI chọn thuật
          toán đơn giản này thay vì gì đó kỳ diệu hơn?
        </p>

        <div className="not-prose my-4 rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-tertiary">
            Chi phí của một run gradient descent (ước lượng GPT-3)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { n: "175 tỉ", label: "tham số cần cập nhật" },
              { n: "1.024", label: "GPU V100 song song" },
              { n: "~34 ngày", label: "chạy liên tục" },
              { n: "~12M USD", label: "chi phí tính toán" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-border bg-surface/60 p-3">
                <p className="text-lg font-bold text-accent">{item.n}</p>
                <p className="text-[11px] text-muted leading-snug">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p>
          Gradient descent sống sót vì ba lý do: rẻ trên mỗi bước, mở rộng
          được với bất kỳ số chiều (kể cả 175 tỉ), và có nhiều biến thể
          (AdamW, momentum, learning-rate schedule) giúp ổn định khi scale.
          Bài này bạn sẽ tự vặn learning rate, momentum, batch size của một
          mô hình toy và xem loss, accuracy, phân bố trọng số đổi ra sao.
        </p>
      </ApplicationHero>

      {/* ━━━ PROBLEM ━━━ */}
      <ApplicationProblem topicSlug={metadata.slug}>
        <p>
          Bề mặt mất mát (loss surface) của GPT-3 sống trong không gian 175
          tỉ chiều. Bạn không thể &ldquo;nhìn&rdquo; nó, nhưng OpenAI phải
          tìm một điểm thấp trong đó, bằng cách chỉ tính gradient — hướng
          dốc nhất — tại vị trí hiện tại.
        </p>

        <div className="not-prose my-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { title: "Saddle point", desc: "Điểm yên ngựa: gradient gần 0 nhưng không phải đáy. SGD thuần dễ kẹt. Momentum giúp trượt qua.", color: "#8b5cf6", icon: Mountain },
            { title: "Noisy gradient", desc: "Mỗi batch chỉ vài triệu token. Gradient trên batch lệch trung bình thật. Batch to → ít nhiễu nhưng đắt.", color: "#3b82f6", icon: Wind },
            { title: "Exploding loss", desc: "Một batch dị thường có thể đẩy gradient lên 1000×. Không clip, 34 ngày công sức tan theo một bước.", color: "#ef4444", icon: Flame },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="rounded-xl border bg-card p-4 space-y-2" style={{ borderLeft: `4px solid ${card.color}` }}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" style={{ color: card.color }} />
                  <p className="text-sm font-bold text-foreground">{card.title}</p>
                </div>
                <p className="text-xs text-muted leading-snug">{card.desc}</p>
              </div>
            );
          })}
        </div>

        <p>
          Bài toán của OpenAI không phải &ldquo;tìm thuật toán mới&rdquo;. Là{" "}
          <strong>giữ gradient descent ổn định</strong> qua 300 tỉ token dữ
          liệu, trên 1.024 GPU, trong 34 ngày, với chi phí 12 triệu USD. Sai
          learning rate 3× có thể tốn hàng triệu USD. Vì thế mỗi
          hyperparameter — η, β₁, β₂, batch size, clip threshold — đều được
          chọn từ hàng trăm thí nghiệm trên mô hình nhỏ.
        </p>
      </ApplicationProblem>

      {/* ━━━ MECHANISM ━━━ */}
      <ApplicationMechanism parentTitleVi="Gradient Descent" topicSlug={metadata.slug}>
        <Beat step={1}>
          <p>
            <strong>Lấy một mini-batch ngẫu nhiên.</strong> Thay vì dùng toàn
            bộ 300 tỉ token cho mỗi bước (không thể nào), OpenAI chia dữ liệu
            thành các mini-batch cỡ 3,2 triệu token. Mỗi GPU xử lý một phần,
            gradient cục bộ được tổng hợp qua all-reduce.
          </p>
          <BeatVisualToggle active={activeBeat === 1} onClick={() => setActiveBeat(activeBeat === 1 ? 0 : 1)} />
          <BeatVisual beatIndex={1} activeBeat={activeBeat}><MiniBatchSketch /></BeatVisual>
        </Beat>

        <Beat step={2}>
          <p>
            <strong>Tính gradient qua backprop.</strong> Với mini-batch hiện
            tại, tính loss rồi lan truyền ngược qua 96 lớp Transformer để có
            gradient của mọi tham số. Đây là bước đắt nhất — chiếm phần lớn
            chi phí GPU của run 12 triệu USD.
          </p>
          <BeatVisualToggle active={activeBeat === 2} onClick={() => setActiveBeat(activeBeat === 2 ? 0 : 2)} />
          <BeatVisual beatIndex={2} activeBeat={activeBeat}><BackpropSketch /></BeatVisual>
        </Beat>

        <Beat step={3}>
          <p>
            <strong>AdamW cập nhật trọng số.</strong> Không dùng SGD thuần.
            OpenAI dùng AdamW: giữ trung bình động của gradient (momentum) và
            của gradient bình phương (variance). Mỗi trọng số có bước thích
            ứng riêng — trọng số nào gradient lớn bị rút bước, nhỏ được đẩy
            nhanh. Weight decay tách riêng khỏi gradient giúp mô hình không{" "}
            &ldquo;bơm&rdquo; trọng số lên quá lớn.
          </p>
          <BeatVisualToggle active={activeBeat === 3} onClick={() => setActiveBeat(activeBeat === 3 ? 0 : 3)} />
          <BeatVisual beatIndex={3} activeBeat={activeBeat}><AdamWSketch /></BeatVisual>
        </Beat>

        <Beat step={4}>
          <p>
            <strong>Clip gradient, rồi cập nhật.</strong> Trước khi áp bước,
            cắt gradient sao cho norm không vượt 1,0. Nếu một batch dị
            thường tạo gradient khổng lồ, clip biến nó về cỡ bình thường.
            Đây là phanh cứu cả run khỏi phân kỳ.
          </p>
          <BeatVisualToggle active={activeBeat === 4} onClick={() => setActiveBeat(activeBeat === 4 ? 0 : 4)} />
          <BeatVisual beatIndex={4} activeBeat={activeBeat}><ClipSketch /></BeatVisual>
        </Beat>

        <Beat step={5}>
          <p>
            <strong>Lặp lại — cho đến khi loss không giảm nữa.</strong> Vòng
            lặp trên chạy khoảng 500 tỉ lần cho GPT-3. Theo dõi loss +
            accuracy + phân bố trọng số sau vài nghìn bước. Nếu đúng hướng,
            giữ nguyên. Nếu lệch, rollback checkpoint và điều chỉnh η.
          </p>
          <BeatVisualToggle active={activeBeat === 5} onClick={() => setActiveBeat(activeBeat === 5 ? 0 : 5)} />
          <BeatVisual beatIndex={5} activeBeat={activeBeat}><LoopSketch /></BeatVisual>
        </Beat>

        {/* ── REVEAL — LIVE SIMULATOR ── */}
        <li className="mt-8">
          <div className="rounded-2xl border-2 border-accent/30 bg-accent-light p-5 space-y-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white">
                <Gauge className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Simulator: huấn luyện mô hình toy phân loại MNIST
                </h3>
                <p className="text-xs text-muted leading-relaxed mt-1">
                  Mô hình nhỏ (một trọng số w, mục tiêu w* ≈ 1,5) học phân
                  loại nhị phân có nhiễu. Vặn learning rate, momentum, batch
                  size — xem loss, accuracy, phân bố trọng số đổi qua 50
                  epoch giả lập.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {PRESETS.map((p) => {
                const Icon = p.icon;
                const isActive = activePreset === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setActivePreset(p.key)}
                    className="text-left rounded-xl border p-3 transition-colors"
                    style={{
                      borderColor: isActive ? p.color : "var(--border)",
                      backgroundColor: isActive ? p.color + "18" : "var(--bg-card)",
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="h-3.5 w-3.5" style={{ color: p.color }} />
                      <span className="text-xs font-bold" style={{ color: isActive ? p.color : "var(--text-primary)" }}>
                        {p.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted leading-snug">{p.desc}</p>
                  </button>
                );
              })}
            </div>

            <SimulatorSlider
              preset={PRESETS.find((p) => p.key === activePreset) ?? PRESETS[1]}
              onManualChange={() => setActivePreset(null)}
            />

            <Callout variant="insight" title="Ba biểu đồ, một câu chuyện">
              Loss cho biết mô hình có đi xuống đáy. Accuracy cho biết nó có
              học phân loại (đôi khi loss giảm nhưng accuracy không tăng —
              dấu hiệu overfitting). Weight histogram cho biết trọng số có
              đang bùng nổ hoặc co về 0 — chỉ số sức khoẻ mà kỹ sư của OpenAI
              theo dõi suốt 34 ngày.
            </Callout>
          </div>
        </li>

        {/* ── DEEPEN — training quirks ── */}
        <li className="mt-6">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Ba mẹo thực tế giữ gradient descent ổn định
                </h3>
                <p className="text-xs text-muted">
                  Ba quirk bất kỳ team huấn luyện mô hình lớn đều biết. Bấm{" "}
                  &ldquo;Tiếp tục&rdquo; để lật từng mẹo kèm hình mô tả.
                </p>
              </div>
            </div>

            <StepReveal labels={["1 · Warmup", "2 · Learning-rate decay", "3 · Gradient clipping"]}>
              <QuirkCard
                title="Warmup — khởi động chậm vài nghìn bước đầu"
                tagline="η tăng tuyến tính từ gần 0 tới đỉnh trong ~375 triệu token đầu"
                color="#0ea5e9"
                icon={Thermometer}
                body="Đầu huấn luyện, trọng số là số ngẫu nhiên, gradient có thể lệch cỡ lớn. Nếu cho η đỉnh ngay bước 1, bước cập nhật đầu có thể làm hỏng hệ thống trước cả khi nó ổn định. Warmup nâng dần η qua vài nghìn bước đầu — như để xe ấm máy trước khi đạp ga."
              >
                <WarmupSketch />
              </QuirkCard>
              <QuirkCard
                title="Learning-rate decay — giảm dần về cuối"
                tagline="η giảm theo cosine xuống ~10% giá trị đỉnh cuối run"
                color="#22c55e"
                icon={TrendingDown}
                body="Cuối huấn luyện, mô hình đã gần đáy. Bước nhảy to lúc này sẽ vọt qua đáy. Decay làm η nhỏ dần — mô hình &ldquo;rón rén&rdquo; vào đáy. Cosine schedule (hình nửa sóng) là chuẩn cho GPT-3, GPT-4, LLaMA."
              >
                <DecaySketch />
              </QuirkCard>
              <QuirkCard
                title="Gradient clipping — phanh chống nổ"
                tagline="Cắt ngưỡng norm tại 1,0 — một batch bệnh không phá cả run"
                color="#ef4444"
                icon={Scissors}
                body="Một batch với dữ liệu dị thường có thể đẩy gradient lên 1000× bình thường. Không clip, một bước kiểu này quẳng trọng số sang vùng loss vô cùng. Clip bó norm gradient về 1,0 trước khi áp bước. Đây là lý do run 12 triệu USD của OpenAI không vỡ giữa chừng."
              >
                <ClippingCurveSketch />
              </QuirkCard>
            </StepReveal>
          </div>
        </li>

        {/* ── CHALLENGE ── */}
        <li className="mt-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-accent" /> Chẩn đoán 3 loss
              curve kỳ lạ
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Team huấn luyện nhìn ba biểu đồ dưới đây xuất hiện trên
              TensorBoard. Bạn chọn nguyên nhân nào là hợp lý nhất?
            </p>

            <InlineChallenge
              question="Biểu đồ 1 — loss jagged (răng cưa): giảm được vài bước rồi nhảy tung lên cao, rồi lại giảm, lặp đi lặp lại suốt 20 epoch. Accuracy cũng nhấp nhô. Nguyên nhân khả dĩ nhất?"
              options={[
                "Batch size quá to → gradient chính xác quá → mô hình bị kẹt",
                "Learning rate hơi lớn hoặc batch size quá nhỏ → mỗi bước noise cao + bước to → bước qua đáy rồi bật ngược",
                "Dữ liệu bị lỗi — phải dừng run và làm sạch dữ liệu",
                "Gradient clipping đã bị tắt — cần bật lại",
              ]}
              correct={1}
              explanation="Loss răng cưa mãn tính là dấu hiệu kinh điển của dao động. Mô hình bước qua đáy rồi bật ngược lại. Giảm η khoảng 2× hoặc tăng batch size để noise gradient thấp hơn. Nếu là lỗi dữ liệu, curve sẽ lệch hẳn, không đối xứng."
            />

            <InlineChallenge
              question="Biểu đồ 2 — loss plateau (nằm ngang): giảm rất nhanh trong 5 epoch đầu rồi phẳng lì 30 epoch tiếp theo, không nhúc nhích. Accuracy kẹt ở 62%. Bước nào nên thử TRƯỚC?"
              options={[
                "Khởi động lại run từ đầu với η lớn hơn 10 lần",
                "Bật momentum (β₁) từ 0,0 lên 0,9 và / hoặc dùng warm restart — tăng η một bậc giữa chừng",
                "Tăng epoch lên gấp đôi và chờ",
                "Tắt weight decay",
              ]}
              correct={1}
              explanation="Plateau giữa run thường là saddle point — gradient gần bằng 0, SGD thuần không có lực đẩy. Momentum tích luỹ hướng cũ nên đẩy mô hình vượt qua saddle. Tăng η &ldquo;một bậc&rdquo; (warm restart) cũng là kỹ thuật thực tế."
            />

            <InlineChallenge
              question="Biểu đồ 3 — loss = NaN sau epoch 12: loss giảm đẹp tới epoch 11, sang epoch 12 thì toàn biểu đồ đầy NaN. Team nên làm gì?"
              options={[
                "Chờ — thường NaN sẽ tự biến mất sau vài epoch",
                "Rollback tới checkpoint epoch 10, giảm learning rate khoảng 3 lần, bật gradient clipping nếu chưa có, khởi động lại",
                "Đổi kiến trúc mô hình sang thứ khác",
                "Xoá toàn bộ dữ liệu và bắt đầu lại từ đầu",
              ]}
              correct={1}
              explanation="NaN gần như luôn là gradient nổ — một batch dị thường tạo gradient khổng lồ, nhân với η lớn thành bước vô cùng. Ba biện pháp chuẩn: (1) rollback checkpoint trước khi nổ, (2) giảm η, (3) siết clip threshold. Không bao giờ &ldquo;chờ&rdquo; — NaN không tự khỏi, nó lan ra toàn bộ trọng số."
            />
          </div>
        </li>

        {/* ── Diagnostic cheat-sheet ── */}
        <li className="mt-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-accent" /> Bảng tra nhanh: loss
              curve → biện pháp
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <CheatCard title="Loss giảm êm" tone="success" body="Giữ nguyên. Theo dõi accuracy và weight histogram để phát hiện sớm vấn đề. Đừng vội giảm η cho tới khi plateau rõ ràng." />
              <CheatCard title="Loss răng cưa, dao động" tone="warning" body="Giảm η 1,5×–2×, hoặc tăng batch size 2× để giảm noise. Nếu vẫn dao động, tăng momentum để bước đi &ldquo;nặng&rdquo; hơn." />
              <CheatCard title="Loss plateau, không giảm" tone="info" body="Có thể saddle point: bật / tăng momentum. Có thể η quá nhỏ: nhân η cho 2–3. Có thể dataset học hết: lúc dừng huấn luyện." />
              <CheatCard title="Loss tăng dần (chưa NaN)" tone="warning" body="η hơi lớn — mỗi bước làm loss tăng. Giảm η ngay, hoặc rollback checkpoint. Nếu mới tăng vài bước, bật warmup có thể xử lý." />
              <CheatCard title="Loss nổ / NaN đột ngột" tone="danger" body="Rollback checkpoint trước khi nổ. Giảm η 3–5×. Bật / siết gradient clipping. Kiểm tra batch gần nhất có bất thường không." />
              <CheatCard title="Accuracy tăng, loss phẳng" tone="info" body="Cross-entropy và độ chính xác đo hai thứ khác nhau. Mô hình vẫn học đúng, chỉ &ldquo;tự tin&rdquo; chưa đủ. Thường là tín hiệu ổn." />
            </div>
          </div>
        </li>

        {/* ── SUMMARY + CONCEPT REDIRECT ── */}
        <li className="mt-6">
          <MiniSummary
            title="Bốn điều rút ra từ bài này"
            points={[
              "Huấn luyện GPT-3 là một vòng lặp gradient descent chạy 500 tỉ lần. 12 triệu USD phần lớn tiêu cho bước backprop tính gradient.",
              "Ba hyperparameter quyết định sống chết: learning rate (quá to → nổ, quá nhỏ → lãng phí), momentum (giúp qua saddle point), batch size (batch to → noise thấp nhưng đắt).",
              "Ba mẹo cứu cánh: warmup (khởi động chậm), learning-rate decay (rón rén cuối run), gradient clipping (phanh chống nổ).",
              "Loss curve là bảng điều khiển: jagged → giảm η, plateau → bật momentum, NaN → rollback + siết clip. Đọc curve là kỹ năng cốt lõi của kỹ sư huấn luyện.",
            ]}
          />
          <div className="mt-4">
            <Callout variant="insight" title="Quay lại lý thuyết">
              Nếu bạn muốn thấy gradient descent chạy trên bản đồ contour 2D
              để cảm nhận &ldquo;lăn xuống dốc&rdquo;, quay lại bài{" "}
              <TopicLink slug="gradient-descent">Gradient Descent</TopicLink>.
            </Callout>
          </div>
        </li>
      </ApplicationMechanism>

      {/* ━━━ METRICS ━━━ */}
      <ApplicationMetrics sources={metadata.sources!} topicSlug={metadata.slug}>
        <Metric value="GPT-3 huấn luyện trên 300 tỉ token, dùng AdamW với β₁ = 0,9, β₂ = 0,95, weight decay = 0,1" sourceRef={1} />
        <Metric value="Peak learning rate cho GPT-3 là 6×10⁻⁵ — warmup tuyến tính trong 375 triệu token đầu, rồi decay cosine tới 10% giá trị đỉnh" sourceRef={1} />
        <Metric value="Chi phí tính toán huấn luyện GPT-3 ước lượng ~12 triệu USD, chạy trên 1.024 GPU V100 trong khoảng 34 ngày" sourceRef={5} />
        <Metric value="AdamW (Loshchilov & Hutter 2019) cải thiện generalization so với Adam chuẩn bằng cách tách weight decay khỏi gradient — tiêu chuẩn vàng cho Transformer" sourceRef={2} />
        <Metric value="Warmup ~2.000 bước đầu giảm đáng kể rủi ro phân kỳ; nghiên cứu 2024 chỉ ra có thể rút ngắn nếu khởi tạo trọng số cẩn thận" sourceRef={3} />
        <Metric value="Gradient clipping (Pascanu et al. 2013) là biện pháp ngăn gradient nổ; threshold 1,0 được dùng phổ biến cho LLM lớn" sourceRef={4} />
      </ApplicationMetrics>

      {/* ━━━ COUNTERFACTUAL ━━━ */}
      <ApplicationCounterfactual parentTitleVi="Gradient Descent" topicSlug={metadata.slug}>
        <p>
          Không có gradient descent, không có cách nào điều chỉnh 175 tỉ
          trọng số theo một tín hiệu loss duy nhất. Mọi kỹ thuật thay thế
          (grid search, đạo hàm số, tiến hoá) đều có độ phức tạp tăng theo số
          chiều — bất khả thi ở quy mô tỉ tham số.
        </p>
        <p>
          Không có AdamW, mô hình sẽ cần tinh chỉnh learning rate thủ công
          cho từng nhóm tham số. Không có warmup, bước đầu dễ làm gradient
          nổ. Không có learning-rate decay, mô hình dao động mãi quanh đáy.
          Không có gradient clipping, một batch xấu huỷ cả 34 ngày huấn
          luyện.
        </p>
        <p className="mt-3">
          <strong>Bài học rút ra:</strong> gradient descent không phải công
          thức kỳ diệu. Nó đơn giản đến nỗi một thuật toán 70 năm tuổi vẫn
          làm nền tảng cho GPT-3, GPT-4 và mọi mô hình sau đó. Cái khó nằm ở
          việc giữ nó ổn định suốt 34 ngày trên 1.024 GPU — và đó là nơi
          AdamW, warmup, decay, clipping cộng dồn thành 12 triệu USD tiêu
          đúng chỗ.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}

/* ────────────────────────────────────────────────────────────
   SIMULATOR SLIDER
   ──────────────────────────────────────────────────────────── */

interface SimulatorSliderProps {
  preset: Preset;
  onManualChange: () => void;
}

function SimulatorSlider({ preset, onManualChange }: SimulatorSliderProps) {
  return (
    <div key={preset.key} onPointerDown={onManualChange}>
      <SliderGroup
        title="Hyperparameter — thả tay vặn thử"
        sliders={[
          { key: "lr", label: "Learning rate η", min: 0.001, max: 1.5, step: 0.001, defaultValue: preset.lr },
          { key: "momentum", label: "Momentum β", min: 0, max: 0.99, step: 0.01, defaultValue: preset.momentum },
          { key: "batchSize", label: "Batch size", min: 4, max: 256, step: 4, defaultValue: preset.batchSize },
        ]}
        visualization={(values) => (
          <TrainingCurvesPanel lr={values.lr} momentum={values.momentum} batchSize={values.batchSize} />
        )}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   TRAINING CURVES PANEL
   ──────────────────────────────────────────────────────────── */

interface TrainingCurvesPanelProps {
  lr: number;
  momentum: number;
  batchSize: number;
}

function TrainingCurvesPanel({ lr, momentum, batchSize }: TrainingCurvesPanelProps) {
  const epochs = 50;
  const points = useMemo(
    () => simulateMnistLike({ lr, momentum, batchSize, epochs, seed: 42 }),
    [lr, momentum, batchSize],
  );
  const diag = useMemo(() => diagnoseRun(points), [points]);

  return (
    <div className="w-full space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <CurveChart
          title="Loss"
          points={points.map((p) => ({ x: p.epoch, y: p.loss }))}
          xMax={epochs}
          yMax={Math.max(2, ...points.map((p) => Math.min(p.loss, 20)))}
          color={diag.accent}
          yLabel="loss"
          fmt={(v) => v.toFixed(2)}
        />
        <CurveChart
          title="Accuracy"
          points={points.map((p) => ({ x: p.epoch, y: p.accuracy }))}
          xMax={epochs}
          yMax={1}
          color="#3b82f6"
          yLabel="acc"
          fmt={(v) => (v * 100).toFixed(0) + "%"}
        />
      </div>
      <WeightHistogram points={points} color={diag.accent} />
      <DiagnosisBadge diag={diag} lr={lr} momentum={momentum} batchSize={batchSize} />
    </div>
  );
}

interface CurveChartProps {
  title: string;
  points: { x: number; y: number }[];
  xMax: number;
  yMax: number;
  color: string;
  yLabel: string;
  fmt: (v: number) => string;
}

function CurveChart({ title, points, xMax, yMax, color, yLabel, fmt }: CurveChartProps) {
  const plotW = 320;
  const plotH = 140;
  const toPX = (x: number) => 32 + (x / xMax) * (plotW - 48);
  const toPY = (y: number) => plotH - 22 - (Math.max(0, Math.min(yMax, y)) / yMax) * (plotH - 38);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${toPX(p.x).toFixed(1)} ${toPY(p.y).toFixed(1)}`).join(" ");
  const last = points[points.length - 1];

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground">{title}</p>
        <span className="text-[11px] font-mono tabular-nums" style={{ color }}>{fmt(last.y)}</span>
      </div>
      <svg viewBox={`0 0 ${plotW} ${plotH}`} className="w-full" role="img" aria-label={`${title} theo epoch`}>
        <title>{title} theo 50 epoch huấn luyện giả lập.</title>
        {[0.25, 0.5, 0.75].map((frac) => (
          <line key={frac} x1={32} y1={20 + frac * (plotH - 38)} x2={plotW - 16} y2={20 + frac * (plotH - 38)} stroke="var(--border)" strokeWidth={0.5} strokeDasharray="2,3" opacity={0.35} />
        ))}
        <line x1={32} y1={plotH - 22} x2={plotW - 16} y2={plotH - 22} stroke="var(--border)" strokeWidth={1} />
        <line x1={32} y1={20} x2={32} y2={plotH - 22} stroke="var(--border)" strokeWidth={1} />
        <text x={plotW - 14} y={plotH - 7} fontSize={11} fill="var(--text-tertiary)" textAnchor="end">epoch</text>
        <text x={8} y={26} fontSize={11} fill="var(--text-tertiary)">{yLabel}</text>
        <path d={path} fill="none" stroke={color} strokeWidth={1.8} />
        {last && <circle cx={toPX(last.x)} cy={toPY(last.y)} r={3.5} fill={color} stroke="#fff" strokeWidth={1} />}
      </svg>
    </div>
  );
}

function WeightHistogram({ points, color }: { points: TrainingPoint[]; color: string }) {
  const plotW = 660;
  const plotH = 96;
  const slots = 14;
  const sample = useMemo(() => {
    const picks: TrainingPoint[] = [];
    const stride = Math.max(1, Math.floor(points.length / slots));
    for (let i = 0; i < slots; i++) {
      picks.push(points[Math.min(points.length - 1, i * stride)]);
    }
    return picks;
  }, [points]);
  const xStep = (plotW - 40) / sample.length;
  const maxSpread = Math.max(0.3, ...sample.map((s) => s.wSpread));

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground">Weight histogram (phân bố trọng số qua thời gian)</p>
        <span className="text-[10px] text-muted italic">chấm = trung tâm, vùng bo = spread</span>
      </div>
      <svg viewBox={`0 0 ${plotW} ${plotH}`} className="w-full" role="img" aria-label="Phân bố trọng số qua các epoch">
        <title>Mỗi cột là một thời điểm (epoch). Chấm là trung bình w; cột bo thể hiện độ rộng phân bố.</title>
        <line x1={20} y1={plotH / 2} x2={plotW - 20} y2={plotH / 2} stroke="var(--border)" strokeWidth={0.8} strokeDasharray="3,3" />
        <text x={10} y={plotH / 2 + 3} fontSize={11} fill="var(--text-tertiary)">0</text>
        {sample.map((s, i) => {
          const cx = 24 + i * xStep;
          const mid = plotH / 2 - (s.wMean / 3) * (plotH / 2 - 8);
          const spreadPx = (s.wSpread / maxSpread) * 30;
          return (
            <g key={i}>
              <rect x={cx - 7} y={mid - spreadPx} width={14} height={Math.max(2, spreadPx * 2)} rx={2} fill={color} opacity={0.22} />
              <circle cx={cx} cy={mid} r={2.6} fill={color} />
              {(i === 0 || i === sample.length - 1) && (
                <text x={cx} y={plotH - 4} fontSize={11} fill="var(--text-tertiary)" textAnchor="middle">ep {s.epoch}</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function DiagnosisBadge({ diag, lr, momentum, batchSize }: { diag: Diagnosis; lr: number; momentum: number; batchSize: number }) {
  const Icon = diag.icon;
  return (
    <div className="rounded-lg border p-3 flex items-start gap-3" style={{ backgroundColor: diag.accent + "14", borderColor: diag.accent + "55" }}>
      <Icon className="h-5 w-5 shrink-0 mt-0.5" style={{ color: diag.accent }} />
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-3 mb-1">
          <p className="text-sm font-bold" style={{ color: diag.accent }}>{diag.label}</p>
          <span className="text-[11px] font-mono text-muted tabular-nums">η = {lr.toFixed(3)}, β = {momentum.toFixed(2)}, batch = {batchSize}</span>
        </div>
        <p className="text-xs text-foreground/80 leading-relaxed">{diag.note}</p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   BEAT VISUAL WRAPPERS
   ──────────────────────────────────────────────────────────── */

function BeatVisualToggle({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold border transition-colors"
      style={{
        borderColor: active ? "var(--accent)" : "var(--border)",
        backgroundColor: active ? "var(--accent)" : "var(--bg-card)",
        color: active ? "white" : "var(--text-secondary)",
      }}
      aria-pressed={active}
    >
      {active ? "Đang xem" : "Xem hình mô tả"}
    </button>
  );
}

function BeatVisual({ beatIndex, activeBeat, children }: { beatIndex: number; activeBeat: number; children: React.ReactNode }) {
  const isOpen = activeBeat === beatIndex;
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key={`beat-${beatIndex}`}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="rounded-xl border border-border bg-surface/50 p-4 mt-3">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ────────────────────────────────────────────────────────────
   BEAT SKETCHES
   ──────────────────────────────────────────────────────────── */

function MiniBatchSketch() {
  return (
    <svg viewBox="0 0 480 130" className="w-full" role="img" aria-label="Dữ liệu chia thành mini-batch gửi tới các GPU song song">
      <title>300 tỉ token chia thành mini-batch, mỗi GPU nhận một phần.</title>
      <defs>
        <marker id="mb-arrow" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--text-secondary)" />
        </marker>
      </defs>
      <rect x={20} y={20} width={120} height={32} rx={6} fill="#3b82f633" stroke="#3b82f6" />
      <text x={80} y={40} textAnchor="middle" fontSize={11} fill="#1e3a8a" fontWeight={600}>Dataset 300 tỉ token</text>
      <path d="M 140 36 L 180 36" stroke="var(--text-secondary)" strokeWidth={1.5} markerEnd="url(#mb-arrow)" />
      {[0, 1, 2, 3].map((i) => {
        const y = 20 + i * 22;
        return (
          <g key={i}>
            <rect x={190} y={y} width={80} height={16} rx={3} fill="#8b5cf633" stroke="#8b5cf6" />
            <text x={230} y={y + 12} textAnchor="middle" fontSize={11} fill="#5b21b6" fontFamily="monospace">mini-batch {i + 1}</text>
            <path d={`M 270 ${y + 8} L 320 ${y + 8}`} stroke="var(--text-secondary)" strokeWidth={1} markerEnd="url(#mb-arrow)" />
            <rect x={325} y={y} width={56} height={16} rx={3} fill="#22c55e33" stroke="#22c55e" />
            <text x={353} y={y + 12} textAnchor="middle" fontSize={11} fill="#166534" fontFamily="monospace">GPU #{i + 1}</text>
          </g>
        );
      })}
      <text x={240} y={122} textAnchor="middle" fontSize={11} fill="var(--text-secondary)" fontStyle="italic">
        Gradient các GPU được tổng hợp (all-reduce) trước khi cập nhật.
      </text>
    </svg>
  );
}

function BackpropSketch() {
  return (
    <svg viewBox="0 0 480 120" className="w-full" role="img" aria-label="Backprop truyền gradient ngược qua 96 lớp Transformer">
      <title>Backprop — gradient chảy ngược qua 96 lớp của GPT-3.</title>
      <defs>
        <marker id="bp-arrow" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 z" fill="#8b5cf6" />
        </marker>
      </defs>
      <text x={20} y={18} fontSize={11} fill="var(--text-secondary)">Loss L</text>
      <text x={410} y={18} fontSize={11} fill="var(--text-secondary)">∂L/∂w</text>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const cx = 50 + i * 72;
        return (
          <g key={i}>
            <rect x={cx - 18} y={38} width={36} height={48} rx={6} fill="#8b5cf6" opacity={0.15 + (5 - i) * 0.12} stroke="#8b5cf6" />
            <text x={cx} y={66} textAnchor="middle" fontSize={11} fill="#4c1d95" fontFamily="monospace">L{96 - i * 16}</text>
          </g>
        );
      })}
      {[0, 1, 2, 3, 4].map((i) => {
        const cx = 68 + i * 72;
        return <path key={i} d={`M ${cx + 40} 62 L ${cx} 62`} stroke="#8b5cf6" strokeWidth={2} markerEnd="url(#bp-arrow)" />;
      })}
      <text x={240} y={112} textAnchor="middle" fontSize={11} fill="#8b5cf6" fontStyle="italic" fontWeight={600}>
        Chain rule nhân đạo hàm cục bộ ngược qua 96 lớp để ra ∂L/∂w.
      </text>
    </svg>
  );
}

function AdamWSketch() {
  return (
    <svg viewBox="0 0 480 150" className="w-full" role="img" aria-label="AdamW dùng momentum và variance để cập nhật trọng số">
      <title>AdamW — bước cập nhật thích ứng cho mỗi trọng số.</title>
      <defs>
        <marker id="aw-arrow" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--text-secondary)" />
        </marker>
      </defs>
      <rect x={20} y={20} width={120} height={50} rx={8} fill="#3b82f6" opacity={0.18} stroke="#3b82f6" />
      <text x={80} y={42} textAnchor="middle" fontSize={11} fill="#1e40af" fontWeight={600}>m (momentum)</text>
      <text x={80} y={60} textAnchor="middle" fontSize={11} fill="#1e40af" fontFamily="monospace">trung bình gradient</text>
      <rect x={160} y={20} width={120} height={50} rx={8} fill="#8b5cf6" opacity={0.18} stroke="#8b5cf6" />
      <text x={220} y={42} textAnchor="middle" fontSize={11} fill="#5b21b6" fontWeight={600}>v (variance)</text>
      <text x={220} y={60} textAnchor="middle" fontSize={11} fill="#5b21b6" fontFamily="monospace">grad bình phương</text>
      <path d="M 140 45 L 160 45" stroke="var(--text-secondary)" strokeWidth={1.5} />
      <path d="M 280 45 L 320 45" stroke="var(--text-secondary)" strokeWidth={1.5} markerEnd="url(#aw-arrow)" />
      <rect x={330} y={20} width={130} height={50} rx={8} fill="#22c55e" opacity={0.18} stroke="#22c55e" />
      <text x={395} y={42} textAnchor="middle" fontSize={11} fill="#166534" fontWeight={700}>bước thích ứng</text>
      <text x={395} y={60} textAnchor="middle" fontSize={11} fill="#166534" fontFamily="monospace">w giảm theo m / √v</text>
      <text x={240} y={110} textAnchor="middle" fontSize={11} fill="var(--text-secondary)" fontStyle="italic">
        Trọng số nào gradient to sẽ bị rút ngắn bước; gradient nhỏ được đẩy nhanh hơn.
      </text>
      <text x={240} y={128} textAnchor="middle" fontSize={11} fill="var(--text-tertiary)">
        Weight decay áp riêng — đây là &ldquo;W&rdquo; trong AdamW.
      </text>
    </svg>
  );
}

function ClipSketch() {
  return (
    <svg viewBox="0 0 480 160" className="w-full" role="img" aria-label="Gradient clipping cắt bớt norm gradient quá lớn">
      <title>Gradient clipping — chặn gradient vượt ngưỡng về bằng 1,0.</title>
      <line x1={30} y1={80} x2={450} y2={80} stroke="var(--border)" strokeWidth={1} />
      <line x1={240} y1={30} x2={240} y2={140} stroke="var(--border)" strokeWidth={1} />
      <text x={250} y={26} fontSize={11} fill="var(--text-tertiary)">gradient norm</text>
      <text x={458} y={84} fontSize={11} fill="var(--text-tertiary)" textAnchor="end">batch</text>
      <line x1={30} y1={55} x2={450} y2={55} stroke="#ef4444" strokeWidth={1} strokeDasharray="4,3" />
      <text x={440} y={50} fontSize={11} fill="#ef4444" fontWeight={600} textAnchor="end">clip = 1,0</text>
      {[60, 80, 50, 72, 140, 60, 48, 66, 74, 62].map((h, i) => {
        const x = 50 + i * 38;
        const capped = h > 50 ? 50 : h;
        return (
          <g key={i}>
            <rect x={x - 10} y={80 - h} width={20} height={h} rx={2} fill="#ef4444" opacity={0.22} />
            <rect x={x - 10} y={80 - capped} width={20} height={capped} rx={2} fill="#22c55e" opacity={0.75} />
            {h > 50 && <text x={x} y={80 - h - 4} textAnchor="middle" fontSize={11} fill="#ef4444" fontWeight={600}>bùng nổ</text>}
          </g>
        );
      })}
      <text x={240} y={154} textAnchor="middle" fontSize={11} fill="var(--text-secondary)" fontStyle="italic">
        Thanh đỏ nhạt = gradient thô. Thanh xanh = sau clip. Batch thứ 5 sẽ phá run nếu không clip.
      </text>
    </svg>
  );
}

function LoopSketch() {
  const labels = ["batch", "forward", "loss", "backward", "clip", "AdamW"];
  return (
    <svg viewBox="0 0 480 150" className="w-full" role="img" aria-label="Vòng lặp huấn luyện 6 bước lặp đi lặp lại">
      <title>Vòng lặp 6 bước, chạy 500 tỉ lần cho GPT-3.</title>
      {labels.map((lbl, i) => {
        const angle = (i / labels.length) * Math.PI * 2 - Math.PI / 2;
        const cx = 240 + Math.cos(angle) * 90;
        const cy = 75 + Math.sin(angle) * 55;
        return (
          <g key={lbl}>
            <circle cx={cx} cy={cy} r={26} fill="#3b82f6" opacity={0.15} stroke="#3b82f6" />
            <text x={cx} y={cy + 4} textAnchor="middle" fontSize={11} fill="#1e3a8a" fontWeight={600}>{lbl}</text>
          </g>
        );
      })}
      <circle cx={240} cy={75} r={40} fill="none" stroke="#3b82f6" strokeWidth={1.3} strokeDasharray="4,4" />
      <text x={240} y={78} textAnchor="middle" fontSize={11} fill="#3b82f6" fontWeight={700}>500 tỉ lần</text>
      <text x={240} y={146} textAnchor="middle" fontSize={11} fill="var(--text-secondary)" fontStyle="italic">
        Mỗi vòng ~vài trăm mili-giây trên GPT-3. 34 ngày = đủ số vòng để loss về gần đáy.
      </text>
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────
   QUIRK CARD + SKETCHES
   ──────────────────────────────────────────────────────────── */

interface QuirkCardProps {
  title: string;
  tagline: string;
  color: string;
  icon: typeof Flame;
  body: string;
  children: React.ReactNode;
}

function QuirkCard({ title, tagline, color, icon: Icon, body, children }: QuirkCardProps) {
  return (
    <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: color + "44", backgroundColor: color + "0E" }}>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0" style={{ backgroundColor: color + "22", color }}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-foreground">{title}</h4>
          <p className="text-[11px] font-mono" style={{ color }}>{tagline}</p>
        </div>
      </div>
      <p className="text-xs text-foreground/80 leading-relaxed">{body}</p>
      <div className="rounded-lg bg-card border border-border p-3">{children}</div>
    </div>
  );
}

function WarmupSketch() {
  const plotW = 420;
  const plotH = 120;
  const warmupEnd = 12;
  const totalSteps = 50;
  const peak = 0.00006;
  const points: { x: number; y: number }[] = [];
  for (let t = 0; t <= totalSteps; t++) {
    const eta = t <= warmupEnd ? (t / warmupEnd) * peak : peak - ((t - warmupEnd) / (totalSteps - warmupEnd)) * peak * 0.2;
    points.push({ x: t, y: eta });
  }
  const toPX = (x: number) => 40 + (x / totalSteps) * (plotW - 60);
  const toPY = (y: number) => plotH - 24 - (y / peak) * (plotH - 44);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${toPX(p.x).toFixed(1)} ${toPY(p.y).toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${plotW} ${plotH}`} className="w-full" role="img" aria-label="Learning rate tăng tuyến tính trong giai đoạn warmup">
      <title>Warmup — η tăng tuyến tính từ 0 tới đỉnh trong ~375 triệu token đầu.</title>
      <line x1={40} y1={plotH - 24} x2={plotW - 20} y2={plotH - 24} stroke="var(--border)" strokeWidth={1} />
      <line x1={40} y1={20} x2={40} y2={plotH - 24} stroke="var(--border)" strokeWidth={1} />
      <rect x={toPX(0)} y={20} width={toPX(warmupEnd) - toPX(0)} height={plotH - 44} fill="#0ea5e9" opacity={0.08} />
      <text x={toPX(warmupEnd / 2)} y={34} textAnchor="middle" fontSize={11} fill="#0c4a6e" fontWeight={600}>Warmup</text>
      <path d={path} fill="none" stroke="#0ea5e9" strokeWidth={2} />
      <text x={plotW - 22} y={plotH - 8} fontSize={11} fill="var(--text-tertiary)" textAnchor="end">số bước</text>
      <text x={10} y={30} fontSize={11} fill="var(--text-tertiary)">η</text>
    </svg>
  );
}

function DecaySketch() {
  const plotW = 420;
  const plotH = 120;
  const totalSteps = 60;
  const peak = 0.00006;
  const points: { x: number; y: number }[] = [];
  for (let t = 0; t <= totalSteps; t++) {
    const eta = peak * (0.1 + 0.9 * (0.5 * (1 + Math.cos((t / totalSteps) * Math.PI))));
    points.push({ x: t, y: eta });
  }
  const toPX = (x: number) => 40 + (x / totalSteps) * (plotW - 60);
  const toPY = (y: number) => plotH - 24 - (y / peak) * (plotH - 44);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${toPX(p.x).toFixed(1)} ${toPY(p.y).toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${plotW} ${plotH}`} className="w-full" role="img" aria-label="Learning rate decay theo cosine xuống 10% giá trị đỉnh">
      <title>Cosine decay — η giảm dần về cuối huấn luyện.</title>
      <line x1={40} y1={plotH - 24} x2={plotW - 20} y2={plotH - 24} stroke="var(--border)" strokeWidth={1} />
      <line x1={40} y1={20} x2={40} y2={plotH - 24} stroke="var(--border)" strokeWidth={1} />
      <line x1={40} y1={toPY(peak * 0.1)} x2={plotW - 20} y2={toPY(peak * 0.1)} stroke="#22c55e" strokeWidth={1} strokeDasharray="3,3" opacity={0.6} />
      <text x={plotW - 24} y={toPY(peak * 0.1) - 4} fontSize={11} fill="#22c55e" textAnchor="end">sàn = 10% đỉnh</text>
      <path d={path} fill="none" stroke="#22c55e" strokeWidth={2} />
      <text x={plotW - 22} y={plotH - 8} fontSize={11} fill="var(--text-tertiary)" textAnchor="end">số bước</text>
      <text x={10} y={30} fontSize={11} fill="var(--text-tertiary)">η</text>
    </svg>
  );
}

function ClippingCurveSketch() {
  const plotW = 420;
  const plotH = 120;
  const data = [
    { t: 0, norm: 0.9 }, { t: 1, norm: 1.1 }, { t: 2, norm: 0.75 }, { t: 3, norm: 2.4 },
    { t: 4, norm: 5.2 }, { t: 5, norm: 0.95 }, { t: 6, norm: 1.05 }, { t: 7, norm: 8.1 },
    { t: 8, norm: 1.15 }, { t: 9, norm: 0.85 }, { t: 10, norm: 1.0 }, { t: 11, norm: 0.9 },
  ];
  const maxNorm = 9;
  const toPX = (t: number) => 40 + (t / 11) * (plotW - 60);
  const toPY = (n: number) => plotH - 24 - (Math.min(maxNorm, n) / maxNorm) * (plotH - 44);
  const rawPath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${toPX(d.t)} ${toPY(d.norm)}`).join(" ");
  const clippedPath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${toPX(d.t)} ${toPY(Math.min(d.norm, 1))}`).join(" ");

  return (
    <svg viewBox={`0 0 ${plotW} ${plotH}`} className="w-full" role="img" aria-label="Gradient norm trước và sau khi clip">
      <title>Hai đường: gradient thô (đỏ) và sau clip (xanh). Hai batch dị thường bị khống chế về 1,0.</title>
      <line x1={40} y1={plotH - 24} x2={plotW - 20} y2={plotH - 24} stroke="var(--border)" strokeWidth={1} />
      <line x1={40} y1={20} x2={40} y2={plotH - 24} stroke="var(--border)" strokeWidth={1} />
      <line x1={40} y1={toPY(1)} x2={plotW - 20} y2={toPY(1)} stroke="#ef4444" strokeWidth={1} strokeDasharray="3,3" opacity={0.8} />
      <text x={plotW - 22} y={toPY(1) - 4} fontSize={11} fill="#ef4444" textAnchor="end">threshold 1,0</text>
      <path d={rawPath} fill="none" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="2,2" />
      <path d={clippedPath} fill="none" stroke="#22c55e" strokeWidth={2.2} />
      <text x={10} y={30} fontSize={11} fill="var(--text-tertiary)">norm</text>
      <text x={plotW - 22} y={plotH - 8} fontSize={11} fill="var(--text-tertiary)" textAnchor="end">batch</text>
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────
   CHEAT CARD
   ──────────────────────────────────────────────────────────── */

type CheatTone = "success" | "warning" | "info" | "danger";

interface CheatCardProps {
  title: string;
  body: string;
  tone: CheatTone;
}

function CheatCard({ title, body, tone }: CheatCardProps) {
  const colors: Record<CheatTone, { border: string; bg: string; text: string; icon: typeof Flame }> = {
    success: { border: "#22c55e", bg: "rgba(34,197,94,0.08)", text: "#15803d", icon: Target },
    warning: { border: "#f59e0b", bg: "rgba(245,158,11,0.08)", text: "#92400e", icon: Activity },
    info: { border: "#0ea5e9", bg: "rgba(14,165,233,0.08)", text: "#0c4a6e", icon: Snowflake },
    danger: { border: "#ef4444", bg: "rgba(239,68,68,0.08)", text: "#991b1b", icon: AlertTriangle },
  };
  const c = colors[tone];
  const Icon = c.icon;
  return (
    <div className="rounded-lg border-l-4 p-3 space-y-1.5" style={{ borderLeftColor: c.border, backgroundColor: c.bg }}>
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: c.text }} />
        <p className="text-xs font-bold" style={{ color: c.text }}>{title}</p>
      </div>
      <p className="text-[11px] text-foreground/85 leading-snug">{body}</p>
    </div>
  );
}
