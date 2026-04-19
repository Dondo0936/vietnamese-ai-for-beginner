"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mountain,
  CloudFog,
  Compass,
  Footprints,
  RotateCcw,
  Play,
  Pause,
  Sparkles,
  TriangleAlert,
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
  LaTeX,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "gradient-intuition",
  title: "Gradient Intuition",
  titleVi: "Gradient — mũi tên chỉ đường xuống dốc",
  description:
    "Trên một đồi sương mù bạn chỉ nhìn được mặt đất dưới chân. Gradient là ngón tay chỉ hướng dốc nhất — đi NGƯỢC lại để xuống núi.",
  category: "math-foundations",
  tags: ["gradient", "optimization", "intuition"],
  difficulty: "intermediate",
  relatedSlugs: ["derivatives-intuition", "gradient-descent", "calculus-for-backprop"],
  vizType: "interactive",
};

/* ────────────────────────────────────────────────────────────
   LOSS SURFACE — đơn giản nhưng rõ ràng
   L(x, y) = 0.18 (x − 1.5)² + 0.28 (y + 0.5)² + 0.15·x·y − 0.1·sin(x)
   Minimum xấp xỉ (1.5, -0.5).
   ──────────────────────────────────────────────────────────── */

const SURFACE_W = 520;
const SURFACE_H = 320;
const XMIN = -5;
const XMAX = 7;
const YMIN = -5;
const YMAX = 4;

function toPX(x: number) {
  return ((x - XMIN) / (XMAX - XMIN)) * SURFACE_W;
}
function toPY(y: number) {
  return SURFACE_H - ((y - YMIN) / (YMAX - YMIN)) * SURFACE_H;
}
function fromPX(px: number) {
  return XMIN + (px / SURFACE_W) * (XMAX - XMIN);
}
function fromPY(py: number) {
  return YMIN + ((SURFACE_H - py) / SURFACE_H) * (YMAX - YMIN);
}

function lossAt(x: number, y: number): number {
  return (
    0.18 * (x - 1.5) ** 2 +
    0.28 * (y + 0.5) ** 2 +
    0.15 * x * y -
    0.1 * Math.sin(x)
  );
}

function gradAt(x: number, y: number): [number, number] {
  const dx = 0.36 * (x - 1.5) + 0.15 * y - 0.1 * Math.cos(x);
  const dy = 0.56 * (y + 0.5) + 0.15 * x;
  return [dx, dy];
}

/* ────────────────────────────────────────────────────────────
   CONTOUR LINES — pre-computed polyline samples
   ──────────────────────────────────────────────────────────── */

const CONTOUR_LEVELS = [0.3, 0.7, 1.3, 2.2, 3.5, 5.2, 7.5, 10.5];

function sampleContour(level: number): { x: number; y: number }[] {
  // Cast rays from approximate minimum (1.5, -0.5) at various angles and binary-search for level.
  const pts: { x: number; y: number }[] = [];
  for (let a = 0; a < 360; a += 3) {
    const rad = (a * Math.PI) / 180;
    let lo = 0;
    let hi = 10;
    for (let iter = 0; iter < 22; iter++) {
      const mid = (lo + hi) / 2;
      const px = 1.5 + mid * Math.cos(rad);
      const py = -0.5 + mid * Math.sin(rad);
      if (lossAt(px, py) < level) lo = mid;
      else hi = mid;
    }
    const r = (lo + hi) / 2;
    const px = 1.5 + r * Math.cos(rad);
    const py = -0.5 + r * Math.sin(rad);
    if (px >= XMIN && px <= XMAX && py >= YMIN && py <= YMAX) {
      pts.push({ x: px, y: py });
    }
  }
  return pts;
}

function contourColor(level: number): string {
  const t = Math.min(level / 10.5, 1);
  if (t < 0.5) {
    const s = t * 2;
    const r = Math.round(50 + 120 * s);
    const g = Math.round(140 + 60 * s);
    const b = Math.round(220 - 80 * s);
    return `rgb(${r},${g},${b})`;
  }
  const s = (t - 0.5) * 2;
  const r = 255;
  const g = Math.round(200 * (1 - s));
  const b = 100 - Math.round(100 * s);
  return `rgb(${r},${Math.max(0, g)},${Math.max(0, b)})`;
}

