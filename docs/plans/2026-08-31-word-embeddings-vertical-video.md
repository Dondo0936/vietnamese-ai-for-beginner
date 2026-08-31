# Spec: short vertical video — `word-embeddings` (Udemi channel)

> **STATUS: BLOCKED ON CAPTURE.** Narration is final and validated
> (`docs/narration/word-embeddings.vi.txt`). Every number and word pair below
> is quoted from the already-shipped page `src/topics/word-embeddings.tsx` —
> nothing here is invented. Six of the ten scenes are **real captures that do
> not exist yet** (§4). Do not build the comp until `public/embeddings-demo/`
> is populated and the pre-flight in §4.1 is cleared.

## 1. Goal

One short vertical video (1080×1920, 30 fps, ~66 s) for the **Udemi channel**,
teaching **word embeddings** — the science curriculum, not the applied
Claude Code track. CTA destination: `udemi.tech/topics/word-embeddings`.

This is the first Udemi science short built on the format learnings from the
DatDo niche track (ep 1 Apps Script, ep 2 Excel, ep 3 Word).

## 2. Context / why

### 2.1 What the DatDo track taught us, and how each learning lands here

The three niche episodes are the only recent content with a deliberate,
repeated format. Five things in them are transferable to a science short, and
each one changes a specific decision below. The sixth rule in §3 is older and
project-wide, not a DatDo learning — but the DatDo episodes are where it is
followed most rigorously.

| # | Learning from the DatDo episodes | Evidence in this repo | How this video applies it |
|---|---|---|---|
| 1 | **Open on the failure, not the concept.** Ep 3 leads with the first run vấp hai lỗi ẩn, then diagnoses and fixes. The broken state is the hook. | `src/topics/claude-code-word.tsx` metadata `description` | Scene 1 is a search that returns nothing — "ô tô" vs "xe hơi". The word "embedding" is not spoken until 0:11. |
| 2 | **Nothing invented; page and video quote the same material.** Every spec repeats it: "the companion video reuses the same transcripts, so page and video must agree". | `docs/plans/2026-07-16-ai-for-market-research-page.md` §Context, `2026-07-17-claude-code-apps-script-page.md` header | §5 traces every on-screen number and word pair to a line in `src/topics/word-embeddings.tsx`. No new cosine values were computed for the video. See §4.1 for the one unresolved provenance gap this rule exposes. |
| 3 | **One concrete named scenario, carried end to end.** Don Coffee runs through the whole Apps Script episode instead of a generic example per beat. | `docs/plans/2026-07-17-claude-code-apps-script-page.md` §Scenario | The Vietnamese food/city map is the single spine: phở and Hà Nội appear in the hook, the cosine table, and the vector arithmetic. No second example is introduced. |
| 4 | **Show the mechanism on screen, literally.** Ep 1–3 show real terminal output and the Claude Code permission gate rather than describing them. | `public/clasp-demo/` (12 assets), `public/excel-demo/` (8 assets) | Scene 7 shows the actual vector arithmetic happening in the live page's analogy stepper — captured, not re-drawn. |
| 5 | **Close on a check the viewer can run (nghiệm thu).** Every episode ends by verifying the result in the real app. | `claude-code-word.tsx` GIAO_VIEC part 4, `claude-code-excel` acceptance beat | Scene 9 hands over the vui/buồn = 0.42 trap: a counter-example the viewer can test on the live page. It is also the comment bait. |

### 2.2 Why `word-embeddings`

- Shipped page already exists (`src/topics/word-embeddings.tsx`, 811 lines,
  `TOTAL_STEPS = 10`) — the CTA lands somewhere real, and the page's own
  interactive visuals are the raw material for the real captures in §4.
- No Remotion comp exists for it yet. The science topics that already have one
  are tokenization, response-streaming, perceptron, large-tabular-models,
  prompt-engineering, llm-math, turboquant, data-preprocessing (uber-eta), tts,
  how-ai-reads-pdf and hallucination.
- Its data is already Vietnamese-native and visual: the `WORDS` array is a
  labelled 2-D map of phở / bún chả / xe máy / Grab / Hà Nội / Sài Gòn, and
  `ANALOGIES[1]` is `Hà Nội − phở + cơm tấm = Sài Gòn`. That analogy is the
  single most postable beat in the whole science curriculum and it does not
  exist in any English-language explainer.

## 3. The 70/30 real-images rule — hard constraint

