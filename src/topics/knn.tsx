"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users,
  MapPin,
  Target,
  RotateCcw,
  Ruler,
  Grid2x2,
  Lightbulb,
} from "lucide-react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
  MiniSummary,
  LessonSection,
  LaTeX,
  TopicLink,
  SliderGroup,
  ToggleCompare,
  StepReveal,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

/* ════════════════════════════════════════════════════════════════════
 * METADATA
 * ════════════════════════════════════════════════════════════════════ */
export const metadata: TopicMeta = {
  slug: "knn",
  title: "K-Nearest Neighbors",
  titleVi: "k láng giềng gần nhất (k-NN)",
  description:
    "Muốn biết một điểm thuộc nhóm nào? Hỏi k láng giềng gần nhất rồi lấy theo đa số. Đơn giản, trực quan — và đủ mạnh để làm nền cho nhiều hệ thống gợi ý.",
  category: "classic-ml",
  tags: ["classification", "supervised-learning", "distance", "lazy-learning"],
  difficulty: "intermediate",
  relatedSlugs: ["k-means", "svm", "logistic-regression", "decision-trees"],
  vizType: "interactive",
};

/* ════════════════════════════════════════════════════════════════════
 * DỮ LIỆU — 3 lớp, 45 điểm, toạ độ [0,400]x[0,320]
 * Ẩn dụ: người trong cùng khu vực ở TP.HCM thường đi chung loại quán ăn
 * ════════════════════════════════════════════════════════════════════ */
type ClassId = "A" | "B" | "C";
type Pt = { x: number; y: number; cls: ClassId };
type DPt = Pt & { d: number };

const DATA: Pt[] = [
  // Cluster A — phía trên bên trái (quán cơm)
  { x: 60, y: 50, cls: "A" },
  { x: 80, y: 80, cls: "A" },
  { x: 100, y: 40, cls: "A" },
  { x: 110, y: 90, cls: "A" },
  { x: 130, y: 60, cls: "A" },
  { x: 50, y: 100, cls: "A" },
  { x: 140, y: 110, cls: "A" },
  { x: 90, y: 120, cls: "A" },
  { x: 150, y: 80, cls: "A" },
  { x: 70, y: 140, cls: "A" },
  { x: 160, y: 50, cls: "A" },
  { x: 120, y: 140, cls: "A" },
  { x: 100, y: 160, cls: "A" },
  { x: 180, y: 90, cls: "A" },
  { x: 175, y: 135, cls: "A" },
  // Cluster B — phía trên bên phải (quán phở)
  { x: 280, y: 50, cls: "B" },
  { x: 300, y: 80, cls: "B" },
  { x: 320, y: 50, cls: "B" },
  { x: 340, y: 90, cls: "B" },
  { x: 290, y: 120, cls: "B" },
  { x: 350, y: 130, cls: "B" },
  { x: 310, y: 140, cls: "B" },
  { x: 360, y: 70, cls: "B" },
  { x: 330, y: 170, cls: "B" },
  { x: 265, y: 90, cls: "B" },
  { x: 375, y: 100, cls: "B" },
  { x: 295, y: 40, cls: "B" },
  { x: 335, y: 40, cls: "B" },
  { x: 370, y: 150, cls: "B" },
  { x: 345, y: 180, cls: "B" },
  // Cluster C — phía dưới giữa (quán bánh mì)
  { x: 170, y: 220, cls: "C" },
  { x: 200, y: 240, cls: "C" },
  { x: 230, y: 220, cls: "C" },
  { x: 190, y: 270, cls: "C" },
  { x: 215, y: 280, cls: "C" },
  { x: 240, y: 260, cls: "C" },
  { x: 170, y: 250, cls: "C" },
  { x: 250, y: 290, cls: "C" },
  { x: 200, y: 295, cls: "C" },
  { x: 260, y: 230, cls: "C" },
  { x: 150, y: 230, cls: "C" },
  { x: 225, y: 250, cls: "C" },
  { x: 180, y: 295, cls: "C" },
  { x: 255, y: 265, cls: "C" },
  { x: 160, y: 280, cls: "C" },
];

const COLOR: Record<ClassId, string> = {
  A: "#ef4444",
  B: "#3b82f6",
  C: "#10b981",
};
const SOFT: Record<ClassId, string> = {
  A: "rgba(239,68,68,0.14)",
  B: "rgba(59,130,246,0.14)",
  C: "rgba(16,185,129,0.14)",
};
const LABEL: Record<ClassId, string> = {
  A: "Cơm tấm (đỏ)",
  B: "Phở (xanh dương)",
  C: "Bánh mì (xanh lá)",
};

const W = 400;
const H = 320;
const GRID = 20;

/* ════════════════════════════════════════════════════════════════════
 * TIỆN ÍCH
 * ════════════════════════════════════════════════════════════════════ */
function euclid(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}
function manhattan(ax: number, ay: number, bx: number, by: number): number {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}
type Metric = "euclid" | "manhattan";

function knn(
  qx: number,
  qy: number,
  k: number,
  metric: Metric,
  data: Pt[] = DATA,
): { label: ClassId; neighbors: DPt[] } {
  const fn = metric === "euclid" ? euclid : manhattan;
  const scored: DPt[] = data.map((p) => ({
    ...p,
    d: fn(qx, qy, p.x, p.y),
  }));
  scored.sort((a, b) => a.d - b.d);
  const top = scored.slice(0, k);
  const count: Record<ClassId, number> = { A: 0, B: 0, C: 0 };
  top.forEach((t) => {
    count[t.cls] += 1;
  });
  let best: ClassId = "A";
  let max = -1;
  (Object.keys(count) as ClassId[]).forEach((c) => {
    if (count[c] > max) {
      best = c;
      max = count[c];
    }
  });
  return { label: best, neighbors: top };
}

