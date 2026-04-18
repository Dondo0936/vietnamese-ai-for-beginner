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
  slug: "ai-coding-assistants",
  title: "AI Coding Assistants",
  titleVi: "Trợ lý lập trình AI",
  description:
    "Các công cụ AI hỗ trợ viết code, debug và review — từ autocomplete đến agentic coding",
  category: "emerging",
  tags: ["copilot", "code-generation", "developer-tools"],
  difficulty: "beginner",
  relatedSlugs: ["llm-overview", "function-calling", "agentic-workflows"],
  vizType: "interactive",
};

// ──────────────────────────────────────────────────────────────────────
// DỮ LIỆU CHÍNH: Ba trợ lý coding phổ biến + bài toán demo
// ──────────────────────────────────────────────────────────────────────

type AssistantKey = "copilot" | "claude" | "gemini";

interface AssistantProfile {
  key: AssistantKey;
  name: string;
  vendor: string;
  color: string;
  accent: string;
  releaseYear: number;
  modelFamily: string;
  strength: string;
  weakness: string;
  tagline: string;
}

const ASSISTANTS: AssistantProfile[] = [
  {
    key: "copilot",
    name: "GitHub Copilot",
    vendor: "GitHub + OpenAI",
    color: "#22c55e",
    accent: "rgba(34,197,94,0.18)",
    releaseYear: 2021,
    modelFamily: "GPT-4.1 / o-series",
    strength: "Autocomplete siêu nhanh, tích hợp sâu với VS Code, JetBrains",
    weakness: "Reasoning cho codebase lớn kém hơn agentic tools",
    tagline: "Người tiên phong — biến autocomplete thành sản phẩm đại chúng",
  },
  {
    key: "claude",
    name: "Claude Code",
    vendor: "Anthropic",
    color: "#f97316",
    accent: "rgba(249,115,22,0.18)",
    releaseYear: 2024,
    modelFamily: "Claude Sonnet / Opus",
    strength: "Agentic: đọc cả repo, lên kế hoạch nhiều file, tự chạy test",
    weakness: "Chi phí token cao khi context lớn, cần setup CLI",
    tagline: "Đồng nghiệp agentic — nhận yêu cầu, tự đi đến commit",
  },
  {
    key: "gemini",
    name: "Gemini Code Assist",
    vendor: "Google",
    color: "#3b82f6",
    accent: "rgba(59,130,246,0.18)",
    releaseYear: 2024,
    modelFamily: "Gemini 2.5 Pro",
    strength: "Context window 1M+ token, tốt cho monorepo và tài liệu dài",
    weakness: "Chất lượng phụ thuộc heavily vào prompt + repo structure",
    tagline: "Khủng long context — nuốt cả nghìn file trong một lượt",
  },
];

// Một partial Python function dùng làm bài toán demo.
const PARTIAL_CODE = [
  "def merge_sorted_lists(a: list[int], b: list[int]) -> list[int]:",
  '    """Merge two sorted lists into a single sorted list.',
  "    >>> merge_sorted_lists([1,3,5], [2,4,6])",
  "    [1, 2, 3, 4, 5, 6]",
  '    """',
  "    result: list[int] = []",
  "    i, j = 0, 0",
  "    while i < len(a) and j < len(b):",
  "        # TODO: điền logic so sánh và append",
];

// Gợi ý hoàn thành của từng trợ lý (kèm pros/cons).
interface CompletionSample {
  label: string;
  language: "python";
  body: string[];
  pros: string[];
  cons: string[];
  tokenCost: number;
  latencyMs: number;
}

const COMPLETIONS: Record<AssistantKey, CompletionSample> = {
  copilot: {
    label: "Gợi ý ngắn gọn, bám sát context",
    language: "python",
    body: [
      "        if a[i] <= b[j]:",
      "            result.append(a[i])",
      "            i += 1",
      "        else:",
      "            result.append(b[j])",
      "            j += 1",
      "    result.extend(a[i:])",
      "    result.extend(b[j:])",
      "    return result",
    ],
    pros: [
      "Bám sát docstring — trả về list đã merge",
      "Xử lý đầy đủ phần đuôi (tail) của cả hai list",
      "Độ trễ thấp (<400ms) — phù hợp autocomplete inline",
    ],
    cons: [
      "Không thêm type hints chặt chẽ hơn docstring đã có",
      "Không có unit test đi kèm — phải tự viết",
    ],
    tokenCost: 68,
    latencyMs: 380,
  },
  claude: {
    label: "Giải pháp đầy đủ + test + lý do thiết kế",
    language: "python",
    body: [
      "        if a[i] <= b[j]:",
      "            result.append(a[i]); i += 1",
      "        else:",
      "            result.append(b[j]); j += 1",
      "    # Phần còn lại của list nào chưa duyệt hết thì nối đuôi",
      "    result.extend(a[i:] or b[j:])",
      "    return result",
      "",
      "",
      "def _test_merge_sorted_lists() -> None:",
      "    assert merge_sorted_lists([], []) == []",
      "    assert merge_sorted_lists([1], []) == [1]",
      "    assert merge_sorted_lists([1,3,5], [2,4,6]) == [1,2,3,4,5,6]",
      "    assert merge_sorted_lists([1,1,1], [1,1]) == [1,1,1,1,1]",
    ],
    pros: [
      "Kèm theo 4 unit tests bao phủ edge cases (empty, duplicates)",
      "Có comment tiếng Việt giải thích phần nối đuôi",
      "Dùng `or` để gộp 2 nhánh extend — gọn hơn",
    ],
    cons: [
      "Dùng nhiều token hơn Copilot (~3x)",
      "Nếu bạn chỉ muốn autocomplete thì output này 'quá đà'",
    ],
    tokenCost: 214,
    latencyMs: 1200,
  },
  gemini: {
    label: "Phong cách chuẩn PEP 8, chú trọng tài liệu",
    language: "python",
    body: [
      "        if a[i] <= b[j]:",
      "            result.append(a[i])",
      "            i += 1",
      "            continue",
      "        result.append(b[j])",
      "        j += 1",
      "    # Gemini ưu tiên giữ O(n+m) và không tạo list tạm",
      "    while i < len(a):",
      "        result.append(a[i]); i += 1",
      "    while j < len(b):",
      "        result.append(b[j]); j += 1",
      "    return result",
    ],
    pros: [
      "Không dùng slicing — tiết kiệm memory với list rất lớn",
      "Tách nhánh `continue` rõ ràng, dễ đọc cho newbie",
      "Style gần với Google Python Style Guide",
    ],
    cons: [
      "Dài dòng hơn bản Copilot mà không cải thiện độ phức tạp",
      "Không có test đi kèm",
    ],
    tokenCost: 142,
    latencyMs: 820,
  },
};

