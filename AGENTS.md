<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Contracts — read before editing topics or primitives

`docs/CONTRACTS.md` is the single source of truth for every enforced invariant: registry/topic metadata parity, difficulty monotonicity, primitive requirements (InlineChallenge retry, SliderGroup reset, DraggableDot 44×44 hitbox, MetricReadout aria-live, root MotionConfig), color+icon pairing, jargon gloss policy, PredictionGate discipline, hex→token policy, mobile touch/scroll rules.

Every contract has a matching test in `src/__tests__/contracts.test.ts`. `npm test` must be green before every ship. If you add a new contract, write the test first, then update `docs/CONTRACTS.md`, then make it pass.

# Color contrast — audit before shipping any visible UI change

Vietnamese diacritics make low-contrast text harder to scan than English at the same hex values, and our turquoise accent collides with emerald, green, teal, and cyan in ways that pass WCAG math but still read washed out. **Before shipping any change that touches a topic file or an interactive primitive, audit the contrast of every state the user can see.**

## The two failure modes that keep recurring

1. **Same-hue collision.** Title text in the turquoise/green family on a panel that is *also* tinted from the same family (e.g. `text-accent-dark` on `bg-accent-light`, `text-emerald-700` on `bg-emerald-50`). The contrast ratio passes AA, but the title hue and panel hue are the same family at low saturation, so the title visually washes into the panel. Fix: jump two steps (e.g. `-700` → `-900` for text, or swap to a different scale like `turquoise-700` over `accent-dark`).
2. **`text-foreground` rule for state buttons.** When a button changes background to signal state (`bg-emerald-100` for correct, `bg-red-100` for wrong), prefer `text-foreground font-semibold` over `text-emerald-900` / `text-red-900`. The colored border + bg already carries the semantic; the body text just needs to be maximally legible. Reserve the colored hue for short badge words like "Chính xác!" or "Chưa đúng."

## Required floor for body text

| Pairing | Light mode floor | Dark mode floor |
| --- | --- | --- |
| Body text on tinted panel | `text-{hue}-800` or `text-foreground` | `text-{hue}-200` or `text-foreground` |
| Title on tinted panel | `text-{hue}-900` (different scale than the panel if same family) | `text-{hue}-200` |
| Selected/correct/wrong button | `text-foreground font-semibold` | `text-{hue}-100` |

`text-{hue}-{50,100,200,300,400,500,600}` on a same-family `bg-{hue}-{50,100}` is **banned in shipped UI** even when math passes.

## Audit workflow before ship

1. List every state the change introduces (idle / hover / selected / correct / wrong / revealed / loading).
2. For each state, identify the text + background pair on light mode and dark mode.
3. Reject any pair that violates the table above.
4. If you cannot test the page in a browser, dispatch a separate audit agent (Opus) with the topic file + every primitive it transitively uses. Ask for a punch list of class swaps. Apply them.
5. Spot-check the live page at `udemi.tech` after deploy. Screenshots beat math when a user reports washout.

## Primitives most likely to hide a contrast bug

- `Callout` (insight + tip variants — turquoise/green-on-tinted-panel)
- `InlineChallenge` (correct / wrong option button + feedback card — emerald/red on emerald/red panel)
- `PredictionGate` (selected pre-reveal option — accent on accent-light)
- `ApproachPicker` and similar custom pickers inside topic files (correct/wrong explanation labels at `text-{hue}-700`)

When you change a primitive, the audit applies to **every topic that imports it**, not just the page you tested.

# Shipping rules — push to BOTH git and Vercel

GitHub → Vercel auto-sync on this project is unreliable. Every time you ship:

1. `git push origin main` (or whatever branch is being shipped).
2. Immediately after, run `vercel deploy --prod --yes` from the repo root to force a production deploy.
3. Verify the deploy landed by curling a known route on `udemi.tech` (e.g. `curl -sS -o /dev/null -w "%{http_code}\n" https://udemi.tech/`) and expecting `200`. Grep the response body for a string you know is new in this ship to confirm the content matches HEAD, not a stale build.
4. Report both SHAs + the Vercel deployment URL back to the user.

Never assume the git push alone is enough. Never skip step 3 — the production URL is the source of truth for "is it live."
