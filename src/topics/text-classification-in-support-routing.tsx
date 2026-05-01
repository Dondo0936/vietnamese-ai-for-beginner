"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Inbox,
  Wrench,
  Wallet,
  RotateCcw,
  ShieldAlert,
  HelpCircle,
  Clock,
  Bell,
  Gauge,
  TrendingUp,
  Users,
  Bot,
  ArrowRight,
  CheckCircle2,
  Languages,
  Sparkles,
  GitBranch,
  MessageCircle,
  AlertTriangle,
  Flame,
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
  slug: "text-classification-in-support-routing",
  title: "Text Classification in Support Routing",
  titleVi: "Phân loại văn bản trong điều phối hỗ trợ",
  description:
    "Cách Zendesk AI, Intercom Fin, Subiz và FPT.AI dùng phân loại văn bản để tự động gán nhãn, định tuyến ticket đến đúng đội — giảm 45% thời gian phản hồi.",
  category: "nlp",
  tags: ["text-classification", "support", "application"],
  difficulty: "intermediate",
  relatedSlugs: ["text-classification"],
  vizType: "static",
  applicationOf: "text-classification",
  featuredApp: {
    name: "Zendesk",
    productFeature: "AI Ticket Classification & Auto-Routing",
    company: "Zendesk Inc.",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "AI-powered ticketing automation: A complete guide for 2026",
      publisher: "Zendesk",
      url: "https://www.zendesk.com/blog/ai-powered-ticketing/",
      date: "2026-01",
      kind: "documentation",
    },
    {
      title: "Zendesk AI ticket classification: Complete rundown in 2026",
      publisher: "Eesel AI",
      url: "https://www.eesel.ai/blog/zendesk-ai-ticket-classification-complete-rundown-in-2025",
      date: "2026-01",
      kind: "news",
    },
    {
      title: "Zendesk Automated Ticket Routing with Ticket Classification",
      publisher: "Swifteq",
      url: "https://swifteq.com/post/automated-ticket-routing-with-ticket-classification",
      date: "2024-06",
      kind: "documentation",
    },
    {
      title: "Routing and automation options for incoming tickets",
      publisher: "Zendesk Help",
      url: "https://support.zendesk.com/hc/en-us/articles/4408831658650-Routing-and-automation-options-for-incoming-tickets",
      date: "2024-09",
      kind: "documentation",
    },
    {
      title: "Intercom Fin — AI Agent for Customer Service",
      publisher: "Intercom",
      url: "https://www.intercom.com/fin",
      date: "2025",
      kind: "documentation",
    },
    {
      title: "Subiz — Nền tảng chăm sóc khách hàng đa kênh cho doanh nghiệp Việt",
      publisher: "Subiz Vietnam",
      url: "https://subiz.com.vn/",
      date: "2025",
      kind: "documentation",
    },
    {
      title: "FPT.AI Chat — Trợ lý ảo AI tiếng Việt cho tổng đài và chăm sóc khách",
      publisher: "FPT Smart Cloud",
      url: "https://fpt.ai/vi/chat",
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

/* ── Dữ liệu cho mini-dashboard ticket ──────────────────────────── */
type Team = {
  id: string;
  label: string;
  icon: typeof Wrench;
  color: string;
  avg: string; // SLA trung bình
};

const TEAMS: Team[] = [
  { id: "tech", label: "Kỹ thuật", icon: Wrench, color: "#3b82f6", avg: "12p" },
  { id: "billing", label: "Thanh toán", icon: Wallet, color: "#a855f7", avg: "20p" },
  { id: "refund", label: "Đổi trả", icon: RotateCcw, color: "#f59e0b", avg: "30p" },
  { id: "escal", label: "Xử lý cấp cao", icon: ShieldAlert, color: "#ef4444", avg: "5p" },
  { id: "general", label: "Câu hỏi chung", icon: HelpCircle, color: "#22c55e", avg: "45p" },
];

type Ticket = {
  id: string;
  text: string;
  team: string;
  priority: "high" | "medium" | "low";
  sentiment: "neg" | "neu" | "pos";
  lang: "vi" | "en";
};

const LIVE_TICKETS: Ticket[] = [
  { id: "#8812", text: "App crash ngay khi mở, không dùng được", team: "tech", priority: "high", sentiment: "neg", lang: "vi" },
  { id: "#8813", text: "Bị trừ 2 lần tiền gia hạn Premium tháng này", team: "billing", priority: "high", sentiment: "neg", lang: "vi" },
  { id: "#8814", text: "Shop còn size M màu đen không ạ?", team: "general", priority: "low", sentiment: "neu", lang: "vi" },
  { id: "#8815", text: "Đơn #9921 giao sai hàng, mình cần hoàn tiền", team: "refund", priority: "medium", sentiment: "neg", lang: "vi" },
  { id: "#8816", text: "Nhân viên thô lỗ trên hotline, yêu cầu gặp quản lý!", team: "escal", priority: "high", sentiment: "neg", lang: "vi" },
  { id: "#8817", text: "How do I reset my password?", team: "tech", priority: "low", sentiment: "neu", lang: "en" },
  { id: "#8818", text: "Thank you for the fast refund!", team: "general", priority: "low", sentiment: "pos", lang: "en" },
  { id: "#8819", text: "Mất thẻ, cần khóa gấp giúp mình 🙏", team: "escal", priority: "high", sentiment: "neg", lang: "vi" },
];

const PRIORITY_COLOR: Record<Ticket["priority"], string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#22c55e",
};
const PRIORITY_LABEL: Record<Ticket["priority"], string> = {
  high: "Cao",
  medium: "Vừa",
  low: "Thấp",
};
const SENT_ICON = {
  neg: { color: "#ef4444", label: "Tiêu cực" },
  neu: { color: "#f59e0b", label: "Trung tính" },
  pos: { color: "#22c55e", label: "Tích cực" },
};

