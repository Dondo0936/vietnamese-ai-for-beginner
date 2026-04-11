# Phase 1: Interaction Primitives & Contributor System

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete interaction primitive library (~20 components) and agent-first contributor system (CONTRIBUTING.md, template, primitives reference) so that Phase 2-3 topic rewrites can begin.

**Architecture:** All primitives are client components in `src/components/interactive/`. Each is self-contained with no cross-dependencies between primitives. They share common styling via Tailwind + CSS variables from `globals.css`. A barrel `index.ts` re-exports everything for clean imports. Contributor docs are written as agent-consumable instructions.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Framer Motion 12, Next.js 16 (client components only for primitives)

---

## File Map

```
src/components/interactive/
  PredictionGate.tsx      — Discovery: predict-before-reveal gate
  StepReveal.tsx          — Discovery: progressive content reveal
  BuildUp.tsx             — Discovery: additive visualization steps
  DragDrop.tsx            — Manipulation: drag items to zones
  Reorderable.tsx         — Manipulation: sortable list
  SliderGroup.tsx         — Manipulation: linked sliders + shared viz
  ToggleCompare.tsx       — Manipulation: A/B state toggle
  MatrixEditor.tsx        — Manipulation: editable number grid
  CanvasPlayground.tsx    — Manipulation: 2D click/place canvas
  InlineChallenge.tsx     — Assessment: mid-lesson mini-quiz
  MatchPairs.tsx          — Assessment: connect A↔B
  SortChallenge.tsx       — Assessment: order items correctly
  FillBlank.tsx           — Assessment: fill gaps in formula/text
  AhaMoment.tsx           — Feedback: animated concept reveal
  ProgressSteps.tsx       — Feedback: lesson step indicator
  Callout.tsx             — Feedback: highlighted box (tip/warning/insight)
  MiniSummary.tsx         — Feedback: key takeaways card
  SplitView.tsx           — Layout: side-by-side responsive
  TabView.tsx             — Layout: tabbed panels
  CollapsibleDetail.tsx   — Layout: expand/collapse
  CodeBlock.tsx           — Layout: syntax-highlighted code
  index.ts                — Barrel export

src/topics/_template.tsx  — Contributor starter file

CONTRIBUTING.md           — Agent-first contributor guide
docs/primitives.md        — Complete primitive reference
```

---

### Task 1: Project scaffolding

**Files:**
- Create: `src/components/interactive/index.ts`

- [ ] **Step 1: Create the interactive components directory and barrel file**

```ts
// src/components/interactive/index.ts
// Barrel export — add each primitive as it's built

// Discovery
export { default as PredictionGate } from "./PredictionGate";
export { default as StepReveal } from "./StepReveal";
export { default as BuildUp } from "./BuildUp";

// Manipulation
export { default as DragDrop } from "./DragDrop";
export { default as Reorderable } from "./Reorderable";
export { default as SliderGroup } from "./SliderGroup";
export { default as ToggleCompare } from "./ToggleCompare";
export { default as MatrixEditor } from "./MatrixEditor";
export { default as CanvasPlayground } from "./CanvasPlayground";

// Assessment
export { default as InlineChallenge } from "./InlineChallenge";
export { default as MatchPairs } from "./MatchPairs";
export { default as SortChallenge } from "./SortChallenge";
export { default as FillBlank } from "./FillBlank";

// Feedback
export { default as AhaMoment } from "./AhaMoment";
export { default as ProgressSteps } from "./ProgressSteps";
export { default as Callout } from "./Callout";
export { default as MiniSummary } from "./MiniSummary";

// Layout
export { default as SplitView } from "./SplitView";
export { default as TabView } from "./TabView";
export { default as CollapsibleDetail } from "./CollapsibleDetail";
export { default as CodeBlock } from "./CodeBlock";
```

Note: This file will have import errors until each component is built. That's expected — update it as you build each component and only verify the build after all primitives in a batch are complete.

- [ ] **Step 2: Commit**

```bash
git add src/components/interactive/index.ts
git commit -m "chore: scaffold interactive primitives barrel export"
```

---

### Task 2: Discovery Primitives — PredictionGate

**Files:**
- Create: `src/components/interactive/PredictionGate.tsx`

- [ ] **Step 1: Build PredictionGate**

This component shows a question, options the user picks from, then reveals whether they were right with an explanation. It "gates" the rest of the lesson — content below it only appears after the user commits an answer.

