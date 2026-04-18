"use client";

import React, { useState } from "react";

interface MatrixEditorProps {
  initialData: number[][];
  rowLabels?: string[];
  colLabels?: string[];
  min?: number;
  max?: number;
  step?: number;
  visualization?: (data: number[][]) => React.ReactNode;
  onChange?: (data: number[][]) => void;
}

export default function MatrixEditor({
  initialData,
  rowLabels,
  colLabels,
  min = -10,
  max = 10,
  step = 0.1,
  visualization,
  onChange,
}: MatrixEditorProps) {
  const [data, setData] = useState<number[][]>(() =>
    initialData.map((row) => [...row])
  );
  const [draft, setDraft] = useState<string[][]>(() =>
    initialData.map((row) => row.map((v) => String(v)))
  );

  function handleChange(rowIdx: number, colIdx: number, value: string) {
    // Always accept the raw keystrokes so intermediate tokens ("-", ".", "")
    // aren't eaten while the user types a number like "-0.5".
    const nextDraft = draft.map((row, r) =>
      row.map((cell, c) => (r === rowIdx && c === colIdx ? value : cell))
    );
    setDraft(nextDraft);

    const num = parseFloat(value);
    if (!Number.isFinite(num)) return;
    const next = data.map((row, r) =>
      row.map((cell, c) => (r === rowIdx && c === colIdx ? num : cell))
    );
    setData(next);
    onChange?.(next);
  }

  function handleBlur(rowIdx: number, colIdx: number) {
    const raw = draft[rowIdx]?.[colIdx] ?? "";
    const num = parseFloat(raw);
    if (!Number.isFinite(num)) {
      // Revert draft to the last committed numeric value.
      const committed = String(data[rowIdx][colIdx]);
      const nextDraft = draft.map((row, r) =>
        row.map((cell, c) => (r === rowIdx && c === colIdx ? committed : cell))
      );
      setDraft(nextDraft);
    }
  }

  const rows = data.length;
  const cols = data[0]?.length ?? 0;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      {visualization && (
        <div className="rounded-lg bg-surface p-4 min-h-[120px] flex items-center justify-center">
          {visualization(data)}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="border-collapse mx-auto">
          {colLabels && colLabels.length > 0 && (
            <thead>
              <tr>
                {/* corner cell */}
                {rowLabels && <th className="w-16" />}
                {colLabels.map((label, c) => (
                  <th
                    key={c}
                    className="px-2 pb-1 text-xs font-medium text-tertiary text-center"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {Array.from({ length: rows }, (_, r) => (
              <tr key={r}>
                {rowLabels && rowLabels[r] !== undefined && (
                  <td className="pr-2 text-xs font-medium text-tertiary text-right whitespace-nowrap">
                    {rowLabels[r]}
                  </td>
                )}
                {Array.from({ length: cols }, (_, c) => (
                  <td key={c} className="p-1">
                    <input
                      type="number"
                      min={min}
                      max={max}
                      step={step}
                      value={draft[r]?.[c] ?? ""}
                      onChange={(e) => handleChange(r, c, e.target.value)}
                      onBlur={() => handleBlur(r, c)}
                      className="w-16 h-9 rounded-lg border border-border bg-surface text-center font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
