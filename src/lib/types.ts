export type Difficulty = "beginner" | "intermediate" | "advanced";
export type VizType = "interactive" | "static";

export type TocSectionId = "visualization" | "explanation";

export interface TocSection {
  id: TocSectionId;
  labelVi: string;
}

export interface TopicMeta {
  slug: string;
  title: string;
  titleVi: string;
  description: string;
  category: string;
  tags: string[];
  difficulty: Difficulty;
  relatedSlugs: string[];
  vizType: VizType;
  icon?: string;
  /**
   * Controls which entries the TopicTOC rail renders for this topic.
   * If omitted, TopicLayout falls back to DEFAULT_TOC_SECTIONS
   * (visualization + explanation). Topics without a VisualizationSection
   * should set this to `[{ id: "explanation", labelVi: "Giải thích" }]`.
   */
  tocSections?: TocSection[];
}

export interface Category {
  slug: string;
  nameVi: string;
  icon: string;
  description: string;
}

export interface UserProgress {
  readTopics: string[];
  bookmarks: string[];
  lastVisited: string | null;
}
