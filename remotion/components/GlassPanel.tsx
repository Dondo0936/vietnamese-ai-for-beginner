import { CSSProperties, ReactNode } from "react";
import { COLORS } from "../tokens";

interface GlassPanelProps {
  children: ReactNode;
  style?: CSSProperties;
  radius?: number;
  padding?: number | string;
  tone?: "light" | "accent";
}

/**
 * Frosted-glass panel.
 *
 * Earlier versions used `backdrop-filter: blur(24px)` so the drifting
 * LiquidBackground blobs peeked through the panel. Problem: during video
 * render Chromium re-samples the backdrop every frame, which shifts the
 * blur result by sub-pixels — making anything layered on top (especially
 * text) appear to shimmer. The fix is to drop backdrop-filter entirely for
 * the video and rely on a near-opaque paper tint + ring + drop shadow to
 * sell the liquid-glass aesthetic. The blob halo is still visible around
 * the panel edges, just not *through* the panel.
 *
 * The `isolation: isolate` + `transform: translateZ(0)` combo keeps the
 * panel on its own GPU layer so its children rasterize once and composite
 * cleanly across frames.
 */
export const GlassPanel = ({
  children,
  style,
  radius = 20,
  padding = 32,
  tone = "light",
}: GlassPanelProps) => {
  const base: CSSProperties =
    tone === "accent"
      ? {
          background: "rgba(32, 184, 176, 0.14)",
          border: `1px solid rgba(32, 184, 176, 0.45)`,
        }
      : {
          // 0.96 opacity — high enough that the moving blobs don't leak into
          // the text bed, low enough that the paper tone still reads as glass.
          background: "rgba(255, 255, 255, 0.96)",
          border: `1px solid ${COLORS.line}`,
        };

  return (
    <div
      style={{
        ...base,
        borderRadius: radius,
        padding,
        isolation: "isolate",
        transform: "translateZ(0)",
        willChange: "transform",
        boxShadow:
          "0 20px 60px rgba(10, 10, 11, 0.10), 0 0 0 1px rgba(255, 255, 255, 0.6) inset",
        ...style,
      }}
    >
      {children}
    </div>
  );
};
