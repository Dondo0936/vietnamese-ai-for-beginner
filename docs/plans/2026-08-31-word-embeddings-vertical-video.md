# Spec: short vertical video — `word-embeddings` (Udemi channel)

> **STATUS: READY TO BUILD.** Narration is final and validated
> (`docs/narration/word-embeddings.vi.txt`). Every number and word pair below
> is quoted from the already-shipped page `src/topics/word-embeddings.tsx` —
> nothing here is invented. The Remotion comp and the VO render are local-only
> steps (see §9); this spec is the tracked artifact they consume.

## Goal

One short vertical video (1080×1920, 30 fps, ~66 s) for the **Udemi channel**,
teaching **word embeddings** — the science curriculum, not the applied
Claude Code track. CTA destination: `udemi.tech/topics/word-embeddings`.

This is the first Udemi science short built on the format learnings from the
DatDo niche track (ep 1 Apps Script, ep 2 Excel, ep 3 Word).

## Context / why

### What the DatDo track taught us, and how each learning lands here

The three niche episodes are the only recent content with a deliberate,
repeated format. Five things in them are transferable to a science short, and
each one changes a specific decision below.

| # | Learning from the DatDo episodes | Evidence in this repo | How this video applies it |
|---|---|---|---|
| 1 | **Open on the failure, not the concept.** Ep 3 leads with the first run vấp hai lỗi ẩn, then diagnoses and fixes. The broken state is the hook. | `src/topics/claude-code-word.tsx` metadata `description` | Scene 1 is a search that returns nothing — "ô tô" vs "xe hơi". The word "embedding" is not spoken until 0:11. |
| 2 | **Nothing invented; page and video quote the same material.** Every spec repeats it: "the companion video reuses the same transcripts, so page and video must agree". | `docs/plans/2026-07-16-ai-for-market-research-page.md` §Context, `2026-07-17-claude-code-apps-script-page.md` header | §5 traces every on-screen number and word pair to a line in `src/topics/word-embeddings.tsx`. No new cosine values were computed for the video. |
| 3 | **One concrete named scenario, carried end to end.** Don Coffee runs through the whole Apps Script episode instead of a generic example per beat. | `docs/plans/2026-07-17-claude-code-apps-script-page.md` §Scenario | The Vietnamese food/city map is the single spine: phở and Hà Nội appear in the hook, the cosine table, and the vector arithmetic. No second example is introduced. |
| 4 | **Show the mechanism on screen, literally.** Ep 1–3 show real terminal output and the Claude Code permission gate rather than describing them. | `public/clasp-demo/`, `public/excel-demo/` | Scene 7 draws the actual vector subtraction as a parallelogram on the map — the arithmetic is animated, not asserted. |
| 5 | **Close on a check the viewer can run (nghiệm thu).** Every episode ends by verifying the result in the real app. | `claude-code-word.tsx` GIAO_VIEC part 4, `claude-code-excel` acceptance beat | Scene 9 hands over the vui/buồn = 0.42 trap: a counter-example the viewer can test on the live page. It is also the comment bait. |

### Why `word-embeddings`

- Shipped page already exists (`src/topics/word-embeddings.tsx`, 811 lines,
  `TOTAL_STEPS = 10`) — the CTA lands somewhere real.
- No Remotion comp exists for it yet. The science topics that already have one
  are tokenization, response-streaming, perceptron, large-tabular-models,
  prompt-engineering, llm-math, turboquant, data-preprocessing (uber-eta), tts,
  how-ai-reads-pdf and hallucination.
- Its data is already Vietnamese-native and visual: the `WORDS` array is a
  labelled 2-D map of phở / bún chả / xe máy / Grab / Hà Nội / Sài Gòn, and
  `ANALOGIES[1]` is `Hà Nội − phở + cơm tấm = Sài Gòn`. That analogy is the
  single most postable beat in the whole science curriculum and it does not
  exist in any English-language explainer.

## Format

| Field | Value |
|---|---|
| Composition id | `LessonWordEmbeddingsVertical` |
| Dimensions | 1080 × 1920 |
| FPS | 30 (`FPS` in `remotion/tokens.ts`) |
| Duration | `captions.durationInFrames` from the VO build (~1994 frames @ 66.0 s + tail pad) |
| Voice | Viettel `hcm-minhquan`, speed 1.0 (same as every prior lesson VO) |
| Narration source | `docs/narration/word-embeddings.vi.txt` |
| Captions | `remotion/captions/word-embeddings.json` (generated, gitignored) |

