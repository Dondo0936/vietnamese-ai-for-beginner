# Primitives Reference

This document is the authoritative reference for all 21 interaction primitives in `src/components/interactive/`. It is written for **contributors and AI coding agents** building educational topics. Every primitive is fully described here — you should not need to read the source to use any of them correctly.

**Golden rule:** import from the barrel, never from the file path directly.

```ts
import { ComponentName } from "@/components/interactive";
```

---

## Discovery Primitives

These primitives reveal content progressively to build understanding before showing conclusions.

---

### PredictionGate

**Import:** `import { PredictionGate } from "@/components/interactive";`

**What it does:** Presents a multiple-choice prediction question and only reveals gated child content after the learner answers.

**When to use:** Use before explaining a concept when you want the learner to commit to a prediction first — it primes curiosity and improves retention.

**Props:**

```ts
interface PredictionGateProps {
  question: string;        // The prediction question shown at the top
  options: string[];       // Answer choices (rendered A, B, C …)
  correct: number;         // Zero-based index of the correct option
  explanation: string;     // Feedback text shown after answering
  children?: React.ReactNode; // Content unlocked after the learner answers
}
```

**Example:**

```tsx
<PredictionGate
  question="Khi tăng learning rate gấp đôi, loss sẽ thay đổi như thế nào?"
  options={[
    "Hội tụ nhanh hơn và ổn định",
    "Có thể dao động hoặc phân kỳ",
    "Không thay đổi gì",
  ]}
  correct={1}
  explanation="Learning rate quá lớn khiến gradient descent vượt qua điểm cực tiểu, gây dao động."
>
  <Callout variant="insight" title="Bây giờ hãy xem đồ thị thực tế">
    Kéo thanh learning rate để quan sát sự thay đổi.
  </Callout>
</PredictionGate>
```

**DO:** Place the most interesting explanatory content as `children` — the learner earns it by engaging.

**DON'T:** Set `correct` to a value outside `0 … options.length - 1`; the feedback logic will silently mark every answer wrong.

---

### StepReveal

**Import:** `import { StepReveal } from "@/components/interactive";`

**What it does:** Shows a sequence of child nodes one at a time, each revealed by clicking "Tiếp tục", with animated progress dots.

**When to use:** Use when a derivation or algorithm has discrete steps that should be understood in order before the next step is shown.

**Props:**

```ts
interface StepRevealProps {
  children: React.ReactNode[]; // One element per step (required, must be an array)
  labels?: string[];           // Optional label for each step shown in the progress indicator
}
```

**Example:**

```tsx
<StepReveal labels={["Khởi tạo", "Tính gradient", "Cập nhật trọng số"]}>
  <p>Bước 1: Khởi tạo trọng số ngẫu nhiên gần 0.</p>
  <p>Bước 2: Tính đạo hàm loss theo từng trọng số.</p>
  <p>Bước 3: w ← w − α·∇L(w)</p>
</StepReveal>
```

**DO:** Keep each step self-contained — a learner should be able to re-read earlier steps after new ones appear.

**DON'T:** Pass a single child wrapped in a fragment; `children` must be a real array (React will treat a fragment as one node, breaking the step count).

---

### BuildUp

**Import:** `import { BuildUp } from "@/components/interactive";`

**What it does:** Incrementally adds child elements to the page one at a time as the learner clicks "Thêm", with a counter and reset control.

**When to use:** Use to build a complex diagram or equation piece-by-piece, letting the learner absorb each component before the next is added.

**Props:**

```ts
interface BuildUpProps {
  children: React.ReactNode[]; // Pieces to add sequentially (first one shown immediately)
  labels?: string[];           // Optional accent-colored label above each piece
  addLabel?: string;           // Button text (default: "Thêm")
}
```

**Example:**

```tsx
<BuildUp labels={["Tầng đầu vào", "Tầng ẩn", "Tầng đầu ra"]} addLabel="Thêm tầng">
  <LayerDiagram layer="input" />
  <LayerDiagram layer="hidden" />
  <LayerDiagram layer="output" />
</BuildUp>
```

**DO:** Use `labels` to name each piece so learners know what they are adding before it appears.

**DON'T:** Use `BuildUp` for content that should all be visible at once — prefer `StepReveal` if ordering matters more than accumulation.

---

## Manipulation Primitives

These primitives let learners interact directly with parameters or data to observe cause and effect.

---

### SliderGroup

**Import:** `import { SliderGroup } from "@/components/interactive";`

