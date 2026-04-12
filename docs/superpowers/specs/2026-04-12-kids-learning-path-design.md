# Kids Learning Path (Nhí &amp; Teen) — Design Spec

> Date: 2026-04-12
> Status: Draft — awaiting user review
> Scope: Two new learning paths for Vietnamese elementary/secondary students (6–15 yrs), a parent-facing credibility dashboard, 9 new interaction primitives, 3 Supabase table additions, and a 6-phase shipping plan. Additive — no existing routes modified.
> Authored from: brainstorming session 2026-04-12; informed by deep-research report `docs/superpowers/research/2026-04-12-kids-ai-edtech-best-practices.md`.

---

## 1. Problem

The current app targets learners from high school upward. Its four paths (`student`, `ai-engineer`, `ai-researcher`, `office`) assume fluent Vietnamese reading and tolerate abstract prose. Parents of 6–15-year-olds who want their children to start AI literacy early have no entry point — the adult `student` path's reading level, pace, and cognitive load are developmentally inappropriate for under-15s, and its voice (VinAI self-driving, Grab route optimization, Shopee recommender) is too business-oriented to engage a 7-year-old.

A separate kids product is required. It must:

1. Feel like AI literacy, not a coding bootcamp — parents of 6–10-year-olds care about early exposure and critical thinking, not Python.
2. Give the 14–15-year-old a credible trajectory — parents of teens want to see a path into real CS skills, not a dead end.
3. Earn parental trust *with minimal tracking*. Current progress tracking is just `readTopics[]` and `bookmarks[]`; a parent rightfully distrusts "80% complete" because a kid can click through anything. Parents must believe the metrics.
4. Comply with Vietnam Decree 356/2025 (which replaced Decree 13/2023), Law on Children 2016, and general COPPA/GDPR-K posture for minors.
5. Ship on the existing Next.js / Supabase stack without a rewrite.

---

## 2. Solution at a glance

Two new paths, `Nhí` (6–10 yrs) and `Teen` (11–15 yrs), anchored on the globally standard **AI4K12 Five Big Ideas** curriculum spine. Content lives in a new kid-only topic namespace. A parent-facing dashboard uses a **Strategy B credibility model**: evidence-based completion (artifacts the kid actually produced) plus 3-day spaced-retrieval checks as the only headline metric.

Architecture is "fully separate kid subapp, anchored by shared chrome": kid routes, kid topic registry, kid interaction primitives, and kid-specific `KidsPathPage` are all new — but they render inside the same `AppShell`, use the same color tokens, and participate in the same global navbar. Domain experts keep design freedom inside each topic file (per the existing free-form topic convention); identity is enforced only through navbar + color tokens.

Net new: **48 topic files**, **9 interaction primitives**, **3 Supabase tables**, **1 parent dashboard surface**, **1 weekly email pipeline**, **1 new route group** under `src/app/kids/`. Zero modifications to existing adult paths or topics.

---

## 3. Audience and age bands

Two bands, tuned to Vietnamese grade levels parents immediately recognize:

| | **Nhí** | **Teen** |
|---|---|---|
| Tuổi | 6–10 | 11–15 |
| Lớp | 1–5 (Tiểu học) | 6–10 (THCS + đầu THPT) |
| End-state goal | AI literacy — hiểu AI là gì, dùng an toàn, không sợ | Literacy + hands-on making — tự train được một mô hình AI nhỏ |
| Reading load | Allowed but always paired with audio narration | Fluent Vietnamese; short paragraphs OK |
| Lesson duration | ~6 minutes | ~12 minutes |
| Topic count | ~18 lessons | ~28 lessons + 2 capstone |
| Primary interaction | Tap, drag, listen | Tap, drag, slider, text input, embed |

The **10/11 boundary** mirrors the Tiểu học → THCS transition Vietnamese parents already structure family life around. This is not a technical age gate — it is a *communication band*: the Nhí path is designed around "things a Lớp 3 student can do without struggling"; the Teen path is designed around "things a Lớp 7 student can engage with and be proud of sharing."

---

## 4. Content spine — AI4K12 Five Big Ideas

Both bands cover the same 5 stages, scaled by depth. AI4K12 is the framework used by Code.org, MIT, UNESCO; using it gives the paths credibility with parents who research and a clean `Stage[]` structure that slots into the existing `LearningPathPage` component with no code changes.

| # | Big Idea | Nhí chặng | Teen chặng |
|---|---|---|---|
| 1 | **Perception** | 👀 Máy "nhìn" &amp; "nghe" | 👁️ Perception — pixel, feature, classifier |
| 2 | **Representation &amp; Reasoning** | 🧩 Máy "nhớ" đồ vật | 🗺️ Embedding, similarity, logic vs học |
| 3 | **Learning** | 🎯 Máy học từ ví dụ | 📈 Supervised / overfitting / train-test / bias dữ liệu |
| 4 | **Natural Interaction** | 💬 AI nói, vẽ, kể chuyện | 🎨 LLMs, prompting, hallucination, gen-images |
| 5 | **Societal Impact** | 🛡️ AI tốt, AI xấu | ⚖️ Bias, privacy, deepfake, công dân AI |
| + | **Teen Capstone** | — | 🎓 Nếm Python (1 bài) + Dự án cuối (1 bài) → bridge to `student` path |

