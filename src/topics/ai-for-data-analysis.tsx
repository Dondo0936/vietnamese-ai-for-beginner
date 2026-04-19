"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  BarChart3,
  LineChart,
  PieChart,
  ScatterChart,
  FileSpreadsheet,
  MessageSquare,
  ShieldAlert,
  Upload,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Table2,
  ArrowRight,
} from "lucide-react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
  MiniSummary,
  LessonSection,
  TopicLink,
  TabView,
  ToggleCompare,
  MatchPairs,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

// ============================================================================
// METADATA — giữ nguyên theo yêu cầu
// ============================================================================

export const metadata: TopicMeta = {
  slug: "ai-for-data-analysis",
  title: "AI for Data Analysis",
  titleVi: "AI phân tích dữ liệu",
  description:
    "Dùng AI để phân tích bảng tính, tạo biểu đồ, viết SQL, và tìm insight từ dữ liệu.",
  category: "applied-ai",
  tags: ["data-analysis", "spreadsheet", "sql", "practical", "office"],
  difficulty: "beginner",
  relatedSlugs: [
    "prompt-engineering",
    "ai-for-writing",
    "getting-started-with-ai",
  ],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

// ============================================================================
// Dữ liệu giả lập — doanh thu 12 tháng theo vùng
// ============================================================================

const MONTHLY_REVENUE: { month: string; revenue: number }[] = [
  { month: "Th1", revenue: 320 },
  { month: "Th2", revenue: 280 },
  { month: "Th3", revenue: 410 },
  { month: "Th4", revenue: 380 },
  { month: "Th5", revenue: 450 },
  { month: "Th6", revenue: 520 },
  { month: "Th7", revenue: 490 },
  { month: "Th8", revenue: 540 },
  { month: "Th9", revenue: 610 },
  { month: "Th10", revenue: 580 },
  { month: "Th11", revenue: 670 },
  { month: "Th12", revenue: 720 },
];

// ============================================================================
// Hook: animate đếm số
// ============================================================================

function useCountUp(target: number, durationMs = 900, trigger = 0): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const to = target;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (to - from) * eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [trigger, target, durationMs]);

  return value;
}

// ============================================================================
// DEMO 1 — Chat with your spreadsheet
// ============================================================================

type ChatPhase = "idle" | "uploading" | "thinking" | "done";