// Benchmark HumanEval & SWE-bench (dữ liệu minh họa, làm tròn công khai 2025).
interface BenchmarkRow {
  assistant: AssistantKey;
  humanEval: number; // %
  sweBench: number; // %
  mbpp: number; // %
}

const BENCHMARKS: BenchmarkRow[] = [
  { assistant: "copilot", humanEval: 82, sweBench: 27, mbpp: 74 },
  { assistant: "claude", humanEval: 92, sweBench: 49, mbpp: 86 },
  { assistant: "gemini", humanEval: 87, sweBench: 36, mbpp: 81 },
];

// Danh sách 4 thế hệ — giữ nguyên câu chuyện tiến hóa.
const LEVELS = [
  {
    name: "Autocomplete",
    year: "2021",
    tools: "GitHub Copilot, TabNine",
    capability: 30,
    desc: "Gợi ý hoàn thành dòng code hiện tại",
  },
  {
    name: "Chat-based",
    year: "2023",
    tools: "ChatGPT, Claude",
    capability: 55,
    desc: "Hỏi-đáp, giải thích, sinh code block",
  },
  {
    name: "Inline Edit",
    year: "2024",
    tools: "Cursor, Copilot Edit",
    capability: 70,
    desc: "Sửa code trực tiếp trong editor theo prompt",
  },
  {
    name: "Agentic",
    year: "2025",
    tools: "Claude Code, Devin, Cursor Agent",
    capability: 90,
    desc: "Tự động: đọc codebase, plan, implement, test, commit",
  },
];

const TOTAL_STEPS = 9;

// ──────────────────────────────────────────────────────────────────────
// COMPONENT CHÍNH
// ──────────────────────────────────────────────────────────────────────

