# Plan: Fully Automated udemi Publishing Pipeline

## Context

You currently hand-research → hand-author articles/topics → manually build a Remotion video (composition + banner, no voiceover) → manually post to socials. The goal is a Level-4/5 agentic pipeline (per `level45-agentic-architect`) that runs `topic idea → researched article → bilingual narrated video with AI imagery/clips → multi-platform posts`, with deterministic gates at every stage.

User-confirmed constraints:
- **Bilingual** — Vietnamese (primary) + English (secondary). Two TTS tracks, two renders per topic.
- **No talking-head avatar.** Voiceover + AI b-roll only. (No HeyGen/D-ID.)
- **Platforms:** Threads, Instagram, Facebook (one Meta Graph integration), LinkedIn, YouTube Shorts.
- **Budget:** ~$80–120/mo. Estimated load: ElevenLabs $22 + OpenAI ~$40–70 ≈ **$60–90/mo**.

This sandbox's repo path is `/home/user/vietnamese-ai-for-beginner` (the local equivalent is `/Users/thanhnha231206/idea/ai-edu-v2`). Stack already in place: Next.js 16.2.3 + React 19, Remotion 4.0.448 (`@remotion/cli`, `@remotion/transitions`, `@remotion/google-fonts`), Supabase (Storage + DB), Tailwind 4, Vitest + Testing Library. Existing skills to reuse: `deep-research`, `writing-vietnamese-technical`, `level45-agentic-architect`, `frontend-design`.

## Pipeline shape

```mermaid
flowchart LR
  T[Topic slug] --> R[udemi-research<br/>deep-research skill]
  R -->|manifest.research| A[udemi-article<br/>writing-vietnamese-technical]
  A -->|src/articles/&lt;slug&gt;.tsx + .en.tsx<br/>manifest.article| S[udemi-script]
  S -->|manifest.scenes[]| X{Fan-out assets}
  X --> TTS[tts.ts × 2<br/>ElevenLabs MM v2]
  X --> IMG[images.ts<br/>gpt-image-1]
  X --> CLIP[sora.ts<br/>Sora 2]
  TTS --> CAP[captions.ts<br/>Whisper forced-align]
  IMG --> V[verify-assets.sh<br/>gate]
  CLIP --> V
  CAP --> V
  V --> RM[udemi-remotion<br/>LessonAutoWide + Shorts]
  RM --> REN[render.ts × 4<br/>@remotion/renderer]
  REN --> P[udemi-social]
  P --> M[Meta: Threads + IG + FB]
  P --> Y[YouTube Shorts]
  P --> L[LinkedIn ugcPosts]
  P --> G[git push + vercel deploy<br/>per AGENTS.md]
```

A single typed `TopicManifest` is the spine. Every stage reads it, fills its slice, writes back. Hooks block progression on validation failure.

## File layout (concrete paths in this repo)

```
~/.claude/skills/udemi-publish-pipeline/         # user-global skill
  SKILL.md
  agents/
    udemi-research.md
    udemi-article.md
    udemi-script.md
    udemi-assets.md
    udemi-remotion.md
    udemi-social.md
  hooks/
    pre-commit-contracts.sh
    verify-assets.sh
    color-contrast-audit.sh
  checklists/per-topic-readiness.md

/home/user/vietnamese-ai-for-beginner/
  scripts/pipeline/                              # NEW
    manifest.ts                                  # TopicManifest, Scene, AssetSet types + Zod schema
    orchestrate.ts                               # pnpm pipeline:all entry
    research.ts
    article.ts                                   # wraps writing-vietnamese-technical headless
    script.ts                                    # article → ScenePlan (structured-output)
    tts.ts                                       # ElevenLabs Multilingual v2
    images.ts                                    # OpenAI gpt-image-1
    sora.ts                                      # OpenAI Sora 2
    captions.ts                                  # Whisper forced-align
    render.ts                                    # @remotion/renderer headless
    publish/
      meta.ts                                    # Threads + IG Reels + FB Reels
      youtube.ts                                 # YouTube Data API v3 resumable upload
      linkedin.ts                                # ugcPosts
    util/
      manifest-store.ts                          # read/write content/manifests/<slug>.json
      supabase-assets.ts                         # upload/signed URLs for the assets bucket
      retry.ts                                   # exp-backoff for flaky external calls
  remotion/
    LessonAutoWide.tsx                           # NEW — 1920x1080 parameterized by manifest
    LessonAutoShorts.tsx                         # NEW — 1080x1920 vertical
    auto/
      AssetScene.tsx                             # image | clip | remotion-graphic per Scene
      CaptionTrack.tsx                           # word-level highlight from Whisper alignment
      BrandBanner.tsx                            # reuses existing LandingChrome pattern
    Root.tsx                                     # MODIFY — register LessonAutoWide + Shorts
  content/manifests/<slug>.json                  # NEW — one per topic; the spine
  src/__tests__/
    manifest.test.ts                             # Zod schema + scene duration invariants
    pipeline-render-smoke.test.ts                # one-frame still render fixture
  package.json                                   # MODIFY — pipeline:* scripts
  .env.local.example                             # MODIFY — append the 7 new vars
  CLAUDE.md                                      # MODIFY — append "Automated pipeline" section
```

