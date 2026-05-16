---
name: udemi-publish-pipeline
description: Turn a topic slug into a researched article, bilingual narrated video, and multi-platform posts.
---

# udemi-publish-pipeline

You are the orchestrator for the udemi automated publishing pipeline. Given a kebab-case topic slug (and optionally a one-line topic brief), you drive the pipeline through these stages, writing back to a single `TopicManifest` after each one:

```
research → article → script → tts → captions → images → clips → render → publish
```

The manifest lives at `content/manifests/<slug>.json`. Every stage's input + output is validated by `scripts/pipeline/manifest.ts` (Zod). If validation fails, STOP and report the error — do not patch around it.

## How to dispatch

For each stage, dispatch the matching subagent in `agents/<stage>.md`. The subagent returns a JSON payload that this skill saves to a temp file, then runs the corresponding pipeline script with `--from-file=<tmpfile>`:

```bash
pnpm pipeline:research <slug> --from-file=<research.json>
pnpm pipeline:article  <slug> --from-file=<article.json>
pnpm pipeline:script   <slug> --from-file=<script.json>     # PR 3+
pnpm pipeline:tts      <slug>                                # PR 3+
pnpm pipeline:captions <slug>                                # PR 3+
pnpm pipeline:assets   <slug>                                # PR 4+
pnpm pipeline:render   <slug>                                # PR 5+
pnpm pipeline:publish  <slug> --platform=threads --dry-run   # PR 6+
```

Each script:
- Reads the manifest (or seeds it for the first stage).
- Validates the new slice against the schema.
- Writes the manifest back.
- Advances `state.stage`.

## When the user invokes you

1. **Resolve the slug.** If the user gave a slug, use it. If they gave a topic in natural language, propose a kebab-case slug and confirm before continuing.
2. **Check the manifest.** Read `content/manifests/<slug>.json` if it exists. The current `state.stage` tells you where to resume; do not redo completed stages without explicit confirmation.
3. **Dispatch the next subagent.** Read its file in `agents/<stage>.md` and follow that file's contract exactly.
4. **Ingest its output.** Save the subagent's JSON to a temp file, run the matching `pnpm pipeline:<stage>` command, verify it returns 0.
5. **Stop and report when the user asked you to.** Honor `--stop-at=<stage>` if the user used the orchestrator flag. Otherwise, continue to the next stage.

## Stage gating rules

- **Em-dash sweep.** Any Vietnamese narration or article copy that contains `—` (U+2014) is invalid. If a subagent returns one, ask it to revise before ingesting.
- **Article TSX must round-trip the contracts test.** After `pipeline:article`, run `pnpm test src/__tests__/contracts.test.ts` and `pnpm test src/__tests__/manifest.test.ts`. RED → revise.
- **No invented sources.** Research stage requires real URLs with quotes the subagent actually fetched (`research.sources[].fetchedAt` is ISO time of the fetch).
- **Manifest is the only source of truth.** No stage may stash data outside the manifest (the lone exception is binary assets under `public/generated/<slug>/`).

## What never to do

- Never write directly to `src/articles/registry.ts` from this skill — only the `pipeline:article` script mutates it (via `scripts/pipeline/util/registry-update.ts`), so the test suite's parity invariants stay enforced.
- Never invent a slug for a topic that already has an article (`src/articles/<slug>.tsx` exists). Stop and ask the user.
- Never publish without `--dry-run` first.
- Never push to git without running `pnpm test` + curl-verifying the deploy per `AGENTS.md`.

## Reference

- Plan: `docs/superpowers/plans/2026-05-16-udemi-publish-pipeline.md`
- Schema: `scripts/pipeline/manifest.ts`
- Article shape to emit: `src/articles/large-tabular-models.tsx` (canonical template)
- Article registry pattern: `src/articles/registry.ts`
- Contracts to honor: `docs/CONTRACTS.md`
