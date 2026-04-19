"use client";

import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Brain,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Vote,
} from "lucide-react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  LessonSection,
  TopicLink,
  StepReveal,
  CollapsibleDetail,
  LaTeX,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "naive-bayes",
  title: "Naive Bayes",
  titleVi: "Naive Bayes — Cộng dồn bằng chứng",
  description:
    "Khi có nhiều manh mối độc lập cùng trỏ về một kết luận, bạn tự tin hơn hẳn. Naive Bayes biến trực giác đó thành phép nhân xác suất đơn giản.",
  category: "classic-ml",
  tags: ["classification", "probability", "supervised-learning"],
  difficulty: "intermediate",
  relatedSlugs: ["logistic-regression", "decision-trees", "confusion-matrix"],
  vizType: "interactive",
};

/* ────────────────────────────────────────────────────────────
   DỮ LIỆU: 8 từ khoá mẫu, mỗi từ có P(từ|Spam) và P(từ|Ham).
   ──────────────────────────────────────────────────────────── */

interface Word {
  text: string;
  pSpam: number;
  pHam: number;
  flavor: "spammy" | "worky" | "neutral";
}

const WORDS: Word[] = [
  { text: "khuyến mãi", pSpam: 0.72, pHam: 0.08, flavor: "spammy" },
  { text: "miễn phí", pSpam: 0.65, pHam: 0.06, flavor: "spammy" },
  { text: "trúng thưởng", pSpam: 0.82, pHam: 0.02, flavor: "spammy" },
  { text: "nhấn vào đây", pSpam: 0.78, pHam: 0.04, flavor: "spammy" },
  { text: "họp", pSpam: 0.05, pHam: 0.58, flavor: "worky" },
  { text: "báo cáo", pSpam: 0.07, pHam: 0.54, flavor: "worky" },
  { text: "deadline", pSpam: 0.04, pHam: 0.48, flavor: "worky" },
  { text: "dự án", pSpam: 0.06, pHam: 0.52, flavor: "worky" },
];

const PRIOR_SPAM = 0.35;

function classify(active: string[]) {
  const priorHam = 1 - PRIOR_SPAM;
  let logSpam = Math.log(PRIOR_SPAM);
  let logHam = Math.log(priorHam);
  const contributions: {
    word: string;
    pSpam: number;
    pHam: number;
    present: boolean;
  }[] = [];

  for (const w of WORDS) {
    const present = active.includes(w.text);
    if (present) {
      logSpam += Math.log(w.pSpam);
      logHam += Math.log(w.pHam);
      contributions.push({
        word: w.text,
        pSpam: w.pSpam,
        pHam: w.pHam,
        present: true,
      });
    } else {
      logSpam += Math.log(1 - w.pSpam);
      logHam += Math.log(1 - w.pHam);
    }
  }

  const maxLog = Math.max(logSpam, logHam);
  const uSpam = Math.exp(logSpam - maxLog);
  const uHam = Math.exp(logHam - maxLog);
  const total = uSpam + uHam;
  return {
    pSpamFinal: uSpam / total,
    pHamFinal: uHam / total,
    contributions,
    prediction: uSpam > uHam ? ("SPAM" as const) : ("HAM" as const),
  };
}

/* ────────────────────────────────────────────────────────────
   QUIZ
   ──────────────────────────────────────────────────────────── */

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Tại sao Naive Bayes được gọi là 'ngây thơ' (naive)?",
    options: [
      "Vì thuật toán quá đơn giản so với mạng nơ-ron",
      "Vì giả định các từ độc lập nhau — trên thực tế hiếm khi đúng, nhưng vẫn cho kết quả ngạc nhiên",
      "Vì chỉ dùng được cho dữ liệu nhỏ",
      "Vì không cần huấn luyện",
    ],
    correct: 1,
    explanation:
      "Trong thực tế, 'khuyến mãi' và 'miễn phí' rõ ràng không độc lập — email spam thường có cả hai. Nhưng Naive Bayes vẫn giả định chúng độc lập để đơn giản hoá phép nhân. Sự 'ngây thơ' đó vẫn cho ra bộ lọc spam hoạt động tốt.",
  },
  {
    question:
      "Email chứa đúng một từ là 'blockchain' — từ mà bộ dữ liệu huấn luyện chưa từng thấy trong lớp Spam, vì vậy P(blockchain|Spam) = 0. Chuyện gì xảy ra nếu không có kỹ thuật làm mượt?",
    options: [
      "Không ảnh hưởng, thuật toán bỏ qua từ đó",
      "Toàn bộ tích bằng 0 — P(Spam|email) = 0 dù có bao nhiêu bằng chứng khác",
      "Thuật toán báo lỗi và dừng",
      "Xác suất Spam tự động bằng 100%",
    ],
    correct: 1,
    explanation:
      "Một số hạng bằng 0 trong phép nhân làm tích về 0 ngay lập tức. Laplace smoothing thêm +1 vào mọi đếm để không có xác suất nào bằng 0 — đó là lý do scikit-learn luôn bật smoothing mặc định.",
  },
  {
    type: "fill-blank",
    question:
      "Khi nhân nhiều xác suất rất nhỏ, kết quả tiến về 0 trên máy tính (underflow). Để tránh, Naive Bayes dùng {blank} của xác suất — biến phép nhân thành phép {blank}.",
    blanks: [
      { answer: "logarit", accept: ["log", "logarithm", "log xác suất"] },
      { answer: "cộng", accept: ["tổng", "cộng dồn", "sum"] },
    ],
    explanation:
      "log(a × b) = log(a) + log(b). Thay vì nhân 10 số rất nhỏ (nguy cơ tiến về 0), ta cộng 10 giá trị log (ổn định). Sau khi so sánh log P(Spam) với log P(Ham), số nào lớn hơn là lớp được chọn.",
  },
  {
    question:
      "Một email có cả 'khuyến mãi' và 'báo cáo'. Naive Bayes sẽ quyết định thế nào?",
    options: [
      "Chắc chắn là SPAM vì có từ 'khuyến mãi'",
      "Chắc chắn là HAM vì có từ 'báo cáo'",
      "Nhân tất cả xác suất từ + prior, so sánh hai phía — kết quả phụ thuộc độ mạnh của từng bằng chứng",
      "Không thể phân loại",
    ],
    correct: 2,
    explanation:
      "Naive Bayes không để một từ duy nhất quyết định. Nó cộng dồn (qua phép nhân xác suất) mọi bằng chứng, kể cả từ nhẹ. Khi có bằng chứng hai phía, phía có xác suất lớn hơn thắng — đôi khi sát nút, đôi khi áp đảo.",
  },
];

