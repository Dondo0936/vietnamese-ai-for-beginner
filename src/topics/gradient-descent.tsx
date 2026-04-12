"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  ToggleCompare,
  SliderGroup,
  Callout,
  MiniSummary,
  CodeBlock,
  LessonSection,
  TopicLink,} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "gradient-descent",
  title: "Gradient Descent",
  titleVi: "Hạ gradient",
  description:
    "Thuật toán tối ưu cốt lõi trong học máy, tìm cực tiểu của hàm mất mát bằng cách đi theo hướng gradient âm.",
  category: "neural-fundamentals",
  tags: ["optimization", "training", "fundamentals"],
  difficulty: "beginner",
  relatedSlugs: ["learning-rate", "sgd", "loss-functions", "backpropagation"],
  vizType: "interactive",
};

/* ---------- math helpers ---------- */
const X_MIN = -3;
const X_MAX = 7;
const Y_MIN = 0;
const Y_MAX = 28;
const SVG_W = 520;
const SVG_H = 280;
const PAD = 40;
const OPTIMUM = 2; // minimum of (x-2)^2 + 1

function loss(x: number) {
  return (x - OPTIMUM) ** 2 + 1;
}
function grad(x: number) {
  return 2 * (x - OPTIMUM);
}
function sx(x: number) {
  return PAD + ((x - X_MIN) / (X_MAX - X_MIN)) * (SVG_W - 2 * PAD);
}
function sy(y: number) {
  return SVG_H - PAD - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * (SVG_H - 2 * PAD);
}
function svgToX(svgX: number) {
  return X_MIN + ((svgX - PAD) / (SVG_W - 2 * PAD)) * (X_MAX - X_MIN);
}

