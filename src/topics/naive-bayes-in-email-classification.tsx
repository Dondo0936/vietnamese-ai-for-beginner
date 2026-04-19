"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Inbox,
  ShieldCheck,
  AlertTriangle,
  Trash2,
  Sparkles,
  Eye,
  BadgePercent,
  FileText,
  Briefcase,
  ChevronRight,
} from "lucide-react";
import type { TopicMeta } from "@/lib/types";
import ApplicationLayout from "@/components/application/ApplicationLayout";
import ApplicationHero from "@/components/application/ApplicationHero";
import ApplicationProblem from "@/components/application/ApplicationProblem";
import ApplicationMechanism from "@/components/application/ApplicationMechanism";
import Beat from "@/components/application/Beat";
import ApplicationMetrics from "@/components/application/ApplicationMetrics";
import Metric from "@/components/application/Metric";
import ApplicationTryIt from "@/components/application/ApplicationTryIt";
import ApplicationCounterfactual from "@/components/application/ApplicationCounterfactual";
import {
  InlineChallenge,
  Callout,
  SliderGroup,
} from "@/components/interactive";

export const metadata: TopicMeta = {
  slug: "naive-bayes-in-email-classification",
  title: "Naive Bayes in Email Classification",
  titleVi: "Naive Bayes lọc email",
  description:
    "Cách Gmail và SpamAssassin dùng Naive Bayes để chặn 15 tỷ email rác mỗi ngày với tỷ lệ nhầm dưới 0,2%. Thử phân loại ba email mẫu, rồi kéo thanh Laplace để thấy bộ lọc xử lý từ lạ thế nào.",
  category: "classic-ml",
  tags: ["classification", "email", "spam", "application"],
  difficulty: "intermediate",
  relatedSlugs: ["naive-bayes"],
  vizType: "static",
  applicationOf: "naive-bayes",
  featuredApp: {
    name: "Gmail / SpamAssassin",
    productFeature: "Bayesian Spam Filter",
    company: "Google LLC / Apache Foundation",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "A Plan for Spam",
      publisher: "Paul Graham",
      url: "http://www.paulgraham.com/spam.html",
      date: "2002-08",
      kind: "paper",
    },
    {
      title: "SpamAssassin: Bayesian Poisoning",
      publisher: "Apache SpamAssassin Wiki",
      url: "https://wiki.apache.org/spamassassin/BayesianPoisoning",
      date: "2010-03",
      kind: "documentation",
    },
    {
      title:
        "Spam does not bring us joy — ridding Gmail of 100 million more spam messages with TensorFlow",
      publisher: "Google Workspace Blog",
      url: "https://workspace.google.com/blog/product-announcements/ridding-gmail-of-100-million-more-spam-messages-with-tensorflow",
      date: "2019-02",
      kind: "engineering-blog",
    },
  ],
  tocSections: [
    { id: "hero", labelVi: "Công ty nào?" },
    { id: "problem", labelVi: "Vấn đề" },
    { id: "mechanism", labelVi: "Cách giải quyết" },
    { id: "metrics", labelVi: "Con số thật" },
    { id: "tryIt", labelVi: "Thử tự tay" },
    { id: "counterfactual", labelVi: "Nếu không có" },
  ],
};

/* ────────────────────────────────────────────────────────────
   3 EMAIL MẪU
   ──────────────────────────────────────────────────────────── */

interface WordStat {
  text: string;
  pSpam: number;
  pHam: number;
}

interface DemoEmail {
  id: string;
  subject: string;
  preview: string;
  features: WordStat[];
  from: string;
  icon: typeof Mail;
  truthLabel: "SPAM" | "HAM";
}