**What it does:** Renders one or more labeled range sliders and passes the current values to a `visualization` render prop for live feedback.

**When to use:** Use whenever a concept has one or more continuous numeric parameters whose effect can be shown visually in real time.

**Props:**

```ts
export interface SliderConfig {
  key: string;           // Unique identifier used as the key in the values record
  label: string;         // Human-readable label shown above the slider
  min: number;
  max: number;
  step?: number;         // Default: 1
  defaultValue: number;
  unit?: string;         // Appended to the displayed value (e.g. "%", "px")
}

interface SliderGroupProps {
  sliders: SliderConfig[];
  visualization: (values: Record<string, number>) => React.ReactNode;
  title?: string;
}
```

**Example:**

```tsx
<SliderGroup
  title="Điều chỉnh siêu tham số"
  sliders={[
    { key: "lr",      label: "Learning rate", min: 1, max: 100, step: 1,   defaultValue: 10, unit: "×10⁻³" },
    { key: "epochs",  label: "Số epoch",       min: 1, max: 50,  step: 1,   defaultValue: 10 },
  ]}
  visualization={({ lr, epochs }) => (
    <p className="text-sm text-foreground">
      Loss ước tính sau {epochs} epoch với lr={lr}×10⁻³
    </p>
  )}
/>
```

**DO:** Keep `visualization` a pure render function — it is called on every slider change and must be cheap.

**DON'T:** Fetch data inside `visualization`; move async work outside and pass derived props down instead.

---

### ToggleCompare

**Import:** `import { ToggleCompare } from "@/components/interactive";`

**What it does:** Renders two pill-shaped toggle buttons that cross-fade between two content panels.

**When to use:** Use to contrast two states, approaches, or outputs side by side without consuming extra vertical space.

**Props:**

```ts
interface ToggleCompareProps {
  labelA: string;
  labelB: string;
  childA: React.ReactNode;
  childB: React.ReactNode;
  description?: string;   // Optional explanatory text shown between toggle and content
}
```

**Example:**

```tsx
<ToggleCompare
  labelA="Không chuẩn hóa"
  labelB="Batch Norm"
  description="Quan sát sự thay đổi phân phối qua các tầng"
  childA={<ActivationHistogram normalized={false} />}
  childB={<ActivationHistogram normalized={true} />}
/>
```

**DO:** Make both panels roughly the same height to avoid jarring layout shifts during the cross-fade.

**DON'T:** Nest another `ToggleCompare` inside a panel — use `TabView` for three or more variants.

---

### DragDrop

**Import:** `import { DragDrop } from "@/components/interactive";`

**What it does:** Provides a draggable item pool and one or more labeled drop zones; validates placements against an `accepts` list on each zone.

**When to use:** Use to test categorization knowledge — e.g., sorting algorithms by property, or matching terms to definitions with visual drag interaction.

**Props:**

```ts
export interface DragItem {
  id: string;
  label: string;
}

export interface DropZone {
  id: string;
  label: string;
  accepts: string[]; // Item ids that are correct for this zone
}

interface DragDropProps {
  items: DragItem[];
  zones: DropZone[];
  instruction?: string;
  onComplete?: (correct: boolean) => void; // Called when learner clicks "Kiểm tra"
}
```

**Example:**

```tsx
<DragDrop
  instruction="Kéo mỗi thuật toán vào loại phù hợp"
  items={[
    { id: "knn",   label: "K-Nearest Neighbors" },
    { id: "kmeans",label: "K-Means" },
    { id: "svm",   label: "SVM" },
  ]}
  zones={[
    { id: "supervised",   label: "Học có giám sát",   accepts: ["knn", "svm"] },
    { id: "unsupervised", label: "Học không giám sát", accepts: ["kmeans"] },
  ]}
  onComplete={(correct) => console.log(correct ? "Đúng!" : "Sai")}
/>
```

**DO:** Keep `accepts` arrays exhaustive and non-overlapping — every item id should appear in exactly one zone's `accepts` list.

**DON'T:** Reuse the same `id` string for two different items; placements are keyed by id and will collide.

---

### Reorderable

**Import:** `import { Reorderable } from "@/components/interactive";`

**What it does:** Presents a list of strings in shuffled order that the learner drags to reorder, then checks against `correctOrder`.

**When to use:** Use to reinforce the correct sequence of steps in an algorithm, pipeline, or process.

**Props:**

