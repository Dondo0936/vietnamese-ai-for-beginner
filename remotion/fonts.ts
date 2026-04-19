import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadInterTight } from "@remotion/google-fonts/InterTight";
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadBeVietnamPro } from "@remotion/google-fonts/BeVietnamPro";

const spaceGrotesk = loadSpaceGrotesk("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin", "latin-ext", "vietnamese"],
});

const interTight = loadInterTight("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin", "latin-ext", "vietnamese"],
});

const fraunces = loadFraunces("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin", "latin-ext", "vietnamese"],
});

const jetbrainsMono = loadJetBrainsMono("normal", {
  weights: ["400", "500"],
  subsets: ["latin", "latin-ext"],
});

// Be Vietnam Pro is Google's Vietnamese-first display face. Chromium's
// shaping of combined marks (ư = u + horn, ờ = o + horn + grave) in
// Space Grotesk produced sub-pixel drift between frames that the GIF
// palette amplified into a visible "shimmer" on the words "người" and
// "đường". Be Vietnam Pro ships every Vietnamese composite as a
// precomposed glyph — no per-frame mark-positioning, no shimmer.
const beVietnamPro = loadBeVietnamPro("normal", {
  weights: ["500", "600", "700"],
  subsets: ["latin", "latin-ext", "vietnamese"],
});

export const FONT_DISPLAY = spaceGrotesk.fontFamily;
export const FONT_SANS = interTight.fontFamily;
export const FONT_SERIF = fraunces.fontFamily;
export const FONT_MONO = jetbrainsMono.fontFamily;
export const FONT_VN_DISPLAY = beVietnamPro.fontFamily;
