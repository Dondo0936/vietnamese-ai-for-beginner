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
import { SearchScene } from "./scenes/SearchScene";
import { DragDropScene } from "./scenes/DragDropScene";
import { QuizScene } from "./scenes/QuizScene";
import { CommunityScene } from "./scenes/CommunityScene";
import { OutroScene } from "./scenes/OutroScene";

const SEQ = 130;
const TRANS = 22;

export const DemoComposition = () => {
  return (
    <AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SEQ}>
          <HeroScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={springTiming({
            durationInFrames: TRANS,
            config: { damping: 200, overshootClamping: true },
          })}
          presentation={fade()}
        />

        <TransitionSeries.Sequence durationInFrames={SEQ}>
          <PathsScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: TRANS })}
          presentation={slide({ direction: "from-right" })}
        />

        <TransitionSeries.Sequence durationInFrames={140}>
          <SearchScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={springTiming({
            durationInFrames: TRANS,
            config: { damping: 200, overshootClamping: true },
          })}
          presentation={fade()}
        />

        <TransitionSeries.Sequence durationInFrames={160}>
          <LessonScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: TRANS })}
          presentation={slide({ direction: "from-right" })}
        />

        <TransitionSeries.Sequence durationInFrames={140}>
          <DragDropScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={springTiming({
            durationInFrames: TRANS,
            config: { damping: 200, overshootClamping: true },
          })}
          presentation={fade()}
        />

        <TransitionSeries.Sequence durationInFrames={SEQ}>
          <QuizScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: TRANS })}
          presentation={slide({ direction: "from-bottom" })}
        />

        <TransitionSeries.Sequence durationInFrames={140}>
          <CommunityScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={springTiming({
            durationInFrames: 24,
            config: { damping: 200, overshootClamping: true },
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
