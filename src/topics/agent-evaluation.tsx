"use client";
import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { PredictionGate, AhaMoment, InlineChallenge, Callout, CollapsibleDetail,
  MiniSummary, CodeBlock, LessonSection, LaTeX, TopicLink } from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "agent-evaluation",
  title: "Agent Evaluation",
  titleVi: "Đánh giá Agent — Đo lường AI tự chủ",
  description:
    "Các phương pháp và tiêu chí để đánh giá hiệu quả, độ chính xác và an toàn của AI Agent.",
  category: "ai-agents",
  tags: ["evaluation", "benchmark", "agent", "metrics"],
  difficulty: "advanced",
  relatedSlugs: ["agent-architecture", "agentic-workflows", "guardrails"],
  vizType: "interactive",
};

// ──────────────────────────────────────────────────────────────────────
// DỮ LIỆU CHÍNH: 5 tác vụ demo + 6 chiều đánh giá radar
// ──────────────────────────────────────────────────────────────────────

type TaskId = "refund" | "bug-fix" | "sql-report" | "email-triage" | "research";

interface TaskStep {
  label: string;
  tool: string;
  detail: string;
  status: "ok" | "warn" | "fail";
}

interface TaskResult {
  id: TaskId;
  title: string;
  tldr: string;
  success: boolean;
  steps: TaskStep[];
  tokens: number;
  latencyMs: number;
  costUsd: number;
  notes: string;
  // Đóng góp vào 6 chiều (0..100).
  contribution: {
    success: number;
    toolUse: number;
    hallucination: number;
    latency: number;
    cost: number;
    safety: number;
  };
}

const TASKS: TaskResult[] = [
  {
    id: "refund",
    title: "Hoàn tiền đơn #A-2031",
    tldr: "Agent hỗ trợ khách xin refund một đơn bị trễ hàng.",
    success: true,
    steps: [
      {
        label: "Tìm đơn hàng",
        tool: "orders.get",
        detail: "order_id=A-2031 → status=delayed, amount=$42",
        status: "ok",
      },
      {
        label: "Kiểm tra policy hoàn tiền",
        tool: "policy.lookup",
        detail: "policy=standard_shipping, delay>3d → auto refund eligible",
        status: "ok",
      },
      {
        label: "Xác nhận với khách",
        tool: "chat.confirm",
        detail: "Khách đồng ý hoàn 100% vào thẻ gốc",
        status: "ok",
      },
      {
        label: "Phát lệnh refund",
        tool: "payments.refund",
        detail: "refund_id=RF-9912, amount=42.00, status=queued",
        status: "ok",
      },
    ],
    tokens: 1820,
    latencyMs: 6400,
    costUsd: 0.018,
    notes:
      "Agent confirm với user trước khi thực hiện hành động không hoàn tác — đúng quy trình.",
    contribution: {
      success: 95,
      toolUse: 92,
      hallucination: 8,
      latency: 70,
      cost: 80,
      safety: 95,
    },
  },
  {
    id: "bug-fix",
    title: "Sửa bug #412 — tính phí sai múi giờ",
    tldr: "Agent đọc issue GitHub, tìm file lỗi, viết patch, chạy test.",
    success: true,
    steps: [
      {
        label: "Đọc issue và test reproduce",
        tool: "repo.read",
        detail: "issue=412, failing_test=test_billing_timezone",
        status: "ok",
      },
      {
        label: "Định vị hàm lỗi",
        tool: "code.search",
        detail: "→ billing/charges.py:compute_due_date()",
        status: "ok",
      },
      {
        label: "Áp dụng patch",
        tool: "editor.apply",
        detail: "dùng pytz.UTC thay cho local; +4/-3 dòng",
        status: "ok",
      },
      {
        label: "Chạy test suite",
        tool: "shell.run",
        detail: "pytest -k billing → 38 passed, 0 failed",
        status: "ok",
      },
      {
        label: "Tạo commit & PR",
        tool: "git.commit",
        detail: 'fix(billing): force UTC when computing due_date',
        status: "ok",
      },
    ],
    tokens: 9250,
    latencyMs: 38_000,
    costUsd: 0.12,
    notes:
      "Đi đúng quy trình đọc → định vị → patch → test. Token khá cao vì đọc nhiều file.",
    contribution: {
      success: 90,
      toolUse: 88,
      hallucination: 10,
      latency: 45,
      cost: 55,
      safety: 90,
    },
  },
  {
    id: "sql-report",
    title: "Báo cáo DAU theo quốc gia 7 ngày qua",
    tldr: "Agent viết truy vấn SQL, chạy, trả kết quả + biểu đồ.",
    success: true,
    steps: [
      {
        label: "Xem schema",
        tool: "db.describe",
        detail: "tables: users, sessions, countries",
        status: "ok",
      },
      {
        label: "Viết truy vấn",
        tool: "sql.draft",
        detail:
          "SELECT country, COUNT(DISTINCT user_id) FROM sessions ...",
        status: "ok",
      },
      {
        label: "Dry-run kiểm tra cost",
        tool: "db.explain",
        detail: "est. 120MB scanned, 220ms",
        status: "ok",
      },
      {
        label: "Chạy và render",
        tool: "db.query",
        detail: "rows=42, top1=VN (8,210 DAU)",
        status: "ok",
      },
    ],
    tokens: 2440,
    latencyMs: 4900,
    costUsd: 0.022,
    notes:
      "Tốt: có dry-run cost check trước khi chạy thật — tránh quét nhầm bảng tỷ dòng.",
    contribution: {
      success: 92,
      toolUse: 94,
      hallucination: 12,
      latency: 82,
      cost: 78,
      safety: 88,
    },
  },
  {
    id: "email-triage",
    title: "Dọn inbox: xoá email cũ hơn 30 ngày",
    tldr: "Agent được yêu cầu xoá email cũ — nhưng kịch bản này có bẫy.",
    success: false,
    steps: [
      {
        label: "Liệt kê email",
        tool: "mail.list",
        detail: 'filter="older_than:30d" → 412 kết quả',
        status: "ok",
      },
      {
        label: "Xoá hàng loạt",
        tool: "mail.batch_delete",
        detail: "xoá 412 email, KHÔNG confirm với user",
        status: "warn",
      },
      {
        label: "Phát hiện đã xoá cả email gắn sao",
        tool: "mail.restore",
        detail: "cố phục hồi — thất bại vì đã quá 7 ngày",
        status: "fail",
      },
    ],
    tokens: 860,
    latencyMs: 2100,
    costUsd: 0.008,
    notes:
      "Lỗi an toàn nghiêm trọng: thực hiện hành động không thể hoàn tác mà không confirm. Đây là pattern 'trajectory success but safety fail'.",
    contribution: {
      success: 30,
      toolUse: 50,
      hallucination: 25,
      latency: 88,
      cost: 92,
      safety: 20,
    },
  },
  {
    id: "research",
    title: "Nghiên cứu 3 đối thủ cạnh tranh",
    tldr: "Agent tra web, tổng hợp bảng so sánh — nhưng bịa nguồn.",
    success: false,
    steps: [
      {
        label: "Tìm kiếm web",
        tool: "web.search",
        detail: "3 đối thủ × 5 từ khóa = 15 truy vấn",
        status: "ok",
      },
      {
        label: "Đọc trang + tóm tắt",
        tool: "web.fetch",
        detail: "12 trang đọc thành công, 3 trang 404",
        status: "ok",
      },
      {
        label: "Soạn bảng so sánh",
        tool: "doc.write",
        detail: "bảng 3×7 cột: giá, tính năng, thị phần...",
        status: "ok",
      },
      {
        label: "Trích dẫn nguồn",
        tool: "cite.attach",
        detail:
          "2 URL bịa (không có trong web.fetch), 1 số liệu thị phần bịa",
        status: "fail",
      },
    ],
    tokens: 14_300,
    latencyMs: 52_000,
    costUsd: 0.21,
    notes:
      "Đây là hallucination cổ điển: agent có kết quả 'nhìn đẹp' nhưng 2/7 citation không tồn tại. Nếu không fact-check sẽ đi thẳng vào báo cáo sếp.",
    contribution: {
      success: 45,
      toolUse: 70,
      hallucination: 60,
      latency: 28,
      cost: 30,
      safety: 55,
    },
  },
];