/* ────────────────────────────────────────────────────────────
   QUIZ
   ──────────────────────────────────────────────────────────── */

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Gradient tại một điểm trên mặt loss có nghĩa là gì bằng tiếng Việt đời thường?",
    options: [
      "Độ lớn của loss tại điểm đó",
      "Mũi tên chỉ hướng mà loss TĂNG nhanh nhất",
      "Vị trí của điểm minimum",
      "Tốc độ học của mạng nơ-ron",
    ],
    correct: 1,
    explanation:
      "Gradient ∇L là vector chỉ hướng loss tăng nhanh nhất tại điểm hiện tại. Đó là lý do gradient descent đi NGƯỢC gradient — để loss giảm nhanh nhất.",
  },
  {
    question:
      "Bạn đứng trên sườn đồi sương mù. Tay phải cảm thấy đất cao hơn, tay trái cảm thấy đất thấp hơn. Để xuống nhanh nhất, bạn nên bước về hướng nào?",
    options: [
      "Hướng tay phải — nơi đất cao",
      "Hướng tay trái — nơi đất thấp",
      "Đi thẳng về phía trước",
      "Không đi — đứng yên an toàn hơn",
    ],
    correct: 1,
    explanation:
      "Đất cao hơn = hướng loss tăng = gradient. Đất thấp hơn = hướng loss giảm = −gradient. Gradient descent bảo bạn đi ngược gradient, tức về phía đất thấp hơn.",
  },
  {
    question:
      "Công thức cập nhật gradient descent là θ ← θ − η∇L. Trong đó η (eta) là gì?",
    options: [
      "Gradient tại điểm hiện tại",
      "Loss hiện tại",
      "Learning rate — kiểm soát độ lớn mỗi bước",
      "Số chiều của không gian tham số",
    ],
    correct: 2,
    explanation:
      "η là learning rate. Quá to → nhảy qua minimum, loss phát nổ. Quá nhỏ → bước lí tí, huấn luyện chậm. Tìm đúng η là nghệ thuật tinh chỉnh của mọi đội ML.",
  },
  {
    type: "fill-blank",
    question:
      "Gradient descent: θ ← θ − {blank} · ∇L. Tham số này, thường ký hiệu bằng chữ Hy Lạp η (eta), kiểm soát kích thước mỗi bước.",
    blanks: [
      {
        answer: "η",
        accept: ["η", "eta", "learning rate", "lr", "tốc độ học", "alpha"],
      },
    ],
    explanation:
      "η (eta) là learning rate. Trong thí nghiệm ở trên, η quá to làm bóng nảy khắp nơi; η quá nhỏ làm bóng nhích không thấy.",
  },
  {
    question:
      "Trong thí nghiệm thả bóng, bạn đặt bóng ở sườn rất dốc và bật η = 1.2. Điều gì xảy ra?",
    options: [
      "Bóng lăn êm xuống đáy",
      "Bóng bị văng qua đáy, sang sườn bên kia còn dốc hơn, loss nảy càng lúc càng cao",
      "Bóng đứng yên vì gradient bằng 0",
      "Bóng di chuyển chậm dần tới minimum",
    ],
    correct: 1,
    explanation:
      "Đây là phân kỳ. Bước quá dài → vượt qua đáy thung lũng → rơi xuống sườn có gradient lớn hơn → bước kế tiếp xa hơn → loss leo lên theo hàm mũ. Giải pháp: giảm η hoặc dùng gradient clipping.",
  },
  {
    question:
      "Vì sao mặt loss thực tế (ví dụ của neural network) có thể có nhiều minimum cục bộ (local minimum)?",
    options: [
      "Vì mạng nơ-ron bị lỗi lập trình",
      "Vì hàm loss của mạng sâu là hàm phi tuyến hàng tỉ chiều, có thể có nhiều điểm mà gradient = 0",
      "Vì gradient descent không chính xác",
      "Vì máy tính không đủ mạnh để tìm minimum toàn cục",
    ],
    correct: 1,
    explanation:
      "Với mạng nơ-ron lớn, mặt loss rất gồ ghề với nhiều saddle point và minimum cục bộ. May mắn: trong thực tế, nhiều minimum cục bộ cho kết quả gần như tương đương — và các trick như momentum, Adam giúp gradient descent thoát khỏi nhiều bẫy cạn.",
  },
];

/* ────────────────────────────────────────────────────────────
   TOTAL STEPS
   ──────────────────────────────────────────────────────────── */

const TOTAL_STEPS = 8;

/* ────────────────────────────────────────────────────────────
   COMPONENT CHÍNH
   ──────────────────────────────────────────────────────────── */

