import { cancelRender, continueRender, delayRender } from "remotion";
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

// Be Vietnam Pro is Google's Vietnamese-first display face. Space Grotesk's
// Chromium shaping of combined marks (ư = u + horn, ờ = o + horn + grave)
// drifted sub-pixel between frames; Be Vietnam Pro ships every Vietnamese
// composite as a precomposed glyph so there's no per-frame re-positioning.
// We also need italic 400/500 because the big landing H2 uses <em>.
const beVietnamPro = loadBeVietnamPro("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin", "latin-ext", "vietnamese"],
});
const beVietnamProItalic = loadBeVietnamPro("italic", {
  weights: ["400", "500"],
  subsets: ["latin", "latin-ext", "vietnamese"],
});

export const FONT_DISPLAY = spaceGrotesk.fontFamily;
export const FONT_SANS = interTight.fontFamily;
export const FONT_SERIF = fraunces.fontFamily;
export const FONT_MONO = jetbrainsMono.fontFamily;
export const FONT_VN_DISPLAY = beVietnamPro.fontFamily;

// Block the renderer until every font has finished loading. Without this,
// `remotion render` may paint the first handful of frames with the
// Chromium fallback serif before Be Vietnam Pro arrives — exactly the
// "shimmer" the Vietnamese combined marks exhibited in prior renders.
// Documented pattern: https://remotion.dev/docs/layout-utils/best-practices
const delay = delayRender("Loading fonts");
Promise.all([
  spaceGrotesk.waitUntilDone(),
  interTight.waitUntilDone(),
  fraunces.waitUntilDone(),
  jetbrainsMono.waitUntilDone(),
  beVietnamPro.waitUntilDone(),
  beVietnamProItalic.waitUntilDone(),
])
  .then(() => continueRender(delay))
  .catch((err) => cancelRender(err));
