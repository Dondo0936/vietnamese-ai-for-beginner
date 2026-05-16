/**
 * TopicManifest — the spine of the automated publishing pipeline.
 *
 * Every stage (research → article → script → assets → render → publish)
 * reads this manifest, fills in its slice, writes it back. A single Zod
 * schema validates the shape at every stage boundary so a broken stage
 * fails fast instead of poisoning a later one.
 *
 * One manifest per topic, stored at `content/manifests/<slug>.json`.
 *
 * @see docs/superpowers/plans/2026-05-16-udemi-publish-pipeline.md
 */

import { z } from "zod";

/** Stage names the orchestrator advances through. */
export const PIPELINE_STAGES = [
  "research",
  "article",
  "script",
  "tts",
  "captions",
  "images",
  "clips",
  "render",
  "publish",
  "done",
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

const FPS = 30;
/** Hard cap on a single scene. 30s at 30fps. Scenes longer than this signal a script bug. */
const MAX_SCENE_FRAMES = 30 * FPS;

const SlugSchema = z
  .string()
  .min(2)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be kebab-case");

const UrlSchema = z.string().url();
const IsoDateSchema = z.string().datetime();

const BilingualStringSchema = z.object({
  vn: z.string().min(1),
  en: z.string().min(1),
});

/**
 * Em-dash sweep — Vietnamese narration in this project does NOT use the
 * em-dash glyph (U+2014). Recent commits a560f63, 9ccd5ef, c574231 swept
 * it out of shipped articles. The pipeline must not regress that.
 */
const NoEmDashVn = z.object({
  vn: z.string().min(1).refine((s) => !s.includes("—"), {
    message: "Vietnamese narration must not contain an em-dash (—); use a period or comma instead",
  }),
  en: z.string().min(1),
});

const SourceSchema = z.object({
  url: UrlSchema,
  quote: z.string().min(1),
  fetchedAt: IsoDateSchema,
});

const ResearchSchema = z.object({
  sources: z.array(SourceSchema).min(1),
  keyPoints: z.array(z.string().min(1)).min(1),
});

const VisualSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("image"),
    prompt: z.string().min(1),
  }),
  z.object({
    kind: z.literal("clip"),
    prompt: z.string().min(1),
  }),
  z.object({
    kind: z.literal("remotion-graphic"),
    componentName: z.string().min(1),
  }),
]);

const SceneSchema = z.object({
  id: z.number().int().nonnegative(),
  durationFrames: z.number().int().positive().max(MAX_SCENE_FRAMES),
  narration: NoEmDashVn,
  visual: VisualSchema,
});

/** Whisper verbose_json with word-level timestamps. Subset of the API shape. */
const WhisperWordSchema = z.object({
  word: z.string(),
  start: z.number().nonnegative(),
  end: z.number().nonnegative(),
});
const WhisperAlignmentSchema = z.object({
  language: z.enum(["vi", "en"]),
  duration: z.number().nonnegative(),
  words: z.array(WhisperWordSchema),
});

const SceneAssetsSchema = z.object({
  id: z.number().int().nonnegative(),
  /** Local or signed-Supabase path to the rendered visual (PNG or MP4). */
  path: z.string().min(1),
});

const AssetsSchema = z.object({
  audio: BilingualStringSchema,
  scenes: z.array(SceneAssetsSchema),
});

const RendersSchema = z.object({
  wide: BilingualStringSchema,
  shorts: BilingualStringSchema,
});

const PostSchema = z.object({
  caption: z.string().min(1),
  /** Tags WITHOUT leading `#`; the publisher prefixes per platform. */
  hashtags: z.array(z.string().min(1)),
  /** Optional permalink after publish. Empty until the platform returns one. */
  permalink: z.string().url().optional(),
});

const SocialSchema = z.object({
  threads: PostSchema,
  instagram: PostSchema,
  facebook: PostSchema,
  linkedin: PostSchema,
  youtube: PostSchema,
});

const StateSchema = z.object({
  stage: z.enum(PIPELINE_STAGES),
  updatedAt: IsoDateSchema,
  published: z.boolean(),
});

/**
 * The full manifest. Stages may write partial manifests using
 * `PartialTopicManifestSchema` while progressing; only `done` requires the
 * full shape.
 */
export const TopicManifestSchema = z.object({
  slug: SlugSchema,
  title: BilingualStringSchema,
  summary: BilingualStringSchema,
  research: ResearchSchema,
  scenes: z.array(SceneSchema).min(1),
  captions: z.object({ vn: WhisperAlignmentSchema, en: WhisperAlignmentSchema }),
  assets: AssetsSchema,
  renders: RendersSchema,
  social: SocialSchema,
  state: StateSchema,
});

/**
 * Loosened schema for the in-progress manifest. Every stage validates the
 * slice it has filled; the orchestrator validates the full shape at
 * stage=done.
 */
export const PartialTopicManifestSchema = TopicManifestSchema.partial({
  research: true,
  scenes: true,
  captions: true,
  assets: true,
  renders: true,
  social: true,
}).extend({
  slug: SlugSchema,
  title: BilingualStringSchema,
  state: StateSchema,
});

export type TopicManifest = z.infer<typeof TopicManifestSchema>;
export type PartialTopicManifest = z.infer<typeof PartialTopicManifestSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type SceneAssets = z.infer<typeof SceneAssetsSchema>;
export type WhisperAlignment = z.infer<typeof WhisperAlignmentSchema>;
export type Post = z.infer<typeof PostSchema>;
export type Source = z.infer<typeof SourceSchema>;

/**
 * Total scene duration in seconds. Used by the captions stage to assert
 * Whisper alignment duration ≈ scene-sum duration within ±1 frame.
 */
export function sceneSumSeconds(scenes: Scene[]): number {
  const frames = scenes.reduce((acc, s) => acc + s.durationFrames, 0);
  return frames / FPS;
}

/**
 * Captions-vs-scenes drift check. Returns `null` when within tolerance,
 * otherwise a human-readable reason. ±1 frame (1/30s ≈ 33ms) tolerance
 * matches Remotion's per-frame granularity.
 */
export function captionsScenesDrift(
  scenes: Scene[],
  caps: { vn: WhisperAlignment; en: WhisperAlignment },
): string | null {
  const target = sceneSumSeconds(scenes);
  const tol = 1 / FPS;
  for (const lang of ["vn", "en"] as const) {
    const d = caps[lang].duration;
    if (Math.abs(d - target) > tol) {
      return `${lang} caption duration ${d.toFixed(3)}s differs from scene sum ${target.toFixed(3)}s by more than ${tol.toFixed(3)}s`;
    }
  }
  return null;
}

export { FPS as MANIFEST_FPS };
