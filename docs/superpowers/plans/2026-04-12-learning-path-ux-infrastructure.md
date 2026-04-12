# Learning Path UX — Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build 3 infrastructure components (TopicLink, LearningObjectivesModal, extended QuizSection) and update the Student path page with objectives + restructured stages.

**Architecture:** TopicLink is a thin wrapper around Next.js `<Link>` placed in the interactive components barrel. LearningObjectivesModal is a path-level component using dialog/portal pattern. QuizSection extends the existing MCQ-only component with a discriminated union for fill-blank and code question types. Student path page gets a `pathObjectives` data object and restructured stage arrays.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Lucide icons, Framer Motion

**Spec:** `docs/superpowers/specs/2026-04-12-learning-path-ux-improvement-design.md`

**Rules:**
- **Vietnamese diacritics (dấu) are mandatory.** Every Vietnamese string — UI labels, descriptions, objectives, quiz questions, explanations, comments — must use full diacritical marks (sắc, huyền, hỏi, ngã, nặng, mũ, móc, trăng). Never write ASCII-stripped Vietnamese (e.g., "Nen tang" is wrong, "Nền tảng" is correct). Double-check before committing.

---

### Task 1: TopicLink Component

**Files:**
- Create: `src/components/interactive/TopicLink.tsx`
- Modify: `src/components/interactive/index.ts`

- [ ] **Step 1: Create TopicLink component**

```tsx
// src/components/interactive/TopicLink.tsx
"use client";

import Link from "next/link";
import { topicMap } from "@/topics/registry";

interface TopicLinkProps {
  slug: string;
  children: React.ReactNode;
}

export default function TopicLink({ slug, children }: TopicLinkProps) {
  if (process.env.NODE_ENV === "development" && !topicMap[slug]) {
    console.warn(`[TopicLink] slug "${slug}" not found in topicMap`);
  }

  return (
    <Link
      href={`/topics/${slug}`}
      className="text-accent-dark dark:text-accent border-b border-dotted border-accent-dark/40 dark:border-accent/40 hover:border-accent-dark dark:hover:border-accent hover:opacity-80 transition-opacity"
    >
      {children}
    </Link>
  );
}
```

- [ ] **Step 2: Export from barrel**

Add to `src/components/interactive/index.ts` under the Layout section:

```ts
// Cross-linking
export { default as TopicLink } from "./TopicLink";
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/thanhnha231206/idea/ai-edu-v2 && pnpm build 2>&1 | tail -20`
Expected: Build succeeds with no errors related to TopicLink.

- [ ] **Step 4: Commit**

```bash
git add src/components/interactive/TopicLink.tsx src/components/interactive/index.ts
git commit -m "feat: add TopicLink component for cross-topic inline linking"
```

---

### Task 2: LearningObjectivesModal Component

**Files:**
- Create: `src/components/paths/LearningObjectivesModal.tsx`

- [ ] **Step 1: Create the modal component**

