"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
  MiniSummary,
  ToggleCompare,
  MatchPairs,
  LessonSection,
  TabView,
  TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "ai-coding-assistants",
  title: "AI Coding Assistants",
  titleVi: "Trợ lý lập trình AI — chuyện đang xảy ra trong ngành",
  description:
    "Copilot, Cursor, Claude Code là gì và vì sao văn phòng Việt nên quan tâm — kể cả khi bạn không viết một dòng code nào.",
  category: "emerging",
  tags: ["copilot", "cursor", "claude-code", "industry"],
  difficulty: "beginner",
  relatedSlugs: ["agentic-workflows", "prompt-engineering", "llm-overview"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

// ─────────────────────────────────────────────────────────────
// Dữ liệu tĩnh — các mốc thời gian, số liệu ngành, công cụ
// ─────────────────────────────────────────────────────────────

interface Milestone {
  year: string;
  title: string;
  detail: string;
  color: string;
}

const MILESTONES: Milestone[] = [
  {
    year: "2021",
    title: "GitHub Copilot ra mắt",
    detail:
      "Lần đầu tiên có một công cụ gợi ý code ngay trong lúc gõ — như Gboard cho lập trình viên.",
    color: "#22c55e",
  },
  {
    year: "2023",
    title: "Cursor xuất hiện",
    detail:
      "Một trình soạn thảo mới dựng trên VS Code, tích hợp AI ở mọi chỗ — không chỉ autocomplete.",
    color: "#a855f7",
  },
  {
    year: "2024",
    title: "Claude Code",
    detail:
      "Anthropic mở rộng: AI chạy thẳng trong terminal, tự đọc dự án, tự sửa nhiều file cùng lúc.",
    color: "#f97316",
  },
  {
    year: "2025",
    title: "Ngành bước vào kỷ nguyên agentic",
    detail:
      "Hơn 50% code mới tại các công ty lớn có bàn tay AI — lập trình viên chuyển sang vai trò thiết kế & kiểm duyệt.",
    color: "#0ea5e9",
  },
];

interface ShareRow {
  label: string;
  value: number;
  color: string;
}

const MARKET_SHARE: ShareRow[] = [
  { label: "GitHub Copilot", value: 42, color: "#22c55e" },
  { label: "Cursor", value: 23, color: "#a855f7" },
  { label: "Claude Code", value: 14, color: "#f97316" },
  { label: "Windsurf", value: 9, color: "#0ea5e9" },
  { label: "Khác", value: 12, color: "#64748b" },
];

interface StatCounter {
  label: string;
  target: number;
  suffix: string;
  tone: string;
}

const STATS: StatCounter[] = [
  {
    label: "Tốc độ hoàn thành task coding điển hình",
    target: 55,
    suffix: "% nhanh hơn",
    tone: "#22c55e",
  },
  {
    label: "Tỷ lệ lập trình viên chuyên nghiệp đã dùng AI",
    target: 76,
    suffix: "%",
    tone: "#0ea5e9",
  },
  {
    label: "Tỷ lệ code được AI gợi ý ở các công ty lớn",
    target: 46,
    suffix: "%",
    tone: "#a855f7",
  },
  {
    label: "Số developer hoạt động trên Copilot",
    target: 15,
    suffix: " triệu",
    tone: "#f97316",
  },
];

const SHOWCASE_AUTOCOMPLETE = [
  "def tinh_luong_thang(nhan_vien, ngay_cong, he_so):",
  "    // Hàm tính lương tháng cho một nhân viên",
  "    luong_co_ban = nhan_vien.luong_co_ban",
  "    ",
];

const SHOWCASE_GHOST =
  "    return luong_co_ban * (ngay_cong / 22) * he_so";

// ─────────────────────────────────────────────────────────────
// Animated counter (reusable, pure CSS-free tween)
// ─────────────────────────────────────────────────────────────

function AnimatedNumber({
  target,
  duration = 1400,
}: {
  target: number;
  duration?: number;
}) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return <>{value}</>;
}

// ─────────────────────────────────────────────────────────────
// Demo 1 — mô phỏng autocomplete trong IDE
// ─────────────────────────────────────────────────────────────