```ts
interface ReorderableProps {
  items: string[];        // The text labels in their canonical (correct) order
  correctOrder: number[]; // Indices into `items` defining the target sequence
  instruction?: string;
}
```

**Example:**

```tsx
<Reorderable
  instruction="Sắp xếp các bước của thuật toán backpropagation theo đúng thứ tự"
  items={[
    "Tính forward pass",
    "Tính loss",
    "Tính gradient (backward pass)",
    "Cập nhật trọng số",
  ]}
  correctOrder={[0, 1, 2, 3]}
/>
```

**DO:** Set `correctOrder` to `[0, 1, 2, …, n-1]` when the items are already written in correct sequence — this is the most common case.

**DON'T:** Provide a `correctOrder` that references an index outside the range of `items`; the check logic will silently fail for that position.

---

### SortChallenge

**Import:** `import { SortChallenge } from "@/components/interactive";`

**What it does:** Alias for `Reorderable` — identical behavior and props, provided for semantic clarity when the task is explicitly a "sort" exercise.

**When to use:** Use in place of `Reorderable` when the conceptual framing is sorting rather than sequencing.

**Props:** Identical to `Reorderable` — see above.

**Example:**

```tsx
<SortChallenge
  instruction="Sắp xếp các mô hình theo độ phức tạp tăng dần"
  items={["Linear Regression", "Decision Tree", "Random Forest", "Deep Neural Network"]}
  correctOrder={[0, 1, 2, 3]}
/>
```

**DO:** Choose `SortChallenge` over `Reorderable` when the word "sort" appears in the exercise heading — consistent naming aids readability.

**DON'T:** Import both `SortChallenge` and `Reorderable` for the same exercise; they are the same component and one is sufficient.

---

### MatrixEditor

**Import:** `import { MatrixEditor } from "@/components/interactive";`

**What it does:** Renders an editable grid of number inputs for an m×n matrix, with optional row/column labels and a live `visualization` render prop.

**When to use:** Use when teaching linear transformations, convolution kernels, or any concept where the learner should manually tweak matrix values and see the result.

**Props:**

```ts
interface MatrixEditorProps {
  initialData: number[][];              // 2D array defining initial values and matrix dimensions
  rowLabels?: string[];                 // Labels for each row (left side)
  colLabels?: string[];                 // Labels for each column (top)
  min?: number;                         // Input min (default: -10)
  max?: number;                         // Input max (default: 10)
  step?: number;                        // Input step (default: 0.1)
  visualization?: (data: number[][]) => React.ReactNode;
  onChange?: (data: number[][]) => void;
}
```

**Example:**

```tsx
<MatrixEditor
  initialData={[[1, 0], [0, 1]]}
  rowLabels={["Hàng 1", "Hàng 2"]}
  colLabels={["Cột 1", "Cột 2"]}
  min={-5}
  max={5}
  step={0.5}
  visualization={(data) => (
    <p className="text-sm text-foreground font-mono">
      det = {(data[0][0] * data[1][1] - data[0][1] * data[1][0]).toFixed(2)}
    </p>
  )}
/>
```

**DO:** Keep `visualization` lightweight — it re-renders on every keystroke inside any input cell.

**DON'T:** Pass jagged arrays (rows of different lengths) as `initialData`; column count is inferred from `initialData[0].length` and inconsistent rows will render incorrectly.

---

### CanvasPlayground

**Import:** `import { CanvasPlayground } from "@/components/interactive";`

**What it does:** Renders a clickable SVG canvas where each click adds a point; the parent controls the point list via `useState` and can draw custom overlays.

**When to use:** Use to let learners plot data points for clustering, regression, or classification demos where they provide the input data interactively.

**Props:**

```ts
export interface Point {
  x: number;
  y: number;
  label?: string;  // Short text rendered beside the point
  color?: string;  // CSS color string (default: "#6366f1")
}

interface CanvasPlaygroundProps {
  width?: number;       // SVG width in px (default: 400)
  height?: number;      // SVG height in px (default: 300)
  showGrid?: boolean;   // Show background grid lines (default: true)
  points: Point[];      // Controlled — parent owns this array
  onAddPoint?: (point: Point) => void;  // Called on every canvas click
  onReset?: () => void;                 // Shows a "Xóa hết" button when provided
  overlay?: (width: number, height: number) => React.ReactNode; // SVG children drawn below points
  instruction?: string;
  nextColor?: string;   // Color assigned to newly added points (default: "#6366f1")
  nextLabel?: string;   // Label assigned to newly added points
}
```