Stage titles listed above are placeholders; the user will polish diacritics/voice manually on the path page files.

### 4.1 Full topic roster

All 48 topic slugs are enumerated in **Appendix A** at the bottom of this spec.

---

## 5. Lesson formulation

Two lesson shapes. Both end on an **artifact capture** step, which is how parent-dashboard credibility is fed (see §7).

### 5.1 Nhí lesson shape (6 steps, ~6 min)

```
1. Mascot hook (audio)             — Mực asks a question in 1 narrated sentence
2. Story panels (auto-narrated)    — 3 tap-to-advance frames, simple analogy
3. Interactive play                — 30–60s drag/sort/tap game, zero text input
4. Mascot celebration              — animation + sound, mascot reveals the big idea visually
5. Picture-MCQ quiz                — 2–3 image-only multiple choice; must answer right to finish
6. Artifact capture                — auto-snapshot of the kid's exercise result → parent dashboard
```

Reading is allowed and supported (every text block pairs with a `TapToHear` narration button), but the lesson must be **completable without reading**. A pre-literate Lớp 1 kid must succeed.

### 5.2 Teen lesson shape (8 steps, ~12 min)

```
1. PredictionGate                  — commit to an answer before content unlocks
2. ToggleCompare or BuildUp        — discovery-first reveal
3. Hands-on primitive              — SliderGroup / CanvasPlayground / Teachable Machine iframe
4. InlineChallenge                 — 1 question mid-lesson, immediate feedback
5. Short Explain (≤3 paragraphs)   — TopicLink for prerequisite terms
6. AhaMoment + MiniSummary         — existing primitives
7. QuizSection (3 questions)       — MCQ + image-MCQ + fill-blank mix
8. Artifact capture                — saves project output (classifier, story, sketch) to dashboard
```

This reuses the adult 8-step pattern with two deliberate changes: (a) a capped explanation length (no wall-of-text ExplanationSection), and (b) the mandatory artifact capture step.

### 5.3 The visualization-first rule

Per user direction, **both tiers prioritize interactive primitives over text blocks**. `ExplanationSection` is optional for Nhí (avoid it) and length-capped for Teen (≤3 short paragraphs). Every lesson must have at least one manipulation-class primitive (`DragToSort`, `DragDrop`, `SliderGroup`, `ToggleCompare`, `CanvasPlayground`, `MatrixEditor`, `PictureMCQ`, or `TeachableMachineEmbed`). Prose is scaffolding, not content.

---

## 6. New interaction primitives

Nine new components under `src/components/interactive/kids/`, barrel-exported alongside but separately from the adult `interactive` namespace.

| # | Primitive | Used by | Purpose |
|---|---|---|---|
| 1 | `MascotFrame` | Both | Wraps content in Mực dialogue chrome. Prop `mood: 'happy' | 'curious' | 'oops' | 'celebrate'` switches mascot expression + speech bubble styling. |
| 2 | `TapToHear` | Nhí primary, Teen optional | Audio-narrated text. Uses browser Web Speech API (Vietnamese voice) in v1; designed to swap in pre-recorded MP3 without changing topic files. Highlights current word while speaking. |
| 3 | `StoryPanel` | Nhí | Sequential story frames with auto-narration and tap-to-advance. Accepts `panels: { image: ReactNode; narration: string }[]`. |
| 4 | `PictureMCQ` | Nhí primary, Teen occasional | Multiple choice with *image* options, not text. Each option is an `img` or SVG + optional label. Correct answer required to proceed. |
| 5 | `DragToSort` | Nhí | Simpler, kid-sized drag-drop with 48px+ targets, two-tone sorting containers, and forgiving snap zones. Different from the existing adult `DragDrop` which has smaller targets and free-form placement. |
| 6 | `TeachableMachineEmbed` | Teen | Thin iframe wrapper around `teachablemachine.withgoogle.com` with a Vietnamese instruction overlay. Detects classification result via postMessage where possible; otherwise instructs kid to screenshot and upload via `ArtifactCapture`. **This is a wrapper, not a rebuild** — per user direction. |
| 7 | `ArtifactCapture` | Both | Captures a lesson output: either an auto-screenshot of the preceding play/quiz component, or a structured JSON payload (e.g. "kid picked 5/6 correctly"). POSTs to Supabase `kid_artifacts`. Displays the "Ba mẹ sẽ thấy nhé!" confirmation. |
| 8 | `SpacedCheck` | Both | The retention gate. Scheduled 3 days after lesson completion; renders a 15-second single-question quick-check. Result posts to `retention_checks.remembered`. Drives the parent dashboard's headline metric. |
| 9 | `MascotCelebration` | Nhí | Confetti + mascot dance + sound effect + star-earn animation at lesson end. |