/* ════════════════════════════════════════════════════════════════════
 * DEMO 1 — CANVAS TƯƠNG TÁC
 * ════════════════════════════════════════════════════════════════════ */
function KnnPlayground() {
  const [query, setQuery] = useState<{ x: number; y: number }>({
    x: 210,
    y: 170,
  });
  const [k, setK] = useState<number>(5);
  const [showBoundary, setShowBoundary] = useState<boolean>(false);
  const [metric, setMetric] = useState<Metric>("euclid");

  const pred = useMemo(
    () => knn(query.x, query.y, k, metric),
    [query, k, metric],
  );

  const radius = useMemo(() => {
    const last = pred.neighbors[pred.neighbors.length - 1];
    return last?.d ?? 0;
  }, [pred.neighbors]);

  /* Decision boundary grid, tính lại khi k/metric đổi */
  const grid = useMemo(() => {
    if (!showBoundary) return [];
    const cells: { x: number; y: number; cls: ClassId }[] = [];
    for (let x = 0; x < W; x += GRID) {
      for (let y = 0; y < H; y += GRID) {
        const cx = x + GRID / 2;
        const cy = y + GRID / 2;
        cells.push({ x, y, cls: knn(cx, cy, k, metric).label });
      }
    }
    return cells;
  }, [k, metric, showBoundary]);

  const votes = useMemo(() => {
    const c: Record<ClassId, number> = { A: 0, B: 0, C: 0 };
    pred.neighbors.forEach((n) => {
      c[n.cls] += 1;
    });
    return c;
  }, [pred.neighbors]);

  const handleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * W;
      const ny = ((e.clientY - rect.top) / rect.height) * H;
      setQuery({
        x: Math.max(6, Math.min(W - 6, nx)),
        y: Math.max(6, Math.min(H - 6, ny)),
      });
    },
    [],
  );

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface/50 p-3">
        <div className="flex items-center gap-2 min-w-[180px]">
          <span className="text-xs font-medium text-foreground">
            k = <span className="font-mono text-base text-accent">{k}</span>
          </span>
          <input
            type="range"
            min={1}
            max={15}
            step={1}
            value={k}
            onChange={(e) => setK(parseInt(e.target.value))}
            className="flex-1 h-2 rounded-full cursor-pointer accent-accent"
            aria-label="Số hàng xóm k"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={showBoundary}
            onChange={(e) => setShowBoundary(e.target.checked)}
            className="accent-accent"
          />
          Hiện biên quyết định
        </label>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMetric("euclid")}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              metric === "euclid"
                ? "bg-accent text-white border-accent"
                : "border-border bg-card text-muted hover:bg-surface"
            }`}
          >
            Euclid
          </button>
          <button
            type="button"
            onClick={() => setMetric("manhattan")}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              metric === "manhattan"
                ? "bg-accent text-white border-accent"
                : "border-border bg-card text-muted hover:bg-surface"
            }`}
          >
            Manhattan
          </button>
        </div>
        <div className="ml-auto text-[11px] text-muted">
          Click bất kỳ đâu trên canvas để đặt điểm mới
        </div>
      </div>

      {/* Canvas */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full cursor-crosshair touch-none"
          onClick={handleClick}
          role="img"
          aria-label={`Canvas k-NN với k=${k}, dự đoán ${LABEL[pred.label]} (A ${votes.A}, B ${votes.B}, C ${votes.C})`}
        >
          {/* decision boundary */}
          {showBoundary &&
            grid.map((c, i) => (
              <rect
                key={i}
                x={c.x}
                y={c.y}
                width={GRID}
                height={GRID}
                fill={SOFT[c.cls]}
              />
            ))}

          {/* lưới mờ */}
          {Array.from({ length: 9 }).map((_, i) => (
            <line
              key={`v${i}`}
              x1={i * 50}
              y1={0}
              x2={i * 50}
              y2={H}
              stroke="currentColor"
              strokeOpacity={0.05}
            />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1={0}
              y1={i * 50}
              x2={W}
              y2={i * 50}
              stroke="currentColor"
              strokeOpacity={0.05}
            />
          ))}

          {/* đường tròn bao k hàng xóm (Euclid) / vuông (Manhattan) */}
          {metric === "euclid" ? (
            <motion.circle
              cx={query.x}
              cy={query.y}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.35}
              strokeDasharray="6 4"
              strokeWidth={1.4}
              animate={{ r: radius, cx: query.x, cy: query.y }}
              transition={{ type: "spring", stiffness: 220, damping: 25 }}
            />
          ) : (
            <motion.polygon
              points={[
                `${query.x},${query.y - radius}`,
                `${query.x + radius},${query.y}`,
                `${query.x},${query.y + radius}`,
                `${query.x - radius},${query.y}`,
              ].join(" ")}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.35}
              strokeDasharray="6 4"
              strokeWidth={1.4}
            />
          )}

          {/* đường nối query → hàng xóm */}
          {pred.neighbors.map((n, i) => (
            <line
              key={`l${i}`}
              x1={query.x}
              y1={query.y}
              x2={n.x}
              y2={n.y}
              stroke={COLOR[n.cls]}
              strokeOpacity={0.55}
              strokeWidth={1.2}
            />
          ))}

          {/* điểm dữ liệu */}
          {DATA.map((p, i) => {
            const isN = pred.neighbors.some((n) => n.x === p.x && n.y === p.y);
            return (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={isN ? 7 : 5}
                fill={COLOR[p.cls]}
                stroke={isN ? "#fff" : "none"}
                strokeWidth={isN ? 2 : 0}
                opacity={isN ? 1 : 0.85}
              />
            );
          })}

          {/* query */}
          <motion.g
            initial={false}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.3 }}
          >
            <circle
              cx={query.x}
              cy={query.y}
              r={11}
              fill={COLOR[pred.label]}
              stroke="#fff"
              strokeWidth={3}
            />
            <circle cx={query.x} cy={query.y} r={4} fill="#fff" />
          </motion.g>
        </svg>
      </div>

      {/* Thông tin dự đoán */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="rounded-lg border border-border bg-surface/60 p-3">
          <div className="text-[10px] uppercase text-tertiary">Dự đoán</div>
          <div
            className="text-base font-bold"
            style={{ color: COLOR[pred.label] }}
          >
            {LABEL[pred.label]}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface/60 p-3">
          <div className="text-[10px] uppercase text-tertiary">
            Phiếu trong k = {k}
          </div>
          <div className="flex gap-3 mt-1 text-xs">
            {(["A", "B", "C"] as ClassId[]).map((c) => (
              <span key={c} style={{ color: COLOR[c] }}>
                {c}: <strong>{votes[c]}</strong>
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface/60 p-3">
          <div className="text-[10px] uppercase text-tertiary">
            Toạ độ & thước đo
          </div>
          <div className="text-xs font-mono text-foreground">
            ({Math.round(query.x)}, {Math.round(query.y)}) · {metric === "euclid" ? "Euclid" : "Manhattan"}
          </div>
        </div>
      </div>

      {/* Reset */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setQuery({ x: 210, y: 170 });
            setK(5);
            setMetric("euclid");
            setShowBoundary(false);
          }}
          className="text-xs px-3 py-1 rounded-full border border-border text-muted hover:text-foreground"
        >
          <RotateCcw size={11} className="inline mr-1" /> Đặt lại demo
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
 * DEMO 2 — SLIDER k riêng, chỉ hiện boundary
 * ════════════════════════════════════════════════════════════════════ */
function BoundaryOnlyDemo() {
  return (
    <SliderGroup
      title="Biên quyết định mượt ra sao khi thay đổi k?"
      sliders={[
        {
          key: "k",
          label: "k (số hàng xóm hỏi ý kiến)",
          min: 1,
          max: 21,
          step: 2,
          defaultValue: 1,
        },
      ]}
      visualization={(values) => {
        const k = values.k;
        const cells: { x: number; y: number; cls: ClassId }[] = [];
        for (let x = 0; x < W; x += GRID) {
          for (let y = 0; y < H; y += GRID) {
            const cx = x + GRID / 2;
            const cy = y + GRID / 2;
            cells.push({ x, y, cls: knn(cx, cy, k, "euclid").label });
          }
        }
        return (
          <div className="w-full flex flex-col items-center gap-2">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="w-full max-w-[420px]"
              role="img"
              aria-label={`Biên quyết định với k=${k}`}
            >
              {cells.map((c, i) => (
                <rect
                  key={i}
                  x={c.x}
                  y={c.y}
                  width={GRID}
                  height={GRID}
                  fill={SOFT[c.cls]}
                />
              ))}
              {DATA.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={4} fill={COLOR[p.cls]} opacity={0.9} />
              ))}
            </svg>
            <p className="text-[11px] text-muted text-center leading-relaxed">
              k = 1 → biên lởm chởm, nhạy với từng điểm. k = 15–21 → biên mượt, đôi chỗ
              nuốt mất cụm nhỏ.
            </p>
          </div>
        );
      }}
    />
  );
}

/* ════════════════════════════════════════════════════════════════════
 * DEMO 3 — So sánh Euclid vs Manhattan cùng một query
 * ════════════════════════════════════════════════════════════════════ */
function DistanceCompare() {
  const query = { x: 195, y: 170 };
  const k = 5;
  const eucl = knn(query.x, query.y, k, "euclid");
  const manh = knn(query.x, query.y, k, "manhattan");

  function DrawBlock({ res, metric }: { res: typeof eucl; metric: Metric }) {
    const last = res.neighbors[res.neighbors.length - 1];
    const r = last?.d ?? 0;
    return (
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`k-NN ${metric === "euclid" ? "Euclid" : "Manhattan"}`}
      >
        {/* điểm dữ liệu */}
        {DATA.map((p, i) => {
          const isN = res.neighbors.some((n) => n.x === p.x && n.y === p.y);
          return (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={isN ? 6 : 4}
              fill={COLOR[p.cls]}
              stroke={isN ? "#fff" : "none"}
              strokeWidth={isN ? 1.6 : 0}
              opacity={isN ? 1 : 0.75}
            />
          );
        })}
        {/* bao k */}
        {metric === "euclid" ? (
          <circle
            cx={query.x}
            cy={query.y}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.4}
            strokeDasharray="5 3"
            strokeWidth={1.3}
          />
        ) : (
          <polygon
            points={[
              `${query.x},${query.y - r}`,
              `${query.x + r},${query.y}`,
              `${query.x},${query.y + r}`,
              `${query.x - r},${query.y}`,
            ].join(" ")}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.4}
            strokeDasharray="5 3"
            strokeWidth={1.3}
          />
        )}
        {/* đường nối */}
        {res.neighbors.map((n, i) => (
          <line
            key={i}
            x1={query.x}
            y1={query.y}
            x2={n.x}
            y2={n.y}
            stroke={COLOR[n.cls]}
            strokeOpacity={0.6}
            strokeWidth={1.2}
          />
        ))}
        {/* query */}
        <circle
          cx={query.x}
          cy={query.y}
          r={9}
          fill={COLOR[res.label]}
          stroke="#fff"
          strokeWidth={2.5}
        />
      </svg>
    );
  }

  return (
    <ToggleCompare
      labelA="Euclid — đường chim bay"
      labelB="Manhattan — đi theo đường phố"
      description={`Cùng một điểm truy vấn, cùng k=${k}, nhưng hai thước đo khác nhau cho ra hai tập hàng xóm khác nhau. Kết quả: ${LABEL[eucl.label]} (Euclid) vs ${LABEL[manh.label]} (Manhattan).`}
      childA={
        <div>
          <DrawBlock res={eucl} metric="euclid" />
          <p className="text-[11px] text-muted mt-1 text-center">
            Euclid đo khoảng cách đường thẳng — phù hợp khi hai trục có cùng đơn vị và đặc
            trưng liên tục.
          </p>
        </div>
      }
      childB={
        <div>
          <DrawBlock res={manh} metric="manhattan" />
          <p className="text-[11px] text-muted mt-1 text-center">
            Manhattan đo khoảng cách &ldquo;đi theo ô bàn cờ&rdquo; — hữu ích khi trục có
            nghĩa lưới như bản đồ đường phố hay thứ tự rời rạc.
          </p>
        </div>
      }
    />
  );
}

