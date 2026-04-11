"use client";

import { useState, useMemo } from "react";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "ai-coding-assistants",
  title: "AI Coding Assistants",
  titleVi: "Tro ly lap trinh AI",
  description:
    "Cac cong cu AI ho tro viet code, debug va review — tu autocomplete den agentic coding",
  category: "emerging",
  tags: ["copilot", "code-generation", "developer-tools"],
  difficulty: "beginner",
  relatedSlugs: ["llm-overview", "function-calling", "agentic-workflows"],
  vizType: "interactive",
};

const LEVELS = [
  { name: "Autocomplete", year: "2021", tools: "GitHub Copilot, TabNine", capability: 30, desc: "Goi y hoan thanh dong code hien tai" },
  { name: "Chat-based", year: "2023", tools: "ChatGPT, Claude", capability: 55, desc: "Hoi-dap, giai thich, sinh code block" },
  { name: "Inline Edit", year: "2024", tools: "Cursor, Copilot Edit", capability: 70, desc: "Sua code truc tiep trong editor theo prompt" },
  { name: "Agentic", year: "2025", tools: "Claude Code, Devin, Cursor Agent", capability: 90, desc: "Tu dong: doc codebase, plan, implement, test, commit" },
];

const TOTAL_STEPS = 7;

export default function AICodingAssistantsTopic() {
  const [activeLevel, setActiveLevel] = useState(3);
  const level = LEVELS[activeLevel];

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Agentic coding assistant khac chat-based assistant the nao?",
      options: [
        "Dung model lon hon",
        "TU DONG thuc hien nhieu buoc: doc codebase → plan → code → test → fix → commit. Khong can copy-paste",
        "Chi ho tro 1 ngon ngu",
      ],
      correct: 1,
      explanation: "Chat-based: ban hoi, AI tra loi code, ban copy-paste vao editor. Agentic: ban mo ta yeu cau, AI tu doc codebase hieu context, plan changes, implement across files, chay tests, fix errors, tao commit. Tu 'tro ly tra loi' sang 'dong nghiep tu lam'.",
    },
    {
      question: "AI coding assistant lam developer mat viec khong?",
      options: [
        "Co — AI se viet code thay nguoi hoan toan",
        "Khong — AI tang nang suat 2-5x nhung van can developer thiet ke, review, va giai quyet bai toan phuc tap",
        "Chi anh huong junior developers",
      ],
      correct: 1,
      explanation: "AI viet code nhanh nhung van can nguoi: hieu business requirements, thiet ke system architecture, review code quality, xu ly edge cases, debug logic phuc tap. Developer + AI = 2-5x nang suat. Giong may tinh khong thay the ke toan — no lam ke toan manh hon.",
    },
    {
      question: "Rui ro lon nhat khi dung AI coding assistant la gi?",
      options: [
        "Code chay cham hon",
        "Security vulnerabilities: AI co the sinh code co lo hong (SQL injection, hardcoded secrets) ma developer khong nhan ra neu khong review ky",
        "AI hoc code cua ban va ban cho nguoi khac",
      ],
      correct: 1,
      explanation: "AI sinh code nhanh nhung KHONG dam bao secure. Nghien cuu chi ra: AI-generated code co ty le vulnerabilities tuong duong human code, nhung developers tin tuong AI nen IT REVIEW hon. Can: security linting, code review, va hieu ro code truoc khi merge.",
    },
  ], []);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Du doan">
        <PredictionGate
          question="Ban can implement tinh nang authentication cho app Next.js. Cach nao nhanh nhat?"
          options={[
            "Doc documentation va viet tu dau — mat 2-3 ngay",
            "Dung AI coding assistant: mo ta yeu cau, AI doc codebase, plan, implement across files, chay tests — mat 2-3 gio",
            "Copy code tu Stack Overflow",
          ]}
          correct={1}
          explanation="AI coding assistants giam thoi gian 5-10x cho nhieu tasks. Tu doc docs, hieu codebase context, implement multi-file changes, fix errors. Nhung van can developer: review code, hieu logic, va dam bao chat luong. AI la 'pair programmer sieu nhanh'."
        >

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Kham pha">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Xem <strong className="text-foreground">4 the he</strong>{" "}
          AI coding assistants — tu autocomplete den agentic.
        </p>
        <VisualizationSection>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {LEVELS.map((l, i) => (
                <button key={i} onClick={() => setActiveLevel(i)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${activeLevel === i ? "bg-accent text-white" : "bg-card border border-border text-muted hover:text-foreground"}`}
                >{l.name} ({l.year})</button>
              ))}
            </div>
            <svg viewBox="0 0 600 150" className="w-full max-w-2xl mx-auto">
              {LEVELS.map((l, i) => {
                const y = 10 + i * 33;
                const isActive = i === activeLevel;
                return (
                  <g key={i}>
                    <text x={15} y={y + 16} fill={isActive ? "#e2e8f0" : "#64748b"} fontSize={8} fontWeight={isActive ? "bold" : "normal"}>
                      {l.name}
                    </text>
                    <rect x={110} y={y} width={380} height={24} rx={3} fill="#1e293b" />
                    <rect x={110} y={y} width={380 * l.capability / 100} height={24} rx={3}
                      fill={isActive ? "#22c55e" : "#475569"} opacity={isActive ? 1 : 0.3}
                    />
                    <text x={115 + 380 * l.capability / 100} y={y + 16} fill="white" fontSize={9} fontWeight="bold">
                      {l.capability}%
                    </text>
                    <text x={520} y={y + 16} fill="#94a3b8" fontSize={7}>{l.year}</text>
                  </g>
                );
              })}
            </svg>
            <div className="rounded-lg border border-border bg-card p-3 text-center">
              <p className="text-sm font-semibold">{level.name} ({level.year})</p>
              <p className="text-xs text-muted mt-1">{level.desc}</p>
              <p className="text-xs text-muted">{level.tools}</p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoanh khac Aha">
        <AhaMoment>
          <p>
            Tu <strong>goi y 1 dong</strong>{" "}(2021) den <strong>tu implement ca feature</strong>{" "}(2025)
            chi trong 4 nam! Agentic assistants giong <strong>dong nghiep junior rat nhanh</strong>{" "}
            — doc codebase, plan, implement, test, commit. Developer chuyen tu &quot;viet code&quot;
            sang <strong>&quot;thiet ke va review code&quot;</strong>.
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thu thach">
        <InlineChallenge
          question="AI sinh code nhanh nhung ban phat hien: code co SQL injection vulnerability. AI khong canh bao. Ban nen lam gi?"
          options={[
            "Trust AI — no thong minh hon minh",
            "LUON review AI-generated code, dung security linting (Semgrep, CodeQL), va hieu ro code truoc khi merge",
            "Bo AI va viet code thu cong",
          ]}
          correct={1}
          explanation="AI sinh code nhanh nhung KHONG dam bao an toan. Developer phai: (1) review moi line AI sinh, (2) chay security linting tu dong, (3) hieu ro logic truoc khi merge. AI la tool, khong phai replacement cho judgment. Trust but verify!"
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Ly thuyet">
        <ExplanationSection>
          <p>
            <strong>AI Coding Assistants</strong>{" "}
            la cong cu AI ho tro developer viet code — tu autocomplete den agentic coding tu dong.
          </p>
          <p><strong>4 the he:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Gen 1 - Autocomplete (2021):</strong>{" "}Goi y hoan thanh code. Copilot, TabNine</li>
            <li><strong>Gen 2 - Chat (2023):</strong>{" "}Hoi-dap, sinh code block, giai thich. ChatGPT, Claude</li>
            <li><strong>Gen 3 - Inline Edit (2024):</strong>{" "}Sua code truc tiep trong editor. Cursor, Copilot Edit</li>
            <li><strong>Gen 4 - Agentic (2025):</strong>{" "}Tu dong multi-step: plan → code → test → fix. Claude Code, Devin</li>
          </ul>

          <Callout variant="tip" title="Nang suat thuc te">
            Nghien cuu GitHub (2024): Copilot tang toc 55% cho coding tasks. Nhung: (1) chi cho well-defined tasks, (2) review time tang 20%, (3) complex architecture tasks — AI it giup. Net productivity gain: 30-40% cho typical dev work.
          </Callout>

          <p><strong>Best practices:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Review moi dong:</strong>{" "}AI sinh code nhanh nhung co the co bugs, security issues</li>
            <li><strong>Context la vua:</strong>{" "}Cang nhieu context (codebase, docs, tests) → AI cang chinh xac</li>
            <li><strong>Iterative:</strong>{" "}Sinh → review → refine → test. Khong expect perfect code tu lan dau</li>
            <li><strong>Security first:</strong>{" "}Chay Semgrep/CodeQL tren AI-generated code truoc khi merge</li>
          </ul>

          <CodeBlock language="bash" title="AI coding workflow thuc te">
{`# 1. Claude Code: agentic coding trong terminal
# Mo ta yeu cau bang tieng Viet
claude "Them authentication middleware cho Express app,
       dung JWT, luu refresh token trong Redis,
       viet unit tests voi Jest"

# Claude Code se:
# - Doc codebase hieu structure
# - Plan: middleware file, redis config, tests
# - Implement across 4-5 files
# - Chay tests, fix errors
# - Tao commit voi message ro rang

# 2. Cursor: AI-powered editor
# Cmd+K: inline edit
# Cmd+L: chat voi context cua file
# Tab: accept autocomplete

# 3. Security check sau khi AI sinh code
npx semgrep --config=p/javascript-security .
# Check SQL injection, XSS, hardcoded secrets`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tom tat">
        <MiniSummary points={[
          "4 the he: Autocomplete → Chat → Inline Edit → Agentic. Tu 'goi y 1 dong' den 'tu implement ca feature'.",
          "Agentic assistants (Claude Code, Devin): doc codebase, plan, implement, test, fix, commit tu dong.",
          "Tang nang suat 30-55% cho typical tasks. Complex architecture va design van can developer.",
          "LUON review AI code: security linting (Semgrep), unit tests, va hieu logic truoc merge.",
          "Developer chuyen tu 'viet code' sang 'thiet ke + review code' — AI la dong nghiep, khong phai replacement.",
        ]} />
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiem tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>

        </PredictionGate>
      </LessonSection>
    </>
  );
}
