# Paths · Applications Expansion Design

**Status:** Approved (decisions locked 2026-04-16). Awaiting user's final spec review before implementation kickoff.

**Goal:** Expand the Student and Office learning paths by pairing every researchable theory topic with a standalone "application" topic that tells the story of one real-world app using the concept. Target scope: 42 new topics (28 Student + 14 Office).

**Architecture:** New page shape called `ApplicationLayout` with 6 fixed sections. Interleaved directly into existing path stage `slugs[]` arrays. Produced by a four-stage Opus subagent pipeline (research brief → writer → spec+fact review → code quality review). Reuses existing interactive primitives and the `SectionDuplicateGuard` machinery from the nav-ux-polish phase.

**Tech Stack:** Next.js 16 App Router, React 19 / React Compiler, TypeScript 5.9, Tailwind v4, existing topic primitives (`@/components/interactive`, `@/components/topic`).

---

## 1. Problem statement

The Student path is currently pure theory — 32 concept topics across 5 stages with zero in-context demonstration of how those concepts power apps Vietnamese learners already use daily. The Office path has applied content in later stages, but the first stage's LLM-concept topics (`prompt-engineering`, `temperature`, `hallucination`, `context-window`, `chain-of-thought`, `in-context-learning`, `llm-overview`) remain abstract.

Learners finish `k-means` or `backpropagation` with a correct mental model but no answer to "when have I actually used something like this?" The motivation gap is largest for math foundations (linear algebra, probability, calculus) and neural-network internals (backprop, gradient descent, loss functions).

This phase fills that gap by inserting an application topic immediately after every paired theory topic in the path.

---

## 2. Top-level decisions (locked)

### 2.1 Form factor
Alternating theory → application chain. Every paired theory topic is immediately followed in the path by its application topic. Doubled path length is intentional — each application is a full lesson, not a sidebar or collapsible section.

### 2.2 Scope
Both Student and Office paths simultaneously. 42 topics paired (28 Student + 14 Office). Four topic classes are **not** paired:
- Meta-introduction topics (`what-is-ml`, `getting-started-with-ai`)
- Tool/skill topics (`python-for-ml`, `jupyter-colab-workflow`)
- End-to-end project topics (`end-to-end-ml-project`)
- Already-applied topics (Stage 2 of Office; the `ai-in-*` topics in Stage 4)

Full scope table in §7.

### 2.3 App selection policy
Global apps framed through Vietnamese learners' daily usage (Google, YouTube, Facebook, Shopee, Grab, ChatGPT, Spotify — apps users already reach for every day). Vietnamese companies featured where they genuinely lead: VPBank fraud detection, VinAI voice, Zalo AI NLP, Shopee recommendations, MoMo payments, Tiki search. Every featured app must have verifiable public sources per §6.3.

### 2.4 Pipeline
Four-stage Opus subagent pipeline per topic. Never Haiku. Details in §6.

### 2.5 Quality bar
- Every mechanism claim traceable to a public source.
- Every metric inline-cited.
- No-assumption prose (§6.6): define every technical term on first mention in the file, even if the theory topic defined it.
- Vietnamese diacritics strict (§6.4).
- English proper nouns stay English (§6.5).

---

## 3. Application topic page anatomy

All application topics render these six sections in order. The theory-topic primitives (`ExplanationSection`, `VisualizationSection`, `QuizSection`, `PredictionGate`, `AhaMoment`) are **not** used — they belong to theory topics. The application topic is narrative, not tested.

### Section 1 — Công ty nào đang ứng dụng {Concept}?
- Role: Hook + reveal. The page answers this question.
- Content: name ONE specific company/app the learner has actually used; one sentence describing the app for anyone who hasn't; one concrete moment the learner has probably experienced.
- Length target: 80–120 words.
- Primitive: `<ApplicationHero />`.

### Section 2 — Vấn đề công ty cần giải quyết
- Role: set up the problem the app's team faced.
- Content: plain language, no-assumption. Define every noun. Say what would happen if the team tried to solve this by hand / by rule / by guesswork.
- Length target: 80–150 words.
- Primitive: `<ApplicationProblem />`.

