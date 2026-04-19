"use client";

import React, { useRef, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

export interface DragItem {
  id: string;
  label: string;
}

export interface DropZone {
  id: string;
  label: string;
  accepts: string[];
}

interface DragDropProps {
  items: DragItem[];
  zones: DropZone[];
  instruction?: string;
  onComplete?: (correct: boolean) => void;
}

/**
 * Drag-drop exercise primitive.
 *
 * Uses pointer events (not HTML5 `draggable`) so it works on iOS Safari,
 * Android Chrome, and desktop mice alike. Hit-testing on pointerup reads
 * `document.elementFromPoint` and walks up to find an element tagged with
 * `data-dropzone-id`.
 *
 * Contract: §3.6 of `docs/CONTRACTS.md`.
 */
export default function DragDrop({
  items,
  zones,
  instruction,
  onComplete,
}: DragDropProps) {
  const [placements, setPlacements] = useState<Record<string, string | null>>({});
  const [checked, setChecked] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);
  const ghostOffset = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  const unplaced = items.filter((item) => !placements[item.id]);
  const allPlaced = items.every((item) => Boolean(placements[item.id]));

  function handlePointerDown(
    e: React.PointerEvent<HTMLDivElement>,
    itemId: string
  ) {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    ghostOffset.current = {
      dx: e.clientX - rect.left,
      dy: e.clientY - rect.top,
    };
    target.setPointerCapture(e.pointerId);
    setDraggingId(itemId);
    setGhostPos({ x: e.clientX, y: e.clientY });
    setChecked(false);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (draggingId === null) return;
    setGhostPos({ x: e.clientX, y: e.clientY });
  }

  function findZoneAt(clientX: number, clientY: number): string | "unplaced" | null {
    // Temporarily hide the ghost so elementFromPoint sees what's underneath.
    const el = document.elementFromPoint(clientX, clientY);
    if (!el) return null;
    let cur: Element | null = el;
    while (cur) {
      const zoneId = (cur as HTMLElement).dataset?.dropzoneId;
      if (zoneId) return zoneId;
      if ((cur as HTMLElement).dataset?.unplacedPool === "true")
        return "unplaced";
      cur = cur.parentElement;
    }
    return null;
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (draggingId === null) return;
    const hit = findZoneAt(e.clientX, e.clientY);
    if (hit === "unplaced") {
      setPlacements((prev) => {
        const next = { ...prev };
        delete next[draggingId];
        return next;
      });
    } else if (hit) {
      setPlacements((prev) => ({ ...prev, [draggingId]: hit }));
    }
    setDraggingId(null);
    setGhostPos(null);
    (e.currentTarget as HTMLDivElement).releasePointerCapture?.(e.pointerId);
  }

  function handlePointerCancel() {
    setDraggingId(null);
    setGhostPos(null);
  }

  function isCorrect(itemId: string): boolean {
    const zoneId = placements[itemId];
    if (!zoneId) return false;
    const zone = zones.find((z) => z.id === zoneId);
    return zone?.accepts.includes(itemId) ?? false;
  }

  function handleCheck() {
    setChecked(true);
    const allCorrect = items.every((item) => isCorrect(item.id));
    onComplete?.(allCorrect);
  }

  function handleReset() {
    setPlacements({});
    setChecked(false);
  }

  function itemsInZone(zoneId: string): DragItem[] {
    return items.filter((item) => placements[item.id] === zoneId);
  }

  function itemClasses(itemId: string, isGhost = false): string {
    const base =
      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-border select-none transition-colors duration-150";
    const grab = isGhost
      ? "cursor-grabbing opacity-85 shadow-lg"
      : "cursor-grab active:cursor-grabbing";
    if (!checked) return `${base} ${grab} bg-card text-foreground hover:bg-surface-hover`;
    if (isCorrect(itemId))
      return `${base} ${grab} bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-400 dark:border-green-700`;
    return `${base} ${grab} bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-400 dark:border-red-700`;
  }

  const draggingItem = draggingId
    ? items.find((i) => i.id === draggingId) ?? null
    : null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      {instruction && (
        <p className="text-sm text-muted">{instruction}</p>
      )}

      {/* Unplaced items pool */}
      <div
        data-unplaced-pool="true"
        className="min-h-[56px] rounded-lg bg-surface p-3 flex flex-wrap gap-2"
      >
        {unplaced.length === 0 && (
          <span className="text-xs text-tertiary italic self-center">
            Kéo mục vào đây để bỏ chọn
          </span>
        )}
        {unplaced.map((item) => (
          <div
            key={item.id}
            onPointerDown={(e) => handlePointerDown(e, item.id)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            className={itemClasses(item.id)}
            style={{ touchAction: draggingId === item.id ? "none" : "auto" }}
          >
            {item.label}
          </div>
        ))}
      </div>

      {/* Drop zones */}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${Math.min(zones.length, 3)}, 1fr)` }}
      >
        {zones.map((zone) => {
          const zoneItems = itemsInZone(zone.id);
          return (
            <div
              key={zone.id}
              data-dropzone-id={zone.id}
              className="min-h-[80px] rounded-lg border-2 border-dashed border-border p-2 flex flex-col gap-1.5 transition-colors duration-150 hover:border-accent"
            >
              <span className="text-xs font-semibold text-muted uppercase tracking-wide">
                {zone.label}
              </span>
              {zoneItems.map((item) => (
                <div
                  key={item.id}
                  onPointerDown={(e) => handlePointerDown(e, item.id)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerCancel}
                  className={itemClasses(item.id)}
                  style={{ touchAction: draggingId === item.id ? "none" : "auto" }}
                >
                  {checked && isCorrect(item.id) && (
                    <CheckCircle2 size={14} className="shrink-0 text-green-500 dark:text-green-400" />
                  )}
                  {checked && !isCorrect(item.id) && (
                    <XCircle size={14} className="shrink-0 text-red-500 dark:text-red-400" />
                  )}
                  {item.label}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={handleCheck}
          disabled={!allPlaced}
          className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent-dark transition-colors duration-150"
        >
          Kiểm tra
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 rounded-lg bg-surface text-muted text-sm font-medium hover:bg-surface-hover transition-colors duration-150"
        >
          Làm lại
        </button>
      </div>

      {/* Ghost follower for visual feedback during drag */}
      {draggingItem && ghostPos && typeof window !== "undefined" && (
        <div
          className={itemClasses(draggingItem.id, true)}
          style={{
            position: "fixed",
            left: ghostPos.x - ghostOffset.current.dx,
            top: ghostPos.y - ghostOffset.current.dy,
            pointerEvents: "none",
            zIndex: 50,
          }}
        >
          {draggingItem.label}
        </div>
      )}
    </div>
  );
}
