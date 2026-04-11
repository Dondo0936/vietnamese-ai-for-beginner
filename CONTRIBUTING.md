# Contributing to AI Cho Mọi Người

## **FOR AI AGENTS**

**If you are an AI coding assistant helping someone contribute a topic, read this entire file before writing any code.** This document is written for AI coding agents (Claude, Cursor, Copilot, etc.) to produce correct, convention-compliant topic files. Every section is explicit and machine-parseable. Do not guess — follow the spec.

---

## Quick Start

```bash
# 1. Fork the repository on GitHub, then clone your fork
git clone https://github.com/<your-username>/vietnamese-ai-for-beginner.git
cd vietnamese-ai-for-beginner

# 2. Install dependencies
pnpm install

# 3. Set up environment
cp .env.local.example .env.local
# Fill in Supabase credentials (see README.md)

# 4. Start the dev server
pnpm dev
# Open http://localhost:3000

# 5. Create your topic file from the template
cp src/topics/_template.tsx src/topics/your-slug.tsx
```

---

## The Golden Rule

**User discovers before being told.**

Every lesson must lead the learner to figure out the concept themselves before you explain it. Show a puzzle, let them interact, let them form a hypothesis — then confirm or correct. The explanation comes *after* the "aha" moment, not before. A passive lecture is not a topic.

### Wrong way (explain then show):

```tsx
{/* DO NOT DO THIS */}
<ExplanationSection>
  <p>Softmax biến đổi vector thành xác suất bằng cách lấy e^x rồi chia cho tổng.</p>
</ExplanationSection>
<VisualizationSection>
  {/* Static diagram */}
</VisualizationSection>
```

### Right way (challenge then discover then explain):

```tsx
{/* DO THIS */}
<PredictionGate
  question="Cho 3 giá trị [2, 1, 0.1], nếu muốn biến thành xác suất (tổng = 1), bạn nghĩ giá trị lớn nhất sẽ chiếm bao nhiêu %?"
  options={["33%", "59%", "71%", "90%"]}
  correct={2}
  explanation="Softmax cho giá trị 2 chiếm ~71% — nó khuếch đại sự khác biệt, không chỉ chia đều!"
>
  {/* Interactive visualization appears AFTER prediction */}
  <SoftmaxVisualization />
</PredictionGate>
```

---

## Topic File Structure

### File location

`src/topics/[slug].tsx` — one file per topic. File name uses kebab-case matching the slug.

### Required exports

Every topic file MUST export exactly two things:

#### 1. Named export: `metadata: TopicMeta`

```ts
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: string;           // kebab-case, matches filename (e.g. "softmax-function")
  title: string;          // English title (e.g. "Softmax Function")
  titleVi: string;        // Vietnamese title (e.g. "Hàm Softmax")
  description: string;    // Vietnamese description, 1-2 sentences
  category: string;       // one of the 14 category slugs (see registry.ts)
  tags: string[];         // relevant tags for search
  difficulty: Difficulty;  // "beginner" | "intermediate" | "advanced"
  relatedSlugs: string[]; // slugs of related topics
  vizType: VizType;       // "interactive" | "static" (prefer "interactive")
  icon?: string;          // optional lucide icon name
};
```

#### 2. Default export: React component

```tsx
export default function YourTopicNameTopic() {
  return (
    <>
      {/* Lesson content using primitives */}
    </>
  );
}
```

### Register the topic

Add your topic's metadata to the `topicList` array in `src/topics/registry.ts`, placing it under the appropriate category section.

### Recommended 8-step lesson flow

Follow this structure for every topic. Not every step needs a separate section — some steps can be combined — but the *order* must be preserved.

| Step | Name | Purpose | Typical primitive |
|------|------|---------|-------------------|
| 1 | **HOOK** | Real-world Vietnamese analogy that frames the concept | `AnalogyCard` |
| 2 | **DISCOVER** | User makes a prediction before seeing anything | `PredictionGate` |
| 3 | **REVEAL** | Interactive visualization shows the concept in action | Custom SVG + `SliderGroup` / `CanvasPlayground` |
| 4 | **DEEPEN** | Step-by-step breakdown of the mechanism | `StepReveal` or `BuildUp` |
| 5 | **CHALLENGE** | Mid-lesson check — user applies what they just learned | `InlineChallenge` |
| 6 | **EXPLAIN** | Formal explanation with math/code (only now!) | `ExplanationSection` + `CodeBlock` |
| 7 | **CONNECT** | Link to related concepts | `MiniSummary` + `Callout` |
| 8 | **QUIZ** | End-of-lesson assessment | `QuizSection` (2+ questions) |

