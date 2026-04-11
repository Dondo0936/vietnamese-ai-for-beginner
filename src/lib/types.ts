export type Difficulty = "beginner" | "intermediate" | "advanced";
export type VizType = "interactive" | "static";

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
