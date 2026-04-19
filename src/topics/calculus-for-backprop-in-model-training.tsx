"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dice5,
  Target,
  Gauge,
  ArrowDownToLine,
  RefreshCw,
  Flame,
  Snowflake,
  Wind,
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
  slug: "calculus-for-backprop-in-model-training",
  title: "Calculus for Backpropagation in Model Training",
  titleVi: "Giải tích trong huấn luyện mô hình",
  description:
    "Bên trong một vòng lặp huấn luyện: weights ngẫu nhiên → dự đoán → loss → gradient → cập nhật. Mỗi bước là một phép tính đạo hàm.",
  category: "math-foundations",
  tags: ["calculus", "backpropagation", "training-loop", "learning-rate"],
  difficulty: "intermediate",
  relatedSlugs: ["calculus-for-backprop", "gradient-intuition", "gradient-descent"],
  vizType: "interactive",
  applicationOf: "calculus-for-backprop",
  featuredApp: {
    name: "LLaMA 3.1",
    productFeature: "Huấn luyện mô hình 405 tỉ tham số",
    company: "Meta Platforms Inc.",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "The Llama 3 Herd of Models",
      publisher: "Meta AI, 2024",
      url: "https://arxiv.org/abs/2407.21783",
      date: "2024-07",
      kind: "paper",
    },
    {
      title: "LLaMA: Open and Efficient Foundation Language Models",
      publisher: "Hugo Touvron et al. — Meta AI, 2023",
      url: "https://arxiv.org/abs/2302.13971",
      date: "2023-02",
      kind: "paper",
    },
    {
      title:
        "Efficient Large-Scale Language Model Training on GPU Clusters Using Megatron-LM",
      publisher: "Deepak Narayanan et al. — SC 2021",
      url: "https://arxiv.org/abs/2104.04473",
      date: "2021-11",
      kind: "paper",
    },
  ],
  tocSections: [
    { id: "hero", labelVi: "Công ty nào?" },
    { id: "problem", labelVi: "Vấn đề" },
    { id: "mechanism", labelVi: "Vòng lặp huấn luyện" },
    { id: "metrics", labelVi: "Con số thật" },
    { id: "counterfactual", labelVi: "Nếu không có" },
  ],
};

/* ────────────────────────────────────────────────────────────
   SIMULATION — một vòng lặp huấn luyện đơn giản hoá
   Loss: L(w) = (w − 2)² + 0.2 quanh một minimum tại w = 2.
   Update: w ← w − η · dL/dw = w − η · 2(w − 2)
   ──────────────────────────────────────────────────────────── */

interface EpochPoint {
  epoch: number;
  w: number;
  loss: number;
}

function simulateTraining(lr: number, startW: number, epochs: number): EpochPoint[] {
  const points: EpochPoint[] = [];
  let w = startW;
  for (let i = 0; i <= epochs; i++) {
    const loss = (w - 2) ** 2 + 0.2;
    points.push({ epoch: i, w, loss });
    // Safety: clamp extremes so we can still render
    const grad = 2 * (w - 2);
    w = w - lr * grad;
    if (!Number.isFinite(w) || Math.abs(w) > 60) {
      // Cap: simulate explosion
      points.push({
        epoch: i + 1,
        w: Math.sign(w) * 60 || 60,
        loss: 60 * 60,
      });
      break;
    }
  }
  return points;
}

function classifyRun(points: EpochPoint[]): {
  label: string;
  tone: "converge" | "slow" | "oscillate" | "explode";
  note: string;
  accent: string;
  icon: typeof Flame;
} {
  if (points.length < 3) {
    return {
      label: "Không đủ dữ liệu",
      tone: "slow",
      accent: "#6b7280",
      note: "",
      icon: Wind,
    };
  }
  const finalLoss = points[points.length - 1].loss;
  const firstLoss = points[0].loss;
  const maxLoss = Math.max(...points.map((p) => p.loss));

  if (maxLoss > firstLoss * 5) {
    return {
      label: "Phân kỳ — loss nổ tung",
      tone: "explode",
      accent: "#ef4444",
      note: "Learning rate quá lớn: bước cập nhật nhảy QUA đáy thung lũng, sang sườn bên kia còn DỐC hơn. Lặp lại → loss tăng lên vô cùng.",
      icon: Flame,
    };
  }

  // Oscillation: successive losses bounce around in alternating directions
  let flips = 0;
  for (let i = 2; i < points.length; i++) {
    const a = points[i].loss - points[i - 1].loss;
    const b = points[i - 1].loss - points[i - 2].loss;
    if (a * b < 0) flips++;
  }
  if (flips > points.length * 0.3) {
    return {
      label: "Dao động mạnh",
      tone: "oscillate",
      accent: "#f59e0b",
      note: "Learning rate hơi to: mỗi bước bước QUA minimum rồi bật ngược, rồi lại bước qua… Loss giảm nhưng nảy tưng tưng quanh đáy thay vì yên vị.",
      icon: Wind,
    };
  }

  if (finalLoss < 0.3) {
    return {
      label: "Hội tụ êm",
      tone: "converge",
      accent: "#22c55e",
      note: "Learning rate vừa phải: mỗi bước rút ngắn khoảng cách tới đáy thung lũng, loss giảm đều và dừng yên ở minimum.",
      icon: Target,
    };
  }

  return {
    label: "Đi quá chậm",
    tone: "slow",
    accent: "#0ea5e9",
    note: "Learning rate quá nhỏ: mỗi bước nhích một chút xíu. Đúng hướng, nhưng cần HÀNG TRIỆU bước để về đáy — lãng phí thời gian GPU.",
    icon: Snowflake,
  };
}

/* ────────────────────────────────────────────────────────────
   HELPER — Mini pipeline visual (used in beats)
   ──────────────────────────────────────────────────────────── */

interface PipelineNodeSpec {
  id: string;
  label: string;
  sub: string;
  color: string;
  icon: typeof Dice5;
}