/* ════════════════════════════════════════════════════════════════════
 * QUIZ
 * ════════════════════════════════════════════════════════════════════ */
const QUIZ: QuizQuestion[] = [
  {
    question:
      "Với k-NN, khi tăng k từ 1 lên 15, điều gì thường xảy ra với biên quyết định?",
    options: [
      "Biên càng lởm chởm hơn vì càng nhiều phiếu",
      "Biên mượt hơn và ít nhạy nhiễu — đa số đè được điểm nhiễu cục bộ",
      "Không đổi — k chỉ ảnh hưởng tốc độ",
      "Biên luôn dịch về phía lớp đa số toàn tập",
    ],
    correct: 1,
    explanation:
      "k lớn → mỗi dự đoán bị ảnh hưởng bởi nhiều hàng xóm, nhiễu cục bộ bị trung hoà. Biên mượt ra, bias tăng nhưng variance giảm.",
  },
  {
    question: "Vì sao người ta gọi k-NN là 'thuật toán lười' (lazy learner)?",
    options: [
      "Vì nó chỉ chạy được trên CPU",
      "Vì độ chính xác thấp hơn mọi thuật toán khác",
      "Vì không có bước huấn luyện — 'model' chỉ là tập dữ liệu được giữ lại, mọi tính toán dồn vào lúc dự đoán",
      "Vì nó từ chối học đặc trưng phi tuyến",
    ],
    correct: 2,
    explanation:
      "k-NN không học tham số. Lúc train thực chất chỉ là ghi nhớ dữ liệu; chi phí thật nằm ở lúc dự đoán — phải tính khoảng cách đến từng điểm.",
  },
  {
    type: "fill-blank",
    question:
      "Khoảng cách Euclid giữa hai điểm (x₁, y₁) và (x₂, y₂) bằng √( ({blank})² + (y₁ - y₂)² ).",
    blanks: [{ answer: "x1 - x2", accept: ["x_1 - x_2", "x1-x2", "(x1-x2)"] }],
    explanation:
      "Euclid = căn bậc hai của tổng bình phương hiệu. Với d chiều: √ Σ (xᵢ − yᵢ)². Manhattan thì không bình phương, chỉ lấy tổng giá trị tuyệt đối.",
  },
  {
    question:
      "Bạn chạy k-NN trên dữ liệu y tế có hai đặc trưng: 'tuổi' (0–100) và 'thu nhập' (0–10⁹ VNĐ). Quên chuẩn hoá. Chuyện gì xảy ra?",
    options: [
      "k-NN tự cân bằng thang đo — không sao",
      "Đặc trưng thu nhập chi phối khoảng cách, 'tuổi' gần như bị bỏ qua",
      "Dự đoán luôn ra nhóm có thu nhập cao",
      "Mô hình chậm lại nhưng kết quả không đổi",
    ],
    correct: 1,
    explanation:
      "Khoảng cách Euclid cộng bình phương mọi đặc trưng. Chênh lệch vài tỷ ở thu nhập làm lu mờ chênh lệch vài chục năm ở tuổi. Luôn chuẩn hoá trước khi chạy k-NN (StandardScaler hoặc MinMaxScaler).",
  },
  {
    question: "Khởi điểm hợp lý nhất để chọn k là gì?",
    options: [
      "k = 1 để 'sát' dữ liệu nhất",
      "k = toàn bộ tập để có nhiều phiếu nhất",
      "k ≈ √N rồi tinh chỉnh bằng cross-validation, ưu tiên k lẻ khi có 2 lớp để tránh hoà phiếu",
      "k phải là số nguyên tố",
    ],
    correct: 2,
    explanation:
      "k = 1 nhạy nhiễu (overfit). k bằng N thì mô hình chỉ đoán lớp đa số. Khởi điểm hợp lý là k ≈ √N, rồi dùng k-fold CV để chọn chính xác; k lẻ giúp tránh hoà phiếu khi 2 lớp.",
  },
];