const EMAILS: DemoEmail[] = [
  {
    id: "promo",
    subject: "Chúc mừng! Bạn đã trúng thưởng iPhone 15 Pro Max",
    preview:
      "Khách hàng thân mến, miễn phí 100% phí giao hàng, nhấn vào đây để nhận quà ngay trong hôm nay...",
    from: "promo@khuyenmai-mua.net",
    icon: BadgePercent,
    truthLabel: "SPAM",
    features: [
      { text: "trúng thưởng", pSpam: 0.82, pHam: 0.02 },
      { text: "miễn phí", pSpam: 0.68, pHam: 0.06 },
      { text: "nhấn vào đây", pSpam: 0.78, pHam: 0.04 },
      { text: "khuyến mãi", pSpam: 0.72, pHam: 0.08 },
    ],
  },
  {
    id: "work",
    subject: "Báo cáo tuần — dự án CRM",
    preview:
      "Chào anh, gửi anh báo cáo tuần của dự án CRM. Chúng ta sẽ họp vào sáng mai về deadline giai đoạn 2...",
    from: "lan.nguyen@company.example",
    icon: Briefcase,
    truthLabel: "HAM",
    features: [
      { text: "báo cáo", pSpam: 0.07, pHam: 0.54 },
      { text: "dự án", pSpam: 0.06, pHam: 0.52 },
      { text: "họp", pSpam: 0.05, pHam: 0.58 },
      { text: "deadline", pSpam: 0.04, pHam: 0.48 },
    ],
  },
  {
    id: "mixed",
    subject: "Ưu đãi cho khách hàng doanh nghiệp — mời họp giới thiệu",
    preview:
      "Kính gửi quý khách, khuyến mãi đặc biệt cho khách hàng doanh nghiệp. Kính mời quý khách họp giới thiệu sản phẩm...",
    from: "sales@partner.example",
    icon: FileText,
    truthLabel: "HAM",
    features: [
      { text: "khuyến mãi", pSpam: 0.72, pHam: 0.08 },
      { text: "họp", pSpam: 0.05, pHam: 0.58 },
      { text: "báo cáo", pSpam: 0.07, pHam: 0.54 },
    ],
  },
];

const PRIOR_SPAM = 0.35;

function classifyEmail(features: WordStat[], alpha: number) {
  const priorHam = 1 - PRIOR_SPAM;
  const vocab = 20;

  let logSpam = Math.log(PRIOR_SPAM);
  let logHam = Math.log(priorHam);

  const contributions: {
    word: string;
    pSpamS: number;
    pHamS: number;
  }[] = [];

  for (const f of features) {
    const t = Math.min(1, alpha / 2) * 0.35;
    const pSpamS = f.pSpam * (1 - t) + (1 / vocab) * t;
    const pHamS = f.pHam * (1 - t) + (1 / vocab) * t;
    logSpam += Math.log(pSpamS);
    logHam += Math.log(pHamS);
    contributions.push({ word: f.text, pSpamS, pHamS });
  }

  const maxLog = Math.max(logSpam, logHam);
  const uSpam = Math.exp(logSpam - maxLog);
  const uHam = Math.exp(logHam - maxLog);
  const total = uSpam + uHam;
  return {
    pSpam: uSpam / total,
    pHam: uHam / total,
    prediction: uSpam > uHam ? ("SPAM" as const) : ("HAM" as const),
    contributions,
  };
}

/* ────────────────────────────────────────────────────────────
   COMPONENT CHÍNH
   ──────────────────────────────────────────────────────────── */

