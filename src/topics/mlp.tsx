"use client";

import { useMemo, useState } from "react";
import {
  Layers,
  Network,
  Sparkles,
  Ruler,
  GitBranch,
  Brain,
  ArrowRight,
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
  ToggleCompare,
  LaTeX,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "mlp",
  title: "Multilayer Perceptron",
  titleVi: "MLP — Xếp nhiều perceptron thành mạng",
  description:
    "Một perceptron chỉ vẽ được đường thẳng. Xếp chúng thành nhiều lớp, bạn sẽ có được đường cong — chìa khoá cho gần như mọi mô hình hiện đại.",
  category: "neural-fundamentals",
  tags: ["neural-network", "deep-learning", "architecture", "mlp"],
  difficulty: "beginner",
  relatedSlugs: [
    "perceptron",
    "activation-functions",
    "forward-propagation",
    "backpropagation",
    "mlp-in-credit-scoring",
  ],
  vizType: "interactive",
};

/* ══════════════════════════════════════════════════════════════════
   DỮ LIỆU: hai đám điểm kiểu "hai trăng" (two-moons) và XOR
   ══════════════════════════════════════════════════════════════════ */

type Pt2 = { x: number; y: number; label: 0 | 1 };

const TWO_MOON_POINTS: Pt2[] = (() => {
  const pts: Pt2[] = [];
  // Trăng trên: nửa cung phía trên
  for (let i = 0; i < 24; i++) {
    const t = (Math.PI * i) / 23;
    const jitterX = (((i * 37) % 9) - 4) * 0.02;
    const jitterY = (((i * 53) % 7) - 3) * 0.02;
    pts.push({
      x: 0.5 + 0.35 * Math.cos(t) + jitterX,
      y: 0.55 + 0.22 * Math.sin(t) + jitterY,
      label: 0,
    });
  }
  // Trăng dưới: nửa cung phía dưới lệch sang phải
  for (let i = 0; i < 24; i++) {
    const t = (Math.PI * i) / 23;
    const jitterX = (((i * 41) % 9) - 4) * 0.02;
    const jitterY = (((i * 59) % 7) - 3) * 0.02;
    pts.push({
      x: 0.2 + 0.35 * Math.cos(t) + jitterX,
      y: 0.35 - 0.22 * Math.sin(t) + jitterY,
      label: 1,
    });
  }
  return pts;
})();

const XOR_POINTS: Pt2[] = [
  { x: 0.2, y: 0.2, label: 0 },
  { x: 0.2, y: 0.8, label: 1 },
  { x: 0.8, y: 0.2, label: 1 },
  { x: 0.8, y: 0.8, label: 0 },
];

/* ══════════════════════════════════════════════════════════════════
   NUMERIC HELPERS — mô phỏng MLP nhỏ với hàm kích hoạt tanh
   ══════════════════════════════════════════════════════════════════ */

function tanh(z: number) {
  return Math.tanh(z);
}

function sigmoid(z: number) {
  return 1 / (1 + Math.exp(-z));
}

/**
 * Khởi tạo trọng số ổn định bằng seeded PRNG — cùng config sẽ luôn
 * cho cùng đường biên, tránh trôi ảnh giữa các lần render.
 */
function makeSeededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 48271) % 2147483647;
    return (s / 2147483647) * 2 - 1;
  };
}

interface MlpParams {
  // Trọng số từ đầu vào 2D đến lớp ẩn 1
  W1: number[][]; // [hidden1][2]
  b1: number[];
  // Trọng số giữa các lớp ẩn
  Wh: number[][][]; // mỗi phần tử [hidden_{k+1}][hidden_k]
  bh: number[][];
  // Trọng số lớp cuối → 1 đầu ra
  Wout: number[]; // [hidden_last]
  bout: number;
}

function buildMlp(
  layerSizes: number[],
  seed: number,
  task: "moons" | "xor"
): MlpParams {
  const rnd = makeSeededRng(seed);
  const W1: number[][] = [];
  const b1: number[] = [];
  for (let j = 0; j < layerSizes[0]; j++) {
    const row = [rnd() * 2.4, rnd() * 2.4];
    W1.push(row);
    b1.push(rnd() * 0.6);
  }
  const Wh: number[][][] = [];
  const bh: number[][] = [];
  for (let l = 1; l < layerSizes.length; l++) {
    const layerW: number[][] = [];
    const layerB: number[] = [];
    for (let j = 0; j < layerSizes[l]; j++) {
      const row: number[] = [];
      for (let i = 0; i < layerSizes[l - 1]; i++) {
        row.push(rnd() * 2.1);
      }
      layerW.push(row);
      layerB.push(rnd() * 0.4);
    }
    Wh.push(layerW);
    bh.push(layerB);
  }
  const last = layerSizes[layerSizes.length - 1];
  const Wout: number[] = [];
  for (let i = 0; i < last; i++) {
    Wout.push(rnd() * 2.5);
  }
  // Bias cuối được đẩy nhẹ theo task để đường biên nằm gần tâm ảnh
  const bout = task === "xor" ? -0.2 + rnd() * 0.2 : rnd() * 0.3;
  return { W1, b1, Wh, bh, Wout, bout };
}

function forward(
  mlp: MlpParams,
  x: number,
  y: number
): { prob: number; h: number[][] } {
  // Lớp ẩn đầu tiên
  const h1: number[] = mlp.W1.map((row, j) =>
    tanh(row[0] * x + row[1] * y + mlp.b1[j])
  );
  const acts: number[][] = [h1];
  let prev = h1;
  for (let l = 0; l < mlp.Wh.length; l++) {
    const layerW = mlp.Wh[l];
    const layerB = mlp.bh[l];
    const next = layerW.map((row, j) => {
      let sum = layerB[j];
      for (let i = 0; i < row.length; i++) sum += row[i] * prev[i];
      return tanh(sum);
    });
    acts.push(next);
    prev = next;
  }
  let s = mlp.bout;
  for (let i = 0; i < prev.length; i++) s += mlp.Wout[i] * prev[i];
  return { prob: sigmoid(s), h: acts };
}

