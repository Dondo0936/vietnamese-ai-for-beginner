import { ReactNode } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface AnimatedInProps {
  children: ReactNode;
  delay?: number;
  offsetY?: number;
  damping?: number;
}

/**
 * Spring reveal with subpixel-stable transforms.
 *
 * Two fixes prevent the "shimmering heading" issue:
 *
 * 1. `overshootClamping: true` stops the spring from oscillating past 1.0 —
 *    without it the spring settles with tiny ±0.001 residuals that the CSS
 *    translate picks up as a visible jitter.
 * 2. `perspective(100px)` + `willChange: 'transform'` push the element onto a
 *    GPU layer so the browser composites instead of re-rasterising each
 *    frame — Remotion's official fix for subpixel rendering flicker.
 */
export const AnimatedIn = ({
  children,
  delay = 0,
  offsetY = 24,
  damping = 200,
}: AnimatedInProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping, stiffness: 120, mass: 0.6, overshootClamping: true },
  });

  const opacity = interpolate(progress, [0, 1], [0, 1], {
    extrapolateRight: "clamp",
  });
  const y = interpolate(progress, [0, 1], [offsetY, 0], {
    extrapolateRight: "clamp",
  });

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
