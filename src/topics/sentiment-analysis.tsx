"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ThumbsUp,
  ThumbsDown,
  Minus,
  Sparkles,
  MessageCircle,
  TrendingUp,
  AlertTriangle,
  Flame,
  Smile,
  Frown,
  Meh,
  BookOpen,
  Globe,
  Languages,
  BadgeCheck,
  ShieldAlert,
  Lightbulb,
  Gauge,
  Quote,
  Zap,
  Star,
} from "lucide-react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  MatchPairs,
  ToggleCompare,
  TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "sentiment-analysis",
  title: "Sentiment Analysis",
  titleVi: "Phân tích cảm xúc văn bản",
  description:
    "AI đọc bình luận khách hàng rồi đoán tích cực, tiêu cực hay trung tính — như một nhân viên marketing lướt Facebook nhưng làm với hàng triệu câu mỗi phút.",
  category: "nlp",
  tags: ["nlp", "classification", "opinion-mining"],
  difficulty: "beginner",
  relatedSlugs: ["text-classification", "sentiment-analysis-in-brand-monitoring"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

/* ── Từ điển cảm xúc nhỏ dùng cho demo live ─────────────────────── */
const POSITIVE_WORDS = [
  "tốt", "ngon", "nhanh", "cẩn thận", "tuyệt", "vời", "hài lòng",
  "đúng", "ổn", "đẹp", "yêu", "thích", "xuất sắc", "mê", "chuẩn",
  "nhiệt tình", "thân thiện", "rẻ", "đáng tiền", "sạch", "mới",
];
const NEGATIVE_WORDS = [
  "chậm", "lỗi", "kém", "gian", "dối", "tệ", "chán", "dở",
  "bực", "bẩn", "hư", "hỏng", "thất vọng", "đắt", "cáu",
  "giả", "thô lỗ", "nhầm", "bỏ", "tồi",
];
const NEGATION_WORDS = ["không", "chẳng", "chả", "đâu"];

type Sentiment = "positive" | "negative" | "neutral";
const SENTIMENT_COLOR: Record<Sentiment, string> = {
  positive: "#22c55e",
  negative: "#ef4444",
  neutral: "#f59e0b",
};
const SENTIMENT_LABEL: Record<Sentiment, string> = {
  positive: "Tích cực",
  negative: "Tiêu cực",
  neutral: "Trung tính",
};

type Token = { word: string; kind: "pos" | "neg" | "negator" | "none" };

function analyze(text: string) {
  const tokens: Token[] = [];
  const raw = text.toLowerCase().trim();
  if (!raw) return { tokens, score: 0, pos: 0, neg: 0, sentiment: "neutral" as Sentiment };

  const words = raw.split(/\s+/);
  let pos = 0;
  let neg = 0;

  for (let i = 0; i < words.length; i++) {
    const w = words[i].replace(/[.,!?;:"'()]/g, "");
    if (!w) continue;
    const prev = i > 0 ? words[i - 1].replace(/[.,!?;:"'()]/g, "") : "";
    const isNegated = NEGATION_WORDS.includes(prev);

    const isPos = POSITIVE_WORDS.some((pw) => w.includes(pw));
    const isNeg = NEGATIVE_WORDS.some((nw) => w.includes(nw));

    if (NEGATION_WORDS.includes(w)) {
      tokens.push({ word: words[i], kind: "negator" });
    } else if (isPos) {
      if (isNegated) {
        neg++;
        tokens.push({ word: words[i], kind: "neg" });
      } else {
        pos++;
        tokens.push({ word: words[i], kind: "pos" });
      }
    } else if (isNeg) {
      if (isNegated) {
        pos++;
        tokens.push({ word: words[i], kind: "pos" });
      } else {
        neg++;
        tokens.push({ word: words[i], kind: "neg" });
      }
    } else {
      tokens.push({ word: words[i], kind: "none" });
    }
  }

  const total = pos + neg || 1;
  const score = (pos - neg) / total;
  const sentiment: Sentiment =
    score > 0.2 ? "positive" : score < -0.2 ? "negative" : "neutral";
  return { tokens, score, pos, neg, sentiment };
}

/* ── Dữ liệu giả cho dashboard thương hiệu ──────────────────────── */
type ShopReview = {
  source: "Shopee" | "Lazada" | "Tiki";
  text: string;
  stars: number;
  day: number; // 0..6
  sentiment: Sentiment;
};

const SHOP_REVIEWS: ShopReview[] = [
  { source: "Shopee", text: "Sản phẩm rất tốt, ship nhanh, đóng gói cẩn thận!", stars: 5, day: 0, sentiment: "positive" },
  { source: "Shopee", text: "Hàng đúng mô tả, chất lượng ổn so với giá tiền", stars: 3, day: 0, sentiment: "neutral" },
  { source: "Lazada", text: "Giao chậm, sản phẩm bị lỗi, không hài lòng", stars: 1, day: 1, sentiment: "negative" },
  { source: "Shopee", text: "Phở này ngon tuyệt vời, sẽ mua lại!", stars: 5, day: 1, sentiment: "positive" },
  { source: "Tiki", text: "Bình thường, không có gì đặc biệt", stars: 3, day: 2, sentiment: "neutral" },
  { source: "Shopee", text: "Đáng tiền quá, chất lượng quá ổn!", stars: 5, day: 2, sentiment: "positive" },
  { source: "Lazada", text: "Thất vọng, hàng giả trắng trợn", stars: 1, day: 3, sentiment: "negative" },
  { source: "Shopee", text: "Giao nhanh, gói đẹp, shop nhiệt tình", stars: 5, day: 3, sentiment: "positive" },
  { source: "Lazada", text: "Hàng tới tay thì đã móp, đổi trả lằng nhằng", stars: 2, day: 4, sentiment: "negative" },
  { source: "Tiki", text: "Đúng hàng chính hãng, yên tâm mua tiếp", stars: 5, day: 4, sentiment: "positive" },
  { source: "Shopee", text: "Giá ok, không có gì để chê nhưng cũng không nổi bật", stars: 3, day: 5, sentiment: "neutral" },
  { source: "Shopee", text: "Dùng một tuần đã hỏng, mua phí tiền", stars: 1, day: 5, sentiment: "negative" },
  { source: "Shopee", text: "Shop tư vấn nhiệt tình, sản phẩm đúng ý!", stars: 5, day: 6, sentiment: "positive" },
  { source: "Tiki", text: "Đóng gói hơi sơ sài nhưng hàng vẫn ổn", stars: 4, day: 6, sentiment: "positive" },
  { source: "Lazada", text: "Không bao giờ quay lại, thái độ tệ", stars: 1, day: 6, sentiment: "negative" },
];

const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

/* ── Các câu gây khó ─────────────────────────────────────────────── */
type TrickyCase = {
  text: string;
  naive: Sentiment; // đếm từ đơn giản
  correct: Sentiment; // con người hiểu
  note: string;
};

const TRICKY_CASES: TrickyCase[] = [
  {
    text: "Không tệ, đáng tiền lắm",
    naive: "negative",
    correct: "positive",
    note: "Đảo ngữ: 'không' + 'tệ' = tích cực. Lexicon đếm 'tệ' → sai.",
  },
  {
    text: "Cũng được, không có gì đặc biệt",
    naive: "neutral",
    correct: "neutral",
    note: "Thực sự trung tính — khách không chê không khen.",
  },
  {
    text: "Hơi chán nhưng đáng tiền",
    naive: "negative",
    correct: "positive",
    note: "Có 'nhưng' → phần sau mới là kết luận của khách. Ý: đáng mua.",
  },
  {
    text: "Ok shop",
    naive: "neutral",
    correct: "positive",
    note: "Viết tắt thế hệ trẻ. 'Ok' ở Shopee thường là khen ngắn gọn.",
  },
  {
    text: "Haha hàng giả chất lượng cao quá",
    naive: "positive",
    correct: "negative",
    note: "Mỉa mai. 'Haha' + 'hàng giả' → khách đang tức tối.",
  },
  {
    text: "Shop nhiệt tình lắm nhé, nhắn 3 ngày không rep",
    naive: "positive",
    correct: "negative",
    note: "Mỉa mai kiểu 'nhiệt tình' + phản chứng ngay sau đó.",
  },
];

/* ── Quiz ───────────────────────────────────────────────────────── */
const QUIZ: QuizQuestion[] = [
  {
    question: `Review Shopee: "Sản phẩm không tệ lắm" — cảm xúc là gì?`,
    options: [
      "Tiêu cực — vì có từ 'tệ'",
      "Tích cực nhẹ — 'không' + 'tệ' = đảo ngữ",
      "Trung tính",
      "Không xác định được",
    ],
    correct: 1,
    explanation:
      "Đây là đảo ngữ (negation): 'không' + 'tệ' = 'ổn'. Nếu chỉ đếm từ thì máy sẽ đếm 'tệ' rồi kết luận tiêu cực. Mô hình hiện đại (BERT, PhoBERT) hiểu được đảo ngữ nhờ đọc cả ngữ cảnh.",
  },
  {
    question:
      "Một nhà hàng muốn biết ý kiến khách về MÓN ĂN và PHỤC VỤ RIÊNG BIỆT. Kỹ thuật nào phù hợp?",
    options: [
      "Phân tích cảm xúc cơ bản 3 lớp",
      "Phân tích cảm xúc theo khía cạnh (aspect-based)",
      "Phân loại ngôn ngữ",
      "Tóm tắt văn bản",
    ],
    correct: 1,
    explanation:
      "Aspect-based Sentiment Analysis tách từng khía cạnh: 'Đồ ăn ngon nhưng phục vụ chậm' → Món ăn: tích cực, Phục vụ: tiêu cực. Rất hữu ích cho F&B, khách sạn, e-commerce khi bạn muốn hành động cụ thể.",
  },
  {
    question:
      "Khách viết: 'Ship siêu nhanh nhé, 10 ngày mới tới 😒'. Vì sao máy dễ đoán sai?",
    options: [
      "Vì có emoji",
      "Vì đây là MỈA MAI — câu có vẻ khen nhưng ngữ cảnh là chê",
      "Vì tiếng Việt",
      "Vì không có từ tiêu cực",
    ],
    correct: 1,
    explanation:
      "Mỉa mai (sarcasm) là điểm yếu lớn nhất của mọi mô hình. 'Siêu nhanh' nghe khen, nhưng '10 ngày' + emoji 😒 phản bác ngay. Ngay cả PhoBERT cũng sai ở dạng này nếu không có dữ liệu đặc thù.",
  },
  {
    question: "Vì sao PhoBERT thường tốt hơn mô hình nước ngoài cho review tiếng Việt?",
    options: [
      "PhoBERT nhanh hơn",
      "PhoBERT được huấn luyện trên văn bản tiếng Việt nên hiểu dấu, tiếng lóng và cách viết tắt trong nước",
      "PhoBERT miễn phí",
      "PhoBERT nhỏ hơn",
    ],
    correct: 1,
    explanation:
      "PhoBERT (VinAI) pre-train trên kho tiếng Việt khổng lồ → hiểu 'ship', 'sl', 'nv' và dấu thanh chuẩn. Mô hình đa ngôn ngữ thường vấp khi gặp phương ngữ ba miền hoặc tiếng lóng mạng.",
  },
  {
    type: "fill-blank",
    question:
      "Phân tích cảm xúc chia văn bản thành ba nhãn chính: {blank}, {blank} và trung tính.",
    blanks: [
      { answer: "tích cực", accept: ["positive", "tich cuc"] },
      { answer: "tiêu cực", accept: ["negative", "tieu cuc"] },
    ],
    explanation:
      "Ba lớp kinh điển: tích cực / tiêu cực / trung tính. Nâng cao hơn có: 1–5 sao, phân tích theo khía cạnh (đồ ăn tích cực, dịch vụ tiêu cực), hoặc 6 cảm xúc (vui, buồn, giận, sợ, ngạc nhiên, ghê tởm).",
  },
];

/* ───────────────────── Main Topic Component ─────────────────────── */
export default function SentimentAnalysisTopic() {
  const [text, setText] = useState("Phở Hà Nội rất ngon, shop gói cẩn thận!");
  const analysis = useMemo(() => analyze(text), [text]);

  const onChangeText = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value),
    [],
  );

  /* ── demo 2: dashboard ─────────────────────────── */
  const [sourceFilter, setSourceFilter] = useState<"all" | "Shopee" | "Lazada" | "Tiki">("all");

  const filteredReviews = useMemo(
    () => (sourceFilter === "all" ? SHOP_REVIEWS : SHOP_REVIEWS.filter((r) => r.source === sourceFilter)),
    [sourceFilter],
  );

  const dailyCounts = useMemo(() => {
    const counts = DAY_LABELS.map((_, i) => ({
      day: i,
      positive: 0,
      negative: 0,
      neutral: 0,
    }));
    filteredReviews.forEach((r) => {
      counts[r.day][r.sentiment] += 1;
    });
    return counts;
  }, [filteredReviews]);

  const totalsByLabel = useMemo(() => {
    const t = { positive: 0, negative: 0, neutral: 0 } as Record<Sentiment, number>;
    filteredReviews.forEach((r) => t[r.sentiment]++);
    return t;
  }, [filteredReviews]);

  const totalReviews = filteredReviews.length || 1;

  /* ── demo 3: tricky case reveal ────────────────── */
  const [trickyIdx, setTrickyIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const currentTricky = TRICKY_CASES[trickyIdx];

  function nextTricky() {
    setTrickyIdx((i) => (i + 1) % TRICKY_CASES.length);
    setRevealed(false);
  }

  return (
    <>
      {/* =================================================================
          BƯỚC 1 — DỰ ĐOÁN
          ================================================================= */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question={`Khách hàng viết trên Facebook: "Giao hàng nhanh, sản phẩm tốt nhưng đóng gói hơi sơ sài". Bạn sẽ gắn nhãn gì cho bình luận này?`}
          options={[
            "Hoàn toàn tích cực",
            "Tích cực pha lẫn tiêu cực (hỗn hợp)",
            "Hoàn toàn tiêu cực",
          ]}
          correct={1}
          explanation="Khách khen 'giao nhanh, sản phẩm tốt' nhưng chê nhẹ 'đóng gói sơ sài'. Ba lớp đơn giản (tích cực / tiêu cực / trung tính) không đủ — thực tế đội marketing cần nhìn cả hai mặt để cải thiện đúng chỗ."
        />
      </LessonSection>

      {/* =================================================================
          BƯỚC 2 — ẨN DỤ: AI đọc bình luận như người lướt Facebook
          ================================================================= */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Ẩn dụ">
        <div className="space-y-4">
          <p className="text-foreground leading-relaxed">
            Hãy nhớ lại lúc bạn lướt Facebook xem khách bình luận trên trang của
            công ty mình. Chỉ cần liếc qua là bạn biết khách đang <strong>khen</strong>,{" "}
            <strong>chê</strong>, hay chỉ <strong>hỏi giá</strong>. Bộ não bạn đọc
            mấy chục bình luận/phút đã mệt — AI làm đúng việc đó cho{" "}
            <strong>hàng triệu bình luận mỗi giờ</strong>, liên tục, không cần cà
            phê.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: ThumbsUp,
                label: "Tích cực",
                example: '"Shop nhiệt tình, hàng đẹp, sẽ quay lại!"',
                color: "#22c55e",
              },
              {
                icon: ThumbsDown,
                label: "Tiêu cực",
                example: '"Giao hàng chậm, sản phẩm bị lỗi, thất vọng."',
                color: "#ef4444",
              },
              {
                icon: Minus,
                label: "Trung tính",
                example: '"Shop còn size M không ạ?"',
                color: "#f59e0b",
              },
            ].map(({ icon: Icon, label, example, color }) => (
              <div
                key={label}
                className="rounded-xl border p-4"
                style={{ borderColor: color + "50", backgroundColor: color + "10" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={18} style={{ color }} />
                  <p className="text-sm font-bold" style={{ color }}>
                    {label}
                  </p>
                </div>
                <p className="text-xs text-foreground italic leading-relaxed">
                  {example}
                </p>
              </div>
            ))}
          </div>

          <Callout variant="insight" title="Vì sao marketer cần AI cho việc này?">
            <p>
              Một trang Facebook của ngân hàng có thể nhận 30.000 bình luận/ngày.
              Một thương hiệu Shopee top 100 có 500.000 review đang tồn. Không đội
              nhân sự nào đọc nổi. AI làm việc{" "}
              <strong>gom nhóm khen–chê theo giờ</strong> để bạn biết lúc nào cần
              vào cứu lửa.
            </p>
          </Callout>
        </div>
      </LessonSection>

      {/* =================================================================
          BƯỚC 3 — BA DEMO TRỰC QUAN
          ================================================================= */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Trực quan hóa">
        <VisualizationSection topicSlug={metadata.slug}>
          <div className="space-y-10">
            {/* ─── DEMO 1: Live classifier ─── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageCircle size={16} className="text-accent" />
                <h3 className="text-sm font-semibold text-foreground">
                  Demo 1 · Máy đọc bình luận của bạn
                </h3>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Gõ một bình luận tiếng Việt bất kỳ. Máy tô từ tích cực (xanh),
                tiêu cực (đỏ), và từ đảo ngữ như &ldquo;không&rdquo; (cam) — rồi
                tổng hợp thành một nhãn.
              </p>

              <textarea
                value={text}
                onChange={onChangeText}
                rows={2}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none resize-none"
                placeholder="Viết bình luận tiếng Việt..."
              />

              <div className="rounded-xl border border-border bg-background/50 p-4">
                <p className="text-[11px] uppercase tracking-wide text-muted mb-2">
                  Máy đang nhìn
                </p>
                <p className="text-sm leading-loose">
                  {analysis.tokens.length === 0 ? (
                    <span className="text-muted italic">
                      (chưa có nội dung)
                    </span>
                  ) : (
                    analysis.tokens.map((t, i) => {
                      const cls =
                        t.kind === "pos"
                          ? "bg-green-500/20 text-green-700 dark:text-green-400 font-semibold"
                          : t.kind === "neg"
                            ? "bg-red-500/20 text-red-600 dark:text-red-400 font-semibold"
                            : t.kind === "negator"
                              ? "bg-orange-500/20 text-orange-600 dark:text-orange-400 font-semibold italic"
                              : "text-foreground";
                      return (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.02 }}
                          className={`inline-block rounded px-1 mx-0.5 ${cls}`}
                        >
                          {t.word}
                        </motion.span>
                      );
                    })
                  )}
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-[11px]">
                  <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                    <span className="inline-block w-3 h-3 rounded-sm bg-green-500/40" />
                    Tích cực: {analysis.pos}
                  </span>
                  <span className="flex items-center gap-1.5 text-red-500">
                    <span className="inline-block w-3 h-3 rounded-sm bg-red-500/40" />
                    Tiêu cực: {analysis.neg}
                  </span>
                  <span className="flex items-center gap-1.5 text-orange-500">
                    <span className="inline-block w-3 h-3 rounded-sm bg-orange-500/40" />
                    Đảo ngữ
                  </span>
                </div>
              </div>

              {/* thanh điểm */}
              <div>
                <div className="relative h-7 rounded-full overflow-hidden bg-gradient-to-r from-red-400 via-yellow-300 to-green-400">
                  <motion.div
                    className="absolute top-1/2 h-8 w-8 rounded-full bg-white border-2 border-foreground shadow"
                    animate={{
                      left: `${((analysis.score + 1) / 2) * 100}%`,
                      translateX: "-50%",
                      translateY: "-50%",
                    }}
                    transition={{ type: "spring", stiffness: 120, damping: 14 }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-muted">
                  <span>Rất tiêu cực</span>
                  <span>Trung tính</span>
                  <span>Rất tích cực</span>
                </div>
              </div>

              {/* thanh độ tin */}
              <div className="grid grid-cols-3 gap-2">
                {(["positive", "neutral", "negative"] as Sentiment[]).map((s) => {
                  const total = analysis.pos + analysis.neg || 1;
                  let conf =
                    s === "positive"
                      ? analysis.pos / total
                      : s === "negative"
                        ? analysis.neg / total
                        : Math.max(0, 1 - (analysis.pos + analysis.neg) / Math.max(4, analysis.tokens.length));
                  conf = Math.min(1, conf);
                  const isPick = s === analysis.sentiment;
                  return (
                    <div
                      key={s}
                      className="rounded-lg border p-3"
                      style={{
                        borderColor: isPick
                          ? SENTIMENT_COLOR[s]
                          : "rgba(120,120,120,0.2)",
                        backgroundColor: isPick
                          ? SENTIMENT_COLOR[s] + "12"
                          : "transparent",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="text-xs font-semibold"
                          style={{ color: SENTIMENT_COLOR[s] }}
                        >
                          {SENTIMENT_LABEL[s]}
                        </span>
                        <span
                          className="text-xs font-bold"
                          style={{ color: SENTIMENT_COLOR[s] }}
                        >
                          {Math.round(conf * 100)}%
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-surface overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          animate={{ width: `${conf * 100}%` }}
                          transition={{ duration: 0.4 }}
                          style={{ backgroundColor: SENTIMENT_COLOR[s] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ─── DEMO 2: Tone of voice dashboard ─── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Gauge size={16} className="text-accent" />
                <h3 className="text-sm font-semibold text-foreground">
                  Demo 2 · Dashboard cảm xúc theo tuần (mô phỏng Shopee / Lazada / Tiki)
                </h3>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                15 review giả trong 7 ngày, đã được gán nhãn sẵn. Lọc theo sàn để
                xem thương hiệu của bạn đang ở đâu.
              </p>

              {/* nút lọc */}
              <div className="flex flex-wrap gap-2">
                {(["all", "Shopee", "Lazada", "Tiki"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSourceFilter(s)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      sourceFilter === s
                        ? "bg-accent text-white"
                        : "bg-surface text-muted hover:bg-surface-hover"
                    }`}
                  >
                    {s === "all" ? "Tất cả sàn" : s}
                  </button>
                ))}
              </div>

              {/* 3 chỉ số chính */}
              <div className="grid grid-cols-3 gap-2">
                {(["positive", "neutral", "negative"] as Sentiment[]).map((s) => {
                  const pct = Math.round((totalsByLabel[s] / totalReviews) * 100);
                  return (
                    <div
                      key={s}
                      className="rounded-xl border p-3 text-center"
                      style={{
                        borderColor: SENTIMENT_COLOR[s] + "40",
                        backgroundColor: SENTIMENT_COLOR[s] + "10",
                      }}
                    >
                      <p
                        className="text-lg font-bold"
                        style={{ color: SENTIMENT_COLOR[s] }}
                      >
                        {pct}%
                      </p>
                      <p className="text-[10px] text-muted uppercase tracking-wide">
                        {SENTIMENT_LABEL[s]}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* stacked bar chart theo ngày */}
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted mb-2">
                  Phân bố cảm xúc theo ngày
                </p>
                <div className="grid grid-cols-7 gap-2">
                  {dailyCounts.map((d) => {
                    const total = d.positive + d.neutral + d.negative || 1;
                    return (
                      <div key={d.day} className="flex flex-col items-center gap-1">
                        <div className="h-32 w-full rounded-md overflow-hidden bg-surface flex flex-col-reverse">
                          <motion.div
                            layout
                            className="w-full"
                            style={{ backgroundColor: SENTIMENT_COLOR.positive }}
                            animate={{
                              height: `${(d.positive / total) * 100}%`,
                            }}
                            transition={{ duration: 0.5 }}
                          />
                          <motion.div
                            layout
                            className="w-full"
                            style={{ backgroundColor: SENTIMENT_COLOR.neutral }}
                            animate={{
                              height: `${(d.neutral / total) * 100}%`,
                            }}
                            transition={{ duration: 0.5 }}
                          />
                          <motion.div
                            layout
                            className="w-full"
                            style={{ backgroundColor: SENTIMENT_COLOR.negative }}
                            animate={{
                              height: `${(d.negative / total) * 100}%`,
                            }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                        <p className="text-[10px] text-muted">{DAY_LABELS[d.day]}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* danh sách review đang hiển thị */}
              <div className="space-y-2">
                {filteredReviews.slice(0, 4).map((r, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm"
                    style={{ borderLeft: `3px solid ${SENTIMENT_COLOR[r.sentiment]}` }}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted shrink-0 pt-0.5 w-12">
                      {r.source}
                    </span>
                    <div className="flex gap-0.5 shrink-0 pt-0.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star
                          key={j}
                          size={10}
                          className={
                            j < r.stars
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-surface"
                          }
                        />
                      ))}
                    </div>
                    <p className="flex-1 text-foreground">{r.text}</p>
                    <span
                      className="text-[10px] font-bold shrink-0 px-2 py-0.5 rounded-full"
                      style={{
                        color: SENTIMENT_COLOR[r.sentiment],
                        backgroundColor: SENTIMENT_COLOR[r.sentiment] + "15",
                      }}
                    >
                      {SENTIMENT_LABEL[r.sentiment]}
                    </span>
                  </div>
                ))}
              </div>

              <Callout variant="tip" title="Trong thực tế">
                <p>
                  Khi nhãn tiêu cực vọt lên 30%+ trong vài giờ, đội truyền thông
                  nhận cảnh báo ngay. Đó chính là lý do Brandwatch hay YouNet
                  Media bán được nhiều: AI phát hiện khủng hoảng trước khi báo chí
                  đăng.
                </p>
              </Callout>
            </div>

            {/* ─── DEMO 3: Tricky cases ─── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" />
                <h3 className="text-sm font-semibold text-foreground">
                  Demo 3 · Khi máy dễ đoán sai
                </h3>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Chọn một câu khó, đoán xem máy đếm-từ sẽ ra kết quả gì, rồi so
                với nghĩa thật.
              </p>

              <div className="rounded-xl border border-border bg-background/50 p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <Quote size={18} className="text-muted shrink-0 mt-1" />
                  <p className="text-base font-medium text-foreground flex-1">
                    &ldquo;{currentTricky.text}&rdquo;
                  </p>
                </div>

                <AnimatePresence mode="wait">
                  {!revealed ? (
                    <motion.button
                      key="reveal"
                      type="button"
                      onClick={() => setRevealed(true)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full rounded-lg border border-dashed border-border py-3 text-sm text-muted hover:border-accent hover:text-accent"
                    >
                      Nhấn để xem máy đếm-từ và người thật đoán gì
                    </motion.button>
                  ) : (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid gap-3 sm:grid-cols-2"
                    >
                      <div
                        className="rounded-lg border p-3"
                        style={{
                          borderColor: SENTIMENT_COLOR[currentTricky.naive] + "40",
                          backgroundColor: SENTIMENT_COLOR[currentTricky.naive] + "10",
                        }}
                      >
                        <p className="text-[10px] uppercase tracking-wide text-muted">
                          Máy đếm-từ
                        </p>
                        <p
                          className="text-base font-bold mt-1"
                          style={{ color: SENTIMENT_COLOR[currentTricky.naive] }}
                        >
                          {SENTIMENT_LABEL[currentTricky.naive]}
                        </p>
                      </div>
                      <div
                        className="rounded-lg border p-3"
                        style={{
                          borderColor: SENTIMENT_COLOR[currentTricky.correct] + "40",
                          backgroundColor: SENTIMENT_COLOR[currentTricky.correct] + "10",
                        }}
                      >
                        <p className="text-[10px] uppercase tracking-wide text-muted">
                          Con người đọc ra
                        </p>
                        <p
                          className="text-base font-bold mt-1"
                          style={{ color: SENTIMENT_COLOR[currentTricky.correct] }}
                        >
                          {SENTIMENT_LABEL[currentTricky.correct]}
                        </p>
                      </div>
                      <div className="sm:col-span-2 rounded-lg bg-surface/60 p-3 text-xs text-foreground leading-relaxed">
                        <strong>Tại sao lệch:</strong> {currentTricky.note}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex justify-between text-xs">
                  <span className="text-muted">
                    Câu {trickyIdx + 1} / {TRICKY_CASES.length}
                  </span>
                  <button
                    type="button"
                    onClick={nextTricky}
                    className="rounded-full bg-accent text-white px-3 py-1 font-semibold hover:opacity-90"
                  >
                    Câu khó tiếp theo →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* =================================================================
          BƯỚC 4 — AHA MOMENT
          ================================================================= */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          <p>
            Cảm xúc tiếng Việt <strong>không bao giờ chỉ là đếm từ xấu / từ đẹp</strong>.
            &ldquo;Không tệ&rdquo; là khen. &ldquo;Nhiệt tình lắm nhé, nhắn ba ngày
            không rep&rdquo; là chửi. Máy muốn hiểu đúng phải đọc cả câu, cả
            ngữ cảnh, và đôi khi cả emoji.
          </p>
          <p className="text-sm text-muted mt-2">
            Đó là lý do các mô hình hiện đại (BERT, PhoBERT, LLM) thay thế cách
            làm cũ — chúng không đếm, chúng đọc.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* =================================================================
          BƯỚC 5 — CHALLENGE NHANH
          ================================================================= */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question={`Khách comment trên fanpage nhà hàng: "Món phở OK thôi, không có gì đặc biệt, nhưng nhân viên dễ thương". Nếu bạn làm aspect-based sentiment cho nhà hàng này, bạn sẽ gán?`}
          options={[
            "Món ăn: tiêu cực · Phục vụ: tích cực",
            "Món ăn: trung tính · Phục vụ: tích cực",
            "Cả hai: tiêu cực",
            "Cả hai: trung tính",
          ]}
          correct={1}
          explanation="'OK thôi, không có gì đặc biệt' là trung tính (không chê thẳng). 'Nhân viên dễ thương' là tích cực rõ. Aspect-based tách riêng để nhà hàng biết chỗ nào cần giữ, chỗ nào cần nâng cấp."
        />
      </LessonSection>

      {/* =================================================================
          BƯỚC 6 — GIẢI THÍCH SÂU (visual-heavy)
          ================================================================= */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích">
        <ExplanationSection>
          <p className="leading-relaxed">
            Phân tích cảm xúc là một dạng riêng của{" "}
            <TopicLink slug="text-classification">phân loại văn bản</TopicLink>{" "}
            — thay vì gán nhãn &ldquo;thể thao / kinh tế&rdquo;, ta gán nhãn
            &ldquo;tích cực / tiêu cực&rdquo;. Marketer cần hiểu ba dòng công
            nghệ sau để chọn đúng công cụ.
          </p>

          {/* Ba kỹ thuật — thẻ Callout */}
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-blue-500" />
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  1. Từ điển (Lexicon)
                </p>
              </div>
              <p className="text-xs text-foreground leading-relaxed">
                Có một danh sách &ldquo;từ tích cực&rdquo; và &ldquo;từ tiêu cực&rdquo;
                sẵn. Máy đếm và so điểm.
              </p>
              <div className="text-[10px] text-muted">
                <p><strong>Rẻ · nhanh</strong></p>
                <p>Trật với đảo ngữ, mỉa mai, phương ngữ.</p>
              </div>
            </div>

            <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-accent" />
                <p className="text-sm font-bold text-accent">
                  2. Máy học cổ điển
                </p>
              </div>
              <p className="text-xs text-foreground leading-relaxed">
                Máy học từ vài nghìn review đã gắn nhãn (Naive Bayes, SVM, Logistic).
                Tốt hơn từ điển, vẫn chưa hiểu ngữ cảnh.
              </p>
              <div className="text-[10px] text-muted">
                <p><strong>Độ chính xác 75–85%</strong> trong lĩnh vực quen.</p>
              </div>
            </div>

            <div className="rounded-xl border-2 border-green-400/50 bg-green-50/40 dark:bg-green-900/10 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-green-600" />
                <p className="text-sm font-bold text-green-700 dark:text-green-400">
                  3. LLM / BERT
                </p>
              </div>
              <p className="text-xs text-foreground leading-relaxed">
                Đọc cả câu, hiểu đảo ngữ, phát hiện mỉa mai. PhoBERT cho tiếng Việt,
                GPT-4 đa ngôn ngữ.
              </p>
              <div className="text-[10px] text-muted">
                <p><strong>85–95%</strong> — tốt nhất hiện nay.</p>
              </div>
            </div>
          </div>

          {/* so sánh lexicon vs LLM bằng toggle */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">
              So sánh trực tiếp trên cùng câu tiếng Việt
            </p>
            <ToggleCompare
              labelA="Từ điển đếm từ"
              labelB="PhoBERT hiểu ngữ cảnh"
              description="Cùng một câu, hai cách đọc — bên nào giống đồng nghiệp của bạn hơn?"
              childA={
                <div className="space-y-2">
                  {[
                    { text: "Không tệ lắm", out: "Tiêu cực", wrong: true },
                    { text: "Phở dở òm", out: "Tiêu cực", wrong: false },
                    { text: "Haha hàng giả chất lượng cao quá", out: "Tích cực", wrong: true },
                    { text: "Ship siêu nhanh 🙄", out: "Tích cực", wrong: true },
                  ].map((r) => (
                    <div
                      key={r.text}
                      className="flex items-center justify-between rounded-lg border border-border p-2 text-xs"
                    >
                      <span className="text-foreground">{r.text}</span>
                      <span
                        className={`font-bold ${r.wrong ? "text-red-500" : "text-green-500"}`}
                      >
                        {r.out} {r.wrong ? "✗" : "✓"}
                      </span>
                    </div>
                  ))}
                </div>
              }
              childB={
                <div className="space-y-2">
                  {[
                    { text: "Không tệ lắm", out: "Tích cực", wrong: false },
                    { text: "Phở dở òm", out: "Tiêu cực", wrong: false },
                    { text: "Haha hàng giả chất lượng cao quá", out: "Tiêu cực (mỉa mai)", wrong: false },
                    { text: "Ship siêu nhanh 🙄", out: "Tiêu cực (mỉa mai)", wrong: false },
                  ].map((r) => (
                    <div
                      key={r.text}
                      className="flex items-center justify-between rounded-lg border border-border p-2 text-xs"
                    >
                      <span className="text-foreground">{r.text}</span>
                      <span
                        className={`font-bold ${r.wrong ? "text-red-500" : "text-green-500"}`}
                      >
                        {r.out} ✓
                      </span>
                    </div>
                  ))}
                </div>
              }
            />
          </div>

          {/* Thách thức tiếng Việt cụ thể */}
          <Callout variant="warning" title="Năm cái bẫy đặc trưng của tiếng Việt">
            <div className="grid gap-3 sm:grid-cols-2 mt-2">
              <div className="flex gap-2">
                <Languages size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold">Dấu thanh</p>
                  <p className="text-[11px] text-muted">
                    &ldquo;chán&rdquo; vs &ldquo;chan&rdquo; khác hẳn nghĩa. Mô
                    hình không-có-dấu trật rất nhiều.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Globe size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold">Phương ngữ</p>
                  <p className="text-[11px] text-muted">
                    &ldquo;Ngon lành cành đào&rdquo; (Bắc), &ldquo;hết sẩy&rdquo;
                    (Nam) — phải có dữ liệu cả ba miền.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <MessageCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold">Viết tắt mạng</p>
                  <p className="text-[11px] text-muted">
                    &ldquo;ko&rdquo;, &ldquo;đc&rdquo;, &ldquo;sl&rdquo;,
                    &ldquo;ship&rdquo;, &ldquo;nv&rdquo; — nếu tokenizer không
                    biết là sai ngay.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Flame size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold">Mỉa mai</p>
                  <p className="text-[11px] text-muted">
                    &ldquo;5 sao cho ship chậm&rdquo; — cả BERT lẫn GPT vẫn hay sai.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <ShieldAlert size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold">Emoji &amp; icon</p>
                  <p className="text-[11px] text-muted">
                    ❤️ ≠ 🙄. Emoji là tín hiệu cảm xúc cực mạnh, mô hình phải
                    đọc được, không bỏ qua.
                  </p>
                </div>
              </div>
            </div>
          </Callout>

          {/* Ứng dụng cho dân văn phòng */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">
              Marketer &amp; dân văn phòng dùng phân tích cảm xúc ở đâu?
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                {
                  icon: TrendingUp,
                  title: "Giám sát thương hiệu",
                  desc: "Theo dõi khen chê trên Facebook, TikTok, Shopee theo thời gian thực.",
                  color: "#6366f1",
                },
                {
                  icon: BadgeCheck,
                  title: "Đánh giá chiến dịch",
                  desc: "Trước và sau campaign: tỉ lệ bình luận tích cực đã tăng bao nhiêu?",
                  color: "#14b8a6",
                },
                {
                  icon: Smile,
                  title: "Phân tích khảo sát",
                  desc: "Hàng nghìn câu trả lời tự luận của nhân viên hoặc khách — gom lại trong vài phút.",
                  color: "#22c55e",
                },
                {
                  icon: Frown,
                  title: "Cảnh báo khủng hoảng",
                  desc: "Tiêu cực vọt 30% trong 2 giờ → đội PR nhận cảnh báo qua Slack.",
                  color: "#ef4444",
                },
                {
                  icon: Meh,
                  title: "Review nội bộ",
                  desc: "Phân loại feedback hội thảo, eNPS, đánh giá 360°.",
                  color: "#f59e0b",
                },
                {
                  icon: Lightbulb,
                  title: "Insight sản phẩm",
                  desc: "Aspect-based tách riêng: giá, chất lượng, ship, dịch vụ — để đội sản phẩm biết sửa gì trước.",
                  color: "#a855f7",
                },
              ].map((u) => (
                <div
                  key={u.title}
                  className="rounded-xl border p-3 bg-card"
                  style={{ borderColor: u.color + "30" }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <u.icon size={14} style={{ color: u.color }} />
                    <p className="text-xs font-bold" style={{ color: u.color }}>
                      {u.title}
                    </p>
                  </div>
                  <p className="text-[11px] text-muted leading-relaxed">
                    {u.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* MatchPairs: nối review với nhãn */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">
              Nối nhanh — kiểm tra cảm nhận của bạn
            </p>
            <MatchPairs
              instruction="Nối mỗi review (Cột A) với nhãn đúng (Cột B)."
              pairs={[
                { left: '"Shop siêu cute, hàng cute, ship cute 💕"', right: "Tích cực" },
                { left: '"Order 5 ngày chưa nhận được, liên hệ không ai rep"', right: "Tiêu cực" },
                { left: '"Shop còn size M màu đen không ạ?"', right: "Trung tính (câu hỏi)" },
                { left: '"Chất lượng tuyệt vời 🙃 dùng 2 hôm là rách"', right: "Tiêu cực (mỉa mai)" },
              ]}
            />
          </div>
        </ExplanationSection>
      </LessonSection>

      {/* =================================================================
          BƯỚC 7 — TÓM TẮT
          ================================================================= */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về phân tích cảm xúc"
          points={[
            "AI đọc bình luận rồi gán tích cực / tiêu cực / trung tính — giống bạn lướt Facebook, nhưng chạy ở quy mô triệu bình luận.",
            "Aspect-based tách riêng từng khía cạnh (món ăn, ship, giá) — giúp biết chỗ nào cần sửa trước.",
            "Từ điển đếm từ rẻ nhưng sai với đảo ngữ (‘không tệ’), mỉa mai, emoji.",
            "BERT / PhoBERT / LLM đọc cả câu, đạt 85–95% — mạnh nhất hiện nay với tiếng Việt.",
            "Ứng dụng văn phòng: giám sát thương hiệu, đánh giá chiến dịch, phân tích khảo sát, cảnh báo khủng hoảng.",
          ]}
        />
      </LessonSection>

      {/* =================================================================
          BƯỚC 8 — QUIZ
          ================================================================= */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
