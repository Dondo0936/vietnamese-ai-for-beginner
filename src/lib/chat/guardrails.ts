import Fuse from "fuse.js";
import { categories, topicList } from "@/topics/registry";
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
  // Standalone 2-letter AI/ML acronyms — tokenize()'s length>=3 floor drops
  // these before they ever reach Fuse, so "AI là gì" / "ML là gì" would
  // otherwise fall through to zero tokens and get rejected.
  /\b(ai|ml)\b/i,
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
// "application"/"applications" is here because it's used as a generic tag
// on 80+ unrelated topics (see topics/registry.ts) — common enough that
// "application deadline for university" was matching through it alone.
const GENERIC_DENYLIST = new Set([
  "world", "data", "value", "values", "system", "systems", "general",
  "basic", "real", "new", "old", "good", "bad", "big", "small", "state",
  "states", "case", "cases", "type", "types", "user", "users",
  "application", "applications",
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

// Strips diacritics (Vietnamese and otherwise) so an unaccented query like
// "hoc tang cuong" matches topic text written as "học tăng cường". Combining
// marks come off via NFD decomposition; "đ"/"Đ" don't decompose that way so
// they're folded explicitly.
function stripDiacritics(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

// Crude singular/plural fold ("transformers" -> "transformer") so a plural
// query still hits a topic's singular title token. Deliberately simple
// (trailing "s" only) rather than a real stemmer — good enough for the
// English ML jargon in this corpus without false-folding short words.
function normalizeToken(w: string): string {
  const stripped = stripDiacritics(w);
  return stripped.length > 4 && stripped.endsWith("s") && !stripped.endsWith("ss")
    ? stripped.slice(0, -1)
    : stripped;
}

interface ScoredTopic {
  topic: TopicMeta;
  score: number;
}

interface TopicWordInfo {
  // title + slug — a hit here is a strong, specific signal.
  strong: Set<string>;
  // titleVi + tags — looser prose/label matches, weighted lower since they
  // pull in generic Vietnamese syllables and shared tags more easily.
  weak: Set<string>;
}

let topicWordCache: Map<string, TopicWordInfo> | null = null;
let tokenDocFreqCache: Map<string, number> | null = null;

// A token that shows up in many topics (e.g. "hình" from "mô hình" / model,
// which appears across dozens of unrelated Vietnamese titles) carries little
// discriminative signal on its own — without down-weighting it, a query
// built entirely from generic words ranks topics by coincidence rather than
// relevance. Threshold picked empirically against this corpus's ~260 topics.
const GENERIC_TOKEN_TOPIC_THRESHOLD = 8;

function buildTopicWordCaches(): void {
  const wordCache = new Map<string, TopicWordInfo>();
  const freq = new Map<string, number>();

  for (const t of topicList) {
    const strong = new Set(
      tokenize(`${t.title} ${t.slug.replace(/-/g, " ")}`).map(normalizeToken)
    );
    const weak = new Set(
      tokenize(`${t.titleVi} ${t.tags.join(" ")}`).map(normalizeToken)
    );
    wordCache.set(t.slug, { strong, weak });
    for (const w of new Set([...strong, ...weak])) {
      freq.set(w, (freq.get(w) ?? 0) + 1);
    }
  }

  topicWordCache = wordCache;
  tokenDocFreqCache = freq;
}

function getTopicWordCaches(): {
  words: Map<string, TopicWordInfo>;
  freq: Map<string, number>;
} {
  if (!topicWordCache || !tokenDocFreqCache) buildTopicWordCaches();
  return { words: topicWordCache!, freq: tokenDocFreqCache! };
}

/**
 * Suggests topic pages related to an on-topic question, for the "related
 * lessons" widget under a chat reply.
 *
 * Originally reused search.ts's whole-message Fuse config, but that's tuned
 * for short search-bar queries and fails the same way classifyMessage did
 * before its rewrite: fuzzy-matching a full sentence like "RAG là gì" as one
 * contiguous string against long topic text scores too low even when "RAG"
 * is an exact, obvious match — searchTopics("RAG là gì") returned zero
 * results in production. Token-level matching (same tokenize() used for the
 * topic gate, plus diacritic-stripping and plural-folding via
 * normalizeToken()) against title+titleVi+slug+tags fixes it: each query
 * content-word is checked independently, topics are ranked by weighted
 * match count (title/slug hits count more than titleVi/tag hits, and
 * corpus-wide-common tokens are down-weighted so a query built only from
 * generic words returns nothing rather than an arbitrary tied set).
 * Wrong-but-plausible suggestions are still an acceptable failure mode here
 * (unlike the strict topic gate), so this deliberately skips
 * GENERIC_DENYLIST and stays lenient overall.
 */
export function findRelatedTopics(text: string, limit = 4): TopicMeta[] {
  const tokens = Array.from(new Set(tokenize(text).map(normalizeToken)));
  if (tokens.length === 0) return [];

  const { words, freq } = getTopicWordCaches();

  const scored: ScoredTopic[] = topicList.map((topic) => {
    const info = words.get(topic.slug) ?? { strong: new Set<string>(), weak: new Set<string>() };
    let score = 0;
    for (const tok of tokens) {
      const isGeneric = (freq.get(tok) ?? 0) > GENERIC_TOKEN_TOPIC_THRESHOLD;
      if (info.strong.has(tok)) score += isGeneric ? 1 : 3;
      else if (info.weak.has(tok)) score += isGeneric ? 0 : 1;
    }
    return { topic, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.topic);
}