### Section 3 — Cách {Concept} giải quyết vấn đề
- Role: mechanism walkthrough tied back to the theory the learner just finished.
- Content: 3–5 numbered beats. Each beat names a specific moment of the algorithm and connects it to the concept (e.g., "Bước 3: Spotify đo khoảng cách giữa playlist của bạn và 99 nhóm mẫu — đúng công thức khoảng cách bạn vừa học.").
- Length target: 200–300 words.
- Primitive: `<ApplicationMechanism />` accepting `<Beat step={N}>` children.

### Section 4 — Con số thật
- Role: verified impact metrics from cited sources.
- Content: exactly 3–5 numbers. Each has a source reference inline. Format example: `500 triệu người dùng · 30 bài hát mỗi tuần · 40% lượt nghe đến từ gợi ý`.
- Length target: 60–100 words.
- Primitive: `<ApplicationMetrics />` accepting `<Metric value="..." sourceRef={N} />` children.

### Section 5 — Thử tự tay (optional)
- Role: one small interactive moment giving a 10-second feel of the mechanism.
- Content: ONE of `SliderGroup`, `ToggleCompare`, `DragDrop`, `InlineChallenge`. Omit if the demo would be contrived.
- Length target: primitive + 40–60 words setup.
- Primitive: `<ApplicationTryIt />`.

### Section 6 — Nếu không có {Concept}, app sẽ ra sao?
- Role: counterfactual close. Why the concept is load-bearing.
- Content: 2–4 sentences describing what the app would look like without the concept. End with one sentence linking forward to the next path topic.
- Length target: 60–100 words.
- Primitive: `<ApplicationCounterfactual />`.

### Footer — SourceCard (auto-rendered by ApplicationLayout)
- Role: collapsible "Tài liệu tham khảo" block.
- Content: reads `metadata.sources`; groups by `kind`.
- Primitive: `<SourceCard />` mounted automatically by `<ApplicationLayout>`. Topic files do not import it directly.

**Overall target length:** 500–800 words of prose per topic. Theory topics are 1200–2000 words; applications are shorter because the concept is already in the learner's head.

---

## 4. Naming + path integration

### 4.1 Slug convention
`<concept-slug>-in-<product-area>` where product-area is a kebab-case domain name (music-recs, search, translation, spam-filter, loan-scoring, etc.).

Examples:
| Theory slug | Application slug | Featured app |
|---|---|---|
| `k-means` | `k-means-in-music-recs` | Spotify Discover Weekly |
| `decision-trees` | `decision-trees-in-loan-scoring` | FICO credit scoring |
| `backpropagation` | `backpropagation-in-translation` | Google Translate NMT |
| `hallucination` | `hallucination-in-legal-research` | Mata v. Avianca case |

**Fallback for awkward concepts:** `-in-practice` (e.g., `cross-validation-in-kaggle` is fine; `cross-validation-in-practice` is an acceptable last resort).

**Hero rule:** exactly one hero app per topic. If two apps are canonical (e.g., transformer → GPT + Google Translate), feature the most relatable for a Vietnamese learner and mention the other in Section 4 as a single-line metric.

### 4.2 Path integration in `src/lib/paths.ts`

Interleave application slugs directly in each stage's `slugs[]` array. **No schema changes** to `Stage` or `PathDefinition`.

Before:
```ts
{
  title: "ML cơ bản",
  slugs: ["k-means", "knn", "naive-bayes", ...],
}
```

After:
```ts
{
  title: "ML cơ bản",
  slugs: [
    "k-means", "k-means-in-music-recs",
    "knn", "knn-in-symptom-checker",
    "naive-bayes", "naive-bayes-in-email-classification",
    ...
  ],
}
```

`getPathNeighbors` already walks the flat slug sequence — no function changes needed. `next` on `k-means` → `k-means-in-music-recs`; `next` on `k-means-in-music-recs` → `knn`.

