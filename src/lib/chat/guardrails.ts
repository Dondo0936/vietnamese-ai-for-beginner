import Fuse from "fuse.js";
import { categories, topicList } from "@/topics/registry";
import { initSearch, searchTopics } from "@/lib/search";
import type { TopicMeta } from "@/lib/types";

interface CorpusEntry {
  text: string;
}

// Small hardcoded allowlist for greetings and app-help questions that won't
// fuzzy-match any topic/category text but are legitimately on-topic (the
// visitor is talking about udemi.tech itself, not asking an AI/ML question).
const ALLOWLIST_PATTERNS: RegExp[] = [
  /^(chào|hello|hi|hey|xin chào)\b/i,
  /\b(udemi|khoá học|khóa học|chủ đề|bài học|trang này|website này|app này|ứng dụng này)\b/i,
  /\b(cảm ơn|thanks|thank you)\b/i,
  /\b(bạn là ai|who are you|bạn giúp được gì|what can you do)\b/i,
];

// Function words stripped before token-level matching, so a sentence made of
// mostly connective words ("... hoạt động thế nào") doesn't need the whole
// phrase to match — only its content words do.
const STOPWORDS = new Set([
  "là", "gì", "của", "và", "các", "một", "cho", "này", "có", "không",
  "được", "về", "như", "thế", "nào", "sao", "làm", "với", "trong", "khi",
  "để", "hoạt", "động", "bạn", "mình", "tôi", "vậy", "đây", "đó", "hay",
  "hoặc", "nếu", "thì", "đang", "sẽ", "đã", "rất", "nhiều", "cái", "những",
  "mà", "nên", "phải", "cần", "muốn", "ơi", "ạ", "nhé", "dùng", "giải",
  "thích", "hiểu", "biết", "nói", "cho", "mấy", "bao", "nhiêu",
  "a", "an", "the", "is", "are", "what", "how", "why", "when", "where",
  "who", "does", "do", "did", "of", "to", "in", "on", "for", "and", "or",
  "with", "that", "this", "it", "be", "can", "you", "i", "me", "my",
]);

// Standalone English words that are substrings of real ML jargon (e.g.
// "world" from the "world-models" topic slug) but carry zero on-topic
// signal by themselves — without this, "who won the world cup" would match.
const GENERIC_DENYLIST = new Set([
  "world", "data", "value", "values", "system", "systems", "general",
  "basic", "real", "new", "old", "good", "bad", "big", "small", "state",
  "states", "case", "cases", "type", "types", "user", "users",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

let fuseInstance: Fuse<CorpusEntry> | null = null;

// Word-level vocabulary built from English titles/slugs/tags only —
// deliberately excludes `titleVi` and `description`, which are natural
// Vietnamese prose/marketing copy. Tokenizing prose word-by-word pulls in
// generic Vietnamese syllables ("giá", "thời", "chuyện", "nghe" — price,
// time, story, hear) that show up in unrelated small talk just as often as
// in AI/ML sentences, which made the classifier too permissive.
function getFuse(): Fuse<CorpusEntry> {
  if (fuseInstance) return fuseInstance;

  const words = new Set<string>();
  const addAll = (text: string) => {
    for (const w of tokenize(text)) {
      if (!GENERIC_DENYLIST.has(w)) words.add(w);
    }
  };
  for (const c of categories) addAll(c.slug.replace(/-/g, " "));
  for (const t of topicList) {
    addAll(`${t.title} ${t.slug.replace(/-/g, " ")} ${t.tags.join(" ")}`);
  }

  const corpus: CorpusEntry[] = Array.from(words, (text) => ({ text }));

  fuseInstance = new Fuse(corpus, {
    keys: ["text"],
    threshold: 0.15,
    includeScore: true,
    minMatchCharLength: 4,
    ignoreLocation: true,
  });
  return fuseInstance;
}

export interface ClassifyResult {
  allowed: boolean;
}

/**
 * Deterministic (non-LLM) topic gate. A message is allowed if any of its
 * content words (stopwords stripped) fuzzy-matches the app's own AI/ML
 * curriculum corpus, or it hits the app-help allowlist. Matching is
 * token-level rather than whole-sentence because Fuse's whole-string
 * matching degrades badly on natural-language questions that mix a couple
 * of on-topic terms with ordinary sentence filler. This is the primary
 * guardrail guarantee — the system prompt sent to Groq is defense-in-depth
 * on top of this, not a substitute for it.
 */
export function classifyMessage(text: string): ClassifyResult {
  const trimmed = text.trim();
  if (!trimmed) return { allowed: false };

  if (ALLOWLIST_PATTERNS.some((p) => p.test(trimmed))) {
    return { allowed: true };
  }

  const tokens = tokenize(trimmed);
  if (tokens.length === 0) return { allowed: false };

  const fuse = getFuse();
  const allowed = tokens.some((token) => fuse.search(token).length > 0);
  return { allowed };
}

let relatedSearchInitialized = false;

/**
 * Suggests topic pages related to an on-topic question, for the "related
 * lessons" widget under a chat reply. Deliberately reuses search.ts's
 * whole-message Fuse config (lenient, tuned for short search-bar queries)
 * rather than classifyMessage's strict token-level one — a loose-but-wrong
 * suggestion is a fine outcome here, unlike for the topic gate.
 */
export function findRelatedTopics(text: string, limit = 4): TopicMeta[] {
  if (!relatedSearchInitialized) {
    initSearch(topicList);
    relatedSearchInitialized = true;
  }
  return searchTopics(text).slice(0, limit);
}
