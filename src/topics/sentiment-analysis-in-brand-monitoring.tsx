"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Flame,
  TrendingDown,
  Bell,
  Globe,
  Radio,
  Newspaper,
  MessageCircle,
  Share2,
  ShieldCheck,
  Smile,
  Frown,
  Angry,
  AlertTriangle,
  Eye,
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
import { InlineChallenge, Callout } from "@/components/interactive";

export const metadata: TopicMeta = {
  slug: "sentiment-analysis-in-brand-monitoring",
  title: "Sentiment Analysis in Brand Monitoring",
  titleVi: "Phân tích cảm xúc trong giám sát thương hiệu",
  description:
    "Cách Brandwatch, Talkwalker, YouNet Media và Buzzmetrics dùng AI phân tích cảm xúc để theo dõi khen chê trên mạng xã hội, phát hiện khủng hoảng truyền thông trong vài phút.",
  category: "nlp",
  tags: ["sentiment-analysis", "brand-monitoring", "application"],
  difficulty: "beginner",
  relatedSlugs: ["sentiment-analysis"],
  vizType: "static",
  applicationOf: "sentiment-analysis",
  featuredApp: {
    name: "Brandwatch",
    productFeature: "Listen (Social Listening)",
    company: "Brandwatch (Cision)",
    countryOrigin: "GB",
  },
  sources: [
    {
      title: "The Data Science Behind Brandwatch's New Sentiment Analysis",
      publisher: "Brandwatch",
      url: "https://www.brandwatch.com/blog/data-science-behind-brandwatchs-new-sentiment-analysis/",
      date: "2022-01",
      kind: "engineering-blog",
    },
    {
      title: "Sentiment and Emotion Analysis",
      publisher: "Brandwatch Help Center",
      url: "https://social-media-management-help.brandwatch.com/hc/en-us/articles/4555786479901-Sentiment-and-Emotion-Analysis",
      date: "2025",
      kind: "documentation",
    },
    {
      title: "Brandwatch is acquired by Cision for $450M",
      publisher: "TechCrunch",
      url: "https://techcrunch.com/2021/02/26/brandwatch-is-acquired-by-cision-for-450m-creating-a-pr-marketing-and-social-listening-giant/",
      date: "2021-02",
      kind: "news",
    },
    {
      title: "Talkwalker — AI-Powered Consumer Intelligence Platform",
      publisher: "Talkwalker (Hootsuite)",
      url: "https://www.talkwalker.com/",
      date: "2025",
      kind: "documentation",
    },
    {
      title: "YouNet Media — Social Listening for Vietnam",
      publisher: "YouNet Group",
      url: "https://younetmedia.com/",
      date: "2025",
      kind: "documentation",
    },
    {
      title: "Buzzmetrics — Social Intelligence for Vietnamese Brands",
      publisher: "Buzzmetrics Vietnam",
      url: "https://buzzmetrics.com/",
      date: "2025",
      kind: "documentation",
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

/* ── Dữ liệu giả cho dashboard khủng hoảng ──────────────────────── */
type CrisisPost = {
  time: string; // "08:00"
  source: "Facebook" | "TikTok" | "Báo chí" | "Twitter";
  text: string;
  sentiment: "positive" | "neutral" | "negative";
  reach: number; // nghìn người
};

const CRISIS_TIMELINE: CrisisPost[] = [
  { time: "07:30", source: "Facebook", text: "Vừa bay hãng X, tiếp viên thân thiện, đúng giờ 🙂", sentiment: "positive", reach: 2 },
  { time: "08:00", source: "Facebook", text: "Nghe nói sáng nay có sự cố trên chuyến HAN-SGN?", sentiment: "neutral", reach: 5 },
  { time: "08:15", source: "TikTok", text: "Video hành khách bị đối xử thô bạo trên hãng X 🤯", sentiment: "negative", reach: 45 },
  { time: "08:40", source: "Facebook", text: "Không bao giờ bay hãng X lần nữa, quá tệ!", sentiment: "negative", reach: 18 },
  { time: "09:00", source: "TikTok", text: "Tẩy chay hãng X đi mọi người ơi 😡", sentiment: "negative", reach: 120 },
  { time: "09:15", source: "Facebook", text: "Mong hãng sớm xử lý và xin lỗi hành khách", sentiment: "neutral", reach: 12 },
  { time: "09:30", source: "Báo chí", text: "Hãng X lên tiếng về video gây bão mạng", sentiment: "neutral", reach: 200 },
  { time: "10:00", source: "Facebook", text: "Phản hồi nhanh, có trách nhiệm — mình ủng hộ xử lý này", sentiment: "positive", reach: 30 },
  { time: "10:30", source: "Twitter", text: "Hãng X công khai xin lỗi và bồi thường", sentiment: "positive", reach: 90 },
];

const HOUR_LABELS = ["07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30"];

const EMOTION_COLORS: Record<string, string> = {
  positive: "#22c55e",
  neutral: "#f59e0b",
  negative: "#ef4444",
};

const SOURCE_ICONS: Record<CrisisPost["source"], typeof Radio> = {
  Facebook: MessageCircle,
  TikTok: Radio,
  "Báo chí": Newspaper,
  Twitter: Share2,
};

export default function SentimentAnalysisInBrandMonitoring() {
  /* ── Dashboard khủng hoảng theo giờ ──────────────── */
  const [hoverHour, setHoverHour] = useState<number | null>(null);

  const hourlyCounts = useMemo(() => {
    return HOUR_LABELS.map((h) => {
      const p = CRISIS_TIMELINE.filter(
        (c) => c.time >= h && c.time < addMinutes(h, 30),
      );
      return {
        hour: h,
        positive: p.filter((x) => x.sentiment === "positive").length,
        neutral: p.filter((x) => x.sentiment === "neutral").length,
        negative: p.filter((x) => x.sentiment === "negative").length,
        reach: p.reduce((s, x) => s + x.reach, 0),
      };
    });
  }, []);

  const peakNegative = Math.max(...hourlyCounts.map((h) => h.negative));
  const totalReach = hourlyCounts.reduce((s, h) => s + h.reach, 0);

  /* ── 6 cảm xúc cơ bản (Brandwatch emotion analysis) ──────── */
  const EMOTIONS = [
    { label: "Vui mừng", count: 34, color: "#22c55e", icon: Smile },
    { label: "Ngạc nhiên", count: 18, color: "#06b6d4", icon: AlertTriangle },
    { label: "Buồn bã", count: 22, color: "#6366f1", icon: Frown },
    { label: "Giận dữ", count: 58, color: "#ef4444", icon: Angry },
    { label: "Sợ hãi", count: 14, color: "#a855f7", icon: AlertTriangle },
    { label: "Ghê tởm", count: 9, color: "#f43f5e", icon: Frown },
  ];
  const maxEmotion = Math.max(...EMOTIONS.map((e) => e.count));

  /* ── Các nền tảng social listening ───────────────── */
  const PLATFORMS = [
    { name: "Brandwatch", origin: "Anh Quốc", feature: "Listen · Consumer Research · Iris AI", accuracy: "75%", color: "#3b82f6" },
    { name: "Talkwalker", origin: "Luxembourg / Hootsuite", feature: "Blue Silk AI · đa ngôn ngữ 187 thứ tiếng", accuracy: "73%", color: "#06b6d4" },
    { name: "YouNet Media", origin: "Việt Nam", feature: "SocialHeat · phân tích riêng văn hóa VN", accuracy: "80% tiếng Việt", color: "#22c55e" },
    { name: "Buzzmetrics", origin: "Việt Nam", feature: "Social Intelligence · nghiên cứu FMCG", accuracy: "78% tiếng Việt", color: "#f59e0b" },
  ];

  return (
    <ApplicationLayout metadata={metadata} parentTitleVi="Phân tích cảm xúc">
      <ApplicationHero
        parentTitleVi="Phân tích cảm xúc"
        topicSlug="sentiment-analysis-in-brand-monitoring"
      >
        <p>
          Một sáng thứ Hai, đội truyền thông của một hãng hàng không mở máy tính
          thì đã thấy <strong>120 nghìn lượt chia sẻ</strong> một video hành
          khách bị đối xử thô bạo. May mắn, hệ thống <em>Brandwatch</em> (nền
          tảng lắng nghe mạng xã hội của Cision, Anh Quốc) đã gửi cảnh báo từ 30
          phút trước: tỉ lệ bình luận tiêu cực vọt từ 5% lên 72% chỉ trong một
          tiếng.
        </p>
        <p>
          Phía sau cảnh báo đó là <strong>phân tích cảm xúc</strong> — AI đọc
          hàng triệu bài đăng, phân loại khen / chê / trung tính, rồi vẽ biểu
          đồ theo thời gian. Việc mà vài nghìn nhân viên cũng không thể làm kịp
          bằng tay.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="sentiment-analysis-in-brand-monitoring">
        <p>
          Mỗi ngày, người Việt đăng <strong>khoảng 80 triệu nội dung công
          khai</strong> trên Facebook, TikTok, YouTube, Zalo, diễn đàn, báo chí.
          Một thương hiệu lớn có thể bị nhắc đến <strong>hàng chục nghìn
          lần/tuần</strong>. Đọc hết bằng tay là bất khả thi.
        </p>

        <div className="grid gap-3 sm:grid-cols-3 my-4">
          {[
            {
              icon: Globe,
              title: "Quá nhiều nguồn",
              desc: "Facebook, TikTok, Twitter, Instagram, forum, báo chí — mỗi nơi một giao diện.",
              color: "#3b82f6",
            },
            {
              icon: MessageCircle,
              title: "Quá nhiều ngôn ngữ",
              desc: "Tiếng Việt, tiếng Anh, tiếng lóng, viết tắt (‘ko’, ‘đc’, ‘sl’), emoji, teencode.",
              color: "#a855f7",
            },
            {
              icon: Flame,
              title: "Quá nhanh",
              desc: "Khủng hoảng lan 120 nghìn share/giờ. Đọc xong bằng tay thì đã quá muộn.",
              color: "#ef4444",
            },
          ].map((c) => (
            <div
              key={c.title}
              className="rounded-xl border p-4 bg-card"
              style={{ borderColor: c.color + "35" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <c.icon size={16} style={{ color: c.color }} />
                <p className="text-sm font-bold" style={{ color: c.color }}>
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
          Đội PR / marketing cần biết <strong>ngay lập tức</strong>: ai đang
          khen, ai đang chê, chê về cái gì, ảnh hưởng đến bao nhiêu người. Đó
          là lúc các nền tảng lắng nghe mạng xã hội (social listening) ra đời —
          và trái tim của chúng là AI phân tích cảm xúc.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Phân tích cảm xúc"
        topicSlug="sentiment-analysis-in-brand-monitoring"
      >
        <Beat step={1}>
          <p>
            <strong>Thu thập — quét mọi nguồn công khai.</strong> Brandwatch
            kéo dữ liệu từ hơn{" "}
            <strong>100 triệu nguồn trực tuyến</strong>: mạng xã hội, diễn đàn,
            blog, báo điện tử, đánh giá sản phẩm. Talkwalker thêm cả kênh TV,
            podcast, YouTube comment. YouNet Media và Buzzmetrics tập trung hơn
            vào Facebook, TikTok, Zalo, báo Việt — những nơi người Việt thật sự
            sinh hoạt.
          </p>
          <div className="grid grid-cols-4 gap-2 mt-3">
            {[
              { label: "Facebook", value: "55%" },
              { label: "TikTok", value: "22%" },
              { label: "Báo chí", value: "14%" },
              { label: "Diễn đàn", value: "9%" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-lg border border-border bg-surface/40 p-2 text-center"
              >
                <p className="text-[10px] uppercase tracking-wide text-muted">
                  {s.label}
                </p>
                <p className="text-sm font-bold text-accent">{s.value}</p>
              </div>
            ))}
          </div>
        </Beat>

        <Beat step={2}>
          <p>
            <strong>Chuẩn hoá — làm sạch trước khi đọc.</strong> Văn bản mạng
            xã hội &ldquo;bẩn&rdquo; kinh khủng: viết tắt (&ldquo;ko&rdquo;,
            &ldquo;đc&rdquo;), tiếng lóng, emoji, hashtag, tên riêng, tên
            thương hiệu. Hệ thống chuyển &ldquo;ko&rdquo; → &ldquo;không&rdquo;,
            giữ emoji như tín hiệu, tách hashtag, tìm tên thương hiệu dù viết
            có dấu hay không dấu.
          </p>
        </Beat>

        <Beat step={3}>
          <p>
            <strong>Mô hình Transformer — đọc cả câu.</strong> Brandwatch dùng
            transformer tiền huấn luyện trên 104 ngôn ngữ, tinh chỉnh trên dữ
            liệu mạng xã hội đã gán nhãn tay từ 12 ngôn ngữ. Mô hình hiểu đảo
            ngữ (&ldquo;not good&rdquo; = tiêu cực), ngữ cảnh, chữ hoa chữ
            thường, và cả emoji. YouNet Media / Buzzmetrics huấn luyện riêng
            trên dữ liệu tiếng Việt để bắt được phương ngữ ba miền.
          </p>
        </Beat>

        <Beat step={4}>
          <p>
            <strong>Phân tích cảm xúc sâu — 6 cảm xúc cơ bản.</strong> Ngoài
            ba nhãn tích cực / tiêu cực / trung tính, hệ thống còn phân 6 cảm
            xúc phổ quát: vui mừng, ngạc nhiên, buồn, giận, sợ, ghê tởm. Điều
            này giúp đội truyền thông biết khủng hoảng đang ở mức &ldquo;khó
            chịu&rdquo; hay đã lên tới &ldquo;giận dữ&rdquo;.
          </p>
        </Beat>

        <Beat step={5}>
          <p>
            <strong>Cảnh báo thời gian thực.</strong> Khi tỉ lệ tiêu cực vọt
            bất thường hoặc volume gấp 3 lần trung bình, Brandwatch gửi
            <em> Signal</em> qua email/Slack. Đội PR vào trong 15 phút thay vì
            15 giờ. Iris AI (trợ lý AI tích hợp) tóm tắt xu hướng và đề xuất
            phản hồi mẫu.
          </p>
        </Beat>
      </ApplicationMechanism>

      {/* ── Dashboard khủng hoảng — visual heavy ──────────── */}
      <div className="my-10 space-y-6 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <Eye size={18} className="text-accent" />
          <h3 className="text-base font-semibold text-foreground">
            Dashboard giám sát thương hiệu (mô phỏng)
          </h3>
        </div>

        <p className="text-sm text-muted leading-relaxed">
          Dữ liệu giả mô phỏng 3 tiếng đầu của một khủng hoảng: video lan trên
          TikTok → Facebook bùng nổ → báo chí vào cuộc → hãng phản hồi.
        </p>

        {/* 4 KPI */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-red-400/40 bg-red-50/50 dark:bg-red-900/10 p-3">
            <div className="flex items-center gap-1">
              <TrendingDown size={14} className="text-red-500" />
              <p className="text-[10px] uppercase tracking-wide text-red-500">
                Tiêu cực đỉnh
              </p>
            </div>
            <p className="mt-1 text-xl font-bold text-red-500">{peakNegative}/giờ</p>
          </div>
          <div className="rounded-xl border border-amber-400/40 bg-amber-50/50 dark:bg-amber-900/10 p-3">
            <div className="flex items-center gap-1">
              <Bell size={14} className="text-amber-500" />
              <p className="text-[10px] uppercase tracking-wide text-amber-600">
                Cảnh báo gửi
              </p>
            </div>
            <p className="mt-1 text-xl font-bold text-amber-600">3</p>
          </div>
          <div className="rounded-xl border border-blue-400/40 bg-blue-50/50 dark:bg-blue-900/10 p-3">
            <div className="flex items-center gap-1">
              <Globe size={14} className="text-blue-500" />
              <p className="text-[10px] uppercase tracking-wide text-blue-500">
                Tổng reach
              </p>
            </div>
            <p className="mt-1 text-xl font-bold text-blue-500">{totalReach}k</p>
          </div>
          <div className="rounded-xl border border-green-400/40 bg-green-50/50 dark:bg-green-900/10 p-3">
            <div className="flex items-center gap-1">
              <ShieldCheck size={14} className="text-green-500" />
              <p className="text-[10px] uppercase tracking-wide text-green-500">
                Phục hồi
              </p>
            </div>
            <p className="mt-1 text-xl font-bold text-green-500">10:30</p>
          </div>
        </div>

        {/* Line chart theo giờ */}
        <div>
          <p className="text-xs uppercase tracking-wide text-muted mb-2">
            Số bài tiêu cực / trung tính / tích cực theo mốc 30 phút
          </p>
          <div className="relative h-44 rounded-lg border border-border bg-background/50 p-3">
            <svg viewBox="0 0 420 160" className="h-full w-full" preserveAspectRatio="none">
              {/* grid */}
              {[0, 1, 2, 3, 4].map((g) => (
                <line
                  key={g}
                  x1={20}
                  x2={400}
                  y1={20 + g * 30}
                  y2={20 + g * 30}
                  stroke="currentColor"
                  strokeOpacity={0.08}
                />
              ))}
              {/* lines */}
              {(["negative", "neutral", "positive"] as const).map((key) => {
                const color = EMOTION_COLORS[key];
                const maxVal = Math.max(
                  ...hourlyCounts.map((h) => Math.max(h.negative, h.neutral, h.positive)),
                  1,
                );
                const pts = hourlyCounts
                  .map((h, i) => {
                    const x = 20 + (i / (hourlyCounts.length - 1)) * 380;
                    const v = h[key];
                    const y = 140 - (v / maxVal) * 100;
                    return `${x},${y}`;
                  })
                  .join(" ");
                return (
                  <motion.polyline
                    key={key}
                    points={pts}
                    fill="none"
                    stroke={color}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2 }}
                  />
                );
              })}
              {/* hover dots */}
              {hourlyCounts.map((h, i) => {
                const x = 20 + (i / (hourlyCounts.length - 1)) * 380;
                return (
                  <g key={i} onMouseEnter={() => setHoverHour(i)} onMouseLeave={() => setHoverHour(null)}>
                    <circle cx={x} cy={80} r={12} fill="transparent" />
                    {hoverHour === i && (
                      <line x1={x} x2={x} y1={20} y2={140} stroke="currentColor" strokeOpacity={0.2} strokeDasharray="2 2" />
                    )}
                  </g>
                );
              })}
            </svg>
            {/* x labels */}
            <div className="absolute inset-x-3 bottom-1 flex justify-between text-[9px] text-muted">
              {HOUR_LABELS.map((h) => (
                <span key={h}>{h}</span>
              ))}
            </div>
          </div>
          {/* legend */}
          <div className="mt-2 flex gap-3 text-[11px]">
            {(["positive", "neutral", "negative"] as const).map((s) => (
              <span key={s} className="flex items-center gap-1">
                <span
                  className="inline-block w-3 h-2 rounded-sm"
                  style={{ backgroundColor: EMOTION_COLORS[s] }}
                />
                <span className="capitalize text-muted">
                  {s === "positive" ? "Tích cực" : s === "negative" ? "Tiêu cực" : "Trung tính"}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Timeline posts */}
        <div>
          <p className="text-xs uppercase tracking-wide text-muted mb-2">
            Dòng bài đáng chú ý
          </p>
          <div className="space-y-2">
            {CRISIS_TIMELINE.map((p, i) => {
              const Icon = SOURCE_ICONS[p.source];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-start gap-3 rounded-lg border p-3 text-sm"
                  style={{
                    borderLeft: `3px solid ${EMOTION_COLORS[p.sentiment]}`,
                    borderColor: "var(--border)",
                  }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted shrink-0 pt-0.5 w-12">
                    {p.time}
                  </span>
                  <Icon size={14} className="text-muted shrink-0 mt-0.5" />
                  <span className="text-[10px] font-semibold text-muted shrink-0 pt-0.5 w-16">
                    {p.source}
                  </span>
                  <p className="flex-1 text-foreground">{p.text}</p>
                  <span className="text-[10px] text-muted shrink-0 pt-0.5">
                    {p.reach}k người
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* 6 emotion breakdown */}
        <div>
          <p className="text-xs uppercase tracking-wide text-muted mb-2">
            Phân tích 6 cảm xúc (Brandwatch Emotion)
          </p>
          <div className="space-y-2">
            {EMOTIONS.map((e) => (
              <div key={e.label} className="flex items-center gap-3">
                <e.icon size={14} style={{ color: e.color }} className="shrink-0" />
                <span className="w-20 text-xs text-foreground">{e.label}</span>
                <div className="flex-1 h-4 rounded-full bg-surface overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: e.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(e.count / maxEmotion) * 100}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
                <span
                  className="w-10 text-right text-xs font-bold"
                  style={{ color: e.color }}
                >
                  {e.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="sentiment-analysis-in-brand-monitoring"
      >
        <Metric
          value="Độ chính xác 60–75% cho tiếng Anh, 80%+ cho tiếng Việt ở YouNet / Buzzmetrics (con người cũng chỉ đồng thuận ~80%)"
          sourceRef={2}
        />
        <Metric
          value="Cải thiện 18% độ chính xác nhờ Transformer + học chuyển giao — Brandwatch"
          sourceRef={1}
        />
        <Metric
          value="Hỗ trợ 44 ngôn ngữ, pre-train trên 104 ngôn ngữ, quét trên 100 triệu nguồn"
          sourceRef={1}
        />
        <Metric
          value="2/3 thương hiệu giá trị nhất Forbes tin dùng Brandwatch"
          sourceRef={3}
        />
        <Metric
          value="Talkwalker: giám sát 187 ngôn ngữ qua Blue Silk AI, hơn 150 tỷ dữ liệu mỗi ngày"
          sourceRef={4}
        />
        <Metric
          value="YouNet Media: phục vụ 500+ thương hiệu VN, dashboard SocialHeat cập nhật từng phút"
          sourceRef={5}
        />
      </ApplicationMetrics>

      {/* ── Các nền tảng — grid so sánh ─────────────── */}
      <div className="my-10 space-y-4">
        <h3 className="text-base font-semibold text-foreground">
          Các nền tảng phổ biến trên thị trường
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          {PLATFORMS.map((p) => (
            <div
              key={p.name}
              className="rounded-xl border p-4 bg-card"
              style={{ borderColor: p.color + "35" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold" style={{ color: p.color }}>
                    {p.name}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide text-muted">
                    {p.origin}
                  </p>
                </div>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ color: p.color, backgroundColor: p.color + "15" }}
                >
                  {p.accuracy}
                </span>
              </div>
              <p className="text-xs text-foreground leading-relaxed mt-2">
                {p.feature}
              </p>
            </div>
          ))}
        </div>
        <Callout variant="tip" title="Chọn nền tảng nào?">
          <p>
            Nếu thương hiệu của bạn chủ yếu bán cho khách Việt — <strong>YouNet
            Media</strong> hoặc <strong>Buzzmetrics</strong> sẽ hiểu teencode, ba
            miền, Zalo tốt hơn. Nếu đa quốc gia — <strong>Brandwatch</strong>{" "}
            hoặc <strong>Talkwalker</strong> phủ ngôn ngữ rộng hơn.
          </p>
        </Callout>
      </div>

      <ApplicationTryIt topicSlug="sentiment-analysis-in-brand-monitoring">
        <p className="mb-4 text-sm text-muted">
          Bạn là AI giám sát thương hiệu cho một hãng hàng không. Hãy gán nhãn
          cho từng bài đăng.
        </p>

        <div className="space-y-4">
          <InlineChallenge
            question="Bài 1: 'Vừa bay hãng X xong, dịch vụ tuyệt vời, tiếp viên thân thiện lắm! ✈️❤️'"
            options={["Tích cực", "Tiêu cực", "Trung tính"]}
            correct={0}
            explanation="Từ tuyệt vời, thân thiện + emoji ❤️ — tích cực rõ. Đây là trường hợp dễ nhất cho AI."
          />
          <InlineChallenge
            question="Bài 2: 'Hãng Y hoãn chuyến 3 tiếng mà không một lời xin lỗi. Không bao giờ bay lại.'"
            options={["Tích cực", "Tiêu cực", "Trung tính"]}
            correct={1}
            explanation="'Không một lời xin lỗi', 'không bao giờ bay lại' — tiêu cực mạnh. Phủ định kép làm mức độ tiêu cực càng cao."
          />
          <InlineChallenge
            question="Bài 3: 'Hãng Z vừa mở đường bay HN–ĐN, giá vé từ 1,2 triệu đồng.'"
            options={["Tích cực", "Tiêu cực", "Trung tính"]}
            correct={2}
            explanation="Thông tin khách quan, không có từ đánh giá. AI phải phân biệt tin tức với ý kiến."
          />
          <InlineChallenge
            question="Bài 4: 'Ôi dịch vụ 5 sao thật đấy 🙄 Chờ hành lý 2 tiếng luôn.'"
            options={["Tích cực", "Tiêu cực", "Trung tính"]}
            correct={1}
            explanation="Mỉa mai — '5 sao' trông tích cực nhưng emoji 🙄 + 'chờ 2 tiếng' lật ngược. Đây là thử thách lớn nhất cho AI."
          />
          <InlineChallenge
            question="Bài 5: 'Wifi trên máy bay hãng W không tệ lắm, dùng tạm được.'"
            options={["Tích cực", "Tiêu cực", "Trung tính"]}
            correct={0}
            explanation="'Không tệ' = phủ định của tiêu cực = tích cực nhẹ. Lexicon đếm 'tệ' sẽ sai, PhoBERT hiểu đảo ngữ → đúng."
          />
          <InlineChallenge
            question="Bài 6: 'Đi hãng A 10 năm nay, giờ mới thấy nhiệt tình như này 👏'"
            options={["Tích cực", "Tiêu cực", "Trung tính"]}
            correct={0}
            explanation="Emoji 👏 + 'nhiệt tình' → tích cực rõ, mặc dù câu hơi khó vì có so sánh với quá khứ."
          />
        </div>

        <Callout variant="warning" title="Ngay cả AI tốt nhất vẫn sai ~20%">
          <p className="text-sm">
            Chính vì thế Brandwatch / YouNet luôn có chế độ &ldquo;human in the
            loop&rdquo; — nhân viên review lại những bài có cảm xúc mạnh hoặc
            reach lớn. AI lọc bớt 95% công việc, con người xử 5% quan trọng.
          </p>
        </Callout>
      </ApplicationTryIt>

      <ApplicationCounterfactual
        parentTitleVi="Phân tích cảm xúc"
        topicSlug="sentiment-analysis-in-brand-monitoring"
      >
        <p>
          Nếu không có phân tích cảm xúc tự động, một thương hiệu lớn sẽ phải
          thuê hàng trăm nhân viên đọc bình luận cả ngày — vẫn không theo kịp
          Facebook, TikTok. Khủng hoảng sẽ bùng phát trước khi ai kịp phát hiện.
        </p>
        <p>
          Brandwatch / Talkwalker / YouNet Media / Buzzmetrics biến việc
          lắng nghe thương hiệu từ &ldquo;bất khả thi&rdquo; thành <strong>một
          dashboard cập nhật từng phút</strong>. Đội PR ngủ ngon hơn vì biết
          chắc khi có gì bất thường, chuông sẽ kêu.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}

/* Helper cộng phút vào mốc "HH:MM" — dùng cho group theo 30 phút */
function addMinutes(hhmm: string, mins: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}