Not listed as a new primitive but needed for mascot chrome: `MascotAvatar` and `MascotBubble` live under `src/components/kids/` (page-level, not interactive).

### 6.1 Reused primitives

Unchanged from the existing library: `PredictionGate`, `StepReveal`, `BuildUp`, `DragDrop`, `Reorderable`, `SliderGroup`, `ToggleCompare`, `MatrixEditor`, `CanvasPlayground`, `InlineChallenge`, `MatchPairs`, `SortChallenge`, `FillBlank`, `AhaMoment`, `ProgressSteps`, `Callout`, `MiniSummary`, `SplitView`, `TabView`, `CollapsibleDetail`, `CodeBlock`, `TopicLink`, `LessonSection`, `QuizSection`.

---

## 7. Parent dashboard — the credibility plan

### 7.1 Three-layer credibility model

> **Design question the user flagged:** how do parents believe our data when tracking is minimal? Strategy B is the answer: artifacts over percentages, retention over attendance, honest-by-design numbers elsewhere.

**Layer 1 — Artifacts as the hero surface.** The dashboard leads with a gallery of *the kid's actual outputs*: the image classifier they trained, the story they prompted, the sketch the AI interpreted. Percentages are easy to fake by clicking through; a trained classifier or a 5-frame story is not. Parents form their own judgment from what they see.

**Layer 2 — Retention as the only headline metric.** Instead of "đã đọc 18/18 bài," the primary number reads **"nhớ được 14/18 khái niệm sau 3 ngày."** Driven by the `SpacedCheck` primitive: 3 days after a lesson, a 15-second single-question check is triggered the next time the kid opens the app (or via a passive notification if we add them). Passing = real learning; failing = explicit "nên ôn lại" recommendation. Harder to game than completion counts.

**Layer 3 — Honest-by-design numbers elsewhere.** Time-on-page is shown *muted, labeled "tham khảo"*. No prominent progress bar. No leaderboard. No streak as the hero KPI. The dashboard explicitly tells parents what we don't measure, which paradoxically builds trust.

### 7.2 Deliberately refused patterns

Three patterns are rejected even though they're common in Vietnamese kids edtech:

- **No leaderboard comparing kids** — social comparison at these ages is harmful; Vietnamese parent opinion is also split.
- **No time-spent as hero metric** — incentivizes quantity over quality; a kid can leave the tab open.
- **No streak as hero KPI** — useful for kid engagement as a small UI element; damaging for parent trust ("1 phút mỗi ngày để giữ streak" = theater).

### 7.3 Dashboard surfaces

Six sections, in this visual order:

1. **Child card** — name, age, tier, last session, "xem dữ liệu bé · xóa" quick access.
2. **Retention score (hero)** — "Nhớ được N/M khái niệm sau 3 ngày" + progress bar + 2-sentence explanation of what that means.
3. **Weekly summary** — bài hoàn thành, dự án tạo, kiểm tra nhớ vượt qua, thời gian (tham khảo, muted).
4. **Artifact gallery** — 3-wide thumbnail grid of recent outputs, click to view full.
5. **Retention detail table** — per-concept: Học lúc | Nhớ sau 3 ngày? — flags concepts to revisit.
6. **Compliance footer** — plain-language summary of what we collect, parent rights under Decree 356/2025, account deletion.

### 7.4 Weekly email ("học bạ điện tử") — v1

Every Sunday 20:00 Vietnam time, parents with any kid activity in the last 7 days receive:

```
Chủ nhật — Tuần 15/2026
Tuần này bé Minh:
  · 3 bài mới: [titles]
  · 2 tác phẩm: [thumbnail] [thumbnail]
  · Kiểm tra nhớ: 5/6 vượt qua ✓
  · Nên ôn lại: [concept]
[Xem chi tiết →]
```

Sent via Vercel Cron (schedule: `0 13 * * 0` UTC = 20:00 ICT) hitting an email-send route handler. Email provider: either Supabase Auth's built-in (limited) or a Resend-equivalent added in Phase 4. No user decision yet on provider; deferred to implementation plan.

---

## 8. Supabase schema additions

Three new tables, all additive. No changes to existing `user_progress`.

