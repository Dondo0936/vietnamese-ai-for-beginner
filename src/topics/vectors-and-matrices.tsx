"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Move,
  RotateCw,
  Maximize2,
  Scissors,
  Sparkles,
  Target,
} from "lucide-react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  LaTeX,
  LessonSection,
  StepReveal,
  TopicLink,
  CollapsibleDetail,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "vectors-and-matrices",
  title: "Vectors & Matrices",
  titleVi: "Vector và ma trận — mũi tên và bảng số",
  description:
    "Vector là mũi tên, ma trận là bảng số biến đổi mũi tên. Kéo thử, chỉnh thử, nhìn toán 'động đậy' ngay trước mắt.",
  category: "math-foundations",
  tags: ["vectors", "matrices", "dot-product", "linear-algebra"],
  difficulty: "beginner",
  relatedSlugs: [
    "eigendecomposition-pca",
    "word-embeddings",
    "neural-network-overview",
  ],
  vizType: "interactive",
};

/* ────────────────────────────────────────────────────────────
   HẰNG SỐ CHO SVG
   ──────────────────────────────────────────────────────────── */

const TOTAL_STEPS = 8;

/* SVG cho sân chơi vector chính */
const VW = 360;
const VH = 320;
const V_CX = VW / 2;
const V_CY = VH / 2;
const V_SCALE = 50;

/* SVG cho sân chơi ma trận */
const MW = 360;
const MH = 320;
const M_CX = MW / 2;
const M_CY = MH / 2;
const M_SCALE = 40;

/* Lưới điểm 5x5 dùng trong visualize phép biến đổi */
const GRID_RANGE = [-2, -1, 0, 1, 2];
const GRID_POINTS: [number, number][] = [];
for (const gx of GRID_RANGE) {
  for (const gy of GRID_RANGE) {
    GRID_POINTS.push([gx, gy]);
  }
}

/* Vài hình đơn giản mà ta sẽ biến đổi: một ngôi nhà 2D */
const HOUSE_SHAPE: [number, number][] = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [0, 2],
  [-1, 1],
  [-1, -1],
];

/* ────────────────────────────────────────────────────────────
   TIỆN ÍCH
   ──────────────────────────────────────────────────────────── */

function clampVec(x: number, y: number, limit: number): [number, number] {
  const len = Math.sqrt(x * x + y * y);
  if (len > limit) return [(x / len) * limit, (y / len) * limit];
  return [x, y];
}

function dotProduct(a: [number, number], b: [number, number]): number {
  return a[0] * b[0] + a[1] * b[1];
}

function vecLength(v: [number, number]): number {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
}

function cosineSimilarity(
  a: [number, number],
  b: [number, number],
): number {
  const la = vecLength(a);
  const lb = vecLength(b);
  if (la < 0.01 || lb < 0.01) return 0;
  return dotProduct(a, b) / (la * lb);
}

/* Ma trận 2x2 nhân với vector */
function applyMatrix(
  m: [number, number, number, number],
  v: [number, number],
): [number, number] {
  return [m[0] * v[0] + m[1] * v[1], m[2] * v[0] + m[3] * v[1]];
}

/* Bốn phép biến đổi 2D cho phần giải thích */
const TRANSFORM_CATALOG = [
  {
    label: "Xoay 90° ngược kim đồng hồ",
    mat: "[[0, -1], [1, 0]]",
    desc: "(1, 0) bay đến (0, 1). (0, 1) bay đến (-1, 0).",
    color: "#3b82f6",
  },
  {
    label: "Phóng to 2 lần",
    mat: "[[2, 0], [0, 2]]",
    desc: "Cả hai chiều nhân 2. Ảnh to gấp đôi.",
    color: "#10b981",
  },
  {
    label: "Lật gương ngang",
    mat: "[[-1, 0], [0, 1]]",
    desc: "Chiều x lật dấu. Ảnh lật trái-phải.",
    color: "#f59e0b",
  },
  {
    label: "Nghiêng sang phải",
    mat: "[[1, 1], [0, 1]]",
    desc: "Điểm trên bị đẩy sang phải. Như chữ italic.",
    color: "#ef4444",
  },
] as const;

/* ────────────────────────────────────────────────────────────
   QUIZ
   ──────────────────────────────────────────────────────────── */

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Vector [3, 4] trong mặt phẳng đại diện cho mũi tên từ gốc O đi tới điểm nào?",
    options: [
      "Điểm có toạ độ (3, 4)",
      "Điểm có toạ độ (4, 3)",
      "Điểm có toạ độ (0, 7) — cộng lại",
      "Điểm ở giữa trục x và trục y",
    ],
    correct: 0,
    explanation:
      "Một vector hai chiều [a, b] chính là mũi tên từ gốc toạ độ O đi đến điểm (a, b). Thành phần đầu là chiều ngang, thành phần sau là chiều dọc.",
  },
  {
    question:
      "Hai vector a và b hoàn toàn vuông góc với nhau. Tích vô hướng của chúng bằng bao nhiêu?",
    options: [
      "Một số rất lớn",
      "Bằng đúng 0",
      "Bằng 1",
      "Không tính được",
    ],
    correct: 1,
    explanation:
      "Tích vô hướng đo mức độ hai vector 'chỉ cùng hướng'. Nếu chúng vuông góc, chúng không cùng hướng mà cũng không ngược hướng — nên tích vô hướng bằng 0. Đây là dấu hiệu nhận biết vuông góc bằng đại số.",
  },
  {
    question:
      "Nhân ma trận đơn vị I = [[1, 0], [0, 1]] với vector bất kỳ. Kết quả là?",
    options: [
      "Vector đó bị xoay 90 độ",
      "Vector đó bị kéo dài gấp đôi",
      "Vector đó giữ nguyên, không đổi",
      "Vector đó bị lật ngược chiều",
    ],
    correct: 2,
    explanation:
      "Ma trận đơn vị là phép biến đổi 'không làm gì cả' — giống số 1 trong phép nhân thường. Bất kỳ vector nào nhân với I sẽ ra chính nó.",
  },
  {
    question:
      "Bạn có ma trận [[2, 0], [0, 2]]. Hình vuông đơn vị sẽ biến thành gì khi nhân với ma trận này?",
    options: [
      "Xoay 45 độ",
      "Phóng to gấp đôi theo cả hai chiều",
      "Co lại còn một nửa",
      "Lật ngược sang bên trái",
    ],
    correct: 1,
    explanation:
      "Ma trận đường chéo [[2, 0], [0, 2]] nhân chiều x với 2 và chiều y với 2 — tức là phóng đều 2 lần ra mọi hướng. Đường chéo khác thì phóng khác tỷ lệ.",
  },
  {
    type: "fill-blank",
    question:
      "Tích vô hướng của vector [2, 3] và [4, 1] bằng: 2 × 4 + 3 × 1 = {blank}",
    blanks: [{ answer: "11", accept: ["11"] }],
    explanation:
      "2 × 4 = 8, 3 × 1 = 3, cộng lại: 8 + 3 = 11. Quy tắc: nhân từng cặp thành phần rồi cộng tất cả. Đó là toàn bộ 'tích vô hướng'.",
  },
  {
    question:
      "Tại sao mạng nơ-ron và các mô hình AI đều dùng ma trận? Nhận định nào đúng nhất?",
    options: [
      "Vì ma trận trông đẹp hơn các công thức khác",
      "Vì một ma trận gọn gàng lưu được hàng trăm phép biến đổi và tính toán song song cực nhanh trên GPU",
      "Vì bắt buộc phải có theo tiêu chuẩn quốc tế",
      "Vì máy tính chỉ hiểu ma trận, không hiểu số thường",
    ],
    correct: 1,
    explanation:
      "Một tầng mạng nơ-ron thực chất là một phép nhân ma trận khổng lồ. Ma trận giúp (1) đóng gói hàng nghìn tham số gọn gàng, (2) thực hiện hàng triệu phép tính cùng lúc nhờ GPU. Đây là lý do GPU trở thành phần cứng cốt lõi của AI.",
  },
];

