import { Composition } from "remotion";
import { DemoComposition } from "./DemoComposition";
import { FPS, HEIGHT, WIDTH } from "./tokens";

/**
 * Duration ≈ sum(sequences) − sum(transitions) since TransitionSeries overlap
 * the transition with the adjacent sequences.
 *
 *   sequences  130 + 130 + 140 + 160 + 140 + 130 + 140 + 100 = 1070
 *   transitions 22  + 22  + 22  + 22  + 22  + 22  + 24        = 156
 *   total       1070 − 156                                      = 914 frames
 *
 *   914 / 30fps ≈ 30.5 seconds.
 */
const DURATION_IN_FRAMES = 914;

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