```sql
-- A parent creates kid profiles under their auth.users account.
create table if not exists kid_profiles (
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  birth_year int not null check (birth_year between 2010 and 2020),  -- ages ~6–16 in 2026; application layer derives tier
  tier text not null check (tier in ('nhi','teen')),
  pin_hash text,                   -- 4-digit PIN for kid-device session handoff, bcrypt-hashed
  created_at timestamptz default now(),
  consent_given_at timestamptz,
  consent_version text,
  updated_at timestamptz default now()
);

-- The trust-building artifact gallery.
create table if not exists kid_artifacts (
  id uuid primary key default gen_random_uuid(),
  kid_profile_id uuid not null references kid_profiles(id) on delete cascade,
  topic_slug text not null,
  kind text not null check (kind in ('classifier','story','sketch','quiz-completion','drawing','other')),
  payload jsonb,                   -- structured data: model accuracy, story text, etc.
  thumbnail_url text,              -- Supabase Storage URL, nullable
  created_at timestamptz default now()
);

-- The Strategy B retention mechanism.
create table if not exists retention_checks (
  id uuid primary key default gen_random_uuid(),
  kid_profile_id uuid not null references kid_profiles(id) on delete cascade,
  topic_slug text not null,
  concept_key text not null,       -- e.g. "ml-learns-from-examples"
  scheduled_for timestamptz not null,   -- lesson_completed_at + 3 days (fixed, both tiers)
  asked_at timestamptz,
  remembered boolean,
  question_payload jsonb           -- the question + options shown to the kid
);

-- RLS
alter table kid_profiles enable row level security;
alter table kid_artifacts enable row level security;
alter table retention_checks enable row level security;

create policy "parent reads own kids" on kid_profiles
  for select using (auth.uid() = parent_user_id);
create policy "parent manages own kids" on kid_profiles
  for all using (auth.uid() = parent_user_id);

create policy "parent reads own kid artifacts" on kid_artifacts
  for select using (
    kid_profile_id in (select id from kid_profiles where parent_user_id = auth.uid())
  );
create policy "parent reads own kid retention" on retention_checks
  for select using (
    kid_profile_id in (select id from kid_profiles where parent_user_id = auth.uid())
  );
-- Kid session writes via a service-role RPC, not directly.
```

### 8.1 Kid-device session model

A kid device opens `/kids/*` without a Supabase auth session. Artifact and retention writes go through a PostgREST RPC that accepts a `kid_profile_id` and a short-lived signed token the parent minted on handoff (PIN-entered on the kid device). No parent credentials ever touch the kid device.

The RPC signature (exact name and arg set to be finalized at implementation time):
```
create or replace function record_artifact(
  p_kid_profile_id uuid, p_handoff_token text, p_topic_slug text,
  p_kind text, p_payload jsonb, p_thumbnail_url text
) returns uuid ...
```

---

## 9. Auth flow (v1 — consent stack deferred)

Per user direction, **the layered consent stack (phone OTP + email delay + re-verify + anomaly nudge + ToS) is NOT shipped in v1.** v1 ships with Supabase Auth email+password only, and a plain-language consent screen on first signup. This is an explicit, documented compliance gap the user accepted, rationale: ship faster, iterate after real users validate the rest of the product.

**v1 signup flow:**
1. First visit to `/kids` → "Ba mẹ hay bé đang dùng?" choice screen.
2. "Ba mẹ" → `/kids/parent/signup` (email + password + display name).
3. Signup success → `/kids/parent/consent` (plain text: "đây là những gì chúng tôi thu thập, đây là quyền của ba mẹ," checkbox, signed-at timestamp).
4. Consent accepted → `/kids/parent` dashboard with "Thêm bé đầu tiên" empty state.
5. Add kid profile (name, birth year, tier derived from age) → land on dashboard with new kid card.
6. "Bé đang dùng" path → age gate → "Nhờ ba mẹ thiết lập giúp" with a QR code or email-to-parent button.

**Kid-device session (after parent setup):**
- On shared device, kid taps their profile on `/kids` → 4-digit PIN entry → unlocks session.
- Parent sets PIN in dashboard; stored as bcrypt hash in `kid_profiles.pin_hash`.

**Flagged for Phase 7 / future-iteration:** the full 5-gate consent stack (phone OTP, email-delay, re-verify on sensitive changes, anomaly nudge, ToS evidence log). See §15 non-goals.

---

## 10. Architecture &amp; URL structure

### 10.1 URL map

```
── Existing (unchanged) ──
/                              → Home (now renders 6 path cards instead of 4)
/paths/{student,ai-engineer,ai-researcher,office}
/topics/{slug}
/bookmarks
/progress

── New ──
/kids                          → Landing: "Ba mẹ hay bé?"
/kids/nhi                      → Nhí learning path
/kids/teen                     → Teen learning path
/kids/topics/{slug}            → Kid topic page (separate from /topics/{slug})
/kids/parent                   → Dashboard (auth-gated)
/kids/parent/signup            → Email + password signup
/kids/parent/login             → Login
/kids/parent/consent           → Consent screen (first-time only, also linkable for re-review)
/kids/parent/child/{id}        → Per-child deep view
```

### 10.2 Route group &amp; layout

`src/app/kids/layout.tsx` wraps its children in the existing `AppShell` plus a `KidsModeProvider` context. Kid-mode context exposes:
- Current kid profile (if any) and tier (`nhi` | `teen`).
- Audio-narration preference (default: on for Nhí, off for Teen).
- A function to record artifacts that wraps the Supabase RPC.

