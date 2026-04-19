"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  ArrowRight,
  FileWarning,
  Sparkles,
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
import { Callout } from "@/components/interactive";

/* ==========================================================================
 *  METADATA — giữ nguyên y nguyên như hiện tại
 * ========================================================================== */
export const metadata: TopicMeta = {
  slug: "explainability-in-credit-decisions",
  title: "Explainability in Credit Decisions",
  titleVi: "Giải thích được trong Quyết định Tín dụng",
  description:
    "GDPR và CFPB yêu cầu ngân hàng phải giải thích khi AI từ chối cấp tín dụng — không được dùng hộp đen",
  category: "ai-safety",
  tags: ["explainability", "credit", "application"],
  difficulty: "beginner",
  relatedSlugs: ["explainability"],
  vizType: "static",
  applicationOf: "explainability",
  featuredApp: {
    name: "GDPR / CFPB Credit Decisions",
    productFeature: "Right to Explanation for Automated Credit Scoring",
    company: "EU / US Regulators",
    countryOrigin: "EU",
  },
  sources: [
    {
      title:
        "Art. 22 GDPR — Automated individual decision-making, including profiling",
      publisher: "GDPR-info.eu",
      url: "https://gdpr-info.eu/art-22-gdpr/",
      date: "2018-05",
      kind: "documentation",
    },
    {
      title:
        "CFPB Issues Guidance on Credit Denials by Lenders Using Artificial Intelligence",
      publisher: "Consumer Financial Protection Bureau",
      url: "https://www.consumerfinance.gov/about-us/newsroom/cfpb-issues-guidance-on-credit-denials-by-lenders-using-artificial-intelligence/",
      date: "2023-09",
      kind: "documentation",
    },
    {
      title:
        "Understanding Right to Explanation and Automated Decision-Making in Europe's GDPR and AI Act",
      publisher: "TechPolicy.Press",
      url: "https://www.techpolicy.press/understanding-right-to-explanation-and-automated-decisionmaking-in-europes-gdpr-and-ai-act/",
      date: "2024-03",
      kind: "news",
    },
    {
      title:
        "CFPB Applies Adverse Action Notification Requirement to Artificial Intelligence Models",
      publisher: "Skadden, Arps, Slate, Meagher & Flom LLP",
      url: "https://www.skadden.com/insights/publications/2024/01/cfpb-applies-adverse-action-notification-requirement",
      date: "2024-01",
      kind: "news",
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

/* ==========================================================================
 *  VISUAL: Câu chuyện Apple Card 2019 — 2 cột vợ chồng
 *  Cùng tài sản, cùng lịch sử tín dụng, cùng đơn xin → hạn mức khác 20 lần
 * ========================================================================== */

interface SpouseCol {
  icon: string;
  name: string;
  subtitle: string;
  resultText: string;
  resultBg: string;
  cardBg: string;
  iconBg: string;
  delay: number;
}

const SPOUSES: SpouseCol[] = [
  {
    icon: "👨",
    name: "David (chồng)",
    subtitle: "Lập trình viên nổi tiếng",
    resultText: "20× cao hơn",
    resultBg: "bg-emerald-500",
    cardBg: "",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    delay: 0,
  },
  {
    icon: "👩",
    name: "Jennifer (vợ)",
    subtitle: "Điểm tín dụng cao hơn chồng",
    resultText: "thấp hơn 20 lần",
    resultBg: "bg-red-500",
    cardBg: "bg-red-50/40 dark:bg-red-900/10",
    iconBg: "bg-pink-100 dark:bg-pink-900/30",
    delay: 0.15,
  },
];

const SHARED_FACTS = [
  { k: "Tài khoản chung", v: "Có" },
  { k: "Lịch sử tín dụng", v: "Sạch" },
  { k: "Nộp thuế chung", v: "Có" },
];

function AppleCardStoryVisual() {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="my-6 rounded-2xl border-2 border-border bg-background/60 overflow-hidden">
      <div className="px-4 py-3 bg-slate-900 text-white text-sm font-semibold flex items-center gap-2">
        <FileWarning className="h-4 w-4 text-amber-400" />
        Tháng 11/2019 — Đơn xin thẻ Apple Card của hai vợ chồng
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
        {SPOUSES.map((s) => (
          <div key={s.name} className={`p-4 space-y-2 ${s.cardBg}`}>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-xl ${s.iconBg}`}
              >
                {s.icon}
              </span>
              <div>
                <p className="text-sm font-bold">{s.name}</p>
                <p className="text-xs text-muted">{s.subtitle}</p>
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              {SHARED_FACTS.map((f) => (
                <div key={f.k} className="flex justify-between">
                  <span className="text-muted">{f.k}</span>
                  <span className="font-semibold">{f.v}</span>
                </div>
              ))}
            </div>
            <AnimatePresence>
              {revealed && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: s.delay }}
                  className={`mt-3 rounded-lg ${s.resultBg} text-white p-3 text-center`}
                >
                  <p className="text-xs uppercase opacity-90">AI cấp hạn mức</p>
                  <p className="text-2xl font-black">{s.resultText}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 bg-surface border-t border-border flex items-center justify-between gap-3">
        <p className="text-xs text-muted">
          Cùng tài sản, cùng đơn — AI ra kết quả khác nhau hoàn toàn.
        </p>
        <button
          onClick={() => setRevealed(!revealed)}
          className="px-3 py-1.5 rounded-full bg-accent text-white text-xs font-semibold hover:bg-accent-dark transition-colors"
        >
          {revealed ? "Ẩn kết quả" : "Xem kết quả AI"}
        </button>
      </div>

      {revealed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800 flex items-start gap-2"
        >
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-foreground/90 leading-relaxed">
            Khi David hỏi Apple &ldquo;Vì sao?&rdquo;, nhân viên đáp:{" "}
            <em>&ldquo;Đó là thuật toán quyết định.&rdquo;</em> Không ai — kể
            cả Goldman Sachs (ngân hàng đối tác) — giải thích được. Chuyện lan
            nhanh trên mạng xã hội, cơ quan giám sát tài chính New York mở
            điều tra.
          </p>
        </motion.div>
      )}
    </div>
  );
}

/* ==========================================================================
 *  VISUAL: So sánh 2 kịch bản — có giải thích vs không
 * ========================================================================== */

interface ContrastCol {
  tone: "red" | "emerald";
  icon: typeof Lock;
  title: string;
  bankReply: string;
  customer: string;
  result: string;
}

const CONTRAST_COLS: ContrastCol[] = [
  {
    tone: "red",
    icon: Lock,
    title: "Trước đây — hộp đen",
    bankReply:
      "Rất tiếc, đơn của anh/chị bị từ chối. Thuật toán AI đã quyết định.",
    customer: "Không biết vì sao. Không biết phải sửa gì. Không thể khiếu nại.",
    result:
      "Thiên kiến giới tính, chủng tộc, khu vực ẩn bên trong mà không ai phát hiện.",
  },
  {
    tone: "emerald",
    icon: Unlock,
    title: "Bây giờ — luật bắt buộc giải thích",
    bankReply:
      "Đơn bị từ chối vì: (1) tỷ lệ nợ hiện tại 48% thu nhập, (2) lịch sử có 2 khoản chậm trả trong 12 tháng gần nhất.",
    customer: "Hiểu được lý do. Biết phải làm gì. Có thể khiếu nại nếu sai.",
    result:
      "Khi thấy được lý do, kiểm tra viên và tòa án có thể phát hiện và xử lý thiên kiến ẩn.",
  },
];

function ExplanationContrastVisual() {
  return (
    <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      {CONTRAST_COLS.map((c) => {
        const Icon = c.icon;
        const isRed = c.tone === "red";
        const borderClass = isRed
          ? "border-red-300 dark:border-red-800"
          : "border-emerald-300 dark:border-emerald-800";
        const bgClass = isRed
          ? "bg-red-50 dark:bg-red-900/20"
          : "bg-emerald-50 dark:bg-emerald-900/20";
        const titleClass = isRed
          ? "text-red-800 dark:text-red-200"
          : "text-emerald-800 dark:text-emerald-200";
        const iconClass = isRed ? "text-red-600" : "text-emerald-600";
        const cardBorder = isRed
          ? "border-red-200 dark:border-red-800"
          : "border-emerald-200 dark:border-emerald-800";
        const pillBg = isRed
          ? "bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700"
          : "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700";
        const pillText = isRed
          ? "text-red-700 dark:text-red-300"
          : "text-emerald-700 dark:text-emerald-300";
        const Badge = isRed ? XCircle : CheckCircle2;
        return (
          <div
            key={c.tone}
            className={`rounded-xl border-2 p-4 space-y-3 ${borderClass} ${bgClass}`}
          >
            <div className="flex items-center gap-2">
              <Icon className={`h-5 w-5 ${iconClass}`} />
              <h4 className={`font-bold text-sm ${titleClass}`}>{c.title}</h4>
            </div>
            <div className="space-y-2 text-xs">
              <div
                className={`rounded-lg bg-white dark:bg-slate-900 p-2.5 border ${cardBorder}`}
              >
                <p className="font-semibold mb-1">Ngân hàng trả lời:</p>
                <p className="italic text-muted">&ldquo;{c.bankReply}&rdquo;</p>
              </div>
              <div
                className={`rounded-lg bg-white dark:bg-slate-900 p-2.5 border ${cardBorder}`}
              >
                <p className="font-semibold mb-1">Khách hàng:</p>
                <p>{c.customer}</p>
              </div>
              <div className={`rounded-lg p-2.5 border ${pillBg}`}>
                <p
                  className={`font-semibold flex items-center gap-1 ${titleClass}`}
                >
                  <Badge className="h-3.5 w-3.5" /> Hậu quả
                </p>
                <p className={pillText}>{c.result}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ==========================================================================
 *  VISUAL: Timeline — các cột mốc pháp lý
 * ========================================================================== */

interface TimelineItem {
  year: string;
  where: string;
  title: string;
  detail: string;
  color: string;
  icon: string;
}

const TIMELINE: TimelineItem[] = [
  {
    year: "2018",
    where: "EU",
    title: "GDPR Điều 22 có hiệu lực",
    detail:
      "Người dân EU có quyền không bị quyết định hoàn toàn tự động; tổ chức phải cung cấp 'thông tin có ý nghĩa về logic'.",
    color: "bg-blue-500",
    icon: "🇪🇺",
  },
  {
    year: "2019",
    where: "Mỹ",
    title: "Vụ Apple Card — DHH nổ trên Twitter",
    detail:
      "Cơ quan dịch vụ tài chính New York (NYDFS) mở điều tra; Goldman Sachs buộc phải công khai một phần cơ chế.",
    color: "bg-red-500",
    icon: "🇺🇸",
  },
  {
    year: "2023",
    where: "Mỹ",
    title: "CFPB Circular 2023-03",
    detail:
      "Cấm ngân hàng dùng biểu mẫu 'tích ô' chung chung khi từ chối tín dụng — phải nêu lý do cá nhân, cụ thể.",
    color: "bg-purple-500",
    icon: "🇺🇸",
  },
  {
    year: "2023",
    where: "Việt Nam",
    title: "Nghị định 13/2023/NĐ-CP",
    detail:
      "Quy định bảo vệ dữ liệu cá nhân. Có điều khoản về quyền được biết khi dữ liệu bị xử lý tự động và phản đối quyết định.",
    color: "bg-emerald-500",
    icon: "🇻🇳",
  },
  {
    year: "2024",
    where: "EU",
    title: "EU AI Act — xếp tín dụng là 'rủi ro cao'",
    detail:
      "AI dùng cho xét tín dụng, tuyển dụng, y tế, giáo dục bắt buộc có tài liệu giải thích 'thực chất'.",
    color: "bg-indigo-500",
    icon: "🇪🇺",
  },
];

function LegalTimelineVisual() {
  return (
    <div className="my-6 space-y-3">
      <p className="text-xs text-muted text-center">
        Từ vụ Apple Card đến các đạo luật bắt buộc giải thích — 6 năm thay đổi
      </p>
      <div className="relative pl-6 space-y-4 border-l-2 border-dashed border-border ml-3">
        {TIMELINE.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.35, delay: i * 0.06 }}
            className="relative"
          >
            <div
              className={`absolute -left-[1.8rem] top-1 h-5 w-5 rounded-full ${item.color} ring-4 ring-background flex items-center justify-center text-[10px]`}
            >
              <span>{item.icon}</span>
            </div>
            <div className="rounded-lg border border-border bg-card p-3 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono text-muted">
                  {item.year}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-surface text-muted">
                  {item.where}
                </span>
                <span className="text-sm font-bold">{item.title}</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                {item.detail}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ==========================================================================
 *  VISUAL: Quy trình xử lý khi bị từ chối — flow các bước
 * ========================================================================== */

const PROCESS_STEPS: Array<{
  step: number;
  title: string;
  detail: string;
  icon: string;
}> = [
  { step: 1, title: "AI ra quyết định", detail: "Mô hình chấm điểm cho hồ sơ vay.", icon: "🤖" },
  { step: 2, title: "Hệ thống giải thích", detail: "Công cụ như SHAP/LIME phân tích mô hình, xác định yếu tố nào đã đẩy quyết định.", icon: "🔍" },
  { step: 3, title: "Kiểm duyệt nội bộ", detail: "Nhân viên ngân hàng kiểm tra: lý do có hợp pháp không? Có yếu tố nhạy cảm lọt vào không?", icon: "⚖️" },
  { step: 4, title: "Gửi lý do cho khách hàng", detail: "Cá nhân hóa, cụ thể, bằng ngôn ngữ thường — không dùng thuật ngữ kỹ thuật.", icon: "📩" },
];

function ProcessFlowVisual() {
  return (
    <div className="my-6 space-y-2">
      <p className="text-xs text-muted text-center">
        Quy trình chuẩn — từ lúc AI ra quyết định đến khi khách hàng nhận lý do
      </p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        {PROCESS_STEPS.map((s, i) => (
          <motion.div
            key={s.step}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: i * 0.08 }}
            className="relative rounded-lg border border-border bg-card p-3 space-y-1.5"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white text-xs font-bold">
                {s.step}
              </span>
              <span className="text-lg">{s.icon}</span>
            </div>
            <p className="text-xs font-semibold">{s.title}</p>
            <p className="text-[11px] text-muted leading-relaxed">
              {s.detail}
            </p>
            {i < PROCESS_STEPS.length - 1 && (
              <ArrowRight className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted bg-background" />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ==========================================================================
 *  MAIN COMPONENT
 * ========================================================================== */

export default function ExplainabilityInCreditDecisions() {
  return (
    <ApplicationLayout metadata={metadata} parentTitleVi="Giải thích được">
      <ApplicationHero
        parentTitleVi="Giải thích được"
        topicSlug="explainability-in-credit-decisions"
      >
        <p>
          Bạn nộp đơn vay mua nhà và bị từ chối. Khi bạn hỏi lý do, nhân viên
          ngân hàng đáp: &ldquo;<em>Thuật toán AI quyết định</em>&rdquo;.
          Không ai — kể cả chính nhân viên — có thể giải thích tại sao. Đây
          không phải kịch bản giả tưởng; đây là câu chuyện của hàng triệu
          người trên thế giới, và đã trở thành chủ đề của nhiều đạo luật lớn.
        </p>
        <p>
          Chủ đề này không về một công ty duy nhất — nó về <strong>cơ quan
          quản lý</strong>: GDPR của Liên minh Châu Âu (EU), Cục Bảo vệ Tài
          chính Người tiêu dùng Mỹ (CFPB), và Nghị định 13/2023 của Việt Nam.
          Họ đã ra luật bắt buộc ngân hàng phải giải thích khi AI quyết định
          số phận tài chính của người dân.
        </p>

        <AppleCardStoryVisual />

        <Callout variant="warning" title="Vì sao vụ Apple Card quan trọng?">
          <p>
            Năm 2019, lập trình viên David Heinemeier Hansson (DHH, người tạo
            ra framework Ruby on Rails) viết trên Twitter: vợ ông được AI Apple
            Card cấp hạn mức thấp hơn ông <strong>20 lần</strong> — dù cả hai
            có tài khoản chung, cùng nộp thuế chung, và điểm tín dụng của vợ
            còn cao hơn. Khi cả hai hỏi, nhân viên đều không giải thích được.
            Câu chuyện lan truyền chỉ sau vài giờ, Steve Wozniak (đồng sáng
            lập Apple) cũng nói vợ mình gặp tình cảnh tương tự. Cơ quan dịch
            vụ tài chính New York mở điều tra. Từ đó đến nay, mỗi năm đều có
            thêm một đạo luật mới buộc ngân hàng phải giải thích.
          </p>
        </Callout>
      </ApplicationHero>

      <ApplicationProblem topicSlug="explainability-in-credit-decisions">
        <p>
          <strong>Explainability</strong> (giải thích được — hay XAI,
          Explainable AI) là khả năng trình bày lý do cụ thể đằng sau mỗi
          quyết định của AI, bằng ngôn ngữ mà người bình thường có thể hiểu và
          kiểm chứng.
        </p>
        <p>
          Nhưng nhiều mô hình chấm điểm tín dụng hiện đại sử dụng học sâu
          (deep learning) với hàng triệu, thậm chí hàng tỷ tham số. Những mô
          hình này có thể chính xác hơn — nhưng chúng là <strong>hộp đen</strong>:
          ngay cả chính đội ngũ kỹ sư xây dựng cũng khó nói chính xác vì sao
          mô hình cho người A vay mà từ chối người B.
        </p>

        <ExplanationContrastVisual />

        <p>
          Khi một quyết định AI ảnh hưởng trực tiếp đến cuộc sống — mua nhà,
          khởi nghiệp, đi du học, chữa bệnh — việc không thể giải thích tại
          sao bị từ chối là vi phạm quyền cơ bản của người tiêu dùng. Đó là lý
          do các nhà làm luật ở châu Âu, Mỹ, và Việt Nam đều đang siết chặt
          yêu cầu giải thích.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Giải thích được"
        topicSlug="explainability-in-credit-decisions"
      >
        <Beat step={1}>
          <p>
            <strong>GDPR Điều 22 — quyền không bị quyết định tự động.</strong>{" "}
            Từ 2018, người dân EU có quyền không bị áp đặt bởi một quyết định
            hoàn toàn tự động nếu nó tạo ra &ldquo;hiệu ứng pháp lý&rdquo; hay
            &ldquo;ảnh hưởng đáng kể tương tự&rdquo;. Tổ chức phải cung cấp{" "}
            <em>&ldquo;thông tin có ý nghĩa về logic liên quan&rdquo;</em> —
            không chỉ nói chung chung, mà phải cho phép cá nhân hiểu và phản
            đối.
          </p>
        </Beat>

        <Beat step={2}>
          <p>
            <strong>
              Tòa án Công lý EU xác nhận quyền giải thích thực chất.
            </strong>{" "}
            Năm 2024, trong vụ Dun &amp; Bradstreet Austria, Tòa án Công lý
            Liên minh Châu Âu (CJEU) ra phán quyết: tổ chức phải giải thích
            &ldquo;quy trình và nguyên tắc thực sự được áp dụng&rdquo; — không
            được trốn tránh bằng cách mô tả chung chung. Giải thích phải cụ
            thể cho từng trường hợp.
          </p>
        </Beat>

        <Beat step={3}>
          <p>
            <strong>CFPB cấm biểu mẫu &ldquo;đánh dấu ô&rdquo;.</strong> Tháng
            9 năm 2023, Cục Bảo vệ Tài chính Người tiêu dùng Mỹ ban hành thông
            tư (CFPB Circular 2023-03): ngân hàng dùng AI để quyết định tín
            dụng không được sử dụng biểu mẫu từ chối chung chung. Mỗi lần từ
            chối phải nêu lý do cá nhân hóa, cụ thể, liên quan trực tiếp đến
            hành vi tài chính của người nộp đơn.
          </p>
        </Beat>

        <Beat step={4}>
          <p>
            <strong>Buộc hiểu mô hình trước khi triển khai.</strong> CFPB
            tuyên bố rõ: tổ chức tín dụng phải hiểu hệ thống AI của mình —
            biết đầu vào nào được dùng và ảnh hưởng đến kết quả ra sao —{" "}
            <em>bất kể mô hình phức tạp đến đâu</em>. Luật Cơ hội Tín dụng
            Bình đẳng (ECOA) không cho phép dùng &ldquo;hộp đen&rdquo; nếu
            điều đó nghĩa là không giải thích được quyết định.
          </p>
        </Beat>

        <Beat step={5}>
          <p>
            <strong>Việt Nam — Nghị định 13/2023/NĐ-CP.</strong> Có hiệu lực
            từ tháng 7/2023, nghị định quy định bảo vệ dữ liệu cá nhân, trong
            đó Điều 11 và 12 nói về quyền được biết và phản đối khi dữ liệu
            bị xử lý tự động. Ngân hàng Nhà nước cũng đã có các văn bản hướng
            dẫn sử dụng AI trong ngành ngân hàng phải tuân thủ nguyên tắc
            minh bạch.
          </p>
        </Beat>

        <Beat step={6}>
          <p>
            <strong>EU AI Act — tín dụng là &ldquo;rủi ro cao&rdquo;.</strong>{" "}
            Từ 2024, đạo luật AI của EU chính thức phân loại các ứng dụng AI
            theo mức rủi ro. Chấm điểm tín dụng nằm ở nhóm &ldquo;rủi ro
            cao&rdquo; — bắt buộc có tài liệu kỹ thuật, có quy trình giám sát
            con người, và có khả năng giải thích từng quyết định.
          </p>
        </Beat>

        <ProcessFlowVisual />

        <LegalTimelineVisual />

        <Callout variant="tip" title="Điều đang thay đổi ở Việt Nam">
          <p>
            Các ngân hàng lớn như VPBank, Techcombank, MB Bank đều đang triển
            khai AI chấm điểm tín dụng — nhưng cùng lúc phải đầu tư hệ thống
            giải thích. Fintech như Trusting Social, FIIN Credit cũng phải
            tuân thủ Nghị định 13/2023 khi xử lý dữ liệu cá nhân người Việt.
            Xu hướng chung: AI mạnh hơn, nhưng buộc phải &ldquo;trong
            suốt&rdquo; hơn.
          </p>
        </Callout>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="explainability-in-credit-decisions"
      >
        <Metric
          value="GDPR Điều 22 bảo vệ hơn 450 triệu người dân EU khỏi quyết định tự động thiếu giải thích"
          sourceRef={1}
        />
        <Metric
          value="CFPB Circular 2023-03 yêu cầu lý do từ chối cá nhân hóa cho mọi quyết định tín dụng AI"
          sourceRef={2}
        />
        <Metric
          value="CJEU xác nhận quyền được giải thích thực chất — không chỉ giải thích hình thức"
          sourceRef={3}
        />
        <Metric
          value="CFPB xem quy định thông báo ngược bất lợi (Adverse Action Notification) áp dụng cho cả mô hình AI phức tạp"
          sourceRef={4}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Giải thích được"
        topicSlug="explainability-in-credit-decisions"
      >
        <p>
          <strong>Nếu không có yêu cầu giải thích</strong>, ngân hàng có thể
          triển khai mô hình AI hộp đen mà chính bản thân họ cũng không hiểu
          vì sao người này được duyệt còn người kia bị từ chối. Thiên kiến ẩn
          trong dữ liệu lịch sử — phân biệt giới tính, chủng tộc, khu vực —
          sẽ được AI tái tạo và khuếch đại, mà không ai phát hiện trong nhiều
          năm.
        </p>

        <Callout variant="warning" title="Vụ Apple Card là bài học">
          <p>
            Mô hình của Goldman Sachs không được thiết kế để phân biệt giới
            tính — đội ngũ kỹ sư thề rằng họ không hề nạp &ldquo;giới
            tính&rdquo; vào làm đầu vào. Nhưng mô hình vẫn học được sự khác
            biệt qua các yếu tố gián tiếp (proxy): tên riêng, tài khoản mua
            sắm, hành vi chi tiêu. Không ai phát hiện cho đến khi một khách
            hàng có tiếng nói nổ trên mạng xã hội.
          </p>
          <p className="mt-2">
            <strong>
              Nếu có quy định giải thích ngay từ đầu, lỗi này đã được phát
              hiện trong giai đoạn kiểm thử — không phải sau khi hàng triệu
              khách hàng đã bị ảnh hưởng.
            </strong>
          </p>
        </Callout>

        <p>
          Yêu cầu giải thích buộc ngành tài chính phải đầu tư vào Explainable
          AI — tạo ra các mô hình vừa chính xác vừa minh bạch. Công cụ như
          SHAP, LIME, counterfactual explanation, và mô hình minh bạch hơn
          (cây quyết định, hồi quy tuyến tính có ràng buộc) được ứng dụng rộng
          rãi trong các ngân hàng hiện đại. Và quan trọng nhất:{" "}
          <strong>
            lý do từ chối phải là hành vi tài chính cụ thể
          </strong>{" "}
          (ví dụ &ldquo;tỷ lệ nợ 48% vượt ngưỡng 40%&rdquo;), không được dùng
          yếu tố bị cấm như giới tính, chủng tộc, hay địa chỉ — kể cả khi đó
          chỉ là &ldquo;proxy&rdquo; gián tiếp.
        </p>

        <Callout variant="insight" title="Điều gì quyết định bạn có nhà hay không?">
          <p>
            Không phải AI. Mà là việc AI có phải <em>giải thích cho bạn</em>{" "}
            hay không. Nếu có giải thích, bạn có thể sửa sai. Nếu có giải
            thích, bạn có thể khiếu nại. Nếu có giải thích, xã hội có thể
            phát hiện thiên kiến và bảo vệ người yếu thế.
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-accent" />
            <span>
              Đây là lý do &ldquo;quyền được giải thích&rdquo; đang dần trở
              thành quyền con người trong kỷ nguyên AI.
            </span>
          </p>
        </Callout>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