---

## Available Primitives

Import all from `@/components/interactive` (barrel export) or individually from `@/components/interactive/[Name]`.

```tsx
import { PredictionGate, SliderGroup, AhaMoment } from "@/components/interactive";
```

Topic-level wrappers import from `@/components/topic/`:

```tsx
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
```

### Discovery primitives

| Name | Import | Description |
|------|--------|-------------|
| `PredictionGate` | `@/components/interactive/PredictionGate` | User picks a prediction; gated children render only after answering. Props: `question: string`, `options: string[]`, `correct: number`, `explanation: string`, `children?: ReactNode`. |
| `StepReveal` | `@/components/interactive/StepReveal` | Progressive step-by-step reveal with "Tiếp tục" button. Props: `children: ReactNode[]`, `labels?: string[]`. |
| `BuildUp` | `@/components/interactive/BuildUp` | Incrementally add pieces to build up a concept. Props: `children: ReactNode[]`, `labels?: string[]`, `addLabel?: string`. |

### Manipulation primitives

| Name | Import | Description |
|------|--------|-------------|
| `SliderGroup` | `@/components/interactive/SliderGroup` | One or more sliders driving a render-prop visualization. Props: `sliders: SliderConfig[]`, `visualization: (values: Record<string, number>) => ReactNode`, `title?: string`. Each `SliderConfig`: `{ key, label, min, max, step?, defaultValue, unit? }`. |
| `ToggleCompare` | `@/components/interactive/ToggleCompare` | A/B toggle to compare two states. Props: `labelA: string`, `labelB: string`, `childA: ReactNode`, `childB: ReactNode`, `description?: string`. |
| `DragDrop` | `@/components/interactive/DragDrop` | Drag items into categorized drop zones. Props: `items: DragItem[]`, `zones: DropZone[]`, `instruction?: string`, `onComplete?: (correct: boolean) => void`. Each `DragItem`: `{ id, label }`. Each `DropZone`: `{ id, label, accepts: string[] }`. |
| `Reorderable` | `@/components/interactive/Reorderable` | Drag-to-reorder list with correctness check. Props: `items: string[]`, `correctOrder: number[]`, `instruction?: string`. |
| `MatrixEditor` | `@/components/interactive/MatrixEditor` | Editable numeric matrix with optional live visualization. Props: `initialData: number[][]`, `rowLabels?: string[]`, `colLabels?: string[]`, `min?: number`, `max?: number`, `step?: number`, `visualization?: (data: number[][]) => ReactNode`, `onChange?: (data: number[][]) => void`. |
| `CanvasPlayground` | `@/components/interactive/CanvasPlayground` | Click-to-place points on an SVG canvas. Props: `width?: number`, `height?: number`, `showGrid?: boolean`, `points: Point[]`, `onAddPoint?: (point: Point) => void`, `onReset?: () => void`, `overlay?: (width: number, height: number) => ReactNode`, `instruction?: string`, `nextColor?: string`, `nextLabel?: string`. Each `Point`: `{ x, y, label?, color? }`. |

### Assessment primitives

| Name | Import | Description |
|------|--------|-------------|
| `InlineChallenge` | `@/components/interactive/InlineChallenge` | Lightweight mid-lesson multiple-choice question. Props: `question: string`, `options: string[]`, `correct: number`, `explanation?: string`. |
| `MatchPairs` | `@/components/interactive/MatchPairs` | Click-to-match left/right columns. Props: `pairs: Pair[]`, `instruction?: string`. Each `Pair`: `{ left, right }`. |
| `SortChallenge` | `@/components/interactive/SortChallenge` | Re-exported from `Reorderable` — same component and API. |
| `FillBlank` | `@/components/interactive/FillBlank` | Fill-in-the-blank with dropdown selectors inside a template string. Props: `template: string` (use `{id}` placeholders), `blanks: Blank[]`. Each `Blank`: `{ id, options: string[], correct: number }`. |

### Feedback primitives

