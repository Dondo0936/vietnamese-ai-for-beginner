"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Target,
  Flame,
  Sparkles,
  ArrowRightCircle,
  Layers3,
  Cpu,
} from "lucide-react";
import {
  InlineChallenge,
  StepReveal,
  Callout,
  MiniSummary,
  LessonSection,
  TopicLink,
} from "@/components/interactive";
import ApplicationLayout from "@/components/application/ApplicationLayout";
import ApplicationHero from "@/components/application/ApplicationHero";
import ApplicationProblem from "@/components/application/ApplicationProblem";
import ApplicationMechanism from "@/components/application/ApplicationMechanism";
import Beat from "@/components/application/Beat";
import ApplicationMetrics from "@/components/application/ApplicationMetrics";
import Metric from "@/components/application/Metric";
import ApplicationCounterfactual from "@/components/application/ApplicationCounterfactual";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "activation-functions-in-alphago",
  title: "Activation Functions in AlphaGo",
  titleVi: "Hàm kích hoạt trong AlphaGo",
  description:
    "AlphaGo thắng kỳ thủ hàng đầu thế giới — mỗi nước đi là hàng triệu nơ-ron với ReLU và softmax phối hợp. Bấm một ô trên bàn cờ để thấy mạng chính sách nghĩ gì.",
  category: "neural-fundamentals",
  tags: ["activation-functions", "reinforcement-learning", "application", "alphago"],
  difficulty: "intermediate",
  relatedSlugs: ["activation-functions"],
  vizType: "interactive",
  applicationOf: "activation-functions",
  featuredApp: {
    name: "AlphaGo",
    productFeature: "Cờ vây AI",
    company: "DeepMind (Google)",
    countryOrigin: "GB",
  },
  sources: [
    {
      title:
        "Mastering the Game of Go with Deep Neural Networks and Tree Search",
      publisher: "Silver et al., Nature 529",
      url: "https://www.nature.com/articles/nature16961",
      date: "2016-01",
      kind: "paper",
    },
    {
      title: "Mastering the Game of Go without Human Knowledge",
      publisher: "Silver et al., Nature 550 (AlphaGo Zero)",
      url: "https://discovery.ucl.ac.uk/10045895/1/agz_unformatted_nature.pdf",
      date: "2017-10",
      kind: "paper",
    },
    {
      title:
        "The Go Files: AI Computer Wraps Up 4-1 Victory Against Human Champion",
      publisher: "Nature News",
      url: "https://www.nature.com/articles/nature.2016.19575",
      date: "2016-03",
      kind: "news",
    },
    {
      title: "AlphaGo vs. Lee Sedol: Game 2, Move 37",
      publisher: "DeepMind",
      url: "https://www.deepmind.com/research/highlighted-research/alphago",
      date: "2016-03",
      kind: "engineering-blog",
    },
  ],
  tocSections: [
    { id: "hero", labelVi: "Công ty nào?" },
    { id: "problem", labelVi: "Vấn đề" },
    { id: "mechanism", labelVi: "Cách giải quyết" },
    { id: "metrics", labelVi: "Con số thật" },
    { id: "counterfactual", labelVi: "Nếu không có" },
  ],
};

/* ────────────────────────────────────────────────────────────
   Dữ liệu bàn cờ & heatmap giả lập (đúng ý nghĩa AlphaGo)
   Mỗi tình huống: danh sách quân đen/trắng + heatmap xác suất
   nước đi tiếp theo (softmax qua 361 ô của bàn 19×19).
   Heatmap ở đây là biểu diễn trực quan — không phải trọng số
   thật của AlphaGo nhưng bám theo kiểu logic chính sách (chú ý
   quanh nhóm quân đang chiến đấu, các điểm cắt, ô trống rộng).
   ──────────────────────────────────────────────────────────── */

type Stone = 0 | 1 | 2; // 0 trống, 1 đen, 2 trắng

const BOARD_SIZE = 19;

interface GoScenario {
  key: string;
  labelVi: string;
  subVi: string;
  story: string;
  stones: { x: number; y: number; color: 1 | 2 }[];
  /** Danh sách 4-6 điểm nóng. Mỗi điểm có toạ độ & trọng số. */
  hotSpots: { x: number; y: number; weight: number; whyVi: string }[];
  /** Nước AlphaGo thực sự chọn (để highlight) */
  aiMove: { x: number; y: number };
  /** Nước con người thường chọn — để so sánh. */
  humanMove?: { x: number; y: number };
}

