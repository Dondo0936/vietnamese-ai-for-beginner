# scripts/

Deterministic repair tools for the contracts in `docs/CONTRACTS.md`. Every
script is idempotent — safe to run repeatedly. All emit human-readable
change logs to stdout.

## sync-registry.mjs

Propagate `titleVi`, `description`, `difficulty`, `category` from each
topic file's `export const metadata` into the matching entry in
`src/topics/registry.ts`.

```
node scripts/sync-registry.mjs
```

Run after any bulk edit to topic files' metadata. Registry is the source
of truth for HTML `<title>` and Open Graph (see
`src/app/topics/[slug]/page.tsx`); without this sync, SEO will serve
stale copy while the body shows updated titles.

Contract: `docs/CONTRACTS.md` §1. Enforced by `contracts.test.ts →
metadata parity with registry`.

## fix-difficulty-monotonicity.mjs

Walk each path's stages left→right and bump any slug whose difficulty is
*lower* than its predecessor's up to match. Edits the topic file's
metadata export (source of truth); re-run `sync-registry.mjs` after to
propagate.

```
node scripts/fix-difficulty-monotonicity.mjs
node scripts/sync-registry.mjs
```

Iterates to a fixed point (up to 5 passes) because slugs are shared
across paths — one path's bump can surface a regression in another.

Contract: `docs/CONTRACTS.md` §2. Enforced by `contracts.test.ts →
difficulty monotonic per stage`.

## raise-svg-fontsize.mjs

Raise any `fontSize="N"` (or `fontSize={N}`) where `N < 11` up to 11.
Improves mobile-phone legibility without changing desktop appearance
significantly. Narrow codemod; a full responsive-sizing migration is a
separate follow-up.

```
node scripts/raise-svg-fontsize.mjs
```

Contract: `docs/CONTRACTS.md` §4.6. Regression-guarded by
`contracts.test.ts → SVG <text> fontSize`.
