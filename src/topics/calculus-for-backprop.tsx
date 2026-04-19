"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChefHat,
  Soup,
  Activity,
  Gauge,
  Link2,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  LessonSection,
  TopicLink,
  CollapsibleDetail,
  StepReveal,
  SliderGroup,
  LaTeX,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "calculus-for-backprop",
  title: "Calculus for Backpropagation",
  titleVi: "Giải tích cho backprop",
  description:
    "Đạo hàm là câu trả lời cho câu hỏi: thay đổi nhỏ này làm loss thay đổi bao nhiêu? Quy tắc chuỗi nối các câu trả lời đó xuyên qua mạng nơ-ron.",
  category: "math-foundations",
  tags: ["derivatives", "chain-rule", "gradient", "backprop"],
  difficulty: "intermediate",
  relatedSlugs: ["gradient-intuition", "backpropagation", "gradient-descent"],
  vizType: "interactive",
};

/* ────────────────────────────────────────────────────────────
   HOOK: đầu bếp nếm canh — metaphor cho gradient
   ──────────────────────────────────────────────────────────── */

const TOTAL_STEPS = 8;

/* ────────────────────────────────────────────────────────────
   VISUALIZATION 1 — Pipe diagram: x → g(x) → f(g(x))
   Learner clicks a junction and sees local derivative
   ──────────────────────────────────────────────────────────── */

type JunctionId = "input" | "hidden" | "output";

interface JunctionInfo {
  id: JunctionId;
  label: string;
  subtitle: string;
  formula: string;
  derivativeLabel: string;
  colorLight: string;
  colorDark: string;
}

const JUNCTIONS: JunctionInfo[] = [
  {
    id: "input",
    label: "Vào",
    subtitle: "g(x) = 2x + 1",
    formula: "∂g/∂x = 2",
    derivativeLabel: "x tăng 1 → g tăng 2",
    colorLight: "#38bdf8",
    colorDark: "#0ea5e9",
  },
  {
    id: "hidden",
    label: "Ẩn",
    subtitle: "h(g) = g²",
    formula: "∂h/∂g = 2g",
    derivativeLabel: "g tăng 1 → h tăng 2g",
    colorLight: "#a78bfa",
    colorDark: "#8b5cf6",
  },
  {
    id: "output",
    label: "Ra",
    subtitle: "f(h) = h + 3",
    formula: "∂f/∂h = 1",
    derivativeLabel: "h tăng 1 → f tăng 1",
    colorLight: "#f472b6",
    colorDark: "#ec4899",
  },
];

function computeChain(x: number) {
  const g = 2 * x + 1;
  const h = g * g;
  const f = h + 3;
  const dg = 2;
  const dh = 2 * g;
  const df = 1;
  const total = df * dh * dg;
  return { g, h, f, dg, dh, df, total };
}

/* ────────────────────────────────────────────────────────────
   VISUALIZATION 2 — Two-layer chain walk-through
   ──────────────────────────────────────────────────────────── */

interface ChainStep {
  title: string;
  label: string;
  description: string;
  icon: typeof Layers;
}

const CHAIN_STEPS: ChainStep[] = [
  {
    title: "Bước 1 — Lớp vào",
    label: "x → a₁",
    description:
      "Giá trị đầu vào x chạy qua lớp đầu tiên: a₁ = w₁·x + b₁. Đạo hàm cục bộ của a₁ theo x chính là w₁ — hệ số của lớp này.",
    icon: Activity,
  },
  {
    title: "Bước 2 — Lớp ẩn",
    label: "a₁ → a₂",
    description:
      "a₁ tiếp tục chạy qua lớp thứ hai: a₂ = w₂·a₁ + b₂. Đạo hàm cục bộ của a₂ theo a₁ là w₂.",
    icon: Layers,
  },
  {
    title: "Bước 3 — Đầu ra & Loss",
    label: "a₂ → L",
    description:
      "Cuối cùng, L đo sai khác giữa a₂ và nhãn đúng y. Đạo hàm cục bộ của L theo a₂ cho biết: nếu a₂ tăng 1, loss thay đổi bao nhiêu.",
    icon: Gauge,
  },
  {
    title: "Bước 4 — Nhân chuỗi",
    label: "∂L/∂x = ∂L/∂a₂ · ∂a₂/∂a₁ · ∂a₁/∂x",
    description:
      "Quy tắc chuỗi nói: muốn biết loss thay đổi bao nhiêu khi x thay đổi, hãy NHÂN các đạo hàm cục bộ qua từng lớp. Mỗi lớp đóng góp một số, và tích của chúng là câu trả lời.",
    icon: Link2,
  },
];