/* ────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ──────────────────────────────────────────────────────────── */

export default function NaiveBayesTopic() {
  const [active, setActive] = useState<string[]>([
    "khuyến mãi",
    "miễn phí",
  ]);

  const toggleWord = useCallback((w: string) => {
    setActive((prev) =>
      prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w],
    );
  }, []);

  const result = useMemo(() => classify(active), [active]);

  const spamPct = (result.pSpamFinal * 100).toFixed(1);
  const hamPct = (result.pHamFinal * 100).toFixed(1);
  const predictionColor =
    result.prediction === "SPAM" ? "#ef4444" : "#22c55e";

  return (
    <>
      {/* BƯỚC 1 — DỰ ĐOÁN */}
      <LessonSection step={1} totalSteps={8} label="Thử đoán">
        <PredictionGate
          question="Ba người bạn thân, không hẹn nhau, cùng nhắn bạn: 'Tiệm phở góc đường ngon lắm, đi thử đi.' Bạn đi hay không đi?"
          options={[
            "Bỏ qua — chỉ là ba ý kiến cá nhân, chưa đủ chứng minh gì",
            "Đi — ba ý kiến độc lập cùng trỏ về một kết luận nên có trọng lượng lớn hơn một ý kiến đơn lẻ",
            "Phải nếm thử mới biết, ý kiến bạn bè không có ý nghĩa",
            "Hỏi thêm ý kiến thứ tư rồi mới quyết định",
          ]}
          correct={1}
          explanation="Chính xác — não bạn tự động cộng dồn bằng chứng độc lập. Mỗi lời khen là một manh mối nhỏ; ba manh mối cùng chiều khiến bạn tự tin hơn hẳn. Naive Bayes hoạt động chính xác theo cách này — nhưng nó nhân các xác suất lại một cách có hệ thống."
        >
          <p className="text-sm text-muted mt-4 leading-relaxed">
            Nếu bạn đã từng <em>tự động</em> thấy chắc chắn hơn khi có nhiều
            bằng chứng cùng chiều, bạn đã dùng một dạng của Naive Bayes
            trong đầu. Cả bài này biến trực giác đó thành một phép tính đơn
            giản mà máy tính có thể thực hiện trên hàng triệu email mỗi giây.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* BƯỚC 2 — ẨN DỤ */}
      <LessonSection step={2} totalSteps={8} label="Hiểu bằng hình ảnh">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Vote size={20} className="text-accent" /> Mỗi bằng chứng là một lá phiếu
          </h3>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Tưởng tượng bạn đang phân loại email. Mỗi từ trong email là{" "}
            <strong>một lá phiếu</strong> — nhưng không phải ai cũng có
            sức nặng bằng nhau. Từ &ldquo;trúng thưởng&rdquo; cầm tấm thẻ
            to tướng: <em>80% email chứa từ này là spam</em>. Từ &ldquo;họp&rdquo;
            cầm thẻ ngược chiều: <em>58% email chứa từ này là công việc</em>.
          </p>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Naive Bayes <strong>cộng dồn</strong> tất cả lá phiếu. Không để
            một lá phiếu lớn quyết định mọi thứ — nếu email chứa cả &ldquo;trúng
            thưởng&rdquo; lẫn &ldquo;báo cáo&rdquo;, thuật toán so sánh
            hai phe xem bên nào mạnh hơn.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
            <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-4 space-y-1">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <AlertTriangle size={16} />
                <span className="text-sm font-semibold">Từ rất &ldquo;spam&rdquo;</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                trúng thưởng, miễn phí, nhấn vào đây — mỗi từ là lá phiếu
                nặng nghiêng về SPAM.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-4 space-y-1">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <ShieldCheck size={16} />
                <span className="text-sm font-semibold">Từ rất &ldquo;công việc&rdquo;</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                họp, báo cáo, deadline — lá phiếu nặng nghiêng về HAM
                (email hợp lệ).
              </p>
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50 dark:bg-sky-900/20 dark:border-sky-800 p-4 space-y-1">
              <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300">
                <Brain size={16} />
                <span className="text-sm font-semibold">Quyết định cuối</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Nhân xác suất từng từ với prior — so sánh hai phe — phe
                lớn hơn thắng.
              </p>
            </div>
          </div>
        </div>
      </LessonSection>

      {/* BƯỚC 3 — TRỰC QUAN HOÁ */}
      <LessonSection step={3} totalSteps={8} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <LessonSection label="Thử nghiệm: Bật/tắt từng từ trong email" step={1}>
            <p className="text-sm text-muted mb-4 leading-relaxed">
              Chọn các từ bạn tưởng tượng có trong email. Mỗi khi bạn bật
              thêm một từ, xác suất P(Spam) và P(Ham) cập nhật tức thì.
              Quan sát thanh đỏ và thanh xanh &ldquo;giằng co&rdquo; lẫn
              nhau theo từng bằng chứng.
            </p>

            {/* Chọn từ */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 mb-5">
              {WORDS.map((w) => {
                const on = active.includes(w.text);
                const spammy = w.flavor === "spammy";
                return (
                  <button
                    key={w.text}
                    type="button"
                    onClick={() => toggleWord(w.text)}
                    className={`rounded-xl border px-3 py-2.5 text-xs font-medium text-left transition-all ${
                      on
                        ? spammy
                          ? "border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-700"
                          : "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-700"
                        : "border-border bg-card hover:border-accent/40"
                    }`}
                    aria-pressed={on}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      {on ? (
                        <CheckCircle2
                          size={12}
                          className={
                            spammy
                              ? "text-red-600 dark:text-red-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }
                        />
                      ) : (
                        <span className="inline-block h-3 w-3 rounded-full border border-border" />
                      )}
                      <span
                        className={`font-semibold ${
                          on
                            ? spammy
                              ? "text-red-800 dark:text-red-200"
                              : "text-emerald-800 dark:text-emerald-200"
                            : "text-foreground"
                        }`}
                      >
                        {w.text}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-tertiary tabular-nums">
                      <span>S {(w.pSpam * 100).toFixed(0)}%</span>
                      <span>·</span>
                      <span>H {(w.pHam * 100).toFixed(0)}%</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Email simulation */}
            <div className="rounded-xl border border-border bg-surface/50 p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Mail size={14} className="text-muted" />
                <span className="text-[11px] font-semibold text-tertiary uppercase tracking-wide">
                  Email mô phỏng
                </span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {active.length > 0
                  ? `... ${active.join(" ... ")} ...`
                  : "(Chưa chọn từ nào — bật ít nhất một từ ở trên)"}
              </p>
            </div>

            {/* Running product */}
            <div className="rounded-xl border-2 bg-card p-4 mb-4"
              style={{ borderColor: predictionColor + "60" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-tertiary uppercase tracking-wide">
                  Tích xác suất đang chạy
                </span>
                <span
                  className="text-sm font-bold px-2.5 py-1 rounded-full tabular-nums"
                  style={{
                    backgroundColor: predictionColor + "22",
                    color: predictionColor,
                  }}
                >
                  Dự đoán: {result.prediction}
                </span>
              </div>

              {/* Bar SPAM */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    P(SPAM | email)
                  </span>
                  <span className="font-bold tabular-nums text-red-600 dark:text-red-400">
                    {spamPct}%
                  </span>
                </div>
                <div className="h-3 rounded-full bg-red-100 dark:bg-red-900/30 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-red-500"
                    initial={false}
                    animate={{ width: `${result.pSpamFinal * 100}%` }}
                    transition={{ type: "spring", stiffness: 140, damping: 20 }}
                  />
                </div>
              </div>

              {/* Bar HAM */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    P(HAM | email)
                  </span>
                  <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {hamPct}%
                  </span>
                </div>
                <div className="h-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-emerald-500"
                    initial={false}
                    animate={{ width: `${result.pHamFinal * 100}%` }}
                    transition={{ type: "spring", stiffness: 140, damping: 20 }}
                  />
                </div>
              </div>
            </div>

            {/* Detailed contributions */}
            {result.contributions.length > 0 && (
              <div className="rounded-xl border border-border bg-surface/40 p-4">
                <p className="text-[11px] font-semibold text-tertiary uppercase tracking-wide mb-3">
                  Từng từ &ldquo;bỏ phiếu&rdquo; thế nào
                </p>
                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {result.contributions.map((c) => {
                      const ratio = c.pSpam / (c.pSpam + c.pHam);
                      const wSpam = ratio * 100;
                      return (
                        <motion.div
                          key={c.word}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 8 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center gap-3"
                        >
                          <span className="text-xs font-medium text-foreground w-28 shrink-0">
                            {c.word}
                          </span>
                          <div className="flex-1 h-2.5 rounded-full overflow-hidden bg-surface flex">
                            <motion.div
                              className="h-full bg-red-400"
                              initial={false}
                              animate={{ width: `${wSpam}%` }}
                              transition={{ duration: 0.3 }}
                            />
                            <motion.div
                              className="h-full bg-emerald-400"
                              initial={false}
                              animate={{ width: `${100 - wSpam}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                          <span className="text-[10px] text-tertiary tabular-nums w-16 text-right">
                            {c.pSpam > c.pHam ? "→ SPAM" : "→ HAM"}
                          </span>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
                <p className="text-[11px] text-muted mt-3 italic leading-relaxed">
                  Độ đỏ / xanh ở thanh ngang là tỉ lệ P(từ|Spam) so với
                  P(từ|Ham). Đỏ càng dài = từ đó là manh mối nghiêng về spam.
                </p>
              </div>
            )}
          </LessonSection>

          {/* Hướng dẫn thử nhanh */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() =>
                setActive(["khuyến mãi", "miễn phí", "trúng thưởng", "nhấn vào đây"])
              }
              className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 p-3 text-left hover:border-red-500"
            >
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={14} className="text-red-600 dark:text-red-400" />
                <span className="text-xs font-semibold text-red-800 dark:text-red-200">
                  Thử: email spam thuần
                </span>
              </div>
              <p className="text-[11px] text-foreground/80">
                Bật cả 4 từ spam — P(SPAM) tiến tới 99%.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setActive(["họp", "báo cáo", "deadline", "dự án"])}
              className="rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-700 p-3 text-left hover:border-emerald-500"
            >
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                  Thử: email công việc
                </span>
              </div>
              <p className="text-[11px] text-foreground/80">
                Bật cả 4 từ công việc — P(HAM) tiến tới 99%.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setActive(["khuyến mãi", "báo cáo"])}
              className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 p-3 text-left hover:border-amber-500"
            >
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={14} className="text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                  Thử: hỗn hợp khó
                </span>
              </div>
              <p className="text-[11px] text-foreground/80">
                1 từ spam + 1 từ công việc — kết quả sát nút.
              </p>
            </button>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* BƯỚC 4 — ĐI SÂU BẰNG STEPREVEAL */}
      <LessonSection step={4} totalSteps={8} label="Mổ xẻ một lần phân loại">
        <p className="text-sm text-muted mb-4 leading-relaxed">
          Bật &ldquo;Tiếp tục&rdquo; dưới đây để đi qua từng bước Naive
          Bayes xử lý một email cụ thể: &ldquo;trúng thưởng miễn phí nhấn
          vào đây&rdquo;. Mỗi bước vừa hiện công thức, vừa có thanh trực
          quan đi kèm.
        </p>

        <StepReveal
          labels={[
            "Bước 1: Prior — xác suất nền",
            "Bước 2: Mỗi từ góp một hệ số",
            "Bước 3: Nhân các hệ số với prior",
            "Bước 4: Chuẩn hoá — so sánh hai phe",
          ]}
        >
          {[
            <StepPrior key="s1" />,
            <StepEvidence key="s2" />,
            <StepMultiply key="s3" />,
            <StepNormalize key="s4" />,
          ]}
        </StepReveal>
      </LessonSection>

      {/* BƯỚC 5 — AHA */}
      <LessonSection step={5} totalSteps={8} label="Khoảnh khắc hiểu">
        <AhaMoment>
          Naive Bayes không &ldquo;hiểu&rdquo; ngôn ngữ. Nó chỉ{" "}
          <strong>đếm tần suất</strong> từng từ trong lớp Spam và lớp Ham,
          rồi dùng chính những con số đếm được để cho mỗi từ mới một{" "}
          <strong>lá phiếu</strong>.
          <br />
          <br />
          Sức mạnh của thuật toán đến từ <em>số lượng lá phiếu độc lập</em> —
          một email 50 từ là 50 lá phiếu cùng bỏ cho một quyết định. Ngay
          cả khi từng lá phiếu yếu, tổng hợp lại vẫn ra kết quả rõ ràng.
          Đó là lý do một thuật toán &ldquo;ngây thơ&rdquo; vẫn là xương
          sống của bộ lọc spam trong hơn hai mươi năm.
        </AhaMoment>

        {/* Visual: 1 strong vote vs many weak votes — side by side */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <p className="text-xs font-semibold text-tertiary uppercase tracking-wide">
              Một lá phiếu mạnh
            </p>
            <div className="flex items-center justify-center py-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <Vote size={24} className="text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="text-xs text-foreground/85 leading-relaxed">
              &ldquo;trúng thưởng&rdquo; — likelihood ratio 41:1. Một từ
              có thể đẩy P(Spam) lên cao, nhưng dễ sai khi email hỗn hợp.
            </p>
          </div>
          <div className="rounded-xl border border-accent/30 bg-accent-light p-4 space-y-2">
            <p className="text-xs font-semibold text-tertiary uppercase tracking-wide">
              Nhiều lá phiếu yếu
            </p>
            <div className="flex items-center justify-center gap-1.5 py-3 flex-wrap">
              {Array.from({ length: 9 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30"
                >
                  <Vote size={10} className="text-red-600 dark:text-red-400" />
                </motion.div>
              ))}
            </div>
            <p className="text-xs text-foreground/85 leading-relaxed">
              9 từ mỗi từ chỉ hơi nghiêng về spam (ratio 1.5:1). Tích
              lại: 1.5<sup>9</sup> ≈ 38:1 — mạnh ngang một từ &ldquo;trúng
              thưởng&rdquo; mà lại ổn định hơn.
            </p>
          </div>
        </div>
      </LessonSection>

      {/* BƯỚC 5.5 — So sánh hai loại lỗi */}
      <LessonSection label="Hai loại lỗi: false positive vs false negative">
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <p className="text-sm text-foreground/85 leading-relaxed">
            Khi bộ lọc sai, có hai kiểu sai khác hẳn nhau về hậu quả.
            Gmail chọn nghiêng về một kiểu — bạn đoán kiểu nào quan
            trọng hơn?
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl border-2 border-red-300 bg-red-50/60 dark:bg-red-900/20 dark:border-red-700 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-600 dark:text-red-400" />
                <span className="text-sm font-bold text-red-800 dark:text-red-200">
                  False positive (chặn nhầm)
                </span>
              </div>
              <p className="text-xs text-foreground/85 leading-relaxed">
                Bộ lọc nói &ldquo;SPAM&rdquo; nhưng thực tế là email
                quan trọng. Hậu quả: bạn không thấy email từ sếp,
                khách hàng, ngân hàng.
              </p>
              <p className="text-xs text-red-700 dark:text-red-300 font-semibold">
                Hậu quả tệ hơn — mất thông tin quan trọng.
              </p>
            </div>
            <div className="rounded-xl border-2 border-amber-300 bg-amber-50/60 dark:bg-amber-900/20 dark:border-amber-700 p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <Mail size={16} />
                <span className="text-sm font-bold">
                  False negative (lọt spam)
                </span>
              </div>
              <p className="text-xs text-foreground/85 leading-relaxed">
                Bộ lọc nói &ldquo;HAM&rdquo; nhưng thực tế là spam.
                Hậu quả: bạn thấy vài quảng cáo trong hộp thư đến.
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold">
                Hậu quả nhẹ hơn — chỉ khó chịu một chút.
              </p>
            </div>
          </div>

          <p className="text-xs text-muted italic leading-relaxed">
            Đó là lý do Gmail đặt ngưỡng quyết định{" "}
            <strong>rất cao</strong> (thường ≥ 0.9). Bộ lọc thà để lọt
            vài spam còn hơn chặn nhầm một email quan trọng. Tỉ lệ false
            positive thực tế &lt; 0.2% — tức cứ 1.000 email hợp lệ chỉ
            chặn nhầm 2.
          </p>
        </div>
      </LessonSection>

      {/* BƯỚC 6 — THỬ THÁCH */}
      <LessonSection step={6} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Giả định 'ngây thơ' trong Naive Bayes là gì, và vì sao nó vẫn cho kết quả tốt dù giả định đó hiếm khi đúng trong thực tế?"
          options={[
            "Giả định rằng mọi email đều là spam — vẫn hoạt động vì dataset thực tế có nhiều spam",
            "Giả định rằng các từ xuất hiện độc lập có điều kiện theo lớp — vẫn hoạt động vì quyết định cuối chỉ cần so sánh hai phía, nên ảnh hưởng của phụ thuộc thường triệt tiêu",
            "Giả định rằng prior luôn bằng 50% — không ảnh hưởng tới độ chính xác",
            "Không có giả định gì cả — Naive Bayes đơn giản chỉ đếm từ",
          ]}
          correct={1}
          explanation="Giả định 'ngây thơ' (naive) là: khi biết nhãn lớp, các từ xuất hiện độc lập nhau. Trong thực tế 'khuyến mãi' và 'miễn phí' thường đi cùng nhau — nhưng vì Naive Bayes chỉ cần so sánh log P(Spam|x) với log P(Ham|x), sai số do giả định độc lập thường ảnh hưởng gần như nhau hai phía, nên thứ tự xếp hạng vẫn đúng. Đó là lý do thuật toán 'sai về xác suất tuyệt đối' nhưng 'đúng về phân loại'."
        />
      </LessonSection>

      {/* BƯỚC 7 — GIẢI THÍCH */}
      <LessonSection step={7} totalSteps={8} label="Giải thích">
        <ExplanationSection>
          <p className="leading-relaxed">
            Naive Bayes xuất phát từ một công thức xác suất cổ điển — định lý{" "}
            <strong>Bayes</strong>. Công thức này cho phép bạn{" "}
            <strong>cập nhật niềm tin</strong> khi có bằng chứng mới:
          </p>

          <LaTeX block>{"P(c \\mid \\mathbf{x}) = \\frac{P(\\mathbf{x} \\mid c) \\, P(c)}{P(\\mathbf{x})}"}</LaTeX>

          <p className="leading-relaxed">
            Đọc từng mảnh:{" "}
            <strong>P(c)</strong> là prior — tỉ lệ spam nền (ví dụ 35% email
            là spam).{" "}
            <strong>P(x|c)</strong> là khả năng — xác suất email có nội
            dung x khi biết nó thuộc lớp c.{" "}
            <strong>P(c|x)</strong> là kết quả bạn cần — xác suất email là
            spam khi biết nội dung.
          </p>

          {/* Visual for Bayes' theorem */}
          <div className="rounded-xl border border-border bg-surface/40 p-5 my-4">
            <p className="text-xs font-semibold text-tertiary uppercase tracking-wide mb-3">
              Công thức Bayes vẽ thành các khối
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 p-3">
                <div className="text-[10px] font-bold text-red-700 dark:text-red-300 uppercase tracking-wide mb-1">
                  1. Prior
                </div>
                <p className="text-xs text-foreground/85 leading-relaxed">
                  Trước khi nhìn email: 35% email nền là spam. Đây là điểm
                  xuất phát.
                </p>
              </div>
              <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 p-3">
                <div className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide mb-1">
                  2. Khả năng
                </div>
                <p className="text-xs text-foreground/85 leading-relaxed">
                  Nội dung email &ldquo;khớp&rdquo; với lớp spam đến mức
                  nào? Tính từ từng từ.
                </p>
              </div>
              <div className="rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-700 p-3">
                <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide mb-1">
                  3. Posterior
                </div>
                <p className="text-xs text-foreground/85 leading-relaxed">
                  Sau khi xem nội dung: xác suất mới — bạn đã cập nhật
                  niềm tin.
                </p>
              </div>
            </div>
          </div>

          <p className="leading-relaxed">
            Đây là phần &ldquo;ngây thơ&rdquo; — khi có nhiều từ, Naive
            Bayes giả định các từ{" "}
            <strong>độc lập nhau</strong> khi biết lớp:
          </p>

          <LaTeX block>{"P(\\mathbf{x} \\mid c) \\approx \\prod_{i=1}^{d} P(x_i \\mid c)"}</LaTeX>

          <p className="leading-relaxed">
            Giả định này sai trong thực tế — &ldquo;khuyến mãi&rdquo; và
            &ldquo;miễn phí&rdquo; thường đi cùng nhau. Nhưng nó đủ dùng
            vì quyết định cuối chỉ cần so sánh hai phía. Kết quả: thuật
            toán &ldquo;sai về xác suất tuyệt đối&rdquo; nhưng &ldquo;đúng
            về phân loại&rdquo;.
          </p>

          {/* Final formula with explanation */}
          <div className="rounded-xl border border-border bg-card p-5 my-4 space-y-3">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles size={16} className="text-accent" />
              Nhân nhiều xác suất nhỏ sẽ tràn số — dùng log
            </p>
            <LaTeX block>{"\\log P(c \\mid \\mathbf{x}) \\propto \\log P(c) + \\sum_{i=1}^{d} \\log P(x_i \\mid c)"}</LaTeX>
            <p className="text-xs text-muted leading-relaxed">
              Log biến phép nhân thành phép cộng. Thay vì nhân 50 số rất
              nhỏ (nguy cơ tiến về 0 trên máy tính — gọi là{" "}
              <em>underflow</em>), ta cộng 50 giá trị log. Số thắng lớn hơn
              là lớp được chọn.
            </p>
          </div>

          <Callout variant="warning" title="Laplace smoothing — chống xác suất bằng 0">
            Nếu từ &ldquo;blockchain&rdquo; chưa bao giờ xuất hiện trong
            lớp Spam khi huấn luyện, P(blockchain|Spam) = 0. Nhân với 0
            làm toàn bộ tích bằng 0 — một từ lạ có thể &ldquo;giết&rdquo;
            cả dự đoán. Giải pháp: thêm +1 vào mọi đếm (đôi khi viết là +α).
            Nhờ vậy không xác suất nào bằng 0 tuyệt đối. Scikit-learn mặc
            định đã bật smoothing.
          </Callout>

          <Callout variant="tip" title="Vì sao Naive Bayes vẫn chạy trên dữ liệu hàng triệu email">
            Huấn luyện Naive Bayes chỉ là việc <strong>đếm từ</strong> —
            độ phức tạp tỉ lệ tuyến tính với số email và số từ. Không có
            ma trận đảo, không có gradient descent. Đó là lý do bộ lọc
            spam đầu tiên của Gmail dùng Naive Bayes, và đến nay nhiều
            hệ thống filter vẫn giữ Naive Bayes làm lớp kiểm tra đầu vì
            cực nhanh.
          </Callout>

          <h4 className="text-sm font-semibold text-foreground mt-6 mb-2">
            Vòng đời của một bộ lọc Naive Bayes
          </h4>
          <p className="text-sm text-muted leading-relaxed mb-3">
            Hai pha — huấn luyện (một lần, chậm nhưng chỉ đếm từ) và suy
            luận (mỗi email, cực nhanh). Đây là lý do Naive Bayes chạy
            được ở tốc độ hàng tỷ email mỗi ngày.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl border border-sky-300 bg-sky-50/60 dark:bg-sky-900/20 dark:border-sky-700 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-[10px] font-bold text-white">
                  1
                </span>
                <span className="text-sm font-semibold text-sky-800 dark:text-sky-200">
                  Pha huấn luyện (training)
                </span>
              </div>
              <ul className="text-xs text-foreground/85 space-y-1 pl-8 list-disc">
                <li>Lấy tập email đã gán nhãn (spam / ham)</li>
                <li>Với mỗi từ, đếm số lần xuất hiện ở lớp spam và lớp ham</li>
                <li>Chia ra tỉ lệ &rarr; được bảng P(từ | lớp)</li>
                <li>Áp dụng Laplace smoothing cho chắc</li>
              </ul>
              <p className="text-[11px] text-muted italic pl-8">
                Làm một lần, nhưng có thể cập nhật mỗi giờ từ phản hồi
                người dùng.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-300 bg-emerald-50/60 dark:bg-emerald-900/20 dark:border-emerald-700 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                  2
                </span>
                <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                  Pha suy luận (inference)
                </span>
              </div>
              <ul className="text-xs text-foreground/85 space-y-1 pl-8 list-disc">
                <li>Email mới đến — tách thành danh sách từ</li>
                <li>Với mỗi từ, tra bảng P(từ | spam) và P(từ | ham)</li>
                <li>Cộng log các xác suất, so sánh hai phe</li>
                <li>Nếu log P(spam) &gt; log P(ham) &rarr; chặn</li>
              </ul>
              <p className="text-[11px] text-muted italic pl-8">
                Thời gian xử lý mỗi email: ~1 mili-giây. Đó là lý do
                Gmail xử lý được hàng tỷ email/ngày.
              </p>
            </div>
          </div>

          <h4 className="text-sm font-semibold text-foreground mt-6 mb-2">
            Ba biến thể thường gặp
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-card p-4 space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Gaussian NB
              </p>
              <p className="text-xs text-muted leading-relaxed">
                Dùng khi đặc trưng là số thực (chiều cao, cân nặng). Mỗi
                đặc trưng được giả định tuân theo phân phối chuẩn trong
                mỗi lớp.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Multinomial NB
              </p>
              <p className="text-xs text-muted leading-relaxed">
                Dùng khi đếm số lần xuất hiện (số lần từ &ldquo;khuyến
                mãi&rdquo; trong email). Phổ biến nhất cho phân loại văn
                bản.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Bernoulli NB
              </p>
              <p className="text-xs text-muted leading-relaxed">
                Dùng khi đặc trưng chỉ có/không có (0 hoặc 1). Phù hợp
                cho tình huống chỉ quan tâm sự có mặt của từ, không quan
                tâm tần suất.
              </p>
            </div>
          </div>

          <p className="leading-relaxed mt-4">
            Khi các đặc trưng thực sự phụ thuộc nhau mạnh (diện tích nhà
            và số phòng chẳng hạn), giả định &ldquo;ngây thơ&rdquo; có
            thể sai nhiều. Lúc này bạn nên thử{" "}
            <TopicLink slug="logistic-regression">hồi quy logistic</TopicLink>{" "}
            hoặc SVM — những mô hình học trực tiếp ranh giới giữa các
            lớp mà không giả định độc lập.
          </p>

          <CollapsibleDetail title="Tại sao 'sai về xác suất' mà 'đúng về phân loại'?">
            <p className="text-sm leading-relaxed">
              Giả sử &ldquo;khuyến mãi&rdquo; và &ldquo;miễn phí&rdquo;
              hay đi cùng nhau trong spam. Naive Bayes đếm chúng{" "}
              <em>hai lần</em> như hai bằng chứng độc lập, nên P(Spam|email)
              bị <strong>phóng đại</strong>. Nhưng lưu ý: phép phóng đại
              đó cũng xảy ra trong công thức P(Ham|email) — dù nhẹ hơn —
              nên khi chia hai giá trị để so sánh, sai số bị triệt tiêu
              một phần. Kết quả: xác suất tuyệt đối có thể sai lệch
              (Naive Bayes nói 99% spam khi thực tế 85%), nhưng thứ tự
              &ldquo;spam hay ham&rdquo; vẫn thường đúng — và phân loại
              chỉ cần đúng thứ tự.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Liên hệ với các thuật toán khác">
            <p className="text-sm leading-relaxed">
              Naive Bayes là một trường hợp đặc biệt của{" "}
              <em>generative model</em> — mô hình học cách dữ liệu được{" "}
              &ldquo;sinh ra&rdquo;: đầu tiên chọn lớp, rồi sinh từng từ
              tuỳ theo lớp. Ngược lại, logistic regression là{" "}
              <em>discriminative model</em> — học thẳng ranh giới giữa
              các lớp mà không mô hình hoá cách dữ liệu phát sinh. Cả hai
              đều có điểm mạnh riêng; generative thường cần ít dữ liệu
              hơn để bắt đầu, còn discriminative thường chính xác hơn khi
              dữ liệu đủ lớn.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Khi nào Naive Bayes thực sự kém?">
            <div className="space-y-2 text-sm leading-relaxed">
              <p>
                Khi các đặc trưng <strong>phụ thuộc mạnh</strong> và hệ
                quả của sự phụ thuộc không đối xứng giữa các lớp. Ví dụ:
                dự đoán giá nhà dùng diện tích và số phòng ngủ. Hai
                biến này tương quan ~0.85 — Naive Bayes sẽ đếm hiệu ứng
                &ldquo;nhà lớn&rdquo; hai lần.
              </p>
              <p>
                Khi <strong>dữ liệu rất nhiều và đa dạng</strong>:
                logistic regression hoặc neural network có thể mô hình
                hoá phụ thuộc trực tiếp, dẫn đến accuracy cao hơn 3–8%.
                Trong bài toán spam filter hiện đại, Naive Bayes chỉ
                còn là một trong nhiều tín hiệu — Gmail kết hợp với
                reputation IP, DKIM, cấu trúc header, và cả mô hình
                học sâu.
              </p>
              <p>
                <strong>Mặc dù vậy:</strong> Naive Bayes vẫn là lựa
                chọn đầu tiên khi bạn cần kết quả trong vài giờ, có ít
                dữ liệu (~200 mẫu mỗi lớp), hoặc cần giải thích được
                cho stakeholder. Mỗi từ có một con số đóng góp rõ ràng.
              </p>
            </div>
          </CollapsibleDetail>
        </ExplanationSection>
      </LessonSection>

      {/* BƯỚC 8 — TÓM TẮT + QUIZ */}
      <LessonSection step={8} totalSteps={8} label="Tóm tắt và kiểm tra">
        <MiniSummary
          title="4 điều cần nhớ về Naive Bayes"
          points={[
            "Ý tưởng gốc: nhiều bằng chứng độc lập cùng chiều → niềm tin tăng. Mỗi từ là một “lá phiếu” nhỏ.",
            "Công thức: P(lớp|email) ∝ prior × tích xác suất từng từ. Dùng log để tránh tràn số.",
            "“Ngây thơ” nằm ở giả định các từ độc lập khi biết lớp — sai nhiều nhưng quyết định cuối vẫn đúng nhờ so sánh hai phía.",
            "Cần Laplace smoothing để chống xác suất bằng 0 khi gặp từ mới chưa từng thấy trong dữ liệu huấn luyện.",
          ]}
        />

        <div className="mt-8">
          <QuizSection questions={quizQuestions} />
        </div>

        <div className="mt-10">
          <Callout variant="tip" title="Ứng dụng thực tế">
            Bộ lọc spam huyền thoại của Gmail và SpamAssassin ra đời từ
            Naive Bayes. Xem chi tiết cách Paul Graham &ldquo;cứu&rdquo;
            Internet khỏi biển thư rác năm 2002 ở bài ứng dụng:{" "}
            <TopicLink slug="naive-bayes-in-email-classification">
              Naive Bayes lọc email
            </TopicLink>
            .
          </Callout>
        </div>
      </LessonSection>
    </>
  );
}

/* ────────────────────────────────────────────────────────────
   SUB-COMPONENTS cho STEPREVEAL
   ──────────────────────────────────────────────────────────── */

function StepPrior() {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-5 space-y-3">
      <p className="text-sm text-foreground leading-relaxed">
        Trước khi nhìn nội dung email, chúng ta đã có thông tin nền:{" "}
        <strong>khoảng 35%</strong> email gửi đến hộp thư là spam (con số
        này tuỳ nhà cung cấp dịch vụ). Đây gọi là <em>prior</em>.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-3 text-center">
          <div className="text-[11px] text-red-700 dark:text-red-300 uppercase tracking-wide">
            P(SPAM)
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums">
            35%
          </div>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-3 text-center">
          <div className="text-[11px] text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
            P(HAM)
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            65%
          </div>
        </div>
      </div>
      <p className="text-xs text-muted italic leading-relaxed">
        Nếu bạn đoán bừa mà không xem email, đoán &ldquo;ham&rdquo; sẽ
        đúng 65% lần — vì đa số email trong hộp thư là hợp lệ.
      </p>
    </div>
  );
}

function StepEvidence() {
  const evidence = [
    { word: "trúng thưởng", pSpam: 0.82, pHam: 0.02, ratio: 41 },
    { word: "miễn phí", pSpam: 0.65, pHam: 0.06, ratio: 10.8 },
    { word: "nhấn vào đây", pSpam: 0.78, pHam: 0.04, ratio: 19.5 },
  ];
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-5 space-y-4">
      <p className="text-sm text-foreground leading-relaxed">
        Email mẫu có 3 từ:{" "}
        <strong>&ldquo;trúng thưởng miễn phí nhấn vào đây&rdquo;</strong>.
        Mỗi từ góp một tỉ số P(từ|Spam) / P(từ|Ham) — gọi là{" "}
        <em>likelihood ratio</em>. Ratio lớn hơn 1 là bằng chứng về phía spam.
      </p>
      <div className="space-y-2">
        {evidence.map((e) => (
          <div
            key={e.word}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
          >
            <span className="text-sm font-medium text-foreground w-32 shrink-0">
              {e.word}
            </span>
            <div className="flex-1 text-xs text-tertiary tabular-nums">
              <span className="text-red-600 dark:text-red-400 font-semibold">
                P(từ|S) = {(e.pSpam * 100).toFixed(0)}%
              </span>
              <span className="mx-2">÷</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                P(từ|H) = {(e.pHam * 100).toFixed(0)}%
              </span>
            </div>
            <span className="text-xs font-bold text-red-600 dark:text-red-400 tabular-nums w-16 text-right">
              × {e.ratio.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted italic leading-relaxed">
        Nhân cả ba ratio lại: 41 × 10.8 × 19.5 ≈ <strong>8.632</strong>.
        Con số này &ldquo;đẩy&rdquo; xác suất về phía spam mạnh đến mức
        nào ở bước kế tiếp.
      </p>
    </div>
  );
}

function StepMultiply() {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-5 space-y-3">
      <p className="text-sm text-foreground leading-relaxed">
        Bước 3: nhân tỉ số bằng chứng với tỉ số prior. Prior ratio ban
        đầu là 35/65 ≈ 0.54 — hơi nghiêng về HAM.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <div className="text-[10px] text-tertiary uppercase tracking-wide mb-1">
            Prior ratio
          </div>
          <div className="text-lg font-bold text-foreground tabular-nums">
            0.54
          </div>
        </div>
        <div className="flex items-center justify-center text-muted">
          <ChevronRight size={20} />
        </div>
        <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 p-3 text-center">
          <div className="text-[10px] text-red-700 dark:text-red-300 uppercase tracking-wide mb-1">
            × bằng chứng
          </div>
          <div className="text-lg font-bold text-red-600 dark:text-red-400 tabular-nums">
            × 8.632
          </div>
        </div>
      </div>
      <div className="rounded-lg bg-accent/10 border border-accent/30 p-3 text-center">
        <div className="text-[10px] text-accent uppercase tracking-wide mb-1">
          Posterior ratio
        </div>
        <div className="text-2xl font-bold text-accent tabular-nums">
          ≈ 4.661
        </div>
        <p className="text-[11px] text-muted mt-1">
          Nghĩa là: email này có khả năng là SPAM cao gấp ≈ 4.661 lần HAM.
        </p>
      </div>
    </div>
  );
}

function StepNormalize() {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-5 space-y-3">
      <p className="text-sm text-foreground leading-relaxed">
        Bước cuối: chuyển ratio về xác suất &ldquo;người đọc&rdquo; để dễ
        hiểu. Ratio 4.661:1 nghĩa là P(Spam) = 4661 / (4661 + 1000) ≈
        <strong className="text-red-600 dark:text-red-400"> 99.99%</strong>.
      </p>
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-red-600 dark:text-red-400">
              P(SPAM | email)
            </span>
            <span className="font-bold tabular-nums text-red-600 dark:text-red-400">
              99.99%
            </span>
          </div>
          <div className="h-4 rounded-full bg-red-100 dark:bg-red-900/30 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "99.99%" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-red-500 rounded-full"
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              P(HAM | email)
            </span>
            <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              0.01%
            </span>
          </div>
          <div className="h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "0.01%" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-emerald-500 rounded-full"
            />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 rounded-lg border-2 border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-600 p-3">
        <XCircle size={18} className="text-red-600 dark:text-red-400 shrink-0" />
        <span className="text-sm font-semibold text-red-800 dark:text-red-200">
          Kết luận: email này là SPAM — chuyển vào thùng rác.
        </span>
      </div>
    </div>
  );
}
