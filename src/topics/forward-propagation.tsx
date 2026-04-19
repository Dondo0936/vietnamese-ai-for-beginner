"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  MessageSquare,
  Network,
  Cpu,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CollapsibleDetail,
  LaTeX,
  TopicLink,
  StepReveal,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

/* ═══════════════════════════════════════════════════════════════════
   METADATA
   ═══════════════════════════════════════════════════════════════════ */

export const metadata: TopicMeta = {
  slug: "forward-propagation",
  title: "Forward Propagation",
  titleVi: "Lan truyền thuận",
  description:
    "Dữ liệu đi qua mạng như tin nhắn qua các trạm — mỗi trạm xử lý rồi chuyển cho trạm sau.",
  category: "neural-fundamentals",
  tags: ["neural-network", "training", "fundamentals"],
  difficulty: "beginner",
  relatedSlugs: [
    "mlp",
    "backpropagation",
    "activation-functions",
    "loss-functions",
  ],
  vizType: "interactive",
};

/* ═══════════════════════════════════════════════════════════════════
   MÔ HÌNH 3 LỚP: input(3) → hidden(4) → output(3)
   Trọng số và bias cố định, dùng cho mọi phần minh hoạ.
   ═══════════════════════════════════════════════════════════════════ */

const W1: number[][] = [
  [0.6, -0.4, 0.3, 0.8],
  [-0.5, 0.7, 0.9, -0.2],
  [0.2, 0.5, -0.6, 0.4],
];
const B1: number[] = [0.1, -0.2, 0.15, -0.05];

const W2: number[][] = [
  [0.7, -0.3, 0.5],
  [-0.4, 0.8, 0.2],
  [0.6, 0.1, -0.5],
  [-0.2, 0.4, 0.9],
];
const B2: number[] = [0.05, 0.1, -0.15];

function relu(x: number): number {
  return Math.max(0, x);
}

function softmax(z: number[]): number[] {
  const m = Math.max(...z);
  const exps = z.map((v) => Math.exp(v - m));
  const s = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / s);
}

interface LayerSnapshot {
  x: number[];
  z1: number[];
  a1: number[];
  z2: number[];
  a2: number[]; // softmax output
  prediction: number; // argmax
  labels: readonly string[];
}

const CLASS_LABELS = ["Mèo", "Chó", "Chim"] as const;

function forward(x: number[]): LayerSnapshot {
  const z1 = B1.map((b, j) => {
    let s = b;
    for (let i = 0; i < x.length; i++) s += W1[i][j] * x[i];
    return s;
  });
  const a1 = z1.map(relu);
  const z2 = B2.map((b, k) => {
    let s = b;
    for (let j = 0; j < a1.length; j++) s += W2[j][k] * a1[j];
    return s;
  });
  const a2 = softmax(z2);
  let prediction = 0;
  for (let i = 1; i < a2.length; i++) {
    if (a2[i] > a2[prediction]) prediction = i;
  }
  return { x, z1, a1, z2, a2, prediction, labels: CLASS_LABELS };
}

/* ═══════════════════════════════════════════════════════════════════
   HÌNH HỌC SVG — dùng chung cho bức vẽ "mạng 3 lớp"
   ═══════════════════════════════════════════════════════════════════ */

const SVG_W = 720;
const SVG_H = 360;

function layerX(layer: 0 | 1 | 2): number {
  return [90, 360, 630][layer];
}

function nodeY(index: number, layerSize: number): number {
  const top = 60;
  const bottom = SVG_H - 60;
  const usable = bottom - top;
  if (layerSize === 1) return (top + bottom) / 2;
  return top + (index * usable) / (layerSize - 1);
}

const INPUT_LABELS = ["Tai", "Lông", "Đuôi"] as const;