/* ────────────────────────────────────────────────────────────
   QUIZ
   ──────────────────────────────────────────────────────────── */

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Đạo hàm dL/dw = -4 nghĩa là gì theo cách dễ hiểu nhất?",
    options: [
      "Loss hiện tại bằng -4",
      "Nếu tăng w lên 1 đơn vị, loss giảm khoảng 4 đơn vị",
      "Weight hiện tại bằng -4",
      "Mạng nơ-ron đã hội tụ về minimum",
    ],
    correct: 1,
    explanation:
      "Đạo hàm đo tốc độ thay đổi. dL/dw = -4 nghĩa là theo tương quan tuyến tính hiện tại, tăng w thêm 1 sẽ làm loss giảm 4. Dấu âm = 'tăng w làm giảm loss' → gradient descent sẽ tăng w để loss nhỏ hơn.",
  },
  {
    question:
      "Bạn có ba hàm nối tiếp: y = f(g(h(x))). Chain rule cho dy/dx là gì?",
    options: [
      "dy/dx = f'(x) + g'(x) + h'(x)",
      "dy/dx = f'(x) × g'(x) × h'(x)",
      "dy/dx = f'(g) × g'(h) × h'(x)",
      "dy/dx = (df/dg) + (dg/dh) + (dh/dx)",
    ],
    correct: 2,
    explanation:
      "Quy tắc chuỗi nhân các đạo hàm cục bộ, trong đó mỗi đạo hàm được tính TẠI điểm tương ứng — f' tại g, g' tại h, h' tại x. Không phải f' tại x.",
  },
  {
    question:
      "Trong mạng nơ-ron 3 lớp, đạo hàm cục bộ mỗi lớp đều bằng 0.5. Chain rule cho biết đạo hàm tổng hợp bằng bao nhiêu?",
    options: [
      "1.5 — tổng các đạo hàm",
      "0.5 — vẫn bằng đạo hàm mỗi lớp",
      "0.125 — tích 0.5 × 0.5 × 0.5",
      "0 — các đạo hàm triệt tiêu nhau",
    ],
    correct: 2,
    explanation:
      "Chain rule nhân các đạo hàm cục bộ: 0.5³ = 0.125. Đây là lý do mạng sâu dễ gặp 'vanishing gradient' — nhân nhiều số nhỏ hơn 1 làm gradient nhanh chóng tiến về 0.",
  },
  {
    type: "fill-blank",
    question:
      "Để biết loss thay đổi bao nhiêu khi một weight w ở lớp đầu tiên thay đổi, backprop dùng quy tắc {blank} để nhân các đạo hàm cục bộ xuyên qua mạng từ đầu ra ngược về lớp chứa w.",
    blanks: [
      { answer: "chuỗi", accept: ["chain", "chain rule", "quy tắc chuỗi"] },
    ],
    explanation:
      "Quy tắc chuỗi (chain rule) là công cụ nền tảng. Mỗi lớp chỉ cần biết đạo hàm cục bộ của mình. Backprop là thuật toán để NHÂN các mảnh đó lại theo đúng thứ tự từ output ngược về input.",
  },
  {
    question:
      "Gradient ∇L là gì theo cách hiểu hình học?",
    options: [
      "Một số đơn — đo độ lớn của loss",
      "Một vector — mỗi thành phần là đạo hàm riêng của L theo một weight, chỉ hướng loss tăng nhanh nhất",
      "Ma trận vuông lưu mọi cặp đạo hàm",
      "Tên khác của learning rate",
    ],
    correct: 1,
    explanation:
      "Gradient là một vector gom tất cả đạo hàm riêng. Tại mỗi điểm, nó chỉ hướng loss TĂNG nhanh nhất. Đó là lý do ta đi NGƯỢC gradient để loss giảm — công thức update w ← w − η∇L.",
  },
  {
    question:
      "Vì sao chain rule cho phép backprop chạy hiệu quả trên mạng hàng tỉ tham số?",
    options: [
      "Nhờ chain rule, ta có công thức đóng cho mọi gradient",
      "Mỗi lớp chỉ cần tính đạo hàm cục bộ của mình, rồi nhân với gradient truyền ngược từ lớp sau — không cần tính riêng cho từng weight",
      "Chain rule tự động bỏ qua các weight không quan trọng",
      "Chain rule biến đạo hàm thành phép cộng rẻ hơn",
    ],
    correct: 1,
    explanation:
      "Không có chain rule, để tính gradient của mỗi weight, bạn phải forward pass lại gần như toàn bộ mạng — O(n²). Chain rule biến chi phí thành O(n): một forward + một backward pass, tái sử dụng các đạo hàm cục bộ.",
  },
];

/* ────────────────────────────────────────────────────────────
   COMPONENT CHÍNH
   ──────────────────────────────────────────────────────────── */

