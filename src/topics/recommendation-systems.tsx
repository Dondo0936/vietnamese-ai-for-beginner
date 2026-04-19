"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Film,
  Users,
  Package,
  Star,
  Store,
  Sparkles,
  UserPlus,
  Flame,
  HelpCircle,
  MousePointerClick,
  TrendingUp,
  Music2,
  Tv,
  ShoppingBag,
} from "lucide-react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  ToggleCompare,
  TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "recommendation-systems",
  title: "Recommendation Systems",
  titleVi: "Hệ thống gợi ý",
  description:
    "Shopee, Tiki, Netflix, Zing MP3 đều đang đoán sở thích của bạn bằng cùng một công thức. Bài này vẽ ra công thức đó cho dân văn phòng — không mã, không công thức toán.",
  category: "applied-ai",
  tags: ["recommendation", "ca-nhan-hoa", "van-phong", "shopee"],
  difficulty: "intermediate",
  relatedSlugs: ["embedding-model", "multi-armed-bandit", "k-means"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

/* ═══════════════════════════════════════════════════════════════════════════
   DEMO 1 — COLLABORATIVE FILTERING SIMULATOR
   4 người dùng × 5 bộ phim. Người học bấm "thêm đánh giá" cho chính mình,
   hệ thống suy ra phim chưa xem sẽ được rating bao nhiêu dựa trên người tương tự.
   ═══════════════════════════════════════════════════════════════════════════ */

type SimUser = { id: string; name: string; avatar: string; color: string };
type SimMovie = { id: string; title: string; tone: string; icon: string };

const SIM_USERS: SimUser[] = [
  { id: "an", name: "An", avatar: "A", color: "#10b981" },
  { id: "binh", name: "Bình", avatar: "B", color: "#f59e0b" },
  { id: "chi", name: "Chi", avatar: "C", color: "#a855f7" },
  { id: "dung", name: "Dũng", avatar: "D", color: "#ef4444" },
];

const SIM_MOVIES: SimMovie[] = [
  { id: "kiem", title: "Anh Hùng Xạ Điêu", tone: "Kiếm hiệp", icon: "⚔️" },
  { id: "ha", title: "Hàn Mặc Tử", tone: "Kiếm hiệp", icon: "🗡️" },
  { id: "hanh", title: "Lật Mặt 7", tone: "Hành động hài", icon: "💥" },
  { id: "lang", title: "Mắt Biếc", tone: "Lãng mạn", icon: "💐" },
  { id: "hai", title: "Nhà Bà Nữ", tone: "Hài gia đình", icon: "🎭" },
];

// Ratings đã có sẵn. null = chưa xem.
const SIM_INITIAL: Array<Array<number | null>> = [
  // phim:     kiem  ha    hanh  lang  hai
  /* An   */ [5, 5, 4, 2, 3],
  /* Bình */ [4, 5, 5, null, 2],
  /* Chi  */ [2, null, 3, 5, 5],
  /* Dũng */ [null, 2, 4, 4, 5],
];

// Tính cosine similarity kiểu rút gọn giữa 2 user dựa trên phim cả hai đã rate.
function simBetween(a: Array<number | null>, b: Array<number | null>): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  let overlap = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== null && b[i] !== null) {
      dot += (a[i] as number) * (b[i] as number);
      na += (a[i] as number) ** 2;
      nb += (b[i] as number) ** 2;
      overlap++;
    }
  }
  if (na === 0 || nb === 0 || overlap < 2) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// Dự đoán rating cho "Bạn" (hàng 5) trên 1 phim dựa vào trung bình có trọng
// số của 4 hàng xóm (AN, BÌNH, CHI, DŨNG).
function predictForYou(
  you: Array<number | null>,
  matrix: Array<Array<number | null>>,
  movieIdx: number
): { value: number; top: Array<{ userIdx: number; sim: number }> } {
  const sims = matrix.map((row, u) => ({ userIdx: u, sim: simBetween(you, row) }));
  sims.sort((a, b) => b.sim - a.sim);

  let num = 0;
  let den = 0;
  const top: Array<{ userIdx: number; sim: number }> = [];
  for (const s of sims.slice(0, 3)) {
    const r = matrix[s.userIdx][movieIdx];
    if (r === null || s.sim <= 0) continue;
    num += s.sim * r;
    den += s.sim;
    top.push(s);
  }
  if (den === 0) return { value: 0, top: [] };
  return { value: num / den, top };
}

function ratingColor(r: number | null): string {
  if (r === null) return "transparent";
  if (r >= 4.5) return "rgba(16, 185, 129, 0.85)";
  if (r >= 3.5) return "rgba(132, 204, 22, 0.8)";
  if (r >= 2.5) return "rgba(234, 179, 8, 0.8)";
  if (r >= 1.5) return "rgba(249, 115, 22, 0.8)";
  return "rgba(239, 68, 68, 0.85)";
}

