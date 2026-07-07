# Retrofit: real images into ai-agent-loops

## Goal

Add the three official Anthropic diagrams (already downloaded to `public/loops-guide/`) into `src/topics/ai-agent-loops.tsx`, with Vietnamese captions and source credit. This moves the lesson toward the standing 70/30 real-images-vs-rebuilt rule.

## Context / why

The lesson currently rebuilds every visual in TSX. The source article ("Getting started with loops", claude.com blog, June 30 2026) ships three high-res diagrams that map 1:1 onto existing lesson beats. Assets are in place (2024px-wide PNGs):

- `public/loops-guide/agentic-loop.png` — the base agentic loop: Your prompt → Gather context → Take action → Verify the work → Response; caption notes it exits when Claude judges the task complete or the effort budget runs out.
- `public/loops-guide/goal-evaluator.png` — the `/goal` cycle: Claude works → tries to stop → Evaluator model checks your condition → loop ends (goal met or turn limit) / condition not met → sent back to work; header shows the exact Lighthouse command.
- `public/loops-guide/proactive-loop.png` — the proactive cloud loop: /schedule watches Slack/GitHub → main agent loops until the verification skill passes → opens a PR → second agent reviews → you decide what to merge; framed "runs in the cloud — laptop open or not".

## Files to touch

- `src/topics/ai-agent-loops.tsx` — ONLY file. Add one local `FigureCard` component and three usages. No other topic, no registry change (metadata `sources` addition happens in BOTH the topic file and `src/topics/registry.ts` entry — see below, so registry.ts is touched for that one field only).
- `src/topics/registry.ts` — mirror the new `sources` field into the `ai-agent-loops` entry (contracts parity risk if the tested fields drift; `sources` is not contract-tested but keep the two objects identical anyway).

## Interfaces & contracts

1. Local figure component (no new dependency; `next/image` is available in this Next.js app — note the repo warning that this Next version may differ from training data, so check `node_modules/next/dist/docs/` for the current `Image` API before using it; if `next/image` has breaking changes, fall back to a plain `<img>` with `loading="lazy"`):

```tsx
function FigureCard({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  // rounded-xl border border-border bg-card p-3
  // image: w-full h-auto rounded-lg (intrinsic 2024px wide; render responsive)
  // caption: <p className="mt-2 text-xs leading-relaxed text-muted">{caption}</p> on bg-card (neutral, allowed)
}
```

2. Placements (all three inside existing sections; do not renumber beats):
   - `agentic-loop.png` — in beat 4 ("Vòng lặp lõi"), directly AFTER `<AgenticLoopReveal />`, caption: "Vòng lặp lõi của agent theo minh họa của Anthropic: nhận yêu cầu, thu thập ngữ cảnh, hành động, tự kiểm tra, rồi trả lời." alt: "Sơ đồ vòng lặp của agent: prompt, thu thập ngữ cảnh, hành động, kiểm tra, trả lời".
   - `goal-evaluator.png` — in beat 4, directly AFTER the `Callout` "Model đánh giá không thay bạn đoán", caption: "Chu trình /goal: agent định dừng, model đánh giá kiểm tra điều kiện, chưa đạt thì quay lại làm tiếp. Minh họa của Anthropic." alt: "Sơ đồ /goal: Claude làm việc, model đánh giá kiểm tra điều kiện, vòng lặp kết thúc khi mục tiêu đạt hoặc hết lượt".
   - `proactive-loop.png` — in beat 3 ("Bốn kiểu"), directly AFTER `<LoopTypeGrid />` and BEFORE the `Callout` "Lưu ý sản phẩm", caption: "Vòng lặp chủ động chạy trên cloud: /schedule theo dõi Slack hoặc GitHub, agent chính lặp đến khi bài kiểm tra đạt, agent thứ hai review, bạn là người quyết định gộp. Minh họa của Anthropic." alt: "Sơ đồ vòng lặp chủ động trên cloud với /schedule, agent chính, agent review và người quyết định cuối".
   - Note: the diagrams contain English text and em dashes — that is fine, they are Anthropic's original figures; the em-dash ban applies to OUR Vietnamese prose only.

3. Add `sources` to metadata (BOTH files, identical):

```ts
sources: [
  {
    title: "Getting started with loops",
    publisher: "Anthropic (Claude blog)",
    url: "https://claude.com/blog/getting-started-with-loops",
    date: "2026-06",
    kind: "engineering-blog",
  },
],
```

## Constraints / do-not-touch

- No new npm dependencies. No changes to other topics, loader, paths, or any shared component.
- Contrast rules per AGENTS.md hold for the caption text (neutral `bg-card` + `text-muted` caption is allowed; no tinted panel here).
- Do NOT git commit, push, or deploy.

## Acceptance criteria

- [ ] Three figures render responsively (no horizontal overflow on mobile widths) inside the correct beats.
- [ ] Vietnamese captions + alt text as specified; source credit present via captions and `sources` metadata in both files.
- [ ] `npm test` green, `npx tsc --noEmit` clean, `npm run build` succeeds.

## Verification commands

```sh
cd /Users/datdo/Projects/ai-edu-v2
npm test
npx tsc --noEmit
npm run build 2>&1 | tail -5
grep -c "loops-guide" src/topics/ai-agent-loops.tsx
grep -c "getting-started-with-loops" src/topics/ai-agent-loops.tsx src/topics/registry.ts
```