```tsx
// src/components/interactive/PredictionGate.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, CheckCircle2, XCircle, ChevronDown } from "lucide-react";

interface PredictionGateProps {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  children?: React.ReactNode; // Content gated behind the answer
}

export default function PredictionGate({
  question,
  options,
  correct,
  explanation,
  children,
}: PredictionGateProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  function handleSelect(index: number) {
    if (revealed) return;
    setSelected(index);
  }

  function handleReveal() {
    if (selected === null) return;
    setRevealed(true);
  }

  const isCorrect = selected === correct;

  return (
    <div className="my-8">
      {/* Question */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start gap-3 mb-4">
          <HelpCircle size={20} className="text-accent shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-foreground leading-relaxed">
            {question}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-2 mb-4">
          {options.map((opt, i) => {
            let cls =
              "w-full text-left rounded-lg border px-4 py-3 text-sm transition-all ";
            if (revealed) {
              if (i === correct) cls += "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400";
              else if (i === selected) cls += "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400";
              else cls += "border-border text-muted opacity-50";
            } else if (i === selected) {
              cls += "border-accent bg-accent-light text-foreground";
            } else {
              cls += "border-border text-foreground hover:border-accent/50 cursor-pointer";
            }

            return (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(i)}
                disabled={revealed}
                className={cls}
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-medium text-muted">
                    {revealed && i === correct ? (
                      <CheckCircle2 size={14} className="text-green-500" />
                    ) : revealed && i === selected ? (
                      <XCircle size={14} className="text-red-500" />
                    ) : (
                      String.fromCharCode(65 + i)
                    )}
                  </span>
                  {opt}
                </span>
              </button>
            );
          })}
        </div>

        {/* Reveal button */}
        {!revealed && (
          <button
            type="button"
            onClick={handleReveal}
            disabled={selected === null}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-all hover:bg-accent-dark disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Kiểm tra
          </button>
        )}

        {/* Result + explanation */}
        <AnimatePresence>
          {revealed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
              className="mt-4"
            >
              <div
                className={`rounded-lg p-3 text-sm leading-relaxed ${
                  isCorrect
                    ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                    : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                }`}
              >
                <span className="font-medium">
                  {isCorrect ? "Chính xác! " : "Chưa đúng. "}
                </span>
                {explanation}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Gated content — only shows after reveal */}
      <AnimatePresence>
        {revealed && children && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Continue hint */}
      {revealed && children && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center mt-2"
        >
          <ChevronDown size={16} className="text-muted animate-bounce" />
        </motion.div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/interactive/PredictionGate.tsx
git commit -m "feat: add PredictionGate interactive primitive"
```

---

### Task 3: Discovery Primitives — StepReveal

**Files:**
- Create: `src/components/interactive/StepReveal.tsx`

- [ ] **Step 1: Build StepReveal**

This component wraps multiple children and reveals them one at a time. Each child is a "step". User clicks "Tiếp tục" to advance. Shows step counter.

```tsx
// src/components/interactive/StepReveal.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, RotateCcw } from "lucide-react";

interface StepRevealProps {
  children: React.ReactNode[];
  labels?: string[]; // Optional label per step
}

export default function StepReveal({ children, labels }: StepRevealProps) {
  const [current, setCurrent] = useState(0);
  const steps = Array.isArray(children) ? children : [children];
  const total = steps.length;

  return (
    <div className="my-6">
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i <= current ? "w-8 bg-accent" : "w-4 bg-surface"
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-muted">
          {labels?.[current] ?? `Bước ${current + 1}/${total}`}
        </span>
      </div>

      {/* Visible steps */}
      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {steps.slice(0, current + 1).map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i === current ? 0.1 : 0 }}
            >
              {step}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 mt-4">
        {current < total - 1 ? (
          <button
            type="button"
            onClick={() => setCurrent((c) => c + 1)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark"
          >
            Tiếp tục
            <ChevronRight size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCurrent(0)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            <RotateCcw size={14} />
            Xem lại
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/interactive/StepReveal.tsx
git commit -m "feat: add StepReveal interactive primitive"
```

---

### Task 4: Discovery Primitives — BuildUp

**Files:**
- Create: `src/components/interactive/BuildUp.tsx`

- [ ] **Step 1: Build BuildUp**

Wrapper that shows children one at a time with additive reveal (previous steps stay visible, each new step animates in). Good for building a diagram piece by piece.

```tsx
// src/components/interactive/BuildUp.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, RotateCcw } from "lucide-react";

interface BuildUpProps {
  children: React.ReactNode[];
  labels?: string[];
  addLabel?: string; // Button text, defaults to "Thêm"
}

export default function BuildUp({
  children,
  labels,
  addLabel = "Thêm",
}: BuildUpProps) {
  const [visible, setVisible] = useState(1);
  const steps = Array.isArray(children) ? children : [children];
  const total = steps.length;

  return (
    <div className="my-6">
      {/* All visible steps stay rendered */}
      <div className="space-y-3">
        {steps.slice(0, visible).map((step, i) => (
          <motion.div
            key={i}
            initial={i === visible - 1 && i > 0 ? { opacity: 0, scale: 0.95 } : false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {labels?.[i] && (
              <span className="text-xs font-medium text-accent mb-1 block">
                {labels[i]}
              </span>
            )}
            {step}
          </motion.div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 mt-4">
        {visible < total && (
          <button
            type="button"
            onClick={() => setVisible((v) => v + 1)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark"
          >
            <Plus size={14} />
            {addLabel}
          </button>
        )}
        {visible > 1 && (
          <button
            type="button"
            onClick={() => setVisible(1)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            <RotateCcw size={14} />
            Bắt đầu lại
          </button>
        )}
        <span className="text-xs text-muted ml-auto">
          {visible}/{total}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/interactive/BuildUp.tsx
git commit -m "feat: add BuildUp interactive primitive"
```

---

### Task 5: Manipulation Primitives — SliderGroup

**Files:**
- Create: `src/components/interactive/SliderGroup.tsx`

- [ ] **Step 1: Build SliderGroup**

Multiple labeled sliders that share a visualization area. When any slider changes, the visualization re-renders. The visualization is passed as a render prop receiving all current slider values.

