"use client";

import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Boxes,
  Gamepad2,
  CheckCircle2,
  Sparkles,
  Target,
  ArrowRight,
  RotateCcw,
  Brain,
  Eye,
  Tags,
} from "lucide-react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  LessonSection,
  TopicLink,
  TabView,
  MatchPairs,
  StepReveal,
  CollapsibleDetail,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "supervised-unsupervised-rl",
  title: "Learning Paradigms",
  titleVi: "Ba kiểu học: có giám sát, không giám sát, tăng cường",
  description:
    "Ba cách máy học: học có người chấm bài, tự nhóm theo trực giác, và thử–sai nhận thưởng. Ba cách ấy giống hệt ba cách bạn đã từng học trong đời thật.",
  category: "foundations",
  tags: ["supervised", "unsupervised", "reinforcement-learning"],
  difficulty: "beginner",
  relatedSlugs: ["linear-regression", "k-means", "rlhf"],
  vizType: "interactive",
};

/* ═══════════════════════════════════════════════════════════════════
   DỮ LIỆU — SUPERVISED: FLASHCARD CLICKER
   ═══════════════════════════════════════════════════════════════════ */

type FruitCard = {
  id: string;
  emoji: string;
  features: string;
  label: "Cam" | "Táo";
  color: string;
};

const FLASHCARDS: FruitCard[] = [
  { id: "c1", emoji: "🍊", features: "Vỏ sần, màu cam", label: "Cam", color: "#f59e0b" },
  { id: "a1", emoji: "🍎", features: "Vỏ mịn, đỏ bóng", label: "Táo", color: "#ef4444" },
  { id: "c2", emoji: "🍊", features: "Tròn, đặc, mùi ngọt", label: "Cam", color: "#f59e0b" },
  { id: "a2", emoji: "🍏", features: "Xanh lá, hơi chua", label: "Táo", color: "#10b981" },
  { id: "c3", emoji: "🍊", features: "Vỏ dày, có múi", label: "Cam", color: "#f59e0b" },
  { id: "a3", emoji: "🍎", features: "Hạt giữa, cuống dài", label: "Táo", color: "#ef4444" },
];

/* ═══════════════════════════════════════════════════════════════════
   DỮ LIỆU — UNSUPERVISED: 2D POINTS TỰ NHÓM
   ═══════════════════════════════════════════════════════════════════ */

type Cluster2DPoint = { id: number; x: number; y: number };

const CLUSTER_POINTS: Cluster2DPoint[] = [
  // Nhóm A — góc dưới trái
  { id: 1, x: 90, y: 220 },
  { id: 2, x: 115, y: 245 },
  { id: 3, x: 80, y: 260 },
  { id: 4, x: 140, y: 230 },
  { id: 5, x: 105, y: 275 },
  { id: 6, x: 150, y: 255 },
  // Nhóm B — trên cao giữa
  { id: 7, x: 245, y: 95 },
  { id: 8, x: 275, y: 80 },
  { id: 9, x: 260, y: 115 },
  { id: 10, x: 290, y: 105 },
  { id: 11, x: 230, y: 125 },
  { id: 12, x: 300, y: 130 },
  // Nhóm C — phải
  { id: 13, x: 400, y: 220 },
  { id: 14, x: 425, y: 245 },
  { id: 15, x: 440, y: 210 },
  { id: 16, x: 380, y: 240 },
  { id: 17, x: 455, y: 255 },
  { id: 18, x: 420, y: 275 },
];

// Hàm gán cluster gần nhất (mô phỏng k-means một vòng)
function assignCluster(p: Cluster2DPoint, centers: Array<{ x: number; y: number }>): number {
  let best = 0;
  let bestDist = Infinity;
  centers.forEach((c, i) => {
    const d = (p.x - c.x) ** 2 + (p.y - c.y) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  });
  return best;
}

/* ═══════════════════════════════════════════════════════════════════
   DỮ LIỆU — RL: GRID WORLD
   ═══════════════════════════════════════════════════════════════════ */

const GRID_ROWS = 5;
const GRID_COLS = 6;

type CellKind = "empty" | "goal" | "pit";

type GridCellInfo = { row: number; col: number; kind: CellKind };

const RL_GRID: GridCellInfo[] = (() => {
  const cells: GridCellInfo[] = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      let kind: CellKind = "empty";
      if (r === 2 && c === 3) kind = "pit";
      if (r === 1 && c === 4) kind = "pit";
      if (r === 3 && c === 2) kind = "pit";
      if (r === 4 && c === 5) kind = "goal";
      cells.push({ row: r, col: c, kind });
    }
  }
  return cells;
})();

