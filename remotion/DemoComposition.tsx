import { AbsoluteFill } from "remotion";
import {
  linearTiming,
  springTiming,
  TransitionSeries,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";

import { HeroScene } from "./scenes/HeroScene";
import { SearchScene } from "./scenes/SearchScene";
import { MarqueeScene } from "./scenes/MarqueeScene";
import { PathsScene } from "./scenes/PathsScene";
import { FeaturedScene } from "./scenes/FeaturedScene";
import { ProcessScene } from "./scenes/ProcessScene";
import { QuotesScene } from "./scenes/QuotesScene";
import { BigCTAScene } from "./scenes/BigCTAScene";

/**
 * Eight-scene landing walkthrough — one scene per landing section.
 *
 *   1. Hero         — editorial headline + attention demo card
 *   2. Search       — "Hỏi bất cứ gì về AI" + typeahead pop
 *   3. Marquee      — black tagline strip scrolling
 *   4. Paths        — 4 profession cards
 *   5. Featured     — 6 bespoke topic tiles with SVGs
 *   6. Process      — 8-step grid
 *   7. Quotes       — 4 testimonial cards
 *   8. BigCTA       — black closing "Thôi nào / học thử đi."
 *
 * Durations (frames @30fps):
 *   hero 150 · search 180 · marquee 100 · paths 150 · featured 160
 *   process 130 · quotes 130 · bigcta 130  =  1130
 *
 * TransitionSeries overlaps each transition with both adjacent sequences,
 * so total = sum(seq) − sum(trans) = 1130 − 7 × 20 = 1130 − 140 = 990 frames
 * at 30fps ≈ 33 seconds.
 */

const TRANS = 20;
const springFast = springTiming({
  durationInFrames: TRANS,
  config: { damping: 200, overshootClamping: true },
});
const linearFast = linearTiming({ durationInFrames: TRANS });

export const DemoComposition = () => {
  return (
    <AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={150}>
          <HeroScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition timing={springFast} presentation={fade()} />

        <TransitionSeries.Sequence durationInFrames={180}>
          <SearchScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={linearFast}
          presentation={slide({ direction: "from-right" })}
        />

        <TransitionSeries.Sequence durationInFrames={100}>
          <MarqueeScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={linearFast}
          presentation={slide({ direction: "from-right" })}
        />

        <TransitionSeries.Sequence durationInFrames={150}>
          <PathsScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition timing={springFast} presentation={fade()} />

        <TransitionSeries.Sequence durationInFrames={160}>
          <FeaturedScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition timing={springFast} presentation={fade()} />

        <TransitionSeries.Sequence durationInFrames={130}>
          <ProcessScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition timing={springFast} presentation={fade()} />

        <TransitionSeries.Sequence durationInFrames={130}>
          <QuotesScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition timing={springFast} presentation={fade()} />

        <TransitionSeries.Sequence durationInFrames={130}>
          <BigCTAScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
