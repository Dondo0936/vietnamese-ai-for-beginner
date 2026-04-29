"use client";

import React, { useEffect, useState } from "react";

export interface Pair {
  left: string;
  right: string;
}

interface MatchPairsProps {
  pairs: Pair[];
  instruction?: string;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function MatchPairs({ pairs, instruction }: MatchPairsProps) {
  // Seed with the identity order so SSR and the first client render produce
  // identical HTML. Math.random() in the initializer would desync them and
  // trigger a hydration mismatch. The real shuffle happens post-mount.
  const [shuffledRight, setShuffledRight] = useState<number[]>(() =>
    pairs.map((_, i) => i)
  );
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matches, setMatches] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setShuffledRight((prev) => shuffle(prev));
    // Only shuffle once on mount; Reset button re-shuffles explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allMatched = Object.keys(matches).length === pairs.length;

  function handleLeftClick(leftIdx: number) {
    if (checked) return;
    if (matches[leftIdx] !== undefined) return;
    setSelectedLeft(leftIdx === selectedLeft ? null : leftIdx);
  }

  function handleRightClick(rightOriginalIdx: number) {
    if (checked) return;
    if (selectedLeft === null) return;
    // Check right side not already matched
    const alreadyUsed = Object.values(matches).includes(rightOriginalIdx);
    if (alreadyUsed) return;
    setMatches((prev) => ({ ...prev, [selectedLeft]: rightOriginalIdx }));
    setSelectedLeft(null);
  }

  function handleReset() {
    setShuffledRight(shuffle(pairs.map((_, i) => i)));
    setSelectedLeft(null);
    setMatches({});
    setChecked(false);
  }

  function getLeftClass(idx: number): string {
    const base =
      "w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring";

    if (checked) {
      const matchedRight = matches[idx];
      if (matchedRight === undefined) return `${base} border-border bg-card text-muted`;
      const correct = matchedRight === idx;
      return correct
        ? `${base} border-emerald-600 bg-emerald-100 text-emerald-900 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700`
        : `${base} border-red-500 bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700`;
    }

    if (matches[idx] !== undefined) {
      return `${base} border-accent/60 bg-accent-light text-accent-dark opacity-70`;
    }
    if (selectedLeft === idx) {
      return `${base} border-accent bg-accent-light text-accent-dark ring-2 ring-accent/50`;
    }
    return `${base} border-border bg-card text-foreground hover:bg-surface hover:border-accent/40`;
  }

  function getRightClass(originalIdx: number): string {
    const base =
      "w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring";

    const alreadyUsed = Object.values(matches).includes(originalIdx);

    if (checked) {
      // Find what left index was matched to this right
      const leftIdx = Object.entries(matches).find(
        ([, r]) => r === originalIdx
      )?.[0];
      if (leftIdx === undefined) return `${base} border-border bg-card text-muted`;
      const correct = Number(leftIdx) === originalIdx;
      return correct
        ? `${base} border-emerald-600 bg-emerald-100 text-emerald-900 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700`
        : `${base} border-red-500 bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700`;
    }

    if (alreadyUsed) {
      return `${base} border-accent/60 bg-accent-light text-accent-dark opacity-70`;
    }
    if (selectedLeft !== null) {
      return `${base} border-border bg-card text-foreground hover:bg-surface hover:border-accent/40 cursor-pointer`;
    }
    return `${base} border-border bg-card text-muted`;
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      {instruction && (
        <p className="text-sm text-muted">{instruction}</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* Left column */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-tertiary uppercase tracking-wide mb-1">Cột A</p>
          {pairs.map((pair, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleLeftClick(idx)}
              className={getLeftClass(idx)}
            >
              {pair.left}
            </button>
          ))}
        </div>

        {/* Right column (shuffled) */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-tertiary uppercase tracking-wide mb-1">Cột B</p>
          {shuffledRight.map((originalIdx) => (
            <button
              key={originalIdx}
              type="button"
              onClick={() => handleRightClick(originalIdx)}
              className={getRightClass(originalIdx)}
            >
              {pairs[originalIdx].right}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-1">
        {checked ? (
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 rounded-xl border border-border bg-card text-sm font-medium text-muted hover:bg-surface transition-colors"
          >
            Làm lại
          </button>
        ) : (
          <button
            type="button"
            disabled={!allMatched}
            onClick={() => setChecked(true)}
            className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold transition-opacity disabled:opacity-40 hover:enabled:opacity-90"
          >
            Kiểm tra
          </button>
        )}
      </div>
    </div>
  );
}
