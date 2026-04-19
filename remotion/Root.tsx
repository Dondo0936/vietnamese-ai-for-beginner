import { Composition } from "remotion";
import { DemoComposition } from "./DemoComposition";
import { FPS, HEIGHT, WIDTH } from "./tokens";

// Hero 130 + trans 22 + Paths 130 + trans 22 + Lesson 160 + trans 22 + Quiz 130
// + trans 24 + Outro 100. Transitions overlap by their duration, so the total
// = 130 + 130 + 160 + 130 + 100 - 22 - 22 - 22 - 24 = 560 frames.
const DURATION_IN_FRAMES = 560;

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="DemoComposition"
        component={DemoComposition}
        durationInFrames={DURATION_IN_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