function IdeAutocompleteMock() {
  const [phase, setPhase] = useState<"typing" | "ghost" | "accepted">("typing");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("ghost"), 1200);
    const t2 = setTimeout(() => setPhase("accepted"), 3000);
    const t3 = setTimeout(() => setPhase("typing"), 5500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [phase]);

  return (
    <div className="rounded-xl overflow-hidden border border-border bg-[#0b1021] shadow-inner">
      {/* thanh title giả IDE */}
      <div className="flex items-center gap-2 px-4 py-2 bg-[#141a32] border-b border-border">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
        <span className="ml-3 text-[11px] font-mono text-slate-400">
          luong.py — kenhketoan
        </span>
        <span className="ml-auto text-[10px] font-mono text-green-400">
          ● Copilot đang theo dõi
        </span>
      </div>

      {/* code area */}
      <div className="px-4 py-3 font-mono text-[12px] leading-relaxed">
        {SHOWCASE_AUTOCOMPLETE.map((line, i) => (
          <div key={i} className="flex gap-3">
            <span className="text-slate-600 w-4 text-right select-none">
              {i + 1}
            </span>
            <span className="text-slate-200 whitespace-pre">{line || " "}</span>
          </div>
        ))}
        <div className="flex gap-3">
          <span className="text-slate-600 w-4 text-right select-none">
            {SHOWCASE_AUTOCOMPLETE.length + 1}
          </span>
          <AnimatePresence mode="wait">
            {phase === "typing" && (
              <motion.span
                key="caret"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="text-accent"
              >
                ▎
              </motion.span>
            )}
            {phase === "ghost" && (
              <motion.span
                key="ghost"
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 0.55, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-slate-400 italic whitespace-pre"
              >
                {SHOWCASE_GHOST}
                <span className="ml-2 text-[10px] not-italic text-accent">
                  ⇥ Tab để chấp nhận
                </span>
              </motion.span>
            )}
            {phase === "accepted" && (
              <motion.span
                key="accepted"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-emerald-300 whitespace-pre"
              >
                {SHOWCASE_GHOST}
                <span className="ml-2 text-[10px] text-emerald-400">
                  ✓ đã nhận
                </span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center justify-between bg-[#141a32] px-4 py-2 border-t border-border text-[10px] font-mono text-slate-400">
        <span>
          Gợi ý xuất hiện dạng chữ xám — lập trình viên nhấn Tab để đồng ý
        </span>
        <span>3 giây</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Demo 2 — so sánh viết tay vs viết với AI (animated bars)
// ─────────────────────────────────────────────────────────────

function TimeComparison() {
  return (
    <div className="space-y-4">
      <ToggleCompare
        labelA="Viết code tay — 2 giờ"
        labelB="Viết với AI — 30 phút"
        description="Cùng một tính năng 'form đăng nhập + gửi email xác minh'. Đây là kết quả trung bình báo cáo năm 2024 trên tác vụ vừa."
        childA={
          <div className="space-y-3">
            <Bar label="Tra cứu tài liệu" minutes={35} total={120} color="#64748b" />
            <Bar label="Gõ code chính" minutes={50} total={120} color="#64748b" />
            <Bar label="Sửa lỗi" minutes={25} total={120} color="#64748b" />
            <Bar label="Viết kiểm thử" minutes={10} total={120} color="#64748b" />
            <p className="text-xs text-muted mt-2">
              Tổng: <strong>120 phút</strong> — rất nhiều thời gian chỉ để tra
              cú pháp và tìm ví dụ.
            </p>
          </div>
        }
        childB={
          <div className="space-y-3">
            <Bar label="Mô tả yêu cầu bằng tiếng Việt" minutes={3} total={30} color="#22c55e" />
            <Bar label="AI viết nháp" minutes={5} total={30} color="#22c55e" />
            <Bar label="Lập trình viên đọc & chỉnh" minutes={15} total={30} color="#22c55e" />
            <Bar label="Chạy kiểm thử AI đề xuất" minutes={7} total={30} color="#22c55e" />
            <p className="text-xs text-muted mt-2">
              Tổng: <strong>30 phút</strong> — vai trò người đổi từ "tay gõ"
              sang "người duyệt".
            </p>
          </div>
        }
      />
    </div>
  );
}

function Bar({
  label,
  minutes,
  total,
  color,
}: {
  label: string;
  minutes: number;
  total: number;
  color: string;
}) {
  const pct = (minutes / total) * 100;
  return (
    <div>
      <div className="flex justify-between text-xs text-foreground/90 mb-1">
        <span>{label}</span>
        <span className="font-mono text-muted">{minutes}ph</span>
      </div>
      <div className="h-2.5 rounded-full bg-surface overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Demo — Cursor chat sidebar mock
// ─────────────────────────────────────────────────────────────

function CursorSidebarMock() {
  return (
    <div className="grid md:grid-cols-[1fr_260px] rounded-xl overflow-hidden border border-border bg-[#0b1021]">
      {/* editor mờ bên trái */}
      <div className="p-4 font-mono text-[11px] leading-relaxed text-slate-500 bg-[#0b1021] relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0b1021]/70 pointer-events-none" />
        {[
          "// dashboard.tsx",
          "export default function Dashboard() {",
          "  const [items, setItems] = useState([]);",
          "  useEffect(() => {",
          "    fetch('/api/kpi').then(r => r.json()).then(setItems);",
          "  }, []);",
          "  return <KpiGrid items={items} />;",
          "}",
        ].map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>

      {/* sidebar chat phải */}
      <div className="bg-[#11162b] border-l border-border p-3 space-y-2 text-[12px]">
        <div className="text-[10px] uppercase tracking-wide text-purple-400 font-bold">
          Cursor Chat
        </div>
        <div className="rounded-lg bg-[#1b2140] px-3 py-2 text-slate-200">
          Thêm nút "Xuất Excel" vào bảng KPI, dùng lib xlsx.
        </div>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-lg bg-purple-900/30 border border-purple-700 px-3 py-2 text-slate-100"
        >
          Mình sẽ: (1) thêm nút toolbar, (2) import xlsx, (3) viết hàm
          <code className="mx-1 text-purple-300">exportToXlsx()</code>,
          (4) nối vào onClick.
          <div className="mt-1 text-[10px] text-purple-300">
            Sẽ sửa 2 file — nhấn Apply để đồng ý
          </div>
        </motion.div>
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            className="flex-1 text-[11px] rounded-md bg-purple-600 text-white py-1.5 font-medium"
          >
            Apply
          </button>
          <button
            type="button"
            className="flex-1 text-[11px] rounded-md bg-[#1b2140] text-slate-300 py-1.5"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Demo — Claude Code terminal mock
// ─────────────────────────────────────────────────────────────

function ClaudeTerminalMock() {
  const [lineIdx, setLineIdx] = useState(0);
  const LINES = [
    { who: "user", text: "> Claude, đọc repo này và thêm phần đặt lịch hẹn." },
    { who: "ai", text: "Đang đọc 47 file… thấy Next.js + Prisma. Sẽ:" },
    { who: "ai", text: "  1. Tạo bảng appointments (Prisma schema)" },
    { who: "ai", text: "  2. Viết API /api/appointments" },
    { who: "ai", text: "  3. Thêm form /book và lịch /admin" },
    { who: "ai", text: "  4. Chạy thử: pnpm test (24/24 PASS ✓)" },
    { who: "ai", text: "Đã commit: 'feat(booking): lịch hẹn cơ bản'" },
  ];

  useEffect(() => {
    if (lineIdx >= LINES.length) return;
    const t = setTimeout(() => setLineIdx((i) => i + 1), 900);
    return () => clearTimeout(t);
  }, [lineIdx, LINES.length]);

  return (
    <div className="rounded-xl overflow-hidden border border-border bg-black font-mono text-[12px]">
      <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border-b border-neutral-800">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
        <span className="ml-3 text-[11px] text-neutral-400">
          Terminal — claude code
        </span>
      </div>
      <div className="p-4 space-y-1 min-h-[200px]">
        {LINES.slice(0, lineIdx).map((l, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            className={
              l.who === "user"
                ? "text-emerald-400"
                : "text-orange-300 whitespace-pre"
            }
          >
            {l.text}
          </motion.div>
        ))}
        {lineIdx < LINES.length && (
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-orange-300"
          >
            ▎
          </motion.span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Demo — market share bar chart (animated)
// ─────────────────────────────────────────────────────────────

function MarketShareBar() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-semibold mb-1">
        Ước tính thị phần công cụ AI coding (2025)
      </p>
      <p className="text-[11px] text-muted mb-3">
        Dựa trên khảo sát developer công khai — làm tròn để dễ nhìn.
      </p>
      <div className="space-y-2">
        {MARKET_SHARE.map((r, i) => (
          <div key={r.label}>
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-foreground">{r.label}</span>
              <span className="font-mono text-muted">{r.value}%</span>
            </div>
            <div className="h-3 rounded-full bg-surface overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${r.value * 2}%` }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                className="h-full rounded-full"
                style={{ background: r.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Demo — timeline vertical
// ─────────────────────────────────────────────────────────────

function TimelineVertical() {
  return (
    <div className="relative pl-5">
      <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
      {MILESTONES.map((m, i) => (
        <motion.div
          key={m.year}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="relative mb-5 last:mb-0"
        >
          <span
            className="absolute -left-[10px] top-1 h-3 w-3 rounded-full ring-4 ring-background"
            style={{ background: m.color }}
          />
          <div
            className="ml-3 rounded-lg border border-border bg-card p-3"
            style={{ borderLeft: `3px solid ${m.color}` }}
          >
            <p className="text-xs font-bold" style={{ color: m.color }}>
              {m.year}
            </p>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              {m.title}
            </p>
            <p className="text-xs text-muted leading-relaxed mt-1">
              {m.detail}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Animated stat counter panel
// ─────────────────────────────────────────────────────────────

function StatsPanel() {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {STATS.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="rounded-xl border border-border bg-card p-4"
          style={{ borderTop: `3px solid ${s.tone}` }}
        >
          <p
            className="text-3xl font-extrabold tabular-nums"
            style={{ color: s.tone }}
          >
            <AnimatedNumber target={s.target} />
            <span className="text-sm font-medium ml-1">{s.suffix}</span>
          </p>
          <p className="text-xs text-muted mt-1 leading-snug">{s.label}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Quiz
// ─────────────────────────────────────────────────────────────

const QUIZ: QuizQuestion[] = [
  {
    question:
      "Ba cái tên mà bạn đọc nhiều nhất trên báo công nghệ 2024-2025 là gì?",
    options: [
      "GitHub Copilot, Cursor, Claude Code",
      "Photoshop, Excel, Word",
      "TikTok, Facebook, Zalo",
    ],
    correct: 0,
    explanation:
      "Copilot (ra mắt 2021) — Cursor (2023) — Claude Code (2024). Đây là bộ ba được nhắc nhiều nhất trong ngành AI coding, đại diện cho ba thế hệ: gợi ý trong lúc gõ, trình soạn thảo có AI khắp nơi, AI tự đọc cả dự án.",
  },
  {
    question:
      "Một công ty gia công phần mềm Việt Nam nên phản ứng thế nào trước xu hướng AI coding?",
    options: [
      "Cấm nhân viên dùng AI để giữ job",
      "Đào tạo nhân viên biết điều khiển AI + tập trung vào thiết kế và review — công việc mới chất lượng cao hơn công việc gõ code đơn thuần",
      "Chuyển hẳn sang làm nông",
    ],
    correct: 1,
    explanation:
      "AI không xoá ngành lập trình mà đổi hình dáng nó. Vai trò 'thợ gõ code' giảm giá trị, vai trò 'người thiết kế + duyệt' tăng. Công ty thông minh dịch chuyển nhân sự sang nấc thang cao hơn thay vì chống lại làn sóng.",
  },
  {
    question:
      "Tại sao ngay cả khi bạn không viết code, bạn vẫn nên biết về Copilot / Cursor / Claude Code?",
    options: [
      "Để khoe với bạn bè",
      "Vì những công cụ này đang định hình lại nền kinh tế số — sản phẩm bạn dùng, dịch vụ bạn mua, công ty bạn làm đều chịu ảnh hưởng",
      "Không cần biết làm gì",
    ],
    correct: 1,
    explanation:
      "Phần mềm được làm nhanh hơn 2-5 lần nghĩa là sản phẩm mới ra thị trường nhanh hơn, cạnh tranh khốc liệt hơn, kỹ năng cần có trong nghề nào cũng đổi. Hiểu xu hướng giúp bạn đưa ra quyết định tốt hơn — học, đầu tư, hay tuyển người.",
  },
  {
    question:
      "Rủi ro chính khi doanh nghiệp dùng AI coding mà không chuẩn bị gì là?",
    options: [
      "Máy tính nóng",
      "Code được sinh ra nhanh nhưng có thể có lỗ hổng bảo mật, hoặc dùng thư viện không tồn tại — nếu không có quy trình kiểm tra thì sự cố sẽ tới",
      "Nhân viên trở nên vui hơn",
    ],
    correct: 1,
    explanation:
      "AI có thể 'ảo giác' (hallucinate) — sinh ra đoạn code nhìn có lý nhưng gọi thư viện không có thật, hoặc chứa lỗ hổng. Doanh nghiệp cần quy trình review, quét bảo mật, và đào tạo người duyệt thì mới hưởng lợi bền.",
  },
  {
    type: "fill-blank",
    question:
      "Ba công cụ tiêu biểu của thế hệ AI coding 2021–2024 là {blank}, {blank} và {blank}.",
    blanks: [
      { answer: "Copilot", accept: ["GitHub Copilot", "github copilot", "copilot"] },
      { answer: "Cursor", accept: ["cursor"] },
      { answer: "Claude Code", accept: ["claude code", "claude-code", "Claude"] },
    ],
    explanation:
      "Copilot mở màn (2021, autocomplete), Cursor đổi trình soạn thảo (2023, chat + edit), Claude Code bước sang agentic (2024, tự đọc và sửa cả repo).",
  },
];

// ─────────────────────────────────────────────────────────────
// Component chính
// ─────────────────────────────────────────────────────────────

export default function AICodingAssistantsTopic() {
  const matchPairs = useMemo(
    () => [
      {
        left: "GitHub Copilot",
        right: "Gợi ý từng dòng code ngay khi lập trình viên gõ",
      },
      {
        left: "Cursor",
        right: "Trình soạn thảo có chat AI ở bên phải, sửa nhiều file theo yêu cầu",
      },
      {
        left: "Claude Code",
        right: "Chạy trong Terminal, tự đọc cả dự án rồi tự commit",
      },
      {
        left: "Windsurf",
        right: "Đối thủ mới của Cursor, nhấn mạnh chế độ 'agent tự lái'",
      },
      {
        left: "Replit Ghostwriter",
        right: "AI gắn vào trình soạn thảo trên trình duyệt Replit",
      },
    ],
    [],
  );

  return (
    <>
      {/* ───────── 1. DỰ ĐOÁN ───────── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Theo bạn, bao nhiêu phần trăm công việc lập trình hiện nay được AI hỗ trợ?"
          options={["Khoảng 10%", "Khoảng 30%", "Khoảng 60%", "Khoảng 90%"]}
          correct={2}
          explanation="Các khảo sát lớn năm 2024-2025 (GitHub, Stack Overflow, JetBrains) đều cho con số trong khoảng 60-76% lập trình viên chuyên nghiệp đang dùng AI hằng ngày. Tại các công ty lớn, khoảng 40-50% số dòng code mới có bàn tay AI. Con số tăng rất nhanh — chỉ 3 năm trước tỷ lệ này gần bằng 0."
        >
          <p className="mt-2 text-sm text-muted">
            Bài hôm nay không dạy bạn viết code. Bài này giải thích{" "}
            <strong>điều gì đang xảy ra</strong> trong ngành AI coding — để
            bạn, một người làm văn phòng, hiểu tại sao công cụ này lại lên tất
            cả mặt báo, và tại sao nó ảnh hưởng tới cả những ngành không liên
            quan gì đến lập trình.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ───────── 2. ẨN DỤ ───────── */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Ẩn dụ quen thuộc">
        <p>
          Hãy tưởng tượng một lập trình viên đang gõ code — như một{" "}
          <strong>nhân viên kế toán</strong> đang cộng sổ. Trước đây, kế toán
          cộng tay, cộng máy tính bỏ túi, sau đó là Excel. Mỗi bước là một cú
          nhảy lớn: Excel không thay thế kế toán, mà biến công việc lặt vặt
          thành công việc phân tích.
        </p>
        <p>
          AI coding assistants đang làm điều tương tự với lập trình. Một "Excel
          cho lập trình viên" — nhưng còn mạnh hơn Excel nhiều. Nó không chỉ
          tính: nó <strong>gợi ý cả đoạn code</strong>, tự đọc toàn bộ dự án,
          rồi tự viết, tự sửa, tự kiểm thử.
        </p>
        <Callout variant="insight" title="Vì sao bạn — không phải lập trình viên — cũng cần biết?">
          Mỗi app bạn dùng (ngân hàng, Grab, Shopee, Zalo) đều được viết bởi
          một đội ngũ. Khi đội đó nhanh hơn 2-5 lần, sản phẩm ra thị trường
          nhanh hơn, cạnh tranh khốc liệt hơn, và kỹ năng cần có trong{" "}
          <em>mọi nghề</em> cũng đổi.
        </Callout>
      </LessonSection>

      {/* ───────── 3. TRỰC QUAN HOÁ ───────── */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Nhìn tận mắt">
        <VisualizationSection>
          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">
                Demo 1 — Copilot đang làm gì trên màn hình lập trình viên?
              </p>
              <p className="text-xs text-muted mb-3">
                Khi lập trình viên gõ tên hàm, Copilot đề xuất phần còn lại
                dưới dạng chữ xám mờ. Nhấn Tab là chấp nhận.
              </p>
              <IdeAutocompleteMock />
            </div>

            <LessonSection label="Demo 1b — Cursor: chat AI ngay trong trình soạn thảo">
              <p className="text-xs text-muted mb-3">
                Cursor không chỉ gợi ý — nó có một cửa sổ chat bên phải. Bạn
                mô tả yêu cầu bằng tiếng Việt, Cursor đề xuất bản thay đổi
                cho nhiều file.
              </p>
              <CursorSidebarMock />
            </LessonSection>

            <LessonSection label="Demo 1c — Claude Code: AI trong Terminal">
              <p className="text-xs text-muted mb-3">
                Claude Code sống trong terminal (cửa sổ đen). Bạn bảo nó đọc
                repo, nó đọc rồi tự sửa nhiều file, chạy thử, rồi commit.
                Đây là thế hệ "agentic" — AI tự chủ.
              </p>
              <ClaudeTerminalMock />
            </LessonSection>

            <LessonSection label="Demo 2 — Thời gian làm một tính năng: trước vs sau">
              <TimeComparison />
            </LessonSection>

            <LessonSection label="Demo 3 — Ghép công cụ với thế mạnh">
              <p className="text-xs text-muted mb-3">
                Kéo tên công cụ bên trái, ghép với mô tả bên phải. Mỗi tên
                lớn đều có một triết lý thiết kế riêng.
              </p>
              <MatchPairs
                pairs={matchPairs}
                instruction="Nhấn vào một ô bên trái, rồi nhấn ô tương ứng bên phải."
              />
            </LessonSection>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ───────── 4. AHA ───────── */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          <p>
            Trong 4 năm, AI đã đi từ{" "}
            <strong>"gợi ý một dòng code"</strong> sang{" "}
            <strong>"tự đọc cả dự án và tự commit"</strong>. Khi gần một nửa
            số dòng code mới có bàn tay AI, điều thay đổi không phải là công
            việc lập trình biến mất — mà là{" "}
            <strong>hình dáng của nó đổi</strong>: bớt gõ, thêm thiết kế, thêm
            duyệt, thêm mô tả yêu cầu bằng ngôn ngữ tự nhiên. Kỹ năng đáng
            học sắp tới không còn là "biết ngôn ngữ X" mà là "biết ra đầu bài
            rõ ràng cho AI".
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ───────── 5. THỬ THÁCH NHỎ ───────── */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question="Bạn là giám đốc một công ty gia công phần mềm ở TP.HCM có 200 nhân viên. Đối tác nước ngoài bắt đầu đòi giảm giá 30% vì họ 'có thể dùng Claude Code để làm một phần'. Phản ứng tốt nhất?"
          options={[
            "Hạ giá 30% để giữ khách — ai cũng phải chịu",
            "Đào tạo đội nhanh dùng AI, chuyển sang báo giá theo kết quả thay vì theo giờ, tập trung vào phần thiết kế-kiến trúc-an toàn mà AI còn yếu",
            "Đóng công ty và chuyển sang kinh doanh cà phê",
          ]}
          correct={1}
          explanation="Giá trị chuyển từ 'giờ gõ code' sang 'tư vấn thiết kế, đảm bảo an toàn, tích hợp hệ thống phức tạp'. Công ty nào nhanh trí dịch chuyển trước — đào tạo đội, đổi cách báo giá, tập trung vào phần AI chưa làm tốt — sẽ thắng. Đây là câu chuyện mọi ngành gia công phần mềm Việt đang đối mặt."
        />
      </LessonSection>

      {/* ───────── 6. GIẢI THÍCH SÂU (visual-heavy) ───────── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Bối cảnh đầy đủ">
        <ExplanationSection>
          <p className="text-sm">
            Ba góc nhìn giúp bạn nắm bối cảnh: (1) <strong>lịch sử ngành</strong>,
            (2) <strong>thị phần hiện tại</strong>, (3){" "}
            <strong>con số ảnh hưởng</strong>. Xem lần lượt qua các tab dưới đây.
          </p>

          <TabView
            tabs={[
              {
                label: "Dòng thời gian",
                content: <TimelineVertical />,
              },
              {
                label: "Thị phần",
                content: (
                  <div className="space-y-3">
                    <MarketShareBar />
                    <p className="text-xs text-muted leading-relaxed">
                      Copilot vẫn dẫn đầu nhờ tích hợp với GitHub. Cursor lớn
                      nhanh bằng cách làm hẳn một trình soạn thảo. Claude Code
                      chiếm thị phần đội ngũ agentic mới.
                    </p>
                  </div>
                ),
              },
              {
                label: "Con số ảnh hưởng",
                content: (
                  <div className="space-y-3">
                    <StatsPanel />
                    <p className="text-xs text-muted leading-relaxed">
                      Các con số thay đổi từng quý. Điều quan trọng không phải
                      con số chính xác mà là <strong>hướng dịch chuyển</strong>{" "}
                      — tất cả đều đi lên, nhanh.
                    </p>
                  </div>
                ),
              },
            ]}
          />

          <Callout variant="warning" title="Hai cạm bẫy bạn nên biết">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <strong>Ảo giác API:</strong> AI đôi khi tự bịa ra tên thư viện
                không tồn tại. Nếu bạn hay ai đó trong công ty sao chép bừa,
                hệ thống sập thầm lặng.
              </li>
              <li>
                <strong>Lỗ hổng bảo mật:</strong> AI có thể sinh code lưu mật
                khẩu dạng không mã hoá, hoặc có lỗ hổng SQL — nhìn "có vẻ
                đúng" nhưng thực ra nguy hiểm. Cần có người biết duyệt.
              </li>
            </ul>
          </Callout>

          <Callout variant="tip" title="Quan sát rút ra">
            <p className="text-sm">
              AI coding không khiến lập trình viên biến mất — nó tách đôi nghề
              này thành <strong>hai lớp</strong>: lớp "thợ gõ" giá trị giảm,
              lớp "người thiết kế & duyệt" giá trị tăng. Cùng kỹ năng, khác
              định vị. Với người làm văn phòng, bài học chung là:{" "}
              <em>học cách mô tả yêu cầu rõ ràng</em> — kỹ năng này quan
              trọng hơn bao giờ hết.
            </p>
          </Callout>

          <p className="text-sm">
            Muốn hiểu phần AI tự chạy nhiều bước thay bạn — không chỉ trong
            code mà trong công việc văn phòng — xem tiếp{" "}
            <TopicLink slug="agentic-workflows">
              Quy trình AI tự chủ
            </TopicLink>
            .
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ───────── 7. TÓM TẮT ───────── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ"
          points={[
            "Ba tên lớn: GitHub Copilot (2021, gợi ý từng dòng), Cursor (2023, chat trong trình soạn thảo), Claude Code (2024, AI trong terminal đọc cả dự án).",
            "Xu hướng: từ 'gợi ý một dòng' (2021) sang 'AI tự đọc repo và commit' (2025). Gần một nửa code mới ở công ty lớn có bàn tay AI.",
            "Tác động tới ngành gia công Việt: nghề không mất mà đổi hình dáng — thợ gõ giảm giá trị, người thiết kế và duyệt tăng giá trị.",
            "Rủi ro quen thuộc: AI bịa tên thư viện, sinh code có lỗ hổng bảo mật. Doanh nghiệp cần quy trình review và quét bảo mật.",
            "Bài học cho người không code: kỹ năng 'mô tả yêu cầu rõ ràng bằng tiếng Việt' trở nên rất có giá — nó áp dụng cho mọi công cụ AI, không chỉ AI coding.",
          ]}
        />
      </LessonSection>

      {/* ───────── 8. QUIZ ───────── */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
