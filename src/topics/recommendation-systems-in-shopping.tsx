"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import {
  Users,
  ShoppingBag,
  MousePointerClick,
  Sparkles,
  Globe2,
  TrendingUp,
  BarChart3,
  Smartphone,
  Eye,
  Flame,
  Star,
  Zap,
  MessageSquare,
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
import { Callout, ToggleCompare } from "@/components/interactive";

export const metadata: TopicMeta = {
  slug: "recommendation-systems-in-shopping",
  title: "Recommendation Systems in Shopping",
  titleVi: "Hệ thống Gợi ý trong Mua sắm",
  description:
    "Shopee dùng AI gợi ý sản phẩm cá nhân hóa cho hàng trăm triệu người dùng Đông Nam Á",
  category: "applied-ai",
  tags: ["recommendation-systems", "e-commerce", "application"],
  difficulty: "beginner",
  relatedSlugs: ["recommendation-systems"],
  vizType: "interactive",
  applicationOf: "recommendation-systems",
  featuredApp: {
    name: "Shopee",
    productFeature: "Personalized Product Recommendations",
    company: "Sea Group",
    countryOrigin: "SG",
  },
  sources: [
    {
      title:
        "How Shopee's AI-Powered Personalization Is Dominating Southeast Asia's E-Commerce Growth In 2024",
      publisher: "GrowthHQ",
      url: "https://www.growthhq.io/our-thinking/how-shopees-ai-powered-personalization-is-dominating-southeast-asias-e-commerce-growth-in-2024",
      date: "2024-08",
      kind: "news",
    },
    {
      title:
        "Shopee's AI Revolution: How Hyper-Personalization Is Reshaping E-Commerce In Southeast Asia, Malaysia, And Thailand",
      publisher: "GrowthHQ",
      url: "https://www.growthhq.io/our-thinking/shopees-ai-revolution-how-hyper-personalization-is-reshaping-e-commerce-in-southeast-asia-malaysia-and-thailand",
      date: "2024-10",
      kind: "news",
    },
    {
      title:
        "Shopee AI: How Artificial Intelligence Is Redefining E-Commerce on Southeast Asia's Most Visited Platform",
      publisher: "Saint Augustines University",
      url: "https://explore.st-aug.edu/exp/shopee-ai-how-artificial-intelligence-is-redefining-ecommerce-on-southeast-asias-most-visited-platform",
      date: "2024-06",
      kind: "news",
    },
    {
      title: "AI Personalization: How eCommerce Transform their Business",
      publisher: "Kitameraki",
      url: "https://www.kitameraki.com/post/how-shopee-and-others-transforming-ecommerce-with-ai-personalization-strategies",
      date: "2024-05",
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

/* ═══════════════════════════════════════════════════════════════════════════
   HERO — animated mock Shopee homepage
   Trái: avatar + persona. Giữa: 6 tile gợi ý với hiệu ứng shuffle mỗi 3 giây.
   ═══════════════════════════════════════════════════════════════════════════ */

type Persona = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  tiles: Array<{ icon: string; title: string; price: string; reason: string }>;
};

const PERSONAS: Persona[] = [
  {
    id: "mom",
    name: "Chị Hương",
    role: "Mẹ bỉm 32 tuổi, Q.7 TP.HCM",
    avatar: "H",
    color: "#ef4444",
    tiles: [
      { icon: "🍼", title: "Bình sữa Pigeon 240ml", price: "₫189k", reason: "Mua lại · tháng trước" },
      { icon: "🧸", title: "Gấu bông Lulu 40cm", price: "₫245k", reason: "Tặng sinh nhật bé" },
      { icon: "👶", title: "Bỉm Huggies size M", price: "₫439k", reason: "Sắp hết theo lịch" },
      { icon: "🥛", title: "Sữa Aptamil số 2", price: "₫615k", reason: "Mẹ giống chị đều dùng" },
      { icon: "🛁", title: "Bồn tắm em bé", price: "₫320k", reason: "Hợp gu chị 92%" },
      { icon: "📖", title: "Sách nuôi dạy bé 0-3 tuổi", price: "₫128k", reason: "Xu hướng mẹ Sài Gòn" },
    ],
  },
  {
    id: "student",
    name: "Minh",
    role: "Sinh viên năm 3, ĐH Bách Khoa",
    avatar: "M",
    color: "#6366f1",
    tiles: [
      { icon: "🎧", title: "Tai nghe Sony WH-1000XM4", price: "₫5.2tr", reason: "Xem 5 lần tuần rồi" },
      { icon: "💻", title: "Chuột Logitech G304", price: "₫589k", reason: "Gamer giống bạn đều mua" },
      { icon: "🍜", title: "Mì Koreno hộp 5 gói", price: "₫89k", reason: "Đặt lại lần 4" },
      { icon: "⚡", title: "Củ sạc Anker 30W", price: "₫399k", reason: "Hợp điện thoại bạn" },
      { icon: "📱", title: "Ốp iPhone 14 trong", price: "₫79k", reason: "Sinh viên hay mua" },
      { icon: "☕", title: "Cà phê G7 túi lớn", price: "₫135k", reason: "Bán chạy ký túc xá" },
    ],
  },
  {
    id: "office",
    name: "Anh Tuấn",
    role: "Kế toán trưởng 38 tuổi, Hà Nội",
    avatar: "T",
    color: "#10b981",
    tiles: [
      { icon: "👔", title: "Áo sơ mi Owen trắng", price: "₫459k", reason: "Đồng nghiệp bạn mua" },
      { icon: "👞", title: "Giày da Aokang đen", price: "₫1.3tr", reason: "Kiểu bạn hay xem" },
      { icon: "💼", title: "Cặp laptop Targus 15", price: "₫890k", reason: "Dân văn phòng chọn" },
      { icon: "⌚", title: "Đồng hồ Citizen Eco", price: "₫4.2tr", reason: "Hợp phong cách bạn" },
      { icon: "🖋️", title: "Bút Parker Urban", price: "₫1.1tr", reason: "Quà sếp hay tặng" },
      { icon: "📊", title: "Sách Excel nâng cao", price: "₫215k", reason: "Kế toán cùng ngành đọc" },
    ],
  },
];

function ShopeeMockHero() {
  const reduce = useReducedMotion();
  const [personaIdx, setPersonaIdx] = useState(0);
  const persona = PERSONAS[personaIdx];

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => {
      setPersonaIdx((p) => (p + 1) % PERSONAS.length);
    }, 4500);
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <div className="not-prose my-6 rounded-2xl border border-border bg-gradient-to-br from-orange-50 via-card to-amber-50 dark:from-orange-950/40 dark:via-card dark:to-amber-950/30 p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#ee4d2d]">
          <ShoppingBag size={14} className="text-white" />
        </div>
        <span className="text-sm font-bold text-foreground">Shopee</span>
        <span className="text-xs text-muted">· trang chủ lúc 8:42 sáng</span>
        <div className="ml-auto flex items-center gap-1">
          {PERSONAS.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPersonaIdx(i)}
              aria-label={`Xem trang chủ của ${p.name}`}
              className={`h-2 rounded-full transition-all ${
                i === personaIdx ? "w-6 bg-accent" : "w-2 bg-surface"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={persona.id}
            initial={reduce ? false : { opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: 12 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl border border-border bg-card p-3"
          >
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold text-white mb-2"
              style={{ backgroundColor: persona.color }}
            >
              {persona.avatar}
            </div>
            <p className="text-sm font-semibold text-foreground">{persona.name}</p>
            <p className="text-xs text-muted mb-2">{persona.role}</p>
            <div className="flex items-center gap-1 text-[11px] text-accent">
              <Sparkles size={11} />
              <span>Trang chủ được cá nhân hóa</span>
            </div>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={persona.id}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-2"
          >
            {persona.tiles.map((t, i) => (
              <motion.div
                key={`${persona.id}-${t.title}`}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="rounded-lg border border-border bg-card p-2"
              >
                <div className="aspect-square flex items-center justify-center rounded-md bg-surface text-2xl mb-1.5">
                  {t.icon}
                </div>
                <p className="text-[11px] font-semibold text-foreground line-clamp-1">
                  {t.title}
                </p>
                <p className="text-[11px] text-[#ee4d2d] font-bold">{t.price}</p>
                <p className="text-[10px] text-muted mt-0.5 line-clamp-1">
                  {t.reason}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="text-[11px] text-muted text-center mt-3 italic">
        Bấm chấm tròn phía trên để thấy trang chủ Shopee thay đổi theo từng persona — cùng một app, ba giao diện khác nhau.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PROBLEM — ToggleCompare "giống mọi người" vs "cá nhân hóa"
   ═══════════════════════════════════════════════════════════════════════════ */

function GenericVsPersonal() {
  const reduce = useReducedMotion();
  const genericTiles = [
    { icon: "📺", title: "TV Samsung 55″" },
    { icon: "🧴", title: "Dầu gội Head & Shoulders" },
    { icon: "🎮", title: "Tay cầm PS5" },
    { icon: "👟", title: "Giày Adidas Ultraboost" },
    { icon: "💄", title: "Son MAC Ruby Woo" },
    { icon: "🍚", title: "Gạo ST25 5kg" },
  ];
  const personalTiles = [
    { icon: "🍼", title: "Bình sữa Pigeon 240ml", why: "Bạn mua tháng trước" },
    { icon: "👶", title: "Bỉm Huggies size M", why: "Sắp hết theo lịch dùng" },
    { icon: "🥛", title: "Sữa Aptamil số 2", why: "Mẹ giống bạn đều mua" },
    { icon: "🧸", title: "Gấu bông Lulu 40cm", why: "Con bạn sắp sinh nhật" },
    { icon: "📖", title: "Sách Nuôi dạy 0-3", why: "Xu hướng mẹ Q.7" },
    { icon: "🛁", title: "Bồn tắm em bé", why: "92% hợp gu bạn" },
  ];

  return (
    <ToggleCompare
      labelA="Trang chủ chung"
      labelB="Trang chủ cá nhân hóa"
      description="Cùng một chị Hương — mẹ bỉm 32 tuổi. Hai phiên bản Shopee."
      childA={
        <div>
          <div className="mb-3 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 p-2.5 text-xs text-foreground">
            <strong className="text-amber-700 dark:text-amber-400">
              Nếu Shopee không cá nhân hóa:
            </strong>{" "}
            trang chủ hiện đúng những mặt hàng top toàn sàn. 6 ô thì may mắn 1 ô chị thật sự cần.
          </div>
          <div className="grid grid-cols-3 gap-2">
            {genericTiles.map((t, i) => (
              <motion.div
                key={t.title}
                initial={reduce ? false : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: i * 0.04 }}
                className="rounded-md border border-border bg-card p-2"
              >
                <div className="aspect-square flex items-center justify-center rounded-md bg-surface text-xl mb-1">
                  {t.icon}
                </div>
                <p className="text-[10px] text-foreground truncate">{t.title}</p>
              </motion.div>
            ))}
          </div>
        </div>
      }
      childB={
        <div>
          <div className="mb-3 rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 p-2.5 text-xs text-foreground">
            <strong className="text-emerald-700 dark:text-emerald-400">
              Có recommender:
            </strong>{" "}
            5-6 ô đều sát nhu cầu thật. Chị đỡ lướt, Shopee tăng doanh số, người bán nhỏ có cơ hội.
          </div>
          <div className="grid grid-cols-3 gap-2">
            {personalTiles.map((t, i) => (
              <motion.div
                key={t.title}
                initial={reduce ? false : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: i * 0.04 }}
                className="rounded-md border-2 border-emerald-300/60 bg-card p-2"
              >
                <div className="aspect-square flex items-center justify-center rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-xl mb-1">
                  {t.icon}
                </div>
                <p className="text-[10px] text-foreground truncate">{t.title}</p>
                <p className="text-[9px] text-emerald-700 dark:text-emerald-400 truncate mt-0.5">
                  {t.why}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      }
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MECHANISM — 4 beats thành ProgressSteps với mini visualization
   ═══════════════════════════════════════════════════════════════════════════ */

function MechanismProgressBar({ current, total }: { current: number; total: number }) {
  const labels = [
    "Ghi lại hành vi",
    "Tìm người giống bạn",
    "Điều chỉnh theo vùng",
    "AI tóm tắt đánh giá",
  ];
  return (
    <div className="not-prose mb-5 rounded-lg border border-border bg-surface/60 p-3">
      <div className="flex items-center gap-1.5 mb-2">
        {labels.map((_, i) => {
          const stepNum = i + 1;
          const isCurrent = stepNum === current;
          const isDone = stepNum < current;
          let widthClass = "w-4";
          let bgClass = "bg-surface";
          if (isCurrent) {
            widthClass = "w-10";
            bgClass = "bg-[#ee4d2d]";
          } else if (isDone) {
            widthClass = "w-6";
            bgClass = "bg-[#ee4d2d]/60";
          }
          return (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${widthClass} ${bgClass}`}
            />
          );
        })}
        <span className="ml-auto text-xs text-muted">
          Bước {current}/{total}
        </span>
      </div>
      <p className="text-xs text-muted">
        {current}/{total} · {labels[current - 1]}
      </p>
    </div>
  );
}