/* ---------- main component ---------- */
export default function GradientDescentTopic() {
  /* ---- Step 2 state: user IS the optimizer ---- */
  const [pos, setPos] = useState<number | null>(null);
  const [lr, setLr] = useState(0.3);
  const [trail, setTrail] = useState<number[]>([]);
  const [steps, setSteps] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);

  const curvePoints = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 100; i++) {
      const x = X_MIN + (i / 100) * (X_MAX - X_MIN);
      pts.push(`${sx(x)},${sy(loss(x))}`);
    }
    return pts.join(" ");
  }, []);

  const handleCurveClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width) * SVG_W;
      const dataX = Math.max(X_MIN, Math.min(X_MAX, svgToX(clickX)));
      setPos(dataX);
      setTrail([]);
      setSteps(0);
    },
    [],
  );

  const takeStep = useCallback(() => {
    if (pos === null) return;
    const g = grad(pos);
    const next = Math.max(X_MIN, Math.min(X_MAX, pos - lr * g));
    setTrail((t) => [...t.slice(-19), pos]);
    setPos(next);
    setSteps((s) => s + 1);
  }, [pos, lr]);

  const resetOptimizer = useCallback(() => {
    setPos(null);
    setTrail([]);
    setSteps(0);
  }, []);

  /* ---- Step 4: GD variant animations ---- */
  const batchPath = useMemo(() => {
    const pts: number[] = [];
    let x = 6;
    for (let i = 0; i < 40; i++) {
      pts.push(x);
      x = x - 0.15 * grad(x);
      x = Math.max(X_MIN, Math.min(X_MAX, x));
    }
    return pts;
  }, []);

  const sgdPath = useMemo(() => {
    const pts: number[] = [];
    let x = 6;
    for (let i = 0; i < 40; i++) {
      pts.push(x);
      const noise = (Math.sin(i * 7.3) * 0.6 + Math.cos(i * 3.1) * 0.4);
      x = x - 0.15 * (grad(x) + noise);
      x = Math.max(X_MIN, Math.min(X_MAX, x));
    }
    return pts;
  }, []);

  /* ---- gradient arrow helper ---- */
  const arrowLen = 40;

  /* ---- quiz questions ---- */
  const quizQuestions: QuizQuestion[] = [
    {
      question: "Gradient tại điểm cực tiểu của hàm loss có giá trị bằng bao nhiêu?",
      options: ["Giá trị lớn nhất", "0", "Giá trị âm lớn nhất", "1"],
      correct: 1,
      explanation:
        "Tại điểm cực tiểu, độ dốc bằng 0 nên gradient = 0. Đây là dấu hiệu cho thấy thuật toán đã hội tụ.",
    },
    {
      question: "Mini-batch Gradient Descent kết hợp ưu điểm của hai phương pháp nào?",
      options: [
        "Batch GD và Adam",
        "Batch GD và SGD",
        "SGD và RMSprop",
        "Learning rate scheduling và SGD",
      ],
      correct: 1,
      explanation:
        "Mini-batch GD tính gradient trên một lô nhỏ dữ liệu, kết hợp sự ổn định của Batch GD với tốc độ của SGD.",
    },
    {
      question:
        "Nếu loss không giảm sau nhiều bước, nguyên nhân có thể nhất là gì?",
      options: [
        "Dữ liệu quá ít",
        "Learning rate quá lớn, gây dao động quanh cực tiểu",
        "Máy tính quá chậm",
        "Hàm loss không có cực tiểu",
      ],
      correct: 1,
      explanation:
        "Learning rate quá lớn khiến bước nhảy vượt qua cực tiểu, tạo dao động qua lại mà không bao giờ hội tụ.",
    },
    {
      type: "fill-blank",
      question: "Công thức cập nhật trọng số: θ_mới = θ_cũ − α × {blank}, trong đó α là learning rate.",
      blanks: [{ answer: "∇L(θ)", accept: ["gradient", "∇L", "grad", "đạo hàm", "nabla L"] }],
      explanation: "∇L(θ) là gradient (vector đạo hàm) của hàm loss theo vector trọng số θ. Trừ đi gradient nhân learning rate có nghĩa là đi ngược chiều gradient — chiều giảm loss nhanh nhất. Đây là bản chất của gradient descent.",
    },
  ];

  return (
    <>
      {/* ====== STEP 1: HOOK ====== */}
      <PredictionGate
        question="Bạn đứng trên đỉnh đồi trong sương mù, không thấy gì. Cách tốt nhất để xuống thung lũng là gì?"
        options={[
          "Nhảy thật xa một bước",
          "Bước nhỏ theo hướng dốc nhất",
          "Đi ngẫu nhiên",
          "Đứng yên chờ sương tan",
        ]}
        correct={1}
        explanation="Bước theo hướng dốc nhất chính là ý tưởng cốt lõi của gradient descent!"
      >
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Bạn đã chọn đúng — bước theo hướng dốc nhất. Bây giờ hãy <strong className="text-foreground">THỬ</strong> làm điều đó trên một hàm mất mát thực sự. Nhấp vào đường cong để đặt vị trí, rồi bắt đầu đi xuống.
        </p>

        {/* ====== STEP 2: DISCOVER — User IS the Optimizer ====== */}
        <VisualizationSection>
          <div className="space-y-4">
            <p className="text-sm text-muted text-center">
              {pos === null
                ? "Nhấp vào đường cong để đặt vị trí xuất phát, rồi tự tay tối ưu!"
                : "Nhấn 'Bước tiếp' để đi theo hướng gradient. Thử thay đổi learning rate!"}
            </p>

            {/* SVG loss curve */}
            <svg
              ref={svgRef}
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              className="w-full max-w-2xl mx-auto cursor-crosshair select-none"
              onClick={handleCurveClick}
            >
              {/* axes */}
              <line x1={PAD} y1={SVG_H - PAD} x2={SVG_W - PAD} y2={SVG_H - PAD} stroke="#334155" strokeWidth="1" />
              <line x1={PAD} y1={PAD} x2={PAD} y2={SVG_H - PAD} stroke="#334155" strokeWidth="1" />
              <text x={SVG_W / 2} y={SVG_H - 8} textAnchor="middle" fill="#64748b" fontSize="11">
                Trọng số (w)
              </text>
              <text x={15} y={SVG_H / 2} textAnchor="middle" fill="#64748b" fontSize="11"
                transform={`rotate(-90, 15, ${SVG_H / 2})`}>
                Loss
              </text>

              {/* optimum line */}
              <line x1={sx(OPTIMUM)} y1={SVG_H - PAD} x2={sx(OPTIMUM)} y2={sy(loss(OPTIMUM))}
                stroke="#22c55e" strokeWidth="1" strokeDasharray="4,3" opacity={0.5} />
              <text x={sx(OPTIMUM)} y={SVG_H - PAD + 14} textAnchor="middle" fill="#22c55e" fontSize="9">
                Cực tiểu
              </text>

              {/* loss curve */}
              <polyline points={curvePoints} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />

              {/* trail dots */}
              {trail.map((tx, i) => (
                <circle key={`t${i}`} cx={sx(tx)} cy={sy(loss(tx))} r={3}
                  fill="#f59e0b" opacity={0.25 + (i / trail.length) * 0.75} />
              ))}

              {/* gradient arrow at current position */}
              {pos !== null && (
                <>
                  {/* arrow shows direction of negative gradient */}
                  <line
                    x1={sx(pos)}
                    y1={sy(loss(pos))}
                    x2={sx(pos) - Math.sign(grad(pos)) * arrowLen}
                    y2={sy(loss(pos))}
                    stroke="#ef4444"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                  <defs>
                    <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                      <polygon points="0 0, 8 3, 0 6" fill="#ef4444" />
                    </marker>
                  </defs>

                  {/* ball */}
                  <motion.circle
                    cx={sx(pos)} cy={sy(loss(pos))} r={8}
                    fill="#ef4444" stroke="white" strokeWidth="2"
                    initial={false}
                    animate={{ cx: sx(pos), cy: sy(loss(pos)) }}
                    transition={{ type: "spring", stiffness: 120, damping: 15 }}
                  />
                  <motion.text
                    x={sx(pos)} y={sy(loss(pos)) - 14}
                    textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold"
                    initial={false} animate={{ x: sx(pos), y: sy(loss(pos)) - 14 }}>
                    loss={loss(pos).toFixed(2)}
                  </motion.text>
                </>
              )}
            </svg>

            {/* controls */}
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[180px] space-y-1">
                <label className="text-sm font-medium text-muted">
                  Learning rate: <strong className="text-foreground">{lr.toFixed(2)}</strong>
                </label>
                <input type="range" min="0.01" max="2.0" step="0.01" value={lr}
                  onChange={(e) => setLr(parseFloat(e.target.value))}
                  className="w-full accent-accent" />
                <div className="flex justify-between text-xs text-muted">
                  <span>0.01 — chậm</span>
                  <span>2.0 — nhanh</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={resetOptimizer}
                  className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors">
                  Đặt lại
                </button>
                <button onClick={takeStep} disabled={pos === null}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40">
                  Bước tiếp
                </button>
              </div>
            </div>

            {/* stats */}
            {pos !== null && (
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
                  <p className="text-xs text-muted">Số bước</p>
                  <p className="text-lg font-bold text-foreground">{steps}</p>
                </div>
                <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
                  <p className="text-xs text-muted">Loss hiện tại</p>
                  <p className="text-lg font-bold text-foreground">{loss(pos).toFixed(3)}</p>
                </div>
                <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
                  <p className="text-xs text-muted">Gradient</p>
                  <p className="text-lg font-bold text-foreground">{grad(pos).toFixed(3)}</p>
                </div>
              </div>
            )}

            {steps >= 3 && (
              <p className="text-sm text-center text-muted italic">
                Bạn đã dùng {steps} bước để đến loss = {pos !== null ? loss(pos).toFixed(3) : "?"}.
                {loss(pos ?? 99) < 1.1
                  ? " Tuyệt vời, gần cực tiểu rồi!"
                  : " Tiếp tục bước hoặc thử learning rate khác!"}
              </p>
            )}
          </div>
        </VisualizationSection>

        {/* ====== STEP 3: AHA MOMENT ====== */}
        <AhaMoment>
          <p>
            Quy trình bạn vừa thực hiện — đi theo hướng gradient, với bước nhảy
            tỷ lệ thuận với learning rate — chính là{" "}
            <strong>Gradient Descent</strong>!
          </p>
          <p className="text-sm mt-2 opacity-80">
            Công thức: w_mới = w_cũ - learning_rate &times; gradient
          </p>
        </AhaMoment>

        {/* ====== STEP 4: DEEPEN — Compare GD Variants ====== */}
        <ToggleCompare
          labelA="Batch GD"
          labelB="SGD"
          description="So sánh đường đi tối ưu: mượt mà vs. nhiễu nhưng cùng hướng"
          childA={<VariantViz path={batchPath} curvePoints={curvePoints} color="#3b82f6" label="Batch GD: đường đi mượt mà" />}
          childB={<VariantViz path={sgdPath} curvePoints={curvePoints} color="#f59e0b" label="SGD: đường đi zigzag nhưng nhanh" />}
        />

        <SliderGroup
          title="Thí nghiệm: điều chỉnh tham số"
          sliders={[
            { key: "lr", label: "Learning rate", min: 0.01, max: 2.0, step: 0.01, defaultValue: 0.3 },
            { key: "start", label: "Vị trí xuất phát", min: -3, max: 7, step: 0.1, defaultValue: 6 },
          ]}
          visualization={(vals) => (
            <SliderViz lr={vals.lr} start={vals.start} curvePoints={curvePoints} />
          )}
        />

        {/* ====== STEP 5: CHALLENGE ====== */}
        <InlineChallenge
          question="Learning rate = 5.0 trên hàm loss này sẽ gây ra điều gì?"
          options={[
            "Hội tụ nhanh hơn",
            "Dao động qua lại không hội tụ",
            "Không ảnh hưởng gì",
          ]}
          correct={1}
          explanation="LR quá lớn khiến bước nhảy vượt qua điểm tối ưu, tạo dao động!"
        />

        {/* ====== STEP 6: EXPLAIN ====== */}
        <ExplanationSection>
          <p>
            <strong>Gradient Descent</strong> cập nhật trọng số theo công thức (gradient được tính bởi <TopicLink slug="backpropagation">backpropagation</TopicLink>):
          </p>
          <div className="rounded-lg bg-background/50 border border-border p-4 text-center font-mono text-foreground text-lg">
            &theta; = &theta; &minus; &alpha; &nabla;L(&theta;)
          </div>
          <p>
            Trong đó <strong>&theta;</strong> là trọng số, <strong>&alpha;</strong> là
            learning rate, và <strong>&nabla;L(&theta;)</strong> là gradient của <TopicLink slug="loss-functions">hàm loss</TopicLink>.
            Việc tính đạo hàm dựa trên nền tảng <TopicLink slug="calculus-for-backprop">vi tích phân</TopicLink>, đặc biệt là đạo hàm riêng.
          </p>

          {/* variants table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-semibold text-foreground">Biến thể</th>
                  <th className="text-left py-2 pr-4 font-semibold text-foreground">Dữ liệu mỗi bước</th>
                  <th className="text-left py-2 font-semibold text-foreground">Đặc điểm</th>
                </tr>
              </thead>
              <tbody className="text-foreground/80">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-medium">Batch GD</td>
                  <td className="py-2 pr-4">Toàn bộ tập dữ liệu</td>
                  <td className="py-2">Ổn định, chậm với dữ liệu lớn</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-medium">SGD</td>
                  <td className="py-2 pr-4">1 mẫu ngẫu nhiên</td>
                  <td className="py-2">Nhanh, dao động nhiều</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">Mini-batch GD</td>
                  <td className="py-2 pr-4">Một lô nhỏ (32-256 mẫu)</td>
                  <td className="py-2">Cân bằng tốc độ và ổn định</td>
                </tr>
              </tbody>
            </table>
          </div>

          <CodeBlock language="python" title="gradient_descent.py">
{`def gradient_descent(w, lr, grad_fn, steps=100):
    for _ in range(steps):
        g = grad_fn(w)          # tính gradient
        w = w - lr * g          # cập nhật trọng số
        if abs(g) < 1e-6: break # hội tụ
    return w`}
          </CodeBlock>

          <Callout variant="tip" title="Learning rate scheduling">
            Trong thực tế, learning rate thường giảm dần theo thời gian. Bắt đầu
            với bước lớn để tiến nhanh, sau đó giảm dần để hội tụ chính xác —
            giống như bạn chạy nhanh khi còn xa đích và đi chậm khi đến gần.
            Gradient descent được dùng từ <TopicLink slug="linear-regression">hồi quy tuyến tính</TopicLink> đơn giản đến các mạng nơ-ron hàng tỷ tham số.
          </Callout>
        </ExplanationSection>

        {/* ====== STEP 7: CONNECT ====== */}
        <MiniSummary
          title="Gradient Descent — Điểm chốt"
          points={[
            "Gradient chỉ hướng tăng nhanh nhất của loss; đi ngược hướng gradient để giảm loss.",
            "Learning rate quyết định kích thước bước nhảy: quá nhỏ thì chậm, quá lớn thì dao động.",
            "Ba biến thể chính: Batch GD (ổn định), SGD (nhanh, nhiễu), Mini-batch (cân bằng).",
            "Mọi mô hình deep learning đều học bằng gradient descent hoặc biến thể của nó.",
          ]}
        />

        {/* ====== STEP 8: QUIZ ====== */}
        <QuizSection questions={quizQuestions} />
      </PredictionGate>
    </>
  );
}