**Example:**

```tsx
const [points, setPoints] = useState<Point[]>([]);

<CanvasPlayground
  instruction="Nhấp để thêm điểm dữ liệu"
  points={points}
  onAddPoint={(pt) => setPoints((prev) => [...prev, pt])}
  onReset={() => setPoints([])}
  nextColor="#f59e0b"
/>
```

**DO:** Manage `points` with `useState` in the parent component — `CanvasPlayground` is fully controlled.

**DON'T:** Omit `onReset` for demos that encourage many clicks; without it there is no way for the learner to clear the canvas.

---

## Assessment Primitives

These primitives quiz the learner with immediate, in-place feedback.

---

### InlineChallenge

**Import:** `import { InlineChallenge } from "@/components/interactive";`

**What it does:** A compact single-question quiz embedded inline in the lesson flow — single click reveals immediate color-coded feedback.

**When to use:** Use for quick comprehension checks mid-lesson where stopping to open a new view would interrupt flow.

**Props:**

```ts
interface InlineChallengeProps {
  question: string;
  options: string[];
  correct: number;      // Zero-based index of the correct answer
  explanation?: string; // Shown after answering (color reflects correct/wrong)
}
```

**Example:**

```tsx
<InlineChallenge
  question="Hàm kích hoạt nào có thể gây ra vanishing gradient?"
  options={["ReLU", "Sigmoid", "Leaky ReLU", "GELU"]}
  correct={1}
  explanation="Sigmoid bão hòa ở hai đầu, khiến gradient gần bằng 0 và không lan truyền ngược hiệu quả."
/>
```

**DO:** Prefer `InlineChallenge` over `PredictionGate` when there is no gated content to reveal — it has a lighter visual footprint.

**DON'T:** Use the same `InlineChallenge` for multiple questions; instantiate one per question to keep state independent.

---

### MatchPairs

**Import:** `import { MatchPairs } from "@/components/interactive";`

**What it does:** Presents two shuffled columns (A and B) and lets the learner click to connect matching pairs; validates all connections at once.

**When to use:** Use to test vocabulary, concept-definition matching, or symbol-name associations.

**Props:**

```ts
export interface Pair {
  left: string;   // Column A item
  right: string;  // Column B item (correct match for the same index)
}

interface MatchPairsProps {
  pairs: Pair[];
  instruction?: string;
}
```

**Example:**

```tsx
<MatchPairs
  instruction="Nối mỗi hàm kích hoạt với đặc điểm của nó"
  pairs={[
    { left: "ReLU",    right: "Đầu ra = 0 khi x < 0" },
    { left: "Sigmoid", right: "Đầu ra trong (0, 1)" },
    { left: "Tanh",    right: "Đầu ra trong (-1, 1)" },
  ]}
/>
```

**DO:** Keep labels short enough to fit in the two-column grid; long strings overflow on mobile.

**DON'T:** Include duplicate `left` or `right` strings — the matching logic relies on pair index equality and duplicate text will confuse learners even if the logic technically still works.

---

### FillBlank

**Import:** `import { FillBlank } from "@/components/interactive";`

**What it does:** Renders a sentence template with embedded `<select>` dropdowns at positions marked `{id}`, letting learners fill in blanks from provided options.

**When to use:** Use for close-reading exercises where the exact wording of a concept or formula must be completed correctly.

**Props:**

```ts
export interface Blank {
  id: string;       // Must match a {id} placeholder in `template`
  options: string[];// Dropdown choices; correct is an index into this array
  correct: number;  // Zero-based index of the correct option
}

interface FillBlankProps {
  template: string; // Prose with {id} placeholders, e.g. "Hàm {act} bão hòa ở {range}."
  blanks: Blank[];
}
```

**Example:**

```tsx
<FillBlank
  template="Trong {opt}, mỗi nơ-ron nhận đầu vào từ {connect} nơ-ron ở tầng trước."
  blanks={[
    { id: "opt",     options: ["CNN", "MLP", "RNN"],        correct: 1 },
    { id: "connect", options: ["một số", "tất cả các", "không có"], correct: 1 },
  ]}
/>
```

**DO:** Write `template` as natural prose — learners read the sentence to infer meaning before choosing.

**DON'T:** Reuse the same `id` for two different `Blank` entries; only the first one will be rendered in the template.

---

## Feedback Primitives