export default function TextClassificationInSupportRouting() {
  const [selectedTicket, setSelectedTicket] = useState(0);
  const ticket = LIVE_TICKETS[selectedTicket];
  const team = TEAMS.find((t) => t.id === ticket.team)!;

  /* ── Thống kê giả: phân phối theo đội hôm nay ── */
  const teamCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    TEAMS.forEach((t) => (counts[t.id] = 0));
    LIVE_TICKETS.forEach((t) => (counts[t.team] += 1));
    return counts;
  }, []);
  const maxCount = Math.max(...Object.values(teamCounts));

  /* ── So sánh trước và sau AI ── */
  const BEFORE_AFTER = [
    { label: "Thời gian triage ticket", before: "45 phút", after: "3 giây", icon: Clock, color: "#3b82f6" },
    { label: "Thời gian phản hồi đầu", before: "4 giờ", after: "30 phút", icon: Bell, color: "#f59e0b" },
    { label: "Tỉ lệ chuyển sai đội", before: "28%", after: "6%", icon: GitBranch, color: "#a855f7" },
    { label: "Nhân lực triage", before: "12 người", after: "2 người", icon: Users, color: "#22c55e" },
  ];

  /* ── Các nền tảng ── */
  const PLATFORMS = [
    { name: "Zendesk AI", origin: "Mỹ", feature: "Intelligent Triage · Auto-routing · Macros AI", note: "Giảm 45% thời gian phản hồi", color: "#00363d" },
    { name: "Intercom Fin", origin: "Ireland/Mỹ", feature: "AI agent giải quyết 50%+ ticket mà không cần người", note: "Trả lời như con người", color: "#6366f1" },
    { name: "Subiz", origin: "Việt Nam", feature: "Chat đa kênh, AI phân loại + auto-assign", note: "Tối ưu tiếng Việt & Zalo OA", color: "#14b8a6" },
    { name: "FPT.AI Chat", origin: "Việt Nam", feature: "NLU tiếng Việt, tổng đài voice AI", note: "Dùng bởi ngân hàng, viễn thông VN", color: "#f97316" },
  ];

  return (
    <ApplicationLayout metadata={metadata} parentTitleVi="Phân loại văn bản">
      <ApplicationHero
        parentTitleVi="Phân loại văn bản"
        topicSlug="text-classification-in-support-routing"
      >
        <p>
          8 giờ sáng thứ Hai, <strong>12.000 ticket</strong> đã đổ vào hộp thư
          chăm sóc khách của một nền tảng fintech Việt Nam: &ldquo;Không đăng
          nhập được&rdquo;, &ldquo;Bị trừ tiền sai&rdquo;, &ldquo;Mất thẻ khóa
          giùm&rdquo;, &ldquo;Muốn hủy gói&rdquo;… Ngày xưa, ca trực sẽ mất 3
          tiếng chỉ để đọc và gán nhãn bằng tay.
        </p>
        <p>
          Nay <strong>Zendesk AI</strong> (và những nền tảng tương tự như
          Intercom Fin, Subiz, FPT.AI) đọc toàn bộ nội dung trong vài giây,
          nhận diện <em>ý định</em>, <em>cảm xúc</em>, <em>ngôn ngữ</em>, rồi
          định tuyến đến đúng đội. Thời gian phản hồi giảm tới{" "}
          <strong>45%</strong>, khách hàng thấy &ldquo;gọn gàng và nhanh hơn
          hẳn&rdquo;.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="text-classification-in-support-routing">
        <p>
          Trong hệ thống hỗ trợ truyền thống, một nhân viên phải:{" "}
          <strong>(1) đọc từng ticket</strong>, <strong>(2) đoán nội
          dung</strong>, <strong>(3) kéo thả vào đội đúng</strong>. Với hàng
          nghìn ticket/ngày, việc này biến con người thành... bác nhân viên
          thư phòng — một công việc hoàn toàn không giúp giải quyết vấn đề của
          khách.
        </p>

        <div className="grid gap-3 sm:grid-cols-3 my-4">
          {[
            {
              icon: Flame,
              title: "Khách hàng viết tự do",
              desc: "Không có form chuẩn. Người viết 'app đơ', người viết 'phần mềm không phản hồi' — cùng ý.",
              color: "#ef4444",
            },
            {
              icon: Languages,
              title: "Đa ngôn ngữ",
              desc: "Tiếng Việt có dấu, không dấu, tiếng Anh, teencode, Zalo sticker. Mô hình phải xử lý hết.",
              color: "#a855f7",
            },
            {
              icon: AlertTriangle,
              title: "Ưu tiên khác nhau",
              desc: "Tin 'mất thẻ, khóa gấp' phải xử 5 phút. Tin 'còn size M không?' có thể chờ 1 tiếng.",
              color: "#f59e0b",
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
          Và bài toán khó nhất: <strong>khách không mô tả theo cấu
          trúc</strong>. Họ viết &ldquo;app cứ thế là đơ&rdquo;, &ldquo;mất
          tiền tự nhiên&rdquo;, &ldquo;các anh lừa đảo à&rdquo; — AI phải hiểu
          ý đằng sau lớp vỏ ngôn ngữ rất khó nắm.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Phân loại văn bản"
        topicSlug="text-classification-in-support-routing"
      >
        <Beat step={1}>
          <p>
            <strong>Đọc bằng NLP, không tìm từ khóa.</strong> Zendesk AI
            không hỏi &ldquo;có từ ‘lỗi’ không?&rdquo;. Mô hình ngôn ngữ đọc
            cả tin nhắn rồi hiểu <em>ý định</em> (intent). Vì vậy &ldquo;app
            bị đơ&rdquo;, &ldquo;phần mềm không phản hồi&rdquo;, &ldquo;ứng
            dụng crash hoài&rdquo; đều ra chung một nhãn: <strong>Lỗi kỹ
            thuật</strong>.
          </p>
        </Beat>

        <Beat step={2}>
          <p>
            <strong>Phân loại đa chiều cùng lúc.</strong> Mỗi ticket ra 4 nhãn
            song song: <em>intent</em> (kỹ thuật / thanh toán / hoàn tiền /
            khiếu nại / chung), <em>ngôn ngữ</em>, <em>cảm xúc</em>, và{" "}
            <em>mức độ khẩn cấp</em>. Ticket tức giận về thanh toán sai được
            xếp trước câu hỏi về tính năng mới.
          </p>
        </Beat>

        <Beat step={3}>
          <p>
            <strong>Điều phối thông minh — đúng người, đúng lúc.</strong>{" "}
            Intelligent Routing cân nhắc nhiều yếu tố: ý định đã phát hiện,
            chuyên môn cần thiết, tải hiện tại của nhân viên, giờ làm việc,
            lịch sử tương tác của khách. Ticket được tự động gán tag và
            chuyển tới đúng ngăn.
          </p>
        </Beat>

        <Beat step={4}>
          <p>
            <strong>Chatbot tự xử lý được 40–60%.</strong> Những ticket đơn
            giản (reset password, tra cứu đơn, hỏi giờ mở cửa) được Intercom
            Fin / FPT.AI Chat giải quyết luôn bằng câu trả lời từ cơ sở tri
            thức, không chạm tới con người. Con người chỉ vào những ca phức
            tạp.
          </p>
        </Beat>

        <Beat step={5}>
          <p>
            <strong>Học liên tục từ phản hồi.</strong> Khi nhân viên chỉnh
            nhãn (vì AI đoán sai), hệ thống ghi nhận và retrain. Qua vài tuần,
            mô hình đặc thù cho công ty tăng độ chính xác từ 75% lên 92–95% —
            đủ tốt để tin gần như hoàn toàn.
          </p>
        </Beat>
      </ApplicationMechanism>

      {/* ── Live demo: visual dashboard ───────────────── */}
      <div className="my-10 space-y-6 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <Gauge size={18} className="text-accent" />
          <h3 className="text-base font-semibold text-foreground">
            Dashboard điều phối (mô phỏng)
          </h3>
        </div>
        <p className="text-sm text-muted leading-relaxed">
          8 ticket tiếng Việt &amp; tiếng Anh đến trong buổi sáng. Chọn một
          ticket để xem AI gán 4 nhãn đồng thời.
        </p>

        {/* Grid: tickets bên trái, phân tích bên phải */}
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          {/* Ticket queue */}
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wide text-muted">
              Hàng đợi ticket
            </p>
            <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
              {LIVE_TICKETS.map((t, i) => {
                const tm = TEAMS.find((x) => x.id === t.team)!;
                const isSel = i === selectedTicket;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTicket(i)}
                    className={`w-full text-left rounded-lg border p-3 text-xs transition ${
                      isSel
                        ? "ring-2 ring-accent border-accent"
                        : "border-border hover:border-accent/40"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-accent">{t.id}</span>
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                        style={{
                          color: PRIORITY_COLOR[t.priority],
                          backgroundColor: PRIORITY_COLOR[t.priority] + "15",
                        }}
                      >
                        {PRIORITY_LABEL[t.priority]}
                      </span>
                      <span className="text-[9px] uppercase tracking-wide text-muted">
                        {t.lang}
                      </span>
                    </div>
                    <p className="text-foreground">{t.text}</p>
                    <div className="mt-1 flex items-center gap-1 text-[10px]">
                      <tm.icon size={11} style={{ color: tm.color }} />
                      <span style={{ color: tm.color }}>{tm.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI 4-label breakdown */}
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-wide text-muted">
              AI đang xử lý ticket {ticket.id}
            </p>

            <AnimatePresence mode="wait">
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl border border-border bg-background/50 p-4 space-y-3"
              >
                <p className="text-sm text-foreground italic">
                  &ldquo;{ticket.text}&rdquo;
                </p>

                {/* 4 labels */}
                <div className="grid gap-2 grid-cols-2">
                  <LabelCard
                    icon={team.icon}
                    label="Ý định"
                    value={team.label}
                    color={team.color}
                  />
                  <LabelCard
                    icon={AlertTriangle}
                    label="Khẩn cấp"
                    value={PRIORITY_LABEL[ticket.priority]}
                    color={PRIORITY_COLOR[ticket.priority]}
                  />
                  <LabelCard
                    icon={MessageCircle}
                    label="Cảm xúc"
                    value={SENT_ICON[ticket.sentiment].label}
                    color={SENT_ICON[ticket.sentiment].color}
                  />
                  <LabelCard
                    icon={Languages}
                    label="Ngôn ngữ"
                    value={ticket.lang === "vi" ? "Tiếng Việt" : "English"}
                    color="#06b6d4"
                  />
                </div>

                {/* Routing path */}
                <div className="rounded-lg bg-surface/50 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted mb-2">
                    Đường đi
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1 rounded-full bg-background px-2 py-1 border border-border">
                      <Inbox size={12} />
                      Inbox
                    </span>
                    <ArrowRight size={12} className="text-muted" />
                    <span className="flex items-center gap-1 rounded-full bg-background px-2 py-1 border border-border">
                      <Bot size={12} />
                      Auto-classify
                    </span>
                    <ArrowRight size={12} className="text-muted" />
                    <span
                      className="flex items-center gap-1 rounded-full px-2 py-1"
                      style={{
                        backgroundColor: team.color + "15",
                        color: team.color,
                        border: `1px solid ${team.color}40`,
                      }}
                    >
                      <team.icon size={12} />
                      {team.label}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-muted">
                    <Clock size={11} />
                    Dự kiến xử lý trong <strong className="text-foreground">{team.avg}</strong>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Phân phối theo đội — thanh ngang */}
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted mb-2">
            Phân phối ticket theo đội (hôm nay)
          </p>
          <div className="space-y-2">
            {TEAMS.map((t) => {
              const c = teamCounts[t.id] || 0;
              const pct = maxCount ? (c / maxCount) * 100 : 0;
              return (
                <div key={t.id} className="flex items-center gap-3">
                  <t.icon size={14} style={{ color: t.color }} className="shrink-0" />
                  <span className="w-28 text-xs text-foreground">{t.label}</span>
                  <div className="flex-1 h-4 rounded-full bg-surface overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: t.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                  <span
                    className="w-10 text-right text-xs font-bold"
                    style={{ color: t.color }}
                  >
                    {c}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Trước và sau AI ───────────────────────────── */}
      <div className="my-10 space-y-4">
        <h3 className="text-base font-semibold text-foreground">
          Trước và sau khi có phân loại AI
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {BEFORE_AFTER.map((b) => (
            <div
              key={b.label}
              className="rounded-xl border p-4 bg-card"
              style={{ borderColor: b.color + "35" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <b.icon size={14} style={{ color: b.color }} />
                <p className="text-[11px] uppercase tracking-wide text-muted">
                  {b.label}
                </p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xs line-through text-muted">{b.before}</span>
                <ArrowRight size={12} className="text-muted" />
                <span
                  className="text-lg font-bold"
                  style={{ color: b.color }}
                >
                  {b.after}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="text-classification-in-support-routing"
      >
        <Metric
          value="Giảm thời gian phản hồi lên đến 45% nhờ phân loại và định tuyến tự động"
          sourceRef={1}
        />
        <Metric
          value="AI vượt xa so khớp từ khóa — phân tích ý định, ngôn ngữ, cảm xúc, khẩn cấp đồng thời"
          sourceRef={2}
        />
        <Metric
          value="Zendesk AI tags tự động tích hợp vào triggers để định tuyến không cần thao tác tay"
          sourceRef={3}
        />
        <Metric
          value="Intercom Fin tự giải quyết 50%+ ticket mà không cần nhân viên can thiệp"
          sourceRef={5}
        />
        <Metric
          value="FPT.AI & Subiz: hỗ trợ tiếng Việt có dấu, không dấu, tiếng lóng mạng, Zalo OA"
          sourceRef={7}
        />
      </ApplicationMetrics>

      {/* ── Nền tảng nào? ────────────────────────────── */}
      <div className="my-10 space-y-4">
        <h3 className="text-base font-semibold text-foreground">
          Bốn nền tảng phổ biến — chọn cái nào?
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
                <CheckCircle2 size={14} style={{ color: p.color }} />
              </div>
              <p className="text-xs text-foreground leading-relaxed mt-2">
                {p.feature}
              </p>
              <p className="text-[11px] text-muted mt-2 italic">{p.note}</p>
            </div>
          ))}
        </div>
        <Callout variant="tip" title="Kinh nghiệm chọn công cụ">
          <p className="text-sm">
            Doanh nghiệp Việt Nam phục vụ khách nội địa nên xem{" "}
            <strong>Subiz</strong> hoặc <strong>FPT.AI</strong> trước — vì hiểu
            tiếng Việt, tích hợp Zalo OA, giá thân thiện. Startup SaaS có khách
            toàn cầu — <strong>Zendesk</strong> hoặc{" "}
            <strong>Intercom Fin</strong> phủ rộng hơn và có nhiều macro sẵn.
          </p>
        </Callout>
      </div>

      <ApplicationTryIt topicSlug="text-classification-in-support-routing">
        <p className="mb-4 text-sm text-muted">
          Bạn là AI phân loại ticket. Hãy định tuyến từng tin đến đúng đội.
        </p>

        <div className="space-y-4">
          <InlineChallenge
            question="Ticket 1: 'Ứng dụng cứ mở là đơ, đã xóa cài lại vẫn lỗi'. Chuyển đội nào?"
            options={["Kỹ thuật", "Thanh toán", "Đổi trả", "Câu hỏi chung"]}
            correct={0}
            explanation="'Đơ', 'xóa cài lại vẫn lỗi' = triệu chứng lỗi phần mềm điển hình. Ưu tiên vừa vì không liên quan tiền."
          />
          <InlineChallenge
            question="Ticket 2: 'Mình bị trừ 2 lần phí gia hạn, mong kiểm tra và hoàn lại giúp mình nhé'. Chuyển đội nào?"
            options={["Kỹ thuật", "Thanh toán", "Đổi trả", "Khiếu nại"]}
            correct={1}
            explanation="Chuyên về thẻ, hóa đơn → đội Thanh toán. Ưu tiên cao vì liên quan tiền và cảm xúc bực bội."
          />
          <InlineChallenge
            question="Ticket 3: 'Chào shop, còn size M màu đen không ạ? Ship về quận 7 thì lâu không?'"
            options={["Kỹ thuật", "Đổi trả", "Khiếu nại", "Câu hỏi chung"]}
            correct={3}
            explanation="Câu hỏi thông tin sản phẩm + ship. Ưu tiên thấp, chatbot hoàn toàn tự trả được."
          />
          <InlineChallenge
            question="Ticket 4: 'Nhân viên tổng đài vừa nãy nói chuyện như ăn cướp, yêu cầu gặp quản lý ngay!'"
            options={["Kỹ thuật", "Đổi trả", "Khiếu nại / Xử lý cấp cao", "Câu hỏi chung"]}
            correct={2}
            explanation="Cảm xúc rất tiêu cực + yêu cầu cấp quản lý = escalation. Phải chuyển thẳng đội Xử lý cấp cao, đừng để AI tự trả lời."
          />
          <InlineChallenge
            question="Ticket 5: 'Mất thẻ rồi, khóa gấp giúp mình với 🙏🙏🙏'"
            options={["Kỹ thuật", "Thanh toán / Khóa thẻ khẩn", "Đổi trả", "Câu hỏi chung"]}
            correct={1}
            explanation="Khẩn cấp tối đa — đây là intent 'khóa thẻ'. Ngân hàng phải xử trong vài phút, vượt qua tất cả queue khác."
          />
          <InlineChallenge
            question="Ticket 6: 'Thanks team, refund received so fast!'"
            options={["Kỹ thuật", "Câu hỏi chung (tin tích cực, có thể đóng)", "Khiếu nại", "Thanh toán"]}
            correct={1}
            explanation="Khách đã hài lòng, không còn vấn đề. AI có thể auto-close hoặc tag 'Positive feedback' để đội CS ghi nhận — không cần người trả lời dài."
          />
        </div>

        <Callout variant="insight" title="Vì sao bài này khó hơn bạn tưởng?">
          <p className="text-sm">
            Khách ít khi viết rõ ràng. &ldquo;Tôi mất tiền&rdquo; có thể là
            khiếu nại, có thể là thanh toán, có thể là hoàn tiền. AI phải đọc
            cả ngữ cảnh + lịch sử tương tác của khách để chọn đúng. Đó là lý
            do các nền tảng lớn luôn cho phép nhân viên đổi nhãn — và
            mô hình học từ đó.
          </p>
        </Callout>
      </ApplicationTryIt>

      <ApplicationCounterfactual
        parentTitleVi="Phân loại văn bản"
        topicSlug="text-classification-in-support-routing"
      >
        <p>
          Không có phân loại AI, đội hỗ trợ phải ngồi làm thư phòng — đọc từng
          ticket, gán nhãn bằng tay, chuyển đội bằng email. Ngày hết 3 tiếng
          chỉ để <em>sắp xếp</em>, chưa kịp <em>giải quyết</em>. Khách hàng
          chờ hàng giờ. Ticket khẩn cấp lẫn vào câu hỏi lặt vặt.
        </p>
        <p>
          Zendesk / Intercom / Subiz / FPT.AI biến việc triage từ <strong>nút
          thắt cổ chai</strong> thành <strong>tự động trong vài giây</strong>.
          Đội CS còn lại chỉ làm đúng việc quan trọng nhất: trò chuyện với
          khách, giải quyết vấn đề thật.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {[
            { icon: Clock, title: "Nhanh hơn", desc: "Phản hồi trong 30 phút thay vì 4 tiếng.", color: "#3b82f6" },
            { icon: TrendingUp, title: "Đúng hơn", desc: "94% ticket đến đúng đội, thay vì 72% làm tay.", color: "#22c55e" },
            { icon: Sparkles, title: "Rẻ hơn", desc: "Mỗi ticket ~$0.10 cho AI triage, so với $2–3 làm tay.", color: "#a855f7" },
          ].map((c) => (
            <div
              key={c.title}
              className="rounded-xl border p-3 bg-card"
              style={{ borderColor: c.color + "30" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <c.icon size={14} style={{ color: c.color }} />
                <p className="text-xs font-bold" style={{ color: c.color }}>
                  {c.title}
                </p>
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                {c.desc}
              </p>
            </div>
          ))}
        </div>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}

/* ── Subcomponent ─────────────────────────────────────────────── */
function LabelCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Inbox;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className="rounded-lg border p-2.5"
      style={{ borderColor: color + "40", backgroundColor: color + "1a" }}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon size={12} style={{ color }} />
        <p className="text-[10px] uppercase tracking-wide text-muted">
          {label}
        </p>
      </div>
      <p className="text-xs font-bold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}
