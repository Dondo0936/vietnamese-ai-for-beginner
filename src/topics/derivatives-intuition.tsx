"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  MinusCircle,
  Mountain,
  Sparkles,
  RotateCcw,
  ArrowRight,
  Ruler,
} from "lucide-react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  SliderGroup,
  StepReveal,
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

export const metadata: TopicMeta = {
  slug: "derivatives-intuition",
  title: "Derivatives — an Intuitive Introduction",
  titleVi: "Đạo hàm — tốc độ thay đổi trông thế nào",
  description:
    "Đạo hàm không phải là con số khó hiểu. Nó là độ dốc của một đường cong tại một điểm — và bạn sẽ nhìn tận mắt nó xuất hiện khi kéo một tiếp tuyến trên SVG.",
  category: "math-foundations",
  tags: ["calculus", "intuition", "fundamentals"],
  difficulty: "beginner",
  relatedSlugs: ["calculus-for-backprop", "gradient-descent"],
  vizType: "interactive",
  tocSections: [
    { id: "visualization", labelVi: "Hình minh họa" },
    { id: "explanation", labelVi: "Giải thích" },
  ],
};

/* ─────────────────────────────────────────────────────────
   ĐỊNH NGHĨA ĐƯỜNG CONG
   Ta dùng f(x) = 0.6 sin(x/40) * 90 + 160 để tạo đồi nhấp nhô
   trên vùng vẽ 0-400, và g(x) = (x-200)^2 / 200 + 20 cho bài
   "xe lên dốc".
   ───────────────────────────────────────────────────────── */

const VIEW_W = 420;
const VIEW_H = 240;

function hillCurve(x: number): number {
  return 160 - Math.sin((x / VIEW_W) * Math.PI * 2) * 60 - (x / VIEW_W) * 20;
}

function hillSlope(x: number): number {
  // đạo hàm giải tích của hillCurve theo x
  const dfdx =
    -Math.cos((x / VIEW_W) * Math.PI * 2) * 60 * ((Math.PI * 2) / VIEW_W) -
    20 / VIEW_W;
  // lưu ý: hệ trục SVG ngược, slope thực = -dfdx để người đọc thấy
  // "đi lên = slope dương" theo trực giác
  return -dfdx;
}

/* Một đường cong thứ hai: f(x) = (x-210)^2/400 + 40 — parabol */

function parabola(x: number): number {
  return 180 - ((x - 210) ** 2) / 400;
}

function parabolaSlope(x: number): number {
  // đạo hàm: -2(x-210)/400, đổi dấu cho hệ trục SVG
  return -(-2 * (x - 210)) / 400;
}

/* ─────────────────────────────────────────────────────────
   COMPONENT: ĐƯỜNG CONG + TIẾP TUYẾN KÉO ĐƯỢC
   ───────────────────────────────────────────────────────── */