These primitives deliver information, emphasis, or emotional punctuation without requiring interaction.

---

### AhaMoment

**Import:** `import { AhaMoment } from "@/components/interactive";`

**What it does:** Renders children inside an animated, accent-bordered card with a sparkle icon — signals a key insight to remember.

**When to use:** Use once per major conceptual breakthrough to give it visual weight; overuse dilutes the effect.

**Props:**

```ts
interface AhaMomentProps {
  children: React.ReactNode; // The insight text or JSX to highlight
}
```

**Example:**

```tsx
<AhaMoment>
  Gradient descent không tìm nghiệm giải tích — nó <strong>lặp đi lặp lại</strong> để tiến gần
  hơn đến điểm cực tiểu, như đi xuống dốc bằng những bước nhỏ.
</AhaMoment>
```

**DO:** Follow an `AhaMoment` with a `MiniSummary` or `Callout` to consolidate the insight into action points.

**DON'T:** Wrap entire paragraphs in `AhaMoment`; keep the content to one or two sentences for maximum impact.

---

### ProgressSteps

**Import:** `import { ProgressSteps } from "@/components/interactive";`

**What it does:** Renders an animated pill-dot progress indicator showing which step in a sequence is current.

**When to use:** Use at the top of a multi-step lesson section to orient learners and show how far they have come.

**Props:**

```ts
interface ProgressStepsProps {
  current: number;    // One-based index of the active step
  total: number;      // Total number of steps
  labels?: string[];  // Optional label per step; shown beside the dots for the current step
}
```

**Example:**

```tsx
<ProgressSteps
  current={2}
  total={4}
  labels={["Giới thiệu", "Toán học", "Thực hành", "Tổng kết"]}
/>
```

**DO:** Keep `current` and `total` in sync with the actual page or section state so learners always see accurate progress.

**DON'T:** Pass `current` as zero-based — the label lookup uses `labels[current - 1]` and a zero value will display the wrong label or fall back to the default.

---

### Callout

**Import:** `import { Callout } from "@/components/interactive";`

**What it does:** A left-bordered callout box with a semantic icon and four color variants: `tip`, `warning`, `insight`, `info`.

**When to use:** Use to surface ancillary information — caveats, tips, or key insights — without interrupting the main narrative.

**Props:**

```ts
type CalloutVariant = "tip" | "warning" | "insight" | "info";

interface CalloutProps {
  variant?: CalloutVariant; // Default: "info"
  title?: string;           // Bold heading text beside the icon
  children: React.ReactNode;
}
```

**Variant guide:**

| Variant | Color | Icon | Use for |
|---------|-------|------|---------|
| `info` | Blue | Info | Neutral supplementary information |
| `tip` | Green | Lightbulb | Practical advice or shortcuts |
| `warning` | Amber | AlertTriangle | Common pitfalls or caveats |
| `insight` | Accent | Sparkles | Conceptual breakthroughs (lighter alternative to `AhaMoment`) |

**Example:**

```tsx
<Callout variant="warning" title="Lưu ý về vanishing gradient">
  Với mạng sâu hơn 5 tầng, sigmoid và tanh có thể khiến gradient gần bằng 0 và
  quá trình huấn luyện ngừng hội tụ.
</Callout>
```

**DO:** Use `variant="warning"` for any gotcha that a learner is likely to encounter in practice.

**DON'T:** Use `Callout` as a substitute for body text — it should contain supplementary information, not the main explanation.

---

### MiniSummary

**Import:** `import { MiniSummary } from "@/components/interactive";`

**What it does:** Renders a titled bullet-point list inside a card — a concise recap of the key takeaways from a section.

**When to use:** Place at the end of each major section to consolidate what was learned before moving on.

**Props:**

```ts
interface MiniSummaryProps {
  title?: string;    // Card heading (default: "Tóm tắt")
  points: string[];  // One string per bullet point
}
```

**Example:**

```tsx
<MiniSummary
  title="Những điều cần nhớ về gradient descent"
  points={[
    "Learning rate kiểm soát kích thước mỗi bước cập nhật.",
    "Learning rate quá lớn gây phân kỳ; quá nhỏ gây hội tụ chậm.",
    "Mini-batch gradient descent cân bằng tốc độ và độ ổn định.",
  ]}
/>
```

**DO:** Write points as standalone sentences that make sense without reading the surrounding lesson — learners may return to summaries as a reference.

**DON'T:** Include more than 6 bullet points; beyond that a `CollapsibleDetail` with structured prose is more readable.

