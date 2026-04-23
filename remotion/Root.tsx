import { Composition } from "remotion";
import { DemoComposition } from "./DemoComposition";
import { FPS, HEIGHT, WIDTH } from "./tokens";

/**
 * Duration = sum(sequences) − sum(transitions), since TransitionSeries
 * overlaps each transition with both adjacent sequences:
 *
 *   sequences   150+180+150+160+130+130+130 = 1030
 *   transitions  20 × 6                     =  120
 *   total                                   =  910 frames
 *
 *   910 / 30fps ≈ 30.3 seconds.
 */
const DURATION_IN_FRAMES = 910;

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