const SCENARIOS: GoScenario[] = [
  {
    key: "opening",
    labelVi: "Khai cuộc",
    subVi: "Chiếm đất ngoài, chưa đụng độ",
    story:
      "Vài nước đầu, bàn cờ gần như trống. Mạng chính sách chưa thấy điểm chiến đấu — nó tản xác suất về các điểm sao (hoshi) truyền thống.",
    stones: [
      { x: 3, y: 3, color: 1 },
      { x: 15, y: 3, color: 2 },
      { x: 3, y: 15, color: 1 },
    ],
    hotSpots: [
      { x: 15, y: 15, weight: 0.42, whyVi: "Điểm sao còn lại — mở bốn góc" },
      { x: 15, y: 9, weight: 0.18, whyVi: "Hình sao cạnh, mở rộng thế" },
      { x: 9, y: 3, weight: 0.14, whyVi: "Cản đối phương xây đất cạnh trên" },
      { x: 9, y: 15, weight: 0.1, whyVi: "Mở rộng khung bên trái" },
      { x: 3, y: 9, weight: 0.08, whyVi: "Xây đất bên trái" },
      { x: 13, y: 16, weight: 0.06, whyVi: "Tiếp cận quân trắng góc phải" },
    ],
    aiMove: { x: 15, y: 15 },
    humanMove: { x: 15, y: 15 },
  },
  {
    key: "fight",
    labelVi: "Đụng độ giữa bàn",
    subVi: "Hai nhóm quân đang giành khí",
    story:
      "Tới trung cuộc, hai nhóm quân tiếp xúc. Mạng chính sách dồn phần lớn xác suất vào các điểm cắt và điểm khí — nơi một nước sai lệch có thể đổi hoàn toàn cục diện.",
    stones: [
      { x: 9, y: 9, color: 1 },
      { x: 10, y: 9, color: 1 },
      { x: 10, y: 10, color: 2 },
      { x: 9, y: 10, color: 2 },
      { x: 8, y: 9, color: 2 },
      { x: 11, y: 10, color: 1 },
      { x: 8, y: 10, color: 1 },
      { x: 11, y: 9, color: 2 },
    ],
    hotSpots: [
      { x: 9, y: 8, weight: 0.45, whyVi: "Cắt cặp trắng — tạo hai nhóm yếu" },
      { x: 10, y: 11, weight: 0.22, whyVi: "Vươn khí cho nhóm đen" },
      { x: 12, y: 10, weight: 0.14, whyVi: "Áp sát nhóm trắng bên phải" },
      { x: 7, y: 10, weight: 0.09, whyVi: "Chạy nối với quân đen bên trái" },
      { x: 10, y: 7, weight: 0.06, whyVi: "Chặn trên — chia hai nhóm trắng" },
      { x: 11, y: 12, weight: 0.04, whyVi: "Tạo hình mới, không chắc chắn" },
    ],
    aiMove: { x: 9, y: 8 },
    humanMove: { x: 10, y: 11 },
  },
  {
    key: "move37",
    labelVi: "Nước 37 huyền thoại",
    subVi: "AlphaGo vs. Lee Sedol, ván 2",
    story:
      "Nước đi thứ 37 của AlphaGo ở vòng thứ năm làm cả giới cờ vây sửng sốt. Một nước 'vai thứ năm' (shoulder hit tại hàng 5) mà không kỳ thủ chuyên nghiệp nào tính tới — nhưng mạng chính sách vẫn dồn đủ xác suất cho nó nhờ các tầng ReLU học được mẫu thế trận khác thường.",
    stones: [
      { x: 3, y: 3, color: 2 },
      { x: 15, y: 3, color: 1 },
      { x: 3, y: 15, color: 1 },
      { x: 15, y: 15, color: 2 },
      { x: 5, y: 10, color: 2 },
      { x: 10, y: 3, color: 1 },
      { x: 13, y: 16, color: 1 },
      { x: 16, y: 13, color: 2 },
    ],
    hotSpots: [
      { x: 10, y: 4, weight: 0.35, whyVi: "Nước 37: vai thứ năm bất ngờ" },
      { x: 14, y: 8, weight: 0.18, whyVi: "Tuyến phòng thủ truyền thống" },
      { x: 6, y: 13, weight: 0.14, whyVi: "Kéo quân trắng đi tiếp" },
      { x: 12, y: 10, weight: 0.12, whyVi: "Giữa bàn — bàn đạp cho cả hai bên" },
      { x: 17, y: 5, weight: 0.1, whyVi: "Góc phải trên vẫn trống" },
      { x: 4, y: 7, weight: 0.06, whyVi: "Áp sát nhóm trắng bên trái" },
    ],
    aiMove: { x: 10, y: 4 },
    humanMove: { x: 14, y: 8 },
  },
];

/* ────────────────────────────────────────────────────────────
   Bàn cờ 19×19 — SVG, click để xem heatmap, highlight nước AI
   ──────────────────────────────────────────────────────────── */

interface GoBoardProps {
  scenario: GoScenario;
  showHeatmap: boolean;
  selected: { x: number; y: number } | null;
  onSelect: (x: number, y: number) => void;
}

const CELL = 22;
const BOARD_PAD = 18;