function TangentExplorer({
  curve,
  slope,
  xPos,
  onXChange,
  showSecant,
  delta,
}: {
  curve: (x: number) => number;
  slope: (x: number) => number;
  xPos: number;
  onXChange: (x: number) => void;
  showSecant?: boolean;
  delta?: number;
}) {
  const [isDragging, setIsDragging] = useState(false);

  // Tạo polyline cho đường cong
  const curvePath = useMemo(() => {
    const pts: string[] = [];
    for (let x = 0; x <= VIEW_W; x += 3) {
      pts.push(`${x},${curve(x).toFixed(2)}`);
    }
    return pts.join(" ");
  }, [curve]);

  const y = curve(xPos);
  const s = slope(xPos);

  // tiếp tuyến kéo dài 100px mỗi phía
  const tanLen = 90;
  // vector chỉ hướng (1, -s) vì hệ SVG
  const norm = Math.sqrt(1 + s * s);
  const dx = tanLen / norm;
  const dy = (-s * tanLen) / norm;

  // secant nếu có delta
  let secX1 = xPos;
  let secY1 = y;
  let secX2 = Math.min(VIEW_W, xPos + (delta ?? 0));
  let secY2 = curve(secX2);

  const secSlope =
    showSecant && delta && delta > 0 ? -((secY2 - secY1) / (secX2 - secX1)) : null;

  const handleDrag = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (e.buttons !== 1) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * VIEW_W;
      onXChange(Math.max(0, Math.min(VIEW_W, x)));
    },
    [onXChange],
  );

  const handleClick = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      setIsDragging(true);
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * VIEW_W;
      onXChange(Math.max(0, Math.min(VIEW_W, x)));
    },
    [onXChange],
  );

  const stopDrag = useCallback(() => setIsDragging(false), []);

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="w-full max-w-lg mx-auto cursor-crosshair bg-surface/40 rounded-lg border border-border"
      style={{ touchAction: isDragging ? "none" : "auto" }}
      role="img"
      aria-label={`Đường cong, tiếp tuyến tại x=${xPos.toFixed(0)}, slope=${s.toFixed(3)}`}
      onPointerDown={handleClick}
      onPointerUp={stopDrag}
      onPointerLeave={stopDrag}
      onPointerCancel={stopDrag}
      onPointerMove={handleDrag}
    >
      {/* Lưới nền */}
      {[0, 60, 120, 180, 240].map((yLine) => (
        <line
          key={`gy-${yLine}`}
          x1={0}
          y1={yLine}
          x2={VIEW_W}
          y2={yLine}
          stroke="var(--border)"
          strokeWidth={0.5}
          strokeDasharray="2,3"
          opacity={0.35}
        />
      ))}
      {[0, 105, 210, 315, 420].map((xLine) => (
        <line
          key={`gx-${xLine}`}
          x1={xLine}
          y1={0}
          x2={xLine}
          y2={VIEW_H}
          stroke="var(--border)"
          strokeWidth={0.5}
          strokeDasharray="2,3"
          opacity={0.35}
        />
      ))}

      {/* Đường cong */}
      <polyline
        fill="none"
        stroke="#3b82f6"
        strokeWidth={2.5}
        points={curvePath}
      />

      {/* Secant (nếu có delta) */}
      {showSecant && delta && delta > 0 && (
        <g>
          <line
            x1={secX1 - 60}
            y1={secY1 - (secSlope ?? 0) * -60}
            x2={secX2 + 60}
            y2={secY2 - (secSlope ?? 0) * 60}
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="6,4"
          />
          <circle
            cx={secX2}
            cy={secY2}
            r={5}
            fill="#f59e0b"
            stroke="#fff"
            strokeWidth={2}
          />
          <text
            x={secX2 + 8}
            y={secY2 - 8}
            fontSize={11}
            fill="var(--text-primary)"
            fontWeight={500}
          >
            x + Δx
          </text>
        </g>
      )}

      {/* Tiếp tuyến tại xPos */}
      <line
        x1={xPos - dx}
        y1={y - dy}
        x2={xPos + dx}
        y2={y + dy}
        stroke="#ef4444"
        strokeWidth={3}
        strokeLinecap="round"
      />

      {/* Điểm đang xét */}
      <motion.circle
        cx={xPos}
        cy={y}
        r={8}
        fill="#ef4444"
        stroke="#fff"
        strokeWidth={2.5}
        animate={{ cx: xPos, cy: y }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
      />

      {/* Nhãn toạ độ */}
      <text
        x={xPos}
        y={y - 18}
        textAnchor="middle"
        fontSize={11}
        fontWeight={600}
        fill="#ef4444"
      >
        x = {xPos.toFixed(0)}
      </text>

      {/* Mũi tên gợi ý hướng */}
      {Math.abs(s) > 0.02 && (
        <g>
          <defs>
            <marker
                id="tangent-arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
              </marker>
          </defs>
          <line
            x1={xPos}
            y1={y}
            x2={xPos + Math.sign(s) * 40}
            y2={y - Math.abs(s) * 40 * Math.sign(s)}
            stroke="#ef4444"
            strokeWidth={1.5}
            opacity={0.5}
            markerEnd="url(#tangent-arrow)"
          />
        </g>
      )}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
   PANEL CHỈ SỐ (độ dốc, dấu, hướng)
   ───────────────────────────────────────────────────────── */

function SlopePanel({ slope }: { slope: number }) {
  const abs = Math.abs(slope);
  let sign: "up" | "down" | "flat" = "flat";
  if (slope > 0.03) sign = "up";
  else if (slope < -0.03) sign = "down";

  const Icon =
    sign === "up" ? TrendingUp : sign === "down" ? TrendingDown : MinusCircle;
  const color =
    sign === "up" ? "#10b981" : sign === "down" ? "#ef4444" : "#6b7280";
  const label =
    sign === "up"
      ? "Đang đi lên"
      : sign === "down"
        ? "Đang đi xuống"
        : "Gần như bằng phẳng";
  const magnitude =
    abs < 0.1
      ? "Thoai thoải"
      : abs < 0.3
        ? "Dốc vừa"
        : abs < 0.6
          ? "Dốc đứng"
          : "Cực dốc";

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: color + "22", color }}
          >
            <Icon size={20} />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">
              {label}
            </div>
            <div className="text-xs text-muted">{magnitude}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wide text-tertiary">
            Độ dốc
          </div>
          <div
            className="font-mono text-lg font-bold tabular-nums"
            style={{ color }}
          >
            {slope >= 0 ? "+" : ""}
            {slope.toFixed(3)}
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-surface/60 border border-border p-3">
        <div className="text-[10px] uppercase tracking-wide text-tertiary mb-1">
          Ý nghĩa
        </div>
        <p className="text-xs text-muted leading-relaxed">
          Đạo hàm tại điểm này bằng <strong>{slope.toFixed(3)}</strong>. Nghĩa
          là nếu bạn đi về bên phải 1 đơn vị, chiều cao thay đổi khoảng{" "}
          {slope.toFixed(3)} đơn vị theo chiều{" "}
          {slope > 0 ? "lên" : slope < 0 ? "xuống" : "ngang"}.
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   QUIZ (≥3 câu hỏi)
   ───────────────────────────────────────────────────────── */

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Một quả bóng ném lên cao rồi rơi xuống. Độ cao của bóng theo thời gian là một đường cong hình chuông úp ngược. Đạo hàm tại đỉnh của đường cong đó bằng bao nhiêu?",
    options: [
      "Âm — vì bóng đang rơi xuống.",
      "Dương — vì bóng đang đi lên.",
      "Bằng 0 — tại đỉnh, bóng không đi lên cũng không đi xuống.",
      "Không xác định — tại đỉnh đạo hàm không tồn tại.",
    ],
    correct: 2,
    explanation:
      "Tại đỉnh của đường cong, tiếp tuyến nằm ngang — độ dốc bằng 0. Đây là đặc trưng của cực trị (maximum hoặc minimum): đạo hàm luôn bằng 0. Thuật toán gradient descent tìm tối ưu chính bằng cách đi về phía đạo hàm = 0.",
  },
  {
    question:
      "Bạn thấy một đoạn đường cong rất dốc đi xuống. Đạo hàm tại đó có đặc điểm gì?",
    options: [
      "Số dương lớn.",
      "Số âm lớn (trị tuyệt đối lớn, dấu trừ).",
      "Bằng 0.",
      "Số dương rất nhỏ.",
    ],
    correct: 1,
    explanation:
      "Dốc đứng = trị tuyệt đối lớn. Đi xuống = dấu âm. Vì vậy đạo hàm là âm lớn, ví dụ −2.5. Biết đọc dấu và độ lớn của đạo hàm là nền tảng để hiểu học máy — nhất là gradient descent, nơi dấu quyết định đi theo hướng nào.",
  },
  {
    question:
      "Trong định nghĩa đạo hàm bằng giới hạn, đại lượng Δx đóng vai trò gì?",
    options: [
      "Là sai số ngẫu nhiên.",
      "Là đoạn nhỏ theo trục x — khi Δx tiến về 0, cát tuyến biến thành tiếp tuyến.",
      "Là đạo hàm bậc hai.",
      "Là giá trị của hàm số tại điểm đang xét.",
    ],
    correct: 1,
    explanation:
      "Δx là bước nhảy nhỏ. Khi bạn co Δx về 0, đường cát tuyến (đi qua hai điểm cách nhau Δx) dần dần trùng với tiếp tuyến (chỉ chạm đúng 1 điểm). Đó chính là ý nghĩa giới hạn: lim (Δx → 0) [ f(x+Δx) − f(x) ] / Δx.",
  },
  {
    question:
      "Đạo hàm của một hàm hằng f(x) = 5 (đường thẳng ngang) bằng bao nhiêu tại mọi điểm?",
    options: [
      "5 — bằng chính giá trị hàm.",
      "0 — vì đường thẳng ngang không đổi, độ dốc bằng 0.",
      "1 — vì đạo hàm của số luôn là 1.",
      "Không xác định.",
    ],
    correct: 1,
    explanation:
      "Đường thẳng ngang không đi lên cũng không đi xuống — độ dốc bằng 0 ở mọi nơi. Đây là trường hợp đơn giản nhất của đạo hàm, và là viên gạch cơ bản để bạn xây dựng trực giác trước khi gặp các hàm phức tạp hơn.",
  },
  {
    question:
      "Tại sao người ta hay dùng đạo hàm trong học máy?",
    options: [
      "Vì đạo hàm làm cho công thức ngắn hơn.",
      "Vì đạo hàm cho biết hướng và mức độ thay đổi của loss — từ đó biết điều chỉnh tham số theo chiều nào để giảm loss.",
      "Vì đạo hàm bắt buộc phải có trong mọi bài toán toán học.",
      "Vì đạo hàm giúp máy tính chạy nhanh hơn.",
    ],
    correct: 1,
    explanation:
      "Huấn luyện mạng nơ-ron là quá trình đi tìm giá trị tham số sao cho loss nhỏ nhất. Đạo hàm của loss theo tham số cho biết: nếu tăng tham số này thêm một chút, loss sẽ tăng hay giảm. Dựa vào đó, gradient descent cập nhật tham số theo hướng ngược đạo hàm — và loss giảm dần.",
  },
];

