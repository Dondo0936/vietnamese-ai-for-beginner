import { Composition } from "remotion";
import { DemoComposition } from "./DemoComposition";
import {
  LessonTokenizationComposition,
  LESSON_TOKENIZATION_DURATION,
} from "./LessonTokenization";
import {
  LessonResponseStreamingComposition,
  LESSON_RESPONSE_STREAMING_DURATION,
} from "./LessonResponseStreaming";
import {
  LessonPerceptronComposition,
  LESSON_PERCEPTRON_DURATION,
} from "./LessonPerceptron";
import {
  LessonPerceptronBannerComposition,
  LESSON_PERCEPTRON_BANNER_DURATION,
} from "./LessonPerceptronBanner";
import {
  LessonLargeTabularModelsComposition,
  LESSON_LTM_DURATION,
} from "./LessonLargeTabularModels";
import {
  LessonLargeTabularModelsBannerComposition,
  LESSON_LTM_BANNER_DURATION,
} from "./LessonLargeTabularModelsBanner";
import {
  LessonPromptEngineeringComposition,
  LESSON_PROMPT_ENGINEERING_DURATION,
} from "./LessonPromptEngineering";
import {
  LessonPromptEngineeringBannerComposition,
  LESSON_PROMPT_ENGINEERING_BANNER_DURATION,
} from "./LessonPromptEngineeringBanner";
import {
  LessonLLMMathComposition,
  LESSON_LLM_MATH_DURATION,
} from "./LessonLLMMath";
import {
  LessonLLMMathBannerComposition,
  LESSON_LLM_MATH_BANNER_DURATION,
} from "./LessonLLMMathBanner";
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
      <Composition
        id="LessonTokenization"
        component={LessonTokenizationComposition}
        durationInFrames={LESSON_TOKENIZATION_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="LessonResponseStreaming"
        component={LessonResponseStreamingComposition}
        durationInFrames={LESSON_RESPONSE_STREAMING_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="LessonPerceptron"
        component={LessonPerceptronComposition}
        durationInFrames={LESSON_PERCEPTRON_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="LessonPerceptronBanner"
        component={LessonPerceptronBannerComposition}
        durationInFrames={LESSON_PERCEPTRON_BANNER_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="LessonLargeTabularModels"
        component={LessonLargeTabularModelsComposition}
        durationInFrames={LESSON_LTM_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="LessonLargeTabularModelsBanner"
        component={LessonLargeTabularModelsBannerComposition}
        durationInFrames={LESSON_LTM_BANNER_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="LessonPromptEngineering"
        component={LessonPromptEngineeringComposition}
        durationInFrames={LESSON_PROMPT_ENGINEERING_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="LessonPromptEngineeringBanner"
        component={LessonPromptEngineeringBannerComposition}
        durationInFrames={LESSON_PROMPT_ENGINEERING_BANNER_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="LessonLLMMath"
        component={LessonLLMMathComposition}
        durationInFrames={LESSON_LLM_MATH_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="LessonLLMMathBanner"
        component={LessonLLMMathBannerComposition}
        durationInFrames={LESSON_LLM_MATH_BANNER_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
