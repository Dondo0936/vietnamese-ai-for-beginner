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
 * Frosted glass panel. Sits atop the LiquidBackground — the backdrop-filter
 * blur picks up the drifting turquoise blobs while the thin hairline border
 * keeps it readable. Matches the app's elevated card treatment (--bg-card on
 * --border + --shadow-sm) but with a more translucent feel.
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
          background: "rgba(32, 184, 176, 0.12)",
          border: `1px solid rgba(32, 184, 176, 0.35)`,
        }
      : {
          background: "rgba(255, 255, 255, 0.72)",
          border: `1px solid ${COLORS.line}`,
        };

  return (
    <div
      style={{
        ...base,
        borderRadius: radius,
        padding,
        backdropFilter: "blur(24px) saturate(140%)",
        WebkitBackdropFilter: "blur(24px) saturate(140%)",
        boxShadow:
          "0 20px 60px rgba(10, 10, 11, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.5) inset",
        ...style,
      }}
    >
      {children}
    </div>
  );
};