`docs/plans/2026-07-07-ai-agent-loops-real-images.md` establishes **the
standing 70/30 real-images-vs-rebuilt rule**: at least ~70% of a piece's
visual surface should be real captured material, at most ~30% rebuilt from
scratch in TSX/Remotion. That doc exists precisely because `ai-agent-loops`
"currently rebuilds every visual in TSX" — rebuilding everything is the named
failure mode, not the default.

The rest of the project follows it: 17 `public/*-demo/` and `public/loops-guide/`
asset directories back the shipped lessons and their videos.

**For this video the rule is measured by screen time, not by scene count.**
Target ≥ 70% of the 66 s runtime carrying a real capture as its primary visual.

| | Scenes | Screen time | Share |
|---|---|---|---|
| **Real capture** | S3, S4, S5, S7, S8a, S9, S10 | 46.6 s | **70.6%** |
| Rebuilt in Remotion | S1, S2, S6, S8b | 19.4 s | 29.4% |

A scene counts as *real* only when a real capture is the primary visual for
that beat. Annotations (arrows, highlights, numerals) may sit beside, beneath,
or as a non-occluding overlay on a real capture — **the captured frame itself
is never re-drawn, re-typeset, or recoloured.** Same discipline as the
ai-agent-loops retrofit, which placed captions beneath unmodified figures.

The four rebuilt scenes are rebuilt for a reason, stated per scene in §6. Do
not "upgrade" S6 to a real capture — see the trade-dress note there.

## 4. Real captures required

None of these exist yet. Capture at **2560×1440** (matching `clasp-demo/` and
`market-demo/`) and store in `public/embeddings-demo/`, with a `SOURCES.md`
alongside modelled on `public/brand/SOURCES.md`.

| Asset | What to capture | Scene |
|---|---|---|
| `01-projector-rotate.mp4` | TensorFlow Embedding Projector (`projector.tensorflow.org`), default word2vec 10K set, slow rotate of the 3-D point cloud. ~8 s. Third-party — must be credited, see below. | S3 |
| `02-word-map-hover.mp4` | Live `udemi.tech/topics/word-embeddings`, Step 2 "Khám phá": the interactive map, hovering phở → bún chả → xe máy so the cluster tooltips fire. ~10 s. | S4 |
| `03-cosine-table.png` | Same page, Step 3: the full cosine similarity table, all five rows legible. | S5, S9 |
| `04-analogy-hanoi.mp4` | Same page, Step 3 analogy stepper driven to `ANALOGIES[1]` — `Hà Nội − phở + cơm tấm = Sài Gòn` — showing the result resolve. ~6 s. | S7 |
| `05-analogy-vua.mp4` | Same stepper on `ANALOGIES[0]` — `vua − đàn ông + phụ nữ = hoàng hậu`. ~4 s. | S8a |
| `06-captrap-callout.png` | Same page, Step 3: the `Callout variant="warning"` titled "Cạm bẫy: gần không có nghĩa là đồng nghĩa", with the vui/buồn 0.42 row visible above it. | S9 |
| `07-page-scroll.mp4` | Same page, top of lesson scrolling down through Step 1–2, for the CTA. ~4 s. | S10 |

**Capture hygiene**
- Light mode, default zoom, no browser chrome, no bookmarks bar, no cursor
  except in `02` and `04` where the interaction *is* the point.
- Capture from production `udemi.tech`, not `localhost` — the URL bar is part
  of the CTA's credibility. If the URL bar is in frame it must read the real
  domain.
- The Embedding Projector is Google's tool. Credit it on screen in S3
  ("TensorFlow Embedding Projector — Google") and record it in
  `public/embeddings-demo/SOURCES.md`. Adding a matching `sources` entry to the
  page's `TopicMeta` is a separate follow-up (§9), not part of this video —
  `word-embeddings` currently has no `sources` field at all.

### 4.1 Pre-flight blocker — verify the cosine numbers first

Learning #2 says nothing is invented. The page presents its table as
**"Bảng ví dụ cosine similarity thực tế (embedding tiếng Việt)"** — *thực tế*,
actual — but `src/topics/word-embeddings.tsx` carries no `sources` field and
nothing in the repo records which model produced 0.86 / 0.79 / 0.72 / 0.11 /
0.42.

Capturing the page gives real provenance for *"this is what our lesson says."*
It is **not** evidence that a Vietnamese embedding model actually returns those
values. Putting them on screen as measured facts without checking would be the
exact thing rule #2 forbids.

Before capturing, run the pair set through a real Vietnamese embedding model
(PhoBERT, or fastText `cc.vi.300`) and compare:

- **Numbers hold** → capture as specced, and add a `sources` entry to the page
  naming the model (follow-up, §9).
- **Numbers differ** → **fix the page first**, then capture. The video must
  never disagree with the live lesson.
- **No time to check** → soften the on-screen framing to "ví dụ minh hoạ"
  rather than measured values, and drop the "thực tế" claim from the page in
  the same pass. Do not ship the numbers as measurements on the strength of
  the page alone.

## 5. Format

| Field | Value |
|---|---|
| Composition id | `LessonWordEmbeddingsVertical` |
| Dimensions | 1080 × 1920 |
| FPS | 30 (`FPS` in `remotion/tokens.ts`) |
| Duration | `captions.durationInFrames` from the VO build (~1994 frames @ 66.0 s + tail pad) |
| Voice | Viettel `hcm-minhquan`, speed 1.0 (same as every prior lesson VO) |
| Narration source | `docs/narration/word-embeddings.vi.txt` |
| Captions | `remotion/captions/word-embeddings.json` (generated, gitignored) |
| Real assets | `public/embeddings-demo/` (see §4) |

**Safe areas.** Keep every load-bearing visual inside y ∈ [260, 1400]. The
caption band sits at y ∈ [1400, 1620]. Reserve the bottom 300 px for the
platform's own chrome (TikTok description, Shorts title bar) and the top 260 px
for the account handle overlay.

**Landscape captures in a vertical frame.** Every asset in §4 is 16:9 going
into a 9:16 comp. Do not letterbox them small and centred. Scale each capture
so its *subject* fills the full 1080 width — crop into the map, the table rows,
the stepper — and let the rest fall outside frame. `03-cosine-table.png` is
read one row at a time (S5) rather than shown whole; only S9 shows enough rows
to make the vui/buồn comparison land.

## 6. The narration

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

## 7. Storyboard

Timings assume a 66.0 s render. Anchor each scene to its **caption line index**
(the `lines[i]` array in the generated JSON), not to a hardcoded frame — the
real audio length will shift everything by a second or two.

Palette is `remotion/tokens.ts`.