const PIPELINE_NODES: PipelineNodeSpec[] = [
  { id: "init", label: "Weights", sub: "ngẫu nhiên", color: "#94a3b8", icon: Dice5 },
  { id: "predict", label: "Dự đoán", sub: "forward pass", color: "#3b82f6", icon: Target },
  { id: "loss", label: "Loss", sub: "đo sai", color: "#f59e0b", icon: Gauge },
  { id: "grad", label: "Gradient", sub: "backprop", color: "#8b5cf6", icon: Wind },
  { id: "update", label: "Cập nhật", sub: "w ← w − η∇L", color: "#22c55e", icon: ArrowDownToLine },
];

function PipelineStrip({ highlighted }: { highlighted?: string }) {
  return (
    <svg viewBox="0 0 680 110" className="w-full" role="img" aria-label="Vòng lặp huấn luyện: khởi tạo ngẫu nhiên → dự đoán → loss → gradient → cập nhật.">
      <title>Pipeline huấn luyện 5 bước nối tiếp.</title>
      {PIPELINE_NODES.map((node, i) => {
        const Icon = node.icon;
        const cx = 70 + i * 135;
        const isActive = highlighted === node.id;
        return (
          <g key={node.id}>
            {isActive && (
              <rect
                x={cx - 54}
                y={14}
                width={108}
                height={80}
                rx={12}
                fill={node.color}
                opacity={0.14}
              />
            )}
            <rect
              x={cx - 50}
              y={18}
              width={100}
              height={64}
              rx={10}
              fill="var(--bg-card)"
              stroke={isActive ? node.color : "var(--border)"}
              strokeWidth={isActive ? 2.5 : 1.5}
            />
            <foreignObject x={cx - 10} y={24} width={20} height={20}>
              <div
                style={{
                  color: node.color,
                  width: 20,
                  height: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon width={18} height={18} />
              </div>
            </foreignObject>
            <text
              x={cx}
              y={60}
              textAnchor="middle"
              fontSize={11}
              fontWeight={700}
              fill={isActive ? node.color : "var(--text-primary)"}
            >
              {node.label}
            </text>
            <text
              x={cx}
              y={75}
              textAnchor="middle"
              fontSize={9}
              fill="var(--text-tertiary)"
              fontFamily="monospace"
            >
              {node.sub}
            </text>
            {i < PIPELINE_NODES.length - 1 && (
              <g>
                <line
                  x1={cx + 52}
                  y1={50}
                  x2={cx + 80}
                  y2={50}
                  stroke="var(--border)"
                  strokeWidth={1.5}
                />
                <path
                  d={`M ${cx + 78} 46 L ${cx + 84} 50 L ${cx + 78} 54 Z`}
                  fill="var(--text-secondary)"
                />
              </g>
            )}
          </g>
        );
      })}
      {/* Loop-back arrow */}
      <path
        d="M 620 20 C 680 0, 680 -10, 660 10 M 60 10 C 10 10, 10 -10, 60 10"
        stroke="transparent"
        fill="none"
      />
      <path
        d="M 660 18 Q 700 -10 340 0 Q 10 10 60 18"
        stroke="var(--text-tertiary)"
        strokeWidth={1}
        strokeDasharray="3,3"
        fill="none"
        opacity={0.5}
      />
      <text
        x={340}
        y={10}
        textAnchor="middle"
        fontSize={10}
        fill="var(--text-tertiary)"
        fontStyle="italic"
      >
        lặp lại hàng triệu lần
      </text>
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────
   COMPONENT CHÍNH
   ──────────────────────────────────────────────────────────── */

export default function CalculusForBackpropInModelTraining() {
  /* ── Mini hero viz — auto-cycling pipeline ── */
  const [heroStep, setHeroStep] = useState<string>("init");

  /* ── Mechanism interactive state ── */
  const [activeBeat, setActiveBeat] = useState<number>(1);

  /* ── Simulated training loop with learning rate slider lives inside SliderGroup ── */

  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Giải tích cho backprop"
    >
      {/* ━━━ HERO — giới thiệu + training loop visualization ━━━ */}
      <ApplicationHero
        parentTitleVi="Giải tích cho backprop"
        topicSlug={metadata.slug}
      >
        <p>
          Tháng 1 năm 2024, Meta bắt đầu huấn luyện <strong>LLaMA 3.1 405B</strong>{" "}
          — mô hình ngôn ngữ có 405 tỉ tham số. 16.384 GPU H100 chạy liên tục 54
          ngày. Mỗi giây trôi qua, mỗi tham số đều được{" "}
          <strong>hỏi một câu duy nhất</strong>: &ldquo;Nếu tôi nhích một tí, loss
          thay đổi bao nhiêu?&rdquo;
        </p>
        <p>
          Đó chính là <strong>đạo hàm</strong>. Và để trả lời câu hỏi đó cho cả 405
          tỉ tham số trong vài trăm mili-giây, Meta dùng một vòng lặp 5 bước
          không thay đổi từ thời Rosenblatt:
        </p>

        <div className="not-prose my-4 rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted mb-3 leading-relaxed">
            Di chuột qua một bước để xem vai trò của nó trong vòng lặp:
          </p>

          {/* Interactive pipeline strip */}
          <div
            onPointerLeave={() => setHeroStep("init")}
            className="select-none"
          >
            <PipelineStrip highlighted={heroStep} />
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {PIPELINE_NODES.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onPointerEnter={() => setHeroStep(n.id)}
                  onFocus={() => setHeroStep(n.id)}
                  onClick={() => setHeroStep(n.id)}
                  className="rounded-full px-3 py-1 text-xs font-semibold border transition-colors"
                  style={{
                    borderColor: heroStep === n.id ? n.color : "var(--border)",
                    color: heroStep === n.id ? n.color : "var(--text-secondary)",
                    backgroundColor:
                      heroStep === n.id ? n.color + "18" : "transparent",
                  }}
                >
                  {n.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={heroStep}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="mt-3 rounded-lg bg-surface border border-border p-3 text-sm text-foreground/85 leading-relaxed"
              >
                {heroStep === "init" && (
                  <>
                    <strong>Khởi tạo.</strong> Mọi weight đều là số ngẫu nhiên
                    — mô hình không biết gì. Loss rất cao. Đây là điểm xuất phát.
                  </>
                )}
                {heroStep === "predict" && (
                  <>
                    <strong>Dự đoán (forward).</strong> Cho một batch dữ liệu, mô
                    hình chạy từ input qua 126 lớp Transformer, tạo ra đầu ra &ŷ.
                  </>
                )}
                {heroStep === "loss" && (
                  <>
                    <strong>Loss.</strong> So &ŷ với nhãn thật y bằng hàm
                    cross-entropy. Kết quả là một con số: càng nhỏ, mô hình càng đúng.
                  </>
                )}
                {heroStep === "grad" && (
                  <>
                    <strong>Gradient (backward).</strong> Đây là lúc đạo hàm và
                    quy tắc chuỗi vào cuộc. Backprop đi ngược từ loss về từng
                    weight, trả lời: &ldquo;weight này nên nhích bao nhiêu?&rdquo;
                  </>
                )}
                {heroStep === "update" && (
                  <>
                    <strong>Cập nhật.</strong> Mỗi weight nhích một chút theo
                    công thức w ← w − η·dL/dw. Với η (learning rate) đủ nhỏ, loss
                    giảm. Rồi quay về bước 2. Lặp lại hàng triệu lần.
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <p>
          Bài này cho bạn nhìn từng bước trong vòng lặp đó, với một mô hình nhỏ
          xíu — chỉ một weight — để bạn thấy <strong>đạo hàm thực sự làm gì</strong>{" "}
          khi learning rate quá to, quá nhỏ, và vừa đủ.
        </p>
      </ApplicationHero>

      {/* ━━━ PROBLEM ━━━ */}
      <ApplicationProblem topicSlug={metadata.slug}>
        <p>
          LLaMA 3.1 405B phải học từ <strong>15,6 nghìn tỉ token</strong> (đơn vị
          văn bản). Mỗi lần đi qua một batch, mô hình cần điều chỉnh 405 tỉ tham
          số — cộng lại là con số khổng lồ.
        </p>
        <p>
          Vấn đề gốc rễ: <strong>không thể thử từng tham số một</strong>. Nếu mỗi
          lần muốn biết gradient của một tham số, ta phải chạy lại forward pass,
          thì sẽ cần 405 tỉ forward pass cho một bước cập nhật duy nhất — không
          thể nào xong trong một đời người. Chain rule biến bài toán đó từ không
          khả thi thành khả thi.
        </p>

        <div className="not-prose my-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              title: "405 tỉ tham số",
              desc: "Mỗi tham số là một weight cần được điều chỉnh theo gradient của nó.",
              color: "#3b82f6",
            },
            {
              title: "126 lớp nối tiếp",
              desc: "Mạng sâu → chain rule nhân hàng trăm đạo hàm cục bộ xuyên qua các lớp.",
              color: "#8b5cf6",
            },
            {
              title: "3,8 × 10²⁵ FLOP",
              desc: "Tổng phép tính. Không có chain rule + song song hoá, bài toán là bất khả thi.",
              color: "#ec4899",
            },
          ].map((c) => (
            <div
              key={c.title}
              className="rounded-xl border bg-card p-4 space-y-1.5"
              style={{ borderLeft: `4px solid ${c.color}` }}
            >
              <p className="text-sm font-bold text-foreground">{c.title}</p>
              <p className="text-xs text-muted leading-snug">{c.desc}</p>
            </div>
          ))}
        </div>
      </ApplicationProblem>

      {/* ━━━ MECHANISM — mỗi beat có visual nhỏ ━━━ */}
      <ApplicationMechanism
        parentTitleVi="Giải tích cho backprop"
        topicSlug={metadata.slug}
      >
        <Beat step={1}>
          <p>
            <strong>Forward pass — dự đoán từ weights hiện tại.</strong> Đưa một
            batch dữ liệu (hàng triệu token) qua 126 lớp Transformer. Mỗi lớp
            thực hiện phép nhân ma trận rồi hàm kích hoạt. Cuối cùng, cross-entropy
            ra một con số duy nhất L — sai lệch hiện tại.
          </p>
          <div className="not-prose mt-3">
            <MechanismBeatVisual activeBeat={activeBeat} beatIndex={1} />
            <BeatToggle active={activeBeat === 1} onClick={() => setActiveBeat(1)} />
          </div>
        </Beat>

        <Beat step={2}>
          <p>
            <strong>Backward pass — chain rule trôi ngược.</strong> Đây là nơi đạo
            hàm vào cuộc. Thuật toán backprop đi ngược từ L qua từng lớp:{" "}
            <em>∂L/∂w = ∂L/∂aₙ · ∂aₙ/∂aₙ₋₁ · … · ∂a₁/∂w</em>. Mỗi lớp chỉ cần tính
            đạo hàm cục bộ của mình, rồi nhân với gradient truyền từ lớp sau.
          </p>
          <div className="not-prose mt-3">
            <MechanismBeatVisual activeBeat={activeBeat} beatIndex={2} />
            <BeatToggle active={activeBeat === 2} onClick={() => setActiveBeat(2)} />
          </div>
        </Beat>

        <Beat step={3}>
          <p>
            <strong>AdamW — bộ tối ưu thông minh hơn gradient descent cơ bản.</strong>{" "}
            Thay vì trừ thẳng gradient, AdamW theo dõi trung bình động của
            gradient và gradient bình phương, rồi điều chỉnh bước cập nhật cho
            từng tham số riêng. Kết quả: hội tụ ổn định hơn trên không gian 405
            tỉ chiều, ít nhạy với lựa chọn learning rate.
          </p>
          <div className="not-prose mt-3">
            <MechanismBeatVisual activeBeat={activeBeat} beatIndex={3} />
            <BeatToggle active={activeBeat === 3} onClick={() => setActiveBeat(3)} />
          </div>
        </Beat>

        <Beat step={4}>
          <p>
            <strong>Gradient checkpointing — đánh đổi tính toán lấy bộ nhớ.</strong>{" "}
            Mỗi GPU H100 chỉ có 80 GB HBM3 — không đủ lưu toàn bộ giá trị trung
            gian cho 126 lớp. Giải pháp: chỉ lưu tại một vài lớp &ldquo;mốc&rdquo;,
            phần còn lại tính lại khi backprop cần. Giảm bộ nhớ từ O(n) xuống O(√n)
            nhưng tăng khoảng 30% tính toán.
          </p>
          <div className="not-prose mt-3">
            <MechanismBeatVisual activeBeat={activeBeat} beatIndex={4} />
            <BeatToggle active={activeBeat === 4} onClick={() => setActiveBeat(4)} />
          </div>
        </Beat>

        <Beat step={5}>
          <p>
            <strong>Song song hoá 16.384 GPU.</strong> Meta kết hợp ba chiến lược:
            tensor parallelism (chia từng lớp ra nhiều GPU), pipeline parallelism
            (chia các lớp thành nhóm nối tiếp), data parallelism (mỗi nhóm GPU
            xử lý batch riêng rồi đồng bộ gradient). Tất cả gradient vẫn được tính
            bằng cùng công thức chain rule — chỉ khác là được phân tán ra nghìn
            máy.
          </p>
          <div className="not-prose mt-3">
            <MechanismBeatVisual activeBeat={activeBeat} beatIndex={5} />
            <BeatToggle active={activeBeat === 5} onClick={() => setActiveBeat(5)} />
          </div>
        </Beat>

        {/* ── REVEAL: Learning rate simulator ── */}
        <li className="mt-8">
          <div className="rounded-2xl border-2 border-accent/30 bg-accent-light p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white">
                <Gauge className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Thí nghiệm: kéo learning rate, xem loss hạ — hoặc nổ
                </h3>
                <p className="text-xs text-muted">
                  Mô hình thu nhỏ: 1 weight, loss L(w) = (w − 2)² + 0.2. Đáp án:
                  w = 2.
                </p>
              </div>
            </div>

            <SliderGroup
              sliders={[
                {
                  key: "lr",
                  label: "Learning rate η",
                  min: 0.005,
                  max: 1.2,
                  step: 0.005,
                  defaultValue: 0.1,
                },
                {
                  key: "startW",
                  label: "Weight khởi tạo w₀",
                  min: -4,
                  max: 8,
                  step: 0.1,
                  defaultValue: 6,
                },
              ]}
              visualization={(values) => {
                const { lr, startW } = values;
                return (
                  <TrainingLossChart lr={lr} startW={startW} epochs={30} />
                );
              }}
            />

            <Callout variant="tip" title="Thực tế ở Meta">
              Cho LLaMA 3.1 405B, Meta dùng learning rate đỉnh khoảng 8 × 10⁻⁵ với
              lịch cosine warmup/decay. Không ai chọn số đó bằng tay — nó đến từ
              hàng trăm run thử nghiệm trên mô hình nhỏ, rồi scale theo công thức
              đã kiểm chứng. Một learning rate sai lệch 10× có thể làm hư toàn bộ
              run 54 ngày.
            </Callout>
          </div>
        </li>

        {/* ── DEEPEN: StepReveal one training iteration with moving data ── */}
        <li className="mt-6">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Bên trong MỘT vòng lặp — dữ liệu di chuyển thế nào
                </h3>
                <p className="text-xs text-muted">
                  Bấm &ldquo;Tiếp tục&rdquo; để thấy từng giai đoạn với dữ liệu
                  thật chảy qua.
                </p>
              </div>
            </div>

            <StepReveal
              labels={[
                "1 · Forward",
                "2 · Loss",
                "3 · Backward",
                "4 · Update",
              ]}
            >
              <IterationStep
                kind="forward"
                title="Forward pass — input chảy xuôi"
                description="Một batch (ví dụ 4 triệu token của LLaMA) chảy qua các lớp. Mỗi lớp nhận vector từ lớp trước, nhân ma trận, kích hoạt, đẩy sang lớp sau. Cuối chuỗi: đầu ra ŷ."
              />
              <IterationStep
                kind="loss"
                title="Tính loss"
                description="So ŷ với nhãn y bằng cross-entropy. Kết quả: một con số duy nhất L. Với LLaMA 3.1 đầu huấn luyện, L thường khoảng 10; cuối 54 ngày giảm về ~1.5."
              />
              <IterationStep
                kind="backward"
                title="Backward pass — gradient chảy ngược"
                description="Bắt đầu từ L, tính ∂L/∂ŷ. Rồi chain rule nhân ngược qua 126 lớp. Mỗi lớp tự biết ∂(output)/∂(input) của mình — backprop nối chúng lại. Khi xong, mỗi weight w có một con số ∂L/∂w."
              />
              <IterationStep
                kind="update"
                title="Update — weights nhích xuống đồi"
                description="w ← w − η · ∂L/∂w. Với AdamW, có thêm hai moving average điều chỉnh bước cho từng weight. Sau bước này, mọi weight đã mới hơn một chút. Rồi quay về bước 1 với batch dữ liệu kế tiếp."
              />
            </StepReveal>
          </div>
        </li>

        {/* ── CHALLENGE ── */}
        <li className="mt-6">
          <InlineChallenge
            question="Trong thí nghiệm ở trên, bạn kéo η lên 0.9. Loss đầu tiên giảm, nhưng sau đó loss NHẢY TUNG lên rồi phân kỳ. Tại sao?"
            options={[
              "Vì mô hình quên mất nhãn y — gradient đảo dấu",
              "Vì mỗi bước cập nhật (η · gradient) quá lớn — nhảy QUA minimum sang sườn bên kia còn dốc hơn, gradient ở đó lớn hơn, bước kế tiếp nhảy lại xa hơn → vòng lặp leo lên vô cùng",
              "Vì chain rule không còn chính xác khi η > 0.5",
              "Vì batch size quá nhỏ nên gradient không đáng tin",
            ]}
            correct={1}
            explanation="Gradient descent giả định một bước nhỏ xuống dốc sẽ làm loss giảm. Nếu η quá to, bước đó vượt QUA đáy và rơi xuống phía dốc hơn. Gradient tại điểm mới LỚN HƠN → bước kế tiếp còn xa hơn → loss leo lên theo hàm mũ. Trong thực tế, đây là lý do Meta dùng gradient clipping + warmup: tránh bước đầu quá mạnh làm hư toàn bộ run."
          />
        </li>

        {/* ── Post-challenge: decision helper ── */}
        <li className="mt-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Flame className="h-4 w-4 text-accent" /> Ba dấu hiệu loss đang
              &ldquo;kêu cứu&rdquo; trong quá trình huấn luyện
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-3 space-y-1">
                <p className="text-xs font-bold text-rose-700 dark:text-rose-300">
                  Loss = NaN
                </p>
                <p className="text-[11px] text-foreground/80 leading-relaxed">
                  Gradient phát nổ. Giảm η, bật gradient clipping, kiểm tra khởi
                  tạo weight.
                </p>
              </div>
              <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 space-y-1">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                  Loss đứng yên
                </p>
                <p className="text-[11px] text-foreground/80 leading-relaxed">
                  η quá nhỏ hoặc vanishing gradient. Tăng η, đổi activation sang
                  ReLU, thêm residual.
                </p>
              </div>
              <div className="rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/20 p-3 space-y-1">
                <p className="text-xs font-bold text-sky-700 dark:text-sky-300">
                  Loss giảm → tăng lại
                </p>
                <p className="text-[11px] text-foreground/80 leading-relaxed">
                  η đột ngột quá lớn (thường do dữ liệu batch dị thường). Thêm
                  gradient clipping, kiểm tra pipeline.
                </p>
              </div>
            </div>
          </div>
        </li>

        {/* ── Summary + redirect back to concept ── */}
        <li className="mt-6">
          <MiniSummary
            title="Điều bạn thấy rõ hôm nay"
            points={[
              "Vòng lặp huấn luyện là 5 bước lặp đi lặp lại: init → forward → loss → backward → update.",
              "Backward là nơi ĐẠO HÀM và CHAIN RULE thực sự làm việc — tính gradient cho 405 tỉ tham số trong vài trăm mili-giây.",
              "Learning rate là tham số hiệu chỉnh quan trọng nhất: quá to → nổ, quá nhỏ → không bao giờ tới đáy, vừa phải → hội tụ.",
              "Mọi trick tiên tiến (AdamW, gradient checkpointing, mixed precision, gradient clipping, warmup) đều phục vụ một mục tiêu duy nhất: giữ vòng lặp trên ổn định khi scale lên tỉ tham số.",
            ]}
          />
          <div className="mt-4">
            <Callout variant="insight" title="Trở lại lý thuyết">
              Muốn hiểu vì sao chain rule lại biến bài toán không khả thi thành
              khả thi, quay lại bài{" "}
              <TopicLink slug="calculus-for-backprop">
                Giải tích cho backprop
              </TopicLink>
              . Muốn cảm nhận gradient trên mặt 2D tương tác, xem{" "}
              <TopicLink slug="gradient-intuition">
                Gradient — mũi tên chỉ đường xuống dốc
              </TopicLink>
              .
            </Callout>
          </div>
        </li>
      </ApplicationMechanism>

      {/* ━━━ METRICS ━━━ */}
      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug={metadata.slug}
      >
        <Metric
          value="405 tỉ tham số, 3,8 × 10²⁵ FLOP tổng cộng để huấn luyện LLaMA 3.1"
          sourceRef={1}
        />
        <Metric
          value="16.384 GPU H100, 54 ngày huấn luyện liên tục, 30,84 triệu giờ GPU"
          sourceRef={1}
        />
        <Metric
          value="15,6 nghìn tỉ token dữ liệu huấn luyện — mỗi token tham gia ít nhất một lần vào backprop"
          sourceRef={1}
        />
        <Metric
          value="Megatron-LM đạt 52% hiệu suất đỉnh GPU nhờ song song hoá gradient qua tensor + pipeline parallelism"
          sourceRef={3}
        />
        <Metric
          value="LLaMA-13B (13 tỉ tham số) vượt GPT-3 175B trên nhiều benchmark — cùng thuật toán backprop + chọn lọc kỹ dữ liệu và tối ưu"
          sourceRef={2}
        />
      </ApplicationMetrics>

      {/* ━━━ COUNTERFACTUAL ━━━ */}
      <ApplicationCounterfactual
        parentTitleVi="Giải tích cho backprop"
        topicSlug={metadata.slug}
      >
        <p>
          Không có chain rule, không có cách nào tính gradient cho 405 tỉ tham số
          qua 126 lớp. Mỗi tham số sẽ phải được thử sai riêng lẻ — cần hàng trăm
          tỉ lần forward pass cho một bước cập nhật duy nhất, biến bài toán 54
          ngày thành hàng triệu năm.
        </p>
        <p>
          Backpropagation biến chi phí tính gradient từ O(n) forward pass xuống{" "}
          <strong>O(1)</strong> — chỉ cần một lần lan truyền ngược. Kết hợp với
          AdamW, gradient checkpointing, song song hoá 16.384 GPU và mixed
          precision BF16, giải tích là nền tảng toán học duy nhất khiến việc huấn
          luyện mô hình hàng trăm tỉ tham số trở nên khả thi.
        </p>
        <p className="mt-3">
          <strong>Bài học rút ra:</strong> learning rate không phải hyperparameter
          &ldquo;tùy hứng&rdquo;. Nó là nút chỉnh cỡ bước của gradient descent, và
          sai 10× có thể hỏng 54 ngày GPU. Đó là lý do các đội huấn luyện mô hình
          lớn chi hàng triệu đô-la để tinh chỉnh đúng giá trị η trước khi bấm nút
          &ldquo;start&rdquo;.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}

/* ────────────────────────────────────────────────────────────
   SUB-COMPONENTS
   ──────────────────────────────────────────────────────────── */

function BeatToggle({
  active,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold border transition-colors ${
        active
          ? "border-accent bg-accent text-white"
          : "border-border bg-card text-muted hover:border-accent/50"
      }`}
      aria-pressed={active}
    >
      {active ? "Đang xem" : "Xem hình mô tả"}
    </button>
  );
}

/** Visual per beat — tiny schematic that expands when the beat is active. */
function MechanismBeatVisual({
  activeBeat,
  beatIndex,
}: {
  activeBeat: number;
  beatIndex: number;
}) {
  const isActive = activeBeat === beatIndex;

  return (
    <AnimatePresence initial={false}>
      {isActive && (
        <motion.div
          key={`beat-${beatIndex}`}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="rounded-xl border border-border bg-surface/50 p-4 my-2">
            {beatIndex === 1 && <ForwardPassSketch />}
            {beatIndex === 2 && <BackwardPassSketch />}
            {beatIndex === 3 && <AdamWSketch />}
            {beatIndex === 4 && <CheckpointSketch />}
            {beatIndex === 5 && <ParallelSketch />}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ForwardPassSketch() {
  return (
    <svg viewBox="0 0 480 140" className="w-full" role="img" aria-label="Forward pass: input chảy qua các lớp Transformer thành output.">
      <title>Forward pass qua các lớp Transformer.</title>
      <text x={20} y={20} fontSize={11} fill="var(--text-secondary)">
        Batch (tokens)
      </text>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const cx = 60 + i * 70;
        return (
          <g key={i}>
            <rect
              x={cx - 18}
              y={50}
              width={36}
              height={50}
              rx={6}
              fill="#3b82f6"
              opacity={0.15 + i * 0.13}
              stroke="#3b82f6"
            />
            <text
              x={cx}
              y={78}
              textAnchor="middle"
              fontSize={9}
              fill="#1e3a8a"
              fontFamily="monospace"
            >
              L{i + 1}
            </text>
          </g>
        );
      })}
      {/* Arrows left to right */}
      {[0, 1, 2, 3, 4].map((i) => {
        const cx = 78 + i * 70;
        return (
          <path
            key={`arr-${i}`}
            d={`M ${cx} 75 L ${cx + 30} 75`}
            stroke="#3b82f6"
            strokeWidth={2}
            markerEnd="url(#fwd-arrow)"
          />
        );
      })}
      <defs>
        <marker id="fwd-arrow" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 z" fill="#3b82f6" />
        </marker>
      </defs>
      <text x={440} y={78} fontSize={11} fill="#3b82f6" fontWeight={700}>
        → ŷ
      </text>
      <text x={240} y={130} textAnchor="middle" fontSize={10} fill="var(--text-secondary)" fontStyle="italic">
        126 lớp Transformer nối tiếp, mỗi lớp nhân ma trận + activation
      </text>
    </svg>
  );
}

function BackwardPassSketch() {
  return (
    <svg viewBox="0 0 480 140" className="w-full" role="img" aria-label="Backward pass: gradient chảy ngược qua các lớp bằng chain rule.">
      <title>Backward pass — chain rule nhân gradient qua các lớp.</title>
      <text x={20} y={20} fontSize={11} fill="var(--text-secondary)">
        Loss L
      </text>
      <text x={420} y={20} fontSize={11} fill="var(--text-secondary)">
        ∂L/∂w (input layer)
      </text>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const cx = 60 + i * 70;
        return (
          <g key={i}>
            <rect
              x={cx - 18}
              y={50}
              width={36}
              height={50}
              rx={6}
              fill="#8b5cf6"
              opacity={0.15 + (5 - i) * 0.13}
              stroke="#8b5cf6"
            />
            <text x={cx} y={78} textAnchor="middle" fontSize={9} fill="#4c1d95" fontFamily="monospace">
              L{i + 1}
            </text>
            <text x={cx} y={118} textAnchor="middle" fontSize={8} fill="#8b5cf6" fontFamily="monospace">
              ∂aᵢ/∂aᵢ₋₁
            </text>
          </g>
        );
      })}
      {/* Arrows right to left */}
      {[0, 1, 2, 3, 4].map((i) => {
        const cx = 78 + i * 70;
        return (
          <path
            key={`arr-${i}`}
            d={`M ${cx + 30} 75 L ${cx} 75`}
            stroke="#8b5cf6"
            strokeWidth={2}
            markerEnd="url(#bck-arrow)"
          />
        );
      })}
      <defs>
        <marker id="bck-arrow" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 z" fill="#8b5cf6" />
        </marker>
      </defs>
      <text x={240} y={136} textAnchor="middle" fontSize={10} fill="#8b5cf6" fontStyle="italic" fontWeight={600}>
        chain rule: nhân các đạo hàm cục bộ ngược qua 126 lớp
      </text>
    </svg>
  );
}

function AdamWSketch() {
  return (
    <svg viewBox="0 0 480 140" className="w-full" role="img" aria-label="AdamW — hai moving average điều chỉnh bước cập nhật cho từng weight.">
      <title>AdamW — gradient + bình phương gradient → bước cập nhật thích ứng.</title>
      <rect x={40} y={30} width={110} height={50} rx={8} fill="#3b82f6" opacity={0.18} stroke="#3b82f6" />
      <text x={95} y={52} textAnchor="middle" fontSize={11} fill="#1e40af" fontWeight={600}>
        m̂ (momentum)
      </text>
      <text x={95} y={70} textAnchor="middle" fontSize={9} fill="#1e40af" fontFamily="monospace">
        trung bình gradient
      </text>

      <rect x={170} y={30} width={110} height={50} rx={8} fill="#8b5cf6" opacity={0.18} stroke="#8b5cf6" />
      <text x={225} y={52} textAnchor="middle" fontSize={11} fill="#5b21b6" fontWeight={600}>
        v̂ (variance)
      </text>
      <text x={225} y={70} textAnchor="middle" fontSize={9} fill="#5b21b6" fontFamily="monospace">
        grad bình phương
      </text>

      <path d="M 150 55 L 170 55" stroke="var(--text-secondary)" strokeWidth={1.5} />

      <path d="M 280 55 L 320 55" stroke="var(--text-secondary)" strokeWidth={1.5} markerEnd="url(#ad-arrow)" />
      <defs>
        <marker id="ad-arrow" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--text-secondary)" />
        </marker>
      </defs>

      <rect x={330} y={30} width={120} height={50} rx={8} fill="#22c55e" opacity={0.18} stroke="#22c55e" />
      <text x={390} y={52} textAnchor="middle" fontSize={11} fill="#166534" fontWeight={700}>
        w ← w − η·m̂/√v̂
      </text>
      <text x={390} y={70} textAnchor="middle" fontSize={9} fill="#166534" fontFamily="monospace">
        bước thích ứng
      </text>

      <text x={240} y={110} textAnchor="middle" fontSize={10} fill="var(--text-secondary)" fontStyle="italic">
        Tham số nào gradient lớn sẽ rút bớt bước; gradient nhỏ được đẩy nhanh hơn.
      </text>
    </svg>
  );
}

function CheckpointSketch() {
  return (
    <svg viewBox="0 0 480 130" className="w-full" role="img" aria-label="Gradient checkpointing: chỉ lưu activation tại một số lớp, phần còn lại tính lại.">
      <title>Gradient checkpointing — đổi tính toán lấy bộ nhớ.</title>
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => {
        const cx = 40 + i * 42;
        const isCheckpoint = i % 3 === 0;
        return (
          <g key={i}>
            <rect
              x={cx - 14}
              y={40}
              width={28}
              height={40}
              rx={5}
              fill={isCheckpoint ? "#22c55e" : "var(--bg-card)"}
              stroke={isCheckpoint ? "#22c55e" : "var(--border)"}
              strokeWidth={1.5}
              opacity={isCheckpoint ? 0.8 : 0.5}
            />
            {isCheckpoint && (
              <text
                x={cx}
                y={100}
                textAnchor="middle"
                fontSize={9}
                fill="#166534"
                fontWeight={600}
              >
                lưu
              </text>
            )}
            {!isCheckpoint && (
              <text
                x={cx}
                y={100}
                textAnchor="middle"
                fontSize={9}
                fill="var(--text-tertiary)"
                fontStyle="italic"
              >
                tính lại
              </text>
            )}
          </g>
        );
      })}
      <text x={240} y={125} textAnchor="middle" fontSize={10} fill="var(--text-secondary)" fontStyle="italic">
        Giảm RAM từ O(n) xuống O(√n), đổi lại +30% tính toán — cần thiết với 80GB HBM3.
      </text>
    </svg>
  );
}

function ParallelSketch() {
  return (
    <svg viewBox="0 0 480 140" className="w-full" role="img" aria-label="Ba chiến lược song song: tensor, pipeline, data parallelism.">
      <title>16.384 GPU phối hợp qua ba loại parallelism.</title>
      {["Tensor", "Pipeline", "Data"].map((mode, i) => {
        const y = 20 + i * 40;
        const color = ["#3b82f6", "#8b5cf6", "#22c55e"][i];
        return (
          <g key={mode}>
            <text x={10} y={y + 14} fontSize={11} fill={color} fontWeight={700}>
              {mode}
            </text>
            {Array.from({ length: 16 }, (_, j) => (
              <rect
                key={j}
                x={95 + j * 22}
                y={y}
                width={18}
                height={22}
                rx={3}
                fill={color}
                opacity={0.25 + (j / 16) * 0.6}
              />
            ))}
          </g>
        );
      })}
      <text x={240} y={130} textAnchor="middle" fontSize={10} fill="var(--text-secondary)" fontStyle="italic">
        Gradient đồng bộ giữa các nhóm GPU sau mỗi backward pass.
      </text>
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────
   TRAINING LOSS CHART — rendered inside SliderGroup
   ──────────────────────────────────────────────────────────── */

function TrainingLossChart({
  lr,
  startW,
  epochs,
}: {
  lr: number;
  startW: number;
  epochs: number;
}) {
  const points = useMemo(
    () => simulateTraining(lr, startW, epochs),
    [lr, startW, epochs],
  );
  const diagnosis = useMemo(() => classifyRun(points), [points]);

  const maxLoss = Math.min(
    Math.max(...points.map((p) => p.loss), 1),
    200,
  );
  const plotW = 520;
  const plotH = 200;
  const toPX = (e: number) => 30 + (e / epochs) * (plotW - 50);
  const toPY = (l: number) => plotH - 20 - (Math.min(l, maxLoss) / maxLoss) * (plotH - 40);

  const linePoints = points
    .map((p) => `${toPX(p.epoch).toFixed(1)},${toPY(p.loss).toFixed(1)}`)
    .join(" ");

  const DiagIcon = diagnosis.icon;

  return (
    <div className="w-full space-y-3">
      <svg
        viewBox={`0 0 ${plotW} ${plotH}`}
        className="w-full"
        role="img"
        aria-label={`Loss theo epoch — ${diagnosis.label}.`}
      >
        <title>
          Loss qua {epochs} epoch với learning rate η = {lr.toFixed(3)}, w₀ ={" "}
          {startW.toFixed(1)}. Chẩn đoán: {diagnosis.label}.
        </title>

        {/* grid */}
        {[0.25, 0.5, 0.75].map((frac) => (
          <line
            key={frac}
            x1={30}
            y1={20 + frac * (plotH - 40)}
            x2={plotW - 20}
            y2={20 + frac * (plotH - 40)}
            stroke="var(--border)"
            strokeWidth={0.5}
            strokeDasharray="2,3"
            opacity={0.4}
          />
        ))}

        {/* Axes */}
        <line
          x1={30}
          y1={plotH - 20}
          x2={plotW - 20}
          y2={plotH - 20}
          stroke="var(--border)"
          strokeWidth={1}
        />
        <line
          x1={30}
          y1={20}
          x2={30}
          y2={plotH - 20}
          stroke="var(--border)"
          strokeWidth={1}
        />

        {/* Axis labels */}
        <text x={plotW - 22} y={plotH - 6} fontSize={10} fill="var(--text-tertiary)" textAnchor="end">
          epoch
        </text>
        <text x={8} y={28} fontSize={10} fill="var(--text-tertiary)">
          loss
        </text>

        {/* Line */}
        <polyline points={linePoints} fill="none" stroke={diagnosis.accent} strokeWidth={2} />

        {/* Dots */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={toPX(p.epoch)}
            cy={toPY(p.loss)}
            r={i === 0 || i === points.length - 1 ? 4 : 2.5}
            fill={diagnosis.accent}
            stroke="#fff"
            strokeWidth={1}
          />
        ))}

        {/* End marker label */}
        {points.length > 0 && (
          <text
            x={toPX(points[points.length - 1].epoch) - 6}
            y={toPY(points[points.length - 1].loss) - 8}
            fontSize={10}
            fill={diagnosis.accent}
            textAnchor="end"
            fontFamily="monospace"
          >
            L = {points[points.length - 1].loss.toFixed(2)}
          </text>
        )}
      </svg>

      <div
        className="rounded-lg border p-3 flex items-start gap-3"
        style={{
          backgroundColor: diagnosis.accent + "12",
          borderColor: diagnosis.accent + "55",
        }}
      >
        <DiagIcon className="h-5 w-5 shrink-0 mt-0.5" style={{ color: diagnosis.accent }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: diagnosis.accent }}>
            {diagnosis.label}
          </p>
          <p className="text-xs text-foreground/80 leading-relaxed mt-1">
            {diagnosis.note}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   ITERATION STEP CARDS — rendered inside StepReveal
   ──────────────────────────────────────────────────────────── */

function IterationStep({
  kind,
  title,
  description,
}: {
  kind: "forward" | "loss" | "backward" | "update";
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface/50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        {kind === "forward" && <Target className="h-4 w-4 text-blue-500" />}
        {kind === "loss" && <Gauge className="h-4 w-4 text-amber-500" />}
        {kind === "backward" && <Wind className="h-4 w-4 text-violet-500" />}
        {kind === "update" && <ArrowDownToLine className="h-4 w-4 text-green-500" />}
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      </div>
      <p className="text-xs text-foreground/80 leading-relaxed">{description}</p>

      {/* Moving data visual */}
      <div className="rounded-lg bg-card border border-border p-3">
        <svg viewBox="0 0 440 64" className="w-full">
          <title>Mô phỏng dòng chảy dữ liệu trong bước {kind}.</title>
          {/* Source */}
          <rect
            x={20}
            y={20}
            width={60}
            height={24}
            rx={5}
            fill={kind === "backward" ? "#f59e0b33" : "#3b82f633"}
            stroke={kind === "backward" ? "#f59e0b" : "#3b82f6"}
          />
          <text
            x={50}
            y={37}
            textAnchor="middle"
            fontSize={10}
            fill={kind === "backward" ? "#d97706" : "#1e3a8a"}
            fontWeight={600}
          >
            {kind === "forward" && "Input"}
            {kind === "loss" && "ŷ"}
            {kind === "backward" && "Loss"}
            {kind === "update" && "Grad"}
          </text>

          {/* Destination */}
          <rect
            x={360}
            y={20}
            width={60}
            height={24}
            rx={5}
            fill={kind === "loss" ? "#f59e0b33" : kind === "update" ? "#22c55e33" : "#8b5cf633"}
            stroke={kind === "loss" ? "#f59e0b" : kind === "update" ? "#22c55e" : "#8b5cf6"}
          />
          <text
            x={390}
            y={37}
            textAnchor="middle"
            fontSize={10}
            fill={kind === "loss" ? "#92400e" : kind === "update" ? "#166534" : "#5b21b6"}
            fontWeight={600}
          >
            {kind === "forward" && "ŷ"}
            {kind === "loss" && "L"}
            {kind === "backward" && "∂L/∂w"}
            {kind === "update" && "w_new"}
          </text>

          {/* Moving dots */}
          {[0, 1, 2].map((i) => (
            <motion.circle
              key={i}
              cx={0}
              cy={32}
              r={4}
              fill={
                kind === "forward"
                  ? "#3b82f6"
                  : kind === "loss"
                    ? "#f59e0b"
                    : kind === "backward"
                      ? "#8b5cf6"
                      : "#22c55e"
              }
              initial={{ cx: kind === "backward" ? 360 : 80 }}
              animate={{ cx: kind === "backward" ? 80 : 360 }}
              transition={{
                duration: 1.4,
                ease: "easeInOut",
                repeat: Infinity,
                delay: i * 0.4,
              }}
            />
          ))}

          {/* Label over the line */}
          <text
            x={220}
            y={14}
            textAnchor="middle"
            fontSize={9}
            fill="var(--text-tertiary)"
            fontStyle="italic"
          >
            {kind === "forward" && "chảy xuôi qua 126 lớp"}
            {kind === "loss" && "cross-entropy"}
            {kind === "backward" && "chain rule ngược 126 lớp"}
            {kind === "update" && "w − η · ∂L/∂w"}
          </text>
        </svg>
      </div>
    </div>
  );
}
