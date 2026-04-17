# Nhí Math Visualizations — Design Spec

> Date: 2026-04-17
> Status: Approved — ready for implementation planning
> Scope: 6 interactive math topics for the Nhí tier (6–10 tuổi), connected by a story world. Full new component library — no adult visualization reuse. Additive — no existing routes or components modified beyond populating the empty kids registry.
> Prior art: `docs/superpowers/specs/2026-04-12-kids-learning-path-design.md` defined the kids infrastructure (routing, types, context, registry). That infrastructure already exists in code. This spec fills the empty Nhí content slot with 6 world-class math visualization topics.

---

## 1. Problem

The Nhí path (`/kids/nhi`) has complete infrastructure — routing, KidsModeProvider, KidsPathPage, empty registry — but zero content topics. The adult Student path's 6 math topics (math-readiness through calculus-for-backprop) use coordinate axes, dot products, eigenvalues, and Bayesian icon grids — interactions designed for 16+ learners. A 7-year-old cannot use a cosine-similarity slider or a 2×2 matrix editor.

The Nhí tier needs entirely new visualizations that teach the same mathematical foundations through concrete metaphors appropriate for Piaget's concrete-operational stage (ages 7–11). Research (Bruner 1966, Gigerenzer 2002, DragonBox classroom studies, PhET simulations, 3Blue1Brown geometric approach) converges on: direct manipulation, enactive→iconic→symbolic progression, frequency-first probability, and spatial transformation as the techniques that produce deep understanding in this age group.

---

## 2. Story World — "Cuộc phiêu lưu của Bé Bạch Tuộc"

A storm scatters 6 viên ngọc thần kỳ (magical pearls) across the ocean. Each pearl is hidden at a location, guarded by a puzzle. The octopus mascot (already in the kids landing page as 🐙) guides the child. Collecting all 6 pearls triggers a celebration screen.

### 2.1 Ocean Map

The `/kids/nhi` page transforms from empty stages into an illustrated SVG ocean map with 6 clickable locations. Completed locations glow with their pearl. A dotted-line path suggests the recommended order but all locations are accessible from the start.

### 2.2 Six Locations

| # | Location | Vietnamese name | Adult concept | Core metaphor |
|---|----------|----------------|---------------|---------------|
| 1 | Coral Factory | Nhà máy san hô | Functions | Input-output machine: drag creature in, transformed creature comes out |
| 2 | Creature Garden | Vườn sinh vật | Data & classification | Sort creatures by visible features into groups |
| 3 | Treasure Map | Bản đồ kho báu | Vectors & directions | Grid-based map, drag arrows to move |
| 4 | Magic Marble Bag | Túi bi thần kỳ | Probability | Colored marbles drawn from a bag, frequency bars build |
| 5 | Shadow Theater | Rạp chiếu bóng | Dimensionality (PCA) | 3D objects cast 2D shadows, find the best viewing angle |
| 6 | Ocean Race | Đường đua đại dương | Rates of change (calculus) | Octopus rides curved track, speedometer responds to slope |

### 2.3 Narrative Pacing

Each topic opens with 1–2 sentences from the octopus: *"Ôi không! Viên ngọc bị giấu trong nhà máy san hô. Bạn giúp mình tìm được không?"* No wall of text. The story serves the interaction.

---

## 3. Unified Flow — Rising Agency Model

Every topic is one continuous scene. No section dividers, no "Phase 2 begins!" screens. The child's role evolves through story beats — narrative events that shift what interactions are active.

### 3.1 Three Roles

| Role | Child's experience | Duration |
|------|-------------------|----------|
| **Observer** | "Let me poke this and see what happens" — free exploration builds mental model | ~2 min |
| **Predictor** | A story beat disrupts the scene (machine jams, fog rolls in, new creature arrives). The environment needs the child's understanding | ~2.5 min |
| **Creator** | The child becomes the designer, proving deep comprehension | ~1.5 min |

Total ~6 minutes per topic, matching the `KidsTopicMeta.durationMinutes` default for Nhí.

### 3.2 Story Beat Transitions

Story beats are narrative events that change which interactions are active and what feedback is given. Same SVG scene, same coordinate space, same visual elements — different response logic.

**Coral Factory**: Machine hums → kid drags creatures in → **CLUNK, machine jams** → kid must predict outputs → **machine upgraded** → kid creates own rule → pearl inside machine.

**Creature Garden**: Creatures float → kid drags them around → **storm warning, fence appears** → kid sorts by 1 then 2 features → **mystery creature at gate** → kid classifies it → pearl under the correct group.

