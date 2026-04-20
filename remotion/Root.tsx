import { Composition } from "remotion";
import { DemoComposition } from "./DemoComposition";
import { FPS, HEIGHT, WIDTH } from "./tokens";

/**
 * Duration = sum(sequences) − sum(transitions), since TransitionSeries
 * overlaps each transition with both adjacent sequences:
 *
 *   sequences   150+180+100+150+160+130+130+130 = 1130
 *   transitions  20 × 7                         =  140
 *   total                                       =  990 frames
 *
 *   990 / 30fps = 33 seconds.
 */
const DURATION_IN_FRAMES = 990;

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