// Thứ tự cho radar chart (6 chiều).
const DIMENSIONS = [
  {
    key: "success" as const,
    label: "Task Success Rate",
    shortLabel: "Success",
    desc: "Agent giải quyết được % nhiệm vụ đúng theo định nghĩa xong việc.",
    higherIsBetter: true,
    color: "#22c55e",
  },
  {
    key: "toolUse" as const,
    label: "Tool Use Accuracy",
    shortLabel: "Tool Use",
    desc: "Chọn đúng tool, truyền đúng tham số, không gọi thừa.",
    higherIsBetter: true,
    color: "#3b82f6",
  },
  {
    key: "hallucination" as const,
    label: "Hallucination Rate",
    shortLabel: "Halluc.",
    desc: "Tỷ lệ phát biểu/hành động dựa trên thông tin bịa. Thấp = tốt.",
    higherIsBetter: false,
    color: "#f97316",
  },
  {
    key: "latency" as const,
    label: "Latency",
    shortLabel: "Latency",
    desc: "Tốc độ hoàn thành. Càng nhanh càng tốt cho UX.",
    higherIsBetter: true,
    color: "#a855f7",
  },
  {
    key: "cost" as const,
    label: "Cost",
    shortLabel: "Cost",
    desc: "Token + API fee cho mỗi tác vụ. Ít = tốt cho production.",
    higherIsBetter: true,
    color: "#eab308",
  },
  {
    key: "safety" as const,
    label: "Safety",
    shortLabel: "Safety",
    desc: "Không vượt scope, không thực hiện hành động không thể hoàn tác khi chưa confirm.",
    higherIsBetter: true,
    color: "#ef4444",
  },
];

const TOTAL_STEPS = 9;

// Tính điểm radar cuối cùng dựa trên tập task đã chạy.
function computeRadar(selected: TaskId[]): Record<string, number> {
  if (selected.length === 0) {
    return {
      success: 0,
      toolUse: 0,
      hallucination: 0,
      latency: 0,
      cost: 0,
      safety: 0,
    };
  }
  const acc: Record<string, number> = {
    success: 0,
    toolUse: 0,
    hallucination: 0,
    latency: 0,
    cost: 0,
    safety: 0,
  };
  for (const id of selected) {
    const t = TASKS.find((x) => x.id === id)!;
    acc.success += t.contribution.success;
    acc.toolUse += t.contribution.toolUse;
    acc.hallucination += t.contribution.hallucination;
    acc.latency += t.contribution.latency;
    acc.cost += t.contribution.cost;
    acc.safety += t.contribution.safety;
  }
  for (const k of Object.keys(acc)) acc[k] = Math.round(acc[k] / selected.length);
  return acc;
}

// ──────────────────────────────────────────────────────────────────────
// COMPONENT CHÍNH
// ──────────────────────────────────────────────────────────────────────

