import { Composition } from "remotion";
import { DemoComposition } from "./DemoComposition";
import { FPS, HEIGHT, WIDTH } from "./tokens";

/**
 * Duration ≈ sum(sequences) − sum(transitions), since TransitionSeries
 * overlaps the transition with the two adjacent sequences:
 *
 *   sequences   160 + 150 + 170 + 240 + 210 + 130 = 1060
 *   transitions  22 × 5                            =  110
 *   total                                         =  950 frames
 *
 *   950 / 30fps ≈ 31.6 seconds.
 */
const DURATION_IN_FRAMES = 950;

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