// Hai đường đi: lúc còn ngây thơ, và sau khi đã "học"
const RANDOM_PATH: Array<[number, number]> = [
  [0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [2, 3], // rơi vào hố
];
const LEARNED_PATH: Array<[number, number]> = [
  [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5],
  [1, 5], [2, 5], [3, 5], [4, 5],
];

function rewardForCell(kind: CellKind): number {
  if (kind === "goal") return 10;
  if (kind === "pit") return -10;
  return -1;
}

/* ═══════════════════════════════════════════════════════════════════
   QUIZ
   ═══════════════════════════════════════════════════════════════════ */

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Bạn có 5.000 ảnh đã được dán nhãn 'chó' hoặc 'mèo'. Bạn muốn AI tự đoán con vật trong ảnh mới. Đây là kiểu học nào?",
    options: [
      "Học có giám sát — mỗi ảnh đã có nhãn đúng, model học cách đoán nhãn",
      "Học không giám sát — model tự nhóm ảnh giống nhau",
      "Học tăng cường — model nhận thưởng khi đoán đúng",
      "Không kiểu nào trong ba kiểu trên",
    ],
    correct: 0,
    explanation:
      "Có dữ liệu và đã có nhãn đúng cho từng mẫu → học có giám sát. Model xem nhiều ảnh 'chó' + nhãn 'chó', nhiều ảnh 'mèo' + nhãn 'mèo', rồi học quy luật. Giống hệt cách bạn luyện đề thi: có đề, có đáp án, bạn so lại.",
  },
  {
    question:
      "Shopee muốn chia 50 triệu khách thành các nhóm theo sở thích mua sắm — chưa ai biết phải có bao nhiêu nhóm hay tên từng nhóm là gì. Kiểu học nào phù hợp?",
    options: [
      "Học có giám sát",
      "Học không giám sát — tự tìm cấu trúc nhóm trong dữ liệu chưa có nhãn",
      "Học tăng cường",
      "Phải gọi điện hỏi từng khách",
    ],
    correct: 1,
    explanation:
      "Không ai biết trước có bao nhiêu nhóm, cũng không có 'nhãn đúng' cho mỗi khách → học không giám sát. Thuật toán như K-means tự gom các khách có hành vi tương tự thành cụm. Sau đó đội marketing mới đặt tên cho từng cụm.",
  },
  {
    question:
      "Một chú robot phải tập đi trên sàn trơn. Mỗi lần đứng vững nó được +1 điểm, mỗi lần ngã bị −5 điểm. Sau hàng ngàn lần thử, robot đi mượt. Đây là kiểu học nào?",
    options: [
      "Học có giám sát vì có người cho điểm",
      "Học không giám sát vì không ai dạy cách đi",
      "Học tăng cường — action (bước đi) + reward (điểm cộng/trừ) + thử nhiều lần",
      "Học bắt chước từ video người khác",
    ],
    correct: 2,
    explanation:
      "Không ai nói trước bước nào đúng, bước nào sai — chỉ có tín hiệu thưởng/phạt sau mỗi hành động. Đây chính là học tăng cường. Robot khám phá, thử, nhớ cái nào đưa lại điểm cao rồi lặp lại.",
  },
  {
    type: "fill-blank",
    question:
      "Học có giám sát cần dữ liệu kèm {blank}. Học không giám sát thì chỉ cần dữ liệu {blank}. Học tăng cường thì cần tín hiệu {blank} sau mỗi hành động.",
    blanks: [
      { answer: "nhãn", accept: ["label", "labels", "đáp án"] },
      { answer: "thô", accept: ["raw", "không nhãn", "không có nhãn"] },
      { answer: "phần thưởng", accept: ["reward", "thưởng"] },
    ],
    explanation:
      "Ba thành phần khác nhau mang lại ba kiểu học khác nhau: nhãn → có giám sát, chỉ có input thô → không giám sát, reward sau mỗi action → tăng cường.",
  },
  {
    question:
      "Tại sao người làm AI phải biết phân biệt ba kiểu học?",
    options: [
      "Vì mỗi công cụ AI hỗ trợ đúng một kiểu",
      "Vì dữ liệu bạn có (có nhãn, không nhãn, có môi trường động) quyết định kiểu học khả thi và thuật toán phù hợp",
      "Vì Python bắt buộc phải chọn một kiểu cố định",
      "Chỉ để trả lời phỏng vấn, không quan trọng trong thực tế",
    ],
    correct: 1,
    explanation:
      "Biết kiểu học giúp bạn không phí công: nếu dữ liệu không có nhãn, đừng mơ chạy supervised; nếu môi trường tĩnh, đừng ép dùng RL. Chọn đúng kiểu tiết kiệm rất nhiều thời gian và tiền.",
  },
  {
    question:
      "Kiểu học nào phù hợp NHẤT cho việc huấn luyện ChatGPT trả lời đúng ý người dùng — nơi con người xếp hạng các câu trả lời?",
    options: [
      "Thuần tuý có giám sát",
      "Thuần tuý không giám sát",
      "Học tăng cường từ phản hồi con người (RLHF) — kết hợp RL + nhãn xếp hạng của người",
      "Không liên quan đến ba kiểu học",
    ],
    correct: 2,
    explanation:
      "RLHF = Reinforcement Learning from Human Feedback. Con người xếp hạng các phản hồi AI đưa ra. Điểm xếp hạng trở thành phần thưởng. AI điều chỉnh cách trả lời để tối đa phần thưởng đó. Đây là cách ChatGPT, Claude được 'tinh chỉnh' để trò chuyện tự nhiên hơn.",
  },
];

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT — FLASHCARD CLICKER (SUPERVISED)
   ═══════════════════════════════════════════════════════════════════ */