This is the ONLY place where kid-mode differs from adult layout. The navbar, footer, color tokens, and typography scale all come from `AppShell` unchanged — matching the user's requirement that "the coloring and the nav bar still shows it belongs to us."

### 10.3 Parent subtree layout

`src/app/kids/parent/layout.tsx` wraps everything under `/kids/parent/*` in a server-side auth guard. Unauthenticated requests redirect to `/kids/parent/login`. This is the only auth-gated subtree in the app.

---

## 11. File structure (additive)

```
src/
  app/
    kids/
      layout.tsx                    # AppShell + KidsModeProvider
      page.tsx                      # /kids — "Ba mẹ hay bé?"
      nhi/page.tsx                  # /kids/nhi
      teen/page.tsx                 # /kids/teen
      topics/[slug]/page.tsx        # /kids/topics/<slug>
      parent/
        layout.tsx                  # auth guard
        page.tsx                    # dashboard
        signup/page.tsx
        login/page.tsx
        consent/page.tsx
        child/[id]/page.tsx

  components/
    interactive/
      kids/                         # 9 NEW primitives (section 6)
        MascotFrame.tsx
        TapToHear.tsx
        StoryPanel.tsx
        PictureMCQ.tsx
        DragToSort.tsx
        TeachableMachineEmbed.tsx
        ArtifactCapture.tsx
        SpacedCheck.tsx
        MascotCelebration.tsx
        index.ts                    # barrel
      # (existing primitives untouched)

    paths/
      KidsPathPage.tsx              # variant of LearningPathPage with mascot chrome
      # (LearningPathPage, LearningObjectivesModal unchanged)

    kids/                           # page-level kid UI (NOT primitives)
      MascotAvatar.tsx              # Mực illustration (emoji stub in v1, SVG/Lottie in Phase 6)
      MascotBubble.tsx
      KidTopicLayout.tsx            # layout shell for /kids/topics/<slug>
      ParentDashboard.tsx
      ArtifactGallery.tsx
      RetentionScoreCard.tsx
      WeeklyReportPreview.tsx
      KidProfileCard.tsx
      AddKidFlow.tsx

  topics/
    kids/
      nhi/
        # 18 topic files — see Appendix A for full slug list
      teen/
        # 28 topic files + 2 capstone — see Appendix A
      kids-registry.ts              # kidsTopicMap, kidsTopicList, kidsCategories
    registry.ts                     # unchanged (adult topics only)

  lib/
    kids/
      types.ts                      # KidsTopicMeta, KidProfile, Artifact, RetentionCheck, Tier
      progress-kids.ts              # kid progress state (parallel to progress-context)
      retention-scheduler.ts        # spaced-check scheduling logic
      audio.ts                      # TTS helper (Web Speech API wrapper)
      mascot.ts                     # mascot config (moods → emoji/SVG map, dialogue presets)
      parent-auth.ts                # Supabase Auth helpers for parent
      consent.ts                    # consent evidence log write

supabase/
  migrations/
    YYYYMMDDHHMMSS_kid_profiles.sql
    YYYYMMDDHHMMSS_kid_artifacts.sql
    YYYYMMDDHHMMSS_retention_checks.sql
    YYYYMMDDHHMMSS_record_artifact_rpc.sql

docs/
  primitives-kids.md                # reference for the 9 new primitives (mirrors primitives.md pattern)
CONTRIBUTING.md                     # updated with a "Writing kid topics" section
```

### 11.1 Registry isolation

`kidsTopicMap` is fully separate from the existing `topicMap`. Implication:
- Global search in `AppShell` does NOT index kid topics. Kid topics are findable only from within `/kids/*`.
- `TopicLink` auto-detects which registry to look in based on whether the current route is `/kids/*` — if so, it validates against `kidsTopicMap`; otherwise against `topicMap`.
- Progress tracking: kid lesson completion is stored in a new state (keyed by `kid_profile_id`), not the existing anonymous `user_progress`. This prevents kid progress from leaking into adult bookmarks/progress.

---

## 12. Home page change

`src/app/page.tsx` (rendering `HomeContent`) gets two new path cards added to its path grid:

- **Nhí (6–10 tuổi)** — yellow-bordered card, sprout emoji, "Bé làm quen AI · 18 bài · có audio."
- **Teen (11–15 tuổi)** — purple-bordered card, rocket emoji, "Tự làm dự án AI · 30 bài."

The card component is unchanged; only new data entries are added. Grid is 4 adult + 2 kid = 6 cards on desktop. Ordering: the four existing paths first (student, engineer, researcher, office), then the two kid paths last — so the adult primary audience continues seeing familiar cards at the top of the fold.

---

## 13. Mascot &amp; Vietnamese voice guide

### 13.1 Mascot — Mực 🐙 (the octopus)