**Safe areas.** Keep every load-bearing visual inside y ∈ [260, 1400]. The
caption band sits at y ∈ [1400, 1620]. Reserve the bottom 300 px for the
platform's own chrome (TikTok description, Shorts title bar) and the top 260 px
for the account handle overlay.

## The narration

Final, validated. Source of truth is `docs/narration/word-embeddings.vi.txt` —
do not retype it from here, feed the file to the build script.

The splitter in `scripts/build-lesson-vo.mjs` breaks on `.?!` first, then on
commas, with `MAXLEN = 56`. The narration was written against that splitter and
verified: **35 caption lines, longest 53 chars, 278 syllables**. No line wraps
past two rendered lines at the specified caption type size.

### TTS pronunciation notes

- **"word embedding"** appears three times. If Viettel's reader mangles it,
  re-run with `word em-bét-đinh` substituted in a copy of the narration file —
  keep the on-screen caption text as `word embedding` either way.
- **"cosine"** — fallback spelling `cô-sin` if the reader spells it out.
- Decimals are written out as words on purpose (`không phẩy tám sáu`) so the
  reader says them naturally. The **numerals** appear on screen; the narration
  says them in words. Do not "fix" this into `0.86` in the narration file.

## Storyboard

Timings assume a 66.0 s render. Anchor each scene to its **caption line index**
(the `lines[i]` array in the generated JSON), not to a hardcoded frame — the
real audio length will shift everything by a second or two.

Palette is `remotion/tokens.ts`. Cluster colours are lifted verbatim from the
`WORDS` array in the page so map and page match.

