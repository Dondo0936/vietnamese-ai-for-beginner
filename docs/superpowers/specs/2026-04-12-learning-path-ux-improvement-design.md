# Learning Path UX Improvement — Design Spec

**Date:** 2026-04-12
**Approach:** Infrastructure First, Then Sweep (starting with Student path)

---

## Overview

Improve the learning path UX based on audit findings. Two infrastructure pieces built first, then applied path-by-path with per-topic content edits.

**Goals:**
1. Each learning path starts with clear learning objectives accessible via a modal
2. Terms referencing other lessons are hyperlinked inline so learners can navigate back if unfamiliar
3. Per-topic quality improvements based on audit recommendations (underutilized components, missing exercises, Vietnamese examples, bug fixes)

---

## Phase 1: Infrastructure

### 1.1 `TopicLink` Component

**File:** `src/components/interactive/TopicLink.tsx`
**Export from:** `src/components/interactive/index.ts`

A lightweight inline component that renders a styled link to another topic.

**Props:**
```typescript
interface TopicLinkProps {
  slug: string;          // Target topic slug (must exist in topicMap)
  children: ReactNode;   // Display text (can differ from topic title)
}
```

**Behavior:**
- Renders `<Link href="/topics/{slug}">` with dotted underline + accent color
- Validates slug against `topicMap` — logs console warning in dev if slug not found
- Accepts children as display text (e.g., `<TopicLink slug="vanishing-exploding-gradients">vanishing gradient</TopicLink>`)

**Styling:**
- `border-bottom: 1px dotted` with accent color
- `text-accent-dark` / hover: increased opacity
- Visually distinct from regular links but not distracting inline

**Contributor guide (add to CONTRIBUTING.md):**

```markdown
### TopicLink — Liên kết chéo giữa các bài học

Khi bài học đề cập đến một khái niệm đã có topic riêng, hãy dùng `TopicLink` để người học có thể quay lại ôn nếu chưa hiểu.

**Cách dùng:**
\`\`\`tsx
import { TopicLink } from "@/components/interactive";

// Trong nội dung bài học:
<p>
  Khi gradient truyền qua nhiều lớp, nó có thể bị triệt tiêu — gọi là{" "}
  <TopicLink slug="vanishing-exploding-gradients">vanishing gradient</TopicLink>.
</p>
\`\`\`

**Quy tắc:**
- Chỉ link lần đầu xuất hiện trong bài — không link lặp lại cùng thuật ngữ
- `slug` phải tồn tại trong `registry.ts` — component sẽ cảnh báo nếu không tìm thấy
- `children` là text hiển thị, có thể khác tên topic gốc
- Ưu tiên link các khái niệm tiên quyết (prerequisite) hơn các khái niệm nâng cao
```

---

### 1.2 `LearningObjectivesModal` Component

**File:** `src/components/paths/LearningObjectivesModal.tsx`

A modal triggered by a button on each learning path page.

**Trigger button:**
- Label: "Mục tiêu học tập"
- Style: secondary/outline button with `BookOpen` icon (Lucide)
- Position: top of path page, near the path title/description area

**Modal sections (scrollable):**

| # | Section | Vietnamese | Content |
|---|---------|-----------|---------|
| 1 | Who is this for? | Dành cho ai? | 2-3 sentences describing target audience |
| 2 | Prerequisites | Điều kiện tiên quyết | What to know before starting (or "Không cần") |
| 3 | What you'll learn | Bạn sẽ học được gì? | Stage-by-stage learning objectives as a list |
| 4 | After completing | Sau khi hoàn thành | 3-5 concrete outcomes |
| 5 | Estimated time | Thời gian ước tính | Per stage and total |
| 6 | Next path | Lộ trình tiếp theo | Which path to take after this one |

**Data structure:**
```typescript
interface PathObjectives {
  audience: string;
  prerequisites: string;
  stageObjectives: { stage: string; objectives: string[] }[];
  outcomes: string[];
  estimatedTime: { stage: string; hours: number }[];
  nextPath: { slug: string; label: string } | null;
}
```

Each path page file defines a `pathObjectives` constant that the modal consumes. Kept local to each path page (not in registry).

---

### 1.3 `QuizSection` — Extended Question Types

**File:** `src/components/topic/QuizSection.tsx` (modify existing)

Currently all quizzes are 3 MCQ questions with identical format. Extend to support a discriminated union of question types within the same quiz flow.

**New question types (added via discriminated union):**

```typescript
// Existing — unchanged
interface MCQQuestion {
  type?: "mcq";           // Default, backwards-compatible (omitted = mcq)
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

// New — fill in the blank
interface FillBlankQuestion {
  type: "fill-blank";
  question: string;       // Contains {blank} placeholder(s)
  blanks: { answer: string; accept?: string[] }[];  // accept = alternative correct answers
  explanation?: string;
}

// New — code completion
interface CodeQuestion {
  type: "code";
  question: string;
  codeTemplate: string;   // Code with ___ blanks
  language: string;
  blanks: { answer: string; accept?: string[] }[];
  explanation?: string;
}

export type QuizQuestion = MCQQuestion | FillBlankQuestion | CodeQuestion;
```

**Rendering behavior:**
- MCQ: current behavior (no changes)
- Fill-blank: renders the question with inline text inputs at `{blank}` positions. Check button validates. Case-insensitive matching. `accept` array for alternative correct answers (e.g., "ReLU" and "relu")
- Code: renders a code block with editable `___` blanks as inline inputs. Same check/validate flow.

**Scoring:** all question types contribute equally to the final score.