### 4.3 Visual pairing

1. **Top-of-page ribbon** on application topics. Rendered by `TopicLayout` when `metadata.applicationOf` exists:
   > `← Bạn vừa học {parentTitleVi}. Giờ xem cách {featuredApp.name} dùng nó.`
   Links to `/topics/{applicationOf}?path={currentPath}` so `?path=` is preserved.

2. **TOC sidebar suffix.** Application topic entries show ` · Ứng dụng` after the title. Subtle, lowercase, no icon.

3. **Progress counter.** Application topics count as full topics. Path `current/total` doubles. Deliberate.

4. **No logos.** App name rendered in bold display typography instead. Sidesteps trademark and fair-use concerns and avoids the maintenance cost of logo asset management.

---

## 5. Metadata schema + new primitives

### 5.1 TopicMeta extensions

In `src/lib/types.ts`:

```ts
export interface FeaturedApp {
  name: string;              // e.g., "Spotify"
  productFeature?: string;   // e.g., "Discover Weekly"
  company: string;           // e.g., "Spotify AB"
  countryOrigin: string;     // ISO 3166-1 alpha-2, e.g., "SE" | "VN" | "US"
}

export interface SourceLink {
  title: string;
  publisher: string;         // e.g., "Spotify Engineering", "NeurIPS", "VnExpress công nghệ"
  url: string;
  date: string;              // ISO: "2020-11" or "2020-11-15"
  kind:
    | "engineering-blog"
    | "paper"
    | "keynote"
    | "news"
    | "patent"
    | "documentation";
}

export interface TopicMeta {
  // ...existing fields retained as-is...
  applicationOf?: string;    // theory topic slug; REQUIRED on application topics
  featuredApp?: FeaturedApp; // REQUIRED on application topics
  sources?: SourceLink[];    // REQUIRED on application topics; min 2 entries
}
```

**Invariant:** `applicationOf`, `featuredApp`, and `sources` (≥2) are REQUIRED on every application topic and ABSENT on every theory topic. Enforced by spec-review subagent.

No `logoUrl` field. Decision locked 2026-04-16 — see §2.5 and §9.

### 5.2 TocSectionId union extension

```ts
export type TocSectionId =
  | "visualization" | "explanation"
  | "hero" | "problem" | "mechanism"
  | "metrics" | "tryIt" | "counterfactual";
```

### 5.3 Application topic tocSections declaration

Every application topic's `metadata.tocSections` is:

```ts
tocSections: [
  { id: "hero",           labelVi: "Công ty nào?" },
  { id: "problem",        labelVi: "Vấn đề" },
  { id: "mechanism",      labelVi: "Cách giải quyết" },
  { id: "metrics",        labelVi: "Con số thật" },
  { id: "tryIt",          labelVi: "Thử tự tay" },        // omit if no try-it
  { id: "counterfactual", labelVi: "Nếu không có" },
]
```

The `tryIt` entry is omitted when the topic has no Section 5.

### 5.4 New components under `src/components/application/`

| Component | Role |
|---|---|
| `ApplicationLayout` | Top-level wrapper. Reads `metadata`. Renders ribbon + children + auto-mounted `<SourceCard>` footer. |
| `ApplicationHero` | Section 1. Renders fixed heading "Công ty nào đang ứng dụng {parentTitleVi}?" Reads `featuredApp`. |
| `ApplicationProblem` | Section 2. Fixed heading "Vấn đề công ty cần giải quyết". |
| `ApplicationMechanism` | Section 3. Fixed heading "Cách {Concept} giải quyết vấn đề". Accepts `<Beat step={N}>` children. |
| `ApplicationMetrics` | Section 4. Accepts `<Metric value="..." sourceRef={N} />` children; cross-references `metadata.sources`. |
| `ApplicationTryIt` | Section 5. Optional. Fixed heading "Thử tự tay". |
| `ApplicationCounterfactual` | Section 6. Fixed heading "Nếu không có {Concept}, app sẽ ra sao?". |
| `SourceCard` | Footer. Collapsible. Groups `metadata.sources` by `kind`. Auto-mounted. |

