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

export default function DragDrop({
  items,
  zones,
  instruction,
  onComplete,
}: DragDropProps) {
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const dragRef = useRef<string | null>(null);

  const unplaced = items.filter((item) => !Object.keys(placements).includes(item.id));
  const allPlaced = items.every((item) => placements[item.id] !== undefined);

  function handleDragStart(itemId: string) {
    dragRef.current = itemId;
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(zoneId: string) {
    const itemId = dragRef.current;
    if (!itemId) return;
    setPlacements((prev) => ({ ...prev, [itemId]: zoneId }));
    dragRef.current = null;
    setChecked(false);
  }

  function handleDropToUnplaced(e: React.DragEvent) {
    e.preventDefault();
    const itemId = dragRef.current;
    if (!itemId) return;
    setPlacements((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
    dragRef.current = null;
    setChecked(false);
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

  function itemClasses(itemId: string): string {
    const base =
      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-border cursor-grab active:cursor-grabbing select-none transition-colors duration-150";
    if (!checked) return `${base} bg-card text-foreground hover:bg-surface-hover`;
    if (isCorrect(itemId))
      return `${base} bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-400 dark:border-green-700`;
    return `${base} bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-400 dark:border-red-700`;
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      {instruction && (
        <p className="text-sm text-muted">{instruction}</p>
      )}

      {/* Unplaced items pool */}
      <div
        className="min-h-[56px] rounded-lg bg-surface p-3 flex flex-wrap gap-2"
        onDragOver={handleDragOver}
        onDrop={handleDropToUnplaced}
      >
        {unplaced.length === 0 && (
          <span className="text-xs text-tertiary italic self-center">
            Kéo mục vào đây để bỏ chọn
          </span>
        )}
        {unplaced.map((item) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => handleDragStart(item.id)}
            className={itemClasses(item.id)}
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
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(zone.id)}
              className="min-h-[80px] rounded-lg border-2 border-dashed border-border p-2 flex flex-col gap-1.5 transition-colors duration-150 hover:border-accent"
            >
              <span className="text-xs font-semibold text-muted uppercase tracking-wide">
                {zone.label}
              </span>
              {zoneItems.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(item.id)}
                  className={itemClasses(item.id)}
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
    </div>
  );
}
