# Student Path — Math Stage Fix Design

**Status:** Approved (decisions locked 2026-04-16).

**Goal:** Fix the Student path's steepest drop-off point by adding 2 bridge topics, splitting 1 overloaded topic into 2, rewriting 2 math topics with research-backed interactive visualizations, and bundling 5 quick accuracy/difficulty fixes. Addresses the educator review's top concerns: "too steep too fast," "weakest section visually," difficulty mislabeling, and a data leakage code bug.

**Architecture:** 4 new topic files (2 bridges + 2 from split) + 2 full rewrites of existing topics + 5 small fixes. Content produced by 4-stage Opus pipeline (research brief → writer → spec+fact review → code quality review). Reuses existing interactive primitives (`VisualizationSection`, `SliderGroup`, `CanvasPlayground`, `DragDrop`, `ToggleCompare`, `CollapsibleDetail`).

**Tech Stack:** Next.js 16 App Router, React 19 / React Compiler, TypeScript 5.9, Tailwind v4, existing topic primitives.

---

## 1. Problem statement

The educator review identified the Student path's Stage 2 ("Nền tảng toán") as the highest-risk drop-off point:

1. **No bridge** between `what-is-ml` (zero math) and `linear-algebra-for-ml` (university-level). Students who haven't taken university math are completely lost.
2. **`linear-algebra-for-ml`** covers vectors through eigendecomposition/PCA in one lesson — a massive cognitive leap.
3. **`probability-statistics`** is labeled "beginner" but covers MLE, cross-entropy, KL divergence.
4. **All 3 math topics lack interactive visualizations** while every other stage has rich interactives. The weakest section visually.
5. **Application topics mislabeled** — `k-means-in-music-recs` and `backpropagation-in-translation` contain intermediate content but are labeled "beginner."
6. **Data leakage bug** in `end-to-end-ml-project.tsx` — `StandardScaler.fit_transform()` called on full dataset before train/test split, contradicting the lesson's own warning.
7. **LLM overview formula intimidation** — `softmax(QK^T/√d_k)V` in `llm-overview.tsx` appears inline for office workers who just learned what a prompt is.

---

## 2. Decisions (locked)

### 2.1 Bridge topics
Two new topics in Stage 1 ("Giới thiệu") after `what-is-ml`:
- `math-readiness` — variables, summation notation, functions, coordinate planes
- `data-and-datasets` — what training data looks like, features vs labels, train/test splits

### 2.2 Linear algebra split
`linear-algebra-for-ml` is deleted and replaced by two new topics in Stage 2:
- `vectors-and-matrices` (beginner) — vectors as embeddings, dot product, cosine similarity, matrix multiply, GPU connection
- `eigendecomposition-pca` (intermediate) — eigenvalues, PCA dimensionality reduction, attention as linear algebra

### 2.3 Math topic rewrites
`probability-statistics` and `calculus-for-backprop` are fully rewritten with:
- Research-backed interactive visualizations (see §4)
- Consistent Vietnamese prose (see §6)
- Correct difficulty labels

### 2.4 Visualization approach
Option C from brainstorming: Rich "user IS the algorithm" interactives for all 6 topics (4 new + 2 rewritten), including the 2 bridge topics. Research-backed designs per §4.

### 2.5 Pipeline
4-stage Opus subagent pipeline per topic. All Opus, no Haiku (standing user rule).

### 2.6 Bundled fixes
5 quick fixes (1-10 lines each) addressing accuracy and difficulty from the educator review.

---

## 3. New path structure

### Before
```
Stage 1 "Giới thiệu":     what-is-ml
Stage 2 "Nền tảng toán":   linear-algebra-for-ml, probability-statistics, calculus-for-backprop
Stage 3 "ML cơ bản":       supervised-unsupervised-rl, ...
```

### After
```
Stage 1 "Giới thiệu":     what-is-ml, math-readiness, data-and-datasets
Stage 2 "Nền tảng toán":   vectors-and-matrices, eigendecomposition-pca, probability-statistics, calculus-for-backprop
Stage 3 "ML cơ bản":       supervised-unsupervised-rl, ...
```