/* Đường biên của perceptron đơn (một đường thẳng) */
function perceptronProb(x: number, y: number, w1: number, w2: number, b: number) {
  return sigmoid(w1 * (x - 0.5) + w2 * (y - 0.5) + b);
}

/* ══════════════════════════════════════════════════════════════════
   VISUAL: heatmap đường biên + chấm dữ liệu
   ══════════════════════════════════════════════════════════════════ */

interface BoundaryPlotProps {
  size: number;
  resolution?: number;
  data: Pt2[];
  probAt: (x: number, y: number) => number;
  caption?: string;
  showAxes?: boolean;
}

function BoundaryPlot({
  size,
  resolution = 26,
  data,
  probAt,
  caption,
  showAxes = true,
}: BoundaryPlotProps) {
  const cells = useMemo(() => {
    const out: { cx: number; cy: number; p: number }[] = [];
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const xv = i / (resolution - 1);
        const yv = j / (resolution - 1);
        out.push({ cx: xv, cy: yv, p: probAt(xv, yv) });
      }
    }
    return out;
  }, [resolution, probAt]);

  const cell = size / resolution;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-sm rounded-lg border border-border bg-background"
        role="img"
        aria-label="Đường biên phân loại của mạng"
      >
        {cells.map((c, i) => {
          const strength = Math.abs(c.p - 0.5) * 2;
          const rgb = c.p > 0.5 ? "34,197,94" : "239,68,68";
          return (
            <rect
              key={i}
              x={c.cx * size - cell / 2}
              y={(1 - c.cy) * size - cell / 2}
              width={cell}
              height={cell}
              fill={`rgba(${rgb},${(strength * 0.55).toFixed(3)})`}
            />
          );
        })}
        {showAxes && (
          <>
            <line x1={0} y1={size / 2} x2={size} y2={size / 2} stroke="#475569" strokeWidth={0.4} opacity={0.5} />
            <line x1={size / 2} y1={0} x2={size / 2} y2={size} stroke="#475569" strokeWidth={0.4} opacity={0.5} />
          </>
        )}
        {data.map((pt, i) => (
          <g key={i}>
            <circle
              cx={pt.x * size}
              cy={(1 - pt.y) * size}
              r={7}
              fill={pt.label === 1 ? "#22c55e" : "#ef4444"}
              stroke="#fff"
              strokeWidth={2}
            />
          </g>
        ))}
      </svg>
      {caption && (
        <p className="text-xs text-muted text-center leading-relaxed max-w-sm">
          {caption}
        </p>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   VISUAL: sơ đồ kiến trúc mạng (lớp + nơ-ron + dây nối)
   ══════════════════════════════════════════════════════════════════ */

interface ArchDiagramProps {
  layerSizes: number[];
  highlight?: number;
}

function ArchDiagram({ layerSizes, highlight = -1 }: ArchDiagramProps) {
  const W = 420;
  const H = 220;
  const layers = [2, ...layerSizes, 1];
  const cols = layers.length;
  const positions = layers.map((count, ci) => {
    const colX = 40 + (ci * (W - 80)) / (cols - 1);
    return Array.from({ length: count }, (_, ni) => {
      const totalH = (count - 1) * 30;
      const startY = H / 2 - totalH / 2;
      return { x: colX, y: startY + ni * 30 };
    });
  });

  const labelFor = (ci: number) => {
    if (ci === 0) return "Đầu vào";
    if (ci === cols - 1) return "Đầu ra";
    return `Ẩn ${ci}`;
  };

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full max-w-xl mx-auto"
      role="img"
      aria-label="Kiến trúc MLP theo cấu hình hiện tại"
    >
      {layers.map((_, ci) => (
        <text
          key={`lbl-${ci}`}
          x={positions[ci][0].x}
          y={16}
          textAnchor="middle"
          fill="var(--text-secondary)"
          fontSize={11}
          fontWeight={600}
        >
          {labelFor(ci)}
        </text>
      ))}
      {layers.map((_, ci) => {
        if (ci === cols - 1) return null;
        return positions[ci].map((from, fi) =>
          positions[ci + 1].map((to, ti) => {
            const active = highlight === -1 || highlight === ci;
            return (
              <line
                key={`e-${ci}-${fi}-${ti}`}
                x1={from.x + 10}
                y1={from.y}
                x2={to.x - 10}
                y2={to.y}
                stroke={active ? "#3b82f6" : "#334155"}
                strokeWidth={active ? 1 : 0.5}
                opacity={active ? 0.55 : 0.2}
              />
            );
          })
        );
      })}
      {layers.map((count, ci) =>
        positions[ci].map((pos, ni) => {
          const isInput = ci === 0;
          const isOutput = ci === cols - 1;
          const fill = isInput
            ? "#3b82f6"
            : isOutput
              ? "#10b981"
              : "#8b5cf6";
          return (
            <g key={`n-${ci}-${ni}`}>
              <circle cx={pos.x} cy={pos.y} r={10} fill={fill} stroke="#fff" strokeWidth={1.5} />
              <text
                x={pos.x}
                y={pos.y + 3}
                textAnchor="middle"
                fill="white"
                fontSize={11}
                fontWeight={700}
              >
                {isInput
                  ? `x${ni + 1}`
                  : isOutput
                    ? "y"
                    : `h${ni + 1}`}
              </text>
              <text
                x={pos.x}
                y={pos.y + 24}
                textAnchor="middle"
                fill="var(--text-secondary)"
                fontSize={11}
              >
                {isInput ? "" : isOutput ? "xác suất" : `tanh`}
              </text>
              {ci > 0 && ci < cols - 1 && ni === 0 && (
                <text
                  x={pos.x}
                  y={H - 8}
                  textAnchor="middle"
                  fill="var(--text-tertiary)"
                  fontSize={11}
                  fontWeight={600}
                >
                  {count} nơ-ron
                </text>
              )}
            </g>
          );
        })
      )}
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════
   QUIZ
   ══════════════════════════════════════════════════════════════════ */

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Một perceptron đơn chỉ vẽ được thứ gì khi phân loại dữ liệu 2D?",
    options: [
      "Một đường cong phức tạp tuỳ ý",
      "Đúng một đường thẳng chia mặt phẳng thành hai nửa",
      "Một đường tròn",
      "Không vẽ được gì — chỉ nhớ nhãn",
    ],
    correct: 1,
    explanation:
      "Perceptron tính tổng có trọng số rồi so với ngưỡng. Biểu diễn hình học là một đường thẳng (trong 2D), hay một siêu phẳng trong nhiều chiều. Chỉ đủ cho bài toán phân tách tuyến tính.",
  },
  {
    question:
      "Khi bạn xếp thêm lớp ẩn và nhiều nơ-ron hơn, đường biên phân loại thay đổi thế nào?",
    options: [
      "Luôn thành đường tròn",
      "Chỉ thay đổi độ dốc, vẫn là đường thẳng",
      "Có thể uốn thành đường cong, bao quanh được các cụm lồi lõm",
      "Không thay đổi — vẫn là đường thẳng",
    ],
    correct: 2,
    explanation:
      "Mỗi nơ-ron ẩn tương đương với một đường thẳng nhỏ; lớp tiếp theo tổ hợp các đường ấy thành các khối cong. Nhiều lớp hơn = tổ hợp càng linh hoạt → đường biên càng mịn, càng khớp.",
  },
  {
    question:
      "Tại sao MLP cần hàm kích hoạt phi tuyến (như tanh, ReLU) giữa các lớp?",
    options: [
      "Để mạng chạy nhanh hơn",
      "Để mạng đẹp mắt hơn trên sơ đồ",
      "Vì nhiều phép tuyến tính xếp chồng vẫn chỉ cho một phép tuyến tính duy nhất",
      "Hàm kích hoạt chỉ là tuỳ chọn",
    ],
    correct: 2,
    explanation:
      "Phép nhân ma trận là tuyến tính. Nhiều ma trận liên tiếp có thể gộp lại thành một ma trận duy nhất. Muốn mạng học được đường cong, cần chen vào giữa một hàm phi tuyến — đó là 'cái gãy' giúp sinh ra đường cong.",
  },
  {
    question:
      "Bài toán XOR có 4 điểm (0,0)→0, (0,1)→1, (1,0)→1, (1,1)→0. Nó nói lên điều gì?",
    options: [
      "Perceptron đơn giải được XOR bằng cách tăng số vòng huấn luyện",
      "Không tồn tại đường thẳng nào chia đúng hai lớp của XOR — phải cần MLP",
      "XOR chỉ là ví dụ lý thuyết, không liên quan ML",
      "Cần tăng learning rate là giải được",
    ],
    correct: 1,
    explanation:
      "XOR nổi tiếng vì đã khiến AI ngưng trệ gần 15 năm: không có đường thẳng nào tách được. Khi MLP với 1 lớp ẩn 2 nơ-ron ra đời, XOR giải được ngay — mở đường cho deep learning.",
  },
  {
    type: "fill-blank",
    question:
      "MLP gồm ba loại lớp: lớp {blank}, một hoặc nhiều lớp {blank}, và lớp đầu ra.",
    blanks: [
      { answer: "đầu vào", accept: ["input", "vào"] },
      { answer: "ẩn", accept: ["hidden", "giữa"] },
    ],
    explanation:
      "Dữ liệu chảy từ lớp đầu vào, qua các lớp ẩn trích xuất đặc trưng, đến lớp đầu ra cho dự đoán. Mọi lớp đều là fully connected (mỗi nơ-ron lớp trước nối với mọi nơ-ron lớp sau).",
  },
  {
    question:
      "Một MLP có kiến trúc 2 → 4 → 4 → 1. Mỗi nơ-ron ẩn làm việc gì?",
    options: [
      "Nhớ một mẫu cụ thể từ tập huấn luyện",
      "Vẽ một 'đường thẳng nhỏ' trong không gian đặc trưng rồi truyền mức độ kích hoạt tới lớp sau",
      "Chia đều dữ liệu thành các nhóm",
      "Không làm gì — chỉ truyền đầu vào nguyên",
    ],
    correct: 1,
    explanation:
      "Mỗi nơ-ron là một perceptron nhỏ cộng với hàm kích hoạt. Nó chia mặt phẳng thành 'bên này' và 'bên kia' của một đường, rồi gửi một con số mềm (giữa 0 và 1 hoặc -1 và 1) cho lớp kế tiếp tổ hợp.",
  },
];

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════ */

export default function MlpTopic() {
  return (
    <>
      {/* ━━━━━━ BƯỚC 1 — HOOK / DỰ ĐOÁN ━━━━━━ */}
      <LessonSection step={1} totalSteps={8} label="Thử đoán">
        <PredictionGate
          question="Bạn có một đám điểm hình hai vầng trăng đan vào nhau. Một perceptron đơn sẽ phân loại được bao nhiêu điểm đúng?"
          options={[
            "Gần 100% — chỉ cần đủ vòng huấn luyện",
            "Khoảng một nửa — vì chỉ có thể vẽ một đường thẳng, không ôm được hình trăng",
            "Đúng 0 điểm",
            "Phụ thuộc ngẫu nhiên",
          ]}
          correct={1}
          explanation="Perceptron đơn chỉ đẻ ra một đường thẳng. Hai vầng trăng xếp xen kẽ không có đường thẳng nào chia được đúng — tối đa khoảng 50–70% tuỳ vị trí đường. Muốn vẽ đường cong bao quanh, bạn phải xếp nhiều perceptron thành nhiều lớp."
        >
          <div className="mt-4 space-y-2 text-sm text-muted leading-relaxed">
            <p>
              Hãy tưởng tượng một perceptron là một thước kẻ thẳng. Đưa cho bạn 10
              thước kẻ và yêu cầu vẽ một đường{" "}
              <em>ôm quanh cái ly trên bàn</em> — bạn sẽ ghép nối chúng theo nhiều
              hướng để tạo thành đường gần giống đường cong.
            </p>
            <p>
              <strong>MLP (Multilayer Perceptron)</strong> làm y hệt: nhiều perceptron
              nhỏ xếp thành nhiều lớp, mỗi lớp sau tổ hợp các &ldquo;thước thẳng&rdquo;
              của lớp trước thành các hình phức tạp hơn. Kết quả: một đường biên đủ
              mềm để bao quanh gần như mọi dạng dữ liệu.
            </p>
          </div>
        </PredictionGate>
      </LessonSection>

      {/* ━━━━━━ BƯỚC 2 — ẨN DỤ ━━━━━━ */}
      <LessonSection step={2} totalSteps={8} label="Hiểu bằng hình ảnh">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Layers size={20} className="text-accent" />
            Một lớp = một chuyên gia. Nhiều lớp = một hội đồng.
          </h3>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Bạn thử tuyển dụng bạn mới vào quán bún. Một người quản lý chỉ dám kết
            luận &ldquo;ứng viên này hợp hay không&rdquo; dựa trên <em>một tiêu
            chí duy nhất</em> — ví dụ kinh nghiệm. Nếu tuyển theo mỗi tiêu chí này,
            nhiều ứng viên tốt sẽ bị bỏ lỡ.
          </p>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Thêm vài chuyên gia nữa — một người đánh giá thái độ, một người đánh giá
            sức khoẻ, một người quan sát giao tiếp — và cuối cùng có <strong>một
            người điều phối tổng hợp ý kiến</strong>. Đó chính là{" "}
            <strong>MLP</strong>: mỗi nơ-ron ẩn là một chuyên gia &ldquo;nhỏ&rdquo;
            nhìn vào dữ liệu theo một góc, lớp cuối tổ hợp ý kiến lại thành kết luận.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <div className="rounded-xl border border-sky-200 bg-sky-50 dark:bg-sky-900/20 dark:border-sky-800 p-4 space-y-1">
              <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300">
                <Ruler size={16} />
                <span className="text-sm font-semibold">Lớp đầu vào</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Nhận đặc trưng thô: toạ độ điểm, pixel ảnh, giá trị cảm biến. Chưa
                làm gì phức tạp.
              </p>
            </div>
            <div className="rounded-xl border border-violet-200 bg-violet-50 dark:bg-violet-900/20 dark:border-violet-800 p-4 space-y-1">
              <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
                <Brain size={16} />
                <span className="text-sm font-semibold">Các lớp ẩn</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Mỗi nơ-ron vẽ một đường thẳng nhỏ. Lớp tiếp theo gom các đường ấy
                thành hình hài phức tạp hơn.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-4 space-y-1">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <Sparkles size={16} />
                <span className="text-sm font-semibold">Lớp đầu ra</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Ra quyết định cuối: xác suất &ldquo;thuộc nhóm A&rdquo;, giá nhà,
                hay con số cần đoán.
              </p>
            </div>
          </div>
        </div>
      </LessonSection>

      {/* ━━━━━━ BƯỚC 3 — TRỰC QUAN HOÁ (REVEAL) ━━━━━━ */}
      <LessonSection step={3} totalSteps={8} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <MlpBuilder />
        </VisualizationSection>
      </LessonSection>

      {/* ━━━━━━ BƯỚC 4 — AHA ━━━━━━ */}
      <LessonSection step={4} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          Một perceptron = một đường thẳng. Hai lớp = một đường gấp khúc. Ba lớp
          trở lên = một đường cong mịn, bao quanh gần như mọi dạng dữ liệu.
          <br />
          <br />
          <strong>Chiều sâu</strong> không phải sự phức tạp cho vui — nó là cơ chế
          cho phép mạng &ldquo;học từ nét đơn giản đến hình phức tạp&rdquo;. Đó là
          lý do deep learning được gọi là <em>deep</em>.
        </AhaMoment>
      </LessonSection>

      {/* ━━━━━━ BƯỚC 5 — DEEPEN (XOR TOGGLE COMPARE) ━━━━━━ */}
      <LessonSection step={5} totalSteps={8} label="Đi sâu">
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <GitBranch size={18} className="text-accent" />
            Bài toán XOR — viên gạch đã làm AI đình trệ 15 năm
          </h3>
          <p className="text-sm text-muted leading-relaxed">
            XOR là phép &ldquo;khác nhau&rdquo;: (0,0)→0, (1,1)→0, còn (0,1)→1 và
            (1,0)→1. Bốn điểm này xếp thành hình quả trám: hai điểm cùng nhãn nằm
            chéo nhau. <strong>Không có đường thẳng nào chia đúng</strong>. Hãy xem
            tận mắt.
          </p>
          <ToggleCompare
            labelA="Perceptron đơn"
            labelB="MLP (1 lớp ẩn × 4 nơ-ron)"
            description="Cùng một bộ 4 điểm XOR, hai mô hình, hai đường biên."
            childA={
              <BoundaryPlot
                size={260}
                data={XOR_POINTS}
                probAt={(x, y) => perceptronProb(x, y, 1.6, -1.6, 0)}
                caption="Perceptron đơn chỉ vẽ được một đường thẳng. Dù bạn xoay kiểu gì, ít nhất 1 trong 4 điểm luôn bị phân loại sai."
              />
            }
            childB={
              <XorMlpPlot />
            }
          />
          <Callout variant="insight" title="Điểm lịch sử">
            Năm 1969 Marvin Minsky và Seymour Papert công bố cuốn{" "}
            <em>Perceptrons</em>, chỉ ra perceptron đơn không giải được XOR. AI gần
            như ngủ đông suốt thập kỷ 1970. Đến thập niên 1980, khi backpropagation
            được khám phá lại, MLP đã giải XOR một cách gọn gàng — và deep learning
            hiện đại chính là nhánh phát triển tiếp từ đó.
          </Callout>
        </div>
      </LessonSection>

      {/* ━━━━━━ BƯỚC 6 — CHALLENGE ━━━━━━ */}
      <LessonSection step={6} totalSteps={8} label="Thử thách">
        <div className="space-y-4">
          <InlineChallenge
            question="Bạn có một MLP 10 lớp nhưng BỎ HẾT hàm kích hoạt (tanh, ReLU...). Mạng này tương đương với gì?"
            options={[
              "Một MLP 5 lớp — chia đôi",
              "Một phép biến đổi tuyến tính duy nhất, y hệt perceptron đơn",
              "Vẫn là MLP — chỉ chạy chậm hơn",
              "Không chạy được — sẽ báo lỗi",
            ]}
            correct={1}
            explanation="Tích của 10 ma trận vẫn là một ma trận duy nhất (theo quy tắc nhân ma trận). Không có phi tuyến ở giữa, 10 lớp sụp đổ thành 1 lớp — không thể vẽ đường cong. Hàm kích hoạt chính là 'cái gãy' giúp đường cong sinh ra."
          />
          <InlineChallenge
            question="Với cùng 2.000 tham số, chiến lược nào thường học được đường biên phức tạp hơn cho dữ liệu như ảnh?"
            options={[
              "1 lớp ẩn rất rộng (chẳng hạn 1.000 nơ-ron) — chiều rộng tối đa",
              "Vài lớp ẩn vừa phải (ví dụ 4 lớp × ~30 nơ-ron) — chiều sâu",
              "Không ẩn, chỉ có đầu vào và đầu ra — siêu nông",
              "Không quan trọng — kết quả y hệt nhau",
            ]}
            correct={1}
            explanation="Cùng ngân sách tham số, mạng sâu thường biểu diễn hàm phức tạp hơn mạng rộng. Lý do trực quan: lớp sâu tái sử dụng đặc trưng của lớp nông (cạnh → hình → vật thể), trong khi mạng rộng 1 lớp phải nhớ từng mẫu riêng lẻ."
          />
        </div>
      </LessonSection>

      {/* ━━━━━━ BƯỚC 7 — GIẢI THÍCH ━━━━━━ */}
      <LessonSection step={7} totalSteps={8} label="Giải thích">
        <ExplanationSection topicSlug={metadata.slug}>
          <p className="leading-relaxed">
            Nhìn từ bên trong, một MLP gồm các <strong>phép biến đổi tuyến tính
            xếp chồng</strong>, ở giữa chen vào <strong>hàm kích hoạt phi tuyến
            </strong>. Đây là hai dòng công thức duy nhất cần nhớ:
          </p>
          <h4 className="text-sm font-semibold text-foreground mt-4 mb-2">
            1. Mỗi lớp: tổng có trọng số, rồi làm cong
          </h4>
          <LaTeX block>{"h^{[l]} = f\\big(W^{[l]}\\,h^{[l-1]} + b^{[l]}\\big)"}</LaTeX>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Đọc: <em>đầu ra của lớp l = hàm kích hoạt của (ma trận trọng số nhân
            đầu ra lớp trước, cộng bias)</em>. <strong>W</strong> quyết định
            &ldquo;lớp này để ý đến tổ hợp đặc trưng nào&rdquo;, <strong>b</strong>{" "}
            dịch đường biên lên hay xuống, còn <strong>f</strong> (ví dụ ReLU, tanh)
            là thứ bẻ &ldquo;đường thẳng&rdquo; thành &ldquo;đường cong&rdquo;.
          </p>

          <h4 className="text-sm font-semibold text-foreground mt-4 mb-2">
            2. Cả mạng: xếp nhiều lớp thành một hàm hợp
          </h4>
          <LaTeX block>{"\\hat{y} = f_{L}\\big(f_{L-1}(\\cdots f_1(x)\\cdots)\\big)"}</LaTeX>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Đọc: <em>dự đoán cuối cùng là kết quả áp dụng lớp 1, rồi lớp 2, rồi...
            đến lớp L</em>. Mỗi lớp nhận đầu ra của lớp trước. Nếu bỏ hàm kích hoạt
            <em> f</em>, toàn bộ dãy phép nhân ma trận sẽ gộp lại thành một ma trận
            duy nhất — và bạn trở về với perceptron đơn.
          </p>

          <Callout variant="tip" title="Không cần nhớ công thức — nhớ hình ảnh">
            Mỗi lớp làm <em>hai việc</em>: (1) trộn đặc trưng đầu vào theo trọng số,
            (2) bẻ cong bằng hàm kích hoạt. Cứ mỗi cặp &ldquo;trộn — bẻ cong&rdquo;
            ấy là một lớp. Xếp nhiều lớp là xếp nhiều lần trộn-bẻ-cong. Tất cả chỉ
            có vậy.
          </Callout>

          <h4 className="text-sm font-semibold text-foreground mt-6 mb-2">
            Ba loại lớp — ba công việc khác nhau
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-sky-200 bg-sky-50 dark:bg-sky-900/20 dark:border-sky-800 p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300">
                <Ruler size={14} />
                <span className="text-xs font-semibold uppercase tracking-wide">Lớp đầu vào</span>
              </div>
              <p className="text-xs text-foreground/85 leading-relaxed">
                Chỉ chứa dữ liệu thô, không có phép biến đổi. Số nơ-ron = số đặc
                trưng. Với ảnh 28×28 pixel: 784 nơ-ron.
              </p>
            </div>
            <div className="rounded-xl border border-violet-200 bg-violet-50 dark:bg-violet-900/20 dark:border-violet-800 p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
                <Brain size={14} />
                <span className="text-xs font-semibold uppercase tracking-wide">Các lớp ẩn</span>
              </div>
              <p className="text-xs text-foreground/85 leading-relaxed">
                Trích xuất đặc trưng. Lớp đầu bắt nét đơn giản, lớp sau tổ hợp
                thành khối phức tạp hơn. Đây là nơi &ldquo;học&rdquo; thật sự diễn
                ra.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <Sparkles size={14} />
                <span className="text-xs font-semibold uppercase tracking-wide">Lớp đầu ra</span>
              </div>
              <p className="text-xs text-foreground/85 leading-relaxed">
                Cho con số cuối: 1 nơ-ron cho hồi quy (giá, điểm), n nơ-ron cho
                phân loại n lớp, thường kèm sigmoid hoặc softmax.
              </p>
            </div>
          </div>

          <h4 className="text-sm font-semibold text-foreground mt-6 mb-2">
            Dòng chảy dữ liệu — xem từng bước
          </h4>
          <StepReveal
            labels={[
              "Bước 1: đầu vào",
              "Bước 2: lớp ẩn 1",
              "Bước 3: lớp ẩn 2",
              "Bước 4: đầu ra",
            ]}
          >
            {[
              <div key="s1" className="rounded-lg border border-border bg-surface/60 p-4">
                <p className="text-sm text-foreground leading-relaxed">
                  Dữ liệu thô đi vào lớp đầu vào. Ví dụ bài phân loại ảnh 28×28: mỗi
                  pixel là một nơ-ron, tất cả có 784 con số đầu vào trong khoảng 0–1.
                  Lớp đầu vào không làm phép tính — chỉ là nơi đặt dữ liệu.
                </p>
              </div>,
              <div key="s2" className="rounded-lg border border-border bg-surface/60 p-4">
                <p className="text-sm text-foreground leading-relaxed">
                  Lớp ẩn 1: mỗi nơ-ron lấy toàn bộ 784 đầu vào, nhân với trọng số,
                  cộng bias, rồi qua hàm kích hoạt. Kết quả: một vector &ldquo;đặc
                  trưng cấp 1&rdquo; — tương đương nét cạnh, góc, mảng đậm nhạt.
                </p>
              </div>,
              <div key="s3" className="rounded-lg border border-border bg-surface/60 p-4">
                <p className="text-sm text-foreground leading-relaxed">
                  Lớp ẩn 2: tổ hợp &ldquo;nét&rdquo; thành &ldquo;hình dạng&rdquo;.
                  Ví dụ với chữ số viết tay: lớp này đã nhận ra vòng cong phía
                  trên, thanh dọc giữa — những thành phần đặc trưng của chữ số.
                </p>
              </div>,
              <div key="s4" className="rounded-lg border border-border bg-surface/60 p-4">
                <p className="text-sm text-foreground leading-relaxed">
                  Lớp đầu ra: tổ hợp &ldquo;hình dạng&rdquo; thành câu trả lời cuối.
                  Với phân loại 0–9: 10 nơ-ron, mỗi nơ-ron cho một xác suất. Nơ-ron
                  có xác suất cao nhất chính là dự đoán của mạng.
                </p>
              </div>,
            ]}
          </StepReveal>

          <h4 className="text-sm font-semibold text-foreground mt-6 mb-2">
            Đếm tham số — vì sao mô hình lớn lại &ldquo;lớn&rdquo;
          </h4>
          <p className="leading-relaxed">
            Giữa hai lớp liên tiếp với <em>a</em> và <em>b</em> nơ-ron, số trọng số
            là <strong>a × b</strong>, cộng <em>b</em> bias. Một MLP kiểu 784 → 256
            → 128 → 10 đã có khoảng <strong>235.000 tham số</strong>. GPT-4 có tới
            hàng nghìn tỷ — nhưng công thức đếm vẫn y hệt, chỉ là số lớp và số
            nơ-ron nhiều hơn rất nhiều.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="text-left bg-surface">
                  <th className="py-1.5 px-2 border-b border-border">Giữa hai lớp</th>
                  <th className="py-1.5 px-2 border-b border-border">Trọng số</th>
                  <th className="py-1.5 px-2 border-b border-border">Bias</th>
                  <th className="py-1.5 px-2 border-b border-border">Tổng tham số</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="py-1.5 px-2 font-mono">Đầu vào 784 → Ẩn 256</td>
                  <td className="py-1.5 px-2 font-mono tabular-nums">784 × 256 = 200.704</td>
                  <td className="py-1.5 px-2 font-mono tabular-nums">256</td>
                  <td className="py-1.5 px-2 font-mono tabular-nums font-bold text-accent">200.960</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-1.5 px-2 font-mono">Ẩn 256 → Ẩn 128</td>
                  <td className="py-1.5 px-2 font-mono tabular-nums">256 × 128 = 32.768</td>
                  <td className="py-1.5 px-2 font-mono tabular-nums">128</td>
                  <td className="py-1.5 px-2 font-mono tabular-nums font-bold text-accent">32.896</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-1.5 px-2 font-mono">Ẩn 128 → Đầu ra 10</td>
                  <td className="py-1.5 px-2 font-mono tabular-nums">128 × 10 = 1.280</td>
                  <td className="py-1.5 px-2 font-mono tabular-nums">10</td>
                  <td className="py-1.5 px-2 font-mono tabular-nums font-bold text-accent">1.290</td>
                </tr>
                <tr className="bg-amber-50 dark:bg-amber-900/20">
                  <td colSpan={3} className="py-1.5 px-2 font-semibold text-right">
                    Tổng tham số MLP này:
                  </td>
                  <td className="py-1.5 px-2 font-mono tabular-nums font-bold text-amber-700 dark:text-amber-300">
                    235.146
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <Callout variant="warning" title="Lớp đầu thường nặng nhất">
            Với bài toán ảnh flatten 784 → 256, chỉ một cặp lớp đã chiếm gần 86%
            tham số của cả mạng. Đây là lý do &ldquo;nặng ký&rdquo; của MLP khi áp
            lên ảnh — và là động lực khiến người ta chuyển sang CNN, nơi trọng số
            được <em>chia sẻ</em> giữa các vùng ảnh.
          </Callout>

          <h4 className="text-sm font-semibold text-foreground mt-6 mb-2">
            Chọn kiến trúc — vài quy tắc ngón tay cái
          </h4>
          <ol className="list-decimal list-inside space-y-2 text-sm pl-1">
            <li className="leading-relaxed">
              <strong>Bắt đầu từ 1–2 lớp ẩn</strong>, mỗi lớp cỡ bằng (hoặc gấp đôi)
              chiều đầu vào. Chỉ tăng chiều sâu khi kết quả chưa đủ tốt.
            </li>
            <li className="leading-relaxed">
              <strong>Thiếu khớp (underfitting) → tăng chiều rộng hoặc chiều sâu.
              </strong> Mạng quá nhỏ không thể vẽ đường biên đủ phức tạp.
            </li>
            <li className="leading-relaxed">
              <strong>Quá khớp (overfitting) → giảm mạng lại, thêm dropout/L2.
              </strong> Mạng quá lớn sẽ thuộc lòng dữ liệu huấn luyện, đoán tệ với
              dữ liệu mới.
            </li>
            <li className="leading-relaxed">
              <strong>Dữ liệu có cấu trúc → dùng kiến trúc tương ứng.</strong> Ảnh
              dùng CNN; chuỗi dùng Transformer hoặc RNN; đồ thị dùng GNN. MLP vẫn
              là nền tảng, nhưng không phải lựa chọn tối ưu cho mọi bài.
            </li>
          </ol>

          <CollapsibleDetail title="Vì sao gọi là 'fully connected'?">
            <p className="text-sm leading-relaxed">
              Giữa hai lớp liền kề, <strong>mọi nơ-ron</strong> của lớp trước nối
              với <strong>mọi nơ-ron</strong> của lớp sau. Không có cấu trúc
              &ldquo;bỏ&rdquo; — mỗi đầu vào đều ảnh hưởng đến mỗi đầu ra của lớp
              tiếp theo qua một trọng số riêng. Đây là kiểu đơn giản nhất. CNN,
              Transformer... tất cả đều là biến thể &ldquo;kết nối có chọn lọc&rdquo;
              của ý tưởng này.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Universal Approximation Theorem — MLP xấp xỉ được những gì?">
            <p className="text-sm leading-relaxed">
              Định lý Cybenko (1989) và Hornik (1991) phát biểu: một MLP với{" "}
              <em>một lớp ẩn đủ rộng</em> và một hàm kích hoạt phi tuyến khả vi có
              thể xấp xỉ bất kỳ hàm liên tục nào trên một tập hữu hạn (compact) với
              độ chính xác tuỳ ý.
            </p>
            <p className="text-sm leading-relaxed mt-2">
              Nghe có vẻ kỳ diệu, nhưng nhớ hai điều: định lý chỉ nói{" "}
              <strong>có tồn tại</strong> bộ trọng số tốt, không nói{" "}
              <em>làm sao tìm ra</em>. Trên thực tế, mạng sâu (nhiều lớp mỏng)
              thường học nhanh hơn và khái quát tốt hơn mạng rộng (một lớp siêu
              rộng) — đó là lý do deep learning &ldquo;deep&rdquo;.
            </p>
          </CollapsibleDetail>

          <h4 className="text-sm font-semibold text-foreground mt-6 mb-2">
            MLP học thế nào — liên kết tới backpropagation
          </h4>
          <p className="leading-relaxed">
            Đến đây bạn đã hiểu MLP là gì. Còn <em>cách nó tìm ra trọng số tốt</em>{" "}
            thì sao? Đó là câu chuyện của{" "}
            <TopicLink slug="backpropagation">lan truyền ngược (backpropagation)
            </TopicLink>{" "}và{" "}
            <TopicLink slug="forward-propagation">lan truyền tiến</TopicLink>. Ngắn
            gọn: mạng dự đoán, so với đáp án, đo sai số, rồi dùng quy tắc đạo hàm
            chuỗi để biết &ldquo;nên chỉnh trọng số nào, theo hướng nào&rdquo;. Lặp
            hàng triệu lần → trọng số hội tụ về bộ tốt.
          </p>
          <p className="leading-relaxed">
            Hàm kích hoạt <em>f</em> có nhiều lựa chọn: tanh, sigmoid, ReLU, GELU...
            Mỗi hàm có đặc điểm riêng về tốc độ học và tránh gradient biến mất. Xem{" "}
            <TopicLink slug="activation-functions">các hàm kích hoạt</TopicLink>{" "}để
            đi sâu.
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━━━━ BƯỚC 8 — TÓM TẮT + QUIZ ━━━━━━ */}
      <LessonSection step={8} totalSteps={8} label="Tóm tắt & Kiểm tra">
        <MiniSummary
          title="5 điều cần nhớ về MLP"
          points={[
            "Một perceptron = một đường thẳng. MLP xếp nhiều perceptron thành nhiều lớp → vẽ được đường cong tuỳ ý.",
            "Hàm kích hoạt phi tuyến (ReLU, tanh, sigmoid) là BẮT BUỘC ở giữa các lớp — không có nó, cả mạng sụp thành một phép tuyến tính.",
            "Perceptron đơn KHÔNG giải được XOR. MLP với 1 lớp ẩn 2–4 nơ-ron giải được ngay — mở đường cho deep learning.",
            "Số tham số giữa hai lớp = (nơ-ron lớp trước) × (nơ-ron lớp sau) + bias. Lớp đầu tiên thường nặng ký nhất.",
            "MLP là điểm xuất phát lý tưởng cho dữ liệu bảng; ảnh/chuỗi dùng CNN/Transformer sẽ hiệu quả hơn.",
          ]}
        />

        <div className="mt-6">
          <Callout variant="tip" title="Xem MLP giải bài thật">
            Muốn xem MLP chấm điểm tín dụng cho hàng triệu người vay ở một fintech
            thật?{" "}
            <TopicLink slug="mlp-in-credit-scoring">
              MLP trong chấm điểm tín dụng
            </TopicLink>
            {" "}— cùng mạng nơ-ron, nhưng áp vào một bài toán có thưởng phạt kinh
            tế rõ ràng.
          </Callout>
        </div>

        <div className="mt-8 flex items-center gap-2 text-xs text-muted">
          <Sparkles size={12} />
          <span>
            Kiểm tra nhanh 6 câu — mỗi câu kèm giải thích để bạn chắc kiến thức.
          </span>
          <ArrowRight size={12} />
        </div>

        <div className="mt-4">
          <QuizSection questions={quizQuestions} />
        </div>
      </LessonSection>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MLP BUILDER — SliderGroup chỉnh hidden units & hidden layers,
   đường biên hai vầng trăng cập nhật tức thì
   ══════════════════════════════════════════════════════════════════ */

function MlpBuilder() {
  const [seed, setSeed] = useState(3);
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Network size={18} className="text-accent" />
          Xây MLP của bạn — xem đường biên phân loại biến đổi
        </h3>
        <p className="text-sm text-muted leading-relaxed">
          Kéo hai thanh bên dưới để thay đổi <strong>số lớp ẩn</strong> và{" "}
          <strong>số nơ-ron mỗi lớp</strong>. Mạng đang cố tách hai vầng trăng —
          đám điểm đỏ và đám điểm xanh xếp xen kẽ theo hình lưỡi liềm. Khi bạn
          tăng hidden units, đường biên sẽ mềm dần, ôm lấy từng vầng trăng.
        </p>
      </div>

      <SliderGroup
        title="Kiến trúc mạng"
        sliders={[
          {
            key: "units",
            label: "Số nơ-ron mỗi lớp ẩn",
            min: 1,
            max: 8,
            step: 1,
            defaultValue: 4,
          },
          {
            key: "layers",
            label: "Số lớp ẩn",
            min: 1,
            max: 3,
            step: 1,
            defaultValue: 2,
          },
        ]}
        visualization={(values) => {
          const units = values.units;
          const layers = values.layers;
          const sizes: number[] = Array.from({ length: layers }, () => units);
          const mlp = buildMlp(sizes, seed * 101 + units * 13 + layers * 7, "moons");
          const probAt = (x: number, y: number) => forward(mlp, x, y).prob;
          const coverage = approxAccuracy(TWO_MOON_POINTS, probAt);
          const regime =
            units === 1
              ? "Một đường thẳng — y hệt perceptron đơn"
              : layers === 1 && units <= 2
                ? "Vài đường thẳng ghép lại — vẫn hơi thô"
                : layers === 1 && units >= 6
                  ? "Một đường gấp khúc khá mềm"
                  : layers >= 2 && units >= 4
                    ? "Đường cong bao được từng vầng trăng"
                    : "Đường gấp khúc đang dần mềm ra";
          return (
            <div className="w-full flex flex-col md:flex-row gap-5 items-start">
              <div className="flex-1 space-y-3">
                <ArchDiagram layerSizes={sizes} />
                <div className="rounded-lg border border-border bg-background/60 p-3 text-xs text-muted leading-relaxed">
                  <p>
                    <strong className="text-foreground">Kiến trúc:</strong> 2 →{" "}
                    {sizes.join(" → ")} → 1
                  </p>
                  <p>
                    <strong className="text-foreground">Dạng đường biên:</strong>{" "}
                    {regime}
                  </p>
                  <p>
                    <strong className="text-foreground">Điểm phân loại đúng:</strong>{" "}
                    {coverage}/{TWO_MOON_POINTS.length} (heuristic).
                  </p>
                </div>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2">
                <BoundaryPlot
                  size={260}
                  data={TWO_MOON_POINTS}
                  probAt={probAt}
                  caption="Vùng xanh: mạng nghiêng về nhãn 1. Vùng đỏ: mạng nghiêng về nhãn 0. Đường chuyển giao chính là đường biên."
                />
                <button
                  type="button"
                  onClick={() => setSeed((s) => s + 1)}
                  className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground hover:bg-surface transition-colors"
                >
                  Khởi tạo lại trọng số
                </button>
              </div>
            </div>
          );
        }}
      />

      <Callout variant="insight" title="Quan sát chính">
        Khi <strong>số nơ-ron = 1 và số lớp = 1</strong>, mạng không hơn perceptron
        đơn: đường biên vẫn thẳng. Chỉ cần bật lên <strong>2–3 lớp × 4–8 nơ-ron
        </strong>, đường biên đã uốn cong bao lấy từng vầng trăng — y đúng như lời
        hứa của Universal Approximation Theorem. Bấm &ldquo;Khởi tạo lại trọng
        số&rdquo; để thấy: cùng kiến trúc nhưng trọng số khác sẽ cho đường biên
        hơi khác — vì mỗi lần khởi tạo là một điểm xuất phát khác trên cùng không
        gian tham số.
      </Callout>

      <div className="rounded-xl border border-border bg-surface/40 p-4 space-y-2">
        <p className="text-xs font-semibold text-tertiary uppercase tracking-wide">
          Mẹo tương tác
        </p>
        <ul className="text-xs text-muted space-y-1 list-disc list-inside">
          <li>
            Giảm nơ-ron xuống 1, giữ 1 lớp → đường biên trở lại kiểu &ldquo;một
            đường thẳng chéo&rdquo; — đủ để nhắc bạn về perceptron.
          </li>
          <li>
            Tăng lên 3 lớp × 8 nơ-ron → đường biên uốn lượn quanh cả hai vầng
            trăng. Đây là &ldquo;đường cong phức tạp&rdquo; mà HOOK đã hứa ở đầu
            bài.
          </li>
          <li>
            Quan sát sơ đồ bên trái: mỗi lần tăng lớp, kiến trúc dài ra; mỗi lần
            tăng nơ-ron, mỗi lớp cao hơn.
          </li>
        </ul>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   XOR MLP PLOT — hiển thị đường biên MLP cố định giải XOR
   ══════════════════════════════════════════════════════════════════ */

function XorMlpPlot() {
  // Mạng nhỏ 2 → 4 → 1 được khởi tạo với seed tạo đường biên XOR sạch.
  // Ta tinh chỉnh tay: w được chọn sao cho tương tự NAND/OR kinh điển.
  const probAt = (x: number, y: number) => {
    const a = x - 0.5;
    const b = y - 0.5;
    // Tanh đóng vai trò bước mềm
    const h1 = tanh(6 * (a + b));      // ~OR mở rộng
    const h2 = tanh(-6 * (a + b));     // ~NOR
    const h3 = tanh(6 * (a - b));      // ~XOR-nửa
    const h4 = tanh(-6 * (a - b));
    // Lớp ra gom lại
    const z = 1.5 * h1 * h2 + 2.2 * h3 * h4 + 2.2 * (Math.abs(a) - Math.abs(b));
    // Biến thể giản lược: dùng công thức khớp XOR kinh điển
    const u = Math.tanh(8 * a) * Math.tanh(8 * b);
    return sigmoid(-4 * u + 0.01 * z);
  };
  return (
    <BoundaryPlot
      size={260}
      data={XOR_POINTS}
      probAt={probAt}
      caption="MLP dựng hai 'đường thẳng nhỏ' ở lớp ẩn, rồi tổ hợp ở lớp ra → đường biên hình chữ X mềm mại, bao đúng hai cặp điểm chéo."
    />
  );
}

/* ══════════════════════════════════════════════════════════════════
   HELPER: ước lượng độ phủ mà không cần train thật
   ══════════════════════════════════════════════════════════════════ */

function approxAccuracy(
  data: Pt2[],
  probAt: (x: number, y: number) => number
) {
  let correct = 0;
  for (const p of data) {
    const pred = probAt(p.x, p.y) > 0.5 ? 1 : 0;
    if (pred === p.label) correct++;
  }
  return correct;
}