One character across both tiers for continuity. Octopus rationale:
- 8 arms thematically map to "AI helps humans do many things."
- "Mực" is a Vietnamese pun (ink / squid) — immediately recognizable, warm.
- Not claimed by any major edtech (Duolingo=owl, Khan Academy Kids=Kodi, Monkey=monkey, VUIHOC=none). Ownership opportunity.
- Dual-age: rounder/softer illustrations for Nhí dialogue bubbles; angular/tech for Teen. Same character, different moods.

**v1: stub emoji 🐙 everywhere.** Mascot SVG/Lottie illustrations are commissioned in Phase 6 and swapped in without touching topic files (they reference `<MascotAvatar mood="happy" />` which resolves the current rendering).

### 13.2 Vietnamese voice guide (diacritics-mandatory)

Absolute diacritics are a user-stated non-negotiable. Every new kid topic file must pass a pre-commit check (or a documented manual review in v1) against a list of commonly-missed diacritics.

| | Nhí | Teen |
|---|---|---|
| Max sentence length | 10 words | 20 words |
| Vocabulary tier | SGK lớp 1–3 | SGK lớp 6–8 |
| Tense | Present only | Present + past |
| Second person | "bạn" | "bạn" |
| Mascot self-reference | "mình" | "mình" |
| Audio narration | Required on every text block (via `TapToHear`) | Optional, available |
| English technical term in body text | **Forbidden.** OK in image labels only if no Vietnamese equivalent. | Allowed in parens after first Vietnamese usage, e.g. "mô hình (model)" |

**Forbidden-word replacement glossary for Nhí** (enforced via a soft `CONTRIBUTING.md` checklist in v1, not a strict lint):

| Adult term | Nhí replacement |
|---|---|
| thuật toán | "cách máy làm" / "các bước của máy" |
| mô hình | "bạn máy đã học" / "máy học xong" |
| dữ liệu | "ví dụ" |
| huấn luyện / training | "tập luyện cho máy" |
| bias | "máy bị lệch" |
| hallucination | "máy tưởng tượng nhầm" |
| prompt | "câu yêu cầu" / "điều mình nói với máy" |
| neural network | — (never introduced in Nhí; first appears in Teen chặng 3) |

Teen may use adult terms progressively, always introducing Vietnamese first and English in parens.

---

## 14. Implementation phases (6 phases)

Shipping order. Each phase should be a shippable PR (or PR series) with feature flags if partial rollout is needed.

### Phase 1 — Infrastructure &amp; schema (no content yet)
- New route group `src/app/kids/` (landing, stubs for nhi/teen/topics/parent).
- `kidsTopicMap` registry scaffold in `src/topics/kids/kids-registry.ts`.
- `KidsPathPage` component (variant of `LearningPathPage`).
- `KidsModeProvider` context + `/kids/layout.tsx`.
- 3 Supabase migrations (kid_profiles, kid_artifacts, retention_checks) + RLS policies.
- `TopicLink` updated to dual-registry awareness.
- Home page: 2 new path cards (pointing to `/kids/nhi` and `/kids/teen` — both render empty states for now).

### Phase 2 — Parent auth &amp; dashboard skeleton
- Supabase Auth email+password enabled for the project.
- `/kids/parent/{signup,login,consent,page}` routes with Supabase Auth hooks.
- `ParentDashboard` component rendering empty states (no artifacts yet).
- "Thêm bé đầu tiên" flow (AddKidFlow) writing to `kid_profiles`.
- Service-role RPC `record_artifact` for kid-device writes.

### Phase 3 — 9 new primitives + 2 exemplar lessons
- Build all 9 kid primitives: `MascotFrame`, `TapToHear`, `StoryPanel`, `PictureMCQ`, `DragToSort`, `TeachableMachineEmbed`, `ArtifactCapture`, `SpacedCheck`, `MascotCelebration`.
- Ship 1 exemplar Nhí lesson (recommend: `may-nhin-pixel` — "Máy tính nhìn pixel như thế nào?") and 1 exemplar Teen lesson (recommend: `anh-la-tensor` — "Ảnh là tensor").
- Add `docs/primitives-kids.md` reference.
- Update `CONTRIBUTING.md` with a "Writing kid topics" section and Nhí voice-guide checklist.

### Phase 4 — Scheduler &amp; weekly email
- Vercel Cron: `0 */6 * * *` runs retention-check scheduler (creates any missing `scheduled_for` rows).
- Retention checks surfaced on next kid session via `SpacedCheck` primitive render.
- Vercel Cron: `0 13 * * 0` runs weekly-summary email job.
- Email provider choice finalized here (Resend recommended; Supabase built-in as fallback).
- `WeeklyReportPreview` component shown in dashboard alongside email.

### Phase 5 — Batch content
- Remaining 17 Nhí topics, 27 Teen topics, 2 capstone lessons. Parallelized by chặng.
- Use Phase 3 exemplars as reference implementations.
- Each PR: 1 chặng of topics (3–6 lessons) + any supporting SVG/image assets.

