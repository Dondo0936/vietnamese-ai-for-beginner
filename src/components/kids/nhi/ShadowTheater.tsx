"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import MascotBubble from "@/components/kids/nhi/MascotBubble";
import PearlReveal from "@/components/kids/nhi/PearlReveal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Phase = 0 | 1 | 2;
type BubbleMood = "happy" | "curious" | "oops" | "celebrate";

type ShapeId = "sphere" | "cube" | "pyramid" | "cylinder" | "cone";

interface ShapeConfig {
  id: ShapeId;
  nameVi: string;
  fill: string;
  shadowFill: string;
}

/** A shadow silhouette keyframe at a specific angle */
interface ShadowKeyframe {
  angle: number;
  /** SVG path d string for the shadow silhouette */
  path: string;
  /** Bounding box: x offset and width for overlap calculation */
  bboxX: number;
  bboxW: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SVG_W = 400;
const SVG_H = 400;

const STAGE_X = 10;
const STAGE_W = 180;
const SCREEN_X = 210;
const SCREEN_W = 180;
const STAGE_Y = 20;
const STAGE_H = 280;
const SCREEN2_X = 310;
const SCREEN2_W = 80;

/** 36-degree sectors for phase 0 tracking */
const SECTOR_COUNT = 10;
const SECTORS_NEEDED = 10;

const TEXT = {
  introText:
    "Rạp chiếu bóng! Xoay đèn xem bóng của các hình thay đổi thế nào!",
  phase0Hint: "Kéo vòng tròn để xoay đèn nha!",
  phase1Prompt: "Tìm góc chiếu mà mình phân biệt được cả 5 hình!",
  phase1Found: "Tuyệt vời! Góc này cho thấy rõ nhất!",
  phase1DualScreen:
    "Nhìn thêm góc này nữa — hai góc nhìn giúp mình hiểu rõ hơn!",
  phase2Prompt: "Giấu một hình mới sau màn! Bạn mình phải đoán từ bóng thôi!",
  phase2FriendGuessing: "Bạn mình đang đoán... Hình gì nhỉ?",
  shapeSphere: "Hình cầu",
  shapeCube: "Hình hộp",
  shapePyramid: "Hình chóp",
  shapeCylinder: "Hình trụ",
  shapeCone: "Hình nón",
} as const;

const SHAPES: ShapeConfig[] = [
  {
    id: "sphere",
    nameVi: TEXT.shapeSphere,
    fill: "#3b82f6",
    shadowFill: "#1e3a5f",
  },
  {
    id: "cube",
    nameVi: TEXT.shapeCube,
    fill: "#ef4444",
    shadowFill: "#7f1d1d",
  },
  {
    id: "pyramid",
    nameVi: TEXT.shapePyramid,
    fill: "#22c55e",
    shadowFill: "#14532d",
  },
  {
    id: "cylinder",
    nameVi: TEXT.shapeCylinder,
    fill: "#a855f7",
    shadowFill: "#4c1d95",
  },
  {
    id: "cone",
    nameVi: TEXT.shapeCone,
    fill: "#f97316",
    shadowFill: "#7c2d12",
  },
];

const PHASE0_SHAPES = SHAPES.slice(0, 3); // sphere, cube, pyramid
const ALL_SHAPES = SHAPES;

// ---------------------------------------------------------------------------
// Shadow keyframes per shape
// ---------------------------------------------------------------------------
// Each shape has shadow silhouettes at key angles (0, 45, 90, 135, 180, 225, 270, 315).
// Shadows are projected onto the "screen" in a vertical band, so the path
// coordinates use relative positions within each shape's screen slot.

function buildShadowKeyframes(): Record<ShapeId, ShadowKeyframe[]> {
  return {
    // Sphere: always a circle — same shadow regardless of angle
    sphere: [
      { angle: 0, path: "M0,0 a20,20 0 1,0 40,0 a20,20 0 1,0 -40,0 Z", bboxX: 0, bboxW: 40 },
      { angle: 45, path: "M0,0 a20,20 0 1,0 40,0 a20,20 0 1,0 -40,0 Z", bboxX: 0, bboxW: 40 },
      { angle: 90, path: "M0,0 a20,20 0 1,0 40,0 a20,20 0 1,0 -40,0 Z", bboxX: 0, bboxW: 40 },
      { angle: 135, path: "M0,0 a20,20 0 1,0 40,0 a20,20 0 1,0 -40,0 Z", bboxX: 0, bboxW: 40 },
      { angle: 180, path: "M0,0 a20,20 0 1,0 40,0 a20,20 0 1,0 -40,0 Z", bboxX: 0, bboxW: 40 },
      { angle: 225, path: "M0,0 a20,20 0 1,0 40,0 a20,20 0 1,0 -40,0 Z", bboxX: 0, bboxW: 40 },
      { angle: 270, path: "M0,0 a20,20 0 1,0 40,0 a20,20 0 1,0 -40,0 Z", bboxX: 0, bboxW: 40 },
      { angle: 315, path: "M0,0 a20,20 0 1,0 40,0 a20,20 0 1,0 -40,0 Z", bboxX: 0, bboxW: 40 },
    ],
    // Cube: varies a lot — square face on, diamond-shaped at 45°
    cube: [
      { angle: 0, path: "M0,-20 L36,-20 L36,20 L0,20 Z", bboxX: 0, bboxW: 36 },
      { angle: 45, path: "M18,-28 L40,-4 L22,22 L0,-4 Z", bboxX: 0, bboxW: 40 },
      { angle: 90, path: "M2,-20 L38,-20 L38,20 L2,20 Z", bboxX: 2, bboxW: 36 },
      { angle: 135, path: "M18,-28 L40,-4 L22,22 L0,-4 Z", bboxX: 0, bboxW: 40 },
      { angle: 180, path: "M0,-20 L36,-20 L36,20 L0,20 Z", bboxX: 0, bboxW: 36 },
      { angle: 225, path: "M18,-28 L40,-4 L22,22 L0,-4 Z", bboxX: 0, bboxW: 40 },
      { angle: 270, path: "M2,-20 L38,-20 L38,20 L2,20 Z", bboxX: 2, bboxW: 36 },
      { angle: 315, path: "M18,-28 L40,-4 L22,22 L0,-4 Z", bboxX: 0, bboxW: 40 },
    ],
    // Pyramid: triangle from front, diamond-ish from 45°
    pyramid: [
      { angle: 0, path: "M18,-24 L36,18 L0,18 Z", bboxX: 0, bboxW: 36 },
      { angle: 45, path: "M16,-24 L38,6 L28,18 L0,6 Z", bboxX: 0, bboxW: 38 },
      { angle: 90, path: "M4,-24 L32,-24 L32,18 L4,18 Z", bboxX: 4, bboxW: 28 },
      { angle: 135, path: "M22,-24 L38,6 L18,18 L0,6 Z", bboxX: 0, bboxW: 38 },
      { angle: 180, path: "M18,-24 L36,18 L0,18 Z", bboxX: 0, bboxW: 36 },
      { angle: 225, path: "M16,-24 L38,6 L28,18 L0,6 Z", bboxX: 0, bboxW: 38 },
      { angle: 270, path: "M4,-24 L32,-24 L32,18 L4,18 Z", bboxX: 4, bboxW: 28 },
      { angle: 315, path: "M22,-24 L38,6 L18,18 L0,6 Z", bboxX: 0, bboxW: 38 },
    ],
    // Cylinder: rectangle with rounded ends from side, circle from top
    cylinder: [
      { angle: 0, path: "M4,-22 L32,-22 A14,8 0 0,1 32,22 L4,22 A14,8 0 0,1 4,-22 Z", bboxX: 4, bboxW: 28 },
      { angle: 45, path: "M2,-18 L36,-22 L36,18 L2,22 Z", bboxX: 2, bboxW: 34 },
      { angle: 90, path: "M4,0 a16,18 0 1,0 32,0 a16,18 0 1,0 -32,0 Z", bboxX: 4, bboxW: 32 },
      { angle: 135, path: "M2,-22 L36,-18 L36,22 L2,18 Z", bboxX: 2, bboxW: 34 },
      { angle: 180, path: "M4,-22 L32,-22 A14,8 0 0,1 32,22 L4,22 A14,8 0 0,1 4,-22 Z", bboxX: 4, bboxW: 28 },
      { angle: 225, path: "M2,-18 L36,-22 L36,18 L2,22 Z", bboxX: 2, bboxW: 34 },
      { angle: 270, path: "M4,0 a16,18 0 1,0 32,0 a16,18 0 1,0 -32,0 Z", bboxX: 4, bboxW: 32 },
      { angle: 315, path: "M2,-22 L36,-18 L36,22 L2,18 Z", bboxX: 2, bboxW: 34 },
    ],
    // Cone: triangle from side, circle from top
    cone: [
      { angle: 0, path: "M18,-24 L36,18 A18,6 0 0,1 0,18 Z", bboxX: 0, bboxW: 36 },
      { angle: 45, path: "M14,-24 L38,10 L26,18 L0,10 Z", bboxX: 0, bboxW: 38 },
      { angle: 90, path: "M4,0 a16,18 0 1,0 32,0 a16,18 0 1,0 -32,0 Z", bboxX: 4, bboxW: 32 },
      { angle: 135, path: "M24,-24 L38,10 L12,18 L0,10 Z", bboxX: 0, bboxW: 38 },
      { angle: 180, path: "M18,-24 L36,18 A18,6 0 0,1 0,18 Z", bboxX: 0, bboxW: 36 },
      { angle: 225, path: "M14,-24 L38,10 L26,18 L0,10 Z", bboxX: 0, bboxW: 38 },
      { angle: 270, path: "M4,0 a16,18 0 1,0 32,0 a16,18 0 1,0 -32,0 Z", bboxX: 4, bboxW: 32 },
      { angle: 315, path: "M24,-24 L38,10 L12,18 L0,10 Z", bboxX: 0, bboxW: 38 },
    ],
  };
}

const SHADOW_KEYFRAMES = buildShadowKeyframes();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Normalize angle to 0..360 */
function normAngle(a: number): number {
  return ((a % 360) + 360) % 360;
}

/** Get the sector index (0..9) for a given angle */
function getSector(angle: number): number {
  return Math.floor(normAngle(angle) / (360 / SECTOR_COUNT)) % SECTOR_COUNT;
}

/**
 * Interpolate shadow data for a given shape at a given angle.
 * Returns the path and bounding box of the closest keyframe pair, linearly interpolated.
 */
function getShadowAtAngle(
  shapeId: ShapeId,
  angle: number,
): { path: string; bboxX: number; bboxW: number } {
  const keyframes = SHADOW_KEYFRAMES[shapeId];
  const a = normAngle(angle);

  // Find surrounding keyframes
  let lo = keyframes[keyframes.length - 1];
  let hi = keyframes[0];
  for (let i = 0; i < keyframes.length; i++) {
    if (keyframes[i].angle <= a) lo = keyframes[i];
    if (keyframes[i].angle > a) {
      hi = keyframes[i];
      break;
    }
    // If we've gone past all, wrap around
    if (i === keyframes.length - 1) {
      hi = keyframes[0];
    }
  }

  // For simplicity, snap to the nearest keyframe's path (SVG paths can't easily interpolate)
  // but interpolate the bounding box for accurate clarity calculation
  const loAngle = lo.angle;
  let hiAngle = hi.angle;
  if (hiAngle <= loAngle) hiAngle += 360;
  let aNorm = a;
  if (aNorm < loAngle) aNorm += 360;

  const range = hiAngle - loAngle;
  const t = range === 0 ? 0 : (aNorm - loAngle) / range;

  // Snap path to closest keyframe
  const snapKf = t < 0.5 ? lo : hi;

  // Interpolate bbox
  const bboxX = lo.bboxX + (hi.bboxX - lo.bboxX) * t;
  const bboxW = lo.bboxW + (hi.bboxW - lo.bboxW) * t;

  return { path: snapKf.path, bboxX, bboxW };
}

/**
 * Compute clarity score (0-100) for a set of shapes at a given angle.
 * Clarity = percentage of shape pairs whose shadow bounding boxes do NOT overlap.
 */
function computeClarity(shapeIds: ShapeId[], angle: number): number {
  if (shapeIds.length < 2) return 100;

  const shadows = shapeIds.map((id, idx) => {
    const s = getShadowAtAngle(id, angle);
    // Distribute shapes vertically on the screen - compute horizontal spread
    // based on the slot position to simulate actual screen positions
    const slotH = STAGE_H / shapeIds.length;
    const centerY = STAGE_Y + slotH * idx + slotH / 2;
    return { ...s, centerY, shapeId: id };
  });

  let nonOverlapping = 0;
  let total = 0;

  for (let i = 0; i < shadows.length; i++) {
    for (let j = i + 1; j < shadows.length; j++) {
      total++;
      const a1 = shadows[i];
      const a2 = shadows[j];
      // Two shadows overlap if their widths are very similar (within 6px)
      // AND they are the same general shape silhouette
      const widthDiff = Math.abs(a1.bboxW - a2.bboxW);
      const xDiff = Math.abs(a1.bboxX - a2.bboxX);
      // Consider overlapping if both width and x-offset are similar
      if (widthDiff > 5 || xDiff > 3) {
        nonOverlapping++;
      }
    }
  }

  return Math.round((nonOverlapping / total) * 100);
}

// ---------------------------------------------------------------------------
// SVG Sub-components
// ---------------------------------------------------------------------------

/** Render a 3D-ish isometric shape on the stage */
function StageShape({
  shape,
  cx,
  cy,
  scale,
  angle,
}: {
  shape: ShapeConfig;
  cx: number;
  cy: number;
  scale: number;
  angle: number;
}) {
  // Rotate the shape slightly based on the light angle for visual feedback
  const rotation = angle * 0.3;

  switch (shape.id) {
    case "sphere":
      return (
        <g>
          <circle
            cx={cx}
            cy={cy}
            r={18 * scale}
            fill={shape.fill}
            stroke="#fff"
            strokeWidth={1}
            opacity={0.9}
          />
          {/* Highlight */}
          <circle
            cx={cx - 5 * scale}
            cy={cy - 5 * scale}
            r={5 * scale}
            fill="#fff"
            opacity={0.4}
          />
        </g>
      );
    case "cube": {
      const s = 16 * scale;
      const ox = Math.cos((rotation * Math.PI) / 180) * 4 * scale;
      const oy = Math.sin((rotation * Math.PI) / 180) * 2 * scale;
      return (
        <g>
          {/* Back face */}
          <rect
            x={cx - s + ox}
            y={cy - s + oy}
            width={s * 2}
            height={s * 2}
            fill={shape.fill}
            opacity={0.5}
            stroke="#fff"
            strokeWidth={0.5}
          />
          {/* Front face */}
          <rect
            x={cx - s}
            y={cy - s}
            width={s * 2}
            height={s * 2}
            fill={shape.fill}
            stroke="#fff"
            strokeWidth={1}
            opacity={0.9}
          />
          {/* Top face hint */}
          <polygon
            points={`${cx - s},${cy - s} ${cx - s + ox},${cy - s + oy} ${cx + s + ox},${cy - s + oy} ${cx + s},${cy - s}`}
            fill={shape.fill}
            opacity={0.7}
            stroke="#fff"
            strokeWidth={0.5}
          />
        </g>
      );
    }
    case "pyramid": {
      const base = 20 * scale;
      const h = 28 * scale;
      return (
        <g>
          {/* Base */}
          <line
            x1={cx - base}
            y1={cy + h * 0.4}
            x2={cx + base}
            y2={cy + h * 0.4}
            stroke={shape.fill}
            strokeWidth={2}
            opacity={0.5}
          />
          {/* Triangle face */}
          <polygon
            points={`${cx},${cy - h * 0.6} ${cx - base},${cy + h * 0.4} ${cx + base},${cy + h * 0.4}`}
            fill={shape.fill}
            stroke="#fff"
            strokeWidth={1}
            opacity={0.9}
          />
        </g>
      );
    }
    case "cylinder": {
      const rw = 14 * scale;
      const rh = 6 * scale;
      const h = 20 * scale;
      return (
        <g>
          {/* Body */}
          <rect
            x={cx - rw}
            y={cy - h}
            width={rw * 2}
            height={h * 2}
            fill={shape.fill}
            opacity={0.85}
          />
          {/* Bottom ellipse */}
          <ellipse
            cx={cx}
            cy={cy + h}
            rx={rw}
            ry={rh}
            fill={shape.fill}
            stroke="#fff"
            strokeWidth={0.5}
            opacity={0.7}
          />
          {/* Top ellipse */}
          <ellipse
            cx={cx}
            cy={cy - h}
            rx={rw}
            ry={rh}
            fill={shape.fill}
            stroke="#fff"
            strokeWidth={1}
            opacity={0.95}
          />
        </g>
      );
    }
    case "cone": {
      const base = 16 * scale;
      const h = 26 * scale;
      const rh = 5 * scale;
      return (
        <g>
          {/* Triangle body */}
          <polygon
            points={`${cx},${cy - h * 0.5} ${cx - base},${cy + h * 0.4} ${cx + base},${cy + h * 0.4}`}
            fill={shape.fill}
            stroke="#fff"
            strokeWidth={1}
            opacity={0.9}
          />
          {/* Base ellipse */}
          <ellipse
            cx={cx}
            cy={cy + h * 0.4}
            rx={base}
            ry={rh}
            fill={shape.fill}
            stroke="#fff"
            strokeWidth={0.5}
            opacity={0.7}
          />
        </g>
      );
    }
    default:
      return null;
  }
}

/** Render a shadow silhouette on the screen */
function ShadowSilhouette({
  shape,
  angle,
  cx,
  cy,
  highlight,
}: {
  shape: ShapeConfig;
  angle: number;
  cx: number;
  cy: number;
  highlight: boolean;
}) {
  const { path } = getShadowAtAngle(shape.id, angle);

  return (
    <g
      transform={`translate(${cx}, ${cy})`}
      className="transition-all duration-300"
    >
      <path
        d={path}
        fill={highlight ? shape.fill : shape.shadowFill}
        opacity={highlight ? 0.9 : 0.75}
        stroke={highlight ? shape.fill : "none"}
        strokeWidth={highlight ? 1.5 : 0}
        className="transition-all duration-300"
      />
    </g>
  );
}

/** Circular angle control — a ring with a draggable handle */
function AngleControl({
  angle,
  onAngleChange,
  cx,
  cy,
  radius,
}: {
  angle: number;
  onAngleChange: (angle: number) => void;
  cx: number;
  cy: number;
  radius: number;
}) {
  const dragging = useRef(false);
  const svgRef = useRef<SVGGElement>(null);

  const handleX = cx + radius * Math.cos(((angle - 90) * Math.PI) / 180);
  const handleY = cy + radius * Math.sin(((angle - 90) * Math.PI) / 180);

  const computeAngleFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current) return angle;
      const svg = svgRef.current.closest("svg");
      if (!svg) return angle;
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return angle;
      const svgPt = pt.matrixTransform(ctm.inverse());
      const dx = svgPt.x - cx;
      const dy = svgPt.y - cy;
      let a = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      return normAngle(a);
    },
    [cx, cy, angle],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as Element).setPointerCapture(e.pointerId);
      dragging.current = true;
      const newAngle = computeAngleFromPointer(e.clientX, e.clientY);
      onAngleChange(newAngle);
    },
    [computeAngleFromPointer, onAngleChange],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      e.preventDefault();
      const newAngle = computeAngleFromPointer(e.clientX, e.clientY);
      onAngleChange(newAngle);
    },
    [computeAngleFromPointer, onAngleChange],
  );

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  // Light icon position (at the angle on the ring)
  const lightX = cx + (radius + 16) * Math.cos(((angle - 90) * Math.PI) / 180);
  const lightY = cy + (radius + 16) * Math.sin(((angle - 90) * Math.PI) / 180);

  return (
    <g ref={svgRef}>
      {/* Track ring */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="#94a3b8"
        strokeWidth={3}
        strokeDasharray="4 3"
        opacity={0.5}
      />
      {/* Light icon */}
      <text
        x={lightX}
        y={lightY + 5}
        textAnchor="middle"
        fontSize="16"
        aria-hidden="true"
      >
        💡
      </text>
      {/* Draggable handle */}
      <circle
        cx={handleX}
        cy={handleY}
        r={14}
        fill="#fbbf24"
        stroke="#f59e0b"
        strokeWidth={2}
        className="cursor-grab active:cursor-grabbing"
        style={{ touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="slider"
        aria-label="Xoay đèn"
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round(angle)}
      />
      {/* Handle inner dot */}
      <circle
        cx={handleX}
        cy={handleY}
        r={5}
        fill="#f59e0b"
        pointerEvents="none"
      />
    </g>
  );
}

/** Clarity meter bar */
function ClarityMeter({
  clarity,
  x,
  y,
  width,
  height,
}: {
  clarity: number;
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  const barW = (clarity / 100) * width;
  let fillColor = "#ef4444"; // red
  if (clarity >= 70) fillColor = "#22c55e"; // green
  else if (clarity >= 40) fillColor = "#eab308"; // yellow

  return (
    <g>
      {/* Background */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={height / 2}
        fill="#e2e8f0"
        stroke="#cbd5e1"
        strokeWidth={1}
      />
      {/* Fill */}
      <rect
        x={x}
        y={y}
        width={Math.max(barW, height)}
        height={height}
        rx={height / 2}
        fill={fillColor}
        className="transition-all duration-300"
      />
      {/* Label */}
      <text
        x={x + width / 2}
        y={y + height / 2 + 4}
        textAnchor="middle"
        fontSize="10"
        fontWeight="bold"
        fill="#1e293b"
      >
        {clarity}%
      </text>
      {/* "Rõ nét" label */}
      <text
        x={x + width + 8}
        y={y + height / 2 + 4}
        fontSize="9"
        fill="#64748b"
      >
        Rõ nét
      </text>
    </g>
  );
}

/** Screen backdrop — the projection surface */
function Screen({
  x,
  y,
  width,
  height,
  label,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={6}
        fill="#1e293b"
        stroke="#334155"
        strokeWidth={1.5}
        opacity={0.95}
      />
      {label && (
        <text
          x={x + width / 2}
          y={y - 4}
          textAnchor="middle"
          fontSize="9"
          fill="#94a3b8"
          fontWeight="600"
        >
          {label}
        </text>
      )}
    </g>
  );
}

/** Stage area — where the 3D shapes sit */
function StageArea({
  x,
  y,
  width,
  height,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={6}
      fill="#fef3c7"
      stroke="#fde68a"
      strokeWidth={1.5}
      opacity={0.6}
    />
  );
}

/** Shape palette for phase 2 */
function ShapePalette({
  shapes,
  selected,
  onSelect,
  x,
  y,
}: {
  shapes: ShapeConfig[];
  selected: ShapeId | null;
  onSelect: (id: ShapeId) => void;
  x: number;
  y: number;
}) {
  const spacing = 44;
  const startX = x - ((shapes.length - 1) * spacing) / 2;
  return (
    <g>
      {shapes.map((shape, i) => {
        const sx = startX + i * spacing;
        const isSelected = selected === shape.id;
        return (
          <g
            key={shape.id}
            onClick={() => onSelect(shape.id)}
            className="cursor-pointer"
            role="button"
            aria-label={shape.nameVi}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(shape.id);
              }
            }}
          >
            <rect
              x={sx - 18}
              y={y - 18}
              width={36}
              height={36}
              rx={8}
              fill={isSelected ? shape.fill : "#f8fafc"}
              stroke={isSelected ? shape.fill : "#cbd5e1"}
              strokeWidth={isSelected ? 2.5 : 1.5}
              opacity={isSelected ? 0.3 : 0.8}
            />
            <StageShape
              shape={shape}
              cx={sx}
              cy={y}
              scale={0.6}
              angle={0}
            />
            <text
              x={sx}
              y={y + 28}
              textAnchor="middle"
              fontSize="7"
              fill="#64748b"
            >
              {shape.nameVi}
            </text>
          </g>
        );
      })}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ShadowTheater() {
  // -- Core state --
  const [phase, setPhase] = useState<Phase>(0);
  const [angle, setAngle] = useState(0);
  const [bubble, setBubble] = useState<string>(TEXT.phase0Hint);
  const [bubbleMood, setBubbleMood] = useState<BubbleMood>("curious");

  // -- Phase 0 tracking --
  const [visitedSectors, setVisitedSectors] = useState<Set<number>>(
    () => new Set(),
  );

  // -- Phase 1 state --
  const [peakFound, setPeakFound] = useState(false);
  const [showDualScreen, setShowDualScreen] = useState(false);

  // -- Phase 2 state --
  const [selectedShape, setSelectedShape] = useState<ShapeId | null>(null);
  const [creatorAngle, setCreatorAngle] = useState<number | null>(null);
  const [friendGuessing, setFriendGuessing] = useState(false);
  const [friendGuess, setFriendGuess] = useState<ShapeId | null>(null);
  const [trickSuccess, setTrickSuccess] = useState<boolean | null>(null);

  // -- Pearl --
  const [showPearl, setShowPearl] = useState(false);

  // -- Timers --
  const friendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (friendTimerRef.current) clearTimeout(friendTimerRef.current);
    };
  }, []);

  // -- Derived: which shapes are active --
  const activeShapes = useMemo<ShapeConfig[]>(() => {
    if (phase === 0) return PHASE0_SHAPES;
    return ALL_SHAPES;
  }, [phase]);

  const activeShapeIds = useMemo<ShapeId[]>(
    () => activeShapes.map((s) => s.id),
    [activeShapes],
  );

  // -- Clarity --
  const clarity = useMemo(
    () => computeClarity(activeShapeIds, angle),
    [activeShapeIds, angle],
  );

  // -- Angle change handler with sector tracking --
  const handleAngleChange = useCallback(
    (newAngle: number) => {
      setAngle(newAngle);
      const sector = getSector(newAngle);

      if (phase === 0) {
        setVisitedSectors((prev) => {
          const next = new Set(prev);
          next.add(sector);
          if (next.size >= SECTORS_NEEDED && prev.size < SECTORS_NEEDED) {
            // Transition to phase 1
            setTimeout(() => {
              setPhase(1);
              setBubble(TEXT.phase1Prompt);
              setBubbleMood("curious");
            }, 400);
          }
          return next;
        });
      }

      if (phase === 1 && !peakFound) {
        const c = computeClarity(ALL_SHAPES.map((s) => s.id), newAngle);
        if (c > 80) {
          setPeakFound(true);
          setBubble(TEXT.phase1Found);
          setBubbleMood("celebrate");
          // Show dual screen after a delay
          setTimeout(() => {
            setShowDualScreen(true);
            setBubble(TEXT.phase1DualScreen);
            setBubbleMood("curious");
            // Transition to phase 2 after seeing dual screen
            setTimeout(() => {
              setPhase(2);
              setBubble(TEXT.phase2Prompt);
              setBubbleMood("happy");
            }, 3500);
          }, 2000);
        }
      }
    },
    [phase, peakFound],
  );

  // -- Phase 2: select shape --
  const handleSelectShape = useCallback((id: ShapeId) => {
    setSelectedShape(id);
  }, []);

  // -- Phase 2: confirm hidden shape and angle → friend guesses --
  const handleHideShape = useCallback(() => {
    if (!selectedShape) return;
    setCreatorAngle(angle);
    setFriendGuessing(true);
    setBubble(TEXT.phase2FriendGuessing);
    setBubbleMood("curious");

    // Friend "analyzes" the shadow and guesses after a delay
    friendTimerRef.current = setTimeout(() => {
      // Friend picks the shape whose shadow is most similar at this angle
      const hiddenShadow = getShadowAtAngle(selectedShape, angle);
      let closestShape: ShapeId = "sphere";
      let closestDist = Infinity;

      for (const shape of ALL_SHAPES) {
        if (shape.id === selectedShape) continue;
        const otherShadow = getShadowAtAngle(shape.id, angle);
        const dist =
          Math.abs(hiddenShadow.bboxW - otherShadow.bboxW) +
          Math.abs(hiddenShadow.bboxX - otherShadow.bboxX);
        if (dist < closestDist) {
          closestDist = dist;
          closestShape = shape.id;
        }
      }

      // If shadows are very similar, friend guesses the wrong one (tricked!)
      // If shadows are different enough, friend guesses correctly
      const tricked = closestDist < 4;
      const guess = tricked ? closestShape : selectedShape;

      setFriendGuess(guess);
      setFriendGuessing(false);
      setTrickSuccess(tricked);

      const guessName =
        ALL_SHAPES.find((s) => s.id === guess)?.nameVi ?? guess;
      if (tricked) {
        setBubble(`Bạn ấy đoán ${guessName} — nhầm rồi! Giỏi quá!`);
        setBubbleMood("celebrate");
      } else {
        setBubble(`Bạn ấy đoán đúng — ${guessName}!`);
        setBubbleMood("happy");
      }

      // Show pearl after guess
      friendTimerRef.current = setTimeout(() => {
        setShowPearl(true);
      }, 2000);
    }, 2500);
  }, [selectedShape, angle]);

  // -- Layout helpers --
  const shapeSlots = useMemo(() => {
    const count = activeShapes.length;
    const slotH = STAGE_H / count;
    return activeShapes.map((shape, i) => ({
      shape,
      cx: STAGE_X + STAGE_W / 2,
      cy: STAGE_Y + slotH * i + slotH / 2,
      screenCx: SCREEN_X + SCREEN_W / 2,
      screenCy: STAGE_Y + slotH * i + slotH / 2,
    }));
  }, [activeShapes]);

  // -- Dual screen angle --
  const dualAngle = normAngle(angle + 90);

  // -- Render --
  return (
    <div className="flex flex-col items-center gap-3 pb-8">
      {/* Mascot bubble */}
      <div className="w-full max-w-md px-2">
        <MascotBubble text={bubble} mood={bubbleMood} />
      </div>

      {/* Main SVG scene */}
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        width={SVG_W}
        height={SVG_H}
        className="max-w-full rounded-2xl border border-border bg-slate-50/50 dark:bg-slate-950/20"
        role="img"
        aria-label="Rạp chiếu bóng"
      >
        {/* Stage area */}
        <StageArea
          x={STAGE_X}
          y={STAGE_Y}
          width={STAGE_W}
          height={STAGE_H}
        />
        <text
          x={STAGE_X + STAGE_W / 2}
          y={STAGE_Y - 4}
          textAnchor="middle"
          fontSize="10"
          fill="#92400e"
          fontWeight="600"
        >
          Sân khấu
        </text>

        {/* Screen 1 */}
        <Screen
          x={SCREEN_X}
          y={STAGE_Y}
          width={showDualScreen ? SCREEN_W - 50 : SCREEN_W}
          height={STAGE_H}
          label="Màn hình"
        />

        {/* Screen 2 (dual, phase 1+) */}
        {showDualScreen && (
          <Screen
            x={SCREEN2_X}
            y={STAGE_Y}
            width={SCREEN2_W}
            height={STAGE_H}
            label="Góc 2"
          />
        )}

        {/* 3D shapes on stage */}
        {shapeSlots.map(({ shape, cx, cy }) => (
          <StageShape
            key={shape.id}
            shape={shape}
            cx={cx}
            cy={cy}
            scale={phase === 0 ? 0.85 : 0.7}
            angle={angle}
          />
        ))}

        {/* Shape labels on stage */}
        {shapeSlots.map(({ shape, cx, cy }) => (
          <text
            key={`label-${shape.id}`}
            x={cx}
            y={cy + (phase === 0 ? 26 : 22)}
            textAnchor="middle"
            fontSize="8"
            fill="#78716c"
          >
            {shape.nameVi}
          </text>
        ))}

        {/* Shadow silhouettes on screen 1 */}
        {shapeSlots.map(({ shape, screenCx, screenCy }) => (
          <ShadowSilhouette
            key={`shadow-${shape.id}`}
            shape={shape}
            angle={angle}
            cx={showDualScreen ? screenCx - 25 : screenCx}
            cy={screenCy}
            highlight={phase === 1 && peakFound && clarity > 80}
          />
        ))}

        {/* Shadow silhouettes on screen 2 (dual) */}
        {showDualScreen &&
          shapeSlots.map(({ shape, screenCy }) => (
            <ShadowSilhouette
              key={`shadow2-${shape.id}`}
              shape={shape}
              angle={dualAngle}
              cx={SCREEN2_X + SCREEN2_W / 2}
              cy={screenCy}
              highlight={false}
            />
          ))}

        {/* Phase 2: Hidden shape shadow on screen */}
        {phase === 2 && selectedShape && creatorAngle !== null && (
          <g>
            <ShadowSilhouette
              shape={
                ALL_SHAPES.find((s) => s.id === selectedShape) ?? ALL_SHAPES[0]
              }
              angle={creatorAngle}
              cx={SCREEN_X + SCREEN_W / 2}
              cy={STAGE_Y + STAGE_H / 2}
              highlight={false}
            />
            {/* Question mark over the shadow while friend guesses */}
            {friendGuessing && (
              <text
                x={SCREEN_X + SCREEN_W / 2}
                y={STAGE_Y + STAGE_H / 2 + 40}
                textAnchor="middle"
                fontSize="20"
                fill="#fbbf24"
                className="animate-pulse"
              >
                ?
              </text>
            )}
            {/* Friend's guess result */}
            {friendGuess && (
              <g>
                <text
                  x={SCREEN_X + SCREEN_W / 2}
                  y={STAGE_Y + STAGE_H - 20}
                  textAnchor="middle"
                  fontSize="10"
                  fill={trickSuccess ? "#22c55e" : "#fbbf24"}
                  fontWeight="bold"
                >
                  {trickSuccess ? "Nhầm rồi!" : "Đoán đúng!"}
                </text>
              </g>
            )}
          </g>
        )}

        {/* Clarity meter (phase 1+, before phase 2 creator mode) */}
        {phase === 1 && (
          <ClarityMeter
            clarity={clarity}
            x={STAGE_X + 10}
            y={STAGE_Y + STAGE_H + 50}
            width={160}
            height={14}
          />
        )}

        {/* Angle control */}
        {(phase === 0 || (phase === 1 && !peakFound) || (phase === 2 && creatorAngle === null)) && (
          <AngleControl
            angle={angle}
            onAngleChange={handleAngleChange}
            cx={SVG_W / 2}
            cy={STAGE_Y + STAGE_H + 55}
            radius={32}
          />
        )}

        {/* Phase 0: sector counter */}
        {phase === 0 && (
          <text
            x={SVG_W / 2}
            y={STAGE_Y + STAGE_H + 100}
            textAnchor="middle"
            fontSize="10"
            fill="#64748b"
          >
            Đã khám phá: {visitedSectors.size}/{SECTORS_NEEDED} góc
          </text>
        )}

        {/* Phase 2: shape palette */}
        {phase === 2 && creatorAngle === null && (
          <ShapePalette
            shapes={ALL_SHAPES}
            selected={selectedShape}
            onSelect={handleSelectShape}
            x={SVG_W / 2}
            y={STAGE_Y + STAGE_H + 50}
          />
        )}
      </svg>

      {/* Phase 2: Hide button (below SVG) */}
      {phase === 2 && selectedShape && creatorAngle === null && (
        <button
          type="button"
          onClick={handleHideShape}
          className="rounded-full bg-amber-400 px-8 py-3 text-base font-bold text-amber-900 hover:bg-amber-300 active:scale-95 transition-all"
          style={{ minWidth: 120, minHeight: 44 }}
        >
          Giấu hình!
        </button>
      )}

      {/* Phase 2: trick success celebration */}
      {trickSuccess === true && !showPearl && (
        <p className="text-center text-sm font-bold text-green-600 animate-bounce">
          Bạn đã lừa được bạn mình bằng bóng!
        </p>
      )}

      {/* Pearl reveal */}
      {showPearl && (
        <PearlReveal
          topicSlug="nhi-shadow-theater"
          onClose={() => setShowPearl(false)}
        />
      )}
    </div>
  );
}