| Name | Import | Description |
|------|--------|-------------|
| `AhaMoment` | `@/components/interactive/AhaMoment` | Highlighted "aha" insight box with sparkle animation. Props: `children: ReactNode`. |
| `ProgressSteps` | `@/components/interactive/ProgressSteps` | Visual progress indicator (dots). Props: `current: number`, `total: number`, `labels?: string[]`. |
| `Callout` | `@/components/interactive/Callout` | Styled callout box. Props: `variant?: "tip" \| "warning" \| "insight" \| "info"`, `title?: string`, `children: ReactNode`. |
| `MiniSummary` | `@/components/interactive/MiniSummary` | Bullet-point summary card. Props: `title?: string` (default: "Tóm tắt"), `points: string[]`. |

### Layout primitives

| Name | Import | Description |
|------|--------|-------------|
| `SplitView` | `@/components/interactive/SplitView` | Side-by-side 2-column layout (stacks on mobile). Props: `left: ReactNode`, `right: ReactNode`, `leftLabel?: string`, `rightLabel?: string`. |
| `TabView` | `@/components/interactive/TabView` | Tabbed content viewer. Props: `tabs: { label: string; content: ReactNode }[]`. |
| `CollapsibleDetail` | `@/components/interactive/CollapsibleDetail` | Expandable detail section. Props: `title: string`, `children: ReactNode`, `defaultOpen?: boolean`. |
| `CodeBlock` | `@/components/interactive/CodeBlock` | Syntax-highlighted code with copy button. Props: `children: string` (the code), `language?: string` (default: "python"), `title?: string`. |

### Topic-level wrappers

| Name | Import | Description |
|------|--------|-------------|
| `AnalogyCard` | `@/components/topic/AnalogyCard` | Vietnamese real-world analogy wrapper. Props: `children: ReactNode`. |
| `VisualizationSection` | `@/components/topic/VisualizationSection` | Container for interactive/static visualizations. Props: `children: ReactNode`. |
| `ExplanationSection` | `@/components/topic/ExplanationSection` | Container for formal explanation text. Props: `children: ReactNode`. |
| `QuizSection` | `@/components/topic/QuizSection` | End-of-lesson quiz with scoring. Props: `questions: QuizQuestion[]`. Each `QuizQuestion`: `{ question: string, options: string[], correct: number, explanation?: string }`. |

---

## Vietnamese Content Guidelines

1. **Always use proper Vietnamese diacritics (dấu).** Write "Nền tảng mạng nơ-ron", never "Nen tang mang no-ron". This is a hard, non-negotiable requirement.

2. **Write analogies from Vietnamese daily life.** Good references: chợ, phở, xe máy, Grab, Shopee, cà phê sữa đá, bưu điện, sổ liên lạc, lớp học, thi đại học. Do NOT use American cultural references (baseball, Thanksgiving, SAT, etc.).

3. **Target audience: university freshman.** Assume no ML background. Assume basic math (high-school level). Explain jargon the first time it appears.

4. **Use "bạn" (informal you).** Do not use "quý vị", "anh/chị", or formal register. The tone is friendly and encouraging, like a peer tutor.

5. **Technical terms — keep English when well-known, translate when clear:**
   - Keep English: Transformer, CNN, RNN, LSTM, GAN, GPU, API, epoch, batch, loss
   - Translate: mạng nơ-ron (neural network), hàm mất mát (loss function), tốc độ học (learning rate), lan truyền ngược (backpropagation), quá khớp (overfitting)
   - When in doubt: use Vietnamese with English in parentheses, e.g. "hàm kích hoạt (activation function)"

6. **All user-visible text must be in Vietnamese.** This includes button labels, headings, quiz questions, explanations, and callout text. Code samples and mathematical notation are the only exceptions.

---

## Prompt Template for Domain Experts

If you are a domain expert (e.g. a professor who understands Capsule Networks deeply but does not code), copy-paste this entire block into your AI coding assistant:

```
You are contributing a topic about [TOPIC NAME] to the "AI Cho Mọi Người" Vietnamese AI education app.

1. Read CONTRIBUTING.md for the project conventions
2. Read docs/primitives.md for available interactive components
3. Copy src/topics/_template.tsx to src/topics/[your-slug].tsx
4. Follow the 8-step lesson flow: HOOK → DISCOVER → REVEAL → DEEPEN → CHALLENGE → EXPLAIN → CONNECT → QUIZ
5. Write all content in Vietnamese with proper diacritics
6. Create an interactive SVG visualization — users should manipulate, not just watch
7. Add the topic to src/topics/registry.ts
8. Run pnpm build to verify

The golden rule: user discovers before being told.
```