**Treasure Map**: Grid island, kid drags arrows to explore → **fog rolls in, 2-arrow limit** → kid combines arrows (= vector addition) → **friend octopus lost** → kid designs path for friend → pearl at destination.

**Magic Marble Bag**: Transparent bag, draw marbles → **bag becomes opaque** → kid predicts colors, watches tally build → **"make a secret bag!"** → kid designs marble mix → pearl inside most frequent color.

**Shadow Theater**: Objects behind screen, kid rotates light → **5 similar objects, "find best angle!"** → kid maximizes clarity meter (= explained variance) → **"hide a shape for your friend!"** → kid designs shadow puzzle → pearl at best angle.

**Ocean Race**: Wavy track, kid watches speedometer → **flags appear, "where is it fastest?"** → kid identifies steepest slopes → **"draw your own track!"** → kid draws freehand curve, octopus rides it → pearl at finish line.

### 3.3 Interaction Principles

| Principle | Implementation |
|-----------|---------------|
| Drag, not tap | Every primary interaction is continuous drag. Builds embodied cognition (Computers & Education 2023 review). |
| Zero text reading required | Instructions via short Vietnamese audio + visual cues. Text is supplementary. |
| Immediate feedback | Every action → visible result within 200ms. No "submit" buttons. |
| No fail state | Wrong guesses → gentle redirection ("Gần đúng rồi!"), never red X marks. |
| Progressive notation | Observer: pure visual. Predictor: numbers appear alongside visuals. Creator: optional simple notation (2×3=6) as "peek behind the curtain" — never required. |
| Adaptive difficulty | 3 correct → harder challenge; 2 wrong → simpler + visual hint. Hint layering: visual highlight → partial answer → worked example. |

### 3.4 Audio Narration

`KidsModeProvider` has `audioNarration: true` by default for Nhí. Each topic has ~8–10 short Vietnamese text strings rendered by browser SpeechSynthesis API (vi-VN voice). Upgrade path to recorded voice exists but is out of scope.

---

## 4. Visualization Specifications

### 4.1 Topic 1: Nhà máy san hô — Functions

**The math**: f: A → B. Injective functions. Composition f(g(x)).

**SVG scene**: ~400×500. Left: 6 draggable input creatures (parameterized: `{ species, color, size, legs }`). Center: machine with "rule window." Right: output slots.

**Observer**: Hidden rule (e.g., "double the legs", "swap the color"). Drag creature in → machine animates → output slides out. Rule window shows visual hint (×2 icon). Start with single-property rules, after 3 interactions upgrade to arithmetic rules (`legs × 2`).

**Predictor**: Machine jams. 5 challenges: input shown, output empty. Kid drags predicted output. Adaptive: 2 wrong → machine briefly runs one reminder. 3 correct in a row → harder rule (two operations = function composition).

**Creator**: Kid picks operations from visual menu (×2, +1, swap color, grow size). Machine runs their rule on all 6 creatures simultaneously — a complete function mapping. Pearl glows.

**Mathematical depth**: Injectivity (one input → one output), inference from examples (pattern recognition), composition (chained operations). Foundations of algebraic thinking formalized in Vietnamese lớp 7.

### 4.2 Topic 2: Vườn sinh vật — Data & Classification

**The math**: Feature vectors in R², decision boundaries, nearest-centroid classification.

**SVG scene**: ~400×450. 16 creatures with 2–3 visible features: color (3 options), size (small/medium/large), pattern (spots/stripes/plain).

**Observer**: Creatures float. Kid drags them. Similar creatures near each other → subtle glow connection. "Feature spotlight" button dims everything except one feature.

**Predictor**: Fence appears. Round 1: sort by ONE feature (color). Match meter shows split purity. Round 2: second fence, 4 quadrants, sort by TWO features (= 2D feature space). Round 3: mystery creature at gate → kid places it based on features (= k-NN classification).

**Creator**: Kid picks features for 8 new creatures, places them, draws fence lines. Pearl under the most well-separated group.

**Mathematical depth**: Feature spaces, decision boundaries, classification accuracy — foundations of supervised learning through spatial sorting.

### 4.3 Topic 3: Bản đồ kho báu — Vectors

**The math**: R² vectors, addition (parallelogram rule), magnitude (Euclidean norm), scalar multiplication.

**SVG scene**: ~400×400, 10×10 grid. Octopus token at start. Landmarks scattered.

