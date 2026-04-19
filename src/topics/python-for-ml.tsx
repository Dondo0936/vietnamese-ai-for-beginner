"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code2,
  Table2,
  Grid3x3,
  Sparkles,
  Filter,
  Layers,
  LineChart as LineChartIcon,
  Database,
  Zap,
  ArrowRight,
  TerminalSquare,
  CheckCircle2,
} from "lucide-react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  TabView,
  StepReveal,
  CollapsibleDetail,
  TopicLink,
  LaTeX,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "python-for-ml",
  title: "Python for Machine Learning",
  titleVi: "Python cho ML — NumPy & Pandas trong 45 phút",
  description:
    "Python không phải ngôn ngữ nhanh nhất, nhưng NumPy và Pandas biến nó thành lingua franca của ML. Bài này chỉ cho bạn đọc một đoạn code ML và biết nó đang làm gì.",
  category: "foundations",
  tags: ["python", "numpy", "pandas", "matplotlib", "tools"],
  difficulty: "beginner",
  relatedSlugs: [
    "data-preprocessing",
    "feature-engineering",
    "jupyter-colab-workflow",
  ],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

/* ────────────────────────────────────────────────────────────────────────
   VISUAL HELPERS — những khối SVG/bảng tái sử dụng cho từng CodeBlock.
   Mỗi khối là một miếng "kết quả mong đợi" đi kèm một đoạn code.
   ──────────────────────────────────────────────────────────────────────── */

interface OutputBoxProps {
  label?: string;
  children: React.ReactNode;
  tone?: "default" | "success" | "info";
}