---

## PR Checklist

Before submitting, verify every item. An AI agent MUST check all 10 programmatically where possible.

1. Topic file exists at `src/topics/[slug].tsx`
2. `metadata` is a named export with type `TopicMeta` and all required fields are present (`slug`, `title`, `titleVi`, `description`, `category`, `tags`, `difficulty`, `relatedSlugs`, `vizType`)
3. Entry added to `topicList` array in `src/topics/registry.ts`
4. At least 1 `PredictionGate` or other discovery interaction (user predicts before being told)
5. At least 1 custom interactive visualization (SVG with user manipulation, not a static image)
6. At least 1 `InlineChallenge` mid-lesson (not at the very end)
7. `QuizSection` with 2+ questions at the end of the lesson
8. All user-visible text is in Vietnamese with proper dấu (no ASCII-stripped Vietnamese)
9. `pnpm build` passes with 0 errors
10. No hardcoded English-only content in user-visible strings (code samples and math excluded)

---

## Anti-Patterns (DO NOT)

- **DO NOT** create passive-only lessons (analogy followed by diagram followed by text wall). Every topic needs interactive discovery.
- **DO NOT** use American cultural references. Use Vietnamese ones: chợ, phở, xe máy, Grab, Shopee — not baseball, Thanksgiving, or SATs.
- **DO NOT** skip the quiz section. Every topic ends with `QuizSection` containing at least 2 questions.
- **DO NOT** make static-only visualizations. Every topic must have at least 1 interactive element where the user manipulates something (slider, drag, click, etc.).
- **DO NOT** write ASCII Vietnamese without diacritics. "Mang no-ron" is wrong. "Mạng nơ-ron" is correct.
- **DO NOT** add external dependencies without discussion in a GitHub issue first.
- **DO NOT** modify existing topic files in a "new topic" PR. One topic per PR.

---

## Example: Minimal Complete Topic

Below is a short but complete topic demonstrating the required pattern. Use this as a structural reference.

