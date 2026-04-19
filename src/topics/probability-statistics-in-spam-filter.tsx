"use client";

import { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  AlertTriangle,
  ShieldCheck,
  Gift,
  MousePointerClick,
  Zap,
  CheckCircle2,
  XCircle,
  GitBranch,
  TrendingUp,
} from "lucide-react";
import type { TopicMeta } from "@/lib/types";
import ApplicationLayout from "@/components/application/ApplicationLayout";
import ApplicationHero from "@/components/application/ApplicationHero";
import ApplicationProblem from "@/components/application/ApplicationProblem";
import ApplicationMechanism from "@/components/application/ApplicationMechanism";
import Beat from "@/components/application/Beat";
import ApplicationMetrics from "@/components/application/ApplicationMetrics";
import Metric from "@/components/application/Metric";
import ApplicationCounterfactual from "@/components/application/ApplicationCounterfactual";
import {
  InlineChallenge,
  Callout,
  MiniSummary,
  LessonSection,
  TopicLink,
  StepReveal,
} from "@/components/interactive";

export const metadata: TopicMeta = {
  slug: "probability-statistics-in-spam-filter",
  title: "Probability & Statistics in Spam Filtering",
  titleVi: "Xác suất trong lọc spam",
  description:
    "Cách Gmail dùng xác suất Bayes để chặn 15 tỷ email rác mỗi ngày — bạn sẽ tự tay chỉnh các công tắc đặc trưng và xem thanh điểm spam nhảy.",
  category: "math-foundations",
  tags: ["bayesian-filtering", "spam-detection", "application"],
  difficulty: "beginner",
  relatedSlugs: ["probability-statistics"],
  vizType: "interactive",
  applicationOf: "probability-statistics",
  featuredApp: {
    name: "Gmail",
    productFeature: "Spam Classifier",
    company: "Google LLC",
    countryOrigin: "US",
  },
  sources: [
    {
      title:
        "Spam Does Not Bring Us Joy — Ridding Gmail of 100 Million More Spam Messages with TensorFlow",
      publisher: "Google Workspace Blog",
      url: "https://workspace.google.com/blog/product-announcements/ridding-gmail-of-100-million-more-spam-messages-with-tensorflow",
      date: "2019-02",
      kind: "engineering-blog",
    },
    {
      title: "RETVec: Resilient and Efficient Text Vectorizer",
      publisher: "Google Security Blog",
      url: "https://security.googleblog.com/2023/11/google-retvec-open-source-text-vectorizer.html",
      date: "2023-11",
      kind: "engineering-blog",
    },
    {
      title:
        "Unwrapping the Holidays with Gmail: How We Block 15 Billion Spam Emails a Day",
      publisher: "Google Blog",
      url: "https://blog.google/products/gmail/gmail-security-end-of-year-2024/",
      date: "2024-12",
      kind: "engineering-blog",
    },
    {
      title: "A Plan for Spam",
      publisher: "Paul Graham",
      url: "http://www.paulgraham.com/spam.html",
      date: "2002-08",
      kind: "engineering-blog",
    },
  ],
  tocSections: [
    { id: "hero", labelVi: "Công ty nào?" },
    { id: "problem", labelVi: "Vấn đề" },
    { id: "mechanism", labelVi: "Cách giải quyết" },
    { id: "metrics", labelVi: "Con số thật" },
    { id: "counterfactual", labelVi: "Nếu không có" },
  ],
};

/* ─────────────────────────────────────────────────────────
   DỮ LIỆU: HỘP THƯ MẪU
   Người học sẽ tick spam/ham cho mỗi email
   ───────────────────────────────────────────────────────── */

interface InboxEmail {
  id: string;
  sender: string;
  subject: string;
  snippet: string;
  truth: "spam" | "ham";
  hints: string[];
}