### Phase 6 — Polish &amp; graduation bridge
- Commission and integrate proper Mực mascot art (SVG + Lottie for `MascotCelebration`).
- Replace stub emoji everywhere with `<MascotAvatar mood="…" />` component.
- Teen → student handoff UX: `pathObjectives.nextPath = { slug: "student", label: "Học sinh · Sinh viên" }` already supported by `LearningObjectivesModal`; adds a "Bé đã sẵn sàng!" card on the parent dashboard when Teen capstone is complete.
- Final pass on home-page copy, SEO tags, og-images for kid paths.

**"MVP shippable" is Phases 1 + 2 + 3** — two working lessons end-to-end, parent auth, dashboard skeleton. Phases 4–6 can overlap with content writing.

---

## 15. Non-goals (v1)

Explicitly deferred:

1. **Layered consent stack** (phone OTP, email-delay, re-verify, anomaly nudge, ToS evidence log) — §9 above. v1 ships with email+password + plain-language consent only. User accepted this gap.
2. **Leaderboards, streaks as hero KPIs, prominent time-on-page** — refused by design, §7.2.
3. **Real voice-actor narration** — TTS in v1; voice-actor pipeline is a Phase 6+ upgrade.
4. **Cross-language toggle** — Vietnamese only. English follows the adult app's "original English term in parens" pattern, not a full i18n layer.
5. **Kid-to-kid social features** — no chat, no sharing, no comments, no profile pages.
6. **Parent-to-parent features** — no community, no forums.
7. **Monetization** — free tier only in v1. Momo/ZaloPay integration is a post-v1 consideration.
8. **Mobile apps** — responsive web only. Native iOS/Android is post-v1.
9. **Offline mode** — requires a PWA upgrade, out of scope.
10. **Configurable retention intervals per tier** — 3 days fixed for both tiers in v1; future iteration may tune.
11. **Full mascot personality design** — stub emoji in v1, commissioned art in Phase 6.

---

## 16. Open questions for the implementation plan

These are resolved at the design level but need implementation-level choices during the writing-plans phase:

1. **Email provider for weekly summaries** — Resend vs. Supabase built-in vs. other. Deferred to Phase 4.
2. **Audio TTS voice/provider** — browser Web Speech API (free, voice quality varies by browser) vs. Google Cloud TTS Vietnamese vs. other. Deferred to Phase 3.
3. **Artifact thumbnail storage** — Supabase Storage bucket vs. data-URI in `jsonb` for small payloads. Deferred to Phase 3.
4. **Teachable Machine embed fallback** — if the iframe doesn't expose classification via postMessage, what is the kid's UX? (Current fallback plan: screenshot-and-upload via `ArtifactCapture`.)
5. **PIN security** — bcrypt hash is fine for a 4-digit PIN combined with per-account salt, but rate limiting on PIN entry needs spec'ing at implementation time.

---

## Appendix A — Full topic roster (48 files)

Slugs are English-kebab-case (matching existing convention). Vietnamese titles will be authored during implementation and are indicative here.

### Nhí (18 topics)

**Chặng 1 — 👀 Máy "nhìn" &amp; "nghe" (4 topics)**
- `may-nhin-pixel` — "Máy tính thấy gì khi nhìn ảnh?"
- `day-may-nhan-hinh` — "Dạy máy tính nhận ra hình"
- `may-nghe-am-thanh` — "Máy nghe tiếng nào?"
- `tai-may-vs-tai-nguoi` — "Tai máy khác tai người thế nào?"

**Chặng 2 — 🧩 Máy "nhớ" đồ vật (3 topics)**
- `moi-thu-la-so` — "Mọi thứ đều là số với máy"
- `xep-giong-khac` — "Máy xếp đồ giống và khác nhau"
- `ban-do-con-meo` — "Bản đồ của mèo trong đầu máy"

**Chặng 3 — 🎯 Máy học từ ví dụ (4 topics)**
- `cang-nhieu-cang-gioi` — "Càng nhiều ví dụ, máy càng giỏi"
- `may-co-the-hoc-sai` — "Máy cũng có thể học sai!"
- `day-may-phan-loai` — "Dạy máy phân loại chó và mèo"
- `may-thu-nhieu-lan` — "Máy thử nhiều lần mới giỏi"

**Chặng 4 — 💬 AI nói, vẽ, kể chuyện (4 topics)**
- `chatbot-la-gi` — "Chatbot là gì?"
- `ke-chuyen-cung-ai` — "Kể chuyện cùng AI"
- `ai-ve-tranh` — "AI vẽ tranh như thế nào?"
- `khi-ai-khong-hieu` — "Khi AI không hiểu bạn"

**Chặng 5 — 🛡️ AI tốt, AI xấu (3 topics)**
- `ai-co-the-nham` — "AI có thể nhầm"
- `hoi-ba-me-truoc` — "Hỏi ba mẹ trước khi tin"
- `giu-thong-tin-rieng` — "Giữ thông tin riêng tư"