export default function NaiveBayesInEmailClassification() {
  const [activeId, setActiveId] = useState<string>("promo");

  const active = useMemo(
    () => EMAILS.find((e) => e.id === activeId) ?? EMAILS[0],
    [activeId],
  );

  const result = useMemo(
    () => classifyEmail(active.features, 1),
    [active],
  );

  const predictionColor =
    result.prediction === "SPAM" ? "#ef4444" : "#22c55e";

  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Naive Bayes"
    >
      <ApplicationHero
        parentTitleVi="Naive Bayes"
        topicSlug="naive-bayes-in-email-classification"
      >
        <p>
          Mỗi sáng bạn mở hộp thư Gmail và thấy mọi thứ sạch sẽ — không
          quảng cáo thuốc giả, không lừa đảo trúng thưởng. Bạn có bao giờ
          tự hỏi ai đã chặn chúng lại? Phần lớn công việc đó do một thuật
          toán <strong>hơn 20 năm tuổi</strong> — Naive Bayes — thực hiện
          thầm lặng ngay trước khi email chạm tới bạn.
        </p>
        <p>
          Bài luận <em>&ldquo;A Plan for Spam&rdquo;</em> của Paul Graham
          năm 2002 chứng minh rằng chỉ cần đếm tần suất từ và áp dụng
          định lý Bayes đã lọc được hơn <strong>99,5%</strong> thư rác.
          Ý tưởng đó trở thành nền tảng cho SpamAssassin (bộ lọc mã nguồn
          mở) và bộ lọc đầu tiên của Gmail.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="naive-bayes-in-email-classification">
        <p>
          Mỗi ngày có khoảng <strong>15 tỷ thư rác</strong> được gửi đi
          trên toàn cầu. Kẻ gửi spam liên tục đổi chiêu: cố ý sai chính
          tả, chèn ký tự vô hình, giả mạo địa chỉ người gửi. Luật cứng
          kiểu &ldquo;nếu có từ X thì chặn&rdquo; không bao giờ theo kịp.
        </p>

        <div className="grid gap-3 sm:grid-cols-3 my-4">
          {[
            {
              icon: Inbox,
              title: "Khối lượng khổng lồ",
              desc: "Gmail xử lý hàng tỷ email mỗi ngày. Không con người nào đọc hết.",
              color: "#3b82f6",
            },
            {
              icon: AlertTriangle,
              title: "Kẻ tấn công luôn đổi chiêu",
              desc: "V1agra, V.I.A.G.R.A, viaqra... mỗi ngày một biến thể mới.",
              color: "#ef4444",
            },
            {
              icon: ShieldCheck,
              title: "Không được chặn nhầm",
              desc: "Chặn nhầm một email quan trọng tệ hơn nhiều so với lọt vài spam.",
              color: "#22c55e",
            },
          ].map((c) => (
            <div
              key={c.title}
              className="rounded-xl border p-4 bg-card"
              style={{ borderColor: c.color + "35" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <c.icon size={16} style={{ color: c.color }} />
                <p
                  className="text-sm font-bold"
                  style={{ color: c.color }}
                >
                  {c.title}
                </p>
              </div>
              <p className="text-xs text-foreground leading-relaxed">
                {c.desc}
              </p>
            </div>
          ))}
        </div>

        <p>
          Vấn đề cốt lõi: phân loại mỗi email thành <strong>spam</strong> hoặc{" "}
          <strong>ham</strong> (thư hợp lệ) với sai số cực thấp. Chặn nhầm
          một email quan trọng (false positive) gây hậu quả nghiêm trọng
          hơn nhiều so với để lọt vài thư rác.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Naive Bayes"
        topicSlug="naive-bayes-in-email-classification"
      >
        <Beat step={1}>
          <p>
            <strong>Thu thập dữ liệu huấn luyện — ham và spam.</strong>{" "}
            Hệ thống cần tối thiểu khoảng 200 email spam và 200 email ham
            để bắt đầu. SpamAssassin cho phép người dùng tự gán nhãn; Gmail
            dùng phản hồi từ hàng tỷ lượt nhấn <em>&ldquo;Báo cáo
            spam&rdquo;</em> mỗi ngày làm tín hiệu huấn luyện.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>Tính xác suất có điều kiện cho từng từ.</strong> Với
            mỗi từ trong kho từ vựng, hệ thống tính{" "}
            <em>P(từ|spam)</em> — tỉ lệ email spam chứa từ đó — và{" "}
            <em>P(từ|ham)</em>. Ví dụ: &ldquo;trúng thưởng&rdquo; có
            P(từ|spam) rất cao, còn tên đồng nghiệp của bạn có P(từ|ham)
            rất cao.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>Kết hợp bằng định lý Bayes.</strong> Khi email mới
            đến, thuật toán nhân tất cả xác suất có điều kiện của các từ
            trong email lại với nhau (giả định &ldquo;ngây thơ&rdquo; rằng
            các từ độc lập) để tính P(spam|email). Phép nhân được thực
            hiện trong không gian log để tránh tràn số.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>So sánh với ngưỡng quyết định.</strong> Nếu P(spam|email)
            vượt ngưỡng (thường từ 0,9 trở lên để hạn chế chặn nhầm), email
            bị đánh dấu là spam. Ngưỡng cao đồng nghĩa ưu tiên giảm false
            positive — tỷ lệ nhầm thư hợp lệ thành spam dưới 0,2%.
          </p>
        </Beat>
        <Beat step={5}>
          <p>
            <strong>Vòng phản hồi từ người dùng.</strong> Khi bạn nhấn{" "}
            <em>&ldquo;Báo cáo spam&rdquo;</em> hoặc kéo email ra khỏi
            thùng rác, hệ thống cập nhật bảng xác suất. Gmail thu thập tín
            hiệu từ <strong>1,8 tỷ người dùng</strong> — bộ lọc tự cải
            thiện liên tục mà không cần kỹ sư can thiệp thủ công.
          </p>
        </Beat>
      </ApplicationMechanism>

      {/* ──── DASHBOARD TRỰC QUAN ──── */}
      <section className="mb-10 space-y-6 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <Eye size={18} className="text-accent" />
          <h3 className="text-base font-semibold text-foreground">
            Hộp thư mô phỏng — bấm vào email để xem bộ lọc chạy
          </h3>
        </div>

        <p className="text-sm text-muted leading-relaxed">
          Bạn là bộ lọc Naive Bayes. Mỗi email dưới đây có cụm từ đặc
          trưng riêng. Bấm vào một email để xem: (1) các từ được chọn
          làm bằng chứng, (2) từng từ &ldquo;bỏ phiếu&rdquo; bao nhiêu
          phần trăm cho spam/ham, (3) tổng P(Spam) cuối cùng.
        </p>

        {/* Inbox */}
        <div className="space-y-2">
          {EMAILS.map((em) => {
            const selected = em.id === activeId;
            const Icon = em.icon;
            const r = classifyEmail(em.features, 1);
            const isSpam = r.prediction === "SPAM";
            return (
              <button
                key={em.id}
                type="button"
                onClick={() => setActiveId(em.id)}
                className={`w-full text-left rounded-xl border p-4 transition-all ${
                  selected
                    ? "border-accent bg-accent-light"
                    : "border-border bg-card hover:border-accent/40"
                }`}
                aria-pressed={selected}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      isSpam
                        ? "bg-red-100 dark:bg-red-900/30"
                        : "bg-emerald-100 dark:bg-emerald-900/30"
                    }`}
                  >
                    <Icon
                      size={16}
                      className={
                        isSpam
                          ? "text-red-600 dark:text-red-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-xs font-medium text-tertiary truncate">
                        {em.from}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          isSpam
                            ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        }`}
                      >
                        {isSpam ? "SPAM" : "HAM"} {(Math.max(r.pSpam, r.pHam) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-foreground truncate mb-1">
                      {em.subject}
                    </p>
                    <p className="text-xs text-muted line-clamp-1">
                      {em.preview}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Chi tiết cho email đang chọn */}
        <div
          className="rounded-xl border-2 bg-card p-5 space-y-4"
          style={{ borderColor: predictionColor + "55" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-muted" />
              <span className="text-[11px] font-semibold text-tertiary uppercase tracking-wide">
                Chi tiết phân loại
              </span>
            </div>
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: predictionColor + "22",
                color: predictionColor,
              }}
            >
              Dự đoán: {result.prediction}
            </span>
          </div>

          {/* Bar Spam vs Ham */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-red-600 dark:text-red-400">
                  P(SPAM | email)
                </span>
                <span className="font-bold tabular-nums text-red-600 dark:text-red-400">
                  {(result.pSpam * 100).toFixed(2)}%
                </span>
              </div>
              <div className="h-3 rounded-full bg-red-100 dark:bg-red-900/30 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-red-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${result.pSpam * 100}%` }}
                  transition={{
                    type: "spring",
                    stiffness: 140,
                    damping: 20,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  P(HAM | email)
                </span>
                <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {(result.pHam * 100).toFixed(2)}%
                </span>
              </div>
              <div className="h-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${result.pHam * 100}%` }}
                  transition={{
                    type: "spring",
                    stiffness: 140,
                    damping: 20,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Contribution per word */}
          <div className="rounded-lg border border-border bg-surface/40 p-3">
            <p className="text-[11px] font-semibold text-tertiary uppercase tracking-wide mb-2">
              Đặc trưng tìm thấy
            </p>
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {result.contributions.map((c, idx) => {
                  const pS = c.pSpamS * 100;
                  const pH = c.pHamS * 100;
                  const total = pS + pH;
                  const wS = (pS / total) * 100;
                  return (
                    <motion.div
                      key={`${active.id}-${c.word}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center gap-3"
                    >
                      <span className="text-xs font-medium text-foreground w-28 shrink-0">
                        {c.word}
                      </span>
                      <div className="flex-1 flex h-2.5 rounded-full overflow-hidden bg-surface">
                        <motion.div
                          className="h-full bg-red-400"
                          initial={false}
                          animate={{ width: `${wS}%` }}
                          transition={{ duration: 0.3 }}
                        />
                        <motion.div
                          className="h-full bg-emerald-400"
                          initial={false}
                          animate={{ width: `${100 - wS}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <span className="text-[10px] text-tertiary tabular-nums w-20 text-right">
                        S {pS.toFixed(0)}% / H {pH.toFixed(0)}%
                      </span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Kết luận */}
          <div
            className="flex items-center gap-2 rounded-lg border-2 p-3"
            style={{
              borderColor: predictionColor,
              backgroundColor: predictionColor + "10",
            }}
          >
            {result.prediction === "SPAM" ? (
              <Trash2 size={18} style={{ color: predictionColor }} />
            ) : (
              <Inbox size={18} style={{ color: predictionColor }} />
            )}
            <span
              className="text-sm font-semibold"
              style={{ color: predictionColor }}
            >
              {result.prediction === "SPAM"
                ? "→ Chuyển vào thư mục Spam (hoặc Thùng rác)"
                : "→ Giữ lại trong hộp thư đến (Inbox)"}
            </span>
          </div>

          {/* Ghi chú nếu email mixed bị nhầm */}
          {active.id === "mixed" && (
            <Callout variant="warning" title="Trường hợp khó">
              Email này thực tế là thư công việc (HAM), nhưng có chứa từ
              &ldquo;khuyến mãi&rdquo; — một từ rất điển hình của spam.
              Naive Bayes vẫn phân loại đúng vì có hai từ công việc
              &ldquo;họp&rdquo; và &ldquo;báo cáo&rdquo; cân bằng lại.
              Nếu chỉ có một từ &ldquo;khuyến mãi&rdquo; mà thiếu các từ
              công việc, bộ lọc có thể chặn nhầm — đây là một bài toán
              khó thực tế.
            </Callout>
          )}
        </div>
      </section>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="naive-bayes-in-email-classification"
      >
        <Metric
          value="Paul Graham (2002): bộ lọc Bayesian đạt trên 99,5% chính xác chỉ với đếm từ"
          sourceRef={1}
        />
        <Metric
          value="SpamAssassin tích hợp Naive Bayes làm thành phần cốt lõi từ phiên bản 2.50"
          sourceRef={2}
        />
        <Metric
          value="Gmail chặn khoảng 15 tỷ thư rác mỗi ngày trên toàn hệ thống"
          sourceRef={3}
        />
        <Metric
          value="Tỷ lệ false positive (chặn nhầm thư hợp lệ) dưới 0,2%"
          sourceRef={1}
        />
      </ApplicationMetrics>

      {/* ──── LAPLACE SMOOTHING SLIDER ──── */}
      <section className="mb-10 space-y-4">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Sparkles size={16} className="text-accent" />
          Kéo thanh Laplace — xem bộ lọc xử lý từ lạ thế nào
        </h3>
        <p className="text-sm text-muted leading-relaxed">
          Khi gặp một từ chưa từng có trong dữ liệu huấn luyện
          (P(từ|Spam) = 0), phép nhân xác suất sẽ bằng 0 ngay — một từ lạ
          có thể &ldquo;giết&rdquo; cả dự đoán. Giải pháp:{" "}
          <strong>Laplace smoothing</strong> — thêm một lượng nhỏ vào mọi
          đếm để không xác suất nào bằng 0. Kéo thanh α bên dưới để thấy
          tác dụng.
        </p>

        <SliderGroup
          title={"Email mẫu: “trúng thưởng” + từ mới “blockchain”"}
          sliders={[
            {
              key: "alpha",
              label: "α (hằng số Laplace)",
              min: 0,
              max: 2,
              step: 0.05,
              defaultValue: 1,
            },
          ]}
          visualization={(values) => {
            const alpha = values.alpha;
            const features: WordStat[] = [
              { text: "trúng thưởng", pSpam: 0.82, pHam: 0.02 },
              { text: "blockchain (từ lạ)", pSpam: 0, pHam: 0 },
            ];
            const vocab = 20;
            const priorHam = 1 - PRIOR_SPAM;
            let logSpam = Math.log(PRIOR_SPAM);
            let logHam = Math.log(priorHam);
            for (const f of features) {
              const countSpam = f.pSpam * 100;
              const countHam = f.pHam * 100;
              const pS = (countSpam + alpha) / (100 + alpha * vocab);
              const pH = (countHam + alpha) / (100 + alpha * vocab);
              logSpam += Math.log(pS);
              logHam += Math.log(pH);
            }
            const maxLog = Math.max(logSpam, logHam);
            const uSpam = Math.exp(logSpam - maxLog);
            const uHam = Math.exp(logHam - maxLog);
            const total = uSpam + uHam;
            const pSpamFinal = uSpam / total;
            const prediction = uSpam > uHam ? "SPAM" : "HAM";

            return (
              <div className="w-full space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="text-[10px] uppercase tracking-wide text-tertiary mb-1">
                      P(blockchain | Spam)
                    </div>
                    <div className="text-lg font-bold text-foreground tabular-nums">
                      {alpha === 0
                        ? "0 (zero!)"
                        : (alpha / (100 + alpha * 20)).toFixed(4)}
                    </div>
                    <p className="text-[10px] text-muted mt-1 leading-snug">
                      {alpha === 0
                        ? "Không có smoothing → toàn bộ tích = 0"
                        : "Sau khi làm mượt: số rất nhỏ nhưng khác 0"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="text-[10px] uppercase tracking-wide text-tertiary mb-1">
                      Dự đoán cuối
                    </div>
                    <div
                      className="text-lg font-bold tabular-nums"
                      style={{
                        color:
                          prediction === "SPAM"
                            ? "#ef4444"
                            : "#22c55e",
                      }}
                    >
                      {alpha === 0 ? "BẾ TẮC" : prediction}
                    </div>
                    <p className="text-[10px] text-muted mt-1 leading-snug">
                      {alpha === 0
                        ? "Cả hai phe đều tích về 0 — không thể so sánh"
                        : `P(Spam) = ${(pSpamFinal * 100).toFixed(1)}%`}
                    </p>
                  </div>
                </div>
                <div className="rounded-lg bg-surface/50 border border-border p-3 text-xs text-foreground/85 leading-relaxed">
                  <strong>Quan sát:</strong>{" "}
                  {alpha === 0
                    ? "Với α = 0, một từ lạ duy nhất có thể làm toàn bộ tích bằng 0 — thuật toán mất khả năng phân loại dù có bằng chứng mạnh khác."
                    : alpha < 0.3
                      ? "α nhỏ (ít làm mượt) — từ lạ vẫn có trọng lượng rất thấp, dự đoán nghiêng nặng về phe có bằng chứng."
                      : alpha < 1.2
                        ? "α chuẩn (1.0 là mặc định của scikit-learn). Từ lạ được xử lý hợp lý — không quá nặng, không quá nhẹ."
                        : "α lớn (quá làm mượt) — mọi từ gần bằng nhau, dự đoán yếu đi vì bộ lọc “ngờ vực” mọi bằng chứng."}
                </div>
              </div>
            );
          }}
        />

        <Callout variant="tip" title="Giá trị α phổ biến trong thực tế">
          Gần như mọi thư viện (scikit-learn, NLTK) mặc định α = 1 —{" "}
          <em>Laplace smoothing</em>. Khi dataset rất lớn có thể dùng
          α = 0.1 để các xác suất gần sát quan sát thật. Hiếm khi cần
          điều chỉnh, nhưng biết tồn tại thanh này giúp bạn hiểu vì sao
          scikit-learn không bao giờ cho ra P = 0 tuyệt đối.
        </Callout>
      </section>

      {/* ──── TIMELINE ──── */}
      <section className="mb-10 space-y-4">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Sparkles size={16} className="text-accent" />
          Hành trình 25 năm của bộ lọc spam
        </h3>
        <p className="text-sm text-muted leading-relaxed">
          Naive Bayes sinh ra năm 2002 từ bài luận của Paul Graham.
          Ngày nay Gmail dùng nhiều tầng, nhưng Naive Bayes vẫn ở tầng
          đầu vì tốc độ và khả năng học từ phản hồi.
        </p>

        <div className="relative rounded-xl border border-border bg-card p-5">
          <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gradient-to-b from-sky-400 via-amber-400 to-emerald-400" />
          <div className="space-y-5">
            {[
              {
                year: "2002",
                title: "Paul Graham — “A Plan for Spam”",
                desc: "Chứng minh bộ lọc Bayesian đạt 99,5% chỉ bằng đếm từ. Biến đổi hoàn toàn cuộc chiến chống spam.",
                color: "#0ea5e9",
              },
              {
                year: "2004",
                title: "SpamAssassin 3.0 tích hợp Naive Bayes",
                desc: "Bộ lọc mã nguồn mở phổ biến nhất thế giới đưa Naive Bayes vào lõi. Hàng triệu server email áp dụng.",
                color: "#6366f1",
              },
              {
                year: "2007",
                title: "Gmail ra mắt với bộ lọc Bayesian",
                desc: "Google tích hợp vào hệ thống xử lý tỷ email mỗi ngày. Tỷ lệ false positive rơi xuống dưới 0,2%.",
                color: "#a855f7",
              },
              {
                year: "2015",
                title: "Adversarial evolution — Bayesian poisoning",
                desc: "Spammer bắt đầu chèn văn bản “vô hại” để pha loãng. Google phản ứng bằng cách kết hợp nhiều tín hiệu ngoài nội dung.",
                color: "#f59e0b",
              },
              {
                year: "2019",
                title: "TensorFlow thêm vào hệ thống Gmail",
                desc: "Mô hình học sâu bổ sung, chặn thêm 100 triệu spam/ngày mà bộ lọc cũ bỏ lỡ. Naive Bayes vẫn ở tầng đầu — bộ lọc mới ở tầng sâu hơn.",
                color: "#22c55e",
              },
            ].map((t) => (
              <div
                key={t.year}
                className="relative flex items-start gap-4 pl-2"
              >
                <div
                  className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 border-background font-bold text-white text-xs"
                  style={{ backgroundColor: t.color }}
                >
                  {t.year}
                </div>
                <div className="flex-1 pt-1">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: t.color }}
                  >
                    {t.title}
                  </p>
                  <p className="text-xs text-foreground/80 mt-1 leading-relaxed">
                    {t.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── FALSE POSITIVE / NEGATIVE TRADE-OFF ──── */}
      <section className="mb-10 space-y-4">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <ShieldCheck size={16} className="text-accent" />
          Gmail chọn đánh đổi như thế nào?
        </h3>
        <p className="text-sm text-muted leading-relaxed">
          Khi bộ lọc sai, có hai kiểu sai khác hẳn nhau. Gmail cố ý
          nghiêng về một kiểu — dùng ngưỡng quyết định cao để ưu tiên
          an toàn.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl border-2 border-red-300 bg-red-50/60 dark:bg-red-900/20 dark:border-red-700 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-600 dark:text-red-400" />
              <span className="text-sm font-bold text-red-800 dark:text-red-200">
                False positive (chặn nhầm email hợp lệ)
              </span>
            </div>
            <p className="text-xs text-foreground/85 leading-relaxed">
              Bộ lọc nói &ldquo;SPAM&rdquo; nhưng thực tế là email
              quan trọng từ sếp, khách hàng, hoặc ngân hàng.
            </p>
            <div className="rounded bg-red-100 dark:bg-red-900/30 px-2 py-1.5 text-[11px] text-red-800 dark:text-red-200">
              <strong>Tỉ lệ ở Gmail: &lt; 0,2%</strong> (cứ 1.000 email
              hợp lệ chỉ chặn nhầm tối đa 2 cái)
            </div>
          </div>
          <div className="rounded-xl border-2 border-amber-300 bg-amber-50/60 dark:bg-amber-900/20 dark:border-amber-700 p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <AlertTriangle size={16} aria-hidden="true" />
              <span className="text-sm font-bold">
                False negative (lọt spam vào Inbox)
              </span>
            </div>
            <p className="text-xs text-foreground/85 leading-relaxed">
              Bộ lọc nói &ldquo;HAM&rdquo; nhưng thực tế là spam. Bạn
              thấy vài quảng cáo trong hộp thư đến.
            </p>
            <div className="rounded bg-amber-100 dark:bg-amber-900/30 px-2 py-1.5 text-[11px] text-amber-800 dark:text-amber-200">
              <strong>Tỉ lệ ở Gmail: &lt; 0,5%</strong> — được chấp
              nhận cao hơn vì hậu quả nhẹ hơn chặn nhầm
            </div>
          </div>
        </div>

        <Callout variant="insight" title="Tại sao nghiêng về chấp nhận lọt spam?">
          Nếu bạn chặn nhầm một email từ ngân hàng báo nợ quá hạn —
          hậu quả có thể là nợ xấu. Nếu bạn thấy một email quảng cáo
          trong Inbox — bạn chỉ cần xoá. Hậu quả không đối xứng nên
          bộ lọc cũng đặt ngưỡng không đối xứng — P(Spam) phải rất
          cao (thường ≥ 0,9) mới chặn.
        </Callout>
      </section>

      {/* ──── THỬ TỰ TAY ──── */}
      <ApplicationTryIt topicSlug="naive-bayes-in-email-classification">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Bạn là bộ lọc Naive Bayes. Đây là các tình huống thường gặp
          trong đời thực — hãy thử phán đoán.
        </p>

        <div className="space-y-4">
          <InlineChallenge
            question="Email tiêu đề: 'Đơn hàng #HN2034 đã được giao thành công'. Nội dung: tên sản phẩm, thời gian giao, đường link theo dõi. Dự đoán?"
            options={["SPAM", "HAM (email hợp lệ)", "Không thể quyết định"]}
            correct={1}
            explanation="Các từ trong email này — “đơn hàng”, “giao thành công”, số hiệu — đều có P(từ|Ham) rất cao, P(từ|Spam) rất thấp. Naive Bayes phân loại là HAM với độ tin cậy cao. Đây là trường hợp dễ."
          />

          <InlineChallenge
            question="Email chứa từ lạ 'NFT mint drop' mà dữ liệu huấn luyện chưa từng thấy. Không có Laplace smoothing, chuyện gì xảy ra?"
            options={[
              "Thuật toán vẫn chạy bình thường",
              "P(từ|Spam) = 0, tích bằng 0, bộ lọc “bế tắc” vì cả hai phe đều về 0",
              "Email tự động được phân loại là SPAM",
              "Email tự động được phân loại là HAM",
            ]}
            correct={1}
            explanation="Một xác suất bằng 0 trong phép nhân kéo toàn bộ tích về 0. Cả P(Spam|email) lẫn P(Ham|email) đều bằng 0 — bộ lọc không thể quyết định. Đó là lý do mọi thư viện đều bật Laplace smoothing mặc định."
          />

          <InlineChallenge
            question="Kẻ gửi spam cố tình chèn 50 từ vô hại (tên, địa chỉ, câu chúc) vào email chứa 'trúng thưởng'. Chiêu này có đánh lừa được Naive Bayes không?"
            options={[
              "Có — nhiều từ vô hại “pha loãng” bằng chứng spam, bộ lọc phân loại sai là HAM",
              "Không — Naive Bayes vẫn giữ được dấu hiệu quyết định nhờ từ “trúng thưởng” có likelihood ratio cực lớn (41:1)",
              "Không thể biết trước",
              "Tùy thuộc ngày trong tuần",
            ]}
            correct={0}
            explanation="Đây chính xác là chiêu “Bayesian poisoning”. Hàng chục từ vô hại (likelihood ratio gần 1) tạo bằng chứng nhẹ về phía ham; nhân chung với tín hiệu spam mạnh có thể kéo xác suất vượt ngưỡng. Giải pháp thực tế: Gmail kết hợp Naive Bayes với nhiều tín hiệu khác (IP người gửi, chữ ký DKIM, phản hồi người dùng) để chống chiêu này."
          />

          <InlineChallenge
            question="Bạn nhấn 'Báo cáo spam' cho một email. Điều gì xảy ra ở phía Gmail?"
            options={[
              "Email bị xoá vĩnh viễn, không ảnh hưởng gì khác",
              "Hệ thống cập nhật bảng P(từ|spam) cho các từ trong email đó — bộ lọc học được chiêu mới",
              "Một kỹ sư Google sẽ xem xét thủ công",
              "Không có gì xảy ra — chỉ là chức năng trên giao diện",
            ]}
            correct={1}
            explanation="Mỗi lần bạn báo cáo spam, Gmail cộng +1 vào đếm cho mỗi từ trong email đó ở lớp “spam”. Khi 100 người khác cũng báo cáo cùng email (hoặc email tương tự), tần suất các từ đó trong lớp spam tăng → P(từ|spam) tăng → lần sau bộ lọc tự chặn. Đây là vòng phản hồi quy mô 1,8 tỷ người dùng."
          />
        </div>

        <div className="mt-6">
          <Callout variant="insight" title="Vì sao Naive Bayes sống sót đến 2026">
            Dù ngày nay Gmail dùng nhiều tầng (TensorFlow, RNN, reputation
            scoring), <strong>Naive Bayes vẫn chạy ở lớp đầu</strong> vì
            huấn luyện cực nhanh (chỉ đếm từ), dễ cập nhật từng giờ từ
            phản hồi người dùng, và giải thích được (mỗi từ có đóng góp
            rõ ràng). Khi có thuật toán mới 20 năm tuổi vẫn là xương sống
            của hệ thống chặn 15 tỷ email/ngày, bạn biết nó đã vượt qua
            mọi bài kiểm tra thực tế khắc nghiệt nhất.
          </Callout>
        </div>

        <div className="mt-4 flex items-center justify-center">
          <div className="flex items-center gap-2 rounded-full border border-border bg-surface/40 px-4 py-2 text-xs text-muted">
            <ChevronRight size={14} />
            Kế tiếp: tìm hiểu thuật toán khác — logistic regression —
            mô hình tính xác suất không cần giả định độc lập.
          </div>
        </div>
      </ApplicationTryIt>

      <ApplicationCounterfactual
        parentTitleVi="Naive Bayes"
        topicSlug="naive-bayes-in-email-classification"
      >
        <p>
          Không có Naive Bayes, bộ lọc spam sẽ phải dựa hoàn toàn vào
          luật cứng: <em>nếu email chứa từ X thì chặn</em>. Kẻ gửi spam
          chỉ cần thay đổi một từ là qua mặt. Paul Graham mô tả đó là
          &ldquo;cuộc chạy đua vũ trang mà người phòng thủ luôn thua&rdquo;.
        </p>
        <p>
          Naive Bayes thay đổi cuộc chơi: thay vì đối phó từng chiêu trò
          riêng lẻ, thuật toán nhìn vào xác suất tổng hợp của toàn bộ nội
          dung. Kẻ gửi spam phải thay đổi gần như toàn bộ email mới qua
          được — và khi đó, email không còn đủ &ldquo;hấp dẫn&rdquo; để
          lừa người đọc nữa.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