const INBOX: InboxEmail[] = [
  {
    id: "e1",
    sender: "khuyen-mai@nofreefaker.win",
    subject: "BẠN ĐÃ TRÚNG THƯỞNG iPhone 16 Pro — BẤM NGAY!!!",
    snippet:
      "Chào bạn, bạn là khách hàng may mắn. Bấm vào link dưới đây để nhận miễn phí trong 24 giờ...",
    truth: "spam",
    hints: ["Viết hoa toàn bộ", "Nhiều dấu chấm than", "Tên miền lạ"],
  },
  {
    id: "e2",
    sender: "linh.nguyen@company.example",
    subject: "Đơn hàng #SP20260418 đã được giao thành công",
    snippet:
      "Chào bạn, cảm ơn đã mua hàng tại Shopee. Bạn có thể xem chi tiết đơn hàng trong ứng dụng.",
    truth: "ham",
    hints: [
      "Tên miền quen thuộc",
      "Giọng điệu trung tính",
      "Mã đơn có định dạng hợp lý",
    ],
  },
  {
    id: "e3",
    sender: "security@paypall-login.co",
    subject: "Tài khoản của bạn sẽ bị khoá — hành động ngay",
    snippet:
      "Chúng tôi phát hiện hoạt động bất thường. Vui lòng đăng nhập trong vòng 12 giờ qua đường link này để tránh mất tài khoản.",
    truth: "spam",
    hints: [
      "Tên miền giả (paypall, không phải paypal)",
      "Tạo cảm giác gấp",
      "Yêu cầu đăng nhập qua link",
    ],
  },
  {
    id: "e4",
    sender: "giaovien@thpt.example",
    subject: "Lịch họp phụ huynh lớp 12A3 — thứ Bảy 25/04",
    snippet:
      "Kính gửi quý phụ huynh, trường kính mời quý vị tham dự buổi họp lớp vào lúc 8h sáng thứ Bảy. Trân trọng.",
    truth: "ham",
    hints: [
      "Tên miền edu.vn",
      "Ngôn ngữ trang trọng",
      "Thông tin cụ thể, ngày giờ rõ",
    ],
  },
  {
    id: "e5",
    sender: "promo@fastmoney-investment.biz",
    subject: "Đầu tư 10 triệu — lời 50%/tháng CAM KẾT",
    snippet:
      "Cơ hội duy nhất! Không cần kinh nghiệm. Đăng ký hôm nay nhận ngay combo khoá học đầu tư miễn phí.",
    truth: "spam",
    hints: [
      "Hứa lợi nhuận phi lý",
      "Tên miền .biz đáng ngờ",
      "Cụm từ 'cơ hội duy nhất'",
    ],
  },
];

/* ─────────────────────────────────────────────────────────
   DỮ LIỆU: ĐẶC TRƯNG (FEATURE) CÓ THỂ BẬT/TẮT
   Mỗi feature có trọng số theo Bayes: khi có → cộng "điểm spam"
   ───────────────────────────────────────────────────────── */

interface SpamFeature {
  id: string;
  icon: typeof Gift;
  label: string;
  description: string;
  /** log-odds boost when feature is present */
  weight: number;
}

const FEATURES: SpamFeature[] = [
  {
    id: "giveaway",
    icon: Gift,
    label: "Cụm từ \u201Ctrúng thưởng\u201D",
    description: "Xuất hiện trong 85% email spam, chỉ 2% email thật.",
    weight: 1.8,
  },
  {
    id: "urgent",
    icon: AlertTriangle,
    label: "Tạo cảm giác gấp — \u201Chành động ngay\u201D",
    description:
      "Cụm từ gấp gáp như \u201Ckhoá tài khoản\u201D, \u201Ctrong 24 giờ\u201D.",
    weight: 1.2,
  },
  {
    id: "click",
    icon: MousePointerClick,
    label: "Link \u201Cbấm vào đây\u201D nổi bật",
    description:
      "Gần một nửa spam có link gắn sẵn với anchor-text kiểu kêu gọi hành động.",
    weight: 0.9,
  },
  {
    id: "fake-domain",
    icon: Zap,
    label: "Tên miền lạ hoặc viết sai chính tả",
    description:
      "paypall thay vì paypal, shoppe thay vì shopee — cảnh báo phishing.",
    weight: 1.5,
  },
  {
    id: "caps",
    icon: TrendingUp,
    label: "Viết hoa toàn dòng tiêu đề",
    description:
      "Đặc trưng kinh điển của spam. Email hợp lệ hiếm khi viết hoa toàn bộ.",
    weight: 0.7,
  },
];