/* ═════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═════════════════════════════════════════════════════════ */

export default function DerivativesIntuitionTopic() {
  /* Thử nghiệm 1: kéo tiếp tuyến trên đồi */
  const [hillX, setHillX] = useState(VIEW_W / 2);
  const curSlope = useMemo(() => hillSlope(hillX), [hillX]);

  /* Thử nghiệm 2: kéo tiếp tuyến trên parabol */
  const [paraX, setParaX] = useState(120);
  const paraCurSlope = useMemo(() => parabolaSlope(paraX), [paraX]);

  /* Thử nghiệm 3 (DEEPEN): secant → tangent khi Δx co lại */
  const [delta, setDelta] = useState(80);
  const [secX, setSecX] = useState(200);
  const secSlope = useMemo(() => {
    const y1 = hillCurve(secX);
    const y2 = hillCurve(secX + delta);
    return -((y2 - y1) / delta);
  }, [secX, delta]);
  const tangentTruth = useMemo(() => hillSlope(secX), [secX]);
  const absError = Math.abs(secSlope - tangentTruth);

  /* CHALLENGE: chọn điểm slope = 0 */
  const [challengeX, setChallengeX] = useState<number | null>(null);
  // đường cong parabol, đỉnh tại x = 210
  const challengeTargetX = 210;
  const challengeCorrect =
    challengeX !== null && Math.abs(challengeX - challengeTargetX) < 20;

  /* Tự động giảm delta về 1 khi bấm "Co Δx về 0" */
  const [shrinking, setShrinking] = useState(false);
  useEffect(() => {
    if (!shrinking) return;
    if (delta <= 2) {
      setShrinking(false);
      return;
    }
    const t = setTimeout(() => {
      setDelta((d) => Math.max(1, d - 4));
    }, 40);
    return () => clearTimeout(t);
  }, [shrinking, delta]);

  return (
    <>
      {/* ══════ HOOK ══════ */}
      <LessonSection step={1} totalSteps={8} label="Thử đoán">
        <PredictionGate
          question="Một chiếc xe đang lên dốc. Đoạn giữa dốc, bạn thấy xe đang tăng tốc chậm. Đại lượng nào mô tả 'tốc độ tăng' đó?"
          options={[
            "Quãng đường đã đi.",
            "Tổng thời gian từ lúc xuất phát.",
            "Đạo hàm của độ cao theo thời gian — tức độ dốc của đường cong vị trí.",
            "Không có đại lượng nào — đó chỉ là cảm giác chủ quan.",
          ]}
          correct={2}
          explanation="Đạo hàm chính là 'tốc độ thay đổi'. Khi đường cong đi lên nhanh — đạo hàm lớn dương. Lên chậm — đạo hàm dương nhỏ. Đi xuống — đạo hàm âm. Phẳng — đạo hàm bằng 0. Bài này cho bạn nhìn tận mắt con số đó."
        >
          <p className="text-sm text-muted mt-4 leading-relaxed">
            <strong>Khi xe đang lên dốc, tốc độ tăng chậm hay nhanh?</strong>{" "}
            Đạo hàm đo chính cái đó. Không phải là số bí ẩn — chỉ là độ dốc của
            tiếp tuyến.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ══════ HIỂU BẰNG HÌNH ẢNH ══════ */}
      <LessonSection step={2} totalSteps={8} label="Hiểu bằng hình ảnh">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Mountain size={20} className="text-accent" /> Đạo hàm = độ dốc tại
            một điểm
          </h3>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Hãy tưởng tượng bạn đang đi bộ trên một con đường có dốc lên, dốc
            xuống và đoạn bằng. Ở mỗi bước chân, bạn có thể hỏi: <em>ngay tại
            đây</em>, mặt đất đang nghiêng thế nào?
          </p>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Câu trả lời đó chính là <strong>đạo hàm</strong>. Nó chỉ là một con
            số — có thể dương (đang lên), âm (đang xuống), hoặc gần 0 (phẳng).
            Trị tuyệt đối của con số cho biết <em>dốc đến mức nào</em>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-4 space-y-1">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <TrendingUp size={16} />
                <span className="text-sm font-semibold">Đạo hàm dương</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Đường cong đang đi lên. Bước tới bên phải — chiều cao tăng.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900/20 dark:border-slate-800 p-4 space-y-1">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <MinusCircle size={16} />
                <span className="text-sm font-semibold">Đạo hàm = 0</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Đường cong đang nằm ngang. Đỉnh núi, đáy thung lũng, hoặc đoạn
                phẳng đều có đạo hàm = 0.
              </p>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-800 p-4 space-y-1">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
                <TrendingDown size={16} />
                <span className="text-sm font-semibold">Đạo hàm âm</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Đường cong đang đi xuống. Bước tới bên phải — chiều cao giảm.
              </p>
            </div>
          </div>
        </div>
      </LessonSection>

      {/* ══════ KHÁM PHÁ / VISUALIZATION ══════ */}
      <LessonSection step={3} totalSteps={8} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          {/* ── Thử nghiệm 1: Đồi với tiếp tuyến kéo được ── */}
          <LessonSection label="Thử nghiệm 1: Kéo tiếp tuyến trên đồi" step={1}>
            <p className="text-sm text-muted mb-4 leading-relaxed">
              Đường cong xanh là con đường bạn đang đi bộ. Đoạn thẳng đỏ là{" "}
              <strong>tiếp tuyến</strong> — chỉ chạm đường cong tại đúng một
              điểm. Kéo thanh dưới (hoặc bấm vào SVG) để di chuyển điểm đỏ. Bảng
              bên phải hiển thị độ dốc ở vị trí hiện tại.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <TangentExplorer
                curve={hillCurve}
                slope={hillSlope}
                xPos={hillX}
                onXChange={setHillX}
              />
              <SlopePanel slope={curSlope} />
            </div>

            <div className="mt-4 rounded-xl border border-border bg-surface/40 p-4">
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="hill-x"
                  className="text-sm font-medium text-foreground flex items-center gap-2"
                >
                  <Ruler size={14} className="text-accent" />
                  Vị trí x trên đường
                </label>
                <span className="font-mono text-sm font-bold text-accent tabular-nums">
                  {hillX.toFixed(0)}
                </span>
              </div>
              <input
                id="hill-x"
                type="range"
                min={10}
                max={VIEW_W - 10}
                step={1}
                value={hillX}
                onChange={(e) => setHillX(parseFloat(e.target.value))}
                className="w-full accent-accent"
              />
              <p className="text-xs text-muted mt-2 leading-relaxed">
                Thử kéo tới đỉnh đồi (khoảng x = 105) — tiếp tuyến gần như nằm
                ngang, slope ≈ 0. Thử kéo đoạn dốc xuống phía phải — tiếp tuyến
                nghiêng xuống, slope âm.
              </p>
            </div>
          </LessonSection>

          {/* ── Thử nghiệm 2: SliderGroup với parabol ── */}
          <LessonSection
            label="Thử nghiệm 2: Parabol có một đỉnh rõ ràng"
            step={2}
          >
            <p className="text-sm text-muted mb-4 leading-relaxed">
              Parabol giống như một cái bát úp ngược: đi lên, qua đỉnh, rồi đi
              xuống. Đỉnh chính là điểm đạo hàm = 0. Kéo thanh dưới để tìm đỉnh.
            </p>

            <SliderGroup
              title="Tìm đỉnh parabol — nơi slope = 0"
              sliders={[
                {
                  key: "x",
                  label: "Vị trí x",
                  min: 20,
                  max: VIEW_W - 20,
                  step: 1,
                  defaultValue: 120,
                  unit: "",
                },
              ]}
              visualization={(vals) => {
                const x = vals.x;
                const s = parabolaSlope(x);
                return (
                  <div className="w-full space-y-2">
                    <TangentExplorer
                      curve={parabola}
                      slope={parabolaSlope}
                      xPos={x}
                      onXChange={setParaX}
                    />
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg border border-border bg-card p-2">
                        <div className="text-[10px] text-tertiary uppercase">
                          x
                        </div>
                        <div className="font-mono text-sm font-bold">
                          {x.toFixed(0)}
                        </div>
                      </div>
                      <div className="rounded-lg border border-border bg-card p-2">
                        <div className="text-[10px] text-tertiary uppercase">
                          Slope
                        </div>
                        <div
                          className="font-mono text-sm font-bold"
                          style={{
                            color:
                              s > 0.02
                                ? "#10b981"
                                : s < -0.02
                                  ? "#ef4444"
                                  : "#6b7280",
                          }}
                        >
                          {s >= 0 ? "+" : ""}
                          {s.toFixed(3)}
                        </div>
                      </div>
                      <div className="rounded-lg border border-border bg-card p-2">
                        <div className="text-[10px] text-tertiary uppercase">
                          Cách đỉnh
                        </div>
                        <div className="font-mono text-sm font-bold">
                          {Math.abs(x - 210).toFixed(0)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }}
            />

            <p className="text-xs text-muted mt-3 italic text-center">
              Parabol ở đây có đỉnh tại x = 210. Khi bạn kéo sát đỉnh, slope
              của tiếp tuyến tiến về 0 — đó là đặc điểm nhận biết cực trị.
              (Giá trị hiển thị trên panel bên dưới dùng cho vị trí bạn vừa
              chạm cuối cùng.)
            </p>
            <div className="mt-3">
              <SlopePanel slope={paraCurSlope} />
            </div>
          </LessonSection>
        </VisualizationSection>
      </LessonSection>

      {/* ══════ DEEPEN — StepReveal: secant → tangent ══════ */}
      <LessonSection step={4} totalSteps={8} label="Đào sâu: Từ cát tuyến sang tiếp tuyến">
        <p className="text-sm text-muted mb-4 leading-relaxed">
          Tiếp tuyến nghe có vẻ huyền bí. Thực ra nó là <em>giới hạn</em> của
          một thứ rất bình thường: đường thẳng nối hai điểm trên đường cong —
          gọi là <strong>cát tuyến</strong>. Khi hai điểm đó tiến sát nhau
          (Δx → 0), cát tuyến trở thành tiếp tuyến.
        </p>

        <StepReveal
          labels={[
            "Bước 1: Bắt đầu bằng cát tuyến",
            "Bước 2: Co Δx nhỏ lại",
            "Bước 3: Δx → 0, tiếp tuyến hiện ra",
          ]}
        >
          {[
            <div
              key="ds1"
              className="rounded-lg border border-border bg-card p-4 space-y-3"
            >
              <p className="text-sm text-foreground leading-relaxed">
                <strong>Cát tuyến</strong> là đường thẳng nối hai điểm trên
                đường cong. Độ dốc của nó = (chiều cao cuối − chiều cao đầu) ÷
                (khoảng cách ngang giữa hai điểm) = Δy / Δx.
              </p>
              <TangentExplorer
                curve={hillCurve}
                slope={hillSlope}
                xPos={secX}
                onXChange={setSecX}
                showSecant
                delta={delta}
              />
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-border bg-surface p-2">
                  <div className="text-[10px] text-tertiary uppercase">
                    Δx
                  </div>
                  <div className="font-mono text-sm font-bold text-amber-500">
                    {delta.toFixed(0)}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-surface p-2">
                  <div className="text-[10px] text-tertiary uppercase">
                    Slope cát tuyến
                  </div>
                  <div className="font-mono text-sm font-bold text-amber-500">
                    {secSlope.toFixed(3)}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-surface p-2">
                  <div className="text-[10px] text-tertiary uppercase">
                    Slope tiếp tuyến thật
                  </div>
                  <div className="font-mono text-sm font-bold text-rose-500">
                    {tangentTruth.toFixed(3)}
                  </div>
                </div>
              </div>
            </div>,
            <div
              key="ds2"
              className="rounded-lg border border-border bg-card p-4 space-y-3"
            >
              <p className="text-sm text-foreground leading-relaxed">
                Hãy <strong>co Δx nhỏ lại</strong>. Kéo thanh dưới để thu hẹp
                khoảng cách giữa hai điểm. Quan sát cát tuyến càng lúc càng
                trùng khít với tiếp tuyến.
              </p>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="delta-slider"
                    className="text-sm font-medium text-foreground"
                  >
                    Δx
                  </label>
                  <span className="font-mono text-sm font-bold text-accent tabular-nums">
                    {delta.toFixed(0)}
                  </span>
                </div>
                <input
                  id="delta-slider"
                  type="range"
                  min={1}
                  max={120}
                  step={1}
                  value={delta}
                  onChange={(e) => setDelta(parseFloat(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>
              <div className="rounded-lg bg-surface/60 border border-border p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Sai số giữa cát tuyến và tiếp tuyến</span>
                  <span
                    className="font-mono font-bold tabular-nums"
                    style={{
                      color:
                        absError < 0.01
                          ? "#10b981"
                          : absError < 0.05
                            ? "#f59e0b"
                            : "#ef4444",
                    }}
                  >
                    {absError.toFixed(4)}
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-surface-hover overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      backgroundColor:
                        absError < 0.01
                          ? "#10b981"
                          : absError < 0.05
                            ? "#f59e0b"
                            : "#ef4444",
                    }}
                    initial={false}
                    animate={{
                      width: `${Math.min(100, absError * 200)}%`,
                    }}
                    transition={{ duration: 0.25 }}
                  />
                </div>
              </div>
            </div>,
            <div
              key="ds3"
              className="rounded-lg border-2 border-accent bg-accent-light p-4 space-y-3"
            >
              <p className="text-sm text-foreground leading-relaxed">
                Bấm nút dưới để xem Δx tự động co về 0. Cát tuyến vàng trượt
                dần đến khi trùng khít với tiếp tuyến đỏ. <strong>Đây là
                đạo hàm</strong> — giới hạn của độ dốc cát tuyến khi Δx → 0.
              </p>
              <button
                type="button"
                onClick={() => {
                  setDelta(80);
                  setTimeout(() => setShrinking(true), 50);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark transition-colors"
              >
                <ArrowRight size={14} /> Co Δx về 0
              </button>
              <AnimatePresence>
                {absError < 0.01 && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300"
                  >
                    <Sparkles size={12} />
                    Sai số rất nhỏ — cát tuyến đã gần như trùng với tiếp
                    tuyến.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>,
          ]}
        </StepReveal>
      </LessonSection>

      {/* ══════ AHA ══════ */}
      <LessonSection step={5} totalSteps={8} label="Khoảnh khắc hiểu">
        <AhaMoment>
          Đạo hàm không phải công thức bí hiểm. Nó là <strong>độ dốc của
          tiếp tuyến</strong> tại một điểm — và tiếp tuyến chỉ là cát tuyến
          khi hai điểm sát lại nhau.
          <br />
          <br />
          Toàn bộ học máy sâu — gradient descent, backpropagation, optimizer —
          đều dựa vào ý tưởng đơn giản này: <em>biết độ dốc, biết đi theo
          hướng nào để giảm loss</em>.
        </AhaMoment>
      </LessonSection>

      {/* ══════ CHALLENGE ══════ */}
      <LessonSection step={6} totalSteps={8} label="Thử thách">
        <p className="text-sm text-muted leading-relaxed mb-4">
          Dưới đây là một parabol. <strong>Bấm vào điểm trên đường cong mà
          bạn cho rằng slope = 0</strong> (tiếp tuyến nằm ngang). Hệ thống sẽ
          cho bạn biết có đúng không.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
          <TangentExplorer
            curve={parabola}
            slope={parabolaSlope}
            xPos={challengeX ?? 120}
            onXChange={setChallengeX}
          />
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-tertiary mb-2">
                Vị trí bạn chọn
              </div>
              {challengeX === null ? (
                <p className="text-sm text-muted italic">
                  Chưa chọn. Bấm vào đường cong để đặt điểm.
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">x</span>
                    <span className="font-mono font-bold">
                      {challengeX.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Slope thật tại đây</span>
                    <span
                      className="font-mono font-bold"
                      style={{
                        color: Math.abs(parabolaSlope(challengeX)) < 0.02
                          ? "#10b981"
                          : "#ef4444",
                      }}
                    >
                      {parabolaSlope(challengeX).toFixed(3)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {challengeX !== null && (
              <Callout
                variant={challengeCorrect ? "tip" : "warning"}
                title={challengeCorrect ? "Chính xác!" : "Hơi lệch"}
              >
                {challengeCorrect
                  ? "Đỉnh parabol nằm tại x ≈ 210, nơi slope = 0. Bạn đã phát hiện đúng đặc điểm của cực trị."
                  : `Đỉnh parabol nằm tại x = 210 (nơi slope = 0). Bạn chọn x = ${challengeX.toFixed(0)}, còn cách đỉnh khoảng ${Math.abs(challengeX - 210).toFixed(0)} đơn vị.`}
              </Callout>
            )}

            {challengeX !== null && (
              <button
                type="button"
                onClick={() => setChallengeX(null)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-muted hover:text-foreground transition-colors"
              >
                <RotateCcw size={12} /> Thử lại
              </button>
            )}
          </div>
        </div>

        <div className="mt-5">
          <InlineChallenge
            question="Một đường cong có slope = +2 tại x = 5, và slope = −3 tại x = 10. Giữa hai điểm đó, chắc chắn có ít nhất một chỗ slope = ?"
            options={[
              "0 — slope phải đi qua 0 khi đổi từ dương sang âm.",
              "+1 — trung bình cộng.",
              "−1 — điểm nghiệm.",
              "Không thể kết luận gì — cần thêm thông tin.",
            ]}
            correct={0}
            explanation="Đây là trực giác của định lý giá trị trung gian: nếu slope đổi dấu từ +2 xuống −3 mà đường cong liên tục, chắc chắn có một chỗ slope bằng 0 ở giữa. Đó là một điểm cực trị (max hoặc min) nằm giữa hai điểm đã biết. Kiến thức này là xương sống của thuật toán tìm nghiệm trong học máy."
          />
        </div>
      </LessonSection>

      {/* ══════ EXPLAIN ══════ */}
      <LessonSection step={7} totalSteps={8} label="Giải thích">
        <ExplanationSection topicSlug={metadata.slug}>
          <p className="leading-relaxed">
            Bạn đã cảm nhận được đạo hàm bằng mắt. Giờ là lúc đặt cho nó một
            cái tên chính thức và công thức gọn — để lần sau nhìn thấy trong
            sách giáo khoa không bị bất ngờ.
          </p>

          <h4 className="text-sm font-semibold text-foreground mt-6 mb-2">
            Công thức định nghĩa đạo hàm
          </h4>

          <LaTeX block>
            {String.raw`f'(x) = \lim_{\Delta x \to 0} \frac{f(x + \Delta x) - f(x)}{\Delta x}`}
          </LaTeX>

          <p className="text-sm leading-relaxed">
            <strong>Bằng tiếng Việt thông thường:</strong> đạo hàm của hàm số
            f tại điểm x là giới hạn của &ldquo;độ dốc cát tuyến&rdquo; khi hai
            điểm tiến sát nhau. Độ dốc cát tuyến = (chiều cao cuối − chiều cao
            đầu) ÷ (khoảng cách ngang).
          </p>

          <p className="text-sm leading-relaxed">
            <strong>Đạo hàm = tốc độ thay đổi tức thời. Không phải là số bí
            ẩn — nó chỉ là độ dốc của tiếp tuyến.</strong>
          </p>

          <Callout variant="info" title="Ký hiệu f'(x) và dy/dx">
            Bạn sẽ gặp cả hai cách viết: <LaTeX>{String.raw`f'(x)`}</LaTeX>{" "}
            (Lagrange) và <LaTeX>{String.raw`\dfrac{dy}{dx}`}</LaTeX>{" "}
            (Leibniz). Cùng một ý nghĩa: &ldquo;y thay đổi bao nhiêu khi x
            thay đổi một chút&rdquo;. Trong học máy, bạn thường gặp ký hiệu
            Leibniz nhiều hơn vì nó làm rõ &ldquo;theo biến nào&rdquo;.
          </Callout>

          <h4 className="text-sm font-semibold text-foreground mt-6 mb-2">
            Hình ảnh ba đạo hàm cơ bản (không cần nhớ công thức)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3">
            <div className="rounded-xl border border-border bg-card p-4 space-y-1">
              <div className="text-sm font-semibold text-foreground">
                f(x) = x²
              </div>
              <p className="text-xs text-muted leading-snug">
                Parabol. Đạo hàm = 2x. Tại gốc (x = 0), slope = 0. Đi xa gốc,
                slope tăng theo x.
              </p>
              <svg viewBox="0 0 100 60" className="w-full">
                <path
                  d="M 0 55 Q 50 -5 100 55"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
              </svg>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 space-y-1">
              <div className="text-sm font-semibold text-foreground">
                f(x) = x
              </div>
              <p className="text-xs text-muted leading-snug">
                Đường thẳng chéo. Đạo hàm = 1 ở mọi nơi — vì slope của đường
                thẳng luôn bằng nhau.
              </p>
              <svg viewBox="0 0 100 60" className="w-full">
                <line
                  x1={0}
                  y1={55}
                  x2={100}
                  y2={5}
                  stroke="#10b981"
                  strokeWidth={2}
                />
              </svg>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 space-y-1">
              <div className="text-sm font-semibold text-foreground">
                f(x) = 5
              </div>
              <p className="text-xs text-muted leading-snug">
                Đường thẳng ngang. Đạo hàm = 0. Hàm hằng không thay đổi, nên
                độ dốc luôn 0.
              </p>
              <svg viewBox="0 0 100 60" className="w-full">
                <line
                  x1={0}
                  y1={30}
                  x2={100}
                  y2={30}
                  stroke="#f59e0b"
                  strokeWidth={2}
                />
              </svg>
            </div>
          </div>

          <Callout variant="tip" title="Đạo hàm dẫn đến mọi thứ trong deep learning">
            Khi bạn huấn luyện một mạng nơ-ron, máy cần biết &ldquo;tăng trọng
            số này một chút thì loss tăng hay giảm?&rdquo;. Đó là đạo hàm của
            loss theo trọng số. Biết đạo hàm → biết đi theo hướng nào để loss
            nhỏ đi. Đó là toàn bộ triết lý của{" "}
            <TopicLink slug="gradient-descent">gradient descent</TopicLink>.
          </Callout>

          <p className="text-sm leading-relaxed mt-4">
            Muốn đi sâu hơn (nhiều biến, chain rule, backprop), xem bài{" "}
            <TopicLink slug="calculus-for-backprop">
              Vi tích phân cho backpropagation
            </TopicLink>
            . Ở đó bạn sẽ thấy đạo hàm &ldquo;riêng&rdquo; (partial
            derivative) và cách chúng chồng nhau theo chain rule — nền tảng của
            mọi khung deep learning như PyTorch và TensorFlow.
          </p>

          <CollapsibleDetail title="Đạo hàm và &quot;tốc độ&quot; trong vật lý">
            <p className="text-sm leading-relaxed">
              Nếu f(t) là vị trí của một vật theo thời gian t, thì f&apos;(t) là{" "}
              <strong>vận tốc</strong> của nó. Vận tốc = tốc độ thay đổi của vị
              trí theo thời gian. Và đạo hàm của vận tốc, tức f&apos;&apos;(t),
              chính là <strong>gia tốc</strong>. Bạn vừa học calculus ở trường
              đời rồi mà không biết.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Vì sao người ta nói đạo hàm là &quot;giới hạn&quot;?">
            <p className="text-sm leading-relaxed">
              Vì ta không thể tính &ldquo;slope tại đúng một điểm&rdquo; trực
              tiếp — slope cần hai điểm. Mẹo của người xưa: lấy cát tuyến
              (hai điểm), rồi <em>co hai điểm lại</em> cho đến khi cách nhau một
              khoảng nhỏ xíu. Khái niệm giới hạn là công cụ toán học để nói
              &ldquo;khoảng cách nhỏ xíu&rdquo; một cách chặt chẽ. Newton và
              Leibniz phát minh ra ý tưởng này độc lập ở thế kỷ 17 — và nhờ nó
              mà chúng ta có cả calculus lẫn deep learning.
            </p>
          </CollapsibleDetail>
        </ExplanationSection>
      </LessonSection>

      {/* ══════ CONNECT — Mini summary + tip ══════ */}
      <LessonSection step={8} totalSteps={8} label="Tóm tắt & kết nối">
        <MiniSummary
          title="5 điều cần giữ lại"
          points={[
            "Đạo hàm = độ dốc của tiếp tuyến tại một điểm. Số dương = đi lên, số âm = đi xuống, 0 = nằm ngang.",
            "Trị tuyệt đối của đạo hàm cho biết dốc đến mức nào. 0.1 là thoai thoải, 1.0 là dốc đứng.",
            "Tiếp tuyến là giới hạn của cát tuyến khi Δx → 0. Đó là định nghĩa chính thức của đạo hàm.",
            "Cực trị (đỉnh/đáy của đường cong) luôn có đạo hàm = 0. Thuật toán tối ưu tìm nghiệm bằng cách đi về chỗ đạo hàm = 0.",
            "Trong học máy, đạo hàm của loss theo tham số cho biết đi theo hướng nào để giảm loss. Toàn bộ huấn luyện dựa trên ý tưởng này.",
          ]}
        />

        <div className="mt-5">
          <Callout variant="tip" title="Bước tiếp theo">
            Bạn đã nắm trực giác đạo hàm. Tiếp theo học cách áp dụng nó với
            nhiều biến và chain rule trong{" "}
            <TopicLink slug="calculus-for-backprop">
              Vi tích phân cho backpropagation
            </TopicLink>
            . Hoặc xem trực tiếp đạo hàm được dùng để huấn luyện mô hình ở{" "}
            <TopicLink slug="gradient-descent">Gradient Descent</TopicLink>.
          </Callout>
        </div>

        {/* ══════ QUIZ ══════ */}
        <div className="mt-8">
          <QuizSection questions={quizQuestions} />
        </div>
      </LessonSection>
    </>
  );
}