/* Beat 1 — Signal collection diagram */
function SignalCollectionDiagram() {
  const reduce = useReducedMotion();
  const signals = [
    { icon: Eye, label: "Xem sản phẩm", color: "#6366f1" },
    { icon: MousePointerClick, label: "Bấm chi tiết", color: "#10b981" },
    { icon: ShoppingBag, label: "Thêm giỏ", color: "#f59e0b" },
    { icon: Star, label: "Chấm sao", color: "#ef4444" },
    { icon: MessageSquare, label: "Viết đánh giá", color: "#a855f7" },
  ];
  return (
    <div className="not-prose mt-3 rounded-lg border border-border bg-surface/60 p-3">
      <div className="flex items-center gap-2 mb-2">
        <Zap size={14} className="text-[#ee4d2d]" />
        <span className="text-xs font-semibold text-foreground">
          Shopee thu tín hiệu gì từ bạn mỗi lần mở app
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {signals.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={reduce ? false : { opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -40px 0px" }}
              transition={{ duration: 0.25, delay: i * 0.08 }}
              className="flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px]"
              style={{
                borderColor: `${s.color}66`,
                backgroundColor: `${s.color}10`,
                color: s.color,
              }}
            >
              <Icon size={11} />
              <span>{s.label}</span>
            </motion.div>
          );
        })}
      </div>
      <p className="text-[11px] text-muted mt-2 leading-relaxed">
        Mỗi hành động là một tín hiệu. Một người dùng trung bình gửi vài trăm tín hiệu mỗi ngày. Shopee ghi hết.
      </p>
    </div>
  );
}