/* ════════════════════════════════════════════════════════════════════
 * COMPONENT CHÍNH
 * ════════════════════════════════════════════════════════════════════ */
export default function KnnTopic() {
  const TOTAL = 8;

  return (
    <>
      {/* ━━━ BƯỚC 1 — HOOK + DỰ ĐOÁN ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL} label="Hook">
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Users size={18} className="text-accent" /> Hỏi 5 người bạn gần nhất
          </h3>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Bạn vừa chuyển đến một khu mới ở Sài Gòn và muốn biết quán nào ngon. Cách
            nhanh nhất: hỏi <strong>5 người bạn ở gần nhất</strong>. Nếu 3/5 bảo &ldquo;cơm
            tấm Bà Sáu&rdquo;, bạn đi cơm tấm Bà Sáu. Không cần nghiên cứu, không cần cân
            đo công thức — chỉ cần hỏi hàng xóm.
          </p>
          <p className="text-sm text-foreground/85 leading-relaxed">
            <strong>k-NN (k láng giềng gần nhất)</strong> hoạt động đúng như vậy. Có một
            điểm mới cần phân loại → tìm k điểm gần nó nhất trong dữ liệu cũ → lấy theo đa
            số. Đơn giản đến không ngờ, nhưng đủ mạnh để làm nền cho nhiều hệ thống gợi ý
            và kiểm tra thực tế.
          </p>
        </div>
        <div className="mt-6">
          <PredictionGate
            question="Một điểm mới cần phân loại. Hỏi 3 hàng xóm gần nhất, nhận được 2 phiếu 'cơm tấm', 1 phiếu 'phở'. k-NN kết luận điểm này là gì?"
            options={[
              "Phở — vì là lớp thiểu số nên đáng chú ý hơn",
              "Cơm tấm — đa số thắng",
              "Không đoán được với k = 3",
              "Lấy trung bình nhãn — một món nằm giữa hai món",
            ]}
            correct={1}
            explanation="k-NN phân loại bằng đa số trong k hàng xóm gần nhất. 2 > 1 → chọn cơm tấm. Đơn giản đến ngạc nhiên — và đó chính là sức mạnh của nó khi dữ liệu có cấu trúc hình học rõ ràng."
          >
            <p className="text-sm text-muted mt-4 leading-relaxed">
              Phần tiếp theo bạn sẽ tự click để đặt &ldquo;điểm mới&rdquo; vào bản đồ, và
              xem k-NN chọn hàng xóm nào, bỏ phiếu ra sao.
            </p>
          </PredictionGate>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 2 — BA THÔNG SỐ QUAN TRỌNG ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL} label="Ba thứ cần hiểu">
        <p className="text-sm text-foreground/85 leading-relaxed">
          k-NN chỉ có ba lựa chọn quan trọng — nắm được ba cái này là bạn hiểu 90% thuật
          toán.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          <div className="rounded-xl border border-sky-200 bg-sky-50/60 dark:bg-sky-900/15 dark:border-sky-800 p-3 space-y-1">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-sky-500" />
              <span className="text-xs font-semibold text-sky-700 dark:text-sky-300">
                1 · Dữ liệu
              </span>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">
              Tập các điểm đã biết nhãn. k-NN không &ldquo;học&rdquo; gì — nó chỉ giữ lại
              toàn bộ tập này.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 dark:bg-emerald-900/15 dark:border-emerald-800 p-3 space-y-1">
            <div className="flex items-center gap-2">
              <Ruler size={14} className="text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                2 · Thước đo khoảng cách
              </span>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">
              Euclid (đường chim bay) là mặc định. Manhattan (đi theo ô bàn cờ) và Cosine
              (đo hướng, dùng cho văn bản) là hai lựa chọn phổ biến khác.
            </p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 dark:bg-amber-900/15 dark:border-amber-800 p-3 space-y-1">
            <div className="flex items-center gap-2">
              <Target size={14} className="text-amber-500" />
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                3 · Số láng giềng k
              </span>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">
              k = 1 → dự đoán cực sát nhưng dễ bị nhiễu. k lớn → mượt nhưng dễ nuốt cụm
              nhỏ. Thông thường k ≈ √N và dùng CV để chọn.
            </p>
          </div>
        </div>
        <Callout variant="insight" title="k-NN không có bước train">
          Khác với hầu hết thuật toán ML, k-NN <strong>không có bước &ldquo;học&rdquo; nào
          cả</strong>. Toàn bộ &ldquo;model&rdquo; của nó chính là tập dữ liệu đã dán
          nhãn. Mọi phép tính được dồn vào lúc dự đoán — đó là lý do k-NN được gọi là{" "}
          <em>&ldquo;lazy learner&rdquo;</em> (thuật toán lười).
        </Callout>
      </LessonSection>

      {/* ━━━ BƯỚC 3 — TRỰC QUAN ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <LessonSection step={1} label="Thử nghiệm 1 · Canvas k-NN">
            <p className="text-sm text-muted leading-relaxed mb-3">
              45 điểm ở ba cụm là ba kiểu quán: <strong>cơm tấm</strong> (đỏ),{" "}
              <strong>phở</strong> (xanh dương), <strong>bánh mì</strong> (xanh lá). Click
              vào canvas để đặt &ldquo;điểm mới&rdquo; — bạn sẽ thấy k láng giềng được nối
              bằng đường màu, và màu điểm truy vấn = dự đoán theo đa số.
            </p>
            <KnnPlayground />
          </LessonSection>

          <LessonSection step={2} label="Thử nghiệm 2 · k nhỏ vs k lớn">
            <p className="text-sm text-muted leading-relaxed mb-3">
              Chỉ kéo thanh k và xem toàn bộ &ldquo;bản đồ quyết định&rdquo; thay đổi theo.
              Để biên mượt ra, tăng k. Để biên &ldquo;sát&rdquo; từng điểm, giảm k.
            </p>
            <BoundaryOnlyDemo />
          </LessonSection>

          <LessonSection step={3} label="Thử nghiệm 3 · Euclid vs Manhattan">
            <p className="text-sm text-muted leading-relaxed mb-3">
              Cùng một điểm truy vấn, cùng k. Nhưng thay thước đo khoảng cách, hàng xóm
              thay đổi → dự đoán có thể khác. Mở cả hai tab để so sánh.
            </p>
            <DistanceCompare />
          </LessonSection>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 4 — AHA ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL} label="Khoảnh khắc hiểu">
        <AhaMoment>
          k-NN <strong>không phải là một thuật toán học</strong>. Nó là một{" "}
          <strong>quy ước bỏ phiếu</strong> đơn giản trên dữ liệu gốc. Tất cả sự khôn
          ngoan nằm ở hai lựa chọn: <em>đo khoảng cách thế nào</em> và <em>k bằng bao
          nhiêu</em>. Đổi một trong hai, bạn có model khác — dù dữ liệu không thay đổi
          một chữ.
        </AhaMoment>
      </LessonSection>

      {/* ━━━ BƯỚC 5 — CHALLENGE ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL} label="Thử thách">
        <InlineChallenge
          question="Bạn có 10 triệu khách hàng trong database. Chạy k-NN để phân loại sản phẩm gợi ý real-time. Tại sao mô hình kém khi k quá lớn?"
          options={[
            "k lớn làm bộ nhớ cạn kiệt",
            "k lớn khiến mọi query đều dự đoán về lớp đa số toàn bộ tập — mất khả năng phân biệt cục bộ",
            "k lớn khiến thuật toán báo lỗi",
            "k lớn luôn tốt hơn k nhỏ",
          ]}
          correct={1}
          explanation="Khi k tiến tới N, k-NN đơn giản đoán lớp đa số toàn tập — không còn 'hàng xóm' nào thật sự, mọi query cho cùng một đáp án. Chọn k ≈ √N là điểm cân bằng giữa nhạy cục bộ (k nhỏ) và ổn định toàn cục (k lớn)."
        />
      </LessonSection>

      {/* ━━━ BƯỚC 6 — GIẢI THÍCH ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL} label="Giải thích">
        <ExplanationSection>
          <p className="leading-relaxed">
            <strong>k-NN</strong> là thuật toán học có giám sát dựa trên một nguyên lý cực
            đơn giản: <em>nhãn của điểm mới = đa số nhãn của k điểm gần nó nhất</em>. Mọi
            thứ sau đây chỉ là cách viết chính xác của ý tưởng đó.
          </p>

          <h4 className="text-sm font-semibold text-foreground mt-5">
            Công thức 1 — Khoảng cách Euclid
          </h4>
          <div className="rounded-xl border border-border bg-surface/40 p-4 space-y-2">
            <LaTeX block>{"d(x, y) = \\sqrt{\\sum_{j=1}^{d} (x_j - y_j)^2}"}</LaTeX>
            <p className="text-xs text-muted leading-relaxed">
              Nói bằng tiếng Việt đời thường: &ldquo;Đo đường chim bay từ điểm này đến
              điểm kia trong không gian d chiều&rdquo;. Trong 2D bạn đã học từ cấp 3:{" "}
              <em>d = √( (x₁ − x₂)² + (y₁ − y₂)² )</em>. k-NN 2D dùng chính công thức đó,
              k-NN trên 100 đặc trưng thì cộng thêm các bình phương nữa.
            </p>
            <EuclidMiniVisual />
          </div>

          <h4 className="text-sm font-semibold text-foreground mt-5">
            Công thức 2 — Quy tắc đa số
          </h4>
          <div className="rounded-xl border border-border bg-surface/40 p-4 space-y-2">
            <LaTeX block>{"\\hat{y} = \\text{mode}\\{y_i : i \\in \\mathcal{N}_k(x)\\}"}</LaTeX>
            <p className="text-xs text-muted leading-relaxed">
              Dịch ra: &ldquo;Dự đoán ŷ bằng nhãn xuất hiện nhiều nhất trong tập k điểm
              gần nhất&rdquo;. Nâng cấp hay gặp: thay vì &ldquo;mỗi hàng xóm 1 phiếu&rdquo;,
              cho hàng xóm <em>gần hơn</em> phiếu nặng hơn (weighted vote, trọng số 1/d).
            </p>
          </div>

          <Callout variant="warning" title="Cạm bẫy thường gặp: lời nguyền nhiều chiều">
            Khi số đặc trưng d rất lớn (ví dụ ảnh 224×224 = 50.000 chiều), khoảng cách
            giữa <em>mọi</em> cặp điểm có xu hướng bằng nhau — khái niệm &ldquo;gần&rdquo;
            mất nghĩa. Đây là &ldquo;curse of dimensionality&rdquo; (lời nguyền nhiều
            chiều). Với dữ liệu nhiều chiều, giảm chiều bằng PCA/UMAP hoặc dùng embedding
            deep learning trước khi áp k-NN.
          </Callout>

          <h4 className="text-sm font-semibold text-foreground mt-5">
            Quy trình dự đoán một điểm — 4 bước
          </h4>
          <StepReveal
            labels={[
              "1 · Đo khoảng cách",
              "2 · Sắp xếp & chọn k",
              "3 · Đếm phiếu",
              "4 · Dự đoán",
            ]}
          >
            {[
              <div key="s1" className="rounded-lg border border-border bg-surface/60 p-4">
                <p className="text-sm text-foreground leading-relaxed">
                  <strong>Đo khoảng cách</strong> từ điểm truy vấn đến TẤT CẢ điểm trong
                  tập huấn luyện. Với N = 100.000 điểm, là 100.000 phép đo. Đây là lý do
                  k-NN chậm trên dữ liệu lớn — tăng tốc bằng KD-tree, Ball-tree, hoặc
                  approximate NN (HNSW, FAISS).
                </p>
              </div>,
              <div key="s2" className="rounded-lg border border-border bg-surface/60 p-4">
                <p className="text-sm text-foreground leading-relaxed">
                  <strong>Sắp xếp khoảng cách từ nhỏ đến lớn</strong>, lấy k điểm đầu
                  tiên. Đây là &ldquo;k láng giềng gần nhất&rdquo; — chính xác theo nghĩa
                  đen.
                </p>
              </div>,
              <div key="s3" className="rounded-lg border border-border bg-surface/60 p-4">
                <p className="text-sm text-foreground leading-relaxed">
                  <strong>Đếm số phiếu mỗi nhãn</strong>. Ví dụ k = 5 và trong đó có 3
                  &ldquo;cơm tấm&rdquo;, 1 &ldquo;phở&rdquo;, 1 &ldquo;bánh mì&rdquo; →
                  cơm tấm dẫn trước.
                </p>
              </div>,
              <div key="s4" className="rounded-lg border border-border bg-surface/60 p-4">
                <p className="text-sm text-foreground leading-relaxed">
                  <strong>Trả về nhãn thắng</strong>. Nếu hoà phiếu → giảm k xuống 1, hoặc
                  chọn nhãn có tổng khoảng cách nhỏ hơn (weighted vote tự động).
                </p>
              </div>,
            ]}
          </StepReveal>

          <h4 className="text-sm font-semibold text-foreground mt-5">
            Các thước đo khoảng cách phổ biến
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
            {[
              {
                name: "Euclid (L2)",
                desc: "Đường chim bay. Mặc định khi đặc trưng có ý nghĩa hình học (tuổi, thu nhập sau chuẩn hoá, vị trí).",
                color: "#2563eb",
              },
              {
                name: "Manhattan (L1)",
                desc: "Đi theo ô lưới. Ít nhạy outlier hơn Euclid, phù hợp đặc trưng rời rạc hoặc thưa.",
                color: "#059669",
              },
              {
                name: "Cosine",
                desc: "1 − cos(góc) giữa hai vector. Quan tâm hướng, không độ lớn → chuẩn cho văn bản/embeddings.",
                color: "#7c3aed",
              },
              {
                name: "Mahalanobis",
                desc: "Tính tới hiệp phương sai — khi các đặc trưng tương quan với nhau (dữ liệu tài chính, y tế).",
                color: "#db2777",
              },
            ].map((m) => (
              <div
                key={m.name}
                className="rounded-xl border bg-card p-3 space-y-1"
                style={{ borderLeft: `4px solid ${m.color}` }}
              >
                <div className="text-sm font-semibold text-foreground">{m.name}</div>
                <p className="text-xs text-muted leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>

          <Callout variant="tip" title="Luôn chuẩn hoá trước khi dùng k-NN">
            Đặc trưng có thang giá trị lớn sẽ &ldquo;nuốt&rdquo; đặc trưng có thang nhỏ
            trong khoảng cách Euclid. Luôn dùng <code>StandardScaler</code> (về trung bình
            0, độ lệch 1) hoặc <code>MinMaxScaler</code> (về [0,1]) trước k-NN. Đây là lý
            do hay nhất vì sao k-NN nên nằm trong một <em>pipeline</em> — để scaler và
            model được fit cùng nhau và tránh rò rỉ dữ liệu khi cross-validate.
          </Callout>

          <h4 className="text-sm font-semibold text-foreground mt-5">
            Khi nào KHÔNG nên dùng k-NN
          </h4>
          <ul className="list-disc list-inside text-sm space-y-1 pl-2 text-foreground/80">
            <li>
              Tập huấn luyện lớn (triệu+ điểm) và cần dự đoán real-time — chi phí O(N · d)
              mỗi query quá đắt (dùng ANN như HNSW, FAISS để tăng tốc).
            </li>
            <li>
              Số chiều cao (d &gt; 20) mà không giảm chiều — khoảng cách mất nghĩa.
            </li>
            <li>
              Đặc trưng không đồng đơn vị và không chuẩn hoá được.
            </li>
            <li>
              Dữ liệu lớp mất cân bằng nặng — k-NN thiên về lớp đa số (dùng{" "}
              <code>class_weight</code> hoặc oversampling).
            </li>
          </ul>

          <p className="leading-relaxed mt-4">
            Trong thực tế, k-NN toả sáng khi: (1) bạn cần một <em>baseline nhanh</em> để
            so sánh với mô hình phức tạp hơn; (2) dữ liệu có hình học rõ ràng (cảm biến đã
            chuẩn hoá, embeddings); (3) cần giải thích cho người ngoài kỹ thuật —
            &ldquo;model này gợi ý vì có 5 trường hợp lịch sử giống bạn&rdquo; dễ hiểu
            hơn nhiều so với &ldquo;vì trọng số của layer 7 bằng...&rdquo;.
          </p>

          <p className="leading-relaxed">
            Hai khái niệm bạn nên đọc cùng:{" "}
            <TopicLink slug="k-means">k-means</TopicLink> (anh em không giám sát: thay vì
            phân loại, nó tự gom cụm), và{" "}
            <TopicLink slug="decision-trees">Cây quyết định</TopicLink> (đối thủ chính
            trên dữ liệu bảng — không cần chuẩn hoá, chạy nhanh hơn khi N lớn).
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 7 — TÓM TẮT ━━━ */}
      <LessonSection step={7} totalSteps={TOTAL} label="Tóm tắt">
        <MiniSummary
          title="4 điều cần nhớ về k-NN"
          points={[
            "k-NN = bỏ phiếu đa số của k điểm gần nhất. Không có bước train — 'model' chính là dữ liệu.",
            "k nhỏ → biên lởm chởm, nhạy nhiễu. k lớn → biên mượt, bỏ qua cụm nhỏ. Chọn k ≈ √N + cross-validation.",
            "LUÔN chuẩn hoá đặc trưng trước khi dùng — nếu không, đặc trưng thang lớn sẽ nuốt các đặc trưng khác.",
            "Nhanh cho dữ liệu vừa phải (d < 20, N vừa). Với N triệu / d lớn, dùng KD-tree, Ball-tree, HNSW hoặc đổi sang cây quyết định.",
          ]}
        />
        <div className="mt-4">
          <Callout variant="tip" title="Xem k-NN ngoài đời thật">
            Ứng dụng kiểm tra triệu chứng y tế:{" "}
            <TopicLink slug="knn-in-symptom-checker">
              k-NN trong kiểm tra triệu chứng
            </TopicLink>
            . Bạn nhập triệu chứng → app so với hàng ngàn bệnh nhân cũ → tìm ca giống nhất
            → gợi ý bệnh phổ biến trong các ca gần nhất.
          </Callout>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted">
          <Lightbulb size={12} />
          <span>
            Nếu bạn còn nhớ nguyên lý <em>&ldquo;hỏi hàng xóm&rdquo;</em> và biết khi nào
            phải chuẩn hoá, bạn đã nắm k-NN đủ dùng.
          </span>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 8 — QUIZ ━━━ */}
      <LessonSection step={8} totalSteps={TOTAL} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════
 * Phụ trợ — minh hoạ công thức Euclid
 * ════════════════════════════════════════════════════════════════════ */
function EuclidMiniVisual() {
  const [a, setA] = useState<{ x: number; y: number }>({ x: 70, y: 110 });
  const [b, setB] = useState<{ x: number; y: number }>({ x: 230, y: 40 });
  const d = euclid(a.x, a.y, b.x, b.y);
  const mW = 300;
  const mH = 160;

  function handleDown(which: "a" | "b") {
    return (e: React.PointerEvent<SVGCircleElement>) => {
      const svg = e.currentTarget.ownerSVGElement!;
      const rect = svg.getBoundingClientRect();
      function move(ev: PointerEvent) {
        const nx = ((ev.clientX - rect.left) / rect.width) * mW;
        const ny = ((ev.clientY - rect.top) / rect.height) * mH;
        const point = {
          x: Math.max(10, Math.min(mW - 10, nx)),
          y: Math.max(10, Math.min(mH - 10, ny)),
        };
        if (which === "a") setA(point);
        else setB(point);
      }
      function up() {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      }
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    };
  }

  return (
    <div className="space-y-1">
      <svg
        viewBox={`0 0 ${mW} ${mH}`}
        className="w-full"
        role="img"
        aria-label="Minh hoạ khoảng cách Euclid — kéo hai điểm để thử"
      >
        <line
          x1={a.x}
          y1={a.y}
          x2={b.x}
          y2={a.y}
          stroke="#94a3b8"
          strokeDasharray="3 3"
        />
        <line
          x1={b.x}
          y1={a.y}
          x2={b.x}
          y2={b.y}
          stroke="#94a3b8"
          strokeDasharray="3 3"
        />
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#6366f1" strokeWidth={2} />
        <circle
          cx={a.x}
          cy={a.y}
          r={8}
          fill="#0ea5e9"
          stroke="#fff"
          strokeWidth={2}
          onPointerDown={handleDown("a")}
          style={{ cursor: "grab" }}
        />
        <circle
          cx={b.x}
          cy={b.y}
          r={8}
          fill="#ef4444"
          stroke="#fff"
          strokeWidth={2}
          onPointerDown={handleDown("b")}
          style={{ cursor: "grab" }}
        />
        <text
          x={(a.x + b.x) / 2}
          y={(a.y + b.y) / 2 - 6}
          fontSize={10}
          fill="#4f46e5"
          fontWeight={600}
          textAnchor="middle"
        >
          d = {d.toFixed(1)}
        </text>
      </svg>
      <p className="text-[10px] text-tertiary text-center">
        Kéo điểm xanh/đỏ để thử. Euclid = cạnh huyền của tam giác vuông (chấm gạch).
      </p>
      <div className="flex items-center justify-center gap-2 text-[10px] text-muted">
        <Grid2x2 size={10} />
        <span>
          Δx = {Math.abs(a.x - b.x).toFixed(0)} · Δy = {Math.abs(a.y - b.y).toFixed(0)} →
          d = √(Δx² + Δy²) = {d.toFixed(1)}
        </span>
      </div>
    </div>
  );
}