```tsx
// src/components/paths/LearningObjectivesModal.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import { BookOpen, X, Clock, ArrowRight, Users, CheckCircle2, GraduationCap } from "lucide-react";
import Link from "next/link";

export interface PathObjectives {
  audience: string;
  prerequisites: string;
  stageObjectives: { stage: string; objectives: string[] }[];
  outcomes: string[];
  estimatedTime: { stage: string; hours: number }[];
  nextPath: { slug: string; label: string } | null;
}

interface LearningObjectivesModalProps {
  objectives: PathObjectives;
}

export default function LearningObjectivesModal({ objectives }: LearningObjectivesModalProps) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, close]);

  // Prevent body scroll when modal open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const totalHours = objectives.estimatedTime.reduce((sum, s) => sum + s.hours, 0);

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/50 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface hover:border-accent/30"
      >
        <BookOpen size={16} className="text-accent" />
        Mục tiêu học tập
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={close}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Modal */}
          <div
            className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4 rounded-t-2xl">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <BookOpen size={20} className="text-accent" />
                Mục tiêu học tập
              </h2>
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-1.5 text-muted hover:text-foreground hover:bg-surface transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-5 space-y-6">

              {/* Dành cho ai? */}
              <section>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <Users size={15} className="text-accent" />
                  Dành cho ai?
                </h3>
                <p className="text-sm text-muted leading-relaxed">{objectives.audience}</p>
              </section>

              {/* Điều kiện tiên quyết */}
              <section>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <CheckCircle2 size={15} className="text-accent" />
                  Điều kiện tiên quyết
                </h3>
                <p className="text-sm text-muted leading-relaxed">{objectives.prerequisites}</p>
              </section>

              {/* Bạn sẽ học được gì? */}
              <section>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <GraduationCap size={15} className="text-accent" />
                  Bạn sẽ học được gì?
                </h3>
                <div className="space-y-3">
                  {objectives.stageObjectives.map((stage, i) => (
                    <div key={stage.stage} className="rounded-xl border border-border bg-surface/50 p-3">
                      <p className="text-xs font-semibold text-accent mb-1.5">
                        Giai đoạn {i + 1}: {stage.stage}
                      </p>
                      <ul className="space-y-1">
                        {stage.objectives.map((obj) => (
                          <li key={obj} className="flex items-start gap-2 text-sm text-muted leading-relaxed">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                            {obj}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              {/* Sau khi hoàn thành */}
              <section>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <CheckCircle2 size={15} className="text-accent" />
                  Sau khi hoàn thành
                </h3>
                <ul className="space-y-1.5">
                  {objectives.outcomes.map((outcome) => (
                    <li key={outcome} className="flex items-start gap-2 text-sm text-muted leading-relaxed">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                      {outcome}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Thời gian ước tính */}
              <section>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <Clock size={15} className="text-accent" />
                  Thời gian ước tính
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {objectives.estimatedTime.map((s) => (
                    <div key={s.stage} className="rounded-lg border border-border bg-surface/50 px-3 py-2 text-center">
                      <p className="text-xs text-muted">{s.stage}</p>
                      <p className="text-sm font-bold text-foreground">{s.hours}h</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-accent font-medium mt-2 text-center">
                  Tổng: ~{totalHours} giờ
                </p>
              </section>

              {/* Lộ trình tiếp theo */}
              {objectives.nextPath && (
                <section className="border-t border-border pt-4">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                    <ArrowRight size={15} className="text-accent" />
                    Lộ trình tiếp theo
                  </h3>
                  <Link
                    href={`/paths/${objectives.nextPath.slug}`}
                    onClick={close}
                    className="inline-flex items-center gap-2 rounded-xl border border-accent/20 bg-accent/5 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/10 transition-colors"
                  >
                    {objectives.nextPath.label}
                    <ArrowRight size={14} />
                  </Link>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/thanhnha231206/idea/ai-edu-v2 && pnpm build 2>&1 | tail -20`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/paths/LearningObjectivesModal.tsx
git commit -m "feat: add LearningObjectivesModal for learning path overview"
```

---

### Task 3: Extend QuizSection with Fill-Blank and Code Question Types

**Files:**
- Modify: `src/components/topic/QuizSection.tsx`

- [ ] **Step 1: Update types to discriminated union**

Replace the existing `QuizQuestion` interface at the top of `src/components/topic/QuizSection.tsx`:

```tsx
// Old:
export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

// New:
interface MCQQuestion {
  type?: "mcq";
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

interface FillBlankQuestion {
  type: "fill-blank";
  question: string;
  blanks: { answer: string; accept?: string[] }[];
  explanation?: string;
}

interface CodeQuestion {
  type: "code";
  question: string;
  codeTemplate: string;
  language: string;
  blanks: { answer: string; accept?: string[] }[];
  explanation?: string;
}

export type QuizQuestion = MCQQuestion | FillBlankQuestion | CodeQuestion;
```

- [ ] **Step 2: Add FillBlankQuiz sub-component**

Add this component inside the same file, before the main `QuizSection` component:

```tsx
function FillBlankQuiz({
  q,
  onAnswer,
}: {
  q: FillBlankQuestion;
  onAnswer: (correct: boolean) => void;
}) {
  const [values, setValues] = useState<string[]>(q.blanks.map(() => ""));
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);