/* ═══════════════════════════════════════════════════════════════════
   QUIZ
   ═══════════════════════════════════════════════════════════════════ */

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Lan truyền thuận đi theo chiều nào trong mạng nơ-ron?",
    options: [
      "Từ đầu ra quay ngược lại đầu vào",
      "Một chiều từ đầu vào qua các lớp ẩn đến đầu ra",
      "Ngẫu nhiên giữa các lớp",
      "Chỉ tính ở lớp cuối cùng",
    ],
    correct: 1,
    explanation:
      "Lan truyền thuận (forward propagation) luôn đi một chiều: đầu vào đi qua từng lớp ẩn theo thứ tự rồi mới tới lớp đầu ra. Chiều ngược lại là lan truyền ngược (backpropagation), chỉ dùng khi huấn luyện.",
  },
  {
    question:
      "Tại mỗi nơ-ron, phép tính nào xảy ra TRƯỚC?",
    options: [
      "Hàm kích hoạt a = f(z)",
      "Tổ hợp có trọng số z = W·a + b",
      "So sánh với nhãn thực tế",
      "Cập nhật trọng số",
    ],
    correct: 1,
    explanation:
      "Mỗi nơ-ron luôn tính z = W·a + b (bước tuyến tính) trước, rồi mới áp dụng hàm kích hoạt f(z) để tạo giá trị a truyền sang lớp sau.",
  },
  {
    type: "fill-blank",
    question:
      "Ở lớp cuối để phân loại ba lớp, ta thường dùng hàm {blank} để biến các điểm z thành xác suất cộng lại bằng 1.",
    blanks: [
      {
        answer: "softmax",
        accept: ["Softmax", "soft-max", "hàm softmax"],
      },
    ],
    explanation:
      "Softmax nén một vector số thực thành phân phối xác suất (mỗi phần tử ≥ 0, tổng = 1). Đây là lý do đầu ra của mô hình phân loại thường là vector xác suất các lớp.",
  },
  {
    question:
      "Mạng nhận đầu vào x = [1, 0, 0] và trả về xác suất [0.7, 0.2, 0.1] cho ba lớp [Mèo, Chó, Chim]. Mạng dự đoán lớp nào?",
    options: [
      "Chó (vì 0.2 ở giữa)",
      "Chim (vì đứng cuối cùng)",
      "Mèo (lớp có xác suất cao nhất)",
      "Không đủ dữ kiện",
    ],
    correct: 2,
    explanation:
      "Dự đoán = lớp có xác suất lớn nhất (argmax). Mèo có 0.7 → cao nhất → mạng dự đoán Mèo. Các giá trị còn lại cho biết mức độ không chắc chắn.",
  },
  {
    question:
      "Vai trò của hàm kích hoạt (ReLU, sigmoid, tanh...) trong lan truyền thuận là gì?",
    options: [
      "Tăng tốc độ tính toán của GPU",
      "Thêm tính phi tuyến để mạng học được các quan hệ phức tạp",
      "Giảm kích thước vector",
      "Biến đầu vào thành số nguyên",
    ],
    correct: 1,
    explanation:
      "Nếu bỏ hàm kích hoạt, nhiều lớp chồng lên nhau chỉ tương đương một phép biến đổi tuyến tính duy nhất. Hàm kích hoạt bẻ cong đường thẳng thành đường cong → mạng mới học được ranh giới quyết định phi tuyến.",
  },
  {
    question:
      "Khi giá trị đầu vào x thay đổi, điều gì xảy ra trong lan truyền thuận?",
    options: [
      "Trọng số W cũng thay đổi theo",
      "Mạng tính lại toàn bộ z và a cho mỗi lớp, giữ nguyên W và b",
      "Chỉ lớp cuối được tính lại",
      "Mạng báo lỗi",
    ],
    correct: 1,
    explanation:
      "Trong lan truyền thuận, W và b cố định (chúng chỉ đổi khi huấn luyện). Khi x đổi, mạng tính lại toàn bộ các giá trị trung gian z và a cho mọi lớp rồi mới ra đầu ra mới.",
  },
  {
    type: "fill-blank",
    question:
      "Công thức của một lớp trong lan truyền thuận: z = W·a + {blank}, rồi a_mới = f(z).",
    blanks: [
      { answer: "b", accept: ["bias", "B", "b_l", "b[l]"] },
    ],
    explanation:
      "b là bias — một hằng số cộng thêm cho mỗi nơ-ron, giúp mạng dịch chuyển đường kích hoạt lên xuống mà không phụ thuộc vào đầu vào.",
  },
];

/* ═══════════════════════════════════════════════════════════════════
   THÀNH PHẦN PHỤ: số nhỏ hiển thị dưới nơ-ron
   ═══════════════════════════════════════════════════════════════════ */

interface NodeProps {
  cx: number;
  cy: number;
  value: number;
  label?: string;
  active: boolean;
  color: string;
  highlight?: boolean;
}