/* ────────────────────────────────────────────────────────────
   COMPONENT PHỤ: Ô nhập ma trận 2x2
   ──────────────────────────────────────────────────────────── */

interface Mini2x2Props {
  matrix: [number, number, number, number];
  onChange: (m: [number, number, number, number]) => void;
}

function Mini2x2Editor({ matrix, onChange }: Mini2x2Props) {
  const setCell = (i: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (Number.isNaN(val)) return;
    const clamped = Math.max(-3, Math.min(3, val));
    const next = [...matrix] as [number, number, number, number];
    next[i] = clamped;
    onChange(next);
  };

  return (
    <div className="flex items-center justify-center gap-1">
      <div className="text-3xl font-light text-muted select-none leading-none">
        [
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[0, 1, 2, 3].map((i) => (
          <input
            key={i}
            type="number"
            min={-3}
            max={3}
            step={0.1}
            value={matrix[i]}
            onChange={setCell(i)}
            className="w-16 rounded-md border border-border bg-card px-2 py-1.5 text-center font-mono text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        ))}
      </div>
      <div className="text-3xl font-light text-muted select-none leading-none">
        ]
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   COMPONENT PHỤ: Mũi tên đơn giản (line + head dot)
   ──────────────────────────────────────────────────────────── */

interface ArrowLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  width?: number;
  dashed?: boolean;
  dotted?: boolean;
}

function ArrowLine({
  x1,
  y1,
  x2,
  y2,
  color,
  width = 2,
  dashed,
  dotted,
}: ArrowLineProps) {
  const dash = dashed ? "4,3" : dotted ? "2,4" : undefined;
  return (
    <>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={width}
        strokeDasharray={dash}
      />
      <circle cx={x2} cy={y2} r={4} fill={color} />
    </>
  );
}

/* ────────────────────────────────────────────────────────────
   COMPONENT CHÍNH
   ──────────────────────────────────────────────────────────── */

export default function VectorsAndMatricesTopic() {
  /* ── Panel 1: kéo đầu vector, xem dot / cosine ── */
  const [vecA, setVecA] = useState<[number, number]>([2, 1]);
  const [vecB, setVecB] = useState<[number, number]>([1, 2]);
  const [dragging, setDragging] = useState<"a" | "b" | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  /* ── Panel 2: ma trận biến đổi ngôi nhà ── */
  const [matrix, setMatrix] = useState<[number, number, number, number]>([
    1, 0, 0, 1,
  ]);

  /* ── Panel 3: phép cộng vector động ── */
  const [u, setU] = useState<[number, number]>([2, 0]);
  const [vAdd, setVAdd] = useState<[number, number]>([0, 2]);
  const [scalar, setScalar] = useState(1);

  const dot = useMemo(() => dotProduct(vecA, vecB), [vecA, vecB]);
  const cos = useMemo(() => cosineSimilarity(vecA, vecB), [vecA, vecB]);
  const lenA = useMemo(() => vecLength(vecA), [vecA]);
  const lenB = useMemo(() => vecLength(vecB), [vecB]);

  /* ── Các điểm lưới sau khi bị ma trận biến đổi ── */
  const transformedGrid = useMemo(
    () =>
      GRID_POINTS.map((p) => applyMatrix(matrix, p)) as [number, number][],
    [matrix],
  );

  const transformedHouse = useMemo(
    () =>
      HOUSE_SHAPE.map((p) => applyMatrix(matrix, p)) as [number, number][],
    [matrix],
  );

  /* ── Vector tổng u + v ── */
  const sumVec: [number, number] = useMemo(
    () => [u[0] + vAdd[0], u[1] + vAdd[1]],
    [u, vAdd],
  );
  /* ── Vector bị nhân vô hướng ── */
  const scaledU: [number, number] = useMemo(
    () => [u[0] * scalar, u[1] * scalar],
    [u, scalar],
  );

  /* ── Xử lý kéo thả trên SVG panel 1 ── */
  const svgToMath = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return [0, 0] as [number, number];
    const rect = svg.getBoundingClientRect();
    const scaleX = VW / rect.width;
    const scaleY = VH / rect.height;
    const svgX = (e.clientX - rect.left) * scaleX;
    const svgY = (e.clientY - rect.top) * scaleY;
    const mathX = (svgX - V_CX) / V_SCALE;
    const mathY = (V_CY - svgY) / V_SCALE;
    return clampVec(mathX, mathY, 3);
  }, []);

  const handleDown = useCallback(
    (which: "a" | "b") => (e: React.MouseEvent) => {
      e.preventDefault();
      setDragging(which);
    },
    [],
  );

  const handleMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!dragging) return;
      const [mx, my] = svgToMath(e);
      if (dragging === "a") setVecA([mx, my]);
      else setVecB([mx, my]);
    },
    [dragging, svgToMath],
  );

  const handleUp = useCallback(() => setDragging(null), []);

  /* ── Helper chuyển toạ độ vector panel 1 ── */
  const toVX = useCallback((x: number) => V_CX + x * V_SCALE, []);
  const toVY = useCallback((y: number) => V_CY - y * V_SCALE, []);
  /* ── Helper panel 2 ── */
  const toMX = useCallback((x: number) => M_CX + x * M_SCALE, []);
  const toMY = useCallback((y: number) => M_CY - y * M_SCALE, []);

  /* ── Preset cho ma trận ── */
  const applyPreset = useCallback(
    (preset: "identity" | "rotate" | "scale" | "shear" | "flip") => {
      switch (preset) {
        case "identity":
          setMatrix([1, 0, 0, 1]);
          break;
        case "rotate":
          setMatrix([
            parseFloat(Math.cos(Math.PI / 6).toFixed(2)),
            parseFloat((-Math.sin(Math.PI / 6)).toFixed(2)),
            parseFloat(Math.sin(Math.PI / 6).toFixed(2)),
            parseFloat(Math.cos(Math.PI / 6).toFixed(2)),
          ]);
          break;
        case "scale":
          setMatrix([1.5, 0, 0, 0.6]);
          break;
        case "shear":
          setMatrix([1, 0.8, 0, 1]);
          break;
        case "flip":
          setMatrix([-1, 0, 0, 1]);
          break;
      }
    },
    [],
  );

  /* Cosine label cho người học */
  const cosLabel =
    cos > 0.8
      ? "Gần như cùng hướng"
      : cos > 0.3
        ? "Hơi cùng hướng"
        : cos > -0.3
          ? "Gần như vuông góc"
          : cos > -0.8
            ? "Hơi ngược hướng"
            : "Gần như ngược hướng";

  const cosColor =
    cos > 0.6
      ? "#10b981"
      : cos > 0.2
        ? "#3b82f6"
        : cos > -0.2
          ? "#6b7280"
          : cos > -0.6
            ? "#f59e0b"
            : "#ef4444";

  /* Lựa chọn preset đang hoạt động */
  const activePreset = useMemo(() => {
    const [a, b, c, d] = matrix;
    if (a === 1 && b === 0 && c === 0 && d === 1) return "identity";
    if (a === 1.5 && b === 0 && c === 0 && d === 0.6) return "scale";
    if (a === 1 && b === 0.8 && c === 0 && d === 1) return "shear";
    if (a === -1 && b === 0 && c === 0 && d === 1) return "flip";
    if (Math.abs(a - 0.87) < 0.02 && Math.abs(b + 0.5) < 0.02) return "rotate";
    return null;
  }, [matrix]);

  return (
    <>
      {/* ━━━ BƯỚC 1 — DỰ ĐOÁN ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử đoán">
        <PredictionGate
          question="Bạn có một mũi tên chỉ về phía đông bắc. Bạn nhân nó với một 'bảng số' 2x2. Chuyện gì CÓ THỂ xảy ra với mũi tên?"
          options={[
            "Mũi tên bị xoá khỏi mặt phẳng",
            "Mũi tên chỉ có thể bị kéo dài hoặc rút ngắn theo đúng hướng cũ",
            "Mũi tên có thể xoay, co giãn, lật, nghiêng — hầu như mọi phép biến đổi hình học",
            "Mũi tên luôn xoay đúng 90 độ, không có chọn lựa khác",
          ]}
          correct={2}
          explanation="Một ma trận 2x2 là một 'bảng số' mô tả một phép biến đổi hình học. Chỉ với 4 con số, nó có thể xoay, kéo dài, lật gương, nghiêng — hoặc pha trộn tất cả cùng lúc. Bài này sẽ giúp bạn thấy từng phép biến đổi ngay trên màn hình."
        >
          <p className="text-sm text-muted mt-4 leading-relaxed">
            Hãy tưởng tượng bạn đang chơi một trò chơi điện tử. Nhân vật của
            bạn là một mũi tên. Bạn có một thẻ phép thuật (ma trận) — chỉ
            cần 4 con số, bạn ra lệnh cho cả thế giới xoay, giãn, hoặc
            nghiêng. Đó chính là cách AI nhìn dữ liệu: mọi thứ là mũi tên,
            mọi phép toán là một bảng số biến đổi mũi tên.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ BƯỚC 2 — HIỂU BẰNG HÌNH ẢNH ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Hiểu bằng hình ảnh">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <ArrowRight size={20} className="text-accent" /> Vector = mũi tên. Ma trận = bảng số biến đổi mũi tên.
          </h3>
          <p className="text-sm text-foreground/85 leading-relaxed">
            <strong>Vector</strong> (véc-tơ) chỉ đơn giản là một{" "}
            <em>mũi tên</em> có gốc tại O và ngọn chỉ về một điểm. Hai con
            số [a, b] cho bạn biết mũi tên đi sang phải bao nhiêu và lên
            trên bao nhiêu. Vậy thôi. Không có gì phức tạp.
          </p>
          <p className="text-sm text-foreground/85 leading-relaxed">
            <strong>Ma trận 2x2</strong> là một bảng 4 ô số. Nhưng đừng
            nghĩ nó là &ldquo;bốn con số rời rạc&rdquo;. Hãy nghĩ nó như một{" "}
            <strong>chiếc máy biến hình</strong>: bỏ một mũi tên vào, mũi
            tên kia chui ra — có thể bị xoay, kéo dài, lật gương, hay
            nghiêng đi. Bài này chúng ta sẽ chơi với cái máy đó.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <div className="rounded-xl border border-sky-200 bg-sky-50 dark:bg-sky-900/20 dark:border-sky-800 p-4 space-y-1">
              <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300">
                <Move size={16} />
                <span className="text-sm font-semibold">Vector</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Một mũi tên. Hai số: sang phải bao nhiêu, lên trên bao
                nhiêu.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-4 space-y-1">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <Maximize2 size={16} />
                <span className="text-sm font-semibold">Ma trận</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Bảng số 2x2. Một máy biến hình — bỏ mũi tên vào, mũi tên
                khác ra.
              </p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4 space-y-1">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <Sparkles size={16} />
                <span className="text-sm font-semibold">AI</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Dữ liệu là mũi tên. Mô hình là chuỗi ma trận biến đổi mũi
                tên từ đầu vào sang câu trả lời.
              </p>
            </div>
          </div>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 3 — KHÁM PHÁ (VISUALIZATION) ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <div className="space-y-10">
            {/* ── PANEL 1: Kéo hai vector, xem tích vô hướng ── */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground">
                Sân chơi 1: Kéo hai mũi tên, xem chúng &ldquo;đồng ý&rdquo; đến đâu
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                Kéo đầu mũi tên xanh (a) hoặc đỏ (b). Thanh &ldquo;tích vô
                hướng&rdquo; cho bạn biết hai mũi tên đang chỉ cùng hướng
                (số dương), vuông góc (bằng 0), hay ngược hướng (số âm).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-border bg-surface p-2 flex items-center justify-center">
                  <svg
                    ref={svgRef}
                    viewBox={`0 0 ${VW} ${VH}`}
                    className="w-full max-w-[360px] cursor-crosshair select-none touch-none"
                    aria-label="Kéo đầu hai mũi tên để khám phá tích vô hướng"
                    onMouseMove={handleMove}
                    onMouseUp={handleUp}
                    onMouseLeave={handleUp}
                  >
                    {/* Lưới mờ */}
                    {[-3, -2, -1, 0, 1, 2, 3].map((v) => (
                      <g key={`g-${v}`}>
                        <line
                          x1={toVX(v)}
                          y1={toVY(-3)}
                          x2={toVX(v)}
                          y2={toVY(3)}
                          stroke="currentColor"
                          className="text-border"
                          strokeWidth="0.5"
                          strokeDasharray={v === 0 ? "none" : "3,3"}
                        />
                        <line
                          x1={toVX(-3)}
                          y1={toVY(v)}
                          x2={toVX(3)}
                          y2={toVY(v)}
                          stroke="currentColor"
                          className="text-border"
                          strokeWidth="0.5"
                          strokeDasharray={v === 0 ? "none" : "3,3"}
                        />
                      </g>
                    ))}

                    {/* Trục */}
                    <line
                      x1={toVX(-3)}
                      y1={toVY(0)}
                      x2={toVX(3)}
                      y2={toVY(0)}
                      stroke="currentColor"
                      className="text-foreground/70"
                      strokeWidth="1.5"
                    />
                    <line
                      x1={toVX(0)}
                      y1={toVY(-3)}
                      x2={toVX(0)}
                      y2={toVY(3)}
                      stroke="currentColor"
                      className="text-foreground/70"
                      strokeWidth="1.5"
                    />

                    <defs>
                      <marker
                        id="vm-arrow-a"
                        viewBox="0 0 10 10"
                        refX="9"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#3B82F6" />
                      </marker>
                      <marker
                        id="vm-arrow-b"
                        viewBox="0 0 10 10"
                        refX="9"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#EF4444" />
                      </marker>
                    </defs>

                    {/* Mũi tên a */}
                    <line
                      x1={toVX(0)}
                      y1={toVY(0)}
                      x2={toVX(vecA[0])}
                      y2={toVY(vecA[1])}
                      stroke="#3B82F6"
                      strokeWidth="2.5"
                      markerEnd="url(#vm-arrow-a)"
                    />
                    <circle
                      cx={toVX(vecA[0])}
                      cy={toVY(vecA[1])}
                      r="9"
                      fill="#3B82F6"
                      fillOpacity="0.3"
                      stroke="#3B82F6"
                      strokeWidth="2"
                      className="cursor-grab active:cursor-grabbing"
                      onMouseDown={handleDown("a")}
                    />
                    <text
                      x={toVX(vecA[0]) + 10}
                      y={toVY(vecA[1]) - 8}
                      fontSize="13"
                      fontWeight="bold"
                      fill="#3B82F6"
                    >
                      a
                    </text>

                    {/* Mũi tên b */}
                    <line
                      x1={toVX(0)}
                      y1={toVY(0)}
                      x2={toVX(vecB[0])}
                      y2={toVY(vecB[1])}
                      stroke="#EF4444"
                      strokeWidth="2.5"
                      markerEnd="url(#vm-arrow-b)"
                    />
                    <circle
                      cx={toVX(vecB[0])}
                      cy={toVY(vecB[1])}
                      r="9"
                      fill="#EF4444"
                      fillOpacity="0.3"
                      stroke="#EF4444"
                      strokeWidth="2"
                      className="cursor-grab active:cursor-grabbing"
                      onMouseDown={handleDown("b")}
                    />
                    <text
                      x={toVX(vecB[0]) + 10}
                      y={toVY(vecB[1]) - 8}
                      fontSize="13"
                      fontWeight="bold"
                      fill="#EF4444"
                    >
                      b
                    </text>
                  </svg>
                </div>

                {/* Chỉ số bên cạnh */}
                <div className="space-y-3">
                  <div className="rounded-lg border border-border bg-surface p-3 space-y-2">
                    <div className="text-xs text-muted">Thành phần hiện tại</div>
                    <div className="text-sm">
                      <span className="font-semibold text-blue-500">a</span> = [
                      <span className="font-mono">{vecA[0].toFixed(1)}</span>,{" "}
                      <span className="font-mono">{vecA[1].toFixed(1)}</span>]
                      <span className="ml-2 text-tertiary">
                        độ dài {lenA.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="font-semibold text-red-500">b</span> = [
                      <span className="font-mono">{vecB[0].toFixed(1)}</span>,{" "}
                      <span className="font-mono">{vecB[1].toFixed(1)}</span>]
                      <span className="ml-2 text-tertiary">
                        độ dài {lenB.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-surface p-3 space-y-3">
                    <div>
                      <div className="text-xs text-muted mb-1">
                        Tích vô hướng a · b
                      </div>
                      <div className="font-mono text-sm font-bold text-foreground">
                        {vecA[0].toFixed(1)} × {vecB[0].toFixed(1)} +{" "}
                        {vecA[1].toFixed(1)} × {vecB[1].toFixed(1)} ={" "}
                        <span style={{ color: cosColor }}>
                          {dot.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <hr className="border-border" />
                    <div>
                      <div className="text-xs text-muted mb-1">
                        Độ tương đồng cosine
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className="font-mono text-lg font-bold"
                          style={{ color: cosColor }}
                        >
                          {cos.toFixed(2)}
                        </span>
                        <span
                          className="text-xs font-semibold"
                          style={{ color: cosColor }}
                        >
                          {cosLabel}
                        </span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-surface-hover overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-150"
                          style={{
                            width: `${((cos + 1) / 2) * 100}%`,
                            background: cosColor,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-tertiary mt-1">
                        <span>-1 ngược</span>
                        <span>0 vuông góc</span>
                        <span>+1 cùng hướng</span>
                      </div>
                    </div>
                  </div>

                  <Callout variant="tip" title="Thử nhanh">
                    Kéo hai mũi tên sao cho chúng chỉ cùng một hướng — bạn
                    sẽ thấy cosine gần +1. Kéo chúng vuông góc — cosine
                    rơi về 0. Ngược hướng — cosine rơi về -1.
                  </Callout>
                </div>
              </div>
            </div>

            <hr className="border-border" />

            {/* ── PANEL 2: Ma trận biến đổi ngôi nhà ── */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground">
                Sân chơi 2: Ngôi nhà nhỏ và cái máy biến hình 2x2
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                Đây là một ngôi nhà nhỏ làm từ 5 điểm. Gõ 4 con số vào ma
                trận, hoặc bấm nút preset, rồi xem ngôi nhà và lưới nền
                biến đổi tức thì. Mỗi con số bạn gõ kéo cả không gian.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
                    <div className="text-xs text-muted text-center">
                      Ma trận biến đổi M
                    </div>
                    <Mini2x2Editor matrix={matrix} onChange={setMatrix} />
                    <p className="text-[11px] text-tertiary text-center italic">
                      Hai cột của ma trận chính là nơi vector đơn vị e
                      <sub>1</sub> và e<sub>2</sub> sẽ bay đến sau phép
                      biến đổi.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted uppercase tracking-wide">
                      Hoặc thử một preset
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          {
                            key: "identity",
                            label: "Đơn vị (giữ nguyên)",
                            icon: Target,
                          },
                          {
                            key: "rotate",
                            label: "Xoay 30°",
                            icon: RotateCw,
                          },
                          {
                            key: "scale",
                            label: "Co giãn",
                            icon: Maximize2,
                          },
                          {
                            key: "shear",
                            label: "Nghiêng",
                            icon: Scissors,
                          },
                          {
                            key: "flip",
                            label: "Lật gương ngang",
                            icon: Move,
                          },
                        ] as const
                      ).map((p) => {
                        const Icon = p.icon;
                        const active = activePreset === p.key;
                        return (
                          <button
                            key={p.key}
                            type="button"
                            onClick={() => applyPreset(p.key)}
                            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium border transition-colors ${
                              active
                                ? "border-accent bg-accent-light text-accent-dark"
                                : "border-border text-foreground hover:bg-surface-hover"
                            }`}
                          >
                            <Icon size={13} />
                            {p.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-surface p-2 flex items-center justify-center">
                  <svg
                    viewBox={`0 0 ${MW} ${MH}`}
                    className="w-full max-w-[360px]"
                    aria-label="Ngôi nhà bị ma trận biến đổi"
                  >
                    {/* Trục */}
                    <line
                      x1={toMX(-4)}
                      y1={toMY(0)}
                      x2={toMX(4)}
                      y2={toMY(0)}
                      stroke="currentColor"
                      className="text-border"
                      strokeWidth="1"
                    />
                    <line
                      x1={toMX(0)}
                      y1={toMY(-4)}
                      x2={toMX(0)}
                      y2={toMY(4)}
                      stroke="currentColor"
                      className="text-border"
                      strokeWidth="1"
                    />

                    {/* Lưới gốc mờ */}
                    {GRID_POINTS.map(([x, y], i) => (
                      <circle
                        key={`og-${i}`}
                        cx={toMX(x)}
                        cy={toMY(y)}
                        r="2"
                        fill="currentColor"
                        className="text-foreground/15"
                      />
                    ))}

                    {/* Đường kết nối */}
                    {GRID_POINTS.map(([x, y], i) => {
                      const [tx, ty] = transformedGrid[i];
                      return (
                        <line
                          key={`ln-${i}`}
                          x1={toMX(x)}
                          y1={toMY(y)}
                          x2={toMX(tx)}
                          y2={toMY(ty)}
                          stroke="currentColor"
                          className="text-accent/20"
                          strokeWidth="0.5"
                        />
                      );
                    })}

                    {/* Điểm lưới đã biến đổi */}
                    {transformedGrid.map(([tx, ty], i) => (
                      <circle
                        key={`tg-${i}`}
                        cx={toMX(tx)}
                        cy={toMY(ty)}
                        r="3"
                        fill="currentColor"
                        className="text-accent/50"
                      />
                    ))}

                    {/* Ngôi nhà gốc (mờ) */}
                    <polyline
                      points={HOUSE_SHAPE.map(
                        ([x, y]) => `${toMX(x)},${toMY(y)}`,
                      ).join(" ")}
                      fill="currentColor"
                      className="text-foreground/10"
                      stroke="currentColor"
                      strokeWidth="1"
                    />

                    {/* Ngôi nhà sau biến đổi */}
                    <polyline
                      points={transformedHouse
                        .map(([x, y]) => `${toMX(x)},${toMY(y)}`)
                        .join(" ")}
                      fill="#3b82f6"
                      fillOpacity="0.2"
                      stroke="#3b82f6"
                      strokeWidth="2"
                    />

                    {/* Vector cơ sở e1 mới (cột 1 của ma trận) */}
                    <line
                      x1={toMX(0)}
                      y1={toMY(0)}
                      x2={toMX(matrix[0])}
                      y2={toMY(matrix[2])}
                      stroke="#3B82F6"
                      strokeWidth="2.2"
                      strokeDasharray="5,3"
                    />
                    <text
                      x={toMX(matrix[0]) + 4}
                      y={toMY(matrix[2]) - 4}
                      fontSize="11"
                      fill="#3B82F6"
                      fontWeight="bold"
                    >
                      e₁
                    </text>

                    {/* Vector cơ sở e2 mới (cột 2) */}
                    <line
                      x1={toMX(0)}
                      y1={toMY(0)}
                      x2={toMX(matrix[1])}
                      y2={toMY(matrix[3])}
                      stroke="#EF4444"
                      strokeWidth="2.2"
                      strokeDasharray="5,3"
                    />
                    <text
                      x={toMX(matrix[1]) + 4}
                      y={toMY(matrix[3]) - 4}
                      fontSize="11"
                      fill="#EF4444"
                      fontWeight="bold"
                    >
                      e₂
                    </text>
                  </svg>
                </div>
              </div>

              <Callout variant="insight" title="Mẹo đọc ma trận">
                Cột thứ nhất của ma trận (a, c) cho biết vector (1, 0) sẽ
                bay đến đâu. Cột thứ hai (b, d) cho biết vector (0, 1) sẽ
                bay đến đâu. Biết hai cột là biết mọi thứ — vì mọi vector
                khác đều là tổ hợp của hai cột ấy.
              </Callout>
            </div>

            <hr className="border-border" />

            {/* ── PANEL 3: Cộng vector và nhân vô hướng ── */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground">
                Sân chơi 3: Cộng hai vector và nhân với một số
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                Dùng thanh trượt để điều chỉnh u, v và hằng số nhân. Xem
                mũi tên tổng u + v đi theo &ldquo;quy tắc đầu-đuôi&rdquo;:
                đặt đuôi của v vào ngọn của u, vẽ từ gốc tới ngọn cuối.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
                  {(
                    [
                      { label: "u · trục x", color: "blue", val: u[0], set: (n: number) => setU([n, u[1]]) },
                      { label: "u · trục y", color: "blue", val: u[1], set: (n: number) => setU([u[0], n]) },
                      { label: "v · trục x", color: "red", val: vAdd[0], set: (n: number) => setVAdd([n, vAdd[1]]) },
                      { label: "v · trục y", color: "red", val: vAdd[1], set: (n: number) => setVAdd([vAdd[0], n]) },
                    ] as const
                  ).map((s) => (
                    <div key={s.label}>
                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={`font-semibold ${s.color === "blue" ? "text-blue-500" : "text-red-500"}`}
                        >
                          {s.label}
                        </span>
                        <span className="font-mono">{s.val.toFixed(1)}</span>
                      </div>
                      <input
                        type="range"
                        min={-2.5}
                        max={2.5}
                        step={0.1}
                        value={s.val}
                        onChange={(e) => s.set(parseFloat(e.target.value))}
                        className={`w-full ${s.color === "blue" ? "accent-blue-500" : "accent-red-500"}`}
                      />
                    </div>
                  ))}
                  <hr className="border-border" />
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-600 font-semibold">
                        Nhân u với hằng số k
                      </span>
                      <span className="font-mono">{scalar.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min={-2}
                      max={2}
                      step={0.1}
                      value={scalar}
                      onChange={(e) => setScalar(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                    <p className="text-[11px] text-tertiary italic mt-1">
                      k âm lật ngược. k = 0 co về gốc. k &gt; 1 kéo dài.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-surface p-2 flex items-center justify-center">
                  <svg viewBox="0 0 320 280" className="w-full max-w-[320px]">
                    {/* Lưới mờ */}
                    {[-3, -2, -1, 0, 1, 2, 3].map((v) => (
                      <g key={`g2-${v}`}>
                        <line
                          x1={160 + v * 40}
                          y1={20}
                          x2={160 + v * 40}
                          y2={260}
                          stroke="currentColor"
                          className="text-border"
                          strokeWidth="0.4"
                          strokeDasharray={v === 0 ? "none" : "3,3"}
                        />
                        <line
                          x1={20}
                          y1={140 - v * 40}
                          x2={300}
                          y2={140 - v * 40}
                          stroke="currentColor"
                          className="text-border"
                          strokeWidth="0.4"
                          strokeDasharray={v === 0 ? "none" : "3,3"}
                        />
                      </g>
                    ))}
                    <line
                      x1={20}
                      y1={140}
                      x2={300}
                      y2={140}
                      stroke="currentColor"
                      className="text-foreground/70"
                      strokeWidth="1.2"
                    />
                    <line
                      x1={160}
                      y1={20}
                      x2={160}
                      y2={260}
                      stroke="currentColor"
                      className="text-foreground/70"
                      strokeWidth="1.2"
                    />

                    {/* u từ gốc */}
                    <ArrowLine
                      x1={160}
                      y1={140}
                      x2={160 + u[0] * 40}
                      y2={140 - u[1] * 40}
                      color="#3B82F6"
                    />
                    {/* v đặt ở ngọn của u */}
                    <ArrowLine
                      x1={160 + u[0] * 40}
                      y1={140 - u[1] * 40}
                      x2={160 + (u[0] + vAdd[0]) * 40}
                      y2={140 - (u[1] + vAdd[1]) * 40}
                      color="#EF4444"
                      dashed
                    />
                    {/* tổng từ gốc */}
                    <ArrowLine
                      x1={160}
                      y1={140}
                      x2={160 + sumVec[0] * 40}
                      y2={140 - sumVec[1] * 40}
                      color="#10b981"
                      width={2.5}
                    />
                    {/* k*u */}
                    <ArrowLine
                      x1={160}
                      y1={140}
                      x2={160 + scaledU[0] * 40}
                      y2={140 - scaledU[1] * 40}
                      color="#8b5cf6"
                      dotted
                    />

                    <text x={28} y={34} fontSize="10" fill="#3B82F6">
                      u (xanh)
                    </text>
                    <text x={28} y={48} fontSize="10" fill="#EF4444">
                      v (đỏ, đặt ở ngọn u)
                    </text>
                    <text x={28} y={62} fontSize="10" fill="#10b981">
                      u + v (xanh lá)
                    </text>
                    <text x={28} y={76} fontSize="10" fill="#8b5cf6">
                      {scalar.toFixed(1)} · u (tím)
                    </text>
                  </svg>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface/40 p-4">
                <p className="text-sm text-foreground/85">
                  <strong>Quy tắc cộng vector:</strong> [a, b] + [c, d] =
                  [a + c, b + d]. Cộng từng chiều độc lập. Hiện tại: u + v
                  = [{u[0].toFixed(1)} + {vAdd[0].toFixed(1)},{" "}
                  {u[1].toFixed(1)} + {vAdd[1].toFixed(1)}] = [
                  {sumVec[0].toFixed(1)}, {sumVec[1].toFixed(1)}].
                </p>
              </div>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 4 — ĐI SÂU (STEP REVEAL) ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Đi sâu">
        <p className="text-sm text-muted mb-4 leading-relaxed">
          Chúng ta đã thấy 3 thao tác cơ bản: cộng vector, nhân vô hướng,
          tích vô hướng. Giờ hãy tách ra từng bước để hiểu kỹ.
        </p>

        <StepReveal
          labels={[
            "Bước 1: Cộng vector",
            "Bước 2: Nhân vô hướng",
            "Bước 3: Tích vô hướng",
            "Bước 4: Ma trận = ghép nhiều phép biến đổi",
          ]}
        >
          {[
            <div
              key="s1"
              className="rounded-lg bg-surface/60 border border-border p-4 space-y-2"
            >
              <p className="text-sm text-foreground leading-relaxed">
                <strong>Cộng vector = cộng từng thành phần.</strong> Ví dụ:
                [2, 1] + [1, 3] = [2+1, 1+3] = [3, 4]. Hình học: đặt đuôi
                của vector thứ hai vào ngọn của vector thứ nhất, vẽ mũi
                tên từ gốc tới ngọn cuối.
              </p>
              <div className="flex items-center justify-center gap-6 text-sm mt-2">
                <div className="text-blue-500 font-mono">[2, 1]</div>
                <span className="text-muted">+</span>
                <div className="text-red-500 font-mono">[1, 3]</div>
                <span className="text-muted">=</span>
                <div className="text-emerald-600 font-mono font-bold">
                  [3, 4]
                </div>
              </div>
              <p className="text-xs text-muted italic">
                Ứng dụng: khi bạn di chuyển trong game, mỗi frame cộng
                vector vận tốc vào vị trí hiện tại — đó chính là phép cộng
                vector.
              </p>
            </div>,

            <div
              key="s2"
              className="rounded-lg bg-surface/60 border border-border p-4 space-y-2"
            >
              <p className="text-sm text-foreground leading-relaxed">
                <strong>Nhân với số k = kéo dài hoặc rút ngắn mũi tên.</strong>{" "}
                k · [a, b] = [k·a, k·b]. Nếu k dương, hướng giữ nguyên. k
                âm, mũi tên lật ngược. k = 0, mũi tên co về gốc.
              </p>
              <div className="flex items-center justify-center gap-6 text-sm mt-2">
                <div className="font-mono text-tertiary">2 ·</div>
                <div className="text-blue-500 font-mono">[3, 4]</div>
                <span className="text-muted">=</span>
                <div className="text-emerald-600 font-mono font-bold">
                  [6, 8]
                </div>
              </div>
              <p className="text-xs text-muted italic">
                Ứng dụng: chỉnh độ sáng ảnh (nhân tất cả pixel với 1.2 →
                sáng lên 20%) chính là nhân vô hướng một vector pixel.
              </p>
            </div>,

            <div
              key="s3"
              className="rounded-lg bg-surface/60 border border-border p-4 space-y-2"
            >
              <p className="text-sm text-foreground leading-relaxed">
                <strong>Tích vô hướng = nhân từng cặp rồi cộng.</strong>{" "}
                [a, b] · [c, d] = a·c + b·d. Một con số duy nhất, nói cho
                bạn biết hai mũi tên &ldquo;đồng ý&rdquo; đến đâu.
              </p>
              <div className="flex items-center justify-center gap-4 text-sm mt-2">
                <div className="text-blue-500 font-mono">[2, 3]</div>
                <span className="text-muted">·</span>
                <div className="text-red-500 font-mono">[4, 1]</div>
                <span className="text-muted">=</span>
                <span className="font-mono">2·4 + 3·1</span>
                <span className="text-muted">=</span>
                <div className="text-emerald-600 font-mono font-bold">11</div>
              </div>
              <p className="text-xs text-muted italic">
                Ứng dụng: trong cơ chế Attention của ChatGPT, mỗi từ hỏi
                các từ khác thông qua tích vô hướng — số càng lớn, từ đó
                càng liên quan.
              </p>
            </div>,

            <div
              key="s4"
              className="rounded-lg bg-surface/60 border border-border p-4 space-y-2"
            >
              <p className="text-sm text-foreground leading-relaxed">
                <strong>Ma trận 2x2 = gói gọn một phép biến đổi.</strong>{" "}
                Một ma trận chứa 4 con số, nhưng nó mô tả một phép biến
                đổi duy nhất cho cả mặt phẳng: xoay, kéo giãn, lật, nghiêng,
                hoặc pha trộn. Nhân ma trận với vector = áp phép biến đổi
                đó lên vector.
              </p>
              <div className="text-sm text-center mt-2">
                <div className="inline-flex items-center gap-3">
                  <span className="font-mono text-blue-500">
                    [[2, 0], [0, 2]]
                  </span>
                  <span>·</span>
                  <span className="font-mono text-red-500">[3, 4]</span>
                  <span>=</span>
                  <span className="font-mono text-emerald-600 font-bold">
                    [6, 8]
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted italic">
                Ứng dụng: Photoshop xoay ảnh 30° = nhân mỗi pixel với ma
                trận xoay. Mạng nơ-ron xử lý câu = nhân vector câu với
                chuỗi ma trận trọng số.
              </p>
            </div>,
          ]}
        </StepReveal>
      </LessonSection>

      {/* ━━━ BƯỚC 5 — AHA + THỬ THÁCH ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Aha và thử thách">
        <AhaMoment>
          Mỗi mô hình AI mà bạn biết — ChatGPT, Google Photos, Spotify —
          bên trong chỉ là chuỗi các <strong>ma trận</strong> nhân với{" "}
          <strong>vector</strong>. Dữ liệu (ảnh, từ, bài hát) biến thành
          vector. Mô hình là hàng trăm ma trận nối tiếp. Kết quả là một
          vector mới, ta đọc ra câu trả lời. Toàn bộ AI hiện đại, chỉ dùng
          hai ý tưởng này.
        </AhaMoment>

        <div className="mt-5 space-y-4">
          <InlineChallenge
            question="Bạn có vector u = [3, 4] và muốn tính 2·u. Đáp án là?"
            options={["[3, 4]", "[6, 8]", "[5, 6]", "[3, 8]"]}
            correct={1}
            explanation="Nhân vô hướng: 2·[3, 4] = [2·3, 2·4] = [6, 8]. Mỗi thành phần nhân với 2."
          />

          <InlineChallenge
            question="Trước khi kéo thử: ma trận M = [[0, -1], [1, 0]] nhân với vector [1, 0] sẽ ra gì? (Gợi ý: cột 1 của M cho biết [1, 0] bay đến đâu.)"
            options={["[0, 1]", "[1, 0]", "[-1, 0]", "[0, -1]"]}
            correct={0}
            explanation="Cột 1 của M là [0, 1] (phần tử hàng 1 cột 1 = 0, hàng 2 cột 1 = 1). Đó là nơi [1, 0] bay đến. Nhớ thêm: ma trận này xoay mọi vector 90° ngược chiều kim đồng hồ."
          />

          <InlineChallenge
            question="Hai vector [3, 0] và [0, 5] có tích vô hướng bằng bao nhiêu? Và chúng tạo với nhau góc gì?"
            options={[
              "Bằng 15, góc nhọn",
              "Bằng 0, góc vuông",
              "Bằng 8, hướng cùng nhau",
              "Bằng -5, ngược hướng",
            ]}
            correct={1}
            explanation="Tích vô hướng = 3·0 + 0·5 = 0. Đây là dấu hiệu chắc chắn của hai vector vuông góc. [3, 0] chỉ sang phải, [0, 5] chỉ lên trên — vuông góc với nhau."
          />
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 6 — GIẢI THÍCH ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích">
        <ExplanationSection topicSlug={metadata.slug}>
          <p className="leading-relaxed">
            Bây giờ bạn đã <em>thấy</em> vector và ma trận hoạt động ra
            sao. Phần này đóng gói lại thành ngôn ngữ toán — nhưng luôn
            kèm hình dung, để con số không biến lại thành mớ rối.
          </p>

          <h4 className="text-sm font-semibold text-foreground mt-5 mb-2">
            Công thức tích vô hướng (một trong hai công thức duy nhất của
            bài)
          </h4>
          <LaTeX block>
            {String.raw`\vec{a} \cdot \vec{b} = a_1 b_1 + a_2 b_2`}
          </LaTeX>
          <p className="text-sm leading-relaxed">
            Nói bằng tiếng Việt: &ldquo;nhân cặp đầu, nhân cặp sau, cộng
            hai tích lại&rdquo;. Kết quả là một con số duy nhất cho biết
            hai mũi tên đang đồng ý (dương lớn), vuông góc (bằng 0), hay
            phản đối (âm).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-3">
              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1">
                Tích vô hướng &gt; 0
              </div>
              <p className="text-xs text-foreground/80">
                Hai mũi tên cùng hướng. Spotify gợi ý: hai bài hát giống
                nhau.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 dark:bg-slate-900/20 dark:border-slate-700 p-3">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tích vô hướng = 0
              </div>
              <p className="text-xs text-foreground/80">
                Vuông góc. Không liên quan nhau. Chẳng nói gì được về
                nhau.
              </p>
            </div>
            <div className="rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-800 p-3">
              <div className="text-xs font-semibold text-rose-700 dark:text-rose-300 mb-1">
                Tích vô hướng &lt; 0
              </div>
              <p className="text-xs text-foreground/80">
                Ngược hướng. Ví dụ: &ldquo;thích rock&rdquo; và
                &ldquo;ghét rock&rdquo; là hai vector đối nghịch.
              </p>
            </div>
          </div>

          <h4 className="text-sm font-semibold text-foreground mt-5 mb-2">
            Công thức nhân ma trận với vector (công thức thứ hai, và là
            công thức cuối)
          </h4>
          <LaTeX block>
            {String.raw`\begin{bmatrix} a & b \\ c & d \end{bmatrix} \begin{bmatrix} x \\ y \end{bmatrix} = \begin{bmatrix} ax + by \\ cx + dy \end{bmatrix}`}
          </LaTeX>
          <p className="text-sm leading-relaxed">
            Nói bằng tiếng Việt: &ldquo;thành phần mới = hàng trên chấm
            với vector, hàng dưới chấm với vector&rdquo;. Nói cách khác,
            mỗi thành phần mới là một tích vô hướng. Ma trận thực chất
            chỉ là &ldquo;hai tích vô hướng đóng gói lại&rdquo;.
          </p>

          <Callout variant="insight" title="Nhìn ma trận qua hai cột">
            Một ma trận 2x2 có hai cột. Cột đầu nói cho bạn biết{" "}
            <em>vector (1, 0) bay đến đâu</em>. Cột sau nói cho biết{" "}
            <em>vector (0, 1) bay đến đâu</em>. Và vì mọi vector khác đều
            là tổ hợp của hai vector này, nên biết hai cột = biết toàn bộ
            phép biến đổi. Đó là mẹo đọc ma trận của 3Blue1Brown.
          </Callout>

          <h4 className="text-sm font-semibold text-foreground mt-6 mb-2">
            Bốn ma trận phổ biến
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3">
            {TRANSFORM_CATALOG.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border bg-card p-3 space-y-1"
                style={{ borderLeft: `4px solid ${item.color}` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">
                    {item.label}
                  </span>
                  <span
                    className="font-mono text-xs px-2 py-0.5 rounded-full tabular-nums"
                    style={{
                      backgroundColor: item.color + "22",
                      color: item.color,
                    }}
                  >
                    {item.mat}
                  </span>
                </div>
                <p className="text-xs text-muted leading-snug">{item.desc}</p>
              </div>
            ))}
          </div>

          <Callout variant="tip" title="Ma trận đơn vị — 'không làm gì'">
            Ma trận [[1, 0], [0, 1]] là &ldquo;số 1&rdquo; của thế giới
            ma trận. Nhân vector với nó, vector giữ nguyên. Ma trận này
            xuất hiện nhiều nơi trong AI — ví dụ, mạng nơ-ron có một thủ
            thuật tên là &ldquo;residual connection&rdquo;, về cơ bản là
            cộng thêm một ma trận đơn vị để thông tin không bị mất.
          </Callout>

          <h4 className="text-sm font-semibold text-foreground mt-6 mb-2">
            Từ 2D sang hàng nghìn chiều
          </h4>
          <p className="text-sm leading-relaxed">
            Mọi thứ bạn vừa học ở 2D — vector có 2 số, ma trận có 4 ô —
            mở rộng thẳng lên nhiều chiều. Trong GPT-4, mỗi từ trở thành
            một vector <strong>12.288 chiều</strong>, và các ma trận bên
            trong có kích thước{" "}
            <span className="font-mono">12.288 × 12.288</span>. Quy tắc
            vẫn đúng: nhân từng cặp rồi cộng. Chỉ khác duy nhất ở{" "}
            <em>số lượng</em> — chiều nào cũng &ldquo;gấp hàng nghìn
            lần&rdquo; so với 2D.
          </p>

          <Callout variant="warning" title="GPU = phần cứng nhân ma trận">
            Bạn có bao giờ thắc mắc vì sao NVIDIA trở thành công ty nghìn
            tỉ đô nhờ AI? Vì GPU ban đầu được thiết kế để xử lý đồ hoạ 3D
            — mà 3D chỉ là hàng triệu phép nhân ma trận mỗi giây. Khi AI
            bùng nổ, người ta phát hiện huấn luyện mạng nơ-ron cũng chỉ
            là nhân ma trận liên tục. Cùng một phần cứng, cùng một phép
            toán — chỉ khác mục đích.
          </Callout>

          <CollapsibleDetail title="Vì sao gọi là 'tích vô hướng' mà lại có hướng?">
            <p className="text-sm leading-relaxed">
              Tên gọi hơi gây hiểu nhầm. &ldquo;Vô hướng&rdquo; nghĩa là{" "}
              <em>kết quả</em> là một con số, không có hướng — khác với
              vector. Nhưng để <em>tính</em> tích vô hướng, bạn dùng
              thông tin về hướng của cả hai vector. Có thể gọi cho dễ
              nhớ: &ldquo;phép nhân ra một số, không ra mũi tên&rdquo;.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Vector 3D thì sao?">
            <p className="text-sm leading-relaxed">
              Vector 3D có 3 số: [a, b, c]. Mọi phép toán đều mở rộng
              thẳng: cộng từng cặp, nhân vô hướng mỗi thành phần, tích vô
              hướng cộng 3 tích. Ma trận 3x3 có 9 ô, biến đổi không gian
              3D. Minh hoạ bài này dùng 2D cho dễ nhìn, nhưng mọi quy tắc
              đều giống nhau ở 3D, 100D, hay 10.000D.
            </p>
          </CollapsibleDetail>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 7 — TÓM TẮT + KẾT NỐI ━━━ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Năm điều cần nhớ về vector và ma trận"
          points={[
            "Vector = mũi tên trong không gian. Hai số [a, b] cho biết sang phải bao nhiêu, lên trên bao nhiêu.",
            "Cộng vector = cộng từng cặp thành phần. Nhân với số k = kéo dài hoặc rút ngắn mũi tên k lần.",
            "Tích vô hướng = nhân cặp rồi cộng. Dương: cùng hướng. Bằng 0: vuông góc. Âm: ngược hướng.",
            "Ma trận 2x2 = 4 số gói gọn một phép biến đổi cả không gian. Hai cột cho biết vector cơ sở bay đến đâu.",
            "Mọi mô hình AI (ChatGPT, Spotify, Google Photos) bên trong chỉ là chuỗi ma trận nhân với vector — chỉ khác số chiều.",
          ]}
        />

        <Callout variant="tip" title="Xem ứng dụng thực tế">
          Google Photos dùng toán này để tìm tất cả ảnh bà ngoại trong
          thư viện hàng nghìn tấm, chỉ từ một từ khoá. Xem tiếp:{" "}
          <TopicLink slug="vectors-and-matrices-in-photo-search">
            Vector trong tìm kiếm ảnh
          </TopicLink>
          . Nếu muốn học tiếp về toán, hãy thử{" "}
          <TopicLink slug="eigendecomposition-pca">
            Phân tích thành phần chính (PCA)
          </TopicLink>{" "}
          — cách rút gọn 100 con số xuống còn 2 mà vẫn giữ được câu
          chuyện chính.
        </Callout>
      </LessonSection>

      {/* ━━━ BƯỚC 8 — QUIZ ━━━ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