/* ---------- sub-components ---------- */

/** Animated variant visualization for ToggleCompare */
function VariantViz({
  path,
  curvePoints,
  color,
  label,
}: {
  path: number[];
  curvePoints: string;
  color: string;
  label: string;
}) {
  const [frame, setFrame] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setFrame(0);
    intervalRef.current = setInterval(() => {
      setFrame((f) => {
        if (f >= path.length - 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return f;
        }
        return f + 1;
      });
    }, 120);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [path]);

  return (
    <div className="space-y-2">
      <p className="text-xs text-center text-muted">{label}</p>
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full max-w-xl mx-auto">
        <line x1={PAD} y1={SVG_H - PAD} x2={SVG_W - PAD} y2={SVG_H - PAD} stroke="#334155" strokeWidth="1" />
        <polyline points={curvePoints} fill="none" stroke="#3b82f6" strokeWidth="2" opacity={0.4} />
        {/* trail */}
        {path.slice(0, frame + 1).map((x, i) => (
          <circle key={i} cx={sx(x)} cy={sy(loss(x))} r={3}
            fill={color} opacity={0.2 + (i / (frame + 1)) * 0.8} />
        ))}
        {/* path lines */}
        {path.slice(0, frame + 1).map((x, i) =>
          i > 0 ? (
            <line key={`l${i}`}
              x1={sx(path[i - 1])} y1={sy(loss(path[i - 1]))}
              x2={sx(x)} y2={sy(loss(x))}
              stroke={color} strokeWidth="1.5" opacity={0.5} />
          ) : null,
        )}
        {/* current ball */}
        <motion.circle
          cx={sx(path[frame])} cy={sy(loss(path[frame]))} r={7}
          fill={color} stroke="white" strokeWidth="2"
          initial={false}
          animate={{ cx: sx(path[frame]), cy: sy(loss(path[frame])) }}
          transition={{ type: "spring", stiffness: 120 }}
        />
      </svg>
    </div>
  );
}