/* Beat 2 — Similar-users diagram */
function SimilarUsersDiagram() {
  const reduce = useReducedMotion();
  const you = { avatar: "Bạn", color: "#ee4d2d" };
  const neighbors = [
    { avatar: "H", color: "#ef4444", sim: 92, they: "đầm maxi, son MAC, sách làm mẹ" },
    { avatar: "L", color: "#10b981", sim: 88, they: "đầm maxi, nước hoa Chanel, bồn tắm bé" },
    { avatar: "N", color: "#6366f1", sim: 81, they: "đầm maxi, bỉm Huggies, gấu bông" },
  ];
  return (
    <div className="not-prose mt-3 rounded-lg border border-border bg-surface/60 p-3">
      <div className="flex items-center gap-2 mb-3">
        <Users size={14} className="text-[#ee4d2d]" />
        <span className="text-xs font-semibold text-foreground">
          Nhóm &quot;người giống bạn&quot; của Shopee
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center gap-1">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: you.color }}
          >
            {you.avatar}
          </div>
          <span className="text-[10px] text-foreground">Bạn</span>
        </div>
        <motion.div
          initial={reduce ? { scaleX: 1 } : { scaleX: 0, transformOrigin: "left" }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "0px 0px -40px 0px" }}
          transition={{ duration: 0.6 }}
          className="h-0.5 flex-1 rounded-full bg-gradient-to-r from-[#ee4d2d] to-indigo-400"
        />
        <div className="flex flex-col gap-2">
          {neighbors.map((n, i) => (
            <motion.div
              key={n.avatar}
              initial={reduce ? false : { opacity: 0, x: 8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.6 + i * 0.15 }}
              className="flex items-center gap-2"
            >
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: n.color }}
              >
                {n.avatar}
              </div>
              <div className="text-[10px] leading-tight">
                <div className="text-foreground font-semibold">giống {n.sim}%</div>
                <div className="text-muted">mua: {n.they}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-muted mt-3 leading-relaxed">
        Shopee tìm 3 &quot;hàng xóm&quot; gu giống bạn nhất, rồi gợi ý thứ họ đã mua mà bạn chưa.
      </p>
    </div>
  );
}

