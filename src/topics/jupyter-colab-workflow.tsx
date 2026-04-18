"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
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
  ProgressSteps,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

// ---------------------------------------------------------------------------
// METADATA
// ---------------------------------------------------------------------------

export const metadata: TopicMeta = {
  slug: "jupyter-colab-workflow",
  title: "Jupyter & Google Colab Workflow",
  titleVi: "Quy trình làm việc với Jupyter và Google Colab",
  description:
    "Hướng dẫn thực hành — cách chạy thí nghiệm ML đầu tiên trên Jupyter Notebook và Google Colab.",
  category: "foundations",
  tags: ["jupyter", "colab", "notebook", "tools", "workflow"],
  difficulty: "beginner",
  relatedSlugs: ["python-for-ml", "data-preprocessing", "end-to-end-ml-project"],
  vizType: "interactive",
};

// ---------------------------------------------------------------------------
// TYPES — Mô phỏng notebook
// ---------------------------------------------------------------------------

type CellKind = "code" | "markdown" | "output";

interface NotebookCell {
  id: string;
  kind: CellKind;
  /** Nội dung hiển thị bên trong cell */
  content: string;
  /** Ngôn ngữ code (chỉ với code cell) */
  language?: string;
  /** Output giả lập sẽ xuất hiện khi người học nhấn Run */
  simulatedOutput?: string;
  /** Số execution count (None khi chưa chạy) */
  executionCount?: number | null;
  /** Trạng thái runtime tạm thời */
  running?: boolean;
  /** Đã chạy xong hay chưa */
  executed?: boolean;
}

interface NotebookState {
  cells: NotebookCell[];
  /** Runtime GPU/TPU đang dùng */
  runtime: "CPU" | "T4 GPU" | "V100 GPU" | "TPU v2";
  /** Drive đã mount hay chưa */
  driveMounted: boolean;
  /** Danh sách gói pip đã cài */
  installedPackages: string[];
  /** Counter toàn cục cho execution count */
  execCounter: number;
}

// ---------------------------------------------------------------------------
// DỮ LIỆU KHỞI TẠO CHO NOTEBOOK MÔ PHỎNG
// ---------------------------------------------------------------------------

const INITIAL_CELLS: NotebookCell[] = [
  {
    id: "md-intro",
    kind: "markdown",
    content:
      "# Thí nghiệm đầu tiên: Phân loại hoa Iris\n\nSổ tay này minh họa quy trình chuẩn của một thí nghiệm ML trên Google Colab — từ kết nối GPU, cài đặt thư viện, đến huấn luyện mô hình.",
  },
  {
    id: "code-check-gpu",
    kind: "code",
    language: "python",
    content: "!nvidia-smi",
    executionCount: null,
    simulatedOutput:
      "Fri Apr 18 02:14:23 2026\n+-----------------------------------------------------------------------------+\n| NVIDIA-SMI 535.104  Driver Version: 535.104  CUDA Version: 12.2            |\n|-----------------------------------------------------------------------------|\n| GPU  Name         Persistence-M | Bus-Id        Disp.A | Volatile Uncorr. |\n|   0  Tesla T4              Off  | 00000000:00:04.0 Off |                  0 |\n| N/A   42C    P8     9W /  70W  |      0MiB / 15360MiB |      0%      Default |\n+-----------------------------------------------------------------------------+",
  },
  {
    id: "code-pip-install",
    kind: "code",
    language: "python",
    content: "!pip install -q scikit-learn==1.4.0 pandas==2.2.0 matplotlib",
    executionCount: null,
    simulatedOutput:
      "Installing collected packages: scikit-learn, pandas, matplotlib\nSuccessfully installed matplotlib-3.8.3 pandas-2.2.0 scikit-learn-1.4.0",
  },
  {
    id: "code-mount-drive",
    kind: "code",
    language: "python",
    content:
      "from google.colab import drive\ndrive.mount('/content/drive')",
    executionCount: null,
    simulatedOutput:
      "Mounted at /content/drive\n(Các tệp Google Drive của bạn giờ có thể truy cập dưới /content/drive/MyDrive)",
  },
  {
    id: "md-load",
    kind: "markdown",
    content:
      "## Bước 1 — Tải dữ liệu\nDataset `iris.csv` được lưu sẵn trên Drive của bạn, vì vậy chỉ cần trỏ đến đường dẫn đã mount.",
  },
  {
    id: "code-load-data",
    kind: "code",
    language: "python",
    content:
      "import pandas as pd\ndf = pd.read_csv('/content/drive/MyDrive/datasets/iris.csv')\ndf.head()",
    executionCount: null,
    simulatedOutput:
      "   sepal_length  sepal_width  petal_length  petal_width      species\n0           5.1          3.5           1.4          0.2       setosa\n1           4.9          3.0           1.4          0.2       setosa\n2           4.7          3.2           1.3          0.2       setosa\n3           4.6          3.1           1.5          0.2       setosa\n4           5.0          3.6           1.4          0.2       setosa",
  },
  {
    id: "md-train",
    kind: "markdown",
    content:
      "## Bước 2 — Huấn luyện mô hình\nMột mô hình Logistic Regression đơn giản cũng đủ để đạt >95% độ chính xác trên Iris.",
  },
  {
    id: "code-train",
    kind: "code",
    language: "python",
    content:
      "from sklearn.model_selection import train_test_split\nfrom sklearn.linear_model import LogisticRegression\n\nX = df.drop(columns=['species'])\ny = df['species']\nX_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42)\n\nclf = LogisticRegression(max_iter=200).fit(X_tr, y_tr)\nprint(f'Độ chính xác: {clf.score(X_te, y_te):.3f}')",
    executionCount: null,
    simulatedOutput: "Độ chính xác: 0.967",
  },
];

// ---------------------------------------------------------------------------
// NOTEBOOK MÔ PHỎNG — Component con
// ---------------------------------------------------------------------------

interface NotebookSimulatorProps {
  onProgress?: (executed: number, total: number) => void;
}