Each section wrapper calls the existing `useSectionGuard` hook with the appropriate `TocSectionId`, reusing the `SectionDuplicateGuard` context built in nav-ux-polish. Zero new runtime machinery.

### 5.5 TopicLayout changes

1. If `metadata.applicationOf` exists, render the top ribbon linking to the parent theory topic.
2. If any `tocSections` entry uses an application ID, the existing `TopicTOC` handles it — `sections` prop is already generic.
3. `registry.ts` entries mirror the topic file's metadata including `tocSections` override (same propagation pattern as nav-ux-polish Task 16 fix).

---

## 6. Research pipeline + correctness bar

### 6.1 Four-stage Opus pipeline

All stages run with `model: "opus"`. Never Haiku (per standing user rule).

| Stage | Model | Inputs | Tools | Output | Fail condition |
|---|---|---|---|---|---|
| 1. Research Brief | opus | theory slug, `titleVi`, category | WebSearch, WebFetch, Context7 | YAML brief (§6.2) | <2 sources, any metric without citation, no Vietnamese framing hook |
| 2. Topic Writer | opus | YAML brief only — forbidden to add claims not in the brief | Read, Write, Edit, section primitives | `<slug>.tsx` file + `registry.ts` entry | Any sentence not traceable to a brief claim |
| 3. Spec + Fact Review | opus | topic file + brief + this spec | Read, Grep, WebFetch (re-verify sources live) | Pass/fail report with specific lines to fix | Any diacritic miss, unsourced claim, missing section, wrong metadata |
| 4. Code Quality Review | opus | topic file + git SHA | Read, Grep, Bash (lint) | Pass/fail report on quality, a11y, TS, component reuse | Lint/a11y regressions, duplication with theory topic |

Each topic must pass all four stages before commit. Failures loop back to the appropriate previous stage with a **3-iteration cap**. Beyond that, escalate to the human.

### 6.2 Research brief YAML schema

```yaml
application_topic_brief:
  theory_slug: k-means
  application_slug: k-means-in-music-recs
  theory_title_vi: "K-means"

  featured_app:
    name: Spotify
    product_feature: Discover Weekly
    company: "Spotify AB"
    country: SE

  hero_moment_vi: |
    Mỗi thứ Hai khi bạn mở Spotify, playlist "Discover Weekly" xuất hiện
    với 30 bài hát lạ mà bạn chưa từng nghe — nhưng hợp gu đến kỳ lạ.

  problem_statement_vi: |
    Spotify phải đề xuất 30 bài hát mới mỗi tuần cho 500 triệu người dùng,
    mỗi người có gu khác nhau và gu thay đổi theo thời gian…

  mechanism_beats:
    - step: 1
      description_vi: |
        Spotify biểu diễn mỗi playlist thành một "vector"…
      source_ref: 1
    - step: 2
      description_vi: |
        Thuật toán K-means nhóm các vector thành 100 cụm…
      source_ref: 1

  metrics:
    - value_vi: "500 triệu người dùng"
      source_ref: 1
    - value_vi: "40% lượt nghe đến từ gợi ý thuật toán"
      source_ref: 2

  try_it_spec:
    primitive: "SliderGroup"
    description_vi: |
      Học viên điều chỉnh số cụm K từ 5 đến 50 và thấy cách gu nhạc bị chia mảnh.

  counterfactual_vi: |
    Nếu không có K-means, Spotify sẽ phải đề xuất cùng 30 bài "hot nhất"
    cho tất cả người dùng — và không ai còn thấy đúng gu mình nữa.

  sources:
    - ref: 1
      title: "From Idea to Execution: Spotify's Discover Weekly"
      publisher: "Spotify Engineering Blog"
      url: "https://engineering.atspotify.com/..."
      date: "2016-03"
      kind: engineering-blog
    - ref: 2
      title: "Algorithmic Effects on the Diversity of Consumption…"
      publisher: "Proceedings of The Web Conference"
      url: "https://dl.acm.org/..."
      date: "2020"
      kind: paper

  risk_flags:
    - "Metric 3 is from 2018 — verify if a more recent number exists"
```