export default function GradientIntuitionTopic() {
  /* ── Viz 1: contour + ball ── */
  const [ballPos, setBallPos] = useState<[number, number]>([-3, 3]);
  const [trail, setTrail] = useState<[number, number][]>([[-3, 3]]);
  const [lr, setLr] = useState<number>(0.25);
  const [running, setRunning] = useState<boolean>(false);
  const [stepCount, setStepCount] = useState<number>(0);
  const runRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Precomputed contour polylines */
  const contourPolylines = useMemo(
    () =>
      CONTOUR_LEVELS.map((level) => ({
        level,
        color: contourColor(level),
        pts: sampleContour(level),
      })),
    [],
  );

  /* Gradient at ball */
  const [gx, gy] = useMemo(
    () => gradAt(ballPos[0], ballPos[1]),
    [ballPos],
  );
  const gradMag = Math.sqrt(gx * gx + gy * gy);
  const currentLoss = useMemo(
    () => lossAt(ballPos[0], ballPos[1]),
    [ballPos],
  );

  /* Take one gradient descent step */
  function takeStep(currentPos: [number, number], learningRate: number): [number, number] {
    const [cx, cy] = currentPos;
    const [dx, dy] = gradAt(cx, cy);
    const nx = cx - learningRate * dx;
    const ny = cy - learningRate * dy;
    // Clamp to plot range
    return [
      Math.max(XMIN + 0.1, Math.min(XMAX - 0.1, nx)),
      Math.max(YMIN + 0.1, Math.min(YMAX - 0.1, ny)),
    ];
  }

  function handleStep() {
    const next = takeStep(ballPos, lr);
    setBallPos(next);
    setTrail((t) => [...t, next].slice(-100));
    setStepCount((c) => c + 1);
  }

  function resetBall(pos: [number, number]) {
    setBallPos(pos);
    setTrail([pos]);
    setStepCount(0);
    setRunning(false);
  }

  /* Auto-run loop */
  useEffect(() => {
    if (!running) {
      if (runRef.current) clearInterval(runRef.current);
      return;
    }
    runRef.current = setInterval(() => {
      setBallPos((prev) => {
        const next = takeStep(prev, lr);
        setTrail((t) => [...t, next].slice(-100));
        setStepCount((c) => c + 1);
        return next;
      });
    }, 250);
    return () => {
      if (runRef.current) clearInterval(runRef.current);
    };
  }, [running, lr]);

  /* Auto-stop if diverging or settled */
  useEffect(() => {
    if (!running) return;
    if (Math.abs(ballPos[0]) > 6 || Math.abs(ballPos[1]) > 4.5) {
      setRunning(false);
    }
    if (gradMag < 0.03 && stepCount > 3) {
      setRunning(false);
    }
  }, [ballPos, gradMag, running, stepCount]);

  function onClickSurface(e: React.MouseEvent<SVGSVGElement>) {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * SURFACE_W;
    const py = ((e.clientY - rect.top) / rect.height) * SURFACE_H;
    const x = fromPX(px);
    const y = fromPY(py);
    resetBall([x, y]);
  }

  /* ── StepReveal content: one iteration explained ── */
  const iterationSteps = [
    {
      title: "1. Đọc tọa độ hiện tại",
      body: "Bạn đang ở điểm (x, y) trên đồi. Không nhìn thấy đỉnh vì sương mù — chỉ nhìn được đất dưới chân.",
      icon: Compass,
      color: "#0ea5e9",
    },
    {
      title: "2. Cảm nhận gradient",
      body: "Đưa tay lên, cảm nhận mặt đất nghiêng về hướng nào. Đây là gradient ∇L — mũi tên chỉ LÊN dốc (loss tăng).",
      icon: Mountain,
      color: "#f59e0b",
    },
    {
      title: "3. Bước ngược gradient",
      body: "Bước một bước theo hướng NGƯỢC gradient, độ dài bằng η × |∇L|. Nếu η vừa phải, bạn sẽ thấp hơn một chút.",
      icon: Footprints,
      color: "#22c55e",
    },
    {
      title: "4. Lặp lại",
      body: "Tại điểm mới, cảm nhận gradient lần nữa, bước tiếp. Sau nhiều lần, bạn dừng ở đáy — nơi gradient ≈ 0.",
      icon: RotateCcw,
      color: "#8b5cf6",
    },
  ];

  return (
    <>
      {/* ━━━ BƯỚC 1 — HOOK (núi sương mù) ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Ẩn dụ mở đầu">
        <div className="rounded-2xl border-2 border-accent/30 bg-accent-light p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/60 dark:bg-white/10">
              <CloudFog className="h-6 w-6 text-accent" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground leading-snug">
                Bạn đang trên núi sương mù
              </h3>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Bạn bị lạc trên đồi, sương phủ kín, chỉ thấy được <strong>vài mét
                mặt đất dưới chân</strong>. Bạn cần xuống đến thung lũng để trú
                ẩn. Làm sao đi được khi không thấy gì xa hơn chân mình?
              </p>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Câu trả lời đơn giản: <strong>đi về phía dốc xuống mạnh nhất</strong>.
                Nhìn đất dưới chân, bên nào thấp hơn rõ rệt — bước về đó. Lặp lại.
                Cuối cùng bạn sẽ tới đáy — có thể không phải đáy sâu nhất, nhưng
                chắc chắn là <em>một đáy</em>.
              </p>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Đó chính là <strong>gradient descent</strong>. Máy học cũng đi
                đúng như vậy — chỉ khác, đồi của nó là <em>mặt loss</em>, và tọa
                độ là <em>weights</em>.
              </p>
            </div>
          </div>

          {/* Mini sketch of the mountain */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="rounded-xl bg-white/70 dark:bg-white/5 p-3 text-center space-y-1">
              <Mountain className="mx-auto h-6 w-6 text-stone-500" />
              <p className="text-[11px] font-semibold text-foreground">Đồi</p>
              <p className="text-[10px] text-muted leading-tight">
                Mặt loss L(x, y) — mỗi tọa độ là một bộ weight.
              </p>
            </div>
            <div className="rounded-xl bg-white/70 dark:bg-white/5 p-3 text-center space-y-1">
              <Compass className="mx-auto h-6 w-6 text-amber-500" />
              <p className="text-[11px] font-semibold text-foreground">Ngón tay</p>
              <p className="text-[10px] text-muted leading-tight">
                Gradient ∇L — chỉ hướng dốc lên.
              </p>
            </div>
            <div className="rounded-xl bg-white/70 dark:bg-white/5 p-3 text-center space-y-1">
              <Footprints className="mx-auto h-6 w-6 text-emerald-500" />
              <p className="text-[11px] font-semibold text-foreground">Bước chân</p>
              <p className="text-[10px] text-muted leading-tight">
                θ ← θ − η∇L — bước ngược lại để xuống.
              </p>
            </div>
          </div>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 2 — DISCOVER (PredictionGate) ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Thử đoán">
        <PredictionGate
          question="Bạn đã biết phải đi ngược hướng dốc xuống. Giờ chọn độ dài MỖI BƯỚC. Bạn đặt bước rất to (η lớn) để xuống thật nhanh. Chuyện gì dễ xảy ra nhất?"
          options={[
            "Xuống đáy sau đúng một bước — ai cũng thích bước to",
            "Nhảy vọt qua đáy sang sườn đối diện, rồi lại nhảy về, loss không chịu giảm",
            "Bước to làm gradient trở về 0, thuật toán dừng sớm",
            "Máy tính tự phát hiện và âm thầm chia nhỏ bước hộ bạn",
          ]}
          correct={1}
          explanation="Bước quá to = đi quá đà. Ở đáy thung lũng hẹp, cú bước lớn sẽ đẩy bạn sang vách bên kia, rồi bước tiếp lại đẩy về bên đây — dao động, thậm chí phân kỳ (loss càng lúc càng to). Ngược lại, bước quá nhỏ đi mãi không tới. Learning rate η phải vừa đủ — bài sau bạn sẽ tự điều chỉnh để thấy cả ba chế độ."
        >
          <p className="text-sm text-muted mt-3 leading-relaxed">
            Giờ ta sẽ thả một viên bi lên mặt loss 2D thật và xem nó lăn. Bạn
            điều chỉnh learning rate — xem điều gì xảy ra khi quá to, quá nhỏ.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ BƯỚC 3 — REVEAL (contour map + clickable ball) ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khám phá tương tác">
        <VisualizationSection topicSlug={metadata.slug}>
          <LessonSection label="Thí nghiệm 1: Thả bóng lên mặt loss" step={1}>
            <p className="text-sm text-muted mb-3 leading-relaxed">
              <strong>Bấm vào bản đồ contour</strong> để đặt bóng ở vị trí đó. Các
              đường cong là các &ldquo;đường đồng mức&rdquo; loss — như đường đồng
              mức trên bản đồ địa hình. Xanh = thấp (gần đáy), đỏ = cao.
            </p>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between gap-3 p-3 border-b border-border bg-surface/60">
                <div className="flex items-center gap-2 text-xs">
                  <Compass className="h-4 w-4 text-accent" />
                  <span className="font-semibold text-foreground">
                    Bản đồ contour của L(x, y)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-tertiary tabular-nums">
                  <span>
                    Vị trí: ({ballPos[0].toFixed(2)}, {ballPos[1].toFixed(2)})
                  </span>
                  <span>·</span>
                  <span>Loss: {currentLoss.toFixed(3)}</span>
                  <span>·</span>
                  <span>Bước: {stepCount}</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-sky-50 via-white to-rose-50 dark:from-sky-950/30 dark:via-neutral-950 dark:to-rose-950/30">
                <svg
                  viewBox={`0 0 ${SURFACE_W} ${SURFACE_H}`}
                  className="w-full cursor-crosshair"
                  role="img"
                  aria-label="Bản đồ contour tương tác: bấm để đặt bóng, quan sát gradient và bước cập nhật."
                  onClick={onClickSurface}
                >
                  <title>
                    Mặt loss L(x, y) — bóng ở ({ballPos[0].toFixed(1)},{" "}
                    {ballPos[1].toFixed(1)}), gradient |∇L| = {gradMag.toFixed(2)}
                  </title>

                  {/* Contours */}
                  {contourPolylines.map(({ level, color, pts }) => {
                    if (pts.length < 3) return null;
                    const d =
                      pts
                        .map(
                          (p, i) =>
                            `${i === 0 ? "M" : "L"} ${toPX(p.x).toFixed(1)} ${toPY(p.y).toFixed(1)}`,
                        )
                        .join(" ") + " Z";
                    return (
                      <path
                        key={level}
                        d={d}
                        fill="none"
                        stroke={color}
                        strokeWidth={1.2}
                        opacity={0.8}
                      />
                    );
                  })}

                  {/* Minimum marker */}
                  <circle
                    cx={toPX(1.5)}
                    cy={toPY(-0.5)}
                    r={5}
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth={2}
                    strokeDasharray="3,3"
                  />
                  <text
                    x={toPX(1.5)}
                    y={toPY(-0.5) + 18}
                    textAnchor="middle"
                    fontSize={11}
                    fill="#166534"
                    fontWeight={600}
                  >
                    đáy ≈ (1.5, -0.5)
                  </text>

                  {/* Trail */}
                  {trail.length > 1 && (
                    <polyline
                      points={trail
                        .map((p) => `${toPX(p[0]).toFixed(1)},${toPY(p[1]).toFixed(1)}`)
                        .join(" ")}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth={1.5}
                      opacity={0.6}
                      strokeDasharray="2,2"
                    />
                  )}

                  {/* Trail dots */}
                  {trail.slice(0, -1).map((p, i) => (
                    <circle
                      key={i}
                      cx={toPX(p[0])}
                      cy={toPY(p[1])}
                      r={2}
                      fill="#3b82f6"
                      opacity={0.35 + (i / trail.length) * 0.4}
                    />
                  ))}

                  {/* Gradient arrow (uphill) — red, from ball */}
                  {gradMag > 0.03 && (
                    <>
                      <defs>
                        <marker
                          id="grad-up"
                          markerWidth="10"
                          markerHeight="10"
                          refX="9"
                          refY="5"
                          orient="auto"
                        >
                          <path d="M 0 0 L 10 5 L 0 10 Z" fill="#ef4444" />
                        </marker>
                        <marker
                          id="grad-down"
                          markerWidth="10"
                          markerHeight="10"
                          refX="9"
                          refY="5"
                          orient="auto"
                        >
                          <path d="M 0 0 L 10 5 L 0 10 Z" fill="#22c55e" />
                        </marker>
                      </defs>
                      {(() => {
                        const scale = Math.min(1.8, 1.2 / Math.max(gradMag, 0.1));
                        const pxBall = toPX(ballPos[0]);
                        const pyBall = toPY(ballPos[1]);
                        const pxUp = toPX(ballPos[0] + gx * scale);
                        const pyUp = toPY(ballPos[1] + gy * scale);
                        const pxDown = toPX(ballPos[0] - gx * scale);
                        const pyDown = toPY(ballPos[1] - gy * scale);
                        return (
                          <>
                            <line
                              x1={pxBall}
                              y1={pyBall}
                              x2={pxUp}
                              y2={pyUp}
                              stroke="#ef4444"
                              strokeWidth={2.5}
                              markerEnd="url(#grad-up)"
                            />
                            <line
                              x1={pxBall}
                              y1={pyBall}
                              x2={pxDown}
                              y2={pyDown}
                              stroke="#22c55e"
                              strokeWidth={2.5}
                              strokeDasharray="5,3"
                              markerEnd="url(#grad-down)"
                            />
                            <text
                              x={pxUp + 6}
                              y={pyUp - 4}
                              fontSize={11}
                              fill="#ef4444"
                              fontWeight={700}
                            >
                              ∇L
                            </text>
                            <text
                              x={pxDown - 28}
                              y={pyDown + 10}
                              fontSize={11}
                              fill="#166534"
                              fontWeight={700}
                            >
                              −∇L
                            </text>
                          </>
                        );
                      })()}
                    </>
                  )}

                  {/* Ball */}
                  <motion.circle
                    cx={toPX(ballPos[0])}
                    cy={toPY(ballPos[1])}
                    r={8}
                    fill="#3b82f6"
                    stroke="#fff"
                    strokeWidth={2}
                    initial={false}
                    animate={{
                      cx: toPX(ballPos[0]),
                      cy: toPY(ballPos[1]),
                    }}
                    transition={{ type: "spring", stiffness: 220, damping: 18 }}
                  />
                </svg>
              </div>

              {/* Controls */}
              <div className="p-3 border-t border-border bg-surface/60 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleStep}
                    disabled={running}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-accent bg-accent text-white px-3 py-1.5 text-xs font-semibold hover:opacity-90 disabled:opacity-40"
                  >
                    <Footprints className="h-3.5 w-3.5" />
                    Bước một lần
                  </button>
                  <button
                    type="button"
                    onClick={() => setRunning((r) => !r)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      running
                        ? "border-rose-400 bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200"
                        : "border-border bg-card text-foreground hover:border-accent/50"
                    }`}
                  >
                    {running ? (
                      <>
                        <Pause className="h-3.5 w-3.5" /> Dừng
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5" /> Tự chạy
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => resetBall([-3, 3])}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card text-muted px-3 py-1.5 text-xs font-semibold hover:border-accent/50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Đặt lại
                  </button>
                  <span className="ml-auto text-[11px] text-tertiary italic">
                    |∇L| = {gradMag.toFixed(3)}
                  </span>
                </div>

                {/* LR slider (inline because ball interacts with running loop) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-foreground">
                      Learning rate η
                    </label>
                    <span
                      className="text-xs font-bold tabular-nums px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor:
                          lr < 0.05
                            ? "#0ea5e911"
                            : lr > 0.9
                              ? "#ef444422"
                              : "#22c55e22",
                        color:
                          lr < 0.05
                            ? "#0ea5e9"
                            : lr > 0.9
                              ? "#ef4444"
                              : "#16a34a",
                      }}
                    >
                      {lr.toFixed(3)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.01}
                    max={1.5}
                    step={0.01}
                    value={lr}
                    onChange={(e) => setLr(parseFloat(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    aria-label="Learning rate"
                    style={{
                      background:
                        "linear-gradient(to right, #0ea5e9 0%, #22c55e 45%, #f59e0b 75%, #ef4444 100%)",
                    }}
                  />
                  <div className="flex justify-between mt-1 text-[10px] text-tertiary">
                    <span>0.01 — stall</span>
                    <span>0.25 — êm</span>
                    <span>0.7 — nảy</span>
                    <span>1.5 — nổ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Diagnosis panel */}
            <AnimatePresence mode="wait">
              <motion.div
                key={
                  lr < 0.05
                    ? "stall"
                    : lr > 0.9
                      ? "explode"
                      : lr > 0.55
                        ? "oscillate"
                        : "good"
                }
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="mt-3"
              >
                {lr < 0.05 && (
                  <Callout variant="info" title="Learning rate rất nhỏ — bóng nhích không thấy">
                    Mỗi bước chỉ là một &ldquo;hạt gạo&rdquo; trên bản đồ. Đúng
                    hướng, nhưng đến đáy sẽ tốn hàng ngàn lần bấm. Đây là &ldquo;đi
                    quá chậm&rdquo; — lãng phí thời gian tính toán.
                  </Callout>
                )}
                {lr >= 0.05 && lr <= 0.55 && (
                  <Callout variant="tip" title="Learning rate vừa phải — bóng lăn êm">
                    Quan sát bóng lăn gần như thẳng về đáy theo đường cong tự
                    nhiên. Đây là vùng &ldquo;hội tụ mượt&rdquo; — mục tiêu của
                    mọi setup huấn luyện.
                  </Callout>
                )}
                {lr > 0.55 && lr <= 0.9 && (
                  <Callout variant="warning" title="Learning rate hơi to — bóng nảy quanh đáy">
                    Bóng vẫn tìm được đáy, nhưng mỗi bước hơi lố — nó nhảy qua
                    minimum rồi bật ngược. Loss giảm nhưng dao động. Tăng nữa
                    sẽ phân kỳ.
                  </Callout>
                )}
                {lr > 0.9 && (
                  <Callout variant="warning" title="Learning rate quá to — bóng phát nổ">
                    Mỗi bước vượt QUA đáy sang sườn bên kia có gradient còn LỚN
                    HƠN. Bước kế tiếp xa hơn → loss leo lên vô cùng. Đây chính
                    là điều xảy ra khi huấn luyện thật và η sai lệch 10×.
                  </Callout>
                )}
              </motion.div>
            </AnimatePresence>
          </LessonSection>

          {/* Preset buttons — quick tours */}
          <LessonSection label="Thí nghiệm 2: Ba tình huống mẫu" step={2}>
            <p className="text-sm text-muted mb-3 leading-relaxed">
              Bấm một nút để xem kịch bản đã cấu hình sẵn. Bóng sẽ được đặt ở vị
              trí và η tương ứng, rồi bạn bấm &ldquo;Tự chạy&rdquo; ở trên để xem.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  resetBall([-3, 3]);
                  setLr(0.2);
                }}
                className="rounded-xl border border-border bg-card hover:border-emerald-400 p-3 text-left transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Footprints className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-semibold text-foreground">
                    Êm ái
                  </span>
                </div>
                <p className="text-[11px] text-muted leading-snug">
                  Bóng thả trên đồi cao, η = 0.20 → lăn từ từ xuống đáy.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  resetBall([-2, 2]);
                  setLr(0.05);
                }}
                className="rounded-xl border border-border bg-card hover:border-sky-400 p-3 text-left transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <TriangleAlert className="h-4 w-4 text-sky-500" />
                  <span className="text-sm font-semibold text-foreground">
                    Quá chậm
                  </span>
                </div>
                <p className="text-[11px] text-muted leading-snug">
                  η = 0.05 → bước nhỏ xíu, mỏi tay bấm mà bóng gần như không
                  nhúc nhích.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  resetBall([2, 3]);
                  setLr(1.05);
                }}
                className="rounded-xl border border-border bg-card hover:border-rose-400 p-3 text-left transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <TriangleAlert className="h-4 w-4 text-rose-500" />
                  <span className="text-sm font-semibold text-foreground">
                    Phát nổ
                  </span>
                </div>
                <p className="text-[11px] text-muted leading-snug">
                  η = 1.05 → bóng văng khắp bản đồ, loss tăng thay vì giảm.
                </p>
              </button>
            </div>
          </LessonSection>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 4 — DEEPEN (StepReveal of one iteration) ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Đi sâu — một vòng">
        <p className="text-sm text-muted mb-4 leading-relaxed">
          Giờ mổ xẻ chi tiết MỘT bước gradient descent. Bấm &ldquo;Tiếp tục&rdquo;
          để xem từng giai đoạn.
        </p>

        <StepReveal labels={iterationSteps.map((s) => s.title)}>
          {iterationSteps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.title}
                className="rounded-xl border border-border bg-card p-5 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: s.color + "18", color: s.color }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">{s.title}</h4>
                </div>
                <p className="text-sm text-foreground/85 leading-relaxed">{s.body}</p>

                {/* Accompanying mini visual */}
                <div className="rounded-lg bg-surface border border-border p-3">
                  <IterationMiniVisual phase={s.title} color={s.color} />
                </div>
              </div>
            );
          })}
        </StepReveal>

        <div className="mt-6">
          <AhaMoment>
            <strong>Gradient descent không phải phép thuật</strong> — nó chỉ là
            nguyên tắc cũ nhất của người leo núi: <em>khi sương mù, hãy đi về
            phía dốc xuống mạnh nhất</em>. Điều duy nhất chúng ta thêm vào là
            hằng số η (learning rate) — để kiểm soát cỡ bước sao cho không lao
            đầu xuống vực.
          </AhaMoment>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 5 — CHALLENGE ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Bạn đặt bóng ở đỉnh đồi cao (ví dụ tọa độ (6, 3)), rồi bật learning rate to (η = 1.3). Bấm 'Tự chạy'. Điều gì xảy ra?"
          options={[
            "Bóng lăn nhanh về đáy vì η to giúp xuống dốc nhanh",
            "Bóng dừng ngay tại đỉnh vì gradient bằng 0",
            "Bóng bị văng ra xa, mỗi bước vượt qua minimum và đáp vào sườn có gradient lớn hơn → loss tăng theo cấp số nhân",
            "Bóng đi thẳng tới minimum rồi dừng",
          ]}
          correct={2}
          explanation="Phân kỳ. Khi bước cập nhật η·∇L quá lớn, điểm mới vượt qua đáy và rơi vào vùng có gradient lớn hơn. Mỗi vòng lặp khuếch đại sai số. Giải pháp: giảm η, hoặc dùng các trick như gradient clipping, learning-rate warmup."
        />

        <div className="mt-5">
          <InlineChallenge
            question="Bóng của bạn đang lăn ngoan về đáy. Sau vài bước, gradient tại vị trí bóng giảm dần. Điều này có nghĩa là gì?"
            options={[
              "Bóng đang mất phương hướng — nên đặt lại",
              "Gradient giảm nhỏ = độ dốc gần 0 = bóng gần tới đáy. Các bước sau sẽ ngắn hơn một cách tự nhiên",
              "Learning rate đang tự điều chỉnh",
              "Mạng nơ-ron đã bị lỗi",
            ]}
            correct={1}
            explanation="Đây chính là tính chất hay của gradient descent: càng gần minimum, gradient càng nhỏ → bước càng ngắn → dừng tự nhiên. Không cần cơ chế phức tạp để biết đã tới đích — chỉ cần theo dõi |∇L|."
          />
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 6 — EXPLAIN (≤2 LaTeX) ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích toán">
        <ExplanationSection topicSlug={metadata.slug}>
          <p className="leading-relaxed">
            Đã thấy bằng hình: bóng lăn xuống đồi, ngón tay chỉ hướng dốc lên,
            bước ngược hướng đó. Giờ ghi lại bằng hai công thức — mỗi công thức
            đi kèm một câu giải thích bằng tiếng Việt đời thường.
          </p>

          {/* Formula 1 — gradient definition */}
          <div className="rounded-xl border border-border bg-surface/50 p-5 my-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-white text-sm font-bold">
                1
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Gradient là vector các đạo hàm riêng
                </p>
                <p className="text-xs text-muted">
                  Mỗi thành phần trả lời: &ldquo;giữ các weight khác yên, đổi
                  riêng wᵢ thì loss đổi bao nhiêu?&rdquo;
                </p>
              </div>
            </div>

            <LaTeX block>
              {"\\nabla L(\\theta) = \\left[ \\frac{\\partial L}{\\partial \\theta_1}, \\frac{\\partial L}{\\partial \\theta_2}, \\ldots, \\frac{\\partial L}{\\partial \\theta_n} \\right]"}
            </LaTeX>

            {/* Visual: gradient as arrow over contour */}
            <div className="rounded-lg bg-card border border-border p-3">
              <svg viewBox="0 0 440 120" className="w-full">
                <title>Gradient là mũi tên chỉ hướng loss tăng nhanh nhất.</title>
                {/* contours */}
                {[30, 55, 80, 105].map((r, i) => (
                  <ellipse
                    key={r}
                    cx={220}
                    cy={60}
                    rx={r * 1.3}
                    ry={r * 0.5}
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth={1}
                    opacity={0.25 - i * 0.04}
                  />
                ))}
                {/* point */}
                <circle cx={220} cy={60} r={6} fill="#3b82f6" stroke="#fff" strokeWidth={2} />
                {/* gradient arrow */}
                <line x1={220} y1={60} x2={310} y2={25} stroke="#ef4444" strokeWidth={2.5} />
                <path d="M 310 25 L 302 24 L 304 32 Z" fill="#ef4444" />
                <text x={314} y={22} fontSize={11} fill="#ef4444" fontWeight={700}>
                  ∇L (lên dốc)
                </text>
                {/* down arrow */}
                <line
                  x1={220}
                  y1={60}
                  x2={130}
                  y2={95}
                  stroke="#22c55e"
                  strokeWidth={2.5}
                  strokeDasharray="4,3"
                />
                <path d="M 130 95 L 138 94 L 136 86 Z" fill="#22c55e" />
                <text x={54} y={108} fontSize={11} fill="#22c55e" fontWeight={700}>
                  −∇L (xuống dốc)
                </text>
              </svg>
            </div>

            <p className="text-xs text-muted italic leading-relaxed">
              &ldquo;Đứng tại một điểm, gradient là mũi tên chỉ ra xa đáy. Luôn
              đi ngược mũi tên đó.&rdquo;
            </p>
          </div>

          {/* Formula 2 — update rule */}
          <div className="rounded-xl border border-border bg-surface/50 p-5 my-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-white text-sm font-bold">
                2
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Công thức cập nhật — một dòng, cả kỷ nguyên deep learning
                </p>
                <p className="text-xs text-muted">
                  η (eta) kiểm soát cỡ bước. Vector θ chứa toàn bộ weight của mô
                  hình.
                </p>
              </div>
            </div>

            <LaTeX block>
              {"\\theta \\leftarrow \\theta - \\eta \\, \\nabla L(\\theta)"}
            </LaTeX>

            {/* Visual: arrow subtraction */}
            <div className="rounded-lg bg-card border border-border p-3">
              <svg viewBox="0 0 440 100" className="w-full">
                <title>
                  Vector θ cũ trừ đi η × ∇L = vector θ mới, luôn tiến gần hơn
                  đáy.
                </title>
                {/* θ old */}
                <circle cx={90} cy={55} r={6} fill="#3b82f6" stroke="#fff" strokeWidth={2} />
                <text x={90} y={80} textAnchor="middle" fontSize={11} fill="#1e3a8a" fontWeight={600}>
                  θ cũ
                </text>

                {/* gradient arrow from θ old (uphill) */}
                <line x1={90} y1={55} x2={170} y2={25} stroke="#ef4444" strokeWidth={2} />
                <path d="M 170 25 L 162 24 L 164 32 Z" fill="#ef4444" />
                <text x={176} y={22} fontSize={11} fill="#ef4444" fontWeight={600}>
                  ∇L
                </text>

                {/* negated gradient arrow */}
                <line x1={210} y1={55} x2={290} y2={85} stroke="#22c55e" strokeWidth={2} strokeDasharray="4,3" />
                <path d="M 290 85 L 282 84 L 284 76 Z" fill="#22c55e" />
                <text x={296} y={92} fontSize={11} fill="#22c55e" fontWeight={600}>
                  −η·∇L
                </text>

                {/* θ new */}
                <circle cx={330} cy={55} r={6} fill="#22c55e" stroke="#fff" strokeWidth={2} />
                <text x={330} y={80} textAnchor="middle" fontSize={11} fill="#166534" fontWeight={600}>
                  θ mới
                </text>

                {/* Equals sign */}
                <text x={150} y={60} fontSize={16} fill="var(--text-primary)" fontWeight={700}>
                  +
                </text>
                <text x={295} y={60} fontSize={16} fill="var(--text-primary)" fontWeight={700}>
                  =
                </text>
              </svg>
            </div>

            <p className="text-xs text-muted italic leading-relaxed">
              &ldquo;Ở tọa độ cũ, cộng thêm một mũi tên ngược gradient, bạn ra
              tọa độ mới — gần đáy hơn.&rdquo;
            </p>
          </div>

          <Callout variant="info" title="Tại sao mặt loss thực tế gồ ghề hơn nhiều?">
            Trong bài này mặt loss chỉ có 2 chiều — để bạn nhìn được. Thực tế mạng
            nơ-ron có hàng tỉ chiều, mặt loss rất gồ ghề với nhiều{" "}
            <strong>saddle point</strong> (điểm yên ngựa) và{" "}
            <strong>local minimum</strong>. May mắn, thực nghiệm cho thấy hầu hết
            các local minimum trên mạng lớn cho chất lượng tương đương — và các
            biến thể như <TopicLink slug="gradient-descent">gradient descent</TopicLink>{" "}
            + momentum giúp thoát khỏi nhiều bẫy cạn.
          </Callout>

          <CollapsibleDetail title="Vì sao gradient luôn chỉ LÊN dốc, không phải xuống?">
            <div className="space-y-2 text-sm leading-relaxed text-muted">
              <p>
                Theo định nghĩa toán học: gradient là vector chứa đạo hàm riêng
                dương theo mỗi biến, và tại mỗi điểm nó là hướng mà loss tăng
                nhanh nhất. Đó là lý do ta viết <em>trừ</em> gradient (không phải
                cộng) trong công thức cập nhật — để đi ngược lại, tức xuống dốc.
              </p>
              <p>
                Nếu ai đó &ldquo;gradient descent&rdquo; bằng cách cộng gradient, bạn
                sẽ thấy loss <strong>tăng</strong> thay vì giảm. Lỗi này thường gặp
                khi học lần đầu.
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="Các biến thể hay gặp: momentum, Adam">
            <div className="space-y-2 text-sm leading-relaxed text-muted">
              <p>
                Gradient descent cơ bản dễ mắc kẹt ở saddle point và dao động
                quanh đáy hẹp. Các biến thể:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Momentum:</strong> thêm &ldquo;quán tính&rdquo; vào bước
                  — như viên bi lăn. Giúp vượt các &ldquo;bẫy cạn&rdquo;.
                </li>
                <li>
                  <strong>Adam / AdamW:</strong> điều chỉnh learning rate cho
                  từng weight riêng dựa trên lịch sử gradient.
                </li>
                <li>
                  <strong>SGD (stochastic):</strong> tính gradient trên batch
                  nhỏ, ồn ào hơn nhưng nhanh hơn và đôi khi tổng quát hoá tốt hơn.
                </li>
              </ul>
              <p>
                Dù khác nhau, tất cả vẫn là &ldquo;đi ngược gradient&rdquo; — chỉ khác
                ở cách quyết định cỡ bước.
              </p>
            </div>
          </CollapsibleDetail>

          <p className="leading-relaxed mt-4">
            Khi bạn huấn luyện mạng nơ-ron thực, gradient descent là vòng lặp cốt
            lõi — còn cách <em>tính</em> gradient qua các lớp là công việc của{" "}
            <TopicLink slug="calculus-for-backprop">
              giải tích cho backprop
            </TopicLink>
            . Hai mảnh ghép này cùng tạo nên toàn bộ kỷ nguyên deep learning hiện
            đại.
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 7 — CONNECT ━━━ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt & Liên kết">
        <MiniSummary
          title="Ba ý bạn mang về"
          points={[
            "Gradient là vector chỉ hướng loss TĂNG nhanh nhất. Đi NGƯỢC gradient để loss giảm nhanh nhất — đó là gradient descent.",
            "Learning rate η kiểm soát cỡ bước: quá to → phân kỳ, quá nhỏ → stall, vừa đủ → hội tụ. Tinh chỉnh η là nghệ thuật quan trọng bậc nhất trong ML.",
            "Trên mặt loss thực tế (hàng tỉ chiều), gradient descent không đảm bảo tới minimum toàn cục — nhưng trong thực nghiệm, local minimum đa phần cho chất lượng tương đương.",
          ]}
        />

        <div className="mt-5 space-y-3">
          <Callout variant="tip" title="Bước kế tiếp trong lộ trình">
            Tiếp tục với{" "}
            <TopicLink slug="gradient-descent">
              gradient descent
            </TopicLink>{" "}
            để đi sâu vào các biến thể (momentum, Adam, SGD) và cách áp dụng
            trong huấn luyện mạng thực. Để hiểu cách <em>tính</em> gradient qua
            các lớp, đọc{" "}
            <TopicLink slug="calculus-for-backprop">
              giải tích cho backprop
            </TopicLink>
            .
          </Callout>

          <Callout variant="insight" title="Một sự thật nhỏ">
            Khi Geoffrey Hinton và đồng nghiệp huấn luyện được mạng sâu vào
            2006-2012, họ không phát minh ra gradient descent — thuật toán này
            có từ Cauchy năm 1847. Cái họ tìm ra là cách <em>giữ cho gradient không
            chết</em> qua nhiều lớp (ReLU, dropout, khởi tạo thông minh) để ý
            tưởng &ldquo;đi ngược gradient&rdquo; vẫn hoạt động trên mạng 100+
            lớp.
          </Callout>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 8 — QUIZ ━━━ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
        <div className="mt-6 flex items-center justify-center text-xs text-muted gap-2">
          <Sparkles className="h-3.5 w-3.5" />
          Bạn có thể làm lại quiz và nghịch tiếp bản đồ contour bất cứ lúc nào.
        </div>
      </LessonSection>
    </>
  );
}

/* ────────────────────────────────────────────────────────────
   SUB-COMPONENT — tiny animated visual for each iteration step
   ──────────────────────────────────────────────────────────── */

function IterationMiniVisual({ phase, color }: { phase: string; color: string }) {
  if (phase.startsWith("1.")) {
    // Current position marker on a mini contour
    return (
      <svg viewBox="0 0 440 80" className="w-full">
        <title>Xác định vị trí (x, y) trên bản đồ contour.</title>
        {[18, 32, 46, 60].map((r) => (
          <ellipse
            key={r}
            cx={220}
            cy={40}
            rx={r * 1.6}
            ry={r * 0.5}
            fill="none"
            stroke={color}
            strokeWidth={1}
            opacity={0.28}
          />
        ))}
        <circle cx={140} cy={52} r={7} fill={color} stroke="#fff" strokeWidth={2} />
        <text x={140} y={74} textAnchor="middle" fontSize={11} fill={color} fontWeight={600}>
          (x, y)
        </text>
      </svg>
    );
  }
  if (phase.startsWith("2.")) {
    // Upward arrow — gradient uphill
    return (
      <svg viewBox="0 0 440 80" className="w-full">
        <title>Cảm nhận gradient ∇L — mũi tên chỉ lên dốc.</title>
        <circle cx={140} cy={52} r={7} fill={color} stroke="#fff" strokeWidth={2} />
        <line x1={140} y1={52} x2={280} y2={16} stroke="#ef4444" strokeWidth={2.5} />
        <path d="M 280 16 L 272 15 L 274 23 Z" fill="#ef4444" />
        <text x={284} y={14} fontSize={11} fill="#ef4444" fontWeight={700}>
          ∇L lên dốc
        </text>
      </svg>
    );
  }
  if (phase.startsWith("3.")) {
    // Downward step — animated dot moving
    return (
      <svg viewBox="0 0 440 80" className="w-full">
        <title>Bước ngược gradient — đi xuống dốc.</title>
        <circle cx={140} cy={52} r={7} fill={color} stroke="#fff" strokeWidth={2} opacity={0.4} />
        <motion.circle
          cx={140}
          cy={52}
          r={7}
          fill={color}
          stroke="#fff"
          strokeWidth={2}
          animate={{ cx: [140, 220], cy: [52, 60] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <line
          x1={140}
          y1={52}
          x2={220}
          y2={60}
          stroke="#22c55e"
          strokeWidth={2}
          strokeDasharray="3,3"
        />
        <text x={180} y={40} textAnchor="middle" fontSize={11} fill="#22c55e" fontWeight={600}>
          bước: −η·∇L
        </text>
      </svg>
    );
  }
  // phase "4." — loop
  return (
    <svg viewBox="0 0 440 80" className="w-full">
      <title>Lặp lại quá trình cho đến khi gradient ≈ 0.</title>
      {[140, 200, 260, 310, 345].map((cx, i) => (
        <circle
          key={cx}
          cx={cx}
          cy={52 - i * 2}
          r={6 - i * 0.5}
          fill={color}
          opacity={1 - i * 0.15}
          stroke="#fff"
          strokeWidth={1.5}
        />
      ))}
      {[140, 200, 260, 310].map((cx, i) => (
        <line
          key={`l-${cx}`}
          x1={cx}
          y1={52 - i * 2}
          x2={[200, 260, 310, 345][i]}
          y2={52 - (i + 1) * 2}
          stroke={color}
          strokeWidth={1.5}
          strokeDasharray="3,3"
          opacity={0.6}
        />
      ))}
      <circle cx={395} cy={42} r={5} fill="none" stroke="#22c55e" strokeWidth={1.5} strokeDasharray="2,2" />
      <text x={395} y={64} textAnchor="middle" fontSize={11} fill="#166534" fontWeight={600}>
        đáy
      </text>
    </svg>
  );
}
