import { AbsoluteFill } from "remotion";
import {
  linearTiming,
  springTiming,
  TransitionSeries,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";

import { HeroScene } from "./scenes/HeroScene";
import { PathsScene } from "./scenes/PathsScene";
import { PathDetailScene } from "./scenes/PathDetailScene";
import { LessonScene } from "./scenes/LessonScene";
import { QuizScene } from "./scenes/QuizScene";
import { OutroScene } from "./scenes/OutroScene";

/**
 * Six-scene journey mirroring what a new visitor actually does:
 *   1. Hero          — home, see the pitch
 *   2. Paths         — scroll down, pick "Học sinh · Sinh viên"
 *   3. PathDetail    — click the first lesson
 *   4. Lesson        — drag the k slider, see the boundary smooth
 *   5. Quiz          — miss, retry, get it right
 *   6. Outro         — brand + udemi.tech
 *
 * Durations (frames @30fps):
 *   hero   160   paths 150   detail 170   lesson 240   quiz 210   outro 130
 *                    ───── TransitionSeries overlaps transitions with both
 * adjacent sequences, so total is sum(seq) − sum(trans):
 *     (160 + 150 + 170 + 240 + 210 + 130) − 5 × 22 = 1060 − 110 = 950 ≈ 31.6s
 */

const TRANS = 22;
const springFast = springTiming({
  durationInFrames: TRANS,
  config: { damping: 200, overshootClamping: true },
});
const linearFast = linearTiming({ durationInFrames: TRANS });

export const DemoComposition = () => {
  return (
    <AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={160}>
          <HeroScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition timing={springFast} presentation={fade()} />

        <TransitionSeries.Sequence durationInFrames={150}>
          <PathsScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={linearFast}
          presentation={slide({ direction: "from-right" })}
        />

        <TransitionSeries.Sequence durationInFrames={170}>
          <PathDetailScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={linearFast}
          presentation={slide({ direction: "from-right" })}
        />

        <TransitionSeries.Sequence durationInFrames={240}>
          <LessonScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition timing={springFast} presentation={fade()} />

        <TransitionSeries.Sequence durationInFrames={210}>
          <QuizScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition timing={springFast} presentation={fade()} />

        <TransitionSeries.Sequence durationInFrames={130}>
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
