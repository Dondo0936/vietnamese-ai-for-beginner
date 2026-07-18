import { Composition, Still } from "remotion";
import { ThumbnailDualLogo } from "./ThumbnailDualLogo";
import { DemoComposition } from "./DemoComposition";
import {
  LessonTokenizationComposition,
  LESSON_TOKENIZATION_DURATION,
} from "./LessonTokenization";
import {
  LessonTokenizationNarratedComposition,
  LESSON_TOKENIZATION_NARRATED_DURATION,
} from "./LessonTokenizationNarrated";
import {
  LessonNarratedComposition,
  lessonNarratedMetadata,
  LESSON_NARRATED_DEFAULT_PROPS,
  NARRATED_WIDTH,
  NARRATED_HEIGHT,
  NARRATED_FPS,
} from "./LessonNarrated";
import {
  LessonTokenizationVerticalComposition,
  LESSON_TOKENIZATION_VERTICAL_DURATION,
  LESSON_TOKENIZATION_VERTICAL_WIDTH,
  LESSON_TOKENIZATION_VERTICAL_HEIGHT,
  LESSON_TOKENIZATION_VERTICAL_FPS,
} from "./LessonTokenizationVertical";
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
import {
  LessonTurboQuantComposition,
  LESSON_TURBOQUANT_DURATION,
} from "./LessonTurboQuant";
import {
  LessonTurboQuantBannerComposition,
  LESSON_TURBOQUANT_BANNER_DURATION,
} from "./LessonTurboQuantBanner";
import {
  LessonUberEtaComposition,
  LESSON_UBER_ETA_DURATION,
} from "./LessonUberEta";
import {
  LessonUberEtaBannerComposition,
  LESSON_UBER_ETA_BANNER_DURATION,
} from "./LessonUberEtaBanner";
import {
  LessonTtsBannerComposition,
  LESSON_TTS_BANNER_DURATION,
} from "./LessonTtsBanner";
import {
  LessonTtsComposition,
  LESSON_TTS_DURATION,
  LESSON_TTS_FPS,
  LESSON_TTS_WIDTH,
  LESSON_TTS_HEIGHT,
} from "./LessonTts";
import {
  LessonClaudeExcelBannerComposition,
  LESSON_CLAUDE_EXCEL_BANNER_DURATION,
} from "./LessonClaudeExcelBanner";
import {
  LessonClaudeControlsAdobeBannerComposition,
  LESSON_CLAUDE_CONTROLS_ADOBE_BANNER_DURATION,
} from "./LessonClaudeControlsAdobeBanner";
import {
  LessonClaudeControlsAdobeComposition,
  LESSON_CLAUDE_CONTROLS_ADOBE_DURATION,
  LESSON_CLAUDE_CONTROLS_ADOBE_FPS,
  LESSON_CLAUDE_CONTROLS_ADOBE_WIDTH,
  LESSON_CLAUDE_CONTROLS_ADOBE_HEIGHT,
} from "./LessonClaudeControlsAdobe";
import {
  LessonClaudeExcelComposition,
  LESSON_CLAUDE_EXCEL_DURATION,
  LESSON_CLAUDE_EXCEL_FPS,
  LESSON_CLAUDE_EXCEL_WIDTH,
  LESSON_CLAUDE_EXCEL_HEIGHT,
} from "./LessonClaudeExcel";
import {
  LessonMidjourneyVsChatgptComposition,
  LESSON_MIDJOURNEY_VS_CHATGPT_DURATION,
} from "./LessonMidjourneyVsChatgpt";
import {
  LessonMidjourneyVsChatgptBannerComposition,
  LESSON_MIDJOURNEY_VS_CHATGPT_BANNER_DURATION,
} from "./LessonMidjourneyVsChatgptBanner";
import {
  LessonHowAIReadsPDFComposition,
  LESSON_HOW_AI_READS_PDF_DURATION,
} from "./LessonHowAIReadsPDF";
import {
  LessonHowAIReadsPDFVerticalComposition,
  LESSON_HOW_AI_READS_PDF_VERTICAL_DURATION,
  LESSON_HOW_AI_READS_PDF_VERTICAL_WIDTH,
  LESSON_HOW_AI_READS_PDF_VERTICAL_HEIGHT,
  LESSON_HOW_AI_READS_PDF_VERTICAL_FPS,
} from "./LessonHowAIReadsPDFVertical";
import {
  LessonHowAIReadsPDFBannerComposition,
  LESSON_HOW_AI_READS_PDF_BANNER_DURATION,
} from "./LessonHowAIReadsPDFBanner";
import {
  LessonAiForWritingComposition,
  LESSON_AI_FOR_WRITING_DURATION,
} from "./LessonAiForWriting";
import {
  LessonSentimentAnalysisInBrandMonitoringComposition,
  LESSON_SENTIMENT_ANALYSIS_IN_BRAND_MONITORING_DURATION,
} from "./LessonSentimentAnalysisInBrandMonitoring";
import {
  LessonSentimentAnalysisInBrandMonitoringLongformComposition,
  LESSON_SENTIMENT_ANALYSIS_IN_BRAND_MONITORING_LONGFORM_DURATION,
} from "./LessonSentimentAnalysisInBrandMonitoringLongform";
import {
  LessonAiForDataAnalysisComposition,
  LESSON_AI_FOR_DATA_ANALYSIS_DURATION,
} from "./LessonAiForDataAnalysis";
import {
  LessonAiForDataAnalysisLongformComposition,
  LESSON_AI_FOR_DATA_ANALYSIS_LONGFORM_DURATION,
} from "./LessonAiForDataAnalysisLongform";
import {
  LessonAiForCustomerRepliesComposition,
  LESSON_AI_FOR_CUSTOMER_REPLIES_DURATION,
} from "./LessonAiForCustomerReplies";
import {
  LessonAiForCustomerRepliesLongformComposition,
  LESSON_AI_FOR_CUSTOMER_REPLIES_LONGFORM_DURATION,
} from "./LessonAiForCustomerRepliesLongform";
import {
  LessonHallucinationComposition,
  LESSON_HALLUCINATION_DURATION,
} from "./LessonHallucination";
import {
  LessonHallucinationLongformComposition,
  LESSON_HALLUCINATION_LONGFORM_DURATION,
} from "./LessonHallucinationLongform";
import {
  LessonAiForMeetingNotesComposition,
  LESSON_AI_FOR_MEETING_NOTES_DURATION,
} from "./LessonAiForMeetingNotes";
import {
  LessonAiForMeetingNotesLongformComposition,
  LESSON_AI_FOR_MEETING_NOTES_LONGFORM_DURATION,
} from "./LessonAiForMeetingNotesLongform";
import {
  LessonAiDocSummaryComposition,
  LESSON_AI_DOC_SUMMARY_DURATION,
} from "./LessonAiDocSummary";
import {
  LessonAiDocSummaryLongformComposition,
  LESSON_AI_DOC_SUMMARY_LONGFORM_DURATION,
} from "./LessonAiDocSummaryLongform";
import {
  LessonAiForProductListingsComposition,
  LESSON_AI_FOR_PRODUCT_LISTINGS_DURATION,
} from "./LessonAiForProductListings";
import {
  LessonAiForMarketResearchComposition,
  LESSON_AI_FOR_MARKET_RESEARCH_DURATION,
} from "./LessonAiForMarketResearch";
import {
  LessonClaudeCodeAppsScriptComposition,
  LESSON_CLAUDE_CODE_APPS_SCRIPT_DURATION,
} from "./LessonClaudeCodeAppsScript";
import {
  LessonClaudeCodeAppsScriptLongformComposition,
  LESSON_CLAUDE_CODE_APPS_SCRIPT_LONGFORM_DURATION,
} from "./LessonClaudeCodeAppsScriptLongform";
import {
  LessonClaudeCodeExcelComposition,
  LESSON_CLAUDE_CODE_EXCEL_DURATION,
} from "./LessonClaudeCodeExcel";
import {
  LessonClaudeCodeExcelLongformComposition,
  LESSON_CLAUDE_CODE_EXCEL_LONGFORM_DURATION,
} from "./LessonClaudeCodeExcelLongform";
import {
  LessonGettingStartedLongformBannerComposition,
  LESSON_GETTING_STARTED_LONGFORM_BANNER_DURATION,
} from "./LessonGettingStartedLongformBanner";
import {
  LessonAiAgentLoopsLongformBannerComposition,
  LESSON_AI_AGENT_LOOPS_LONGFORM_BANNER_DURATION,
} from "./LessonAiAgentLoopsLongformBanner";
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
        id="LessonTokenizationNarrated"
        component={LessonTokenizationNarratedComposition}
        durationInFrames={LESSON_TOKENIZATION_NARRATED_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="LessonTokenizationVertical"
        component={LessonTokenizationVerticalComposition}
        durationInFrames={LESSON_TOKENIZATION_VERTICAL_DURATION}
        fps={LESSON_TOKENIZATION_VERTICAL_FPS}
        width={LESSON_TOKENIZATION_VERTICAL_WIDTH}
        height={LESSON_TOKENIZATION_VERTICAL_HEIGHT}
      />
      {/* Generic narrated comp: parameterized by --props {lesson, captions}.
          One composition renders any lesson's narrated landscape video. */}
      <Composition
        id="LessonNarrated"
        component={LessonNarratedComposition}
        durationInFrames={LESSON_NARRATED_DEFAULT_PROPS.captions.durationInFrames}
        fps={NARRATED_FPS}
        width={NARRATED_WIDTH}
        height={NARRATED_HEIGHT}
        defaultProps={LESSON_NARRATED_DEFAULT_PROPS}
        calculateMetadata={lessonNarratedMetadata}
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
      <Composition
        id="LessonTurboQuant"
        component={LessonTurboQuantComposition}
        durationInFrames={LESSON_TURBOQUANT_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="LessonTurboQuantBanner"
        component={LessonTurboQuantBannerComposition}
        durationInFrames={LESSON_TURBOQUANT_BANNER_DURATION}
        fps={FPS}
        width={1200}
        height={630}
      />
      <Composition
        id="LessonUberEta"
        component={LessonUberEtaComposition}
        durationInFrames={LESSON_UBER_ETA_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="LessonUberEtaBanner"
        component={LessonUberEtaBannerComposition}
        durationInFrames={LESSON_UBER_ETA_BANNER_DURATION}
        fps={FPS}
        width={1200}
        height={630}
      />
      <Composition
        id="LessonTtsBanner"
        component={LessonTtsBannerComposition}
        durationInFrames={LESSON_TTS_BANNER_DURATION}
        fps={FPS}
        width={1200}
        height={630}
      />
      <Composition
        id="LessonTts"
        component={LessonTtsComposition}
        durationInFrames={LESSON_TTS_DURATION}
        fps={LESSON_TTS_FPS}
        width={LESSON_TTS_WIDTH}
        height={LESSON_TTS_HEIGHT}
      />
      <Composition
        id="LessonClaudeExcelBanner"
        component={LessonClaudeExcelBannerComposition}
        durationInFrames={LESSON_CLAUDE_EXCEL_BANNER_DURATION}
        fps={FPS}
        width={1200}
        height={630}
      />
      <Composition
        id="LessonClaudeExcel"
        component={LessonClaudeExcelComposition}
        durationInFrames={LESSON_CLAUDE_EXCEL_DURATION}
        fps={LESSON_CLAUDE_EXCEL_FPS}
        width={LESSON_CLAUDE_EXCEL_WIDTH}
        height={LESSON_CLAUDE_EXCEL_HEIGHT}
      />
      <Composition
        id="LessonClaudeControlsAdobeBanner"
        component={LessonClaudeControlsAdobeBannerComposition}
        durationInFrames={LESSON_CLAUDE_CONTROLS_ADOBE_BANNER_DURATION}
        fps={FPS}
        width={1200}
        height={630}
      />
      <Composition
        id="LessonClaudeControlsAdobe"
        component={LessonClaudeControlsAdobeComposition}
        durationInFrames={LESSON_CLAUDE_CONTROLS_ADOBE_DURATION}
        fps={LESSON_CLAUDE_CONTROLS_ADOBE_FPS}
        width={LESSON_CLAUDE_CONTROLS_ADOBE_WIDTH}
        height={LESSON_CLAUDE_CONTROLS_ADOBE_HEIGHT}
      />
      <Composition
        id="LessonMidjourneyVsChatgpt"
        component={LessonMidjourneyVsChatgptComposition}
        durationInFrames={LESSON_MIDJOURNEY_VS_CHATGPT_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="LessonMidjourneyVsChatgptBanner"
        component={LessonMidjourneyVsChatgptBannerComposition}
        durationInFrames={LESSON_MIDJOURNEY_VS_CHATGPT_BANNER_DURATION}
        fps={FPS}
        width={1200}
        height={630}
      />
      <Composition
        id="LessonHowAIReadsPDF"
        component={LessonHowAIReadsPDFComposition}
        durationInFrames={LESSON_HOW_AI_READS_PDF_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="LessonHowAIReadsPDFVertical"
        component={LessonHowAIReadsPDFVerticalComposition}
        durationInFrames={LESSON_HOW_AI_READS_PDF_VERTICAL_DURATION}
        fps={LESSON_HOW_AI_READS_PDF_VERTICAL_FPS}
        width={LESSON_HOW_AI_READS_PDF_VERTICAL_WIDTH}
        height={LESSON_HOW_AI_READS_PDF_VERTICAL_HEIGHT}
      />
      <Composition
        id="LessonHowAIReadsPDFBanner"
        component={LessonHowAIReadsPDFBannerComposition}
        durationInFrames={LESSON_HOW_AI_READS_PDF_BANNER_DURATION}
        fps={FPS}
        width={1200}
        height={630}
      />
      <Composition
        id="LessonAiForWriting"
        component={LessonAiForWritingComposition}
        durationInFrames={LESSON_AI_FOR_WRITING_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="LessonSentimentAnalysisInBrandMonitoring"
        component={LessonSentimentAnalysisInBrandMonitoringComposition}
        durationInFrames={LESSON_SENTIMENT_ANALYSIS_IN_BRAND_MONITORING_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="LessonSentimentAnalysisInBrandMonitoringLongform"
        component={LessonSentimentAnalysisInBrandMonitoringLongformComposition}
        durationInFrames={LESSON_SENTIMENT_ANALYSIS_IN_BRAND_MONITORING_LONGFORM_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="LessonAiForDataAnalysis"
        component={LessonAiForDataAnalysisComposition}
        durationInFrames={LESSON_AI_FOR_DATA_ANALYSIS_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="LessonAiForDataAnalysisLongform"
        component={LessonAiForDataAnalysisLongformComposition}
        durationInFrames={LESSON_AI_FOR_DATA_ANALYSIS_LONGFORM_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="LessonAiForCustomerReplies"
        component={LessonAiForCustomerRepliesComposition}
        durationInFrames={LESSON_AI_FOR_CUSTOMER_REPLIES_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="LessonAiForCustomerRepliesLongform"
        component={LessonAiForCustomerRepliesLongformComposition}
        durationInFrames={LESSON_AI_FOR_CUSTOMER_REPLIES_LONGFORM_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="LessonHallucination"
        component={LessonHallucinationComposition}
        durationInFrames={LESSON_HALLUCINATION_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="LessonHallucinationLongform"
        component={LessonHallucinationLongformComposition}
        durationInFrames={LESSON_HALLUCINATION_LONGFORM_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="LessonAiForMeetingNotes"
        component={LessonAiForMeetingNotesComposition}
        durationInFrames={LESSON_AI_FOR_MEETING_NOTES_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="LessonAiForMeetingNotesLongform"
        component={LessonAiForMeetingNotesLongformComposition}
        durationInFrames={LESSON_AI_FOR_MEETING_NOTES_LONGFORM_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="LessonAiDocSummary"
        component={LessonAiDocSummaryComposition}
        durationInFrames={LESSON_AI_DOC_SUMMARY_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="LessonAiDocSummaryLongform"
        component={LessonAiDocSummaryLongformComposition}
        durationInFrames={LESSON_AI_DOC_SUMMARY_LONGFORM_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="LessonAiForProductListings"
        component={LessonAiForProductListingsComposition}
        durationInFrames={LESSON_AI_FOR_PRODUCT_LISTINGS_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="LessonAiForMarketResearch"
        component={LessonAiForMarketResearchComposition}
        durationInFrames={LESSON_AI_FOR_MARKET_RESEARCH_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="LessonClaudeCodeAppsScript"
        component={LessonClaudeCodeAppsScriptComposition}
        durationInFrames={LESSON_CLAUDE_CODE_APPS_SCRIPT_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="LessonClaudeCodeAppsScriptLongform"
        component={LessonClaudeCodeAppsScriptLongformComposition}
        durationInFrames={LESSON_CLAUDE_CODE_APPS_SCRIPT_LONGFORM_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="LessonClaudeCodeExcel"
        component={LessonClaudeCodeExcelComposition}
        durationInFrames={LESSON_CLAUDE_CODE_EXCEL_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="LessonClaudeCodeExcelLongform"
        component={LessonClaudeCodeExcelLongformComposition}
        durationInFrames={LESSON_CLAUDE_CODE_EXCEL_LONGFORM_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="LessonGettingStartedLongformBanner"
        component={LessonGettingStartedLongformBannerComposition}
        durationInFrames={LESSON_GETTING_STARTED_LONGFORM_BANNER_DURATION}
        fps={FPS}
        width={1280}
        height={720}
      />
      <Composition
        id="LessonAiAgentLoopsLongformBanner"
        component={LessonAiAgentLoopsLongformBannerComposition}
        durationInFrames={LESSON_AI_AGENT_LOOPS_LONGFORM_BANNER_DURATION}
        fps={FPS}
        width={1280}
        height={720}
      />
      <Still
        id="ThumbnailDualLogo"
        component={ThumbnailDualLogo}
        width={1280}
        height={720}
        defaultProps={{
          line1: "CLAUDE CODE",
          line2: "trong EXCEL",
          aiLogoSrc: "brand/claude-symbol.svg",
          toolLogoSrc: "brand/excel-icon.svg",
          bgColor: "#107C41",
          bgColorDark: "#0A4526",
        }}
      />
    </>
  );
};