function OutputBox({ label = "Kết quả", children, tone = "default" }: OutputBoxProps) {
  const border =
    tone === "success"
      ? "border-emerald-300 dark:border-emerald-700"
      : tone === "info"
        ? "border-sky-300 dark:border-sky-700"
        : "border-border";
  const bg =
    tone === "success"
      ? "bg-emerald-50/70 dark:bg-emerald-900/15"
      : tone === "info"
        ? "bg-sky-50/70 dark:bg-sky-900/15"
        : "bg-surface/60";
  return (
    <div className={`rounded-xl border ${border} ${bg} p-3 space-y-2`}>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-tertiary">
        <TerminalSquare size={11} />
        {label}
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function ArrayPills({ values, color = "#6366f1" }: { values: (number | string)[]; color?: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((v, i) => (
        <span
          key={i}
          className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 font-mono text-xs tabular-nums"
          style={{
            backgroundColor: color + "20",
            color,
            border: `1px solid ${color}55`,
          }}
        >
          {String(v)}
        </span>
      ))}
    </div>
  );
}

function MatrixGrid({ rows, color = "#10b981" }: { rows: number[][]; color?: string }) {
  return (
    <div className="inline-flex flex-col gap-1">
      {rows.map((row, r) => (
        <div key={r} className="flex gap-1">
          {row.map((v, c) => (
            <span
              key={c}
              className="flex h-8 w-10 items-center justify-center rounded-md font-mono text-xs tabular-nums"
              style={{
                backgroundColor: color + "22",
                color,
                border: `1px solid ${color}55`,
              }}
            >
              {v}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

function DataTable({
  columns,
  rows,
  highlightCol,
}: {
  columns: string[];
  rows: (string | number)[][];
  highlightCol?: number;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-xs">
        <thead className="bg-surface/80">
          <tr>
            {columns.map((c, i) => (
              <th
                key={i}
                className={`px-2.5 py-1.5 text-left font-semibold ${
                  highlightCol === i ? "text-accent" : "text-muted"
                }`}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border/70">
              {r.map((v, j) => (
                <td
                  key={j}
                  className={`px-2.5 py-1.5 font-mono tabular-nums ${
                    highlightCol === j
                      ? "bg-accent/5 text-accent-dark dark:text-accent"
                      : "text-foreground/85"
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

/* ────────────────────────────────────────────────────────────────────────
   NUMPY — các slice code ≤15 dòng kèm visual
   ──────────────────────────────────────────────────────────────────────── */

function NumpyCreate() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <CodeBlock language="python" title="Tạo array">
{`import numpy as np

a = np.array([1, 2, 3, 4, 5])
b = np.zeros(5)
c = np.ones(3)
d = np.arange(0, 10, 2)
e = np.linspace(0, 1, 5)

print(a)  # [1 2 3 4 5]
print(d)  # [0 2 4 6 8]
print(e)  # [0.   0.25 0.5  0.75 1.  ]`}
      </CodeBlock>
      <div className="space-y-2.5">
        <OutputBox label="a = np.array([1,2,3,4,5])">
          <ArrayPills values={[1, 2, 3, 4, 5]} color="#0ea5e9" />
        </OutputBox>
        <OutputBox label="d = np.arange(0, 10, 2)">
          <ArrayPills values={[0, 2, 4, 6, 8]} color="#22c55e" />
        </OutputBox>
        <OutputBox label="e = np.linspace(0, 1, 5)">
          <ArrayPills values={["0.00", "0.25", "0.50", "0.75", "1.00"]} color="#f59e0b" />
        </OutputBox>
        <p className="text-[11px] text-tertiary italic leading-relaxed">
          Bốn cách tạo phổ biến nhất. <code className="font-mono">arange</code> như{" "}
          <code className="font-mono">range()</code> của Python,{" "}
          <code className="font-mono">linspace</code> chia đều khoảng thành n điểm.
        </p>
      </div>
    </div>
  );
}

function NumpyShape() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <CodeBlock language="python" title="Shape & reshape">
{`import numpy as np

a = np.array([1, 2, 3, 4, 5, 6])
print(a.shape)   # (6,)  — 1 chiều, 6 phần tử

M = a.reshape(2, 3)
print(M.shape)   # (2, 3)
print(M)
# [[1 2 3]
#  [4 5 6]]

print(M.ndim)    # 2  — số chiều
print(M.size)    # 6  — tổng phần tử`}
      </CodeBlock>
      <div className="space-y-2.5">
        <OutputBox label="a — shape (6,)">
          <ArrayPills values={[1, 2, 3, 4, 5, 6]} color="#6366f1" />
        </OutputBox>
        <div className="flex items-center gap-2">
          <ArrowRight size={16} className="text-accent" />
          <span className="text-[11px] font-semibold text-accent">a.reshape(2, 3)</span>
        </div>
        <OutputBox label="M — shape (2, 3)">
          <MatrixGrid
            rows={[
              [1, 2, 3],
              [4, 5, 6],
            ]}
            color="#10b981"
          />
        </OutputBox>
        <p className="text-[11px] text-tertiary italic leading-relaxed">
          Cùng một &ldquo;ruột&rdquo; dữ liệu, chỉ đổi cách bạn &ldquo;nhìn&rdquo; nó. Tổng số phần tử không đổi:
          6 = 2 × 3.
        </p>
      </div>
    </div>
  );
}

function NumpyBroadcasting() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <CodeBlock language="python" title="Broadcasting — không cần vòng lặp">
{`import numpy as np

a = np.array([1, 2, 3, 4])
print(a * 2)         # [2 4 6 8]
print(a + 10)        # [11 12 13 14]

# Array + scalar OK.
# Array (4,) + array (4,) OK — cộng từng phần tử.
b = np.array([10, 20, 30, 40])
print(a + b)         # [11 22 33 44]

# Ma trận (3,4) + vector (4,) cũng OK.
M = np.ones((3, 4))
print((M + a).shape) # (3, 4)`}
      </CodeBlock>
      <div className="space-y-2.5">
        <OutputBox label="a * 2">
          <div className="flex items-center gap-2">
            <ArrayPills values={[1, 2, 3, 4]} color="#6366f1" />
            <span className="text-[11px] font-bold text-accent">× 2 =</span>
            <ArrayPills values={[2, 4, 6, 8]} color="#22c55e" />
          </div>
        </OutputBox>
        <OutputBox label="a + b (element-wise)">
          <div className="space-y-1">
            <ArrayPills values={[1, 2, 3, 4]} color="#6366f1" />
            <div className="text-[11px] font-bold text-accent pl-1">+</div>
            <ArrayPills values={[10, 20, 30, 40]} color="#ef4444" />
            <div className="text-[11px] font-bold text-accent pl-1">=</div>
            <ArrayPills values={[11, 22, 33, 44]} color="#10b981" />
          </div>
        </OutputBox>
        <p className="text-[11px] text-tertiary italic leading-relaxed">
          Không cần viết <code className="font-mono">for i in range(...)</code>. NumPy tự động phát
          (broadcast) giá trị nhỏ ra toàn mảng, chạy bằng C bên dưới — nhanh gấp trăm lần Python loop.
        </p>
      </div>
    </div>
  );
}

function NumpyUfuncs() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <CodeBlock language="python" title="Ufuncs & thống kê">
{`import numpy as np

a = np.array([3, 1, 4, 1, 5, 9, 2, 6])

print(np.mean(a))   # 3.875
print(np.std(a))    # 2.475
print(np.max(a))    # 9
print(np.min(a))    # 1
print(np.sum(a))    # 31

# Áp dụng hàm cho toàn array
print(np.sqrt(a))   # [1.73 1. 2. 1. 2.24 3. 1.41 2.45]
print(np.log(a + 1))

# Axis trên ma trận 2D
M = np.array([[1, 2, 3], [4, 5, 6]])
print(M.sum(axis=0))  # [5 7 9] — cộng theo cột`}
      </CodeBlock>
      <div className="space-y-2.5">
        <OutputBox label="a = [3, 1, 4, 1, 5, 9, 2, 6]">
          <ArrayPills values={[3, 1, 4, 1, 5, 9, 2, 6]} color="#6366f1" />
        </OutputBox>
        <OutputBox label="Thống kê một dòng" tone="success">
          <div className="grid grid-cols-5 gap-1.5 text-center">
            {[
              { l: "mean", v: "3.875" },
              { l: "std", v: "2.475" },
              { l: "max", v: "9" },
              { l: "min", v: "1" },
              { l: "sum", v: "31" },
            ].map((x) => (
              <div
                key={x.l}
                className="rounded-md border border-emerald-300 dark:border-emerald-700 bg-white/60 dark:bg-emerald-900/20 px-1 py-1.5"
              >
                <div className="text-[9px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  {x.l}
                </div>
                <div className="font-mono text-[11px] text-foreground tabular-nums">{x.v}</div>
              </div>
            ))}
          </div>
        </OutputBox>
        <OutputBox label="M.sum(axis=0) — cộng theo cột">
          <MatrixGrid
            rows={[
              [1, 2, 3],
              [4, 5, 6],
            ]}
            color="#6366f1"
          />
          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-accent font-semibold">
            <ArrowRight size={13} /> [5, 7, 9]
          </div>
        </OutputBox>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   PANDAS — các slice code ≤15 dòng kèm visual
   ──────────────────────────────────────────────────────────────────────── */

function PandasCreate() {
  const rows: (string | number)[][] = [
    ["An", 17, "10A", 8.5],
    ["Bình", 17, "10A", 7.0],
    ["Chi", 16, "10B", 9.0],
    ["Dung", 17, "10B", 6.5],
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <CodeBlock language="python" title="Tạo DataFrame">
{`import pandas as pd

df = pd.DataFrame({
    "ten":   ["An", "Bình", "Chi", "Dung"],
    "tuoi":  [17, 17, 16, 17],
    "lop":   ["10A", "10A", "10B", "10B"],
    "diem":  [8.5, 7.0, 9.0, 6.5],
})

print(df.shape)    # (4, 4)
print(df.columns)  # Index(['ten', 'tuoi', 'lop', 'diem'])
print(df.dtypes)   # object, int64, object, float64`}
      </CodeBlock>
      <div className="space-y-2.5">
        <OutputBox label="df — 4 hàng × 4 cột">
          <DataTable columns={["ten", "tuoi", "lop", "diem"]} rows={rows} />
        </OutputBox>
        <p className="text-[11px] text-tertiary italic leading-relaxed">
          DataFrame giống sheet Excel: mỗi cột một tên, một kiểu dữ liệu riêng (chuỗi, số nguyên,
          số thực). Mỗi cột dưới lòng là một NumPy array — đó là lý do mọi phép tính đều nhanh.
        </p>
      </div>
    </div>
  );
}

function PandasSelect() {
  const rows: (string | number)[][] = [
    ["An", 17, "10A", 8.5],
    ["Bình", 17, "10A", 7.0],
    ["Chi", 16, "10B", 9.0],
    ["Dung", 17, "10B", 6.5],
  ];
  const filtered: (string | number)[][] = [
    ["An", 17, "10A", 8.5],
    ["Chi", 16, "10B", 9.0],
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <CodeBlock language="python" title="Chọn cột & lọc hàng">
{`# Chọn 1 cột — trả về Series
ten = df["ten"]

# Chọn nhiều cột — trả về DataFrame
nhieu = df[["ten", "diem"]]

# Xem 5 hàng đầu
df.head()

# Lọc theo điều kiện (boolean mask)
gioi = df[df["diem"] >= 8.0]
print(gioi)

# Kết hợp nhiều điều kiện
lop_a_gioi = df[(df["lop"] == "10A") & (df["diem"] >= 8)]`}
      </CodeBlock>
      <div className="space-y-2.5">
        <OutputBox label="df[&quot;diem&quot;] — một Series" tone="info">
          <ArrayPills values={[8.5, 7.0, 9.0, 6.5]} color="#0ea5e9" />
        </OutputBox>
        <OutputBox label="df[df[&quot;diem&quot;] >= 8.0]" tone="success">
          <DataTable
            columns={["ten", "tuoi", "lop", "diem"]}
            rows={filtered}
            highlightCol={3}
          />
        </OutputBox>
        <p className="text-[11px] text-tertiary italic leading-relaxed">
          <code className="font-mono">df[&quot;diem&quot;] &gt;= 8.0</code> tạo ra một mảng True/False.
          Truyền mảng đó làm chỉ mục thì chỉ những hàng &ldquo;True&rdquo; được giữ lại — đây là
          boolean mask, &ldquo;vũ khí chính&rdquo; của Pandas.
        </p>
        <div className="flex flex-wrap gap-1 mt-1">
          {[
            { v: 8.5, keep: true },
            { v: 7.0, keep: false },
            { v: 9.0, keep: true },
            { v: 6.5, keep: false },
          ].map((x, i) => (
            <span
              key={i}
              className={`inline-flex h-6 items-center justify-center rounded-md px-2 font-mono text-[10px] tabular-nums ${
                x.keep
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500 line-through"
              }`}
            >
              {x.v} {x.keep ? "✓" : "✗"}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function PandasGroupby() {
  const grouped: (string | number)[][] = [
    ["10A", 7.75, 2],
    ["10B", 7.75, 2],
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <CodeBlock language="python" title="Groupby — PivotTable của Pandas">
{`# Nhóm theo lớp, tính trung bình + đếm
tb_theo_lop = df.groupby("lop")["diem"].mean()
print(tb_theo_lop)
# lop
# 10A    7.75
# 10B    7.75

# Nhiều phép cùng lúc
summary = df.groupby("lop").agg(
    diem_tb=("diem", "mean"),
    so_hs=("ten", "count"),
)
print(summary)`}
      </CodeBlock>
      <div className="space-y-2.5">
        <div className="rounded-xl border border-border bg-surface/40 p-3 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-tertiary">
            Trước: df thô
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[
              { ten: "An", lop: "10A", diem: 8.5 },
              { ten: "Bình", lop: "10A", diem: 7.0 },
              { ten: "Chi", lop: "10B", diem: 9.0 },
              { ten: "Dung", lop: "10B", diem: 6.5 },
            ].map((s, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 text-[11px]"
              >
                <span
                  className={`font-semibold ${
                    s.lop === "10A" ? "text-sky-600" : "text-violet-600"
                  }`}
                >
                  {s.lop}
                </span>
                <span className="text-muted">·</span>
                <span className="font-mono">{s.diem}</span>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1 pt-1 text-[11px] font-semibold text-accent">
            <Layers size={13} /> .groupby(&quot;lop&quot;)
          </div>
        </div>
        <OutputBox label="Sau: mỗi lớp → 1 dòng tổng hợp" tone="success">
          <DataTable
            columns={["lop", "diem_tb", "so_hs"]}
            rows={grouped}
            highlightCol={1}
          />
        </OutputBox>
      </div>
    </div>
  );
}

function PandasMerge() {
  const left: (string | number)[][] = [
    ["An", "10A"],
    ["Bình", "10A"],
    ["Chi", "10B"],
  ];
  const right: (string | number)[][] = [
    ["10A", "Cô Hoa"],
    ["10B", "Thầy Long"],
    ["10C", "Cô Mai"],
  ];
  const merged: (string | number)[][] = [
    ["An", "10A", "Cô Hoa"],
    ["Bình", "10A", "Cô Hoa"],
    ["Chi", "10B", "Thầy Long"],
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <CodeBlock language="python" title="Merge — nối 2 bảng">
{`import pandas as pd

hs = pd.DataFrame({
    "ten": ["An", "Bình", "Chi"],
    "lop": ["10A", "10A", "10B"],
})
gv = pd.DataFrame({
    "lop": ["10A", "10B", "10C"],
    "giao_vien": ["Cô Hoa", "Thầy Long", "Cô Mai"],
})

# Nối theo cột "lop" (inner join mặc định)
ket_qua = hs.merge(gv, on="lop", how="left")
print(ket_qua)`}
      </CodeBlock>
      <div className="space-y-2">
        <div className="flex gap-2 items-start flex-wrap">
          <OutputBox label="hs — bảng học sinh">
            <DataTable columns={["ten", "lop"]} rows={left} highlightCol={1} />
          </OutputBox>
          <div className="flex items-center justify-center h-24">
            <span className="text-xl font-bold text-accent">⨝</span>
          </div>
          <OutputBox label="gv — bảng giáo viên">
            <DataTable columns={["lop", "giao_vien"]} rows={right} highlightCol={0} />
          </OutputBox>
        </div>
        <OutputBox label="Kết quả — merge on &quot;lop&quot;" tone="success">
          <DataTable columns={["ten", "lop", "giao_vien"]} rows={merged} highlightCol={2} />
        </OutputBox>
        <p className="text-[11px] text-tertiary italic leading-relaxed">
          Mỗi hàng hs tìm hàng gv có cùng giá trị <code className="font-mono">lop</code> để gộp lại.
          Lớp 10C trong gv không có học sinh nào bên hs, nên bị bỏ qua (do dùng{" "}
          <code className="font-mono">how=&quot;left&quot;</code>).
        </p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   MINI-PIPELINE 3 BƯỚC — mô phỏng phân tích điểm học sinh
   ──────────────────────────────────────────────────────────────────────── */

function Step1LoadCSV() {
  const preview: (string | number)[][] = [
    [1, "An", "10A", 8.5, 8.0],
    [2, "Bình", "10A", 7.0, 8.5],
    [3, "Chi", "10B", 9.0, 8.0],
    [4, "Dung", "10B", 6.5, 9.0],
    [5, "Em", "10C", 7.5, 7.0],
  ];
  return (
    <div className="rounded-2xl border border-border bg-surface/40 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-xs font-bold text-white">
          1
        </span>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Nạp CSV vào DataFrame</h4>
          <p className="text-[11px] text-muted">
            <code className="font-mono">pd.read_csv</code> biến file phẳng thành bảng có cấu trúc.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <CodeBlock language="python" title="3 dòng — nạp và ngó nhanh">
{`import pandas as pd

df = pd.read_csv("diem_hoc_sinh.csv")
print(df.head())
# (500 hàng, 5 cột)`}
        </CodeBlock>
        <OutputBox label="df.head() — 5 hàng đầu" tone="info">
          <DataTable
            columns={["stt", "ten", "lop", "toan", "van"]}
            rows={preview}
          />
          <p className="mt-2 text-[11px] text-tertiary">
            500 hàng, 5 cột &mdash; <code className="font-mono">head()</code> chỉ hiển thị 5 hàng đầu.
          </p>
        </OutputBox>
      </div>
    </div>
  );
}

function Step2FilterGroupby() {
  const groupData = [
    { lop: "10A", diem: 7.75, count: 120, color: "#0ea5e9" },
    { lop: "10B", diem: 7.75, count: 135, color: "#10b981" },
    { lop: "10C", diem: 7.25, count: 110, color: "#f59e0b" },
    { lop: "10D", diem: 8.10, count: 135, color: "#a855f7" },
  ];
  const maxDiem = Math.max(...groupData.map((g) => g.diem));
  return (
    <div className="rounded-2xl border border-border bg-surface/40 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
          2
        </span>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Lọc học sinh giỏi rồi gom theo lớp</h4>
          <p className="text-[11px] text-muted">
            Filter + groupby — cặp đôi bạn sẽ gõ mỗi ngày trong phân tích dữ liệu.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <CodeBlock language="python" title="5 dòng — lọc & gom nhóm">
{`df["tb"] = (df["toan"] + df["van"]) / 2
gioi = df[df["tb"] >= 8.0]

summary = gioi.groupby("lop").agg(
    tb=("tb", "mean"),
    so_hs=("ten", "count"),
)`}
        </CodeBlock>
        <OutputBox label="summary — điểm TB mỗi lớp" tone="success">
          <div className="space-y-2">
            {groupData.map((g) => (
              <div key={g.lop} className="flex items-center gap-2">
                <span
                  className="w-10 rounded-md px-1 py-0.5 text-center font-mono text-[11px] font-bold tabular-nums"
                  style={{ backgroundColor: g.color + "22", color: g.color }}
                >
                  {g.lop}
                </span>
                <div className="flex-1 relative h-5 rounded-md bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(g.diem / maxDiem) * 100}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="absolute inset-y-0 left-0 rounded-md"
                    style={{ backgroundColor: g.color + "aa" }}
                  />
                  <span className="absolute inset-0 flex items-center justify-end pr-2 text-[10px] font-mono font-semibold text-foreground tabular-nums">
                    {g.diem.toFixed(2)}
                  </span>
                </div>
                <span className="w-14 text-right text-[10px] text-muted tabular-nums">
                  n={g.count}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-tertiary italic leading-relaxed">
            Một bảng 500 hàng biến thành 4 dòng tổng hợp &mdash; có thể in ra báo cáo ngay.
          </p>
        </OutputBox>
      </div>
    </div>
  );
}

function Step3Plot() {
  const bars = [
    { bin: "5-6", count: 8 },
    { bin: "6-7", count: 52 },
    { bin: "7-8", count: 168 },
    { bin: "8-9", count: 192 },
    { bin: "9-10", count: 80 },
  ];
  const maxC = Math.max(...bars.map((b) => b.count));
  return (
    <div className="rounded-2xl border border-border bg-surface/40 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
          3
        </span>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Vẽ phân phối bằng Matplotlib</h4>
          <p className="text-[11px] text-muted">
            4 dòng code đủ ra một biểu đồ histogram đẹp.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <CodeBlock language="python" title="4 dòng — dựng histogram">
{`import matplotlib.pyplot as plt

plt.hist(df["tb"], bins=5, color="#6366f1", edgecolor="white")
plt.xlabel("Điểm trung bình"); plt.ylabel("Số học sinh")
plt.title("Phân phối điểm — 500 học sinh")
plt.show()`}
        </CodeBlock>
        <OutputBox label="Biểu đồ hiển thị khi plt.show() chạy" tone="info">
          <svg viewBox="0 0 320 180" className="w-full">
            <line x1={34} y1={10} x2={34} y2={150} stroke="var(--border)" strokeWidth={1} />
            <line x1={34} y1={150} x2={310} y2={150} stroke="var(--border)" strokeWidth={1} />
            {[0, 50, 100, 150, 200].map((t, i) => {
              const y = 150 - (t / maxC) * 130;
              return (
                <g key={i}>
                  <line
                    x1={34}
                    y1={y}
                    x2={310}
                    y2={y}
                    stroke="var(--border)"
                    strokeWidth={0.4}
                    strokeDasharray="2,3"
                    opacity={0.5}
                  />
                  <text x={30} y={y + 3} textAnchor="end" fontSize={8} fill="var(--text-tertiary)">
                    {t}
                  </text>
                </g>
              );
            })}
            {bars.map((b, i) => {
              const barWidth = 48;
              const gap = 6;
              const xBase = 40 + i * (barWidth + gap);
              const h = (b.count / maxC) * 130;
              return (
                <g key={b.bin}>
                  <motion.rect
                    initial={{ height: 0, y: 150 }}
                    animate={{ height: h, y: 150 - h }}
                    transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
                    x={xBase}
                    width={barWidth}
                    rx={3}
                    fill="#6366f1"
                    opacity={0.85}
                  />
                  <text
                    x={xBase + barWidth / 2}
                    y={165}
                    textAnchor="middle"
                    fontSize={9}
                    fill="var(--text-secondary)"
                  >
                    {b.bin}
                  </text>
                  <text
                    x={xBase + barWidth / 2}
                    y={150 - h - 3}
                    textAnchor="middle"
                    fontSize={9}
                    fill="#6366f1"
                    fontWeight={600}
                  >
                    {b.count}
                  </text>
                </g>
              );
            })}
            <text x={172} y={178} textAnchor="middle" fontSize={9} fill="var(--text-tertiary)">
              Điểm trung bình
            </text>
          </svg>
          <p className="mt-1 text-[11px] text-tertiary italic leading-relaxed text-center">
            Phân phối &ldquo;đỉnh ở giữa&rdquo; điển hình &mdash; đa số học sinh đạt 7-9 điểm.
          </p>
        </OutputBox>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   QUIZ
   ──────────────────────────────────────────────────────────────────────── */

const quizQuestions: QuizQuestion[] = [
  {
    question: "numpy.array([1, 2, 3, 4, 5, 6]).reshape(2, 3).shape trả về giá trị gì?",
    options: ["(6,)", "(2, 3)", "(3, 2)", "Lỗi vì không thể reshape"],
    correct: 1,
    explanation:
      "reshape(2, 3) yêu cầu mảng có 2 hàng × 3 cột = 6 phần tử — khớp với 6 phần tử ban đầu, nên hợp lệ. shape trả về (2, 3). Nếu bạn muốn (3, 2) thì phải gọi reshape(3, 2).",
  },
  {
    question:
      "Trong Pandas, df[df[\"diem\"] >= 8.0] làm gì?",
    options: [
      "Sắp xếp cột diem theo thứ tự tăng dần",
      "Tạo boolean mask rồi giữ lại các hàng có diem ≥ 8.0",
      "Xóa các hàng có diem nhỏ hơn 8.0 khỏi df",
      "Cộng 8.0 vào mỗi giá trị trong cột diem",
    ],
    correct: 1,
    explanation:
      "df[\"diem\"] >= 8.0 trả về Series gồm True/False cho từng hàng. Truyền Series đó làm chỉ mục cho df thì chỉ những hàng True được giữ — đây là boolean mask. df gốc không đổi, kết quả là một DataFrame mới.",
  },
  {
    question:
      "Python thuần mất 2 giây để bình phương 10 triệu số bằng for-loop. NumPy làm cùng việc đó mất bao lâu (xấp xỉ)?",
    options: [
      "Khoảng 2 giây — tốc độ tương đương",
      "Khoảng 0,01 giây — nhanh hơn ~200 lần nhờ vectorization",
      "Khoảng 20 giây — chậm hơn vì overhead import",
      "Không so sánh được — hai thư viện làm việc khác nhau",
    ],
    correct: 1,
    explanation:
      "NumPy lưu dữ liệu liên tiếp trong RAM và gọi code C đã biên dịch, không phải quay vòng trong Python interpreter. Với 10 triệu phần tử, bạn thường thấy 100–200 lần nhanh hơn. Đây là lý do mọi thư viện ML (scikit-learn, PyTorch, TensorFlow) đều xây trên nền NumPy.",
  },
  {
    question: "Broadcasting trong NumPy hoạt động thế nào khi bạn viết a + 10 với a có shape (4,)?",
    options: [
      "Lỗi — không thể cộng mảng với số",
      "Tạo array [10, 10, 10, 10] rồi cộng từng phần tử — kết quả shape (4,)",
      "Biến 10 thành list rồi nối vào cuối a — kết quả shape (5,)",
      "Trả về tổng của tất cả phần tử cộng 10",
    ],
    correct: 1,
    explanation:
      "Broadcasting là quy tắc cho phép NumPy &ldquo;phát&rdquo; scalar hoặc mảng nhỏ ra khớp shape của mảng lớn. Về mặt logic, 10 được coi như [10, 10, 10, 10] rồi cộng element-wise. Trên thực tế NumPy không tạo mảng phụ — nó chỉ duyệt vòng lặp C cộng 10 vào từng ô, rất tiết kiệm bộ nhớ.",
  },
  {
    question:
      "df.groupby(\"lop\").agg(tb=(\"diem\", \"mean\")) trả về cái gì?",
    options: [
      "Một số duy nhất — điểm trung bình toàn bảng",
      "DataFrame mới với index là các giá trị của cột &ldquo;lop&rdquo;, cột &ldquo;tb&rdquo; là mean(diem) của mỗi nhóm",
      "Danh sách các lớp đã xuất hiện trong df",
      "Sắp xếp df theo cột &ldquo;lop&rdquo; rồi theo &ldquo;diem&rdquo;",
    ],
    correct: 1,
    explanation:
      "groupby chia df thành các nhóm dựa trên giá trị cột &ldquo;lop&rdquo;. agg áp dụng phép &ldquo;mean&rdquo; lên cột &ldquo;diem&rdquo; cho mỗi nhóm, đặt tên kết quả là &ldquo;tb&rdquo;. Kết quả là DataFrame nhỏ gọn, mỗi hàng là một lớp, mỗi cột là một số liệu tổng hợp — đây là PivotTable của Pandas.",
  },
  {
    question:
      "Khi bạn viết hs.merge(gv, on=\"lop\", how=\"left\"), cái gì quyết định các hàng xuất hiện trong kết quả?",
    options: [
      "Số hàng của bảng bên phải (gv)",
      "Số hàng của bảng bên trái (hs) — hs giữ nguyên mọi hàng, gv nối vào theo cột &ldquo;lop&rdquo;",
      "Tổng số hàng của hs và gv cộng lại",
      "Giao (intersection) của hai bảng — chỉ hàng nào có &ldquo;lop&rdquo; ở cả hai",
    ],
    correct: 1,
    explanation:
      "how=&quot;left&quot; giữ mọi hàng của bảng bên trái, và tìm hàng khớp bên phải dựa trên cột chỉ định. Hàng nào bên hs không có match bên gv thì các cột mới sẽ là NaN — không bị xóa. Nếu đổi sang how=&quot;inner&quot; thì chỉ giữ hàng nào có match cả hai.",
  },
];

/* ────────────────────────────────────────────────────────────────────────
   TRANG CHÍNH
   ──────────────────────────────────────────────────────────────────────── */

type NumpyTab = "create" | "shape" | "broadcast" | "ufuncs";
type PandasTab = "create" | "select" | "groupby" | "merge";

export default function PythonForMlTopic() {
  const [numpyTab, setNumpyTab] = useState<NumpyTab>("create");
  const [pandasTab, setPandasTab] = useState<PandasTab>("create");

  const numpyTabs = useMemo(
    () =>
      [
        { key: "create" as const, label: "Tạo array", icon: Sparkles },
        { key: "shape" as const, label: "Shape & reshape", icon: Grid3x3 },
        { key: "broadcast" as const, label: "Broadcasting", icon: Zap },
        { key: "ufuncs" as const, label: "Ufuncs & thống kê", icon: LineChartIcon },
      ],
    [],
  );

  const pandasTabs = useMemo(
    () =>
      [
        { key: "create" as const, label: "Tạo DataFrame", icon: Table2 },
        { key: "select" as const, label: "Lọc & chọn", icon: Filter },
        { key: "groupby" as const, label: "Groupby", icon: Layers },
        { key: "merge" as const, label: "Merge", icon: Database },
      ],
    [],
  );

  return (
    <>
      {/* ━━━ BƯỚC 1 — HOOK / DỰ ĐOÁN ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-3 mb-5">
          <div className="flex items-center gap-2">
            <Code2 size={18} className="text-accent" />
            <h3 className="text-base font-semibold text-foreground">
              Python chậm. Nhưng người ta vẫn dùng nó cho ML. Vì sao?
            </h3>
          </div>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Python <strong>không phải</strong> ngôn ngữ nhanh nhất &mdash; chạy một vòng lặp
            bằng Python thuần chậm hơn C khoảng 100 lần. Nhưng nó có <strong>hai thư viện</strong>
            {" "}biến nó thành ngôn ngữ chung của ML:{" "}
            <span className="font-semibold text-sky-600 dark:text-sky-400">NumPy</span>
            {" "}(mảng số tốc độ C) và{" "}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Pandas</span>
            {" "}(bảng dữ liệu như Excel có siêu năng lực). Mỗi khi bạn đọc một đoạn code ML trên
            GitHub, 80% là NumPy + Pandas. Hiểu hai cái này, bạn đọc được hầu hết mọi repo ML.
          </p>
        </div>
        <PredictionGate
          question="Bạn có bảng điểm 500 học sinh gồm 5 cột. Nhiệm vụ: tính trung bình từng lớp, lọc học sinh điểm ≥ 8, vẽ histogram phân phối điểm. Công cụ phù hợp nhất?"
          options={[
            "Excel — mở file, dùng PivotTable, tạo chart. Quen thuộc và đủ dùng.",
            "Python thuần — viết for-loop cho từng phép tính. Linh hoạt tuyệt đối.",
            "NumPy + Pandas + Matplotlib — bộ ba tiêu chuẩn của data science.",
            "Lập trình C từ đầu — tốc độ tối đa, không phụ thuộc thư viện ngoài.",
          ]}
          correct={2}
          explanation="500 hàng thì Excel còn OK, nhưng scale lên 5 triệu hàng là Excel 'chết'. Python thuần chạy được nhưng for-loop chậm hơn NumPy 100–200 lần. C nhanh nhưng viết code dài dòng gấp 20 lần. NumPy + Pandas + Matplotlib: đọc CSV 1 dòng, lọc 1 dòng, groupby 1 dòng, vẽ 1 dòng — 4 dòng thay vì 200. Đó là lý do cả ngành ML đều dùng bộ ba này."
        >
          <p className="text-sm text-muted mt-4 leading-relaxed">
            Trong phần dưới, bạn sẽ thấy cùng một tác vụ mà NumPy rút gọn vòng lặp 20 dòng xuống
            1 dòng, và Pandas rút gọn PivotTable Excel xuống 1 câu lệnh. Không phải ma thuật —
            chỉ là vectorization và API thiết kế tốt.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ BƯỚC 2 — REVEAL — CODE PLAYGROUND ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <p className="text-sm text-muted mb-4 leading-relaxed">
            Chọn một thư viện ở tab, rồi chọn một thao tác. Code bên trái, kết quả mong đợi bên
            phải &mdash; không cần cài Python để học.
          </p>

          <TabView
            tabs={[
              {
                label: "NumPy — mảng số",
                content: (
                  <div className="space-y-4">
                    <p className="text-xs text-muted">
                      NumPy cung cấp <code className="font-mono">ndarray</code> &mdash; mảng N chiều
                      chứa số, lưu liên tiếp trong bộ nhớ, tính toán bằng C. Nền tảng của PyTorch,
                      TensorFlow, scikit-learn.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {numpyTabs.map((t) => {
                        const Icon = t.icon;
                        const active = t.key === numpyTab;
                        return (
                          <button
                            key={t.key}
                            type="button"
                            onClick={() => setNumpyTab(t.key)}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                              active
                                ? "border-accent bg-accent text-white"
                                : "border-border bg-card text-muted hover:border-accent/50 hover:text-foreground"
                            }`}
                          >
                            <Icon size={12} />
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={numpyTab}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.25 }}
                      >
                        {numpyTab === "create" && <NumpyCreate />}
                        {numpyTab === "shape" && <NumpyShape />}
                        {numpyTab === "broadcast" && <NumpyBroadcasting />}
                        {numpyTab === "ufuncs" && <NumpyUfuncs />}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                ),
              },
              {
                label: "Pandas — bảng dữ liệu",
                content: (
                  <div className="space-y-4">
                    <p className="text-xs text-muted">
                      Pandas xây trên NumPy, thêm nhãn cho hàng và cột. <code className="font-mono">DataFrame</code>
                      {" "}= bảng Excel có siêu năng lực: đọc CSV 1 dòng, lọc 1 dòng, groupby 1 dòng.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {pandasTabs.map((t) => {
                        const Icon = t.icon;
                        const active = t.key === pandasTab;
                        return (
                          <button
                            key={t.key}
                            type="button"
                            onClick={() => setPandasTab(t.key)}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                              active
                                ? "border-accent bg-accent text-white"
                                : "border-border bg-card text-muted hover:border-accent/50 hover:text-foreground"
                            }`}
                          >
                            <Icon size={12} />
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={pandasTab}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.25 }}
                      >
                        {pandasTab === "create" && <PandasCreate />}
                        {pandasTab === "select" && <PandasSelect />}
                        {pandasTab === "groupby" && <PandasGroupby />}
                        {pandasTab === "merge" && <PandasMerge />}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                ),
              },
            ]}
          />

          <Callout variant="insight" title="Tại sao chia nhỏ từng thao tác?">
            Mỗi đoạn code trên chỉ làm <strong>một việc</strong> và kết quả của nó hiện ngay
            bên cạnh. Đây là cách đọc code ML thực tế: bạn không cần hiểu cả script 300 dòng &mdash;
            bạn nhận ra từng miếng nhỏ (tạo array, lọc, groupby) rồi ghép chúng lại.
          </Callout>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 3 — DEEPEN — PIPELINE 3 BƯỚC ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Phân tích thật">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-base font-semibold text-foreground mb-1">
            Phân tích thực tế — 3 bước, 12 dòng code
          </h3>
          <p className="text-sm text-muted mb-5 leading-relaxed">
            Mỗi bước dưới đây là một câu hỏi kinh doanh + code + kết quả trực quan. Bấm{" "}
            <strong>Tiếp tục</strong> để lần lượt mở ra từng bước &mdash; giống như bạn đang viết
            code trong Jupyter notebook.
          </p>
          <StepReveal
            labels={[
              "Bước 1: Nạp CSV",
              "Bước 2: Lọc + groupby",
              "Bước 3: Vẽ biểu đồ",
            ]}
          >
            {[
              <Step1LoadCSV key="s1" />,
              <Step2FilterGroupby key="s2" />,
              <Step3Plot key="s3" />,
            ]}
          </StepReveal>
          <Callout variant="tip" title="Đây là pipeline thật, không phải mô phỏng">
            Hầu hết mọi dự án ML trong thực tế đều bắt đầu bằng 3 bước này: <strong>load</strong>
            {" "}&rArr; <strong>clean/transform</strong> &rArr; <strong>visualize</strong>. Chỉ
            khác là dataset có thể là 5 triệu hàng thay vì 500, và cột có thể là 200 thay vì 5.
            Cú pháp không đổi.
          </Callout>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 4 — CHALLENGE ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-surface/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-tertiary mb-2">
              Mảng trong câu hỏi
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-[11px]">
                <div className="text-muted mb-1">a shape (3,)</div>
                <ArrayPills values={[1, 2, 3]} color="#0ea5e9" />
              </div>
              <span className="text-accent font-bold text-lg">+</span>
              <div className="text-[11px]">
                <div className="text-muted mb-1">M shape (2, 3)</div>
                <MatrixGrid
                  rows={[
                    [10, 10, 10],
                    [20, 20, 20],
                  ]}
                  color="#f59e0b"
                />
              </div>
              <span className="text-accent font-bold text-lg">=</span>
              <span className="text-muted text-sm">?</span>
            </div>
          </div>
          <InlineChallenge
            question="NumPy broadcasting: a = np.array([1, 2, 3]) có shape (3,). M = np.array([[10,10,10],[20,20,20]]) có shape (2, 3). a + M sẽ cho shape gì và giá trị ra sao?"
            options={[
              "Lỗi ValueError — shape (3,) không broadcast được với (2, 3)",
              "Shape (2, 3), giá trị [[11,12,13],[21,22,23]] — a được phát ra thành 2 hàng",
              "Shape (3,), giá trị [11,22,33] — chỉ lấy đường chéo",
              "Shape (6,), giá trị [11,12,13,20,20,20] — nối 2 mảng lại",
            ]}
            correct={1}
            explanation="Quy tắc broadcasting: so sánh shape từ phải sang trái. a là (3,), M là (2, 3). Chiều cuối cùng khớp (3 = 3). Chiều còn lại của a thiếu thì được 'thêm' bằng 1 — a được coi như shape (1, 3), sau đó phát ra (2, 3) bằng cách lặp hàng. Kết quả: [[1+10, 2+10, 3+10], [1+20, 2+20, 3+20]] = [[11,12,13],[21,22,23]]. Broadcasting chỉ hoạt động khi mỗi chiều hoặc bằng nhau, hoặc một trong hai bằng 1."
          />
          <Callout variant="warning" title="Quy tắc broadcasting — học thuộc 3 câu này">
            (1) So sánh shape từ <strong>phải sang trái</strong>. (2) Hai chiều tương thích khi{" "}
            <strong>bằng nhau</strong> hoặc <strong>một trong hai bằng 1</strong>. (3) Chiều
            thiếu được coi là 1. Nếu không thỏa cả 3 &rarr; <code className="font-mono">ValueError</code>.
          </Callout>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 5 — AHA ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Khoảnh khắc hiểu">
        <AhaMoment>
          <p>
            Đọc một đoạn code ML không phải là đọc từng dòng một. Bạn nhận ra{" "}
            <strong>những miếng nhỏ quen thuộc</strong>: &ldquo;À, đây là tạo array&rdquo;, &ldquo;À,
            đây là groupby&rdquo;, &ldquo;À, đây là vẽ biểu đồ&rdquo; &mdash; rồi ghép lại.
          </p>
          <p className="mt-3">
            Cả bộ sinh thái ML hiện đại chỉ là <strong>NumPy + Pandas + Matplotlib</strong>, đi
            kèm một vài thư viện model (scikit-learn, PyTorch...). Mỗi thư viện model đều nhận
            NumPy array làm đầu vào và trả NumPy array ra đầu ra. Bạn không cần biết hết &mdash;
            bạn chỉ cần <em>biết đủ để đọc</em>.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ━━━ BƯỚC 6 — EXPLAIN ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích">
        <ExplanationSection topicSlug={metadata.slug}>
          <p className="leading-relaxed">
            Phần này tổng hợp <strong>4 mẹo thực hành</strong> và <strong>bảng cheat sheet</strong>
            {" "}của ba thư viện. Lưu lại (bookmark) để tra khi cần, chứ không cần nhớ ngay.
          </p>

          <h4 className="text-sm font-semibold text-foreground mt-4 mb-2">
            4 thói quen của một người viết code ML tốt
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                icon: CheckCircle2,
                color: "#0ea5e9",
                title: "Tránh for-loop cho số",
                body: "Nếu bạn đang viết for-loop để cộng/nhân/tính array, 99% trường hợp có cách NumPy làm ngắn gọn và nhanh hơn 100 lần.",
              },
              {
                icon: CheckCircle2,
                color: "#10b981",
                title: "Đặt head / info / describe ngay khi load",
                body: "Ba dòng này luôn chạy trước khi bạn làm bất cứ thứ gì khác. Nó cho bạn biết kiểu dữ liệu, số hàng, missing values.",
              },
              {
                icon: CheckCircle2,
                color: "#f59e0b",
                title: "Dùng .copy() khi cần",
                body: "df2 = df[df['diem'] >= 8] đôi khi là 'view' — sửa df2 cũng sửa df gốc. Thêm .copy() để tránh bug thầm lặng.",
              },
              {
                icon: CheckCircle2,
                color: "#ef4444",
                title: "Đặt seed khi có ngẫu nhiên",
                body: "np.random.seed(42) để kết quả lặp lại được. Không có seed, mỗi lần chạy ra một con số khác — không debug được.",
              },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <div
                  key={t.title}
                  className="rounded-xl border bg-card p-4 space-y-1.5"
                  style={{ borderLeft: `4px solid ${t.color}` }}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={16} style={{ color: t.color }} />
                    <span className="text-sm font-semibold text-foreground">{t.title}</span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">{t.body}</p>
                </div>
              );
            })}
          </div>

          <h4 className="text-sm font-semibold text-foreground mt-6 mb-2">
            Vectorization — &ldquo;phép màu&rdquo; dưới lòng NumPy
          </h4>
          <p className="leading-relaxed">
            Khi bạn viết <code className="font-mono">a + b</code> với hai array NumPy có shape
            {" "}<code className="font-mono">(n,)</code>, NumPy sẽ chạy một vòng lặp C:
          </p>
          <LaTeX block>{"c_i = a_i + b_i \\quad \\text{for } i = 0, 1, \\dots, n-1"}</LaTeX>
          <p className="leading-relaxed text-sm">
            Nghĩa là: lấy phần tử thứ i của a cộng phần tử thứ i của b, lưu vào c. Công việc
            giống y hệt for-loop Python, <em>nhưng</em> code C đã biên dịch trước, không có
            overhead của Python interpreter &mdash; nhanh hơn khoảng 100 lần. Tương tự với
            <code className="font-mono"> np.sqrt(a)</code>, <code className="font-mono">a * 2</code>,
            <code className="font-mono"> a @ b</code> (nhân ma trận):
          </p>
          <LaTeX block>
            {"(A \\cdot B)_{ij} = \\sum_{k=0}^{n-1} A_{ik} \\, B_{kj}"}
          </LaTeX>
          <p className="leading-relaxed text-sm">
            Tất cả vòng lặp bên trong đều chạy bằng C, không phải Python. Bạn chỉ cần viết 1
            dòng; NumPy lo phần còn lại.
          </p>

          <h4 className="text-sm font-semibold text-foreground mt-6 mb-2">
            Cheat sheet &mdash; 15 lệnh dùng nhiều nhất
          </h4>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-xs">
              <thead className="bg-surface/80">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-muted w-24">Thư viện</th>
                  <th className="px-3 py-2 text-left font-semibold text-muted">Lệnh</th>
                  <th className="px-3 py-2 text-left font-semibold text-muted">Dùng khi nào</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["NumPy", "np.array(list)", "Biến list Python thành array"],
                  ["NumPy", "np.arange(n) / np.linspace(a,b,n)", "Tạo dãy số đều"],
                  ["NumPy", "a.reshape(r, c)", "Đổi shape không đổi dữ liệu"],
                  ["NumPy", "a.mean() / .std() / .sum()", "Thống kê nhanh"],
                  ["NumPy", "a[a > 5]", "Lọc bằng boolean mask"],
                  ["Pandas", "pd.read_csv('file.csv')", "Nạp file CSV vào DataFrame"],
                  ["Pandas", "df.head() / .info() / .describe()", "Ba lệnh đầu tiên với dataset mới"],
                  ["Pandas", "df['col']", "Chọn 1 cột (ra Series)"],
                  ["Pandas", "df[df['x'] > 5]", "Lọc hàng theo điều kiện"],
                  ["Pandas", "df.groupby('x').agg(...)", "Tổng hợp theo nhóm (PivotTable)"],
                  ["Pandas", "a.merge(b, on='key')", "Nối 2 bảng theo cột chung"],
                  ["Pandas", "df.dropna()", "Xóa hàng có giá trị thiếu"],
                  ["Matplotlib", "plt.plot(x, y)", "Đường line (loss, accuracy)"],
                  ["Matplotlib", "plt.hist(a, bins=20)", "Phân phối của một biến"],
                  ["Matplotlib", "plt.scatter(x, y)", "Quan hệ giữa hai biến"],
                ].map((row, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-3 py-1.5 font-semibold text-accent">{row[0]}</td>
                    <td className="px-3 py-1.5 font-mono text-[11px] text-foreground">{row[1]}</td>
                    <td className="px-3 py-1.5 text-muted">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <CollapsibleDetail title="Vì sao cột trong DataFrame là NumPy array?">
            <p className="text-sm leading-relaxed">
              Pandas xây <strong>trên</strong> NumPy. Mỗi cột trong DataFrame thực chất là một
              NumPy array có nhãn. Khi bạn viết <code className="font-mono">df[&quot;diem&quot;].mean()</code>,
              Pandas chỉ chuyển cuộc gọi sang <code className="font-mono">np.mean</code> trên array
              bên dưới. Điều đó nghĩa là mọi phép vectorization của NumPy đều có sẵn trong Pandas
              &mdash; bạn không trả thêm chi phí nào cho nhãn.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Khi nào không nên dùng NumPy / Pandas?">
            <p className="text-sm leading-relaxed">
              Với dữ liệu có cấu trúc phức tạp hoặc cực lớn, NumPy/Pandas có giới hạn. Dữ liệu
              không đồng nhất (ví dụ: mỗi hàng có một danh sách dài khác nhau) thì{" "}
              <strong>dict Python</strong> hoặc <strong>polars</strong> có thể phù hợp hơn. Dữ
              liệu nhiều terabyte thì dùng <strong>Spark</strong> hoặc <strong>Dask</strong>.
              Nhưng cho 95% dự án ML bạn gặp đầu tiên &mdash; NumPy + Pandas là đủ.
            </p>
          </CollapsibleDetail>

          <p className="mt-4 leading-relaxed">
            Sau khi nắm ba thư viện này, hai bước tiếp theo là{" "}
            <TopicLink slug="data-preprocessing">Tiền xử lý dữ liệu</TopicLink> (xử lý missing
            values, encoding, scaling) và{" "}
            <TopicLink slug="feature-engineering">Kỹ thuật đặc trưng</TopicLink> (tạo features có
            ý nghĩa cho model). Nếu bạn chưa dựng môi trường chạy Python, xem{" "}
            <TopicLink slug="jupyter-colab-workflow">Jupyter & Colab workflow</TopicLink>.
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 7 — SUMMARY ━━━ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="5 điều cần nhớ về NumPy + Pandas"
          points={[
            "NumPy = mảng số tốc độ C. Thay vì for-loop, viết a + b, a * 2, a.mean() — nhanh hơn ~100 lần.",
            "Broadcasting = NumPy tự phát mảng nhỏ ra khớp mảng lớn. Quy tắc: so shape từ phải, mỗi chiều bằng nhau hoặc bằng 1.",
            "Pandas = bảng dữ liệu. Ba lệnh đầu tiên với dataset mới: head(), info(), describe().",
            "Combo thông dụng nhất: read_csv → filter bằng boolean mask → groupby → visualize.",
            "Mọi cột DataFrame là một NumPy array. Hiểu NumPy = hiểu nền tảng Pandas và mọi thư viện ML xây bên trên.",
          ]}
        />
        <div className="mt-4">
          <Callout variant="tip" title="Bước kế tiếp">
            Mở{" "}
            <TopicLink slug="jupyter-colab-workflow">Jupyter & Colab workflow</TopicLink>
            {" "}để dựng môi trường chạy thật 5 phút, hoặc{" "}
            <TopicLink slug="data-preprocessing">Tiền xử lý dữ liệu</TopicLink> để học cách làm
            sạch dataset trước khi đưa vào model.
          </Callout>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 8 — QUIZ ━━━ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