## Data contract

```ts
// scripts/pipeline/manifest.ts
export type TopicManifest = {
  slug: string;                   // kebab-case, mirrors src/articles/<slug>.tsx
  title: { vn: string; en: string };
  summary: { vn: string; en: string };
  research: { sources: { url: string; quote: string; fetchedAt: string }[]; keyPoints: string[] };
  scenes: Scene[];
  captions: { vn: WhisperAlignment; en: WhisperAlignment };
  assets: { audio: { vn: string; en: string }; scenes: SceneAssets[] };  // supabase or local paths
  renders: { wide: { vn: string; en: string }; shorts: { vn: string; en: string } };
  social: { threads: Post; instagram: Post; facebook: Post; linkedin: Post; youtube: Post };
  state: { stage: PipelineStage; updatedAt: string; published: boolean };
};
export type Scene = {
  id: number;
  durationFrames: number;        // @ FPS=30 from remotion/tokens.ts
  narration: { vn: string; en: string };
  visual: { kind: 'image' | 'clip' | 'remotion-graphic'; prompt?: string; componentName?: string };
};
```

A single Zod schema validates the manifest at every stage boundary. `manifest.test.ts` asserts: total scene duration === audio duration ± 1 frame, no scene without visual+narration, no Vietnamese narration with the banned em-dash (per the writing-vietnamese-technical contract).

## Phased implementation order (one PR each — sized so you can land them independently)

Each PR should run green tests + commit on `claude/continue-plan-ykXzQ`, then push.

### PR 1 — Scaffolding + manifest contract
- Create `scripts/pipeline/manifest.ts` (types + Zod schema), `scripts/pipeline/util/manifest-store.ts`, `content/manifests/.gitkeep`.
- Add `src/__tests__/manifest.test.ts` (round-trip Zod parse, duration math, em-dash rejection).
- Add `pnpm pipeline:manifest:validate` script.
- Append env keys to `.env.local.example` (`OPENAI_API_KEY`, `ELEVENLABS_API_KEY`, `META_ACCESS_TOKEN`, `META_THREADS_USER_ID`, `META_IG_BUSINESS_ID`, `META_FB_PAGE_ID`, `LINKEDIN_ACCESS_TOKEN`, `YOUTUBE_OAUTH_REFRESH_TOKEN`).
- Append "Automated pipeline" section to `CLAUDE.md`.
- **Verify:** `pnpm test` green; `pnpm pipeline:manifest:validate content/manifests/_example.json` round-trips.

### PR 2 — Research + article subagents
- Create `~/.claude/skills/udemi-publish-pipeline/SKILL.md` + `agents/udemi-research.md` + `agents/udemi-article.md`. (Use templates from `level45-agentic-architect.zip → templates/skill/, templates/subagent/`.)
- Create `scripts/pipeline/research.ts` — invokes deep-research, writes `manifest.research`.
- Create `scripts/pipeline/article.ts` — invokes writing-vietnamese-technical, writes `src/articles/<slug>.tsx` + `<slug>.en.tsx`, registers in `src/articles/registry.ts`.
- **Verify:** `pnpm pipeline:research <slug>` produces a manifest with ≥3 sources; `pnpm pipeline:article <slug>` produces TSX files that pass `pnpm test`.

### PR 3 — Script + TTS + captions
- `scripts/pipeline/script.ts` — article → `manifest.scenes[]` via structured-output prompt; default 6–10 scenes; each scene gets narration (vn+en) + a visual directive.
- `scripts/pipeline/tts.ts` — ElevenLabs Multilingual v2 SDK; voice IDs from env; writes `public/generated/<slug>/audio/{vn,en}.mp3`. Use the `elevenlabs` Node SDK directly (no new wrapper).
- `scripts/pipeline/captions.ts` — Whisper `whisper-1` forced-align on each MP3; writes `public/generated/<slug>/captions/{vn,en}.json`.
- `scripts/pipeline/util/retry.ts` — exp-backoff (2/4/8/16s, max 4) reused by tts/images/sora/render/publish.
- Hook `~/.claude/skills/udemi-publish-pipeline/hooks/verify-assets.sh` — fails if any scene is missing audio or visual.
- **Verify:** `pnpm pipeline:tts <slug>` produces playable MP3s; `pnpm pipeline:captions <slug>` produces aligned JSON; total alignment duration ≈ scene-sum duration.