### 6.3 Source tiering and minimums

| Tier | What counts | Use for |
|---|---|---|
| **Tier 1 (strong)** | Company engineering blog, peer-reviewed paper, official documentation, keynote talk, patent | Mechanism claims, metrics |
| **Tier 2 (medium)** | Established tech journalism (Wired, IEEE Spectrum, TechCrunch, MIT Technology Review, VnExpress công nghệ, VietnamNet ICTnews, CafeF, ICTnews), conference-talk video, direct engineer interview | Context, dates, secondary metrics |
| **Tier 3 (weak)** | Medium posts, personal blogs, Wikipedia, press releases, marketing material | Confirmation only, never alone |

**Hard rules:**
- ≥ 2 sources per topic.
- ≥ 1 Tier-1 source per topic.
- Every metric cites Tier 1 or Tier 2.
- No Tier-3-only claims.
- For Vietnamese companies lacking Tier-1 engineering blogs (Grab, Zalo, Shopee, VPBank, Tiki, MoMo, VinAI), two Tier-2 sources substitute for one Tier-1, clearly labeled in the brief's `risk_flags`.

### 6.4 Vietnamese diacritics protocol

Reuses the wrong-form grep pattern from nav-ux-polish, extended with new section-heading vocabulary. Writer subagent must run before handoff; spec-review subagent re-runs them as a gate:

```bash
# From src/topics/<new-file>.tsx — any match is a fail:
grep -n "Cong ty nao"        # should: Công ty nào
grep -n "Van de cong ty"     # should: Vấn đề công ty
grep -n "Cach.*giai quyet"   # should: Cách … giải quyết
grep -n "Con so that"        # should: Con số thật
grep -n "Thu tu tay"         # should: Thử tự tay
grep -n "Neu khong co"       # should: Nếu không có
grep -n "Tai lieu tham khao" # should: Tài liệu tham khảo
grep -n "Ban vua hoc"        # should: Bạn vừa học
grep -n "ung dung"           # verify all hits read "ứng dụng"
grep -n "thuc te"            # verify all hits read "thực tế"
```

Any positive hit → spec review fails the topic; writer re-submits.

### 6.5 English proper nouns protocol

Keep English proper nouns as-is, always:
- `Spotify`, `ChatGPT`, `Google Translate`, `Discover Weekly`, `Grab`, `Zalo AI`, `VPBank`, `VinAI`, `Shopee`, `Tiki`, `MoMo`.

Never transliterate:
- No `Spotifai`, no `Gô-gồ`, no `Chát-gi-pi-ti`.

First mention gets a Vietnamese gloss in parens:
- `Spotify (dịch vụ phát nhạc trực tuyến)`
- `Discover Weekly (danh sách nhạc khám phá hàng tuần)`
- `ChatGPT (trợ lý trò chuyện của OpenAI)`
- `VPBank (ngân hàng Việt Nam Thịnh Vượng)`

### 6.6 No-assumption prose rules

Writer subagent must follow these rules; spec-review subagent enforces them:

1. Define every technical term on first mention in this file, even if the theory topic already defined it. Learners may land here from search.
2. Numbers with Vietnamese units: `500 triệu người dùng`, `40% lượt nghe`. Never `500M users` or a bare `40%`.
3. Replace English idioms with concrete Vietnamese: `under the hood` → `bên trong`; `black box` → `hộp đen không thấy bên trong`.
4. No marketing speak: `cải thiện trải nghiệm` is banned. Replace with the concrete thing the app actually does.
5. Short sentences. 15 to 25 words. Break long ones.

---

## 7. Scope map (42 topics)

### 7.1 Student path — 28 paired, 4 skipped