/** Driven descent visualization for SliderGroup */
function SliderViz({
  lr,
  start,
  curvePoints,
}: {
  lr: number;
  start: number;
  curvePoints: string;
}) {
  const path = useMemo(() => {
    const pts: number[] = [];
    let x = start;
    for (let i = 0; i < 30; i++) {
      pts.push(x);
      x = x - lr * grad(x);
      x = Math.max(X_MIN, Math.min(X_MAX, x));
    }
    return pts;
  }, [lr, start]);

  const diverges = path.some((x) => loss(x) > 50);

  return (
    <div className="space-y-2 w-full">
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full max-w-xl mx-auto">
        <line x1={PAD} y1={SVG_H - PAD} x2={SVG_W - PAD} y2={SVG_H - PAD} stroke="#334155" strokeWidth="1" />
        <polyline points={curvePoints} fill="none" stroke="#3b82f6" strokeWidth="2" opacity={0.4} />
        {/* optimum */}
        <line x1={sx(OPTIMUM)} y1={SVG_H - PAD} x2={sx(OPTIMUM)} y2={sy(loss(OPTIMUM))}
          stroke="#22c55e" strokeWidth="1" strokeDasharray="4,3" opacity={0.4} />

        {/* path */}
        {path.map((x, i) => {
          const y = Math.min(loss(x), Y_MAX);
          return (
            <circle key={i} cx={sx(x)} cy={sy(y)} r={i === 0 ? 6 : 3}
              fill={i === 0 ? "#3b82f6" : "#f59e0b"}
              opacity={i === 0 ? 1 : 0.3 + (i / path.length) * 0.7} />
          );
        })}
        {path.map((x, i) =>
          i > 0 ? (
            <line key={`l${i}`}
              x1={sx(path[i - 1])} y1={sy(Math.min(loss(path[i - 1]), Y_MAX))}
              x2={sx(x)} y2={sy(Math.min(loss(x), Y_MAX))}
              stroke="#f59e0b" strokeWidth="1" opacity={0.3} />
          ) : null,
        )}

        {/* final ball */}
        <circle cx={sx(path[path.length - 1])} cy={sy(Math.min(loss(path[path.length - 1]), Y_MAX))}
          r={6} fill="#ef4444" stroke="white" strokeWidth="2" />
      </svg>
      <p className="text-xs text-center text-muted">
        {diverges
          ? "LR quá lớn — bước nhảy vượt khỏi đồ thị!"
          : `Sau 30 bước: loss = ${loss(path[path.length - 1]).toFixed(3)}`}
      </p>
    </div>
  );
}