function FlashcardClicker() {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [showAll, setShowAll] = useState(false);

  function toggleCard(id: string) {
    setRevealed((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const effectiveCount = showAll ? FLASHCARDS.length : Object.values(revealed).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted leading-relaxed">
          Bấm vào mỗi thẻ để &ldquo;mở đáp án&rdquo;. Giống hệt bạn lật thẻ từ vựng: xem đặc điểm,
          đoán trong đầu, rồi so với nhãn đúng.
        </p>
        <button
          type="button"
          onClick={() => {
            setShowAll((v) => !v);
            setRevealed({});
          }}
          className="shrink-0 flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface"
        >
          <Eye size={12} />
          {showAll ? "Giấu hết nhãn" : "Mở hết nhãn"}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {FLASHCARDS.map((card) => {
          const isOpen = showAll || revealed[card.id];
          return (
            <button
              type="button"
              key={card.id}
              onClick={() => {
                if (!showAll) toggleCard(card.id);
              }}
              className={`rounded-xl border-2 p-3 text-left transition-all ${
                isOpen
                  ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                  : "border-border bg-card hover:border-accent/50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl" aria-hidden>
                  {card.emoji}
                </span>
                <AnimatePresence>
                  {isOpen && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white"
                    >
                      <CheckCircle2 size={14} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <p className="text-[11px] text-muted leading-tight mb-2">{card.features}</p>
              <AnimatePresence mode="wait">
                {isOpen ? (
                  <motion.div
                    key="label"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex items-center gap-1.5"
                  >
                    <Tags size={11} style={{ color: card.color }} />
                    <span
                      className="text-xs font-bold"
                      style={{ color: card.color }}
                    >
                      Nhãn: {card.label}
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="mask"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5 text-muted"
                  >
                    <Tags size={11} />
                    <span className="text-xs italic">Bấm để xem nhãn</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>

      <div className="rounded-lg bg-surface/60 border border-border p-3 flex items-center gap-2 text-xs text-foreground">
        <GraduationCap size={14} className="text-accent shrink-0" />
        <span>
          Bạn đã xem <strong>{effectiveCount}</strong> / {FLASHCARDS.length} cặp{" "}
          <em>(đặc điểm → nhãn)</em>. Mô hình cũng học đúng như bạn: càng nhiều cặp, càng giỏi đoán
          quả mới.
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT — 2D DRAGGABLE POINTS (UNSUPERVISED)
   ═══════════════════════════════════════════════════════════════════ */

function UnsupervisedDragCanvas() {
  const [k, setK] = useState<2 | 3>(3);
  const [revealed, setRevealed] = useState(false);
  const [centers, setCenters] = useState<Array<{ x: number; y: number }>>([
    { x: 120, y: 245 },
    { x: 275, y: 110 },
    { x: 420, y: 240 },
  ]);
  const [dragging, setDragging] = useState<number | null>(null);

  const activeCenters = useMemo(() => {
    if (k === 2) return centers.slice(0, 2);
    return centers;
  }, [k, centers]);

  const colors = ["#22c55e", "#3b82f6", "#ef4444"];

  const assigned = useMemo(() => {
    return CLUSTER_POINTS.map((p) => assignCluster(p, activeCenters));
  }, [activeCenters]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (dragging === null) return;
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const x = Math.max(30, Math.min(490, (e.clientX - rect.left) * (520 / rect.width)));
      const y = Math.max(30, Math.min(310, (e.clientY - rect.top) * (340 / rect.height)));
      setCenters((prev) => prev.map((c, i) => (i === dragging ? { x, y } : c)));
    },
    [dragging]
  );

  const handlePointerUp = useCallback(() => setDragging(null), []);

  function reset() {
    setCenters([
      { x: 120, y: 245 },
      { x: 275, y: 110 },
      { x: 420, y: 240 },
    ]);
    setRevealed(false);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted leading-relaxed">
        Không ai nói trước đâu là nhóm A, B, C. Bạn chỉ thấy 18 chấm &mdash; hãy kéo <strong>tâm
        cụm</strong> (vòng tròn nét đứt) đến vị trí bạn nghĩ là &ldquo;trung tâm&rdquo; của từng
        nhóm. Khi bấm <em>Xem kết quả</em>, thuật toán sẽ gán mỗi điểm vào tâm gần nhất.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted">Số cụm K:</span>
        {[2, 3].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => {
              setK(n as 2 | 3);
              setRevealed(false);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              k === n ? "bg-accent text-white" : "bg-card border border-border text-muted"
            }`}
          >
            K = {n}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            revealed
              ? "bg-emerald-500 text-white"
              : "bg-card border border-border text-muted hover:text-foreground"
          }`}
        >
          {revealed ? "Ẩn kết quả" : "Xem kết quả"}
        </button>
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground"
        >
          <RotateCcw size={11} />
          Đặt lại
        </button>
      </div>

      <svg
        viewBox="0 0 520 340"
        className="w-full cursor-crosshair rounded-lg border border-border bg-surface/40"
        style={{ touchAction: dragging !== null ? "none" : "auto" }}
        role="img"
        aria-label="Vùng kéo tâm cụm để nhóm các điểm dữ liệu không nhãn"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Lưới */}
        {[30, 100, 170, 240, 310].map((y) => (
          <line key={`gy-${y}`} x1={30} y1={y} x2={490} y2={y} stroke="currentColor" className="text-border" strokeWidth={0.4} opacity={0.5} />
        ))}
        {[100, 180, 260, 340, 420].map((x) => (
          <line key={`gx-${x}`} x1={x} y1={30} x2={x} y2={310} stroke="currentColor" className="text-border" strokeWidth={0.4} opacity={0.5} />
        ))}
        <line x1={30} y1={310} x2={490} y2={310} stroke="currentColor" className="text-muted" strokeWidth={1} />
        <line x1={30} y1={30} x2={30} y2={310} stroke="currentColor" className="text-muted" strokeWidth={1} />

        <text x={260} y={328} textAnchor="middle" fontSize={11} fill="currentColor" className="text-muted">
          Đặc trưng 1
        </text>

        {/* Data points */}
        {CLUSTER_POINTS.map((p, i) => {
          const cluster = assigned[i];
          const color = revealed ? colors[cluster] ?? "#94a3b8" : "#94a3b8";
          return (
            <motion.circle
              key={p.id}
              cx={p.x}
              cy={p.y}
              r={7}
              fill={color}
              stroke="#0f172a"
              strokeOpacity={0.3}
              strokeWidth={1}
              initial={false}
              animate={{ fill: color }}
              transition={{ duration: 0.25 }}
            />
          );
        })}

        {/* Các đường nối điểm tới tâm (chỉ khi revealed) */}
        {revealed &&
          CLUSTER_POINTS.map((p, i) => {
            const cluster = assigned[i];
            const center = activeCenters[cluster];
            if (!center) return null;
            return (
              <motion.line
                key={`lnk-${p.id}`}
                x1={p.x}
                y1={p.y}
                x2={center.x}
                y2={center.y}
                stroke={colors[cluster]}
                strokeWidth={0.8}
                opacity={0.3}
                strokeDasharray="2 3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
              />
            );
          })}

        {/* Tâm cụm */}
        {activeCenters.map((c, i) => (
          <g key={`center-${i}`}>
            <motion.circle
              cx={c.x}
              cy={c.y}
              r={16}
              fill="none"
              stroke={colors[i]}
              strokeWidth={2.5}
              strokeDasharray="5 4"
              className="cursor-grab"
              style={{ cursor: dragging === i ? "grabbing" : "grab" }}
              onPointerDown={(e) => {
                e.stopPropagation();
                setDragging(i);
              }}
              animate={{ cx: c.x, cy: c.y }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
            />
            <motion.circle
              cx={c.x}
              cy={c.y}
              r={4}
              fill={colors[i]}
              animate={{ cx: c.x, cy: c.y }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
            />
            <text
              x={c.x}
              y={c.y - 22}
              textAnchor="middle"
              fontSize={11}
              fontWeight={700}
              fill={colors[i]}
            >
              Tâm {i + 1}
            </text>
          </g>
        ))}
      </svg>

      <div className="rounded-lg bg-surface/60 border border-border p-3 flex items-start gap-2 text-xs text-foreground">
        <Boxes size={14} className="text-accent shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {revealed
            ? `Với K = ${k}, mỗi điểm được gán màu theo tâm gần nhất. Hãy kéo tâm để xem cách nhóm thay đổi — đó chính là một bước của thuật toán K-means.`
            : `Tất cả 18 điểm ban đầu đều xám — không có nhãn. Chỉ riêng việc bạn kéo được ${k} tâm ra đúng chỗ, máy đã 'học không giám sát' thành công.`}
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT — RL GRID WORLD
   ═══════════════════════════════════════════════════════════════════ */

function RLGridWorld() {
  const [mode, setMode] = useState<"random" | "learned">("random");
  const [step, setStep] = useState(0);

  const trail = useMemo(() => {
    const path = mode === "learned" ? LEARNED_PATH : RANDOM_PATH;
    return path.slice(0, step + 1);
  }, [mode, step]);

  const reward = useMemo(() => {
    let total = 0;
    trail.forEach((pos, i) => {
      if (i === 0) return;
      const [r, c] = pos;
      const cell = RL_GRID.find((cc) => cc.row === r && cc.col === c);
      if (cell) total += rewardForCell(cell.kind);
    });
    return total;
  }, [trail]);

  const pathMax = mode === "learned" ? LEARNED_PATH.length - 1 : RANDOM_PATH.length - 1;
  const done = step >= pathMax;
  const agentPos = trail[trail.length - 1] ?? [0, 0];
  const cellSize = 52;

  const lastCell = RL_GRID.find(
    (cc) => cc.row === agentPos[0] && cc.col === agentPos[1]
  );
  const lastReward = step === 0 ? 0 : rewardForCell(lastCell?.kind ?? "empty");

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted leading-relaxed">
        Một chú robot (chấm xanh) phải đi từ góc trên bên trái đến ngôi sao vàng bên dưới bên phải.
        Chọn <em>Chưa biết đi</em> để xem nó loạng choạng, hay <em>Đã học xong</em> để xem nó đi
        mượt. Mỗi bước sẽ cộng/trừ điểm thưởng.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted">Chính sách:</span>
        <button
          type="button"
          onClick={() => {
            setMode("random");
            setStep(0);
          }}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            mode === "random"
              ? "bg-rose-500 text-white"
              : "bg-card border border-border text-muted hover:text-foreground"
          }`}
        >
          Chưa biết đi
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("learned");
            setStep(0);
          }}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            mode === "learned"
              ? "bg-emerald-500 text-white"
              : "bg-card border border-border text-muted hover:text-foreground"
          }`}
        >
          Đã học xong
        </button>
        <div className="h-5 w-px bg-border mx-1" />
        <button
          type="button"
          onClick={() => setStep((s) => Math.min(s + 1, pathMax))}
          disabled={done}
          className="flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40 hover:opacity-90"
        >
          Bước tiếp <ArrowRight size={11} />
        </button>
        <button
          type="button"
          onClick={() => setStep(0)}
          className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground"
        >
          <RotateCcw size={11} />
          Về đầu
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[auto_180px] gap-3 items-start">
        <svg
          viewBox={`0 0 ${GRID_COLS * cellSize} ${GRID_ROWS * cellSize}`}
          className="w-full max-w-md mx-auto rounded-lg border border-border bg-surface/40"
        >
          {RL_GRID.map((cell) => {
            const x = cell.col * cellSize;
            const y = cell.row * cellSize;
            let fill = "transparent";
            if (cell.kind === "goal") fill = "rgba(34, 197, 94, 0.25)";
            if (cell.kind === "pit") fill = "rgba(239, 68, 68, 0.25)";
            return (
              <g key={`${cell.row}-${cell.col}`}>
                <rect
                  x={x}
                  y={y}
                  width={cellSize}
                  height={cellSize}
                  fill={fill}
                  stroke="currentColor"
                  className="text-border"
                  strokeWidth={1}
                />
                {cell.kind === "goal" && (
                  <text
                    x={x + cellSize / 2}
                    y={y + cellSize / 2 + 6}
                    textAnchor="middle"
                    fontSize={22}
                    fill="#eab308"
                    fontWeight={700}
                  >
                    ★
                  </text>
                )}
                {cell.kind === "pit" && (
                  <text
                    x={x + cellSize / 2}
                    y={y + cellSize / 2 + 6}
                    textAnchor="middle"
                    fontSize={20}
                    fill="#ef4444"
                    fontWeight={700}
                  >
                    ✕
                  </text>
                )}
              </g>
            );
          })}

          {/* Đường đi */}
          {trail.map((pos, i) => {
            if (i === 0) return null;
            const [r, c] = pos;
            const [pr, pc] = trail[i - 1];
            return (
              <motion.line
                key={`trail-${i}`}
                x1={pc * cellSize + cellSize / 2}
                y1={pr * cellSize + cellSize / 2}
                x2={c * cellSize + cellSize / 2}
                y2={r * cellSize + cellSize / 2}
                stroke={mode === "learned" ? "#22c55e" : "#ef4444"}
                strokeWidth={3}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3 }}
              />
            );
          })}

          {/* Agent */}
          <motion.circle
            cx={agentPos[1] * cellSize + cellSize / 2}
            cy={agentPos[0] * cellSize + cellSize / 2}
            r={16}
            fill="#3b82f6"
            stroke="#0f172a"
            strokeWidth={2}
            animate={{
              cx: agentPos[1] * cellSize + cellSize / 2,
              cy: agentPos[0] * cellSize + cellSize / 2,
            }}
            transition={{ type: "spring", stiffness: 220, damping: 20 }}
          />
          <text
            x={agentPos[1] * cellSize + cellSize / 2}
            y={agentPos[0] * cellSize + cellSize / 2 + 4}
            textAnchor="middle"
            fontSize={12}
            fill="white"
            fontWeight={700}
          >
            🤖
          </text>
        </svg>

        <div className="space-y-2 text-xs">
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="text-[10px] uppercase tracking-wide text-tertiary mb-1">Bước</div>
            <div className="font-mono text-base text-foreground tabular-nums">{step} / {pathMax}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="text-[10px] uppercase tracking-wide text-tertiary mb-1">Tổng phần thưởng</div>
            <div
              className={`font-mono text-base tabular-nums ${
                reward >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
              }`}
            >
              {reward > 0 ? "+" : ""}
              {reward}
            </div>
            <AnimatePresence>
              {step > 0 && (
                <motion.div
                  key={`${mode}-${step}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`mt-1 text-[10px] ${
                    lastReward > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : lastReward < -1
                      ? "text-rose-500"
                      : "text-muted"
                  }`}
                >
                  Bước cuối: {lastReward > 0 ? "+" : ""}
                  {lastReward}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 leading-relaxed">
            <div className="text-[10px] uppercase tracking-wide text-tertiary mb-1">Luật chơi</div>
            <div className="text-foreground">★ Đích: +10</div>
            <div className="text-foreground">✕ Hố: −10</div>
            <div className="text-foreground">· Ô trống: −1</div>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-surface/60 border border-border p-3 flex items-start gap-2 text-xs text-foreground">
        <Gamepad2 size={14} className="text-accent shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {mode === "learned"
            ? "Sau hàng ngàn ván chơi thử, robot đã nhớ: đường đi qua mép trên → biên phải → xuống đích là an toàn. Mỗi bước tốn −1, đến đích +10, nhưng tránh được hố −10."
            : "Lúc chưa học, robot đi lung tung, rơi vào hố và mất 10 điểm ngay lập tức. Mỗi lần rơi là một bài học — lần sau nó sẽ tránh đi gần ô đó."}
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN TOPIC COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export default function SupervisedUnsupervisedRLTopic() {
  return (
    <>
      {/* ━━━ BƯỚC 1 — HOOK / DỰ ĐOÁN ━━━ */}
      <LessonSection step={1} totalSteps={8} label="Thử đoán">
        <PredictionGate
          question="Một đứa trẻ học cái gì đó trong ba tình huống sau. Bạn đoán xem tình huống nào giống 'học tăng cường' nhất?"
          options={[
            "Bố mẹ chỉ vào quả và nói tên: 'đây là cam, đây là táo', nhiều lần",
            "Bé tự xếp đống đồ chơi thành mấy chồng theo cảm nhận riêng",
            "Bé tập đi xe đạp: ngã thì đau, giữ thăng bằng thì vui; cứ thế cho tới khi quen",
            "Bé tra Google mỗi khi không biết",
          ]}
          correct={2}
          explanation="Đạp xe = học tăng cường. Không ai nói trước 'nghiêng người sang trái 5 độ là đúng'. Bé thử, ngã (phạt), đứng vững (thưởng), rồi tự chỉnh. Tình huống 1 là học có giám sát (có người dạy nhãn). Tình huống 2 là học không giám sát (tự nhóm không cần nhãn)."
        >
          <p className="text-sm text-muted mt-3 leading-relaxed">
            Máy cũng học theo <strong>ba cách</strong> giống bạn đã từng: có người chấm bài, tự gom
            theo trực giác, và thử–sai nhận thưởng. Hôm nay bạn sẽ tự tay chạy thử cả ba.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ BƯỚC 2 — ẨN DỤ ━━━ */}
      <LessonSection step={2} totalSteps={8} label="Ẩn dụ">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Brain size={20} className="text-accent" />
            Ba cách bạn từng học trong đời
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border-l-4 border-l-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <GraduationCap size={16} />
                <span className="text-sm font-semibold">Học với thầy cô</span>
              </div>
              <p className="text-xs text-foreground/85 leading-relaxed">
                Bạn làm đề, thầy khoanh đỏ, trả đáp án đúng. Lần sau gặp đề tương tự, bạn biết phải
                làm sao. Đây là <strong>học có giám sát</strong>.
              </p>
            </div>

            <div className="rounded-xl border-l-4 border-l-sky-400 bg-sky-50 dark:bg-sky-900/20 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300">
                <Boxes size={16} />
                <span className="text-sm font-semibold">Tự gom đồ chơi</span>
              </div>
              <p className="text-xs text-foreground/85 leading-relaxed">
                Không ai dạy, nhưng bạn vẫn xếp được một chồng xe ô tô, một chồng búp bê, một chồng
                thú nhồi bông. Đây là <strong>học không giám sát</strong>.
              </p>
            </div>

            <div className="rounded-xl border-l-4 border-l-amber-400 bg-amber-50 dark:bg-amber-900/20 p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <Gamepad2 size={16} />
                <span className="text-sm font-semibold">Tập đạp xe</span>
              </div>
              <p className="text-xs text-foreground/85 leading-relaxed">
                Ngã thì đau, đi được thì vui. Dần dần cơ thể học ra công thức giữ thăng bằng. Đây
                là <strong>học tăng cường</strong>.
              </p>
            </div>
          </div>

          <Callout variant="insight" title="Cốt lõi phải nhớ">
            Ba kiểu khác nhau ở chỗ <strong>tín hiệu</strong> mà máy nhận được:{" "}
            <em>nhãn đúng sẵn</em> (có giám sát), <em>không tín hiệu nào</em> (không giám sát), hay{" "}
            <em>điểm thưởng sau hành động</em> (tăng cường). Đổi tín hiệu = đổi kiểu học.
          </Callout>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 3 — KHÁM PHÁ TƯƠNG TÁC ━━━ */}
      <LessonSection step={3} totalSteps={8} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <TabView
            tabs={[
              {
                label: "Có giám sát",
                content: (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <GraduationCap size={16} className="text-emerald-500" />
                      <h3 className="text-base font-semibold text-foreground">
                        Học có giám sát — mở thẻ để xem nhãn
                      </h3>
                    </div>
                    <FlashcardClicker />
                  </div>
                ),
              },
              {
                label: "Không giám sát",
                content: (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Boxes size={16} className="text-sky-500" />
                      <h3 className="text-base font-semibold text-foreground">
                        Học không giám sát — kéo tâm cụm
                      </h3>
                    </div>
                    <UnsupervisedDragCanvas />
                  </div>
                ),
              },
              {
                label: "Tăng cường",
                content: (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Gamepad2 size={16} className="text-amber-500" />
                      <h3 className="text-base font-semibold text-foreground">
                        Học tăng cường — robot tìm đường nhận thưởng
                      </h3>
                    </div>
                    <RLGridWorld />
                  </div>
                ),
              },
            ]}
          />

          <div className="mt-5">
            <Callout variant="tip" title="Hãy chạy cả ba tab">
              Bấm qua lại giữa ba tab. Bạn sẽ cảm nhận ngay: cùng một đám dữ liệu, tuỳ kiểu học máy
              làm ra những kết quả rất khác. Dữ liệu có nhãn thì dùng có giám sát, dữ liệu không
              nhãn thì không giám sát, có môi trường tương tác thì tăng cường.
            </Callout>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 4 — AHA ━━━ */}
      <LessonSection step={4} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          Ba kiểu học không đua với nhau xem kiểu nào &ldquo;thông minh nhất&rdquo;. Chúng là{" "}
          <strong>ba công cụ</strong> cho ba loại dữ liệu khác nhau.
          <br />
          <br />
          Có nhãn &rArr; học có giám sát. Không nhãn &rArr; học không giám sát. Có môi trường để
          thử &rArr; học tăng cường. <strong>Dữ liệu của bạn quyết định kiểu học</strong>, không
          phải ngược lại.
        </AhaMoment>
      </LessonSection>

      {/* ━━━ BƯỚC 5 — DEEPEN ━━━ */}
      <LessonSection step={5} totalSteps={8} label="Hiểu sâu">
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Target size={18} className="text-accent" />
            Ghép công việc thực tế với kiểu học phù hợp
          </h3>
          <p className="text-sm text-muted leading-relaxed">
            Năm tình huống đời thực dưới đây. Hãy ghép mỗi việc với kiểu học mà bạn sẽ chọn. Nhớ:
            câu trả lời nằm ở <em>bạn có gì trong tay</em> — nhãn, dữ liệu thô, hay môi trường tương
            tác.
          </p>

          <MatchPairs
            instruction="Nối mỗi việc ở Cột A với kiểu học phù hợp ở Cột B."
            pairs={[
              {
                left: "Dự đoán điểm thi cuối kỳ từ điểm các bài kiểm tra trong năm",
                right: "Có giám sát — đã biết 'điểm cuối kỳ' thực của hàng ngàn học sinh khoá trước",
              },
              {
                left: "Phân hơn 1 triệu khách hàng Tiki thành các nhóm sở thích",
                right: "Không giám sát — chưa ai biết có bao nhiêu nhóm",
              },
              {
                left: "AI tự chơi cờ vua, dần dần chơi hay như đại kiện tướng",
                right: "Tăng cường — thắng +1, thua −1, tự thử hàng triệu ván",
              },
              {
                left: "Lọc email spam dựa trên 10 nghìn email người dùng đã đánh dấu",
                right: "Có giám sát — mỗi email đều có nhãn spam / không spam",
              },
              {
                left: "Tìm nhóm bệnh hiếm trong hồ sơ 500 nghìn bệnh nhân chưa ai chẩn đoán",
                right: "Không giám sát — để tự phát hiện cụm bất thường",
              },
            ]}
          />

          <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mt-8">
            <Sparkles size={18} className="text-accent" />
            Quy trình 4 bước chọn kiểu học cho bài toán mới
          </h3>
          <StepReveal
            labels={[
              "Bước 1: Dữ liệu có nhãn không?",
              "Bước 2: Có môi trường tương tác không?",
              "Bước 3: Hỏi ngược: mình muốn gì?",
              "Bước 4: Chọn công cụ",
            ]}
          >
            {[
              <div key="s1" className="rounded-lg bg-surface/60 border border-border p-4">
                <p className="text-sm text-foreground leading-relaxed">
                  <strong>Có nhãn đúng sẵn cho mỗi mẫu không?</strong> Ví dụ: 10 nghìn ảnh đã dán
                  nhãn &ldquo;chó/mèo&rdquo;; 50 nghìn giao dịch đã được bank xác nhận là{" "}
                  &ldquo;gian lận/hợp lệ&rdquo;. Nếu có &rArr; ưu tiên <strong>học có giám sát</strong>,
                  vì đây là cách nhanh và chắc nhất.
                </p>
              </div>,
              <div key="s2" className="rounded-lg bg-surface/60 border border-border p-4">
                <p className="text-sm text-foreground leading-relaxed">
                  <strong>Nếu không có nhãn nhưng có môi trường tương tác?</strong> Game, robot,
                  chatbot trả lời khách — mỗi hành động đều được đo ngay bằng một con số (thắng/thua,
                  đi bao xa, khách hài lòng mức nào). Đây là đất diễn của <strong>học tăng cường</strong>.
                </p>
              </div>,
              <div key="s3" className="rounded-lg bg-surface/60 border border-border p-4">
                <p className="text-sm text-foreground leading-relaxed">
                  <strong>Không nhãn, không môi trường — chỉ có dữ liệu thô?</strong> Vậy hãy hỏi:
                  mình muốn AI <em>dự đoán</em> gì, hay chỉ <em>khám phá cấu trúc</em>? Nếu chỉ muốn
                  tìm nhóm, tìm bất thường, giảm chiều dữ liệu &rArr; <strong>học không giám sát</strong>.
                </p>
              </div>,
              <div key="s4" className="rounded-lg bg-surface/60 border border-border p-4">
                <p className="text-sm text-foreground leading-relaxed">
                  <strong>Chọn thuật toán phù hợp:</strong> Có giám sát &rArr;{" "}
                  <TopicLink slug="linear-regression">hồi quy tuyến tính</TopicLink>, cây quyết định,
                  mạng nơ-ron. Không giám sát &rArr; K-means, phân tích thành phần chính. Tăng cường
                  &rArr; Q-learning, deep reinforcement learning.
                </p>
              </div>,
            ]}
          </StepReveal>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 6 — CHALLENGE ━━━ */}
      <LessonSection step={6} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Một startup giao hàng muốn huấn luyện AI điều phối shipper sao cho đơn đến nhanh nhất. Họ có: 500 nghìn đơn lịch sử (có thời gian thực tế), bản đồ giao thông cập nhật theo phút, và bộ mô phỏng thành phố để AI thử các chiến lược. Kiểu học NÀO HỢP NHẤT cho việc chọn tuyến cho mỗi đơn mới?"
          options={[
            "Chỉ có giám sát — vì đã có lịch sử đơn kèm thời gian",
            "Chỉ không giám sát — nhóm các shipper theo tốc độ",
            "Tăng cường, thậm chí kết hợp có giám sát — vì có môi trường mô phỏng, hành động (chọn tuyến) + phần thưởng (thời gian ngắn) và dữ liệu lịch sử để khởi đầu",
            "Không kiểu nào phù hợp, phải thuê shipper nhiều hơn",
          ]}
          correct={2}
          explanation="Khi có môi trường tương tác (bộ mô phỏng) và tín hiệu đo được (thời gian đến), tăng cường là lựa chọn tự nhiên. Dữ liệu lịch sử vẫn hữu ích để 'mồi' (warm-start) policy ban đầu, nhưng chính sự thử–sai trong mô phỏng mới là nơi AI vượt qua lịch sử."
        />
      </LessonSection>

      {/* ━━━ BƯỚC 7 — EXPLAIN ━━━ */}
      <LessonSection step={7} totalSteps={8} label="Giải thích">
        <ExplanationSection topicSlug={metadata.slug}>
          <p className="leading-relaxed">
            Ba kiểu học máy khác nhau ở <strong>loại dữ liệu</strong> và <strong>loại tín hiệu
            học</strong>. Bạn không cần nhớ công thức — chỉ cần nhớ ba bộ ba dưới đây.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-5">
            <div className="rounded-xl border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <GraduationCap size={18} className="text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                  Học có giám sát
                </span>
              </div>
              <div className="text-xs text-foreground/85 leading-relaxed space-y-1.5">
                <p><strong>Dữ liệu:</strong> mỗi mẫu có nhãn đúng.</p>
                <p><strong>Tín hiệu:</strong> sai số giữa dự đoán và nhãn.</p>
                <p><strong>Ví dụ:</strong> dự đoán giá nhà, nhận diện chữ viết tay, lọc spam.</p>
                <p>
                  <strong>Thuật toán phổ biến:</strong>{" "}
                  <TopicLink slug="linear-regression">hồi quy tuyến tính</TopicLink>, cây quyết
                  định, mạng nơ-ron.
                </p>
              </div>
            </div>

            <div className="rounded-xl border-2 border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-sky-900/20 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Boxes size={18} className="text-sky-600 dark:text-sky-400" />
                <span className="font-semibold text-sky-800 dark:text-sky-300">
                  Học không giám sát
                </span>
              </div>
              <div className="text-xs text-foreground/85 leading-relaxed space-y-1.5">
                <p><strong>Dữ liệu:</strong> chỉ có input, không nhãn.</p>
                <p><strong>Tín hiệu:</strong> khoảng cách, mật độ, cấu trúc ẩn.</p>
                <p><strong>Ví dụ:</strong> phân nhóm khách hàng, phát hiện giao dịch bất thường.</p>
                <p>
                  <strong>Thuật toán phổ biến:</strong>{" "}
                  <TopicLink slug="k-means">K-means</TopicLink>, DBSCAN, phân tích thành phần chính.
                </p>
              </div>
            </div>

            <div className="rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Gamepad2 size={18} className="text-amber-600 dark:text-amber-400" />
                <span className="font-semibold text-amber-800 dark:text-amber-300">
                  Học tăng cường
                </span>
              </div>
              <div className="text-xs text-foreground/85 leading-relaxed space-y-1.5">
                <p><strong>Dữ liệu:</strong> chuỗi (trạng thái, hành động, phần thưởng).</p>
                <p><strong>Tín hiệu:</strong> tổng phần thưởng tích luỹ.</p>
                <p><strong>Ví dụ:</strong> AlphaGo, robot tự lái, gợi ý Netflix.</p>
                <p>
                  <strong>Thuật toán phổ biến:</strong> Q-learning, policy gradient,{" "}
                  <TopicLink slug="rlhf">RLHF</TopicLink>.
                </p>
              </div>
            </div>
          </div>

          <h4 className="text-sm font-semibold text-foreground mt-4 mb-2">
            Phân biệt bằng một câu hỏi duy nhất
          </h4>
          <p className="leading-relaxed">
            Khi nhìn một bài toán mới, hãy hỏi: <em>Máy nhận được tín hiệu gì sau khi đoán?</em>
          </p>

          <div className="rounded-xl border border-border bg-surface/40 p-4 my-3">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                <span>
                  <strong>Có nhãn đúng để so → có giám sát.</strong> Giống thầy cô chấm bài: bạn đoán
                  &ldquo;cam&rdquo;, đáp án là &ldquo;táo&rdquo;, sai. Lần sau điều chỉnh.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-sky-500 shrink-0" />
                <span>
                  <strong>Không có tín hiệu nào → không giám sát.</strong> Máy tự tìm cấu trúc dựa
                  trên &ldquo;những điểm nào gần nhau&rdquo;.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                <span>
                  <strong>Chỉ có điểm thưởng sau mỗi hành động → tăng cường.</strong> Máy không được
                  bảo đúng/sai cụ thể, chỉ biết &ldquo;hành động vừa rồi tốt hay xấu&rdquo;.
                </span>
              </li>
            </ul>
          </div>

          <Callout variant="warning" title="Bẫy phổ biến cho người mới">
            &ldquo;Dữ liệu càng nhiều càng tốt&rdquo; — đúng, nhưng với có giám sát,{" "}
            <strong>chất lượng nhãn</strong> quan trọng hơn số lượng. 10 nghìn ảnh dán nhãn cẩu thả
            thua 1 nghìn ảnh dán cẩn thận. Hãy đầu tư thời gian cho việc gắn nhãn đúng.
          </Callout>

          <Callout variant="tip" title="Kiểu học 'lai' ngoài sách giáo khoa">
            Trong thực tế, các đội AI hay dùng <strong>học bán giám sát</strong> (ít nhãn + nhiều
            dữ liệu thô) và <strong>học tự giám sát</strong> (máy tự tạo nhãn từ chính dữ liệu —
            ví dụ GPT đoán từ tiếp theo). GPT-4, Claude được huấn luyện kết hợp cả tự giám sát lẫn{" "}
            <TopicLink slug="rlhf">RLHF</TopicLink>.
          </Callout>

          <CollapsibleDetail title="Khi nào có giám sát 'học thuộc lòng' mà không hiểu (overfitting)?">
            <p className="text-sm leading-relaxed">
              Khi model quá to so với dữ liệu hoặc bạn huấn luyện quá lâu, nó nhớ nguyên tập huấn
              luyện nhưng tệ với dữ liệu mới. Dấu hiệu: độ chính xác trên train rất cao (99%), trên
              test lại thấp (70%). Cách xử lý: thêm dữ liệu, regularization, giảm kích thước model,
              dừng sớm (early stopping). Xem{" "}
              <TopicLink slug="overfitting-underfitting">overfitting &amp; underfitting</TopicLink>.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Khi nào không giám sát cho kết quả khó tin?">
            <p className="text-sm leading-relaxed">
              Vì không có nhãn đúng để so, việc &ldquo;đánh giá chất lượng&rdquo; cụm rất chủ quan.
              Bạn phải dựa vào các chỉ số nội bộ (Silhouette, Davies-Bouldin) và kiến thức về bài
              toán. Đôi khi 3 cụm và 4 cụm đều &ldquo;đẹp&rdquo; về toán, nhưng chỉ một cách có ý
              nghĩa với đội marketing.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Vì sao học tăng cường khó hơn hai cái kia?">
            <p className="text-sm leading-relaxed">
              Ba lý do: (1) <em>phần thưởng thưa</em> — có khi phải đi hàng trăm bước mới có tín
              hiệu; (2) <em>đánh đổi khám phá vs khai thác</em> — thử cái mới có thể thua, bám cái
              cũ có thể bỏ lỡ; (3) <em>vòng nhân quả</em> — hành động hôm nay ảnh hưởng trạng thái
              ngày mai. Đó là lý do huấn luyện AlphaGo ngốn hàng triệu ván cờ.
            </p>
          </CollapsibleDetail>

          <p className="leading-relaxed mt-4">
            <strong>Nhớ điều này trên hết:</strong> kiểu học đúng không đến từ &ldquo;thuật toán
            nào hot nhất trên Twitter&rdquo;. Nó đến từ việc bạn nhìn kỹ <em>dữ liệu mình đang có</em>
            {" "}— có nhãn, không nhãn, hay có môi trường. Chọn nhầm là đi lạc cả dự án.
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 8 — TÓM TẮT + QUIZ ━━━ */}
      <LessonSection step={8} totalSteps={8} label="Tóm tắt & kiểm tra">
        <MiniSummary
          title="4 điều cần nhớ về ba kiểu học"
          points={[
            "Có giám sát: dữ liệu có nhãn → học từ 'đáp án'. Dùng cho dự đoán, phân loại.",
            "Không giám sát: dữ liệu không nhãn → tự tìm cấu trúc. Dùng cho phân nhóm, phát hiện bất thường.",
            "Tăng cường: action + phần thưởng → học chính sách. Dùng cho game, robot, chatbot.",
            "Dữ liệu của bạn quyết định kiểu học, không phải ngược lại. Chọn nhầm = đi lạc cả dự án.",
          ]}
        />

        <div className="mt-6">
          <Callout variant="tip" title="Bài ứng dụng liên quan">
            Muốn xem ba kiểu học này phối hợp cùng lúc trong một sản phẩm thực? Hãy đọc tiếp:{" "}
            <TopicLink slug="supervised-unsupervised-rl-in-netflix">
              Ba kiểu học trong Netflix
            </TopicLink>{" "}
            — nơi có giám sát đoán điểm, không giám sát chia nhóm sở thích, và tăng cường chọn ảnh
            bìa hiển thị.
          </Callout>
        </div>

        <div className="mt-8">
          <QuizSection questions={quizQuestions} />
        </div>
      </LessonSection>
    </>
  );
}