**Stage 1 — Giới thiệu (1 topic → 0 paired)**

| Theory slug | Decision | Reason |
|---|---|---|
| `what-is-ml` | SKIP | Meta-introduction, no single mechanism to illustrate |

**Stage 2 — Nền tảng toán (3 topics, all paired)**

| Theory slug | Application slug | Proposed featured app |
|---|---|---|
| `linear-algebra-for-ml` | `linear-algebra-for-ml-in-photo-search` | Google Photos face grouping (matrix similarity) |
| `probability-statistics` | `probability-statistics-in-spam-filter` | Gmail spam classifier |
| `calculus-for-backprop` | `calculus-for-backprop-in-model-training` | GPT-4 training (gradient descent at scale) |

**Stage 3 — ML cơ bản (13 topics, all paired)**

| Theory slug | Application slug | Proposed featured app |
|---|---|---|
| `supervised-unsupervised-rl` | `supervised-unsupervised-rl-in-netflix` | Netflix (uses all three paradigms) |
| `linear-regression` | `linear-regression-in-housing` | Zillow Zestimate |
| `logistic-regression` | `logistic-regression-in-spam-filter` | Historical Gmail / SpamAssassin |
| `information-theory` | `information-theory-in-compression` | JPEG / ZIP / video streaming |
| `decision-trees` | `decision-trees-in-loan-scoring` | FICO credit scoring |
| `knn` | `knn-in-symptom-checker` | WebMD / Buoy Health |
| `naive-bayes` | `naive-bayes-in-email-classification` | Historical Gmail / Apache SpamAssassin |
| `k-means` | `k-means-in-music-recs` | Spotify Discover Weekly |
| `confusion-matrix` | `confusion-matrix-in-medical-testing` | COVID-19 PCR sensitivity/specificity |
| `bias-variance` | `bias-variance-in-netflix-prize` | Netflix Prize overfitting story |
| `overfitting-underfitting` | `overfitting-underfitting-in-compas` | COMPAS recidivism tool |
| `cross-validation` | `cross-validation-in-kaggle` | Kaggle leaderboard dynamics |
| `train-val-test` | `train-val-test-in-youtube` | YouTube algorithm A/B testing |

**Stage 4 — Mạng nơ-ron (9 topics, all paired)**

| Theory slug | Application slug | Proposed featured app |
|---|---|---|
| `neural-network-overview` | `neural-network-overview-in-voice-assistants` | Google Assistant / Siri |
| `perceptron` | `perceptron-in-image-classification` | Mark I Perceptron (1958) |
| `mlp` | `mlp-in-credit-scoring` | Modern Upstart / FICO |
| `activation-functions` | `activation-functions-in-alphago` | AlphaGo's ReLU choice |
| `forward-propagation` | `forward-propagation-in-chat-response` | ChatGPT single forward pass per token |
| `backpropagation` | `backpropagation-in-translation` | Google Translate NMT |
| `gradient-descent` | `gradient-descent-in-training` | GPT-4 training at scale |
| `loss-functions` | `loss-functions-in-recommendation` | YouTube recommendation loss evolution |
| `epochs-batches` | `epochs-batches-in-gpt-training` | GPT-4 training (millions of batches) |

**Stage 5 — Kỹ năng thực hành (6 topics → 3 paired, 3 skipped)**

| Theory slug | Decision | Application slug / reason |
|---|---|---|
| `data-preprocessing` | PAIR | `data-preprocessing-in-uber-eta` (Uber ETA pipeline) |
| `feature-engineering` | PAIR | `feature-engineering-in-fraud-detection` (Stripe Radar) |
| `python-for-ml` | SKIP | Tool/skill topic, not a concept |
| `model-evaluation-selection` | PAIR | `model-evaluation-selection-in-kaggle` |
| `jupyter-colab-workflow` | SKIP | Tool/skill topic |
| `end-to-end-ml-project` | SKIP | Already a project-integration topic |

**Student total: 28 application topics.**

### 7.2 Office path — 14 paired, 13 skipped

