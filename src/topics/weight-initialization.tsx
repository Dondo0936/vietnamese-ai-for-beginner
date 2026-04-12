"use client";

import { useState, useMemo } from "react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
  TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "weight-initialization",
  title: "Weight Initialization",
  titleVi: "Khởi tạo trọng số",
  description:
    "Chiến lược chọn giá trị ban đầu cho trọng số, ảnh hưởng lớn đến tốc độ và khả năng hội tụ.",
  category: "neural-fundamentals",
  tags: ["training", "techniques", "fundamentals"],
  difficulty: "intermediate",
  relatedSlugs: [
    "vanishing-exploding-gradients",
    "activation-functions",
    "batch-normalization",
  ],
  vizType: "interactive",
};

/* ---------- helpers ---------- */
type InitMethod = "zeros" | "random-large" | "xavier" | "he";

function seededNormal(seed: number): number {
  const r1 = Math.max(0.001, Math.abs(Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1);
  const r2 = Math.abs(Math.sin(seed * 269.5 + 183.3) * 43758.5453) % 1;
  return Math.sqrt(-2 * Math.log(r1)) * Math.cos(2 * Math.PI * r2);
}

function generateWeights(method: InitMethod, count: number, fanIn: number): number[] {
  const weights: number[] = [];
  for (let i = 0; i < count; i++) {
    const normal = seededNormal(i + 42);
    switch (method) {
      case "zeros":
        weights.push(0);
        break;
      case "random-large":
        weights.push(normal * 2.0);
        break;
      case "xavier":
        weights.push(normal * Math.sqrt(1.0 / fanIn));
        break;
      case "he":
        weights.push(normal * Math.sqrt(2.0 / fanIn));
        break;
    }
  }
  return weights;
}

const INIT_CONFIG: Record<InitMethod, { label: string; color: string; desc: string }> = {
  zeros: {
    label: "Zeros",
    color: "#64748b",
    desc: "Tất cả = 0 → mạng không học được (symmetry problem)",
  },
  "random-large": {
    label: "Random lớn",
    color: "#ef4444",
    desc: "Phương sai quá lớn → bùng nổ gradient, bão hòa activation",
  },
  xavier: {
    label: "Xavier/Glorot",
    color: "#3b82f6",
    desc: "Var = 1/fan_in → phương sai ổn định qua các lớp (cho sigmoid/tanh)",
  },
  he: {
    label: "He/Kaiming",
    color: "#22c55e",
    desc: "Var = 2/fan_in → bù ReLU tắt 50% nơ-ron (tốt nhất cho ReLU)",
  },
};

const SVG_W = 480;
const SVG_H = 210;
const PAD = 35;

/* ---------- main component ---------- */
export default function WeightInitializationTopic() {
  const [method, setMethod] = useState<InitMethod>("xavier");
  const [fanIn, setFanIn] = useState(128);

  const count = 80;
  const weights = useMemo(
    () => generateWeights(method, count, fanIn),
    [method, fanIn]
  );

  // Histogram
  const maxAbs = method === "random-large" ? 5 : 0.5;
  const bins = 25;

  const histogram = useMemo(() => {
    const counts = new Array(bins).fill(0);
    weights.forEach((w) => {
      const idx = Math.floor(((w + maxAbs) / (2 * maxAbs)) * bins);
      const clamped = Math.max(0, Math.min(bins - 1, idx));
      counts[clamped]++;
    });
    return counts;
  }, [weights, maxAbs, bins]);

  const maxCount = Math.max(...histogram, 1);
  const barW = (SVG_W - 2 * PAD) / bins - 1;
  const barMaxH = SVG_H - 2 * PAD - 20;

  // Stats
  const meanW = weights.reduce((s, w) => s + w, 0) / weights.length;
  const varW = weights.reduce((s, w) => s + (w - meanW) ** 2, 0) / weights.length;

  // Simulate activation output variance through 5 layers
  const layerVariances = useMemo(() => {
    const vars: number[] = [];
    let v = 1.0; // input variance = 1
    for (let l = 0; l < 6; l++) {
      vars.push(v);
      switch (method) {
        case "zeros":
          v = 0;
          break;
        case "random-large":
          v *= 2.0 * 2.0 * fanIn * 0.5; // ReLU halves
          break;
        case "xavier":
          v *= (1.0 / fanIn) * fanIn * 0.5; // ~0.5 per layer (not perfect for ReLU)
          break;
        case "he":
          v *= (2.0 / fanIn) * fanIn * 0.5; // ~1.0 per layer (perfect for ReLU!)
          break;
      }
      v = Math.min(v, 1000); // clamp for display
    }
    return vars;
  }, [method, fanIn]);

  /* Quiz */
  const quizQuestions: QuizQuestion[] = [
    {
      question: "Tại sao khởi tạo tất cả trọng số = 0 là ý tưởng tệ?",
      options: [
        "Gradient sẽ bùng nổ",
        "Tất cả nơ-ron cùng lớp luôn giống hệt nhau (symmetry) → mạng chỉ học được 1 feature",
        "Trọng số quá nhỏ nên mạng không tính toán được",
        "Python báo lỗi chia cho 0",
      ],
      correct: 1,
      explanation:
        "Nếu w = 0, tất cả nơ-ron cùng lớp nhận cùng input, tạo cùng output, nhận cùng gradient → cập nhật giống hệt nhau vĩnh viễn. Mạng N nơ-ron chỉ bằng 1 nơ-ron!",
    },
    {
      question: "He initialization có Var = 2/fan_in. Tại sao nhân 2 (so với Xavier là 1)?",
      options: [
        "He luôn tốt hơn Xavier nên nhân 2 cho mạnh hơn",
        "ReLU tắt 50% nơ-ron (output = 0 khi input < 0), nên cần nhân 2 để bù lại phương sai bị mất",
        "Fan_in của ReLU gấp đôi sigmoid",
        "Hệ số 2 là ngẫu nhiên, không có ý nghĩa",
      ],
      correct: 1,
      explanation:
        "ReLU: max(0,x) → 50% output = 0 → phương sai giảm một nửa. He bù bằng cách nhân 2: Var = 2/fan_in. Với sigmoid/tanh không mất phương sai → Xavier: Var = 1/fan_in.",
    },
    {
      question:
        "Bạn dùng ReLU cho mọi lớp ẩn. Nên chọn initialization nào?",
      options: [
        "Zeros — đơn giản nhất",
        "Xavier — phổ biến nhất",
        "He/Kaiming — thiết kế riêng cho ReLU",
        "Random lớn — tạo đa dạng",
      ],
      correct: 2,
      explanation:
        "He initialization thiết kế riêng cho ReLU, bù đắp việc ReLU tắt 50% nơ-ron. PyTorch mặc định dùng Kaiming uniform cho nn.Linear. ReLU + He = combo tiêu chuẩn.",
    },
    {
      type: "fill-blank",
      question:
        "Với activation sigmoid/tanh, nên dùng {blank} initialization (Var = 1/fan_in). Với ReLU, nên dùng {blank} initialization (Var = 2/fan_in).",
      blanks: [
        { answer: "Xavier", accept: ["Glorot", "xavier", "glorot"] },
        { answer: "He", accept: ["Kaiming", "he", "kaiming"] },
      ],
      explanation:
        "Xavier (Glorot, 2010) giữ phương sai ổn định cho sigmoid/tanh. He (Kaiming, 2015) nhân 2 để bù việc ReLU tắt 50% nơ-ron. Quy tắc: sigmoid/tanh → Xavier, ReLU → He.",
    },
  ];

  return (
    <>
      {/* ===== STEP 1: PREDICTION GATE ===== */}
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="10 vận động viên chuẩn bị chạy đua. Nếu TẤT CẢ đứng chung một vạch xuất phát chính xác cùng vị trí, kết quả sẽ thế nào?"
          options={[
            "Công bằng — ai cũng khởi đầu như nhau",
            "Tất cả chạy giống hệt nhau, không ai vượt lên — vì không có sự khác biệt ban đầu",
            "Người nhanh nhất vẫn sẽ thắng",
            "Không ảnh hưởng — chỉ tốc độ mới quan trọng",
          ]}
          correct={1}
          explanation="Giống trọng số = 0: tất cả nơ-ron cùng lớp nhận cùng input, tính cùng output, nhận cùng gradient → giống hệt nhau vĩnh viễn! Cần khởi tạo KHÁC NHAU nhưng hợp lý."
        >
          <p className="mt-4 text-sm text-muted leading-relaxed">
            Giá trị ban đầu của trọng số quyết định mạng có hội tụ được không.
            Hãy so sánh 4 chiến lược và xem phân phối trọng số cùng phương sai
            thay đổi qua các lớp.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ===== STEP 2: HISTOGRAM EXPLORER ===== */}
      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-4">
            {/* Method selector */}
            <div className="flex flex-wrap gap-2 justify-center">
              {(Object.keys(INIT_CONFIG) as InitMethod[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                    method === m
                      ? "text-white shadow-md"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                  style={
                    method === m
                      ? { backgroundColor: INIT_CONFIG[m].color }
                      : {}
                  }
                >
                  {INIT_CONFIG[m].label}
                </button>
              ))}
            </div>

            {/* Fan-in slider */}
            <div className="space-y-1 max-w-sm mx-auto">
              <label className="text-xs text-muted">
                fan_in (số nơ-ron lớp trước):{" "}
                <strong className="text-foreground">{fanIn}</strong>
              </label>
              <input
                type="range"
                min="16"
                max="512"
                step="16"
                value={fanIn}
                onChange={(e) => setFanIn(parseInt(e.target.value))}
                className="w-full accent-accent"
              />
            </div>

            {/* Status */}
            <div
              className="rounded-lg p-2 text-center text-sm"
              style={{
                color: INIT_CONFIG[method].color,
                backgroundColor: `${INIT_CONFIG[method].color}15`,
                border: `1px solid ${INIT_CONFIG[method].color}40`,
              }}
            >
              {INIT_CONFIG[method].desc}
            </div>

            {/* Histogram */}
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              className="w-full max-w-xl mx-auto"
            >
              <text
                x={SVG_W / 2}
                y={15}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="10"
              >
                Phân phối trọng số (fan_in = {fanIn})
              </text>

              {/* X axis */}
              <line
                x1={PAD}
                y1={SVG_H - PAD}
                x2={SVG_W - PAD}
                y2={SVG_H - PAD}
                stroke="#334155"
                strokeWidth="1"
              />
              <text
                x={PAD}
                y={SVG_H - PAD + 14}
                fill="#64748b"
                fontSize="8"
                textAnchor="middle"
              >
                {(-maxAbs).toFixed(1)}
              </text>
              <text
                x={SVG_W / 2}
                y={SVG_H - PAD + 14}
                fill="#64748b"
                fontSize="8"
                textAnchor="middle"
              >
                0
              </text>
              <text
                x={SVG_W - PAD}
                y={SVG_H - PAD + 14}
                fill="#64748b"
                fontSize="8"
                textAnchor="middle"
              >
                {maxAbs.toFixed(1)}
              </text>

              {/* Zero line */}
              <line
                x1={SVG_W / 2}
                y1={SVG_H - PAD}
                x2={SVG_W / 2}
                y2={PAD + 20}
                stroke="#475569"
                strokeWidth="1"
                strokeDasharray="3,3"
                opacity={0.5}
              />

              {/* Bars */}
              {histogram.map((c, i) => {
                const x = PAD + i * (barW + 1);
                const h = (c / maxCount) * barMaxH;
                const y = SVG_H - PAD - h;
                return (
                  <rect
                    key={`hist-${i}`}
                    x={x}
                    y={y}
                    width={barW}
                    height={Math.max(0, h)}
                    rx={2}
                    fill={INIT_CONFIG[method].color}
                    opacity={0.75}
                  />
                );
              })}
            </svg>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="rounded-lg bg-background/50 border border-border p-2">
                <p className="text-muted">Trung bình</p>
                <p className="text-lg font-bold text-foreground">
                  {meanW.toFixed(4)}
                </p>
              </div>
              <div className="rounded-lg bg-background/50 border border-border p-2">
                <p className="text-muted">Phương sai</p>
                <p className="text-lg font-bold text-foreground">
                  {varW.toFixed(5)}
                </p>
              </div>
              <div className="rounded-lg bg-background/50 border border-border p-2">
                <p className="text-muted">Max |w|</p>
                <p className="text-lg font-bold text-foreground">
                  {Math.max(...weights.map(Math.abs)).toFixed(4)}
                </p>
              </div>
            </div>

            {/* Layer variance propagation */}
            <div className="space-y-2">
              <p className="text-xs text-center text-muted">
                Phương sai activation qua 6 lớp (dùng ReLU):
              </p>
              <div className="flex gap-1 justify-center">
                {layerVariances.map((v, i) => (
                  <div
                    key={`lv-${i}`}
                    className="rounded border border-border p-2 text-center min-w-[60px]"
                  >
                    <p className="text-[10px] text-muted">
                      Lớp {i}
                    </p>
                    <p
                      className="text-xs font-bold"
                      style={{
                        color:
                          v < 0.01
                            ? "#3b82f6"
                            : v > 10
                              ? "#ef4444"
                              : "#22c55e",
                      }}
                    >
                      {v < 0.001
                        ? "~0"
                        : v > 100
                          ? v.toExponential(0)
                          : v.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ===== STEP 3: AHA MOMENT ===== */}
      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>Weight initialization</strong>{" "}
            chọn &quot;vạch xuất phát&quot; cho mạng. Zeros = tất cả đứng cùng chỗ (symmetry).
            Random lớn = nhảy hỗn loạn (exploding). Xavier/He = phân bổ hợp lý để phương sai
            ổn định qua mọi lớp — giống cách sắp xếp chỗ ngồi trên xe buýt: đều nhau,
            không ai quá chật, không ai quá thoải mái!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ===== STEP 4: INLINE CHALLENGE ===== */}
      <LessonSection step={4} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Bạn dùng tanh activation nhưng He initialization (Var = 2/fan_in). Kết quả có thể xảy ra?"
          options={[
            "Hoàn hảo — He tốt cho mọi activation",
            "Phương sai quá lớn cho tanh → output bão hòa ở ±1 → vanishing gradient. Nên dùng Xavier (Var = 1/fan_in)",
            "Không ảnh hưởng — initialization không quan trọng",
          ]}
          correct={1}
          explanation="He nhân 2 để bù ReLU tắt 50%. Tanh không tắt → phương sai quá lớn → tanh bão hòa → gradient gần 0. Quy tắc: ReLU → He, Sigmoid/Tanh → Xavier."
        />
      </LessonSection>

      {/* ===== STEP 5: EXPLANATION ===== */}
      <LessonSection step={5} totalSteps={8} label="Giải thích">
        <ExplanationSection>
          <p>
            <strong>Mục tiêu:</strong>{" "}
            giữ phương sai ổn định qua các lớp — không tăng (bùng nổ) cũng
            không giảm (triệt tiêu){" "}
            (xem{" "}
            <TopicLink slug="vanishing-exploding-gradients">
              vanishing/exploding gradients
            </TopicLink>
            ).
          </p>

          <p>
            <strong>Xavier (Glorot, 2010):</strong>
          </p>
          <LaTeX block>
            {"W \\sim \\mathcal{N}\\left(0, \\frac{1}{n_{\\text{in}}}\\right) \\quad \\text{hoặc} \\quad W \\sim \\mathcal{U}\\left(-\\frac{\\sqrt{6}}{\\sqrt{n_{\\text{in}} + n_{\\text{out}}}}, \\frac{\\sqrt{6}}{\\sqrt{n_{\\text{in}} + n_{\\text{out}}}}\\right)"}
          </LaTeX>

          <p>
            <strong>He (Kaiming, 2015):</strong>
          </p>
          <LaTeX block>
            {"W \\sim \\mathcal{N}\\left(0, \\frac{2}{n_{\\text{in}}}\\right)"}
          </LaTeX>

          <p>
            Hệ số 2 trong He bù đắp việc ReLU &quot;tắt&quot; 50% output (max(0,x) loại bỏ
            một nửa phân phối) — chọn init phụ thuộc vào{" "}
            <TopicLink slug="activation-functions">hàm kích hoạt</TopicLink>.
          </p>

          <CodeBlock language="python" title="weight_init.py">
{`import torch.nn as nn

model = nn.Sequential(
    nn.Linear(784, 256), nn.ReLU(),
    nn.Linear(256, 128), nn.ReLU(),
    nn.Linear(128, 10),
)

# He init cho ReLU (PyTorch mặc định Kaiming uniform)
for m in model.modules():
    if isinstance(m, nn.Linear):
        nn.init.kaiming_normal_(m.weight, nonlinearity='relu')
        nn.init.zeros_(m.bias)  # bias luôn init = 0

# Xavier init cho Sigmoid/Tanh
# nn.init.xavier_normal_(m.weight)

# Kiểm tra phương sai ban đầu
with torch.no_grad():
    x = torch.randn(100, 784)
    for layer in model:
        x = layer(x)
        if isinstance(layer, nn.Linear):
            print(f"Var = {x.var().item():.4f}")`}
          </CodeBlock>

          <Callout variant="tip" title="Thực tế: framework đã xử lý cho bạn">
            PyTorch mặc định dùng Kaiming uniform cho nn.Linear, Xavier cho nn.Embedding.
            Bạn chỉ cần thay đổi khi dùng activation khác thường hoặc debug vấn đề gradient.
            Với BatchNorm, initialization ít quan trọng hơn.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ===== STEP 6: CHALLENGE 2 ===== */}
      <LessonSection step={6} totalSteps={8} label="Thử thách nâng cao">
        <InlineChallenge
          question="Fan_in = 10000 (lớp đầu tiên của mạng xử lý ảnh lớn). Xavier init cho Var = 1/10000 = 0.0001. Trọng số sẽ rất nhỏ. Có vấn đề gì không?"
          options={[
            "Trọng số nhỏ = tốt, mạng khiêm tốn ban đầu",
            "Không vấn đề — variance output vẫn ổn vì nhân 10000 trọng số, tổng bù lại",
            "Vấn đề lớn — trọng số gần 0, gradient gần 0, mạng không học",
          ]}
          correct={1}
          explanation="Var(output) = fan_in × Var(w) × Var(input) = 10000 × 0.0001 × 1 = 1. Phương sai output vẫn = 1 dù mỗi trọng số rất nhỏ — đó chính là ý nghĩa của công thức Xavier!"
        />
      </LessonSection>

      {/* ===== STEP 7: MINI SUMMARY ===== */}
      <LessonSection step={7} totalSteps={8} label="Tóm tắt">
        <MiniSummary
          title="Weight Initialization — Điểm chốt"
          points={[
            "Zeros = symmetry problem (mọi nơ-ron giống hệt nhau). Random lớn = bùng nổ gradient.",
            "Xavier (Var=1/fan_in): giữ phương sai ổn định cho sigmoid/tanh.",
            "He (Var=2/fan_in): bù ReLU tắt 50% → tiêu chuẩn cho ReLU. Nhân 2 so với Xavier.",
            "Quy tắc: ReLU → He, Sigmoid/Tanh → Xavier. Với BatchNorm, init ít quan trọng hơn.",
            "PyTorch mặc định dùng Kaiming — thường không cần thay đổi trừ khi debug gradient.",
          ]}
        />
      </LessonSection>

      {/* ===== STEP 8: QUIZ ===== */}
      <LessonSection step={8} totalSteps={8} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