/* Tính P(spam | features bật) bằng Bayes đơn giản */
function computeSpamScore(
  prior: number,
  activeFeatures: Record<string, boolean>,
): number {
  // log-odds
  let logOdds = Math.log(prior / (1 - prior));
  for (const f of FEATURES) {
    if (activeFeatures[f.id]) logOdds += f.weight;
  }
  const odds = Math.exp(logOdds);
  return odds / (1 + odds);
}

/* ─────────────────────────────────────────────────────────
   GAUGE: THANH ĐIỂM SPAM ĐỘNG
   ───────────────────────────────────────────────────────── */

function SpamGauge({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score * 100));
  const color =
    pct < 30 ? "#10b981" : pct < 60 ? "#f59e0b" : pct < 85 ? "#f97316" : "#ef4444";
  const verdict =
    pct < 30
      ? "An toàn — gần như chắc chắn là email thật"
      : pct < 60
        ? "Đáng ngờ — cần kiểm tra thêm"
        : pct < 85
          ? "Khả năng cao là spam"
          : "Gần như chắc chắn là spam";

  return (
    <div className="rounded-xl border-2 p-5 space-y-3" style={{ borderColor: color + "80" }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-tertiary uppercase tracking-wide">
          Điểm spam
        </span>
        <span
          className="text-xl font-mono font-bold tabular-nums"
          style={{ color }}
        >
          {pct.toFixed(1)}%
        </span>
      </div>
      <div className="relative h-4 rounded-full bg-surface-hover overflow-hidden">
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-tertiary">
        <span>0% — ham</span>
        <span>50%</span>
        <span>100% — spam</span>
      </div>
      <p
        className="text-sm font-medium text-center"
        style={{ color }}
      >
        {verdict}
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────────────────── */

export default function ProbabilityStatisticsInSpamFilter() {
  /* Phần 1 — đoán thủ công */
  const [guesses, setGuesses] = useState<Record<string, "spam" | "ham" | null>>(
    Object.fromEntries(INBOX.map((e) => [e.id, null])) as Record<
      string,
      "spam" | "ham" | null
    >,
  );
  const correctCount = useMemo(
    () => INBOX.filter((e) => guesses[e.id] === e.truth).length,
    [guesses],
  );
  const answeredCount = useMemo(
    () => INBOX.filter((e) => guesses[e.id] !== null).length,
    [guesses],
  );
  const allAnswered = answeredCount === INBOX.length;

  const handleGuess = useCallback((id: string, g: "spam" | "ham") => {
    setGuesses((prev) => ({ ...prev, [id]: g }));
  }, []);

  /* Phần 2 — chỉnh feature, quan sát gauge */
  const [prior, setPrior] = useState(0.3);
  const [active, setActive] = useState<Record<string, boolean>>(
    Object.fromEntries(FEATURES.map((f) => [f.id, false])),
  );
  const score = useMemo(
    () => computeSpamScore(prior, active),
    [prior, active],
  );

  const toggleFeature = useCallback((id: string) => {
    setActive((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const resetFeatures = useCallback(() => {
    setActive(Object.fromEntries(FEATURES.map((f) => [f.id, false])));
  }, []);

  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Xác suất và thống kê"
    >
      <ApplicationHero
        parentTitleVi="Xác suất và thống kê"
        topicSlug="probability-statistics-in-spam-filter"
      >
        <p>
          Mỗi ngày Gmail chặn khoảng <strong>15 tỷ</strong> email rác — tức
          khoảng 10 triệu thư mỗi phút. Với 1,8 tỷ người dùng, đây là dịch vụ
          email lớn nhất thế giới và cũng là mục tiêu hàng đầu của các chiến
          dịch spam.
        </p>
        <p>
          Bộ lọc Gmail dùng{" "}
          <TopicLink slug="probability-statistics">xác suất Bayes</TopicLink>{" "}
          để tính điểm spam cho từng email trong mili-giây. Bài này cho bạn
          <strong> tự tay </strong>
          nhấn thử hộp thư và xem Gmail &ldquo;suy nghĩ&rdquo; như thế nào.
        </p>
      </ApplicationHero>

      {/* ══════ INTERACTIVE SECTION 1: HỘP THƯ ĐOÁN ══════ */}
      <LessonSection label="Trải nghiệm 1: Bạn là bộ lọc Gmail">
        <p className="text-sm text-muted leading-relaxed mb-4">
          Đọc 5 tiêu đề dưới đây. Với mỗi email, chọn{" "}
          <strong>spam</strong> hay <strong>ham</strong> (email thật). Sau khi
          chọn hết, bạn sẽ thấy ngay mình đã đọc đặc trưng nào.
        </p>

        <div className="space-y-3">
          {INBOX.map((email) => {
            const g = guesses[email.id];
            const revealed = g !== null;
            const correct = g === email.truth;
            return (
              <div
                key={email.id}
                className={`rounded-xl border p-4 transition-colors ${
                  revealed
                    ? correct
                      ? "border-emerald-300 bg-emerald-50/60 dark:bg-emerald-900/15 dark:border-emerald-800"
                      : "border-rose-300 bg-rose-50/60 dark:bg-rose-900/15 dark:border-rose-800"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Mail
                    size={18}
                    className={
                      revealed
                        ? correct
                          ? "text-emerald-500 shrink-0 mt-0.5"
                          : "text-rose-500 shrink-0 mt-0.5"
                        : "text-muted shrink-0 mt-0.5"
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-tertiary font-mono mb-0.5 truncate">
                      {email.sender}
                    </div>
                    <div className="text-sm font-semibold text-foreground mb-1 truncate">
                      {email.subject}
                    </div>
                    <p className="text-xs text-muted leading-snug line-clamp-2">
                      {email.snippet}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleGuess(email.id, "spam")}
                    disabled={revealed}
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                      g === "spam"
                        ? "border-rose-500 bg-rose-500 text-white"
                        : "border-border bg-card text-muted hover:text-foreground hover:border-rose-400"
                    } ${revealed ? "cursor-default" : ""}`}
                  >
                    <XCircle size={12} /> Spam
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGuess(email.id, "ham")}
                    disabled={revealed}
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                      g === "ham"
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-border bg-card text-muted hover:text-foreground hover:border-emerald-400"
                    } ${revealed ? "cursor-default" : ""}`}
                  >
                    <CheckCircle2 size={12} /> Email thật
                  </button>

                  <AnimatePresence>
                    {revealed && (
                      <motion.span
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className={`ml-auto text-[11px] font-semibold ${
                          correct
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {correct
                          ? "Chính xác"
                          : `Sai — thực ra là ${email.truth}`}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                <AnimatePresence>
                  {revealed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 overflow-hidden"
                    >
                      <div className="rounded-lg bg-surface/60 border border-border p-3">
                        <div className="text-[10px] uppercase tracking-wide text-tertiary mb-1 font-semibold">
                          Đặc trưng Gmail nhìn vào
                        </div>
                        <ul className="space-y-1">
                          {email.hints.map((h, i) => (
                            <li
                              key={i}
                              className="text-xs text-foreground flex items-start gap-1.5"
                            >
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                              {h}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {allAnswered && (
          <div className="mt-5">
            <Callout
              variant={correctCount === INBOX.length ? "tip" : "insight"}
              title={
                correctCount === INBOX.length
                  ? "Hoàn hảo — bạn đã đọc được mọi đặc trưng"
                  : `Bạn đoán đúng ${correctCount}/${INBOX.length}`
              }
            >
              Bộ lọc Gmail tự động làm việc này hàng tỷ lần mỗi ngày. Nó không
              đoán mò — nó dùng xác suất. Ở phần tiếp theo, bạn sẽ thấy điểm
              spam nhảy như thế nào khi bật/tắt từng đặc trưng.
            </Callout>
          </div>
        )}
      </LessonSection>

      <ApplicationProblem topicSlug="probability-statistics-in-spam-filter">
        <p>
          Email rác chiếm hơn một nửa tổng email toàn cầu. Nội dung spam thay
          đổi liên tục — từ quảng cáo thuốc giả, lừa đảo tài chính đến phishing
          (giả danh ngân hàng để đánh cắp thông tin).
        </p>
        <p>
          Thách thức cốt lõi: phân biệt spam và email thật trong{" "}
          <strong>mili-giây</strong>, khi kẻ gửi spam liên tục đổi chiêu.
          Chặn nhầm → mất email quan trọng. Lọt spam → người dùng bực. Mỗi sai
          sót nhỏ nhân lên với 1,8 tỷ người dùng.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Xác suất và thống kê"
        topicSlug="probability-statistics-in-spam-filter"
      >
        <Beat step={1}>
          <p>
            <strong>Lọc Bayes — nền tảng xác suất.</strong> Năm 2002, Paul
            Graham công bố bài &ldquo;A Plan for Spam&rdquo; đặt nền móng cho
            lọc spam bằng xác suất. Với mỗi từ trong email, hệ thống ước lượng
            P(spam | từ) dựa trên tần suất từ đó xuất hiện trong spam và trong
            email thật. Nhiều từ gộp lại cho ra xác suất tổng — nếu vượt ngưỡng
            0,9 thì đánh dấu là spam.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>Vòng phản hồi người dùng.</strong> Khi bạn bấm &ldquo;Báo
            cáo spam&rdquo; hoặc kéo email từ thư rác về hộp chính, Gmail cập
            nhật tiên nghiệm (prior) cho từng mẫu từ. Hàng tỷ phản hồi mỗi
            ngày giúp mô hình liên tục cải thiện.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>TensorFlow nâng cấp mạng nơ-ron (2019).</strong> Google
            tích hợp TensorFlow vào bộ lọc, cho phép mạng nơ-ron học đặc trưng
            phức tạp hơn Bayes thuần. Kết quả: chặn thêm 100 triệu spam mỗi
            ngày so với trước đó.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>RETVec — bộ mã hoá bền vững (2023).</strong> RETVec chuyển
            văn bản thành vector trực tiếp từ byte, chỉ với 200.000 tham số. Nó
            miễn nhiễm với chiêu lẩn tránh như chèn ký tự vô hình, thay chữ
            bằng emoji, hoặc dùng ký tự nhìn giống nhau. RETVec tăng 38% phát
            hiện, giảm 19,4% chặn nhầm, tiết kiệm 83% tài nguyên.
          </p>
        </Beat>
      </ApplicationMechanism>

      {/* ══════ INTERACTIVE SECTION 2: BẬT/TẮT ĐẶC TRƯNG ══════ */}
      <LessonSection label="Trải nghiệm 2: Kéo công tắc, xem thanh spam nhảy">
        <p className="text-sm text-muted leading-relaxed mb-4">
          Giả sử bạn có một email. Bật từng công tắc dưới đây để mô phỏng
          &ldquo;email này có đặc trưng đó&rdquo;. Thanh điểm spam sẽ nhảy theo
          — đây là cách Gmail cộng dồn bằng chứng.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Panel trái: công tắc */}
          <div className="space-y-3">
            {/* Prior */}
            <div className="rounded-xl border border-border bg-surface/50 p-4">
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="prior-slider"
                  className="text-sm font-medium text-foreground"
                >
                  Tỷ lệ spam ban đầu (prior)
                </label>
                <span className="font-mono text-sm font-bold text-accent tabular-nums">
                  {(prior * 100).toFixed(0)}%
                </span>
              </div>
              <input
                id="prior-slider"
                type="range"
                min={0.05}
                max={0.7}
                step={0.05}
                value={prior}
                onChange={(e) => setPrior(parseFloat(e.target.value))}
                className="w-full accent-accent"
              />
              <p className="text-[11px] text-muted mt-1 leading-snug">
                Trước khi đọc nội dung, Gmail dự đoán khoảng {(prior * 100).toFixed(0)}%
                email đến là spam. Bằng chứng từ các công tắc bên dưới sẽ
                <strong> cập nhật </strong>
                con số đó.
              </p>
            </div>

            {/* Công tắc đặc trưng */}
            <div className="space-y-2">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                const on = active[f.id];
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleFeature(f.id)}
                    className={`w-full rounded-xl border p-3 text-left transition-colors flex items-start gap-3 ${
                      on
                        ? "border-rose-400 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-700"
                        : "border-border bg-card hover:border-accent/50"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        on ? "bg-rose-500 text-white" : "bg-surface text-muted"
                      }`}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-sm font-semibold ${
                            on ? "text-rose-800 dark:text-rose-200" : "text-foreground"
                          }`}
                        >
                          {f.label}
                        </span>
                        <span
                          className={`text-[10px] tabular-nums font-mono rounded-full px-2 py-0.5 ${
                            on
                              ? "bg-rose-200 text-rose-900 dark:bg-rose-800 dark:text-rose-100"
                              : "bg-surface text-muted"
                          }`}
                        >
                          +{f.weight.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-xs text-muted leading-snug mt-0.5">
                        {f.description}
                      </p>
                    </div>
                    <span
                      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                        on ? "bg-rose-500" : "bg-surface-hover"
                      }`}
                    >
                      <motion.span
                        className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow"
                        initial={false}
                        animate={{ left: on ? 18 : 2 }}
                        transition={{ duration: 0.2 }}
                      />
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={resetFeatures}
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-muted hover:text-foreground transition-colors"
            >
              Tắt hết công tắc
            </button>
          </div>

          {/* Panel phải: gauge + explanation */}
          <div className="space-y-4">
            <SpamGauge score={score} />

            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-accent" />
                <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  Cách tính trong đầu Gmail
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Mỗi đặc trưng bật lên, Gmail cộng thêm một &ldquo;điểm&rdquo;
                vào log-odds. Càng nhiều đặc trưng, điểm càng cao. Đến khi điểm
                vượt ngưỡng, email bị đưa vào Spam.
              </p>
              <div className="rounded-lg bg-surface/60 border border-border p-3 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Prior</span>
                  <span className="font-mono text-foreground">
                    {(prior * 100).toFixed(0)}%
                  </span>
                </div>
                {FEATURES.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span
                      className={active[f.id] ? "text-foreground" : "text-tertiary"}
                    >
                      {f.label}
                    </span>
                    <span
                      className={`font-mono tabular-nums ${
                        active[f.id] ? "text-rose-500" : "text-tertiary"
                      }`}
                    >
                      {active[f.id] ? `+${f.weight.toFixed(1)}` : "—"}
                    </span>
                  </div>
                ))}
                <div className="border-t border-border pt-1 mt-1 flex items-center justify-between text-xs">
                  <span className="text-foreground font-semibold">
                    P(spam | bằng chứng)
                  </span>
                  <span className="font-mono font-bold text-accent">
                    {(score * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </LessonSection>

      {/* ══════ INTERACTIVE SECTION 3: TREE BAYES ══════ */}
      <LessonSection label="Trải nghiệm 3: Từ bằng chứng tới cập nhật niềm tin">
        <p className="text-sm text-muted leading-relaxed mb-4">
          Gmail cập nhật niềm tin của mình từng bước — như cách bạn kết luận
          &ldquo;trời sắp mưa&rdquo; sau khi thấy mây đen, gió mạnh, nhiệt độ
          giảm.
        </p>

        <StepReveal
          labels={[
            "Bước 1: Niềm tin ban đầu",
            "Bước 2: Thấy từ 'trúng thưởng'",
            "Bước 3: Tên miền lạ",
            "Bước 4: Kết luận",
          ]}
        >
          {[
            <div
              key="s1"
              className="rounded-lg border border-border bg-card p-4 space-y-2"
            >
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-muted" />
                <span className="text-sm font-semibold text-foreground">
                  P(spam) = 30%
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Trước khi đọc nội dung, Gmail nghĩ: trong tất cả email đến hộp
                thư, khoảng 30% là spam (tỷ lệ này khác nhau tuỳ người dùng và
                tuỳ ngày).
              </p>
              <div className="h-3 rounded-full bg-surface-hover overflow-hidden">
                <motion.div
                  className="h-full bg-amber-500"
                  initial={{ width: 0 }}
                  animate={{ width: "30%" }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>,
            <div
              key="s2"
              className="rounded-lg border border-border bg-card p-4 space-y-2"
            >
              <div className="flex items-center gap-2">
                <Gift size={14} className="text-rose-500" />
                <span className="text-sm font-semibold text-foreground">
                  P(spam | &ldquo;trúng thưởng&rdquo;) ≈ 74%
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Từ &ldquo;trúng thưởng&rdquo; xuất hiện trong 85% spam, chỉ 2%
                email thật. Áp Bayes: niềm tin nhảy từ 30% lên 74% chỉ trong
                một từ.
              </p>
              <div className="h-3 rounded-full bg-surface-hover overflow-hidden">
                <motion.div
                  className="h-full bg-orange-500"
                  initial={{ width: "30%" }}
                  animate={{ width: "74%" }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>,
            <div
              key="s3"
              className="rounded-lg border border-border bg-card p-4 space-y-2"
            >
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-rose-500" />
                <span className="text-sm font-semibold text-foreground">
                  P(spam | &ldquo;trúng thưởng&rdquo;, tên miền lạ) ≈ 91%
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Thêm một bằng chứng nữa (tên miền &ldquo;.win&rdquo;), niềm tin
                nhảy tiếp lên 91%. Bayes cho phép <strong>cộng dồn</strong> các
                bằng chứng nhỏ thành kết luận mạnh.
              </p>
              <div className="h-3 rounded-full bg-surface-hover overflow-hidden">
                <motion.div
                  className="h-full bg-rose-500"
                  initial={{ width: "74%" }}
                  animate={{ width: "91%" }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>,
            <div
              key="s4"
              className="rounded-lg border-2 border-rose-300 dark:border-rose-700 bg-rose-50/60 dark:bg-rose-900/15 p-4 space-y-2"
            >
              <div className="flex items-center gap-2">
                <GitBranch size={14} className="text-rose-500" />
                <span className="text-sm font-semibold text-foreground">
                  Chặn → thư mục Spam
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Vì niềm tin đã vượt ngưỡng 0,9, Gmail đưa email vào thư mục
                Spam. Đây chính là <strong>định lý Bayes trong thực tế</strong>:
                prior → likelihood → posterior → quyết định.
              </p>
              <div className="h-3 rounded-full bg-surface-hover overflow-hidden">
                <motion.div
                  className="h-full bg-red-600"
                  initial={{ width: "91%" }}
                  animate={{ width: "95%" }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>,
          ]}
        </StepReveal>
      </LessonSection>

      {/* ══════ INLINE CHALLENGE ══════ */}
      <LessonSection label="Thử thách">
        <InlineChallenge
          question="Bạn nhận một email có từ 'trúng thưởng' với P('trúng thưởng' | spam) = 80%, P('trúng thưởng' | email thật) = 5%. Tỷ lệ spam trong hộp thư là 40%. Áp Bayes, P(spam | 'trúng thưởng') gần nhất với giá trị nào?"
          options={[
            "40% — cùng tỷ lệ spam nền.",
            "Khoảng 60% — cao hơn một chút.",
            "Khoảng 91% — một từ thôi cũng đẩy niềm tin lên rất cao.",
            "100% — chắc chắn là spam.",
          ]}
          correct={2}
          explanation="Bayes: P(spam | từ) = P(từ | spam) × P(spam) / P(từ). Mẫu số P(từ) = 0,8 × 0,4 + 0,05 × 0,6 = 0,35. Tử số = 0,32. Kết quả ≈ 0,914 = 91,4%. Đây là lý do vì sao bộ lọc Gmail có thể đưa quyết định rất chắc chắn dù chỉ dựa trên vài từ — miễn là likelihood chênh lệch lớn."
        />
      </LessonSection>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="probability-statistics-in-spam-filter"
      >
        <Metric
          value="Gmail chặn khoảng 15 tỷ email rác mỗi ngày, phục vụ 1,8 tỷ người dùng"
          sourceRef={3}
        />
        <Metric
          value="Tích hợp TensorFlow (2019) chặn thêm 100 triệu spam mỗi ngày"
          sourceRef={1}
        />
        <Metric
          value="RETVec tăng 38% phát hiện spam, giảm 19,4% chặn nhầm"
          sourceRef={2}
        />
        <Metric
          value="RETVec tiết kiệm 83% tài nguyên TPU so với mô hình trước"
          sourceRef={2}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Xác suất và thống kê"
        topicSlug="probability-statistics-in-spam-filter"
      >
        <p>
          Không có mô hình xác suất, hệ thống lọc chỉ có thể dùng{" "}
          <strong>danh sách đen</strong> (blacklist — chặn địa chỉ cố định)
          hoặc <strong>luật cứng</strong> (rule-based — kiểm từ khoá cố
          định). Cả hai đều dễ qua mặt: kẻ gửi spam chỉ cần đổi địa chỉ hoặc
          thay từ là lọt qua.
        </p>
        <p>
          Lọc Bayes thay đổi cục diện bằng cách <strong>tính xác suất từ
          dữ liệu thực</strong> và tự cập nhật liên tục. Mô hình thống kê thích
          nghi với chiêu mới mà không cần lập trình viên viết thêm luật. Đây
          chính là sức mạnh của xác suất có điều kiện: biến kinh nghiệm quá
          khứ thành dự đoán tương lai.
        </p>
      </ApplicationCounterfactual>

      {/* ══════ TÓM TẮT ══════ */}
      <LessonSection label="Tóm tắt">
        <MiniSummary
          title="4 điều bạn vừa nhìn tận mắt"
          points={[
            "Mỗi email được Gmail chấm một điểm spam từ 0 đến 100. Ngưỡng 90% là biên giới vào Spam.",
            "Mỗi đặc trưng (từ khoá, tên miền, viết hoa) cộng thêm một chút vào điểm. Nhiều đặc trưng nhỏ cộng lại thành kết luận chắc chắn.",
            "Prior (tỷ lệ spam ban đầu) và likelihood (bằng chứng trong email) đều quan trọng. Quên một cái, kết quả sai lệch.",
            "Bayes không đoán mò — nó cập nhật niềm tin dựa trên dữ liệu, giống cách bạn kết luận trời sắp mưa từ nhiều dấu hiệu nhỏ.",
          ]}
        />

        <div className="mt-4">
          <Callout variant="tip" title="Muốn hiểu sâu hơn về lý thuyết?">
            Đọc bài gốc{" "}
            <TopicLink slug="probability-statistics">
              Xác suất và thống kê
            </TopicLink>{" "}
            — nơi bạn tự tay tung đồng xu, xây histogram, và chơi với cây
            Bayes.
          </Callout>
        </div>
      </LessonSection>
    </ApplicationLayout>
  );
}
