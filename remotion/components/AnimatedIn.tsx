import { ReactNode } from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";

interface AnimatedInProps {
  children: ReactNode;
  delay?: number;
  offsetY?: number;
  /** How many frames the reveal takes. Default 18. */
  duration?: number;
}

/**
 * Deterministic reveal — by design cannot shimmer.
 *
 * We use `interpolate` with an expo-out bezier curve (`0.16, 1, 0.3, 1`) and
 * clamp the extrapolation. After frame `delay + duration` the progress is
 * EXACTLY 1.0 forever — unlike a spring, which can keep micro-oscillating
 * around 1.0 and re-render the element each frame. The translate is also
 * `Math.round`-ed to an integer pixel so there is no subpixel flicker.
 *
 * `perspective(100px)` + `willChange: transform` still force a GPU layer so
 * the text rasterizes once and composites cleanly (Remotion's official
 * subpixel-rendering fix).
 */
export const AnimatedIn = ({
  children,
  delay = 0,
  offsetY = 24,
  duration = 18,
}: AnimatedInProps) => {
  const frame = useCurrentFrame();

  const progress = interpolate(frame - delay, [0, duration], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const opacity = progress;
  const y = Math.round((1 - progress) * offsetY);

  return (
    <div
      style={{
        opacity,
        transform: `perspective(100px) translateY(${y}px)`,
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
};