**Observer**: Arrow tiles (→ ← ↑ ↓ ↗ ↘ ↙ ↖) along bottom. Drag arrow → octopus moves one step, leaves colored trail. Each arrow shows subtle component numbers: → = (1,0).

**Predictor**: Fog. Challenge 1: reach palm tree with exactly 2 arrows → arrows visually merge into one diagonal (= vector addition). Challenge 2: reach cave with one arrow constrained to ↑ → decomposition. Challenge 3: one arrow → but a "strength" slider ×1/×2/×3 (= scalar multiplication).

**Creator**: Second octopus at random position. Kid places arrows to guide it home. Star rating for fewest arrows. Pearl at treasure chest.

**Mathematical depth**: Vector addition as path combination, scalar multiplication as "strength," decomposition as "which directions do I need?"

### 4.4 Topic 4: Túi bi thần kỳ — Probability

**The math**: Frequentist probability, law of large numbers, conditional probability (Bayesian preview).

**SVG scene**: Bag (~200×250) center. Tally/bar chart grows at bottom (~400×150). Marble palette on side.

**Observer**: 3 red + 7 blue marbles (visible through semi-transparent bag). Tap to draw, marble plops to tally row, bag refills (with replacement). After 30 draws the 70/30 pattern emerges. Child SEES the law of large numbers.

**Predictor**: Bag opaque. Kid predicts color before each draw. After 10, octopus asks "Màu nào ra NHIỀU hơn? Bao nhiêu lần trong 10?" — kid picks from "7/10", "5/10", "3/10." Then bag changes to 5/5 — kid experiences 50/50 = "can't predict." Advanced beat: two bags (9 blue+1 red vs 5+5), kid draws blue → "Từ túi nào?" = Bayesian reasoning.

**Creator**: Kid designs marble mix. Bag goes opaque. Animated friend draws and guesses. Pearl inside most frequent color.

**Mathematical depth**: Frequency-first probability (Gigerenzer 2002), law of large numbers, conditional reasoning. Proven to build correct Bayesian intuition that tree diagrams fail to teach.

### 4.5 Topic 5: Rạp chiếu bóng — Dimensionality / PCA

**The math**: Projection R³→R², variance maximization, information preservation.

**SVG scene**: Split-screen. Left (~250×400): isometric SVG objects. Right (~250×400): shadow screen. Draggable light source on circular track.

**Observer**: Sphere, cube, pyramid behind screen. Kid drags light → shadows morph. Sphere's shadow always circular. Cube shifts square→hexagon→diamond. Shadow computation: vertex projection onto plane perpendicular to light direction.

**Predictor**: 5 objects (some similar). "Clarity meter" shows shadow distinguishability (= explained variance). Kid rotates light to maximize clarity. Peak = first principal component direction. Then second screen at 90° appears = PC2.

**Creator**: Kid places new object, chooses deceptive angle where its shadow mimics another shape. Friend guesses from shadow. Pearl at optimal-clarity angle.

**Mathematical depth**: Finding the projection that maximizes distinguishability IS PCA. The clarity meter IS explained variance. The 90° second screen IS PC2.

### 4.6 Topic 6: Đường đua đại dương — Rates of Change

**The math**: Instantaneous rate of change, derivative as slope of tangent, function↔derivative relationship.

**SVG scene**: ~400×450. Top: wavy track (cubic Bézier). Bottom: speedometer gauge + mini derivative graph.

**Observer**: Pre-drawn roller-coaster track. Tap "Go" → octopus rides, speedometer swings with slope. Drag octopus to any point → tangent line appears, its tilt = speedometer. Mini graph plots speed vs position in real time.

**Predictor**: Challenge 1: track shown, speedometer hidden, 3 flags → "where fastest?" = identify steepest slope. Challenge 2: speed graph shown, track hidden → pick matching track shape (= reading a derivative, reconstructing function = integration intuition). Challenge 3: "find where octopus STOPS" = critical points where speed = 0.

**Creator**: Kid draws freehand curve (smoothed to cubic Bézier). Octopus rides it. Challenge: "draw a track where octopus accelerates the whole way" = monotonically increasing derivative = convex curve. Pearl at finish line.

**Mathematical depth**: Fundamental theorem of calculus — the relationship between function and derivative — through "steep = fast." Tangent line as speedometer needle. Critical points as "standing still." When they see dy/dx in lớp 11, they'll think "the steepness of the track."

---

## 5. Component Architecture

### 5.1 File Structure

