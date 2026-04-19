"use client";

import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Music,
  Video,
  PlayCircle,
  Heart,
  SkipForward,
  ListOrdered,
  Scale,
  GitCompare,
  Target,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Eye,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Layers,
  Check,
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
  ToggleCompare,
  InlineChallenge,
  Callout,
  MiniSummary,
  StepReveal,
} from "@/components/interactive";

export const metadata: TopicMeta = {
  slug: "loss-functions-in-recommendation",
  title: "Loss Functions in Recommendation Systems",
  titleVi: "Hàm mất mát trong hệ gợi ý — Shopee, TikTok, Spotify, YouTube",
  description:
    "Cùng một lịch sử người dùng, cùng một mô hình — đổi hàm mất mát thì bảng xếp hạng top 10 đổi hoàn toàn. Vì sao MSE thua pairwise/ranking loss ở Shopee, TikTok, Spotify, YouTube.",
  category: "neural-fundamentals",
  tags: ["loss-functions", "recommendation", "ranking", "application"],
  difficulty: "intermediate",
  relatedSlugs: ["loss-functions"],
  vizType: "interactive",
  applicationOf: "loss-functions",
  featuredApp: {
    name: "YouTube / TikTok / Shopee / Spotify",
    productFeature: "Ranking mô hình gợi ý",
    company: "Google, ByteDance, Sea Group, Spotify",
    countryOrigin: "US/CN/SG/SE",
  },
  sources: [
    {
      title: "Deep Neural Networks for YouTube Recommendations",
      publisher: "Covington, Adams & Sargin, ACM RecSys 2016",
      url: "https://dl.acm.org/doi/10.1145/2959100.2959190",
      date: "2016-09",
      kind: "paper",
    },
    {
      title:
        "Monolith: Real Time Recommendation System With Collisionless Embedding Table",
      publisher: "ByteDance / TikTok — arXiv",
      url: "https://arxiv.org/abs/2209.07663",
      date: "2022-09",
      kind: "paper",
    },
    {
      title:
        "BPR: Bayesian Personalized Ranking from Implicit Feedback",
      publisher: "Rendle et al., UAI 2009",
      url: "https://arxiv.org/abs/1205.2618",
      date: "2009-06",
      kind: "paper",
    },
    {
      title: "LambdaRank / LambdaMART: Learning to Rank",
      publisher: "Burges et al., Microsoft Research",
      url: "https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/MSR-TR-2010-82.pdf",
      date: "2010-06",
      kind: "paper",
    },
    {
      title: "On YouTube's Recommendation System",
      publisher: "YouTube Official Blog",
      url: "https://blog.youtube/inside-youtube/on-youtubes-recommendation-system/",
      date: "2021-09",
      kind: "engineering-blog",
    },
    {
      title:
        "Neural Collaborative Filtering for Personalized Ranking (Spotify-style)",
      publisher: "He et al., WWW 2017",
      url: "https://arxiv.org/abs/1708.05031",
      date: "2017-04",
      kind: "paper",
    },
    {
      title:
        "From RankNet to LambdaRank to LambdaMART: An Overview",
      publisher: "Chris Burges, Microsoft Research",
      url: "https://www.microsoft.com/en-us/research/publication/from-ranknet-to-lambdarank-to-lambdamart-an-overview/",
      date: "2010-06",
      kind: "paper",
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
   DỮ LIỆU — 10 ứng viên video, cùng lịch sử một người dùng
   "Minh — 20 tuổi, Sài Gòn, thích bóng rổ & lo-fi"
   ──────────────────────────────────────────────────────────── */

type LossKey = "mse" | "pairwise" | "listwise";

interface Candidate {
  id: string;
  title: string;
  author: string;
  topic: string;
  topicColor: string;
  /** Ground-truth relevance (what Minh would truly enjoy, 0-10) */
  trueRelevance: number;
  /** Model score dưới hàm MSE — học phải đoán số điểm sao chép y chang */
  mseScore: number;
  /** Model score dưới hàm pairwise (BPR) — chỉ cần A > B đúng thứ tự */
  pairwiseScore: number;
  /** Model score dưới listwise (LambdaRank, NDCG-aware) */
  listwiseScore: number;
  icon: typeof Video;
}

const USER_HISTORY = [
  { title: "Highlights bóng rổ NBA tuần này", type: "Bóng rổ" },
  { title: "Top 10 pha dunk đẹp nhất 2024", type: "Bóng rổ" },
  { title: "Lo-fi beats ôn bài 2h", type: "Lo-fi" },
  { title: "Chill lo-fi mưa Sài Gòn", type: "Lo-fi" },
  { title: "Podcast về tuổi 20", type: "Podcast" },
];

const CANDIDATES: Candidate[] = [
  { id: "c1", title: "Phân tích Curry 3 điểm cuối trận", author: "BasketVN", topic: "Bóng rổ", topicColor: "#f97316", trueRelevance: 9.2, mseScore: 6.1, pairwiseScore: 9.0, listwiseScore: 9.4, icon: Video },
  { id: "c2", title: "Lo-fi sáng thứ bảy — 1h", author: "ChillHub", topic: "Lo-fi", topicColor: "#8b5cf6", trueRelevance: 8.7, mseScore: 5.8, pairwiseScore: 8.4, listwiseScore: 9.0, icon: Music },
  { id: "c3", title: "CLICKBAIT: 10 bí ẩn không thể tin nổi!!!", author: "ViralX", topic: "Clickbait", topicColor: "#ef4444", trueRelevance: 1.5, mseScore: 7.9, pairwiseScore: 2.3, listwiseScore: 1.8, icon: AlertTriangle },
  { id: "c4", title: "NBA recap — LeBron vs Celtics", author: "HoopDaily", topic: "Bóng rổ", topicColor: "#f97316", trueRelevance: 8.3, mseScore: 5.4, pairwiseScore: 7.8, listwiseScore: 8.6, icon: Video },
  { id: "c5", title: "Lo-fi học bài mưa đêm", author: "StudyBeats", topic: "Lo-fi", topicColor: "#8b5cf6", trueRelevance: 8.1, mseScore: 5.2, pairwiseScore: 7.6, listwiseScore: 8.3, icon: Music },
  { id: "c6", title: "Review điện thoại Samsung Galaxy", author: "TechKen", topic: "Tech", topicColor: "#0ea5e9", trueRelevance: 3.8, mseScore: 4.7, pairwiseScore: 3.9, listwiseScore: 3.5, icon: Video },
  { id: "c7", title: "Tutorial vẽ anime cho người mới", author: "ArtStudio", topic: "Vẽ", topicColor: "#10b981", trueRelevance: 2.1, mseScore: 3.6, pairwiseScore: 2.4, listwiseScore: 2.0, icon: Video },
  { id: "c8", title: "NBA draft 2024 — top 5 rookies", author: "BasketVN", topic: "Bóng rổ", topicColor: "#f97316", trueRelevance: 7.8, mseScore: 5.0, pairwiseScore: 7.3, listwiseScore: 8.1, icon: Video },
  { id: "c9", title: "Nấu ăn 15 phút — món bún bò", author: "BepSG", topic: "Nấu ăn", topicColor: "#eab308", trueRelevance: 4.2, mseScore: 4.5, pairwiseScore: 4.0, listwiseScore: 4.4, icon: Video },
  { id: "c10", title: "Podcast tuổi trẻ — EP 42", author: "AnhYoungPod", topic: "Podcast", topicColor: "#a855f7", trueRelevance: 6.9, mseScore: 4.8, pairwiseScore: 6.6, listwiseScore: 7.0, icon: PlayCircle },
];

const LOSS_META: Record<
  LossKey,
  {
    labelVi: string;
    labelShort: string;
    color: string;
    tagline: string;
    icon: typeof Target;
    scoreField: keyof Pick<
      Candidate,
      "mseScore" | "pairwiseScore" | "listwiseScore"
    >;
  }
> = {
  mse: {
    labelVi: "MSE — Dự đoán số điểm",
    labelShort: "MSE (pointwise)",
    color: "#0ea5e9",
    tagline:
      "Bắt mô hình đoán đúng con số (rating, watch-time). Nhưng xếp hạng không phải mục tiêu của nó.",
    icon: Target,
    scoreField: "mseScore",
  },
  pairwise: {
    labelVi: "Pairwise (BPR) — So sánh từng cặp",
    labelShort: "Pairwise (A > B)",
    color: "#10b981",
    tagline:
      "Chỉ cần: mô hình đoán cặp nào 'A > B' đúng bằng hành vi thật. Không quan tâm số cụ thể.",
    icon: GitCompare,
    scoreField: "pairwiseScore",
  },
  listwise: {
    labelVi: "Listwise (NDCG / LambdaRank) — Tối ưu cả bảng",
    labelShort: "Listwise (NDCG)",
    color: "#f59e0b",
    tagline:
      "Nhìn toàn bộ top-K, phạt nặng lỗi ở vị trí trên. Đây là thứ thực tế mỗi app đang tối ưu.",
    icon: ListOrdered,
    scoreField: "listwiseScore",
  },
};

/* ────────────────────────────────────────────────────────────
   HELPERS — xếp hạng theo từng loss
   ──────────────────────────────────────────────────────────── */

function rankBy(loss: LossKey): Candidate[] {
  const field = LOSS_META[loss].scoreField;
  return [...CANDIDATES].sort((a, b) => b[field] - a[field]);
}

function ndcgAt(k: number, ordered: Candidate[]): number {
  const dcg = ordered
    .slice(0, k)
    .reduce(
      (sum, c, i) => sum + (Math.pow(2, c.trueRelevance) - 1) / Math.log2(i + 2),
      0,
    );
  const idealOrdered = [...CANDIDATES].sort(
    (a, b) => b.trueRelevance - a.trueRelevance,
  );
  const idcg = idealOrdered
    .slice(0, k)
    .reduce(
      (sum, c, i) => sum + (Math.pow(2, c.trueRelevance) - 1) / Math.log2(i + 2),
      0,
    );
  return idcg === 0 ? 0 : dcg / idcg;
}

function averageTrueAtTopK(k: number, ordered: Candidate[]): number {
  const slice = ordered.slice(0, k);
  if (slice.length === 0) return 0;
  return slice.reduce((s, c) => s + c.trueRelevance, 0) / slice.length;
}

/* ────────────────────────────────────────────────────────────
   COMPONENT CHÍNH
   ──────────────────────────────────────────────────────────── */

export default function LossFunctionsInRecommendation() {
  const [activeLoss, setActiveLoss] = useState<LossKey>("mse");
  const [hovered, setHovered] = useState<string | null>(null);

  const ranked = useMemo(() => rankBy(activeLoss), [activeLoss]);
  const ndcg10 = useMemo(() => ndcgAt(10, ranked), [ranked]);
  const avgTrueTop3 = useMemo(() => averageTrueAtTopK(3, ranked), [ranked]);

  const toggleLoss = useCallback((next: LossKey) => {
    setActiveLoss(next);
  }, []);

  return (
    <ApplicationLayout metadata={metadata} parentTitleVi="Hàm mất mát">
      {/* ═════════════ HERO ═════════════ */}
      <ApplicationHero
        parentTitleVi="Hàm mất mát"
        topicSlug="loss-functions-in-recommendation"
      >
        <p>
          Mở <strong>Shopee</strong> bạn thấy &ldquo;Gợi ý cho bạn&rdquo; —
          20 sản phẩm xếp theo thứ tự. Mở <strong>TikTok</strong> bạn lướt
          For You và 30 video đầu tiên đã chọn thứ tự rất kỹ. Mở{" "}
          <strong>Spotify</strong>, Discover Weekly sắp 30 bài theo đúng
          tuần tự bạn sẽ thích nhất &rArr; giảm dần. <strong>YouTube</strong>{" "}
          làm điều tương tự với hàng tỉ video mỗi ngày.
        </p>
        <p>
          Bên trong cả bốn hệ gợi ý này là cùng một câu hỏi: <em>&ldquo;Mô
          hình nên học điều gì?&rdquo;</em> Câu trả lời nằm ở{" "}
          <strong>hàm mất mát (loss function)</strong> — thước đo cho biết
          mô hình đoán &ldquo;đúng&rdquo; đến đâu. Cùng một dữ liệu, đổi
          loss thì bảng xếp hạng top 10 đổi hoàn toàn. Đây là chỗ thú vị
          nhất của câu chuyện: không phải &ldquo;bao nhiêu dữ liệu&rdquo;
          mà là &ldquo;dạy mô hình tối ưu điều gì&rdquo; mới quyết định
          trải nghiệm của bạn.
        </p>

        {/* Small platform strip */}
        <div className="not-prose grid grid-cols-2 gap-2 sm:grid-cols-4 my-4">
          {[
            { name: "Shopee", tag: "E-commerce (SG)", color: "#f97316", icon: ShoppingBag, note: "Gợi ý sản phẩm — ưu tiên mua thật, không chỉ click" },
            { name: "TikTok", tag: "Video (CN)", color: "#ec4899", icon: Video, note: "For You — sắp xếp cho người xem lâu, không bỏ lướt" },
            { name: "Spotify", tag: "Nhạc (SE)", color: "#22c55e", icon: Music, note: "Discover Weekly — 30 bài theo đúng thứ tự yêu thích" },
            { name: "YouTube", tag: "Video (US)", color: "#ef4444", icon: PlayCircle, note: "Home & Up Next — tối ưu watch time, chống clickbait" },
          ].map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.name}
                className="rounded-xl border bg-card p-3 space-y-1"
                style={{ borderColor: p.color + "40" }}
              >
                <div className="flex items-center gap-2">
                  <Icon size={14} style={{ color: p.color }} />
                  <span className="text-xs font-bold" style={{ color: p.color }}>{p.name}</span>
                </div>
                <p className="text-[10px] text-tertiary uppercase tracking-wide">{p.tag}</p>
                <p className="text-xs text-foreground/80 leading-snug">{p.note}</p>
              </div>
            );
          })}
        </div>

        <Callout variant="insight" title="Câu hỏi trung tâm của bài này">
          Khi bạn click video A và lướt bỏ video B — hàm mất mát nên{" "}
          <em>thưởng</em> cho mô hình điều gì? Thưởng vì đoán đúng con số
          điểm của A? Thưởng vì đặt A trên B trong danh sách? Hay thưởng
          vì toàn bộ top 10 phù hợp với bạn?
        </Callout>
      </ApplicationHero>

      {/* ═════════════ PROBLEM ═════════════ */}
      <ApplicationProblem topicSlug="loss-functions-in-recommendation">
        <p>
          Hệ gợi ý không cần đoán &ldquo;điểm&rdquo; chính xác. Nó cần
          <strong> sắp xếp đúng thứ tự</strong>. Nhưng các hàm mất mát
          quen thuộc nhất từ trường lớp (MSE — sai số bình phương trung
          bình, MAE — sai số tuyệt đối) lại được thiết kế cho hồi quy:
          chúng phạt khoảng cách giữa con số dự đoán và con số thật.
        </p>

        <div className="not-prose grid gap-3 sm:grid-cols-3 my-4">
          {[
            { icon: Target, title: "MSE — học con số", desc: "Dự đoán rating 4.0 khi thật là 4.5 &rArr; mất 0.25. Phạt theo khoảng cách, không quan tâm thứ tự.", color: "#0ea5e9", when: "Hồi quy giá nhà, nhiệt độ — có đáp án số thật." },
            { icon: GitCompare, title: "Pairwise — học cặp", desc: "So từng cặp A vs B. Mô hình đặt A > B đúng &rArr; điểm tốt. Không cần biết số cụ thể.", color: "#10b981", when: "Hệ gợi ý có phản hồi ngầm (ai click, ai skip)." },
            { icon: ListOrdered, title: "Listwise — học cả bảng", desc: "Nhìn top-K, phạt mạnh lỗi ở vị trí cao. Tối ưu trực tiếp metric đánh giá (NDCG).", color: "#f59e0b", when: "Ranking sản xuất — TikTok, YouTube, Shopee." },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.title}
                className="rounded-xl border p-4 bg-card space-y-2"
                style={{ borderColor: c.color + "40" }}
              >
                <div className="flex items-center gap-2">
                  <Icon size={16} style={{ color: c.color }} />
                  <p className="text-sm font-bold" style={{ color: c.color }}>{c.title}</p>
                </div>
                <p className="text-xs text-foreground leading-relaxed">{c.desc}</p>
                <p className="text-[11px] text-tertiary italic leading-snug">
                  Phù hợp khi: {c.when}
                </p>
              </div>
            );
          })}
        </div>

        <p>
          Câu chuyện nổi tiếng: YouTube từng tối ưu CTR (click-through
          rate) bằng hàm mất mát phân loại nhị phân — kết quả là trang
          chủ tràn ngập clickbait (video tiêu đề giật gân, nội dung kém).
          Họ chuyển sang <strong>weighted logistic regression với trọng
          số watch-time</strong> — về bản chất là biến loss thành
          &ldquo;dự đoán thời gian xem&rdquo; thay vì &ldquo;có click hay
          không&rdquo;. Trải nghiệm thay đổi chỉ sau vài tuần chạy thử.
        </p>

        <Callout variant="warning" title="Bẫy lớn nhất: dùng nhầm loss">
          Dùng MSE cho bài toán ranking = ép mô hình học con số rating
          tuyệt đối. Nhưng người dùng không &ldquo;cảm&rdquo; được
          khoảng cách giữa rating 7.8 và 8.3 — họ chỉ biết &ldquo;video
          này hay hơn video kia&rdquo;. Pairwise loss học chính xác cái
          thứ tự đó.
        </Callout>
      </ApplicationProblem>

      {/* ═════════════ MECHANISM ═════════════ */}
      <ApplicationMechanism
        parentTitleVi="Hàm mất mát"
        topicSlug="loss-functions-in-recommendation"
      >
        <Beat step={1}>
          <p>
            <strong>MSE / RMSE — kỷ nguyên Netflix Prize (2006-2009).</strong>{" "}
            Netflix mở cuộc thi 1 triệu đô với metric là RMSE trên rating
            1-5 sao. Toàn ngành học bằng MSE trong 3 năm. Kết quả: bài
            báo thắng giải dùng tới 107 mô hình gộp lại, nhưng khi triển
            khai thật thì Netflix không dùng — vì metric tối ưu (RMSE
            trên sao) không phải thứ người xem quan tâm. Khách hàng
            không nhập sao, họ ấn play.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>Pairwise loss (BPR — Bayesian Personalized Ranking,
            2009).</strong> Rendle và cộng sự đề xuất: thay vì dự đoán
            số, hãy cho mô hình học từ cặp &ldquo;A được click, B không
            được click&rdquo;. Hàm mất mát phạt khi mô hình chấm A ≤ B.
            Không cần rating rõ ràng — chỉ cần biết &ldquo;user thích A
            hơn B&rdquo;. Đây là nền tảng của gần như mọi hệ gợi ý hiện
            đại với phản hồi ngầm.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>Listwise / LambdaRank (Microsoft, 2010).</strong>{" "}
            Burges et al. chỉ ra: pairwise đối xử mọi cặp như nhau,
            nhưng lỗi ở top 1-3 tệ hơn lỗi ở vị trí 18-20. LambdaRank
            đưa thêm <em>trọng số NDCG</em> vào gradient — phạt mạnh
            hơn khi lỗi xảy ra ở đỉnh bảng. Đây chính là thuật toán phía
            sau Bing search rank và lan ra hầu hết hệ gợi ý lớn.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>YouTube: weighted logistic regression với
            watch-time.</strong> Trong paper RecSys 2016, Covington đưa
            ra cách &ldquo;mượn&rdquo; logistic regression để tối ưu thời
            gian xem: mỗi ví dụ positive được nhân trọng số bằng số giây
            đã xem. Loss function vẫn là cross-entropy, nhưng trọng số
            biến nó thành &ldquo;xác suất người dùng sẽ xem bao lâu&rdquo;.
            Kết quả: video clickbait bị hạ rank vì ai nhấp cũng thoát
            nhanh, trọng số thấp.
          </p>
        </Beat>
        <Beat step={5}>
          <p>
            <strong>TikTok Monolith (2022) — multi-task loss.</strong>{" "}
            ByteDance công bố: For You không chỉ tối ưu một mục tiêu.
            Mô hình có nhiều đầu ra (đã xem hết, like, comment, share)
            và cộng nhiều loss lại với trọng số riêng. Skip nhanh =
            tín hiệu negative mạnh, like = positive mạnh, share = cực
            mạnh. Cùng lúc tối ưu tất cả &rArr; ranking phản ánh nhiều
            dạng hài lòng hơn.
          </p>
        </Beat>
        <Beat step={6}>
          <p>
            <strong>Shopee & Spotify — cùng một công thức.</strong>{" "}
            Shopee tối ưu xác suất mua (không phải click) với loss có
            trọng số doanh thu. Spotify Discover Weekly kết hợp
            collaborative filtering (gần như pairwise) với CNN phân tích
            phổ âm thanh. Dù app khác nhau, ý tưởng trung tâm đều giống:
            chọn loss phản ánh đúng giá trị thực sự muốn tối ưu, không
            phải một tín hiệu thay thế dễ đo.
          </p>
        </Beat>
      </ApplicationMechanism>

      {/* ═════════════ CORE INTERACTIVE — Live Scorer ═════════════ */}
      <section className="mb-12 rounded-2xl border-2 border-accent/30 bg-accent-light/30 p-5 space-y-5">
        <div className="flex items-center gap-2">
          <Eye size={20} className="text-accent" />
          <h3 className="text-lg font-bold text-foreground">
            Live scorer: cùng một người dùng, đổi loss &rArr; top 10 đổi
          </h3>
        </div>

        <p className="text-sm text-muted leading-relaxed">
          Dưới đây là <strong>Minh</strong> — 20 tuổi, Sài Gòn. Lịch sử
          xem: bóng rổ NBA, lo-fi ôn bài, podcast tuổi trẻ. Mô hình đã
          chấm điểm 10 video ứng viên theo từng loss. Bấm vào ba thẻ
          loss bên dưới để xem <strong>cùng 10 video</strong> được sắp
          xếp lại khác nhau thế nào.
        </p>

        {/* User history strip */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold text-tertiary uppercase tracking-wide mb-2">
            Lịch sử xem gần nhất của Minh (được mô hình dùng làm ngữ cảnh)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {USER_HISTORY.map((h) => (
              <span
                key={h.title}
                className="flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] text-foreground/80"
              >
                <PlayCircle size={10} className="text-tertiary" />
                <span className="truncate max-w-[180px]">{h.title}</span>
                <span className="text-[9px] text-tertiary uppercase">
                  {h.type}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Loss picker */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {(Object.keys(LOSS_META) as LossKey[]).map((key) => {
            const meta = LOSS_META[key];
            const Icon = meta.icon;
            const active = activeLoss === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleLoss(key)}
                className={`text-left rounded-xl border-2 p-3 transition-all ${
                  active
                    ? "shadow-md"
                    : "border-border bg-card hover:bg-surface"
                }`}
                style={{
                  borderColor: active ? meta.color : undefined,
                  backgroundColor: active ? meta.color + "15" : undefined,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={14} style={{ color: meta.color }} />
                  <span
                    className="text-xs font-bold"
                    style={{ color: meta.color }}
                  >
                    {meta.labelShort}
                  </span>
                </div>
                <p className="text-[11px] text-foreground/80 leading-snug">
                  {meta.tagline}
                </p>
              </button>
            );
          })}
        </div>

        {/* Ranked list — animates when loss changes */}
        <div className="rounded-xl border border-border bg-background p-3">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-semibold text-foreground">
              Top 10 gợi ý cho Minh
            </span>
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{
                color: LOSS_META[activeLoss].color,
                backgroundColor: LOSS_META[activeLoss].color + "20",
              }}
            >
              loss: {LOSS_META[activeLoss].labelShort}
            </span>
          </div>

          <div className="space-y-1.5">
            <AnimatePresence initial={false}>
              {ranked.map((c, idx) => {
                const Icon = c.icon;
                const score = c[LOSS_META[activeLoss].scoreField];
                const isHovered = hovered === c.id;
                return (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{
                      layout: { type: "spring", stiffness: 250, damping: 28 },
                      opacity: { duration: 0.2 },
                    }}
                    onMouseEnter={() => setHovered(c.id)}
                    onMouseLeave={() => setHovered(null)}
                    className={`flex items-center gap-3 rounded-lg border p-2.5 ${
                      isHovered
                        ? "border-accent/60 bg-accent-light/40"
                        : "border-border bg-card"
                    }`}
                  >
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full font-bold text-xs shrink-0 tabular-nums"
                      style={{
                        color: idx < 3 ? "#fff" : LOSS_META[activeLoss].color,
                        backgroundColor:
                          idx < 3
                            ? LOSS_META[activeLoss].color
                            : LOSS_META[activeLoss].color + "15",
                      }}
                    >
                      #{idx + 1}
                    </span>
                    <Icon
                      size={16}
                      style={{ color: c.topicColor }}
                      className="shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {c.title}
                      </p>
                      <p className="text-[11px] text-tertiary truncate">
                        {c.author} ·{" "}
                        <span style={{ color: c.topicColor }}>{c.topic}</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end shrink-0 w-[88px]">
                      <span className="text-[10px] text-tertiary uppercase tracking-wide">
                        score
                      </span>
                      <span
                        className="text-sm font-bold tabular-nums"
                        style={{ color: LOSS_META[activeLoss].color }}
                      >
                        {score.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex flex-col items-end shrink-0 w-[80px]">
                      <span className="text-[10px] text-tertiary uppercase tracking-wide">
                        thật sự
                      </span>
                      <span className="text-sm font-bold tabular-nums text-foreground/80">
                        {c.trueRelevance.toFixed(1)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Metric strip */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetricTile
            label="NDCG@10"
            value={ndcg10.toFixed(3)}
            hint="1.000 = sắp xếp hoàn hảo"
            color={LOSS_META[activeLoss].color}
          />
          <MetricTile
            label="Mức độ phù hợp trung bình top 3"
            value={avgTrueTop3.toFixed(2)}
            hint="Điểm sở thích thật 0–10"
            color={LOSS_META[activeLoss].color}
          />
          <MetricTile
            label="Clickbait ở top 3?"
            value={
              ranked
                .slice(0, 3)
                .some((c) => c.topic === "Clickbait")
                ? "CÓ"
                : "KHÔNG"
            }
            hint="Clickbait = click cao, rời sớm"
            color={
              ranked.slice(0, 3).some((c) => c.topic === "Clickbait")
                ? "#ef4444"
                : "#10b981"
            }
          />
        </div>

        <Callout variant="insight" title="Quan sát chìa khoá">
          Thử ba loss. Chú ý: với <strong>MSE</strong>, clickbait lọt
          top 3 và NDCG@10 thấp nhất. Với <strong>pairwise</strong>,
          clickbait bị đẩy xuống cuối bảng. Với <strong>listwise</strong>,
          top 3 toàn video bóng rổ và lo-fi đúng gu Minh. Cùng một mô
          hình, khác loss &rArr; khác trải nghiệm.
        </Callout>
      </section>

      {/* ═════════════ DEEPEN — ToggleCompare ═════════════ */}
      <section className="mb-12 space-y-5">
        <div className="flex items-center gap-2">
          <Scale size={18} className="text-accent" />
          <h3 className="text-base font-semibold text-foreground">
            So sánh cận cảnh: pointwise (MSE) vs pairwise (A &gt; B) vs
            listwise
          </h3>
        </div>
        <p className="text-sm text-muted leading-relaxed">
          Ba loss xử lý <em>cùng một cặp dữ liệu</em> rất khác nhau.
          Cùng một video A được click và video B bị lướt qua — mỗi loss
          tạo ra một tín hiệu học khác biệt. Bấm qua lại để thấy cùng
          một cặp, ba góc nhìn khác nhau.
        </p>

        <ToggleCompare
          labelA="Pointwise (MSE)"
          labelB="Pairwise (BPR)"
          description="Cùng dữ liệu: Minh click video A (bóng rổ), lướt bỏ video B (clickbait). Hai loss xử lý ra sao?"
          childA={<PointwiseDetail />}
          childB={<PairwiseDetail />}
        />

        <ToggleCompare
          labelA="Pairwise (BPR)"
          labelB="Listwise (NDCG / LambdaRank)"
          description="Cả hai đều quan tâm thứ tự. Nhưng listwise phạt nặng hơn khi lỗi nằm ở top — đúng với trải nghiệm người dùng."
          childA={<PairwiseTopView />}
          childB={<ListwiseTopView />}
        />
      </section>

      {/* ═════════════ DEEPEN — StepReveal ═════════════ */}
      <section className="mb-12 space-y-5">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Layers size={16} className="text-accent" />
          Cùng câu chuyện: Minh click A, lướt B — theo từng loss
        </h3>
        <p className="text-sm text-muted leading-relaxed">
          Bốn bước dưới đây mô tả cùng một lần cập nhật mô hình. Mỗi
          bước cho thấy loss đang yêu cầu điều gì.
        </p>

        <StepReveal
          labels={[
            "Bước 1: Thu thập cặp",
            "Bước 2: MSE ra lệnh",
            "Bước 3: Pairwise ra lệnh",
            "Bước 4: Listwise ra lệnh",
          ]}
        >
          {[
            <StepCollect key="s1" />,
            <StepMSE key="s2" />,
            <StepPair key="s3" />,
            <StepList key="s4" />,
          ]}
        </StepReveal>
      </section>

      {/* ═════════════ METRICS ═════════════ */}
      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="loss-functions-in-recommendation"
      >
        <Metric
          value="YouTube chuyển từ CTR loss sang weighted cross-entropy với trọng số watch-time đã loại bỏ hiệu quả clickbait khỏi top gợi ý"
          sourceRef={1}
        />
        <Metric
          value="TikTok Monolith (2022) dùng multi-task loss kết hợp nhiều mục tiêu: view, like, comment, share với trọng số riêng cho mỗi tín hiệu"
          sourceRef={2}
        />
        <Metric
          value="BPR pairwise loss (Rendle 2009) trở thành chuẩn mực cho hệ gợi ý với phản hồi ngầm — được trích dẫn hơn 10.000 lần"
          sourceRef={3}
        />
        <Metric
          value="LambdaRank (Microsoft 2010) chèn trọng số NDCG vào gradient, phạt mạnh hơn khi lỗi ở top — nền tảng của Bing search và nhiều hệ ranking"
          sourceRef={4}
        />
        <Metric
          value="YouTube phục vụ hơn 1 tỉ giờ xem mỗi ngày; thời gian xem trung bình trên mobile vượt 60 phút/người/ngày nhờ ranking được tinh chỉnh liên tục"
          sourceRef={5}
        />
        <Metric
          value="Neural collaborative filtering (He 2017) cho thấy thay pointwise bằng pairwise loss cải thiện HR@10 và NDCG@10 từ 3–8% trên dataset MovieLens và Pinterest"
          sourceRef={6}
        />
        <Metric
          value="Khung RankNet → LambdaRank → LambdaMART của Microsoft là lộ trình tiêu chuẩn: từ pairwise đến listwise, mỗi bước cải thiện metric top-K"
          sourceRef={7}
        />
      </ApplicationMetrics>

      {/* ═════════════ TRY IT — InlineChallenge + MiniSummary ═════════════ */}
      <ApplicationTryIt topicSlug="loss-functions-in-recommendation">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Bốn tình huống sát thực tế. Trả lời để chắc bạn đã nắm được:
          <em> khi nào chọn loss nào, và vì sao</em>.
        </p>

        <div className="space-y-4">
          <InlineChallenge
            question="Minh click video A (bóng rổ) và lướt bỏ video B (clickbait) chỉ sau 2 giây. Hàm mất mát nên thưởng mô hình điều gì?"
            options={[
              "Thưởng vì đoán đúng con số rating của cả A và B (học điểm chính xác)",
              "Thưởng vì đặt A cao hơn B trong danh sách — ngay cả khi không biết rating chính xác",
              "Thưởng vì dự đoán nhiều click cho cả hai video",
              "Không cần thưởng gì — lướt 2 giây là tín hiệu yếu, bỏ qua",
            ]}
            correct={1}
            explanation="Chính là ý tưởng của pairwise loss (BPR). Minh không gắn sao cho A hay B — chỉ có tín hiệu ngầm 'A được click / B bị lướt'. Pairwise loss chỉ cần: mô hình đặt A > B. Watch-time ngắn của B còn là tín hiệu negative rõ ràng — giúp phân biệt clickbait với nội dung thật sự hấp dẫn. Đây là lý do pairwise thay thế MSE ở gần như mọi hệ gợi ý hiện đại."
          />

          <InlineChallenge
            question="Bạn là kỹ sư Shopee, cần chọn loss cho mô hình xếp hạng sản phẩm ở 'Gợi ý cho bạn'. Shopee kiếm tiền khi người dùng MUA (không phải chỉ click). Loss nào phù hợp nhất?"
            options={[
              "MSE thuần túy trên số lượng click",
              "Binary cross-entropy chỉ trên tín hiệu click",
              "Weighted loss — mỗi ví dụ positive được nhân trọng số bằng giá trị đơn hàng, hoặc multi-task loss kết hợp click + mua",
              "Không cần loss — dùng quy tắc: sản phẩm rẻ nhất lên đầu",
            ]}
            correct={2}
            explanation="Đây là bài học trực tiếp từ YouTube (watch-time) áp dụng cho e-commerce. Click không phải mục tiêu cuối — mua mới là. Nếu loss chỉ tối ưu click, sản phẩm click-bait (ảnh hấp dẫn, nội dung kém) lên top. Trọng số theo giá trị đơn hàng (hoặc multi-task với click + add-to-cart + purchase) làm loss phản ánh đúng thứ Shopee muốn tối ưu. TikTok Monolith dùng công thức tương tự với nhiều tín hiệu song song."
          />

          <InlineChallenge
            question="Trong danh sách 10 gợi ý, mô hình A đặt video hay nhất ở vị trí #1 nhưng video dở ở #5. Mô hình B đặt video hay nhất ở #3 nhưng toàn bộ #1-#5 đều ổn. Loss nào sẽ chấm mô hình A cao hơn mô hình B?"
            options={[
              "MSE (pointwise) — vì A đoán số cụ thể chính xác hơn",
              "Pairwise — vì A có ít lỗi cặp hơn",
              "Listwise / NDCG-aware — vì NDCG phạt mạnh hơn ở vị trí cao, mà A đặt video hay nhất ở #1",
              "Cả ba cho cùng kết quả",
            ]}
            correct={2}
            explanation="Đây chính là điểm mạnh của listwise. NDCG có hệ số giảm dần theo vị trí (1/log(rank+1)) — nên đặt đúng ở #1 giá trị gấp đôi đặt đúng ở #5. Pairwise đối xử mọi cặp bằng nhau nên có thể không phân biệt rõ. MSE còn tệ hơn vì chỉ nhìn khoảng cách số. LambdaRank (Microsoft 2010) sinh ra để sửa chính điều này: nhét trọng số NDCG thẳng vào gradient."
          />

          <InlineChallenge
            question="Spotify muốn gợi ý bài hát mà người dùng sẽ nghe HẾT (không bỏ ngang). Bạn có tín hiệu 'played > 30s' (positive) và 'skipped < 5s' (negative). Loss nào tự nhiên nhất?"
            options={[
              "MSE trên số giây nghe — ép mô hình đoán chính xác thời lượng",
              "BPR pairwise với positive = played-through, negative = skipped; có thể cộng thêm weighted loss theo thời gian nghe",
              "Dùng accuracy (tỉ lệ đoán đúng label nhị phân) làm loss trực tiếp",
              "Không cần loss vì Spotify đã biết bài nào hay",
            ]}
            correct={1}
            explanation="Spotify và TikTok đều dùng cách tiếp cận này: tín hiệu ngầm (skip vs play-through) làm nền cho pairwise. Cộng thêm trọng số watch-time (hoặc listen-time) cho loss = trực tiếp tối ưu 'người dùng nghe bao lâu'. MSE trên số giây cụ thể gặp vấn đề vì user không 'cảm' khoảng cách giữa 45s và 48s. Accuracy không được dùng làm loss vì nó không có gradient mượt — mô hình không học được từ nó."
          />
        </div>

        <div className="mt-6 space-y-4">
          <Callout variant="tip" title="Quy tắc thực chiến — chọn loss đúng">
            Hỏi ba câu để chọn loss: (1) Người dùng <em>cảm được</em>{" "}
            con số dự đoán (rating, giá) hay chỉ cảm <em>thứ tự</em>{" "}
            (A tốt hơn B)? (2) Tín hiệu có phải nhị phân (click / không
            click) hay liên tục (watch-time, giá trị đơn hàng)?{" "}
            (3) Chất lượng top 3 quan trọng hơn top 10 không? Trả lời
            càng về &ldquo;thứ tự / liên tục / top nhỏ&rdquo; &rArr;
            càng nên đi về phía pairwise &rArr; listwise với trọng số.
          </Callout>

          <MiniSummary
            title="Bốn điều cần nhớ về loss trong hệ gợi ý"
            points={[
              "Loss function định nghĩa 'mô hình học điều gì'. Cùng data, khác loss &rArr; khác ranking — và khác trải nghiệm người dùng.",
              "MSE hợp với hồi quy có đáp án số thật (giá nhà). Trong recommendation, nó tối ưu nhầm — học con số thay vì học thứ tự.",
              "Pairwise loss (BPR) chỉ cần tín hiệu ngầm 'A click, B skip' — đủ để học sắp xếp đúng. Đây là chuẩn mực từ 2009 đến nay.",
              "Listwise (LambdaRank, NDCG) phạt mạnh lỗi ở top — đúng với trải nghiệm: người ta chỉ nhìn top 3-10. Đây là thứ YouTube, TikTok, Shopee đang tối ưu thật.",
              "Câu chuyện YouTube chuyển từ CTR-loss sang watch-time-weighted loss là minh chứng kinh điển: loss function không phải chi tiết kỹ thuật, nó quyết định chất lượng sản phẩm.",
            ]}
          />
        </div>
      </ApplicationTryIt>

      {/* ═════════════ COUNTERFACTUAL ═════════════ */}
      <ApplicationCounterfactual
        parentTitleVi="Hàm mất mát"
        topicSlug="loss-functions-in-recommendation"
      >
        <p>
          Nếu Shopee, TikTok, Spotify, YouTube đều giữ nguyên MSE trên
          rating, trang chủ của bạn hôm nay sẽ rất khác. Video clickbait
          sẽ tràn ngập Up Next vì chúng nhận nhiều click. Playlist
          Discover Weekly sẽ chỉ có bài phổ biến nhất thay vì bài phù
          hợp với gu bạn. &ldquo;Gợi ý cho bạn&rdquo; Shopee sẽ đầy sản
          phẩm rẻ nhất thay vì sản phẩm bạn thật sự muốn.
        </p>
        <p>
          Câu chuyện lớn hơn: <strong>loss function không phải chi
          tiết kỹ thuật</strong>. Nó là quyết định sản phẩm quan trọng
          bậc nhất của hệ gợi ý. Chuyển từ MSE sang pairwise sang
          listwise-with-watch-time không thay đổi lượng dữ liệu, không
          đổi kiến trúc mạng, không cần GPU mạnh hơn — nhưng thay đổi
          hoàn toàn thứ mô hình được thưởng vì học. Và mô hình học gì
          thì trải nghiệm bạn có sẽ là vậy.
        </p>

        <div className="not-prose mt-4 flex items-start gap-3 rounded-lg border border-accent/30 bg-accent-light/30 p-4">
          <Sparkles size={16} className="text-accent shrink-0 mt-0.5" />
          <p className="text-xs text-foreground leading-relaxed">
            Tương tự với mọi ML system: bạn đo gì là thứ bạn tối ưu.
            Nếu metric đánh giá và loss function khác nhau, mô hình sẽ
            giỏi ở metric và dở ở trải nghiệm thật. Một trong những kỹ
            năng quan trọng nhất của kỹ sư ML là <em>biết loss đang
            thực sự tối ưu cái gì</em> — và điều đó có khớp với mục
            tiêu sản phẩm không.
          </p>
        </div>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}

/* ════════════════════════════════════════════════════════════
   SUB-COMPONENT — Metric tile cho live scorer
   ════════════════════════════════════════════════════════════ */

function MetricTile({
  label,
  value,
  hint,
  color,
}: {
  label: string;
  value: string;
  hint: string;
  color: string;
}) {
  return (
    <div
      className="rounded-xl border-2 bg-card p-4 space-y-1"
      style={{ borderColor: color + "50" }}
    >
      <p className="text-[11px] uppercase tracking-wide text-tertiary font-semibold">
        {label}
      </p>
      <motion.p
        key={value}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold tabular-nums"
        style={{ color }}
      >
        {value}
      </motion.p>
      <p className="text-[10px] text-tertiary italic leading-snug">{hint}</p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SUB-COMPONENTS — ToggleCompare children (pointwise / pairwise)
   ════════════════════════════════════════════════════════════ */

function PointwiseDetail() {
  const A = { title: "Phân tích Curry 3 điểm", predicted: 6.1, truth: 9.2 };
  const B = { title: "CLICKBAIT: 10 bí ẩn...", predicted: 7.9, truth: 1.5 };
  const aError = Math.pow(A.predicted - A.truth, 2);
  const bError = Math.pow(B.predicted - B.truth, 2);
  return (
    <div className="space-y-3">
      <p className="text-sm text-foreground leading-relaxed">
        MSE bắt mô hình đoán <strong>con số điểm</strong>. Nhưng số
        không phải thứ Minh cảm — Minh chỉ click A và lướt B. Kết quả:
        MSE phạt nặng vì mô hình đoán lệch số, dù thứ tự có thể đúng
        hoặc sai.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <VideoCard
          title={A.title}
          predicted={A.predicted}
          truth={A.truth}
          error={aError}
          color="#10b981"
          verdict="Minh click và xem hết"
          icon={ThumbsUp}
        />
        <VideoCard
          title={B.title}
          predicted={B.predicted}
          truth={B.truth}
          error={bError}
          color="#ef4444"
          verdict="Minh lướt sau 2s"
          icon={ThumbsDown}
        />
      </div>
      <div className="rounded-lg bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 p-3">
        <p className="text-xs text-sky-800 dark:text-sky-300 leading-relaxed">
          <strong>MSE loss = {((aError + bError) / 2).toFixed(2)}.</strong>{" "}
          Mô hình bị phạt vì sai số lớn, <em>đặc biệt</em> ở B (dự đoán
          7.9 nhưng thật chỉ 1.5). Nhưng để ý: MSE không cho mô hình
          biết &ldquo;A nên xếp trên B&rdquo; — nó chỉ đòi con số
          chính xác. Nếu hai video cùng có rating thật là 5.0 nhưng
          Minh click một và skip một, MSE không học được gì từ cặp đó.
        </p>
      </div>
    </div>
  );
}

function PairwiseDetail() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-foreground leading-relaxed">
        BPR pairwise chỉ hỏi một câu: &ldquo;Mô hình có đặt A (click)
        cao hơn B (skip) không?&rdquo; Không cần số, không cần rating
        — chỉ cần thứ tự. Loss là hàm sigmoid của chênh lệch điểm giữa
        A và B.
      </p>
      <div className="rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 p-4 space-y-3">
        <div className="flex items-center justify-center gap-3 text-sm">
          <span className="rounded-full bg-white dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 px-3 py-1.5 font-semibold text-emerald-800 dark:text-emerald-300">
            A: Phân tích Curry
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white font-bold">
            &gt;
          </span>
          <span className="rounded-full bg-white dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 px-3 py-1.5 font-semibold text-emerald-800 dark:text-emerald-300">
            B: Clickbait
          </span>
        </div>
        <p className="inline-flex items-center justify-center gap-1 w-full text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed text-center">
          <Check size={12} aria-hidden="true" />
          Mô hình đoán score(A) = 9.0 và score(B) = 2.3 &rArr; chênh
          +6.7 &rArr; đúng thứ tự &rArr; <strong>loss rất thấp</strong>.
        </p>
      </div>
      <div className="rounded-lg bg-accent-light/40 border border-accent/30 p-3">
        <p className="text-xs text-foreground leading-relaxed">
          <strong>Điều quan trọng:</strong> BPR không quan tâm score
          tuyệt đối là 9 hay 90. Nó chỉ cần chênh lệch dương giữa A
          và B. Điều này khớp chính xác với cái Minh trải nghiệm: Minh
          không cảm rating, Minh chỉ biết &ldquo;video này hay hơn
          video kia&rdquo;. Đây là lý do pairwise thay thế MSE gần như
          toàn bộ ngành recommendation sau 2009.
        </p>
      </div>
    </div>
  );
}

function WeightChart({
  intro,
  outro,
  boxClass,
  barClass,
  labelClass,
  weights,
  animate,
}: {
  intro: React.ReactNode;
  outro: string;
  boxClass: string;
  barClass: string;
  labelClass: string;
  weights: { rank: number; weight: number }[];
  animate: boolean;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-foreground leading-relaxed">{intro}</p>
      <div className={`rounded-xl border p-4 space-y-2 ${boxClass}`}>
        <p className="text-xs font-semibold text-foreground mb-2">Trọng số phạt theo vị trí:</p>
        {weights.map((c) => (
          <div key={c.rank} className="flex items-center gap-3">
            <span className="w-14 text-xs text-tertiary tabular-nums">Vị trí #{c.rank}</span>
            <div className="flex-1 h-4 rounded-full bg-surface overflow-hidden">
              {animate ? (
                <motion.div
                  className={`h-full ${barClass}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${c.weight * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              ) : (
                <div className={`h-full ${barClass}`} style={{ width: `${c.weight * 100}%` }} />
              )}
            </div>
            <span className={`w-12 text-xs font-bold tabular-nums ${labelClass}`}>{c.weight.toFixed(2)}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted italic leading-relaxed">{outro}</p>
    </div>
  );
}

function PairwiseTopView() {
  return (
    <WeightChart
      intro={
        <>
          Pairwise loss đối xử mọi cặp bằng nhau. Đặt video hay ở vị trí #1 hay #20 thì
          gradient như nhau. Nhưng người dùng thực tế chỉ nhìn top 3-10 — lỗi ở đầu bảng là
          thảm họa.
        </>
      }
      outro="Mọi vị trí có trọng số 1.0 — mô hình không ưu tiên sửa lỗi ở top trước."
      boxClass="border-border bg-card"
      barClass="bg-emerald-400"
      labelClass="text-emerald-700 dark:text-emerald-300"
      animate={false}
      weights={[
        { rank: 1, weight: 1.0 },
        { rank: 2, weight: 1.0 },
        { rank: 10, weight: 1.0 },
        { rank: 15, weight: 1.0 },
        { rank: 20, weight: 1.0 },
      ]}
    />
  );
}

function ListwiseTopView() {
  return (
    <WeightChart
      intro={
        <>
          Listwise (LambdaRank / NDCG-aware) chèn trọng số{" "}
          <strong>1/log₂(rank+1)</strong> vào gradient. Vị trí #1 được ưu tiên gấp 4 lần vị
          trí #20. Mô hình được &ldquo;kéo&rdquo; tập trung sửa sai số ở đỉnh bảng.
        </>
      }
      outro="Trọng số giảm mạnh theo vị trí — mô hình ưu tiên xếp đúng top 3 hơn là vị trí 15-20. Đây chính là cái YouTube, TikTok, Shopee đang tối ưu thực tế."
      boxClass="border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-900/20"
      barClass="bg-amber-400"
      labelClass="text-amber-700 dark:text-amber-300"
      animate
      weights={[
        { rank: 1, weight: 1.0 },
        { rank: 2, weight: 0.63 },
        { rank: 3, weight: 0.5 },
        { rank: 5, weight: 0.39 },
        { rank: 10, weight: 0.29 },
        { rank: 20, weight: 0.23 },
      ]}
    />
  );
}

/* ════════════════════════════════════════════════════════════
   SUB-COMPONENT — VideoCard cho PointwiseDetail
   ════════════════════════════════════════════════════════════ */

function VideoCard({
  title,
  predicted,
  truth,
  error,
  color,
  verdict,
  icon: Icon,
}: {
  title: string;
  predicted: number;
  truth: number;
  error: number;
  color: string;
  verdict: string;
  icon: typeof ThumbsUp;
}) {
  return (
    <div
      className="rounded-xl border-2 p-3 bg-card space-y-2"
      style={{ borderColor: color + "50" }}
    >
      <p className="text-xs font-semibold text-foreground truncate">
        {title}
      </p>
      <div className="flex items-center gap-1 text-[11px] text-foreground/80">
        <Icon size={12} style={{ color }} />
        <span>{verdict}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-md bg-surface/60 p-2">
          <p className="text-tertiary uppercase tracking-wide">Dự đoán</p>
          <p className="font-bold text-foreground tabular-nums">
            {predicted.toFixed(2)}
          </p>
        </div>
        <div className="rounded-md bg-surface/60 p-2">
          <p className="text-tertiary uppercase tracking-wide">Thật</p>
          <p className="font-bold text-foreground tabular-nums">
            {truth.toFixed(2)}
          </p>
        </div>
      </div>
      <div
        className="rounded-md p-2 text-[11px] font-bold text-center"
        style={{ backgroundColor: color + "20", color }}
      >
        (dự đoán − thật)² = {error.toFixed(2)}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SUB-COMPONENTS — StepReveal steps (collect/MSE/Pair/List)
   ════════════════════════════════════════════════════════════ */

function StepNote({
  body,
  noteIcon: NoteIcon,
  note,
  toneBox,
  toneIcon,
  toneText,
  footer,
}: {
  body: React.ReactNode;
  noteIcon: typeof Target;
  note: React.ReactNode;
  toneBox: string;
  toneIcon: string;
  toneText: string;
  footer?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-5 space-y-3">
      <p className="text-sm text-foreground leading-relaxed">{body}</p>
      <div className={`rounded-lg border p-3 ${toneBox}`}>
        <div className="flex items-start gap-2">
          <NoteIcon size={14} className={`shrink-0 mt-0.5 ${toneIcon}`} />
          <p className={`text-xs leading-relaxed ${toneText}`}>{note}</p>
        </div>
      </div>
      {footer}
    </div>
  );
}

function StepCollect() {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-5 space-y-3">
      <p className="text-sm text-foreground leading-relaxed">
        Hệ thống log một cặp hành động: <strong>Minh click video A</strong> (bóng rổ, xem 4
        phút); <strong>Minh lướt video B</strong> (clickbait, rời sau 2 giây). Đây là dữ liệu
        &ldquo;phản hồi ngầm&rdquo; (implicit feedback). Không có ai gắn sao, không có rating
        rõ ràng.
      </p>
      <div className="rounded-lg border border-border bg-card p-3 space-y-2">
        <SignalRow
          icon={ThumbsUp}
          bg="bg-emerald-500"
          title="Video A: Phân tích Curry 3 điểm"
          sub="Click → xem 4 phút 12 giây → watch-through"
          tag="positive"
          tagClass="text-emerald-700 dark:text-emerald-300"
        />
        <SignalRow
          icon={SkipForward}
          bg="bg-red-500"
          title="Video B: Clickbait 10 bí ẩn"
          sub="Lướt sau 2 giây → không click chính thức"
          tag="negative"
          tagClass="text-red-700 dark:text-red-300"
        />
      </div>
    </div>
  );
}

function SignalRow({
  icon: Icon,
  bg,
  title,
  sub,
  tag,
  tagClass,
}: {
  icon: typeof ThumbsUp;
  bg: string;
  title: string;
  sub: string;
  tag: string;
  tagClass: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-white ${bg}`}>
        <Icon size={12} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground">{title}</p>
        <p className="text-[11px] text-tertiary">{sub}</p>
      </div>
      <span className={`text-[10px] uppercase tracking-wide font-bold ${tagClass}`}>{tag}</span>
    </div>
  );
}

function StepMSE() {
  return (
    <StepNote
      body={
        <>
          <strong>MSE nói:</strong> &ldquo;Mỗi video có một số rating thật. Mô hình phải đoán
          đúng số đó&rdquo;. Nhưng cặp dữ liệu trên không có rating. MSE phải giả lập &ldquo;click
          = 1.0, skip = 0.0&rdquo; rồi đoán khoảng giữa. Kết quả: loss không học được thứ tự,
          chỉ học tỉ lệ click.
        </>
      }
      noteIcon={Target}
      note={
        <>
          MSE bắt đoán con số &rArr; thường dẫn đến clickbait lên top. Vì CTR trung bình của
          clickbait cao (nhiều người click vì tò mò), mô hình thấy &ldquo;CTR cao = rating
          cao&rdquo; — dù thực tế hầu hết người click đều thoát ngay.
        </>
      }
      toneBox="bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800"
      toneIcon="text-sky-600 dark:text-sky-400"
      toneText="text-sky-800 dark:text-sky-300"
    />
  );
}

function StepPair() {
  return (
    <StepNote
      body={
        <>
          <strong>Pairwise (BPR) nói:</strong> &ldquo;Mô hình ơi, chỉ cần đặt A &gt; B. Bao
          nhiêu không quan trọng&rdquo;. Loss là sigmoid(score_A − score_B). Nếu mô hình đặt
          sai thứ tự, gradient đẩy score_A lên và score_B xuống. Cặp sai thứ tự càng
          &ldquo;nặng&rdquo; &rArr; gradient càng lớn.
        </>
      }
      noteIcon={GitCompare}
      note={
        <>
          Skip nhanh (2 giây) của Minh với clickbait là tín hiệu negative mạnh. Mô hình học
          ngay: &ldquo;không phải mọi click đều giống nhau&rdquo;. Watch-time ngắn &rArr; pair
          này được gán trọng số đặc biệt (như YouTube làm) &rArr; clickbait dần dần bị đẩy
          xuống.
        </>
      }
      toneBox="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
      toneIcon="text-emerald-600 dark:text-emerald-400"
      toneText="text-emerald-800 dark:text-emerald-300"
    />
  );
}

function StepList() {
  return (
    <StepNote
      body={
        <>
          <strong>Listwise (LambdaRank) nói:</strong> &ldquo;Tôi nhìn toàn bộ danh sách 10
          video. Lỗi ở top 3 quan trọng gấp 4 lần lỗi ở top 20&rdquo;. Gradient được nhân với
          trọng số NDCG — thay đổi nào làm NDCG tăng nhiều nhất sẽ nhận gradient lớn nhất.
          Đây là thứ đang chạy thật ở YouTube ranking, TikTok For You, Shopee search.
        </>
      }
      noteIcon={TrendingUp}
      note={
        <>
          Kết quả: top 3 của Minh = bóng rổ + lo-fi + bóng rổ. Không có clickbait, không có
          video lạc gu. Danh sách phản ánh đúng thứ tự ưu tiên thật. Đây là thứ bạn thấy mỗi
          lần mở trang chủ — và bây giờ bạn đã biết loss function nào đang làm điều đó.
        </>
      }
      toneBox="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
      toneIcon="text-amber-600 dark:text-amber-400"
      toneText="text-amber-800 dark:text-amber-300"
      footer={
        <div className="flex items-center justify-center gap-2 text-xs text-accent font-semibold">
          <Heart size={12} />
          <span>Hết lộ trình — Minh hạnh phúc, mô hình ngủ ngon.</span>
          <ArrowRight size={12} />
        </div>
      }
    />
  );
}
