import { ReactNode } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface AnimatedInProps {
  children: ReactNode;
  delay?: number;
  offsetY?: number;
  damping?: number;
}

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
    config: { damping, stiffness: 120, mass: 0.6 },
  });

  const opacity = interpolate(progress, [0, 1], [0, 1], {
    extrapolateRight: "clamp",
  });
  const y = interpolate(progress, [0, 1], [offsetY, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ opacity, transform: `translateY(${y}px)` }}>{children}</div>
  );
};
