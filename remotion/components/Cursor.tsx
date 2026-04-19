import { interpolate, useCurrentFrame } from "remotion";

export interface CursorKeyframe {
  /** Frame at which the cursor should be AT this position. */
  at: number;
  x: number;
  y: number;
  /** Optional click burst at this keyframe. */
  click?: boolean;
}

interface CursorProps {
  keyframes: CursorKeyframe[];
  /** Frames before first keyframe during which the cursor is hidden. */
  hideBefore?: number;
  /** Frames after last keyframe during which the cursor is hidden. */
  hideAfter?: number;
}

/**
 * A smooth, deterministic cursor that moves through a list of keyframes.
 *
 * Between two keyframes the position is a clamped, ease-in-out interpolation
 * on both axes. A click burst is a short-lived ring that expands + fades
 * starting at any keyframe flagged `click: true`.
 *
 * Deterministic: given a `frame`, the cursor's (x, y, opacity, click ring
 * state) are pure functions — no state, no rAF — so every render pass of
 * the same frame produces byte-identical output.
 */
export const Cursor = ({ keyframes, hideBefore = 0, hideAfter = Infinity }: CursorProps) => {
  const frame = useCurrentFrame();
  if (keyframes.length === 0) return null;

  const first = keyframes[0];
  const last = keyframes[keyframes.length - 1];

  if (frame < first.at - hideBefore) return null;
  if (frame > last.at + hideAfter) return null;

  // Find the two keyframes we're between.
  let prev = first;
  let next = keyframes[Math.min(1, keyframes.length - 1)];
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (frame >= keyframes[i].at && frame <= keyframes[i + 1].at) {
      prev = keyframes[i];
      next = keyframes[i + 1];
      break;
    }
    if (frame >= keyframes[keyframes.length - 1].at) {
      prev = keyframes[keyframes.length - 1];
      next = keyframes[keyframes.length - 1];
    }
  }

  const x =
    prev === next
      ? prev.x
      : interpolate(frame, [prev.at, next.at], [prev.x, next.x], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
  const y =
    prev === next
      ? prev.y
      : interpolate(frame, [prev.at, next.at], [prev.y, next.y], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  // Opacity: fade in over first 6 frames from first.at - hideBefore.
  const entry = first.at - hideBefore;
  const opacity = interpolate(frame, [entry, entry + 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Find any click keyframe whose age is 0..16 frames.
  const clickFrame = keyframes
    .filter((k) => k.click)
    .map((k) => ({ k, age: frame - k.at }))
    .filter((e) => e.age >= 0 && e.age <= 16)
    .sort((a, b) => a.age - b.age)[0];

  return (
    <>
      {/* Click burst ring */}
      {clickFrame && (
        <div
          style={{
            position: "absolute",
            left: clickFrame.k.x,
            top: clickFrame.k.y,
            width: 0,
            height: 0,
            pointerEvents: "none",
            transform: "translate(-50%, -50%)",
          }}
        >
          <div
            style={{
              width: 12 + clickFrame.age * 4,
              height: 12 + clickFrame.age * 4,
              borderRadius: "50%",
              border: "2px solid rgba(32, 184, 176, 0.9)",
              opacity: 1 - clickFrame.age / 16,
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>
      )}

      {/* Cursor SVG (macOS-ish) */}
      <svg
        width={26}
        height={30}
        viewBox="0 0 26 30"
        style={{
          position: "absolute",
          left: Math.round(x),
          top: Math.round(y),
          opacity,
          pointerEvents: "none",
          filter: "drop-shadow(0 4px 10px rgba(10,10,11,0.35))",
          transform: "translate(-2px, -2px)",
          willChange: "transform, left, top",
        }}
      >
        <path
          d="M3 2 L3 22 L9 16 L13 24 L16 22 L12 14 L20 14 Z"
          fill="#1A1A1A"
          stroke="#FFFFFF"
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
      </svg>
    </>
  );
};