```tsx
// src/components/interactive/SliderGroup.tsx
"use client";

import { useState, useCallback } from "react";

export interface SliderConfig {
  key: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  defaultValue: number;
  unit?: string;
}

interface SliderGroupProps {
  sliders: SliderConfig[];
  visualization: (values: Record<string, number>) => React.ReactNode;
  title?: string;
}

export default function SliderGroup({
  sliders,
  visualization,
  title,
}: SliderGroupProps) {
  const [values, setValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const s of sliders) init[s.key] = s.defaultValue;
    return init;
  });

  const updateValue = useCallback((key: string, value: number) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  return (
    <div className="my-6 rounded-xl border border-border bg-card p-5">
      {title && (
        <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>
      )}

      {/* Visualization area */}
      <div className="mb-5">{visualization(values)}</div>

      {/* Sliders */}
      <div className="space-y-4">
        {sliders.map((s) => (
          <div key={s.key}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-muted">
                {s.label}
              </label>
              <span className="text-xs font-mono text-accent">
                {values[s.key].toFixed(s.step && s.step < 1 ? 2 : 0)}
                {s.unit ?? ""}
              </span>
            </div>
            <input
              type="range"
              min={s.min}
              max={s.max}
              step={s.step ?? 1}
              value={values[s.key]}
              onChange={(e) => updateValue(s.key, parseFloat(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-surface accent-accent cursor-pointer"
            />
            <div className="flex justify-between mt-0.5">
              <span className="text-[10px] text-tertiary">{s.min}</span>
              <span className="text-[10px] text-tertiary">{s.max}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/interactive/SliderGroup.tsx
git commit -m "feat: add SliderGroup interactive primitive"
```

---

### Task 6: Manipulation Primitives — ToggleCompare, DragDrop, Reorderable

**Files:**
- Create: `src/components/interactive/ToggleCompare.tsx`
- Create: `src/components/interactive/DragDrop.tsx`
- Create: `src/components/interactive/Reorderable.tsx`

- [ ] **Step 1: Build ToggleCompare**

A/B toggle showing two different states of the same visualization.

```tsx
// src/components/interactive/ToggleCompare.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface ToggleCompareProps {
  labelA: string;
  labelB: string;
  childA: React.ReactNode;
  childB: React.ReactNode;
  description?: string;
}

export default function ToggleCompare({
  labelA,
  labelB,
  childA,
  childB,
  description,
}: ToggleCompareProps) {
  const [showB, setShowB] = useState(false);

  return (
    <div className="my-6 rounded-xl border border-border bg-card p-5">
      {/* Toggle */}
      <div className="flex items-center justify-center gap-1 mb-4">
        <button
          type="button"
          onClick={() => setShowB(false)}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
            !showB ? "bg-accent text-white" : "text-muted hover:text-foreground"
          }`}
        >
          {labelA}
        </button>
        <button
          type="button"
          onClick={() => setShowB(true)}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
            showB ? "bg-accent text-white" : "text-muted hover:text-foreground"
          }`}
        >
          {labelB}
        </button>
      </div>

      {description && (
        <p className="text-xs text-muted text-center mb-4">{description}</p>
      )}

      {/* Content */}
      <motion.div
        key={showB ? "b" : "a"}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {showB ? childB : childA}
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Build DragDrop**

Items that can be dragged into labeled drop zones. Uses pointer events (no external library).

```tsx
// src/components/interactive/DragDrop.tsx
"use client";

import { useState, useRef } from "react";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";

export interface DragItem {
  id: string;
  label: string;
}

export interface DropZone {
  id: string;
  label: string;
  accepts: string[]; // IDs of correct items
}

interface DragDropProps {
  items: DragItem[];
  zones: DropZone[];
  instruction?: string;
  onComplete?: (correct: boolean) => void;
}

export default function DragDrop({
  items,
  zones,
  instruction,
  onComplete,
}: DragDropProps) {
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const dragRef = useRef<string | null>(null);

  const placedItems = new Set(Object.keys(placements));
  const unplaced = items.filter((item) => !placedItems.has(item.id));

  function handleDragStart(itemId: string) {
    dragRef.current = itemId;
  }

  function handleDrop(zoneId: string) {
    if (!dragRef.current) return;
    setPlacements((prev) => ({ ...prev, [dragRef.current!]: zoneId }));
    dragRef.current = null;
  }

  function handleCheck() {
    setChecked(true);
    const allCorrect = zones.every((zone) => {
      const placed = Object.entries(placements)
        .filter(([, z]) => z === zone.id)
        .map(([id]) => id);
      return (
        placed.length === zone.accepts.length &&
        placed.every((id) => zone.accepts.includes(id))
      );
    });
    onComplete?.(allCorrect);
  }

  function reset() {
    setPlacements({});
    setChecked(false);
    dragRef.current = null;
  }

  function isCorrectPlacement(itemId: string, zoneId: string) {
    const zone = zones.find((z) => z.id === zoneId);
    return zone?.accepts.includes(itemId) ?? false;
  }

  return (
    <div className="my-6 rounded-xl border border-border bg-card p-5">
      {instruction && (
        <p className="text-sm text-muted mb-4">{instruction}</p>
      )}

      {/* Unplaced items */}
      {unplaced.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 p-3 rounded-lg bg-surface min-h-[48px]">
          {unplaced.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => handleDragStart(item.id)}
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground cursor-grab active:cursor-grabbing hover:border-accent transition-colors select-none"
            >
              {item.label}
            </div>
          ))}
        </div>
      )}

      {/* Drop zones */}
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(zones.length, 3)}, 1fr)` }}>
        {zones.map((zone) => {
          const zoneItems = Object.entries(placements)
            .filter(([, z]) => z === zone.id)
            .map(([id]) => items.find((i) => i.id === id)!);

          return (
            <div
              key={zone.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(zone.id)}
              className="rounded-lg border-2 border-dashed border-border p-3 min-h-[80px] transition-colors hover:border-accent/50"
            >
              <span className="text-xs font-medium text-muted block mb-2">
                {zone.label}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {zoneItems.map((item) => (
                  <span
                    key={item.id}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                      checked
                        ? isCorrectPlacement(item.id, zone.id)
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-accent-light text-accent-dark"
                    }`}
                  >
                    {item.label}
                    {checked && (
                      isCorrectPlacement(item.id, zone.id)
                        ? <CheckCircle2 size={12} className="inline ml-1" />
                        : <XCircle size={12} className="inline ml-1" />
                    )}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex gap-2 mt-4">
        {!checked && (
          <button
            type="button"
            onClick={handleCheck}
            disabled={unplaced.length > 0}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Kiểm tra
          </button>
        )}
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground"
        >
          <RotateCcw size={14} className="inline mr-1" />
          Làm lại
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Build Reorderable**

