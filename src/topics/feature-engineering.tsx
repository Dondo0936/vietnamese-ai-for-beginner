"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Coins,
  MapPin,
  Tag,
  FileText,
  Sparkles,
  Layers,
  Grid3x3,
  Scale,
  LineChart as LineIcon,
  BarChart3,
  Clock,
  RefreshCw,
} from "lucide-react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
  CollapsibleDetail,
  MiniSummary,
  CodeBlock,
  LessonSection,
  LaTeX,
  TopicLink,
  TabView,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "feature-engineering",
  title: "Feature Engineering",
  titleVi: "Xây dựng đặc trưng — Chọn nguyên liệu cho AI",
  description:
    "Mô hình hay không nằm ở việc bạn đưa cho nó dữ liệu thô hay đã chế biến thành đặc trưng có ý nghĩa. Chạm vào từng cột để xem phép biến đổi thực sự làm gì.",
  category: "foundations",
  tags: ["features", "engineering", "transformation", "selection"],
  difficulty: "intermediate",
  relatedSlugs: ["data-preprocessing", "dimensionality-curse", "train-val-test"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

/* ────────────────────────────────────────────────────────────
   DỮ LIỆU BẢNG THÔ — 5 hàng, 4 cột thô
   ──────────────────────────────────────────────────────────── */

type RawColumnKey = "date_of_birth" | "price" | "address" | "category";

interface RawRow {
  id: string;
  date_of_birth: string; // ISO string
  price: number; // VND
  address: string;
  category: "food" | "electronics" | "fashion";
}

const RAW_ROWS: RawRow[] = [
  {
    id: "r1",
    date_of_birth: "1995-05-30",
    price: 125_000,
    address: "42 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội",
    category: "food",
  },
  {
    id: "r2",
    date_of_birth: "2003-11-02",
    price: 8_500_000,
    address: "12 Nguyễn Huệ, Quận 1, TP HCM",
    category: "electronics",
  },
  {
    id: "r3",
    date_of_birth: "1988-07-14",
    price: 450_000,
    address: "7 Trần Phú, Hải Châu, Đà Nẵng",
    category: "food",
  },
  {
    id: "r4",
    date_of_birth: "2010-02-20",
    price: 1_200_000,
    address: "25 Hùng Vương, Huế",
    category: "fashion",
  },
  {
    id: "r5",
    date_of_birth: "1999-09-09",
    price: 65_000,
    address: "88 Trần Hưng Đạo, Quận 5, TP HCM",
    category: "food",
  },
];

/* ────────────────────────────────────────────────────────────
   PHÉP BIẾN ĐỔI — ứng với từng cột thô, cho ra cột phái sinh
   ──────────────────────────────────────────────────────────── */

type TransformId =
  | "dob-to-age"
  | "price-binning"
  | "price-log"
  | "address-split"
  | "category-onehot";

interface TransformView {
  id: TransformId;
  column: RawColumnKey;
  label: string;
  idea: string; // 1 câu giải thích ý tưởng
  code: string; // ≤ 10 dòng pandas
  derivedKeys: string[];
  explain: string;
}

const TRANSFORMS: TransformView[] = [
  {
    id: "dob-to-age",
    column: "date_of_birth",
    label: "Tách thành tuổi + thế hệ",
    idea:
      "'1995-05-30' không nói gì cho mô hình. 'Tuổi 30' + 'Millennial' mới là tín hiệu có ý nghĩa.",
    code: `import pandas as pd

df["dob"] = pd.to_datetime(df["dob"])
df["age"] = (pd.Timestamp("2025-01-01") - df["dob"]).dt.days // 365
df["gen"] = pd.cut(
    df["age"],
    bins=[0, 14, 29, 44, 120],
    labels=["Gen Alpha", "Gen Z", "Millennial", "Gen X+"],
)`,
    derivedKeys: ["age", "gen"],
    explain:
      "Mỗi ngày sinh khác nhau thì mô hình xem là một giá trị khác — không có quan hệ. Khi bạn tách thành tuổi (số) và thế hệ (nhóm), mô hình học được 'càng trẻ càng có xu hướng mua đồ công nghệ', 'Gen Z thích app X'.",
  },
  {
    id: "price-binning",
    column: "price",
    label: "Chia thành khoảng (binning)",
    idea:
      "Giá 125.000đ và 450.000đ trông rất khác nhau — nhưng có thể cùng nhóm 'giá rẻ'. Binning biến số liên tục thành nhóm.",
    code: `df["price_bin"] = pd.cut(
    df["price"],
    bins=[0, 200_000, 1_000_000, 5_000_000, 1e9],
    labels=["rẻ", "vừa", "khá", "cao"],
)`,
    derivedKeys: ["price_bin"],
    explain:
      "Binning giảm nhiễu: các mô hình tuyến tính hay bị outlier kéo. Thay vì học 'cứ đắt hơn 1đ thì xác suất mua giảm một chút', mô hình học 'ở nhóm giá rẻ khách mua nhiều, ở nhóm cao mua ít'.",
  },
  {
    id: "price-log",
    column: "price",
    label: "Biến đổi log",
    idea:
      "Giá từ 65k đến 8.5M kéo dài 2 bậc thập phân. log(giá) ép phân phối về gần đối xứng — mô hình tuyến tính dễ học hơn.",
    code: `import numpy as np

df["log_price"] = np.log1p(df["price"])`,
    derivedKeys: ["log_price"],
    explain:
      "Phân phối lệch phải (long tail) là bệnh kinh điển của giá tiền, thu nhập, lượt view. log1p(x) = log(1+x) nén đuôi dài mà không làm đổi thứ tự, giúp sai số MSE không bị một vài outlier nuốt chửng.",
  },
  {
    id: "address-split",
    column: "address",
    label: "Tách thành phố / quận",
    idea:
      "'42 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội' là chuỗi văn bản. Tách ra thành 2 cột city + district để mô hình dùng được.",
    code: `parts = df["address"].str.split(", ")
df["city"] = parts.str[-1]
df["district"] = parts.str[-2]`,
    derivedKeys: ["city", "district"],
    explain:
      "Cùng số nhà ở Hà Nội và TP HCM có giá khác nhau hoàn toàn. Tách ra cho mô hình thấy 'TP HCM' là một tín hiệu, 'Quận 1' là một tín hiệu mạnh hơn nữa. Đây là bước đệm trước khi one-hot hay target encoding.",
  },
  {
    id: "category-onehot",
    column: "category",
    label: "One-hot encoding",
    idea:
      "Mô hình tuyến tính không hiểu chữ. One-hot biến mỗi giá trị thành một cột 0/1.",
    code: `cat_dummies = pd.get_dummies(
    df["category"],
    prefix="cat",
    drop_first=False,
)
df = pd.concat([df, cat_dummies.astype(int)], axis=1)`,
    derivedKeys: ["cat_food", "cat_electronics", "cat_fashion"],
    explain:
      "Với ít giá trị (≤ 20 loại), one-hot là lựa chọn đầu tiên. Khi category có hàng ngàn giá trị (ví dụ 700 quận), one-hot tạo ma trận thưa — lúc đó chuyển sang target encoding.",
  },
];

function ageFromDob(dob: string): number {
  const today = new Date("2025-01-01");
  const born = new Date(dob);
  const ms = today.getTime() - born.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24 * 365));
}