### PR 4 — Image + Sora assets
- `scripts/pipeline/images.ts` — OpenAI `gpt-image-1`, one image per `visual.kind === 'image'` scene → `public/generated/<slug>/img/scene-N.png`.
- `scripts/pipeline/sora.ts` — OpenAI Sora 2, one clip per `visual.kind === 'clip'` scene → `public/generated/<slug>/clip/scene-N.mp4`. Wrap behind a `--mock` flag for cost-control during dev.
- `scripts/pipeline/util/supabase-assets.ts` — optional upload to the existing Supabase Storage bucket; emits signed URLs into the manifest.
- **Verify:** `pnpm pipeline:assets <slug>` produces an asset for every scene; `verify-assets.sh` exits 0.

### PR 5 — Remotion auto compositions + render
- Create `remotion/LessonAutoWide.tsx` (1920×1080) and `remotion/LessonAutoShorts.tsx` (1080×1920). Both are parameterized by manifest slug — load `content/manifests/<slug>.json` at composition init, build a `TransitionSeries` from `scenes[]` (pattern from `remotion/DemoComposition.tsx:46-60`).
- Create `remotion/auto/AssetScene.tsx`, `CaptionTrack.tsx`, `BrandBanner.tsx`. CaptionTrack renders word-level highlights from the Whisper alignment.
- Modify `remotion/Root.tsx` — register the two new compositions. Use `Composition`'s `defaultProps`/`calculateMetadata` to read the manifest at runtime per the v4 API (verify via Context7 against `remotion@4.0.448` before writing).
- `scripts/pipeline/render.ts` — `@remotion/renderer` headless; produces `out/<slug>/{wide,shorts}-{vn,en}.mp4` (4 files).
- `src/__tests__/pipeline-render-smoke.test.ts` — renders one still frame from a fixture manifest; asserts output exists + non-zero bytes.
- **Verify:** `pnpm pipeline:render <slug>` produces 4 MP4s; open each and confirm caption sync.

### PR 6 — Social publishers (one platform first)
- Implement Threads only first via `scripts/pipeline/publish/meta.ts` (media container → publish). Add `--dry-run` (prints payload) and `--publish` (live). Reuse `util/retry.ts`.
- Add YouTube + LinkedIn + IG + FB once Threads is proven (separate commits, same PR or follow-up).
- Generate platform-specific captions per the user's existing voice (cap length, append hashtag set, CTA).
- **Verify:** `pnpm pipeline:publish <slug> --platform=threads --dry-run` prints expected payload; live run posts to Threads and the URL returns 200.

### PR 7 — Skill orchestrator + Routine
- `scripts/pipeline/orchestrate.ts` — full chain, gated by `--stop-at=<stage>` for L2/L3 promotion. Implements the `state.stage` machine on the manifest.
- Wire the slash command `/udemi-publish-pipeline <slug>` in `SKILL.md`.
- Add `hooks/pre-commit-contracts.sh` (runs `pnpm test` + contrast audit on the assets bucket diff).
- (Optional) Remote Routine config for weekly cadence — defer until L5.
- **Verify:** `pnpm pipeline:all <slug> --dry-run` walks every stage on a regression slug (`tts-how-it-works`) and a new slug (`sparse-moe`) without manual intervention.

## Critical existing files to read before writing