```tsx
"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
} from "@/components/interactive";
import type { TopicMeta } from "@/lib/types";

// ---- Metadata ----
export const metadata: TopicMeta = {
  slug: "softmax-function",
  title: "Softmax Function",
  titleVi: "Hàm Softmax",
  description: "Tìm hiểu cách hàm Softmax biến đổi vector số thực thành phân phối xác suất.",
  category: "neural-fundamentals",
  tags: ["softmax", "xác suất", "classification"],
  difficulty: "beginner",
  relatedSlugs: ["activation-functions", "loss-functions", "logistic-regression"],
  vizType: "interactive",
};

// ---- Simple interactive bar chart ----
function SoftmaxChart({ values }: { values: number[] }) {
  const exps = values.map((v) => Math.exp(v));
  const sum = exps.reduce((a, b) => a + b, 0);
  const probs = exps.map((e) => e / sum);
  const maxProb = Math.max(...probs);
  const labels = ["A", "B", "C"];

  return (
    <svg viewBox="0 0 300 150" className="w-full max-w-sm mx-auto">
      {probs.map((p, i) => {
        const barH = p * 110;
        const x = 40 + i * 90;
        return (
          <g key={i}>
            <rect
              x={x}
              y={130 - barH}
              width={50}
              height={barH}
              rx={6}
              className={p === maxProb ? "fill-accent" : "fill-accent/30"}
            />
            <text x={x + 25} y={145} textAnchor="middle" className="fill-foreground text-xs">
              {labels[i]}
            </text>
            <text x={x + 25} y={125 - barH} textAnchor="middle" className="fill-foreground text-xs font-mono">
              {(p * 100).toFixed(1)}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ---- Component ----
export default function SoftmaxFunctionTopic() {
  const [inputA, setInputA] = useState(2);

  return (
    <>
      {/* HOOK */}
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang ở quán trà sữa, cầm phiếu đánh giá 3 món:
          Trà sữa trân châu được 9 điểm, Matcha latte 6 điểm, Nước ép cam 2 điểm.
          Làm sao để biến 3 con số này thành "xác suất chọn" — sao cho tổng luôn bằng 100%?
        </p>
      </AnalogyCard>

      {/* DISCOVER */}
      <PredictionGate
        question="Cho 3 giá trị [2, 1, 0.1], nếu biến thành xác suất, giá trị lớn nhất (2) sẽ chiếm bao nhiêu %?"
        options={["33% (chia đều)", "50%", "~66% (gấp đôi giá trị nhỏ nhất)", "~71%"]}
        correct={3}
        explanation="Softmax cho giá trị 2 chiếm ~71% — nó dùng hàm mũ (e^x) nên khuếch đại khoảng cách giữa các giá trị, không chỉ chia tỷ lệ tuyến tính!"
      >
        <AhaMoment>
          <p>Softmax không chỉ chuẩn hoá — nó <strong>khuếch đại</strong> sự khác biệt nhờ hàm mũ!</p>
        </AhaMoment>
      </PredictionGate>

      {/* REVEAL */}
      <VisualizationSection>
        <p className="text-sm text-muted mb-3 text-center">
          Kéo thanh trượt để thay đổi giá trị A và xem xác suất thay đổi:
        </p>
        <div className="space-y-3">
          <div className="flex items-center gap-3 justify-center">
            <label className="text-sm text-foreground">Giá trị A:</label>
            <input
              type="range"
              min={-2}
              max={5}
              step={0.1}
              value={inputA}
              onChange={(e) => setInputA(Number(e.target.value))}
              className="w-48 accent-accent"
            />
            <span className="font-mono text-sm text-accent w-10">{inputA.toFixed(1)}</span>
          </div>
          <SoftmaxChart values={[inputA, 1, 0.1]} />
        </div>
      </VisualizationSection>

      {/* CHALLENGE */}
      <InlineChallenge
        question="Nếu tất cả giá trị đầu vào bằng nhau [3, 3, 3], Softmax sẽ cho kết quả gì?"
        options={["[1, 0, 0]", "[0.33, 0.33, 0.33]", "[0.5, 0.25, 0.25]"]}
        correct={1}
        explanation="Khi tất cả bằng nhau, e^x cũng bằng nhau, nên xác suất chia đều — mỗi giá trị chiếm 33.3%."
      />

      {/* EXPLAIN */}
      <ExplanationSection>
        <h3>Công thức Softmax</h3>
        <p>
          Cho vector <strong>z</strong> có n phần tử, Softmax biến phần tử thứ i thành:
        </p>
        <p className="text-center font-mono my-2">
          softmax(z_i) = e^(z_i) / (e^(z_1) + e^(z_2) + ... + e^(z_n))
        </p>
        <Callout variant="tip" title="Tại sao dùng e^x?">
          Hàm mũ đảm bảo mọi giá trị luôn dương (kể cả khi đầu vào âm),
          và khuếch đại khoảng cách giữa các giá trị — giúp mô hình "tự tin" hơn vào lựa chọn cao nhất.
        </Callout>
      </ExplanationSection>

      {/* QUIZ */}
      <QuizSection
        questions={[
          {
            question: "Softmax đảm bảo tính chất nào cho đầu ra?",
            options: [
              "Tất cả giá trị nằm trong [-1, 1]",
              "Tất cả giá trị dương và tổng bằng 1",
              "Giá trị lớn nhất luôn bằng 1",
              "Tất cả giá trị bằng nhau",
            ],
            correct: 1,
            explanation: "Softmax biến mọi giá trị thành số dương và đảm bảo tổng = 1, tạo thành phân phối xác suất hợp lệ.",
          },
          {
            question: "Khi tăng một giá trị đầu vào rất lớn so với các giá trị khác, Softmax sẽ tiến gần đến?",
            options: [
              "Phân phối đều",
              "One-hot vector (1 ở vị trí lớn nhất, 0 ở còn lại)",
              "Tất cả bằng 0",
              "Giá trị vô cực",
            ],
            correct: 1,
            explanation: "Khi một giá trị áp đảo, e^x của nó lớn hơn rất nhiều so với phần còn lại — Softmax tiến gần đến one-hot vector.",
          },
        ] satisfies QuizQuestion[]}
      />
    </>
  );
}
```

---

## Code of Conduct

We are committed to providing a welcoming and inclusive experience for everyone. Please be respectful, constructive, and kind in all interactions. Harassment, discrimination, or disrespectful behavior will not be tolerated.

Hãy tôn trọng, xây dựng, và thân thiện trong mọi trao đổi. Cảm ơn bạn!