**Stage 1 — Bắt đầu với AI (8 topics → 7 paired)**

| Theory slug | Decision | Application slug / featured app |
|---|---|---|
| `getting-started-with-ai` | SKIP | Meta-introduction |
| `llm-overview` | PAIR | `llm-overview-in-chat-assistants` (ChatGPT / Claude / Gemini) |
| `prompt-engineering` | PAIR | `prompt-engineering-in-writing-tools` (Jasper / Notion AI) |
| `chain-of-thought` | PAIR | `chain-of-thought-in-reasoning-models` (GPT-o1 / Claude thinking) |
| `in-context-learning` | PAIR | `in-context-learning-in-chatbots` (Intercom Fin few-shot) |
| `temperature` | PAIR | `temperature-in-creative-writing` (ChatGPT creative vs formal) |
| `hallucination` | PAIR | `hallucination-in-legal-research` (Mata v. Avianca case) |
| `context-window` | PAIR | `context-window-in-long-documents` (Claude / Gemini PDFs) |

**Stage 2 — Ứng dụng thực tế (8 topics → 0 paired)**

All 8 topics (`rag`, `semantic-search`, `ai-coding-assistants`, `agentic-workflows`, `ai-for-writing`, `ai-for-data-analysis`, `ai-privacy-security`, `ai-tool-evaluation`) are already application-style topics. SKIP.

**Stage 3 — An toàn & Đạo đức (4 topics, all paired)**

| Theory slug | Application slug | Proposed featured app |
|---|---|---|
| `bias-fairness` | `bias-fairness-in-hiring` | Amazon's scrapped hiring AI (2018) |
| `ai-governance` | `ai-governance-in-enterprise` | EU AI Act compliance at OpenAI / Anthropic |
| `guardrails` | `guardrails-in-chat-assistants` | Anthropic Constitutional AI / OpenAI moderation |
| `explainability` | `explainability-in-credit-decisions` | GDPR right-to-explanation |

**Stage 4 — Ứng dụng ngành (7 topics → 3 paired, 4 skipped)**

| Theory slug | Decision | Application slug / reason |
|---|---|---|
| `ai-in-finance` | SKIP | Already an application topic |
| `ai-in-healthcare` | SKIP | Already an application topic |
| `ai-in-education` | SKIP | Already an application topic |
| `ai-in-agriculture` | SKIP | Already an application topic |
| `recommendation-systems` | PAIR | `recommendation-systems-in-shopping` (Shopee recommendations) |
| `sentiment-analysis` | PAIR | `sentiment-analysis-in-brand-monitoring` (Brandwatch) |
| `text-classification` | PAIR | `text-classification-in-support-routing` (Zendesk auto-routing) |

**Office total: 14 application topics.**

### 7.3 Grand total: 42 application topics

Featured-app assignments above are proposals. Stage 1 research brief will verify sources exist and swap the featured app if a better-sourced alternative is available. Any swap is noted in the brief's `risk_flags` and flagged to the human on PR review.

---

## 8. Rollout batching — 8 batches with gates

| # | Batch | Topics | Count | Gate |
|---|---|---|---|---|
| 1 | Pilot | `k-means-in-music-recs`, `backpropagation-in-translation`, `hallucination-in-legal-research`, `bias-fairness-in-hiring`, `sentiment-analysis-in-brand-monitoring` | 5 | **MANDATORY user review** |
| 2 | Student math | Stage 2 paired (3 topics) | 3 | Spec + code review |
| 3 | Student ML basics | Stage 3 minus `k-means` | 12 | Spec + code review |
| 4 | Student neural | Stage 4 minus `backpropagation` | 8 | Spec + code review |
| 5 | Student practical | Stage 5 paired (3 topics) | 3 | Spec + code review |
| 6 | Office LLM | Stage 1 minus `hallucination` | 6 | Spec + code review |
| 7 | Office safety | Stage 3 minus `bias-fairness` | 3 | Spec + code review |
| 8 | Office NLP | Stage 4 paired minus `sentiment-analysis` | 2 | Spec + code review |