export default function AgentEvaluationTopic() {
  const [runResults, setRunResults] = useState<TaskId[]>([]);
  const [activeTask, setActiveTask] = useState<TaskId | null>(null);
  const [showHarness, setShowHarness] = useState(false);

  const radar = useMemo(() => computeRadar(runResults), [runResults]);
  const activeResult = useMemo(
    () => (activeTask ? TASKS.find((t) => t.id === activeTask) || null : null),
    [activeTask],
  );

  const runTask = useCallback((id: TaskId) => {
    setActiveTask(id);
    setRunResults((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const resetAll = useCallback(() => {
    setActiveTask(null);
    setRunResults([]);
  }, []);

  // Các điểm radar (6 chiều) — toạ độ.
  const radarSize = 260;
  const radarCx = radarSize / 2;
  const radarCy = radarSize / 2;
  const radarR = 95;
  const radarPoints = DIMENSIONS.map((d, i) => {
    const angle = (Math.PI * 2 * i) / DIMENSIONS.length - Math.PI / 2;
    const raw = radar[d.key] ?? 0;
    // Đảo chiều cho hallucination: 0 xấu = vòng ngoài.
    const value = d.higherIsBetter ? raw : 100 - raw;
    const r = (value / 100) * radarR;
    const x = radarCx + r * Math.cos(angle);
    const y = radarCy + r * Math.sin(angle);
    return { x, y, label: d.shortLabel, color: d.color, value, raw };
  });
  const radarLabels = DIMENSIONS.map((d, i) => {
    const angle = (Math.PI * 2 * i) / DIMENSIONS.length - Math.PI / 2;
    const x = radarCx + (radarR + 22) * Math.cos(angle);
    const y = radarCy + (radarR + 22) * Math.sin(angle);
    return { x, y, label: d.shortLabel, color: d.color };
  });

  // ──────────────────────────────────────────────────────────────────
  // QUIZ — 8 câu
  // ──────────────────────────────────────────────────────────────────
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question: "Tại sao đánh giá Agent khó hơn đánh giá LLM thông thường?",
        options: [
          "Vì Agent chậm hơn",
          "Vì Agent có nhiều bước, tương tác với môi trường, kết quả phụ thuộc vào chuỗi quyết định — không chỉ 1 output",
          "Vì Agent dùng nhiều mô hình",
          "Vì Agent tốn nhiều token",
        ],
        correct: 1,
        explanation:
          "LLM: 1 input → 1 output → đánh giá output. Agent: nhiều bước, mỗi bước là quyết định (chọn tool, tham số, dừng/tiếp). Cần đánh giá cả quá trình (trajectory) không chỉ kết quả cuối.",
      },
      {
        question: "SWE-bench đánh giá Agent về khả năng gì?",
        options: [
          "Viết thơ",
          "Tự sửa lỗi trong mã nguồn thật từ GitHub — đọc issue, tìm bug, viết patch, pass test",
          "Trả lời câu hỏi tổng quát",
          "Điều hướng website",
        ],
        correct: 1,
        explanation:
          "SWE-bench: Agent nhận GitHub issue → tìm file lỗi → viết patch → chạy test suite → pass. Đánh giá khả năng lập trình thực tế end-to-end. Kết quả top: Claude ~50%, GPT-4 ~33%.",
      },
      {
        question:
          "Agent có tỷ lệ hoàn thành 95% nhưng chi phí gấp 10 lần agent khác có 90%. Chọn agent nào?",
        options: [
          "Luôn chọn 95% — chất lượng quan trọng nhất",
          "Tuỳ thuộc context: nếu sai 5% gây hậu quả nghiêm trọng thì chọn 95%, nếu không thì 90% với chi phí thấp hơn",
          "Luôn chọn rẻ hơn",
          "Không đủ thông tin để quyết định",
        ],
        correct: 1,
        explanation:
          "Đánh giá agent cần cân nhắc NHIỀU chiều: accuracy, cost, speed, safety. 5% improvement có đáng gấp 10x cost? Phụ thuộc use case: y khoa (sai = nguy hiểm) vs chatbot (sai = nhỏ).",
      },
      {
        type: "fill-blank",
        question:
          "Đánh giá LLM dừng ở một output, còn đánh giá Agent phải đo cả {blank} (chuỗi hành động) và {blank} (hậu quả thực tế trong môi trường).",
        blanks: [
          {
            answer: "trajectory",
            accept: ["hành trình", "chuỗi bước", "chuỗi hành động"],
          },
          {
            answer: "side effects",
            accept: ["tác động phụ", "hậu quả", "side-effect"],
          },
        ],
        explanation:
          "LLM eval gọn: input → output → chấm. Agent eval: đo cả trajectory (bước đi) và side effects (file đã sửa, email đã xoá, tiền đã chuyển). Một agent 'đúng đáp án' nhưng trajectory dài 30 bước và xoá nhầm data là một agent tệ.",
      },
      {
        question:
          "Agent 'hoàn thành' xóa 412 email theo yêu cầu, nhưng xoá cả email gắn sao. Chiều nào bị thấp?",
        options: [
          "Latency — vì đã xoá quá nhanh",
          "Safety — agent thực hiện hành động không thể hoàn tác mà không confirm và không phân biệt email quan trọng",
          "Cost — vì xoá tốn token",
          "Tool Use — vì chọn sai tool",
        ],
        correct: 1,
        explanation:
          "Task Success cao nhưng Safety thấp. Đây là lý do tại sao chỉ 1 chiều là không đủ. Agent làm production cần: (1) confirm trước hành động không hoàn tác, (2) hiểu ngoại lệ (email gắn sao không nên xoá), (3) dry-run trước khi batch action.",
      },
      {
        question:
          "Bạn chạy eval cho agent và 2 trong 7 citation trong báo cáo là URL bịa. Đây là lỗi gì và cách đo phổ biến?",
        options: [
          "Latency quá cao — đo bằng p95",
          "Hallucination — đo bằng citation-check tự động + LLM-as-judge cross-checking",
          "Cost — đo bằng tokens / 1000",
          "Tool use — đo bằng F1 trên tool name",
        ],
        correct: 1,
        explanation:
          "Hallucination rate = #phát biểu bịa / #phát biểu tổng. Cách đo: (1) citation-check (URL có resolve không, nội dung có match không), (2) LLM-as-judge với một model khác để đối chứng. Sau đó tính tỷ lệ và set SLO (vd < 2%).",
      },
      {
        question:
          "Eval offline (chạy trên dataset cố định) và eval online (theo dõi production) khác nhau thế nào?",
        options: [
          "Offline nhanh hơn, online chậm hơn — không khác gì nữa",
          "Offline tái lập được, kiểm soát biến; online phản ánh phân phối thực, bắt drift — cần CẢ HAI trong quy trình trưởng thành",
          "Chỉ cần offline là đủ",
          "Chỉ cần online là đủ",
        ],
        correct: 1,
        explanation:
          "Offline eval cho tín hiệu trước khi deploy (gate cho CI). Online eval (shadow traffic, A/B, user feedback) bắt phân phối thật và drift theo thời gian. Production agent nghiêm túc luôn có cả 2, cộng với một 'golden set' nhỏ chạy hàng ngày để phát hiện regression.",
      },
      {
        question:
          "Khi nào dùng LLM-as-judge và khi nào dùng human eval?",
        options: [
          "Luôn dùng LLM-as-judge vì rẻ",
          "LLM-as-judge cho scale lớn + tiêu chí rõ ràng; human eval cho case nhạy cảm, mơ hồ, hoặc calibration định kỳ — kết hợp là best practice",
          "Luôn dùng human eval",
          "Không cần eval — cứ deploy",
        ],
        correct: 1,
        explanation:
          "LLM-as-judge: chi phí thấp, scale tốt, phù hợp khi rubric rõ. Điểm yếu: bias theo model judge, không bắt được 'mùi' tinh tế. Human eval: chậm, đắt, nhưng là ground truth cho calibration. Quy trình thật: LLM-as-judge chạy liên tục + human eval định kỳ (vd 50 mẫu/tuần) để kiểm tra calibration.",
      },
    ],
    [],
  );

  // ──────────────────────────────────────────────────────────────────
  // RENDER HELPERS
  // ──────────────────────────────────────────────────────────────────

  const renderTaskButton = (t: TaskResult) => {
    const done = runResults.includes(t.id);
    const isActive = activeTask === t.id;
    return (
      <button
        key={t.id}
        type="button"
        onClick={() => runTask(t.id)}
        className={`relative rounded-xl border px-4 py-3 text-left transition-all ${
          isActive
            ? "border-accent bg-accent/10 shadow-md"
            : done
              ? "border-emerald-500/60 bg-emerald-500/10"
              : "border-border bg-card hover:border-accent/60"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-bold text-foreground">{t.title}</p>
            <p className="text-[11px] text-muted mt-0.5 leading-snug">
              {t.tldr}
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-mono ${
              done
                ? t.success
                  ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                  : "bg-red-500/20 text-red-700 dark:text-red-400"
                : "bg-background text-muted"
            }`}
          >
            {done ? (t.success ? "PASS" : "FAIL") : "run"}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-mono text-muted">
          <span>{t.steps.length} bước</span>
          <span>·</span>
          <span>{t.tokens.toLocaleString()} tok</span>
          <span>·</span>
          <span>{(t.latencyMs / 1000).toFixed(1)}s</span>
          <span>·</span>
          <span>${t.costUsd.toFixed(3)}</span>
        </div>
      </button>
    );
  };

  const renderTrajectory = () => {
    if (!activeResult) {
      return (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center">
          <p className="text-sm text-muted">
            Chọn một tác vụ ở trên để xem Agent chạy từng bước →
          </p>
        </div>
      );
    }
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <p className="text-sm font-bold text-foreground">
              {activeResult.title}
            </p>
            <p className="text-[11px] text-muted">{activeResult.tldr}</p>
          </div>
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${
              activeResult.success
                ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                : "bg-red-500/20 text-red-700 dark:text-red-400"
            }`}
          >
            {activeResult.success ? "SUCCESS" : "FAILURE"}
          </span>
        </div>

        <ol className="space-y-2">
          {activeResult.steps.map((step, i) => {
            const colorByStatus: Record<TaskStep["status"], string> = {
              ok: "border-emerald-500/50 bg-emerald-500/10",
              warn: "border-amber-500/50 bg-amber-500/10",
              fail: "border-red-500/50 bg-red-500/10",
            };
            const dotByStatus: Record<TaskStep["status"], string> = {
              ok: "bg-emerald-500",
              warn: "bg-amber-500",
              fail: "bg-red-500",
            };
            return (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.25 }}
                className={`rounded-lg border p-3 ${colorByStatus[step.status]}`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-1 h-2.5 w-2.5 rounded-full ${dotByStatus[step.status]}`}
                  />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-foreground">
                        Bước {i + 1}. {step.label}
                      </p>
                      <code className="text-[10px] text-muted font-mono">
                        {step.tool}()
                      </code>
                    </div>
                    <p className="text-[11px] text-muted mt-1 leading-relaxed">
                      {step.detail}
                    </p>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ol>

        <div className="mt-3 rounded-lg border border-border bg-background/60 p-3">
          <p className="text-[11px] text-muted leading-relaxed">
            <strong className="text-foreground">Nhận xét:</strong>{" "}
            {activeResult.notes}
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-[10px] font-mono text-muted">
            <span>tokens={activeResult.tokens.toLocaleString()}</span>
            <span>latency={(activeResult.latencyMs / 1000).toFixed(2)}s</span>
            <span>cost=${activeResult.costUsd.toFixed(3)}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderRadar = () => (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-foreground">
            Radar 6 chiều — trung bình trên {runResults.length || 0} tác vụ
          </p>
          <p className="text-[11px] text-muted">
            Chạy ít nhất 3 tác vụ để có tín hiệu đáng tin.
          </p>
        </div>
        <button
          type="button"
          onClick={resetAll}
          className="text-[11px] rounded-md border border-border bg-background px-2.5 py-1 text-muted hover:text-foreground transition"
        >
          ⟲ Reset
        </button>
      </div>

      <svg
        viewBox={`0 0 ${radarSize + 80} ${radarSize + 40}`}
        className="w-full max-w-sm mx-auto"
      >
        <g transform="translate(40, 20)">
          {/* Vòng tròn nền */}
          {[0.25, 0.5, 0.75, 1].map((k) => (
            <circle
              key={k}
              cx={radarCx}
              cy={radarCy}
              r={radarR * k}
              fill="none"
              stroke="var(--border)"
              strokeDasharray="2 3"
              strokeOpacity={0.5}
            />
          ))}
          {/* Trục */}
          {DIMENSIONS.map((d, i) => {
            const angle = (Math.PI * 2 * i) / DIMENSIONS.length - Math.PI / 2;
            const x2 = radarCx + radarR * Math.cos(angle);
            const y2 = radarCy + radarR * Math.sin(angle);
            return (
              <line
                key={d.key}
                x1={radarCx}
                y1={radarCy}
                x2={x2}
                y2={y2}
                stroke="var(--border)"
                strokeOpacity={0.4}
              />
            );
          })}
          {/* Polygon */}
          {runResults.length > 0 && (
            <motion.polygon
              points={radarPoints.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="rgba(99, 102, 241, 0.18)"
              stroke="#6366f1"
              strokeWidth={2}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            />
          )}
          {/* Điểm đỉnh */}
          {runResults.length > 0 &&
            radarPoints.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={3}
                fill={p.color}
                stroke="#0b1021"
                strokeWidth={1}
              />
            ))}
          {/* Nhãn */}
          {radarLabels.map((l, i) => (
            <text
              key={i}
              x={l.x}
              y={l.y}
              textAnchor="middle"
              fontSize={11}
              fill={l.color}
              fontWeight="bold"
            >
              {l.label}
            </text>
          ))}
          {/* Con số raw */}
          {runResults.length > 0 &&
            radarPoints.map((p, i) => (
              <text
                key={`v-${i}`}
                x={p.x}
                y={p.y - 6}
                textAnchor="middle"
                fontSize={11}
                fill="var(--text-primary)"
              >
                {p.raw}
              </text>
            ))}
        </g>
      </svg>

      <div className="grid grid-cols-2 gap-2 mt-3 text-[11px]">
        {DIMENSIONS.map((d) => (
          <div key={d.key} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: d.color }}
            />
            <span className="text-muted leading-snug">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* ───────────── 1. DỰ ĐOÁN ───────────── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn xây Agent tự sửa bug trong code. Agent sửa được 8/10 bug. Điều này có đủ để đánh giá Agent tốt không?"
          options={[
            "Có — 80% là tỷ lệ cao",
            "Chưa đủ — cần xem: mất bao nhiêu bước, tốn bao nhiêu token, có gây thêm bug mới không, có vượt quyền không",
            "Chưa đủ — cần test trên 1000 bug",
          ]}
          correct={1}
          explanation="Đánh giá Agent cần NHIỀU chiều: tỷ lệ thành công + hiệu quả (bước, token, thời gian) + an toàn (có gây hại không) + chi phí. Giống đánh giá nhân viên: không chỉ kết quả mà cả quá trình."
        >
          {/* ───────────── 2. EVAL HARNESS SIMULATOR ───────────── */}
          <LessonSection
            step={2}
            totalSteps={TOTAL_STEPS}
            label="Harness mô phỏng"
          >
            <p className="mb-4 text-sm text-muted leading-relaxed">
              Hãy nhập vai <strong className="text-foreground">evaluator</strong>.
              Nhấn từng tác vụ để Agent chạy, quan sát{" "}
              <em>trajectory</em> (các bước + tool gọi + success/failure), rồi
              xem radar 6 chiều tự cập nhật.
            </p>

            <VisualizationSection>
              <div className="space-y-5">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {TASKS.map(renderTaskButton)}
                </div>

                <div className="grid lg:grid-cols-[1fr_320px] gap-4">
                  <div>{renderTrajectory()}</div>
                  <div>{renderRadar()}</div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
                  <p className="text-[11px] text-muted">
                    Đã chạy {runResults.length}/{TASKS.length} tác vụ ·{" "}
                    {runResults.filter(
                      (id) => TASKS.find((t) => t.id === id)!.success,
                    ).length}{" "}
                    pass,{" "}
                    {runResults.filter(
                      (id) => !TASKS.find((t) => t.id === id)!.success,
                    ).length}{" "}
                    fail
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowHarness((v) => !v)}
                    className="text-xs rounded-md border border-border bg-background px-3 py-1.5 text-foreground hover:border-accent transition"
                  >
                    {showHarness ? "Ẩn" : "Xem"} cấu hình harness
                  </button>
                </div>

                {showHarness && (
                  <div className="rounded-lg border border-border bg-background/60 p-4">
                    <p className="text-[11px] text-muted mb-2 leading-relaxed">
                      Harness tối giản: nạp golden tasks, chạy agent, thu thập
                      trajectory, rồi gọi các judge function. Đây là bộ
                      skeleton thường gặp trong production:
                    </p>
                    <pre className="text-[11px] font-mono text-foreground/90 whitespace-pre-wrap leading-relaxed">
                      {`harness:
  golden_tasks: s3://evals/agent/golden-v4.jsonl
  runner:
    agent: claude-sonnet-4.7
    timeout_s: 120
    max_steps: 25
  judges:
    - type: llm_judge
      model: opus-4.7
      rubric: rubric/hallucination-v2.md
    - type: static
      name: tool_accuracy
    - type: sandbox
      name: side_effect_check
  reporting:
    sink: bigquery://ai.evals.runs
    on_regression: slack://#ai-quality`}
                    </pre>
                  </div>
                )}
              </div>
            </VisualizationSection>
          </LessonSection>

          {/* ───────────── 3. AHA ───────────── */}
          <LessonSection
            step={3}
            totalSteps={TOTAL_STEPS}
            label="Khoảnh khắc aha"
          >
            <AhaMoment>
              <p>
                Đánh giá Agent không phải chỉ &quot;đúng hay sai&quot; —
                mà là <strong>đánh giá cả hành trình</strong>. Hai Agent
                cùng sửa đúng 1 bug, nhưng Agent A mất 3 bước (50 token),
                Agent B mất 20 bước (5000 token).{" "}
                <strong>Trajectory matters</strong> — đường đi quan
                trọng không kém đích đến. Và, như ví dụ xoá email ở trên,
                một agent có thể &quot;thành công&quot; theo nghĩa output
                mà vẫn <strong>gây hại</strong> theo nghĩa side-effect.
              </p>
            </AhaMoment>
          </LessonSection>

          {/* ───────────── 4. CALLOUTS ───────────── */}
          <LessonSection
            step={4}
            totalSteps={TOTAL_STEPS}
            label="Bốn lưu ý quan trọng"
          >
            <div className="space-y-3">
              <Callout variant="tip" title="Benchmarks phổ biến cho agent">
                <strong>SWE-bench</strong> (sửa bug GitHub),{" "}
                <strong>WebArena</strong> (điều hướng web),{" "}
                <strong>GAIA</strong> (tác vụ tổng quát),{" "}
                <strong>AgentBench</strong> (8 môi trường),{" "}
                <strong>τ-bench</strong> (customer service giả lập). Mỗi
                benchmark đo khía cạnh khác nhau — không có benchmark
                nào đủ toàn diện. Chạy ít nhất 2 cái khác nhau để có góc
                nhìn đa dạng.
              </Callout>

              <Callout variant="warning" title="Chỉ đo 'đáp án cuối' là cái bẫy">
                Rất nhiều team bắt đầu eval bằng pass/fail trên output
                cuối, rồi ngạc nhiên vì production vẫn đầy incident. Lý
                do: agent có thể đi đường vòng 20 bước, xoá nhầm data,
                gọi API 500 lần, rồi cuối cùng cho kết quả đúng. Eval
                production phải bắt cả <em>trajectory</em> và{" "}
                <em>side effects</em>.
              </Callout>

              <Callout variant="info" title="LLM-as-judge không miễn phí đúng">
                Dùng một LLM khác để chấm output của agent là kỹ thuật
                scale tốt, nhưng có bias: judge cùng họ với agent hay
                chấm cao hơn, rubric mơ hồ cho kết quả không ổn định.
                Hãy calibrate định kỳ bằng human eval trên một subset
                nhỏ (vd 50 mẫu/tuần).
              </Callout>

              <Callout variant="insight" title="Drift là kẻ thù âm thầm">
                Agent có thể giảm chất lượng theo thời gian vì: (1)
                model vendor cập nhật phiên bản, (2) phân phối user
                thay đổi, (3) tool API bên ngoài thay đổi. Luôn có{" "}
                <strong>golden set</strong> nhỏ chạy hàng ngày + cảnh
                báo khi pass rate sụt &gt; 3%.
              </Callout>
            </div>
          </LessonSection>

          {/* ───────────── 5. THÁCH THỨC ───────────── */}
          <LessonSection
            step={5}
            totalSteps={TOTAL_STEPS}
            label="Thử thách"
          >
            <div className="space-y-4">
              <InlineChallenge
                question="Agent trợ lý email được yêu cầu: 'Xoá email cũ hơn 30 ngày'. Agent xoá TOÀN BỘ email. Chiều đánh giá nào phát hiện lỗi này?"
                options={[
                  "Tỷ lệ hoàn thành — vì Agent đã hoàn thành nhiệm vụ",
                  "Tỷ lệ lỗi / An toàn — Agent vượt phạm vi yêu cầu, thực hiện hành động gây hại (xoá cả email mới)",
                  "Chi phí token",
                  "Hiệu quả bước",
                ]}
                correct={1}
                explanation="Agent 'hoàn thành' nhưng sai phạm vi → gây hại. Safety evaluation phát hiện: (1) Agent vượt scope (xoá cả email mới), (2) hành động không thể hoàn tác, (3) không xác nhận với user trước khi xoá."
              />

              <InlineChallenge
                question="Agent nghiên cứu đối thủ trả về bảng so sánh đẹp, nhưng 2/7 citation là URL bịa. Offline eval pass 100%. Làm sao để bắt được lỗi này trong eval harness?"
                options={[
                  "Không bắt được — hallucination là bất khả kháng",
                  "Thêm judge 'citation_resolver' tự gọi HTTP HEAD kiểm tra URL có tồn tại + LLM-as-judge đối chứng claim với nguồn",
                  "Tăng temperature của model",
                ]}
                correct={1}
                explanation="Hallucination về nguồn là lỗi rất dễ đo: cho mỗi citation, một judge tự động kiểm: (1) URL có resolve không, (2) nội dung trang có chứa claim không. Thêm LLM judge thứ hai để cross-check. Đây là pattern bắt buộc cho agent làm research/reporting."
              />
            </div>
          </LessonSection>

          {/* ───────────── 6. LÝ THUYẾT ───────────── */}
          <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Lý thuyết">
            <ExplanationSection>
              <p>
                <strong>Đánh giá Agent</strong> khác biệt căn bản so với
                đánh giá LLM vì Agent có nhiều bước, tương tác với môi
                trường, và có thể gây hậu quả thực tế. Một framework đầy
                đủ gồm <strong>6 chiều</strong>:
              </p>

              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>
                  <strong>Task Success Rate:</strong> Agent giải quyết
                  được % nhiệm vụ theo định nghĩa xong việc. Metric cơ
                  bản nhất nhưng một mình không đủ.
                </li>
                <li>
                  <strong>Tool Use Accuracy:</strong> Chọn đúng tool,
                  đúng param, không gọi thừa. Tool sai → kết quả sai.
                  Xem <TopicLink slug="function-calling">function
                  calling</TopicLink> để hiểu cơ chế.
                </li>
                <li>
                  <strong>Hallucination Rate:</strong> Tỷ lệ phát biểu
                  hoặc hành động dựa trên thông tin bịa. Ví dụ: trích
                  dẫn sai, gọi API không tồn tại, bịa schema bảng.
                </li>
                <li>
                  <strong>Latency:</strong> p50 / p95 thời gian hoàn
                  thành. Với agent đồng bộ trong UX thì p95 quan trọng
                  hơn p50.
                </li>
                <li>
                  <strong>Cost:</strong> token + API fee + tool cost
                  (vd SQL scan). Cần tính theo đơn vị{" "}
                  <code>$/task</code>, không phải <code>$/token</code>.
                </li>
                <li>
                  <strong>Safety:</strong> không vượt scope, không thực
                  hiện hành động không thể hoàn tác khi chưa confirm,
                  tuân thủ <TopicLink slug="guardrails">guardrails
                  </TopicLink>.
                </li>
              </ul>

              <p>
                Một kết quả trung bình hóa 6 chiều có thể viết gọn
                thành <em>composite score</em>. Một công thức tổng quát:
              </p>
              <p className="text-center">
                <LaTeX>
                  {"S = \\sum_{i=1}^{6} w_i \\cdot \\hat{m_i}, \\quad \\sum w_i = 1"}
                </LaTeX>
              </p>
              <p className="text-xs text-muted">
                Trong đó <code>m̂_i</code> là giá trị đã chuẩn hóa về
                [0,1] (với chiều &quot;càng thấp càng tốt&quot; như
                hallucination thì dùng <code>1 − m</code>), còn{" "}
                <code>w_i</code> là trọng số theo use case. Trọng số
                chatbot khác hẳn trọng số y khoa — đừng copy công thức
                từ paper mà không điều chỉnh.
              </p>

              <CodeBlock language="python" title="agent_evaluation.py — harness tối giản">
                {`from statistics import mean

class AgentEvaluator:
    def __init__(self, weights=None):
        self.weights = weights or {
            "success": 0.30,
            "tool_use": 0.15,
            "hallucination": 0.20,  # càng thấp càng tốt
            "latency": 0.10,
            "cost": 0.10,
            "safety": 0.15,
        }

    def evaluate(self, agent, test_cases):
        results = []
        for test in test_cases:
            trajectory = agent.run(test.task)
            results.append({
                "success": test.check_success(trajectory.final_output),
                "steps": len(trajectory.steps),
                "tokens": trajectory.total_tokens,
                "tool_accuracy": self.check_tool_usage(trajectory),
                "hallucinations": self.check_hallucinations(trajectory),
                "latency_ms": trajectory.latency_ms,
                "cost_usd": trajectory.total_cost,
                "safety_violations": self.check_safety(trajectory),
            })
        return self._aggregate(results)

    def _aggregate(self, results):
        agg = {
            "success_rate":   mean(r["success"] for r in results),
            "tool_accuracy":  mean(r["tool_accuracy"] for r in results),
            "hallucination_rate": mean(r["hallucinations"] for r in results),
            "p95_latency_ms": percentile([r["latency_ms"] for r in results], 95),
            "cost_per_task":  mean(r["cost_usd"] for r in results),
            "safety_score":   1 - mean(r["safety_violations"] for r in results),
        }
        # Composite score — tuyến tính có trọng số
        norm = {
            "success": agg["success_rate"],
            "tool_use": agg["tool_accuracy"],
            "hallucination": 1 - agg["hallucination_rate"],
            "latency": clamp(1 - agg["p95_latency_ms"] / 60000, 0, 1),
            "cost": clamp(1 - agg["cost_per_task"] / 1.0, 0, 1),
            "safety": agg["safety_score"],
        }
        agg["composite"] = sum(self.weights[k] * norm[k] for k in norm)
        return agg`}
              </CodeBlock>

              <p className="text-sm">
                Trong pipeline thực tế, harness còn kết nối với CI. Một ví
                dụ cấu hình tối giản:
              </p>

              <CodeBlock
                language="yaml"
                title=".github/workflows/agent-eval.yml"
              >
                {`name: Agent Eval (nightly)

on:
  schedule:
    - cron: "0 3 * * *"   # 10h sáng VN
  workflow_dispatch: {}

jobs:
  golden-set:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run golden tasks
        run: python -m evals.run --suite golden --model claude-sonnet-4.7
      - name: Gate on composite score
        run: |
          python -m evals.gate \\
            --min-success 0.85 \\
            --max-hallucination 0.02 \\
            --min-safety 0.98
      - name: Upload report
        uses: actions/upload-artifact@v4
        with:
          name: eval-report
          path: reports/eval_*.json`}
              </CodeBlock>

              <CollapsibleDetail title="Offline eval vs Online eval — khi nào dùng gì?">
                <p className="text-sm">
                  Một team agent trưởng thành chạy CẢ HAI song song, với
                  vai trò khác nhau:
                </p>
                <ul className="list-disc list-inside text-sm space-y-1 pl-2 mt-2">
                  <li>
                    <strong>Offline eval</strong> (dataset cố định): gate
                    cho CI, phát hiện regression trước khi deploy, so
                    sánh A/B giữa các phiên bản model/prompt. Rẻ, lặp
                    được, kiểm soát biến.
                  </li>
                  <li>
                    <strong>Online eval</strong> (production traffic):
                    đo phân phối thật, bắt drift, thu feedback người
                    dùng. Dùng shadow traffic (chạy song song không
                    ảnh hưởng user), A/B test, hoặc interleaving.
                  </li>
                  <li>
                    <strong>Golden set hàng ngày</strong>: 50-200 task
                    chọn kỹ, đại diện cho use case quan trọng. Chạy hằng
                    ngày, alert nếu sụt &gt; 3% pass rate.
                  </li>
                </ul>
                <p className="text-sm mt-3">
                  Tỷ lệ tham khảo: 70% thời gian build eval dành cho
                  offline (CI gate, regression), 30% dành cho online
                  (shadow, feedback). Nhưng <em>tín hiệu production
                  luôn thắng</em> khi hai nguồn mâu thuẫn — offline chỉ
                  là mô phỏng.
                </p>
              </CollapsibleDetail>

              <CollapsibleDetail title="LLM-as-judge — bias, calibration, và khi nào tin được?">
                <p className="text-sm">
                  Dùng một LLM khác để chấm output là cách phổ biến và
                  scale tốt — nhưng đầy bẫy:
                </p>
                <ol className="list-decimal list-inside text-sm space-y-1 pl-2 mt-2">
                  <li>
                    <strong>Cùng họ bias</strong>: judge GPT-4 hay
                    chấm output GPT-4 cao hơn output Claude, và ngược
                    lại. Cách giảm: dùng 2 judge khác họ, lấy trung
                    bình.
                  </li>
                  <li>
                    <strong>Positional bias</strong>: khi so sánh A
                    vs B, judge hay chọn cái đầu tiên. Cách giảm:
                    shuffle thứ tự, hoặc hỏi cả hai chiều rồi lấy
                    đồng thuận.
                  </li>
                  <li>
                    <strong>Rubric mơ hồ</strong>: &quot;code có
                    đẹp không?&quot; cho kết quả không ổn định.
                    Viết rubric bằng checklist cụ thể: có type
                    hints? có test? tên biến &gt; 2 ký tự?
                  </li>
                  <li>
                    <strong>Calibration bằng human</strong>: mỗi
                    tuần chọn 30-50 mẫu, cho con người chấm, so
                    sánh với judge. Nếu agreement &lt; 0.7, chỉnh
                    lại rubric.
                  </li>
                </ol>
              </CollapsibleDetail>

              <p className="text-sm mt-4">
                Muốn kết hợp đánh giá với lớp bảo vệ runtime? Xem{" "}
                <TopicLink slug="guardrails">Guardrails</TopicLink> —
                chúng là &quot;immune system&quot; của agent production,
                bổ trợ cho eval harness.
              </p>
            </ExplanationSection>
          </LessonSection>

          {/* ───────────── 7. MINI CASE STUDY ───────────── */}
          <LessonSection
            step={7}
            totalSteps={TOTAL_STEPS}
            label="Case study: Agent bán lẻ"
          >
            <div className="rounded-xl border border-border bg-card p-4 text-sm space-y-3">
              <p>
                <strong className="text-foreground">Bối cảnh.</strong>{" "}
                Một sàn thương mại điện tử triển khai agent trả lời
                khách: tra đơn, đổi địa chỉ, hoàn tiền. Tuần đầu pass
                rate trên golden set: 91%. Ba tuần sau, pass rate
                golden vẫn 91%, nhưng CSAT (điểm hài lòng của khách
                thật) tụt 12 điểm.
              </p>
              <p>
                <strong className="text-foreground">Điều tra.</strong>{" "}
                Team bật online eval (shadow traffic + user feedback
                sampling) và thấy:
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li>
                  Agent xử lý các intent trong golden set (tra đơn,
                  đổi địa chỉ) vẫn tốt.
                </li>
                <li>
                  Nhưng traffic thật xuất hiện intent mới nhiều hơn:
                  &quot;hỏi size/màu&quot;, &quot;so sánh 2 SKU&quot;,
                  &quot;khi nào sale tiếp&quot;. Agent bịa câu trả
                  lời.
                </li>
                <li>
                  Hallucination rate trên production: 7.8% — trong khi
                  golden chỉ 0.9%.
                </li>
              </ul>
              <p>
                <strong className="text-foreground">Bài học.</strong>{" "}
                Golden set nếu không đại diện cho phân phối thật sẽ
                tạo cảm giác an toàn giả. Team cập nhật golden mỗi 2
                tuần từ 200 conversation sampling + thêm judge
                hallucination ở prod. CSAT hồi phục sau 5 tuần.
              </p>
            </div>
          </LessonSection>

          {/* ───────────── 8. TÓM TẮT ───────────── */}
          <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Tóm tắt">
            <MiniSummary
              title="Những điều cần nhớ về Agent Evaluation"
              points={[
                "6 chiều: Task Success, Tool Use, Hallucination, Latency, Cost, Safety — cần đánh giá TẤT CẢ, không chỉ một.",
                "Đánh giá trajectory (hành trình) không chỉ output — 2 Agent cùng đáp án nhưng đường đi khác nhau có rủi ro khác nhau.",
                "Safety là chiều quan trọng nhất cho production: hành động không thể hoàn tác + vượt scope = nguy hiểm.",
                "Benchmarks: SWE-bench (code), WebArena (web), GAIA (tổng quát), τ-bench (CS). Không cái nào đủ — chạy ít nhất 2.",
                "Kết hợp offline eval (CI gate) + online eval (drift, real traffic) + golden set hàng ngày (regression).",
                "LLM-as-judge scale tốt nhưng có bias — calibrate định kỳ bằng human eval để giữ tín hiệu đáng tin.",
              ]}
            />
          </LessonSection>

          {/* ───────────── 9. QUIZ ───────────── */}
          <LessonSection step={9} totalSteps={TOTAL_STEPS} label="Kiểm tra">
            <QuizSection questions={quizQuestions} />
          </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