Changes:
- Stage 1 expands from 1 → 3 topics
- Stage 2 expands from 3 → 4 topics (net +1: split into 2, old file deleted)
- Stages 3-5 unchanged
- Total Student path topics: 34 → 37

---

## 4. Visualization specifications

All visualizations use existing primitives (`VisualizationSection`, `CanvasPlayground`, `SliderGroup`, `DragDrop`, `ToggleCompare`). No new components created.

### 4.1 math-readiness — Triple-linked function explorer

**Research basis:** Ainsworth (2006) DeFT framework — multiple linked representations build deeper understanding than any single view. Desmos uses this pattern.

**Interaction:** Three panels sync together:
1. **Equation panel:** `y = ax + b` with editable coefficients
2. **Value table:** x values from -3 to 3 with computed y values
3. **Coordinate plane:** Graph of the function with grid

User changes ANY panel — the others update instantly. Slider controls for `a` and `b`. Second sub-visualization: summation (Σ) notation builder where user drags terms into the sigma and watches the running total grow.

**Concepts taught:** Variables, functions, coordinate planes, summation notation — the four things students need before they can read any ML formula.

**Length target:** 400-600 words of prose.

### 4.2 data-and-datasets — Build-your-own dataset

**Research basis:** Riche et al. — constructing data builds understanding of bias and representation better than manipulating pre-made tables.

**Interaction:** 2D plane with class labels. User clicks to place blue dots (class A, e.g., "Nhà giá thấp") and orange dots (class B, e.g., "Nhà giá cao"). After 20+ points, "Chia tập dữ liệu" button randomly splits into train (solid) and test (hollow). A simple linear classifier trains on training set, draws decision boundary. User sees accuracy on test set. Can re-split to see variance. If split is unlucky, accuracy drops — teaches why splitting matters.

**Concepts taught:** Features, labels, training data, test data, why splits matter, what a dataset actually looks like.

**Length target:** 400-600 words of prose.

### 4.3 vectors-and-matrices — Vector playground + grid transformation

**Research basis:** Lakoff & Nunez embodied mathematics — treating vectors as physical movable objects improves retention. 3Blue1Brown's grid transformation is the single most effective way to teach what matrices "do."

**Interaction:**
- **Panel 1 — Vector arrows:** Two draggable arrows on a 2D plane. Live readout shows dot product and cosine similarity. Perpendicular = 0, parallel = 1, opposite = -1. Vietnamese labels: "Tích vô hướng", "Độ tương đồng cosine".
- **Panel 2 — Matrix transformer:** 2×2 matrix with editable entries. A grid of points warps in real time as user changes values. Shows what a weight matrix "does" to inputs. Identity matrix → no change, rotation matrix → grid rotates, scaling → grid stretches.

**Concepts taught:** Vectors as embeddings, dot product, cosine similarity, matrix multiplication as transformation, why GPUs are good for AI.

**Difficulty:** beginner. **Length target:** 500-700 words.

### 4.4 eigendecomposition-pca — PCA puzzle with variance game

**Research basis:** Setosa.io's PCA explainer (proven effective). Powell & Dede — goal-oriented exploration outperforms passive animation.

**Interaction:** 50 scattered points with elliptical spread. User drags a rotation handle to find the direction of maximum variance (PC1). A "Phương sai giải thích" (Variance Explained) progress bar fills as user approaches the correct axis — gamified. When PC1 is found:
1. Data projects to a 1D histogram below (before/after comparison)
2. User then finds PC2 (constrained to be orthogonal)
3. Final reveal: the full PCA decomposition

**Concepts taught:** Eigenvalues/eigenvectors (as directions of maximum spread), PCA as dimensionality reduction, information loss tradeoff, attention formula as linear algebra.

**Difficulty:** intermediate. **Length target:** 500-700 words.

### 4.5 probability-statistics — Bayesian icon array

**Research basis:** Gigerenzer & Hoffrage (1995) — natural frequency representations improved correct Bayesian reasoning from ~10% to ~65%. Tree diagrams actually make it harder. Seeing Theory (Brown University) uses this approach.

