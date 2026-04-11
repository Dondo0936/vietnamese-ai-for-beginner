# Brilliant-Level Topic Upgrade — Design Spec

> Date: 2026-04-11
> Status: Approved
> Scope: Full rebuild of all 185 topic lessons + interaction primitive library + agent-friendly contributor system

## 1. Problem

Current topics follow a passive 3-section pattern (Analogy → Visualization → Explanation). Users read and watch but don't discover, manipulate, or get tested. This produces textbook-quality content, not Brilliant/Duolingo-quality interactive lessons.

## 2. Solution

### 2.1 Interaction Primitives Library

Build ~20 reusable React components in `src/components/interactive/` that any topic can compose freely.

**Discovery Primitives:**
- `PredictionGate` — Question + options. User predicts before seeing answer. Gates next content.
- `StepReveal` — Content appears one chunk at a time via "Tiếp tục" button.
- `BuildUp` — Visualization starts empty, each step adds one element with animation.

**Manipulation Primitives:**
- `DragDrop` — Drag items into labeled target zones. Validates placement.
- `Reorderable` — Sortable list via drag. Shows correctness.
- `SliderGroup` — Multiple interconnected sliders driving a shared visualization.
- `ToggleCompare` — Flip between two states of the same visualization.
- `MatrixEditor` — Editable grid of numbers with downstream visualization.
- `CanvasPlayground` — 2D canvas for placing/drawing with coordinate tracking.

**Assessment Primitives:**
- `InlineChallenge` — 1-2 question mini-quiz embedded mid-lesson. Immediate feedback.
- `MatchPairs` — Connect items from column A to column B via click/tap.
- `SortChallenge` — Put items in correct order via drag.
- `FillBlank` — Formula/sentence with blanks. User selects or types answer.

**Feedback Primitives:**
- `AhaMoment` — Animated reveal card naming the concept after discovery.
- `ProgressSteps` — "Bước 3/7" with visual dots.
- `Callout` — Highlighted box. Variants: tip, warning, insight, fun-fact.
- `MiniSummary` — Compact card with 3-5 bullet takeaways.

**Layout Primitives:**
- `SplitView` ��� Side-by-side comparison, stacks on mobile.
- `TabView` — Tabbed content panels.
- `CollapsibleDetail` — Expand/collapse for optional deep-dive.
- `CodeBlock` — Syntax-highlighted code with copy button and language tabs.

### 2.2 Topic File Pattern

Each topic is a free-form `.tsx` file. No enforced structure, but the **golden rule** applies: user discovers before being told.

**Recommended flow:**
```
HOOK → DISCOVER → REVEAL → DEEPEN → CHALLENGE → EXPLAIN → CONNECT → QUIZ
```

Contributors compose primitives freely. Could be 4 steps or 12. The primitives are tools, not rails.

**Existing components preserved:**
- `AnalogyCard` — Optional, some topics use PredictionGate instead
- `VisualizationSection` — Wrapper for custom viz, no longer the only interactive section
- `ExplanationSection` — Moves later in flow (after discovery)
- `QuizSection` — Required at end of every topic
- `TopicLayout` — Updated to render any children without rigid section assumption

### 2.3 Agent-First Contributor System

Three artifacts designed for AI coding agents:

**`CONTRIBUTING.md`** — Written as agent instructions. When a domain expert pastes "build a topic about [X]" into their AI assistant, the agent reads CONTRIBUTING.md and produces a correct topic. Includes:
- Exact file paths and naming conventions
- Step-by-step agent workflow
- A "prompt template" domain experts can paste to their AI
- PR checklist as a verifiable list
- Anti-patterns with explicit "DO NOT" instructions

**`src/topics/_template.tsx`** — Copy-paste starter with labeled sections and inline comments explaining each slot.

**`docs/primitives.md`** — Complete reference for all ~20 primitives. For each: props interface, minimal example, when to use, do/don't.

### 2.4 Upgrade Strategy

**Phase 1 — Primitives:** Build all ~20 interaction components.

**Phase 2 — Exemplars:** Rewrite 10 representative topics to highest quality. These become the reference implementations:
1. `perceptron` (beginner, discovery flow)
2. `gradient-descent` (beginner, user-as-optimizer)
3. `transformer` (intermediate, highest importance)
4. `backpropagation` (intermediate, animation → hands-on)
5. `k-means` (beginner, canvas playground)
6. `confusion-matrix` (beginner, gamification)
7. `rag` (intermediate, pipeline discovery)
8. `gan` (advanced, adversarial gameplay)
9. `bert` (intermediate, static → interactive)
10. `diffusion-models` (advanced, progressive reveal)

**Phase 3 — Batch rewrite:** Remaining 175 topics in batches of ~8, parallelized by category, using exemplars as reference.

## 3. File Structure

```
src/components/interactive/
  PredictionGate.tsx
  StepReveal.tsx
  BuildUp.tsx
  DragDrop.tsx
  Reorderable.tsx
  SliderGroup.tsx
  ToggleCompare.tsx
  MatrixEditor.tsx
  CanvasPlayground.tsx
  InlineChallenge.tsx
  MatchPairs.tsx
  SortChallenge.tsx
  FillBlank.tsx
  AhaMoment.tsx
  ProgressSteps.tsx
  Callout.tsx
  MiniSummary.tsx
  SplitView.tsx
  TabView.tsx
  CollapsibleDetail.tsx
  CodeBlock.tsx
  index.ts              # barrel export

src/topics/
  _template.tsx          # contributor starter
  [185 topic files]      # rewritten

docs/
  primitives.md          # component reference
CONTRIBUTING.md          # agent-first guide
```

## 4. Non-Goals

- Learning paths / prerequisite graphs (deferred)
- User accounts / login (stay anonymous)
- Backend quiz scoring / leaderboards
- Video content
- i18n beyond Vietnamese