export default function CalculusForBackpropTopic() {
  const [activeJunction, setActiveJunction] = useState<JunctionId>("hidden");

  return (
    <>
      {/* ━━━ BƯỚC 1 — HOOK (đầu bếp nếm canh) ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Ẩn dụ mở đầu">
        <div className="rounded-2xl border-2 border-accent/30 bg-accent-light p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/60 dark:bg-white/10">
              <ChefHat className="h-6 w-6 text-accent" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground leading-snug">
                Mạng nơ-ron học như đầu bếp nếm canh
              </h3>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Đầu bếp múc một thìa canh, nếm, rồi quyết định: <strong>mặn hơn hay
                nhạt hơn bao nhiêu</strong>? Nếu quá nhạt một chút, thêm nhúm muối.
                Nếu quá mặn, đổ thêm nước. Việc &ldquo;bao nhiêu&rdquo; quan trọng
                không kém việc &ldquo;hướng nào&rdquo; — nêm tay nặng sẽ hỏng nồi canh.
              </p>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Đó chính là <strong>đạo hàm</strong>: câu trả lời cho câu hỏi &ldquo;thay
                đổi nhỏ này làm kết quả thay đổi bao nhiêu?&rdquo; Và{" "}
                <strong>quy tắc chuỗi</strong> chính là cách đầu bếp truy ngược xem{" "}
                <em>mỗi bước nấu</em> (thêm muối → đun sôi → rắc hành) đóng góp bao
                nhiêu vào vị canh cuối cùng.
              </p>
            </div>
          </div>

          {/* Mini sketch — bowl + spoon + arrow */}
          <div className="grid grid-cols-3 gap-3 pt-3">
            <div className="rounded-xl bg-white/70 dark:bg-white/5 p-3 text-center space-y-1">
              <Soup className="mx-auto h-6 w-6 text-amber-500" />
              <p className="text-[11px] font-semibold text-foreground">Bước nấu</p>
              <p className="text-[10px] text-muted leading-tight">
                Thêm muối, đun sôi, rắc hành — mỗi bước là một hàm.
              </p>
            </div>
            <div className="rounded-xl bg-white/70 dark:bg-white/5 p-3 text-center space-y-1">
              <Gauge className="mx-auto h-6 w-6 text-sky-500" />
              <p className="text-[11px] font-semibold text-foreground">Nếm vị</p>
              <p className="text-[10px] text-muted leading-tight">
                So với &ldquo;vị mong muốn&rdquo; — ra một con số: loss.
              </p>
            </div>
            <div className="rounded-xl bg-white/70 dark:bg-white/5 p-3 text-center space-y-1">
              <Link2 className="mx-auto h-6 w-6 text-violet-500" />
              <p className="text-[11px] font-semibold text-foreground">Truy ngược</p>
              <p className="text-[10px] text-muted leading-tight">
                Bước nào nên sửa bao nhiêu? Chain rule trả lời.
              </p>
            </div>
          </div>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 2 — DISCOVER (PredictionGate) ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Thử đoán">
        <PredictionGate
          question="Mạng nơ-ron có 100 lớp. Bạn muốn biết weight w ở LỚP ĐẦU TIÊN ảnh hưởng loss ra sao. Làm sao tính hiệu quả nhất?"
          options={[
            "Với mỗi weight, chạy lại toàn mạng với w thay đổi một tí, đo loss thay đổi",
            "Đoán đại rồi thử — sai thì sửa",
            "Dùng chain rule: mỗi lớp tự tính đạo hàm cục bộ, rồi NHÂN các mảnh đó ngược từ output về w",
            "Chỉ tính được với mạng dưới 10 lớp — còn lại phải bỏ cuộc",
          ]}
          correct={2}
          explanation="Cách 1 đúng về lý thuyết nhưng tốn kém khủng khiếp (O(n²) forward pass). Chain rule biến bài toán thành một forward + một backward — O(n). Đây là lý do mạng tỉ tham số hôm nay huấn luyện được."
        >
          <p className="text-sm text-muted mt-3 leading-relaxed">
            Bài này cho bạn nhìn rõ chain rule bằng hình ảnh đường ống — mỗi lớp là
            một đoạn ống có đạo hàm cục bộ riêng. Và câu hỏi &ldquo;tổng cộng&rdquo; được
            trả lời bằng cách <strong>nhân</strong> các đạo hàm trên đường ống đó.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ BƯỚC 3 — REVEAL (pipe diagram + SliderGroup) ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khám phá tương tác">
        <VisualizationSection topicSlug={metadata.slug}>
          <LessonSection label="Thí nghiệm 1: Đường ống hàm hợp" step={1}>
            <p className="text-sm text-muted mb-4 leading-relaxed">
              Dữ liệu <code className="px-1.5 py-0.5 rounded bg-surface">x</code> chảy
              qua ba đoạn ống <em>g → h → f</em>. Mỗi đoạn có một{" "}
              <strong>đạo hàm cục bộ</strong> — thay đổi nhỏ ở đầu vào của đoạn đó
              làm đầu ra của đoạn đó thay đổi bao nhiêu. Bấm vào một nút giao để
              xem chi tiết.
            </p>

            <SliderGroup
              sliders={[
                {
                  key: "x",
                  label: "Giá trị đầu vào x",
                  min: 0,
                  max: 4,
                  step: 0.1,
                  defaultValue: 1.5,
                },
              ]}
              visualization={(values) => {
                const x = values.x;
                const { g, h, f, dg, dh, df, total } = computeChain(x);

                return (
                  <div className="w-full space-y-4">
                    {/* SVG pipe diagram */}
                    <svg
                      viewBox="0 0 520 220"
                      className="w-full"
                      role="img"
                      aria-label="Sơ đồ đường ống ba đoạn g, h, f với đạo hàm cục bộ hiển thị ở mỗi nút giao."
                    >
                      <title>
                        Hàm hợp f(h(g(x))), đạo hàm tổng = {total.toFixed(2)}
                      </title>

                      {/* Pipes */}
                      <line
                        x1={30}
                        y1={110}
                        x2={490}
                        y2={110}
                        stroke="var(--border)"
                        strokeWidth={28}
                        strokeLinecap="round"
                        opacity={0.3}
                      />
                      <line
                        x1={30}
                        y1={110}
                        x2={490}
                        y2={110}
                        stroke="url(#flow-grad)"
                        strokeWidth={6}
                        strokeLinecap="round"
                      />

                      <defs>
                        <linearGradient id="flow-grad" x1="0" x2="1">
                          <stop offset="0%" stopColor="#0ea5e9" />
                          <stop offset="50%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                      </defs>

                      {/* Junctions */}
                      {JUNCTIONS.map((j, i) => {
                        const cx = 100 + i * 160;
                        const isActive = j.id === activeJunction;
                        return (
                          <g
                            key={j.id}
                            onClick={() => setActiveJunction(j.id)}
                            style={{ cursor: "pointer" }}
                          >
                            {isActive && (
                              <motion.circle
                                cx={cx}
                                cy={110}
                                r={32}
                                fill={j.colorLight}
                                opacity={0.2}
                                initial={{ scale: 0.6 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.25 }}
                              />
                            )}
                            <circle
                              cx={cx}
                              cy={110}
                              r={22}
                              fill={isActive ? j.colorDark : "var(--bg-card)"}
                              stroke={j.colorDark}
                              strokeWidth={isActive ? 3 : 2}
                            />
                            <text
                              x={cx}
                              y={114}
                              textAnchor="middle"
                              fontSize={11}
                              fontWeight={700}
                              fill={isActive ? "#fff" : j.colorDark}
                            >
                              {j.label}
                            </text>
                            <text
                              x={cx}
                              y={158}
                              textAnchor="middle"
                              fontSize={10}
                              fill="var(--text-secondary)"
                              fontFamily="monospace"
                            >
                              {j.subtitle}
                            </text>
                          </g>
                        );
                      })}

                      {/* Arrows between */}
                      {[0, 1].map((i) => {
                        const cx = 180 + i * 160;
                        return (
                          <g key={`arr-${i}`}>
                            <path
                              d={`M ${cx - 4} 102 L ${cx + 4} 110 L ${cx - 4} 118`}
                              stroke="var(--text-secondary)"
                              strokeWidth={1.5}
                              fill="none"
                            />
                          </g>
                        );
                      })}

                      {/* Current value labels (above pipe) */}
                      <text
                        x={100}
                        y={76}
                        textAnchor="middle"
                        fontSize={11}
                        fill="#0ea5e9"
                        fontWeight={600}
                      >
                        x = {x.toFixed(2)}
                      </text>
                      <text
                        x={260}
                        y={76}
                        textAnchor="middle"
                        fontSize={11}
                        fill="#8b5cf6"
                        fontWeight={600}
                      >
                        g = {g.toFixed(2)}
                      </text>
                      <text
                        x={420}
                        y={76}
                        textAnchor="middle"
                        fontSize={11}
                        fill="#ec4899"
                        fontWeight={600}
                      >
                        h = {h.toFixed(2)}
                      </text>

                      {/* End label */}
                      <text
                        x={500}
                        y={114}
                        fontSize={12}
                        fill="var(--text-primary)"
                        fontWeight={700}
                      >
                        f = {f.toFixed(2)}
                      </text>

                      {/* Bottom bar: product of derivatives */}
                      <rect
                        x={30}
                        y={190}
                        width={460}
                        height={22}
                        rx={6}
                        fill="var(--bg-surface)"
                        stroke="var(--border)"
                      />
                      <text
                        x={260}
                        y={205}
                        textAnchor="middle"
                        fontSize={11}
                        fill="var(--text-primary)"
                        fontFamily="monospace"
                      >
                        ∂f/∂x = ∂f/∂h · ∂h/∂g · ∂g/∂x = {df} · {dh.toFixed(2)}{" "}
                        · {dg} = <tspan fontWeight={700}>{total.toFixed(2)}</tspan>
                      </text>
                    </svg>

                    {/* Active junction detail */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeJunction}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-lg border border-border bg-card p-4 space-y-2"
                      >
                        {(() => {
                          const info = JUNCTIONS.find((j) => j.id === activeJunction);
                          if (!info) return null;
                          const localDeriv =
                            info.id === "input"
                              ? dg
                              : info.id === "hidden"
                                ? dh
                                : df;
                          return (
                            <>
                              <div className="flex items-center justify-between">
                                <span
                                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                  style={{
                                    backgroundColor: info.colorDark + "22",
                                    color: info.colorDark,
                                  }}
                                >
                                  Lớp {info.label}
                                </span>
                                <span className="text-[11px] text-tertiary font-mono">
                                  {info.subtitle}
                                </span>
                              </div>
                              <p className="text-sm text-foreground leading-relaxed">
                                Đạo hàm cục bộ: <strong>{info.formula}</strong> ={" "}
                                <span
                                  className="px-1.5 py-0.5 rounded"
                                  style={{
                                    backgroundColor: info.colorDark + "22",
                                    color: info.colorDark,
                                  }}
                                >
                                  {localDeriv.toFixed(2)}
                                </span>
                              </p>
                              <p className="text-xs text-muted leading-relaxed">
                                Ý nghĩa: {info.derivativeLabel}. Đây là{" "}
                                <em>một mảnh</em> của câu trả lời cuối. Chain rule
                                nhân tất cả các mảnh lại.
                              </p>
                            </>
                          );
                        })()}
                      </motion.div>
                    </AnimatePresence>

                    <p className="text-xs text-muted italic text-center">
                      Kéo thanh x và quan sát: đạo hàm ∂h/∂g = 2g thay đổi theo g,
                      trong khi ∂f/∂h = 1 giữ nguyên. Tích của chúng là gradient tổng.
                    </p>
                  </div>
                );
              }}
            />
          </LessonSection>

          {/* Thí nghiệm 2: minh hoạ riêng — đạo hàm như độ dốc */}
          <LessonSection label="Thí nghiệm 2: Đạo hàm là độ dốc" step={2}>
            <p className="text-sm text-muted mb-4 leading-relaxed">
              Kéo thanh để di chuyển điểm trên parabol{" "}
              <code className="px-1.5 py-0.5 rounded bg-surface">L(w) = (w − 3)² + 1</code>
              . Đường tiếp tuyến màu cam cho biết <strong>độ dốc tại điểm đó</strong> —
              đúng bằng giá trị đạo hàm.
            </p>

            <SliderGroup
              sliders={[
                {
                  key: "w",
                  label: "Vị trí weight w",
                  min: 0,
                  max: 6,
                  step: 0.05,
                  defaultValue: 1,
                },
              ]}
              visualization={(values) => {
                const w = values.w;
                const L = (w - 3) ** 2 + 1;
                const dL = 2 * (w - 3);
                const cx = 40 + (w / 6) * 440;
                const cy = 200 - Math.min(L, 20) * 8;
                const tangentDX = 40;
                const tangentDY = dL * (40 / 6) * (160 / 20);
                const tangentX1 = cx - tangentDX;
                const tangentY1 = cy + tangentDY;
                const tangentX2 = cx + tangentDX;
                const tangentY2 = cy - tangentDY;

                const curvePoints: string[] = [];
                for (let wi = 0; wi <= 6; wi += 0.08) {
                  const Li = (wi - 3) ** 2 + 1;
                  const px = 40 + (wi / 6) * 440;
                  const py = 200 - Math.min(Li, 20) * 8;
                  curvePoints.push(`${px.toFixed(1)},${py.toFixed(1)}`);
                }

                const slopeColor =
                  Math.abs(dL) < 0.2
                    ? "#22c55e"
                    : dL > 0
                      ? "#ef4444"
                      : "#3b82f6";

                return (
                  <div className="w-full space-y-3">
                    <svg
                      viewBox="0 0 520 240"
                      className="w-full"
                      role="img"
                      aria-label={`Parabol loss với tiếp tuyến tại w = ${w.toFixed(2)}, độ dốc = ${dL.toFixed(2)}.`}
                    >
                      <title>L(w) = (w − 3)² + 1, dL/dw tại w = {w.toFixed(2)}</title>

                      {/* Axes */}
                      <line
                        x1={40}
                        y1={200}
                        x2={480}
                        y2={200}
                        stroke="var(--border)"
                        strokeWidth={1}
                      />
                      <line
                        x1={40}
                        y1={20}
                        x2={40}
                        y2={200}
                        stroke="var(--border)"
                        strokeWidth={1}
                      />

                      {/* Tick marks */}
                      {[0, 1, 2, 3, 4, 5, 6].map((t) => {
                        const tx = 40 + (t / 6) * 440;
                        return (
                          <g key={`tx-${t}`}>
                            <line
                              x1={tx}
                              y1={200}
                              x2={tx}
                              y2={204}
                              stroke="var(--text-tertiary)"
                              strokeWidth={1}
                            />
                            <text
                              x={tx}
                              y={216}
                              textAnchor="middle"
                              fontSize={10}
                              fill="var(--text-tertiary)"
                            >
                              {t}
                            </text>
                          </g>
                        );
                      })}
                      <text
                        x={490}
                        y={204}
                        fontSize={11}
                        fill="var(--text-secondary)"
                      >
                        w
                      </text>
                      <text
                        x={14}
                        y={30}
                        fontSize={11}
                        fill="var(--text-secondary)"
                      >
                        L
                      </text>

                      {/* Curve */}
                      <polyline
                        points={curvePoints.join(" ")}
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                      />

                      {/* Minimum marker */}
                      <circle
                        cx={40 + (3 / 6) * 440}
                        cy={200 - 1 * 8}
                        r={5}
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth={1.5}
                        strokeDasharray="2,2"
                      />
                      <text
                        x={40 + (3 / 6) * 440}
                        y={200 - 1 * 8 - 10}
                        textAnchor="middle"
                        fontSize={9}
                        fill="#22c55e"
                      >
                        đáy
                      </text>

                      {/* Tangent line */}
                      <line
                        x1={tangentX1}
                        y1={tangentY1}
                        x2={tangentX2}
                        y2={tangentY2}
                        stroke="#f59e0b"
                        strokeWidth={2}
                        strokeDasharray="4,3"
                      />

                      {/* Ball */}
                      <circle cx={cx} cy={cy} r={7} fill={slopeColor} stroke="#fff" strokeWidth={2} />

                      {/* Arrow indicating downhill direction */}
                      {Math.abs(dL) > 0.15 && (
                        <g>
                          <line
                            x1={cx}
                            y1={cy + 16}
                            x2={cx - Math.sign(dL) * 30}
                            y2={cy + 16}
                            stroke={slopeColor}
                            strokeWidth={2}
                          />
                          <path
                            d={`M ${cx - Math.sign(dL) * 30} ${cy + 12} L ${cx - Math.sign(dL) * 36} ${cy + 16} L ${cx - Math.sign(dL) * 30} ${cy + 20} Z`}
                            fill={slopeColor}
                          />
                        </g>
                      )}
                    </svg>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg border border-border bg-card p-2 text-center">
                        <p className="text-[10px] text-tertiary uppercase tracking-wide">w</p>
                        <p className="text-sm font-mono font-semibold text-foreground">
                          {w.toFixed(2)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border bg-card p-2 text-center">
                        <p className="text-[10px] text-tertiary uppercase tracking-wide">L(w)</p>
                        <p className="text-sm font-mono font-semibold text-foreground">
                          {L.toFixed(2)}
                        </p>
                      </div>
                      <div
                        className="rounded-lg p-2 text-center border"
                        style={{
                          backgroundColor: slopeColor + "12",
                          borderColor: slopeColor + "55",
                        }}
                      >
                        <p className="text-[10px] uppercase tracking-wide" style={{ color: slopeColor }}>
                          dL/dw
                        </p>
                        <p
                          className="text-sm font-mono font-semibold"
                          style={{ color: slopeColor }}
                        >
                          {dL >= 0 ? "+" : ""}
                          {dL.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-muted italic text-center leading-relaxed">
                      {Math.abs(dL) < 0.2
                        ? "Gần đáy — độ dốc ≈ 0, ta đang ở cực tiểu."
                        : dL > 0
                          ? "Độ dốc dương → loss đang tăng về bên phải → cần giảm w."
                          : "Độ dốc âm → loss đang giảm về bên phải → cần tăng w."}
                    </p>
                  </div>
                );
              }}
            />
          </LessonSection>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 4 — DEEPEN (StepReveal: 2-layer chain walk) ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Đi sâu — mạng hai lớp">
        <p className="text-sm text-muted mb-4 leading-relaxed">
          Giờ ta rút gọn mạng nơ-ron thành ba giai đoạn: vào → lớp ẩn → đầu ra → loss.
          Bấm &ldquo;Tiếp tục&rdquo; để thấy từng mảnh đạo hàm cục bộ xuất hiện, rồi
          cách chúng nhân lại với nhau.
        </p>

        <StepReveal
          labels={CHAIN_STEPS.map((s) => s.label)}
        >
          {CHAIN_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="rounded-xl border border-border bg-card p-5 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      {step.title}
                    </h4>
                    <p className="text-[11px] font-mono text-muted">{step.label}</p>
                  </div>
                </div>
                <p className="text-sm text-foreground/85 leading-relaxed">
                  {step.description}
                </p>

                {/* Micro visual for the final "multiplication" step */}
                {step.title.includes("Nhân chuỗi") && (
                  <div className="rounded-lg bg-surface p-3 mt-2">
                    <svg viewBox="0 0 460 90" className="w-full">
                      <title>Ba đạo hàm cục bộ nhân lại thành gradient tổng.</title>
                      {[
                        { x: 60, label: "∂L/∂a₂", color: "#0ea5e9", val: "2" },
                        { x: 200, label: "∂a₂/∂a₁", color: "#8b5cf6", val: "w₂" },
                        { x: 340, label: "∂a₁/∂x", color: "#ec4899", val: "w₁" },
                      ].map((b, i) => (
                        <g key={b.label}>
                          <rect
                            x={b.x - 50}
                            y={20}
                            width={100}
                            height={40}
                            rx={8}
                            fill={b.color + "22"}
                            stroke={b.color}
                            strokeWidth={1.5}
                          />
                          <text
                            x={b.x}
                            y={38}
                            textAnchor="middle"
                            fontSize={11}
                            fill={b.color}
                            fontWeight={600}
                            fontFamily="monospace"
                          >
                            {b.label}
                          </text>
                          <text
                            x={b.x}
                            y={54}
                            textAnchor="middle"
                            fontSize={10}
                            fill="var(--text-secondary)"
                            fontFamily="monospace"
                          >
                            = {b.val}
                          </text>
                          {i < 2 && (
                            <text
                              x={b.x + 70}
                              y={44}
                              fontSize={14}
                              fill="var(--text-primary)"
                              fontWeight={700}
                            >
                              ×
                            </text>
                          )}
                        </g>
                      ))}
                      <text
                        x={230}
                        y={82}
                        textAnchor="middle"
                        fontSize={11}
                        fill="var(--text-primary)"
                        fontStyle="italic"
                      >
                        tích ba mảnh = gradient tổng ∂L/∂x
                      </text>
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </StepReveal>

        {/* AhaMoment after the walk */}
        <div className="mt-6">
          <AhaMoment>
            <strong>Chain rule không phải phép thuật</strong> — nó chỉ là một cách
            tổ chức việc cộng hưởng các thay đổi nhỏ. Mỗi lớp chỉ cần biết đạo hàm
            cục bộ CỦA RIÊNG NÓ. Sau đó, gradient của toàn mạng được ráp lại bằng
            phép nhân. Đó là lý do mạng tỉ tham số hôm nay tập luyện được trong giờ,
            chứ không phải hàng tháng.
          </AhaMoment>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 5 — CHALLENGE ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Cho f(g(x)) với g(x) = 3x và f(g) = g². Áp dụng chain rule, df/dx tại x = 2 bằng bao nhiêu?"
          options={[
            "6 — đơn giản là f'(x)",
            "12 — df/dg × dg/dx = 2g × 3 = 2(3·2) × 3",
            "36 — df/dg × dg/dx = 2g × 3, với g = 6 → 12 × 3",
            "4 — bằng f(x) tại x = 2",
          ]}
          correct={2}
          explanation="Chain rule: df/dx = df/dg · dg/dx. Ta có df/dg = 2g và dg/dx = 3. Tại x = 2 thì g = 3·2 = 6, nên df/dg = 2·6 = 12. Kết quả: 12 × 3 = 36. Lỗi thường gặp là nhầm df/dg với df/dx."
        />

        <div className="mt-5">
          <InlineChallenge
            question="Trong một mạng 5 lớp, mọi đạo hàm cục bộ đều bằng 0.3. Gradient của loss theo weight ở lớp đầu tiên (tính qua chain rule) có độ lớn bao nhiêu?"
            options={[
              "1.5 — tổng 0.3 + 0.3 + 0.3 + 0.3 + 0.3",
              "0.3 — không đổi sau mỗi lớp",
              "0.00243 — tích 0.3⁵",
              "0 — gradient luôn triệt tiêu",
            ]}
            correct={2}
            explanation="Chain rule nhân: 0.3⁵ ≈ 0.00243. Đây là 'vanishing gradient' — nhân nhiều số nhỏ hơn 1 làm gradient teo nhỏ rất nhanh, khiến lớp đầu gần như không học được. Giải pháp: ReLU (gradient ≈ 1) và skip connections."
          />
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 6 — EXPLAIN (≤3 LaTeX) ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích toán">
        <ExplanationSection topicSlug={metadata.slug}>
          <p className="leading-relaxed">
            Bạn đã thấy bằng hình: mỗi lớp là một &ldquo;đoạn ống&rdquo; có đạo hàm
            cục bộ. Giờ ta viết lại bằng ba công thức — mỗi công thức đi kèm một câu
            &ldquo;nó nghĩa là gì bằng tiếng Việt đời thường&rdquo;.
          </p>

          {/* Formula 1: chain rule */}
          <div className="rounded-xl border border-border bg-surface/50 p-5 my-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-white text-sm font-bold">
                1
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Quy tắc chuỗi cho hai lớp hàm
                </p>
                <p className="text-xs text-muted">
                  Nếu y = f(g(x)), đạo hàm tổng bằng tích đạo hàm cục bộ.
                </p>
              </div>
            </div>

            <LaTeX block>
              {"\\frac{dy}{dx} = \\frac{dy}{dg} \\cdot \\frac{dg}{dx}"}
            </LaTeX>

            {/* Mini visual paired */}
            <div className="rounded-lg bg-card border border-border p-3">
              <svg viewBox="0 0 440 80" className="w-full">
                <title>Hai đoạn ống nối tiếp, đạo hàm của toàn chuỗi bằng tích.</title>
                <rect x={20} y={20} width={120} height={40} rx={8} fill="#0ea5e9" opacity={0.22} stroke="#0ea5e9" />
                <text x={80} y={45} textAnchor="middle" fontSize={12} fill="#0ea5e9" fontWeight={600}>
                  x → g
                </text>
                <text x={80} y={72} textAnchor="middle" fontSize={10} fill="var(--text-secondary)" fontFamily="monospace">
                  dg/dx
                </text>

                <rect x={170} y={20} width={120} height={40} rx={8} fill="#ec4899" opacity={0.22} stroke="#ec4899" />
                <text x={230} y={45} textAnchor="middle" fontSize={12} fill="#ec4899" fontWeight={600}>
                  g → y
                </text>
                <text x={230} y={72} textAnchor="middle" fontSize={10} fill="var(--text-secondary)" fontFamily="monospace">
                  dy/dg
                </text>

                <text x={155} y={45} fontSize={16} fill="var(--text-primary)" fontWeight={700}>
                  →
                </text>

                <text x={320} y={45} fontSize={12} fill="var(--text-primary)" fontFamily="monospace" fontWeight={600}>
                  = (dy/dg) × (dg/dx)
                </text>
              </svg>
            </div>

            <p className="text-xs text-muted italic leading-relaxed">
              &ldquo;Muốn biết y thay đổi bao nhiêu khi x đổi một tí, hãy xem g thay đổi
              bao nhiêu khi x đổi, rồi y thay đổi bao nhiêu khi g đổi, cuối cùng
              nhân lại.&rdquo;
            </p>
          </div>

          {/* Formula 2: partial derivative */}
          <div className="rounded-xl border border-border bg-surface/50 p-5 my-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-white text-sm font-bold">
                2
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Đạo hàm riêng — một biến mỗi lần
                </p>
                <p className="text-xs text-muted">
                  Khi loss L phụ thuộc nhiều weight, ∂L/∂wᵢ chỉ hỏi: &ldquo;giữ các
                  weight khác yên, đổi riêng wᵢ thì L đổi bao nhiêu?&rdquo;
                </p>
              </div>
            </div>

            <LaTeX block>
              {"\\frac{\\partial L}{\\partial w_i} = \\lim_{h \\to 0} \\frac{L(\\ldots, w_i + h, \\ldots) - L(\\ldots, w_i, \\ldots)}{h}"}
            </LaTeX>

            {/* Mini visual */}
            <div className="rounded-lg bg-card border border-border p-3">
              <svg viewBox="0 0 440 100" className="w-full">
                <title>Đạo hàm riêng — chỉ lắc thanh wᵢ, giữ các thanh khác yên.</title>
                {[0, 1, 2, 3, 4].map((i) => {
                  const active = i === 2;
                  const x = 40 + i * 80;
                  return (
                    <g key={i}>
                      <rect
                        x={x}
                        y={30}
                        width={30}
                        height={50}
                        rx={4}
                        fill={active ? "#8b5cf6" : "var(--bg-surface)"}
                        stroke={active ? "#8b5cf6" : "var(--border)"}
                        strokeWidth={1.5}
                        opacity={active ? 0.8 : 0.5}
                      />
                      <text
                        x={x + 15}
                        y={95}
                        textAnchor="middle"
                        fontSize={10}
                        fill={active ? "#8b5cf6" : "var(--text-tertiary)"}
                        fontFamily="monospace"
                        fontWeight={active ? 700 : 400}
                      >
                        w{i + 1}
                      </text>
                      {active && (
                        <>
                          <path
                            d={`M ${x - 6} 55 Q ${x - 14} 55 ${x - 14} 45`}
                            stroke="#8b5cf6"
                            strokeWidth={1.5}
                            fill="none"
                          />
                          <path
                            d={`M ${x + 36} 55 Q ${x + 44} 55 ${x + 44} 45`}
                            stroke="#8b5cf6"
                            strokeWidth={1.5}
                            fill="none"
                          />
                          <text
                            x={x + 15}
                            y={22}
                            textAnchor="middle"
                            fontSize={10}
                            fill="#8b5cf6"
                            fontWeight={600}
                          >
                            lắc
                          </text>
                        </>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            <p className="text-xs text-muted italic leading-relaxed">
              &ldquo;Trong một phòng có 5 người, câu hỏi &lsquo;nếu chỉ một mình bạn
              thay đổi, nhóm sẽ thay đổi ra sao?&rsquo; là đạo hàm riêng.&rdquo;
            </p>
          </div>

          {/* Formula 3: gradient vector */}
          <div className="rounded-xl border border-border bg-surface/50 p-5 my-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-white text-sm font-bold">
                3
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Gradient — gom tất cả đạo hàm riêng thành một vector
                </p>
                <p className="text-xs text-muted">
                  Mỗi thành phần ứng với một weight. Vector này chỉ hướng loss tăng
                  nhanh nhất — ta đi NGƯỢC nó.
                </p>
              </div>
            </div>

            <LaTeX block>
              {"\\nabla L = \\left[ \\frac{\\partial L}{\\partial w_1}, \\frac{\\partial L}{\\partial w_2}, \\ldots, \\frac{\\partial L}{\\partial w_n} \\right]"}
            </LaTeX>

            {/* Mini visual — arrows on a hill */}
            <div className="rounded-lg bg-card border border-border p-3">
              <svg viewBox="0 0 440 120" className="w-full">
                <title>Gradient tại một điểm — mũi tên chỉ hướng loss tăng mạnh nhất.</title>
                {/* Elliptical contours */}
                {[60, 90, 120].map((r, i) => (
                  <ellipse
                    key={r}
                    cx={220}
                    cy={70}
                    rx={r * 1.6}
                    ry={r * 0.4}
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth={1}
                    opacity={0.3 - i * 0.08}
                  />
                ))}

                {/* Gradient arrow */}
                <circle cx={220} cy={70} r={6} fill="#8b5cf6" stroke="#fff" strokeWidth={2} />
                <line
                  x1={220}
                  y1={70}
                  x2={300}
                  y2={30}
                  stroke="#ef4444"
                  strokeWidth={2.5}
                />
                <path
                  d="M 300 30 L 292 30 L 296 36 Z"
                  fill="#ef4444"
                />
                <text x={304} y={26} fontSize={11} fill="#ef4444" fontWeight={600}>
                  ∇L (lên dốc)
                </text>

                {/* Opposite arrow */}
                <line
                  x1={220}
                  y1={70}
                  x2={140}
                  y2={110}
                  stroke="#22c55e"
                  strokeWidth={2.5}
                  strokeDasharray="4,3"
                />
                <path d="M 140 110 L 148 108 L 144 102 Z" fill="#22c55e" />
                <text x={60} y={112} fontSize={11} fill="#22c55e" fontWeight={600}>
                  −∇L (xuống dốc)
                </text>
              </svg>
            </div>

            <p className="text-xs text-muted italic leading-relaxed">
              &ldquo;Tưởng tượng bạn đứng trên sườn đồi sương mù. Gradient là ngón
              tay chỉ hướng dốc lên. Gradient descent là: đi ngược ngón tay đó,
              từng bước nhỏ.&rdquo;
            </p>
          </div>

          <Callout variant="insight" title="Ba công thức, một câu chuyện">
            Đạo hàm (một biến) → đạo hàm riêng (nhiều biến, lắc một thanh) → gradient
            (gom lại thành vector) → quy tắc chuỗi (nhân các gradient cục bộ xuyên
            qua các lớp). Đây là toàn bộ bộ công cụ toán bạn cần để hiểu{" "}
            <TopicLink slug="backpropagation">backpropagation</TopicLink>.
          </Callout>

          <CollapsibleDetail title="Vì sao lại là PHÉP NHÂN, không phải phép cộng?">
            <div className="space-y-2 text-sm leading-relaxed text-muted">
              <p>
                Trực giác: tưởng tượng một chuỗi <strong>tỉ lệ</strong>. Nếu giá vé
                máy bay đổi 1 đồng làm chi phí chuyến đi đổi 2 đồng, và chi phí
                chuyến đi đổi 1 đồng làm ngân sách gia đình đổi 1.5 đồng — thì giá
                vé đổi 1 đồng làm ngân sách đổi 2 × 1.5 = 3 đồng. Các tỉ lệ dọc
                chuỗi <strong>nhân nhau</strong>, không cộng.
              </p>
              <p>
                Toán học: khi bạn tiệm cận về giới hạn h → 0 trong định nghĩa đạo
                hàm, các hạng tử bậc cao bị bỏ qua và chỉ còn lại tích các hệ số
                tuyến tính — chính là chain rule.
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="Sao &lsquo;vanishing gradient&rsquo; lại đáng sợ đến vậy?">
            <div className="space-y-2 text-sm leading-relaxed text-muted">
              <p>
                Sigmoid có đạo hàm tối đa ≈ 0.25. Nhân qua 50 lớp: 0.25⁵⁰ ≈ 10⁻³⁰.
                Gradient ở lớp đầu gần như bằng 0 → các weight ở lớp đó không được
                cập nhật → mạng không học được đặc trưng sơ cấp. Đây là lý do{" "}
                <strong>ReLU</strong> (đạo hàm = 1 khi x &gt; 0) và{" "}
                <strong>skip connection</strong> (tạo đường tắt cho gradient) được
                phát minh. Xem thêm ở{" "}
                <TopicLink slug="backpropagation">backpropagation</TopicLink>.
              </p>
            </div>
          </CollapsibleDetail>

          <p className="leading-relaxed mt-4">
            Công cụ đã đủ. Bước kế tiếp là ráp chúng lại thành một thuật toán huấn
            luyện hoàn chỉnh — xem{" "}
            <TopicLink slug="gradient-intuition">Gradient — mũi tên chỉ đường xuống dốc</TopicLink>{" "}
            để thấy gradient descent hoạt động trên một mặt 2D có thể tương tác.
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 7 — CONNECT (summary + redirect) ━━━ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt & Liên kết">
        <MiniSummary
          title="Bốn ý bạn mang về"
          points={[
            "Đạo hàm trả lời: 'thay đổi nhỏ này làm kết quả thay đổi bao nhiêu'. Trong ML, đó là dL/dw.",
            "Đạo hàm riêng giữ mọi biến khác yên, chỉ lắc một biến. Gradient là vector gom mọi đạo hàm riêng lại.",
            "Quy tắc chuỗi nhân các đạo hàm cục bộ xuyên qua mạng — là nền tảng của backpropagation.",
            "Mỗi lớp chỉ cần biết đạo hàm cục bộ của mình. Backprop ráp các mảnh lại bằng phép nhân, không cần thần thánh.",
          ]}
        />

        <div className="mt-5">
          <Callout variant="tip" title="Xem ứng dụng thực tế">
            Toán này không chỉ là lý thuyết — Meta dùng đúng những công thức trên
            để huấn luyện LLaMA 3.1 với 405 tỉ tham số. Xem cách làm ở{" "}
            <TopicLink slug="calculus-for-backprop-in-model-training">
              Giải tích trong huấn luyện mô hình
            </TopicLink>
            .
          </Callout>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 8 — QUIZ ━━━ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
        <div className="mt-6 flex items-center justify-center text-xs text-muted gap-2">
          <Sparkles className="h-3.5 w-3.5" />
          Bạn có thể làm lại quiz và thử lại visualizations bất cứ lúc nào.
        </div>
      </LessonSection>
    </>
  );
}

