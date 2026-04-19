import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadInterTight } from "@remotion/google-fonts/InterTight";
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";

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

export const FONT_DISPLAY = spaceGrotesk.fontFamily;
export const FONT_SANS = interTight.fontFamily;
export const FONT_SERIF = fraunces.fontFamily;
export const FONT_MONO = jetbrainsMono.fontFamily;