function NotebookSimulator({ onProgress }: NotebookSimulatorProps) {
  const [state, setState] = useState<NotebookState>({
    cells: INITIAL_CELLS.map((c) => ({ ...c })),
    runtime: "CPU",
    driveMounted: false,
    installedPackages: [],
    execCounter: 0,
  });

  const totalCodeCells = useMemo(
    () => state.cells.filter((c) => c.kind === "code").length,
    [state.cells]
  );
  const executedCount = useMemo(
    () => state.cells.filter((c) => c.kind === "code" && c.executed).length,
    [state.cells]
  );

  // Chạy một cell — cập nhật trạng thái và tạo output tương ứng
  const runCell = useCallback(
    (cellId: string) => {
      setState((prev) => {
        const cellIdx = prev.cells.findIndex((c) => c.id === cellId);
        if (cellIdx === -1) return prev;
        const cell = prev.cells[cellIdx];
        if (cell.kind !== "code") return prev;

        // Ngăn chặn cài gói khi runtime chưa kịp khởi tạo
        if (cell.content.startsWith("!nvidia-smi") && prev.runtime === "CPU") {
          const updatedCells = [...prev.cells];
          updatedCells[cellIdx] = {
            ...cell,
            running: false,
            executed: true,
            executionCount: prev.execCounter + 1,
            simulatedOutput:
              "/bin/bash: nvidia-smi: command not found\n(Runtime hiện tại là CPU — hãy đổi sang T4 GPU trước khi chạy)",
          };
          const nextState: NotebookState = {
            ...prev,
            cells: updatedCells,
            execCounter: prev.execCounter + 1,
          };
          onProgress?.(
            nextState.cells.filter(
              (c) => c.kind === "code" && c.executed
            ).length,
            nextState.cells.filter((c) => c.kind === "code").length
          );
          return nextState;
        }

        // Mô phỏng `drive.mount`
        if (cell.content.includes("drive.mount")) {
          const updatedCells = [...prev.cells];
          updatedCells[cellIdx] = {
            ...cell,
            running: false,
            executed: true,
            executionCount: prev.execCounter + 1,
          };
          const nextState: NotebookState = {
            ...prev,
            cells: updatedCells,
            driveMounted: true,
            execCounter: prev.execCounter + 1,
          };
          onProgress?.(
            nextState.cells.filter(
              (c) => c.kind === "code" && c.executed
            ).length,
            nextState.cells.filter((c) => c.kind === "code").length
          );
          return nextState;
        }

        // Mô phỏng `pip install`
        if (cell.content.startsWith("!pip install")) {
          const pkgs = cell.content
            .replace("!pip install -q", "")
            .trim()
            .split(/\s+/)
            .map((p) => p.split("==")[0]);
          const updatedCells = [...prev.cells];
          updatedCells[cellIdx] = {
            ...cell,
            running: false,
            executed: true,
            executionCount: prev.execCounter + 1,
          };
          const nextState: NotebookState = {
            ...prev,
            cells: updatedCells,
            installedPackages: Array.from(
              new Set([...prev.installedPackages, ...pkgs])
            ),
            execCounter: prev.execCounter + 1,
          };
          onProgress?.(
            nextState.cells.filter(
              (c) => c.kind === "code" && c.executed
            ).length,
            nextState.cells.filter((c) => c.kind === "code").length
          );
          return nextState;
        }

        // Mô phỏng các cell còn lại: yêu cầu Drive mount nếu đọc từ drive
        if (
          cell.content.includes("/content/drive") &&
          !prev.driveMounted
        ) {
          const updatedCells = [...prev.cells];
          updatedCells[cellIdx] = {
            ...cell,
            running: false,
            executed: true,
            executionCount: prev.execCounter + 1,
            simulatedOutput:
              "FileNotFoundError: [Errno 2] No such file or directory: '/content/drive/MyDrive/datasets/iris.csv'\n(Gợi ý: bạn quên chạy cell drive.mount ở trên)",
          };
          const nextState: NotebookState = {
            ...prev,
            cells: updatedCells,
            execCounter: prev.execCounter + 1,
          };
          onProgress?.(
            nextState.cells.filter(
              (c) => c.kind === "code" && c.executed
            ).length,
            nextState.cells.filter((c) => c.kind === "code").length
          );
          return nextState;
        }

        // Mặc định — cell chạy thành công với simulatedOutput đã định sẵn
        const updatedCells = [...prev.cells];
        updatedCells[cellIdx] = {
          ...cell,
          running: false,
          executed: true,
          executionCount: prev.execCounter + 1,
        };
        const nextState: NotebookState = {
          ...prev,
          cells: updatedCells,
          execCounter: prev.execCounter + 1,
        };
        onProgress?.(
          nextState.cells.filter(
            (c) => c.kind === "code" && c.executed
          ).length,
          nextState.cells.filter((c) => c.kind === "code").length
        );
        return nextState;
      });
    },
    [onProgress]
  );

  const runAll = useCallback(() => {
    state.cells
      .filter((c) => c.kind === "code")
      .forEach((c) => runCell(c.id));
  }, [state.cells, runCell]);

  const resetNotebook = useCallback(() => {
    setState({
      cells: INITIAL_CELLS.map((c) => ({ ...c })),
      runtime: "CPU",
      driveMounted: false,
      installedPackages: [],
      execCounter: 0,
    });
  }, []);

  const changeRuntime = useCallback(
    (runtime: NotebookState["runtime"]) => {
      setState((prev) => ({ ...prev, runtime }));
    },
    []
  );

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Thanh công cụ trên cùng — giả lập Colab toolbar */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-border bg-card">
        <span className="text-xs font-mono text-muted">
          iris_experiment.ipynb
        </span>
        <span className="ml-2 text-[11px] text-muted">
          {executedCount}/{totalCodeCells} cell đã chạy
        </span>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-[11px] text-muted">Runtime:</label>
          <select
            value={state.runtime}
            onChange={(e) =>
              changeRuntime(e.target.value as NotebookState["runtime"])
            }
            className="rounded-md border border-border bg-background px-2 py-1 text-[11px] text-foreground"
          >
            <option value="CPU">CPU</option>
            <option value="T4 GPU">T4 GPU</option>
            <option value="V100 GPU">V100 GPU</option>
            <option value="TPU v2">TPU v2</option>
          </select>
          <button
            type="button"
            onClick={runAll}
            className="rounded-md border border-accent bg-accent px-2.5 py-1 text-[11px] font-semibold text-white hover:opacity-90"
          >
            Chạy tất cả
          </button>
          <button
            type="button"
            onClick={resetNotebook}
            className="rounded-md border border-border bg-background px-2.5 py-1 text-[11px] text-muted hover:text-foreground"
          >
            Đặt lại
          </button>
        </div>
      </div>

      {/* Dải trạng thái thứ hai — cho biết trạng thái Drive và gói đã cài */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-1.5 border-b border-border bg-background text-[11px] text-muted">
        <span>
          Drive:{" "}
          <strong
            className={
              state.driveMounted ? "text-emerald-500" : "text-amber-500"
            }
          >
            {state.driveMounted ? "đã mount" : "chưa mount"}
          </strong>
        </span>
        <span>
          Gói đã cài:{" "}
          <strong className="text-foreground">
            {state.installedPackages.length
              ? state.installedPackages.join(", ")
              : "(chưa có)"}
          </strong>
        </span>
      </div>

      {/* Danh sách cell */}
      <div className="space-y-3 p-3">
        {state.cells.map((cell) => (
          <NotebookCellView
            key={cell.id}
            cell={cell}
            onRun={() => runCell(cell.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// HIỂN THỊ MỘT CELL — code / markdown / output
// ---------------------------------------------------------------------------

function NotebookCellView({
  cell,
  onRun,
}: {
  cell: NotebookCell;
  onRun: () => void;
}) {
  if (cell.kind === "markdown") {
    return (
      <div className="rounded-lg border border-border/60 bg-background p-3 text-sm leading-relaxed">
        {cell.content.split("\n").map((line, i) => {
          if (line.startsWith("# ")) {
            return (
              <h2 key={i} className="text-lg font-semibold text-foreground">
                {line.replace(/^# /, "")}
              </h2>
            );
          }
          if (line.startsWith("## ")) {
            return (
              <h3
                key={i}
                className="mt-2 text-sm font-semibold text-foreground"
              >
                {line.replace(/^## /, "")}
              </h3>
            );
          }
          if (!line.trim()) return <div key={i} className="h-2" />;
          return (
            <p key={i} className="text-sm text-muted">
              {line}
            </p>
          );
        })}
      </div>
    );
  }

  // Code cell
  return (
    <div className="rounded-lg border border-border/60 bg-background overflow-hidden">
      <div className="flex items-start">
        {/* Cột execution count */}
        <div className="shrink-0 w-14 py-2 text-center border-r border-border/60 bg-surface/40">
          <span className="text-[11px] font-mono text-muted">
            [{cell.executionCount ?? " "}]
          </span>
          <button
            type="button"
            onClick={onRun}
            disabled={cell.running}
            className="mt-1 block mx-auto rounded-full w-6 h-6 border border-border bg-background hover:bg-accent hover:text-white hover:border-accent text-muted text-[11px] leading-none"
            title="Chạy cell"
            aria-label="Chạy cell"
          >
            ▶
          </button>
        </div>

        {/* Nội dung code */}
        <div className="flex-1 overflow-x-auto">
          <pre
            className="p-3 text-[13px] leading-relaxed"
            style={{ backgroundColor: "#1e1e2e", color: "#cdd6f4" }}
          >
            <code className="font-mono whitespace-pre">{cell.content}</code>
          </pre>
        </div>
      </div>

      {/* Output */}
      {cell.executed && cell.simulatedOutput && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.25 }}
          className="border-t border-border/60 bg-surface/40 overflow-hidden"
        >
          <pre className="p-3 text-[12px] font-mono text-foreground leading-relaxed whitespace-pre-wrap">
            {cell.simulatedOutput}
          </pre>
        </motion.div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// BẢNG SO SÁNH NOTEBOOK TOOLS (Jupyter / Colab / Kaggle / VS Code)
// ---------------------------------------------------------------------------

type ToolId = "jupyter" | "colab" | "kaggle" | "vscode";

interface ToolProfile {
  id: ToolId;
  nameVi: string;
  tagline: string;
  icon: string;
  rows: { feature: string; value: string; tone?: "good" | "bad" | "neutral" }[];
}

const TOOL_PROFILES: ToolProfile[] = [
  {
    id: "jupyter",
    nameVi: "Jupyter Notebook",
    tagline: "Notebook gốc chạy local trên máy bạn",
    icon: "🧪",
    rows: [
      { feature: "Cài đặt", value: "Cần cài Python + pip + jupyter", tone: "bad" },
      { feature: "GPU", value: "Chỉ nếu máy bạn có card NVIDIA", tone: "bad" },
      { feature: "Chia sẻ", value: "Xuất .ipynb hoặc qua nbviewer", tone: "neutral" },
      { feature: "Giới hạn runtime", value: "Không có — bạn tự quản lý", tone: "good" },
      { feature: "Phù hợp", value: "Dataset lớn, cần kiểm soát môi trường", tone: "good" },
      { feature: "Thu phí", value: "Miễn phí (tính phí phần cứng riêng)", tone: "neutral" },
    ],
  },
  {
    id: "colab",
    nameVi: "Google Colab",
    tagline: "Notebook chạy trên cloud của Google, có GPU miễn phí",
    icon: "☁️",
    rows: [
      { feature: "Cài đặt", value: "Không cần — chạy trong trình duyệt", tone: "good" },
      { feature: "GPU", value: "T4/A100 miễn phí (Pro trả phí)", tone: "good" },
      { feature: "Chia sẻ", value: "Link Google Drive, giống Google Docs", tone: "good" },
      { feature: "Giới hạn runtime", value: "~12h gói miễn phí, idle timeout 90 phút", tone: "bad" },
      { feature: "Phù hợp", value: "Học tập, prototype, demo GPU", tone: "good" },
      { feature: "Thu phí", value: "Miễn phí hoặc Pro $10/tháng", tone: "neutral" },
    ],
  },
  {
    id: "kaggle",
    nameVi: "Kaggle Notebooks",
    tagline: "Tích hợp sâu với dataset và cuộc thi Kaggle",
    icon: "🏆",
    rows: [
      { feature: "Cài đặt", value: "Không cần — chạy trong trình duyệt", tone: "good" },
      { feature: "GPU", value: "30h GPU P100/T4/tuần miễn phí", tone: "good" },
      { feature: "Chia sẻ", value: "Public/private trên Kaggle", tone: "neutral" },
      { feature: "Giới hạn runtime", value: "9h/phiên, 20GB output", tone: "neutral" },
      { feature: "Phù hợp", value: "Khám phá dataset, tham gia cuộc thi", tone: "good" },
      { feature: "Thu phí", value: "Miễn phí hoàn toàn", tone: "good" },
    ],
  },
  {
    id: "vscode",
    nameVi: "VS Code Notebooks",
    tagline: "Notebook .ipynb mở trong editor bản địa của bạn",
    icon: "🛠",
    rows: [
      { feature: "Cài đặt", value: "Cần VS Code + Jupyter extension + kernel", tone: "bad" },
      { feature: "GPU", value: "Phụ thuộc máy local hoặc remote SSH", tone: "neutral" },
      { feature: "Chia sẻ", value: "Qua Git, tương tự file code thường", tone: "good" },
      { feature: "Giới hạn runtime", value: "Không có — giới hạn theo máy", tone: "good" },
      { feature: "Phù hợp", value: "Dự án lớn, mix notebook + module Python", tone: "good" },
      { feature: "Thu phí", value: "Miễn phí (editor) + chi phí máy", tone: "neutral" },
    ],
  },
];

function ToolComparisonTabs() {
  const [active, setActive] = useState<ToolId>("colab");
  const current = TOOL_PROFILES.find((t) => t.id === active) ?? TOOL_PROFILES[0];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Tab header */}
      <div className="flex border-b border-border bg-surface">
        {TOOL_PROFILES.map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => setActive(tool.id)}
            className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors border-r last:border-r-0 border-border ${
              active === tool.id
                ? "bg-card text-foreground border-b-2 border-b-accent -mb-px"
                : "text-muted hover:text-foreground"
            }`}
          >
            <span className="mr-1">{tool.icon}</span>
            {tool.nameVi}
          </button>
        ))}
      </div>

      {/* Tab body */}
      <div className="p-4 space-y-3">
        <p className="text-sm text-muted italic">{current.tagline}</p>
        <div className="space-y-1.5">
          {current.rows.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-[130px_1fr] gap-3 items-start text-sm"
            >
              <span className="text-muted">{row.feature}</span>
              <span
                className={
                  row.tone === "good"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : row.tone === "bad"
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-foreground"
                }
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN TOPIC COMPONENT
// ---------------------------------------------------------------------------

export default function JupyterColabWorkflowTopic() {
  // Theo dõi tiến độ notebook để hiện ProgressSteps
  const [notebookProgress, setNotebookProgress] = useState({
    executed: 0,
    total: 0,
  });

  const handleProgress = useCallback((executed: number, total: number) => {
    setNotebookProgress({ executed, total });
  }, []);

  const currentStep = useMemo(() => {
    if (notebookProgress.total === 0) return 1;
    if (notebookProgress.executed === 0) return 1;
    if (notebookProgress.executed < 2) return 2;
    if (notebookProgress.executed < 4) return 3;
    if (notebookProgress.executed < notebookProgress.total) return 4;
    return 5;
  }, [notebookProgress]);

  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "Ưu điểm lớn nhất của Google Colab so với Jupyter Notebook chạy trên máy tính cá nhân là gì?",
        options: [
          "Colab hỗ trợ nhiều ngôn ngữ lập trình hơn",
          "Colab cung cấp GPU/TPU miễn phí, không cần cài đặt phần mềm",
          "Colab có giao diện đẹp hơn Jupyter",
          "Colab chạy code nhanh hơn Jupyter trong mọi trường hợp",
        ],
        correct: 1,
        explanation:
          "Google Colab cung cấp GPU và TPU miễn phí, chạy hoàn toàn trên trình duyệt — không cần cài Python, thư viện hay driver GPU. Đây là lý do Colab lý tưởng cho người mới bắt đầu ML.",
      },
      {
        question:
          "Khi chạy cell chứa lệnh `!pip install numpy` trên Colab, dấu chấm than `!` có ý nghĩa gì?",
        options: [
          "Báo cho Python biết đây là câu lệnh quan trọng",
          "Đánh dấu cell sẽ chạy với GPU thay vì CPU",
          "Thực thi lệnh như một lệnh shell chứ không phải Python",
          "Chạy lệnh song song với các cell khác",
        ],
        correct: 2,
        explanation:
          "Dấu `!` trước một lệnh trong notebook có nghĩa là câu lệnh đó được thực thi trong shell của hệ điều hành — y hệt khi bạn gõ trong terminal. Đây là cách cài gói pip, xem GPU, hay tải dataset từ bên trong notebook.",
      },
      {
        question:
          "Khi kết nối Google Drive vào Colab bằng `drive.mount('/content/drive')`, điều gì thật sự xảy ra?",
        options: [
          "Drive của bạn được tải toàn bộ về máy Google Colab",
          "Colab tạo một liên kết xem qua (read-only) đến Drive",
          "Colab mount thư mục Drive như một ổ đĩa, đọc/ghi theo yêu cầu qua mạng",
          "Colab sao chép Drive vào một thư mục tạm và xóa khi dừng",
        ],
        correct: 2,
        explanation:
          "`drive.mount` gắn Drive như một filesystem ảo — mỗi lần bạn `open()` một file, Colab gọi Drive API để lấy dữ liệu. Điều này giải thích vì sao đọc nhiều file nhỏ trên Drive chậm hơn hẳn so với sao chép trước về `/content`.",
      },
      {
        question:
          "Vì sao sau khi runtime Colab hết hạn, tất cả biến trong notebook bị mất?",
        options: [
          "Google xóa sổ tay của bạn khỏi Drive",
          "Runtime là một máy ảo tạm thời — hết phiên thì máy ảo bị hủy",
          "Biến quá lớn nên hệ thống dọn rác đã giải phóng",
          "Notebook tự động ghi biến vào file backup",
        ],
        correct: 1,
        explanation:
          "Runtime Colab thực chất là một VM dùng một lần (ephemeral). Khi phiên hết hạn hoặc bị idle quá lâu, VM bị thu hồi — cùng với toàn bộ biến trong RAM. Vì thế, nếu muốn giữ kết quả, hãy lưu ra Drive hoặc file.",
      },
      {
        question:
          "Khi muốn phiên làm việc có thể tái lặp được cho người khác, cách tốt nhất là gì?",
        options: [
          "Gửi link notebook — người nhận tự chạy lại là xong",
          "Chỉ cần ghi lại phiên bản Python đang dùng",
          "Ghi rõ phiên bản từng thư viện và thứ tự chạy cell, tốt hơn nữa là kèm requirements.txt",
          "Ghi tên GPU đã dùng để người khác mượn GPU giống vậy",
          ],
        correct: 2,
        explanation:
          "Khoá chặt phiên bản (pin versions) bằng `requirements.txt` hoặc lệnh `!pip install pkg==X.Y` giúp người khác chạy lại được kết quả mà không bị gãy do thay đổi API. Thứ tự chạy cell cũng quan trọng vì notebook không ép buộc thứ tự như file .py.",
      },
      {
        question:
          "Trong tình huống nào Jupyter Notebook chạy local lại là lựa chọn hợp lý hơn Colab?",
        options: [
          "Khi bạn cần thử nghiệm nhanh một ý tưởng 10 dòng code",
          "Khi dataset là vài trăm MB và dễ upload",
          "Khi bạn làm việc với dữ liệu nhạy cảm không được rời khỏi máy nội bộ",
          "Khi bạn cần chia sẻ cho đồng nghiệp khắp thế giới xem kết quả",
        ],
        correct: 2,
        explanation:
          "Dữ liệu nhạy cảm (y tế, tài chính, nội bộ công ty) thường không được phép upload lên cloud bên thứ ba. Trong trường hợp đó, Jupyter chạy local (hoặc JupyterHub nội bộ) là lựa chọn đúng đắn. Colab tỏa sáng khi bạn không có GPU và dữ liệu công khai.",
      },
      {
        question:
          'Lỗi "ModuleNotFoundError" sau khi đã `pip install` thường bắt nguồn từ đâu?',
        options: [
          "pip cài vào Python khác với kernel Jupyter đang dùng",
          "Tên module bạn gõ bị sai chính tả",
          "Thư viện không tương thích với Colab",
          "Máy chủ PyPI bị tắt tạm thời",
        ],
        correct: 0,
        explanation:
          'Đây là lỗi kinh điển. Trong notebook nên dùng `%pip install pkg` thay vì `!pip install pkg` để đảm bảo pip cài vào đúng kernel đang chạy. Cách khác là gọi `sys.executable -m pip install pkg` để chỉ định interpreter rõ ràng.',
      },
      {
        question:
          "Khi nào nên dùng `%%time` ở đầu cell thay vì `import time` + `time.time()`?",
        options: [
          "Luôn dùng %%time — nhanh hơn",
          "Khi bạn muốn đo toàn bộ cell một cách nhanh gọn, không viết thêm code timing",
          "Chỉ khi cell chứa lệnh shell",
          "Chỉ khi chạy trên GPU",
        ],
        correct: 1,
        explanation:
          "`%%time` là magic command của IPython — đặt ở dòng đầu cell sẽ đo wall-time và CPU-time của toàn bộ cell mà không cần thêm import. Nó rất hữu ích khi benchmark nhanh. `%%timeit` còn chạy nhiều lần để lấy trung bình.",
      },
    ],
    []
  );

  return (
    <>
      {/* ===================================================================
          BƯỚC 1 — HOOK / DỰ ĐOÁN
          =================================================================== */}
      <LessonSection label="Khởi động" step={1} totalSteps={8}>
        <PredictionGate
          question="Bạn đang muốn huấn luyện một mạng nơ-ron nhỏ, nhưng máy tính của bạn không có GPU. Công cụ nào sau đây cho bạn GPU miễn phí để thử nghiệm?"
          options={[
            "Jupyter Notebook cài trên máy — có thể bật chế độ GPU ảo",
            "Google Colab — chạy trên trình duyệt, có Tesla T4 miễn phí",
            "VS Code Notebooks — luôn có GPU ảo khi mở file .ipynb",
            "Không có cách nào ngoài việc mua card GPU",
          ]}
          correct={1}
          explanation="Google Colab cấp phát GPU miễn phí (Tesla T4) cho mỗi phiên — bạn chỉ cần đổi Runtime trong menu. Jupyter local không có GPU ảo; nó dùng phần cứng sẵn có trên máy bạn."
        >
          <p className="text-sm text-muted mt-2">
            Bài học hôm nay hướng dẫn bạn từng bước chạy thí nghiệm ML đầu tiên
            trên Colab — từ chọn runtime đến mount Drive và cài đặt gói.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ===================================================================
          BƯỚC 2 — ẨN DỤ THỰC TẾ
          =================================================================== */}
      <LessonSection label="Ẩn dụ" step={2} totalSteps={8}>
        <p>
          Hãy tưởng tượng notebook giống như một <strong>cuốn sổ bếp</strong>{" "}
          vừa viết công thức, vừa nấu được món ăn ngay tại chỗ. Mỗi ô (cell) là
          một bước: có ô là ghi chú (markdown), có ô là thao tác thực sự (code),
          và có ô ghi lại <em>kết quả</em> của thao tác đó (output). Bạn có thể
          chạy lại bất kỳ bước nào mà không cần làm lại từ đầu.
        </p>
        <p>
          Điểm mấu chốt là <strong>trạng thái (state) được giữ lại giữa các
          cell</strong>: biến tạo ở cell 1 vẫn dùng được ở cell 5. Đây vừa là
          điểm mạnh — bạn thử nghiệm từng phần nhỏ — vừa là cái bẫy quen thuộc,
          vì chạy cell không theo thứ tự có thể tạo ra kết quả rất khó tái lặp.
        </p>
        <p>
          Colab là phiên bản notebook chạy trên cloud: giống như có một{" "}
          <strong>căn bếp đầy đủ nồi niêu GPU</strong> mà bạn có thể mượn trong
          vài giờ. Bạn không cần đầu tư sắm sửa — nhưng cũng phải dọn dẹp (save
          kết quả) trước khi chủ bếp thu lại.
        </p>
        <Callout variant="info" title="Trạng thái runtime là gì?">
          Mỗi notebook có một <em>runtime</em> — về bản chất là một tiến trình
          Python đang chạy. Biến, import, hàm bạn định nghĩa đều nằm trong
          tiến trình đó. Khi runtime tắt (hoặc bạn restart), toàn bộ biến biến
          mất, bạn phải chạy lại các cell cần thiết.
        </Callout>
      </LessonSection>

      {/* ===================================================================
          BƯỚC 3 — TRỰC QUAN HÓA: NOTEBOOK MÔ PHỎNG + TAB SO SÁNH
          =================================================================== */}
      <VisualizationSection>
        <LessonSection label="Mô phỏng Colab" step={1}>
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Sổ tay bên dưới là phiên bản mô phỏng Google Colab. Thử nhấn nút
              ▶ bên cạnh từng cell — output sẽ hiện ra như khi bạn chạy thật.
              Nhớ rằng: bạn cần đổi runtime sang T4 GPU <em>trước</em> khi gọi
              `!nvidia-smi`, và phải mount Drive <em>trước</em> khi đọc file
              từ `/content/drive`.
            </p>

            <div className="my-3">
              <ProgressSteps
                current={currentStep}
                total={5}
                labels={[
                  "Chọn runtime phù hợp",
                  "Kiểm tra GPU",
                  "Mount Google Drive",
                  "Cài gói & đọc dữ liệu",
                  "Huấn luyện & đánh giá",
                ]}
              />
            </div>

            <NotebookSimulator onProgress={handleProgress} />

            <Callout variant="tip" title="Thử các kịch bản sau">
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Giữ runtime là CPU rồi chạy cell `!nvidia-smi` — bạn sẽ
                  thấy lỗi <code>command not found</code>.
                </li>
                <li>
                  Chạy cell đọc file trước khi mount Drive — bạn sẽ nhận
                  được <code>FileNotFoundError</code>, gợi ý phải mount
                  trước.
                </li>
                <li>
                  Nhấn "Đặt lại" để xoá toàn bộ output và thử lại theo
                  đúng thứ tự.
                </li>
              </ul>
            </Callout>
          </div>
        </LessonSection>

        <LessonSection label="So sánh 4 công cụ notebook" step={2}>
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Không có "công cụ tốt nhất" — chỉ có công cụ phù hợp nhất cho
              tình huống. Nhấn các tab để so sánh Jupyter, Colab, Kaggle, và
              VS Code Notebooks theo 6 tiêu chí thực tế.
            </p>
            <ToolComparisonTabs />
            <Callout variant="insight" title="Mẹo chọn công cụ">
              Nếu bạn đang học — bắt đầu với Colab. Nếu bạn đang làm cuộc thi
              dataset lớn — Kaggle. Nếu bạn đã chuyển sang dự án sản phẩm —
              VS Code + Jupyter kernel. Jupyter "trần" hợp khi bạn cần kiểm
              soát hoàn toàn môi trường local.
            </Callout>
          </div>
        </LessonSection>
      </VisualizationSection>

      {/* ===================================================================
          BƯỚC 4 — KHOẢNH KHẮC AHA
          =================================================================== */}
      <LessonSection label="Insight cốt lõi" step={3} totalSteps={8}>
        <AhaMoment>
          Notebook không phải là một <em>file</em> — nó là một{" "}
          <strong>phiên làm việc sống</strong>. Code bạn viết chỉ là kịch bản;
          kết quả bạn thấy phụ thuộc vào <strong>thứ tự bạn chạy cell</strong>,
          các gói đã cài, và trạng thái runtime hiện tại. Ai làm chủ được bộ
          ba này, người đó làm chủ notebook.
        </AhaMoment>
      </LessonSection>

      {/* ===================================================================
          BƯỚC 5 — THÁCH THỨC NHỎ (1)
          =================================================================== */}
      <LessonSection label="Thử sức" step={4} totalSteps={8}>
        <InlineChallenge
          question="Bạn vừa chạy cell `import pandas as pd` thành công, nhưng cell tiếp theo `pd.read_csv(...)` báo 'pd is not defined'. Chuyện gì có khả năng xảy ra nhất?"
          options={[
            "Runtime đã bị khởi động lại (restart) giữa hai lần chạy — import bị mất",
            "Phiên bản pandas quá cũ nên thiếu `read_csv`",
            "Bạn quên dấu ngoặc nhọn trong câu import",
            "Colab không hỗ trợ pandas trực tiếp",
          ]}
          correct={0}
          explanation="Khi runtime bị restart (thủ công hoặc do idle timeout), mọi biến và import bị xoá. Nếu bạn chỉ chạy cell đọc file mà không chạy lại cell import, Python không biết `pd` là gì. Giải pháp: Runtime → Run all, hoặc Runtime → Restart and run all."
        />
      </LessonSection>

      {/* ===================================================================
          BƯỚC 6 — GIẢI THÍCH SÂU
          =================================================================== */}
      <ExplanationSection>
        <LessonSection label="Cấu trúc file .ipynb" step={1}>
          <p>
            Một notebook thực chất là một file JSON có đuôi{" "}
            <code>.ipynb</code>. Trong file này có danh sách cell, mỗi cell
            ghi rõ loại (code / markdown / raw), nội dung, và{" "}
            <strong>execution count</strong> — con số trong ngoặc vuông kế
            bên cell. Execution count tăng mỗi khi bạn chạy một cell, giúp
            bạn biết thứ tự các cell đã được chạy thực sự.
          </p>
          <CodeBlock language="json" title="Ví dụ cell trong .ipynb">
            {`{
  "cells": [
    {
      "cell_type": "code",
      "execution_count": 3,
      "metadata": {},
      "outputs": [
        { "output_type": "stream",
          "text": "Độ chính xác: 0.967\\n" }
      ],
      "source": [ "clf.score(X_te, y_te)" ]
    }
  ],
  "metadata": {
    "kernelspec": { "name": "python3" }
  },
  "nbformat": 4
}`}
          </CodeBlock>
          <p>
            Khi bạn commit file .ipynb lên Git, cẩn thận: output giả kết quả
            có thể thay đổi mỗi lần chạy, khiến diff bị ồn. Một mẹo phổ biến
            là dùng <code>nbstripout</code> để xoá output trước khi commit,
            chỉ giữ lại mã nguồn.
          </p>
        </LessonSection>

        <LessonSection label="Thiết lập Colab đúng cách" step={2}>
          <p>
            Khi bắt đầu thí nghiệm trên Colab, có <strong>4 bước chuẩn</strong>{" "}
            nên làm theo thứ tự. Làm sai thứ tự là nguyên nhân phổ biến
            khiến người mới gặp lỗi khó hiểu.
          </p>
          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li>
              <strong>Đổi runtime</strong> — Menu{" "}
              <code>Runtime → Change runtime type</code>, chọn <em>T4 GPU</em>{" "}
              hoặc <em>TPU</em>. Mỗi lần đổi, Colab sẽ restart VM — mọi biến
              sẽ bị xoá.
            </li>
            <li>
              <strong>Mount Drive</strong> — Nếu dataset của bạn ở Drive, hãy
              mount ngay sau khi đổi runtime. Bạn sẽ được yêu cầu đăng nhập
              và cấp quyền cho Colab.
            </li>
            <li>
              <strong>Cài gói pip</strong> — Dùng{" "}
              <code>%pip install pkg==X.Y</code> để cài vào đúng kernel đang
              chạy. Tránh <code>!pip</code> vì trong một số trường hợp gói
              bị cài vào Python khác.
            </li>
            <li>
              <strong>Import & kiểm tra phiên bản</strong> — Sau khi cài,
              luôn in ra <code>torch.__version__</code>,{" "}
              <code>sklearn.__version__</code>... để chắc chắn đã đúng bản.
            </li>
          </ol>
          <CodeBlock language="python" title="Template setup chuẩn cho Colab">
            {`# 1. Kiểm tra GPU đã được cấp phát chưa
!nvidia-smi | head -n 20

# 2. Mount Drive (sẽ mở cửa sổ xác thực OAuth)
from google.colab import drive
drive.mount('/content/drive')

# 3. Cài các gói cần thiết, pin phiên bản để tái lặp được
%pip install -q \\
  scikit-learn==1.4.0 \\
  pandas==2.2.0 \\
  matplotlib==3.8.3

# 4. Import & kiểm tra version
import sklearn, pandas as pd, torch
print(f"sklearn={sklearn.__version__}  pandas={pd.__version__}")
print(f"torch={torch.__version__}  cuda={torch.cuda.is_available()}")

# 5. Đường dẫn đến dataset trên Drive
DATA_DIR = '/content/drive/MyDrive/datasets'`}
          </CodeBlock>
          <Callout variant="warning" title="Cẩn thận khi mount Drive">
            Khi mount, Colab được cấp quyền đọc/ghi toàn bộ Drive của bạn.
            Nếu bạn chia sẻ notebook cho người khác,{" "}
            <strong>hãy xoá cell `drive.mount` trước khi chia sẻ</strong> —
            không ai muốn cấp quyền vào Drive của bạn chỉ vì muốn xem kết
            quả.
          </Callout>
        </LessonSection>

        <LessonSection label="Công thức toán trong markdown" step={3}>
          <p>
            Notebook hỗ trợ LaTeX ngay trong markdown cell. Điều này cực hữu
            ích khi trình bày lý thuyết — ví dụ, khi giải thích độ đo RMSE,
            bạn có thể viết công thức:
          </p>
          <LaTeX block>
            {`\\mathrm{RMSE} = \\sqrt{ \\frac{1}{n} \\sum_{i=1}^{n} (y_i - \\hat{y}_i)^2 }`}
          </LaTeX>
          <p>
            Trong ô markdown, chỉ cần bọc công thức trong <code>$...$</code>{" "}
            (inline) hoặc <code>$$...$$</code> (block). Colab, Jupyter và
            nbviewer đều hiểu được. Đây là cách giảng viên ML hay giữ tài
            liệu của họ sống: vừa là lecture, vừa là code chạy được.
          </p>
        </LessonSection>

        <LessonSection label="Workflow với sklearn" step={4}>
          <p>
            Sau khi đã có môi trường, workflow ML cổ điển với{" "}
            <code>scikit-learn</code> gồm 5 bước: nạp dữ liệu, chia
            train/test, fit mô hình, dự đoán, đánh giá. Dưới đây là bản đầy
            đủ cho bài toán Iris.
          </p>
          <CodeBlock
            language="python"
            title="sklearn — phân loại Iris đầy đủ"
          >
            {`import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, confusion_matrix

# 1) Nạp dữ liệu từ Drive đã mount
df = pd.read_csv('/content/drive/MyDrive/datasets/iris.csv')
X = df.drop(columns=['species'])
y = df['species']

# 2) Chia train/test với seed cố định để tái lặp
X_tr, X_te, y_tr, y_te = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)

# 3) Pipeline: chuẩn hoá đặc trưng trước khi fit
clf = Pipeline([
    ('scaler', StandardScaler()),
    ('lr', LogisticRegression(max_iter=200, multi_class='multinomial')),
])
clf.fit(X_tr, y_tr)

# 4) Dự đoán
y_pred = clf.predict(X_te)

# 5) Đánh giá
print(classification_report(y_te, y_pred, digits=3))
print("Ma trận nhầm lẫn:")
print(confusion_matrix(y_te, y_pred))`}
          </CodeBlock>
          <p>
            Chú ý vài điểm quan trọng: dùng <code>stratify=y</code> để giữ tỉ
            lệ lớp giữa train/test; đặt <code>random_state</code> để kết quả
            tái lặp được; dùng <code>Pipeline</code> thay vì fit scaler rời
            để tránh rò rỉ dữ liệu (data leakage) từ test sang train.
          </p>
          <Callout variant="insight" title="Data leakage là gì?">
            Nếu bạn fit StandardScaler trên toàn bộ dataset trước khi chia
            train/test, thống kê (mean, std) đã "thấy" dữ liệu test. Điều này
            khiến đánh giá trên test bị lệch theo hướng lạc quan. Dùng
            Pipeline tránh được lỗi này tự động.
          </Callout>
        </LessonSection>

        <LessonSection label="Bẫy và giải pháp" step={5}>
          <p>
            Dưới đây là các cạm bẫy phổ biến nhất mà người mới gặp trên
            Colab/Jupyter. Nắm được trước sẽ tiết kiệm cho bạn rất nhiều giờ
            debug.
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>Chạy cell không theo thứ tự</strong> — Execution count
              nhảy lung tung (5, 2, 8, 3...) là dấu hiệu. Giải pháp:{" "}
              <code>Runtime → Restart and run all</code> trước khi chia sẻ.
            </li>
            <li>
              <strong>Cell "ma" còn sót state</strong> — Bạn xoá định nghĩa
              hàm khỏi cell, nhưng hàm đã được import vào runtime từ trước
              nên vẫn chạy được. Người khác mở notebook lại bị lỗi.
            </li>
            <li>
              <strong>`!pip install` nhưng kernel không thấy</strong> — Lỗi
              <code>ModuleNotFoundError</code> ngay sau khi cài. Đổi sang{" "}
              <code>%pip install</code>.
            </li>
            <li>
              <strong>Notebook ăn RAM vô hạn</strong> — Gán các DataFrame
              lớn vào biến rồi không xoá. Khi RAM đầy Colab treo, bạn mất
              tiến độ. Giải pháp: <code>del df; import gc; gc.collect()</code>
              .
            </li>
            <li>
              <strong>Quên lưu trước khi runtime hết hạn</strong> — Kết quả
              huấn luyện 2 giờ bay mất. Luôn{" "}
              <code>joblib.dump(clf, '/content/drive/.../model.pkl')</code>{" "}
              ra Drive ngay sau khi fit xong.
            </li>
          </ul>

          <CollapsibleDetail title="Nâng cao: tăng tốc Colab bằng cache dữ liệu">
            <p>
              Đọc file từ Drive qua mạng chậm — mỗi file nhỏ mất ~100ms. Nếu
              bạn có 10k ảnh, thời gian I/O có thể chiếm 90% tổng thời gian
              huấn luyện. Mẹo: sao chép dataset một lần từ Drive vào{" "}
              <code>/content/</code> (SSD cục bộ của VM) ngay sau khi mount,
              rồi dùng dữ liệu ở <code>/content/</code>.
            </p>
            <CodeBlock language="python">
              {`import shutil, os, time

SRC = '/content/drive/MyDrive/datasets/cifar10'
DST = '/content/cifar10'

if not os.path.exists(DST):
    t0 = time.time()
    shutil.copytree(SRC, DST)
    print(f'Copied dataset in {time.time()-t0:.1f}s')

# Dùng DST thay cho SRC trong DataLoader
train_dir = f'{DST}/train'`}
            </CodeBlock>
            <p>
              Trên các dataset lớn, trick này có thể tăng tốc huấn luyện
              từ 3x đến 10x — chi phí chỉ là thời gian copy ban đầu.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Khi nào nên chuyển sang script Python?">
            <p>
              Notebook lý tưởng cho <em>khám phá</em> — bạn thử một ý, xem
              kết quả, sửa, thử lại. Nhưng khi pipeline đã chín, nên chuyển
              sang file .py vì các lý do sau:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                Script chạy đầu-cuối, không phụ thuộc thứ tự cell — dễ tái
                lặp.
              </li>
              <li>
                Dễ unit test với pytest hơn so với cell notebook.
              </li>
              <li>
                Dễ import module từ script khác, tái sử dụng code.
              </li>
              <li>
                Dễ chạy trên server, cron job, CI/CD mà không cần Jupyter.
              </li>
            </ul>
            <p>
              Một workflow trưởng thành thường dùng notebook để prototype,
              rồi <code>jupyter nbconvert --to script</code> để tự động
              chuyển sang file .py. Xem thêm ở{" "}
              <TopicLink slug="end-to-end-ml-project">
                quy trình ML end-to-end
              </TopicLink>
              .
            </p>
          </CollapsibleDetail>

          <Callout variant="warning" title="Cảnh báo tài nguyên Colab">
            Colab miễn phí có giới hạn: ~12 giờ runtime liên tục, idle
            timeout 90 phút, GPU được cấp phát theo mức độ công bằng.
            Nếu bạn huấn luyện lâu, cân nhắc Colab Pro hoặc chuyển lên
            Kaggle / máy chủ riêng.
          </Callout>
        </LessonSection>

        <LessonSection label="Liên kết với các topic khác" step={6}>
          <p>
            Bài này là điểm khởi đầu. Sau khi đã thành thạo workflow
            notebook, bạn nên tiếp tục với:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <TopicLink slug="python-for-ml">
                Python cho ML
              </TopicLink>{" "}
              — kỹ năng lập trình nền tảng bạn dùng trong mọi notebook.
            </li>
            <li>
              <TopicLink slug="data-preprocessing">
                Tiền xử lý dữ liệu
              </TopicLink>{" "}
              — bước tiếp theo sau khi load dữ liệu.
            </li>
            <li>
              <TopicLink slug="end-to-end-ml-project">
                Dự án ML end-to-end
              </TopicLink>{" "}
              — ghép các mảnh rời thành pipeline hoàn chỉnh.
            </li>
          </ul>
        </LessonSection>
      </ExplanationSection>

      {/* ===================================================================
          BƯỚC 7 — THÁCH THỨC NHỎ (2)
          =================================================================== */}
      <LessonSection label="Kiểm tra nhanh" step={5} totalSteps={8}>
        <InlineChallenge
          question="Bạn mở lại notebook sáng hôm sau để tiếp tục thí nghiệm hôm qua. Bạn thấy các cell vẫn có output cũ nhưng chạy cell mới thì báo `NameError: 'df' is not defined`. Tại sao?"
          options={[
            "File .ipynb đã bị hỏng — cần khôi phục từ backup",
            "Output hiển thị là output lưu trong file, nhưng runtime là một VM mới nên biến `df` chưa được khôi phục",
            "Colab chỉ chạy được mỗi lần một notebook, đóng lại là mất dữ liệu",
            "pandas đã bị update phiên bản qua đêm nên `df` không còn hợp lệ",
          ]}
          correct={1}
          explanation="File .ipynb lưu output của lần chạy cũ, nhưng runtime (VM + Python process) là mới hoàn toàn mỗi lần bạn mở lại. Để tiếp tục thí nghiệm, bạn phải chạy lại các cell tạo biến — cách nhanh nhất là Runtime → Run all."
        />
      </LessonSection>

      {/* ===================================================================
          BƯỚC 8 — TÓM TẮT
          =================================================================== */}
      <LessonSection label="Tóm tắt" step={6} totalSteps={8}>
        <MiniSummary
          title="6 điểm cốt lõi về Jupyter & Colab"
          points={[
            "Notebook là một phiên làm việc sống — trạng thái phụ thuộc thứ tự chạy cell, không phải thứ tự trong file.",
            "Colab cung cấp GPU/TPU miễn phí qua trình duyệt; Jupyter local phù hợp dữ liệu nhạy cảm hoặc cần kiểm soát môi trường.",
            "Trước khi chạy trên Colab: đổi runtime → mount Drive → cài gói (%pip) → import & kiểm tra phiên bản.",
            "Dấu `!` trong cell thực thi lệnh shell; magic commands (%time, %%timeit, %pip) là các tiện ích đặc biệt của IPython.",
            "Runtime là VM dùng một lần — hết phiên là mất biến. Luôn lưu mô hình/kết quả ra Drive ngay khi có.",
            "Khi notebook chín thành sản phẩm, chuyển sang script .py để dễ test, tái sử dụng, và chạy tự động.",
          ]}
        />
      </LessonSection>

      {/* ===================================================================
          BƯỚC 9 — KIỂM TRA CUỐI BÀI
          =================================================================== */}
      <QuizSection questions={quizQuestions} />
    </>
  );
}
