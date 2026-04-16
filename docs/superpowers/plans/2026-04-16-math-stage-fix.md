# Math Stage Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the Student path's steepest drop-off point with 2 bridge topics, 1 topic split into 2, 2 full rewrites with research-backed visualizations, and 5 quick accuracy/difficulty fixes.

**Architecture:** Batch 1 handles the 5 quick fixes (no Opus pipeline needed — they're 1-10 line edits). Batches 2-4 use the 4-stage Opus subagent pipeline (research brief → writer → spec+fact review → code quality review) for the 6 topic files. Batch 5 integrates everything into paths.ts and cleans up the deleted file.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.9, Tailwind v4, existing interactive primitives (CanvasPlayground, SliderGroup, DragDrop, ToggleCompare, CollapsibleDetail, LaTeX).

---

# Part A — Quick fixes (Task 1)

## Task 1: Five bundled fixes

**Files:**
- Modify: `src/topics/end-to-end-ml-project.tsx:246,306`
- Modify: `src/topics/llm-overview.tsx:509-513`
- Modify: `src/topics/registry.ts:2181,2393,2453` (difficulty labels)
- Modify: `src/topics/probability-statistics.tsx:9` (metadata difficulty)
- Modify: `src/topics/k-means-in-music-recs.tsx` (metadata difficulty)
- Modify: `src/topics/backpropagation-in-translation.tsx` (metadata difficulty)

- [ ] **Step 1: Fix data leakage in end-to-end-ml-project.tsx (occurrence 1)**

In `src/topics/end-to-end-ml-project.tsx`, find the code block around line 240-246 containing:

```python
scaler = StandardScaler()
features = ["dien_tich", "so_phong", "quan_encoded"]
X = df[features]
y = df["gia"]

X_scaled = scaler.fit_transform(X)
```

Replace with:

```python
scaler = StandardScaler()
features = ["dien_tich", "so_phong", "quan_encoded"]
X = df[features]
y = df["gia"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)
```

- [ ] **Step 2: Fix data leakage occurrence 2**

In the same file, find the code block around line 303-309 containing:

```python
features_v2 = ["dien_tich", "so_phong", "quan_encoded", "gia_per_m2"]
X_v2 = df[features_v2]
X_v2_scaled = scaler.fit_transform(X_v2)

X_train2, X_test2, y_train2, y_test2 = train_test_split(
    X_v2_scaled, y, test_size=0.2, random_state=42
```

Replace with:

```python
features_v2 = ["dien_tich", "so_phong", "quan_encoded", "gia_per_m2"]
X_v2 = df[features_v2]

X_train2, X_test2, y_train2, y_test2 = train_test_split(
    X_v2, y, test_size=0.2, random_state=42
)
X_train2_scaled = scaler.fit_transform(X_train2)
X_test2_scaled = scaler.transform(X_test2)
```

- [ ] **Step 3: Wrap attention formula in CollapsibleDetail in llm-overview.tsx**

In `src/topics/llm-overview.tsx`, find lines 509-513:

```tsx
        <p>Công thức cốt lõi:</p>
        <LaTeX block>{"P(w_{\\text{next}} \\mid w_1, w_2, ..., w_n) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right) V"}</LaTeX>
        <p>
          Đây là cơ chế <strong>self-attention</strong>{" "}trong <TopicLink slug="transformer">Transformer</TopicLink> — cho phép mỗi từ
```

Wrap the LaTeX block in a CollapsibleDetail. Replace the `<p>Công thức cốt lõi:</p>` line and the `<LaTeX block>` line with:

```tsx
        <CollapsibleDetail title="Cho bạn nào tò mò: công thức Attention">
          <LaTeX block>{"P(w_{\\text{next}} \\mid w_1, w_2, ..., w_n) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right) V"}</LaTeX>
        </CollapsibleDetail>
```

Ensure `CollapsibleDetail` is in the import list at the top of the file. If not, add it to the destructured import from `@/components/interactive`.

- [ ] **Step 4: Fix difficulty labels in registry.ts**

In `src/topics/registry.ts`:

1. Line 2181: Change `difficulty: "beginner"` to `difficulty: "intermediate"` for `probability-statistics`
2. Find the `k-means-in-music-recs` entry: Change `difficulty: "beginner"` to `difficulty: "intermediate"`
3. Find the `backpropagation-in-translation` entry: Change `difficulty: "beginner"` to `difficulty: "intermediate"`

- [ ] **Step 5: Fix difficulty in topic metadata exports**

1. `src/topics/probability-statistics.tsx` — in `export const metadata: TopicMeta`, change `difficulty: "beginner"` to `difficulty: "intermediate"`
2. `src/topics/k-means-in-music-recs.tsx` — change `difficulty: "beginner"` to `difficulty: "intermediate"`
3. `src/topics/backpropagation-in-translation.tsx` — change `difficulty: "beginner"` to `difficulty: "intermediate"`

- [ ] **Step 6: Run verification**

```bash
pnpm exec tsc --noEmit
pnpm test
```

Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add src/topics/end-to-end-ml-project.tsx src/topics/llm-overview.tsx src/topics/registry.ts src/topics/probability-statistics.tsx src/topics/k-means-in-music-recs.tsx src/topics/backpropagation-in-translation.tsx
git commit -m "fix: data leakage bug, difficulty labels, attention formula collapsible

- end-to-end-ml-project: move scaler.fit_transform after train/test split (2 occurrences)
- probability-statistics, k-means-in-music-recs, backpropagation-in-translation: beginner → intermediate
- llm-overview: wrap attention formula in CollapsibleDetail for office path"
```

---

# Part B — Bridge topics (Tasks 2-3)

These 2 topics go through the 4-stage Opus pipeline. Each task is one full pipeline cycle.

## Task 2: math-readiness topic

**Files:**
- Create: `src/topics/math-readiness.tsx`
- Modify: `src/topics/registry.ts` — add entry

**Pipeline inputs for Opus subagents:**

### Stage 1 — Research brief

Dispatch an Opus research-brief subagent with:
- **topic_slug:** `math-readiness`
- **title_vi:** `Sẵn sàng cho toán ML`
- **category:** `foundations`
- **difficulty:** `beginner`
- **visualization_spec:** Triple-linked function explorer (spec §4.1): equation panel (`y = ax + b` with editable `a`, `b`), value table (x: -3 to 3), coordinate plane graph. All three sync. Plus summation (Σ) notation builder — user drags terms into sigma, watches running total.
- **concepts:** Variables and parameters, function notation, coordinate planes, summation (Σ) notation, the connection "changing parameters changes behavior" as ML preview
- **Vietnamese examples:** Function = công thức nấu phở (recipe — change salt amount, taste changes). Parameter = nút vặn volume (slider). Coordinate plane = bản đồ Sài Gòn (2D map with x/y = longitude/latitude).
- **quiz_count:** 4 questions (3 MCQ + 1 fill-blank)
- **language_rules:** Full Vietnamese prose. Technical terms get Vietnamese name with English in parens on first mention only. UI labels in Vietnamese. See spec §6.

Research subagent should verify:
- What notation Vietnamese high school students already know
- Best practices for teaching function concepts to ML beginners (Desmos pedagogy, Ainsworth DeFT framework)

### Stage 2 — Topic writer

Dispatch writer subagent with the YAML brief + these constraints:
- Must use `VisualizationSection` + `ExplanationSection` + `QuizSection` pattern
- Interactive visualization built with SVG inside VisualizationSection (canvas or raw SVG for the coordinate plane)
- Use `SliderGroup` for coefficient controls
- Use `useState`/`useCallback` for state management
- Follow existing theory topic structure (see `what-is-ml.tsx` for the pattern with PredictionGate → AhaMoment → ExplanationSection → QuizSection)
- Register in `registry.ts` with: `category: "foundations"`, `difficulty: "beginner"`, `vizType: "interactive"`, `relatedSlugs: ["what-is-ml", "vectors-and-matrices", "data-and-datasets"]`

### Stage 3 — Spec + fact review

Verify: visualization spec match, Vietnamese diacritics, language rule compliance, no English/Vietnamese mid-sentence mixing, quiz correctness.

### Stage 4 — Code quality review

Verify: tsc, lint, a11y (heading levels), no unused imports, no duplication with what-is-ml.

- [ ] **Step 1: Dispatch Stage 1 research brief**
- [ ] **Step 2: Review brief**
- [ ] **Step 3: Dispatch Stage 2 writer**
- [ ] **Step 4: Dispatch Stage 3 spec review**
- [ ] **Step 5: Dispatch Stage 4 code quality review**
- [ ] **Step 6: Verify and commit**

```bash
pnpm exec tsc --noEmit && pnpm test
git add src/topics/math-readiness.tsx src/topics/registry.ts
git commit -m "feat(topics): add math-readiness bridge topic with triple-linked function explorer"
```

---

## Task 3: data-and-datasets topic

**Files:**
- Create: `src/topics/data-and-datasets.tsx`
- Modify: `src/topics/registry.ts` — add entry

**Pipeline inputs for Opus subagents:**

### Stage 1 — Research brief

- **topic_slug:** `data-and-datasets`
- **title_vi:** `Dữ liệu & Tập dữ liệu`
- **category:** `foundations`
- **difficulty:** `beginner`
- **visualization_spec:** Build-your-own dataset (spec §4.2): 2D plane, user clicks to place blue/orange dots (two classes). After 20+ points, "Chia tập dữ liệu" button splits into train/test. Linear classifier draws decision boundary. Accuracy shown. Re-split to see variance.
- **concepts:** Features (đặc trưng), labels (nhãn), training data vs test data, why splits matter, what overfitting looks like when test is too similar to train, CSV/tabular data structure
- **Vietnamese examples:** Vietnamese house prices (Quận 1 vs Quận 9, diện tích, số phòng). Shopee product classification (hình ảnh → category). Grab ride data (khoảng cách, thời gian, giá).
- **quiz_count:** 4 questions
- **language_rules:** Spec §6

### Stage 2 — Topic writer

Same constraints as Task 2. Register with: `category: "foundations"`, `difficulty: "beginner"`, `vizType: "interactive"`, `relatedSlugs: ["what-is-ml", "math-readiness", "supervised-unsupervised-rl", "train-val-test"]`

### Stages 3-4 — Review pipeline (same pattern)

- [ ] **Step 1: Dispatch Stage 1 research brief**
- [ ] **Step 2: Review brief**
- [ ] **Step 3: Dispatch Stage 2 writer**
- [ ] **Step 4: Dispatch Stage 3 spec review**
- [ ] **Step 5: Dispatch Stage 4 code quality review**
- [ ] **Step 6: Verify and commit**

```bash
pnpm exec tsc --noEmit && pnpm test
git add src/topics/data-and-datasets.tsx src/topics/registry.ts
git commit -m "feat(topics): add data-and-datasets bridge topic with build-your-own dataset viz"
```

---

# Part C — Linear algebra split (Tasks 4-5)

## Task 4: vectors-and-matrices topic

**Files:**
- Create: `src/topics/vectors-and-matrices.tsx`
- Modify: `src/topics/registry.ts` — add entry

**Pipeline inputs:**

### Stage 1 — Research brief

- **topic_slug:** `vectors-and-matrices`
- **title_vi:** `Vector & Ma trận`
- **category:** `math-foundations`
- **difficulty:** `beginner`
- **visualization_spec:** Vector playground + grid transformation (spec §4.3):
  - Panel 1: Two draggable arrows on 2D plane. Live readout of dot product (tích vô hướng) and cosine similarity (độ tương đồng cosine). Perpendicular = 0, parallel = 1, opposite = -1.
  - Panel 2: 2×2 matrix with editable entries. Grid of points warps in real time. Identity = no change, rotation matrix = grid rotates, scaling = grid stretches.
- **concepts:** Vectors as embeddings, dot product, cosine similarity, matrix as transformation, matrix multiplication dimension rules (m,n)@(n,k)=(m,k), why GPUs are good for AI (parallel matrix multiply)
- **content_source:** Migrated from the first half of `linear-algebra-for-ml.tsx` — concepts through dot product/cosine similarity and matrix multiply. Do NOT include eigendecomposition or PCA.
- **Vietnamese examples:** Embedding = "profile" of a song on Spotify (energy, danceability). Cosine similarity = so sánh gu nhạc 2 người. Matrix multiply = biến đổi ảnh (rotation, scaling).
- **quiz_count:** 4 questions
- **language_rules:** Spec §6. Research basis: Lakoff & Nunez embodied mathematics.

### Stages 2-4 — Writer + review pipeline

Register with: `category: "math-foundations"`, `difficulty: "beginner"`, `vizType: "interactive"`, `relatedSlugs: ["eigendecomposition-pca", "word-embeddings", "neural-network-overview"]`

- [ ] **Step 1-6: Full Opus pipeline (same pattern as Tasks 2-3)**

```bash
git add src/topics/vectors-and-matrices.tsx src/topics/registry.ts
git commit -m "feat(topics): add vectors-and-matrices with draggable vector playground + grid transform"
```

---

## Task 5: eigendecomposition-pca topic

**Files:**
- Create: `src/topics/eigendecomposition-pca.tsx`
- Modify: `src/topics/registry.ts` — add entry

**Pipeline inputs:**

### Stage 1 — Research brief

- **topic_slug:** `eigendecomposition-pca`
- **title_vi:** `Phân rã trị riêng & PCA`
- **category:** `math-foundations`
- **difficulty:** `intermediate`
- **visualization_spec:** PCA puzzle with variance game (spec §4.4): 50 scattered points with elliptical spread. User drags rotation handle to find PC1. Variance Explained bar fills as puzzle. After PC1: 1D histogram projection. Then PC2 (orthogonal constraint). Final: full PCA decomposition reveal.
- **concepts:** Eigenvalues and eigenvectors (as directions of maximum spread), covariance matrix, PCA as dimensionality reduction, information loss tradeoff, connection to attention mechanism (Q*K^T as similarity matrix)
- **content_source:** Migrated from the second half of `linear-algebra-for-ml.tsx` — eigendecomposition and PCA content. Assumes student completed `vectors-and-matrices`.
- **Vietnamese examples:** PCA = chọn góc chụp ảnh tốt nhất (angle that captures most information). Dimensionality reduction = tóm tắt 100 đặc điểm thành 5 đặc điểm quan trọng nhất.
- **quiz_count:** 4 questions
- **language_rules:** Spec §6. Research basis: Setosa.io PCA explainer, Powell & Dede goal-oriented exploration.

### Stages 2-4 — Writer + review pipeline

Register with: `category: "math-foundations"`, `difficulty: "intermediate"`, `vizType: "interactive"`, `relatedSlugs: ["vectors-and-matrices", "pca", "word-embeddings"]`

- [ ] **Step 1-6: Full Opus pipeline**

```bash
git add src/topics/eigendecomposition-pca.tsx src/topics/registry.ts
git commit -m "feat(topics): add eigendecomposition-pca with PCA variance puzzle visualization"
```

---

# Part D — Math topic rewrites (Tasks 6-7)

## Task 6: Rewrite probability-statistics

**Files:**
- Rewrite: `src/topics/probability-statistics.tsx` (full rewrite, keep same slug)
- Modify: `src/topics/registry.ts` — update entry (add `vizType: "interactive"`, tocSections gets both visualization + explanation)

**Pipeline inputs:**

### Stage 1 — Research brief

- **topic_slug:** `probability-statistics`
- **title_vi:** `Xác suất & Thống kê cơ bản`
- **category:** `math-foundations`
- **difficulty:** `intermediate`
- **visualization_spec:** Bayesian icon array (spec §4.5): 1000 person-icons. Vietnamese medical framing: "Bạn là bác sĩ tại Bệnh viện Chợ Rẫy xét nghiệm bệnh X." Three sliders: Tỷ lệ mắc bệnh (prevalence 0.1%-10%), Độ nhạy (sensitivity 80%-99%), Độ đặc hiệu (specificity 80%-99%). Icons color-code live by disease status + test result. Posterior probability displayed prominently.
- **concepts:** Bayes theorem (prior, likelihood, posterior), natural frequency reasoning, sensitivity/specificity/base rate, Gaussian distribution, cross-entropy as loss function, MLE equivalence
- **content_source:** Rewrite of existing `probability-statistics.tsx`. Same concepts but with proper visualization, better Vietnamese prose, and research-backed icon array approach (Gigerenzer & Hoffrage 1995).
- **Vietnamese examples:** Bệnh viện Chợ Rẫy COVID testing. Spam filtering (prior = % spam emails). Weather prediction (prior = tỷ lệ mưa tháng 7 ở Sài Gòn).
- **quiz_count:** 4 questions
- **language_rules:** Spec §6

### Stages 2-4 — Writer + review pipeline

Update registry entry: keep slug, update `tocSections` to include both `visualization` and `explanation`. Difficulty already changed to "intermediate" in Task 1.

- [ ] **Step 1-6: Full Opus pipeline**

```bash
git add src/topics/probability-statistics.tsx src/topics/registry.ts
git commit -m "feat(topics): rewrite probability-statistics with Bayesian icon array visualization"
```

---

## Task 7: Rewrite calculus-for-backprop

**Files:**
- Rewrite: `src/topics/calculus-for-backprop.tsx` (full rewrite, keep same slug)
- Modify: `src/topics/registry.ts` — update entry

**Pipeline inputs:**

### Stage 1 — Research brief

- **topic_slug:** `calculus-for-backprop`
- **title_vi:** `Giải tích cho lan truyền ngược`
- **category:** `math-foundations`
- **difficulty:** `intermediate`
- **visualization_spec:** Three-stage gradient descent (spec §4.6):
  - Stage 1: 1D parabola, user drags ball, tangent line shows slope. "Đạo hàm = độ dốc = hướng đi."
  - Stage 2: 2D contour plot (w1, w2). User clicks where to step, algorithm shows correct gradient arrow. User-as-algorithm pattern.
  - Stage 3: Learning rate slider (0.001 to 1.0). "Bước tiếp" / "Tự động chạy" buttons. Too high → overshoots. Too low → crawls.
- **concepts:** Derivative as rate of change (dL/dw), chain rule for backpropagation, gradient descent update rule, learning rate tradeoff, vanishing gradient problem, ReLU vs sigmoid
- **content_source:** Rewrite of existing `calculus-for-backprop.tsx`. Same concepts but with the three-stage ladder of abstraction (Bret Victor).
- **Vietnamese examples:** Gradient descent = tìm đáy thung lũng khi bị bịt mắt (blindfolded valley search). Learning rate = bước chân — bước quá lớn nhảy qua đáy, bước quá nhỏ đi mãi không tới. Chain rule = domino effect.
- **quiz_count:** 4 questions
- **language_rules:** Spec §6. Research basis: Bret Victor Ladder of Abstraction, Brehmer et al. explorable explanations.

### Stages 2-4 — Writer + review pipeline

Update registry entry: add `tocSections` with both visualization + explanation.

- [ ] **Step 1-6: Full Opus pipeline**

```bash
git add src/topics/calculus-for-backprop.tsx src/topics/registry.ts
git commit -m "feat(topics): rewrite calculus-for-backprop with 3-stage gradient descent visualization"
```

---

# Part E — Integration (Tasks 8-9)

## Task 8: Update paths.ts and delete old file

**Files:**
- Modify: `src/lib/paths.ts:37-49`
- Delete: `src/topics/linear-algebra-for-ml.tsx`
- Modify: `src/topics/registry.ts` — remove `linear-algebra-for-ml` entry, update any `relatedSlugs` referencing it

- [ ] **Step 1: Update Student Stage 1 in paths.ts**

In `src/lib/paths.ts`, change:

```ts
  {
    title: "Giới thiệu",
    slugs: ["what-is-ml"],
  },
```

To:

```ts
  {
    title: "Giới thiệu",
    slugs: ["what-is-ml", "math-readiness", "data-and-datasets"],
  },
```

- [ ] **Step 2: Update Student Stage 2 in paths.ts**

Change:

```ts
  {
    title: "Nền tảng toán",
    slugs: [
      "linear-algebra-for-ml",
      "probability-statistics",
      "calculus-for-backprop",
    ],
  },
```

To:

```ts
  {
    title: "Nền tảng toán",
    slugs: [
      "vectors-and-matrices",
      "eigendecomposition-pca",
      "probability-statistics",
      "calculus-for-backprop",
    ],
  },
```

- [ ] **Step 3: Delete linear-algebra-for-ml.tsx**

```bash
rm src/topics/linear-algebra-for-ml.tsx
```

- [ ] **Step 4: Remove registry entry for linear-algebra-for-ml**

In `src/topics/registry.ts`, delete the entire entry block for `slug: "linear-algebra-for-ml"` (lines ~2163-2173).

- [ ] **Step 5: Update relatedSlugs referencing linear-algebra-for-ml**

Search for any `relatedSlugs` arrays containing `"linear-algebra-for-ml"` and replace with `"vectors-and-matrices"`:

```bash
grep -rn '"linear-algebra-for-ml"' src/topics/registry.ts
```

For each hit in a `relatedSlugs` array, replace `"linear-algebra-for-ml"` with `"vectors-and-matrices"`.

Also check topic files:

```bash
grep -rn 'linear-algebra-for-ml' src/topics/*.tsx
```

Update any `TopicLink` references in other topic files to point to `vectors-and-matrices` instead.

- [ ] **Step 6: Run full regression**

```bash
pnpm exec tsc --noEmit
pnpm test
```

Expected: all pass. If any test references `linear-algebra-for-ml`, update it.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(paths): integrate math stage fix — bridge topics, split, path updates

- Stage 1: what-is-ml → math-readiness → data-and-datasets
- Stage 2: vectors-and-matrices → eigendecomposition-pca → probability-statistics → calculus-for-backprop
- Delete linear-algebra-for-ml (content split into vectors-and-matrices + eigendecomposition-pca)
- Update all relatedSlugs and TopicLink references"
```

---

## Task 9: Final verification + Vietnamese diacritics sweep

**Files:** All new/modified topic files

- [ ] **Step 1: Run diacritics check on all new files**

```bash
for f in src/topics/{math-readiness,data-and-datasets,vectors-and-matrices,eigendecomposition-pca}.tsx; do
  echo "=== $(basename $f) ==="
  grep -n "Cong ty nao\|Van de\|ung dung\|thuc te\|giai quyet\|Dai so tuyen tinh\|xac suat\|thong ke\|giai tich\|dao ham\|ma tran\|vector" "$f" || echo "CLEAN"
done
```

Any match → fix and re-commit.

- [ ] **Step 2: Run full test suite one final time**

```bash
pnpm exec tsc --noEmit
pnpm test
```

- [ ] **Step 3: MANDATORY USER REVIEW GATE**

STOP here. User must review all 6 topic pages on the deployed site and either approve or request format changes before proceeding with any further work.

---

# Summary

| Task | What | Files | Pipeline |
|---|---|---|---|
| 1 | 5 quick fixes | 6 files modified | Direct edit |
| 2 | math-readiness (new) | 1 create, 1 modify | 4-stage Opus |
| 3 | data-and-datasets (new) | 1 create, 1 modify | 4-stage Opus |
| 4 | vectors-and-matrices (new, from split) | 1 create, 1 modify | 4-stage Opus |
| 5 | eigendecomposition-pca (new, from split) | 1 create, 1 modify | 4-stage Opus |
| 6 | probability-statistics (rewrite) | 1 rewrite, 1 modify | 4-stage Opus |
| 7 | calculus-for-backprop (rewrite) | 1 rewrite, 1 modify | 4-stage Opus |
| 8 | Path integration + cleanup | 3 files | Direct edit |
| 9 | Final verification | All new files | Direct checks |

**Total new topic files:** 4 created + 2 rewritten = 6 topics through Opus pipeline
**Total quick fixes:** 5 (data leakage × 2, difficulty × 3, formula collapsible × 1)
**Estimated Opus dispatches:** 24 (6 topics × 4 stages) + review loops