**Interaction:** 1000 person-icons on screen. Vietnamese medical framing: "Bạn là bác sĩ tại Bệnh viện Chợ Rẫy xét nghiệm bệnh X." Three sliders:
1. **Tỷ lệ mắc bệnh** (prevalence): 0.1% to 10%
2. **Độ nhạy** (sensitivity/TPR): 80% to 99%
3. **Độ đặc hiệu** (specificity/TNR): 80% to 99%

Icons color-code live: red = sick+positive, pink = sick+negative, yellow = healthy+positive, green = healthy+negative. User can count directly. Posterior probability displayed prominently.

**Concepts taught:** Bayes theorem, prior/posterior, sensitivity/specificity, why base rate matters, natural frequency reasoning.

**Difficulty:** intermediate. **Length target:** 500-700 words.

### 4.6 calculus-for-backprop — Three-stage gradient descent

**Research basis:** Bret Victor's "Ladder of Abstraction" — start concrete 1D, generalize to 2D, then automate. Brehmer et al. on explorable explanations — user-as-algorithm pattern is highly effective.

**Interaction — three stages:**
1. **1D curve:** User drags a ball on a parabola. Tangent line shows slope at current position. Arrow shows "gradient points downhill." Teaches: derivative = slope = direction to move.
2. **2D contour plot:** Loss surface with two weights (w1, w2). User clicks where to step next; algorithm shows the correct gradient step with an arrow. Teaches: gradient in multiple dimensions.
3. **Learning rate control:** Same contour plot, now with a slider (0.001 to 1.0) and "Bước tiếp" / "Tự động chạy" buttons. Too high → overshoots and diverges. Too low → crawls. Shows the learning rate tradeoff viscerally.

**Concepts taught:** Derivatives, gradient as direction of steepest descent, chain rule (why backprop works), learning rate tradeoff, convergence/divergence.

**Difficulty:** intermediate. **Length target:** 500-700 words.

---

## 5. Bundled quick fixes

### 5.1 Data leakage in end-to-end-ml-project.tsx

**Current (buggy):**
```python
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)  # fits on ALL data including test
# ... later splits into train/test
```

**Fixed:**
```python
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)  # fit on train ONLY
X_test_scaled = scaler.transform(X_test)         # transform test
```

Both occurrences in the file (Phase 2 and Phase 5) must be fixed.

### 5.2 Difficulty label fixes

| File (registry.ts) | Current | New |
|---|---|---|
| `probability-statistics` | beginner | intermediate |
| `k-means-in-music-recs` | beginner | intermediate |
| `backpropagation-in-translation` | beginner | intermediate |

Also update the `difficulty` field in the corresponding `.tsx` metadata exports.

### 5.3 Attention formula in llm-overview.tsx

Wrap the `softmax(QK^T/√d_k)V` formula block in a `<CollapsibleDetail>` component with label "Cho bạn nào tò mò: công thức Attention" (For the curious: the Attention formula). The formula stays accessible but doesn't intimidate office workers.

---

## 6. Language rules for Opus writers

### 6.1 Vietnamese-first prose
All explanatory prose in Vietnamese. Technical terms get a Vietnamese primary name with English in parentheses on first mention only:
- "tích vô hướng (dot product)" → then just "tích vô hướng" after
- "vector (véc-tơ)" → then just "vector" after (widely adopted loanword)

### 6.2 No mid-sentence switching
- Bad: "Khi bạn compute dot product..."
- Good: "Khi bạn tính tích vô hướng (dot product)..."

### 6.3 Formulas in LaTeX
Math notation is universal. Use the `<LaTeX>` component for all formulas. No monospace text for math.

### 6.4 UI labels in Vietnamese
All slider labels, button text, axis labels, legend items in Vietnamese.

### 6.5 Vietnamese number formatting
Use dot for thousands separator: "1.000" not "1,000". Use comma for decimals: "0,5" not "0.5".

### 6.6 Vietnamese diacritics protocol
Same grep-based verification as the application topics pipeline (spec 2026-04-16-paths-applications-design.md §6.4).

---

## 7. Pipeline details