A list of items the user reorders by dragging. Validates correct order.

```tsx
// src/components/interactive/Reorderable.tsx
"use client";

import { useState, useRef } from "react";
import { GripVertical, CheckCircle2, XCircle, RotateCcw } from "lucide-react";

interface ReorderableProps {
  items: string[];
  correctOrder: number[]; // Indices into items array defining correct order
  instruction?: string;
}

export default function Reorderable({
  items,
  correctOrder,
  instruction,
}: ReorderableProps) {
  const [order, setOrder] = useState(() =>
    items.map((_, i) => i).sort(() => Math.random() - 0.5)
  );
  const [checked, setChecked] = useState(false);
  const dragIdx = useRef<number | null>(null);

  function handleDragStart(index: number) {
    dragIdx.current = index;
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === index) return;
    setOrder((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx.current!, 1);
      next.splice(index, 0, moved);
      dragIdx.current = index;
      return next;
    });
  }

  const isCorrect = order.every((val, i) => val === correctOrder[i]);

  return (
    <div className="my-6 rounded-xl border border-border bg-card p-5">
      {instruction && (
        <p className="text-sm text-muted mb-4">{instruction}</p>
      )}

      <div className="space-y-2">
        {order.map((itemIndex, i) => {
          let cls =
            "flex items-center gap-3 rounded-lg border px-4 py-3 text-sm select-none transition-all ";
          if (checked) {
            cls += itemIndex === correctOrder[i]
              ? "border-green-500 bg-green-50 dark:bg-green-900/20"
              : "border-red-500 bg-red-50 dark:bg-red-900/20";
          } else {
            cls += "border-border bg-card cursor-grab active:cursor-grabbing hover:border-accent/50";
          }

          return (
            <div
              key={itemIndex}
              draggable={!checked}
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              className={cls}
            >
              <GripVertical size={14} className="text-tertiary shrink-0" />
              <span className="flex-1 text-foreground">{items[itemIndex]}</span>
              {checked && (
                itemIndex === correctOrder[i]
                  ? <CheckCircle2 size={16} className="text-green-500" />
                  : <XCircle size={16} className="text-red-500" />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 mt-4">
        {!checked && (
          <button
            type="button"
            onClick={() => setChecked(true)}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark"
          >
            Kiểm tra
          </button>
        )}
        {checked && !isCorrect && (
          <button
            type="button"
            onClick={() => { setChecked(false); setOrder(items.map((_, i) => i).sort(() => Math.random() - 0.5)); }}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground"
          >
            <RotateCcw size={14} className="inline mr-1" />
            Thử lại
          </button>
        )}
        {checked && isCorrect && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400">
            <CheckCircle2 size={16} /> Chính xác!
          </span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/interactive/ToggleCompare.tsx src/components/interactive/DragDrop.tsx src/components/interactive/Reorderable.tsx
git commit -m "feat: add ToggleCompare, DragDrop, Reorderable primitives"
```

---

### Task 7: Manipulation Primitives — MatrixEditor, CanvasPlayground

**Files:**
- Create: `src/components/interactive/MatrixEditor.tsx`
- Create: `src/components/interactive/CanvasPlayground.tsx`

- [ ] **Step 1: Build MatrixEditor**

An editable grid of numbers. User clicks a cell to modify it. Changes propagate to a visualization via render prop.

```tsx
// src/components/interactive/MatrixEditor.tsx
"use client";

import { useState, useCallback } from "react";

interface MatrixEditorProps {
  initialData: number[][];
  rowLabels?: string[];
  colLabels?: string[];
  min?: number;
  max?: number;
  step?: number;
  visualization?: (data: number[][]) => React.ReactNode;
  onChange?: (data: number[][]) => void;
}

export default function MatrixEditor({
  initialData,
  rowLabels,
  colLabels,
  min = -10,
  max = 10,
  step = 0.1,
  visualization,
  onChange,
}: MatrixEditorProps) {
  const [data, setData] = useState(initialData);

  const updateCell = useCallback(
    (row: number, col: number, value: number) => {
      setData((prev) => {
        const next = prev.map((r) => [...r]);
        next[row][col] = value;
        onChange?.(next);
        return next;
      });
    },
    [onChange]
  );

  return (
    <div className="my-6 rounded-xl border border-border bg-card p-5">
      {visualization && <div className="mb-4">{visualization(data)}</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-center">
          {colLabels && (
            <thead>
              <tr>
                {rowLabels && <th />}
                {colLabels.map((label, i) => (
                  <th key={i} className="px-2 py-1 text-[10px] font-medium text-tertiary">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {data.map((row, ri) => (
              <tr key={ri}>
                {rowLabels && (
                  <td className="pr-2 text-[10px] font-medium text-tertiary text-right">
                    {rowLabels[ri]}
                  </td>
                )}
                {row.map((val, ci) => (
                  <td key={ci} className="p-1">
                    <input
                      type="number"
                      min={min}
                      max={max}
                      step={step}
                      value={val}
                      onChange={(e) => updateCell(ri, ci, parseFloat(e.target.value) || 0)}
                      className="w-16 rounded border border-border bg-surface px-2 py-1 text-center text-xs font-mono text-foreground focus:border-accent focus:outline-none"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build CanvasPlayground**

A 2D SVG canvas where users click to place points. Reports coordinates to parent. Optional grid lines.

```tsx
// src/components/interactive/CanvasPlayground.tsx
"use client";