/* Beat 3 — Vietnam vs Thailand vs Indonesia */
function LocalizationDiagram() {
  const reduce = useReducedMotion();
  const markets = [
    {
      flag: "🇻🇳",
      country: "Việt Nam",
      tiles: ["🍜 Mì Hảo Hảo", "👘 Áo dài", "🏍️ Nón bảo hiểm"],
      color: "#ef4444",
    },
    {
      flag: "🇹🇭",
      country: "Thái Lan",
      tiles: ["🥭 Xoài sấy", "🙏 Vòng tay chùa", "🛺 Phụ kiện tuktuk"],
      color: "#6366f1",
    },
    {
      flag: "🇮🇩",
      country: "Indonesia",
      tiles: ["🧕 Khăn hijab", "🍛 Gia vị rendang", "📿 Chuỗi hạt cầu nguyện"],
      color: "#10b981",
    },
  ];
  return (
    <div className="not-prose mt-3 rounded-lg border border-border bg-surface/60 p-3">
      <div className="flex items-center gap-2 mb-3">
        <Globe2 size={14} className="text-[#ee4d2d]" />
        <span className="text-xs font-semibold text-foreground">
          Cùng là &quot;Shopee&quot; nhưng trang chủ rất khác nhau giữa ba nước
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {markets.map((m, i) => (
          <motion.div
            key={m.country}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -40px 0px" }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
            className="rounded-md border p-2"
            style={{ borderColor: `${m.color}55`, backgroundColor: `${m.color}0d` }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-base">{m.flag}</span>
              <span className="text-xs font-semibold text-foreground">
                {m.country}
              </span>
            </div>
            <div className="space-y-1">
              {m.tiles.map((t) => (
                <div
                  key={t}
                  className="rounded bg-card px-1.5 py-0.5 text-[10px] text-foreground"
                >
                  {t}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
      <p className="text-[11px] text-muted mt-3 leading-relaxed">
        Mẫu số chung là thuật toán. Biến số địa phương: danh mục phổ biến, ngôn ngữ mô tả, lịch mùa vụ, thậm chí cả khung giờ app hoạt động mạnh nhất.
      </p>
    </div>
  );
}

/* Beat 4 — AI Review Summary mock */
function ReviewSummaryMock() {
  const reduce = useReducedMotion();
  const reviews = [
    "“Chất vải mát, ủi xong rất mềm, mặc đi làm văn phòng hợp.”",
    "“Size M hơi rộng với người 48kg, nên đặt S.”",
    "“Đóng gói cẩn thận, giao nhanh 2 ngày trong TP.”",
    "“Màu hơi sáng hơn ảnh một chút nhưng vẫn đẹp.”",
    "“…”",
  ];
  return (
    <div className="not-prose mt-3 rounded-lg border border-border bg-surface/60 p-3">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={14} className="text-[#ee4d2d]" />
        <span className="text-xs font-semibold text-foreground">
          AI tóm tắt 1.847 đánh giá trong 2 giây
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2 items-center">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wide text-muted">
            1.847 đánh giá gốc
          </p>
          <div className="rounded-md border border-border bg-card p-2 space-y-1 max-h-32 overflow-hidden">
            {reviews.map((r, i) => (
              <motion.p
                key={i}
                initial={reduce ? false : { opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.2, delay: i * 0.1 }}
                className="text-[10px] text-muted italic leading-relaxed"
              >
                {r}
              </motion.p>
            ))}
          </div>
        </div>
        <motion.div
          initial={reduce ? { scaleX: 1 } : { scaleX: 0, transformOrigin: "left" }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="hidden sm:block h-0.5 w-full bg-gradient-to-r from-border to-[#ee4d2d]"
        />
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wide text-muted">Tóm tắt</p>
          <div className="rounded-md border border-[#ee4d2d]/30 bg-orange-50 dark:bg-orange-900/20 p-2 text-[11px] text-foreground leading-relaxed">
            <strong className="text-[#ee4d2d]">Ưu:</strong> chất vải mát, giao nhanh, màu đúng ảnh.
            <br />
            <strong className="text-[#ee4d2d]">Nhược:</strong> size chạy lớn — nên đặt giảm 1 size nếu dưới 50kg.
          </div>
        </div>
      </div>
      <p className="text-[11px] text-muted mt-2 leading-relaxed">
        Khách không còn đọc 1.800 dòng — đọc 3 dòng là đủ tự tin bấm mua.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   METRICS — AnimatedCounter tái sử dụng pattern từ llm-overview-in-chat-assistants
   ═══════════════════════════════════════════════════════════════════════════ */

function AnimatedCounter({
  to,
  suffix = "",
  prefix = "",
  duration = 1.4,
  decimals = 0,
}: {
  to: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  decimals?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v: number) => {
    if (decimals === 0) return Math.round(v).toLocaleString("vi-VN");
    return v.toLocaleString("vi-VN", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  });

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      count.set(to);
      return;
    }
    const controls = animate(count, to, { duration, ease: "easeOut" });
    return () => controls.stop();
  }, [inView, to, duration, reduce, count]);

  return (
    <span ref={ref} className="tabular-nums font-bold">
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}

function MetricsShowcase() {
  const cards = [
    {
      icon: TrendingUp,
      label: "Thị phần GMV thương mại điện tử Đông Nam Á năm 2024",
      value: 52,
      suffix: "%",
      sub: "Tăng từ 48% năm 2023",
      color: "#ee4d2d",
      sourceRef: 1,
    },
    {
      icon: BarChart3,
      label: "Giá trị thị trường Shopee",
      value: 66.8,
      prefix: "",
      suffix: " tỷ USD",
      decimals: 1,
      sub: "Theo GrowthHQ, 2024",
      color: "#10b981",
      sourceRef: 1,
    },
    {
      icon: MessageSquare,
      label: "Cuộc hội thoại hỗ trợ do chatbot Sophie xử lý năm 2023",
      value: 18,
      suffix: " triệu",
      sub: "80% được AI giải quyết hoàn toàn",
      color: "#6366f1",
      sourceRef: 3,
    },
  ];

  return (
    <div className="not-prose my-4 grid grid-cols-1 md:grid-cols-3 gap-3">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -60px 0px" }}
            transition={{ duration: 0.4, delay: i * 0.12 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-md"
                style={{ backgroundColor: `${c.color}22`, color: c.color }}
              >
                <Icon size={16} />
              </div>
              <span className="text-[11px] uppercase tracking-wide text-muted">
                Số thật
              </span>
            </div>
            <div className="text-3xl mb-1" style={{ color: c.color }}>
              <AnimatedCounter
                to={c.value}
                prefix={c.prefix}
                suffix={c.suffix}
                decimals={c.decimals ?? 0}
              />
            </div>
            <p className="text-xs text-foreground leading-snug mb-1">{c.label}</p>
            <p className="text-[11px] text-muted">{c.sub}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COUNTERFACTUAL — Trước vs sau (visual timeline)
   ═══════════════════════════════════════════════════════════════════════════ */

function CounterfactualTimeline() {
  const reduce = useReducedMotion();
  const beats = [
    {
      icon: Flame,
      title: "Trang chủ bị lấn bởi hàng hot thuần",
      body: "Không có recommender → Shopee phải đẩy cùng một danh sách top bán chạy cho 200 triệu người. Chị Hương thấy TV 55″ dù con chị đang dùng bỉm size M.",
      color: "#ef4444",
    },
    {
      icon: Eye,
      title: "Người dùng tự lướt hàng giờ",
      body: "Không có gợi ý → khách phải tự gõ tìm kiếm. Trung bình mỗi lần mua mất 15-20 phút thay vì 3-5 phút. Tỷ lệ bỏ cuộc giữa chừng tăng mạnh.",
      color: "#f59e0b",
    },
    {
      icon: ShoppingBag,
      title: "Người bán nhỏ chìm dưới thương hiệu lớn",
      body: "Shop gia đình ở Buôn Ma Thuột không có ngân sách ads → sản phẩm không ai tìm thấy. Sàn mất đi sự đa dạng, khách cũng không có gì mới để khám phá.",
      color: "#a855f7",
    },
    {
      icon: Smartphone,
      title: "Mỗi quốc gia cần một đội biên tập riêng",
      body: "Không có AI cá nhân hóa → phải thuê hàng trăm người ngồi chọn sản phẩm thủ công cho từng thị trường. Chi phí vận hành tăng gấp nhiều lần, nhưng chất lượng tệ hơn.",
      color: "#10b981",
    },
  ];

  return (
    <div className="not-prose my-4 space-y-2">
      {beats.map((b, i) => {
        const Icon = b.icon;
        return (
          <motion.div
            key={b.title}
            initial={reduce ? false : { opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "0px 0px -40px 0px" }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
            className="rounded-lg border border-border bg-card p-3 flex gap-3"
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
              style={{ backgroundColor: `${b.color}22`, color: b.color }}
            >
              <Icon size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground mb-0.5">
                {b.title}
              </p>
              <p className="text-xs text-muted leading-relaxed">{b.body}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TOPIC COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export default function RecommendationSystemsInShopping() {
  return (
    <ApplicationLayout metadata={metadata} parentTitleVi="Hệ thống Gợi ý">
      <ApplicationHero
        parentTitleVi="Hệ thống Gợi ý"
        topicSlug="recommendation-systems-in-shopping"
      >
        <p>
          Mở Shopee 8h sáng thứ Hai. Chị Hương (mẹ bỉm 32 tuổi ở Q.7) thấy bình
          sữa Pigeon, bỉm Huggies, và sách nuôi dạy bé. Cùng lúc đó, Minh (sinh
          viên Bách Khoa) thấy tai nghe Sony, chuột chơi game, và mì Koreno. Anh
          Tuấn (kế toán trưởng ở Hà Nội) thấy sơ mi Owen, giày da Aokang, và
          đồng hồ Citizen. <strong>Cùng một app, ba trang chủ hoàn toàn khác
          nhau.</strong>
        </p>
        <ShopeeMockHero />
        <p>
          Đằng sau điều đó là hệ thống gợi ý (recommendation system) của Shopee
          — thuật toán AI ghi nhớ hàng tỷ tương tác mỗi ngày để đoán xem bạn sẽ
          mua gì tiếp theo. Đây không phải công nghệ phụ — nó là trái tim kinh
          tế của sàn.
        </p>
        <p>
          Năm 2024, Shopee chiếm 52% thị phần thương mại điện tử Đông Nam Á, đạt
          giá trị 66,8 tỷ USD. Đội sản phẩm ở Sea Group nhiều lần nhắc đến
          &ldquo;hyper-personalization&rdquo; (cá nhân hóa sâu) như yếu tố then
          chốt giữ Shopee đi trước Lazada, Tiki và các đối thủ địa phương khác.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="recommendation-systems-in-shopping">
        <p>
          Hệ thống gợi ý là thuật toán AI đoán bạn sẽ thích sản phẩm, nội dung,
          dịch vụ nào dựa trên lịch sử hành vi của bạn và những người có gu
          giống bạn. Nghe đơn giản. Nhưng quy mô mới là vấn đề.
        </p>
        <p>
          Shopee có hàng trăm triệu sản phẩm từ hàng triệu người bán. Nếu không
          có gợi ý, khách phải tự lướt trong biển sản phẩm. Shop nhỏ bị lấn át.
          Khách mệt nên bỏ cuộc giữa chừng. Doanh số rớt. Kết quả: ai cũng
          thiệt.
        </p>
        <GenericVsPersonal />
        <p>
          Còn một thách thức nữa đặc trưng Đông Nam Á: Shopee vận hành 6 thị
          trường với ngôn ngữ, văn hóa, thu nhập, mùa vụ hoàn toàn khác nhau.
          Đầm maxi bán chạy ở Sài Gòn nhưng không ai mua ở Bangkok. Ngày ăn chay
          Ramadan ở Jakarta cần hoàn toàn khác nhóm sản phẩm. Không có AI thì
          phải thuê đội biên tập khổng lồ cho mỗi thị trường — tốn kém và vẫn
          không chính xác.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Hệ thống Gợi ý"
        topicSlug="recommendation-systems-in-shopping"
      >
        <Beat step={1}>
          <MechanismProgressBar current={1} total={4} />
          <p>
            <strong>Ghi lại từng hành vi của hàng trăm triệu người dùng.</strong>{" "}
            Shopee gắn một &ldquo;máy ghi âm ngầm&rdquo; vào mọi lượt truy cập:
            bạn xem sản phẩm nào bao lâu, bấm vào đâu, thêm giỏ rồi bỏ hay mua
            hẳn, chấm mấy sao, viết đánh giá nói gì. Mỗi người trung bình tạo ra
            vài trăm tín hiệu mỗi ngày. Tất cả chảy về kho dữ liệu Shopee — nguyên liệu thô cho các mô hình AI phía sau.
          </p>
          <SignalCollectionDiagram />
        </Beat>

        <Beat step={2}>
          <MechanismProgressBar current={2} total={4} />
          <p>
            <strong>Trộn lọc cộng tác với lọc nội dung.</strong> Lọc cộng tác
            (collaborative filtering) tìm những khách có gu mua giống bạn, rồi
            gợi ý những gì họ đã mua mà bạn chưa. Lọc nội dung (content-based
            filtering) so đặc tính sản phẩm — chất liệu, kiểu dáng, giá, thương
            hiệu — để đề xuất sản phẩm na ná. Shopee trộn cả hai: lọc cộng tác
            cho khách quen (dữ liệu dồi dào), lọc nội dung khi gặp sản phẩm mới
            hoặc khách mới.
          </p>
          <SimilarUsersDiagram />
        </Beat>

        <Beat step={3}>
          <MechanismProgressBar current={3} total={4} />
          <p>
            <strong>Điều chỉnh theo ngữ cảnh từng quốc gia.</strong> Mô hình gốc
            của Shopee là chung toàn khu vực, nhưng được tinh chỉnh riêng cho
            Việt Nam, Thái Lan, Indonesia, Malaysia, Philippines, Singapore.
            Thay đổi không chỉ ở danh mục sản phẩm phổ biến, mà còn ở mùa vụ
            (Tết Nguyên đán ở Việt Nam, Ramadan ở Indonesia), cách viết tiêu
            đề, thậm chí khung giờ app hoạt động mạnh. Đây là lý do cùng một
            thuật toán lại cho ra trang chủ rất khác nhau.
          </p>
          <LocalizationDiagram />
        </Beat>

        <Beat step={4}>
          <MechanismProgressBar current={4} total={4} />
          <p>
            <strong>AI tóm tắt đánh giá để khách quyết định nhanh.</strong> Một
            sản phẩm hot có thể có hàng nghìn review. Không ai đủ thời gian đọc
            hết — nên nhiều khách do dự rồi thoát app. Shopee dùng AI tóm tắt:
            quét toàn bộ đánh giá, trích xuất ưu điểm và nhược điểm phổ biến, in
            thành 3-4 dòng đầu trang sản phẩm. Kết quả: tỷ lệ chuyển đổi
            (conversion rate — khách xem thành khách mua) tăng rõ rệt, đặc biệt
            với khách mới chưa quen.
          </p>
          <ReviewSummaryMock />
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="recommendation-systems-in-shopping"
      >
        <MetricsShowcase />

        <Metric
          value="52% thị phần GMV thương mại điện tử Đông Nam Á năm 2024 (tăng từ 48% năm 2023)"
          sourceRef={1}
        />
        <Metric
          value="66,8 tỷ đô-la Mỹ giá trị thị trường của Shopee"
          sourceRef={1}
        />
        <Metric
          value="Chatbot AI Sophie xử lý 18 triệu cuộc hội thoại hỗ trợ năm 2023, giải quyết 80% tự động"
          sourceRef={3}
        />

        <Callout variant="info" title="Đọc các con số này như thế nào?">
          <p className="text-sm leading-relaxed">
            52% thị phần nghĩa là <strong>hơn một nửa GMV</strong> thương mại
            điện tử toàn Đông Nam Á đi qua Shopee — vượt xa Lazada, Tokopedia,
            Tiki cộng lại. Con số 66,8 tỷ USD là giá trị thị trường (market cap)
            — tức mức nhà đầu tư định giá Sea Group cho riêng mảng Shopee. Và
            18 triệu cuộc chat cho thấy bot AI Sophie đã thay thế một trung tâm
            CSKH cỡ 5.000-10.000 nhân sự.
          </p>
        </Callout>
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Hệ thống Gợi ý"
        topicSlug="recommendation-systems-in-shopping"
      >
        <p>
          Hình dung Shopee phiên bản không có AI gợi ý: mọi khách đều nhận cùng
          một trang chủ, tìm kiếm là cách duy nhất để mua đúng thứ, và mỗi
          quốc gia cần đội biên tập khổng lồ. Đây không phải tưởng tượng — đó
          chính xác là mô hình của các trang thương mại điện tử thế hệ đầu
          2000-2010. Gần như không ai sống sót.
        </p>
        <CounterfactualTimeline />
        <p>
          Hệ thống gợi ý cho phép Shopee phục vụ hàng trăm triệu người với trải
          nghiệm cá nhân hóa — mỗi người thấy một &ldquo;cửa hàng&rdquo; khác
          nhau, phù hợp với túi tiền, giai đoạn cuộc sống, vùng miền, và cả tâm
          trạng hôm đó. Điều này không chỉ tăng doanh số; nó còn mở cánh cửa
          cho hàng triệu shop nhỏ tiếp cận đúng khách mục tiêu mà không cần
          chạy quảng cáo.
        </p>
        <Callout variant="tip" title="Góc nhìn cho dân văn phòng">
          <p className="text-sm leading-relaxed">
            Nếu bạn làm marketing hoặc e-commerce ở Việt Nam, hiểu recommender
            Shopee giúp bạn: (1) tối ưu tiêu đề &amp; ảnh sản phẩm để lọc nội
            dung &ldquo;nhấc&rdquo; lên dễ hơn, (2) tập trung chăm sóc nhóm
            khách quay lại trong 7-14 ngày đầu (giai đoạn cold start quyết định
            giữ chân), (3) không hoảng khi doanh số dao động 10-15% giữa các
            tuần — đôi khi chỉ vì Shopee đang thử A/B test một trọng số mới. Đây
            là kiến thức nền giúp bạn đối thoại ngang hàng với đội sản phẩm/dữ
            liệu mà không cần biết viết code.
          </p>
        </Callout>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