### 7.1 Four-stage Opus pipeline

All stages `model: "opus"`. Never Haiku (standing user rule).

| Stage | Inputs | Output |
|---|---|---|
| 1. Research brief | Topic name, visualization spec from §4, language rules from §6 | YAML brief: concepts, Vietnamese examples, formula list, quiz questions (4 per topic), visualization interaction spec |
| 2. Topic writer | YAML brief, component API, existing topic file (for rewrites) | `.tsx` file + `registry.ts` entry |
| 3. Spec + fact review | Topic file + brief + this spec | Pass/fail with line numbers |
| 4. Code quality review | Topic file + git SHA | Pass/fail on TS, lint, a11y |

### 7.2 Topic file structure (theory topics)

All 6 topics follow the existing theory topic pattern:
```tsx
"use client";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
// ... interactive primitives as needed

export const metadata: TopicMeta = { ... };

export default function TopicName() {
  // Visualization state (useState, useCallback, etc.)
  return (
    <>
      <VisualizationSection topicSlug="..." topicTitle="...">
        {/* Interactive canvas/SVG visualization */}
      </VisualizationSection>

      <ExplanationSection topicSlug="..." topicTitle="...">
        {/* Explanation steps with PredictionGate, AhaMoment, etc. */}
      </ExplanationSection>

      <QuizSection topicSlug="..." topicTitle="..." questions={[...]} />
    </>
  );
}
```

### 7.3 Existing primitives available for visualizations

From `src/components/interactive/`:
- `CanvasPlayground` — HTML5 canvas wrapper for custom drawing
- `SliderGroup` — labeled slider(s) with value display
- `DragDrop` — drag items between zones
- `ToggleCompare` — before/after comparison
- `InlineChallenge` — quick interactive question
- `StepReveal` — progressive disclosure
- `CollapsibleDetail` — expandable "go deeper" section

No new components should be created. All visualizations built from these primitives plus raw SVG/canvas inside `VisualizationSection`.

---

## 8. Rollout

### 8.1 Batch order

| # | Work item | Topics | Gate |
|---|---|---|---|
| 1 | Quick fixes | 5 fixes (§5) | tsc + test + commit |
| 2 | Bridge topics | math-readiness, data-and-datasets | 4-stage Opus pipeline |
| 3 | Linear algebra split | vectors-and-matrices, eigendecomposition-pca | 4-stage Opus pipeline |
| 4 | Math rewrites | probability-statistics, calculus-for-backprop | 4-stage Opus pipeline |
| 5 | Path integration | paths.ts + registry.ts updates, delete old file | Full regression |
| 6 | **MANDATORY user review** | User reads all 6 topics on deployed site | Approve or iterate |

### 8.2 Delete plan for linear-algebra-for-ml

After `vectors-and-matrices` and `eigendecomposition-pca` are committed and verified:
1. Remove `linear-algebra-for-ml.tsx`
2. Remove its `registry.ts` entry
3. Update any `relatedSlugs` referencing `linear-algebra-for-ml` to point to `vectors-and-matrices`
4. Verify no broken references

---

## 9. Success criteria

- 4 new topic files + 2 rewritten files in `src/topics/` using the theory topic pattern
- All 6 topics have rich interactive `VisualizationSection` visualizations
- `paths.ts` updated: Stage 1 has 3 topics, Stage 2 has 4 topics
- `linear-algebra-for-ml.tsx` deleted, no broken references
- `probability-statistics` difficulty = "intermediate" in registry + metadata
- Application topics difficulty = "intermediate" in registry + metadata
- Data leakage bug fixed in `end-to-end-ml-project.tsx` (both occurrences)
- Attention formula wrapped in CollapsibleDetail in `llm-overview.tsx`
- Vietnamese diacritics grep returns zero matches across all new/modified files
- All existing tests continue to pass
- Production deploy renders correctly

---

## 10. Non-goals

- No changes to Stage 3-5 topics
- No changes to Office, Engineer, or Researcher paths
- No new interactive component primitives
- No database changes
- No changes to kids paths
- No "last updated" date system (deferred)
- No prerequisites gate system (deferred)
