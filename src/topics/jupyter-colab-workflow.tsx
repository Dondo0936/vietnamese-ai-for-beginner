"use client";

import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Notebook,
  Play,
  RotateCcw,
  Terminal,
  Cpu,
  HardDrive,
  Cloud,
  Sparkles,
  KeyboardIcon,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Lightbulb,
} from "lucide-react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
  MiniSummary,
  LessonSection,
  CollapsibleDetail,
  CodeBlock,
  TabView,
  TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

/* ────────────────────────────────────────────────────────────
   METADATA
   ──────────────────────────────────────────────────────────── */

export const metadata: TopicMeta = {
  slug: "jupyter-colab-workflow",
  title: "Jupyter / Google Colab",
  titleVi: "Jupyter và Google Colab — Notebook là IDE của data scientist",
  description:
    "Notebook là IDE của data scientist: viết code, chạy, thấy kết quả ngay, viết chú thích, tiếp tục. Bài thực hành chỉ cho bạn cách dùng trong ngày đầu tiên.",
  category: "foundations",
  tags: ["jupyter", "colab", "notebook", "tools", "workflow"],
  difficulty: "intermediate",
  relatedSlugs: ["python-for-ml", "data-preprocessing", "end-to-end-ml-project"],
  vizType: "interactive",
};

/* ────────────────────────────────────────────────────────────
   DỮ LIỆU: NOTEBOOK MÔ PHỎNG — 4 CELL MINI-ANALYSIS
   ──────────────────────────────────────────────────────────── */

type CellKind = "markdown" | "code";

interface MockCell {
  id: string;
  kind: CellKind;
  source: string;
  output?: string;
  outputKind?: "text" | "dataframe" | "chart";
}

const ANALYSIS_CELLS: MockCell[] = [
  {
    id: "cell-1",
    kind: "markdown",
    source:
      "# Phân tích điểm thi lớp 12\n\nMục tiêu: đọc file CSV, tính điểm trung bình từng môn, rồi vẽ biểu đồ phân phối điểm Toán.",
  },
  {
    id: "cell-2",
    kind: "code",
    source:
      "import pandas as pd\n\ndf = pd.read_csv('diem_lop12.csv')\ndf.head()",
    outputKind: "dataframe",
    output:
      "   hs_id  toan  van  anh\n0    001   8.5  7.0  9.0\n1    002   6.5  8.0  7.5\n2    003   9.0  6.5  8.0\n3    004   7.0  7.5  6.5\n4    005   8.0  9.0  7.0",
  },
  {
    id: "cell-3",
    kind: "code",
    source:
      "means = df[['toan', 'van', 'anh']].mean()\nprint('Điểm trung bình mỗi môn:')\nprint(means.round(2))",
    outputKind: "text",
    output:
      "Điểm trung bình mỗi môn:\ntoan    7.80\nvan     7.60\nanh     7.60\ndtype: float64",
  },
  {
    id: "cell-4",
    kind: "code",
    source:
      "import matplotlib.pyplot as plt\n\ndf['toan'].hist(bins=10, color='#10b981')\nplt.title('Phân phối điểm Toán')\nplt.show()",
    outputKind: "chart",
  },
];

interface CellState extends MockCell {
  executed: boolean;
  running: boolean;
  execCount: number | null;
}

/* ────────────────────────────────────────────────────────────
   NOTEBOOK MOCK — TRÌNH MÔ PHỎNG CUỘN
   ──────────────────────────────────────────────────────────── */

