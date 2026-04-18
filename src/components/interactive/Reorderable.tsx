"use client";

import React, { useEffect, useRef, useState } from "react";
import { GripVertical, CheckCircle2, XCircle } from "lucide-react";

interface ReorderableProps {
  items: string[];
  correctOrder: number[];
  instruction?: string;
}

function shuffleIndices(length: number): number[] {
  const arr = Array.from({ length }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function Reorderable({
  items,
  correctOrder,
  instruction,
}: ReorderableProps) {
  // Start with the identity order so SSR and the first client render agree.
  // Shuffling uses Math.random(), which would produce different orderings on
  // server vs. client and trigger a hydration mismatch. We defer the shuffle
  // to a post-mount effect so the randomized order only appears on the client.
  const [order, setOrder] = useState<number[]>(() =>
    Array.from({ length: items.length }, (_, i) => i)
  );
  const [checked, setChecked] = useState(false);
  const dragIdx = useRef<number | null>(null);

  useEffect(() => {
    setOrder(shuffleIndices(items.length));
    // Only shuffle once on mount; re-shuffles happen via the Retry button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allCorrect =
    checked && order.every((itemIdx, pos) => itemIdx === correctOrder[pos]);

  function handleDragStart(listPos: number) {
    dragIdx.current = listPos;
  }

  function handleDragOver(e: React.DragEvent, targetPos: number) {
    e.preventDefault();
    const from = dragIdx.current;
    if (from === null || from === targetPos) return;

    setOrder((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(targetPos, 0, moved);
      return next;
    });
    dragIdx.current = targetPos;
    setChecked(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    dragIdx.current = null;
  }

  function isPositionCorrect(pos: number): boolean {
    return order[pos] === correctOrder[pos];
  }

  function rowClasses(pos: number): string {
    const base =
      "flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors duration-150 cursor-grab active:cursor-grabbing select-none";
    if (!checked) return `${base} bg-card border-border text-foreground hover:bg-surface-hover`;
    if (isPositionCorrect(pos))
      return `${base} bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-700 text-green-800 dark:text-green-300`;
    return `${base} bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-700 text-red-800 dark:text-red-300`;
  }

  function handleCheck() {
    setChecked(true);
  }

  function handleRetry() {
    setOrder(shuffleIndices(items.length));
    setChecked(false);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      {instruction && (
        <p className="text-sm text-muted">{instruction}</p>
      )}

      {/* Sortable list */}
      <div className="space-y-2">
        {order.map((itemIdx, pos) => (
          <div
            key={itemIdx}
            draggable
            onDragStart={() => handleDragStart(pos)}
            onDragOver={(e) => handleDragOver(e, pos)}
            onDrop={handleDrop}
            className={rowClasses(pos)}
          >
            <GripVertical size={16} className="shrink-0 text-tertiary" />
            <span className="flex-1">{items[itemIdx]}</span>
            {checked && isPositionCorrect(pos) && (
              <CheckCircle2 size={16} className="shrink-0 text-green-500 dark:text-green-400" />
            )}
            {checked && !isPositionCorrect(pos) && (
              <XCircle size={16} className="shrink-0 text-red-500 dark:text-red-400" />
            )}
          </div>
        ))}
      </div>

      {/* Success message */}
      {allCorrect && (
        <p className="text-sm font-semibold text-green-600 dark:text-green-400">
          Chính xác!
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleCheck}
          className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-dark transition-colors duration-150"
        >
          Kiểm tra
        </button>
        <button
          onClick={handleRetry}
          className="px-4 py-2 rounded-lg bg-surface text-muted text-sm font-medium hover:bg-surface-hover transition-colors duration-150"
        >
          Thử lại
        </button>
      </div>
    </div>
  );
}