  function check() {
    const r = q.blanks.map((blank, i) => {
      const input = values[i].trim().toLowerCase();
      const accepted = [blank.answer, ...(blank.accept || [])].map((a) =>
        a.toLowerCase()
      );
      return accepted.includes(input);
    });
    setResults(r);
    setChecked(true);
    onAnswer(r.every(Boolean));
  }

  // Split question on {blank} placeholders
  const parts = q.question.split(/\{blank\}/g);
  let blankIdx = 0;

  return (
    <div className="space-y-4">
      {/* Question with inline inputs */}
      <div className="text-sm text-foreground leading-relaxed flex flex-wrap items-center gap-1">
        {parts.map((part, i) => {
          const currentBlankIdx = blankIdx;
          const hasBlankAfter = i < parts.length - 1;
          if (hasBlankAfter) blankIdx++;
          return (
            <span key={i} className="contents">
              <span>{part}</span>
              {hasBlankAfter && (
                <input
                  type="text"
                  value={values[currentBlankIdx]}
                  onChange={(e) => {
                    const next = [...values];
                    next[currentBlankIdx] = e.target.value;
                    setValues(next);
                  }}
                  disabled={checked}
                  className={`inline-block w-28 rounded-md border px-2 py-1 text-sm font-mono text-center transition-colors ${
                    checked
                      ? results[currentBlankIdx]
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                        : "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                      : "border-border bg-surface text-foreground focus:border-accent focus:outline-none"
                  }`}
                  placeholder="..."
                />
              )}
            </span>
          );
        })}
      </div>

      {/* Show correct answers if wrong */}
      {checked && !results.every(Boolean) && (
        <div className="rounded-lg bg-surface p-3 text-xs text-muted">
          <span className="font-medium text-foreground">Đáp án: </span>
          {q.blanks.map((b, i) => (
            <span key={i}>
              {i > 0 && ", "}
              <code className="rounded bg-accent/10 px-1 py-0.5 text-accent">{b.answer}</code>
            </span>
          ))}
        </div>
      )}

      {/* Check / explanation */}
      {!checked ? (
        <button
          type="button"
          onClick={check}
          disabled={values.some((v) => v.trim() === "")}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark disabled:opacity-40"
        >
          Kiểm tra
        </button>
      ) : (
        q.explanation && (
          <div className="rounded-lg bg-surface p-3 text-xs text-muted leading-relaxed">
            {q.explanation}
          </div>
        )
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add CodeQuiz sub-component**

Add this component right after `FillBlankQuiz`:

```tsx
function CodeQuiz({
  q,
  onAnswer,
}: {
  q: CodeQuestion;
  onAnswer: (correct: boolean) => void;
}) {
  const [values, setValues] = useState<string[]>(q.blanks.map(() => ""));
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);

  function check() {
    const r = q.blanks.map((blank, i) => {
      const input = values[i].trim().toLowerCase();
      const accepted = [blank.answer, ...(blank.accept || [])].map((a) =>
        a.toLowerCase()
      );
      return accepted.includes(input);
    });
    setResults(r);
    setChecked(true);
    onAnswer(r.every(Boolean));
  }

  // Split code on ___ placeholders
  const codeParts = q.codeTemplate.split(/___/g);
  let codeBlankIdx = 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground leading-relaxed">{q.question}</p>

      {/* Code block with inline inputs */}
      <div className="rounded-xl border border-border bg-[#1e1e2e] p-4 overflow-x-auto">
        <pre className="text-sm font-mono text-[#cdd6f4] whitespace-pre-wrap leading-relaxed">
          {codeParts.map((part, i) => {
            const currentIdx = codeBlankIdx;
            const hasBlankAfter = i < codeParts.length - 1;
            if (hasBlankAfter) codeBlankIdx++;
            return (
              <span key={i}>
                <span>{part}</span>
                {hasBlankAfter && (
                  <input
                    type="text"
                    value={values[currentIdx]}
                    onChange={(e) => {
                      const next = [...values];
                      next[currentIdx] = e.target.value;
                      setValues(next);
                    }}
                    disabled={checked}
                    className={`inline-block w-24 rounded border px-1.5 py-0.5 text-sm font-mono text-center ${
                      checked
                        ? results[currentIdx]
                          ? "border-green-500 bg-green-900/30 text-green-400"
                          : "border-red-500 bg-red-900/30 text-red-400"
                        : "border-[#585b70] bg-[#313244] text-[#cdd6f4] focus:border-accent focus:outline-none"
                    }`}
                    placeholder="___"
                  />
                )}
              </span>
            );
          })}
        </pre>
      </div>

      {/* Show correct answers if wrong */}
      {checked && !results.every(Boolean) && (
        <div className="rounded-lg bg-surface p-3 text-xs text-muted">
          <span className="font-medium text-foreground">Đáp án: </span>
          {q.blanks.map((b, i) => (
            <span key={i}>
              {i > 0 && ", "}
              <code className="rounded bg-accent/10 px-1 py-0.5 text-accent">{b.answer}</code>
            </span>
          ))}
        </div>
      )}

      {/* Check / explanation */}
      {!checked ? (
        <button
          type="button"
          onClick={check}
          disabled={values.some((v) => v.trim() === "")}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark disabled:opacity-40"
        >
          Kiểm tra
        </button>
      ) : (
        q.explanation && (
          <div className="rounded-lg bg-surface p-3 text-xs text-muted leading-relaxed">
            {q.explanation}
          </div>
        )
      )}
    </div>
  );
}
```

- [ ] **Step 4: Update the main QuizSection to dispatch by question type**

Replace the current question rendering section (the options `div` inside the card, lines ~114-149) with a dispatcher. The full replacement for the question rendering area inside the card:

Replace this block in `QuizSection` (the `{/* Question */}` and `{/* Options */}` sections):

```tsx
        {/* Question */}
        <p className="text-sm font-medium text-foreground mb-4 leading-relaxed">
          {q.question}
        </p>

        {/* Options */}
        <div className="space-y-2 mb-4">
          {q.options.map((opt, i) => {
```

With a type check dispatcher:

```tsx
        {/* Question content — dispatched by type */}
        {(q.type === "fill-blank") ? (
          <FillBlankQuiz
            q={q}
            onAnswer={(correct) => {
              setAnswered(true);
              if (correct) setScore((s) => s + 1);
            }}
          />
        ) : (q.type === "code") ? (
          <CodeQuiz
            q={q}
            onAnswer={(correct) => {
              setAnswered(true);
              if (correct) setScore((s) => s + 1);
            }}
          />
        ) : (
          <>
            {/* MCQ — original rendering */}
            <p className="text-sm font-medium text-foreground mb-4 leading-relaxed">
              {q.question}
            </p>

            <div className="space-y-2 mb-4">
              {(q as MCQQuestion).options.map((opt, i) => {
```

Then close the MCQ branch after the existing explanation/next button section:

```tsx
          </>
        )}
```

And update the "Next" button area to show for fill-blank/code types too. After the type dispatcher, add a "next" button for non-MCQ types:

```tsx
        {/* Next button for fill-blank and code types */}
        {answered && (q.type === "fill-blank" || q.type === "code") && (
          <div className="mt-3">
            <button
              type="button"
              onClick={next}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark"
            >
              {current < questions.length - 1 ? "Câu tiếp theo" : "Xem kết quả"}
            </button>
          </div>
        )}
```

- [ ] **Step 5: Add `useState` import if not already present, add `import` for the sub-components**

The sub-components `FillBlankQuiz` and `CodeQuiz` are defined in the same file, so no additional imports are needed. Verify `useState` is already imported (it is, at line 3).

- [ ] **Step 6: Verify build**

Run: `cd /Users/thanhnha231206/idea/ai-edu-v2 && pnpm build 2>&1 | tail -20`
Expected: Build succeeds. All existing topics with MCQ-only quizzes continue to work (type field defaults to undefined which falls into the MCQ branch).

- [ ] **Step 7: Commit**

```bash
git add src/components/topic/QuizSection.tsx
git commit -m "feat: extend QuizSection with fill-blank and code question types"
```

---

### Task 4: Update CONTRIBUTING.md with TopicLink and Quiz Guides

**Files:**
- Modify: `src/components/topic/QuizSection.tsx` (update the exported type reference in comments if needed)
- Modify: `CONTRIBUTING.md`

- [ ] **Step 1: Add TopicLink section to CONTRIBUTING.md**

Insert after the "Layout primitives" table (after line ~191) and before the "Topic-level wrappers" section:

```markdown
### Cross-linking primitives

| Name | Import | Description |
|------|--------|-------------|
| `TopicLink` | `@/components/interactive/TopicLink` | Inline link to another topic. Renders as dotted-underline accent link. Props: `slug: string` (must exist in registry), `children: ReactNode` (display text). |

#### TopicLink — Liên kết chéo giữa các bài học

Khi bài học đề cập đến một khái niệm đã có topic riêng, hãy dùng `TopicLink` để người học có thể quay lại ôn nếu chưa hiểu.

**Cách dùng:**
```tsx
import { TopicLink } from "@/components/interactive";

// Trong nội dung bài học:
<p>
  Khi gradient truyền qua nhiều lớp, nó có thể bị triệt tiêu — gọi là{" "}
  <TopicLink slug="vanishing-exploding-gradients">vanishing gradient</TopicLink>.
</p>
```

**Quy tắc:**
- Chỉ link lần đầu xuất hiện trong bài — không link lặp lại cùng thuật ngữ
- `slug` phải tồn tại trong `registry.ts` — component sẽ cảnh báo trong dev mode nếu không tìm thấy
- `children` là text hiển thị, có thể khác tên topic gốc
- Ưu tiên link các khái niệm tiên quyết (prerequisite) hơn các khái niệm nâng cao
```

- [ ] **Step 2: Update QuizSection docs in CONTRIBUTING.md**

Find the existing QuizSection row in the "Topic-level wrappers" table (line ~200) and replace:

```markdown
| `QuizSection` | `@/components/topic/QuizSection` | End-of-lesson quiz with scoring. Props: `questions: QuizQuestion[]`. Each `QuizQuestion`: `{ question: string, options: string[], correct: number, explanation?: string }`. |
```

With:

```markdown
| `QuizSection` | `@/components/topic/QuizSection` | End-of-lesson quiz with scoring. Props: `questions: QuizQuestion[]`. Supports 3 question types — see "Quiz Question Types" section below. |
```

- [ ] **Step 3: Add Quiz Question Types section**

Insert after the "Topic-level wrappers" table, before the "Vietnamese Content Guidelines" section:

```markdown
### Quiz Question Types

`QuizSection` supports 3 question types via a discriminated union. Mix them freely in a single quiz.

#### MCQ (default — backwards compatible)
```tsx
{
  question: "Câu hỏi trắc nghiệm?",
  options: ["Đáp án A", "Đáp án B", "Đáp án C"],
  correct: 1,
  explanation: "Giải thích..."
}
```
No `type` field needed — defaults to MCQ. This is the existing format; all current quizzes continue working.

#### Fill-in-the-blank
```tsx
{
  type: "fill-blank",
  question: "Công thức MSE = {blank} trong đó n là {blank}",
  blanks: [
    { answer: "1/n * Σ(yi - ŷi)²", accept: ["(1/n)*sum(yi-yi_hat)^2"] },
    { answer: "số mẫu", accept: ["số sample", "number of samples"] }
  ],
  explanation: "MSE là trung bình bình phương sai số..."
}
```
Use `{blank}` as placeholder in the question string. `accept` array provides alternative correct answers. Matching is case-insensitive.

#### Code completion
```tsx
{
  type: "code",
  question: "Hoàn thành hàm tính gradient descent:",
  codeTemplate: "def gradient_descent(x, lr):\n    grad = compute_grad(x)\n    return x - ___ * ___",
  language: "python",
  blanks: [
    { answer: "lr", accept: ["learning_rate"] },
    { answer: "grad", accept: ["gradient"] }
  ],
  explanation: "Cập nhật: x_new = x - learning_rate * gradient"
}
```
Use `___` as placeholder in code. Same matching rules as fill-blank.

**Guidelines per path:**
- **Student math topics:** use `fill-blank` for formulas
- **Student ML/NN topics:** 5-7 questions mixing MCQ + fill-blank
- **Engineer topics:** use `code` for implementation questions
- **Office topics:** MCQ with scenario-based questions (practical workplace situations)
```

- [ ] **Step 4: Verify build**

Run: `cd /Users/thanhnha231206/idea/ai-edu-v2 && pnpm build 2>&1 | tail -20`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add CONTRIBUTING.md
git commit -m "docs: add TopicLink usage guide and quiz question types to CONTRIBUTING.md"
```

---

### Task 5: Add Learning Objectives to Student Path Page

**Files:**
- Modify: `src/app/paths/student/page.tsx`
- Modify: `src/components/paths/LearningPathPage.tsx`

- [ ] **Step 1: Add objectives button slot to LearningPathPage**

In `src/components/paths/LearningPathPage.tsx`, add an optional `headerExtra` prop:

Update the interface:

```tsx
interface LearningPathPageProps {
  pathId: string;
  nameVi: string;
  descriptionVi: string;
  icon: React.ElementType;
  stages: Stage[];
  headerExtra?: React.ReactNode;
}
```

Then in `LearningPathContent`, destructure `headerExtra` and render it below the description inside the header card (after line 91, after the `<p>` description tag):

```tsx
              <p className="text-sm text-muted mt-1">{descriptionVi}</p>
              {headerExtra && <div className="mt-3">{headerExtra}</div>}
```

- [ ] **Step 2: Add pathObjectives data + modal to Student page**

Replace the full content of `src/app/paths/student/page.tsx`:

```tsx
"use client";

import { GraduationCap } from "lucide-react";
import LearningPathPage from "@/components/paths/LearningPathPage";
import LearningObjectivesModal from "@/components/paths/LearningObjectivesModal";
import type { Stage } from "@/components/paths/LearningPathPage";
import type { PathObjectives } from "@/components/paths/LearningObjectivesModal";

const pathObjectives: PathObjectives = {
  audience:
    "Học sinh THPT, sinh viên năm nhất, hoặc bất kỳ ai muốn bắt đầu học AI/ML từ con số 0. Không yêu cầu kinh nghiệm lập trình hay toán cao cấp.",
  prerequisites:
    "Toán phổ thông cơ bản (đại số, hàm số). Biết dùng máy tính và trình duyệt web. Không cần biết lập trình — sẽ học trong lộ trình.",
  stageObjectives: [
    {
      stage: "Giới thiệu",
      objectives: [
        "Hiểu Machine Learning là gì và khác gì lập trình truyền thống",
        "Biết ML giải quyết những bài toán nào trong thực tế",
      ],
    },
    {
      stage: "Nền tảng toán",
      objectives: [
        "Nắm đại số tuyến tính cơ bản: vector, ma trận, phép nhân",
        "Hiểu xác suất và thống kê cần thiết cho ML",
        "Biết đạo hàm và ý nghĩa trong tối ưu hoá",
      ],
    },
    {
      stage: "ML cơ bản",
      objectives: [
        "Phân biệt supervised, unsupervised, và reinforcement learning",
        "Xây dựng mô hình hồi quy và phân loại đầu tiên",
        "Hiểu bias-variance tradeoff và overfitting",
        "Đánh giá mô hình bằng confusion matrix và cross-validation",
      ],
    },
    {
      stage: "Mạng nơ-ron",
      objectives: [
        "Hiểu kiến trúc mạng nơ-ron từ perceptron đến MLP",
        "Nắm forward propagation và backpropagation",
        "Biết gradient descent và cách chọn hàm mất mát",
      ],
    },
    {
      stage: "Kỹ năng thực hành",
      objectives: [
        "Sử dụng Python, NumPy, Pandas cho ML",
        "Tiền xử lý dữ liệu và trích xuất đặc trưng",
        "Chọn mô hình phù hợp cho bài toán cụ thể",
        "Hoàn thành một dự án ML end-to-end",
      ],
    },
  ],
  outcomes: [
    "Hiểu nền tảng toán và lý thuyết cần thiết cho Machine Learning",
    "Xây dựng và đánh giá được mô hình ML cơ bản",
    "Biết dùng Python và các thư viện ML phổ biến",
    "Hoàn thành dự án ML từ dữ liệu thô đến kết quả",
    "Sẵn sàng chuyển sang lộ trình AI Engineer",
  ],
  estimatedTime: [
    { stage: "Giới thiệu", hours: 1 },
    { stage: "Nền tảng toán", hours: 8 },
    { stage: "ML cơ bản", hours: 20 },
    { stage: "Mạng nơ-ron", hours: 15 },
    { stage: "Kỹ năng thực hành", hours: 16 },
  ],
  nextPath: { slug: "ai-engineer", label: "AI Engineer" },
};

const stages: Stage[] = [
  {
    title: "Giới thiệu",
    slugs: ["what-is-ml"],
  },
  {
    title: "Nền tảng toán",
    slugs: [
      "linear-algebra-for-ml",
      "probability-statistics",
      "calculus-for-backprop",
    ],
  },
  {
    title: "ML cơ bản",
    slugs: [
      "supervised-unsupervised-rl",
      "linear-regression",
      "logistic-regression",
      "information-theory",
      "decision-trees",
      "knn",
      "naive-bayes",
      "k-means",
      "confusion-matrix",
      "bias-variance",
      "overfitting-underfitting",
      "cross-validation",
      "train-val-test",
    ],
  },
  {
    title: "Mạng nơ-ron",
    slugs: [
      "neural-network-overview",
      "perceptron",
      "mlp",
      "activation-functions",
      "forward-propagation",
      "backpropagation",
      "gradient-descent",
      "loss-functions",
      "epochs-batches",
    ],
  },
  {
    title: "Kỹ năng thực hành",
    slugs: [
      "data-preprocessing",
      "feature-engineering",
      "python-for-ml",
      "model-evaluation-selection",
      "jupyter-colab-workflow",
      "end-to-end-ml-project",
    ],
  },
];

export default function StudentPathPage() {
  return (
    <LearningPathPage
      pathId="student"
      nameVi="Học sinh · Sinh viên"
      descriptionVi="Nền tảng AI/ML từ con số 0 — toán, thuật toán cổ điển, mạng nơ-ron cơ bản"
      icon={GraduationCap}
      stages={stages}
      headerExtra={<LearningObjectivesModal objectives={pathObjectives} />}
    />
  );
}
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/thanhnha231206/idea/ai-edu-v2 && pnpm build 2>&1 | tail -20`
Expected: Build succeeds. The Student path page now shows the "Mục tiêu học tập" button and the restructured stages. Topics that don't exist yet (what-is-ml, python-for-ml, etc.) will simply not render in the topic grid (topicMap filter handles this gracefully).

- [ ] **Step 4: Commit**

```bash
git add src/components/paths/LearningPathPage.tsx src/app/paths/student/page.tsx
git commit -m "feat: add learning objectives modal and restructure Student path stages"
```

---

## Summary

| Task | Component | Files Changed | New/Modified |
|------|-----------|--------------|--------------|
| 1 | TopicLink | 2 | 1 new, 1 modified |
| 2 | LearningObjectivesModal | 1 | 1 new |
| 3 | QuizSection extension | 1 | 1 modified |
| 4 | CONTRIBUTING.md guides | 1 | 1 modified |
| 5 | Student path page | 2 | 2 modified |

**Total:** 3 new files, 4 modified files, 5 commits.

**Next phase (separate plan):** Create 5 new topic files + edit all 27 existing Student path topics with TopicLink insertion, audit fixes, and quiz variety.
