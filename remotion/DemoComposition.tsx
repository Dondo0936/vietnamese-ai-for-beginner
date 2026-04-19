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
import { LessonScene } from "./scenes/LessonScene";
import { QuizScene } from "./scenes/QuizScene";
import { OutroScene } from "./scenes/OutroScene";

export const DemoComposition = () => {
  return (
    <AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={130}>
          <HeroScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={springTiming({
            durationInFrames: 22,
            config: { damping: 200 },
          })}
          presentation={fade()}
        />

        <TransitionSeries.Sequence durationInFrames={130}>
          <PathsScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: 22 })}
          presentation={slide({ direction: "from-right" })}
        />

        <TransitionSeries.Sequence durationInFrames={160}>
          <LessonScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: 22 })}
          presentation={slide({ direction: "from-right" })}
        />

        <TransitionSeries.Sequence durationInFrames={130}>
          <QuizScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={springTiming({
            durationInFrames: 24,
            config: { damping: 200 },
          })}
          presentation={fade()}
        />

        <TransitionSeries.Sequence durationInFrames={100}>
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
