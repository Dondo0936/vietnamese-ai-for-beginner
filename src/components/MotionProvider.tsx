"use client";

import { MotionConfig } from "framer-motion";

/**
 * Root-level Framer Motion config wrapper.
 *
 * `reducedMotion="user"` makes every descendant motion component respect
 * the OS `prefers-reduced-motion` preference automatically — without each
 * primitive needing its own `useReducedMotion()` hook.
 *
 * Lives as a dedicated client component so it can be imported from the
 * server-rendered root layout without forcing the whole tree onto the
 * client boundary.
 *
 * Enforced by `docs/CONTRACTS.md` section 3.5 +
 * `src/__tests__/contracts.test.ts`.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