---

## Layout Primitives

These primitives structure content on the page without containing domain logic of their own.

---

### SplitView

**Import:** `import { SplitView } from "@/components/interactive";`

**What it does:** Renders two content areas side by side (responsive: stacked on mobile, 50/50 on `md+`), each in its own bordered card.

**When to use:** Use to show two related things in parallel — code alongside output, before/after, or theory beside a diagram.

**Props:**

```ts
interface SplitViewProps {
  left: React.ReactNode;
  right: React.ReactNode;
  leftLabel?: string;   // Small uppercase label above the left card
  rightLabel?: string;  // Small uppercase label above the right card
}
```

**Example:**

```tsx
<SplitView
  leftLabel="Mã nguồn"
  rightLabel="Kết quả"
  left={
    <CodeBlock language="python">{`import numpy as np\nprint(np.dot([1,2],[3,4]))`}</CodeBlock>
  }
  right={
    <p className="font-mono text-foreground">11</p>
  }
/>
```

**DO:** Use `leftLabel` / `rightLabel` whenever the relationship between panels is not immediately obvious.

**DON'T:** Nest two `SplitView` components — use `TabView` or `CollapsibleDetail` to handle more than two panels.

---

### TabView

**Import:** `import { TabView } from "@/components/interactive";`

**What it does:** Renders a horizontal tab bar and swaps content panels without animation.

**When to use:** Use when you have three or more parallel views that a learner might want to compare, such as different implementations of the same algorithm.

**Props:**

```ts
interface Tab {
  label: string;         // Text shown in the tab button
  content: React.ReactNode;
}

interface TabViewProps {
  tabs: Tab[];
}
```

**Example:**

```tsx
<TabView
  tabs={[
    { label: "NumPy",     content: <CodeBlock language="python">{numpyCode}</CodeBlock> },
    { label: "PyTorch",   content: <CodeBlock language="python">{torchCode}</CodeBlock> },
    { label: "Giải thích", content: <p>Cả hai đều tính tích vô hướng của hai vector.</p> },
  ]}
/>
```

**DO:** Order tabs from simplest to most complex so learners encounter them progressively.

**DON'T:** Use `TabView` for just two options — `ToggleCompare` is a more appropriate and visually lighter choice.

---

### CollapsibleDetail

**Import:** `import { CollapsibleDetail } from "@/components/interactive";`

**What it does:** An accordion-style panel with an animated chevron that expands to reveal children on click.

**When to use:** Use for optional depth — derivations, edge cases, or advanced notes that most learners can skip.

**Props:**

```ts
interface CollapsibleDetailProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean; // Whether the panel starts expanded (default: false)
}
```

**Example:**

```tsx
<CollapsibleDetail title="Chứng minh toán học (tùy chọn)">
  <p className="text-sm text-foreground leading-relaxed">
    Cho hàm mất mát L(w), gradient descent cập nhật: w ← w − α·∇L(w), 
    với điều kiện α nhỏ đảm bảo L(w) giảm đơn điệu.
  </p>
</CollapsibleDetail>
```

**DO:** Use a title that makes the optional nature clear (e.g., "Nâng cao", "Tùy chọn", "Chi tiết").

**DON'T:** Set `defaultOpen={true}` for content that is required reading — use a `Callout` or inline prose instead so it is never hidden.

---

### CodeBlock

**Import:** `import { CodeBlock } from "@/components/interactive";`

**What it does:** Renders a dark-themed code block with a language/title header bar and a one-click copy button.

**When to use:** Use for every code sample in a lesson — never use raw `<pre>` or `<code>` tags.

**Props:**

```ts
interface CodeBlockProps {
  children: string;     // The raw code string (whitespace is preserved)
  language?: string;    // Shown in the header bar (default: "python")
  title?: string;       // Overrides language in the header bar when provided
}
```

**Example:**

```tsx
<CodeBlock language="python" title="gradient_descent.py">
{`def gradient_descent(X, y, lr=0.01, epochs=100):
    w = np.zeros(X.shape[1])
    for _ in range(epochs):
        grad = X.T @ (X @ w - y) / len(y)
        w -= lr * grad
    return w`}
</CodeBlock>
```

**DO:** Pass code as a template literal to preserve indentation exactly — the component renders it with `whitespace-pre`.

**DON'T:** Pass JSX elements or rich content as `children`; the prop type is `string` and the copy button copies the raw string value.