| # | Lines | ~Time | Visual |
|---|---|---|---|
| **S1 Hook — the failure** | 0–3 | 0.0–7.7 | A search field on `paper`. `"ô tô"` types in. The result panel snaps to an empty state. Behind it, the target article greys out with **"xe hơi"** ringed in `danger` (#F25C54). Two strings sit side by side with a `≠` between them. No branding, no logo. |
| **S2 Turn** | 4–5 | 7.7–11.8 | `so chữ` strikes through; `toạ độ` slides up in `turquoise600`. The two strings collapse into two dots. |
| **S3 Definition** | 6–8 | 11.8–18.5 | One word flies into an empty 2-D field and lands as a dot with `(x, y)` ticking on. A chip reads **300 chiều** (the page's Liên tưởng 2 figure). Then a second dot lands nearby and a faint tether links them. |
| **S4 The map** | 9–13 | 18.5–28.1 | The full `WORDS` map builds cluster by cluster: **Ẩm thực** `#ef4444` (phở, bún chả, bánh mì, cơm tấm) → **Phương tiện** `#f59e0b` (xe máy, Grab, ô tô) → **Thành phố** `#22c55e` (Hà Nội, Sài Gòn, Đà Nẵng) → **Hoàng gia / Con người** `#3b82f6` / `#ec4899`. On "Không ai dán nhãn cả", the cluster caption chips fade *out* and only the dots remain. |
| **S5 Cosine** | 14–17 | 28.1–35.7 | Three pair rows, one per line. Each draws a connector between the two dots on the map above, then stamps the numeral: **0.86**, **0.79**, **0.11**. A thin bar meter under each numeral, width = value. |
| **S6 Payoff** | 18–19 | 35.7–39.1 | A generic marketplace search chip: `quần jean` typed, `quần bò` surfaces underneath as a suggestion. **Use a neutral mock — no Shopee mark, name or colourway.** The page names Shopee in prose; the video must not carry the trade dress. |
| **S7 The arithmetic** | 20–22 | 39.1–45.0 | The money shot. On the map: highlight **Hà Nội**. Draw the vector to **phở** and negate it (dashed, `ash`). Draw the vector to **cơm tấm** and add it (solid, `graphite`). Complete the parallelogram. The resulting point lands on **Sài Gòn** and pulses in `turquoise500`. Hold the completed figure for at least 20 frames before the cut. |
| **S8 Generalise** | 23–26 | 45.0–52.7 | Two parallel arrows drawn at the same angle and length: `đàn ông → phụ nữ` and `vua → hoàng hậu`. Caption chip: `cùng một hướng = cùng một quan hệ`. |
| **S9 The trap (nghiệm thu)** | 27–32 | 52.7–62.8 | `vui` and `buồn` as two close dots, badge **0.42** in `warning` (#F5B547). `nghĩa giống nhau` strikes through in `danger`; `ngữ cảnh giống nhau` stays in `ink`. This is the beat that earns the comments — hold it. |
| **S10 CTA** | 33–34 | 62.8–66.0 | Udemi wordmark, `udemi.tech/topics/word-embeddings`, and a small live-looking crop of the interactive map from the page. |

### Contrast rules for this comp

`AGENTS.md`'s audit applies — the cluster hues are saturated brand-ish colours
sitting on `paper` (#FBFAF7), which is exactly the washout risk it describes.

- **Dot labels ("phở", "Hà Nội") render in `COLORS.ink` (#1A1A1A), never in the
  cluster hue.** The dot already carries the colour identity. This is the same
  rule as the site's `text-foreground`-on-tinted-card requirement.
- Large numerals (0.86, 0.79, 0.11, 0.42) render in `COLORS.ink`, `font-bold`.
  The hue goes on the small badge word beside them, not the numeral.
- The only text allowed in a cluster hue is a ≤ 2-word chip at ≥ 32 px.
- Every headline spreads `VN_TEXT_RENDER` at the **end** of its style object.
  The map labels are dense with combining marks (phở, cơm tấm, Đà Nẵng) and
  will shiver frame-over-frame without it.
- Use `FONT_VN_DISPLAY` (Be Vietnam Pro) for all Vietnamese display text, not
  `FONT_DISPLAY` — see the comment in `remotion/fonts.ts`.

## Fidelity table — every claim traced to the page

House rule from the episode specs: page and video must agree. Verified against
`src/topics/word-embeddings.tsx` at HEAD.

| On screen / spoken | Source in the page |
|---|---|
| phở, bún chả, bánh mì, cơm tấm clustered | `WORDS[0..3]`, cluster `"Ẩm thực"`, `#ef4444` |
| xe máy, Grab, ô tô clustered | `WORDS[4..6]`, cluster `"Phương tiện"`, `#f59e0b` |
| Hà Nội, Sài Gòn, Đà Nẵng clustered | `WORDS[11..13]`, cluster `"Thành phố"`, `#22c55e` |
| vua / hoàng hậu / đàn ông / phụ nữ arrows | `WORDS[7..10]`, `ANALOGIES[0]` |
| `Hà Nội − phở + cơm tấm = Sài Gòn` | `ANALOGIES[1]` verbatim |
| phở — bún chả = **0.86** | Step 3 cosine table, row 1 |
| Hà Nội — Sài Gòn = **0.79** | Step 3 cosine table, row 2 |
| phở — máy tính = **0.11** | Step 3 cosine table, row 4 |
| vui — buồn = **0.42**, trái nghĩa nhưng cosine vừa | Step 3 cosine table row 5 + `Callout variant="warning"` "Cạm bẫy: gần không có nghĩa là đồng nghĩa" |
| "đo ngữ cảnh giống nhau, không đo nghĩa giống nhau" | Same callout: *similarity of context*, not *semantic equivalence* |
| 300 chiều | Step 1, Liên tưởng 2 |
| "hàng tỷ từ tiếng Việt" | Quiz Q6 explanation: pre-trained models "được train trên hàng tỷ token" |
| quần jean → quần bò | Step 1, Liên tưởng 4 |

**Two deliberate deviations, both flagged:**

1. **"ô tô" vs "xe hơi" (S1)** is a framing device for the hook, not a claimed
   model output. `"xe hơi"` is not in the page's `WORDS` array and the video
   must not print a cosine value for that pair. It only ever shows `≠` between
   two literal strings — which is the true statement being made.
2. **Shopee is not named or shown** (S6) even though the page names it in
   prose. Prose mention is fine; putting a real marketplace's trade dress in a
   video is a different risk. The narration says `sàn bán hàng`.

## Packaging

**Title (pick one, A recommended):**
- A — `Hà Nội − phở + cơm tấm = ?` ← the analogy alone, no explanation. Highest
  curiosity gap, and the answer is the video.
- B — `Máy tính hiểu "phở" gần "bún chả" bằng cách nào?`
- C — `Vì sao gõ "ô tô" mà không ra "xe hơi"?`

**Description:**
```
Máy tính không so nghĩa — nó so toạ độ. Word embedding biến mỗi từ thành một điểm trong không gian 300 chiều, và khoảng cách giữa các điểm chính là độ giống nghĩa.

Bài đầy đủ, có bản đồ từ ngữ kéo thả được:
https://udemi.tech/topics/word-embeddings
```

**Hashtags:** `#udemi #AI #machinelearning #NLP #hocAI #wordembedding #tiengViet`

**Pinned comment (post immediately, it is the S9 handoff):**
```
"vui" và "buồn" trái nghĩa nhưng cosine tới 0.42 — vì chúng luôn nằm trong cùng loại câu. Bạn nghĩ ra cặp từ nào nữa bị embedding xếp gần nhau dù nghĩa ngược hẳn không?
```

**Cover / first frame.** Not `ThumbnailDualLogo` — that comp is the DatDo
tool-episode system (AI logo × tool logo). A science short covers with a still
of the S7 parallelogram at the moment it lands on Sài Gòn, plus the equation
set in `FONT_VN_DISPLAY`. Register it as a separate `Still` at 1080×1920 so it
can be re-rendered without the video.

## Build steps

Steps 1–2 are local-only: `remotion/Lesson*.tsx`, `remotion/captions/`,
`public/lesson-*.mp3` and `public/lesson-*.mp4` are all gitignored by design
(see `.gitignore`, "Remotion lesson videos ... kept local only"). This spec and
the narration file are the parts that travel.

1. **Voiceover + captions** (needs `.viettel-token`):
   ```
   node scripts/build-lesson-vo.mjs \
     --slug word-embeddings \
     --narration docs/narration/word-embeddings.vi.txt
   ```
   Expect `~35 caption lines`. Writes `public/lesson-word-embeddings-vo.mp3`
   and `remotion/captions/word-embeddings.json`. Read the printed timings and
   re-anchor the storyboard's scene boundaries to the real line indices.

2. **Comp**: create `remotion/LessonWordEmbeddingsVertical.tsx` exporting
   `LessonWordEmbeddingsVerticalComposition` plus
   `LESSON_WORD_EMBEDDINGS_VERTICAL_{DURATION,WIDTH,HEIGHT,FPS}`, and register
   it in `remotion/Root.tsx` alongside `LessonHowAIReadsPDFVertical` (the
   closest existing vertical exemplar — same caption-band and safe-area
   treatment).

3. **Render**:
   ```
   npx remotion render LessonWordEmbeddingsVertical \
     public/lesson-word-embeddings-vertical.mp4
   ```

4. **Check before posting**
   - [ ] Scrub the whole render at 25% width — that is roughly phone size. Every
         map label must still be readable.
   - [ ] Watch S4 and S7 with sound off. The analogy has to land silently;
         most of the audience sees it muted first.
   - [ ] Confirm no caption line wraps to three rendered lines.
   - [ ] Confirm the S1 frame prints no cosine value for `ô tô`/`xe hơi`.
   - [ ] Confirm S6 carries no marketplace logo, wordmark or brand colourway.
   - [ ] Dark-room check: `paper` on a phone at low brightness — the `#f59e0b`
         cluster is the one most likely to bloom.

5. **Ship the page side.** `src/topics/word-embeddings.tsx` needs no change for
   this video — the CTA points at what is already live. Verify the route is up
   before posting:
   ```
   curl -sS -o /dev/null -w "%{http_code}\n" https://udemi.tech/topics/word-embeddings
   ```

## Files this spec touches

- `docs/plans/2026-08-31-word-embeddings-vertical-video.md` (this file)
- `docs/narration/word-embeddings.vi.txt` (narration source, tracked)

Nothing else. No topic file, no registry, no `src/` change — the lesson page is
already shipped and correct.

## Next in this format

If this one performs, the same five learnings port cleanly to three more
science shorts, in this order (all have shipped pages, none have a comp):

1. `attention-mechanism` — hook: a sentence where the pronoun is ambiguous and
   the model has to pick.
2. `overfitting-underfitting` — hook: a model that scores 100% and is useless.
3. `confusion-matrix` — hook: a 99%-accurate test that is wrong about the thing
   you care about.

Each one opens on the failure, quotes its own page's numbers, and closes on a
counter-example the viewer can check.