export default function AICodingAssistantsTopic() {
  const [selected, setSelected] = useState<AssistantKey>("claude");
  const [activeLevel, setActiveLevel] = useState(3);
  const [showDiff, setShowDiff] = useState(false);
  const [benchmark, setBenchmark] = useState<"humanEval" | "sweBench" | "mbpp">(
    "humanEval",
  );

  const currentProfile = useMemo(
    () => ASSISTANTS.find((a) => a.key === selected)!,
    [selected],
  );
  const completion = COMPLETIONS[selected];
  const level = LEVELS[activeLevel];

  const benchmarkLabel: Record<typeof benchmark, string> = {
    humanEval: "HumanEval (pass@1)",
    sweBench: "SWE-bench Verified",
    mbpp: "MBPP (function synthesis)",
  };

  const maxBenchValue = useMemo(
    () => Math.max(...BENCHMARKS.map((b) => b[benchmark])),
    [benchmark],
  );

  const cycleAssistant = useCallback(() => {
    const order: AssistantKey[] = ["copilot", "claude", "gemini"];
    const next = order[(order.indexOf(selected) + 1) % order.length];
    setSelected(next);
  }, [selected]);

  // ──────────────────────────────────────────────────────────────────
  // QUIZ — 8 câu như yêu cầu
  // ──────────────────────────────────────────────────────────────────
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question: "Agentic coding assistant khác chat-based assistant thế nào?",
        options: [
          "Dùng model lớn hơn",
          "TỰ ĐỘNG thực hiện nhiều bước: đọc codebase → plan → code → test → fix → commit. Không cần copy-paste",
          "Chỉ hỗ trợ 1 ngôn ngữ",
        ],
        correct: 1,
        explanation:
          "Chat-based: bạn hỏi, AI trả lời code, bạn copy-paste vào editor. Agentic: bạn mô tả yêu cầu, AI tự đọc codebase hiểu context, plan changes, implement across files, chạy tests, fix errors, tạo commit. Từ 'trợ lý trả lời' sang 'đồng nghiệp tự làm'.",
      },
      {
        question: "AI coding assistant làm developer mất việc không?",
        options: [
          "Có — AI sẽ viết code thay người hoàn toàn",
          "Không — AI tăng năng suất 2-5x nhưng vẫn cần developer thiết kế, review, và giải quyết bài toán phức tạp",
          "Chỉ ảnh hưởng junior developers",
        ],
        correct: 1,
        explanation:
          "AI viết code nhanh nhưng vẫn cần người: hiểu business requirements, thiết kế system architecture, review code quality, xử lý edge cases, debug logic phức tạp. Developer + AI = 2-5x năng suất. Giống máy tính không thay thế kế toán — nó làm kế toán mạnh hơn.",
      },
      {
        question: "Rủi ro lớn nhất khi dùng AI coding assistant là gì?",
        options: [
          "Code chạy chậm hơn",
          "Security vulnerabilities: AI có thể sinh code có lỗ hổng (SQL injection, hardcoded secrets) mà developer không nhận ra nếu không review kỹ",
          "AI học code của bạn và bán cho người khác",
        ],
        correct: 1,
        explanation:
          "AI sinh code nhanh nhưng KHÔNG đảm bảo secure. Nghiên cứu chỉ ra: AI-generated code có tỷ lệ vulnerabilities tương đương human code, nhưng developers tin tưởng AI nên ÍT REVIEW hơn. Cần: security linting, code review, và hiểu rõ code trước khi merge.",
      },
      {
        type: "fill-blank",
        question:
          "Gen 1 (2021) của AI coding assistant chỉ dừng ở mức {blank} từng dòng, còn Gen 4 (2025) hoạt động như một {blank} tự đọc codebase, plan, implement, test và commit.",
        blanks: [
          {
            answer: "autocomplete",
            accept: ["tự hoàn thành", "auto-complete", "gợi ý"],
          },
          {
            answer: "agent",
            accept: ["agentic", "tác tử", "đồng nghiệp"],
          },
        ],
        explanation:
          "Tiến hóa: autocomplete (gợi ý dòng) → chat → inline edit → agent. Agent tự chủ thực hiện chuỗi hành động (đọc file, sửa code, chạy test) thay vì chỉ trả lời 1 lượt — đây là khác biệt lớn nhất giữa Gen 1 và Gen 4.",
      },
      {
        question:
          "Một bài HumanEval đo cái gì — và tại sao KHÔNG đủ để đánh giá 'trợ lý coding tốt'?",
        options: [
          "Đo thời gian phản hồi API, nên không nói lên chất lượng code",
          "Đo pass@1 cho hàm Python đơn lẻ; không đo refactor nhiều file, long-context, debug repo thật",
          "Đo số sao GitHub của sản phẩm, không liên quan code",
        ],
        correct: 1,
        explanation:
          "HumanEval: 164 bài tập viết 1 hàm Python ngắn, chấm pass@1 bằng unit test. Rất quan trọng nhưng: không đo khả năng điều hướng repo, viết tài liệu, debug lỗi production, hay phối hợp nhiều file. Đó là lý do SWE-bench ra đời.",
      },
      {
        question:
          "Bạn dùng Copilot để viết form đăng ký. Nó sinh code lưu password ở dạng plain text vào SQL. Bạn nên:",
        options: [
          "Tin Copilot và merge — model lớn đâu sai được",
          "Dừng, review, bắt buộc bcrypt/argon2 + parameterized query, thêm Semgrep vào CI để chặn pattern này",
          "Tắt Copilot và viết tay hoàn toàn",
        ],
        correct: 1,
        explanation:
          "Copilot học từ open-source — một phần code xấu cũng được học theo. Best practice: (1) review nghiêm ngặt mọi gợi ý liên quan auth/secret, (2) bật guardrail tự động: Semgrep, CodeQL, pre-commit hook. 'Trust but verify' là tâm lý bắt buộc.",
      },
      {
        question:
          "Với một monorepo 3 triệu dòng code, giữa Claude Code và Gemini Code, trợ lý nào thường hợp lý nhất cho tác vụ 'tìm tất cả chỗ gọi API X rồi thay bằng API Y'?",
        options: [
          "Copilot — vì nó nhanh nhất",
          "Gemini Code — context window 1M+ token cho phép nuốt phần lớn repo trong 1 lượt, giảm số lần retrieve",
          "Cả hai đều không làm được — phải viết script AST",
        ],
        correct: 1,
        explanation:
          "Context window lớn của Gemini (1M+) giúp inspect một lượng code khổng lồ mà không cần chia nhỏ. Claude Code vẫn làm được nhờ agentic retrieval, nhưng tốn nhiều vòng tool call hơn. Chọn công cụ phù hợp tác vụ, không chọn công cụ 'tốt nhất'.",
      },
      {
        question:
          "Điểm chung của cả ba trợ lý (Copilot, Claude Code, Gemini) về mặt pháp lý là gì?",
        options: [
          "Cả ba đều cấm dùng cho mục đích thương mại",
          "Cả ba đều có điều khoản về dữ liệu code, license đầu ra và khả năng opt-out khỏi training — developer PHẢI đọc TOS của team/công ty trước khi dùng",
          "Cả ba đều bảo đảm code sinh ra không vi phạm copyright",
        ],
        correct: 1,
        explanation:
          "Không nhà cung cấp nào bảo đảm 100% code sinh ra 'sạch' copyright. Mỗi nơi có chính sách khác nhau về: lưu prompt, dùng cho training, indemnification. Enterprise thường mua gói business để được cam kết rõ ràng hơn. Đọc TOS là bước bắt buộc, không phải tùy chọn.",
      },
    ],
    [],
  );

  // ──────────────────────────────────────────────────────────────────
  // HELPERS — chia JSX ra cho dễ đọc, không tách component riêng
  // ──────────────────────────────────────────────────────────────────

  const renderAssistantTab = (a: AssistantProfile) => {
    const isActive = a.key === selected;
    return (
      <button
        key={a.key}
        type="button"
        onClick={() => setSelected(a.key)}
        className={`flex-1 min-w-[140px] rounded-xl border px-4 py-3 text-left transition-all ${
          isActive
            ? "border-transparent shadow-lg"
            : "border-border bg-card hover:border-accent/60"
        }`}
        style={{
          background: isActive ? a.accent : undefined,
          borderColor: isActive ? a.color : undefined,
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <span
            className="text-xs font-bold uppercase tracking-wide"
            style={{ color: a.color }}
          >
            {a.name}
          </span>
          <span className="text-[10px] text-muted">{a.releaseYear}</span>
        </div>
        <p className="text-[11px] text-muted leading-snug">{a.tagline}</p>
      </button>
    );
  };

  const renderEditorMock = () => (
    <div className="rounded-xl border border-border bg-[#0b1021] overflow-hidden shadow-inner">
      {/* Thanh tab giả lập editor */}
      <div className="flex items-center justify-between bg-[#141a32] px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
          <span className="ml-3 text-[11px] text-muted font-mono">
            merge_sorted_lists.py — {currentProfile.name}
          </span>
        </div>
        <span className="text-[10px] text-muted font-mono">
          model: {currentProfile.modelFamily}
        </span>
      </div>

      {/* Vùng code */}
      <div className="grid grid-cols-[40px_1fr] font-mono text-[12px] leading-relaxed">
        {/* Số dòng cho PARTIAL_CODE */}
        {PARTIAL_CODE.map((_, idx) => (
          <div
            key={`ln-partial-${idx}`}
            className="text-right pr-2 py-[1px] text-muted/60 bg-[#0b1021] select-none"
          >
            {idx + 1}
          </div>
        ))}
        {/* Nội dung PARTIAL_CODE — đã gõ sẵn */}
        {PARTIAL_CODE.map((line, idx) => (
          <pre
            key={`pc-${idx}`}
            className="py-[1px] text-slate-200 whitespace-pre"
          >
            {line}
          </pre>
        )).map((node, idx) => (
          <div
            key={`pc-wrap-${idx}`}
            className="col-start-2"
            style={{ gridRow: idx + 1 }}
          >
            {node}
          </div>
        ))}

        {/* Completion từ assistant — highlight */}
        {completion.body.map((line, idx) => (
          <div
            key={`ghost-line-${idx}`}
            className="text-right pr-2 py-[1px] text-muted/40 bg-[#0b1021] select-none"
          >
            {PARTIAL_CODE.length + idx + 1}
          </div>
        ))}
        {completion.body.map((line, idx) => (
          <motion.pre
            key={`ghost-${idx}`}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.03 }}
            className="py-[1px] whitespace-pre"
            style={{
              background: currentProfile.accent,
              color: currentProfile.color,
            }}
          >
            {line || " "}
          </motion.pre>
        )).map((node, idx) => (
          <div
            key={`ghost-wrap-${idx}`}
            className="col-start-2"
            style={{ gridRow: PARTIAL_CODE.length + idx + 1 }}
          >
            {node}
          </div>
        ))}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between bg-[#141a32] px-4 py-2 border-t border-border text-[10px] font-mono text-muted">
        <span>{completion.label}</span>
        <span>
          {completion.tokenCost} tokens · {completion.latencyMs}ms
        </span>
      </div>
    </div>
  );

  const renderProsCons = () => (
    <div className="grid md:grid-cols-2 gap-3 mt-4">
      <div
        className="rounded-lg border p-3"
        style={{
          borderColor: currentProfile.color + "66",
          background: currentProfile.accent,
        }}
      >
        <p
          className="text-xs font-bold mb-2 uppercase tracking-wide"
          style={{ color: currentProfile.color }}
        >
          Điểm mạnh
        </p>
        <ul className="space-y-1.5 text-xs text-foreground/90">
          {completion.pros.map((p, i) => (
            <li key={i} className="flex gap-2">
              <span style={{ color: currentProfile.color }}>✓</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-lg border border-border bg-card p-3">
        <p className="text-xs font-bold mb-2 uppercase tracking-wide text-muted">
          Hạn chế
        </p>
        <ul className="space-y-1.5 text-xs text-foreground/80">
          {completion.cons.map((c, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-red-400/80">!</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderBenchmarkChart = () => (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-foreground">
            Benchmark: {benchmarkLabel[benchmark]}
          </p>
          <p className="text-[11px] text-muted">
            Số liệu tham khảo công khai 2025 — làm tròn để minh họa.
          </p>
        </div>
        <div className="flex gap-1">
          {(["humanEval", "sweBench", "mbpp"] as const).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBenchmark(b)}
              className={`rounded-md px-2 py-1 text-[10px] font-semibold transition-colors ${
                benchmark === b
                  ? "bg-accent text-white"
                  : "bg-background border border-border text-muted hover:text-foreground"
              }`}
            >
              {b === "humanEval"
                ? "HumanEval"
                : b === "sweBench"
                  ? "SWE-bench"
                  : "MBPP"}
            </button>
          ))}
        </div>
      </div>

      <svg viewBox="0 0 600 180" className="w-full">
        {BENCHMARKS.map((row, i) => {
          const profile = ASSISTANTS.find((a) => a.key === row.assistant)!;
          const y = 20 + i * 50;
          const value = row[benchmark];
          const barWidth = (value / 100) * 440;
          const isSelected = row.assistant === selected;
          return (
            <g key={row.assistant}>
              <text
                x={10}
                y={y + 18}
                fontSize={11}
                fontWeight={isSelected ? "bold" : "normal"}
                fill={isSelected ? profile.color : "#94a3b8"}
              >
                {profile.name}
              </text>
              <rect
                x={130}
                y={y}
                width={440}
                height={28}
                rx={6}
                fill="#1e293b"
              />
              <motion.rect
                key={`${row.assistant}-${benchmark}`}
                x={130}
                y={y}
                height={28}
                rx={6}
                fill={profile.color}
                initial={{ width: 0 }}
                animate={{ width: barWidth }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                opacity={isSelected ? 1 : 0.55}
              />
              <text
                x={135 + barWidth}
                y={y + 18}
                fontSize={11}
                fontWeight="bold"
                fill="#f8fafc"
              >
                {value}%
              </text>
              {value === maxBenchValue && (
                <text
                  x={585}
                  y={y + 18}
                  fontSize={11}
                  fill={profile.color}
                  textAnchor="end"
                >
                  ★
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <p className="text-[11px] text-muted mt-2 leading-relaxed">
        <strong>HumanEval</strong>: 164 bài viết hàm Python ngắn.{" "}
        <strong>SWE-bench Verified</strong>: 500 issue thật trên GitHub, đo khả
        năng tự patch. <strong>MBPP</strong>: 974 bài function synthesis.
      </p>
    </div>
  );

  return (
    <>
      {/* ───────────── 1. DỰ ĐOÁN ───────────── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn cần implement tính năng authentication cho app Next.js. Cách nào nhanh nhất?"
          options={[
            "Đọc documentation và viết từ đầu — mất 2-3 ngày",
            "Dùng AI coding assistant: mô tả yêu cầu, AI đọc codebase, plan, implement across files, chạy tests — mất 2-3 giờ",
            "Copy code từ Stack Overflow",
          ]}
          correct={1}
          explanation="AI coding assistants giảm thời gian 5-10x cho nhiều tasks. Tự đọc docs, hiểu codebase context, implement multi-file changes, fix errors. Nhưng vẫn cần developer: review code, hiểu logic, và đảm bảo chất lượng. AI là 'pair programmer siêu nhanh'."
        >
          {/* ───────────── 2. EDITOR DEMO + BENCHMARKS ───────────── */}
          <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
            <p className="mb-4 text-sm text-muted leading-relaxed">
              Chọn từng trợ lý bên dưới để xem nó hoàn thành cùng một hàm
              Python — kèm chi phí token, độ trễ, và điểm mạnh/yếu. Sau đó so
              sánh trên ba benchmark phổ biến nhất.
            </p>

            <VisualizationSection>
              <div className="space-y-5">
                {/* Tabs assistant */}
                <div className="flex flex-wrap gap-2">
                  {ASSISTANTS.map(renderAssistantTab)}
                </div>

                {/* Thông tin nhà cung cấp */}
                <div
                  className="rounded-xl border p-4"
                  style={{
                    borderColor: currentProfile.color + "55",
                    background: currentProfile.accent,
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <p className="text-sm font-bold text-foreground">
                      {currentProfile.name}{" "}
                      <span className="text-xs font-normal text-muted">
                        · {currentProfile.vendor}
                      </span>
                    </p>
                    <span
                      className="text-[10px] font-mono rounded-md px-2 py-0.5"
                      style={{
                        background: currentProfile.color + "22",
                        color: currentProfile.color,
                      }}
                    >
                      {currentProfile.modelFamily}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    <strong>Mạnh:</strong> {currentProfile.strength}
                  </p>
                  <p className="text-xs text-foreground/70 leading-relaxed mt-1">
                    <strong>Yếu:</strong> {currentProfile.weakness}
                  </p>
                </div>

                {/* Editor mock */}
                {renderEditorMock()}

                {/* Pros / Cons */}
                {renderProsCons()}

                {/* Hai nút phụ */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={cycleAssistant}
                    className="text-xs rounded-md border border-border bg-background px-3 py-1.5 text-foreground hover:border-accent transition"
                  >
                    → Thử trợ lý tiếp theo
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDiff((v) => !v)}
                    className="text-xs rounded-md border border-border bg-background px-3 py-1.5 text-foreground hover:border-accent transition"
                  >
                    {showDiff ? "Ẩn" : "Hiện"} so sánh số liệu
                  </button>
                </div>

                {showDiff && (
                  <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-xs">
                      <thead className="bg-background text-muted">
                        <tr>
                          <th className="text-left px-3 py-2">Assistant</th>
                          <th className="text-right px-3 py-2">Tokens</th>
                          <th className="text-right px-3 py-2">Latency</th>
                          <th className="text-right px-3 py-2">
                            Phù hợp nhất cho
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {ASSISTANTS.map((a) => {
                          const c = COMPLETIONS[a.key];
                          return (
                            <tr
                              key={a.key}
                              className="border-t border-border"
                              style={{
                                background:
                                  a.key === selected ? a.accent : undefined,
                              }}
                            >
                              <td
                                className="px-3 py-2 font-semibold"
                                style={{ color: a.color }}
                              >
                                {a.name}
                              </td>
                              <td className="px-3 py-2 text-right font-mono">
                                {c.tokenCost}
                              </td>
                              <td className="px-3 py-2 text-right font-mono">
                                {c.latencyMs}ms
                              </td>
                              <td className="px-3 py-2 text-right text-muted">
                                {a.key === "copilot" && "Autocomplete inline"}
                                {a.key === "claude" && "Agentic multi-file"}
                                {a.key === "gemini" && "Monorepo, long context"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Benchmark chart */}
                {renderBenchmarkChart()}
              </div>
            </VisualizationSection>
          </LessonSection>

          {/* ───────────── 3. TIẾN HÓA 4 THẾ HỆ ───────────── */}
          <LessonSection
            step={3}
            totalSteps={TOTAL_STEPS}
            label="Lịch sử 4 thế hệ"
          >
            <p className="mb-4 text-sm text-muted leading-relaxed">
              Để hiểu vì sao 2025 là thời điểm khác biệt, ta nhìn lại{" "}
              <strong className="text-foreground">4 thế hệ</strong> AI coding
              assistants — từ autocomplete đến agentic.
            </p>
            <VisualizationSection>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 justify-center">
                  {LEVELS.map((l, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveLevel(i)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        activeLevel === i
                          ? "bg-accent text-white"
                          : "bg-card border border-border text-muted hover:text-foreground"
                      }`}
                    >
                      {l.name} ({l.year})
                    </button>
                  ))}
                </div>
                <svg viewBox="0 0 600 150" className="w-full max-w-2xl mx-auto">
                  {LEVELS.map((l, i) => {
                    const y = 10 + i * 33;
                    const isActive = i === activeLevel;
                    return (
                      <g key={i}>
                        <text
                          x={15}
                          y={y + 16}
                          fill={isActive ? "#e2e8f0" : "#64748b"}
                          fontSize={8}
                          fontWeight={isActive ? "bold" : "normal"}
                        >
                          {l.name}
                        </text>
                        <rect
                          x={110}
                          y={y}
                          width={380}
                          height={24}
                          rx={3}
                          fill="#1e293b"
                        />
                        <rect
                          x={110}
                          y={y}
                          width={(380 * l.capability) / 100}
                          height={24}
                          rx={3}
                          fill={isActive ? "#22c55e" : "#475569"}
                          opacity={isActive ? 1 : 0.3}
                        />
                        <text
                          x={115 + (380 * l.capability) / 100}
                          y={y + 16}
                          fill="white"
                          fontSize={9}
                          fontWeight="bold"
                        >
                          {l.capability}%
                        </text>
                        <text
                          x={520}
                          y={y + 16}
                          fill="#94a3b8"
                          fontSize={7}
                        >
                          {l.year}
                        </text>
                      </g>
                    );
                  })}
                </svg>
                <div className="rounded-lg border border-border bg-card p-3 text-center">
                  <p className="text-sm font-semibold">
                    {level.name} ({level.year})
                  </p>
                  <p className="text-xs text-muted mt-1">{level.desc}</p>
                  <p className="text-xs text-muted">{level.tools}</p>
                </div>
              </div>
            </VisualizationSection>
          </LessonSection>

          {/* ───────────── 4. AHA MOMENT ───────────── */}
          <LessonSection
            step={4}
            totalSteps={TOTAL_STEPS}
            label="Khoảnh khắc Aha"
          >
            <AhaMoment>
              <p>
                Từ <strong>gợi ý 1 dòng</strong> (2021) đến{" "}
                <strong>tự implement cả feature</strong> (2025) chỉ trong 4
                năm! Agentic assistants giống{" "}
                <strong>đồng nghiệp junior rất nhanh</strong> — đọc codebase,
                plan, implement, test, commit. Developer chuyển từ 'viết
                code' sang <strong>'thiết kế và review code'</strong>. Và —
                điểm quan trọng — mỗi trợ lý là một triết lý thiết kế khác
                nhau, không có cái 'tốt nhất', chỉ có cái{" "}
                <strong>phù hợp ngữ cảnh</strong>.
              </p>
            </AhaMoment>
          </LessonSection>

          {/* ───────────── 5. CALLOUTS ───────────── */}
          <LessonSection
            step={5}
            totalSteps={TOTAL_STEPS}
            label="Bốn lưu ý quan trọng"
          >
            <div className="space-y-3">
              <Callout variant="tip" title="Năng suất thực tế đo được">
                Nghiên cứu GitHub (2024) trên 4,867 developer: Copilot tăng
                tốc 55% cho tác vụ coding điển hình. Nhưng: (1) chỉ đúng cho
                well-defined tasks, (2) review time tăng 20%, (3) complex
                architecture tasks — AI ít giúp. Net productivity gain thực
                tế: 30-40% cho công việc trung bình.
              </Callout>

              <Callout variant="warning" title="Security là vấn đề số 1">
                Stanford nghiên cứu 2023: developer dùng AI assistant viết
                code <em>kém an toàn hơn</em> nhóm không dùng, nhưng lại{" "}
                <em>tự tin hơn</em> vào code của mình. Hệ quả: ít review, ít
                test edge-case. Bắt buộc có security linter (Semgrep,
                CodeQL) + code review bắt buộc trong CI.
              </Callout>

              <Callout variant="info" title="Context là vua tuyệt đối">
                Cả ba trợ lý đều dở nếu bạn không cho context tốt. Đưa code
                snippet, file lân cận, test cũ, message lỗi — kết quả nhảy
                vọt. Xem <TopicLink slug="prompt-engineering">kỹ thuật
                prompt</TopicLink> để hiểu cách 'nuôi' context hiệu quả.
              </Callout>

              <Callout variant="insight" title="Chi phí ẩn: vòng lặp tin cậy">
                Khi AI đúng 9/10 lần, bạn sẽ ngừng review kỹ ở lần thứ 11
                — và đó là lúc nó sai. Đừng để năng suất nhanh che khuất
                trách nhiệm review. Giữ nhịp review bất biến, nhất là với
                code liên quan auth, payment, data mutation.
              </Callout>
            </div>
          </LessonSection>

          {/* ───────────── 6. THÁCH THỨC ───────────── */}
          <LessonSection
            step={6}
            totalSteps={TOTAL_STEPS}
            label="Thử thách nhỏ"
          >
            <div className="space-y-4">
              <InlineChallenge
                question="AI sinh code nhanh nhưng bạn phát hiện: code có SQL injection vulnerability. AI không cảnh báo. Bạn nên làm gì?"
                options={[
                  "Trust AI — nó thông minh hơn mình",
                  "LUÔN review AI-generated code, dùng security linting (Semgrep, CodeQL), và hiểu rõ code trước khi merge",
                  "Bỏ AI và viết code thủ công",
                ]}
                correct={1}
                explanation="AI sinh code nhanh nhưng KHÔNG đảm bảo an toàn. Developer phải: (1) review mọi line AI sinh, (2) chạy security linting tự động, (3) hiểu rõ logic trước khi merge. AI là tool, không phải replacement cho judgment. Trust but verify!"
              />

              <InlineChallenge
                question="Team bạn dùng Copilot 6 tháng, code lint sạch, test pass đầy đủ, nhưng tần suất hotfix production tăng 2.3x. Nguyên nhân gốc có khả năng cao nhất?"
                options={[
                  "Copilot cố tình sinh bug",
                  "Test pass không có nghĩa đúng — team đã giảm thời gian review/design, AI sinh code 'plausible' nhưng thiếu tính edge-case",
                  "Do thời tiết — không liên quan AI",
                ]}
                correct={1}
                explanation="Đây là pattern thực tế đã quan sát: velocity tăng, review giảm. AI giỏi sinh code 'nhìn đúng' nhưng yếu ở edge case hiếm. Hotfix tăng vì bug lọt lưới — không phải Copilot dở, mà process review đã lỏng đi. Giải pháp: giữ định mức review + thêm fuzz/property-based testing."
              />
            </div>
          </LessonSection>

          {/* ───────────── 7. LÝ THUYẾT ───────────── */}
          <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Lý thuyết">
            <ExplanationSection>
              <p>
                <strong>AI Coding Assistants</strong> là công cụ AI hỗ trợ
                developer viết code — từ autocomplete đến agentic coding tự
                động.
              </p>
              <p>
                <strong>Kiến trúc chung</strong> của một trợ lý hiện đại
                gồm 3 lớp:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>Context builder</strong>: thu thập file đang
                  mở, file lân cận, git diff, lỗi runtime gần nhất — nén lại
                  thành prompt. Quyết định 70% chất lượng output.
                </li>
                <li>
                  <strong>LLM backbone</strong>: model sinh code. Mỗi vendor
                  tinh chỉnh riêng (Copilot tune cho tốc độ, Claude tune cho
                  reasoning, Gemini tune cho long-context).
                </li>
                <li>
                  <strong>Action loop</strong>: chỉ có ở agentic tools —
                  vòng lặp{" "}
                  <TopicLink slug="agentic-workflows">plan → act →
                  observe → refine</TopicLink>, sử dụng{" "}
                  <TopicLink slug="function-calling">function calling
                  </TopicLink> để chạy test và đọc file.
                </li>
              </ul>

              <p>
                <strong>4 thế hệ</strong> — hình dung như thang tiến hóa:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>Gen 1 — Autocomplete (2021):</strong> Gợi ý hoàn
                  thành code. Copilot, TabNine. Tốc độ &lt; 500ms, không
                  multi-file.
                </li>
                <li>
                  <strong>Gen 2 — Chat (2023):</strong> Hỏi-đáp, sinh code
                  block, giải thích. ChatGPT, Claude. Phải copy-paste giữa
                  editor và chat.
                </li>
                <li>
                  <strong>Gen 3 — Inline Edit (2024):</strong> Sửa code
                  trực tiếp trong editor. Cursor Cmd+K, Copilot Edits. Bắt
                  đầu hiểu nhiều file nhưng vẫn 1 lượt.
                </li>
                <li>
                  <strong>Gen 4 — Agentic (2025):</strong> Tự động
                  multi-step theo{" "}
                  <TopicLink slug="agentic-workflows">agentic
                  workflows</TopicLink>: plan → code → test → fix. Claude
                  Code, Devin, Cursor Agent.
                </li>
              </ul>

              <p>
                <strong>Chấm điểm bằng benchmark</strong> — công thức đơn
                giản:
              </p>
              <p className="text-center">
                <LaTeX>
                  {"\\text{pass@1} = \\mathbb{E}_{p \\sim P}\\left[ \\mathbb{1}\\left( \\text{test}(\\text{model}(p)) \\right) \\right]"}
                </LaTeX>
              </p>
              <p className="text-xs text-muted">
                Đọc: với mỗi problem <code>p</code>, ta gọi model đúng 1
                lần, chạy test — pass@1 là tỷ lệ pass trung bình. HumanEval
                dùng công thức này với 164 problem.
              </p>

              <Callout variant="tip" title="Benchmark không phải chân lý">
                Mọi benchmark đều bị overfit sau một thời gian. HumanEval
                (2021) giờ đã bão hòa — Claude, GPT-4, Gemini đều
                &gt;85%. SWE-bench (2023) khó hơn nhưng cũng đang leo dần.
                Kết quả benchmark chỉ là{" "}
                <strong>tín hiệu</strong>, không phải phán quyết — hãy tự
                kiểm thử trên codebase của bạn.
              </Callout>

              <p>
                <strong>Best practices thực chiến:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>Review mọi dòng:</strong> AI sinh code nhanh
                  nhưng có thể có bugs, security issues. Ít nhất là scan
                  bằng linter trước khi commit.
                </li>
                <li>
                  <strong>Context là vua:</strong> Càng nhiều context
                  (codebase, docs, tests) → AI càng chính xác. Học cách
                  viết{" "}
                  <TopicLink slug="prompt-engineering">
                    prompt
                  </TopicLink>{" "}
                  rõ ràng là kỹ năng quan trọng nhất.
                </li>
                <li>
                  <strong>Iterative:</strong> Sinh → review → refine →
                  test. Không expect perfect code từ lần đầu.
                </li>
                <li>
                  <strong>Security first:</strong> Chạy Semgrep/CodeQL
                  trên AI-generated code trước khi merge. Tích hợp vào CI.
                </li>
                <li>
                  <strong>Ôm theo test:</strong> Mỗi lần nhờ AI sinh hàm,
                  yêu cầu kèm 3-5 unit test. Nếu AI không viết được test,
                  có thể nó không hiểu bài toán.
                </li>
              </ul>

              <CodeBlock
                language="bash"
                title="AI coding workflow thực tế — từ terminal đến commit"
              >
                {`# 1. Claude Code: agentic coding trong terminal
# Mô tả yêu cầu bằng tiếng Việt
claude "Thêm authentication middleware cho Express app,
       dùng JWT, lưu refresh token trong Redis,
       viết unit tests với Jest"

# Claude Code sẽ:
# - Đọc codebase hiểu structure
# - Plan: middleware file, redis config, tests
# - Implement across 4-5 files
# - Chạy tests, fix errors
# - Tạo commit với message rõ ràng

# 2. Cursor: AI-powered editor
# Cmd+K: inline edit
# Cmd+L: chat với context của file
# Tab: accept autocomplete

# 3. Security check sau khi AI sinh code
npx semgrep --config=p/javascript-security .
# Check SQL injection, XSS, hardcoded secrets

# 4. Pre-commit hook bắt buộc
npx lint-staged
pytest tests/security/ -q

# 5. Đính kèm benchmark nội bộ
python scripts/bench_internal.py --model=claude-sonnet-4.7 \\
    --tasks=data/tasks/critical.jsonl \\
    --output=reports/bench_$(date +%F).json`}
              </CodeBlock>

              <p className="text-sm">
                Và đây là ví dụ thực tế một <em>prompt tốt</em> cho Claude
                Code — ngắn, rõ, có ràng buộc:
              </p>

              <CodeBlock
                language="markdown"
                title="prompt-template.md — mẫu prompt cho tác vụ coding"
              >
                {`# Tác vụ: Refactor module \`auth/\` để dùng bcrypt thay vì sha1

## Bối cảnh
- Codebase: Express 5, TypeScript 5.4, Prisma 5
- Test runner: vitest
- Policy: tất cả hash password phải dùng bcrypt cost 12

## Ràng buộc
- KHÔNG đổi public API của \`hashPassword()\` và \`verifyPassword()\`
- Viết migration script chuyển hash cũ (sha1) sang bcrypt lazily khi user login
- Thêm test cho: (1) new user, (2) legacy user login lần đầu, (3) legacy user đã migrate

## Định nghĩa xong việc
- Tất cả test cũ + test mới pass
- \`pnpm lint\` và \`pnpm typecheck\` sạch
- \`git diff --stat\` <= 250 dòng
- Commit message rõ ràng, tách thành 2 commit: "refactor: bcrypt" và "chore: lazy migration"`}
              </CodeBlock>

              <CollapsibleDetail title="Khi nào bạn KHÔNG nên dùng AI coding assistant?">
                <p className="text-sm">
                  Có vài tình huống mà dùng AI hại nhiều hơn lợi:
                </p>
                <ul className="list-disc list-inside text-sm space-y-1 pl-2 mt-2">
                  <li>
                    <strong>Code nhạy cảm về pháp lý/tài chính:</strong>{" "}
                    các function tính lãi, thuế, quy trình KYC. Một
                    off-by-one là rủi ro lớn, và AI dễ tạo code{" "}
                    <em>nhìn đúng nhưng sai nghiệp vụ</em>.
                  </li>
                  <li>
                    <strong>Học kiến thức mới:</strong> nếu bạn đang học
                    một ngôn ngữ/framework lần đầu, để AI viết thay sẽ
                    cản quá trình hình thành mô hình tinh thần (mental
                    model) — sau này debug sẽ rất vất vả.
                  </li>
                  <li>
                    <strong>Cryptography từ scratch:</strong> đừng. Luôn
                    dùng thư viện đã qua audit; AI dễ sinh primitives
                    không an toàn.
                  </li>
                  <li>
                    <strong>Hot-path performance critical:</strong>{" "}
                    benchmark trước, AI sinh sau. AI tối ưu theo
                    'plausible' chứ không theo profile thực.
                  </li>
                </ul>
              </CollapsibleDetail>

              <CollapsibleDetail title="Chọn trợ lý nào cho team của tôi? — quyết định theo context">
                <p className="text-sm">
                  Khung quyết định nhanh dựa trên{" "}
                  <strong>5 câu hỏi</strong>:
                </p>
                <ol className="list-decimal list-inside text-sm space-y-1 pl-2 mt-2">
                  <li>
                    <strong>Team bạn sống trong IDE nào?</strong> VS Code
                    + JetBrains dày đặc → Copilot hoặc Cursor dễ vào
                    nhất.
                  </li>
                  <li>
                    <strong>Có cần làm việc nhiều file cùng lúc?</strong>{" "}
                    Có → Claude Code, Cursor Agent. Không → Copilot đủ.
                  </li>
                  <li>
                    <strong>Repo lớn cỡ nào?</strong> &gt;500k dòng mà
                    context quan trọng → Gemini (1M+ window) có lợi thế.
                  </li>
                  <li>
                    <strong>Ngân sách token?</strong> Agentic tools tốn
                    gấp 3-10x autocomplete. Tính theo seat-month và đo
                    thực tế.
                  </li>
                  <li>
                    <strong>Yêu cầu tuân thủ?</strong> Enterprise
                    indemnification — xem TOS Business/Enterprise của
                    từng vendor. Đọc kỹ phần data retention.
                  </li>
                </ol>
                <p className="text-sm mt-3">
                  Kết luận thực dụng: phần lớn team trong 2025 chạy <em>hai
                  công cụ song song</em> — một autocomplete nhanh trong
                  editor (Copilot/Cursor Tab) và một agentic bên terminal
                  (Claude Code) cho tác vụ lớn.
                </p>
              </CollapsibleDetail>

              <p className="text-sm mt-4">
                Muốn đo lường agent bạn vừa xây? Xem topic tiếp theo:{" "}
                <TopicLink slug="agent-evaluation">
                  Đánh giá Agent
                </TopicLink>{" "}
                — 6 chiều bắt buộc.
              </p>
            </ExplanationSection>
          </LessonSection>

          {/* ───────────── 8. TÓM TẮT ───────────── */}
          <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Tóm tắt">
            <MiniSummary
              points={[
                "4 thế hệ: Autocomplete → Chat → Inline Edit → Agentic — từ gợi ý 1 dòng đến tự implement cả feature.",
                "Ba trợ lý tiêu biểu: Copilot (nhanh), Claude Code (agentic), Gemini Code (context 1M+). Không có cái tốt nhất — chỉ có phù hợp ngữ cảnh.",
                "Benchmarks hữu ích: HumanEval (hàm Python ngắn), SWE-bench (issue GitHub thật), MBPP (function synthesis). Đừng tin mù vào con số.",
                "Tăng năng suất 30-55% cho typical tasks. Nhưng review time tăng 20% và complex architecture vẫn cần người.",
                "LUÔN review AI code: security linting (Semgrep), unit tests, và hiểu logic trước merge. Vòng lặp tin cậy là cái bẫy lớn nhất.",
                "Developer chuyển từ 'viết code' sang 'thiết kế + review code' — AI là đồng nghiệp, không phải replacement.",
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