Pilot batch topics are deliberately spread across clusters: one Student ML-basics, one Student neural-networks, one Office LLM, one Office safety, one Office NLP applications. Validates format across the full surface before scaling.

After Pilot: mandatory user review. If format adjustments are needed, update this spec and re-plan Batches 2–8. Budget one format iteration.

After Batches 2–8: spec + code review gates only. Each batch = one commit.

---

## 9. Non-goals

- No changes to the existing 200+ theory topic files — they stay exactly as they are.
- No changes to kids paths (`/kids/*`).
- No changes to AI Engineer or AI Researcher paths.
- No new interactive primitives beyond `@/components/interactive`.
- No analytics on application-topic completion (future phase).
- No cross-linking between application topics ("apps that also use K-means") — each stays focused.
- No author bylines or attribution blurbs.
- No app logos (§4.3). App name rendered in bold display typography.

---

## 10. Out-of-scope

- No Supabase schema changes. `user_progress` already tracks per-slug.
- No changes to `topic-loader.tsx`. Application topics are regular topic entries.
- No changes to search. Registry entries auto-index.
- No navbar / header / footer changes.
- No new env vars or mid-phase infrastructure changes. Each batch is a normal commit and a normal Vercel deploy.

---

## 11. Risks

- **Feature staleness.** App features evolve ("Discover Weekly" could be killed; "GPT-o1" renamed). Mitigation: `metadata.sources[].date` provides a freshness marker. Quarterly re-verification is post-phase work.
- **Source link rot.** URLs 404. Mitigation: `{title, publisher, date, kind}` in every source makes replacement cheap. Future CI step.
- **No researchable app for some topic.** Research-brief stage can return `BLOCKED`. Escalate to the human with alternative pairings. Expect 1–3 of 42 to escalate.
- **Vietnamese Tier-1 scarcity.** Many Vietnamese companies lack Tier-1 engineering blogs. Policy: two Tier-2 sources substitute for one Tier-1, clearly noted in brief `risk_flags`.
- **Pilot format gap.** If Pilot topics reveal structural issues in the 6-section template, update this spec after user review and re-plan Batches 2–8. Budget one format iteration.

---

## 12. Success criteria

- 42 new topic files in `src/topics/` using `ApplicationLayout`.
- 42 new entries in `src/topics/registry.ts` with valid `applicationOf`, `featuredApp`, `sources` (≥ 2, ≥ 1 Tier-1).
- `src/lib/paths.ts` updated with interleaved slugs; `getPathNeighbors` walks the new order correctly.
- All 42 topics passed all 4 pipeline stages (research brief → writer → spec + fact review → code quality review).
- Section-uniqueness test extended to cover 6 application section IDs.
- Vietnamese wrong-form grep returns zero matches across the 42 new files.
- All existing tests continue to pass (92+ test baseline preserved).
- Production deploy renders a sample application topic (e.g., `/topics/k-means-in-music-recs?path=student`) with ribbon, pairing, and source card.
- Manual smoke test: human reads 3 random application topics end-to-end and confirms "no-assumption" quality.

---

## 13. Implementation handoff

Plan author: use `superpowers:writing-plans` to break this spec into bite-sized tasks. Expected task structure:

- Task 1: `TopicMeta` + `TocSectionId` type extensions, with tests.
- Task 2: Application primitives (`ApplicationLayout`, `ApplicationHero`, …, `SourceCard`) — one file each, TDD.
- Task 3: `TopicLayout` ribbon + TOC integration, with tests.
- Task 4: Section-uniqueness test extended to application sections.
- Task 5–12 (per batch): Research brief + writer + reviews for each batch's topics.
- Task 13: `paths.ts` interleaving.
- Task 14: `registry.ts` entries.
- Task 15: Final integration test + smoke test on production deploy.

Each per-batch task is its own subagent chain. Each per-topic subagent chain is a 4-stage Opus pipeline as defined in §6.1.
