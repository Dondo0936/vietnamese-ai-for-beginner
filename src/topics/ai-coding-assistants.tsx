"use client";

import { useState, useMemo } from "react";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX, TopicLink,
} from "@/components/interactive";
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

const LEVELS = [
  { name: "Autocomplete", year: "2021", tools: "GitHub Copilot, TabNine", capability: 30, desc: "Gợi ý hoàn thành dòng code hiện tại" },
  { name: "Chat-based", year: "2023", tools: "ChatGPT, Claude", capability: 55, desc: "Hỏi-đáp, giải thích, sinh code block" },
  { name: "Inline Edit", year: "2024", tools: "Cursor, Copilot Edit", capability: 70, desc: "Sửa code trực tiếp trong editor theo prompt" },
  { name: "Agentic", year: "2025", tools: "Claude Code, Devin, Cursor Agent", capability: 90, desc: "Tự động: đọc codebase, plan, implement, test, commit" },
];

const TOTAL_STEPS = 7;

export default function AICodingAssistantsTopic() {
  const [activeLevel, setActiveLevel] = useState(3);
  const level = LEVELS[activeLevel];

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Agentic coding assistant khác chat-based assistant thế nào?",
      options: [
        "Dùng model lớn hơn",
        "TỰ ĐỘNG thực hiện nhiều bước: đọc codebase → plan → code → test → fix → commit. Không cần copy-paste",
        "Chỉ hỗ trợ 1 ngôn ngữ",
      ],
      correct: 1,
      explanation: "Chat-based: bạn hỏi, AI trả lời code, bạn copy-paste vào editor. Agentic: bạn mô tả yêu cầu, AI tự đọc codebase hiểu context, plan changes, implement across files, chạy tests, fix errors, tạo commit. Từ 'trợ lý trả lời' sang 'đồng nghiệp tự làm'.",
    },
    {
      question: "AI coding assistant làm developer mất việc không?",
      options: [
        "Có — AI sẽ viết code thay người hoàn toàn",
        "Không — AI tăng năng suất 2-5x nhưng vẫn cần developer thiết kế, review, và giải quyết bài toán phức tạp",
        "Chỉ ảnh hưởng junior developers",
      ],
      correct: 1,
      explanation: "AI viết code nhanh nhưng vẫn cần người: hiểu business requirements, thiết kế system architecture, review code quality, xử lý edge cases, debug logic phức tạp. Developer + AI = 2-5x năng suất. Giống máy tính không thay thế kế toán — nó làm kế toán mạnh hơn.",
    },
    {
      question: "Rủi ro lớn nhất khi dùng AI coding assistant là gì?",
      options: [
        "Code chạy chậm hơn",
        "Security vulnerabilities: AI có thể sinh code có lỗ hổng (SQL injection, hardcoded secrets) mà developer không nhận ra nếu không review kỹ",
        "AI học code của bạn và bán cho người khác",
      ],
      correct: 1,
      explanation: "AI sinh code nhanh nhưng KHÔNG đảm bảo secure. Nghiên cứu chỉ ra: AI-generated code có tỷ lệ vulnerabilities tương đương human code, nhưng developers tin tưởng AI nên ÍT REVIEW hơn. Cần: security linting, code review, và hiểu rõ code trước khi merge.",
    },
    {
      type: "fill-blank",
      question: "Gen 1 (2021) của AI coding assistant chỉ dừng ở mức {blank} từng dòng, còn Gen 4 (2025) hoạt động như một {blank} tự đọc codebase, plan, implement, test và commit.",
      blanks: [
        { answer: "autocomplete", accept: ["tự hoàn thành", "auto-complete", "gợi ý"] },
        { answer: "agent", accept: ["agentic", "tác tử", "đồng nghiệp"] },
      ],
      explanation: "Tiến hóa: autocomplete (gợi ý dòng) → chat → inline edit → agent. Agent tự chủ thực hiện chuỗi hành động (đọc file, sửa code, chạy test) thay vì chỉ trả lời 1 lượt — đây là khác biệt lớn nhất giữa Gen 1 và Gen 4.",
    },
  ], []);

  return (
    <>
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

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Xem <strong className="text-foreground">4 thế hệ</strong>{" "}
          AI coding assistants — từ autocomplete đến agentic.
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

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Từ <strong>gợi ý 1 dòng</strong>{" "}(2021) đến <strong>tự implement cả feature</strong>{" "}(2025)
            chỉ trong 4 năm! Agentic assistants giống <strong>đồng nghiệp junior rất nhanh</strong>{" "}
            — đọc codebase, plan, implement, test, commit. Developer chuyển từ 'viết code'
            sang <strong>'thiết kế và review code'</strong>.
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
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
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>AI Coding Assistants</strong>{" "}
            là công cụ AI hỗ trợ developer viết code — từ autocomplete đến agentic coding tự động.
          </p>
          <p><strong>4 thế hệ:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Gen 1 - Autocomplete (2021):</strong>{" "}Gợi ý hoàn thành code. Copilot, TabNine</li>
            <li><strong>Gen 2 - Chat (2023):</strong>{" "}Hỏi-đáp, sinh code block, giải thích. ChatGPT, Claude</li>
            <li><strong>Gen 3 - Inline Edit (2024):</strong>{" "}Sửa code trực tiếp trong editor. Cursor, Copilot Edit</li>
            <li><strong>Gen 4 - Agentic (2025):</strong>{" "}Tự động multi-step theo <TopicLink slug="agentic-workflows">agentic workflows</TopicLink>: plan → code → test → fix. Dùng <TopicLink slug="function-calling">function calling</TopicLink>{" "}để đọc file, chạy test, commit. Claude Code, Devin.</li>
          </ul>

          <Callout variant="tip" title="Năng suất thực tế">
            Nghiên cứu GitHub (2024): Copilot tăng tốc 55% cho coding tasks. Nhưng: (1) chỉ cho well-defined tasks, (2) review time tăng 20%, (3) complex architecture tasks — AI ít giúp. Net productivity gain: 30-40% cho typical dev work.
          </Callout>

          <p><strong>Best practices:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Review mọi dòng:</strong>{" "}AI sinh code nhanh nhưng có thể có bugs, security issues</li>
            <li><strong>Context là vua:</strong>{" "}Càng nhiều context (codebase, docs, tests) → AI càng chính xác. Học cách viết <TopicLink slug="prompt-engineering">prompt</TopicLink>{" "}rõ ràng là kỹ năng quan trọng nhất.</li>
            <li><strong>Iterative:</strong>{" "}Sinh → review → refine → test. Không expect perfect code từ lần đầu</li>
            <li><strong>Security first:</strong>{" "}Chạy Semgrep/CodeQL trên AI-generated code trước khi merge</li>
          </ul>

          <CodeBlock language="bash" title="AI coding workflow thực tế">
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
# Check SQL injection, XSS, hardcoded secrets`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "4 thế hệ: Autocomplete → Chat → Inline Edit → Agentic. Từ 'gợi ý 1 dòng' đến 'tự implement cả feature'.",
          "Agentic assistants (Claude Code, Devin): đọc codebase, plan, implement, test, fix, commit tự động.",
          "Tăng năng suất 30-55% cho typical tasks. Complex architecture và design vẫn cần developer.",
          "LUÔN review AI code: security linting (Semgrep), unit tests, và hiểu logic trước merge.",
          "Developer chuyển từ 'viết code' sang 'thiết kế + review code' — AI là đồng nghiệp, không phải replacement.",
        ]} />
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>

        </PredictionGate>
      </LessonSection>
    </>
  );
}