function CFSimulator() {
  // "Bạn" là user thứ 5 — ban đầu chưa rate gì.
  const [you, setYou] = useState<Array<number | null>>([null, null, null, null, null]);
  const [hoverPrediction, setHoverPrediction] = useState<number | null>(null);

  const fullMatrix = [...SIM_INITIAL];

  const predictions = useMemo(() => {
    return SIM_MOVIES.map((_, movieIdx) => {
      if (you[movieIdx] !== null) return null;
      return predictForYou(you, fullMatrix, movieIdx);
    });
  }, [you]); // eslint-disable-line react-hooks/exhaustive-deps

  const ratedCount = you.filter((v) => v !== null).length;

  const setRating = useCallback((movieIdx: number, rating: number) => {
    setYou((prev) => {
      const next = [...prev];
      next[movieIdx] = next[movieIdx] === rating ? null : rating;
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setYou([null, null, null, null, null]);
    setHoverPrediction(null);
  }, []);

  const best = predictions
    .map((p, i) => (p ? { value: p.value, movieIdx: i } : null))
    .filter((x): x is { value: number; movieIdx: number } => x !== null)
    .sort((a, b) => b.value - a.value)[0];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-foreground">
            Giả lập một ngày ở Netflix thu nhỏ
          </h4>
          <p className="text-xs text-muted">
            Bạn chấm sao vài phim — hệ thống đoán ngay bạn sẽ thích phim còn lại bao nhiêu sao.
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground hover:bg-surface-hover"
        >
          Xóa đánh giá của bạn
        </button>
      </div>

      {/* Grid */}
      <div className="relative">
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="p-3 text-left text-xs font-semibold text-muted">
                Người xem
              </th>
              {SIM_MOVIES.map((m) => (
                <th key={m.id} className="p-3 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-lg" aria-hidden>
                      {m.icon}
                    </span>
                    <span className="text-[11px] font-semibold text-foreground">
                      {m.title}
                    </span>
                    <span className="text-[10px] text-tertiary">{m.tone}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SIM_USERS.map((u, uIdx) => (
              <tr key={u.id} className="border-b border-border/60">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: u.color }}
                    >
                      {u.avatar}
                    </div>
                    <span className="text-sm font-medium text-foreground">{u.name}</span>
                  </div>
                </td>
                {SIM_INITIAL[uIdx].map((r, mIdx) => (
                  <td key={mIdx} className="p-2">
                    <div
                      className="flex h-10 items-center justify-center rounded-md text-sm font-semibold text-slate-900 dark:text-slate-900"
                      style={{
                        background: r === null ? "transparent" : ratingColor(r),
                        border: r === null ? "1px dashed rgba(148,163,184,0.4)" : "none",
                      }}
                    >
                      {r === null ? (
                        <span className="text-[11px] text-tertiary">chưa xem</span>
                      ) : (
                        <span>{r}★</span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
            {/* Hàng "Bạn" */}
            <tr className="bg-accent-light/40">
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                    Bạn
                  </div>
                  <span className="text-sm font-semibold text-foreground">Bạn</span>
                </div>
              </td>
              {SIM_MOVIES.map((m, mIdx) => {
                const myRating = you[mIdx];
                const pred = predictions[mIdx];
                const isHovering = hoverPrediction === mIdx;
                return (
                  <td key={m.id} className="p-2">
                    {myRating !== null ? (
                      <motion.div
                        layout
                        className="flex h-10 flex-col items-center justify-center rounded-md text-sm font-semibold text-slate-900"
                        style={{ background: ratingColor(myRating) }}
                      >
                        <span>{myRating}★</span>
                      </motion.div>
                    ) : pred && pred.top.length > 0 && ratedCount >= 2 ? (
                      <button
                        type="button"
                        onMouseEnter={() => setHoverPrediction(mIdx)}
                        onMouseLeave={() => setHoverPrediction(null)}
                        className="flex h-10 w-full flex-col items-center justify-center rounded-md border border-dashed"
                        style={{
                          borderColor: isHovering ? "#0ea5e9" : "rgba(14,165,233,0.35)",
                          background: `${ratingColor(pred.value)}20`,
                        }}
                      >
                        <span className="text-[11px] text-accent font-semibold">
                          đoán ≈ {pred.value.toFixed(1)}★
                        </span>
                      </button>
                    ) : (
                      <div className="flex h-10 flex-col items-center justify-center gap-1">
                        {[1, 3, 5].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setRating(mIdx, val)}
                            className="text-[10px] rounded px-1.5 py-0.5 text-muted hover:bg-accent-light hover:text-accent transition-colors"
                          >
                            {val}★
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-10 rounded-r-xl bg-gradient-to-l from-[var(--bg-card)] to-transparent md:hidden"
        />
      </div>

      {/* Legend + instruction */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-surface p-3">
          <div className="text-[11px] uppercase tracking-wide text-muted mb-2">
            Bước 1
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            Bấm <strong>1★, 3★ hoặc 5★</strong> ở vài phim bạn đã xem. Mỗi cú bấm là một tín hiệu bạn dạy hệ thống.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-3">
          <div className="text-[11px] uppercase tracking-wide text-muted mb-2">
            Bước 2
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            Khi có đủ 2 đánh giá, hàng của bạn xuất hiện <strong>ô xanh nhạt với &quot;đoán ≈ ...★&quot;</strong> cho các phim còn lại.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-3">
          <div className="text-[11px] uppercase tracking-wide text-muted mb-2">
            Bước 3
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            Rê chuột lên ô đoán để xem <strong>những ai &quot;giống bạn nhất&quot;</strong> đã chấm phim đó mấy sao.
          </p>
        </div>
      </div>

      {/* Neighbor reveal */}
      <AnimatePresence>
        {hoverPrediction !== null && predictions[hoverPrediction] && (
          <motion.div
            key={hoverPrediction}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="rounded-lg border border-sky-300/60 bg-sky-50 dark:bg-sky-900/20 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} className="text-sky-600 dark:text-sky-400" />
              <span className="text-sm font-semibold text-foreground">
                Hệ thống dựa vào ai để đoán &quot;{SIM_MOVIES[hoverPrediction].title}&quot;?
              </span>
            </div>
            <div className="space-y-1.5">
              {predictions[hoverPrediction]!.top.map((n) => {
                const u = SIM_USERS[n.userIdx];
                const theirRating = SIM_INITIAL[n.userIdx][hoverPrediction];
                const pct = Math.round(n.sim * 100);
                return (
                  <div key={u.id} className="flex items-center gap-2 text-sm">
                    <div
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: u.color }}
                    >
                      {u.avatar}
                    </div>
                    <span className="text-foreground">{u.name}</span>
                    <span className="text-xs text-muted">
                      giống bạn {pct}% · chấm phim này{" "}
                      <strong className="text-foreground">{theirRating}★</strong>
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted mt-2 leading-relaxed">
              Trung bình có trọng số của các rating trên → {predictions[hoverPrediction]!.value.toFixed(2)} ★. Người giống bạn hơn được tính nặng hơn.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {ratedCount >= 2 && best && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-lg border border-emerald-300/60 bg-emerald-50 dark:bg-emerald-900/20 p-3 text-sm text-foreground"
        >
          <span className="font-semibold text-emerald-700 dark:text-emerald-300">
            Gợi ý số 1 cho bạn:
          </span>{" "}
          &quot;{SIM_MOVIES[best.movieIdx].title}&quot; — đoán{" "}
          {best.value.toFixed(1)}★.
        </motion.div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DEMO 2 — CONTENT-BASED VS COLLABORATIVE (ToggleCompare)
   Cùng một user, 2 công thức gợi ý khác nhau, kết quả nhìn khác hẳn.
   ═══════════════════════════════════════════════════════════════════════════ */

type RecTile = {
  icon: string;
  title: string;
  reason: string;
};

const CONTENT_RECS: RecTile[] = [
  { icon: "⚔️", title: "Hoàng Phi Hồng", reason: "Cùng thể loại: kiếm hiệp" },
  { icon: "🗡️", title: "Thiên Long Bát Bộ", reason: "Cùng đạo diễn · kiếm hiệp" },
  { icon: "🏯", title: "Tây Du Ký 2023", reason: "Phim cổ trang Trung Quốc" },
  { icon: "⚔️", title: "Anh Hùng 2", reason: "Diễn viên chính giống phần 1" },
];

const COLLAB_RECS: RecTile[] = [
  { icon: "🎭", title: "Nhà Bà Nữ", reason: "8/10 người giống bạn đều thích" },
  { icon: "💐", title: "Mắt Biếc", reason: "Cùng nhóm “fan cuồng phim Việt”" },
  { icon: "🌊", title: "Đất Rừng Phương Nam", reason: "Top phim nhóm bạn đã xem" },
  { icon: "💥", title: "Lật Mặt 7", reason: "Người có gu giống bạn đều 5★" },
];

function RecCard({ tile }: { tile: RecTile }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-lg border border-border bg-card p-3"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent-light text-xl">
          {tile.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{tile.title}</p>
          <p className="text-xs text-muted leading-relaxed">{tile.reason}</p>
        </div>
      </div>
    </motion.div>
  );
}

function ContentVsCollab() {
  return (
    <ToggleCompare
      labelA="Gợi ý theo đặc tính phim"
      labelB="Gợi ý theo người giống bạn"
      description='Cùng một Chị An vừa xem xong "Anh Hùng Xạ Điêu". Netflix có hai cách để chọn phim tiếp theo.'
      childA={
        <div className="space-y-3">
          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 p-3 text-xs text-foreground leading-relaxed">
            <strong className="text-amber-700 dark:text-amber-400">
              Content-based (lọc theo nội dung):
            </strong>{" "}
            hệ thống nhìn vào <em>đặc tính</em> của phim chị An vừa xem — thể loại,
            đạo diễn, diễn viên, thời đại — rồi tìm phim khác có đặc tính tương
            tự. Không cần biết ai khác nghĩ gì.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CONTENT_RECS.map((t) => (
              <RecCard key={t.title} tile={t} />
            ))}
          </div>
          <div className="rounded-md bg-surface p-2 text-xs text-muted">
            <strong className="text-foreground">Ưu:</strong> phim mới đăng hôm qua
            cũng gợi ý được, chỉ cần có metadata. ·{" "}
            <strong className="text-foreground">Nhược:</strong> dễ lặp lại kiểu phim
            cũ, khó bất ngờ.
          </div>
        </div>
      }
      childB={
        <div className="space-y-3">
          <div className="rounded-lg bg-sky-50 dark:bg-sky-900/20 border border-sky-200/60 p-3 text-xs text-foreground leading-relaxed">
            <strong className="text-sky-700 dark:text-sky-400">
              Collaborative (lọc cộng tác):
            </strong>{" "}
            hệ thống tìm những người <em>có gu xem gần giống</em> chị An, rồi
            xem nhóm đó <em>đã thích thêm phim gì khác</em>. Không cần biết phim
            nào thể loại gì.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {COLLAB_RECS.map((t) => (
              <RecCard key={t.title} tile={t} />
            ))}
          </div>
          <div className="rounded-md bg-surface p-2 text-xs text-muted">
            <strong className="text-foreground">Ưu:</strong> phát hiện sở thích ẩn —
            fan kiếm hiệp có thể cũng thích Mắt Biếc mà chính họ chưa biết. ·{" "}
            <strong className="text-foreground">Nhược:</strong> phim mới chưa ai xem
            → không xuất hiện.
          </div>
        </div>
      }
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DEMO 3 — COLD START PROBLEM
   User vừa tạo tài khoản, chưa có lịch sử. Người học bật từng cách khắc phục
   để thấy bảng gợi ý thay đổi.
   ═══════════════════════════════════════════════════════════════════════════ */

type ColdMode = "none" | "popular" | "survey" | "implicit";

const COLD_MODES: Array<{
  id: ColdMode;
  label: string;
  icon: typeof Flame;
  description: string;
  color: string;
  quality: number; // 0..100 "độ khớp sở thích"
  tiles: RecTile[];
}> = [
  {
    id: "none",
    label: "Không làm gì",
    icon: HelpCircle,
    description:
      "Tài khoản mới, chưa có hành vi nào. Hệ thống không biết chị An thích gì → trang chủ rỗng hoặc ngẫu nhiên.",
    color: "#94a3b8",
    quality: 10,
    tiles: [
      { icon: "❓", title: "Sản phẩm ngẫu nhiên 1", reason: "Chọn bất kỳ" },
      { icon: "❓", title: "Sản phẩm ngẫu nhiên 2", reason: "Chọn bất kỳ" },
      { icon: "❓", title: "Sản phẩm ngẫu nhiên 3", reason: "Chọn bất kỳ" },
      { icon: "❓", title: "Sản phẩm ngẫu nhiên 4", reason: "Chọn bất kỳ" },
    ],
  },
  {
    id: "popular",
    label: "Gợi ý hàng hot",
    icon: Flame,
    description:
      'Tạm lấy danh sách "đang hot trong 24h". Ai cũng thấy một trang chủ giống nhau — nhưng ít ra đỡ nhạt hơn ngẫu nhiên.',
    color: "#f97316",
    quality: 45,
    tiles: [
      { icon: "📱", title: "iPhone 15", reason: "#1 bán chạy hôm nay" },
      { icon: "👟", title: "Giày Nike Pegasus", reason: "Top thể thao" },
      { icon: "💄", title: "Son MAC Ruby Woo", reason: "Top mỹ phẩm" },
      { icon: "🎧", title: "Tai nghe AirPods Pro", reason: "Top phụ kiện" },
    ],
  },
  {
    id: "survey",
    label: "Hỏi nhanh sở thích",
    icon: UserPlus,
    description:
      'Khi mới đăng ký, app hỏi 3-5 câu: "bạn thích thể loại nào?", "bạn mua hàng cho ai?". Dữ liệu ít, nhưng đủ để khởi động.',
    color: "#10b981",
    quality: 70,
    tiles: [
      { icon: "👩", title: "Đầm maxi cho nữ công sở", reason: "Chị chọn “Thời trang nữ”" },
      { icon: "💐", title: "Nước hoa Chanel No.5", reason: "Chị chọn “Mỹ phẩm”" },
      { icon: "👠", title: "Giày cao gót đế vuông", reason: "Phụ kiện cho thời trang nữ" },
      { icon: "👜", title: "Túi tote da bò", reason: "Khớp phong cách công sở" },
    ],
  },
  {
    id: "implicit",
    label: "Quan sát 10 phút đầu",
    icon: MousePointerClick,
    description:
      "Thay vì hỏi, hệ thống lẳng lặng ghi lại: chị dừng lâu ở đầm nào, bấm vào sản phẩm nào, cuộn qua phần nào. Sau 10 phút đã có khá đủ dữ liệu.",
    color: "#a855f7",
    quality: 88,
    tiles: [
      { icon: "👗", title: "Đầm maxi hoa nhí Zara", reason: "Chị dừng 38 giây" },
      { icon: "👜", title: "Túi Charles & Keith", reason: "Chị bấm xem chi tiết" },
      { icon: "👠", title: "Giày slingback be", reason: "Thêm vào giỏ" },
      { icon: "💄", title: "Son Dior Rouge 999", reason: "Xem lại 3 lần" },
    ],
  },
];

function ColdStartExplorer() {
  const [mode, setMode] = useState<ColdMode>("none");
  const current = COLD_MODES.find((m) => m.id === mode)!;
  const reduceMotion = useReducedMotion();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {COLD_MODES.map((m) => {
          const active = m.id === mode;
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "bg-accent text-white"
                  : "bg-surface text-foreground hover:bg-surface-hover"
              }`}
            >
              <Icon size={14} />
              {m.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm text-foreground leading-relaxed mb-3">
          {current.description}
        </p>

        {/* Thanh chất lượng gợi ý */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-muted">Độ khớp với sở thích thật của chị An</span>
            <span className="font-semibold" style={{ color: current.color }}>
              {current.quality}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface overflow-hidden">
            <motion.div
              initial={reduceMotion ? false : { width: 0 }}
              animate={{ width: `${current.quality}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ backgroundColor: current.color }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <AnimatePresence mode="popLayout">
            {current.tiles.map((t, i) => (
              <motion.div
                key={`${mode}-${t.title}`}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
              >
                <RecCard tile={t} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   METRICS — thanh màu cho Precision@K, Recall@K, nDCG
   ═══════════════════════════════════════════════════════════════════════════ */

type MetricBar = {
  key: string;
  title: string;
  value: number; // 0..100
  color: string;
  plain: string;
  example: string;
};

const METRICS: MetricBar[] = [
  {
    key: "p10",
    title: "Precision@10",
    value: 74,
    color: "#10b981",
    plain: "Trong 10 gợi ý đầu, bao nhiêu là thật sự trúng?",
    example: "10 đầm gợi ý → chị An bấm vào 7 cái → 74%.",
  },
  {
    key: "r50",
    title: "Recall@50",
    value: 62,
    color: "#6366f1",
    plain: "Trong tất cả sản phẩm chị An sẽ thích, bao nhiêu % nằm trong top 50?",
    example: "Tổng chị sẽ thích 100 sản phẩm. Top 50 chứa 62 trong số đó.",
  },
  {
    key: "ndcg",
    title: "nDCG@10",
    value: 81,
    color: "#a855f7",
    plain: "Không chỉ trúng hay không — mà sản phẩm HAY có ở vị trí CAO không?",
    example: "Sản phẩm trúng nhất cần ở vị trí 1-3, không phải vị trí 9.",
  },
];

function MetricBars() {
  const reduceMotion = useReducedMotion();
  return (
    <div className="not-prose space-y-3">
      {METRICS.map((m, i) => (
        <motion.div
          key={m.key}
          initial={reduceMotion ? false : { opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "0px 0px -40px 0px" }}
          transition={{ duration: 0.35, delay: i * 0.1 }}
          className="rounded-lg border border-border bg-card p-3"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-semibold text-foreground">{m.title}</span>
            <span className="text-sm font-bold" style={{ color: m.color }}>
              {m.value}%
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-surface overflow-hidden mb-2">
            <motion.div
              initial={reduceMotion ? false : { width: 0 }}
              whileInView={{ width: `${m.value}%` }}
              viewport={{ once: true, margin: "0px 0px -40px 0px" }}
              transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ backgroundColor: m.color }}
            />
          </div>
          <p className="text-xs text-foreground mb-0.5">{m.plain}</p>
          <p className="text-[11px] text-muted italic">{m.example}</p>
        </motion.div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   VIETNAMESE PLATFORMS
   ═══════════════════════════════════════════════════════════════════════════ */

const VN_PLATFORMS = [
  {
    name: "Shopee",
    icon: ShoppingBag,
    color: "#ee4d2d",
    role: "Trang “Gợi ý hôm nay” — gần như toàn bộ cá nhân hóa. Dùng cả lọc cộng tác, lọc nội dung, lẫn học máy từ hành vi scroll.",
  },
  {
    name: "Tiki",
    icon: Package,
    color: "#1a94ff",
    role: "Banner “Dành riêng cho bạn” trên trang chủ. Thế mạnh là dữ liệu mua hàng sách, điện tử tích lũy nhiều năm.",
  },
  {
    name: "Lazada",
    icon: Store,
    color: "#f9598f",
    role: "Tab “Khám phá” gợi ý theo sở thích. LazAI (hệ thống AI riêng) phối hợp với Alibaba Cloud để tinh chỉnh cho thị trường Đông Nam Á.",
  },
  {
    name: "Zing MP3",
    icon: Music2,
    color: "#7c3aed",
    role: "Playlist “Gợi ý cho bạn” và radio tự tạo. Nguyên lý giống Spotify: kết hợp lịch sử nghe + đặc trưng bài hát.",
  },
  {
    name: "FPT Play",
    icon: Tv,
    color: "#f97316",
    role: "Trang chủ tùy biến theo vùng miền, thời gian xem, loại thiết bị. Quan trọng với nội dung thể thao và phim bản quyền.",
  },
];

function VietnamesePlatformGrid() {
  return (
    <div className="not-prose grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {VN_PLATFORMS.map((p, i) => {
        const Icon = p.icon;
        return (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -40px 0px" }}
            transition={{ duration: 0.25, delay: i * 0.07 }}
            className="rounded-lg border border-border bg-card p-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-md"
                style={{ backgroundColor: `${p.color}22`, color: p.color }}
              >
                <Icon size={15} />
              </div>
              <span className="text-sm font-semibold text-foreground">{p.name}</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">{p.role}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TOPIC COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export default function RecommendationSystemsTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          'Trong gợi ý kiểu "lọc cộng tác", hệ thống thật sự dựa vào điều gì để đoán bạn sẽ thích sản phẩm chưa xem?',
        options: [
          "Đọc mô tả sản phẩm rồi phân tích từng chữ.",
          "Tìm những người dùng có lịch sử xem/mua gần giống bạn, rồi xem nhóm đó còn thích thêm gì.",
          "Xếp ngẫu nhiên để bạn lướt cho vui.",
        ],
        correct: 1,
        explanation:
          "Collaborative filtering (lọc cộng tác) hoàn toàn không nhìn vào nội dung sản phẩm. Nó chỉ nhìn vào hành vi — ai đã mua / xem / rate cái gì — rồi tìm người tương tự bạn. Giống anh bán tạp hóa biết nhóm khách hay mua phở thì chiều nào cũng ghé mua trứng vịt lộn, không cần biết món đó tên gì.",
      },
      {
        question: "Vấn đề cold start (khởi đầu lạnh) xảy ra khi nào?",
        options: [
          "Server của Shopee bị treo.",
          "Người dùng vừa đăng ký hoặc sản phẩm vừa đăng — chưa có lịch sử tương tác nào nên lọc cộng tác không hoạt động.",
          "App chạy chậm khi mới mở.",
        ],
        correct: 1,
        explanation:
          "Cold start đúng nghĩa là: hệ thống chưa có tín hiệu về người dùng mới hoặc sản phẩm mới. Hai nhóm cách xử lý phổ biến: (1) hỏi nhanh vài câu khi đăng ký, (2) gợi ý sản phẩm đang hot, (3) âm thầm quan sát hành vi lướt trong vài phút đầu, (4) dùng lọc theo nội dung để khai thác metadata của sản phẩm mới.",
      },
      {
        question:
          'Vì sao Shopee, Tiki, Lazada đều kết hợp nhiều phương pháp thay vì chỉ dùng một công thức duy nhất?',
        options: [
          "Để quảng cáo nghe kêu hơn.",
          "Mỗi phương pháp có điểm mù riêng — kết hợp giúp bù lẫn nhau: lọc cộng tác cho khách quen, lọc nội dung cho sản phẩm mới, học máy cho gu tinh tế.",
          "Vì dữ liệu nhiều quá không biết dùng gì.",
        ],
        correct: 1,
        explanation:
          "Lọc cộng tác chính xác cho khách đã quen nhưng bất lực với người mới. Lọc nội dung xử lý được sản phẩm mới nhưng thiếu sáng tạo. Deep learning học được các tín hiệu ngầm (thời gian nhìn, scroll, thêm-bỏ giỏ hàng). Hybrid là lựa chọn mặc định của gần như mọi sàn thương mại điện tử trên thế giới.",
      },
      {
        type: "fill-blank",
        question:
          "Hai phương pháp kinh điển của hệ thống gợi ý là lọc {blank} (dựa trên những người dùng giống bạn) và lọc {blank} (dựa trên đặc tính của chính sản phẩm).",
        blanks: [
          {
            answer: "cộng tác",
            accept: ["cong tac", "collaborative", "cộng-tác", "collaborative filtering"],
          },
          {
            answer: "nội dung",
            accept: ["noi dung", "content", "nội-dung", "content-based"],
          },
        ],
        explanation:
          'Hai trụ cột: lọc cộng tác (collaborative filtering) — tìm người tương tự bạn rồi xem họ thích thêm gì; lọc nội dung (content-based filtering) — dựa trên đặc điểm sản phẩm (thể loại, thương hiệu, mô tả). Đa số sàn lớn dùng hybrid: trộn hai hướng lại.',
      },
      {
        question:
          'Trong ba chỉ số Precision@10, Recall@50 và nDCG@10, chỉ số nào đo "sản phẩm hay có ở vị trí cao không"?',
        options: [
          "Precision@10 — chỉ đo số lượng trúng, không quan tâm thứ tự.",
          "Recall@50 — đo độ bao phủ, cũng không quan tâm thứ tự.",
          "nDCG@10 — sản phẩm trúng ở vị trí 1 được thưởng nhiều hơn ở vị trí 9.",
        ],
        correct: 2,
        explanation:
          "nDCG cộng thêm trọng số theo vị trí: trúng ở đầu danh sách được tính nặng hơn. Đó là lý do các đội sản phẩm thường để ý nDCG hơn là Precision thuần — vì thực tế người dùng chỉ nhìn 5-10 gợi ý đầu.",
      },
      {
        question: "Filter bubble (buồng lọc) là tác dụng phụ gì của cá nhân hóa?",
        options: [
          "Server bị tắc nghẽn.",
          "Người dùng bị mắc kẹt trong vòng lặp: chỉ thấy thứ giống mình đã thích → chỉ bấm thứ đó → hệ thống lại gợi ý tiếp → góc nhìn hẹp dần.",
          "App bị đầy bộ nhớ.",
        ],
        correct: 1,
        explanation:
          "Filter bubble là cái giá của cá nhân hóa cực đoan. Giải pháp kinh điển: chừa 5-15% gợi ý cho thứ “lạ” — item ngoài gu hiện tại — để hệ thống vừa chiều bạn vừa giúp bạn mở rộng sở thích. Nhiều sàn gọi là exploration (thăm dò).",
      },
      {
        question:
          "Shopee có khoảng 200 triệu khách và hàng trăm triệu sản phẩm. Nếu vẽ thành bảng “khách × sản phẩm” thì bảng này có đặc điểm gì?",
        options: [
          "Nhỏ, dễ xử lý thủ công.",
          "Cực lớn nhưng phần lớn ô trống — mỗi khách chỉ tương tác vài trăm sản phẩm trong hàng trăm triệu.",
          "Không lưu được vào máy tính.",
        ],
        correct: 1,
        explanation:
          "Bảng cực “thưa” (sparse): hơn 99.99% ô trống. Đó là lý do không ai score tất cả — thay vào đó hệ thống chia pipeline: sàng lọc nhanh vài nghìn ứng viên, rồi mới xếp hạng cẩn thận top 50-100. Gần như mọi recommender thực tế đều đi theo kiến trúc 2-3 tầng này.",
      },
      {
        question:
          "Netflix từng dùng thang 5 sao. Sau 2017 họ chuyển sang thích / không thích. Vì sao đây là quyết định đúng cho hệ thống gợi ý?",
        options: [
          "Tiết kiệm dung lượng lưu trữ.",
          "Người dùng cho 5 sao phim nghệ thuật họ nghĩ mình “nên thích”, rồi thực tế vẫn bấm xem hài nhẹ. Phản hồi ngầm (thích / bỏ giữa chừng) khớp với hành vi thật hơn.",
          "Vì thang 5 sao vi phạm pháp luật.",
        ],
        correct: 1,
        explanation:
          "Đây là bài học kinh điển: tín hiệu bạn thu không nhất thiết khớp với mục tiêu kinh doanh. 5 sao đo “gu lý tưởng”, thumbs up/down + thời gian xem đo “thứ họ thật sự sẽ xem”. Với Netflix, mục tiêu là giữ người ở lại — nên tín hiệu thứ hai quan trọng hơn.",
      },
    ],
    []
  );

  return (
    <>
      {/* ═════════════ BƯỚC 1 — DỰ ĐOÁN ═════════════ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question='Bạn vừa xem xong 1 phim kiếm hiệp trên Netflix. Lần sau mở app, Netflix sẽ gợi ý kiểu nào?'
          options={[
            "5 phim kiếm hiệp na ná nhau — vì bạn vừa xem kiếm hiệp.",
            "5 phim hành động tổng hợp (bom tấn, đua xe, chiến tranh).",
            "3 phim kiếm hiệp + 2 phim hài gia đình — vì nhóm người cùng xem kiếm hiệp cũng hay xem hai thứ đó.",
            "Phim ngẫu nhiên từ kho — cho bạn khám phá.",
          ]}
          correct={2}
          explanation="Netflix thật sự ghi nhận: những ai thích một loại phim hiếm khi chỉ thích loại đó. Họ có xu hướng xen kẽ. Hệ thống sẽ kết hợp &quot;đặc tính phim bạn vừa xem&quot; (kiếm hiệp) với &quot;nhóm người xem phim kiếm hiệp còn thích gì khác&quot; (hài gia đình, lãng mạn cổ trang). Kết quả 3 + 2 trộn nhau là kiểu hybrid điển hình — vừa giữ gu, vừa tránh buồng lọc."
        >
          {/* ═════════════ BƯỚC 2 — ẨN DỤ ═════════════ */}
          <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Ẩn dụ">
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Store className="h-5 w-5 text-accent" />
                <h3 className="text-base font-semibold text-foreground">
                  Anh bán tạp hóa đầu hẻm
                </h3>
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                Anh bán tạp hóa lâu năm không cần thuật toán. Anh{" "}
                <strong>nhớ</strong> chị bán bún sáng nào cũng mua 3 quả trứng
                vịt lộn. Anh <strong>đoán</strong> chị khó ngủ có thể cần thêm
                lọ mật ong — vì dì Năm hàng xóm có thói quen gần giống cũng mua
                mật ong. Và khi có hàng mới, anh <strong>gợi ý</strong> đúng
                người hợp gu chứ không tiếp thị tràn lan.
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                Shopee với 200 triệu khách không thể thuê 200 triệu anh bán tạp
                hóa. Nhưng có thể dựng một <strong>hệ thống gợi ý</strong> làm
                đúng ba việc trên: <em>nhớ lịch sử</em>, <em>đoán sở thích ẩn</em>, và{" "}
                <em>gợi ý đúng người</em>. Bài này vẽ ra ruột gan của cỗ máy đó.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                {[
                  { icon: Users, label: "Ai đã làm gì", color: "#10b981" },
                  { icon: Sparkles, label: "Đoán sở thích ẩn", color: "#6366f1" },
                  { icon: Star, label: "Gợi ý đúng lúc", color: "#f59e0b" },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <div
                      key={s.label}
                      className="flex items-center gap-2 rounded-md bg-surface p-2.5"
                    >
                      <Icon size={16} style={{ color: s.color }} />
                      <span className="text-xs font-medium text-foreground">
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </LessonSection>

          {/* ═════════════ BƯỚC 3 — KHÁM PHÁ ═════════════ */}
          <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khám phá">
            <VisualizationSection topicSlug="recommendation-systems">
              <div className="space-y-8">
                {/* Demo 1 */}
                <div>
                  <div className="mb-3 flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-light">
                      <Film size={16} className="text-accent" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">
                        Demo 1 — Máy đoán sao
                      </h3>
                      <p className="text-xs text-muted">
                        Bạn chấm sao vài phim, hệ thống đoán phim còn lại bằng cách nhìn &quot;người giống bạn&quot;.
                      </p>
                    </div>
                  </div>
                  <CFSimulator />
                </div>

                <div className="border-t border-border pt-8">
                  <div className="mb-3 flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-light">
                      <Sparkles size={16} className="text-accent" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">
                        Demo 2 — Hai kiểu gợi ý, hai kiểu kết quả
                      </h3>
                      <p className="text-xs text-muted">
                        Cùng một người vừa xem &quot;Anh Hùng Xạ Điêu&quot;. Bấm để đổi giữa hai cách nhìn.
                      </p>
                    </div>
                  </div>
                  <ContentVsCollab />
                </div>

                <div className="border-t border-border pt-8">
                  <div className="mb-3 flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-light">
                      <UserPlus size={16} className="text-accent" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">
                        Demo 3 — Khởi đầu lạnh (cold start)
                      </h3>
                      <p className="text-xs text-muted">
                        Chị An mới đăng ký Shopee, chưa mua gì. App sẽ làm gì trong 10 phút đầu?
                      </p>
                    </div>
                  </div>
                  <ColdStartExplorer />
                </div>
              </div>
            </VisualizationSection>

            <Callout variant="tip" title="Cách đọc ba demo này">
              Demo 1 cho thấy công thức: <em>tìm người giống bạn → lấy rating của họ → trung bình có trọng số</em>. Demo 2 so sánh hai họ công thức khác nhau để thấy chúng &quot;nhìn thế giới&quot; khác nhau thế nào. Demo 3 cho thấy khi dữ liệu chưa đủ, mọi công thức đều bất lực — và đó là lý do app cần bước khởi đầu khéo léo.
            </Callout>
          </LessonSection>

          {/* ═════════════ BƯỚC 4 — AHA ═════════════ */}
          <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
            <AhaMoment>
              <p className="text-center">
                <strong>Chất lượng gợi ý tỷ lệ thuận với lượng hành vi quan sát được.</strong>
              </p>
              <p className="text-center mt-2">
                Càng nhiều người dùng → có nhiều &quot;hàng xóm&quot; để so sánh.
                Càng nhiều tương tác trên mỗi người → biết rõ gu hơn. Đó là lý do Shopee, Tiki, Netflix khó bị đánh bại — không phải vì họ có thuật toán bí mật, mà vì họ có kho hành vi của hàng trăm triệu người mà startup mới không sao bắt chước.
              </p>
            </AhaMoment>
          </LessonSection>

          {/* ═════════════ BƯỚC 5 — THỬ THÁCH ═════════════ */}
          <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
            <InlineChallenge
              question="Sàn A có 1 triệu khách, sàn B có 100 triệu khách. Giả sử cả hai dùng cùng một thuật toán lọc cộng tác. Sàn nào có gợi ý “ngửi” đúng gu tốt hơn?"
              options={[
                "Sàn A — vì ít khách nên dễ quản lý.",
                "Hai sàn như nhau — cùng thuật toán mà.",
                "Sàn B — nhiều khách hơn → mỗi người đều có rất nhiều “người giống mình” để so sánh, giảm sai lệch.",
              ]}
              correct={2}
              explanation="Lọc cộng tác dựa vào mật độ hành vi. Nếu cả sàn chỉ có 1000 khách thích đầm maxi, tìm hàng xóm rất khó. Với 100 triệu khách, bất cứ gu hẹp nào cũng có vài nghìn người tương tự. Đó là “lợi thế dữ liệu” — lý do các sàn lớn ngày càng lớn, còn sàn nhỏ ngày càng khó đuổi kịp."
            />

            <InlineChallenge
              question="TikTok “bắt bài” bạn sau 30-40 video dù bạn chưa like cái nào. Tín hiệu nào giúp nó làm được?"
              options={[
                "Bạn điền form sở thích lúc đăng ký.",
                "TikTok gắn GPS theo bạn.",
                "Phản hồi ngầm: thời gian xem hết hay lướt bỏ sớm, có xem lại không, có share không, có vuốt chậm lại ở đoạn nào. Những tín hiệu này “thật” hơn cả nút like.",
              ]}
              correct={2}
              explanation="TikTok nổi tiếng vì khai thác implicit feedback — phản hồi ngầm. Bạn không cần bấm gì, thời lượng xem đã đủ kể. Nếu bạn dừng lại lâu ở một video mèo, hệ thống ghi nhận; nếu bạn lướt qua 3 video nấu ăn liền không dừng, hệ thống cũng ghi nhận. Với vài chục video, hệ thống có hàng trăm tín hiệu — đủ để “hiểu bạn hơn chính bạn”."
            />

            <InlineChallenge
              question="Bạn làm marketing ở Tiki và nhận task: “tăng tỷ lệ khách mới quay lại mua lần 2 trong 30 ngày”. Đội recommender nên ưu tiên cải thiện gì?"
              options={[
                "Tăng số sản phẩm trên trang chủ lên 50, khách sẽ có nhiều lựa chọn hơn.",
                "Giải bài toán cold start tốt hơn — vì khách mới chính là nhóm chưa có lịch sử, dễ hụt gợi ý nên cảm thấy “không có gì để mua” rồi bỏ đi.",
                "Xóa bớt đánh giá cũ.",
              ]}
              correct={1}
              explanation="Khách quay lại phụ thuộc trải nghiệm lần đầu. Nếu lần đầu mở Tiki thấy trang chủ toàn thứ không liên quan, xác suất quay lại rớt mạnh. Các sàn lớn thường có một đội chỉ chuyên xử lý 7-14 ngày đầu của khách mới: onboarding khéo, quan sát ngầm, xếp hạng an toàn nhưng cá nhân."
            />
          </LessonSection>

          {/* ═════════════ BƯỚC 6 — GIẢI THÍCH ═════════════ */}
          <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích">
            <ExplanationSection topicSlug="recommendation-systems">
              <p>
                Bên dưới trang chủ Shopee của bạn là một pipeline gồm nhiều lớp. Dân làm sản phẩm hay gọi nôm na là <em>retrieval → ranking → re-ranking</em>: chọn ứng viên → xếp hạng cẩn thận → chỉnh cho đẹp. Mỗi lớp dùng một kỹ thuật. Ba họ kỹ thuật quan trọng nhất đều đã xuất hiện trong ba demo phía trên.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 not-prose">
                <Callout variant="tip" title="Lọc cộng tác">
                  <p className="text-sm leading-relaxed">
                    Không đọc mô tả sản phẩm. Chỉ nhìn <strong>ma trận khách × sản phẩm</strong> — ai đã mua/xem/rate cái gì. Tìm khách có hành vi giống bạn. Mạnh ở <em>gu tinh tế</em>, yếu ở <em>khách mới / sản phẩm mới</em>.
                  </p>
                </Callout>
                <Callout variant="info" title="Lọc nội dung">
                  <p className="text-sm leading-relaxed">
                    Đọc <strong>đặc tính sản phẩm</strong> — thể loại, thương hiệu, mô tả, ảnh, tag. Gợi ý thứ có đặc tính giống thứ bạn từng thích. Mạnh với <em>sản phẩm mới</em> (chỉ cần metadata), yếu ở <em>phát hiện sở thích lạ</em>.
                  </p>
                </Callout>
                <Callout variant="insight" title="Hybrid &amp; học máy">
                  <p className="text-sm leading-relaxed">
                    Đa số sàn trộn cả hai, cộng thêm <strong>học máy từ hành vi ngầm</strong> — thời gian xem, scroll, thêm giỏ rồi bỏ. Công thức thay đổi theo ngữ cảnh: khách mới → nội dung, khách cũ → cộng tác.
                  </p>
                </Callout>
              </div>

              <p className="mt-5">
                Một hệ thống gợi ý chạy trên hàng trăm triệu sản phẩm không thể so sánh từng cặp một. Nó làm ba lớp:
              </p>

              <div className="not-prose space-y-2 my-4">
                {[
                  {
                    step: 1,
                    title: "Chọn ứng viên (retrieval)",
                    body: "Từ hàng trăm triệu sản phẩm, chọn nhanh ~1000 ứng viên hợp gu nhất. Ở đây tốc độ quan trọng hơn độ chính xác tuyệt đối.",
                    color: "#10b981",
                  },
                  {
                    step: 2,
                    title: "Xếp hạng (ranking)",
                    body: "Dùng mô hình “nặng” hơn để xếp 1000 ứng viên theo xác suất bạn sẽ bấm / mua / xem hết.",
                    color: "#6366f1",
                  },
                  {
                    step: 3,
                    title: "Chỉnh trang (re-ranking)",
                    body: "Đảm bảo đa dạng (không 10 sản phẩm cùng hãng), chèn quảng cáo, tránh lặp, kiểm duyệt nội dung — trước khi trả về màn hình.",
                    color: "#a855f7",
                  },
                ].map((s) => (
                  <div
                    key={s.step}
                    className="flex gap-3 rounded-lg border border-border bg-card p-3"
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: s.color }}
                    >
                      {s.step}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-0.5">
                        {s.title}
                      </p>
                      <p className="text-xs text-muted leading-relaxed">
                        {s.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="text-lg font-semibold text-foreground mt-6 mb-3 flex items-center gap-2">
                <TrendingUp size={18} className="text-accent" />
                Đo &quot;gợi ý tốt&quot; thế nào?
              </h3>
              <p>
                Ba chỉ số sau là ngôn ngữ chung của đội recommender. Giữa các đội marketing, product và AI, nếu bạn hiểu ba cái này là đủ để ngồi họp không bị &quot;rớt đài&quot;:
              </p>
              <MetricBars />

              <Callout variant="warning" title="Ba cạm bẫy kinh điển">
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li>
                    <strong>Cold start (khởi đầu lạnh):</strong> khách mới hoặc sản phẩm mới chưa có lịch sử → lọc cộng tác đứng hình. Cách xử: hỏi onboarding, quan sát ngầm, hoặc lùi về gợi ý theo nội dung / sản phẩm hot.
                  </li>
                  <li>
                    <strong>Popularity bias (thiên kiến hàng hot):</strong> hệ thống cứ đẩy sản phẩm top → khách bấm càng nhiều → sản phẩm top lại càng top. Các sản phẩm dài đuôi (long-tail) bị nhấn chìm, gây bất lợi cho người bán nhỏ.
                  </li>
                  <li>
                    <strong>Filter bubble (buồng lọc):</strong> cá nhân hóa cực đoan làm góc nhìn hẹp dần. Giải pháp: chừa 5-15% gợi ý cho thứ &quot;lạ&quot; — explore vs exploit — để phát hiện sở thích mới.
                  </li>
                </ul>
              </Callout>

              <h3 className="text-lg font-semibold text-foreground mt-6 mb-3 flex items-center gap-2">
                <Store size={18} className="text-accent" />
                Ở Việt Nam, bạn dùng app nào là đang &quot;ăn&quot; recommender?
              </h3>
              <p>
                Gần như mọi app có scroll đều có. Dưới đây là những cái bạn lướt hằng ngày:
              </p>
              <VietnamesePlatformGrid />

              <Callout variant="insight" title="Điểm giao với embedding và semantic search">
                <p className="text-sm leading-relaxed">
                  Cỗ máy đằng sau lọc cộng tác hiện đại (kiểu Shopee, TikTok) thật ra dùng chung nền tảng với{" "}
                  <TopicLink slug="embedding-model">embedding</TopicLink> và{" "}
                  <TopicLink slug="semantic-search">semantic search</TopicLink>: chuyển người dùng và sản phẩm thành hai dãy số nhiều chiều, rồi đo &quot;gần nhau&quot; bằng phép tính đơn giản. Ai học qua cái này sẽ thấy ba bài toán tưởng khác nhau — gợi ý, tìm kiếm thông minh, tóm tắt tài liệu — hóa ra là anh em một nhà.
                </p>
              </Callout>

              <p className="mt-5">
                Một chi tiết thực tế cho dân văn phòng: nếu bạn làm marketing hoặc e-commerce ở Việt Nam, hiểu hệ thống gợi ý giúp bạn <strong>viết mô tả sản phẩm đúng trend</strong> (tăng cơ hội được lọc nội dung nhấc lên), <strong>tận dụng sản phẩm hot dịp lễ</strong> (bù cho khách mới), và <strong>đừng hoảng khi doanh số dao động 10-15%</strong> — đôi khi chỉ vì Shopee đổi trọng số giữa lọc cộng tác và lọc nội dung trong một thí nghiệm A/B.
              </p>
            </ExplanationSection>
          </LessonSection>

          {/* ═════════════ BƯỚC 7 — TÓM TẮT ═════════════ */}
          <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
            <MiniSummary
              title="Năm điều mang theo ra khỏi bài"
              points={[
                "Hệ thống gợi ý = anh bán tạp hóa phiên bản số: nhớ hành vi + đoán sở thích ẩn + đẩy đúng người, ở quy mô 200 triệu khách.",
                "Lọc cộng tác dựa vào người giống bạn; lọc nội dung dựa vào đặc tính sản phẩm; đa số sàn trộn cả hai.",
                "Cold start (khách / sản phẩm mới) là điểm mù lớn nhất — onboarding + sản phẩm hot + quan sát ngầm là ba cách xử kinh điển.",
                "Đo chất lượng bằng Precision, Recall, nDCG — trong đó nDCG nhạy với thứ tự (phim hay phải ở vị trí cao).",
                "Filter bubble là cái giá của cá nhân hóa cực đoan. Các đội recommender chừa 5-15% để explore thứ bạn chưa biết mình thích.",
              ]}
            />
          </LessonSection>

          {/* ═════════════ BƯỚC 8 — QUIZ ═════════════ */}
          <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
            <QuizSection questions={quizQuestions} />
          </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