function SpreadsheetChatDemo() {
  const [phase, setPhase] = useState<ChatPhase>("idle");
  const [runKey, setRunKey] = useState(0);

  const maxRev = useMemo(
    () => Math.max(...MONTHLY_REVENUE.map((m) => m.revenue)),
    []
  );
  const topMonth = useMemo(
    () =>
      MONTHLY_REVENUE.reduce((a, b) => (a.revenue > b.revenue ? a : b)),
    []
  );
  const animatedTop = useCountUp(topMonth.revenue, 1100, runKey);

  useEffect(() => {
    if (phase === "uploading") {
      const t = setTimeout(() => setPhase("thinking"), 900);
      return () => clearTimeout(t);
    }
    if (phase === "thinking") {
      const t = setTimeout(() => setPhase("done"), 1700);
      return () => clearTimeout(t);
    }
  }, [phase]);

  function handleAsk() {
    setPhase("uploading");
    setRunKey((k) => k + 1);
  }

  function handleReset() {
    setPhase("idle");
  }

  return (
    <div className="space-y-4">
      {/* File chip */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
        <FileSpreadsheet className="h-5 w-5 text-accent shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            doanh-thu-2025.xlsx
          </p>
          <p className="text-[11px] text-muted">
            12 dòng × 2 cột (tháng, doanh thu — triệu đồng)
          </p>
        </div>
        <span className="rounded-full bg-accent-light px-2 py-0.5 text-[10px] font-semibold text-accent">
          Đã upload
        </span>
      </div>

      {/* Câu hỏi */}
      <div className="rounded-xl border border-accent/40 bg-accent-light/50 p-4">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare className="h-4 w-4 text-accent" />
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
            Bạn hỏi
          </p>
        </div>
        <p className="text-sm text-foreground">
          &ldquo;Tháng nào doanh thu cao nhất? Vẽ giúp mình biểu đồ 12 tháng.&rdquo;
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={handleAsk}
            disabled={phase !== "idle" && phase !== "done"}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {phase === "idle" ? "Gửi câu hỏi" : "Hỏi lại"}
          </button>
          {phase !== "idle" && (
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted hover:bg-surface transition-colors"
            >
              Đặt lại
            </button>
          )}
        </div>
      </div>

      {/* Phản hồi AI */}
      <AnimatePresence mode="wait">
        {phase === "uploading" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="rounded-xl border border-border bg-card p-4 flex items-center gap-3"
          >
            <Upload className="h-5 w-5 text-accent animate-pulse" />
            <p className="text-sm text-foreground">Đang đọc file...</p>
          </motion.div>
        )}

        {phase === "thinking" && (
          <motion.div
            key="thinking"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="rounded-xl border border-border bg-card p-4 space-y-2"
          >
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 text-accent animate-spin" />
              <p className="text-sm text-foreground">
                AI đang chạy phép tính trong nền...
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              {[
                "Đọc 12 dòng dữ liệu",
                "Tìm giá trị lớn nhất",
                "Vẽ biểu đồ cột",
              ].map((s, i) => (
                <motion.div
                  key={s}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.35 }}
                  className="rounded-lg bg-surface px-2 py-1.5 text-center text-muted"
                >
                  {s}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {phase === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-4 space-y-4"
          >
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 text-accent shrink-0" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                  AI trả lời
                </p>
                <p className="text-sm text-foreground mt-1">
                  Tháng{" "}
                  <strong className="text-accent">{topMonth.month}</strong> có
                  doanh thu cao nhất:{" "}
                  <strong className="tabular-nums text-accent">
                    {animatedTop.toLocaleString("vi-VN")} triệu đồng
                  </strong>
                  . Xu hướng chung tăng đều qua các quý, với cú nhảy mạnh nhất
                  vào cuối năm (Th11-Th12).
                </p>
              </div>
            </div>

            {/* Bar chart vẽ bằng SVG thuần */}
            <div className="rounded-lg border border-border bg-surface p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
                Doanh thu 12 tháng (triệu đồng)
              </p>
              <div className="flex items-end gap-1 h-32">
                {MONTHLY_REVENUE.map((m, i) => {
                  const pct = (m.revenue / maxRev) * 100;
                  const isTop = m.month === topMonth.month;
                  return (
                    <div
                      key={m.month}
                      className="flex-1 flex flex-col items-center gap-1 h-full justify-end"
                    >
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${pct}%` }}
                        transition={{
                          duration: 0.8,
                          delay: i * 0.04,
                          ease: "easeOut",
                        }}
                        className={`w-full rounded-t ${
                          isTop
                            ? "bg-gradient-to-t from-accent to-accent/70"
                            : "bg-gradient-to-t from-muted/40 to-muted/20"
                        }`}
                      />
                      <span
                        className={`text-[9px] ${
                          isTop
                            ? "font-bold text-accent"
                            : "text-muted"
                        }`}
                      >
                        {m.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// DEMO 2 — Question → chart type (MatchPairs)
// ============================================================================

function QuestionToChartDemo() {
  return (
    <div className="space-y-3">
      <MatchPairs
        instruction="Ghép câu hỏi với loại biểu đồ phù hợp. Một câu hỏi chỉ có một biểu đồ đúng — đây là nền tảng để chỉ thị cho AI vẽ đúng thứ bạn cần."
        pairs={[
          {
            left: "Doanh thu thay đổi thế nào qua 12 tháng?",
            right: "Biểu đồ đường (line) — xu hướng theo thời gian",
          },
          {
            left: "Khu vực Bắc, Trung, Nam — khu nào bán nhiều nhất?",
            right: "Biểu đồ cột (bar) — so sánh giữa các nhóm",
          },
          {
            left: "Mỗi dòng sản phẩm chiếm bao nhiêu % tổng doanh thu?",
            right: "Biểu đồ tròn (pie) — tỉ trọng trên tổng thể",
          },
          {
            left: "Giá bán có liên quan gì đến số đơn đặt?",
            right: "Biểu đồ tán xạ (scatter) — quan hệ giữa 2 biến",
          },
        ]}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { icon: LineChart, label: "Line", hint: "Xu hướng" },
          { icon: BarChart3, label: "Bar", hint: "So sánh" },
          { icon: PieChart, label: "Pie", hint: "Tỉ trọng" },
          { icon: ScatterChart, label: "Scatter", hint: "Quan hệ" },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="rounded-lg border border-border bg-card p-3 text-center"
            >
              <Icon className="mx-auto h-6 w-6 text-accent mb-1" />
              <p className="text-sm font-semibold text-foreground">{c.label}</p>
              <p className="text-[10px] text-muted">{c.hint}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// DEMO 3 — Error spotting
// ============================================================================

function ErrorSpottingDemo() {
  return (
    <ToggleCompare
      labelA="Trước khi kiểm tra"
      labelB="Sau khi kiểm tra"
      description="AI trả một đáp án nghe rất hợp lý. Nhưng có chắc đúng không?"
      childA={
        <div className="rounded-lg border border-red-200 bg-red-50/50 dark:border-red-900/40 dark:bg-red-900/10 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-4 w-4 text-red-600 dark:text-red-400" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-400">
                AI trả lời
              </p>
              <p className="text-sm text-foreground mt-1">
                &ldquo;Tháng 3/2025 doanh thu cao nhất với{" "}
                <strong>2,45 tỷ đồng</strong>. Bạn nên tập trung quảng cáo vào
                tháng 3 năm sau.&rdquo;
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-surface p-3">
            <p className="text-[11px] text-muted">
              Bạn nhận được con số, gật gù, copy vào báo cáo. Xong việc?
            </p>
          </div>
        </div>
      }
      childB={
        <div className="rounded-lg border border-green-200 bg-green-50/50 dark:border-green-900/40 dark:bg-green-900/10 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 h-4 w-4 text-green-700 dark:text-green-400" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-400">
                Bạn kiểm tra bằng cách bật Excel
              </p>
              <ul className="mt-1 space-y-1 text-sm text-foreground">
                <li>
                  <strong>Lỗi 1:</strong> Cột ngày trong file là{" "}
                  <code>2025-03</code> = tháng 3, nhưng dòng cao nhất thật là
                  tháng 12.
                </li>
                <li>
                  <strong>Lỗi 2:</strong> 2,45 tỷ = AI cộng nhầm cột{" "}
                  <em>tổng đơn đặt</em> thay vì <em>doanh thu</em>.
                </li>
              </ul>
            </div>
          </div>
          <div className="rounded-lg border border-green-300/40 bg-green-100/50 dark:bg-green-900/20 p-3">
            <p className="text-xs text-foreground">
              <strong>Bài học:</strong> AI không hiểu dữ liệu — nó đoán theo tên
              cột. Kiểm tra cột nào đang được dùng bằng một câu &ldquo;AI, bạn
              vừa dùng cột nào để tính?&rdquo;
            </p>
          </div>
        </div>
      }
    />
  );
}

// ============================================================================
// Dữ liệu Callout — 5 công cụ AI phân tích dữ liệu
// ============================================================================

const TOOLS = [
  {
    name: "ChatGPT Advanced Data Analysis",
    color: "#10a37f",
    tagline: "Upload Excel/CSV, AI chạy phép tính, vẽ biểu đồ ngay",
    useFor: "Phân tích ad-hoc, vẽ chart nhanh cho họp.",
    note: "Có trong ChatGPT Plus.",
  },
  {
    name: "Claude + upload file",
    color: "#d97706",
    tagline: "Dán file CSV, Claude phân tích bằng văn bản chi tiết",
    useFor: "Tóm tắt báo cáo dữ liệu dài, insight theo phân khúc.",
    note: "Phù hợp khi cần giải thích, không chỉ con số.",
  },
  {
    name: "Gemini in Google Sheets",
    color: "#4285f4",
    tagline: "Gõ @Gemini ngay trong Sheet, hỏi về dữ liệu đang mở",
    useFor: "Thao tác trong workflow Google Workspace.",
    note: "Tích hợp sẵn, không cần upload.",
  },
  {
    name: "Excel Copilot",
    color: "#0078d4",
    tagline: "Gắn vào Excel 365, hỏi bảng tính bằng tiếng Việt",
    useFor: "Văn phòng đã dùng M365, cần công thức & pivot.",
    note: "Cần license Copilot.",
  },
  {
    name: "Power BI Copilot",
    color: "#f2c811",
    tagline: "Tạo dashboard bằng câu lệnh tự nhiên",
    useFor: "Báo cáo BI định kỳ, chia sẻ dashboard team.",
    note: "Cho user đã quen Power BI.",
  },
];

// ============================================================================
// COMPONENT CHÍNH
// ============================================================================

export default function AiForDataAnalysisTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "Bạn có file Excel 10.000 dòng. Cách nhanh nhất để dùng AI phân tích là gì?",
        options: [
          "Copy-paste từng 100 dòng một vào ChatGPT free",
          "Upload thẳng file vào ChatGPT Advanced Data Analysis, Claude, hoặc Gemini — hỏi bằng tiếng Việt",
          "Gửi link Google Sheets cho AI",
          "Chỉ cần gõ 'phân tích dữ liệu' là đủ",
        ],
        correct: 1,
        explanation:
          "Các công cụ như ChatGPT Advanced Data Analysis, Claude, Gemini in Sheets, Excel Copilot đều đọc được file trực tiếp. Bạn chỉ cần upload rồi hỏi câu hỏi cụ thể bằng tiếng Việt.",
      },
      {
        question:
          "AI trả lời: 'Doanh thu trung bình tháng 3 là 523 triệu đồng.' Bạn nên làm gì tiếp?",
        options: [
          "Tin ngay vì AI rất chính xác với số liệu",
          "Kiểm tra lại bằng công thức Excel hoặc tính thủ công vài dòng",
          "Bỏ qua vì con số nghe hợp lý",
          "Yêu cầu AI tính lại 5 lần rồi lấy trung bình",
        ],
        correct: 1,
        explanation:
          "AI có thể dùng sai cột, hiểu sai định dạng ngày, hoặc làm tròn bất ngờ. Luôn kiểm tra vài dòng bằng Excel để đảm bảo đáp án đáng tin.",
      },
      {
        question:
          "Biểu đồ nào phù hợp nhất để so sánh doanh thu giữa Bắc, Trung, Nam?",
        options: [
          "Biểu đồ đường (line chart)",
          "Biểu đồ cột (bar chart)",
          "Biểu đồ tán xạ (scatter plot)",
          "Biểu đồ tròn nhiều lớp",
        ],
        correct: 1,
        explanation:
          "Bar chart là lựa chọn tiêu chuẩn khi so sánh một đại lượng giữa các danh mục rời rạc. Line chart dành cho xu hướng theo thời gian, scatter dành cho quan hệ hai biến liên tục.",
      },
      {
        question:
          "Bạn có bảng 500 dòng với cột: Ngày, Sản phẩm, Số lượng, Đơn giá, Khu vực. Prompt nào tốt nhất?",
        options: [
          "'Phân tích dữ liệu giúp tôi'",
          "'Tôi có dữ liệu bán hàng 6 tháng với cột: Ngày, Sản phẩm, Số lượng, Đơn giá, Khu vực. Hãy: (1) Sản phẩm bán chạy nhất theo khu vực, (2) Xu hướng doanh thu theo tháng, (3) Gợi ý biểu đồ phù hợp'",
          "'Cho tôi biểu đồ đẹp'",
          "'Sản phẩm nào tốt nhất?'",
        ],
        correct: 1,
        explanation:
          "Prompt tốt cần: mô tả dữ liệu (các cột), bối cảnh (6 tháng bán hàng), và yêu cầu cụ thể (3 câu hỏi rõ). Càng cụ thể, AI càng cho kết quả hữu ích.",
      },
      {
        question:
          "Loại dữ liệu nào TUYỆT ĐỐI không nên upload lên AI công cộng?",
        options: [
          "Dữ liệu bán hàng đã được ẩn tên khách",
          "Bảng CMND/CCCD, số tài khoản ngân hàng, lương chi tiết từng người",
          "Bảng doanh thu theo tháng không có tên khách",
          "Báo cáo kinh doanh tổng hợp",
        ],
        correct: 1,
        explanation:
          "Thông tin cá nhân và dữ liệu tài chính nhạy cảm không nên upload lên AI công cộng — dữ liệu có thể được dùng để train model hoặc lộ qua log. Dùng bản enterprise (không train trên dữ liệu) hoặc ẩn danh trước.",
      },
      {
        question:
          "AI vẽ biểu đồ hiển thị doanh thu giảm dần đáng ngờ. Bạn nên làm gì đầu tiên?",
        options: [
          "Tin vì AI đã dùng Python rất chính xác",
          "Hỏi AI: 'Bạn đã dùng cột nào để tính? Lọc bằng điều kiện gì?' và đối chiếu vài dòng",
          "Xoá biểu đồ và vẽ lại bằng tay",
          "Gửi biểu đồ cho sếp",
        ],
        correct: 1,
        explanation:
          "Bước kiểm tra cốt lõi: hỏi AI đã dùng cột nào, lọc thế nào. AI có thể nhầm cột hoặc hiểu sai định dạng ngày (dd/mm vs mm/dd). Một câu hỏi ngược lại thường phát hiện lỗi ngay.",
      },
      {
        question:
          "Bạn muốn tính 'tỷ lệ hoàn thành KPI' = Doanh thu / Mục tiêu. Cách dùng AI an toàn nhất là gì?",
        options: [
          "Upload file và hỏi 'phân tích KPI' chung chung",
          "Mô tả công thức, nhờ AI viết công thức Excel tương ứng, kiểm tra trên 2-3 dòng rồi mới áp dụng toàn bộ",
          "Yêu cầu AI tự nghĩ ra công thức",
          "Bỏ qua AI, tự tính tay toàn bộ",
        ],
        correct: 1,
        explanation:
          "Bạn định nghĩa business logic (bạn hiểu KPI), AI chỉ dịch sang cú pháp Excel. Luôn test trên vài dòng trước khi áp dụng toàn bộ.",
      },
      {
        question:
          "Khi AI tóm tắt 'tổng doanh thu Q1 là 1,2 tỷ', điều nào QUAN TRỌNG NHẤT cần kiểm tra?",
        options: [
          "Xem AI có dùng đơn vị tiền đúng (VNĐ/USD) không",
          "AI đã cộng đúng cột doanh thu và đúng khoảng Q1 (tháng 1-3) chưa",
          "AI có viết đẹp không",
          "AI có dùng biểu đồ không",
        ],
        correct: 1,
        explanation:
          "Hai lỗi phổ biến nhất: (1) nhầm cột (cộng tổng đơn thay vì doanh thu), (2) nhầm khoảng thời gian (tháng 1-3 hay tháng 4-6). Kiểm tra 2 điều này trước khi tin con số.",
      },
    ],
    []
  );

  return (
    <>
      {/* ========================================================= */}
      {/* BƯỚC 1 — DỰ ĐOÁN                                          */}
      {/* ========================================================= */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử đoán">
        <PredictionGate
          question="Bạn có file Excel 10.000 dòng bán hàng. Hỏi ChatGPT Advanced Data Analysis: 'Tháng nào doanh thu cao nhất?' — bao lâu có đáp án?"
          options={[
            "Khoảng 10 giây — AI đọc file, chạy phép tính, trả luôn",
            "Khoảng 1 phút — AI cần thời gian tính toán",
            "Khoảng 5 phút — file lớn nên chậm",
            "Không làm được — AI không đọc được file Excel",
          ]}
          correct={0}
          explanation="Sau khi upload file, AI đọc và chạy phép tính gộp (group-by tháng + tìm max) trong 5-12 giây. Thời gian thật sự mất là bước bạn đọc đáp án và kiểm tra cột AI đã dùng."
        >
          <p className="text-sm text-muted mt-4">
            Nhưng tốc độ chỉ là một phần — phần quan trọng hơn là kiểm tra lại
            để đảm bảo AI hiểu đúng câu hỏi.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ========================================================= */}
      {/* BƯỚC 2 — ẨN DỤ THỰC TẾ                                    */}
      {/* ========================================================= */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Góc nhìn">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-light">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold text-foreground">
                Dùng AI phân tích giống như thuê một nhà phân tích làm miễn phí.
              </p>
              <p className="mt-2 text-sm text-foreground leading-relaxed">
                Bạn hỏi bằng tiếng Việt, nó chạy phép tính trong đầu, rồi vẽ
                biểu đồ và giải thích bằng lời. Không cần biết lập trình. Chỉ
                cần biết đặt đúng câu hỏi và kiểm tra lại đáp án.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="rounded-lg bg-surface p-3">
              <Upload className="h-5 w-5 text-accent mb-1" />
              <p className="text-sm font-semibold text-foreground">
                Bạn upload
              </p>
              <p className="text-xs text-muted">
                Excel, CSV, Google Sheet.
              </p>
            </div>
            <div className="rounded-lg bg-surface p-3">
              <MessageSquare className="h-5 w-5 text-accent mb-1" />
              <p className="text-sm font-semibold text-foreground">Bạn hỏi</p>
              <p className="text-xs text-muted">
                &ldquo;Tháng nào cao nhất?&rdquo;, &ldquo;Khu vực nào lỗ?&rdquo;
              </p>
            </div>
            <div className="rounded-lg bg-surface p-3">
              <BarChart3 className="h-5 w-5 text-accent mb-1" />
              <p className="text-sm font-semibold text-foreground">AI vẽ</p>
              <p className="text-xs text-muted">
                Biểu đồ + lời giải thích.
              </p>
            </div>
          </div>
        </div>
      </LessonSection>

      {/* ========================================================= */}
      {/* BƯỚC 3 — KHÁM PHÁ (3 DEMO)                                */}
      {/* ========================================================= */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-8">
            {/* Demo 1 */}
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1">
                Demo 1 — Hỏi bảng tính bằng tiếng Việt
              </h3>
              <p className="text-sm text-muted mb-4">
                Upload file → hỏi câu → AI đọc, tính, vẽ. Nhấn &ldquo;Gửi câu
                hỏi&rdquo; để xem cả vòng.
              </p>
              <SpreadsheetChatDemo />
            </div>

            {/* Demo 2 */}
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1">
                Demo 2 — Câu hỏi nào cần biểu đồ nào?
              </h3>
              <p className="text-sm text-muted mb-4">
                Khi bạn biết chọn đúng kiểu biểu đồ, prompt của bạn cho AI cũng
                sẽ rõ ràng hơn rất nhiều.
              </p>
              <QuestionToChartDemo />
            </div>

            {/* Demo 3 */}
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1">
                Demo 3 — Khi AI trả số sai
              </h3>
              <p className="text-sm text-muted mb-4">
                Một ví dụ kinh điển: AI tự tin đưa một con số, nhưng đã dùng
                nhầm cột. Nhấn sang tab &ldquo;Sau khi kiểm tra&rdquo; để thấy
                sai lầm hiện ra.
              </p>
              <ErrorSpottingDemo />
            </div>

            <Callout variant="tip" title="Ba quan sát khi chơi 3 demo">
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>
                  AI chạy phép tính sau hậu trường — bạn không cần viết công
                  thức, chỉ cần đặt câu hỏi.
                </li>
                <li>
                  Biểu đồ đúng loại = thông điệp rõ. Sai loại = người đọc rối.
                </li>
                <li>
                  AI tự tin không đồng nghĩa với đúng. Luôn hỏi lại
                  &ldquo;dùng cột nào?&rdquo;
                </li>
              </ol>
            </Callout>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ========================================================= */}
      {/* BƯỚC 4 — AHA MOMENT                                       */}
      {/* ========================================================= */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          AI không &ldquo;hiểu&rdquo; dữ liệu — nó{" "}
          <strong>đọc tên cột rồi đoán</strong>. Nhưng bù lại, nó biết chạy
          hàng nghìn phép tính trong vài giây và vẽ biểu đồ không kêu ca. Bạn
          là người hiểu nghiệp vụ, AI là người chạy phép tính.{" "}
          <strong>Bộ đôi này mạnh khi bạn biết kiểm tra lại.</strong>
        </AhaMoment>
      </LessonSection>

      {/* ========================================================= */}
      {/* BƯỚC 5 — THỬ THÁCH                                        */}
      {/* ========================================================= */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="AI vẽ biểu đồ 'doanh thu theo tháng' nhưng tháng 1-3 trông bất thường cao. Bước đầu tiên bạn làm là gì?"
          options={[
            "Tin biểu đồ vì AI không sai",
            "Hỏi AI 'Bạn đã lọc dữ liệu tháng 1-3 theo điều kiện gì?' để biết AI dùng cột và bộ lọc nào",
            "Xoá biểu đồ rồi vẽ lại bằng tay",
            "Gửi cho sếp cho nhanh",
          ]}
          correct={1}
          explanation="Lỗi hay gặp: AI hiểu sai định dạng ngày (dd/mm vs mm/dd) hoặc lọc nhầm khoảng. Hỏi ngược AI về cách lọc là cách nhanh nhất để phát hiện lỗi."
        />

        <div className="mt-6">
          <InlineChallenge
            question="Bạn có file Excel lương 150 nhân viên (tên, CMND, lương). Muốn phân tích phân bố lương. Cách an toàn nhất là gì?"
            options={[
              "Upload thẳng lên ChatGPT free để phân tích nhanh",
              "Xoá cột CMND + ẩn danh tên nhân viên trước khi upload, hoặc dùng bản enterprise không train trên dữ liệu",
              "Gửi file cho AI qua email",
              "Copy-paste cả file vào Gemini",
            ]}
            correct={1}
            explanation="Dữ liệu nhạy cảm cá nhân (CMND, tên, lương) không nên vào AI công cộng. Hai giải pháp an toàn: (1) ẩn danh trước khi upload, (2) dùng bản enterprise có cam kết không train trên dữ liệu."
          />
        </div>
      </LessonSection>

      {/* ========================================================= */}
      {/* BƯỚC 6 — GIẢI THÍCH (VISUAL-HEAVY)                        */}
      {/* ========================================================= */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Hiểu sâu hơn">
        <ExplanationSection>
          {/* 6.1 — 5 công cụ */}
          <div>
            <h3 className="text-base font-semibold text-foreground mb-3">
              5 công cụ AI phân tích dữ liệu phổ biến
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TOOLS.map((t) => (
                <div
                  key={t.name}
                  className="rounded-xl border border-border bg-card p-4 space-y-2"
                >
                  <div className="flex items-start gap-2">
                    <span
                      className="mt-1 inline-block h-3 w-3 rounded-full shrink-0"
                      style={{ background: t.color }}
                    />
                    <p className="text-sm font-semibold text-foreground leading-snug">
                      {t.name}
                    </p>
                  </div>
                  <p className="text-xs text-muted italic">{t.tagline}</p>
                  <p className="text-xs text-foreground">
                    <strong>Dùng cho:</strong> {t.useFor}
                  </p>
                  <p className="text-[10px] text-muted border-t border-border pt-1.5">
                    {t.note}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 6.2 — Workflow */}
          <div className="mt-6">
            <h3 className="text-base font-semibold text-foreground mb-3">
              Workflow 5 bước chuẩn
            </h3>
            <div className="flex flex-col md:flex-row gap-2">
              {[
                {
                  label: "1. Upload file",
                  desc: "Excel, CSV, Sheets.",
                  color: "#10b981",
                  icon: Upload,
                },
                {
                  label: "2. Hỏi câu cụ thể",
                  desc: "Mô tả cột + câu hỏi rõ.",
                  color: "#6366f1",
                  icon: MessageSquare,
                },
                {
                  label: "3. AI chạy tính (ẩn)",
                  desc: "Đọc + gộp + lọc.",
                  color: "#8b5cf6",
                  icon: Loader2,
                },
                {
                  label: "4. AI trả chart + lời",
                  desc: "Biểu đồ + giải thích.",
                  color: "#f59e0b",
                  icon: BarChart3,
                },
                {
                  label: "5. Bạn kiểm tra",
                  desc: "Đối chiếu vài dòng.",
                  color: "#ef4444",
                  icon: CheckCircle2,
                },
              ].map((s, i, arr) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="flex-1 flex items-center gap-2">
                    <div
                      className="flex-1 rounded-xl border-2 bg-card p-3 space-y-1"
                      style={{ borderColor: `${s.color}55` }}
                    >
                      <div className="flex items-center gap-2">
                        <Icon
                          className="h-4 w-4"
                          style={{ color: s.color }}
                        />
                        <p className="text-sm font-semibold text-foreground">
                          {s.label}
                        </p>
                      </div>
                      <p className="text-xs text-muted">{s.desc}</p>
                    </div>
                    {i < arr.length - 1 && (
                      <ArrowRight className="hidden md:block h-4 w-4 text-muted shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted italic">
              Lưu ý: bước 3 là hộp đen — AI chạy code Python/công thức trong
              nền. Bạn không cần nhìn code, chỉ cần hiểu AI đã làm gì.
            </p>
          </div>

          {/* 6.3 — Pitfalls */}
          <div className="mt-6">
            <h3 className="text-base font-semibold text-foreground mb-3">
              4 cái bẫy kinh điển khi AI phân tích dữ liệu
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                {
                  title: "Sai kiểu dữ liệu",
                  desc: "AI đọc ngày 01/03/2025 là ngày 3 tháng 1 (mm/dd) thay vì ngày 1 tháng 3 (dd/mm).",
                  fix: "Nói rõ: 'ngày ở định dạng dd/mm/yyyy'.",
                },
                {
                  title: "Hiểu sai ngữ cảnh",
                  desc: "AI đoán tên cột. Cột 'SL' có thể là Số Lượng hoặc Số Lô.",
                  fix: "Mô tả từng cột khi upload file.",
                },
                {
                  title: "Số liệu thiếu / null",
                  desc: "AI có thể bỏ qua, có thể tính null = 0 — hai kết quả khác nhau.",
                  fix: "Hỏi: 'Bạn xử lý ô trống thế nào?'",
                },
                {
                  title: "Lộ dữ liệu nhạy cảm",
                  desc: "Upload file có CMND, lương, số tài khoản lên AI công cộng.",
                  fix: "Ẩn danh trước hoặc dùng bản enterprise.",
                },
              ].map((p) => (
                <div
                  key={p.title}
                  className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-900/10 p-4 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <p className="text-sm font-semibold text-foreground">
                      {p.title}
                    </p>
                  </div>
                  <p className="text-xs text-muted">{p.desc}</p>
                  <p className="text-xs text-foreground">
                    <strong className="text-green-700 dark:text-green-400">
                      Cách tránh:
                    </strong>{" "}
                    {p.fix}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 6.4 — Privacy warning as a block */}
          <div className="mt-6">
            <Callout
              variant="warning"
              title="Cảnh báo bảo mật — ĐỌC TRƯỚC KHI UPLOAD"
            >
              <div className="space-y-2">
                <p>
                  <strong>Không upload lên AI công cộng:</strong> CMND/CCCD, số
                  tài khoản, lương chi tiết từng người, mã định danh khách hàng,
                  hợp đồng chưa ký.
                </p>
                <p>
                  <strong>Có thể upload (sau khi ẩn danh):</strong> doanh thu
                  tổng hợp, số liệu bán hàng không gắn tên cá nhân, dữ liệu
                  publicly available.
                </p>
                <p>
                  <strong>An toàn nhất:</strong> bản enterprise (ChatGPT
                  Business, Claude for Work, Gemini Enterprise, Microsoft 365
                  Copilot) — có cam kết không train trên dữ liệu + audit log.
                </p>
              </div>
            </Callout>
          </div>

          {/* 6.5 — 3 use case bằng tab */}
          <div className="mt-6">
            <h3 className="text-base font-semibold text-foreground mb-3">
              3 tình huống công sở điển hình
            </h3>
            <TabView
              tabs={[
                {
                  label: "Kế toán",
                  content: (
                    <div className="space-y-3 text-sm">
                      <p className="text-foreground">
                        <strong>Tình huống:</strong> File công nợ 800 dòng. Sếp
                        hỏi &ldquo;Top 10 khách nợ lâu nhất&rdquo;.
                      </p>
                      <div className="rounded-lg bg-surface p-3">
                        <p className="text-xs font-semibold text-muted mb-1">
                          Prompt
                        </p>
                        <p className="text-xs text-foreground italic">
                          &ldquo;File công nợ có cột: khách, hoá đơn, ngày
                          xuất, số tiền, số ngày quá hạn. Cho tôi top 10 khách
                          có tổng số ngày quá hạn lớn nhất, kèm tổng công nợ.
                          Vẽ biểu đồ cột.&rdquo;
                        </p>
                      </div>
                    </div>
                  ),
                },
                {
                  label: "Marketing",
                  content: (
                    <div className="space-y-3 text-sm">
                      <p className="text-foreground">
                        <strong>Tình huống:</strong> Tracking quảng cáo 30
                        ngày, so sánh Google, Facebook, TikTok.
                      </p>
                      <div className="rounded-lg bg-surface p-3">
                        <p className="text-xs font-semibold text-muted mb-1">
                          Prompt
                        </p>
                        <p className="text-xs text-foreground italic">
                          &ldquo;Cột: ngày, kênh, chi phí, lượt hiển thị, lượt
                          click, đơn hàng. Tính CTR, CPC, CVR theo từng kênh.
                          Kênh nào tối ưu nhất? Vẽ biểu đồ đường xu hướng CVR
                          theo ngày.&rdquo;
                        </p>
                      </div>
                    </div>
                  ),
                },
                {
                  label: "Vận hành",
                  content: (
                    <div className="space-y-3 text-sm">
                      <p className="text-foreground">
                        <strong>Tình huống:</strong> File log 5.000 dòng, cần
                        tìm lỗi xuất hiện nhiều nhất.
                      </p>
                      <div className="rounded-lg bg-surface p-3">
                        <p className="text-xs font-semibold text-muted mb-1">
                          Prompt
                        </p>
                        <p className="text-xs text-foreground italic">
                          &ldquo;Log có cột timestamp, level, message. Đếm số
                          lần xuất hiện mỗi message level=ERROR, top 10. Thống
                          kê số lỗi theo giờ trong ngày. Vẽ biểu đồ cột theo
                          giờ.&rdquo;
                        </p>
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          </div>

          <Callout variant="insight" title="Quy tắc vàng D-A-T-A">
            <strong>D</strong>escribe (mô tả cột) → <strong>A</strong>sk (câu
            hỏi cụ thể) → <strong>T</strong>est (thử trên vài dòng) →{" "}
            <strong>A</strong>pply (áp dụng toàn bộ). Bỏ một bước là dễ ra số
            sai.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ========================================================= */}
      {/* BƯỚC 7 — TÓM TẮT                                          */}
      {/* ========================================================= */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về AI phân tích dữ liệu"
          points={[
            "AI đọc file trực tiếp — upload vào ChatGPT Advanced Data Analysis, Claude, Gemini in Sheets, Excel Copilot hoặc Power BI Copilot.",
            "Mô tả cột + đặt câu hỏi cụ thể. AI không hiểu dữ liệu — nó đoán tên cột.",
            "Chọn đúng loại biểu đồ: line cho xu hướng, bar cho so sánh, pie cho tỉ trọng, scatter cho quan hệ.",
            "Luôn hỏi ngược 'bạn dùng cột nào?' và kiểm tra trên 2-3 dòng trước khi tin đáp án.",
            "Không upload dữ liệu nhạy cảm (CMND, lương, tài khoản) lên AI công cộng. Dùng bản enterprise hoặc ẩn danh.",
            "Quy tắc D-A-T-A: Describe → Ask → Test → Apply.",
          ]}
        />

        <div className="mt-4 rounded-xl border border-border bg-card p-5 space-y-2">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" />
            Khám phá thêm
          </h4>
          <p className="text-sm text-muted leading-relaxed">
            Muốn viết prompt chuyên sâu? Xem{" "}
            <TopicLink slug="prompt-engineering">
              kỹ thuật viết prompt
            </TopicLink>
            . Cần AI giúp viết phần diễn giải số liệu? Qua{" "}
            <TopicLink slug="ai-for-writing">AI hỗ trợ viết lách</TopicLink>.
            Mới với AI? Quay về{" "}
            <TopicLink slug="getting-started-with-ai">
              hướng dẫn bắt đầu
            </TopicLink>
            .
          </p>
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-border bg-surface/50 p-5 space-y-2">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Table2 className="h-4 w-4 text-accent" />
            Bài tập về nhà (tuỳ chọn)
          </h4>
          <p className="text-sm text-muted leading-relaxed">
            Mở một file Excel thật bạn đang làm việc (ẩn danh cột nhạy cảm nếu
            cần). Upload vào ChatGPT Advanced Data Analysis, đặt 3 câu hỏi theo
            công thức D-A-T-A. Ghi lại 3 điều AI làm đúng và 1 điều AI làm sai
            — đây là cách nhanh nhất để xây &ldquo;giác quan nghi ngờ&rdquo;
            khi làm việc với AI và số liệu.
          </p>
        </div>
      </LessonSection>

      {/* ========================================================= */}
      {/* BƯỚC 8 — QUIZ                                             */}
      {/* ========================================================= */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