function NotebookMock() {
  const [cells, setCells] = useState<CellState[]>(() =>
    ANALYSIS_CELLS.map((c) => ({
      ...c,
      executed: false,
      running: false,
      execCount: null,
    })),
  );
  const [counter, setCounter] = useState(0);

  const runCell = useCallback((cellId: string) => {
    setCells((prev) => {
      const idx = prev.findIndex((c) => c.id === cellId);
      if (idx === -1) return prev;
      const cell = prev[idx];
      if (cell.kind !== "code") return prev;
      const next = [...prev];
      next[idx] = { ...cell, running: true };
      return next;
    });
    setTimeout(() => {
      setCounter((c) => c + 1);
      setCells((prev) => {
        const idx = prev.findIndex((c) => c.id === cellId);
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          running: false,
          executed: true,
          execCount: counter + 1,
        };
        return next;
      });
    }, 450);
  }, [counter]);

  const runAll = useCallback(() => {
    const codeCells = cells.filter((c) => c.kind === "code");
    codeCells.forEach((cell, i) => {
      setTimeout(() => runCell(cell.id), i * 500);
    });
  }, [cells, runCell]);

  const resetNotebook = useCallback(() => {
    setCounter(0);
    setCells(
      ANALYSIS_CELLS.map((c) => ({
        ...c,
        executed: false,
        running: false,
        execCount: null,
      })),
    );
  }, []);

  const ranCount = cells.filter((c) => c.kind === "code" && c.executed).length;
  const totalCode = cells.filter((c) => c.kind === "code").length;

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
      {/* Thanh công cụ phía trên — mô phỏng toolbar của Colab */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-border bg-card">
        <Notebook size={16} className="text-accent" />
        <span className="text-xs font-mono text-foreground">
          phan_tich_diem.ipynb
        </span>
        <span className="text-[11px] text-muted ml-2">
          {ranCount}/{totalCode} ô đã chạy
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={runAll}
            className="inline-flex items-center gap-1 rounded-md bg-accent px-2.5 py-1 text-[11px] font-semibold text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <Play size={11} /> Chạy tất cả
          </button>
          <button
            type="button"
            onClick={resetNotebook}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-[11px] text-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <RotateCcw size={11} /> Đặt lại
          </button>
        </div>
      </div>

      {/* Vùng cuộn chứa các cell */}
      <div className="max-h-[540px] overflow-y-auto bg-background/40 p-3 space-y-3">
        {cells.map((cell) => (
          <CellView
            key={cell.id}
            cell={cell}
            onRun={() => runCell(cell.id)}
          />
        ))}
        {ranCount === totalCode && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mx-auto mt-2 flex max-w-md items-center gap-2 rounded-lg border border-emerald-400/50 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700/50"
          >
            <CheckCircle2 size={14} />
            <span>
              Toàn bộ notebook đã chạy xong. Bạn vừa hoàn thành một bài phân
              tích mini đúng phong cách data scientist.
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function CellView({ cell, onRun }: { cell: CellState; onRun: () => void }) {
  if (cell.kind === "markdown") {
    return (
      <div className="rounded-lg border border-border/60 bg-background p-3">
        {cell.source.split("\n").map((line, i) => {
          if (line.startsWith("# ")) {
            return (
              <h3
                key={i}
                className="text-base font-semibold text-foreground mb-1.5"
              >
                {line.replace(/^# /, "")}
              </h3>
            );
          }
          if (!line.trim()) return <div key={i} className="h-1.5" />;
          return (
            <p
              key={i}
              className="text-sm text-foreground/80 leading-relaxed"
            >
              {line}
            </p>
          );
        })}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/60 bg-background overflow-hidden">
      <div className="flex items-start">
        <div className="shrink-0 w-14 py-2 text-center border-r border-border/60 bg-surface/40">
          <span className="text-[11px] font-mono text-muted block">
            [{cell.execCount ?? " "}]
          </span>
          <button
            type="button"
            onClick={onRun}
            disabled={cell.running}
            aria-label="Chạy ô code"
            title="Shift+Enter"
            className="mt-1 mx-auto flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background hover:bg-accent hover:text-white hover:border-accent text-muted disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {cell.running ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="inline-block"
              >
                <RotateCcw size={10} />
              </motion.span>
            ) : (
              <Play size={10} />
            )}
          </button>
        </div>
        <div className="flex-1 overflow-x-auto">
          <pre
            className="p-3 text-[13px] leading-relaxed"
            style={{ backgroundColor: "#1e1e2e", color: "#cdd6f4" }}
          >
            <code className="font-mono whitespace-pre">{cell.source}</code>
          </pre>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {cell.executed && cell.output && cell.outputKind !== "chart" && (
          <motion.div
            key="output"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t border-border/60 bg-surface/40 overflow-hidden"
          >
            <pre className="p-3 text-[12px] font-mono text-foreground leading-relaxed whitespace-pre-wrap">
              {cell.output}
            </pre>
          </motion.div>
        )}
        {cell.executed && cell.outputKind === "chart" && (
          <motion.div
            key="chart"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-border/60 bg-surface/40 overflow-hidden"
          >
            <div className="p-4">
              <MiniHistogram />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   MINI HISTOGRAM — OUTPUT giả cho cell cuối
   ──────────────────────────────────────────────────────────── */

function MiniHistogram() {
  const bins = [
    { label: "4", count: 2 },
    { label: "5", count: 3 },
    { label: "6", count: 6 },
    { label: "7", count: 10 },
    { label: "8", count: 13 },
    { label: "9", count: 9 },
    { label: "10", count: 4 },
  ];
  const maxCount = Math.max(...bins.map((b) => b.count));

  return (
    <div className="mx-auto max-w-md">
      <p className="text-xs text-muted text-center mb-2 italic">
        Phân phối điểm Toán
      </p>
      <svg viewBox="0 0 320 180" className="w-full">
        <line
          x1={30}
          y1={150}
          x2={310}
          y2={150}
          stroke="var(--border)"
          strokeWidth={1}
        />
        {bins.map((b, i) => {
          const barWidth = 32;
          const gap = 8;
          const x = 40 + i * (barWidth + gap);
          const h = (b.count / maxCount) * 120;
          return (
            <g key={b.label}>
              <rect
                x={x}
                y={150 - h}
                width={barWidth}
                height={h}
                rx={3}
                fill="#10b981"
                opacity={0.85}
              />
              <text
                x={x + barWidth / 2}
                y={165}
                textAnchor="middle"
                fontSize={11}
                fill="var(--text-secondary)"
              >
                {b.label}
              </text>
              <text
                x={x + barWidth / 2}
                y={145 - h}
                textAnchor="middle"
                fontSize={11}
                fill="var(--text-primary)"
              >
                {b.count}
              </text>
            </g>
          );
        })}
        <text
          x={170}
          y={178}
          textAnchor="middle"
          fontSize={11}
          fill="var(--text-secondary)"
        >
          Điểm
        </text>
      </svg>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   DỮ LIỆU: 4 CÔNG CỤ NOTEBOOK
   ──────────────────────────────────────────────────────────── */

type ToolId = "jupyter" | "colab" | "vscode" | "kaggle";

interface ToolProfile {
  id: ToolId;
  title: string;
  icon: typeof Cpu;
  iconColor: string;
  summary: string;
  pros: string[];
  cons: string[];
  startSteps: string[];
  bestFor: string;
}

const TOOL_PROFILES: Record<ToolId, ToolProfile> = {
  jupyter: {
    id: "jupyter",
    title: "Jupyter Notebook (local)",
    icon: HardDrive,
    iconColor: "#8b5cf6",
    summary:
      "Notebook gốc chạy trực tiếp trên máy tính của bạn. Bạn tự lo mọi thứ: Python, thư viện, phần cứng.",
    pros: [
      "Không giới hạn thời gian — máy của bạn, bạn toàn quyền",
      "Dữ liệu không rời khỏi máy, phù hợp hồ sơ nhạy cảm",
      "Có thể dùng mọi thư viện, kể cả bản sửa đổi do bạn tự viết",
    ],
    cons: [
      "Cần cài Python, pip, jupyter lần đầu — bước đầu thường rối",
      "Không có GPU trừ khi máy bạn có card rời",
      "Chia sẻ khó hơn — người nhận phải tự cài lại môi trường",
    ],
    startSteps: [
      "Cài Python 3.10 trở lên qua python.org hoặc Anaconda",
      'Mở terminal, gõ: pip install notebook',
      'Gõ tiếp: jupyter notebook — trình duyệt sẽ tự mở',
      "Tạo notebook mới từ nút New → Python 3",
    ],
    bestFor:
      "Khi bạn cần bảo mật dữ liệu, hoặc muốn học sâu về môi trường Python.",
  },
  colab: {
    id: "colab",
    title: "Google Colab (cloud)",
    icon: Cloud,
    iconColor: "#0ea5e9",
    summary:
      "Notebook chạy trên cloud của Google. Mở trình duyệt là có GPU miễn phí ngay.",
    pros: [
      "Không cần cài gì — chỉ cần tài khoản Google",
      "GPU Tesla T4 miễn phí cho mỗi phiên (bật trong Runtime settings)",
      "Chia sẻ giống Google Docs — gửi link là xong",
      "Tích hợp sẵn với Google Drive cho dataset và mô hình đã lưu",
    ],
    cons: [
      "Phiên tối đa khoảng 12 giờ, rảnh quá 90 phút bị kết thúc",
      "Khi phiên hết, mọi biến trong RAM biến mất",
      "Đôi lúc phải xếp hàng chờ GPU nếu dùng miễn phí quá nhiều",
    ],
    startSteps: [
      "Vào colab.research.google.com và đăng nhập Google",
      "Bấm File → New notebook (Tệp mới)",
      "Vào Runtime → Change runtime type, chọn T4 GPU nếu cần",
      "Bấm vào ô code đầu tiên, gõ code, ấn Shift+Enter",
    ],
    bestFor:
      "Người mới học deep learning — GPU miễn phí là lý do số một để chọn Colab.",
  },
  vscode: {
    id: "vscode",
    title: "VS Code Notebooks",
    icon: Cpu,
    iconColor: "#f59e0b",
    summary:
      "Mở file .ipynb ngay trong VS Code. Phù hợp khi bạn đã quen dùng editor này cho code thường.",
    pros: [
      "Cùng một editor cho cả file .py và .ipynb — không phải đổi ngữ cảnh",
      "Tích hợp Git, debugger, autocomplete mạnh",
      "Có thể kết nối kernel từ xa (máy chủ, WSL, remote SSH)",
    ],
    cons: [
      "Cần cài VS Code + extension Jupyter + kernel Python",
      "Không có GPU ảo — phụ thuộc máy bạn đang chạy",
      "Nút Run có vị trí hơi khác so với Jupyter classic",
    ],
    startSteps: [
      "Cài VS Code từ code.visualstudio.com",
      "Vào Extensions, cài Python và Jupyter (cả hai của Microsoft)",
      "Tạo file mới với đuôi .ipynb, VS Code tự mở đúng giao diện notebook",
      "Chọn kernel Python ở góc trên phải, rồi bấm Run Cell",
    ],
    bestFor:
      "Dự án vừa có notebook khám phá vừa có module Python dùng lại — một cửa sổ là đủ.",
  },
  kaggle: {
    id: "kaggle",
    title: "Kaggle Notebooks",
    icon: Sparkles,
    iconColor: "#ec4899",
    summary:
      "Notebook cloud của Kaggle, tích hợp sâu với dataset công cộng và các cuộc thi ML.",
    pros: [
      "30 giờ GPU P100 mỗi tuần miễn phí — nhiều hơn Colab miễn phí",
      "Dataset Kaggle đã cài sẵn ở /kaggle/input, không cần tải về",
      "Notebook công khai có thể lên trending, bạn xây dựng hồ sơ cá nhân",
    ],
    cons: [
      "Phiên tối đa 9 giờ, output nhỏ hơn 20 GB",
      "Không phù hợp cho dự án riêng tư hoặc dữ liệu nội bộ",
      "Giao diện khác Colab chút ít — cần làm quen",
    ],
    startSteps: [
      "Tạo tài khoản trên kaggle.com và xác thực số điện thoại",
      "Vào tab Code, bấm + New Notebook",
      "Thêm dataset qua nút + Add Data ở bên phải",
      "Bật GPU trong Settings → Accelerator nếu cần",
    ],
    bestFor:
      "Tham gia cuộc thi ML hoặc khám phá dataset công khai với GPU miễn phí.",
  },
};

function ToolDeepenTab({ profile }: { profile: ToolProfile }) {
  const Icon = profile.icon;
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: profile.iconColor + "22" }}
        >
          <Icon size={20} style={{ color: profile.iconColor }} />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">
            {profile.title}
          </h4>
          <p className="text-xs text-muted leading-relaxed mt-0.5">
            {profile.summary}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-emerald-300/60 bg-emerald-50 dark:bg-emerald-900/15 dark:border-emerald-700/60 p-3">
          <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide mb-1.5">
            Điểm mạnh
          </p>
          <ul className="space-y-1">
            {profile.pros.map((p, i) => (
              <li
                key={i}
                className="text-[12px] text-foreground/85 leading-snug flex gap-1.5"
              >
                <span className="text-emerald-500 shrink-0">+</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-amber-300/60 bg-amber-50 dark:bg-amber-900/15 dark:border-amber-700/60 p-3">
          <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide mb-1.5">
            Điểm yếu
          </p>
          <ul className="space-y-1">
            {profile.cons.map((c, i) => (
              <li
                key={i}
                className="text-[12px] text-foreground/85 leading-snug flex gap-1.5"
              >
                <span className="text-amber-500 shrink-0">-</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-[11px] font-semibold text-accent uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <BookOpen size={12} /> Cách bắt đầu trong 4 bước
        </p>
        <ol className="space-y-1.5">
          {profile.startSteps.map((step, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-[13px] text-foreground/90 leading-relaxed"
            >
              <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-xl border-l-4 border-l-accent bg-accent-light px-4 py-2.5">
        <p className="text-[11px] font-semibold text-accent-dark uppercase tracking-wide mb-0.5">
          Phù hợp nhất khi
        </p>
        <p className="text-[13px] text-foreground leading-relaxed">
          {profile.bestFor}
        </p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   PHÍM TẮT NOTEBOOK — VISUAL KEYBOARD
   ──────────────────────────────────────────────────────────── */

type ShortcutMode = "both" | "command" | "edit";

interface Shortcut {
  keys: string[];
  mode: ShortcutMode;
  label: string;
  detail: string;
}

const SHORTCUTS: Shortcut[] = [
  {
    keys: ["Shift", "Enter"],
    mode: "both",
    label: "Chạy ô và sang ô tiếp",
    detail:
      "Phím tắt nổi tiếng nhất. Chạy ô hiện tại, hiện output, rồi đưa con trỏ xuống ô bên dưới.",
  },
  {
    keys: ["Ctrl", "Enter"],
    mode: "both",
    label: "Chạy ô, ở nguyên",
    detail: "Hữu ích khi bạn muốn chỉnh lại cùng một ô nhiều lần.",
  },
  {
    keys: ["Esc"],
    mode: "edit",
    label: "Vào chế độ command",
    detail:
      "Rời chế độ gõ. Khung ô chuyển sang xanh dương — giờ bàn phím điều khiển ô, không phải gõ vào ô.",
  },
  {
    keys: ["Enter"],
    mode: "command",
    label: "Vào chế độ edit",
    detail:
      "Quay lại chế độ gõ. Khung ô chuyển sang xanh lá — giờ bạn gõ được code hoặc markdown.",
  },
  {
    keys: ["A"],
    mode: "command",
    label: "Thêm ô phía trên",
    detail:
      "Nhanh khi bạn quên một bước khởi tạo và muốn chèn ô mới ở trên ô hiện tại.",
  },
  {
    keys: ["B"],
    mode: "command",
    label: "Thêm ô phía dưới",
    detail:
      "Cặp đôi của A. Nhớ mẹo: A là above (trên), B là below (dưới).",
  },
  {
    keys: ["D", "D"],
    mode: "command",
    label: "Xoá ô (ấn D hai lần)",
    detail:
      "Ấn D liền nhau hai lần. Thiết kế an toàn: đề phòng bạn ấn nhầm một lần.",
  },
  {
    keys: ["Y"],
    mode: "command",
    label: "Đổi sang ô code",
    detail:
      "Chuyển ô markdown hoặc raw sang ô code. Nhớ: Y là yes-to-code.",
  },
  {
    keys: ["M"],
    mode: "command",
    label: "Đổi sang ô markdown",
    detail:
      "Chuyển ô code sang ô markdown để ghi chú. M là markdown.",
  },
];

function KeyboardShortcutsGrid() {
  const [mode, setMode] = useState<ShortcutMode>("both");
  const filtered = useMemo(
    () =>
      SHORTCUTS.filter(
        (s) => mode === "both" || s.mode === mode || s.mode === "both",
      ),
    [mode],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            { k: "both", label: "Tất cả" },
            { k: "command", label: "Chế độ command (Esc)" },
            { k: "edit", label: "Chế độ edit (Enter)" },
          ] as const
        ).map((btn) => (
          <button
            key={btn.k}
            type="button"
            onClick={() => setMode(btn.k)}
            className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors border ${
              mode === btn.k
                ? "border-accent bg-accent text-white"
                : "border-border bg-card text-muted hover:text-foreground"
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {filtered.map((sc, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-3 flex items-start gap-3"
          >
            <div className="flex flex-wrap gap-1 shrink-0">
              {sc.keys.map((k, j) => (
                <kbd
                  key={j}
                  className="rounded-md border border-border bg-surface px-2 py-0.5 text-[11px] font-mono font-semibold text-foreground shadow-sm"
                >
                  {k}
                </kbd>
              ))}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight">
                {sc.label}
              </p>
              <p className="text-xs text-muted leading-snug mt-0.5">
                {sc.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   THÀNH PHẦN CHÍNH
   ──────────────────────────────────────────────────────────── */

export default function JupyterColabWorkflowTopic() {
  const quizQuestions = useMemo<QuizQuestion[]>(
    () => [
      {
        question:
          "Google Colab khác Jupyter Notebook chạy trên máy cá nhân ở điểm quan trọng nhất nào cho người mới học deep learning?",
        options: [
          "Colab có giao diện đẹp hơn",
          "Colab hỗ trợ nhiều ngôn ngữ lập trình hơn",
          "Colab cho GPU T4 miễn phí và không cần cài đặt phần mềm",
          "Colab chạy nhanh hơn Jupyter trong mọi trường hợp",
        ],
        correct: 2,
        explanation:
          "Colab cho mượn GPU Tesla T4 miễn phí qua trình duyệt, và bạn không cần cài Python hay driver. Đó là lý do Colab trở thành lựa chọn số một để thử deep learning khi chưa có máy mạnh.",
      },
      {
        question:
          "Trong một ô code của notebook, dấu chấm than ! trước câu lệnh (ví dụ !pip install numpy) có ý nghĩa gì?",
        options: [
          "Đánh dấu cell chạy với GPU",
          "Thực thi lệnh như một lệnh shell thay vì code Python",
          "Báo cho Python biết đây là câu lệnh quan trọng",
          "Chạy lệnh song song với các cell khác",
        ],
        correct: 1,
        explanation:
          "Dấu ! cho phép bạn chạy lệnh shell ngay trong notebook — y như bạn gõ trong terminal. Nhờ vậy bạn có thể cài gói, kiểm tra GPU, hay tải file mà không cần rời khỏi notebook.",
      },
      {
        question:
          "Notebook đang ở chế độ command (khung ô màu xanh dương). Bạn ấn phím B. Chuyện gì xảy ra?",
        options: [
          "Chuyển ô hiện tại sang markdown",
          "Thêm một ô mới phía dưới ô hiện tại",
          "Xoá ô hiện tại",
          "Chuyển ô sang code",
        ],
        correct: 1,
        explanation:
          "Trong chế độ command: A thêm ô phía trên (Above), B thêm ô phía dưới (Below). DD xoá ô, Y chuyển sang code, M chuyển sang markdown.",
      },
      {
        question:
          "Bạn kết nối Google Drive vào Colab bằng drive.mount('/content/drive'). Điều gì thật sự xảy ra?",
        options: [
          "Drive được tải toàn bộ về máy Colab",
          "Colab tạo liên kết chỉ đọc đến Drive",
          "Colab gắn Drive như một ổ đĩa, đọc ghi qua mạng khi cần",
          "Colab sao chép Drive vào thư mục tạm rồi xoá khi dừng",
        ],
        correct: 2,
        explanation:
          "drive.mount gắn Drive như một filesystem ảo. Mỗi lần code của bạn mở file trong /content/drive, Colab gọi Drive API để lấy dữ liệu. Vì vậy đọc nhiều file nhỏ trên Drive chậm hơn đọc từ /content.",
      },
      {
        question:
          "Vì sao sau khi runtime Colab hết phiên, mọi biến trong notebook của bạn biến mất?",
        options: [
          "Google xoá notebook khỏi Drive",
          "Runtime là máy ảo dùng một lần — phiên hết thì máy ảo bị thu hồi",
          "Biến quá lớn nên hệ thống dọn rác đã giải phóng",
          "Notebook tự động ghi biến vào file backup",
        ],
        correct: 1,
        explanation:
          "Mỗi phiên Colab là một VM tạm, hết phiên là bị huỷ. Muốn giữ kết quả, hãy lưu ra Drive bằng pickle, joblib hoặc pd.to_csv — và chỉ load lại .pkl do CHÍNH BẠN tạo (file .pkl lạ có thể chạy code tuỳ ý khi load).",
      },
      {
        question:
          "Phím tắt nào để chạy ô hiện tại và đồng thời sang ô tiếp theo?",
        options: ["Ctrl+Enter", "Shift+Enter", "Alt+Enter", "Tab"],
        correct: 1,
        explanation:
          "Shift+Enter là phím tắt biểu tượng của mọi notebook. Ctrl+Enter chạy ô nhưng ở nguyên tại vị trí — dùng khi bạn muốn chỉnh lại cùng ô đó nhiều lần.",
      },
      {
        question:
          "Bạn vừa chạy !pip install -q seaborn trong Colab. Cách kiểm tra thư viện đã cài đúng phiên bản?",
        options: [
          "Nhìn output pip thấy Successfully installed là đủ",
          "import seaborn; print(seaborn.__version__) để in phiên bản",
          "Khởi động lại máy tính và mở lại Colab",
          "Không có cách nào kiểm tra",
        ],
        correct: 1,
        explanation:
          "Sau pip install, luôn import và in __version__ để chắc chắn kernel thấy đúng bản. Output pip đôi lúc cài vào interpreter khác với kernel Jupyter.",
      },
    ],
    [],
  );

  return (
    <>
      {/* ═══ BƯỚC 1 — HOOK ═══ */}
      <LessonSection step={1} totalSteps={8} label="Notebook là IDE của data scientist">
        <div className="rounded-2xl border border-border bg-accent-light p-6 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15">
              <Notebook className="h-6 w-6 text-accent" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">
                Notebook là IDE của data scientist
              </h2>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Viết code, chạy, thấy kết quả ngay, viết chú thích, tiếp tục.
                Cứ vòng lặp đó mỗi ngày. Nếu lập trình web thường cần chạy lại
                cả chương trình để xem một thay đổi, thì với notebook, bạn chỉ
                cần ấn <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 text-[11px] font-mono">Shift</kbd>
                {" + "}
                <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 text-[11px] font-mono">Enter</kbd> và thấy kết quả tại chỗ.
              </p>
              <p className="text-sm text-foreground/80 leading-relaxed">
                Bài thực hành này chỉ bạn cách sử dụng notebook trong ngày đầu
                tiên: từ tạo ô đầu tiên, chạy thử một bài phân tích mini, đến
                chọn giữa Jupyter chạy local hay Google Colab trên cloud.
              </p>
            </div>
          </div>
        </div>
      </LessonSection>

      {/* ═══ BƯỚC 2 — DỰ ĐOÁN ═══ */}
      <LessonSection step={2} totalSteps={8} label="Thử đoán">
        <PredictionGate
          question="Bạn muốn huấn luyện một mạng nơ-ron nhỏ nhưng máy tính không có GPU. Công cụ nào cho bạn GPU miễn phí để bắt đầu ngay trong buổi chiều nay?"
          options={[
            "Jupyter Notebook chạy trên máy — có thể bật GPU ảo",
            "Google Colab — chạy trên trình duyệt, có Tesla T4 miễn phí",
            "VS Code Notebooks — luôn có GPU ảo khi mở file .ipynb",
            "Không có cách nào ngoài việc mua card GPU",
          ]}
          correct={1}
          explanation="Colab cấp phát GPU Tesla T4 miễn phí cho mỗi phiên — bạn chỉ cần đổi Runtime trong menu là có. Jupyter local không ảo GPU; nó chỉ dùng phần cứng trên máy bạn."
        >
          <p className="text-sm text-muted mt-4 leading-relaxed">
            Nếu bạn trả lời đúng — xin chúc mừng, bạn đã nắm lý do tại sao
            Colab trở thành công cụ số một cho người mới học deep learning.
            Nếu chưa, đừng lo. Phần tiếp theo sẽ cho bạn nghịch thử một
            notebook mô phỏng để cảm nhận vòng lặp viết-chạy-xem.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ═══ BƯỚC 3 — REVEAL: NOTEBOOK MOCK ═══ */}
      <LessonSection step={3} totalSteps={8} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-foreground">
                Notebook mô phỏng: một bài phân tích mini
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                Đây là bản mô phỏng của Colab thu nhỏ. Notebook có 4 ô: một ô
                ghi chú bằng markdown, ba ô code. Bấm nút <span className="inline-flex items-center gap-1 rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-mono"><Play size={9}/> Play</span>{" "}
                bên cạnh từng ô để chạy (hoặc &ldquo;Chạy tất cả&rdquo; phía trên), rồi xem
                kết quả xuất hiện ngay phía dưới.
              </p>
            </div>

            <NotebookMock />

            <Callout variant="insight" title="Điều cần cảm nhận">
              Chú ý cảm giác: <strong>code ↔ kết quả ở cạnh nhau</strong>. Bạn
              không cần chạy cả chương trình, không cần save file rồi mở
              terminal. Một ô, một Enter, một dòng kết quả. Đó là lý do
              notebook thắng mọi editor khác khi bạn đang khám phá dữ liệu.
            </Callout>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-[11px] font-bold text-accent">
                    1
                  </span>
                  <p className="text-sm font-semibold text-foreground">
                    Ô markdown
                  </p>
                </div>
                <p className="text-xs text-muted leading-snug">
                  Ghi chú, tiêu đề, công thức. Dùng để kể câu chuyện quanh
                  code. Render ngay khi chạy.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-[11px] font-bold text-accent">
                    2
                  </span>
                  <p className="text-sm font-semibold text-foreground">
                    Ô code
                  </p>
                </div>
                <p className="text-xs text-muted leading-snug">
                  Python thật, chạy thật. Số trong ngoặc vuông là thứ tự chạy
                  — tăng dần mỗi lần bạn chạy ô.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-[11px] font-bold text-accent">
                    3
                  </span>
                  <p className="text-sm font-semibold text-foreground">
                    Ô output
                  </p>
                </div>
                <p className="text-xs text-muted leading-snug">
                  Xuất hiện ngay dưới ô code. Text, bảng, biểu đồ, hình
                  ảnh — tất cả chung một dòng chảy.
                </p>
              </div>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ═══ BƯỚC 4 — AHA ═══ */}
      <LessonSection step={4} totalSteps={8} label="Khoảnh khắc hiểu">
        <AhaMoment>
          Notebook không phải là một <em>file code</em>. Nó là một{" "}
          <strong>phiên làm việc sống</strong>: code bạn viết chỉ là kịch bản,
          còn kết quả bạn thấy phụ thuộc vào <strong>thứ tự bạn chạy các ô</strong>
          , các gói đã cài, và trạng thái runtime đang giữ. Ai làm chủ được bộ
          ba đó, người đó làm chủ notebook.
        </AhaMoment>
      </LessonSection>

      {/* ═══ BƯỚC 5 — DEEPEN: TABVIEW 4 CÔNG CỤ ═══ */}
      <LessonSection step={5} totalSteps={8} label="So sánh 4 công cụ notebook">
        <div className="space-y-3">
          <p className="text-sm text-muted leading-relaxed">
            Không có công cụ &ldquo;tốt nhất&rdquo; tuyệt đối — chỉ có công
            cụ phù hợp nhất cho hoàn cảnh của bạn. Bốn tab dưới đây tóm tắt
            ưu nhược điểm của từng lựa chọn phổ biến, kèm cách bắt đầu
            trong 4 bước cho mỗi công cụ.
          </p>

          <TabView
            tabs={[
              {
                label: "Local Jupyter",
                content: <ToolDeepenTab profile={TOOL_PROFILES.jupyter} />,
              },
              {
                label: "Google Colab",
                content: <ToolDeepenTab profile={TOOL_PROFILES.colab} />,
              },
              {
                label: "VS Code Notebooks",
                content: <ToolDeepenTab profile={TOOL_PROFILES.vscode} />,
              },
              {
                label: "Kaggle Notebooks",
                content: <ToolDeepenTab profile={TOOL_PROFILES.kaggle} />,
              },
            ]}
          />

          <Callout variant="tip" title="Lộ trình đề xuất cho người mới">
            Bắt đầu với <strong>Google Colab</strong> cho vài tuần đầu — không
            cài gì, có GPU, bạn tập trung vào việc học ML thay vì gỡ rối môi
            trường. Khi bạn đã quen notebook và muốn kiểm soát sâu hơn, chuyển
            dần sang <strong>VS Code Notebooks</strong>. Chuyển sang{" "}
            <strong>Jupyter local</strong> chỉ khi bạn cần xử lý dữ liệu không
            được phép rời máy.
          </Callout>
        </div>
      </LessonSection>

      {/* ═══ BƯỚC 6 — CHALLENGE ═══ */}
      <LessonSection step={6} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Bạn là sinh viên mới bắt đầu học deep learning, máy laptop cũ không có GPU. Vì sao Colab lại là lựa chọn gần như hoàn hảo cho giai đoạn này?"
          options={[
            "Vì Colab có nhiều theme giao diện đẹp mắt",
            "Vì Colab cho GPU T4 miễn phí qua trình duyệt, bạn không cần cài đặt gì và có thể bắt đầu chạy mô hình trong vài phút",
            "Vì Colab tự viết code giúp bạn khi bạn bí",
            "Vì Colab chỉ chạy được code đơn giản, phù hợp người mới",
          ]}
          correct={1}
          explanation="GPU miễn phí + zero setup = rào cản vào nghề gần như bằng không. Bạn mở colab.research.google.com, tạo notebook, đổi runtime sang T4, và chỉ 30 giây sau đã có thể chạy huấn luyện. Không có công cụ nào khác cho người mới tiếp cận deep learning dễ dàng đến vậy."
        />
      </LessonSection>

      {/* ═══ BƯỚC 7 — EXPLAIN ═══ */}
      <ExplanationSection topicSlug={metadata.slug}>
        <LessonSection label="Phím tắt — ngôn ngữ cơ thể của notebook" step={1}>
          <p className="leading-relaxed">
            Notebook có hai chế độ: <strong>command</strong> (bàn phím điều
            khiển ô) và <strong>edit</strong> (bàn phím gõ vào ô). Biết được
            bạn đang ở chế độ nào — và biết vài phím tắt quan trọng — sẽ tăng
            tốc độ bạn làm việc lên gấp đôi trong tuần đầu tiên.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted">
            <KeyboardIcon size={14} className="text-accent" />
            <span>
              Phím tắt chung cho cả Jupyter classic, JupyterLab và Google Colab.
            </span>
          </div>

          <KeyboardShortcutsGrid />

          <Callout variant="info" title="Mẹo nhớ">
            Khung ô <strong>xanh dương = chế độ command</strong>, xanh{" "}
            <strong>lá = edit</strong>. Nhầm là bạn sẽ gõ chữ A vào giữa ô
            code thay vì thêm ô mới. Quen tay thì khoảng hai ngày là đủ.
          </Callout>
        </LessonSection>

        <LessonSection label="3 câu lệnh Colab đáng nhớ nhất" step={2}>
          <p className="leading-relaxed">
            Khi dùng Colab, bạn hay gặp ba câu lệnh sau. Mỗi lệnh chỉ vài ký
            tự nhưng thay đổi cách thí nghiệm của bạn chạy.
          </p>

          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Terminal size={16} className="text-sky-500" />
                <h4 className="text-sm font-semibold text-foreground">
                  1. !pip install — cài thư viện mới
                </h4>
              </div>
              <p className="text-sm text-muted leading-relaxed">
                Colab đã cài sẵn nhiều thư viện phổ biến (numpy, pandas,
                torch...), nhưng vẫn thiếu nhiều gói khác. Dấu{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-xs">!</code>{" "}
                cho phép chạy lệnh shell ngay trong ô notebook.
              </p>
              <CodeBlock language="python" title="Cell: cài seaborn và kiểm tra">
{`!pip install -q seaborn==0.13.2
import seaborn as sns
print(sns.__version__)`}
              </CodeBlock>
              <p className="text-xs text-muted leading-snug">
                Cờ <code>-q</code> (quiet) giúp giảm log. Ghi cụ thể phiên bản
                (==0.13.2) để người khác chạy lại được kết quả của bạn.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Cpu size={16} className="text-emerald-500" />
                <h4 className="text-sm font-semibold text-foreground">
                  2. !nvidia-smi — kiểm tra GPU đang được cấp
                </h4>
              </div>
              <p className="text-sm text-muted leading-relaxed">
                Sau khi đổi runtime sang GPU, hãy xác nhận GPU đã được gắn
                thật bằng câu lệnh này. Nếu dòng đầu báo{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-xs">command not found</code>, runtime của bạn đang là CPU.
              </p>
              <CodeBlock language="python" title="Cell: kiểm tra GPU Colab">
{`!nvidia-smi

# Hoặc in gọn hơn qua PyTorch:
import torch
print('CUDA khả dụng:', torch.cuda.is_available())
print('Tên GPU:', torch.cuda.get_device_name(0))`}
              </CodeBlock>
              <p className="text-xs text-muted leading-snug">
                Với tài khoản miễn phí, Colab thường cấp Tesla T4 (16 GB VRAM).
                Với Colab Pro hoặc Pro+, bạn có thể gặp L4 hoặc A100.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center gap-2">
                <HardDrive size={16} className="text-amber-500" />
                <h4 className="text-sm font-semibold text-foreground">
                  3. drive.mount — gắn Google Drive vào notebook
                </h4>
              </div>
              <p className="text-sm text-muted leading-relaxed">
                Colab sẽ xoá file khi phiên kết thúc. Mount Drive để lưu dữ
                liệu lâu dài hoặc truy cập dataset bạn đã tải lên từ trước.
              </p>
              <CodeBlock language="python" title="Cell: mount Google Drive">
{`from google.colab import drive
drive.mount('/content/drive')

# Giờ file Drive nằm dưới /content/drive/MyDrive/
import pandas as pd
df = pd.read_csv('/content/drive/MyDrive/data/iris.csv')`}
              </CodeBlock>
              <p className="text-xs text-muted leading-snug">
                Khi chạy, Colab sẽ mở cửa sổ yêu cầu bạn đăng nhập Google và
                cấp quyền. Nhớ xoá ô drive.mount trước khi chia sẻ notebook —
                bạn không muốn ai cũng nhìn thấy đường dẫn riêng của mình.
              </p>
            </div>
          </div>

          <Callout variant="warning" title="Ba lỗi hay gặp với pip trong notebook">
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>ModuleNotFoundError sau khi !pip install</strong> —
                đôi khi pip cài vào interpreter khác với kernel. Cách sửa:
                dùng <code>%pip install</code> thay cho <code>!pip install</code>.
              </li>
              <li>
                <strong>Không restart kernel sau khi nâng cấp</strong> —
                vài gói (như numpy) chỉ load một lần mỗi phiên. Ấn Runtime →
                Restart session khi cần chắc ăn.
              </li>
              <li>
                <strong>Quên ghi phiên bản</strong> — <code>!pip install pkg</code>{" "}
                lấy bản mới nhất. Một tuần sau pkg cập nhật, code bạn gãy. Luôn{" "}
                <code>pkg==X.Y</code>.
              </li>
            </ul>
          </Callout>
        </LessonSection>

        <LessonSection label="Thứ tự chuẩn khi bắt đầu một phiên Colab" step={3}>
          <p className="leading-relaxed">
            Một thói quen tốt: mỗi khi mở notebook, luôn chạy các ô theo thứ
            tự cố định dưới đây. Chạy sai thứ tự là nguyên nhân số một khiến
            người mới gặp lỗi khó hiểu.
          </p>
          <ol className="list-decimal list-inside space-y-2 pl-2 text-sm text-foreground/90 leading-relaxed">
            <li>
              <strong>Đổi runtime</strong> — Menu <code>Runtime → Change runtime type</code>
              , chọn T4 GPU nếu cần. Đổi runtime sẽ xoá toàn bộ biến cũ.
            </li>
            <li>
              <strong>Chạy !nvidia-smi</strong> để xác nhận GPU đã được cấp.
            </li>
            <li>
              <strong>Mount Drive</strong> nếu dataset ở Drive. Làm sớm để đỡ
              phải xác thực giữa chừng.
            </li>
            <li>
              <strong>%pip install</strong> các gói còn thiếu, ghi rõ phiên
              bản.
            </li>
            <li>
              <strong>import và kiểm tra __version__</strong> — đảm bảo
              kernel thấy đúng bản.
            </li>
            <li>
              <strong>Cập nhật đường dẫn dataset</strong> thành biến hằng ở
              một ô đầu, rồi viết logic phân tích bên dưới.
            </li>
          </ol>

          <CollapsibleDetail title="Vì sao thứ tự quan trọng đến vậy?">
            <p className="text-sm leading-relaxed mb-2">
              Notebook giữ mọi thứ trong một <em>không gian tên Python</em>{" "}
              sống. Mỗi ô code bạn chạy thêm (hoặc ghi đè) biến trong không
              gian đó. Nếu bạn chạy ô import sau ô gọi hàm, hàm đó chưa tồn
              tại khi nó được gọi.
            </p>
            <p className="text-sm leading-relaxed">
              Thử nghiệm nhanh: tạo ô <code>x = 10</code>, ô tiếp{" "}
              <code>print(x)</code>. Chạy ô dưới trước ô trên — Python báo
              <code> NameError: name &apos;x&apos; is not defined</code>. Đó
              chính là cảm giác &ldquo;chạy sai thứ tự&rdquo; nhân với một
              notebook có 40 ô.
            </p>
          </CollapsibleDetail>
        </LessonSection>

        <LessonSection label="Khi nào cần công thức — dùng LaTeX trong markdown" step={4}>
          <p className="leading-relaxed">
            Notebook cho phép viết công thức toán bằng LaTeX ngay trong ô
            markdown. Điều này cực hữu ích khi bạn cần trình bày một metric.
            Ví dụ, công thức RMSE (Root Mean Squared Error) dùng trong mọi
            bài toán hồi quy:
          </p>
          <div className="rounded-xl border border-border bg-surface/40 p-5 my-2 text-center">
            <p className="katex-wrapper">
              <span className="italic">
                RMSE = sqrt( (1/n) * sum( (y_i - y_hat_i)^2 ) )
              </span>
            </p>
            <p className="text-xs text-muted mt-2 italic">
              Trong ô markdown, bạn gõ công thức bọc giữa hai ký tự $...$ cho
              inline, hoặc $$...$$ cho block. Jupyter, Colab, nbviewer đều
              render ra công thức chuẩn.
            </p>
          </div>
          <p className="leading-relaxed">
            Mẹo: nếu công thức hiện ra đúng trên Colab nhưng vỡ khi xem trên
            GitHub, có thể GitHub đang render một phiên bản cũ của bộ
            parser. Giải pháp phổ biến: xuất notebook qua{" "}
            <code>jupyter nbconvert --to html</code> để gửi ảnh, hoặc tải lên
            nbviewer.org.
          </p>
        </LessonSection>

        <LessonSection label="Bẫy hay gặp với runtime và cách tránh" step={5}>
          <ul className="list-disc list-inside space-y-2 pl-2 text-sm text-foreground/90 leading-relaxed">
            <li>
              <strong>Idle timeout 90 phút</strong> — Colab miễn phí cắt
              runtime khi bạn rời tab quá lâu. Mở tab trước khi đi uống cà
              phê dài là đủ mất cả phiên.
            </li>
            <li>
              <strong>Quên lưu mô hình ra Drive</strong> — sau khi huấn
              luyện, luôn{" "}
              <code>joblib.dump(clf, &apos;/content/drive/.../model.pkl&apos;)</code>. Runtime hết là mô hình mất.
              <span className="block mt-1 text-[11px] text-amber-700 dark:text-amber-300">
                ⚠️ Chỉ <code>joblib.load</code> trên file do chính bạn tạo —
                file <code>.pkl</code> lạ có thể chạy code Python tuỳ ý khi load.
              </span>
            </li>
            <li>
              <strong>Execution count nhảy lung tung</strong> — các số
              trong ngoặc vuông như [3][8][1][5] là dấu hiệu bạn đã chạy ô
              lộn xộn. Trước khi chia sẻ, luôn <code>Runtime → Restart and run all</code> để kiểm tra notebook chạy sạch từ đầu.
            </li>
            <li>
              <strong>Biến &ldquo;ma&rdquo;</strong> — bạn xoá định nghĩa
              một hàm khỏi ô, nhưng hàm vẫn còn trong runtime nên vẫn gọi
              được. Người nhận mở lại bị lỗi. Cách chữa: restart kernel
              thường xuyên, và nhớ rằng file .ipynb phải chạy độc lập.
            </li>
          </ul>

          <Callout variant="warning" title="Bảo mật khi mount Drive">
            Khi mount, Colab có quyền đọc ghi <strong>toàn bộ</strong> Drive
            của bạn. Nếu phải chia sẻ notebook công khai, hãy <strong>xoá ô drive.mount và link dẫn đến thư mục của bạn</strong> trước. Tốt
            hơn nữa là tạo thư mục Drive riêng chỉ cho notebook đó và chỉ
            share thư mục ấy.
          </Callout>

          <CollapsibleDetail title="Tăng tốc khi dữ liệu ở Drive — sao chép về /content">
            <p className="text-sm leading-relaxed mb-2">
              Đọc file từ Drive qua mạng chậm (mỗi file nhỏ mất khoảng 100
              ms). Nếu bạn có 10.000 ảnh, thời gian I/O có thể chiếm 90%
              tổng thời gian huấn luyện. Mẹo phổ biến: sao chép một lần từ
              Drive về <code>/content/</code> (SSD cục bộ của VM Colab) rồi
              đọc từ đó.
            </p>
            <CodeBlock language="python" title="Copy dataset từ Drive về /content">
{`import shutil, os, time
SRC = '/content/drive/MyDrive/cifar10'
DST = '/content/cifar10'
if not os.path.exists(DST):
    t0 = time.time()
    shutil.copytree(SRC, DST)
    print(f'Copied in {time.time()-t0:.1f}s')`}
            </CodeBlock>
            <p className="text-sm leading-relaxed">
              Trên dataset lớn, trick này tăng tốc huấn luyện từ 3 đến 10
              lần — chi phí chỉ là thời gian copy ban đầu.
            </p>
          </CollapsibleDetail>
        </LessonSection>

        <LessonSection label="Liên kết đến các topic khác" step={6}>
          <p className="leading-relaxed">
            Bài này là điểm khởi đầu. Khi bạn đã thoải mái với notebook:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm leading-relaxed pl-2">
            <li>
              <TopicLink slug="python-for-ml">Python cho ML</TopicLink> — kỹ
              năng lập trình nền tảng bạn dùng trong mọi ô code.
            </li>
            <li>
              <TopicLink slug="data-preprocessing">Tiền xử lý dữ liệu</TopicLink>{" "}
              — bước tự nhiên tiếp theo sau khi load dataset.
            </li>
            <li>
              <TopicLink slug="end-to-end-ml-project">Dự án ML end-to-end</TopicLink>{" "}
              — ghép các mảnh rời thành pipeline hoàn chỉnh.
            </li>
          </ul>
        </LessonSection>
      </ExplanationSection>

      {/* ═══ BƯỚC 8 — TÓM TẮT + QUIZ ═══ */}
      <LessonSection step={7} totalSteps={8} label="Tóm tắt">
        <MiniSummary
          title="6 điểm cần nhớ"
          points={[
            "Notebook là IDE sống: code và kết quả cạnh nhau, vòng lặp viết-chạy-xem chỉ mất vài giây.",
            "Mỗi ô code có execution count riêng — thứ tự bạn chạy quan trọng hơn thứ tự ô xếp trong file.",
            "Colab là lựa chọn số một cho người mới học deep learning: không cần cài, có GPU T4 miễn phí.",
            "Thứ tự chuẩn mỗi phiên Colab: đổi runtime → kiểm tra GPU → mount Drive → cài gói → import và kiểm tra version.",
            "Dấu ! biến ô thành shell: !pip install, !nvidia-smi, !ls đều chạy được y như terminal.",
            "Phím tắt cốt lõi: Shift+Enter chạy ô, Esc/Enter đổi chế độ, A/B thêm ô, DD xoá ô, Y/M đổi loại ô.",
          ]}
        />
        <div className="mt-4">
          <Callout variant="tip" title="Bước đi kế tiếp">
            Mở{" "}
            <a
              href="https://colab.research.google.com"
              target="_blank"
              rel="noreferrer"
              className="text-accent underline underline-offset-2 hover:text-accent-dark"
            >
              colab.research.google.com
            </a>{" "}
            ngay sau khi đóng bài này. Tạo notebook mới, chạy thử 3 câu lệnh{" "}
            <code>!pip install</code>, <code>!nvidia-smi</code>,{" "}
            <code>drive.mount</code> — ấn Shift+Enter từng dòng. Đó là cách
            chắc chắn nhất để kiến thức dính lại.
          </Callout>
        </div>
      </LessonSection>

      <LessonSection step={8} totalSteps={8} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted">
          <Lightbulb size={12} />
          <span>
            Làm lại bất cứ lúc nào — quiz này không chấm điểm thật, mục tiêu
            chỉ là củng cố trí nhớ.
          </span>
        </div>
        <div className="mt-2 flex items-center justify-center gap-2 text-[11px] text-muted/70">
          <AlertTriangle size={10} />
          <span>
            Gợi ý: nếu bạn trượt câu nào, cuộn lên phần &ldquo;Giải thích&rdquo; đọc
            lại đoạn tương ứng rồi bấm &ldquo;Làm lại&rdquo;.
          </span>
        </div>
      </LessonSection>
    </>
  );
}