import { useState, useRef, useCallback } from "react";
import { RotateCcw } from "lucide-react";

export interface Point {
  x: number;
  y: number;
  label?: string;
  color?: string;
}

interface CanvasPlaygroundProps {
  width?: number;
  height?: number;
  showGrid?: boolean;
  points: Point[];
  onAddPoint?: (point: Point) => void;
  onReset?: () => void;
  overlay?: (points: Point[]) => React.ReactNode; // SVG elements rendered on top
  instruction?: string;
  nextColor?: string;
  nextLabel?: string;
}

export default function CanvasPlayground({
  width = 400,
  height = 300,
  showGrid = true,
  points,
  onAddPoint,
  onReset,
  overlay,
  instruction,
  nextColor = "#14B8A6",
  nextLabel,
}: CanvasPlaygroundProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!onAddPoint || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * width;
      const y = ((e.clientY - rect.top) / rect.height) * height;
      onAddPoint({ x, y, color: nextColor, label: nextLabel });
    },
    [onAddPoint, width, height, nextColor, nextLabel]
  );

  return (
    <div className="my-6">
      {instruction && (
        <p className="text-sm text-muted mb-3">{instruction}</p>
      )}
      <div className="rounded-xl border border-border bg-card p-2 inline-block">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full cursor-crosshair"
          style={{ maxWidth: width }}
          onClick={handleClick}
        >
          {/* Grid */}
          {showGrid &&
            Array.from({ length: Math.floor(width / 40) + 1 }, (_, i) => (
              <line
                key={`v${i}`}
                x1={i * 40} y1={0} x2={i * 40} y2={height}
                stroke="var(--border)" strokeWidth={0.5}
              />
            ))}
          {showGrid &&
            Array.from({ length: Math.floor(height / 40) + 1 }, (_, i) => (
              <line
                key={`h${i}`}
                x1={0} y1={i * 40} x2={width} y2={i * 40}
                stroke="var(--border)" strokeWidth={0.5}
              />
            ))}

          {/* Overlay from parent */}
          {overlay?.(points)}

          {/* Points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x} cy={p.y} r={5}
                fill={p.color ?? "#14B8A6"}
                stroke="var(--bg-card)" strokeWidth={1.5}
              />
              {p.label && (
                <text
                  x={p.x + 8} y={p.y + 4}
                  fontSize={10} fill="var(--text-secondary)"
                >
                  {p.label}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground"
        >
          <RotateCcw size={12} />
          Xóa hết
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/interactive/MatrixEditor.tsx src/components/interactive/CanvasPlayground.tsx
git commit -m "feat: add MatrixEditor and CanvasPlayground primitives"
```

---

### Task 8: Assessment Primitives — InlineChallenge, MatchPairs, SortChallenge, FillBlank

**Files:**
- Create: `src/components/interactive/InlineChallenge.tsx`
- Create: `src/components/interactive/MatchPairs.tsx`
- Create: `src/components/interactive/SortChallenge.tsx`
- Create: `src/components/interactive/FillBlank.tsx`

- [ ] **Step 1: Build InlineChallenge**

A lightweight mid-lesson quiz (1-2 questions). Simpler than QuizSection — no scoring, no progress bar, just quick knowledge check with immediate feedback.

```tsx
// src/components/interactive/InlineChallenge.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";

interface InlineChallengeProps {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

export default function InlineChallenge({
  question,
  options,
  correct,
  explanation,
}: InlineChallengeProps) {
  const [selected, setSelected] = useState<number | null>(null);

  const answered = selected !== null;
  const isCorrect = selected === correct;

  return (
    <div className="my-6 rounded-xl border-2 border-dashed border-accent/30 bg-accent-light p-5">
      <p className="text-sm font-medium text-foreground mb-3">{question}</p>

      <div className="space-y-2">
        {options.map((opt, i) => {
          let cls = "w-full text-left rounded-lg px-3 py-2 text-sm transition-all ";
          if (answered && i === correct) cls += "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium";
          else if (answered && i === selected) cls += "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
          else if (answered) cls += "text-muted opacity-50";
          else cls += "bg-card border border-border text-foreground hover:border-accent/50 cursor-pointer";

          return (
            <button
              key={i}
              type="button"
              onClick={() => !answered && setSelected(i)}
              disabled={answered}
              className={cls}
            >
              <span className="flex items-center gap-2">
                {answered && i === correct && <CheckCircle2 size={14} className="shrink-0" />}
                {answered && i === selected && i !== correct && <XCircle size={14} className="shrink-0" />}
                {opt}
              </span>
            </button>
          );
        })}
      </div>

      {answered && explanation && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-xs text-muted leading-relaxed"
        >
          {explanation}
        </motion.p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Build MatchPairs**

Two columns. User clicks one item from left, then one from right to connect them. Lines drawn between pairs.

```tsx
// src/components/interactive/MatchPairs.tsx
"use client";

import { useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";

export interface Pair {
  left: string;
  right: string;
}

interface MatchPairsProps {
  pairs: Pair[];
  instruction?: string;
}

export default function MatchPairs({ pairs, instruction }: MatchPairsProps) {
  const [shuffledRight] = useState(() =>
    [...pairs.map((p) => p.right)].sort(() => Math.random() - 0.5)
  );
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matches, setMatches] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);

  const matchedLefts = new Set(Object.keys(matches).map(Number));
  const matchedRights = new Set(Object.values(matches));

  function handleLeftClick(i: number) {
    if (checked || matchedLefts.has(i)) return;
    setSelectedLeft(i);
  }

  function handleRightClick(j: number) {
    if (checked || selectedLeft === null || matchedRights.has(j)) return;
    setMatches((prev) => ({ ...prev, [selectedLeft]: j }));
    setSelectedLeft(null);
  }

  function isCorrectMatch(leftIdx: number, rightIdx: number) {
    return pairs[leftIdx].right === shuffledRight[rightIdx];
  }

  const allMatched = Object.keys(matches).length === pairs.length;
  const allCorrect = checked && Object.entries(matches).every(
    ([l, r]) => isCorrectMatch(Number(l), r)
  );

  return (
    <div className="my-6 rounded-xl border border-border bg-card p-5">
      {instruction && <p className="text-sm text-muted mb-4">{instruction}</p>}

      <div className="grid grid-cols-2 gap-4">
        {/* Left column */}
        <div className="space-y-2">
          {pairs.map((pair, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleLeftClick(i)}
              disabled={checked || matchedLefts.has(i)}
              className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition-all ${
                selectedLeft === i ? "border-accent bg-accent-light font-medium" :
                matchedLefts.has(i) ? (checked ? (isCorrectMatch(i, matches[i]) ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "border-red-500 bg-red-50 dark:bg-red-900/20") : "border-accent/30 bg-surface") :
                "border-border hover:border-accent/50 cursor-pointer"
              } text-foreground`}
            >
              {pair.left}
            </button>
          ))}
        </div>

        {/* Right column */}
        <div className="space-y-2">
          {shuffledRight.map((item, j) => (
            <button
              key={j}
              type="button"
              onClick={() => handleRightClick(j)}
              disabled={checked || matchedRights.has(j) || selectedLeft === null}
              className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition-all ${
                matchedRights.has(j) ? "border-accent/30 bg-surface" :
                selectedLeft !== null ? "border-border hover:border-accent/50 cursor-pointer" :
                "border-border text-muted"
              } text-foreground`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        {allMatched && !checked && (
          <button type="button" onClick={() => setChecked(true)}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark">
            Kiểm tra
          </button>
        )}
        {checked && (
          <span className={`flex items-center gap-1.5 text-sm font-medium ${allCorrect ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {allCorrect ? <><CheckCircle2 size={16} /> Chính xác!</> : "Chưa đúng hết, thử lại!"}
          </span>
        )}
        <button type="button"
          onClick={() => { setMatches({}); setSelectedLeft(null); setChecked(false); }}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground">
          <RotateCcw size={14} className="inline mr-1" /> Làm lại
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Build SortChallenge**

Identical to Reorderable (Task 6) — re-export it with an alias for semantic clarity.

```tsx
// src/components/interactive/SortChallenge.tsx
export { default } from "./Reorderable";
export type { default as SortChallengeProps } from "./Reorderable";
```

- [ ] **Step 4: Build FillBlank**

A sentence/formula with blanks. User selects from dropdown options for each blank.

```tsx
// src/components/interactive/FillBlank.tsx
"use client";

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

export interface Blank {
  id: string;
  options: string[];
  correct: number;
}

interface FillBlankProps {
  /** Template string with {id} placeholders for blanks */
  template: string;
  blanks: Blank[];
}

export default function FillBlank({ template, blanks }: FillBlankProps) {
  const [selections, setSelections] = useState<Record<string, number | null>>(() => {
    const init: Record<string, number | null> = {};
    for (const b of blanks) init[b.id] = null;
    return init;
  });
  const [checked, setChecked] = useState(false);

  const allFilled = Object.values(selections).every((v) => v !== null);
  const allCorrect = checked && blanks.every((b) => selections[b.id] === b.correct);

  // Parse template into segments
  const parts = template.split(/\{(\w+)\}/g);

  return (
    <div className="my-6 rounded-xl border border-border bg-card p-5">
      <div className="text-sm leading-loose text-foreground flex flex-wrap items-center gap-1">
        {parts.map((part, i) => {
          const blank = blanks.find((b) => b.id === part);
          if (!blank) return <span key={i}>{part}</span>;

          const sel = selections[blank.id];
          let borderCls = "border-border";
          if (checked && sel !== null) {
            borderCls = sel === blank.correct ? "border-green-500" : "border-red-500";
          }

          return (
            <span key={i} className="inline-flex items-center gap-1">
              <select
                value={sel ?? ""}
                onChange={(e) => {
                  const val = e.target.value === "" ? null : parseInt(e.target.value);
                  setSelections((prev) => ({ ...prev, [blank.id]: val }));
                  setChecked(false);
                }}
                className={`rounded border ${borderCls} bg-surface px-2 py-1 text-sm font-mono text-foreground focus:border-accent focus:outline-none`}
              >
                <option value="">___</option>
                {blank.options.map((opt, oi) => (
                  <option key={oi} value={oi}>{opt}</option>
                ))}
              </select>
              {checked && sel !== null && (
                sel === blank.correct
                  ? <CheckCircle2 size={14} className="text-green-500" />
                  : <XCircle size={14} className="text-red-500" />
              )}
            </span>
          );
        })}
      </div>

      <div className="mt-4">
        {!checked && (
          <button type="button" onClick={() => setChecked(true)} disabled={!allFilled}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-40">
            Kiểm tra
          </button>
        )}
        {checked && (
          <span className={`text-sm font-medium ${allCorrect ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
            {allCorrect ? "Chính xác!" : "Thử sửa các chỗ sai và kiểm tra lại."}
          </span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/interactive/InlineChallenge.tsx src/components/interactive/MatchPairs.tsx src/components/interactive/SortChallenge.tsx src/components/interactive/FillBlank.tsx
git commit -m "feat: add assessment primitives (InlineChallenge, MatchPairs, SortChallenge, FillBlank)"
```

---

### Task 9: Feedback Primitives — AhaMoment, ProgressSteps, Callout, MiniSummary

**Files:**
- Create: `src/components/interactive/AhaMoment.tsx`
- Create: `src/components/interactive/ProgressSteps.tsx`
- Create: `src/components/interactive/Callout.tsx`
- Create: `src/components/interactive/MiniSummary.tsx`

- [ ] **Step 1: Build all four feedback primitives**

These are simpler display components. Build them all in one step.

```tsx
// src/components/interactive/AhaMoment.tsx
"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface AhaMomentProps {
  children: React.ReactNode;
}

export default function AhaMoment({ children }: AhaMomentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="my-8 rounded-xl border-2 border-accent bg-accent-light p-6 text-center"
    >
      <motion.div
        initial={{ rotate: -10, scale: 0 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="inline-block mb-3"
      >
        <Sparkles size={28} className="text-accent" />
      </motion.div>
      <div className="text-sm font-medium text-foreground leading-relaxed">
        {children}
      </div>
    </motion.div>
  );
}
```

```tsx
// src/components/interactive/ProgressSteps.tsx
"use client";

interface ProgressStepsProps {
  current: number;
  total: number;
  labels?: string[];
}

export default function ProgressSteps({ current, total, labels }: ProgressStepsProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i < current ? "w-6 bg-accent" : i === current ? "w-8 bg-accent" : "w-4 bg-surface"
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-muted">
        {labels?.[current] ?? `${current + 1}/${total}`}
      </span>
    </div>
  );
}
```

```tsx
// src/components/interactive/Callout.tsx
import { Info, AlertTriangle, Lightbulb, Sparkles } from "lucide-react";

const variants = {
  tip: { icon: Lightbulb, border: "border-accent", bg: "bg-accent-light", text: "text-accent-dark" },
  warning: { icon: AlertTriangle, border: "border-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-400" },
  insight: { icon: Sparkles, border: "border-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-700 dark:text-purple-400" },
  info: { icon: Info, border: "border-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400" },
};

interface CalloutProps {
  variant?: keyof typeof variants;
  title?: string;
  children: React.ReactNode;
}

export default function Callout({ variant = "tip", title, children }: CalloutProps) {
  const v = variants[variant];
  const Icon = v.icon;

  return (
    <div className={`my-4 rounded-lg border-l-4 ${v.border} ${v.bg} p-4`}>
      {title && (
        <div className={`flex items-center gap-2 mb-1.5 ${v.text}`}>
          <Icon size={16} />
          <span className="text-sm font-semibold">{title}</span>
        </div>
      )}
      <div className={`text-sm leading-relaxed ${v.text}`}>{children}</div>
    </div>
  );
}
```

```tsx
// src/components/interactive/MiniSummary.tsx
import { ClipboardList } from "lucide-react";

interface MiniSummaryProps {
  title?: string;
  points: string[];
}

export default function MiniSummary({ title = "Tóm tắt", points }: MiniSummaryProps) {
  return (
    <div className="my-8 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <ClipboardList size={18} className="text-accent" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <ul className="space-y-2">
        {points.map((point, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-foreground/90 leading-relaxed">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/interactive/AhaMoment.tsx src/components/interactive/ProgressSteps.tsx src/components/interactive/Callout.tsx src/components/interactive/MiniSummary.tsx
git commit -m "feat: add feedback primitives (AhaMoment, ProgressSteps, Callout, MiniSummary)"
```

---

### Task 10: Layout Primitives — SplitView, TabView, CollapsibleDetail, CodeBlock

**Files:**
- Create: `src/components/interactive/SplitView.tsx`
- Create: `src/components/interactive/TabView.tsx`
- Create: `src/components/interactive/CollapsibleDetail.tsx`
- Create: `src/components/interactive/CodeBlock.tsx`

- [ ] **Step 1: Build all four layout primitives**

```tsx
// src/components/interactive/SplitView.tsx
interface SplitViewProps {
  left: React.ReactNode;
  right: React.ReactNode;
  leftLabel?: string;
  rightLabel?: string;
}

export default function SplitView({ left, right, leftLabel, rightLabel }: SplitViewProps) {
  return (
    <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        {leftLabel && <span className="text-xs font-medium text-muted mb-2 block">{leftLabel}</span>}
        <div className="rounded-lg border border-border bg-card p-4">{left}</div>
      </div>
      <div>
        {rightLabel && <span className="text-xs font-medium text-muted mb-2 block">{rightLabel}</span>}
        <div className="rounded-lg border border-border bg-card p-4">{right}</div>
      </div>
    </div>
  );
}
```

```tsx
// src/components/interactive/TabView.tsx
"use client";

import { useState } from "react";

interface Tab {
  label: string;
  content: React.ReactNode;
}

interface TabViewProps {
  tabs: Tab[];
}

export default function TabView({ tabs }: TabViewProps) {
  const [active, setActive] = useState(0);

  return (
    <div className="my-6">
      <div className="flex border-b border-border mb-4">
        {tabs.map((tab, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            className={`px-4 py-2 text-sm font-medium transition-all border-b-2 -mb-px ${
              i === active
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{tabs[active].content}</div>
    </div>
  );
}
```

```tsx
// src/components/interactive/CollapsibleDetail.tsx
"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CollapsibleDetailProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export default function CollapsibleDetail({
  title,
  children,
  defaultOpen = false,
}: CollapsibleDetailProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="my-4 rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-surface/50 transition-colors"
      >
        {title}
        <ChevronDown
          size={16}
          className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 text-sm text-foreground/90 leading-relaxed">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

```tsx
// src/components/interactive/CodeBlock.tsx
"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CodeBlockProps {
  children: string;
  language?: string;
  title?: string;
}

export default function CodeBlock({ children, language = "python", title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(children.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="my-4 rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-surface px-4 py-2">
        <span className="text-[11px] font-mono text-muted">
          {title ?? language}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] text-muted hover:text-foreground transition-colors"
        >
          {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
          {copied ? "Đã sao chép" : "Sao chép"}
        </button>
      </div>

      {/* Code */}
      <pre className="code-block overflow-x-auto p-4 bg-[#1e1e2e] text-[#cdd6f4]">
        <code>{children.trim()}</code>
      </pre>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/interactive/SplitView.tsx src/components/interactive/TabView.tsx src/components/interactive/CollapsibleDetail.tsx src/components/interactive/CodeBlock.tsx
git commit -m "feat: add layout primitives (SplitView, TabView, CollapsibleDetail, CodeBlock)"
```

---

### Task 11: Build verification

- [ ] **Step 1: Update barrel export to include all 21 components**

Update `src/components/interactive/index.ts` to match the actual files created (SortChallenge re-exports Reorderable).

- [ ] **Step 2: Verify build**

Run: `pnpm run build`
Expected: Build succeeds with 0 type errors. The primitives aren't used by any page yet, but tree-shaking means they don't affect bundle if unused.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: verify full build with all 21 interaction primitives"
```

---

### Task 12: Contributor template — `_template.tsx`

**Files:**
- Create: `src/topics/_template.tsx`

- [ ] **Step 1: Create the template**

This file is copy-pasted by contributors (human or AI agent). It must be self-documenting with inline comments explaining every section.

The template should include:
- Metadata export with every field commented
- Recommended lesson flow as labeled sections
- Imports for all common primitives
- At minimum: a PredictionGate hook, a custom visualization placeholder, an AhaMoment, an InlineChallenge, an ExplanationSection, and a QuizSection
- Comments explaining the golden rule and what each section should contain
- Example Vietnamese content so the tone is clear

- [ ] **Step 2: Commit**

```bash
git add src/topics/_template.tsx
git commit -m "feat: add contributor topic template"
```

---

### Task 13: Agent-first CONTRIBUTING.md

**Files:**
- Create: `CONTRIBUTING.md` at repo root

- [ ] **Step 1: Write the guide**

This is the most critical document. It must be readable by an AI coding agent that has never seen this codebase. Structure:

1. **FOR AI AGENTS** header — explicit instruction that this doc is designed to be consumed by coding agents
2. **Quick Start** — exact commands: fork, clone, install, dev, create topic
3. **The Golden Rule** — "User discovers before being told" with one example
4. **File Naming** — slug format, where to put it, registry entry
5. **Topic Structure** — the 8-step recommended flow with code template
6. **Available Primitives** — table of all 21 with one-line descriptions + import path
7. **Vietnamese Content** — always use dấu, write analogies from Vietnamese life, target university freshman
8. **Prompt Template** — a literal prompt the domain expert can paste into their AI: "You are contributing a topic about [X] to the AI Cho Mọi Người educational app. Read CONTRIBUTING.md and docs/primitives.md, then create the topic file..."
9. **PR Checklist** — numbered list an agent can verify
10. **Anti-patterns** — explicit DO NOT list
11. **Example: Full Topic** — one complete topic file showing the ideal pattern

- [ ] **Step 2: Commit**

```bash
git add CONTRIBUTING.md
git commit -m "docs: add agent-first contributing guide"
```

---

### Task 14: Primitives reference — `docs/primitives.md`

**Files:**
- Create: `docs/primitives.md`

- [ ] **Step 1: Write the reference**

For each of the 21 primitives, document:
- Component name and import path
- What it does (1 sentence)
- When to use (1 sentence)
- Full TypeScript props interface
- Minimal usage example (5-15 lines of JSX)
- One DO and one DON'T

Group by category (Discovery, Manipulation, Assessment, Feedback, Layout).

- [ ] **Step 2: Commit**

```bash
git add docs/primitives.md
git commit -m "docs: add primitives reference for contributors"
```

---

### Task 15: Final verification and cleanup

- [ ] **Step 1: Full build verification**

Run: `pnpm run build`
Expected: 193+ pages generated, 0 errors

- [ ] **Step 2: Verify dev server**

Run: `pnpm run dev`
Navigate to `http://localhost:3000` — app should work as before. Primitives aren't used in any topic yet (that's Phase 2).

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: Phase 1 complete — interaction primitives library + contributor system"
```
