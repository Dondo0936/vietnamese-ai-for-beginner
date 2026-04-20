export const COLORS = {
  paper: "#FBFAF7",
  paper2: "#F3F2EE",
  paper3: "#E9E7E1",
  line: "#D9D7D0",
  ash: "#8A8780",
  graphite: "#4A4842",
  ink: "#1A1A1A",
  offblack: "#0B0B0B",
  white: "#FFFFFF",
  turquoise50: "#E6F8F7",
  turquoise100: "#C2EFEC",
  turquoise300: "#6FD6D0",
  turquoise500: "#20B8B0",
  turquoise600: "#178F89",
  turquoise700: "#0E5F5B",
  turquoiseInk: "#13343B",
  peach200: "#F4D9C5",
  peach500: "#E08B54",
  clay: "#B3533A",
  success: "#3DD68C",
  warning: "#F5B547",
  danger: "#F25C54",
  heat500: "#F05A00",
};

export const SCENE_FRAMES = {
  hero: { from: 0, duration: 130 },
  paths: { from: 120, duration: 130 },
  lesson: { from: 240, duration: 160 },
  quiz: { from: 390, duration: 130 },
  outro: { from: 510, duration: 90 },
};

export const TOTAL_FRAMES = 600;
export const FPS = 30;
export const WIDTH = 1280;
export const HEIGHT = 720;

/**
 * Anti-shimmer text style for Vietnamese headlines.
 *
 * Chromium's default shaper recalculates kerning/ligatures each frame
 * when a text element lives inside an animated transform. For glyphs
 * built from combining marks (ư, ờ, ớ, ế, ệ, ...) the sub-pixel drift
 * turns into a visible shiver. Disabling kerning + ligature passes
 * plus forcing geometric-precision rendering pins the glyph metrics
 * frame-over-frame. Spread this at the END of any <h1>/<h2>/<h3>/<h4>
 * style so it overrides any earlier `font-feature-settings`.
 */
export const VN_TEXT_RENDER = {
  textRendering: "geometricPrecision" as const,
  fontKerning: "none" as const,
  fontFeatureSettings: '"kern" off, "liga" off, "calt" off, "clig" off',
  WebkitFontSmoothing: "antialiased" as const,
  MozOsxFontSmoothing: "grayscale" as const,
};