| # | Lines | ~Time | Source | Visual |
|---|---|---|---|---|
| **S1 Hook — the failure** | 0–3 | 0.0–7.7 | Rebuilt | A search field on `paper`. `"ô tô"` types in. The result panel snaps to an empty state. Behind it, the target article greys out with **"xe hơi"** ringed in `danger` (#F25C54). Two strings sit side by side with a `≠` between them. *Rebuilt because:* a real search failing on a real site would be either contrived (our own Fuse.js search over topic titles) or another company's trade dress. The honest illustration beats a staged capture. |
| **S2 Turn** | 4–5 | 7.7–11.8 | Rebuilt | `so chữ` strikes through; `toạ độ` slides up in `turquoise600`. The two strings collapse into two dots. *Rebuilt because:* pure typographic transition, no real referent exists. |
| **S3 Definition** | 6–8 | 11.8–18.5 | **Real** — `01-projector-rotate.mp4` | The Embedding Projector's real 3-D point cloud rotating. Overlay a `300 chiều` chip and the credit line "TensorFlow Embedding Projector — Google" bottom-left. Do not recolour or crop out the tool's own UI labels. |
| **S4 The map** | 9–13 | 18.5–28.1 | **Real** — `02-word-map-hover.mp4` | The live page's interactive map, cropped to fill width. Cursor hovers phở, then bún chả, then xe máy; the page's own tooltips do the work. On "Không ai dán nhãn cả", hold on the un-hovered state where only dots show. No re-drawn dots — this is the page's own component. |
| **S5 Cosine** | 14–17 | 28.1–35.7 | **Real** — `03-cosine-table.png` | Crop to one table row at a time as the narration names it: **0.86**, then **0.79**, then **0.11**. A thin bar meter animates in *beneath* each cropped row (overlay, not redraw), width = value. |
| **S6 Payoff** | 18–19 | 35.7–39.1 | Rebuilt | A generic marketplace search chip: `quần jean` typed, `quần bò` surfaces underneath as a suggestion. *Rebuilt because:* the page names Shopee in prose, but putting a real marketplace's trade dress in a video is a different risk class. **Use a neutral mock — no Shopee mark, name, or colourway.** Do not upgrade this to a real capture. |
| **S7 The arithmetic** | 20–22 | 39.1–45.0 | **Real** — `04-analogy-hanoi.mp4` | The money shot, and it is the page's own stepper doing it. Capture shows `Hà Nội − phở + cơm tấm` resolving to **Sài Gòn**. Overlay: a `turquoise500` pulse ring on the resolved point at the moment it lands. Hold the resolved state ≥ 20 frames before the cut. |
| **S8a Generalise (real half)** | 23–24 | 45.0–48.5 | **Real** — `05-analogy-vua.mp4` | The same stepper on `vua − đàn ông + phụ nữ = hoàng hậu`, establishing that the first result was not a one-off. |
| **S8b Generalise (overlay)** | 25–26 | 48.5–52.7 | Rebuilt | Two parallel arrows drawn at the same angle and length over the last held frame: `đàn ông → phụ nữ` and `vua → hoàng hậu`. Chip: `cùng một hướng = cùng một quan hệ`. *Rebuilt because:* the parallel-vector abstraction is a claim about the geometry that the page does not itself draw. |
| **S9 The trap (nghiệm thu)** | 27–32 | 52.7–62.8 | **Real** — `03-cosine-table.png` + `06-captrap-callout.png` | The vui/buồn row at **0.42** held next to the phở/bún chả row at 0.86, then the page's own "Cạm bẫy" callout scrolls up beneath it. Overlay: `nghĩa giống nhau` struck through in `danger`; `ngữ cảnh giống nhau` ringed in `ink`. This is the beat that earns the comments — hold it. |
| **S10 CTA** | 33–34 | 62.8–66.0 | **Real** — `07-page-scroll.mp4` | The live page scrolling, real URL bar in frame. Udemi wordmark and `udemi.tech/topics/word-embeddings` overlay. |

### 7.1 Contrast and type rules

`AGENTS.md`'s audit applies to the overlays. Cluster hues on the captured page
are saturated colours on `paper` (#FBFAF7) — exactly the washout risk it names.

- **Any label the comp adds renders in `COLORS.ink` (#1A1A1A), never in a
  cluster hue.** The captured dot already carries the colour identity. Same
  rule as the site's `text-foreground`-on-tinted-card requirement.
- Overlay numerals render in `COLORS.ink`, bold. The hue goes on a small badge
  word beside the numeral, not the numeral.
- The only text allowed in a cluster hue is a ≤ 2-word chip at ≥ 32 px.
- Every headline spreads `VN_TEXT_RENDER` at the **end** of its style object.
  Overlay labels are dense with combining marks (phở, cơm tấm, Đà Nẵng) and
  will shiver frame-over-frame without it.
- Use `FONT_VN_DISPLAY` (Be Vietnam Pro) for all Vietnamese display text, not
  `FONT_DISPLAY` — see the comment in `remotion/fonts.ts`.
- Overlay text must not sit on top of captured text. Park it in the capture's
  own dead space, or in a band below the crop.

## 8. Fidelity table — every claim traced to the page

House rule from the episode specs: page and video must agree. Verified against
`src/topics/word-embeddings.tsx` at HEAD.

| On screen / spoken | Source in the page |
|---|---|
| phở, bún chả, bánh mì, cơm tấm clustered | `WORDS[0..3]`, cluster `"Ẩm thực"`, `#ef4444` |
| xe máy, Grab, ô tô clustered | `WORDS[4..6]`, cluster `"Phương tiện"`, `#f59e0b` |
| Hà Nội, Sài Gòn, Đà Nẵng clustered | `WORDS[11..13]`, cluster `"Thành phố"`, `#22c55e` |
| vua / hoàng hậu / đàn ông / phụ nữ | `WORDS[7..10]`, `ANALOGIES[0]` |
| `Hà Nội − phở + cơm tấm = Sài Gòn` | `ANALOGIES[1]` verbatim |
| phở — bún chả = **0.86** | Step 3 cosine table, row 1 — *see §4.1* |
| Hà Nội — Sài Gòn = **0.79** | Step 3 cosine table, row 2 — *see §4.1* |
| phở — máy tính = **0.11** | Step 3 cosine table, row 4 — *see §4.1* |
| vui — buồn = **0.42**, trái nghĩa nhưng cosine vừa | Step 3 cosine table row 5 + `Callout variant="warning"` "Cạm bẫy: gần không có nghĩa là đồng nghĩa" — *see §4.1* |
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

## 9. Packaging

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
tool-episode system (AI logo × tool logo). A science short covers with the
real S7 frame at the moment the analogy resolves to Sài Gòn, with the equation
set in `FONT_VN_DISPLAY` beneath it. Register it as a separate `Still` at
1080×1920 so it can be re-rendered without the video.

**Follow-up, not part of this video.** If §4.1 confirms the cosine values, add
a `sources` entry to `word-embeddings` naming the model — in **both**
`src/topics/word-embeddings.tsx` and `src/topics/registry.ts`, identical, per
the parity practice in `docs/plans/2026-07-07-ai-agent-loops-real-images.md`.

## 10. Build steps

Steps 2–3 are local-only: `remotion/Lesson*.tsx`, `remotion/captions/`,
`public/lesson-*.mp3` and `public/lesson-*.mp4` are all gitignored by design
(see `.gitignore`, "Remotion lesson videos ... kept local only"). This spec and
the narration file are the parts that travel. `public/embeddings-demo/` is
**not** gitignored — commit those assets, as `clasp-demo/` and `excel-demo/`
are committed.

1. **Clear §4.1**, then capture the seven assets in §4 into
   `public/embeddings-demo/` and write its `SOURCES.md`.

2. **Voiceover + captions** (needs `.viettel-token`):
   ```
   node scripts/build-lesson-vo.mjs \
     --slug word-embeddings \
     --narration docs/narration/word-embeddings.vi.txt
   ```
   Expect `~35 caption lines`. Writes `public/lesson-word-embeddings-vo.mp3`
   and `remotion/captions/word-embeddings.json`. Read the printed timings and
   re-anchor the storyboard's scene boundaries to the real line indices.

3. **Comp**: create `remotion/LessonWordEmbeddingsVertical.tsx` exporting
   `LessonWordEmbeddingsVerticalComposition` plus
   `LESSON_WORD_EMBEDDINGS_VERTICAL_{DURATION,WIDTH,HEIGHT,FPS}`, and register
   it in `remotion/Root.tsx` alongside `LessonHowAIReadsPDFVertical` (the
   closest existing vertical exemplar — same caption-band and safe-area
   treatment).

4. **Render**:
   ```
   npx remotion render LessonWordEmbeddingsVertical \
     public/lesson-word-embeddings-vertical.mp4
   ```

5. **Check before posting**
   - [ ] **Real-capture share ≥ 70% of runtime.** Add up the scenes whose
         primary visual is a §4 asset. Target 46.6 s of 66.0 s. If a capture
         got cut, the rule is broken — recapture, do not backfill with a
         rebuilt scene.
   - [ ] No captured frame was recoloured, re-typeset, or partially redrawn.
   - [ ] No overlay text sits on top of text inside a capture.
   - [ ] Every capture came from production `udemi.tech`, not `localhost`.
   - [ ] Embedding Projector credited on screen in S3 and in
         `public/embeddings-demo/SOURCES.md`.
   - [ ] Scrub the whole render at 25% width — roughly phone size. Every label
         in every capture must still be readable at that size; the cosine table
         crops are the first thing to fail this.
   - [ ] Watch S4 and S7 with sound off. The analogy has to land silently;
         most of the audience sees it muted first.
   - [ ] No caption line wraps to three rendered lines.
   - [ ] The S1 frame prints no cosine value for `ô tô`/`xe hơi`.
   - [ ] S6 carries no marketplace logo, wordmark, or brand colourway.
   - [ ] Dark-room check: `paper` on a phone at low brightness — the `#f59e0b`
         cluster in the captured map is the one most likely to bloom.

6. **Verify the CTA route is live** before posting:
   ```
   curl -sS -o /dev/null -w "%{http_code}\n" https://udemi.tech/topics/word-embeddings
   ```

## 11. Files this spec touches

Tracked, in this branch:
- `docs/plans/2026-08-31-word-embeddings-vertical-video.md` (this file)
- `docs/narration/word-embeddings.vi.txt` (narration source)

Tracked, to be added during the build:
- `public/embeddings-demo/*` + `public/embeddings-demo/SOURCES.md`

No topic file, no registry, no `src/` change for the video itself — the lesson
page is already shipped. The one possible `src/` change is the `sources`
follow-up in §9, contingent on §4.1.

## 12. Next in this format

If this one performs, the same rules port cleanly to three more science shorts
(all have shipped pages, none have a comp). Each opens on the failure, quotes
its own page's numbers, closes on a checkable counter-example, and clears 70%
real capture off its own live page:

1. `attention-mechanism` — hook: a sentence where the pronoun is ambiguous and
   the model has to pick.
2. `overfitting-underfitting` — hook: a model that scores 100% and is useless.
3. `confusion-matrix` — hook: a 99%-accurate test that is wrong about the thing
   you care about.
