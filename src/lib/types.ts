export type Difficulty = "beginner" | "intermediate" | "advanced";
export type VizType = "interactive" | "static";

export type TocSectionId =
  | "visualization"
  | "explanation"
  | "hero"
  | "problem"
  | "mechanism"
  | "metrics"
  | "tryIt"
  | "counterfactual";

export interface TocSection {
  id: TocSectionId;
  labelVi: string;
}

export interface FeaturedApp {
  name: string;
  productFeature?: string;
  company: string;
  countryOrigin: string;
}

export interface SourceLink {
  title: string;
  publisher: string;
  url: string;
  date: string;
  kind:
    | "engineering-blog"
    | "paper"
    | "keynote"
    | "news"
    | "patent"
    | "documentation";
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
  tocSections?: TocSection[];
  applicationOf?: string;
  featuredApp?: FeaturedApp;
  sources?: SourceLink[];
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