function genFromAge(age: number): string {
  if (age <= 14) return "Gen Alpha";
  if (age <= 29) return "Gen Z";
  if (age <= 44) return "Millennial";
  return "Gen X+";
}

function priceBin(price: number): string {
  if (price < 200_000) return "rẻ";
  if (price < 1_000_000) return "vừa";
  if (price < 5_000_000) return "khá";
  return "cao";
}

function splitAddress(addr: string): { city: string; district: string } {
  const parts = addr.split(",").map((s) => s.trim());
  return {
    city: parts[parts.length - 1] ?? "",
    district: parts[parts.length - 2] ?? "",
  };
}

function derivedCell(row: RawRow, key: string): string | number {
  switch (key) {
    case "age":
      return ageFromDob(row.date_of_birth);
    case "gen":
      return genFromAge(ageFromDob(row.date_of_birth));
    case "price_bin":
      return priceBin(row.price);
    case "log_price":
      return Number(Math.log1p(row.price).toFixed(2));
    case "city":
      return splitAddress(row.address).city;
    case "district":
      return splitAddress(row.address).district;
    case "cat_food":
      return row.category === "food" ? 1 : 0;
    case "cat_electronics":
      return row.category === "electronics" ? 1 : 0;
    case "cat_fashion":
      return row.category === "fashion" ? 1 : 0;
    default:
      return "—";
  }
}

function formatPrice(n: number): string {
  return n.toLocaleString("vi-VN");
}

/* ────────────────────────────────────────────────────────────
   PLAYGROUND — chạm vào cột thô để xem biến đổi khả dụng
   ──────────────────────────────────────────────────────────── */

const COLUMN_META: Record<
  RawColumnKey,
  { icon: typeof Calendar; label: string; tint: string }
> = {
  date_of_birth: { icon: Calendar, label: "date_of_birth", tint: "#0ea5e9" },
  price: { icon: Coins, label: "price (VND)", tint: "#10b981" },
  address: { icon: MapPin, label: "address", tint: "#f59e0b" },
  category: { icon: Tag, label: "category", tint: "#a855f7" },
};