### Teen (28 topics + 2 capstone)

**Chặng 1 — 👁️ Perception (6 topics)**
- `teen-anh-la-tensor` — "Ảnh là tensor"
- `teen-feature-vs-pixel` — "Feature vs pixel"
- `teen-am-thanh-la-du-lieu` — "Âm thanh, văn bản, video = dữ liệu"
- `teen-train-classifier` — "Train mô hình phân loại đầu tiên"
- `teen-nhan-dien-vs-hieu` — "Nhận diện vs hiểu — khác nhau ở đâu?"
- `teen-perception-fail` — "Khi perception sai"

**Chặng 2 — 🗺️ Representation &amp; Reasoning (5 topics)**
- `teen-embedding-la-gi` — "Embedding là gì?"
- `teen-similarity-distance` — "Similarity &amp; distance"
- `teen-knowledge-graph` — "Knowledge graph cho teen"
- `teen-cay-va-ban-do` — "Cây và bản đồ AI dùng"
- `teen-logic-vs-learning` — "Logic vs học từ dữ liệu"

**Chặng 3 — 📈 Learning (6 topics)**
- `teen-training-from-examples` — "Training từ ví dụ — nâng cao"
- `teen-supervised-unsupervised` — "Có giám sát vs không giám sát"
- `teen-overfitting` — "Overfitting — nhớ vẹt vs hiểu"
- `teen-train-test-split` — "Train/test — luyện và kiểm tra"
- `teen-bias-in-data` — "Bias trong dữ liệu"
- `teen-tweak-a-model` — "Hands-on: chỉnh mô hình"

**Chặng 4 — 🎨 AI tạo sinh &amp; giao tiếp (6 topics)**
- `teen-llm-overview` — "LLM là gì?"
- `teen-prompting-basics` — "Prompt cơ bản"
- `teen-when-ai-lies` — "Khi AI nói dối (hallucination)"
- `teen-image-generation` — "AI tạo ảnh"
- `teen-voice-ai` — "AI giọng nói"
- `teen-prompt-a-story` — "Hands-on: viết truyện cùng AI"

**Chặng 5 — ⚖️ Đạo đức &amp; xã hội (5 topics)**
- `teen-bias-training-data` — "Bias trong dữ liệu training"
- `teen-privacy-ai-era` — "Quyền riêng tư thời AI"
- `teen-ai-and-jobs` — "AI và công việc tương lai"
- `teen-deepfake-verify` — "Deepfake và cách xác minh"
- `teen-ai-citizen` — "Làm công dân AI"

**Teen Capstone (2 topics)**
- `teen-nem-python` — "Nếm Python — mã là gì?"
- `teen-final-project` — "Dự án cuối: dạy máy phân biệt X và Y" (leads into the existing `student` path via `pathObjectives.nextPath`)

---

## Appendix B — Integration summary

Additive changes only. Zero modifications to:
- Existing 4 adult path page files
- Existing topic files under `src/topics/` (not inside `kids/`)
- Existing `user_progress` table
- Existing `LearningPathPage`, `LearningObjectivesModal`, `AppShell` public APIs
- Existing route structure for `/`, `/paths/*`, `/topics/*`, `/bookmarks`, `/progress`

Modifications required to existing files:
- `src/app/page.tsx` / `src/components/home/HomeContent.tsx` — 2 new card entries for Nhí and Teen.
- `src/components/interactive/TopicLink.tsx` — dual-registry awareness (see §11.1).
- `CONTRIBUTING.md` — new "Writing kid topics" section.
- `src/topics/registry.ts` — unchanged; the new `kids-registry.ts` lives separately.
- `.gitignore` — `.superpowers/` added during brainstorming (already done).

---

## Appendix C — User-stated principles this spec honors

Captured during the brainstorming session and in project memory:

1. **Visualization-first** in both kid tiers. Minimize text blocks; default to interactive primitives. (Memory: `feedback_kids_visualization_first.md`.)
2. **Topic files are free-form for domain experts.** Identity comes from the color tokens and navbar, not from rigid topic-body layouts. Breaking internal design language inside a `.tsx` topic file is allowed and encouraged when it improves explanation quality. (Memory: `feedback_topic_files_are_free_form.md`.)
3. **Diacritics are non-negotiable.** Every Vietnamese sentence in every kid topic must have correct tone marks.
4. **Chrome stays shared.** Even though kid world has mascot, audio, and bigger buttons, the global navbar and color tokens stay exactly as they are in the adult app. This is how the user recognizes kid content as "still our app."
5. **Parent-dashboard credibility is the product moat.** Artifacts + retention — not percentages. Honest-by-design numbers beat elaborate-but-gameable metrics.
6. **Consent stack deferred knowingly.** v1 ships without phone OTP / email delay / anomaly nudge; this is a documented compliance gap to be revisited post-launch.