**Backwards compatibility:** existing topics with `QuizQuestion[]` (no `type` field) continue working unchanged — `type` defaults to `"mcq"`.

**Per-path quiz guidelines (for content editing phase):**
- **Student math topics:** use `fill-blank` for formulas and equations
- **Student ML/NN topics:** 5-7 questions mixing MCQ + fill-blank
- **Engineer topics:** use `code` for implementation questions
- **Office topics:** MCQ with scenario-based questions (longer question text, practical workplace situations)

---

## Phase 2: Student Path Restructuring

### Current (4 stages, 27 topics):
```
Stage 1: Nền tảng toán (4) — linear-algebra-for-ml, probability-statistics, calculus-for-backprop, information-theory
Stage 2: ML cơ bản (12) — supervised-unsupervised-rl, linear-regression, logistic-regression, decision-trees, k-means, knn, naive-bayes, bias-variance, overfitting-underfitting, cross-validation, confusion-matrix, train-val-test
Stage 3: Mạng nơ-ron (9) — perceptron, mlp, activation-functions, forward-propagation, backpropagation, gradient-descent, loss-functions, epochs-batches, neural-network-overview
Stage 4: Kỹ năng thực hành (2) — data-preprocessing, feature-engineering
```

### Proposed (5 stages, 32 topics):

**Stage 0: "Giới thiệu" (1 topic — NEW)**
- `what-is-ml` *(new)* — What ML is, what problems it solves, how it differs from traditional programming

**Stage 1: "Nền tảng toán" (3 topics — information-theory moved to Stage 2)**
- `linear-algebra-for-ml`, `probability-statistics`, `calculus-for-backprop`

**Stage 2: "ML cơ bản" (13 topics — reordered, information-theory moved here before decision-trees)**
- Supervised: `supervised-unsupervised-rl` → `linear-regression` → `logistic-regression` → `information-theory` → `decision-trees` → `knn` → `naive-bayes`
- Unsupervised: `k-means`
- Evaluation: `confusion-matrix` → `bias-variance` → `overfitting-underfitting` → `cross-validation` → `train-val-test`

**Stage 3: "Mạng nơ-ron" (9 topics — neural-network-overview moved from last to first)**
- `neural-network-overview` → `perceptron` → `mlp` → `activation-functions` → `forward-propagation` → `backpropagation` → `gradient-descent` → `loss-functions` → `epochs-batches`

**Stage 4: "Kỹ năng thực hành" (6 topics — expanded from 2 with 4 new topics)**
- `data-preprocessing`, `feature-engineering`
- `python-for-ml` *(new)* — NumPy, Pandas, Matplotlib essentials
- `model-evaluation-selection` *(new)* — How to pick the right algorithm
- `jupyter-colab-workflow` *(new)* — Practical tooling for ML experiments
- `end-to-end-ml-project` *(new)* — Capstone: load → preprocess → train → evaluate → interpret

**Changes summary:** 1 new stage added, 5 new topics created, 1 topic moved (information-theory), 2 stages reordered internally. Total: 27 → 32 topics.

---

## Phase 3: Per-Topic Edits (Student Path)

For each existing topic in the Student path, apply this checklist:

| # | Step | Description |
|---|------|-------------|
| 1 | **TopicLink insertion** | Add `<TopicLink>` wherever terms reference other lessons. Link only the first occurrence per term per topic. |
| 2 | **Wire up underutilized components** | Use audit recommendations to add DragDrop, MatchPairs, FillBlank, BuildUp, StepReveal, SliderGroup, ToggleCompare, etc. where pedagogically appropriate. |
| 3 | **Add missing interactive exercises** | Per audit: each topic should have at least one manipulation exercise beyond MCQ. |
| 4 | **Vietnamese real-world example** | Add at least one Vietnamese company/product example or use case if missing. |
| 5 | **Fix bugs** | TOTAL_STEPS mismatches, unused imports, missing sections. |
| 6 | **Update relatedSlugs** | Adjust if audit suggests better cross-references. |

### Specific audit recommendations per reviewed topic:

**bias-variance.tsx (A-):**
- Wire up imported but unused `ToggleCompare` (underfitting vs overfitting visualization)
- Add `DragDrop` diagnostic exercise (match symptoms to diagnosis)
- Add Vietnamese example (HCMC house price prediction)
- Fix TOTAL_STEPS after adding new section

**Other topics** in the Student path will follow the same pattern, using audit findings where available and the general checklist where not specifically reviewed.

---

## Execution Order

```
1. Build TopicLink component + add to interactive/index.ts
2. Build LearningObjectivesModal component
3. Extend QuizSection with fill-blank and code question types
4. Update CONTRIBUTING.md with TopicLink + quiz type contributor guides
5. Add LearningObjectivesModal + pathObjectives to Student path page
6. Restructure Student path stages (reorder slugs in page.tsx)
7. Create 5 new topic files for Student path (what-is-ml, python-for-ml, model-evaluation-selection, jupyter-colab-workflow, end-to-end-ml-project)
8. Edit each existing Student path topic (TopicLink + audit fixes + quiz variety)
9. Repeat steps 5-8 for Engineer, Researcher, Office paths
```

---

## Out of Scope (for now)

- Auto-linking utility (chose manual TopicLink approach)
- Spaced repetition / review mechanism
- ~~Quiz format variety~~ — moved into Phase 1 (section 1.3)
- Cross-path prerequisite indicators
- Separate intro page per path (chose modal approach)
- Other 3 paths (Engineer, Researcher, Office) — future iterations