```
src/components/kids/nhi/
├── OceanMap.tsx              ← SVG ocean map for /kids/nhi page
├── MascotBubble.tsx          ← Speech bubble with octopus + TTS trigger
├── PearlReveal.tsx           ← Celebration overlay + confetti
├── KidsTopicLayout.tsx       ← Minimal wrapper (back link, pearl progress)
├── CoralFactory.tsx          ← Topic 1: Functions (~500-700 lines)
├── CreatureGarden.tsx        ← Topic 2: Classification
├── TreasureMap.tsx           ← Topic 3: Vectors
├── MagicMarbleBag.tsx        ← Topic 4: Probability
├── ShadowTheater.tsx         ← Topic 5: Dimensionality
└── OceanRace.tsx             ← Topic 6: Rates of change

src/topics/kids/
├── kids-registry.ts          ← 6 Nhí entries populated
├── nhi-coral-factory.tsx     ← Metadata + renders CoralFactory
├── nhi-creature-garden.tsx
├── nhi-treasure-map.tsx
├── nhi-magic-marble-bag.tsx
├── nhi-shadow-theater.tsx
└── nhi-ocean-race.tsx
```

### 5.2 Separation of Concerns

- **Topic files** (`src/topics/kids/nhi-*.tsx`): Own metadata (slug, titleVi, description, difficulty, tier, durationMinutes, mascotMood). Render the corresponding component. Same pattern as adult topics.
- **Visualization components** (`src/components/kids/nhi/*.tsx`): Own the interactive SVG scene, state management, phase transitions. Pure `useState` + `useCallback` — no external state management.
- **Shared kid components** (MascotBubble, PearlReveal, OceanMap, KidsTopicLayout): Used by all 6 topics.

### 5.3 KidsTopicLayout (~80 lines)

Much simpler than adult TopicLayout:
- Back arrow: "Quay lại bản đồ" → `/kids/nhi`
- Pearl progress indicator: ○○○●○○ (6 dots, filled for completed)
- No TOC, no tags, no bookmark, no category navigation
- Full-bleed viewport for visualization
- MascotBubble slot at bottom-right

### 5.4 Internal Component Structure

Each visualization component manages a single `phase` state (0, 1, 2) that is never exposed in the UI. Story beats trigger phase transitions.

```
State: {
  phase: 0 | 1 | 2,
  // topic-specific state
}

phase 0 (Observer):  interaction handler → animate → show result
  → after N interactions, fire story beat → set phase 1

phase 1 (Predictor): interaction handler → check prediction → feedback
  → after M correct, fire story beat → set phase 2

phase 2 (Creator):   kid configures → system runs → pearl reveal
```

### 5.5 Rendering Pipeline

1. `/kids/topics/[slug]/page.tsx` (exists) looks up `kidsTopicMap`
2. Dynamically imports topic file (e.g., `nhi-coral-factory.tsx`)
3. Topic file renders `KidsTopicLayout` wrapping the visualization component
4. Visualization component owns the full SVG interactive scene

### 5.6 OceanMap Integration

`/kids/nhi/page.tsx` currently renders `KidsPathPage` with empty stages. Replace with:
- `OceanMap` component: illustrated SVG ocean with 6 clickable location islands
- Each island links to `/kids/topics/{slug}`
- Completed topics: island glows with pearl, dotted path connects completed islands
- Progress stored via existing `markTopicRead` in localStorage (same as adult system)

---

## 6. Technical Constraints

| Constraint | Decision |
|------------|----------|
| No WebGL / Canvas | All rendering is SVG + CSS. Keeps bundle small, accessibility intact, and matches adult topic pattern. |
| No external charting libraries | Pure SVG paths and transforms, computed in React. D3-scale-like math inlined as utility functions. |
| No external state management | Pure React `useState` / `useCallback` / `useMemo`. Each component is self-contained. |
| Vietnamese diacritics | All Vietnamese text must use correct diacritics. ASCII Vietnamese (e.g., "toan hoc" instead of "toán học") is a build-breaking error. |
| Browser TTS | SpeechSynthesis API with `lang: "vi-VN"`. Fallback: text shown without audio if synthesis unavailable. |
| Touch targets | Minimum 44×44px for all draggable/tappable elements (WCAG 2.5.5, also good for small fingers). |
| No forced linear ordering | All 6 map locations clickable from the start. Suggested order via dotted path only. |

---

## 7. Out of Scope

- Teen tier topics (separate spec later)
- Parent dashboard / auth
- Recorded voice narration (browser TTS is placeholder)
- Mascot art (emoji placeholder, upgrade later)
- Spaced retrieval checks / artifact storage in Supabase
- Application topics for kids (only math foundations in this batch)
