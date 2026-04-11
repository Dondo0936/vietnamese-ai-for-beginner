"use client";

import React from "react";
import { Trash2 } from "lucide-react";

export interface Point {
  x: number;
  y: number;
  label?: string;
  color?: string;
}

interface CanvasPlaygroundProps {
  width?: number;
  height?: number;
  showGrid?: boolean;
  points: Point[];
  onAddPoint?: (point: Point) => void;
  onReset?: () => void;
  overlay?: (width: number, height: number) => React.ReactNode;
  instruction?: string;
  nextColor?: string;
  nextLabel?: string;
}

const GRID_STEP = 40;

export default function CanvasPlayground({
  width = 400,
  height = 300,
  showGrid = true,
  points,
  onAddPoint,
  onReset,
  overlay,
  instruction,
  nextColor = "#6366f1",
  nextLabel,
}: CanvasPlaygroundProps) {
  function handleSvgClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!onAddPoint) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    onAddPoint({ x, y, color: nextColor, label: nextLabel });
  }

  const gridCols = Math.floor(width / GRID_STEP);
  const gridRows = Math.floor(height / GRID_STEP);

  return (
    <div className="space-y-2">
      {instruction && (
        <p className="text-sm text-muted text-center">{instruction}</p>
      )}

      <div
        className="rounded-xl border border-border bg-surface overflow-hidden"
        style={{ width, maxWidth: "100%" }}
      >
        <svg
          width={width}
          height={height}
          className="block cursor-crosshair select-none"
          onClick={handleSvgClick}
          style={{ maxWidth: "100%", height: "auto" }}
        >
          {/* Grid lines */}
          {showGrid && (
            <g className="grid-lines" opacity={0.2}>
              {Array.from({ length: gridCols }, (_, i) => (
                <line
                  key={`v${i}`}
                  x1={(i + 1) * GRID_STEP}
                  y1={0}
                  x2={(i + 1) * GRID_STEP}
                  y2={height}
                  stroke="currentColor"
                  strokeWidth={1}
                  className="text-foreground"
                />
              ))}
              {Array.from({ length: gridRows }, (_, i) => (
                <line
                  key={`h${i}`}
                  x1={0}
                  y1={(i + 1) * GRID_STEP}
                  x2={width}
                  y2={(i + 1) * GRID_STEP}
                  stroke="currentColor"
                  strokeWidth={1}
                  className="text-foreground"
                />
              ))}
            </g>
          )}

          {/* Parent overlay */}
          {overlay?.(width, height)}

          {/* Points */}
          {points.map((pt, i) => (
            <g key={i}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={7}
                fill={pt.color ?? "#6366f1"}
                stroke="white"
                strokeWidth={1.5}
                opacity={0.9}
              />
              {pt.label && (
                <text
                  x={pt.x + 10}
                  y={pt.y + 4}
                  fontSize={11}
                  fill={pt.color ?? "#6366f1"}
                  fontWeight={600}
                  fontFamily="monospace"
                >
                  {pt.label}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      {onReset && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-muted hover:bg-surface hover:text-foreground transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Xóa hết
          </button>
        </div>
      )}
    </div>
  );
}
