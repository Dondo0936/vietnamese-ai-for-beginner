import { AbsoluteFill, Img, staticFile } from "remotion";
import { FONT_VN_DISPLAY } from "./fonts";

// Dual-logo episode thumbnail/cover for the "AI tool × traditional tool"
// series: bold title over the tool's brand color, the two unmodified product
// marks (public/brand/, see SOURCES.md) on white chips. Rendered as a Still
// for the YouTube thumbnailUrl AND reusable as the cover-scene art of both
// video cuts so thumbnail and video never drift.
export type ThumbnailDualLogoProps = {
  line1: string;
  line2: string;
  aiLogoSrc: string; // under public/, e.g. "brand/claude-symbol.svg"
  toolLogoSrc: string; // e.g. "brand/excel-icon.svg"
  bgColor: string; // tool brand color, e.g. Excel green #107C41
  bgColorDark: string; // darker stop of the same hue for the gradient
  tag?: string;
};

const CHIP: React.CSSProperties = {
  width: 210,
  height: 210,
  borderRadius: 32,
  background: "#ffffff",
  boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export const ThumbnailDualLogo: React.FC<ThumbnailDualLogoProps> = ({
  line1,
  line2,
  aiLogoSrc,
  toolLogoSrc,
  bgColor,
  bgColorDark,
  tag = "udemi.tech",
}) => {
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${bgColor} 0%, ${bgColorDark} 100%)`,
        fontFamily: FONT_VN_DISPLAY,
        alignItems: "center",
        justifyContent: "flex-start",
      }}
    >
      <div
        style={{
          marginTop: 88,
          textAlign: "center",
          color: "#ffffff",
          textShadow: "0 4px 24px rgba(0,0,0,0.35)",
          lineHeight: 1.08,
        }}
      >
        <div style={{ fontSize: 116, fontWeight: 700, letterSpacing: -2 }}>{line1}</div>
        <div style={{ fontSize: 116, fontWeight: 700, letterSpacing: -2 }}>{line2}</div>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 96,
          display: "flex",
          alignItems: "center",
          gap: 56,
        }}
      >
        <div style={CHIP}>
          <Img src={staticFile(aiLogoSrc)} style={{ width: 140, height: 140, objectFit: "contain" }} />
        </div>
        <div
          style={{
            color: "#ffffff",
            fontSize: 88,
            fontWeight: 700,
            textShadow: "0 4px 24px rgba(0,0,0,0.35)",
          }}
        >
          ×
        </div>
        <div style={CHIP}>
          <Img src={staticFile(toolLogoSrc)} style={{ width: 140, height: 140, objectFit: "contain" }} />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: 40,
          bottom: 28,
          color: "rgba(255,255,255,0.92)",
          fontSize: 30,
          fontWeight: 600,
        }}
      >
        {tag}
      </div>
    </AbsoluteFill>
  );
};