function RawTablePlayground() {
  const [activeCol, setActiveCol] = useState<RawColumnKey>("date_of_birth");
  const [activeTf, setActiveTf] = useState<TransformId>("dob-to-age");

  const availableTransforms = useMemo(
    () => TRANSFORMS.filter((t) => t.column === activeCol),
    [activeCol],
  );

  const transform = useMemo(
    () =>
      availableTransforms.find((t) => t.id === activeTf) ??
      availableTransforms[0],
    [availableTransforms, activeTf],
  );

  function selectColumn(col: RawColumnKey) {
    setActiveCol(col);
    const first = TRANSFORMS.find((t) => t.column === col);
    if (first) setActiveTf(first.id);
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted leading-relaxed">
        Bảng dưới đây có năm hàng và bốn cột thô. Chạm vào một{" "}
        <strong>đầu cột</strong> để xem các phép biến đổi dành cho cột đó. Mỗi
        phép biến đổi kèm một đoạn code ngắn và kết quả đã sinh — so sánh
        &ldquo;trước&rdquo; với &ldquo;sau&rdquo; ngay tại chỗ.
      </p>

      {/* Bảng thô với header bấm được */}
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-surface/60">
              {(Object.keys(COLUMN_META) as RawColumnKey[]).map((col) => {
                const meta = COLUMN_META[col];
                const Icon = meta.icon;
                const active = activeCol === col;
                return (
                  <th
                    key={col}
                    className="px-3 py-2 text-left"
                  >
                    <button
                      type="button"
                      onClick={() => selectColumn(col)}
                      className={`flex items-center gap-1.5 rounded-md px-2 py-1 font-semibold transition-colors ${
                        active
                          ? "bg-accent/10 text-accent"
                          : "text-foreground hover:bg-surface"
                      }`}
                      style={active ? { color: meta.tint } : undefined}
                    >
                      <Icon size={12} />
                      {meta.label}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {RAW_ROWS.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border last:border-0"
              >
                <td
                  className={`px-3 py-2 font-mono ${
                    activeCol === "date_of_birth"
                      ? "bg-sky-50 dark:bg-sky-900/20"
                      : "text-muted"
                  }`}
                >
                  {row.date_of_birth}
                </td>
                <td
                  className={`px-3 py-2 font-mono tabular-nums ${
                    activeCol === "price"
                      ? "bg-emerald-50 dark:bg-emerald-900/20"
                      : "text-muted"
                  }`}
                >
                  {formatPrice(row.price)}
                </td>
                <td
                  className={`px-3 py-2 ${
                    activeCol === "address"
                      ? "bg-amber-50 dark:bg-amber-900/20"
                      : "text-muted"
                  }`}
                >
                  {row.address}
                </td>
                <td
                  className={`px-3 py-2 font-mono ${
                    activeCol === "category"
                      ? "bg-purple-50 dark:bg-purple-900/20"
                      : "text-muted"
                  }`}
                >
                  {row.category}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Chọn biến đổi cho cột hiện tại */}
      <div className="flex flex-wrap gap-2">
        {availableTransforms.map((t) => {
          const active = t.id === activeTf;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTf(t.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "border-accent bg-accent text-white"
                  : "border-border bg-card text-muted hover:border-accent/40"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Ý tưởng của biến đổi */}
      {transform && (
        <AnimatePresence mode="wait">
          <motion.div
            key={transform.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="rounded-xl border border-accent/30 bg-accent-light dark:bg-accent/10 p-4">
              <p className="text-sm text-foreground leading-relaxed">
                <Sparkles
                  size={14}
                  className="inline-block mr-1 text-accent"
                />
                <strong>Ý tưởng:</strong> {transform.idea}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Code */}
              <div>
                <p className="text-[11px] font-semibold text-tertiary uppercase tracking-wide mb-2">
                  Code pandas
                </p>
                <CodeBlock
                  language="python"
                  title={`${transform.id}.py`}
                >
                  {transform.code}
                </CodeBlock>
              </div>

              {/* Before / After visual */}
              <div>
                <p className="text-[11px] font-semibold text-tertiary uppercase tracking-wide mb-2">
                  Trước → sau
                </p>
                <BeforeAfter transform={transform} />
              </div>
            </div>

            <div className="rounded-lg border border-border bg-surface/50 p-3 text-xs text-foreground/85 leading-relaxed">
              <strong className="text-foreground">Vì sao hữu ích: </strong>
              {transform.explain}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

function BeforeAfter({ transform }: { transform: TransformView }) {
  const preview = RAW_ROWS.slice(0, 3);
  return (
    <div className="rounded-xl border border-border bg-card overflow-x-auto">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b border-border bg-surface/60">
            <th className="px-3 py-2 text-left font-semibold text-foreground">
              {COLUMN_META[transform.column].label}
            </th>
            {transform.derivedKeys.map((k) => (
              <th
                key={k}
                className="px-3 py-2 text-left font-semibold text-accent"
              >
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {preview.map((row) => (
            <tr
              key={row.id}
              className="border-b border-border last:border-0"
            >
              <td className="px-3 py-2 font-mono text-muted">
                {transform.column === "price"
                  ? formatPrice(row[transform.column])
                  : String(row[transform.column])}
              </td>
              {transform.derivedKeys.map((k) => (
                <td
                  key={k}
                  className="px-3 py-2 font-mono bg-accent/5 text-foreground"
                >
                  {String(derivedCell(row, k))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   BIỂU ĐỒ SVG — minh hoạ log-transform nén long tail
   ──────────────────────────────────────────────────────────── */

function LogTransformChart() {
  const priceValues = [65_000, 125_000, 450_000, 1_200_000, 8_500_000];
  const maxRaw = Math.max(...priceValues);
  const logValues = priceValues.map((p) => Math.log1p(p));
  const maxLog = Math.max(...logValues);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-xl border border-border bg-surface/50 p-4">
        <p className="text-[11px] font-semibold text-tertiary uppercase tracking-wide mb-2">
          Trước: giá thô (VND)
        </p>
        <svg viewBox="0 0 280 140" className="w-full">
          {priceValues.map((p, i) => {
            const barH = (p / maxRaw) * 110;
            return (
              <g key={i}>
                <rect
                  x={20 + i * 50}
                  y={120 - barH}
                  width={32}
                  height={barH}
                  fill="#10b981"
                  opacity={0.75}
                  rx={3}
                />
                <text
                  x={36 + i * 50}
                  y={135}
                  textAnchor="middle"
                  fontSize={8}
                  fill="var(--text-secondary)"
                >
                  {p >= 1e6 ? `${(p / 1e6).toFixed(1)}M` : `${p / 1000}k`}
                </text>
              </g>
            );
          })}
        </svg>
        <p className="text-[11px] text-muted italic mt-1">
          Một hàng lấn át tất cả — outlier kéo hết trung bình.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface/50 p-4">
        <p className="text-[11px] font-semibold text-tertiary uppercase tracking-wide mb-2">
          Sau: log(1 + giá)
        </p>
        <svg viewBox="0 0 280 140" className="w-full">
          {logValues.map((v, i) => {
            const barH = (v / maxLog) * 110;
            return (
              <g key={i}>
                <rect
                  x={20 + i * 50}
                  y={120 - barH}
                  width={32}
                  height={barH}
                  fill="#0ea5e9"
                  opacity={0.85}
                  rx={3}
                />
                <text
                  x={36 + i * 50}
                  y={135}
                  textAnchor="middle"
                  fontSize={8}
                  fill="var(--text-secondary)"
                >
                  {v.toFixed(1)}
                </text>
              </g>
            );
          })}
        </svg>
        <p className="text-[11px] text-muted italic mt-1">
          Các cột đều đặn hơn — mô hình tuyến tính sẽ học ổn định.
        </p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   MINI VISUALS — binning, one-hot, aggregation
   ──────────────────────────────────────────────────────────── */

function BinningViz() {
  const bins = [
    { label: "rẻ", range: "< 200k", count: 2, color: "#10b981" },
    { label: "vừa", range: "200k – 1M", count: 1, color: "#0ea5e9" },
    { label: "khá", range: "1M – 5M", count: 1, color: "#a855f7" },
    { label: "cao", range: "> 5M", count: 1, color: "#ef4444" },
  ];
  return (
    <div className="rounded-xl border border-border bg-surface/50 p-4">
      <p className="text-[11px] font-semibold text-tertiary uppercase tracking-wide mb-3">
        Binning: biến giá liên tục thành nhóm
      </p>
      <div className="flex items-end gap-3 h-28">
        {bins.map((b) => (
          <div key={b.label} className="flex-1 flex flex-col items-center">
            <div
              className="w-full rounded-t-md"
              style={{
                height: `${b.count * 28}px`,
                backgroundColor: b.color,
                opacity: 0.8,
              }}
            />
            <span className="text-[10px] font-semibold text-foreground mt-1">
              {b.label}
            </span>
            <span className="text-[9px] text-tertiary">{b.range}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-muted italic mt-2">
        Một cột số liên tục → 4 nhóm có ý nghĩa. Mô hình học từ nhóm, không
        phải từng số lẻ.
      </p>
    </div>
  );
}

function OneHotViz() {
  const cats = ["food", "electronics", "fashion"];
  const rows = [
    { cat: "food", vec: [1, 0, 0] },
    { cat: "electronics", vec: [0, 1, 0] },
    { cat: "food", vec: [1, 0, 0] },
    { cat: "fashion", vec: [0, 0, 1] },
  ];
  return (
    <div className="rounded-xl border border-border bg-surface/50 p-4">
      <p className="text-[11px] font-semibold text-tertiary uppercase tracking-wide mb-3">
        One-hot: chuỗi → ma trận 0/1
      </p>
      <table className="w-full text-[11px]">
        <thead>
          <tr>
            <th className="text-left px-2 py-1 text-muted">category</th>
            {cats.map((c) => (
              <th
                key={c}
                className="text-center px-2 py-1 font-mono text-accent"
              >
                cat_{c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border">
              <td className="px-2 py-1 font-mono">{r.cat}</td>
              {r.vec.map((v, j) => (
                <td
                  key={j}
                  className={`text-center px-2 py-1 font-mono ${
                    v === 1
                      ? "bg-accent/20 text-accent font-bold"
                      : "text-muted"
                  }`}
                >
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DatetimeDecompViz() {
  const records = [
    {
      raw: "2025-05-31 08:15",
      hour: 8,
      dow: "T7",
      is_weekend: true,
      color: "#f59e0b",
    },
    {
      raw: "2025-06-02 12:40",
      hour: 12,
      dow: "T2",
      is_weekend: false,
      color: "#0ea5e9",
    },
    {
      raw: "2025-06-03 19:05",
      hour: 19,
      dow: "T3",
      is_weekend: false,
      color: "#10b981",
    },
  ];
  return (
    <div className="rounded-xl border border-border bg-surface/50 p-4">
      <p className="text-[11px] font-semibold text-tertiary uppercase tracking-wide mb-3">
        Datetime decomposition: 1 timestamp → 3 tín hiệu
      </p>
      <div className="space-y-2">
        {records.map((r, i) => (
          <div
            key={i}
            className="grid grid-cols-4 gap-2 items-center text-[11px]"
          >
            <span className="font-mono text-muted">{r.raw}</span>
            <span
              className="font-mono font-bold text-center rounded-md py-0.5"
              style={{
                backgroundColor: `${r.color}22`,
                color: r.color,
              }}
            >
              hour={r.hour}
            </span>
            <span className="font-mono text-center rounded-md py-0.5 bg-accent/10 text-accent">
              dow={r.dow}
            </span>
            <span
              className={`font-mono text-center rounded-md py-0.5 ${
                r.is_weekend
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                  : "bg-surface text-muted"
              }`}
            >
              weekend={r.is_weekend ? "✓" : "✗"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AggregationViz() {
  const users = [
    { id: "u1", tx: 3, mean: 180, rec: 1 },
    { id: "u2", tx: 12, mean: 2100, rec: 0 },
    { id: "u3", tx: 1, mean: 50, rec: 45 },
  ];
  return (
    <div className="rounded-xl border border-border bg-surface/50 p-4">
      <p className="text-[11px] font-semibold text-tertiary uppercase tracking-wide mb-3">
        Aggregation: gộp nhiều giao dịch → hành vi user
      </p>
      <table className="w-full text-[11px]">
        <thead>
          <tr>
            <th className="text-left px-2 py-1 text-muted">user_id</th>
            <th className="text-center px-2 py-1 text-accent">tx_count_30d</th>
            <th className="text-center px-2 py-1 text-accent">mean_amount</th>
            <th className="text-center px-2 py-1 text-accent">
              days_since_last
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-border">
              <td className="px-2 py-1 font-mono">{u.id}</td>
              <td className="text-center px-2 py-1 font-mono">{u.tx}</td>
              <td className="text-center px-2 py-1 font-mono">
                {u.mean.toLocaleString("vi-VN")}k
              </td>
              <td className="text-center px-2 py-1 font-mono">{u.rec}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[11px] text-muted italic mt-2">
        Mỗi hàng trước đây là 1 giao dịch → giờ là 1 user. Đây là RFM kinh
        điển trong e-commerce.
      </p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   QUIZ
   ──────────────────────────────────────────────────────────── */

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Bạn dự đoán ai sẽ đặt món trong 7 ngày tới. Feature nào sau đây KHÔNG hữu ích?",
    options: [
      "Số đơn trong 30 ngày gần nhất",
      "Mã khách hàng (user_id) dưới dạng số nguyên",
      "Số ngày kể từ lần mua cuối cùng",
      "Giá trị trung bình mỗi đơn của khách đó",
    ],
    correct: 1,
    explanation:
      "user_id là định danh ngẫu nhiên — không có quan hệ với hành vi. Đưa vào mô hình chỉ làm nó học nhiễu. Ba cái còn lại là bộ RFM (Recency, Frequency, Monetary) — kinh điển và cực mạnh cho bài toán dự đoán churn/tái mua.",
  },
  {
    question:
      "Cột 'ngày sinh' ở dạng chuỗi '1995-05-30'. Cách xử lý tốt nhất là gì?",
    options: [
      "Để nguyên chuỗi — mô hình tự hiểu",
      "Biến thành timestamp Unix rồi coi như số nguyên",
      "Tính tuổi và nhóm thế hệ (Gen Z, Millennial...) từ ngày sinh",
      "Bỏ cột này",
    ],
    correct: 2,
    explanation:
      "Ngày sinh thô không nói gì. Nhưng tuổi (số) và thế hệ (nhóm) là hai feature mạnh: người cùng thế hệ có sở thích tương tự. Đây là ví dụ kinh điển của datetime decomposition.",
  },
  {
    question:
      "Cột giá bán có phân phối rất lệch phải (vài giao dịch 100 triệu, đa số dưới 1 triệu). Trước khi đưa vào hồi quy tuyến tính, nên làm gì?",
    options: [
      "Để nguyên — hồi quy tuyến tính tự xử lý",
      "Áp dụng log(1 + price) để nén đuôi dài",
      "Chia cho 1000 để đỡ lớn",
      "Chỉ giữ các giao dịch dưới 1 triệu",
    ],
    correct: 1,
    explanation:
      "Phân phối log-normal là bệnh kinh điển của giá cả. log1p ép về gần Gaussian mà không đổi thứ tự, giúp MSE không bị outlier kéo. Tree-based (XGBoost) ít cần hơn vì chia bằng threshold.",
  },
  {
    question:
      "One-hot encoding cho cột 'quận' có 700 giá trị khác nhau. Vấn đề gì xảy ra?",
    options: [
      "Không sao — cứ thêm 700 cột",
      "Ma trận thưa, tốn bộ nhớ, và mỗi cột quá hiếm → mô hình dễ overfit. Nên cân nhắc target encoding hoặc gộp quận ít xuất hiện",
      "Mô hình sẽ chạy nhanh hơn vì nhiều cột",
      "Python sẽ báo lỗi",
    ],
    correct: 1,
    explanation:
      "Khi cardinality cao, one-hot tạo ra ma trận 700 cột 0/1 — tốn bộ nhớ và làm mỗi cột chỉ khác 0 ở vài hàng. Target encoding (thay category bằng mean của target trong category đó) hoặc entity embedding là giải pháp phổ biến hơn.",
  },
  {
    question:
      "Khẳng định nào về feature engineering là ĐÚNG nhất?",
    options: [
      "Thêm càng nhiều feature càng tốt",
      "Feature engineering chỉ cần thiết khi dùng deep learning",
      "Feature tốt + mô hình đơn giản thường thắng feature tệ + mô hình phức tạp",
      "Tree-based cần scaling giống linear",
    ],
    correct: 2,
    explanation:
      "'Garbage in, garbage out' — nguyên liệu quyết định món ăn. Andrew Ng ước tính 80% thời gian ML là feature engineering. Thêm feature vô tội vạ làm tăng chiều, tăng rủi ro overfit.",
  },
  {
    type: "fill-blank",
    question:
      "Biến đổi kết hợp hai feature như diện_tích × số_tầng thành feature mới gọi là {blank} feature.",
    blanks: [
      {
        answer: "interaction",
        accept: ["tương tác", "Interaction", "INTERACTION"],
      },
    ],
    explanation:
      "Interaction feature (đặc trưng tương tác) kết hợp hai feature để mô hình tuyến tính nắm được quan hệ phi cộng tính — điều mà tree-based, neural net tự học được, còn linear regression thì cần bạn làm tay.",
  },
];

/* ────────────────────────────────────────────────────────────
   COMPONENT CHÍNH
   ──────────────────────────────────────────────────────────── */

export default function FeatureEngineeringTopic() {
  return (
    <>
      {/* ━━━ BƯỚC 1 — HOOK / DỰ ĐOÁN ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử đoán">
        <PredictionGate
          question="Bạn có bảng dữ liệu khách hàng với cột 'Ngày sinh = 1995-05-30'. Mô hình học máy sẽ làm gì với con số này?"
          options={[
            "Hiểu được đây là tuổi 30 và nhóm Millennial",
            "Xem 1995-05-30 là một giá trị duy nhất, không liên quan gì đến 1995-05-29 hay 1996-05-30",
            "Tự động biến thành thế hệ (Gen Z, Millennial)",
            "Coi như số thứ tự theo thời gian",
          ]}
          correct={1}
          explanation="Mô hình thấy 1995-05-30 và 1995-05-29 là hai giá trị khác nhau — như hai từ ngẫu nhiên. Muốn mô hình học được 'tuổi 30 thích laptop hơn tuổi 60', bạn phải tự tay biến đổi: tính tuổi, gom thế hệ. Đó chính là feature engineering."
        >
          <div className="mt-4 rounded-xl border border-border bg-card p-5 space-y-3">
            <p className="text-sm text-foreground/85 leading-relaxed">
              Hãy nghĩ feature engineering như <strong>nấu ăn</strong>. Cá
              tươi, gạo ngon, rau sạch (feature tốt) thì bếp bình thường cũng
              nấu ra món ngon. Nguyên liệu hỏng thì đầu bếp giỏi cỡ nào cũng
              khó cứu. Andrew Ng từng nói 80% thời gian của dự án ML là chế
              biến dữ liệu — chỉ 20% là chạy mô hình.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <MiniTile
                icon={Calendar}
                title="Datetime → tuổi, giờ, ngày tuần"
                color="#0ea5e9"
              />
              <MiniTile
                icon={Coins}
                title="Giá thô → log, bin, scale"
                color="#10b981"
              />
              <MiniTile
                icon={Tag}
                title="Text / category → one-hot, TF-IDF"
                color="#a855f7"
              />
            </div>
          </div>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ BƯỚC 2 — ẨN DỤ / HIỂU BẰNG HÌNH ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Hiểu bằng hình">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Layers size={18} className="text-accent" /> Raw data và feature
            thực ra khác nhau thế nào?
          </h3>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Raw data là những gì người dùng đánh vào hoặc hệ thống log lại:
            ngày sinh, địa chỉ dài dòng, số tiền, nhãn danh mục dưới dạng chữ.
            Feature là phiên bản đã <strong>được mô hình hiểu</strong>: tuổi
            (số nguyên), quận (đã tách khỏi địa chỉ), log(giá), cột 0/1 cho
            mỗi danh mục.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide mb-2">
                Raw — mô hình KHÔNG hiểu
              </p>
              <div className="space-y-1 font-mono text-xs text-foreground/85">
                <p>dob = &quot;1995-05-30&quot;</p>
                <p>price = 8_500_000</p>
                <p>address = &quot;12 Nguyễn Huệ, Q1, TP HCM&quot;</p>
                <p>category = &quot;electronics&quot;</p>
              </div>
            </div>
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide mb-2">
                Sau khi engineer — mô hình ĐÃ hiểu
              </p>
              <div className="space-y-1 font-mono text-xs text-foreground/85">
                <p>age = 30, gen = &quot;Millennial&quot;</p>
                <p>log_price = 15.96, price_bin = &quot;cao&quot;</p>
                <p>city = &quot;TP HCM&quot;, district = &quot;Q1&quot;</p>
                <p>cat_electronics = 1, cat_food = 0</p>
              </div>
            </div>
          </div>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 3 — KHÁM PHÁ / PLAYGROUND ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <RawTablePlayground />

          <div className="mt-8 space-y-5">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <BarChart3 size={16} className="text-accent" /> Minh hoạ từng
              loại biến đổi
            </h4>
            <DatetimeDecompViz />
            <BinningViz />
            <OneHotViz />
            <AggregationViz />
            <LogTransformChart />
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 4 — AHA ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          <p>
            Mô hình không biết &ldquo;1995&rdquo; là năm, không biết
            &ldquo;electronics&rdquo; là danh mục, không biết
            &ldquo;Hoàn Kiếm&rdquo; là một quận đắt đỏ.
            <br />
            <br />
            <strong>Feature engineering là bước bạn dịch ngôn ngữ của con người sang ngôn ngữ của mô hình.</strong>{" "}
            Và đúng như nấu ăn, người dịch giỏi thường thắng người có bếp
            đắt tiền.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ━━━ BƯỚC 5 — THỬ THÁCH ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Bạn dự đoán liệu khách Shopee có mua hàng trong 7 ngày tới. Data có: user_id, giới tính, ngày đăng ký, danh sách đơn hàng gần đây (mỗi đơn có ngày, số tiền). Feature nào sẽ mạnh nhất?"
          options={[
            "user_id (đã có sẵn, khỏi làm gì)",
            "giới tính one-hot + ngày đăng ký dưới dạng chuỗi",
            "Số ngày từ đơn cuối, số đơn trong 30 ngày, chi trung bình mỗi đơn (RFM), + tuổi tài khoản",
            "Độ dài user_id tính bằng ký tự",
          ]}
          correct={2}
          explanation="RFM (Recency, Frequency, Monetary) là bộ ba feature kinh điển cho dự đoán hành vi mua. Thêm tuổi tài khoản (ngày đăng ký → số ngày) để phân biệt khách mới / khách lâu năm. user_id và độ dài chuỗi không phải feature — là định danh và nhiễu."
        />
      </LessonSection>

      {/* ━━━ BƯỚC 6 — GIẢI THÍCH ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích">
        <ExplanationSection topicSlug={metadata.slug}>
          <p className="leading-relaxed">
            Feature engineering xoay quanh ba câu hỏi: (1) mô hình cần loại
            tín hiệu nào, (2) raw data đang ở dạng gì, (3) phép biến đổi nào
            ép nó về dạng mô hình tiêu hoá được. Bốn nhóm dữ liệu phổ biến
            sau đây xuất hiện trong hầu hết bài toán công nghiệp, mỗi nhóm có
            bộ kỹ thuật riêng.
          </p>

          <TabView
            tabs={[
              {
                label: "Số (numerical)",
                content: <NumericalTab />,
              },
              {
                label: "Phân loại (categorical)",
                content: <CategoricalTab />,
              },
              {
                label: "Thời gian (datetime)",
                content: <DatetimeTab />,
              },
              {
                label: "Văn bản (text)",
                content: <TextTab />,
              },
            ]}
          />

          {/* Công thức 1: log transform */}
          <h4 className="text-sm font-semibold text-foreground mt-6 mb-2 flex items-center gap-2">
            <LineIcon size={14} className="text-accent" /> Công thức 1 —
            Log transform
          </h4>
          <p className="leading-relaxed text-sm">
            Khi một cột số có phân phối lệch phải mạnh (giá, thu nhập, lượt
            view), ta thường dùng log(1 + x) thay cho x. log1p an toàn với 0,
            và nén đuôi dài về gần đối xứng:
          </p>
          <LaTeX block>
            {"x' = \\log(1 + x)"}
          </LaTeX>
          <p className="text-xs text-muted leading-relaxed">
            Nói nôm na: 1 nghìn và 10 nghìn từng cách nhau 9 nghìn
            &rArr; sau log, khoảng cách chỉ còn ~2.3. Mô hình tuyến tính không
            bị một vài giao dịch 100 triệu nuốt chửng trung bình.
          </p>
          <LogTransformChart />

          {/* Công thức 2: target encoding */}
          <h4 className="text-sm font-semibold text-foreground mt-6 mb-2 flex items-center gap-2">
            <Grid3x3 size={14} className="text-accent" /> Công thức 2 —
            Target encoding có smoothing
          </h4>
          <p className="leading-relaxed text-sm">
            Khi category có quá nhiều giá trị (vài trăm quận), one-hot không
            còn hợp. Thay mỗi category bằng trung bình target tại category
            đó, pha thêm trung bình toàn cục để category hiếm không bị lệch:
          </p>
          <LaTeX block>
            {
              "\\hat{y}_{\\text{te}}(x) = \\frac{n_x \\cdot \\bar{y}_x + m \\cdot \\bar{y}}{n_x + m}"
            }
          </LaTeX>
          <p className="text-xs text-muted leading-relaxed">
            n<sub>x</sub> là số lần category x xuất hiện; ȳ<sub>x</sub> là
            trung bình target trong category; ȳ là trung bình toàn cục; m là
            &ldquo;sức mạnh prior&rdquo; (thường 10 – 30). Category xuất hiện
            nhiều &rArr; dùng giá trị riêng; category hiếm &rArr; kéo về
            trung bình toàn cục để chống overfit.
          </p>

          <Callout variant="warning" title="Cảnh báo: data leakage">
            Fit target encoder trên toàn bộ data TRƯỚC khi chia train/val sẽ
            làm target val rò rỉ vào train. Luôn fit encoder trên train fold,
            rồi transform val/test — đúng hệt cách bạn làm với{" "}
            <code>StandardScaler</code>.
          </Callout>

          <Callout variant="tip" title="Quy trình 5 bước đề xuất">
            <ol className="list-decimal pl-5 space-y-1 text-sm">
              <li>EDA: phân phối, NaN, correlation với target.</li>
              <li>Baseline với feature thô + encoding tối thiểu. Ghi metric.</li>
              <li>
                Thêm từng nhóm (datetime → categorical → text). Đo gain từng
                bước.
              </li>
              <li>Feature selection: bỏ cột importance thấp hoặc trùng.</li>
              <li>
                Đóng gói thành <code>sklearn.Pipeline</code> để tái lập và
                tránh leak.
              </li>
            </ol>
          </Callout>

          <CollapsibleDetail title="Vì sao tree-based ít cần scaling?">
            <p className="text-sm">
              Decision tree chia node bằng threshold (ví dụ: price &lt;
              500k). Thứ tự giá trị mới quan trọng, không phải scale. Do đó
              StandardScaler / MinMaxScaler là no-op với XGBoost, Random
              Forest, LightGBM. Ngược lại, hồi quy tuyến tính và neural net
              cộng weighted sum — nếu một feature có scale 1e6 và feature
              khác 0 – 1, gradient bị feature to đè, training mất ổn định.
            </p>
          </CollapsibleDetail>

          <p className="mt-4 text-sm leading-relaxed">
            Tiếp theo, xem feature engineering chạy thực tế trong bài{" "}
            <TopicLink slug="feature-engineering-in-fraud-detection">
              chống lừa đảo ngân hàng
            </TopicLink>{" "}
            — nơi mỗi feature đúng giúp bắt hàng trăm giao dịch gian lận/giây.
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 7 — TÓM TẮT ━━━ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="4 ý cần nhớ về feature engineering"
          points={[
            "Mô hình không hiểu chuỗi, không hiểu ngày, không hiểu địa chỉ dài. Bạn phải biến chúng thành số hoặc ma trận 0/1.",
            "Bốn nhóm kỹ thuật chính: numerical (log, bin, scale), categorical (one-hot, target encode), datetime (hour, dow, age), text (TF-IDF, embedding).",
            "Thêm feature vô tội vạ làm mô hình overfit. Thêm ít feature có ý nghĩa luôn thắng.",
            "Đóng gói toàn bộ pipeline bằng sklearn.Pipeline + ColumnTransformer để tránh leak và tái lập được.",
          ]}
        />
        <div className="mt-4">
          <Callout variant="tip" title="Xem ứng dụng thực tế">
            Stripe Radar biến 5 trường giao dịch thô thành hơn 1.000 feature
            để bắt gian lận trong &lt; 100 ms. Xem cách họ làm:{" "}
            <TopicLink slug="feature-engineering-in-fraud-detection">
              Feature engineering trong chống lừa đảo
            </TopicLink>
            .
          </Callout>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 8 — QUIZ ━━━ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
        <div className="mt-6 flex items-center justify-center">
          <div className="flex items-center gap-2 text-xs text-muted">
            <RefreshCw size={12} />
            Bạn có thể làm lại quiz bất cứ lúc nào.
          </div>
        </div>
      </LessonSection>
    </>
  );
}

/* ────────────────────────────────────────────────────────────
   MINI-HELPER COMPONENTS (local)
   ──────────────────────────────────────────────────────────── */

function MiniTile({
  icon: Icon,
  title,
  color,
}: {
  icon: typeof Calendar;
  title: string;
  color: string;
}) {
  return (
    <div
      className="rounded-xl border bg-card p-3 space-y-1"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <Icon size={14} style={{ color }} />
      <p className="text-xs text-foreground/85 leading-snug">{title}</p>
    </div>
  );
}

function NumericalTab() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground/85 leading-relaxed">
        Feature số là dễ nhất vì mô hình đã hiểu số. Nhưng &ldquo;hiểu&rdquo;
        không có nghĩa &ldquo;học tốt&rdquo; — bạn vẫn cần giúp bằng cách
        nén, chuẩn hoá, hoặc phân nhóm.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <MiniCard
          icon={Scale}
          title="Scaling"
          body="StandardScaler (mean 0, std 1) hoặc MinMax (0 – 1). Bắt buộc cho linear / neural net."
          color="#0ea5e9"
        />
        <MiniCard
          icon={LineIcon}
          title="Log / Box-Cox"
          body="Nén long tail (giá, thu nhập, view). Không đổi thứ tự, giảm ảnh hưởng outlier."
          color="#10b981"
        />
        <MiniCard
          icon={BarChart3}
          title="Binning"
          body="Chia số liên tục thành nhóm: tuổi → nhóm tuổi, giá → rẻ/vừa/cao."
          color="#a855f7"
        />
        <MiniCard
          icon={Grid3x3}
          title="Interaction"
          body="diện_tích × số_tầng = tổng diện tích sàn. Linear cần, tree-based tự học."
          color="#f59e0b"
        />
      </div>
      <CodeBlock
        language="python"
        title="numerical_fe.py"
      >
        {`import numpy as np, pandas as pd
from sklearn.preprocessing import StandardScaler

df["log_price"] = np.log1p(df["price"])
df["age_bin"] = pd.cut(
    df["age"],
    bins=[0, 18, 30, 45, 120],
)
scaler = StandardScaler()
df[["age_s", "log_price_s"]] = scaler.fit_transform(
    df[["age", "log_price"]]
)`}
      </CodeBlock>
    </div>
  );
}

function CategoricalTab() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground/85 leading-relaxed">
        Mô hình tuyến tính không hiểu chữ &mdash; phải chuyển về số. Tuỳ
        vào số giá trị (cardinality), bạn chọn kỹ thuật khác nhau.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <MiniCard
          icon={Grid3x3}
          title="One-hot"
          body="≤ 20 giá trị: mỗi category → 1 cột 0/1. Đơn giản, an toàn."
          color="#0ea5e9"
        />
        <MiniCard
          icon={Sparkles}
          title="Target encoding"
          body="Cardinality cao (quận, mã sản phẩm): thay category bằng mean(target). Cần smoothing."
          color="#a855f7"
        />
        <MiniCard
          icon={Tag}
          title="Frequency encoding"
          body="Thay category bằng tần suất xuất hiện. Đơn giản, mạnh cho tree-based."
          color="#10b981"
        />
        <MiniCard
          icon={Layers}
          title="Entity embedding"
          body="Học vector dày cho mỗi category bằng neural net. Dành cho cardinality cực cao."
          color="#f59e0b"
        />
      </div>
      <CodeBlock
        language="python"
        title="categorical_fe.py"
      >
        {`import pandas as pd
from category_encoders import TargetEncoder

onehot = pd.get_dummies(df["category"], prefix="cat")

te = TargetEncoder(smoothing=15)
df["district_te"] = te.fit_transform(
    df["district"], y_train,
)

freq = df["district"].value_counts(normalize=True)
df["district_freq"] = df["district"].map(freq)`}
      </CodeBlock>
    </div>
  );
}

function DatetimeTab() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground/85 leading-relaxed">
        Một timestamp chứa rất nhiều tín hiệu: giờ trong ngày, ngày trong
        tuần, mùa, chu kỳ. Đừng đưa datetime nguyên thuỷ vào mô hình — nó
        sẽ bối rối. Tách thành các tín hiệu cụ thể.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <MiniCard
          icon={Clock}
          title="Hour / day / month"
          body="hour cho rush hour, day_of_week cho cuối tuần, month cho mùa."
          color="#0ea5e9"
        />
        <MiniCard
          icon={RefreshCw}
          title="Sinusoidal"
          body="sin(2π·h/24), cos(2π·h/24) để 23h và 0h gần nhau (chu kỳ)."
          color="#10b981"
        />
        <MiniCard
          icon={LineIcon}
          title="Lag / rolling"
          body="y(t-1), rolling_mean_7: cho time series. Dùng shift() để tránh leak tương lai."
          color="#a855f7"
        />
        <MiniCard
          icon={Calendar}
          title="Event-based"
          body="days_since_last_purchase, days_to_next_holiday: mạnh cho churn."
          color="#f59e0b"
        />
      </div>
      <CodeBlock
        language="python"
        title="datetime_fe.py"
      >
        {`import numpy as np, pandas as pd

df["ts"] = pd.to_datetime(df["ts"])
df["hour"] = df["ts"].dt.hour
df["dow"] = df["ts"].dt.dayofweek
df["is_weekend"] = df["dow"].isin([5, 6]).astype(int)

df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)

df["rolling_7"] = df["y"].shift(1).rolling(7).mean()`}
      </CodeBlock>
    </div>
  );
}

function TextTab() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground/85 leading-relaxed">
        Text là loại dữ liệu khó nhất: không có thứ tự số, không có phân
        phối. Bạn phải vector hoá — biến mỗi đoạn text thành một vector cố
        định chiều.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <MiniCard
          icon={FileText}
          title="Bag of words"
          body="Đếm mỗi từ xuất hiện bao nhiêu lần. Đơn giản, mạnh cho baseline."
          color="#0ea5e9"
        />
        <MiniCard
          icon={Sparkles}
          title="TF-IDF"
          body="Nhân tần suất với inverse document frequency: phạt 'the', thưởng từ đặc trưng."
          color="#a855f7"
        />
        <MiniCard
          icon={Layers}
          title="Embeddings"
          body="sentence-BERT, OpenAI embeddings: vector 768/1024 chiều, ngữ nghĩa mạnh."
          color="#10b981"
        />
        <MiniCard
          icon={BarChart3}
          title="Meta features"
          body="Độ dài, số ký tự hoa, số dấu chấm than, sentiment score."
          color="#f59e0b"
        />
      </div>
      <CodeBlock
        language="python"
        title="text_fe.py"
      >
        {`from sklearn.feature_extraction.text import TfidfVectorizer

tfidf = TfidfVectorizer(
    ngram_range=(1, 2),
    max_features=200,
    lowercase=True,
    stop_words="english",
)
X_text = tfidf.fit_transform(df["description"])

df["desc_len"] = df["description"].str.len()
df["desc_words"] = df["description"].str.split().str.len()`}
      </CodeBlock>
    </div>
  );
}

function MiniCard({
  icon: Icon,
  title,
  body,
  color,
}: {
  icon: typeof Calendar;
  title: string;
  body: string;
  color: string;
}) {
  return (
    <div
      className="rounded-xl border bg-card p-4 space-y-1.5"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="flex items-center gap-2">
        <Icon size={14} style={{ color }} />
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      <p className="text-xs text-foreground/80 leading-relaxed">{body}</p>
    </div>
  );
}
