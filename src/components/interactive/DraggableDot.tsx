"use client";

import React, { useCallback, useRef, useState } from "react";

/**
 * Minimum touch-target radius for the invisible hitbox overlay, in SVG
 * user units. 18 → 36px diameter, which sits adjacent to the WCAG 2.5.5
 * recommendation of 44×44 at default viewport density. Keep ≥ 18.
 *
 * Do not lower this number without consulting `docs/CONTRACTS.md` §3.3.
 */
export const HITBOX_R = 18;

export interface DraggableDotProps {
  /** Center x in SVG user-units. */
  cx: number;
  /** Center y in SVG user-units. */
  cy: number;
  /** Visible dot radius. Hitbox is always ≥ HITBOX_R regardless. */
  r?: number;
  /** Fill color of the visible dot. CSS color string or token. */
  color?: string;
  /** Callback fired on pointer drag + arrow-key nudge. */
  onMove: (nextCx: number, nextCy: number) => void;
  /** Optional bounds clamp in SVG units. */
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
  /** Ref to the enclosing <svg> so pointer coords convert to SVG units. */
  svgRef: React.RefObject<SVGSVGElement | null>;
  /** Accessible label for screen readers. */
  label?: string;
  /** Announcement string for aria-live on value change. */
  valueText?: string;
  /** Amount to nudge per arrow-key press (default 1). */
  keyboardStep?: number;
}

export function DraggableDot({
  cx,
  cy,
  r = 6,
  color = "var(--color-accent)",
  onMove,
  minX = -Infinity,
  maxX = Infinity,
  minY = -Infinity,
  maxY = Infinity,
  svgRef,
  label,
  valueText,
  keyboardStep = 1,
}: DraggableDotProps) {
  const draggingRef = useRef(false);
  const [focused, setFocused] = useState(false);

  const clamp = useCallback(
    (x: number, y: number): [number, number] => [
      Math.min(maxX, Math.max(minX, x)),
      Math.min(maxY, Math.max(minY, y)),
    ],
    [minX, maxX, minY, maxY]
  );

  const toSvgPoint = useCallback(
    (clientX: number, clientY: number): [number, number] => {
      const svg = svgRef.current;
      if (!svg) return [clientX, clientY];
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return [clientX, clientY];
      const converted = pt.matrixTransform(ctm.inverse());
      return [converted.x, converted.y];
    },
    [svgRef]
  );

  function handlePointerDown(e: React.PointerEvent<SVGCircleElement>) {
    draggingRef.current = true;
    (e.currentTarget as SVGCircleElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<SVGCircleElement>) {
    if (!draggingRef.current) return;
    const [x, y] = toSvgPoint(e.clientX, e.clientY);
    const [nx, ny] = clamp(x, y);
    onMove(nx, ny);
  }

  function handlePointerUp(e: React.PointerEvent<SVGCircleElement>) {
    draggingRef.current = false;
    (e.currentTarget as SVGCircleElement).releasePointerCapture(e.pointerId);
  }

  function handleKeyDown(e: React.KeyboardEvent<SVGCircleElement>) {
    let dx = 0;
    let dy = 0;
    if (e.key === "ArrowLeft") dx = -keyboardStep;
    else if (e.key === "ArrowRight") dx = keyboardStep;
    else if (e.key === "ArrowUp") dy = -keyboardStep;
    else if (e.key === "ArrowDown") dy = keyboardStep;
    else return;
    e.preventDefault();
    const [nx, ny] = clamp(cx + dx, cy + dy);
    onMove(nx, ny);
  }

  return (
    <g>
      {/* Visible dot */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={color}
        stroke={focused ? "var(--color-accent)" : "white"}
        strokeWidth={focused ? 2.5 : 1.5}
        aria-hidden="true"
        pointerEvents="none"
      />
      {/* Invisible hitbox + keyboard target. Radius always ≥ HITBOX_R so
          the touch target meets WCAG 2.5.5 regardless of the visible size. */}
      <circle
        cx={cx}
        cy={cy}
        r={Math.max(r, HITBOX_R)}
        fill="transparent"
        stroke="transparent"
        style={{ cursor: "grab", touchAction: "none" }}
        tabIndex={0}
        role="slider"
        aria-label={label}
        aria-valuetext={valueText}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </g>
  );
}