function GoBoard({ scenario, showHeatmap, selected, onSelect }: GoBoardProps) {
  const total = BOARD_PAD * 2 + CELL * (BOARD_SIZE - 1);
  const hotMap = useMemo(() => {
    const map = new Map<string, { weight: number; whyVi: string }>();
    for (const h of scenario.hotSpots) {
      map.set(`${h.x},${h.y}`, { weight: h.weight, whyVi: h.whyVi });
    }
    return map;
  }, [scenario]);

  const stoneMap = useMemo(() => {
    const m = new Map<string, Stone>();
    for (const s of scenario.stones) {
      m.set(`${s.x},${s.y}`, s.color);
    }
    return m;
  }, [scenario]);

  function cellCenter(x: number, y: number): [number, number] {
    return [BOARD_PAD + x * CELL, BOARD_PAD + y * CELL];
  }

  return (
    <svg
      viewBox={`0 0 ${total} ${total}`}
      className="w-full h-auto rounded-md"
      role="img"
      aria-label={`Bàn cờ vây tình huống ${scenario.labelVi}`}
    >
      {/* Nền gỗ */}
      <rect x={0} y={0} width={total} height={total} fill="#f5d9a8" />

      {/* Lưới */}
      {Array.from({ length: BOARD_SIZE }, (_, i) => (
        <g key={`grid-${i}`}>
          <line
            x1={BOARD_PAD}
            y1={BOARD_PAD + i * CELL}
            x2={BOARD_PAD + (BOARD_SIZE - 1) * CELL}
            y2={BOARD_PAD + i * CELL}
            stroke="#6b4a1f"
            strokeWidth={0.8}
          />
          <line
            x1={BOARD_PAD + i * CELL}
            y1={BOARD_PAD}
            x2={BOARD_PAD + i * CELL}
            y2={BOARD_PAD + (BOARD_SIZE - 1) * CELL}
            stroke="#6b4a1f"
            strokeWidth={0.8}
          />
        </g>
      ))}

      {/* Điểm sao (hoshi) */}
      {[
        [3, 3],
        [9, 3],
        [15, 3],
        [3, 9],
        [9, 9],
        [15, 9],
        [3, 15],
        [9, 15],
        [15, 15],
      ].map(([hx, hy], i) => {
        const [cx, cy] = cellCenter(hx, hy);
        return <circle key={i} cx={cx} cy={cy} r={2.2} fill="#5a3c16" />;
      })}

      {/* Heatmap softmax — lớp dưới quân cờ */}
      {showHeatmap && (
        <>
          {scenario.hotSpots.map((h, i) => {
            const [cx, cy] = cellCenter(h.x, h.y);
            return (
              <motion.circle
                key={`heat-${i}`}
                cx={cx}
                cy={cy}
                r={CELL * 0.9}
                fill="#ef4444"
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{
                  opacity: Math.min(0.55, h.weight * 1.4),
                  scale: 1,
                }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                style={{ mixBlendMode: "multiply" }}
              />
            );
          })}
        </>
      )}

      {/* Click layer — mỗi ô một vùng nhấn */}
      {Array.from({ length: BOARD_SIZE }, (_, yi) =>
        Array.from({ length: BOARD_SIZE }, (_, xi) => {
          const [cx, cy] = cellCenter(xi, yi);
          return (
            <rect
              key={`hit-${xi}-${yi}`}
              x={cx - CELL / 2}
              y={cy - CELL / 2}
              width={CELL}
              height={CELL}
              fill="transparent"
              style={{ cursor: "pointer" }}
              onClick={() => onSelect(xi, yi)}
            />
          );
        }),
      )}

      {/* Đá đen / trắng */}
      {scenario.stones.map((s, i) => {
        const [cx, cy] = cellCenter(s.x, s.y);
        return (
          <g key={`stone-${i}`}>
            <circle
              cx={cx}
              cy={cy}
              r={CELL * 0.45}
              fill={s.color === 1 ? "#1a1a1a" : "#f8f8f8"}
              stroke={s.color === 1 ? "#000" : "#999"}
              strokeWidth={1}
            />
            {s.color === 2 && (
              <circle
                cx={cx - 2}
                cy={cy - 2}
                r={CELL * 0.15}
                fill="#ffffff"
                opacity={0.7}
              />
            )}
          </g>
        );
      })}

      {/* Nước AlphaGo chọn — ngôi sao đỏ */}
      {(() => {
        const [cx, cy] = cellCenter(scenario.aiMove.x, scenario.aiMove.y);
        return (
          <motion.circle
            cx={cx}
            cy={cy}
            r={CELL * 0.45}
            fill="none"
            stroke="#dc2626"
            strokeWidth={2.5}
            initial={{ scale: 1.6, opacity: 0 }}
            animate={{ scale: [1.6, 1, 1.12, 1], opacity: 1 }}
            transition={{ duration: 1.2 }}
          />
        );
      })()}

      {/* Ô người dùng đang chọn */}
      {selected && (
        <g>
          {(() => {
            const [cx, cy] = cellCenter(selected.x, selected.y);
            const isStone = stoneMap.has(`${selected.x},${selected.y}`);
            const isHot = hotMap.has(`${selected.x},${selected.y}`);
            return (
              <>
                <circle
                  cx={cx}
                  cy={cy}
                  r={CELL * 0.55}
                  fill="none"
                  stroke={
                    isStone ? "#94a3b8" : isHot ? "#22c55e" : "#0ea5e9"
                  }
                  strokeWidth={2.4}
                  strokeDasharray="3,2"
                />
              </>
            );
          })()}
        </g>
      )}
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────
   Panel heatmap — mô tả top xác suất của mạng chính sách
   ──────────────────────────────────────────────────────────── */

function HeatmapLegend({ scenario }: { scenario: GoScenario }) {
  const sorted = [...scenario.hotSpots].sort((a, b) => b.weight - a.weight);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Flame size={14} className="text-red-500" /> Top 6 nước có xác suất
          cao nhất
        </h4>
        <span className="text-[11px] text-tertiary">
          Tổng softmax qua 361 ô = 100%
        </span>
      </div>
      <div className="space-y-2">
        {sorted.map((h, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-red-500/15 text-red-500 text-[10px] font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-foreground">
                  {String.fromCharCode(65 + h.x)}
                  {BOARD_SIZE - h.y}
                </span>
                <span className="text-tertiary">— {h.whyVi}</span>
              </span>
              <span className="font-mono font-bold text-red-500">
                {(h.weight * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-card overflow-hidden">
              <motion.div
                className="h-full bg-red-500"
                initial={{ width: 0 }}
                animate={{ width: `${h.weight * 100}%` }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                style={{ opacity: 0.8 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Mạng sâu — hình ảnh 13 tầng CNN với ReLU ở giữa
   ──────────────────────────────────────────────────────────── */

function NetworkStackVisual() {
  const layers = [
    { name: "Input 19×19×48", color: "#94a3b8", kind: "in" },
    ...Array.from({ length: 12 }, (_, i) => ({
      name: `Tầng ẩn ${i + 1}`,
      color: "#22c55e",
      kind: "hidden" as const,
    })),
    { name: "Tầng 13 — đầu ra", color: "#8b5cf6", kind: "out" },
    { name: "Softmax qua 361 ô", color: "#ef4444", kind: "softmax" },
  ];

  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Layers3 size={16} className="text-accent" />
        <h4 className="text-sm font-semibold text-foreground">
          Bên trong mạng chính sách — 13 tầng nối nhau
        </h4>
      </div>
      <div className="flex items-end gap-1.5 overflow-x-auto pb-2">
        {layers.map((l, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-1 shrink-0"
            style={{ minWidth: 54 }}
          >
            <motion.div
              className="w-10 rounded-t-md flex items-center justify-center text-[9px] text-white font-semibold"
              style={{
                backgroundColor: l.color,
                height: l.kind === "softmax" ? 84 : 60 + i * 3,
                opacity: 0.85,
              }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 0.85 }}
              transition={{ delay: i * 0.03 }}
            >
              {l.kind === "hidden" ? "ReLU" : ""}
            </motion.div>
            <span className="text-[9px] text-tertiary text-center whitespace-nowrap">
              {l.name}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted leading-relaxed">
        <strong>12 tầng ẩn</strong> ở giữa đều dùng ReLU — cắt vuông ở 0 để
        gradient không bị triệt tiêu khi học qua hàng triệu ván đánh.{" "}
        <strong>Lớp cuối</strong> cho 361 điểm số thô, rồi{" "}
        <strong>softmax</strong> biến chúng thành xác suất chọn từng ô trên bàn
        cờ 19×19. Ô nào xác suất cao nhất sẽ được xem xét trước khi cây tìm
        kiếm chạy tiếp.
      </p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Khung tương tác chính — chọn tình huống + bấm ô
   ──────────────────────────────────────────────────────────── */

function BoardPlayground() {
  const [idx, setIdx] = useState(1);
  const [showHeat, setShowHeat] = useState(true);
  const [selected, setSelected] = useState<{ x: number; y: number } | null>(
    null,
  );

  const scenario = SCENARIOS[idx];

  function pickScenario(i: number) {
    setIdx(i);
    setSelected(null);
  }

  function handleSelect(x: number, y: number) {
    setSelected({ x, y });
  }

  const selectedHotspot = useMemo(() => {
    if (!selected) return null;
    return (
      scenario.hotSpots.find(
        (h) => h.x === selected.x && h.y === selected.y,
      ) ?? null
    );
  }, [selected, scenario]);

  const selectedStone = useMemo(() => {
    if (!selected) return null;
    return (
      scenario.stones.find((s) => s.x === selected.x && s.y === selected.y) ??
      null
    );
  }, [selected, scenario]);

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-accent" />
          <h4 className="text-sm font-semibold text-foreground">
            Bấm một ô trên bàn cờ để xem mạng chính sách nghĩ gì
          </h4>
        </div>
        <label className="flex items-center gap-2 text-xs text-muted cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showHeat}
            onChange={(e) => setShowHeat(e.target.checked)}
            className="accent-red-500"
          />
          Hiện heatmap softmax
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {SCENARIOS.map((s, i) => {
          const active = i === idx;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => pickScenario(i)}
              className={`text-left rounded-xl border px-3 py-2 transition-colors ${
                active
                  ? "border-accent bg-accent-light"
                  : "border-border bg-surface/40 hover:border-accent/40"
              }`}
            >
              <p
                className={`text-xs font-semibold ${active ? "text-accent-dark" : "text-foreground"}`}
              >
                {s.labelVi}
              </p>
              <p className="text-[11px] text-muted leading-snug">{s.subVi}</p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-3 space-y-2">
          <GoBoard
            scenario={scenario}
            showHeatmap={showHeat}
            selected={selected}
            onSelect={handleSelect}
          />
          <p className="text-[11px] text-tertiary leading-relaxed">
            Vòng đỏ đậm = nước AlphaGo thật sự chọn. Vệt đỏ mờ = xác suất softmax
            cho các ô khác. Bấm bất kỳ ô nào để xem chú thích bên phải.
          </p>
        </div>
        <div className="md:col-span-2 space-y-3">
          <div className="rounded-lg border border-border bg-surface/40 p-3 space-y-1">
            <p className="text-[11px] font-semibold text-tertiary uppercase tracking-wide">
              Câu chuyện
            </p>
            <p className="text-xs text-foreground/85 leading-relaxed">
              {scenario.story}
            </p>
          </div>
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={`sel-${selected.x}-${selected.y}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="rounded-lg border border-border bg-card p-3 space-y-1.5"
              >
                <p className="text-[11px] font-semibold text-tertiary uppercase tracking-wide">
                  Ô đã chọn —{" "}
                  <span className="text-foreground normal-case tracking-normal">
                    {String.fromCharCode(65 + selected.x)}
                    {BOARD_SIZE - selected.y}
                  </span>
                </p>
                {selectedStone ? (
                  <p className="text-xs text-foreground/85 leading-relaxed">
                    Ô này đã có một quân{" "}
                    <strong>
                      {selectedStone.color === 1 ? "đen" : "trắng"}
                    </strong>{" "}
                    — mạng chính sách đặt xác suất gần như bằng 0 cho những ô
                    đã có quân.
                  </p>
                ) : selectedHotspot ? (
                  <>
                    <p className="text-xs text-foreground/85 leading-relaxed">
                      {selectedHotspot.whyVi}.
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">Xác suất softmax</span>
                      <span className="font-mono font-bold text-red-500">
                        {(selectedHotspot.weight * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-surface/50 overflow-hidden">
                      <div
                        className="h-full bg-red-500"
                        style={{
                          width: `${selectedHotspot.weight * 100}%`,
                          opacity: 0.85,
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-foreground/85 leading-relaxed">
                    Mạng chính sách gán xác suất rất nhỏ cho ô này — không nằm
                    trong 6 ứng viên hàng đầu. Softmax chia 100% cho 361 ô, nên
                    phần lớn ô chỉ nhận một phần trăm nhỏ.
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-lg border border-dashed border-border bg-surface/30 p-3 text-xs text-muted leading-relaxed"
              >
                Bấm vào một điểm bất kỳ trên bàn cờ — bạn sẽ thấy mạng chính
                sách của AlphaGo giải thích vì sao nó coi ô đó quan trọng hay
                không.
              </motion.div>
            )}
          </AnimatePresence>
          <HeatmapLegend scenario={scenario} />
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Cảnh "cắt ReLU" → hư gradient — minh hoạ counterfactual
   ──────────────────────────────────────────────────────────── */

function CounterfactualDemo() {
  const [mode, setMode] = useState<"relu" | "sigmoid" | "none">("relu");

  const stages = useMemo(() => {
    // Thể hiện độ mạnh tín hiệu ở mỗi tầng trên thang 0-1
    if (mode === "relu") {
      return Array.from({ length: 13 }, (_, i) => ({
        layer: i + 1,
        strength: 0.92 - i * 0.008, // giảm nhẹ
      }));
    }
    if (mode === "sigmoid") {
      return Array.from({ length: 13 }, (_, i) => ({
        layer: i + 1,
        strength: Math.pow(0.25, i) * 0.9,
      }));
    }
    // Không kích hoạt — mọi tầng tuyến tính thu về một phép nhân
    return Array.from({ length: 13 }, (_, i) => ({
      layer: i + 1,
      strength: i === 0 ? 0.6 : 0.6, // giữ không đổi — tượng trưng cho "một lớp"
    }));
  }, [mode]);

  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Cpu size={14} className="text-accent" /> Gradient đi qua 13 tầng ra
          sao?
        </h4>
        <div className="flex gap-1">
          {(["relu", "sigmoid", "none"] as const).map((m) => {
            const active = m === mode;
            const label =
              m === "relu"
                ? "ReLU (thật)"
                : m === "sigmoid"
                  ? "Nếu dùng sigmoid"
                  : "Nếu bỏ luôn";
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                  active
                    ? "border-accent bg-accent text-white"
                    : "border-border bg-card text-muted hover:border-accent/50"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex items-end gap-1.5 h-32">
        {stages.map((s) => (
          <div key={s.layer} className="flex-1 flex flex-col items-center gap-1">
            <motion.div
              className="w-full rounded-t-sm"
              style={{
                backgroundColor:
                  mode === "relu"
                    ? "#22c55e"
                    : mode === "sigmoid"
                      ? "#ef4444"
                      : "#94a3b8",
                opacity: 0.85,
              }}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(2, s.strength * 100)}%` }}
              transition={{ duration: 0.4, delay: s.layer * 0.03 }}
            />
            <span className="text-[9px] text-tertiary">{s.layer}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted leading-relaxed">
        {mode === "relu"
          ? "Dùng ReLU — tín hiệu đi gần như nguyên vẹn qua 13 tầng. Mạng học được đặc trưng phức tạp từ hàng triệu ván cờ."
          : mode === "sigmoid"
            ? "Nếu thay bằng sigmoid — mỗi tầng nhân gradient với số ≤ 0,25. Sau 13 tầng, tín hiệu co lại gần bằng 0 — mạng không học được gì."
            : "Nếu bỏ hẳn hàm kích hoạt — cả 13 tầng sụp thành một phép biến đổi tuyến tính duy nhất. Không khác gì chơi cờ vây bằng đường thẳng."}
      </p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   COMPONENT CHÍNH
   ──────────────────────────────────────────────────────────── */

export default function ActivationFunctionsInAlphaGo() {
  return (
    <ApplicationLayout metadata={metadata} parentTitleVi="Hàm kích hoạt">
      <ApplicationHero
        parentTitleVi="Hàm kích hoạt"
        topicSlug={metadata.slug}
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-accent-light p-2">
                <Trophy size={22} className="text-accent" />
              </div>
              <div>
                <p className="text-xs font-semibold text-accent uppercase tracking-wide">
                  DeepMind · 3/2016 · Seoul
                </p>
                <h3 className="text-lg font-semibold text-foreground">
                  AlphaGo thắng Lee Sedol 4 – 1
                </h3>
              </div>
            </div>
            <p className="text-sm text-foreground/85 leading-relaxed">
              Cờ vây được coi là thành trì cuối cùng của trí tuệ con người
              trước máy tính. Một bàn cờ 19×19 có hơn 10 mũ 170 thế cờ —
              nhiều hơn số nguyên tử trong vũ trụ. Không cỗ máy nào duyệt hết
              được. AlphaGo không duyệt; nó <strong>cảm nhận</strong> — bằng
              hàng triệu nơ-ron phối hợp qua 13 tầng, mỗi tầng có một hàm kích
              hoạt.
            </p>
            <p className="text-sm text-foreground/85 leading-relaxed">
              Trong một nước đi, AlphaGo đọc cả bàn cờ, chạy qua 12 tầng ẩn có
              ReLU, rồi để softmax phân bổ 100% xác suất cho 361 ô. Từ đó nó
              chọn ra một vài ô nóng để cây tìm kiếm Monte Carlo đào sâu. Không
              có ReLU, 13 tầng sụp thành một đường thẳng; không có softmax, AI
              không biết mỗi nước đi đáng tin bao nhiêu.
            </p>
          </div>
        </div>
      </ApplicationHero>

      <ApplicationProblem topicSlug={metadata.slug}>
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <p className="text-sm text-foreground/85 leading-relaxed">
              Bàn cờ vây là <strong>một đại dương không gian thế cờ</strong>.
              Một chương trình chơi cờ vua cũ có thể duyệt tới độ sâu 10 nước,
              với cờ vua mỗi nước có khoảng 35 lựa chọn. Với cờ vây, mỗi nước
              có khoảng 250 lựa chọn, ván dài 150 nước. Số tổ hợp vượt mọi khả
              năng tính toán.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-border bg-surface/50 p-3 space-y-1">
                <p className="text-xs font-semibold text-accent">Đặc điểm 1</p>
                <p className="text-[11px] text-foreground/80 leading-snug">
                  361 ô, 10 mũ 170 thế cờ — không thể duyệt.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface/50 p-3 space-y-1">
                <p className="text-xs font-semibold text-accent">Đặc điểm 2</p>
                <p className="text-[11px] text-foreground/80 leading-snug">
                  Đánh giá thế cờ cần &ldquo;cảm&rdquo;, không chỉ đếm điểm.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface/50 p-3 space-y-1">
                <p className="text-xs font-semibold text-accent">Đặc điểm 3</p>
                <p className="text-[11px] text-foreground/80 leading-snug">
                  Phần thưởng chỉ hiện ở cuối ván — mạng phải học lâu.
                </p>
              </div>
            </div>
            <p className="text-sm text-foreground/85 leading-relaxed">
              DeepMind giải bằng cách xếp hai mạng nơ-ron tích chập sâu 13
              tầng: một mạng đề xuất nước đi (<strong>policy network</strong>),
              một mạng đánh giá thế cờ (<strong>value network</strong>). Nhưng
              13 tầng chỉ có ý nghĩa khi gradient truyền ngược được qua hết,
              mà gradient chỉ truyền được khi mỗi tầng <em>không bị sập về
              tuyến tính và không bị bóp nghẹt về 0</em>. Đây là lúc hàm kích
              hoạt vào cuộc.
            </p>
          </div>
        </div>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Hàm kích hoạt"
        topicSlug={metadata.slug}
      >
        <Beat step={1}>
          <div className="space-y-3">
            <p>
              <strong>Mã hoá bàn cờ.</strong> Bàn cờ 19×19 được biến thành một
              khối số 19×19×48 — 48 kênh mô tả quân đen, quân trắng, lịch sử
              8 nước gần nhất, số khí của mỗi nhóm quân, tuổi của từng viên đá
              và thông tin lượt đi. Đây là đầu vào mà cả hai mạng cùng nhìn.
            </p>
            <NetworkStackVisual />
          </div>
        </Beat>
        <Beat step={2}>
          <div className="space-y-3">
            <p>
              <strong>Mạng chính sách — 12 tầng ReLU.</strong> Đầu vào chạy qua
              tầng đầu với bộ lọc 5×5, rồi 11 tầng tích chập 3×3. Sau mỗi tầng
              là một hàm kích hoạt ReLU: ai âm thành 0, ai dương giữ nguyên.
              Tại sao phải ReLU chứ không phải sigmoid? Vì ReLU cho gradient
              bằng 1 ở vùng dương, nên tín hiệu học lan ngược qua 12 tầng mà
              không bị nén. Nếu dùng sigmoid, mỗi tầng nhân gradient với tối
              đa 0,25 — sau 12 tầng còn chưa tới 10 mũ âm 7.
            </p>
            <Callout variant="insight" title="Vì sao đây là lựa chọn lớn">
              ReLU là quyết định thiết kế quan trọng nhất ở lớp ẩn. Nó rẻ
              (chỉ một phép so sánh), nhanh trên GPU, và không giết gradient.
              Nhờ ReLU, AlphaGo huấn luyện được trên 30 triệu ván đánh của
              chuyên gia.
            </Callout>
          </div>
        </Beat>
        <Beat step={3}>
          <div className="space-y-3">
            <p>
              <strong>Softmax ở đầu ra — biến điểm thô thành xác suất.</strong>{" "}
              Tầng cuối cho 361 điểm số thô, một cho mỗi ô trên bàn. Nhưng
              điểm thô không dùng được — có thể số âm, có thể số to bất
              thường. Softmax biến tất cả thành 361 xác suất cộng bằng 100%.
              Ô nào xác suất cao, đó là nước AlphaGo nghĩ tới đầu tiên.
            </p>
            <BoardPlayground />
          </div>
        </Beat>
        <Beat step={4}>
          <div className="space-y-3">
            <p>
              <strong>Mạng giá trị — thêm tanh ở đầu ra.</strong> Song song
              với mạng chính sách, một mạng khác cùng kiến trúc (13 tầng,
              ReLU ở giữa) được huấn luyện để trả lời câu hỏi khác:{" "}
              <em>từ thế cờ hiện tại, bên đang đi có cơ hội thắng bao
              nhiêu?</em> Đầu ra là một nơ-ron duy nhất với hàm kích hoạt
              tanh — cho số trong khoảng từ −1 (thua chắc) tới +1 (thắng
              chắc). Tại sao tanh chứ không phải sigmoid? Vì tanh đối xứng
              quanh 0, nên &ldquo;hoà&rdquo; nằm ở giữa và gradient dễ học
              hơn.
            </p>
          </div>
        </Beat>
        <Beat step={5}>
          <div className="space-y-3">
            <p>
              <strong>Hợp nhất với cây tìm kiếm.</strong> Hàng triệu nơ-ron
              phối hợp qua ReLU ở lớp ẩn và softmax ở đầu ra giúp AlphaGo{" "}
              <strong>thu hẹp không gian tìm kiếm</strong>: từ 250 lựa chọn
              mỗi nước xuống chỉ còn 5–10 ứng viên đáng để đào sâu. Cây Monte
              Carlo lấy các xác suất đó làm điểm khởi đầu, mô phỏng vài vạn
              ván nháp, rồi chọn nước tốt nhất. Không có ReLU, không có
              softmax, toàn bộ quy trình này sụp đổ.
            </p>
            <InlineChallenge
              question="Vì sao AlphaGo dùng softmax chứ không phải sigmoid ở tầng cuối của mạng chính sách?"
              options={[
                "Vì sigmoid chạy chậm hơn softmax trên GPU",
                "Vì cần đúng một xác suất cho một nước đi — mà có 361 ô cần chọn một, nên phải là phân phối cộng bằng 1",
                "Vì sigmoid không có đạo hàm tại 0",
                "Vì softmax là hàm duy nhất DeepMind biết lúc đó",
              ]}
              correct={1}
              explanation="Softmax biến một bảng 361 điểm số thành một phân phối xác suất — các giá trị trong (0, 1) và tổng đúng bằng 1. Đây là cách chuẩn khi cần chọn một lựa chọn trong nhiều. Sigmoid chỉ dùng khi đầu ra là nhị phân (có/không), không phù hợp khi cần phân bổ xác suất giữa 361 ô."
            />
          </div>
        </Beat>
      </ApplicationMechanism>

      <LessonSection label="Phân tích một ván thật">
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-accent" />
            <h3 className="text-base font-semibold text-foreground">
              Nước 37 của AlphaGo — ván 2, 10/3/2016
            </h3>
          </div>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Đây là khoảnh khắc nổi tiếng nhất lịch sử cờ vây máy tính. Lee
            Sedol đang cầm đen, AlphaGo cầm trắng. Đến nước thứ 37, AlphaGo
            bất ngờ đánh vai thứ năm — một nước mà bình luận viên
            Michael Redmond 9-đẳng sau này gọi là &ldquo;không ai trong số
            chúng tôi nghĩ đến, nhưng khi máy đánh rồi, bạn nhận ra nó rất
            đẹp&rdquo;.
          </p>
          <StepReveal
            labels={[
              "Tình huống trước nước 37",
              "Heatmap chính sách",
              "Nước 37 được chọn",
              "Bài học rút ra",
            ]}
          >
            {[
              <div
                key="w1"
                className="rounded-xl border border-border bg-surface/40 p-4 space-y-2"
              >
                <p className="text-sm text-foreground/85 leading-relaxed">
                  Sau 36 nước, hai bên đã xây dựng thế trận. Các kỳ thủ hàng
                  đầu thường chọn lối đánh ổn định ở đường 4 — bảo toàn đất.
                  AlphaGo đứng trước lựa chọn: theo sách vở, hay đi một nước
                  khác lạ.
                </p>
              </div>,
              <div
                key="w2"
                className="rounded-xl border border-border bg-surface/40 p-4 space-y-2"
              >
                <p className="text-sm text-foreground/85 leading-relaxed">
                  Mạng chính sách dồn 35% xác suất cho vai thứ năm (điểm K16
                  trong ký hiệu chuẩn), 18% cho nước theo sách ở đường 4.
                  Softmax không &ldquo;cứng&rdquo;: nó cho cả hai cơ hội,
                  nhưng điểm số của nước vai cao hơn hẳn — vì 12 tầng ReLU
                  phía trước đã học được một mẫu thế trận mà con người chưa
                  tổng kết thành sách.
                </p>
              </div>,
              <div
                key="w3"
                className="rounded-xl border border-border bg-surface/40 p-4 space-y-2"
              >
                <p className="text-sm text-foreground/85 leading-relaxed">
                  Cây Monte Carlo tiếp nhận xác suất này, mô phỏng sâu vào
                  tương lai, và xác nhận: nước vai cho xác suất thắng cao
                  hơn. AlphaGo đánh nó. Lee Sedol cúi đầu suy nghĩ 12 phút —
                  rồi thua ván đó. Nước 37 trở thành biểu tượng: một AI không
                  chỉ bắt chước con người, mà tìm ra điều con người chưa
                  thấy.
                </p>
              </div>,
              <div
                key="w4"
                className="rounded-xl border border-border bg-surface/40 p-4 space-y-2"
              >
                <p className="text-sm text-foreground/85 leading-relaxed">
                  Vai thứ năm được tìm ra vì <strong>ReLU ở 12 tầng ẩn
                  không giết gradient</strong> khi mạng học hàng triệu ván, và{" "}
                  <strong>softmax ở tầng cuối</strong> không ép toàn bộ xác
                  suất vào một điểm &ldquo;an toàn&rdquo;. Đây là bằng chứng
                  thực tế: năm đường cong nhỏ quyết định cả khả năng sáng
                  tạo của một hệ AI lớn.
                </p>
              </div>,
            ]}
          </StepReveal>
        </div>
      </LessonSection>

      <LessonSection label="Thử thách: ráp tình huống">
        <InlineChallenge
          question="Bạn đang thiết kế phiên bản AlphaGo cho cờ tướng Việt (bàn 10×9 = 90 ô). Nên dùng hàm gì ở tầng cuối của mạng chính sách?"
          options={[
            "Sigmoid — để mỗi ô cho xác suất từ 0 đến 1",
            "Softmax trên 90 ô — để tổng xác suất chọn nước bằng 100%",
            "ReLU — để ô nào có điểm dương thì được chọn",
            "Tanh — để có cả giá trị âm và dương",
          ]}
          correct={1}
          explanation="Mỗi lượt chỉ chọn một nước từ 90 ô có thể đi — đây là phân loại đa lớp. Softmax là hàm chuẩn cho việc này: các giá trị trong (0, 1) và tổng bằng 1. Sigmoid sẽ cho 90 xác suất độc lập không cộng về 1 — không biểu diễn được 'chọn một trong 90'."
        />
        <div className="mt-4">
          <CounterfactualDemo />
        </div>
      </LessonSection>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug={metadata.slug}
      >
        <Metric
          value="Mạng chính sách dự đoán nước đi chuyên gia với độ chính xác 57,0% — vượt xa mọi hệ thống trước đó"
          sourceRef={1}
        />
        <Metric
          value="AlphaGo thắng 99,8% khi đấu với các chương trình cờ vây khác trong bài kiểm tra nội bộ"
          sourceRef={1}
        />
        <Metric
          value="Thắng Lee Sedol (9 đẳng) 4-1 vào tháng 3/2016 — lần đầu AI hạ kỳ thủ cờ vây chuyên nghiệp"
          sourceRef={3}
        />
        <Metric
          value="AlphaGo Zero (2017) dùng kiến trúc tương tự, tự học từ số 0, đánh bại phiên bản gốc 100-0"
          sourceRef={2}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Hàm kích hoạt"
        topicSlug={metadata.slug}
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <p className="text-sm text-foreground/85 leading-relaxed">
              Nếu kiến trúc viên của DeepMind chọn sai hàm kích hoạt ở hai vị
              trí then chốt, câu chuyện AlphaGo sẽ kết thúc trước khi kịp
              bắt đầu:
            </p>
            <ul className="space-y-2 text-sm text-foreground/85">
              <li className="flex items-start gap-2">
                <ArrowRightCircle
                  size={14}
                  className="text-red-500 mt-0.5 shrink-0"
                />
                <span>
                  <strong>Nếu 12 tầng ẩn dùng sigmoid</strong> thay cho
                  ReLU: gradient nhân với tối đa 0,25 ở mỗi tầng. Sau 12
                  tầng, tín hiệu học co về khoảng 10 mũ âm 8 — mạng gần như
                  không cập nhật được các tầng đầu. AlphaGo sẽ không thể học
                  được đặc trưng bàn cờ phức tạp.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRightCircle
                  size={14}
                  className="text-red-500 mt-0.5 shrink-0"
                />
                <span>
                  <strong>Nếu bỏ hẳn hàm kích hoạt</strong>: 13 tầng nhân ma
                  trận tuần tự sụp về đúng một phép biến đổi tuyến tính. AI
                  chơi cờ vây bằng đường thẳng — không phân biệt được nhóm
                  quân chiến đấu với một vùng đất rộng.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRightCircle
                  size={14}
                  className="text-red-500 mt-0.5 shrink-0"
                />
                <span>
                  <strong>Nếu thay softmax bằng sigmoid</strong> ở tầng cuối:
                  mỗi ô cho xác suất độc lập, tổng có thể là 50 hoặc 200 —
                  không biểu diễn được &ldquo;chọn một trong 361 ô&rdquo;.
                  Cây tìm kiếm Monte Carlo mất điểm khởi đầu, phải mò trong
                  không gian khổng lồ.
                </span>
              </li>
            </ul>
          </div>

          <Callout variant="tip" title="Điều gì đọng lại">
            AlphaGo không thắng nhờ một thuật toán kỳ diệu duy nhất. Nó thắng
            nhờ <strong>một chuỗi lựa chọn nhỏ đúng</strong>: ReLU cho lớp ẩn
            vì gradient không triệt tiêu, softmax cho lớp cuối vì cần phân
            phối xác suất, tanh cho mạng giá trị vì đầu ra đối xứng. Năm
            đường cong bạn vừa học ở{" "}
            <TopicLink slug="activation-functions">Hàm kích hoạt</TopicLink>{" "}
            là <em>đồ nghề gốc</em> của một hệ AI chinh phục đỉnh cao cờ vây.
          </Callout>
        </div>
      </ApplicationCounterfactual>

      <LessonSection label="Tóm tắt">
        <MiniSummary
          title="5 điều cần nhớ về AlphaGo và hàm kích hoạt"
          points={[
            "AlphaGo dùng hai mạng nơ-ron tích chập 13 tầng — một cho chính sách (chọn nước), một cho giá trị (ước lượng thắng).",
            "12 tầng ẩn đều có ReLU: gradient đi qua nguyên vẹn ở vùng dương, giúp mạng học được từ 30 triệu ván cờ.",
            "Tầng cuối của mạng chính sách là softmax trên 361 ô — cho xác suất chọn mỗi nước, tổng bằng 1.",
            "Tầng cuối của mạng giá trị là tanh — cho số từ −1 (thua chắc) tới +1 (thắng chắc), đối xứng quanh 0.",
            "Nước 37 ván 2 vs Lee Sedol là minh chứng: năm đường cong nhỏ phối hợp tạo ra sáng tạo mà con người chưa từng thấy.",
          ]}
        />
      </LessonSection>
    </ApplicationLayout>
  );
}