- `remotion/Root.tsx` and `remotion/DemoComposition.tsx:46-60` — `TransitionSeries` pattern to copy for `LessonAutoWide`.
- `remotion/tokens.ts` — `FPS`, `WIDTH`, `HEIGHT` constants (don't redefine).
- `remotion/scenes/HeroScene.tsx`, `remotion/components/LandingChrome.tsx` — banner + chrome pattern for `BrandBanner.tsx`.
- `src/articles/registry.ts` and `src/articles/<existing>.tsx` — pattern `udemi-article` must follow when emitting new article files (every new entry must round-trip the contracts test).
- `src/__tests__/contracts.test.ts:1-50` — extend with manifest invariants the same way.
- `docs/CONTRACTS.md` — registry metadata parity rule applies to any article the pipeline generates.
- `AGENTS.md` — ship rule (`git push` + `vercel deploy --prod --yes` + curl-verify) must be embedded in `orchestrate.ts` final step.
- `scripts/sync-registry.mjs` — reuse its registry-mutation pattern when `udemi-article` writes to `articles/registry.ts`.
- `.env.local.example` and `supabase/config.toml` — existing Supabase setup; storage bucket likely needs a new `pipeline-assets` bucket (RLS off for service role).

## Context7 docs to verify at implementation time (mandatory per CLAUDE.md global rule)

- `remotion@4.0.448` — `Composition.calculateMetadata`, `Audio`, `Video`, `Img`, `Sequence`, `TransitionSeries`.
- `@remotion/renderer@4.0.448` — `renderMedia({ codec, composition, inputProps })`.
- `openai` Node SDK — `images.generate({ model: 'gpt-image-1' })`, Sora 2 video endpoint, `audio.transcriptions.create({ model: 'whisper-1', response_format: 'verbose_json', timestamp_granularities: ['word'] })`.
- `elevenlabs` Node SDK — `textToSpeech.convert({ modelId: 'eleven_multilingual_v2', voiceId, text })`.
- Meta Graph API — Threads media container flow, IG `/media` + `/media_publish`, FB Pages `/videos`.
- LinkedIn Posts API — `ugcPosts`, video asset registration.
- `googleapis` — YouTube Data v3 `videos.insert` resumable upload.
- `@supabase/storage-js` — signed upload URLs.

## Rollout ladder (per level45 "trust rollout")

| L | Behavior | Gate to next level |
|---|----------|--------------------|
| L1 | Run each `pnpm pipeline:*` by hand; no Claude in loop | Each script returns 0 on regression slug |
| L2 | `/udemi-publish-pipeline <slug>` runs one subagent at a time with checkpoints | 3 consecutive clean stage-by-stage runs |
| L3 | Autonomous end-to-end, dry-run publish | 3 consecutive clean E2E with dry-run |
| L4 | Autonomous publish to Threads only | 3 weeks zero post-publish corrections |
| L5 | Routine on weekly cron posts all 5 platforms | — |

## Verification — end-to-end smoke

1. **Regression slug** = an existing topic with a hand-built composition (closest in this repo: pick one of the 19 articles in `src/articles/` plus `remotion/DemoComposition.tsx` as the baseline lookalike). Re-run the pipeline and diff the output against the hand build.
2. **New slug** = `sparse-moe` (no existing composition).
3. `pnpm pipeline:all sparse-moe --dry-run` must pass every checkpoint:
   - manifest written ✓ (Zod parse green)
   - article TSX generated ✓ (`pnpm test` green, contracts pass)
   - scene plan ≥ 6 scenes ✓
   - TTS vn+en MP3s exist and play ✓
   - all scene visuals present ✓ (`verify-assets.sh` exits 0)
   - Whisper alignment JSON for both languages ✓
   - 4 MP4 renders produced ✓ (open each, caption sync within ±1 frame)
   - social payloads printed for all 5 platforms ✓ (manual inspect)
4. Switch to `--publish` for Threads only first; confirm OAuth + media container; check the live post URL returns 200 and the caption matches.
5. Promote to Routine after two consecutive zero-touch ships.

## What you'll need to provide at implementation time

- ElevenLabs API key + two voice IDs (vn + en).
- OpenAI API key with Sora 2 access enabled.
- Meta developer app long-lived page access token for Threads/IG/FB (one Meta App, three permissions: `threads_basic` + `threads_content_publish`, `instagram_content_publish`, `pages_manage_posts`).
- LinkedIn developer app + 3-legged OAuth refresh token (scopes: `w_member_social`).
- Google Cloud project with YouTube Data API enabled + OAuth refresh token (`youtube.upload` scope).
- Posting cadence preference (daily / 3× week / weekly) before wiring the Routine in PR 7.

## Stop conditions

- **LOC ceiling** for the full pipeline scaffolding (PRs 1–5): ~3500. If we cross 4500, stop and re-scope.
- **Render cost** per topic: target ≤ $1.50 (TTS + images + ≤30s of Sora). If a single dry run exceeds $3, gate Sora behind `--clip-budget=<seconds>`.
- **Asset audit iteration**: 3 rounds per stage. If a stage fails 3× on the same slug, escalate; do not auto-retry indefinitely.

## Non-goals

- No talking-head avatar generation.
- No real-time live streaming.
- No mobile native apps for review.
- No multi-tenant — single creator account.
