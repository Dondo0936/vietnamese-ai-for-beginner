"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database,
  ChefHat,
  Sparkles,
  Scissors,
  ListChecks,
  AlertTriangle,
  AlertCircle,
  Trash2,
  Eye,
  EyeOff,
  BookOpen,
  SprayCan,
  Tag,
  SplitSquareHorizontal,
  X,
} from "lucide-react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  TopicLink,
  DragDrop,
  StepReveal,
  SliderGroup,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

/* ══════════════════════════════════════════════════════════════════════
   METADATA
   ══════════════════════════════════════════════════════════════════════ */
export const metadata: TopicMeta = {
  slug: "data-and-datasets",
  title: "Data & Datasets",
  titleVi: "Dữ liệu — thức ăn của ML",
  description:
    "Dữ liệu là thức ăn của Machine Learning. Chất lượng đầu vào quyết định chất lượng đầu ra. Làm quen với đặc trưng, nhãn, và ba tập train/val/test.",
  category: "foundations",
  tags: ["data", "features", "labels", "train-test-split"],
  difficulty: "beginner",
  relatedSlugs: [
    "what-is-ml",
    "math-readiness",
    "supervised-unsupervised-rl",
    "train-val-test",
  ],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

/* ══════════════════════════════════════════════════════════════════════
   DỮ LIỆU: Bảng 8 ngôi nhà mẫu
   ══════════════════════════════════════════════════════════════════════ */

type HouseRow = {
  id: number;
  district: string;
  area: number;
  rooms: number;
  age: number;
  price: number;
};

const HOUSE_ROWS: HouseRow[] = [
  { id: 1, district: "Cầu Giấy", area: 52, rooms: 2, age: 5, price: 3200 },
  { id: 2, district: "Hai Bà Trưng", area: 68, rooms: 3, age: 12, price: 4500 },
  { id: 3, district: "Đống Đa", area: 45, rooms: 2, age: 2, price: 3900 },
  { id: 4, district: "Hà Đông", area: 90, rooms: 4, age: 8, price: 3600 },
  { id: 5, district: "Ba Đình", area: 55, rooms: 2, age: 15, price: 4800 },
  { id: 6, district: "Hoàng Mai", area: 75, rooms: 3, age: 3, price: 2900 },
  { id: 7, district: "Long Biên", area: 82, rooms: 3, age: 6, price: 2600 },
  { id: 8, district: "Thanh Xuân", area: 60, rooms: 2, age: 10, price: 3700 },
];

type ColumnKey = "district" | "area" | "rooms" | "age" | "price";

const COLUMNS: {
  key: ColumnKey;
  label: string;
  unit?: string;
}[] = [
  { key: "district", label: "Quận" },
  { key: "area", label: "Diện tích", unit: "m²" },
  { key: "rooms", label: "Số phòng" },
  { key: "age", label: "Tuổi nhà", unit: "năm" },
  { key: "price", label: "Giá", unit: "triệu" },
];

/* ══════════════════════════════════════════════════════════════════════
   COMPONENT: SVG Table với toggle cột + màu theo role
   ══════════════════════════════════════════════════════════════════════ */

function DatasetInspector() {
  const [labelCol, setLabelCol] = useState<ColumnKey>("price");
  const [hiddenCols, setHiddenCols] = useState<Set<ColumnKey>>(new Set());

  function toggleHidden(key: ColumnKey) {
    setHiddenCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const visibleCols = COLUMNS.filter((c) => !hiddenCols.has(c.key));
  const featureCols = visibleCols.filter((c) => c.key !== labelCol);
  const labelInfo = COLUMNS.find((c) => c.key === labelCol);

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Database size={18} className="text-accent" />
        <h3 className="text-base font-semibold text-foreground">
          Bảng dữ liệu nhà ở Hà Nội — tương tác được
        </h3>
      </div>

      <p className="text-sm text-muted leading-relaxed">
        Bấm vào tiêu đề cột để chọn cột nào là{" "}
        <strong className="text-amber-600 dark:text-amber-400">nhãn</strong>{" "}
        (thứ máy cần đoán). Các cột còn lại tự động trở thành{" "}
        <strong className="text-blue-600 dark:text-blue-400">đặc trưng</strong>{" "}
        (thông tin đầu vào). Bấm nút con mắt để ẩn cột — xem máy sẽ có
        bao nhiêu đầu vào.
      </p>

      {/* Các nút ẩn/hiện cột */}
      <div className="flex flex-wrap gap-2">
        {COLUMNS.map((col) => {
          const hidden = hiddenCols.has(col.key);
          return (
            <button
              key={col.key}
              type="button"
              onClick={() => toggleHidden(col.key)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors flex items-center gap-1.5 ${
                hidden
                  ? "border-border bg-surface text-muted opacity-60"
                  : "border-accent/40 bg-accent-light text-accent-dark"
              }`}
            >
              {hidden ? <EyeOff size={11} /> : <Eye size={11} />}
              {col.label}
            </button>
          );
        })}
      </div>

      {/* SVG Table */}
      <div className="relative">
      <div className="rounded-xl border border-border bg-surface overflow-x-auto">
        <svg
          viewBox={`0 0 ${Math.max(720, 130 * visibleCols.length + 60)} 420`}
          className="w-full min-w-[640px]"
        >
          {/* Header row */}
          {visibleCols.map((col, i) => {
            const isLabel = col.key === labelCol;
            const x = 60 + i * 130;
            return (
              <g
                key={`h-${col.key}`}
                onClick={() => setLabelCol(col.key)}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x={x}
                  y={10}
                  width={120}
                  height={40}
                  rx={8}
                  fill={isLabel ? "#f59e0b" : "#3b82f6"}
                  opacity={0.15}
                  stroke={isLabel ? "#f59e0b" : "#3b82f6"}
                  strokeWidth="2"
                />
                <text
                  x={x + 60}
                  y={30}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="700"
                  fill={isLabel ? "#b45309" : "#1d4ed8"}
                >
                  {col.label}
                  {col.unit ? ` (${col.unit})` : ""}
                </text>
                <text
                  x={x + 60}
                  y={44}
                  textAnchor="middle"
                  fontSize="11"
                  fill={isLabel ? "#b45309" : "#1d4ed8"}
                  fontStyle="italic"
                >
                  {isLabel ? "NHÃN (đoán)" : "đặc trưng"}
                </text>
              </g>
            );
          })}

          {/* Row index column */}
          <rect
            x={10}
            y={10}
            width={40}
            height={40}
            rx={8}
            fill="var(--border)"
            opacity={0.2}
          />
          <text
            x={30}
            y={35}
            textAnchor="middle"
            fontSize="11"
            fontWeight="600"
            fill="var(--color-muted, #64748b)"
          >
            #
          </text>

          {/* Data rows */}
          {HOUSE_ROWS.map((row, i) => {
            const y = 60 + i * 42;
            return (
              <g key={row.id}>
                <rect
                  x={10}
                  y={y}
                  width={40}
                  height={36}
                  rx={6}
                  fill="var(--border)"
                  opacity={0.1}
                />
                <text
                  x={30}
                  y={y + 22}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill="var(--color-muted, #64748b)"
                >
                  {row.id}
                </text>
                {visibleCols.map((col, j) => {
                  const x = 60 + j * 130;
                  const isLabel = col.key === labelCol;
                  const raw = row[col.key];
                  const value =
                    col.key === "price"
                      ? `${raw.toLocaleString("vi-VN")}`
                      : col.key === "district"
                        ? String(raw)
                        : String(raw);
                  return (
                    <g key={`${row.id}-${col.key}`}>
                      <rect
                        x={x}
                        y={y}
                        width={120}
                        height={36}
                        rx={6}
                        fill={isLabel ? "#fef3c7" : "#eff6ff"}
                        stroke={isLabel ? "#fbbf24" : "#93c5fd"}
                        strokeWidth="0.8"
                      />
                      <text
                        x={x + 60}
                        y={y + 22}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight={isLabel ? "700" : "500"}
                        fill={isLabel ? "#92400e" : "#1e3a8a"}
                      >
                        {value}
                        {col.unit ? ` ${col.unit}` : ""}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-10 rounded-r-xl bg-gradient-to-l from-[var(--bg-surface)] to-transparent md:hidden"
        />
      </div>

      {/* Tóm tắt động */}
      <div className="rounded-lg border border-border bg-surface p-3 text-xs text-foreground/85 leading-relaxed space-y-1">
        <p>
          <strong>Đang có:</strong> {HOUSE_ROWS.length} mẫu (hàng) ×{" "}
          {visibleCols.length} cột ({featureCols.length} đặc trưng + 1
          nhãn).
        </p>
        <p>
          <strong>Nhãn:</strong> {labelInfo?.label}
          {labelInfo?.unit ? ` (${labelInfo.unit})` : ""} — máy sẽ học
          cách đoán giá trị này dựa trên {featureCols.length} đặc trưng
          còn lại.
        </p>
        {featureCols.length === 0 && (
          <p className="text-rose-500 font-semibold">
            Ẩn hết đặc trưng rồi! Máy không có gì để học đâu.
          </p>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   COMPONENT: Train/Val/Test split với SliderGroup
   ══════════════════════════════════════════════════════════════════════ */

type SplitVisArgs = {
  train: number;
  val: number;
};

function SplitVisualization({ train, val }: SplitVisArgs) {
  const total = 100;
  const trainPct = Math.max(0, Math.min(100, train));
  const valPct = Math.max(0, Math.min(100 - trainPct, val));
  const testPct = Math.max(0, 100 - trainPct - valPct);

  // 50 viên đá đại diện cho 50 mẫu
  const totalStones = 50;
  const trainStones = Math.round((trainPct / 100) * totalStones);
  const valStones = Math.round((valPct / 100) * totalStones);
  const testStones = totalStones - trainStones - valStones;

  const stones: { color: string; tone: string }[] = [];
  for (let i = 0; i < trainStones; i++)
    stones.push({ color: "#3b82f6", tone: "train" });
  for (let i = 0; i < valStones; i++)
    stones.push({ color: "#f59e0b", tone: "val" });
  for (let i = 0; i < testStones; i++)
    stones.push({ color: "#10b981", tone: "test" });

  let warning = "";
  if (trainPct < 50)
    warning = "Tập train quá nhỏ — máy không đủ ví dụ để học.";
  else if (testPct < 10)
    warning = "Tập test quá nhỏ — kết quả đo không đáng tin.";
  else if (valPct === 0)
    warning = "Không có tập val — khó chọn mô hình tốt nhất.";

  return (
    <div className="w-full space-y-4">
      {/* Thanh tỉ lệ */}
      <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
        <div className="flex h-8 w-full rounded-lg overflow-hidden border border-border">
          <motion.div
            className="flex items-center justify-center text-[11px] font-bold text-white"
            style={{ backgroundColor: "#3b82f6" }}
            animate={{ width: `${trainPct}%` }}
            transition={{ duration: 0.3 }}
          >
            {trainPct > 10 ? `Train ${trainPct}%` : ""}
          </motion.div>
          <motion.div
            className="flex items-center justify-center text-[11px] font-bold text-white"
            style={{ backgroundColor: "#f59e0b" }}
            animate={{ width: `${valPct}%` }}
            transition={{ duration: 0.3 }}
          >
            {valPct > 10 ? `Val ${valPct}%` : ""}
          </motion.div>
          <motion.div
            className="flex items-center justify-center text-[11px] font-bold text-white"
            style={{ backgroundColor: "#10b981" }}
            animate={{ width: `${testPct}%` }}
            transition={{ duration: 0.3 }}
          >
            {testPct > 10 ? `Test ${testPct}%` : ""}
          </motion.div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-foreground/90">
              Train — để máy học ({trainStones}/{totalStones})
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-foreground/90">
              Val — điều chỉnh ({valStones}/{totalStones})
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-foreground/90">
              Test — kiểm tra ({testStones}/{totalStones})
            </span>
          </div>
        </div>
      </div>

      {/* 50 viên đá */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="text-[11px] font-semibold text-tertiary uppercase tracking-wide mb-2">
          50 viên đá = 50 mẫu dữ liệu. Mỗi viên sẽ đi đâu?
        </p>
        <div className="grid grid-cols-10 gap-1.5">
          {stones.map((s, i) => (
            <motion.div
              key={i}
              className="h-5 w-5 rounded"
              style={{ backgroundColor: s.color }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.012, duration: 0.2 }}
            />
          ))}
        </div>
      </div>

      {/* Cảnh báo động */}
      {warning && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 flex items-start gap-2">
          <AlertTriangle
            size={14}
            className="mt-0.5 text-amber-600 dark:text-amber-400 shrink-0"
          />
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            {warning}
          </p>
        </div>
      )}

      {total !== 100 && (
        <p className="inline-flex items-center justify-center gap-1 text-xs text-rose-500 font-semibold text-center w-full">
          <AlertCircle size={12} aria-hidden="true" />
          Ba tỉ lệ phải cộng lại bằng 100%.
        </p>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   COMPONENT: Pipeline dữ liệu (StepReveal content)
   ══════════════════════════════════════════════════════════════════════ */

type RowState = {
  id: string;
  label: string;
  status: "raw" | "cleaned" | "labeled" | "split";
  quality?: number; // 0-1
  labelValue?: string;
  bucket?: "train" | "val" | "test";
};

function PipelineStage({
  stage,
}: {
  stage: "raw" | "cleaned" | "labeled" | "split";
}) {
  const rows: RowState[] = useMemo(() => {
    const base = [
      { id: "r1", label: "Nhà Cầu Giấy, 52m², giá ???" },
      { id: "r2", label: "Nhà đống đa, 45m2, 3900 trieu" },
      { id: "r3", label: "  Ba Đình, 55m², 4800 triệu  " },
      { id: "r4", label: "Hà Đông, 90 m², NULL" },
      { id: "r5", label: "Hoàng Mai, 75m², 2900 triệu" },
      { id: "r6", label: "Long Biên, 82m², 2600 triệu" },
    ];
    return base.map((r) => ({
      ...r,
      status: stage,
    }));
  }, [stage]);

  return (
    <div className="space-y-1.5">
      {rows.map((r, i) => {
        const isIssue =
          (stage === "raw" &&
            (r.label.includes("???") ||
              r.label.includes("NULL") ||
              r.label.startsWith(" "))) ||
          false;

        const cleanedLabel =
          stage === "cleaned" || stage === "labeled" || stage === "split"
            ? r.label
                .replace("???", "3200 triệu")
                .replace("đống đa", "Đống Đa")
                .replace("m2", "m²")
                .replace("NULL", "3600 triệu")
                .trim()
            : r.label;

        const bucket =
          stage === "split"
            ? (["train", "train", "train", "val", "test", "train"][i] as
                | "train"
                | "val"
                | "test")
            : undefined;
        const bucketColor = bucket
          ? bucket === "train"
            ? "#3b82f6"
            : bucket === "val"
              ? "#f59e0b"
              : "#10b981"
          : undefined;

        return (
          <motion.div
            key={r.id + stage}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-mono ${
              isIssue && stage === "raw"
                ? "border-rose-300 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300"
                : stage === "cleaned"
                  ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-foreground"
                  : stage === "labeled"
                    ? "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-foreground"
                    : "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 text-foreground"
            }`}
          >
            <span className="text-[10px] text-muted font-semibold">#{i + 1}</span>
            <span className="flex-1 truncate">{cleanedLabel}</span>
            {stage === "raw" && isIssue && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-500">
                <X size={10} aria-hidden="true" />
                LỖI
              </span>
            )}
            {stage === "labeled" && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                nhãn: giá
              </span>
            )}
            {stage === "split" && bucket && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white uppercase"
                style={{ backgroundColor: bucketColor }}
              >
                {bucket}
              </span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   COMPONENT: Auto-play pipeline (no click needed to see motion)
   ══════════════════════════════════════════════════════════════════════ */

function PipelineAutoPlay() {
  const stages: { key: "raw" | "cleaned" | "labeled" | "split"; label: string; icon: typeof Database }[] = [
    { key: "raw", label: "1. Dữ liệu thô", icon: Database },
    { key: "cleaned", label: "2. Làm sạch", icon: SprayCan },
    { key: "labeled", label: "3. Gắn nhãn", icon: Tag },
    { key: "split", label: "4. Chia ba tập", icon: SplitSquareHorizontal },
  ];

  const [stageIdx, setStageIdx] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setStageIdx((prev) => (prev + 1) % stages.length);
    }, 3200);
    return () => clearInterval(id);
  }, [playing, stages.length]);

  const current = stages[stageIdx];
  const Icon = current.icon;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-accent" />
          <span className="text-sm font-semibold text-foreground">
            {current.label}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setPlaying(!playing)}
          className="text-xs text-muted hover:text-foreground transition-colors"
        >
          {playing ? "Tạm dừng" : "Tiếp tục"}
        </button>
      </div>

      {/* Tiến trình */}
      <div className="flex gap-1">
        {stages.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => {
              setStageIdx(i);
              setPlaying(false);
            }}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= stageIdx ? "bg-accent" : "bg-surface"
            }`}
            aria-label={s.label}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.key}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <PipelineStage stage={current.key} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   COMPONENT CHÍNH
   ══════════════════════════════════════════════════════════════════════ */

export default function DataAndDatasetsTopic() {
  const [splitValues, setSplitValues] = useState({ train: 70, val: 15 });

  const handleSplitUpdate = useCallback((values: Record<string, number>) => {
    if (values.train !== undefined && values.val !== undefined) {
      setSplitValues({ train: values.train, val: values.val });
    }
  }, []);

  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "Trong bảng dữ liệu nhà ở, cột nào thường được chọn làm NHÃN?",
        options: [
          "Quận — nơi nhà tọa lạc",
          "Diện tích — số m²",
          "Số phòng",
          "Giá nhà — thứ ta muốn dự đoán",
        ],
        correct: 3,
        explanation:
          "Nhãn là thứ ta muốn máy đoán. Quận, diện tích, số phòng là ĐẦU VÀO (đặc trưng) để máy học cách suy ra giá (nhãn).",
      },
      {
        question:
          "Vì sao phải chia dữ liệu thành tập huấn luyện (train) và tập kiểm tra (test)?",
        options: [
          "Để máy tính chạy nhanh hơn",
          "Để có thể đánh giá mô hình trên dữ liệu nó chưa từng thấy — giống đi thi với đề mới",
          "Vì dữ liệu quá lớn, phải cắt nhỏ",
          "Để có 2 mô hình khác nhau",
        ],
        correct: 1,
        explanation:
          "Giống như em học sinh chỉ giỏi khi thi đề lạ. Nếu cho máy thi đề đã học thuộc, không biết nó giỏi thật hay chỉ học vẹt.",
      },
      {
        question:
          "Mô hình đạt 99% trên tập train nhưng chỉ 60% trên tập test. Điều này có nghĩa gì?",
        options: [
          "Mô hình rất tốt, nên đưa vào sử dụng ngay",
          "Tập test bị lỗi",
          "Mô hình học thuộc lòng tập train — gọi là overfitting",
          "Cần tăng số GPU",
        ],
        correct: 2,
        explanation:
          "Đây là overfitting — mô hình nhớ đáp án cụ thể thay vì học quy luật chung. Giống học sinh học vẹt 20 đề rồi bó tay khi gặp đề 21.",
      },
      {
        type: "fill-blank",
        question:
          "Mỗi hàng trong bảng dữ liệu được gọi là một {blank}.",
        blanks: [
          {
            answer: "mẫu",
            accept: ["mẫu", "mau", "sample", "mẫu dữ liệu", "ví dụ"],
          },
        ],
        explanation:
          "Mỗi hàng = một quan sát thực tế (1 căn nhà, 1 email, 1 bức ảnh). Tiếng Anh gọi là 'sample' hoặc 'instance'.",
      },
      {
        question:
          "Bạn có 1000 ảnh, muốn làm app phân loại chó/mèo. Tỷ lệ chia train/val/test nào hợp lý?",
        options: [
          "Train 99% · Val 0% · Test 1%",
          "Train 10% · Val 10% · Test 80%",
          "Train 70% · Val 15% · Test 15%",
          "Train 100% · Val 0% · Test 0%",
        ],
        correct: 2,
        explanation:
          "70/15/15 là tỷ lệ kinh điển cho dataset vừa và nhỏ. Train lớn đủ để máy học, val/test đủ lớn để đo chính xác. Đáp án D là sai lầm kinh điển của người mới.",
      },
      {
        question:
          "Công ty có 10.000 ảnh chó/mèo, nhưng 9.000 ảnh chó và 1.000 ảnh mèo. Vấn đề gì có thể xảy ra?",
        options: [
          "Không có vấn đề gì — càng nhiều ảnh càng tốt",
          "Mô hình có thể 'lười' đoán toàn chó và vẫn đúng 90% — thực tế rất kém với mèo",
          "Máy sẽ chạy chậm hơn",
          "Mô hình không biết phân biệt màu",
        ],
        correct: 1,
        explanation:
          "Dữ liệu mất cân bằng là cạm bẫy kinh điển. Mô hình nhận ra đoán 'chó' luôn là chiến lược an toàn → tỷ lệ đúng cao nhưng với lớp 'mèo' thì tệ. Luôn kiểm tra phân bố trước khi huấn luyện.",
      },
      {
        question:
          "'Garbage in, garbage out' trong ML nghĩa là gì?",
        options: [
          "Máy tính có rác bên trong",
          "Dữ liệu đầu vào kém chất lượng → mô hình ra kết quả kém, dù thuật toán có hay đến đâu",
          "ML chỉ dùng được cho rác tái chế",
          "Phải có thùng rác bên cạnh máy",
        ],
        correct: 1,
        explanation:
          "Câu nói kinh điển của ML. Đừng mong thuật toán hay cứu được dữ liệu tệ. 60-70% thời gian của người làm ML là làm sạch dữ liệu — không phải chạy thuật toán.",
      },
    ],
    [],
  );

  return (
    <>
      {/* ══════════════════ BƯỚC 1 — HOOK ══════════════════ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Bắt đầu">
        <div className="rounded-2xl border-2 border-accent/30 bg-gradient-to-br from-accent-light/50 to-surface p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/15">
              <ChefHat size={24} className="text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground leading-tight">
                Dữ liệu là <span className="text-accent">thức ăn</span> của ML
              </h3>
              <p className="text-sm text-muted">
                Chất lượng đầu vào = chất lượng đầu ra.
              </p>
            </div>
          </div>

          <p className="text-sm text-foreground/90 leading-relaxed">
            Bạn có thể có đầu bếp giỏi nhất thế giới, nhưng nếu nguyên
            liệu là thịt ôi, rau héo — đĩa ăn cuối cùng cũng chỉ là rác.
            ML cũng thế.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-4 space-y-1">
              <div className="flex items-center gap-2">
                <Trash2 size={16} className="text-rose-500" />
                <p className="text-sm font-semibold text-foreground">
                  Dữ liệu tệ
                </p>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Sai, thiếu, lệch → mô hình kém, thậm chí có hại
              </p>
            </div>
            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 space-y-1">
              <div className="flex items-center gap-2">
                <ListChecks size={16} className="text-amber-500" />
                <p className="text-sm font-semibold text-foreground">
                  Dữ liệu ổn
                </p>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Đủ, sạch, đa dạng → mô hình dùng được
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4 space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-emerald-500" />
                <p className="text-sm font-semibold text-foreground">
                  Dữ liệu tuyệt
                </p>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Chất lượng cao, nhiều ví dụ → mô hình xuất sắc
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 text-sm italic text-foreground/85 leading-relaxed">
            &ldquo;Rác vào, rác ra&rdquo; — câu nằm lòng của mọi người
            làm ML. 60-70% công việc là làm sạch và chuẩn bị dữ liệu,
            không phải chạy thuật toán.
          </div>
        </div>
      </LessonSection>

      {/* ══════════════════ BƯỚC 2 — DỰ ĐOÁN ══════════════════ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Thử đoán">
        <PredictionGate
          question="Bảng 10.000 căn hộ có 4 cột: diện tích, quận, số phòng, giá. Bạn muốn dạy mô hình đoán GIÁ cho căn hộ mới. Khi huấn luyện và khi dự đoán, bạn đưa vào cột nào?"
          options={[
            "Đưa cả 4 cột lúc huấn luyện và cả 4 cột lúc dự đoán — mô hình tự chọn cột nào cần thiết",
            "Huấn luyện: đưa 3 cột đầu kèm 'giá' làm đáp án đúng. Dự đoán: chỉ đưa 3 cột đầu để mô hình đoán giá",
            "Huấn luyện: chỉ đưa cột 'giá'. Dự đoán: đưa 3 cột còn lại",
            "Bỏ cột 'quận' đi vì là chữ, ML chỉ hiểu số",
          ]}
          correct={1}
          explanation="Ba cột đầu là 'đặc trưng' (feature) — đầu vào. 'Giá' là 'nhãn' (label) — thứ mô hình phải đoán. Khi huấn luyện bạn đưa đủ cả đặc trưng lẫn nhãn để mô hình học mối quan hệ; khi dự đoán cho căn mới, nhãn chính là thứ bạn chưa biết — nếu đưa vào thì mô hình chỉ việc copy (rò rỉ nhãn). Cột chữ như 'quận' sẽ được mã hoá thành số ở bước tiền xử lý — bạn không cần bỏ."
        >
          <p className="text-sm text-muted mt-3 leading-relaxed">
            Tiếp theo, bạn sẽ thấy dữ liệu ML trông như thế nào — và bạn
            sẽ tự tay chọn cột nào là nhãn, cột nào là đặc trưng.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ══════════════════ BƯỚC 3 — REVEAL ══════════════════ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <div className="space-y-8">
            {/* Demo 1: Dataset inspector */}
            <DatasetInspector />

            <hr className="border-border" />

            {/* Demo 2: Split slider */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Scissors size={18} className="text-accent" />
                <h3 className="text-base font-semibold text-foreground">
                  Kéo thanh để chia dữ liệu thành ba phần
                </h3>
              </div>
              <p className="text-sm text-muted leading-relaxed">
                Dữ liệu không thể dùng hết một lần. Ta chia làm ba:
                <strong className="text-blue-600 dark:text-blue-400">
                  {" "}
                  Train
                </strong>{" "}
                (để học),
                <strong className="text-amber-600 dark:text-amber-400">
                  {" "}
                  Val
                </strong>{" "}
                (để tinh chỉnh),
                <strong className="text-emerald-600 dark:text-emerald-400">
                  {" "}
                  Test
                </strong>{" "}
                (để chấm điểm cuối). Kéo hai thanh dưới — test sẽ tự
                điều chỉnh.
              </p>

              <SliderGroup
                title="Tỉ lệ chia ba tập"
                sliders={[
                  {
                    key: "train",
                    label: "Train (%) — tập huấn luyện",
                    min: 0,
                    max: 100,
                    step: 5,
                    defaultValue: 70,
                    unit: "%",
                  },
                  {
                    key: "val",
                    label: "Val (%) — tập kiểm chứng",
                    min: 0,
                    max: 100,
                    step: 5,
                    defaultValue: 15,
                    unit: "%",
                  },
                ]}
                visualization={(values) => {
                  const train = values.train ?? 70;
                  const val = values.val ?? 15;
                  handleSplitUpdate({ train, val });
                  return <SplitVisualization train={train} val={val} />;
                }}
              />

              <div className="rounded-lg border border-border bg-surface p-3 text-xs text-foreground/85 leading-relaxed">
                <p className="font-semibold mb-1">
                  Kết quả hiện tại: Train{" "}
                  <span className="text-blue-600 dark:text-blue-400">
                    {splitValues.train}%
                  </span>{" "}
                  · Val{" "}
                  <span className="text-amber-600 dark:text-amber-400">
                    {splitValues.val}%
                  </span>{" "}
                  · Test{" "}
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {Math.max(0, 100 - splitValues.train - splitValues.val)}%
                  </span>
                </p>
                <p className="text-muted">
                  Tỉ lệ chuẩn nhất cho người mới: 70/15/15 hoặc 80/10/10.
                  Dataset càng lớn thì tập test có thể tỉ lệ càng nhỏ (vì
                  10% của 1 triệu mẫu đã là 100.000 — quá đủ).
                </p>
              </div>
            </div>

            <hr className="border-border" />

            {/* Demo 3: Pipeline auto-play */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-accent" />
                <h3 className="text-base font-semibold text-foreground">
                  Dữ liệu đi qua bốn trạm — xem từng bước
                </h3>
              </div>
              <p className="text-sm text-muted leading-relaxed">
                Từ cột dữ liệu thô đến tập sẵn sàng huấn luyện, mỗi mẫu
                đi qua bốn chặng. Bấm chấm bên dưới để nhảy, hoặc để
                animation tự chạy:
              </p>
              <PipelineAutoPlay />
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ══════════════════ BƯỚC 4 — DEEPEN (StepReveal pipeline chi tiết) ══════════════════ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Đi sâu">
        <h3 className="text-base font-semibold text-foreground mb-2">
          Bốn chặng của một bộ dữ liệu tốt
        </h3>
        <p className="text-sm text-muted mb-4 leading-relaxed">
          Bấm &ldquo;Tiếp tục&rdquo; để mở từng chặng một. Bạn sẽ thấy
          tại sao 60-70% thời gian của người làm ML dành cho chuẩn bị
          dữ liệu:
        </p>

        <StepReveal
          labels={[
            "Chặng 1: Thu thập",
            "Chặng 2: Làm sạch",
            "Chặng 3: Gắn nhãn",
            "Chặng 4: Chia tập",
          ]}
        >
          {[
            <div
              key="c1"
              className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-5 space-y-2"
            >
              <div className="flex items-center gap-2">
                <Database
                  size={18}
                  className="text-rose-600 dark:text-rose-400"
                />
                <h4 className="text-sm font-semibold text-foreground">
                  Chặng 1: Thu thập — dữ liệu từ đâu?
                </h4>
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Crawl web, mua từ nhà cung cấp, tự ghi nhận từ app của
                công ty, chụp ảnh tay… Mỗi nguồn có format khác nhau:
                file CSV, Excel, JSON, PDF, ảnh, video. Thường thu được
                đống dữ liệu lộn xộn với nhiều chất lượng khác nhau.
              </p>
              <div className="rounded-lg bg-card border border-border p-3 text-xs font-mono text-foreground/80 space-y-1">
                <p>
                  <span className="text-rose-500">cau giay</span>, 52m2,
                  ???
                </p>
                <p>
                  <span className="text-rose-500">  Ba Đình  </span>,
                  55m², 4800triệu
                </p>
                <p>
                  Hoàng Mai, <span className="text-rose-500">NULL</span>,
                  2900 triệu
                </p>
              </div>
            </div>,
            <div
              key="c2"
              className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-5 space-y-2"
            >
              <div className="flex items-center gap-2">
                <SprayCan
                  size={18}
                  className="text-blue-600 dark:text-blue-400"
                />
                <h4 className="text-sm font-semibold text-foreground">
                  Chặng 2: Làm sạch — lau lại bàn ăn
                </h4>
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Thống nhất định dạng (m² không phải m2), xử lý ô trống
                (bỏ hoặc điền bằng trung bình), xóa dòng trùng, sửa lỗi
                chính tả. Đây thường là công việc tốn nhiều thời gian
                nhất — nhưng bỏ qua là tự chuốc họa.
              </p>
              <div className="rounded-lg bg-card border border-border p-3 text-xs font-mono text-foreground/80 space-y-1">
                <p>
                  <span className="text-blue-500">Cầu Giấy</span>, 52m²,
                  3200 triệu
                </p>
                <p>
                  <span className="text-blue-500">Ba Đình</span>, 55m²,
                  4800 triệu
                </p>
                <p>
                  Hoàng Mai, <span className="text-blue-500">75m²</span>,
                  2900 triệu
                </p>
              </div>
            </div>,
            <div
              key="c3"
              className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-5 space-y-2"
            >
              <div className="flex items-center gap-2">
                <Tag
                  size={18}
                  className="text-amber-600 dark:text-amber-400"
                />
                <h4 className="text-sm font-semibold text-foreground">
                  Chặng 3: Gắn nhãn — chỉ ra đáp án đúng
                </h4>
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Nếu là học có giám sát, mỗi mẫu cần đáp án đúng. Ảnh
                chó → nhãn &ldquo;chó&rdquo;. Email quảng cáo → nhãn
                &ldquo;rác&rdquo;. Công việc này thường tốn sức người —
                các công ty lớn thuê cả đội hàng nghìn người làm việc
                này. Nhãn sai = mô hình sai.
              </p>
              <div className="rounded-lg bg-card border border-border p-3 text-xs font-mono text-foreground/80 space-y-1">
                <p>
                  Cầu Giấy, 52m² →{" "}
                  <span className="text-amber-600 font-bold">
                    3200 triệu
                  </span>
                </p>
                <p>
                  Ba Đình, 55m² →{" "}
                  <span className="text-amber-600 font-bold">
                    4800 triệu
                  </span>
                </p>
              </div>
            </div>,
            <div
              key="c4"
              className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-5 space-y-2"
            >
              <div className="flex items-center gap-2">
                <SplitSquareHorizontal
                  size={18}
                  className="text-emerald-600 dark:text-emerald-400"
                />
                <h4 className="text-sm font-semibold text-foreground">
                  Chặng 4: Chia — không trộn lẫn
                </h4>
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Chia ngẫu nhiên thành ba tập: train (để học), val (để
                tinh chỉnh trong quá trình học), test (để chấm điểm
                cuối). Quan trọng: tập test là &ldquo;đề thi đóng dấu
                kín&rdquo; — chỉ mở ra khi đã làm xong mô hình. Dùng
                trộm test để tinh chỉnh = lừa dối bản thân.
              </p>
              <div className="rounded-lg bg-card border border-border p-3 text-xs font-mono text-foreground/80 space-y-1">
                <p>
                  <span className="text-blue-500 font-bold">TRAIN</span>{" "}
                  · Cầu Giấy, 52m², 3200tr
                </p>
                <p>
                  <span className="text-amber-500 font-bold">VAL</span>{" "}
                  · Hà Đông, 90m², 3600tr
                </p>
                <p>
                  <span className="text-emerald-500 font-bold">TEST</span>{" "}
                  · Hoàng Mai, 75m², 2900tr
                </p>
              </div>
            </div>,
          ]}
        </StepReveal>
      </LessonSection>

      {/* ══════════════════ BƯỚC 5 — CHALLENGE (DragDrop) ══════════════════ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              Kéo mỗi ví dụ vào đúng thùng: train, val, hay test?
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              Có 6 mẫu mới. Với mục đích nào thì mỗi mẫu thuộc tập nào?
              Kéo thả để sắp xếp:
            </p>
            <DragDrop
              instruction="Kéo các ví dụ vào ba thùng bên dưới."
              items={[
                {
                  id: "t1",
                  label: "Mẫu dùng để máy HỌC thêm về cách đoán",
                },
                {
                  id: "t2",
                  label: "Mẫu dùng để so tay các phiên bản, chọn bản tốt nhất",
                },
                {
                  id: "t3",
                  label: "Đề thi cuối kỳ — chỉ mở khi đã xong mô hình",
                },
                {
                  id: "t4",
                  label: "Dùng để máy tự điều chỉnh từng lần đoán sai",
                },
                {
                  id: "t5",
                  label: "Dùng để quyết định dừng huấn luyện lúc nào",
                },
                {
                  id: "t6",
                  label: "Báo cáo kết quả cho sếp — đo tính hiệu quả thật",
                },
              ]}
              zones={[
                {
                  id: "train",
                  label: "Train (học)",
                  accepts: ["t1", "t4"],
                },
                {
                  id: "val",
                  label: "Val (tinh chỉnh)",
                  accepts: ["t2", "t5"],
                },
                {
                  id: "test",
                  label: "Test (chấm điểm)",
                  accepts: ["t3", "t6"],
                },
              ]}
            />
          </div>

          <InlineChallenge
            question="Bạn có 300 ảnh X-quang bệnh nhân. Team hỏi: 'Chia thế nào?'. Đề xuất tốt nhất là?"
            options={[
              "Dùng hết 300 ảnh để train, không test gì — tin tưởng máy",
              "Train 210 · Val 45 · Test 45 — tỉ lệ 70/15/15",
              "Train 1 · Val 1 · Test 298 — cần test nhiều cho chắc",
              "Chia ngẫu nhiên bằng cách tung đồng xu cho mỗi ảnh",
            ]}
            correct={1}
            explanation="Tỉ lệ 70/15/15 là kinh điển cho dataset vừa nhỏ. Đủ train để máy học, đủ val/test để đo lường. Đừng tiếc test — đó là cái đảm bảo mô hình thực sự hoạt động, không phải học thuộc."
          />

          <InlineChallenge
            question="Team phát hiện: 95% dữ liệu là nam, 5% là nữ. Khi deploy, mô hình nhận diện giọng hoạt động tệ với nữ. Đây là vấn đề gì?"
            options={[
              "Không có vấn đề — tỷ lệ tự nhiên",
              "Thiên lệch dữ liệu (dataset bias) — mô hình học tốt nhóm đa số, kém nhóm thiểu số",
              "Máy cần thêm RAM",
              "Cần đổi thuật toán khác",
            ]}
            correct={1}
            explanation="Đây là cạm bẫy đạo đức quan trọng. Nhiều vụ scandal AI đã xảy ra do dataset lệch về một nhóm người. Giải pháp: thu thập thêm dữ liệu nhóm thiểu số, hoặc gán trọng số cao hơn cho lớp ít dữ liệu khi huấn luyện."
          />
        </div>
      </LessonSection>

      {/* ══════════════════ BƯỚC 6 — AHA ══════════════════ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Aha">
        <AhaMoment>
          <p className="leading-relaxed">
            Mô hình giỏi nhất thế giới + dữ liệu tệ ={" "}
            <strong>kết quả tệ</strong>.
            <br />
            Mô hình đơn giản + dữ liệu xuất sắc ={" "}
            <strong>kết quả đáng tin</strong>.
          </p>
          <p className="mt-2 text-sm font-normal text-muted">
            Nếu chỉ được chọn một thứ để đầu tư thời gian khi mới bắt
            đầu — hãy chọn <strong>làm sạch dữ liệu</strong>, không
            phải chọn thuật toán xịn hơn.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ══════════════════ BƯỚC 7 — KẾT NỐI ══════════════════ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kết nối">
        <ExplanationSection topicSlug={metadata.slug}>
          <p className="text-sm leading-relaxed">
            Bạn vừa gặp ba khái niệm trụ cột của dữ liệu ML:{" "}
            <strong>mẫu</strong> (hàng),{" "}
            <strong className="text-blue-600 dark:text-blue-400">
              đặc trưng
            </strong>{" "}
            (cột đầu vào),{" "}
            <strong className="text-amber-600 dark:text-amber-400">
              nhãn
            </strong>{" "}
            (cột cần đoán). Và quan trọng nhất: ba tập{" "}
            <strong className="text-blue-600 dark:text-blue-400">train</strong>{" "}
            /{" "}
            <strong className="text-amber-600 dark:text-amber-400">val</strong>{" "}
            /{" "}
            <strong className="text-emerald-600 dark:text-emerald-400">
              test
            </strong>
            .
          </p>

          <Callout variant="warning" title="Ba cạm bẫy dữ liệu đừng mắc">
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>
                <strong>Thiếu ví dụ.</strong> 100 ảnh không đủ để học
                cái gì phức tạp. Tối thiểu vài nghìn, lý tưởng hàng chục
                nghìn.
              </li>
              <li>
                <strong>Mất cân bằng.</strong> 9 chó / 1 mèo → máy học
                đoán &ldquo;chó&rdquo; cho mọi ảnh và vẫn đúng 90%. Cần
                cân bằng hoặc gán trọng số.
              </li>
              <li>
                <strong>Rò rỉ test.</strong> Nếu bạn &ldquo;lén&rdquo;
                dùng test để chỉnh mô hình, kết quả báo cáo không còn
                trung thực. Tập test chỉ mở một lần — cuối cùng.
              </li>
            </ul>
          </Callout>

          <Callout variant="insight" title="Tin vui: nhiều dữ liệu có sẵn miễn phí">
            Khi mới học, bạn không cần tự đi thu thập dữ liệu. Có hàng
            nghìn bộ dữ liệu công khai miễn phí trên Kaggle,
            HuggingFace, UCI Machine Learning Repository. Tải về, mở
            ra, thử ngay — đó là cách tốt nhất để quen với dữ liệu thật.
          </Callout>

          <p className="text-sm leading-relaxed">
            Sau bài này, hãy tiếp tục tới{" "}
            <TopicLink slug="what-is-ml">
              Machine Learning là gì?
            </TopicLink>{" "}
            nếu bạn chưa học, hoặc sẵn sàng hơn thì đi thẳng vào{" "}
            <TopicLink slug="supervised-unsupervised-rl">
              ba kiểu học máy
            </TopicLink>{" "}
            — nơi các bộ dữ liệu này được đem ra sử dụng thật.
          </p>
        </ExplanationSection>

        <div className="mt-6">
          <MiniSummary
            title="Sáu điều nhớ kỹ"
            points={[
              "Dữ liệu ML tổ chức thành bảng: hàng = mẫu, cột = thuộc tính.",
              "Đặc trưng (features) là đầu vào; nhãn (label) là thứ máy cần đoán.",
              "Chia dữ liệu thành ba tập: train (học), val (tinh chỉnh), test (chấm).",
              "Tỉ lệ phổ biến: 70/15/15 hoặc 80/10/10. Dataset càng lớn thì test tỉ lệ càng nhỏ.",
              "Tập test là đề thi đóng kín — chỉ mở khi đã xong mô hình. Đừng 'lén' dùng.",
              "Rác vào, rác ra — chất lượng dữ liệu quyết định mọi thứ, hơn cả thuật toán.",
            ]}
          />
        </div>
      </LessonSection>

      {/* ══════════════════ BƯỚC 8 — QUIZ ══════════════════ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