function NetworkNode({
  cx,
  cy,
  value,
  label,
  active,
  color,
  highlight,
}: NodeProps) {
  return (
    <g>
      <motion.circle
        cx={cx}
        cy={cy}
        r={20}
        fill={active ? color : "#1e293b"}
        stroke={highlight ? "#fbbf24" : active ? color : "#475569"}
        strokeWidth={highlight ? 3 : 2}
        initial={false}
        animate={{
          fill: active ? color : "#1e293b",
          scale: highlight ? 1.12 : 1,
        }}
        transition={{ duration: 0.35 }}
      />
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fill={active ? "#ffffff" : "#94a3b8"}
        fontSize={11}
        fontWeight={700}
        className="pointer-events-none select-none"
      >
        {active ? value.toFixed(2) : "?"}
      </text>
      {label && (
        <text
          x={cx}
          y={cy - 30}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize={10}
          fontWeight={600}
        >
          {label}
        </text>
      )}
    </g>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT CHÍNH
   ═══════════════════════════════════════════════════════════════════ */

export default function ForwardPropagationTopic() {
  /* ── Đầu vào động qua 3 thanh trượt ── */
  const [input, setInput] = useState<number[]>([0.8, 0.6, 0.3]);

  /* ── Điều khiển Play / Step / Pause / Reset ── */
  const TOTAL_STEPS = 4; // 0: chưa có; 1: x vào; 2: lớp ẩn; 3: đầu ra thô; 4: softmax
  const [step, setStep] = useState<number>(0);
  const [playing, setPlaying] = useState<boolean>(false);

  const snapshot = useMemo(() => forward(input), [input]);

  useEffect(() => {
    if (!playing) return;
    if (step >= TOTAL_STEPS) {
      setPlaying(false);
      return;
    }
    const id = setTimeout(() => setStep((s) => s + 1), 1100);
    return () => clearTimeout(id);
  }, [playing, step]);

  const handlePlay = useCallback(() => {
    if (step >= TOTAL_STEPS) setStep(0);
    setPlaying(true);
  }, [step]);

  const handlePause = useCallback(() => setPlaying(false), []);
  const handleReset = useCallback(() => {
    setPlaying(false);
    setStep(0);
  }, []);
  const handleStep = useCallback(() => {
    setPlaying(false);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }, []);

  /* ── Khi slider đổi → reset bước hoạt hình để không lệch ── */
  const updateInput = useCallback((index: number, value: number) => {
    setInput((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setStep(0);
    setPlaying(false);
  }, []);

  const INPUT_SLIDERS: ReadonlyArray<{
    key: string;
    label: string;
  }> = [
    { key: "x1", label: "Kích cỡ tai (x₁)" },
    { key: "x2", label: "Độ dày lông (x₂)" },
    { key: "x3", label: "Độ dài đuôi (x₃)" },
  ];

  const activeInput = step >= 1;
  const activeHidden = step >= 2;
  const activeLogits = step >= 3;
  const activeOutput = step >= 4;

  const stepCaption = [
    "Chưa có dữ liệu. Nhấn Phát để bắt đầu.",
    "Bước 1 — Đầu vào x đi vào lớp nhập.",
    "Bước 2 — Lớp ẩn tính z = W·x + b rồi ReLU.",
    "Bước 3 — Lớp ra tính z = W·a + b (chưa chuẩn hoá).",
    "Bước 4 — Softmax biến z thành xác suất.",
  ];

  /* ═════════════ DEEPEN — giá trị cụ thể dùng để hiển thị ═════════════ */
  const z1Text = snapshot.z1.map((v) => v.toFixed(2));
  const a1Text = snapshot.a1.map((v) => v.toFixed(2));
  const z2Text = snapshot.z2.map((v) => v.toFixed(2));
  const a2Text = snapshot.a2.map((v) => (v * 100).toFixed(1));

  return (
    <>
      {/* ═══════════════ BƯỚC 1 — HOOK ═══════════════ */}
      <LessonSection step={1} totalSteps={8} label="Ẩn dụ">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <MessageSquare size={20} className="text-accent" />
            Dữ liệu đi như tin nhắn qua các trạm
          </h3>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Hãy tưởng tượng bạn gửi một tin nhắn từ Sài Gòn ra Hà Nội. Tin nhắn
            không bay thẳng — nó đi qua nhiều <strong>trạm</strong>: trạm đầu
            mã hoá, trạm giữa chuyển tiếp, trạm cuối giải mã và đưa tới người
            nhận. Mỗi trạm <em>xử lý một chút</em> rồi chuyển cho trạm sau.
          </p>
          <p className="text-sm text-foreground/85 leading-relaxed">
            <strong>Lan truyền thuận</strong> trong mạng nơ-ron hoạt động giống
            hệt vậy: dữ liệu đầu vào đi qua từng lớp, mỗi lớp biến đổi một
            chút, rồi chuyển cho lớp sau — cho đến khi lớp cuối cùng đưa ra dự
            đoán.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="rounded-xl border border-sky-200 bg-sky-50 dark:bg-sky-900/20 dark:border-sky-800 p-4 space-y-1">
              <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300">
                <Network size={16} />
                <span className="text-sm font-semibold">Trạm đầu</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Nhận đầu vào thô (ví dụ các đặc trưng của con vật: tai, lông,
                đuôi).
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-4 space-y-1">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <Cpu size={16} />
                <span className="text-sm font-semibold">Trạm giữa</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Các lớp ẩn — pha trộn các đặc trưng, thêm tính phi tuyến để học
                được khái niệm phức tạp.
              </p>
            </div>
            <div className="rounded-xl border border-violet-200 bg-violet-50 dark:bg-violet-900/20 dark:border-violet-800 p-4 space-y-1">
              <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
                <Sparkles size={16} />
                <span className="text-sm font-semibold">Trạm cuối</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Đưa ra dự đoán — thường là vector xác suất các lớp có thể xảy
                ra.
              </p>
            </div>
          </div>
        </div>
      </LessonSection>

      {/* ═══════════════ BƯỚC 2 — DISCOVER (PredictionGate) ═══════════════ */}
      <LessonSection step={2} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Bạn đưa ảnh một con mèo cho mô hình đã huấn luyện. Thứ tự các phép tính trong mạng là gì?"
          options={[
            "Tính từ lớp cuối ngược về đầu vào",
            "Đầu vào → lớp ẩn → lớp ra, một chiều duy nhất",
            "Chỉ tính ở lớp cuối, bỏ qua các lớp giữa",
            "Mỗi lớp tự tính độc lập, không phụ thuộc lớp trước",
          ]}
          correct={1}
          explanation="Dữ liệu luôn đi một chiều: đầu vào → lớp ẩn → lớp ra. Mỗi lớp nhận đầu ra của lớp trước làm đầu vào. Chiều ngược (đi từ lớp ra về đầu vào) chỉ xảy ra khi huấn luyện, và được gọi là lan truyền ngược."
        >
          <p className="mt-4 text-sm text-muted leading-relaxed">
            Bên dưới là mạng 3 lớp phân loại con vật theo ba đặc trưng{" "}
            <strong className="text-foreground">tai, lông, đuôi</strong>. Hãy
            kéo thanh trượt rồi nhấn <strong>Phát</strong> để nhìn dữ liệu lan
            qua từng lớp.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ═══════════════ BƯỚC 3 — REVEAL ═══════════════ */}
      <LessonSection step={3} totalSteps={8} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Mạng 3 lớp phân loại Mèo / Chó / Chim
              </h3>
              <p className="text-sm text-muted leading-relaxed mt-1">
                Kéo ba thanh trượt để thay đổi đặc trưng đầu vào. Nhấn{" "}
                <strong>Phát</strong> để xem dữ liệu lan qua từng lớp, hoặc{" "}
                <strong>Bước</strong> để đi từng nhịp.
              </p>
            </div>

            {/* Sliders — parent sở hữu state, không đi vòng qua SliderGroup */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">
                  Đặc trưng đầu vào
                </h4>
                <span className="font-mono text-xs text-muted">
                  x = [{input[0].toFixed(2)}, {input[1].toFixed(2)},{" "}
                  {input[2].toFixed(2)}]
                </span>
              </div>

              <div className="space-y-3">
                {INPUT_SLIDERS.map((slider, i) => {
                  const pct = input[i] * 100;
                  return (
                    <div key={slider.key} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor={`fp-slider-${slider.key}`}
                          className="text-sm text-foreground"
                        >
                          {slider.label}
                        </label>
                        <span className="font-mono text-sm font-medium text-accent">
                          {input[i].toFixed(2)}
                        </span>
                      </div>
                      <input
                        id={`fp-slider-${slider.key}`}
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={input[i]}
                        onChange={(e) =>
                          updateInput(i, parseFloat(e.target.value))
                        }
                        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-surface-hover accent-accent"
                        style={{
                          background: `linear-gradient(to right, var(--color-accent) ${pct}%, var(--bg-surface-hover, #E2E8F0) ${pct}%)`,
                        }}
                      />
                      <div className="flex justify-between text-[10px] text-tertiary">
                        <span>0.00</span>
                        <span>1.00</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Network SVG */}
            <div className="rounded-xl border border-border bg-surface/40 p-3 overflow-hidden">
              <svg
                viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                className="w-full h-auto"
                role="img"
                aria-label="Sơ đồ mạng nơ-ron 3 lớp đang lan truyền thuận"
              >
                {/* Nhãn cột */}
                {[
                  { x: layerX(0), t: "Đầu vào (3)" },
                  { x: layerX(1), t: "Lớp ẩn — ReLU (4)" },
                  { x: layerX(2), t: "Lớp ra — Softmax (3)" },
                ].map((col, i) => (
                  <text
                    key={`col-${i}`}
                    x={col.x}
                    y={28}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize={11}
                    fontWeight={700}
                  >
                    {col.t}
                  </text>
                ))}

                {/* Kết nối input → hidden */}
                {input.map((_, i) =>
                  W1[i].map((w, j) => {
                    const color = w >= 0 ? "#3b82f6" : "#ef4444";
                    const active = activeHidden;
                    return (
                      <motion.line
                        key={`l1-${i}-${j}`}
                        x1={layerX(0) + 20}
                        y1={nodeY(i, 3)}
                        x2={layerX(1) - 20}
                        y2={nodeY(j, 4)}
                        stroke={active ? color : "#334155"}
                        strokeWidth={
                          active ? Math.min(3.5, Math.abs(w) * 3 + 0.6) : 0.8
                        }
                        opacity={active ? 0.6 : 0.2}
                        initial={false}
                        animate={{ opacity: active ? 0.6 : 0.2 }}
                        transition={{ duration: 0.4 }}
                      />
                    );
                  }),
                )}

                {/* Kết nối hidden → output */}
                {Array.from({ length: 4 }).map((_, j) =>
                  W2[j].map((w, k) => {
                    const color = w >= 0 ? "#3b82f6" : "#ef4444";
                    const active = activeLogits;
                    return (
                      <motion.line
                        key={`l2-${j}-${k}`}
                        x1={layerX(1) + 20}
                        y1={nodeY(j, 4)}
                        x2={layerX(2) - 20}
                        y2={nodeY(k, 3)}
                        stroke={active ? color : "#334155"}
                        strokeWidth={
                          active ? Math.min(3.5, Math.abs(w) * 3 + 0.6) : 0.8
                        }
                        opacity={active ? 0.6 : 0.2}
                        initial={false}
                        animate={{ opacity: active ? 0.6 : 0.2 }}
                        transition={{ duration: 0.4 }}
                      />
                    );
                  }),
                )}

                {/* Nút input */}
                {input.map((v, i) => (
                  <NetworkNode
                    key={`in-${i}`}
                    cx={layerX(0)}
                    cy={nodeY(i, 3)}
                    value={v}
                    label={INPUT_LABELS[i]}
                    active={activeInput}
                    color="#0ea5e9"
                  />
                ))}

                {/* Nút hidden — hiển thị a1 (sau ReLU) khi đã qua bước 2 */}
                {snapshot.a1.map((v, j) => (
                  <NetworkNode
                    key={`hid-${j}`}
                    cx={layerX(1)}
                    cy={nodeY(j, 4)}
                    value={v}
                    label={`h${j + 1}`}
                    active={activeHidden}
                    color="#8b5cf6"
                  />
                ))}

                {/* Nút output — dùng a2 (xác suất) khi softmax xong, nếu
                    mới ở bước 3 thì hiển thị z2 (logit thô). */}
                {snapshot.a2.map((v, k) => {
                  const raw = activeOutput
                    ? v
                    : activeLogits
                      ? snapshot.z2[k]
                      : 0;
                  return (
                    <NetworkNode
                      key={`out-${k}`}
                      cx={layerX(2)}
                      cy={nodeY(k, 3)}
                      value={raw}
                      label={CLASS_LABELS[k]}
                      active={activeLogits || activeOutput}
                      color="#10b981"
                      highlight={activeOutput && k === snapshot.prediction}
                    />
                  );
                })}

                {/* Mũi tên giữa các lớp */}
                {activeHidden && (
                  <motion.polygon
                    points={`${layerX(0) + 120},${SVG_H / 2 - 6} ${layerX(0) + 140},${SVG_H / 2} ${layerX(0) + 120},${SVG_H / 2 + 6}`}
                    fill="#38bdf8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                  />
                )}
                {activeLogits && (
                  <motion.polygon
                    points={`${layerX(1) + 120},${SVG_H / 2 - 6} ${layerX(1) + 140},${SVG_H / 2} ${layerX(1) + 120},${SVG_H / 2 + 6}`}
                    fill="#a78bfa"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                  />
                )}
              </svg>
            </div>

            {/* Chú thích cạnh dương/âm */}
            <div className="flex items-center justify-center gap-5 text-[11px] text-muted">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-[3px] w-6 rounded-full bg-blue-500" />
                Trọng số dương
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-[3px] w-6 rounded-full bg-red-500" />
                Trọng số âm
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-[3px] w-6 rounded-full bg-slate-500" />
                Chưa kích hoạt
              </span>
            </div>

            {/* Điều khiển Play/Pause/Step/Reset */}
            <div className="flex flex-wrap justify-center gap-3">
              {playing ? (
                <button
                  type="button"
                  onClick={handlePause}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface transition-colors"
                >
                  <Pause size={14} /> Tạm dừng
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePlay}
                  className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  <Play size={14} />{" "}
                  {step >= TOTAL_STEPS ? "Phát lại" : "Phát"}
                </button>
              )}
              <button
                type="button"
                onClick={handleStep}
                disabled={step >= TOTAL_STEPS}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-surface disabled:opacity-40 transition-colors"
              >
                <StepForward size={14} /> Bước
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
              >
                <RotateCcw size={14} /> Đặt lại
              </button>
            </div>

            {/* Caption theo từng bước */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                  <div
                    key={`dot-${i}`}
                    className={`h-1.5 rounded-full transition-all ${
                      i < step ? "w-8 bg-accent" : "w-4 bg-surface"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-medium text-muted">
                Bước {step}/{TOTAL_STEPS}
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={`cap-${step}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="rounded-lg border border-border bg-background/50 p-4"
              >
                <p className="text-sm text-foreground leading-relaxed">
                  {stepCaption[step]}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Panel xác suất cuối cùng */}
            {activeOutput && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-card p-4 space-y-3"
              >
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Sparkles size={14} className="text-accent" /> Xác suất dự
                  đoán
                </p>
                <div className="space-y-2">
                  {snapshot.a2.map((p, k) => {
                    const isTop = k === snapshot.prediction;
                    return (
                      <div key={`bar-${k}`} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span
                            className={
                              isTop
                                ? "font-semibold text-accent"
                                : "text-muted"
                            }
                          >
                            {CLASS_LABELS[k]}
                          </span>
                          <span className="font-mono text-foreground">
                            {(p * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-surface overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${p * 100}%` }}
                            transition={{ duration: 0.5 }}
                            className={`h-full rounded-full ${
                              isTop ? "bg-accent" : "bg-muted/40"
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted italic">
                  Mạng dự đoán:{" "}
                  <strong className="text-foreground">
                    {CLASS_LABELS[snapshot.prediction]}
                  </strong>{" "}
                  ({(snapshot.a2[snapshot.prediction] * 100).toFixed(1)}%)
                </p>
              </motion.div>
            )}
          </div>
        </VisualizationSection>

        <Callout variant="info" title="Lưu ý khi kéo slider">
          Thay đổi x làm mạng tính lại TOÀN BỘ các giá trị z và a — nhưng trọng
          số W, b không đổi. Đó là điều cốt lõi của lan truyền thuận: cùng một
          công thức, cùng một bộ trọng số, chỉ khác đầu vào.
        </Callout>
      </LessonSection>

      {/* ═══════════════ BƯỚC 4 — DEEPEN (StepReveal) ═══════════════ */}
      <LessonSection step={4} totalSteps={8} label="Đi sâu">
        <VisualizationSection topicSlug={metadata.slug}>
          <h3 className="text-base font-semibold text-foreground mb-2">
            Một vòng lan truyền thuận, mở ra từng lớp
          </h3>
          <p className="text-sm text-muted leading-relaxed mb-4">
            Dưới đây là năm khoảnh khắc bên trong mạng cho đầu vào x ={" "}
            <span className="font-mono text-foreground">
              [{input[0].toFixed(2)}, {input[1].toFixed(2)},{" "}
              {input[2].toFixed(2)}]
            </span>
            . Nhấn <strong>Tiếp tục</strong> để lần lượt mở từng lớp — hãy chú
            ý ai đang nói chuyện với ai.
          </p>

          <StepReveal
            labels={[
              "Đầu vào",
              "Lớp ẩn: tính z",
              "Lớp ẩn: qua ReLU",
              "Lớp ra: tính z",
              "Lớp ra: softmax",
            ]}
          >
            {[
              <div
                key="d1"
                className="rounded-lg border border-border bg-surface/50 p-4 space-y-2"
              >
                <p className="text-sm font-semibold text-foreground">
                  Đầu vào — vector ba đặc trưng
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {input.map((v, i) => (
                    <div
                      key={`din-${i}`}
                      className="rounded-md bg-sky-500/15 border border-sky-500/40 p-2 text-center"
                    >
                      <p className="text-[10px] text-muted">
                        {INPUT_LABELS[i]}
                      </p>
                      <p className="font-mono text-sm text-sky-300">
                        {v.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Đây là tin nhắn gốc mà mạng nhận được. Không có phép tính nào
                  diễn ra ở lớp này — nó chỉ truyền nguyên x cho lớp sau.
                </p>
              </div>,
              <div
                key="d2"
                className="rounded-lg border border-border bg-surface/50 p-4 space-y-3"
              >
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <ArrowRight size={14} className="text-accent" /> Bước 1 —
                  Trạm ẩn cộng-có-trọng-số
                </p>
                <p className="text-xs text-muted leading-relaxed">
                  Mỗi nơ-ron ẩn tính tổng có trọng số từ cả 3 đặc trưng đầu
                  vào, rồi cộng bias. Kết quả là vector z gồm 4 số — chưa qua
                  bất kỳ hàm kích hoạt nào.
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {snapshot.z1.map((_, j) => (
                    <div
                      key={`dz1-${j}`}
                      className="rounded-md bg-violet-500/10 border border-violet-500/30 p-2 text-center"
                    >
                      <p className="text-[10px] text-muted">z₁[{j + 1}]</p>
                      <p className="font-mono text-sm text-violet-300">
                        {z1Text[j]}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-muted font-mono leading-relaxed">
                  Ví dụ z₁[1] = W₁[0][0]·{input[0].toFixed(2)} + W₁[1][0]·
                  {input[1].toFixed(2)} + W₁[2][0]·{input[2].toFixed(2)} +{" "}
                  {B1[0].toFixed(2)} = {z1Text[0]}
                </p>
              </div>,
              <div
                key="d3"
                className="rounded-lg border border-border bg-surface/50 p-4 space-y-3"
              >
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <ArrowRight size={14} className="text-accent" /> Bước 2 — Áp
                  dụng ReLU
                </p>
                <p className="text-xs text-muted leading-relaxed">
                  ReLU cắt bỏ phần âm: giữ nguyên nếu &ge; 0, đẩy về 0 nếu &lt;
                  0. Đây là bước <strong>phi tuyến</strong> duy nhất trong lớp
                  ẩn — nếu bỏ nó đi, toàn bộ mạng sụp về một phép biến đổi
                  tuyến tính.
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {snapshot.a1.map((v, j) => {
                    const wasNeg = snapshot.z1[j] < 0;
                    return (
                      <div
                        key={`da1-${j}`}
                        className={`rounded-md p-2 text-center border ${
                          wasNeg
                            ? "bg-red-500/10 border-red-500/40"
                            : "bg-emerald-500/10 border-emerald-500/40"
                        }`}
                      >
                        <p className="text-[10px] text-muted">a₁[{j + 1}]</p>
                        <p className="font-mono text-sm text-foreground">
                          {v.toFixed(2)}
                        </p>
                        {wasNeg && (
                          <p className="text-[9px] text-red-400">(bị cắt)</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>,
              <div
                key="d4"
                className="rounded-lg border border-border bg-surface/50 p-4 space-y-3"
              >
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <ArrowRight size={14} className="text-accent" /> Bước 3 —
                  Lớp ra cộng-có-trọng-số
                </p>
                <p className="text-xs text-muted leading-relaxed">
                  Lặp lại công thức z = W·a + b, nhưng lần này dùng a₁ (đầu ra
                  của lớp ẩn) làm đầu vào. Kết quả là vector logits — ba số
                  thực chưa chuẩn hoá.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {snapshot.z2.map((_, k) => (
                    <div
                      key={`dz2-${k}`}
                      className="rounded-md bg-emerald-500/10 border border-emerald-500/30 p-2 text-center"
                    >
                      <p className="text-[10px] text-muted">
                        z₂ — {CLASS_LABELS[k]}
                      </p>
                      <p className="font-mono text-sm text-emerald-300">
                        {z2Text[k]}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-muted italic leading-relaxed">
                  Logits chưa phải xác suất: có thể âm, có thể lớn hơn 1, tổng
                  không bằng 1.
                </p>
              </div>,
              <div
                key="d5"
                className="rounded-lg border border-border bg-surface/50 p-4 space-y-3"
              >
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Sparkles size={14} className="text-accent" /> Bước 4 —
                  Softmax chuẩn hoá
                </p>
                <p className="text-xs text-muted leading-relaxed">
                  Softmax mũ hoá và chia đều: mỗi logit &rarr; e^{"{z_k}"}, rồi
                  chia cho tổng. Kết quả: ba số &ge; 0, cộng lại bằng 1 → đây
                  là <em>phân phối xác suất</em>.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {snapshot.a2.map((p, k) => (
                    <div
                      key={`da2-${k}`}
                      className={`rounded-md p-2 text-center border ${
                        k === snapshot.prediction
                          ? "bg-accent/15 border-accent/50"
                          : "bg-card border-border"
                      }`}
                    >
                      <p className="text-[10px] text-muted">
                        {CLASS_LABELS[k]}
                      </p>
                      <p className="font-mono text-sm font-bold text-foreground">
                        {a2Text[k]}%
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted">
                  Dự đoán cuối:{" "}
                  <strong className="text-accent">
                    {CLASS_LABELS[snapshot.prediction]}
                  </strong>
                  . Lan truyền thuận kết thúc ở đây — đây cũng là đầu ra để so
                  với nhãn thực khi huấn luyện.
                </p>
              </div>,
            ]}
          </StepReveal>
        </VisualizationSection>

        <Callout variant="tip" title="Quan sát cốt lõi">
          Cả hai lớp đều lặp lại cùng một <strong>cặp phép tính</strong>: (1)
          tổng có trọng số cộng bias, (2) hàm kích hoạt. Khác biệt duy nhất là
          kích thước ma trận và hàm kích hoạt. Dù mạng có 3 lớp hay 300 lớp,
          cấu trúc vẫn giống hệt — chỉ lặp nhiều hơn.
        </Callout>
      </LessonSection>

      {/* ═══════════════ BƯỚC 5 — CHALLENGE ═══════════════ */}
      <LessonSection step={5} totalSteps={8} label="Thử thách">
        <p className="text-sm text-muted mb-3 leading-relaxed">
          Bạn được cho một lớp ẩn nhỏ với hai đầu vào và hai nơ-ron. Thử tính
          nhẩm rồi chọn đáp án.
        </p>

        <div className="rounded-xl border border-border bg-surface/40 p-4 mb-4 text-xs font-mono text-foreground/90 space-y-1">
          <p>
            Đầu vào: x = [2, 3]. Trọng số W ={" "}
            <span className="text-accent">[[1, -1], [2, 0]]</span>, bias b ={" "}
            <span className="text-accent">[0, 1]</span>.
          </p>
          <p>Lớp ẩn dùng hàm kích hoạt ReLU.</p>
          <p className="text-muted">
            Nhắc: z = W·x + b, a = ReLU(z). Với dữ liệu ở đây, z[1] = 1·2 +
            2·3 + 0 = 8; z[2] = (-1)·2 + 0·3 + 1 = -1.
          </p>
        </div>

        <InlineChallenge
          question="Đầu ra a của lớp ẩn là gì?"
          options={["[8, -1]", "[8, 0]", "[0, 0]", "[2, 3]"]}
          correct={1}
          explanation="z = [8, -1]. ReLU(8) = 8 (giữ nguyên vì dương), ReLU(-1) = 0 (cắt phần âm về 0). Do đó a = [8, 0]. Đáp án A sai vì chưa qua ReLU; đáp án C sai vì cả hai nơ-ron đều bị cắt; đáp án D là chính x, không phải đầu ra của lớp."
        />

        <div className="h-4" />

        <InlineChallenge
          question="Nếu bạn đổi bias của nơ-ron thứ hai từ 1 thành 5 (các số khác giữ nguyên), đầu ra mới là gì?"
          options={["[8, 0]", "[8, 3]", "[12, 3]", "[0, 3]"]}
          correct={1}
          explanation="Chỉ bias thay đổi, không đụng W. z[2] mới = (-1)·2 + 0·3 + 5 = 3. ReLU(3) = 3 vì đã dương. z[1] và a[1] không đổi (vẫn 8). Vậy a mới = [8, 3]. Bias giúp nơ-ron 'ra khỏi vùng bị ReLU cắt' mà không cần thay đổi đầu vào."
        />
      </LessonSection>

      {/* ═══════════════ BƯỚC 6 — AHA ═══════════════ */}
      <LessonSection step={6} totalSteps={8} label="Khoảnh khắc hiểu">
        <AhaMoment>
          Lan truyền thuận không phải thứ gì bí ẩn — nó chỉ là hai phép tính
          lặp lại ở mỗi lớp: <strong>z = W·a + b</strong> rồi{" "}
          <strong>a = f(z)</strong>.
          <br />
          <br />
          Dữ liệu đi một chiều, mỗi trạm biến đổi một chút. Dù mạng có ba lớp
          hay ba trăm lớp, công thức vẫn đúng — chỉ lặp nhiều hơn.
        </AhaMoment>
      </LessonSection>

      {/* ═══════════════ BƯỚC 7 — EXPLAIN ═══════════════ */}
      <LessonSection step={7} totalSteps={8} label="Giải thích">
        <ExplanationSection topicSlug={metadata.slug}>
          <p>
            <strong>Lan truyền thuận (forward propagation)</strong> là quá
            trình đưa dữ liệu đi qua mạng nơ-ron từ đầu vào tới đầu ra. Ở mỗi
            lớp, ta lặp đúng <em>hai bước</em>: biến đổi tuyến tính rồi áp dụng
            hàm kích hoạt.
          </p>

          <h4 className="text-sm font-semibold text-foreground mt-4">
            Công thức một lớp (dạng ma trận)
          </h4>
          <LaTeX block>
            {"z^{[l]} = W^{[l]} a^{[l-1]} + b^{[l]}, \\quad a^{[l]} = f^{[l]}(z^{[l]})"}
          </LaTeX>
          <div className="rounded-lg border border-border bg-surface/40 p-3 text-sm text-foreground/85 leading-relaxed">
            <strong>Đọc thành lời Việt:</strong> &ldquo;Ở lớp thứ l, lấy đầu ra
            của lớp trước là a<sup>[l-1]</sup>, nhân với ma trận trọng số W
            <sup>[l]</sup>, cộng bias b<sup>[l]</sup> → ra z<sup>[l]</sup>.
            Sau đó cho qua hàm kích hoạt f → ra a<sup>[l]</sup>.&rdquo;
          </div>

          <h4 className="text-sm font-semibold text-foreground mt-5">
            Cả vòng lan truyền viết gọn
          </h4>
          <LaTeX block>
            {"\\hat{y} = f^{[L]}\\big(W^{[L]} \\cdots f^{[2]}(W^{[2]} f^{[1]}(W^{[1]} x + b^{[1]}) + b^{[2]}) \\cdots + b^{[L]}\\big)"}
          </LaTeX>
          <div className="rounded-lg border border-border bg-surface/40 p-3 text-sm text-foreground/85 leading-relaxed">
            <strong>Đọc thành lời:</strong> đầu vào x đi vào, áp dụng công thức{" "}
            <em>(nhân trọng số + bias) → hàm kích hoạt</em> cho mọi lớp từ 1
            tới L. Kết quả cuối cùng ŷ = a<sup>[L]</sup> là dự đoán của mạng.
          </div>

          <h4 className="text-sm font-semibold text-foreground mt-5">
            Ở lớp cuối: softmax cho phân loại
          </h4>
          <LaTeX block>
            {"\\operatorname{softmax}(z)_k = \\dfrac{e^{z_k}}{\\sum_{j} e^{z_j}}"}
          </LaTeX>
          <div className="rounded-lg border border-border bg-surface/40 p-3 text-sm text-foreground/85 leading-relaxed">
            <strong>Ý nghĩa:</strong> lấy mũ của mỗi logit rồi chia đều, ép các
            con số thành phân phối xác suất — cộng lại bằng 1, không âm. Đó là
            lý do đầu ra của mô hình phân loại luôn đọc được như &ldquo;70%
            Mèo, 20% Chó, 10% Chim&rdquo;.
          </div>

          {/* SVG minh hoạ so sánh logits vs softmax */}
          <div className="rounded-xl border border-border bg-surface/40 p-4 my-4">
            <p className="text-xs font-semibold text-tertiary uppercase tracking-wide mb-3">
              Từ logits tới xác suất — ảnh chụp cho đầu vào hiện tại
            </p>
            <svg viewBox="0 0 520 180" className="w-full max-w-xl mx-auto">
              <line
                x1={40}
                y1={150}
                x2={500}
                y2={150}
                stroke="var(--border)"
                strokeWidth={1}
              />
              {snapshot.z2.map((z, k) => {
                const maxAbs = Math.max(
                  1,
                  ...snapshot.z2.map((v) => Math.abs(v)),
                );
                const barH = (z / maxAbs) * 50;
                const x = 60 + k * 70;
                const color = z >= 0 ? "#10b981" : "#ef4444";
                return (
                  <g key={`lg-${k}`}>
                    <rect
                      x={x}
                      y={z >= 0 ? 150 - barH : 150}
                      width={36}
                      height={Math.abs(barH)}
                      rx={3}
                      fill={color}
                      opacity={0.85}
                    />
                    <text
                      x={x + 18}
                      y={170}
                      textAnchor="middle"
                      fontSize={10}
                      fill="var(--text-secondary)"
                    >
                      z — {CLASS_LABELS[k]}
                    </text>
                    <text
                      x={x + 18}
                      y={z >= 0 ? 150 - barH - 4 : 150 + barH + 12}
                      textAnchor="middle"
                      fontSize={9}
                      fill="var(--text-primary)"
                    >
                      {z.toFixed(2)}
                    </text>
                  </g>
                );
              })}

              {/* Spaceful divider */}
              <text
                x={275}
                y={90}
                textAnchor="middle"
                fontSize={14}
                fill="var(--text-secondary)"
              >
                →
              </text>

              {snapshot.a2.map((p, k) => {
                const barH = p * 100;
                const x = 310 + k * 70;
                const isTop = k === snapshot.prediction;
                return (
                  <g key={`pr-${k}`}>
                    <rect
                      x={x}
                      y={150 - barH}
                      width={36}
                      height={barH}
                      rx={3}
                      fill={isTop ? "#6366f1" : "#94a3b8"}
                      opacity={isTop ? 0.9 : 0.6}
                    />
                    <text
                      x={x + 18}
                      y={170}
                      textAnchor="middle"
                      fontSize={10}
                      fill="var(--text-secondary)"
                    >
                      {CLASS_LABELS[k]}
                    </text>
                    <text
                      x={x + 18}
                      y={150 - barH - 4}
                      textAnchor="middle"
                      fontSize={9}
                      fill="var(--text-primary)"
                    >
                      {(p * 100).toFixed(0)}%
                    </text>
                  </g>
                );
              })}
            </svg>
            <p className="text-[11px] text-muted text-center mt-2 italic leading-relaxed">
              Bên trái: logits z (có thể âm). Bên phải: sau softmax — phân phối
              xác suất, cột cao nhất chính là dự đoán.
            </p>
          </div>

          <Callout variant="warning" title="Bỏ hàm kích hoạt = mất sức mạnh">
            Nếu tất cả lớp chỉ có phép nhân ma trận và không có hàm kích hoạt,
            toàn mạng sẽ sụp về <em>một phép biến đổi tuyến tính duy nhất</em>.
            Dù xếp 100 lớp, mạng vẫn tương đương một đường thẳng — không vẽ
            được ranh giới cong. ReLU / sigmoid / tanh là chính thứ tạo ra sức
            mạnh phi tuyến của mạng nơ-ron.
          </Callout>

          <CollapsibleDetail title="Vì sao gọi là forward?">
            <p className="text-sm leading-relaxed">
              &ldquo;Forward&rdquo; ở đây nghĩa là đi{" "}
              <strong>theo chiều xuôi</strong>: đầu vào &rarr; lớp 1 &rarr; lớp
              2 &rarr; ... &rarr; lớp cuối &rarr; đầu ra. Khi huấn luyện,
              chúng ta đi chiều ngược lại để tính gradient — gọi là{" "}
              <TopicLink slug="backpropagation">
                lan truyền ngược (backpropagation)
              </TopicLink>
              . Hai chiều này luôn đi kèm nhau trong một vòng huấn luyện:
              forward để đoán, backward để sửa sai.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Tại sao dùng ReLU ở lớp ẩn mà không dùng sigmoid?">
            <p className="text-sm leading-relaxed">
              Lịch sử ban đầu dùng sigmoid cho mọi lớp. Nhưng sigmoid có hai
              vấn đề khi mạng sâu: (1) giá trị bị đẩy về giữa 0 và 1 nên{" "}
              <em>tín hiệu bão hoà</em>, mạng khó học; (2) tính đạo hàm tốn
              kém. ReLU chỉ là &ldquo;max(0, z)&rdquo; — rẻ, không bão hoà phía
              dương, và đã trở thành lựa chọn mặc định cho lớp ẩn trong hầu hết
              các kiến trúc hiện đại. Chi tiết thêm trong bài{" "}
              <TopicLink slug="activation-functions">hàm kích hoạt</TopicLink>.
            </p>
          </CollapsibleDetail>
        </ExplanationSection>
      </LessonSection>

      {/* ═══════════════ BƯỚC 8 — CONNECT + QUIZ ═══════════════ */}
      <LessonSection step={8} totalSteps={8} label="Kết nối & Kiểm tra">
        <MiniSummary
          title="Lan truyền thuận — 5 điều cần nhớ"
          points={[
            "Dữ liệu đi MỘT CHIỀU: đầu vào → lớp ẩn → lớp ra. Không bao giờ quay lại.",
            "Mỗi lớp lặp đúng hai phép tính: z = W·a + b, rồi a = f(z).",
            "Hàm kích hoạt (ReLU, sigmoid, tanh...) cung cấp tính phi tuyến. Bỏ nó đi, mạng sụp về một đường thẳng.",
            "Với phân loại, lớp cuối thường dùng softmax để biến logits thành xác suất cộng = 1.",
            "W và b cố định trong lan truyền thuận; chúng chỉ đổi khi huấn luyện (qua lan truyền ngược).",
          ]}
        />

        <div className="h-6" />

        <Callout variant="tip" title="Bước tiếp theo: sửa sai bằng lan truyền ngược">
          Lan truyền thuận cho ra dự đoán ŷ. Nếu ŷ chưa khớp nhãn thực y, mạng
          phải học cách sửa. Quy trình này đi ngược chiều vừa rồi — mỗi lớp
          hỏi &ldquo;tôi đã đóng góp bao nhiêu vào sai số?&rdquo; rồi cập nhật
          trọng số. Xem tiếp tại{" "}
          <TopicLink slug="backpropagation">lan truyền ngược</TopicLink>, hoặc
          ôn lại{" "}
          <TopicLink slug="activation-functions">hàm kích hoạt</TopicLink> và{" "}
          <TopicLink slug="mlp">kiến trúc MLP</TopicLink> nếu cần.
        </Callout>

        <div className="h-6" />

        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
